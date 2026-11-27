"use client";

import React, { useState } from "react";
import { FileText } from "lucide-react";
import { StatusBadge, StudentStatus } from "@/components/student/StatusBadge";
import { AIBadge, AICard, AIAdvisoryBanner } from "@/components/student/AIBadgeAndBanner";
import { UploadDropzone } from "@/components/student/UploadDropzone";
import {
  EmptyState,
  ErrorState,
  SkeletonLoader,
  StatePreviewBar,
  StudentToast,
  ViewStateMode,
} from "@/components/student/StateViews";

const PROPOSALS: {
  id: string;
  course: string;
  title: string;
  version: string;
  status: StudentStatus;
  updatedAt: string;
}[] = [
  {
    id: "prop-1",
    course: "CS3021",
    title: "Distributed Campus Library Architecture Proposal",
    version: "v2.1",
    status: "approved",
    updatedAt: "Nov 10, 2026",
  },
  {
    id: "prop-2",
    course: "SE3100",
    title: "AI-Assisted Peer Code Review Sandbox Scope",
    version: "v1.2",
    status: "revision_requested",
    updatedAt: "Nov 25, 2026",
  },
  {
    id: "prop-3",
    course: "IT2040",
    title: "IoT Lab Energy Telemetry Data Model",
    version: "v1.0",
    status: "submitted",
    updatedAt: "Nov 21, 2026",
  },
];

export default function StudentProposalsPage() {
  const [viewMode, setViewMode] = useState<ViewStateMode>("ready");
  const [toast, setToast] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] leading-tight font-semibold text-[var(--neutral-text)] tracking-tight">
            Proposals
          </h1>
          <p className="mt-1 text-sm text-[var(--neutral-muted)]">
            Submit project proposals, track lecturer review status, and upload revisions.
          </p>
        </div>
        <StatePreviewBar mode={viewMode} onChange={setViewMode} />
      </div>

      {viewMode === "loading" && <SkeletonLoader rows={3} />}
      {viewMode === "error" && <ErrorState onRetry={() => setViewMode("ready")} />}
      {viewMode === "empty" && (
        <EmptyState
          title="No proposals submitted"
          description="Upload your team's project proposal PDF to begin lecturer review."
          actionLabel="Upload Proposal"
          onAction={() => setViewMode("ready")}
        />
      )}

      {viewMode === "ready" && (
        <div className="space-y-6">
          <AIAdvisoryBanner />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {PROPOSALS.map((prop) => (
                <div
                  key={prop.id}
                  className="rounded-2xl border border-[var(--neutral-border)] bg-[var(--neutral-card)] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[var(--primary)]" />
                      <span className="text-xs font-semibold text-[var(--primary)] dark:text-indigo-300">
                        {prop.course} • {prop.version}
                      </span>
                    </div>
                    <h2 className="text-base font-semibold text-[var(--neutral-text)]">
                      {prop.title}
                    </h2>
                    <p className="text-xs text-[var(--neutral-muted)]">
                      Updated {prop.updatedAt}
                    </p>
                  </div>
                  <StatusBadge status={prop.status} />
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-[var(--neutral-border)] bg-[var(--neutral-card)] p-5 space-y-4">
                <h2 className="text-base font-semibold text-[var(--neutral-text)]">
                  Submit New Revision
                </h2>
                <UploadDropzone
                  accept=".pdf,.docx"
                  label="Drop proposal PDF here"
                  onFileSelected={(f) => setToast(`Uploaded ${f.name} for review`)}
                />
              </div>

              <AICard className="space-y-2">
                <AIBadge label="AI Pre-Check (advisory)" />
                <p className="text-sm font-semibold text-[var(--neutral-text)]">
                  Scope & Rubric Alignment
                </p>
                <p className="text-xs text-[var(--neutral-muted)] leading-relaxed">
                  SE3100 v1.2 is missing an explicit data retention section. Add 2-3 sentences before resubmitting.
                </p>
              </AICard>
            </div>
          </div>
        </div>
      )}

      <StudentToast message={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
