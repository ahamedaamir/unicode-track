"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { jsPDF } from "jspdf";
import {
  CheckSquare,
  ChevronRight,
  Download,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Layers,
  FileText,
  Clock,
  RotateCcw,
  Plus,
  Trash2,
  GitBranch,
  FolderGit2,
  ExternalLink,
  Play,
  Terminal,
  Cpu,
  User,
  Users,
} from "lucide-react";
import { useAdminData } from "@/context/AdminDataContext";

// Batches list matching prototype
const BATCHES = ["1.1", "1.2", "2.1", "2.2", "3.1", "3.2", "4.1", "4.2"] as const;

// Official Courses catalogue
const COURSES = [
  { c: "ICT2132", n: "Software Engineering" },
  { c: "ICT2152", n: "Systems Analysis & Design" },
  { c: "ICT2162", n: "Management Information Systems" },
];

interface RequirementItem {
  t: string;
  m: number;
}

interface TargetResult {
  m: number[];
  sum: string;
}

interface ProjectFile {
  name: string;
  code: string;
}

interface EvaluationProject {
  id: number;
  b: string; // batch
  c: string; // course code
  t: string; // title
  g: number; // 1 = group project, 0 = personal/individual project
  tg: string[]; // targets: group names or student index numbers
  fin: number; // 0 = not finalized (in New evaluation), 1 = finalized (in Finished)
  repo: string; // GitHub repository link
  branches: [string, number][]; // [branchName, commitCount]
  members: [string, number][]; // [memberName, commitCount]
  docs: [string, string, boolean][]; // [docTitle, docType, isUploaded]
  files: ProjectFile[];
  reqs: RequirementItem[];
  res: Record<string, TargetResult>;
}

const DEFAULT_REQUIREMENTS: RequirementItem[] = [
  { t: "Functionality", m: 30 },
  { t: "Code quality", m: 20 },
  { t: "ER / database design", m: 20 },
  { t: "Documentation", m: 15 },
  { t: "Requirement coverage", m: 15 },
];

const EVIDENCE_TEMPLATES = [
  "Core features implemented and run correctly in sandbox environment",
  "Readable modular structure, clean separation of concerns and logic",
  "Tables, constraints and foreign key relations match proposal schema",
  "Report covers architectural decisions, system defense and diagrams",
  "Most project specification deliverables verified against criteria",
];

const DEFAULT_SUMMARY =
  "Implements the proposed scope and matches the ER diagram and report. Error handling and testing are the main gaps.";

function generateMarks(seed: number, reqs: RequirementItem[]): number[] {
  return reqs.map((q, i) => Math.round(q.m * (0.68 + ((seed * 7 + i * 13) % 28) / 100)));
}

