"use client";

import React, { useState } from "react";
import { Database } from "lucide-react";
import { AIAdvisoryBanner, AIBadge, AICard } from "@/components/student/AIBadgeAndBanner";
import { StatusBadge } from "@/components/student/StatusBadge";
import { DataTable } from "@/components/student/DataTable";
import { CodeBlock } from "@/components/student/CodeBlock";
import {
  EmptyState,
  ErrorState,
  SkeletonLoader,
  StatePreviewBar,
  ViewStateMode,
} from "@/components/student/StateViews";

interface SchemaComparisonRow {
  id: string;
  entity: string;
  erColumns: string;
  sqlTable: string;
  status: "approved" | "revision_requested" | "in_progress";
  notes: string;
}

const COMPARISON_ROWS: SchemaComparisonRow[] = [
  {
    id: "1",
    entity: "users",
    erColumns: "id, email, full_name, role",
    sqlTable: "public.users (matched)",
    status: "approved",
    notes: "All primary and unique constraints implemented.",
  },
  {
    id: "2",
    entity: "reservations",
    erColumns: "id, user_id, slot_id, reserved_at",
    sqlTable: "public.reservations (partial)",
    status: "revision_requested",
    notes: "Missing composite unique index on (slot_id, reserved_at).",
  },
  {
    id: "3",
    entity: "study_slots",
    erColumns: "id, room_code, capacity",
    sqlTable: "public.study_slots (matched)",
    status: "approved",
    notes: "Check constraint capacity > 0 verified.",
  },
];

export default function StudentDatabaseReviewPage() {
  const [viewMode, setViewMode] = useState<ViewStateMode>("ready");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] leading-tight font-semibold text-[var(--neutral-text)] tracking-tight">
            Database Review
          </h1>
          <p className="mt-1 text-sm text-[var(--neutral-muted)]">
            Compare your approved ER diagram against implemented SQL migrations in your repository.
          </p>
        </div>
        <StatePreviewBar mode={viewMode} onChange={setViewMode} />
      </div>

      {viewMode === "loading" && <SkeletonLoader rows={3} />}
      {viewMode === "error" && <ErrorState onRetry={() => setViewMode("ready")} />}
      {viewMode === "empty" && (
        <EmptyState
          title="No schema comparison available"
          description="Connect a repository with SQL migrations and upload an ER diagram to compare them."
          actionLabel="Reload Review"
          onAction={() => setViewMode("ready")}
        />
      )}

      {viewMode === "ready" && (
        <div className="space-y-6">
          <AIAdvisoryBanner />

          <AICard className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <AIBadge label="AI ER-vs-SQL Alignment" />
              <p className="text-sm font-semibold text-[var(--neutral-text)]">
                91% Structural Match Across 3 Core Entities
              </p>
              <p className="text-xs text-[var(--neutral-muted)]">
                1 advisory constraint discrepancy detected in supabase/migrations/002_reservations.sql.
              </p>
            </div>
            <Database className="w-8 h-8 text-[var(--accent)] shrink-0" aria-hidden="true" />
          </AICard>

          <DataTable
            data={COMPARISON_ROWS}
            filterKey={(r) => `${r.entity} ${r.sqlTable} ${r.notes}`}
            searchPlaceholder="Filter entities..."
            columns={[
              {
                key: "entity",
                header: "ER Entity",
                sortable: true,
                sortValue: (r) => r.entity,
                render: (r) => (
                  <span className="font-mono text-xs font-semibold text-[var(--primary)] dark:text-indigo-300">
                    {r.entity}
                  </span>
                ),
              },
              {
                key: "erColumns",
                header: "ER Attributes",
                render: (r) => <span className="text-xs text-[var(--neutral-muted)]">{r.erColumns}</span>,
              },
              {
                key: "sqlTable",
                header: "Implemented SQL",
                render: (r) => <span className="font-mono text-xs">{r.sqlTable}</span>,
              },
              {
                key: "status",
                header: "Alignment",
                render: (r) => <StatusBadge status={r.status} />,
              },
              {
                key: "notes",
                header: "Advisory Notes",
                render: (r) => <span className="text-xs text-[var(--neutral-muted)]">{r.notes}</span>,
              },
            ]}
          />

          <CodeBlock
            filename="supabase/migrations/002_reservations.sql"
            highlightLine={5}
            code={`CREATE TABLE public.reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id),
  slot_id uuid REFERENCES public.study_slots(id),
  reserved_at timestamptz NOT NULL
);`}
          />
        </div>
      )}
    </div>
  );
}
