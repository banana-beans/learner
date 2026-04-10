/**
 * FSRS Spaced Repetition Engine
 *
 * Implements the Free Spaced Repetition Scheduler (FSRS v4) algorithm.
 * Reference: research/11-spaced-repetition-engine.md
 *
 * Core concepts:
 * - Stability (S): how many days until retrieval probability drops to target retention
 * - Difficulty (D): inherent card difficulty (1 easy → 10 hard)
 * - Retrievability (R): current recall probability based on elapsed time
 *
 * Formula: R(t) = e^(ln(0.9) * t / S)
 * where t = elapsed days, S = stability, 0.9 = target retention
 */

import type { ReviewCard, Rating, FSRSState } from "@/lib/types";
import { FSRS_DEFAULTS } from "@/lib/constants";

// FSRS v4 weight parameters (default, pre-optimization)
const W = [
  0.4072, 1.1829, 3.1262, 15.4722, 7.2102, 0.5316, 1.0651, 0.0589,
  1.4330, 0.1544, 1.0070, 1.9395, 0.1100, 0.2900, 2.2700, 0.3000,
  2.9898, 0.5100, 0.3400,
];

/**
 * Computes retrievability (recall probability) for a card.
 * Returns 1.0 for new cards, decaying toward 0 over time.
 *
 * R(t) = e^(ln(target_retention) * elapsed_days / stability)
 *
 * @param card - Review card with FSRS state
 * @param now - Current datetime
 * @returns Retrievability fraction 0–1
 */
export function calculateRetention(card: ReviewCard, now: Date): number {
  if (card.fsrs.state === "new") return 1.0;
  if (!card.lastReviewedAt) return 1.0;

  const elapsedDays =
    (now.getTime() - new Date(card.lastReviewedAt).getTime()) / 86_400_000;

  return Math.exp(
    (Math.log(FSRS_DEFAULTS.TARGET_RETENTION) / card.fsrs.stability) * elapsedDays
  );
}

/**
 * Returns the initial stability for a new card based on its first rating.
 * Uses FSRS w parameters for initial stability estimation.
 */
function initialStability(rating: Rating): number {
  const ratingIndex = { again: 0, hard: 1, good: 2, easy: 3 }[rating];
  return Math.max(0.1, W[ratingIndex]);
}

/**
 * Returns the initial difficulty for a new card based on its first rating.
 * D0(G) = w4 - exp(w5 * (G - 1)) + 1
 * where G is the rating (1=again, 2=hard, 3=good, 4=easy)
 */
function initialDifficulty(rating: Rating): number {
  const ratingMap = { again: 1, hard: 2, good: 3, easy: 4 };
  const g = ratingMap[rating];
  const d = W[4] - Math.exp(W[5] * (g - 1)) + 1;
  return Math.max(1, Math.min(10, d));
}

/**
 * Updates difficulty after a review.
 * D' = D - w6 * (G - 3)  (clamped to [1, 10])
 */
function updateDifficulty(d: number, rating: Rating): number {
  const ratingMap = { again: 1, hard: 2, good: 3, easy: 4 };
  const g = ratingMap[rating];
  const newD = d - W[6] * (g - 3);
  return Math.max(1, Math.min(10, newD));
}

/**
 * Calculates new stability after a successful review (Good or Easy).
 * S'(r) = S * e^(w8) * (11 - D) * S^(-w9) * (e^(w10*(1-R)) - 1) * w15 (if hard) * w16 (if easy)
 */
function stabilityAfterRecall(
  s: number,
  d: number,
  r: number,
  rating: Rating
): number {
  const hardPenalty = rating === "hard" ? W[15] : 1;
  const easyBonus = rating === "easy" ? W[16] : 1;

  const newS =
    s *
    (Math.exp(W[8]) *
      (11 - d) *
      Math.pow(s, -W[9]) *
      (Math.exp(W[10] * (1 - r)) - 1) *
      hardPenalty *
      easyBonus +
      1);

  return Math.max(0.1, Math.min(36500, newS));
}

/**
 * Calculates new stability after a lapse (Again rating).
 * S'(f) = w11 * D^(-w12) * ((S+1)^w13 - 1) * e^(w14*(1-R))
 */
