import type { ReviewCard } from "@/lib/types";

function makeCard(
  partial: Omit<ReviewCard, "fsrs" | "state" | "dueDate" | "createdAt">
): ReviewCard {
  return {
    ...partial,
    fsrs: {
      stability: 1.0,
      difficulty: 5.0,
      elapsedDays: 0,
      scheduledDays: 0,
      reps: 0,
      lapses: 0,
      state: "new",
    },
    state: "new",
    dueDate: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
}

// ────────────────────────────────────────────────────────────
// python:t2:conditionals  (4 cards)
// ────────────────────────────────────────────────────────────

const conditionals: ReviewCard[] = [
  makeCard({
    id: "card:python:t2:conditionals:1",
    nodeId: "python:t2:conditionals",
    branchId: "python",
    type: "concept",
    front: "What values are considered 'falsy' in Python?",
    back: "Falsy values: False, None, 0, 0.0, '' (empty string), [] (empty list), {} (empty dict), set(), () (empty tuple), and any object whose __bool__() returns False or __len__() returns 0. Everything else is truthy. This lets you write concise conditions like 'if my_list:' to check if a list is non-empty.",
  }),
  makeCard({
    id: "card:python:t2:conditionals:2",
    nodeId: "python:t2:conditionals",
    branchId: "python",
    type: "code_output",
    front: "What does this code print?",
    code: 'x = 15\nif x > 20:\n    print("high")\nelif x > 10:\n    print("medium")\nelif x > 5:\n    print("low")\nelse:\n    print("tiny")',
    expectedOutput: "medium",
    back: "Python evaluates conditions top to bottom and executes only the first matching branch. x > 20 is False, so it checks x > 10 which is True (15 > 10), prints 'medium', and skips the remaining elif/else blocks.",
  }),
  makeCard({
    id: "card:python:t2:conditionals:3",
    nodeId: "python:t2:conditionals",
    branchId: "python",
    type: "code_output",
    front: "What does this code print?",
    code: 'a = 0\nb = ""\nc = [1]\nprint(bool(a), bool(b), bool(c))',
    expectedOutput: "False False True",
    back: "0 is falsy (zero integer), '' is falsy (empty string), and [1] is truthy (non-empty list). bool() converts a value to its boolean equivalent using Python's truthiness rules.",
  }),
  makeCard({
    id: "card:python:t2:conditionals:4",
    nodeId: "python:t2:conditionals",
    branchId: "python",
    type: "fill_blank",
    front: "Fill in the blank to use an inline conditional expression.",
    code: 'age = 20\nstatus = "adult" __BLANK__ age >= 18 __BLANK__ "minor"\nprint(status)',
    blanks: ["if", "else"],
    back: "Python's ternary expression syntax is: value_if_true if condition else value_if_false. This is a concise way to assign one of two values based on a condition, all in a single expression.",
  }),
];

// ────────────────────────────────────────────────────────────
// python:t2:while-loops  (3 cards)
// ────────────────────────────────────────────────────────────

const whileLoops: ReviewCard[] = [
  makeCard({
    id: "card:python:t2:while-loops:1",
    nodeId: "python:t2:while-loops",
    branchId: "python",
    type: "code_output",
    front: "What does this code print?",
    code: 'n = 1\nwhile n < 10:\n    n *= 2\nprint(n)',
    expectedOutput: "16",
    back: "Starting at 1, each iteration doubles n: 1 -> 2 -> 4 -> 8 -> 16. When n becomes 16, the condition n < 10 is False, so the loop stops. The final value 16 is printed.",
  }),
  makeCard({
    id: "card:python:t2:while-loops:2",
    nodeId: "python:t2:while-loops",
    branchId: "python",
    type: "bug_spot",
    front: "Find the bug in this code.",
    code: 'count = 5\nwhile count > 0:\n    print(count)\nprint("Done!")',
    back: "This is an infinite loop — count is never decremented inside the loop body. The fix is to add count -= 1 (or count = count - 1) inside the while block. Without modifying the loop variable, the condition count > 0 is always True.",
  }),
  makeCard({
    id: "card:python:t2:while-loops:3",
    nodeId: "python:t2:while-loops",
    branchId: "python",
    type: "explain",
    front: "Explain what a while/else construct does in Python and when the else block runs.",
    back: "In a while/else construct, the else block runs only when the while condition becomes False naturally — that is, the loop completed without hitting a break statement. If the loop exits via break, the else block is skipped. This is useful for search patterns: the loop searches for something (breaking when found), and the else handles the 'not found' case.",
  }),
];

// ────────────────────────────────────────────────────────────
// python:t2:for-loops  (4 cards)
// ────────────────────────────────────────────────────────────

const forLoops: ReviewCard[] = [
  makeCard({
    id: "card:python:t2:for-loops:1",
    nodeId: "python:t2:for-loops",
    branchId: "python",
    type: "code_output",
    front: "What does this code print?",
    code: 'for i in range(3):\n    print(i, end=" ")',
    expectedOutput: "0 1 2 ",
    back: "range(3) generates the sequence 0, 1, 2 (three values starting from 0). end=' ' makes print output a space instead of a newline after each value.",
  }),
  makeCard({
    id: "card:python:t2:for-loops:2",
    nodeId: "python:t2:for-loops",
    branchId: "python",
    type: "code_output",
    front: "What does this code print?",
    code: 'for i, ch in enumerate("abc", start=1):\n    print(f"{i}:{ch}", end=" ")',
    expectedOutput: "1:a 2:b 3:c ",
    back: "enumerate() yields (index, value) pairs. The start=1 parameter makes indexing begin at 1 instead of the default 0. This is a common pattern for numbered output.",
  }),
  makeCard({
    id: "card:python:t2:for-loops:3",
    nodeId: "python:t2:for-loops",
    branchId: "python",
    type: "fill_blank",
    front: "Fill in the blank to iterate over a range from 2 to 10 (exclusive) stepping by 2.",
    code: 'for n in __BLANK__(2, 10, 2):\n    print(n, end=" ")',
    blanks: ["range"],
    back: "range(start, stop, step) generates numbers from start up to (but not including) stop, incrementing by step. range(2, 10, 2) produces 2, 4, 6, 8.",
  }),
  makeCard({
    id: "card:python:t2:for-loops:4",
    nodeId: "python:t2:for-loops",
    branchId: "python",
    type: "concept",
    front: "Why should you prefer a for loop over a while loop when iterating over a collection in Python?",
    back: "A for loop is preferred because: (1) It is less error-prone — no risk of forgetting to update a counter or causing an infinite loop. (2) It clearly communicates intent — 'iterate over each item.' (3) It works with any iterable (lists, strings, files, generators) via the iterator protocol. Use while only when you do not know how many iterations are needed upfront or need complex termination logic.",
  }),
];

// ────────────────────────────────────────────────────────────
// python:t2:loop-control  (3 cards)
// ────────────────────────────────────────────────────────────

const loopControl: ReviewCard[] = [
  makeCard({
    id: "card:python:t2:loop-control:1",
    nodeId: "python:t2:loop-control",
    branchId: "python",
    type: "code_output",
    front: "What does this code print?",
    code: 'for n in range(1, 6):\n    if n == 3:\n        continue\n    if n == 5:\n        break\n    print(n, end=" ")',
    expectedOutput: "1 2 4 ",
    back: "continue skips the rest of the current iteration (so 3 is not printed). break exits the loop entirely when n is 5 (so 5 is never printed). Output: 1 2 4.",
  }),
  makeCard({
    id: "card:python:t2:loop-control:2",
    nodeId: "python:t2:loop-control",
    branchId: "python",
    type: "code_output",
    front: "What does this code print?",
    code: 'for n in range(2, 5):\n    if n == 4:\n        break\nelse:\n    print("completed")\nprint("done")',
    expectedOutput: "done",
    back: "The for/else pattern runs the else block only if the loop finishes without a break. Here break is triggered when n == 4, so the else block is skipped and 'completed' is never printed. Only 'done' is printed.",
  }),
  makeCard({
    id: "card:python:t2:loop-control:3",
    nodeId: "python:t2:loop-control",
    branchId: "python",
    type: "explain",
    front: "Explain the difference between break, continue, and pass in Python loops.",
    back: "break immediately exits the innermost loop entirely. continue skips to the next iteration of the innermost loop. pass does nothing — it is a placeholder statement used when syntax requires a body but you do not want to execute anything yet (e.g., an empty loop body or stub function). Unlike break and continue, pass does not alter the flow of the loop.",
  }),
];

// ────────────────────────────────────────────────────────────
// python:t2:match-case  (3 cards)
// ────────────────────────────────────────────────────────────

const matchCase: ReviewCard[] = [
  makeCard({
    id: "card:python:t2:match-case:1",
    nodeId: "python:t2:match-case",
    branchId: "python",
    type: "concept",
    front: "How does Python's match/case differ from a traditional switch statement in languages like C or JavaScript?",
    back: "Python's match/case (3.10+) supports structural pattern matching — it can match not just literal values, but also destructure sequences, mappings, objects, and use guard conditions. There is no fall-through between cases (no need for break). The _ wildcard acts as the default case. It is far more powerful than a simple switch.",
  }),
  makeCard({
    id: "card:python:t2:match-case:2",
    nodeId: "python:t2:match-case",
    branchId: "python",
    type: "code_output",
    front: "What does this code print?",
    code: 'command = "quit"\nmatch command:\n    case "start" | "go":\n        print("Starting")\n    case "quit" | "exit":\n        print("Goodbye")\n    case _:\n        print("Unknown")',
    expectedOutput: "Goodbye",
    back: "The | operator combines multiple patterns in a single case. 'quit' matches the pattern 'quit' | 'exit', so 'Goodbye' is printed. The _ wildcard case is not reached.",
  }),
  makeCard({
    id: "card:python:t2:match-case:3",
    nodeId: "python:t2:match-case",
    branchId: "python",
    type: "fill_blank",
    front: "Fill in the blanks to match a (x, y) tuple where x is positive.",
    code: 'point = (3, -1)\n__BLANK__ point:\n    case (x, y) if x > 0:\n        print(f"Right side: {x}, {y}")\n    case __BLANK__:\n        print("Other")',
    blanks: ["match", "_"],
    back: "match begins a structural pattern matching block. The case with a guard (if x > 0) only matches when the condition is true. _ is the wildcard pattern that matches anything, serving as the default catch-all case.",
  }),
];

export const tier2Cards: ReviewCard[] = [
  ...conditionals,
  ...whileLoops,
  ...forLoops,
  ...loopControl,
  ...matchCase,
];
