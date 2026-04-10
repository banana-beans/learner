"use client";

import { useUserStore } from "@/store/user-store";
import { getStreakMultiplier } from "@/engine/xp";
import { isStreakAtRisk, getStreakLabel } from "@/engine/streak";
import { motion } from "framer-motion";

interface StreakBadgeProps {
  /** Show in compact icon-only mode */
  iconOnly?: boolean;
}

export function StreakBadge({ iconOnly = false }: StreakBadgeProps) {
  const { streak } = useUserStore();
  const { currentStreak, freezesAvailable } = streak;
  const multiplier = getStreakMultiplier(currentStreak);
  const atRisk = isStreakAtRisk(streak.lastActiveDate, new Date());
  const label = getStreakLabel(currentStreak);

  const flameColor = atRisk
    ? "#ef4444"
    : currentStreak >= 30
      ? "#f97316"
      : currentStreak >= 7
        ? "#f59e0b"
        : "#6b6b8a";

  const FlameIcon = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill={flameColor}>
      <path d="M12 2C9.3 5 8 7.5 8 10c0 2.2 1.8 4 4 4s4-1.8 4-4c0-1.5-.7-2.8-1.5-4 0 0-1 2-2.5 2-1.2 0-2-1-2-2 0-2 2-4 2-4z" />
      <path d="M12 18c-3.3 0-6-2.7-6-6 0-2 .8-3.8 2-5.2C8.3 9 9 11 11 11c1.5 0 2.5-1.2 2.5-1.2.3.7.5 1.4.5 2.2 0 1.1-.4 2.1-1 2.8C14.7 14.4 16 12.9 16 11c0-.7-.1-1.4-.4-2C16.9 10.2 18 12 18 14c0 2.2-2.7 4-6 4z" />
    </svg>
  );

  if (iconOnly) {
    return (
      <motion.div
        className="relative flex items-center gap-1"
        animate={atRisk ? { scale: [1, 1.05, 1] } : {}}
        transition={{ repeat: atRisk ? Infinity : 0, duration: 2 }}
      >
        {FlameIcon}
        <span
          className="text-sm font-bold tabular-nums"
          style={{ color: flameColor }}
        >
          {currentStreak}
        </span>
        {freezesAvailable > 0 && (
          <span className="absolute -top-1 -right-1 text-[9px] bg-[var(--accent-cyan)] text-black rounded-full w-3.5 h-3.5 flex items-center justify-center font-bold">
            {freezesAvailable}
          </span>
        )}
      </motion.div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {/* Flame + count */}
      <motion.div
        className="flex flex-col items-center"
        animate={atRisk ? { scale: [1, 1.08, 1] } : {}}
        transition={{ repeat: atRisk ? Infinity : 0, duration: 2 }}
      >
        <div className="flex items-center gap-1">
          {FlameIcon}
          <span
            className="text-2xl font-black tabular-nums leading-none"
            style={{ color: flameColor }}
          >
            {currentStreak}
          </span>
        </div>
        <span className="text-[10px] text-[var(--text-muted)] mt-0.5">day streak</span>
      </motion.div>

      {/* Details */}
      <div>
        <p className="text-sm font-medium text-[var(--foreground)]">{label}</p>
        <p className="text-xs text-[var(--text-muted)]">
          {multiplier > 1 ? (
            <span className="text-[var(--xp-gold)]">{multiplier}× XP multiplier</span>
          ) : (
            "Build a streak for XP bonuses"
          )}
        </p>
        {freezesAvailable > 0 && (
          <p className="text-xs text-[var(--accent-cyan)] mt-0.5">
            ❄ {freezesAvailable} freeze token{freezesAvailable !== 1 ? "s" : ""} available
          </p>
        )}
        {atRisk && (
          <p className="text-xs text-red-400 mt-0.5 font-medium">
            ⚠ Streak at risk — practice today!
          </p>
        )}
      </div>
    </div>
  );
}
