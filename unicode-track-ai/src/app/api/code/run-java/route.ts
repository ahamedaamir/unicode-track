import { NextRequest, NextResponse } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import os from "os";

const execFileAsync = promisify(execFile);

// Forbidden security tokens for Java execution sandbox
const FORBIDDEN_SECURITY_TOKENS = [
  "ProcessBuilder",
  "Runtime.getRuntime()",
  "System.loadLibrary",
  "System.load(",
  "java.lang.reflect",
  "sun.misc.Unsafe",
];

/**
 * Checks if Java source contains forbidden dangerous calls
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
 * Extracts public class name from Java source code, defaulting to 'Main'
 */
function extractClassName(sourceCode: string): string {
  const match = sourceCode.match(/public\s+class\s+([A-Za-z0-9_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  const classMatch = sourceCode.match(/class\s+([A-Za-z0-9_]+)/);
  if (classMatch && classMatch[1]) {
    return classMatch[1];
  }
  return "Main";
}

/**
 * Checks if javac and java are available on the hosting system
 */
async function checkJavaAvailable(): Promise<boolean> {
  try {
    await execFileAsync("javac", ["-version"], { timeout: 2000 });
    await execFileAsync("java", ["-version"], { timeout: 2000 });
    return true;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  let sandboxDir: string | null = null;

  try {
    const body = await req.json();
    const { sourceCode, stdin = "" } = body;

    if (!sourceCode || typeof sourceCode !== "string") {
      return NextResponse.json(
        { error: "Java source code is required for execution." },
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

    // 2. Check Java Availability
    const isJavaAvailable = await checkJavaAvailable();
    if (!isJavaAvailable) {
      return NextResponse.json({
        success: false,
        status: "unconfigured",
        compilationStatus: "Java Unavailable",
        error: "Java JDK execution service is not configured. Please ensure javac and java are in the host PATH.",
        stdout: "",
        stderr: "javac: command not found in host PATH environment",
        executionTimeSeconds: "0.000",
        exitCode: 127,
      });
    }

    // 3. Create isolated random sandbox directory in os.tmpdir()
    sandboxDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "unicodetrack-java-sandbox-"));

    const className = extractClassName(sourceCode);
    const sourcePath = path.join(/* turbopackIgnore: true */ sandboxDir, `${className}.java`);

    await fs.promises.writeFile(sourcePath, sourceCode, "utf8");

    // 4. Compilation with javac
    let compilationError = "";
    try {
      await execFileAsync(
        "javac",
        ["-encoding", "UTF-8", `${className}.java`],
        {
          cwd: sandboxDir,
          timeout: 6000, // 6s compile timeout
          maxBuffer: 1024 * 256,
        }
      );
    } catch (compileErr: any) {
      compilationError = compileErr.stderr || compileErr.stdout || compileErr.message;
      return NextResponse.json({
        success: false,
        status: "compilation_error",
        compilationStatus: "Java Compilation Failed",
        error: compilationError,
        stdout: "",
        stderr: compilationError,
        executionTimeSeconds: "0.000",
        exitCode: compileErr.code || 1,
      });
    }

    // 5. Execution with java runtime in Restricted Environment
    const startHr = process.hrtime.bigint();
    let stdout = "";
    let stderr = "";
    let exitCode = 0;

    try {
      const child = execFile(
        /* turbopackIgnore: true */
        "java",
        ["-Dfile.encoding=UTF-8", "-cp", ".", className],
        {
          cwd: sandboxDir,
          timeout: 3000, // Strict 3 second execution timeout
          maxBuffer: 1024 * 512,
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
      compilationStatus: "Java Bytecode Compilation & Execution Successful",
      stdout,
      stderr,
      executionTimeSeconds: durationSec,
      exitCode,
    });
  } catch (error: any) {
    console.error("Java sandbox execution API error:", error);
    return NextResponse.json(
      { error: error?.message || "Java execution sandbox error" },
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
