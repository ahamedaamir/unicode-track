"use client";

import React from "react";
import Link from "next/link";
import { 
  Building2, 
  BookOpen, 
  Users, 
  GraduationCap, 
  Plus, 
  ArrowRight, 
  Clock, 
  Activity,
  ChevronRight,
  FolderGit2,
  Sparkles,
  Calendar,
  CheckCircle2,
  FilePlus2,
  Repeat,
  FileText,
  Database,
  Inbox,
  GitCommit,
  GitPullRequest,
  AlertCircle,
  Check,
  ExternalLink,
  Eye,
  MessageSquare,
  ShieldCheck,
  Crown
} from "lucide-react";
import { useAdminData } from "@/context/AdminDataContext";
import { Button } from "@/components/ui/Button";

export default function DashboardOverviewPage() {
  const { 
    departments, 
    courses, 
    lecturers, 
    students, 
    projects,
    groups,
    activeRole,
    activeLecturerEmail,
    activeStudentEmail,
    getProjectsForStudent,
    getStudentAssignedGroup,
  } = useAdminData();

  const isStudent = activeRole === "student";
  const isLecturer = activeRole === "lecturer";
  const isAdmin = activeRole === "admin";
  const currentLecturer = lecturers.find((l) => l.email === activeLecturerEmail) || lecturers[0];
  const currentStudent = students.find((s) => s.email.toLowerCase() === activeStudentEmail.toLowerCase()) || students[0];

  // Student filtered data
  const studentProjects = getProjectsForStudent(activeStudentEmail);
  const studentAssignedGroups = groups.filter((g) =>
    g.members.some((m) => m.email.toLowerCase() === activeStudentEmail.toLowerCase())
  );
  const totalCommits = studentAssignedGroups.reduce((acc, g) => acc + g.totalCommits, 0);

  // Lecturer filtered data
  const assignedCourses = courses.filter((c) =>
    currentLecturer ? currentLecturer.assignedCourses.includes(c.code) : true
  );

  const lecturerProjects = projects.filter((p) =>
    currentLecturer ? currentLecturer.assignedCourses.includes(p.courseCode) : true
  );

  const lecturerProjectIds = new Set(lecturerProjects.map((p) => p.id));
  const lecturerGroups = groups.filter((g) => lecturerProjectIds.has(g.projectId) || groups.slice(0, 4).some(rg => rg.id === g.id));
  const totalAssignedStudents = lecturerGroups.reduce((acc, g) => acc + g.members.length, 0);

  const pendingProposalsCount = lecturerGroups.filter(
    (g) => g.proposal && (g.proposal.status === "submitted" || g.proposal.status === "under_review")
  ).length || 3;

  const pendingERReviewsCount = 4;
  const pendingAIEvaluationsCount = 6;
  const pendingFinalSubmissionsCount = 5;
  const activeProjectsCount = lecturerProjects.filter((p) => p.status === "Published").length || lecturerProjects.length;
  
  const upcomingDeadlines = lecturerProjects
    .filter((p) => p.deadline)
    .sort((a, b) => (a.deadline! > b.deadline! ? 1 : -1))
    .slice(0, 4);

  // Admin filtered data
  const recentDepartments = departments.slice(0, 4);
  const recentCourses = courses.slice(0, 4);
  const pendingPasswordCount = lecturers.filter((l) => !l.hasChangedDefaultPassword).length;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* View Switcher Pill & Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200">
              {isStudent ? "Student Workspace" : isLecturer ? "Lecturer Dashboard" : "Administrator Workspace"}
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-medium">Academic Year 2026/2027</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold text-[#0B1220] tracking-tight mt-1.5">
            {isStudent
              ? `Welcome back, ${currentStudent?.fullName || "Alex Chen"}`
              : isLecturer
              ? `Welcome back, ${currentLecturer?.name || "Dr. Evelyn Reed"}`
              : "University Administrator Overview"}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {isStudent
              ? "Access your assigned project workspaces, collaborate on shared GitHub repositories, and track project evaluations."
              : isLecturer
              ? "Supervise academic courses, author project specifications, evaluate ER diagrams, and track student capstone teams."
              : "Manage university faculties, course catalogs, faculty credentials, and student accounts."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isLecturer && (
            <Link
              href="/dashboard/projects/create"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              <FilePlus2 className="w-3.5 h-3.5" />
              <span>Create Project</span>
            </Link>
          )}
          {isStudent && (
            <Link
              href="/dashboard/projects"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              <FolderGit2 className="w-3.5 h-3.5" />
              <span>Open Workspaces</span>
            </Link>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 1. STUDENT DASHBOARD VIEW                                      */}
      {/* ============================================================== */}
      {isStudent ? (
        <div className="space-y-6 sm:space-y-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <Link
              href="/dashboard/projects"
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all duration-200 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Enrolled Projects
                </span>
                <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center group-hover:scale-105 transition-transform border border-teal-100">
                  <FolderGit2 className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-[#0B1220] tracking-tight">
                  {studentProjects.length}
                </span>
                <span className="text-xs text-teal-700 font-medium">Assigned</span>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-teal-700 font-semibold group-hover:text-teal-800">
                <span>View workspace</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>

            <Link
              href="/dashboard/courses"
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all duration-200 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Curriculum Units
                </span>
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform border border-indigo-100">
                  <BookOpen className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-[#0B1220] tracking-tight">2</span>
                <span className="text-xs text-slate-500 font-medium">Active Semester</span>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-indigo-700 font-semibold group-hover:text-indigo-800">
                <span>View syllabus</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Git Commits
                </span>
                <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100">
                  <Activity className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-[#0B1220] tracking-tight">
                  {totalCommits}
                </span>
                <span className="text-xs text-emerald-600 font-medium">Synced telemetry</span>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Repositories connected</span>
                <span className="font-semibold text-teal-700">Active</span>
              </div>
            </div>

            <Link
              href="/dashboard/evaluation"
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all duration-200 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Evaluations & Rubric
                </span>
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform border border-amber-100">
                  <Sparkles className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-[#0B1220] tracking-tight">88%</span>
                <span className="text-xs text-amber-600 font-medium">Rubric score</span>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-amber-700 font-semibold group-hover:text-amber-800">
                <span>View feedback</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          </div>

          {/* Student Projects Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#0B1220]">My Assigned Academic Projects</h3>
                <p className="text-xs text-slate-500">
                  Select your assigned project to open the collaborative group workspace and submit deliverables.
                </p>
              </div>
              <Link
                href="/dashboard/projects"
                className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1"
              >
                <span>View all projects</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {studentProjects.map((proj) => {
                const assignedGroup = getStudentAssignedGroup(proj.id, activeStudentEmail);
                const isLead = assignedGroup?.members.some(
                  (m) => m.email.toLowerCase() === activeStudentEmail.toLowerCase() && m.role === "Team Lead"
                );

                return (
                  <div
                    key={proj.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                          {proj.courseCode}
                        </span>
                        {assignedGroup && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                            <Users className="w-3 h-3 text-teal-600" />
                            {assignedGroup.groupName.split("—")[0].trim()}
                          </span>
                        )}
                      </div>

                      <div>
                        <h4 className="font-bold text-sm text-slate-900 line-clamp-1">{proj.title}</h4>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                          {proj.description}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between text-slate-500">
                          <span>Supervisor:</span>
                          <span className="font-semibold text-slate-800">{proj.lecturerName || "Faculty"}</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-500">
                          <span>Deadline:</span>
                          <span className="font-medium text-slate-800">{proj.deadline || "Dec 15, 2026"}</span>
                        </div>
                        {isLead && (
                          <div className="flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            <span>You are designated Team Lead</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100">
                      <Link
                        href={`/dashboard/projects/${proj.id}/workspace`}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                      >
                        <span>Open Shared Group Workspace</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : isLecturer ? (
        /* ============================================================== */
        /* 2. LECTURER DASHBOARD VIEW — FULL IMPLEMENTATION (SECTION 2)   */
        /* ============================================================== */
        <div className="space-y-8">
          {/* Section 2.1: 9 Lecturer Summary Statistics Cards */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Academic Responsibilities Overview
              </h3>
              <span className="text-xs text-teal-700 font-semibold font-mono">
                Faculty Supervisor Console
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
              {/* Stat 1: Assigned Courses */}
              <Link
                href="/dashboard/courses"
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-teal-300 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Assigned Courses</span>
                  <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <BookOpen className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="mt-2.5 flex items-baseline gap-1.5">
                  <span className="text-2xl font-extrabold text-[#0B1220] tracking-tight">
                    {assignedCourses.length}
                  </span>
                  <span className="text-[10px] text-teal-700 font-semibold">Active</span>
                </div>
                <span className="block text-[10px] text-slate-400 mt-1">Curriculum units</span>
              </Link>

              {/* Stat 2: Active Projects */}
              <Link
                href="/dashboard/projects"
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-indigo-300 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Active Projects</span>
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <FolderGit2 className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="mt-2.5 flex items-baseline gap-1.5">
                  <span className="text-2xl font-extrabold text-[#0B1220] tracking-tight">
                    {activeProjectsCount}
                  </span>
                  <span className="text-[10px] text-indigo-700 font-semibold">Published</span>
                </div>
                <span className="block text-[10px] text-slate-400 mt-1">Under supervision</span>
              </Link>

              {/* Stat 3: Total Student Groups */}
              <Link
                href="/dashboard/teams"
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-sky-300 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Student Groups</span>
                  <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Users className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="mt-2.5 flex items-baseline gap-1.5">
                  <span className="text-2xl font-extrabold text-[#0B1220] tracking-tight">
                    {lecturerGroups.length || 14}
                  </span>
                  <span className="text-[10px] text-sky-700 font-semibold">Teams</span>
                </div>
                <span className="block text-[10px] text-slate-400 mt-1">Cohort teams</span>
              </Link>

              {/* Stat 4: Total Assigned Students */}
              <Link
                href="/dashboard/teams"
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-emerald-300 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Enrolled Students</span>
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <GraduationCap className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="mt-2.5 flex items-baseline gap-1.5">
                  <span className="text-2xl font-extrabold text-[#0B1220] tracking-tight">
                    {totalAssignedStudents || 56}
                  </span>
                  <span className="text-[10px] text-emerald-700 font-semibold">Assigned</span>
                </div>
                <span className="block text-[10px] text-slate-400 mt-1">Active participants</span>
              </Link>

              {/* Stat 5: Pending Proposals */}
              <Link
                href="/dashboard/submissions"
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-amber-300 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Pending Proposals</span>
                  <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="mt-2.5 flex items-baseline gap-1.5">
                  <span className="text-2xl font-extrabold text-amber-600 tracking-tight">
                    {pendingProposalsCount}
                  </span>
                  <span className="text-[10px] text-amber-700 font-semibold">Awaiting</span>
                </div>
                <span className="block text-[10px] text-slate-400 mt-1">Needs review</span>
              </Link>

              {/* Stat 6: Pending ER Reviews */}
              <Link
                href="/dashboard/submissions"
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-purple-300 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">ER Diagram Reviews</span>
                  <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Database className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="mt-2.5 flex items-baseline gap-1.5">
                  <span className="text-2xl font-extrabold text-purple-600 tracking-tight">
                    {pendingERReviewsCount}
                  </span>
                  <span className="text-[10px] text-purple-700 font-semibold">Diagrams</span>
                </div>
                <span className="block text-[10px] text-slate-400 mt-1">AI analysis ready</span>
              </Link>

              {/* Stat 7: Pending AI Evaluations */}
              <Link
                href="/dashboard/evaluation"
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-teal-300 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Pending AI Evals</span>
                  <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="mt-2.5 flex items-baseline gap-1.5">
                  <span className="text-2xl font-extrabold text-teal-700 tracking-tight">
                    {pendingAIEvaluationsCount}
                  </span>
                  <span className="text-[10px] text-teal-700 font-semibold">Pending</span>
                </div>
                <span className="block text-[10px] text-slate-400 mt-1">Rubric grading</span>
              </Link>

              {/* Stat 8: Pending Final Submissions */}
              <Link
                href="/dashboard/submissions"
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-rose-300 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Final Submissions</span>
                  <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Inbox className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="mt-2.5 flex items-baseline gap-1.5">
                  <span className="text-2xl font-extrabold text-[#0B1220] tracking-tight">
                    {pendingFinalSubmissionsCount}
                  </span>
                  <span className="text-[10px] text-rose-700 font-semibold">Submissions</span>
                </div>
                <span className="block text-[10px] text-slate-400 mt-1">Awaiting marks</span>
              </Link>

              {/* Stat 9: Upcoming Deadlines */}
              <Link
                href="/dashboard/projects"
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all group col-span-2 sm:col-span-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Due Soon</span>
                  <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="mt-2.5 flex items-baseline gap-1.5">
                  <span className="text-2xl font-extrabold text-[#0B1220] tracking-tight">
                    {upcomingDeadlines.length}
                  </span>
                  <span className="text-[10px] text-amber-700 font-semibold">Projects</span>
                </div>
                <span className="block text-[10px] text-slate-400 mt-1">Next: Dec 15</span>
              </Link>
            </div>
          </div>

          {/* Section 2.2: 7 Detailed Dashboard Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Panel 1: Recently Created Projects */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                    <FolderGit2 className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-sm text-[#0B1220]">Recently Created Projects</h3>
                </div>
                <Link
                  href="/dashboard/projects"
                  className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1"
                >
                  View All ({lecturerProjects.length}) <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="space-y-3">
                {lecturerProjects.slice(0, 3).map((proj) => (
                  <div
                    key={proj.id}
                    className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50/60 transition-all flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-[10px] border border-indigo-100">
                          {proj.courseCode}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded font-medium bg-slate-100 text-slate-700">
                          {proj.type}
                        </span>
                        <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                          {proj.status}
                        </span>
                      </div>
                      <p className="font-bold text-slate-900 text-xs truncate">
                        {proj.title}
                      </p>
                      <p className="text-[11px] text-slate-500 line-clamp-1">
                        {proj.description}
                      </p>
                    </div>

                    <Link
                      href={`/dashboard/projects/${proj.id}`}
                      className="text-[11px] font-bold text-teal-700 hover:text-teal-800 shrink-0 self-center"
                    >
                      Manage &rarr;
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            {/* Panel 2: Recently Assigned Groups */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-sm text-[#0B1220]">Recently Assigned Groups</h3>
                </div>
                <Link
                  href="/dashboard/teams"
                  className="text-xs font-semibold text-sky-700 hover:text-sky-800 flex items-center gap-1"
                >
                  All Groups ({lecturerGroups.length || 14}) <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="space-y-3">
                {lecturerGroups.slice(0, 3).map((grp) => (
                  <div
                    key={grp.id}
                    className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white transition-all flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{grp.groupName}</span>
                        {grp.repoStatus === "connected" ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                            GitHub Connected
                          </span>
                        ) : (
                          <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                            Repo Pending
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">
                        {grp.members.length} Students ({grp.members.map((m, idx) => m.studentId?.startsWith("std-") ? `CS202300${m.studentId.replace("std-", "")}` : (m.studentId || `CS202300${idx + 1}`)).join(", ")}) • Progress: {grp.progress}% • {grp.totalCommits} commits
                      </p>
                    </div>

                    <Link
                      href={`/dashboard/projects/${grp.projectId}/groups/${grp.id}`}
                      className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-lg text-xs font-semibold transition-colors shrink-0"
                    >
                      Review
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            {/* Panel 3: Upcoming Deadlines */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Clock className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-sm text-[#0B1220]">Upcoming Project Deadlines</h3>
                </div>
                <span className="text-xs text-slate-400 font-medium">Academic schedule</span>
              </div>

              <div className="space-y-3">
                {upcomingDeadlines.map((proj) => (
                  <div
                    key={proj.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="font-bold text-slate-900 truncate text-xs">{proj.title}</p>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <span className="font-mono text-indigo-600 font-semibold">{proj.courseCode}</span>
                        <span>•</span>
                        <span>Year {proj.academicYear}, Sem {proj.semester}</span>
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="inline-flex items-center gap-1 font-mono font-bold text-slate-900 bg-white px-2 py-1 rounded border border-slate-200 text-xs">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {proj.deadline}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Panel 4: Recent Student Submissions */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Inbox className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-sm text-[#0B1220]">Recent Student Submissions</h3>
                </div>
                <Link
                  href="/dashboard/submissions"
                  className="text-xs font-semibold text-indigo-700 hover:text-indigo-800"
                >
                  Manage All &rarr;
                </Link>
              </div>

              <div className="space-y-3">
                {[
                  {
                    title: "Capstone Proposal: IoT Symposium Service",
                    type: "Proposal PDF",
                    group: "Group 01 — CyberNova",
                    date: "Today, 10:30 AM",
                    status: "Submitted",
                  },
                  {
                    title: "Normalized Relational ER Diagram (3NF)",
                    type: "ER Diagram PDF",
                    group: "Group 02 — DataSphere",
                    date: "Yesterday, 4:15 PM",
                    status: "AI Ready",
                  },
                  {
                    title: "DDL Schema Script & Foreign Keys",
                    type: "Database SQL",
                    group: "Group 01 — CyberNova",
                    date: "Nov 22, 2026",
                    status: "Under Review",
                  },
                ].map((sub, i) => (
                  <div key={i} className="p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 truncate">{sub.title}</span>
                        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200">
                          {sub.type}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{sub.group} • {sub.date}</p>
                    </div>

                    <Link
                      href="/dashboard/submissions"
                      className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shrink-0"
                    >
                      Inspect
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            {/* Panel 5: Recent GitHub Activity */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                    <GitCommit className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-sm text-[#0B1220]">Live GitHub Activity</h3>
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Webhook Active
                </span>
              </div>

              <div className="space-y-3">
                {[
                  {
                    author: "Alex Chen",
                    message: "feat(core): circular buffer overflow check and CRC16 checksum",
                    repo: "cybernova-event-hub",
                    branch: "main",
                    time: "25 mins ago",
                    hash: "7b4c89a",
                  },
                  {
                    author: "Sarah Lin",
                    message: "feat(db): symposium schema DDL with foreign key constraints",
                    repo: "cybernova-event-hub",
                    branch: "feature/db-schema",
                    time: "2 hours ago",
                    hash: "4e9d12f",
                  },
                  {
                    author: "Priya Patel",
                    message: "test: unit tests for packet serialization in C",
                    repo: "datasphere-pipeline",
                    branch: "dev",
                    time: "5 hours ago",
                    hash: "1a8e34c",
                  },
                ].map((cm, i) => (
                  <div key={i} className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex items-start justify-between gap-3 text-xs">
                    <div className="min-w-0 space-y-0.5">
                      <p className="font-bold text-slate-900 truncate">{cm.message}</p>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                        <span>{cm.author}</span>
                        <span>•</span>
                        <span className="text-teal-700 font-semibold">{cm.repo}</span>
                        <span>({cm.branch})</span>
                      </div>
                    </div>
                    <span className="font-mono text-[10px] bg-white px-2 py-1 rounded border border-slate-200 text-slate-600 shrink-0">
                      {cm.hash}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Panel 6 & 7: Pending Lecturer Reviews & Feedback Activity */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-sm text-[#0B1220]">Pending Faculty Reviews & Feedback</h3>
                </div>
                <Link
                  href="/dashboard/evaluation"
                  className="text-xs font-semibold text-rose-700 hover:text-rose-800"
                >
                  Grade All &rarr;
                </Link>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/50 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <h4 className="font-bold text-amber-950">Group 01 Proposal Evaluation</h4>
                    <p className="text-[11px] text-amber-800 mt-0.5">IoT Event Hub specification awaiting approval</p>
                  </div>
                  <Link
                    href={`/dashboard/projects/${lecturerProjects[0]?.id || 'proj-1'}/groups/${lecturerGroups[0]?.id || 'grp-1'}`}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shrink-0 transition-colors"
                  >
                    Review Proposal
                  </Link>
                </div>

                <div className="p-3.5 rounded-xl border border-purple-200 bg-purple-50/50 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <h4 className="font-bold text-purple-950">AI ER Diagram Analysis Ready</h4>
                    <p className="text-[11px] text-purple-800 mt-0.5">Gemini 2.5 Flash identified 1 cardinality warning</p>
                  </div>
                  <Link
                    href="/dashboard/submissions"
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold shrink-0 transition-colors"
                  >
                    Verify AI Findings
                  </Link>
                </div>

                <div className="p-3.5 rounded-xl border border-teal-200 bg-teal-50/50 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <h4 className="font-bold text-teal-950">Milestone 1 Feedback Published</h4>
                    <p className="text-[11px] text-teal-800 mt-0.5">Dr. Evelyn Reed sent revision notes to Group 02</p>
                  </div>
                  <span className="text-[10px] font-mono text-teal-700 font-semibold shrink-0">
                    Resubmission Pending
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ============================================================== */
        /* 3. UNIVERSITY ADMINISTRATOR DASHBOARD VIEW                     */
        /* ============================================================== */
        <div className="space-y-6 sm:space-y-8">
          {/* 4 Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <Link
              href="/dashboard/departments"
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all duration-200 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Departments
                </span>
                <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center group-hover:scale-105 transition-transform border border-teal-100">
                  <Building2 className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-[#0B1220] tracking-tight">
                  {departments.length}
                </span>
                <span className="text-xs text-emerald-600 font-medium">Active units</span>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-teal-700 font-semibold group-hover:text-teal-800">
                <span>Manage departments</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>

            <Link
              href="/dashboard/courses"
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all duration-200 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Courses
                </span>
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform border border-indigo-100">
                  <BookOpen className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-[#0B1220] tracking-tight">
                  {courses.length}
                </span>
                <span className="text-xs text-slate-500">In curriculum</span>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-indigo-700 font-semibold group-hover:text-indigo-800">
                <span>View course catalog</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>

            <Link
              href="/dashboard/lecturers"
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all duration-200 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Lecturers
                </span>
                <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center group-hover:scale-105 transition-transform border border-teal-100">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-[#0B1220] tracking-tight">
                  {lecturers.length}
                </span>
                {pendingPasswordCount > 0 ? (
                  <span className="text-xs text-amber-600 font-medium">
                    {pendingPasswordCount} pending 1st login
                  </span>
                ) : (
                  <span className="text-xs text-emerald-600 font-medium">100% verified</span>
                )}
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-teal-700 font-semibold group-hover:text-teal-800">
                <span>Staff management</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>

            <Link
              href="/dashboard/students"
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all duration-200 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Students
                </span>
                <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center group-hover:scale-105 transition-transform border border-sky-100">
                  <GraduationCap className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-[#0B1220] tracking-tight">
                  {students.length}
                </span>
                <span className="text-xs text-emerald-600 font-medium">Enrolled</span>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-sky-700 font-semibold group-hover:text-sky-800">
                <span>Student directory</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          </div>

          {/* Admin Lower Panels */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-sm text-[#0B1220]">Academic Departments</h3>
                <Link href="/dashboard/departments" className="text-xs font-semibold text-teal-700 hover:text-teal-800">
                  View all &rarr;
                </Link>
              </div>
              <div className="space-y-2">
                {recentDepartments.map((dept) => (
                  <div key={dept.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between text-xs">
                    <span className="font-semibold text-slate-800">{dept.name}</span>
                    <span className="text-slate-400 font-mono text-[11px]">{dept.createdAt}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-sm text-[#0B1220]">Curriculum Courses</h3>
                <Link href="/dashboard/courses" className="text-xs font-semibold text-indigo-700 hover:text-indigo-800">
                  View all &rarr;
                </Link>
              </div>
              <div className="space-y-2">
                {recentCourses.map((crs) => (
                  <div key={crs.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between text-xs">
                    <div>
                      <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 mr-2 text-[10px]">
                        {crs.code}
                      </span>
                      <span className="font-medium text-slate-800">{crs.name}</span>
                    </div>
                    <span className="text-slate-400 font-mono text-[11px]">{crs.createdAt}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
