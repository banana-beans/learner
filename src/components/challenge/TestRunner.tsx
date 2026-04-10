"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { TestCase } from "@/lib/types";

// ---------------------------------------------------------------------------
// Local types
// ---------------------------------------------------------------------------

export interface TestResult {
  testCaseId: string;
  passed: boolean;
  actual: string;
  error?: string;
}

interface TestRunnerProps {
  testCases: TestCase[];
  userCode: string;
  running: boolean;
  results: TestResult[];
}

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function PassIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-[var(--accent-green)]"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function FailIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-red-400"
    >
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

function PendingIcon() {
  return (
    <span className="inline-block w-4 h-4 rounded-full border-2 border-[var(--text-muted)] border-t-transparent animate-spin" />
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TestRunner({ testCases, running, results }: TestRunnerProps) {
  const visibleCases = testCases.filter((tc) => tc.visible);
  const hiddenCount = testCases.length - visibleCases.length;

  const passedCount = results.filter((r) => r.passed).length;
  const totalCount = testCases.length;
  const hasResults = results.length > 0;

  function getResult(testCaseId: string): TestResult | undefined {
    return results.find((r) => r.testCaseId === testCaseId);
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--foreground)]">
          Test Results
        </h3>
        {hasResults && (
          <span
            className={[
              "text-xs font-medium px-2 py-0.5 rounded-full",
              passedCount === totalCount
                ? "bg-[var(--accent-green)]/15 text-green-400"
                : "bg-red-500/15 text-red-400",
            ].join(" ")}
          >
            {passedCount}/{totalCount} passed
          </span>
        )}
      </div>

      {/* Test list */}
      <div className="flex flex-col gap-1.5">
        <AnimatePresence mode="popLayout">
          {visibleCases.map((tc, i) => {
            const result = getResult(tc.id);
            const isPending = running && !result;
            const isPassed = result?.passed === true;

            return (
              <motion.div
                key={tc.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ delay: i * 0.05 }}
                className={[
                  "flex items-start gap-2.5 px-3 py-2 rounded-lg border text-sm",
                  result
                    ? isPassed
                      ? "border-[var(--accent-green)]/20 bg-[var(--accent-green)]/5"
                      : "border-red-500/20 bg-red-500/5"
                    : "border-[var(--border)] bg-[var(--surface-2)]",
                ].join(" ")}
              >
                {/* Status icon */}
                <span className="mt-0.5 shrink-0">
                  {isPending ? (
                    <PendingIcon />
                  ) : result ? (
                    isPassed ? (
                      <PassIcon />
                    ) : (
                      <FailIcon />
                    )
                  ) : (
                    <span className="inline-block w-4 h-4 rounded-full border-2 border-[var(--border)]" />
                  )}
                </span>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-[var(--foreground)] leading-snug">
                    {tc.description || `Test case ${i + 1}`}
                  </p>

                  {/* Show expected vs actual on failure */}
                  {result && !isPassed && (
                    <div className="mt-1.5 text-xs space-y-0.5">
                      <p className="text-[var(--text-muted)]">
                        Expected:{" "}
                        <code className="text-green-400 bg-[var(--surface-3)] px-1 py-0.5 rounded">
                          {tc.expectedOutput}
                        </code>
                      </p>
                      <p className="text-[var(--text-muted)]">
                        Actual:{" "}
                        <code className="text-red-400 bg-[var(--surface-3)] px-1 py-0.5 rounded">
                          {result.actual || "—"}
                        </code>
                      </p>
                      {result.error && (
                        <p className="text-red-400/80 mt-1">
                          Error: {result.error}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Hidden tests indicator */}
        {hiddenCount > 0 && (
          <p className="text-xs text-[var(--text-muted)] px-3 py-1.5 italic">
            + {hiddenCount} hidden test{hiddenCount > 1 ? "s" : ""}
            {hasResults && (
              <span>
                {" "}
                ({results.filter((r) => {
                  const tc = testCases.find((t) => t.id === r.testCaseId);
                  return tc && !tc.visible;
                }).filter((r) => r.passed).length}/{hiddenCount} passed)
              </span>
            )}
          </p>
        )}
      </div>

      {/* Running overlay */}
      {running && !hasResults && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 text-xs text-[var(--accent-cyan)]"
        >
          <span className="inline-block w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
          Running tests...
        </motion.div>
      )}
    </div>
  );
}
