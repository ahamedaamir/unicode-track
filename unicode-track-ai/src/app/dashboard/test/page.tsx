"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import {
  Terminal,
  Play,
  RotateCcw,
  Trash2,
  Download,
  Clock,
  ChevronRight,
  Code2,
  CheckCircle2,
  Plus,
  X,
  FileCode,
  Layers,
  FilePlus2,
} from "lucide-react";

type LanguageKey = "c" | "python" | "java";

interface ExecutionResponse {
  success: boolean;
  status: "success" | "compilation_error" | "runtime_error" | "security_violation" | "unconfigured" | "error";
  compilationStatus?: string;
  stdout: string;
  stderr: string;
  executionTimeSeconds?: string;
  exitCode?: number;
  error?: string;
}

interface LanguageConfig {
  key: LanguageKey;
  name: string;
  runtimeLabel: string;
  version: string;
  filename: string;
  endpoint: string;
  commandSnippet: string;
  presets: Record<string, { name: string; code: string; defaultStdin?: string }>;
}

const LANGUAGES: Record<LanguageKey, LanguageConfig> = {
  c: {
    key: "c",
    name: "C Language",
    runtimeLabel: "C (C11 Standard)",
    version: "MinGW GCC 6.3",
    filename: "main.c",
    endpoint: "/api/code/run-c",
    commandSnippet: "gcc -O2 -std=c11 -Wall main.c -o program.exe && ./program.exe",
    presets: {
      hello: {
        name: "Hello World",
        code: `#include <stdio.h>

int main() {
    printf("Hello, World!\\n");
    return 0;
}`,
      },
      math: {
        name: "Math & Fibonacci Calculation",
        code: `#include <stdio.h>

long long fibonacci(int n) {
    if (n <= 0) return 0;
    if (n == 1) return 1;
    long long a = 0, b = 1, c;
    for (int i = 2; i <= n; i++) {
        c = a + b;
        a = b;
        b = c;
    }
    return b;
}

int main() {
    printf("--- Fibonacci Sequence (1 to 20) ---\\n");
    for (int i = 1; i <= 20; i++) {
        printf("F(%2d) = %lld\\n", i, fibonacci(i));
    }
    return 0;
}`,
      },
      stdin: {
        name: "Interactive Standard Input (scanf)",
        defaultStdin: "42 99\n",
        code: `#include <stdio.h>

int main() {
    int x, y;
    printf("Please enter two integers to compute sum and product:\\n");
    if (scanf("%d %d", &x, &y) == 2) {
        printf("Received: x = %d, y = %d\\n", x, y);
        printf("Sum:      %d + %d = %d\\n", x, y, x + y);
        printf("Product:  %d * %d = %d\\n", x, y, x * y);
    } else {
        printf("Error: Expected 2 integer inputs from standard input.\\n");
        return 1;
    }
    return 0;
}`,
      },
      pointers: {
        name: "Pointers & Dynamic Memory",
        code: `#include <stdio.h>
#include <stdlib.h>

int main() {
    int n = 6;
    int *arr = (int *)malloc(n * sizeof(int));
    if (!arr) {
        perror("Failed to allocate memory");
        return 1;
    }

    printf("Allocated dynamic array of %d integers at %p\\n", n, (void *)arr);
    for (int i = 0; i < n; i++) {
        arr[i] = (i + 1) * 11;
        printf("arr[%d] = %d (address: %p)\\n", i, arr[i], (void *)&arr[i]);
    }

    free(arr);
    printf("Memory freed successfully.\\n");
    return 0;
}`,
      },
    },
  },

  python: {
    key: "python",
    name: "Python",
    runtimeLabel: "Python 3 Runtime",
    version: "Python 3.13",
    filename: "main.py",
    endpoint: "/api/code/run-python",
    commandSnippet: "py -u main.py",
    presets: {
      hello: {
        name: "Hello World",
        code: `def main():
    print("Hello, World!")

if __name__ == "__main__":
    main()
`,
      },
      math: {
        name: "Prime Number Generator",
        code: `def is_prime(n: int) -> bool:
    if n < 2:
        return False
    for i in range(2, int(n ** 0.5) + 1):
        if n % i == 0:
            return False
    return True

print("--- Prime Numbers between 1 and 100 ---")
primes = [n for n in range(1, 101) if is_prime(n)]
print(f"Count of primes: {len(primes)}")
print(f"Prime numbers  : {primes}")
`,
      },
      stdin: {
        name: "Interactive Standard Input (sys.stdin)",
        defaultStdin: "Alice 95\nBob 88\nCharlie 92\n",
        code: `import sys

print("Reading student evaluation records from stdin:")
lines = sys.stdin.read().strip().splitlines()

students = []
for line in lines:
    parts = line.split()
    if len(parts) >= 2:
        name = parts[0]
        score = int(parts[1])
        students.append((name, score))

print(f"Total students parsed: {len(students)}\\n")
total_score = 0
for name, score in students:
    status = "Pass" if score >= 50 else "Fail"
    print(f"  • {name.ljust(12)} -> Mark: {score}/100 [{status}]")
    total_score += score

if students:
    avg = total_score / len(students)
    print(f"\\nClass Average: {avg:.2f}/100")
`,
      },
      oop: {
        name: "Object-Oriented Programming (Classes)",
        code: `class ProjectWorkspace:
    def __init__(self, project_id: str, title: str, repo: str):
        self.project_id = project_id
        self.title = title
        self.repo = repo
        self.members = []

    def add_member(self, student_name: str, index_no: str):
        self.members.append({"name": student_name, "index": index_no})

    def display(self):
        print(f"Project ID: {self.project_id}")
        print(f"Title     : {self.title}")
        print(f"Repository: https://github.com/{self.repo}")
        print(f"Members ({len(self.members)}):")
        for m in self.members:
            print(f"  - {m['name']} ({m['index']})")

workspace = ProjectWorkspace("PRJ-2026-01", "C Shell & REPL", "uor-ict/c-mini-shell")
workspace.add_member("Kasun Perera", "TG/2021/042")
workspace.add_member("Nimali Fernando", "TG/2021/088")
workspace.display()
`,
      },
    },
  },

  java: {
    key: "java",
    name: "Java",
    runtimeLabel: "Java (OpenJDK 25)",
    version: "OpenJDK 25 LTS",
    filename: "Main.java",
    endpoint: "/api/code/run-java",
    commandSnippet: "javac Main.java && java Main",
    presets: {
      hello: {
        name: "Hello World",
        code: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}
`,
      },
      stdin: {
        name: "Interactive Standard Input (Scanner)",
        defaultStdin: "15 25\n",
        code: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        System.out.println("Please enter two numbers for GCD computation:");

        if (scanner.hasNextInt()) {
            int a = scanner.nextInt();
            int b = scanner.nextInt();
            System.out.printf("Numbers entered: a = %d, b = %d%n", a, b);
            System.out.printf("Greatest Common Divisor (GCD): %d%n", gcd(a, b));
        } else {
            System.out.println("No input provided on standard input.");
        }
        scanner.close();
    }

    private static int gcd(int a, int b) {
        while (b != 0) {
            int temp = b;
            b = a % b;
            a = temp;
        }
        return Math.abs(a);
    }
}
`,
      },
      oop: {
        name: "Object-Oriented Classes & Modeling",
        code: `import java.util.ArrayList;
import java.util.List;

class Student {
    private String name;
    private String regNo;
    private double mark;

    public Student(String name, String regNo, double mark) {
        this.name = name;
        this.regNo = regNo;
        this.mark = mark;
    }

    public String getName() { return name; }
    public String getRegNo() { return regNo; }
    public double getMark() { return mark; }

    public String getGrade() {
        if (mark >= 75) return "A";
        if (mark >= 65) return "B";
        if (mark >= 50) return "C";
        return "F";
    }
}

public class Main {
    public static void main(String[] args) {
        List<Student> students = new ArrayList<>();
        students.add(new Student("Praveen Jayawardena", "TG/2021/101", 86.5));
        students.add(new Student("Anjali Senanayake", "TG/2021/102", 74.0));
        students.add(new Student("Dinuka Wijesinghe", "TG/2021/103", 61.5));

        System.out.println("--- UniCodeTrack AI Student Evaluations ---");
        for (Student s : students) {
            System.out.printf("%-22s | %-12s | Mark: %5.1f | Grade: %s%n",
                s.getName(), s.getRegNo(), s.getMark(), s.getGrade());
        }
    }
}
`,
      },
      math: {
        name: "Matrix Multiplication & Benchmarking",
        code: `public class Main {
    public static void main(String[] args) {
        int n = 4;
        int[][] A = new int[n][n];
        int[][] B = new int[n][n];
        int[][] C = new int[n][n];

        // Initialize sample matrices
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < n; j++) {
                A[i][j] = i + j + 1;
                B[i][j] = (i == j) ? 2 : 1;
            }
        }

        // Multiply A * B
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < n; j++) {
                for (int k = 0; k < n; k++) {
                    C[i][j] += A[i][k] * B[k][j];
                }
            }
        }

        System.out.println("Result of 4x4 Matrix Multiplication C = A * B:");
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < n; j++) {
                System.out.printf("%4d ", C[i][j]);
            }
            System.out.println();
        }
    }
}
`,
      },
    },
  },
};

