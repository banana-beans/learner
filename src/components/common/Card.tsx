"use client";

import { motion } from "framer-motion";
import type { ReactNode, HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** Adds a subtle hover lift and border highlight */
  interactive?: boolean;
  /** Adds a colored top accent bar */
  accent?: string;
  padding?: "none" | "sm" | "md" | "lg";
  glass?: boolean;
}

const paddingClasses = {
  none: "",
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
};

export function Card({
  children,
  interactive = false,
  accent,
  padding = "md",
  glass = false,
  className = "",
  ...props
}: CardProps) {
  const base = [
    "rounded-xl border",
    glass
      ? "bg-white/5 backdrop-blur-sm border-white/10"
      : "bg-[var(--surface)] border-[var(--border)]",
    paddingClasses[padding],
    interactive
      ? "cursor-pointer hover:border-[var(--accent-blue)]/50 hover:bg-[var(--surface-2)] transition-all duration-200"
      : "",
    "relative overflow-hidden",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (interactive) {
    return (
      <motion.div
        whileHover={{ y: -2 }}
        transition={{ duration: 0.15 }}
        className={base}
        {...(props as React.ComponentProps<typeof motion.div>)}
      >
        {accent && (
          <div
            className="absolute top-0 left-0 right-0 h-0.5"
            style={{ background: accent }}
          />
        )}
        {children}
      </motion.div>
    );
  }

  return (
    <div className={base} {...props}>
      {accent && (
        <div
          className="absolute top-0 left-0 right-0 h-0.5"
          style={{ background: accent }}
        />
      )}
      {children}
    </div>
  );
}

/** Pre-composed card header with title and optional right-side content */
export function CardHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 mb-4">
      <div>
        <h3 className="font-semibold text-[var(--foreground)]">{title}</h3>
        {subtitle && (
          <p className="text-sm text-[var(--text-muted)] mt-0.5">{subtitle}</p>
        )}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  );
}
