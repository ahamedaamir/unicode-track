"use client";

import React, { useState, Suspense, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AdminDataProvider, useAdminData } from "@/context/AdminDataContext";
import { AdminSidebar } from "@/components/dashboard/AdminSidebar";
import { AdminTopNavbar } from "@/components/dashboard/AdminTopNavbar";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

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
        <Suspense fallback={<div className="h-16 bg-white border-b border-slate-200" />}>
          <AdminTopNavbar onToggleMobileMenu={() => setMobileOpen(!mobileOpen)} />
        </Suspense>
        <main
          className={`flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto ${
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
