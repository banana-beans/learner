// ============================================================
// Learner Platform — Core Constants
// ============================================================

import type { BranchId, AchievementCategory, RarityTier } from "./types";

// ────────────────────────────────────────────────────────────
// XP Values per Activity
// See: research/08-progress-tracking-xp-model.md
// ────────────────────────────────────────────────────────────

export const XP_BASE = {
  /** Completing a lesson for the first time */
  LESSON_COMPLETE: 100,
  /** Completing a lesson (repeat, no XP) */
  LESSON_REPEAT: 0,
  /** Challenge difficulty 1★ */
  CHALLENGE_D1: 100,
  /** Challenge difficulty 2★ */
  CHALLENGE_D2: 150,
  /** Challenge difficulty 3★ */
  CHALLENGE_D3: 250,
  /** Challenge difficulty 4★ */
  CHALLENGE_D4: 350,
  /** Challenge difficulty 5★ (boss) */
  CHALLENGE_D5: 500,
  /** Reviewing a card (Again) */
  REVIEW_AGAIN: 0,
  /** Reviewing a card (Hard) */
  REVIEW_HARD: 10,
  /** Reviewing a card (Good) */
  REVIEW_GOOD: 15,
  /** Reviewing a card (Easy) */
  REVIEW_EASY: 20,
  /** Perfect review session bonus (all Good/Easy) */
  REVIEW_PERFECT_SESSION: 50,
  /** Daily login */
  DAILY_LOGIN: 20,
  /** Node mastery bonus */
  NODE_MASTERY: 150,
  /** Branch completion bonus */
  BRANCH_COMPLETE: 500,
  /** Branch mastery bonus */
  BRANCH_MASTERY: 1000,
} as const;

// ────────────────────────────────────────────────────────────
// XP Multipliers
// ────────────────────────────────────────────────────────────

export const XP_MULTIPLIERS = {
  /** First attempt at a challenge */
  FIRST_ATTEMPT: 1.5,
  /** Completed challenge within 80% of estimated time */
  SPEED_BONUS: 1.25,
  /** No hints used on a challenge */
  NO_HINT: 1.1,
} as const;

/** Streak multipliers by tier (streak days → multiplier) */
export const STREAK_MULTIPLIERS: Array<{ minDays: number; multiplier: number; label: string }> = [
  { minDays: 0, multiplier: 1.0, label: "No streak" },
  { minDays: 3, multiplier: 1.1, label: "3-day streak" },
  { minDays: 7, multiplier: 1.25, label: "Week warrior" },
  { minDays: 14, multiplier: 1.5, label: "Two-week grind" },
  { minDays: 30, multiplier: 2.0, label: "Monthly master" },
  { minDays: 60, multiplier: 2.5, label: "Two-month legend" },
  { minDays: 100, multiplier: 3.5, label: "Century streak" },
];

// ────────────────────────────────────────────────────────────
// Level Curve
// Formula: total_xp_for_level = 100 × level^1.8
// Solving for level given XP: level = (xp / 100)^(1/1.8)
// ────────────────────────────────────────────────────────────

/** Precomputed cumulative XP required to reach each level (index = level) */
export const LEVEL_XP_TABLE: number[] = (() => {
  const table: number[] = [0]; // level 0 placeholder
  for (let level = 1; level <= 100; level++) {
    table.push(Math.floor(100 * Math.pow(level, 1.8)));
  }
  return table;
})();

// ────────────────────────────────────────────────────────────
// Level Titles (every 25 levels, with sub-titles every 5)
// ────────────────────────────────────────────────────────────

export const LEVEL_TITLES: Array<{ minLevel: number; title: string }> = [
  { minLevel: 1, title: "Newcomer" },
  { minLevel: 5, title: "Apprentice" },
  { minLevel: 10, title: "Coder" },
  { minLevel: 15, title: "Developer" },
  { minLevel: 20, title: "Engineer" },
  { minLevel: 25, title: "Senior Engineer" },
  { minLevel: 30, title: "Tech Lead" },
  { minLevel: 35, title: "Architect" },
  { minLevel: 40, title: "Principal" },
  { minLevel: 45, title: "Staff Engineer" },
  { minLevel: 50, title: "Distinguished Engineer" },
  { minLevel: 55, title: "Fellow" },
  { minLevel: 60, title: "Expert" },
  { minLevel: 65, title: "Grandmaster" },
  { minLevel: 70, title: "Sage" },
  { minLevel: 75, title: "Legend" },
  { minLevel: 80, title: "Mythic Coder" },
  { minLevel: 85, title: "Ascendant" },
  { minLevel: 90, title: "Transcendent" },
  { minLevel: 95, title: "Infinite Loop" },
  { minLevel: 100, title: "The Compiler" },
];

// ────────────────────────────────────────────────────────────
// Streak Milestones
// ────────────────────────────────────────────────────────────

export const STREAK_MILESTONES: Array<{ days: number; reward: string; freezeEarned: boolean }> = [
  { days: 7, reward: "Streak Freeze Token", freezeEarned: true },
  { days: 14, reward: "Bronze Streak Badge", freezeEarned: false },
  { days: 21, reward: "Streak Freeze Token", freezeEarned: true },
  { days: 30, reward: "Monthly Master Badge", freezeEarned: true },
  { days: 60, reward: "Two-Month Legend Badge", freezeEarned: true },
  { days: 90, reward: "Quarter Champion Badge", freezeEarned: true },
  { days: 100, reward: "Century Club Badge + Title", freezeEarned: true },
  { days: 180, reward: "Half-Year Legend Badge", freezeEarned: true },
  { days: 365, reward: "Year Master Title + Badge", freezeEarned: true },
];

