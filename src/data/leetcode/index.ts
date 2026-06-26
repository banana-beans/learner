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
import { financeProblems20260603B1 } from "./finance-2026-06-03-b1";
import { financeProblems20260604B1 } from "./finance-2026-06-04-b1";
import { financeProblems20260605B1 } from "./finance-2026-06-05-b1";
import { financeProblems20260606B1 } from "./finance-2026-06-06-b1";
import { financeProblems20260607B1 } from "./finance-2026-06-07-b1";
import { financeProblems20260608B1 } from "./finance-2026-06-08-b1";
import { financeProblems20260609B1 } from "./finance-2026-06-09-b1";
import { financeProblems20260610B1 } from "./finance-2026-06-10-b1";
import { financeProblems20260611B1 } from "./finance-2026-06-11-b1";
import { financeProblems20260612B1 } from "./finance-2026-06-12-b1";
import { financeProblems20260613B1 } from "./finance-2026-06-13-b1";
import { financeProblems20260614B1 } from "./finance-2026-06-14-b1";
import { financeProblems20260615B1 } from "./finance-2026-06-15-b1";
import { financeProblems20260616B1 } from "./finance-2026-06-16-b1";
import { financeProblems20260617B1 } from "./finance-2026-06-17-b1";
import { financeProblems20260618B1 } from "./finance-2026-06-18-b1";
import { financeProblems20260619B1 } from "./finance-2026-06-19-b1";
import { financeProblems20260620B1 } from "./finance-2026-06-20-b1";
import { financeProblems20260621B1 } from "./finance-2026-06-21-b1";
import { financeProblems20260622B1 } from "./finance-2026-06-22-b1";
import { financeProblems20260623B1 } from "./finance-2026-06-23-b1";
import { financeProblems20260624B1 } from "./finance-2026-06-24-b1";
import { financeProblems20260625B1 } from "./finance-2026-06-25-b1";
import { financeProblems20260626B1 } from "./finance-2026-06-26-b1";

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
  ...financeProblems20260603B1,
  ...financeProblems20260604B1,
  ...financeProblems20260605B1,
  ...financeProblems20260606B1,
  ...financeProblems20260607B1,
  ...financeProblems20260608B1,
  ...financeProblems20260609B1,
  ...financeProblems20260610B1,
  ...financeProblems20260611B1,
  ...financeProblems20260612B1,
  ...financeProblems20260613B1,
  ...financeProblems20260614B1,
  ...financeProblems20260615B1,
  ...financeProblems20260616B1,
  ...financeProblems20260617B1,
  ...financeProblems20260618B1,
  ...financeProblems20260619B1,
  ...financeProblems20260620B1,
  ...financeProblems20260621B1,
  ...financeProblems20260622B1,
  ...financeProblems20260623B1,
  ...financeProblems20260624B1,
  ...financeProblems20260625B1,
  ...financeProblems20260626B1,
];
