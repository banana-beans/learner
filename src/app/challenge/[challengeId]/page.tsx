"use client";

import { use, useCallback } from "react";
import { useProgressStore } from "@/store/progress-store";
import { useUserStore } from "@/store/user-store";
import { ChallengeWorkspace } from "@/components/challenge/ChallengeWorkspace";
import type { Challenge, ChallengeResult } from "@/lib/types";

// ---------------------------------------------------------------------------
// Placeholder challenge data
// When real challenge content is created, this will be replaced with an import.
// ---------------------------------------------------------------------------

const PLACEHOLDER_CHALLENGES: Record<string, Challenge> = {
  "demo-hello-world": {
    id: "demo-hello-world",
    nodeId: "python-t1-basics",
    type: "write_from_scratch",
    title: "Hello, World!",
    description:
      'Write a function called `greet` that takes a name as a string and returns "Hello, {name}!" — your first step into Python.',
    difficulty: 1,
    isBoss: false,
    starterCode: 'def greet(name: str) -> str:\n    # Write your code here\n    pass\n',
    testCases: [
      {
        id: "tc-1",
        input: '"World"',
        expectedOutput: '"Hello, World!"',
        visible: true,
        category: "basic",
        description: 'greet("World") returns "Hello, World!"',
      },
      {
        id: "tc-2",
        input: '"Alice"',
        expectedOutput: '"Hello, Alice!"',
        visible: true,
        category: "basic",
        description: 'greet("Alice") returns "Hello, Alice!"',
      },
      {
        id: "tc-3",
        input: '""',
        expectedOutput: '"Hello, !"',
        visible: false,
        category: "edge",
        description: "Handles empty string",
      },
    ],
    hints: [
      { tier: "nudge", text: "Use an f-string to interpolate the name variable.", xpPenalty: 0.9 },
      { tier: "guide", text: 'The syntax is f"Hello, {name}!" — return this from your function.', xpPenalty: 0.75 },
      { tier: "reveal", text: 'def greet(name: str) -> str:\n    return f"Hello, {name}!"', xpPenalty: 0.5 },
    ],
    baseXP: 100,
    tags: ["python", "strings", "functions"],
  },
  "demo-bug-fix": {
    id: "demo-bug-fix",
    nodeId: "python-t1-basics",
    type: "bug_fix",
    title: "Fix the Fibonacci",
    description:
      "This Fibonacci function has a bug that causes incorrect results for n > 2. Find and fix it.",
    difficulty: 2,
    isBoss: false,
    starterCode:
      "def fibonacci(n: int) -> int:\n    if n <= 0:\n        return 0\n    if n == 1:\n        return 1\n    a, b = 0, 1\n    for i in range(2, n):\n        a, b = b, a + b\n    return a  # Bug: should return b\n",
    testCases: [
      {
        id: "tc-1",
        input: "0",
        expectedOutput: "0",
        visible: true,
        category: "basic",
        description: "fibonacci(0) returns 0",
      },
      {
        id: "tc-2",
        input: "1",
        expectedOutput: "1",
        visible: true,
        category: "basic",
        description: "fibonacci(1) returns 1",
      },
      {
        id: "tc-3",
        input: "6",
        expectedOutput: "8",
        visible: true,
        category: "basic",
        description: "fibonacci(6) returns 8",
      },
      {
        id: "tc-4",
        input: "10",
        expectedOutput: "55",
        visible: false,
        category: "edge",
        description: "fibonacci(10) returns 55",
      },
    ],
    hints: [
      { tier: "nudge", text: "Look at the return statement. Which variable holds the current value?", xpPenalty: 0.9 },
      { tier: "guide", text: "After the loop, `b` contains fib(n), not `a`. Check the return value.", xpPenalty: 0.75 },
      { tier: "reveal", text: "Change `return a` to `return b` on the last line.", xpPenalty: 0.5 },
    ],
    baseXP: 150,
    tags: ["python", "debugging", "loops"],
  },
  "demo-multiple-choice": {
    id: "demo-multiple-choice",
    nodeId: "python-t1-basics",
    type: "multiple_choice",
    title: "Python List Comprehension",
    description: "Which of the following correctly creates a list of squares from 1 to 5?",
    difficulty: 1,
    isBoss: false,
    options: [
      { id: "a", text: "[x^2 for x in range(1, 6)]", isCorrect: false, explanation: "Python uses ** for exponentiation, not ^." },
      { id: "b", text: "[x**2 for x in range(1, 6)]", isCorrect: true, explanation: "Correct! This produces [1, 4, 9, 16, 25]." },
      { id: "c", text: "[x*2 for x in range(1, 6)]", isCorrect: false, explanation: "This doubles x, not squares it." },
      { id: "d", text: "list(map(square, range(5)))", isCorrect: false, explanation: "This would require a defined `square` function and starts from 0." },
    ],
    hints: [
      { tier: "nudge", text: "Think about which operator Python uses for exponents.", xpPenalty: 0.9 },
      { tier: "guide", text: "In Python, the exponent operator is ** (double asterisk).", xpPenalty: 0.75 },
      { tier: "reveal", text: "The answer is [x**2 for x in range(1, 6)].", xpPenalty: 0.5 },
    ],
    baseXP: 100,
    tags: ["python", "list-comprehension"],
  },
  "demo-parsons": {
    id: "demo-parsons",
    nodeId: "python-t1-basics",
    type: "parsons",
    title: "Build a For Loop",
    description: "Arrange the code blocks to create a function that sums all even numbers in a list.",
    difficulty: 1,
    isBoss: false,
    parsonsBlocks: [
      { id: "p1", code: "def sum_evens(numbers):", indentLevel: 0 },
      { id: "p2", code: "total = 0", indentLevel: 1 },
      { id: "p3", code: "for n in numbers:", indentLevel: 1 },
      { id: "p4", code: "if n % 2 == 0:", indentLevel: 2 },
      { id: "p5", code: "total += n", indentLevel: 3 },
      { id: "p6", code: "return total", indentLevel: 1 },
    ],
    hints: [
      { tier: "nudge", text: "Start with the function definition, then initialize the counter.", xpPenalty: 0.9 },
      { tier: "guide", text: "The order is: def, total=0, for loop, if check, add to total, return.", xpPenalty: 0.75 },
      { tier: "reveal", text: "Correct order: def -> total = 0 -> for n in numbers: -> if n % 2 == 0: -> total += n -> return total", xpPenalty: 0.5 },
    ],
    baseXP: 100,
    tags: ["python", "loops", "conditionals"],
  },
};

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function ChallengePage({
  params,
}: {
  params: Promise<{ challengeId: string }>;
}) {
  const { challengeId } = use(params);

  const completeChallenge = useProgressStore((s) => s.completeChallenge);
  const addXP = useUserStore((s) => s.addXP);

  const challenge = PLACEHOLDER_CHALLENGES[challengeId] ?? null;

  const handleComplete = useCallback(
    (result: ChallengeResult) => {
      // Persist to progress store
      completeChallenge(result);

      // Award XP
      addXP({
        amount: result.xpEarned,
        source: "challenge_complete",
        referenceId: result.challengeId,
        multipliers: {
          firstAttempt: result.firstAttempt ? 1.5 : undefined,
          noHint: result.hintsUsed === 0 ? 1.1 : undefined,
        },
      });
    },
    [completeChallenge, addXP]
  );

  // Not found
  if (!challenge) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-16 h-16 rounded-full bg-[var(--surface-2)] flex items-center justify-center">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--text-muted)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          Challenge Not Found
        </h2>
        <p className="text-sm text-[var(--text-muted)] text-center max-w-md">
          The challenge &ldquo;{challengeId}&rdquo; doesn&apos;t exist yet. It
          may be coming soon or the link may be incorrect.
        </p>
        <button
          onClick={() => {
            if (typeof window !== "undefined") {
              window.history.back();
            }
          }}
          className="text-sm text-[var(--accent-blue)] hover:underline"
        >
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6">
      <ChallengeWorkspace challenge={challenge} onComplete={handleComplete} />
    </div>
  );
}
