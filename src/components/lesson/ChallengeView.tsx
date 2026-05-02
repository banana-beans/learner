"use client";

import { useState, useCallback, useEffect } from "react";
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
import { loadPyodideOnce, runPython } from "@/lib/pyodide";
import { runJavaScript } from "@/lib/js-runner";
import type { ChallengeResult } from "@/lib/types";

type PyState = "idle" | "loading" | "ready" | "error";

type Lang = "python" | "javascript" | "manual";

function resolveLang(challenge: Challenge): Lang {
  if (challenge.lang) return challenge.lang;
  const branch = challenge.nodeId.split(":")[0];
  if (branch === "python" || branch === "dsa") return "python";
  if (branch === "typescript") return "javascript";
  return "manual";
}

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
  const [pyState, setPyState] = useState<PyState>("idle");
  const [running, setRunning] = useState(false);

  const lang = resolveLang(challenge);

  // Preload Pyodide on mount only if this challenge actually runs Python.
  useEffect(() => {
    if (lang !== "python") return;
    let cancelled = false;
    setPyState("loading");
    loadPyodideOnce()
      .then(() => {
        if (!cancelled) setPyState("ready");
      })
      .catch(() => {
        if (!cancelled) setPyState("error");
      });
    return () => {
      cancelled = true;
    };
  }, [lang]);

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

  async function runTests() {
    const testCases = challenge.testCases ?? [];

    if (lang === "manual") {
      // No auto-grade for manual challenges. The user marks them done after
      // reading the solution; XP is awarded through the "I got it" button.
      setRunning(false);
      return;
    }

    setRunning(true);
    try {
      const { stdout, error } =
        lang === "javascript" ? await runJavaScript(code) : await runPython(code);

      if (testCases.length === 0) {
        // No test cases configured: any successful run accepts.
        if (error) {
          setResults([{ passed: false, description: "Runtime error", expected: undefined, actual: error }]);
          setHasRun(true);
          setAllPassed(false);
        } else {
          setResults([{ passed: true, description: "No test cases — solution accepted.", actual: stdout }]);
          setHasRun(true);
          setAllPassed(true);
          handleSuccess();
        }
        return;
      }

      const actual = error ? "" : stdout.trim();
      const errMsg = error;

      const newResults: TestResultItem[] = [];
      for (const tc of testCases) {
        const expected = tc.expectedOutput.trim();
        const passed = !errMsg && actual === expected;
        if (tc.visible) {
          newResults.push({
            passed,
            description: tc.description ?? "Test case",
            expected,
            actual: errMsg ? `Error: ${errMsg}` : actual,
          });
        } else {
          newResults.push({
            passed,
            description: "Hidden test",
            expected: undefined,
            actual: undefined,
          });
        }
      }

      const passed = newResults.every((r) => r.passed);
      setResults(newResults);
      setHasRun(true);
      setAllPassed(passed);

      if (passed) {
        handleSuccess();
      }
    } finally {
      setRunning(false);
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
            <span className="text-[11px] text-zinc-500 font-mono">
              solution.{lang === "javascript" ? "ts" : lang === "manual" ? "txt" : "py"}
            </span>
            <span className="text-[11px] text-zinc-500">
              {lang === "javascript" ? "TypeScript" : lang === "manual" ? "Reference" : "Python 3"}
            </span>
          </div>

          {/* Textarea editor */}
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            className={[
              "w-full min-h-[220px] bg-zinc-900 text-zinc-200",
              "font-mono leading-relaxed",
              "px-4 py-3 resize-y outline-none",
              "placeholder-zinc-600",
              // 16px on mobile prevents iOS auto-zoom on focus; 14px on desktop
              "ios-no-zoom",
            ].join(" ")}
            placeholder={
              lang === "javascript"
                ? "// Write your TS/JS solution here..."
                : lang === "manual"
                  ? "// Notes / scratch — this challenge is reference-only"
                  : "# Write your Python solution here..."
            }
            aria-label="Code editor"
          />
        </div>

        {/* Run Tests / Got It button */}
        <div className="flex items-center gap-3">
          {lang === "manual" ? (
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                if (allPassed) return;
                setHasRun(true);
                setAllPassed(true);
                handleSuccess();
              }}
              disabled={allPassed}
              leftIcon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              }
            >
              {allPassed ? "Marked complete" : "I got it"}
            </Button>
          ) : (
            <Button
              variant="primary"
              size="md"
              onClick={runTests}
              disabled={allPassed || running || pyState === "loading"}
              loading={running}
              leftIcon={
                !running ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                ) : undefined
              }
            >
              {allPassed
                ? "Tests Passed!"
                : pyState === "loading"
                  ? "Loading Python…"
                  : pyState === "error"
                    ? "Python failed to load"
                    : running
                      ? "Running…"
                      : "Run Tests"}
            </Button>
          )}
          {allPassed && (
            <span className="text-sm text-green-400 font-medium">
              +{Math.round(challenge.baseXP * xpPenaltyMultiplier)} XP earned
            </span>
          )}
          {pyState === "loading" && !allPassed && (
            <span className="text-xs text-[var(--text-muted)]">
              First run downloads the Python runtime (~10s)
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

        {/* Solution (always available, no XP penalty) */}
        {challenge.hints.find((h) => h.tier === "reveal") && (
          <details className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden group">
            <summary className="cursor-pointer select-none flex items-center justify-between px-4 py-3 hover:bg-[var(--surface-2)] transition-colors">
              <span className="text-sm font-medium text-[var(--foreground)]">
                Show solution
              </span>
              <span className="text-xs text-[var(--text-muted)] group-open:hidden">
                Click to reveal · no XP penalty
              </span>
              <span className="text-xs text-[var(--text-muted)] hidden group-open:inline">
                Hide
              </span>
            </summary>
            <pre className="text-xs font-mono bg-zinc-900 text-zinc-200 p-4 overflow-x-auto whitespace-pre border-t border-[var(--border)]">
              <code>
                {challenge.hints.find((h) => h.tier === "reveal")?.text ?? ""}
              </code>
            </pre>
            <div className="px-4 py-2 text-[11px] text-[var(--text-muted)] border-t border-[var(--border)]">
              Try writing it yourself first. Pasting and running won&apos;t award XP twice — the editor still has to produce the right output.
            </div>
          </details>
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

function getStreakMultiplier(streakDays: number): number {
  if (streakDays >= 100) return 3.5;
  if (streakDays >= 60) return 2.5;
  if (streakDays >= 30) return 2.0;
  if (streakDays >= 14) return 1.5;
  if (streakDays >= 7) return 1.25;
  if (streakDays >= 3) return 1.1;
  return 1.0;
}
