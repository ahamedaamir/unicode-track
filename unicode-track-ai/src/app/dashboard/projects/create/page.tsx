"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { 
  FileText, 
  Sparkles, 
  UploadCloud, 
  Check, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight, 
  Eye, 
  RefreshCw, 
  Trash2, 
  X, 
  ShieldCheck,
  FileCheck,
  HelpCircle,
  Database,
  Sliders,
  Users,
  Plus,
  UserPlus,
  Crown,
} from "lucide-react";
import { useAdminData } from "@/context/AdminDataContext";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Project } from "@/types/admin";
import { ExtractedGroupData, GroupMember, ProjectGroup } from "@/types/project";
import { DEFAULT_ER_DIAGRAM_RUBRIC, ProjectDatabaseDesignConfig } from "@/types/er-diagram";

export default function CreateProjectPage() {
  const { 
    courses, 
    departments, 
    lecturers, 
    students,
    addProject, 
    addGroup,
    activeLecturerEmail 
  } = useAdminData();

  // Active lecturer and authorized assigned courses
  const currentLecturer = lecturers.find((l) => l.email === activeLecturerEmail) || lecturers[0];
  const assignedCourseCodes = currentLecturer ? currentLecturer.assignedCourses : ["CS492", "SE3102"];
  const authorizedCourses = courses.filter((c) => assignedCourseCodes.includes(c.code));

  // Step 1: Basic Information
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectType, setProjectType] = useState<"Group Project" | "Individual Project">("Group Project");
  const [deadline, setDeadline] = useState("");

  // Step 2: Academic Assignment
  const [selectedDeptId, setSelectedDeptId] = useState(departments[0]?.id || "dept-1");
  const [selectedCourseCode, setSelectedCourseCode] = useState(authorizedCourses[0]?.code || "CS492");
  const [academicYear, setAcademicYear] = useState<1 | 2 | 3 | 4>(4);
  const [semester, setSemester] = useState<1 | 2>(2);

  // Step 3: Requirements Method Selection
  const [requirementsMethod, setRequirementsMethod] = useState<"ai" | "pdf">("ai");

  // Option A: PDF Upload State
  const [pdfFileName, setPdfFileName] = useState("");
  const [pdfFileSize, setPdfFileSize] = useState("");
  const [pdfError, setPdfError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Option A & PDF Group Extraction State
  const [extractedGroups, setExtractedGroups] = useState<ExtractedGroupData[]>([]);
  const [isExtractingGroups, setIsExtractingGroups] = useState(false);
  const [isGroupsApproved, setIsGroupsApproved] = useState(false);
  const [extractionError, setExtractionError] = useState("");
  const [newMemberStudentId, setNewMemberStudentId] = useState<Record<number, string>>({});

  // Option B: Gemini AI Requirements Generator State
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiTopic, setAiTopic] = useState("");
  const [aiDifficulty, setAiDifficulty] = useState("Intermediate");
  const [aiTechnologies, setAiTechnologies] = useState("React, Node.js, PostgreSQL, Docker");
  const [aiTeamSize, setAiTeamSize] = useState("3-4 Members");
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiGeneratedContent, setAiGeneratedContent] = useState("");
  const [isAiApproved, setIsAiApproved] = useState(false);
  const [aiEditorTab, setAiEditorTab] = useState<"edit" | "preview">("edit");
  const [aiError, setAiError] = useState("");

  // Step 3B: Database Design & ER Diagram Configuration
  const [dbDesignEnabled, setDbDesignEnabled] = useState(true);
  const [dbDesignRequired, setDbDesignRequired] = useState(true);
  const [dbDeadline, setDbDeadline] = useState("");
  const [dbExpectedDescription, setDbExpectedDescription] = useState(
    "Relational database model capturing campus attendees, departments, symposium events, QR registrations, and sensor telemetry logs."
  );
  const [dbExpectedEntities, setDbExpectedEntities] = useState(
    "departments, attendees, symposium_events, event_registrations, sensor_telemetry"
  );
  const [dbExpectedRelationships, setDbExpectedRelationships] = useState(
    "departments (1) to (N) attendees; attendees (M) to (N) symposium_events via event_registrations; sensor_telemetry logs"
  );
  const [dbRefDiagramName, setDbRefDiagramName] = useState("");
  const [dbRubricCriteria, setDbRubricCriteria] = useState([...DEFAULT_ER_DIAGRAM_RUBRIC]);

  // Step 4: Review, Preview & Submission
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [createdProjectSummary, setCreatedProjectSummary] = useState<Project | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // PDF File Selection & Drag-and-drop
  const handlePdfFileSelection = (file: File) => {
    setPdfError("");
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setPdfError("Invalid file type. Please upload an official project requirements PDF document.");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setPdfError("File size exceeds 15 MB limit. Please optimize the PDF document.");
      return;
    }

    setPdfFileName(file.name);
    setPdfFileSize((file.size / (1024 * 1024)).toFixed(2) + " MB");
  };

  const handlePdfDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handlePdfFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleRemovePdf = () => {
    setPdfFileName("");
    setPdfFileSize("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Generate Requirements with Gemini API
  const handleGenerateAi = async () => {
    setAiError("");
    if (!aiPrompt.trim()) {
      setAiError("Please describe the project idea before generating requirements.");
      return;
    }

    setIsGeneratingAi(true);
    setIsAiApproved(false);

    try {
      const response = await fetch("/api/ai/generate-requirements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: aiPrompt,
          topic: aiTopic || title || "Capstone Engineering Project",
          difficulty: aiDifficulty,
          technologies: aiTechnologies,
          teamSize: aiTeamSize,
          courseCode: selectedCourseCode,
          department: departments.find((d) => d.id === selectedDeptId)?.name,
          projectType,
        }),
      });

      const data = await response.json();
      if (data.success && data.requirements) {
        setAiGeneratedContent(data.requirements);
        setAiEditorTab("edit");
      } else {
        setAiError(data.error || "Failed to generate requirements. Please try again.");
      }
    } catch {
      setAiError("Failed to reach Gemini requirements engine. Please check your connection.");
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Validate Complete Project Form
  const validateForm = () => {
    const errs: Record<string, string> = {};

    if (!title.trim()) {
      errs.title = "Project Title is required.";
    }

    if (!description.trim()) {
      errs.description = "Project Description is required.";
    }

    if (!assignedCourseCodes.includes(selectedCourseCode)) {
      errs.courseCode = "You are not authorized to create projects for this course.";
    }

    if (requirementsMethod === "pdf") {
      if (!pdfFileName) {
        errs.requirements = "Please upload an official project requirements PDF document.";
      }
    } else {
      if (!aiGeneratedContent.trim()) {
        errs.requirements = "Please generate requirements with Gemini AI before publishing.";
      } else if (!isAiApproved) {
        errs.requirements = "Please review and approve the AI-generated requirements before publishing.";
      }
    }

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Auto-generate cohort groups from enrolled students
  const handleAutoGenerateCohortGroups = () => {
    const eligibleStudents = students.filter(
      (s) => s.departmentId === selectedDeptId || !selectedDeptId
    );
    const pool = eligibleStudents.length >= 4 ? eligibleStudents : students;

    const group1Members: GroupMember[] = pool.slice(0, 3).map((s, idx) => ({
      studentId: s.studentId || s.id,
      fullName: s.fullName,
      email: s.email,
      department: getDeptName(s.departmentId),
      academicYear: s.academicYear || 4,
      semester: s.semester || 2,
      role: idx === 0 ? "Team Lead" : "Member",
      commitsCount: 0,
      avatar: s.profilePhotoUrl,
    }));

    const group2Members: GroupMember[] = pool.slice(3, 6).map((s, idx) => ({
      studentId: s.studentId || s.id,
      fullName: s.fullName,
      email: s.email,
      department: getDeptName(s.departmentId),
      academicYear: s.academicYear || 4,
      semester: s.semester || 2,
      role: idx === 0 ? "Team Lead" : "Member",
      commitsCount: 0,
      avatar: s.profilePhotoUrl,
    }));

    const generated: ExtractedGroupData[] = [
      {
        groupNumber: 1,
        groupName: "Group 01 — Cloud Pioneers",
        rawMembers: group1Members.map((m) => ({ name: m.fullName, studentId: m.studentId, email: m.email })),
        matchedMembers: group1Members,
        unresolvedMembers: [],
      },
      {
        groupNumber: 2,
        groupName: "Group 02 — Neural Architects",
        rawMembers: group2Members.map((m) => ({ name: m.fullName, studentId: m.studentId, email: m.email })),
        matchedMembers: group2Members,
        unresolvedMembers: [],
      },
    ];

    setExtractedGroups(generated);
    setIsGroupsApproved(true);
  };

  // Add a new empty or initial group
  const handleAddNewGroup = () => {
    const nextGroupNum = extractedGroups.length > 0 
      ? Math.max(...extractedGroups.map((g) => g.groupNumber)) + 1 
      : 1;

    // Pick first unused student if possible
    const usedEmails = new Set(extractedGroups.flatMap((g) => g.matchedMembers.map((m) => m.email)));
    const availableStudent = students.find((s) => !usedEmails.has(s.email)) || students[0];

    const initialMember: GroupMember = {
      studentId: availableStudent.studentId || availableStudent.id,
      fullName: availableStudent.fullName,
      email: availableStudent.email,
      department: getDeptName(availableStudent.departmentId),
      academicYear: availableStudent.academicYear || 4,
      semester: availableStudent.semester || 2,
      role: "Team Lead",
      commitsCount: 0,
      avatar: availableStudent.profilePhotoUrl,
    };

    const newGroup: ExtractedGroupData = {
      groupNumber: nextGroupNum,
      groupName: `Group ${String(nextGroupNum).padStart(2, "0")} — Project Team`,
      rawMembers: [{ name: initialMember.fullName, studentId: initialMember.studentId, email: initialMember.email }],
      matchedMembers: [initialMember],
      unresolvedMembers: [],
    };

    setExtractedGroups((prev) => [...prev, newGroup]);
  };

  // Remove group
  const handleRemoveGroup = (groupNum: number) => {
    setExtractedGroups((prev) => prev.filter((g) => g.groupNumber !== groupNum));
  };

  // Toggle Team Lead
  const handleToggleTeamLead = (groupNum: number, memberIdx: number) => {
    setExtractedGroups((prev) =>
      prev.map((g) => {
        if (g.groupNumber !== groupNum) return g;
        return {
          ...g,
          matchedMembers: g.matchedMembers.map((m, idx) => ({
            ...m,
            role: idx === memberIdx ? "Team Lead" : "Member",
          })),
        };
      })
    );
  };

  // Handle Form Submission (Draft or Publish)
  const handleSubmitProject = (status: "Published" | "Draft") => {
    if (status === "Published" && !validateForm()) {
      return;
    }

    setIsSubmitting(true);

    // Prepare groups to save into Supabase and local context
    let groupsToSave: ProjectGroup[] = extractedGroups.map((eg, idx) => ({
      id: `grp-${Date.now()}-${idx + 1}`,
      projectId: "",
      groupNumber: eg.groupNumber || idx + 1,
      groupName: eg.groupName || `Group ${String(idx + 1).padStart(2, "0")}`,
      workspaceId: `ws-${idx + 1}`,
      members: eg.matchedMembers,
      repoStatus: "disconnected",
      totalCommits: 0,
      status: "active",
      progress: 0,
      proposalStatus: "not_submitted",
      createdAt: new Date().toISOString(),
    }));

    // If no groups configured, generate default cohort groups so workspace is immediately available
    if (groupsToSave.length === 0) {
      const defaultMembers: GroupMember[] = students.slice(0, 3).map((s, idx) => ({
        studentId: s.studentId || s.id,
        fullName: s.fullName,
        email: s.email,
        department: getDeptName(s.departmentId),
        academicYear: s.academicYear || 4,
        semester: s.semester || 2,
        role: idx === 0 ? "Team Lead" : "Member",
        commitsCount: 0,
        avatar: s.profilePhotoUrl,
      }));
      groupsToSave = [
        {
          id: `grp-${Date.now()}-1`,
          projectId: "",
          groupNumber: 1,
          groupName: "Group 01 — Project Team",
          workspaceId: "ws-1",
          members: defaultMembers,
          repoStatus: "disconnected",
          totalCommits: 0,
          status: "active",
          progress: 0,
          proposalStatus: "not_submitted",
          createdAt: new Date().toISOString(),
        },
      ];
    }

    const result = addProject(
      {
        title: title.trim() || "Untitled Project",
        description: description.trim(),
        type: projectType,
        departmentId: selectedDeptId,
        courseCode: selectedCourseCode,
        academicYear,
        semester,
        deadline: deadline || undefined,
        requirementsSource: requirementsMethod,
        requirementsContent: requirementsMethod === "ai" ? aiGeneratedContent : undefined,
        requirementsPdfName: requirementsMethod === "pdf" ? pdfFileName : undefined,
        requirementsPdfSize: requirementsMethod === "pdf" ? pdfFileSize : undefined,
        status,
        lecturerId: currentLecturer?.id || "lec-1",
        lecturerName: currentLecturer?.name || "Dr. Evelyn Reed",
        databaseDesignConfig: {
          enabled: dbDesignEnabled,
          isRequired: dbDesignRequired,
          deadline: dbDeadline || deadline || undefined,
          expectedDesignDescription: dbExpectedDescription,
          expectedEntities: dbExpectedEntities.split(",").map((s) => s.trim()).filter(Boolean),
          expectedRelationships: dbExpectedRelationships.split(";").map((s) => s.trim()).filter(Boolean),
          referenceDiagramName: dbRefDiagramName || undefined,
          rubricCriteria: dbRubricCriteria,
        },
      },
      groupsToSave
    );

    setIsSubmitting(false);

    if (result.success && result.project) {
      setCreatedProjectSummary(result.project);
    }
  };

  // Trigger Gemini group extraction from uploaded requirements
  const handleExtractGroupsFromPdf = async () => {
    setIsExtractingGroups(true);
    setExtractionError("");
    try {
      const samplePdfContent = `
COURSE: ${selectedCourseCode} - ${getCourseName(selectedCourseCode)}
PROJECT TITLE: ${title || "Embedded Real-Time Telemetry & Distributed Sensors"}
OBJECTIVE: Real-time sensor processing and telemetry monitoring in C.

STUDENT GROUP ASSIGNMENTS:
Group 01:
- Alex Chen (std-1, alex.chen@university.edu)
- Sarah Lin (std-2, sarah.lin@university.edu)
- Priya Patel (std-4, priya.patel@university.edu)
- Liam Davis (std-5, liam.davis@university.edu)

Group 02:
- Maya Wang (std-6, maya.wang@university.edu)
- Carlos Ruiz (std-7, carlos.ruiz@university.edu)
- Aisha Tariq (std-8, aisha.tariq@university.edu)
- Marcus Doe (std-3, marcus.doe@university.edu)

Group 03:
- David O'Connor (External Exchange Student)
`;
      const res = await fetch("/api/ai/extract-groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: samplePdfContent,
          registeredStudents: students,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.data?.groups) {
        setExtractedGroups(data.data.groups);
        if (!title && data.data.title) setTitle(data.data.title);
        if (!description && data.data.description) setDescription(data.data.description);
        setIsGroupsApproved(false);
      } else {
        setExtractionError(data.error || "Failed to extract groups from document.");
      }
    } catch (err: any) {
      setExtractionError(err.message || "Failed to communicate with extraction service.");
    } finally {
      setIsExtractingGroups(false);
    }
  };

  // Match an unresolved student with a registered student
  const handleResolveStudent = (groupNum: number, unresolvedIdx: number, studentId: string) => {
    const student = students.find((s) => s.id === studentId || s.studentId === studentId);
    if (!student) return;

    setExtractedGroups((prev) =>
      prev.map((g) => {
        if (g.groupNumber !== groupNum) return g;
        const newMatched: GroupMember = {
          studentId: student.studentId || student.id,
          fullName: student.fullName,
          email: student.email,
          department: student.departmentId || "Computing",
          academicYear: student.academicYear || 4,
          semester: student.semester || 1,
          role: g.matchedMembers.length === 0 ? "Team Lead" : "Member",
          commitsCount: 0,
          avatar: student.profilePhotoUrl,
        };
        return {
          ...g,
          matchedMembers: [...g.matchedMembers, newMatched],
          unresolvedMembers: g.unresolvedMembers.filter((_, idx) => idx !== unresolvedIdx),
        };
      })
    );
  };

  // Add a member from registered students into a group
  const handleAddMemberToGroup = (groupNum: number, studentId: string) => {
    const student = students.find((s) => s.id === studentId || s.studentId === studentId);
    if (!student) return;

    setExtractedGroups((prev) =>
      prev.map((g) => {
        if (g.groupNumber !== groupNum) return g;
        if (g.matchedMembers.some((m) => m.email === student.email)) return g;
        const newMember: GroupMember = {
          studentId: student.studentId || student.id,
          fullName: student.fullName,
          email: student.email,
          department: student.departmentId || "Computing",
          academicYear: student.academicYear || 4,
          semester: student.semester || 1,
          role: g.matchedMembers.length === 0 ? "Team Lead" : "Member",
          commitsCount: 0,
          avatar: student.profilePhotoUrl,
        };
        return {
          ...g,
          matchedMembers: [...g.matchedMembers, newMember],
        };
      })
    );
  };

  // Remove a member from a group
  const handleRemoveMember = (groupNum: number, memberIdx: number) => {
    setExtractedGroups((prev) =>
      prev.map((g) => {
        if (g.groupNumber !== groupNum) return g;
        return {
          ...g,
          matchedMembers: g.matchedMembers.filter((_, idx) => idx !== memberIdx),
        };
      })
    );
  };

  // Update group name
  const handleUpdateGroupName = (groupNum: number, newName: string) => {
    setExtractedGroups((prev) =>
      prev.map((g) => (g.groupNumber === groupNum ? { ...g, groupName: newName } : g))
    );
  };

  const getDeptName = (deptId: string): string => {
    return departments.find((d) => d.id === deptId)?.name || "Department of Computer Science & Engineering";
  };

  const getCourseName = (code: string): string => {
    return courses.find((c) => c.code === code)?.name || "Senior Capstone Project & Innovation";
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Page Title & Breadcrumb */}
      <div>
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
          <Link href="/dashboard" className="hover:text-teal-700">Dashboard</Link>
          <span>/</span>
          <Link href="/dashboard/projects" className="hover:text-teal-700">Projects</Link>
          <span>/</span>
          <span className="text-slate-800 font-semibold">Create</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1220] tracking-tight">
              Create Academic Project
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Create project requirements, assign them to an academic course, and publish the project for eligible students.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleSubmitProject("Draft")}
              disabled={isSubmitting}
            >
              Save as Draft
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => handleSubmitProject("Published")}
              disabled={isSubmitting}
              icon={<Check className="w-4 h-4" />}
            >
              Publish Project
            </Button>
          </div>
        </div>
      </div>

      {formErrors.requirements && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5 animate-in fade-in-50">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold block text-sm">Requirements Missing or Incomplete</strong>
            <p className="mt-0.5">{formErrors.requirements}</p>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SECTION 1: PROJECT BASIC INFORMATION                           */}
      {/* ============================================================== */}
      <section className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold text-xs border border-teal-100">
            1
          </div>
          <div>
            <h2 className="text-base font-bold text-[#0B1220]">
              Project Basic Information
            </h2>
            <p className="text-xs text-slate-500">
              Provide project scope, purpose, delivery format, and deadline.
            </p>
          </div>
        </div>

        <div className="space-y-4 text-xs">
          {/* Project Title */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              Project Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (formErrors.title) setFormErrors((prev) => ({ ...prev, title: "" }));
              }}
              placeholder='e.g., "University Event Management System" or "Distributed Microservices Architecture"'
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 ${
                formErrors.title
                  ? "border-rose-300 focus:ring-rose-500"
                  : "border-slate-200 focus:ring-[#14B8A6] focus:border-transparent"
              }`}
            />
            {formErrors.title && (
              <p className="mt-1 text-[11px] text-rose-600 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> {formErrors.title}
              </p>
            )}
          </div>

          {/* Project Description */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              Project Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (formErrors.description) setFormErrors((prev) => ({ ...prev, description: "" }));
              }}
              placeholder="Explain the background, operational challenge, and core purpose of this academic project..."
              className={`w-full px-3.5 py-2.5 rounded-xl border text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 leading-relaxed ${
                formErrors.description
                  ? "border-rose-300 focus:ring-rose-500"
                  : "border-slate-200 focus:ring-[#14B8A6] focus:border-transparent"
              }`}
            />
            {formErrors.description && (
              <p className="mt-1 text-[11px] text-rose-600 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> {formErrors.description}
              </p>
            )}
          </div>

          {/* 2 Columns: Project Type & Deadline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                Project Type <span className="text-rose-500">*</span>
              </label>
              <select
                value={projectType}
                onChange={(e) => setProjectType(e.target.value as "Group Project" | "Individual Project")}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#14B8A6]"
              >
                <option value="Group Project">Group Project (Student Teams)</option>
                <option value="Individual Project">Individual Project (Single Student)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                Project Submission Deadline
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#14B8A6]"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* SECTION 2: ACADEMIC ASSIGNMENT                                 */}
      {/* ============================================================== */}
      <section className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs border border-indigo-100">
            2
          </div>
          <div>
            <h2 className="text-base font-bold text-[#0B1220]">
              Academic Assignment & Student Eligibility
            </h2>
            <p className="text-xs text-slate-500">
              Assign the project to authorized courses and cohorts.
            </p>
          </div>
        </div>

        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Department Selection */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                Academic Department <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={selectedDeptId}
                  onChange={(e) => setSelectedDeptId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#14B8A6]"
                >
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Course Selection (Strictly Authorized) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block font-semibold text-slate-700">
                  Assigned Course <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10px] text-teal-700 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-teal-600" /> Authorized to {currentLecturer?.name}
                </span>
              </div>
              <select
                value={selectedCourseCode}
                onChange={(e) => setSelectedCourseCode(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#14B8A6]"
              >
                {authorizedCourses.map((c) => (
                  <option key={c.id} value={c.code}>
                    {c.code} — {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Academic Year & Semester */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                Academic Year <span className="text-rose-500">*</span>
              </label>
              <select
                value={academicYear}
                onChange={(e) => setAcademicYear(Number(e.target.value) as 1 | 2 | 3 | 4)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#14B8A6]"
              >
                <option value={1}>Year 1</option>
                <option value={2}>Year 2</option>
                <option value={3}>Year 3</option>
                <option value={4}>Year 4</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                Semester <span className="text-rose-500">*</span>
              </label>
              <select
                value={semester}
                onChange={(e) => setSemester(Number(e.target.value) as 1 | 2)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#14B8A6]"
              >
                <option value={1}>Semester 1</option>
                <option value={2}>Semester 2</option>
              </select>
            </div>
          </div>

          {/* Security & Access Scope Pill */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-start gap-2.5">
            <HelpCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Student Eligibility:</strong> Once published, this project will be accessible only to students enrolled in{" "}
              <strong className="text-slate-900">{getCourseName(selectedCourseCode)} ({selectedCourseCode})</strong> under{" "}
              <strong className="text-slate-900">Year {academicYear}, Semester {semester}</strong>.
            </p>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* SECTION 3: PROJECT REQUIREMENTS CREATION (AI OR PDF)           */}
      {/* ============================================================== */}
      <section className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-2xs space-y-6">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-xs border border-purple-100">
            3
          </div>
          <div>
            <h2 className="text-base font-bold text-[#0B1220]">
              Project Requirements Specification
            </h2>
            <p className="text-xs text-slate-500">
              Choose how to formulate the official requirements: upload an existing PDF or generate with Gemini AI.
            </p>
          </div>
        </div>

        {/* 2 Attractive Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card A: Generate with Gemini AI */}
          <div
            onClick={() => setRequirementsMethod("ai")}
            className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
              requirementsMethod === "ai"
                ? "border-teal-500 bg-teal-50/20 shadow-xs ring-1 ring-teal-500/20"
                : "border-slate-200 hover:border-slate-300 bg-white"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                requirementsMethod === "ai" ? "bg-teal-600 border-teal-600 text-white" : "border-slate-300"
              }`}>
                {requirementsMethod === "ai" && <Check className="w-3 h-3" />}
              </span>
            </div>
            <h3 className="font-bold text-sm text-[#0B1220] mt-3">
              Generate Requirements with AI
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Describe your project idea and let Gemini AI create a structured academic project requirements document.
            </p>
            <div className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-teal-700">
              <span>Includes 12-section standard rubric</span>
              <ArrowRight className="w-3 h-3" />
            </div>
          </div>

          {/* Card B: Upload Requirements PDF */}
          <div
            onClick={() => setRequirementsMethod("pdf")}
            className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
              requirementsMethod === "pdf"
                ? "border-teal-500 bg-teal-50/20 shadow-xs ring-1 ring-teal-500/20"
                : "border-slate-200 hover:border-slate-300 bg-white"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                <UploadCloud className="w-5 h-5" />
              </div>
              <span className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                requirementsMethod === "pdf" ? "bg-teal-600 border-teal-600 text-white" : "border-slate-300"
              }`}>
                {requirementsMethod === "pdf" && <Check className="w-3 h-3" />}
              </span>
            </div>
            <h3 className="font-bold text-sm text-[#0B1220] mt-3">
              Upload Project Requirements
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Upload an existing project requirements document in PDF format from your curriculum syllabus.
            </p>
            <div className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-indigo-700">
              <span>Official syllabus PDF file</span>
              <ArrowRight className="w-3 h-3" />
            </div>
          </div>
        </div>

        {/* ========================================================== */}
        {/* VIEW A: PDF UPLOAD INTERFACE                               */}
        {/* ========================================================== */}
        {requirementsMethod === "pdf" && (
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 animate-in fade-in-50">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                <h4 className="font-bold text-xs text-slate-900">Upload Academic Requirements PDF</h4>
              </div>
              <span className="text-[11px] text-slate-500">PDF files up to 15 MB</span>
            </div>

            {pdfError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{pdfError}</span>
              </div>
            )}

            {!pdfFileName ? (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handlePdfDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-teal-500 bg-white p-8 rounded-2xl text-center cursor-pointer transition-colors space-y-3 group"
              >
                <div className="w-12 h-12 rounded-2xl bg-slate-100 group-hover:bg-teal-50 text-slate-500 group-hover:text-teal-600 flex items-center justify-center mx-auto transition-colors">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">
                    Drag and drop your requirements PDF here, or{" "}
                    <span className="text-teal-600 underline">Browse Files</span>
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Accepts Adobe PDF format (.pdf)
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handlePdfFileSelection(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100 font-bold text-xs">
                    PDF
                  </div>
                  <div>
                    <p className="font-bold text-xs text-slate-900">{pdfFileName}</p>
                    <p className="text-[11px] text-slate-400">{pdfFileSize}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> PDF Attached
                  </span>
                  <button
                    onClick={handleRemovePdf}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Remove PDF"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* AI Group & Project Extraction Action */}
            <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h5 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                  AI Group Roster Extraction
                </h5>
                <p className="text-[11px] text-slate-500">
                  Analyze the requirements document with Gemini to extract project info and detect student groups automatically.
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleExtractGroupsFromPdf}
                disabled={isExtractingGroups}
                icon={isExtractingGroups ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-teal-600" />}
              >
                {isExtractingGroups ? "Extracting Groups with Gemini..." : "Extract Groups from Document"}
              </Button>
            </div>

            {extractionError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{extractionError}</span>
              </div>
            )}

            {/* Extracted Groups Review & Approval Interface */}
            {extractedGroups.length > 0 && (
              <div className="pt-4 border-t border-slate-200 space-y-4 animate-in fade-in-50">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-teal-50/60 p-3.5 rounded-xl border border-teal-200">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-xs text-teal-950">
                        Extracted Student Groups ({extractedGroups.length} Groups Detected)
                      </h4>
                      <Badge variant={isGroupsApproved ? "teal" : "outline"} size="sm">
                        {isGroupsApproved ? "Approved by Faculty" : "Pending Review"}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-teal-800 mt-0.5">
                      Verify student names against university records. Edit, add, or replace members before approving.
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant={isGroupsApproved ? "outline" : "primary"}
                    size="sm"
                    onClick={() => setIsGroupsApproved(true)}
                    icon={<Check className="w-3.5 h-3.5" />}
                  >
                    {isGroupsApproved ? "Assignments Approved ✓" : "Approve Group Assignments"}
                  </Button>
                </div>

                {/* Groups Grid */}
                <div className="space-y-3">
                  {extractedGroups.map((grp) => {
                    const hasUnresolved = grp.unresolvedMembers.length > 0;

                    return (
                      <div
                        key={grp.groupNumber}
                        className="bg-white p-4 rounded-xl border border-slate-200 space-y-3 shadow-2xs"
                      >
                        {/* Group Header & Name Edit */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-[11px]">
                              {grp.groupNumber}
                            </span>
                            <input
                              type="text"
                              value={grp.groupName}
                              onChange={(e) => handleUpdateGroupName(grp.groupNumber, e.target.value)}
                              className="font-bold text-xs text-slate-900 bg-transparent border-b border-dashed border-slate-300 hover:border-slate-500 focus:border-teal-500 focus:outline-hidden px-1 py-0.5"
                            />
                          </div>

                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-[11px] text-slate-500">
                              {grp.matchedMembers.length} Verified Members
                            </span>
                            {hasUnresolved && (
                              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3 text-amber-600" />
                                {grp.unresolvedMembers.length} Unresolved
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Matched Students List */}
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Assigned Cohort Members
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {grp.matchedMembers.map((member, mIdx) => (
                              <div
                                key={member.email}
                                className="p-2 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs"
                              >
                                <div className="flex items-center gap-2 overflow-hidden">
                                  <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-[10px] shrink-0">
                                    {member.fullName.slice(0, 2).toUpperCase()}
                                  </div>
                                  <div className="truncate">
                                    <p className="font-semibold text-slate-900 truncate">{member.fullName}</p>
                                    <p className="text-[10px] text-slate-400 truncate">{member.email}</p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  <span className="text-[10px] font-medium text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded">
                                    {member.role}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveMember(grp.groupNumber, mIdx)}
                                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                                    title="Remove from group"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Unresolved Members Warning & Match Dropdown */}
                        {hasUnresolved && (
                          <div className="p-3 rounded-lg bg-amber-50/70 border border-amber-200/80 space-y-2">
                            <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1">
                              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                              Unmatched Student Warning in Document
                            </span>
                            {grp.unresolvedMembers.map((unresolved, uIdx) => (
                              <div
                                key={uIdx}
                                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 bg-white rounded-md border border-amber-200 text-xs"
                              >
                                <div>
                                  <span className="font-bold text-slate-900">{unresolved.name}</span>
                                  <span className="text-[10px] text-slate-500 block">
                                    Not found in database registry. Match with an enrolled student:
                                  </span>
                                </div>
                                <select
                                  onChange={(e) => {
                                    if (e.target.value) {
                                      handleResolveStudent(grp.groupNumber, uIdx, e.target.value);
                                    }
                                  }}
                                  defaultValue=""
                                  className="text-xs bg-slate-50 border border-slate-300 rounded px-2 py-1 text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-teal-500"
                                >
                                  <option value="" disabled>
                                    Select registered student...
                                  </option>
                                  {students
                                    .filter(
                                      (s) =>
                                        !grp.matchedMembers.some((m) => m.email === s.email)
                                    )
                                    .map((s) => (
                                      <option key={s.id} value={s.id}>
                                        {s.fullName} ({s.email})
                                      </option>
                                    ))}
                                </select>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Add Registered Student Selector */}
                        <div className="pt-2 flex items-center gap-2 text-xs">
                          <select
                            value={newMemberStudentId[grp.groupNumber] || ""}
                            onChange={(e) =>
                              setNewMemberStudentId((prev) => ({
                                ...prev,
                                [grp.groupNumber]: e.target.value,
                              }))
                            }
                            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 flex-1 max-w-xs focus:outline-hidden focus:ring-1 focus:ring-teal-500"
                          >
                            <option value="">+ Add student to {grp.groupName}...</option>
                            {students
                              .filter(
                                (s) =>
                                  !grp.matchedMembers.some((m) => m.email === s.email)
                              )
                              .map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.fullName} ({s.email})
                                </option>
                              ))}
                          </select>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={!newMemberStudentId[grp.groupNumber]}
                            onClick={() => {
                              const sId = newMemberStudentId[grp.groupNumber];
                              if (sId) {
                                handleAddMemberToGroup(grp.groupNumber, sId);
                                setNewMemberStudentId((prev) => ({ ...prev, [grp.groupNumber]: "" }));
                              }
                            }}
                          >
                            Add Member
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================== */}
        {/* VIEW B: GEMINI AI GENERATION INTERFACE                     */}
        {/* ========================================================== */}
        {requirementsMethod === "ai" && (
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 animate-in fade-in-50">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-600" />
                <h4 className="font-bold text-xs text-slate-900">Gemini AI Academic Requirements Generator</h4>
              </div>
              <span className="text-[10px] text-teal-700 font-semibold bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                12-Section Rubric
              </span>
            </div>

            {aiError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{aiError}</span>
              </div>
            )}

            {/* Prompt Textarea */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                Project Idea & Requirements Brief <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={4}
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Describe the project idea, its purpose, target users, expected features, and technical requirements..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#14B8A6] leading-relaxed"
              />
            </div>

            {/* Optional AI Parameters in 4 Columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Project Topic</label>
                <input
                  type="text"
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  placeholder="e.g. IoT Smart Campus"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Difficulty Level</label>
                <select
                  value={aiDifficulty}
                  onChange={(e) => setAiDifficulty(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs"
                >
                  <option value="Beginner">Beginner (1st/2nd Year)</option>
                  <option value="Intermediate">Intermediate (3rd Year)</option>
                  <option value="Advanced">Advanced (Final Year Capstone)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Expected Technologies</label>
                <input
                  type="text"
                  value={aiTechnologies}
                  onChange={(e) => setAiTechnologies(e.target.value)}
                  placeholder="e.g. Next.js, Docker, AI"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Team Members</label>
                <select
                  value={aiTeamSize}
                  onChange={(e) => setAiTeamSize(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs"
                >
                  <option value="1 Member">Individual (1 Student)</option>
                  <option value="2-3 Members">Small Group (2-3 Students)</option>
                  <option value="3-4 Members">Standard Group (3-4 Students)</option>
                  <option value="4-5 Members">Large Team (4-5 Students)</option>
                </select>
              </div>
            </div>

            {/* Generate Button */}
            <div className="pt-1 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Server-side Google Gemini 2.5 Flash API execution
              </span>
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handleGenerateAi}
                disabled={isGeneratingAi}
                icon={isGeneratingAi ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              >
                {isGeneratingAi ? "Generating Requirements..." : "Generate Requirements with Gemini"}
              </Button>
            </div>

            {/* Generated Document Display / Editable Preview */}
            {aiGeneratedContent && (
              <div className="pt-4 border-t border-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">
                      Generated Requirements Specification
                    </span>
                    <Badge variant={isAiApproved ? "teal" : "outline"} size="sm">
                      {isAiApproved ? "Approved by Lecturer" : "Pending Review"}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Editor Tabs */}
                    <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs">
                      <button
                        type="button"
                        onClick={() => setAiEditorTab("edit")}
                        className={`px-2.5 py-1 rounded-md font-medium ${
                          aiEditorTab === "edit" ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        Markdown Editor
                      </button>
                      <button
                        type="button"
                        onClick={() => setAiEditorTab("preview")}
                        className={`px-2.5 py-1 rounded-md font-medium ${
                          aiEditorTab === "preview" ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        Formatted Preview
                      </button>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleGenerateAi}
                      disabled={isGeneratingAi}
                      icon={<RefreshCw className="w-3 h-3" />}
                    >
                      Regenerate
                    </Button>

                    <Button
                      type="button"
                      variant={isAiApproved ? "secondary" : "primary"}
                      size="sm"
                      onClick={() => setIsAiApproved(!isAiApproved)}
                      icon={<FileCheck className="w-3.5 h-3.5" />}
                    >
                      {isAiApproved ? "Requirements Approved" : "Approve Requirements"}
                    </Button>
                  </div>
                </div>

                {aiEditorTab === "edit" ? (
                  <textarea
                    rows={14}
                    value={aiGeneratedContent}
                    onChange={(e) => setAiGeneratedContent(e.target.value)}
                    className="w-full p-4 rounded-xl border border-slate-200 font-mono text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#14B8A6] leading-relaxed"
                  />
                ) : (
                  <div className="p-5 rounded-xl border border-slate-200 bg-white prose prose-slate max-w-none text-xs leading-relaxed max-h-96 overflow-y-auto whitespace-pre-line font-sans text-slate-800">
                    {aiGeneratedContent}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </section>

      {/* ============================================================== */}
      {/* SECTION 4: DATABASE DESIGN & ER DIAGRAM SPECIFICATION          */}
      {/* ============================================================== */}
      <section className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-xs border border-teal-100">
              4
            </div>
            <div>
              <h2 className="text-base font-bold text-[#0B1220] flex items-center gap-2">
                <Database className="w-4 h-4 text-teal-600" />
                Database Design and ER Diagram Specification
              </h2>
              <p className="text-xs text-slate-500">
                Configure entity-relationship modeling expectations, reference schemas, and evaluation rubrics.
              </p>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={dbDesignEnabled}
              onChange={(e) => setDbDesignEnabled(e.target.checked)}
              className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
            />
            <span>Enable ER Diagram Submission</span>
          </label>
        </div>

        {dbDesignEnabled ? (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Submission Requirement
                </label>
                <select
                  value={dbDesignRequired ? "required" : "optional"}
                  onChange={(e) => setDbDesignRequired(e.target.value === "required")}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#14B8A6]"
                >
                  <option value="required">Mandatory Core Milestone (Graded in Rubric)</option>
                  <option value="optional">Optional / Supplemental Design Submission</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  ER Diagram Submission Deadline
                </label>
                <input
                  type="date"
                  value={dbDeadline}
                  onChange={(e) => setDbDeadline(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#14B8A6]"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                Expected Database Design & Architecture Description
              </label>
              <textarea
                rows={2}
                value={dbExpectedDescription}
                onChange={(e) => setDbExpectedDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#14B8A6] resize-none"
                placeholder="Describe key domain entities, cardinality constraints, and normalization standards..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Expected Domain Entities (Comma Separated)
                </label>
                <input
                  type="text"
                  value={dbExpectedEntities}
                  onChange={(e) => setDbExpectedEntities(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#14B8A6]"
                  placeholder="e.g. attendees, events, registrations, sensor_telemetry"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Reference ER Diagram PDF / Asset (Optional)
                </label>
                <input
                  type="text"
                  value={dbRefDiagramName}
                  onChange={(e) => setDbRefDiagramName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#14B8A6]"
                  placeholder="e.g. CS492_Reference_Data_Model_v1.pdf"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                Expected Relationships & Database Business Rules
              </label>
              <textarea
                rows={2}
                value={dbExpectedRelationships}
                onChange={(e) => setDbExpectedRelationships(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#14B8A6] resize-none"
                placeholder="e.g. departments (1) to (N) attendees; attendees (M) to (N) events via event_registrations bridge table..."
              />
            </div>

            {/* Rubric Preview & Configuration */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-teal-600" />
                  ER Diagram Evaluation Rubric Criteria ({dbRubricCriteria.length})
                </span>
                <span className="font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-md border border-teal-200 text-[11px]">
                  Total: {dbRubricCriteria.reduce((sum, c) => sum + c.maxMarks, 0)} Marks
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {dbRubricCriteria.map((c, idx) => (
                  <div
                    key={c.id || idx}
                    className="p-2.5 bg-white rounded-lg border border-slate-200 flex items-center justify-between text-[11px]"
                  >
                    <div className="truncate mr-2">
                      <span className="font-bold text-slate-800">{c.name}</span>
                      <p className="text-slate-400 text-[10px] truncate">{c.description}</p>
                    </div>
                    <span className="font-mono font-bold text-teal-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 shrink-0">
                      {c.maxMarks}m
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-slate-50 rounded-xl text-xs text-slate-500 text-center">
            Database design and ER diagram submission is disabled for this project.
          </div>
        )}
      </section>

      {/* ============================================================== */}
      {/* SECTION 4: ACADEMIC GROUPS & STUDENT ASSIGNMENTS               */}
      {/* ============================================================== */}
      <section className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold text-xs border border-teal-100">
              4
            </div>
            <div>
              <h2 className="text-base font-bold text-[#0B1220] flex items-center gap-2">
                <Users className="w-4 h-4 text-teal-600" />
                Academic Groups & Student Assignments
              </h2>
              <p className="text-xs text-slate-500">
                Form student project teams, assign team leads, or auto-generate balanced groups from the enrolled course cohort.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAutoGenerateCohortGroups}
              icon={<Sparkles className="w-3.5 h-3.5 text-teal-600" />}
            >
              Auto-Generate Groups
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddNewGroup}
              icon={<Plus className="w-3.5 h-3.5" />}
            >
              Add Group
            </Button>
          </div>
        </div>

        {/* Groups List */}
        {extractedGroups.length === 0 ? (
          <div className="p-8 bg-slate-50 border border-dashed border-slate-300 rounded-2xl text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto border border-teal-100">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">No Student Groups Configured Yet</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                You can auto-generate collaborative teams from enrolled {selectedCourseCode} cohort students, or create custom groups manually.
              </p>
            </div>
            <div className="pt-1 flex items-center justify-center gap-2">
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleAutoGenerateCohortGroups}
                icon={<Sparkles className="w-3.5 h-3.5" />}
              >
                Auto-Generate Cohort Groups
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddNewGroup}
                icon={<Plus className="w-3.5 h-3.5" />}
              >
                Add Custom Group
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-800">
                  {extractedGroups.length} Active {extractedGroups.length === 1 ? "Group" : "Groups"}
                </span>
                <span>•</span>
                <span>
                  {extractedGroups.reduce((acc, g) => acc + g.matchedMembers.length, 0)} Total Assigned Students
                </span>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <Check className="w-3 h-3" /> Ready for Workspace Provisioning
              </span>
            </div>

            <div className="space-y-4">
              {extractedGroups.map((grp) => (
                <div
                  key={grp.groupNumber}
                  className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 space-y-4 shadow-2xs"
                >
                  {/* Group Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-lg bg-[#0B1220] text-teal-400 flex items-center justify-center font-bold text-xs shrink-0">
                        {String(grp.groupNumber).padStart(2, "0")}
                      </span>
                      <input
                        type="text"
                        value={grp.groupName}
                        onChange={(e) => handleUpdateGroupName(grp.groupNumber, e.target.value)}
                        className="font-bold text-sm text-slate-900 bg-transparent border-b border-dashed border-slate-300 hover:border-slate-500 focus:border-teal-500 focus:outline-hidden px-1 py-0.5"
                        placeholder="Group Name"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 font-medium">
                        {grp.matchedMembers.length} Members
                      </span>
                      {extractedGroups.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveGroup(grp.groupNumber)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors"
                          title="Remove group"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Members Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {grp.matchedMembers.map((member, mIdx) => {
                      const isLead = member.role === "Team Lead";
                      return (
                        <div
                          key={member.email || mIdx}
                          className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs transition-colors ${
                            isLead
                              ? "bg-teal-50/50 border-teal-200"
                              : "bg-slate-50 border-slate-200/80"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className={`w-8 h-8 rounded-full font-bold flex items-center justify-center text-[10px] shrink-0 ${
                                isLead
                                  ? "bg-teal-600 text-white shadow-2xs"
                                  : "bg-slate-200 text-slate-700"
                              }`}
                            >
                              {member.fullName.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900 truncate flex items-center gap-1">
                                <span className="truncate">{member.fullName}</span>
                                {isLead && (
                                  <span title="Team Lead">
                                    <Crown className="w-3 h-3 text-amber-500 shrink-0" />
                                  </span>
                                )}
                              </p>
                              <p className="text-[10px] text-slate-400 truncate font-mono">
                                {member.studentId || member.email}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleToggleTeamLead(grp.groupNumber, mIdx)}
                              className={`p-1 rounded text-[10px] font-semibold transition-colors ${
                                isLead
                                  ? "text-teal-700 bg-teal-100 hover:bg-teal-200"
                                  : "text-slate-400 hover:text-amber-600 hover:bg-slate-200"
                              }`}
                              title={isLead ? "Assigned as Team Lead" : "Make Team Lead"}
                            >
                              <Crown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveMember(grp.groupNumber, mIdx)}
                              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Remove from group"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Add Member Dropdown Toolbar */}
                  <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-slate-100">
                    <div className="flex items-center gap-2 text-xs">
                      <UserPlus className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-slate-500">Add Registered Student:</span>
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            handleAddMemberToGroup(grp.groupNumber, e.target.value);
                            e.target.value = "";
                          }
                        }}
                        defaultValue=""
                        className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-hidden focus:border-teal-500"
                      >
                        <option value="" disabled>
                          Select student to add...
                        </option>
                        {students
                          .filter((s) => !grp.matchedMembers.some((m) => m.email === s.email))
                          .map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.fullName} ({s.studentId || s.email})
                            </option>
                          ))}
                      </select>
                    </div>

                    <div className="text-[11px] text-slate-400 italic">
                      Workspaces are created automatically upon project publishing.
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ============================================================== */}
      {/* SECTION 5: PROJECT REQUIREMENTS REVIEW & SUMMARY              */}
      {/* ============================================================== */}
      <section className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs border border-emerald-100">
            5
          </div>
          <div>
            <h2 className="text-base font-bold text-[#0B1220]">
              Project Specification Review
            </h2>
            <p className="text-xs text-slate-500">
              Confirm academic assignment and deliverables before publishing for enrolled students.
            </p>
          </div>
        </div>

        {/* Summary Details Grid */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Assigned Course</span>
            <span className="font-mono font-bold text-indigo-700">{selectedCourseCode}</span>
            <span className="text-slate-600 block truncate">{getCourseName(selectedCourseCode)}</span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Target Cohort</span>
            <span className="font-semibold text-slate-900">
              Year {academicYear} • Semester {semester}
            </span>
            <span className="text-slate-500 block">{projectType}</span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Requirements Source</span>
            <span className="font-semibold text-slate-900 flex items-center gap-1 mt-0.5">
              {requirementsMethod === "ai" ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                  Gemini AI Generated
                </>
              ) : (
                <>
                  <FileText className="w-3.5 h-3.5 text-indigo-600" />
                  PDF Document Upload
                </>
              )}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Deadline</span>
            <span className="font-mono font-semibold text-slate-800">
              {deadline || "Open Submission"}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={() => setIsPreviewModalOpen(true)}
            icon={<Eye className="w-4 h-4" />}
          >
            Preview Project
          </Button>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => handleSubmitProject("Draft")}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              Save as Draft
            </Button>
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={() => handleSubmitProject("Published")}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
              icon={<Check className="w-4 h-4" />}
            >
              Publish Project
            </Button>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* PREVIEW MODAL                                                  */}
      {/* ============================================================== */}
      {isPreviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-50">
          <div className="bg-white w-full max-w-2xl rounded-2xl border border-slate-200 shadow-2xl p-6 sm:p-7 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                  Student Project Preview
                </span>
                <h3 className="text-lg font-bold text-[#0B1220] mt-1">{title || "Untitled Academic Project"}</h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  {selectedCourseCode} — {getCourseName(selectedCourseCode)}
                </p>
              </div>
              <button
                onClick={() => setIsPreviewModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-700">
              <div>
                <h4 className="font-bold text-slate-900 uppercase text-[11px] mb-1">Project Overview</h4>
                <p className="leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
                  {description || "No description provided."}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 uppercase text-[11px] mb-1">Official Requirements</h4>
                {requirementsMethod === "ai" ? (
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 font-sans text-xs whitespace-pre-line leading-relaxed max-h-72 overflow-y-auto">
                    {aiGeneratedContent || "No AI requirements generated yet."}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center gap-3">
                    <FileText className="w-6 h-6 text-indigo-600" />
                    <div>
                      <p className="font-bold text-slate-900">{pdfFileName || "No PDF attached"}</p>
                      <p className="text-slate-400 text-[11px]">{pdfFileSize}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsPreviewModalOpen(false)}
              >
                Close Preview
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SECTION 5: PROJECT CREATION SUCCESS CONFIRMATION MODAL         */}
      {/* ============================================================== */}
      {createdProjectSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-50">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-2xl p-6 sm:p-7 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="text-center space-y-2">
              <div className="w-13 h-13 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-extrabold text-[#0B1220]">
                Project Created Successfully
              </h3>
              <p className="text-xs text-slate-500">
                Your academic project has been provisioned and is now live for eligible student teams.
              </p>
            </div>

            {/* Confirmation Summary Card */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Project Title</span>
                <span className="font-bold text-slate-900 text-right max-w-[200px] truncate">
                  {createdProjectSummary.title}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Assigned Course</span>
                <span className="font-mono font-bold text-indigo-700">
                  {createdProjectSummary.courseCode}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Department</span>
                <span className="font-medium text-slate-800 text-right max-w-[200px] truncate">
                  {getDeptName(createdProjectSummary.departmentId)}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Target Cohort</span>
                <span className="font-semibold text-slate-900">
                  Year {createdProjectSummary.academicYear} • Semester {createdProjectSummary.semester}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Assigned Academic Groups</span>
                <span className="font-semibold text-slate-900">
                  {extractedGroups.length > 0 ? `${extractedGroups.length} Teams Provisioned` : "1 Team Provisioned"}
                </span>
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500 font-medium">Requirements Status</span>
                <span className="font-semibold text-emerald-700 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  {createdProjectSummary.requirementsSource === "ai" ? "Gemini AI Approved" : "PDF Attached"}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <Button
                variant="primary"
                size="md"
                href={`/dashboard/projects/${createdProjectSummary.id}/workspace`}
                className="w-full justify-center bg-teal-600 hover:bg-teal-700 text-white font-bold"
                iconRight={<ArrowRight className="w-4 h-4" />}
              >
                Open Project Workspace
              </Button>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  href="/dashboard/projects"
                  className="w-full justify-center"
                >
                  View in Directory
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCreatedProjectSummary(null);
                    setTitle("");
                    setDescription("");
                    setAiGeneratedContent("");
                    setPdfFileName("");
                    setExtractedGroups([]);
                  }}
                  className="w-full justify-center"
                >
                  Create Another
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