function stabilityAfterLapse(s: number, d: number, r: number): number {
  const newS =
    W[11] *
    Math.pow(d, -W[12]) *
    (Math.pow(s + 1, W[13]) - 1) *
    Math.exp(W[14] * (1 - r));
  return Math.max(0.1, Math.min(36500, newS));
}

/**
 * Computes next FSRS state for a card after a review.
 * This is the core FSRS scheduling function.
 *
 * @param card - Card being reviewed
 * @param rating - User's self-rating
 * @param now - Time of review
 * @returns Updated FSRSState with new stability, difficulty, and scheduled days
 */
export function scheduleReview(
  card: ReviewCard,
  rating: Rating,
  now: Date = new Date()
): FSRSState {
  const { fsrs } = card;
  const elapsedDays = card.lastReviewedAt
    ? (now.getTime() - new Date(card.lastReviewedAt).getTime()) / 86_400_000
    : 0;

  let newStability: number;
  let newDifficulty: number;
  let newState: FSRSState["state"];
  let scheduledDays: number;

  if (fsrs.state === "new") {
    // First review — use initial stability/difficulty
    newStability = initialStability(rating);
    newDifficulty = initialDifficulty(rating);

    if (rating === "again") {
      newState = "learning";
      scheduledDays = 0; // same day
    } else if (rating === "hard") {
      newState = "learning";
      scheduledDays = 1;
    } else if (rating === "good") {
      newState = "review";
      scheduledDays = Math.max(1, Math.round(newStability));
    } else {
      // easy
      newState = "review";
      scheduledDays = Math.max(4, Math.round(newStability * W[16]));
    }
  } else if (fsrs.state === "learning" || fsrs.state === "relearning") {
    newDifficulty = updateDifficulty(fsrs.difficulty, rating);
    newStability = initialStability(rating);

    if (rating === "again") {
      newState = fsrs.state;
      scheduledDays = 0;
    } else if (rating === "hard") {
      newState = fsrs.state;
      scheduledDays = 1;
    } else {
      newState = "review";
      scheduledDays = Math.max(1, Math.round(newStability));
    }
  } else {
    // review state
    const retrievability = calculateRetention(card, now);
    newDifficulty = updateDifficulty(fsrs.difficulty, rating);

    if (rating === "again") {
      newStability = stabilityAfterLapse(fsrs.stability, newDifficulty, retrievability);
      newState = "relearning";
      scheduledDays = 0;
    } else {
      newStability = stabilityAfterRecall(
        fsrs.stability,
        newDifficulty,
        retrievability,
        rating
      );
      newState = "review";
      scheduledDays = Math.max(1, Math.round(newStability));
    }
  }

  return {
    stability: newStability,
    difficulty: newDifficulty,
    elapsedDays,
    scheduledDays,
    reps: fsrs.reps + 1,
    lapses: rating === "again" && fsrs.state === "review" ? fsrs.lapses + 1 : fsrs.lapses,
    state: newState,
  };
}

/**
 * Filters a list of review cards to those due for review at or before `now`.
 * Excludes suspended and buried cards.
 *
 * @param cards - All review cards
 * @param now - Reference datetime (defaults to current time)
 * @returns Cards due for review, sorted by due date ascending
 */
export function getDueCards(cards: ReviewCard[], now: Date = new Date()): ReviewCard[] {
  return cards
    .filter(
      (c) =>
        c.state !== "suspended" &&
        c.state !== "buried" &&
        c.fsrs.state !== "new" &&
        new Date(c.dueDate) <= now
    )
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
}

/**
 * Creates a new ReviewCard with default FSRS state.
 * Use this factory when generating cards from lesson content.
 */
export function createCard(
  partial: Omit<ReviewCard, "fsrs" | "state" | "dueDate" | "createdAt">
): ReviewCard {
  return {
    ...partial,
    fsrs: {
      stability: FSRS_DEFAULTS.INITIAL_STABILITY,
      difficulty: FSRS_DEFAULTS.INITIAL_DIFFICULTY,
      elapsedDays: 0,
      scheduledDays: 0,
      reps: 0,
      lapses: 0,
      state: "new",
    },
    state: "new",
    dueDate: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
}
