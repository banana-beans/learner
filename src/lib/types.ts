// ============================================================
// Learner Platform — Core TypeScript Types
// ============================================================

// ────────────────────────────────────────────────────────────
// Skill Tree Types
// ────────────────────────────────────────────────────────────

export type BranchId =
  | "python"
  | "typescript"
  | "react"
  | "csharp"
  | "dsa"
  | "databases"
  | "systems-design"
  | "networking"
  | "security"
  | "devops";

export type Tier = 1 | 2 | 3 | 4 | 5 | 6;

export type NodeState =
  | "locked"
  | "available"
  | "in_progress"
  | "completed"
  | "mastered";

export interface SkillNode {
  id: string;
  branchId: BranchId;
  tier: Tier;
  title: string;
  description: string;
  /** Hard prerequisites — must be completed before this unlocks */
  hardPrereqs: string[];
  /** Soft prerequisites — recommended but not required */
  softPrereqs: string[];
  /** Estimated minutes to complete lesson + required challenges */
  estimatedMinutes: number;
  /** XP reward for first completion */
  xpReward: number;
  /** Concepts covered (for review card generation) */
  concepts: string[];
}

export interface Branch {
  id: BranchId;
  title: string;
  description: string;
  color: string;
  /** CSS hex or tailwind color class */
  iconSlug: string;
  tiers: Tier[];
  nodes: SkillNode[];
}

export interface Curriculum {
  branches: Branch[];
  /** Flat lookup map for fast access */
  nodeMap: Record<string, SkillNode>;
}

// ────────────────────────────────────────────────────────────
// Lesson Types
// ────────────────────────────────────────────────────────────

export interface LessonMeta {
  nodeId: string;
  title: string;
  tier: Tier;
  branchId: BranchId;
  prerequisites: string[];
  concepts: string[];
  estimatedMinutes: number;
  /** MDX file path relative to content/ */
  filePath: string;
}

// ────────────────────────────────────────────────────────────
// Challenge Types
// ────────────────────────────────────────────────────────────

export type ChallengeType =
  | "write_from_scratch"
  | "fill_in_the_blank"
  | "bug_fix"
  | "refactor"
  | "predict_output"
  | "multiple_choice"
  | "parsons"
  | "design";

export type DifficultyStars = 1 | 2 | 3 | 4 | 5;

export type HintTier = "nudge" | "guide" | "reveal";

export interface Hint {
  tier: HintTier;
  text: string;
  /** XP penalty as a multiplier (0.9, 0.75, 0.5) */
  xpPenalty: number;
}

export interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  /** Whether this case is shown to the learner */
  visible: boolean;
  category: "basic" | "edge" | "performance";
  description?: string;
}

export interface MultipleChoiceOption {
  id: string;
  text: string;
  isCorrect: boolean;
  explanation?: string;
}

export interface ParsonsBlock {
  id: string;
  code: string;
  indentLevel: number;
}

export interface Challenge {
  id: string;
  nodeId: string;
  type: ChallengeType;
  title: string;
  description: string;
  difficulty: DifficultyStars;
  /** Is this the "boss" challenge for the node? */
  isBoss: boolean;
  /** Starter code shown in editor */
  starterCode?: string;
  /** For fill_in_the_blank: code with __BLANK__ markers */
  templateCode?: string;
  /** For multiple_choice */
  options?: MultipleChoiceOption[];
  /** For parsons: shuffled blocks the user must order */
  parsonsBlocks?: ParsonsBlock[];
  testCases?: TestCase[];
  hints: Hint[];
  /** Base XP before multipliers */
  baseXP: number;
  /** Tags for related concepts */
  tags: string[];
  /**
   * Execution runtime for the challenge.
   * - "python": run in Pyodide (default for python:* nodes)
   * - "javascript": run via Function(...) (default for typescript:* nodes)
   * - "manual": no auto-grade, show solution + manual "I got it" XP
   * If omitted, inferred from the nodeId prefix.
   */
  lang?: "python" | "javascript" | "manual";
}

// ────────────────────────────────────────────────────────────
// Spaced Repetition / Review Card Types
// ────────────────────────────────────────────────────────────

export type CardType =
  | "concept"
  | "code_output"
  | "fill_blank"
  | "bug_spot"
  | "explain";

export type Rating = "again" | "hard" | "good" | "easy";

/** FSRS algorithm state per card */
export interface FSRSState {
  /** Stability (days): how long memory is retained */
  stability: number;
  /** Difficulty (1–10): inherent card difficulty */
  difficulty: number;
  /** Elapsed days since last review */
  elapsedDays: number;
  /** Scheduled days until next review */
  scheduledDays: number;
  /** Number of times reviewed */
  reps: number;
  /** Number of lapses (Again ratings after learning) */
  lapses: number;
  /** Current learning state */
  state: "new" | "learning" | "review" | "relearning";
}

export type CardState = "new" | "learning" | "review" | "relearning" | "buried" | "suspended";

export interface ReviewCard {
  id: string;
  nodeId: string;
  branchId: BranchId;
  type: CardType;
  /** Front of card */
  front: string;
  /** Back of card (answer/explanation) */
  back: string;
  /** Optional code snippet for code_output / fill_blank */
  code?: string;
  /** Expected output for code_output cards */
  expectedOutput?: string;
  /** For fill_blank: indices of blanked tokens */
  blanks?: string[];
  fsrs: FSRSState;
  state: CardState;
  /** ISO date string of next due date */
  dueDate: string;
  /** ISO date string when card was created */
  createdAt: string;
  /** ISO date string of last review */
  lastReviewedAt?: string;
}

