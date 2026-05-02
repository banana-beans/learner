// ============================================================
// Python Tier 6 — Advanced Challenges
// ============================================================

import type { Challenge } from "@/lib/types";

export const pythonTier6Challenges: Challenge[] = [
  {
    id: "py-t6-ctx-1",
    nodeId: "python:t6:context-managers",
    type: "write_from_scratch",
    title: "Custom @contextmanager",
    description:
      "Use contextlib.contextmanager to write a context manager named announce(label) that prints 'start LABEL' on enter and 'end LABEL' on exit. Use it with label='task' and inside the block print 'work'. Expected:\nstart task\nwork\nend task",
    difficulty: 3,
    isBoss: true,
    starterCode: `from contextlib import contextmanager
`,
    testCases: [{ id: "tc1", input: "", expectedOutput: "start task\nwork\nend task", visible: true, category: "basic" }],
    hints: [
      { tier: "nudge", text: "Print before yield, then after yield (in finally for safety).", xpPenalty: 0.9 },
      { tier: "guide", text: "yield once. The block runs at the yield point.", xpPenalty: 0.75 },
      { tier: "reveal", text: `from contextlib import contextmanager

@contextmanager
def announce(label):
    print(f"start {label}")
    try:
        yield
    finally:
        print(f"end {label}")

with announce("task"):
    print("work")`, xpPenalty: 0.5 },
    ],
    baseXP: 250,
    tags: ["context-manager", "contextlib"],
  },
  {
    id: "py-t6-type-1",
    nodeId: "python:t6:type-hints",
    type: "write_from_scratch",
    title: "Typed maximum",
    description:
      "Define max_or_default(items: list[int], default: int) -> int that returns the max if the list is non-empty, else default. Print max_or_default([3, 1, 4], 0). Expected: 4",
    difficulty: 1,
    isBoss: false,
    starterCode: `# typed function
`,
    testCases: [{ id: "tc1", input: "", expectedOutput: "4", visible: true, category: "basic" }],
    hints: [
      { tier: "nudge", text: "Annotate args with : type and return with -> type.", xpPenalty: 0.9 },
      { tier: "guide", text: "Empty list is falsy — use that for the check.", xpPenalty: 0.75 },
      { tier: "reveal", text: `def max_or_default(items: list[int], default: int) -> int:
    return max(items) if items else default

print(max_or_default([3, 1, 4], 0))`, xpPenalty: 0.5 },
    ],
    baseXP: 100,
    tags: ["type-hints"],
  },
  {
    id: "py-t6-async-1",
    nodeId: "python:t6:async-basics",
    type: "write_from_scratch",
    title: "Concurrent async greet",
    description:
      "Write async greet(name) that awaits asyncio.sleep(0) and returns f'hi {name}'. Use asyncio.gather to run greet for ['ada', 'linus'] concurrently and print the resulting list. Expected: ['hi ada', 'hi linus']",
    difficulty: 3,
    isBoss: true,
    starterCode: `import asyncio
`,
    testCases: [{ id: "tc1", input: "", expectedOutput: "['hi ada', 'hi linus']", visible: true, category: "basic" }],
    hints: [
      { tier: "nudge", text: "asyncio.gather(*coros) returns a list of results.", xpPenalty: 0.9 },
      { tier: "guide", text: "Build the coros with [greet(n) for n in names].", xpPenalty: 0.75 },
      { tier: "reveal", text: `import asyncio

async def greet(name):
    await asyncio.sleep(0)
    return f"hi {name}"

async def main():
    results = await asyncio.gather(*(greet(n) for n in ["ada", "linus"]))
    print(results)

asyncio.run(main())`, xpPenalty: 0.5 },
    ],
    baseXP: 250,
    tags: ["async", "gather"],
  },
  {
    id: "py-t6-conc-1",
    nodeId: "python:t6:concurrency",
    type: "write_from_scratch",
    title: "ThreadPool map",
    description:
      "Use concurrent.futures.ThreadPoolExecutor to map double(n) = n*2 over [1, 2, 3, 4]. Print the list. Expected: [2, 4, 6, 8]",
    difficulty: 2,
    isBoss: false,
    starterCode: `from concurrent.futures import ThreadPoolExecutor
`,
    testCases: [{ id: "tc1", input: "", expectedOutput: "[2, 4, 6, 8]", visible: true, category: "basic" }],
    hints: [
      { tier: "nudge", text: "with ThreadPoolExecutor() as ex: ex.map(...)", xpPenalty: 0.9 },
      { tier: "guide", text: "ex.map returns an iterator — wrap with list().", xpPenalty: 0.75 },
      { tier: "reveal", text: `from concurrent.futures import ThreadPoolExecutor

def double(n):
    return n * 2

with ThreadPoolExecutor() as ex:
    print(list(ex.map(double, [1, 2, 3, 4])))`, xpPenalty: 0.5 },
    ],
    baseXP: 150,
    tags: ["threadpool"],
  },
  {
    id: "py-t6-perf-1",
    nodeId: "python:t6:performance",
    type: "write_from_scratch",
    title: "Set membership win",
    description:
      "Given a list of 1000 integers and a set of the same. Don't time them — just print whether `999 in s` returns True. Expected: True",
    difficulty: 1,
    isBoss: false,
    starterCode: `items = list(range(1000))
s = set(items)
`,
    testCases: [{ id: "tc1", input: "", expectedOutput: "True", visible: true, category: "basic" }],
    hints: [
      { tier: "nudge", text: "in-check on a set is O(1).", xpPenalty: 0.9 },
      { tier: "guide", text: "print(999 in s)", xpPenalty: 0.75 },
      { tier: "reveal", text: `items = list(range(1000))
s = set(items)
print(999 in s)`, xpPenalty: 0.5 },
    ],
    baseXP: 100,
    tags: ["performance", "set"],
  },
  {
    id: "py-t6-pkg-1",
    nodeId: "python:t6:packaging",
    type: "predict_output",
    title: "Module dunder name",
    description:
      "Print the value of the special variable __name__ when this code runs as a script (top-level). Expected: __main__",
    difficulty: 1,
    isBoss: false,
    starterCode: `# print __name__
`,
    testCases: [{ id: "tc1", input: "", expectedOutput: "__main__", visible: true, category: "basic" }],
    hints: [
      { tier: "nudge", text: "Top-level code's module name is a special string.", xpPenalty: 0.9 },
      { tier: "guide", text: "print(__name__)", xpPenalty: 0.75 },
      { tier: "reveal", text: `print(__name__)`, xpPenalty: 0.5 },
    ],
    baseXP: 100,
    tags: ["module", "__name__"],
  },
  {
    id: "py-t6-test-1",
    nodeId: "python:t6:testing",
    type: "write_from_scratch",
    title: "Self-asserting test",
    description:
      "Write a function add(a, b) that returns a + b. Then assert add(2, 3) == 5 and print 'ok'. (We're simulating pytest with bare asserts.) Expected: ok",
    difficulty: 1,
    isBoss: false,
    starterCode: `# write add and self-test
`,
    testCases: [{ id: "tc1", input: "", expectedOutput: "ok", visible: true, category: "basic" }],
    hints: [
      { tier: "nudge", text: "Plain assert is enough.", xpPenalty: 0.9 },
      { tier: "guide", text: "If assert succeeds, print 'ok'.", xpPenalty: 0.75 },
      { tier: "reveal", text: `def add(a, b):
    return a + b

assert add(2, 3) == 5
print("ok")`, xpPenalty: 0.5 },
    ],
    baseXP: 100,
    tags: ["assert", "test"],
  },
  {
    id: "py-t6-desc-1",
    nodeId: "python:t6:descriptors",
    type: "write_from_scratch",
    title: "Positive descriptor",
    description:
      "Write a descriptor Positive that raises ValueError on __set__ if value <= 0. Use it for Order.qty. Construct Order(3) (where __init__ sets self.qty), print order.qty. Expected: 3",
    difficulty: 4,
    isBoss: true,
    starterCode: `# data descriptor enforcing positive
`,
    testCases: [{ id: "tc1", input: "", expectedOutput: "3", visible: true, category: "basic" }],
    hints: [
      { tier: "nudge", text: "Use __set_name__ to grab the attribute name.", xpPenalty: 0.9 },
      { tier: "guide", text: "Store the actual value in obj.__dict__ keyed by a private name.", xpPenalty: 0.75 },
      { tier: "reveal", text: `class Positive:
    def __set_name__(self, owner, name):
        self.name = "_" + name
    def __get__(self, obj, objtype=None):
        return getattr(obj, self.name)
    def __set__(self, obj, value):
        if value <= 0:
            raise ValueError("must be positive")
        setattr(obj, self.name, value)

class Order:
    qty = Positive()
    def __init__(self, qty):
        self.qty = qty

print(Order(3).qty)`, xpPenalty: 0.5 },
    ],
    baseXP: 350,
    tags: ["descriptor"],
  },
  {
    id: "py-t6-meta-1",
    nodeId: "python:t6:metaclasses",
    type: "write_from_scratch",
    title: "Auto-register subclasses",
    description:
      "Use __init_subclass__ in class Plugin to collect every subclass into Plugin.instances. Define class A(Plugin) and class B(Plugin). Print [c.__name__ for c in Plugin.instances]. Expected: ['A', 'B']",
    difficulty: 3,
    isBoss: false,
    starterCode: `# Plugin with __init_subclass__
`,
    testCases: [{ id: "tc1", input: "", expectedOutput: "['A', 'B']", visible: true, category: "basic" }],
    hints: [
      { tier: "nudge", text: "Plugin.instances = []. Append cls in __init_subclass__.", xpPenalty: 0.9 },
      { tier: "guide", text: "Don't forget super().__init_subclass__(**kwargs).", xpPenalty: 0.75 },
      { tier: "reveal", text: `class Plugin:
    instances = []
    def __init_subclass__(cls, **kwargs):
        super().__init_subclass__(**kwargs)
        Plugin.instances.append(cls)

class A(Plugin): pass
class B(Plugin): pass

print([c.__name__ for c in Plugin.instances])`, xpPenalty: 0.5 },
    ],
    baseXP: 250,
    tags: ["init_subclass", "metaclass-alt"],
  },
  {
    id: "py-t6-iter-1",
    nodeId: "python:t6:itertools",
    type: "write_from_scratch",
    title: "pairwise diffs",
    description:
      "Given nums = [1, 4, 9, 16, 25], use itertools.pairwise to print the list of consecutive differences. Expected: [3, 5, 7, 9]",
    difficulty: 2,
    isBoss: false,
    starterCode: `from itertools import pairwise
nums = [1, 4, 9, 16, 25]
`,
    testCases: [{ id: "tc1", input: "", expectedOutput: "[3, 5, 7, 9]", visible: true, category: "basic" }],
    hints: [
      { tier: "nudge", text: "pairwise yields consecutive pairs.", xpPenalty: 0.9 },
      { tier: "guide", text: "[b - a for a, b in pairwise(nums)]", xpPenalty: 0.75 },
      { tier: "reveal", text: `from itertools import pairwise
nums = [1, 4, 9, 16, 25]
print([b - a for a, b in pairwise(nums)])`, xpPenalty: 0.5 },
    ],
    baseXP: 150,
    tags: ["itertools", "pairwise"],
  },
];
