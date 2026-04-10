/**
 * Session Suggestion Engine
 *
 * Suggests an optimal learning session based on user progress, streak status,
 * and time of day. Balances new learning vs review debt vs challenge completion.
 *
 * Session modes:
 * - quick (5 min): review only, commute-friendly
 * - standard (15 min): lesson or challenge + reviews
 * - deep (30 min): full lesson + challenge + boss
 * - review (10 min): focused spaced repetition session
 */

import type {
  SessionMode,
  UserProgress,
  StreakData,
  SessionSuggestion,
  SuggestedActivity,
  Curriculum,
} from "@/lib/types";
import type { ReviewCard } from "@/lib/types";
import { SESSION_DURATIONS, XP_BASE } from "@/lib/constants";
import { getAvailableNodes } from "./progression";
import { getDueCards } from "./spaced-repetition";

/**
 * Suggests a learning session based on context.
 *
 * Priority logic:
 * 1. If streak is at risk → prioritize a quick review to maintain it
 * 2. If many cards are due (>20) → suggest review session
 * 3. Morning hours (6–10am) → standard or deep learning
 * 4. Evening hours (7–10pm) → standard session
 * 5. Default → standard session with available node
 *
 * @param progress - User progress
 * @param streak - Current streak data
 * @param allCards - All review cards (to find due)
 * @param curriculum - Curriculum for finding available nodes
 * @param now - Current datetime (defaults to system time)
 * @returns Suggested session with estimated duration and activities
 */
export function suggestSession(
  progress: UserProgress,
  streak: StreakData,
  allCards: ReviewCard[],
  curriculum: Curriculum,
  now: Date = new Date()
): SessionSuggestion {
  const dueCards = getDueCards(allCards, now);
  const availableNodes = getAvailableNodes(
    progress.completedNodes,
    progress.inProgressNodes,
    curriculum
  );
  const hour = now.getHours();

  // Determine suggested mode
  let mode: SessionMode = "standard";
  let reason = "Ready for your next learning session";

  const streakAtRisk =
    streak.lastActiveDate !== now.toISOString().split("T")[0] && hour >= 20;

  if (streakAtRisk) {
    mode = "quick";
    reason = "Quick review to protect your streak!";
  } else if (dueCards.length > 30) {
    mode = "review";
    reason = `${dueCards.length} cards due — clear your review queue`;
  } else if (hour >= 6 && hour < 10) {
    mode = "deep";
    reason = "Morning is great for deep learning";
  } else if (hour >= 22 || hour < 6) {
    mode = "quick";
    reason = "Late night quick session";
  }

  const activities = buildActivities(mode, dueCards, availableNodes, progress);

  return {
    mode,
    estimatedMinutes: SESSION_DURATIONS[mode],
    activities,
    reason,
  };
}

function buildActivities(
  mode: SessionMode,
  dueCards: ReviewCard[],
  availableNodes: ReturnType<typeof getAvailableNodes>,
  progress: UserProgress
): SuggestedActivity[] {
  const activities: SuggestedActivity[] = [];

  switch (mode) {
    case "quick": {
      // 3–5 due review cards
      const cards = dueCards.slice(0, 5);
      for (const card of cards) {
        activities.push({
          type: "review",
          label: `Review: ${card.front.slice(0, 40)}...`,
          xpEstimate: XP_BASE.REVIEW_GOOD,
        });
      }
      break;
    }

    case "review": {
      // Up to 20 due review cards
      const cards = dueCards.slice(0, 20);
      for (const card of cards) {
        activities.push({
          type: "review",
          label: `Review: ${card.front.slice(0, 40)}...`,
          xpEstimate: XP_BASE.REVIEW_GOOD,
        });
      }
      break;
    }

    case "standard": {
      // 1 lesson or challenge + 5 reviews
      if (availableNodes.length > 0) {
        const node = availableNodes[0];
        activities.push({
          type: "lesson",
          nodeId: node.id,
          label: `Lesson: ${node.title}`,
          xpEstimate: XP_BASE.LESSON_COMPLETE,
        });
      } else if (progress.completedNodes.length > 0) {
        // Suggest a challenge on a completed node
        const nodeId = progress.completedNodes[progress.completedNodes.length - 1];
        activities.push({
          type: "challenge",
          nodeId,
          label: "Challenge: Practice what you learned",
          xpEstimate: XP_BASE.CHALLENGE_D2,
        });
      }

      // Add 5 due reviews
      for (const card of dueCards.slice(0, 5)) {
        activities.push({
          type: "review",
          label: `Review: ${card.front.slice(0, 40)}...`,
          xpEstimate: XP_BASE.REVIEW_GOOD,
        });
      }
      break;
    }

    case "deep": {
      // Full lesson + 2 challenges + boss + reviews
      if (availableNodes.length > 0) {
        const node = availableNodes[0];
        activities.push({
          type: "lesson",
          nodeId: node.id,
          label: `Lesson: ${node.title}`,
          xpEstimate: XP_BASE.LESSON_COMPLETE,
        });
        activities.push({
          type: "challenge",
          nodeId: node.id,
          label: `Challenge: ${node.title} — Warm-up`,
          xpEstimate: XP_BASE.CHALLENGE_D2,
        });
        activities.push({
          type: "challenge",
          nodeId: node.id,
          label: `Challenge: ${node.title} — Boss`,
          xpEstimate: XP_BASE.CHALLENGE_D4,
        });
      }

      // Add 10 due reviews
      for (const card of dueCards.slice(0, 10)) {
        activities.push({
          type: "review",
          label: `Review: ${card.front.slice(0, 40)}...`,
          xpEstimate: XP_BASE.REVIEW_GOOD,
        });
      }
      break;
    }
  }

  return activities;
}

/**
 * Estimates total XP for a list of suggested activities.
 */
export function estimateSessionXP(activities: SuggestedActivity[]): number {
  return activities.reduce((sum, a) => sum + a.xpEstimate, 0);
}
