"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { LayoutGrid, List, Search, ArrowRight } from "lucide-react";
import { STUDENT_PROJECTS } from "@/components/student/studentData";
import { StatusBadge, DeadlineBadge } from "@/components/student/StatusBadge";
import { LinearProgressBar } from "@/components/student/ProgressIndicators";
import { AvatarGroup } from "@/components/student/AvatarGroup";
import { DataTable } from "@/components/student/DataTable";
import {
  EmptyState,
  ErrorState,
  SkeletonLoader,
  StatePreviewBar,
  ViewStateMode,
} from "@/components/student/StateViews";
import { cn } from "@/lib/utils";

export default function StudentProjectsPage() {
  const [layout, setLayout] = useState<"card" | "list">("card");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<ViewStateMode>("ready");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return STUDENT_PROJECTS;
    return STUDENT_PROJECTS.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        p.course.toLowerCase().includes(q)
    );
  }, [search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] leading-tight font-semibold text-[var(--neutral-text)] tracking-tight">
            My Projects
          </h1>
          <p className="mt-1 text-sm text-[var(--neutral-muted)]">
            Manage assigned academic projects, track milestones, and open project workspaces.
          </p>
        </div>
        <StatePreviewBar mode={viewMode} onChange={setViewMode} />
      </div>

      {viewMode === "loading" && <SkeletonLoader rows={4} />}
      {viewMode === "error" && <ErrorState onRetry={() => setViewMode("ready")} />}
      {viewMode === "empty" && (
        <EmptyState
          title="No projects found"
          description="You are not enrolled in any active academic projects for this semester."
          actionLabel="Reset view"
          onAction={() => setViewMode("ready")}
        />
      )}

      {viewMode === "ready" && (
        <>
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search
                className="w-4 h-4 text-[var(--neutral-muted)] absolute left-3 top-1/2 -translate-y-1/2"
                aria-hidden="true"
              />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by course code or title..."
                aria-label="Search projects"
                className="w-full rounded-xl border border-[var(--neutral-border)] bg-[var(--neutral-card)] pl-9 pr-3 py-2 text-sm text-[var(--neutral-text)] placeholder:text-[var(--neutral-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              />
            </div>

            <div
              className="inline-flex rounded-xl border border-[var(--neutral-border)] bg-[var(--neutral-card)] p-1 self-start"
              role="group"
              aria-label="Toggle layout"
            >
              <button
                type="button"
                onClick={() => setLayout("card")}
                aria-label="Card view"
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium cursor-pointer",
                  layout === "card"
                    ? "bg-[var(--primary)] text-white"
                    : "text-[var(--neutral-muted)] hover:text-[var(--neutral-text)]"
                )}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Cards</span>
              </button>
              <button
                type="button"
                onClick={() => setLayout("list")}
                aria-label="List view"
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium cursor-pointer",
                  layout === "list"
                    ? "bg-[var(--primary)] text-white"
                    : "text-[var(--neutral-muted)] hover:text-[var(--neutral-text)]"
                )}
              >
                <List className="w-3.5 h-3.5" />
                <span>List</span>
              </button>
            </div>
          </div>

          {layout === "card" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((proj) => (
                <div
                  key={proj.id}
                  className="rounded-2xl border border-[var(--neutral-border)] bg-[var(--neutral-card)] p-5 flex flex-col justify-between gap-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded-lg bg-[var(--primary-soft)] px-2.5 py-0.5 text-xs font-semibold text-[var(--primary)] dark:text-indigo-300">
                        {proj.code}
                      </span>
                      <StatusBadge status={proj.status} />
                    </div>

                    <div>
                      <h2 className="text-base font-semibold text-[var(--neutral-text)] leading-snug">
                        {proj.title}
                      </h2>
                      <p className="mt-1 text-xs text-[var(--neutral-muted)] line-clamp-2">
                        {proj.description}
                      </p>
                    </div>

                    <LinearProgressBar value={proj.progress} label="Overall progress" />
                    <AvatarGroup members={proj.members} />
                  </div>

                  <div className="pt-3 border-t border-[var(--neutral-border)] flex items-center justify-between gap-2">
                    <DeadlineBadge countdown={proj.countdown} urgent={proj.urgent} />
                    <Link
                      href={`/dashboard/student/projects/${proj.id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--primary)] hover:text-[var(--primary-hover)]"
                    >
                      <span>Open project</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <DataTable
              data={filtered}
              columns={[
                {
                  key: "code",
                  header: "Course",
                  sortable: true,
                  sortValue: (r) => r.code,
                  render: (r) => (
                    <span className="font-semibold text-[var(--primary)] dark:text-indigo-300">
                      {r.code}
                    </span>
                  ),
                },
                {
                  key: "title",
                  header: "Project Title",
                  sortable: true,
                  sortValue: (r) => r.title,
                  render: (r) => (
                    <Link
                      href={`/dashboard/student/projects/${r.id}`}
                      className="font-medium text-[var(--neutral-text)] hover:text-[var(--primary)]"
                    >
                      {r.title}
                    </Link>
                  ),
                },
                {
                  key: "status",
                  header: "Status",
                  render: (r) => <StatusBadge status={r.status} />,
                },
                {
                  key: "progress",
                  header: "Progress",
                  sortable: true,
                  sortValue: (r) => r.progress,
                  render: (r) => <span className="tabular-nums font-medium">{r.progress}%</span>,
                },
                {
                  key: "deadline",
                  header: "Deadline",
                  render: (r) => <DeadlineBadge countdown={r.countdown} urgent={r.urgent} />,
                },
              ]}
            />
          )}
        </>
      )}
    </div>
  );
}
