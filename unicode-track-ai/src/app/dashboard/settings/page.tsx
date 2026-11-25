"use client";

import React from "react";
import { 
  Building2, 
  KeyRound
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
            Institution Settings
          </h2>
          <Badge variant="teal" size="sm">
            Administrator
          </Badge>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
          Manage university profile preferences, security protocols, and academic term settings.
        </p>
      </div>

      {/* University Profile Card */}
      <div className="bg-card p-6 rounded-[16px] border border-border shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-teal-600" />
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
              University Workspace Profile
            </h3>
          </div>
          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            Provisioned
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="text-muted-foreground font-semibold block text-[11px] mb-1">
              University Name
            </label>
            <input
              type="text"
              readOnly
              value="State University of Technology"
              className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-foreground font-medium"
            />
          </div>

          <div>
            <label className="text-muted-foreground font-semibold block text-[11px] mb-1">
              Designated Faculty
            </label>
            <input
              type="text"
              readOnly
              value="Faculty of Computing & Information Systems"
              className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-foreground font-medium"
            />
          </div>

          <div>
            <label className="text-muted-foreground font-semibold block text-[11px] mb-1">
              Location
            </label>
            <input
              type="text"
              readOnly
              value="Cambridge, United Kingdom"
              className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-foreground font-medium"
            />
          </div>

          <div>
            <label className="text-muted-foreground font-semibold block text-[11px] mb-1">
              Administrator Email
            </label>
            <input
              type="text"
              readOnly
              value="admin@university.edu"
              className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-foreground font-mono"
            />
          </div>
        </div>
      </div>

      {/* Security & Credentials Policy Card */}
      <div className="bg-card p-6 rounded-[16px] border border-border shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
              Staff Security & Default Password Policy
            </h3>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-muted border border-border text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-foreground">Assigned Lecturer Default Password</span>
            <code className="font-mono font-bold text-teal-800 bg-card px-2.5 py-1 rounded border border-teal-200">
              UniCode@2004
            </code>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            All newly registered lecturer accounts receive this temporary password. Upon first authentication, lecturers are forced to navigate to <code>/change-password</code> before gaining access to academic workspaces.
          </p>
        </div>
      </div>
    </div>
  );
}
