"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAdminData } from "@/context/AdminDataContext";
import { 
  Menu, 
  Search, 
  Bell, 
  LogOut, 
  ShieldCheck, 
  ChevronDown,
  Building2,
  BookOpen,
  Users,
  GraduationCap
} from "lucide-react";

interface AdminTopNavbarProps {
  onToggleMobileMenu: () => void;
}

export function AdminTopNavbar({ onToggleMobileMenu }: AdminTopNavbarProps) {
  const pathname = usePathname();
  const { activeRole } = useAdminData();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  if (
    activeRole !== "admin" ||
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/projects") ||
    pathname.startsWith("/dashboard/evaluation") ||
    pathname.startsWith("/dashboard/hackathons") ||
    pathname.startsWith("/dashboard/test") ||
    pathname.startsWith("/dashboard/quizzes") ||
    pathname.startsWith("/dashboard/profile")
  ) {
    return null;
  }

  const getPageTitle = (path: string) => {
    if (path === "/dashboard") return "Dashboard Overview";
    if (path.startsWith("/dashboard/departments")) return "Department Management";
    if (path.startsWith("/dashboard/courses")) return "Course Management";
    if (path.startsWith("/dashboard/lecturers")) return "Lecturer Management";
    if (path.startsWith("/dashboard/students")) return "Student Directory";
    if (path.startsWith("/dashboard/settings")) return "Institution Settings";
    return "Administrator Workspace";
  };

  const getPageSubtitle = (path: string) => {
    if (path === "/dashboard") return "Monitor university metrics, recent courses, and administrative activity.";
    if (path.startsWith("/dashboard/departments")) return "Organize and maintain university academic faculties and departments.";
    if (path.startsWith("/dashboard/courses")) return "Manage official curriculum courses available for lecturer assignments.";
    if (path.startsWith("/dashboard/lecturers")) return "Create and supervise lecturer accounts, course allocations, and security status.";
    if (path.startsWith("/dashboard/students")) return "Review enrolled students, course commitments, and academic team assignments.";
    return "UniCodeTrack AI University Administration";
  };

  const notifications = [
    {
      id: 1,
      title: "New Lecturer Created",
      desc: "Marcus Sterling was assigned CS3021 & IT1040",
      time: "2h ago",
    },
    {
      id: 2,
      title: "First Login Pending",
      desc: "Dr. Sarah Al-Mansoor has not changed default password yet",
      time: "1d ago",
    },
    {
      id: 3,
      title: "Course Catalog Updated",
      desc: "ICT2142 added to Faculty of Computing",
      time: "2d ago",
    },
  ];

  return (
    <header className="sticky top-0 z-20 h-16 bg-[#0b1220]/95 backdrop-blur-md border-b border-[#1e293b] px-4 sm:px-6 flex items-center justify-between text-white">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 md:hidden focus:outline-none"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-base sm:text-lg font-bold text-white tracking-tight leading-tight">
            {getPageTitle(pathname)}
          </h1>
          <p className="text-[11px] text-slate-400 hidden sm:block truncate max-w-md">
            {getPageSubtitle(pathname)}
          </p>
        </div>
      </div>

      {/* Right: Search, Notifications, Admin Profile */}
      <div className="flex items-center gap-2.5 sm:gap-4">
        {/* Quick Search */}
        <div className="relative hidden md:block w-56 lg:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search departments, courses, staff..."
            className="w-full px-3 py-1.5 pl-8 pr-3 rounded-lg border border-[#1e293b] text-xs text-white bg-[#0e1626] focus:bg-[#111a2e] focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-all placeholder:text-slate-500"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
        </div>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-teal-400 ring-2 ring-[#0b1220]" />
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-[#0e1626] rounded-xl shadow-2xl border border-[#1e293b] p-3 z-40 animate-in fade-in-50">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
                <span className="font-bold text-white">Notifications</span>
                <span className="text-[10px] text-teal-400 font-semibold cursor-pointer hover:underline">
                  Mark all as read
                </span>
              </div>
              <div className="divide-y divide-slate-850 mt-1 max-h-64 overflow-y-auto">
                {notifications.map((n) => (
                  <div key={n.id} className="py-2 text-xs">
                    <p className="font-semibold text-slate-200">{n.title}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{n.desc}</p>
                    <span className="text-[10px] text-slate-500">{n.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1 rounded-xl hover:bg-slate-800 transition-colors focus:outline-none"
          >
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-300 border border-teal-500/30 font-bold text-xs flex items-center justify-center">
              AV
            </div>
            <div className="hidden lg:block text-left text-xs leading-tight">
              <p className="font-bold text-white">Dr. Arthur Vance</p>
              <p className="text-[10px] text-slate-400">Administrator</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-[#0e1626] rounded-xl shadow-2xl border border-[#1e293b] p-2 z-40 text-xs animate-in fade-in-50">
              <div className="p-2 border-b border-slate-850">
                <p className="font-bold text-white">Dr. Arthur Vance</p>
                <p className="text-[11px] text-slate-400">admin@university.edu</p>
                <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-semibold text-teal-300 bg-teal-500/15 px-2 py-0.5 rounded border border-teal-500/30">
                  <ShieldCheck className="w-3 h-3" /> University Administrator
                </span>
              </div>

              <div className="py-1">
                <Link
                  href="/dashboard/departments"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-teal-400"
                >
                  <Building2 className="w-3.5 h-3.5" /> Departments
                </Link>
                <Link
                  href="/dashboard/courses"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-teal-400"
                >
                  <BookOpen className="w-3.5 h-3.5" /> Courses
                </Link>
                <Link
                  href="/dashboard/lecturers"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-teal-400"
                >
                  <Users className="w-3.5 h-3.5" /> Lecturers
                </Link>
                <Link
                  href="/dashboard/students"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-teal-400"
                >
                  <GraduationCap className="w-3.5 h-3.5" /> Students
                </Link>
              </div>

              <div className="pt-1 border-t border-slate-850">
                <Link
                  href="/login"
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 font-medium"
                >
                  <LogOut className="w-3.5 h-3.5" /> Sign Out
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
