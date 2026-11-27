"use client";

import React, { useState } from "react";
import { MessageSquare } from "lucide-react";
import { AIBadge, LecturerApprovedBadge, AIAdvisoryBanner } from "@/components/student/AIBadgeAndBanner";
import {
  EmptyState,
  ErrorState,
  SkeletonLoader,
  StatePreviewBar,
  ViewStateMode,
} from "@/components/student/StateViews";

const FEEDBACK_ITEMS = [
  {
    id: "fb-1",
    project: "IT2040 • IoT Lab Energy Telemetry Portal",
    author: "Prof. Marcus Sterling",
    type: "lecturer" as const,
    time: "1 day ago",
    message:
      "Excellent normalization and indexing benchmarks. Your SQL migrations match the ER diagram cleanly.",
  },
  {
    id: "fb-2",
    project: "CS3021 • Distributed Campus Library",
    author: "Gemini AI Reviewer",
    type: "ai" as const,
    time: "3 hours ago",
    message:
      "Advisory note: Add transaction locking around study_slots reservations to avoid race conditions under concurrent requests.",
  },
  {
    id: "fb-3",
    project: "SE3100 • AI Peer Code Review Sandbox",
    author: "Dr. Elena Vance",
    type: "lecturer" as const,
    time: "2 days ago",
    message:
      "Please revise Section 4 of your proposal to clarify how private repository tokens are scoped and rotated.",
  },
];

export default function StudentFeedbackPage() {
  const [viewMode, setViewMode] = useState<ViewStateMode>("ready");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] leading-tight font-semibold text-[var(--neutral-text)] tracking-tight">
            Feedback Inbox
          </h1>
          <p className="mt-1 text-sm text-[var(--neutral-muted)]">
            Review lecturer comments alongside clearly labeled AI advisory suggestions.
          </p>
        </div>
        <StatePreviewBar mode={viewMode} onChange={setViewMode} />
      </div>

      {viewMode === "loading" && <SkeletonLoader rows={3} />}
      {viewMode === "error" && <ErrorState onRetry={() => setViewMode("ready")} />}
      {viewMode === "empty" && (
        <EmptyState
          title="Your feedback inbox is empty"
          description="Feedback from supervisors and AI advisory reviews will appear here."
          actionLabel="Refresh Inbox"
          onAction={() => setViewMode("ready")}
        />
      )}

      {viewMode === "ready" && (
        <div className="space-y-4">
          <AIAdvisoryBanner />

          {FEEDBACK_ITEMS.map((item) => (
            <article
              key={item.id}
              className={
                item.type === "ai"
                  ? "rounded-2xl border border-[var(--accent-border)] border-l-4 border-l-[var(--accent)] bg-[var(--accent-soft)] p-5 space-y-2.5"
                  : "rounded-2xl border border-[var(--neutral-border)] bg-[var(--neutral-card)] p-5 space-y-2.5"
              }
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-[var(--primary)] shrink-0" />
                  <span className="text-xs font-semibold text-[var(--neutral-text)]">
                    {item.project}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {item.type === "ai" ? (
                    <AIBadge />
                  ) : (
                    <LecturerApprovedBadge label="Supervisor Feedback" />
                  )}
                  <span className="text-xs text-[var(--neutral-muted)]">{item.time}</span>
                </div>
              </div>
              <p className="text-sm text-[var(--neutral-text)] leading-relaxed">{item.message}</p>
              <p className="text-xs text-[var(--neutral-muted)]">From: {item.author}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
