"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Network, ArrowRight, Sparkles } from "lucide-react";
import { AIAdvisoryBanner, AIBadge, AICard } from "@/components/student/AIBadgeAndBanner";
import { StatusBadge, AISeverityBadge } from "@/components/student/StatusBadge";
import { UploadDropzone } from "@/components/student/UploadDropzone";
import {
  EmptyState,
  ErrorState,
  SkeletonLoader,
  StatePreviewBar,
  StudentToast,
  ViewStateMode,
} from "@/components/student/StateViews";

export default function StudentERDiagramsPage() {
  const [viewMode, setViewMode] = useState<ViewStateMode>("ready");
  const [toast, setToast] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] leading-tight font-semibold text-[var(--neutral-text)] tracking-tight">
            ER Diagrams
          </h1>
          <p className="mt-1 text-sm text-[var(--neutral-muted)]">
            Upload your entity-relationship diagrams and inspect AI schema normalization feedback.
          </p>
        </div>
        <StatePreviewBar mode={viewMode} onChange={setViewMode} />
      </div>

      {viewMode === "loading" && <SkeletonLoader rows={3} />}
      {viewMode === "error" && <ErrorState onRetry={() => setViewMode("ready")} />}
      {viewMode === "empty" && (
        <EmptyState
          title="No ER diagram uploaded"
          description="Upload your ER diagram (PNG, SVG, or PDF) to run an AI schema analysis."
          actionLabel="Upload Diagram"
          onAction={() => setViewMode("ready")}
        />
      )}

      {viewMode === "ready" && (
        <div className="space-y-6">
          <AIAdvisoryBanner />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Diagram Preview Card */}
            <div className="lg:col-span-2 rounded-2xl border border-[var(--neutral-border)] bg-[var(--neutral-card)] p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Network className="w-4 h-4 text-[var(--primary)]" />
                  <h2 className="text-base font-semibold text-[var(--neutral-text)]">
                    CS3021 — Campus Library Schema v2.svg
                  </h2>
                </div>
                <StatusBadge status="approved" label="Verified" />
              </div>

              {/* Clean Single-Palette SVG ER Preview */}
              <div className="rounded-xl border border-[var(--neutral-border)] bg-[var(--neutral-bg)] p-6 overflow-x-auto">
                <svg viewBox="0 0 640 200" className="w-full min-w-[480px] h-44" aria-label="ER Diagram Preview">
                  <rect x="20" y="30" width="150" height="120" rx="12" fill="var(--neutral-card)" stroke="var(--primary)" strokeWidth="2" />
                  <text x="95" y="55" textAnchor="middle" fill="var(--primary)" fontSize="13" fontWeight="600">users</text>
                  <line x1="20" y1="68" x2="170" y2="68" stroke="var(--neutral-border)" />
                  <text x="34" y="88" fill="var(--neutral-text)" fontSize="11">PK id (uuid)</text>
                  <text x="34" y="108" fill="var(--neutral-muted)" fontSize="11">email (unique)</text>
                  <text x="34" y="128" fill="var(--neutral-muted)" fontSize="11">role (enum)</text>

                  <line x1="170" y1="90" x2="245" y2="90" stroke="var(--primary)" strokeWidth="2" />

                  <rect x="245" y="30" width="160" height="120" rx="12" fill="var(--neutral-card)" stroke="var(--primary)" strokeWidth="2" />
                  <text x="325" y="55" textAnchor="middle" fill="var(--primary)" fontSize="13" fontWeight="600">reservations</text>
                  <line x1="245" y1="68" x2="405" y2="68" stroke="var(--neutral-border)" />
                  <text x="259" y="88" fill="var(--neutral-text)" fontSize="11">PK id (uuid)</text>
                  <text x="259" y="108" fill="var(--neutral-muted)" fontSize="11">FK user_id</text>
                  <text x="259" y="128" fill="var(--neutral-muted)" fontSize="11">FK slot_id</text>

                  <line x1="405" y1="90" x2="475" y2="90" stroke="var(--primary)" strokeWidth="2" />

                  <rect x="475" y="30" width="145" height="120" rx="12" fill="var(--neutral-card)" stroke="var(--neutral-border)" strokeWidth="2" />
                  <text x="547" y="55" textAnchor="middle" fill="var(--neutral-text)" fontSize="13" fontWeight="600">study_slots</text>
                  <line x1="475" y1="68" x2="620" y2="68" stroke="var(--neutral-border)" />
                  <text x="489" y="88" fill="var(--neutral-text)" fontSize="11">PK id (uuid)</text>
                  <text x="489" y="108" fill="var(--neutral-muted)" fontSize="11">room_code</text>
                  <text x="489" y="128" fill="var(--neutral-muted)" fontSize="11">capacity</text>
                </svg>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-[var(--neutral-muted)]">
                  3NF Normalization Score: 94%
                </span>
                <Link
                  href="/dashboard/student/database-review"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--primary)] hover:underline"
                >
                  <span>Open ER vs. Implementation Review</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* AI Analysis Panel + Upload */}
            <div className="space-y-4">
              <AICard className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <AIBadge label="AI Analysis Panel" />
                  <Sparkles className="w-4 h-4 text-[var(--accent)]" />
                </div>
                <div className="space-y-2.5">
                  <div className="rounded-xl border border-[var(--accent-border)] bg-[var(--neutral-card)] p-3 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-[var(--neutral-text)]">
                        Unique Constraint
                      </span>
                      <AISeverityBadge severity="medium" />
                    </div>
                    <p className="text-xs text-[var(--neutral-muted)]">
                      Add a unique constraint on (slot_id, reserved_date) to enforce single booking per slot.
                    </p>
                  </div>
                  <div className="rounded-xl border border-[var(--accent-border)] bg-[var(--neutral-card)] p-3 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-[var(--neutral-text)]">
                        Foreign Key Cascade
                      </span>
                      <AISeverityBadge severity="info" />
                    </div>
                    <p className="text-xs text-[var(--neutral-muted)]">
                      Consider ON DELETE RESTRICT for auditability on historical reservations.
                    </p>
                  </div>
                </div>
              </AICard>

              <div className="rounded-2xl border border-[var(--neutral-border)] bg-[var(--neutral-card)] p-5 space-y-3">
                <h2 className="text-sm font-semibold text-[var(--neutral-text)]">
                  Upload New Diagram
                </h2>
                <UploadDropzone
                  accept=".png,.svg,.pdf"
                  label="Drop PNG, SVG, or PDF"
                  onFileSelected={(f) => setToast(`Uploaded ${f.name} for AI analysis`)}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <StudentToast message={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
