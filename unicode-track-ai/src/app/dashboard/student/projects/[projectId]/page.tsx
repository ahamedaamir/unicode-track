"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, GitBranch, Network, FileText, Sparkles } from "lucide-react";
import { STUDENT_PROJECTS, AI_CODE_FINDINGS } from "@/components/student/studentData";
import { StatusBadge, DeadlineBadge, AISeverityBadge } from "@/components/student/StatusBadge";
import {
  AIAdvisoryBanner,
  AIBadge,
  AICard,
  LecturerApprovedBadge,
  LockedMarkPlaceholder,
} from "@/components/student/AIBadgeAndBanner";
import { LinearProgressBar, VerticalTimeline } from "@/components/student/ProgressIndicators";
import { AvatarGroup } from "@/components/student/AvatarGroup";
import { UploadDropzone } from "@/components/student/UploadDropzone";
import { CodeBlock } from "@/components/student/CodeBlock";
import { cn } from "@/lib/utils";

const TABS = [
  "Overview",
  "Requirements",
  "Group Workspace",
  "Proposal",
  "ER Diagram",
  "Repository",
  "Submissions",
  "AI Reviews",
  "Evaluation",
  "Feedback",
] as const;

type ProjectTab = (typeof TABS)[number];

export default function StudentProjectDetailPage() {
  const params = useParams();
  const projectId = String(params?.projectId || "proj-cs3021");
  const project =
    STUDENT_PROJECTS.find((p) => p.id === projectId) || STUDENT_PROJECTS[0];

  const [activeTab, setActiveTab] = useState<ProjectTab>("Overview");

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div className="space-y-3">
        <Link
          href="/dashboard/student/projects"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--neutral-muted)] hover:text-[var(--primary)]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to My Projects</span>
        </Link>

        <div className="rounded-2xl border border-[var(--neutral-border)] bg-[var(--neutral-card)] p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-lg bg-[var(--primary-soft)] px-2.5 py-0.5 text-xs font-semibold text-[var(--primary)] dark:text-indigo-300">
                {project.code}
              </span>
              <StatusBadge status={project.status} />
              <DeadlineBadge countdown={project.countdown} urgent={project.urgent} />
            </div>
            <h1 className="text-xl sm:text-2xl font-semibold text-[var(--neutral-text)]">
              {project.title}
            </h1>
            <p className="text-xs text-[var(--neutral-muted)]">
              Supervisor: {project.supervisor} • {project.groupName}
            </p>
          </div>
          <AvatarGroup members={project.members} />
        </div>
      </div>

      {/* 10-Tab Bar with Indigo Underline */}
      <div
        role="tablist"
        aria-label="Project sections"
        className="flex items-center gap-1 overflow-x-auto border-b border-[var(--neutral-border)] pb-px"
      >
        {TABS.map((tab) => {
          const active = activeTab === tab;
          return (
            <button
              key={tab}
              role="tab"
              aria-selected={active}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-3.5 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]",
                active
                  ? "border-[var(--primary)] text-[var(--primary)] dark:text-indigo-300 font-semibold"
                  : "border-transparent text-[var(--neutral-muted)] hover:text-[var(--neutral-text)]"
              )}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="space-y-5">
        {activeTab === "Overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 rounded-2xl border border-[var(--neutral-border)] bg-[var(--neutral-card)] p-5 space-y-4">
              <h2 className="text-base font-semibold text-[var(--neutral-text)]">
                Project Summary
              </h2>
              <p className="text-sm text-[var(--neutral-muted)] leading-relaxed">
                {project.description}
              </p>
              <LinearProgressBar value={project.progress} label="Overall completion" />
            </div>
            <div className="rounded-2xl border border-[var(--neutral-border)] bg-[var(--neutral-card)] p-5">
              <h2 className="text-base font-semibold text-[var(--neutral-text)] mb-4">
                Milestones
              </h2>
              <VerticalTimeline
                steps={[
                  { id: "1", title: "Proposal", done: true, date: "Nov 10" },
                  { id: "2", title: "ER Diagram", done: true, date: "Nov 18" },
                  { id: "3", title: "Repository Sync", done: true, date: "Nov 26" },
                  { id: "4", title: "Final Submission", done: false, date: project.deadline },
                ]}
              />
            </div>
          </div>
        )}

        {activeTab === "Requirements" && (
          <div className="rounded-2xl border border-[var(--neutral-border)] bg-[var(--neutral-card)] p-5 space-y-3">
            <h2 className="text-base font-semibold text-[var(--neutral-text)]">
              Lecturer Requirements Checklist
            </h2>
            {[
              { req: "Role-based authentication with Supabase RLS", done: true },
              { req: "Normalized PostgreSQL schema matching ER diagram", done: true },
              { req: "Automated unit tests for reservation booking logic", done: false },
              { req: "Accessible responsive UI with keyboard navigation", done: true },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-3 rounded-xl border border-[var(--neutral-border)] p-3.5"
              >
                <div className="flex items-center gap-2.5">
                  <CheckCircle2
                    className={cn(
                      "w-4 h-4 shrink-0",
                      item.done ? "text-[var(--primary)]" : "text-[var(--neutral-muted)]"
                    )}
                  />
                  <span className="text-sm text-[var(--neutral-text)]">{item.req}</span>
                </div>
                <StatusBadge status={item.done ? "approved" : "in_progress"} />
              </div>
            ))}
          </div>
        )}

        {activeTab === "Group Workspace" && (
          <div className="rounded-2xl border border-[var(--neutral-border)] bg-[var(--neutral-card)] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-[var(--neutral-text)]">
                {project.groupName}
              </h2>
              <Link
                href="/dashboard/student/groups"
                className="text-xs font-semibold text-[var(--primary)] hover:underline"
              >
                Open full Group Workspace
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {project.members.map((m) => (
                <div
                  key={m.name}
                  className="rounded-xl border border-[var(--neutral-border)] p-3.5 flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-semibold text-[var(--neutral-text)]">{m.name}</p>
                    <p className="text-xs text-[var(--neutral-muted)]">{m.role || "Member"}</p>
                  </div>
                  {m.isLeader && (
                    <span className="rounded-full bg-[var(--primary)] text-white px-2.5 py-0.5 text-xs font-medium">
                      Leader
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "Proposal" && (
          <div className="rounded-2xl border border-[var(--neutral-border)] bg-[var(--neutral-card)] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[var(--primary)]" />
                <h2 className="text-base font-semibold text-[var(--neutral-text)]">
                  Project Proposal
                </h2>
              </div>
              <StatusBadge status="approved" />
            </div>
            <UploadDropzone label="Upload revised proposal PDF if requested" accept=".pdf" />
          </div>
        )}

        {activeTab === "ER Diagram" && (
          <div className="rounded-2xl border border-[var(--neutral-border)] bg-[var(--neutral-card)] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Network className="w-4 h-4 text-[var(--primary)]" />
                <h2 className="text-base font-semibold text-[var(--neutral-text)]">
                  ER Diagram & Database Alignment
                </h2>
              </div>
              <Link
                href="/dashboard/student/database-review"
                className="text-xs font-semibold text-[var(--primary)] hover:underline"
              >
                Compare ER vs Implementation
              </Link>
            </div>
            <AICard>
              <div className="flex items-center gap-2 mb-1.5">
                <AIBadge />
              </div>
              <p className="text-sm text-[var(--neutral-text)]">
                5 of 5 core entities detected in SQL migrations. Consider adding a composite index on reservations(slot_id, status).
              </p>
            </AICard>
          </div>
        )}

        {activeTab === "Repository" && (
          <div className="rounded-2xl border border-[var(--neutral-border)] bg-[var(--neutral-card)] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-[var(--primary)]" />
                <h2 className="text-base font-semibold text-[var(--neutral-text)]">
                  {project.repoName}
                </h2>
              </div>
              <span className="text-xs font-semibold text-[var(--primary)] tabular-nums">
                {project.commits} commits synced
              </span>
            </div>
            <Link
              href="/dashboard/student/repositories"
              className="inline-flex items-center rounded-xl bg-[var(--primary)] px-4 py-2 text-xs font-medium text-white hover:bg-[var(--primary-hover)]"
            >
              View full repository telemetry
            </Link>
          </div>
        )}

        {activeTab === "Submissions" && (
          <div className="rounded-2xl border border-[var(--neutral-border)] bg-[var(--neutral-card)] p-5 space-y-4">
            <h2 className="text-base font-semibold text-[var(--neutral-text)]">
              Submit Deliverable
            </h2>
            <UploadDropzone />
          </div>
        )}

        {activeTab === "AI Reviews" && (
          <div className="space-y-4">
            <AIAdvisoryBanner />
            {AI_CODE_FINDINGS.slice(0, 2).map((finding) => (
              <AICard key={finding.id} className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[var(--accent)]" />
                    <span className="text-sm font-semibold text-[var(--neutral-text)]">
                      {finding.title}
                    </span>
                  </div>
                  <AISeverityBadge severity={finding.severity} />
                </div>
                <p className="text-xs text-[var(--neutral-muted)]">{finding.suggestion}</p>
                <CodeBlock code={finding.snippet} filename={finding.file} highlightLine={finding.line} />
              </AICard>
            ))}
          </div>
        )}

        {activeTab === "Evaluation" && (
          <div className="space-y-4">
            <AIAdvisoryBanner />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <AICard className="space-y-2">
                <AIBadge />
                <p className="text-2xl font-semibold text-[var(--neutral-text)] tabular-nums">
                  {project.aiScore} / 100
                </p>
                <p className="text-xs text-[var(--neutral-muted)]">
                  Provisional AI rubric score based on repository and documentation evidence.
                </p>
              </AICard>

              {project.finalMark !== null ? (
                <div className="rounded-2xl border border-[var(--primary)] bg-[var(--neutral-card)] p-5 space-y-2">
                  <LecturerApprovedBadge />
                  <p className="text-2xl font-semibold text-[var(--primary)] tabular-nums">
                    {project.finalMark} / 100
                  </p>
                  <p className="text-xs text-[var(--neutral-muted)]">
                    Officially approved and released by {project.supervisor}.
                  </p>
                </div>
              ) : (
                <LockedMarkPlaceholder />
              )}
            </div>
          </div>
        )}

        {activeTab === "Feedback" && (
          <div className="rounded-2xl border border-[var(--neutral-border)] bg-[var(--neutral-card)] p-5 space-y-3">
            <h2 className="text-base font-semibold text-[var(--neutral-text)]">
              Supervisor Feedback Thread
            </h2>
            <div className="rounded-xl border border-[var(--neutral-border)] bg-[var(--neutral-bg)] p-4 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--neutral-text)]">
                  {project.supervisor}
                </span>
                <span className="text-xs text-[var(--neutral-muted)]">2 days ago</span>
              </div>
              <p className="text-sm text-[var(--neutral-muted)]">
                Great progress on the database migrations. Please add integration tests for concurrent reservation requests before final submission.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
