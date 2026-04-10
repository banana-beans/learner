import type { ReactNode } from "react";
import type { RarityTier } from "@/lib/types";
import { RARITY_COLORS } from "@/lib/constants";

type BadgeVariant =
  | "default"
  | "blue"
  | "cyan"
  | "teal"
  | "purple"
  | "orange"
  | "green"
  | "yellow"
  | "red"
  | "gold";

type BadgeSize = "xs" | "sm" | "md";

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  /** Render as a filled pill instead of bordered */
  filled?: boolean;
  className?: string;
}

const variantStyles: Record<BadgeVariant, { text: string; bg: string; border: string }> = {
  default: {
    text: "text-[var(--text-secondary)]",
    bg: "bg-[var(--surface-3)]",
    border: "border-[var(--border)]",
  },
  blue: {
    text: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
  },
  cyan: {
    text: "text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/30",
  },
  teal: {
    text: "text-teal-400",
    bg: "bg-teal-500/10",
    border: "border-teal-500/30",
  },
  purple: {
    text: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/30",
  },
  orange: {
    text: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/30",
  },
  green: {
    text: "text-green-400",
    bg: "bg-green-500/10",
    border: "border-green-500/30",
  },
  yellow: {
    text: "text-yellow-400",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/30",
  },
  red: {
    text: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/30",
  },
  gold: {
    text: "text-[var(--xp-gold)]",
    bg: "bg-[var(--xp-gold)]/10",
    border: "border-[var(--xp-gold)]/30",
  },
};

const sizeClasses: Record<BadgeSize, string> = {
  xs: "text-[10px] px-1.5 py-0.5",
  sm: "text-xs px-2 py-0.5",
  md: "text-sm px-2.5 py-1",
};

export function Badge({
  children,
  variant = "default",
  size = "sm",
  filled = false,
  className = "",
}: BadgeProps) {
  const styles = variantStyles[variant];
  return (
    <span
      className={[
        "inline-flex items-center gap-1 font-medium rounded-full",
        styles.text,
        filled ? styles.bg.replace("/10", "/30") : styles.bg,
        filled ? "" : `border ${styles.border}`,
        sizeClasses[size],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </span>
  );
}

/** Rarity badge with color from RARITY_COLORS constant */
export function RarityBadge({ rarity }: { rarity: RarityTier }) {
  const color = RARITY_COLORS[rarity];
  const label = rarity.charAt(0).toUpperCase() + rarity.slice(1);
  return (
    <span
      className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full border"
      style={{
        color,
        background: `${color}18`,
        borderColor: `${color}40`,
      }}
    >
      {label}
    </span>
  );
}

/** XP reward badge */
export function XPBadge({ amount }: { amount: number }) {
  return (
    <Badge variant="gold" size="sm">
      +{amount.toLocaleString()} XP
    </Badge>
  );
}
