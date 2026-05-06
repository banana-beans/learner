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
];






