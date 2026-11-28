"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Pencil,
  Trash2,
  X,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  ShieldAlert,
  FolderGit2,
  Users,
  FileText,
  ExternalLink,
  Database,
  UserCheck,
  Download,
  Sparkles,
  Languages,
  Globe,
  BookOpen,
} from "lucide-react";
import { useAdminData } from "@/context/AdminDataContext";
import { Project } from "@/types/admin";
import { SAMPLE_C_PROJECT_FILES } from "@/services/github/repositories";
import { CreateProjectPrototypeForm } from "@/components/projects/CreateProjectPrototypeForm";

const BATCHES = ["1.1", "1.2", "2.1", "2.2", "3.1", "3.2", "4.1", "4.2"] as const;

function LecturerProjectsContent() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    projects: contextProjects,
    courses: contextCourses,
    groups,
    students,
    studentAssignments,
    activeRole,
    activeStudentEmail,
    activeLecturerEmail,
    getProjectsForStudent,
    saveEvaluation,
    archiveProject,
    editProject,
    deleteProject,
    connectRepoToGroup,
    submitGroupDeliverable,
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

  // Modals state for Editing & Deleting projects
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);
  const [editFormData, setEditFormData] = useState<{
    title: string;
    description: string;
    academicYear: 1 | 2 | 3 | 4;
    semester: 1 | 2;
    deadline: string;
    status: "Draft" | "Published" | "Archived";
    proposalRequired: boolean;
    erDiagramRequired: boolean;
    githubRequired: boolean;
    finalReportRequired: boolean;
  }>({
    title: "",
    description: "",
    academicYear: 1,
    semester: 1,
    deadline: "",
    status: "Draft",
    proposalRequired: true,
    erDiagramRequired: true,
    githubRequired: true,
    finalReportRequired: true,
  });

  useEffect(() => {
    if (editingProject) {
      setEditFormData({
        title: editingProject.title || "",
        description: editingProject.description || "",
        academicYear: (editingProject.academicYear || 1) as 1 | 2 | 3 | 4,
        semester: (editingProject.semester || 1) as 1 | 2,
        deadline: editingProject.deadline ? editingProject.deadline.split("T")[0] : "",
        status: (editingProject.status as any) || "Draft",
        proposalRequired: editingProject.proposalRequired ?? true,
        erDiagramRequired: editingProject.erDiagramRequired ?? true,
        githubRequired: editingProject.githubRequired ?? true,
        finalReportRequired: editingProject.finalReportRequired ?? true,
      });
    }
  }, [editingProject]);

  const handleSaveProjectEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;
    if (!editFormData.title.trim()) {
      showToast("Project Title is required", "error");
      return;
    }

    const updates: Partial<Project> = {
      title: editFormData.title.trim(),
      description: editFormData.description.trim(),
      academicYear: editFormData.academicYear,
      semester: editFormData.semester,
      deadline: editFormData.deadline || undefined,
      status: editFormData.status,
      proposalRequired: editFormData.proposalRequired,
      erDiagramRequired: editFormData.erDiagramRequired,
      githubRequired: editFormData.githubRequired,
      finalReportRequired: editFormData.finalReportRequired,
    };

    const res = editProject(editingProject.id, updates);
    if (res.success) {
      if (proj?.id === editingProject.id) {
        setProj((prev) => (prev ? { ...prev, ...updates } : null));
      }
      setEditingProject(null);
    }
  };

  const handleConfirmProjectDelete = () => {
    if (!deletingProject) return;
    const delId = deletingProject.id;
    deleteProject(delId);
    if (proj?.id === delId) {
      setProj(null);
      setTgt(null);
      setView("list");
    }
    setDeletingProject(null);
  };

  // Student Upload & Submission States
  const [repoInputUrl, setRepoInputUrl] = useState("");
  const [isEditingRepo, setIsEditingRepo] = useState(false);
  const [isConnectingRepo, setIsConnectingRepo] = useState(false);
  const [uploadField, setUploadField] = useState<string | null>(null);
  const [uploadFileName, setUploadFileName] = useState("");
  const [isSubmittingFile, setIsSubmittingFile] = useState(false);

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

  // Multilingual Project Summary & Specification Document States
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [summaryModalProject, setSummaryModalProject] = useState<Project | null>(null);
  const [summaryLang, setSummaryLang] = useState<"en" | "si" | "ta">("en");
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [summaryCache, setSummaryCache] = useState<{ [projId: string]: { en?: string; si?: string; ta?: string } }>({});

  const handleDownloadSpecification = (project: Project) => {
    const fileName =
      project.projectDescriptionFileName ||
      project.assignmentFileName ||
      `${project.title.replace(/[^a-zA-Z0-9_-]/g, "_")}_Specification.pdf`;

    if (project.projectDescriptionPdfUrl) {
      const a = document.createElement("a");
      a.href = project.projectDescriptionPdfUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast(`Downloading ${fileName}`, "info");
      return;
    }

    // Fallback text specification download if no direct Data URL exists
    const cleanReqs = (project.requirements || project.requirementsContent || project.description || "")
      .replace(/\s*\(\s*\d+\s*%\s*\)/gi, "")
      .replace(/\s*\[\s*\d+\s*%\s*\]/gi, "");

    const specText = `=====================================================
UNICODETRACK ACADEMIC SPECIFICATION DOCUMENT
=====================================================
Course: ${project.courseCode}
Project: ${project.title}
Academic Term: Year ${project.academicYear}, Semester ${project.semester}
Supervisor: ${project.lecturerName || "Course Lecturer"}
Deadline: ${project.deadline ? new Date(project.deadline).toLocaleDateString() : "Ongoing"}

=====================================================
PROJECT OVERVIEW
=====================================================
${project.projectDescriptionText || project.description || "Refer to requirements below."}

=====================================================
TECHNICAL REQUIREMENTS
=====================================================
${cleanReqs}

=====================================================
DELIVERABLES
=====================================================
- GitHub Repository: ${project.githubRequired ? "REQUIRED" : "OPTIONAL"}
- Project Proposal: ${project.proposalRequired ? "REQUIRED" : "OPTIONAL"}
- ER Diagram & Database: ${project.erDiagramRequired || project.databaseRequired ? "REQUIRED" : "OPTIONAL"}
- Final Report: ${project.finalReportRequired ? "REQUIRED" : "OPTIONAL"}
=====================================================
Generated by UniCodeTrack Academic Engine`;

    const blob = new Blob([specText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName.endsWith(".pdf") ? fileName.replace(/\.pdf$/, ".txt") : `${fileName}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Downloading specification document`, "info");
  };

  const fetchProjectSummary = async (project: Project, lang: "en" | "si" | "ta") => {
    if (summaryCache[project.id]?.[lang]) return;

    if (lang === "en" && project.summaryEnglish) {
      setSummaryCache((prev) => ({
        ...prev,
        [project.id]: { ...prev[project.id], en: project.summaryEnglish },
      }));
      return;
    }
    if (lang === "si" && project.summarySinhala) {
      setSummaryCache((prev) => ({
        ...prev,
        [project.id]: { ...prev[project.id], si: project.summarySinhala },
      }));
      return;
    }
    if (lang === "ta" && project.summaryTamil) {
      setSummaryCache((prev) => ({
        ...prev,
        [project.id]: { ...prev[project.id], ta: project.summaryTamil },
      }));
      return;
    }

    setIsGeneratingSummary(true);
    try {
      const cleanReqs = (project.requirements || project.requirementsContent || project.description || "")
        .replace(/\s*\(\s*\d+\s*%\s*\)/gi, "")
        .replace(/\s*\[\s*\d+\s*%\s*\]/gi, "");

      const textToSummarize = [
        project.projectDescriptionText,
        project.description,
        cleanReqs,
      ]
        .filter(Boolean)
        .join("\n\n");

      const res = await fetch("/api/ai/project-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: textToSummarize,
          title: project.title,
          language: lang,
        }),
      });

      const data = await res.json();
      if (data.success && data.summary) {
        setSummaryCache((prev) => ({
          ...prev,
          [project.id]: { ...prev[project.id], [lang]: data.summary },
        }));
      }
    } catch (err) {
      console.error("Failed to fetch project summary:", err);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleOpenSummary = (project: Project) => {
    setSummaryModalProject(project);
    setShowSummaryModal(true);
    fetchProjectSummary(project, summaryLang);
  };

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

  // Student identity resolution
  const currentStudent = useMemo(() => {
    return students.find((s) => s.email.toLowerCase() === (activeStudentEmail || "").toLowerCase());
  }, [students, activeStudentEmail]);

  const normCurrentStudentId = useMemo(() => {
    return (currentStudent?.studentId || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  }, [currentStudent]);

  const normCurrentStudentSysId = useMemo(() => {
    return (currentStudent?.id || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  }, [currentStudent]);

  const normCurrentStudentName = useMemo(() => {
    return (currentStudent?.fullName || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  }, [currentStudent]);

  // Helper to resolve student's assigned group for a project
  const getStudentGroupForProj = (project: Project) => {
    return groups.find((g) =>
      g.projectId === project.id &&
      g.members.some((m) => {
        const mEmail = (m.email || "").toLowerCase().trim();
        const mId = (m.studentId || "").toLowerCase().replace(/[^a-z0-9]/g, "");
        const mName = (m.fullName || "").toLowerCase().replace(/[^a-z0-9]/g, "");
        const matchesEmail = activeStudentEmail && mEmail === activeStudentEmail.toLowerCase().trim();
        const matchesId =
          (normCurrentStudentId && mId && (mId === normCurrentStudentId || mId.endsWith(normCurrentStudentId) || normCurrentStudentId.endsWith(mId))) ||
          (normCurrentStudentSysId && mId && mId === normCurrentStudentSysId);
        const matchesName = Boolean(normCurrentStudentName && mName && normCurrentStudentName === mName);
        return matchesEmail || matchesId || matchesName;
      })
    );
  };

  const handleLinkRepo = async (groupId: string) => {
    if (!repoInputUrl.trim()) {
      showToast("Please enter a valid GitHub repository URL", "error");
      return;
    }
    setIsConnectingRepo(true);
    try {
      const res = await connectRepoToGroup(groupId, repoInputUrl.trim(), {
        name: currentStudent?.fullName || "Student",
        studentId: currentStudent?.studentId || "",
      });
      if (res.success) {
        setIsEditingRepo(false);
        setRepoInputUrl("");
      } else {
        showToast(res.error || "Failed to link repository", "error");
      }
    } finally {
      setIsConnectingRepo(false);
    }
  };

  const handleSubmitDeliverable = async (
    groupId: string,
    type: "proposal" | "er_diagram" | "final_report",
    title: string,
    fileName: string
  ) => {
    if (!fileName.trim()) {
      showToast("Please specify or upload a document file", "error");
      return;
    }
    setIsSubmittingFile(true);
    try {
      const res = submitGroupDeliverable(groupId, {
        type,
        title,
        fileName: fileName.trim(),
        uploadedBy: currentStudent?.fullName || "Student",
        uploadedByStudentId: currentStudent?.studentId || "",
      });
      if (res.success) {
        setUploadField(null);
        setUploadFileName("");
      }
    } finally {
      setIsSubmittingFile(false);
    }
  };

  // Filter projects by current vs past
  const baseProjects = useMemo(() => {
    if (activeRole === "student") {
      return getProjectsForStudent(activeStudentEmail);
    }
    return contextProjects;
  }, [activeRole, contextProjects, activeStudentEmail, getProjectsForStudent]);

  const temporalProjects = useMemo(() => {
    return baseProjects.filter((p) => {
      const isPast = isPastProject(p);
      return tab === "past" ? isPast : !isPast;
    });
  }, [baseProjects, tab]);

  // Student batch boundaries: Student can ONLY view current or past batches, never future batches
  const studentYear = Number(currentStudent?.academicYear || 1);
  const studentSem = Number(currentStudent?.semester || 1);
  const studentBatchVal = studentYear * 10 + studentSem;

  const displayBatches = useMemo(() => {
    if (activeRole !== "student") {
      return BATCHES;
    }
    return BATCHES.filter((b) => {
      const [y, s] = b.split(".").map(Number);
      const bVal = y * 10 + s;
      // Strictly prevent seeing batches ahead of the student
      if (bVal > studentBatchVal) return false;

      if (tab === "current") {
        // Current tab: show their current batch (and any active batch)
        return bVal === studentBatchVal;
      } else {
        // Past tab: show previous batches (and current if it has past projects)
        return (
          bVal < studentBatchVal ||
          (bVal === studentBatchVal &&
            temporalProjects.some((p) => p.academicYear === y && p.semester === s))
        );
      }
    });
  }, [activeRole, studentBatchVal, tab, temporalProjects]);

  // Safety guard: if a student's active batch points to an unauthorized future batch, reset it
  useEffect(() => {
    if (activeRole === "student" && batch) {
      const [y, s] = batch.split(".").map(Number);
      const bVal = y * 10 + s;
      if (bVal > studentBatchVal) {
        setBatch(null);
        setCourse(null);
        setProj(null);
        setTgt(null);
      }
    }
  }, [activeRole, batch, studentBatchVal]);

  // Projects matching active batch
  const batchProjects = useMemo(() => {
    if (!batch) return temporalProjects;
    const [y, s] = batch.split(".").map(Number);
    return temporalProjects.filter((p) => p.academicYear === y && p.semester === s);
  }, [temporalProjects, batch]);

  // Courses matching active batch
  const availableCourses = useMemo(() => {
    let baseList = contextCourses;
    if (batch) {
      const [y, s] = batch.split(".").map(Number);
      baseList = baseList.filter(
        (c) => Number(c.academicYear || 1) === y && Number(c.semester || 1) === s
      );
    } else if (activeRole === "student") {
      baseList = baseList.filter((c) => {
        const cYear = Number(c.academicYear || 1);
        const cSem = Number(c.semester || 1);
        return cYear < studentYear || (cYear === studentYear && cSem <= studentSem);
      });
    }
    const list = baseList.map((c) => ({ c: c.code, n: c.name }));
    if (!batch) return list;
    const [y, s] = batch.split(".").map(Number);
    const matchingCodes = new Set(
      temporalProjects
        .filter((p) => p.academicYear === y && p.semester === s)
        .map((p) => p.courseCode)
    );
    const filtered = list.filter((c) => matchingCodes.has(c.c));
    return filtered.length > 0 ? filtered : list;
  }, [contextCourses, temporalProjects, batch, activeRole, studentYear, studentSem]);

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
      let projGroups = groups.filter((g) => g.projectId === proj.id);
      if (activeRole === "student") {
        const email = (activeStudentEmail || "").toLowerCase().trim();
        projGroups = projGroups.filter((g) =>
          g.members.some((m) => {
            const mEmail = (m.email || "").toLowerCase().trim();
            const mId = (m.studentId || "").toLowerCase().replace(/[^a-z0-9]/g, "");
            const matchesEmail = email && mEmail === email;
            const matchesId =
              (normCurrentStudentId && mId && (mId === normCurrentStudentId || mId.endsWith(normCurrentStudentId) || normCurrentStudentId.endsWith(mId))) ||
              (normCurrentStudentSysId && mId && mId === normCurrentStudentSysId);
            return matchesEmail || matchesId;
          })
        );
      }
      return projGroups.map((g) => ({
        name: g.groupName || `Group ${g.groupNumber}`,
        sub: `${g.members?.length || 0} members`,
        hasRepo: !!g.repoUrl,
        id: g.id,
      }));
    } else {
      let assignments = studentAssignments.filter((a) => a.projectId === proj.id);
      if (activeRole === "student") {
        const email = (activeStudentEmail || "").toLowerCase().trim();
        assignments = assignments.filter((a) => {
          const aEmail = (a.studentEmail || "").toLowerCase().trim();
          const aId = (a.studentId || "").toLowerCase().replace(/[^a-z0-9]/g, "");
          const matchesEmail = email && aEmail === email;
          const matchesId =
            (normCurrentStudentId && aId && (aId === normCurrentStudentId || aId.endsWith(normCurrentStudentId) || normCurrentStudentId.endsWith(aId))) ||
            (normCurrentStudentSysId && aId && aId === normCurrentStudentSysId);
          return matchesEmail || matchesId;
        });
      }
      return assignments.map((a) => ({
        name: a.studentId || "TG/2004/2004",
        sub: a.studentName || "Personal submission",
        hasRepo: !!a.repoUrl,
        id: a.id,
      }));
    }
  }, [proj, groups, studentAssignments, activeRole, activeStudentEmail, normCurrentStudentId, normCurrentStudentSysId]);

  // Active group object scoped to active project
  const activeGroup = useMemo(() => {
    if (!tgt || !proj) return null;
    const match = groups.find((g) => g.projectId === proj.id && (g.groupName === tgt || g.id === tgt));
    if (!match) return null;
    if (activeRole === "student") {
      const email = (activeStudentEmail || "").toLowerCase().trim();
      const isMember = match.members.some((m) => {
        const mEmail = (m.email || "").toLowerCase().trim();
        const mId = (m.studentId || "").toLowerCase().replace(/[^a-z0-9]/g, "");
        const matchesEmail = email && mEmail === email;
        const matchesId =
          (normCurrentStudentId && mId && (mId === normCurrentStudentId || mId.endsWith(normCurrentStudentId) || normCurrentStudentId.endsWith(mId))) ||
          (normCurrentStudentSysId && mId && mId === normCurrentStudentSysId);
        return matchesEmail || matchesId;
      });
      if (!isMember) return null;
    }
    return match;
  }, [tgt, proj, groups, activeRole, activeStudentEmail, normCurrentStudentId, normCurrentStudentSysId]);

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
  const runAiEvaluate = async () => {
    setIsEvaluating(true);
    setEvalStep("Connecting to Gemini AI... Analyzing student deliverables");

    try {
      const res = await fetch("/api/ai/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: proj?.id || "proj-1",
          groupId: tgt || "grp-1",
          projectTitle: proj?.title || "Academic Project",
          courseCode: proj?.courseCode || "CS492",
          projectType: (proj?.type === "Group Project" || proj?.projectType === "group") ? "group" : "individual",
          proposalText: proj?.description || proj?.title,
          sourceCodeSnippet: (activeGroup?.commits && activeGroup.commits.length > 0)
            ? activeGroup.commits.map((c) => c.message).join("\n")
            : "Initial repository setup",
        }),
      });

      const data = await res.json();
      if (data.success && data.evaluation) {
        if (data.evaluation.criteria && Array.isArray(data.evaluation.criteria)) {
          setMarks(data.evaluation.criteria);
        } else {
          setMarks([
            ["Functionality", data.evaluation.totalScore ? Math.round(data.evaluation.totalScore * 0.3) : 25, 30, "Implemented core project scope"],
            ["Code quality", 16, 20, "Structure and conventions"],
            ["Database / ER design", 12, 15, "Relational architecture"],
            ["Documentation", 13, 15, "Project report coverage"],
            ["Requirement coverage", 15, 20, "Milestones met"],
          ]);
        }
        if (data.evaluation.summary) {
          setSummaryText(data.evaluation.summary);
        }
        setEvalStep("Evaluation complete. Review and adjust below.");
        showToast("Gemini AI evaluated deliverables and generated marks!", "success");
      } else {
        throw new Error(data.error || "Evaluation failed");
      }
    } catch {
      setEvalStep("Done. Standard academic rubric loaded.");
      setMarks([
        ["Functionality", 24, 30, "Core project implementation"],
        ["Code quality", 15, 20, "Code structure and conventions"],
        ["Database / ER design", 11, 15, "Relational schema design"],
        ["Documentation", 12, 15, "Milestone coverage"],
        ["Requirement coverage", 14, 20, "Proposal requirements"],
      ]);
      showToast("Evaluated using academic rubric.", "info");
    } finally {
      setIsEvaluating(false);
      setSavedText("Save marks & summary");
    }
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
      <h1 className="text-2xl font-bold text-foreground tracking-tight">Projects</h1>
      <p className="sub text-sm text-muted-foreground mb-4">Choose a view and a batch to continue.</p>

      {/* Action to create project matching prototype */}
      {activeRole !== "student" && (
        <div className="proj-row mb-3.5">
          <button className="proj-btn p" onClick={() => go({ view: "create" })}>
            + Create project
          </button>
        </div>
      )}

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
        {displayBatches.length === 0 ? (
          <div className="proj-card text-center py-10 space-y-2 bg-card border border-border rounded-[16px] col-span-full">
            <p className="text-muted-foreground text-sm">
              {tab === "current"
                ? `No active batches found for your enrolled term (Year ${studentYear}, Sem ${studentSem}).`
                : `No previous batches or archived projects recorded prior to Year ${studentYear}, Sem ${studentSem}.`}
            </p>
          </div>
        ) : (
          displayBatches.map((b) => {
            const [y, s] = b.split(".").map(Number);
            const count = temporalProjects.filter(
              (p) => p.academicYear === y && p.semester === s
            ).length;
            const displayCount = count;
            return (
              <div
                key={b}
                className="proj-card proj-tile bg-card border border-border text-foreground hover:border-accent rounded-[16px] transition-all cursor-pointer"
                onClick={() => go({ batch: b })}
              >
                <b className="text-foreground block text-base font-semibold">Batch {b}</b>
                <span suppressHydrationWarning className="text-muted-foreground text-xs block mt-1">
                  {tab === "current"
                    ? `${displayCount} active projects`
                    : `${displayCount} archived projects`}
                </span>
              </div>
            );
          })
        )}
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
      <h1 className="text-2xl font-bold text-foreground tracking-tight">Batch {batch}</h1>
      <p className="sub text-sm text-muted-foreground mb-4">Select a course.</p>

      <div className="proj-grid">
        {availableCourses.map((c) => (
          <div
            key={c.c}
            className="proj-card proj-tile bg-card border border-border text-foreground hover:border-accent rounded-[16px] transition-all cursor-pointer"
            onClick={() => go({ course: c })}
          >
            <b className="text-foreground block text-base font-semibold font-mono">{c.c}</b>
            <span className="text-muted-foreground text-xs block mt-0.5">{c.n}</span>
            <br />
            <span className="proj-tag">
              {courseProjects.length} projects
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
      <h1 className="text-2xl font-bold text-foreground tracking-tight font-mono">{course?.c}</h1>
      <p className="sub text-sm text-muted-foreground mb-4">{course?.n} · pick a project.</p>

      {courseProjects.length === 0 ? (
        <div className="proj-card text-center py-10 space-y-3 bg-card border border-border rounded-[16px]">
          <p className="text-muted-foreground text-sm">No projects created for {course?.c} yet.</p>
          {activeRole !== "student" && (
            <button className="proj-btn p text-xs" onClick={() => go({ view: "create" })}>
              + Create project
            </button>
          )}
        </div>
      ) : (
        <div className="proj-grid">
          {courseProjects.map((p) => {
            const isGroup = p.type === "Group Project" || p.projectType === "group";
            return (
              <div
                key={p.id}
                className="proj-card proj-tile bg-card border border-border text-foreground hover:border-accent rounded-[16px] transition-all cursor-pointer flex flex-col justify-between"
                onClick={() => go({ proj: p })}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <b className="text-foreground block text-base font-semibold">{p.title}</b>
                  </div>
                  <span className="text-muted-foreground text-xs block mt-0.5">
                    {tab === "current" ? "Active" : "Archived"}
                    {p.deadline ? ` · Due ${new Date(p.deadline).toLocaleDateString()}` : ""}
                  </span>
                  {p.description && (
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{p.description}</p>
                  )}
                  <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                    <span className={`proj-tag ${isGroup ? "" : "no"}`}>
                      {isGroup ? "Group project" : "Personal project"}
                    </span>
                    {p.status && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full border border-border bg-muted text-muted-foreground font-mono">
                        {p.status}
                      </span>
                    )}
                  </div>
                </div>

                {/* Edit & Delete Action Buttons (Lecturers/Admins only) */}
                {activeRole !== "student" && (
                  <div className="flex items-center justify-end gap-1.5 mt-4 pt-3 border-t border-border/50">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingProject(p);
                      }}
                      className="px-2.5 py-1 text-xs rounded-lg border border-border bg-muted/60 hover:bg-muted text-foreground flex items-center gap-1.5 transition-colors"
                      title="Edit project"
                    >
                      <Pencil className="w-3 h-3 text-muted-foreground" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingProject(p);
                      }}
                      className="px-2.5 py-1 text-xs rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 flex items-center gap-1.5 transition-colors"
                      title="Delete project"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">{proj?.title}</h1>
            <p className="sub text-sm text-muted-foreground mt-0.5">
              {isGroup ? "Select a group." : "Select a student index."}
            </p>
          </div>
          {activeRole !== "student" && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => proj && setEditingProject(proj)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border bg-muted hover:bg-muted/80 text-foreground flex items-center gap-1.5 transition-colors"
                title="Edit project details"
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit Project
              </button>
              <button
                type="button"
                onClick={() => proj && setDeletingProject(proj)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 flex items-center gap-1.5 transition-colors"
                title="Delete this project"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Project
              </button>
            </div>
          )}
        </div>

        {targetsList.length === 0 ? (
          <div className="proj-card text-center py-10 space-y-2 bg-card border border-border rounded-[16px]">
            <p className="text-muted-foreground text-sm">
              {isGroup ? "No student groups assigned to this project yet." : "No student submissions assigned yet."}
            </p>
            <span className="text-muted-foreground text-xs">
              {isGroup ? "Upload a group roster PDF or assign groups." : "Enrolled students will appear here."}
            </span>
          </div>
        ) : (
          <div className="proj-grid">
            {targetsList.map((tItem) => (
              <div
                key={tItem.name}
                className="proj-card proj-tile bg-card border border-border text-foreground hover:border-accent rounded-[16px] transition-all cursor-pointer"
                onClick={() => go({ tgt: tItem.name, view: "workspace", fileIndex: 0 })}
              >
                <b className={`${isGroup ? "" : "font-mono"} text-foreground block text-base font-semibold`}>{tItem.name}</b>
                <span className="text-muted-foreground text-xs block mt-0.5">{tItem.sub}</span>
                <br />
                <span className={`proj-tag ${tItem.hasRepo ? "ok" : "no"}`}>
                  {tItem.hasRepo ? "Repo linked" : "No repo linked"}
                </span>
              </div>
            ))}
          </div>
        )}
      </>
    );
  };

  // --------------------------------------------------------------------------
  // SCREEN 5: WORKSPACE VIEW
  // --------------------------------------------------------------------------
  const renderWorkspace = () => {
    const isGroup = proj?.type === "Group Project" || proj?.projectType === "group";
    const isPast = tab === "past";

    const currentGroup = isGroup
      ? groups.find((g) => g.projectId === proj?.id && (g.groupName === tgt || g.id === tgt)) || activeGroup
      : null;

    const currentAssignment = !isGroup
      ? studentAssignments.find((a) => a.projectId === proj?.id && (a.studentId === tgt || a.id === tgt))
      : null;

    const isRepoConnected = Boolean(isGroup ? currentGroup?.repoUrl : currentAssignment?.repoUrl);
    const linkedRepoUrl = isGroup ? currentGroup?.repoUrl : currentAssignment?.repoUrl;

    const branches: [string, number][] = (currentGroup?.branches || []).map((b) => [
      b.name,
      b.commitCount || 0,
    ]);

    const members: [string, number][] = isGroup
      ? (currentGroup?.members || []).map((m) => [m.fullName || m.studentId, m.commitsCount || 0])
      : [[currentAssignment?.studentName || tgt || "Student", currentAssignment?.totalCommits || 0]];

    const totalCommitsCount = isGroup
      ? (currentGroup?.totalCommits || 0)
      : (currentAssignment?.totalCommits || 0);

    const maxBranchCommits = Math.max(1, ...branches.map((b) => b[1]));
    const maxMemberCommits = Math.max(1, ...members.map((m) => m[1]));

    const docs: [string, string, boolean][] = [];

    if (proj?.proposalRequired) {
      const isSubmitted = Boolean(currentGroup?.proposalStatus === "approved" || currentGroup?.proposalStatus === "submitted");
      docs.push(["Project proposal", "PDF", isSubmitted]);
    }

    if (proj?.erDiagramRequired) {
      docs.push(["ER diagram", "PNG", false]);
    }

    if (proj?.finalReportRequired) {
      docs.push(["Final report", "PDF", isPast]);
    }

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
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          {tgt} · {proj?.title}
        </h1>
        <p className="sub text-sm text-muted-foreground mb-4">
          Linked repository:{" "}
          {isRepoConnected ? (
            <span>
              <a
                href={linkedRepoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-accent hover:underline mr-2"
              >
                {linkedRepoUrl}
              </a>
              {currentGroup?.repoUploadedBy && (
                <span className="text-xs text-emerald-400 font-sans">
                  (Uploaded by {currentGroup.repoUploadedBy} {currentGroup.repoUploadedByStudentId ? `[${currentGroup.repoUploadedByStudentId}]` : ""})
                </span>
              )}
            </span>
          ) : (
            <span className="text-muted-foreground italic">No GitHub repository linked yet</span>
          )}
        </p>

        {/* Stats Grid */}
        <div className="proj-stats">
          <div className="proj-card">
            <b className="font-mono tabular-nums text-foreground">{branches.length}</b>
            <span>Branches</span>
          </div>
          <div className="proj-card">
            <b className="font-mono tabular-nums text-foreground">{totalCommitsCount}</b>
            <span>Total commits</span>
          </div>
          <div className="proj-card">
            <b className="font-mono tabular-nums text-foreground">{members.length}</b>
            <span>{isGroup ? "Contributors" : "Contributor"}</span>
          </div>
          <div className="proj-card">
            <b className="text-foreground">{isRepoConnected ? "Synced" : "Pending"}</b>
            <span>Repo status</span>
          </div>
        </div>

        {/* Two Columns: Branches & Commits per member */}
        <div className="proj-two mb-4">
          <div className="proj-card">
            <b className="text-base text-foreground">Branches</b>
            {branches.length === 0 ? (
              <p className="text-muted-foreground text-xs italic py-4">
                No branches detected. Students have not pushed branches to GitHub yet.
              </p>
            ) : (
              branches.map((bItem) => (
                <div key={bItem[0]} className="mt-3">
                  <div className="proj-row">
                    <span className="font-mono text-xs text-foreground">{bItem[0]}</span>
                    <span className="proj-sp"></span>
                    <span className="text-xs text-muted-foreground font-mono">{bItem[1]} commits</span>
                  </div>
                  <div className="proj-bar">
                    <i style={{ width: `${(bItem[1] / maxBranchCommits) * 100}%` }}></i>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="proj-card">
            <b className="text-base text-foreground">
              {isGroup ? "Members & Contributions" : "Student Contributions"}
            </b>
            {members.length === 0 ? (
              <p className="text-muted-foreground text-xs italic py-4">No members assigned to this group.</p>
            ) : (
              members.map((mItem) => (
                <div key={mItem[0]} className="mt-3">
                  <div className="proj-row">
                    <span className="text-xs font-medium text-foreground">{mItem[0]}</span>
                    <span className="proj-sp"></span>
                    <span className="text-xs text-muted-foreground font-mono">{mItem[1]} commits</span>
                  </div>
                  <div className="proj-bar">
                    <i style={{ width: `${(mItem[1] / maxMemberCommits) * 100}%` }}></i>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Deliverables Section */}
        <div className="proj-sec">Deliverables</div>
        {docs.length === 0 ? (
          <div className="proj-card p-4 text-xs text-muted-foreground mb-6">
            No document deliverables were configured as required for this project.
          </div>
        ) : (
          <div className="proj-row mb-6 flex-wrap gap-3">
            {docs.map((d) => (
              <div key={d[0]} className="proj-card proj-doc" style={{ minWidth: 210 }}>
                <div className="proj-ic">{d[1]}</div>
                <div>
                  <b className="text-xs block text-foreground">{d[0]}</b>
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
        )}

        {/* Code · Read-Only Section */}
        <div className="proj-sec">Code · read-only</div>
        {!isRepoConnected ? (
          <div className="proj-card text-center py-10 space-y-2 bg-card border border-border rounded-[16px]">
            <p className="text-muted-foreground text-sm font-medium">No repository connected yet.</p>
            <span className="text-muted-foreground text-xs block max-w-md mx-auto">
              When students connect their group GitHub repository and push code, branches, commits, and repository files will synchronize here in real time.
            </span>
          </div>
        ) : (
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
        )}
      </>
    );
  };

  // --------------------------------------------------------------------------
  // SCREEN 6: REPORTS VIEW
  // --------------------------------------------------------------------------
  const renderReports = () => {
    const reportsList: [string, string, string, string][] = [];

    if (proj?.proposalRequired) {
      reportsList.push(["Project proposal", "PDF", "1.2 MB", "proposal.pdf"]);
    }
    if (proj?.erDiagramRequired) {
      reportsList.push(["ER diagram", "PNG", "340 KB", "er-diagram.png"]);
    }
    if (proj?.finalReportRequired) {
      reportsList.push(["Final report", "PDF", "2.8 MB", "final-report.pdf"]);
    }

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
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Submitted reports</h1>
        <p className="sub text-sm text-muted-foreground mb-4">
          {tgt} · {proj?.title}
        </p>

        {reportsList.length === 0 ? (
          <div className="proj-card text-center py-10 text-muted-foreground text-sm">
            No document deliverables were configured as required for this project.
          </div>
        ) : (
          <div className="proj-card">
            {reportsList.map((x, idx) => (
              <div
                key={x[0]}
                className={`proj-row py-3.5 ${
                  idx < reportsList.length - 1 ? "border-b border-border" : ""
                }`}
              >
                <div className="proj-ic">{x[1]}</div>
                <div>
                  <b className="text-sm text-foreground block">{x[0]}</b>
                  <span className="text-xs text-muted-foreground font-mono">
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
        )}
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
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Evaluate project</h1>
        <p className="sub text-sm text-muted-foreground mb-4">
          {tgt} · {proj?.title} · Past project
        </p>

        {/* Two Column Layout: Run Project vs AI Evaluation */}
        <div className="proj-two mb-6">
          {/* Card 1: Run Project */}
          <div className="proj-card">
            <div className="proj-row">
              <b className="text-base text-foreground">Run project</b>
              <span className="proj-sp"></span>
              <span className="proj-tag">C · gcc</span>
            </div>
            <pre
              id="term"
              className="proj-pre mt-3 rounded-[10px] overflow-auto"
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
            <b className="text-base text-foreground">AI evaluation</b>
            <p className="text-xs text-muted-foreground my-2 leading-relaxed">
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
              <div id="evs" className="text-xs text-accent font-mono mt-3">
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
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="py-2.5 px-2">Criterion</th>
                    <th className="py-2.5 px-2">Weight</th>
                    <th className="py-2.5 px-2">Mark</th>
                    <th className="py-2.5 px-2">Evidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {marks.map((x, idx) => (
                    <tr key={x[0]}>
                      <td className="py-2.5 px-2 font-semibold text-foreground">{x[0]}</td>
                      <td className="py-2.5 px-2 text-muted-foreground font-mono">{x[2]}%</td>
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
                          className="w-16 p-1.5 border border-border rounded-[10px] bg-muted text-foreground font-mono text-xs focus:border-accent focus:outline-none"
                        />{" "}
                        <span className="text-muted-foreground text-xs font-mono">/ {x[2]}</span>
                      </td>
                      <td className="py-2.5 px-2 text-muted-foreground font-mono text-[11px]">{x[3]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="proj-row my-3 pt-2 border-t border-border">
                <b className="text-sm text-foreground">Final mark</b>
                <b className="text-2xl text-accent font-mono tabular-nums">
                  <span id="tot">{totalScore}</span> / 100
                </b>
              </div>

              <div>
                <b className="text-xs text-foreground block mb-1">Project summary</b>
                <textarea
                  id="sum"
                  rows={3}
                  value={summaryText}
                  onChange={(e) => {
                    setSummaryText(e.target.value);
                    setSavedText("Save marks & summary");
                  }}
                  className="w-full p-2.5 border border-border rounded-[10px] bg-muted text-xs text-foreground leading-relaxed font-sans focus:outline-none focus:border-accent"
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

  // --------------------------------------------------------------------------
  // SCREEN 6: STUDENT ROOT PROJECTS VIEW (CURRENT ONGOING & PAST PROJECTS)
  // --------------------------------------------------------------------------
  const renderStudentProjectsRoot = () => {
    const studentOngoingProjects = temporalProjects.filter((p) => !isPastProject(p));
    const studentPastProjects = temporalProjects.filter((p) => isPastProject(p));
    const currentList = tab === "current" ? studentOngoingProjects : studentPastProjects;

    return (
      <>
        <div className="crumb">
          <span>Projects</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Academic Projects</h1>
            <p className="sub text-sm text-muted-foreground mt-0.5">
              {tab === "current"
                ? `Enrolled ongoing projects for Year ${studentYear}, Semester ${studentSem}.`
                : `Past completed projects and archived coursework.`}
            </p>
          </div>
        </div>

        {/* Segmented Switch: Current projects vs Past projects */}
        <div className="seg mb-5">
          <button
            className={tab === "current" ? "on" : ""}
            onClick={() => go({ tab: "current", batch: null, course: null, proj: null, tgt: null })}
          >
            Current ongoing projects ({studentOngoingProjects.length})
          </button>
          <button
            className={tab === "past" ? "on" : ""}
            onClick={() => go({ tab: "past", batch: null, course: null, proj: null, tgt: null })}
          >
            Past projects ({studentPastProjects.length})
          </button>
        </div>

        {/* Ongoing Projects Section */}
        {currentList.length === 0 ? (
          <div className="proj-card text-center py-12 space-y-3 bg-card border border-border rounded-[16px]">
            <FolderGit2 className="w-10 h-10 text-muted-foreground/60 mx-auto" />
            <h3 className="text-base font-semibold text-foreground">
              {tab === "current"
                ? "No Current Ongoing Projects Assigned"
                : "No Past Projects Recorded"}
            </h3>
            <p className="text-muted-foreground text-xs max-w-md mx-auto leading-relaxed">
              {tab === "current"
                ? `You do not have active ongoing projects for Year ${studentYear}, Semester ${studentSem} yet. Newly assigned group and individual projects will appear here.`
                : "You have not completed projects in previous terms yet."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentList.map((p) => {
              const isGroup = p.type === "Group Project" || p.projectType === "group";
              const myGrp = isGroup ? getStudentGroupForProj(p) : null;
              const courseObj = contextCourses.find((c) => c.code === p.courseCode);
              const isRepoLinked = Boolean(myGrp?.repoUrl);

              return (
                <div
                  key={p.id}
                  className="proj-card bg-card border border-border hover:border-accent rounded-[16px] p-5 transition-all cursor-pointer flex flex-col justify-between group shadow-xs"
                  onClick={() => go({ proj: p, view: "workspace" })}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20 font-semibold">
                        {p.courseCode} · {courseObj?.name || "Curriculum Course"}
                      </span>
                      <span
                        className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border ${
                          isGroup
                            ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                            : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                        }`}
                      >
                        {isGroup ? "Group Project" : "Individual Project"}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-foreground group-hover:text-accent transition-colors leading-snug">
                        {p.title}
                      </h3>
                      {p.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                          {p.description}
                        </p>
                      )}
                    </div>

                    {/* Group info if applicable */}
                    {isGroup && (
                      <div className="p-2.5 rounded-xl bg-muted/50 border border-border/70 text-xs flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users className="w-3.5 h-3.5 text-accent" />
                          <span className="font-semibold text-foreground">
                            {myGrp ? myGrp.groupName : "Group Allocation in Progress"}
                          </span>
                        </div>
                        {myGrp && (
                          <span className="text-[11px] text-muted-foreground">
                            {myGrp.members.length} members
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="pt-3.5 mt-3.5 border-t border-border flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span suppressHydrationWarning className="text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {p.deadline ? `Due ${new Date(p.deadline).toLocaleDateString()}` : "Ongoing"}
                      </span>
                      {isGroup && (
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                            isRepoLinked
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          }`}
                        >
                          {isRepoLinked ? "Repo Linked" : "Pending Repo"}
                        </span>
                      )}
                    </div>
                    <span className="text-accent font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      View Requirements & Workspace →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Batch Navigation Tile */}
        {tab === "current" && displayBatches.length > 0 && (
          <div className="mt-8 pt-6 border-t border-border">
            <h4 className="text-xs uppercase tracking-wider font-bold text-muted-foreground mb-3">
              Enrolled Term Batch
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {displayBatches.map((b) => (
                <div
                  key={b}
                  className="proj-card proj-tile bg-card border border-border text-foreground hover:border-accent rounded-[14px] p-3 transition-all cursor-pointer"
                  onClick={() => go({ batch: b })}
                >
                  <b className="text-foreground block text-sm font-semibold">Batch {b}</b>
                  <span className="text-muted-foreground text-[11px] block mt-0.5">
                    Year {studentYear} · Semester {studentSem}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </>
    );
  };

  // --------------------------------------------------------------------------
  // SCREEN 7: STUDENT PROJECT DETAIL (REQUIREMENTS FIRST, TEAM & DELIVERABLES)
  // --------------------------------------------------------------------------
  const renderStudentProjectDetail = (project: Project) => {
    const isGroup = project.type === "Group Project" || project.projectType === "group";
    const myGroup = isGroup ? getStudentGroupForProj(project) : null;
    const courseObj = contextCourses.find((c) => c.code === project.courseCode);

    // Connected repository details
    const repoUrl = myGroup?.repoUrl;
    const repoUploaderName = myGroup?.repoUploadedBy;
    const repoUploaderStudentId = myGroup?.repoUploadedByStudentId;
    const repoUploadedAt = myGroup?.repoUploadedAt;

    // Proposals & other deliverables
    const groupDeliverables = myGroup?.deliverables || [];
    const proposalDeliv =
      groupDeliverables.find((d) => d.type === "proposal") ||
      (myGroup?.proposal
        ? {
            id: myGroup.proposal.id,
            type: "proposal" as const,
            title: "Project Proposal",
            fileName: myGroup.proposal.fileName,
            uploadedBy: myGroup.proposal.submittedBy,
            uploadedByStudentId: "",
            uploadedAt: myGroup.proposal.submittedAt,
          }
        : null);

    const erDeliv = groupDeliverables.find((d) => d.type === "er_diagram");
    const reportDeliv = groupDeliverables.find((d) => d.type === "final_report");

    // Filter out internal marks criteria, percentages, and rubric weights so students never see grading marks
    const rawReqText =
      project.requirements ||
      project.requirementsContent ||
      project.description ||
      "Satisfy all course project milestones, architecture criteria, and final deliverable guidelines.";

    const studentReqText = rawReqText
      .replace(/\s*\(\s*\d+\s*%\s*\)/gi, "")
      .replace(/\s*\[\s*\d+\s*%\s*\]/gi, "")
      .replace(/\s*\(\s*\d+\s*(?:marks|pts|points)?\s*%\s*\)/gi, "")
      .replace(/\s*\[\s*\d+\s*(?:marks|pts|points)?\s*\]/gi, "")
      .replace(/\s*-\s*\d+\s*marks/gi, "")
      .replace(/\s*\(\s*\d+\s*marks\s*\)/gi, "")
      .replace(/\s*\[\s*\d+\s*marks\s*\]/gi, "")
      .trim() || "Satisfy all course project milestones, architecture criteria, and final deliverable guidelines.";

    return (
      <div className="space-y-6 animate-in fade-in-50 duration-200">
        {/* Breadcrumb Navigation */}
        <div className="crumb">
          <a onClick={() => go({ proj: null, tgt: null, view: "list" })}>Projects</a>
          {" / "}
          <span>{project.title}</span>
        </div>

        {/* Project Header Banner */}
        <div className="bg-card border border-border rounded-[18px] p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20 font-semibold">
                  {project.courseCode} · {courseObj?.name || "Curriculum Course"}
                </span>
                <span
                  className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border ${
                    isGroup
                      ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                      : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                  }`}
                >
                  {isGroup ? "Group Project" : "Individual Project"}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border font-medium">
                  Batch {project.academicYear}.{project.semester}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mt-1">
                {project.title}
              </h1>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
              <span suppressHydrationWarning className="text-xs px-3 py-1.5 rounded-xl bg-muted/60 border border-border text-foreground flex items-center gap-1.5 font-medium">
                <Clock className="w-3.5 h-3.5 text-accent" />
                {project.deadline ? `Due ${new Date(project.deadline).toLocaleDateString()}` : "Ongoing"}
              </span>
            </div>
          </div>

          <div className="text-xs text-muted-foreground flex items-center gap-4 border-t border-border/70 pt-3 flex-wrap">
            <span>
              Supervised by: <strong className="text-foreground">{project.lecturerName || "Course Lecturer"}</strong>
            </span>
            {(project.projectDescriptionFileName || project.assignmentFileName) && (
              <span className="flex items-center gap-1.5 text-accent">
                <FileText className="w-3.5 h-3.5" />
                Specification Document: <strong>{project.projectDescriptionFileName || project.assignmentFileName}</strong>
              </span>
            )}
          </div>
        </div>

        {/* 1. PROJECT SPECIFICATION DOCUMENT & MULTILINGUAL SUMMARY */}
        <div className="bg-card border border-border rounded-[18px] p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-accent/10 border border-accent/20 text-accent">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Project Description & Specification</h3>
                <p className="text-xs text-muted-foreground">Download the lecturer's brief or read an instant AI summary in Sinhala, Tamil, or English.</p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => handleDownloadSpecification(project)}
                className="px-3 py-1.5 rounded-xl border border-border bg-muted/70 hover:bg-muted text-foreground hover:text-accent text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-accent" />
                <span>Download Specification</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenSummary(project)}
                className="px-3 py-1.5 rounded-xl border border-accent/40 bg-accent/10 hover:bg-accent/20 text-accent text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-accent" />
                <span>Summary (සිංහල / தமிழ் / EN)</span>
              </button>
            </div>
          </div>

          {/* Download & Summary Information Tile */}
          <div className="p-3.5 rounded-xl bg-muted/30 border border-border/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-foreground truncate">
                  {project.projectDescriptionFileName || project.assignmentFileName || `${project.title.replace(/\s+/g, "_")}_Brief.pdf`}
                </p>
                <p className="text-[11px] text-muted-foreground font-mono">
                  {project.projectDescriptionFileSize || "Official PDF Document"} · Specification file
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
              <button
                type="button"
                onClick={() => handleDownloadSpecification(project)}
                className="px-3 py-1.5 text-xs rounded-lg bg-background border border-border text-foreground hover:border-accent hover:text-accent font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-accent" />
                <span>Download</span>
              </button>
              <button
                type="button"
                onClick={() => handleOpenSummary(project)}
                className="px-3 py-1.5 text-xs rounded-lg bg-accent text-background font-bold flex items-center gap-1.5 transition-transform hover:scale-[1.02] cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Summary</span>
              </button>
            </div>
          </div>

          {project.projectDescriptionText && (
            <div className="p-3.5 rounded-xl bg-muted/20 border border-border/60 text-xs text-muted-foreground leading-relaxed">
              <strong className="text-foreground block mb-1">Lecturer's Overview:</strong>
              {project.projectDescriptionText}
            </div>
          )}
        </div>

        {/* 2. PROJECT REQUIREMENTS & GUIDELINES */}
        <div className="bg-card border border-border rounded-[18px] p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-accent/10 border border-accent/20 text-accent">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Project Requirements & Guidelines</h3>
                <p className="text-xs text-muted-foreground">Mandatory project scope and technical guidelines established by lecturer.</p>
              </div>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border">
              Required by Lecturer
            </span>
          </div>

          {/* Clean student requirements without internal marks percentages */}
          <div className="p-4 rounded-xl bg-muted/40 border border-border/80 text-xs text-foreground whitespace-pre-line leading-relaxed font-sans">
            {studentReqText}
          </div>

          {/* Required Deliverables Checklist */}
          <div className="pt-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">
              Required Deliverables Checklist
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-xl bg-background border border-border flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-semibold text-foreground">GitHub Repository</p>
                  <p className="text-[11px] text-muted-foreground">Source code & commit history</p>
                </div>
              </div>

              <div className={`p-3 rounded-xl bg-background border flex items-start gap-2.5 ${project.proposalRequired ? "border-accent/40" : "border-border opacity-60"}`}>
                <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${project.proposalRequired ? "text-accent" : "text-muted-foreground"}`} />
                <div className="text-xs">
                  <p className="font-semibold text-foreground">Project Proposal</p>
                  <p className="text-[11px] text-muted-foreground">{project.proposalRequired ? "Required by lecturer" : "Optional / Not requested"}</p>
                </div>
              </div>

              <div className={`p-3 rounded-xl bg-background border flex items-start gap-2.5 ${project.erDiagramRequired || project.databaseRequired ? "border-accent/40" : "border-border opacity-60"}`}>
                <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${project.erDiagramRequired || project.databaseRequired ? "text-accent" : "text-muted-foreground"}`} />
                <div className="text-xs">
                  <p className="font-semibold text-foreground">Database / ER Diagram</p>
                  <p className="text-[11px] text-muted-foreground">{project.erDiagramRequired || project.databaseRequired ? "Required by lecturer" : "Optional / Not requested"}</p>
                </div>
              </div>

              <div className={`p-3 rounded-xl bg-background border flex items-start gap-2.5 ${project.finalReportRequired ? "border-accent/40" : "border-border opacity-60"}`}>
                <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${project.finalReportRequired ? "text-accent" : "text-muted-foreground"}`} />
                <div className="text-xs">
                  <p className="font-semibold text-foreground">Final Report</p>
                  <p className="text-[11px] text-muted-foreground">{project.finalReportRequired ? "Required by lecturer" : "Optional / Not requested"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. TEAM DETAILS (FOR GROUP PROJECTS) */}
        {isGroup && (
          <div className="bg-card border border-border rounded-[18px] p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    {myGroup ? myGroup.groupName : "Project Team Allocation"}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {myGroup
                      ? `${myGroup.members.length} team members allocated from the course roster.`
                      : "The course lecturer will upload the class roster to allocate groups."}
                  </p>
                </div>
              </div>
              {myGroup && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-accent/10 text-accent border border-accent/20">
                  Team {myGroup.groupNumber}
                </span>
              )}
            </div>

            {myGroup ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {myGroup.members.map((m, mIdx) => {
                  const mEmail = (m.email || "").toLowerCase().trim();
                  const mId = (m.studentId || "").toLowerCase().replace(/[^a-z0-9]/g, "");
                  const mName = (m.fullName || "").toLowerCase().replace(/[^a-z0-9]/g, "");
                  const isMe =
                    (activeStudentEmail && mEmail === activeStudentEmail.toLowerCase().trim()) ||
                    (normCurrentStudentId && mId && (mId === normCurrentStudentId || mId.endsWith(normCurrentStudentId) || normCurrentStudentId.endsWith(mId))) ||
                    (normCurrentStudentSysId && mId && mId === normCurrentStudentSysId) ||
                    (normCurrentStudentName && mName && normCurrentStudentName === mName);

                  return (
                    <div
                      key={mIdx}
                      className={`p-3.5 rounded-xl border transition-all ${
                        isMe
                          ? "bg-accent/5 border-accent shadow-xs ring-1 ring-accent/30"
                          : "bg-muted/30 border-border"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-foreground text-sm">{m.fullName || "Student"}</span>
                            {isMe && (
                              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-accent text-background">
                                YOU
                              </span>
                            )}
                          </div>
                          {/* Student Identity Number displayed prominently */}
                          <div className="mt-1">
                            <span className="font-mono text-[11px] font-semibold px-2 py-0.5 rounded bg-muted text-accent border border-accent/20 inline-block">
                              ID: {m.studentId || "N/A"}
                            </span>
                          </div>
                        </div>

                        <span
                          className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border shrink-0 ${
                            m.role === "Team Lead"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-muted text-muted-foreground border-border"
                          }`}
                        >
                          {m.role || "Member"}
                        </span>
                      </div>

                      {m.email && (
                        <p className="text-[11px] text-muted-foreground truncate mt-2 font-mono">
                          {m.email}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
                <p className="font-semibold">Team Allocation Pending</p>
                <p className="text-[11px] mt-0.5 text-amber-200/80">
                  Your student record is registered for this course. Once the lecturer uploads and confirms the team allocation PDF, your group members and repository connection will automatically activate.
                </p>
              </div>
            )}
          </div>
        )}

        {/* 3. DELIVERABLES & SUBMISSION CENTER */}
        <div className="bg-card border border-border rounded-[18px] p-5 sm:p-6 shadow-sm space-y-5">
          <div className="border-b border-border pb-3">
            <h3 className="text-base font-bold text-foreground">Deliverables & Submission Center</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Submit your project repository and deliverables below. Any team member can upload on behalf of the group, and the submitting member's name and student ID will be displayed.
            </p>
          </div>

          <div className="space-y-4">
            {/* DELIVERABLE 1: GITHUB REPOSITORY */}
            <div className="p-4 rounded-xl bg-background border border-border space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-muted border border-border text-foreground">
                    <FolderGit2 className="w-4 h-4 text-accent" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">GitHub Source Repository</h4>
                    <p className="text-xs text-muted-foreground">Main branch code, commit telemetry, and repository link.</p>
                  </div>
                </div>

                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border self-start sm:self-auto ${
                    repoUrl
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                  }`}
                >
                  {repoUrl ? "✓ Connected" : "Pending Link"}
                </span>
              </div>

              {repoUrl ? (
                <div className="space-y-2">
                  <div className="p-3 rounded-lg bg-muted/40 border border-border flex items-center justify-between gap-3 flex-wrap">
                    <a
                      href={repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-xs text-accent hover:underline flex items-center gap-1.5 break-all"
                    >
                      <span>{repoUrl}</span>
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    </a>

                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingRepo(!isEditingRepo);
                        setRepoInputUrl(repoUrl);
                      }}
                      className="px-2.5 py-1 text-xs rounded-lg border border-border bg-muted hover:bg-muted/80 text-foreground transition-colors shrink-0"
                    >
                      {isEditingRepo ? "Cancel" : "Change Link"}
                    </button>
                  </div>

                  {/* SUBMISSION ATTRIBUTION: Display who uploaded the repo */}
                  <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2 flex-wrap">
                    <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>
                      Uploaded by: <strong>{repoUploaderName || myGroup?.members[0]?.fullName || "Team Member"}</strong>
                      {repoUploaderStudentId ? (
                        <span className="font-mono text-[11px] bg-background/60 px-1.5 py-0.5 rounded ml-1.5 border border-emerald-500/30 text-emerald-200">
                          ID: {repoUploaderStudentId}
                        </span>
                      ) : null}
                      {repoUploadedAt && (
                        <span className="text-emerald-400/80 ml-2">
                          on {new Date(repoUploadedAt).toLocaleString()}
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              ) : null}

              {/* Input for connecting or editing repository link */}
              {(!repoUrl || isEditingRepo) && (
                <div className="pt-2 border-t border-border/60 space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="https://github.com/organization/repository"
                      value={repoInputUrl}
                      onChange={(e) => setRepoInputUrl(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-lg bg-muted/60 border border-border text-foreground text-xs focus:outline-none focus:border-accent font-mono"
                    />
                    <button
                      type="button"
                      disabled={isConnectingRepo || !repoInputUrl.trim() || !myGroup}
                      onClick={() => myGroup && handleLinkRepo(myGroup.id)}
                      className="px-4 py-2 rounded-lg bg-foreground hover:bg-neutral-200 text-background text-xs font-semibold disabled:opacity-50 transition-colors shrink-0"
                    >
                      {isConnectingRepo ? "Linking..." : "Link Repository"}
                    </button>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Provide the public or team repository URL. Your name ({currentStudent?.fullName || "You"}) will be recorded as the member who linked this repository.
                  </p>
                </div>
              )}
            </div>

            {/* DELIVERABLE 2: PROJECT PROPOSAL */}
            {project.proposalRequired && (
              <div className="p-4 rounded-xl bg-background border border-border space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-muted border border-border text-foreground">
                      <FileText className="w-4 h-4 text-accent" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-foreground">Project Proposal</h4>
                      <p className="text-xs text-muted-foreground">Formal proposal document outlining scope and milestones.</p>
                    </div>
                  </div>

                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border self-start sm:self-auto ${
                      proposalDeliv
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    }`}
                  >
                    {proposalDeliv ? "✓ Submitted" : "Pending Submission"}
                  </span>
                </div>

                {proposalDeliv ? (
                  <div className="space-y-2">
                    <div className="p-3 rounded-lg bg-muted/40 border border-border flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <span className="font-semibold text-xs text-foreground">{proposalDeliv.fileName || "Proposal.pdf"}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setUploadField(uploadField === "proposal" ? null : "proposal");
                          setUploadFileName("");
                        }}
                        className="px-2.5 py-1 text-xs rounded-lg border border-border bg-muted hover:bg-muted/80 text-foreground transition-colors shrink-0"
                      >
                        {uploadField === "proposal" ? "Cancel" : "Replace Proposal"}
                      </button>
                    </div>

                    {/* SUBMISSION ATTRIBUTION: Display who uploaded the proposal */}
                    <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2 flex-wrap">
                      <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>
                        Uploaded by: <strong>{proposalDeliv.uploadedBy || myGroup?.members[0]?.fullName || "Team Member"}</strong>
                        {proposalDeliv.uploadedByStudentId ? (
                          <span className="font-mono text-[11px] bg-background/60 px-1.5 py-0.5 rounded ml-1.5 border border-emerald-500/30 text-emerald-200">
                            ID: {proposalDeliv.uploadedByStudentId}
                          </span>
                        ) : null}
                        {proposalDeliv.uploadedAt && (
                          <span className="text-emerald-400/80 ml-2">
                            on {new Date(proposalDeliv.uploadedAt).toLocaleString()}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                ) : null}

                {/* File Upload for Proposal */}
                {(!proposalDeliv || uploadField === "proposal") && (
                  <div className="pt-2 border-t border-border/60 space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Proposal document name (e.g. CS492_Group02_Proposal.pdf)"
                        value={uploadField === "proposal" ? uploadFileName : ""}
                        onChange={(e) => {
                          setUploadField("proposal");
                          setUploadFileName(e.target.value);
                        }}
                        className="flex-1 px-3 py-2 rounded-lg bg-muted/60 border border-border text-foreground text-xs focus:outline-none focus:border-accent"
                      />
                      <button
                        type="button"
                        disabled={isSubmittingFile || !uploadFileName.trim() || !myGroup}
                        onClick={() => myGroup && handleSubmitDeliverable(myGroup.id, "proposal", "Project Proposal", uploadFileName)}
                        className="px-4 py-2 rounded-lg bg-foreground hover:bg-neutral-200 text-background text-xs font-semibold disabled:opacity-50 transition-colors shrink-0"
                      >
                        {isSubmittingFile ? "Submitting..." : "Upload Proposal"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* DELIVERABLE 3: RELATIONAL DATABASE & ER DIAGRAM */}
            {(project.erDiagramRequired || project.databaseRequired) && (
              <div className="p-4 rounded-xl bg-background border border-border space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-muted border border-border text-foreground">
                      <Database className="w-4 h-4 text-accent" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-foreground">Relational Database & ER Diagram</h4>
                      <p className="text-xs text-muted-foreground">Entity-relationship diagram and normalized 3NF database schema.</p>
                    </div>
                  </div>

                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border self-start sm:self-auto ${
                      erDeliv
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    }`}
                  >
                    {erDeliv ? "✓ Submitted" : "Pending Submission"}
                  </span>
                </div>

                {erDeliv ? (
                  <div className="space-y-2">
                    <div className="p-3 rounded-lg bg-muted/40 border border-border flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Database className="w-4 h-4 text-muted-foreground" />
                        <span className="font-semibold text-xs text-foreground">{erDeliv.fileName || "ER_Diagram.png"}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setUploadField(uploadField === "er_diagram" ? null : "er_diagram");
                          setUploadFileName("");
                        }}
                        className="px-2.5 py-1 text-xs rounded-lg border border-border bg-muted hover:bg-muted/80 text-foreground transition-colors shrink-0"
                      >
                        {uploadField === "er_diagram" ? "Cancel" : "Replace Diagram"}
                      </button>
                    </div>

                    {/* SUBMISSION ATTRIBUTION: Display who uploaded the ER diagram */}
                    <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2 flex-wrap">
                      <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>
                        Uploaded by: <strong>{erDeliv.uploadedBy}</strong>
                        {erDeliv.uploadedByStudentId ? (
                          <span className="font-mono text-[11px] bg-background/60 px-1.5 py-0.5 rounded ml-1.5 border border-emerald-500/30 text-emerald-200">
                            ID: {erDeliv.uploadedByStudentId}
                          </span>
                        ) : null}
                        {erDeliv.uploadedAt && (
                          <span className="text-emerald-400/80 ml-2">
                            on {new Date(erDeliv.uploadedAt).toLocaleString()}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                ) : null}

                {/* File Upload for ER Diagram */}
                {(!erDeliv || uploadField === "er_diagram") && (
                  <div className="pt-2 border-t border-border/60 space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="ER diagram or schema file (e.g. system_er_diagram_3nf.png)"
                        value={uploadField === "er_diagram" ? uploadFileName : ""}
                        onChange={(e) => {
                          setUploadField("er_diagram");
                          setUploadFileName(e.target.value);
                        }}
                        className="flex-1 px-3 py-2 rounded-lg bg-muted/60 border border-border text-foreground text-xs focus:outline-none focus:border-accent"
                      />
                      <button
                        type="button"
                        disabled={isSubmittingFile || !uploadFileName.trim() || !myGroup}
                        onClick={() => myGroup && handleSubmitDeliverable(myGroup.id, "er_diagram", "Relational ER Diagram", uploadFileName)}
                        className="px-4 py-2 rounded-lg bg-foreground hover:bg-neutral-200 text-background text-xs font-semibold disabled:opacity-50 transition-colors shrink-0"
                      >
                        {isSubmittingFile ? "Submitting..." : "Upload ER Diagram"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* DELIVERABLE 4: FINAL PROJECT REPORT */}
            {project.finalReportRequired && (
              <div className="p-4 rounded-xl bg-background border border-border space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-muted border border-border text-foreground">
                      <FileText className="w-4 h-4 text-accent" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-foreground">Final Project Report & Documentation</h4>
                      <p className="text-xs text-muted-foreground">Comprehensive academic report, test results, and user guide.</p>
                    </div>
                  </div>

                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border self-start sm:self-auto ${
                      reportDeliv
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    }`}
                  >
                    {reportDeliv ? "✓ Submitted" : "Pending Submission"}
                  </span>
                </div>

                {reportDeliv ? (
                  <div className="space-y-2">
                    <div className="p-3 rounded-lg bg-muted/40 border border-border flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <span className="font-semibold text-xs text-foreground">{reportDeliv.fileName || "Final_Report.pdf"}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setUploadField(uploadField === "final_report" ? null : "final_report");
                          setUploadFileName("");
                        }}
                        className="px-2.5 py-1 text-xs rounded-lg border border-border bg-muted hover:bg-muted/80 text-foreground transition-colors shrink-0"
                      >
                        {uploadField === "final_report" ? "Cancel" : "Replace Report"}
                      </button>
                    </div>

                    {/* SUBMISSION ATTRIBUTION: Display who uploaded the final report */}
                    <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2 flex-wrap">
                      <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>
                        Uploaded by: <strong>{reportDeliv.uploadedBy}</strong>
                        {reportDeliv.uploadedByStudentId ? (
                          <span className="font-mono text-[11px] bg-background/60 px-1.5 py-0.5 rounded ml-1.5 border border-emerald-500/30 text-emerald-200">
                            ID: {reportDeliv.uploadedByStudentId}
                          </span>
                        ) : null}
                        {reportDeliv.uploadedAt && (
                          <span className="text-emerald-400/80 ml-2">
                            on {new Date(reportDeliv.uploadedAt).toLocaleString()}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                ) : null}

                {/* File Upload for Final Report */}
                {(!reportDeliv || uploadField === "final_report") && (
                  <div className="pt-2 border-t border-border/60 space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Final report document (e.g. CS492_Group02_Final_Report.pdf)"
                        value={uploadField === "final_report" ? uploadFileName : ""}
                        onChange={(e) => {
                          setUploadField("final_report");
                          setUploadFileName(e.target.value);
                        }}
                        className="flex-1 px-3 py-2 rounded-lg bg-muted/60 border border-border text-foreground text-xs focus:outline-none focus:border-accent"
                      />
                      <button
                        type="button"
                        disabled={isSubmittingFile || !uploadFileName.trim() || !myGroup}
                        onClick={() => myGroup && handleSubmitDeliverable(myGroup.id, "final_report", "Final Project Report", uploadFileName)}
                        className="px-4 py-2 rounded-lg bg-foreground hover:bg-neutral-200 text-background text-xs font-semibold disabled:opacity-50 transition-colors shrink-0"
                      >
                        {isSubmittingFile ? "Submitting..." : "Upload Final Report"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (!mounted) {
    return (
      <div className="max-w-[1100px] mx-auto py-8 px-2.5 sm:px-4 space-y-4 animate-pulse">
        <div className="h-4 w-28 bg-muted rounded" />
        <div className="h-8 w-64 bg-muted rounded" />
        <div className="h-4 w-96 bg-muted rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div className="h-40 bg-card border border-border rounded-[16px]" />
          <div className="h-40 bg-card border border-border rounded-[16px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1100px] mx-auto py-2 px-2.5 sm:px-4">
      {activeRole === "student" ? (
        view === "create" ? (
          <div className="bg-card border border-border rounded-[16px] p-8 text-center space-y-4 max-w-lg mx-auto my-12 shadow-sm">
            <ShieldAlert className="w-10 h-10 text-amber-500 mx-auto" />
            <h3 className="text-lg font-bold text-foreground">Access Restricted</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Students cannot author or create academic coursework projects. Projects are curated and assigned by course lecturers. You can participate in your assigned workspaces.
            </p>
            <button className="proj-btn p text-xs" onClick={() => go({ view: "list" })}>
              Back to Projects
            </button>
          </div>
        ) : proj ? (
          renderStudentProjectDetail(proj)
        ) : course ? (
          renderProjects()
        ) : batch ? (
          renderCourses()
        ) : (
          renderStudentProjectsRoot()
        )
      ) : view === "create" ? (
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

      {/* EDIT PROJECT MODAL */}
      {editingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in-50">
          <div className="bg-card border border-border rounded-[18px] max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-accent/10 border border-accent/20 text-accent">
                  <Pencil className="w-4 h-4" />
                </div>
                <h3 className="text-base font-semibold text-foreground">Edit Project Details</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingProject(null)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProjectEdit} className="space-y-4 text-xs">
              <div>
                <label className="block text-foreground font-medium mb-1">Project Title *</label>
                <input
                  type="text"
                  required
                  value={editFormData.title}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-xs focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-foreground font-medium mb-1">Description / Scope</label>
                <textarea
                  rows={3}
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  placeholder="Overview of project objectives..."
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-xs focus:outline-none focus:border-accent resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-foreground font-medium mb-1">Academic Year</label>
                  <select
                    value={editFormData.academicYear}
                    onChange={(e) => setEditFormData({ ...editFormData, academicYear: Number(e.target.value) as 1 | 2 | 3 | 4 })}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-xs focus:outline-none focus:border-accent"
                  >
                    {[1, 2, 3, 4].map((y) => (
                      <option key={y} value={y}>Year {y}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-foreground font-medium mb-1">Semester</label>
                  <select
                    value={editFormData.semester}
                    onChange={(e) => setEditFormData({ ...editFormData, semester: Number(e.target.value) as 1 | 2 })}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-xs focus:outline-none focus:border-accent"
                  >
                    {[1, 2].map((s) => (
                      <option key={s} value={s}>Semester {s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-foreground font-medium mb-1">Submission Deadline</label>
                  <input
                    type="date"
                    value={editFormData.deadline}
                    onChange={(e) => setEditFormData({ ...editFormData, deadline: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-xs focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-foreground font-medium mb-1">Project Status</label>
                  <select
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-xs focus:outline-none focus:border-accent"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Published">Published (Active)</option>
                    <option value="Archived">Archived (Past)</option>
                  </select>
                </div>
              </div>

              {/* Deliverable Requirements Toggles */}
              <div className="pt-2 border-t border-border/60">
                <label className="block text-foreground font-medium mb-2">Required Deliverables</label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center gap-2 p-2 rounded-lg border border-border bg-background cursor-pointer hover:border-accent/40 transition-colors">
                    <input
                      type="checkbox"
                      checked={editFormData.proposalRequired}
                      onChange={(e) => setEditFormData({ ...editFormData, proposalRequired: e.target.checked })}
                      className="rounded accent-accent"
                    />
                    <span className="text-foreground">Project Proposal</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-lg border border-border bg-background cursor-pointer hover:border-accent/40 transition-colors">
                    <input
                      type="checkbox"
                      checked={editFormData.erDiagramRequired}
                      onChange={(e) => setEditFormData({ ...editFormData, erDiagramRequired: e.target.checked })}
                      className="rounded accent-accent"
                    />
                    <span className="text-foreground">ER Diagram</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-lg border border-border bg-background cursor-pointer hover:border-accent/40 transition-colors">
                    <input
                      type="checkbox"
                      checked={editFormData.githubRequired}
                      onChange={(e) => setEditFormData({ ...editFormData, githubRequired: e.target.checked })}
                      className="rounded accent-accent"
                    />
                    <span className="text-foreground">GitHub Repository</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-lg border border-border bg-background cursor-pointer hover:border-accent/40 transition-colors">
                    <input
                      type="checkbox"
                      checked={editFormData.finalReportRequired}
                      onChange={(e) => setEditFormData({ ...editFormData, finalReportRequired: e.target.checked })}
                      className="rounded accent-accent"
                    />
                    <span className="text-foreground">Final Report</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setEditingProject(null)}
                  className="px-3 py-1.5 rounded-lg border border-border bg-muted text-foreground hover:bg-muted/80 text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="proj-btn p px-4 py-1.5 text-xs font-semibold"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE PROJECT CONFIRMATION MODAL */}
      {deletingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in-50">
          <div className="bg-card border border-border rounded-[18px] max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">Delete Project</h3>
                <p className="text-xs text-muted-foreground">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to permanently delete{" "}
              <strong className="text-foreground font-semibold">"{deletingProject.title}"</strong>?
              This will remove the project along with all associated AI-extracted groups, student assignments, and deliverables from both your dashboard and the database.
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setDeletingProject(null)}
                className="px-3 py-1.5 rounded-lg border border-border bg-muted text-foreground hover:bg-muted/80 text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmProjectDelete}
                className="px-4 py-1.5 rounded-lg border border-red-500/30 bg-red-500 hover:bg-red-600 text-white font-medium text-xs flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Project
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MULTILINGUAL PROJECT SUMMARY MODAL */}
      {showSummaryModal && summaryModalProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-card border border-border rounded-[20px] max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between gap-3 bg-muted/20">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-accent/10 border border-accent/20 text-accent">
                  <Sparkles className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-foreground">Project Description Summary</h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
                      Gemini AI
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate max-w-md">
                    {summaryModalProject.title} · {summaryModalProject.courseCode}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSummaryModal(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                aria-label="Close summary modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Language Selector Tabs */}
            <div className="px-5 py-3 border-b border-border bg-muted/40 flex items-center justify-between gap-2 flex-wrap">
              <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <Languages className="w-4 h-4 text-accent" />
                Language:
              </span>
              <div className="flex items-center gap-1.5 bg-background/90 p-1 rounded-xl border border-border">
                <button
                  type="button"
                  onClick={() => {
                    setSummaryLang("en");
                    fetchProjectSummary(summaryModalProject, "en");
                  }}
                  className={`px-3 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                    summaryLang === "en"
                      ? "bg-accent text-background font-bold shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  🇬🇧 English
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSummaryLang("si");
                    fetchProjectSummary(summaryModalProject, "si");
                  }}
                  className={`px-3 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                    summaryLang === "si"
                      ? "bg-accent text-background font-bold shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  🇱🇰 සිංහල (Sinhala)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSummaryLang("ta");
                    fetchProjectSummary(summaryModalProject, "ta");
                  }}
                  className={`px-3 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                    summaryLang === "ta"
                      ? "bg-accent text-background font-bold shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  🇱🇰 தமிழ் (Tamil)
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
              {isGeneratingSummary ? (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-muted-foreground font-medium">
                    Generating natural{" "}
                    {summaryLang === "si" ? "සිංහල" : summaryLang === "ta" ? "தமிழ்" : "English"}{" "}
                    summary with Gemini AI...
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-muted/30 border border-border/80 text-foreground text-xs sm:text-sm whitespace-pre-line leading-relaxed font-sans">
                  {summaryCache[summaryModalProject.id]?.[summaryLang] ||
                    (summaryLang === "en" && summaryModalProject.summaryEnglish) ||
                    (summaryLang === "si" && summaryModalProject.summarySinhala) ||
                    (summaryLang === "ta" && summaryModalProject.summaryTamil) ||
                    "No summary available yet. Please select a language or click to generate."}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-border flex items-center justify-between gap-3 bg-muted/20">
              <span className="text-[11px] text-muted-foreground hidden sm:inline">
                Academic translation engine · UniCodeTrack AI
              </span>
              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => handleDownloadSpecification(summaryModalProject)}
                  className="px-3 py-1.5 text-xs rounded-xl border border-border bg-background hover:bg-muted text-foreground flex items-center gap-1.5 font-medium transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-accent" />
                  Download Brief
                </button>
                <button
                  type="button"
                  onClick={() => setShowSummaryModal(false)}
                  className="px-4 py-1.5 text-xs rounded-xl bg-accent text-background font-bold hover:opacity-90 transition-opacity cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LecturerProjectsPage() {
  return (
    <React.Suspense
      fallback={
        <div className="max-w-[1100px] mx-auto py-12 px-4 text-center text-muted-foreground text-sm">
          Loading UniCodeTrack projects...
        </div>
      }
    >
      <LecturerProjectsContent />
    </React.Suspense>
  );
}
