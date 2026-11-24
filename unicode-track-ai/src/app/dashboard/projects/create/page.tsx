"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  FolderKanban,
  User,
  Users,
  Calendar,
  Sparkles,
  BookOpen,
  GraduationCap,
  Layers,
  CheckCircle2,
  AlertCircle,
  FileText,
  Database,
  FolderGit2,
  FileCheck,
  Check,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  Clock,
  HelpCircle,
  ExternalLink,
  Code2,
  RefreshCw,
  Sliders,
  Send,
  Save,
} from "lucide-react";
import { useAdminData } from "@/context/AdminDataContext";
import { Project } from "@/types/admin";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { DEFAULT_ER_DIAGRAM_RUBRIC } from "@/types/er-diagram";

// ==============================================================================
// 1. Zod Validation Schema
// ==============================================================================
const createProjectSchema = z
  .object({
    // Basic Information
    title: z
      .string()
      .min(3, "Project title must be at least 3 characters.")
      .max(200, "Project title cannot exceed 200 characters."),
    description: z
      .string()
      .min(10, "Please provide a comprehensive project description (min 10 characters).")
      .max(2500, "Description cannot exceed 2500 characters."),
    academicYear: z
      .number()
      .int()
      .min(1, "Academic year must be between 1 and 4.")
      .max(4, "Academic year must be between 1 and 4."),
    departmentId: z.string().min(1, "Please select an academic department."),
    courseCode: z.string().min(1, "Please select an assigned course."),
    semester: z
      .number()
      .int()
      .min(1, "Semester must be 1 or 2.")
      .max(2, "Semester must be 1 or 2."),
    projectType: z.enum(["Individual Project", "Group Project"]),
    deadline: z
      .string()
      .min(1, "Project deadline date is required.")
      .refine((val) => {
        if (!val) return false;
        const d = new Date(val);
        if (isNaN(d.getTime())) return false;
        if (typeof window === "undefined") return true;
        return d.getTime() > Date.now();
      }, "Project deadline must be in the future."),
    instructions: z.string().optional(),

    // Project Requirements
    requirements: z
      .string()
      .min(10, "Requirements description is required (min 10 characters)."),
    erDiagramRequired: z.boolean(),
    erDiagramDeadline: z.string().optional(),
    databaseRequired: z.boolean(),
    databaseRequirements: z.string().optional(),
    githubRequired: z.boolean(),
    finalReportRequired: z.boolean(),
    additionalRequirements: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    // If ER diagram is required, deadline is required and must not exceed project deadline
    if (data.erDiagramRequired) {
      if (!data.erDiagramDeadline || data.erDiagramDeadline.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "ER diagram submission deadline is required when ER diagram is enabled.",
          path: ["erDiagramDeadline"],
        });
      } else {
        const erTime = new Date(data.erDiagramDeadline).getTime();
        const projTime = new Date(data.deadline).getTime();
        if (isNaN(erTime) || (typeof window !== "undefined" && erTime <= Date.now())) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "ER diagram deadline must be in the future.",
            path: ["erDiagramDeadline"],
          });
        } else if (!isNaN(projTime) && erTime > projTime) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "ER diagram deadline cannot be after the final project deadline.",
            path: ["erDiagramDeadline"],
          });
        }
      }
    }
  });

type CreateProjectFormValues = z.infer<typeof createProjectSchema>;

