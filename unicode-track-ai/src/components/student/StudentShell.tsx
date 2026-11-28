"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderGit2,
  Users,
  FileText,
  Network,
  GitBranch,
  Sparkles,
  Award,
  MessageSquare,
  Bell,
  User,
  Search,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Menu,
  X,
  LogOut,
  KeyRound,
  Code2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { STUDENT_NOTIFICATIONS } from "./studentData";

const STUDENT_NAV_ITEMS = [
  { label: "Student Dashboard", href: "/dashboard/student", icon: LayoutDashboard },
  { label: "My Projects", href: "/dashboard/student/projects", icon: FolderGit2 },
  { label: "My Groups", href: "/dashboard/student/groups", icon: Users },
  { label: "Proposals", href: "/dashboard/student/proposals", icon: FileText },
  { label: "ER Diagrams", href: "/dashboard/student/er-diagrams", icon: Network },
  { label: "GitHub Repositories", href: "/dashboard/student/repositories", icon: GitBranch },
  { label: "AI Code Reviews", href: "/dashboard/student/ai-reviews", icon: Sparkles },
  { label: "Evaluations & Marks", href: "/dashboard/student/evaluations", icon: Award },
  { label: "Feedback", href: "/dashboard/student/feedback", icon: MessageSquare },
  { label: "Notifications", href: "/dashboard/student/notifications", icon: Bell },
  { label: "My Profile", href: "/dashboard/student/profile", icon: User },
];

