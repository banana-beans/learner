import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { ReviewCard, Rating, FSRSState } from "@/lib/types";
import { FSRS_DEFAULTS, DAILY_LIMITS } from "@/lib/constants";

interface ReviewState {
  cards: Record<string, ReviewCard>;
  /** Today's review session stats */
  todayStats: {
    date: string;
    reviewed: number;
    newIntroduced: number;
    correct: number;
  };

  // Actions
  addCards: (cards: ReviewCard[]) => void;
  reviewCard: (cardId: string, rating: Rating) => ReviewCard;
  getDueCards: (now?: Date) => ReviewCard[];
  getNewCards: () => ReviewCard[];
  suspendCard: (cardId: string) => void;
  buryCard: (cardId: string) => void;
  resetTodayStats: () => void;
  reset: () => void;
}

/** Compute next FSRS state after a review rating */
export function computeNextState(card: ReviewCard, rating: Rating, now: Date): FSRSState {
  const fsrs = card.fsrs;
  const elapsedDays = card.lastReviewedAt
    ? (now.getTime() - new Date(card.lastReviewedAt).getTime()) / 86_400_000
    : 0;

  let newStability = fsrs.stability;
  let newDifficulty = fsrs.difficulty;
  let scheduledDays = 1;

  if (fsrs.state === "new" || fsrs.state === "learning") {
    // Initial learning steps
    switch (rating) {
      case "again":
        newStability = FSRS_DEFAULTS.INITIAL_STABILITY;
        scheduledDays = 1;
        break;
      case "hard":
        newStability = FSRS_DEFAULTS.INITIAL_STABILITY * 1.2;
        scheduledDays = 1;
        break;
      case "good":
        newStability = FSRS_DEFAULTS.INITIAL_STABILITY * 2.5;
        scheduledDays = 3;
        break;
      case "easy":
        newStability = FSRS_DEFAULTS.INITIAL_STABILITY * FSRS_DEFAULTS.EASY_STABILITY_FACTOR * 4;
        scheduledDays = 7;
        break;
    }
  } else {
    // Review phase: FSRS stability update
    const retrievability = Math.exp(
      (Math.log(FSRS_DEFAULTS.TARGET_RETENTION) / fsrs.stability) * elapsedDays
    );

    switch (rating) {
      case "again":
        newStability = fsrs.stability * FSRS_DEFAULTS.AGAIN_STABILITY_FACTOR;
        newDifficulty = Math.min(10, fsrs.difficulty + 1.5);
        scheduledDays = 1;
        break;
      case "hard":
        newStability = fsrs.stability * (0.5 + 0.3 * retrievability);
        newDifficulty = Math.min(10, fsrs.difficulty + 0.5);
        scheduledDays = Math.max(1, Math.round(fsrs.stability * 0.8));
        break;
      case "good":
        newStability = fsrs.stability * (1 + 0.9 * Math.exp(-0.3 * fsrs.difficulty) * retrievability);
        newDifficulty = Math.max(1, fsrs.difficulty - 0.1);
        scheduledDays = Math.max(1, Math.round(newStability));
        break;
      case "easy":
        newStability =
          fsrs.stability *
          FSRS_DEFAULTS.EASY_STABILITY_FACTOR *
          (1 + 1.2 * Math.exp(-0.3 * fsrs.difficulty) * retrievability);
        newDifficulty = Math.max(1, fsrs.difficulty - 0.3);
        scheduledDays = Math.max(1, Math.round(newStability * FSRS_DEFAULTS.EASY_STABILITY_FACTOR));
        break;
    }
  }

  const newState: FSRSState["state"] =
    rating === "again" && fsrs.state === "review"
      ? "relearning"
      : scheduledDays >= 1
        ? "review"
        : "learning";

  return {
    stability: Math.min(newStability, 365),
    difficulty: newDifficulty,
    elapsedDays,
    scheduledDays,
    reps: fsrs.reps + 1,
    lapses: rating === "again" && fsrs.state === "review" ? fsrs.lapses + 1 : fsrs.lapses,
    state: newState,
  };
}

const todayStr = () => new Date().toISOString().split("T")[0];

export const useReviewStore = create<ReviewState>()(
  persist(
    (set, get) => ({
      cards: {},
      todayStats: {
        date: todayStr(),
        reviewed: 0,
        newIntroduced: 0,
        correct: 0,
      },

      addCards: (newCards) => {
        const state = get();
        const updated = { ...state.cards };
        for (const card of newCards) {
          if (!updated[card.id]) {
            updated[card.id] = card;
          }
        }
        set({ cards: updated });
      },

      reviewCard: (cardId, rating) => {
        const state = get();
        const card = state.cards[cardId];
        if (!card) throw new Error(`Card ${cardId} not found`);

        const now = new Date();
        const newFSRS = computeNextState(card, rating, now);
        const dueDate = new Date(now);
        dueDate.setDate(dueDate.getDate() + newFSRS.scheduledDays);

        const updatedCard: ReviewCard = {
          ...card,
          fsrs: newFSRS,
          state: newFSRS.state,
          dueDate: dueDate.toISOString(),
          lastReviewedAt: now.toISOString(),
        };

        const today = todayStr();
        const stats = state.todayStats.date === today
          ? state.todayStats
          : { date: today, reviewed: 0, newIntroduced: 0, correct: 0 };

        set({
          cards: { ...state.cards, [cardId]: updatedCard },
          todayStats: {
            ...stats,
            reviewed: stats.reviewed + 1,
            correct: rating === "good" || rating === "easy" ? stats.correct + 1 : stats.correct,
            newIntroduced:
              card.fsrs.state === "new"
                ? stats.newIntroduced + 1
                : stats.newIntroduced,
          },
        });

        return updatedCard;
      },

      getDueCards: (now = new Date()) => {
        const { cards } = get();
        return Object.values(cards).filter(
          (c) =>
            c.state !== "suspended" &&
            c.state !== "buried" &&
            c.fsrs.state !== "new" &&
            new Date(c.dueDate) <= now
        );
      },

      getNewCards: () => {
        const { cards, todayStats } = get();
        const today = todayStr();
        const alreadyIntroduced =
          todayStats.date === today ? todayStats.newIntroduced : 0;
        const remaining = DAILY_LIMITS.DEFAULT_NEW_CARDS_PER_DAY - alreadyIntroduced;

        return Object.values(cards)
          .filter((c) => c.fsrs.state === "new" && c.state !== "suspended")
          .slice(0, Math.max(0, remaining));
      },

      suspendCard: (cardId) => {
        const state = get();
        const card = state.cards[cardId];
        if (!card) return;
        set({ cards: { ...state.cards, [cardId]: { ...card, state: "suspended" } } });
      },

      buryCard: (cardId) => {
        const state = get();
        const card = state.cards[cardId];
        if (!card) return;
        set({ cards: { ...state.cards, [cardId]: { ...card, state: "buried" } } });
      },

      resetTodayStats: () => {
        set({
          todayStats: { date: todayStr(), reviewed: 0, newIntroduced: 0, correct: 0 },
        });
      },

      reset: () => set({ cards: {}, todayStats: { date: todayStr(), reviewed: 0, newIntroduced: 0, correct: 0 } }),
    }),
    {
      name: "learner-review",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? localStorage : ({} as Storage)
      ),
    }
  )
);
