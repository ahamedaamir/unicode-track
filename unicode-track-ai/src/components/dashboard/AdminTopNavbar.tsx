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

  if (activeRole === "lecturer" && pathname === "/dashboard") {
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
    <header className="sticky top-0 z-20 h-16 bg-white/95 backdrop-blur-md border-b border-[#E2E8F0] px-4 sm:px-6 flex items-center justify-between">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 md:hidden focus:outline-none"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-base sm:text-lg font-bold text-[#0B1220] tracking-tight leading-tight">
            {getPageTitle(pathname)}
          </h1>
          <p className="text-[11px] text-slate-500 hidden sm:block truncate max-w-md">
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
            className="w-full px-3 py-1.5 pl-8 pr-3 rounded-lg border border-slate-200 text-xs text-slate-900 bg-slate-50/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#14B8A6] focus:border-transparent transition-all placeholder:text-slate-400"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
        </div>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#14B8A6] ring-2 ring-white" />
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-xl shadow-lg border border-slate-200 p-3 z-40 animate-in fade-in-50">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs">
                <span className="font-bold text-slate-900">Notifications</span>
                <span className="text-[10px] text-teal-700 font-semibold cursor-pointer">
                  Mark all as read
                </span>
              </div>
              <div className="divide-y divide-slate-100 mt-1 max-h-64 overflow-y-auto">
                {notifications.map((n) => (
                  <div key={n.id} className="py-2 text-xs">
                    <p className="font-semibold text-slate-800">{n.title}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{n.desc}</p>
                    <span className="text-[10px] text-slate-400">{n.time}</span>
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
            className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1 rounded-xl hover:bg-slate-100 transition-colors focus:outline-none"
          >
            <div className="w-8 h-8 rounded-lg bg-[#0B1220] text-teal-400 font-bold text-xs flex items-center justify-center">
              AV
            </div>
            <div className="hidden lg:block text-left text-xs leading-tight">
              <p className="font-bold text-slate-900">Dr. Arthur Vance</p>
              <p className="text-[10px] text-slate-500">Administrator</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 p-2 z-40 text-xs animate-in fade-in-50">
              <div className="p-2 border-b border-slate-100">
                <p className="font-bold text-slate-900">Dr. Arthur Vance</p>
                <p className="text-[11px] text-slate-500">admin@university.edu</p>
                <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                  <ShieldCheck className="w-3 h-3" /> University Administrator
                </span>
              </div>

              <div className="py-1">
                <Link
                  href="/dashboard/departments"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-700 hover:bg-slate-50 hover:text-[#14B8A6]"
                >
                  <Building2 className="w-3.5 h-3.5" /> Departments
                </Link>
                <Link
                  href="/dashboard/courses"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-700 hover:bg-slate-50 hover:text-[#14B8A6]"
                >
                  <BookOpen className="w-3.5 h-3.5" /> Courses
                </Link>
                <Link
                  href="/dashboard/lecturers"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-700 hover:bg-slate-50 hover:text-[#14B8A6]"
                >
                  <Users className="w-3.5 h-3.5" /> Lecturers
                </Link>
                <Link
                  href="/dashboard/students"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-700 hover:bg-slate-50 hover:text-[#14B8A6]"
                >
                  <GraduationCap className="w-3.5 h-3.5" /> Students
                </Link>
              </div>

              <div className="pt-1 border-t border-slate-100">
                <Link
                  href="/login"
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 font-medium"
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
