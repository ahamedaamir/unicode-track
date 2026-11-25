"use client";

import React, { useState, Suspense, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { AdminDataProvider, useAdminData } from "@/context/AdminDataContext";
import { AdminSidebar } from "@/components/dashboard/AdminSidebar";
import { AdminTopNavbar } from "@/components/dashboard/AdminTopNavbar";
import { CheckCircle2, AlertCircle, Info, X, Menu, Code2 } from "lucide-react";

function ToastBanner() {
  const { toast, dismissToast } = useAdminData();
  if (!toast) return null;

  const bgStyles = {
    success: "bg-emerald-50 text-emerald-900 border-emerald-200",
    error: "bg-rose-50 text-rose-900 border-rose-200",
    info: "bg-teal-50 text-teal-900 border-teal-200",
  };

  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />,
    error: <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />,
    info: <Info className="w-4 h-4 text-teal-600 shrink-0" />,
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-md animate-in slide-in-from-bottom-3 duration-200">
      <div className={`p-3.5 rounded-xl border shadow-lg flex items-center justify-between gap-3 text-xs font-medium ${bgStyles[toast.type]}`}>
        <div className="flex items-center gap-2">
          {icons[toast.type]}
          <span>{toast.message}</span>
        </div>
        <button
          onClick={dismissToast}
          className="p-1 hover:opacity-75 focus:outline-none"
          aria-label="Dismiss message"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { activeRole } = useAdminData();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isLecturer = activeRole === "lecturer";
  const isDarkPage =
    isLecturer ||
    pathname.startsWith("/dashboard/projects") ||
    pathname.startsWith("/dashboard/evaluation") ||
    pathname.startsWith("/dashboard/hackathons") ||
    pathname.startsWith("/dashboard/test") ||
    pathname.startsWith("/dashboard/quizzes") ||
    pathname.startsWith("/dashboard/profile");

  useEffect(() => {
    try {
      const pendingStudent = sessionStorage.getItem("unicodetrack_pending_student_email");
      if (pendingStudent) {
        router.replace("/change-password");
        return;
      }

      const rawUser = sessionStorage.getItem("unicodetrack_authenticated_user");
      if (rawUser) {
        const user = JSON.parse(rawUser);
        if (user.role === "student" && user.mustChangePassword) {
          router.replace("/change-password");
        }
      }
    } catch {
      // Ignore
    }
  }, [router]);

  return (
    <div
      className={`min-h-screen flex ${
        isDarkPage ? "bg-[#070b13] text-slate-100" : "bg-[#F8FAFC] text-[#0B1220]"
      } font-sans antialiased`}
    >
      {/* Sidebar */}
      <Suspense fallback={<div className="w-20 md:w-64 bg-[#0B1220] shrink-0" />}>
        <AdminSidebar
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
        />
      </Suspense>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header Bar for dark / lecturer / student pages where AdminTopNavbar is suppressed */}
        {isDarkPage && (
          <header className="md:hidden sticky top-0 z-40 h-14 bg-[#0b1220]/95 backdrop-blur-md border-b border-slate-800 px-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none"
                aria-label="Open navigation menu"
              >
                <Menu className="w-5 h-5" />
              </button>
              <Link href="/dashboard" className="flex items-center gap-2">
                <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-slate-900 border border-slate-700 text-white">
                  <Code2 className="w-4 h-4 text-teal-400" />
                </div>
                <span className="text-sm font-bold text-white tracking-tight">UniCodeTrack</span>
                <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  AI
                </span>
              </Link>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {isLecturer ? "Lecturer" : activeRole === "student" ? "Student" : "Admin"}
              </span>
            </div>
          </header>
        )}

        <Suspense fallback={<div className="h-16 bg-white border-b border-slate-200" />}>
          <AdminTopNavbar onToggleMobileMenu={() => setMobileOpen(!mobileOpen)} />
        </Suspense>
        <main
          className={`flex-1 p-3 sm:p-5 md:p-6 lg:p-8 max-w-7xl w-full mx-auto ${
            isDarkPage ? "bg-[#070b13] text-slate-100" : ""
          }`}
        >
          {children}
        </main>
      </div>

      {/* Global Notification Toast */}
      <ToastBanner />
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminDataProvider>
      <Suspense fallback={<div className="min-h-screen bg-[#070b13]" />}>
        <DashboardShell>{children}</DashboardShell>
      </Suspense>
    </AdminDataProvider>
  );
}
