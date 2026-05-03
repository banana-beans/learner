import type { Snippet } from "./types";

export const pythonSnippets: Snippet[] = [
  {
    id: "py-list-comp",
    language: "python",
    title: "List comprehension",
    tag: "syntax",
    code: `# Build a list in one expression: [value for var in iterable].
squares = [n * n for n in range(10)]
# range(10) yields 0..9; n*n produces 0,1,4,9,16,25,36,49,64,81.

print(squares)
# [0, 1, 4, 9, 16, 25, 36, 49, 64, 81]`,
    explanation:
      "Same as a for-loop with .append(), but compiled to faster bytecode and reads as one idea: 'collect n*n for each n in range'.",
  },
  {
    id: "py-dict-comp",
    language: "python",
    title: "Dict comprehension",
    tag: "syntax",
    code: `users = ["ada", "linus", "grace"]

# {key: value for ... in ...} — same pattern as a list comp,
# but produces a dict. enumerate gives (index, item) pairs.
ids = {name: i for i, name in enumerate(users)}

print(ids)
# {'ada': 0, 'linus': 1, 'grace': 2}`,
    explanation:
      "Great for inverting a list to a name→index lookup, or remapping any dict in a single expression.",
  },
  {
    id: "py-fstring",
    language: "python",
    title: "f-string formatting",
    tag: "syntax",
    code: `pct = 0.8472

# f"..." lets you embed expressions inside {curly braces}.
# After a colon comes the format spec: .1% means percent, 1 decimal.
print(f"grip: {pct:.1%}")
# grip: 84.7%

# Other useful format specs:
print(f"{1234567:,}")     # 1,234,567       — thousands separator
print(f"{3.14159:.2f}")   # 3.14            — fixed-point, 2 decimals
print(f"{42:>5}")         # "   42"         — right-align width 5`,
    explanation:
      "f-strings are the modern way to format. The bit after the colon is the same mini-language as str.format().",
  },
  {
    id: "py-walrus",
    language: "python",
    title: "Walrus operator (:=)",
    tag: "syntax",
    code: `# Assign and use a value in the same expression.
nums = [1, 2, 3, 4, 5, 6]

# := computes len(nums) once, binds it to n, AND returns it for the print.
if (n := len(nums)) > 3:
    print(f"got {n} items")     # got 6 items

# Common in while loops to avoid recomputing
# (e.g. read in chunks until empty):
# while chunk := f.read(1024): process(chunk)`,
    explanation:
      "Saves you from declaring a variable on a separate line just to use it in a condition. Don't overuse — readability first.",
  },
  {
    id: "py-enumerate",
    language: "python",
    title: "enumerate for index + value",
    tag: "stdlib",
    code: `users = ["ada", "linus", "grace"]

# enumerate(seq, start=N) yields (index, item) pairs starting at N.
# Unpack them in the for header — no manual counter needed.
for i, name in enumerate(users, start=1):
    print(f"{i}. {name}")
# 1. ada
# 2. linus
# 3. grace`,
    explanation:
      "Whenever you find yourself doing range(len(x)) — reach for enumerate. Cleaner, less off-by-one risk.",
  },
  {
    id: "py-zip",
    language: "python",
    title: "zip parallel iteration",
    tag: "stdlib",
    code: `names = ["ada", "linus", "grace"]
ages  = [36, 54, 73]

# zip pairs items from multiple iterables and stops at the shortest.
for name, age in zip(names, ages):
    print(f"{name} is {age}")
# ada is 36
# linus is 54
# grace is 73

# itertools.zip_longest if you need ALL items (fills with None or a default).`,
    explanation:
      "zip is the canonical 'walk two lists in parallel'. For sets of related values you'd otherwise index by position, this reads better.",
  },
  {
    id: "py-dataclass",
    language: "python",
    title: "@dataclass — boilerplate-free classes",
    tag: "OOP",
    code: `from dataclasses import dataclass

# @dataclass auto-generates __init__, __repr__, and __eq__ from the
# annotated fields below — no manual ceremony.
@dataclass
class Point:
    x: int
    y: int

p1 = Point(3, 4)
p2 = Point(3, 4)
print(p1)            # Point(x=3, y=4)        — readable repr
print(p1 == p2)      # True                   — equality by value`,
    explanation:
      "Use dataclasses for plain data containers. For immutable + hashable, add @dataclass(frozen=True).",
  },
  {
    id: "py-context-mgr",
    language: "python",
    title: "with — automatic cleanup",
    tag: "stdlib",
    code: `# 'with' guarantees __exit__ runs even if the body raises —
# the file is closed correctly no matter what.
with open("/tmp/notes.txt", "w") as f:
    f.write("hello")
# f is now closed.

# Equivalent without 'with' is verbose AND error-prone:
# f = open(...); try: f.write(...); finally: f.close()`,
    explanation:
      "Always prefer with-statements for files, locks, network connections — anything that needs cleanup. They handle the finally for you.",
  },
  {
    id: "py-generator",
    language: "python",
    title: "yield — lazy generators",
    tag: "syntax",
    code: `# A function with 'yield' becomes a generator: produces values on demand,
# never building the whole list in memory.
def squares_up_to(n):
    for i in range(n):
        yield i * i        # pause here; resume on next iteration

g = squares_up_to(5)       # nothing has run yet
print(next(g))             # 0    — runs until the first yield
print(next(g))             # 1
print(list(g))             # [4, 9, 16] — drains the rest`,
    explanation:
      "Generators are perfect for huge or infinite sequences. Memory stays constant; values produced only as the consumer pulls them.",
  },
  {
    id: "py-args-kwargs",
    language: "python",
    title: "*args / **kwargs",
    tag: "syntax",
    code: `# *nums collects extra positional args into a tuple.
# **opts collects extra keyword args into a dict.
def stats(*nums, label="result"):
    return f"{label}: total={sum(nums)} count={len(nums)}"

print(stats(1, 2, 3))                  # result: total=6 count=3
print(stats(10, 20, label="scores"))   # scores: total=30 count=2

# Forwarding pattern — same syntax in both directions:
# def wrapper(*args, **kwargs): return original(*args, **kwargs)`,
    explanation:
      "Use *args/**kwargs when you don't know the arg count in advance, or when forwarding to another callable.",
  },
  {
    id: "py-slicing",
    language: "python",
    title: "Slicing [start:stop:step]",
    tag: "syntax",
    code: `s = [10, 20, 30, 40, 50]

print(s[1:4])     # [20, 30, 40]   — items 1..3 (stop is exclusive)
print(s[:2])      # [10, 20]       — from start
print(s[-2:])     # [40, 50]       — last two
print(s[::2])     # [10, 30, 50]   — every other item
print(s[::-1])    # [50, 40, ...]  — reverse via negative step

# Slicing always returns a NEW list — original untouched.`,
    explanation:
      "[::-1] is the classic reverse idiom. Slices also work on strings and tuples (but immutable — you can't slice-assign there).",
  },
  {
    id: "py-ternary",
    language: "python",
    title: "Ternary expression",
    tag: "syntax",
    code: `n = 7

# Read left-to-right: <value-if-true> if <condition> else <value-if-false>.
parity = "even" if n % 2 == 0 else "odd"
print(parity)    # odd

# Don't nest ternaries — use a real if/elif/else block instead.`,
    explanation:
      "Inline conditional. Best for picking between two values; avoid stacking them — readability tanks fast.",
  },
  {
    id: "py-decorator",
    language: "python",
    title: "Decorator basics",
    tag: "syntax",
    code: `import time
from functools import wraps

# A decorator is a function that takes a function and returns a wrapper.
def timed(func):
    @wraps(func)                            # preserves func.__name__, __doc__
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        result = func(*args, **kwargs)
        print(f"{func.__name__} took {(time.perf_counter()-start)*1000:.1f}ms")
        return result
    return wrapper

@timed                                      # sugar for: slow = timed(slow)
def slow():
    time.sleep(0.05)

slow()                                      # slow took 50.4ms`,
    explanation:
      "Decorators are how @cache, @property, Flask routes etc. work. Always use functools.wraps so the decorated function keeps its identity.",
  },
  {
    id: "py-defaultdict",
    language: "python",
    title: "defaultdict — auto-init values",
    tag: "stdlib",
    code: `from collections import defaultdict

# defaultdict(list) auto-creates an empty list on first access of a missing key.
groups = defaultdict(list)
for word in ["apple", "ant", "banana", "berry", "cherry"]:
    groups[word[0]].append(word)

print(dict(groups))
# {'a': ['apple', 'ant'], 'b': ['banana', 'berry'], 'c': ['cherry']}

# Without defaultdict, you'd have:
# if key not in d: d[key] = []
# d[key].append(...)`,
    explanation:
      "Cleans up the 'create-if-missing-then-append' pattern. Pass any zero-arg factory: list, set, int (for counters), dict, etc.",
  },
  {
    id: "py-any-all",
    language: "python",
    title: "any() and all()",
    tag: "stdlib",
    code: `nums = [2, 4, 6, 8, 10]

# any(iter): True if AT LEAST ONE item is truthy.
# all(iter): True only if EVERY item is truthy.
# Both short-circuit — stop at first decisive item.
print(all(n % 2 == 0 for n in nums))   # True   — all even
print(any(n > 9 for n in nums))        # True   — 10 > 9
print(all(n > 5 for n in nums))        # False  — 2 fails

# Pair with a generator expression for laziness on big iterables.`,
    explanation:
      "Two of the most useful built-ins for predicate checks. Combined with generator expressions, they're both fast and readable.",
  },
  {
    id: "py-counter",
    language: "python",
    title: "Counter — frequency counts",
    tag: "stdlib",
    code: `from collections import Counter

text = "the quick brown fox jumps over the lazy dog"
words = text.split()

# Counter takes an iterable and counts occurrences of each item.
c = Counter(words)

print(c.most_common(3))       # top 3 (ties broken by insertion order)
# [('the', 2), ('quick', 1), ('brown', 1)]

print(c["the"])               # 2 — direct access like a dict
print(c["xylophone"])         # 0 — missing keys return 0, no KeyError`,
    explanation:
      "Counter is a dict subclass tuned for counting. .most_common(n) is the canonical 'top N most frequent' helper.",
  },
  {
    id: "py-pathlib",
    language: "python",
    title: "pathlib over os.path",
    tag: "stdlib",
    code: `from pathlib import Path

# Path objects compose with the / operator — readable and cross-platform.
p = Path.home() / "projects" / "learner" / "README.md"

print(p.name)        # README.md         — last path component
print(p.suffix)      # .md               — extension
print(p.parent)      # /home/.../learner — directory containing it
print(p.exists())    # True or False

# Read whole file in one line:
# text = p.read_text()
# Write: p.write_text("hello")`,
    explanation:
      "Modern stdlib API for file paths. Replaces awkward os.path.join + os.path.basename calls with chainable methods.",
  },
  {
    id: "py-namedtuple",
    language: "python",
    title: "namedtuple — readable fields",
    tag: "stdlib",
    code: `from collections import namedtuple

# Like a tuple, but with named fields. Immutable + value-equal + hashable.
Point = namedtuple("Point", ["x", "y"])

p = Point(3, 4)
print(p.x, p.y)        # 3 4         — access by name
print(p[0])            # 3           — still works as a tuple
print(p == Point(3,4)) # True        — value equality

# typing.NamedTuple is the typed version with the same shape.`,
    explanation:
      "Use when a tuple's fields have meaning — Point(x=1, y=2) reads better than (1, 2). For richer behavior, reach for @dataclass.",
  },
  {
    id: "py-set-ops",
    language: "python",
    title: "Set algebra",
    tag: "stdlib",
    code: `a = {1, 2, 3, 4}
b = {3, 4, 5, 6}

# Sets support union | intersection & difference - symmetric-difference ^.
print(a | b)         # {1, 2, 3, 4, 5, 6}      — union
print(a & b)         # {3, 4}                  — intersection
print(a - b)         # {1, 2}                  — items only in a
print(a ^ b)         # {1, 2, 5, 6}            — only in one of them

# Membership checks are O(1) — much faster than 'in' on a list.`,
    explanation:
      "Sets give you constant-time membership AND set algebra. Often the right tool when you'd reach for 'list of unique things'.",
  },
  {
    id: "py-cache",
    language: "python",
    title: "@cache — instant memoization",
    tag: "stdlib",
    code: `from functools import cache

# @cache memoizes return values keyed by arguments.
# Without it, fib(30) is millions of recursive calls; with it, ~30.
@cache
def fib(n):
    if n < 2:
        return n
    return fib(n - 1) + fib(n - 2)

print(fib(50))
# 12586269025  — instant`,
    explanation:
      "Pure function with overlapping subproblems? Slap @cache on it. Use @lru_cache(maxsize=N) if you need a bounded cache.",
  },
  {
    id: "py-zip-longest",
    language: "python",
    title: "itertools.zip_longest",
    tag: "stdlib",
    code: `from itertools import zip_longest

a = [1, 2, 3, 4]
b = ['x', 'y']

# zip_longest pads the shorter iterable with fillvalue.
# Regular zip would stop at the shortest (length 2).
for x, y in zip_longest(a, b, fillvalue="?"):
    print(x, y)
# 1 x
# 2 y
# 3 ?
# 4 ?`,
    explanation:
      "Use when you want every item from both iterables, not just paired ones. Fill value defaults to None.",
  },
  {
    id: "py-pairwise",
    language: "python",
    title: "itertools.pairwise",
    tag: "stdlib",
    code: `from itertools import pairwise

# pairwise yields consecutive overlapping pairs. (3.10+)
nums = [1, 4, 9, 16, 25]
diffs = [b - a for a, b in pairwise(nums)]
print(diffs)
# [3, 5, 7, 9]   — differences between adjacent items

# Useful for: rolling sums, edge detection, change-over-time.`,
    explanation:
      "Saves writing index-arithmetic for sliding-pair patterns. Pairs naturally with list comps for differences and ratios.",
  },
  {
    id: "py-string-methods",
    language: "python",
    title: "Common string methods",
    tag: "stdlib",
    code: `s = "  Hello, World!  "

# Strings are immutable — every method returns a NEW string.
print(s.strip())            # "Hello, World!"     — drops leading/trailing whitespace
print(s.lower())            # "  hello, world!  "
print(s.replace("l", "L"))  # "  HeLLo, WorLd!  "
print(s.split(","))         # ["  Hello", " World!  "]

# Chaining for short pipelines:
clean = s.strip().lower().replace(",", "")
print(clean)                # "hello world!"`,
    explanation:
      "Method chaining is fine for short transformations. For anything complex, reach for a pipeline of named steps instead.",
  },
  {
    id: "py-try-else",
    language: "python",
    title: "try / except / else / finally",
    tag: "syntax",
    code: `def safe_divide(a, b):
    try:
        result = a / b
    except ZeroDivisionError:        # narrow type — never bare 'except:'
        return None
    else:                            # runs only if try succeeded
        return result
    finally:                         # runs always (success OR failure)
        print("done")

print(safe_divide(10, 2))   # done / 5.0
print(safe_divide(1, 0))    # done / None`,
    explanation:
      "else runs after a clean try; finally runs no matter what. Catch specific exception types — bare except: hides real bugs.",
  },
  {
    id: "py-pythonic-swap",
    language: "python",
    title: "Tuple-unpack swap",
    tag: "syntax",
    code: `a, b = 1, 2

# Swap without a temp variable.
# The right side builds a tuple (b, a); the left unpacks it.
a, b = b, a

print(a, b)   # 2 1

# Same trick works for any number of names:
# x, y, z = z, x, y`,
    explanation:
      "Pythonic swap. Reads like math, no temp var. Works for any rotation of variables.",
  },
  {
    id: "py-eafp",
    language: "python",
    title: "EAFP — Easier to Ask Forgiveness",
    tag: "idiom",
    code: `d = {"name": "Ada"}

# LBYL (Look Before You Leap) — explicit check, more typing
# if "name" in d:
#     print(d["name"])

# EAFP (Easier to Ask Forgiveness than Permission) — Pythonic
try:
    print(d["name"])     # Ada
except KeyError:
    print("missing")`,
    explanation:
      "Pythonic style favors try/except over preemptive checks for common failures. Cleaner under concurrency too — no time-of-check/time-of-use bugs.",
  },
  {
    id: "py-protocol",
    language: "python",
    title: "Protocol — structural typing",
    tag: "OOP",
    code: `from typing import Protocol

# Protocols define an interface by SHAPE, not inheritance.
# Anything with the right methods qualifies — duck typing with type checking.
class HasArea(Protocol):
    def area(self) -> float: ...

class Triangle:                            # doesn't inherit anything
    def area(self) -> float:
        return 0.5 * 3 * 4

def describe(s: HasArea) -> str:
    return f"area = {s.area()}"

print(describe(Triangle()))                # area = 6.0   — accepted!`,
    explanation:
      "Use Protocol when you want type checking without forcing inheritance. ABC requires inheritance; Protocol just checks the shape.",
  },
  {
    id: "py-lru-cache",
    language: "python",
    title: "@lru_cache(maxsize=N)",
    tag: "stdlib",
    code: `from functools import lru_cache

# Bounded cache — evicts least-recently-used items at maxsize.
# Useful when memory must be bounded.
@lru_cache(maxsize=128)
def expensive(n):
    print(f"computing {n}")
    return n ** 2

expensive(5)    # computing 5 / 25
expensive(5)    # 25            — cache hit, no print

# Stats: hits, misses, size
print(expensive.cache_info())   # CacheInfo(hits=1, misses=1, maxsize=128, currsize=1)`,
    explanation:
      "Like @cache but bounded. Prefer @cache (unbounded) when you control inputs; lru_cache when caching could grow without limit.",
  },
  {
    id: "py-merge-dicts",
    language: "python",
    title: "Merge dicts with |",
    tag: "syntax",
    code: `defaults = {"theme": "dark", "lang": "en"}
overrides = {"lang": "fr", "size": 14}

# 3.9+: | merges dicts, right side wins on conflicts.
merged = defaults | overrides
print(merged)
# {'theme': 'dark', 'lang': 'fr', 'size': 14}

# In-place: defaults |= overrides
# Older Python: {**defaults, **overrides}`,
    explanation:
      "PEP 584. Right-side-wins is consistent with how dict.update behaves; the spread-form {**a, **b} also works on older Pythons.",
  },
  {
    id: "py-match",
    language: "python",
    title: "match / case (3.10+)",
    tag: "syntax",
    code: `def describe(value):
    match value:
        case None:                            # literal None match
            return "nothing"
        case int(x) if x < 0:                 # type pattern + guard
            return f"negative {x}"
        case [a, *rest]:                      # sequence pattern with star
            return f"list head={a} tail={rest}"
        case {"name": name}:                  # mapping pattern
            return f"dict with name={name}"
        case _:                               # wildcard — default
            return "other"

print(describe(-5))                # negative -5
print(describe([1, 2, 3]))         # list head=1 tail=[2, 3]
print(describe({"name": "Ada"}))   # dict with name=Ada`,
    explanation:
      "Structural pattern matching, not just a switch. Patterns can destructure types, sequences, and mappings — much more powerful than chained ifs.",
  },
  {
    id: "py-sorted-key",
    language: "python",
    title: "sorted(key=...)",
    tag: "stdlib",
    code: `users = [
    {"name": "ada",   "age": 36},
    {"name": "linus", "age": 54},
    {"name": "grace", "age": 73},
]

# key= takes a function that returns the value to sort by.
# Sort by age:
print(sorted(users, key=lambda u: u["age"]))

# Sort by multiple keys — return a tuple:
# sorted(users, key=lambda u: (u["age"], u["name"]))

# operator.itemgetter is faster + clearer for simple lookups:
from operator import itemgetter
print(sorted(users, key=itemgetter("age")))`,
    explanation:
      "key= is the canonical sort customization. For simple field/index access, operator.itemgetter / .attrgetter beats lambda.",
  },
  {
    id: "py-chain-iter",
    language: "python",
    title: "itertools.chain",
    tag: "stdlib",
    code: `from itertools import chain

# chain concatenates multiple iterables LAZILY — no intermediate list.
nums   = chain([1, 2], range(3, 5), (10, 20))

print(list(nums))     # [1, 2, 3, 4, 10, 20]

# chain.from_iterable flattens one level:
nested = [[1, 2], [3, 4], [5]]
print(list(chain.from_iterable(nested)))   # [1, 2, 3, 4, 5]`,
    explanation:
      "Memory-efficient concatenation. Especially useful with from_iterable for flattening nested structures one level deep.",
  },
  {
    id: "py-bisect",
    language: "python",
    title: "bisect — binary search on sorted lists",
    tag: "stdlib",
    code: `import bisect

scores = [50, 60, 70, 85, 90, 95]

# bisect_left finds the leftmost insert point that keeps the list sorted.
print(bisect.bisect_left(scores, 70))    # 2  — index where 70 fits

# Insert in O(log n) lookup + O(n) shift:
bisect.insort(scores, 75)
print(scores)                            # [50, 60, 70, 75, 85, 90, 95]

# Use bisect to bucket continuous values into named ranges:
breakpoints = [60, 70, 80, 90]
grades      = ['F', 'D', 'C', 'B', 'A']
def grade(score):
    return grades[bisect.bisect_left(breakpoints, score)]
print(grade(73))    # C`,
    explanation:
      "When your data stays sorted, bisect gives O(log n) search and O(n) insertion — dramatically faster than scanning.",
  },
  {
    id: "py-typing-generic",
    language: "python",
    title: "Generic functions with TypeVar",
    tag: "typing",
    code: `from typing import TypeVar

T = TypeVar("T")    # type variable — placeholder for any type

# Return type matches input type — preserved through the function.
def first(items: list[T]) -> T | None:
    return items[0] if items else None

x = first([1, 2, 3])           # x: int | None
y = first(["a", "b"])          # y: str | None
print(x, y)                    # 1 a`,
    explanation:
      "TypeVar is how you write generics. mypy infers T per call, so the return type is preserved — you don't have to annotate by hand.",
  },
  {
    id: "py-os-environ",
    language: "python",
    title: "os.environ for config",
    tag: "stdlib",
    code: `import os

# os.environ is a dict-like view over environment variables.
# .get returns a default — never crashes on missing keys.
debug   = os.environ.get("DEBUG", "0") == "1"
api_key = os.environ.get("API_KEY")     # returns None if unset

# Required env var — fail loudly at startup, not later.
db_url = os.environ["DATABASE_URL"]     # KeyError if missing

# Cast types yourself — env vars are always strings.
port = int(os.environ.get("PORT", "8000"))`,
    explanation:
      "Standard config pattern: env vars in, .get with defaults for optional, [...] subscript for required. Cast manually since values are strings.",
  },
  {
    id: "py-str-startswith-tuple",
    language: "python",
    title: "startswith with a tuple",
    tag: "stdlib",
    code: `urls = [
    "http://example.com",
    "https://secure.com",
    "ftp://files.com",
    "ws://chat.com",
]

# str.startswith / .endswith accept a TUPLE of prefixes.
# Single check against multiple options — no chained 'or'.
http_urls = [u for u in urls if u.startswith(("http://", "https://"))]
print(http_urls)
# ['http://example.com', 'https://secure.com']`,
    explanation:
      "Less obvious feature. Saves you from writing s.startswith(a) or s.startswith(b) or s.startswith(c).",
  },
];
