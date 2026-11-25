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

export default function EnvironmentTestPage() {
  const [selectedLang, setSelectedLang] = useState<LanguageKey>("c");

  // Keep separate code and stdin states per language
  const [codeMap, setCodeMap] = useState<Record<LanguageKey, string>>({
    c: LANGUAGES.c.presets.hello.code,
    python: LANGUAGES.python.presets.hello.code,
    java: LANGUAGES.java.presets.hello.code,
  });

  const [stdinMap, setStdinMap] = useState<Record<LanguageKey, string>>({
    c: "",
    python: "",
    java: "",
  });

  const [activePresetMap, setActivePresetMap] = useState<Record<LanguageKey, string>>({
    c: "hello",
    python: "hello",
    java: "hello",
  });

  const [showStdin, setShowStdin] = useState<boolean>(false);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResponse | null>(null);
  const [terminalHistory, setTerminalHistory] = useState<string>("");

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const currentLangConfig = LANGUAGES[selectedLang];
  const currentCode = codeMap[selectedLang];
  const currentStdin = stdinMap[selectedLang];
  const currentPreset = activePresetMap[selectedLang];

  // Language Change
  const handleSelectLanguage = (langKey: LanguageKey) => {
    setSelectedLang(langKey);
    setExecutionResult(null);
    setTerminalHistory("");
  };

  // Preset Change
  const handleSelectPreset = (presetKey: string) => {
    const config = LANGUAGES[selectedLang];
    const preset = config.presets[presetKey];
    if (preset) {
      setActivePresetMap((prev) => ({ ...prev, [selectedLang]: presetKey }));
      setCodeMap((prev) => ({ ...prev, [selectedLang]: preset.code }));
      if (preset.defaultStdin !== undefined) {
        setStdinMap((prev) => ({ ...prev, [selectedLang]: preset.defaultStdin || "" }));
        setShowStdin(true);
      }
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
      setCodeMap((prev) => ({ ...prev, [selectedLang]: newValue }));
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
    if (!currentCode.trim()) {
      alert(`Please provide ${currentLangConfig.name} source code before running.`);
      return;
    }

    setIsRunning(true);
    setExecutionResult(null);

    const commandPrompt = `$ ${currentLangConfig.commandSnippet}\n`;
    setTerminalHistory(commandPrompt + "Compiling and executing in sandbox...\n");

    try {
      const res = await fetch(currentLangConfig.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceCode: currentCode,
          stdin: currentStdin,
          filename: currentLangConfig.filename,
        }),
      });

      const data: ExecutionResponse = await res.json();
      setExecutionResult(data);

      let output = commandPrompt;
      if (data.status === "compilation_error") {
        output += `[COMPILATION ERROR]\n${data.stderr || data.error || "Compilation failed."}\n`;
      } else if (data.status === "security_violation") {
        output += `[SECURITY POLICY BLOCKED]\n${data.error}\n`;
      } else if (data.status === "unconfigured") {
        output += `[UNCONFIGURED]\n${data.error}\n`;
      } else {
        if (data.stdout) {
          output += data.stdout;
          if (!data.stdout.endsWith("\n")) output += "\n";
        }
        if (data.stderr) {
          output += `[STDERR]\n${data.stderr}\n`;
        }
        output += `\n[Process exited with status ${data.exitCode ?? 0} in ${data.executionTimeSeconds || "0.00"}s]`;
      }
      setTerminalHistory(output);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network execution failed.";
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
      setTerminalHistory(commandPrompt + `[FATAL ERROR]: ${msg}\n`);
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
    a.download = currentLangConfig.filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Clear Terminal Output
  const handleClearTerminal = () => {
    setTerminalHistory("$ \n");
    setExecutionResult(null);
  };

  // Line count for the editor
  const lineCount = currentCode.split("\n").length;

  return (
    <div className="max-w-[1200px] mx-auto py-3 px-2 sm:px-4 space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="crumb flex items-center gap-2 text-xs sm:text-sm text-slate-400">
        <Link href="/dashboard" className="hover:text-teal-400 transition-colors">
          Dashboard
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
        <span className="text-white font-medium">Run</span>
      </div>

      {/* Page Header */}
      <div className="flex items-center gap-2.5 border-b border-[#1e293b] pb-4">
        <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
          <Terminal className="w-5 h-5" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Run
        </h1>
      </div>

      {/* 1. Language Selection Cards */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {/* C Card */}
        <div
          onClick={() => handleSelectLanguage("c")}
          className={`proj-card proj-tile p-3 sm:p-3.5 cursor-pointer transition-all rounded-xl ${
            selectedLang === "c"
              ? "border-teal-500 bg-teal-500/15 ring-1 ring-teal-500/30"
              : "border-[#1e293b] bg-[#0e1626] hover:border-slate-600"
          }`}
        >
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-teal-500/20 border border-teal-500/30 flex items-center justify-center font-bold text-teal-300 font-mono text-xs sm:text-sm shrink-0">
              C
            </div>
            <div className="min-w-0">
              <b className="text-xs sm:text-sm text-white block truncate">C</b>
              <span className="text-[11px] sm:text-xs text-slate-400 block truncate">GCC C11</span>
            </div>
          </div>
        </div>

        {/* Python Card */}
        <div
          onClick={() => handleSelectLanguage("python")}
          className={`proj-card proj-tile p-3 sm:p-3.5 cursor-pointer transition-all rounded-xl ${
            selectedLang === "python"
              ? "border-teal-500 bg-teal-500/15 ring-1 ring-teal-500/30"
              : "border-[#1e293b] bg-[#0e1626] hover:border-slate-600"
          }`}
        >
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center font-bold text-amber-300 font-mono text-xs sm:text-sm shrink-0">
              PY
            </div>
            <div className="min-w-0">
              <b className="text-xs sm:text-sm text-white block truncate">Python</b>
              <span className="text-[11px] sm:text-xs text-slate-400 block truncate">Python 3.13</span>
            </div>
          </div>
        </div>

        {/* Java Card */}
        <div
          onClick={() => handleSelectLanguage("java")}
          className={`proj-card proj-tile p-3 sm:p-3.5 cursor-pointer transition-all rounded-xl ${
            selectedLang === "java"
              ? "border-teal-500 bg-teal-500/15 ring-1 ring-teal-500/30"
              : "border-[#1e293b] bg-[#0e1626] hover:border-slate-600"
          }`}
        >
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center font-bold text-blue-300 font-mono text-xs sm:text-sm shrink-0">
              JV
            </div>
            <div className="min-w-0">
              <b className="text-xs sm:text-sm text-white block truncate">Java</b>
              <span className="text-[11px] sm:text-xs text-slate-400 block truncate">OpenJDK 25</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Code Workspace & Terminal Runner */}
      <div className="space-y-4">
        {/* Preset templates bar */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Templates:</span>
            {Object.keys(currentLangConfig.presets).map((key) => (
              <button
                key={key}
                onClick={() => handleSelectPreset(key)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  currentPreset === key
                    ? "bg-teal-500/20 text-teal-300 border border-teal-500/40 font-semibold"
                    : "bg-[#0e1626] text-slate-400 border border-[#1e293b] hover:text-white"
                }`}
              >
                {currentLangConfig.presets[key].name}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowStdin(!showStdin)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                showStdin
                  ? "bg-teal-500/20 text-teal-300 border-teal-500/40"
                  : "bg-[#0e1626] text-slate-400 border-[#1e293b] hover:text-white"
              }`}
              title="Toggle standard input (stdin)"
            >
              {showStdin ? "✓ Stdin Input Active" : "+ Add Stdin Input"}
            </button>
            <button
              onClick={handleDownloadCode}
              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-[#0e1626] text-slate-400 border border-[#1e293b] hover:text-white flex items-center gap-1"
              title={`Download ${currentLangConfig.filename}`}
            >
              <Download className="w-3.5 h-3.5" />
              Download
            </button>
            <button
              onClick={() => {
                if (confirm(`Reset editor to default ${currentLangConfig.name} template?`)) {
                  handleSelectPreset("hello");
                }
              }}
              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-[#0e1626] text-slate-400 border border-[#1e293b] hover:text-white flex items-center gap-1"
              title="Reset code"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          </div>
        </div>

        {/* Optional Stdin Field */}
        {showStdin && (
          <div className="p-3 bg-[#0e1626] border border-[#1e293b] rounded-xl space-y-1.5 animate-in fade-in-50">
            <span className="font-semibold text-white text-xs block">Standard Input (stdin)</span>
            <textarea
              rows={2}
              value={currentStdin}
              onChange={(e) =>
                setStdinMap((prev) => ({ ...prev, [selectedLang]: e.target.value }))
              }
              placeholder="e.g. 42 99"
              className="w-full p-2 bg-[#090d16] border border-[#1e293b] rounded-lg text-xs text-teal-300 font-mono focus:outline-none focus:border-teal-500"
            />
          </div>
        )}

        {/* Editor and Terminal Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left: Code Editor */}
          <div className="flex flex-col bg-[#0e1626] border border-[#1e293b] rounded-xl overflow-hidden shadow-sm">
            {/* Editor Header */}
            <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#0b1220] border-b border-[#1e293b] text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-400"></span>
                <span className="font-mono font-bold text-white">{currentLangConfig.filename}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-400 text-[11px] font-mono">
                <span>{lineCount} lines</span>
              </div>
            </div>

            {/* Editor Body */}
            <div className="relative flex flex-1 bg-[#090d16] font-mono text-xs leading-relaxed min-h-[400px]">
              {/* Line numbers gutter */}
              <div
                className="select-none py-3 px-2 text-right text-slate-600 bg-[#070b13] border-r border-[#1e293b] font-mono"
                style={{ width: "3.2rem" }}
              >
                {Array.from({ length: lineCount }).map((_, i) => (
                  <div key={i}>{i + 1}</div>
                ))}
              </div>

              {/* Editable Textarea */}
              <textarea
                ref={textareaRef}
                value={currentCode}
                onChange={(e) =>
                  setCodeMap((prev) => ({ ...prev, [selectedLang]: e.target.value }))
                }
                onKeyDown={handleKeyDown}
                spellCheck={false}
                className="flex-1 p-3 bg-transparent text-[#d6deeb] font-mono resize-none focus:outline-none focus:ring-0 leading-relaxed overflow-auto"
                style={{ tabSize: 4 }}
              />
            </div>

            {/* Editor Footer / Action Bar */}
            <div className="flex items-center justify-between p-3 bg-[#0b1220] border-t border-[#1e293b]">
              <div className="text-[11px] text-slate-400 hidden sm:block">
                Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">Enter</kbd> to run
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

          {/* Right: Terminal Console Output */}
          <div className="flex flex-col bg-[#0e1626] border border-[#1e293b] rounded-xl overflow-hidden shadow-sm">
            {/* Terminal Header */}
            <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#0b1220] border-b border-[#1e293b] text-xs">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></span>
                </div>
                <span className="font-mono text-slate-300 font-semibold ml-1.5">Terminal</span>
              </div>

              <div className="flex items-center gap-2">
                {executionResult && (
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      executionResult.success
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                    }`}
                  >
                    {executionResult.success ? "Exit Code 0" : `Exit Code ${executionResult.exitCode ?? 1}`}
                  </span>
                )}
                {executionResult?.executionTimeSeconds && (
                  <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-500" />
                    {executionResult.executionTimeSeconds}s
                  </span>
                )}
                <button
                  onClick={handleClearTerminal}
                  className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  title="Clear console"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Terminal Screen */}
            <div className="flex-1 bg-[#070b13] p-3.5 font-mono text-xs leading-relaxed text-[#d6deeb] overflow-auto min-h-[400px]">
              {terminalHistory ? (
                <pre className="whitespace-pre-wrap break-words font-mono text-[12.5px] leading-relaxed">
                  {terminalHistory}
                </pre>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center py-16 space-y-2">
                  <Terminal className="w-8 h-8 text-slate-600 mb-1" />
                  <p className="font-medium text-slate-400">Console is ready</p>
                  <p className="text-xs max-w-xs text-slate-600">
                    Click <strong className="text-teal-400">Run {currentLangConfig.name} Program</strong> or press Ctrl+Enter to compile and run your code.
                  </p>
                </div>
              )}
            </div>

            {/* Terminal Footer Status Bar */}
            <div className="px-3.5 py-2 bg-[#0b1220] border-t border-[#1e293b] flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-teal-400"></span>
                Runtime: <code>{currentLangConfig.version}</code>
              </span>
              <span>CPU Timeout: <code>3.0s</code></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
