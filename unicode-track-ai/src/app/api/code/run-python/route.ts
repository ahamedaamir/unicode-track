import { NextRequest, NextResponse } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import os from "os";

const execFileAsync = promisify(execFile);

// Forbidden security tokens for Python execution sandbox
const FORBIDDEN_SECURITY_TOKENS = [
  "os.system",
  "subprocess.",
  "shutil.rmtree",
  "__import__('os')",
  '__import__("os")',
  "__import__('subprocess')",
  '__import__("subprocess")',
  "pty.spawn",
  "ctypes.",
  "socket.socket",
  "builtins.__import__",
];

/**
 * Checks if Python source contains forbidden dangerous calls
 */
function inspectSecurityTokens(sourceCode: string): string | null {
  for (const token of FORBIDDEN_SECURITY_TOKENS) {
    if (sourceCode.includes(token)) {
      return token;
    }
  }
  return null;
}

/**
 * Discovers available Python launcher or binary on host system
 */
async function getPythonCommand(): Promise<string | null> {
  // Test common Windows / POSIX binaries in priority order
  const candidates = process.platform === "win32" ? ["py", "python", "python3"] : ["python3", "python"];
  for (const cmd of candidates) {
    try {
      await execFileAsync(cmd, ["--version"], { timeout: 2000 });
      return cmd;
    } catch {
      // try next
    }
  }
  return null;
}

export async function POST(req: NextRequest) {
  let sandboxDir: string | null = null;

  try {
    const body = await req.json();
    const { sourceCode, stdin = "", filename = "main.py", files } = body;

    // Support both single file and multi-file submissions
    let fileList: Array<{ name: string; content: string }> = [];
    if (files && Array.isArray(files) && files.length > 0) {
      fileList = files.map((f: any) => ({
        name: typeof f.name === "string" ? f.name : "main.py",
        content: typeof f.content === "string" ? f.content : "",
      }));
    } else if (sourceCode && typeof sourceCode === "string") {
      fileList = [{ name: filename || "main.py", content: sourceCode }];
    } else {
      return NextResponse.json(
        { error: "Python source code or files are required for execution." },
        { status: 400 }
      );
    }

    const totalSize = fileList.reduce((acc, f) => acc + (f.content?.length || 0), 0);
    if (totalSize > 512 * 1024) {
      return NextResponse.json(
        { error: "Total Python source files size exceeds maximum evaluation sandbox limit (512 KB)." },
        { status: 400 }
      );
    }

    // 1. Static Security Inspection across all files
    for (const file of fileList) {
      const forbidden = inspectSecurityTokens(file.content);
      if (forbidden) {
        return NextResponse.json({
          success: false,
          status: "security_violation",
          compilationStatus: "Security Policy Blocked",
          error: `Security Sandbox Violation in '${file.name}': Restricted call '${forbidden}' is disabled in this execution environment.`,
          stdout: "",
          stderr: `Forbidden token: ${forbidden} in ${file.name}`,
          executionTimeSeconds: "0.000",
          exitCode: 1,
        });
      }
    }

    // 2. Discover Python Command
    const pythonCmd = await getPythonCommand();
    if (!pythonCmd) {
      return NextResponse.json({
        success: false,
        status: "unconfigured",
        compilationStatus: "Python Unavailable",
        error: "Python execution service is not configured. Please install Python 3 on the host.",
        stdout: "",
        stderr: "python: command not found in host PATH environment",
        executionTimeSeconds: "0.000",
        exitCode: 127,
      });
    }

    // 3. Create isolated random sandbox directory in os.tmpdir()
    sandboxDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "unicodetrack-python-sandbox-"));

    // Write all files into sandbox directory
    let entryFilename = "main.py";
    const pyFiles: string[] = [];

    for (const file of fileList) {
      const safeName = path.basename(file.name.trim()) || "main.py";
      const filePath = path.join(/* turbopackIgnore: true */ sandboxDir, safeName);
      await fs.promises.writeFile(filePath, file.content, "utf8");
      if (safeName.toLowerCase().endsWith(".py")) {
        pyFiles.push(safeName);
      }
    }

    if (pyFiles.length === 0) {
      return NextResponse.json({
        success: false,
        status: "compilation_error",
        compilationStatus: "No Python Source Files",
        error: "No .py source files found in workspace to execute.",
        stdout: "",
        stderr: "Error: No .py files provided.",
        executionTimeSeconds: "0.000",
        exitCode: 1,
      });
    }

    // Determine entry file: prefer main.py, or file with __name__ == "__main__", or first .py
    if (pyFiles.includes("main.py")) {
      entryFilename = "main.py";
    } else {
      const mainCandidate = fileList.find((f) => f.content.includes("__main__") && f.name.endsWith(".py"));
      entryFilename = mainCandidate ? path.basename(mainCandidate.name) : pyFiles[0];
    }

    const sourcePath = path.join(/* turbopackIgnore: true */ sandboxDir, entryFilename);

    // 4. Execution in Restricted Environment
    const startHr = process.hrtime.bigint();
    let stdout = "";
    let stderr = "";
    let exitCode = 0;

    try {
      const child = execFile(
        /* turbopackIgnore: true */
        pythonCmd,
        ["-u", sourcePath], // -u: unbuffered binary stdout and stderr
        {
          cwd: sandboxDir,
          timeout: 3000, // Strict 3 second timeout
          maxBuffer: 1024 * 512,
          windowsHide: true,
          env: {
            ...process.env,
            PYTHONDONTWRITEBYTECODE: "1",
            PYTHONUNBUFFERED: "1",
            TEMP: sandboxDir,
            TMP: sandboxDir,
          },
        },
        (error: any, out: string, err: string) => {
          stdout = out;
          stderr = err;
          if (error) {
            exitCode = error.code !== undefined ? (typeof error.code === "number" ? error.code : 1) : 1;
            if (error.killed) {
              stderr += "\n[TIMEOUT] Execution exceeded CPU time limit (3.0s). Process terminated.";
            }
          }
        }
      );

      if (stdin && child.stdin) {
        child.stdin.write(stdin);
        child.stdin.end();
      }

      await new Promise((resolve) => {
        child.on("close", resolve);
        child.on("error", resolve);
      });
    } catch (runErr: any) {
      stderr = runErr.message || "Runtime error occurred";
      exitCode = 1;
    }

    const endHr = process.hrtime.bigint();
    const durationSec = (Number(endHr - startHr) / 1e9).toFixed(3);

    return NextResponse.json({
      success: exitCode === 0,
      status: exitCode === 0 ? "success" : "runtime_error",
      compilationStatus: "Python 3 Interpreted Execution",
      stdout,
      stderr,
      executionTimeSeconds: durationSec,
      exitCode,
    });
  } catch (error: any) {
    console.error("Python execution API error:", error);
    return NextResponse.json(
      { error: error?.message || "Python execution sandbox error" },
      { status: 500 }
    );
  } finally {
    // 5. Cleanup temporary sandbox files unconditionally
    if (sandboxDir) {
      try {
        await fs.promises.rm(sandboxDir, { recursive: true, force: true });
      } catch (cleanupErr) {
        console.warn("Failed to clean up sandbox directory:", cleanupErr);
      }
    }
  }
}
