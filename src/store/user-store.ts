import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { UserProfile, StreakData, XPEvent, SessionMode } from "@/lib/types";
import {
  LEVEL_XP_TABLE,
  XP_BASE,
  STREAK_MULTIPLIERS,
  STREAK_MILESTONES,
} from "@/lib/constants";

interface UserState {
  profile: UserProfile | null;
  totalXP: number;
  level: number;
  xpHistory: XPEvent[];
  streak: StreakData;
  activeSessionMode: SessionMode;

  // Actions
  setProfile: (profile: UserProfile) => void;
  updateProfile: (partial: Partial<UserProfile>) => void;
  addXP: (event: Omit<XPEvent, "id" | "timestamp">) => void;
  updateStreak: (date: string) => void;
  useFreezeToken: (date: string) => void;
  setSessionMode: (mode: SessionMode) => void;
  reset: () => void;
}

function getLevelForXP(totalXP: number): number {
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

function getStreakMultiplier(streakDays: number): number {
  let multiplier = 1.0;
  for (const tier of STREAK_MULTIPLIERS) {
    if (streakDays >= tier.minDays) {
      multiplier = tier.multiplier;
    }
  }
  return multiplier;
}

const defaultStreak: StreakData = {
  currentStreak: 0,
  longestStreak: 0,
  lastActiveDate: null,
  freezesAvailable: 0,
  freezesUsed: 0,
  frozenDates: [],
};

const defaultProfile: UserProfile = {
  id: crypto.randomUUID(),
  username: "Learner",
  createdAt: new Date().toISOString(),
  avatarId: "default",
  themeId: "dark",
  activeTitle: "Newcomer",
  settings: {
    dailyNewCards: 10,
    sessionDurationMinutes: 15,
    soundEnabled: true,
    animationsEnabled: true,
    preferredMode: "standard",
    notifications: {
      dailyReminder: false,
      reminderTime: "09:00",
      streakWarning: true,
    },
  },
};

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      profile: null,
      totalXP: 0,
      level: 1,
      xpHistory: [],
      streak: defaultStreak,
      activeSessionMode: "standard",

      setProfile: (profile) => set({ profile }),

      updateProfile: (partial) =>
        set((state) => ({
          profile: state.profile ? { ...state.profile, ...partial } : { ...defaultProfile, ...partial },
        })),

      addXP: (eventData) => {
        const state = get();
        const streakMultiplier = getStreakMultiplier(state.streak.currentStreak);

        // Apply streak multiplier if not already included
        const baseAmount = eventData.amount;
        const finalAmount = eventData.source === "review_card" || eventData.source === "daily_login"
          ? baseAmount
          : Math.floor(baseAmount * streakMultiplier);

        const event: XPEvent = {
          ...eventData,
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          amount: finalAmount,
          multipliers: {
            ...eventData.multipliers,
            streak: streakMultiplier,
          },
        };

        const newTotalXP = state.totalXP + finalAmount;
        const newLevel = getLevelForXP(newTotalXP);

        set({
          totalXP: newTotalXP,
          level: newLevel,
          xpHistory: [...state.xpHistory.slice(-499), event], // keep last 500 events
        });
      },

      updateStreak: (dateStr) => {
        const state = get();
        const streak = state.streak;
        const today = dateStr;
        const yesterday = new Date(dateStr);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split("T")[0];

        if (streak.lastActiveDate === today) {
          // Already counted today
          return;
        }

        let newStreak = 1;
        if (streak.lastActiveDate === yesterdayStr) {
          // Consecutive day
          newStreak = streak.currentStreak + 1;
        } else if (streak.frozenDates.includes(yesterdayStr)) {
          // Freeze token was used yesterday
          newStreak = streak.currentStreak + 1;
        }

        const longestStreak = Math.max(newStreak, streak.longestStreak);

        // Check if a freeze is earned
        const milestone = STREAK_MILESTONES.find(
          (m) => m.freezeEarned && m.days === newStreak
        );
        const newFreezes = milestone
          ? Math.min(streak.freezesAvailable + 1, 5)
          : streak.freezesAvailable;

        set({
          streak: {
            ...streak,
            currentStreak: newStreak,
            longestStreak,
            lastActiveDate: today,
            freezesAvailable: newFreezes,
          },
        });

        // Daily login XP
        get().addXP({
          amount: XP_BASE.DAILY_LOGIN,
          source: "daily_login",
          multipliers: {},
        });
      },

      useFreezeToken: (dateStr) => {
        const state = get();
        if (state.streak.freezesAvailable <= 0) return;

        set({
          streak: {
            ...state.streak,
            freezesAvailable: state.streak.freezesAvailable - 1,
            freezesUsed: state.streak.freezesUsed + 1,
            frozenDates: [...state.streak.frozenDates, dateStr],
          },
        });
      },

      setSessionMode: (mode) => set({ activeSessionMode: mode }),

      reset: () =>
        set({
          profile: null,
          totalXP: 0,
          level: 1,
          xpHistory: [],
          streak: defaultStreak,
          activeSessionMode: "standard",
        }),
    }),
    {
      name: "learner-user",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? localStorage : ({} as Storage)
      ),
      partialize: (state) => ({
        profile: state.profile,
        totalXP: state.totalXP,
        level: state.level,
        xpHistory: state.xpHistory,
        streak: state.streak,
        activeSessionMode: state.activeSessionMode,
      }),
    }
  )
);
