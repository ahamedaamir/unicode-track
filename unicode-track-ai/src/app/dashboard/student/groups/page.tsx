"use client";

import React, { useState } from "react";
import { Users, GitBranch, Crown } from "lucide-react";
import { STUDENT_PROJECTS } from "@/components/student/studentData";
import { AvatarGroup } from "@/components/student/AvatarGroup";
import { LinearProgressBar } from "@/components/student/ProgressIndicators";
import {
  EmptyState,
  ErrorState,
  SkeletonLoader,
  StatePreviewBar,
  ViewStateMode,
} from "@/components/student/StateViews";

export default function StudentGroupsPage() {
  const [viewMode, setViewMode] = useState<ViewStateMode>("ready");
  const primaryGroup = STUDENT_PROJECTS[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] leading-tight font-semibold text-[var(--neutral-text)] tracking-tight">
            My Groups
          </h1>
          <p className="mt-1 text-sm text-[var(--neutral-muted)]">
            Collaborate with your assigned team members, track role ownership, and monitor shared contributions.
          </p>
        </div>
        <StatePreviewBar mode={viewMode} onChange={setViewMode} />
      </div>

      {viewMode === "loading" && <SkeletonLoader rows={3} />}
      {viewMode === "error" && <ErrorState onRetry={() => setViewMode("ready")} />}
      {viewMode === "empty" && (
        <EmptyState
          title="No group workspace assigned"
          description="Your lecturer has not assigned you to a project group yet."
          actionLabel="Refresh Groups"
          onAction={() => setViewMode("ready")}
        />
      )}

      {viewMode === "ready" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-[var(--neutral-border)] bg-[var(--neutral-card)] p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-[var(--primary)]" />
                  <span className="text-xs font-semibold text-[var(--primary)] dark:text-indigo-300">
                    {primaryGroup.code} • Active Workspace
                  </span>
                </div>
                <h2 className="text-xl font-semibold text-[var(--neutral-text)]">
                  {primaryGroup.groupName}
                </h2>
                <p className="text-xs text-[var(--neutral-muted)]">
                  Repository: {primaryGroup.repoName}
                </p>
              </div>
              <AvatarGroup members={primaryGroup.members} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {primaryGroup.members.map((member, idx) => {
                const share = [34, 26, 22, 18][idx] ?? 20;
                return (
                  <div
                    key={member.name}
                    className="rounded-xl border border-[var(--neutral-border)] bg-[var(--neutral-bg)] p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-[var(--neutral-text)]">
                          {member.name}
                        </p>
                        <p className="text-xs text-[var(--neutral-muted)]">
                          {member.role || "Contributor"}
                        </p>
                      </div>
                      {member.isLeader && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--primary)] text-white px-2 py-0.5 text-[11px] font-medium">
                          <Crown className="w-3 h-3" />
                          Leader
                        </span>
                      )}
                    </div>
                    <LinearProgressBar value={share} label="Contribution share" />
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-[var(--neutral-border)] flex items-center justify-between text-xs text-[var(--neutral-muted)]">
              <span className="inline-flex items-center gap-1.5">
                <GitBranch className="w-3.5 h-3.5 text-[var(--primary)]" />
                <span>Note: Contribution visibility combines commits, PR reviews, docs, and testing.</span>
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
