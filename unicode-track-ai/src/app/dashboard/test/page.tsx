"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Terminal,
  Play,
  RotateCcw,
  Trash2,
  Download,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Code2,
  Cpu,
  Layers,
  ChevronRight,
  Info,
  Sparkles,
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

const C_PRESETS: Record<string, { name: string; code: string; defaultStdin?: string }> = {
  hello: {
    name: "Hello World & Iteration",
    code: `#include <stdio.h>

int main() {
    printf("==========================================\\n");
    printf(" UniCodeTrack AI — Environment Test System\\n");
    printf(" Native C11 Execution via GCC Sandbox     \\n");
    printf("==========================================\\n\\n");

    for (int i = 1; i <= 5; i++) {
        printf("[PASS] Core cycle %d initialized and executed successfully.\\n", i);
    }

    printf("\\nAll runtime tests completed with status 0.\\n");
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
};

export default function EnvironmentTestPage() {
  const [selectedLang, setSelectedLang] = useState<LanguageKey>("c");
  const [activePreset, setActivePreset] = useState<string>("hello");
  const [cCode, setCCode] = useState<string>(C_PRESETS.hello.code);
  const [stdinInput, setStdinInput] = useState<string>("");
  const [showStdin, setShowStdin] = useState<boolean>(false);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResponse | null>(null);
  const [terminalHistory, setTerminalHistory] = useState<string>("");

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Handle Preset Change
  const handleSelectPreset = (key: string) => {
    setActivePreset(key);
    if (C_PRESETS[key]) {
      setCCode(C_PRESETS[key].code);
      if (C_PRESETS[key].defaultStdin !== undefined) {
        setStdinInput(C_PRESETS[key].defaultStdin || "");
        setShowStdin(true);
      }
    }
  };

  // Allow tab key to indent in textarea
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const newValue = cCode.substring(0, start) + "    " + cCode.substring(end);
      setCCode(newValue);
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

  // Run C Program on Platform
  const handleRunCode = async () => {
    if (!cCode.trim()) {
      alert("Please provide C source code before running.");
      return;
    }

    setIsRunning(true);
    setExecutionResult(null);

    const commandPrompt = `$ gcc -O2 -std=c11 -Wall main.c -o program.exe && ./program.exe\n`;
    setTerminalHistory(commandPrompt + "Compiling and executing in sandbox...\n");

    try {
      const res = await fetch("/api/code/run-c", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceCode: cCode,
          stdin: stdinInput,
          filename: "main.c",
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

  // Download .c source code
  const handleDownloadCode = () => {
    const blob = new Blob([cCode], { type: "text/x-csrc" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "test_main.c";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Clear Terminal Output
  const handleClearTerminal = () => {
    setTerminalHistory("$ \n");
    setExecutionResult(null);
  };

  // Line count for the editor
  const lineCount = cCode.split("\n").length;

  return (
    <div className="max-w-[1200px] mx-auto py-3 px-2 sm:px-4 space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="crumb flex items-center gap-2 text-xs sm:text-sm text-slate-400">
        <Link href="/dashboard" className="hover:text-teal-400 transition-colors">
          Dashboard
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
        <span className="text-white font-medium">Test Environment</span>
      </div>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#1e293b] pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Environment Testing Sandbox
              </h1>
              <p className="text-sm text-slate-400 mt-0.5">
                Test compiler execution, verify runtime sandboxes, and run isolated programs.
              </p>
            </div>
          </div>
        </div>

        {/* Quick status badge */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Host GCC 6.3 Online
          </span>
        </div>
      </div>

      {/* 1. Language Selection Cards */}
      <div>
        <div className="proj-sec mb-3">Select Language Environment</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* C Language Card */}
          <div
            onClick={() => setSelectedLang("c")}
            className={`proj-card proj-tile relative p-4 cursor-pointer transition-all rounded-xl ${
              selectedLang === "c"
                ? "border-teal-500 bg-teal-500/10 shadow-sm"
                : "border-[#1e293b] bg-[#0e1626] hover:border-slate-600"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-teal-500/20 border border-teal-500/30 flex items-center justify-center font-bold text-teal-300 font-mono text-base">
                  C
                </div>
                <div>
                  <b className="text-base text-white block">C Language</b>
                  <span className="text-xs text-slate-400">GCC C11 · MinGW 6.3</span>
                </div>
              </div>
              <span className="proj-tag ok text-[11px]">Ready & Runnable</span>
            </div>
            <p className="text-xs text-slate-400 mt-3 leading-relaxed">
              Compile and run C code directly with <code>gcc -O2 -std=c11</code>. Interactive standard input and isolated memory execution.
            </p>
          </div>

          {/* Python Card */}
          <div
            onClick={() => setSelectedLang("python")}
            className={`proj-card proj-tile relative p-4 cursor-pointer transition-all rounded-xl ${
              selectedLang === "python"
                ? "border-teal-500 bg-teal-500/10 shadow-sm"
                : "border-[#1e293b] bg-[#0e1626] hover:border-slate-600"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center font-bold text-amber-300 font-mono text-base">
                  PY
                </div>
                <div>
                  <b className="text-base text-white block">Python</b>
                  <span className="text-xs text-slate-400">Python 3.x Environment</span>
                </div>
              </div>
              <span className="proj-tag no text-[11px]">Coming Soon</span>
            </div>
            <p className="text-xs text-slate-400 mt-3 leading-relaxed">
              Dynamic scripting environment for scripts, data analysis, and algorithms.
            </p>
          </div>

          {/* Java Card */}
          <div
            onClick={() => setSelectedLang("java")}
            className={`proj-card proj-tile relative p-4 cursor-pointer transition-all rounded-xl ${
              selectedLang === "java"
                ? "border-teal-500 bg-teal-500/10 shadow-sm"
                : "border-[#1e293b] bg-[#0e1626] hover:border-slate-600"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center font-bold text-blue-300 font-mono text-base">
                  JV
                </div>
                <div>
                  <b className="text-base text-white block">Java</b>
                  <span className="text-xs text-slate-400">OpenJDK 25 (LTS)</span>
                </div>
              </div>
              <span className="proj-tag no text-[11px]">Coming Soon</span>
            </div>
            <p className="text-xs text-slate-400 mt-3 leading-relaxed">
              Object-oriented bytecode virtual machine with JVM standard class libraries.
            </p>
          </div>
        </div>
      </div>

      {/* Informative notice if Python or Java is selected */}
      {selectedLang !== "c" && (
        <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-800/40 text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in-50">
          <div className="flex items-center gap-3">
            <Info className="w-5 h-5 text-amber-400 shrink-0" />
            <div className="text-xs">
              <strong>{selectedLang === "python" ? "Python" : "Java"} Runtime Slot:</strong>{" "}
              This environment slot is configured for upcoming extension. For now, full native compilation and execution is enabled for <strong>C</strong>.
            </div>
          </div>
          <button
            onClick={() => setSelectedLang("c")}
            className="proj-btn p text-xs px-3 py-1.5 shrink-0"
          >
            Switch to C Sandbox
          </button>
        </div>
      )}

      {/* 2. C Code Workspace & Terminal Runner */}
      {selectedLang === "c" && (
        <div className="space-y-4">
          {/* Preset templates bar */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Templates:</span>
              {Object.keys(C_PRESETS).map((key) => (
                <button
                  key={key}
                  onClick={() => handleSelectPreset(key)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                    activePreset === key
                      ? "bg-teal-500/20 text-teal-300 border border-teal-500/40"
                      : "bg-[#0e1626] text-slate-400 border border-[#1e293b] hover:text-white"
                  }`}
                >
                  {C_PRESETS[key].name}
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
                title="Download main.c file"
              >
                <Download className="w-3.5 h-3.5" />
                Download
              </button>
              <button
                onClick={() => {
                  if (confirm("Reset editor to default Hello World?")) {
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
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold text-white">Standard Input (stdin)</span>
                <span className="text-[11px]">Supplied to <code>scanf</code> / <code>getchar</code> / <code>fgets</code></span>
              </div>
              <textarea
                rows={2}
                value={stdinInput}
                onChange={(e) => setStdinInput(e.target.value)}
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
                  <span className="font-mono font-bold text-white">main.c</span>
                  <span className="text-slate-500 font-mono text-[11px]">(C11 Source)</span>
                </div>
                <div className="flex items-center gap-3 text-slate-400 text-[11px] font-mono">
                  <span>{lineCount} lines</span>
                  <span>{cCode.length} chars</span>
                </div>
              </div>

              {/* Editor Body */}
              <div className="relative flex flex-1 bg-[#090d16] font-mono text-xs leading-relaxed min-h-[380px]">
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
                  value={cCode}
                  onChange={(e) => setCCode(e.target.value)}
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
                    {isRunning ? "Compiling & Running..." : "Run C Program"}
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
                  <span className="font-mono text-slate-300 font-semibold ml-2">Console Terminal</span>
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
              <div className="flex-1 bg-[#070b13] p-3.5 font-mono text-xs leading-relaxed text-[#d6deeb] overflow-auto min-h-[380px]">
                {terminalHistory ? (
                  <pre className="whitespace-pre-wrap break-words font-mono text-[12.5px] leading-relaxed">
                    {terminalHistory}
                  </pre>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center py-16 space-y-2">
                    <Terminal className="w-8 h-8 text-slate-600 mb-1" />
                    <p className="font-medium text-slate-400">Console is ready</p>
                    <p className="text-xs max-w-xs text-slate-600">
                      Click <strong className="text-teal-400">Run C Program</strong> or press Ctrl+Enter to compile and run your code.
                    </p>
                  </div>
                )}
              </div>

              {/* Terminal Footer Status Bar */}
              <div className="px-3.5 py-2 bg-[#0b1220] border-t border-[#1e293b] flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-teal-400"></span>
                  Sandbox: <code>MinGW GCC (6.3.0)</code>
                </span>
                <span>CPU Timeout: <code>3.0s</code></span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
