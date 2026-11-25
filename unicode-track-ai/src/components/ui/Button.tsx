import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "tealOutline";
  size?: "sm" | "md" | "lg";
  href?: string;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  href,
  icon,
  iconRight,
  className,
  children,
  ...props
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center font-semibold rounded-[10px] transition-all duration-150 focus:outline-none focus-visible:ring-1 focus-visible:ring-accent disabled:opacity-50 disabled:pointer-events-none select-none cursor-pointer";

  const variantStyles = {
    primary:
      "bg-foreground text-background hover:bg-neutral-200 active:bg-neutral-300 shadow-sm",
    secondary:
      "bg-muted text-foreground border border-border hover:bg-[#242426] hover:border-zinc-700 active:bg-[#1a1a1c]",
    outline:
      "border border-border bg-transparent text-foreground hover:bg-muted active:bg-muted/80",
    ghost:
      "text-muted-foreground hover:text-foreground hover:bg-muted active:bg-muted/80",
    tealOutline:
      "border border-accent-border bg-accent-soft text-accent hover:border-accent hover:bg-accent-soft/80",
  };

  const sizeStyles = {
    sm: "text-xs px-3 py-1.5 gap-1.5 h-8",
    md: "text-sm px-4 py-2 gap-2 h-10",
    lg: "text-base px-5 py-2.5 gap-2.5 h-12 rounded-[12px]",
  };

  const combinedClasses = cn(
    baseStyles,
    variantStyles[variant],
    sizeStyles[size],
    className
  );

  if (href) {
    return (
      <Link href={href} className={combinedClasses}>
        {icon && <span className="shrink-0">{icon}</span>}
        <span>{children}</span>
        {iconRight && <span className="shrink-0">{iconRight}</span>}
      </Link>
    );
  }

  return (
    <button className={combinedClasses} {...props}>
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
      {iconRight && <span className="shrink-0">{iconRight}</span>}
    </button>
  );
}
