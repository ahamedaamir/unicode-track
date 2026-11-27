"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  FolderGit2,
  GitCommit,
  Sparkles,
  Award,
  ArrowRight,
  CalendarClock,
} from "lucide-react";
import { StatCard } from "@/components/student/StatCard";
import { StatusBadge, DeadlineBadge } from "@/components/student/StatusBadge";
import {
  AIAdvisoryBanner,
  AIBadge,
  AICard,
  LecturerApprovedBadge,
} from "@/components/student/AIBadgeAndBanner";
import {
  LinearProgressBar,
  RadialProgressRing,
  VerticalTimeline,
} from "@/components/student/ProgressIndicators";
import {
  ProjectProgressChart,
  CommitActivityChart,
} from "@/components/student/StudentCharts";
import {
  EmptyState,
  ErrorState,
  SkeletonLoader,
  StatePreviewBar,
  ViewStateMode,
} from "@/components/student/StateViews";
import { STUDENT_PROJECTS } from "@/components/student/studentData";

export default function StudentDashboardOverviewPage() {
  const [viewMode, setViewMode] = useState<ViewStateMode>("ready");

  const totalCommits = STUDENT_PROJECTS.reduce((acc, p) => acc + p.commits, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] leading-tight font-semibold text-[var(--neutral-text)] tracking-tight">
            Student Dashboard
          </h1>
          <p className="mt-1 text-sm text-[var(--neutral-muted)]">
            Track your academic projects, GitHub contributions, AI advisory reviews, and final marks.
          </p>
        </div>
        <StatePreviewBar mode={viewMode} onChange={setViewMode} />
      </div>

      {viewMode === "loading" && <SkeletonLoader rows={4} />}
      {viewMode === "error" && <ErrorState onRetry={() => setViewMode("ready")} />}
      {viewMode === "empty" && (
        <EmptyState
          title="No active projects assigned yet"
          description="Once your lecturer assigns you to an academic project or group workspace, your milestones and repositories will appear here."
          actionLabel="Explore My Projects"
          onAction={() => setViewMode("ready")}
        />
      )}

      {viewMode === "ready" && (
        <>
          <AIAdvisoryBanner />

          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Active Projects"
              value={STUDENT_PROJECTS.length}
              icon={<FolderGit2 className="w-4 h-4" />}
              trend={{ value: "+1 this term", direction: "up" }}
              subtitle="Across 3 courses"
              href="/dashboard/student/projects"
            />
            <StatCard
              label="Synced Commits"
              value={totalCommits}
              icon={<GitCommit className="w-4 h-4" />}
              trend={{ value: "+18% wk", direction: "up" }}
              subtitle="Across 3 repositories"
              href="/dashboard/student/repositories"
            />
            <StatCard
              label="AI Advisory Avg."
              value="85%"
              icon={<Sparkles className="w-4 h-4 text-[var(--accent)]" />}
              trend={{ value: "Advisory", direction: "neutral" }}
              subtitle="Provisional rubric score"
              href="/dashboard/student/ai-reviews"
            />
            <StatCard
              label="Released Marks"
              value="1 / 3"
              icon={<Award className="w-4 h-4" />}
              trend={{ value: "90% IT2040", direction: "up" }}
              subtitle="2 awaiting lecturer approval"
              href="/dashboard/student/evaluations"
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section className="rounded-2xl border border-[var(--neutral-border)] bg-[var(--neutral-card)] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-[var(--neutral-text)]">
                    Milestone Completion
                  </h2>
                  <p className="text-xs text-[var(--neutral-muted)]">
                    CS3021 Distributed Campus Library progress by phase
                  </p>
                </div>
                <RadialProgressRing value={74} size={58} strokeWidth={6} />
              </div>
              <ProjectProgressChart />
            </section>

            <section className="rounded-2xl border border-[var(--neutral-border)] bg-[var(--neutral-card)] p-5 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-semibold text-[var(--neutral-text)]">
                    Commit & AI Review Activity
                  </h2>
                  <p className="text-xs text-[var(--neutral-muted)]">
                    Weekly repository commits vs. AI advisory inspections
                  </p>
                </div>
                <AIBadge label="AI series in Cyan" />
              </div>
              <CommitActivityChart />
            </section>
          </div>

          {/* Deadlines + Timeline + AI Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Upcoming Deadlines */}
            <section className="rounded-2xl border border-[var(--neutral-border)] bg-[var(--neutral-card)] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-[var(--neutral-text)]">
                  Upcoming Deadlines
                </h2>
                <CalendarClock className="w-4 h-4 text-[var(--neutral-muted)]" aria-hidden="true" />
              </div>
              <div className="space-y-3">
                {STUDENT_PROJECTS.map((proj) => (
                  <Link
                    key={proj.id}
                    href={`/dashboard/student/projects/${proj.id}`}
                    className="block rounded-xl border border-[var(--neutral-border)] p-3.5 hover:bg-[var(--primary-soft)]/50 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-[var(--primary)] dark:text-indigo-300">
                        {proj.code}
                      </span>
                      <DeadlineBadge countdown={proj.countdown} urgent={proj.urgent} />
                    </div>
                    <p className="mt-1.5 text-sm font-semibold text-[var(--neutral-text)] line-clamp-1">
                      {proj.title}
                    </p>
                    <div className="mt-2.5">
                      <LinearProgressBar value={proj.progress} />
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            {/* Vertical Milestone Timeline */}
            <section className="rounded-2xl border border-[var(--neutral-border)] bg-[var(--neutral-card)] p-5 space-y-4">
              <h2 className="text-base font-semibold text-[var(--neutral-text)]">
                CS3021 Milestone Timeline
              </h2>
              <VerticalTimeline
                steps={[
                  {
                    id: "m1",
                    title: "Project Proposal Approved",
                    subtitle: "Signed off by Dr. Sarah Al-Mansoor",
                    date: "Nov 10",
                    done: true,
                  },
                  {
                    id: "m2",
                    title: "ER Diagram & Schema Verified",
                    subtitle: "100% entity coverage in PostgreSQL",
                    date: "Nov 18",
                    done: true,
                  },
                  {
                    id: "m3",
                    title: "Core API & GitHub Sync",
                    subtitle: "148 commits synced from Team Atlas",
                    date: "Nov 26",
                    done: true,
                  },
                  {
                    id: "m4",
                    title: "Final Deliverable Submission",
                    subtitle: "Due in 4 days",
                    date: "Dec 15",
                    done: false,
                  },
                ]}
              />
            </section>

            {/* AI vs Final Marks Snapshot */}
            <section className="space-y-4">
              <AICard className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <AIBadge />
                  <span className="text-xs font-semibold text-[var(--accent-foreground)]">
                    CS3021
                  </span>
                </div>
                <p className="text-sm font-semibold text-[var(--neutral-text)]">
                  Provisional AI Rubric Estimate: 86 / 100
                </p>
                <p className="text-xs text-[var(--neutral-muted)] leading-relaxed">
                  Strong API modularity and test coverage. Address 1 critical transaction lock finding before final submission.
                </p>
                <Link
                  href="/dashboard/student/ai-reviews"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent-foreground)] hover:underline"
                >
                  <span>Inspect AI findings</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </AICard>

              <div className="rounded-2xl border border-[var(--neutral-border)] bg-[var(--neutral-card)] p-5 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <LecturerApprovedBadge />
                  <span className="text-xs font-medium text-[var(--neutral-muted)]">IT2040</span>
                </div>
                <p className="text-sm font-semibold text-[var(--neutral-text)]">
                  Final Approved Mark: 90 / 100
                </p>
                <StatusBadge status="approved" label="Released by Prof. Sterling" />
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