function CreateProjectContent() {
  const router = useRouter();
  const {
    departments,
    courses,
    lecturers,
    activeLecturerEmail,
    activeRole,
    addProject,
  } = useAdminData();

  // Resolve current active lecturer
  const currentLecturer =
    lecturers.find((l) => l.email.toLowerCase() === activeLecturerEmail.toLowerCase()) ||
    lecturers[0];

  // Lecturer assigned courses filter
  const assignedCourseCodes = currentLecturer?.assignedCourses || ["CS492", "SE3102", "CS304", "ICT2142"];
  const authorizedCourses = courses.filter((c) =>
    activeRole === "lecturer" ? assignedCourseCodes.includes(c.code) : true
  );

  // Active step in the form (1: Basic Info, 2: Project Type, 3: Requirements, 4: Review)
  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4>(1);

  // Form submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [createdProject, setCreatedProject] = useState<Project | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Gemini AI Requirements Generator state
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiDifficulty, setAiDifficulty] = useState("Intermediate");
  const [aiTechnologies, setAiTechnologies] = useState("C, PostgreSQL, Linux, Docker");
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiError, setAiError] = useState("");
  const [generatedAiContent, setGeneratedAiContent] = useState("");

  // React Hook Form initialization with Zod resolver
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<CreateProjectFormValues>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      title: "",
      description: "",
      academicYear: 4,
      departmentId: departments[0]?.id || "dept-1",
      courseCode: authorizedCourses[0]?.code || "CS492",
      semester: 2,
      projectType: "Group Project",
      deadline: "",
      instructions:
        "Submit the project deliverables strictly before the stated deadlines. Ensure adherence to academic integrity and code ownership rules.",
      requirements:
        "The project requires students to engineer an end-to-end software system complying with clean architecture, robust error handling, database normalization, and version-controlled Git history.",
      erDiagramRequired: true,
      erDiagramDeadline: "",
      databaseRequired: true,
      databaseRequirements:
        "Relational PostgreSQL schema with 3NF normalization, foreign key constraints, index optimization, and transaction ACID compliance.",
      githubRequired: true,
      finalReportRequired: true,
      additionalRequirements:
        "All submissions must include automated unit tests, README setup documentation, and API specification.",
    },
    mode: "onBlur",
  });

  // Client-side initialization of default future deadlines safely on mount
  useEffect(() => {
    const defaultDeadline = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 16);
    const defaultErDeadline = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 16);
    setValue("deadline", defaultDeadline);
    setValue("erDiagramDeadline", defaultErDeadline);
  }, [setValue]);

  // Watch form values for dynamic UI
  const watchedProjectType = watch("projectType");
  const watchedErDiagramRequired = watch("erDiagramRequired");
  const watchedDatabaseRequired = watch("databaseRequired");
  const watchedDepartmentId = watch("departmentId");
  const watchedCourseCode = watch("courseCode");
  const watchedTitle = watch("title");
  const watchedDeadline = watch("deadline");

  // Filter courses by department if matching
  const availableCourses = authorizedCourses.length > 0 ? authorizedCourses : courses;
  const selectedCourse = courses.find((c) => c.code === watchedCourseCode);
  const selectedDept = departments.find((d) => d.id === watchedDepartmentId);

  // Gemini AI Requirements Generator Handler
  const handleGenerateAiRequirements = async () => {
    setAiError("");
    if (!aiPrompt.trim() && !aiTopic.trim()) {
      setAiError("Please provide a project topic or idea to guide Gemini AI.");
      return;
    }

    setIsGeneratingAi(true);
    try {
      const res = await fetch("/api/ai/generate-requirements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: aiPrompt || `Create structured requirements for: ${aiTopic}`,
          topic: aiTopic || watchedTitle || "Academic Software Engineering Project",
          difficulty: aiDifficulty,
          technologies: aiTechnologies,
          teamSize: watchedProjectType === "Group Project" ? "3-4 Students" : "Individual",
          courseCode: watchedCourseCode,
          department: selectedDept?.name,
          projectType: watchedProjectType,
        }),
      });

      const data = await res.json();
      if (data.success && data.requirements) {
        setGeneratedAiContent(data.requirements);
      } else {
        setAiError(data.error || "Failed to generate requirements with Gemini API.");
      }
    } catch {
      setAiError("Network failure connecting to Gemini AI generator.");
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleApplyAiRequirements = () => {
    if (!generatedAiContent) return;
    setValue("requirements", generatedAiContent, { shouldValidate: true });
    setIsAiDrawerOpen(false);
  };

  // Step Validation before advancing
  const handleNextStep = async () => {
    let isValid = false;
    if (activeStep === 1) {
      isValid = await trigger([
        "title",
        "description",
        "departmentId",
        "courseCode",
        "academicYear",
        "semester",
        "deadline",
      ]);
    } else if (activeStep === 2) {
      isValid = await trigger(["projectType"]);
    } else if (activeStep === 3) {
      isValid = await trigger([
        "requirements",
        "erDiagramRequired",
        "erDiagramDeadline",
        "databaseRequired",
        "databaseRequirements",
        "githubRequired",
        "finalReportRequired",
      ]);
    }

    if (isValid) {
      setActiveStep((prev) => Math.min(4, prev + 1) as 1 | 2 | 3 | 4);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrevStep = () => {
    setActiveStep((prev) => Math.max(1, prev - 1) as 1 | 2 | 3 | 4);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Submit Handler for Draft vs Published
  const onSaveProject = async (data: CreateProjectFormValues, status: "Draft" | "Published") => {
    setIsSubmitting(true);
    setSubmitError("");

    try {
      // 1. Prepare Project payload
      const projectPayload: Omit<Project, "id" | "createdAt"> = {
        title: data.title.trim(),
        description: data.description.trim(),
        type: data.projectType,
        projectType: data.projectType === "Individual Project" ? "individual" : "group",
        departmentId: data.departmentId,
        courseCode: data.courseCode,
        courseId: selectedCourse?.id || data.courseCode,
        academicYear: data.academicYear as 1 | 2 | 3 | 4,
        semester: data.semester as 1 | 2,
        deadline: data.deadline,
        instructions: data.instructions?.trim() || undefined,
        requirements: data.requirements.trim(),
        erDiagramRequired: data.erDiagramRequired,
        erDiagramDeadline: data.erDiagramRequired ? data.erDiagramDeadline : undefined,
        databaseRequired: data.databaseRequired,
        databaseRequirements: data.databaseRequired ? data.databaseRequirements?.trim() : undefined,
        githubRequired: data.githubRequired,
        finalReportRequired: data.finalReportRequired,
        additionalRequirements: data.additionalRequirements?.trim() || undefined,
        requirementsSource: "manual",
        requirementsContent: data.requirements.trim(),
        status,
        lecturerId: currentLecturer?.id || "lec-1",
        lecturerName: currentLecturer?.name || "Dr. Evelyn Reed",
        databaseDesignConfig: data.databaseRequired
          ? {
              enabled: true,
              isRequired: data.erDiagramRequired,
              deadline: data.erDiagramDeadline || data.deadline,
              expectedDesignDescription: data.databaseRequirements || data.description,
              expectedEntities: ["entities", "tables", "relationships"],
              expectedRelationships: ["1-to-N relationships", "foreign key constraints"],
              rubricCriteria: DEFAULT_ER_DIAGRAM_RUBRIC,
            }
          : undefined,
      };

      // 2. Call context addProject (creates project in store and background syncs to Supabase)
      // Note: As specified, we do NOT create groups or student workspaces yet.
      const result = addProject(projectPayload);

      if (!result.success || !result.project) {
        throw new Error(result.error || "Failed to create project record.");
      }

      setCreatedProject(result.project);
      setShowSuccessModal(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An error occurred while saving the project.";
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 max-w-5xl mx-auto pb-20">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500">
          <Link href="/dashboard" className="hover:text-teal-700 font-medium">
            Dashboard
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <Link href="/dashboard/projects" className="hover:text-teal-700 font-medium">
            Projects
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="text-slate-900 font-bold">Create Academic Project</span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/projects"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Projects
          </Link>
        </div>
      </div>

      {/* Hero Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#0B1220] flex items-center justify-center text-teal-400 shadow-sm shrink-0 border border-slate-800">
              <FolderKanban className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1220] tracking-tight">
                  Create Academic Project
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                  Lecturer Console
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-2xl">
                Define the academic scope, select between personal or collaborative group workspaces, configure ER diagram & database deliverables, and publish to your cohort.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start bg-slate-50 border border-slate-200 rounded-2xl p-2.5 text-xs text-slate-600 font-mono">
            <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
            <span>Supervisor: <strong className="text-slate-900">{currentLecturer?.name || "Dr. Evelyn Reed"}</strong></span>
          </div>
        </div>

        {/* Section Steps Bar */}
        <div className="pt-4 border-t border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { step: 1, label: "1. Basic Information", icon: FileText },
            { step: 2, label: "2. Project Type", icon: Users },
            { step: 3, label: "3. Requirements", icon: Sliders },
            { step: 4, label: "4. Review & Save", icon: CheckCircle2 },
          ].map((item) => {
            const Icon = item.icon;
            const isCurrent = activeStep === item.step;
            const isCompleted = activeStep > item.step;

            return (
              <button
                key={item.step}
                type="button"
                onClick={() => setActiveStep(item.step as 1 | 2 | 3 | 4)}
                className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition-all text-xs font-bold ${
                  isCurrent
                    ? "bg-[#0B1220] text-white border-slate-900 shadow-xs"
                    : isCompleted
                    ? "bg-teal-50/70 border-teal-200 text-teal-900 hover:bg-teal-100/60"
                    : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100/60"
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                    isCurrent
                      ? "bg-teal-500 text-slate-950 font-extrabold"
                      : isCompleted
                      ? "bg-teal-600 text-white"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {isCompleted ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                </div>
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Global Form Validation Error Alert */}
      {Object.keys(errors).length > 0 && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-1.5 animate-in fade-in-50">
          <div className="flex items-center gap-2 font-bold text-rose-900">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Please resolve the following validation errors before saving:</span>
          </div>
          <ul className="list-disc list-inside space-y-0.5 text-rose-700 pl-2">
            {Object.entries(errors).map(([field, err]) => (
              <li key={field}>{err?.message}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Submit Error Alert */}
      {submitError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <strong className="block font-bold">Error creating project</strong>
            <p>{submitError}</p>
          </div>
        </div>
      )}

      {/* Main Form Body */}
      <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
        {/* ============================================================== */}
        {/* STEP 1: BASIC INFORMATION                                      */}
        {/* ============================================================== */}
        {activeStep === 1 && (
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
            <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-teal-600" />
                  1. Basic Information
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure the primary academic metadata, course assignment, target cohort, and submission deadline.
                </p>
              </div>
              <span className="text-xs font-mono text-slate-400">Step 1 of 4</span>
            </div>

            <div className="space-y-5">
              {/* Project Title */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Project Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. University Event & Symposium Management System"
                  {...register("title")}
                  className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500 transition-all ${
                    errors.title ? "border-rose-400 bg-rose-50/20" : "border-slate-200"
                  }`}
                />
                {errors.title && (
                  <p className="text-xs text-rose-600 font-medium flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errors.title.message}
                  </p>
                )}
              </div>

              {/* Project Description */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Project Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  placeholder="Provide an executive summary, problem statement, core system objectives, and key deliverables expected from students..."
                  {...register("description")}
                  className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-xs sm:text-sm text-slate-800 leading-relaxed focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500 transition-all ${
                    errors.description ? "border-rose-400 bg-rose-50/20" : "border-slate-200"
                  }`}
                />
                {errors.description && (
                  <p className="text-xs text-rose-600 font-medium flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errors.description.message}
                  </p>
                )}
              </div>

              {/* Department and Course Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Department */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Program / Department <span className="text-rose-500">*</span>
                  </label>
                  <select
                    {...register("departmentId")}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500 transition-all"
                  >
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                  {errors.departmentId && (
                    <p className="text-xs text-rose-600 font-medium">{errors.departmentId.message}</p>
                  )}
                </div>

                {/* Course */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Assigned Course <span className="text-rose-500">*</span>
                  </label>
                  <select
                    {...register("courseCode")}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500 transition-all"
                  >
                    {availableCourses.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code} — {c.name}
                      </option>
                    ))}
                  </select>
                  {errors.courseCode && (
                    <p className="text-xs text-rose-600 font-medium">{errors.courseCode.message}</p>
                  )}
                  {activeRole === "lecturer" && (
                    <span className="text-[10px] text-teal-700 font-medium block">
                      Showing courses authorized under your lecturer profile.
                    </span>
                  )}
                </div>
              </div>

              {/* Academic Year, Semester, and Project Deadline Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Academic Year */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Academic Year <span className="text-rose-500">*</span>
                  </label>
                  <select
                    {...register("academicYear", { valueAsNumber: true })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500 transition-all"
                  >
                    <option value={1}>Year 1 (Freshman)</option>
                    <option value={2}>Year 2 (Sophomore)</option>
                    <option value={3}>Year 3 (Junior)</option>
                    <option value={4}>Year 4 (Senior / Final)</option>
                  </select>
                  {errors.academicYear && (
                    <p className="text-xs text-rose-600 font-medium">{errors.academicYear.message}</p>
                  )}
                </div>

                {/* Semester */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Semester <span className="text-rose-500">*</span>
                  </label>
                  <select
                    {...register("semester", { valueAsNumber: true })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500 transition-all"
                  >
                    <option value={1}>Semester 1 (Autumn / Term 1)</option>
                    <option value={2}>Semester 2 (Spring / Term 2)</option>
                  </select>
                  {errors.semester && (
                    <p className="text-xs text-rose-600 font-medium">{errors.semester.message}</p>
                  )}
                </div>

                {/* Deadline */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Project Deadline <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    {...register("deadline")}
                    className={`w-full px-3 py-2.5 bg-slate-50 border rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500 transition-all ${
                      errors.deadline ? "border-rose-400 bg-rose-50/20" : "border-slate-200"
                    }`}
                  />
                  {errors.deadline && (
                    <p className="text-xs text-rose-600 font-medium flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errors.deadline.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Project Instructions */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Project Instructions & Student Guidelines
                  </label>
                  <span className="text-[11px] text-slate-400">Optional</span>
                </div>
                <textarea
                  rows={3}
                  placeholder="Provide explicit instructions for students: repository branching rules, submission zip naming conventions, viva expectations, academic honesty..."
                  {...register("instructions")}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500 transition-all"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handleNextStep}
                icon={<ArrowRight className="w-4 h-4" />}
              >
                Continue to Project Type
              </Button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* STEP 2: PROJECT TYPE SELECTION & WORKSPACE ARCHITECTURE        */}
        {/* ============================================================== */}
        {activeStep === 2 && (
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
            <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-teal-600" />
                  2. Project Type & Workspace Architecture
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select the collaboration model. The platform will enforce access controls, repository scoping, and evaluation pipelines based on this choice.
                </p>
              </div>
              <span className="text-xs font-mono text-slate-400">Step 2 of 4</span>
            </div>

            <Controller
              name="projectType"
              control={control}
              render={({ field }) => (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Option A: Individual / Personal Project */}
                  <div
                    onClick={() => field.onChange("Individual Project")}
                    className={`p-6 rounded-3xl border-2 cursor-pointer transition-all flex flex-col justify-between space-y-4 relative ${
                      field.value === "Individual Project"
                        ? "border-teal-500 bg-teal-50/20 shadow-md ring-2 ring-teal-500/10"
                        : "border-slate-200 bg-slate-50/40 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    {field.value === "Individual Project" && (
                      <span className="absolute top-4 right-4 w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center shadow-xs">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                    )}

                    <div className="space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center shadow-2xs">
                        <User className="w-6 h-6" />
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-base text-slate-900">
                            A. Individual / Personal Project
                          </h3>
                          <span className="text-[10px] font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">
                            Solo
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                          Tailored for individual course assignments, lab projects, and thesis dissertations where each student works in strict isolation.
                        </p>
                      </div>

                      <div className="p-3.5 bg-white rounded-2xl border border-slate-200/80 space-y-2 text-xs text-slate-700">
                        <div className="font-bold text-[11px] text-slate-400 uppercase tracking-wider">
                          Architecture & Rules
                        </div>
                        <ul className="space-y-1.5">
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                            <span>Each assigned student receives a separate personal workspace.</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                            <span>Students must not share their workspace with other students.</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                            <span>The lecturer can supervise and evaluate each student separately.</span>
                          </li>
                        </ul>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-200/60 text-[11px] text-indigo-900 font-mono bg-indigo-50/50 p-2.5 rounded-xl">
                      Workflow: [Enrolled Student] &rarr; [Isolated Workspace] &rarr; [Personal Repo] &rarr; [Solo Marks]
                    </div>
                  </div>

                  {/* Option B: Group Project */}
                  <div
                    onClick={() => field.onChange("Group Project")}
                    className={`p-6 rounded-3xl border-2 cursor-pointer transition-all flex flex-col justify-between space-y-4 relative ${
                      field.value === "Group Project"
                        ? "border-teal-500 bg-teal-50/20 shadow-md ring-2 ring-teal-500/10"
                        : "border-slate-200 bg-slate-50/40 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    {field.value === "Group Project" && (
                      <span className="absolute top-4 right-4 w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center shadow-xs">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                    )}

                    <div className="space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center shadow-2xs">
                        <Users className="w-6 h-6" />
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-base text-slate-900">
                            B. Group Project
                          </h3>
                          <span className="text-[10px] font-bold bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full">
                            Team
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                          Optimized for collaborative capstone software engineering, symposiums, and hackathons with multi-member teams.
                        </p>
                      </div>

                      <div className="p-3.5 bg-white rounded-2xl border border-slate-200/80 space-y-2 text-xs text-slate-700">
                        <div className="font-bold text-[11px] text-slate-400 uppercase tracking-wider">
                          Architecture & Rules
                        </div>
                        <ul className="space-y-1.5">
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                            <span>Students are assigned to groups with Team Lead and Member roles.</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                            <span>Each group receives one shared workspace and collaborative repo.</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                            <span>Only assigned group members can access that workspace.</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                            <span>The lecturer can supervise and evaluate each group collectively.</span>
                          </li>
                        </ul>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-200/60 text-[11px] text-teal-900 font-mono bg-teal-50/50 p-2.5 rounded-xl">
                      Workflow: [Cohort Groups] &rarr; [Shared Team Workspace] &rarr; [Group Git Repo] &rarr; [Group Review]
                    </div>
                  </div>
                </div>
              )}
            />

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs text-slate-600">
              <span className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                Selected Workspace Model: <strong className="text-slate-900">{watchedProjectType}</strong>
              </span>
              <span className="text-teal-700 font-semibold font-mono">Access isolation enforced</span>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <Button type="button" variant="outline" size="md" onClick={handlePrevStep}>
                Previous Step
              </Button>
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handleNextStep}
                icon={<ArrowRight className="w-4 h-4" />}
              >
                Continue to Requirements
              </Button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* STEP 3: REQUIREMENTS & DELIVERABLES                            */}
        {/* ============================================================== */}
        {activeStep === 3 && (
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
            <div className="pb-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-teal-600" />
                  3. Project Requirements & Deliverables
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Define technical expectations, configure ER diagram deadlines, database implementation rules, and deliverables.
                </p>
              </div>

              {/* Gemini AI Assistant Button */}
              <button
                type="button"
                onClick={() => setIsAiDrawerOpen(!isAiDrawerOpen)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Gemini AI Requirements Assistant</span>
              </button>
            </div>

            {/* AI Generator Drawer */}
            {isAiDrawerOpen && (
              <div className="p-5 rounded-2xl bg-teal-50/40 border border-teal-200 space-y-4 animate-in fade-in-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-teal-600" />
                    <h3 className="font-bold text-xs uppercase tracking-wider text-teal-950">
                      Gemini 2.5 Flash Requirements Generator
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAiDrawerOpen(false)}
                    className="text-xs text-slate-400 hover:text-slate-600 font-bold"
                  >
                    Close
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="sm:col-span-1 space-y-1">
                    <label className="block font-semibold text-slate-700">Project Domain / Topic</label>
                    <input
                      type="text"
                      placeholder="e.g. Hospital ICU Monitoring Telemetry"
                      value={aiTopic}
                      onChange={(e) => setAiTopic(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900"
                    />
                  </div>

                  <div className="sm:col-span-1 space-y-1">
                    <label className="block font-semibold text-slate-700">Tech Stack</label>
                    <input
                      type="text"
                      placeholder="e.g. C, PostgreSQL, Docker, Next.js"
                      value={aiTechnologies}
                      onChange={(e) => setAiTechnologies(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900"
                    />
                  </div>

                  <div className="sm:col-span-1 space-y-1">
                    <label className="block font-semibold text-slate-700">Academic Rigor</label>
                    <select
                      value={aiDifficulty}
                      onChange={(e) => setAiDifficulty(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900"
                    >
                      <option value="Introductory">Introductory</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced Capstone">Advanced Capstone</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  <label className="block font-semibold text-slate-700">Special Instructions / Features</label>
                  <input
                    type="text"
                    placeholder="e.g. Emphasize ER diagram 3NF, circular buffer C queue, foreign key integrity..."
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900"
                  />
                </div>

                {aiError && <p className="text-xs text-rose-600 font-semibold">{aiError}</p>}

                <div className="flex items-center justify-between pt-1">
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    disabled={isGeneratingAi}
                    onClick={handleGenerateAiRequirements}
                    icon={isGeneratingAi ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  >
                    {isGeneratingAi ? "Generating Specification with Gemini..." : "Generate Specification"}
                  </Button>

                  {generatedAiContent && (
                    <button
                      type="button"
                      onClick={handleApplyAiRequirements}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors"
                    >
                      Insert into Requirements Field &darr;
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Requirements Description Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                Requirements Description <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={6}
                placeholder="Enter complete technical requirements: system components, architecture layers, algorithmic logic, data structures, and compliance rules..."
                {...register("requirements")}
                className={`w-full px-4 py-3 bg-slate-50 border rounded-2xl text-xs sm:text-sm text-slate-800 leading-relaxed font-mono focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500 transition-all ${
                  errors.requirements ? "border-rose-400 bg-rose-50/20" : "border-slate-200"
                }`}
              />
              {errors.requirements && (
                <p className="text-xs text-rose-600 font-medium flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errors.requirements.message}
                </p>
              )}
            </div>

            {/* Deliverables Toggles Matrix */}
            <div className="space-y-4 pt-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Mandatory Deliverables & Component Verification
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. ER Diagram Required */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                        <Database className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs sm:text-sm text-slate-900">
                          ER Diagram Required
                        </h4>
                        <span className="text-[11px] text-slate-500">
                          Automated Gemini AI ER diagram evaluation
                        </span>
                      </div>
                    </div>

                    <Controller
                      name="erDiagramRequired"
                      control={control}
                      render={({ field }) => (
                        <div className="flex items-center gap-1 bg-white border border-slate-200 p-1 rounded-xl">
                          <button
                            type="button"
                            onClick={() => field.onChange(true)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                              field.value ? "bg-purple-600 text-white shadow-2xs" : "text-slate-600 hover:text-slate-900"
                            }`}
                          >
                            Yes
                          </button>
                          <button
                            type="button"
                            onClick={() => field.onChange(false)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                              !field.value ? "bg-slate-800 text-white shadow-2xs" : "text-slate-600 hover:text-slate-900"
                            }`}
                          >
                            No
                          </button>
                        </div>
                      )}
                    />
                  </div>

                  {/* Conditional ER Diagram Deadline */}
                  {watchedErDiagramRequired && (
                    <div className="pt-2 border-t border-slate-200/80 space-y-1 animate-in fade-in-50">
                      <label className="block text-[11px] font-bold text-slate-700 uppercase">
                        ER Diagram Submission Deadline <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="datetime-local"
                        {...register("erDiagramDeadline")}
                        className={`w-full px-3 py-1.5 bg-white border rounded-xl text-xs font-mono text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-purple-500 ${
                          errors.erDiagramDeadline ? "border-rose-400 bg-rose-50/20" : "border-slate-200"
                        }`}
                      />
                      {errors.erDiagramDeadline && (
                        <p className="text-xs text-rose-600 font-medium">{errors.erDiagramDeadline.message}</p>
                      )}
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        Students must submit relational diagrams before or on this date.
                      </span>
                    </div>
                  )}
                </div>

                {/* 2. Database Implementation Required */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                        <Code2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs sm:text-sm text-slate-900">
                          Database Implementation Required
                        </h4>
                        <span className="text-[11px] text-slate-500">
                          SQL DDL, schema migrations, and relational integrity
                        </span>
                      </div>
                    </div>

                    <Controller
                      name="databaseRequired"
                      control={control}
                      render={({ field }) => (
                        <div className="flex items-center gap-1 bg-white border border-slate-200 p-1 rounded-xl">
                          <button
                            type="button"
                            onClick={() => field.onChange(true)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                              field.value ? "bg-teal-600 text-white shadow-2xs" : "text-slate-600 hover:text-slate-900"
                            }`}
                          >
                            Yes
                          </button>
                          <button
                            type="button"
                            onClick={() => field.onChange(false)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                              !field.value ? "bg-slate-800 text-white shadow-2xs" : "text-slate-600 hover:text-slate-900"
                            }`}
                          >
                            No
                          </button>
                        </div>
                      )}
                    />
                  </div>

                  {/* Conditional Database Requirements */}
                  {watchedDatabaseRequired && (
                    <div className="pt-2 border-t border-slate-200/80 space-y-1 animate-in fade-in-50">
                      <label className="block text-[11px] font-bold text-slate-700 uppercase">
                        Expected Database Requirements
                      </label>
                      <textarea
                        rows={2}
                        placeholder="e.g. PostgreSQL, 3NF normalization, foreign keys with ON DELETE CASCADE, indexing on student_id..."
                        {...register("databaseRequirements")}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 resize-none"
                      />
                    </div>
                  )}
                </div>

                {/* 3. GitHub Repository Required */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/40 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-slate-900 text-teal-400 flex items-center justify-center font-bold">
                      <FolderGit2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm text-slate-900">
                        GitHub Repository Required
                      </h4>
                      <span className="text-[11px] text-slate-500">
                        Git branches, commit activity, and PR code reviews
                      </span>
                    </div>
                  </div>

                  <Controller
                    name="githubRequired"
                    control={control}
                    render={({ field }) => (
                      <div className="flex items-center gap-1 bg-white border border-slate-200 p-1 rounded-xl">
                        <button
                          type="button"
                          onClick={() => field.onChange(true)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                            field.value ? "bg-slate-900 text-white shadow-2xs" : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          Yes
                        </button>
                        <button
                          type="button"
                          onClick={() => field.onChange(false)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                            !field.value ? "bg-slate-800 text-white shadow-2xs" : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          No
                        </button>
                      </div>
                    )}
                  />
                </div>

                {/* 4. Final Report Required */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/40 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                      <FileCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm text-slate-900">
                        Final Report Required
                      </h4>
                      <span className="text-[11px] text-slate-500">
                        Formal PDF document upload and defense slide deck
                      </span>
                    </div>
                  </div>

                  <Controller
                    name="finalReportRequired"
                    control={control}
                    render={({ field }) => (
                      <div className="flex items-center gap-1 bg-white border border-slate-200 p-1 rounded-xl">
                        <button
                          type="button"
                          onClick={() => field.onChange(true)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                            field.value ? "bg-amber-600 text-white shadow-2xs" : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          Yes
                        </button>
                        <button
                          type="button"
                          onClick={() => field.onChange(false)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                            !field.value ? "bg-slate-800 text-white shadow-2xs" : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          No
                        </button>
                      </div>
                    )}
                  />
                </div>
              </div>

              {/* Additional Submission Requirements */}
              <div className="space-y-1.5 pt-2">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Additional Submission Requirements
                </label>
                <textarea
                  rows={2}
                  placeholder="Specify any additional project requirements: live staging URL, test coverage minimum (e.g. 80%), Docker compose build..."
                  {...register("additionalRequirements")}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500 transition-all"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <Button type="button" variant="outline" size="md" onClick={handlePrevStep}>
                Previous Step
              </Button>
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handleNextStep}
                icon={<ArrowRight className="w-4 h-4" />}
              >
                Review & Finalize
              </Button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* STEP 4: REVIEW & SAVE / PUBLISH                                */}
        {/* ============================================================== */}
        {activeStep === 4 && (
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
            <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-teal-600" />
                  4. Review Project Parameters & Save
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Confirm all project information before creating. You can save as an unpublished Draft or Publish immediately.
                </p>
              </div>
              <span className="text-xs font-mono text-slate-400">Step 4 of 4</span>
            </div>

            {/* Comprehensive Review Card */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200 font-mono">
                    {watchedCourseCode} • Year {watch("academicYear")}, Sem {watch("semester")}
                  </span>
                  <h3 className="text-xl font-extrabold text-[#0B1220]">
                    {watchedTitle || "Untitled Project"}
                  </h3>
                  <p className="text-xs text-slate-600 line-clamp-2 max-w-2xl">
                    {watch("description") || "No description provided."}
                  </p>
                </div>

                <div className="shrink-0 text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Deadline</span>
                  <strong className="text-xs font-mono text-slate-900">
                    {watchedDeadline ? new Date(watchedDeadline).toLocaleString() : "None"}
                  </strong>
                </div>
              </div>

              {/* Grid of Key Properties */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-3 border-t border-slate-200/80">
                <div className="p-3 bg-white rounded-xl border border-slate-200/70">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Model</span>
                  <strong className="text-slate-900 font-bold">{watchedProjectType}</strong>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200/70">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Department</span>
                  <strong className="text-slate-900 font-bold truncate block">{selectedDept?.name}</strong>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200/70">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">ER Diagram</span>
                  <strong className={watchedErDiagramRequired ? "text-purple-700 font-bold" : "text-slate-500 font-bold"}>
                    {watchedErDiagramRequired ? "Required" : "Optional"}
                  </strong>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200/70">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">GitHub Repo</span>
                  <strong className={watch("githubRequired") ? "text-teal-700 font-bold" : "text-slate-500 font-bold"}>
                    {watch("githubRequired") ? "Mandatory" : "Optional"}
                  </strong>
                </div>
              </div>

              {/* Requirements Excerpt */}
              <div className="p-3.5 bg-white rounded-xl border border-slate-200/70 text-xs space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Requirements Specification Preview
                </span>
                <p className="text-slate-700 font-mono text-[11px] line-clamp-3 leading-relaxed">
                  {watch("requirements")}
                </p>
              </div>

              {/* Implementation Note */}
              <div className="p-3 bg-teal-50/50 border border-teal-200 rounded-xl text-xs text-teal-900 flex items-start gap-2">
                <HelpCircle className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <p>
                  <strong>Architecture Note:</strong> Project record will be saved to Supabase database. As requested, groups and student workspaces will not be auto-generated at this stage. You can assign student teams anytime from the project dashboard.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <Button type="button" variant="outline" size="md" onClick={handlePrevStep}>
                Previous Step
              </Button>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  disabled={isSubmitting}
                  onClick={handleSubmit((data) => onSaveProject(data, "Draft"))}
                  icon={isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 text-slate-600" />}
                >
                  Save as Draft
                </Button>

                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  disabled={isSubmitting}
                  onClick={handleSubmit((data) => onSaveProject(data, "Published"))}
                  icon={isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                >
                  {isSubmitting ? "Saving to Supabase..." : "Publish Project"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </form>

      {/* ============================================================== */}
      {/* SUCCESS MODAL                                                  */}
      {/* ============================================================== */}
      {showSuccessModal && createdProject && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-2xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="text-center space-y-1.5">
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 uppercase tracking-wider font-mono">
                Project Saved Successfully
              </span>
              <h3 className="text-xl font-extrabold text-[#0B1220] tracking-tight">
                {createdProject.title}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                Project record has been stored in Supabase with status{" "}
                <strong className={createdProject.status === "Published" ? "text-emerald-600" : "text-amber-600"}>
                  {createdProject.status}
                </strong>
                .
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Course Assignment:</span>
                <strong className="text-slate-900 font-bold">{createdProject.courseCode}</strong>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Workspace Model:</span>
                <strong className="text-slate-900 font-bold">{createdProject.type}</strong>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>ER Diagram Requirement:</span>
                <strong className="text-slate-900 font-bold">
                  {createdProject.erDiagramRequired ? "Required" : "Optional"}
                </strong>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Database Implementation:</span>
                <strong className="text-slate-900 font-bold">
                  {createdProject.databaseRequired ? "Required" : "Optional"}
                </strong>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Link
                href="/dashboard/projects"
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold text-center transition-colors"
              >
                Back to Projects
              </Link>
              <Link
                href={`/dashboard/projects/${createdProject.id}`}
                className="flex-1 py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold text-center transition-colors shadow-xs flex items-center justify-center gap-1.5"
              >
                <span>Open Project</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CreateProjectPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-xl mx-auto mt-8 shadow-sm">
          <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-medium text-slate-600">Loading project creation console...</p>
        </div>
      }
    >
      <CreateProjectContent />
    </Suspense>
  );
}
