"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { useAdminData } from "@/context/AdminDataContext";
import { CreateProjectPrototypeForm } from "@/components/projects/CreateProjectPrototypeForm";

export default function CreateProjectPage() {
  const { activeRole } = useAdminData();

  if (activeRole === "student") {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-card border border-border rounded-[16px] text-center space-y-4 shadow-sm">
        <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-foreground">Access Restricted</h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Students cannot author or create academic coursework projects. Projects are curated and assigned by course lecturers. You can participate in your assigned workspaces.
        </p>
        <Link
          href="/dashboard/projects"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-accent text-accent-foreground hover:bg-accent/90 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to My Projects
        </Link>
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="max-w-[1100px] mx-auto py-12 px-4 text-center text-muted-foreground text-sm font-sans">
          Loading project creation wizard...
        </div>
      }
    >
      <div className="py-2">
        <CreateProjectPrototypeForm standalone />
      </div>
    </Suspense>
  );
}
