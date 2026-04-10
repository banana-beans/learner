import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  UserProgress,
  LessonResult,
  ChallengeResult,
} from "@/lib/types";

interface ProgressState extends UserProgress {
  // Actions
  completeLesson: (result: LessonResult) => void;
  completeChallenge: (result: ChallengeResult) => void;
  unlockNode: (nodeId: string) => void;
  startNode: (nodeId: string) => void;
  masterNode: (nodeId: string) => void;
  earnAchievement: (achievementId: string) => void;
  reset: () => void;
}

const initialProgress: UserProgress = {
  completedNodes: [],
  masteredNodes: [],
  inProgressNodes: [],
  unlockedNodes: [],
  lessonResults: {},
  challengeResults: {},
  earnedAchievements: [],
};

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      ...initialProgress,

      completeLesson: (result: LessonResult) => {
        const state = get();
        const { nodeId } = result;

        // Mark as completed if not already
        const completedNodes = state.completedNodes.includes(nodeId)
          ? state.completedNodes
          : [...state.completedNodes, nodeId];

        // Remove from in-progress
        const inProgressNodes = state.inProgressNodes.filter((id) => id !== nodeId);

        set({
          completedNodes,
          inProgressNodes,
          lessonResults: {
            ...state.lessonResults,
            [nodeId]: result,
          },
          lastUnlockAt: new Date().toISOString(),
        });
      },

      completeChallenge: (result: ChallengeResult) => {
        const state = get();
        set({
          challengeResults: {
            ...state.challengeResults,
            [result.challengeId]: result,
          },
        });
      },

      unlockNode: (nodeId: string) => {
        const state = get();
        if (state.unlockedNodes.includes(nodeId)) return;
        set({ unlockedNodes: [...state.unlockedNodes, nodeId] });
      },

      startNode: (nodeId: string) => {
        const state = get();
        if (state.inProgressNodes.includes(nodeId)) return;
        if (state.completedNodes.includes(nodeId)) return;
        set({ inProgressNodes: [...state.inProgressNodes, nodeId] });
      },

      masterNode: (nodeId: string) => {
        const state = get();
        const masteredNodes = state.masteredNodes.includes(nodeId)
          ? state.masteredNodes
          : [...state.masteredNodes, nodeId];
        // Mastered implies completed
        const completedNodes = state.completedNodes.includes(nodeId)
          ? state.completedNodes
          : [...state.completedNodes, nodeId];
        set({ masteredNodes, completedNodes });
      },

      earnAchievement: (achievementId: string) => {
        const state = get();
        if (state.earnedAchievements.includes(achievementId)) return;
        set({
          earnedAchievements: [...state.earnedAchievements, achievementId],
        });
      },

      reset: () => set(initialProgress),
    }),
    {
      name: "learner-progress",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? localStorage : ({} as Storage)
      ),
    }
  )
);
