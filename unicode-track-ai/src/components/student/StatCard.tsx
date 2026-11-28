"use client";

import React from "react";
import Link from "next/link";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: string;
    direction: "up" | "down" | "neutral";
  };
  subtitle?: string;
  href?: string;
  className?: string;
}

export function StatCard({
  label,
  value,
  icon,
  trend,
  subtitle,
  href,
  className,
}: StatCardProps) {
  const TrendIcon =
    trend?.direction === "up"
      ? ArrowUpRight
      : trend?.direction === "down"
      ? ArrowDownRight
      : Minus;

  const content = (
    <div
      className={cn(
        "rounded-2xl border border-[var(--neutral-border)] bg-[var(--neutral-card)] p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]",
        className
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-[var(--neutral-muted)]">{label}</span>
        <div className="w-9 h-9 rounded-xl bg-[var(--neutral-surface)] border border-[var(--neutral-border)] text-[var(--neutral-muted)] flex items-center justify-center shrink-0">
          {icon}
        </div>
      </div>

      <div className="mt-3 flex items-baseline justify-between gap-2">
        <span className="text-[28px] leading-tight font-semibold text-[var(--primary)] dark:text-indigo-400 tabular-nums tracking-tight">
          {value}
        </span>

        {trend && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-xs font-medium rounded-full px-2 py-0.5",
              trend.direction === "up"
                ? "bg-[var(--primary-soft)] text-[var(--primary)] dark:text-indigo-300"
                : "bg-[var(--neutral-surface)] text-[var(--neutral-muted)]"
            )}
          >
            <TrendIcon className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{trend.value}</span>
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-2 text-xs text-[var(--neutral-muted)] truncate">{subtitle}</p>
      )}
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
      >
        {content}
      </Link>
    );
  }

  return content;
}
