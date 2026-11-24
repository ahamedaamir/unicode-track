"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FolderKanban,
  Plus,
  Search,
  Filter,
  Sparkles,
  FileText,
  Calendar,
  Users,
  User,
  GraduationCap,
  BookOpen,
  ArrowUpRight,
  MoreVertical,
  CheckCircle2,
  Clock,
  Archive,
  Trash2,
  Eye,
  Copy,
  Check,
  Download,
  AlertCircle,
  FolderGit2,
  Layers,
  ChevronRight,
  ChevronLeft,
  Terminal,
  ExternalLink,
  Sliders,
  Building2,
  ChevronDown,
  LayoutGrid,
  ListFilter,
  RotateCcw,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import { useAdminData } from "@/context/AdminDataContext";
import { Project } from "@/types/admin";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { LecturerGroupCard } from "@/components/groups/LecturerGroupCard";

const ITEMS_PER_PAGE = 6;

export default function ProjectsDirectoryPage() {
  const router = useRouter();
  const {
    projects: contextProjects,
    courses,
    departments,
    lecturers,
    students,
    groups,
    studentAssignments,
    publishProject,
    archiveProject,
    deleteProject,
    activeRole,
    activeLecturerEmail,
    activeStudentEmail,
    setActiveStudentEmail,
    getProjectsForStudent,
    getStudentAssignedGroup,
  } = useAdminData();

  // Navigation Hierarchy State — Current vs Past & Batch Cascade (1.1 - 4.2)
  const [temporalMode, setTemporalMode] = useState<"current" | "past">("current");
  const [selectedBatch, setSelectedBatch] = useState<string>("all");
  const [selectedHierarchyCourse, setSelectedHierarchyCourse] = useState<string>("all");
  const [selectedHierarchyProjectId, setSelectedHierarchyProjectId] = useState<string>("");
  const [selectedHierarchyTargetId, setSelectedHierarchyTargetId] = useState<string>("");

  // Legacy/General filters
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>("all");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [selectedCourse, setSelectedCourse] = useState<string>("all");

  // Secondary Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<"all" | "Published" | "Draft" | "Archived">("all");
  const [selectedType, setSelectedType] = useState<"all" | "Group Project" | "Individual Project">("all");
  const [selectedSource, setSelectedSource] = useState<"all" | "ai" | "pdf">("all");

  // Lecturer view layout: "cards" | "table" | "batch"
  const [lecturerViewMode, setLecturerViewMode] = useState<"cards" | "table" | "batch">("cards");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // Live Supabase fetched projects state
  const [supabaseProjects, setSupabaseProjects] = useState<Project[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Requirements Modal state
  const [viewingProject, setViewingProject] = useState<Project | null>(null);
  const [copied, setCopied] = useState(false);

  // Active lecturer
  const currentLecturer = useMemo(() => {
    return lecturers.find((l) => l.email.toLowerCase() === activeLecturerEmail.toLowerCase());
  }, [lecturers, activeLecturerEmail]);

  // Fetch live Supabase data on mount / when lecturer or role changes
  useEffect(() => {
    let isMounted = true;
    async function loadLiveProjects() {
      setIsLoading(true);
      setFetchError(null);
      try {
        const queryParams = new URLSearchParams();
        if (activeRole === "lecturer" && activeLecturerEmail) {
          queryParams.set("lecturerEmail", activeLecturerEmail);
        }
        if (selectedCourse !== "all") {
          queryParams.set("courseCode", selectedCourse);
        }
        if (selectedDepartment !== "all") {
          queryParams.set("departmentId", selectedDepartment);
        }
        if (selectedAcademicYear !== "all") {
          queryParams.set("academicYear", selectedAcademicYear);
        }

        const res = await fetch(`/api/projects?${queryParams.toString()}`);
        if (!res.ok) {
          throw new Error(`Failed to load projects: ${res.statusText}`);
        }
        const data = await res.json();
        if (isMounted) {
          if (data.success && data.source === "supabase" && Array.isArray(data.projects)) {
            setSupabaseProjects(data.projects);
          } else {
            // Local fallback
            setSupabaseProjects(null);
          }
        }
      } catch (err: unknown) {
        console.warn("Could not fetch projects from Supabase, using local state:", err);
        if (isMounted) {
          setSupabaseProjects(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadLiveProjects();
    return () => {
      isMounted = false;
    };
  }, [activeRole, activeLecturerEmail, selectedAcademicYear, selectedDepartment, selectedCourse]);

  // Combined source projects (Supabase or context fallback)
  const baseProjects = useMemo(() => {
    return supabaseProjects !== null ? supabaseProjects : contextProjects;
  }, [supabaseProjects, contextProjects]);

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

  // Projects filtered by Current vs Past mode
  const temporalProjects = useMemo(() => {
    return baseProjects.filter((p) => {
      const isPast = isPastProject(p);
      return temporalMode === "past" ? isPast : !isPast;
    });
  }, [baseProjects, temporalMode]);

  // Projects matching selected Batch (1.1 - 4.2)
  const batchProjects = useMemo(() => {
    if (selectedBatch === "all") return temporalProjects;
    const [y, s] = selectedBatch.split(".").map(Number);
    return temporalProjects.filter((p) => p.academicYear === y && p.semester === s);
  }, [temporalProjects, selectedBatch]);

  // Available Courses for the selected Batch & Temporal mode
  const cascadeAvailableCourses = useMemo(() => {
    const matchingCodes = new Set(batchProjects.map((p) => p.courseCode));
    return courses.filter((c) => matchingCodes.has(c.code));
  }, [batchProjects, courses]);

  // Projects matching selected Course
  const courseProjects = useMemo(() => {
    if (selectedHierarchyCourse === "all") return batchProjects;
    return batchProjects.filter((p) => p.courseCode === selectedHierarchyCourse);
  }, [batchProjects, selectedHierarchyCourse]);

  // Active selected Project object for the cascade
  const activeSelectedProject = useMemo(() => {
    if (!selectedHierarchyProjectId) return null;
    return baseProjects.find((p) => p.id === selectedHierarchyProjectId) || null;
  }, [baseProjects, selectedHierarchyProjectId]);

  // Groups or Student Assignments for activeSelectedProject
  const activeProjectGroups = useMemo(() => {
    if (!activeSelectedProject) return [];
    const directGroups = groups.filter((g) => g.projectId === activeSelectedProject.id);
    if (directGroups.length > 0) return directGroups;
    // Fallback simulated groups so user always has group 1, group 2 etc.
    return [
      {
        id: `grp-${activeSelectedProject.id}-1`,
        projectId: activeSelectedProject.id,
        groupNumber: 1,
        groupName: "Group 1",
        members: [],
        workspaceId: `ws-${activeSelectedProject.id}-1`,
        totalCommits: 28,
        status: "active" as const,
        progress: 75,
        proposalStatus: "approved" as const,
        createdAt: new Date().toISOString(),
      },
      {
        id: `grp-${activeSelectedProject.id}-2`,
        projectId: activeSelectedProject.id,
        groupNumber: 2,
        groupName: "Group 2",
        members: [],
        workspaceId: `ws-${activeSelectedProject.id}-2`,
        totalCommits: 19,
        status: "active" as const,
        progress: 60,
        proposalStatus: "submitted" as const,
        createdAt: new Date().toISOString(),
      },
    ];
  }, [activeSelectedProject, groups]);

  const activeProjectStudents = useMemo(() => {
    if (!activeSelectedProject) return [];
    const assignments = studentAssignments.filter((a) => a.projectId === activeSelectedProject.id);
    if (assignments.length > 0) {
      return assignments.map((a) => ({
        id: a.id || a.workspaceId,
        studentId: a.studentId || "tg/2004/2004",
        name: a.studentName,
        workspaceId: a.workspaceId,
      }));
    }
    // Matching cohort students with student index format like tg/2004/2004
    const cohort = students.filter(
      (s) =>
        s.academicYear === activeSelectedProject.academicYear &&
        s.semester === activeSelectedProject.semester
    );
    const pool = cohort.length > 0 ? cohort : students;
    return pool.slice(0, 6).map((s, idx) => ({
      id: s.id,
      studentId: s.studentId || `tg/2004/${2004 + idx}`,
      name: s.fullName,
      workspaceId: `ws-ind-${activeSelectedProject.id}-${s.id}`,
    }));
  }, [activeSelectedProject, studentAssignments, students]);

  // Cascading courses for the Hierarchy bar based on selected Department & Academic Year
  const availableCourses = useMemo(() => {
    const matchingCourseCodes = new Set(
      baseProjects
        .filter((p) => {
          if (selectedDepartment !== "all" && p.departmentId !== selectedDepartment) {
            return false;
          }
          if (selectedAcademicYear !== "all" && p.academicYear !== parseInt(selectedAcademicYear, 10)) {
            return false;
          }
          return true;
        })
        .map((p) => p.courseCode)
    );

    return courses.filter((c) =>
      selectedDepartment === "all" && selectedAcademicYear === "all"
        ? true
        : matchingCourseCodes.has(c.code)
    );
  }, [courses, baseProjects, selectedDepartment, selectedAcademicYear]);

  // Student Assigned Projects
  const studentAssignedGroups = useMemo(() => {
    return groups.filter((g) =>
      g.members.some((m) => m.email.toLowerCase() === activeStudentEmail.toLowerCase())
    );
  }, [groups, activeStudentEmail]);

  const studentProjectIds = useMemo(() => {
    return new Set(studentAssignedGroups.map((g) => g.projectId));
  }, [studentAssignedGroups]);

  // Filter projects according to role, navigation hierarchy, and filters
  const filteredProjects = useMemo(() => {
    return baseProjects.filter((p) => {
      // 1. Role scope & security
      if (activeRole === "student") {
        const studentProjects = getProjectsForStudent(activeStudentEmail);
        const validIds = new Set(studentProjects.map((sp) => sp.id));
        if (!validIds.has(p.id)) return false;
      } else if (activeRole === "lecturer" && currentLecturer) {
        // Enforce security: only display projects assigned to the logged-in lecturer
        const matchesId = p.lecturerId === currentLecturer.id;
        const matchesName =
          p.lecturerName &&
          p.lecturerName.toLowerCase() === currentLecturer.name.toLowerCase();
        const matchesCourse =
          Array.isArray(currentLecturer.assignedCourses) &&
          currentLecturer.assignedCourses.includes(p.courseCode);

        if (!matchesId && !matchesName && !matchesCourse) {
          return false;
        }
      }

      // 2. Navigation Hierarchy: Academic Year
      if (selectedAcademicYear !== "all" && p.academicYear !== parseInt(selectedAcademicYear, 10)) {
        return false;
      }

      // 3. Navigation Hierarchy: Department / Program
      if (selectedDepartment !== "all" && p.departmentId !== selectedDepartment) {
        return false;
      }

      // 4. Navigation Hierarchy: Course
      if (selectedCourse !== "all" && p.courseCode !== selectedCourse) {
        return false;
      }

      // 5. Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = p.title.toLowerCase().includes(query);
        const matchesDesc = (p.description || "").toLowerCase().includes(query);
        const matchesCourse = p.courseCode.toLowerCase().includes(query);
        const matchesLecturer = (p.lecturerName || "").toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc && !matchesCourse && !matchesLecturer) {
          return false;
        }
      }

      // 6. Status filter
      if (selectedStatus !== "all" && p.status !== selectedStatus) {
        return false;
      }

      // 7. Type filter
      if (selectedType !== "all") {
        const isIndiv = p.projectType === "individual" || p.type === "Individual Project";
        if (selectedType === "Individual Project" && !isIndiv) return false;
        if (selectedType === "Group Project" && isIndiv) return false;
      }

      // 8. Source filter
      if (selectedSource !== "all" && p.requirementsSource !== selectedSource) {
        return false;
      }

      return true;
    });
  }, [
    baseProjects,
    activeRole,
    currentLecturer,
    studentProjectIds,
    selectedAcademicYear,
    selectedDepartment,
    selectedCourse,
    searchQuery,
    selectedStatus,
    selectedType,
    selectedSource,
    activeStudentEmail,
    getProjectsForStudent,
  ]);

  // Statistics
  const stats = useMemo(() => {
    const scoped = activeRole === "student"
      ? baseProjects.filter((p) => studentProjectIds.has(p.id))
      : activeRole === "lecturer" && currentLecturer
      ? baseProjects.filter(
          (p) =>
            p.lecturerId === currentLecturer.id ||
            (p.lecturerName && p.lecturerName.toLowerCase() === currentLecturer.name.toLowerCase()) ||
            currentLecturer.assignedCourses.includes(p.courseCode)
        )
      : baseProjects;

    const groupProjectsCount = scoped.filter(
      (p) => p.projectType === "group" || p.type === "Group Project"
    ).length;
    const individualProjectsCount = scoped.filter(
      (p) => p.projectType === "individual" || p.type === "Individual Project"
    ).length;

    return {
      total: scoped.length,
      published: scoped.filter((p) => p.status === "Published").length,
      groupProjects: groupProjectsCount,
      individualProjects: individualProjectsCount,
      drafts: scoped.filter((p) => p.status === "Draft").length,
      archived: scoped.filter((p) => p.status === "Archived").length,
    };
  }, [baseProjects, activeRole, currentLecturer, studentProjectIds]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredProjects.length / ITEMS_PER_PAGE) || 1;
  const paginatedProjects = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProjects.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProjects, currentPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    selectedAcademicYear,
    selectedDepartment,
    selectedCourse,
    searchQuery,
    selectedStatus,
    selectedType,
  ]);

  // Helper to count groups for a project
  const getProjectGroupCount = (project: Project): number => {
    if (typeof project.groupCount === "number" && project.groupCount > 0) {
      return project.groupCount;
    }
    return groups.filter((g) => g.projectId === project.id).length;
  };

  // Helper to count students for an individual project
  const getProjectStudentCount = (project: Project): number => {
    if (typeof project.assignedStudentCount === "number" && project.assignedStudentCount > 0) {
      return project.assignedStudentCount;
    }
    return studentAssignments.filter((a) => a.projectId === project.id).length;
  };

  // Clear all hierarchy and secondary filters
  const handleResetFilters = () => {
    setSelectedAcademicYear("all");
    setSelectedDepartment("all");
    setSelectedCourse("all");
    setSearchQuery("");
    setSelectedStatus("all");
    setSelectedType("all");
    setSelectedSource("all");
  };

  const isHierarchyFiltered =
    selectedAcademicYear !== "all" ||
    selectedDepartment !== "all" ||
    selectedCourse !== "all";

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-600 border border-teal-500/20">
              <FolderKanban className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  {activeRole === "student"
                    ? "My Assigned Projects & Workspaces"
                    : "Academic Projects & Supervision"}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200/60">
                  {stats.total} Projects
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-0.5">
                {activeRole === "student"
                  ? "Access your assigned project workspaces, submit proposals, and monitor shared GitHub repositories."
                  : "Supervise student cohorts, monitor group deliverables, inspect repositories, and conduct AI reviews."}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {activeRole === "lecturer" && (
            <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 text-xs">
              <button
                onClick={() => setLecturerViewMode("cards")}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  lecturerViewMode === "cards"
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Cards View
              </button>
              <button
                onClick={() => setLecturerViewMode("table")}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  lecturerViewMode === "table"
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Table View
              </button>
              <button
                onClick={() => setLecturerViewMode("batch")}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  lecturerViewMode === "batch"
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Cohort View
              </button>
            </div>
          )}

          {activeRole !== "student" && (
            <Link
              href="/dashboard/projects/create"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-xl shadow-sm shadow-teal-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              Create Project
            </Link>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* ACADEMIC NAVIGATION HIERARCHY BAR                              */}
      {/* Hierarchy: Current/Past -> Batch -> Course -> Title -> Target  */}
      {/* ============================================================== */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-5 sm:p-6 rounded-2xl shadow-md border border-slate-700/60 space-y-5">
        {/* Top Switcher: Current Projects vs Past Projects */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold text-xs border border-teal-500/30">
              <Layers className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-sm font-bold tracking-wide uppercase text-teal-300">
                Academic Project Navigation Hierarchy
              </h2>
              <p className="text-xs text-slate-300">
                Select between active cohort projects or past concluded academic archives.
              </p>
            </div>
          </div>

          {/* Current vs Past Projects Switcher */}
          <div className="inline-flex rounded-xl bg-slate-950 p-1 border border-slate-700/80 text-xs">
            <button
              type="button"
              onClick={() => {
                setTemporalMode("current");
                setSelectedHierarchyProjectId("");
                setSelectedHierarchyTargetId("");
              }}
              className={`px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-2 ${
                temporalMode === "current"
                  ? "bg-teal-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Current Projects</span>
              <span className="px-1.5 py-0.2 rounded-full bg-teal-900/60 text-[10px] font-mono border border-teal-500/30">
                {baseProjects.filter((p) => !isPastProject(p)).length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setTemporalMode("past");
                setSelectedHierarchyProjectId("");
                setSelectedHierarchyTargetId("");
              }}
              className={`px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-2 ${
                temporalMode === "past"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Archive className="w-3.5 h-3.5" />
              <span>Past Projects</span>
              <span className="px-1.5 py-0.2 rounded-full bg-indigo-900/60 text-[10px] font-mono border border-indigo-500/30">
                {baseProjects.filter((p) => isPastProject(p)).length}
              </span>
            </button>
          </div>
        </div>

        {/* STEP 1: SELECT BATCH (1.1 / 1.2 / 2.1 / 2.2 / 3.1 / 3.2 / 4.1 / 4.2) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5" />
              1. Select Batch (Year.Semester)
            </span>
            <span className="text-[10px] text-slate-400">
              {selectedBatch === "all" ? "All Batches Active" : `Filtered: Batch ${selectedBatch}`}
            </span>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {[
              { val: "1.1", label: "1.1", labelFull: "Y1 Sem 1" },
              { val: "1.2", label: "1.2", labelFull: "Y1 Sem 2" },
              { val: "2.1", label: "2.1", labelFull: "Y2 Sem 1" },
              { val: "2.2", label: "2.2", labelFull: "Y2 Sem 2" },
              { val: "3.1", label: "3.1", labelFull: "Y3 Sem 1" },
              { val: "3.2", label: "3.2", labelFull: "Y3 Sem 2" },
              { val: "4.1", label: "4.1", labelFull: "Y4 Sem 1" },
              { val: "4.2", label: "4.2", labelFull: "Y4 Sem 2" },
            ].map((batch) => {
              const isSelected = selectedBatch === batch.val;
              return (
                <button
                  key={batch.val}
                  type="button"
                  onClick={() => {
                    setSelectedBatch(isSelected ? "all" : batch.val);
                    setSelectedHierarchyCourse("all");
                    setSelectedHierarchyProjectId("");
                    setSelectedHierarchyTargetId("");
                  }}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    isSelected
                      ? "bg-teal-500 text-slate-950 font-extrabold border-teal-300 shadow-xs scale-102"
                      : "bg-slate-800/90 hover:bg-slate-700/80 text-slate-200 border-slate-700 font-semibold"
                  }`}
                >
                  <span className="block text-sm font-mono">{batch.label}</span>
                  <span className={`block text-[9px] mt-0.5 ${isSelected ? "text-slate-900 font-bold" : "text-slate-400"}`}>
                    {batch.labelFull}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* STEP 2 & STEP 3: COURSE SELECT -> PROJECT TITLE */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {/* STEP 2: COURSE SELECT */}
          <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/80 space-y-2">
            <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              2. Select Course
            </span>
            <select
              value={selectedHierarchyCourse}
              onChange={(e) => {
                setSelectedHierarchyCourse(e.target.value);
                setSelectedHierarchyProjectId("");
                setSelectedHierarchyTargetId("");
              }}
              className="w-full bg-slate-900 border border-slate-700 text-white text-xs font-medium rounded-lg px-3 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">
                All Available Courses ({cascadeAvailableCourses.length} in this view)
              </option>
              {cascadeAvailableCourses.map((c) => (
                <option key={c.id} value={c.code}>
                  {c.code} — {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* STEP 3: PROJECT TITLE */}
          <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/80 space-y-2">
            <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
              <FolderKanban className="w-3.5 h-3.5" />
              3. Select Project Title
            </span>
            <select
              value={selectedHierarchyProjectId}
              onChange={(e) => {
                setSelectedHierarchyProjectId(e.target.value);
                setSelectedHierarchyTargetId("");
              }}
              className="w-full bg-slate-900 border border-slate-700 text-white text-xs font-medium rounded-lg px-3 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
            >
              <option value="">
                {courseProjects.length === 0
                  ? "No projects matching active filters"
                  : "-- Choose Project Title --"}
              </option>
              {courseProjects.map((p) => (
                <option key={p.id} value={p.id}>
                  [{p.courseCode}] {p.title} ({p.projectType === "individual" || p.type === "Individual Project" ? "Personal" : "Group"})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* STEP 4: GROUP PROJECT VS PERSONAL PROJECT SELECTOR */}
        {activeSelectedProject && (
          <div className="bg-slate-950/90 p-4 sm:p-5 rounded-xl border border-slate-700/90 space-y-3.5 animate-in fade-in-50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-teal-900/60 text-teal-300 border border-teal-700/50">
                  {activeSelectedProject.projectType === "individual" || activeSelectedProject.type === "Individual Project"
                    ? "Personal Project Workflow"
                    : "Group Project Workflow"}
                </span>
                <h4 className="text-xs font-bold text-white truncate max-w-md">
                  {activeSelectedProject.title}
                </h4>
              </div>

              {temporalMode === "past" && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-900/60 text-indigo-300 border border-indigo-700/50 flex items-center gap-1">
                  <Archive className="w-3 h-3" />
                  Past Project (Duration Finished)
                </span>
              )}
            </div>

            {/* IF GROUP PROJECT -> GROUP NAMES AVAILABLE */}
            {activeSelectedProject.projectType !== "individual" && activeSelectedProject.type !== "Individual Project" ? (
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-300 block">
                  Available Groups (Select a group to proceed):
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {activeProjectGroups.map((grp) => {
                    const isSelected = selectedHierarchyTargetId === grp.id || selectedHierarchyTargetId === grp.workspaceId;
                    return (
                      <button
                        key={grp.id}
                        type="button"
                        onClick={() => setSelectedHierarchyTargetId(grp.id)}
                        className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                          isSelected
                            ? "bg-teal-600/30 border-teal-400 text-white shadow-xs"
                            : "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700"
                        }`}
                      >
                        <div>
                          <p className="text-xs font-bold text-white">{grp.groupName || `Group ${grp.groupNumber}`}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {grp.members?.length || 4} members • {grp.totalCommits || 0} commits
                          </p>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-teal-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* ELSE PERSONAL PROJECT -> STUDENTS INDEX AVAILABLE (e.g. tg/2004/2004) */
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-300 block">
                  Enrolled Students Index (Select student to proceed):
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {activeProjectStudents.map((std) => {
                    const isSelected = selectedHierarchyTargetId === std.id || selectedHierarchyTargetId === std.workspaceId;
                    return (
                      <button
                        key={std.id}
                        type="button"
                        onClick={() => setSelectedHierarchyTargetId(std.id)}
                        className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                          isSelected
                            ? "bg-teal-600/30 border-teal-400 text-white shadow-xs"
                            : "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700"
                        }`}
                      >
                        <div>
                          <p className="text-xs font-mono font-bold text-teal-300">{std.studentId}</p>
                          <p className="text-[11px] text-slate-300 font-semibold mt-0.5 truncate max-w-[160px]">
                            {std.name}
                          </p>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-teal-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ACTION BUTTONS: CONTINUE TO WORKSPACE & GITHUB CONSOLE */}
            <div className="flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-slate-800/80">
              {temporalMode === "past" && (
                <Link
                  href={`/dashboard/projects/${activeSelectedProject.id}/groups/${selectedHierarchyTargetId || activeProjectGroups[0]?.id || "grp-1"}/reports`}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-all flex items-center gap-1.5 shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Open Evaluation, C Runner & Final Marks &rarr;</span>
                </Link>
              )}

              <Button
                variant="primary"
                size="md"
                disabled={!selectedHierarchyTargetId}
                onClick={() => {
                  router.push(
                    `/dashboard/projects/${activeSelectedProject.id}/workspace?groupId=${selectedHierarchyTargetId}`
                  );
                }}
                icon={<ArrowUpRight className="w-4 h-4" />}
              >
                Continue to Workspace & GitHub Console &rarr;
              </Button>
            </div>
          </div>
        )}

        {/* Breadcrumb Trail Indicator */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800 text-xs">
          <span className="text-slate-400 font-medium">Timeline Mode:</span>
          <span className="font-semibold text-teal-400 capitalize">
            {temporalMode === "past" ? "Past Projects (Archives)" : "Current Projects (Active)"}
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-slate-400 font-medium">Batch:</span>
          <span className="font-semibold text-slate-200">
            {selectedBatch === "all" ? "All Batches (1.1 - 4.2)" : `Batch ${selectedBatch}`}
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-slate-400 font-medium">Course:</span>
          <span className="font-semibold text-slate-200">
            {selectedHierarchyCourse === "all" ? "All Courses" : selectedHierarchyCourse}
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
          <span className="font-bold text-teal-400">
            {courseProjects.length} Projects in Hierarchy
          </span>
        </div>
      </div>

      {/* Metric Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            {activeRole === "student" ? "Enrolled Projects" : "Total Projects"}
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</div>
          <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
            <FolderKanban className="w-3.5 h-3.5 text-teal-500" />
            {activeRole === "student" ? "Active team workspaces" : "Under your academic scope"}
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs">
          <div className="text-xs font-medium text-emerald-600 uppercase tracking-wider">
            {activeRole === "student" ? "Active Workspaces" : "Published & Active"}
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{stats.published}</div>
          <div className="text-xs text-emerald-600/80 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {activeRole === "student" ? "Open for submission" : "Visible to students"}
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs">
          <div className="text-xs font-medium text-indigo-600 uppercase tracking-wider">
            Group Projects
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{stats.groupProjects}</div>
          <div className="text-xs text-indigo-600/80 mt-1 flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            Shared team workspaces
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs">
          <div className="text-xs font-medium text-purple-600 uppercase tracking-wider">
            Individual Projects
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{stats.individualProjects}</div>
          <div className="text-xs text-purple-600/80 mt-1 flex items-center gap-1">
            <User className="w-3.5 h-3.5" />
            Personal student workspaces
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* LECTURER BATCH COHORT VIEW                                     */}
      {/* ============================================================== */}
      {activeRole === "lecturer" && lecturerViewMode === "batch" ? (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-2">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-teal-600" />
              Lecturer Batch & Cohort View
            </h3>
            <p className="text-xs text-slate-500">
              Projects organized by Course Code, Academic Year, Semester, and Assigned Student Groups.
            </p>
          </div>

          {filteredProjects.map((proj) => {
            const projectGroups = groups.filter((g) => g.projectId === proj.id);

            return (
              <div
                key={proj.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden space-y-4 p-6"
              >
                {/* Batch Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200">
                        {proj.courseCode}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">
                        Year {proj.academicYear} • Semester {proj.semester}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {proj.projectType === "individual" || proj.type === "Individual Project"
                          ? "Individual Project"
                          : "Group Project"}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mt-1.5">{proj.title}</h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full">
                      {proj.projectType === "individual" || proj.type === "Individual Project"
                        ? `${getProjectStudentCount(proj)} Assigned Students`
                        : `${projectGroups.length} Assigned Groups`}
                    </span>
                    <Link
                      href={`/dashboard/projects/${proj.id}`}
                      className="text-xs font-semibold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-colors"
                    >
                      <span>Supervise Project</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>

                {/* Groups in this Batch */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {projectGroups.map((grp) => {
                    const course = courses.find((c) => c.code === proj.courseCode);
                    return (
                      <LecturerGroupCard
                        key={grp.id}
                        group={grp}
                        project={proj}
                        courseName={course?.name}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ============================================================== */
        /* STANDARD PROJECTS DIRECTORY & CARDS / TABLE VIEW               */
        /* ============================================================== */
        <div className="space-y-6">
          {/* Secondary Search & Filter Toolbar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Search Box */}
              <div className="lg:col-span-2 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search projects by title, course, or topic..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Status filter */}
              <div>
                <select
                  value={selectedStatus}
                  onChange={(e) =>
                    setSelectedStatus(e.target.value as "all" | "Published" | "Draft" | "Archived")
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white"
                >
                  <option value="all">All Project Statuses</option>
                  <option value="Published">Published & Active</option>
                  <option value="Draft">Drafts</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>

              {/* Project Type filter */}
              <div>
                <select
                  value={selectedType}
                  onChange={(e) =>
                    setSelectedType(
                      e.target.value as "all" | "Group Project" | "Individual Project"
                    )
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white"
                >
                  <option value="all">All Project Types</option>
                  <option value="Group Project">Group Projects (Shared Workspaces)</option>
                  <option value="Individual Project">Individual Projects (Personal Workspaces)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Loading Skeletons */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 animate-pulse"
                >
                  <div className="flex justify-between items-center">
                    <div className="h-5 w-24 bg-slate-200 rounded-full" />
                    <div className="h-5 w-16 bg-slate-200 rounded-full" />
                  </div>
                  <div className="h-6 w-3/4 bg-slate-200 rounded-md" />
                  <div className="h-4 w-full bg-slate-100 rounded-md" />
                  <div className="h-4 w-2/3 bg-slate-100 rounded-md" />
                  <div className="pt-4 border-t border-slate-100 space-y-2">
                    <div className="h-4 w-full bg-slate-100 rounded-md" />
                    <div className="h-4 w-1/2 bg-slate-100 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredProjects.length === 0 ? (
            /* Empty State */
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
              <FolderKanban className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-800">No projects found</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto mt-1 mb-5">
                {activeRole === "student"
                  ? "You have not been assigned to any academic workspaces yet. Your course coordinator will assign you upon cohort group creation."
                  : "No projects matched your active academic year, department, or course filters."}
              </p>
              {isHierarchyFiltered && (
                <Button variant="outline" size="sm" onClick={handleResetFilters}>
                  Clear All Filters
                </Button>
              )}
            </div>
          ) : lecturerViewMode === "table" ? (
            /* ============================================================== */
            /* TABLE VIEW                                                     */
            /* ============================================================== */
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="px-5 py-3.5">Project Title</th>
                      <th className="px-4 py-3.5">Type</th>
                      <th className="px-4 py-3.5">Course</th>
                      <th className="px-4 py-3.5">Cohort</th>
                      <th className="px-4 py-3.5">Allocations</th>
                      <th className="px-4 py-3.5">Deadline</th>
                      <th className="px-4 py-3.5">Status</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {paginatedProjects.map((project) => {
                      const isIndiv =
                        project.projectType === "individual" ||
                        project.type === "Individual Project";
                      const groupCount = getProjectGroupCount(project);
                      const studentCount = getProjectStudentCount(project);

                      return (
                        <tr
                          key={project.id}
                          className="hover:bg-slate-50/70 transition-colors group"
                        >
                          <td className="px-5 py-4 max-w-xs">
                            <Link
                              href={
                                activeRole === "student"
                                  ? `/dashboard/projects/${project.id}/workspace`
                                  : `/dashboard/projects/${project.id}`
                              }
                              className="font-bold text-slate-900 group-hover:text-teal-600 transition-colors line-clamp-1 text-sm"
                            >
                              {project.title}
                            </Link>
                            <span className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                              {project.description}
                            </span>
                          </td>

                          <td className="px-4 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold text-[11px] ${
                                isIndiv
                                  ? "bg-purple-50 text-purple-700 border border-purple-200"
                                  : "bg-indigo-50 text-indigo-700 border border-indigo-200"
                              }`}
                            >
                              {isIndiv ? (
                                <User className="w-3 h-3 text-purple-600" />
                              ) : (
                                <Users className="w-3 h-3 text-indigo-600" />
                              )}
                              {isIndiv ? "Individual" : "Group"}
                            </span>
                          </td>

                          <td className="px-4 py-4 whitespace-nowrap font-mono font-bold text-teal-700">
                            {project.courseCode}
                          </td>

                          <td className="px-4 py-4 whitespace-nowrap text-slate-600">
                            Year {project.academicYear}, Sem {project.semester}
                          </td>

                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                              {isIndiv ? (
                                <>
                                  <User className="w-3 h-3 text-slate-500" />
                                  <span>{studentCount} Students</span>
                                </>
                              ) : (
                                <>
                                  <Users className="w-3 h-3 text-slate-500" />
                                  <span>{groupCount} Groups</span>
                                </>
                              )}
                            </span>
                          </td>

                          <td className="px-4 py-4 whitespace-nowrap text-slate-600">
                            {project.deadline
                              ? new Date(project.deadline).toLocaleDateString()
                              : "No deadline"}
                          </td>

                          <td className="px-4 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold text-[11px] ${
                                project.status === "Published"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : project.status === "Draft"
                                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                                  : "bg-slate-100 text-slate-600 border border-slate-200"
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  project.status === "Published"
                                    ? "bg-emerald-500 animate-pulse"
                                    : project.status === "Draft"
                                    ? "bg-amber-500"
                                    : "bg-slate-400"
                                }`}
                              />
                              {project.status}
                            </span>
                          </td>

                          <td className="px-5 py-4 whitespace-nowrap text-right">
                            <Link
                              href={
                                activeRole === "student"
                                  ? `/dashboard/projects/${project.id}/workspace`
                                  : `/dashboard/projects/${project.id}`
                              }
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-semibold border border-teal-200 transition-colors"
                            >
                              <span>
                                {activeRole === "student" ? "Open Workspace" : "Supervise"}
                              </span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* ============================================================== */
            /* CARDS GRID VIEW                                                */
            /* ============================================================== */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {paginatedProjects.map((project) => {
                const course = courses.find((c) => c.code === project.courseCode);
                const assignedGroup = getStudentAssignedGroup(project.id, activeStudentEmail);
                const isIndiv =
                  project.projectType === "individual" ||
                  project.type === "Individual Project";
                const groupCount = getProjectGroupCount(project);
                const studentCount = getProjectStudentCount(project);

                return (
                  <div
                    key={project.id}
                    className="bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group"
                  >
                    {/* Card Top Section */}
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        {/* Status badge */}
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            project.status === "Published"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80"
                              : project.status === "Draft"
                              ? "bg-amber-50 text-amber-700 border border-amber-200/80"
                              : "bg-slate-100 text-slate-600 border border-slate-200"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              project.status === "Published"
                                ? "bg-emerald-500 animate-pulse"
                                : project.status === "Draft"
                                ? "bg-amber-500"
                                : "bg-slate-400"
                            }`}
                          />
                          {project.status}
                        </span>

                        {/* Project Type Badge */}
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            isIndiv
                              ? "bg-purple-50 text-purple-700 border border-purple-200"
                              : "bg-indigo-50 text-indigo-700 border border-indigo-200"
                          }`}
                        >
                          {isIndiv ? (
                            <User className="w-3 h-3 text-purple-600" />
                          ) : (
                            <Users className="w-3 h-3 text-indigo-600" />
                          )}
                          {isIndiv ? "Individual" : "Group Project"}
                        </span>
                      </div>

                      {/* Title & Description */}
                      <Link
                        href={
                          activeRole === "student"
                            ? `/dashboard/projects/${project.id}/workspace`
                            : `/dashboard/projects/${project.id}`
                        }
                        className="group-hover:text-teal-600 transition-colors"
                      >
                        <h3 className="text-base font-semibold text-slate-900 line-clamp-1">
                          {project.title}
                        </h3>
                      </Link>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {project.description}
                      </p>

                      {/* Academic Assignment Details */}
                      <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 flex items-center gap-1.5">
                            <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                            Course:
                          </span>
                          <span className="font-medium text-slate-800">
                            <span className="text-teal-600 font-semibold">{project.courseCode}</span>
                            {course ? ` • ${course.name.substring(0, 18)}...` : ""}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 flex items-center gap-1.5">
                            <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                            Cohort:
                          </span>
                          <span className="text-slate-600">
                            Year {project.academicYear}, Semester {project.semester}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            Deadline:
                          </span>
                          <span className="font-medium text-slate-700">
                            {project.deadline
                              ? new Date(project.deadline).toLocaleDateString()
                              : "Dec 15, 2026"}
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-slate-100 font-medium">
                          <span className="text-slate-400 flex items-center gap-1.5">
                            {isIndiv ? (
                              <User className="w-3.5 h-3.5 text-purple-500" />
                            ) : (
                              <Users className="w-3.5 h-3.5 text-indigo-500" />
                            )}
                            Allocations:
                          </span>
                          <span className="text-slate-900 font-semibold">
                            {isIndiv ? `${studentCount} Assigned Students` : `${groupCount} Groups Formed`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Card Bottom / Action Bar */}
                    <div className="px-5 py-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
                      {activeRole === "student" ? (
                        <Link
                          href={`/dashboard/projects/${project.id}/workspace`}
                          className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-2xs transition-colors"
                        >
                          <span>Open Shared Workspace</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </Link>
                      ) : (
                        <>
                          <button
                            onClick={() => setViewingProject(project)}
                            className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-teal-600 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Specs
                          </button>

                          <div className="flex items-center gap-2">
                            <Link
                              href={`/dashboard/projects/${project.id}/workspace`}
                              className="text-xs font-medium text-slate-600 hover:text-slate-900"
                            >
                              Workspace
                            </Link>

                            <Link
                              href={`/dashboard/projects/${project.id}`}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-2xs transition-colors"
                            >
                              <span>Supervise</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ============================================================== */}
          {/* PAGINATION CONTROLS                                            */}
          {/* ============================================================== */}
          {filteredProjects.length > ITEMS_PER_PAGE && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200">
              <span className="text-xs text-slate-500 font-medium">
                Showing{" "}
                <span className="font-semibold text-slate-800">
                  {(currentPage - 1) * ITEMS_PER_PAGE + 1}
                </span>{" "}
                to{" "}
                <span className="font-semibold text-slate-800">
                  {Math.min(currentPage * ITEMS_PER_PAGE, filteredProjects.length)}
                </span>{" "}
                of <span className="font-semibold text-slate-800">{filteredProjects.length}</span>{" "}
                projects
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${
                      currentPage === pageNum
                        ? "bg-slate-900 text-white shadow-2xs"
                        : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* View Requirements Modal */}
      {viewingProject && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-start justify-between bg-slate-50/50">
              <div>
                <h2 className="text-base font-bold text-slate-900">{viewingProject.title}</h2>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{viewingProject.courseCode}</p>
              </div>
              <button
                onClick={() => setViewingProject(null)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto font-mono text-xs text-slate-800 whitespace-pre-wrap leading-relaxed max-h-[50vh]">
              {viewingProject.requirementsContent ||
                "PDF requirements specification attached to project record."}
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setViewingProject(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
