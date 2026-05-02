// ============================================================
// Python Tier 4 — Functions Challenges
// ============================================================

import type { Challenge } from "@/lib/types";

export const pythonTier4Challenges: Challenge[] = [
  {
    id: "py-t4-fn-1",
    nodeId: "python:t4:functions-basics",
    type: "write_from_scratch",
    title: "Square function",
    description:
      "Define a function square(n) that returns n * n. Call it with 7 and print the result.",
    difficulty: 1,
    isBoss: false,
    starterCode: `# define square(n) and print square(7)
`,
    testCases: [{ id: "tc1", input: "", expectedOutput: "49", visible: true, category: "basic" }],
    hints: [
      { tier: "nudge", text: "def name(param): return ...", xpPenalty: 0.9 },
      { tier: "guide", text: "Then call square(7) inside print().", xpPenalty: 0.75 },
      { tier: "reveal", text: `def square(n):
    return n * n

print(square(7))`, xpPenalty: 0.5 },
    ],
    baseXP: 100,
    tags: ["function", "return"],
  },
  {
    id: "py-t4-args-1",
    nodeId: "python:t4:arguments",
    type: "write_from_scratch",
    title: "Sum *args",
    description:
      "Define total(*nums) that returns the sum of its arguments. Print total(1, 2, 3, 4).",
    difficulty: 2,
    isBoss: true,
    starterCode: `# define total(*nums)
`,
    testCases: [{ id: "tc1", input: "", expectedOutput: "10", visible: true, category: "basic" }],
    hints: [
      { tier: "nudge", text: "*nums collects positional args into a tuple.", xpPenalty: 0.9 },
      { tier: "guide", text: "Use the built-in sum() on the tuple.", xpPenalty: 0.75 },
      { tier: "reveal", text: `def total(*nums):
    return sum(nums)

print(total(1, 2, 3, 4))`, xpPenalty: 0.5 },
    ],
    baseXP: 150,
    tags: ["args", "varargs"],
  },
  {
    id: "py-t4-scope-1",
    nodeId: "python:t4:scope-closures",
    type: "write_from_scratch",
    title: "Counter closure",
    description:
      "Define make_counter() that returns a function. Each call to the returned function increments and returns the next integer starting at 1. Call make_counter() once, then call the returned function 3 times, printing each result on its own line.",
    difficulty: 3,
    isBoss: true,
    starterCode: `# make_counter() returns a counting function
`,
    testCases: [{ id: "tc1", input: "", expectedOutput: "1\n2\n3", visible: true, category: "basic" }],
    hints: [
      { tier: "nudge", text: "Use nonlocal to write back to the enclosing variable.", xpPenalty: 0.9 },
      { tier: "guide", text: "Inner function increments a count then returns it.", xpPenalty: 0.75 },
      { tier: "reveal", text: `def make_counter():
    n = 0
    def step():
        nonlocal n
        n += 1
        return n
    return step

c = make_counter()
print(c())
print(c())
print(c())`, xpPenalty: 0.5 },
    ],
    baseXP: 250,
    tags: ["closure", "nonlocal"],
  },
  {
    id: "py-t4-rec-1",
    nodeId: "python:t4:recursion",
    type: "write_from_scratch",
    title: "Factorial",
    description: "Define a recursive factorial(n) and print factorial(6).",
    difficulty: 2,
    isBoss: false,
    starterCode: `# recursive factorial
`,
    testCases: [{ id: "tc1", input: "", expectedOutput: "720", visible: true, category: "basic" }],
    hints: [
      { tier: "nudge", text: "Base case: n <= 1 returns 1.", xpPenalty: 0.9 },
      { tier: "guide", text: "Recursive case: n * factorial(n - 1).", xpPenalty: 0.75 },
      { tier: "reveal", text: `def factorial(n):
    if n <= 1:
        return 1
    return n * factorial(n - 1)

print(factorial(6))`, xpPenalty: 0.5 },
    ],
    baseXP: 150,
    tags: ["recursion", "base-case"],
  },
  {
    id: "py-t4-lambda-1",
    nodeId: "python:t4:lambda",
    type: "write_from_scratch",
    title: "Sort by length",
    description:
      "Given words = ['banana', 'fig', 'apple', 'kiwi'], print them sorted by length (shortest first). Expected: ['fig', 'kiwi', 'apple', 'banana']",
    difficulty: 2,
    isBoss: true,
    starterCode: `words = ['banana', 'fig', 'apple', 'kiwi']
`,
    testCases: [{ id: "tc1", input: "", expectedOutput: "['fig', 'kiwi', 'apple', 'banana']", visible: true, category: "basic" }],
    hints: [
      { tier: "nudge", text: "sorted accepts a key= function.", xpPenalty: 0.9 },
      { tier: "guide", text: "key=lambda w: len(w)", xpPenalty: 0.75 },
      { tier: "reveal", text: `words = ['banana', 'fig', 'apple', 'kiwi']
print(sorted(words, key=lambda w: len(w)))`, xpPenalty: 0.5 },
    ],
    baseXP: 150,
    tags: ["lambda", "sorted", "key"],
  },
  {
    id: "py-t4-dec-1",
    nodeId: "python:t4:decorators",
    type: "write_from_scratch",
    title: "Shout decorator",
    description:
      "Write a decorator @shout that uppercases the return value of the wrapped function. Apply it to greet(name) which returns f'hello, {name}'. Print greet('ada'). Expected: HELLO, ADA",
    difficulty: 3,
    isBoss: true,
    starterCode: `# define @shout, then greet, then print greet('ada')
`,
    testCases: [{ id: "tc1", input: "", expectedOutput: "HELLO, ADA", visible: true, category: "basic" }],
    hints: [
      { tier: "nudge", text: "Decorator = function that takes func and returns a wrapper function.", xpPenalty: 0.9 },
      { tier: "guide", text: "Wrapper calls func, then .upper()s the result.", xpPenalty: 0.75 },
      { tier: "reveal", text: `def shout(func):
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs).upper()
    return wrapper

@shout
def greet(name):
    return f"hello, {name}"

print(greet("ada"))`, xpPenalty: 0.5 },
    ],
    baseXP: 250,
    tags: ["decorator", "wrapper"],
  },
  {
    id: "py-t4-gen-1",
    nodeId: "python:t4:generators",
    type: "write_from_scratch",
    title: "First N evens",
    description:
      "Write a generator function evens() that yields 0, 2, 4, ... forever. Use it to print a list of the first 5 evens. Expected: [0, 2, 4, 6, 8]",
    difficulty: 2,
    isBoss: false,
    starterCode: `# generator + first 5
`,
    testCases: [{ id: "tc1", input: "", expectedOutput: "[0, 2, 4, 6, 8]", visible: true, category: "basic" }],
    hints: [
      { tier: "nudge", text: "while True + yield = infinite generator.", xpPenalty: 0.9 },
      { tier: "guide", text: "from itertools import islice; list(islice(evens(), 5))", xpPenalty: 0.75 },
      { tier: "reveal", text: `from itertools import islice

def evens():
    n = 0
    while True:
        yield n
        n += 2

print(list(islice(evens(), 5)))`, xpPenalty: 0.5 },
    ],
    baseXP: 150,
    tags: ["generator", "yield", "islice"],
  },
];