export interface EditorFile {
  id: string;
  name: string;
  content: string;
  isEntry?: boolean;
}

const DEFAULT_MULTI_FILE_DEMOS: Record<LanguageKey, EditorFile[]> = {
  c: [
    {
      id: "c-main",
      name: "main.c",
      isEntry: true,
      content: `#include <stdio.h>
#include "helper.h"

int main() {
    printf("==========================================\\n");
    printf("   UniCodeTrack AI - Multi-File C Runner  \\n");
    printf("==========================================\\n");

    int a = 14, b = 7;
    printf("Invoking helper.c functions from main.c:\\n");
    printf("  - add(%d, %d)      = %d\\n", a, b, add(a, b));
    printf("  - subtract(%d, %d) = %d\\n", a, b, subtract(a, b));
    printf("  - multiply(%d, %d) = %d\\n", a, b, multiply(a, b));

    print_status("Both main.c and helper.c compiled successfully with GCC!");
    return 0;
}
`,
    },
    {
      id: "c-helper-h",
      name: "helper.h",
      content: `#ifndef HELPER_H
#define HELPER_H

// Declarations implemented in helper.c
int add(int a, int b);
int subtract(int a, int b);
int multiply(int a, int b);
void print_status(const char *msg);

#endif // HELPER_H
`,
    },
    {
      id: "c-helper-c",
      name: "helper.c",
      content: `#include <stdio.h>
#include "helper.h"

int add(int a, int b) {
    return a + b;
}

int subtract(int a, int b) {
    return a - b;
}

int multiply(int a, int b) {
    return a * b;
}

void print_status(const char *msg) {
    printf(">> [HELPER MODULE] %s\\n", msg);
}
`,
    },
  ],
  python: [
    {
      id: "py-main",
      name: "main.py",
      isEntry: true,
      content: `from helper import greet, compute_stats

def main():
    print("===========================================")
    print(" UniCodeTrack AI - Multi-File Python Runner")
    print("===========================================")
    print(greet("Student Developer"))

    data = [12, 45, 67, 89, 34, 99, 23]
    stats = compute_stats(data)
    print(f"Data points : {data}")
    print(f"Count       : {stats['count']}")
    print(f"Sum         : {stats['sum']}")
    print(f"Average     : {stats['average']:.2f}")

if __name__ == "__main__":
    main()
`,
    },
    {
      id: "py-helper",
      name: "helper.py",
      content: `def greet(name: str) -> str:
    return f"Hello, {name}! Multiple Python modules imported seamlessly."

def compute_stats(numbers: list) -> dict:
    if not numbers:
        return {"count": 0, "sum": 0, "average": 0.0}
    return {
        "count": len(numbers),
        "sum": sum(numbers),
        "average": sum(numbers) / len(numbers)
    }
`,
    },
  ],
  java: [
    {
      id: "java-main",
      name: "Main.java",
      isEntry: true,
      content: `public class Main {
    public static void main(String[] args) {
        System.out.println("==========================================");
        System.out.println("   UniCodeTrack AI - Multi-File Java Runner");
        System.out.println("==========================================");

        Student s1 = new Student("Kasun Perera", "TG/2021/042", 87.5);
        Student s2 = new Student("Nimali Fernando", "TG/2021/088", 92.0);

        s1.display();
        s2.display();
    }
}
`,
    },
    {
      id: "java-student",
      name: "Student.java",
      content: `public class Student {
    private String name;
    private String regNo;
    private double mark;

    public Student(String name, String regNo, double mark) {
        this.name = name;
        this.regNo = regNo;
        this.mark = mark;
    }

    public void display() {
        System.out.printf("[Student] %-18s | Reg: %-12s | Grade: %s (%.1f%%)%n",
            name, regNo, getGrade(), mark);
    }

    public String getGrade() {
        if (mark >= 75) return "A (Distinction)";
        if (mark >= 65) return "B (Credit)";
        if (mark >= 50) return "C (Pass)";
        return "F";
    }
}
`,
    },
  ],
};

