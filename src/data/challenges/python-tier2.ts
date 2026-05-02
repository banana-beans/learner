// ============================================================
// Python Tier 2 — Control Flow Challenges
// ============================================================

import type { Challenge } from "@/lib/types";

export const pythonTier2Challenges: Challenge[] = [
  // ── conditionals ──────────────────────────────────────────
  {
    id: "py-t2-cond-1",
    nodeId: "python:t2:conditionals",
    type: "write_from_scratch",
    title: "FizzBuzz (one number)",
    description:
      "Read the variable n already defined as 15. Print 'FizzBuzz' if it's divisible by both 3 and 5, 'Fizz' if only 3, 'Buzz' if only 5, otherwise print the number.\n\nExpected output for n=15: FizzBuzz",
    difficulty: 1,
    isBoss: false,
    starterCode: `n = 15
# print Fizz/Buzz/FizzBuzz/n based on divisibility
`,
    testCases: [
      { id: "tc1", input: "", expectedOutput: "FizzBuzz", visible: true, category: "basic" },
    ],
    hints: [
      { tier: "nudge", text: "Check the most specific condition first — both divisors before either.", xpPenalty: 0.9 },
      { tier: "guide", text: "Use elif chains. n % 3 == 0 means divisible by 3.", xpPenalty: 0.75 },
      { tier: "reveal", text: `n = 15
if n % 15 == 0:
    print("FizzBuzz")
elif n % 3 == 0:
    print("Fizz")
elif n % 5 == 0:
    print("Buzz")
else:
    print(n)`, xpPenalty: 0.5 },
    ],
    baseXP: 100,
    tags: ["conditionals", "modulo"],
  },
  {
    id: "py-t2-cond-2",
    nodeId: "python:t2:conditionals",
    type: "write_from_scratch",
    title: "Letter grade",
    description:
      "Score = 73 is given. Print A (>=90), B (>=80), C (>=70), D (>=60), F otherwise.",
    difficulty: 2,
    isBoss: true,
    starterCode: `score = 73
`,
    testCases: [{ id: "tc1", input: "", expectedOutput: "C", visible: true, category: "basic" }],
    hints: [
      { tier: "nudge", text: "Order matters — start from the highest threshold and work down.", xpPenalty: 0.9 },
      { tier: "guide", text: "Use elif so only one branch runs.", xpPenalty: 0.75 },
      { tier: "reveal", text: `score = 73
if score >= 90:
    print("A")
elif score >= 80:
    print("B")
elif score >= 70:
    print("C")
elif score >= 60:
    print("D")
else:
    print("F")`, xpPenalty: 0.5 },
    ],
    baseXP: 150,
    tags: ["conditionals"],
  },

  // ── while-loops ──────────────────────────────────────────
  {
    id: "py-t2-while-1",
    nodeId: "python:t2:while-loops",
    type: "write_from_scratch",
    title: "Countdown",
    description: "Print integers 5, 4, 3, 2, 1 each on its own line using a while loop.",
    difficulty: 1,
    isBoss: false,
    starterCode: `# countdown from 5 to 1
`,
    testCases: [{ id: "tc1", input: "", expectedOutput: "5\n4\n3\n2\n1", visible: true, category: "basic" }],
    hints: [
      { tier: "nudge", text: "Start at 5 and decrement each iteration.", xpPenalty: 0.9 },
      { tier: "guide", text: "Loop while n > 0, print, then n -= 1.", xpPenalty: 0.75 },
      { tier: "reveal", text: `n = 5
while n > 0:
    print(n)
    n -= 1`, xpPenalty: 0.5 },
    ],
    baseXP: 100,
    tags: ["while", "decrement"],
  },
  {
    id: "py-t2-while-2",
    nodeId: "python:t2:while-loops",
    type: "write_from_scratch",
    title: "Sum until threshold",
    description:
      "Starting at n=1, accumulate 1+2+3+... until the running total exceeds 50. Print the total.",
    difficulty: 2,
    isBoss: true,
    starterCode: `# sum 1..n until total > 50
`,
    testCases: [{ id: "tc1", input: "", expectedOutput: "55", visible: true, category: "basic" }],
    hints: [
      { tier: "nudge", text: "Track total and a counter. Loop while total <= 50.", xpPenalty: 0.9 },
      { tier: "guide", text: "n=1, total=0. Each pass: total += n; n += 1.", xpPenalty: 0.75 },
      { tier: "reveal", text: `total = 0
n = 1
while total <= 50:
    total += n
    n += 1
print(total)`, xpPenalty: 0.5 },
    ],
    baseXP: 150,
    tags: ["while", "accumulator"],
  },

  // ── for-loops ──────────────────────────────────────────
  {
    id: "py-t2-for-1",
    nodeId: "python:t2:for-loops",
    type: "write_from_scratch",
    title: "Sum of 1..10",
    description: "Print the sum of integers 1 through 10 using a for loop with range().",
    difficulty: 1,
    isBoss: false,
    starterCode: `# sum 1..10
`,
    testCases: [{ id: "tc1", input: "", expectedOutput: "55", visible: true, category: "basic" }],
    hints: [
      { tier: "nudge", text: "range(1, 11) yields 1..10.", xpPenalty: 0.9 },
      { tier: "guide", text: "Initialize total=0, accumulate inside the loop, print at the end.", xpPenalty: 0.75 },
      { tier: "reveal", text: `total = 0
for n in range(1, 11):
    total += n
print(total)`, xpPenalty: 0.5 },
    ],
    baseXP: 100,
    tags: ["for", "range"],
  },
  {
    id: "py-t2-for-2",
    nodeId: "python:t2:for-loops",
    type: "write_from_scratch",
    title: "Numbered list",
    description:
      "Given fruits = ['apple', 'banana', 'cherry'], print '1. apple', '2. banana', '3. cherry' each on its own line. Use enumerate.",
    difficulty: 2,
    isBoss: true,
    starterCode: `fruits = ['apple', 'banana', 'cherry']
`,
    testCases: [
      { id: "tc1", input: "", expectedOutput: "1. apple\n2. banana\n3. cherry", visible: true, category: "basic" },
    ],
    hints: [
      { tier: "nudge", text: "enumerate(seq, start=1) gives (index, value) pairs starting at 1.", xpPenalty: 0.9 },
      { tier: "guide", text: "Use an f-string: f\"{i}. {name}\".", xpPenalty: 0.75 },
      { tier: "reveal", text: `fruits = ['apple', 'banana', 'cherry']
for i, name in enumerate(fruits, start=1):
    print(f"{i}. {name}")`, xpPenalty: 0.5 },
    ],
    baseXP: 150,
    tags: ["for", "enumerate", "f-string"],
  },

  // ── match-statement ──────────────────────────────────────
  {
    id: "py-t2-match-1",
    nodeId: "python:t2:match-statement",
    type: "write_from_scratch",
    title: "HTTP status describer",
    description:
      "Given code = 404. Use match/case to print the description: 200='OK', 404='Not Found', 500='Server Error', anything else='Unknown'.",
    difficulty: 2,
    isBoss: true,
    starterCode: `code = 404
`,
    testCases: [{ id: "tc1", input: "", expectedOutput: "Not Found", visible: true, category: "basic" }],
    hints: [
      { tier: "nudge", text: "Each known status is a literal case.", xpPenalty: 0.9 },
      { tier: "guide", text: "Use case _ as the default fallthrough.", xpPenalty: 0.75 },
      { tier: "reveal", text: `code = 404
match code:
    case 200:
        print("OK")
    case 404:
        print("Not Found")
    case 500:
        print("Server Error")
    case _:
        print("Unknown")`, xpPenalty: 0.5 },
    ],
    baseXP: 150,
    tags: ["match", "case"],
  },

  // ── error-handling ───────────────────────────────────────
  {
    id: "py-t2-err-1",
    nodeId: "python:t2:error-handling",
    type: "write_from_scratch",
    title: "Safe int conversion",
    description:
      "Given s = 'forty-two'. Try to convert to int. On failure print 'invalid'; on success print the integer.",
    difficulty: 1,
    isBoss: false,
    starterCode: `s = 'forty-two'
`,
    testCases: [{ id: "tc1", input: "", expectedOutput: "invalid", visible: true, category: "basic" }],
    hints: [
      { tier: "nudge", text: "int('forty-two') raises ValueError.", xpPenalty: 0.9 },
      { tier: "guide", text: "Wrap int(s) in try, handle ValueError in except.", xpPenalty: 0.75 },
      { tier: "reveal", text: `s = 'forty-two'
try:
    n = int(s)
    print(n)
except ValueError:
    print("invalid")`, xpPenalty: 0.5 },
    ],
    baseXP: 100,
    tags: ["try", "except", "ValueError"],
  },
  {
    id: "py-t2-err-2",
    nodeId: "python:t2:error-handling",
    type: "write_from_scratch",
    title: "Custom exception with chaining",
    description:
      "Define ConfigError(Exception). Try int('abc'), catch the ValueError, and re-raise as ConfigError using 'raise ... from e'. Then catch ConfigError and print its message: 'bad config'.",
    difficulty: 3,
    isBoss: true,
    starterCode: `# Define ConfigError, then try/except/raise/catch
`,
    testCases: [{ id: "tc1", input: "", expectedOutput: "bad config", visible: true, category: "basic" }],
    hints: [
      { tier: "nudge", text: "class ConfigError(Exception): pass — that's all you need.", xpPenalty: 0.9 },
      { tier: "guide", text: "Outer try catches ConfigError; inner try catches ValueError and re-raises.", xpPenalty: 0.75 },
      { tier: "reveal", text: `class ConfigError(Exception):
    pass

try:
    try:
        n = int('abc')
    except ValueError as e:
        raise ConfigError("bad config") from e
except ConfigError as e:
    print(e)`, xpPenalty: 0.5 },
    ],
    baseXP: 250,
    tags: ["custom-exception", "raise-from"],
  },
];
