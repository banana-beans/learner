"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type {
  Challenge,
  ChallengeResult,
  ChallengeType,
  HintTier,
  DifficultyStars,
  ParsonsBlock,
} from "@/lib/types";
import { HINT_XP_PENALTIES } from "@/lib/constants";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { TestRunner, type TestResult } from "@/components/challenge/TestRunner";
import { HintPanel } from "@/components/challenge/HintPanel";
import { SubmissionResult } from "@/components/challenge/SubmissionResult";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ChallengeWorkspaceProps {
  challenge: Challenge;
  onComplete: (result: ChallengeResult) => void;
}

// ---------------------------------------------------------------------------
// Constants & helpers
// ---------------------------------------------------------------------------

const TYPE_LABELS: Record<ChallengeType, { label: string; variant: "blue" | "cyan" | "purple" | "orange" | "green" | "yellow" | "red" }> = {
  write_from_scratch: { label: "Write", variant: "blue" },
  fill_in_the_blank: { label: "Fill Blanks", variant: "cyan" },
  bug_fix: { label: "Bug Fix", variant: "red" },
  refactor: { label: "Refactor", variant: "purple" },
  predict_output: { label: "Predict Output", variant: "orange" },
  multiple_choice: { label: "Multiple Choice", variant: "green" },
  parsons: { label: "Parsons", variant: "yellow" },
  design: { label: "Design", variant: "purple" },
};

