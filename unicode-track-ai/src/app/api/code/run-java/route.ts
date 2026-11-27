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
    const { sourceCode, stdin = "", files } = body;

    // Support both single file and multi-file submissions
    let fileList: Array<{ name: string; content: string }> = [];
    if (files && Array.isArray(files) && files.length > 0) {
      fileList = files.map((f: any) => ({
        name: typeof f.name === "string" ? f.name : "Main.java",
        content: typeof f.content === "string" ? f.content : "",
      }));
    } else if (sourceCode && typeof sourceCode === "string") {
      const cls = extractClassName(sourceCode);
      fileList = [{ name: `${cls}.java`, content: sourceCode }];
    } else {
      return NextResponse.json(
        { error: "Java source code or files are required for execution." },
        { status: 400 }
      );
    }

    const totalSize = fileList.reduce((acc, f) => acc + (f.content?.length || 0), 0);
    if (totalSize > 512 * 1024) {
      return NextResponse.json(
        { error: "Total Java source files size exceeds maximum evaluation sandbox limit (512 KB)." },
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

    // Find main class (file with 'public static void main' or 'Main')
    let mainClassName = "Main";
    for (const file of fileList) {
      if (file.content.includes("static void main") || file.content.includes("public static void main")) {
        mainClassName = extractClassName(file.content);
        break;
      }
    }

    // Write all .java files into sandbox directory
    const javaSourceFiles: string[] = [];
    for (const file of fileList) {
      const safeName = path.basename(file.name.trim()) || "Main.java";
      const filePath = path.join(/* turbopackIgnore: true */ sandboxDir, safeName);
      await fs.promises.writeFile(filePath, file.content, "utf8");
      if (safeName.toLowerCase().endsWith(".java")) {
        javaSourceFiles.push(safeName);
      }
    }

    if (javaSourceFiles.length === 0) {
      return NextResponse.json({
        success: false,
        status: "compilation_error",
        compilationStatus: "No Java Source Files",
        error: "No .java source files found in workspace to compile.",
        stdout: "",
        stderr: "Error: No .java files provided.",
        executionTimeSeconds: "0.000",
        exitCode: 1,
      });
    }

    // 4. Compilation with javac (compiles all .java files together)
    let compilationError = "";
    try {
      await execFileAsync(
        "javac",
        ["-encoding", "UTF-8", "-d", ".", ...javaSourceFiles],
        {
          cwd: sandboxDir,
          timeout: 8000, // 8s compile timeout for multi-file Java
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
        ["-Dfile.encoding=UTF-8", "-cp", ".", mainClassName],
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
