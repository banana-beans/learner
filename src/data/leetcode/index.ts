// ============================================================
// LeetCode-style problem bank for /grind
// ============================================================
// Tap-to-reveal interview practice. Lightweight by design: hand
// curated seed, plus room for a scheduled agent to append more
// files later (mirroring the snippets/ pattern).
// ============================================================

import { seedProblems } from "./seed";
import { financeProblems } from "./finance";
import { financeProblems20260519B1 } from "./finance-2026-05-19-b1";
import { financeProblems20260520B1 } from "./finance-2026-05-20-b1";
import { financeProblems20260521B1 } from "./finance-2026-05-21-b1";
import { financeProblems20260522B1 } from "./finance-2026-05-22-b1";
import { financeProblems20260523B1 } from "./finance-2026-05-23-b1";
import { financeProblems20260524B1 } from "./finance-2026-05-24-b1";
import { financeProblems20260525B1 } from "./finance-2026-05-25-b1";
import { financeProblems20260526B1 } from "./finance-2026-05-26-b1";
import { financeProblems20260527B1 } from "./finance-2026-05-27-b1";
import { financeProblems20260528B1 } from "./finance-2026-05-28-b1";
import { financeProblems20260529B1 } from "./finance-2026-05-29-b1";
import { financeProblems20260530B1 } from "./finance-2026-05-30-b1";
import { financeProblems20260531B1 } from "./finance-2026-05-31-b1";
import { financeProblems20260601B1 } from "./finance-2026-06-01-b1";
import { financeProblems20260602B1 } from "./finance-2026-06-02-b1";

export type Difficulty = "easy" | "medium" | "hard";

export type LeetCodeProblem = {
  id: string;
  title: string;
  difficulty: Difficulty;
  topics: string[];
  problem: string;
  examples: Array<{ input: string; output: string; explanation?: string }>;
  constraints?: string[];
  approach: string;
  code: string;
  language: "python" | "typescript" | "csharp";
  complexity: { time: string; space: string };
  // Optional canonical LeetCode number for the curious
  leetcodeNumber?: number;
};

export const leetcodeProblems: LeetCodeProblem[] = [
  ...seedProblems,
  ...financeProblems,
  ...financeProblems20260519B1,
  ...financeProblems20260520B1,
  ...financeProblems20260521B1,
  ...financeProblems20260522B1,
  ...financeProblems20260523B1,
  ...financeProblems20260524B1,
  ...financeProblems20260525B1,
  ...financeProblems20260526B1,
  ...financeProblems20260527B1,
  ...financeProblems20260528B1,
  ...financeProblems20260529B1,
  ...financeProblems20260530B1,
  ...financeProblems20260531B1,
  ...financeProblems20260601B1,
  ...financeProblems20260602B1,
];
