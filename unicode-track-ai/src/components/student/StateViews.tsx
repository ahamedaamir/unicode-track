"use client";

import React from "react";
import { AlertTriangle, Lock, RefreshCw, CheckCircle2, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function SkeletonLoader({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading content">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-[var(--neutral-border)] bg-[var(--neutral-card)] p-5 space-y-3"
          >
            <div className="h-3.5 w-24 rounded student-skeleton" />
            <div className="h-7 w-16 rounded student-skeleton" />
            <div className="h-3 w-32 rounded student-skeleton" />
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-[var(--neutral-border)] bg-[var(--neutral-card)] p-5 space-y-3">
        {Array.from({ length: rows }).map((_, idx) => (
          <div key={idx} className="h-12 w-full rounded-xl student-skeleton" />
        ))}
      </div>
    </div>
  );
}

/**
 * Empty state with single-color indigo line illustration + clear CTA.
 */
export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="rounded-2xl border border-[var(--neutral-border)] bg-[var(--neutral-card)] p-10 text-center flex flex-col items-center justify-center max-w-xl mx-auto">
      <svg
        width="64"
        height="64"
        viewBox="0 0 64 64"
        fill="none"
        aria-hidden="true"
        className="text-[var(--primary)] mb-4"
      >
        <rect
          x="10"
          y="14"
          width="44"
          height="36"
          rx="8"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path
          d="M10 24H54M22 34H42M26 42H38"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      <h3 className="text-base font-semibold text-[var(--neutral-text)]">{title}</h3>
      <p className="mt-1.5 text-sm text-[var(--neutral-muted)] max-w-md leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 inline-flex items-center justify-center rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] px-4 py-2 text-sm font-medium text-white transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function ErrorState({
  title = "Unable to load data",
  description = "A temporary issue occurred while fetching your workspace data. Please retry.",
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="rounded-2xl border border-slate-900 dark:border-slate-200 bg-[var(--neutral-card)] p-8 text-center flex flex-col items-center max-w-xl mx-auto"
    >
      <div className="w-11 h-11 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 flex items-center justify-center mb-3">
        <AlertTriangle className="w-5 h-5" aria-hidden="true" />
      </div>
      <h3 className="text-base font-semibold text-[var(--neutral-text)]">{title}</h3>
      <p className="mt-1.5 text-sm text-[var(--neutral-muted)]">{description}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] px-4 py-2 text-sm font-medium text-white transition-colors cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Retry</span>
        </button>
      )}
    </div>
  );
}

export function LockedField({
  label,
  value,
  tooltip = "Locked by lecturer policy",
}: {
  label: string;
  value: string;
  tooltip?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-[var(--neutral-muted)]">{label}</label>
      <div
        title={tooltip}
        className="flex items-center justify-between gap-2 rounded-xl border border-[var(--neutral-border)] bg-[var(--neutral-surface)] px-3.5 py-2 text-sm text-[var(--neutral-muted)]"
      >
        <span className="truncate">{value}</span>
        <Lock className="w-4 h-4 shrink-0" aria-label={tooltip} />
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4"
    >
      <div className="w-full max-w-md rounded-2xl border border-[var(--neutral-border)] bg-[var(--neutral-card)] p-6 shadow-xl space-y-4">
        <div className="space-y-1.5">
          <h3 id="confirm-dialog-title" className="text-base font-semibold text-[var(--neutral-text)]">
            {title}
          </h3>
          <p className="text-sm text-[var(--neutral-muted)] leading-relaxed">{description}</p>
        </div>
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-[var(--neutral-border)] bg-[var(--neutral-card)] px-4 py-2 text-sm font-medium text-[var(--neutral-text)] hover:bg-[var(--neutral-surface)] cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] px-4 py-2 text-sm font-medium text-white cursor-pointer"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function StudentToast({
  message,
  onDismiss,
}: {
  message: string | null;
  onDismiss: () => void;
}) {
  if (!message) return null;
  return (
    <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 rounded-2xl border border-[var(--primary)] bg-[var(--neutral-card)] px-4 py-3 text-sm font-medium text-[var(--neutral-text)] shadow-lg">
      <CheckCircle2 className="w-4 h-4 text-[var(--primary)] shrink-0" aria-hidden="true" />
      <span>{message}</span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="p-1 text-[var(--neutral-muted)] hover:text-[var(--neutral-text)] cursor-pointer"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export type ViewStateMode = "ready" | "loading" | "empty" | "error";

export function StatePreviewBar({
  mode,
  onChange,
}: {
  mode: ViewStateMode;
  onChange: (m: ViewStateMode) => void;
}) {
  const options: { id: ViewStateMode; label: string }[] = [
    { id: "ready", label: "Active" },
    { id: "loading", label: "Loading" },
    { id: "empty", label: "Empty" },
    { id: "error", label: "Error" },
  ];

  return (
    <div
      className="inline-flex items-center gap-1 rounded-xl border border-[var(--neutral-border)] bg-[var(--neutral-card)] p-1"
      role="group"
      aria-label="Preview page state"
    >
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChange(opt.id)}
          className={cn(
            "px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer",
            mode === opt.id
              ? "bg-[var(--primary)] text-white"
              : "text-[var(--neutral-muted)] hover:text-[var(--neutral-text)]"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
