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
  const lecturerGroups = groups.filter((g) => lecturerProjectIds.has(g.projectId));
  const totalAssignedStudents = lecturerGroups.reduce((acc, g) => acc + g.members.length, 0);

  const pendingProposalsCount = lecturerGroups.filter(
    (g) => g.proposal && (g.proposal.status === "submitted" || g.proposal.status === "under_review")
  ).length;

  const activeProjectsCount = lecturerProjects.filter((p) => p.status === "Published").length;

  const toEvaluateCount = React.useMemo(() => {
    const endedProjects = lecturerProjects.filter((p) => {
      if (p.deadline) {
        const d = new Date(p.deadline).getTime();
        return !isNaN(d) && d < Date.now();
      }
      return false;
    });

    const submittedGroups = lecturerGroups.filter((g) => 
      g.proposalStatus === "submitted" || 
      g.repoStatus === "connected" ||
      g.proposal?.status === "submitted"
    );

    return Math.max(submittedGroups.length, endedProjects.length);
  }, [lecturerProjects, lecturerGroups]);

  const pendingAIEvaluationsCount = toEvaluateCount;

  const pendingERReviewsCount = React.useMemo(() => {
    return lecturerGroups.filter((g) => g.repoStatus === "connected" && g.evaluationStatus !== "published").length;
  }, [lecturerGroups]);

  const pendingFinalSubmissionsCount = React.useMemo(() => {
    return lecturerGroups.filter((g) => g.proposalStatus === "submitted" || g.proposalStatus === "under_review").length;
  }, [lecturerGroups]);
  
  const upcomingDeadlines = lecturerProjects
    .filter((p) => p.deadline)
    .sort((a, b) => (a.deadline! > b.deadline! ? 1 : -1))
    .slice(0, 4);

  // Admin filtered data
  const recentDepartments = departments.slice(0, 4);
  const recentCourses = courses.slice(0, 4);
  const pendingPasswordCount = lecturers.filter((l) => !l.hasChangedDefaultPassword).length;

  const lecturerDisplayName = React.useMemo(() => {
    return currentLecturer?.name || (activeLecturerEmail ? activeLecturerEmail.split("@")[0] : "Lecturer");
  }, [currentLecturer, activeLecturerEmail]);

  const recentProjectsList = React.useMemo(() => {
    return lecturerProjects.slice(0, 4).map((p) => ({
      id: p.id,
      title: p.title,
      sub: `${p.courseCode} · ${p.type === "Group Project" || p.projectType === "group" ? "Group" : "Individual"}`,
      status: p.status || "Draft",
    }));
  }, [lecturerProjects]);

  const recentGroupsList = React.useMemo(() => {
    return lecturerGroups.slice(0, 4).map((g) => ({
      id: g.id,
      name: g.groupName || `Group 0${g.groupNumber}`,
      progress: g.progress || 0,
    }));
  }, [lecturerGroups]);

  if (isLecturer) {
    return (
      <div className="space-y-5 max-w-7xl mx-auto">
        {/* Academic year and Welcome banner */}
        <div className="relative overflow-hidden bg-card border border-border rounded-[16px] p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-accent/10 blur-2xl pointer-events-none" />
          <div className="relative z-10">
            <span className="text-xs text-muted-foreground font-medium block mb-1.5">
              Academic year 2026/2027
            </span>
            <h1 suppressHydrationWarning className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
              Welcome back, {lecturerDisplayName}
            </h1>
          </div>
          <div className="relative z-10 flex items-center gap-2.5">
            <Link
              href="/dashboard/quizzes"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-muted hover:bg-[#242426] border border-border text-foreground rounded-[10px] text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer"
            >
              Quizzes
            </Link>
            <Link
              href="/dashboard/projects/create"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-foreground hover:bg-neutral-200 text-background rounded-[10px] text-xs sm:text-sm font-semibold shadow-sm transition-all shrink-0 cursor-pointer"
            >
              + Create project
            </Link>
          </div>
        </div>

        {/* 3 Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
          <div className="bg-card border border-border rounded-[16px] p-4 sm:p-5">
            <span className="text-xs text-muted-foreground font-medium block truncate">Courses</span>
            <span className="text-[36px] font-semibold font-mono tabular-nums text-foreground block mt-1.5 leading-none">
              {assignedCourses.length}
            </span>
          </div>

          <div className="bg-card border border-border rounded-[16px] p-4 sm:p-5">
            <span className="text-xs text-muted-foreground font-medium block truncate">Active projects</span>
            <span className="text-[36px] font-semibold font-mono tabular-nums text-foreground block mt-1.5 leading-none">
              {activeProjectsCount}
            </span>
          </div>

          <div className="bg-card border border-border rounded-[16px] p-4 sm:p-5">
            <span className="text-xs text-muted-foreground font-medium block truncate">To evaluate</span>
            <span className="text-[36px] font-semibold font-mono tabular-nums text-foreground block mt-1.5 leading-none">
              {toEvaluateCount}
            </span>
          </div>
        </div>

        {/* Two-Column Section: Recent projects & Student groups */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left: Recent projects */}
          <div className="bg-card border border-border rounded-[16px] p-5 sm:p-6 flex flex-col min-h-[220px]">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <h3 className="text-base font-bold text-foreground">Recent projects</h3>
              <Link
                href="/dashboard/projects"
                className="text-xs text-accent hover:underline font-medium transition-colors"
              >
                View all →
              </Link>
            </div>

            {recentProjectsList.length === 0 ? (
              <div className="py-10 text-center flex flex-col items-center justify-center flex-1">
                <div className="w-10 h-10 rounded-[10px] bg-accent-soft border border-accent-border flex items-center justify-center text-accent mb-2.5">
                  <FolderGit2 className="w-5 h-5" />
                </div>
                <p className="text-sm font-semibold text-foreground">No active projects yet</p>
                <p className="text-xs text-muted-foreground max-w-xs mt-1">
                  Create and publish coursework projects for your assigned batches.
                </p>
                <Link
                  href="/dashboard/projects/create"
                  className="mt-3.5 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-foreground hover:bg-neutral-200 text-background font-semibold text-xs rounded-[10px] transition-all cursor-pointer"
                >
                  + Create project
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-border flex-1">
                {recentProjectsList.map((p) => (
                  <div key={p.id} className="py-3.5 flex items-center justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-semibold text-foreground">{p.title}</h4>
                      <span className="text-xs text-muted-foreground mt-0.5 block font-mono">{p.sub}</span>
                    </div>
                    <span
                      className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                        p.status === "Published"
                          ? "bg-success-soft text-success border border-accent-border"
                          : "bg-muted text-muted-foreground border border-border"
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Student groups */}
          <div className="bg-card border border-border rounded-[16px] p-5 sm:p-6 flex flex-col min-h-[220px]">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <h3 className="text-base font-bold text-foreground">Student groups</h3>
              <Link
                href="/dashboard/teams"
                className="text-xs text-accent hover:underline font-medium transition-colors"
              >
                View all →
              </Link>
            </div>

            {recentGroupsList.length === 0 ? (
              <div className="py-10 text-center flex flex-col items-center justify-center flex-1">
                <div className="w-10 h-10 rounded-[10px] bg-muted border border-border flex items-center justify-center text-muted-foreground mb-2.5">
                  <Users className="w-5 h-5" />
                </div>
                <p className="text-sm font-semibold text-foreground">No student groups yet</p>
                <p className="text-xs text-muted-foreground max-w-xs mt-1">
                  Enrolled groups will be listed here once assigned to active projects.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border flex-1">
                {recentGroupsList.map((g) => (
                  <div key={g.id} className="py-3.5 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-sm font-semibold text-foreground">{g.name}</span>
                      <span className="text-muted-foreground font-mono font-medium">{g.progress}%</span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-linear-to-r from-accent-deep to-accent rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(45,212,191,0.2)]"
                        style={{ width: `${g.progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* View Switcher Pill & Welcome Banner */}
      <div className="relative overflow-hidden bg-card p-6 sm:p-7 rounded-[16px] border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-accent/10 blur-2xl pointer-events-none" />
        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-accent-soft text-accent border border-accent-border">
              {isStudent ? "Student Workspace" : isLecturer ? "Lecturer Dashboard" : "Administrator Workspace"}
            </span>
            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground font-medium">Academic Year 2026/2027</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight mt-2">
            {isStudent
              ? `Welcome back, ${currentStudent?.fullName || "Alex Chen"}`
              : isLecturer
              ? `Welcome back, ${currentLecturer?.name || "Lecturer"}`
              : "University Administrator Overview"}
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-2xl leading-relaxed">
            {isStudent
              ? "Access your assigned project workspaces, collaborate on shared GitHub repositories, and track project evaluations."
              : isLecturer
              ? "Supervise academic courses, author project specifications, evaluate ER diagrams, and track student capstone teams."
              : "Manage university faculties, course catalogs, faculty credentials, and student accounts."}
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-2">
          {isLecturer && (
            <Link
              href="/dashboard/projects/create"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-foreground hover:bg-neutral-200 text-background rounded-[10px] text-xs font-semibold transition-all shadow-sm cursor-pointer"
            >
              <FilePlus2 className="w-3.5 h-3.5" />
              <span>Create Project</span>
            </Link>
          )}
          {isStudent && (
            <Link
              href="/dashboard/projects"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-foreground hover:bg-neutral-200 text-background rounded-[10px] text-xs font-semibold transition-all shadow-sm cursor-pointer"
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
              className="bg-card p-5 rounded-[16px] border border-border hover:border-accent/40 transition-all duration-200 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Enrolled Projects
                </span>
                <div className="w-9 h-9 rounded-xl bg-accent/10 text-accent flex items-center justify-center group-hover:scale-105 transition-transform border border-accent/20">
                  <FolderGit2 className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-foreground font-mono tabular-nums tracking-tight">
                  {studentProjects.length}
                </span>
                <span className="text-xs text-accent font-medium">Assigned</span>
              </div>
              <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs text-accent font-semibold group-hover:text-accent-hover">
                <span>View workspace</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>

            <Link
              href="/dashboard/courses"
              className="bg-card p-5 rounded-[16px] border border-border hover:border-accent/40 transition-all duration-200 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Curriculum Units
                </span>
                <div className="w-9 h-9 rounded-xl bg-muted text-foreground flex items-center justify-center group-hover:scale-105 transition-transform border border-border">
                  <BookOpen className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-foreground font-mono tabular-nums tracking-tight">2</span>
                <span className="text-xs text-muted-foreground font-medium">Active Semester</span>
              </div>
              <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs text-accent font-semibold group-hover:text-accent-hover">
                <span>View syllabus</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>

            <div className="bg-card p-5 rounded-[16px] border border-border">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Git Commits
                </span>
                <div className="w-9 h-9 rounded-xl bg-accent/10 text-accent flex items-center justify-center border border-accent/20">
                  <Activity className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-foreground font-mono tabular-nums tracking-tight">
                  {totalCommits}
                </span>
                <span className="text-xs text-accent font-medium">Synced telemetry</span>
              </div>
              <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                <span>Repositories connected</span>
                <span className="font-semibold text-accent">Active</span>
              </div>
            </div>

            <Link
              href="/dashboard/evaluation"
              className="bg-card p-5 rounded-[16px] border border-border hover:border-accent/40 transition-all duration-200 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Evaluations & Rubric
                </span>
                <div className="w-9 h-9 rounded-xl bg-warning/10 text-warning flex items-center justify-center group-hover:scale-105 transition-transform border border-warning/20">
                  <Sparkles className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-foreground font-mono tabular-nums tracking-tight">88%</span>
                <span className="text-xs text-warning font-medium">Rubric score</span>
              </div>
              <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs text-warning font-semibold group-hover:text-warning">
                <span>View feedback</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          </div>

          {/* Student Projects Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-foreground">My Assigned Academic Projects</h3>
                <p className="text-xs text-muted-foreground">
                  Select your assigned project to open the collaborative group workspace and submit deliverables.
                </p>
              </div>
              <Link
                href="/dashboard/projects"
                className="text-xs font-semibold text-accent hover:text-accent-hover flex items-center gap-1"
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
                    className="bg-card rounded-[16px] border border-border p-5 hover:border-accent/40 transition-all flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-bold text-accent bg-accent/10 px-2 py-0.5 rounded border border-accent/20">
                          {proj.courseCode}
                        </span>
                        {assignedGroup && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-accent bg-accent/10 px-2 py-0.5 rounded border border-accent/20">
                            <Users className="w-3 h-3 text-accent" />
                            {assignedGroup.groupName.split("—")[0].trim()}
                          </span>
                        )}
                      </div>

                      <div>
                        <h4 className="font-bold text-sm text-foreground line-clamp-1">{proj.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                          {proj.description}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-border space-y-1.5 text-xs">
                        <div className="flex items-center justify-between text-muted-foreground">
                          <span>Supervisor:</span>
                          <span className="font-semibold text-foreground">{proj.lecturerName || "Faculty"}</span>
                        </div>
                        <div className="flex items-center justify-between text-muted-foreground">
                          <span>Deadline:</span>
                          <span className="font-mono text-foreground">{proj.deadline || "Dec 15, 2026"}</span>
                        </div>
                        {isLead && (
                          <div className="flex items-center gap-1 text-[11px] font-semibold text-warning bg-warning/10 px-2 py-0.5 rounded border border-warning/20">
                            <span>You are designated Team Lead</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-border">
                      <Link
                        href={`/dashboard/projects/${proj.id}/workspace`}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-foreground text-background hover:bg-foreground/90 rounded-[10px] text-xs font-bold transition-colors"
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
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Academic Responsibilities Overview
              </h3>
              <span className="text-xs text-accent font-semibold font-mono">
                Faculty Supervisor Console
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
              {/* Stat 1: Assigned Courses */}
              <Link
                href="/dashboard/courses"
                className="bg-card p-4 rounded-[16px] border border-border hover:border-accent/40 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Assigned Courses</span>
                  <div className="w-7 h-7 rounded-lg bg-accent/10 text-accent flex items-center justify-center group-hover:scale-105 transition-transform border border-accent/20">
                    <BookOpen className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="mt-2.5 flex items-baseline gap-1.5">
                  <span className="text-2xl font-extrabold text-foreground font-mono tabular-nums tracking-tight">
                    {assignedCourses.length}
                  </span>
                  <span className="text-[10px] text-accent font-semibold">Active</span>
                </div>
                <span className="block text-[10px] text-muted-foreground mt-1">Curriculum units</span>
              </Link>

              {/* Stat 2: Active Projects */}
              <Link
                href="/dashboard/projects"
                className="bg-card p-4 rounded-[16px] border border-border hover:border-accent/40 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Active Projects</span>
                  <div className="w-7 h-7 rounded-lg bg-muted text-foreground flex items-center justify-center group-hover:scale-105 transition-transform border border-border">
                    <FolderGit2 className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="mt-2.5 flex items-baseline gap-1.5">
                  <span className="text-2xl font-extrabold text-foreground font-mono tabular-nums tracking-tight">
                    {activeProjectsCount}
                  </span>
                  <span className="text-[10px] text-accent font-semibold">Published</span>
                </div>
                <span className="block text-[10px] text-muted-foreground mt-1">Under supervision</span>
              </Link>

              {/* Stat 3: Total Assigned Students */}
              <Link
                href="/dashboard/teams"
                className="bg-card p-4 rounded-[16px] border border-border hover:border-accent/40 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Enrolled Students</span>
                  <div className="w-7 h-7 rounded-lg bg-muted text-foreground flex items-center justify-center group-hover:scale-105 transition-transform border border-border">
                    <GraduationCap className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="mt-2.5 flex items-baseline gap-1.5">
                  <span className="text-2xl font-extrabold text-foreground font-mono tabular-nums tracking-tight">
                    {totalAssignedStudents}
                  </span>
                  <span className="text-[10px] text-accent font-semibold">Assigned</span>
                </div>
                <span className="block text-[10px] text-muted-foreground mt-1">Active participants</span>
              </Link>

              {/* Stat 5: Pending Proposals */}
              <Link
                href="/dashboard/submissions"
                className="bg-card p-4 rounded-[16px] border border-border hover:border-warning/40 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Pending Proposals</span>
                  <div className="w-7 h-7 rounded-lg bg-warning/10 text-warning flex items-center justify-center group-hover:scale-105 transition-transform border border-warning/20">
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="mt-2.5 flex items-baseline gap-1.5">
                  <span className="text-2xl font-extrabold text-warning font-mono tabular-nums tracking-tight">
                    {pendingProposalsCount}
                  </span>
                  <span className="text-[10px] text-warning font-semibold">Awaiting</span>
                </div>
                <span className="block text-[10px] text-muted-foreground mt-1">Needs review</span>
              </Link>

              {/* Stat 6: Pending ER Reviews */}
              <Link
                href="/dashboard/submissions"
                className="bg-card p-4 rounded-[16px] border border-border hover:border-accent/40 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">ER Diagram Reviews</span>
                  <div className="w-7 h-7 rounded-lg bg-accent/10 text-accent flex items-center justify-center group-hover:scale-105 transition-transform border border-accent/20">
                    <Database className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="mt-2.5 flex items-baseline gap-1.5">
                  <span className="text-2xl font-extrabold text-accent font-mono tabular-nums tracking-tight">
                    {pendingERReviewsCount}
                  </span>
                  <span className="text-[10px] text-accent font-semibold">Diagrams</span>
                </div>
                <span className="block text-[10px] text-muted-foreground mt-1">AI analysis ready</span>
              </Link>

              {/* Stat 7: Pending AI Evaluations */}
              <Link
                href="/dashboard/evaluation"
                className="bg-card p-4 rounded-[16px] border border-border hover:border-accent/40 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Pending AI Evals</span>
                  <div className="w-7 h-7 rounded-lg bg-accent/10 text-accent flex items-center justify-center group-hover:scale-105 transition-transform border border-accent/20">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="mt-2.5 flex items-baseline gap-1.5">
                  <span className="text-2xl font-extrabold text-accent font-mono tabular-nums tracking-tight">
                    {pendingAIEvaluationsCount}
                  </span>
                  <span className="text-[10px] text-accent font-semibold">Pending</span>
                </div>
                <span className="block text-[10px] text-muted-foreground mt-1">Rubric grading</span>
              </Link>

              {/* Stat 8: Pending Final Submissions */}
              <Link
                href="/dashboard/submissions"
                className="bg-card p-4 rounded-[16px] border border-border hover:border-danger/40 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Final Submissions</span>
                  <div className="w-7 h-7 rounded-lg bg-danger/10 text-danger flex items-center justify-center group-hover:scale-105 transition-transform border border-danger/20">
                    <Inbox className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="mt-2.5 flex items-baseline gap-1.5">
                  <span className="text-2xl font-extrabold text-foreground font-mono tabular-nums tracking-tight">
                    {pendingFinalSubmissionsCount}
                  </span>
                  <span className="text-[10px] text-danger font-semibold">Submissions</span>
                </div>
                <span className="block text-[10px] text-muted-foreground mt-1">Awaiting marks</span>
              </Link>

              {/* Stat 9: Upcoming Deadlines */}
              <Link
                href="/dashboard/projects"
                className="bg-card p-4 rounded-[16px] border border-border hover:border-border transition-all group col-span-2 sm:col-span-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Due Soon</span>
                  <div className="w-7 h-7 rounded-lg bg-warning/10 text-warning flex items-center justify-center group-hover:scale-105 transition-transform border border-warning/20">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="mt-2.5 flex items-baseline gap-1.5">
                  <span className="text-2xl font-extrabold text-foreground font-mono tabular-nums tracking-tight">
                    {upcomingDeadlines.length}
                  </span>
                  <span className="text-[10px] text-warning font-semibold">Projects</span>
                </div>
                <span className="block text-[10px] text-muted-foreground mt-1">Next: Dec 15</span>
              </Link>
            </div>
          </div>

          {/* Section 2.2: 7 Detailed Dashboard Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Panel 1: Recently Created Projects */}
            <div className="bg-card p-5 sm:p-6 rounded-[16px] border border-border space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-accent/10 text-accent flex items-center justify-center border border-accent/20">
                    <FolderGit2 className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-sm text-foreground">Recently Created Projects</h3>
                </div>
                <Link
                  href="/dashboard/projects"
                  className="text-xs font-semibold text-accent hover:text-accent-hover flex items-center gap-1"
                >
                  View All ({lecturerProjects.length}) <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="space-y-3">
                {lecturerProjects.slice(0, 3).map((proj) => (
                  <div
                    key={proj.id}
                    className="p-3.5 rounded-[10px] border border-border hover:border-accent/40 bg-muted/40 hover:bg-muted/70 transition-all flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-accent bg-accent/10 px-2 py-0.5 rounded text-[10px] border border-accent/20">
                          {proj.courseCode}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded font-medium bg-muted text-muted-foreground border border-border">
                          {proj.type}
                        </span>
                        <span className="text-[10px] text-accent font-semibold bg-accent/10 px-2 py-0.5 rounded border border-accent/20">
                          {proj.status}
                        </span>
                      </div>
                      <p className="font-bold text-foreground text-xs truncate">
                        {proj.title}
                      </p>
                      <p className="text-[11px] text-muted-foreground line-clamp-1">
                        {proj.description}
                      </p>
                    </div>

                    <Link
                      href={`/dashboard/projects/${proj.id}`}
                      className="text-[11px] font-bold text-accent hover:text-accent-hover shrink-0 self-center"
                    >
                      Manage &rarr;
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            {/* Panel 2: Recently Assigned Groups */}
            <div className="bg-card p-5 sm:p-6 rounded-[16px] border border-border space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-accent/10 text-accent flex items-center justify-center border border-accent/20">
                    <Users className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-sm text-foreground">Recently Assigned Groups</h3>
                </div>
                <Link
                  href="/dashboard/teams"
                  className="text-xs font-semibold text-accent hover:text-accent-hover flex items-center gap-1"
                >
                  All Groups <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="space-y-3">
                {lecturerGroups.slice(0, 3).map((grp) => (
                  <div
                    key={grp.id}
                    className="p-3.5 rounded-[10px] border border-border hover:border-accent/40 bg-muted/40 hover:bg-muted/70 transition-all flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground">{grp.groupName}</span>
                        {grp.repoStatus === "connected" ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-accent bg-accent/10 px-1.5 py-0.5 rounded border border-accent/20">
                            GitHub Connected
                          </span>
                        ) : (
                          <span className="text-[10px] text-warning bg-warning/10 px-1.5 py-0.5 rounded border border-warning/20">
                            Repo Pending
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {grp.members.length} Students ({grp.members.map((m, idx) => m.studentId?.startsWith("std-") ? `CS202300${m.studentId.replace("std-", "")}` : (m.studentId || `CS202300${idx + 1}`)).join(", ")}) • Progress: {grp.progress}% • {grp.totalCommits} commits
                      </p>
                    </div>

                    <Link
                      href={`/dashboard/projects/${grp.projectId}/groups/${grp.id}`}
                      className="px-2.5 py-1 bg-muted border border-border hover:bg-muted/80 text-foreground rounded-[10px] text-xs font-semibold transition-colors shrink-0"
                    >
                      Review
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            {/* Panel 3: Upcoming Deadlines */}
            <div className="bg-card p-5 sm:p-6 rounded-[16px] border border-border space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-warning/10 text-warning flex items-center justify-center border border-warning/20">
                    <Clock className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-sm text-foreground">Upcoming Project Deadlines</h3>
                </div>
                <span className="text-xs text-muted-foreground font-medium">Academic schedule</span>
              </div>

              <div className="space-y-3">
                {upcomingDeadlines.map((proj) => (
                  <div
                    key={proj.id}
                    className="p-3 rounded-[10px] bg-muted/40 border border-border flex items-center justify-between text-xs"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="font-bold text-foreground truncate text-xs">{proj.title}</p>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                        <span className="font-mono text-accent font-semibold">{proj.courseCode}</span>
                        <span>•</span>
                        <span>Year {proj.academicYear}, Sem {proj.semester}</span>
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="inline-flex items-center gap-1 font-mono font-bold text-foreground bg-muted px-2 py-1 rounded-[10px] border border-border text-xs">
                        <Calendar className="w-3 h-3 text-muted-foreground" />
                        {proj.deadline}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Panel 4: Recent Student Submissions */}
            <div className="bg-card p-5 sm:p-6 rounded-[16px] border border-border space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-accent/10 text-accent flex items-center justify-center border border-accent/20">
                    <Inbox className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-sm text-foreground">Recent Student Submissions</h3>
                </div>
                <Link
                  href="/dashboard/submissions"
                  className="text-xs font-semibold text-accent hover:text-accent-hover"
                >
                  Manage All &rarr;
                </Link>
              </div>

              <div className="space-y-3">
                <div className="py-8 text-center text-muted-foreground border border-dashed border-border rounded-[10px]">
                  <p className="text-xs font-medium text-foreground">No recent student submissions</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">When student groups submit proposals or ER diagrams, they will appear here.</p>
                </div>
              </div>
            </div>

            {/* Panel 5: Recent GitHub Activity */}
            <div className="bg-card p-5 sm:p-6 rounded-[16px] border border-border space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-accent/10 text-accent flex items-center justify-center border border-accent/20">
                    <GitCommit className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-sm text-foreground">Live GitHub Activity</h3>
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-accent bg-accent/10 px-2 py-0.5 rounded-full border border-accent/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                  Webhook Ready
                </span>
              </div>

              <div className="space-y-3">
                <div className="py-8 text-center text-muted-foreground border border-dashed border-border rounded-[10px]">
                  <p className="text-xs font-medium text-foreground">No GitHub activity recorded</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Student repository commit and branch webhooks will display live here.</p>
                </div>
              </div>
            </div>

            {/* Panel 6 & 7: Pending Lecturer Reviews & Feedback Activity */}
            <div className="bg-card p-5 sm:p-6 rounded-[16px] border border-border space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-warning/10 text-warning flex items-center justify-center border border-warning/20">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-sm text-foreground">Pending Faculty Reviews & Feedback</h3>
                </div>
                <Link
                  href="/dashboard/evaluation"
                  className="text-xs font-semibold text-accent hover:text-accent-hover"
                >
                  Grade All &rarr;
                </Link>
              </div>

              <div className="space-y-3">
                <div className="py-8 text-center text-muted-foreground border border-dashed border-border rounded-[10px]">
                  <p className="text-xs font-medium text-foreground">No pending reviews</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">All student proposals and milestones are up to date.</p>
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
              className="bg-card p-5 rounded-[16px] border border-border hover:border-accent/40 transition-all duration-200 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Departments
                </span>
                <div className="w-9 h-9 rounded-xl bg-accent/10 text-accent flex items-center justify-center group-hover:scale-105 transition-transform border border-accent/20">
                  <Building2 className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-foreground font-mono tabular-nums tracking-tight">
                  {departments.length}
                </span>
                <span className="text-xs text-accent font-medium">Active units</span>
              </div>
              <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs text-accent font-semibold group-hover:text-accent-hover">
                <span>Manage departments</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>

            <Link
              href="/dashboard/courses"
              className="bg-card p-5 rounded-[16px] border border-border hover:border-accent/40 transition-all duration-200 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Courses
                </span>
                <div className="w-9 h-9 rounded-xl bg-muted text-foreground flex items-center justify-center group-hover:scale-105 transition-transform border border-border">
                  <BookOpen className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-foreground font-mono tabular-nums tracking-tight">
                  {courses.length}
                </span>
                <span className="text-xs text-muted-foreground">In curriculum</span>
              </div>
              <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs text-accent font-semibold group-hover:text-accent-hover">
                <span>View course catalog</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>

            <Link
              href="/dashboard/lecturers"
              className="bg-card p-5 rounded-[16px] border border-border hover:border-accent/40 transition-all duration-200 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Lecturers
                </span>
                <div className="w-9 h-9 rounded-xl bg-accent/10 text-accent flex items-center justify-center group-hover:scale-105 transition-transform border border-accent/20">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-foreground font-mono tabular-nums tracking-tight">
                  {lecturers.length}
                </span>
                {pendingPasswordCount > 0 ? (
                  <span className="text-xs text-warning font-medium">
                    {pendingPasswordCount} pending 1st login
                  </span>
                ) : (
                  <span className="text-xs text-accent font-medium">100% verified</span>
                )}
              </div>
              <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs text-accent font-semibold group-hover:text-accent-hover">
                <span>Staff management</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>

            <Link
              href="/dashboard/students"
              className="bg-card p-5 rounded-[16px] border border-border hover:border-accent/40 transition-all duration-200 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Students
                </span>
                <div className="w-9 h-9 rounded-xl bg-muted text-foreground flex items-center justify-center group-hover:scale-105 transition-transform border border-border">
                  <GraduationCap className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-foreground font-mono tabular-nums tracking-tight">
                  {students.length}
                </span>
                <span className="text-xs text-accent font-medium">Enrolled</span>
              </div>
              <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs text-accent font-semibold group-hover:text-accent-hover">
                <span>Student directory</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          </div>

          {/* Admin Lower Panels */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card p-5 sm:p-6 rounded-[16px] border border-border space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <h3 className="font-bold text-sm text-foreground">Academic Departments</h3>
                <Link href="/dashboard/departments" className="text-xs font-semibold text-accent hover:text-accent-hover">
                  View all &rarr;
                </Link>
              </div>
              <div className="space-y-2">
                {recentDepartments.map((dept) => (
                  <div key={dept.id} className="p-3 rounded-[10px] bg-muted/40 border border-border flex justify-between text-xs">
                    <span className="font-semibold text-foreground">{dept.name}</span>
                    <span className="text-muted-foreground font-mono text-[11px]">{dept.createdAt}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card p-5 sm:p-6 rounded-[16px] border border-border space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <h3 className="font-bold text-sm text-foreground">Curriculum Courses</h3>
                <Link href="/dashboard/courses" className="text-xs font-semibold text-accent hover:text-accent-hover">
                  View all &rarr;
                </Link>
              </div>
              <div className="space-y-2">
                {recentCourses.map((crs) => (
                  <div key={crs.id} className="p-3 rounded-[10px] bg-muted/40 border border-border flex justify-between text-xs">
                    <div>
                      <span className="font-mono font-bold text-accent bg-accent/10 px-1.5 py-0.5 rounded border border-accent/20 mr-2 text-[10px]">
                        {crs.code}
                      </span>
                      <span className="font-medium text-foreground">{crs.name}</span>
                    </div>
                    <span className="text-muted-foreground font-mono text-[11px]">{crs.createdAt}</span>
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
