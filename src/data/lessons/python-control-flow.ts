// ============================================================
// Python Tier 2 — Control Flow Lessons
// ============================================================

import type { LessonContent } from "./python-basics";

export const pythonControlFlowLessons: Record<string, LessonContent> = {
  "python:t2:conditionals": {
    nodeId: "python:t2:conditionals",
    title: "Conditionals (if/elif/else)",
    sections: [
      {
        heading: "Branching With if",
        body: "Conditionals let your program take different paths based on conditions. The if statement runs a block when an expression is truthy. Use elif for additional branches and else as the fallback. Indentation defines the block — Python has no curly braces.",
      },
      {
        heading: "Truthiness",
        body: "Any value can be tested in an if. Numbers are truthy unless 0; strings/lists/dicts are truthy unless empty; None is always falsy. Combine conditions with and/or/not. Short-circuit evaluation means and stops at the first falsy operand, or stops at the first truthy one.",
      },
      {
        heading: "Ternary Expressions",
        body: "For simple value selection, use the inline form: value_if_true if condition else value_if_false. Read it left-to-right. Don't nest ternaries — use a real if/elif/else block instead.",
      },
    ],
    codeExamples: [
      {
        title: "Basic if/elif/else",
        code: `score = 87
if score >= 90:
    grade = "A"
elif score >= 80:
    grade = "B"
elif score >= 70:
    grade = "C"
else:
    grade = "F"
print(grade)  # B`,
        explanation: "Branches are checked top-to-bottom; the first truthy condition wins.",
      },
      {
        title: "Truthiness shortcuts",
        code: `name = ""
if not name:
    name = "Anonymous"
print(name)  # Anonymous

items = [1, 2, 3]
if items:  # truthy because non-empty
    print(f"got {len(items)} items")`,
        explanation: "Empty strings, [], {}, 0, and None are all falsy. Use this for cleaner checks.",
      },
      {
        title: "Ternary expression",
        code: `n = 7
parity = "even" if n % 2 == 0 else "odd"
print(parity)  # odd`,
        explanation: "Inline conditional. Read as: parity = (even if n is even else odd).",
      },
    ],
    keyTakeaways: [
      "Indentation (4 spaces) defines blocks — no braces",
      "Empty containers, 0, and None are falsy; everything else is truthy",
      "and/or short-circuit — they don't always evaluate both sides",
      "elif chains beat nested if/else for readability",
      "Ternary x if cond else y is for simple value selection only",
    ],
  },

  "python:t2:while-loops": {
    nodeId: "python:t2:while-loops",
    title: "While Loops",
    sections: [
      {
        heading: "Looping Until A Condition",
        body: "A while loop runs its block as long as the condition is truthy. Use it when you don't know in advance how many times you'll iterate — reading until EOF, polling, retry-with-backoff. The condition is checked before each iteration.",
      },
      {
        heading: "Avoiding Infinite Loops",
        body: "The most common bug: forgetting to mutate the loop variable. Always make sure something inside the loop progresses toward making the condition false. Pair while True: with an explicit break for cleaner read-and-process flow.",
      },
      {
        heading: "else On Loops",
        body: "Python's loops have an else clause that runs only if the loop exits normally (without break). Useful for search-style loops where you want to do something when nothing was found.",
      },
    ],
    codeExamples: [
      {
        title: "Counter loop",
        code: `n = 5
while n > 0:
    print(n)
    n -= 1
# 5 4 3 2 1`,
        explanation: "Each iteration decrements n. When n reaches 0, the condition is false and the loop exits.",
      },
      {
        title: "while True with break",
        code: `total = 0
while True:
    n = int(input("number (0 to stop): "))
    if n == 0:
        break
    total += n
print("total:", total)`,
        explanation: "Idiomatic input loop: spin forever, break on a sentinel value.",
      },
      {
        title: "while/else for search",
        code: `target = 7
nums = [1, 3, 5, 9]
i = 0
while i < len(nums):
    if nums[i] == target:
        print("found")
        break
    i += 1
else:
    print("not found")  # this runs`,
        explanation: "The else block runs because the loop completed without hitting break.",
      },
    ],
    keyTakeaways: [
      "while runs as long as the condition is truthy",
      "Always update something inside the loop or you'll spin forever",
      "while True + break is idiomatic for read-and-process loops",
      "else after a loop runs only if the loop didn't break",
      "Prefer for over while when you're iterating a known sequence",
    ],
  },

  "python:t2:for-loops": {
    nodeId: "python:t2:for-loops",
    title: "For Loops (range, enumerate, zip)",
    sections: [
      {
        heading: "Iterating Sequences",
        body: "for loops iterate any iterable: lists, tuples, strings, dicts, generators. Unlike C-style for loops, Python's for is really a for-each. There's no index by default — use enumerate() if you need one.",
      },
      {
        heading: "range, enumerate, zip",
        body: "range(stop) and range(start, stop, step) generate sequences of integers — lazy and memory-efficient. enumerate(seq) yields (index, value) pairs. zip(a, b) pairs items from multiple iterables, stopping at the shortest.",
      },
      {
        heading: "Loop Patterns",
        body: "Iterate dict items with .items(). Reverse with reversed(). Sort on the fly with sorted(). Skip items with continue. Most loops in idiomatic Python don't need an index variable.",
      },
    ],
    codeExamples: [
      {
        title: "Iterating a list",
        code: `colors = ["red", "green", "blue"]
for c in colors:
    print(c.upper())
# RED GREEN BLUE`,
        explanation: "for binds each element to c in turn. No counter needed.",
      },
      {
        title: "enumerate for index + value",
        code: `users = ["ada", "linus", "grace"]
for i, name in enumerate(users, start=1):
    print(f"{i}. {name}")
# 1. ada / 2. linus / 3. grace`,
        explanation: "enumerate yields tuples; unpack them in the for header. start= sets the offset.",
      },
      {
        title: "zip parallel iteration",
        code: `names = ["ada", "linus"]
ages = [36, 54]
for name, age in zip(names, ages):
    print(f"{name} is {age}")
# ada is 36 / linus is 54`,
        explanation: "zip stops at the shorter sequence. Use itertools.zip_longest if you need all items.",
      },
    ],
    keyTakeaways: [
      "for in Python is for-each — no manual indexing",
      "range(stop) for 0..stop-1; range(a, b, step) for custom steps",
      "enumerate(seq) when you need both index and value",
      "zip(a, b) for parallel iteration; stops at shortest",
      "Iterate dicts with .items(), .keys(), or .values()",
    ],
  },

  "python:t2:match-statement": {
    nodeId: "python:t2:match-statement",
    title: "Match / Case (3.10+)",
    sections: [
      {
        heading: "Pattern Matching",
        body: "match/case is Python's structural pattern matching. It looks like a switch statement but does more — you can match on shape, types, and even bind variables. Falls through never; only one branch runs.",
      },
      {
        heading: "Pattern Types",
        body: "Patterns include literal values (1, \"hello\"), capture variables (x), wildcards (_), sequence patterns ([a, b, *rest]), mapping patterns ({\"k\": v}), class patterns (Point(x=0, y=y)), and OR patterns (1 | 2 | 3).",
      },
      {
        heading: "Guards",
        body: "Add an if clause to a case to narrow further: case x if x > 0:. The pattern must match AND the guard must be true. Use guards for conditions that aren't expressible as patterns.",
      },
    ],
    codeExamples: [
      {
        title: "Literal and wildcard",
        code: `def http_status(code):
    match code:
        case 200:
            return "OK"
        case 404:
            return "Not Found"
        case _:
            return "Unknown"
print(http_status(200))  # OK
print(http_status(500))  # Unknown`,
        explanation: "_ matches anything. Put it last as the default.",
      },
      {
        title: "Sequence and capture",
        code: `def head_tail(seq):
    match seq:
        case []:
            return "empty"
        case [x]:
            return f"single: {x}"
        case [x, *rest]:
            return f"head={x} tail={rest}"
print(head_tail([]))         # empty
print(head_tail([1, 2, 3]))  # head=1 tail=[2, 3]`,
        explanation: "Sequence patterns capture into variables. *rest gathers the remainder.",
      },
      {
        title: "Class patterns with guards",
        code: `class Point:
    def __init__(self, x, y):
        self.x, self.y = x, y

def quadrant(p):
    match p:
        case Point(x=0, y=0):
            return "origin"
        case Point(x=x, y=y) if x > 0 and y > 0:
            return "Q1"
        case _:
            return "other"
print(quadrant(Point(2, 3)))  # Q1`,
        explanation: "Class patterns destructure attributes. Guards add conditions on captured values.",
      },
    ],
    keyTakeaways: [
      "match/case is structural matching, not just a switch",
      "_ is a wildcard — put it last as the default case",
      "Patterns can capture into variables (case x:) or destructure",
      "Guards (if cond) narrow a case further",
      "No fallthrough — only one branch runs",
    ],
  },

  "python:t2:error-handling": {
    nodeId: "python:t2:error-handling",
    title: "Error Handling (try/except)",
    sections: [
      {
        heading: "Catching Exceptions",
        body: "Wrap risky code in try and handle failures in except. Catch the narrowest exception type that makes sense — never bare except: by itself, since it swallows KeyboardInterrupt and SystemExit.",
      },
      {
        heading: "else and finally",
        body: "else runs only if try succeeded with no exception. finally always runs — use it for cleanup (closing files, releasing locks). With/context managers are usually a better pattern for cleanup.",
      },
      {
        heading: "Raising and Chaining",
        body: "Raise your own errors with raise SomeError(\"message\"). Use raise ... from another to chain: this preserves the original cause in the traceback. Define custom exceptions by subclassing Exception.",
      },
    ],
    codeExamples: [
      {
        title: "try/except/else/finally",
        code: `def safe_divide(a, b):
    try:
        result = a / b
    except ZeroDivisionError:
        return None
    except TypeError as e:
        print(f"bad types: {e}")
        return None
    else:
        return result
    finally:
        print("done")
print(safe_divide(10, 2))  # done / 5.0
print(safe_divide(1, 0))   # done / None`,
        explanation: "Multiple except clauses; finally runs in every path including the success branch.",
      },
      {
        title: "Raising and chaining",
        code: `class ConfigError(Exception):
    pass

def load_port(s):
    try:
        port = int(s)
    except ValueError as e:
        raise ConfigError(f"bad port: {s!r}") from e
    return port

try:
    load_port("eighty")
except ConfigError as e:
    print(e)        # bad port: 'eighty'
    print(e.__cause__)  # invalid literal for int(): 'eighty'`,
        explanation: "from e attaches the original error as __cause__; tracebacks show both.",
      },
      {
        title: "EAFP style",
        code: `d = {"a": 1}
# Easier to Ask Forgiveness than Permission
try:
    print(d["b"])
except KeyError:
    print("missing")
# vs LBYL: if "b" in d: ...`,
        explanation: "Pythonic style favors try/except over preemptive checks for common failures.",
      },
    ],
    keyTakeaways: [
      "Catch specific exception types, not bare except",
      "except SomeError as e: gives you the exception object",
      "else runs after try only on success; finally runs always",
      "raise ... from ... preserves the original traceback",
      "Pythonic = EAFP (try/except), not LBYL (if checks first)",
    ],
  },
};
