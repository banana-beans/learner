"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { getLesson } from "@/data/lessons";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { XPRewardToast, XPRewardToastContainer } from "@/components/common/XPRewardToast";
import { useProgressStore } from "@/store/progress-store";
import { useUserStore } from "@/store/user-store";
import { useReviewStore } from "@/store/review-store";
import { createCardsForLesson } from "@/lib/review-cards";
import type { BranchId, LessonResult } from "@/lib/types";

interface LessonContentProps {
  nodeId: string;
  xpReward: number;
}

interface ToastState {
  id: string;
  xpAmount: number;
  activity: string;
  multiplier?: number;
}

export function LessonContent({ nodeId, xpReward }: LessonContentProps) {
  const lesson = getLesson(nodeId);
  const [completed, setCompleted] = useState(false);
  const [toasts, setToasts] = useState<ToastState[]>([]);

  const completeLesson = useProgressStore((s) => s.completeLesson);
  const addXP = useUserStore((s) => s.addXP);
  const streak = useUserStore((s) => s.streak);
  const addCards = useReviewStore((s) => s.addCards);

  function dismissToast(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  function handleComplete() {
    if (completed) return;
    setCompleted(true);

    const result: LessonResult = {
      nodeId,
      completedAt: new Date().toISOString(),
      xpEarned: xpReward,
      passed: true,
    };

    completeLesson(result);
    addXP({
      amount: xpReward,
      source: "lesson_complete",
      referenceId: nodeId,
      multipliers: {},
    });

    if (lesson) {
      const branchId = nodeId.split(":")[0] as BranchId;
      addCards(createCardsForLesson(lesson, branchId));
    }

    // Compute streak multiplier for display
    const streakDays = streak.currentStreak;
    const multiplier = getStreakMultiplier(streakDays);

    const toastId = crypto.randomUUID();
    setToasts((prev) => [
      ...prev,
      {
        id: toastId,
        xpAmount: xpReward,
        activity: `Lesson complete: ${lesson?.title ?? nodeId}`,
        multiplier: multiplier > 1 ? multiplier : undefined,
      },
    ]);
  }

  if (!lesson) {
    return (
      <div className="p-6 text-[var(--text-muted)] text-sm">
        Lesson content not found for node: {nodeId}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-8">
        {/* Sections */}
        <div className="space-y-6">
          {lesson.sections.map((section, i) => (
            <div key={i}>
              <h2 className="text-lg font-semibold text-[var(--foreground)] mb-2">
                {section.heading}
              </h2>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                {section.body}
              </p>
            </div>
          ))}
        </div>

        {/* Code examples */}
        {lesson.codeExamples.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-[var(--foreground)]">
              Code Examples
            </h3>
            {lesson.codeExamples.map((example, i) => (
              <Card key={i} padding="none" className="overflow-hidden">
                {/* Example title bar */}
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface-2)]">
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
                  </div>
                  <span className="text-xs text-[var(--text-muted)] ml-1">
                    {example.title}
                  </span>
                </div>

                {/* Code block */}
                <pre className="bg-zinc-900 overflow-x-auto p-4 text-sm leading-relaxed">
                  <code className="font-mono">
                    {renderPythonCode(example.code)}
                  </code>
                </pre>

                {/* Explanation */}
                <div className="px-4 py-3 bg-[var(--surface)]">
                  <p className="text-sm text-[var(--text-secondary)]">
                    {example.explanation}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Key takeaways */}
        {lesson.keyTakeaways.length > 0 && (
          <Card accent="#4f8ef7" padding="md">
            <h3 className="text-base font-semibold text-[var(--foreground)] mb-3">
              Key Takeaways
            </h3>
            <ul className="space-y-2">
              {lesson.keyTakeaways.map((point, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    className="text-[var(--accent-blue)] shrink-0 mt-0.5"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {point}
                </li>
              ))}
            </ul>
          </Card>
        )}

        {/* Complete button */}
        <div className="pt-2">
          <Button
            variant={completed ? "success" : "primary"}
            size="lg"
            onClick={handleComplete}
            disabled={completed}
            leftIcon={
              completed ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : undefined
            }
          >
            {completed ? "Lesson Complete!" : `Complete Lesson (+${xpReward} XP)`}
          </Button>
        </div>
      </div>

      {/* XP toast portal */}
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

function getStreakMultiplier(streakDays: number): number {
  if (streakDays >= 100) return 3.5;
  if (streakDays >= 60) return 2.5;
  if (streakDays >= 30) return 2.0;
  if (streakDays >= 14) return 1.5;
  if (streakDays >= 7) return 1.25;
  if (streakDays >= 3) return 1.1;
  return 1.0;
}

/**
 * Renders Python code with basic Tailwind-based syntax coloring.
 * Returns an array of React spans for keywords, strings, comments, and numbers.
 */
function renderPythonCode(code: string): React.ReactNode[] {
  const lines = code.split("\n");

  return lines.map((line, lineIdx) => (
    <span key={lineIdx}>
      {colorLine(line)}
      {lineIdx < lines.length - 1 ? "\n" : ""}
    </span>
  ));
}

function colorLine(line: string): React.ReactNode {
  // Single-line comment: everything from # onward
  const commentIdx = indexOfComment(line);
  if (commentIdx !== -1) {
    const before = line.slice(0, commentIdx);
    const comment = line.slice(commentIdx);
    return (
      <>
        {before ? colorTokens(before) : null}
        <span className="text-zinc-500 italic">{comment}</span>
      </>
    );
  }
  return colorTokens(line);
}

function indexOfComment(line: string): number {
  let inStr: string | null = null;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (!inStr && (ch === '"' || ch === "'")) {
      inStr = ch;
    } else if (inStr && ch === inStr && line[i - 1] !== "\\") {
      inStr = null;
    } else if (!inStr && ch === "#") {
      return i;
    }
  }
  return -1;
}

const KEYWORDS = new Set([
  "def", "return", "if", "elif", "else", "for", "while", "in", "not", "and",
  "or", "True", "False", "None", "import", "from", "as", "class", "pass",
  "break", "continue", "with", "try", "except", "finally", "raise", "lambda",
  "yield", "del", "global", "nonlocal", "assert", "is",
]);

const BUILTINS = new Set([
  "print", "input", "int", "float", "str", "bool", "len", "range", "type",
  "isinstance", "list", "dict", "set", "tuple", "sum", "min", "max", "abs",
  "round", "enumerate", "zip", "map", "filter", "sorted", "reversed", "open",
]);

function colorTokens(text: string): React.ReactNode {
  // Tokenise: strings, numbers, identifiers, operators, other
  const tokens: { type: string; value: string }[] = [];
  let i = 0;
  while (i < text.length) {
    // String
    if (text[i] === '"' || text[i] === "'") {
      const q = text[i];
      let j = i + 1;
      // Triple-quoted
      if (text.slice(i, i + 3) === q + q + q) {
        j = i + 3;
        while (j < text.length && text.slice(j, j + 3) !== q + q + q) j++;
        j += 3;
        tokens.push({ type: "string", value: text.slice(i, j) });
        i = j;
        continue;
      }
      while (j < text.length && text[j] !== q) {
        if (text[j] === "\\") j++;
        j++;
      }
      j++;
      tokens.push({ type: "string", value: text.slice(i, j) });
      i = j;
      continue;
    }
    // Number
    if (/[0-9]/.test(text[i]) || (text[i] === "-" && /[0-9]/.test(text[i + 1] ?? ""))) {
      let j = i + 1;
      while (j < text.length && /[0-9._]/.test(text[j])) j++;
      tokens.push({ type: "number", value: text.slice(i, j) });
      i = j;
      continue;
    }
    // Identifier or keyword
    if (/[a-zA-Z_]/.test(text[i])) {
      let j = i + 1;
      while (j < text.length && /[a-zA-Z0-9_]/.test(text[j])) j++;
      const word = text.slice(i, j);
      if (KEYWORDS.has(word)) tokens.push({ type: "keyword", value: word });
      else if (BUILTINS.has(word)) tokens.push({ type: "builtin", value: word });
      else tokens.push({ type: "ident", value: word });
      i = j;
      continue;
    }
    // Other (operators, punctuation, spaces)
    tokens.push({ type: "other", value: text[i] });
    i++;
  }

  return (
    <>
      {tokens.map((tok, idx) => {
        if (tok.type === "keyword")
          return <span key={idx} className="text-purple-400">{tok.value}</span>;
        if (tok.type === "builtin")
          return <span key={idx} className="text-cyan-400">{tok.value}</span>;
        if (tok.type === "string")
          return <span key={idx} className="text-green-400">{tok.value}</span>;
        if (tok.type === "number")
          return <span key={idx} className="text-orange-400">{tok.value}</span>;
        return <span key={idx} className="text-zinc-200">{tok.value}</span>;
      })}
    </>
  );
}
