"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import type { Achievement } from "@/lib/types";
import { RARITY_COLORS } from "@/lib/constants";
import { RarityBadge } from "@/components/common/Badge";

interface AchievementToastProps {
  achievement: Achievement;
  onDismiss: () => void;
}

const ICON_MAP: Record<string, string> = {
  footprint: "\uD83D\uDC63",
  checkmarks: "\u2705",
  bolt: "\u26A1",
  flame: "\uD83D\uDD25",
  star: "\u2B50",
  trophy: "\uD83C\uDFC6",
  medal: "\uD83C\uDFC5",
  snake: "\uD83D\uDC0D",
  moon: "\uD83C\uDF19",
};

function getIconForSlug(slug: string): string {
  for (const [key, icon] of Object.entries(ICON_MAP)) {
    if (slug.includes(key)) return icon;
  }
  return "\uD83C\uDFC6";
}

export function AchievementToast({ achievement, onDismiss }: AchievementToastProps) {
  const rarityColor = RARITY_COLORS[achievement.rarity];

  // Auto-dismiss after 4 seconds
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 80, y: -10 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      exit={{ opacity: 0, x: 80, scale: 0.95 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className="pointer-events-auto w-80 rounded-xl border bg-[var(--surface)] shadow-2xl shadow-black/50 overflow-hidden"
      style={{
        borderColor: `${rarityColor}40`,
        boxShadow: `0 0 20px ${rarityColor}15, 0 8px 32px rgba(0,0,0,0.5)`,
      }}
    >
      {/* Top accent bar */}
      <div className="h-0.5" style={{ background: rarityColor }} />

      <div className="p-4 flex items-start gap-3">
        {/* Icon */}
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0"
          style={{ background: `${rarityColor}18` }}
        >
          {getIconForSlug(achievement.iconSlug)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
              Achievement Unlocked
            </p>
          </div>
          <p className="font-semibold text-sm text-[var(--foreground)] truncate">
            {achievement.title}
          </p>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5 line-clamp-2">
            {achievement.description}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <RarityBadge rarity={achievement.rarity} />
            {achievement.xpReward > 0 && (
              <span className="text-xs font-semibold text-[var(--xp-gold)]">
                +{achievement.xpReward} XP
              </span>
            )}
          </div>
        </div>

        {/* Dismiss button */}
        <button
          onClick={onDismiss}
          className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-3)] transition-colors shrink-0"
          aria-label="Dismiss"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </motion.div>
  );
}

/**
 * Container for stacking multiple achievement toasts.
 * Renders in fixed position at top-right of the viewport.
 */
interface AchievementToastStackProps {
  toasts: Array<{ id: string; achievement: Achievement }>;
  onDismiss: (id: string) => void;
}

export function AchievementToastStack({ toasts, onDismiss }: AchievementToastStackProps) {
  return (
    <div className="fixed top-4 right-4 z-[60] flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <AchievementToast
          key={toast.id}
          achievement={toast.achievement}
          onDismiss={() => onDismiss(toast.id)}
        />
      ))}
    </div>
  );
}
