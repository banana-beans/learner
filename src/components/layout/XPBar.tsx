"use client";

import { useUserStore } from "@/store/user-store";
import { getLevelForXP, getLevelProgress, getXPToNextLevel, getLevelTitle } from "@/engine/xp";
import { ProgressBar } from "@/components/common/ProgressBar";
import { ProgressRing } from "@/components/common/ProgressRing";

interface XPBarProps {
  /** Compact mode for sidebar header */
  compact?: boolean;
}

export function XPBar({ compact = false }: XPBarProps) {
  const { totalXP, level } = useUserStore();
  const progress = getLevelProgress(totalXP);
  const xpToNext = getXPToNextLevel(totalXP);
  const title = getLevelTitle(level);

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-4 border-b border-[var(--border)]">
        <ProgressRing value={progress} size={36} strokeWidth={3} color="var(--xp-gold)">
          <span className="text-[9px] font-bold text-[var(--xp-gold)]">{level}</span>
        </ProgressRing>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-1">
            <span className="text-xs font-semibold text-[var(--foreground)] truncate">{title}</span>
            <span className="text-[10px] text-[var(--text-muted)] tabular-nums shrink-0">Lv {level}</span>
          </div>
          <ProgressBar value={progress} color="var(--xp-gold)" height={3} animate={false} className="mt-1" />
          <p className="text-[10px] text-[var(--text-muted)] mt-0.5 tabular-nums">
            {xpToNext.toLocaleString()} XP to next
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {/* Level ring */}
      <ProgressRing value={progress} size={44} strokeWidth={4} color="var(--xp-gold)">
        <span className="text-[11px] font-bold text-[var(--xp-gold)]">{level}</span>
      </ProgressRing>

      {/* XP info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-semibold text-[var(--foreground)]">{title}</span>
          <span className="text-xs text-[var(--text-muted)] tabular-nums">Level {level}</span>
        </div>
        <ProgressBar value={progress} color="var(--xp-gold)" height={5} className="mt-1.5" />
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-[var(--text-muted)] tabular-nums">
            {totalXP.toLocaleString()} XP total
          </span>
          <span className="text-xs text-[var(--text-muted)] tabular-nums">
            {xpToNext.toLocaleString()} to next
          </span>
        </div>
      </div>
    </div>
  );
}
