import { NextRequest, NextResponse } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import os from "os";

const execFileAsync = promisify(execFile);

// Forbidden security tokens for student C sandbox execution
const FORBIDDEN_SECURITY_TOKENS = [
  "system(",
  "fork(",
  "execvp(",
  "execl(",
  "execv(",
  "popen(",
  "remove(",
  "unlink(",
  "CreateProcess",
  "WinExec",
  "<windows.h>",
  "<sys/socket.h>",
  "<netdb.h>",
  "<arpa/inet.h>",
  "<sys/stat.h>",
];

/**
 * Checks if a C source file contains forbidden dangerous system calls
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
 * Checks if GCC is available on the hosting system
 */
async function checkGccAvailable(): Promise<boolean> {
  try {
    await execFileAsync("gcc", ["--version"], { timeout: 2000 });
    return true;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  let sandboxDir: string | null = null;

  try {
    const body = await req.json();
    const { sourceCode, stdin = "", filename = "main.c" } = body;

    if (!sourceCode || typeof sourceCode !== "string") {
      return NextResponse.json(
        { error: "C source code is required for execution." },
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
        error: `Security Sandbox Violation: Restricted system call or raw network header '${forbidden}' is disabled in this evaluation environment for academic integrity.`,
        stdout: "",
        stderr: `Forbidden token: ${forbidden}`,
        executionTimeSeconds: "0.000",
        exitCode: 1,
      });
    }

    // 2. Check GCC Availability
    const isGccAvailable = await checkGccAvailable();
    if (!isGccAvailable) {
      return NextResponse.json({
        success: false,
        status: "unconfigured",
        compilationStatus: "Compiler Unavailable",
        error: "C code execution service is not configured. Please install GCC or configure the isolated execution sandbox on this host.",
        stdout: "",
        stderr: "gcc: command not found in host PATH environment",
        executionTimeSeconds: "0.000",
        exitCode: 127,
      });
    }

    // 3. Create isolated random sandbox directory in os.tmpdir()
    sandboxDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "unicodetrack-c-sandbox-"));

    const sourcePath = path.join(/* turbopackIgnore: true */ sandboxDir, filename.endsWith(".c") ? filename : "main.c");
    const binaryName = process.platform === "win32" ? "program.exe" : "program.out";
    const binaryPath = path.join(/* turbopackIgnore: true */ sandboxDir, binaryName);

    await fs.promises.writeFile(sourcePath, sourceCode, "utf8");

    // 4. Compilation with GCC under isolated timeout
    let compilationError = "";
    try {
      await execFileAsync(
        "gcc",
        [
          "-O2",
          "-std=c11",
          "-Wall",
          "-Wextra",
          "-Wno-unused-parameter",
          "-o",
          binaryPath,
          sourcePath,
        ],
        {
          cwd: sandboxDir,
          timeout: 5000, // 5s compile timeout
          maxBuffer: 1024 * 256,
        }
      );
    } catch (compileErr: any) {
      compilationError = compileErr.stderr || compileErr.stdout || compileErr.message;
      return NextResponse.json({
        success: false,
        status: "compilation_error",
        compilationStatus: "Compilation Failed",
        error: compilationError,
        stdout: "",
        stderr: compilationError,
        executionTimeSeconds: "0.000",
        exitCode: compileErr.code || 1,
      });
    }

    // 5. Execution in Restricted Environment
    const startHr = process.hrtime.bigint();
    let stdout = "";
    let stderr = "";
    let exitCode = 0;

    try {
      const child = execFile(
        binaryPath,
        [],
        {
          cwd: sandboxDir,
          timeout: 3000, // Strict 3 second execution timeout
          maxBuffer: 1024 * 512, // 512 KB stdout limit
          windowsHide: true,
          env: {
            ...process.env,
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
      compilationStatus: "Compilation Successful (0 errors, 0 warnings)",
      stdout,
      stderr,
      executionTimeSeconds: durationSec,
      exitCode,
    });
  } catch (error: any) {
    console.error("C sandbox execution API error:", error);
    return NextResponse.json(
      { error: error?.message || "Execution sandbox error" },
      { status: 500 }
    );
  } finally {
    // 6. Cleanup temporary sandbox files unconditionally
    if (sandboxDir) {
      try {
        await fs.promises.rm(sandboxDir, { recursive: true, force: true });
      } catch (cleanupErr) {
        console.warn("Failed to clean up sandbox directory:", cleanupErr);
      }
    }
  }
}