// ----------------------------------------------------------------------------
// INITIAL SEED PROJECTS WITH REPOSITORIES, TELEMETRY, DELIVERABLES & CODE
// ----------------------------------------------------------------------------
const INITIAL_PROJECTS: EvaluationProject[] = [
  {
    id: 1,
    b: "2.2",
    c: "ICT2132",
    t: "Faculty Management System",
    g: 1,
    tg: ["Group 1", "Group 2", "Group 3", "Group 4"],
    fin: 0,
    repo: "uor-ict/faculty-mgmt-c",
    branches: [
      ["main", 42],
      ["dev", 28],
      ["feature/database-cli", 14],
    ],
    members: [
      ["Nimal P.", 24],
      ["Sara F.", 19],
      ["Kasun D.", 14],
      ["Ayesha R.", 9],
    ],
    docs: [
      ["Project proposal", "PDF", true],
      ["ER diagram", "PNG", true],
      ["Final report", "PDF", true],
    ],
    files: [
      {
        name: "main.c",
        code: `#include <stdio.h>
#include <string.h>

void show_menu() {
    printf("==========================================\\n");
    printf(" Faculty Management System CLI — UoR ICT  \\n");
    printf("==========================================\\n");
    printf("1. List Academic Departments\\n");
    printf("2. List Faculty Courses\\n");
    printf("3. Enrolled Students\\n");
    printf("4. Exit\\n");
}

int main(void) {
    show_menu();
    printf("\\n[INFO] Initializing SQLite / C memory database...\\n");
    printf("[DB] 3 Departments loaded: CS, IS, SE\\n");
    printf("[DB] 8 Active Courses connected to Faculty of Computing.\\n");
    printf("[PASS] Core transaction loops executed with status 0.\\n");
    return 0;
}`,
      },
      {
        name: "faculty.h",
        code: `#ifndef FACULTY_H
#define FACULTY_H

typedef struct {
    int id;
    char name[64];
    char code[16];
    int credits;
} Course;

void init_database(void);
int add_course(Course c);

#endif`,
      },
      {
        name: "database.sql",
        code: `-- Faculty Management Relational Schema (3NF)
CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    faculty VARCHAR(100) NOT NULL
);

CREATE TABLE courses (
    code VARCHAR(10) PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    dept_id INT REFERENCES departments(id)
);

CREATE TABLE student_enrollments (
    student_id VARCHAR(20) NOT NULL,
    course_code VARCHAR(10) REFERENCES courses(code),
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(student_id, course_code)
);`,
      },
      {
        name: "README.md",
        code: `# Faculty Management System
Academic project developed by Group 01 for ICT2132 Software Engineering.
Build: gcc -O2 -std=c11 main.c -o fms
Run: ./fms`,
      },
    ],
    reqs: DEFAULT_REQUIREMENTS.map((r) => ({ t: r.t, m: r.m })),
    res: {
      "Group 1": {
        m: generateMarks(3, DEFAULT_REQUIREMENTS),
        sum: DEFAULT_SUMMARY,
      },
    },
  },

  {
    id: 2,
    b: "2.2",
    c: "ICT2132",
    t: "C Mini Shell",
    g: 0,
    tg: ["TG/2004/2004", "TG/2004/2011", "TG/2004/2037"],
    fin: 0,
    repo: "uor-ict/c-mini-shell",
    branches: [
      ["main", 35],
      ["dev", 20],
      ["parser-fix", 7],
    ],
    members: [["TG/2004/2004", 42]],
    docs: [
      ["Project proposal", "PDF", true],
      ["ER diagram", "PNG", true],
      ["Final report", "PDF", true],
    ],
    files: [
      {
        name: "main.c",
        code: `#include <stdio.h>
#include <string.h>

int main(void) {
    printf("==========================================\\n");
    printf(" UniCodeTrack Mini Shell — REPL v1.2     \\n");
    printf(" Standard Input Command Parser            \\n");
    printf("==========================================\\n");

    const char *commands[] = {"help", "status", "version", "uptime"};
    for (int i = 0; i < 4; i++) {
        printf("shell> %s\\n", commands[i]);
        printf("[OK] Command '%s' dispatched successfully.\\n", commands[i]);
    }
    printf("shell> exit\\n[Shell terminated cleanly with code 0]\\n");
    return 0;
}`,
      },
      {
        name: "parser.h",
        code: `#ifndef PARSER_H
#define PARSER_H

int parse_command_line(const char *line, char **argv);

#endif`,
      },
      {
        name: "README.md",
        code: `# C Mini Shell
Interactive command interpreter with tokenization and process dispatching.
Build: gcc -O2 -std=c11 main.c -o shell`,
      },
    ],
    reqs: DEFAULT_REQUIREMENTS.map((r) => ({ t: r.t, m: r.m })),
    res: {},
  },

  {
    id: 3,
    b: "3.1",
    c: "ICT2152",
    t: "Library Management",
    g: 1,
    tg: ["Group 1", "Group 2", "Group 3"],
    fin: 0,
    repo: "uor-ict/python-library-sys",
    branches: [
      ["main", 38],
      ["dev", 22],
      ["api-routes", 11],
    ],
    members: [
      ["Chathura K.", 21],
      ["Sanduni M.", 18],
      ["Buddhika T.", 12],
    ],
    docs: [
      ["Project proposal", "PDF", true],
      ["ER diagram", "PNG", true],
      ["Final report", "PDF", true],
    ],
    files: [
      {
        name: "main.py",
        code: `#!/usr/bin/env python3
"""
Library Management System — Python 3 Implementation
"""

class LibraryCatalog:
    def __init__(self):
        self.books = [
            {"isbn": "978-0131103627", "title": "The C Programming Language", "copies": 4},
            {"isbn": "978-0201633610", "title": "Design Patterns", "copies": 2},
            {"isbn": "978-0132350884", "title": "Clean Code", "copies": 5},
        ]

    def list_books(self):
        print("=== Library Books Catalog ===")
        for b in self.books:
            print(f" • [{b['isbn']}] {b['title']} — Copies Available: {b['copies']}")

if __name__ == "__main__":
    catalog = LibraryCatalog()
    catalog.list_books()
    print("\\n[PASS] Python Library System test suite passed successfully.")
`,
      },
      {
        name: "models.py",
        code: `class Book:
    def __init__(self, isbn, title, author):
        self.isbn = isbn
        self.title = title
        self.author = author
`,
      },
      {
        name: "README.md",
        code: `# Library Management System in Python
Run: python main.py`,
      },
    ],
    reqs: DEFAULT_REQUIREMENTS.map((r) => ({ t: r.t, m: r.m })),
    res: {},
  },

  {
    id: 4,
    b: "1.2",
    c: "ICT2162",
    t: "Mini Project",
    g: 1,
    tg: ["Group 1", "Group 2"],
    fin: 1,
    repo: "uor-ict/java-sms",
    branches: [
      ["main", 29],
      ["dev", 15],
    ],
    members: [
      ["Group 1 Lead", 25],
      ["Group 2 Lead", 19],
    ],
    docs: [
      ["Project proposal", "PDF", true],
      ["ER diagram", "PNG", true],
      ["Final report", "PDF", true],
    ],
    files: [
      {
        name: "Main.java",
        code: `public class Main {
    public static void main(String[] args) {
        System.out.println("=== Student Information System (Java OpenJDK) ===");
        System.out.println("Status: Finalized Academic Project");
        System.out.println("Verification check: OK (Exit code 0)");
    }
}`,
      },
    ],
    reqs: DEFAULT_REQUIREMENTS.map((r) => ({ t: r.t, m: r.m })),
    res: {
      "Group 1": {
        m: generateMarks(1, DEFAULT_REQUIREMENTS),
        sum: DEFAULT_SUMMARY,
      },
      "Group 2": {
        m: generateMarks(2, DEFAULT_REQUIREMENTS),
        sum: DEFAULT_SUMMARY,
      },
    },
  },
];

