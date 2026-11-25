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
    success: "bg-success-soft text-success border-accent-border",
    error: "bg-danger-soft text-danger border-red-900/60",
    info: "bg-accent-soft text-accent border-accent-border",
  };

  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-success shrink-0" />,
    error: <AlertCircle className="w-4 h-4 text-danger shrink-0" />,
    info: <Info className="w-4 h-4 text-accent shrink-0" />,
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-md animate-in slide-in-from-bottom-3 duration-200">
      <div className={`p-3.5 rounded-[12px] border shadow-2xl flex items-center justify-between gap-3 text-xs font-medium ${bgStyles[toast.type]}`}>
        <div className="flex items-center gap-2">
          {icons[toast.type]}
          <span>{toast.message}</span>
        </div>
        <button
          onClick={dismissToast}
          className="p-1 hover:opacity-75 focus:outline-none cursor-pointer"
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
  const isWidePage = pathname?.includes("/dashboard/test") || pathname?.includes("/workspace");

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
    <div className="min-h-screen flex bg-background text-foreground font-sans antialiased">
      {/* Sidebar */}
      <Suspense fallback={<div className="w-20 md:w-[252px] bg-background border-r border-border shrink-0" />}>
        <AdminSidebar
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
        />
      </Suspense>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header Bar */}
        <header className="md:hidden sticky top-0 z-40 h-14 bg-background/95 backdrop-blur-md border-b border-border px-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="p-2 rounded-[8px] text-muted-foreground hover:text-foreground hover:bg-muted focus:outline-none"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="flex items-center justify-center w-7 h-7 rounded-[8px] bg-accent-soft border border-accent-border text-accent">
                <Code2 className="w-4 h-4 text-accent" />
              </div>
              <span className="text-sm font-bold text-foreground tracking-tight">UniCodeTrack</span>
              <span className="text-[9px] font-semibold px-1 py-0.5 rounded-full bg-accent-soft text-accent border border-accent-border">
                AI
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
              {isLecturer ? "Lecturer" : activeRole === "student" ? "Student" : "Admin"}
            </span>
          </div>
        </header>

        <Suspense fallback={<div className="h-16 bg-background border-b border-border" />}>
          <AdminTopNavbar onToggleMobileMenu={() => setMobileOpen(!mobileOpen)} />
        </Suspense>
        <main className={`flex-1 p-4 sm:p-6 md:p-8 w-full mx-auto space-y-5 ${isWidePage ? "max-w-[1920px]" : "max-w-7xl"}`}>
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
      <Suspense fallback={<div className="min-h-screen bg-background" />}>
        <DashboardShell>{children}</DashboardShell>
      </Suspense>
    </AdminDataProvider>
  );
}
