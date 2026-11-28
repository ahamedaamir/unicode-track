"use client";

import React, { useState } from "react";
import { STUDENT_PROJECTS } from "@/components/student/studentData";
import {
  AIAdvisoryBanner,
  AIBadge,
  AICard,
  LecturerApprovedBadge,
  LockedMarkPlaceholder,
} from "@/components/student/AIBadgeAndBanner";
import { LinearProgressBar } from "@/components/student/ProgressIndicators";
import {
  EmptyState,
  ErrorState,
  SkeletonLoader,
  StatePreviewBar,
  ViewStateMode,
} from "@/components/student/StateViews";

export default function StudentEvaluationsPage() {
  const [viewMode, setViewMode] = useState<ViewStateMode>("ready");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] leading-tight font-semibold text-[var(--neutral-text)] tracking-tight">
            Evaluations & Marks
          </h1>
          <p className="mt-1 text-sm text-[var(--neutral-muted)]">
            Compare provisional AI rubric feedback with official lecturer-approved final marks.
          </p>
        </div>
        <StatePreviewBar mode={viewMode} onChange={setViewMode} />
      </div>

      {viewMode === "loading" && <SkeletonLoader rows={3} />}
      {viewMode === "error" && <ErrorState onRetry={() => setViewMode("ready")} />}
      {viewMode === "empty" && (
        <EmptyState
          title="No evaluations available"
          description="Evaluations will appear here once your submissions are reviewed."
          actionLabel="Refresh Marks"
          onAction={() => setViewMode("ready")}
        />
      )}

      {viewMode === "ready" && (
        <div className="space-y-6">
          <AIAdvisoryBanner />

          <div className="space-y-5">
            {STUDENT_PROJECTS.map((proj) => (
              <section
                key={proj.id}
                className="rounded-2xl border border-[var(--neutral-border)] bg-[var(--neutral-card)] p-5 space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-semibold text-[var(--primary)] dark:text-indigo-300">
                      {proj.code} • {proj.course}
                    </span>
                    <h2 className="text-base font-semibold text-[var(--neutral-text)]">
                      {proj.title}
                    </h2>
                  </div>
                  <span className="text-xs text-[var(--neutral-muted)]">
                    Supervisor: {proj.supervisor}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <AICard className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <AIBadge />
                      <span className="text-lg font-semibold text-[var(--neutral-text)] tabular-nums">
                        {proj.aiScore} / 100
                      </span>
                    </div>
                    <LinearProgressBar value={proj.aiScore} label="Provisional rubric alignment" />
                    <p className="text-xs text-[var(--neutral-muted)]">
                      Advisory estimate generated from repository commits, ER alignment, and documentation.
                    </p>
                  </AICard>

                  {proj.finalMark !== null ? (
                    <div className="rounded-2xl border border-[var(--primary)] bg-[var(--neutral-bg)] p-5 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <LecturerApprovedBadge />
                        <span className="text-lg font-semibold text-[var(--primary)] dark:text-indigo-300 tabular-nums">
                          {proj.finalMark} / 100
                        </span>
                      </div>
                      <LinearProgressBar value={proj.finalMark} label="Official final grade" />
                      <p className="text-xs text-[var(--neutral-muted)]">
                        Approved and released by {proj.supervisor}.
                      </p>
                    </div>
                  ) : (
                    <LockedMarkPlaceholder />
                  )}
                </div>
              </section>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