function DifficultyStarsDisplay({ stars }: { stars: DifficultyStars }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`Difficulty: ${stars} of 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill={i < stars ? "var(--xp-gold)" : "none"}
          stroke={i < stars ? "var(--xp-gold)" : "var(--text-muted)"}
          strokeWidth="2"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Editor sub-components by challenge type
// ---------------------------------------------------------------------------

function CodeEditor({
  value,
  onChange,
  placeholder,
  readOnly,
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  readOnly?: boolean;
}) {
  return (
    <div className="relative flex-1 min-h-[200px] rounded-lg border border-[var(--border)] bg-[#0a0a12] overflow-hidden">
      {/* Line numbers gutter */}
      <div className="absolute top-0 left-0 bottom-0 w-10 bg-[var(--surface)] border-r border-[var(--border)] pointer-events-none z-10">
        <div className="pt-3 px-1 text-right">
          {(value || "").split("\n").map((_, i) => (
            <div key={i} className="text-[10px] leading-[1.65rem] text-[var(--text-muted)]">
              {i + 1}
            </div>
          ))}
        </div>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        readOnly={readOnly}
        placeholder={placeholder}
        spellCheck={false}
        className={[
          "w-full h-full min-h-[200px] pl-12 pr-4 py-3 bg-transparent text-sm",
          "text-[var(--foreground)] font-mono leading-relaxed resize-y",
          "focus:outline-none placeholder:text-[var(--text-muted)]/50",
          readOnly ? "opacity-70 cursor-not-allowed" : "",
        ].join(" ")}
      />
    </div>
  );
}

function MultipleChoiceEditor({
  options,
  selected,
  onSelect,
}: {
  options: Challenge["options"];
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  if (!options) return null;

  return (
    <div className="flex flex-col gap-2">
      {options.map((opt) => {
        const isSelected = selected === opt.id;
        return (
          <button
            key={opt.id}
            onClick={() => onSelect(opt.id)}
            className={[
              "flex items-start gap-3 px-4 py-3 rounded-lg border text-left transition-all duration-150",
              isSelected
                ? "border-[var(--accent-blue)] bg-[var(--accent-blue)]/10"
                : "border-[var(--border)] bg-[var(--surface-2)] hover:border-[var(--accent-blue)]/40",
            ].join(" ")}
          >
            <span
              className={[
                "mt-0.5 shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center",
                isSelected
                  ? "border-[var(--accent-blue)] bg-[var(--accent-blue)]"
                  : "border-[var(--text-muted)]",
              ].join(" ")}
            >
              {isSelected && (
                <span className="w-2 h-2 rounded-full bg-white" />
              )}
            </span>
            <span className="text-sm text-[var(--foreground)]">{opt.text}</span>
          </button>
        );
      })}
    </div>
  );
}

function ParsonsEditor({
  blocks,
  order,
  onReorder,
}: {
  blocks: ParsonsBlock[];
  order: string[];
  onReorder: (newOrder: string[]) => void;
}) {
  function moveUp(idx: number) {
    if (idx === 0) return;
    const next = [...order];
    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
    onReorder(next);
  }

  function moveDown(idx: number) {
    if (idx === order.length - 1) return;
    const next = [...order];
    [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
    onReorder(next);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs text-[var(--text-muted)] mb-1">
        Reorder the blocks into the correct sequence:
      </p>
      {order.map((blockId, idx) => {
        const block = blocks.find((b) => b.id === blockId);
        if (!block) return null;
        return (
          <motion.div
            key={blockId}
            layout
            transition={{ duration: 0.2 }}
            className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2"
          >
            {/* Up/down controls */}
            <div className="flex flex-col gap-0.5 shrink-0">
              <button
                onClick={() => moveUp(idx)}
                disabled={idx === 0}
                className="text-[var(--text-muted)] hover:text-[var(--foreground)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Move up"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="18 15 12 9 6 15" />
                </svg>
              </button>
              <button
                onClick={() => moveDown(idx)}
                disabled={idx === order.length - 1}
                className="text-[var(--text-muted)] hover:text-[var(--foreground)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Move down"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
            </div>

            {/* Block number */}
            <span className="text-xs text-[var(--text-muted)] font-mono tabular-nums w-5 text-center shrink-0">
              {idx + 1}
            </span>

            {/* Code block */}
            <code
              className="text-sm text-[var(--foreground)] font-mono flex-1"
              style={{ paddingLeft: `${block.indentLevel * 1.5}rem` }}
            >
              {block.code}
            </code>
          </motion.div>
        );
      })}
    </div>
  );
}

function PredictOutputEditor({
  code,
  options,
  selected,
  onSelect,
}: {
  code: string;
  options: Challenge["options"];
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      {/* Read-only code display */}
      <div className="rounded-lg border border-[var(--border)] bg-[#0a0a12] p-4 overflow-x-auto">
        <pre className="text-sm text-[var(--foreground)] font-mono whitespace-pre">
          {code}
        </pre>
      </div>

      {/* Output options */}
      <div>
        <p className="text-sm font-medium text-[var(--text-secondary)] mb-2">
          What will this code output?
        </p>
        <MultipleChoiceEditor
          options={options}
          selected={selected}
          onSelect={onSelect}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main workspace
// ---------------------------------------------------------------------------

export function ChallengeWorkspace({ challenge, onComplete }: ChallengeWorkspaceProps) {
  // State
  const [code, setCode] = useState(getInitialCode(challenge));
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [parsonsOrder, setParsonsOrder] = useState<string[]>(
    challenge.parsonsBlocks?.map((b) => b.id) ?? []
  );
  const [running, setRunning] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [revealedHints, setRevealedHints] = useState<HintTier[]>([]);
  const [showHints, setShowHints] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [result, setResult] = useState<ChallengeResult | null>(null);

  const startTimeRef = useRef(Date.now());
  const attemptCountRef = useRef(0);

  // Helpers
  function getInitialCode(ch: Challenge): string {
    switch (ch.type) {
      case "write_from_scratch":
        return ch.starterCode ?? "";
      case "fill_in_the_blank":
        return ch.templateCode ?? "";
      case "bug_fix":
        return ch.starterCode ?? "";
      case "refactor":
        return ch.starterCode ?? "";
      default:
        return ch.starterCode ?? "";
    }
  }

  // Run tests (simulated)
  const handleRunTests = useCallback(() => {
    if (!challenge.testCases || challenge.testCases.length === 0) return;

    setRunning(true);
    setTestResults([]);
    attemptCountRef.current += 1;

    // Simulate test execution with staggered results
    const results: TestResult[] = [];
    challenge.testCases.forEach((tc, i) => {
      setTimeout(() => {
        // Simulation: randomly pass/fail for now, Pyodide will replace this
        const passed = Math.random() > 0.3;
        const newResult: TestResult = {
          testCaseId: tc.id,
          passed,
          actual: passed ? tc.expectedOutput : "Error: simulated failure",
          error: passed ? undefined : "Simulated test environment",
        };
        results.push(newResult);
        setTestResults([...results]);

        // Last test
        if (i === challenge.testCases!.length - 1) {
          setTimeout(() => setRunning(false), 200);
        }
      }, 300 + i * 400);
    });
  }, [challenge.testCases]);

  // Submit
  const handleSubmit = useCallback(() => {
    const timeTaken = Math.round((Date.now() - startTimeRef.current) / 1000);
    const testsPassed = testResults.filter((r) => r.passed).length;
    const testsTotal = challenge.testCases?.length ?? 0;

    // Calculate XP with hint penalties
    let xpMultiplier = 1.0;
    for (const tier of revealedHints) {
      xpMultiplier *= HINT_XP_PENALTIES[tier];
    }

    const isFirstAttempt = attemptCountRef.current <= 1;

    // Apply multipliers
    if (isFirstAttempt) xpMultiplier *= 1.5;
    if (revealedHints.length === 0) xpMultiplier *= 1.1;
    if (timeTaken < 120) xpMultiplier *= 1.25;

    const xpEarned = Math.round(challenge.baseXP * xpMultiplier);

    const challengeResult: ChallengeResult = {
      challengeId: challenge.id,
      nodeId: challenge.nodeId,
      completedAt: new Date().toISOString(),
      hintsUsed: revealedHints.length,
      firstAttempt: isFirstAttempt,
      timeTakenSeconds: timeTaken,
      testsPassed,
      testsTotal,
      xpEarned,
    };

    setResult(challengeResult);
    setCompleted(true);
    onComplete(challengeResult);
  }, [challenge, testResults, revealedHints, onComplete]);

  // Submit for non-code challenges (multiple choice, predict output)
  const handleSubmitChoice = useCallback(() => {
    const timeTaken = Math.round((Date.now() - startTimeRef.current) / 1000);
    attemptCountRef.current += 1;

    const correctOption = challenge.options?.find((o) => o.isCorrect);
    const isCorrect = selectedOption === correctOption?.id;
    const isFirstAttempt = attemptCountRef.current <= 1;

    let xpMultiplier = 1.0;
    for (const tier of revealedHints) {
      xpMultiplier *= HINT_XP_PENALTIES[tier];
    }
    if (isFirstAttempt) xpMultiplier *= 1.5;
    if (revealedHints.length === 0) xpMultiplier *= 1.1;

    const xpEarned = isCorrect
      ? Math.round(challenge.baseXP * xpMultiplier)
      : 0;

    const challengeResult: ChallengeResult = {
      challengeId: challenge.id,
      nodeId: challenge.nodeId,
      completedAt: new Date().toISOString(),
      hintsUsed: revealedHints.length,
      firstAttempt: isFirstAttempt,
      timeTakenSeconds: timeTaken,
      testsPassed: isCorrect ? 1 : 0,
      testsTotal: 1,
      xpEarned,
    };

    setResult(challengeResult);
    setCompleted(true);
    onComplete(challengeResult);
  }, [challenge, selectedOption, revealedHints, onComplete]);

  // Hint reveal
  function handleRevealHint(tier: HintTier) {
    if (!revealedHints.includes(tier)) {
      setRevealedHints((prev) => [...prev, tier]);
    }
  }

  // Type info
  const typeInfo = TYPE_LABELS[challenge.type];
  const hasTestCases = (challenge.testCases?.length ?? 0) > 0;
  const isChoiceBased = challenge.type === "multiple_choice" || challenge.type === "predict_output";
  const canSubmit = isChoiceBased ? selectedOption !== null : testResults.length > 0;

  // Completed view
  if (completed && result) {
    return (
      <Card padding="none" className="overflow-hidden">
        <SubmissionResult
          result={result}
          challenge={challenge}
          onNext={() => {
            // Reset for next challenge
            setCompleted(false);
            setResult(null);
            setCode(getInitialCode(challenge));
            setTestResults([]);
            setSelectedOption(null);
            setRevealedHints([]);
            attemptCountRef.current = 0;
            startTimeRef.current = Date.now();
          }}
        />
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Split layout: instructions + editor */}
      <div className="flex flex-col md:flex-row gap-4 w-full">
        {/* LEFT: Instructions panel */}
        <div className="flex flex-col gap-4 w-full md:w-[40%] md:min-w-[320px]">
          <Card padding="md">
            {/* Challenge header */}
            <div className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <h1 className="text-lg font-bold text-[var(--foreground)] leading-tight">
                  {challenge.title}
                </h1>
                {challenge.isBoss && (
                  <Badge variant="gold" size="sm" filled>
                    BOSS
                  </Badge>
                )}
              </div>

              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={typeInfo.variant} size="xs">
                  {typeInfo.label}
                </Badge>
                <DifficultyStarsDisplay stars={challenge.difficulty} />
                <span className="text-xs text-[var(--xp-gold)] font-medium">
                  {challenge.baseXP} XP
                </span>
              </div>

              {/* Description */}
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                {challenge.description}
              </p>

              {/* Tags */}
              {challenge.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {challenge.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] text-[var(--text-muted)] bg-[var(--surface-3)] px-1.5 py-0.5 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Hints toggle + panel */}
          {challenge.hints.length > 0 && (
            <Card padding="md">
              <button
                onClick={() => setShowHints((prev) => !prev)}
                className="flex items-center justify-between w-full text-left"
              >
                <span className="flex items-center gap-2 text-sm font-medium text-[var(--foreground)]">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--accent-orange)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 18h6" />
                    <path d="M10 22h4" />
                    <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
                  </svg>
                  Hints ({challenge.hints.length})
                </span>
                <motion.svg
                  animate={{ rotate: showHints ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--text-muted)"
                  strokeWidth="2"
                >
                  <polyline points="6 9 12 15 18 9" />
                </motion.svg>
              </button>

              <AnimatePresence>
                {showHints && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="overflow-hidden"
                  >
                    <div className="pt-3 border-t border-[var(--border)] mt-3">
                      <HintPanel
                        hints={challenge.hints}
                        onReveal={handleRevealHint}
                        revealedTiers={revealedHints}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          )}

          {/* Test runner (below instructions on mobile, beside editor on desktop) */}
          {hasTestCases && (
            <Card padding="md" className="md:block">
              <TestRunner
                testCases={challenge.testCases!}
                userCode={code}
                running={running}
                results={testResults}
              />
            </Card>
          )}
        </div>

        {/* RIGHT: Editor / interaction area */}
        <div className="flex flex-col gap-4 w-full md:flex-1">
          <Card padding="md" className="flex flex-col gap-4 flex-1">
            {/* Editor label */}
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[var(--foreground)]">
                {challenge.type === "multiple_choice"
                  ? "Select Your Answer"
                  : challenge.type === "predict_output"
                    ? "Predict the Output"
                    : challenge.type === "parsons"
                      ? "Arrange the Code"
                      : "Code Editor"}
              </h2>
              {!isChoiceBased && (
                <span className="text-[10px] text-[var(--text-muted)]">
                  Monaco editor coming soon
                </span>
              )}
            </div>

            {/* Challenge-type-specific editor */}
            {challenge.type === "write_from_scratch" && (
              <CodeEditor
                value={code}
                onChange={setCode}
                placeholder="Write your solution here..."
              />
            )}

            {challenge.type === "fill_in_the_blank" && (
              <CodeEditor
                value={code}
                onChange={setCode}
                placeholder="Fill in the __BLANK__ sections..."
              />
            )}

            {challenge.type === "bug_fix" && (
              <CodeEditor
                value={code}
                onChange={setCode}
                placeholder="Find and fix the bug..."
              />
            )}

            {challenge.type === "refactor" && (
              <CodeEditor
                value={code}
                onChange={setCode}
                placeholder="Refactor the code..."
              />
            )}

            {challenge.type === "design" && (
              <CodeEditor
                value={code}
                onChange={setCode}
                placeholder="Design your solution..."
              />
            )}

            {challenge.type === "multiple_choice" && (
              <MultipleChoiceEditor
                options={challenge.options}
                selected={selectedOption}
                onSelect={setSelectedOption}
              />
            )}

            {challenge.type === "predict_output" && (
              <PredictOutputEditor
                code={challenge.starterCode ?? ""}
                options={challenge.options}
                selected={selectedOption}
                onSelect={setSelectedOption}
              />
            )}

            {challenge.type === "parsons" && challenge.parsonsBlocks && (
              <ParsonsEditor
                blocks={challenge.parsonsBlocks}
                order={parsonsOrder}
                onReorder={setParsonsOrder}
              />
            )}

            {/* Action buttons */}
            <div className="flex items-center gap-3 mt-auto pt-2">
              {hasTestCases && !isChoiceBased && (
                <Button
                  variant="secondary"
                  size="md"
                  loading={running}
                  onClick={handleRunTests}
                >
                  Run Tests
                </Button>
              )}
              <Button
                variant="success"
                size="md"
                disabled={!canSubmit && !isChoiceBased}
                onClick={isChoiceBased ? handleSubmitChoice : handleSubmit}
              >
                Submit
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
