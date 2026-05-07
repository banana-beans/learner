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
  {
    id: "py-groupby-itertools",
    language: "python",
    title: "itertools.groupby",
    tag: "snippet",
    code: `from itertools import groupby

# groupby groups CONSECUTIVE equal elements — sort first if you want all groups.
data = sorted([("a", 1), ("b", 2), ("a", 3), ("b", 4)], key=lambda x: x[0])

for key, group in groupby(data, key=lambda x: x[0]):
    items = list(group)
    print(f"{key}: {items}")
# a: [('a', 1), ('a', 3)]
# b: [('b', 2), ('b', 4)]`,
    explanation: "groupby yields (key, group-iterator) pairs. The group iterator is consumed lazily — always convert to list() before the next iteration of the outer loop.",
  },
  {
    id: "py-product-itertools",
    language: "python",
    title: "itertools.product — cartesian product",
    tag: "snippet",
    code: `from itertools import product

# product(*iters) is the Cartesian product — all combinations.
for suit, rank in product("SH", range(1, 4)):
    print(f"{rank}{suit}", end=" ")
# 1S 2S 3S 1H 2H 3H

# With repeat= for the same iterable multiple times:
from itertools import product as prod
binary = list(prod([0, 1], repeat=3))
print(binary)
# [(0,0,0),(0,0,1),(0,1,0),(0,1,1),(1,0,0),(1,0,1),(1,1,0),(1,1,1)]`,
    explanation: "product replaces nested for loops. repeat=n is shorthand for product(it, it, ...) n times — useful for generating n-bit combinations.",
  },
  {
    id: "py-combinations-permutations",
    language: "python",
    title: "combinations and permutations",
    tag: "snippet",
    code: `from itertools import combinations, permutations

items = ["A", "B", "C"]

# combinations: no repetition, order doesn't matter.
print(list(combinations(items, 2)))
# [('A', 'B'), ('A', 'C'), ('B', 'C')]

# permutations: no repetition, order DOES matter.
print(list(permutations(items, 2)))
# [('A','B'),('A','C'),('B','A'),('B','C'),('C','A'),('C','B')]`,
    explanation: "combinations(n,r) gives C(n,r) tuples; permutations(n,r) gives P(n,r). Use combinations_with_replacement when repetition is allowed.",
  },
  {
    id: "py-map-filter",
    language: "python",
    title: "map() and filter()",
    tag: "snippet",
    code: `nums = [1, 2, 3, 4, 5, 6]

# map(func, iter): apply func to each element — lazy.
doubled = list(map(lambda x: x * 2, nums))
print(doubled)   # [2, 4, 6, 8, 10, 12]

# filter(pred, iter): keep items where pred returns True — lazy.
evens = list(filter(lambda x: x % 2 == 0, nums))
print(evens)   # [2, 4, 6]

# List comprehensions are usually clearer:
# [x*2 for x in nums]  vs  list(map(...))`,
    explanation: "map() and filter() are fine but list comprehensions are more Pythonic for most cases. Use map/filter when passing them to other higher-order functions.",
  },
  {
    id: "py-reduce-accumulate",
    language: "python",
    title: "itertools.accumulate — running totals",
    tag: "snippet",
    code: `from itertools import accumulate
import operator

data = [1, 2, 3, 4, 5]

# accumulate yields running aggregates.
print(list(accumulate(data)))                       # [1, 3, 6, 10, 15] — prefix sums
print(list(accumulate(data, operator.mul)))         # [1, 2, 6, 24, 120] — running product
print(list(accumulate(data, max)))                  # [1, 2, 3, 4, 5]    — running max`,
    explanation: "accumulate is the scan (prefix reduction) operation. It's faster than computing each prefix sum manually and works with any binary function.",
  },
  {
    id: "py-string-template",
    language: "python",
    title: "string.Template for user-supplied templates",
    tag: "snippet",
    code: `from string import Template

# Template uses $variable or \${variable} syntax.
# Safer than f-strings for user-supplied templates — no arbitrary code execution.
tmpl = Template("Hello, $name! You have $count messages.")
result = tmpl.substitute(name="Ada", count=5)
print(result)   # Hello, Ada! You have 5 messages.

# safe_substitute: leaves $vars as-is if key is missing instead of raising.
partial = Template("Hello, $name! $missing_var")
print(partial.safe_substitute(name="Linus"))  # Hello, Linus! $missing_var`,
    explanation: "Use Template instead of f-strings when the template itself comes from user input or a config file — f-string evaluation can execute arbitrary code.",
  },
  {
    id: "py-re-basics",
    language: "python",
    title: "re module basics",
    tag: "snippet",
    code: `import re

# re.match: anchored at start; re.search: anywhere in string.
print(re.match(r"\d+", "123abc").group())     # 123
print(re.search(r"\d+", "abc123xyz").group()) # 123

# re.findall: list of all matches.
print(re.findall(r"\d+", "10 cats and 20 dogs"))  # ['10', '20']

# Compile for reuse:
pattern = re.compile(r"\b[A-Z][a-z]+\b")
print(pattern.findall("Hello World, from Ada"))   # ['Hello', 'World', 'Ada']`,
    explanation: "Always use raw strings (r'...') for regex patterns to avoid double-escaping backslashes. Compile patterns that are used more than once.",
  },
  {
    id: "py-contextmanager-stack",
    language: "python",
    title: "contextlib.ExitStack",
    tag: "snippet",
    code: `from contextlib import ExitStack

files = ["a.txt", "b.txt", "c.txt"]

# ExitStack manages a dynamic number of context managers.
# All are closed on exit, even if some fail.
with ExitStack() as stack:
    handles = [stack.enter_context(open(f, "w")) for f in files]
    for i, f in enumerate(handles):
        f.write(f"file {i}")
# All three files closed here`,
    explanation: "ExitStack is the solution when you don't know at write time how many context managers you'll need. It's also useful for conditionally enabling context managers.",
  },
  {
    id: "py-dataclass-field",
    language: "python",
    title: "dataclass field() for defaults",
    tag: "snippet",
    code: `from dataclasses import dataclass, field

@dataclass
class Config:
    host: str = "localhost"
    port: int = 5432
    tags: list[str] = field(default_factory=list)   # fresh list per instance
    metadata: dict = field(default_factory=dict)

c1 = Config()
c2 = Config()
c1.tags.append("prod")
print(c1.tags)   # ['prod']
print(c2.tags)   # []  — independent lists`,
    explanation: "Use field(default_factory=...) for mutable defaults in dataclasses. A shared default_factory is called fresh for each instance — no mutable-default-arg trap.",
  },
  {
    id: "py-slots-dataclass",
    language: "python",
    title: "dataclass with __slots__",
    tag: "snippet",
    code: `from dataclasses import dataclass

# slots=True (Python 3.10+): generates __slots__ automatically on a dataclass.
@dataclass(slots=True)
class Point:
    x: float
    y: float

p = Point(1.0, 2.0)
print(p.x, p.y)   # 1.0 2.0
# p.z = 3.0       # AttributeError — no __dict__

import sys
print(sys.getsizeof(p))   # ~56 bytes vs ~232 for regular dataclass`,
    explanation: "slots=True in Python 3.10+ gives you the memory savings of __slots__ with the ergonomics of @dataclass. Requires Python 3.10+.",
  },
  {
    id: "py-dataclass-post-init",
    language: "python",
    title: "dataclass __post_init__",
    tag: "classes",
    code: `from dataclasses import dataclass

@dataclass
class BoundedInt:
    value: int
    lo: int = 0
    hi: int = 100

    def __post_init__(self):
        # Runs after __init__ is generated — good for validation.
        if not (self.lo <= self.value <= self.hi):
            raise ValueError(f"{self.value} not in [{self.lo}, {self.hi}]")

b = BoundedInt(50)
print(b.value)         # 50
# BoundedInt(200)      # ValueError: 200 not in [0, 100]`,
    explanation: "__post_init__ is the hook for validation and derived-field computation in dataclasses. It runs after the auto-generated __init__ sets all fields.",
  },
  {
    id: "py-typing-overload",
    language: "python",
    title: "@overload for multiple call signatures",
    tag: "types",
    code: `from typing import overload

# @overload declares separate type signatures for different call patterns.
# Only the last implementation (without @overload) executes.
@overload
def process(value: int) -> int: ...
@overload
def process(value: str) -> str: ...

def process(value):   # implementation — no annotation needed
    if isinstance(value, int):
        return value * 2
    return value.upper()

print(process(5))       # 10
print(process("hi"))    # HI`,
    explanation: "@overload lets type checkers understand multiple valid call signatures. At runtime only the non-decorated implementation exists — the stubs are stripped out.",
  },
  {
    id: "py-pep695-generics",
    language: "python",
    title: "Type parameter syntax (3.12)",
    tag: "types",
    code: `# Python 3.12+: built-in type parameter syntax — no TypeVar imports.
def first[T](items: list[T]) -> T | None:
    return items[0] if items else None

class Stack[T]:
    def __init__(self) -> None: self._items: list[T] = []
    def push(self, item: T) -> None: self._items.append(item)
    def pop(self) -> T: return self._items.pop()

s: Stack[int] = Stack()
s.push(1)
print(s.pop())   # 1`,
    explanation: "Python 3.12 adds [T] syntax to def and class — no need to import TypeVar. The type parameter is scoped to the function or class definition.",
  },
  {
    id: "py-protocol-runtime",
    language: "python",
    title: "Runtime-checkable Protocol",
    tag: "types",
    code: `from typing import Protocol, runtime_checkable

# @runtime_checkable makes isinstance() work with Protocols.
@runtime_checkable
class Sized(Protocol):
    def __len__(self) -> int: ...

print(isinstance([1, 2, 3], Sized))   # True — lists have __len__
print(isinstance("hello", Sized))     # True — strings have __len__
print(isinstance(42, Sized))          # False — ints don't

# Without @runtime_checkable, isinstance raises TypeError.`,
    explanation: "runtime_checkable Protocols support isinstance() checks at the cost of only checking method existence (not signatures). Use it sparingly — structural typing is the real benefit.",
  },
  {
    id: "py-typevar-constraints",
    language: "python",
    title: "TypeVar with explicit constraints",
    tag: "types",
    code: `from typing import TypeVar

# Constrained TypeVar: T can only be int or str — not float, not list.
Number = TypeVar("Number", int, float)
Text   = TypeVar("Text",   str, bytes)

def double(x: Number) -> Number:
    return x * 2

print(double(5))     # 10
print(double(2.5))   # 5.0
# double([1, 2])     # type error — list not in constraints`,
    explanation: "Constrained TypeVars restrict T to a finite set of types (unlike bound=, which allows any subtype). The return type is the exact type passed in.",
  },
  {
    id: "py-abc-register",
    language: "python",
    title: "ABC.register — virtual subclasses",
    tag: "classes",
    code: `from abc import ABC

class Drawable(ABC): pass

class Widget: pass        # doesn't inherit Drawable

# Register Widget as a virtual subclass of Drawable.
Drawable.register(Widget)

print(isinstance(Widget(), Drawable))   # True
print(issubclass(Widget, Drawable))     # True

# Widget still doesn't inherit any Drawable methods —
# it just passes the isinstance check.`,
    explanation: "register() makes existing classes (including third-party ones) satisfy a protocol check without touching their source code. Useful for adapting legacy code to new ABCs.",
  },
  {
    id: "py-class-getitem",
    language: "python",
    title: "__class_getitem__ for subscript syntax",
    tag: "classes",
    code: `# __class_getitem__ enables Type[arg] subscript syntax on custom classes.
class TypedList:
    def __init__(self, type_):
        self._type = type_
        self._items = []

    def append(self, item):
        if not isinstance(item, self._type):
            raise TypeError(f"expected {self._type.__name__}")
        self._items.append(item)

    def __class_getitem__(cls, item):
        return cls(item)

ints = TypedList[int]
ints.append(5)
# ints.append("x")   # TypeError`,
    explanation: "__class_getitem__ is how list[int], dict[str, int] etc. work — it returns a runtime annotation object. You can use it to build runtime-typed containers.",
  },
  {
    id: "py-comprehension-walrus",
    language: "python",
    title: "Walrus in comprehensions",
    tag: "snippet",
    code: `import re

# Walrus operator (:=) lets you capture intermediate results in a comprehension.
data = ["100px", "invalid", "200em", "300px", "bad"]

# Without walrus: need to call re.match twice or use a helper.
# With walrus: match once, filter and extract in one expression.
parsed = [
    (m.group(1), m.group(2))
    for s in data
    if (m := re.match(r"(\d+)(px|em)", s))
]
print(parsed)   # [('100', 'px'), ('200', 'em'), ('300', 'px')]`,
    explanation: "The walrus operator in comprehension filters lets you compute an expensive expression once and use the result in both the condition and the output expression.",
  },
  {
    id: "py-conditional-expression-chain",
    language: "python",
    title: "Avoid chained ternaries",
    tag: "caveats",
    code: `score = 75

# READABLE: plain if/elif/else
if score >= 90:   grade = "A"
elif score >= 80: grade = "B"
elif score >= 70: grade = "C"
else:             grade = "F"

# UNREADABLE: chained ternaries — don't do this.
grade2 = "A" if score >= 90 else "B" if score >= 80 else "C" if score >= 70 else "F"

# A lookup dict is often the best approach for grade tables:
import bisect
breakpoints, grades = [70, 80, 90], ["C", "B", "A"]
grade3 = grades[bisect.bisect_left(breakpoints, score)] if score >= 70 else "F"`,
    explanation: "Ternaries are fine for simple two-way choices. Chained ternaries are hard to read and should be replaced with if/elif chains or data-driven lookup tables.",
  },
  {
    id: "py-unpacking-assignment",
    language: "python",
    title: "Tuple unpacking patterns",
    tag: "snippet",
    code: `# Basic unpacking
a, b = 1, 2

# Swap without temp variable
a, b = b, a
print(a, b)   # 2 1

# Nested unpacking
(x, y), z = (1, 2), 3
print(x, y, z)   # 1 2 3

# Discard with _
first, _, last = [10, 20, 30]
print(first, last)   # 10 30

# Extended: first, *rest
head, *rest = range(5)
print(head, rest)   # 0 [1, 2, 3, 4]`,
    explanation: "Python's unpacking is powerful and composable. The _ convention for discarded variables is widely recognised but any valid name works.",
  },
  {
    id: "py-walrus-while",
    language: "python",
    title: "Walrus in while loops",
    tag: "snippet",
    code: `import io

# Walrus is ideal for 'read until empty' patterns.
data = io.BytesIO(b"hello world")

# Without walrus: must initialise before the loop.
# chunk = data.read(4)
# while chunk:
#     process(chunk)
#     chunk = data.read(4)

# With walrus: read-and-test in one expression.
while chunk := data.read(4):
    print(chunk)
# b'hell'
# b'o wo'
# b'rld'`,
    explanation: "The walrus operator was designed for this exact pattern. It's cleaner than the read-first-then-loop setup that requires the read call to appear twice.",
  },
  {
    id: "py-exception-groups",
    language: "python",
    title: "Exception groups (3.11+)",
    tag: "caveats",
    code: `# ExceptionGroup bundles multiple exceptions — useful for async concurrent errors.
try:
    raise ExceptionGroup("batch", [
        ValueError("bad value"),
        TypeError("bad type"),
        KeyError("bad key"),
    ])
except* ValueError as eg:
    print(f"ValueErrors: {[str(e) for e in eg.exceptions]}")
except* TypeError as eg:
    print(f"TypeErrors: {[str(e) for e in eg.exceptions]}")

# 'except*' matches a subset of the group; others re-raise automatically.`,
    explanation: "ExceptionGroup and 'except*' (Python 3.11+) handle scenarios where multiple concurrent tasks each raise — asyncio.TaskGroup uses this mechanism.",
  },
  {
    id: "py-match-guards",
    language: "python",
    title: "match with guards",
    tag: "snippet",
    code: `def classify(point):
    match point:
        case (x, y) if x == y:
            return f"diagonal at {x}"
        case (x, y) if x == 0:
            return f"y-axis at {y}"
        case (x, y) if y == 0:
            return f"x-axis at {x}"
        case (x, y):
            return f"general ({x}, {y})"

print(classify((3, 3)))    # diagonal at 3
print(classify((0, 5)))    # y-axis at 5
print(classify((4, 0)))    # x-axis at 4
print(classify((2, 7)))    # general (2, 7)`,
    explanation: "Guards (if-clauses after a pattern) add arbitrary conditions to pattern matching. They're evaluated only if the structural pattern matches first.",
  },
  {
    id: "py-slots-inheritance",
    language: "python",
    title: "__slots__ with inheritance",
    tag: "classes",
    code: `# If a parent has __dict__, the child also has __dict__ — slots savings disappear.
# To preserve savings, ALL classes in the hierarchy need __slots__.

class Base:
    __slots__ = ("x",)
    def __init__(self, x): self.x = x

class Child(Base):
    __slots__ = ("y",)   # only new attributes here
    def __init__(self, x, y):
        super().__init__(x)
        self.y = y

c = Child(1, 2)
print(c.x, c.y)   # 1 2
# c.z = 3          # AttributeError — no __dict__`,
    explanation: "Each class in a slots hierarchy only declares its own new slots. If any ancestor has __dict__, the subclass will too — defeating the purpose.",
  },
  {
    id: "py-contextlib-suppress",
    language: "python",
    title: "contextlib.suppress",
    tag: "snippet",
    code: `from contextlib import suppress

# suppress(ExcType) silently ignores the specified exception within the block.
with suppress(FileNotFoundError):
    import os
    os.remove("/tmp/non_existent_file.txt")
# No crash — cleaner than try/except/pass

with suppress(KeyError, IndexError):
    d = {}
    print(d["missing"])   # KeyError suppressed — execution continues after the block`,
    explanation: "contextlib.suppress is the idiomatic way to write 'ignore this exception'. It's cleaner than try/except/pass and explicitly names the suppressed type.",
  },
  {
    id: "py-io-stringio",
    language: "python",
    title: "io.StringIO — in-memory text file",
    tag: "structures",
    code: `import io

# StringIO behaves like an open text file — useful for testing.
buf = io.StringIO()
buf.write("line one\n")
buf.write("line two\n")

buf.seek(0)                     # rewind to start
print(buf.read())               # line one\nline two\n
print(buf.getvalue())           # same as read() after rewind

# Capture print() output:
import sys
old_stdout = sys.stdout
sys.stdout = io.StringIO()
print("captured")
output = sys.stdout.getvalue()
sys.stdout = old_stdout
print(f"got: {output!r}")       # got: 'captured\n'`,
    explanation: "StringIO (and BytesIO) let you test code that writes to files without touching the filesystem. Swap sys.stdout to capture print() output in tests.",
  },
  {
    id: "py-dataclass-kw-only",
    language: "python",
    title: "dataclass kw_only",
    tag: "classes",
    code: `from dataclasses import dataclass

# kw_only=True forces all fields to be keyword-only arguments in __init__.
@dataclass(kw_only=True)
class Connection:
    host: str
    port: int = 5432
    ssl: bool = False

# c = Connection("localhost")     # TypeError — must use keywords
c = Connection(host="localhost", ssl=True)
print(c)   # Connection(host='localhost', port=5432, ssl=True)`,
    explanation: "kw_only=True (Python 3.10+) prevents accidental positional passing of fields and makes calls self-documenting. Can also be set per-field with field(kw_only=True).",
  },
  {
    id: "py-match-class-patterns",
    language: "python",
    title: "match class patterns",
    tag: "snippet",
    code: `from dataclasses import dataclass

@dataclass
class Point: x: float; y: float
@dataclass
class Circle: center: Point; radius: float

def describe(shape):
    match shape:
        case Circle(center=Point(x=0, y=0), radius=r):
            return f"circle at origin, r={r}"
        case Circle(center=Point(x=cx, y=cy), radius=r):
            return f"circle at ({cx},{cy}), r={r}"
        case Point(x=0, y=0):
            return "origin"
        case _:
            return "unknown"

print(describe(Circle(Point(0,0), 5)))      # circle at origin, r=5
print(describe(Circle(Point(1,2), 3)))      # circle at (1,2), r=3`,
    explanation: "Class patterns match by type and can destructure fields by name. Nesting class patterns handles tree-shaped data without recursion.",
  },
  {
    id: "py-re-groups",
    language: "python",
    title: "Named capture groups in regex",
    tag: "snippet",
    code: `import re

# (?P<name>...) creates a named group accessible via .group(name).
pattern = re.compile(r"(?P<year>\d{4})-(?P<month>\d{2})-(?P<day>\d{2})")
m = pattern.match("2024-06-15")

if m:
    print(m.group("year"))    # 2024
    print(m.group("month"))   # 06
    print(m.groupdict())      # {'year': '2024', 'month': '06', 'day': '15'}`,
    explanation: "Named groups make regex results self-documenting. groupdict() returns a plain dict — easy to pass to datetime() or other constructors.",
  },
  {
    id: "py-json-module",
    language: "python",
    title: "json module basics",
    tag: "snippet",
    code: `import json

data = {"name": "Ada", "scores": [95, 87, 92], "active": True}

# Serialise to string:
s = json.dumps(data, indent=2)
print(s)

# Deserialise back:
loaded = json.loads(s)
print(loaded["name"])   # Ada

# File I/O:
# with open("data.json", "w") as f: json.dump(data, f, indent=2)
# with open("data.json") as f: loaded = json.load(f)`,
    explanation: "json.dumps/loads for strings; json.dump/load for files. Python dicts, lists, strings, numbers, booleans, and None map directly to JSON types.",
  },
  {
    id: "py-subprocess-run",
    language: "python",
    title: "subprocess.run",
    tag: "snippet",
    code: `import subprocess

# subprocess.run: run a command, wait for it to finish, return CompletedProcess.
result = subprocess.run(
    ["echo", "hello world"],
    capture_output=True,
    text=True,
    check=True,         # raises CalledProcessError on non-zero exit code
)
print(result.stdout)     # hello world
print(result.returncode) # 0

# Never use shell=True with user-supplied input — command injection risk.`,
    explanation: "subprocess.run is the modern API for running external commands. capture_output=True captures stdout/stderr. check=True raises on failure — fail-fast by default.",
  },
  {
    id: "py-logging-basics",
    language: "python",
    title: "logging module basics",
    tag: "snippet",
    code: `import logging

# Configure once at startup.
logging.basicConfig(level=logging.DEBUG, format="%(levelname)s %(name)s: %(message)s")
log = logging.getLogger(__name__)

log.debug("debug detail")   # DEBUG __main__: debug detail
log.info("started")         # INFO  __main__: started
log.warning("low disk")     # WARNING __main__: low disk
log.error("connection lost")

# Never use print() for application logging — levels, handlers, and formatters
# make the logging module worth the boilerplate.`,
    explanation: "Use logging, not print(), for diagnostics. Levels let you filter verbosity at runtime without changing code. Libraries should use getLogger(__name__).",
  },
  {
    id: "py-pathlib-glob",
    language: "python",
    title: "pathlib glob and rglob",
    tag: "stdlib",
    code: `from pathlib import Path

p = Path(".")
# glob: matches within this directory.
py_files = list(p.glob("*.py"))

# rglob: recursive — same as glob("**/*.py").
all_py = list(p.rglob("*.py"))

# Path.iterdir(): iterate directory entries (non-recursive).
for entry in p.iterdir():
    if entry.is_dir():
        print(f"dir:  {entry.name}")
    else:
        print(f"file: {entry.name}")`,
    explanation: "pathlib.glob/rglob return generators of Path objects — composable with any Path methods. rglob is glob('**/<pattern>') — much cleaner than os.walk.",
  },
  {
    id: "py-collections-namedtuple-defaults",
    language: "python",
    title: "NamedTuple with defaults",
    tag: "structures",
    code: `from typing import NamedTuple

class Config(NamedTuple):
    host: str
    port: int = 5432
    ssl:  bool = False

c = Config("localhost")
print(c)           # Config(host='localhost', port=5432, ssl=False)
print(c._asdict()) # {'host': 'localhost', 'port': 5432, 'ssl': False}

# _replace: non-destructive update (like dataclass 'with' expression).
c2 = c._replace(ssl=True)
print(c2)          # Config(host='localhost', port=5432, ssl=True)`,
    explanation: "typing.NamedTuple supports default values and type annotations. _replace() and _asdict() are the canonical mutation and serialisation methods.",
  },
  {
    id: "py-classvar",
    language: "python",
    title: "ClassVar — typed class attributes",
    tag: "types",
    code: `from typing import ClassVar
from dataclasses import dataclass

@dataclass
class Counter:
    # ClassVar: tells type checkers this is a class-level attribute, not an instance field.
    # dataclass won't generate __init__ parameters for ClassVar fields.
    count: ClassVar[int] = 0
    name: str

    def __post_init__(self):
        Counter.count += 1

a = Counter("a")
b = Counter("b")
print(Counter.count)   # 2
print(Counter.count == a.count)  # True — both read the class var`,
    explanation: "ClassVar marks a field as shared state — dataclass skips it in __init__. Without ClassVar, dataclass would try to pass count as a constructor argument.",
  },
  {
    id: "py-iobase-protocol",
    language: "python",
    title: "Duck typing with file-like objects",
    tag: "families",
    code: `import io

# Any object with .read() / .write() behaves as a file.
# This is the duck-typed file protocol.
def process(stream):
    return stream.read().upper()

# Works with real files, StringIO, BytesIO, network sockets, etc.
print(process(io.StringIO("hello")))     # HELLO

# The abstract base io.IOBase / io.RawIOBase / io.TextIOBase
# can be used in isinstance() checks:
f = io.StringIO()
print(isinstance(f, io.IOBase))   # True`,
    explanation: "Python's I/O is built on duck typing — any object with the right methods is a file. Always accept a 'file-like object' rather than forcing callers to use a real file.",
  },
  {
    id: "py-operator-module",
    language: "python",
    title: "operator module for functional code",
    tag: "snippet",
    code: `import operator

# operator functions are faster and cleaner than lambdas for common operations.
from functools import reduce

nums = [1, 2, 3, 4, 5]
print(reduce(operator.add, nums))   # 15 — same as sum()
print(reduce(operator.mul, nums))   # 120

# itemgetter and attrgetter for sorted() / map():
records = [{"name": "b", "age": 2}, {"name": "a", "age": 1}]
print(sorted(records, key=operator.itemgetter("name")))`,
    explanation: "operator module functions are faster than equivalent lambdas because they avoid Python function-call overhead. Use them with map(), filter(), reduce(), and sorted().",
  },
  {
    id: "py-textwrap-module",
    language: "python",
    title: "textwrap for text formatting",
    tag: "snippet",
    code: `import textwrap

text = "Python is a versatile, high-level programming language known for its readable syntax."

print(textwrap.fill(text, width=40))
# Python is a versatile, high-level
# programming language known for its
# readable syntax.

# dedent: strips common leading whitespace from all lines.
code = """
    def hello():
        print("hi")
"""
print(textwrap.dedent(code).strip())`,
    explanation: "textwrap.fill wraps paragraphs to a given width; dedent removes consistent indentation from multi-line strings. Useful for CLIs and docstrings.",
  },
  {
    id: "py-functools-cache-property",
    language: "python",
    title: "functools.cached_property",
    tag: "snippet",
    code: `from functools import cached_property

class Circle:
    def __init__(self, radius: float):
        self.radius = radius

    @cached_property
    def area(self) -> float:
        # Computed once; stored in the instance dict. Subsequent accesses are O(1).
        import math
        print("computing area")
        return math.pi * self.radius ** 2

c = Circle(5)
print(c.area)    # computing area / 78.539...
print(c.area)    # 78.539...   — no 'computing area' this time`,
    explanation: "cached_property computes the value on first access and stores it as a plain instance attribute. Unlike @property, there's no function call overhead on subsequent accesses.",
  },
  {
    id: "py-typing-self",
    language: "python",
    title: "Self type for fluent interfaces",
    tag: "types",
    code: `from __future__ import annotations
from typing import Self

class Builder:
    def __init__(self):
        self._parts: list[str] = []

    def add(self, part: str) -> Self:
        self._parts.append(part)
        return self   # Self preserves subclass type

    def build(self) -> str:
        return ", ".join(self._parts)

class ExtendedBuilder(Builder):
    def add_many(self, *parts: str) -> Self:
        for p in parts: self.add(p)
        return self

result = ExtendedBuilder().add("a").add_many("b", "c").build()
print(result)   # a, b, c`,
    explanation: "Self (Python 3.11+ built-in, or from typing for 3.10-) preserves the exact subclass type in return annotations. Without it, Builder.add would return Builder, losing subclass info.",
  },
  {
    id: "py-abc-classmethod",
    language: "python",
    title: "Abstract class methods and properties",
    tag: "classes",
    code: `from abc import ABC, abstractmethod

class Serialisable(ABC):
    @classmethod
    @abstractmethod
    def from_dict(cls, data: dict) -> "Serialisable": ...

    @abstractmethod
    def to_dict(self) -> dict: ...

class User(Serialisable):
    def __init__(self, name: str, age: int):
        self.name = name; self.age = age

    @classmethod
    def from_dict(cls, data: dict) -> "User":
        return cls(data["name"], data["age"])

    def to_dict(self) -> dict:
        return {"name": self.name, "age": self.age}

u = User.from_dict({"name": "Ada", "age": 36})
print(u.to_dict())   # {'name': 'Ada', 'age': 36}`,
    explanation: "Stack @classmethod above @abstractmethod to require subclasses to implement a class-level factory. Order matters — @classmethod must be outermost.",
  },
  {
    id: "py-type-narrowing",
    language: "python",
    title: "Type narrowing with isinstance",
    tag: "types",
    code: `def process(value: int | str | list[int]) -> str:
    if isinstance(value, int):
        # In this branch, type checkers know 'value' is int.
        return str(value * 2)
    elif isinstance(value, str):
        # Here, 'value' is str.
        return value.upper()
    else:
        # Here, 'value' is list[int].
        return str(sum(value))

print(process(5))           # 10
print(process("hi"))        # HI
print(process([1, 2, 3]))   # 6`,
    explanation: "isinstance checks 'narrow' the type within each branch. Type checkers track these guards — code after an isinstance check can safely use type-specific methods.",
  },
  {
    id: "py-type-guard",
    language: "python",
    title: "TypeGuard for custom narrowing",
    tag: "types",
    code: `from typing import TypeGuard

def is_str_list(val: list) -> TypeGuard[list[str]]:
    return all(isinstance(x, str) for x in val)

def process(items: list) -> str:
    if is_str_list(items):
        # Type checkers know 'items' is list[str] inside this block.
        return ", ".join(items)
    return str(items)

print(process(["a", "b", "c"]))   # a, b, c
print(process([1, 2, 3]))          # [1, 2, 3]`,
    explanation: "TypeGuard lets you write custom isinstance-equivalent functions that type checkers understand for narrowing. The function must return bool; the TypeGuard annotation documents what's guaranteed on True.",
  },
  {
    id: "py-never-type",
    language: "python",
    title: "Never — exhaustive match",
    tag: "types",
    code: `from typing import Never

def assert_never(x: Never) -> Never:
    raise AssertionError(f"unhandled case: {x!r}")

type Shape = "circle" | "square" | "triangle"

def area(shape: Shape, size: float) -> float:
    if shape == "circle":
        return 3.14159 * size ** 2
    elif shape == "square":
        return size ** 2
    elif shape == "triangle":
        return 0.5 * size ** 2
    else:
        assert_never(shape)  # type checkers warn here if a case is missing`,
    explanation: "assert_never(x: Never) is a type-safe exhaustiveness check. If you add a new Shape variant and forget to handle it, the type checker flags the assert_never call.",
  },
  {
    id: "py-concurrent-futures",
    language: "python",
    title: "concurrent.futures for parallelism",
    tag: "snippet",
    code: `from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor
import time

def task(n):
    time.sleep(0.01)
    return n * n

# ThreadPoolExecutor: I/O-bound tasks (network, files).
with ThreadPoolExecutor(max_workers=4) as ex:
    results = list(ex.map(task, range(8)))
print(results)   # [0, 1, 4, 9, 16, 25, 36, 49]

# ProcessPoolExecutor: CPU-bound tasks (bypasses the GIL).
# with ProcessPoolExecutor() as ex:
#     results = list(ex.map(cpu_heavy_task, data))`,
    explanation: "ThreadPoolExecutor for I/O parallelism (GIL released on blocking calls); ProcessPoolExecutor for CPU parallelism (separate processes). Both have the same map() API.",
  },
  {
    id: "py-asyncio-gather",
    language: "python",
    title: "asyncio.gather for concurrent tasks",
    tag: "snippet",
    code: `import asyncio

async def fetch(url: str) -> str:
    await asyncio.sleep(0.1)   # simulate network I/O
    return f"data from {url}"

async def main():
    # Run three coroutines CONCURRENTLY — total ~0.1s, not 0.3s.
    results = await asyncio.gather(
        fetch("api/users"),
        fetch("api/posts"),
        fetch("api/comments"),
    )
    for r in results:
        print(r)

asyncio.run(main())`,
    explanation: "asyncio.gather starts all coroutines concurrently and waits for all to finish. It's the standard way to fan-out multiple I/O operations in async Python.",
  },
  {
    id: "py-async-context-manager",
    language: "python",
    title: "Async context managers",
    tag: "snippet",
    code: `import asyncio

class AsyncDB:
    async def __aenter__(self):
        print("connecting...")
        await asyncio.sleep(0)   # simulate async connection
        return self

    async def __aexit__(self, exc_type, exc, tb):
        print("disconnecting...")
        await asyncio.sleep(0)

    async def query(self, sql: str) -> list:
        return [{"id": 1}]

async def main():
    async with AsyncDB() as db:
        rows = await db.query("SELECT 1")
        print(rows)

asyncio.run(main())`,
    explanation: "Async context managers use __aenter__ and __aexit__. Use them for async resources (database connections, HTTP sessions) that need setup and teardown.",
  },
  {
    id: "py-dataclass-init-false",
    language: "python",
    title: "dataclass field(init=False)",
    tag: "classes",
    code: `from dataclasses import dataclass, field
import uuid

@dataclass
class Order:
    item: str
    quantity: int
    # init=False: excluded from __init__; set in __post_init__ instead.
    id: str = field(default="", init=False, repr=True)

    def __post_init__(self):
        self.id = str(uuid.uuid4())[:8]

o = Order("book", 2)
print(o)          # Order(item='book', quantity=2, id='a1b2c3d4')
print(o.id)       # some UUID prefix`,
    explanation: "init=False excludes a field from the constructor but keeps it in the dataclass. Used for computed identifiers, timestamps, and internal state set in __post_init__.",
  },
  {
    id: "py-singleton-pattern",
    language: "python",
    title: "Module-level singleton",
    tag: "classes",
    code: `# In Python, modules ARE singletons — they're loaded once and cached.
# The simplest singleton is just module-level state.

# config.py (conceptually):
_settings = {
    "debug": False,
    "host": "localhost",
}

def get(key: str):
    return _settings[key]

def set(key: str, value) -> None:
    _settings[key] = value

# Callers import the module and get the same state:
# import config
# config.set("debug", True)`,
    explanation: "Module-level state is the Pythonic singleton. The module is loaded once; all importers share the same namespace. Only reach for __new__-based singletons for class-based APIs.",
  },
  {
    id: "py-dataclass-compare",
    language: "python",
    title: "dataclass ordering",
    tag: "classes",
    code: `from dataclasses import dataclass

# order=True generates __lt__, __le__, __gt__, __ge__ in field order.
@dataclass(order=True)
class Version:
    major: int
    minor: int
    patch: int

v1 = Version(1, 9, 0)
v2 = Version(2, 0, 0)
v3 = Version(1, 9, 1)

print(v1 < v2)               # True
print(sorted([v2, v1, v3]))  # [Version(1,9,0), Version(1,9,1), Version(2,0,0)]`,
    explanation: "order=True on a dataclass generates comparison methods that compare fields left-to-right — like tuples. The comparison order is determined by field declaration order.",
  },
  {
    id: "py-iter-protocol",
    language: "python",
    title: "__iter__ and __next__ protocol",
    tag: "classes",
    code: `# An iterator has __iter__ (returns self) and __next__ (returns next value).
class Countdown:
    def __init__(self, start: int):
        self._n = start

    def __iter__(self):
        return self    # iterators return themselves

    def __next__(self) -> int:
        if self._n < 0:
            raise StopIteration
        val = self._n
        self._n -= 1
        return val

for n in Countdown(3):
    print(n, end=" ")   # 3 2 1 0`,
    explanation: "The iterator protocol requires __iter__ returning self and __next__ raising StopIteration when done. Python's for loop calls these under the hood.",
  },
  {
    id: "py-generator-send",
    language: "python",
    title: "Generator send() — coroutine pattern",
    tag: "classes",
    code: `# Generators can receive values via .send().
def accumulator():
    total = 0
    while True:
        value = yield total   # yield sends total OUT, receives value IN
        if value is None:
            break
        total += value

gen = accumulator()
next(gen)        # prime the generator — run to first yield
print(gen.send(10))   # 10
print(gen.send(20))   # 30
print(gen.send(5))    # 35`,
    explanation: "Generator .send(value) resumes the generator and passes value as the result of the yield expression. This is the foundation of native coroutines (async/await).",
  },
  {
    id: "py-defaultdict-nested",
    language: "python",
    title: "Nested defaultdict",
    tag: "structures",
    code: `from collections import defaultdict

# defaultdict of defaultdict for multi-level auto-init.
nested = defaultdict(lambda: defaultdict(int))

# Count word occurrences per document.
docs = {"doc1": ["apple", "banana", "apple"], "doc2": ["banana", "cherry"]}
for doc, words in docs.items():
    for w in words:
        nested[doc][w] += 1

print(dict(nested["doc1"]))   # {'apple': 2, 'banana': 1}
print(dict(nested["doc2"]))   # {'banana': 1, 'cherry': 1}`,
    explanation: "Nested defaultdicts eliminate the 'if key not in dict' pattern at multiple levels. The lambda creates a fresh defaultdict(int) for each new outer key.",
  },
  {
    id: "py-dataclass-frozen",
    language: "python",
    title: "frozen dataclass — immutable and hashable",
    tag: "structures",
    code: `from dataclasses import dataclass

@dataclass(frozen=True)
class Point:
    x: float
    y: float

p1 = Point(1.0, 2.0)
# p1.x = 99   # FrozenInstanceError — immutable

# frozen=True adds __hash__ based on all fields.
print(hash(p1))            # some integer
points = {p1, Point(3.0, 4.0), Point(1.0, 2.0)}
print(len(points))         # 2 — Point(1,2) is deduplicated`,
    explanation: "frozen=True makes a dataclass immutable and hashable — suitable as dict keys and set elements. Trying to set an attribute raises FrozenInstanceError at runtime.",
  },
  {
    id: "py-enum-auto",
    language: "python",
    title: "Enum with auto()",
    tag: "structures",
    code: `from enum import Enum, auto

# auto() assigns values automatically starting from 1.
class Direction(Enum):
    NORTH = auto()   # 1
    SOUTH = auto()   # 2
    EAST  = auto()   # 3
    WEST  = auto()   # 4

print(Direction.NORTH.value)   # 1
print(list(Direction))         # all four

# Override _generate_next_value_ for custom auto behaviour:
class Color(Enum):
    def _generate_next_value_(name, start, count, last_values):
        return name.lower()   # value becomes the lowercase name

    RED   = auto()   # 'red'
    GREEN = auto()   # 'green'`,
    explanation: "auto() removes the need to manually assign incremented numbers. Override _generate_next_value_ when you want meaningful automatic values like lowercase names.",
  },
  {
    id: "py-class-body-scope",
    language: "python",
    title: "Class body scope is not a closure",
    tag: "caveats",
    code: `# Class body runs once, but it doesn't create a closure scope.
# Comprehensions inside class bodies can't see class-level names.

class Broken:
    x = 10
    # squares = [x * i for i in range(3)]  # NameError: x is not defined
    # The list comp has its own scope; class 'x' is not inherited.

class Fixed:
    x = 10
    squares = [x * i for x in [10] for i in range(3)]  # awkward workaround

# Simpler: use __init_subclass__ or a classmethod for complex class-level logic.`,
    explanation: "Class-body comprehensions can't access class-level names because Python's scoping rules don't make class bodies part of the enclosing scope for comprehensions.",
  },
  {
    id: "py-slots-and-weak",
    language: "python",
    title: "__slots__ and weakref support",
    tag: "classes",
    code: `import weakref

class NoWeakref:
    __slots__ = ("x",)

class WithWeakref:
    __slots__ = ("x", "__weakref__")   # __weakref__ enables weak references

a = NoWeakref()
# ref = weakref.ref(a)   # TypeError: cannot create weak reference

b = WithWeakref()
b.x = 1
ref = weakref.ref(b)
print(ref())   # <WithWeakref object>`,
    explanation: "Objects with __slots__ lose weakref support unless you explicitly include '__weakref__' in the slots. Needed when your slotted class is used in weak-reference caches.",
  },
  {
    id: "py-property-delete",
    language: "python",
    title: "@property deleter",
    tag: "classes",
    code: `class User:
    def __init__(self, name: str):
        self._name = name

    @property
    def name(self) -> str:
        return self._name

    @name.setter
    def name(self, value: str):
        if not value:
            raise ValueError("name can't be empty")
        self._name = value

    @name.deleter
    def name(self):
        print("deleting name")
        del self._name

u = User("Ada")
print(u.name)    # Ada
u.name = "Linus"
del u.name       # deleting name`,
    explanation: "The @deleter decorator defines what happens when 'del obj.attr' is called on a property. Useful for lazy cleanup, cache invalidation, or logging deletions.",
  },
  {
    id: "py-suppress-exception-groups",
    language: "python",
    title: "Exception chaining with from",
    tag: "caveats",
    code: `# 'raise X from Y' sets __cause__ — explicit chaining.
# 'raise X from None' suppresses the original context.

def parse_config(raw: str) -> dict:
    try:
        import json
        return json.loads(raw)
    except json.JSONDecodeError as e:
        raise ValueError("invalid config") from e   # preserves cause

try:
    parse_config("not json")
except ValueError as e:
    print(e)             # invalid config
    print(e.__cause__)   # Expecting value: line 1 column 1 (char 0)`,
    explanation: "'raise X from Y' is the explicit way to chain exceptions — callers see both errors. 'raise X from None' hides the original exception (use sparingly).",
  },
  {
    id: "py-pep563-annotations",
    language: "python",
    title: "from __future__ import annotations",
    tag: "types",
    code: `# Defers annotation evaluation — enables forward references without quotes.
from __future__ import annotations

class Node:
    def __init__(self, value: int, next: Node | None = None):
        # Without 'from __future__', 'Node' here is a NameError at class definition.
        self.value = value
        self.next  = next

n = Node(1, Node(2))
print(n.value, n.next.value)   # 1 2`,
    explanation: "from __future__ import annotations (PEP 563) makes all annotations strings — evaluated lazily. This allows forward references and speeds up import time. Default in Python 3.14+.",
  },
  {
    id: "py-str-encode-error",
    language: "python",
    title: "Encoding error handlers",
    tag: "types",
    code: `# str.encode and bytes.decode accept an 'errors' argument.
text = "café"   # 'café'

# strict (default): raise on unencodable characters.
# replace: substitute with ?
# ignore: drop the character
# xmlcharrefreplace: &#...; entity
print(text.encode("ascii", errors="replace"))         # b'caf?'
print(text.encode("ascii", errors="ignore"))          # b'caf'
print(text.encode("ascii", errors="xmlcharrefreplace")) # b'caf&#233;'`,
    explanation: "Always handle encoding errors explicitly. The default 'strict' is correct for most cases — it forces you to pick the right encoding. 'ignore' silently loses data.",
  },
  {
    id: "py-typed-namedtuple-methods",
    language: "python",
    title: "Adding methods to NamedTuple",
    tag: "classes",
    code: `from typing import NamedTuple
import math

class Vector(NamedTuple):
    x: float
    y: float

    def magnitude(self) -> float:
        return math.sqrt(self.x ** 2 + self.y ** 2)

    def normalise(self) -> "Vector":
        m = self.magnitude()
        return Vector(self.x / m, self.y / m)

v = Vector(3.0, 4.0)
print(v.magnitude())    # 5.0
print(v.normalise())    # Vector(x=0.6, y=0.8)`,
    explanation: "NamedTuple supports regular methods while remaining immutable and tuple-compatible. Cleaner than inheriting from tuple directly.",
  },
  {
    id: "py-pep544-structural",
    language: "python",
    title: "Structural subtyping (duck typing + types)",
    tag: "families",
    code: `from typing import Protocol

class Comparable(Protocol):
    def __lt__(self, other: "Comparable") -> bool: ...

def min_of_two(a: Comparable, b: Comparable) -> Comparable:
    return a if a < b else b

# Works with ANY type that has __lt__ — no inheritance needed.
print(min_of_two(3, 5))             # 3
print(min_of_two("banana", "apple")) # apple — str has __lt__
print(min_of_two((1, 2), (1, 3)))   # (1, 2) — tuples compare lexicographically`,
    explanation: "Protocols + structural subtyping bring formal duck typing to Python. Any class with the right method signatures satisfies the Protocol — no registration or inheritance required.",
  },
  {
    id: "py-dataclass-inheritance",
    language: "python",
    title: "dataclass inheritance",
    tag: "classes",
    code: `from dataclasses import dataclass

@dataclass
class Animal:
    name: str
    sound: str

    def speak(self) -> str:
        return f"{self.name} says {self.sound}"

@dataclass
class Dog(Animal):
    breed: str = "unknown"

    def fetch(self) -> str:
        return f"{self.name} fetches the ball"

d = Dog(name="Rex", sound="woof", breed="Lab")
print(d.speak())   # Rex says woof
print(d.fetch())   # Rex fetches the ball`,
    explanation: "dataclass inheritance works naturally — subclass adds new fields after parent fields. All parent fields must come before any fields with defaults in MRO order.",
  },
  {
    id: "py-abstract-factory",
    language: "python",
    title: "Abstract factory via classmethods",
    tag: "classes",
    code: `from abc import ABC, abstractmethod

class Parser(ABC):
    @abstractmethod
    def parse(self, data: str) -> dict: ...

    @classmethod
    def for_format(cls, fmt: str) -> "Parser":
        registry = {"json": JsonParser, "csv": CsvParser}
        if fmt not in registry:
            raise ValueError(f"unknown format: {fmt}")
        return registry[fmt]()

class JsonParser(Parser):
    def parse(self, data: str) -> dict:
        import json; return json.loads(data)

class CsvParser(Parser):
    def parse(self, data: str) -> dict:
        return {"rows": data.split("\\n")}

p = Parser.for_format("json")
print(p.parse('{"x": 1}'))   # {'x': 1}`,
    explanation: "A class method on the ABC doubles as an abstract factory. Callers don't need to import concrete subclasses — the factory maps format strings to the right implementation.",
  },
  {
    id: "py-typing-overload-method",
    language: "python",
    title: "Overloaded class methods",
    tag: "types",
    code: `from typing import overload

class Connection:
    def __init__(self, url: str): self.url = url

    @overload
    @classmethod
    def create(cls, host: str, port: int) -> "Connection": ...
    @overload
    @classmethod
    def create(cls, url: str) -> "Connection": ...

    @classmethod
    def create(cls, host_or_url, port=None):
        if port is not None:
            return cls(f"tcp://{host_or_url}:{port}")
        return cls(host_or_url)

c1 = Connection.create("localhost", 5432)
c2 = Connection.create("tcp://db:5432")`,
    explanation: "@overload on a classmethod gives type checkers two distinct signatures to check against. The un-decorated implementation handles both cases at runtime.",
  },
  {
    id: "py-contextlib-asynccontextmanager",
    language: "python",
    title: "@asynccontextmanager",
    tag: "classes",
    code: `from contextlib import asynccontextmanager
import asyncio

@asynccontextmanager
async def managed_connection(url: str):
    print(f"connecting to {url}")
    conn = {"url": url, "open": True}   # simulate connection object
    try:
        yield conn
    finally:
        conn["open"] = False
        print(f"closed {url}")

async def main():
    async with managed_connection("db://localhost") as conn:
        print(f"using {conn}")

asyncio.run(main())`,
    explanation: "@asynccontextmanager does for async what @contextmanager does for sync — turns an async generator into an async context manager without writing __aenter__/__aexit__.",
  },
  {
    id: "py-typing-final-class",
    language: "python",
    title: "@final class prevents subclassing",
    tag: "types",
    code: `from typing import final

@final
class Sentinel:
    """A unique marker value — should never be subclassed."""
    _instance = None
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

# Type checkers flag any attempt to subclass:
# class MySentinel(Sentinel): pass  # error: cannot inherit from final class

s1 = Sentinel()
s2 = Sentinel()
print(s1 is s2)   # True — singleton`,
    explanation: "@final (from typing) tells type checkers a class must not be subclassed. It doesn't prevent inheritance at runtime — it's a static analysis marker.",
  },
  {
    id: "py-getattr-setattr",
    language: "python",
    title: "getattr, setattr, hasattr, delattr",
    tag: "classes",
    code: `class Config:
    host = "localhost"
    port = 5432

# getattr: access attribute by name — supports default.
print(getattr(Config, "host"))           # localhost
print(getattr(Config, "missing", None))  # None — no AttributeError

# setattr: set attribute by name.
setattr(Config, "debug", True)
print(Config.debug)   # True

# hasattr: check without try/except.
print(hasattr(Config, "host"))     # True
print(hasattr(Config, "missing"))  # False`,
    explanation: "getattr/setattr/hasattr are essential for dynamic attribute access and meta-programming. They're how serialisation libraries, ORMs, and test frameworks inspect objects.",
  },
  {
    id: "py-vars-dir",
    language: "python",
    title: "vars() and dir() for introspection",
    tag: "snippet",
    code: `class Dog:
    species = "Canis lupus"
    def __init__(self, name):
        self.name = name

d = Dog("Rex")

# vars(obj): returns __dict__ — instance attributes only.
print(vars(d))          # {'name': 'Rex'}

# dir(obj): all accessible names including inherited ones.
names = [n for n in dir(d) if not n.startswith("_")]
print(names)   # ['name', 'species']

# vars() on a class returns class attributes:
print(vars(Dog)["species"])   # Canis lupus`,
    explanation: "vars() is a fast way to see an object's instance dictionary. dir() is broader — useful for REPL exploration. Neither is stable across Python versions for internal attributes.",
  },
  {
    id: "py-dunder-enter-exit",
    language: "python",
    title: "__enter__ and __exit__ protocol",
    tag: "classes",
    code: `class Timer:
    import time

    def __enter__(self):
        self._start = __import__("time").perf_counter()
        return self   # bound to 'as' variable

    def __exit__(self, exc_type, exc_val, exc_tb):
        elapsed = __import__("time").perf_counter() - self._start
        print(f"elapsed: {elapsed:.4f}s")
        return False   # don't suppress exceptions

with Timer() as t:
    total = sum(range(1_000_000))

print(total)   # 499999500000`,
    explanation: "__exit__ receives exception info — return True to suppress, False (or None) to propagate. The 'as' variable gets whatever __enter__ returns.",
  },
  {
    id: "py-import-system",
    language: "python",
    title: "importlib for dynamic imports",
    tag: "snippet",
    code: `import importlib

# Import a module by name string — useful for plugins and config-driven loading.
json_mod = importlib.import_module("json")
print(json_mod.dumps({"x": 1}))   # {"x": 1}

# Reload a module after modification (useful in interactive sessions):
# importlib.reload(my_module)

# Access a named attribute from a module:
dumps = getattr(importlib.import_module("json"), "dumps")
print(dumps([1, 2]))   # [1, 2]`,
    explanation: "importlib.import_module is the clean way to import by name string. Used by plugin systems, auto-discovery, and configuration-driven app frameworks.",
  },
  {
    id: "py-pprint-module",
    language: "python",
    title: "pprint for readable output",
    tag: "snippet",
    code: `import pprint

data = {
    "users": [{"id": i, "name": f"User{i}", "active": i % 2 == 0} for i in range(3)],
    "total": 3,
    "filters": {"role": "admin", "status": "active"},
}

# pprint formats nested structures with aligned indentation.
pprint.pprint(data, width=50, sort_dicts=False)

# pp() shorthand (Python 3.8+):
pp = pprint.pp
pp(data)`,
    explanation: "pprint is the built-in pretty-printer for nested Python objects. Invaluable for debugging large dicts, API responses, and complex data structures in the REPL.",
  },
  {
    id: "py-weakref-finalize",
    language: "python",
    title: "weakref.finalize — cleanup callbacks",
    tag: "classes",
    code: `import weakref

class Resource:
    def __init__(self, name):
        self.name = name

def on_cleanup(name):
    print(f"cleanup: {name}")

r = Resource("db-conn")

# finalize registers a callback to run when 'r' is garbage-collected.
# The callback itself doesn't prevent collection.
fin = weakref.finalize(r, on_cleanup, r.name)

del r   # triggers: cleanup: db-conn
print(fin.alive)  # False — already called`,
    explanation: "weakref.finalize is more reliable than __del__ for cleanup callbacks — it runs even if __del__ is skipped, and it doesn't prevent garbage collection like __del__ can.",
  },
  {
    id: "py-heapq-custom-key",
    language: "python",
    title: "heapq with custom sort key",
    tag: "structures",
    code: `import heapq

# heapq works on lists of tuples — first element determines order.
tasks = []

# Priority queue: (priority, item). Lower number = higher priority.
heapq.heappush(tasks, (3, "low priority task"))
heapq.heappush(tasks, (1, "urgent task"))
heapq.heappush(tasks, (2, "medium priority task"))

while tasks:
    priority, task = heapq.heappop(tasks)
    print(f"[{priority}] {task}")
# [1] urgent task
# [2] medium priority task
# [3] low priority task`,
    explanation: "Push (priority, item) tuples to simulate a priority queue. If priorities tie, the second element determines order — make sure it's comparable, or add a counter as tiebreaker.",
  },
  {
    id: "py-enum-iteration",
    language: "python",
    title: "Enum iteration and lookup",
    tag: "structures",
    code: `from enum import Enum

class Color(Enum):
    RED   = 1
    GREEN = 2
    BLUE  = 3

# Iterate all members:
for c in Color:
    print(c.name, c.value)

# Look up by value:
print(Color(2))         # Color.GREEN
# Look up by name:
print(Color["BLUE"])    # Color.BLUE

# Membership test:
print(Color.RED in Color)   # True`,
    explanation: "Enum members are iterable in definition order. Color(2) is by-value lookup; Color['NAME'] is by-name lookup. Both raise ValueError/KeyError on miss.",
  },
  {
    id: "py-re-sub-function",
    language: "python",
    title: "re.sub with a function replacement",
    tag: "snippet",
    code: `import re

# re.sub can take a callable — called with each Match object.
def to_upper(m: re.Match) -> str:
    return m.group(0).upper()

result = re.sub(r"[aeiou]", to_upper, "hello world")
print(result)   # hEllO wOrld

# Use for complex transformations that can't be expressed as a template string.
def double_digits(m: re.Match) -> str:
    return str(int(m.group(0)) * 2)

print(re.sub(r"\d+", double_digits, "10 cats and 5 dogs"))
# 20 cats and 10 dogs`,
    explanation: "re.sub with a function replacement enables arbitrary per-match transformations. The function receives a Match object and must return a string.",
  },
  {
    id: "py-class-slots-inheritance-bug",
    language: "python",
    title: "slots and multiple inheritance",
    tag: "caveats",
    code: `# When using __slots__ with multiple inheritance, all bases must also have __slots__
# otherwise the child still gets __dict__ from the non-slots parent.

class A:
    __slots__ = ("x",)

class B:
    pass   # has __dict__

class C(A, B):
    __slots__ = ("z",)

c = C()
# C still has __dict__ because B has it.
c.surprise = "unexpected"   # works — __dict__ from B
print(c.surprise)   # unexpected`,
    explanation: "Slots savings disappear if any base class has __dict__. For full benefits, all classes in the MRO must use __slots__. Use object explicitly as the base if needed.",
  },
  {
    id: "py-string-partition",
    language: "python",
    title: "str.partition and str.rpartition",
    tag: "snippet",
    code: `# partition(sep) splits at the FIRST occurrence; returns 3-tuple: (before, sep, after).
text = "host:port/path"
before, sep, after = text.partition(":")
print(before, sep, after)   # host : port/path

# rpartition: split at the LAST occurrence.
left, sep, right = "a.b.c.d".rpartition(".")
print(left, sep, right)     # a.b.c . d

# Unlike split, partition always returns exactly 3 parts.
# If sep not found: ('original', '', '')`,
    explanation: "partition is cleaner than split(sep, 1) for two-part splits. It always returns a 3-tuple so you never get an unexpected-length list.",
  },
  {
    id: "py-abc-mixin-example",
    language: "python",
    title: "ABC mixin with concrete implementation",
    tag: "families",
    code: `from abc import ABC, abstractmethod

class ComparableMixin(ABC):
    @abstractmethod
    def _key(self): ...   # subclasses provide the comparison key

    def __lt__(self, other): return self._key() < other._key()
    def __le__(self, other): return self._key() <= other._key()
    def __gt__(self, other): return self._key() > other._key()
    def __eq__(self, other): return self._key() == other._key()

class Student(ComparableMixin):
    def __init__(self, name, gpa):
        self.name = name; self.gpa = gpa
    def _key(self): return self.gpa

students = [Student("Ada", 3.9), Student("Linus", 4.0), Student("Grace", 3.7)]
print(min(students).name)   # Grace
print(max(students).name)   # Linus`,
    explanation: "An ABC mixin can implement many concrete methods based on a single abstract one. ComparableMixin pattern gives six comparison operators from just _key().",
  },
  {
    id: "py-zip-dict-constructor",
    language: "python",
    title: "dict() from two lists with zip",
    tag: "snippet",
    code: `keys   = ["host", "port", "ssl"]
values = ["localhost", 5432, True]

# dict(zip(keys, values)) pairs them up into a dictionary.
config = dict(zip(keys, values))
print(config)   # {'host': 'localhost', 'port': 5432, 'ssl': True}

# Round-trip: separate a dict into parallel lists.
k, v = zip(*config.items())
print(list(k))   # ['host', 'port', 'ssl']
print(list(v))   # ['localhost', 5432, True]`,
    explanation: "dict(zip(keys, values)) is the idiom for building a dict from two parallel sequences. The reverse — zip(*dict.items()) — unzips it back.",
  },
  {
    id: "py-typing-protocols-callable",
    language: "python",
    title: "Protocol with __call__",
    tag: "types",
    code: `from typing import Protocol

# Use Protocol to type-annotate callable objects (not just plain functions).
class Handler(Protocol):
    def __call__(self, request: str) -> str: ...

def dispatch(route: str, handler: Handler) -> str:
    return handler(route)

def simple_handler(req: str) -> str:
    return f"handled: {req}"

class ClassHandler:
    def __call__(self, req: str) -> str:
        return f"class: {req}"

print(dispatch("/home", simple_handler))    # handled: /home
print(dispatch("/api", ClassHandler()))     # class: /api`,
    explanation: "A Protocol with __call__ lets you accept any callable with a specific signature — plain functions, lambdas, and callable objects all qualify structurally.",
  },
  {
    id: "py-partial-method",
    language: "python",
    title: "partialmethod for class method defaults",
    tag: "classes",
    code: `from functools import partialmethod

class Animal:
    def set_sound(self, sound, volume=50):
        self.sound = sound
        self.volume = volume

    # partialmethod creates a bound partial — works inside class bodies.
    bark  = partialmethod(set_sound, "woof")
    meow  = partialmethod(set_sound, "meow", volume=30)

a = Animal()
a.bark()
print(a.sound, a.volume)   # woof 50

a.meow()
print(a.sound, a.volume)   # meow 30`,
    explanation: "partialmethod is like partial but designed for class bodies. It creates a descriptor that properly handles self-binding when the class is instantiated.",
  },
  {
    id: "py-itemgetter-multi",
    language: "python",
    title: "itemgetter for multi-key sort",
    tag: "snippet",
    code: `from operator import itemgetter

people = [
    {"name": "Ada",   "age": 36, "city": "London"},
    {"name": "Linus", "age": 54, "city": "Portland"},
    {"name": "Grace", "age": 36, "city": "Arlington"},
]

# Sort by age, then by name within the same age.
by_age_name = sorted(people, key=itemgetter("age", "name"))
for p in by_age_name:
    print(p["age"], p["name"])
# 36 Ada
# 36 Grace
# 54 Linus`,
    explanation: "itemgetter with multiple keys returns a tuple, which sorts lexicographically — first key is primary, second is tiebreaker. Faster and more readable than a lambda.",
  },
  {
    id: "py-functools-cache",
    language: "python",
    title: "functools.cache — unbounded memoization",
    tag: "snippet",
    code: `from functools import cache

@cache
def fib(n: int) -> int:
    if n < 2:
        return n
    return fib(n - 1) + fib(n - 2)

print(fib(50))          # fast — results are memoized
print(fib.cache_info()) # CacheInfo(hits=48, misses=51, maxsize=None, currsize=51)`,
    explanation: "functools.cache (Python 3.9+) is an alias for lru_cache(maxsize=None). Use it for pure functions where the argument space is bounded.",
  },
  {
    id: "py-functools-reduce",
    language: "python",
    title: "functools.reduce",
    tag: "snippet",
    code: `from functools import reduce

nums = [1, 2, 3, 4, 5]
total = reduce(lambda acc, x: acc + x, nums, 0)
print(total)  # 15

# Build a nested dict path safely.
nested = {"a": {"b": {"c": 42}}}
keys = ["a", "b", "c"]
value = reduce(lambda d, k: d[k], keys, nested)
print(value)  # 42`,
    explanation: "reduce applies a two-argument function cumulatively across a sequence. Always provide the initializer (third arg) to handle empty sequences safely.",
  },
  {
    id: "py-concurrent-futures",
    language: "python",
    title: "concurrent.futures — thread and process pools",
    tag: "snippet",
    code: `from concurrent.futures import ThreadPoolExecutor, as_completed
import urllib.request

urls = ["https://example.com", "https://python.org"]

def fetch_size(url: str) -> tuple[str, int]:
    with urllib.request.urlopen(url, timeout=5) as r:
        return url, len(r.read())

with ThreadPoolExecutor(max_workers=4) as ex:
    futures = {ex.submit(fetch_size, u): u for u in urls}
    for fut in as_completed(futures):
        url, size = fut.result()
        print(f"{url}: {size} bytes")`,
    explanation: "ThreadPoolExecutor suits I/O-bound work; swap to ProcessPoolExecutor for CPU-bound tasks. as_completed yields futures in completion order, not submission order.",
  },
  {
    id: "py-threading-local",
    language: "python",
    title: "threading.local — per-thread storage",
    tag: "snippet",
    code: `import threading

_local = threading.local()

def worker(name: str) -> None:
    _local.value = name          # each thread gets its own .value
    import time; time.sleep(0.01)
    print(f"{threading.current_thread().name}: {_local.value}")

threads = [threading.Thread(target=worker, args=(f"t{i}",)) for i in range(3)]
for t in threads: t.start()
for t in threads: t.join()`,
    explanation: "threading.local stores data that is isolated per thread — useful for request-scoped state in multi-threaded servers without passing it through every call.",
  },
  {
    id: "py-asyncio-gather",
    language: "python",
    title: "asyncio.gather — run coroutines concurrently",
    tag: "snippet",
    code: `import asyncio

async def fetch(name: str, delay: float) -> str:
    await asyncio.sleep(delay)
    return f"{name} done"

async def main() -> None:
    results = await asyncio.gather(
        fetch("A", 0.3),
        fetch("B", 0.1),
        fetch("C", 0.2),
    )
    print(results)  # ['A done', 'B done', 'C done'] — in submission order

asyncio.run(main())`,
    explanation: "gather runs all coroutines concurrently and returns results in the same order as submitted, regardless of completion order. Pass return_exceptions=True to collect errors instead of raising.",
  },
  {
    id: "py-asyncio-task-group",
    language: "python",
    title: "asyncio.TaskGroup (Python 3.11+)",
    tag: "snippet",
    code: `import asyncio

async def work(n: int) -> int:
    await asyncio.sleep(n * 0.1)
    return n * n

async def main() -> None:
    async with asyncio.TaskGroup() as tg:
        t1 = tg.create_task(work(1))
        t2 = tg.create_task(work(2))
        t3 = tg.create_task(work(3))
    # All tasks done when the block exits.
    print(t1.result(), t2.result(), t3.result())  # 1 4 9

asyncio.run(main())`,
    explanation: "TaskGroup (3.11+) is the structured concurrency primitive: if any task raises, all remaining tasks are cancelled and the exception propagates. Prefer it over bare gather for new code.",
  },
  {
    id: "py-asyncio-timeout",
    language: "python",
    title: "asyncio.timeout (Python 3.11+)",
    tag: "snippet",
    code: `import asyncio

async def slow() -> str:
    await asyncio.sleep(10)
    return "done"

async def main() -> None:
    try:
        async with asyncio.timeout(1.0):
            result = await slow()
    except TimeoutError:
        print("Timed out!")  # prints after ~1 second

asyncio.run(main())`,
    explanation: "asyncio.timeout (3.11+) replaces asyncio.wait_for for explicit timeout scopes. It raises TimeoutError (not asyncio.TimeoutError) on expiry.",
  },
  {
    id: "py-bytes-bytearray",
    language: "python",
    title: "bytes vs bytearray",
    tag: "understanding",
    code: `# bytes — immutable
b = bytes([72, 101, 108, 108, 111])
print(b)           # b'Hello'
# b[0] = 104      # TypeError: bytes is immutable

# bytearray — mutable
ba = bytearray(b"Hello")
ba[0] = 104        # change 'H' to 'h'
print(ba)          # bytearray(b'hello')
print(bytes(ba))   # b'hello'

# Efficient in-place accumulation.
buf = bytearray()
for chunk in [b"abc", b"def"]:
    buf.extend(chunk)
print(buf)  # bytearray(b'abcdef')`,
    explanation: "Use bytes for immutable binary data (dict keys, hashing). Use bytearray when you need to mutate or efficiently build up a buffer in-place.",
  },
  {
    id: "py-memoryview-usage",
    language: "python",
    title: "memoryview — zero-copy buffer access",
    tag: "snippet",
    code: `data = bytearray(b"Hello, World!")
mv = memoryview(data)

# Slice without copying.
print(bytes(mv[7:12]))   # b'World'

# Modify underlying buffer through a writable view.
mv[0:5] = b"Howdy"
print(data)              # bytearray(b'Howdy, World!')

# Works with bytes too (read-only).
ro = memoryview(b"readonly")
print(ro[2:5].tobytes())  # b'ado'`,
    explanation: "memoryview exposes the buffer protocol, allowing slicing and manipulation of bytes/bytearray/array.array data without copying — critical for performance in network and file I/O code.",
  },
  {
    id: "py-io-stringio",
    language: "python",
    title: "io.StringIO — in-memory text stream",
    tag: "snippet",
    code: `import io

# Write to an in-memory buffer.
buf = io.StringIO()
buf.write("line1\n")
buf.write("line2\n")

# Read it back.
buf.seek(0)
print(buf.read())       # line1\nline2\n

# Useful for capturing output.
import sys
capture = io.StringIO()
sys.stdout = capture
print("captured!")
sys.stdout = sys.__stdout__
print(capture.getvalue())  # "captured!\n"`,
    explanation: "StringIO is a file-like object backed by a string, useful for testing code that writes to files or capturing stdout without touching the filesystem.",
  },
  {
    id: "py-pathlib-advanced",
    language: "python",
    title: "pathlib advanced operations",
    tag: "snippet",
    code: `from pathlib import Path

p = Path("/tmp/example/sub/file.txt")

print(p.stem)        # file
print(p.suffix)      # .txt
print(p.parent)      # /tmp/example/sub
print(p.parts)       # ('/', 'tmp', 'example', 'sub', 'file.txt')

# Rename extension.
new_p = p.with_suffix(".bak")
print(new_p)         # /tmp/example/sub/file.bak

# Relative path.
base = Path("/tmp")
print(p.relative_to(base))  # example/sub/file.txt

# Glob pattern.
src = Path("src")
py_files = list(src.rglob("*.py"))`,
    explanation: "pathlib expresses filesystem paths as objects with rich methods. Prefer it over os.path — it is more readable and composes naturally with /.",
  },
  {
    id: "py-csv-dictreader",
    language: "python",
    title: "csv.DictReader — CSV as dicts",
    tag: "snippet",
    code: `import csv, io

data = """name,age,city
Ada,36,London
Linus,54,Portland
"""

reader = csv.DictReader(io.StringIO(data))
for row in reader:
    print(row["name"], row["age"])  # Ada 36 / Linus 54

# Write dicts back.
output = io.StringIO()
writer = csv.DictWriter(output, fieldnames=["name", "age", "city"])
writer.writeheader()
writer.writerow({"name": "Grace", "age": "36", "city": "Arlington"})
print(output.getvalue())`,
    explanation: "DictReader/DictWriter map each CSV row to an OrderedDict keyed by header names, eliminating positional index fragility when columns change.",
  },
  {
    id: "py-json-custom-encoder",
    language: "python",
    title: "Custom JSON encoder",
    tag: "snippet",
    code: `import json
from datetime import date

class DateEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, date):
            return obj.isoformat()
        return super().default(obj)

payload = {"name": "Ada", "born": date(1815, 12, 10)}
print(json.dumps(payload, cls=DateEncoder))
# {"name": "Ada", "born": "1815-12-10"}`,
    explanation: "Override JSONEncoder.default to handle types that aren't natively serializable. Call super().default() at the end so unknown types still raise TypeError correctly.",
  },
  {
    id: "py-dataclass-field",
    language: "python",
    title: "dataclass field() for defaults and metadata",
    tag: "snippet",
    code: `from dataclasses import dataclass, field

@dataclass
class Config:
    host: str = "localhost"
    port: int = 8080
    tags: list[str] = field(default_factory=list)   # mutable default
    _secret: str = field(default="", repr=False, compare=False)

c = Config()
c.tags.append("web")
print(c)  # Config(host='localhost', port=8080, tags=['web'])
# _secret excluded from repr and equality`,
    explanation: "Use field(default_factory=...) for mutable defaults — a bare list default is shared across all instances. repr=False and compare=False fine-tune __repr__ and __eq__.",
  },
  {
    id: "py-dataclass-post-init",
    language: "python",
    title: "dataclass __post_init__ validation",
    tag: "snippet",
    code: `from dataclasses import dataclass

@dataclass
class PositiveInt:
    value: int

    def __post_init__(self) -> None:
        if self.value <= 0:
            raise ValueError(f"value must be positive, got {self.value}")

PositiveInt(5)   # OK
try:
    PositiveInt(-1)
except ValueError as e:
    print(e)  # value must be positive, got -1`,
    explanation: "__post_init__ runs after the generated __init__, giving you a hook for validation or derived-field computation without writing the full __init__ manually.",
  },
  {
    id: "py-dataclass-frozen",
    language: "python",
    title: "Frozen dataclasses — immutable and hashable",
    tag: "snippet",
    code: `from dataclasses import dataclass

@dataclass(frozen=True)
class Point:
    x: float
    y: float

p = Point(1.0, 2.0)
# p.x = 3.0  # FrozenInstanceError

# Frozen dataclasses are hashable — usable in sets and as dict keys.
seen = {Point(0, 0), Point(1, 2), Point(0, 0)}
print(seen)  # {Point(x=0, y=0), Point(x=1, y=2)}`,
    explanation: "frozen=True generates __setattr__ and __delattr__ that raise FrozenInstanceError, and adds __hash__ so the instance can be used in sets and as dict keys.",
  },
  {
    id: "py-typeddict-usage",
    language: "python",
    title: "TypedDict — typed dict shapes",
    tag: "types",
    code: `from typing import TypedDict, NotRequired

class Movie(TypedDict):
    title: str
    year: int
    rating: NotRequired[float]  # optional key

def display(m: Movie) -> str:
    r = m.get("rating", 0.0)
    return f"{m['title']} ({m['year']}) — {r:.1f}"

film: Movie = {"title": "Blade Runner", "year": 1982}
print(display(film))  # Blade Runner (1982) — 0.0`,
    explanation: "TypedDict describes the shape of a plain dict so type checkers validate key names and value types, without any runtime overhead or class instantiation.",
  },
  {
    id: "py-literal-type",
    language: "python",
    title: "Literal type — restrict to specific values",
    tag: "types",
    code: `from typing import Literal

Direction = Literal["north", "south", "east", "west"]

def move(d: Direction, steps: int) -> str:
    return f"Moving {d} {steps} step(s)"

print(move("north", 3))   # OK
# move("up", 1)           # mypy error: Literal['up'] incompatible

Status = Literal[200, 201, 400, 404, 500]
def handle(code: Status) -> str: ...`,
    explanation: "Literal constrains a parameter to a fixed set of values, letting the type checker catch typos and invalid values at analysis time rather than runtime.",
  },
  {
    id: "py-typevar-bound",
    language: "python",
    title: "TypeVar with bound — constrained generics",
    tag: "types",
    code: `from typing import TypeVar
from numbers import Number

N = TypeVar("N", bound=Number)

def double(x: N) -> N:
    return x + x  # type: ignore[operator]

print(double(3))     # 6
print(double(2.5))   # 5.0

# With a class bound.
from typing import TypeVar

class Animal:
    def speak(self) -> str: return "..."

A = TypeVar("A", bound=Animal)

def make_speak(animal: A) -> A:
    print(animal.speak())
    return animal`,
    explanation: "bound=SomeClass means T must be SomeClass or a subclass. The function still returns the same concrete type as its argument, preserving specificity across the call.",
  },
  {
    id: "py-paramspec",
    language: "python",
    title: "ParamSpec — preserve callable signatures",
    tag: "types",
    code: `from typing import Callable, TypeVar
from typing import ParamSpec
import functools

P = ParamSpec("P")
R = TypeVar("R")

def logged(fn: Callable[P, R]) -> Callable[P, R]:
    @functools.wraps(fn)
    def wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
        print(f"calling {fn.__name__}")
        return fn(*args, **kwargs)
    return wrapper

@logged
def add(x: int, y: int) -> int:
    return x + y

add(1, 2)   # type-checked: add still expects (int, int) -> int`,
    explanation: "ParamSpec captures the full parameter list of a callable, so wrappers preserve argument types that TypeVar alone cannot express.",
  },
  {
    id: "py-typing-annotated",
    language: "python",
    title: "Annotated — attach metadata to types",
    tag: "types",
    code: `from typing import Annotated
from dataclasses import dataclass

Positive = Annotated[int, "must be > 0"]
Email = Annotated[str, "RFC-5321 email address"]

@dataclass
class User:
    age: Positive
    email: Email

# At runtime the annotation is just int / str.
import typing
hints = typing.get_type_hints(User, include_extras=True)
print(hints["age"])   # typing.Annotated[int, 'must be > 0']`,
    explanation: "Annotated carries arbitrary metadata alongside a type without affecting runtime behavior. Frameworks like Pydantic and FastAPI read these annotations to add validation or documentation.",
  },
  {
    id: "py-type-narrowing",
    language: "python",
    title: "Type narrowing with isinstance",
    tag: "types",
    code: `def process(value: int | str | list[int]) -> str:
    if isinstance(value, int):
        return f"int: {value}"      # narrowed to int
    elif isinstance(value, str):
        return f"str: {value!r}"   # narrowed to str
    else:
        # narrowed to list[int]
        return f"list sum: {sum(value)}"

print(process(42))         # int: 42
print(process("hi"))       # str: 'hi'
print(process([1, 2, 3]))  # list sum: 6`,
    explanation: "Type checkers understand isinstance checks and narrow the union type within each branch, eliminating false-positive attribute errors for the rest of that block.",
  },
  {
    id: "py-narrowing-assert-never",
    language: "python",
    title: "assert_never for exhaustive union handling",
    tag: "types",
    code: `from typing import assert_never, Literal

Shape = Literal["circle", "square", "triangle"]

def area_label(s: Shape) -> str:
    if s == "circle":
        return "πr²"
    elif s == "square":
        return "s²"
    elif s == "triangle":
        return "½bh"
    else:
        assert_never(s)  # type checker errors if s can still be any value`,
    explanation: "assert_never marks the else branch as unreachable. If you add a new Shape member and forget to handle it, the type checker reports an error at the assert_never call — not at runtime.",
  },
  {
    id: "py-list-vs-deque",
    language: "python",
    title: "list vs deque — O(1) ends",
    tag: "structures",
    code: `from collections import deque
import timeit

# list.insert(0, x) is O(n) — shifts every element.
lst = list(range(100_000))
# deque.appendleft(x) is O(1).
dq = deque(range(100_000))

# Use deque as a fixed-size sliding window.
window = deque(maxlen=3)
for x in range(6):
    window.append(x)
    print(list(window))
# [0] [0,1] [0,1,2] [1,2,3] [2,3,4] [3,4,5]`,
    explanation: "deque provides O(1) appends and pops from both ends. The maxlen parameter makes it self-trimming — perfect for sliding windows and bounded queues.",
  },
  {
    id: "py-defaultdict-nested",
    language: "python",
    title: "Nested defaultdict",
    tag: "structures",
    code: `from collections import defaultdict

# Two-level grouping without KeyError.
def nested_dd():
    return defaultdict(list)

groups: defaultdict = defaultdict(nested_dd)
data = [("fruit", "apple"), ("veg", "carrot"), ("fruit", "banana")]
for category, item in data:
    groups[category]["items"].append(item)

print(dict(groups["fruit"]))   # {'items': ['apple', 'banana']}`,
    explanation: "defaultdict(lambda: defaultdict(list)) creates a two-level dict where missing outer and inner keys are auto-created — useful for building grouped/nested data structures without tedious None checks.",
  },
  {
    id: "py-counter-most-common",
    language: "python",
    title: "Counter.most_common",
    tag: "structures",
    code: `from collections import Counter

words = "the quick brown fox jumps over the lazy dog the".split()
c = Counter(words)

# Top 3 most frequent.
print(c.most_common(3))
# [('the', 3), ('quick', 1), ('brown', 1)]

# Least common: negative slice.
print(c.most_common()[:-4:-1])
# [('dog', 1), ('lazy', 1), ('over', 1)]`,
    explanation: "most_common(n) returns the n highest-count (element, count) pairs using a heap internally — O(n log k) instead of sorting the whole counter.",
  },
  {
    id: "py-counter-arithmetic",
    language: "python",
    title: "Counter arithmetic",
    tag: "structures",
    code: `from collections import Counter

a = Counter({"x": 3, "y": 2, "z": 1})
b = Counter({"x": 1, "y": 4, "w": 2})

print(a + b)   # Counter({'y': 6, 'x': 4, 'w': 2, 'z': 1})
print(a - b)   # Counter({'x': 2, 'z': 1})  — drops negatives
print(a & b)   # Counter({'x': 1, 'y': 2})  — min of each
print(a | b)   # Counter({'y': 4, 'x': 3, 'w': 2, 'z': 1})  — max`,
    explanation: "Counter supports +, -, & (intersection = min), and | (union = max). Subtraction discards zero and negative counts — useful for computing what's left after consumption.",
  },
  {
    id: "py-bisect-module",
    language: "python",
    title: "bisect — maintain sorted lists",
    tag: "snippet",
    code: `import bisect

scores = [60, 70, 80, 90]

# Insert 75 in sorted order.
bisect.insort(scores, 75)
print(scores)  # [60, 70, 75, 80, 90]

# Find insertion point (binary search).
i = bisect.bisect_left(scores, 80)
print(i)       # 3

# Grade cutoffs.
cutoffs = [60, 70, 80, 90]
grades   = ["F", "D", "C", "B", "A"]
def grade(score: int) -> str:
    return grades[bisect.bisect(cutoffs, score)]
print(grade(85))  # B`,
    explanation: "bisect maintains the sorted invariant with O(log n) search and O(n) insert. Use insort sparingly on large lists — prefer a heap or SortedList for frequent insertions.",
  },
  {
    id: "py-chain-from-iterable",
    language: "python",
    title: "itertools.chain.from_iterable — flatten one level",
    tag: "snippet",
    code: `from itertools import chain

nested = [[1, 2], [3, 4], [5]]
flat = list(chain.from_iterable(nested))
print(flat)  # [1, 2, 3, 4, 5]

# Equivalent — but chain.from_iterable is lazy and faster.
flat2 = [x for sub in nested for x in sub]

# Works with any iterables.
words = ["hello", "world"]
chars = list(chain.from_iterable(words))
print(chars)  # ['h','e','l','l','o','w','o','r','l','d']`,
    explanation: "chain.from_iterable lazily flattens one level of nesting from an iterable of iterables. Prefer it over nested comprehensions when the number of inner iterables is large.",
  },
  {
    id: "py-accumulate",
    language: "python",
    title: "itertools.accumulate — running totals",
    tag: "snippet",
    code: `from itertools import accumulate
import operator

nums = [1, 2, 3, 4, 5]

# Running sum (default).
print(list(accumulate(nums)))
# [1, 3, 6, 10, 15]

# Running product.
print(list(accumulate(nums, operator.mul)))
# [1, 2, 6, 24, 120]

# Running maximum.
data = [3, 1, 4, 1, 5, 9, 2, 6]
print(list(accumulate(data, max)))
# [3, 3, 4, 4, 5, 9, 9, 9]`,
    explanation: "accumulate generates an iterator of accumulated values — a lazy, functional replacement for prefix-sum loops. Pass any binary function as the second argument.",
  },
  {
    id: "py-pairwise",
    language: "python",
    title: "itertools.pairwise (Python 3.10+)",
    tag: "snippet",
    code: `from itertools import pairwise

data = [1, 4, 9, 16, 25]

# Compute deltas between adjacent elements.
deltas = [b - a for a, b in pairwise(data)]
print(deltas)  # [3, 5, 7, 9]

# Check that a sequence is sorted.
def is_sorted(seq):
    return all(a <= b for a, b in pairwise(seq))

print(is_sorted([1, 2, 3]))  # True
print(is_sorted([1, 3, 2]))  # False`,
    explanation: "pairwise(iterable) returns overlapping pairs (s[0],s[1]), (s[1],s[2]), ... — cleaner than zip(seq, seq[1:]) and works on any iterable, not just sequences.",
  },
  {
    id: "py-product-itertools",
    language: "python",
    title: "itertools.product — Cartesian product",
    tag: "snippet",
    code: `from itertools import product

# All (row, col) pairs for a 3x3 grid.
for r, c in product(range(3), repeat=2):
    print(r, c, end="  ")
# 0 0  0 1  0 2  1 0  1 1  1 2  2 0  2 1  2 2

# Multiple iterables.
sizes = ["S", "M", "L"]
colors = ["red", "blue"]
for size, color in product(sizes, colors):
    print(f"{size}-{color}")`,
    explanation: "product gives you nested loops as a flat iterator, which is especially useful for parameter sweeps and combinatorial test generation.",
  },
  {
    id: "py-combinations-perms",
    language: "python",
    title: "combinations vs permutations",
    tag: "snippet",
    code: `from itertools import combinations, permutations

items = ["A", "B", "C"]

# Combinations: order doesn't matter, no repetition.
print(list(combinations(items, 2)))
# [('A','B'), ('A','C'), ('B','C')]

# Permutations: order matters.
print(list(permutations(items, 2)))
# [('A','B'), ('A','C'), ('B','A'), ('B','C'), ('C','A'), ('C','B')]

# combinations_with_replacement allows repeated elements.
from itertools import combinations_with_replacement
print(list(combinations_with_replacement("AB", 2)))
# [('A','A'), ('A','B'), ('B','B')]`,
    explanation: "Use combinations for selection problems (choosing a team), permutations for arrangement problems (seating order). The r parameter controls how many to pick.",
  },
  {
    id: "py-zip-longest",
    language: "python",
    title: "itertools.zip_longest — pad shorter iterables",
    tag: "snippet",
    code: `from itertools import zip_longest

a = [1, 2, 3]
b = ["a", "b"]

# Built-in zip stops at the shortest.
print(list(zip(a, b)))           # [(1,'a'), (2,'b')]

# zip_longest pads with fillvalue.
print(list(zip_longest(a, b, fillvalue=None)))
# [(1,'a'), (2,'b'), (3, None)]

print(list(zip_longest(a, b, fillvalue=0)))
# [(1,'a'), (2,'b'), (3, 0)]`,
    explanation: "zip_longest is the correct tool when iterables have different lengths and you need to process all elements from the longest one, not truncate to the shortest.",
  },
  {
    id: "py-f-string-debug",
    language: "python",
    title: "f-string = for quick debugging (Python 3.8+)",
    tag: "snippet",
    code: `x = 42
items = [1, 2, 3]

# The = specifier prints both the expression and its value.
print(f"{x=}")           # x=42
print(f"{items=}")       # items=[1, 2, 3]
print(f"{len(items)=}")  # len(items)=3
print(f"{x * 2 + 1=}")  # x * 2 + 1=85

# Combine with format spec.
pi = 3.14159
print(f"{pi=:.2f}")     # pi=3.14`,
    explanation: "The = specifier inside f-strings echoes the expression text alongside its value — a quick alternative to print(f'x = {x}') during debugging.",
  },
  {
    id: "py-str-removeprefix",
    language: "python",
    title: "str.removeprefix / removesuffix (Python 3.9+)",
    tag: "snippet",
    code: `text = "https://example.com"

# Old approach — fragile if prefix is absent.
if text.startswith("https://"):
    text = text[len("https://"):]

# Clean approach.
stripped = text.removeprefix("https://")
print(stripped)   # example.com

filename = "report_2024.csv"
base = filename.removesuffix(".csv")
print(base)       # report_2024

# No-op when prefix/suffix is absent — no IndexError.
print("hello".removeprefix("xyz"))  # hello`,
    explanation: "removeprefix and removesuffix (3.9+) replace the error-prone lstrip/rstrip approach and clearly express intent: remove exactly this string from the start/end.",
  },
  {
    id: "py-match-sequence",
    language: "python",
    title: "Structural pattern matching on sequences",
    tag: "snippet",
    code: `def describe_list(lst: list) -> str:
    match lst:
        case []:
            return "empty"
        case [x]:
            return f"single: {x}"
        case [x, y]:
            return f"pair: {x}, {y}"
        case [first, *rest]:
            return f"starts with {first}, then {len(rest)} more"

print(describe_list([]))          # empty
print(describe_list([1]))         # single: 1
print(describe_list([1, 2]))      # pair: 1, 2
print(describe_list([1, 2, 3]))   # starts with 1, then 2 more`,
    explanation: "Sequence patterns match lists and tuples by length and element position. The *rest capture collects remaining elements just like unpacking, but inside a match.",
  },
  {
    id: "py-match-guard",
    language: "python",
    title: "Pattern matching with guard clause",
    tag: "snippet",
    code: `def classify(point: tuple[int, int]) -> str:
    match point:
        case (0, 0):
            return "origin"
        case (x, 0) if x > 0:
            return f"positive x-axis at {x}"
        case (0, y) if y > 0:
            return f"positive y-axis at {y}"
        case (x, y) if x == y:
            return f"diagonal at {x}"
        case (x, y):
            return f"general ({x}, {y})"

print(classify((0, 0)))    # origin
print(classify((3, 3)))    # diagonal at 3`,
    explanation: "The if clause after a pattern is a guard — the pattern only matches if the guard expression is also true. Guards allow arbitrary conditions beyond structural shape.",
  },
  {
    id: "py-exception-group",
    language: "python",
    title: "ExceptionGroup (Python 3.11+)",
    tag: "caveats",
    code: `# Raise multiple unrelated exceptions at once.
try:
    raise ExceptionGroup("multiple errors", [
        ValueError("bad value"),
        TypeError("wrong type"),
        RuntimeError("runtime issue"),
    ])
except* ValueError as eg:
    print("ValueError(s):", eg.exceptions)
except* TypeError as eg:
    print("TypeError(s):", eg.exceptions)
# RuntimeError propagates uncaught`,
    explanation: "ExceptionGroup (3.11+) aggregates multiple exceptions into one, and except* handles each type independently — designed for structured concurrency where several tasks can fail simultaneously.",
  },
  {
    id: "py-exception-chaining",
    language: "python",
    title: "Exception chaining with raise...from",
    tag: "caveats",
    code: `class DatabaseError(Exception): pass

def connect(dsn: str) -> None:
    try:
        raise ConnectionError(f"refused: {dsn}")
    except ConnectionError as e:
        raise DatabaseError("cannot connect to DB") from e

try:
    connect("postgres://localhost/app")
except DatabaseError as e:
    print(e)            # cannot connect to DB
    print(e.__cause__)  # refused: postgres://localhost/app`,
    explanation: "raise X from Y sets __cause__ on the new exception, making the original traceback visible. Use it to translate low-level errors to domain-specific ones without losing context.",
  },
  {
    id: "py-try-else",
    language: "python",
    title: "try/else clause — runs only if no exception",
    tag: "caveats",
    code: `def parse_int(s: str) -> int | None:
    try:
        result = int(s)
    except ValueError:
        return None
    else:
        # Only reached when int(s) succeeded — clearer than putting
        # this inside the try block where a ValueError would be caught.
        print(f"Parsed: {result}")
        return result

parse_int("42")    # Parsed: 42 → 42
parse_int("bad")   # → None`,
    explanation: "The else clause of try runs only when no exception was raised in the try block. Putting success-path code there prevents accidentally swallowing exceptions it might itself raise.",
  },
  {
    id: "py-copy-vs-deepcopy",
    language: "python",
    title: "copy vs deepcopy",
    tag: "caveats",
    code: `import copy

original = {"a": [1, 2, 3], "b": {"nested": True}}

# Shallow copy — inner list is shared.
shallow = copy.copy(original)
shallow["a"].append(99)
print(original["a"])   # [1, 2, 3, 99] — mutated!

# Deep copy — fully independent tree.
original2 = {"a": [1, 2, 3], "b": {"nested": True}}
deep = copy.deepcopy(original2)
deep["a"].append(99)
print(original2["a"])  # [1, 2, 3] — unaffected`,
    explanation: "copy.copy creates a new container but shares references to inner objects. copy.deepcopy recursively duplicates the entire object graph — needed whenever inner mutables must be independent.",
  },
  {
    id: "py-slots-memory",
    language: "python",
    title: "__slots__ — reduce per-instance memory",
    tag: "caveats",
    code: `class WithDict:
    def __init__(self, x, y):
        self.x = x
        self.y = y

class WithSlots:
    __slots__ = ("x", "y")
    def __init__(self, x, y):
        self.x = x
        self.y = y

import sys
d = WithDict(1, 2)
s = WithSlots(1, 2)
print(sys.getsizeof(d.__dict__))  # 232 (dict overhead)
# WithSlots has no __dict__ — saves ~200 bytes per instance
# s.z = 3  # AttributeError — slots are fixed`,
    explanation: "__slots__ replaces the per-instance __dict__ with a fixed-size array of descriptors, cutting memory use by 30–60% for classes with many small instances.",
  },
  {
    id: "py-walrus-in-while",
    language: "python",
    title: "Walrus operator in while loop",
    tag: "snippet",
    code: `import re

text = "Error: disk full. Error: network timeout. Done."
pattern = re.compile(r"Error: ([^.]+)")

# Without walrus: call match twice or use a separate variable.
pos = 0
while m := pattern.search(text, pos):
    print(m.group(1))   # disk full  / network timeout
    pos = m.end()`,
    explanation: "The walrus operator (:=) assigns and tests in one expression, eliminating the need to call the function twice or maintain a separate loop variable.",
  },
  {
    id: "py-match-class",
    language: "python",
    title: "Class patterns in structural match",
    tag: "snippet",
    code: `from dataclasses import dataclass

@dataclass
class Point:
    x: float
    y: float

@dataclass
class Circle:
    center: Point
    radius: float

def describe(shape) -> str:
    match shape:
        case Circle(center=Point(x=0, y=0), radius=r):
            return f"circle at origin, r={r}"
        case Circle(center=Point(x=x, y=y), radius=r):
            return f"circle at ({x},{y}), r={r}"
        case _:
            return "unknown"

print(describe(Circle(Point(0, 0), 5)))  # circle at origin, r=5`,
    explanation: "Class patterns match on instance type and attribute values. Dataclasses and named-tuples work seamlessly; arbitrary classes need __match_args__ or keyword patterns.",
  },
  {
    id: "py-gc-module",
    language: "python",
    title: "gc module — garbage collection control",
    tag: "caveats",
    code: `import gc

# Disable automatic GC for a performance-critical section.
gc.disable()
# ... do memory-intensive work ...
gc.enable()

# Manually trigger a collection.
collected = gc.collect()
print(f"Collected {collected} objects")

# Inspect reference cycles.
class Node:
    def __init__(self): self.ref = None

a = Node(); b = Node()
a.ref = b; b.ref = a   # cycle
del a, b
print(gc.collect())    # 2 — found and collected the cycle`,
    explanation: "Python's GC handles reference cycles that CPython's reference counting misses. Disabling it temporarily during batch operations and collecting at a controlled point can reduce GC pause jitter.",
  },
  {
    id: "py-weakref-proxy",
    language: "python",
    title: "weakref.proxy — transparent weak reference",
    tag: "caveats",
    code: `import weakref

class Resource:
    def greet(self) -> str:
        return "hello from Resource"

obj = Resource()
proxy = weakref.proxy(obj)

# Use the proxy like the real object.
print(proxy.greet())   # hello from Resource

del obj
try:
    proxy.greet()
except ReferenceError as e:
    print(e)           # weakly-referenced object no longer exists`,
    explanation: "weakref.proxy wraps an object transparently so the caller doesn't know it's a weak reference — unlike weakref.ref(), you don't need to call it to get the target. Access raises ReferenceError when the target is dead.",
  },
  {
    id: "py-str-maketrans",
    language: "python",
    title: "str.maketrans + translate — fast char substitution",
    tag: "snippet",
    code: `# Build a translation table once, reuse many times.
table = str.maketrans(
    "aeiou",   # from
    "AEIOU",   # to
    " .,!?",   # delete these characters
)

text = "hello, world!"
print(text.translate(table))  # hEllO wOrld

# Remove characters only (no replacement).
remove_digits = str.maketrans("", "", "0123456789")
print("abc123def456".translate(remove_digits))  # abcdef`,
    explanation: "str.maketrans builds a lookup dictionary used by str.translate — a single O(n) pass over the string. Much faster than multiple str.replace calls for many substitutions.",
  },
  {
    id: "py-str-splitlines",
    language: "python",
    title: "splitlines vs split on newline",
    tag: "caveats",
    code: `text = "line1\nline2\r\nline3\rline4"

# split('\n') handles only LF.
print(text.split("\n"))
# ['line1', 'line2\r', 'line3\rline4']  — wrong on Windows/old Mac

# splitlines handles LF, CRLF, CR, and more.
print(text.splitlines())
# ['line1', 'line2', 'line3', 'line4']

# Edge case: trailing newline.
print("a\nb\n".split("\n"))     # ['a', 'b', '']  — extra empty string
print("a\nb\n".splitlines())    # ['a', 'b']       — no trailing empty`,
    explanation: "splitlines correctly handles all Unicode line endings (\\n, \\r\\n, \\r, \\x0b, \\x0c, \\x1c-\\x1e, \\x85, \\u2028, \\u2029) and doesn't produce a trailing empty string.",
  },
  {
    id: "py-enum-iteration",
    language: "python",
    title: "Enum iteration and lookup",
    tag: "snippet",
    code: `from enum import Enum, auto

class Color(Enum):
    RED   = auto()
    GREEN = auto()
    BLUE  = auto()

# Iterate members.
for c in Color:
    print(c.name, c.value)  # RED 1 / GREEN 2 / BLUE 3

# Lookup by value (raises ValueError if not found).
print(Color(2))              # Color.GREEN

# Lookup by name.
print(Color["BLUE"])         # Color.BLUE

# Membership test.
print(Color.RED in Color)    # True`,
    explanation: "Enum members are iterable, and you can look them up by name (bracket syntax) or by value (call syntax). Use auto() when the numeric value doesn't matter.",
  },
  {
    id: "py-logging-config",
    language: "python",
    title: "logging basic configuration",
    tag: "snippet",
    code: `import logging

logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s %(levelname)-8s %(name)s %(message)s",
    datefmt="%H:%M:%S",
)

logger = logging.getLogger(__name__)

logger.debug("debug message")
logger.info("info message")
logger.warning("warning")
logger.error("error", exc_info=True)   # includes traceback`,
    explanation: "Always use a named logger (getLogger(__name__)) rather than the root logger. basicConfig is fine for scripts; for applications use dictConfig or fileConfig for richer control.",
  },
  {
    id: "py-unittest-mock-patch",
    language: "python",
    title: "unittest.mock.patch — replace during tests",
    tag: "snippet",
    code: `from unittest.mock import patch, MagicMock
import json

# Patch 'open' so tests don't touch the filesystem.
m = MagicMock()
m.__enter__ = MagicMock(return_value=MagicMock(
    read=MagicMock(return_value='{"key": "value"}')
))
m.__exit__ = MagicMock(return_value=False)

with patch("builtins.open", return_value=m):
    with open("fake.json") as f:
        data = json.loads(f.read())
    print(data)  # {'key': 'value'}`,
    explanation: "patch replaces the named attribute for the duration of the with block (or decorated function), then restores the original. Always patch where the name is looked up, not where it's defined.",
  },
  {
    id: "py-contextvar",
    language: "python",
    title: "contextvars — async-safe context variables",
    tag: "snippet",
    code: `import asyncio
from contextvars import ContextVar

request_id: ContextVar[str] = ContextVar("request_id", default="none")

async def handler(rid: str) -> None:
    token = request_id.set(rid)   # set for this task only
    await asyncio.sleep(0.01)
    print(f"handler {rid}: sees {request_id.get()}")
    request_id.reset(token)

async def main() -> None:
    await asyncio.gather(handler("req-1"), handler("req-2"))

asyncio.run(main())
# handler req-1: sees req-1
# handler req-2: sees req-2`,
    explanation: "ContextVar provides task-local storage in asyncio: each task inherits a copy of the context from where it was created, and changes don't bleed between concurrent tasks.",
  },
  {
    id: "py-argparse-basics",
    language: "python",
    title: "argparse — command-line argument parsing",
    tag: "snippet",
    code: `import argparse

parser = argparse.ArgumentParser(description="Process files")
parser.add_argument("input",           help="input file path")
parser.add_argument("-o", "--output",  default="out.txt", help="output path")
parser.add_argument("-n", "--count",   type=int, default=10)
parser.add_argument("-v", "--verbose", action="store_true")

# Simulate: script.py data.csv -n 5 -v
args = parser.parse_args(["data.csv", "-n", "5", "-v"])
print(args.input, args.count, args.verbose)
# data.csv 5 True`,
    explanation: "argparse generates --help automatically, performs type conversion, and validates required arguments. Use subparsers for multi-command CLIs.",
  },
  {
    id: "py-re-sub-function",
    language: "python",
    title: "re.sub with a function replacement",
    tag: "snippet",
    code: `import re

def double_numbers(m: re.Match) -> str:
    return str(int(m.group()) * 2)

text = "I have 3 cats and 12 dogs"
result = re.sub(r"\d+", double_numbers, text)
print(result)  # I have 6 cats and 24 dogs

# Useful for template expansion.
env = {"NAME": "Ada", "LANG": "Python"}
tmpl = "Hello, \${NAME}! Welcome to \${LANG}."
expanded = re.sub(r"\$\{(\w+)\}", lambda m: env.get(m.group(1), m.group(0)), tmpl)
print(expanded)  # Hello, Ada! Welcome to Python.`,
    explanation: "When the second argument to re.sub is callable, it receives the match object and must return the replacement string — enabling logic that can't be expressed as a plain string.",
  },
  {
    id: "py-struct-module",
    language: "python",
    title: "struct — pack/unpack binary data",
    tag: "snippet",
    code: `import struct

# Pack two ints and a float into 12 bytes (big-endian).
packed = struct.pack(">iiF", 1, -2, 3.14)
print(len(packed))   # 12
print(packed.hex())  # 000000010000fffe4048f5c3

# Unpack back.
a, b, c = struct.unpack(">iiF", packed)
print(a, b, round(c, 2))  # 1 -2 3.14

# Calcsize for buffer allocation.
print(struct.calcsize(">iiF"))  # 12`,
    explanation: "struct is the standard tool for reading/writing binary file formats and network protocols. The format string encodes byte order (>, <, =) and field types (i=int32, d=float64, s=bytes).",
  },
  {
    id: "py-slots-memory-inherit",
    language: "python",
    title: "__slots__ inheritance pitfall",
    tag: "caveats",
    code: `class Base:
    __slots__ = ("x",)

class Child(Base):
    # Forgetting __slots__ here gives Child a __dict__ again.
    pass

class GoodChild(Base):
    __slots__ = ("y",)   # add only the new slot; inherits x

c = Child(  )
c.x = 1
c.z = 99    # works — Child has __dict__ due to missing __slots__

g = GoodChild()
g.x = 1; g.y = 2
# g.z = 3  # AttributeError — fully slotted`,
    explanation: "Every class in the hierarchy must define __slots__ (even an empty one) for the optimization to hold. A single class without __slots__ re-introduces __dict__ for that class and all its subclasses.",
  },
  {
    id: "py-traceback-module",
    language: "python",
    title: "traceback module — programmatic tracebacks",
    tag: "snippet",
    code: `import traceback, sys

def risky():
    raise ValueError("oops")

try:
    risky()
except ValueError:
    # Format as a list of strings.
    lines = traceback.format_exc()
    print(lines)

    # Or extract structured info.
    exc_type, exc_val, tb = sys.exc_info()
    for frame in traceback.extract_tb(tb):
        print(f"  {frame.filename}:{frame.lineno} in {frame.name}")`,
    explanation: "traceback lets you capture, format, and log exceptions programmatically — useful in frameworks, background workers, and test harnesses that need structured error reporting.",
  },
  {
    id: "py-named-expr-comp",
    language: "python",
    title: "Walrus operator in list comprehensions",
    tag: "snippet",
    code: `import re

lines = [
    "ERROR: disk full",
    "INFO: started",
    "ERROR: timeout",
    "DEBUG: ok",
]

# Extract only the matched groups without calling re.search twice.
errors = [
    m.group(1)
    for line in lines
    if (m := re.search(r"ERROR: (.+)", line))
]
print(errors)  # ['disk full', 'timeout']`,
    explanation: "The walrus operator in a comprehension's if clause lets you use the match object in the value expression, avoiding a redundant second search call.",
  },
  {
    id: "py-batched-itertools",
    language: "python",
    title: "itertools.batched (Python 3.12+)",
    tag: "snippet",
    code: `from itertools import batched

data = range(10)

for chunk in batched(data, 3):
    print(list(chunk))
# [0, 1, 2]
# [3, 4, 5]
# [6, 7, 8]
# [9]          ← last chunk is smaller

# Before 3.12, common recipe:
def chunked(it, n):
    it = iter(it)
    while batch := list(islice(it, n)):
        yield batch`,
    explanation: "batched (3.12+) splits an iterable into fixed-size chunks. The last chunk contains the remainder if the length isn't evenly divisible — no padding.",
  },
  {
    id: "py-format-spec",
    language: "python",
    title: "Format specification mini-language",
    tag: "snippet",
    code: `pi = 3.14159265358979

print(f"{pi:.2f}")       # 3.14        — 2 decimal places
print(f"{pi:10.3f}")     # '     3.142' — 10 wide, 3 decimals
print(f"{pi:>10.2f}")    # '      3.14' — right-aligned
print(f"{pi:<10.2f}")    # '3.14      ' — left-aligned
print(f"{pi:^10.2f}")    # '  3.14    ' — centered
print(f"{pi:0>10.2f}")   # '000003.14'  — zero-filled

n = 1_000_000
print(f"{n:,}")          # 1,000,000   — thousands separator
print(f"{n:_}")          # 1_000_000   — underscore separator
print(f"{255:#010x}")    # 0x000000ff  — hex with prefix, padded`,
    explanation: "The format spec mini-language is the same whether used in f-strings, str.format(), or format(). Learning it eliminates many manual string manipulation steps.",
  },
  {
    id: "py-importlib-reload",
    language: "python",
    title: "importlib.reload — hot-reload a module",
    tag: "caveats",
    code: `import importlib
import mymodule   # initial load

# After changing mymodule.py on disk:
importlib.reload(mymodule)

# Caveats:
# 1. Old references to objects from the module are NOT updated.
old_obj = mymodule.MyClass()   # captured before reload
importlib.reload(mymodule)
# isinstance(old_obj, mymodule.MyClass) is now False
# 2. reload() does not recursively reload dependencies`,
    explanation: "importlib.reload re-executes the module file in the existing module object's namespace, useful for REPL workflows. But old object references become stale — it's not a true hot-swap.",
  },
  {
    id: "py-sys-path-manipulation",
    language: "python",
    title: "sys.path — module search path",
    tag: "caveats",
    code: `import sys

# Current search path.
print(sys.path[:3])

# Insert a directory at the front (highest priority).
sys.path.insert(0, "/home/user/mylibs")

# Append at the end (lowest priority).
sys.path.append("/opt/extra")

# Alternative: use .pth files in site-packages for permanent additions.
# Modifying sys.path in production code is fragile — prefer packaging.`,
    explanation: "sys.path is the list Python searches for modules in order. Mutating it at runtime is a last resort for one-off scripts; virtual environments and proper packaging are the correct long-term solution.",
  },
  {
    id: "py-dataclass-kw-only",
    language: "python",
    title: "dataclass kw_only fields (Python 3.10+)",
    tag: "snippet",
    code: `from dataclasses import dataclass, field, KW_ONLY

@dataclass
class Config:
    host: str
    port: int
    _: KW_ONLY                  # everything after this is keyword-only
    timeout: float = 30.0
    retries: int = 3

c = Config("localhost", 8080, timeout=10.0)
# Config("localhost", 8080, 10.0)  # TypeError — timeout is kw-only`,
    explanation: "KW_ONLY sentinel (3.10+) makes all subsequent fields keyword-only in __init__, preventing accidental positional binding of optional parameters in large dataclasses.",
  },
  {
    id: "py-descriptor-protocol",
    language: "python",
    title: "Descriptor protocol — __get__ / __set__",
    tag: "classes",
    code: `class Validated:
    """Descriptor that enforces a minimum value."""
    def __set_name__(self, owner, name: str) -> None:
        self._name = name

    def __get__(self, obj, objtype=None):
        if obj is None:
            return self
        return obj.__dict__.get(self._name, 0)

    def __set__(self, obj, value: int) -> None:
        if value < 0:
            raise ValueError(f"{self._name} must be >= 0")
        obj.__dict__[self._name] = value

class Account:
    balance = Validated()

a = Account()
a.balance = 100
print(a.balance)   # 100
# a.balance = -1  # ValueError`,
    explanation: "Descriptors implement __get__/__set__/__delete__ and are used to add managed attribute behavior to classes. They power Python's property, classmethod, and staticmethod under the hood.",
  },
  {
    id: "py-metaclass-basics",
    language: "python",
    title: "Metaclass basics",
    tag: "classes",
    code: `class SingletonMeta(type):
    _instances: dict = {}

    def __call__(cls, *args, **kwargs):
        if cls not in cls._instances:
            cls._instances[cls] = super().__call__(*args, **kwargs)
        return cls._instances[cls]

class Config(metaclass=SingletonMeta):
    def __init__(self):
        self.value = 42

c1 = Config()
c2 = Config()
print(c1 is c2)  # True — same instance`,
    explanation: "Metaclasses are the 'class of a class'. They intercept class creation and instantiation. Use them for framework-level concerns like ORMs, plugin registries, and singleton enforcement.",
  },
  {
    id: "py-abstract-property",
    language: "python",
    title: "Abstract property with ABC",
    tag: "classes",
    code: `from abc import ABC, abstractmethod

class Shape(ABC):
    @property
    @abstractmethod
    def area(self) -> float: ...

    @property
    @abstractmethod
    def perimeter(self) -> float: ...

class Circle(Shape):
    def __init__(self, r: float):
        self.r = r

    @property
    def area(self) -> float:
        return 3.14159 * self.r ** 2

    @property
    def perimeter(self) -> float:
        return 2 * 3.14159 * self.r

print(Circle(5).area)  # 78.53...`,
    explanation: "Combining @property with @abstractmethod requires subclasses to provide both getter behavior and the property descriptor — preventing accidental attribute access on the base class.",
  },
  {
    id: "py-classmethod-factory",
    language: "python",
    title: "classmethod as alternative constructor",
    tag: "classes",
    code: `class Date:
    def __init__(self, year: int, month: int, day: int):
        self.year, self.month, self.day = year, month, day

    @classmethod
    def from_iso(cls, s: str) -> "Date":
        parts = s.split("-")
        return cls(int(parts[0]), int(parts[1]), int(parts[2]))

    @classmethod
    def today(cls) -> "Date":
        import datetime
        d = datetime.date.today()
        return cls(d.year, d.month, d.day)

    def __repr__(self) -> str:
        return f"Date({self.year}, {self.month}, {self.day})"

print(Date.from_iso("2024-05-06"))  # Date(2024, 5, 6)`,
    explanation: "classmethod receives the class (not the instance) as the first argument, making it the idiomatic way to create alternative constructors that work correctly with subclasses.",
  },
  {
    id: "py-slots-vs-dict-bench",
    language: "python",
    title: "__slots__ vs __dict__ — practical comparison",
    tag: "understanding",
    code: `import sys

class WithDict:
    def __init__(self, x, y, z):
        self.x, self.y, self.z = x, y, z

class WithSlots:
    __slots__ = ("x", "y", "z")
    def __init__(self, x, y, z):
        self.x, self.y, self.z = x, y, z

d = WithDict(1, 2, 3)
s = WithSlots(1, 2, 3)

# On CPython: d takes ~184 + 232 bytes = ~416 bytes
# s takes ~72 bytes — no __dict__
print(sys.getsizeof(d) + sys.getsizeof(d.__dict__))
print(sys.getsizeof(s))`,
    explanation: "Slots eliminate the per-instance __dict__ dictionary, reducing memory by ~5x for objects with a fixed attribute set. The trade-off: no dynamic attribute assignment and trickier multiple inheritance.",
  },
  {
    id: "py-mixin-composition",
    language: "python",
    title: "Mixin composition pattern",
    tag: "classes",
    code: `class LogMixin:
    def log(self, msg: str) -> None:
        print(f"[{self.__class__.__name__}] {msg}")

class SerializeMixin:
    def to_dict(self) -> dict:
        return {k: v for k, v in self.__dict__.items()
                if not k.startswith("_")}

class User(LogMixin, SerializeMixin):
    def __init__(self, name: str, age: int):
        self.name, self.age = name, age

    def greet(self) -> None:
        self.log(f"Hello, I am {self.name}")

u = User("Ada", 36)
u.greet()
print(u.to_dict())   # {'name': 'Ada', 'age': 36}`,
    explanation: "Mixins are small classes that add a specific behavior without being intended for standalone use. They rely on cooperative multiple inheritance — the target class must provide any attributes the mixin references.",
  },
  {
    id: "py-super-cooperative",
    language: "python",
    title: "super() in cooperative multiple inheritance",
    tag: "classes",
    code: `class A:
    def greet(self) -> str:
        return "A"

class B(A):
    def greet(self) -> str:
        return "B->" + super().greet()

class C(A):
    def greet(self) -> str:
        return "C->" + super().greet()

class D(B, C):
    def greet(self) -> str:
        return "D->" + super().greet()

print(D().greet())      # D->B->C->A
print(D.__mro__)        # D, B, C, A, object`,
    explanation: "super() uses the MRO (Method Resolution Order) to find the next class in the chain. This ensures each class in a diamond hierarchy is called exactly once — the foundation of cooperative multiple inheritance.",
  },
  {
    id: "py-dunder-comparison",
    language: "python",
    title: "__lt__ and total_ordering",
    tag: "classes",
    code: `from functools import total_ordering

@total_ordering
class Temperature:
    def __init__(self, celsius: float):
        self.celsius = celsius

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, Temperature):
            return NotImplemented
        return self.celsius == other.celsius

    def __lt__(self, other: "Temperature") -> bool:
        return self.celsius < other.celsius

temps = [Temperature(100), Temperature(0), Temperature(37)]
print(sorted(temps)[0].celsius)  # 0
print(Temperature(20) <= Temperature(30))  # True`,
    explanation: "@total_ordering generates __le__, __gt__, __ge__ from __eq__ and __lt__ alone. Return NotImplemented (not False) for unsupported types so Python can try the reflected operation.",
  },
  {
    id: "py-dunder-hash",
    language: "python",
    title: "__hash__ and equality contract",
    tag: "caveats",
    code: `class Point:
    def __init__(self, x: int, y: int):
        self.x, self.y = x, y

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, Point):
            return NotImplemented
        return (self.x, self.y) == (other.x, other.y)

    # Must define __hash__ when __eq__ is defined.
    def __hash__(self) -> int:
        return hash((self.x, self.y))

# Without __hash__, Point cannot be used in sets or as dict keys.
s = {Point(0, 0), Point(1, 2), Point(0, 0)}
print(len(s))  # 2`,
    explanation: "Defining __eq__ automatically sets __hash__ to None in Python 3, making the class unhashable. If objects must be usable as dict keys or set members, define __hash__ using the same fields as __eq__.",
  },
  {
    id: "py-context-manager-class",
    language: "python",
    title: "Context manager via __enter__ / __exit__",
    tag: "classes",
    code: `class Timer:
    import time

    def __enter__(self):
        self._start = self.time.perf_counter()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        elapsed = self.time.perf_counter() - self._start
        print(f"Elapsed: {elapsed:.4f}s")
        return False   # don't suppress exceptions

with Timer() as t:
    total = sum(range(1_000_000))
# Elapsed: 0.0412s (approximate)`,
    explanation: "__enter__ sets up the resource and returns it (often self). __exit__ tears it down; returning True suppresses any exception. Returning False (or None) re-raises the exception.",
  },
  {
    id: "py-generator-send",
    language: "python",
    title: "Generator send() — two-way communication",
    tag: "snippet",
    code: `def accumulator():
    total = 0
    while True:
        value = yield total   # yield sends total out, receives next value
        if value is None:
            break
        total += value

gen = accumulator()
next(gen)           # prime the generator
gen.send(10)        # total = 10
gen.send(20)        # total = 30
result = gen.send(5)
print(result)       # 35`,
    explanation: "yield is an expression — its value is whatever was passed via send(). The generator must be primed with next() (or send(None)) before the first send() call.",
  },
  {
    id: "py-generator-throw",
    language: "python",
    title: "Generator throw() — inject exceptions",
    tag: "snippet",
    code: `def safe_gen():
    try:
        while True:
            value = yield
    except GeneratorExit:
        print("Generator closed")
    except ValueError as e:
        print(f"ValueError received: {e}")
        yield "recovered"

gen = safe_gen()
next(gen)
result = gen.throw(ValueError, "bad input")
print(result)   # recovered
gen.close()     # Generator closed`,
    explanation: "throw(exc_type, value) raises an exception at the yield point. If the generator catches it and yields again, throw() returns that value. close() sends GeneratorExit, which triggers cleanup.",
  },
  {
    id: "py-yield-from",
    language: "python",
    title: "yield from — delegate to sub-generator",
    tag: "snippet",
    code: `def inner():
    yield 1
    yield 2

def outer():
    yield 0
    yield from inner()   # delegates to inner, passes through send/throw
    yield 3

print(list(outer()))  # [0, 1, 2, 3]

# Also flattens nested iterables.
def flatten(nested):
    for item in nested:
        if isinstance(item, list):
            yield from flatten(item)
        else:
            yield item

print(list(flatten([1, [2, [3, 4]], 5])))  # [1, 2, 3, 4, 5]`,
    explanation: "yield from delegates to a sub-generator, transparently forwarding send(), throw(), and close() calls. It's also the building block for asyncio coroutines prior to async/await syntax.",
  },
  {
    id: "py-async-generator",
    language: "python",
    title: "Async generators",
    tag: "snippet",
    code: `import asyncio

async def ticker(n: int):
    for i in range(n):
        await asyncio.sleep(0.01)
        yield i

async def main():
    async for value in ticker(5):
        print(value)   # 0 1 2 3 4

asyncio.run(main())`,
    explanation: "An async generator function uses both async def and yield. It can only be iterated with async for or aiter/anext. It cannot use return with a value.",
  },
  {
    id: "py-typing-protocols-runtime",
    language: "python",
    title: "Runtime-checkable Protocol",
    tag: "types",
    code: `from typing import Protocol, runtime_checkable

@runtime_checkable
class Drawable(Protocol):
    def draw(self) -> None: ...

class Circle:
    def draw(self) -> None:
        print("Drawing circle")

class Square:
    def draw(self) -> None:
        print("Drawing square")

class Text:
    def render(self) -> None:  # different method name
        pass

def render_all(items: list[Drawable]) -> None:
    for item in items:
        item.draw()

print(isinstance(Circle(), Drawable))  # True
print(isinstance(Text(),   Drawable))  # False`,
    explanation: "@runtime_checkable allows isinstance() checks against a Protocol at runtime — useful for dynamic dispatch without inheritance. Static type checking still validates structural compatibility.",
  },
  {
    id: "py-overloaded-function",
    language: "python",
    title: "@overload — type-level function overloads",
    tag: "types",
    code: `from typing import overload, Union

@overload
def process(x: int) -> int: ...
@overload
def process(x: str) -> str: ...

def process(x: Union[int, str]) -> Union[int, str]:
    if isinstance(x, int):
        return x * 2
    return x.upper()

result_int: int = process(5)    # type checker knows: int
result_str: str = process("hi") # type checker knows: str`,
    explanation: "@overload teaches the type checker which output type corresponds to each input type. Only the last (implementation) overload is called at runtime — the @overload stubs are type-information only.",
  },
  {
    id: "py-pep695-type-aliases",
    language: "python",
    title: "PEP 695 type aliases (Python 3.12+)",
    tag: "types",
    code: `# Python 3.12+ — new 'type' statement for type aliases.
type Vector = list[float]
type Matrix = list[Vector]

def dot(a: Vector, b: Vector) -> float:
    return sum(x * y for x, y in zip(a, b))

v1: Vector = [1.0, 2.0, 3.0]
v2: Vector = [4.0, 5.0, 6.0]
print(dot(v1, v2))   # 32.0

# Before 3.12: use TypeAlias annotation.
from typing import TypeAlias
OldVector: TypeAlias = list[float]`,
    explanation: "The type statement (3.12+) creates a transparent type alias that is fully understood by type checkers. Unlike TypeAlias, it supports forward references and generic parameters natively.",
  },
  {
    id: "py-pep695-generics",
    language: "python",
    title: "PEP 695 generic functions (Python 3.12+)",
    tag: "types",
    code: `# Python 3.12+ — new syntax for generic functions.
def first[T](items: list[T]) -> T:
    return items[0]

def zip_pairs[A, B](a: list[A], b: list[B]) -> list[tuple[A, B]]:
    return list(zip(a, b))

print(first([1, 2, 3]))           # 1
print(zip_pairs([1, 2], ["a", "b"]))  # [(1, 'a'), (2, 'b')]

# Before 3.12: T = TypeVar("T"); def first(items: list[T]) -> T: ...`,
    explanation: "PEP 695 (3.12+) introduces the [T] syntax for declaring type parameters on functions and classes, eliminating the verbose TypeVar() boilerplate while preserving full static type checking.",
  },
  {
    id: "py-string-interning",
    language: "python",
    title: "String interning and identity vs equality",
    tag: "caveats",
    code: `# CPython interns short strings that look like identifiers.
a = "hello"
b = "hello"
print(a is b)   # True — interned (implementation detail!)

# Long or computed strings may NOT be interned.
c = "hello world"
d = "hello world"
print(c is d)   # False (or True — implementation-dependent)

# Never use 'is' to compare strings — use '=='.
# Explicit interning for performance (e.g., large symbol tables).
import sys
x = sys.intern("my_module.MyClass.method_name")`,
    explanation: "CPython automatically interns short strings that look like identifiers, but this is an implementation detail. Always use == for string comparison — is checks object identity, not value.",
  },
  {
    id: "py-int-caching",
    language: "python",
    title: "Small integer caching pitfall",
    tag: "caveats",
    code: `# CPython caches integers from -5 to 256 as singletons.
a, b = 100, 100
print(a is b)   # True — same cached object

c, d = 1000, 1000
print(c is d)   # False in most contexts (implementation detail)

# Interactive REPL may compile both as a constant, making it True.
# Never rely on 'is' for integer equality — always use '=='.
x = 1000
y = 1000
print(x == y)   # always True
print(x is y)   # unreliable`,
    explanation: "CPython pre-allocates integer objects for -5 through 256 so is comparisons 'work' in that range. This is an implementation detail that varies by Python version and context — use == for value comparison.",
  },
  {
    id: "py-mutable-default-arg",
    language: "python",
    title: "Mutable default argument pitfall",
    tag: "caveats",
    code: `# THE classic Python gotcha.
def append_to(element, to=[]):   # 'to' is created ONCE
    to.append(element)
    return to

print(append_to(1))  # [1]
print(append_to(2))  # [1, 2] — same list object reused!

# Correct fix: use None as sentinel.
def append_safe(element, to=None):
    if to is None:
        to = []
    to.append(element)
    return to

print(append_safe(1))  # [1]
print(append_safe(2))  # [2] — new list each time`,
    explanation: "Default argument values are evaluated once when the function is defined, not each time it's called. Mutable defaults (list, dict, set) are shared across all calls that use the default.",
  },
  {
    id: "py-closure-loop-pitfall",
    language: "python",
    title: "Closure in loop variable pitfall",
    tag: "caveats",
    code: `# Broken — all closures capture the same 'i' variable.
funcs_bad = [lambda: i for i in range(5)]
print([f() for f in funcs_bad])  # [4, 4, 4, 4, 4]

# Fix 1: default argument captures value by binding.
funcs_good = [lambda i=i: i for i in range(5)]
print([f() for f in funcs_good])  # [0, 1, 2, 3, 4]

# Fix 2: use a factory function (explicit closure).
def make_fn(i):
    return lambda: i
funcs_factory = [make_fn(i) for i in range(5)]
print([f() for f in funcs_factory])  # [0, 1, 2, 3, 4]`,
    explanation: "Closures capture variables by reference, not by value. When the loop variable changes, all closures see the new value. Capturing via a default argument or a factory function freezes the value at definition time.",
  },
  {
    id: "py-late-binding",
    language: "python",
    title: "Late binding in closures",
    tag: "caveats",
    code: `x = 10

def outer():
    def inner():
        return x   # x looked up at CALL time, not at definition time
    return inner

fn = outer()
x = 99
print(fn())   # 99 — sees the modified x

# Immediate binding: capture with default argument.
def outer2():
    def inner(x=x):   # x bound at definition time
        return x
    return inner

fn2 = outer2()
x = 200
print(fn2())  # 99 — captured at definition, not affected by later change`,
    explanation: "Python closures look up free variables at call time, not at definition time. This is usually intuitive but surprising in loops or when the enclosing scope variable changes later.",
  },
  {
    id: "py-global-nonlocal",
    language: "python",
    title: "global and nonlocal declarations",
    tag: "snippet",
    code: `count = 0

def increment():
    global count   # refers to module-level 'count'
    count += 1

def make_counter():
    n = 0
    def tick():
        nonlocal n   # refers to enclosing function's 'n'
        n += 1
        return n
    return tick

counter = make_counter()
print(counter(), counter())  # 1 2`,
    explanation: "global rebinds a name to the module scope. nonlocal rebinds to the nearest enclosing function scope. Without these declarations, assignment creates a new local variable, shadowing the outer one.",
  },
  {
    id: "py-unpacking-generalized",
    language: "python",
    title: "Generalized unpacking (PEP 448)",
    tag: "snippet",
    code: `a = [1, 2, 3]
b = [4, 5]

# Merge sequences.
merged = [*a, *b, 6]
print(merged)  # [1, 2, 3, 4, 5, 6]

# Merge dicts — later keys win.
d1 = {"x": 1, "y": 2}
d2 = {"y": 99, "z": 3}
combined = {**d1, **d2}
print(combined)  # {'x': 1, 'y': 99, 'z': 3}

# In function calls.
def f(a, b, c, d): return (a, b, c, d)
print(f(*a, *b))   # (1, 2, 3, 4)`,
    explanation: "PEP 448 (Python 3.5+) allows * and ** in literals and function calls, enabling clean merging of sequences and dicts without explicit concatenation or dict.update().",
  },
  {
    id: "py-assignment-expression-walrus",
    language: "python",
    title: "Walrus operator patterns and scope",
    tag: "snippet",
    code: `# Walrus in if — avoids double evaluation.
import re
text = "Error 404: not found"
if m := re.search(r"Error (\d+)", text):
    print(m.group(1))   # 404

# Walrus in while — read until sentinel.
data = iter([1, 2, 3, None, 5])
while (val := next(data)) is not None:
    print(val)   # 1 2 3

# Scope: walrus leaks into the enclosing scope (unlike loop variables in
# comprehensions — which are isolated).
result = [y := x + 1 for x in range(3)]
print(y)   # 3 — last assigned value leaks`,
    explanation: "The walrus operator (:=) assigns and returns a value in a single expression. In comprehensions, the assigned name leaks into the enclosing scope — a gotcha that differs from normal comprehension variable scoping.",
  },
  {
    id: "py-class-decorators",
    language: "python",
    title: "Class decorators",
    tag: "classes",
    code: `def add_repr(cls):
    """Add __repr__ that lists all instance attributes."""
    def __repr__(self):
        attrs = ", ".join(f"{k}={v!r}" for k, v in self.__dict__.items())
        return f"{cls.__name__}({attrs})"
    cls.__repr__ = __repr__
    return cls

@add_repr
class Point:
    def __init__(self, x, y):
        self.x, self.y = x, y

print(Point(1, 2))   # Point(x=1, y=2)`,
    explanation: "A class decorator takes a class and returns a class (or a replacement). It's a lighter alternative to metaclasses for adding or modifying behavior at class definition time.",
  },
  {
    id: "py-__init_subclass__",
    language: "python",
    title: "__init_subclass__ — hook on inheritance",
    tag: "classes",
    code: `class Registry:
    _registry: dict = {}

    def __init_subclass__(cls, tag: str | None = None, **kwargs):
        super().__init_subclass__(**kwargs)
        if tag:
            Registry._registry[tag] = cls

class Handler(Registry, tag="http"):
    def handle(self): return "HTTP"

class WsHandler(Registry, tag="ws"):
    def handle(self): return "WebSocket"

print(Registry._registry)
# {'http': <class 'Handler'>, 'ws': <class 'WsHandler'>}`,
    explanation: "__init_subclass__ is called on the base class whenever a new subclass is defined, optionally with keyword arguments from the class statement. It's the clean alternative to metaclasses for plugin/registry patterns.",
  },
  {
    id: "py-dataclass-inheritance",
    language: "python",
    title: "Dataclass inheritance rules",
    tag: "caveats",
    code: `from dataclasses import dataclass

@dataclass
class Base:
    x: int = 0
    y: int = 0

# Child must not declare a field without a default if Base has defaults.
# This would fail: @dataclass class Bad(Base): z: int
@dataclass
class Child(Base):
    z: int = 0   # OK — has default

c = Child(x=1, y=2, z=3)
print(c)   # Child(x=1, y=2, z=3)`,
    explanation: "Dataclass inheritance places child fields after parent fields in __init__. A field without a default cannot follow a field with a default — the same rule as regular function parameters.",
  },
  {
    id: "py-named-tuple-methods",
    language: "python",
    title: "NamedTuple with methods",
    tag: "snippet",
    code: `from typing import NamedTuple

class Point(NamedTuple):
    x: float
    y: float

    def distance(self, other: "Point") -> float:
        return ((self.x - other.x)**2 + (self.y - other.y)**2) ** 0.5

    def __add__(self, other: "Point") -> "Point":
        return Point(self.x + other.x, self.y + other.y)

p1 = Point(0, 0)
p2 = Point(3, 4)
print(p1.distance(p2))  # 5.0
print(p1 + p2)          # Point(x=3, y=4)`,
    explanation: "Typing.NamedTuple allows adding methods to named tuples while keeping immutability, tuple unpacking, and positional indexing. It's cleaner than collections.namedtuple for typed code.",
  },
  {
    id: "py-enum-auto-custom",
    language: "python",
    title: "Enum with custom auto() values",
    tag: "snippet",
    code: `from enum import Enum, auto

class Color(Enum):
    def _generate_next_value_(name, start, count, last_values):
        return name.lower()   # use lowercase name as value

    RED   = auto()
    GREEN = auto()
    BLUE  = auto()

print(Color.RED.value)    # red
print(Color.GREEN.value)  # green

# StrEnum (Python 3.11+) — enum members are strings.
from enum import StrEnum
class Direction(StrEnum):
    NORTH = auto()  # value = "north"
    SOUTH = auto()`,
    explanation: "Override _generate_next_value_ to customize what auto() produces. StrEnum (3.11+) makes members actual strings — useful for JSON keys, HTTP methods, and config values.",
  },
  {
    id: "py-class-slots-props",
    language: "python",
    title: "Properties in classes with __slots__",
    tag: "caveats",
    code: `class Circle:
    __slots__ = ("_radius",)   # note: private slot for backing store

    def __init__(self, radius: float):
        self._radius = radius

    @property
    def radius(self) -> float:
        return self._radius

    @radius.setter
    def radius(self, value: float) -> None:
        if value < 0:
            raise ValueError("radius must be non-negative")
        self._radius = value

c = Circle(5)
c.radius = 10
print(c.radius)   # 10`,
    explanation: "When using __slots__ with properties, the backing attribute must be in __slots__ (typically with a private name like _radius). The property descriptor itself lives on the class, not in slots.",
  },
  {
    id: "py-collections-abc",
    language: "python",
    title: "collections.abc — abstract base classes",
    tag: "types",
    code: `from collections.abc import (
    Sequence, MutableSequence, Mapping,
    Iterable, Iterator, Callable
)

def process(items: Iterable[int]) -> list[int]:
    return [x * 2 for x in items]

# Accept any sequence (list, tuple, range, str, etc.)
def first(s: Sequence) -> object:
    return s[0]

# Type-check an object dynamically.
print(isinstance([1, 2], MutableSequence))  # True
print(isinstance((1, 2), MutableSequence))  # False (tuple is immutable)`,
    explanation: "collections.abc provides abstract base classes for container types. Use them in type hints to accept the broadest compatible type — Iterable over list, Mapping over dict — improving API flexibility.",
  },
  {
    id: "py-enum-flags",
    language: "python",
    title: "Flag enum — bitmask in Python",
    tag: "snippet",
    code: `from enum import Flag, auto

class Permission(Flag):
    READ    = auto()   # 1
    WRITE   = auto()   # 2
    EXECUTE = auto()   # 4
    ALL     = READ | WRITE | EXECUTE

user_perms = Permission.READ | Permission.WRITE
print(user_perms)                        # Permission.READ|WRITE
print(Permission.READ in user_perms)     # True
print(Permission.EXECUTE in user_perms)  # False

# Remove a flag.
user_perms &= ~Permission.WRITE
print(user_perms)   # Permission.READ`,
    explanation: "Flag enum supports bitwise operations (&, |, ~, ^) and membership testing with in. It's the Pythonic equivalent of C's bitmask enum patterns — no manual power-of-two constants needed.",
  },
  {
    id: "py-typing-self",
    language: "python",
    title: "Self type — fluent interfaces (Python 3.11+)",
    tag: "types",
    code: `from typing import Self

class Builder:
    def __init__(self) -> None:
        self._parts: list[str] = []

    def add(self, part: str) -> Self:
        self._parts.append(part)
        return self

    def build(self) -> str:
        return " ".join(self._parts)

class ExtBuilder(Builder):
    def add_header(self, h: str) -> Self:
        return self.add(f"[{h}]")

# Chaining returns ExtBuilder, not Builder.
result = ExtBuilder().add_header("INFO").add("message").build()
print(result)   # [INFO] message`,
    explanation: "Self (3.11+) represents the type of the current class in annotations, making fluent builder patterns type-safe across inheritance — subclass methods correctly return the subclass type.",
  },
  {
    id: "py-typing-unpack",
    language: "python",
    title: "TypeVarTuple and Unpack — variadic generics",
    tag: "types",
    code: `from typing import TypeVarTuple, Unpack, TypeVar

Ts = TypeVarTuple("Ts")
T  = TypeVar("T")

def first_of_each(*args: Unpack[Ts]) -> tuple[Unpack[Ts]]:
    return args

# Type checker knows the exact types of each element.
result = first_of_each(1, "hello", 3.14)
# result: tuple[int, str, float]
print(result)  # (1, 'hello', 3.14)`,
    explanation: "TypeVarTuple (3.11+) enables variadic generics — generic functions where the number and types of type arguments vary. Used in NumPy-style array shape typing and typed *args unpacking.",
  },
  {
    id: "py-array-module",
    language: "python",
    title: "array module — typed arrays",
    tag: "structures",
    code: `import array

# 'i' = signed int, 'd' = double, 'B' = unsigned char
arr = array.array("i", [1, 2, 3, 4, 5])
print(arr)            # array('i', [1, 2, 3, 4, 5])
print(arr[2])         # 3
arr.append(6)
arr.extend([7, 8])

# Efficient file I/O.
import io
buf = io.BytesIO()
arr.tofile(buf)
print(len(buf.getvalue()))   # 32 bytes (8 × 4 bytes)`,
    explanation: "array.array stores a homogeneous sequence of C-typed values without Python object overhead — 4–8× more memory-efficient than a list of ints or floats for large numeric data.",
  },
  {
    id: "py-cprofile-usage",
    language: "python",
    title: "cProfile — built-in profiler",
    tag: "snippet",
    code: `import cProfile, pstats, io

def slow():
    return sum(i**2 for i in range(100_000))

pr = cProfile.Profile()
pr.enable()
slow()
pr.disable()

s = io.StringIO()
ps = pstats.Stats(pr, stream=s).sort_stats("cumulative")
ps.print_stats(5)   # top 5 functions by cumulative time
print(s.getvalue())`,
    explanation: "cProfile is a deterministic C-level profiler with low overhead. Sort by cumulative to find hot call paths; by tottime to isolate individual function cost. Use snakeviz for a visual flame chart.",
  },
  {
    id: "py-timeit-module",
    language: "python",
    title: "timeit — micro-benchmarking",
    tag: "snippet",
    code: `import timeit

# Quick command-line style.
t1 = timeit.timeit("[x**2 for x in range(100)]", number=10_000)
t2 = timeit.timeit("list(map(lambda x: x**2, range(100)))", number=10_000)
print(f"listcomp: {t1:.4f}s")
print(f"map:      {t2:.4f}s")

# With setup code.
t3 = timeit.timeit(
    stmt="sorted(data)",
    setup="data = list(range(1000, 0, -1))",
    number=1000,
)
print(f"sort: {t3:.4f}s")`,
    explanation: "timeit runs a snippet many times (number=) to average out OS noise, disabling garbage collection between runs. Always benchmark with realistic data size — micro-benchmark results do not always scale.",
  },
  {
    id: "py-decimal-module",
    language: "python",
    title: "decimal — exact decimal arithmetic",
    tag: "snippet",
    code: `from decimal import Decimal, getcontext

# Floating-point pitfall.
print(0.1 + 0.2)              # 0.30000000000000004

# Exact decimal.
print(Decimal("0.1") + Decimal("0.2"))  # 0.3

# Set precision globally.
getcontext().prec = 50
result = Decimal(1) / Decimal(7)
print(result)  # 0.14285714285714285714285714285714285714285714285714

# Rounding modes.
print(Decimal("2.675").quantize(Decimal("0.01")))  # 2.68`,
    explanation: "The decimal module provides exact base-10 arithmetic — essential for financial calculations where floating-point rounding errors are unacceptable. Set precision and rounding mode explicitly for deterministic behavior.",
  },
  {
    id: "py-fractions-module",
    language: "python",
    title: "fractions.Fraction — exact rational arithmetic",
    tag: "snippet",
    code: `from fractions import Fraction

a = Fraction(1, 3)
b = Fraction(1, 6)

print(a + b)     # 1/2
print(a * b)     # 1/18
print(a / b)     # 2
print(float(a))  # 0.3333333333333333

# Fraction from float (may surprise you).
print(Fraction(0.1))  # 3602879701896397/36028797018963968
# Fraction from string is exact.
print(Fraction("0.1"))  # 1/10`,
    explanation: "Fraction stores numerator and denominator as exact integers and performs arithmetic without rounding. Converting from float first converts the binary representation — always pass a string or integer for exact values.",
  },
  {
    id: "py-statistics-module",
    language: "python",
    title: "statistics module — descriptive stats",
    tag: "snippet",
    code: `import statistics as stats

data = [4, 8, 15, 16, 23, 42]

print(stats.mean(data))           # 18.0
print(stats.median(data))         # 15.5
print(stats.stdev(data))          # 13.277...  (sample std dev)
print(stats.pstdev(data))         # 12.123...  (population std dev)
print(stats.variance(data))       # 176.33...
print(stats.quantiles(data, n=4)) # [7.5, 15.5, 25.25] — quartiles`,
    explanation: "The statistics module provides correct implementations of common descriptive statistics. Use pstdev/pvariance when you have the full population; stdev/variance when working with a sample.",
  },
  {
    id: "py-pathlib-write-text",
    language: "python",
    title: "pathlib read/write convenience methods",
    tag: "snippet",
    code: `from pathlib import Path
import tempfile, os

with tempfile.TemporaryDirectory() as d:
    p = Path(d) / "data.txt"

    # Write atomically.
    p.write_text("Hello\nWorld\n", encoding="utf-8")

    # Read back.
    content = p.read_text(encoding="utf-8")
    print(content)

    # Bytes.
    p.write_bytes(b"\x00\x01\x02")
    print(p.read_bytes().hex())   # 000102

    # Stat.
    print(p.stat().st_size)       # 3`,
    explanation: "Path.write_text / read_text / write_bytes / read_bytes are convenience wrappers that open, operate, and close the file in one call — cleaner than the four-line open/write/close pattern for simple cases.",
  },
  {
    id: "py-contextlib-suppress",
    language: "python",
    title: "contextlib.suppress — swallow specific exceptions",
    tag: "snippet",
    code: `from contextlib import suppress
from pathlib import Path

# Without suppress.
try:
    Path("/nonexistent").unlink()
except FileNotFoundError:
    pass

# With suppress — cleaner for fire-and-forget deletions.
with suppress(FileNotFoundError):
    Path("/nonexistent").unlink()

# Multiple exception types.
with suppress(KeyError, IndexError):
    d = {}
    _ = d["missing"]`,
    explanation: "contextlib.suppress is the contextmanager equivalent of except: pass — it swallows the listed exceptions while letting all others propagate. Only use it when 'the exception occurring is a normal outcome'.",
  },
  {
    id: "py-contextlib-contextmanager",
    language: "python",
    title: "contextlib.contextmanager — generator-based CM",
    tag: "snippet",
    code: `from contextlib import contextmanager
import time

@contextmanager
def timed(label: str):
    start = time.perf_counter()
    try:
        yield          # caller's with-block runs here
    finally:
        elapsed = time.perf_counter() - start
        print(f"{label}: {elapsed:.4f}s")

with timed("computation"):
    total = sum(range(1_000_000))`,
    explanation: "@contextmanager turns a generator function into a context manager: code before yield runs as __enter__, code after yield (in finally) runs as __exit__. Put teardown in finally so it runs even on exception.",
  },
  {
    id: "py-functools-partial",
    language: "python",
    title: "functools.partial — partial application",
    tag: "snippet",
    code: `from functools import partial

def power(base: int, exp: int) -> int:
    return base ** exp

square = partial(power, exp=2)
cube   = partial(power, exp=3)
double = partial(power, 2)    # positional: base=2

print(square(5))   # 25
print(cube(3))     # 27
print(double(10))  # 1024

# Common use: pre-fill comparison key.
from functools import partial
words = ["banana", "apple", "cherry"]
key_2nd = partial(lambda s, i: s[i], i=1)
print(sorted(words, key=key_2nd))  # ['banana', 'cherry', 'apple']`,
    explanation: "functools.partial freezes some arguments of a callable, producing a new callable. It's cleaner than a lambda for simple pre-filled calls and integrates with tools that accept callables.",
  },
  {
    id: "py-operator-attrgetter",
    language: "python",
    title: "operator.attrgetter for attribute-based sorting",
    tag: "snippet",
    code: `from operator import attrgetter
from dataclasses import dataclass

@dataclass
class Employee:
    name: str
    dept: str
    salary: float

employees = [
    Employee("Ada",   "Eng",  120_000),
    Employee("Linus", "Eng",   95_000),
    Employee("Grace", "Mgmt", 140_000),
]

# Sort by dept then salary descending.
sorted_emps = sorted(employees,
    key=attrgetter("dept", "salary"),
)
for e in sorted_emps:
    print(e.name, e.dept, e.salary)`,
    explanation: "attrgetter is faster than a lambda for attribute access because it is implemented in C. With multiple arguments it returns a tuple, enabling multi-key sort with the same tuple comparison semantics.",
  },
  {
    id: "py-hash-hmac",
    language: "python",
    title: "hashlib and hmac — cryptographic hashing",
    tag: "snippet",
    code: `import hashlib, hmac, os

# Content hashing.
data = b"Hello, World!"
digest = hashlib.sha256(data).hexdigest()
print(digest[:16])   # e4ded...

# HMAC — message authentication.
secret = os.urandom(32)
mac = hmac.new(secret, data, hashlib.sha256).hexdigest()
print(mac[:16])

# Verify with constant-time compare to prevent timing attacks.
def verify(secret, data, expected_mac):
    actual = hmac.new(secret, data, hashlib.sha256).hexdigest()
    return hmac.compare_digest(actual, expected_mac)`,
    explanation: "Use hmac.new instead of hashlib for message authentication — HMAC adds a secret key so the MAC can't be forged without it. Always use hmac.compare_digest for verification to prevent timing attacks.",
  },
  {
    id: "py-secrets-module",
    language: "python",
    title: "secrets module — cryptographically secure randomness",
    tag: "snippet",
    code: `import secrets, string

# Secure random bytes (for tokens, nonces).
token = secrets.token_bytes(32)
print(token.hex())

# URL-safe base64 token.
url_token = secrets.token_urlsafe(32)
print(url_token)   # e.g. "wJ3Kq..."

# Secure random choice.
alphabet = string.ascii_letters + string.digits
password = "".join(secrets.choice(alphabet) for _ in range(16))
print(password)

# NEVER use random module for security-sensitive purposes.`,
    explanation: "The secrets module uses the OS CSPRNG (os.urandom()) for cryptographically secure randomness. Use it for tokens, passwords, and nonces. The random module is NOT secure — it is a PRNG for simulations.",
  },
  {
    id: "py-socket-basic",
    language: "python",
    title: "socket — TCP client basics",
    tag: "snippet",
    code: `import socket

# TCP connection to a server.
with socket.create_connection(("example.com", 80), timeout=5) as sock:
    # Send an HTTP/1.0 request.
    request = b"GET / HTTP/1.0\r\nHost: example.com\r\n\r\n"
    sock.sendall(request)

    # Read response in chunks.
    chunks = []
    while chunk := sock.recv(4096):
        chunks.append(chunk)

response = b"".join(chunks)
print(response[:200])`,
    explanation: "socket.create_connection handles hostname resolution and connection with a timeout, returning a connected socket. Use sendall (not send) to guarantee all bytes are sent even if the kernel buffers partially.",
  },
  {
    id: "py-ipaddress-module",
    language: "python",
    title: "ipaddress — IP address manipulation",
    tag: "snippet",
    code: `import ipaddress

ip = ipaddress.ip_address("192.168.1.5")
print(ip.is_private)     # True
print(ip.version)        # 4

net = ipaddress.ip_network("10.0.0.0/8")
print(ip in net)         # False

# Iterate a /30 subnet.
for host in ipaddress.ip_network("192.168.0.0/30").hosts():
    print(host)
# 192.168.0.1  192.168.0.2`,
    explanation: "The ipaddress module parses, validates, and manipulates IPv4/IPv6 addresses and networks. It's far safer than string manipulation and handles subnet math, CIDR notation, and containment checks.",
  },
  {
    id: "py-weakref-ref",
    language: "python",
    title: "weakref.ref — callback on collection",
    tag: "snippet",
    code: `import weakref

class Resource:
    def __repr__(self): return "Resource()"

def on_gone(ref):
    print(f"Resource collected: {ref}")

obj = Resource()
ref = weakref.ref(obj, on_gone)

print(ref())   # Resource()  — obj is alive

del obj        # triggers GC (reference count → 0 in CPython)
# "Resource collected: <weakref at 0x...>"
print(ref())   # None — object is gone`,
    explanation: "weakref.ref takes an optional callback invoked with the dead reference when the referent is collected. Useful for cache invalidation and cleanup without preventing collection.",
  },
  {
    id: "py-pep517-build",
    language: "python",
    title: "pyproject.toml — modern packaging",
    tag: "understanding",
    code: `# pyproject.toml — replaces setup.py + setup.cfg
[build-system]
requires      = ["hatchling"]
build-backend = "hatchling.build"

[project]
name        = "my-package"
version     = "1.0.0"
description = "A short description"
requires-python = ">=3.11"
dependencies = [
    "requests>=2.28",
    "pydantic>=2.0",
]

[project.optional-dependencies]
dev = ["pytest>=7", "mypy"]

[project.scripts]
my-cli = "my_package.cli:main"`,
    explanation: "PEP 517/518 standardize build tooling via pyproject.toml. The build-system table specifies the build backend (hatchling, flit, setuptools, poetry-core). dependencies lists runtime requirements; optional-dependencies groups extras.",
  },
  {
    id: "py-re-compile-flags",
    language: "python",
    title: "re.compile with flags",
    tag: "snippet",
    code: `import re

# Compile for reuse — significant speed-up when applied many times.
pattern = re.compile(
    r"""
    (?P<year>  \d{4})   # named group for year
    -
    (?P<month> \d{2})   # named group for month
    -
    (?P<day>   \d{2})   # named group for day
    """,
    re.VERBOSE,         # allows inline comments and whitespace
)

m = pattern.match("2024-05-06")
if m:
    print(m.group("year"), m.group("month"), m.group("day"))
# 2024 05 06`,
    explanation: "re.VERBOSE (re.X) lets you add whitespace and comments to patterns. Compile patterns used in tight loops — re.compile caches the compiled object, avoiding repeated parse overhead.",
  },
  {
    id: "py-subclasshook",
    language: "python",
    title: "__subclasshook__ — virtual subclassing",
    tag: "classes",
    code: `from abc import ABC

class Printable(ABC):
    @classmethod
    def __subclasshook__(cls, C):
        if cls is Printable:
            if any("print_info" in B.__dict__ for B in C.__mro__):
                return True
        return NotImplemented

class Document:
    def print_info(self): print("document")

class Image:
    pass  # no print_info

print(issubclass(Document, Printable))  # True
print(issubclass(Image,    Printable))  # False
print(isinstance(Document(), Printable))  # True`,
    explanation: "__subclasshook__ allows a class to be considered a virtual subclass of an ABC without inheriting from it — the mechanism behind how collections.abc classifies built-in types.",
  },
  {
    id: "py-exception-hierarchy",
    language: "python",
    title: "Python exception hierarchy",
    tag: "understanding",
    code: `# BaseException
#   ├── SystemExit       — sys.exit()
#   ├── KeyboardInterrupt — Ctrl-C
#   ├── GeneratorExit    — generator.close()
#   └── Exception        — catch-all for normal errors
#         ├── ValueError, TypeError, AttributeError
#         ├── LookupError → KeyError, IndexError
#         ├── ArithmeticError → ZeroDivisionError
#         ├── OSError → FileNotFoundError, PermissionError
#         └── RuntimeError → RecursionError, NotImplementedError

try:
    raise ValueError("bad value")
except Exception as e:
    print(type(e).__mro__)
    # [ValueError, Exception, BaseException, object]`,
    explanation: "Catch Exception to handle normal program errors. Never catch BaseException — that would swallow KeyboardInterrupt and SystemExit, preventing clean shutdown.",
  },
  {
    id: "py-pep484-generics-class",
    language: "python",
    title: "Generic classes (pre-3.12)",
    tag: "types",
    code: `from typing import Generic, TypeVar

T = TypeVar("T")
K = TypeVar("K")
V = TypeVar("V")

class Stack(Generic[T]):
    def __init__(self) -> None:
        self._items: list[T] = []

    def push(self, item: T) -> None:
        self._items.append(item)

    def pop(self) -> T:
        return self._items.pop()

    def peek(self) -> T:
        return self._items[-1]

s: Stack[int] = Stack()
s.push(1)
print(s.pop())  # 1`,
    explanation: "Generic[T] makes a class parameterizable by type. Type checkers enforce that all T usages within the class refer to the same concrete type at the call site — catching type errors before runtime.",
  },
  {
    id: "py-abc-abstract-classmethod",
    language: "python",
    title: "abstractclassmethod and abstractstaticmethod",
    tag: "classes",
    code: `from abc import ABC, abstractmethod

class Plugin(ABC):
    @classmethod
    @abstractmethod
    def name(cls) -> str: ...

    @staticmethod
    @abstractmethod
    def version() -> str: ...

class MyPlugin(Plugin):
    @classmethod
    def name(cls) -> str:
        return "my-plugin"

    @staticmethod
    def version() -> str:
        return "1.0.0"

print(MyPlugin.name())     # my-plugin
print(MyPlugin.version())  # 1.0.0`,
    explanation: "Combine @classmethod or @staticmethod with @abstractmethod (in that order — @classmethod outermost) to require subclasses to provide class-level or static implementations.",
  },
  {
    id: "py-singleton-pattern",
    language: "python",
    title: "Thread-safe singleton",
    tag: "classes",
    code: `import threading

class Singleton:
    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:   # double-checked locking
                    cls._instance = super().__new__(cls)
        return cls._instance

a = Singleton()
b = Singleton()
print(a is b)   # True`,
    explanation: "The double-checked lock pattern avoids acquiring the lock on every call after initialization. In Python the GIL makes single-threaded access safe, but the double-check is still needed for multi-threaded correctness.",
  },
  {
    id: "py-pep3107-annotations",
    language: "python",
    title: "Function annotations and __annotations__",
    tag: "types",
    code: `def greet(name: str, times: int = 1) -> str:
    return (name + " ") * times

# Access annotations at runtime.
print(greet.__annotations__)
# {'name': <class 'str'>, 'times': <class 'int'>, 'return': <class 'str'>}

import typing
# get_type_hints resolves forward references.
hints = typing.get_type_hints(greet)
print(hints)`,
    explanation: "Function annotations (PEP 3107) are stored in __annotations__ and are accessible at runtime. get_type_hints evaluates string annotations (forward references) and applies module/local namespaces correctly.",
  },
  {
    id: "py-chainmap",
    language: "python",
    title: "ChainMap — layered dict lookups",
    tag: "structures",
    code: `from collections import ChainMap

defaults  = {"color": "blue",  "size": "M",  "qty": 1}
override  = {"color": "red",   "qty": 5}
env       = {"size": "XL"}

# Layers searched left to right.
merged = ChainMap(env, override, defaults)
print(merged["color"])  # red    — from override
print(merged["size"])   # XL     — from env
print(merged["qty"])    # 5      — from override

# Writes go only to the first map.
merged["color"] = "green"
print(override["color"])  # red — untouched
print(merged.maps[0])     # {'size': 'XL', 'color': 'green'}`,
    explanation: "ChainMap presents multiple dicts as a single view without copying. Reads search left-to-right (first match wins), writes always hit the first map. Used in Python's scoping implementation for nested namespaces.",
  },
  {
    id: "py-lru-cache-maxsize",
    language: "python",
    title: "lru_cache with maxsize — bounded memoization",
    tag: "snippet",
    code: `from functools import lru_cache

@lru_cache(maxsize=128)
def expensive(n: int) -> int:
    print(f"computing {n}")
    return n * n

print(expensive(5))   # computing 5 → 25
print(expensive(5))   # cache hit → 25 (no print)
print(expensive(6))   # computing 6 → 36

info = expensive.cache_info()
print(info)  # CacheInfo(hits=1, misses=2, maxsize=128, currsize=2)

expensive.cache_clear()   # empty the cache`,
    explanation: "lru_cache(maxsize=N) evicts the least-recently-used entry when the cache is full. Use maxsize=None (equivalent to @cache) only when the argument space is bounded.",
  },
  {
    id: "py-operator-module",
    language: "python",
    title: "operator module — functional operators",
    tag: "snippet",
    code: `import operator

# operator functions work where lambdas do.
from functools import reduce
nums = [1, 2, 3, 4, 5]
product = reduce(operator.mul, nums)
print(product)  # 120

# Composable sort key.
data = [{"name": "Ada", "age": 36}, {"name": "Linus", "age": 54}]
by_age = sorted(data, key=operator.itemgetter("age"))
print(by_age[0]["name"])  # Ada

# Attribute getter.
from dataclasses import dataclass
@dataclass
class P: x: int; y: int
points = [P(3,1), P(1,4), P(2,2)]
print(min(points, key=operator.attrgetter("x")).x)  # 1`,
    explanation: "The operator module provides function equivalents of Python's operators. They are implemented in C, so faster than equivalent lambdas, and work well with map, filter, reduce, and sorted.",
  },
  {
    id: "py-copy-module",
    language: "python",
    title: "copy.copy vs copy.deepcopy — complete picture",
    tag: "understanding",
    code: `import copy

class Node:
    def __init__(self, val, children=None):
        self.val = val
        self.children = children or []

root = Node(1, [Node(2), Node(3)])

# Shallow copy: new Node but same children list.
sc = copy.copy(root)
print(sc is root)              # False
print(sc.children is root.children)  # True — shared!

# Deep copy: fully independent graph.
dc = copy.deepcopy(root)
print(dc.children is root.children)  # False — independent copy`,
    explanation: "copy.copy creates a new top-level object but shares references to nested objects. copy.deepcopy recursively copies the entire object graph. For objects with __copy__ or __deepcopy__, those methods are called.",
  },
  {
    id: "py-io-bytesio",
    language: "python",
    title: "io.BytesIO — in-memory binary stream",
    tag: "snippet",
    code: `import io, struct

# Build a binary message in memory.
buf = io.BytesIO()
buf.write(b"MAGIC")
buf.write(struct.pack(">I", 12345))   # big-endian uint32

# Seek back and read.
buf.seek(0)
magic = buf.read(5)
length = struct.unpack(">I", buf.read(4))[0]
print(magic, length)   # b'MAGIC' 12345

# Useful for testing code that writes to files.
buf2 = io.BytesIO(b"existing content")
print(buf2.read())   # b'existing content'`,
    explanation: "BytesIO is the binary counterpart to StringIO — a file-like object backed by bytes. Use it in tests to capture binary output or as an in-memory staging area before writing to a real file.",
  },
  {
    id: "py-popen-subprocess",
    language: "python",
    title: "subprocess — run shell commands",
    tag: "snippet",
    code: `import subprocess

# Simple: capture output, raise on non-zero exit.
result = subprocess.run(
    ["git", "status"],
    capture_output=True, text=True, check=True
)
print(result.stdout)

# Pipe output from one command to another.
p1 = subprocess.Popen(["ls", "-la"], stdout=subprocess.PIPE)
p2 = subprocess.Popen(["grep", "py"], stdin=p1.stdout,
                       stdout=subprocess.PIPE, text=True)
p1.stdout.close()
output, _ = p2.communicate()
print(output)`,
    explanation: "subprocess.run is the high-level interface; Popen is low-level for piping and streaming. Always pass a list (not a string) to avoid shell injection. check=True raises CalledProcessError on non-zero exit codes.",
  },
  {
    id: "py-tempfile-usage",
    language: "python",
    title: "tempfile — safe temporary files",
    tag: "snippet",
    code: `import tempfile, os

# NamedTemporaryFile — visible by name, deleted on close.
with tempfile.NamedTemporaryFile(mode="w", suffix=".txt",
                                  delete=True) as f:
    f.write("temporary content")
    print(f.name)   # e.g. /tmp/tmpXXXXXX.txt
# File is deleted when the with block exits.

# TemporaryDirectory — directory deleted on exit.
with tempfile.TemporaryDirectory() as d:
    path = os.path.join(d, "data.bin")
    with open(path, "wb") as fp:
        fp.write(b"\x00" * 1024)
    print(os.listdir(d))   # ['data.bin']
# Directory and contents deleted here.`,
    explanation: "tempfile handles OS-specific temporary file locations and deletion automatically. NamedTemporaryFile is useful when the file must be opened by name (e.g., passed to subprocess). TemporaryDirectory cleans up entire trees.",
  },
  {
    id: "py-configparser-usage",
    language: "python",
    title: "configparser — INI file parsing",
    tag: "snippet",
    code: `import configparser, io

ini = """
[database]
host = localhost
port = 5432
name = appdb

[app]
debug = true
workers = 4
"""

config = configparser.ConfigParser()
config.read_string(ini)

print(config["database"]["host"])   # localhost
print(config.getint("database", "port"))    # 5432
print(config.getboolean("app", "debug"))    # True
print(config.getint("app", "workers"))      # 4`,
    explanation: "configparser reads Windows-style INI files. getint, getfloat, and getboolean convert values automatically. Interpolation with %(key)s allows values to reference other keys in the same section.",
  },
  {
    id: "py-zipfile-usage",
    language: "python",
    title: "zipfile — create and read ZIP archives",
    tag: "snippet",
    code: `import zipfile, io

# Create a zip in memory.
buf = io.BytesIO()
with zipfile.ZipFile(buf, "w", compression=zipfile.ZIP_DEFLATED) as zf:
    zf.writestr("hello.txt", "Hello, World!")
    zf.writestr("data/config.json", '{"key": "value"}')

# Read back.
buf.seek(0)
with zipfile.ZipFile(buf) as zf:
    print(zf.namelist())         # ['hello.txt', 'data/config.json']
    content = zf.read("hello.txt")
    print(content.decode())      # Hello, World!`,
    explanation: "zipfile supports reading and writing ZIP archives in memory (BytesIO) or to disk. ZIP_DEFLATED is the standard compression algorithm. writestr accepts a filename and bytes/str — useful for generating archives without writing temp files.",
  },
  {
    id: "py-tarfile-usage",
    language: "python",
    title: "tarfile — create and extract .tar archives",
    tag: "snippet",
    code: `import tarfile, io

# Create a .tar.gz in memory.
buf = io.BytesIO()
with tarfile.open(fileobj=buf, mode="w:gz") as tf:
    info = tarfile.TarInfo(name="hello.txt")
    data = b"Hello from tar!"
    info.size = len(data)
    tf.addfile(info, io.BytesIO(data))

# Extract a member.
buf.seek(0)
with tarfile.open(fileobj=buf, mode="r:gz") as tf:
    member = tf.getmember("hello.txt")
    f = tf.extractfile(member)
    print(f.read().decode())   # Hello from tar!`,
    explanation: "tarfile handles .tar, .tar.gz, and .tar.bz2 archives. Use mode='w:gz' for compressed output. Always pass members explicitly to extractall to avoid path traversal vulnerabilities (the tar slip attack).",
  },
  {
    id: "py-pickle-protocol",
    language: "python",
    title: "pickle — object serialization protocols",
    tag: "caveats",
    code: `import pickle

data = {"key": [1, 2, 3], "nested": {"a": True}}

# Serialize to bytes.
blob = pickle.dumps(data, protocol=5)   # latest protocol
print(len(blob))

# Deserialize.
restored = pickle.loads(blob)
print(restored)   # same structure

# NEVER unpickle data from an untrusted source —
# it executes arbitrary Python code on load.
# Use json or msgpack for cross-language/untrusted data.`,
    explanation: "Pickle serializes arbitrary Python objects including classes, closures, and numpy arrays. Protocol 5 (Python 3.8+) adds out-of-band buffers for zero-copy large data. NEVER deserialize pickle data from untrusted sources.",
  },
  {
    id: "py-shelve-module",
    language: "python",
    title: "shelve — persistent dict-like store",
    tag: "snippet",
    code: `import shelve

# Open or create a shelf file.
with shelve.open("mystore") as db:
    db["user"] = {"name": "Ada", "age": 36}
    db["counter"] = 0

# Reopen and read/write.
with shelve.open("mystore") as db:
    user = db["user"]
    print(user["name"])   # Ada
    db["counter"] = db["counter"] + 1

# Clean up test files (platform-dependent extensions).
import os, glob
for f in glob.glob("mystore*"): os.remove(f)`,
    explanation: "shelve persists a dict to disk using pickle and dbm. Keys must be strings; values can be any picklable object. It's a quick persistence layer for simple scripts — not suitable for concurrent access.",
  },
  {
    id: "py-dataclasses-asdict",
    language: "python",
    title: "dataclasses.asdict and astuple",
    tag: "snippet",
    code: `from dataclasses import dataclass, asdict, astuple

@dataclass
class Point:
    x: float
    y: float

@dataclass
class Line:
    start: Point
    end: Point

line = Line(Point(0, 0), Point(3, 4))

d = asdict(line)
print(d)   # {'start': {'x': 0, 'y': 0}, 'end': {'x': 3, 'y': 4}}

t = astuple(line)
print(t)   # ((0, 0), (3, 4))`,
    explanation: "asdict recursively converts a dataclass to a dict of dicts, making it easy to serialize to JSON. astuple does the same into nested tuples. Both deep-copy the values, so mutations don't affect the original.",
  },
  {
    id: "py-multiprocessing-pool",
    language: "python",
    title: "multiprocessing.Pool — CPU-bound parallelism",
    tag: "snippet",
    code: `from multiprocessing import Pool
import os

def compute(n: int) -> int:
    return sum(i * i for i in range(n))

if __name__ == "__main__":   # required on Windows/macOS
    with Pool(processes=os.cpu_count()) as pool:
        results = pool.map(compute, [10_000, 20_000, 30_000])
    print(results)   # [sum1, sum2, sum3]

    # Non-blocking: imap_unordered for streaming results.
    with Pool() as pool:
        for r in pool.imap_unordered(compute, range(10)):
            print(r, end=" ")`,
    explanation: "Pool.map distributes work across worker processes, bypassing the GIL for CPU-bound tasks. The if __name__ == '__main__' guard is required on Windows to prevent recursive subprocess spawning.",
  },
  {
    id: "py-multiprocessing-queue",
    language: "python",
    title: "multiprocessing.Queue — inter-process communication",
    tag: "snippet",
    code: `from multiprocessing import Process, Queue

def producer(q: Queue) -> None:
    for i in range(5):
        q.put(i)
    q.put(None)   # sentinel to signal done

def consumer(q: Queue) -> None:
    while (item := q.get()) is not None:
        print(f"consumed: {item}")

if __name__ == "__main__":
    q: Queue = Queue()
    p = Process(target=producer, args=(q,))
    c = Process(target=consumer, args=(q,))
    p.start(); c.start()
    p.join();  c.join()`,
    explanation: "multiprocessing.Queue is process-safe (unlike threading.Queue which is only thread-safe). Data is pickled on send and unpickled on receive — keep messages small or use shared memory (multiprocessing.Array) for large data.",
  },
  {
    id: "py-logging-handlers",
    language: "python",
    title: "logging handlers — rotating file logs",
    tag: "snippet",
    code: `import logging
from logging.handlers import RotatingFileHandler, TimedRotatingFileHandler

logger = logging.getLogger("app")
logger.setLevel(logging.DEBUG)

# Rotate at 5 MB, keep 3 backups.
rh = RotatingFileHandler("app.log", maxBytes=5*1024*1024, backupCount=3)
rh.setLevel(logging.INFO)

# Also print DEBUG to console.
ch = logging.StreamHandler()
ch.setLevel(logging.DEBUG)

fmt = logging.Formatter("%(asctime)s %(levelname)s %(message)s")
rh.setFormatter(fmt)
ch.setFormatter(fmt)

logger.addHandler(rh)
logger.addHandler(ch)

logger.info("started")
logger.debug("verbose debug info")`,
    explanation: "RotatingFileHandler rolls logs by size; TimedRotatingFileHandler rolls by time interval (midnight, hourly). Multiple handlers on one logger let you send different severity levels to different destinations simultaneously.",
  },
  {
    id: "py-json-lines",
    language: "python",
    title: "JSON Lines — streaming JSON format",
    tag: "snippet",
    code: `import json, io

records = [
    {"id": 1, "name": "Ada"},
    {"id": 2, "name": "Linus"},
    {"id": 3, "name": "Grace"},
]

# Write JSON Lines (one JSON object per line).
buf = io.StringIO()
for record in records:
    buf.write(json.dumps(record) + "\n")

# Read back.
buf.seek(0)
for line in buf:
    obj = json.loads(line)
    print(obj["name"])`,
    explanation: "JSON Lines (.jsonl) stores one JSON object per line, enabling streaming reads without parsing the entire file. It is the standard format for log files, ML training data, and large dataset exports.",
  },
  {
    id: "py-typing-typeguard",
    language: "python",
    title: "TypeGuard — custom type narrowing functions",
    tag: "types",
    code: `from typing import TypeGuard

def is_str_list(val: list[object]) -> TypeGuard[list[str]]:
    return all(isinstance(x, str) for x in val)

def process(items: list[object]) -> None:
    if is_str_list(items):
        # type checker knows items: list[str] here
        print(items[0].upper())
    else:
        print("not all strings")

process(["hello", "world"])  # HELLO`,
    explanation: "TypeGuard annotates a function that narrows the type of its argument when it returns True. The type checker widens the narrowed type in the if branch — without TypeGuard the checker would still see list[object].",
  },
  {
    id: "py-typing-never",
    language: "python",
    title: "Never — the bottom type",
    tag: "types",
    code: `from typing import Never, NoReturn

# Never — a type with no possible values (bottom type).
# assert_never raises at runtime if reached.
from typing import assert_never, Literal

Color = Literal["red", "green", "blue"]

def handle(c: Color) -> str:
    if c == "red":   return "stop"
    if c == "green": return "go"
    if c == "blue":  return "caution"
    assert_never(c)   # type: Never — exhaustiveness check

# NoReturn — function that never returns (raises or loops forever).
def fail(msg: str) -> NoReturn:
    raise RuntimeError(msg)`,
    explanation: "Never is the bottom type — no value can have this type. assert_never is the idiomatic exhaustiveness checker: if new variants are added to a Literal/Union without handling, the type checker flags the assert_never call.",
  },
  {
    id: "py-ast-module",
    language: "python",
    title: "ast module — parse and inspect Python code",
    tag: "snippet",
    code: `import ast

source = """
def add(a, b):
    return a + b
"""

tree = ast.parse(source)

# Walk all nodes.
for node in ast.walk(tree):
    if isinstance(node, ast.FunctionDef):
        print(f"Function: {node.name}")   # Function: add
    if isinstance(node, ast.Return):
        print("Has return")

# Pretty-print.
print(ast.dump(tree, indent=2))`,
    explanation: "The ast module parses Python source into an abstract syntax tree. Walk the tree for static analysis, linting, or code transformation. Use ast.unparse() (3.9+) to convert a modified tree back to source code.",
  },
  {
    id: "py-inspect-module",
    language: "python",
    title: "inspect — introspect live objects",
    tag: "snippet",
    code: `import inspect

def greet(name: str, times: int = 1) -> str:
    """Say hello."""
    return (name + " ") * times

# Signature.
sig = inspect.signature(greet)
print(sig)   # (name: str, times: int = 1) -> str

# Parameters.
for param in sig.parameters.values():
    print(param.name, param.default, param.annotation)

# Source code.
print(inspect.getsource(greet))

# Caller information.
frame = inspect.currentframe()
print(inspect.getframeinfo(frame).lineno)`,
    explanation: "inspect provides runtime access to live objects: signatures, source code, call frames, and class hierarchies. Used heavily by testing frameworks, debuggers, and documentation generators.",
  },
  {
    id: "py-dis-module",
    language: "python",
    title: "dis — disassemble Python bytecode",
    tag: "snippet",
    code: `import dis

def add(a, b):
    return a + b

dis.dis(add)
# 2           0 RESUME          0
# 3           2 LOAD_FAST       0 (a)
#             4 LOAD_FAST       1 (b)
#             6 BINARY_OP      0 (+)
#            10 RETURN_VALUE

# Count bytecode instructions.
code = compile("x = a + b * 2", "<string>", "exec")
print(len(list(dis.get_instructions(code))))`,
    explanation: "dis disassembles a function or code object into CPython bytecode instructions. Useful for understanding why two seemingly equivalent snippets have different performance characteristics.",
  },
  {
    id: "py-ctypes-basics",
    language: "python",
    title: "ctypes — call C functions from Python",
    tag: "snippet",
    code: `import ctypes, ctypes.util

# Load a shared library.
libc = ctypes.CDLL(ctypes.util.find_library("c"))

# Call printf.
libc.printf(b"Hello from C: %d\n", ctypes.c_int(42))

# Call strlen.
libc.strlen.restype  = ctypes.c_size_t
libc.strlen.argtypes = [ctypes.c_char_p]
n = libc.strlen(b"hello world")
print(n)   # 11`,
    explanation: "ctypes lets you call C functions in shared libraries without writing a C extension. Always set restype and argtypes to prevent silent data corruption from wrong calling conventions.",
  },
  {
    id: "py-sys-getsizeof",
    language: "python",
    title: "sys.getsizeof — object memory size",
    tag: "snippet",
    code: `import sys

print(sys.getsizeof(0))         # 28 bytes (CPython int)
print(sys.getsizeof(1000))      # 28 bytes (small int — same size)
print(sys.getsizeof([]))        # 56 bytes (empty list)
print(sys.getsizeof([1,2,3]))   # 88 bytes (list with 3 refs)
print(sys.getsizeof({}))        # 64 bytes (empty dict)
print(sys.getsizeof(""))        # 49 bytes (empty str)
print(sys.getsizeof("hello"))   # 54 bytes

# getsizeof does NOT include referenced objects.
lst = [1, 2, 3]
print(sys.getsizeof(lst))  # 88 — only the list array, not the int objects`,
    explanation: "sys.getsizeof returns the direct memory of an object in bytes, not its total memory footprint. For the recursive total, use tracemalloc or a recursive walk. Sizes are CPython-specific and version-dependent.",
  },
  {
    id: "py-reprlib-module",
    language: "python",
    title: "reprlib — safe repr for large objects",
    tag: "snippet",
    code: `import reprlib

# reprlib.repr truncates large containers.
big_list = list(range(1000))
print(reprlib.repr(big_list))
# [0, 1, 2, 3, 4, 5, ...]

big_str = "x" * 1000
print(reprlib.repr(big_str))
# 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx...'

# Customize limits.
r = reprlib.Repr()
r.maxlist = 3
r.maxstring = 20
print(r.repr(big_list))   # [0, 1, 2, ...]`,
    explanation: "reprlib.repr is a safe alternative to repr that limits output length for large containers and strings — useful in logging, debug output, and tools that can't handle unbounded repr output.",
  },
  {
    id: "py-pdb-debugging",
    language: "python",
    title: "pdb — built-in debugger",
    tag: "snippet",
    code: `import pdb

def buggy(lst):
    total = 0
    for item in lst:
        pdb.set_trace()   # drop into debugger here
        total += item
    return total

# Python 3.7+: use the built-in breakpoint() instead.
def better(lst):
    total = 0
    for item in lst:
        breakpoint()      # same as pdb.set_trace() by default
        total += item
    return total

# In REPL: pdb commands
# n (next), s (step into), c (continue), p expr (print), q (quit)`,
    explanation: "breakpoint() (3.7+) is the preferred way to set a programmatic breakpoint — it respects the PYTHONBREAKPOINT environment variable, allowing you to swap out pdb for richer debuggers (ipdb, pudb) without code changes.",
  },
  {
    id: "py-contextlib-redirect",
    language: "python",
    title: "contextlib.redirect_stdout — capture print output",
    tag: "snippet",
    code: `import io
from contextlib import redirect_stdout, redirect_stderr

# Capture stdout.
buf = io.StringIO()
with redirect_stdout(buf):
    print("captured!")
    print("also captured")

output = buf.getvalue()
print(f"Captured: {output!r}")  # Captured: 'captured!\nalso captured\n'

# Silence stderr.
with redirect_stderr(io.StringIO()):
    import warnings
    warnings.warn("this warning is suppressed")`,
    explanation: "redirect_stdout/redirect_stderr temporarily swap sys.stdout/sys.stderr, making them useful for capturing output from functions you can't modify — useful in tests and for silencing noisy third-party code.",
  },
  {
    id: "py-dataclass-replace",
    language: "python",
    title: "dataclasses.replace — non-destructive update",
    tag: "snippet",
    code: `from dataclasses import dataclass, replace

@dataclass(frozen=True)
class Config:
    host: str = "localhost"
    port: int = 8080
    debug: bool = False

base = Config()
prod = replace(base, host="prod.example.com", debug=False)
dev  = replace(base, debug=True)

print(base)  # Config(host='localhost', port=8080, debug=False)
print(prod)  # Config(host='prod.example.com', port=8080, debug=False)`,
    explanation: "dataclasses.replace is the dataclass equivalent of record with — it creates a copy with specified fields changed. It's the idiomatic way to create modified copies of frozen dataclasses.",
  },
  {
    id: "py-functools-wraps",
    language: "python",
    title: "functools.wraps — preserve decorator metadata",
    tag: "snippet",
    code: `from functools import wraps

def timer(fn):
    import time
    @wraps(fn)    # copies __name__, __doc__, __annotations__, etc.
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        result = fn(*args, **kwargs)
        print(f"{fn.__name__} took {time.perf_counter()-start:.4f}s")
        return result
    return wrapper

@timer
def add(a: int, b: int) -> int:
    """Add two numbers."""
    return a + b

print(add.__name__)   # add (not 'wrapper')
print(add.__doc__)    # Add two numbers.`,
    explanation: "@wraps copies the wrapped function's metadata to the wrapper. Without it, introspection tools (help(), sphinx, pytest) see the decorator's internals instead of the original function's signature and docstring.",
  },
  {
    id: "py-textwrap-module",
    language: "python",
    title: "textwrap — format long strings",
    tag: "snippet",
    code: `import textwrap

long_text = (
    "This is a very long string that needs to be wrapped at a certain "
    "column width for terminal display or documentation purposes."
)

print(textwrap.fill(long_text, width=50))

# Dedent — strip common leading whitespace.
indented = """
    line one
    line two
    line three
"""
print(textwrap.dedent(indented).strip())

# Indent — add prefix to each line.
print(textwrap.indent("hello\nworld", prefix="  > "))`,
    explanation: "textwrap.fill wraps long strings at word boundaries. dedent strips common leading whitespace from multiline strings (useful for inline multiline string literals). indent adds a prefix to each line.",
  },
  {
    id: "py-string-template-advanced",
    language: "python",
    title: "string.Formatter — custom format strings",
    tag: "snippet",
    code: `import string

class VerboseFormatter(string.Formatter):
    def get_value(self, key, args, kwargs):
        print(f"  looking up {key!r}")
        return super().get_value(key, args, kwargs)

fmt = VerboseFormatter()
result = fmt.format("Hello {name}, you are {age}!", name="Ada", age=36)
print(result)
# looking up 'name'
# looking up 'age'
# Hello Ada, you are 36!`,
    explanation: "string.Formatter is the base class behind str.format(). Override get_value, format_field, or convert_field to customize how format strings are resolved — useful for template engines and config substitution.",
  },
  {
    id: "py-enum-functional",
    language: "python",
    title: "Enum functional API",
    tag: "snippet",
    code: `from enum import Enum

# Functional API for dynamic enum creation.
Status = Enum("Status", ["PENDING", "ACTIVE", "CLOSED"])
print(Status.ACTIVE.value)   # 2

# With explicit values.
Color = Enum("Color", {"RED": "#FF0000", "GREEN": "#00FF00", "BLUE": "#0000FF"})
print(Color.RED.value)       # #FF0000

# Enum from a list of strings.
Weekday = Enum("Weekday", "MON TUE WED THU FRI SAT SUN")
print(list(Weekday)[:3])     # [<Weekday.MON: 1>, <Weekday.TUE: 2>, ...]`,
    explanation: "The functional API creates Enum classes dynamically — useful when the set of values is known only at runtime (e.g., read from a config file or database). Values can be any string, including 'NAME1 NAME2' for automatic integer values.",
  },
  {
    id: "py-abc-register",
    language: "python",
    title: "ABC.register — virtual subclassing",
    tag: "classes",
    code: `from abc import ABC

class Drawable(ABC):
    @classmethod
    def draw(cls) -> None: ...

# Register an existing class without modifying it.
class Circle:
    def draw(self) -> None:
        print("Drawing circle")

Drawable.register(Circle)

print(issubclass(Circle, Drawable))   # True
print(isinstance(Circle(), Drawable)) # True
# But Circle.draw won't raise if not implemented!`,
    explanation: "ABC.register declares an existing class as a virtual subclass of an ABC, making isinstance/issubclass return True without inheriting. There's no enforcement of abstract methods for registered classes — use with care.",
  },
  {
    id: "py-property-cached",
    language: "python",
    title: "functools.cached_property — lazy computed attribute",
    tag: "snippet",
    code: `from functools import cached_property

class Circle:
    def __init__(self, radius: float):
        self.radius = radius

    @cached_property
    def area(self) -> float:
        print("computing area...")
        return 3.14159 * self.radius ** 2

c = Circle(5)
print(c.area)   # computing area... → 78.539...
print(c.area)   # no recomputation → 78.539...

# Invalidate by deleting.
del c.area
print(c.area)   # computing area... again`,
    explanation: "cached_property computes the value on first access and stores it in the instance's __dict__, replacing itself. Subsequent accesses return the cached value directly without any property overhead.",
  },
  {
    id: "py-number-tower",
    language: "python",
    title: "Python number tower — numeric ABCs",
    tag: "understanding",
    code: `import numbers

# Python's numeric hierarchy:
# Number → Complex → Real → Rational → Integral

print(isinstance(42,    numbers.Integral))  # True
print(isinstance(3.14,  numbers.Real))      # True
print(isinstance(1+2j,  numbers.Complex))   # True
print(isinstance(42,    numbers.Real))      # True — int is-a Real
print(isinstance(3.14,  numbers.Integral))  # False

# Use ABCs in type-checking functions.
def square(x: numbers.Real) -> float:
    return float(x) * float(x)

print(square(3))    # 9.0
print(square(2.5))  # 6.25`,
    explanation: "The numbers module defines abstract base classes for numeric types. isinstance(x, numbers.Real) accepts int, float, Fraction, and Decimal — broader than a concrete type check.",
  },
  {
    id: "py-weakref-methods",
    language: "python",
    title: "WeakMethod — weak references to bound methods",
    tag: "snippet",
    code: `import weakref

class Button:
    def on_click(self) -> None:
        print("clicked!")

btn = Button()

# weakref.ref to a bound method would fail — bound methods
# are created on-the-fly and have no persistent identity.
# Use WeakMethod instead.
ref = weakref.WeakMethod(btn.on_click)

callback = ref()
if callback:
    callback()   # clicked!

del btn          # button GC'd
print(ref())     # None`,
    explanation: "weakref.WeakMethod holds a weak reference to a bound method by internally holding weak refs to the object and the function separately, since bound methods are ephemeral objects created anew on each attribute access.",
  },
  {
    id: "py-platform-module",
    language: "python",
    title: "platform — OS and Python runtime info",
    tag: "snippet",
    code: `import platform, sys

print(platform.system())       # Linux / Windows / Darwin
print(platform.release())      # kernel/OS version
print(platform.machine())      # x86_64 / arm64
print(platform.python_version())  # e.g. 3.12.0

# Conditional platform code.
if platform.system() == "Windows":
    path_sep = "\\"
else:
    path_sep = "/"

# sys.platform is simpler for coarse checks.
print(sys.platform)   # linux / win32 / darwin`,
    explanation: "platform provides detailed OS, hardware, and Python runtime information. Use sys.platform for simple OS detection in cross-platform code; use platform for richer details like kernel version or processor architecture.",
  },
  {
    id: "py-signal-module",
    language: "python",
    title: "signal — UNIX signal handling",
    tag: "snippet",
    code: `import signal, time

# Register a handler for SIGTERM.
def handle_term(signum, frame):
    print("SIGTERM received — cleaning up")
    raise SystemExit(0)

signal.signal(signal.SIGTERM, handle_term)

# Graceful SIGINT (Ctrl-C) handler.
def handle_int(signum, frame):
    print("\nInterrupted — shutting down")
    raise SystemExit(130)   # 128 + 2

signal.signal(signal.SIGINT, handle_int)

print("Running... (press Ctrl-C to test)")
# time.sleep(10)   # uncomment to test`,
    explanation: "signal.signal registers a callback for OS signals. SIGTERM is the polite shutdown request from systemd/Docker. SIGINT is Ctrl-C. Signal handlers run in the main thread — avoid blocking operations inside them.",
  },
  {
    id: "py-uuid-module",
    language: "python",
    title: "uuid — UUID generation",
    tag: "snippet",
    code: `import uuid

# Random UUID (v4) — most common.
u4 = uuid.uuid4()
print(u4)                # e.g. 550e8400-e29b-41d4-a716-446655440000
print(str(u4))
print(u4.hex)            # no dashes
print(u4.bytes)          # 16 bytes

# Name-based UUID (v5) — deterministic from namespace + name.
ns  = uuid.NAMESPACE_URL
u5  = uuid.uuid5(ns, "https://example.com")
u5b = uuid.uuid5(ns, "https://example.com")
print(u5 == u5b)   # True — same inputs → same UUID

# Parse.
parsed = uuid.UUID("550e8400-e29b-41d4-a716-446655440000")`,
    explanation: "uuid4() is cryptographically random — use it for database primary keys and session tokens. uuid5() is deterministic (SHA-1 based) — use it to generate a stable ID from a canonical name, e.g. deduplicating scraped URLs.",
  },
  {
    id: "py-calendar-module",
    language: "python",
    title: "calendar — month/week calculations",
    tag: "snippet",
    code: `import calendar

# Days in a month (handles leap years).
print(calendar.monthrange(2024, 2))  # (3, 29) — Thu, 29 days

# Check leap year.
print(calendar.isleap(2024))  # True

# Week number.
import datetime
d = datetime.date(2024, 5, 6)
print(d.isocalendar())    # IsoCalendarDate(year=2024, week=19, weekday=1)

# Text calendar.
print(calendar.month(2024, 5))`,
    explanation: "The calendar module handles month arithmetic, leap years, and ISO week numbers. monthrange returns the weekday of the first day and the number of days — essential for building calendar grids without off-by-one errors.",
  },
  {
    id: "py-datetime-timedelta",
    language: "python",
    title: "datetime.timedelta — duration arithmetic",
    tag: "snippet",
    code: `from datetime import datetime, timedelta, timezone

now = datetime.now(tz=timezone.utc)

# Add duration.
in_30_days = now + timedelta(days=30)
last_week  = now - timedelta(weeks=1)

# Difference between two datetimes.
d1 = datetime(2024, 1, 1, tzinfo=timezone.utc)
d2 = datetime(2024, 5, 6, tzinfo=timezone.utc)
delta = d2 - d1
print(delta.days)          # 126
print(delta.total_seconds())  # 10886400.0`,
    explanation: "timedelta represents a duration in days, seconds, and microseconds. Subtract two datetime objects to get a timedelta; add a timedelta to a datetime to compute a future or past point. Always use tz-aware datetimes for cross-timezone math.",
  },
  {
    id: "py-re-lookahead",
    language: "python",
    title: "Regex lookahead and lookbehind",
    tag: "snippet",
    code: `import re

text = "price: $100, discount: $20, total: $80"

# Positive lookahead: number followed by a comma.
# re.findall r"\d+(?=,)" matches numbers before commas.
print(re.findall(r"\d+(?=,)", text))   # ['100', '20']

# Negative lookahead: word not followed by a digit.
print(re.findall(r"\b\w+\b(?!\d)", "abc 123 def 456 ghi"))
# ['abc', 'def', 'ghi']  — words not before digits

# Lookbehind: number preceded by $.
print(re.findall(r"(?<=\$)\d+", text))  # ['100', '20', '80']`,
    explanation: "Lookaheads (?=...) and lookbehinds (?<=...) match positions without consuming characters — zero-width assertions. They allow complex conditions (like 'preceded by $') without including the surrounding text in the match.",
  },
  {
    id: "py-classvar-annotation",
    language: "python",
    title: "ClassVar — class-level vs instance annotation",
    tag: "types",
    code: `from typing import ClassVar
from dataclasses import dataclass

@dataclass
class Employee:
    name: str
    salary: float
    # ClassVar: NOT included in __init__, repr, or comparison.
    _headcount: ClassVar[int] = 0

    def __post_init__(self) -> None:
        Employee._headcount += 1

e1 = Employee("Ada", 120_000)
e2 = Employee("Linus", 95_000)
print(Employee._headcount)  # 2
print(e1._headcount)        # 2 — same class variable`,
    explanation: "ClassVar[T] signals to both humans and type checkers that a field is a class variable shared across all instances, not per-instance. Dataclasses exclude ClassVar fields from __init__ and other generated methods.",
  },
  {
    id: "py-re-named-groups",
    language: "python",
    title: "Named capture groups in regex",
    tag: "snippet",
    code: `import re

log = "2024-05-06 12:30:00 ERROR disk full"

pattern = re.compile(
    r"(?P<date>\d{4}-\d{2}-\d{2}) "
    r"(?P<time>\d{2}:\d{2}:\d{2}) "
    r"(?P<level>\w+) "
    r"(?P<message>.+)"
)

m = pattern.match(log)
if m:
    print(m.group("date"))    # 2024-05-06
    print(m.group("level"))   # ERROR
    print(m.groupdict())      # {'date':..., 'time':..., ...}`,
    explanation: "Named groups (?P<name>...) make regex matches self-documenting and allow accessing captures by name instead of position number. groupdict() returns all named groups as a dict, ideal for structured log parsing.",
  },
  {
    id: "py-urllib-parse",
    language: "python",
    title: "urllib.parse — URL manipulation",
    tag: "snippet",
    code: `from urllib.parse import urlparse, urljoin, urlencode, quote

# Parse a URL.
parsed = urlparse("https://example.com/path?q=hello&lang=en#section")
print(parsed.scheme)    # https
print(parsed.netloc)    # example.com
print(parsed.path)      # /path
print(parsed.query)     # q=hello&lang=en

# Build query string.
qs = urlencode({"q": "hello world", "page": 1})
print(qs)   # q=hello+world&page=1

# Percent-encode a path segment.
print(quote("/path with spaces/"))  # /path%20with%20spaces/

# Join relative URLs.
print(urljoin("https://example.com/base/", "../other"))  # https://example.com/other`,
    explanation: "urllib.parse is the standard library for URL construction and decomposition. urlencode handles query parameters; quote handles path-segment encoding. Always use these instead of manual string concatenation for URLs.",
  },
  {
    id: "py-http-server",
    language: "python",
    title: "http.server — simple development server",
    tag: "snippet",
    code: `from http.server import HTTPServer, BaseHTTPRequestHandler

class HelloHandler(BaseHTTPRequestHandler):
    def do_GET(self) -> None:
        body = b"Hello, World!"
        self.send_response(200)
        self.send_header("Content-Type", "text/plain")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *args) -> None:
        pass   # silence default logging

# Quick command-line server: python -m http.server 8080
server = HTTPServer(("", 8080), HelloHandler)
# server.serve_forever()   # uncomment to start`,
    explanation: "http.server is the built-in HTTP server — useful for quick local file serving and API mocks during development. Never use it in production: it is single-threaded, has no HTTPS, and no rate limiting.",
  },
  {
    id: "py-enum-unique",
    language: "python",
    title: "@unique decorator — prevent duplicate enum values",
    tag: "caveats",
    code: `from enum import Enum, unique

@unique
class Status(Enum):
    ACTIVE   = 1
    INACTIVE = 2
    PENDING  = 3
    # DUPLICATE = 1  # ValueError: duplicate values found

# Without @unique, duplicate values create aliases.
class AliasedEnum(Enum):
    A = 1
    B = 1    # B is an alias for A
    C = 2

print(AliasedEnum.B)        # AliasedEnum.A — alias resolves to original
print(AliasedEnum.A is AliasedEnum.B)  # True`,
    explanation: "@unique raises ValueError at class definition time if any two members share the same value. Without it, duplicate values silently become aliases — which is occasionally intentional but often a bug.",
  },
  {
    id: "py-bytes-operations",
    language: "python",
    title: "bytes operations — search and decode",
    tag: "snippet",
    code: `data = b"Hello, World! Hello again."

# Search.
print(data.find(b"World"))     # 7
print(data.count(b"Hello"))    # 2
print(data.startswith(b"Hello"))  # True

# Replace (returns new bytes — immutable).
new_data = data.replace(b"Hello", b"Hi")
print(new_data)

# Decode to str.
text = data.decode("utf-8")
print(text.upper())

# Split.
lines = b"line1\nline2\nline3".split(b"\n")
print(lines)   # [b'line1', b'line2', b'line3']`,
    explanation: "bytes objects support most of the same methods as str (find, count, replace, split, startswith), but they operate on byte values. Always specify the encoding explicitly when calling decode().",
  },
  {
    id: "py-int-methods",
    language: "python",
    title: "int bit manipulation methods",
    tag: "snippet",
    code: `n = 0b1010_1100   # 172

# Bit length.
print(n.bit_length())        # 8

# Count set bits (Python 3.10+).
print(n.bit_count())         # 4

# Convert to bytes.
b = n.to_bytes(length=2, byteorder="big")
print(b.hex())               # 00ac

# Parse from bytes.
restored = int.from_bytes(b, byteorder="big")
print(restored)              # 172

# Convert to string with base.
print(bin(n))   # 0b10101100
print(hex(n))   # 0xac
print(oct(n))   # 0o254`,
    explanation: "Python's int has built-in methods for bit-level operations: bit_length, bit_count (3.10+), to_bytes/from_bytes for serialization, and the global bin/hex/oct for human-readable representations.",
  },
  {
    id: "py-zoneinfo",
    language: "python",
    title: "zoneinfo — timezone-aware datetimes (3.9+)",
    tag: "snippet",
    code: `from datetime import datetime
from zoneinfo import ZoneInfo

# Timezone-aware datetime.
utc   = datetime.now(tz=ZoneInfo("UTC"))
ny    = datetime.now(tz=ZoneInfo("America/New_York"))
tokyo = datetime.now(tz=ZoneInfo("Asia/Tokyo"))

print(utc.isoformat())
print(ny.isoformat())
print(tokyo.isoformat())

# Convert between timezones.
meeting_utc = datetime(2024, 5, 6, 15, 0, tzinfo=ZoneInfo("UTC"))
meeting_ny  = meeting_utc.astimezone(ZoneInfo("America/New_York"))
print(meeting_ny)`,
    explanation: "zoneinfo (3.9+) uses the IANA timezone database for accurate DST transitions. It replaces pytz as the standard timezone library. Use ZoneInfo('UTC') instead of datetime.timezone.utc for consistency.",
  },
  {
    id: "py-graph-bfs",
    language: "python",
    title: "BFS — breadth-first graph traversal",
    tag: "structures",
    code: `from collections import deque
from typing import Iterator

Graph = dict[str, list[str]]

def bfs(graph: Graph, start: str) -> Iterator[str]:
    visited: set[str] = {start}
    queue = deque([start])
    while queue:
        node = queue.popleft()
        yield node
        for neighbor in graph.get(node, []):
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append(neighbor)

g: Graph = {"A": ["B", "C"], "B": ["D"], "C": ["D", "E"], "D": [], "E": []}
print(list(bfs(g, "A")))   # ['A', 'B', 'C', 'D', 'E']`,
    explanation: "BFS uses a deque for O(1) popleft, a visited set for O(1) membership, and a generator for lazy traversal. It finds the shortest path (fewest hops) in an unweighted graph.",
  },
  {
    id: "py-graph-dfs",
    language: "python",
    title: "DFS — depth-first graph traversal",
    tag: "structures",
    code: `from typing import Iterator

Graph = dict[str, list[str]]

def dfs(graph: Graph, start: str,
        visited: set[str] | None = None) -> Iterator[str]:
    if visited is None:
        visited = set()
    visited.add(start)
    yield start
    for neighbor in graph.get(start, []):
        if neighbor not in visited:
            yield from dfs(graph, neighbor, visited)

g: Graph = {"A": ["B", "C"], "B": ["D"], "C": ["D", "E"], "D": [], "E": []}
print(list(dfs(g, "A")))   # ['A', 'B', 'D', 'C', 'E']`,
    explanation: "Recursive DFS is clear but risks RecursionError on deep graphs. For production use, implement iterative DFS with an explicit stack. The visited set prevents infinite loops in graphs with cycles.",
  },
  {
    id: "py-topological-sort",
    language: "python",
    title: "Topological sort with graphlib (Python 3.9+)",
    tag: "structures",
    code: `from graphlib import TopologicalSorter

# Build a dependency graph: {node: {dependencies}}.
graph = {
    "build":   {"test"},
    "test":    {"lint", "typecheck"},
    "lint":    set(),
    "typecheck": set(),
    "deploy":  {"build"},
}

ts = TopologicalSorter(graph)
order = list(ts.static_order())
print(order)
# ['lint', 'typecheck', 'test', 'build', 'deploy']`,
    explanation: "graphlib.TopologicalSorter (3.9+) implements Kahn's algorithm. static_order() returns one valid topological order. It raises CycleError if the graph has a cycle. Use it for build systems and task schedulers.",
  },
  {
    id: "py-class-body-exec",
    language: "python",
    title: "Class body execution — order and namespace",
    tag: "understanding",
    code: `class Meta:
    # Class body is executed top-to-bottom like a function.
    print("class body runs at definition time")

    x = 10
    y = x * 2   # x is available here

    # Can call functions.
    def _helper():
        return 99
    z = _helper()

    # But 'self' doesn't exist in class scope.
    # You can't use methods here — only at instance level.

print(Meta.x, Meta.y, Meta.z)  # 10 20 99`,
    explanation: "The class body executes in a fresh namespace dict. Variables defined in the body become class attributes. Methods are just functions added to the namespace. This is why classmethod/staticmethod decorators exist — regular functions don't receive the class or instance automatically.",
  },
  {
    id: "py-object-model",
    language: "python",
    title: "Python object model — attribute lookup chain",
    tag: "understanding",
    code: `class A:
    x = 10           # class attribute
    def method(self): return "A.method"

a = A()
a.x = 99            # instance attribute shadows class attribute
print(a.x)          # 99  — instance dict found first
print(A.x)          # 10  — class dict

del a.x
print(a.x)          # 10  — falls back to class dict

# Lookup order: instance.__dict__ → type.__dict__ → base class __dict__
# Descriptors (properties, methods) intercept this chain.`,
    explanation: "Python attribute lookup searches the instance's __dict__ first, then the class's __dict__ (and its MRO) for data descriptors, then the instance dict, then non-data descriptors. Understanding this chain explains how properties, slots, and class attributes interact.",
  },
  {
    id: "py-global-interpreter-lock",
    language: "python",
    title: "GIL — Global Interpreter Lock",
    tag: "understanding",
    code: `# The GIL is a mutex in CPython that prevents multiple threads
# from executing Python bytecode simultaneously.

# Implication: CPU-bound threads don't benefit from multi-core.
import threading, time

def cpu_bound(n):
    while n > 0: n -= 1

t1 = threading.Thread(target=cpu_bound, args=(10**7,))
t2 = threading.Thread(target=cpu_bound, args=(10**7,))
# Running t1+t2 together is no faster than sequentially.

# Solutions for CPU-bound parallelism:
# 1. multiprocessing (separate processes, no GIL)
# 2. concurrent.futures.ProcessPoolExecutor
# 3. Cython / C extensions (can release GIL)
# 4. Free-threaded CPython (Python 3.13, experimental)`,
    explanation: "The GIL allows only one thread to execute Python bytecode at a time. I/O-bound threads work fine (GIL released during I/O waits). For CPU-bound parallelism, use multiprocessing or C extensions that release the GIL.",
  },
  {
    id: "py-comprehension-scope",
    language: "python",
    title: "Comprehension scope isolation",
    tag: "caveats",
    code: `# Python 3: comprehensions have their own scope.
x = 10
result = [x for x in range(5)]   # 'x' inside is isolated
print(x)   # 10 — outer x unchanged

# Generator expressions also isolated.
gen = (x * 2 for x in range(3))
print(x)   # still 10

# But walrus operator DOES leak from comprehensions.
nums = [1, 2, 3]
result = [last := n for n in nums]
print(last)   # 3 — leaked from comprehension`,
    explanation: "List/set/dict comprehensions and generator expressions have their own scope in Python 3 — the iteration variable does not bleed into the enclosing scope. The walrus operator is the notable exception: it always assigns to the enclosing scope.",
  },
  {
    id: "py-generator-memory",
    language: "python",
    title: "Generator memory efficiency vs list",
    tag: "understanding",
    code: `import sys

# List materializes all 1 million items in memory.
lst = [x * x for x in range(1_000_000)]
print(sys.getsizeof(lst))   # ~8 MB

# Generator produces items on demand — constant memory.
gen = (x * x for x in range(1_000_000))
print(sys.getsizeof(gen))   # ~112 bytes

# Useful for large files.
def read_lines(path: str):
    with open(path) as f:
        yield from f   # yields one line at a time, never fully loaded`,
    explanation: "A generator expression uses constant memory regardless of how many items it produces. Use generators (and yield from) when processing large sequences where you only need one item at a time.",
  },
  {
    id: "py-sorted-vs-sort",
    language: "python",
    title: "sorted() vs list.sort() — in-place vs new",
    tag: "snippet",
    code: `data = [3, 1, 4, 1, 5, 9, 2, 6]

# sorted(): returns a new list — original unchanged.
result = sorted(data)
print(data)    # [3, 1, 4, 1, 5, 9, 2, 6] — unchanged
print(result)  # [1, 1, 2, 3, 4, 5, 6, 9]

# list.sort(): in-place, returns None.
data.sort(reverse=True)
print(data)    # [9, 6, 5, 4, 3, 2, 1, 1]

# Both accept key and reverse.
words = ["banana", "Apple", "cherry"]
print(sorted(words, key=str.lower))   # ['Apple', 'banana', 'cherry']`,
    explanation: "sorted() creates a new list — use it on tuples, generators, and when you need the original unchanged. list.sort() sorts in-place with O(1) extra memory. Both use Timsort: O(n log n) worst case, O(n) for nearly sorted data.",
  },
  {
    id: "py-set-operations",
    language: "python",
    title: "Set operations — union, intersection, difference",
    tag: "structures",
    code: `a = {1, 2, 3, 4}
b = {3, 4, 5, 6}

# Operator syntax.
print(a | b)    # {1, 2, 3, 4, 5, 6}  — union
print(a & b)    # {3, 4}              — intersection
print(a - b)    # {1, 2}              — difference
print(a ^ b)    # {1, 2, 5, 6}        — symmetric difference

# Method syntax — accepts any iterable, not just sets.
print(a.union([5, 6]))         # {1, 2, 3, 4, 5, 6}
print(a.issubset({1,2,3,4,5})) # True
print(a.isdisjoint({7, 8}))    # True`,
    explanation: "Set operations are implemented efficiently using hash tables — union, intersection, and difference are O(min(m,n)) to O(m+n). The method forms accept any iterable; the operator forms require both operands to be sets.",
  },
  {
    id: "py-enumerate-start",
    language: "python",
    title: "enumerate with start parameter",
    tag: "snippet",
    code: `items = ["a", "b", "c", "d"]

# Default: starts at 0.
for i, item in enumerate(items):
    print(i, item)
# 0 a  1 b  2 c  3 d

# Start at 1 for human-friendly numbering.
for i, item in enumerate(items, start=1):
    print(f"{i}. {item}")
# 1. a  2. b  3. c  4. d

# Unpack directly into more variables.
pairs = [(1, "one"), (2, "two")]
for i, (num, word) in enumerate(pairs):
    print(i, num, word)`,
    explanation: "enumerate(iterable, start=N) produces (N, item[0]), (N+1, item[1]), ... pairs. The start parameter makes 1-based numbering trivial. Prefer enumerate over manual index tracking with range(len(lst)).",
  },
  // === PYTHON BATCH 1 ===
  {
    id: "py-zip-strict",
    language: "python",
    title: "zip() with strict=True",
    tag: "snippet",
    code: `a = [1, 2, 3]
b = ["x", "y"]

# Default zip silently stops at the shorter iterable.
print(list(zip(a, b)))  # [(1, 'x'), (2, 'y')]

# strict=True raises ValueError when lengths differ (3.10+).
try:
    list(zip(a, b, strict=True))
except ValueError as e:
    print(e)  # zip() has arguments with different lengths`,
    explanation: "Use strict=True any time you're zipping sequences that should be the same length — it surfaces off-by-one bugs instead of silently truncating.",
  },
  {
    id: "py-itertools-compress",
    language: "python",
    title: "itertools.compress — selective filter",
    tag: "snippet",
    code: `from itertools import compress

data  = ["alice", "bob", "carol", "dave"]
mask  = [True, False, True, False]

# compress keeps only elements where the selector is truthy.
print(list(compress(data, mask)))  # ['alice', 'carol']

# Works with any truthy/falsy values, not just bools.
scores = [85, 0, 72, 0, 90]
names  = ["a", "b", "c", "d", "e"]
print(list(compress(names, scores)))  # ['a', 'c', 'e']`,
    explanation: "compress(data, selectors) is like a boolean index into a sequence — handy when the keep/discard decision is precomputed in a separate iterable.",
  },
  {
    id: "py-itertools-count",
    language: "python",
    title: "itertools.count — infinite counter",
    tag: "snippet",
    code: `from itertools import count, islice

# count(start, step) yields an infinite arithmetic sequence.
evens = count(0, 2)
print(list(islice(evens, 5)))  # [0, 2, 4, 6, 8]

# Combine with zip to number any iterable.
items = ["a", "b", "c"]
numbered = list(zip(count(1), items))
print(numbered)  # [(1, 'a'), (2, 'b'), (3, 'c')]`,
    explanation: "count() is the lazy alternative to range() when you don't know the upper bound; pair it with islice or zip to stop it.",
  },
  {
    id: "py-itertools-cycle",
    language: "python",
    title: "itertools.cycle — repeating sequence",
    tag: "snippet",
    code: `from itertools import cycle, islice

# cycle(iterable) repeats the iterable forever.
colors = cycle(["red", "green", "blue"])
print(list(islice(colors, 7)))
# ['red', 'green', 'blue', 'red', 'green', 'blue', 'red']

# Round-robin assignment.
workers = cycle(["alice", "bob"])
tasks = ["t1", "t2", "t3", "t4"]
print([(t, next(workers)) for t in tasks])
# [('t1','alice'),('t2','bob'),('t3','alice'),('t4','bob')]`,
    explanation: "cycle() stores the iterable in memory on the first pass, then replays it indefinitely — use islice or a counter to stop it.",
  },
  {
    id: "py-itertools-repeat",
    language: "python",
    title: "itertools.repeat — constant stream",
    tag: "snippet",
    code: `from itertools import repeat

# repeat(val, n) yields the value exactly n times.
print(list(repeat(0, 4)))   # [0, 0, 0, 0]

# Without n it yields forever — useful with map().
squares = list(map(pow, range(5), repeat(2)))
print(squares)  # [0, 1, 4, 9, 16]

# Equivalent to: [x**2 for x in range(5)]
# but map+repeat avoids a lambda.`,
    explanation: "repeat() is lighter than a list literal for large n and integrates cleanly with map() when you need a constant argument broadcast across every element.",
  },
  {
    id: "py-min-default",
    language: "python",
    title: "min() / max() with default=",
    tag: "snippet",
    code: `nums = []

# Without default, min() on an empty iterable raises ValueError.
try:
    min(nums)
except ValueError as e:
    print(e)  # min() arg is an empty sequence

# default= is returned when the iterable is empty.
print(min(nums, default=0))    # 0
print(max(nums, default=-1))   # -1

words = ["banana", "fig", "cherry"]
print(min(words, key=len))     # fig`,
    explanation: "The default= parameter makes min/max safe on possibly-empty iterables, removing the need for an explicit emptiness check before the call.",
  },
  {
    id: "py-sum-start",
    language: "python",
    title: "sum() with start parameter",
    tag: "snippet",
    code: `# sum(iterable, start=0) computes start + element[0] + element[1] + ...
print(sum([1, 2, 3]))       # 6
print(sum([1, 2, 3], 10))   # 16  (10 + 1 + 2 + 3)

# Flatten a list of lists (only for small inputs — O(n²)).
parts = [[1, 2], [3, 4], [5]]
print(sum(parts, []))       # [1, 2, 3, 4, 5]

# For large lists prefer itertools.chain.from_iterable — O(n).
from itertools import chain
print(list(chain.from_iterable(parts)))  # [1, 2, 3, 4, 5]`,
    explanation: "sum(iterable, start) lets you fold over any type that supports +, but the O(n²) list-flattening pattern is a common performance trap for large inputs.",
  },
  {
    id: "py-dict-union",
    language: "python",
    title: "dict merge with | and |=  (Python 3.9+)",
    tag: "snippet",
    code: `defaults  = {"color": "blue", "size": 10}
overrides = {"color": "red", "weight": 5}

# | creates a new merged dict; right side wins on conflicts.
merged = defaults | overrides
print(merged)  # {'color': 'red', 'size': 10, 'weight': 5}

# |= updates in-place (same precedence rules).
defaults |= overrides
print(defaults)  # {'color': 'red', 'size': 10, 'weight': 5}

# Equivalent to {**defaults, **overrides} but cleaner.`,
    explanation: "The | operator replaced the verbose {**a, **b} pattern in Python 3.9. The right-hand operand wins on duplicate keys, making it natural for 'defaults then overrides' configs.",
  },
  {
    id: "py-str-center",
    language: "python",
    title: "str.center / ljust / rjust for padding",
    tag: "snippet",
    code: `s = "hi"

# Pad to width with spaces (or a fill character).
print(s.ljust(8))         # 'hi      '
print(s.rjust(8))         # '      hi'
print(s.center(8))        # '   hi   '
print(s.center(8, '-'))   # '---hi---'

# Fixed-width console table.
for name, score in [("alice", 92), ("bob", 87)]:
    print(f"{name.ljust(10)}{score}")
# alice     92
# bob       87`,
    explanation: "ljust/rjust/center are simple column-alignment tools. For complex tables with format specs use f\"{value:<10}\" (< left, > right, ^ center).",
  },
  {
    id: "py-setdefault",
    language: "python",
    title: "dict.setdefault",
    tag: "snippet",
    code: `d = {"a": 1}

# setdefault(key, default): returns value if key exists,
# or inserts default and returns it if key is missing.
print(d.setdefault("a", 99))  # 1  — key exists, no change
print(d.setdefault("b", 99))  # 99 — inserted

print(d)  # {'a': 1, 'b': 99}

# Classic use: building a dict of lists.
groups: dict[str, list] = {}
for word in ["cat", "car", "bat"]:
    groups.setdefault(word[0], []).append(word)
print(groups)  # {'c': ['cat', 'car'], 'b': ['bat']}`,
    explanation: "setdefault is compact for building a dict-of-lists on the fly, though defaultdict(list) is cleaner when all keys use the same default type.",
  },
  {
    id: "py-dict-fromkeys",
    language: "python",
    title: "dict.fromkeys",
    tag: "snippet",
    code: `# fromkeys(iterable, value) creates a dict with all keys set to value.
keys = ["x", "y", "z"]
d = dict.fromkeys(keys, 0)
print(d)  # {'x': 0, 'y': 0, 'z': 0}

# Default value is None.
seen = dict.fromkeys("hello")
print(seen)  # {'h': None, 'e': None, 'l': None, 'o': None}

# Gotcha: mutable value is SHARED across all keys.
bad = dict.fromkeys(["a", "b"], [])
bad["a"].append(1)
print(bad)  # {'a': [1], 'b': [1]}  — both point to same list!
# Fix: use a comprehension — {k: [] for k in keys}`,
    explanation: "fromkeys creates a quick lookup skeleton. If value is a mutable object, every key shares the same instance — use a dict comprehension with separate new objects instead.",
  },
  {
    id: "py-any-all-gen",
    language: "python",
    title: "any() / all() with generator expressions",
    tag: "snippet",
    code: `nums = [2, 4, 6, 7, 8]

# any() short-circuits on first True.
print(any(n % 2 != 0 for n in nums))  # True  (stops at 7)

# all() short-circuits on first False.
print(all(n % 2 == 0 for n in nums))  # False (stops at 7)

# Over dict values:
scores = {"alice": 90, "bob": -1, "carol": 78}
print(all(v >= 0 for v in scores.values()))  # False

# any/all on empty iterables: all([]) == True, any([]) == False.
print(all([]))  # True (vacuously)
print(any([]))  # False`,
    explanation: "Pass a generator expression (no brackets) to any/all — it avoids building the full list and short-circuits as soon as the answer is known.",
  },
  {
    id: "py-sorted-multi",
    language: "python",
    title: "sorted() with multiple sort keys",
    tag: "snippet",
    code: `students = [
    ("alice", 90, "B"),
    ("bob",   90, "A"),
    ("carol", 85, "A"),
]

# Sort by score descending, then name ascending.
# Negate numeric key to reverse without reverse=True.
result = sorted(students, key=lambda s: (-s[1], s[0]))
for row in result:
    print(row)
# ('alice', 90, 'B')
# ('bob',   90, 'A')
# ('carol', 85, 'A')`,
    explanation: "Python's sort is stable, so negating a numeric key flips that column's direction without disturbing the string column's ascending order.",
  },
  {
    id: "py-reversed-custom",
    language: "python",
    title: "reversed() with custom __reversed__",
    tag: "snippet",
    code: `# reversed() works on lists, tuples, strings, range, and custom types.
print(list(reversed([1, 2, 3])))    # [3, 2, 1]
print(list(reversed(range(5))))     # [4, 3, 2, 1, 0]

class Countdown:
    def __init__(self, n): self.n = n
    def __len__(self):     return self.n
    def __getitem__(self, i): return self.n - i
    # If __reversed__ not defined, falls back to __len__ + __getitem__.

for v in reversed(Countdown(4)):
    print(v, end=" ")  # 4 3 2 1`,
    explanation: "reversed() calls __reversed__ if defined, otherwise uses __len__ and __getitem__ — define __reversed__ for O(1) reverse iteration when the default fallback would be slow.",
  },
  // --- understanding ---
  {
    id: "py-legb-scope",
    language: "python",
    title: "LEGB scope resolution",
    tag: "understanding",
    code: `x = "global"

def outer():
    x = "enclosing"
    def inner():
        x = "local"
        print(x)   # local
    inner()
    print(x)       # enclosing

outer()
print(x)           # global

# Resolution order: Local → Enclosing → Global → Built-in`,
    explanation: "Python walks outward through scopes to resolve names. Assignment always creates a local binding unless 'global' or 'nonlocal' explicitly extends the scope.",
  },
  {
    id: "py-nonlocal-change",
    language: "python",
    title: "nonlocal rebinds an enclosing variable",
    tag: "understanding",
    code: `def make_counter():
    count = 0
    def increment():
        nonlocal count   # rebinds the enclosing 'count', not a new local
        count += 1
        return count
    return increment

c = make_counter()
print(c())  # 1
print(c())  # 2

# Without 'nonlocal', count += 1 raises UnboundLocalError because
# the assignment makes 'count' local, then tries to read it before init.`,
    explanation: "nonlocal lets an inner function write to an enclosing function's variable — the clean mechanism for stateful closures without needing a class.",
  },
  {
    id: "py-bool-short-value",
    language: "python",
    title: "and/or return operands, not booleans",
    tag: "understanding",
    code: `# 'and' returns the first falsy value, or the last value.
print(1 and 2)      # 2   (both truthy → last)
print(0 and 2)      # 0   (first falsy → short-circuit)

# 'or' returns the first truthy value, or the last value.
print(0 or 42)      # 42  (first truthy)
print("" or "hi")   # 'hi'
print(0 or [])      # []  (both falsy → last)

# Common idiom for defaults:
name = None
display = name or "anonymous"
print(display)  # anonymous`,
    explanation: "and/or are not guaranteed to return bool — they return one of their operands. This is why 'x or default' works as a concise default pattern.",
  },
  {
    id: "py-print-none",
    language: "python",
    title: "print() returns None",
    tag: "understanding",
    code: `# print() is a void function — it always returns None.
result = print("hello")   # hello
print(result)             # None

# Classic trap: collecting results of print calls.
names = ["alice", "bob"]
uppercased = [print(n.upper()) for n in names]
# ALICE
# BOB
print(uppercased)  # [None, None]  — NOT the strings!`,
    explanation: "print() is a side-effectful function whose return value is always None — assigning or collecting it is always a bug.",
  },
  {
    id: "py-del-name",
    language: "python",
    title: "del removes a name, not the object",
    tag: "understanding",
    code: `a = [1, 2, 3]
b = a          # b and a reference the same list

del a          # unbinds the name 'a'; list still lives via 'b'
print(b)       # [1, 2, 3]

# del on an index removes the element:
del b[0]
print(b)  # [2, 3]

# del on a dict key removes the entry:
d = {"x": 1, "y": 2}
del d["x"]
print(d)  # {'y': 2}`,
    explanation: "del unbinds a name (or removes a container item), but the object is only garbage-collected when its reference count reaches zero — other references keep it alive.",
  },
  {
    id: "py-chained-comp",
    language: "python",
    title: "Chained comparisons — each operand evaluated once",
    tag: "understanding",
    code: `x = 5

# 1 < x < 10 means (1 < x) and (x < 10) — x evaluated once.
print(1 < x < 10)    # True
print(1 < x < 4)     # False

# Works across types.
print(1 == 1.0 < 2)  # True  (1==1.0 and 1.0<2)

# Gotcha: not is (!) — the following is an identity chain, not negation.
a = b = []
print(a is b is not None)  # True  (a is b) and (b is not None)`,
    explanation: "Python chains comparisons by evaluating each middle operand once, equivalent to joining with 'and'. This is more efficient and readable than writing the full conjunction.",
  },
  {
    id: "py-class-var-list",
    language: "python",
    title: "Class variable list is shared across all instances",
    tag: "understanding",
    code: `class Team:
    members = []   # class variable — ONE list for all instances

    def add(self, name):
        self.members.append(name)   # mutates the shared list

t1 = Team()
t2 = Team()
t1.add("alice")
t2.add("bob")

print(t1.members)  # ['alice', 'bob']  — both see all!
print(t2.members)  # ['alice', 'bob']

# Fix: initialise per instance in __init__.
# def __init__(self): self.members = []`,
    explanation: "Mutable class-level attributes are shared by all instances. Appending through any instance mutates the single shared object.",
  },
  {
    id: "py-generator-exhaustion",
    language: "python",
    title: "Generators can only be iterated once",
    tag: "understanding",
    code: `def gen():
    yield 1
    yield 2
    yield 3

g = gen()
print(list(g))  # [1, 2, 3]
print(list(g))  # []  — exhausted, silently empty

# Same for map, filter, zip.
m = map(str, [1, 2, 3])
_ = list(m)  # consumes it
print(list(m))  # []  — gone

# Fix: materialise to a list if you need multiple passes.
nums = list(gen())`,
    explanation: "Generators (and most iterators) are single-pass. Iterating an exhausted generator returns nothing — not an error. Materialise with list() if you need to iterate more than once.",
  },
  {
    id: "py-is-small-int",
    language: "python",
    title: "is vs == with integers — the small-int cache",
    tag: "understanding",
    code: `# CPython caches integers in [-5, 256] as singletons.
a = 256; b = 256
print(a is b)   # True  — same cached object

a = 257; b = 257
print(a is b)   # False (usually) — separate objects
print(a == b)   # True  — value equality always works

# String interning is similar: short identifier-like strings are cached.
x = "hello"; y = "hello"
print(x is y)   # True  (interned)

# Rule: ALWAYS use == for value comparisons.`,
    explanation: "The small-int and string caches are CPython implementation details that may differ across Python versions and implementations — never rely on 'is' for value equality.",
  },
  {
    id: "py-division-types",
    language: "python",
    title: "True division / vs floor division //",
    tag: "understanding",
    code: `print(7 / 2)     # 3.5   — always returns float
print(7 // 2)    # 3     — floor toward -inf
print(-7 // 2)   # -4    — NOT -3; floor rounds down, not toward zero
print(-7 % 2)    # 1     — always non-negative when divisor is positive

# divmod returns (quotient, remainder) in one call.
print(divmod(7, 2))    # (3, 1)
print(divmod(-7, 2))   # (-4, 1)  — q*d + r == -7`,
    explanation: "// floors toward negative infinity, not toward zero — so -7 // 2 is -4, not -3. Python's modulo sign always matches the divisor, unlike C/Java where it matches the dividend.",
  },
  {
    id: "py-tuple-mutable",
    language: "python",
    title: "Tuples can contain (and be mutated through) mutable objects",
    tag: "understanding",
    code: `t = (1, [2, 3], 4)

# Can't rebind a slot.
try:
    t[1] = [99]
except TypeError:
    print("tuple index is immutable")

# But the list inside can still be mutated.
t[1].append(99)
print(t)   # (1, [2, 3, 99], 4)

# A tuple containing a list is not hashable.
try:
    hash(t)
except TypeError as e:
    print(e)  # unhashable type: 'list'`,
    explanation: "Tuple immutability means the slot bindings can't change, not that the objects those slots point to are frozen. A tuple is hashable only when all its elements are.",
  },
  {
    id: "py-for-else-clause",
    language: "python",
    title: "for/else — else fires when no break occurs",
    tag: "understanding",
    code: `def find_prime(n):
    for d in range(2, n):
        if n % d == 0:
            print(f"{n} divisible by {d}")
            break
    else:
        # 'else' runs only if the loop completes without break.
        print(f"{n} is prime")

find_prime(7)   # 7 is prime
find_prime(9)   # 9 divisible by 3`,
    explanation: "The for/else clause fires when the loop exhausted its iterator without executing break — a clean way to handle 'not found' without a sentinel flag variable.",
  },
  {
    id: "py-lambda-closure",
    language: "python",
    title: "Lambda captures variable by reference, not by value",
    tag: "understanding",
    code: `# Late-binding: each lambda refers to 'i', not its value at creation.
funcs = [lambda: i for i in range(3)]
print([f() for f in funcs])  # [2, 2, 2]  — all return last i

# Fix: capture current value via a default argument.
funcs2 = [lambda i=i: i for i in range(3)]
print([f() for f in funcs2])  # [0, 1, 2]

# This is the same late-binding problem as with any closure.
fns = []
for x in range(3):
    fns.append(lambda x=x: x)
print([f() for f in fns])  # [0, 1, 2]`,
    explanation: "Lambda (and any closure) closes over the variable binding, not the value at creation time. The default-argument trick forces immediate capture of the current value.",
  },
  {
    id: "py-aug-tuple",
    language: "python",
    title: "Augmented assignment to a tuple slot mutates then raises",
    tag: "understanding",
    code: `t = ([1, 2], "ok")

# t[0] += [3] desugars to:
#   temp = t[0].__iadd__([3])  # mutates the list in-place
#   t[0] = temp                # tries to rebind tuple slot → TypeError
try:
    t[0] += [3]
except TypeError:
    pass

# The list was already mutated BEFORE the error!
print(t)   # ([1, 2, 3], 'ok')`,
    explanation: "list.__iadd__ mutates in place and returns self; the subsequent tuple assignment raises TypeError — so the mutation succeeds but the exception fires. A well-known Python wart.",
  },
  // --- structures ---
  {
    id: "py-deque-rotate",
    language: "python",
    title: "deque.rotate() — O(k) circular shift",
    tag: "structures",
    code: `from collections import deque

d = deque([1, 2, 3, 4, 5])

# rotate(n) shifts elements right by n (left if n is negative).
d.rotate(2)
print(d)   # deque([4, 5, 1, 2, 3])

d.rotate(-2)
print(d)   # deque([1, 2, 3, 4, 5])  back to original

# Equivalent list operation would be O(n):
# lst = lst[-n:] + lst[:-n]  — creates two new lists`,
    explanation: "deque.rotate is O(k) using O(1) pointer moves, making it far faster than slicing a list for circular buffer or round-robin patterns.",
  },
  {
    id: "py-bisect-insort",
    language: "python",
    title: "bisect.insort maintains sorted order",
    tag: "structures",
    code: `import bisect

nums = [1, 3, 5, 7]

# insort inserts in sorted position (binary search + O(n) shift).
bisect.insort(nums, 4)
print(nums)  # [1, 3, 4, 5, 7]

bisect.insort(nums, 0)
print(nums)  # [0, 1, 3, 4, 5, 7]

# bisect_left/right find insertion position without inserting.
pos = bisect.bisect_left(nums, 4)
print(pos)   # 3

# Search: is x in the sorted list?
def in_sorted(lst, x):
    i = bisect.bisect_left(lst, x)
    return i < len(lst) and lst[i] == x`,
    explanation: "bisect.insort keeps a list sorted after each insert without re-sorting the whole list — good for small sorted lists; use sortedcontainers.SortedList for large ones.",
  },
  {
    id: "py-ordereddict-move",
    language: "python",
    title: "OrderedDict.move_to_end",
    tag: "structures",
    code: `from collections import OrderedDict

od = OrderedDict([("a", 1), ("b", 2), ("c", 3)])

# move_to_end moves a key to the end (or front).
od.move_to_end("a")
print(list(od))  # ['b', 'c', 'a']

od.move_to_end("a", last=False)
print(list(od))  # ['a', 'b', 'c']

# LRU skeleton: access → move_to_end, evict → popitem(last=False).
od.move_to_end("b")           # access 'b'
oldest_key, _ = od.popitem(last=False)
print(oldest_key)   # 'a'  — was at the front`,
    explanation: "move_to_end is O(1) and is the key primitive for an LRU cache; functools.lru_cache uses a similar doubly-linked-list strategy internally.",
  },
  {
    id: "py-chainmap-write",
    language: "python",
    title: "ChainMap reads all layers, writes only to the first",
    tag: "structures",
    code: `from collections import ChainMap

defaults   = {"color": "blue", "size": "M"}
user_prefs = {"color": "red"}

# ChainMap reads: first map checked first.
cm = ChainMap(user_prefs, defaults)
print(cm["color"])   # 'red'   (from user_prefs)
print(cm["size"])    # 'M'     (from defaults)

# Writes go ONLY to the first map.
cm["weight"] = 5
print(user_prefs)   # {'color': 'red', 'weight': 5}
print(defaults)     # {'color': 'blue', 'size': 'M'}  unchanged`,
    explanation: "ChainMap is ideal for layered configuration (env → file → defaults): reads search all layers but writes affect only the front map, leaving lower layers untouched.",
  },
  {
    id: "py-namedtuple-replace",
    language: "python",
    title: "NamedTuple._replace creates a modified copy",
    tag: "structures",
    code: `from collections import namedtuple

Point = namedtuple("Point", ["x", "y"])
p = Point(1, 2)

# _replace returns a NEW instance with specified fields changed.
p2 = p._replace(x=99)
print(p2)  # Point(x=99, y=2)
print(p)   # Point(x=1, y=2)  unchanged

from typing import NamedTuple
class Color(NamedTuple):
    r: int
    g: int
    b: int

red = Color(255, 0, 0)
print(red._replace(r=200))  # Color(r=200, g=0, b=0)`,
    explanation: "_replace is named with a leading underscore to avoid clashing with user-defined field names — it's a documented, public API that returns a new tuple with selective substitutions.",
  },
  {
    id: "py-frozenset-hashable",
    language: "python",
    title: "frozenset is hashable — use as dict key or set element",
    tag: "structures",
    code: `# frozenset is the immutable, hashable sibling of set.
fs = frozenset([1, 2, 3])
print(hash(fs))  # stable integer

# Use as dict key to represent an unordered group.
edge_weight = {
    frozenset({"a", "b"}): 5,
    frozenset({"b", "c"}): 3,
}
print(edge_weight[frozenset({"b", "a"})])  # 5  (order doesn't matter)

# Deduplicate undirected edges.
edges = {frozenset({u, v}) for u, v in [("a","b"), ("b","a"), ("c","d")]}
print(len(edges))  # 2  (("a","b") and ("b","a") are the same edge)`,
    explanation: "frozenset fills the niche of 'set you can hash' — great for representing unordered pairs (undirected edges, query tags) as dict keys.",
  },
  {
    id: "py-counter-update",
    language: "python",
    title: "Counter.update and subtract",
    tag: "structures",
    code: `from collections import Counter

c = Counter(["a", "b", "a", "c"])
print(c)  # Counter({'a': 2, 'b': 1, 'c': 1})

# update() adds counts (like +=).
c.update(["a", "b", "b"])
print(c)  # Counter({'b': 3, 'a': 3, 'c': 1})

# subtract() reduces counts — can go negative.
c.subtract(["a", "a", "a", "a"])
print(c)  # Counter({'b': 3, 'c': 1, 'a': -1})

# elements() yields only items with count > 0.
print(list(c.elements()))  # ['b', 'b', 'b', 'c']`,
    explanation: "update adds while subtract removes — counts can go negative with subtract (unlike the - operator which clamps at zero). Use elements() to expand back to a multiset.",
  },
  {
    id: "py-deque-maxlen",
    language: "python",
    title: "deque(maxlen=n) — auto-evicting sliding window",
    tag: "structures",
    code: `from collections import deque

window = deque(maxlen=3)

for x in range(6):
    window.append(x)
    print(list(window))
# [0]
# [0, 1]
# [0, 1, 2]
# [1, 2, 3]   <- 0 evicted from left
# [2, 3, 4]
# [3, 4, 5]

# appendleft evicts from the right when full.
buf = deque(maxlen=3)
for x in [1, 2, 3, 4]:
    buf.appendleft(x)
print(buf)  # deque([4, 3, 2])`,
    explanation: "deque(maxlen=n) is a fixed-capacity sliding window that discards the oldest element automatically — more efficient than list.pop(0) which is O(n).",
  },
  {
    id: "py-dict-insertion-order",
    language: "python",
    title: "dicts preserve insertion order (Python 3.7+)",
    tag: "structures",
    code: `d = {}
d["first"]  = 1
d["second"] = 2
d["third"]  = 3

# Guaranteed insertion order.
print(list(d.keys()))   # ['first', 'second', 'third']

# Reversing a dict view (3.8+).
print(list(reversed(d)))  # ['third', 'second', 'first']

# Updating an existing key does NOT change its position.
d["first"] = 99
print(list(d.keys()))   # ['first', 'second', 'third']  same order

# Only inserting a NEW key appends to the end.`,
    explanation: "Insertion order is now part of the language spec (not just CPython). Updating a value keeps the key in its original position; only new keys append.",
  },
  {
    id: "py-set-discard",
    language: "python",
    title: "set.discard vs set.remove",
    tag: "structures",
    code: `s = {1, 2, 3}

# remove() raises KeyError when element is absent.
s.remove(2)
print(s)  # {1, 3}
try:
    s.remove(99)
except KeyError:
    print("not found!")

# discard() silently does nothing when element is absent.
s.discard(99)  # no error
s.discard(1)
print(s)  # {3}`,
    explanation: "Use remove when the element must be present (an absent element signals a logic error); use discard for 'delete if present' semantics where absence is normal.",
  },
  {
    id: "py-array-typed",
    language: "python",
    title: "array.array — compact typed numeric storage",
    tag: "structures",
    code: `import array, sys

# array.array stores values as C types, not Python objects.
# typecodes: 'b'=int8, 'i'=int32, 'f'=float32, 'd'=float64
ints = array.array('i', [1, 2, 3, 4, 5])
lst  = [1, 2, 3, 4, 5]

print(sys.getsizeof(ints))  # ~86 bytes
print(sys.getsizeof(lst))   # ~120 bytes (+ ~28 per element)

ints.append(6)
ints.extend([7, 8])

# Fast binary I/O.
raw = ints.tobytes()          # to bytes
back = array.array('i', raw)  # from bytes
print(list(back))  # [1, 2, 3, 4, 5, 6, 7, 8]`,
    explanation: "array.array gives a compact homogeneous buffer for numeric data without numpy — each element takes its C type's width instead of a full Python object.",
  },
  {
    id: "py-bytes-vs-bytearray",
    language: "python",
    title: "bytes (immutable) vs bytearray (mutable)",
    tag: "structures",
    code: `b  = bytes([65, 66, 67])    # b'ABC'
ba = bytearray([65, 66, 67])

# bytes is immutable.
try:
    b[0] = 90
except TypeError:
    print("bytes are immutable")

# bytearray is mutable.
ba[0] = 90       # Z
ba.append(68)    # D
print(ba)        # bytearray(b'ZBCD')

# Convert between them freely.
print(bytes(ba))     # b'ZBCD'
print(ba.hex())      # '5a424344'`,
    explanation: "Use bytes for constants and read-only data (network frames, hashes); use bytearray when you need to build or patch binary data incrementally in-place.",
  },
  {
    id: "py-memoryview-zero-copy",
    language: "python",
    title: "memoryview enables zero-copy slicing",
    tag: "structures",
    code: `data = bytearray(b"Hello, World!")

# Slicing a bytearray creates a copy.
chunk = data[7:12]          # copy: b'World'

# memoryview slice references the same underlying buffer.
mv   = memoryview(data)
view = mv[7:12]             # no copy
print(bytes(view))          # b'World'

# Modifying the view modifies the original.
view[0:2] = b"Py"
print(data)  # bytearray(b'Hello, Pyild!')`,
    explanation: "memoryview lets you pass sub-buffers to socket.send() or struct.pack_into() without copying — critical for zero-copy I/O on large binary payloads.",
  },
  {
    id: "py-heapq-nlargest",
    language: "python",
    title: "heapq.nlargest / nsmallest",
    tag: "structures",
    code: `import heapq

scores = [34, 78, 12, 56, 90, 23, 67]

# nlargest / nsmallest run in O(n log k), better than full sort for small k.
print(heapq.nlargest(3, scores))   # [90, 78, 67]
print(heapq.nsmallest(3, scores))  # [12, 23, 34]

# With key function.
players = [("alice", 90), ("bob", 78), ("carol", 95)]
top2 = heapq.nlargest(2, players, key=lambda p: p[1])
print(top2)   # [('carol', 95), ('alice', 90)]`,
    explanation: "nlargest/nsmallest use a heap and run in O(n log k); for k close to n a full sorted() is cheaper — the docs recommend that crossover point.",
  },
  // --- caveats ---
  {
    id: "py-mutable-default-dict",
    language: "python",
    title: "Mutable default argument — dict stays across calls",
    tag: "caveats",
    code: `# The default dict is created ONCE at function definition.
def add_entry(key, val, cache={}):
    cache[key] = val
    return cache

print(add_entry("a", 1))  # {'a': 1}
print(add_entry("b", 2))  # {'a': 1, 'b': 2}  — leftover!

# Fix: use None and create inside.
def add_entry_fixed(key, val, cache=None):
    if cache is None:
        cache = {}
    cache[key] = val
    return cache`,
    explanation: "The mutable default argument bug applies to lists, dicts, and sets. The object is bound at function definition time; use None as sentinel and create fresh inside.",
  },
  {
    id: "py-sort-none-return",
    language: "python",
    title: "list.sort() returns None — use sorted() for a new list",
    tag: "caveats",
    code: `nums = [3, 1, 4, 1, 5]

# sort() mutates in-place and returns None.
result = nums.sort()
print(result)  # None  ← common gotcha
print(nums)    # [1, 1, 3, 4, 5]

# sorted() returns a new list; original untouched.
nums2  = [3, 1, 4]
result2 = sorted(nums2)
print(result2)  # [1, 3, 4]
print(nums2)    # [3, 1, 4]  unchanged`,
    explanation: "sort() follows command-query separation by returning None to signal mutation; sorted() is the pure version that leaves the original untouched.",
  },
  {
    id: "py-list-mult-shallow",
    language: "python",
    title: "list * n creates shallow copies — inner mutables are shared",
    tag: "caveats",
    code: `# Multiplying a list repeats references, not deep copies.
row  = [0, 0, 0]
grid = [row] * 3      # three references to the SAME row object

grid[0][1] = 99
print(grid)
# [[0, 99, 0], [0, 99, 0], [0, 99, 0]]  — all three affected!

# Fix: comprehension creates independent rows.
grid2 = [[0, 0, 0] for _ in range(3)]
grid2[0][1] = 99
print(grid2)
# [[0, 99, 0], [0, 0, 0], [0, 0, 0]]`,
    explanation: "[x] * n is fine for immutable elements (ints, strings) but dangerous with mutables because all n slots point to the same object.",
  },
  {
    id: "py-neg-modulo",
    language: "python",
    title: "Modulo with negative numbers — Python vs C",
    tag: "caveats",
    code: `# Python % result always has the same sign as the DIVISOR.
print( 7 %  3)   #  1
print(-7 %  3)   #  2  (not -1 — mathematical modulo)
print( 7 % -3)   # -2  (sign matches divisor -3)
print(-7 % -3)   # -1

# C/Java/JS would give -1 for -7 % 3 (sign matches dividend).

# divmod(-7, 3) uses the same flooring rule.
print(divmod(-7, 3))   # (-3, 2)  because -3*3 + 2 == -7`,
    explanation: "Python's % is the true mathematical modulo (always non-negative when divisor is positive), unlike C/Java/JS where % is the truncated remainder and can be negative.",
  },
  {
    id: "py-iterator-single",
    language: "python",
    title: "Iterators are single-pass — exhaustion is silent",
    tag: "caveats",
    code: `nums = iter([1, 2, 3])

print(list(nums))  # [1, 2, 3]
print(list(nums))  # []  — exhausted silently

# zip with one iterator used twice chunks into pairs.
it = iter(range(6))
pairs = list(zip(it, it))
print(pairs)  # [(0, 1), (2, 3), (4, 5)]

# Same trap with map/filter — materialise with list() if needed.
m = map(str, range(3))
print(sum(1 for _ in m))  # 3
print(sum(1 for _ in m))  # 0 — already exhausted`,
    explanation: "Exhausting an iterator returns an empty sequence, not an error. The zip(it, it) trick deliberately exploits single-pass behaviour to group consecutive elements.",
  },
  {
    id: "py-str-split-arg",
    language: "python",
    title: "str.split() vs str.split(' ') — whitespace handling differs",
    tag: "caveats",
    code: `s = "  hello   world  "

# No arg: collapses any whitespace, strips leading/trailing.
print(s.split())       # ['hello', 'world']

# Single space: splits on EXACTLY one space, keeps empty strings.
print(s.split(" "))    # ['', '', 'hello', '', '', 'world', '', '']

# Explicit sep with maxsplit:
print("a:b:c".split(":", 1))   # ['a', 'b:c']

# rsplit splits from the right.
print("a:b:c".rsplit(":", 1))  # ['a:b', 'c']`,
    explanation: "split() with no argument collapses all whitespace and ignores leading/trailing — split(' ') treats every space as a delimiter and creates empty strings for consecutive spaces.",
  },
  {
    id: "py-in-complexity",
    language: "python",
    title: "in is O(n) for list, O(1) for set/dict",
    tag: "caveats",
    code: `import time

n = 500_000
data_list = list(range(n))
data_set  = set(data_list)

target = n - 1   # worst case for list (last element)

t = time.perf_counter()
_ = target in data_list
print(f"list: {time.perf_counter()-t:.4f}s")  # ~0.005s

t = time.perf_counter()
_ = target in data_set
print(f"set:  {time.perf_counter()-t:.7f}s")  # ~0.0000001s

# dict 'in' tests keys, also O(1).
data_dict = dict.fromkeys(data_list)
_ = target in data_dict`,
    explanation: "If you're testing membership repeatedly against the same collection, convert it to a set once — each lookup drops from O(n) to O(1).",
  },
  {
    id: "py-except-broad",
    language: "python",
    title: "except BaseException catches KeyboardInterrupt and SystemExit",
    tag: "caveats",
    code: `# Exception hierarchy (simplified):
# BaseException
#   ├── SystemExit        (sys.exit())
#   ├── KeyboardInterrupt (Ctrl+C)
#   ├── GeneratorExit
#   └── Exception         ← catch this normally
#         └── ValueError, TypeError, OSError, ...

# 'except Exception' leaves Ctrl+C and sys.exit() unhandled.
try:
    raise ValueError("oops")
except Exception as e:
    print(f"caught: {e}")   # caught: oops

# 'except BaseException' swallows EVERYTHING — use with care.
# Only appropriate for top-level cleanup handlers.`,
    explanation: "Always catch Exception, not BaseException, unless you're writing a top-level teardown handler that must run on any exit — swallowing KeyboardInterrupt makes programs uninterruptible.",
  },
  {
    id: "py-not-priority",
    language: "python",
    title: "not has lower precedence than comparison operators",
    tag: "caveats",
    code: `x = 5

# 'not' applies to the whole comparison expression.
print(not x > 3)     # False  — means: not (x > 3) → not True
print(not x == 5)    # False  — means: not (x == 5)
print(not "a" == "b") # True  — means: not False

# 'is not' and 'not in' are single tokens, not 'not' + 'is'/'in'.
print(x is not None)    # True  — single operator
print(x not in [1, 2])  # True  — single operator

# Equivalent but less clear:
print(not (x is None))     # True
print(not (x in [1, 2]))   # True`,
    explanation: "'not' applies to the entire following comparison; is not and not in are distinct operators with clearer intent and slightly better performance.",
  },
  {
    id: "py-string-is-caveat",
    language: "python",
    title: "String interning makes is unpredictable for strings",
    tag: "caveats",
    code: `# CPython interns short identifier-like strings.
a = "hello"; b = "hello"
print(a is b)   # True  (interned — implementation detail)

# Strings with spaces or special chars may not be interned.
a = "hello world"; b = "hello world"
print(a is b)   # False or True — unspecified!

# Computed strings are usually not interned.
s1 = "hel" + "lo"
s2 = "hello"
print(s1 is s2)   # True in CPython (constant folding), not guaranteed

# Rule: NEVER use 'is' for string equality. Always use ==.`,
    explanation: "CPython's string interning is an optimisation detail, not a guarantee — the same string literal may or may not be the same object depending on context.",
  },
  {
    id: "py-tuple-iadd",
    language: "python",
    title: "tuple += mutates the contained list before raising",
    tag: "caveats",
    code: `t = ([1, 2], "fixed")

# t[0] += [3] expands to:
#   temp = t[0].__iadd__([3])  # list mutated in-place, returns self
#   t[0] = temp                # tries to assign — TypeError on tuple!
try:
    t[0] += [3]
except TypeError:
    pass

# The mutation already happened despite the exception!
print(t)   # ([1, 2, 3], 'fixed')`,
    explanation: "list.__iadd__ mutates in place and returns self, THEN the tuple index assignment raises TypeError — the data is already changed. Avoid in-place operators on mutable items inside tuples.",
  },
  {
    id: "py-copy-shallow-issue",
    language: "python",
    title: "copy.copy — one layer deep, inner objects shared",
    tag: "caveats",
    code: `import copy

orig = {"a": [1, 2, 3], "b": [4, 5]}

# Shallow copy duplicates the outer dict but not the inner lists.
shallow = copy.copy(orig)
shallow["a"].append(99)
print(orig["a"])  # [1, 2, 3, 99]  — shared!

# Deep copy creates fully independent objects.
deep = copy.deepcopy(orig)
deep["a"].append(77)
print(orig["a"])  # [1, 2, 3, 99]  unchanged`,
    explanation: "copy.copy duplicates one layer; nested mutables are still aliased. Use copy.deepcopy only when you genuinely need full independence, as it's slower and can fail on unpicklable objects.",
  },
  {
    id: "py-float-equality",
    language: "python",
    title: "Float equality is unreliable — use math.isclose",
    tag: "caveats",
    code: `# IEEE 754 can't represent 0.1 or 0.2 exactly.
print(0.1 + 0.2 == 0.3)          # False!
print(0.1 + 0.2)                  # 0.30000000000000004

import math
# isclose checks within relative (and optional absolute) tolerance.
print(math.isclose(0.1 + 0.2, 0.3))             # True
print(math.isclose(1e-10, 0, abs_tol=1e-9))     # True

# For exact base-10 arithmetic use decimal.Decimal.
from decimal import Decimal
print(Decimal("0.1") + Decimal("0.2"))  # 0.3`,
    explanation: "IEEE 754 doubles can't represent 0.1 exactly; never compare floats with ==. Use math.isclose for toleranced comparisons, or Decimal for exact base-10 arithmetic.",
  },
  {
    id: "py-none-default-mutable",
    language: "python",
    title: "Use None as sentinel for mutable defaults",
    tag: "caveats",
    code: `# Strings are immutable — using a string default is fine.
def greet(name, greeting="Hello"):
    return f"{greeting}, {name}!"

print(greet("alice"))       # Hello, alice!
print(greet("bob", "Hi"))   # Hi, bob!

# Lists/dicts/sets are mutable — use None sentinel instead.
def build(items=None):
    if items is None:
        items = []   # fresh list on every call
    items.append("done")
    return items

print(build())   # ['done']
print(build())   # ['done']  — not ['done', 'done']`,
    explanation: "None-sentinel pattern is the standard fix for mutable defaults. For immutable defaults like strings or ints, using the value directly is perfectly fine.",
  },
  // --- types ---
  {
    id: "py-int-unlimited",
    language: "python",
    title: "Python int is arbitrary-precision",
    tag: "types",
    code: `# Python int grows as large as memory allows — no overflow.
print(2 ** 1000)   # 302-digit number, no OverflowError

# Arithmetic is always exact.
print(2 ** 63)     # 9223372036854775808  (C long would overflow)

# Factorial stays exact.
import math
print(math.factorial(50))
# 30414093201713378043612608166979581188299763898377856000000000000

# Tradeoff: operations on big ints are slower than fixed-width.`,
    explanation: "Unlike C/Java where integer overflow silently wraps, Python's int is arbitrary-precision. The tradeoff is that large-int arithmetic is slower than 64-bit hardware operations.",
  },
  {
    id: "py-float-special-vals",
    language: "python",
    title: "float: inf, -inf, and nan",
    tag: "types",
    code: `import math

inf = float("inf")
nan = float("nan")

print(inf > 1e308)      # True
print(inf + inf)        # inf
print(inf - inf)        # nan
print(1.0 / 0.0)        # raises ZeroDivisionError (not inf!)

# NaN is not equal to anything, including itself.
print(nan == nan)         # False  — correct IEEE 754 behaviour
print(math.isnan(nan))    # True   — only reliable way to detect NaN
print(math.isinf(inf))    # True`,
    explanation: "nan != nan is intentional and spec-correct IEEE 754 behaviour; always use math.isnan() to detect NaN. Division by zero in Python raises an exception rather than returning inf.",
  },
  {
    id: "py-decimal-exact",
    language: "python",
    title: "decimal.Decimal for exact base-10 arithmetic",
    tag: "types",
    code: `from decimal import Decimal, getcontext

# Float is inexact.
print(0.1 + 0.2)                 # 0.30000000000000004

# Decimal with string literal is exact.
print(Decimal("0.1") + Decimal("0.2"))   # 0.3

# Control precision globally.
getcontext().prec = 50
print(Decimal(1) / Decimal(3))
# 0.33333333333333333333333333333333333333333333333333

# Decimal from float carries float's imprecision — use strings!
print(Decimal(0.1))   # 0.1000000000000000055511151...`,
    explanation: "Always construct Decimal from string literals, not floats — Decimal(0.1) captures the float's binary imprecision. Essential for financial calculations where 0.1 + 0.2 must equal 0.3.",
  },
  {
    id: "py-fraction-rational",
    language: "python",
    title: "fractions.Fraction — exact rational arithmetic",
    tag: "types",
    code: `from fractions import Fraction

f = Fraction(1, 3)
print(f)                       # 1/3
print(f + Fraction(1, 6))      # 1/2
print(f * 3)                   # 1

# From string: exact.
print(Fraction("0.1"))         # 1/10

# From float: captures the float's binary representation.
print(Fraction(0.1))
# 3602879701896397/36028797018963968  — shows float imprecision

# Fraction auto-reduces.
print(Fraction(4, 6))          # 2/3`,
    explanation: "Fraction gives mathematically exact rational arithmetic. Like Decimal, Fraction('0.1') is exact while Fraction(0.1) captures the float's actual binary value.",
  },
  {
    id: "py-none-singleton",
    language: "python",
    title: "None is a singleton — always use is None",
    tag: "types",
    code: `# There is exactly one None object in a Python process.
print(None is None)   # True
print(id(None) == id(None))  # True — fixed address

x = None

# PEP 8: use 'is' for None comparisons.
if x is None:
    print("x is None")     # preferred

# == also works but triggers __eq__ and emits linter warnings.
if x == None:              # works but avoid
    pass

# The only values that satisfy 'x is None' are literally None.`,
    explanation: "None is a singleton by design. Using 'is None' is both idiomatic and marginally faster since it skips __eq__ entirely.",
  },
  {
    id: "py-bytes-vs-str-types",
    language: "python",
    title: "bytes and str are distinct types — no implicit coercion",
    tag: "types",
    code: `s = "hello"      # str:   Unicode text
b = b"hello"     # bytes: raw bytes

print(type(s))   # <class 'str'>
print(type(b))   # <class 'bytes'>

# No automatic conversion — mixing raises TypeError.
try:
    _ = s + b
except TypeError as e:
    print(e)   # can only concatenate str (not "bytes") to str

# Explicit encode/decode at the boundary.
encoded = s.encode("utf-8")    # str → bytes
decoded = b.decode("utf-8")    # bytes → str
print(type(encoded))   # <class 'bytes'>`,
    explanation: "Python 3's strict bytes/str separation prevents a whole class of encoding bugs. Encode at the I/O boundary and work with str internally.",
  },
  {
    id: "py-range-obj",
    language: "python",
    title: "range is a lazy sequence, not a list",
    tag: "types",
    code: `r = range(0, 10, 2)

print(type(r))         # <class 'range'>
print(r[3])            # 6     — O(1) indexed access
print(len(r))          # 5
print(8 in r)          # True  — O(1) membership test
print(r.start, r.stop, r.step)  # 0 10 2

# range equality compares the represented sequences.
print(range(3) == range(0, 3, 1))  # True

# Reversed range is a range.
print(list(reversed(r)))  # [8, 6, 4, 2, 0]`,
    explanation: "range is a lazy sequence object (not a generator) with O(1) length, indexing, and membership testing. It supports all read-only sequence operations.",
  },
  {
    id: "py-slice-obj",
    language: "python",
    title: "Slice objects can be stored and reused",
    tag: "types",
    code: `data = list(range(10))

# Named slices improve readability for structured data.
HEADER = slice(0, 3)
BODY   = slice(3, 8)
FOOTER = slice(8, None)

print(data[HEADER])  # [0, 1, 2]
print(data[BODY])    # [3, 4, 5, 6, 7]
print(data[FOOTER])  # [8, 9]

# slice.indices(length) normalises for concrete values.
s = slice(None, -1)
print(s.indices(5))  # (0, 4, 1)  — equivalent to [0:4]`,
    explanation: "Storing slices as named variables eliminates magic numbers when processing structured binary formats or fixed-column CSV data.",
  },
  {
    id: "py-type-exact",
    language: "python",
    title: "type() exact match vs isinstance() hierarchy",
    tag: "types",
    code: `class Animal: pass
class Dog(Animal): pass

d = Dog()

# type() checks the exact type.
print(type(d) is Dog)     # True
print(type(d) is Animal)  # False — Animal is not the exact class

# isinstance() checks the full MRO.
print(isinstance(d, Dog))     # True
print(isinstance(d, Animal))  # True

# isinstance also accepts ABCs.
from collections.abc import Sequence
print(isinstance([], Sequence))   # True
print(isinstance("hi", Sequence)) # True`,
    explanation: "isinstance respects inheritance and ABCs (via __instancecheck__), making it the right tool for type-guard checks. Use type() equality only when you want exact-type dispatch.",
  },
  {
    id: "py-int-bit-length",
    language: "python",
    title: "int.bit_length() and int.bit_count()",
    tag: "types",
    code: `print((0).bit_length())     # 0
print((1).bit_length())     # 1
print((255).bit_length())   # 8
print((256).bit_length())   # 9

# bit_count (3.10+): number of set bits (popcount).
print(bin(0b1010))                # 0b1010
print((0b1010).bit_count())       # 2
print((0xff).bit_count())         # 8

# Power-of-two check using bit tricks.
def is_pow2(n): return n > 0 and (n & (n - 1)) == 0
print(is_pow2(64))   # True
print(is_pow2(60))   # False`,
    explanation: "bit_length returns the minimum bits needed to represent the integer (ceiling log₂ + 1). bit_count is the hardware popcount exposed at the Python level.",
  },
  {
    id: "py-int-to-bytes",
    language: "python",
    title: "int.to_bytes() and int.from_bytes()",
    tag: "types",
    code: `n = 1024

# to_bytes(length, byteorder) encodes the integer as raw bytes.
b_big    = n.to_bytes(4, byteorder="big")
b_little = n.to_bytes(4, byteorder="little")
print(b_big.hex())     # 00000400
print(b_little.hex())  # 00040000

# from_bytes reconstructs the integer.
print(int.from_bytes(b_big, "big"))      # 1024
print(int.from_bytes(b_little, "little")) # 1024

# signed=True handles two's complement.
print((-1).to_bytes(2, "big", signed=True))  # b'\\xff\\xff'`,
    explanation: "to_bytes/from_bytes provide clean integer ↔ binary conversion for protocol serialisation, replacing struct.pack for single integer values.",
  },
  {
    id: "py-complex-arith",
    language: "python",
    title: "Complex numbers are a built-in type",
    tag: "types",
    code: `z1 = 3 + 4j    # 'j' is the imaginary unit
z2 = 1 - 2j

print(z1 + z2)    # (4+2j)
print(z1 * z2)    # (11-2j)
print(z1 / z2)    # (-1+2j)

# real, imag, conjugate.
print(z1.real, z1.imag)   # 3.0  4.0
print(z1.conjugate())     # (3-4j)
print(abs(z1))            # 5.0  (magnitude = sqrt(9+16))

import cmath
print(cmath.phase(z1))    # 0.9272952...  radians`,
    explanation: "Python's complex type supports all arithmetic operators; the cmath module provides complex-aware sqrt, exp, log, and trig functions.",
  },
  {
    id: "py-ellipsis-usage",
    language: "python",
    title: "The Ellipsis literal ... and its uses",
    tag: "types",
    code: `# ... is the singleton Ellipsis of type ellipsis.
print(type(...))    # <class 'ellipsis'>
print(... is ...)   # True — singleton

# 1. Stub body — signals 'not yet implemented' (like pass).
def todo(): ...

# 2. Type annotations: Callable[..., int] = any signature returning int.
from typing import Callable
handler: Callable[..., int]  # type: ignore

# 3. numpy multi-dim slicing: arr[..., 0]
#    means "all leading dimensions, first element of last axis".

# 4. All function bodies in .pyi stub files.`,
    explanation: "Ellipsis is a built-in singleton most visible in type annotations and NumPy slicing. Using ... as a function body instead of pass signals intentional incompleteness.",
  },
  {
    id: "py-notimplemented-sentinel",
    language: "python",
    title: "NotImplemented sentinel vs NotImplementedError",
    tag: "types",
    code: `class Vector:
    def __init__(self, x, y):
        self.x, self.y = x, y

    def __add__(self, other):
        if not isinstance(other, Vector):
            return NotImplemented   # sentinel — NOT an exception
        return Vector(self.x + other.x, self.y + other.y)

    def __repr__(self):
        return f"Vector({self.x}, {self.y})"

v = Vector(1, 2)
print(v + Vector(3, 4))   # Vector(4, 6)

# Python sees NotImplemented → tries other.__radd__(v) → fails → TypeError.
try:
    v + 5
except TypeError as e:
    print(e)   # unsupported operand type(s) for +`,
    explanation: "Return NotImplemented (not raise NotImplementedError) from binary dunders to tell Python 'I can't handle this' — Python then tries the reflected operation on the right operand.",
  },
  {
    id: "py-type-hints-unenforced",
    language: "python",
    title: "Type hints are not enforced at runtime",
    tag: "types",
    code: `def add(a: int, b: int) -> int:
    return a + b

# Python does NOT check types at runtime.
print(add("hello", " world"))   # 'hello world' — no error!
print(add(1.5, 2.5))            # 4.0 — no error

# Annotations are stored in __annotations__ but not evaluated.
print(add.__annotations__)
# {'a': <class 'int'>, 'b': <class 'int'>, 'return': <class 'int'>}

# Static type checking: mypy / pyright catch these at lint time.
# Runtime enforcement: beartype or pydantic validators.`,
    explanation: "Type hints are metadata for static analysis tools — Python itself ignores them at runtime. Use mypy/pyright in CI for static checking.",
  },
  // --- families ---
  {
    id: "py-list-tuple-array-cmp",
    language: "python",
    title: "list vs tuple vs array.array — choosing the right sequence",
    tag: "families",
    code: `import array, sys

data = [1, 2, 3, 4, 5]
lst  = list(data)
tup  = tuple(data)
arr  = array.array("i", data)

# Memory (per-object overhead dominates for small collections).
print(sys.getsizeof(lst))  # ~120 bytes
print(sys.getsizeof(tup))  # ~80  bytes
print(sys.getsizeof(arr))  # ~74  bytes

# list:         mutable, heterogeneous, O(1) append
# tuple:        immutable, hashable if all elements hashable
# array.array:  homogeneous C-type storage, fast binary I/O`,
    explanation: "Use list by default, tuple for immutable records/dict keys, and array.array when you need compact storage for homogeneous numeric data without numpy.",
  },
  {
    id: "py-stringio-bytesio-cmp",
    language: "python",
    title: "io.StringIO vs io.BytesIO — in-memory file objects",
    tag: "families",
    code: `import io

# StringIO: in-memory text file.
sio = io.StringIO()
sio.write("hello ")
sio.write("world")
print(sio.getvalue())   # 'hello world'

sio.seek(0)
print(sio.read())       # 'hello world'

# BytesIO: in-memory binary file.
bio = io.BytesIO()
bio.write(b"\\x01\\x02\\x03")
bio.seek(0)
print(bio.read())       # b'\\x01\\x02\\x03'`,
    explanation: "StringIO and BytesIO implement the full file API in memory — pass them wherever a file handle is expected to unit-test I/O code without touching the filesystem.",
  },
  {
    id: "py-map-filter-comp-cmp",
    language: "python",
    title: "map/filter vs list comprehension — when to use which",
    tag: "families",
    code: `nums = range(10)

# Both produce equivalent results.
evens_c = [n for n in nums if n % 2 == 0]
evens_m = list(filter(lambda n: n % 2 == 0, nums))
print(evens_c == evens_m)  # True

# map() shines when applying an existing named function.
words   = ["  alice  ", " bob "]
cleaned = list(map(str.strip, words))   # no lambda needed
print(cleaned)   # ['alice', 'bob']

# Comprehension wins for readability in most other cases.
cubed = [n**3 for n in range(5)]`,
    explanation: "List comprehensions are usually more Pythonic. Prefer map when you have a named function ready (no lambda needed); prefer comprehensions when transformation is complex.",
  },
  {
    id: "py-zip-variants-cmp",
    language: "python",
    title: "zip vs zip_longest vs dict(zip())",
    tag: "families",
    code: `from itertools import zip_longest

a = [1, 2, 3]
b = ["x", "y"]

# zip stops at shortest.
print(list(zip(a, b)))                           # [(1,'x'),(2,'y')]

# zip_longest fills shorter with fillvalue.
print(list(zip_longest(a, b, fillvalue=None)))   # [(1,'x'),(2,'y'),(3,None)]

# dict(zip) — canonical key-value pairing.
keys = ["a", "b", "c"]
vals = [1, 2, 3]
print(dict(zip(keys, vals)))   # {'a':1,'b':2,'c':3}

# strict=True raises on length mismatch (3.10+).`,
    explanation: "zip drops silently; zip_longest pads; dict(zip()) transposes parallel lists to a mapping. Use strict=True when equal lengths are a contract.",
  },
  {
    id: "py-json-pickle-cmp",
    language: "python",
    title: "json vs pickle — serialisation trade-offs",
    tag: "families",
    code: `import json, pickle

data = {"name": "alice", "scores": [90, 85, 78]}

# json: human-readable, language-neutral, limited to basic types.
j = json.dumps(data, indent=2)
print(j)
obj = json.loads(j)   # back to dict

# pickle: Python-only, handles almost any Python object.
p = pickle.dumps(data)
obj2 = pickle.loads(p)   # back to dict

# pickle can serialise class instances, lambdas, generators...
# WARNING: NEVER unpickle data from untrusted sources — arbitrary code exec.`,
    explanation: "Use json for interoperability and human-readable configs; use pickle for Python-to-Python caching of complex objects. Never deserialise untrusted pickle data.",
  },
  {
    id: "py-pathlib-ospath-cmp",
    language: "python",
    title: "pathlib vs os.path — modern vs classic",
    tag: "families",
    code: `from pathlib import Path
import os

# os.path: functional, string-based.
p_str = os.path.join("data", "report.csv")
base, ext = os.path.splitext(p_str)   # ('data/report', '.csv')

# pathlib: OO, overloads / for joining.
p = Path("data") / "report.csv"
print(p.suffix)    # '.csv'
print(p.stem)      # 'report'
print(p.parent)    # data
print(p.name)      # report.csv

# Built-in read/write.
# p.write_text("hello")
# p.read_text()`,
    explanation: "Prefer pathlib for new code — / composition, .stem/.suffix, and .glob() are more readable than os.path strings. os.path is still fine for one-liners.",
  },
  {
    id: "py-logging-print-cmp",
    language: "python",
    title: "logging vs print — production vs development",
    tag: "families",
    code: `import logging

# Configure once at program entry.
logging.basicConfig(level=logging.DEBUG,
                    format="%(asctime)s %(levelname)s %(name)s: %(message)s")
log = logging.getLogger(__name__)

log.debug("x=%d", 42)        # DEBUG: x=42
log.info("processing done")  # INFO:  processing done
log.warning("retry #%d", 3)  # WARNING: retry #3
log.error("failed: %s", "timeout")

# print: quick debugging or intentional console output.
# logging: structured, filterable, redirectable — the production choice.`,
    explanation: "print is fine for scripts; logging adds levels, timestamps, caller info, and routing to files/syslog without touching call sites.",
  },
  {
    id: "py-abc-protocol-cmp",
    language: "python",
    title: "ABC (nominal) vs Protocol (structural) subtyping",
    tag: "families",
    code: `from abc import ABC, abstractmethod
from typing import Protocol, runtime_checkable

# ABC: nominal — must explicitly inherit.
class Drawable(ABC):
    @abstractmethod
    def draw(self) -> None: ...

class Circle(Drawable):
    def draw(self) -> None: print("O")

# Protocol: structural — no inheritance needed (duck typing).
@runtime_checkable
class Renderable(Protocol):
    def draw(self) -> None: ...

class Square:   # no inheritance
    def draw(self) -> None: print("[]")

print(isinstance(Square(), Renderable))  # True — has 'draw'`,
    explanation: "ABCs enforce an explicit inheritance relationship; Protocols accept any object with matching methods. Use Protocol when you don't control the implementations.",
  },
  {
    id: "py-dict-family-cmp",
    language: "python",
    title: "dict, defaultdict, Counter, OrderedDict — when to use each",
    tag: "families",
    code: `from collections import defaultdict, Counter, OrderedDict

# dict: general purpose.
d = {"a": 1}

# defaultdict: auto-creates a default on missing key.
dd = defaultdict(list)
dd["x"].append(1)       # no KeyError

# Counter: multiset with frequency arithmetic.
c = Counter("mississippi")
print(c.most_common(2))  # [('s', 4), ('i', 4)]
print(c["s"] + c["i"])   # 8

# OrderedDict: adds move_to_end / ordered popitem.
od = OrderedDict([("a", 1), ("b", 2)])
od.move_to_end("a")
print(list(od))  # ['b', 'a']`,
    explanation: "All four are dict subclasses. defaultdict prevents KeyError; Counter adds arithmetic; OrderedDict adds ordering operations. Regular dict suffices for most cases.",
  },
  {
    id: "py-exception-family-cmp",
    language: "python",
    title: "BaseException vs Exception hierarchy",
    tag: "families",
    code: `# BaseException
#   ├── SystemExit          (sys.exit())
#   ├── KeyboardInterrupt   (Ctrl+C)
#   ├── GeneratorExit
#   └── Exception           ← almost everything you'd handle
#         ├── ValueError, TypeError, OSError ...
#         └── RuntimeError, AttributeError ...

# Catching Exception leaves Ctrl+C unhandled — correct.
try:
    raise ValueError("bad input")
except Exception as e:
    print(f"handled: {e}")   # handled: bad input

# Catching BaseException swallows sys.exit() and Ctrl+C.
# Only use it for top-level cleanup handlers that must always run.`,
    explanation: "The distinction keeps Ctrl+C and sys.exit() working normally. Only use BaseException for teardown code that absolutely must run on every possible exit path.",
  },
  {
    id: "py-optional-union-cmp",
    language: "python",
    title: "Optional[T] is just T | None",
    tag: "families",
    code: `from typing import Optional

# These two signatures are exactly equivalent.
def f1(x: Optional[int]) -> Optional[str]: ...
def f2(x: int | None)   -> str | None:     ...

# PEP 604 (Python 3.10+): prefer the | syntax.
def find(items: list[str], target: str) -> int | None:
    try:
        return items.index(target)
    except ValueError:
        return None

print(find(["a", "b", "c"], "b"))   # 1
print(find(["a", "b", "c"], "z"))   # None`,
    explanation: "Optional[T] (from the typing module) is exactly T | None. The new union syntax (PEP 604, 3.10+) is cleaner and preferred in modern Python code.",
  },
  {
    id: "py-thread-async-cmp",
    language: "python",
    title: "threading vs multiprocessing vs asyncio",
    tag: "families",
    code: `# threading:       I/O-bound; GIL prevents parallel CPU use.
# multiprocessing: CPU-bound; separate processes bypass the GIL.
# asyncio:         I/O-bound; cooperative, single-threaded — scales to 1000s.

import threading, time

results = []

def fetch(n):
    time.sleep(0.05)   # simulate I/O wait
    results.append(n)

threads = [threading.Thread(target=fetch, args=(i,)) for i in range(5)]
for t in threads: t.start()
for t in threads: t.join()
print(sorted(results))  # [0, 1, 2, 3, 4]`,
    explanation: "threading works well for I/O-bound tasks; multiprocessing bypasses the GIL for CPU-heavy work; asyncio handles massive I/O concurrency at the lowest overhead.",
  },
  {
    id: "py-cm-variants-cmp",
    language: "python",
    title: "Class-based CM vs @contextmanager decorator",
    tag: "families",
    code: `from contextlib import contextmanager

# Generator-based: concise for simple setup/teardown.
@contextmanager
def temp_dir(path):
    import os, shutil
    os.makedirs(path, exist_ok=True)
    try:
        yield path
    finally:
        shutil.rmtree(path)

# Class-based: needed for stateful or reusable managers.
class ManagedDB:
    def __enter__(self):
        print("connect"); return self
    def __exit__(self, exc_type, *_):
        print("disconnect"); return False   # don't suppress

with ManagedDB() as db:
    print("using db")  # connect / using db / disconnect`,
    explanation: "Use @contextmanager for throwaway or simple cases; the class form is better when you need state, want the CM to be reusable, or need non-trivial __exit__ logic.",
  },
  {
    id: "py-io-hierarchy-cmp",
    language: "python",
    title: "io module type hierarchy",
    tag: "families",
    code: `import io

# IOBase
#   RawIOBase     — unbuffered bytes  (FileIO)
#   BufferedIOBase — buffered bytes  (BufferedReader, BytesIO)
#   TextIOBase    — text with codec  (TextIOWrapper, StringIO)

# open() returns different types based on mode.
f_text   = open("/dev/null")         # TextIOWrapper
f_binary = open("/dev/null", "rb")   # BufferedReader
f_raw    = open("/dev/null", "rb", buffering=0)  # FileIO

print(type(f_text))    # <class '_io.TextIOWrapper'>
print(type(f_binary))  # <class '_io.BufferedReader'>
f_text.close(); f_binary.close(); f_raw.close()`,
    explanation: "Understanding the io hierarchy lets you write functions that accept any file-like object by typing for io.IOBase or a subclass, and substitute StringIO/BytesIO in tests.",
  },
  {
    id: "py-builtin-itertools-cmp",
    language: "python",
    title: "Built-in tools vs itertools equivalents",
    tag: "families",
    code: `from itertools import accumulate, chain, starmap
import operator

nums = [1, 2, 3, 4]

# sum vs accumulate (running totals).
print(list(accumulate(nums)))              # [1, 3, 6, 10]
print(list(accumulate(nums, operator.mul))) # [1, 2, 6, 24]  (running product)

# sum([[a,b],[c,d]]) vs chain.from_iterable (flat merge, O(n)).
lists = [[1, 2], [3, 4], [5]]
print(list(chain.from_iterable(lists)))   # [1, 2, 3, 4, 5]

# map(f, a, b) vs starmap for pre-zipped pairs.
pairs = [(2, 3), (4, 5)]
print(list(starmap(operator.mul, pairs)))  # [6, 20]`,
    explanation: "itertools extends the built-in functional toolkit: accumulate for running reductions, chain.from_iterable for lazy flat-mapping, starmap for multi-argument maps — all lazy.",
  },
  // --- classes ---
  {
    id: "py-new-vs-init",
    language: "python",
    title: "__new__ controls instance creation, __init__ configures it",
    tag: "classes",
    code: `class Singleton:
    _instance = None

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance    # same object every time

    def __init__(self, value):
        self.value = value       # runs every call!

a = Singleton(1)
b = Singleton(2)
print(a is b)     # True
print(a.value)    # 2  (__init__ ran again on the same object)`,
    explanation: "__new__ creates the object; __init__ configures it. Override __new__ to control which instance is returned — singleton, flyweight, or caching patterns.",
  },
  {
    id: "py-descriptor-get-only",
    language: "python",
    title: "Read-only descriptor with __get__",
    tag: "classes",
    code: `import math

class DegreesDescriptor:
    def __get__(self, obj, objtype=None):
        if obj is None:
            return self          # accessed on the class itself
        return math.degrees(obj._radians)

class Angle:
    degrees = DegreesDescriptor()
    def __init__(self, radians):
        self._radians = radians

a = Angle(math.pi)
print(a.degrees)       # 180.0
print(Angle.degrees)   # <DegreesDescriptor object>

# No __set__ defined → instance __dict__ can shadow it.
a.degrees = 999    # creates instance attribute, descriptor bypassed
print(a.degrees)   # 999  (uses instance attr, not descriptor)`,
    explanation: "A descriptor with only __get__ is a non-data descriptor — instance attributes in __dict__ take priority. Add __set__ to make it a data descriptor that always wins.",
  },
  {
    id: "py-callable-class",
    language: "python",
    title: "__call__ makes instances behave like functions",
    tag: "classes",
    code: `class Threshold:
    def __init__(self, limit):
        self.limit = limit
        self.calls = 0

    def __call__(self, value):
        self.calls += 1
        return value >= self.limit

is_adult = Threshold(18)
print(is_adult(20))    # True
print(is_adult(15))    # False
print(is_adult.calls)  # 2   — state persisted across calls
print(callable(is_adult))  # True`,
    explanation: "__call__ turns any object into a callable. It's the foundation for parameterised decorators and stateful function-like objects that need configuration or accumulated state.",
  },
  {
    id: "py-init-subclass-registry",
    language: "python",
    title: "__init_subclass__ auto-registers subclasses",
    tag: "classes",
    code: `class Plugin:
    _registry: dict = {}

    def __init_subclass__(cls, name: str = "", **kwargs):
        super().__init_subclass__(**kwargs)
        if name:
            Plugin._registry[name] = cls

class JSONPlugin(Plugin, name="json"):
    def run(self): return "json output"

class CSVPlugin(Plugin, name="csv"):
    def run(self): return "csv output"

print(Plugin._registry)
# {'json': <class 'JSONPlugin'>, 'csv': <class 'CSVPlugin'>}
plugin = Plugin._registry["csv"]()
print(plugin.run())  # csv output`,
    explanation: "__init_subclass__ fires on the base class when each subclass is defined, enabling automatic registration without metaclasses or explicit register() calls.",
  },
  {
    id: "py-slots-inherit-chain",
    language: "python",
    title: "__slots__ in an inheritance chain",
    tag: "classes",
    code: `class Base:
    __slots__ = ("x",)
    def __init__(self): self.x = 1

class Child(Base):
    __slots__ = ("y",)   # adds y; x is inherited from Base
    def __init__(self):
        super().__init__()
        self.y = 2

class BadChild(Base):
    pass    # no __slots__ → gets __dict__ → memory benefit lost

c = Child()
print(c.x, c.y)   # 1 2
try:
    c.z = 3        # AttributeError — no __dict__
except AttributeError:
    print("no extra attributes")`,
    explanation: "Each class in a slots hierarchy declares only new slots; inherited ones still work. A subclass without __slots__ reintroduces __dict__ and undoes the memory savings.",
  },
  {
    id: "py-eq-hash-contract",
    language: "python",
    title: "Defining __eq__ implicitly sets __hash__ to None",
    tag: "classes",
    code: `class Point:
    def __init__(self, x, y):
        self.x, self.y = x, y

    def __eq__(self, other):
        return isinstance(other, Point) and (self.x, self.y) == (other.x, other.y)
    # __hash__ is now implicitly None — Point is not hashable!

p = Point(1, 2)
try:
    hash(p)
except TypeError as e:
    print(e)   # unhashable type: 'Point'

# Fix: explicitly define __hash__.
# def __hash__(self): return hash((self.x, self.y))`,
    explanation: "Python sets __hash__ = None when you define __eq__ because equal objects must hash the same — if you haven't defined __hash__, that contract can't be guaranteed. Define both together.",
  },
  {
    id: "py-repr-vs-str",
    language: "python",
    title: "__repr__ vs __str__ vs __format__",
    tag: "classes",
    code: `class Temp:
    def __init__(self, c): self.c = c

    def __repr__(self):   return f"Temp({self.c!r})"   # unambiguous
    def __str__(self):    return f"{self.c}°C"           # human
    def __format__(self, spec):
        if spec == "f":
            return f"{self.c * 9/5 + 32:.1f}°F"
        return str(self)

t = Temp(100)
print(repr(t))    # Temp(100)    — for debugging/logging
print(str(t))     # 100°C        — for display
print(f"{t}")     # 100°C        — __str__ via f-string
print(f"{t:f}")   # 212.0°F      — __format__ with spec`,
    explanation: "__repr__ should produce an unambiguous string (ideally valid constructor call). __str__ is for end-users. __format__ powers the format-spec mini-language in f-strings.",
  },
  {
    id: "py-dataclass-validator",
    language: "python",
    title: "dataclass __post_init__ for cross-field validation",
    tag: "classes",
    code: `from dataclasses import dataclass

@dataclass
class DateRange:
    start: int   # year
    end: int

    def __post_init__(self):
        # Runs after the generated __init__ populates fields.
        if self.start > self.end:
            raise ValueError(f"start ({self.start}) must be <= end ({self.end})")

DateRange(2020, 2025)   # OK
try:
    DateRange(2025, 2020)
except ValueError as e:
    print(e)   # start (2025) must be <= end (2020)`,
    explanation: "__post_init__ runs after the generated __init__ — the right place for cross-field validation, derived-field computation, or type coercion.",
  },
  {
    id: "py-abc-no-instance",
    language: "python",
    title: "Abstract classes cannot be instantiated",
    tag: "classes",
    code: `from abc import ABC, abstractmethod

class Shape(ABC):
    @abstractmethod
    def area(self) -> float: ...

    @abstractmethod
    def perimeter(self) -> float: ...

class Circle(Shape):
    def __init__(self, r): self.r = r
    def area(self):       return 3.14159 * self.r ** 2
    def perimeter(self):  return 2 * 3.14159 * self.r

# Shape can't be instantiated because it has abstract methods.
try:
    Shape()
except TypeError as e:
    print(e)   # Can't instantiate abstract class Shape ...

print(Circle(5).area())   # 78.53975`,
    explanation: "ABC raises TypeError on instantiation if any @abstractmethod remains unimplemented — a runtime check that forces all concrete subclasses to provide the full interface.",
  },
  {
    id: "py-super-mro-diamond",
    language: "python",
    title: "super() follows MRO in diamond inheritance",
    tag: "classes",
    code: `class A:
    def greet(self): print("A"); super().greet() if hasattr(super(), "greet") else None

class B(A):
    def greet(self): print("B"); super().greet()

class C(A):
    def greet(self): print("C"); super().greet()

class D(B, C):
    def greet(self): print("D"); super().greet()

# MRO for D: D → B → C → A → object
print([c.__name__ for c in D.__mro__])  # ['D', 'B', 'C', 'A', 'object']
D().greet()  # D B C A`,
    explanation: "super() delegates to the NEXT class in the MRO, not the direct parent. Each class must call super() for cooperative multiple inheritance to chain correctly.",
  },
  {
    id: "py-class-as-decorator",
    language: "python",
    title: "Class used as a decorator",
    tag: "classes",
    code: `import functools

class retry:
    def __init__(self, times=3):
        self.times = times

    def __call__(self, func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            for attempt in range(self.times):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    if attempt == self.times - 1:
                        raise
        return wrapper

@retry(times=2)
def flaky():
    raise ValueError("oops")

try:
    flaky()
except ValueError:
    print("gave up after 2 attempts")`,
    explanation: "A class decorator creates a callable class that __call__ returns the wrapped function. Unlike a closure, it can hold configuration as instance attributes and supports parameters naturally.",
  },
  {
    id: "py-mixin-mro-order",
    language: "python",
    title: "Mixin ordering determines method resolution",
    tag: "classes",
    code: `class LogMixin:
    def save(self):
        print(f"[log] saving")
        super().save()

class TimestampMixin:
    def save(self):
        print("[ts] adding timestamp")
        super().save()

class Model:
    def save(self): print("[db] persisting")

# MRO: User → LogMixin → TimestampMixin → Model → object
class User(LogMixin, TimestampMixin, Model):
    pass

User().save()
# [log] saving
# [ts] adding timestamp
# [db] persisting`,
    explanation: "Mixin order in the class definition sets the MRO left-to-right; place mixins before the concrete base class, ordered from outermost to innermost concern.",
  },
  {
    id: "py-property-getter-only",
    language: "python",
    title: "Property with only a getter is read-only",
    tag: "classes",
    code: `import math

class Circle:
    def __init__(self, radius):
        self._radius = radius

    @property
    def radius(self):
        return self._radius

    @property
    def area(self):
        return math.pi * self._radius ** 2

c = Circle(5)
print(c.radius)    # 5
print(c.area)      # 78.539...

try:
    c.radius = 10  # AttributeError — no setter
except AttributeError as e:
    print(e)`,
    explanation: "A property with only a getter is effectively read-only. This is simpler than a full property+setter when the attribute should never be changed by callers.",
  },
  {
    id: "py-class-body-exec-2",
    language: "python",
    title: "Class body executes once as a function scope",
    tag: "classes",
    code: `class Demo:
    # Class body runs once at class creation time.
    items = [x * 2 for x in range(4)]   # comprehension own scope (Python 3)
    count = len(items)

    def show(self):
        # Inside methods, must use 'self.items' or 'Demo.items'.
        return self.items

d = Demo()
print(d.items)   # [0, 2, 4, 6]
print(d.count)   # 4

# Class body variables become class attributes, not globals.
# They are NOT visible inside methods without 'self.' or 'Demo.'.`,
    explanation: "The class body is executed as a special function once at class definition time; names defined there become class attributes, not module globals, and aren't directly visible in instance methods.",
  },
// === PYTHON BATCH 2 ===
  {
    id: "py-walrus-while-loop",
    language: "python",
    title: "Walrus operator in while loop",
    tag: "snippet",
    code: `import re

text = "price: 42 quantity: 7"

# Without walrus: two expressions for same match.
# m = re.search(r'\d+', text)
# while m:
#     process(m); m = re.search(...)

# With walrus: assign and test in one expression.
pos = 0
while m := re.search(r'\d+', text[pos:]):
    print(m.group())  # 42, then 7
    pos += m.end()`,
    explanation: "The walrus operator := assigns and evaluates in the same expression — perfect for while-loop patterns where you check a result of a function call and use it in the loop body.",
  },
  {
    id: "py-functools-lru-method",
    language: "python",
    title: "functools.cached_property vs lru_cache on methods",
    tag: "snippet",
    code: `from functools import cached_property, lru_cache

class Circle:
    def __init__(self, radius):
        self.radius = radius

    @cached_property
    def area(self):
        import math
        print("computing area")
        return math.pi * self.radius ** 2

c = Circle(5)
print(c.area)   # computing area  → 78.539...
print(c.area)   # (no print)      → cached value
print(c.area)   # (no print)

# cached_property stores result in instance __dict__.
# Works per instance; lru_cache works per argument set.`,
    explanation: "cached_property computes a value once per instance and caches it in the instance dict. Unlike lru_cache, it's cache per instance, not per argument value.",
  },
  {
    id: "py-enumerate-unpack",
    language: "python",
    title: "Nested unpacking in for loops",
    tag: "snippet",
    code: `pairs = [("alice", 90), ("bob", 85), ("carol", 78)]

# Simple enumerate — i is the index, (name, score) is the tuple.
for i, (name, score) in enumerate(pairs, start=1):
    print(f"{i}. {name}: {score}")
# 1. alice: 90
# 2. bob: 85
# 3. carol: 78

# Deep unpacking with zip.
keys   = ["a", "b"]
values = [1, 2]
for k, v in zip(keys, values):
    print(k, "->", v)`,
    explanation: "Python for-loop target can be a tuple pattern — nested unpacking happens at the bytecode level, no intermediate variable needed.",
  },
  {
    id: "py-str-removeprefix-suffix",
    language: "python",
    title: "str.removeprefix / removesuffix (Python 3.9+)",
    tag: "snippet",
    code: `# removeprefix removes the prefix only if present; returns str unchanged otherwise.
path = "file://example.com/path"
print(path.removeprefix("file://"))   # example.com/path
print(path.removeprefix("ftp://"))    # file://example.com/path  unchanged

# removesuffix removes the suffix only if present.
name = "report.csv"
print(name.removesuffix(".csv"))   # report
print(name.removesuffix(".txt"))   # report.csv  unchanged

# Before 3.9: manual check with startswith/endswith.
# s[len(prefix):] if s.startswith(prefix) else s`,
    explanation: "removeprefix/removesuffix replace the error-prone s.lstrip(prefix) pattern (which strips individual characters, not a substring) and the clumsy s[len(p):] if s.startswith(p) else s idiom.",
  },
  {
    id: "py-itertools-pairwise",
    language: "python",
    title: "itertools.pairwise — consecutive pairs",
    tag: "snippet",
    code: `from itertools import pairwise  # Python 3.10+

nums = [1, 4, 9, 16, 25]

# pairwise yields overlapping pairs of consecutive elements.
for a, b in pairwise(nums):
    print(b - a, end=" ")
# 3 5 7 9  (differences between consecutive squares)

# Manual equivalent: zip(seq, seq[1:])
diffs = [b - a for a, b in zip(nums, nums[1:])]
print(diffs)  # [3, 5, 7, 9]

words = ["start", "stop", "reverse"]
print(list(pairwise(words)))
# [('start','stop'), ('stop','reverse')]`,
    explanation: "pairwise(iterable) is cleaner than zip(s, s[1:]) — it works on any iterable (not just sliceable sequences) and avoids creating a copy.",
  },
  {
    id: "py-textwrap-dedent",
    language: "python",
    title: "textwrap.dedent removes common leading whitespace",
    tag: "snippet",
    code: `import textwrap

def make_code():
    code = """
        def hello():
            print("world")
    """
    return textwrap.dedent(code).strip()

print(make_code())
# def hello():
#     print("world")

# Without dedent, the indentation from the source file leaks in.
# Useful for multi-line strings inside indented functions.
msg = textwrap.fill("This is a long sentence that needs wrapping.", width=20)
print(msg)`,
    explanation: "textwrap.dedent strips the common leading whitespace from all lines — useful when multi-line string literals need to be indented to match surrounding code but stored without that indent.",
  },
  {
    id: "py-collections-abc-check",
    language: "python",
    title: "collections.abc for protocol-style isinstance checks",
    tag: "snippet",
    code: `from collections.abc import Sequence, Mapping, Iterable, Callable

# Test duck-type capability without exact type checks.
print(isinstance([], Sequence))       # True
print(isinstance("hi", Sequence))     # True
print(isinstance(range(5), Sequence)) # True
print(isinstance({}, Mapping))        # True
print(isinstance(x for x in []), Iterable))  # True
print(isinstance(len, Callable))      # True

# Better than type(x) == list for APIs that accept any sequence.
def first(seq):
    if not isinstance(seq, Sequence):
        raise TypeError("expected a sequence")
    return seq[0]`,
    explanation: "collections.abc provides ABC mixin types for checking 'is this object sequence-like?' without requiring an exact type — makes APIs that accept lists, tuples, and strings interchangeably.",
  },
  {
    id: "py-pathlib-glob-rglob",
    language: "python",
    title: "pathlib.glob and rglob for file discovery",
    tag: "snippet",
    code: `from pathlib import Path

base = Path("/tmp")

# glob: search one level (** matches any number of dirs).
for p in base.glob("*.py"):
    print(p)   # /tmp/test.py, etc.

# rglob: recursive glob — equivalent to glob("**/*.py").
for p in base.rglob("*.py"):
    print(p)   # all .py files under /tmp

# Check existence and type.
p = Path("/tmp/example.txt")
print(p.exists())      # True/False
print(p.is_file())     # True if a file
print(p.is_dir())      # True if a directory`,
    explanation: "pathlib.rglob('*.py') is equivalent to glob.glob('**/*.py', recursive=True) but object-oriented and returns Path objects instead of strings.",
  },
  {
    id: "py-dataclass-field-default-factory",
    language: "python",
    title: "dataclass field with default_factory",
    tag: "snippet",
    code: `from dataclasses import dataclass, field

@dataclass
class Config:
    name: str = "default"
    tags: list[str] = field(default_factory=list)   # NOT tags: list = []
    meta: dict = field(default_factory=dict)

c1 = Config()
c2 = Config()
c1.tags.append("prod")

print(c1.tags)  # ['prod']
print(c2.tags)  # []  — each instance gets its own list`,
    explanation: "Use field(default_factory=list) instead of a direct mutable default — without it, all instances would share the same list object (the mutable default arg bug in dataclass form).",
  },
  {
    id: "py-functools-singledispatch",
    language: "python",
    title: "functools.singledispatch for type-based dispatch",
    tag: "snippet",
    code: `from functools import singledispatch

@singledispatch
def process(value):
    raise TypeError(f"Cannot process {type(value).__name__}")

@process.register(int)
def _(value):
    return f"integer: {value * 2}"

@process.register(str)
def _(value):
    return f"string: {value.upper()}"

@process.register(list)
def _(value):
    return f"list of {len(value)}"

print(process(42))         # integer: 84
print(process("hello"))    # string: HELLO
print(process([1, 2, 3]))  # list of 3`,
    explanation: "singledispatch implements function overloading based on the first argument's type — a cleaner alternative to isinstance chains for open extensible dispatch.",
  },
  {
    id: "py-contextlib-nullcontext",
    language: "python",
    title: "contextlib.nullcontext — optional context manager",
    tag: "snippet",
    code: `from contextlib import nullcontext

def process(data, lock=None):
    # Use the lock if provided, otherwise use a no-op context.
    ctx = lock if lock is not None else nullcontext()
    with ctx:
        return [x * 2 for x in data]

# Without a lock.
result = process([1, 2, 3])
print(result)  # [2, 4, 6]

# With a threading lock.
import threading
lock = threading.Lock()
result = process([1, 2, 3], lock=lock)
print(result)  # [2, 4, 6]`,
    explanation: "nullcontext is a no-op context manager that makes optional locking/timing/logging uniform — avoids an if/else that would duplicate the with block.",
  },
  {
    id: "py-re-findall-finditer",
    language: "python",
    title: "re.findall vs re.finditer",
    tag: "snippet",
    code: `import re

text = "price: 42 qty: 7 discount: 15"

# findall: returns list of all matches (or groups).
numbers = re.findall(r'\d+', text)
print(numbers)   # ['42', '7', '15']

# finditer: returns iterator of match objects (more info, lazy).
for m in re.finditer(r'\d+', text):
    print(f"{m.group()} at pos {m.start()}")
# 42 at pos 7
# 7 at pos 14
# 15 at pos 26

# With groups: findall returns tuples.
pairs = re.findall(r'(\w+): (\d+)', text)
print(pairs)   # [('price', '42'), ('qty', '7'), ('discount', '15')]`,
    explanation: "findall returns a flat list of strings (or tuples for groups); finditer returns match objects lazily — use finditer when you need position, span, or named groups.",
  },
  {
    id: "py-operator-itemgetter",
    language: "python",
    title: "operator.itemgetter and attrgetter for fast key access",
    tag: "snippet",
    code: `from operator import itemgetter, attrgetter

records = [
    {"name": "alice", "score": 90},
    {"name": "bob",   "score": 85},
    {"name": "carol", "score": 92},
]

# Sort by 'score' key using itemgetter instead of lambda.
sorted_records = sorted(records, key=itemgetter("score"), reverse=True)
print([r["name"] for r in sorted_records])   # ['carol', 'alice', 'bob']

# Multi-key sort.
from dataclasses import dataclass
@dataclass
class Student:
    name: str; grade: int
students = [Student("bob", 90), Student("alice", 90), Student("carol", 85)]
students.sort(key=attrgetter("grade", "name"))
print([(s.name, s.grade) for s in students])`,
    explanation: "itemgetter and attrgetter are faster than lambda key functions because they're implemented in C — prefer them for performance-sensitive sorting on large collections.",
  },
  {
    id: "py-enum-member-methods",
    language: "python",
    title: "Enum members can have methods",
    tag: "snippet",
    code: `from enum import Enum

class Direction(Enum):
    NORTH = (0, 1)
    SOUTH = (0, -1)
    EAST  = (1, 0)
    WEST  = (-1, 0)

    def opposite(self):
        x, y = self.value
        return Direction((-x, -y))

    def move(self, position: tuple) -> tuple:
        dx, dy = self.value
        px, py = position
        return (px + dx, py + dy)

print(Direction.NORTH.opposite())         # Direction.SOUTH
print(Direction.EAST.move((3, 4)))        # (4, 4)`,
    explanation: "Enum values can be tuples or any immutable value, and members can have methods — making them small domain objects rather than simple constants.",
  },
  // --- understanding ---
  {
    id: "py-closure-cell",
    language: "python",
    title: "Closure cells — how Python stores enclosing variables",
    tag: "understanding",
    code: `def make_adder(n):
    def adder(x):
        return x + n      # 'n' is a free variable — stored in a cell
    return adder

add5 = make_adder(5)
add10 = make_adder(10)

print(add5(3))    # 8
print(add10(3))   # 13

# Inspect the closure cell.
print(add5.__closure__)             # (<cell at 0x...>,)
print(add5.__closure__[0].cell_contents)  # 5  — the captured value
print(add5.__code__.co_freevars)    # ('n',)`,
    explanation: "Python wraps each captured variable in a 'cell' object shared between the enclosing function and the closure. Inspecting __closure__ lets you see captured values for debugging.",
  },
  {
    id: "py-global-local-rule",
    language: "python",
    title: "Assignment makes a name local — the UnboundLocalError",
    tag: "understanding",
    code: `x = 10

def broken():
    print(x)   # UnboundLocalError — x is treated as local because of the
    x = 20     # assignment below makes x local throughout the function!

try:
    broken()
except UnboundLocalError as e:
    print(e)   # local variable 'x' referenced before assignment

def fixed():
    global x
    print(x)   # 10
    x = 20

fixed()
print(x)   # 20`,
    explanation: "Python's scoping rule is: if a name is assigned anywhere in a function, it's local for the entire function (even lines before the assignment). Use 'global' or 'nonlocal' to opt out.",
  },
  {
    id: "py-class-method-resolution",
    language: "python",
    title: "Method resolution order (MRO) rules",
    tag: "understanding",
    code: `class A: pass
class B(A): pass
class C(A): pass
class D(B, C): pass

# Python's C3 linearisation algorithm.
print(D.__mro__)
# (<class 'D'>, <class 'B'>, <class 'C'>, <class 'A'>, <class 'object'>)

# D → B → C → A guarantees:
# 1. Child always before parents.
# 2. Left parent before right parent.
# 3. No class appears before all its subclasses.

# Impossible MRO raises TypeError.
try:
    class Bad(A, B): pass   # B is subclass of A; A can't come first
except TypeError as e:
    print(e)`,
    explanation: "Python's MRO uses C3 linearisation to ensure predictable lookup order. If you write a class hierarchy where no consistent order exists, Python raises TypeError at class definition time.",
  },
  {
    id: "py-generator-pipeline",
    language: "python",
    title: "Generator pipeline — lazy data processing",
    tag: "understanding",
    code: `def read_lines(filename):
    """Yields lines one at a time — doesn't load the whole file."""
    with open(filename) as f:
        yield from f

def filter_comments(lines):
    for line in lines:
        if not line.startswith('#'):
            yield line

def parse_ints(lines):
    for line in lines:
        try: yield int(line.strip())
        except ValueError: pass

# Compose the pipeline — nothing runs until we iterate.
import io
data = io.StringIO("# header\n1\n2\n# comment\n3\n")
result = list(parse_ints(filter_comments(read_lines(data))))
print(result)  # [1, 2, 3]`,
    explanation: "Generator pipelines process data one element at a time through a chain of lazy generators — constant memory regardless of input size, because nothing materialises until consumed.",
  },
  {
    id: "py-scope-comprehension",
    language: "python",
    title: "Comprehension scope in Python 3",
    tag: "understanding",
    code: `x = "outer"

# In Python 3, comprehensions have their own scope.
result = [x for x in range(3)]
print(x)   # 'outer'  — 'x' not leaked (unlike Python 2)

# Walrus operator DOES leak to the enclosing scope.
filtered = [y := item for item in [1, 2, 3] if item > 1]
print(y)   # 3  — y is in enclosing scope!

# Generator expression scope: same rule, own scope.
g = (x for x in range(3))
next(g)
print(x)   # 'outer'  — generator's 'x' doesn't leak`,
    explanation: "Python 3 comprehensions create their own scope so the loop variable doesn't pollute the enclosing namespace — unlike Python 2. The walrus operator is the one exception.",
  },
  {
    id: "py-attribute-lookup",
    language: "python",
    title: "Attribute lookup order: instance → class → base classes",
    tag: "understanding",
    code: `class Animal:
    sound = "..."    # class attribute

class Dog(Animal):
    sound = "woof"   # overrides parent

d = Dog()
print(d.sound)       # 'woof'    — found on Dog class

d.sound = "arf"      # creates instance attribute
print(d.sound)       # 'arf'     — instance attribute shadows class attribute
del d.sound
print(d.sound)       # 'woof'    — back to class attribute

print(Dog.__dict__)  # {'sound': 'woof', ...}
print(d.__dict__)    # {}  — instance dict is empty again`,
    explanation: "Python resolves attributes by looking first in the instance's __dict__, then the class, then base classes. Instance attributes shadow class attributes of the same name.",
  },
  {
    id: "py-try-except-else-finally",
    language: "python",
    title: "try/except/else/finally — all four clauses",
    tag: "understanding",
    code: `def divide(a, b):
    try:
        result = a / b
    except ZeroDivisionError:
        print("caught: division by zero")
        return None
    else:
        # Runs ONLY if no exception was raised in try.
        print(f"no exception, result = {result}")
        return result
    finally:
        # Runs ALWAYS — with or without exception.
        print("finally block executed")

print(divide(10, 2))
# no exception, result = 5.0
# finally block executed
# 5.0

divide(10, 0)
# caught: division by zero
# finally block executed`,
    explanation: "The else clause runs only when try completes without raising — not the same as putting code at the end of try. finally always runs even if return is called.",
  },
  {
    id: "py-bool-type",
    language: "python",
    title: "bool is a subclass of int",
    tag: "understanding",
    code: `print(isinstance(True, int))    # True!
print(isinstance(False, int))   # True!
print(type(True))               # <class 'bool'>

# True == 1, False == 0 arithmetically.
print(True + True)    # 2
print(True * 5)       # 5
print(False + 1)      # 1

# sum(bool_list) counts Trues.
flags = [True, False, True, True, False]
print(sum(flags))     # 3  (counts True values)

# Useful: count matching elements.
nums = [1, 2, 3, 4, 5]
print(sum(n > 3 for n in nums))  # 2`,
    explanation: "bool is a subclass of int where True == 1 and False == 0. This makes sum(condition for item in iterable) a concise count of matching items.",
  },
  {
    id: "py-import-as",
    language: "python",
    title: "import aliasing and star imports",
    tag: "understanding",
    code: `# 'import ... as' creates a local alias.
import numpy as np    # conventional alias
# np.array(...)

import os.path as osp
print(osp.join("a", "b"))   # a/b

# 'from ... import *' brings in everything in __all__ (or all public names).
# from math import *   # imports sin, cos, pi, etc.
# Generally discouraged: pollutes namespace, hard to track origin.

# Relative imports.
# from . import sibling_module     # same package
# from .. import parent_module     # parent package`,
    explanation: "import aliases reduce typing for frequently used modules. Star imports are discouraged because they make it hard to trace where a name comes from and can silently shadow other names.",
  },
  {
    id: "py-exception-chaining",
    language: "python",
    title: "Exception chaining with raise from",
    tag: "understanding",
    code: `def load_config(path):
    try:
        with open(path) as f:
            return int(f.read())
    except FileNotFoundError as e:
        raise RuntimeError(f"Config {path!r} not found") from e

try:
    load_config("/no/such/file")
except RuntimeError as e:
    print(e)
    print(f"Caused by: {e.__cause__}")

# 'raise X from None' suppresses the implicit chaining context.
def lookup(d, key):
    try:
        return d[key]
    except KeyError:
        raise ValueError(f"Key {key!r} not found") from None`,
    explanation: "'raise X from Y' sets X.__cause__ = Y, preserving the original traceback. 'from None' explicitly suppresses chaining when the original exception is an implementation detail.",
  },
  {
    id: "py-star-unpack-call",
    language: "python",
    title: "* and ** unpacking in function calls",
    tag: "understanding",
    code: `def greet(name, greeting="Hello", times=1):
    for _ in range(times):
        print(f"{greeting}, {name}!")

args   = ["alice"]
kwargs = {"greeting": "Hi", "times": 2}

# * unpacks a list as positional args.
greet(*args)                    # Hello, alice!

# ** unpacks a dict as keyword args.
greet("bob", **kwargs)          # Hi, bob!  (twice)

# Both together.
greet(*args, **kwargs)          # Hi, alice!  (twice)

# Merge dicts (Python 3.5+).
d1, d2 = {"a": 1}, {"b": 2}
print({**d1, **d2})   # {'a': 1, 'b': 2}`,
    explanation: "* and ** in call sites unpack sequences/dicts into positional/keyword arguments respectively. In function signatures they do the reverse — collect extra arguments.",
  },
  {
    id: "py-string-format-mini",
    language: "python",
    title: "Format specification mini-language",
    tag: "understanding",
    code: `# Format spec: [[fill]align][sign][#][0][width][grouping][.precision][type]
pi = 3.14159265

print(f"{pi:.2f}")        # 3.14    — fixed point, 2 decimals
print(f"{pi:10.3f}")      # '     3.142' — width 10, right-align
print(f"{pi:<10.3f}")     # '3.142     ' — left-align
print(f"{pi:^10.3f}")     # '  3.142   ' — center
print(f"{1234567:,}")     # 1,234,567   — thousands separator
print(f"{255:#010x}")     # 0x000000ff  — hex with prefix, zero-padded
print(f"{0.875:.1%}")     # 87.5%       — percentage`,
    explanation: "The format mini-language is shared by f-strings, str.format(), and format() built-in. Learning the spec once lets you format any value exactly as needed.",
  },
  {
    id: "py-dict-view-live",
    language: "python",
    title: "Dict views are live — they reflect mutations",
    tag: "understanding",
    code: `d = {"a": 1, "b": 2}

keys   = d.keys()
values = d.values()
items  = d.items()

print(list(keys))   # ['a', 'b']

# Mutate the dict.
d["c"] = 3
del d["a"]

# Views immediately reflect the change.
print(list(keys))    # ['b', 'c']
print(list(values))  # [2, 3]
print(list(items))   # [('b', 2), ('c', 3)]`,
    explanation: "dict.keys(), .values(), and .items() return live view objects, not snapshots. Modifying the dict after calling these methods is immediately reflected in the views.",
  },
  {
    id: "py-None-falsy",
    language: "python",
    title: "Falsy values in Python — not just False",
    tag: "understanding",
    code: `# All of these are falsy (evaluate to False in boolean context):
falsy = [None, False, 0, 0.0, 0j, "", b"", [], (), {}, set(), range(0)]

for v in falsy:
    if not v:
        pass   # all enter here

# Common gotcha: 0 is falsy, but it's a valid value!
count = 0
if count:           # WRONG if 0 is meaningful
    print("has items")

if count is not None:   # RIGHT — checks for 'not set' explicitly
    print("count is set to:", count)`,
    explanation: "Python's falsy values include None, 0, empty collections, and empty strings. This is convenient but can hide bugs when 0 or empty-string are valid domain values.",
  },
  // --- structures ---
  {
    id: "py-heapq-custom",
    language: "python",
    title: "heapq with custom priority via tuples",
    tag: "structures",
    code: `import heapq

# heapq is a min-heap — push (priority, item) tuples.
tasks = []
heapq.heappush(tasks, (3, "low priority task"))
heapq.heappush(tasks, (1, "urgent task"))
heapq.heappush(tasks, (2, "normal task"))

while tasks:
    priority, task = heapq.heappop(tasks)
    print(f"{priority}: {task}")
# 1: urgent task
# 2: normal task
# 3: low priority task

# Max-heap: negate priorities.
heapq.heappush(tasks, (-99, "highest priority"))`,
    explanation: "heapq is a min-heap; use (priority, value) tuples to associate priorities. Negate priority for max-heap behaviour. Include a sequence counter as tiebreaker when priorities may be equal.",
  },
  {
    id: "py-set-update-operators",
    language: "python",
    title: "Set operators: |, &, -, ^",
    tag: "structures",
    code: `a = {1, 2, 3, 4}
b = {3, 4, 5, 6}

print(a | b)   # {1,2,3,4,5,6}   — union
print(a & b)   # {3, 4}           — intersection
print(a - b)   # {1, 2}           — difference (in a, not in b)
print(b - a)   # {5, 6}
print(a ^ b)   # {1,2,5,6}       — symmetric difference

# In-place versions.
a |= {7, 8}
a &= {1, 2, 7, 8}
print(a)   # {1, 2, 7, 8}

# Methods also accept any iterable, operators only accept sets.
print(a.union([9, 10]))  # {1, 2, 7, 8, 9, 10}`,
    explanation: "Set operators are concise but require both operands to be sets; the equivalent methods (union, intersection, difference) accept any iterable on the right side.",
  },
  {
    id: "py-typing-protocol-callable",
    language: "python",
    title: "Protocol for callable signatures",
    tag: "structures",
    code: `from typing import Protocol

class Transformer(Protocol):
    def __call__(self, data: list[int]) -> list[int]: ...

def double(data: list[int]) -> list[int]:
    return [x * 2 for x in data]

def apply(transform: Transformer, values: list[int]) -> list[int]:
    return transform(values)

print(apply(double, [1, 2, 3]))   # [2, 4, 6]

# Any callable with the right signature satisfies Transformer,
# including lambdas, classes with __call__, and partial functions.
from functools import partial
triple = partial(lambda f, data: [x * f for x in data], 3)`,
    explanation: "A Protocol with __call__ defines a callable interface — any function, method, or class with __call__ that matches the signature satisfies it, without explicit inheritance.",
  },
  {
    id: "py-weakref-callback",
    language: "python",
    title: "weakref.finalize — cleanup callback on GC",
    tag: "structures",
    code: `import weakref

class Resource:
    def __init__(self, name): self.name = name

def cleanup(name):
    print(f"Resource {name!r} was garbage collected")

r = Resource("database")
weakref.finalize(r, cleanup, r.name)   # register cleanup

del r                # drops last strong reference
# Resource 'database' was garbage collected  (printed here)

# finalize is also useful for ensuring cleanup even without
# an explicit Dispose/close() call.`,
    explanation: "weakref.finalize registers a callback that runs when the object is garbage collected. It's a safer alternative to __del__ because it holds a weak reference and won't prevent GC.",
  },
  {
    id: "py-collections-userlist",
    language: "python",
    title: "UserList / UserDict for safe subclassing",
    tag: "structures",
    code: `from collections import UserList

class CappedList(UserList):
    def __init__(self, maxlen, data=None):
        super().__init__(data or [])
        self.maxlen = maxlen

    def append(self, item):
        if len(self.data) >= self.maxlen:
            raise OverflowError(f"max {self.maxlen} items")
        super().append(item)

cl = CappedList(3)
cl.append(1)
cl.append(2)
cl.append(3)
try:
    cl.append(4)
except OverflowError as e:
    print(e)   # max 3 items`,
    explanation: "Subclassing UserList/UserDict is safer than subclassing list/dict directly because UserList stores data in self.data — all list operations go through your overrides.",
  },
  {
    id: "py-struct-module-2",
    language: "python",
    title: "struct.pack / unpack for binary protocols",
    tag: "structures",
    code: `import struct

# Format string: > = big-endian, H = unsigned short (2 bytes), I = unsigned int (4 bytes)
fmt = ">HI"
data = struct.pack(fmt, 42, 1000000)
print(data.hex())  # 002a000f4240

# Unpack restores the values.
version, size = struct.unpack(fmt, data)
print(version, size)  # 42 1000000

# calcsize tells you the byte length.
print(struct.calcsize(fmt))  # 6

# Unpack_from reads from a larger buffer at an offset.
buf = b"\x00" * 4 + data
v, s = struct.unpack_from(fmt, buf, offset=4)`,
    explanation: "struct.pack/unpack converts between Python values and C structs in binary form — essential for reading/writing binary file formats, network protocols, and hardware registers.",
  },
  {
    id: "py-io-binary-modes",
    language: "python",
    title: "Binary file modes and binary I/O",
    tag: "structures",
    code: `# 'rb' — read binary, 'wb' — write binary, 'ab' — append binary
import io, struct

# Write a binary record.
with open("/tmp/data.bin", "wb") as f:
    f.write(struct.pack(">II", 42, 1000))  # two unsigned ints

# Read it back.
with open("/tmp/data.bin", "rb") as f:
    a, b = struct.unpack(">II", f.read(8))
    print(a, b)  # 42 1000

# BytesIO for in-memory binary "files".
buf = io.BytesIO()
buf.write(b"\x01\x02\x03")
buf.seek(0)
print(buf.read())  # b'\x01\x02\x03'`,
    explanation: "Open files in 'rb'/'wb' mode to work with raw bytes instead of decoded text. BytesIO lets you use the same binary API in memory — useful for testing.",
  },
  {
    id: "py-multiprocessing-shared",
    language: "python",
    title: "multiprocessing.Value for shared state",
    tag: "structures",
    code: `from multiprocessing import Process, Value
import ctypes

def increment(shared_val, n):
    for _ in range(n):
        with shared_val.get_lock():   # atomic increment
            shared_val.value += 1

shared = Value(ctypes.c_int, 0)
procs = [Process(target=increment, args=(shared, 1000)) for _ in range(4)]
for p in procs: p.start()
for p in procs: p.join()
print(shared.value)  # 4000 (with lock)`,
    explanation: "multiprocessing.Value wraps a ctypes type in shared memory accessible by all processes. Always use get_lock() for read-modify-write operations to avoid race conditions.",
  },
  {
    id: "py-csv-writer",
    language: "python",
    title: "csv module — reading and writing CSV",
    tag: "structures",
    code: `import csv, io

# Write CSV to in-memory buffer.
output = io.StringIO()
writer = csv.writer(output)
writer.writerow(["name", "score"])
writer.writerows([["alice", 90], ["bob", 85]])
print(output.getvalue())
# name,score\r\nalice,90\r\nbob,85\r\n

# Read with DictReader — keys from header row.
data = "name,score\nalice,90\nbob,85\n"
reader = csv.DictReader(io.StringIO(data))
for row in reader:
    print(row["name"], row["score"])
# alice 90 / bob 85`,
    explanation: "csv.writer handles quoting and escaping automatically. csv.DictReader uses the first row as keys, giving you dict-like access without index magic.",
  },
  {
    id: "py-enum-int",
    language: "python",
    title: "IntEnum — enum that is also an int",
    tag: "structures",
    code: `from enum import IntEnum

class Status(IntEnum):
    PENDING  = 1
    ACTIVE   = 2
    INACTIVE = 3

# IntEnum can be used anywhere an int is expected.
print(Status.ACTIVE == 2)       # True
print(Status.ACTIVE > Status.PENDING)  # True
print(sorted([Status.INACTIVE, Status.PENDING, Status.ACTIVE]))
# [<Status.PENDING: 1>, <Status.ACTIVE: 2>, <Status.INACTIVE: 3>]

# IntEnum members pass isinstance(x, int) checks.
print(isinstance(Status.ACTIVE, int))  # True`,
    explanation: "IntEnum members are integers — they work in any context expecting an int (comparisons, arithmetic, sorting) without explicit casting, unlike regular Enum.",
  },
  // --- caveats ---
  {
    id: "py-default-arg-gotcha",
    language: "python",
    title: "Default arg evaluated at definition time — not call time",
    tag: "caveats",
    code: `import datetime

def log(msg, timestamp=datetime.datetime.now()):
    # timestamp is evaluated ONCE when the module loads.
    print(f"{timestamp}: {msg}")

log("first call")   # 2026-05-07 10:00:00: first call
import time; time.sleep(1)
log("second call")  # 2026-05-07 10:00:00: second call  ← same timestamp!

# Fix: use None as default and compute inside.
def log_fixed(msg, timestamp=None):
    if timestamp is None:
        timestamp = datetime.datetime.now()
    print(f"{timestamp}: {msg}")`,
    explanation: "Default argument expressions are evaluated once at function definition, not on each call. Mutable objects and time-sensitive expressions should always use None as default.",
  },
  {
    id: "py-class-namespace",
    language: "python",
    title: "Class body has its own namespace — names don't escape to methods",
    tag: "caveats",
    code: `class Counter:
    count = 0
    doubles = [count * 2 for _ in range(3)]   # 'count' IS visible here

    def show(self):
        # 'count' is NOT directly visible here — must use self.count or Counter.count
        return Counter.count   # OK
        # return count          # NameError!

c = Counter()
print(c.doubles)   # [0, 0, 0]  — class-level comp sees 'count'
print(c.show())    # 0`,
    explanation: "Class-level expressions (default values, list comprehensions) can access class-scope names. But methods see class variables only via self.name or ClassName.name, not as bare names.",
  },
  {
    id: "py-walrus-precedence",
    language: "python",
    title: "Walrus operator has low precedence — parenthesise in conditions",
    tag: "caveats",
    code: `# Walrus := has very low precedence — lower than most operators.
data = [1, 2, 3, 4, 5]

# This works as expected:
if (n := len(data)) > 3:
    print(f"long list of {n}")  # long list of 5

# Without parens in a condition, := can surprise you.
# x = y := 5   # SyntaxError in some contexts

# Safe pattern: always wrap walrus in parentheses inside conditions.
while chunk := data[:2]:
    print(chunk)
    data = data[2:]`,
    explanation: "The walrus operator has lower precedence than comparisons — in if/while conditions, always wrap it in parentheses to ensure it binds the way you intend.",
  },
  {
    id: "py-global-mutable",
    language: "python",
    title: "Global mutable objects can be modified without 'global'",
    tag: "caveats",
    code: `items = [1, 2, 3]

def add_item(x):
    items.append(x)    # works! we're mutating, not reassigning
    print(items)

add_item(4)   # [1, 2, 3, 4]

def replace_items(new_list):
    # global items         # NEEDED to rebind the name
    items = new_list       # creates local 'items', doesn't affect global
    print(items)           # [99] — local only

replace_items([99])
print(items)  # [1, 2, 3, 4]  — global unchanged`,
    explanation: "You don't need 'global' to mutate a global mutable object. You only need 'global' when you want to rebind the name itself (i.e., assign a new object to it).",
  },
  {
    id: "py-exception-args",
    language: "python",
    title: "Exception .args stores the constructor arguments",
    tag: "caveats",
    code: `try:
    raise ValueError("bad value", 42)
except ValueError as e:
    print(e)          # ('bad value', 42)  — tuple if multiple args
    print(e.args)     # ('bad value', 42)
    print(e.args[0])  # 'bad value'

# Single arg:
try:
    raise RuntimeError("something failed")
except RuntimeError as e:
    print(e.args)     # ('something failed',)  — always a tuple
    print(str(e))     # 'something failed'  — str uses args[0] if one arg`,
    explanation: "Exception.args is always a tuple of the constructor arguments. Custom exception classes should store domain-specific attributes as instance attributes, not rely on args indexing.",
  },
  {
    id: "py-integer-division-type",
    language: "python",
    title: "True division always returns float, even for integers",
    tag: "caveats",
    code: `print(4 / 2)      # 2.0  — float, NOT int!
print(type(4/2))  # <class 'float'>

# Floor division returns int when both operands are int.
print(type(4//2))  # <class 'int'>
print(4 // 2)      # 2

# Mixed types follow the usual promotion rules.
print(type(4 // 2.0))  # <class 'float'>
print(4 // 2.0)         # 2.0

# Gotcha in code that expects integers after division:
n = 10 / 5 + 1   # 3.0, not 3
print(type(n))   # float`,
    explanation: "In Python 3, / always returns float even when dividing two integers evenly. Use // for integer division when you need an int result.",
  },
  {
    id: "py-nested-list-comp",
    language: "python",
    title: "Nested list comprehension — order mirrors for-loop order",
    tag: "caveats",
    code: `# Outer loop first, inner loop second — same order as nested for-loops.
matrix = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]

# Flatten: [element for row in matrix for element in row]
flat = [x for row in matrix for x in row]
print(flat)   # [1, 2, 3, 4, 5, 6, 7, 8, 9]

# Common confusion: [f(x) for x in a for x in b]
# means for x in a: for x in b: f(x)  — inner x shadows outer!

# Transpose a matrix:
transposed = [[row[i] for row in matrix] for i in range(3)]
print(transposed)   # [[1,4,7],[2,5,8],[3,6,9]]`,
    explanation: "In a nested list comprehension, for-clauses are ordered the same as their equivalent nested for-loops (outer → inner). The expression at the start uses the innermost variable.",
  },
  {
    id: "py-object-comparison-identity",
    language: "python",
    title: "Custom class uses identity for == unless __eq__ defined",
    tag: "caveats",
    code: `class Point:
    def __init__(self, x, y):
        self.x, self.y = x, y

p1 = Point(1, 2)
p2 = Point(1, 2)

# No __eq__ defined → defaults to identity comparison.
print(p1 == p2)    # False  — different objects!
print(p1 is p2)    # False

# Now define __eq__.
Point.__eq__ = lambda self, other: (self.x, self.y) == (other.x, other.y)
print(p1 == p2)    # True  — value comparison`,
    explanation: "Without __eq__, == falls back to 'is' (identity comparison). Always define __eq__ for value objects. Defining __eq__ without __hash__ makes the class unhashable.",
  },
  {
    id: "py-in-operator-list-vs-dict",
    language: "python",
    title: "'in' checks keys in dict, not values",
    tag: "caveats",
    code: `d = {"a": 1, "b": 2, "c": 3}

# 'in' on a dict tests KEYS.
print("a" in d)    # True
print(1 in d)      # False  ← 1 is a value, not a key!

# To test values:
print(1 in d.values())   # True

# To test items:
print(("a", 1) in d.items())  # True

# Same for for-loop: iterates over keys.
for k in d:
    print(k)  # a, b, c  (keys only)`,
    explanation: "'in' on a dict and for-loops over a dict operate on keys. Use d.values() and d.items() explicitly to test or iterate values and key-value pairs.",
  },
  {
    id: "py-string-concat-vs-join",
    language: "python",
    title: "String concatenation in loop is O(n²) — use join",
    tag: "caveats",
    code: `# + in a loop creates a new string each iteration — O(n²).
parts = []
result = ""
for i in range(10000):
    result += str(i)   # slow for large n

# str.join: O(n) — builds all parts then joins once.
result2 = "".join(str(i) for i in range(10000))  # fast

# Always build a list, then join.
tokens = ["Hello", ", ", "World", "!"]
print("".join(tokens))   # Hello, World!

import io
# Or StringIO for mixed operations:
buf = io.StringIO()
for i in range(100):
    buf.write(str(i))`,
    explanation: "String + in a loop creates O(n) intermediate strings, totalling O(n²) work. str.join makes one pass to measure length, allocates once, and fills in — O(n).",
  },
  // --- types ---
  {
    id: "py-typing-typevar",
    language: "python",
    title: "TypeVar — generic type parameter",
    tag: "types",
    code: `from typing import TypeVar

T = TypeVar('T')

def first(seq: list[T]) -> T:
    return seq[0]

# TypeVar preserves the relationship between input and output.
x: int = first([1, 2, 3])       # type: int
s: str = first(["a", "b"])      # type: str

# Bounded TypeVar — T must be a subtype of Comparable.
C = TypeVar('C', int, float, str)

def maximum(a: C, b: C) -> C:
    return a if a >= b else b

print(maximum(3, 7))      # 7  (int)
print(maximum("b", "a"))  # b  (str)`,
    explanation: "TypeVar lets type checkers track that 'the output type is the same as the input type'. Without it, first(list[int]) → T, the return type would just be 'Any'.",
  },
  {
    id: "py-type-alias-new",
    language: "python",
    title: "type statement for type aliases (Python 3.12+)",
    tag: "types",
    code: `# Python 3.12+ explicit type alias statement.
type Vector = list[float]
type Matrix = list[Vector]

def dot(a: Vector, b: Vector) -> float:
    return sum(x * y for x, y in zip(a, b))

v1: Vector = [1.0, 2.0, 3.0]
v2: Vector = [4.0, 5.0, 6.0]
print(dot(v1, v2))   # 32.0

# Before 3.12: TypeAlias from typing.
from typing import TypeAlias
Vector2: TypeAlias = list[float]`,
    explanation: "The 'type' statement (3.12+) creates explicit type aliases that type checkers understand as aliases, not new types. TypeAlias annotation serves the same purpose in older Python.",
  },
  {
    id: "py-annotated-metadata",
    language: "python",
    title: "typing.Annotated — attach metadata to types",
    tag: "types",
    code: `from typing import Annotated

# Annotated[T, metadata] — the type is T; metadata is arbitrary info.
type Positive  = Annotated[int, "must be > 0"]
type Username  = Annotated[str, "max 20 chars"]
type Latitude  = Annotated[float, "range -90 to 90"]

def create_user(name: Username, age: Positive) -> None:
    pass

# Pydantic, attrs, beartype read the metadata for validation.
# At runtime, the type is just int/str/float — metadata is ignored.
import typing
print(typing.get_args(Positive))   # (int, 'must be > 0')`,
    explanation: "Annotated[T, ...] lets you attach arbitrary metadata (validation rules, documentation, units) to a type hint without affecting runtime behaviour. Libraries like Pydantic use the metadata.",
  },
  {
    id: "py-typing-literal",
    language: "python",
    title: "Literal type — restrict to specific values",
    tag: "types",
    code: `from typing import Literal

# Literal[v1, v2, ...] restricts a parameter to specific values.
def set_log_level(level: Literal["DEBUG", "INFO", "WARNING", "ERROR"]) -> None:
    print(f"Log level set to {level}")

set_log_level("DEBUG")    # OK
# set_log_level("TRACE")  # Type error — 'TRACE' not in Literal

# Useful for string-enum-like parameters.
Direction = Literal["north", "south", "east", "west"]

def move(direction: Direction, steps: int) -> None: ...

# Type narrowing: after isinstance-like checks.
def handle(val: Literal[1, 2, 3]) -> str:
    return str(val)`,
    explanation: "Literal[...] narrows a type to a finite set of exact values — effectively a string enum without a class. Type checkers verify callers pass only listed values.",
  },
  {
    id: "py-typing-final",
    language: "python",
    title: "Final — constant binding / prevent override",
    tag: "types",
    code: `from typing import Final

# Final marks a variable as constant — prevents rebinding.
MAX_SIZE: Final = 100
# MAX_SIZE = 200  # mypy error: cannot assign to final variable

# Final in class — prevents subclass override.
from typing import final

class Base:
    @final
    def critical_method(self):
        return "must not be overridden"

class Child(Base):
    pass
    # def critical_method(self): ...  # mypy error!

# Final class itself: cannot be subclassed.
@final
class Singleton:
    pass`,
    explanation: "Final prevents reassignment of module-level constants and prevents method/class overriding in subclasses — enforced only by type checkers, not at runtime.",
  },
  {
    id: "py-protocol-runtime-check",
    language: "python",
    title: "@runtime_checkable Protocol enables isinstance",
    tag: "types",
    code: `from typing import Protocol, runtime_checkable

@runtime_checkable
class Drawable(Protocol):
    def draw(self) -> None: ...

class Circle:
    def draw(self) -> None: print("O")

class Square:
    def draw(self) -> None: print("[]")

class Point:
    pass  # no draw()

for obj in [Circle(), Square(), Point()]:
    print(f"{type(obj).__name__}: {isinstance(obj, Drawable)}")
# Circle: True
# Square: True
# Point: False`,
    explanation: "@runtime_checkable makes isinstance() check for the presence of required methods at runtime. Without this decorator, Protocol is purely a static-analysis construct.",
  },
  {
    id: "py-never-type-2",
    language: "python",
    title: "Never / NoReturn — functions that don't return",
    tag: "types",
    code: `from typing import Never, NoReturn

def fail(msg: str) -> NoReturn:
    raise RuntimeError(msg)   # always raises, never returns

def assert_never(x: Never) -> Never:
    raise AssertionError(f"Unexpected value: {x!r}")

# In exhaustive switch patterns:
from typing import Literal
Mode = Literal["read", "write"]

def handle(mode: Mode) -> str:
    if mode == "read":  return "reading"
    if mode == "write": return "writing"
    assert_never(mode)   # type checker knows this is unreachable`,
    explanation: "NoReturn annotates functions that always raise or loop forever. Never (3.11+) is for values that can't exist — used with assert_never to guarantee exhaustive pattern matching.",
  },
  {
    id: "py-typing-overload",
    language: "python",
    title: "typing.overload for multiple call signatures",
    tag: "types",
    code: `from typing import overload

@overload
def process(x: int) -> int: ...
@overload
def process(x: str) -> str: ...

def process(x):
    if isinstance(x, int):
        return x * 2
    return x.upper()

# Type checker knows the return type based on argument type.
result_int: int = process(5)     # type: int
result_str: str = process("hi")  # type: str

print(result_int)   # 10
print(result_str)   # HI`,
    explanation: "@overload lets you declare multiple typed signatures for a single function. The decorated stubs are type-only; the final undecorated definition is the actual implementation.",
  },
  // --- families ---
  {
    id: "py-str-format-methods",
    language: "python",
    title: "f-string vs str.format() vs % formatting",
    tag: "families",
    code: `name, score = "alice", 92.5

# f-string (3.6+): most readable, evaluated at runtime.
print(f"{name}: {score:.1f}")      # alice: 92.5

# str.format: templates, separates data from structure.
tmpl = "{name}: {score:.1f}"
print(tmpl.format(name=name, score=score))

# %-formatting: legacy, printf-style.
print("%s: %.1f" % (name, score))   # alice: 92.5

# f-string with debug (3.8+): shows name=value.
print(f"{name=}")   # name='alice'
print(f"{score=:.1f}")  # score=92.5`,
    explanation: "f-strings are preferred for new code. str.format() is better when the template is loaded from config/translations. %-formatting is legacy but still widely seen in logs and stdlib code.",
  },
  {
    id: "py-copy-types",
    language: "python",
    title: "Shallow copy methods — list.copy, dict.copy, copy.copy",
    tag: "families",
    code: `import copy

lst  = [[1, 2], [3, 4]]
d    = {"a": [1, 2]}

# All of these produce a shallow copy (top-level new, nested shared).
copy1 = lst.copy()           # list method
copy2 = lst[:]               # slice
copy3 = list(lst)            # constructor
copy4 = copy.copy(lst)       # generic shallow

copy1[0].append(99)          # mutates nested list in both!
print(lst[0])                # [1, 2, 99]
print(copy1[0])              # [1, 2, 99]  — shared

deep = copy.deepcopy(lst)    # fully independent
deep[0].append(77)
print(lst[0])                # [1, 2, 99]  unchanged`,
    explanation: "There are many ways to shallow-copy a list; they're all equivalent. The distinction is shallow (top-level only) vs deep (fully recursive) — only deepcopy fully separates nested objects.",
  },
  {
    id: "py-exception-handling-patterns",
    language: "python",
    title: "Exception handling patterns — EAFP vs LBYL",
    tag: "families",
    code: `d = {"key": "value"}

# LBYL (Look Before You Leap) — check before acting.
if "key" in d:
    print(d["key"])

# EAFP (Easier to Ask Forgiveness than Permission) — Pythonic.
try:
    print(d["missing"])
except KeyError:
    print("not found")

# EAFP is often faster when the success case is common.
# LBYL has a TOCTOU race condition in multi-threaded code.

# hasattr is EAFP-style:
if hasattr(d, "get"):
    print(d.get("key", "default"))`,
    explanation: "EAFP (try/except) is the Pythonic style — it avoids duplicate work and isn't subject to time-of-check/time-of-use races. LBYL (check first) is clearer when the false case is common.",
  },
  {
    id: "py-typing-cast",
    language: "python",
    title: "typing.cast — type narrowing at the type-checker level",
    tag: "families",
    code: `from typing import cast, Any

def get_value(d: dict[str, Any], key: str) -> str:
    val = d.get(key)
    # Type checker sees val as Any — cast tells it the specific type.
    return cast(str, val)   # runtime: returns val unchanged, no conversion!

# cast is purely a static analysis hint — zero runtime effect.
x: Any = 42
s: str = cast(str, x)
print(type(s))   # <class 'int'>  — still int at runtime!

# Use cast sparingly — prefer isinstance narrowing when possible.
val: int | str = get_value({"key": "hello"}, "key")`,
    explanation: "cast(Type, expr) is a pure type annotation — it tells the type checker to treat the expression as that type without any runtime conversion or check. Use it when you know better than the type checker.",
  },
  {
    id: "py-math-module-fns",
    language: "python",
    title: "math module — common functions",
    tag: "families",
    code: `import math

# Trigonometry (radians).
print(math.sin(math.pi / 2))   # 1.0
print(math.cos(0))             # 1.0
print(math.degrees(math.pi))   # 180.0

# Powers and logs.
print(math.sqrt(16))           # 4.0
print(math.log(100, 10))       # 2.0  (log base 10)
print(math.log2(8))            # 3.0
print(math.exp(1))             # 2.718...  (e^1)

# Integer functions.
print(math.ceil(3.2))     # 4
print(math.floor(3.9))    # 3
print(math.trunc(-3.9))   # -3  (toward zero, unlike floor)
print(math.gcd(48, 18))   # 6
print(math.lcm(4, 6))     # 12`,
    explanation: "math provides C-speed implementations of standard mathematical functions. For complex numbers use cmath, for arrays use numpy — math only handles scalars.",
  },
  {
    id: "py-subprocess-communicate",
    language: "python",
    title: "subprocess.run for running shell commands",
    tag: "families",
    code: `import subprocess

# Basic: run a command, capture output.
result = subprocess.run(
    ["echo", "hello world"],
    capture_output=True,
    text=True,
    check=True,      # raises CalledProcessError on non-zero exit
)
print(result.stdout)          # hello world\n
print(result.returncode)      # 0

# Pass input via stdin.
result2 = subprocess.run(
    ["cat"],
    input="pipe me\n",
    capture_output=True,
    text=True,
)
print(result2.stdout)  # pipe me`,
    explanation: "subprocess.run is the modern API — use capture_output=True for stdout/stderr, text=True for string instead of bytes, and check=True to auto-raise on failure.",
  },
  {
    id: "py-generators-vs-coroutines",
    language: "python",
    title: "Generators vs async coroutines",
    tag: "families",
    code: `import asyncio

# Generator: uses 'yield', driven by next().
def count_up(n):
    for i in range(n):
        yield i

for x in count_up(3):
    print(x)   # 0, 1, 2

# Coroutine: uses 'async/await', driven by event loop.
async def async_count(n):
    for i in range(n):
        await asyncio.sleep(0)   # yield control to event loop
        print(i)

asyncio.run(async_count(3))   # 0, 1, 2

# Both suspend execution, but:
# Generator — pull model (caller drives with next())
# Coroutine — push model (event loop drives with .send())`,
    explanation: "Generators use yield and are driven by explicit next() calls (pull model). Async coroutines use await and are driven by an event loop (push model). Don't confuse them.",
  },
  // --- classes ---
  {
    id: "py-dataclass-order",
    language: "python",
    title: "dataclass order=True adds comparison methods",
    tag: "classes",
    code: `from dataclasses import dataclass

@dataclass(order=True)
class Version:
    major: int
    minor: int
    patch: int

v1 = Version(1, 2, 0)
v2 = Version(1, 10, 0)
v3 = Version(2, 0, 0)

print(v1 < v2)    # True   (1.2.0 < 1.10.0)
print(v2 < v3)    # True   (1.10.0 < 2.0.0)
print(sorted([v3, v1, v2]))
# [Version(major=1,minor=2,patch=0), ...]`,
    explanation: "order=True generates __lt__, __le__, __gt__, __ge__ based on field declaration order. Fields are compared left-to-right, making it natural for version numbers and scores.",
  },
  {
    id: "py-context-manager-exception",
    language: "python",
    title: "Context manager __exit__ can suppress exceptions",
    tag: "classes",
    code: `class SuppressError:
    def __init__(self, exc_type):
        self.exc_type = exc_type

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        # Return True to suppress the exception.
        if exc_type is not None and issubclass(exc_type, self.exc_type):
            print(f"Suppressed: {exc_val}")
            return True   # suppressed
        return False      # re-raise

with SuppressError(ValueError):
    raise ValueError("ignored")   # Suppressed: ignored

print("code continues")   # runs normally`,
    explanation: "__exit__ receives the exception info and returns True to suppress it, False to re-raise. This is how contextlib.suppress is implemented.",
  },
  {
    id: "py-metaclass-singleton",
    language: "python",
    title: "Metaclass for singleton enforcement",
    tag: "classes",
    code: `class SingletonMeta(type):
    _instances: dict = {}

    def __call__(cls, *args, **kwargs):
        if cls not in cls._instances:
            instance = super().__call__(*args, **kwargs)
            cls._instances[cls] = instance
        return cls._instances[cls]

class Database(metaclass=SingletonMeta):
    def __init__(self):
        self.connected = True

a = Database()
b = Database()
print(a is b)        # True — same instance
print(id(a) == id(b))  # True`,
    explanation: "A metaclass intercepts class instantiation in __call__ — the singleton metaclass stores the first instance and returns it for all subsequent calls.",
  },
  {
    id: "py-abstract-classmethod",
    language: "python",
    title: "Abstract class method forces subclass factory",
    tag: "classes",
    code: `from abc import ABC, abstractmethod

class Serializable(ABC):
    @classmethod
    @abstractmethod
    def from_dict(cls, data: dict):
        ...

    @abstractmethod
    def to_dict(self) -> dict:
        ...

class User(Serializable):
    def __init__(self, name, age):
        self.name, self.age = name, age

    @classmethod
    def from_dict(cls, data):
        return cls(data["name"], data["age"])

    def to_dict(self):
        return {"name": self.name, "age": self.age}

u = User.from_dict({"name": "alice", "age": 30})
print(u.to_dict())   # {'name': 'alice', 'age': 30}`,
    explanation: "Combining @classmethod and @abstractmethod (in that order in Python 3) forces all subclasses to implement a classmethod factory — useful for serialisation/deserialisation contracts.",
  },
  {
    id: "py-decorator-class",
    language: "python",
    title: "Class decorator that replaces the class",
    tag: "classes",
    code: `def singleton(cls):
    instances = {}
    def get_instance(*args, **kwargs):
        if cls not in instances:
            instances[cls] = cls(*args, **kwargs)
        return instances[cls]
    return get_instance

@singleton
class Config:
    def __init__(self):
        self.debug = False

c1 = Config()
c2 = Config()
print(c1 is c2)   # True

# Note: @singleton replaces Config with 'get_instance',
# so isinstance(c1, Config) would fail if needed.`,
    explanation: "A class decorator can replace the class with any callable. The @singleton pattern here replaces Config with a factory function, but loses isinstance and subclassing support.",
  },
  {
    id: "py-slots-weak",
    language: "python",
    title: "__slots__ with __weakref__ for weak reference support",
    tag: "classes",
    code: `import weakref

class NoWeakRef:
    __slots__ = ('x',)   # no __weakref__ slot

class WithWeakRef:
    __slots__ = ('x', '__weakref__')   # explicit slot

a = NoWeakRef(); a.x = 1
b = WithWeakRef(); b.x = 1

try:
    weakref.ref(a)
except TypeError as e:
    print(e)  # cannot create weak reference to 'NoWeakRef' object

wr = weakref.ref(b)
print(wr().x)   # 1  — object still alive`,
    explanation: "Classes with __slots__ lose the __weakref__ slot by default. Add '__weakref__' to __slots__ explicitly if you need weak references to instances.",
  },
  {
    id: "py-property-delete",
    language: "python",
    title: "property.deleter — del obj.attr",
    tag: "classes",
    code: `class Container:
    def __init__(self):
        self._items = []

    @property
    def items(self):
        return tuple(self._items)

    @items.setter
    def items(self, value):
        self._items = list(value)

    @items.deleter
    def items(self):
        print("clearing items")
        self._items.clear()

c = Container()
c.items = [1, 2, 3]
print(c.items)   # (1, 2, 3)
del c.items      # clearing items
print(c.items)   # ()`,
    explanation: "property.deleter defines what happens when 'del obj.property' is called — useful for cleanup operations like clearing a cache or closing a resource.",
  },
  {
    id: "py-dunder-contains",
    language: "python",
    title: "__contains__ powers the 'in' operator",
    tag: "classes",
    code: `class IPNetwork:
    def __init__(self, base, mask):
        self.base = base   # e.g., 192168001000 as int
        self.mask = mask   # number of host bits

    def __contains__(self, ip: int) -> bool:
        host_bits = self.mask
        return (ip >> host_bits) == (self.base >> host_bits)

net = IPNetwork(0xC0A80100, 8)   # 192.168.1.0/24 simplified

print(0xC0A80101 in net)   # True  — 192.168.1.1
print(0xC0A80200 in net)   # False — 192.168.2.0`,
    explanation: "__contains__ is called by the 'in' operator. Implementing it lets your class participate in membership tests with natural syntax.",
  },
  {
    id: "py-type-annotations-pep563",
    language: "python",
    title: "from __future__ import annotations — deferred evaluation",
    tag: "classes",
    code: `# Without deferred annotations, forward references need quotes.
class Node:
    def __init__(self):
        self.next: "Node | None" = None   # quotes needed

# With PEP 563: annotations become strings — evaluated lazily.
from __future__ import annotations

class Tree:
    left:  Tree | None = None   # no quotes needed — forward ref works
    right: Tree | None = None

    def insert(self, child: Tree) -> None:
        self.left = child

t = Tree()
t.insert(Tree())`,
    explanation: "'from __future__ import annotations' (PEP 563) makes all annotations strings evaluated lazily, allowing forward references without quotes. Scheduled to be default in a future Python version.",
  },
  {
    id: "py-dunder-iter-next",
    language: "python",
    title: "__iter__ and __next__ — custom iterator",
    tag: "classes",
    code: `class FibIterator:
    def __init__(self, limit):
        self.a, self.b = 0, 1
        self.limit = limit

    def __iter__(self):
        return self   # the iterator IS the iterable

    def __next__(self):
        if self.a > self.limit:
            raise StopIteration
        val = self.a
        self.a, self.b = self.b, self.a + self.b
        return val

for n in FibIterator(20):
    print(n, end=" ")  # 0 1 1 2 3 5 8 13`,
    explanation: "__iter__ returns the iterator object; __next__ returns the next value or raises StopIteration. Implementing both makes an object work in for-loops and with list().",
  },
  {
    id: "py-contextlib-exitstack",
    language: "python",
    title: "contextlib.ExitStack — dynamic context manager stack",
    tag: "snippet",
    code: `from contextlib import ExitStack

files = ["a.txt", "b.txt", "c.txt"]

# Open a dynamic number of context managers.
with ExitStack() as stack:
    handles = [
        stack.enter_context(open(f, "w"))
        for f in files
    ]
    for i, h in enumerate(handles):
        h.write(f"file {i}\n")
# All files are closed when the with-block exits.

# ExitStack also lets you conditionally enter context managers.
import contextlib
with ExitStack() as stack:
    lock = stack.enter_context(contextlib.nullcontext())`,
    explanation: "ExitStack manages a dynamic list of context managers — enter them in a loop and they all clean up together when the with block exits.",
  },
  {
    id: "py-async-with",
    language: "python",
    title: "async with and async for",
    tag: "snippet",
    code: `import asyncio

class AsyncDB:
    async def __aenter__(self):
        print("connect")
        return self

    async def __aexit__(self, *args):
        print("disconnect")

    async def __aiter__(self):
        for row in [1, 2, 3]:
            await asyncio.sleep(0)
            yield row

async def main():
    async with AsyncDB() as db:
        async for row in db:
            print(row)

asyncio.run(main())
# connect  1  2  3  disconnect`,
    explanation: "__aenter__/__aexit__ support 'async with'; __aiter__/__anext__ (or async generator yield) support 'async for'. Both are the async counterparts of their sync versions.",
  },
  {
    id: "py-pep695-type-alias-2",
    language: "python",
    title: "PEP 695 generic functions (Python 3.12+)",
    tag: "types",
    code: `# Python 3.12 type parameter syntax — no need to import TypeVar.
def first[T](seq: list[T]) -> T:
    return seq[0]

# Generic class with new syntax.
class Stack[T]:
    def __init__(self): self._items: list[T] = []
    def push(self, item: T) -> None: self._items.append(item)
    def pop(self) -> T: return self._items.pop()

s: Stack[int] = Stack()
s.push(1)
s.push(2)
print(s.pop())   # 2`,
    explanation: "PEP 695 (Python 3.12) adds bracket syntax for type parameters, replacing TypeVar boilerplate. The type checker infers T per call site.",
  },
  {
    id: "py-random-module",
    language: "python",
    title: "random module — common operations",
    tag: "snippet",
    code: `import random

# Random float in [0, 1).
print(random.random())

# Random int in [a, b] inclusive.
print(random.randint(1, 6))   # dice roll

# Random choice from a sequence.
print(random.choice(["rock", "paper", "scissors"]))

# Shuffle in place.
deck = list(range(52))
random.shuffle(deck)

# Sample k unique elements without replacement.
print(random.sample(range(100), k=5))

# Seed for reproducibility.
random.seed(42)
print(random.random())   # always the same`,
    explanation: "random uses the Mersenne Twister PRNG — fast but not cryptographically secure. Use secrets module for passwords, tokens, and cryptographic keys.",
  },
  {
    id: "py-secrets-module-2",
    language: "python",
    title: "secrets module — cryptographically secure random",
    tag: "snippet",
    code: `import secrets, string

# Cryptographically secure random bytes.
token_bytes = secrets.token_bytes(16)   # 16 random bytes
print(token_bytes.hex())                # 32-char hex string

# URL-safe base64 token.
print(secrets.token_urlsafe(16))   # e.g. 'V1hHqvX6tZnkjMfp'

# Secure random int in [0, n).
die = secrets.randbelow(6) + 1   # 1–6

# Secure random password.
alphabet = string.ascii_letters + string.digits + "!@#$%"
password = "".join(secrets.choice(alphabet) for _ in range(16))
print(len(password))  # 16`,
    explanation: "The secrets module uses OS-level randomness (os.urandom) instead of Mersenne Twister — use it for tokens, session keys, OTPs, and any security-sensitive random value.",
  },
  {
    id: "py-contextvar-2",
    language: "python",
    title: "contextvars.ContextVar for async-local storage",
    tag: "structures",
    code: `from contextvars import ContextVar
import asyncio

request_id: ContextVar[str] = ContextVar("request_id", default="none")

async def handle_request(rid: str):
    token = request_id.set(rid)   # set for this task's context
    try:
        await process()
    finally:
        request_id.reset(token)

async def process():
    print(f"Processing request: {request_id.get()}")

async def main():
    await asyncio.gather(
        handle_request("req-1"),
        handle_request("req-2"),
    )
asyncio.run(main())
# Processing request: req-1
# Processing request: req-2`,
    explanation: "ContextVar provides task-local storage in asyncio — each Task gets its own value without thread locals. Essential for request-scoped data (user ID, trace context) in async web frameworks.",
  },
  {
    id: "py-abc-mixin-2",
    language: "python",
    title: "ABC mixin for shared behaviour with abstract requirements",
    tag: "classes",
    code: `from abc import ABC, abstractmethod

class JsonMixin(ABC):
    @abstractmethod
    def to_dict(self) -> dict: ...

    def to_json(self) -> str:
        import json
        return json.dumps(self.to_dict())

    @classmethod
    def from_json(cls, text: str):
        import json
        return cls(**json.loads(text))

class User(JsonMixin):
    def __init__(self, name: str, age: int):
        self.name, self.age = name, age

    def to_dict(self) -> dict:
        return {"name": self.name, "age": self.age}

u = User("alice", 30)
print(u.to_json())          # {"name": "alice", "age": 30}
u2 = User.from_json(u.to_json())
print(u2.name)              # alice`,
    explanation: "An ABC mixin provides concrete methods that depend on abstract methods implemented by subclasses. It's a contract: subclass provides primitives, mixin provides derived operations.",
  },
  {
    id: "py-pep544-structural-2",
    language: "python",
    title: "Protocol structural subtyping — duck typing made explicit",
    tag: "types",
    code: `from typing import Protocol

class Sized(Protocol):
    def __len__(self) -> int: ...

class Indexable(Protocol):
    def __getitem__(self, i: int): ...

class SizedIndexable(Sized, Indexable, Protocol):
    pass   # combine protocols

def first_three(seq: SizedIndexable):
    if len(seq) < 3:
        raise ValueError("need at least 3 items")
    return seq[0], seq[1], seq[2]

print(first_three([10, 20, 30, 40]))   # (10, 20, 30)
print(first_three("abcdef"))           # ('a', 'b', 'c')`,
    explanation: "Protocol composition via inheritance creates combined structural contracts. Both list and str satisfy SizedIndexable without inheriting from it — pure duck typing.",
  },
  {
    id: "py-logging-levels",
    language: "python",
    title: "Logging levels and per-module loggers",
    tag: "snippet",
    code: `import logging

# Logger hierarchy: root → package → module.
log = logging.getLogger("myapp.db")

# Level check avoids computing expensive log messages.
if log.isEnabledFor(logging.DEBUG):
    log.debug("slow repr: %r", expensive_object)  # type: ignore

# Set levels per module.
logging.getLogger("myapp").setLevel(logging.WARNING)
logging.getLogger("myapp.db").setLevel(logging.DEBUG)  # override for this module

# Levels: DEBUG(10) < INFO(20) < WARNING(30) < ERROR(40) < CRITICAL(50)
log.debug("db query: %s", "SELECT 1")
log.info("connected")
log.warning("slow query took 2s")`,
    explanation: "Logger names are hierarchical (parent.child) — setting a level on a parent filters all children unless they override. Use module-level loggers to enable fine-grained control.",
  },
  {
    id: "py-functools-total-ordering",
    language: "python",
    title: "functools.total_ordering fills in comparison methods",
    tag: "snippet",
    code: `from functools import total_ordering

@total_ordering
class Score:
    def __init__(self, value): self.value = value

    def __eq__(self, other):
        return self.value == other.value

    def __lt__(self, other):
        return self.value < other.value
    # total_ordering generates __le__, __gt__, __ge__ automatically.

scores = [Score(90), Score(75), Score(85)]
print(min(scores).value)   # 75
print(max(scores).value)   # 90
print(sorted(scores, reverse=True)[0].value)   # 90`,
    explanation: "total_ordering generates the four comparison operators from just __eq__ and one of __lt__/__le__/__gt__/__ge__. Slightly slower than manual implementation but saves boilerplate.",
  },
  {
    id: "py-iter-tools-chain",
    language: "python",
    title: "itertools.chain — flatten iterables",
    tag: "snippet",
    code: `from itertools import chain

# chain concatenates multiple iterables lazily.
a = [1, 2, 3]
b = (4, 5)
c = range(6, 9)

combined = list(chain(a, b, c))
print(combined)  # [1, 2, 3, 4, 5, 6, 7, 8]

# chain.from_iterable: flatten one level of nesting.
matrix = [[1, 2], [3, 4], [5, 6]]
flat = list(chain.from_iterable(matrix))
print(flat)   # [1, 2, 3, 4, 5, 6]

# Lazy — chain doesn't materialise until iterated.`,
    explanation: "chain concatenates iterables without creating intermediate lists. chain.from_iterable is the lazy equivalent of [x for row in matrix for x in row].",
  },
  {
    id: "py-typing-params",
    language: "python",
    title: "ParamSpec for decorator typing (Python 3.10+)",
    tag: "types",
    code: `from typing import ParamSpec, TypeVar, Callable
import functools

P = ParamSpec('P')
T = TypeVar('T')

def log_call(func: Callable[P, T]) -> Callable[P, T]:
    @functools.wraps(func)
    def wrapper(*args: P.args, **kwargs: P.kwargs) -> T:
        print(f"calling {func.__name__}")
        return func(*args, **kwargs)
    return wrapper

@log_call
def add(a: int, b: int) -> int:
    return a + b

result: int = add(2, 3)   # type checker knows return is int
print(result)  # calling add  →  5`,
    explanation: "ParamSpec captures the parameter specification of a callable, letting decorators preserve the full typed signature of the wrapped function — not just the return type.",
  },
  {
    id: "py-match-or-pattern",
    language: "python",
    title: "match statement with OR patterns and capture",
    tag: "snippet",
    code: `def describe(value):
    match value:
        case 0 | False:
            return "zero or false"
        case int(n) if n < 0:
            return f"negative int: {n}"
        case int(n) | float(n):
            return f"number: {n}"
        case str(s) if len(s) > 10:
            return f"long string ({len(s)} chars)"
        case str(s):
            return f"short string: {s!r}"
        case _:
            return "something else"

print(describe(0))          # zero or false
print(describe(-5))         # negative int: -5
print(describe(3.14))       # number: 3.14
print(describe("hello"))    # short string: 'hello'`,
    explanation: "match/case supports OR patterns with |, guard clauses with 'if', and capture patterns like int(n) that bind the value to a name. Patterns are checked top to bottom.",
  },
  {
    id: "py-dataclass-slots",
    language: "python",
    title: "dataclass(slots=True) for memory-efficient instances",
    tag: "classes",
    code: `from dataclasses import dataclass
import sys

@dataclass
class PointDict:
    x: float
    y: float

@dataclass(slots=True)
class PointSlots:
    x: float
    y: float

d = PointDict(1.0, 2.0)
s = PointSlots(1.0, 2.0)

print(sys.getsizeof(d))   # ~56 bytes (has __dict__)
print(sys.getsizeof(s))   # ~48 bytes (no __dict__)

# slots=True is available from Python 3.10.
# Instances cannot have extra attributes.
try:
    s.z = 3.0
except AttributeError as e:
    print(e)`,
    explanation: "dataclass(slots=True) generates __slots__ automatically, reducing per-instance memory overhead and attribute access time — especially valuable for many small instances.",
  },
  {
    id: "py-class-body-dict-order",
    language: "python",
    title: "Class __dict__ is ordered (Python 3.7+)",
    tag: "understanding",
    code: `class Demo:
    b = 2
    a = 1
    c = 3

# Class attributes appear in definition order.
print(list(Demo.__dict__.keys()))
# ['__module__', '__qualname__', 'b', 'a', 'c', '__dict__', '__weakref__', '__doc__']

# vars() gives the same view.
attrs = {k: v for k, v in vars(Demo).items()
         if not k.startswith('_')}
print(attrs)   # {'b': 2, 'a': 1, 'c': 3}  — original order`,
    explanation: "Since Python 3.7, class __dict__ (a mappingproxy) preserves definition order. This is useful for metaclasses that want to enumerate attributes in source order.",
  },
  {
    id: "py-weakref-cache",
    language: "python",
    title: "weakref.WeakValueDictionary — auto-expiring cache",
    tag: "structures",
    code: `import weakref

# WeakValueDictionary: entries are removed when values have no other refs.
cache: weakref.WeakValueDictionary[str, list] = weakref.WeakValueDictionary()

expensive = [1, 2, 3, 4, 5]   # 'strong' reference keeps it alive
cache["result"] = expensive

print("result" in cache)   # True

del expensive              # last strong reference gone
import gc; gc.collect()    # trigger GC

print("result" in cache)   # False — entry auto-removed`,
    explanation: "WeakValueDictionary holds weak references to values — when the only remaining reference to a value is the cache entry, the GC can collect it and the entry disappears automatically.",
  },
  {
    id: "py-int-operations",
    language: "python",
    title: "Integer methods: bit operations and conversion",
    tag: "types",
    code: `n = 255   # 0xFF = 0b11111111

# Binary, octal, hex literals.
print(0b11111111, 0o377, 0xFF)   # all 255

# Formatting.
print(f"{n:b}")    # 11111111
print(f"{n:o}")    # 377
print(f"{n:x}")    # ff
print(f"{n:#010x}")  # 0x000000ff

# Bitwise operations.
print(n & 0x0F)    # 15   (lower nibble)
print(n >> 4)      # 15   (upper nibble)
print(n ^ 0xFF)    # 0    (XOR with self)
print(~n)          # -256 (bitwise NOT)`,
    explanation: "Python ints support all bitwise operations and format natively to binary, octal, and hex. The 0b, 0o, 0x prefixes work as literals.",
  },
  {
    id: "py-namedtuple-vs-dataclass",
    language: "python",
    title: "NamedTuple vs dataclass — immutable vs mutable",
    tag: "families",
    code: `from typing import NamedTuple
from dataclasses import dataclass

class PointNT(NamedTuple):
    x: float; y: float

@dataclass
class PointDC:
    x: float; y: float

nt = PointNT(1.0, 2.0)
dc = PointDC(1.0, 2.0)

# NamedTuple: immutable, tuple subclass, hashable, positional index.
print(nt[0])       # 1.0
print(hash(nt))    # works

# dataclass: mutable by default, class (not tuple).
dc.x = 99
# nt.x = 99   # AttributeError

# @dataclass(frozen=True) gives immutability + hashability.`,
    explanation: "NamedTuple is immutable, lighter, and hashable (use as dict key). dataclass is mutable by default and supports post_init, field config, and frozen mode. Use NamedTuple for pure data records.",
  },
  {
    id: "py-asyncio-lock",
    language: "python",
    title: "asyncio.Lock for async mutual exclusion",
    tag: "snippet",
    code: `import asyncio

counter = 0
lock = asyncio.Lock()

async def increment(n):
    global counter
    for _ in range(n):
        async with lock:   # only one coroutine at a time
            counter += 1

async def main():
    await asyncio.gather(increment(1000), increment(1000))
    print(counter)   # 2000 (not less — no race condition)

asyncio.run(main())`,
    explanation: "asyncio.Lock provides mutual exclusion for async coroutines — 'async with lock' suspends the coroutine if another coroutine holds the lock, without blocking the event loop thread.",
  },
  {
    id: "py-typing-self-return",
    language: "python",
    title: "Self type for fluent builder return types",
    tag: "types",
    code: `from typing import Self

class Builder:
    def __init__(self): self._parts: list[str] = []

    def add(self, part: str) -> Self:   # returns the exact subtype
        self._parts.append(part)
        return self

    def build(self) -> str:
        return ", ".join(self._parts)

class SpecialBuilder(Builder):
    def add_prefix(self, prefix: str) -> Self:
        self._parts.insert(0, f"[{prefix}]")
        return self

sb = SpecialBuilder()
result = sb.add_prefix("LOG").add("a").add("b").build()
print(result)   # [LOG], a, b`,
    explanation: "The Self type annotation (Python 3.11+) means 'the exact subclass of self'. Returning Self instead of the base class means subclass method chains keep the subclass type.",
  },
  {
    id: "py-itertools-groupby-2",
    language: "python",
    title: "itertools.groupby — group consecutive equal elements",
    tag: "snippet",
    code: `from itertools import groupby

# groupby groups CONSECUTIVE equal values — sort first if needed!
data = [("alice", "HR"), ("bob", "HR"), ("carol", "Eng"), ("dave", "HR")]
data.sort(key=lambda r: r[1])   # must sort by group key first

for dept, members in groupby(data, key=lambda r: r[1]):
    names = [m[0] for m in members]
    print(f"{dept}: {names}")
# Eng: ['carol']
# HR: ['alice', 'bob', 'dave']

# Without sorting, same-dept entries not adjacent would form separate groups.`,
    explanation: "groupby groups consecutive identical keys — always sort by the grouping key first if you want all matching elements together. The members iterator is consumed as you iterate.",
  },
  {
    id: "py-inspect-signature",
    language: "python",
    title: "inspect.signature — introspect function parameters",
    tag: "snippet",
    code: `import inspect

def greet(name: str, greeting: str = "Hello", *, verbose: bool = False) -> str:
    return f"{greeting}, {name}!"

sig = inspect.signature(greet)
print(sig)   # (name: str, greeting: str = 'Hello', *, verbose: bool = False) -> str

for name, param in sig.parameters.items():
    print(f"{name}: kind={param.kind.name}, default={param.default!r}")
# name: kind=POSITIONAL_OR_KEYWORD, default=<class 'inspect._empty'>
# greeting: kind=POSITIONAL_OR_KEYWORD, default='Hello'
# verbose: kind=KEYWORD_ONLY, default=False`,
    explanation: "inspect.signature gives programmatic access to a function's parameters — useful for decorators, dependency injection, and documentation generators that need to introspect call signatures.",
  },
  {
    id: "py-match-dataclass",
    language: "python",
    title: "match with dataclass patterns",
    tag: "snippet",
    code: `from dataclasses import dataclass

@dataclass
class Point:
    x: float; y: float

@dataclass
class Circle:
    center: Point; radius: float

def describe(shape):
    match shape:
        case Circle(center=Point(x=0, y=0), radius=r):
            return f"origin circle, r={r}"
        case Circle(center=Point(x=x, y=y), radius=r):
            return f"circle at ({x},{y}), r={r}"
        case Point(x=0, y=0):
            return "origin"
        case Point(x=x, y=y):
            return f"point ({x}, {y})"

print(describe(Circle(Point(0,0), 5)))   # origin circle, r=5
print(describe(Point(3, 4)))             # point (3, 4)`,
    explanation: "Structural pattern matching on dataclasses uses the field names as pattern keys. Patterns are matched top-to-bottom; the first matching case wins.",
  },
  {
    id: "py-pep517-pyproject",
    language: "python",
    title: "Modern packaging with pyproject.toml",
    tag: "understanding",
    code: `# pyproject.toml — the modern single-file project config (PEP 517/518/621).

# [build-system]
# requires = ["setuptools>=68", "wheel"]
# build-backend = "setuptools.backends.legacy:build"

# [project]
# name = "mypackage"
# version = "1.0.0"
# requires-python = ">=3.11"
# dependencies = ["requests>=2.28", "pydantic>=2"]

# [project.optional-dependencies]
# dev = ["pytest", "mypy", "ruff"]

# Build with: python -m build
# Install dev: pip install -e ".[dev]"
# Run tests:   pytest
print("pyproject.toml replaces setup.py + setup.cfg + requirements.txt")`,
    explanation: "pyproject.toml consolidates build config, project metadata, and tool settings (black, mypy, pytest) into one file. PEP 517 decouples the build system from pip.",
  },
  {
    id: "py-typing-guard",
    language: "python",
    title: "TypeGuard for type-narrowing functions",
    tag: "types",
    code: `from typing import TypeGuard

def is_str_list(val: list) -> TypeGuard[list[str]]:
    return all(isinstance(x, str) for x in val)

def process(items: list) -> None:
    if is_str_list(items):
        # Type checker narrows items to list[str] here.
        for s in items:
            print(s.upper())   # .upper() is safe — s is str
    else:
        print("not all strings")

process(["hello", "world"])   # HELLO  WORLD
process([1, "two", 3])        # not all strings`,
    explanation: "TypeGuard[T] tells the type checker that if the function returns True, the argument has type T. This enables custom isinstance-like narrowing with complex logic.",
  },
  {
    id: "py-dataclass-kw-only-2",
    language: "python",
    title: "dataclass kw_only — keyword-only fields",
    tag: "classes",
    code: `from dataclasses import dataclass, KW_ONLY

@dataclass
class Config:
    name: str
    _: KW_ONLY            # all subsequent fields are keyword-only
    debug: bool = False
    verbose: bool = False

# KW_ONLY sentinel means these must be passed by name.
c = Config("myapp", debug=True)
print(c)   # Config(name='myapp', debug=True, verbose=False)

# Config("myapp", True)   # TypeError — debug is keyword-only

# Equivalent: @dataclass(kw_only=True) makes ALL fields keyword-only.`,
    explanation: "KW_ONLY is a sentinel field (Python 3.10+) that makes all subsequent fields keyword-only. Use it to separate positional from keyword fields in a dataclass hierarchy.",
  },
  {
    id: "py-asyncio-semaphore",
    language: "python",
    title: "asyncio.Semaphore for rate limiting",
    tag: "snippet",
    code: `import asyncio

sem = asyncio.Semaphore(3)   # max 3 concurrent operations

async def limited_task(n: int):
    async with sem:
        print(f"Task {n} started")
        await asyncio.sleep(0.1)   # simulated work
        print(f"Task {n} done")

async def main():
    # Launch 10 tasks, but only 3 run concurrently.
    await asyncio.gather(*(limited_task(i) for i in range(10)))

asyncio.run(main())`,
    explanation: "asyncio.Semaphore limits the number of coroutines that can be in a critical section simultaneously — useful for rate limiting API calls, database connections, or any bounded-resource access.",
  },

];
