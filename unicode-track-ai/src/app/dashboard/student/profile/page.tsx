"use client";

import React, { useState } from "react";
import Link from "next/link";
import { KeyRound, GitBranch, Save } from "lucide-react";
import {
  ConfirmDialog,
  EmptyState,
  ErrorState,
  LockedField,
  SkeletonLoader,
  StatePreviewBar,
  StudentToast,
  ViewStateMode,
} from "@/components/student/StateViews";

export default function StudentProfilePage() {
  const [viewMode, setViewMode] = useState<ViewStateMode>("ready");
  const [fullName, setFullName] = useState("Alex Chen");
  const [githubHandle, setGithubHandle] = useState("alexchen-dev");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] leading-tight font-semibold text-[var(--neutral-text)] tracking-tight">
            My Profile
          </h1>
          <p className="mt-1 text-sm text-[var(--neutral-muted)]">
            Manage your student profile, GitHub identity, and account security settings.
          </p>
        </div>
        <StatePreviewBar mode={viewMode} onChange={setViewMode} />
      </div>

      {viewMode === "loading" && <SkeletonLoader rows={3} />}
      {viewMode === "error" && <ErrorState onRetry={() => setViewMode("ready")} />}
      {viewMode === "empty" && (
        <EmptyState
          title="Profile unavailable"
          description="We could not load your student profile details."
          actionLabel="Reload Profile"
          onAction={() => setViewMode("ready")}
        />
      )}

      {viewMode === "ready" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-2xl border border-[var(--neutral-border)] bg-[var(--neutral-card)] p-6 space-y-5">
            <h2 className="text-base font-semibold text-[var(--neutral-text)]">
              Academic & Account Details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="student-full-name"
                  className="text-xs font-medium text-[var(--neutral-muted)]"
                >
                  Full Name
                </label>
                <input
                  id="student-full-name"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-xl border border-[var(--neutral-border)] bg-[var(--neutral-bg)] px-3.5 py-2 text-sm text-[var(--neutral-text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                />
              </div>

              <LockedField
                label="University Student ID"
                value="STU-2026-0418"
                tooltip="Managed by university registrar"
              />

              <LockedField
                label="Academic Email"
                value="alex.chen@university.edu"
                tooltip="Institutional email cannot be changed"
              />

              <div className="space-y-1.5">
                <label
                  htmlFor="student-github"
                  className="text-xs font-medium text-[var(--neutral-muted)]"
                >
                  GitHub Username
                </label>
                <div className="relative">
                  <GitBranch
                    className="w-4 h-4 text-[var(--neutral-muted)] absolute left-3 top-1/2 -translate-y-1/2"
                    aria-hidden="true"
                  />
                  <input
                    id="student-github"
                    type="text"
                    value={githubHandle}
                    onChange={(e) => setGithubHandle(e.target.value)}
                    className="w-full rounded-xl border border-[var(--neutral-border)] bg-[var(--neutral-bg)] pl-9 pr-3.5 py-2 text-sm text-[var(--neutral-text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setConfirmOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] px-4 py-2 text-sm font-medium text-white transition-colors cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--neutral-border)] bg-[var(--neutral-card)] p-6 space-y-4 h-fit">
            <h2 className="text-base font-semibold text-[var(--neutral-text)]">Security</h2>
            <p className="text-xs text-[var(--neutral-muted)] leading-relaxed">
              Keep your university account secure by updating your password regularly.
            </p>
            <Link
              href="/change-password"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--neutral-border)] bg-[var(--neutral-surface)] hover:bg-[var(--primary-soft)] hover:text-[var(--primary)] px-4 py-2.5 text-sm font-medium text-[var(--neutral-text)] transition-colors"
            >
              <KeyRound className="w-4 h-4" />
              <span>Change Password</span>
            </Link>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="Save profile updates?"
        description="Your updated display name and GitHub username will be visible to your project supervisors and group members."
        confirmLabel="Save Profile"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          setToast("Profile updated successfully");
        }}
      />

      <StudentToast message={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