// ────────────────────────────────────────────────────────────
// Branch Colors & Metadata
// ────────────────────────────────────────────────────────────

export const BRANCH_META: Record<BranchId, {
  title: string;
  color: string;
  colorHex: string;
  iconSlug: string;
  description: string;
}> = {
  python: {
    title: "Python",
    color: "blue",
    colorHex: "#4f8ef7",
    iconSlug: "python",
    description: "From beginner to advanced Python programming",
  },
  typescript: {
    title: "TypeScript",
    color: "cyan",
    colorHex: "#22d3ee",
    iconSlug: "typescript",
    description: "Type-safe JavaScript with modern tooling",
  },
  react: {
    title: "React",
    color: "teal",
    colorHex: "#14b8a6",
    iconSlug: "react",
    description: "Component-driven UI development",
  },
  csharp: {
    title: "C#",
    color: "purple",
    colorHex: "#a855f7",
    iconSlug: "csharp",
    description: ".NET ecosystem and object-oriented design",
  },
  dsa: {
    title: "DS&A",
    color: "orange",
    colorHex: "#f97316",
    iconSlug: "dsa",
    description: "Data structures and algorithms for interviews",
  },
  databases: {
    title: "Databases",
    color: "yellow",
    colorHex: "#eab308",
    iconSlug: "database",
    description: "SQL, NoSQL, and database design",
  },
  "systems-design": {
    title: "Systems Design",
    color: "green",
    colorHex: "#22c55e",
    iconSlug: "systems",
    description: "Scalable distributed system architecture",
  },
  networking: {
    title: "Networking",
    color: "sky",
    colorHex: "#38bdf8",
    iconSlug: "network",
    description: "TCP/IP, HTTP, DNS, and networking fundamentals",
  },
  security: {
    title: "Security",
    color: "red",
    colorHex: "#ef4444",
    iconSlug: "security",
    description: "Application security, cryptography, and defense",
  },
  devops: {
    title: "DevOps",
    color: "indigo",
    colorHex: "#6366f1",
    iconSlug: "devops",
    description: "CI/CD, containers, cloud, and infrastructure",
  },
};

// ────────────────────────────────────────────────────────────
// Achievement Definitions (30+ base achievements)
// Full 100+ list is in src/data/achievements.ts
// ────────────────────────────────────────────────────────────

export const RARITY_COLORS: Record<RarityTier, string> = {
  common: "#9ca3af",
  uncommon: "#22c55e",
  rare: "#4f8ef7",
  epic: "#a855f7",
  legendary: "#f59e0b",
};

export const CATEGORY_LABELS: Record<AchievementCategory, string> = {
  completion: "Completion",
  mastery: "Mastery",
  streak: "Streak",
  exploration: "Exploration",
  speed: "Speed",
  social: "Social",
  hidden: "???",
};

// ────────────────────────────────────────────────────────────
// Daily Limits & Anti-Gaming
// ────────────────────────────────────────────────────────────

export const DAILY_LIMITS = {
  /** Max XP from review cards per day */
  MAX_REVIEW_XP: 300,
  /** Max new cards introduced per day (default, user-adjustable) */
  DEFAULT_NEW_CARDS_PER_DAY: 10,
  /** Min new cards per day */
  MIN_NEW_CARDS_PER_DAY: 5,
  /** Max new cards per day */
  MAX_NEW_CARDS_PER_DAY: 30,
  /** Reduce new cards when this many are due */
  REDUCE_NEW_CARDS_THRESHOLD: 50,
} as const;

// ────────────────────────────────────────────────────────────
// FSRS Default Parameters
// ────────────────────────────────────────────────────────────

export const FSRS_DEFAULTS = {
  /** Default stability for new cards */
  INITIAL_STABILITY: 1.0,
  /** Default difficulty for new cards */
  INITIAL_DIFFICULTY: 5.0,
  /** Target retention rate (85%) */
  TARGET_RETENTION: 0.85,
  /** Again rating stability decay factor */
  AGAIN_STABILITY_FACTOR: 0.2,
  /** Easy rating stability boost factor */
  EASY_STABILITY_FACTOR: 1.3,
} as const;

// ────────────────────────────────────────────────────────────
// Session Defaults
// ────────────────────────────────────────────────────────────

export const SESSION_DURATIONS: Record<string, number> = {
  quick: 5,
  standard: 15,
  deep: 30,
  review: 10,
};

// ────────────────────────────────────────────────────────────
// Hint XP Penalties
// ────────────────────────────────────────────────────────────

export const HINT_XP_PENALTIES = {
  nudge: 0.9,   // -10%
  guide: 0.75,  // -25%
  reveal: 0.5,  // -50%
} as const;

// ────────────────────────────────────────────────────────────
// Navigation Routes
// ────────────────────────────────────────────────────────────

export const ROUTES = {
  HOME: "/",
  TREE: "/skill-tree",
  REVIEW: "/review",
  CHALLENGES: "/challenges",
  SCROLL: "/scroll",
  PROFILE: "/profile",
  SETTINGS: "/settings",
} as const;
