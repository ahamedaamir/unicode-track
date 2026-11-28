"use client";

import React, { useState } from "react";
import { Sparkles } from "lucide-react";
import { AI_CODE_FINDINGS } from "@/components/student/studentData";
import { AIAdvisoryBanner, AIBadge, AICard } from "@/components/student/AIBadgeAndBanner";
import { AISeverityBadge } from "@/components/student/StatusBadge";
import { CodeBlock } from "@/components/student/CodeBlock";
import {
  EmptyState,
  ErrorState,
  SkeletonLoader,
  StatePreviewBar,
  ViewStateMode,
} from "@/components/student/StateViews";

export default function StudentAIReviewsPage() {
  const [viewMode, setViewMode] = useState<ViewStateMode>("ready");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] leading-tight font-semibold text-[var(--neutral-text)] tracking-tight">
            AI Code Reviews
          </h1>
          <p className="mt-1 text-sm text-[var(--neutral-muted)]">
            Rubric-aligned automated code observations and suggested improvements.
          </p>
        </div>
        <StatePreviewBar mode={viewMode} onChange={setViewMode} />
      </div>

      {viewMode === "loading" && <SkeletonLoader rows={4} />}
      {viewMode === "error" && <ErrorState onRetry={() => setViewMode("ready")} />}
      {viewMode === "empty" && (
        <EmptyState
          title="No AI code reviews yet"
          description="Sync a repository or trigger an advisory review from your project workspace."
          actionLabel="Reload Reviews"
          onAction={() => setViewMode("ready")}
        />
      )}

      {viewMode === "ready" && (
        <div className="space-y-5">
          <AIAdvisoryBanner />

          {AI_CODE_FINDINGS.map((finding) => (
            <AICard key={finding.id} className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[var(--accent)] shrink-0" />
                  <h2 className="text-sm font-semibold text-[var(--neutral-text)]">
                    {finding.title}
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <AIBadge />
                  <AISeverityBadge severity={finding.severity} />
                </div>
              </div>

              <p className="text-xs text-[var(--neutral-muted)] leading-relaxed">
                {finding.suggestion}
              </p>

              <CodeBlock
                code={finding.snippet}
                filename={finding.file}
                highlightLine={finding.line}
              />
            </AICard>
          ))}
        </div>
      )}
    </div>
  );
}
