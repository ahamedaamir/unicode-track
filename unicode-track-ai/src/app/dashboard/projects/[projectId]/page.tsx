"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  FolderKanban,
  Calendar,
  Sparkles,
  FileText,
  Users,
  User,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Download,
  Archive,
  Trash2,
  GitBranch,
  Layers,
  ChevronRight,
  ChevronLeft,
  Award,
  Sliders,
  FolderGit2,
  GitCommit,
  GitPullRequest,
  ExternalLink,
  FileCode2,
  ShieldCheck,
  ShieldAlert,
  Search,
  Filter,
  GraduationCap,
  Building2,
  Database,
  Eye,
  Clock,
  RotateCcw,
} from "lucide-react";
import { useAdminData } from "@/context/AdminDataContext";
import { LecturerGroupCard } from "@/components/groups/LecturerGroupCard";
import { LecturerRepositoryViewer } from "@/components/github/LecturerRepositoryViewer";
import { GroupAssignmentSection } from "@/components/projects/GroupAssignmentSection";
import { SupervisionGroupItem, SupervisionStudentItem } from "@/app/api/projects/[projectId]/supervision/route";

const GROUPS_PER_PAGE = 6;
const STUDENTS_PER_PAGE = 8;

function ProjectDetailContent() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.projectId as string;

  const {
    projects,
    courses,
    departments,
    lecturers,
    groups,
    studentAssignments,
    publishProject,
    archiveProject,
    deleteProject,
    activeRole,
    activeLecturerEmail,
    getEvaluationForGroup,
    getERSubmissionForGroup,
  } = useAdminData();

  // Active tab state - default to "supervision"
  const [activeTab, setActiveTab] = useState<
    "supervision" | "overview" | "requirements" | "repositories" | "assignment"
  >("supervision");

  const [copied, setCopied] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Live Supabase supervision state
  const [liveGroups, setLiveGroups] = useState<SupervisionGroupItem[] | null>(null);
  const [liveStudents, setLiveStudents] = useState<SupervisionStudentItem[] | null>(null);
  const [isLoadingSupervision, setIsLoadingSupervision] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  // Search & filter state within Supervision
  const [supervisionSearch, setSupervisionSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [evalFilter, setEvalFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Project resolution
  const project = projects.find((p) => p.id === projectId);
  const course = project ? courses.find((c) => c.code === project.courseCode) : null;
  const department = project ? departments.find((d) => d.id === project.departmentId) : null;
  const currentLecturer = lecturers.find(
    (l) => l.email.toLowerCase() === activeLecturerEmail.toLowerCase()
  );

  const isIndividualProject =
    project?.projectType === "individual" || project?.type === "Individual Project";

  // Check lecturer security permissions
  const isAuthorizedLecturer = useMemo(() => {
    if (activeRole !== "lecturer" || !currentLecturer || !project) return true;
    const matchesId = project.lecturerId === currentLecturer.id;
    const matchesName =
      project.lecturerName &&
      project.lecturerName.toLowerCase() === currentLecturer.name.toLowerCase();
    const matchesCourse =
      Array.isArray(currentLecturer.assignedCourses) &&
      currentLecturer.assignedCourses.includes(project.courseCode);
    return matchesId || matchesName || matchesCourse;
  }, [activeRole, currentLecturer, project]);

  // Fetch live Supabase supervision data
  useEffect(() => {
    if (!projectId) return;

    let isMounted = true;
    async function fetchSupervisionData() {
      setIsLoadingSupervision(true);
      setPermissionError(null);

      try {
        const queryParams = new URLSearchParams();
        if (activeLecturerEmail) {
          queryParams.set("lecturerEmail", activeLecturerEmail);
        }

        const res = await fetch(`/api/projects/${projectId}/supervision?${queryParams.toString()}`);
        const data = await res.json();

        if (!isMounted) return;

        if (res.status === 403 || data.isPermissionError) {
          setPermissionError(
            data.error ||
              "Access Denied: You are not authorized to supervise this project. Only assigned faculty supervisors can view deliverables."
          );
          setIsLoadingSupervision(false);
          return;
        }

        if (data.success && data.source === "supabase") {
          if (data.isGroupProject) {
            setLiveGroups(data.groups || []);
            setLiveStudents(null);
          } else {
            setLiveStudents(data.students || []);
            setLiveGroups(null);
          }
        } else {
          // Local fallback mode: use context groups or assignments
          setLiveGroups(null);
          setLiveStudents(null);
        }
      } catch (err: unknown) {
        console.warn("Supervision live fetch failed, using local fallback:", err);
        if (isMounted) {
          setLiveGroups(null);
          setLiveStudents(null);
        }
      } finally {
        if (isMounted) {
          setIsLoadingSupervision(false);
        }
      }
    }

    fetchSupervisionData();
    return () => {
      isMounted = false;
    };
  }, [projectId, activeLecturerEmail]);

  // Fallback group items from context
  const fallbackGroups = useMemo<SupervisionGroupItem[]>(() => {
    const rawGroups = groups.filter((g) => g.projectId === projectId);
    return rawGroups.map((g) => {
      const erSub = getERSubmissionForGroup(g.id);
      const evalSub = getEvaluationForGroup(g.id);

      return {
        id: g.id,
        groupNumber: g.groupNumber,
        groupName: g.groupName || `Group ${g.groupNumber}`,
        workspaceId: g.workspaceId || `ws-${projectId}-${g.groupNumber}`,
        members: g.members.map((m) => ({
          studentId: m.studentId,
          fullName: m.fullName,
          email: m.email,
          role: m.role || "Member",
          commitsCount: m.commitsCount || 0,
        })),
        submissionProgress:
          g.progress || (g.proposalStatus === "approved" ? 100 : g.proposalStatus === "submitted" ? 50 : 0),
        submissionStatus: g.proposalStatus || "not_submitted",
        proposalTitle: g.proposal?.title,
        erDiagramStatus: erSub?.status || "not_submitted",
        erDiagramVersion: erSub?.version,
        githubStatus: g.repoStatus || "disconnected",
        repoName: g.repoName,
        repoUrl: g.repoUrl,
        totalCommits: g.totalCommits || 0,
        aiReviewStatus:
          erSub?.aiAnalysis || evalSub ? "completed" : "not_analyzed",
        aiReviewScore: erSub?.aiAnalysis?.overallCorrectnessScore || evalSub?.totalScore,
        lecturerEvaluationStatus:
          evalSub?.status || (g.evaluationScore ? "published" : "not_evaluated"),
        evaluationScore: evalSub?.totalScore || g.evaluationScore,
      };
    });
  }, [groups, projectId, getERSubmissionForGroup, getEvaluationForGroup]);

  // Fallback student items from context
  const fallbackStudents = useMemo<SupervisionStudentItem[]>(() => {
    const rawAssignments = studentAssignments.filter((a) => a.projectId === projectId);
    return rawAssignments.map((a) => ({
      id: a.id,
      studentId: a.studentId,
      fullName: a.studentName,
      email: a.studentEmail,
      department: a.departmentId,
      academicYear: a.academicYear,
      semester: a.semester,
      workspaceId: a.workspaceId,
      submissionProgress:
        a.progress || (a.proposalStatus === "approved" ? 100 : a.proposalStatus === "submitted" ? 50 : 0),
      submissionStatus: a.proposalStatus || "not_submitted",
      erDiagramStatus: "not_submitted",
      githubStatus: a.repoStatus || "disconnected",
      repoName: a.repoName,
      repoUrl: a.repoUrl,
      totalCommits: a.totalCommits || 0,
      aiReviewStatus: a.evaluationScore ? "completed" : "not_analyzed",
      aiReviewScore: a.evaluationScore,
      lecturerEvaluationStatus: a.status === "completed" ? "published" : "not_evaluated",
      evaluationScore: a.evaluationScore,
    }));
  }, [studentAssignments, projectId]);

  // Unified items (live Supabase or fallback)
  const effectiveGroups: SupervisionGroupItem[] = useMemo(() => {
    if (liveGroups !== null) return liveGroups;
    return fallbackGroups;
  }, [liveGroups, fallbackGroups]);

  const effectiveStudents: SupervisionStudentItem[] = useMemo(() => {
    if (liveStudents !== null) return liveStudents;
    return fallbackStudents;
  }, [liveStudents, fallbackStudents]);

  // Filtered groups
  const filteredGroups = useMemo(() => {
    return effectiveGroups.filter((g) => {
      if (supervisionSearch.trim()) {
        const q = supervisionSearch.toLowerCase();
        const matchesNum = `group ${g.groupNumber}`.includes(q);
        const matchesName = g.groupName.toLowerCase().includes(q);
        const matchesMembers = g.members.some(
          (m) => m.fullName.toLowerCase().includes(q) || m.studentId.toLowerCase().includes(q)
        );
        if (!matchesNum && !matchesName && !matchesMembers) return false;
      }

      if (statusFilter !== "all" && g.submissionStatus !== statusFilter) {
        return false;
      }

      if (evalFilter !== "all" && g.lecturerEvaluationStatus !== evalFilter) {
        return false;
      }

      return true;
    });
  }, [effectiveGroups, supervisionSearch, statusFilter, evalFilter]);

  // Filtered students
  const filteredStudents = useMemo(() => {
    return effectiveStudents.filter((s) => {
      if (supervisionSearch.trim()) {
        const q = supervisionSearch.toLowerCase();
        const matchesId = s.studentId.toLowerCase().includes(q);
        const matchesName = s.fullName.toLowerCase().includes(q);
        const matchesEmail = s.email.toLowerCase().includes(q);
        if (!matchesId && !matchesName && !matchesEmail) return false;
      }

      if (statusFilter !== "all" && s.submissionStatus !== statusFilter) {
        return false;
      }

      if (evalFilter !== "all" && s.lecturerEvaluationStatus !== evalFilter) {
        return false;
      }

      return true;
    });
  }, [effectiveStudents, supervisionSearch, statusFilter, evalFilter]);

  // Pagination
  const totalGroupPages = Math.ceil(filteredGroups.length / GROUPS_PER_PAGE) || 1;
  const paginatedGroups = useMemo(() => {
    const start = (currentPage - 1) * GROUPS_PER_PAGE;
    return filteredGroups.slice(start, start + GROUPS_PER_PAGE);
  }, [filteredGroups, currentPage]);

  const totalStudentPages = Math.ceil(filteredStudents.length / STUDENTS_PER_PAGE) || 1;
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * STUDENTS_PER_PAGE;
    return filteredStudents.slice(start, start + STUDENTS_PER_PAGE);
  }, [filteredStudents, currentPage]);

  // Reset pagination on search/filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [supervisionSearch, statusFilter, evalFilter]);

  if (!project) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-xl mx-auto mt-8 shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-500/20">
          <FolderKanban className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Project Not Found</h2>
        <p className="text-sm text-slate-500 mt-2 mb-6">
          The requested project ID <span className="font-mono text-slate-700 font-semibold">{projectId}</span> could not be found or may have been removed.
        </p>
        <Link
          href="/dashboard/projects"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-medium transition-all shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Academic Projects
        </Link>
      </div>
    );
  }

  // Security Gate: Permission Denied Card
  if (!isAuthorizedLecturer || permissionError) {
    return (
      <div className="bg-white rounded-2xl border border-rose-200 p-12 text-center max-w-xl mx-auto mt-10 shadow-md space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200 shadow-xs">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Access Denied: Faculty Supervision Restricted</h2>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            {permissionError ||
              `You are logged in as ${currentLecturer?.name || activeLecturerEmail}, but this project is assigned to ${project.lecturerName || "another faculty coordinator"} for course ${project.courseCode}.`}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Student deliverables and workspace evaluation are only accessible to assigned faculty members.
          </p>
        </div>
        <div className="pt-4 flex items-center justify-center gap-3">
          <Link
            href="/dashboard/projects"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-all shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to My Assigned Projects
          </Link>
        </div>
      </div>
    );
  }

  const handleCopyRequirements = () => {
    if (!project.requirementsContent) return;
    navigator.clipboard.writeText(project.requirementsContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = () => {
    deleteProject(project.id);
    router.push("/dashboard/projects");
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* ============================================================== */}
      {/* HIERARCHICAL NAVIGATION BREADCRUMBS                            */}
      {/* Hierarchy: Year -> Department -> Course -> Project -> Scope   */}
      {/* ============================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-slate-500 font-medium">
          <Link
            href="/dashboard/projects"
            className="inline-flex items-center gap-1.5 hover:text-teal-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Projects Directory
          </Link>

          <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />

          <Link
            href={`/dashboard/projects?academicYear=${project.academicYear}`}
            className="hover:text-teal-600 transition-colors"
          >
            Year {project.academicYear}
          </Link>

          <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />

          <span className="text-slate-600 truncate max-w-[140px]" title={department?.name}>
            {department?.name || "Computing"}
          </span>

          <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />

          <span className="font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
            {project.courseCode}
          </span>

          <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />

          <span className="text-slate-900 font-bold truncate max-w-[200px]">
            {project.title}
          </span>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/projects/${project.id}/evaluation/criteria`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-semibold shadow-2xs transition-all"
          >
            <Sliders className="w-3.5 h-3.5 text-purple-600" />
            <span>Rubric</span>
          </Link>

          {project.status === "Draft" ? (
            <button
              onClick={() => publishProject(project.id)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Publish
            </button>
          ) : (
            <button
              onClick={() => archiveProject(project.id)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-medium transition-all"
            >
              <Archive className="w-3.5 h-3.5 text-slate-500" />
              {project.status === "Archived" ? "Restore" : "Archive"}
            </button>
          )}

          <button
            onClick={() => setShowDeleteModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 rounded-xl text-xs font-medium transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* HERO PROJECT HEADER CARD                                       */}
      {/* ============================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="space-y-3 flex-1">
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                  project.status === "Published"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80"
                    : project.status === "Draft"
                    ? "bg-amber-50 text-amber-700 border border-amber-200/80"
                    : "bg-slate-100 text-slate-600 border border-slate-200"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    project.status === "Published"
                      ? "bg-emerald-500 animate-pulse"
                      : project.status === "Draft"
                      ? "bg-amber-500"
                      : "bg-slate-400"
                  }`}
                />
                {project.status}
              </span>

              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                  isIndividualProject
                    ? "bg-purple-50 text-purple-700 border border-purple-200"
                    : "bg-indigo-50 text-indigo-700 border border-indigo-200"
                }`}
              >
                {isIndividualProject ? (
                  <User className="w-3.5 h-3.5 text-purple-600" />
                ) : (
                  <Users className="w-3.5 h-3.5 text-indigo-600" />
                )}
                {isIndividualProject ? "Individual Project" : "Group Project"}
              </span>

              {project.requirementsSource === "ai" ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                  <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                  Gemini 2.5 Flash Generated
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  <FileText className="w-3.5 h-3.5 text-indigo-600" />
                  Faculty PDF Specification
                </span>
              )}
            </div>

            {/* Title & Description */}
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
              {project.title}
            </h1>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-4xl">
              {project.description}
            </p>
          </div>

          {/* Quick Academic Meta Pill Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 lg:w-72 shrink-0 space-y-3">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Course Information
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Course Code:</span>
                <span className="font-bold text-teal-600 font-mono">{project.courseCode}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Target Cohort:</span>
                <span className="font-medium text-slate-800">
                  Year {project.academicYear}, Sem {project.semester}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Deadline:</span>
                <span className="font-medium text-slate-800 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  {project.deadline
                    ? new Date(project.deadline).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "No deadline"}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                <span className="text-slate-500">Supervisor:</span>
                <span className="font-medium text-slate-800 truncate max-w-[130px]" title={project.lecturerName}>
                  {project.lecturerName || "Dr. Evelyn Reed"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation - Supervision is Primary */}
        <div className="flex items-center gap-2 mt-8 pt-4 border-t border-slate-200/80 overflow-x-auto">
          <button
            onClick={() => setActiveTab("supervision")}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 ${
              activeTab === "supervision"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            {isIndividualProject ? (
              <User className="w-4 h-4 text-purple-400" />
            ) : (
              <Users className="w-4 h-4 text-teal-400" />
            )}
            <span>
              {isIndividualProject
                ? `Assigned Students (${effectiveStudents.length})`
                : `Supervision Console (${effectiveGroups.length} Groups)`}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 ${
              activeTab === "overview"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            Overview & Milestones
          </button>

          <button
            onClick={() => setActiveTab("requirements")}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 ${
              activeTab === "requirements"
                ? "bg-teal-600 text-white shadow-xs shadow-teal-600/20"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            {project.requirementsSource === "ai" ? (
              <Sparkles className="w-3.5 h-3.5" />
            ) : (
              <FileText className="w-3.5 h-3.5" />
            )}
            Requirements Specification
          </button>

          {!isIndividualProject && (
            <button
              onClick={() => setActiveTab("repositories")}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 ${
                activeTab === "repositories"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <FolderGit2 className="w-3.5 h-3.5 text-teal-500" />
              <span>GitHub Repositories</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab("assignment")}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 ${
              activeTab === "assignment"
                ? "bg-teal-600 text-white shadow-xs shadow-teal-600/20"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Assignment Workflow</span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* TAB: SUPERVISION CONSOLE (PRIMARY)                              */}
      {/* ============================================================== */}
      {activeTab === "supervision" && (
        <div className="space-y-6">
          {/* Supervision Toolbar: Search & Filters */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  {isIndividualProject ? (
                    <User className="w-4 h-4 text-purple-600" />
                  ) : (
                    <Users className="w-4 h-4 text-teal-600" />
                  )}
                  {isIndividualProject
                    ? "Assigned Student Workspaces & Deliverables"
                    : "Academic Group Workspaces & Deliverables"}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isIndividualProject
                    ? "Inspect individual personal workspaces, ER diagrams, GitHub telemetry, and assign evaluation marks."
                    : "Monitor student groups sequentially (Group 1, Group 2, ...), track submission progress, ER models, and AI reviews."}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                  {isIndividualProject
                    ? `${filteredStudents.length} Students`
                    : `${filteredGroups.length} Groups`}
                </span>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={
                    isIndividualProject
                      ? "Search by student ID, name, or email..."
                      : "Search by group number, name, or student..."
                  }
                  value={supervisionSearch}
                  onChange={(e) => setSupervisionSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                >
                  <option value="all">All Deliverables Progress</option>
                  <option value="approved">Approved</option>
                  <option value="under_review">Under Review</option>
                  <option value="submitted">Submitted</option>
                  <option value="not_submitted">Not Submitted</option>
                </select>
              </div>

              <div>
                <select
                  value={evalFilter}
                  onChange={(e) => setEvalFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                >
                  <option value="all">All Evaluation Statuses</option>
                  <option value="published">Graded & Published</option>
                  <option value="in_review">In Review</option>
                  <option value="not_evaluated">Not Evaluated</option>
                </select>
              </div>
            </div>
          </div>

          {/* Loading Skeletons */}
          {isLoadingSupervision ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 animate-pulse"
                >
                  <div className="flex justify-between items-center">
                    <div className="h-6 w-24 bg-slate-200 rounded-lg" />
                    <div className="h-5 w-20 bg-slate-200 rounded-full" />
                  </div>
                  <div className="h-4 w-3/4 bg-slate-200 rounded-md" />
                  <div className="h-2 w-full bg-slate-100 rounded-full" />
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="h-8 bg-slate-100 rounded-lg" />
                    <div className="h-8 bg-slate-100 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          ) : !isIndividualProject ? (
            /* ============================================================== */
            /* GROUP PROJECT SUPERVISION VIEW: GROUP 1, GROUP 2, GROUP 3...   */
            /* ============================================================== */
            filteredGroups.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center space-y-3">
                <Users className="w-12 h-12 text-slate-300 mx-auto" />
                <h4 className="text-base font-bold text-slate-800">No Student Groups Found</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  No groups matched your active search query or filter. If no groups have been created, use the AI Assignment Workflow to extract groups.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => setActiveTab("assignment")}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-2xs transition-colors"
                  >
                    <span>Create & Assign Groups</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {paginatedGroups.map((group) => {
                    return (
                      <div
                        key={group.id}
                        className="bg-white rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition-all p-6 flex flex-col justify-between space-y-5"
                      >
                        {/* Group Header */}
                        <div>
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="flex items-center gap-2.5">
                              {/* Group Number Badge */}
                              <span className="w-8 h-8 rounded-xl bg-slate-900 text-teal-400 font-mono font-bold text-xs flex items-center justify-center border border-slate-800 shadow-2xs">
                                #{group.groupNumber}
                              </span>
                              <div>
                                <h4 className="font-extrabold text-base text-slate-900">
                                  {group.groupName}
                                </h4>
                                <span className="text-[11px] font-mono text-slate-400">
                                  Workspace: {group.workspaceId}
                                </span>
                              </div>
                            </div>

                            {/* Evaluation Status Badge */}
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                                group.lecturerEvaluationStatus === "published"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : group.lecturerEvaluationStatus === "in_review"
                                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                                  : "bg-slate-100 text-slate-600 border border-slate-200"
                              }`}
                            >
                              {group.lecturerEvaluationStatus === "published"
                                ? `Graded: ${group.evaluationScore || 85}/100`
                                : group.lecturerEvaluationStatus === "in_review"
                                ? "Evaluation in Review"
                                : "Not Evaluated"}
                            </span>
                          </div>

                          {/* Group Members List */}
                          <div className="mt-3 pt-3 border-t border-slate-100">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                              Team Members ({group.members.length})
                            </span>
                            <div className="space-y-1.5">
                              {group.members.map((m) => (
                                <div
                                  key={m.studentId || m.email}
                                  className="flex items-center justify-between text-xs bg-slate-50/80 px-2.5 py-1.5 rounded-lg border border-slate-200/50"
                                >
                                  <div className="flex items-center gap-2 truncate">
                                    <div className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 font-bold text-[10px] flex items-center justify-center shrink-0">
                                      {m.fullName.charAt(0)}
                                    </div>
                                    <span className="font-semibold text-slate-900 truncate">
                                      {m.fullName}
                                    </span>
                                    <span className="text-[10px] font-mono text-slate-400">
                                      ({m.studentId})
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-slate-200 text-slate-700">
                                      {m.role}
                                    </span>
                                    <span className="text-[10px] font-mono text-slate-500">
                                      {m.commitsCount} commits
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Deliverables Status Grid (7 Required Statuses) */}
                        <div className="space-y-3 pt-3 border-t border-slate-100">
                          {/* Submission Progress Bar */}
                          <div>
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-slate-500 font-medium">
                                Submission Progress
                              </span>
                              <span className="font-bold text-slate-900">
                                {group.submissionProgress}% (
                                <span className="capitalize text-teal-700">
                                  {group.submissionStatus.replace("_", " ")}
                                </span>
                                )
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div
                                className="bg-teal-500 h-full rounded-full transition-all"
                                style={{ width: `${Math.max(group.submissionProgress, 5)}%` }}
                              />
                            </div>
                          </div>

                          {/* 4 Status Strip Badges */}
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            {/* ER Diagram Status */}
                            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                ER Diagram
                              </span>
                              <span
                                className={`inline-flex items-center gap-1 font-semibold text-[11px] ${
                                  group.erDiagramStatus === "approved" ||
                                  group.erDiagramStatus === "published"
                                    ? "text-emerald-700"
                                    : group.erDiagramStatus === "submitted" ||
                                      group.erDiagramStatus === "under_review"
                                    ? "text-blue-700"
                                    : "text-slate-500"
                                }`}
                              >
                                <Database className="w-3 h-3" />
                                <span className="capitalize">
                                  {group.erDiagramStatus.replace("_", " ")}
                                </span>
                                {group.erDiagramVersion && ` (v${group.erDiagramVersion})`}
                              </span>
                            </div>

                            {/* GitHub Status */}
                            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                GitHub Repository
                              </span>
                              <span
                                className={`inline-flex items-center gap-1 font-semibold text-[11px] ${
                                  group.githubStatus === "connected"
                                    ? "text-emerald-700"
                                    : "text-slate-500"
                                }`}
                              >
                                <FolderGit2 className="w-3 h-3" />
                                {group.githubStatus === "connected"
                                  ? `${group.totalCommits || 0} Commits`
                                  : "Disconnected"}
                              </span>
                            </div>

                            {/* AI Review Status */}
                            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                AI Review
                              </span>
                              <span
                                className={`inline-flex items-center gap-1 font-semibold text-[11px] ${
                                  group.aiReviewStatus === "completed"
                                    ? "text-teal-700"
                                    : "text-slate-500"
                                }`}
                              >
                                <Sparkles className="w-3 h-3" />
                                {group.aiReviewStatus === "completed"
                                  ? `Score: ${group.aiReviewScore || 88}/100`
                                  : "Pending Analysis"}
                              </span>
                            </div>

                            {/* Lecturer Evaluation */}
                            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                Lecturer Evaluation
                              </span>
                              <span
                                className={`inline-flex items-center gap-1 font-semibold text-[11px] ${
                                  group.lecturerEvaluationStatus === "published"
                                    ? "text-emerald-700"
                                    : "text-slate-500"
                                }`}
                              >
                                <Award className="w-3 h-3" />
                                {group.lecturerEvaluationStatus === "published"
                                  ? `Score: ${group.evaluationScore || 85}/100`
                                  : "Not Evaluated"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Open Group Workspace Button */}
                        <div className="pt-2">
                          <Link
                            href={`/dashboard/projects/${projectId}/workspace?groupId=${group.id}`}
                            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-2xs transition-all hover:scale-[1.01]"
                          >
                            <span>Open Group Workspace</span>
                            <ChevronRight className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Groups Pagination */}
                {filteredGroups.length > GROUPS_PER_PAGE && (
                  <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                    <span className="text-xs text-slate-500">
                      Showing {(currentPage - 1) * GROUPS_PER_PAGE + 1} to{" "}
                      {Math.min(currentPage * GROUPS_PER_PAGE, filteredGroups.length)} of{" "}
                      {filteredGroups.length} groups
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold disabled:opacity-40"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setCurrentPage((p) => Math.min(p + 1, totalGroupPages))}
                        disabled={currentPage === totalGroupPages}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold disabled:opacity-40"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          ) : (
            /* ============================================================== */
            /* INDIVIDUAL PROJECT SUPERVISION: ASSIGNED STUDENT LIST          */
            /* ============================================================== */
            filteredStudents.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center space-y-3">
                <User className="w-12 h-12 text-slate-300 mx-auto" />
                <h4 className="text-base font-bold text-slate-800">No Assigned Students Found</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  No individual students matched your active filter. Use the Assignment Workflow to allocate students to this personal project.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => setActiveTab("assignment")}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow-2xs transition-colors"
                  >
                    <span>Assign Eligible Students</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                        <tr>
                          <th className="px-5 py-3.5">Student ID</th>
                          <th className="px-4 py-3.5">Full Name</th>
                          <th className="px-4 py-3.5">Submission Progress</th>
                          <th className="px-4 py-3.5">ER Diagram</th>
                          <th className="px-4 py-3.5">GitHub Repos</th>
                          <th className="px-4 py-3.5">AI Review</th>
                          <th className="px-4 py-3.5">Evaluation</th>
                          <th className="px-5 py-3.5 text-right">Personal Workspace</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {paginatedStudents.map((student) => (
                          <tr
                            key={student.id}
                            className="hover:bg-slate-50/80 transition-colors group"
                          >
                            {/* Student ID */}
                            <td className="px-5 py-4 whitespace-nowrap font-mono font-bold text-teal-700">
                              <span className="bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                                {student.studentId}
                              </span>
                            </td>

                            {/* Full Name & Email */}
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-800 font-bold text-xs flex items-center justify-center shrink-0">
                                  {student.fullName.charAt(0)}
                                </div>
                                <div>
                                  <span className="font-bold text-slate-900 block">
                                    {student.fullName}
                                  </span>
                                  <span className="text-[11px] text-slate-400">
                                    {student.email}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Submission Progress */}
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="space-y-1 w-32">
                                <div className="flex justify-between text-[11px]">
                                  <span className="capitalize font-semibold text-slate-700">
                                    {student.submissionStatus.replace("_", " ")}
                                  </span>
                                  <span className="font-mono text-slate-500">
                                    {student.submissionProgress}%
                                  </span>
                                </div>
                                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                  <div
                                    className="bg-purple-600 h-full rounded-full"
                                    style={{ width: `${Math.max(student.submissionProgress, 5)}%` }}
                                  />
                                </div>
                              </div>
                            </td>

                            {/* ER Diagram Status */}
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center gap-1 font-semibold text-[11px] px-2 py-0.5 rounded-full ${
                                  student.erDiagramStatus === "approved"
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : student.erDiagramStatus === "submitted"
                                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                                    : "bg-slate-100 text-slate-500 border border-slate-200"
                                }`}
                              >
                                <Database className="w-3 h-3" />
                                <span className="capitalize">
                                  {student.erDiagramStatus.replace("_", " ")}
                                </span>
                              </span>
                            </td>

                            {/* GitHub Status */}
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center gap-1 font-semibold text-[11px] ${
                                  student.githubStatus === "connected"
                                    ? "text-emerald-700"
                                    : "text-slate-400"
                                }`}
                              >
                                <FolderGit2 className="w-3.5 h-3.5" />
                                {student.githubStatus === "connected"
                                  ? `${student.totalCommits || 0} Commits`
                                  : "Disconnected"}
                              </span>
                            </td>

                            {/* AI Review Status */}
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center gap-1 font-semibold text-[11px] ${
                                  student.aiReviewStatus === "completed"
                                    ? "text-teal-700"
                                    : "text-slate-400"
                                }`}
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                                {student.aiReviewStatus === "completed"
                                  ? `${student.aiReviewScore || 88}/100`
                                  : "Pending"}
                              </span>
                            </td>

                            {/* Lecturer Evaluation */}
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center gap-1 font-semibold text-[11px] px-2 py-0.5 rounded-full ${
                                  student.lecturerEvaluationStatus === "published"
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : "bg-slate-100 text-slate-500 border border-slate-200"
                                }`}
                              >
                                <Award className="w-3 h-3" />
                                {student.lecturerEvaluationStatus === "published"
                                  ? `${student.evaluationScore || 88}/100`
                                  : "Not Evaluated"}
                              </span>
                            </td>

                            {/* Workspace Action */}
                            <td className="px-5 py-4 whitespace-nowrap text-right">
                              <Link
                                href={`/dashboard/projects/${projectId}/workspace?groupId=${student.workspaceId}`}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold border border-purple-200 transition-colors shadow-2xs"
                              >
                                <span>Open Personal Workspace</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Students Pagination */}
                {filteredStudents.length > STUDENTS_PER_PAGE && (
                  <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                    <span className="text-xs text-slate-500">
                      Showing {(currentPage - 1) * STUDENTS_PER_PAGE + 1} to{" "}
                      {Math.min(currentPage * STUDENTS_PER_PAGE, filteredStudents.length)} of{" "}
                      {filteredStudents.length} students
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold disabled:opacity-40"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setCurrentPage((p) => Math.min(p + 1, totalStudentPages))}
                        disabled={currentPage === totalStudentPages}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold disabled:opacity-40"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB: OVERVIEW & MILESTONES                                     */}
      {/* ============================================================== */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-teal-600" />
                Academic Scope & Assignment
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60">
                  <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                    Department
                  </div>
                  <div className="text-slate-900 font-semibold mt-1">
                    {department?.name || "Faculty of Computing & Information"}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60">
                  <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                    Assigned Course
                  </div>
                  <div className="text-slate-900 font-semibold mt-1">
                    {project.courseCode} {course ? `— ${course.name}` : ""}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60">
                  <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                    Target Cohort
                  </div>
                  <div className="text-slate-900 font-semibold mt-1">
                    Year {project.academicYear}, Semester {project.semester}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60">
                  <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                    Format
                  </div>
                  <div className="text-slate-900 font-semibold mt-1">{project.type}</div>
                </div>
              </div>
            </div>

            {/* Milestones */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-teal-600" />
                Submission Milestones & Deadlines
              </h3>
              <div className="space-y-3">
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-start gap-4">
                  <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-700 font-bold flex items-center justify-center text-xs shrink-0">
                    M1
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-slate-900">
                        Architecture Proposal & Schema
                      </h4>
                      <span className="text-xs font-semibold text-teal-600">Week 4</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Entity Relationship Diagrams, API specification, and GitHub repo initialization.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-start gap-4">
                  <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-700 font-bold flex items-center justify-center text-xs shrink-0">
                    M2
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-slate-900">
                        Functional MVP & Implementation
                      </h4>
                      <span className="text-xs font-semibold text-teal-600">Week 8</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Working user flows, database integration, automated tests, and core features.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-teal-200 bg-teal-50/20 flex items-start gap-4">
                  <div className="w-8 h-8 rounded-lg bg-teal-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-xs">
                    M3
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-slate-900">
                        Production Release & Viva Defense
                      </h4>
                      <span className="text-xs font-semibold text-emerald-600 font-bold">
                        {project.deadline
                          ? new Date(project.deadline).toLocaleDateString()
                          : "Final Week"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Live deployment, defense presentation, automated Git AI contribution report.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Award className="w-4 h-4 text-teal-600" />
                Evaluation Rubric Breakdown
              </h3>
              <div className="space-y-3 pt-2 text-xs">
                <div>
                  <div className="flex justify-between text-slate-700 mb-1">
                    <span>Feature Completeness</span>
                    <span className="font-bold text-slate-900">30%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-teal-500 h-full rounded-full" style={{ width: "30%" }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-700 mb-1">
                    <span>Software Architecture & DB</span>
                    <span className="font-bold text-slate-900">25%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-teal-600 h-full rounded-full" style={{ width: "25%" }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-700 mb-1">
                    <span>Git Velocity & Commits</span>
                    <span className="font-bold text-slate-900">20%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-indigo-500 h-full rounded-full" style={{ width: "20%" }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-700 mb-1">
                    <span>Automated Tests & Quality</span>
                    <span className="font-bold text-slate-900">15%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full" style={{ width: "15%" }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-700 mb-1">
                    <span>Oral Defense & Demo</span>
                    <span className="font-bold text-slate-900">10%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: "10%" }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB: REQUIREMENTS SPECIFICATION                                */}
      {/* ============================================================== */}
      {activeTab === "requirements" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                {project.requirementsSource === "ai" ? (
                  <Sparkles className="w-5 h-5 text-teal-600" />
                ) : (
                  <FileText className="w-5 h-5 text-indigo-600" />
                )}
                <h3 className="text-lg font-bold text-slate-900">
                  {project.requirementsSource === "ai"
                    ? "Standard Academic Specification"
                    : "Uploaded Faculty PDF Rubric"}
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Official requirements document configured for this academic course module.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {project.requirementsSource === "ai" && project.requirementsContent && (
                <button
                  onClick={handleCopyRequirements}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Copy Markdown</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {project.requirementsSource === "ai" ? (
            project.requirementsContent ? (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 sm:p-8 font-mono text-xs sm:text-sm text-slate-800 whitespace-pre-wrap leading-relaxed overflow-x-auto shadow-inner">
                {project.requirementsContent}
              </div>
            ) : (
              <div className="p-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                <AlertCircle className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <h4 className="font-semibold text-slate-800">No Specification Text</h4>
              </div>
            )
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center space-y-4 max-w-lg mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center mx-auto border border-indigo-500/20">
                <FileText className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">
                  {project.requirementsPdfName || "Course_Project_Specification.pdf"}
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  File Size: {project.requirementsPdfSize || "1.2 MB"} • Format: PDF
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB: GITHUB REPOSITORIES                                       */}
      {/* ============================================================== */}
      {activeTab === "repositories" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-[#0B1220] text-teal-400 flex items-center justify-center shrink-0">
                <FolderGit2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  GitHub Repositories Monitoring Console
                </h3>
                <p className="text-xs text-slate-500">
                  Track student commit velocity, inspect code contributions, and view synchronized branches.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {effectiveGroups.map((grp) => (
              <div key={grp.id} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-[#0B1220] text-teal-400 font-mono font-bold text-xs flex items-center justify-center">
                      #{grp.groupNumber}
                    </span>
                    <h4 className="font-extrabold text-base text-slate-900">{grp.groupName}</h4>
                  </div>
                  <Link
                    href={`/dashboard/projects/${projectId}/workspace?groupId=${grp.id}`}
                    className="text-xs font-bold text-teal-700 hover:underline flex items-center gap-1"
                  >
                    <span>Open Workspace</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FolderGit2 className="w-5 h-5 text-teal-600" />
                    <div>
                      <span className="font-mono text-xs font-bold text-slate-900 block">
                        {grp.repoName || "Repository pending connection"}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {grp.repoUrl || "Students paste their GitHub URL in workspace"}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full">
                    {grp.totalCommits || 0} Commits
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB: ASSIGNMENT WORKFLOW                                       */}
      {/* ============================================================== */}
      {activeTab === "assignment" && (
        <div className="space-y-6">
          <GroupAssignmentSection
            projectId={project.id}
            projectTitle={project.title}
            targetDepartmentId={project.departmentId}
            initialSourceType={project.assignmentSourceType}
            initialFilePath={project.assignmentFilePath}
            initialFileName={project.assignmentFileName}
            initialFileSize={project.assignmentFileSize}
            initialText={project.assignmentText}
            initialStatus={project.assignmentProcessingStatus}
            onConfirmedGroups={() => {
              setActiveTab("supervision");
            }}
          />
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 border border-rose-100">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Delete Project?</h3>
              <p className="text-sm text-slate-600 mt-1">
                Are you sure you want to delete <strong className="text-slate-800">&ldquo;{project.title}&rdquo;</strong>?
                This will unassign student teams and delete all associated submission history.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm shadow-rose-600/20"
              >
                Delete Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProjectDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-xl mx-auto mt-8 shadow-sm">
          <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-medium text-slate-600">Loading academic project supervision...</p>
        </div>
      }
    >
      <ProjectDetailContent />
    </Suspense>
  );
}
