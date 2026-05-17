import type { Snippet } from "./types";

export const pythonSnippets20260517B3: Snippet[] = [
  // === snippet ===
  {
    id: "py-b17-b3-zip-transpose",
    language: "python",
    title: "zip(*matrix) transposes a 2D list",
    tag: "snippet",
    code: `matrix = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9],
]

transposed = list(zip(*matrix))
print(transposed)
# [(1, 4, 7), (2, 5, 8), (3, 6, 9)]

# Convert back to lists:
transposed_lists = [list(row) for row in zip(*matrix)]`,
    explanation: "`zip(*matrix)` unpacks the rows as separate arguments to `zip`, which then pairs corresponding elements from each row — effectively transposing the matrix in a single expression.",
  },
  {
    id: "py-b17-b3-collections-deque-popleft",
    language: "python",
    title: "deque as an efficient queue (O(1) popleft)",
    tag: "snippet",
    code: `from collections import deque

queue = deque()
queue.append("task1")
queue.append("task2")
queue.append("task3")

while queue:
    item = queue.popleft()   # O(1) — unlike list.pop(0) which is O(n)
    print(f"processing {item}")

# BFS pattern:
def bfs(graph, start):
    seen, q = {start}, deque([start])
    while q:
        node = q.popleft()
        for neighbor in graph.get(node, []):
            if neighbor not in seen:
                seen.add(neighbor); q.append(neighbor)`,
    explanation: "`deque.popleft()` removes the front element in O(1); `list.pop(0)` is O(n) because it shifts every remaining element — always use `deque` when you need a FIFO queue.",
  },
  {
    id: "py-b17-b3-str-translate",
    language: "python",
    title: "str.translate with a mapping table",
    tag: "snippet",
    code: `# Build a translation table (ord -> replacement):
table = str.maketrans(
    "aeiou",   # from
    "AEIOU",   # to
    " "        # delete
)

result = "hello world".translate(table)
print(result)   # hEllOwOrld

# Remove all punctuation:
import string
no_punct = str.maketrans("", "", string.punctuation)
print("hello, world!".translate(no_punct))   # hello world`,
    explanation: "`str.maketrans(from, to, delete)` builds a translation table used by `str.translate()` for efficient character substitution or deletion — faster than a regex for single-character replacements.",
  },
  {
    id: "py-b17-b3-itertools-product",
    language: "python",
    title: "itertools.product for Cartesian product",
    tag: "snippet",
    code: `import itertools

# All combinations of two iterables:
pairs = list(itertools.product("AB", [1, 2, 3]))
print(pairs)
# [('A', 1), ('A', 2), ('A', 3), ('B', 1), ('B', 2), ('B', 3)]

# Equivalent to nested loops:
# for a in "AB":
#     for n in [1, 2, 3]:
#         pairs.append((a, n))

# Repeat for same iterable:
squares = list(itertools.product(range(3), repeat=2))
print(squares)  # [(0,0),(0,1),(0,2),(1,0),(1,1),(1,2),(2,0),(2,1),(2,2)]`,
    explanation: "`itertools.product(*iterables)` computes the Cartesian product lazily, equivalent to nested for-loops; `repeat=N` repeats the same iterable N times for combinatorial problems.",
  },
  {
    id: "py-b17-b3-itertools-combinations",
    language: "python",
    title: "itertools.combinations and combinations_with_replacement",
    tag: "snippet",
    code: `import itertools

# C(4, 2) — choose 2 from 4, no repetition, order doesn't matter:
combs = list(itertools.combinations([1, 2, 3, 4], 2))
print(combs)  # [(1,2),(1,3),(1,4),(2,3),(2,4),(3,4)]

# Permutations (order matters):
perms = list(itertools.permutations("ABC", 2))
print(perms)  # [('A','B'),('A','C'),('B','A'),('B','C'),('C','A'),('C','B')]

# With replacement (can repeat elements):
cr = list(itertools.combinations_with_replacement([1, 2], 3))
print(cr)  # [(1,1,1),(1,1,2),(1,2,2),(2,2,2)]`,
    explanation: "`combinations` generates ordered subsets without repetition; `permutations` includes all orderings; `combinations_with_replacement` allows repeating elements — all are lazy generators.",
  },
  {
    id: "py-b17-b3-functools-reduce",
    language: "python",
    title: "functools.reduce for left fold",
    tag: "snippet",
    code: `from functools import reduce
from operator import add, mul

# Sum with reduce (prefer sum() in practice):
total = reduce(add, [1, 2, 3, 4, 5])
print(total)   # 15

# Product (no built-in, reduce shines here):
product = reduce(mul, [1, 2, 3, 4, 5])
print(product) # 120

# With initial value:
result = reduce(lambda acc, x: acc + [x**2], range(5), [])
print(result)  # [0, 1, 4, 9, 16]`,
    explanation: "`functools.reduce(fn, iterable, initial)` applies `fn` cumulatively: `fn(fn(fn(initial, x1), x2), x3)...` — left fold; for sum/product Python has `sum()`/`math.prod()` which are more readable.",
  },
  {
    id: "py-b17-b3-re-findall",
    language: "python",
    title: "re.findall vs re.finditer",
    tag: "snippet",
    code: `import re

text = "prices: $12.99, $5.00, $199.99"

# findall: returns list of strings (or tuples if groups):
prices = re.findall(r"\\$([\\d.]+)", text)
print(prices)   # ['12.99', '5.00', '199.99']

# finditer: returns iterator of Match objects (lazy):
for m in re.finditer(r"\\$([\\d.]+)", text):
    print(m.group(1), "at", m.start())
# 12.99 at 9
# 5.00 at 17
# 199.99 at 24`,
    explanation: "`re.findall` returns all matches as strings (or tuples for groups) in a list; `re.finditer` returns a lazy iterator of match objects, giving access to positions and named groups without building all matches at once.",
  },
  {
    id: "py-b17-b3-str-format-mini-language",
    language: "python",
    title: "Format spec mini-language: type codes",
    tag: "snippet",
    code: `n = 255

print(f"{n:d}")    # 255     decimal integer
print(f"{n:b}")    # 11111111 binary
print(f"{n:o}")    # 377     octal
print(f"{n:x}")    # ff      hex lower
print(f"{n:X}")    # FF      hex upper
print(f"{n:#x}")   # 0xff    hex with prefix
print(f"{n:08b}")  # 00000000... 8-wide zero-padded binary

pi = 3.14159
print(f"{pi:e}")   # 3.141590e+00  scientific notation
print(f"{pi:g}")   # 3.14159       significant digits`,
    explanation: "The format spec type codes control numeric representation: `b/o/x/X` for bases, `e` for scientific notation, `g` for compact representation — all work identically in `f-strings`, `format()`, and `str.format()`.",
  },
  {
    id: "py-b17-b3-bytes-hex",
    language: "python",
    title: "bytes.hex() and bytes.fromhex()",
    tag: "snippet",
    code: `data = bytes([0x48, 0x65, 0x6C, 0x6C, 0x6F])  # 'Hello'

# bytes -> hex string
hex_str = data.hex()
print(hex_str)         # 48656c6c6f

# With separator (Python 3.8+):
print(data.hex(":"))   # 48:65:6c:6c:6f

# hex string -> bytes
back = bytes.fromhex("48656c6c6f")
print(back.decode())   # Hello`,
    explanation: "`bytes.hex()` converts raw bytes to a lowercase hex string (optionally with a separator); `bytes.fromhex()` reverses it — essential for displaying binary data and parsing hex-encoded protocols.",
  },
  {
    id: "py-b17-b3-dataclass-slots",
    language: "python",
    title: "dataclass(slots=True) auto-generates __slots__",
    tag: "snippet",
    code: `import sys
from dataclasses import dataclass

@dataclass
class Normal:
    x: int
    y: int

@dataclass(slots=True)
class Slotted:
    x: int
    y: int

a = Normal(1, 2)
b = Slotted(1, 2)

print(sys.getsizeof(a))  # ~48 bytes (has __dict__)
print(sys.getsizeof(b))  # ~32 bytes (no __dict__, slots used)
# b.z = 3  # AttributeError — no dynamic attributes`,
    explanation: "`@dataclass(slots=True)` (Python 3.10+) generates `__slots__` automatically, eliminating the per-instance `__dict__` and reducing memory usage — particularly useful when creating many instances.",
  },
  {
    id: "py-b17-b3-math-isclose",
    language: "python",
    title: "math.isclose for float comparison with tolerance",
    tag: "snippet",
    code: `import math

a = 0.1 + 0.2
b = 0.3

# Direct comparison fails:
print(a == b)             # False

# math.isclose: relative + absolute tolerance
print(math.isclose(a, b))                     # True
print(math.isclose(a, b, rel_tol=1e-9))       # True
print(math.isclose(1e-10, 0, abs_tol=1e-9))   # True (near zero)

# abs_tol matters for comparisons near 0:
print(math.isclose(0.0, 1e-100))   # False (only rel_tol applies)`,
    explanation: "`math.isclose(a, b, rel_tol=1e-9, abs_tol=0.0)` returns True if `|a-b| <= max(rel_tol * max(|a|, |b|), abs_tol)` — always use `abs_tol` when comparing values near zero where relative tolerance is meaningless.",
  },
  {
    id: "py-b17-b3-pprint",
    language: "python",
    title: "pprint for readable nested data structures",
    tag: "snippet",
    code: `import pprint

data = {
    "users": [
        {"id": 1, "name": "Alice", "roles": ["admin", "user"]},
        {"id": 2, "name": "Bob",   "roles": ["user"]},
    ],
    "count": 2,
}

# Regular print — hard to read:
print(data)

# pprint — nicely indented:
pprint.pprint(data, indent=2, width=60)

# pformat returns the string instead of printing:
formatted = pprint.pformat(data)`,
    explanation: "`pprint.pprint()` pretty-prints nested data structures with consistent indentation and line-wrapping, making complex dicts and lists readable in logs and debugging sessions.",
  },
  {
    id: "py-b17-b3-dataclasses-asdict",
    language: "python",
    title: "dataclasses.asdict for deep dict conversion",
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
print(d)
# {'start': {'x': 0, 'y': 0}, 'end': {'x': 3, 'y': 4}}

import json
print(json.dumps(d))   # trivially JSON-serializable

t = astuple(line)
print(t)   # ((0, 0), (3, 4))`,
    explanation: "`dataclasses.asdict()` recursively converts a dataclass (and any nested dataclasses) to a dict of primitives, making it trivial to serialize to JSON; `astuple()` does the same but to nested tuples.",
  },
  {
    id: "py-b17-b3-textwrap",
    language: "python",
    title: "textwrap for reflowing and indenting text",
    tag: "snippet",
    code: `import textwrap

long_text = "This is a very long sentence that needs to be wrapped to fit within a certain column width for display purposes."

wrapped = textwrap.fill(long_text, width=40)
print(wrapped)

# Dedent — remove common leading whitespace:
code = """
    def foo():
        return 42
"""
print(textwrap.dedent(code).strip())

# indent — add prefix to every line:
print(textwrap.indent("line1\\nline2", ">>> "))`,
    explanation: "`textwrap.fill` wraps a paragraph to a column width; `dedent` removes shared indentation (useful for docstrings and heredoc-style strings); `indent` adds a prefix to every line.",
  },
  {
    id: "py-b17-b3-random-choices",
    language: "python",
    title: "random.choices with weights",
    tag: "snippet",
    code: `import random

items = ["rock", "paper", "scissors"]
weights = [1, 2, 3]   # scissors is 3x more likely

# Sample WITH replacement, weighted:
sample = random.choices(items, weights=weights, k=10)
print(sample)

# Shuffling in-place:
deck = list(range(52))
random.shuffle(deck)

# Sampling WITHOUT replacement:
hand = random.sample(deck, k=5)
print(hand)`,
    explanation: "`random.choices` samples WITH replacement (can repeat) and supports non-uniform weights; `random.sample` samples WITHOUT replacement — both return a list of length `k`.",
  },
  // === understanding ===
  {
    id: "py-b17-b3-truthiness-rules",
    language: "python",
    title: "Python truthiness: what counts as False",
    tag: "understanding",
    code: `falsy = [
    None,
    False,
    0, 0.0, 0j, 0b0,  # numeric zeros
    "", b"", (),        # empty sequences
    [], {}, set(),      # empty containers
    range(0),           # empty range
]

for v in falsy:
    print(repr(v), "->", bool(v))   # all False

truthy_zero_like = [
    [0],    # non-empty list
    {0},    # non-empty set
    "0",    # non-empty string
]

for v in truthy_zero_like:
    print(repr(v), "->", bool(v))   # all True`,
    explanation: "In Python, an object is falsy if it is `None`, `False`, a numeric zero, or an empty container — non-empty containers are truthy regardless of their contents; user classes define truthiness via `__bool__` or `__len__`.",
  },
  {
    id: "py-b17-b3-dict-views",
    language: "python",
    title: "Dict views are live — they reflect mutations",
    tag: "understanding",
    code: `d = {"a": 1, "b": 2}

keys_view = d.keys()
vals_view = d.values()
items_view = d.items()

print(list(keys_view))   # ['a', 'b']

d["c"] = 3   # modify the dict

# Views reflect the change:
print(list(keys_view))   # ['a', 'b', 'c']
print(list(vals_view))   # [1, 2, 3]

# Views support set operations (keys and items only):
print({"a", "b"} & keys_view)   # {'a', 'b'}`,
    explanation: "Dict views (`keys()`, `values()`, `items()`) are dynamic objects linked to the live dict — mutations to the dict are immediately visible through the view, so use `list(d.keys())` to snapshot if you need a static copy.",
  },
  {
    id: "py-b17-b3-unpacking-assignment",
    language: "python",
    title: "Nested tuple unpacking in for loops",
    tag: "understanding",
    code: `points = [(1, 2), (3, 4), (5, 6)]

# Unpack each tuple in the loop variable:
for x, y in points:
    print(f"({x}, {y})")

# Nested unpacking:
data = [("Alice", (30, "NY")), ("Bob", (25, "LA"))]
for name, (age, city) in data:
    print(f"{name}: {age} in {city}")`,
    explanation: "Python supports nested unpacking in `for` loops — the loop variable can be a tuple pattern that mirrors the structure of each item, providing a clean way to destructure complex sequences.",
  },
  {
    id: "py-b17-b3-exception-hierarchy",
    language: "python",
    title: "Exception hierarchy: BaseException vs Exception",
    tag: "understanding",
    code: `# BaseException hierarchy (partial):
# BaseException
#   SystemExit
#   KeyboardInterrupt
#   GeneratorExit
#   Exception           <- catch here unless you need the others
#     ValueError
#     TypeError
#     OSError
#       FileNotFoundError
#     ...

try:
    raise KeyboardInterrupt()
except Exception:
    print("caught by Exception")  # NOT executed
except BaseException:
    print("caught by BaseException")  # executed
    raise  # re-raise so the program can exit`,
    explanation: "`Exception` is the base for all errors that programs are expected to catch; `KeyboardInterrupt`, `SystemExit`, and `GeneratorExit` derive from `BaseException` directly and should usually propagate to allow graceful shutdown.",
  },
  {
    id: "py-b17-b3-is-operator-none",
    language: "python",
    title: "Use 'is None', not '== None'",
    tag: "understanding",
    code: `x = None

# Correct: identity test (None is a singleton)
print(x is None)    # True
print(x is not None)  # False

# Potentially wrong: == can be overridden
class Weird:
    def __eq__(self, other): return True

w = Weird()
print(w == None)   # True — because __eq__ always returns True!
print(w is None)   # False — identity test, can't be overridden`,
    explanation: "`None` is a singleton — there is exactly one `None` object; `is None` tests identity and always works correctly; `== None` invokes `__eq__` which third-party classes can override to return misleading results.",
  },
  {
    id: "py-b17-b3-string-indexing-unicode",
    language: "python",
    title: "Python strings index by Unicode code points, not bytes",
    tag: "understanding",
    code: `emoji = "Hello 🐍"
print(len(emoji))        # 7  (Unicode code points)
print(emoji[-1])         # 🐍 (last code point)
print(emoji.encode("utf-8"))  # b'Hello \\xf0\\x9f\\x90\\x8d' (4 bytes for emoji)

# Slicing works on code points:
print(emoji[6:])   # 🐍

# For byte-level operations, use bytes:
raw = emoji.encode("utf-8")
print(len(raw))    # 10 bytes (5 ASCII + 4 emoji bytes + 1 space)`,
    explanation: "Python 3 strings are sequences of Unicode code points — `len()` and indexing count code points, not bytes; a single emoji is one code point but may encode to multiple UTF-8 bytes.",
  },
  {
    id: "py-b17-b3-list-sort-vs-sorted",
    language: "python",
    title: "list.sort() vs sorted(): in-place vs new list",
    tag: "understanding",
    code: `original = [3, 1, 4, 1, 5, 9]

# sorted(): returns a NEW list, original unchanged
new_list = sorted(original)
print(original)   # [3, 1, 4, 1, 5, 9]
print(new_list)   # [1, 1, 3, 4, 5, 9]

# list.sort(): modifies IN-PLACE, returns None
original.sort()
print(original)   # [1, 1, 3, 4, 5, 9]

# Common mistake:
wrong = original.sort()   # None! sort() returns None
print(wrong)   # None`,
    explanation: "`sorted(iterable)` creates a new sorted list and works on any iterable; `list.sort()` modifies the list in place and returns `None` — accidentally assigning the result of `sort()` is a common bug.",
  },
  {
    id: "py-b17-b3-generator-send",
    language: "python",
    title: "Generator .send() passes a value to the yield expression",
    tag: "understanding",
    code: `def accumulator():
    total = 0
    while True:
        value = yield total   # yield sends current total, receives next value
        if value is None:
            break
        total += value

gen = accumulator()
next(gen)         # prime the generator (advance to first yield)
print(gen.send(10))  # 10
print(gen.send(20))  # 30
print(gen.send(5))   # 35`,
    explanation: "`send(value)` resumes the generator and passes `value` as the result of the `yield` expression inside; the first call must use `next()` (or `send(None)`) to prime the generator to the first `yield`.",
  },
  {
    id: "py-b17-b3-async-context-manager",
    language: "python",
    title: "Async context managers with __aenter__ and __aexit__",
    tag: "understanding",
    code: `import asyncio

class AsyncDBConnection:
    async def __aenter__(self):
        print("connecting...")
        await asyncio.sleep(0.01)   # simulate async connect
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        print("disconnecting...")
        await asyncio.sleep(0.01)   # simulate async cleanup
        return False

async def main():
    async with AsyncDBConnection() as conn:
        print("using connection")

asyncio.run(main())
# connecting...
# using connection
# disconnecting...`,
    explanation: "`async with` calls `__aenter__` and `__aexit__` with `await`, enabling async setup and teardown — needed when opening connections, acquiring locks, or any async resource management.",
  },
  {
    id: "py-b17-b3-positional-only-params",
    language: "python",
    title: "Positional-only parameters with / in signature",
    tag: "understanding",
    code: `# Parameters before / are positional-only:
def add(x, y, /, *, verbose=False):
    if verbose:
        print(f"adding {x} + {y}")
    return x + y

print(add(1, 2))               # 3  — OK
print(add(1, 2, verbose=True)) # adding 1 + 2 \n 3 — OK
# add(x=1, y=2)  # TypeError — x and y are positional-only

# Real benefit: renaming x and y in a future version is non-breaking
# because callers can't use keyword syntax for them`,
    explanation: "Parameters before `/` in a function signature are positional-only — callers cannot pass them as keyword arguments, allowing you to rename them in future versions without breaking callers.",
  },
  {
    id: "py-b17-b3-abc-abstractproperty",
    language: "python",
    title: "Abstract class with both abstractmethod and property",
    tag: "understanding",
    code: `from abc import ABC, abstractmethod

class Temperature(ABC):
    @property
    @abstractmethod
    def celsius(self) -> float: ...

    @property
    def fahrenheit(self) -> float:    # concrete method using abstract property
        return self.celsius * 9 / 5 + 32

class Body(Temperature):
    def __init__(self, temp):
        self._temp = temp

    @property
    def celsius(self) -> float:
        return self._temp

b = Body(37)
print(b.fahrenheit)   # 98.6`,
    explanation: "A concrete method in an abstract class can call abstract properties — the concrete method runs against whatever the concrete subclass provides, enabling the Template Method pattern with properties.",
  },
  {
    id: "py-b17-b3-type-checking-at-import",
    language: "python",
    title: "TYPE_CHECKING flag for import-time-only annotations",
    tag: "understanding",
    code: `from __future__ import annotations
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    # These imports are NOT executed at runtime — only for type checkers:
    from collections.abc import Sequence
    from pathlib import Path

def process(items: Sequence[int], output: Path) -> None:
    # At runtime, Sequence and Path are not imported — no circular import!
    print(items, output)`,
    explanation: "`TYPE_CHECKING` is `False` at runtime but `True` when a type checker is analyzing the code; imports guarded by it avoid circular imports and reduce startup cost for heavyweight annotations-only imports.",
  },
  {
    id: "py-b17-b3-list-comprehension-multiple-for",
    language: "python",
    title: "List comprehension with multiple for clauses",
    tag: "understanding",
    code: `# Equivalent to nested for loops:
pairs = [(x, y) for x in range(3) for y in range(3) if x != y]
print(pairs)
# [(0,1),(0,2),(1,0),(1,2),(2,0),(2,1)]

# Order matters: leftmost 'for' is the outer loop
matrix = [[1,2,3],[4,5,6],[7,8,9]]
flat = [n for row in matrix for n in row]
print(flat)   # [1, 2, 3, 4, 5, 6, 7, 8, 9]`,
    explanation: "Multiple `for` clauses in a comprehension are equivalent to nested for loops in the same order — earlier `for` clauses are outer loops; `if` filters apply to the most recent `for`.",
  },
  // === structures ===
  {
    id: "py-b17-b3-sortedcontainers",
    language: "python",
    title: "sortedcontainers.SortedList for O(log n) sorted ops",
    tag: "structures",
    code: `# pip install sortedcontainers
from sortedcontainers import SortedList

sl = SortedList([5, 1, 3, 2, 4])
sl.add(0)
sl.add(6)

print(sl)            # SortedList([0, 1, 2, 3, 4, 5, 6])
print(sl[0], sl[-1]) # 0 6

# O(log n) search:
print(sl.index(3))   # 3
print(sl.count(3))   # 1

sl.discard(3)
print(sl)            # SortedList([0, 1, 2, 4, 5, 6])`,
    explanation: "`SortedList` from the `sortedcontainers` package maintains a sorted list with O(log n) add/remove and O(1) index access — a pure-Python alternative to a balanced BST for sorted sequence operations.",
  },
  {
    id: "py-b17-b3-lru-cache-method",
    language: "python",
    title: "caching instance method results with functools.cache",
    tag: "structures",
    code: `from functools import cache

class GridSolver:
    def __init__(self, grid):
        self.grid = grid

    @cache
    def min_path(self, row, col):
        if row == 0 and col == 0:
            return self.grid[0][0]
        candidates = []
        if row > 0: candidates.append(self.min_path(row-1, col))
        if col > 0: candidates.append(self.min_path(row, col-1))
        return self.grid[row][col] + min(candidates)

g = GridSolver([[1,3,1],[1,5,1],[4,2,1]])
print(g.min_path(2, 2))   # 7`,
    explanation: "`functools.cache` (Python 3.9+) is `lru_cache(maxsize=None)` — unbounded memoization; when used on instance methods, note that `self` is part of the key, so the cache is shared across all calls to the same instance.",
  },
  {
    id: "py-b17-b3-enum-int",
    language: "python",
    title: "IntEnum for enums that are also ints",
    tag: "structures",
    code: `from enum import IntEnum

class Color(IntEnum):
    RED   = 1
    GREEN = 2
    BLUE  = 3

# IntEnum compares equal to plain ints:
print(Color.RED == 1)    # True
print(Color.RED < Color.BLUE)  # True

# Can be used where int is expected:
bits = Color.RED | Color.BLUE   # bitwise OR
print(bits)  # 3  (int, not enum)

# Regular Enum does NOT compare equal to int:
from enum import Enum
class Direction(Enum):
    NORTH = 1
print(Direction.NORTH == 1)  # False`,
    explanation: "`IntEnum` subclasses both `Enum` and `int`, so members are actual integer values — they compare equal to plain ints and can be used anywhere an int is expected; regular `Enum` members don't have this behaviour.",
  },
  {
    id: "py-b17-b3-struct-dataclass",
    language: "python",
    title: "dataclass(frozen=True) for immutable records",
    tag: "structures",
    code: `from dataclasses import dataclass

@dataclass(frozen=True)
class Point:
    x: float
    y: float

p = Point(1.0, 2.0)
# p.x = 3.0   # FrozenInstanceError: cannot assign to field 'x'

# frozen=True enables hashing:
s = {p, Point(1.0, 2.0)}
print(len(s))   # 1 — deduped

d = {p: "origin nearby"}
print(d[Point(1.0, 2.0)])   # origin nearby`,
    explanation: "`@dataclass(frozen=True)` makes instances immutable (attributes cannot be changed after construction) and automatically generates a hash based on all fields, making instances usable as dict keys or set elements.",
  },
  {
    id: "py-b17-b3-deque-thread-safe",
    language: "python",
    title: "deque operations are thread-safe in CPython",
    tag: "structures",
    code: `from collections import deque
import threading

shared = deque()
results = []

def producer(n):
    for i in range(n):
        shared.append(i)   # thread-safe in CPython

def consumer(n):
    for _ in range(n):
        try:
            val = shared.popleft()  # thread-safe
            results.append(val)
        except IndexError:
            pass   # empty — spin

threads = [threading.Thread(target=producer, args=(100,)),
           threading.Thread(target=consumer, args=(100,))]
for t in threads: t.start()
for t in threads: t.join()`,
    explanation: "In CPython, individual `deque.append` and `deque.popleft` operations are thread-safe because they're atomic at the C level (protected by the GIL) — but compound operations (check-then-act) still require explicit locks.",
  },
  {
    id: "py-b17-b3-typeddict-inheritance",
    language: "python",
    title: "TypedDict inheritance for extending schemas",
    tag: "structures",
    code: `from typing import TypedDict

class BaseItem(TypedDict):
    id: int
    name: str

class Product(BaseItem):
    price: float
    in_stock: bool

# Product requires all 4 keys:
p: Product = {"id": 1, "name": "Widget", "price": 9.99, "in_stock": True}
print(p)`,
    explanation: "TypedDict supports inheritance — a child TypedDict includes all keys from its parent plus its own additional keys, building up schemas compositionally.",
  },
  {
    id: "py-b17-b3-named-expression-assignment",
    language: "python",
    title: "Walrus in comprehension filter clause",
    tag: "structures",
    code: `import re

lines = [
    "2024-01-15: login",
    "bad line",
    "2024-02-20: logout",
    "another bad",
]

pattern = re.compile(r"(\\d{4}-\\d{2}-\\d{2}): (.*)")

# Match and keep only matching lines, capturing the groups:
events = [
    (m.group(1), m.group(2))
    for line in lines
    if (m := pattern.match(line))   # walrus in filter
]
print(events)
# [('2024-01-15', 'login'), ('2024-02-20', 'logout')]`,
    explanation: "Using `:=` in the `if` clause of a comprehension assigns the match object to `m` and uses it in the body expression — avoiding the overhead of re-matching in both the filter and the projection.",
  },
  {
    id: "py-b17-b3-contextmanager-generator",
    language: "python",
    title: "contextlib.asynccontextmanager for async context managers",
    tag: "structures",
    code: `from contextlib import asynccontextmanager
import asyncio

@asynccontextmanager
async def async_timer(label: str):
    import time
    start = time.perf_counter()
    try:
        yield
    finally:
        elapsed = time.perf_counter() - start
        print(f"{label}: {elapsed:.4f}s")

async def main():
    async with async_timer("network call"):
        await asyncio.sleep(0.05)

asyncio.run(main())   # network call: 0.0502s`,
    explanation: "`@asynccontextmanager` works like `@contextmanager` but for `async with` blocks — the single `yield` separates setup (before) from teardown (after), and both can contain `await` expressions.",
  },
  // === caveats ===
  {
    id: "py-b17-b3-integer-caching-256",
    language: "python",
    title: "CPython caches -5 to 256 — don't rely on it",
    tag: "caveats",
    code: `# The cache range is an implementation detail of CPython:
# In PyPy or other interpreters it may differ!

a = 256; b = 256; print(a is b)   # True in CPython

# Even inside CPython: constants in same code object may be shared:
x = 1000
y = 1000
print(x is y)   # True in interactive mode (same code object)
                  # False if from separate eval() calls!

# Safe rule: NEVER use 'is' to compare integers
# Always use ==`,
    explanation: "Integer identity caching is a CPython implementation detail — the range (-5 to 256), the interning of compile-time constants, and the behavior of `is` for larger integers can all differ between Python implementations and versions.",
  },
  {
    id: "py-b17-b3-shadowing-builtin",
    language: "python",
    title: "Shadowing built-in names causes subtle bugs",
    tag: "caveats",
    code: `# Accidentally shadow built-ins:
list = [1, 2, 3]           # shadows the built-in 'list'
# list([1,2])              # TypeError: 'list' object is not callable

# Common offenders:
# id, type, list, dict, set, tuple, input, print, filter, map, open, len

# Fix: rename your variable
my_list = [1, 2, 3]

# Detect in linters (pylint: W0622 redefined-builtin)
# or use __builtins__:
import builtins
print(dir(builtins))   # all built-in names`,
    explanation: "Assigning to a name like `list`, `id`, or `input` shadows the built-in in that scope — subsequent calls to `list(...)` will fail with confusing errors; linters flag these as W0622 or similar.",
  },
  {
    id: "py-b17-b3-recursion-limit",
    language: "python",
    title: "Python's default recursion limit is 1000",
    tag: "caveats",
    code: `import sys

print(sys.getrecursionlimit())   # 1000

def deep(n):
    if n == 0: return 0
    return deep(n - 1)

try:
    deep(2000)
except RecursionError as e:
    print(e)   # maximum recursion depth exceeded

# Increase limit (use with care):
sys.setrecursionlimit(5000)

# Better: use iterative approach or functools.lru_cache + memoization`,
    explanation: "Python raises `RecursionError` after 1000 frames by default to protect against stack overflow; `sys.setrecursionlimit` can raise it, but the real solution is an iterative algorithm or memoized DP for deep recursion.",
  },
  {
    id: "py-b17-b3-pickle-security",
    language: "python",
    title: "Never unpickle untrusted data",
    tag: "caveats",
    code: `import pickle, os

# Malicious pickle that executes arbitrary code:
class Exploit:
    def __reduce__(self):
        return (os.system, ("echo pwned",))

malicious = pickle.dumps(Exploit())

# DO NOT do this with data from untrusted sources:
# pickle.loads(malicious)   # executes os.system("echo pwned")!

# Safe alternatives for untrusted data:
import json
data = json.loads('{"key": "value"}')   # JSON is safe to parse`,
    explanation: "`pickle.loads` deserializes arbitrary Python objects and can execute arbitrary code during deserialization — never unpickle data received from untrusted sources; use JSON, MessagePack, or Protocol Buffers for cross-boundary serialization.",
  },
  {
    id: "py-b17-b3-int-str-conversion",
    language: "python",
    title: "Large int to str conversion is O(n²) in older Python",
    tag: "caveats",
    code: `import sys

# Python 3.11+ added a limit to protect against O(n²) conversion:
# (set on large integers to prevent DoS)

# Check the limit:
limit = sys.get_int_max_str_digits()
print(limit)   # 4300 by default in Python 3.11+

# Disable (on trusted input only!):
sys.set_int_max_str_digits(0)   # no limit
big = 2 ** 100_000
s = str(big)   # now works, but may be slow!
sys.set_int_max_str_digits(4300)   # restore`,
    explanation: "Python 3.11 added a default limit of 4300 digits for `str(int)` and `int(str)` to prevent denial-of-service attacks from O(n²) conversion of very large integers — raise it only for trusted inputs.",
  },
  {
    id: "py-b17-b3-late-binding-closures-loop",
    language: "python",
    title: "Late binding applies to comprehensions too",
    tag: "caveats",
    code: `# Functions defined in a loop share the loop variable:
funcs = [lambda: i for i in range(3)]
print([f() for f in funcs])   # [2, 2, 2]  ← all see final i=2

# Generator expressions don't have this problem for their own variable:
gens = list(i for i in range(3))  # values captured at iteration time
print(gens)   # [0, 1, 2]

# Fix for lambdas — default argument captures value:
funcs2 = [lambda i=i: i for i in range(3)]
print([f() for f in funcs2])   # [0, 1, 2]`,
    explanation: "Lambdas inside list comprehensions share the same late-binding gotcha as lambdas in regular for loops — the variable `i` is one name for all three lambdas; generator expressions evaluate each value immediately.",
  },
  {
    id: "py-b17-b3-open-encoding",
    language: "python",
    title: "open() encoding defaults to the platform locale",
    tag: "caveats",
    code: `import sys, locale

# Default encoding varies by platform:
print(sys.getdefaultencoding())          # utf-8 (Python's internal)
print(locale.getpreferredencoding())     # may be UTF-8 or cp1252 on Windows!

# open() uses locale.getpreferredencoding() by default:
with open("/etc/hostname") as f:         # may fail on non-UTF-8 files!
    print(f.read())

# Always specify encoding explicitly:
with open("/etc/hostname", encoding="utf-8") as f:
    print(f.read())`,
    explanation: "On Windows, `open()` may default to cp1252 or another locale encoding rather than UTF-8 — explicitly pass `encoding='utf-8'` (or another known codec) to avoid silent data corruption when reading text files.",
  },
  // === types ===
  {
    id: "py-b17-b3-newtype",
    language: "python",
    title: "NewType creates distinct types for validation",
    tag: "types",
    code: `from typing import NewType

UserId = NewType("UserId", int)
OrderId = NewType("OrderId", int)

def get_user(uid: UserId) -> None:
    print(f"getting user {uid}")

uid   = UserId(42)
order = OrderId(99)

get_user(uid)      # OK
# get_user(order)  # type error — OrderId is not UserId
# get_user(42)     # type error — plain int is not UserId

# At runtime, NewType is just an identity function:
print(type(uid))   # <class 'int'>`,
    explanation: "`NewType(name, base)` creates a type alias that type checkers treat as a distinct type, preventing accidental mixing of semantically different IDs — at runtime the new type is the same underlying type with no performance overhead.",
  },
  {
    id: "py-b17-b3-overload-return-types",
    language: "python",
    title: "Overloaded signatures with different return types",
    tag: "types",
    code: `from typing import overload, Union

@overload
def parse(s: str) -> int: ...
@overload
def parse(s: bytes) -> str: ...

def parse(s: Union[str, bytes]) -> Union[int, str]:
    if isinstance(s, bytes):
        return s.decode("utf-8")
    return int(s)

result_int: int = parse("42")      # type checker knows it's int
result_str: str = parse(b"hello")  # type checker knows it's str
print(result_int, result_str)       # 42 hello`,
    explanation: "Multiple `@overload` signatures let type checkers map specific argument types to specific return types, providing accurate inference even when the runtime implementation uses a union type.",
  },
  {
    id: "py-b17-b3-pep604-union-isinstance",
    language: "python",
    title: "X | Y union works in isinstance() at runtime (3.10+)",
    tag: "types",
    code: `# Python 3.10+ — the | operator works at runtime in isinstance():
def handle(value: int | str | None) -> str:
    if isinstance(value, int | str):   # same as isinstance(value, (int, str))
        return str(value)
    return "null"

print(handle(42))        # 42
print(handle("hello"))   # hello
print(handle(None))      # null

# The union type also works in issubclass:
print(issubclass(bool, int | str))   # True`,
    explanation: "In Python 3.10+, `int | str` creates a `types.UnionType` at runtime (not just a typing annotation), so `isinstance(x, int | str)` works as a shorthand for `isinstance(x, (int, str))`.",
  },
  {
    id: "py-b17-b3-dataclass-field-metadata",
    language: "python",
    title: "dataclass field metadata for external validation",
    tag: "types",
    code: `from dataclasses import dataclass, field, fields

@dataclass
class Schema:
    name: str = field(metadata={"max_length": 100, "required": True})
    age: int  = field(metadata={"min": 0, "max": 150})

# Access metadata at runtime:
for f in fields(Schema):
    print(f.name, f.metadata)

# Validation libraries (Pydantic, attrs, marshmallow) use this pattern
# to attach constraints to fields without changing the class API.`,
    explanation: "`field(metadata=dict)` stores arbitrary metadata alongside a field's name and type — it has no effect on dataclass behaviour itself but lets validation frameworks read constraints without requiring inheritance.",
  },
  {
    id: "py-b17-b3-typing-cast",
    language: "python",
    title: "typing.cast tells the type checker a lie (safely)",
    tag: "types",
    code: `from typing import cast

def get_config() -> object:
    return {"debug": True, "port": 8080}

# We know the runtime type but the annotation says object:
cfg = get_config()

# cast: zero runtime cost — only a type-checker directive
typed_cfg = cast(dict[str, object], cfg)
port = typed_cfg["port"]
print(port)   # 8080

# Use sparingly — it bypasses type checking for typed_cfg`,
    explanation: "`typing.cast(T, x)` is a no-op at runtime but tells the type checker to treat `x` as type `T`; use it only when you have information the type checker can't infer, and prefer `isinstance` guards when possible.",
  },
  {
    id: "py-b17-b3-protocol-vs-abc-runtime",
    language: "python",
    title: "Protocol isinstance check only tests method existence",
    tag: "types",
    code: `from typing import Protocol, runtime_checkable

@runtime_checkable
class Drawable(Protocol):
    def draw(self, x: int, y: int) -> None: ...

class Widget:
    def draw(self, x, y):   # no type annotations needed
        print(f"draw at {x},{y}")

class Broken:
    def draw(self):   # wrong signature — Protocol doesn't check this!
        pass

print(isinstance(Widget(), Drawable))   # True
print(isinstance(Broken(), Drawable))   # True  ← signatures NOT checked!`,
    explanation: "`@runtime_checkable` Protocol's `isinstance` check only verifies that the required method *names* exist — it doesn't verify parameter counts or types; full signature validation only happens at type-check time, not runtime.",
  },
  {
    id: "py-b17-b3-enum-str",
    language: "python",
    title: "StrEnum for string-valued enums (Python 3.11+)",
    tag: "types",
    code: `from enum import StrEnum

class Status(StrEnum):
    PENDING  = "pending"
    ACTIVE   = "active"
    INACTIVE = "inactive"

# StrEnum compares equal to plain strings:
print(Status.ACTIVE == "active")  # True
print(f"status: {Status.PENDING}")  # status: pending  (no .value needed)

# Can be used where str is expected:
import json
d = {"status": Status.ACTIVE}
print(json.dumps(d))   # {"status": "active"}`,
    explanation: "`StrEnum` (Python 3.11+) makes enum members actual strings — they compare equal to their string values and serialize naturally to JSON without calling `.value`, making API status codes and field names easy to define.",
  },
  {
    id: "py-b17-b3-generic-alias",
    language: "python",
    title: "Built-in generics: list[int] vs List[int]",
    tag: "types",
    code: `# Python 3.9+: use built-in generics directly
from __future__ import annotations   # or use Python 3.10+

def process(items: list[int]) -> dict[str, list[int]]:
    return {"doubled": [x * 2 for x in items]}

# Before Python 3.9, you needed:
# from typing import List, Dict
# def process(items: List[int]) -> Dict[str, List[int]]: ...

# At runtime (3.9+), list[int] creates a GenericAlias:
alias = list[int]
print(alias)             # list[int]
print(isinstance([1,2], alias))  # True`,
    explanation: "Python 3.9+ lets you use built-in types like `list[int]` and `dict[str, int]` directly in annotations and at runtime — `from __future__ import annotations` back-ports this to 3.7+ by making all annotations strings.",
  },
  {
    id: "py-b17-b3-typed-dict-required",
    language: "python",
    title: "TypedDict with Required and NotRequired keys",
    tag: "types",
    code: `from typing import TypedDict, Required, NotRequired

class Config(TypedDict, total=False):   # all optional by default
    host: Required[str]    # but this one is required
    port: NotRequired[int]
    debug: bool

# valid:
c1: Config = {"host": "localhost"}
c2: Config = {"host": "db", "port": 5432, "debug": True}

# Type error (host missing):
# c3: Config = {"port": 8080}`,
    explanation: "`total=False` makes all keys optional by default; `Required[T]` overrides that to make a specific key mandatory; `NotRequired[T]` is the opposite, making a specific key optional in a `total=True` TypedDict.",
  },
  {
    id: "py-b17-b3-literals-enum",
    language: "python",
    title: "Literal type vs Enum: which to use when",
    tag: "types",
    code: `from typing import Literal
from enum import Enum

# Literal: simple; values are the type; no iteration
Direction = Literal["north", "south", "east", "west"]

def move(d: Direction) -> None:
    print(d)

move("north")  # OK

# Enum: richer; can iterate; has .name / .value
class Color(Enum):
    RED = "red"
    BLUE = "blue"

for c in Color:
    print(c.name, c.value)`,
    explanation: "Use `Literal` when you have a fixed set of string/int values and only need type checking; use `Enum` when you need iteration, `.name`/`.value` access, or want the type safety of a distinct enum type rather than raw strings.",
  },
  // === families ===
  {
    id: "py-b17-b3-abc-abstractclassmethod",
    language: "python",
    title: "Abstract classmethod and staticmethod",
    tag: "families",
    code: `from abc import ABC, abstractmethod

class Serializer(ABC):
    @classmethod
    @abstractmethod
    def from_string(cls, s: str) -> "Serializer": ...

    @staticmethod
    @abstractmethod
    def mime_type() -> str: ...

class JsonSerializer(Serializer):
    @classmethod
    def from_string(cls, s: str) -> "JsonSerializer":
        import json; return cls()

    @staticmethod
    def mime_type() -> str:
        return "application/json"

j = JsonSerializer.from_string("{}")
print(JsonSerializer.mime_type())  # application/json`,
    explanation: "Combine `@classmethod`/`@staticmethod` with `@abstractmethod` to enforce that subclasses implement these class-level methods; note the decorator order: `@classmethod` must come before `@abstractmethod`.",
  },
  {
    id: "py-b17-b3-contextlib-contextdecorator",
    language: "python",
    title: "contextlib.ContextDecorator makes a CM usable as a decorator",
    tag: "families",
    code: `from contextlib import contextmanager, ContextDecorator

class timer(ContextDecorator):
    def __enter__(self):
        import time
        self._start = time.perf_counter()
        return self

    def __exit__(self, *args):
        import time
        print(f"elapsed: {time.perf_counter() - self._start:.4f}s")
        return False

# Use as a context manager:
with timer():
    sum(range(1_000_000))

# OR use as a decorator:
@timer()
def heavy():
    sum(range(1_000_000))

heavy()`,
    explanation: "`ContextDecorator` is a mixin that lets a context manager class also work as a function decorator — the `__enter__`/`__exit__` wraps the decorated function's body without requiring separate logic.",
  },
  {
    id: "py-b17-b3-generator-pipeline",
    language: "python",
    title: "Generator pipeline for memory-efficient data processing",
    tag: "families",
    code: `def read_lines(filename):
    with open(filename) as f:
        yield from f

def parse_ints(lines):
    for line in lines:
        stripped = line.strip()
        if stripped.isdigit():
            yield int(stripped)

def evens(numbers):
    for n in numbers:
        if n % 2 == 0:
            yield n

# Compose into a pipeline — nothing is stored in memory:
# pipeline = evens(parse_ints(read_lines("data.txt")))
# total = sum(pipeline)

# For demonstration with a list:
lines_mock = iter(["1\\n", "2\\n", "abc\\n", "4\\n"])
result = list(evens(parse_ints(lines_mock)))
print(result)   # [2, 4]`,
    explanation: "Chaining generators creates a processing pipeline where each stage is lazy — only the current item passes through each stage at a time, keeping memory usage constant regardless of file size.",
  },
  {
    id: "py-b17-b3-typing-namedtuple-vs-attrs",
    language: "python",
    title: "NamedTuple vs dataclass vs attrs comparison",
    tag: "families",
    code: `from typing import NamedTuple
from dataclasses import dataclass

# NamedTuple: immutable, tuple-compatible, simple
class PointNT(NamedTuple):
    x: float; y: float

# dataclass: mutable by default, full OOP, rich ecosystem
@dataclass
class PointDC:
    x: float; y: float

# NamedTuple supports tuple operations, dataclass doesn't:
p = PointNT(1, 2)
print(len(p))          # 2
print(p[0])            # 1
print(x for x in p)   # iterable

# dataclass supports post_init, field(), etc.
@dataclass
class Circle:
    radius: float
    def area(self): return 3.14 * self.radius**2`,
    explanation: "Use `NamedTuple` when you need tuple compatibility (immutability, unpacking, positional indexing); use `dataclass` for mutable objects, complex validation, or when you need `field()` defaults and `__post_init__` — both are more explicit than `dict`.",
  },
  {
    id: "py-b17-b3-pathlib-read-write",
    language: "python",
    title: "pathlib.Path read_text and write_text shortcuts",
    tag: "families",
    code: `from pathlib import Path
import json

p = Path("/tmp/example.json")

# Write — creates or overwrites:
data = {"hello": "world", "count": 42}
p.write_text(json.dumps(data, indent=2), encoding="utf-8")

# Read back:
loaded = json.loads(p.read_text(encoding="utf-8"))
print(loaded)   # {'hello': 'world', 'count': 42}

# Binary variants:
p.write_bytes(b"\\x00\\x01\\x02")
raw = p.read_bytes()

# Clean up:
p.unlink(missing_ok=True)`,
    explanation: "`Path.read_text()` and `Path.write_text()` are convenient one-liners for reading and writing entire files without a `with open(...)` block; always specify `encoding` explicitly to avoid platform-dependent behaviour.",
  },
  {
    id: "py-b17-b3-concurrent-futures-error",
    language: "python",
    title: "concurrent.futures: error handling per future",
    tag: "families",
    code: `from concurrent.futures import ThreadPoolExecutor

def risky(n):
    if n == 3:
        raise ValueError(f"bad value: {n}")
    return n * 10

with ThreadPoolExecutor(max_workers=3) as ex:
    futures = {ex.submit(risky, i): i for i in range(6)}
    for f, i in futures.items():
        try:
            print(f"result[{i}] =", f.result())
        except ValueError as e:
            print(f"error[{i}]:", e)`,
    explanation: "`future.result()` re-raises any exception that occurred in the worker thread — catching it per future lets you handle individual failures gracefully rather than abandoning all work when one fails.",
  },
  {
    id: "py-b17-b3-aiohttpclient",
    language: "python",
    title: "asyncio.gather for concurrent async tasks",
    tag: "families",
    code: `import asyncio

async def fetch(url_id: int) -> str:
    await asyncio.sleep(0.05)   # simulate network delay
    return f"data from {url_id}"

async def main():
    # Run 5 tasks concurrently:
    results = await asyncio.gather(
        fetch(1), fetch(2), fetch(3), fetch(4), fetch(5)
    )
    print(results)
    # ['data from 1', 'data from 2', ...]

    # Ignore individual errors with return_exceptions=True:
    results2 = await asyncio.gather(fetch(1), asyncio.sleep(99/0), return_exceptions=True)

asyncio.run(main())`,
    explanation: "`asyncio.gather(*coros)` runs coroutines concurrently on the event loop and returns their results in order; `return_exceptions=True` prevents one failure from cancelling the rest.",
  },
  // === classes ===
  {
    id: "py-b17-b3-dunder-format-class",
    language: "python",
    title: "__format__ and format() on custom classes",
    tag: "classes",
    code: `class Color:
    def __init__(self, r, g, b):
        self.r, self.g, self.b = r, g, b

    def __format__(self, spec):
        if spec == "hex":
            return f"#{self.r:02x}{self.g:02x}{self.b:02x}"
        if spec == "rgb":
            return f"rgb({self.r},{self.g},{self.b})"
        return f"Color({self.r},{self.g},{self.b})"

red = Color(255, 0, 0)
print(f"{red}")        # Color(255,0,0)
print(f"{red:hex}")    # #ff0000
print(f"{red:rgb}")    # rgb(255,0,0)`,
    explanation: "`__format__(self, spec)` gives a class full control over its representation in f-strings and `format()` calls — the spec string is everything after the `:`, enabling mini-DSLs for domain objects.",
  },
  {
    id: "py-b17-b3-dunder-or",
    language: "python",
    title: "__or__ and __ror__ for custom | operator",
    tag: "classes",
    code: `class Pipeline:
    def __init__(self, fn):
        self.fn = fn

    def __call__(self, x):
        return self.fn(x)

    def __or__(self, other):
        """Compose two pipeline stages: self | other = other(self(x))"""
        return Pipeline(lambda x: other(self(x)))

double = Pipeline(lambda x: x * 2)
inc    = Pipeline(lambda x: x + 1)
square = Pipeline(lambda x: x ** 2)

pipeline = double | inc | square
print(pipeline(3))   # ((3*2)+1)^2 = 49`,
    explanation: "`__or__(self, other)` is called for `self | other`; `__ror__(self, other)` is called when the left operand doesn't handle `|` — together they enable operator overloading for composable pipelines, option types, and union-like structures.",
  },
  {
    id: "py-b17-b3-dunder-class-getitem-generic",
    language: "python",
    title: "__class_getitem__ for runtime parameterized types",
    tag: "classes",
    code: `class Wrapper:
    def __init__(self, value):
        self.value = value

    def __class_getitem__(cls, type_arg):
        # Returns a specialized class with the type embedded:
        class TypedWrapper(cls):
            _type = type_arg
            def __init__(self, value):
                if not isinstance(value, type_arg):
                    raise TypeError(f"Expected {type_arg.__name__}")
                super().__init__(value)
        TypedWrapper.__name__ = f"Wrapper[{type_arg.__name__}]"
        return TypedWrapper

IntWrapper = Wrapper[int]
w = IntWrapper(42)
# IntWrapper("bad")  # TypeError: Expected int`,
    explanation: "`__class_getitem__` intercepts `Cls[type]` subscript syntax and can return anything — including a new class configured for that type, enabling runtime-generic type validation without metaclasses.",
  },
  {
    id: "py-b17-b3-dataclass-field-repr",
    language: "python",
    title: "dataclass field(repr=False) excludes fields from __repr__",
    tag: "classes",
    code: `from dataclasses import dataclass, field

@dataclass
class User:
    username: str
    email: str
    password: str = field(repr=False)   # exclude from repr
    token: str = field(repr=False, compare=False, hash=False)

u = User("alice", "alice@example.com", "s3cr3t", "tok_abc")
print(u)   # User(username='alice', email='alice@example.com')
           # password NOT shown

print(u == User("alice", "alice@example.com", "s3cr3t", "tok_xyz"))
# True — token excluded from comparison (compare=False)`,
    explanation: "`field(repr=False)` hides a field from `__repr__` (useful for passwords/tokens); `compare=False` excludes it from `__eq__`; `hash=False` excludes it from `__hash__` — each attribute of `field()` controls a different generated method.",
  },
  {
    id: "py-b17-b3-slots-inheritance",
    language: "python",
    title: "__slots__ and inheritance: avoiding the dict gap",
    tag: "classes",
    code: `class Base:
    __slots__ = ("x",)
    def __init__(self, x): self.x = x

class Child(Base):
    __slots__ = ("y",)   # only adds y; inherits x from Base
    def __init__(self, x, y):
        super().__init__(x)
        self.y = y

c = Child(1, 2)
print(c.x, c.y)   # 1 2

# If Child doesn't define __slots__, it gets a __dict__ anyway:
class Leaky(Base):
    pass   # no __slots__

l = Leaky(1)
l.z = 99   # works — Leaky has __dict__ despite Base having __slots__`,
    explanation: "For `__slots__` to work through an inheritance chain, every class in the chain must define `__slots__`; if any class omits it, Python adds a `__dict__` to that class, negating the memory savings.",
  },
  {
    id: "py-b17-b3-abc-hook",
    language: "python",
    title: "Template Method pattern with ABC hooks",
    tag: "classes",
    code: `from abc import ABC, abstractmethod

class DataProcessor(ABC):
    def process(self, data):           # template method
        clean = self.clean(data)       # hook 1
        result = self.transform(clean) # hook 2
        self.save(result)              # hook 3

    @abstractmethod
    def clean(self, data): ...
    @abstractmethod
    def transform(self, data): ...

    def save(self, result):            # default hook — can override
        print("saved:", result)

class CSVProcessor(DataProcessor):
    def clean(self, data): return [r.strip() for r in data]
    def transform(self, data): return ",".join(data)

CSVProcessor().process(["  hello  ", "  world  "])`,
    explanation: "The Template Method pattern defines the algorithm skeleton in a base class method, with abstract 'hook' methods that subclasses fill in — the base class controls the sequence, subclasses control the steps.",
  },
  {
    id: "py-b17-b3-callable-class-vs-closure",
    language: "python",
    title: "Callable class vs closure: inspectability trade-off",
    tag: "classes",
    code: `# Closure: compact but hidden state
def make_adder(n):
    def adder(x): return x + n
    return adder

add5 = make_adder(5)
print(add5(3))   # 8
# Can't easily inspect n after creation

# Callable class: inspectable and testable state
class Adder:
    def __init__(self, n): self.n = n
    def __call__(self, x): return x + self.n
    def __repr__(self): return f"Adder({self.n})"

add5c = Adder(5)
print(add5c(3))     # 8
print(add5c.n)      # 5  — inspectable
print(repr(add5c))  # Adder(5)`,
    explanation: "Both closures and callable classes encapsulate state, but callable classes expose their state as attributes — making them inspectable, picklable, and easier to test when the captured configuration matters.",
  },
  {
    id: "py-b17-b3-metaclass-registry",
    language: "python",
    title: "Metaclass for automatic subclass registration",
    tag: "classes",
    code: `class PluginMeta(type):
    registry: dict = {}
    def __new__(mcs, name, bases, namespace):
        cls = super().__new__(mcs, name, bases, namespace)
        if bases:   # don't register the base Plugin class itself
            mcs.registry[name] = cls
        return cls

class Plugin(metaclass=PluginMeta):
    def run(self): ...

class AudioPlugin(Plugin):
    def run(self): print("audio")

class VideoPlugin(Plugin):
    def run(self): print("video")

print(PluginMeta.registry)
# {'AudioPlugin': <class 'AudioPlugin'>, 'VideoPlugin': <class 'VideoPlugin'>}`,
    explanation: "A metaclass's `__new__` is called every time a class is created — intercepting it lets you auto-register every subclass in a dict, enabling plugin discovery without explicit registration calls.",
  },
  {
    id: "py-b17-b3-dunder-index",
    language: "python",
    title: "__index__ enables use as a sequence index",
    tag: "classes",
    code: `class IntLike:
    def __init__(self, value: int):
        self._v = value

    def __index__(self) -> int:    # required for indexing and bin/oct/hex
        return self._v

    def __int__(self) -> int:
        return self._v

il = IntLike(2)
data = [10, 20, 30, 40, 50]

print(data[il])       # 30  — uses __index__
print(data[il:il+2])  # [30, 40]
print(hex(il))        # 0x2
print(bin(il))        # 0b10`,
    explanation: "`__index__` is distinct from `__int__`; Python requires `__index__` for lossless integer conversion used in sequence indexing, slicing, and bit conversion functions — `__int__` is for general int conversion.",
  },
];
