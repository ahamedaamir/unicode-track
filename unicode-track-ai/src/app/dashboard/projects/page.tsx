"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
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
  Terminal,
  ExternalLink,
  Repeat,
} from "lucide-react";
import { useAdminData } from "@/context/AdminDataContext";
import { Project } from "@/types/admin";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export default function ProjectsDirectoryPage() {
  const {
    projects,
    courses,
    lecturers,
    groups,
    publishProject,
    archiveProject,
    deleteProject,
    activeRole,
    setActiveRole,
    activeLecturerEmail,
    activeStudentEmail,
    setActiveStudentEmail,
  } = useAdminData();

  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState<"all" | "Published" | "Draft" | "Archived">("all");
  const [selectedType, setSelectedType] = useState<"all" | "Group Project" | "Individual Project">("all");
  const [selectedSource, setSelectedSource] = useState<"all" | "ai" | "pdf">("all");

  // Lecturer view mode: "cards" vs "batch"
  const [lecturerViewMode, setLecturerViewMode] = useState<"cards" | "batch">("cards");

  // Requirements Modal state
  const [viewingProject, setViewingProject] = useState<Project | null>(null);
  const [copied, setCopied] = useState(false);

  // Delete Confirmation state
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  // Active lecturer
  const currentLecturer = lecturers.find((l) => l.email.toLowerCase() === activeLecturerEmail.toLowerCase());

  // Student Assigned Projects
  const studentAssignedGroups = useMemo(() => {
    return groups.filter((g) =>
      g.members.some((m) => m.email.toLowerCase() === activeStudentEmail.toLowerCase())
    );
  }, [groups, activeStudentEmail]);

  const studentProjectIds = useMemo(() => {
    return new Set(studentAssignedGroups.map((g) => g.projectId));
  }, [studentAssignedGroups]);

  // Filter projects according to role
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      // Role scope: if student mode, only show projects assigned to this student
      if (activeRole === "student") {
        if (!studentProjectIds.has(p.id)) return false;
      } else if (activeRole === "lecturer" && currentLecturer) {
        // Show projects assigned to lecturer or matching their assigned courses
        const isAssigned =
          p.lecturerId === currentLecturer.id ||
          currentLecturer.assignedCourses.includes(p.courseCode);
        if (!isAssigned) return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = p.title.toLowerCase().includes(query);
        const matchesDesc = p.description.toLowerCase().includes(query);
        const matchesCourse = p.courseCode.toLowerCase().includes(query);
        const matchesLecturer = (p.lecturerName || "").toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc && !matchesCourse && !matchesLecturer) {
          return false;
        }
      }

      // Course filter
      if (selectedCourse !== "all" && p.courseCode !== selectedCourse) {
        return false;
      }

      // Status filter
      if (selectedStatus !== "all" && p.status !== selectedStatus) {
        return false;
      }

      // Type filter
      if (selectedType !== "all" && p.type !== selectedType) {
        return false;
      }

      // Source filter
      if (selectedSource !== "all" && p.requirementsSource !== selectedSource) {
        return false;
      }

      return true;
    });
  }, [
    projects,
    activeRole,
    currentLecturer,
    studentProjectIds,
    searchQuery,
    selectedCourse,
    selectedStatus,
    selectedType,
    selectedSource,
  ]);

  // Statistics
  const stats = useMemo(() => {
    const scoped = activeRole === "student"
      ? projects.filter((p) => studentProjectIds.has(p.id))
      : activeRole === "lecturer" && currentLecturer
      ? projects.filter(
          (p) =>
            p.lecturerId === currentLecturer.id ||
            currentLecturer.assignedCourses.includes(p.courseCode)
        )
      : projects;

    return {
      total: scoped.length,
      published: scoped.filter((p) => p.status === "Published").length,
      drafts: scoped.filter((p) => p.status === "Draft").length,
      archived: scoped.filter((p) => p.status === "Archived").length,
    };
  }, [projects, activeRole, currentLecturer, studentProjectIds]);

  // Copy requirements text
  const handleCopyRequirements = () => {
    if (!viewingProject?.requirementsContent) return;
    navigator.clipboard.writeText(viewingProject.requirementsContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Persona Role Switcher Bar for Demo Evaluators */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-xs border border-teal-200">
            <Repeat className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900 block">Active Persona Preview</span>
            <span className="text-[11px] text-slate-500">
              Switch role view to preview student workspace or faculty grading consoles.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveRole("lecturer")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeRole === "lecturer"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Lecturer View ({currentLecturer?.name?.split(" ")[1] || "Reed"})
          </button>

          <button
            onClick={() => setActiveRole("student")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeRole === "student"
                ? "bg-teal-600 text-white shadow-xs shadow-teal-600/20"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Student View (Alex Chen)
          </button>

          <button
            onClick={() => setActiveRole("admin")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeRole === "admin"
                ? "bg-indigo-600 text-white shadow-xs shadow-indigo-600/20"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Admin View
          </button>
        </div>
      </div>

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
                  {activeRole === "student" ? "My Assigned Projects & Workspaces" : "Academic Projects Directory"}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200/60">
                  {stats.total} Projects
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-0.5">
                {activeRole === "student"
                  ? "Access your assigned project workspaces, submit proposals, and monitor shared GitHub repositories."
                  : "Monitor student cohort projects, inspect repository activity, and review proposal submissions."}
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
                  lecturerViewMode === "cards" ? "bg-slate-900 text-white shadow-2xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Project Cards
              </button>
              <button
                onClick={() => setLecturerViewMode("batch")}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  lecturerViewMode === "batch" ? "bg-slate-900 text-white shadow-2xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Batch / Cohort View
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

      {/* Metric Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            {activeRole === "student" ? "Enrolled Projects" : "Total Projects"}
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</div>
          <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
            <FolderKanban className="w-3.5 h-3.5 text-teal-500" />
            {activeRole === "student" ? "Active team workspaces" : "Across assigned courses"}
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm">
          <div className="text-xs font-medium text-emerald-600 uppercase tracking-wider">
            {activeRole === "student" ? "Active Workspaces" : "Published & Active"}
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{stats.published}</div>
          <div className="text-xs text-emerald-600/80 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {activeRole === "student" ? "Open for submission" : "Visible to students"}
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm">
          <div className="text-xs font-medium text-amber-600 uppercase tracking-wider">
            {activeRole === "student" ? "Assigned Groups" : "Drafts"}
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {activeRole === "student" ? studentAssignedGroups.length : stats.drafts}
          </div>
          <div className="text-xs text-amber-600/80 mt-1 flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {activeRole === "student" ? "Single shared workspaces" : "In creation review"}
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            {activeRole === "student" ? "Connected Repos" : "Archived"}
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {activeRole === "student"
              ? studentAssignedGroups.filter((g) => g.repoStatus === "connected").length
              : stats.archived}
          </div>
          <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
            <FolderGit2 className="w-3.5 h-3.5 text-indigo-500" />
            {activeRole === "student" ? "Synchronized with GitHub" : "Past academic cohorts"}
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* LECTURER BATCH VIEW: GROUPED BY COURSE & COHORT                */}
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
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mt-1.5">{proj.title}</h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full">
                      {projectGroups.length} Assigned Groups
                    </span>
                    <Link
                      href={`/dashboard/projects/${proj.id}`}
                      className="text-xs font-semibold text-teal-700 hover:underline flex items-center gap-1"
                    >
                      <span>Project Specs</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>

                {/* Groups in this Batch */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {projectGroups.map((grp) => (
                    <div
                      key={grp.id}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:shadow-xs transition-all flex flex-col justify-between space-y-3"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-xs sm:text-sm text-slate-900">{grp.groupName}</h4>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              grp.proposalStatus === "approved"
                                ? "bg-emerald-100 text-emerald-800"
                                : grp.proposalStatus === "changes_requested"
                                ? "bg-rose-100 text-rose-800"
                                : grp.proposalStatus === "submitted"
                                ? "bg-sky-100 text-sky-800"
                                : "bg-slate-200 text-slate-600"
                            }`}
                          >
                            {grp.proposalStatus === "approved"
                              ? "Proposal Approved"
                              : grp.proposalStatus === "changes_requested"
                              ? "Changes Requested"
                              : grp.proposalStatus === "submitted"
                              ? "Proposal Submitted"
                              : "No Proposal"}
                          </span>
                        </div>

                        {/* Members Stack */}
                        <div className="mt-2 flex items-center gap-2 text-xs text-slate-600">
                          <div className="flex -space-x-1.5 overflow-hidden">
                            {grp.members.map((m, idx) => (
                              <div
                                key={idx}
                                className="w-6 h-6 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center text-[10px] ring-2 ring-white"
                                title={m.fullName}
                              >
                                {m.fullName[0]}
                              </div>
                            ))}
                          </div>
                          <span className="text-[11px] text-slate-500">
                            {grp.members.map((m) => m.fullName.split(" ")[0]).join(", ")}
                          </span>
                        </div>

                        {/* Progress */}
                        <div className="mt-3 space-y-1">
                          <div className="flex justify-between text-[11px] text-slate-500">
                            <span>Progress</span>
                            <span className="font-bold text-slate-800">{grp.progress}%</span>
                          </div>
                          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-teal-500 h-full rounded-full" style={{ width: `${grp.progress}%` }} />
                          </div>
                        </div>
                      </div>

                      {/* Bottom Action Footer */}
                      <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-600">
                          <FolderGit2 className="w-3.5 h-3.5 text-teal-600" />
                          <span>{grp.totalCommits} commits</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Link
                            href={`/dashboard/projects/${proj.id}/workspace`}
                            className="text-xs font-medium text-slate-600 hover:text-slate-900"
                          >
                            Workspace
                          </Link>
                          <Link
                            href={`/dashboard/projects/${proj.id}/groups/${grp.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors"
                          >
                            <span>Review Group</span>
                            <ChevronRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ============================================================== */
        /* STANDARD PROJECT DIRECTORY & STUDENT WORKSPACE VIEW            */
        /* ============================================================== */
        <div className="space-y-6">
          {/* Search & Filter Toolbar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
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

              {/* Course filter */}
              <div>
                <select
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white"
                >
                  <option value="all">All Courses</option>
                  {courses.map((crs) => (
                    <option key={crs.id} value={crs.code}>
                      {crs.code} - {crs.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status filter */}
              <div>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as "all" | "Published" | "Draft" | "Archived")}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white"
                >
                  <option value="all">All Statuses</option>
                  <option value="Published">Published</option>
                  <option value="Draft">Draft</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>

              {/* Project Type filter */}
              <div>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value as "all" | "Group Project" | "Individual Project")}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white"
                >
                  <option value="all">All Types</option>
                  <option value="Group Project">Group Project</option>
                  <option value="Individual Project">Individual Project</option>
                </select>
              </div>
            </div>
          </div>

          {/* Projects Cards Grid */}
          {filteredProjects.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
              <FolderKanban className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-800">No projects found</h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1 mb-5">
                {activeRole === "student"
                  ? "You have not been assigned to any academic group workspaces yet. Your course coordinator will assign you upon cohort group creation."
                  : "No projects matched your active filters."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredProjects.map((project) => {
                const course = courses.find((c) => c.code === project.courseCode);
                const assignedGroup = groups.find(
                  (g) =>
                    g.projectId === project.id &&
                    (activeRole === "student"
                      ? g.members.some((m) => m.email.toLowerCase() === activeStudentEmail.toLowerCase())
                      : true)
                );

                return (
                  <div
                    key={project.id}
                    className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group"
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

                        {/* Assigned Group Badge if Student */}
                        {assignedGroup && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-[#0B1220] text-teal-400">
                            <Users className="w-3 h-3 text-teal-400" />
                            {assignedGroup.groupName.split(":")[0]}
                          </span>
                        )}
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
                            {project.deadline ? new Date(project.deadline).toLocaleDateString() : "Dec 15, 2026"}
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
                          <span>Open Shared Group Workspace</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </Link>
                      ) : (
                        <>
                          <button
                            onClick={() => setViewingProject(project)}
                            className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-teal-600 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Requirements
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
                              className="inline-flex items-center gap-1 text-xs font-medium text-teal-600 hover:text-teal-700 hover:underline"
                            >
                              Details
                              <ArrowUpRight className="w-3 h-3" />
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
              {viewingProject.requirementsContent || "PDF requirements specification attached to project record."}
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
