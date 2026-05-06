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
  {
    id: "py-set-comp",
    language: "python",
    title: "Set comprehension",
    tag: "snippet",
    code: `# {expr for var in iterable} builds a set — duplicates auto-removed.
words = ["apple", "ant", "apple", "banana"]
first_letters = {w[0] for w in words}
print(first_letters)   # {'a', 'b'} — order not guaranteed`,
    explanation: "Same syntax as a list comp but with curly braces and automatic deduplication. Useful for unique-value extraction.",
  },
  {
    id: "py-gen-expr",
    language: "python",
    title: "Generator expression",
    tag: "snippet",
    code: `# (expr for var in iter) — lazy, no list built in memory.
total = sum(x * x for x in range(1_000_000))
print(total)   # 333332833333500000

# The equivalent list comp would build a 1M-item list upfront.
print(max(abs(n) for n in [-3, 1, -7, 4]))  # 7`,
    explanation: "Wrap a generator expression in sum(), max(), any() etc. to consume it without materializing a list. Constant memory regardless of input size.",
  },
  {
    id: "py-dict-get-default",
    language: "python",
    title: "dict.get() with default",
    tag: "snippet",
    code: `config = {"host": "localhost", "port": 5432}

# .get(key, default) never raises KeyError.
host  = config.get("host", "127.0.0.1")
debug = config.get("debug", False)
print(host, debug)   # localhost False

# .setdefault(key, default) inserts AND returns the default if key missing.
config.setdefault("timeout", 30)
print(config["timeout"])   # 30`,
    explanation: "Prefer .get() over try/except KeyError for optional lookups. .setdefault() is handy for 'lazy-initialise a key on first access'.",
  },
  {
    id: "py-unpack-star",
    language: "python",
    title: "Star unpacking",
    tag: "snippet",
    code: `first, *middle, last = [1, 2, 3, 4, 5]
print(first)    # 1
print(middle)   # [2, 3, 4]
print(last)     # 5

# One-sided: get head and tail in one line.
head, *tail = range(5)
print(head, tail)   # 0 [1, 2, 3, 4]

# Merge lists without building intermediates:
a, b = [1, 2], [3, 4]
merged = [*a, *b]   # [1, 2, 3, 4]`,
    explanation: "The * capture collects 'everything else' into a list. Works in assignments, function calls, and list/dict literals.",
  },
  {
    id: "py-late-binding",
    language: "python",
    title: "Closure late binding",
    tag: "understanding",
    code: `# Closures capture variables by REFERENCE, not by value.
funcs = [lambda: i for i in range(3)]
print([f() for f in funcs])   # [2, 2, 2] — all see i=2 (final value)

# Fix: bind the current value as a default argument.
funcs2 = [lambda i=i: i for i in range(3)]
print([f() for f in funcs2])  # [0, 1, 2]`,
    explanation: "Every lambda shares the same 'i' variable from the enclosing scope. The default-argument trick forces early binding by value.",
  },
  {
    id: "py-int-cache",
    language: "python",
    title: "Integer identity cache",
    tag: "understanding",
    code: `# CPython pre-allocates small integers (-5 to 256) as singletons.
a, b = 256, 256
print(a is b)   # True  — same cached object

c, d = 257, 257
print(c is d)   # False — fresh objects outside the cache range

# The lesson: use == for value equality; 'is' only for None/True/False.`,
    explanation: "An implementation detail of CPython, not guaranteed by the language spec. Never write code that relies on integer identity.",
  },
  {
    id: "py-none-is-check",
    language: "python",
    title: "None: always use 'is'",
    tag: "understanding",
    code: `value = None

# CORRECT: identity check — None is a singleton.
if value is None:
    print("missing")

# AVOID: triggers __eq__ which user classes can override.
# Some objects (numpy arrays) raise on '== None'.
if value == None:  # noqa: E711
    print("missing too")

# Linters flag '== None' — switch to 'is None' / 'is not None'.`,
    explanation: "None is the sole instance of NoneType. 'is None' is the idiomatic, safe, and lint-clean way to check for it.",
  },
  {
    id: "py-float-precision",
    language: "python",
    title: "Floating-point precision",
    tag: "understanding",
    code: `# IEEE 754 can't represent 0.1 exactly in binary.
print(0.1 + 0.2)            # 0.30000000000000004
print(0.1 + 0.2 == 0.3)     # False

# Use math.isclose() for tolerant comparisons:
import math
print(math.isclose(0.1 + 0.2, 0.3))   # True

# For exact decimal arithmetic, use decimal.Decimal:
from decimal import Decimal
print(Decimal("0.1") + Decimal("0.2"))   # 0.3`,
    explanation: "Never use == on floats unless you understand the rounding implications. math.isclose() is the standard workaround; Decimal for financials.",
  },
  {
    id: "py-deque",
    language: "python",
    title: "collections.deque",
    tag: "structures",
    code: `from collections import deque

# deque: O(1) append/pop at BOTH ends. list is O(n) at the left.
d = deque([1, 2, 3])
d.appendleft(0)   # O(1) prepend
d.append(4)       # O(1) right
print(d)          # deque([0, 1, 2, 3, 4])
d.popleft()       # O(1) — ideal for BFS queues
print(d)          # deque([1, 2, 3, 4])

# Bounded buffer: deque(maxlen=N) auto-discards from the other end.
log = deque(maxlen=3)
for i in range(5): log.append(i)
print(log)        # deque([2, 3, 4], maxlen=3)`,
    explanation: "Use deque whenever you pop from the left of a list — list.insert(0) is O(n) while deque.appendleft is O(1).",
  },
  {
    id: "py-heapq-basics",
    language: "python",
    title: "heapq — min-heap",
    tag: "structures",
    code: `import heapq

nums = [3, 1, 4, 1, 5, 9, 2, 6]
heapq.heapify(nums)           # in-place min-heap in O(n)
print(nums[0])                # 1 — smallest always at index 0

heapq.heappush(nums, 0)
print(heapq.heappop(nums))    # 0 — pop smallest, O(log n)

# Top-K largest without sorting the whole list:
print(heapq.nlargest(3, [5, 1, 8, 3, 9, 2]))  # [9, 8, 5]
print(heapq.nsmallest(2, [5, 1, 8, 3]))        # [1, 3]`,
    explanation: "Python's heapq is a min-heap. For a max-heap, negate your values. nlargest/nsmallest use a heap internally and beat full sort for small K.",
  },
  {
    id: "py-frozenset",
    language: "python",
    title: "frozenset — hashable set",
    tag: "structures",
    code: `# frozenset is an immutable set — hashable, valid as a dict key or set element.
fs = frozenset([1, 2, 3, 2, 1])
print(fs)          # frozenset({1, 2, 3})
print(2 in fs)     # True

# Regular set is unhashable — can't be a dict key.
# frozenset CAN be:
graph: dict[frozenset, str] = {}
edge = frozenset([1, 2])
graph[edge] = "connected"
print(graph[frozenset([2, 1])])  # connected — order doesn't matter`,
    explanation: "Use frozenset when you need a set that's hashable (dict key, element of another set) or want immutability guarantees.",
  },
  {
    id: "py-ordereddict",
    language: "python",
    title: "OrderedDict vs dict",
    tag: "structures",
    code: `from collections import OrderedDict

od = OrderedDict([("a", 1), ("b", 2), ("c", 3)])
od.move_to_end("a")           # reposition key to tail
print(list(od.keys()))        # ['b', 'c', 'a']

od.move_to_end("c", last=False)  # move to front
print(list(od.keys()))        # ['c', 'b', 'a']

# Key difference from plain dict: equality is ORDER-SENSITIVE.
print(OrderedDict([("a",1),("b",2)]) ==
      OrderedDict([("b",2),("a",1)]))  # False
print({"a":1,"b":2} == {"b":2,"a":1}) # True`,
    explanation: "Since Python 3.7, plain dict preserves insertion order, but only OrderedDict makes order part of equality and exposes move_to_end().",
  },
  {
    id: "py-mutable-default",
    language: "python",
    title: "Mutable default argument",
    tag: "caveats",
    code: `# The default list is created ONCE at function definition — shared across calls.
def add_item(val, lst=[]):
    lst.append(val)
    return lst

print(add_item(1))   # [1]
print(add_item(2))   # [1, 2]  — not [2]!

# Fix: use None as the sentinel.
def add_item_safe(val, lst=None):
    if lst is None:
        lst = []
    lst.append(val)
    return lst`,
    explanation: "One of the most common Python footguns. Any mutable default (list, dict, set) is shared between all callers who don't pass that argument.",
  },
  {
    id: "py-loop-capture",
    language: "python",
    title: "Loop variable capture in closures",
    tag: "caveats",
    code: `# The loop variable is captured by REFERENCE — all closures share it.
callbacks = []
for i in range(3):
    callbacks.append(lambda: i)   # captures 'i', not its current value

print([cb() for cb in callbacks])  # [2, 2, 2] — all see i=2 (last value)

# Fix: capture by value via a default argument.
callbacks2 = []
for i in range(3):
    callbacks2.append(lambda i=i: i)
print([cb() for cb in callbacks2])  # [0, 1, 2]`,
    explanation: "Same root cause as the late-binding closure problem. Default arguments are evaluated at function definition time, not call time.",
  },
  {
    id: "py-dict-iter-change",
    language: "python",
    title: "Dict mutation during iteration",
    tag: "caveats",
    code: `d = {"a": 1, "b": 2, "c": 3}

# Deleting a key while iterating raises RuntimeError.
# for k in d:
#     if d[k] == 2:
#         del d[k]   # RuntimeError: dictionary changed size during iteration

# Safe: iterate over a snapshot of the keys.
for k in list(d.keys()):
    if d[k] == 2:
        del d[k]
print(d)   # {'a': 1, 'c': 3}`,
    explanation: "Modifying a dict's size during iteration is illegal. Take a list() copy of keys (or use a comprehension to build a new dict).",
  },
  {
    id: "py-str-concat-loop",
    language: "python",
    title: "Avoid += in a string loop",
    tag: "caveats",
    code: `# Each += allocates a brand-new string — O(n^2) total for n iterations.
result = ""
for i in range(5):
    result += str(i)  # new string object every time
print(result)         # 01234

# Correct: collect parts, join once — O(n) total.
parts = [str(i) for i in range(5)]
print("".join(parts))   # 01234

# Or: use io.StringIO for incremental building in performance-sensitive code.`,
    explanation: "Strings are immutable, so += copies the whole string each time. For loops, always build a list and join at the end.",
  },
  {
    id: "py-decimal-type",
    language: "python",
    title: "decimal.Decimal for exact arithmetic",
    tag: "types",
    code: `from decimal import Decimal, getcontext

getcontext().prec = 10   # significant digits

x = Decimal("0.1") + Decimal("0.2")
print(x)                        # 0.3  — exact
print(x == Decimal("0.3"))      # True

# Always use strings — Decimal(0.1) inherits the float's error:
print(Decimal(0.1))
# 0.1000000000000000055511151231257827021181583404541015625`,
    explanation: "Use Decimal for money, taxes, and any domain where floating-point rounding is unacceptable. Pass strings to avoid float-conversion errors at construction.",
  },
  {
    id: "py-complex-numbers",
    language: "python",
    title: "Complex numbers",
    tag: "types",
    code: `# Python has a built-in complex type: real + imaginary parts.
z1 = 3 + 4j
z2 = complex(1, -2)

print(z1.real, z1.imag)    # 3.0 4.0
print(abs(z1))              # 5.0  — Euclidean magnitude
print(z1 * z2)              # (11+2j)
print(z1.conjugate())       # (3-4j)

import cmath
print(cmath.phase(z1))      # 0.9272952180016122 — angle in radians`,
    explanation: "Complex literals use 'j' for the imaginary part. The cmath module provides complex-aware versions of all the standard math functions.",
  },
  {
    id: "py-union-type",
    language: "python",
    title: "Union types with X | Y (3.10+)",
    tag: "types",
    code: `# Python 3.10+: X | Y is the clean way to write union types.
def process(value: int | str | None) -> str:
    if value is None:
        return "nothing"
    return str(value).upper()

print(process(42))     # 42
print(process("hi"))   # HI
print(process(None))   # nothing

# Pre-3.10: from typing import Union; Union[int, str, None]
# Optional[T] == T | None`,
    explanation: "The | operator for types was added in Python 3.10. For older Python, use Union[X, Y] from typing. The runtime behaviour is identical.",
  },
  {
    id: "py-optional-type",
    language: "python",
    title: "Optional[T] — value or None",
    tag: "types",
    code: `from typing import Optional

# Optional[T] is shorthand for Union[T, None].
# Use it to signal that a function might return nothing.
def find_user(uid: int) -> Optional[str]:
    db = {1: "Ada", 2: "Linus"}
    return db.get(uid)   # returns str or None

name = find_user(1)
if name is not None:
    print(name.upper())   # ADA

# Python 3.10+ prefers 'str | None' — same semantics.`,
    explanation: "Optional[T] makes None-returning functions explicit in the type signature. Callers know they must handle the None case before using the result.",
  },
  {
    id: "py-list-vs-deque",
    language: "python",
    title: "list vs deque for queue operations",
    tag: "families",
    code: `from collections import deque

# list: O(1) at RIGHT (append/pop), O(n) at LEFT (insert/pop).
lst = [1, 2, 3]
lst.insert(0, 0)   # O(n) — shifts every element
lst.pop(0)         # O(n) — shifts every element

# deque: O(1) at BOTH ends.
dq = deque([1, 2, 3])
dq.appendleft(0)   # O(1)
dq.popleft()       # O(1)

# Rule: use deque for queues (FIFO); list for stacks (LIFO, right end only).`,
    explanation: "Using a list as a FIFO queue (popping from the left) is a common performance mistake. deque is the right tool for any double-ended operation.",
  },
  {
    id: "py-counter-vs-defaultdict",
    language: "python",
    title: "Counter vs defaultdict(int)",
    tag: "families",
    code: `from collections import Counter, defaultdict

words = ["apple", "banana", "apple", "cherry", "banana", "apple"]

# Counter: purpose-built for counting, has most_common(), arithmetic.
c = Counter(words)
print(c.most_common(2))   # [('apple', 3), ('banana', 2)]
print(c + Counter(["apple"]))  # increments count

# defaultdict(int): general-purpose missing-key factory.
d = defaultdict(int)
for w in words: d[w] += 1

# Use Counter when you need most_common() or counter arithmetic;
# defaultdict for other accumulation patterns.`,
    explanation: "Counter is a dict subclass with extra counting-specific methods. defaultdict is more general. Both auto-initialise missing keys.",
  },
  {
    id: "py-set-vs-frozenset",
    language: "python",
    title: "set vs frozenset",
    tag: "families",
    code: `# set: mutable, unhashable — can't be dict key or set element.
# frozenset: immutable, hashable — valid dict key or set element.

s = {1, 2, 3}
s.add(4)
s.discard(1)
print(s)   # {2, 3, 4}

fs = frozenset([1, 2, 3])
# fs.add(4)  # AttributeError — immutable

# Use frozenset as a dict key:
graph = {frozenset([1, 2]): "edge A"}
print(graph[frozenset([2, 1])])  # edge A — order irrelevant`,
    explanation: "Choose frozenset when the set itself needs to be stored in a dict or another set, or when you want immutability guarantees.",
  },
  {
    id: "py-dataclass-vs-namedtuple",
    language: "python",
    title: "dataclass vs NamedTuple",
    tag: "families",
    code: `from dataclasses import dataclass
from typing import NamedTuple

# NamedTuple: immutable, tuple-compatible (indexing/unpacking), hashable.
class PointNT(NamedTuple):
    x: float; y: float

# dataclass: mutable by default, supports inheritance, post_init, field().
@dataclass
class PointDC:
    x: float; y: float

p = PointNT(1.0, 2.0)
print(p[0])       # 1.0 — tuple indexing works
print(hash(p))    # valid

# @dataclass(frozen=True) adds immutability + hashing to dataclasses.`,
    explanation: "Pick NamedTuple for lightweight, immutable value objects that need tuple interop. Pick dataclass for mutable containers with richer behaviour.",
  },
  {
    id: "py-abc-abstract",
    language: "python",
    title: "Abstract base classes",
    tag: "classes",
    code: `from abc import ABC, abstractmethod

# ABC prevents direct instantiation; @abstractmethod forces subclasses to implement.
class Shape(ABC):
    @abstractmethod
    def area(self) -> float: ...

    def describe(self) -> str:   # concrete method — shared by all subclasses
        return f"area = {self.area():.2f}"

class Circle(Shape):
    def __init__(self, r): self.r = r
    def area(self) -> float: return 3.14159 * self.r ** 2

# Shape()   # TypeError: Can't instantiate abstract class
print(Circle(5).describe())   # area = 78.54`,
    explanation: "ABCs enforce a contract on subclasses at instantiation time, not just at call time. Use @abstractmethod to mark required overrides.",
  },
  {
    id: "py-chained-compare",
    language: "python",
    title: "Chained comparisons",
    tag: "snippet",
    code: `x = 5
# Chained comparisons are evaluated left-to-right; each operand computed once.
print(0 < x < 10)    # True  — cleaner than '0 < x and x < 10'
print(1 == 1 == 1)   # True
print(3 < 2 < 5)     # False — 3 < 2 fails, short-circuits

# Useful for range checks:
def is_valid_age(n): return 0 <= n <= 150
print(is_valid_age(25))   # True
print(is_valid_age(200))  # False`,
    explanation: "Python allows a < b < c without repeating b — each middle operand is evaluated once. This is syntax sugar for 'a < b and b < c'.",
  },
  {
    id: "py-string-join",
    language: "python",
    title: "str.join()",
    tag: "snippet",
    code: `parts = ["one", "two", "three"]

# str.join() concatenates an iterable with the string as separator.
print(", ".join(parts))     # one, two, three
print("".join(parts))       # onetwothree
print(" | ".join(parts))    # one | two | three

# join only accepts str items — use a generator to convert:
nums = [1, 2, 3]
print(", ".join(str(n) for n in nums))   # 1, 2, 3`,
    explanation: "Always use join() to build strings from a list — it's O(n) and far more readable than repeated +=.",
  },
  {
    id: "py-bool-as-int",
    language: "python",
    title: "bool is a subtype of int",
    tag: "snippet",
    code: `# bool is a subclass of int: True == 1, False == 0.
print(True + True)    # 2
print(False * 99)     # 0
print(True > False)   # True (1 > 0)

# Idiomatic: count items that match a predicate.
data = [1, -3, 4, -7, 2, -1]
negatives = sum(x < 0 for x in data)   # bool-as-int
print(negatives)   # 3`,
    explanation: "Because bool inherits from int, you can use conditions directly in arithmetic. Handy for compact counting — sum(cond for x in xs).",
  },
  {
    id: "py-divmod-builtin",
    language: "python",
    title: "divmod() — quotient and remainder",
    tag: "snippet",
    code: `# divmod(a, b) returns (a // b, a % b) in one step.
q, r = divmod(17, 5)
print(q, r)   # 3 2

# Classic use-case: convert seconds to h:m:s.
def fmt_time(secs):
    m, s = divmod(secs, 60)
    h, m = divmod(m, 60)
    return f"{h:02d}:{m:02d}:{s:02d}"

print(fmt_time(3661))   # 01:01:01`,
    explanation: "divmod avoids computing quotient and remainder separately. Python's // and % satisfy the invariant: a == (a//b)*b + (a%b) for all non-zero b.",
  },
  {
    id: "py-is-vs-eq",
    language: "python",
    title: "'is' vs '=='",
    tag: "understanding",
    code: `a = [1, 2, 3]
b = [1, 2, 3]
c = a

print(a == b)   # True  — same value
print(a is b)   # False — different objects
print(a is c)   # True  — c points to the SAME list

# 'is' only makes sense for singletons:
x = None
print(x is None)     # correct
print(x is not None) # correct

# == calls __eq__; is compares object identity (id()).`,
    explanation: "'is' checks identity — it's only appropriate for None, True, False, and intentional singletons. Always use == for value equality.",
  },
  {
    id: "py-loop-else",
    language: "python",
    title: "for/else — the no-break clause",
    tag: "understanding",
    code: `# The 'else' on a for/while runs ONLY if the loop finished without 'break'.
def find_factor(n):
    for i in range(2, n):
        if n % i == 0:
            print(f"{n} = {i} * {n // i}")
            break
    else:
        print(f"{n} is prime")

find_factor(12)   # 12 = 2 * 6
find_factor(13)   # 13 is prime`,
    explanation: "Useful for search loops where you want to take action when nothing was found — without a separate 'found' flag variable.",
  },
  {
    id: "py-tuple-single",
    language: "python",
    title: "Single-element tuple needs a comma",
    tag: "understanding",
    code: `# Parentheses alone do NOT create a tuple.
not_a_tuple = (42)
is_a_tuple  = (42,)    # trailing comma is required
also_tuple  = 42,      # parentheses are optional for tuple packing

print(type(not_a_tuple))   # <class 'int'>
print(type(is_a_tuple))    # <class 'tuple'>
print(type(also_tuple))    # <class 'tuple'>

# Common mistake in return statements and comprehensions.`,
    explanation: "It's the comma that makes a tuple, not the parentheses. This trips people up most often in single-element return values and default args.",
  },
  {
    id: "py-bool-subclass",
    language: "python",
    title: "bool is a subclass of int",
    tag: "understanding",
    code: `print(isinstance(True, int))   # True
print(isinstance(False, int))  # True

# True sorts before 1 (same value); False sorts before True.
mixed = [2, True, False, 1, 0]
print(sorted(mixed))   # [False, 0, True, 1, 2]  — 0==False, 1==True

# Surprising: True == 1 and False == 0 in dict keys.
d = {True: "a", 1: "b"}
print(d)    # {True: 'b'} — 1 and True are the SAME key`,
    explanation: "bool's int inheritance causes surprising behaviour in dicts and sorted() when mixing booleans with integers. Know it, don't rely on it.",
  },
  {
    id: "py-chainmap",
    language: "python",
    title: "ChainMap — layered lookups",
    tag: "structures",
    code: `from collections import ChainMap

defaults   = {"color": "blue",  "size": "M"}
user_prefs = {"color": "red"}

# ChainMap searches dicts left-to-right; first match wins.
combined = ChainMap(user_prefs, defaults)
print(combined["color"])   # red    — user_prefs wins
print(combined["size"])    # M      — falls through to defaults

# Writes always go to the FIRST map.
combined["weight"] = "light"
print(user_prefs)  # {'color': 'red', 'weight': 'light'}`,
    explanation: "ChainMap is perfect for config layering (CLI args → env vars → config file → defaults) without copying or merging dicts.",
  },
  {
    id: "py-bytearray",
    language: "python",
    title: "bytearray — mutable bytes",
    tag: "structures",
    code: `# bytes: immutable sequence of ints 0-255.
# bytearray: mutable version — modify bytes in place.

data = bytearray(b"hello")
data[0] = ord("H")          # in-place byte mutation
data.extend(b" world")
print(bytes(data))           # b'Hello world'

# bytes is hashable (dict key); bytearray is not.
print(hash(b"test"))         # some integer
# hash(bytearray(b"test"))   # TypeError`,
    explanation: "Use bytearray when you need to build or modify binary data incrementally (e.g., constructing network packets or editing binary files).",
  },
  {
    id: "py-queue-module",
    language: "python",
    title: "queue.Queue — thread-safe FIFO",
    tag: "structures",
    code: `from queue import Queue
import threading

q = Queue(maxsize=5)

def producer():
    for i in range(3):
        q.put(f"task-{i}")   # blocks if full

def consumer():
    while True:
        item = q.get()        # blocks if empty
        print("got:", item)
        q.task_done()
        if item == "task-2": break

t = threading.Thread(target=consumer)
t.start()
producer()
q.join()   # wait until all task_done() calls match puts`,
    explanation: "queue.Queue handles locking internally — the safe choice for producer-consumer threading. For single-thread FIFO, collections.deque is faster.",
  },
  {
    id: "py-typed-dict",
    language: "python",
    title: "TypedDict — typed dict schema",
    tag: "structures",
    code: `from typing import TypedDict

# TypedDict defines a dict with known key names and value types.
# Useful for annotating JSON-shaped data without full dataclasses.
class Movie(TypedDict):
    title: str
    year: int
    rating: float

film: Movie = {"title": "Dune", "year": 2021, "rating": 8.0}
print(film["title"])   # Dune

# Type checkers enforce keys and types; at runtime it's a plain dict.
print(type(film))      # <class 'dict'>`,
    explanation: "TypedDict gives you type-checker benefits on plain dicts — great for JSON from APIs. Unlike dataclass, no runtime overhead or attribute syntax.",
  },
  {
    id: "py-augmented-immutable",
    language: "python",
    title: "+= on immutables rebinds, not mutates",
    tag: "caveats",
    code: `# += on an immutable REBINDS the variable — doesn't mutate the object.
x = 5
old_id = id(x)
x += 1
print(id(x) == old_id)   # False — x now points to a new int object

# += on a mutable mutates IN PLACE — id stays the same.
lst = [1, 2]
old_id = id(lst)
lst += [3]               # calls lst.__iadd__([3])
print(id(lst) == old_id) # True — same list object
print(lst)               # [1, 2, 3]`,
    explanation: "Immutable types (int, str, tuple) can never change after creation. += creates a new object and rebinds the name, which can surprise callers holding the old reference.",
  },
  {
    id: "py-global-local",
    language: "python",
    title: "UnboundLocalError from shadowed global",
    tag: "caveats",
    code: `x = 10

def bad():
    # Any assignment to 'x' inside a function makes it LOCAL for the whole body.
    print(x)   # UnboundLocalError: referenced before assignment
    x = 20

# Fix 1: don't assign to the same name (use a different local name).
def good():
    local_x = x + 5
    print(local_x)   # 15

good()

# Fix 2: declare 'global x' (usually a design smell — avoid if possible).`,
    explanation: "Python decides at compile time whether a variable is local or global based on whether it's assigned anywhere in the function. Reading before assigning a local raises UnboundLocalError.",
  },
  {
    id: "py-int-truncation",
    language: "python",
    title: "int() truncates, doesn't round",
    tag: "caveats",
    code: `# int() truncates toward zero — it does NOT round.
print(int(2.9))    # 2
print(int(-2.9))   # -2  (toward zero, NOT -3)

# Use the right function for what you actually mean:
import math
print(round(2.5))          # 2  — banker's rounding (round half to even)
print(round(3.5))          # 4
print(math.floor(-2.9))    # -3 — floor rounds toward -infinity
print(math.ceil(2.1))      # 3  — ceil rounds toward +infinity
print(math.trunc(-2.9))    # -2 — same as int()`,
    explanation: "int() and math.trunc() both truncate toward zero. floor() and ceil() round toward negative and positive infinity respectively — different results for negatives.",
  },
  {
    id: "py-nan-comparison",
    language: "python",
    title: "NaN is never equal to anything",
    tag: "caveats",
    code: `import math

nan = float("nan")

# NaN compares unequal to everything — including itself.
print(nan == nan)   # False
print(nan != nan)   # True
print(nan < 0)      # False
print(nan > 0)      # False

# Only reliable check:
print(math.isnan(nan))   # True

# In numpy: use np.isnan() — same semantics.`,
    explanation: "IEEE 754 defines NaN as 'not comparable'. nan != nan is the classic test but math.isnan() is clearer. Watch for NaN silently propagating through calculations.",
  },
  {
    id: "py-bytes-type",
    language: "python",
    title: "bytes — immutable byte sequence",
    tag: "types",
    code: `data = b"hello"
print(data[0])       # 104  — an int, not a character
print(data[1:3])     # b'el' — slice returns bytes
print(len(data))     # 5

# Encode str → bytes; decode bytes → str.
encoded = "café".encode("utf-8")
print(encoded)                   # b'caf\\xc3\\xa9'
print(encoded.decode("utf-8"))   # café

# hex representation:
print(encoded.hex())   # 636166c3a9`,
    explanation: "bytes is the boundary type between text and binary. Always specify the encoding explicitly — never rely on the platform default.",
  },
  {
    id: "py-literal-type",
    language: "python",
    title: "Literal types",
    tag: "types",
    code: `from typing import Literal

# Literal restricts a parameter to a specific set of constant values.
def set_align(align: Literal["left", "center", "right"]) -> None:
    print(f"align={align}")

set_align("left")     # OK
set_align("center")   # OK
# set_align("top")    # type error at check time

# Also useful for status codes, mode flags, direction strings.
Direction = Literal["N", "S", "E", "W"]`,
    explanation: "Literal makes magic-string APIs type-safe. Type checkers flag any call with an unlisted value — no separate enum needed.",
  },
  {
    id: "py-callable-type",
    language: "python",
    title: "Callable[[Args], Return] type hint",
    tag: "types",
    code: `from typing import Callable

# Callable[[ArgType, ...], ReturnType] annotates function arguments.
def apply(func: Callable[[int, int], int], a: int, b: int) -> int:
    return func(a, b)

print(apply(lambda x, y: x + y, 3, 4))  # 7
print(apply(max, 3, 4))                  # 4

# No-arg: Callable[[], None]
# Any signature: Callable[..., int]`,
    explanation: "Callable type hints document what shape of function a parameter expects. Useful for higher-order functions and callbacks.",
  },
  {
    id: "py-final-type",
    language: "python",
    title: "Final — prevent reassignment",
    tag: "types",
    code: `from typing import Final

MAX_SIZE: Final = 100
PI: Final[float] = 3.14159

# Type checkers flag any attempt to reassign:
# MAX_SIZE = 200  # error: cannot assign to final variable

# @final on a method prevents overriding in subclasses:
from typing import final

class Base:
    @final
    def must_not_override(self) -> None:
        print("base implementation")`,
    explanation: "Final is a hint for static analysers only — Python doesn't enforce it at runtime. Combine with @final on methods to signal a sealed override chain.",
  },
  {
    id: "py-abc-vs-protocol",
    language: "python",
    title: "ABC vs Protocol",
    tag: "families",
    code: `from abc import ABC, abstractmethod
from typing import Protocol

# ABC: NOMINAL — subclass must explicitly inherit to satisfy.
class Drawable(ABC):
    @abstractmethod
    def draw(self) -> None: ...

# Protocol: STRUCTURAL — any class with the right method qualifies.
class Renderable(Protocol):
    def draw(self) -> None: ...

class Widget:           # inherits nothing
    def draw(self): print("drawing")

# Widget fails isinstance(_, Drawable) but satisfies Renderable structurally.
# Use Protocol for duck-typed code; ABC when you own the hierarchy.`,
    explanation: "Protocol is structural ('has the shape'), ABC is nominal ('inherits the class'). Protocol is preferred in library code that accepts third-party types.",
  },
  {
    id: "py-str-vs-bytes",
    language: "python",
    title: "str vs bytes",
    tag: "families",
    code: `# str: Unicode text — abstract characters, no encoding stored.
# bytes: raw byte sequences — interpretation depends on the encoding.
text: str   = "hello"
raw:  bytes = b"hello"

# Encode at the boundary (file, network):
encoded = text.encode("utf-8")   # str → bytes
decoded = encoded.decode("utf-8") # bytes → str
assert decoded == text

# Rule: work with str internally; encode as late and decode as early as possible.`,
    explanation: "Mixing str and bytes raises TypeError. The correct model: your program lives in str-land; encoding/decoding happens only at I/O boundaries.",
  },
  {
    id: "py-range-vs-list",
    language: "python",
    title: "range vs list for iteration",
    tag: "families",
    code: `import sys

r   = range(10_000_000)
lst = list(range(10_000_000))

print(sys.getsizeof(r))     # 48   — constant size
print(sys.getsizeof(lst))   # ~80 MB proportional to n

# range supports O(1) membership and indexing:
print(999_999 in r)          # True  — no linear scan
print(r[500_000])            # 500000 — O(1) index

# Use list(range(n)) only when you need mutation or multiple passes.`,
    explanation: "range is a lazy sequence with O(1) size, membership, and indexing. Convert to list only when you genuinely need a mutable copy.",
  },
  {
    id: "py-generator-vs-list",
    language: "python",
    title: "Generator expression vs list comprehension",
    tag: "families",
    code: `import sys

lst = [x * x for x in range(10)]    # materialised immediately
gen = (x * x for x in range(10))    # lazy — nothing computed yet

print(sys.getsizeof(lst))   # ~184 bytes
print(sys.getsizeof(gen))   # 112 bytes — constant regardless of size

total = sum(gen)
print(total)                # 285

# After exhaustion the generator yields nothing:
print(list(gen))            # [] — already consumed`,
    explanation: "Generator expressions are single-use, constant-memory iterators. Use them in sum(), max(), any(), all(). Switch to list when you need multiple passes or random access.",
  },
  {
    id: "py-dunder-str-repr",
    language: "python",
    title: "__repr__ vs __str__",
    tag: "classes",
    code: `class Point:
    def __init__(self, x, y):
        self.x, self.y = x, y

    # __repr__: unambiguous, for developers — ideally looks like a constructor.
    def __repr__(self):
        return f"Point({self.x!r}, {self.y!r})"

    # __str__: human-readable, for end users. Falls back to __repr__ if absent.
    def __str__(self):
        return f"({self.x}, {self.y})"

p = Point(3, 4)
print(repr(p))   # Point(3, 4)
print(str(p))    # (3, 4)
print(p)         # (3, 4) — print() calls str()`,
    explanation: "Always implement __repr__; implement __str__ only when you need a user-friendly display that differs. Containers like list call repr() on their items.",
  },
  {
    id: "py-reversed-builtin",
    language: "python",
    title: "reversed() — lazy reverse iterator",
    tag: "snippet",
    code: `items = [10, 20, 30, 40, 50]

# reversed() returns a lazy iterator — no copy built.
for x in reversed(items):
    print(x, end=" ")   # 50 40 30 20 10

# Get a reversed list when you need one:
print(list(reversed(items)))  # [50, 40, 30, 20, 10]
print(items[::-1])            # [50, 40, 30, 20, 10] — same result via slice

# Also works on strings:
print("".join(reversed("hello")))  # olleh`,
    explanation: "reversed() avoids the copy that [::-1] creates. Use it in for loops; convert with list() only when a reversed list is genuinely needed.",
  },
  {
    id: "py-print-sep-end",
    language: "python",
    title: "print() sep and end",
    tag: "snippet",
    code: `# sep (default ' ') controls the separator between arguments.
print("a", "b", "c")               # a b c
print("a", "b", "c", sep=", ")     # a, b, c
print("a", "b", "c", sep="")       # abc

# end (default '\\n') controls the trailing character.
for i in range(4):
    print(i, end=" ")   # 0 1 2 3 (on one line)
print()                 # emit the newline manually`,
    explanation: "sep and end cover most custom-formatting needs without string formatting. Combine with flush=True when you need real-time terminal updates.",
  },
  {
    id: "py-in-operator",
    language: "python",
    title: "'in' operator performance",
    tag: "snippet",
    code: `# 'in' performance depends entirely on the container type.
# list / tuple: O(n) — linear scan
# set / frozenset: O(1) — hash lookup
# dict: O(1) — hash lookup on keys

items = list(range(10_000))
items_set = set(items)

# Repeated membership tests? Convert to set first.
to_find = [9_999, 5_000, 1]
found = [x for x in to_find if x in items_set]   # all O(1)`,
    explanation: "The 'in' operator delegates to __contains__. For repeated lookups on a list, converting to a set first is often a 100x+ speedup.",
  },
  {
    id: "py-abs-round",
    language: "python",
    title: "abs() and round()",
    tag: "snippet",
    code: `print(abs(-7))           # 7
print(abs(-3.14))        # 3.14
print(abs(3 + 4j))       # 5.0 — complex magnitude

# round(x, ndigits): rounds to n decimal places.
print(round(3.14159, 2)) # 3.14
print(round(3.14159, 0)) # 3.0

# Banker's rounding (round-half-to-even):
print(round(0.5))        # 0
print(round(1.5))        # 2
print(round(2.5))        # 2
print(round(3.5))        # 4`,
    explanation: "Python's round() uses banker's rounding — .5 rounds to the nearest even digit. This minimises cumulative bias over many rounding operations.",
  },
  {
    id: "py-shallow-copy",
    language: "python",
    title: "Shallow vs deep copy",
    tag: "understanding",
    code: `import copy

original = [[1, 2], [3, 4]]

# Shallow copy: new outer container, but inner objects are SHARED.
shallow = original.copy()   # or original[:]
shallow.append([5, 6])      # doesn't affect original (different outer list)
shallow[0].append(99)       # DOES affect original — shared inner list

print(original)   # [[1, 2, 99], [3, 4]]

# Deep copy: fully independent tree.
deep = copy.deepcopy(original)
deep[0].append(0)
print(original)   # [[1, 2, 99], [3, 4]] — unchanged`,
    explanation: "Shallow copy duplicates only the outermost container. For nested structures, use copy.deepcopy() to get a fully independent clone.",
  },
  {
    id: "py-class-var-instance",
    language: "python",
    title: "Class variable vs instance variable",
    tag: "understanding",
    code: `class Counter:
    count = 0    # class variable — shared by all instances

    def __init__(self):
        Counter.count += 1
        self.id = Counter.count   # instance variable — unique to self

a = Counter()
b = Counter()
print(Counter.count)   # 2
print(a.id, b.id)      # 1 2

# Trap: self.count = x creates an INSTANCE attribute that SHADOWS the class var.
a.count = 99   # doesn't touch Counter.count
print(Counter.count)  # still 2`,
    explanation: "Class variables are shared state. Assigning through self shadows the class variable with an instance variable for that specific object.",
  },
  {
    id: "py-string-intern",
    language: "python",
    title: "String interning",
    tag: "understanding",
    code: `# CPython interns short strings that look like identifiers.
a = "hello"
b = "hello"
print(a is b)    # True — interned, same object

# Strings with spaces / special chars may NOT be interned.
c = "hello world"
d = "hello world"
print(c is d)    # False (or True — implementation-defined)

# sys.intern() forces interning when you want guaranteed identity:
import sys
e = sys.intern("hello world")
f = sys.intern("hello world")
print(e is f)    # True`,
    explanation: "Interning is an optimisation detail, not a guarantee. Never test string equality with 'is' — always use ==.",
  },
  {
    id: "py-del-vs-remove",
    language: "python",
    title: "del vs list.remove() vs list.pop()",
    tag: "understanding",
    code: `lst = [10, 20, 30, 20, 40]

# remove(x): removes first occurrence by VALUE — O(n).
lst.remove(20)
print(lst)   # [10, 30, 20, 40]

# del lst[i]: removes by INDEX — O(n) due to shifting.
del lst[1]
print(lst)   # [10, 20, 40]

# pop(i): removes by index AND returns the value.
val = lst.pop(-1)    # -1 = last element
print(val, lst)      # 40 [10, 20]

# pop() with no index removes the LAST element — O(1).`,
    explanation: "remove() searches by value; del and pop() work by index. pop() is O(1) only at the end — anywhere else it's O(n) due to shifting.",
  },
  {
    id: "py-struct-pack",
    language: "python",
    title: "struct — binary data packing",
    tag: "structures",
    code: `import struct

# Format: '>' = big-endian, 'I' = unsigned int (4 bytes), 'f' = float (4 bytes).
packed = struct.pack(">If", 42, 3.14)
print(packed)         # b'\\x00\\x00\\x00*@H\\xf5\\xc3'

unpacked = struct.unpack(">If", packed)
print(unpacked)       # (42, 3.140000104904175)

# calcsize() tells you byte length of a format string:
print(struct.calcsize(">If"))   # 8`,
    explanation: "struct is essential for binary protocols (network packets, file formats). Always specify endianness explicitly — '<' little-endian, '>' big-endian.",
  },
  {
    id: "py-fractions-type",
    language: "python",
    title: "fractions.Fraction — exact rationals",
    tag: "types",
    code: `from fractions import Fraction

# Fraction stores exact rational numbers — no floating-point rounding.
a = Fraction(1, 3)
b = Fraction(1, 6)
print(a + b)               # 1/2  — exact
print(float(a + b))        # 0.5

# Build from float reveals the exact decimal representation:
print(Fraction(0.1))       # 5764607523034235/57646075230342348

# Build from string for a clean result:
print(Fraction("0.1"))     # 1/10`,
    explanation: "Fraction is for exact rational arithmetic where floats are too imprecise and Decimal's fixed precision isn't flexible enough.",
  },
  {
    id: "py-type-alias",
    language: "python",
    title: "Type aliases",
    tag: "types",
    code: `# Python 3.12+: 'type' keyword creates an explicit alias.
type Vector = list[float]

def scale(v: Vector, factor: float) -> Vector:
    return [x * factor for x in v]

print(scale([1.0, 2.0, 3.0], 2.0))   # [2.0, 4.0, 6.0]

# Pre-3.12 style (still valid):
from typing import TypeAlias
Matrix: TypeAlias = list[list[float]]`,
    explanation: "Type aliases document intent — Vector reads better than list[float] in signatures. The 'type' keyword (3.12+) makes aliases explicit and avoids ambiguity.",
  },
  {
    id: "py-isinstance-union",
    language: "python",
    title: "isinstance() with multiple types",
    tag: "types",
    code: `# isinstance(obj, (T1, T2, ...)) checks against any of the types.
def handle(value):
    if isinstance(value, (int, float)):
        return f"number: {value}"
    elif isinstance(value, str):
        return f"text: {value!r}"
    return "other"

print(handle(42))      # number: 42
print(handle(3.14))    # number: 3.14
print(handle("hi"))    # text: 'hi'

# Python 3.10+: isinstance(value, int | float) also works.`,
    explanation: "Passing a tuple to isinstance() avoids chained 'or' checks and reads more like a type signature.",
  },
  {
    id: "py-annotated-type",
    language: "python",
    title: "Annotated — typed with metadata",
    tag: "types",
    code: `from typing import Annotated

# Annotated[T, metadata] attaches arbitrary metadata to a type.
# Type checkers treat it as T; libraries like Pydantic use the metadata.
Positive = Annotated[int, "must be positive"]
Email    = Annotated[str, "valid email"]

def create_user(age: Positive, email: Email) -> dict:
    return {"age": age, "email": email}

# At runtime Annotated is transparent — no enforcement by Python itself.
import typing
args = typing.get_args(Positive)
print(args)   # (int, 'must be positive')`,
    explanation: "Annotated lets you embed validation metadata, units of measure, or UI hints directly in type signatures for frameworks that introspect annotations.",
  },
  {
    id: "py-enum-families",
    language: "python",
    title: "Enum vs IntEnum vs Flag",
    tag: "families",
    code: `from enum import Enum, IntEnum, Flag, auto

# Enum: symbolic names. No integer arithmetic.
class Color(Enum):
    RED = 1; GREEN = 2; BLUE = 3

# IntEnum: integers — can pass where ints are expected.
class Priority(IntEnum):
    LOW = 1; MEDIUM = 2; HIGH = 3

print(Priority.HIGH > Priority.LOW)  # True — int comparison works

# Flag: combinable with bitwise ops.
class Perm(Flag):
    R = auto(); W = auto(); X = auto()

rw = Perm.R | Perm.W
print(Perm.R in rw)   # True`,
    explanation: "Choose Enum for pure symbolic constants, IntEnum when you need to compare or pass as integers, and Flag for combinable bit-mask permissions.",
  },
  {
    id: "py-classmethod-staticmethod",
    language: "python",
    title: "classmethod vs staticmethod",
    tag: "families",
    code: `class Date:
    def __init__(self, y, m, d):
        self.year, self.month, self.day = y, m, d

    @classmethod
    def from_string(cls, s: str) -> "Date":
        # cls = the class itself — subclass-friendly (polymorphic).
        y, m, d = map(int, s.split("-"))
        return cls(y, m, d)

    @staticmethod
    def is_valid(y: int, m: int, d: int) -> bool:
        # No implicit first arg — plain utility function scoped to the class.
        return 1 <= m <= 12 and 1 <= d <= 31

print(Date.from_string("2024-06-15").year)  # 2024
print(Date.is_valid(2024, 13, 1))           # False`,
    explanation: "classmethod receives the class (supports subclassing); staticmethod receives nothing — it's a regular function namespaced under the class.",
  },
  {
    id: "py-property-getter-setter",
    language: "python",
    title: "@property getter / setter",
    tag: "families",
    code: `class Temperature:
    def __init__(self, celsius: float):
        self._c = celsius

    @property
    def celsius(self) -> float:
        return self._c

    @celsius.setter
    def celsius(self, value: float):
        if value < -273.15:
            raise ValueError("below absolute zero")
        self._c = value

    @property
    def fahrenheit(self) -> float:   # read-only computed property
        return self._c * 9 / 5 + 32

t = Temperature(0)
print(t.fahrenheit)   # 32.0
t.celsius = 100
print(t.fahrenheit)   # 212.0`,
    explanation: "@property lets you add validation and computed attributes without changing the calling API. Callers still write t.celsius = x, not t.set_celsius(x).",
  },
  {
    id: "py-functools-partial",
    language: "python",
    title: "functools.partial",
    tag: "families",
    code: `from functools import partial

def power(base, exp):
    return base ** exp

# partial freezes some arguments, producing a new callable.
square = partial(power, exp=2)
cube   = partial(power, exp=3)

print(square(5))   # 25
print(cube(3))     # 27

# Useful with map():
print(list(map(partial(power, exp=2), [1, 2, 3, 4])))   # [1, 4, 9, 16]

# parse binary strings:
parse_bin = partial(int, base=2)
print(parse_bin("1010"))   # 10`,
    explanation: "partial is cleaner than a wrapping lambda when you only need to fix some arguments. It also preserves the docstring and __name__ of the original.",
  },
  {
    id: "py-slots-memory",
    language: "python",
    title: "__slots__ reduces memory",
    tag: "classes",
    code: `import sys

class PointDict:
    def __init__(self, x, y):
        self.x = x; self.y = y   # backed by __dict__

class PointSlots:
    __slots__ = ("x", "y")       # no per-instance __dict__
    def __init__(self, x, y):
        self.x = x; self.y = y

pd = PointDict(1, 2)
ps = PointSlots(1, 2)

print(sys.getsizeof(pd.__dict__))  # ~232 bytes
print(sys.getsizeof(ps))           # ~56 bytes

# PointSlots rejects arbitrary attributes:
# ps.z = 3   # AttributeError`,
    explanation: "__slots__ eliminates the per-instance __dict__, saving ~200+ bytes per object. Significant when you create millions of small objects.",
  },
  {
    id: "py-metaclass-basics",
    language: "python",
    title: "Metaclass basics",
    tag: "classes",
    code: `# A metaclass is the 'class of a class' — controls how classes are created.
class SingletonMeta(type):
    _instances: dict = {}
    def __call__(cls, *args, **kwargs):
        if cls not in cls._instances:
            cls._instances[cls] = super().__call__(*args, **kwargs)
        return cls._instances[cls]

class AppConfig(metaclass=SingletonMeta):
    def __init__(self):
        self.debug = False

a = AppConfig()
b = AppConfig()
print(a is b)    # True — same instance every time`,
    explanation: "Metaclasses intercept class creation. Most of the time you don't need them — prefer class decorators or __init_subclass__ for simpler hook-in patterns.",
  },
  {
    id: "py-heappushpop",
    language: "python",
    title: "heapq top-K pattern",
    tag: "structures",
    code: `import heapq

# Keep the K largest items seen so far using a min-heap of size K.
# heapreplace: pop smallest then push — maintains heap invariant.
top_k = []
k = 3

for n in [4, 9, 2, 7, 1, 8, 3, 6]:
    if len(top_k) < k:
        heapq.heappush(top_k, n)
    elif n > top_k[0]:          # n is larger than current minimum
        heapq.heapreplace(top_k, n)

print(sorted(top_k))   # [7, 8, 9]`,
    explanation: "A min-heap of size K gives you the top-K largest values in O(n log K) time without sorting all n elements. heapreplace is slightly faster than heappop+heappush.",
  },
  {
    id: "py-class-attr-shadow",
    language: "python",
    title: "Class attribute shadowed by instance attribute",
    tag: "caveats",
    code: `class Config:
    debug = False    # class-level default

    def enable(self):
        self.debug = True   # creates an INSTANCE attr; class attr unchanged

c1 = Config()
c2 = Config()
c1.enable()

print(c1.debug)      # True   — instance attribute
print(c2.debug)      # False  — still reading class attribute
print(Config.debug)  # False  — class attribute untouched

# To change the default for all instances: Config.debug = True`,
    explanation: "Instance attribute assignment creates a new attribute on the instance that shadows the class attribute only for that instance. Other instances and the class itself are unaffected.",
  },
  {
    id: "py-zero-division",
    language: "python",
    title: "ZeroDivisionError for // and %",
    tag: "caveats",
    code: `# All division operators raise ZeroDivisionError for integer zero divisors.
try:
    print(10 / 0)    # ZeroDivisionError
except ZeroDivisionError:
    print("/ raised")

try:
    print(10 // 0)   # ZeroDivisionError — NOT 0 or infinity
except ZeroDivisionError:
    print("// raised")

try:
    print(10 % 0)    # ZeroDivisionError
except ZeroDivisionError:
    print("% raised")

# Float also raises: 1.0 / 0.0 → ZeroDivisionError (unlike C).`,
    explanation: "Python raises ZeroDivisionError for all division-by-zero cases, including // and %. Unlike C, float division by zero does not silently produce infinity.",
  },
  {
    id: "py-except-bare",
    language: "python",
    title: "Never use bare except:",
    tag: "caveats",
    code: `# Bare 'except:' catches BaseException — including SystemExit,
# KeyboardInterrupt, and MemoryError. Almost always wrong.

# BAD:
# try:
#     risky_call()
# except:          # swallows Ctrl+C, out-of-memory, SystemExit
#     pass

# BETTER: catch a specific type.
try:
    int("not a number")
except ValueError as e:
    print(f"caught: {e}")

# If you truly need all application errors: 'except Exception:'
# (doesn't catch BaseException subclasses like KeyboardInterrupt)`,
    explanation: "Bare except is an anti-pattern that hides bugs and makes programs impossible to interrupt. Always name the exception type you expect.",
  },
  {
    id: "py-recursive-default",
    language: "python",
    title: "Mutable default accumulates across calls",
    tag: "caveats",
    code: `# The default list is evaluated ONCE — every call shares the same object.
def make_path(name, path=[]):
    path.append(name)
    return path

print(make_path("a"))   # ['a']
print(make_path("b"))   # ['a', 'b'] — not ['b']!

# Fix: use None as a sentinel and create a fresh list inside.
def make_path_fixed(name, path=None):
    if path is None:
        path = []
    path.append(name)
    return path`,
    explanation: "The same gotcha as py-mutable-default, but shown in the accumulation pattern. Functions with optional list/dict outputs are the most common victims.",
  },
  {
    id: "py-descriptor-protocol",
    language: "python",
    title: "Descriptor protocol",
    tag: "classes",
    code: `# A descriptor defines __get__/__set__/__delete__ and lives as a CLASS attribute.
class Positive:
    def __set_name__(self, owner, name):
        self.name = name

    def __get__(self, obj, objtype=None):
        if obj is None: return self   # accessed on the class
        return getattr(obj, f"_{self.name}")

    def __set__(self, obj, value):
        if value <= 0:
            raise ValueError(f"{self.name} must be positive")
        setattr(obj, f"_{self.name}", value)

class Circle:
    radius = Positive()
    def __init__(self, r): self.radius = r

print(Circle(5).radius)   # 5
# Circle(-1)              # ValueError`,
    explanation: "Descriptors are how @property, staticmethod, and classmethod are implemented. Use them when you need the same validation logic on multiple attributes across multiple classes.",
  },
  {
    id: "py-contextlib-cm",
    language: "python",
    title: "@contextmanager without a class",
    tag: "classes",
    code: `from contextlib import contextmanager
import os

# @contextmanager turns a generator into a context manager —
# no class with __enter__/__exit__ needed.
@contextmanager
def temp_directory(path):
    os.makedirs(path, exist_ok=True)
    try:
        yield path           # value bound by 'as'
    finally:
        import shutil
        shutil.rmtree(path)  # cleanup in __exit__

with temp_directory("/tmp/mytemp") as d:
    print(f"working in {d}")
# directory deleted here`,
    explanation: "yield is the __enter__ return point; code after yield (in the finally) is __exit__. Far less boilerplate than a full class for one-off context managers.",
  },
  {
    id: "py-dunder-hash",
    language: "python",
    title: "__hash__ and __eq__ contract",
    tag: "classes",
    code: `# Rule: if a == b then hash(a) == hash(b) must hold.
# Defining __eq__ sets __hash__ = None (unhashable) unless you define both.
class Point:
    def __init__(self, x, y):
        self.x, self.y = x, y

    def __eq__(self, other):
        return (self.x, self.y) == (other.x, other.y)

    def __hash__(self):
        return hash((self.x, self.y))   # hash the same fields used in __eq__

p1, p2 = Point(1, 2), Point(1, 2)
print(p1 == p2)                # True
print(hash(p1) == hash(p2))    # True
print(len({p1, p2}))           # 1 — treated as one key in a set`,
    explanation: "Python forces you to opt-in to hashability when you define __eq__ to prevent broken behaviour in sets and dicts.",
  },
  {
    id: "py-weakref-basics",
    language: "python",
    title: "weakref — non-owning reference",
    tag: "classes",
    code: `import weakref

# A weak reference doesn't increment the reference count.
# The object can be garbage-collected even while the weak ref exists.
class Resource:
    def __init__(self, name): self.name = name
    def __del__(self): print(f"{self.name} collected")

r = Resource("conn")
ref = weakref.ref(r)
print(ref())      # <Resource ...> — alive

del r             # refcount → 0 → collected (prints "conn collected")
print(ref())      # None — referent is gone`,
    explanation: "Weak references are used for caches and observer patterns that shouldn't keep objects alive. weakref.WeakValueDictionary auto-removes entries when values die.",
  },
  {
    id: "py-custom-exception",
    language: "python",
    title: "Custom exception with context",
    tag: "classes",
    code: `# Subclass Exception (not BaseException) for application errors.
# Add attributes to carry rich error context.
class InsufficientFundsError(Exception):
    def __init__(self, amount: float, balance: float):
        super().__init__(f"Need {amount:.2f}, have {balance:.2f}")
        self.amount  = amount
        self.balance = balance

def withdraw(amount, balance):
    if amount > balance:
        raise InsufficientFundsError(amount, balance)
    return balance - amount

try:
    withdraw(100, 30)
except InsufficientFundsError as e:
    print(e)           # Need 100.00, have 30.00
    print(e.balance)   # 30`,
    explanation: "Custom exceptions with fields are much easier to handle programmatically than parsing error message strings. Always subclass the most specific applicable base.",
  },
  {
    id: "py-async-gen",
    language: "python",
    title: "Async generators",
    tag: "families",
    code: `import asyncio

# Async generators combine 'async def' and 'yield' — values produced asynchronously.
async def ticker(delay: float, count: int):
    for i in range(count):
        await asyncio.sleep(delay)
        yield i

async def main():
    # Consume with 'async for'.
    async for tick in ticker(0.01, 3):
        print(tick)   # 0, 1, 2

asyncio.run(main())`,
    explanation: "Async generators are the async equivalent of sync generators — lazy, memory-efficient producers for async pipelines. Consumed with 'async for'.",
  },
  {
    id: "py-abstract-property",
    language: "python",
    title: "Abstract properties",
    tag: "classes",
    code: `from abc import ABC, abstractmethod

class Shape(ABC):
    @property
    @abstractmethod
    def area(self) -> float: ...

    @property
    @abstractmethod
    def perimeter(self) -> float: ...

class Square(Shape):
    def __init__(self, side): self.side = side

    @property
    def area(self): return self.side ** 2

    @property
    def perimeter(self): return 4 * self.side

s = Square(5)
print(s.area, s.perimeter)   # 25 20`,
    explanation: "Stack @property above @abstractmethod. Subclasses must use @property to override — they can't just define a plain method for an abstract property.",
  },
  {
    id: "py-mixin",
    language: "python",
    title: "Mixin pattern",
    tag: "classes",
    code: `# Mixins add orthogonal behaviour without a deep inheritance hierarchy.
class LogMixin:
    def log(self, msg: str) -> None:
        print(f"[{type(self).__name__}] {msg}")

class JsonMixin:
    def to_dict(self) -> dict:
        return {k: v for k, v in vars(self).items() if not k.startswith("_")}

class User(LogMixin, JsonMixin):
    def __init__(self, name: str, age: int):
        self.name = name
        self.age  = age

u = User("Ada", 36)
u.log("created")         # [User] created
print(u.to_dict())       # {'name': 'Ada', 'age': 36}`,
    explanation: "Mixins are small, focused classes meant to be combined — they don't make sense on their own. They're how Python gets multiple-inheritance right.",
  },
  {
    id: "py-dunder-len-getitem",
    language: "python",
    title: "__len__ and __getitem__",
    tag: "classes",
    code: `# Implementing __len__ + __getitem__ gives: len(), indexing, 'in', and for loops.
class WordList:
    def __init__(self, words):
        self._words = list(words)

    def __len__(self):
        return len(self._words)

    def __getitem__(self, index):
        return self._words[index]

wl = WordList(["alpha", "beta", "gamma"])
print(len(wl))           # 3
print(wl[1])             # beta
print("alpha" in wl)     # True
for w in wl: print(w)    # alpha beta gamma`,
    explanation: "These two dunders are the minimal protocol to make a custom collection feel Pythonic. Python derives iteration and 'in' from __getitem__ automatically.",
  },
  {
    id: "py-init-vs-new",
    language: "python",
    title: "__new__ vs __init__",
    tag: "classes",
    code: `# __new__ creates the object; __init__ initialises it.
# Override __new__ when you need to control the object identity (singletons).
class Singleton:
    _instance = None

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self, value: int):
        self.value = value   # runs every call — overwrites on re-init

a = Singleton(10)
b = Singleton(20)
print(a is b)     # True  — same object
print(a.value)    # 20    — __init__ ran again`,
    explanation: "__new__ is called before __init__. If __new__ returns an existing instance, __init__ still runs on it — guard against double-init if that's unwanted.",
  },
  {
    id: "py-weakref-dict",
    language: "python",
    title: "WeakValueDictionary — self-cleaning cache",
    tag: "structures",
    code: `import weakref

# WeakValueDictionary holds weak references to values.
# Entries disappear automatically when the value is garbage-collected.
cache: weakref.WeakValueDictionary = weakref.WeakValueDictionary()

class Widget:
    def __init__(self, name): self.name = name

w = Widget("button")
cache["btn"] = w
print(len(cache))   # 1

del w               # Widget refcount → 0 → collected
print(len(cache))   # 0 — entry removed automatically`,
    explanation: "WeakValueDictionary is ideal for object caches that shouldn't extend object lifetimes. The cache auto-clears when nothing else references a value.",
  },
  {
    id: "py-struct-dataclass-compare",
    language: "python",
    title: "struct vs dataclass vs NamedTuple",
    tag: "structures",
    code: `import struct
from dataclasses import dataclass
from typing import NamedTuple

# struct.pack: binary wire format — bytes, no Python overhead.
packed = struct.pack("3B", 255, 128, 0)   # RGB as 3 bytes

# NamedTuple: immutable Python object, hashable, tuple-compatible.
class RgbNT(NamedTuple):
    r: int; g: int; b: int

# dataclass: mutable Python object, richer features.
@dataclass
class RgbDC:
    r: int; g: int; b: int

nt = RgbNT(255, 128, 0)
dc = RgbDC(255, 128, 0)
print(nt == dc)    # False — different types`,
    explanation: "struct is for binary serialisation; NamedTuple and dataclass are Python-level containers. Choose by what you'll do with the data, not just how you'll create it.",
  },
  {
    id: "py-collections-userdict",
    language: "python",
    title: "UserDict — safe dict subclass",
    tag: "structures",
    code: `from collections import UserDict

# Subclassing dict directly can cause subtle bugs because C-level dict
# methods may bypass your overrides. UserDict wraps dict safely.
class CaseInsensitiveDict(UserDict):
    def __setitem__(self, key: str, value):
        self.data[key.lower()] = value

    def __getitem__(self, key: str):
        return self.data[key.lower()]

    def __contains__(self, key: str):
        return key.lower() in self.data

d = CaseInsensitiveDict()
d["Content-Type"] = "application/json"
print(d["content-type"])    # application/json
print("CONTENT-TYPE" in d)  # True`,
    explanation: "UserDict's self.data is a plain dict that all built-in dict methods go through — your overrides are always called. Safer starting point than subclassing dict.",
  },
  {
    id: "py-super-mro",
    language: "python",
    title: "super() and the MRO",
    tag: "caveats",
    code: `# Python resolves methods via C3 linearisation (MRO).
# super() calls the NEXT type in the MRO — not necessarily the direct parent.
class A:
    def hello(self): print("A"); super().hello() if hasattr(super(), "hello") else None

class B(A):
    def hello(self): print("B"); super().hello()

class C(A):
    def hello(self): print("C"); super().hello()

class D(B, C):          # MRO: D → B → C → A → object
    def hello(self): print("D"); super().hello()

print([t.__name__ for t in D.__mro__])  # ['D', 'B', 'C', 'A', 'object']
D().hello()   # D B C A — cooperative multi-inheritance`,
    explanation: "super() follows the MRO, not the source inheritance tree. This makes cooperative multiple inheritance work — every class calls super() and they chain correctly.",
  },
  {
    id: "py-chained-assignment",
    language: "python",
    title: "Chained assignment shares objects",
    tag: "caveats",
    code: `# a = b = value — BOTH names point to the SAME object.
a = b = []
a.append(1)
print(b)   # [1] — b is the same list

# For independent lists:
a = []
b = []

# For immutables it's safe — rebinding doesn't affect the other name.
x = y = 5
x += 1     # rebinds x; y stays 5
print(x, y)  # 6 5`,
    explanation: "Chained assignment on a mutable default is an easy way to get aliasing bugs. When in doubt, initialise each name on its own line.",
  },
  {
    id: "py-import-side-effects",
    language: "python",
    title: "Import side-effects run once",
    tag: "caveats",
    code: `import sys

# Module top-level code runs ONCE on first import, then the cached module
# is returned from sys.modules on subsequent imports.
# This makes side effects (prints, file I/O, DB connections) happen exactly once.

# Check if already loaded:
if "json" not in sys.modules:
    import json

# Circular imports: module A imports B which imports A.
# A's module object exists but may be incomplete.
# Fix: move the import inside the function body, or restructure modules.`,
    explanation: "Python modules are singletons cached in sys.modules. Side-effectful module code runs exactly once per process — a source of surprising global state.",
  },
  {
    id: "py-bytes-bytearray-compare",
    language: "python",
    title: "bytes vs bytearray mutability",
    tag: "types",
    code: `# bytes: immutable — dict keys, hash, safe to share.
b = bytes([72, 101, 108, 108, 111])
print(b.decode())      # Hello
print(hash(b))         # valid

# bytearray: mutable — in-place editing, no hash.
ba = bytearray(b"hello")
ba[0] = 72             # 'H' in ASCII
ba += b" world"
print(ba.decode())     # Hello world

# hash(bytearray(b"x"))   # TypeError: unhashable type`,
    explanation: "bytes is for data-in-transit and dict keys; bytearray is for buffer manipulation. They share the same methods except mutation ones.",
  },
  {
    id: "py-none-type",
    language: "python",
    title: "NoneType — Python's null",
    tag: "types",
    code: `# None is the sole instance of NoneType.
print(type(None))         # <class 'NoneType'>
print(None is None)       # True — always use 'is' for None checks

# Functions without return implicitly return None.
def no_return(): pass
print(no_return() is None)   # True

# None is falsy:
print(bool(None))            # False
values = [1, None, 2, None, 3]
non_null = [v for v in values if v is not None]
print(non_null)              # [1, 2, 3]`,
    explanation: "None is Python's null. Its NoneType cannot be instantiated — the singleton is always the same object, which is why 'is None' is guaranteed to work.",
  },
  {
    id: "py-typevar-bound",
    language: "python",
    title: "TypeVar with bound",
    tag: "types",
    code: `from typing import TypeVar

class Animal:
    def speak(self) -> str: return "..."

class Dog(Animal):
    def speak(self) -> str: return "woof"

# bound=Animal: T can be Animal or any subclass.
T = TypeVar("T", bound=Animal)

def make_speak(a: T) -> T:   # return type preserves the exact subtype
    print(a.speak())
    return a

d: Dog = make_speak(Dog())   # type checker knows the return is Dog, not Animal`,
    explanation: "TypeVar(bound=T) lets you write generic functions that preserve the specific subtype in their return annotation — without losing the concrete type.",
  },
  {
    id: "py-dict-ordereddict-equality",
    language: "python",
    title: "dict vs OrderedDict equality",
    tag: "families",
    code: `from collections import OrderedDict

# Since Python 3.7, plain dict preserves insertion order.
# But dict equality is ORDER-INSENSITIVE.
d1 = {"a": 1, "b": 2}
d2 = {"b": 2, "a": 1}
print(d1 == d2)    # True

# OrderedDict equality IS order-sensitive.
od1 = OrderedDict([("a", 1), ("b", 2)])
od2 = OrderedDict([("b", 2), ("a", 1)])
print(od1 == od2)  # False

# Use OrderedDict when order-sensitive equality or move_to_end() is needed.`,
    explanation: "Plain dict preserves order but doesn't compare by order. If order matters for equality testing (e.g. in tests), use OrderedDict.",
  },
  {
    id: "py-functools-reduce",
    language: "python",
    title: "functools.reduce",
    tag: "families",
    code: `from functools import reduce
import operator

nums = [1, 2, 3, 4, 5]

# reduce(f, iter, initial) folds left: f(f(f(f(1,2),3),4),5).
total   = reduce(operator.add, nums)          # 15
product = reduce(operator.mul, nums, 1)       # 120 — initial avoids empty-list error

print(total, product)

# For simple operations, prefer sum/max/min/any/all — more readable.
# Use reduce for custom fold operations not covered by builtins.`,
    explanation: "reduce is the functional left-fold. For common aggregations, the dedicated builtins are clearer and often faster. Reserve reduce for arbitrary binary operations.",
  },
  {
    id: "py-mro-resolution",
    language: "python",
    title: "MRO lookup order",
    tag: "caveats",
    code: `class A: pass
class B(A): pass
class C(A): pass
class D(B, C): pass

# C3 linearisation: each class appears after its derived classes,
# and the order of bases is respected.
print([c.__name__ for c in D.__mro__])
# ['D', 'B', 'C', 'A', 'object']

# Attribute lookup walks this list left to right.
# This is why cooperative super() chains correctly without skipping.`,
    explanation: "Understanding the MRO is essential when using multiple inheritance. Print __mro__ whenever you're unsure which method will be called.",
  },
];



