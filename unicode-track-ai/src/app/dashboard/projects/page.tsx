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
  AlertCircle
} from "lucide-react";
import { useAdminData } from "@/context/AdminDataContext";
import { Project } from "@/types/admin";

export default function ProjectsDirectoryPage() {
  const {
    projects,
    courses,
    lecturers,
    publishProject,
    archiveProject,
    deleteProject,
    activeRole,
    activeLecturerEmail,
  } = useAdminData();

  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState<"all" | "Published" | "Draft" | "Archived">("all");
  const [selectedType, setSelectedType] = useState<"all" | "Group Project" | "Individual Project">("all");
  const [selectedSource, setSelectedSource] = useState<"all" | "ai" | "pdf">("all");

  // Requirements Modal state
  const [viewingProject, setViewingProject] = useState<Project | null>(null);
  const [copied, setCopied] = useState(false);

  // Delete Confirmation state
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  // Find active lecturer
  const currentLecturer = lecturers.find((l) => l.email.toLowerCase() === activeLecturerEmail.toLowerCase());

  // Filter projects according to role:
  // If role is lecturer, we highlight/filter the lecturer's projects by default, but allow viewing all department projects
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      // Role scope: if lecturer mode, can focus on lecturer's projects or all assigned
      if (activeRole === "lecturer" && currentLecturer) {
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
    searchQuery,
    selectedCourse,
    selectedStatus,
    selectedType,
    selectedSource,
  ]);

  // Statistics
  const stats = useMemo(() => {
    const scoped = activeRole === "lecturer" && currentLecturer
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
  }, [projects, activeRole, currentLecturer]);

  // Copy requirements text
  const handleCopyRequirements = () => {
    if (!viewingProject?.requirementsContent) return;
    navigator.clipboard.writeText(viewingProject.requirementsContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-600 border border-teal-500/20">
              <FolderKanban className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Academic Projects</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200/60">
                  {stats.total} Projects
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-0.5">
                Manage, publish, and evaluate course projects created for student cohorts.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/projects/create"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-xl shadow-sm shadow-teal-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            Create Project
          </Link>
        </div>
      </div>

      {/* Metric Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Projects</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</div>
          <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
            <FolderKanban className="w-3.5 h-3.5 text-teal-500" />
            Across assigned courses
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm">
          <div className="text-xs font-medium text-emerald-600 uppercase tracking-wider">Published & Active</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{stats.published}</div>
          <div className="text-xs text-emerald-600/80 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Visible to students
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm">
          <div className="text-xs font-medium text-amber-600 uppercase tracking-wider">Drafts</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{stats.drafts}</div>
          <div className="text-xs text-amber-600/80 mt-1 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            In creation review
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Archived</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{stats.archived}</div>
          <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
            <Archive className="w-3.5 h-3.5" />
            Past academic cohorts
          </div>
        </div>
      </div>

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
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white transition-all"
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
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white"
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
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white"
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
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white"
            >
              <option value="all">All Types</option>
              <option value="Group Project">Group Project</option>
              <option value="Individual Project">Individual Project</option>
            </select>
          </div>
        </div>

        {/* Secondary filters row */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Requirements Source:</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setSelectedSource("all")}
                className={`px-2 py-1 rounded-md transition-colors ${
                  selectedSource === "all"
                    ? "bg-slate-900 text-white font-medium"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSelectedSource("ai")}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-md transition-colors ${
                  selectedSource === "ai"
                    ? "bg-teal-600 text-white font-medium"
                    : "bg-teal-50 text-teal-700 hover:bg-teal-100"
                }`}
              >
                <Sparkles className="w-3 h-3" />
                Gemini AI
              </button>
              <button
                onClick={() => setSelectedSource("pdf")}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-md transition-colors ${
                  selectedSource === "pdf"
                    ? "bg-indigo-600 text-white font-medium"
                    : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                }`}
              >
                <FileText className="w-3 h-3" />
                PDF Upload
              </button>
            </div>
          </div>

          <div>
            Showing <span className="font-semibold text-slate-900">{filteredProjects.length}</span> of {projects.length} total projects
          </div>
        </div>
      </div>

      {/* Projects Grid / Directory List */}
      {filteredProjects.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-3">
            <FolderKanban className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-800">No projects found</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1 mb-5">
            {searchQuery || selectedCourse !== "all" || selectedStatus !== "all" || selectedType !== "all"
              ? "No academic projects matched your active filters. Try clearing your search parameters."
              : "No academic projects have been created yet. Launch your first project with AI or PDF requirements."}
          </p>
          <div className="flex items-center justify-center gap-3">
            {(searchQuery || selectedCourse !== "all" || selectedStatus !== "all" || selectedType !== "all") && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCourse("all");
                  setSelectedStatus("all");
                  setSelectedType("all");
                  setSelectedSource("all");
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors"
              >
                Reset Filters
              </button>
            )}
            <Link
              href="/dashboard/projects/create"
              className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Create Project
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.map((project) => {
            const course = courses.find((c) => c.code === project.courseCode);

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

                    {/* Type & Requirements Source Badges */}
                    <div className="flex items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                        {project.type === "Group Project" ? (
                          <Users className="w-3 h-3 text-slate-500" />
                        ) : (
                          <User className="w-3 h-3 text-slate-500" />
                        )}
                        {project.type === "Group Project" ? "Group" : "Individual"}
                      </span>

                      {project.requirementsSource === "ai" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-teal-50 text-teal-700 border border-teal-200/60" title="Requirements generated with Google Gemini 2.5 Flash">
                          <Sparkles className="w-3 h-3 text-teal-600" />
                          Gemini AI
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200/60" title="Requirements uploaded as PDF">
                          <FileText className="w-3 h-3 text-indigo-600" />
                          PDF
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <Link
                    href={`/dashboard/projects/${project.id}`}
                    className="group-hover:text-teal-600 transition-colors"
                  >
                    <h3 className="text-base font-semibold text-slate-900 line-clamp-1">
                      {project.title}
                    </h3>
                  </Link>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {project.description}
                  </p>

                  {/* Academic Context Badges */}
                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                        Course:
                      </span>
                      <span className="font-medium text-slate-800">
                        <span className="text-teal-600 font-semibold">{project.courseCode}</span>
                        {course ? ` • ${course.name.substring(0, 20)}...` : ""}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                        Cohort:
                      </span>
                      <span className="text-slate-600">
                        Year {project.academicYear}, Semester {project.semester}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        Deadline:
                      </span>
                      <span className="font-medium text-slate-700">
                        {project.deadline
                          ? new Date(project.deadline).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "No deadline"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Bottom / Action Bar */}
                <div className="px-5 py-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => setViewingProject(project)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-teal-600 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Requirements
                  </button>

                  <div className="flex items-center gap-2">
                    {project.status === "Draft" && (
                      <button
                        onClick={() => publishProject(project.id)}
                        className="px-2.5 py-1 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors"
                        title="Publish to students"
                      >
                        Publish
                      </button>
                    )}

                    <Link
                      href={`/dashboard/projects/${project.id}`}
                      className="inline-flex items-center gap-1 text-xs font-medium text-teal-600 hover:text-teal-700 hover:underline"
                    >
                      View Details
                      <ArrowUpRight className="w-3 h-3" />
                    </Link>

                    {/* Quick Menu */}
                    <div className="relative group/menu">
                      <button
                        className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
                        aria-label="More options"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      <div className="absolute right-0 bottom-full mb-1 w-36 bg-white border border-slate-200 rounded-lg shadow-lg py-1 hidden group-hover/menu:block z-10">
                        <button
                          onClick={() => archiveProject(project.id)}
                          className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                        >
                          <Archive className="w-3.5 h-3.5 text-slate-400" />
                          {project.status === "Archived" ? "Restore" : "Archive"}
                        </button>
                        <button
                          onClick={() => setProjectToDelete(project)}
                          className="w-full text-left px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* View Requirements Modal */}
      {viewingProject && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 flex items-start justify-between bg-slate-50/50">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold ${
                      viewingProject.requirementsSource === "ai"
                        ? "bg-teal-50 text-teal-700 border border-teal-200"
                        : "bg-indigo-50 text-indigo-700 border border-indigo-200"
                    }`}
                  >
                    {viewingProject.requirementsSource === "ai" ? (
                      <>
                        <Sparkles className="w-3 h-3 text-teal-600" />
                        AI-Generated Specification
                      </>
                    ) : (
                      <>
                        <FileText className="w-3 h-3 text-indigo-600" />
                        PDF Document Rubric
                      </>
                    )}
                  </span>
                  <span className="text-xs text-slate-500">
                    Course: <strong className="text-slate-800">{viewingProject.courseCode}</strong>
                  </span>
                </div>
                <h2 className="text-lg font-bold text-slate-900">{viewingProject.title}</h2>
              </div>
              <button
                onClick={() => setViewingProject(null)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-sm text-slate-700 leading-relaxed font-normal">
              {viewingProject.requirementsSource === "ai" ? (
                viewingProject.requirementsContent ? (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 font-mono text-xs text-slate-800 whitespace-pre-wrap leading-relaxed max-h-[50vh] overflow-y-auto">
                    {viewingProject.requirementsContent}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200">
                    <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-slate-600 text-sm">No structured markdown text stored for this project.</p>
                  </div>
                )
              ) : (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center mx-auto border border-indigo-500/20">
                    <FileText className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 text-base">
                      {viewingProject.requirementsPdfName || "Course_Project_Specification.pdf"}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Size: {viewingProject.requirementsPdfSize || "1.2 MB"} • Uploaded via Faculty Portal
                    </p>
                  </div>
                  <div className="pt-2">
                    <a
                      href="#download"
                      onClick={(e) => {
                        e.preventDefault();
                        alert(`Downloading specification file: ${viewingProject.requirementsPdfName || "specification.pdf"}`);
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium transition-colors shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download Specification PDF
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between">
              {viewingProject.requirementsSource === "ai" && viewingProject.requirementsContent ? (
                <button
                  onClick={handleCopyRequirements}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
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
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <Link
                  href={`/dashboard/projects/${viewingProject.id}`}
                  className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-medium transition-colors"
                >
                  Open Full Detail Page
                </Link>
                <button
                  onClick={() => setViewingProject(null)}
                  className="px-4 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {projectToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 border border-rose-100">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Delete Project?</h3>
              <p className="text-sm text-slate-600 mt-1">
                Are you sure you want to delete <strong className="text-slate-800">&ldquo;{projectToDelete.title}&rdquo;</strong>?
                This action will remove the specification and unlink all student evaluations.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                onClick={() => setProjectToDelete(null)}
                className="px-4 py-2 border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteProject(projectToDelete.id);
                  setProjectToDelete(null);
                }}
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
