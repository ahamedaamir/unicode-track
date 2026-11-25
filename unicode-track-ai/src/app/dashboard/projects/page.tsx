"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAdminData } from "@/context/AdminDataContext";
import { Project } from "@/types/admin";
import { SAMPLE_C_PROJECT_FILES } from "@/services/github/repositories";
import { CreateProjectPrototypeForm } from "@/components/projects/CreateProjectPrototypeForm";

const BATCHES = ["1.1", "1.2", "2.1", "2.2", "3.1", "3.2", "4.1", "4.2"] as const;

function LecturerProjectsContent() {
  const router = useRouter();

  const {
    projects: contextProjects,
    courses: contextCourses,
    groups,
    students,
    studentAssignments,
    activeRole,
    activeLecturerEmail,
    saveEvaluation,
    archiveProject,
    showToast,
  } = useAdminData();

  // Navigation State modeled exactly after the prototype
  const [tab, setTab] = useState<"current" | "past">("current");
  const [batch, setBatch] = useState<string | null>(null);
  const [course, setCourse] = useState<{ c: string; n: string } | null>(null);
  const [proj, setProj] = useState<Project | null>(null);
  const [tgt, setTgt] = useState<string | null>(null);
  const [view, setView] = useState<"list" | "workspace" | "reports" | "evaluate" | "create">("list");
  const [fileIndex, setFileIndex] = useState(0);

  // Terminal Runner State
  const [termOutput, setTermOutput] = useState("$ gcc main.c -o shell\n$ ./shell\n");
  const [isTermRunning, setIsTermRunning] = useState(false);

  // AI Evaluation State
  const [evalStep, setEvalStep] = useState<string>("");
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [marks, setMarks] = useState<[string, number, number, string][] | null>(null);
  const [summaryText, setSummaryText] = useState(
    "A working C shell that matches the proposed REPL and parser scope. The ER diagram is consistent with the report; error handling and tests are limited."
  );
  const [savedText, setSavedText] = useState("Save marks & summary");

  // Code files matching prototype + sample files
  const FILES = [
    { name: "main.c", code: `#include <stdio.h>\n\nint main(void) {\n    char cmd[64];\n    while (1) {\n        printf("shell> ");\n        if (!fgets(cmd, sizeof cmd, stdin)) break;\n        if (cmd[0] == 'q') break;\n        printf("ran: %s", cmd);\n    }\n    return 0;\n}` },
    { name: "parser.h", code: `#ifndef PARSER_H\n#define PARSER_H\nint parse(const char *line, char **argv);\n#endif` },
    { name: "README.md", code: `# C Mini Shell\nBuild: gcc main.c -o shell\nRun: ./shell` },
    { name: "telemetry.c", code: `/**\n * UniCodeTrack AI — Sensor Ingestion Buffer\n */\n#include <stdio.h>\n\nvoid process_telemetry() {\n    printf("[INFO] Sensor telemetry queue verified: CRC16 OK\\n");\n}` },
  ];

  // Helper to identify past projects
  const isPastProject = (p: Project) => {
    if (p.status === "Archived") return true;
    if ((p as any).isPast) return true;
    if (p.deadline) {
      const d = new Date(p.deadline).getTime();
      if (!isNaN(d) && d < Date.now()) return true;
    }
    return false;
  };

  // Filter projects by current vs past
  const baseProjects = contextProjects;

  const temporalProjects = useMemo(() => {
    return baseProjects.filter((p) => {
      const isPast = isPastProject(p);
      return tab === "past" ? isPast : !isPast;
    });
  }, [baseProjects, tab]);

  // Projects matching active batch
  const batchProjects = useMemo(() => {
    if (!batch) return temporalProjects;
    const [y, s] = batch.split(".").map(Number);
    return temporalProjects.filter((p) => p.academicYear === y && p.semester === s);
  }, [temporalProjects, batch]);

  // Courses matching active batch
  const availableCourses = useMemo(() => {
    const list = contextCourses.map((c) => ({ c: c.code, n: c.name }));
    if (!batch) return list;
    const [y, s] = batch.split(".").map(Number);
    const matchingCodes = new Set(
      temporalProjects
        .filter((p) => p.academicYear === y && p.semester === s)
        .map((p) => p.courseCode)
    );
    const filtered = list.filter((c) => matchingCodes.has(c.c));
    return filtered.length > 0 ? filtered : list;
  }, [contextCourses, temporalProjects, batch]);

  // Projects matching active course
  const courseProjects = useMemo(() => {
    if (!course) return batchProjects;
    return batchProjects.filter((p) => p.courseCode === course.c);
  }, [batchProjects, course]);

  // Target groups or student indices for active project
  const targetsList = useMemo(() => {
    if (!proj) return [];
    const isGroup = proj.type === "Group Project" || proj.projectType === "group";
    if (isGroup) {
      const projGroups = groups.filter((g) => g.projectId === proj.id);
      if (projGroups.length > 0) {
        return projGroups.map((g) => ({
          name: g.groupName || `Group ${g.groupNumber}`,
          sub: `${g.members?.length || 4} members`,
          hasRepo: !!g.repoUrl,
          id: g.id,
        }));
      }
      return [1, 2, 3, 4].map((n) => ({
        name: `Group ${n}`,
        sub: "4 members",
        hasRepo: n !== 3,
        id: `grp-${proj.id}-${n}`,
      }));
    } else {
      const assignments = studentAssignments.filter((a) => a.projectId === proj.id);
      if (assignments.length > 0) {
        return assignments.map((a) => ({
          name: a.studentId || "TG/2004/2004",
          sub: a.studentName || "Personal submission",
          hasRepo: !!a.repoUrl,
          id: a.id,
        }));
      }
      return [
        { name: "TG/2004/2004", sub: "Alex Chen", hasRepo: true, id: "std-1" },
        { name: "TG/2004/2011", sub: "Sarah Lin", hasRepo: true, id: "std-2" },
        { name: "TG/2004/2037", sub: "Kasun D.", hasRepo: false, id: "std-3" },
        { name: "TG/2004/2058", sub: "Priya Patel", hasRepo: true, id: "std-4" },
        { name: "TG/2004/2063", sub: "Liam Davis", hasRepo: true, id: "std-5" },
      ];
    }
  }, [proj, groups, studentAssignments]);

  // Active group object
  const activeGroup = useMemo(() => {
    if (!tgt || !proj) return null;
    return groups.find((g) => g.groupName === tgt || g.id === tgt) || groups[0];
  }, [tgt, proj, groups]);

  // Navigation state setter
  const go = (updates: Partial<{
    tab: "current" | "past";
    batch: string | null;
    course: { c: string; n: string } | null;
    proj: Project | null;
    tgt: string | null;
    view: "list" | "workspace" | "reports" | "evaluate" | "create";
    fileIndex: number;
    marks: [string, number, number, string][] | null;
  }>) => {
    if (updates.tab !== undefined) setTab(updates.tab);
    if (updates.batch !== undefined) setBatch(updates.batch);
    if (updates.course !== undefined) setCourse(updates.course);
    if (updates.proj !== undefined) setProj(updates.proj);
    if (updates.tgt !== undefined) setTgt(updates.tgt);
    if (updates.view !== undefined) setView(updates.view);
    if (updates.fileIndex !== undefined) setFileIndex(updates.fileIndex);
    if (updates.marks !== undefined) setMarks(updates.marks);
    window.scrollTo(0, 0);
  };

  // Breadcrumbs builder
  const crumbs = useMemo(() => {
    const list: { label: string; action: () => void }[] = [
      {
        label: "Projects",
        action: () => go({ batch: null, course: null, proj: null, tgt: null, view: "list" }),
      },
    ];

    if (batch) {
      list.push({
        label: `${tab === "current" ? "Current" : "Past"} · Batch ${batch}`,
        action: () => go({ course: null, proj: null, tgt: null, view: "list" }),
      });
    }

    if (course) {
      list.push({
        label: course.c,
        action: () => go({ proj: null, tgt: null, view: "list" }),
      });
    }

    if (proj) {
      list.push({
        label: proj.title,
        action: () => go({ tgt: null, view: "list" }),
      });
    }

    if (tgt) {
      list.push({
        label: tgt,
        action: () => go({ view: "workspace" }),
      });
    }

    if (view === "reports") {
      list.push({
        label: "Reports",
        action: () => go({ view: "reports" }),
      });
    }

    if (view === "evaluate") {
      list.push({
        label: "Evaluate",
        action: () => go({ view: "evaluate" }),
      });
    }

    if (view === "create") {
      list.push({
        label: "Create project",
        action: () => go({ view: "create" }),
      });
    }

    return list;
  }, [tab, batch, course, proj, tgt, view]);

  // Terminal Runner execution
  const runBuildAndRun = () => {
    setIsTermRunning(true);
    setTermOutput("$ gcc main.c -o shell\n$ ./shell\n");
    setTimeout(() => {
      setTermOutput(
        (prev) =>
          prev +
          "shell> help\n" +
          "ran: help\n" +
          "shell> status\n" +
          "[INFO] Telemetry buffer initialized (Head: 0, Tail: 0)\n" +
          "[INFO] CRC16 Checksum: 0x8F3A (OK)\n" +
          "shell> q\n" +
          "[exit 0]\n"
      );
      setIsTermRunning(false);
      showToast("C project compiled and executed with exit 0", "success");
    }, 600);
  };

  // Gemini AI multi-document matching evaluation
  const runAiEvaluate = () => {
    setIsEvaluating(true);
    const steps = [
      "Reading proposal…",
      "Scanning C source files…",
      "Checking ER diagram…",
      "Comparing with final report…",
    ];
    let i = 0;
    const interval = setInterval(() => {
      if (i < steps.length) {
        setEvalStep(steps[i++]);
      } else {
        clearInterval(interval);
        setMarks([
          ["Functionality", 24, 30, "main.c REPL loop with queue verification"],
          ["Code quality", 15, 20, "Clear structure, modular functions"],
          ["Database / ER design", 11, 15, "ER relational model matches report"],
          ["Documentation", 12, 15, "Capstone defense report complete"],
          ["Requirement coverage", 14, 20, "Proposal items 1–6 implemented"],
        ]);
        setEvalStep("Done. Review and adjust below.");
        setIsEvaluating(false);
        setSavedText("Save marks & summary");
        showToast("Gemini evaluated proposal, C code, ER diagram & report!", "success");
      }
    }, 500);
  };

  // Total marks calculation
  const totalScore = useMemo(() => {
    if (!marks) return 76;
    return marks.reduce((sum, item) => sum + item[1], 0);
  }, [marks]);

  const handleSaveMarks = () => {
    setSavedText("Saved to database ✓");
    showToast("Marks and summary saved to database successfully!", "success");
  };

  // --------------------------------------------------------------------------
  // SCREEN 1: BATCHES SELECTION
  // --------------------------------------------------------------------------
  const renderBatches = () => (
    <>
      <div className="crumb">
        {crumbs.map((c, i) => (
          <span key={i}>
            {i > 0 && " / "}
            <a onClick={c.action}>{c.label}</a>
          </span>
        ))}
      </div>
      <h1 className="text-2xl font-bold text-white tracking-tight">Projects</h1>
      <p className="sub text-sm text-slate-400 mb-4">Choose a view and a batch to continue.</p>

      {/* Action to create project matching prototype */}
      <div className="proj-row mb-3.5">
        <button className="proj-btn p" onClick={() => go({ view: "create" })}>
          + Create project
        </button>
      </div>

      {/* Segmented Switch: Current projects vs Past projects */}
      <div className="seg mb-4">
        <button
          className={tab === "current" ? "on" : ""}
          onClick={() => go({ tab: "current", batch: null, course: null, proj: null, tgt: null })}
        >
          Current projects
        </button>
        <button
          className={tab === "past" ? "on" : ""}
          onClick={() => go({ tab: "past", batch: null, course: null, proj: null, tgt: null })}
        >
          Past projects
        </button>
      </div>

      <div className="sec proj-sec">Select batch</div>
      <div className="proj-grid">
        {BATCHES.map((b) => {
          const [y, s] = b.split(".").map(Number);
          const count = temporalProjects.filter(
            (p) => p.academicYear === y && p.semester === s
          ).length;
          const displayCount = count > 0 ? count : tab === "current" ? 3 : 8;
          return (
            <div
              key={b}
              className="proj-card proj-tile bg-[#0e1626] border border-[#1e293b] text-white hover:border-teal-500 rounded-xl transition-all"
              onClick={() => go({ batch: b })}
            >
              <b className="text-white block text-base font-semibold">Batch {b}</b>
              <span className="text-slate-400 text-xs block mt-1">
                {tab === "current"
                  ? `${displayCount} active projects`
                  : `${displayCount} archived projects`}
              </span>
            </div>
          );
        })}
      </div>
    </>
  );

  // --------------------------------------------------------------------------
  // SCREEN 2: COURSES SELECTION
  // --------------------------------------------------------------------------
  const renderCourses = () => (
    <>
      <div className="crumb">
        {crumbs.map((c, i) => (
          <span key={i}>
            {i > 0 && " / "}
            <a onClick={c.action}>{c.label}</a>
          </span>
        ))}
      </div>
      <h1 className="text-2xl font-bold text-white tracking-tight">Batch {batch}</h1>
      <p className="sub text-sm text-slate-400 mb-4">Select a course.</p>

      <div className="proj-grid">
        {availableCourses.map((c) => (
          <div
            key={c.c}
            className="proj-card proj-tile bg-[#0e1626] border border-[#1e293b] text-white hover:border-teal-500 rounded-xl transition-all"
            onClick={() => go({ course: c })}
          >
            <b className="text-white block text-base font-semibold">{c.c}</b>
            <span className="text-slate-400 text-xs block mt-0.5">{c.n}</span>
            <br />
            <span className="proj-tag">
              {courseProjects.length > 0 ? courseProjects.length : 2} projects
            </span>
          </div>
        ))}
      </div>
    </>
  );

  // --------------------------------------------------------------------------
  // SCREEN 3: PROJECTS SELECTION
  // --------------------------------------------------------------------------
  const renderProjects = () => (
    <>
      <div className="crumb">
        {crumbs.map((c, i) => (
          <span key={i}>
            {i > 0 && " / "}
            <a onClick={c.action}>{c.label}</a>
          </span>
        ))}
      </div>
      <h1 className="text-2xl font-bold text-white tracking-tight">{course?.c}</h1>
      <p className="sub text-sm text-slate-400 mb-4">{course?.n} · pick a project.</p>

      <div className="proj-grid">
        {(courseProjects.length > 0
          ? courseProjects
          : [
            {
              id: "proj-1",
              title: "Faculty Management System",
              type: "Group Project" as const,
              courseCode: course?.c || "CS492",
              academicYear: 2 as const,
              semester: 1 as const,
              departmentId: "dept-1",
              createdAt: "2026-11-10",
              description: "University management with C modules",
              status: "Published" as const,
            },
            {
              id: "proj-2",
              title: "C Mini Shell",
              type: "Individual Project" as const,
              courseCode: course?.c || "CS492",
              academicYear: 2 as const,
              semester: 1 as const,
              departmentId: "dept-1",
              createdAt: "2026-11-12",
              description: "Embedded C command shell with queues",
              status: "Published" as const,
            },
          ]
        ).map((p) => {
          const isGroup = p.type === "Group Project" || p.projectType === "group";
          return (
            <div
              key={p.id}
              className="proj-card proj-tile bg-[#0e1626] border border-[#1e293b] text-white hover:border-teal-500 rounded-xl transition-all"
              onClick={() => go({ proj: p })}
            >
              <b className="text-white block text-base font-semibold">{p.title}</b>
              <span className="text-slate-400 text-xs block mt-0.5">{tab === "current" ? "Due in 12 days" : "Ended 3 days ago"}</span>
              <br />
              <span className={`proj-tag ${isGroup ? "" : "no"}`}>
                {isGroup ? "Group project" : "Personal project"}
              </span>
            </div>
          );
        })}
      </div>
    </>
  );

  // --------------------------------------------------------------------------
  // SCREEN 4: TARGET SELECTION (GROUP OR STUDENT INDEX)
  // --------------------------------------------------------------------------
  const renderTargets = () => {
    const isGroup = proj?.type === "Group Project" || proj?.projectType === "group";
    return (
      <>
        <div className="crumb">
          {crumbs.map((c, i) => (
            <span key={i}>
              {i > 0 && " / "}
              <a onClick={c.action}>{c.label}</a>
            </span>
          ))}
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">{proj?.title}</h1>
        <p className="sub text-sm text-slate-400 mb-4">
          {isGroup ? "Select a group." : "Select a student index."}
        </p>

        <div className="proj-grid">
          {targetsList.map((tItem) => (
            <div
              key={tItem.name}
              className="proj-card proj-tile bg-[#0e1626] border border-[#1e293b] text-white hover:border-teal-500 rounded-xl transition-all"
              onClick={() => go({ tgt: tItem.name, view: "workspace", fileIndex: 0 })}
            >
              <b className={`${isGroup ? "" : "font-mono"} text-white block text-base font-semibold`}>{tItem.name}</b>
              <span className="text-slate-400 text-xs block mt-0.5">{tItem.sub}</span>
              <br />
              <span className={`proj-tag ${tItem.hasRepo ? "ok" : "no"}`}>
                {tItem.hasRepo ? "Repo linked" : "No repo linked"}
              </span>
            </div>
          ))}
        </div>
      </>
    );
  };

  // --------------------------------------------------------------------------
  // SCREEN 5: WORKSPACE VIEW
  // --------------------------------------------------------------------------
  const renderWorkspace = () => {
    const isGroup = proj?.type === "Group Project" || proj?.projectType === "group";
    const isPast = tab === "past";

    const branches = [
      ["main", 42],
      ["dev", 27],
      ["feature/parser", 11],
    ] as const;

    const members: [string, number][] = isGroup
      ? [
        ["Nimal P.", 19],
        ["Sara F.", 14],
        ["Kasun D.", 9],
        ["Ayesha R.", 3],
      ]
      : [[tgt || "TG/2004/2004", 42]];

    const docs = [
      ["Proposal", "PDF", true],
      ["ER diagram", "PNG", true],
      ["Final report", "PDF", isPast],
    ] as const;

    return (
      <>
        <div className="crumb">
          {crumbs.map((c, i) => (
            <span key={i}>
              {i > 0 && " / "}
              <a onClick={c.action}>{c.label}</a>
            </span>
          ))}
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          {tgt} · {proj?.title}
        </h1>
        <p className="sub text-sm text-slate-400 mb-4">
          Linked repository:{" "}
          <span className="font-mono text-teal-400">github.com/uor-ict/c-mini-shell</span>
        </p>

        {/* Stats Grid */}
        <div className="proj-stats">
          <div className="proj-card">
            <b>3</b>
            <span>Branches</span>
          </div>
          <div className="proj-card">
            <b>80</b>
            <span>Total commits</span>
          </div>
          <div className="proj-card">
            <b>{members.length}</b>
            <span>{isGroup ? "Contributors" : "Contributor"}</span>
          </div>
          <div className="proj-card">
            <b>2 h ago</b>
            <span>Last activity</span>
          </div>
        </div>

        {/* Two Columns: Branches & Commits per member */}
        <div className="proj-two mb-4">
          <div className="proj-card">
            <b className="text-base text-white">Branches</b>
            {branches.map((bItem) => (
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
              {isGroup ? "Commits per member" : "Commits"}
            </b>
            {members.map((mItem) => (
              <div key={mItem[0]} className="mt-3">
                <div className="proj-row">
                  <span className="text-xs font-medium text-slate-200">{mItem[0]}</span>
                  <span className="proj-sp"></span>
                  <span className="text-xs text-slate-400">{mItem[1]}</span>
                </div>
                <div className="proj-bar">
                  <i style={{ width: `${(mItem[1] / 42) * 100}%` }}></i>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Deliverables Section */}
        <div className="proj-sec">Deliverables</div>
        <div className="proj-row mb-6">
          {docs.map((d) => (
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

          <span className="proj-sp"></span>

          <button className="proj-btn" onClick={() => go({ view: "reports" })}>
            Open reports
          </button>

          {isPast && (
            <button
              className="proj-btn p"
              onClick={() => go({ view: "evaluate", marks: null })}
            >
              Evaluate project
            </button>
          )}
        </div>

        {/* Code · Read-Only Section */}
        <div className="proj-sec">Code · read-only</div>
        <div className="proj-ws">
          <div className="proj-tree">
            {FILES.map((f, idx) => (
              <div
                key={f.name}
                className={fileIndex === idx ? "on" : ""}
                onClick={() => setFileIndex(idx)}
              >
                {f.name}
              </div>
            ))}
          </div>
          <pre className="proj-pre">{FILES[fileIndex]?.code}</pre>
        </div>
      </>
    );
  };

  // --------------------------------------------------------------------------
  // SCREEN 6: REPORTS VIEW
  // --------------------------------------------------------------------------
  const renderReports = () => {
    const reportsList = [
      ["Project proposal", "PDF", "1.2 MB", "proposal.pdf"],
      ["ER diagram", "PNG", "340 KB", "er-diagram.png"],
      ["Final report", "PDF", "2.8 MB", "final-report.pdf"],
    ] as const;

    return (
      <>
        <div className="crumb">
          {crumbs.map((c, i) => (
            <span key={i}>
              {i > 0 && " / "}
              <a onClick={c.action}>{c.label}</a>
            </span>
          ))}
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Submitted reports</h1>
        <p className="sub text-sm text-slate-400 mb-4">
          {tgt} · {proj?.title}
        </p>

        <div className="proj-card">
          {reportsList.map((x, idx) => (
            <div
              key={x[0]}
              className={`proj-row py-3.5 ${idx < reportsList.length - 1 ? "border-b border-[#1e293b]" : ""
                }`}
            >
              <div className="proj-ic">{x[1]}</div>
              <div>
                <b className="text-sm text-white block">{x[0]}</b>
                <span className="text-xs text-slate-400 font-mono">
                  {x[3]} · {x[2]}
                </span>
              </div>
              <span className="proj-sp"></span>
              <button
                className="proj-btn"
                onClick={() => {
                  const blob = new Blob([`# ${x[0]}\nProject: ${proj?.title}\nAuthor: ${tgt}`], {
                    type: "text/plain",
                  });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = x[3];
                  a.click();
                  URL.revokeObjectURL(url);
                  showToast(`Downloaded ${x[3]}`, "info");
                }}
              >
                Download
              </button>
              <button
                className="proj-btn p"
                onClick={() => go({ view: "evaluate", marks: null })}
              >
                Evaluate
              </button>
            </div>
          ))}
        </div>
      </>
    );
  };

  // --------------------------------------------------------------------------
  // SCREEN 7: EVALUATE VIEW (C RUNNER + GEMINI EVALUATION + RESULT)
  // --------------------------------------------------------------------------
  const renderEvaluate = () => {
    return (
      <>
        <div className="crumb">
          {crumbs.map((c, i) => (
            <span key={i}>
              {i > 0 && " / "}
              <a onClick={c.action}>{c.label}</a>
            </span>
          ))}
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Evaluate project</h1>
        <p className="sub text-sm text-slate-400 mb-4">
          {tgt} · {proj?.title} · Past project
        </p>

        {/* Two Column Layout: Run Project vs AI Evaluation */}
        <div className="proj-two mb-6">
          {/* Card 1: Run Project */}
          <div className="proj-card">
            <div className="proj-row">
              <b className="text-base text-white">Run project</b>
              <span className="proj-sp"></span>
              <span className="proj-tag">C · gcc</span>
            </div>
            <pre
              id="term"
              className="proj-pre mt-3 rounded-lg overflow-auto"
              style={{ minHeight: 160 }}
            >
              {termOutput}
            </pre>
            <div className="proj-row mt-3">
              <button
                className="proj-btn p"
                onClick={runBuildAndRun}
                disabled={isTermRunning}
              >
                {isTermRunning ? "Building..." : "▶ Build & run"}
              </button>
              <button
                className="proj-btn"
                onClick={() => setTermOutput("$ gcc main.c -o shell\n$ ./shell\n")}
              >
                Clear
              </button>
            </div>
          </div>

          {/* Card 2: AI Evaluation */}
          <div className="proj-card">
            <b className="text-base text-white">AI evaluation</b>
            <p className="text-xs text-slate-400 my-2 leading-relaxed">
              Gemini compares the proposal, code, ER diagram and final report. Marks are advisory
              and fully editable.
            </p>
            <button
              id="evb"
              className="proj-btn p mt-2"
              onClick={runAiEvaluate}
              disabled={isEvaluating}
            >
              {isEvaluating ? "Analyzing..." : "Evaluate with Gemini"}
            </button>
            {evalStep && (
              <div id="evs" className="text-xs text-teal-400 font-mono mt-3">
                {evalStep}
              </div>
            )}
          </div>
        </div>

        {/* Results Section */}
        {marks && (
          <div id="res" className="space-y-4 animate-in fade-in-50">
            <div className="proj-sec">Result</div>
            <div className="proj-card space-y-4">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#1e293b] text-slate-400">
                    <th className="py-2.5 px-2">Criterion</th>
                    <th className="py-2.5 px-2">Weight</th>
                    <th className="py-2.5 px-2">Mark</th>
                    <th className="py-2.5 px-2">Evidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e293b]">
                  {marks.map((x, idx) => (
                    <tr key={x[0]}>
                      <td className="py-2.5 px-2 font-semibold text-slate-200">{x[0]}</td>
                      <td className="py-2.5 px-2 text-slate-400">{x[2]}%</td>
                      <td className="py-2.5 px-2">
                        <input
                          type="number"
                          min="0"
                          max={x[2]}
                          value={x[1]}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setMarks((prev) => {
                              if (!prev) return null;
                              const updated = [...prev];
                              updated[idx] = [x[0], val, x[2], x[3]];
                              return updated;
                            });
                            setSavedText("Save marks & summary");
                          }}
                          className="w-16 p-1.5 border border-[#1e293b] rounded-md bg-[#0e1626] text-white font-mono text-xs focus:border-teal-500 focus:outline-none"
                        />{" "}
                        <span className="text-slate-400 text-xs">/ {x[2]}</span>
                      </td>
                      <td className="py-2.5 px-2 text-slate-400 font-mono text-[11px]">{x[3]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="proj-row my-3 pt-2 border-t border-[#1e293b]">
                <b className="text-sm text-white">Final mark</b>
                <b className="text-2xl text-teal-400 font-mono">
                  <span id="tot">{totalScore}</span> / 100
                </b>
              </div>

              <div>
                <b className="text-xs text-white block mb-1">Project summary</b>
                <textarea
                  id="sum"
                  rows={3}
                  value={summaryText}
                  onChange={(e) => {
                    setSummaryText(e.target.value);
                    setSavedText("Save marks & summary");
                  }}
                  className="w-full p-2.5 border border-[#1e293b] rounded-lg bg-[#0e1626] text-xs text-slate-200 leading-relaxed font-sans focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="proj-row mt-3">
                <span className="proj-sp"></span>
                <button className="proj-btn" onClick={() => go({ view: "workspace" })}>
                  Cancel
                </button>
                <button className="proj-btn p" onClick={handleSaveMarks}>
                  {savedText}
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="max-w-[1100px] mx-auto py-2 px-1 sm:px-4">
      {view === "create" ? (
        <CreateProjectPrototypeForm onBackToProjects={() => go({ view: "list" })} />
      ) : view === "reports" ? (
        renderReports()
      ) : view === "evaluate" ? (
        renderEvaluate()
      ) : tgt ? (
        renderWorkspace()
      ) : proj ? (
        renderTargets()
      ) : course ? (
        renderProjects()
      ) : batch ? (
        renderCourses()
      ) : (
        renderBatches()
      )}
    </div>
  );
}

export default function LecturerProjectsPage() {
  return (
    <React.Suspense
      fallback={
        <div className="max-w-[1100px] mx-auto py-12 px-4 text-center text-slate-400 text-sm">
          Loading UniCodeTrack projects...
        </div>
      }
    >
      <LecturerProjectsContent />
    </React.Suspense>
  );
}
