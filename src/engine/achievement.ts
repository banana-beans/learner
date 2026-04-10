/**
 * Achievement Check Engine
 *
 * Evaluates all achievement conditions against current user progress and stats.
 * Returns any newly earned achievements that haven't been awarded yet.
 * Called after any significant user action (lesson complete, challenge, review, etc.)
 */

import type { Achievement, UserProgress, StreakData } from "@/lib/types";

export interface AchievementStats {
  totalXP: number;
  level: number;
  streak: StreakData;
  totalLessonsCompleted: number;
  totalChallengesCompleted: number;
  totalReviewsCompleted: number;
  perfectReviewSessions: number;
  challengesNoHint: number;
  loginDays: number;
}

/**
 * Checks all defined achievements against current progress and stats.
 * Only returns achievements that are newly earned (not already in progress.earnedAchievements).
 *
 * @param progress - Current user progress
 * @param stats - Aggregated user statistics
 * @param allAchievements - Full list of achievement definitions to check
 * @returns Newly earned achievements
 */
export function checkAchievements(
  progress: UserProgress,
  stats: AchievementStats,
  allAchievements: Achievement[]
): Achievement[] {
  const earned = new Set(progress.earnedAchievements);
  const newlyEarned: Achievement[] = [];

  for (const achievement of allAchievements) {
    if (earned.has(achievement.id)) continue;

    if (evaluateCondition(achievement, progress, stats)) {
      newlyEarned.push(achievement);
    }
  }

  return newlyEarned;
}

/**
 * Evaluates a single achievement's condition.
 *
 * @param achievement - Achievement definition
 * @param progress - User progress data
 * @param stats - Aggregated stats
 * @returns true if the condition is met
 */
export function evaluateCondition(
  achievement: Achievement,
  progress: UserProgress,
  stats: AchievementStats
): boolean {
  const { condition } = achievement;
  const threshold = condition.threshold ?? 0;

  switch (condition.type) {
    case "nodes_completed":
      return progress.completedNodes.length >= threshold;

    case "nodes_mastered":
      return progress.masteredNodes.length >= threshold;

    case "streak_days":
      return stats.streak.currentStreak >= threshold;

    case "total_xp":
      return stats.totalXP >= threshold;

    case "level_reached":
      return stats.level >= threshold;

    case "branch_completed": {
      if (!condition.branchId) return false;
      const branchNodes = progress.completedNodes.filter((id) =>
        id.startsWith(condition.branchId + ":")
      );
      // A branch is considered "completed" if at least 1 node in it is completed
      // Full completion check requires curriculum — done at call site
      return branchNodes.length >= threshold;
    }

    case "branch_mastered": {
      if (!condition.branchId) return false;
      const branchMastered = progress.masteredNodes.filter((id) =>
        id.startsWith(condition.branchId + ":")
      );
      return branchMastered.length >= threshold;
    }

    case "challenges_completed":
      return stats.totalChallengesCompleted >= threshold;

    case "challenges_no_hint":
      return stats.challengesNoHint >= threshold;

    case "reviews_completed":
      return stats.totalReviewsCompleted >= threshold;

    case "perfect_reviews":
      return stats.perfectReviewSessions >= threshold;

    case "login_days":
      return stats.loginDays >= threshold;

    case "specific_node":
      return condition.nodeId
        ? progress.completedNodes.includes(condition.nodeId)
        : false;

    case "custom":
      // Custom conditions are evaluated at call site
      return false;

    default:
      return false;
  }
}

/**
 * Sorts newly earned achievements by rarity (legendary first) for display ordering.
 */
export function sortAchievementsByRarity(achievements: Achievement[]): Achievement[] {
  const rarityOrder = { legendary: 0, epic: 1, rare: 2, uncommon: 3, common: 4 };
  return [...achievements].sort(
    (a, b) => rarityOrder[a.rarity] - rarityOrder[b.rarity]
  );
}
