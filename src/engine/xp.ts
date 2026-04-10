/**
 * XP Calculation Engine
 *
 * Implements the XP and leveling system described in research/08-progress-tracking-xp-model.md.
 * Level formula: total_xp_for_level = 100 × level^1.8
 * This gives a fast early progression (level 10 at ~6,300 XP) and a long tail
 * (level 100 requires ~3.98M total XP, roughly 5.5 years at 200 XP/day).
 */

import { LEVEL_XP_TABLE, STREAK_MULTIPLIERS, LEVEL_TITLES, XP_MULTIPLIERS, HINT_XP_PENALTIES } from "@/lib/constants";
import type { HintTier } from "@/lib/types";

export interface XPMultipliers {
  firstAttempt?: boolean;
  speedBonus?: boolean;
  noHint?: boolean;
  hintsUsed?: HintTier[];
  streakDays?: number;
}

/**
 * Calculates final XP after applying all multipliers.
 *
 * Order: base × streak × (first_attempt if applicable) × (speed if applicable)
 *        × (no_hint if applicable) × (hint_penalties if hints used)
 *
 * @param base - Base XP value before multipliers
 * @param multipliers - Active multipliers to apply
 * @returns Final XP amount (always an integer)
 */
export function calculateXP(base: number, multipliers: XPMultipliers = {}): number {
  let xp = base;

  // Streak multiplier
  if (multipliers.streakDays !== undefined) {
    xp *= getStreakMultiplier(multipliers.streakDays);
  }

  // First-attempt bonus
  if (multipliers.firstAttempt) {
    xp *= XP_MULTIPLIERS.FIRST_ATTEMPT;
  }

  // Speed bonus
  if (multipliers.speedBonus) {
    xp *= XP_MULTIPLIERS.SPEED_BONUS;
  }

  // No-hint bonus (only if no hints were used at all)
  if (multipliers.noHint && (!multipliers.hintsUsed || multipliers.hintsUsed.length === 0)) {
    xp *= XP_MULTIPLIERS.NO_HINT;
  }

  // Hint penalties (apply the most severe penalty from used hints)
  if (multipliers.hintsUsed && multipliers.hintsUsed.length > 0) {
    const penalties = multipliers.hintsUsed.map((h) => HINT_XP_PENALTIES[h]);
    const worstPenalty = Math.min(...penalties);
    xp *= worstPenalty;
  }

  return Math.floor(xp);
}

/**
 * Returns the current level for a given total XP amount.
 * Uses the precomputed LEVEL_XP_TABLE for O(log n) lookup.
 *
 * @param totalXP - Cumulative XP earned
 * @returns Level 1–100
 */
export function getLevelForXP(totalXP: number): number {
  if (totalXP <= 0) return 1;
  let level = 1;
  for (let i = 1; i < LEVEL_XP_TABLE.length; i++) {
    if (totalXP >= LEVEL_XP_TABLE[i]) {
      level = i;
    } else {
      break;
    }
  }
  return Math.min(level, 100);
}

/**
 * Returns the minimum XP required to reach a given level.
 *
 * @param level - Target level (1–100)
 * @returns Minimum cumulative XP for that level
 */
export function getXPForLevel(level: number): number {
  const clampedLevel = Math.max(1, Math.min(100, level));
  return LEVEL_XP_TABLE[clampedLevel] ?? LEVEL_XP_TABLE[LEVEL_XP_TABLE.length - 1];
}

/**
 * Returns XP progress within the current level as a 0–1 fraction.
 * Useful for rendering level progress bars.
 *
 * @param totalXP - Cumulative XP earned
 * @returns Progress fraction 0–1
 */
export function getLevelProgress(totalXP: number): number {
  const level = getLevelForXP(totalXP);
  if (level >= 100) return 1;
  const currentLevelXP = getXPForLevel(level);
  const nextLevelXP = getXPForLevel(level + 1);
  const progress = (totalXP - currentLevelXP) / (nextLevelXP - currentLevelXP);
  return Math.max(0, Math.min(1, progress));
}

/**
 * Returns XP needed to reach the next level from current total XP.
 *
 * @param totalXP - Cumulative XP earned
 * @returns XP remaining to next level
 */
export function getXPToNextLevel(totalXP: number): number {
  const level = getLevelForXP(totalXP);
  if (level >= 100) return 0;
  return getXPForLevel(level + 1) - totalXP;
}

/**
 * Returns the active streak multiplier for a given streak length.
 * Uses tiered thresholds from STREAK_MULTIPLIERS constant.
 *
 * @param streakDays - Current streak in days
 * @returns Multiplier (1.0–3.5)
 */
export function getStreakMultiplier(streakDays: number): number {
  let multiplier = 1.0;
  for (const tier of STREAK_MULTIPLIERS) {
    if (streakDays >= tier.minDays) {
      multiplier = tier.multiplier;
    }
  }
  return multiplier;
}

/**
 * Returns the title badge for a given level.
 * Title changes every 5 levels.
 *
 * @param level - Current level (1–100)
 * @returns Title string
 */
export function getLevelTitle(level: number): string {
  let title = "Newcomer";
  for (const entry of LEVEL_TITLES) {
    if (level >= entry.minLevel) {
      title = entry.title;
    }
  }
  return title;
}
