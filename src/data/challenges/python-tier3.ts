// ============================================================
// Python Tier 3 — Data Structures Challenges
// ============================================================

import type { Challenge } from "@/lib/types";

export const pythonTier3Challenges: Challenge[] = [
  // ── lists ─────────────────────────────────────────────
  {
    id: "py-t3-list-1",
    nodeId: "python:t3:lists",
    type: "write_from_scratch",
    title: "Reverse a list",
    description:
      "Given nums = [1, 2, 3, 4, 5], print the list reversed using slicing. Expected: [5, 4, 3, 2, 1]",
    difficulty: 1,
    isBoss: false,
    starterCode: `nums = [1, 2, 3, 4, 5]
`,
    testCases: [{ id: "tc1", input: "", expectedOutput: "[5, 4, 3, 2, 1]", visible: true, category: "basic" }],
    hints: [
      { tier: "nudge", text: "Slicing with a negative step reverses.", xpPenalty: 0.9 },
      { tier: "guide", text: "[::-1] is the idiom.", xpPenalty: 0.75 },
      { tier: "reveal", text: `nums = [1, 2, 3, 4, 5]
print(nums[::-1])`, xpPenalty: 0.5 },
    ],
    baseXP: 100,
    tags: ["list", "slicing"],
  },
  {
    id: "py-t3-list-2",
    nodeId: "python:t3:lists",
    type: "write_from_scratch",
    title: "Top 3 largest",
    description: "Given scores = [42, 88, 17, 91, 55, 76, 23], print the 3 largest values as a list, sorted descending.",
    difficulty: 2,
    isBoss: true,
    starterCode: `scores = [42, 88, 17, 91, 55, 76, 23]
`,
    testCases: [{ id: "tc1", input: "", expectedOutput: "[91, 88, 76]", visible: true, category: "basic" }],
    hints: [
      { tier: "nudge", text: "Sort descending, then slice the first 3.", xpPenalty: 0.9 },
      { tier: "guide", text: "sorted(scores, reverse=True)[:3]", xpPenalty: 0.75 },
      { tier: "reveal", text: `scores = [42, 88, 17, 91, 55, 76, 23]
print(sorted(scores, reverse=True)[:3])`, xpPenalty: 0.5 },
    ],
    baseXP: 150,
    tags: ["list", "sorted", "slicing"],
  },

  // ── list-comprehensions ─────────────────────────────────
  {
    id: "py-t3-comp-1",
    nodeId: "python:t3:list-comprehensions",
    type: "write_from_scratch",
    title: "Squares of evens",
    description: "Print a list of squares of even numbers from 1..10. Expected: [4, 16, 36, 64, 100]",
    difficulty: 2,
    isBoss: false,
    starterCode: `# squares of even numbers in 1..10
`,
    testCases: [{ id: "tc1", input: "", expectedOutput: "[4, 16, 36, 64, 100]", visible: true, category: "basic" }],
    hints: [
      { tier: "nudge", text: "Filter with if, transform with the expression.", xpPenalty: 0.9 },
      { tier: "guide", text: "[n*n for n in range(1, 11) if n % 2 == 0]", xpPenalty: 0.75 },
      { tier: "reveal", text: `print([n * n for n in range(1, 11) if n % 2 == 0])`, xpPenalty: 0.5 },
    ],
    baseXP: 150,
    tags: ["list-comp", "filter"],
  },
  {
    id: "py-t3-comp-2",
    nodeId: "python:t3:list-comprehensions",
    type: "write_from_scratch",
    title: "Flatten 2D grid",
    description:
      "Given grid = [[1, 2], [3, 4], [5, 6]], flatten it into a single list using a list comprehension. Expected: [1, 2, 3, 4, 5, 6]",
    difficulty: 3,
    isBoss: true,
    starterCode: `grid = [[1, 2], [3, 4], [5, 6]]
`,
    testCases: [{ id: "tc1", input: "", expectedOutput: "[1, 2, 3, 4, 5, 6]", visible: true, category: "basic" }],
    hints: [
      { tier: "nudge", text: "Nested comprehensions iterate left-to-right like nested loops.", xpPenalty: 0.9 },
      { tier: "guide", text: "[x for row in grid for x in row]", xpPenalty: 0.75 },
      { tier: "reveal", text: `grid = [[1, 2], [3, 4], [5, 6]]
print([x for row in grid for x in row])`, xpPenalty: 0.5 },
    ],
    baseXP: 250,
    tags: ["list-comp", "nested"],
  },

  // ── tuples ──────────────────────────────────────────
  {
    id: "py-t3-tuple-1",
    nodeId: "python:t3:tuples",
    type: "write_from_scratch",
    title: "Star unpack",
    description: "Given data = [10, 20, 30, 40, 50], unpack into first, *middle, last. Print middle.",
    difficulty: 2,
    isBoss: false,
    starterCode: `data = [10, 20, 30, 40, 50]
`,
    testCases: [{ id: "tc1", input: "", expectedOutput: "[20, 30, 40]", visible: true, category: "basic" }],
    hints: [
      { tier: "nudge", text: "*name in an unpacking pattern absorbs the middle.", xpPenalty: 0.9 },
      { tier: "guide", text: "first, *middle, last = data", xpPenalty: 0.75 },
      { tier: "reveal", text: `data = [10, 20, 30, 40, 50]
first, *middle, last = data
print(middle)`, xpPenalty: 0.5 },
    ],
    baseXP: 150,
    tags: ["tuple", "unpacking"],
  },

  // ── dictionaries ─────────────────────────────────────
  {
    id: "py-t3-dict-1",
    nodeId: "python:t3:dictionaries",
    type: "write_from_scratch",
    title: "Word frequency",
    description:
      "Given words = ['a', 'b', 'a', 'c', 'b', 'a'], build a dict of counts and print it. Expected: {'a': 3, 'b': 2, 'c': 1}",
    difficulty: 2,
    isBoss: false,
    starterCode: `words = ['a', 'b', 'a', 'c', 'b', 'a']
`,
    testCases: [{ id: "tc1", input: "", expectedOutput: "{'a': 3, 'b': 2, 'c': 1}", visible: true, category: "basic" }],
    hints: [
      { tier: "nudge", text: "Insertion order is preserved, so iterate words in order.", xpPenalty: 0.9 },
      { tier: "guide", text: "counts[w] = counts.get(w, 0) + 1", xpPenalty: 0.75 },
      { tier: "reveal", text: `words = ['a', 'b', 'a', 'c', 'b', 'a']
counts = {}
for w in words:
    counts[w] = counts.get(w, 0) + 1
print(counts)`, xpPenalty: 0.5 },
    ],
    baseXP: 150,
    tags: ["dict", "counting"],
  },
  {
    id: "py-t3-dict-2",
    nodeId: "python:t3:dictionaries",
    type: "write_from_scratch",
    title: "Invert a dict",
    description:
      "Given prices = {'apple': 1, 'banana': 2, 'cherry': 3}, print a new dict with keys and values swapped: {1: 'apple', 2: 'banana', 3: 'cherry'}",
    difficulty: 2,
    isBoss: true,
    starterCode: `prices = {'apple': 1, 'banana': 2, 'cherry': 3}
`,
    testCases: [{ id: "tc1", input: "", expectedOutput: "{1: 'apple', 2: 'banana', 3: 'cherry'}", visible: true, category: "basic" }],
    hints: [
      { tier: "nudge", text: "Dict comprehension: {v: k for k, v in d.items()}", xpPenalty: 0.9 },
      { tier: "guide", text: "Swap k and v in the comprehension expression.", xpPenalty: 0.75 },
      { tier: "reveal", text: `prices = {'apple': 1, 'banana': 2, 'cherry': 3}
print({v: k for k, v in prices.items()})`, xpPenalty: 0.5 },
    ],
    baseXP: 150,
    tags: ["dict-comp", "items"],
  },

  // ── sets ────────────────────────────────────────────
  {
    id: "py-t3-set-1",
    nodeId: "python:t3:sets",
    type: "write_from_scratch",
    title: "Common elements",
    description:
      "Given a = [1, 2, 3, 4, 5] and b = [3, 4, 5, 6, 7], print the sorted list of elements in both. Expected: [3, 4, 5]",
    difficulty: 2,
    isBoss: false,
    starterCode: `a = [1, 2, 3, 4, 5]
b = [3, 4, 5, 6, 7]
`,
    testCases: [{ id: "tc1", input: "", expectedOutput: "[3, 4, 5]", visible: true, category: "basic" }],
    hints: [
      { tier: "nudge", text: "Set intersection (&) gives common elements.", xpPenalty: 0.9 },
      { tier: "guide", text: "sorted(set(a) & set(b))", xpPenalty: 0.75 },
      { tier: "reveal", text: `a = [1, 2, 3, 4, 5]
b = [3, 4, 5, 6, 7]
print(sorted(set(a) & set(b)))`, xpPenalty: 0.5 },
    ],
    baseXP: 150,
    tags: ["set", "intersection"],
  },

  // ── string-methods ───────────────────────────────────
  {
    id: "py-t3-str-1",
    nodeId: "python:t3:string-methods",
    type: "write_from_scratch",
    title: "Title case words",
    description:
      "Given raw = '  hello world  python  '. Strip, split on whitespace, title-case each word, then join with single spaces. Expected: 'Hello World Python'",
    difficulty: 2,
    isBoss: true,
    starterCode: `raw = '  hello world  python  '
`,
    testCases: [{ id: "tc1", input: "", expectedOutput: "Hello World Python", visible: true, category: "basic" }],
    hints: [
      { tier: "nudge", text: ".split() with no arg splits on any whitespace and drops empties.", xpPenalty: 0.9 },
      { tier: "guide", text: "Use a list comp + .title(), then ' '.join(...).", xpPenalty: 0.75 },
      { tier: "reveal", text: `raw = '  hello world  python  '
print(' '.join(w.title() for w in raw.split()))`, xpPenalty: 0.5 },
    ],
    baseXP: 150,
    tags: ["string", "split", "join", "title"],
  },
];
