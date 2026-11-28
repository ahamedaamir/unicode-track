"use client";

import React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function LinearProgressBar({
  value,
  label,
  showPercent = true,
  className,
}: {
  value: number;
  label?: string;
  showPercent?: boolean;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("space-y-1.5", className)}>
      {(label || showPercent) && (
        <div className="flex items-center justify-between text-xs">
          {label && <span className="font-medium text-[var(--neutral-text)]">{label}</span>}
          {showPercent && (
            <span className="font-semibold text-[var(--primary)] dark:text-indigo-300 tabular-nums">
              {clamped}%
            </span>
          )}
        </div>
      )}
      <div
        className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden"
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label || "Progress"}
      >
        <div
          className="h-full rounded-full bg-[var(--primary)] transition-all duration-500 ease-out"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}

export function RadialProgressRing({
  value,
  size = 76,
  strokeWidth = 7,
  label,
  className,
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className={cn("inline-flex flex-col items-center gap-1.5", className)}>
      <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-slate-200 dark:text-slate-800"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--primary)"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-500 ease-out"
          />
        </svg>
        <span className="absolute text-sm font-semibold text-[var(--neutral-text)] tabular-nums">
          {clamped}%
        </span>
      </div>
      {label && <span className="text-xs font-medium text-[var(--neutral-muted)]">{label}</span>}
    </div>
  );
}

export interface TimelineStep {
  id: string;
  title: string;
  subtitle?: string;
  date?: string;
  done: boolean;
}

export function VerticalTimeline({
  steps,
  className,
}: {
  steps: TimelineStep[];
  className?: string;
}) {
  return (
    <ol className={cn("relative space-y-5", className)}>
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        return (
          <li key={step.id} className="relative flex gap-3.5">
            {!isLast && (
              <span
                aria-hidden="true"
                className={cn(
                  "absolute left-[11px] top-6 bottom-[-20px] w-0.5",
                  step.done ? "bg-[var(--primary)]" : "bg-[var(--neutral-border)]"
                )}
              />
            )}
            <span
              aria-hidden="true"
              className={cn(
                "relative z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                step.done
                  ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                  : "border-[var(--neutral-border)] bg-[var(--neutral-card)] text-transparent"
              )}
            >
              {step.done && <Check className="w-3.5 h-3.5" />}
            </span>
            <div className="flex-1 min-w-0 pb-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p
                  className={cn(
                    "text-sm font-medium",
                    step.done ? "text-[var(--neutral-text)]" : "text-[var(--neutral-muted)]"
                  )}
                >
                  {step.title}
                </p>
                {step.date && (
                  <span className="text-xs text-[var(--neutral-muted)] tabular-nums">{step.date}</span>
                )}
              </div>
              {step.subtitle && (
                <p className="mt-0.5 text-xs text-[var(--neutral-muted)]">{step.subtitle}</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
