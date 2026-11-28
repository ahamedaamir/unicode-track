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
    default: "bg-muted text-muted-foreground border-border",
    teal: "bg-accent-soft text-accent border-accent-border font-medium",
    navy: "bg-muted text-foreground border-border",
    success: "bg-success-soft text-success border-accent-border font-medium",
    warning: "bg-warning-soft text-warning border-amber-900/60 font-medium",
    outline: "border-border text-foreground bg-card",
    subtle: "bg-muted text-muted-foreground border-transparent",
  };

  const sizeStyles = {
    sm: "text-xs px-2 py-0.5 rounded-full font-medium border",
    md: "text-xs px-2.5 py-1 rounded-full font-medium border",
  };

  return (
    <span
      suppressHydrationWarning
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
            variant === "teal" || variant === "success"
              ? "bg-accent animate-pulse"
              : variant === "warning"
              ? "bg-warning"
              : "bg-muted-foreground"
          )}
        />
      )}
      {children}
    </span>
  );
}
