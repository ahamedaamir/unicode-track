"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Code2,
  Sparkles,
  LayoutDashboard,
  Building2,
  BookOpen,
  Users,
  GraduationCap,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  X,
  FolderGit2,
  FilePlus2,
  User,
  CheckSquare,
  Inbox,
  FileText,
  Terminal,
  FileQuestion
} from "lucide-react";
import { useAdminData } from "@/context/AdminDataContext";

interface AdminSidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export function AdminSidebar({
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
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
  } = useAdminData();

  const currentLecturer = lecturers.find((l) => l.email === activeLecturerEmail) || lecturers[0];
  const currentStudent = students.find((s) => s.email.toLowerCase() === activeStudentEmail.toLowerCase()) || students[0];
  const lecturerCourseCount = currentLecturer ? currentLecturer.assignedCourses.length : 2;
  const lecturerProjectsCount = projects.filter((p) =>
    !currentLecturer || currentLecturer.assignedCourses.includes(p.courseCode)
  ).length;
  const studentProjects = getProjectsForStudent(activeStudentEmail);

  const studentNavigation = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      count: undefined,
    },
    {
      name: "My Projects",
      href: "/dashboard/projects",
      icon: FolderGit2,
      count: studentProjects.length,
    },
    {
      name: "My Courses",
      href: "/dashboard/courses",
      icon: BookOpen,
      count: 2,
    },
    {
      name: "Submissions",
      href: "/dashboard/submissions",
      icon: Inbox,
      count: undefined,
    },
    {
      name: "Evaluations",
      href: "/dashboard/evaluation",
      icon: CheckSquare,
      count: undefined,
    },
    {
      name: "Run",
      href: "/dashboard/test",
      icon: Terminal,
      count: undefined,
    },
    {
      name: "Quizzes",
      href: "/dashboard/quizzes",
      icon: FileQuestion,
      count: undefined,
    },
    {
      name: "Profile",
      href: "/dashboard/profile",
      icon: User,
      count: undefined,
    },
  ];

  const lecturerNavigation = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      count: undefined,
    },
    {
      name: "Projects",
      href: "/dashboard/projects",
      icon: FolderGit2,
      count: undefined,
    },
    {
      name: "Evaluations & Marks",
      href: "/dashboard/evaluation",
      icon: CheckSquare,
      count: undefined,
    },
    {
      name: "Run",
      href: "/dashboard/test",
      icon: Terminal,
      count: undefined,
    },
    {
      name: "Quizzes",
      href: "/dashboard/quizzes",
      icon: FileQuestion,
      count: undefined,
    },
    {
      name: "Hackathon",
      href: "/dashboard/hackathons",
      icon: Sparkles,
      count: undefined,
    },
    {
      name: "My Profile",
      href: "/dashboard/profile",
      icon: User,
      count: undefined,
    },
  ];

  const adminNavigation = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      count: undefined,
    },
    {
      name: "Departments",
      href: "/dashboard/departments",
      icon: Building2,
      count: departments.length,
    },
    {
      name: "Courses",
      href: "/dashboard/courses",
      icon: BookOpen,
      count: courses.length,
    },
    {
      name: "Lecturers",
      href: "/dashboard/lecturers",
      icon: Users,
      count: lecturers.length,
    },
    {
      name: "Students",
      href: "/dashboard/students",
      icon: GraduationCap,
      count: students.length,
    },
    {
      name: "Projects",
      href: "/dashboard/projects",
      icon: FolderGit2,
      count: projects.length,
    },
    {
      name: "Run",
      href: "/dashboard/test",
      icon: Terminal,
      count: undefined,
    },
    {
      name: "Quizzes",
      href: "/dashboard/quizzes",
      icon: FileQuestion,
      count: undefined,
    },
    {
      name: "Settings",
      href: "/dashboard/settings",
      icon: Settings,
      count: undefined,
    },
  ];

  const isStudent = activeRole === "student";
  const isLecturer = activeRole === "lecturer";
  const navigation = isStudent ? studentNavigation : isLecturer ? lecturerNavigation : adminNavigation;

  const handleLogout = () => {
    if (confirm("Are you sure you want to sign out of the university workspace?")) {
      router.push("/login");
    }
  };

  const navContent = (
    <div className="flex flex-col h-full bg-[#0B1220] text-slate-300 border-r border-slate-800">
      {/* Brand Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800/80">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 overflow-hidden focus:outline-none"
        >
          <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-slate-900 border border-slate-700 text-white shrink-0">
            <Code2 className="w-5 h-5 text-teal-400" />
            <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#14B8A6] flex items-center justify-center ring-2 ring-[#0B1220]">
              <Sparkles className="w-1.5 h-1.5 text-white" />
            </div>
          </div>
          {(!collapsed || mobileOpen) && (
            <div className="flex flex-col leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="text-base font-bold text-white tracking-tight">
                  UniCodeTrack
                </span>
                <span className="text-[10px] font-semibold px-1 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  AI
                </span>
              </div>
              <span className="text-[10px] text-slate-400 tracking-wide font-medium">
                {isStudent ? "Student Workspace" : isLecturer ? "Lecturer Dashboard" : "Admin Workspace"}
              </span>
            </div>
          )}
        </Link>

        {/* Mobile close button */}
        {mobileOpen && (
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 md:hidden"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Desktop Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-2.5 py-4 space-y-1 overflow-y-auto">
        {!isLecturer && (
          <div className="px-2 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            {(!collapsed || mobileOpen) ? (isStudent ? "My Learning" : "Administration") : "Menu"}
          </div>
        )}
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all group relative ${isActive
                ? "bg-[#14B8A6] text-white shadow-xs font-semibold"
                : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                }`}
              title={collapsed ? item.name : undefined}
            >
              {(!isLecturer || collapsed) && (
                <item.icon
                  className={`w-4 h-4 shrink-0 transition-transform ${isActive ? "text-white" : "text-slate-400 group-hover:text-teal-400"
                    }`}
                />
              )}
              {(!collapsed || mobileOpen) && (
                <span className="flex-1 truncate">{item.name}</span>
              )}
              {(!collapsed || mobileOpen) && item.count !== undefined && (
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${isActive
                    ? "bg-teal-700/80 text-white"
                    : "bg-slate-800 text-slate-300 group-hover:bg-slate-700"
                    }`}
                >
                  {item.count}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Profile */}
      <div className="p-3 border-t border-slate-800/80 space-y-2">
        {isLecturer ? (
          <div
            className={`p-3 rounded-xl bg-slate-900/90 border border-slate-800 ${
              collapsed && !mobileOpen ? "text-center" : ""
            }`}
          >
            {(!collapsed || mobileOpen) && (
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">
                  {currentLecturer?.name?.toLowerCase().includes("check")
                    ? "Dr. Check Lecturer"
                    : currentLecturer?.name || "Dr. Check Lecturer"}
                </p>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">
                  Senior Lecturer · Faculty
                </p>
              </div>
            )}
            {collapsed && !mobileOpen && (
              <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 border border-teal-500/30 font-bold text-xs flex items-center justify-center mx-auto">
                DC
              </div>
            )}
          </div>
        ) : (
          <div
            className={`flex items-center gap-2.5 p-2 rounded-xl bg-slate-900/80 border border-slate-800 ${
              collapsed && !mobileOpen ? "justify-center" : ""
            }`}
          >
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 border border-teal-500/30 font-bold text-xs flex items-center justify-center shrink-0">
              {isStudent ? "AC" : "AV"}
            </div>
            {(!collapsed || mobileOpen) && (
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <p className="text-xs font-bold text-white truncate">
                    {isStudent
                      ? currentStudent?.fullName || "Alex Chen"
                      : "Dr. Arthur Vance"}
                  </p>
                  <ShieldCheck className="w-3 h-3 text-teal-400 shrink-0" />
                </div>
                <p className="text-[10px] text-slate-400 truncate">
                  {isStudent
                    ? "Student • Software Engineering"
                    : "University Administrator"}
                </p>
              </div>
            )}
          </div>
        )}

        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition-colors ${collapsed && !mobileOpen ? "justify-center" : ""
            }`}
          title="Sign Out"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {(!collapsed || mobileOpen) && <span>Logout</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside
        className={`hidden md:block shrink-0 transition-all duration-200 z-30 ${collapsed ? "w-16" : "w-64"
          }`}
      >
        <div className="fixed top-0 bottom-0 left-0 transition-all duration-200 z-30" style={{ width: collapsed ? "4rem" : "16rem" }}>
          {navContent}
        </div>
      </aside>

      {/* Mobile Backdrop & Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-64 max-w-[80vw] h-full z-50 shadow-2xl animate-in slide-in-from-left duration-200">
            {navContent}
          </div>
        </div>
      )}
    </>
  );
}
