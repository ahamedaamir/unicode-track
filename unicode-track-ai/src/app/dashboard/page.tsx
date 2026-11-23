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
  Repeat
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
    setActiveRole,
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

  const activeProjectsCount = lecturerProjects.filter((p) => p.status === "Published").length;
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
            <span className="text-xs text-slate-500 font-medium">Fall 2026 Academic Term</span>
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
              ? "Supervise academic courses, author project specifications, and track student capstone teams."
              : "Manage university faculties, course catalogs, faculty credentials, and student accounts."}
          </p>
        </div>

        {/* View Switcher & Quick Actions */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1 text-xs">
            <button
              onClick={() => setActiveRole("admin")}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                isAdmin ? "bg-slate-900 text-white shadow-2xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Admin
            </button>
            <button
              onClick={() => setActiveRole("lecturer")}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                isLecturer ? "bg-slate-900 text-white shadow-2xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Lecturer
            </button>
            <button
              onClick={() => setActiveRole("student")}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                isStudent ? "bg-slate-900 text-white shadow-2xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Student
            </button>
          </div>

          {isStudent ? (
            <Button
              href="/dashboard/projects"
              variant="primary"
              size="sm"
              icon={<FolderGit2 className="w-4 h-4" />}
            >
              My Projects
            </Button>
          ) : isLecturer ? (
            <Button
              href="/dashboard/projects/create"
              variant="primary"
              size="sm"
              icon={<FilePlus2 className="w-4 h-4" />}
            >
              Create Project
            </Button>
          ) : (
            <Button
              href="/dashboard/departments"
              variant="primary"
              size="sm"
              icon={<Plus className="w-3.5 h-3.5" />}
            >
              Add Department
            </Button>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 1. STUDENT DASHBOARD VIEW                                      */}
      {/* ============================================================== */}
      {isStudent ? (
        <div className="space-y-6 sm:space-y-8">
          {/* 4 Student Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* Card 1: Enrolled Projects */}
            <Link
              href="/dashboard/projects"
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all duration-200 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Assigned Projects
                </span>
                <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center group-hover:scale-105 transition-transform border border-teal-100">
                  <FolderGit2 className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-[#0B1220] tracking-tight">
                  {studentProjects.length}
                </span>
                <span className="text-xs text-emerald-600 font-medium">Active workspaces</span>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-teal-700 font-semibold group-hover:text-teal-800">
                <span>View project workspaces</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>

            {/* Card 2: Academic Team */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  My Group Team
                </span>
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-xl font-extrabold text-[#0B1220] tracking-tight truncate max-w-[170px]">
                  {studentAssignedGroups[0]?.groupName ? studentAssignedGroups[0].groupName.split("—")[0].trim() : "Team Assigned"}
                </span>
                <span className="text-xs text-indigo-600 font-medium">Cohort Lead</span>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>{studentAssignedGroups[0]?.members.length || 4} collaborative members</span>
              </div>
            </div>

            {/* Card 3: Repository Commits */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Git Commits
                </span>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                  <Activity className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-[#0B1220] tracking-tight">
                  {totalCommits}
                </span>
                <span className="text-xs text-emerald-600 font-medium">Commits logged</span>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-emerald-700 font-semibold">
                <span>GitHub synchronized</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              </div>
            </div>

            {/* Card 4: Evaluation Progress */}
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
                <span className="text-3xl font-extrabold text-[#0B1220] tracking-tight">
                  88%
                </span>
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
        <div className="space-y-6 sm:space-y-8">
          {/* 4 Lecturer Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* Card 1: Assigned Courses */}
            <Link
              href="/dashboard/courses"
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all duration-200 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Assigned Courses
                </span>
                <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center group-hover:scale-105 transition-transform border border-teal-100">
                  <BookOpen className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-[#0B1220] tracking-tight">
                  {assignedCourses.length}
                </span>
                <span className="text-xs text-emerald-600 font-medium">Syllabus units</span>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-teal-700 font-semibold group-hover:text-teal-800">
                <span>View my courses</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>

            {/* Card 2: Active Projects */}
            <Link
              href="/dashboard/projects"
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all duration-200 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Active Projects
                </span>
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform border border-indigo-100">
                  <FolderGit2 className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-[#0B1220] tracking-tight">
                  {activeProjectsCount}
                </span>
                <span className="text-xs text-slate-500 font-medium">Published</span>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-indigo-700 font-semibold group-hover:text-indigo-800">
                <span>Manage projects</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>

            {/* Card 3: Student Teams */}
            <Link
              href="/dashboard/teams"
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all duration-200 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Student Teams
                </span>
                <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center group-hover:scale-105 transition-transform border border-sky-100">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-[#0B1220] tracking-tight">
                  14
                </span>
                <span className="text-xs text-emerald-600 font-medium">Formed & active</span>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-sky-700 font-semibold group-hover:text-sky-800">
                <span>View team roster</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>

            {/* Card 4: Pending Evaluations */}
            <Link
              href="/dashboard/evaluation"
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all duration-200 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Pending Evaluations
                </span>
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform border border-amber-100">
                  <Sparkles className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-[#0B1220] tracking-tight">
                  6
                </span>
                <span className="text-xs text-amber-700 font-medium">Submissions</span>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-amber-700 font-semibold group-hover:text-amber-800">
                <span>Review submissions</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          </div>

          {/* 4 Detail Panels Required for Lecturer Overview */}
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
                  All ({lecturerProjects.length}) <ArrowRight className="w-3 h-3" />
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
                        {proj.status === "Published" ? (
                          <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                            Published
                          </span>
                        ) : (
                          <span className="text-[10px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                            Draft
                          </span>
                        )}
                      </div>
                      <p className="font-bold text-slate-900 text-xs truncate">
                        {proj.title}
                      </p>
                      <p className="text-[11px] text-slate-500 line-clamp-1">
                        {proj.description}
                      </p>
                    </div>

                    <span className="text-[10px] font-semibold text-slate-400 shrink-0">
                      {proj.createdAt}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Panel 2: Upcoming Project Deadlines */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Clock className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-sm text-[#0B1220]">Upcoming Project Deadlines</h3>
                </div>
                <span className="text-xs text-slate-400 font-medium">Calendar view</span>
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

            {/* Panel 3: Projects Assigned to Lecturer's Courses */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-sm text-[#0B1220]">Assigned Courses & Syllabus</h3>
                </div>
                <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                  Authorized Faculty
                </span>
              </div>

              <div className="space-y-2.5">
                {assignedCourses.map((crs) => {
                  const courseProjects = projects.filter((p) => p.courseCode === crs.code);
                  return (
                    <div
                      key={crs.id}
                      className="p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 text-[10px]">
                            {crs.code}
                          </span>
                          <span className="font-bold text-slate-900 text-xs truncate">
                            {crs.name}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 block mt-1">
                          {courseProjects.length} academic project{courseProjects.length === 1 ? "" : "s"} provisioned
                        </span>
                      </div>

                      <Button
                        href="/dashboard/projects/create"
                        variant="outline"
                        size="sm"
                        className="text-[11px] shrink-0"
                      >
                        + Project
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Panel 4: Recent Student Activity */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                    <Activity className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-sm text-[#0B1220]">Recent Student Activity</h3>
                </div>
                <span className="text-xs text-slate-400">Live feed</span>
              </div>

              <div className="space-y-3">
                {[
                  {
                    student: "Alex Chen (Team Alpha)",
                    action: "committed 4 new commits to GitHub repository",
                    project: "University Event Management System",
                    time: "25 mins ago",
                    icon: "git",
                  },
                  {
                    student: "Sarah Lin (Team Beta)",
                    action: "submitted Milestone 1 Architecture PDF",
                    project: "Distributed Microservices Architecture",
                    time: "1 hour ago",
                    icon: "pdf",
                  },
                  {
                    student: "Marcus Doe",
                    action: "joined Capstone Team Delta",
                    project: "CS492: Capstone Project",
                    time: "3 hours ago",
                    icon: "user",
                  },
                  {
                    student: "Priya Patel",
                    action: "linked repository unicodetrack/event-service",
                    project: "E-Business Architecture",
                    time: "Yesterday",
                    icon: "git",
                  },
                ].map((act, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs">
                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-slate-700 leading-snug">
                        <strong className="text-slate-900">{act.student}</strong> {act.action} on{" "}
                        <span className="font-medium text-teal-700">{act.project}</span>.
                      </p>
                      <span className="text-[10px] text-slate-400 font-medium">{act.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ============================================================== */
        /* 2. UNIVERSITY ADMINISTRATOR DASHBOARD VIEW                     */
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
