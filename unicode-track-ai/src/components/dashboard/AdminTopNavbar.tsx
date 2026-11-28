"use client";

import React, { useState, useEffect } from "react";
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
  const { activeRole, activeAdminEmail } = useAdminData();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sessionAdmin, setSessionAdmin] = useState<{ name?: string; email?: string } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = sessionStorage.getItem("unicodetrack_authenticated_user");
      if (stored) {
        setSessionAdmin(JSON.parse(stored));
      }
    } catch {}
  }, []);

  const adminDisplayEmail = sessionAdmin?.email || activeAdminEmail || "admin@university.edu";
  const adminDisplayName = sessionAdmin?.name || "University Administrator";
  const adminInitials = adminDisplayName
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "UA";

  if (
    !mounted ||
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
    return "UniCodeTrack University Administration";
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
    <header className="sticky top-0 z-20 h-16 bg-background/95 backdrop-blur-md border-b border-border px-4 sm:px-6 flex items-center justify-between text-foreground">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="p-2 rounded-[8px] text-muted-foreground hover:text-foreground hover:bg-muted md:hidden focus:outline-none cursor-pointer"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-base sm:text-lg font-bold text-foreground tracking-tight leading-tight">
            {getPageTitle(pathname)}
          </h1>
          <p className="text-[11px] text-muted-foreground hidden sm:block truncate max-w-md">
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
            className="w-full px-3 py-1.5 pl-8 pr-3 rounded-[10px] border border-border text-xs text-foreground bg-muted focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-all placeholder:text-muted-foreground"
          />
          <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-2.5" />
        </div>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative p-2 rounded-[8px] text-muted-foreground hover:text-foreground hover:bg-muted focus:outline-none transition-colors cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent ring-2 ring-background" />
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-card rounded-[16px] shadow-2xl border border-border p-3 z-40 animate-in fade-in-50">
              <div className="flex items-center justify-between pb-2 border-b border-border text-xs">
                <span className="font-bold text-foreground">Notifications</span>
                <span className="text-[10px] text-accent font-semibold cursor-pointer hover:underline">
                  Mark all as read
                </span>
              </div>
              <div className="divide-y divide-border mt-1 max-h-64 overflow-y-auto">
                {notifications.map((n) => (
                  <div key={n.id} className="py-2 text-xs">
                    <p className="font-semibold text-foreground">{n.title}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{n.desc}</p>
                    <span className="text-[10px] text-muted-foreground">{n.time}</span>
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
            className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1 rounded-[10px] hover:bg-muted transition-colors focus:outline-none cursor-pointer"
          >
            <div suppressHydrationWarning className="w-8 h-8 rounded-[8px] bg-accent-soft text-accent border border-accent-border font-bold text-xs flex items-center justify-center">
              {adminInitials}
            </div>
            <div className="hidden lg:block text-left text-xs leading-tight">
              <p suppressHydrationWarning className="font-bold text-foreground truncate max-w-[150px]">{adminDisplayName}</p>
              <p suppressHydrationWarning className="text-[10px] text-muted-foreground truncate max-w-[150px]">{adminDisplayEmail}</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground hidden sm:block" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-card rounded-[16px] shadow-2xl border border-border p-2 z-40 text-xs animate-in fade-in-50">
              <div className="p-2 border-b border-border">
                <p className="font-bold text-foreground truncate">{adminDisplayName}</p>
                <p className="text-[11px] text-muted-foreground truncate">{adminDisplayEmail}</p>
                <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-semibold text-accent bg-accent-soft px-2 py-0.5 rounded-full border border-accent-border">
                  <ShieldCheck className="w-3 h-3" /> University Administrator
                </span>
              </div>

              <div className="py-1">
                <Link
                  href="/dashboard/departments"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-[8px] text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <Building2 className="w-3.5 h-3.5" /> Departments
                </Link>
                <Link
                  href="/dashboard/courses"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-[8px] text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <BookOpen className="w-3.5 h-3.5" /> Courses
                </Link>
                <Link
                  href="/dashboard/lecturers"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-[8px] text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <Users className="w-3.5 h-3.5" /> Lecturers
                </Link>
                <Link
                  href="/dashboard/students"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-[8px] text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <GraduationCap className="w-3.5 h-3.5" /> Students
                </Link>
              </div>

              <div className="pt-1 border-t border-border">
                <Link
                  href="/login"
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-[8px] text-danger hover:bg-danger-soft font-medium"
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