export default function EnvironmentTestPage() {
  const [selectedLang, setSelectedLang] = useState<LanguageKey>("c");

  // Keep multi-file list and stdin states per language
  const [filesMap, setFilesMap] = useState<Record<LanguageKey, EditorFile[]>>({
    c: [
      { id: "c-main", name: "main.c", isEntry: true, content: LANGUAGES.c.presets.hello.code },
    ],
    python: [
      { id: "py-main", name: "main.py", isEntry: true, content: LANGUAGES.python.presets.hello.code },
    ],
    java: [
      { id: "java-main", name: "Main.java", isEntry: true, content: LANGUAGES.java.presets.hello.code },
    ],
  });

  const [activeFileIdMap, setActiveFileIdMap] = useState<Record<LanguageKey, string>>({
    c: "c-main",
    python: "py-main",
    java: "java-main",
  });

  const [isCreatingFile, setIsCreatingFile] = useState<boolean>(false);
  const [newFileNameInput, setNewFileNameInput] = useState<string>("");
  const newFileInputRef = useRef<HTMLInputElement>(null);

  const [stdinMap, setStdinMap] = useState<Record<LanguageKey, string>>({
    c: "",
    python: "",
    java: "",
  });

  const [showStdin, setShowStdin] = useState<boolean>(false);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResponse | null>(null);
  const [terminalHistory, setTerminalHistory] = useState<string>("");

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const currentLangConfig = LANGUAGES[selectedLang];
  const currentFiles = filesMap[selectedLang] || [];
  const activeFileId = activeFileIdMap[selectedLang] || currentFiles[0]?.id || "default";
  const activeFile = currentFiles.find((f) => f.id === activeFileId) || currentFiles[0] || {
    id: "default",
    name: currentLangConfig.filename,
    content: "",
    isEntry: true,
  };
  const currentCode = activeFile.content;
  const currentStdin = stdinMap[selectedLang];

  // Language Change
  const handleSelectLanguage = (langKey: LanguageKey) => {
    setSelectedLang(langKey);
    setIsCreatingFile(false);
    setNewFileNameInput("");
    setExecutionResult(null);
    setTerminalHistory("");
  };

  // Update current active file content
  const updateActiveCode = (newCode: string) => {
    setFilesMap((prev) => {
      const langFiles = (prev[selectedLang] || []).map((f) =>
        f.id === activeFile.id ? { ...f, content: newCode } : f
      );
      return { ...prev, [selectedLang]: langFiles };
    });
  };

  // Add a new file to the active language
  const handleStartCreateFile = () => {
    setIsCreatingFile(true);
    const defaultName = selectedLang === "c" ? "helper.c" : selectedLang === "python" ? "helper.py" : "Student.java";
    setNewFileNameInput(defaultName);
    setTimeout(() => {
      newFileInputRef.current?.focus();
      newFileInputRef.current?.select();
    }, 50);
  };

  const handleConfirmCreateFile = () => {
    const raw = newFileNameInput.trim();
    if (!raw) {
      setIsCreatingFile(false);
      return;
    }

    let sanitized = raw.replace(/[^a-zA-Z0-9_.-]/g, "");
    if (selectedLang === "c") {
      if (!sanitized.endsWith(".c") && !sanitized.endsWith(".h")) {
        sanitized += ".c";
      }
    } else if (selectedLang === "python") {
      if (!sanitized.endsWith(".py")) {
        sanitized += ".py";
      }
    } else if (selectedLang === "java") {
      if (!sanitized.endsWith(".java")) {
        sanitized += ".java";
      }
    }

    if (currentFiles.some((f) => f.name.toLowerCase() === sanitized.toLowerCase())) {
      alert(`File "${sanitized}" already exists in the workspace.`);
      return;
    }

    let initialContent = "";
    if (sanitized.endsWith(".h")) {
      const guard = sanitized.replace(/[^a-zA-Z0-9]/g, "_").toUpperCase();
      initialContent = `#ifndef ${guard}\n#define ${guard}\n\n// Function declarations\nint helper_function(int x);\n\n#endif // ${guard}\n`;
    } else if (sanitized.endsWith(".c")) {
      initialContent = `#include <stdio.h>\n\nint helper_function(int x) {\n    return x * 2;\n}\n`;
    } else if (sanitized.endsWith(".py")) {
      initialContent = `# Helper module\ndef helper_function(x):\n    return x * 2\n`;
    } else if (sanitized.endsWith(".java")) {
      const className = sanitized.replace(/\.java$/, "");
      initialContent = `public class ${className} {\n    private String name;\n\n    public ${className}(String name) {\n        this.name = name;\n    }\n\n    public void display() {\n        System.out.println("Hello from " + name);\n    }\n}\n`;
    }

    const newId = `${selectedLang}-${Date.now()}`;
    const newFile: EditorFile = {
      id: newId,
      name: sanitized,
      content: initialContent,
      isEntry: false,
    };

    setFilesMap((prev) => ({
      ...prev,
      [selectedLang]: [...(prev[selectedLang] || []), newFile],
    }));
    setActiveFileIdMap((prev) => ({
      ...prev,
      [selectedLang]: newId,
    }));
    setIsCreatingFile(false);
    setNewFileNameInput("");
  };

  const handleDeleteFile = (fileId: string, fileName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentFiles.length <= 1) {
      alert("At least one source file must be retained in the workspace.");
      return;
    }

    const file = currentFiles.find((f) => f.id === fileId);
    if (file?.isEntry) {
      alert("The entry file cannot be deleted.");
      return;
    }

    if (!confirm(`Delete "${fileName}"? This cannot be undone.`)) {
      return;
    }

    const remaining = currentFiles.filter((f) => f.id !== fileId);
    setFilesMap((prev) => ({
      ...prev,
      [selectedLang]: remaining,
    }));

    if (activeFileId === fileId) {
      setActiveFileIdMap((prev) => ({
        ...prev,
        [selectedLang]: remaining[0].id,
      }));
    }
  };

  const handleLoadMultiFileDemo = () => {
    const demoFiles = DEFAULT_MULTI_FILE_DEMOS[selectedLang];
    if (!demoFiles || demoFiles.length === 0) return;

    if (confirm(`Load multi-file demo for ${currentLangConfig.name}? This loads 2-3 separate files that compile and link together.`)) {
      setFilesMap((prev) => ({
        ...prev,
        [selectedLang]: demoFiles,
      }));
      setActiveFileIdMap((prev) => ({
        ...prev,
        [selectedLang]: demoFiles[0].id,
      }));
      setExecutionResult(null);
      setTerminalHistory("");
    }
  };

  // Tab Key & Keyboard Shortcut Handling
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const indent = "    ";
      const newValue = currentCode.substring(0, start) + indent + currentCode.substring(end);
      updateActiveCode(newValue);
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 4;
      }, 0);
    }

    // Ctrl+Enter or Cmd+Enter to Run
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleRunCode();
    }
  };

  // Execute Code for Active Language
  const handleRunCode = async () => {
    if (!currentCode.trim() && currentFiles.length === 0) {
      alert(`Please provide ${currentLangConfig.name} source code before running.`);
      return;
    }

    setIsRunning(true);
    setExecutionResult(null);
    setTerminalHistory("");

    try {
      const res = await fetch(currentLangConfig.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceCode: activeFile.content,
          files: currentFiles.map((f) => ({ name: f.name, content: f.content })),
          stdin: currentStdin,
          filename: activeFile.name,
        }),
      });

      const data: ExecutionResponse = await res.json();
      setExecutionResult(data);

      let output = "";
      if (data.status === "compilation_error") {
        output = data.stderr || data.error || "Compilation error.";
      } else if (data.status === "security_violation") {
        output = data.error || "Security policy blocked.";
      } else if (data.status === "unconfigured") {
        output = data.error || "Compiler not configured.";
      } else if (data.status === "error") {
        output = data.stderr || data.error || "Execution error.";
      } else {
        // Successful or runtime execution: only display stdout and any stderr/errors
        const parts: string[] = [];
        if (data.stdout && data.stdout.trim()) {
          parts.push(data.stdout);
        }
        if (data.stderr && data.stderr.trim()) {
          parts.push(data.stderr);
        }
        if (parts.length > 0) {
          output = parts.join("\n");
        } else {
          output = "(Program exited with no output)";
        }
      }

      setTerminalHistory(output);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Execution failed.";
      const errorResult: ExecutionResponse = {
        success: false,
        status: "error",
        compilationStatus: "Network or Server Failure",
        stdout: "",
        stderr: msg,
        executionTimeSeconds: "0.00",
        exitCode: 1,
        error: msg,
      };
      setExecutionResult(errorResult);
      setTerminalHistory(msg);
    } finally {
      setIsRunning(false);
    }
  };

  // Download Source Code
  const handleDownloadCode = () => {
    const mimeTypes: Record<LanguageKey, string> = {
      c: "text/x-csrc",
      python: "text/x-python",
      java: "text/x-java-source",
    };
    const blob = new Blob([currentCode], { type: mimeTypes[selectedLang] });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = activeFile.name || currentLangConfig.filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Clear Terminal Output
  const handleClearTerminal = () => {
    setTerminalHistory("");
    setExecutionResult(null);
  };

  // Line count for the editor
  const lineCount = currentCode ? currentCode.split("\n").length : 1;

  return (
    <div className="w-full py-2 space-y-5">
      {/* Breadcrumb Navigation */}
      <div className="crumb flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
        <Link href="/dashboard" className="hover:text-teal-400 transition-colors">
          Dashboard
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-white font-medium">Run</span>
      </div>

      {/* Page Header */}
      <div className="flex items-center gap-2.5 border-b border-border pb-4">
        <div className="p-2 rounded-xl bg-accent/10 border border-accent/20 text-accent">
          <Terminal className="w-5 h-5" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Run
        </h1>
      </div>

      {/* 1. Language Selection Cards */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4 w-full">
        {/* C Card */}
        <div
          onClick={() => handleSelectLanguage("c")}
          className={`proj-card proj-tile p-3 sm:p-3.5 cursor-pointer transition-all rounded-[16px] ${selectedLang === "c"
            ? "border-accent bg-accent/10 ring-1 ring-accent/30"
            : "border-border bg-card hover:border-accent/40"
            }`}
        >
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-accent/20 border border-accent/30 flex items-center justify-center font-bold text-accent font-mono text-xs sm:text-sm shrink-0">
              C
            </div>
            <div className="min-w-0">
              <b className="text-xs sm:text-sm text-foreground block truncate">C</b>
              <span className="text-[11px] sm:text-xs text-muted-foreground block truncate font-mono">GCC C11</span>
            </div>
          </div>
        </div>

        {/* Python Card */}
        <div
          onClick={() => handleSelectLanguage("python")}
          className={`proj-card proj-tile p-3 sm:p-3.5 cursor-pointer transition-all rounded-[16px] ${selectedLang === "python"
            ? "border-accent bg-accent/10 ring-1 ring-accent/30"
            : "border-border bg-card hover:border-accent/40"
            }`}
        >
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-warning/20 border border-warning/30 flex items-center justify-center font-bold text-warning font-mono text-xs sm:text-sm shrink-0">
              PY
            </div>
            <div className="min-w-0">
              <b className="text-xs sm:text-sm text-foreground block truncate">Python</b>
              <span className="text-[11px] sm:text-xs text-muted-foreground block truncate font-mono">Python 3.13</span>
            </div>
          </div>
        </div>

        {/* Java Card */}
        <div
          onClick={() => handleSelectLanguage("java")}
          className={`proj-card proj-tile p-3 sm:p-3.5 cursor-pointer transition-all rounded-[16px] ${selectedLang === "java"
            ? "border-accent bg-accent/10 ring-1 ring-accent/30"
            : "border-border bg-card hover:border-accent/40"
            }`}
        >
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center font-bold text-blue-300 font-mono text-xs sm:text-sm shrink-0">
              JV
            </div>
            <div className="min-w-0">
              <b className="text-xs sm:text-sm text-foreground block truncate">Java</b>
              <span className="text-[11px] sm:text-xs text-muted-foreground block truncate font-mono">OpenJDK 25</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Code Workspace & Terminal Runner */}
      <div className="space-y-4 w-full">
        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 w-full">
          <div className="flex items-center gap-2">
            <button
              onClick={handleLoadMultiFileDemo}
              className="px-3 py-1.5 rounded-[10px] text-xs font-semibold bg-accent-soft hover:bg-accent/20 text-accent border border-accent-border transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              title={`Load multi-file example for ${currentLangConfig.name} (e.g. 2 separate files)`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Multi-File Demo</span>
            </button>
            <span className="text-xs text-muted-foreground hidden sm:inline">
              Supports multiple separate <code className="text-accent">{selectedLang === "c" ? ".c / .h" : selectedLang === "python" ? ".py" : ".java"}</code> files
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowStdin(!showStdin)}
              className={`px-3 py-1.5 rounded-[10px] text-xs font-medium border transition-colors ${showStdin
                ? "bg-accent/20 text-accent border-accent/40"
                : "bg-muted text-muted-foreground border-border hover:text-foreground"
                }`}
              title="Toggle standard input (stdin)"
            >
              {showStdin ? "✓ Stdin Input Active" : "+ Add Stdin Input"}
            </button>
            <button
              onClick={handleDownloadCode}
              className="px-3 py-1.5 rounded-[10px] text-xs font-medium bg-muted text-muted-foreground border border-border hover:text-foreground flex items-center gap-1.5"
              title={`Download ${activeFile?.name || currentLangConfig.filename}`}
            >
              <Download className="w-3.5 h-3.5" />
              Download
            </button>
            <button
              onClick={() => {
                if (confirm(`Reset editor to default ${currentLangConfig.name} workspace?`)) {
                  setFilesMap((prev) => ({
                    ...prev,
                    [selectedLang]: [
                      {
                        id: `${selectedLang}-default`,
                        name: currentLangConfig.filename,
                        isEntry: true,
                        content: LANGUAGES[selectedLang].presets.hello.code,
                      },
                    ],
                  }));
                  setActiveFileIdMap((prev) => ({
                    ...prev,
                    [selectedLang]: `${selectedLang}-default`,
                  }));
                  setTerminalHistory("");
                  setExecutionResult(null);
                }
              }}
              className="px-3 py-1.5 rounded-[10px] text-xs font-medium bg-muted text-muted-foreground border border-border hover:text-foreground flex items-center gap-1.5"
              title="Reset code"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          </div>
        </div>

        {/* Optional Stdin Field */}
        {showStdin && (
          <div className="p-3 bg-card border border-border rounded-[16px] space-y-1.5 animate-in fade-in-50 w-full">
            <span className="font-semibold text-foreground text-xs block">Standard Input (stdin)</span>
            <textarea
              rows={2}
              value={currentStdin}
              onChange={(e) =>
                setStdinMap((prev) => ({ ...prev, [selectedLang]: e.target.value }))
              }
              placeholder="e.g. 42 99"
              className="w-full p-2 bg-[#0d0d0f] border border-border rounded-[10px] text-xs text-accent font-mono focus:outline-none focus:border-accent"
            />
          </div>
        )}

        {/* Editor and Terminal Grid - Split 50% / 50% across full width */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch w-full">
          {/* Left: Code Editor (Half) */}
          <div className="flex flex-col min-w-0 w-full bg-card border border-border rounded-[16px] overflow-hidden shadow-sm h-[640px] sm:h-[700px] lg:h-[760px] xl:h-[800px]">
            {/* Multi-File Tab Bar Header */}
            <div className="flex items-center justify-between px-2 pt-2 pb-0 bg-muted border-b border-border text-xs overflow-x-auto gap-2">
              <div className="flex items-center gap-1.5 flex-1 min-w-0 overflow-x-auto py-0.5 scrollbar-none">
                {currentFiles.map((file) => {
                  const isActive = file.id === activeFile.id;
                  return (
                    <button
                      key={file.id}
                      type="button"
                      onClick={() =>
                        setActiveFileIdMap((prev) => ({ ...prev, [selectedLang]: file.id }))
                      }
                      className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-t-[8px] text-xs font-mono transition-all border-t border-l border-r shrink-0 cursor-pointer ${
                        isActive
                          ? "bg-[#0d0d0f] text-foreground border-border font-semibold shadow-sm -mb-px pb-2"
                          : "bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground border-transparent"
                      }`}
                      title={file.isEntry ? `${file.name} (Entry point)` : file.name}
                    >
                      <FileCode className={`w-3.5 h-3.5 ${isActive ? "text-accent" : "text-muted-foreground"}`} />
                      <span>{file.name}</span>
                      {file.isEntry && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-accent/15 text-accent font-sans">main</span>
                      )}
                      {!file.isEntry && currentFiles.length > 1 && (
                        <span
                          onClick={(e) => handleDeleteFile(file.id, file.name, e)}
                          className="opacity-60 hover:opacity-100 hover:text-danger p-0.5 rounded transition-all ml-0.5"
                          title="Delete file"
                        >
                          <X className="w-3 h-3" />
                        </span>
                      )}
                    </button>
                  );
                })}

                {/* Inline New File Button / Input */}
                {isCreatingFile ? (
                  <div className="flex items-center gap-1 bg-[#0d0d0f] px-2 py-1 rounded-[8px] border border-accent shadow-sm shrink-0">
                    <FilePlus2 className="w-3.5 h-3.5 text-accent" />
                    <input
                      ref={newFileInputRef}
                      type="text"
                      value={newFileNameInput}
                      onChange={(e) => setNewFileNameInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleConfirmCreateFile();
                        } else if (e.key === "Escape") {
                          setIsCreatingFile(false);
                        }
                      }}
                      placeholder={selectedLang === "c" ? "helper.c" : selectedLang === "python" ? "helper.py" : "Student.java"}
                      className="bg-transparent text-foreground text-xs font-mono w-28 sm:w-32 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleConfirmCreateFile}
                      className="px-1.5 py-0.5 bg-accent text-background font-semibold text-[10px] rounded hover:opacity-90 cursor-pointer"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCreatingFile(false)}
                      className="p-0.5 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleStartCreateFile}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-muted-foreground hover:text-foreground hover:bg-card/70 rounded-[8px] text-xs transition-colors shrink-0 cursor-pointer border border-dashed border-border"
                    title={`Add new ${selectedLang.toUpperCase()} file`}
                  >
                    <Plus className="w-3.5 h-3.5 text-accent" />
                    <span className="font-mono text-[11px]">+ New File</span>
                  </button>
                )}
              </div>

              {/* Header Right: Stats */}
              <div className="hidden sm:flex items-center gap-2 text-muted-foreground text-[11px] font-mono shrink-0 pr-2 pb-1">
                <span className="text-foreground font-semibold">{activeFile.name}</span>
                <span>•</span>
                <span>{lineCount} lines</span>
              </div>
            </div>

            {/* Editor Body */}
            <div className="relative flex flex-1 bg-[#0d0d0f] font-mono leading-relaxed overflow-hidden">
              {/* Line numbers gutter */}
              <div
                className="select-none py-4 px-2 text-right text-muted-foreground/40 bg-[#0a0a0c] border-r border-border font-mono text-xs sm:text-[13px] w-12 sm:w-14 shrink-0 overflow-hidden"
              >
                {Array.from({ length: lineCount }).map((_, i) => (
                  <div key={i} className="leading-relaxed">{i + 1}</div>
                ))}
              </div>

              {/* Editable Textarea */}
              <textarea
                ref={textareaRef}
                value={currentCode}
                onChange={(e) => updateActiveCode(e.target.value)}
                onKeyDown={handleKeyDown}
                spellCheck={false}
                className="flex-1 p-4 bg-transparent text-foreground font-mono text-xs sm:text-[13.5px] md:text-[14px] resize-none focus:outline-none focus:ring-0 leading-relaxed overflow-auto selection:bg-accent/30"
                style={{ tabSize: 4 }}
              />
            </div>

            {/* Editor Footer / Action Bar */}
            <div className="flex items-center justify-between px-4 py-3 bg-muted border-t border-border">
              <div className="text-[11px] text-muted-foreground hidden sm:block">
                Press <kbd className="px-1.5 py-0.5 rounded bg-card border border-border text-foreground font-mono">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 rounded bg-card border border-border text-foreground font-mono">Enter</kbd> to run
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleRunCode}
                  disabled={isRunning}
                  className="proj-btn p text-xs font-semibold px-4 py-2 flex items-center gap-2 shadow-sm disabled:opacity-50"
                >
                  <Play className={`w-3.5 h-3.5 fill-current ${isRunning ? "animate-spin" : ""}`} />
                  {isRunning ? "Running..." : "Run"}
                </button>
              </div>
            </div>
          </div>

          {/* Right: Terminal Console Output (Half) */}
          <div className="flex flex-col min-w-0 w-full bg-card border border-border rounded-[16px] overflow-hidden shadow-sm h-[640px] sm:h-[700px] lg:h-[760px] xl:h-[800px]">
            {/* Terminal Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-muted border-b border-border text-xs">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-danger/80"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-warning/80"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-accent/80"></span>
                </div>
                <span className="font-mono text-foreground font-semibold ml-1.5">Terminal</span>
              </div>

              <div className="flex items-center gap-2">
                {executionResult && (
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${executionResult.success
                      ? "bg-accent/20 text-accent border border-accent/30"
                      : "bg-danger/20 text-danger border border-danger/30"
                      }`}
                  >
                    {executionResult.success ? "Exit Code 0" : `Exit Code ${executionResult.exitCode ?? 1}`}
                  </span>
                )}
                {executionResult?.executionTimeSeconds && (
                  <span className="text-[10px] text-muted-foreground font-mono flex items-center gap-1">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    {executionResult.executionTimeSeconds}s
                  </span>
                )}
                <button
                  onClick={handleClearTerminal}
                  className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  title="Clear console"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Terminal Screen - ONLY output and errors */}
            <div className="flex-1 bg-[#0d0d0f] p-4 sm:p-5 font-mono leading-relaxed text-foreground overflow-auto">
              {isRunning ? (
                <div className="flex items-center gap-2 text-accent text-xs sm:text-sm font-mono animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-accent animate-ping" />
                  <span>Running {currentLangConfig.name} program...</span>
                </div>
              ) : terminalHistory ? (
                <pre className="whitespace-pre-wrap break-words font-mono text-xs sm:text-[13px] md:text-[14px] leading-relaxed m-0 p-0 bg-transparent border-0 text-foreground">
                  {terminalHistory}
                </pre>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-center py-16 space-y-3">
                  <div className="p-3.5 rounded-2xl bg-muted/60 border border-border/80">
                    <Terminal className="w-9 h-9 text-accent/70" />
                  </div>
                  <p className="text-sm sm:text-base font-semibold text-foreground">Console is ready</p>
                  <p className="text-xs sm:text-sm max-w-sm text-muted-foreground leading-normal">
                    Click <strong className="text-accent">Run</strong> or press <kbd className="px-1.5 py-0.5 rounded bg-card border border-border text-foreground font-mono text-[11px]">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 rounded bg-card border border-border text-foreground font-mono text-[11px]">Enter</kbd> to execute.
                  </p>
                </div>
              )}
            </div>

            {/* Terminal Footer Status Bar */}
            <div className="px-4 py-2.5 bg-muted border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5 font-mono">
                <span className="w-2 h-2 rounded-full bg-accent"></span>
                Runtime: <code>{currentLangConfig.version}</code>
              </span>
              <span className="font-mono">CPU Timeout: <code>3.0s</code></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
