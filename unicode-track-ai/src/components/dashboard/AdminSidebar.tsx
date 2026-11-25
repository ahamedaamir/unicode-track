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
  User,
  CheckSquare,
  Inbox,
  Terminal,
  FileQuestion,
  Trophy
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
    lecturers,
    students,
    projects,
    activeRole,
    activeLecturerEmail,
    activeStudentEmail,
    getProjectsForStudent,
  } = useAdminData();

  const currentLecturer = lecturers.find((l) => l.email === activeLecturerEmail) || lecturers[0];
  const currentStudent = students.find((s) => s.email.toLowerCase() === activeStudentEmail.toLowerCase()) || students[0];
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
      count: studentProjects.length > 0 ? studentProjects.length : undefined,
    },
    {
      name: "My Courses",
      href: "/dashboard/courses",
      icon: BookOpen,
      count: undefined,
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
      icon: Trophy,
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
      count: undefined,
    },
    {
      name: "Courses",
      href: "/dashboard/courses",
      icon: BookOpen,
      count: undefined,
    },
    {
      name: "Lecturers",
      href: "/dashboard/lecturers",
      icon: Users,
      count: undefined,
    },
    {
      name: "Students",
      href: "/dashboard/students",
      icon: GraduationCap,
      count: undefined,
    },
    {
      name: "Projects",
      href: "/dashboard/projects",
      icon: FolderGit2,
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
    <div className="flex flex-col h-full bg-background text-muted-foreground border-r border-border">
      {/* Brand Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-border">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 overflow-hidden focus:outline-none"
        >
          <div className="relative flex items-center justify-center w-9 h-9 rounded-[10px] bg-accent-soft border border-accent-border text-accent shrink-0">
            <Code2 className="w-5 h-5 text-accent" />
            <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-accent flex items-center justify-center ring-2 ring-background">
              <Sparkles className="w-1.5 h-1.5 text-background" />
            </div>
          </div>
          {(!collapsed || mobileOpen) && (
            <div className="flex flex-col leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="text-base font-bold text-foreground tracking-tight">
                  UniCodeTrack
                </span>
                <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-accent-soft text-accent border border-accent-border">
                  AI
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground tracking-wide font-medium">
                {isStudent ? "Student Workspace" : isLecturer ? "Lecturer Dashboard" : "Admin Workspace"}
              </span>
            </div>
          )}
        </Link>

        {/* Mobile close button */}
        {mobileOpen && (
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1.5 text-muted-foreground hover:text-foreground rounded-[8px] hover:bg-muted md:hidden cursor-pointer"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Desktop Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex items-center justify-center w-7 h-7 rounded-[8px] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {!isLecturer && (!collapsed || mobileOpen) && (
          <div className="px-2 pb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
            {isStudent ? "My Learning" : "Administration"}
          </div>
        )}
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-[10px] text-xs sm:text-sm font-medium transition-all group relative ${
                isActive
                  ? "bg-muted text-foreground border border-border/70 font-semibold shadow-2xs"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
              title={collapsed ? item.name : undefined}
            >
              {/* Active Dot Marker */}
              {isActive ? (
                <span className="w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_8px_rgba(45,212,191,0.8)] shrink-0" />
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-transparent shrink-0" />
              )}

              <item.icon
                className={`w-4 h-4 shrink-0 transition-transform ${
                  isActive ? "text-accent" : "text-muted-foreground group-hover:text-foreground"
                }`}
              />

              {(!collapsed || mobileOpen) && (
                <span className="flex-1 truncate">{item.name}</span>
              )}
              {(!collapsed || mobileOpen) && item.count !== undefined && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                  {item.count}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Pinned Bottom User Card */}
      <div className="p-3 border-t border-border space-y-2">
        {isLecturer ? (
          <div
            className={`p-2.5 rounded-[12px] bg-card border border-border ${
              collapsed && !mobileOpen ? "text-center" : ""
            }`}
          >
            {(!collapsed || mobileOpen) && (
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">
                  {currentLecturer?.name?.toLowerCase().includes("check")
                    ? "Dr. Check Lecturer"
                    : currentLecturer?.name || "Dr. Check Lecturer"}
                </p>
                <p className="text-[10px] text-muted-foreground truncate mt-0.5 font-medium">
                  Senior Lecturer · Faculty
                </p>
              </div>
            )}
            {collapsed && !mobileOpen && (
              <div className="w-7 h-7 rounded-[8px] bg-accent-soft text-accent border border-accent-border font-bold text-xs flex items-center justify-center mx-auto">
                DC
              </div>
            )}
          </div>
        ) : (
          <div
            className={`flex items-center gap-2.5 p-2 rounded-[12px] bg-card border border-border ${
              collapsed && !mobileOpen ? "justify-center" : ""
            }`}
          >
            <div className="w-7 h-7 rounded-[8px] bg-accent-soft text-accent border border-accent-border font-bold text-xs flex items-center justify-center shrink-0">
              {isStudent ? "AC" : "AV"}
            </div>
            {(!collapsed || mobileOpen) && (
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <p className="text-xs font-semibold text-foreground truncate">
                    {isStudent
                      ? currentStudent?.fullName || "Alex Chen"
                      : "Dr. Arthur Vance"}
                  </p>
                  <ShieldCheck className="w-3 h-3 text-accent shrink-0" />
                </div>
                <p className="text-[10px] text-muted-foreground truncate">
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
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-[8px] text-xs font-medium text-danger hover:bg-danger-soft transition-colors cursor-pointer ${
            collapsed && !mobileOpen ? "justify-center" : ""
          }`}
          title="Sign Out"
        >
          <LogOut className="w-3.5 h-3.5 shrink-0" />
          {(!collapsed || mobileOpen) && <span>Logout</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar (~252px wide) */}
      <aside
        className={`hidden md:block shrink-0 transition-all duration-200 z-30 ${
          collapsed ? "w-16" : "w-[252px]"
        }`}
      >
        <div
          className="fixed top-0 bottom-0 left-0 transition-all duration-200 z-30"
          style={{ width: collapsed ? "4rem" : "252px" }}
        >
          {navContent}
        </div>
      </aside>

      {/* Mobile Backdrop & Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-[252px] max-w-[80vw] h-full z-50 shadow-2xl animate-in slide-in-from-left duration-200">
            {navContent}
          </div>
        </div>
      )}
    </>
  );
}