// ────────────────────────────────────────────────────────────
// User Profile & Progress Types
// ────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  username: string;
  /** ISO date string */
  createdAt: string;
  /** Avatar identifier (maps to local SVG) */
  avatarId: string;
  /** User-selected theme */
  themeId: string;
  /** Earned title badge */
  activeTitle: string;
  settings: UserSettings;
}

export interface UserSettings {
  /** Max new review cards per day */
  dailyNewCards: number;
  /** Target session duration in minutes */
  sessionDurationMinutes: number;
  /** Enable/disable sound effects */
  soundEnabled: boolean;
  /** Enable/disable animations */
  animationsEnabled: boolean;
  /** Preferred session mode */
  preferredMode: SessionMode;
  /** Notification preferences */
  notifications: {
    dailyReminder: boolean;
    reminderTime: string;
    streakWarning: boolean;
  };
}

export type SessionMode = "quick" | "standard" | "deep" | "review";

export interface StreakData {
  /** Current active streak in days */
  currentStreak: number;
  /** Longest streak ever */
  longestStreak: number;
  /** ISO date string of last active day */
  lastActiveDate: string | null;
  /** Available freeze tokens */
  freezesAvailable: number;
  /** Total freezes ever used */
  freezesUsed: number;
  /** ISO date strings of freeze-protected days */
  frozenDates: string[];
}

export interface XPEvent {
  id: string;
  /** ISO date string */
  timestamp: string;
  amount: number;
  source:
    | "lesson_complete"
    | "challenge_complete"
    | "review_card"
    | "daily_login"
    | "achievement"
    | "streak_milestone"
    | "capstone";
  /** Reference ID (lessonId, challengeId, etc.) */
  referenceId?: string;
  /** Multipliers that were applied */
  multipliers: {
    firstAttempt?: number;
    speed?: number;
    noHint?: number;
    streak?: number;
  };
}

export interface ChallengeResult {
  challengeId: string;
  nodeId: string;
  /** ISO date string */
  completedAt: string;
  /** Number of hints used */
  hintsUsed: number;
  /** Was this the first attempt? */
  firstAttempt: boolean;
  /** Time taken in seconds */
  timeTakenSeconds: number;
  /** Test cases passed / total */
  testsPassed: number;
  testsTotal: number;
  xpEarned: number;
}

export interface LessonResult {
  nodeId: string;
  /** ISO date string */
  completedAt: string;
  xpEarned: number;
  /** Did user pass the comprehension checks? */
  passed: boolean;
}

export interface UserProgress {
  /** Set of completed nodeIds */
  completedNodes: string[];
  /** Set of mastered nodeIds (all challenges + strong review) */
  masteredNodes: string[];
  /** Set of in-progress nodeIds */
  inProgressNodes: string[];
  /** Set of unlocked nodeIds */
  unlockedNodes: string[];
  /** Completed lesson results keyed by nodeId */
  lessonResults: Record<string, LessonResult>;
  /** Completed challenge results keyed by challengeId */
  challengeResults: Record<string, ChallengeResult>;
  /** Earned achievement IDs */
  earnedAchievements: string[];
  /** ISO date string of last unlock event */
  lastUnlockAt?: string;
}

export interface SessionLog {
  id: string;
  /** ISO date string */
  startedAt: string;
  endedAt?: string;
  mode: SessionMode;
  /** XP earned this session */
  xpEarned: number;
  /** Activities completed */
  lessonsCompleted: string[];
  challengesCompleted: string[];
  cardsReviewed: string[];
}

export interface DailyLog {
  /** YYYY-MM-DD */
  date: string;
  xpEarned: number;
  lessonsCompleted: number;
  challengesCompleted: number;
  cardsReviewed: number;
  streakActive: boolean;
  sessionDurationMinutes: number;
}

// ────────────────────────────────────────────────────────────
// Achievement Types
// ────────────────────────────────────────────────────────────

export type AchievementCategory =
  | "completion"
  | "mastery"
  | "streak"
  | "exploration"
  | "speed"
  | "social"
  | "hidden";

export type RarityTier = "common" | "uncommon" | "rare" | "epic" | "legendary";

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  rarity: RarityTier;
  /** XP bonus awarded when earned */
  xpReward: number;
  /** Icon identifier */
  iconSlug: string;
  /** Whether this achievement is hidden until earned */
  isHidden: boolean;
  /** Condition evaluated by checkAchievements() */
  condition: AchievementCondition;
}

export interface AchievementCondition {
  type:
    | "nodes_completed"
    | "nodes_mastered"
    | "streak_days"
    | "total_xp"
    | "level_reached"
    | "branch_completed"
    | "branch_mastered"
    | "challenges_completed"
    | "challenges_no_hint"
    | "reviews_completed"
    | "perfect_reviews"
    | "login_days"
    | "specific_node"
    | "custom";
  threshold?: number;
  branchId?: BranchId;
  nodeId?: string;
  /** For custom conditions, a unique key used in the engine */
  customKey?: string;
}

// ────────────────────────────────────────────────────────────
// Session Suggestion
// ────────────────────────────────────────────────────────────

export interface SessionSuggestion {
  mode: SessionMode;
  estimatedMinutes: number;
  activities: SuggestedActivity[];
  reason: string;
}

export interface SuggestedActivity {
  type: "lesson" | "challenge" | "review";
  nodeId?: string;
  challengeId?: string;
  label: string;
  xpEstimate: number;
}
