"use client";

import { useState, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import type { Challenge } from "@/lib/types";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { Badge } from "@/components/common/Badge";
import { HintSystem } from "@/components/lesson/HintSystem";
import { TestResults } from "@/components/lesson/TestResults";
import { XPRewardToast, XPRewardToastContainer } from "@/components/common/XPRewardToast";
import { useProgressStore } from "@/store/progress-store";
import { useUserStore } from "@/store/user-store";
import type { ChallengeResult } from "@/lib/types";

interface TestResultItem {
  passed: boolean;
  description?: string;
  expected?: string;
  actual?: string;
}

interface ToastState {
  id: string;
  xpAmount: number;
  activity: string;
  multiplier?: number;
}

interface ChallengeViewProps {
  challenge: Challenge;
}

const DIFFICULTY_LABELS = ["", "Beginner", "Easy", "Medium", "Hard", "Expert"];
const DIFFICULTY_VARIANTS = ["default", "green", "blue", "yellow", "orange", "red"] as const;

export function ChallengeView({ challenge }: ChallengeViewProps) {
  const [code, setCode] = useState(challenge.starterCode ?? "");
  const [results, setResults] = useState<TestResultItem[]>([]);
  const [hasRun, setHasRun] = useState(false);
  const [allPassed, setAllPassed] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [xpPenaltyMultiplier, setXpPenaltyMultiplier] = useState(1.0);
  const [startTime] = useState(() => Date.now());
  const [toasts, setToasts] = useState<ToastState[]>([]);

  const completeChallenge = useProgressStore((s) => s.completeChallenge);
  const addXP = useUserStore((s) => s.addXP);
  const streak = useUserStore((s) => s.streak);

  function dismissToast(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  const handleHintRevealed = useCallback(
    (hintIndex: number, penaltyXP: number) => {
      setHintsUsed((prev) => prev + 1);
      // penaltyXP is absolute (10/25/50), convert to remaining multiplier
      // Accumulate: multiply penalties
      const penaltyFactor = (100 - penaltyXP) / 100;
      setXpPenaltyMultiplier((prev) => prev * penaltyFactor);
    },
    []
  );

  function runTests() {
    const testCases = challenge.testCases ?? [];
    if (testCases.length === 0) {
      setResults([{ passed: true, description: "No test cases — solution accepted." }]);
      setHasRun(true);
      setAllPassed(true);
      handleSuccess();
      return;
    }

    const userOutput = extractOutput(code);
    const newResults: TestResultItem[] = testCases
      .filter((tc) => tc.visible)
      .map((tc) => {
        const actual = userOutput.trim();
        const expected = tc.expectedOutput.trim();
        return {
          passed: actual === expected,
          description: tc.description ?? `Test case`,
          expected,
          actual,
        };
      });

    // Include hidden tests — just show pass/fail without expected
    const hiddenCases = testCases.filter((tc) => !tc.visible);
    hiddenCases.forEach((tc) => {
      const actual = userOutput.trim();
      const expected = tc.expectedOutput.trim();
      newResults.push({
        passed: actual === expected,
        description: "Hidden test",
        expected: undefined, // don't reveal hidden expected
        actual: undefined,
      });
    });

    const passed = newResults.every((r) => r.passed);
    setResults(newResults);
    setHasRun(true);
    setAllPassed(passed);

    if (passed) {
      handleSuccess();
    }
  }

  function handleSuccess() {
    if (allPassed) return; // prevent double-calling

    const timeTaken = Math.round((Date.now() - startTime) / 1000);
    const isFirstAttempt = !hasRun;
    const baseXP = challenge.baseXP;
    const finalXP = Math.round(baseXP * xpPenaltyMultiplier);

    const result: ChallengeResult = {
      challengeId: challenge.id,
      nodeId: challenge.nodeId,
      completedAt: new Date().toISOString(),
      hintsUsed,
      firstAttempt: isFirstAttempt,
      timeTakenSeconds: timeTaken,
      testsPassed: challenge.testCases?.length ?? 0,
      testsTotal: challenge.testCases?.length ?? 0,
      xpEarned: finalXP,
    };

    completeChallenge(result);
    addXP({
      amount: finalXP,
      source: "challenge_complete",
      referenceId: challenge.id,
      multipliers: {
        firstAttempt: isFirstAttempt ? 1.5 : undefined,
        noHint: hintsUsed === 0 ? 1.1 : undefined,
      },
    });

    const streakMult = getStreakMultiplier(streak.currentStreak);
    const toastId = crypto.randomUUID();
    setToasts((prev) => [
      ...prev,
      {
        id: toastId,
        xpAmount: finalXP,
        activity: `Challenge: ${challenge.title}`,
        multiplier: streakMult > 1 ? streakMult : undefined,
      },
    ]);
  }

  const diffLabel = DIFFICULTY_LABELS[challenge.difficulty] ?? "Unknown";
  const diffVariant = DIFFICULTY_VARIANTS[challenge.difficulty] ?? "default";
  const hintTexts = challenge.hints.map((h) => h.text);

  return (
    <>
      <div className="space-y-5">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={diffVariant} size="sm">
              {diffLabel}
            </Badge>
            {challenge.isBoss && (
              <Badge variant="gold" size="sm">
                Boss Challenge
              </Badge>
            )}
          </div>
          <p className="text-sm text-[var(--text-secondary)] whitespace-pre-line leading-relaxed">
            {challenge.description}
          </p>
        </div>

        {/* Code editor placeholder */}
        <div className="rounded-xl overflow-hidden border border-[var(--border)]">
          {/* Editor toolbar */}
          <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-700">
            <div className="flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
              <span className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
            </div>
            <span className="text-[11px] text-zinc-500 font-mono">solution.py</span>
            <span className="text-[11px] text-zinc-500">Python 3</span>
          </div>

          {/* Textarea editor */}
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
            className={[
              "w-full min-h-[220px] bg-zinc-900 text-zinc-200",
              "font-mono text-sm leading-relaxed",
              "px-4 py-3 resize-y outline-none",
              "placeholder-zinc-600",
            ].join(" ")}
            placeholder="# Write your Python solution here..."
            aria-label="Code editor"
          />
        </div>

        {/* Run Tests button */}
        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="md"
            onClick={runTests}
            disabled={allPassed}
            leftIcon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            }
          >
            {allPassed ? "Tests Passed!" : "Run Tests"}
          </Button>
          {allPassed && (
            <span className="text-sm text-green-400 font-medium">
              +{Math.round(challenge.baseXP * xpPenaltyMultiplier)} XP earned
            </span>
          )}
        </div>

        {/* Test results */}
        {hasRun && results.length > 0 && (
          <Card padding="md">
            <TestResults results={results} />
          </Card>
        )}

        {/* Hint system */}
        {hintTexts.length > 0 && (
          <Card padding="md">
            <HintSystem hints={hintTexts} onHintRevealed={handleHintRevealed} />
          </Card>
        )}
      </div>

      {/* XP toast */}
      <XPRewardToastContainer>
        <AnimatePresence mode="sync">
          {toasts.map((toast) => (
            <XPRewardToast
              key={toast.id}
              xpAmount={toast.xpAmount}
              activity={toast.activity}
              multiplier={toast.multiplier}
              onDismiss={() => dismissToast(toast.id)}
            />
          ))}
        </AnimatePresence>
      </XPRewardToastContainer>
    </>
  );
}

// ── Helpers ──────────────────────────────────────────────────

/**
 * Very simple output extractor: looks for print("...") or print(...) calls
 * and collects what they would print. This is a placeholder until Pyodide
 * is integrated. It handles string literals and basic variable references.
 */
function extractOutput(code: string): string {
  const lines = code.split("\n");
  const outputs: string[] = [];
  // Simple variable store for single-assignment variables
  const vars: Record<string, string> = {};

  for (const rawLine of lines) {
    const line = rawLine.trim();

    // Variable assignment: x = <literal>
    const assignMatch = line.match(/^([a-zA-Z_]\w*)\s*=\s*(.+)$/);
    if (assignMatch) {
      const [, varName, rawValue] = assignMatch;
      vars[varName] = evalLiteral(rawValue.trim(), vars);
      continue;
    }

    // print(...) call
    const printMatch = line.match(/^print\((.*)?\)$/);
    if (printMatch) {
      const args = printMatch[1] ?? "";
      outputs.push(evalPrintArgs(args.trim(), vars));
    }
  }

  return outputs.join("\n");
}

function evalLiteral(expr: string, vars: Record<string, string>): string {
  // String literal
  if ((expr.startsWith('"') && expr.endsWith('"')) ||
      (expr.startsWith("'") && expr.endsWith("'"))) {
    return expr.slice(1, -1);
  }
  // Number literal
  if (/^-?[\d.]+$/.test(expr)) return expr;
  // Boolean
  if (expr === "True") return "True";
  if (expr === "False") return "False";
  // Variable reference
  if (vars[expr] !== undefined) return vars[expr];
  return expr;
}

function evalPrintArgs(args: string, vars: Record<string, string>): string {
  if (!args) return "";

  // Handle sep= and end= kwargs (strip them for now)
  const cleanArgs = args.replace(/,?\s*(sep|end)=.*$/, "").trim();
  if (!cleanArgs) return "";

  // Split by comma (simple — doesn't handle nested parens or strings with commas)
  const parts = splitArgs(cleanArgs);
  return parts
    .map((p) => evalLiteral(p.trim(), vars))
    .join(" ");
}

function splitArgs(args: string): string[] {
  const result: string[] = [];
  let depth = 0;
  let inStr: string | null = null;
  let current = "";

  for (let i = 0; i < args.length; i++) {
    const ch = args[i];
    if (!inStr && (ch === '"' || ch === "'")) {
      inStr = ch;
      current += ch;
    } else if (inStr && ch === inStr && args[i - 1] !== "\\") {
      inStr = null;
      current += ch;
    } else if (!inStr && (ch === "(" || ch === "[" || ch === "{")) {
      depth++;
      current += ch;
    } else if (!inStr && (ch === ")" || ch === "]" || ch === "}")) {
      depth--;
      current += ch;
    } else if (!inStr && depth === 0 && ch === ",") {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  if (current.trim()) result.push(current);
  return result;
}

function getStreakMultiplier(streakDays: number): number {
  if (streakDays >= 100) return 3.5;
  if (streakDays >= 60) return 2.5;
  if (streakDays >= 30) return 2.0;
  if (streakDays >= 14) return 1.5;
  if (streakDays >= 7) return 1.25;
  if (streakDays >= 3) return 1.1;
  return 1.0;
}
