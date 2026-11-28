"use client";

import React from "react";
import { Sparkles, ShieldCheck, Info, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Cyan is strictly reserved for AI features.
 */
export function AIBadge({
  label = "AI suggested (advisory)",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent-foreground)]",
        className
      )}
    >
      <Sparkles className="w-3 h-3 text-[var(--accent)] shrink-0" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}

export function LecturerApprovedBadge({
  label = "Lecturer approved (final)",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-[var(--primary)] text-[var(--primary-foreground)]",
        className
      )}
    >
      <ShieldCheck className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}

export function AIAdvisoryBanner({ className }: { className?: string }) {
  return (
    <div
      role="note"
      aria-label="AI Advisory Notice"
      className={cn(
        "flex items-start sm:items-center gap-3 rounded-2xl border border-[var(--accent-border)] bg-[var(--accent-soft)] px-4 py-3 text-xs sm:text-sm text-[var(--accent-foreground)]",
        className
      )}
    >
      <Info className="w-4 h-4 text-[var(--accent)] shrink-0 mt-0.5 sm:mt-0" aria-hidden="true" />
      <p className="font-medium leading-relaxed">
        AI feedback is advisory to help you improve. Final marks are approved by your lecturer.
      </p>
    </div>
  );
}

export function AICard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-[var(--accent-border)] border-l-4 border-l-[var(--accent)] bg-[var(--accent-soft)] p-5 text-[var(--neutral-text)]",
        className
      )}
    >
      {children}
    </div>
  );
}

export function LockedMarkPlaceholder({
  title = "Final Mark Pending Lecturer Release",
  description = "Your lecturer is reviewing submissions and AI advisory notes. Final marks remain locked until officially released.",
  className,
}: {
  title?: string;
  description?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-dashed border-[var(--neutral-border)] bg-[var(--neutral-surface)] p-5 flex items-start gap-3.5",
        className
      )}
    >
      <div className="w-9 h-9 rounded-xl border border-[var(--neutral-border)] bg-[var(--neutral-card)] flex items-center justify-center text-[var(--neutral-muted)] shrink-0">
        <Lock className="w-4 h-4" aria-hidden="true" />
      </div>
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-[var(--neutral-text)]">{title}</p>
          <span className="inline-flex items-center gap-1 rounded-full border border-[var(--neutral-border)] bg-[var(--neutral-card)] px-2 py-0.5 text-[11px] font-medium text-[var(--neutral-muted)]">
            <Lock className="w-3 h-3" aria-hidden="true" />
            Locked
          </span>
        </div>
        <p className="text-xs text-[var(--neutral-muted)] leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
