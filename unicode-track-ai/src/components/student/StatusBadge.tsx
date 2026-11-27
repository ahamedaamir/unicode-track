"use client";

import React from "react";
import {
  Circle,
  Clock,
  Send,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Sparkles,
  CalendarClock,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type StudentStatus =
  | "not_started"
  | "in_progress"
  | "submitted"
  | "revision_requested"
  | "approved"
  | "rejected";

export type AISeverity = "critical" | "high" | "medium" | "low" | "info";

const STATUS_MAP: Record<
  StudentStatus,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    className: string;
  }
> = {
  not_started: {
    label: "Not Started",
    icon: Circle,
    className:
      "border border-dashed border-[var(--neutral-border)] bg-transparent text-[var(--neutral-muted)]",
  },
  in_progress: {
    label: "In Progress",
    icon: Clock,
    className:
      "border border-indigo-200 dark:border-indigo-800 bg-[var(--primary-soft)] text-[var(--primary)] dark:text-indigo-300",
  },
  submitted: {
    label: "Submitted",
    icon: Send,
    className:
      "border border-[var(--primary)] bg-[var(--neutral-surface)] text-[var(--neutral-text)]",
  },
  revision_requested: {
    label: "Revision Requested",
    icon: RotateCcw,
    className:
      "border border-[var(--primary)] border-l-4 bg-[var(--neutral-card)] text-[var(--primary)] dark:text-indigo-300",
  },
  approved: {
    label: "Approved",
    icon: CheckCircle2,
    className:
      "border border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]",
  },
  rejected: {
    label: "Rejected",
    icon: XCircle,
    className:
      "border border-slate-900 dark:border-slate-100 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900",
  },
};

export function StatusBadge({
  status,
  label,
  className,
}: {
  status: StudentStatus;
  label?: string;
  className?: string;
}) {
  const cfg = STATUS_MAP[status];
  const Icon = cfg.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap transition-colors duration-150",
        cfg.className,
        className
      )}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      <span>{label ?? cfg.label}</span>
    </span>
  );
}

const AI_SEVERITY_MAP: Record<
  AISeverity,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    className: string;
  }
> = {
  critical: {
    label: "Critical",
    icon: AlertTriangle,
    className:
      "border border-slate-900 dark:border-slate-100 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900",
  },
  high: {
    label: "High",
    icon: AlertTriangle,
    className:
      "border border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]",
  },
  medium: {
    label: "Medium",
    icon: Sparkles,
    className:
      "border border-indigo-200 dark:border-indigo-800 bg-[var(--primary-soft)] text-[var(--primary)] dark:text-indigo-300",
  },
  low: {
    label: "Low",
    icon: Info,
    className:
      "border border-[var(--neutral-border)] bg-[var(--neutral-surface)] text-[var(--neutral-text)]",
  },
  info: {
    label: "Info",
    icon: Info,
    className:
      "border border-[var(--accent-border)] bg-transparent text-[var(--accent-foreground)]",
  },
};

export function AISeverityBadge({
  severity,
  className,
}: {
  severity: AISeverity;
  className?: string;
}) {
  const cfg = AI_SEVERITY_MAP[severity];
  const Icon = cfg.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        cfg.className,
        className
      )}
    >
      <Icon className="w-3 h-3 shrink-0" aria-hidden="true" />
      <span>{cfg.label}</span>
    </span>
  );
}

export function DeadlineBadge({
  countdown,
  urgent = false,
  className,
}: {
  countdown: string;
  urgent?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs border transition-colors",
        urgent
          ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)] dark:text-indigo-300 font-semibold"
          : "border-[var(--neutral-border)] bg-[var(--neutral-surface)] text-[var(--neutral-muted)] font-medium",
        className
      )}
    >
      <CalendarClock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      <span>{countdown}</span>
    </span>
  );
}
