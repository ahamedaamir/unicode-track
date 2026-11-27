"use client";

import React, { useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { STUDENT_NOTIFICATIONS } from "@/components/student/studentData";
import {
  EmptyState,
  ErrorState,
  SkeletonLoader,
  StatePreviewBar,
  StudentToast,
  ViewStateMode,
} from "@/components/student/StateViews";
import { cn } from "@/lib/utils";

export default function StudentNotificationsPage() {
  const [viewMode, setViewMode] = useState<ViewStateMode>("ready");
  const [items, setItems] = useState(STUDENT_NOTIFICATIONS);
  const [toast, setToast] = useState<string | null>(null);

  const markAllRead = () => {
    setItems((prev) => prev.map((n) => ({ ...n, unread: false })));
    setToast("All notifications marked as read");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] leading-tight font-semibold text-[var(--neutral-text)] tracking-tight">
            Notifications
          </h1>
          <p className="mt-1 text-sm text-[var(--neutral-muted)]">
            Stay updated on proposal reviews, repository syncs, AI advisories, and released marks.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={markAllRead}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--neutral-border)] bg-[var(--neutral-card)] px-3.5 py-2 text-xs font-medium text-[var(--neutral-text)] hover:bg-[var(--neutral-surface)] cursor-pointer"
          >
            <CheckCheck className="w-3.5 h-3.5 text-[var(--primary)]" />
            <span>Mark all read</span>
          </button>
          <StatePreviewBar mode={viewMode} onChange={setViewMode} />
        </div>
      </div>

      {viewMode === "loading" && <SkeletonLoader rows={4} />}
      {viewMode === "error" && <ErrorState onRetry={() => setViewMode("ready")} />}
      {viewMode === "empty" && (
        <EmptyState
          title="All caught up"
          description="You have no notifications at the moment."
          actionLabel="Refresh"
          onAction={() => setViewMode("ready")}
        />
      )}

      {viewMode === "ready" && (
        <div className="rounded-2xl border border-[var(--neutral-border)] bg-[var(--neutral-card)] divide-y divide-[var(--neutral-border)] overflow-hidden">
          {items.map((n) => (
            <div
              key={n.id}
              className={cn(
                "p-4 sm:p-5 flex items-start justify-between gap-4 transition-colors",
                n.unread && "bg-[var(--primary-soft)]/50"
              )}
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-[var(--neutral-surface)] border border-[var(--neutral-border)] flex items-center justify-center text-[var(--primary)] shrink-0">
                  <Bell className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-[var(--neutral-text)]">{n.title}</p>
                    <span className="rounded-full bg-[var(--neutral-surface)] px-2 py-0.5 text-[11px] font-medium text-[var(--neutral-muted)]">
                      {n.category}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--neutral-muted)]">{n.desc}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-[var(--neutral-muted)]">{n.time}</span>
                {n.unread && <span className="w-2.5 h-2.5 rounded-full bg-[var(--primary)]" />}
              </div>
            </div>
          ))}
        </div>
      )}

      <StudentToast message={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
