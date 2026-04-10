/**
 * Streak Tracking Engine
 *
 * Manages daily learning streaks, freeze token logic, and milestone rewards.
 * A streak increments when the user completes any activity on consecutive calendar days.
 * A freeze token protects the streak when the user misses exactly one day.
 */

import type { StreakData } from "@/lib/types";
import { STREAK_MILESTONES } from "@/lib/constants";

export interface StreakUpdateResult {
  streak: StreakData;
  /** Did the streak increase? */
  increased: boolean;
  /** Was a freeze token consumed? */
  frozeUsed: boolean;
  /** Was the streak broken? */
  broken: boolean;
  /** Was a new milestone reached? */
  milestone?: { days: number; reward: string };
}

/**
 * Updates streak state given the last active date and the current date.
 * Auto-uses a freeze token if the user missed exactly one day and has freezes available.
 *
 * @param streak - Current streak data
 * @param currentDateStr - Today's date in YYYY-MM-DD format
 * @returns Updated streak and metadata about what changed
 */
export function updateStreak(
  streak: StreakData,
  currentDateStr: string
): StreakUpdateResult {
  const today = new Date(currentDateStr + "T00:00:00Z");
  const lastActive = streak.lastActiveDate
    ? new Date(streak.lastActiveDate + "T00:00:00Z")
    : null;

  // Already counted today — no change
  if (streak.lastActiveDate === currentDateStr) {
    return { streak, increased: false, frozeUsed: false, broken: false };
  }

  let newStreak = streak.currentStreak;
  let frozeUsed = false;
  let broken = false;

  if (!lastActive) {
    // First ever activity
    newStreak = 1;
  } else {
    const daysDiff = Math.round(
      (today.getTime() - lastActive.getTime()) / 86_400_000
    );

    if (daysDiff === 1) {
      // Consecutive day — streak continues
      newStreak = streak.currentStreak + 1;
    } else if (daysDiff === 2 && streak.freezesAvailable > 0) {
      // Missed one day but have a freeze — use it automatically
      const missedDate = new Date(lastActive);
      missedDate.setDate(missedDate.getDate() + 1);
      const missedDateStr = missedDate.toISOString().split("T")[0];

      frozeUsed = true;
      newStreak = streak.currentStreak + 1;
      streak = {
        ...streak,
        freezesAvailable: streak.freezesAvailable - 1,
        freezesUsed: streak.freezesUsed + 1,
        frozenDates: [...streak.frozenDates, missedDateStr],
      };
    } else {
      // Streak broken
      broken = true;
      newStreak = 1;
    }
  }

  const longestStreak = Math.max(newStreak, streak.longestStreak);

  // Check if a milestone is crossed
  const milestone = STREAK_MILESTONES.find((m) => m.days === newStreak);
  let newFreezes = streak.freezesAvailable;
  if (milestone?.freezeEarned) {
    newFreezes = Math.min(newFreezes + 1, 5); // cap at 5 freeze tokens
  }

  const updatedStreak: StreakData = {
    ...streak,
    currentStreak: newStreak,
    longestStreak,
    lastActiveDate: currentDateStr,
    freezesAvailable: newFreezes,
  };

  return {
    streak: updatedStreak,
    increased: newStreak > streak.currentStreak || (!lastActive && newStreak === 1),
    frozeUsed,
    broken,
    milestone: milestone ? { days: milestone.days, reward: milestone.reward } : undefined,
  };
}

/**
 * Determines whether a streak freeze should be applied.
 * Returns true if the user missed exactly 1 day and has freezes available.
 *
 * @param lastActiveDateStr - Last active date (YYYY-MM-DD)
 * @param currentDateStr - Today's date (YYYY-MM-DD)
 * @param freezesAvailable - Number of freeze tokens available
 */
export function shouldFreezeStreak(
  lastActiveDateStr: string | null,
  currentDateStr: string,
  freezesAvailable: number
): boolean {
  if (!lastActiveDateStr || freezesAvailable <= 0) return false;
  const last = new Date(lastActiveDateStr + "T00:00:00Z");
  const current = new Date(currentDateStr + "T00:00:00Z");
  const daysDiff = Math.round((current.getTime() - last.getTime()) / 86_400_000);
  return daysDiff === 2;
}

/**
 * Returns milestone metadata for a given streak day count, if applicable.
 * Returns undefined if no milestone is reached at that day count.
 *
 * @param streakDays - Current streak in days
 */
export function getStreakMilestone(
  streakDays: number
): { days: number; reward: string; freezeEarned: boolean } | undefined {
  return STREAK_MILESTONES.find((m) => m.days === streakDays);
}

/**
 * Returns a human-readable label for a streak length.
 *
 * @param streakDays - Current streak in days
 * @returns Display string like "7-day streak" or "No streak yet"
 */
export function getStreakLabel(streakDays: number): string {
  if (streakDays === 0) return "No streak yet";
  if (streakDays === 1) return "1-day streak";
  return `${streakDays}-day streak`;
}

/**
 * Returns whether the streak is "at risk" (user hasn't practiced today
 * and it's late in the day — after 8pm local time).
 */
export function isStreakAtRisk(lastActiveDateStr: string | null, now: Date): boolean {
  if (!lastActiveDateStr) return false;
  const todayStr = now.toISOString().split("T")[0];
  if (lastActiveDateStr === todayStr) return false; // already practiced today
  const hours = now.getHours();
  return hours >= 20; // 8pm or later
}
