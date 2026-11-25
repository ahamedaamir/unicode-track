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
    const { sourceCode, stdin = "", filename = "main.py" } = body;

    if (!sourceCode || typeof sourceCode !== "string") {
      return NextResponse.json(
        { error: "Python source code is required for execution." },
        { status: 400 }
      );
    }

    if (sourceCode.length > 256 * 1024) {
      return NextResponse.json(
        { error: "Source code size exceeds maximum evaluation sandbox limit (256 KB)." },
        { status: 400 }
      );
    }

    // 1. Static Security Inspection
    const forbidden = inspectSecurityTokens(sourceCode);
    if (forbidden) {
      return NextResponse.json({
        success: false,
        status: "security_violation",
        compilationStatus: "Security Policy Blocked",
        error: `Security Sandbox Violation: Restricted call '${forbidden}' is disabled in this execution environment for platform integrity.`,
        stdout: "",
        stderr: `Forbidden token: ${forbidden}`,
        executionTimeSeconds: "0.000",
        exitCode: 1,
      });
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

    const safeFilename = filename.endsWith(".py") ? filename : "main.py";
    const sourcePath = path.join(/* turbopackIgnore: true */ sandboxDir, safeFilename);

    await fs.promises.writeFile(sourcePath, sourceCode, "utf8");

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