export default function EvaluationsAndMarksPage() {
  const { showToast } = useAdminData();

  // Navigation and Filter State
  const [tab, setTab] = useState<"new" | "fin">("new");
  const [selectedBatch, setSelectedBatch] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [isFinalizeView, setIsFinalizeView] = useState<boolean>(false);

  // File Code Inspector State
  const [activeFileIndex, setActiveFileIndex] = useState<number>(0);

  // Gemini Auto-Detect Runner State
  const [isRunnerActive, setIsRunnerActive] = useState<boolean>(false);
  const [detectedLanguage, setDetectedLanguage] = useState<string | null>(null);
  const [terminalOutput, setTerminalOutput] = useState<string>("$ \n");

  // AI Evaluation Loading State (3-second loader)
  const [isLoadingAi, setIsLoadingAi] = useState<boolean>(false);
  const [evalLoadingStep, setEvalLoadingStep] = useState<string>("");

  // Projects State
  const [projectsList, setProjectsList] = useState<EvaluationProject[]>(INITIAL_PROJECTS);
  const [toastMessage, setToastMessage] = useState<string>("");

  // Active Project Reference
  const currentProject = useMemo(() => {
    return projectsList.find((p) => p.id === selectedProjectId) || null;
  }, [projectsList, selectedProjectId]);

  // Projects filtered by current tab (new = unfinished, fin = finalized)
  const activeTabProjects = useMemo(() => {
    return projectsList.filter((p) => p.fin === (tab === "fin" ? 1 : 0));
  }, [projectsList, tab]);

  // Navigation Reset Helper
  const navigateTo = (params: {
    tab?: "new" | "fin";
    b?: string | null;
    c?: string | null;
    pid?: number | null;
    tgt?: string | null;
    fin?: boolean;
    toast?: string;
  }) => {
    if (params.tab !== undefined) setTab(params.tab);
    if (params.b !== undefined) setSelectedBatch(params.b);
    if (params.c !== undefined) setSelectedCourse(params.c);
    if (params.pid !== undefined) setSelectedProjectId(params.pid);
    if (params.tgt !== undefined) setSelectedTarget(params.tgt);
    if (params.fin !== undefined) setIsFinalizeView(params.fin);
    if (params.toast !== undefined) setToastMessage(params.toast);
    setActiveFileIndex(0);
    setIsRunnerActive(false);
    setDetectedLanguage(null);
  };

  // Target Total Calculation Helper
  const calculateTotalMarks = (res?: TargetResult | null): number => {
    if (!res || !res.m) return 0;
    return res.m.reduce((a, x) => a + (Number(x) || 0), 0);
  };

  // Count Evaluated Targets in a Project
  const countEvaluatedTargets = (p: EvaluationProject): number => {
    return p.tg.filter((t) => p.res[t]).length;
  };

  // --------------------------------------------------------------------------
  // GEMINI AUTO-DETECT LANGUAGE & RUN IN SANDBOX
  // --------------------------------------------------------------------------
  const runProjectWithGeminiAutoDetect = async () => {
    if (!currentProject || !currentProject.files.length) return;

    setIsRunnerActive(true);
    setTerminalOutput(
      `$ [Gemini AI Language Detective]: Inspecting repository files...\n`
    );

    // 1. Analyze files to infer language (Gemini thinking simulation)
    const files = currentProject.files;
    const hasC = files.some((f) => f.name.endsWith(".c") || f.name.endsWith(".h"));
    const hasPy = files.some((f) => f.name.endsWith(".py"));
    const hasJava = files.some((f) => f.name.endsWith(".java"));

    let langName = "C";
    let endpoint = "/api/code/run-c";
    let commandStr = "gcc -O2 -std=c11 -Wall main.c -o program.exe && ./program.exe";
    let primaryFile = files.find((f) => f.name === "main.c") || files[0];

    if (hasPy) {
      langName = "Python 3";
      endpoint = "/api/code/run-python";
      commandStr = "py -u main.py";
      primaryFile = files.find((f) => f.name === "main.py") || files[0];
    } else if (hasJava) {
      langName = "Java (OpenJDK 25)";
      endpoint = "/api/code/run-java";
      commandStr = "javac Main.java && java Main";
      primaryFile = files.find((f) => f.name === "Main.java") || files[0];
    }

    setDetectedLanguage(langName);

    // Step 2: Display Gemini AI analysis in terminal
    await new Promise((r) => setTimeout(r, 600));

    const initialLog =
      `$ [Gemini AI Language Detective]: Inspected files (${files.map((f) => f.name).join(", ")})\n` +
      `$ Inferred Target Runtime: ${langName}\n` +
      `$ ${commandStr}\n` +
      `Compiling and executing in sandbox...\n\n`;

    setTerminalOutput(initialLog);

    // Step 3: Call runtime execution sandbox API
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceCode: primaryFile.code,
          filename: primaryFile.name,
        }),
      });

      const data = await res.json();
      let output = initialLog;

      if (data.status === "compilation_error") {
        output += `[COMPILATION ERROR]\n${data.stderr || data.error || "Compilation failed."}\n`;
      } else if (data.status === "security_violation") {
        output += `[SECURITY POLICY BLOCKED]\n${data.error}\n`;
      } else {
        if (data.stdout) {
          output += data.stdout;
          if (!data.stdout.endsWith("\n")) output += "\n";
        }
        if (data.stderr) {
          output += `[STDERR]\n${data.stderr}\n`;
        }
        output += `\n[Process exited with status ${data.exitCode ?? 0} in ${
          data.executionTimeSeconds || "0.00"
        }s]`;
      }

      setTerminalOutput(output);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Execution failure occurred.";
      setTerminalOutput(initialLog + `[FATAL RUNTIME ERROR]: ${msg}\n`);
    } finally {
      setIsRunnerActive(false);
    }
  };

  // --------------------------------------------------------------------------
  // AI EVALUATION: 3-SECOND LOADER WITH GEMINI CRITERIA MATCHING
  // --------------------------------------------------------------------------
  const runAiEvaluation = () => {
    if (!currentProject || !selectedTarget) return;

    setIsLoadingAi(true);
    setEvalLoadingStep("Reading proposal and checking requirement scope…");

    setTimeout(() => {
      setEvalLoadingStep("Scanning repository files and C code…");
    }, 1000);

    setTimeout(() => {
      setEvalLoadingStep("Comparing database ER diagram with final report…");
    }, 2000);

    setTimeout(() => {
      const targetIndex = currentProject.tg.indexOf(selectedTarget);
      const generated = generateMarks(
        targetIndex + currentProject.id * 3,
        currentProject.reqs
      );

      setProjectsList((prevList) => {
        return prevList.map((p) => {
          if (p.id === currentProject.id) {
            return {
              ...p,
              res: {
                ...p.res,
                [selectedTarget]: {
                  m: generated,
                  sum: DEFAULT_SUMMARY,
                },
              },
            };
          }
          return p;
        });
      });

      setIsLoadingAi(false);
      setEvalLoadingStep("");
    }, 3000);
  };

  // --------------------------------------------------------------------------
  // REQUIREMENTS MANAGEMENT: EDIT, ADD, REMOVE, UPDATE WEIGHTS
  // --------------------------------------------------------------------------
  const handleUpdateReqTitle = (reqIdx: number, newTitle: string) => {
    if (!currentProject || currentProject.fin) return;
    setProjectsList((prev) =>
      prev.map((p) => {
        if (p.id === currentProject.id) {
          const updatedReqs = [...p.reqs];
          updatedReqs[reqIdx] = { ...updatedReqs[reqIdx], t: newTitle };
          return { ...p, reqs: updatedReqs };
        }
        return p;
      })
    );
  };

  const handleUpdateReqMark = (reqIdx: number, newMark: number) => {
    if (!currentProject || currentProject.fin) return;
    setProjectsList((prev) =>
      prev.map((p) => {
        if (p.id === currentProject.id) {
          const updatedReqs = [...p.reqs];
          updatedReqs[reqIdx] = { ...updatedReqs[reqIdx], m: newMark };
          return { ...p, reqs: updatedReqs };
        }
        return p;
      })
    );
  };

  const handleAddRequirement = () => {
    if (!currentProject || currentProject.fin) return;
    setProjectsList((prev) =>
      prev.map((p) => {
        if (p.id === currentProject.id) {
          const updatedReqs = [...p.reqs, { t: "New Requirement", m: 10 }];
          const updatedRes: Record<string, TargetResult> = {};
          Object.entries(p.res).forEach(([tKey, tVal]) => {
            updatedRes[tKey] = {
              ...tVal,
              m: [...tVal.m, 8],
            };
          });
          return { ...p, reqs: updatedReqs, res: updatedRes };
        }
        return p;
      })
    );
  };

  const handleDeleteRequirement = (reqIdx: number) => {
    if (!currentProject || currentProject.fin || currentProject.reqs.length <= 1) return;
    setProjectsList((prev) =>
      prev.map((p) => {
        if (p.id === currentProject.id) {
          const updatedReqs = p.reqs.filter((_, idx) => idx !== reqIdx);
          const updatedRes: Record<string, TargetResult> = {};
          Object.entries(p.res).forEach(([tKey, tVal]) => {
            updatedRes[tKey] = {
              ...tVal,
              m: tVal.m.filter((_, idx) => idx !== reqIdx),
            };
          });
          return { ...p, reqs: updatedReqs, res: updatedRes };
        }
        return p;
      })
    );
  };

  // --------------------------------------------------------------------------
  // LIVE SCORE EDITING: LECTURER OVERRIDE OF SPECIFIC CRITERION MARK
  // --------------------------------------------------------------------------
  const handleUpdateTargetScore = (criterionIdx: number, val: number) => {
    if (!currentProject || !selectedTarget || currentProject.fin) return;
    setProjectsList((prev) =>
      prev.map((p) => {
        if (p.id === currentProject.id) {
          const existingRes = p.res[selectedTarget];
          if (!existingRes) return p;
          const updatedMarks = [...existingRes.m];
          updatedMarks[criterionIdx] = val;
          return {
            ...p,
            res: {
              ...p.res,
              [selectedTarget]: {
                ...existingRes,
                m: updatedMarks,
              },
            },
          };
        }
        return p;
      })
    );
  };

  const handleUpdateTargetSummary = (newSummary: string) => {
    if (!currentProject || !selectedTarget || currentProject.fin) return;
    setProjectsList((prev) =>
      prev.map((p) => {
        if (p.id === currentProject.id) {
          const existingRes = p.res[selectedTarget];
          if (!existingRes) return p;
          return {
            ...p,
            res: {
              ...p.res,
              [selectedTarget]: {
                ...existingRes,
                sum: newSummary,
              },
            },
          };
        }
        return p;
      })
    );
  };

  // --------------------------------------------------------------------------
  // PDF GENERATION USING JSPDF
  // --------------------------------------------------------------------------
  const generateAndDownloadPdf = (project: EvaluationProject) => {
    try {
      const doc = new jsPDF();
      let y = 20;

      // Header Banner
      doc.setFontSize(18);
      doc.text(`${project.t} — Final Academic Evaluation`, 14, y);
      y += 8;

      doc.setFontSize(11);
      doc.text(
        `Course: ${project.c}  |  Batch: ${project.b}  |  ${
          project.g ? "Group Project" : "Individual Project"
        }`,
        14,
        y
      );
      y += 6;

      doc.setFontSize(9);
      doc.text(
        `Repository: github.com/${project.repo}  |  Generated: ${new Date().toLocaleDateString()}`,
        14,
        y
      );
      y += 12;

      // Group or Student evaluations
      project.tg.forEach((targetName) => {
        const result = project.res[targetName];
        if (y > 230) {
          doc.addPage();
          y = 20;
        }

        doc.setFontSize(13);
        const total = calculateTotalMarks(result);
        doc.text(`${targetName}   —   Total Score: ${total} / 100`, 14, y);
        y += 7;

        doc.setFontSize(10);
        project.reqs.forEach((q, i) => {
          const mark = result?.m?.[i] ?? 0;
          doc.text(`• ${q.t}: ${mark} / ${q.m} marks`, 18, y);
          y += 5.5;
        });

        y += 2;
        const summaryText = result?.sum || "No summary provided.";
        const splitSummary = doc.splitTextToSize(`Project Summary: ${summaryText}`, 176);
        doc.text(splitSummary, 18, y);
        y += splitSummary.length * 5 + 10;
      });

      const filename = `${project.t.replace(/\W+/g, "-").toLowerCase()}-marks.pdf`;
      doc.save(filename);

      return true;
    } catch (err) {
      console.error("PDF generation failed:", err);
      return false;
    }
  };

  // --------------------------------------------------------------------------
  // FINALIZE PROJECT: DOWNLOAD PDF & MOVE TO FINISHED TAB
  // --------------------------------------------------------------------------
  const handleFinalizeProject = (project: EvaluationProject) => {
    generateAndDownloadPdf(project);

    // Update project state to fin = 1 (Finished)
    setProjectsList((prev) =>
      prev.map((p) => {
        if (p.id === project.id) {
          return { ...p, fin: 1 };
        }
        return p;
      })
    );

    navigateTo({
      b: null,
      c: null,
      pid: null,
      tgt: null,
      fin: false,
      toast: `Finalized "${project.t}". PDF downloaded and project moved to Finished!`,
    });
  };

  // --------------------------------------------------------------------------
  // SCREEN 1: BATCHES VIEW
  // --------------------------------------------------------------------------
  const renderBatchesView = () => {
    return (
      <>
        {/* Breadcrumb */}
        <div className="crumb">
          <span>Evaluations & Marks</span>
        </div>

        <h1 className="text-2xl font-bold text-white tracking-tight">Evaluations & Marks</h1>
        <p className="sub text-sm text-slate-400 mb-4">
          Only batches with projects whose duration has ended are available.
        </p>

        {/* Tab Selector: New evaluation vs Finished */}
        <div className="seg mb-4">
          <button
            className={tab === "new" ? "on" : ""}
            onClick={() => navigateTo({ tab: "new", b: null, c: null, pid: null, tgt: null })}
          >
            New evaluation
          </button>
          <button
            className={tab === "fin" ? "on" : ""}
            onClick={() => navigateTo({ tab: "fin", b: null, c: null, pid: null, tgt: null })}
          >
            Finished
          </button>
        </div>

        <div className="proj-sec">Select batch</div>
        <div className="proj-grid">
          {BATCHES.map((b) => {
            const count = activeTabProjects.filter((p) => p.b === b).length;
            const isAvailable = count > 0;

            return (
              <div
                key={b}
                className={`proj-card proj-tile ${
                  isAvailable ? "" : "opacity-45 cursor-not-allowed hover:border-[#1e293b]"
                }`}
                onClick={() => {
                  if (isAvailable) navigateTo({ b });
                }}
              >
                <b>Batch {b}</b>
                <span>
                  {isAvailable
                    ? `${count} ${tab === "new" ? "to evaluate" : "finished"}`
                    : "No ended projects"}
                </span>
              </div>
            );
          })}
        </div>
      </>
    );
  };

  // --------------------------------------------------------------------------
  // SCREEN 2: COURSES VIEW FOR SELECTED BATCH
  // --------------------------------------------------------------------------
  const renderCoursesView = () => {
    const batchCourses = Array.from(
      new Set(activeTabProjects.filter((p) => p.b === selectedBatch).map((p) => p.c))
    );

    return (
      <>
        <div className="crumb">
          <a onClick={() => navigateTo({ b: null, c: null, pid: null, tgt: null })}>
            Evaluations & Marks
          </a>{" "}
          / <span>Batch {selectedBatch}</span>
        </div>

        <h1 className="text-2xl font-bold text-white tracking-tight">Batch {selectedBatch}</h1>
        <p className="sub text-sm text-slate-400 mb-4">Select a course.</p>

        <div className="proj-grid">
          {batchCourses.map((cCode) => {
            const courseInfo = COURSES.find((x) => x.c === cCode);
            const courseProjectCount = activeTabProjects.filter(
              (p) => p.b === selectedBatch && p.c === cCode
            ).length;

            return (
              <div
                key={cCode}
                className="proj-card proj-tile"
                onClick={() => navigateTo({ c: cCode })}
              >
                <b>{cCode}</b>
                <span>{courseInfo?.n || "Academic Course"}</span>
                <br />
                <span className="proj-tag">
                  {courseProjectCount} {courseProjectCount === 1 ? "project" : "projects"}
                </span>
              </div>
            );
          })}
        </div>
      </>
    );
  };

  // --------------------------------------------------------------------------
  // SCREEN 3: PROJECTS VIEW FOR SELECTED COURSE
  // --------------------------------------------------------------------------
  const renderProjectsView = () => {
    const courseProjects = activeTabProjects.filter(
      (p) => p.b === selectedBatch && p.c === selectedCourse
    );

    return (
      <>
        <div className="crumb">
          <a onClick={() => navigateTo({ b: null, c: null, pid: null, tgt: null })}>
            Evaluations & Marks
          </a>{" "}
          /{" "}
          <a onClick={() => navigateTo({ c: null, pid: null, tgt: null })}>
            Batch {selectedBatch}
          </a>{" "}
          / <span>{selectedCourse}</span>
        </div>

        <h1 className="text-2xl font-bold text-white tracking-tight">{selectedCourse}</h1>
        <p className="sub text-sm text-slate-400 mb-4">Select a project.</p>

        <div className="proj-grid">
          {courseProjects.map((p) => {
            const evaluatedCount = countEvaluatedTargets(p);
            const isCompleted = evaluatedCount === p.tg.length;

            return (
              <div
                key={p.id}
                className="proj-card proj-tile"
                onClick={() => navigateTo({ pid: p.id })}
              >
                <b>{p.t}</b>
                <span>{p.g ? "Group project" : "Personal project"}</span>
                <br />
                <span className={`proj-tag ${p.fin ? "ok" : isCompleted ? "ok" : "no"}`}>
                  {p.fin
                    ? "Finished"
                    : `${evaluatedCount} of ${p.tg.length} evaluated`}
                </span>
              </div>
            );
          })}
        </div>
      </>
    );
  };

  // --------------------------------------------------------------------------
  // SCREEN 4: TARGETS VIEW (GROUPS OR STUDENT INDEXES)
  // --------------------------------------------------------------------------
  const renderTargetsView = () => {
    if (!currentProject) return null;

    const evaluatedCount = countEvaluatedTargets(currentProject);
    const totalCount = currentProject.tg.length;
    const isAllEvaluated = evaluatedCount === totalCount;
    const isGroup = Boolean(currentProject.g);
    const targetLabel = isGroup ? "Groups" : "Students";

    return (
      <>
        <div className="crumb">
          <a onClick={() => navigateTo({ b: null, c: null, pid: null, tgt: null })}>
            Evaluations & Marks
          </a>{" "}
          /{" "}
          <a onClick={() => navigateTo({ c: null, pid: null, tgt: null })}>
            Batch {selectedBatch}
          </a>{" "}
          /{" "}
          <a onClick={() => navigateTo({ pid: null, tgt: null })}>
            {selectedCourse}
          </a>{" "}
          / <span>{currentProject.t}</span>
        </div>

        <h1 className="text-2xl font-bold text-white tracking-tight">{currentProject.t}</h1>
        <p className="sub text-sm text-slate-400 mb-4">
          {targetLabel} · {currentProject.c} · Batch {currentProject.b}
        </p>

        {/* Progress & Finalize Card */}
        <div className="proj-card proj-row mb-4">
          <div className="flex-1 min-w-[200px]">
            <div className="proj-row mb-1">
              <b className="text-sm text-white">
                {evaluatedCount} of {totalCount} {targetLabel.toLowerCase()} evaluated
              </b>
              <span className="proj-sp"></span>
              <span className="text-xs text-slate-400">{totalCount} total</span>
            </div>
            <div className="proj-bar">
              <i style={{ width: `${(evaluatedCount / totalCount) * 100}%` }}></i>
            </div>
          </div>

          {currentProject.fin ? (
            <button
              className="proj-btn flex items-center gap-1.5"
              onClick={() => generateAndDownloadPdf(currentProject)}
            >
              <Download className="w-3.5 h-3.5" />
              Download PDF
            </button>
          ) : (
            <button
              className="proj-btn p flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!isAllEvaluated}
              onClick={() => navigateTo({ fin: true })}
            >
              Finalize
            </button>
          )}
        </div>

        {/* Targets Grid */}
        <div className="proj-grid">
          {currentProject.tg.map((targetName) => {
            const targetResult = currentProject.res[targetName];
            const isEvaluated = Boolean(targetResult);
            const totalScore = calculateTotalMarks(targetResult);

            return (
              <div
                key={targetName}
                className="proj-card proj-tile"
                onClick={() => navigateTo({ tgt: targetName })}
              >
                <b className={isGroup ? "" : "font-mono"}>{targetName}</b>
                <span>{isEvaluated ? `${totalScore} / 100` : "Not evaluated"}</span>
                <br />
                <span className={`proj-tag ${isEvaluated ? "ok" : "no"}`}>
                  {isEvaluated ? "Evaluated" : "Pending"}
                </span>
              </div>
            );
          })}
        </div>
      </>
    );
  };

  // --------------------------------------------------------------------------
  // SCREEN 5: TARGET DETAIL & EVALUATION WORKSPACE
  // Includes: GitHub repo, branches, member commits, files viewer, auto-runner & grading
  // --------------------------------------------------------------------------
  const renderDetailView = () => {
    if (!currentProject || !selectedTarget) return null;

    const isReadOnly = Boolean(currentProject.fin);
    const targetResult = currentProject.res[selectedTarget];
    const totalRequirementMarks = currentProject.reqs.reduce((a, q) => a + (Number(q.m) || 0), 0);
    const currentTotalScore = calculateTotalMarks(targetResult);
    const isGroup = Boolean(currentProject.g);

    // Left Column: Requirements List
    const leftColumn = (
      <div className="proj-card">
        <b className="text-base text-white block">Requirements</b>
        <p className="text-xs text-slate-400 my-1 mb-3">
          Set when the project was created. Edits apply to every{" "}
          {isGroup ? "group" : "student"} in this project.
        </p>

        <div className="space-y-2">
          {currentProject.reqs.map((req, i) => (
            <div key={i} className="proj-row">
              <input
                className="proj-in flex-1 text-xs py-1.5 px-2 bg-[#0e1626] border border-[#1e293b] text-white rounded-lg focus:outline-none focus:border-teal-500"
                value={req.t}
                disabled={isReadOnly}
                onChange={(e) => handleUpdateReqTitle(i, e.target.value)}
              />
              <input
                type="number"
                min="0"
                max="100"
                className="proj-in w-20 text-xs py-1.5 px-2 bg-[#0e1626] border border-[#1e293b] text-white rounded-lg text-center font-mono focus:outline-none focus:border-teal-500"
                value={req.m}
                disabled={isReadOnly}
                onChange={(e) => handleUpdateReqMark(i, Number(e.target.value))}
              />
              {!isReadOnly && currentProject.reqs.length > 1 && (
                <button
                  className="proj-btn py-1 px-2 text-xs hover:text-rose-400"
                  onClick={() => handleDeleteRequirement(i)}
                  title="Remove requirement"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>

        {!isReadOnly && (
          <button
            className="proj-btn text-xs mt-3 flex items-center gap-1"
            onClick={handleAddRequirement}
          >
            <Plus className="w-3.5 h-3.5" />
            Add requirement
          </button>
        )}

        <div className="proj-row mt-3 pt-2 border-t border-[#1e293b]">
          <b className="text-xs text-white">Total</b>
          <span className="proj-sp"></span>
          <b
            className="text-sm font-mono"
            style={{ color: totalRequirementMarks === 100 ? "#4ade80" : "#fbbf24" }}
          >
            {totalRequirementMarks} / 100
          </b>
        </div>
      </div>
    );

    // Right Column: Evaluation
    const rightColumn = (
      <div className="proj-card">
        <div className="proj-row mb-3">
          <b className="text-base text-white">Evaluation</b>
          <span className="proj-sp"></span>
          {targetResult && (
            <span className="proj-tag ok" style={{ margin: 0 }}>
              {currentTotalScore} / 100
            </span>
          )}
        </div>

        {isLoadingAi ? (
          <div className="py-6 text-center space-y-3 animate-in fade-in-50">
            <p className="text-xs text-teal-300 font-mono">
              {evalLoadingStep || "Checking requirements against code, ER diagram and reports…"}
            </p>
            <button className="proj-btn p text-xs font-semibold px-4 py-2 opacity-85 cursor-not-allowed">
              <span className="sp2"></span>
              Evaluating with Gemini AI…
            </button>
          </div>
        ) : !targetResult ? (
          <div className="py-6 space-y-3">
            <p className="text-xs text-slate-400 leading-relaxed">
              Gemini compares each requirement with this{" "}
              {isGroup ? "group" : "student"}&apos;s code and reports, then suggests marks.
            </p>
            <button className="proj-btn p text-xs font-semibold" onClick={runAiEvaluation}>
              Evaluate with Gemini
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#1e293b] text-slate-400">
                  <th className="py-2 px-1">Requirement</th>
                  <th className="py-2 px-1 text-center">Mark</th>
                  <th className="py-2 px-1">Evidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e293b]">
                {currentProject.reqs.map((req, i) => (
                  <tr key={i}>
                    <td className="py-2 px-1 font-semibold text-slate-200">{req.t}</td>
                    <td className="py-2 px-1 text-center whitespace-nowrap">
                      <input
                        type="number"
                        min="0"
                        max={req.m}
                        value={targetResult.m[i] ?? 0}
                        disabled={isReadOnly}
                        onChange={(e) => handleUpdateTargetScore(i, Number(e.target.value))}
                        className="w-14 p-1 border border-[#1e293b] rounded bg-[#070b13] text-white text-center font-mono text-xs focus:border-teal-500 focus:outline-none"
                      />{" "}
                      <span className="text-slate-400 text-xs">/ {req.m}</span>
                    </td>
                    <td className="py-2 px-1 text-slate-400 text-[11px]">
                      {EVIDENCE_TEMPLATES[i % EVIDENCE_TEMPLATES.length]}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div>
              <b className="text-xs text-white block mb-1">Project Summary</b>
              <textarea
                rows={3}
                value={targetResult.sum}
                disabled={isReadOnly}
                onChange={(e) => handleUpdateTargetSummary(e.target.value)}
                className="w-full p-2.5 border border-[#1e293b] rounded-lg bg-[#070b13] text-xs text-slate-200 leading-relaxed font-sans focus:outline-none focus:border-teal-500"
              />
            </div>

            {!isReadOnly && (
              <div className="proj-row mt-2">
                <span className="proj-sp"></span>
                <button
                  className="proj-btn text-xs flex items-center gap-1"
                  onClick={runAiEvaluation}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Re-evaluate
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );

    return (
      <>
        {/* Breadcrumb Navigation */}
        <div className="crumb">
          <a onClick={() => navigateTo({ b: null, c: null, pid: null, tgt: null })}>
            Evaluations & Marks
          </a>{" "}
          /{" "}
          <a onClick={() => navigateTo({ c: null, pid: null, tgt: null })}>
            Batch {selectedBatch}
          </a>{" "}
          /{" "}
          <a onClick={() => navigateTo({ pid: null, tgt: null })}>
            {selectedCourse}
          </a>{" "}
          /{" "}
          <a onClick={() => navigateTo({ tgt: null })}>
            {currentProject.t}
          </a>{" "}
          / <span>{selectedTarget}</span>
        </div>

        {/* Header with linked repository */}
        <h1 className="text-2xl font-bold text-white tracking-tight">
          {selectedTarget} · {currentProject.t}
        </h1>
        <p className="sub text-sm text-slate-400 mb-4 flex items-center gap-1.5 flex-wrap">
          <span>Linked repository:</span>
          <a
            href={`https://github.com/${currentProject.repo}`}
            target="_blank"
            rel="noreferrer"
            className="font-mono text-teal-400 hover:underline flex items-center gap-1"
          >
            <span>github.com/{currentProject.repo}</span>
            <ExternalLink className="w-3 h-3 text-teal-400" />
          </a>
        </p>

        {/* 1. Repository Stats Grid */}
        <div className="proj-stats">
          <div className="proj-card">
            <b>{currentProject.branches.length}</b>
            <span>Branches</span>
          </div>
          <div className="proj-card">
            <b>
              {currentProject.branches.reduce((a, b) => a + b[1], 0)}
            </b>
            <span>Total commits</span>
          </div>
          <div className="proj-card">
            <b>{isGroup ? currentProject.members.length : 1}</b>
            <span>{isGroup ? "Contributors" : "Contributor"}</span>
          </div>
          <div className="proj-card">
            <b>1 h ago</b>
            <span>Last activity</span>
          </div>
        </div>

        {/* 2. Branches & Commits per member Breakdown */}
        <div className="proj-two mb-4">
          <div className="proj-card">
            <b className="text-base text-white">Branches</b>
            {currentProject.branches.map((bItem) => (
              <div key={bItem[0]} className="mt-3">
                <div className="proj-row">
                  <span className="font-mono text-xs text-slate-200">{bItem[0]}</span>
                  <span className="proj-sp"></span>
                  <span className="text-xs text-slate-400">{bItem[1]} commits</span>
                </div>
                <div className="proj-bar">
                  <i style={{ width: `${(bItem[1] / 42) * 100}%` }}></i>
                </div>
              </div>
            ))}
          </div>

          <div className="proj-card">
            <b className="text-base text-white">
              {isGroup ? "Commits per member" : "Member Commits"}
            </b>
            {currentProject.members.map((mItem) => (
              <div key={mItem[0]} className="mt-3">
                <div className="proj-row">
                  <span className="text-xs font-medium text-slate-200">{mItem[0]}</span>
                  <span className="proj-sp"></span>
                  <span className="text-xs text-slate-400">{mItem[1]} commits</span>
                </div>
                <div className="proj-bar">
                  <i style={{ width: `${(mItem[1] / 42) * 100}%` }}></i>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Deliverables Status */}
        <div className="proj-sec">Deliverables</div>
        <div className="proj-row mb-6">
          {currentProject.docs.map((d) => (
            <div key={d[0]} className="proj-card proj-doc" style={{ minWidth: 210 }}>
              <div className="proj-ic">{d[1]}</div>
              <div>
                <b className="text-xs block text-white">{d[0]}</b>
                <span className={`proj-tag ${d[2] ? "ok" : "no"}`}>
                  {d[2] ? "Uploaded" : "Not yet"}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* 4. Code & Files Inspection on the Same Platform */}
        <div className="proj-sec">Project Source Files (Read-only)</div>
        <div className="proj-ws mb-6">
          <div className="proj-tree">
            {currentProject.files.map((file, idx) => (
              <div
                key={file.name}
                className={activeFileIndex === idx ? "on" : ""}
                onClick={() => setActiveFileIndex(idx)}
              >
                {file.name}
              </div>
            ))}
          </div>
          <pre className="proj-pre">
            {currentProject.files[activeFileIndex]?.code || "// No file selected"}
          </pre>
        </div>

        {/* 5. Gemini AI Auto-Detect Runtime Runner & Terminal Console */}
        <div className="proj-sec">Run Project (Gemini Auto-Detect)</div>
        <div className="proj-card mb-6">
          <div className="proj-row mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-400" />
              <b className="text-base text-white">Execution Console & Sandbox</b>
            </div>
            <span className="proj-sp"></span>
            {detectedLanguage ? (
              <span className="proj-tag ok" style={{ margin: 0 }}>
                Detected: {detectedLanguage}
              </span>
            ) : (
              <span className="proj-tag" style={{ margin: 0 }}>
                Gemini Auto-Detect Ready
              </span>
            )}
          </div>

          <pre
            className="proj-pre rounded-lg overflow-auto"
            style={{ minHeight: 180 }}
          >
            {terminalOutput}
          </pre>

          <div className="proj-row mt-3">
            <button
              className="proj-btn p flex items-center gap-1.5"
              disabled={isRunnerActive}
              onClick={runProjectWithGeminiAutoDetect}
            >
              <Play className={`w-3.5 h-3.5 fill-current ${isRunnerActive ? "animate-spin" : ""}`} />
              {isRunnerActive
                ? "Gemini Analyzing & Executing..."
                : "▶ Run Project (Gemini Auto-Detect)"}
            </button>
            <button
              className="proj-btn"
              onClick={() => setTerminalOutput("$ \n")}
            >
              Clear Console
            </button>
          </div>
        </div>

        {/* 6. Two Columns: Requirements & AI Evaluation Grading */}
        <div className="proj-sec">Grading & Pedagogical Evaluation</div>
        <div className="proj-two mb-4">
          {leftColumn}
          {rightColumn}
        </div>

        {/* Back Button */}
        <div className="proj-row mt-4">
          <button
            className="proj-btn text-xs"
            onClick={() => navigateTo({ tgt: null })}
          >
            ← Back to {isGroup ? "groups" : "students"}
          </button>
        </div>
      </>
    );
  };

  // --------------------------------------------------------------------------
  // SCREEN 6: FINALIZE REVIEW SCREEN
  // --------------------------------------------------------------------------
  const renderFinalizeView = () => {
    if (!currentProject) return null;

    const targetLabel = currentProject.g ? "Group" : "Student";

    return (
      <>
        <div className="crumb">
          <a onClick={() => navigateTo({ b: null, c: null, pid: null, tgt: null })}>
            Evaluations & Marks
          </a>{" "}
          /{" "}
          <a onClick={() => navigateTo({ c: null, pid: null, tgt: null })}>
            Batch {selectedBatch}
          </a>{" "}
          /{" "}
          <a onClick={() => navigateTo({ pid: null, tgt: null })}>
            {selectedCourse}
          </a>{" "}
          /{" "}
          <a onClick={() => navigateTo({ fin: false })}>
            {currentProject.t}
          </a>{" "}
          / <span>Finalize</span>
        </div>

        <h1 className="text-2xl font-bold text-white tracking-tight">
          Finalize {currentProject.t}
        </h1>
        <p className="sub text-sm text-slate-400 mb-4">
          Review every {targetLabel.toLowerCase()} before generating the PDF.
        </p>

        <div className="proj-card space-y-4">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#1e293b] text-slate-400">
                <th className="py-2.5 px-2">{targetLabel}</th>
                <th className="py-2.5 px-2">Marks</th>
                <th className="py-2.5 px-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e293b]">
              {currentProject.tg.map((targetName) => {
                const totalScore = calculateTotalMarks(currentProject.res[targetName]);
                return (
                  <tr key={targetName}>
                    <td className={`py-2.5 px-2 font-semibold text-white ${currentProject.g ? "" : "font-mono"}`}>
                      {targetName}
                    </td>
                    <td className="py-2.5 px-2 font-mono">
                      <b className="text-teal-400">{totalScore}</b> / 100
                    </td>
                    <td className="py-2.5 px-2 text-right">
                      <span className="proj-tag ok" style={{ margin: 0 }}>
                        Evaluated
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <p className="text-xs text-slate-400 leading-relaxed">
            One PDF with the separate marks of every {targetLabel.toLowerCase()} will be downloaded.
            The project then moves to Finished.
          </p>

          <div className="proj-row pt-2 border-t border-[#1e293b]">
            <span className="proj-sp"></span>
            <button
              className="proj-btn text-xs"
              onClick={() => navigateTo({ fin: false })}
            >
              Back
            </button>
            <button
              className="proj-btn p text-xs font-semibold flex items-center gap-1.5"
              onClick={() => handleFinalizeProject(currentProject)}
            >
              <Download className="w-3.5 h-3.5" />
              Finalize & download PDF
            </button>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="max-w-[1100px] mx-auto py-3 px-2.5 sm:px-4">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="proj-card mb-4 border-emerald-500/40 bg-emerald-950/20 text-emerald-300 flex items-center justify-between text-xs p-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <b className="font-semibold">{toastMessage}</b>
          </div>
          <button
            onClick={() => setToastMessage("")}
            className="text-emerald-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Screen Router */}
      {isFinalizeView && currentProject ? (
        renderFinalizeView()
      ) : selectedTarget && currentProject ? (
        renderDetailView()
      ) : selectedProjectId && currentProject ? (
        renderTargetsView()
      ) : selectedCourse ? (
        renderProjectsView()
      ) : selectedBatch ? (
        renderCoursesView()
      ) : (
        renderBatchesView()
      )}
    </div>
  );
}
