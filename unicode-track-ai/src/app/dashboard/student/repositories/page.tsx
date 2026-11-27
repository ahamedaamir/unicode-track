"use client";

import React, { useState } from "react";
import { GitBranch, RefreshCw, GitPullRequest, GitCommit } from "lucide-react";
import { STUDENT_PROJECTS } from "@/components/student/studentData";
import { CommitActivityChart } from "@/components/student/StudentCharts";
import { StatusBadge } from "@/components/student/StatusBadge";
import {
  EmptyState,
  ErrorState,
  SkeletonLoader,
  StatePreviewBar,
  StudentToast,
  ViewStateMode,
} from "@/components/student/StateViews";

export default function StudentRepositoriesPage() {
  const [viewMode, setViewMode] = useState<ViewStateMode>("ready");
  const [toast, setToast] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] leading-tight font-semibold text-[var(--neutral-text)] tracking-tight">
            GitHub Repositories
          </h1>
          <p className="mt-1 text-sm text-[var(--neutral-muted)]">
            Monitor synchronized repositories, commit trends, and pull request activity.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setToast("GitHub repository telemetry synced")}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] px-3.5 py-2 text-xs font-medium text-white transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync Now</span>
          </button>
          <StatePreviewBar mode={viewMode} onChange={setViewMode} />
        </div>
      </div>

      {viewMode === "loading" && <SkeletonLoader rows={3} />}
      {viewMode === "error" && <ErrorState onRetry={() => setViewMode("ready")} />}
      {viewMode === "empty" && (
        <EmptyState
          title="No GitHub repository connected"
          description="Connect your group's GitHub repository to track commits, branches, and AI code reviews."
          actionLabel="Connect Repository"
          onAction={() => setViewMode("ready")}
        />
      )}

      {viewMode === "ready" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {STUDENT_PROJECTS.map((proj) => (
              <div
                key={proj.id}
                className="rounded-2xl border border-[var(--neutral-border)] bg-[var(--neutral-card)] p-5 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[var(--primary)] dark:text-indigo-300">
                    {proj.code}
                  </span>
                  <StatusBadge status="approved" label="Connected" />
                </div>
                <div className="flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-[var(--neutral-muted)] shrink-0" />
                  <span className="font-mono text-xs font-medium text-[var(--neutral-text)] truncate">
                    {proj.repoName}
                  </span>
                </div>
                <div className="pt-2 border-t border-[var(--neutral-border)] flex items-center justify-between text-xs text-[var(--neutral-muted)]">
                  <span className="inline-flex items-center gap-1">
                    <GitCommit className="w-3.5 h-3.5 text-[var(--primary)]" />
                    <strong className="text-[var(--neutral-text)] tabular-nums">{proj.commits}</strong> commits
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <GitPullRequest className="w-3.5 h-3.5 text-[var(--primary)]" />
                    <span>4 open PRs</span>
                  </span>
                </div>
              </div>
            ))}
          </div>

          <section className="rounded-2xl border border-[var(--neutral-border)] bg-[var(--neutral-card)] p-5 space-y-4">
            <div>
              <h2 className="text-base font-semibold text-[var(--neutral-text)]">
                Commit & AI Review Telemetry
              </h2>
              <p className="text-xs text-[var(--neutral-muted)]">
                Weekly commit cadence across connected repositories
              </p>
            </div>
            <CommitActivityChart />
          </section>
        </div>
      )}

      <StudentToast message={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
