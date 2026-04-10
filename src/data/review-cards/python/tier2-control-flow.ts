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
// Tier 2: Control Flow (5 nodes, ~17 cards)
// ────────────────────────────────────────────────────────────

export const tier2Cards: ReviewCard[] = [
  // ── python:t2:conditionals ─────────────────────────────────
  makeCard({
    id: "card:python:t2:conditionals:1",
    nodeId: "python:t2:conditionals",
    branchId: "python",
    type: "concept",
    front: "What values are considered 'falsy' in Python?",
    back: "The falsy values are: False, None, 0 (any numeric zero including 0.0 and 0j), empty sequences ('', [], ()), empty mappings ({}), empty sets (set()), and objects whose __bool__() returns False or __len__() returns 0. Everything else is truthy.",
  }),
  makeCard({
    id: "card:python:t2:conditionals:2",
    nodeId: "python:t2:conditionals",
    branchId: "python",
    type: "code_output",
    front: "What does this code print?",
    code: 'x = 0\nif x:\n    print("truthy")\nelif x == 0:\n    print("zero")\nelse:\n    print("other")',
    expectedOutput: "zero",
    back: "0 is falsy, so the if branch is skipped. The elif checks x == 0, which is True, so 'zero' is printed. The else branch is never reached. This demonstrates that falsy does not mean the value can't match in an equality check.",
  }),
  makeCard({
    id: "card:python:t2:conditionals:3",
    nodeId: "python:t2:conditionals",
    branchId: "python",
    type: "code_output",
    front: "What does this code print?",
    code: 'score = 85\ngrade = "A" if score >= 90 else "B" if score >= 80 else "C"\nprint(grade)',
    expectedOutput: "B",
    back: "This is a chained ternary (conditional expression). score is 85, which is not >= 90, so the first condition fails. It then checks >= 80, which is True, so grade is 'B'. Ternary expressions are evaluated left to right.",
  }),
  makeCard({
    id: "card:python:t2:conditionals:4",
    nodeId: "python:t2:conditionals",
    branchId: "python",
    type: "bug_spot",
    front: "Find the bug in this code.",
    code: 'temperature = 25\nif temperature > 30\n    print("Hot")\nelse:\n    print("Mild")',
    back: "The if statement is missing a colon at the end. It should be 'if temperature > 30:'. In Python, colons are required after if, elif, else, for, while, def, class, and other compound statement headers.",
  }),

  // ── python:t2:while-loops ──────────────────────────────────
  makeCard({
    id: "card:python:t2:while-loops:1",
    nodeId: "python:t2:while-loops",
    branchId: "python",
    type: "code_output",
    front: "What does this code print?",
    code: "n = 1\nwhile n < 16:\n    n *= 2\nprint(n)",
    expectedOutput: "16",
    back: "The loop doubles n each iteration: 1 -> 2 -> 4 -> 8 -> 16. When n becomes 16, the condition n < 16 is False, so the loop exits and prints 16. The key insight is that n is checked before each iteration, so the final doubled value (16) is printed.",
  }),
  makeCard({
    id: "card:python:t2:while-loops:2",
    nodeId: "python:t2:while-loops",
    branchId: "python",
    type: "explain",
    front: "Explain the purpose of the 'else' clause on a while loop in Python.",
    back: "A while-else block runs the else clause only when the loop condition becomes False naturally — meaning the loop was NOT exited via break. This is useful for search patterns: the loop searches for something (breaking when found), and the else handles the 'not found' case. If break is executed, the else block is skipped entirely.",
  }),
  makeCard({
    id: "card:python:t2:while-loops:3",
    nodeId: "python:t2:while-loops",
    branchId: "python",
    type: "code_output",
    front: "What does this code print?",
    code: "i = 0\nwhile i < 5:\n    if i == 3:\n        break\n    i += 1\nelse:\n    print(\"done\")\nprint(i)",
    expectedOutput: "3",
    back: "The loop increments i from 0 to 3. When i == 3, break exits the loop. Because break was used, the else clause is skipped — 'done' is never printed. Then print(i) outputs 3.",
  }),
  makeCard({
    id: "card:python:t2:while-loops:4",
    nodeId: "python:t2:while-loops",
    branchId: "python",
    type: "bug_spot",
    front: "Find the bug in this code.",
    code: 'count = 10\nwhile count > 0:\n    print(count)\nprint("Liftoff!")',
    back: "This is an infinite loop because count is never decremented inside the loop body. The fix is to add 'count -= 1' (or 'count = count - 1') inside the while block. Always ensure your loop variable changes in a way that eventually makes the condition False.",
  }),

  // ── python:t2:for-loops ────────────────────────────────────
  makeCard({
    id: "card:python:t2:for-loops:1",
    nodeId: "python:t2:for-loops",
    branchId: "python",
    type: "code_output",
    front: "What does this code print?",
    code: "for i in range(3):\n    for j in range(i + 1):\n        print(\"*\", end=\"\")\n    print()",
    expectedOutput: "*\n**\n***",
    back: "When i=0, j loops 0..0 (one star). When i=1, j loops 0..1 (two stars). When i=2, j loops 0..2 (three stars). The inner print uses end='' to stay on the same line, and print() at the outer level creates a newline after each row.",
  }),
  makeCard({
    id: "card:python:t2:for-loops:2",
    nodeId: "python:t2:for-loops",
    branchId: "python",
    type: "fill_blank",
    front: "Fill in the blanks to iterate over a list with both index and value.",
    code: 'colors = ["red", "green", "blue"]\nfor __BLANK__, color in __BLANK__(colors):\n    print(f"{i}: {color}")',
    blanks: ["i", "enumerate"],
    back: "enumerate() returns (index, value) pairs. It is the Pythonic way to iterate with an index instead of using range(len(...)). You can also set a custom start: enumerate(colors, start=1).",
  }),
  makeCard({
    id: "card:python:t2:for-loops:3",
    nodeId: "python:t2:for-loops",
    branchId: "python",
    type: "concept",
    front: "What is the difference between range(5), range(1, 5), and range(0, 10, 2)?",
    back: "range(5) generates 0, 1, 2, 3, 4 (start defaults to 0, step to 1). range(1, 5) generates 1, 2, 3, 4 (custom start, exclusive end). range(0, 10, 2) generates 0, 2, 4, 6, 8 (step of 2). The end value is always excluded. range() is lazy — it generates values on demand, not all at once.",
  }),

  // ── python:t2:loop-control ─────────────────────────────────
  makeCard({
    id: "card:python:t2:loop-control:1",
    nodeId: "python:t2:loop-control",
    branchId: "python",
    type: "code_output",
    front: "What does this code print?",
    code: "for i in range(6):\n    if i % 2 == 0:\n        continue\n    print(i, end=\" \")",
    expectedOutput: "1 3 5 ",
    back: "continue skips the rest of the current iteration and moves to the next one. When i is even (0, 2, 4), the continue statement skips the print. Only odd numbers (1, 3, 5) are printed.",
  }),
  makeCard({
    id: "card:python:t2:loop-control:2",
    nodeId: "python:t2:loop-control",
    branchId: "python",
    type: "concept",
    front: "What are the three loop control statements in Python and what does each do?",
    back: "break — immediately exits the innermost loop entirely. continue — skips the rest of the current iteration and jumps to the next iteration. pass — does nothing; it is a placeholder used where a statement is syntactically required but no action is needed (e.g., an empty loop body or class definition).",
  }),
  makeCard({
    id: "card:python:t2:loop-control:3",
    nodeId: "python:t2:loop-control",
    branchId: "python",
    type: "code_output",
    front: "What does this code print?",
    code: 'for word in ["cat", "bat", "rat", "hat"]:\n    if word[0] == "r":\n        break\n    print(word)\nelse:\n    print("all done")',
    expectedOutput: "cat\nbat",
    back: "The loop prints 'cat' and 'bat'. When word is 'rat', the first character is 'r', so break exits the loop. Because break was used, the else clause is skipped — 'all done' is never printed.",
  }),

  // ── python:t2:match-case ───────────────────────────────────
  makeCard({
    id: "card:python:t2:match-case:1",
    nodeId: "python:t2:match-case",
    branchId: "python",
    type: "concept",
    front: "What Python version introduced match-case and how does it differ from a chain of if-elif statements?",
    back: "match-case was introduced in Python 3.10. Unlike if-elif, it supports structural pattern matching — you can destructure objects, match sequences, map specific keys, combine patterns with |, and use guard conditions with 'if'. The _ (wildcard) pattern acts like a default case. It is more expressive than simple value comparison.",
  }),
  makeCard({
    id: "card:python:t2:match-case:2",
    nodeId: "python:t2:match-case",
    branchId: "python",
    type: "code_output",
    front: "What does this code print?",
    code: 'command = "quit"\nmatch command.split():\n    case ["go", direction]:\n        print(f"Going {direction}")\n    case ["quit"]:\n        print("Goodbye")\n    case _:\n        print("Unknown")',
    expectedOutput: "Goodbye",
    back: "command.split() produces ['quit']. The first case expects a two-element list, so it does not match. The second case matches a one-element list containing 'quit', so 'Goodbye' is printed. The wildcard _ is never reached.",
  }),
  makeCard({
    id: "card:python:t2:match-case:3",
    nodeId: "python:t2:match-case",
    branchId: "python",
    type: "fill_blank",
    front: "Fill in the blanks to handle multiple HTTP status codes in one case.",
    code: 'status = 404\nmatch status:\n    case 200:\n        msg = "OK"\n    case 301 __BLANK__ 302:\n        msg = "Redirect"\n    case 404:\n        msg = "Not Found"\n    case __BLANK__:\n        msg = "Other"\nprint(msg)',
    blanks: ["|", "_"],
    back: "The | operator combines multiple patterns in a single case (like 'or'). The _ wildcard matches anything and acts as a default/catch-all case. These are key features of Python's structural pattern matching.",
  }),
];