export function StudentShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("unicodetrack_student_theme");
      if (saved === "dark") setDarkMode(true);
    } catch {
      // Ignore storage errors
    }
  }, []);

  const toggleTheme = () => {
    const next = !darkMode;
    setDarkMode(next);
    try {
      localStorage.setItem("unicodetrack_student_theme", next ? "dark" : "light");
    } catch {
      // Ignore storage errors
    }
  };

  const unreadCount = STUDENT_NOTIFICATIONS.filter((n) => n.unread).length;

  const isActive = (href: string) => {
    if (href === "/dashboard/student") {
      return pathname === "/dashboard/student";
    }
    return pathname?.startsWith(href);
  };

  return (
    <div
      className={cn(
        "student-theme min-h-screen flex bg-[var(--neutral-bg)] text-[var(--neutral-text)] font-sans antialiased transition-colors duration-200",
        darkMode && "dark"
      )}
    >
      {/* Desktop Collapsible Left Sidebar */}
      <aside
        aria-label="Student Navigation"
        className={cn(
          "hidden md:flex flex-col sticky top-0 h-screen shrink-0 border-r border-[var(--neutral-border)] bg-[var(--neutral-card)] transition-all duration-200 z-30",
          collapsed ? "w-[76px]" : "w-[260px]"
        )}
      >
        {/* Brand Header */}
        <div className="h-16 px-4 border-b border-[var(--neutral-border)] flex items-center justify-between gap-2">
          <Link
            href="/dashboard/student"
            className="flex items-center gap-2.5 min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] rounded-lg"
          >
            <div className="w-8 h-8 rounded-xl bg-[var(--primary)] text-white flex items-center justify-center shrink-0">
              <Code2 className="w-4 h-4" aria-hidden="true" />
            </div>
            {!collapsed && (
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-sm font-semibold tracking-tight text-[var(--neutral-text)] truncate">
                  UniCodeTrack
                </span>
                <span className="inline-flex items-center rounded-full bg-[var(--accent-soft)] border border-[var(--accent-border)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--accent-foreground)]">
                  AI
                </span>
              </div>
            )}
          </Link>

          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="p-1.5 rounded-lg text-[var(--neutral-muted)] hover:text-[var(--neutral-text)] hover:bg-[var(--neutral-surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] cursor-pointer"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-4 space-y-1">
          {STUDENT_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]",
                  active
                    ? "bg-[var(--primary-soft)] text-[var(--primary)] dark:text-indigo-300 font-semibold"
                    : "text-[var(--neutral-muted)] hover:bg-[var(--neutral-surface)] hover:text-[var(--neutral-text)]",
                  collapsed && "justify-center px-2"
                )}
              >
                {active && (
                  <span
                    aria-hidden="true"
                    className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-[var(--primary)]"
                  />
                )}
                <Icon
                  className={cn(
                    "w-4 h-4 shrink-0",
                    active ? "text-[var(--primary)] dark:text-indigo-300" : ""
                  )}
                  aria-hidden="true"
                />
                {!collapsed && <span className="truncate">{item.label}</span>}
                {!collapsed && item.label === "Notifications" && unreadCount > 0 && (
                  <span className="ml-auto inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-[var(--primary)] text-white text-[11px] font-semibold tabular-nums">
                    {unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Student Chip */}
        {!collapsed && (
          <div className="p-3 border-t border-[var(--neutral-border)]">
            <div className="rounded-xl bg-[var(--neutral-surface)] p-3 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[var(--primary)] text-white flex items-center justify-center text-xs font-semibold shrink-0">
                AC
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[var(--neutral-text)] truncate">Alex Chen</p>
                <p className="text-[11px] text-[var(--neutral-muted)] truncate">BSc Software Eng.</p>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Mobile Drawer Navigation */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/50"
            onClick={() => setMobileDrawerOpen(false)}
            aria-hidden="true"
          />
          <aside
            aria-label="Mobile Student Navigation"
            className="relative w-72 max-w-[85vw] bg-[var(--neutral-card)] border-r border-[var(--neutral-border)] h-full flex flex-col z-10"
          >
            <div className="h-16 px-4 border-b border-[var(--neutral-border)] flex items-center justify-between">
              <span className="text-sm font-semibold text-[var(--neutral-text)]">
                UniCodeTrack AI
              </span>
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                aria-label="Close navigation menu"
                className="p-2 rounded-lg text-[var(--neutral-muted)] hover:bg-[var(--neutral-surface)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-3 space-y-1">
              {STUDENT_NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileDrawerOpen(false)}
                    className={cn(
                      "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium",
                      active
                        ? "bg-[var(--primary-soft)] text-[var(--primary)] dark:text-indigo-300 font-semibold"
                        : "text-[var(--neutral-muted)] hover:bg-[var(--neutral-surface)]"
                    )}
                  >
                    {active && (
                      <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-[var(--primary)]" />
                    )}
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Main Column */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        {/* Sticky Top Bar */}
        <header className="sticky top-0 z-20 h-16 border-b border-[var(--neutral-border)] bg-[var(--neutral-card)]/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              aria-label="Open navigation menu"
              className="md:hidden p-2 rounded-xl border border-[var(--neutral-border)] text-[var(--neutral-muted)] hover:text-[var(--neutral-text)] cursor-pointer"
            >
              <Menu className="w-4 h-4" />
            </button>

            <div className="relative w-full max-w-md hidden sm:block">
              <Search
                className="w-4 h-4 text-[var(--neutral-muted)] absolute left-3 top-1/2 -translate-y-1/2"
                aria-hidden="true"
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects, proposals, repos, or feedback..."
                aria-label="Global search"
                className="w-full rounded-xl border border-[var(--neutral-border)] bg-[var(--neutral-bg)] pl-9 pr-3 py-1.5 text-sm text-[var(--neutral-text)] placeholder:text-[var(--neutral-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Light/Dark Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              className="p-2 rounded-xl border border-[var(--neutral-border)] bg-[var(--neutral-card)] text-[var(--neutral-muted)] hover:text-[var(--neutral-text)] hover:bg-[var(--neutral-surface)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] cursor-pointer"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setNotifOpen(!notifOpen);
                  setProfileOpen(false);
                }}
                aria-label={`Notifications (${unreadCount} unread)`}
                className="relative p-2 rounded-xl border border-[var(--neutral-border)] bg-[var(--neutral-card)] text-[var(--neutral-muted)] hover:text-[var(--neutral-text)] hover:bg-[var(--neutral-surface)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] cursor-pointer"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--primary)] text-white text-[10px] font-semibold flex items-center justify-center tabular-nums">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-[var(--neutral-border)] bg-[var(--neutral-card)] shadow-xl p-3 space-y-2 z-40">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs font-semibold text-[var(--neutral-text)]">
                      Notifications
                    </span>
                    <Link
                      href="/dashboard/student/notifications"
                      onClick={() => setNotifOpen(false)}
                      className="text-xs font-medium text-[var(--primary)] hover:underline"
                    >
                      View all
                    </Link>
                  </div>
                  <div className="divide-y divide-[var(--neutral-border)]">
                    {STUDENT_NOTIFICATIONS.slice(0, 3).map((n) => (
                      <div key={n.id} className="py-2.5 px-1 space-y-0.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-[var(--neutral-text)] truncate">
                            {n.title}
                          </span>
                          {n.unread && (
                            <span className="w-2 h-2 rounded-full bg-[var(--primary)] shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-[var(--neutral-muted)] line-clamp-2">{n.desc}</p>
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
                onClick={() => {
                  setProfileOpen(!profileOpen);
                  setNotifOpen(false);
                }}
                aria-label="Open profile menu"
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--neutral-border)] bg-[var(--neutral-card)] px-2.5 py-1.5 text-sm hover:bg-[var(--neutral-surface)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] cursor-pointer"
              >
                <span className="w-6 h-6 rounded-full bg-[var(--primary)] text-white text-xs font-semibold flex items-center justify-center">
                  AC
                </span>
                <span className="hidden sm:inline text-xs font-medium text-[var(--neutral-text)]">
                  Alex Chen
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-[var(--neutral-muted)]" />
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-52 rounded-2xl border border-[var(--neutral-border)] bg-[var(--neutral-card)] shadow-xl p-1.5 z-40">
                  <Link
                    href="/dashboard/student/profile"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-[var(--neutral-text)] hover:bg-[var(--neutral-surface)]"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>My Profile</span>
                  </Link>
                  <Link
                    href="/change-password"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-[var(--neutral-text)] hover:bg-[var(--neutral-surface)]"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Change Password</span>
                  </Link>
                  <Link
                    href="/login"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-[var(--neutral-muted)] hover:bg-[var(--neutral-surface)] hover:text-[var(--neutral-text)]"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav
        aria-label="Mobile quick navigation"
        className="md:hidden fixed bottom-0 inset-x-0 z-30 h-16 border-t border-[var(--neutral-border)] bg-[var(--neutral-card)] grid grid-cols-5"
      >
        {[
          STUDENT_NAV_ITEMS[0],
          STUDENT_NAV_ITEMS[1],
          STUDENT_NAV_ITEMS[6],
          STUDENT_NAV_ITEMS[7],
          STUDENT_NAV_ITEMS[10],
        ].map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 text-[11px] font-medium",
                active ? "text-[var(--primary)] dark:text-indigo-300" : "text-[var(--neutral-muted)]"
              )}
            >
              <Icon className="w-4 h-4" />
              <span className="truncate max-w-[64px]">{item.label.split(" ")[0]}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
