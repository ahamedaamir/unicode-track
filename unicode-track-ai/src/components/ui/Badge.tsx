import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "teal" | "navy" | "success" | "warning" | "outline" | "subtle";
  size?: "sm" | "md";
  dot?: boolean;
}

export function Badge({
  variant = "default",
  size = "md",
  dot = false,
  className,
  children,
  ...props
}: BadgeProps) {
  const variantStyles = {
    default: "bg-slate-100 text-slate-700 border-slate-200/80",
    teal: "bg-teal-50 text-teal-700 border-teal-200/90 font-medium",
    navy: "bg-[#0B1220] text-slate-100 border-[#1e293b]",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    outline: "border-slate-300 text-slate-700 bg-white",
    subtle: "bg-slate-100/80 text-slate-600 border-transparent",
  };

  const sizeStyles = {
    sm: "text-xs px-2 py-0.5 rounded-full font-medium border",
    md: "text-xs px-2.5 py-1 rounded-full font-medium border",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 transition-colors",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full shrink-0",
            variant === "teal"
              ? "bg-[#14B8A6] animate-pulse"
              : variant === "success"
              ? "bg-emerald-500"
              : variant === "warning"
              ? "bg-amber-500"
              : "bg-slate-400"
          )}
        />
      )}
      {children}
    </span>
  );
}

