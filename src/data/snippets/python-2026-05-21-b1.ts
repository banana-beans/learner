import type { Snippet } from "./types";

export const pythonSnippets20260521B1: Snippet[] = [
  {
    id: "py-0521-b1-set-ops",
    language: "python",
    title: "set operations: union, intersection, difference",
    tag: "snippet",
    code: `a = {1, 2, 3, 4}
b = {3, 4, 5, 6}

print(a | b)   # {1, 2, 3, 4, 5, 6}  union
print(a & b)   # {3, 4}              intersection
print(a - b)   # {1, 2}              difference
print(a ^ b)   # {1, 2, 5, 6}       symmetric difference

# Mutating variants
a |= {7}       # a is now {1, 2, 3, 4, 7}
print(7 in a)  # True`,
    explanation: "Python sets support all standard mathematical set operations as operators and their in-place (`|=`, `&=`, `-=`, `^=`) equivalents — choose sets over lists whenever membership tests or deduplication dominate.",
  },
  {
    id: "py-0521-b1-zip-strict",
    language: "python",
    title: "zip with strict=True catches length mismatch",
    tag: "caveats",
    code: `names  = ["alice", "bob", "carol"]
scores = [90, 85]        # one item short

# Default: silently truncates to shortest
for n, s in zip(names, scores):
    print(n, s)          # alice 90 / bob 85

# strict=True: raises ValueError on length mismatch
try:
    for n, s in zip(names, scores, strict=True):
        pass
except ValueError as e:
    print(e)             # zip() has arguments with different lengths`,
    explanation: "The default `zip` silently drops trailing elements — `strict=True` (Python 3.10+) turns that silent truncation into an explicit error, catching accidental mismatches in parallel data.",
  },
  {
    id: "py-0521-b1-counter-most-common",
    language: "python",
    title: "Counter.most_common for frequency analysis",
    tag: "structures",
    code: `from collections import Counter

words = "the cat sat on the mat the cat".split()
c = Counter(words)

print(c.most_common(3))
# [('the', 3), ('cat', 2), ('sat', 1)]

# Arithmetic on counters
c2 = Counter({"the": 1, "dog": 5})
combined = c + c2
print(combined["the"])   # 4
print(combined["dog"])   # 5`,
    explanation: "`Counter.most_common(n)` returns the n highest-frequency items in O(n log k) time; counter arithmetic (`+`, `-`, `&`, `|`) lets you merge or intersect frequency distributions without manual loops.",
  },
  {
    id: "py-0521-b1-class-slots",
    language: "python",
    title: "__slots__ reduces per-instance memory",
    tag: "classes",
    code: `import sys

class WithDict:
    def __init__(self, x, y):
        self.x = x
        self.y = y

class WithSlots:
    __slots__ = ("x", "y")
    def __init__(self, x, y):
        self.x = x
        self.y = y

a = WithDict(1, 2)
b = WithSlots(1, 2)

print(sys.getsizeof(a) + sys.getsizeof(a.__dict__))  # ~232 bytes
print(sys.getsizeof(b))                               # ~56 bytes`,
    explanation: "`__slots__` replaces each instance's `__dict__` with a fixed-size struct, cutting memory by 3-4× for classes with many instances — the trade-off is that you can no longer add arbitrary attributes at runtime.",
  },
  {
    id: "py-0521-b1-int-caching",
    language: "python",
    title: "small integer caching: is vs ==",
    tag: "understanding",
    code: `a = 256
b = 256
print(a is b)   # True  — CPython caches -5..256

x = 257
y = 257
print(x is y)   # False (usually) — new objects each time

# In one expression, the compiler may intern anyway
print(257 is 257)  # True  — same literal, same const

# Safe comparison always uses ==
print(x == y)   # True`,
    explanation: "CPython interns small integers (-5 to 256) as singletons, making `is` work like `==` for them — but this is an implementation detail, not a language guarantee, so always use `==` when comparing values.",
  },
  {
    id: "py-0521-b1-functools-cache",
    language: "python",
    title: "functools.cache for memoization",
    tag: "snippet",
    code: `from functools import cache

@cache
def fib(n: int) -> int:
    if n < 2:
        return n
    return fib(n - 1) + fib(n - 2)

print(fib(50))          # 12586269025  (instant)
print(fib.cache_info()) # hits=48, misses=51, ...`,
    explanation: "`@cache` (Python 3.9+) is an unbounded memoization decorator — equivalent to `@lru_cache(maxsize=None)` but slightly faster; use `@lru_cache` when you need to cap memory usage.",
  },
  {
    id: "py-0521-b1-dataclass-field-default-factory",
    language: "python",
    title: "dataclass field with default_factory",
    tag: "classes",
    code: `from dataclasses import dataclass, field

@dataclass
class Bag:
    items: list[str] = field(default_factory=list)
    # NOT: items: list[str] = []  <- shared across instances!

a = Bag()
b = Bag()
a.items.append("apple")

print(a.items)  # ['apple']
print(b.items)  # []  — separate list`,
    explanation: "`default_factory` creates a fresh object for each instance; using a bare mutable default like `[]` would be shared across all instances — the same trap as mutable default arguments in regular functions.",
  },
  {
    id: "py-0521-b1-generator-send",
    language: "python",
    title: "generator .send() for two-way communication",
    tag: "understanding",
    code: `def accumulator():
    total = 0
    while True:
        value = yield total   # yield sends total out, receives value in
        if value is None:
            break
        total += value

gen = accumulator()
next(gen)          # prime the generator (advance to first yield)
gen.send(10)       # total = 10
gen.send(20)       # total = 30
result = gen.send(5)
print(result)      # 35`,
    explanation: "`.send(value)` resumes the generator AND delivers a value to the `yield` expression — `next(gen)` is just `.send(None)`, and you must always call `next()` first to advance to the first `yield`.",
  },
  {
    id: "py-0521-b1-contextlib-suppress",
    language: "python",
    title: "contextlib.suppress to swallow specific exceptions",
    tag: "snippet",
    code: `from contextlib import suppress
import os

# Before: verbose
try:
    os.remove("tmp.txt")
except FileNotFoundError:
    pass

# After: intent is clearer
with suppress(FileNotFoundError):
    os.remove("tmp.txt")

# Works with multiple exception types
with suppress(KeyError, TypeError):
    d = {}
    _ = d["missing"]`,
    explanation: "`suppress` documents at a glance which exceptions are intentionally ignored — more readable than a bare `except: pass` and scoped to just the block where the exception is acceptable.",
  },
  {
    id: "py-0521-b1-type-union-pipe",
    language: "python",
    title: "union types with | operator (Python 3.10+)",
    tag: "types",
    code: `# Old style (still valid)
from typing import Optional, Union

def greet_old(name: Union[str, None]) -> str:
    return f"Hello, {name or 'stranger'}"

# New style (3.10+)
def greet(name: str | None) -> str:
    return f"Hello, {name or 'stranger'}"

def process(value: int | float | str) -> str:
    return str(value)

# Also works in isinstance() checks (3.10+)
x: int | str = 42
print(isinstance(x, int | str))  # True`,
    explanation: "The `|` union syntax (PEP 604) works in type hints and `isinstance()`/`issubclass()` calls — it's shorter than `Union[...]` and doesn't require importing from `typing`.",
  },
  {
    id: "py-0521-b1-itertools-chain",
    language: "python",
    title: "itertools.chain to flatten iterables",
    tag: "snippet",
    code: `import itertools

a = [1, 2, 3]
b = (4, 5)
c = range(6, 8)

# chain joins multiple iterables lazily
for x in itertools.chain(a, b, c):
    print(x, end=" ")   # 1 2 3 4 5 6 7

# chain.from_iterable for a list of iterables
nested = [[1, 2], [3, 4], [5]]
flat = list(itertools.chain.from_iterable(nested))
print(flat)   # [1, 2, 3, 4, 5]`,
    explanation: "`chain` concatenates multiple iterables into a single lazy iterator without building a temporary combined list — `chain.from_iterable` accepts one iterable of iterables, useful for flattening.",
  },
  {
    id: "py-0521-b1-abc-abstractmethod",
    language: "python",
    title: "ABC and abstractmethod for interface contracts",
    tag: "classes",
    code: `from abc import ABC, abstractmethod

class Shape(ABC):
    @abstractmethod
    def area(self) -> float: ...

    @abstractmethod
    def perimeter(self) -> float: ...

    def describe(self) -> str:       # concrete method is fine
        return f"area={self.area():.2f}"

class Circle(Shape):
    def __init__(self, r: float):
        self.r = r
    def area(self):      return 3.14159 * self.r ** 2
    def perimeter(self): return 2 * 3.14159 * self.r

# Shape()          # TypeError: Can't instantiate abstract class
print(Circle(5).describe())   # area=78.54`,
    explanation: "Inheriting `ABC` and decorating methods with `@abstractmethod` makes a class uninstantiable until all abstract methods are overridden — Python checks this at instantiation time, not import time.",
  },
  {
    id: "py-0521-b1-dict-merge-operator",
    language: "python",
    title: "dict merge with | and |= (Python 3.9+)",
    tag: "snippet",
    code: `defaults = {"color": "red", "size": 10, "alpha": 1.0}
overrides = {"color": "blue", "weight": 2}

# | creates a new merged dict; right side wins on conflict
merged = defaults | overrides
print(merged)
# {'color': 'blue', 'size': 10, 'alpha': 1.0, 'weight': 2}

# |= updates in place
defaults |= overrides
print(defaults["color"])   # blue`,
    explanation: "The `|` and `|=` dict operators (PEP 584) are cleaner than `{**a, **b}` or `.update()` — they make intent explicit and return a proper dict rather than requiring unpacking syntax.",
  },
  {
    id: "py-0521-b1-late-binding-closure",
    language: "python",
    title: "late binding closures in loops",
    tag: "caveats",
    code: `# Bug: all closures capture the same variable i
funcs_bad = [lambda: i for i in range(3)]
print([f() for f in funcs_bad])   # [2, 2, 2]

# Fix 1: default argument captures value at definition time
funcs_good = [lambda i=i: i for i in range(3)]
print([f() for f in funcs_good])  # [0, 1, 2]

# Fix 2: factory function creates a new scope
def make(n): return lambda: n
funcs_good2 = [make(i) for i in range(3)]
print([f() for f in funcs_good2]) # [0, 1, 2]`,
    explanation: "Python closures capture variables by reference, not by value — when the loop ends, all lambdas see the final value of `i`; a default argument or factory function forces an eager capture.",
  },
  {
    id: "py-0521-b1-pathlib-basics",
    language: "python",
    title: "pathlib.Path for filesystem operations",
    tag: "snippet",
    code: `from pathlib import Path

p = Path("/tmp/demo")
p.mkdir(exist_ok=True)

# Write and read
(p / "hello.txt").write_text("world")
content = (p / "hello.txt").read_text()
print(content)            # world

# Glob
for f in p.glob("*.txt"):
    print(f.name)         # hello.txt

# Path arithmetic
child = p / "sub" / "file.log"
print(child.suffix)       # .log
print(child.stem)         # file
print(child.parent)       # /tmp/demo/sub`,
    explanation: "`pathlib.Path` replaces `os.path` string juggling with an object model — `/` joins parts, `.read_text()`/`.write_text()` replace `open()` boilerplate, and `.glob()` returns `Path` objects directly.",
  },
  {
    id: "py-0521-b1-namedtuple-typed",
    language: "python",
    title: "typing.NamedTuple for typed named tuples",
    tag: "types",
    code: `from typing import NamedTuple

class Point(NamedTuple):
    x: float
    y: float
    label: str = "unlabeled"

p = Point(1.0, 2.5)
print(p.x, p.y, p.label)   # 1.0 2.5 unlabeled

# Still a tuple: indexing and unpacking work
x, y, lbl = p
print(p[0])                 # 1.0

# Immutable
try:
    p.x = 9
except AttributeError as e:
    print(e)  # can't set attribute`,
    explanation: "`typing.NamedTuple` gives you class-style field definitions with type annotations and optional defaults while retaining full tuple compatibility — it's lighter than `dataclass` when you want immutability and tuple semantics.",
  },
  {
    id: "py-0521-b1-enumerate-start",
    language: "python",
    title: "enumerate with custom start index",
    tag: "snippet",
    code: `items = ["apple", "banana", "cherry"]

# Default start=0
for i, item in enumerate(items):
    print(i, item)          # 0 apple / 1 banana / 2 cherry

# Custom start=1 (common for human-readable numbering)
for i, item in enumerate(items, start=1):
    print(f"{i}. {item}")   # 1. apple / 2. banana / 3. cherry

# Works with any iterable
lines = open("/etc/hostname").readlines()
for lineno, line in enumerate(lines, 1):
    print(lineno, line.strip())`,
    explanation: "`enumerate(iterable, start=N)` avoids a manual counter variable — the `start` parameter is frequently set to `1` when producing human-readable output or matching 1-indexed data.",
  },
  {
    id: "py-0521-b1-classmethod-vs-staticmethod",
    language: "python",
    title: "classmethod vs staticmethod",
    tag: "classes",
    code: `class Temperature:
    def __init__(self, celsius: float):
        self.celsius = celsius

    @classmethod
    def from_fahrenheit(cls, f: float) -> "Temperature":
        return cls((f - 32) * 5 / 9)   # cls = Temperature (or subclass)

    @staticmethod
    def is_freezing(celsius: float) -> bool:
        return celsius <= 0             # no self or cls needed

t = Temperature.from_fahrenheit(212)
print(t.celsius)                        # 100.0
print(Temperature.is_freezing(-5))     # True`,
    explanation: "`@classmethod` receives the class (`cls`) as first argument, enabling polymorphic factory methods that work correctly with subclasses; `@staticmethod` is just a plain function namespaced inside the class.",
  },
  {
    id: "py-0521-b1-walrus-comprehension",
    language: "python",
    title: "walrus operator in comprehension for reuse",
    tag: "snippet",
    code: `import math

# Without walrus: compute sqrt twice
results_bad = [math.sqrt(x) for x in range(10) if math.sqrt(x) > 2]

# With walrus: compute once, reuse in filter
results = [y for x in range(10) if (y := math.sqrt(x)) > 2]
print(results)  # [2.23..., 2.44..., 2.64..., 2.82..., 3.0, 3.16..., 3.31...]`,
    explanation: "The walrus operator inside a comprehension assigns the intermediate result to a name that can be used in both the condition and the output expression, avoiding redundant computation.",
  },
  {
    id: "py-0521-b1-string-format-spec",
    language: "python",
    title: "f-string format spec mini-language",
    tag: "snippet",
    code: `value = 1234567.891

print(f"{value:,.2f}")      # 1,234,567.89  (comma separator, 2 decimals)
print(f"{value:e}")         # 1.234568e+06  (scientific notation)
print(f"{value:>15.1f}")    # '   1234567.9' (right-align in 15 chars)

ratio = 0.725
print(f"{ratio:.1%}")       # 72.5%

n = 255
print(f"{n:#010b}")         # 0b11111111  (binary, 10 wide, 0-padded)
print(f"{n:#x}")            # 0xff`,
    explanation: "The format spec after `:` in an f-string follows Python's mini-language — `,` adds thousands separator, `%` multiplies by 100, `#` adds the `0b`/`0x` prefix, and `>/<` control alignment.",
  },
  {
    id: "py-0521-b1-deque-maxlen",
    language: "python",
    title: "deque with maxlen as a sliding window",
    tag: "structures",
    code: `from collections import deque

# Fixed-size deque automatically drops oldest items
window = deque(maxlen=3)

for x in [1, 2, 3, 4, 5]:
    window.append(x)
    print(list(window))
# [1]
# [1, 2]
# [1, 2, 3]
# [2, 3, 4]   <- 1 dropped
# [3, 4, 5]   <- 2 dropped`,
    explanation: "A `deque(maxlen=N)` is a O(1) sliding window — when full, appending to the right automatically drops from the left (and vice versa), saving you the bookkeeping of manual slicing.",
  },
  {
    id: "py-0521-b1-protocol-structural",
    language: "python",
    title: "typing.Protocol for structural subtyping",
    tag: "types",
    code: `from typing import Protocol, runtime_checkable

@runtime_checkable
class Drawable(Protocol):
    def draw(self) -> None: ...

class Circle:
    def draw(self) -> None:
        print("drawing circle")

class Square:
    def draw(self) -> None:
        print("drawing square")

def render(shape: Drawable) -> None:
    shape.draw()

render(Circle())   # drawing circle
render(Square())   # drawing square

print(isinstance(Circle(), Drawable))  # True`,
    explanation: "`Protocol` enables structural (duck-type) checking — any class that implements the required methods satisfies the protocol without explicit inheritance, similar to Go interfaces.",
  },
  {
    id: "py-0521-b1-unpacking-star",
    language: "python",
    title: "starred unpacking in assignments",
    tag: "snippet",
    code: `first, *rest = [1, 2, 3, 4, 5]
print(first)   # 1
print(rest)    # [2, 3, 4, 5]

*init, last = [1, 2, 3, 4, 5]
print(init)    # [1, 2, 3, 4]
print(last)    # 5

head, *middle, tail = [1, 2, 3, 4, 5]
print(middle)  # [2, 3, 4]

# Also works in function calls
a = [1, 2]
b = [3, 4]
combined = [*a, *b, 5]
print(combined)   # [1, 2, 3, 4, 5]`,
    explanation: "The `*` in assignment unpacking collects the \"rest\" into a list and can appear anywhere in the target — paired with `**` in dicts, it's the backbone of Python's splat idioms.",
  },
  {
    id: "py-0521-b1-float-nan-behavior",
    language: "python",
    title: "NaN propagation and detection",
    tag: "types",
    code: `import math

nan = float("nan")

# NaN comparisons always return False
print(nan == nan)   # False
print(nan < 1)      # False
print(nan > 1)      # False

# Even nan is nan returns False in some contexts
x = nan
print(x is nan)     # True  (same object)
print(x == nan)     # False (IEEE 754)

# Correct detection
print(math.isnan(nan))    # True
print(math.isnan(x))      # True`,
    explanation: "NaN is the only value in Python (and IEEE 754) that is not equal to itself — always use `math.isnan()` or `cmath.isnan()` to detect it, never `== float('nan')`.",
  },
  {
    id: "py-0521-b1-list-vs-tuple-perf",
    language: "python",
    title: "list vs tuple: when to prefer each",
    tag: "structures",
    code: `import timeit, sys

lst = list(range(1000))
tup = tuple(range(1000))

# Tuples are slightly smaller
print(sys.getsizeof(lst))   # 8056
print(sys.getsizeof(tup))   # 8040

# Tuple literal construction is faster
t_list = timeit.timeit("x=[1,2,3,4,5]", number=10_000_000)
t_tup  = timeit.timeit("x=(1,2,3,4,5)", number=10_000_000)
print(round(t_tup / t_list, 2))   # ~0.1 (tuples ~10× faster to create)`,
    explanation: "Prefer tuples for fixed, heterogeneous data (records) and lists for homogeneous, mutable sequences — tuples are cheaper to create and signal immutability to readers.",
  },
  {
    id: "py-0521-b1-metaclass-basics",
    language: "python",
    title: "metaclass: customizing class creation",
    tag: "classes",
    code: `class SingletonMeta(type):
    _instances: dict = {}

    def __call__(cls, *args, **kwargs):
        if cls not in cls._instances:
            cls._instances[cls] = super().__call__(*args, **kwargs)
        return cls._instances[cls]

class Config(metaclass=SingletonMeta):
    def __init__(self):
        self.debug = False

a = Config()
b = Config()
print(a is b)   # True — same instance
a.debug = True
print(b.debug)  # True — same object`,
    explanation: "A metaclass is the \"class of a class\" — overriding `__call__` in a metaclass intercepts instantiation before `__init__` runs, enabling patterns like singletons or class registries without touching the class itself.",
  },
  {
    id: "py-0521-b1-sorted-key",
    language: "python",
    title: "sorted with a key function",
    tag: "snippet",
    code: `people = [
    {"name": "Charlie", "age": 30},
    {"name": "Alice",   "age": 25},
    {"name": "Bob",     "age": 30},
]

# Sort by age, then name (stable sort preserves relative order)
by_age_name = sorted(people, key=lambda p: (p["age"], p["name"]))
for p in by_age_name:
    print(p["name"], p["age"])
# Alice 25 / Bob 30 / Charlie 30

# Reverse a single level without negating
from functools import cmp_to_key`,
    explanation: "Python's sort is stable, so sorting by a tuple key `(primary, secondary)` is the idiomatic way to achieve multi-level ordering — no custom comparator needed.",
  },
  {
    id: "py-0521-b1-exception-chaining",
    language: "python",
    title: "exception chaining with raise from",
    tag: "caveats",
    code: `class DatabaseError(Exception): pass

def connect(url: str):
    try:
        raise ConnectionRefusedError("port 5432 refused")
    except ConnectionRefusedError as e:
        raise DatabaseError("cannot connect to DB") from e

try:
    connect("localhost")
except DatabaseError as e:
    print(e)           # cannot connect to DB
    print(e.__cause__) # port 5432 refused`,
    explanation: "`raise X from Y` sets `__cause__` on the new exception and prints the full chain in tracebacks — use it to wrap low-level errors in domain errors without discarding the original context.",
  },
  {
    id: "py-0521-b1-typing-overload",
    language: "python",
    title: "@overload for type-dependent return types",
    tag: "types",
    code: `from typing import overload

@overload
def process(value: int) -> int: ...
@overload
def process(value: str) -> str: ...

def process(value):
    if isinstance(value, int):
        return value * 2
    return value.upper()

result_int: int = process(5)    # type checker knows this is int
result_str: str = process("hi") # type checker knows this is str
print(result_int, result_str)   # 10  HI`,
    explanation: "`@overload` stubs let type checkers infer the correct return type based on argument type — the actual implementation (without `@overload`) handles all cases at runtime.",
  },
  {
    id: "py-0521-b1-defaultdict-graph",
    language: "python",
    title: "defaultdict for adjacency lists",
    tag: "structures",
    code: `from collections import defaultdict

graph = defaultdict(list)

edges = [(1, 2), (1, 3), (2, 4), (3, 4)]
for u, v in edges:
    graph[u].append(v)
    graph[v].append(u)

print(dict(graph))
# {1: [2, 3], 2: [1, 4], 3: [1, 4], 4: [2, 3]}

# BFS without KeyError on unseen nodes
from collections import deque
def bfs(start):
    visited = set()
    q = deque([start])
    while q:
        node = q.popleft()
        if node not in visited:
            visited.add(node)
            q.extend(graph[node])
    return visited`,
    explanation: "`defaultdict(list)` eliminates the `setdefault` boilerplate for building adjacency lists — accessing a missing key automatically inserts an empty list instead of raising `KeyError`.",
  },
  {
    id: "py-0521-b1-match-statement",
    language: "python",
    title: "structural pattern matching (match/case)",
    tag: "snippet",
    code: `def http_status(status: int) -> str:
    match status:
        case 200:
            return "OK"
        case 404:
            return "Not Found"
        case 500 | 503:
            return "Server Error"
        case x if 400 <= x < 500:
            return f"Client Error {x}"
        case _:
            return "Unknown"

print(http_status(200))   # OK
print(http_status(429))   # Client Error 429`,
    explanation: "`match`/`case` (Python 3.10+) supports literal matching, OR patterns (`|`), guards (`if`), and wildcard `_` — it's not just a switch; it also does structural decomposition of sequences and mappings.",
  },
  {
    id: "py-0521-b1-decimal-exact",
    language: "python",
    title: "Decimal for exact decimal arithmetic",
    tag: "types",
    code: `from decimal import Decimal, ROUND_HALF_UP, getcontext

# float rounding error
print(0.1 + 0.2)           # 0.30000000000000004

# Decimal: exact
print(Decimal("0.1") + Decimal("0.2"))  # 0.3

# Custom precision
getcontext().prec = 6
print(Decimal("1") / Decimal("3"))   # 0.333333

# Explicit rounding
amount = Decimal("19.555")
print(amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))  # 19.56`,
    explanation: "`Decimal` stores numbers as base-10 strings internally, avoiding the binary representation errors of `float` — always use `Decimal` for financial calculations where exact rounding rules matter.",
  },
  {
    id: "py-0521-b1-descriptor-protocol",
    language: "python",
    title: "descriptor protocol: __get__ and __set__",
    tag: "classes",
    code: `class Clamped:
    """Descriptor that clamps a numeric attribute to [lo, hi]."""
    def __set_name__(self, owner, name):
        self.name = name

    def __get__(self, obj, objtype=None):
        if obj is None: return self
        return obj.__dict__.get(self.name, 0)

    def __set__(self, obj, value):
        obj.__dict__[self.name] = max(self.lo, min(self.hi, value))

    def __init__(self, lo, hi):
        self.lo, self.hi = lo, hi

class Servo:
    angle = Clamped(0, 180)

s = Servo()
s.angle = 250
print(s.angle)   # 180`,
    explanation: "Descriptors implement `__get__`/`__set__`/`__delete__` on a class attribute to intercept every access on instances — they power `property`, `classmethod`, and `staticmethod` under the hood.",
  },
  {
    id: "py-0521-b1-partial-function",
    language: "python",
    title: "functools.partial for argument binding",
    tag: "snippet",
    code: `from functools import partial

def power(base, exp):
    return base ** exp

square = partial(power, exp=2)
cube   = partial(power, exp=3)

print(square(4))   # 16
print(cube(3))     # 27

# Useful with map/filter
results = list(map(partial(power, exp=2), range(5)))
print(results)     # [0, 1, 4, 9, 16]`,
    explanation: "`partial` creates a new callable with some arguments pre-filled — it's cleaner than a lambda for simple argument binding and preserves the original function's metadata via `functools.wraps`.",
  },
  {
    id: "py-0521-b1-comprehension-scope",
    language: "python",
    title: "comprehension variables don't leak (Python 3)",
    tag: "understanding",
    code: `# Python 2: loop var leaked into enclosing scope
# Python 3: comprehensions have their own scope

x = "outer"
result = [x for x in range(5)]   # x is local to this comprehension
print(x)      # "outer"  — not overwritten by comprehension

# Generator expressions also have their own scope
gen = (x * 2 for x in range(3))
print(x)      # still "outer"

# BUT: walrus operator DOES leak from comprehension
result2 = [y := i for i in range(5)]
print(y)      # 4  — walrus leaks into enclosing scope`,
    explanation: "In Python 3, list/set/dict comprehensions and generator expressions create their own scope, so loop variables don't pollute the enclosing namespace — the walrus operator is a deliberate exception to this rule.",
  },
  {
    id: "py-0521-b1-memoryview-zero-copy",
    language: "python",
    title: "memoryview for zero-copy slicing",
    tag: "structures",
    code: `data = bytearray(b"Hello, World!")

# Normal slice copies the data
copy = data[7:]
print(bytes(copy))   # b'World!'

# memoryview slice is zero-copy
mv = memoryview(data)
view = mv[7:]        # no copy
print(bytes(view))   # b'World!'

# Mutations through view affect original
view[0] = ord("w")
print(data)          # bytearray(b'Hello, world!')`,
    explanation: "`memoryview` exposes the underlying buffer of a bytes-like object — slicing it creates a new view rather than copying bytes, critical for high-performance I/O where you're processing large buffers in chunks.",
  },
  {
    id: "py-0521-b1-typing-literal",
    language: "python",
    title: "Literal type for constrained string values",
    tag: "types",
    code: `from typing import Literal

Direction = Literal["north", "south", "east", "west"]

def move(direction: Direction, steps: int) -> None:
    print(f"Moving {steps} steps {direction}")

move("north", 3)    # OK
# move("up", 3)     # Type error: "up" not in Literal

Mode = Literal[1, 2, 3]

def set_mode(m: Mode) -> None:
    print(m)`,
    explanation: "`Literal` restricts a type to a fixed set of values — type checkers can verify callers pass only the allowed values, and IDEs offer autocomplete for those values.",
  },
  {
    id: "py-0521-b1-class-dunder-repr",
    language: "python",
    title: "__repr__ vs __str__ for object display",
    tag: "classes",
    code: `class Vector:
    def __init__(self, x, y):
        self.x = x
        self.y = y

    def __repr__(self) -> str:
        return f"Vector({self.x!r}, {self.y!r})"   # unambiguous, eval-able

    def __str__(self) -> str:
        return f"<{self.x}, {self.y}>"              # human-readable

v = Vector(1, 2)
print(repr(v))   # Vector(1, 2)    <- used in collections, REPL
print(str(v))    # <1, 2>          <- used by print()
print([v])       # [Vector(1, 2)]  <- containers use repr`,
    explanation: "`__repr__` should return an unambiguous, ideally `eval()`-able string used in debugging; `__str__` is for human display — if only one is defined, `__repr__` serves as fallback for both.",
  },
  {
    id: "py-0521-b1-heapq-nlargest",
    language: "python",
    title: "heapq.nlargest and nsmallest",
    tag: "structures",
    code: `import heapq

scores = [42, 17, 99, 55, 3, 88, 71]

top3    = heapq.nlargest(3, scores)
bottom3 = heapq.nsmallest(3, scores)

print(top3)     # [99, 88, 71]
print(bottom3)  # [3, 17, 42]

# With a key function
records = [{"name": "A", "val": 10}, {"name": "B", "val": 5}]
best = heapq.nlargest(1, records, key=lambda r: r["val"])
print(best)     # [{'name': 'A', 'val': 10}]`,
    explanation: "`heapq.nlargest/nsmallest(n, iterable)` is O(k log n) — faster than sorting when you only need the top/bottom k items from a large sequence; for k=1 use `max()`/`min()` instead.",
  },
  {
    id: "py-0521-b1-async-gather",
    language: "python",
    title: "asyncio.gather for concurrent tasks",
    tag: "snippet",
    code: `import asyncio

async def fetch(url: str, delay: float) -> str:
    await asyncio.sleep(delay)   # simulate network I/O
    return f"got {url}"

async def main():
    # Run all three concurrently, total time ≈ max(delays)
    results = await asyncio.gather(
        fetch("a.com", 1),
        fetch("b.com", 0.5),
        fetch("c.com", 0.8),
    )
    print(results)
    # ['got a.com', 'got b.com', 'got c.com']

asyncio.run(main())`,
    explanation: "`asyncio.gather` schedules all coroutines concurrently and returns their results in the same order — total wall-clock time is the slowest task, not the sum, because I/O waits overlap.",
  },
  {
    id: "py-0521-b1-typeddict",
    language: "python",
    title: "TypedDict for typed dict schemas",
    tag: "types",
    code: `from typing import TypedDict, Required, NotRequired

class Movie(TypedDict):
    title: str
    year: int
    rating: NotRequired[float]   # optional key

class FullMovie(TypedDict, total=False):  # all keys optional by default
    title: Required[str]                  # but this one is required

m: Movie = {"title": "Dune", "year": 2021}
print(m["title"])   # Dune

# Type checkers will flag:
# m["unknown"]          <- unknown key
# m2: Movie = {}        <- missing required keys`,
    explanation: "`TypedDict` lets type checkers validate dict literals at build time — `NotRequired`/`Required` let you mix optional and mandatory keys in a `total=True` or `total=False` definition.",
  },
  {
    id: "py-0521-b1-context-manager-class",
    language: "python",
    title: "custom context manager with __enter__/__exit__",
    tag: "classes",
    code: `import time

class Timer:
    def __enter__(self):
        self._start = time.perf_counter()
        return self                          # bound to 'as' target

    def __exit__(self, exc_type, exc_val, tb):
        self.elapsed = time.perf_counter() - self._start
        return False                         # don't suppress exceptions

with Timer() as t:
    total = sum(range(1_000_000))

print(f"elapsed: {t.elapsed:.3f}s")   # elapsed: 0.032s`,
    explanation: "`__enter__` sets up the resource and returns it; `__exit__` tears it down and receives exception info — returning `True` from `__exit__` suppresses the exception, `False` lets it propagate.",
  },
  {
    id: "py-0521-b1-is-vs-equals",
    language: "python",
    title: "is vs == for string identity",
    tag: "caveats",
    code: `a = "hello"
b = "hello"
print(a is b)    # True  — interned by CPython

c = "".join(["h", "e", "l", "l", "o"])
print(c == a)    # True   — same value
print(c is a)    # False  — different object (not interned)

# String interning is an implementation detail
import sys
d = sys.intern("hello world")
e = sys.intern("hello world")
print(d is e)    # True  — explicitly interned`,
    explanation: "CPython interns short strings that look like identifiers, so `is` may accidentally work — but only `==` is guaranteed for value equality; `is` tests object identity, not value.",
  },
  {
    id: "py-0521-b1-chainmap",
    language: "python",
    title: "ChainMap for layered configuration",
    tag: "structures",
    code: `from collections import ChainMap

defaults = {"color": "white", "font": "Arial", "size": 12}
user     = {"color": "blue"}
session  = {"size": 14}

# Later maps are fallbacks; earlier maps shadow them
config = ChainMap(session, user, defaults)
print(config["color"])   # blue   (from user)
print(config["font"])    # Arial  (from defaults)
print(config["size"])    # 14     (from session)

# Mutations only affect the first map
config["new_key"] = "val"
print(session)   # {'size': 14, 'new_key': 'val'}`,
    explanation: "`ChainMap` chains multiple dicts into a single logical view with O(n-maps) lookup — mutations always hit the first map, making it ideal for layered config where a \"local\" layer overrides \"global\" defaults.",
  },
  {
    id: "py-0521-b1-dunder-iter",
    language: "python",
    title: "__iter__ and __next__ for custom iterators",
    tag: "classes",
    code: `class Countdown:
    def __init__(self, start: int):
        self.current = start

    def __iter__(self):
        return self          # the iterator IS the object

    def __next__(self):
        if self.current < 0:
            raise StopIteration
        val = self.current
        self.current -= 1
        return val

for n in Countdown(3):
    print(n, end=" ")   # 3 2 1 0

print(list(Countdown(2)))   # [2, 1, 0]`,
    explanation: "Implementing `__iter__` (returns self) and `__next__` (returns next item or raises `StopIteration`) makes any object a Python iterator compatible with `for` loops, `list()`, `sum()`, and so on.",
  },
  {
    id: "py-0521-b1-slots-dataclass",
    language: "python",
    title: "dataclass with slots=True (Python 3.10+)",
    tag: "classes",
    code: `from dataclasses import dataclass
import sys

@dataclass
class PointNormal:
    x: float
    y: float

@dataclass(slots=True)
class PointSlotted:
    x: float
    y: float

a = PointNormal(1.0, 2.0)
b = PointSlotted(1.0, 2.0)

print(sys.getsizeof(a))   # 48 bytes (has __dict__)
print(sys.getsizeof(b))   # 40 bytes (no __dict__)`,
    explanation: "`@dataclass(slots=True)` automatically generates `__slots__` for you, combining the concise field declaration of dataclasses with the memory savings of slot-based instances.",
  },
  {
    id: "py-0521-b1-bisect-search",
    language: "python",
    title: "bisect for binary search in sorted lists",
    tag: "structures",
    code: `import bisect

scores = [20, 40, 60, 80, 100]
grades = ["F", "D", "C", "B", "A"]

def grade(score):
    idx = bisect.bisect_left(scores, score)
    return grades[min(idx, len(grades) - 1)]

print(grade(55))    # C
print(grade(80))    # B
print(grade(100))   # A

# Insert into sorted list in O(log n) search + O(n) insert
lst = [1, 3, 5, 7]
bisect.insort(lst, 4)
print(lst)          # [1, 3, 4, 5, 7]`,
    explanation: "`bisect` performs binary search on sorted lists — `bisect_left/right` return insertion points and `insort` maintains sort order after insertion; use it instead of linear `in` checks on sorted data.",
  },
  {
    id: "py-0521-b1-pep695-type-alias",
    language: "python",
    title: "type alias statement (Python 3.12+)",
    tag: "types",
    code: `# Old style (implicit alias — just a variable)
Vector2D = list[float]

# PEP 613 (3.10): explicit alias
from typing import TypeAlias
Vector3D: TypeAlias = list[float]

# PEP 695 (3.12): dedicated syntax
type Matrix = list[list[float]]
type Callback[T] = (T) -> None   # generic alias

def scale(v: Vector3D, factor: float) -> Vector3D:
    return [x * factor for x in v]`,
    explanation: "The `type` statement (Python 3.12+) makes type aliases first-class — they're lazy (not evaluated at import time), support generic parameters via `[T]`, and appear correctly in `__type_params__`.",
  },
  {
    id: "py-0521-b1-rich-comparison",
    language: "python",
    title: "rich comparison methods and @total_ordering",
    tag: "classes",
    code: `from functools import total_ordering

@total_ordering
class Version:
    def __init__(self, major, minor):
        self.major = major
        self.minor = minor

    def __eq__(self, other):
        return (self.major, self.minor) == (other.major, other.minor)

    def __lt__(self, other):
        return (self.major, self.minor) < (other.major, other.minor)

v1 = Version(1, 9)
v2 = Version(2, 0)

print(v1 < v2)    # True
print(v1 <= v2)   # True   <- generated by @total_ordering
print(v2 > v1)    # True   <- generated
print(sorted([v2, v1])[0].major)   # 1`,
    explanation: "`@total_ordering` generates the missing comparison methods (`<=`, `>`, `>=`) from just `__eq__` and one of `__lt__/__le__/__gt__/__ge__`— define two, get all six for free.",
  },
  {
    id: "py-0521-b1-any-all-generators",
    language: "python",
    title: "any() and all() short-circuit over generators",
    tag: "snippet",
    code: `nums = [2, 4, 6, 8, 9, 10]

# all() stops at the first False
all_even = all(n % 2 == 0 for n in nums)
print(all_even)   # False  (stops at 9)

# any() stops at the first True
has_large = any(n > 7 for n in nums)
print(has_large)  # True   (stops at 8)

# Generator avoids building a list first
words = ["hello", "world", "python"]
print(any(w.startswith("p") for w in words))  # True`,
    explanation: "`any()`/`all()` take any iterable — passing a generator expression means they short-circuit without materializing the whole sequence, saving memory for large or infinite streams.",
  },
  {
    id: "py-0521-b1-property-cached",
    language: "python",
    title: "functools.cached_property for lazy attributes",
    tag: "classes",
    code: `from functools import cached_property
import time

class DataSet:
    def __init__(self, data: list[int]):
        self._data = data

    @cached_property
    def statistics(self) -> dict:
        time.sleep(0.1)    # simulate expensive computation
        n = len(self._data)
        return {"mean": sum(self._data) / n, "count": n}

ds = DataSet(list(range(1000)))
print(ds.statistics["mean"])   # 499.5  (computed once)
print(ds.statistics["count"])  # 1000   (cached, instant)`,
    explanation: "`@cached_property` computes the value on first access and stores it in the instance `__dict__`, bypassing the descriptor on subsequent accesses — it's a clean lazy-init pattern without manual `if not self._cache` guards.",
  },
  {
    id: "py-0521-b1-int-overflow",
    language: "python",
    title: "Python integers never overflow",
    tag: "types",
    code: `# Python int is arbitrary precision — no overflow
big = 2 ** 1000
print(big)          # 10715086071862673...  (302 digits!)
print(type(big))    # <class 'int'>

# Arithmetic stays exact
print(2 ** 64)      # 18446744073709551616   (not 0 like C)
print(10 ** 100)    # 1 followed by 100 zeros

# Comparison: use sys.getsizeof to see memory grows
import sys
print(sys.getsizeof(0))        # 24 bytes
print(sys.getsizeof(2**100))   # 40 bytes`,
    explanation: "Python's `int` is a bignum — it allocates more memory as values grow rather than wrapping around; the flip side is that arithmetic on very large integers is slower than fixed-width C integers.",
  },
  {
    id: "py-0521-b1-structural-match-class",
    language: "python",
    title: "match statement: class pattern matching",
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

def describe(shape):
    match shape:
        case Circle(center=Point(x=0, y=0), radius=r):
            return f"origin circle r={r}"
        case Circle(center=Point(x=x, y=y), radius=r):
            return f"circle at ({x},{y}) r={r}"
        case _:
            return "unknown"

print(describe(Circle(Point(0, 0), 5)))   # origin circle r=5
print(describe(Circle(Point(1, 2), 3)))   # circle at (1,2) r=3`,
    explanation: "Class patterns in `match` destructure objects by checking their type and matching attributes — combined with nested patterns, they read almost like a type-safe schema validation.",
  },
  {
    id: "py-0521-b1-iter-sentinel",
    language: "python",
    title: "two-argument iter() with sentinel",
    tag: "snippet",
    code: `import io

data = io.BytesIO(b"\\x01\\x02\\x03\\x04\\x00\\x05")

# Read 1 byte at a time until a null byte (sentinel)
chunks = list(iter(lambda: data.read(1), b"\\x00"))
print(chunks)   # [b'\\x01', b'\\x02', b'\\x03', b'\\x04']

# Read lines from a file until empty string (EOF)
# for line in iter(file.readline, ""):
#     process(line)`,
    explanation: "`iter(callable, sentinel)` calls the callable repeatedly and stops when it returns the sentinel value — it's the cleanest way to loop over a callable-based source without a manual `while True: if x == sentinel: break`.",
  },
  {
    id: "py-0521-b1-str-methods-chain",
    language: "python",
    title: "str method chaining for text cleaning",
    tag: "snippet",
    code: `raw = "  Hello, World!  \\t\\n"

cleaned = (raw
    .strip()           # remove surrounding whitespace
    .lower()           # normalize case
    .replace(",", "")  # strip punctuation
    .replace("!", "")
)
print(repr(cleaned))   # 'hello world'

# Split on any whitespace then rejoin
words = "  too   many   spaces  ".split()
print(" ".join(words))   # 'too many spaces'`,
    explanation: "String methods return new strings, so they chain naturally — `.strip().lower().replace()` reads like a pipeline; `split()` with no argument splits on any whitespace and discards empty tokens.",
  },
  {
    id: "py-0521-b1-weakref-basic",
    language: "python",
    title: "weakref to avoid reference cycles",
    tag: "caveats",
    code: `import weakref

class Node:
    def __init__(self, value):
        self.value = value
        self.parent = None   # strong ref creates cycle

class SafeNode:
    def __init__(self, value):
        self.value = value
        self._parent = None

    @property
    def parent(self):
        return self._parent() if self._parent else None

    @parent.setter
    def parent(self, node):
        self._parent = weakref.ref(node) if node else None

child = SafeNode("child")
parent = SafeNode("parent")
child.parent = parent
del parent
print(child.parent)   # None — parent was garbage collected`,
    explanation: "Weak references don't prevent garbage collection — when the parent is deleted, `weakref.ref` returns `None`, breaking the cycle without requiring explicit cleanup code.",
  },
  {
    id: "py-0521-b1-comprehension-dict-invert",
    language: "python",
    title: "dict comprehension to invert a mapping",
    tag: "snippet",
    code: `original = {"a": 1, "b": 2, "c": 3}

# Invert: values become keys, keys become values
inverted = {v: k for k, v in original.items()}
print(inverted)   # {1: 'a', 2: 'b', 3: 'c'}

# Handle non-unique values by collecting into lists
from collections import defaultdict
data = {"a": 1, "b": 2, "c": 1}
inverted_multi = defaultdict(list)
for k, v in data.items():
    inverted_multi[v].append(k)
print(dict(inverted_multi))   # {1: ['a', 'c'], 2: ['b']}`,
    explanation: "A dict comprehension swaps keys and values in one expression; for non-injective mappings (duplicate values), `defaultdict(list)` collects all original keys that map to each value.",
  },
  {
    id: "py-0521-b1-class-vars-vs-instance-vars",
    language: "python",
    title: "class variables vs instance variables",
    tag: "classes",
    code: `class Dog:
    species = "Canis lupus"    # class variable — shared

    def __init__(self, name: str):
        self.name = name       # instance variable — per object

rex = Dog("Rex")
fido = Dog("Fido")

print(rex.species)    # Canis lupus
print(fido.species)   # Canis lupus

Dog.species = "Canis familiaris"
print(rex.species)    # Canis familiaris  <- picked up change

rex.species = "overridden"  # shadows class var on this instance only
print(fido.species)   # Canis familiaris  <- unchanged`,
    explanation: "A class variable is shared across all instances until an instance assignment shadows it — modifying it through the class affects all instances; modifying through an instance creates a per-instance shadow.",
  },
  {
    id: "py-0521-b1-generator-exhaustion",
    language: "python",
    title: "generators exhaust: can only iterate once",
    tag: "caveats",
    code: `def squares(n):
    for i in range(n):
        yield i * i

gen = squares(5)

print(list(gen))   # [0, 1, 4, 9, 16]
print(list(gen))   # []  — exhausted!

# Fix: call the function again for a fresh generator
print(list(squares(5)))   # [0, 1, 4, 9, 16]

# Or use itertools.tee if you need multiple passes
import itertools
g1, g2 = itertools.tee(squares(5))
print(list(g1))   # [0, 1, 4, 9, 16]
print(list(g2))   # [0, 1, 4, 9, 16]`,
    explanation: "A generator object is a one-shot iterator — once exhausted it silently yields nothing on subsequent iterations; call the generator function again or use `itertools.tee` if you need multiple passes over the same data.",
  },
  {
    id: "py-0521-b1-operator-module",
    language: "python",
    title: "operator module for function-based ops",
    tag: "snippet",
    code: `import operator, functools

nums = [3, 1, 4, 1, 5, 9, 2]

# operator functions are faster than lambdas
print(sorted(nums, key=operator.neg))       # [9, 5, 4, 3, 2, 1, 1]
product = functools.reduce(operator.mul, nums)
print(product)   # 1080

records = [("Alice", 30), ("Bob", 25)]
print(sorted(records, key=operator.itemgetter(1)))
# [('Bob', 25), ('Alice', 30)]`,
    explanation: "`operator` provides function-object equivalents of Python's built-in operators — they're slightly faster than equivalent lambdas and work well with `functools.reduce`, `sorted`, and `map`.",
  },
  {
    id: "py-0521-b1-tuple-as-dict-key",
    language: "python",
    title: "tuples as composite dict keys",
    tag: "structures",
    code: `# Tuples are hashable; lists are not
grid = {}
grid[(0, 0)] = "start"
grid[(3, 4)] = "end"

print(grid[(0, 0)])   # start

# 3D coordinates
volume = {}
for x in range(2):
    for y in range(2):
        for z in range(2):
            volume[(x, y, z)] = x + y + z

print(volume[(1, 1, 1)])   # 3

# Any hashable elements work
months = {(2024, 1): "January", (2024, 2): "February"}`,
    explanation: "A tuple of hashable values is itself hashable and usable as a dict key — this is the idiomatic way to implement multi-dimensional mappings or sparse grids without nested dicts.",
  },
  {
    id: "py-0521-b1-open-modes",
    language: "python",
    title: "file open modes and encoding",
    tag: "snippet",
    code: `# Text mode (default): decodes bytes to str
with open("file.txt", "r", encoding="utf-8") as f:
    content = f.read()

# Write mode: creates or truncates
with open("out.txt", "w", encoding="utf-8") as f:
    f.write("hello\\n")

# Append mode: adds to end
with open("out.txt", "a") as f:
    f.write("world\\n")

# Binary mode: raw bytes, no decoding
with open("img.png", "rb") as f:
    header = f.read(4)
    print(header)   # b'\\x89PNG'

# x mode: exclusive creation — fails if file exists
# with open("new.txt", "x") as f: ...`,
    explanation: "Always specify `encoding` in text mode (`utf-8` is the safe default) — omitting it uses the platform default which differs between systems, causing subtle cross-platform bugs.",
  },
  {
    id: "py-0521-b1-frozen-dataclass",
    language: "python",
    title: "frozen dataclass as an immutable value object",
    tag: "classes",
    code: `from dataclasses import dataclass

@dataclass(frozen=True)
class Color:
    r: int
    g: int
    b: int

red = Color(255, 0, 0)

# Frozen dataclasses are hashable by default
palette = {red, Color(0, 255, 0)}
print(len(palette))   # 2

try:
    red.r = 128
except Exception as e:
    print(type(e).__name__)   # FrozenInstanceError`,
    explanation: "`frozen=True` makes the dataclass immutable and generates `__hash__` automatically, making instances usable as dict keys or set members — the trade-off is that you can never mutate them.",
  },
  {
    id: "py-0521-b1-zip-longest",
    language: "python",
    title: "itertools.zip_longest to pad shorter iterables",
    tag: "snippet",
    code: `from itertools import zip_longest

a = [1, 2, 3]
b = ["x", "y"]

# zip truncates to shortest
print(list(zip(a, b)))               # [(1, 'x'), (2, 'y')]

# zip_longest pads with fillvalue
print(list(zip_longest(a, b, fillvalue=None)))
# [(1, 'x'), (2, 'y'), (3, None)]

print(list(zip_longest(a, b, fillvalue=0)))
# [(1, 'x'), (2, 'y'), (3, 0)]`,
    explanation: "`zip_longest` fills the shorter iterable with `fillvalue` instead of truncating — useful when you need to process corresponding elements of unequal-length sequences without silently dropping data.",
  },
  {
    id: "py-0521-b1-args-kwargs-forwarding",
    language: "python",
    title: "*args and **kwargs for argument forwarding",
    tag: "snippet",
    code: `def log_call(func):
    def wrapper(*args, **kwargs):
        print(f"Calling {func.__name__} with {args} {kwargs}")
        result = func(*args, **kwargs)
        print(f"Returned {result}")
        return result
    return wrapper

@log_call
def add(x, y, z=0):
    return x + y + z

add(1, 2)        # args=(1,2) kwargs={}  -> 3
add(1, 2, z=3)   # args=(1,2) kwargs={'z':3} -> 6`,
    explanation: "`*args` collects positional arguments into a tuple; `**kwargs` collects keyword arguments into a dict — together they let a wrapper forward all arguments to the wrapped function unchanged.",
  },
  {
    id: "py-0521-b1-set-comprehension",
    language: "python",
    title: "set comprehension for deduplication",
    tag: "snippet",
    code: `words = ["apple", "banana", "apple", "cherry", "banana"]

# Set comprehension deduplicates automatically
unique = {w for w in words}
print(unique)   # {'apple', 'banana', 'cherry'}

# With a transform
unique_lengths = {len(w) for w in words}
print(sorted(unique_lengths))   # [5, 6]

# vs list comprehension (preserves duplicates)
lengths = [len(w) for w in words]
print(lengths)   # [5, 6, 5, 6, 6]`,
    explanation: "A set comprehension `{expr for x in iterable}` builds a set, automatically discarding duplicates — it's faster than `list(set(comprehension))` and more explicit about intent.",
  },
  {
    id: "py-0521-b1-pep3107-annotations",
    language: "python",
    title: "function annotations and __annotations__",
    tag: "types",
    code: `def greet(name: str, times: int = 1) -> str:
    return (f"Hello, {name}! " * times).strip()

# Annotations stored in __annotations__
print(greet.__annotations__)
# {'name': <class 'str'>, 'times': <class 'int'>, 'return': <class 'str'>}

# Annotations are not enforced at runtime
result = greet(123, "abc")   # runs without error
print(result)   # but produces garbled output at runtime`,
    explanation: "Python type annotations are metadata only — the interpreter ignores them at runtime; enforcement requires type checkers (mypy, pyright) or runtime validation libraries (pydantic, beartype).",
  },
  {
    id: "py-0521-b1-complex-numbers",
    language: "python",
    title: "complex number arithmetic",
    tag: "types",
    code: `z1 = 3 + 4j
z2 = 1 - 2j

print(z1 + z2)       # (4+2j)
print(z1 * z2)       # (11-2j)
print(abs(z1))       # 5.0  (magnitude = sqrt(3²+4²))

import cmath
print(cmath.phase(z1))    # 0.9272952...  (angle in radians)
print(cmath.polar(z1))    # (5.0, 0.9272...)  (r, θ)
print(cmath.sqrt(-1))     # 1j`,
    explanation: "Python has built-in complex number support with `j` suffix — `cmath` provides complex-aware versions of `sqrt`, `exp`, `log`, and trig functions that won't raise `ValueError` for negative inputs.",
  },
  {
    id: "py-0521-b1-multiple-inheritance-mro",
    language: "python",
    title: "MRO (Method Resolution Order) in multiple inheritance",
    tag: "classes",
    code: `class A:
    def hello(self): return "A"

class B(A):
    def hello(self): return "B"

class C(A):
    def hello(self): return "C"

class D(B, C):
    pass

print(D.__mro__)
# (<class 'D'>, <class 'B'>, <class 'C'>, <class 'A'>, <class 'object'>)

print(D().hello())   # "B"  — B comes before C in MRO`,
    explanation: "Python uses the C3 linearization algorithm to compute the MRO — `D.__mro__` shows the exact search order for method lookup; `super()` always follows the MRO, making cooperative multiple inheritance work correctly.",
  },
  {
    id: "py-0521-b1-scope-legb",
    language: "python",
    title: "LEGB scope rule: Local, Enclosing, Global, Built-in",
    tag: "understanding",
    code: `x = "global"

def outer():
    x = "enclosing"
    def inner():
        # x = "local"   # uncomment to shadow enclosing
        print(x)        # looks up: Local -> Enclosing -> Global
    inner()

outer()   # prints "enclosing"

print(len)   # Built-in — found in builtins scope
# If you name a var 'len = 5', you shadow the built-in!`,
    explanation: "Python resolves names in the order Local → Enclosing function scopes (innermost first) → Global (module) → Built-in — assigning a name at any level creates a new binding in that scope, shadowing outer ones.",
  },
  {
    id: "py-0521-b1-re-groups",
    language: "python",
    title: "regex named capture groups",
    tag: "snippet",
    code: `import re

pattern = r"(?P<year>\\d{4})-(?P<month>\\d{2})-(?P<day>\\d{2})"
text = "Meeting on 2026-05-21 at 9am"

m = re.search(pattern, text)
if m:
    print(m.group("year"))    # 2026
    print(m.group("month"))   # 05
    print(m.groupdict())      # {'year': '2026', 'month': '05', 'day': '21'}

# findall with groups returns list of tuples
dates = re.findall(r"(\\d{4})-(\\d{2})-(\\d{2})", text)
print(dates)   # [('2026', '05', '21')]`,
    explanation: "Named groups `(?P<name>...)` let you access matches by name instead of index — `m.groupdict()` returns all named captures as a dict, making pattern parsing self-documenting.",
  },
  {
    id: "py-0521-b1-dunder-hash",
    language: "python",
    title: "__hash__ and __eq__ contract",
    tag: "classes",
    code: `class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y

    def __eq__(self, other):
        return isinstance(other, Point) and (self.x, self.y) == (other.x, other.y)

    def __hash__(self):
        return hash((self.x, self.y))   # consistent with __eq__

p1 = Point(1, 2)
p2 = Point(1, 2)
print(p1 == p2)                        # True
print({p1, p2})                        # {Point}  — treated as one
print({p1: "a"}[p2])                   # "a"`,
    explanation: "If two objects are equal (`__eq__`), they MUST have the same hash (`__hash__`) — Python sets and dicts rely on this contract; defining `__eq__` without `__hash__` sets `__hash__` to `None`, making instances unhashable.",
  },
  {
    id: "py-0521-b1-conditional-import",
    language: "python",
    title: "conditional imports for optional dependencies",
    tag: "snippet",
    code: `try:
    import ujson as json    # fast C extension
except ImportError:
    import json             # fallback to stdlib

data = json.dumps({"key": "value"})
print(data)

# Or: check for optional feature
try:
    from typing import Protocol
except ImportError:
    from typing_extensions import Protocol   # backport

# TYPE_CHECKING guard for type-only imports (avoids circular imports)
from __future__ import annotations
from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from mymodule import HeavyClass`,
    explanation: "Try/except ImportError provides graceful fallback when optional dependencies aren't installed; `TYPE_CHECKING` guards prevent circular import errors for type annotations that are only needed at analysis time.",
  },
  {
    id: "py-0521-b1-vars-dir",
    language: "python",
    title: "vars() and dir() for introspection",
    tag: "snippet",
    code: `class Config:
    host = "localhost"
    def __init__(self):
        self.port = 8080
        self.debug = True

c = Config()

print(vars(c))        # {'port': 8080, 'debug': True}  (instance __dict__)
print(vars(Config))   # mappingproxy({'host': 'localhost', '__init__': ...})

# dir() lists all accessible names including inherited
attrs = [a for a in dir(c) if not a.startswith("_")]
print(attrs)   # ['debug', 'host', 'port']`,
    explanation: "`vars(obj)` returns the instance `__dict__` (writable attributes only); `dir(obj)` returns all accessible names including class attributes and inherited ones — useful for dynamic dispatch and debugging.",
  },
  {
    id: "py-0521-b1-fractions",
    language: "python",
    title: "fractions.Fraction for exact rational arithmetic",
    tag: "types",
    code: `from fractions import Fraction

a = Fraction(1, 3)
b = Fraction(1, 6)

print(a + b)          # 1/2
print(a * b)          # 1/18
print(float(a + b))   # 0.5

# From string
pi_approx = Fraction("355/113")
print(float(pi_approx))   # 3.1415929...

# From float (shows exact representation)
print(Fraction(0.1))  # 3602879701896397/36028797018963968`,
    explanation: "`Fraction` stores numerator and denominator as integers and reduces automatically — it gives exact rational arithmetic where `float` would accumulate errors, at the cost of being slower than `Decimal` for money.",
  },
  {
    id: "py-0521-b1-match-guard",
    language: "python",
    title: "match with guards and OR patterns",
    tag: "snippet",
    code: `def classify(point: tuple) -> str:
    match point:
        case (0, 0):
            return "origin"
        case (x, 0) | (0, x):       # OR pattern
            return f"on axis at {x}"
        case (x, y) if x == y:      # guard
            return f"on diagonal at {x}"
        case (x, y):
            return f"point ({x}, {y})"

print(classify((0, 0)))     # origin
print(classify((3, 0)))     # on axis at 3
print(classify((4, 4)))     # on diagonal at 4
print(classify((1, 2)))     # point (1, 2)`,
    explanation: "Match guards (`if condition`) add arbitrary boolean tests after a pattern; OR patterns (`pat1 | pat2`) match either alternative — they can't bind different names on each side.",
  },
  {
    id: "py-0521-b1-string-interning",
    language: "python",
    title: "sys.intern for string interning",
    tag: "caveats",
    code: `import sys

# Automatic interning for identifier-like strings
a = "hello"
b = "hello"
print(a is b)   # True — CPython interns automatically

# Not interned by default
x = "hello world"
y = "hello world"
print(x is y)   # False (usually)

# Force interning
xi = sys.intern("hello world")
yi = sys.intern("hello world")
print(xi is yi)   # True
# Useful for large sets of repeated strings (e.g. column names)`,
    explanation: "`sys.intern` stores a single canonical copy of a string in a global table — subsequent interned strings with the same value point to the same object, making identity comparison (`is`) as fast as an integer compare.",
  },
  {
    id: "py-0521-b1-pep526-variable-annotations",
    language: "python",
    title: "variable annotations (PEP 526)",
    tag: "types",
    code: `# Module level
count: int = 0
name: str   # declared but not assigned (no AttributeError yet)

# Class level
class User:
    id: int
    username: str
    active: bool = True

    def __init__(self, id: int, username: str):
        self.id = id
        self.username = username

# Check annotations dict
print(User.__annotations__)
# {'id': <class 'int'>, 'username': <class 'str'>, 'active': <class 'bool'>}`,
    explanation: "Variable annotations store type metadata in `__annotations__` without enforcing them — they're used by dataclasses, SQLAlchemy, Pydantic, and other frameworks to drive code generation from class definitions.",
  },
  {
    id: "py-0521-b1-overwrite-builtins",
    language: "python",
    title: "shadowing builtins: a common gotcha",
    tag: "caveats",
    code: `# These all silently shadow the built-in!
list = [1, 2, 3]     # now list() is broken in this scope
# list(range(5))       # TypeError: 'list' object is not callable

# Restore via builtins module
import builtins
print(builtins.list(range(5)))   # [0, 1, 2, 3, 4]

# Common accidental shadowing
id   = "user-123"    # shadows id()
type = "image/png"   # shadows type()
sum  = 0             # shadows sum()
# Choose: uid, content_type, total instead`,
    explanation: "Python built-ins are just names in the `builtins` module — any local variable with the same name shadows them silently for the rest of the scope; use `builtins.name` to recover the original.",
  },
  {
    id: "py-0521-b1-with-multiple",
    language: "python",
    title: "multiple context managers in one with statement",
    tag: "snippet",
    code: `# Before Python 3.10: requires backslash continuation or nesting
with open("a.txt", "w") as a, open("b.txt", "w") as b:
    a.write("hello")
    b.write("world")

# Python 3.10+: parenthesized form
with (
    open("a.txt", "r") as a,
    open("b.txt", "r") as b,
):
    print(a.read(), b.read())   # hello world

# contextlib.ExitStack for dynamic number of contexts
from contextlib import ExitStack
files = ["a.txt", "b.txt"]
with ExitStack() as stack:
    handles = [stack.enter_context(open(f)) for f in files]`,
    explanation: "Multiple comma-separated context managers in one `with` share the same indentation level and exit in reverse order; `ExitStack` handles a variable number of contexts determined at runtime.",
  },
  {
    id: "py-0521-b1-typing-final",
    language: "python",
    title: "Final and @final for preventing override",
    tag: "types",
    code: `from typing import Final, final

MAX_RETRIES: Final[int] = 3
# MAX_RETRIES = 5   # type checker error

class Base:
    @final
    def critical(self):     # cannot be overridden
        return "base"

class Child(Base):
    pass
    # def critical(self): ...  # type checker error

@final
class Sealed:
    pass

# class Sub(Sealed): ...   # type checker error`,
    explanation: "`Final` marks a variable as a constant (assignment is a type error); `@final` on a method prevents subclass overriding; `@final` on a class prevents subclassing — all enforced by type checkers, not at runtime.",
  },
  {
    id: "py-0521-b1-thread-lock",
    language: "python",
    title: "threading.Lock to protect shared state",
    tag: "caveats",
    code: `import threading

counter = 0
lock = threading.Lock()

def increment(n: int):
    global counter
    for _ in range(n):
        with lock:           # acquire, do work, release
            counter += 1

threads = [threading.Thread(target=increment, args=(10_000,)) for _ in range(5)]
for t in threads: t.start()
for t in threads: t.join()

print(counter)   # 50000  (always correct with lock)`,
    explanation: "`threading.Lock` as a context manager (`with lock`) atomically acquires the lock before the block and releases it on exit — without it, `counter += 1` (read-increment-write) is a race condition.",
  },
  {
    id: "py-0521-b1-functools-reduce",
    language: "python",
    title: "functools.reduce for fold operations",
    tag: "snippet",
    code: `from functools import reduce
import operator

nums = [1, 2, 3, 4, 5]

# Sum (better: use built-in sum())
total = reduce(operator.add, nums)
print(total)   # 15

# Product (no built-in — reduce shines here)
product = reduce(operator.mul, nums)
print(product)   # 120

# Max (better: use built-in max())
largest = reduce(lambda a, b: a if a > b else b, nums)
print(largest)   # 5

# Flatten nested list
nested = [[1, 2], [3, 4], [5]]
flat = reduce(operator.add, nested)
print(flat)   # [1, 2, 3, 4, 5]`,
    explanation: "`reduce(f, [a, b, c, d])` computes `f(f(f(a,b),c),d)` — a left fold; use built-in `sum`/`max`/`min` when they exist, and reach for `reduce` when you need a custom binary accumulation.",
  },
  {
    id: "py-0521-b1-pep634-seq-pattern",
    language: "python",
    title: "match: sequence pattern with star",
    tag: "snippet",
    code: `def process(cmd: list) -> str:
    match cmd:
        case ["quit"]:
            return "quitting"
        case ["go", direction]:
            return f"going {direction}"
        case ["go", *directions]:
            return f"going {' then '.join(directions)}"
        case ["pick", "up", *items]:
            return f"picking up {items}"
        case _:
            return "unknown"

print(process(["go", "north"]))           # going north
print(process(["go", "north", "east"]))   # going north then east
print(process(["pick", "up", "sword"]))   # picking up ['sword']`,
    explanation: "Sequence patterns match list/tuple structure positionally; the `*name` capture collects remaining elements (like starred unpacking) — the pattern must match the full sequence unless `*` absorbs the remainder.",
  },
  {
    id: "py-0521-b1-object-copying",
    language: "python",
    title: "shallow vs deep copy",
    tag: "caveats",
    code: `import copy

original = [[1, 2], [3, 4]]

shallow = copy.copy(original)        # new outer list, same inner lists
deep    = copy.deepcopy(original)    # entirely new objects

shallow[0].append(99)
print(original[0])   # [1, 2, 99]  <- shallow copy shares inner list!

deep[1].append(99)
print(original[1])   # [3, 4]      <- deep copy is fully independent`,
    explanation: "`copy.copy` creates a new container but keeps references to the same nested objects; `copy.deepcopy` recursively copies everything — use deep copy when nested mutable objects must be independent.",
  },
  {
    id: "py-0521-b1-typing-self",
    language: "python",
    title: "Self type for return type in subclasses",
    tag: "types",
    code: `from typing import Self

class Builder:
    def __init__(self):
        self.parts: list[str] = []

    def add(self, part: str) -> Self:   # returns the actual subclass type
        self.parts.append(part)
        return self

class AdvancedBuilder(Builder):
    def validate(self) -> Self:
        assert self.parts, "empty"
        return self

result = AdvancedBuilder().add("A").add("B").validate()
print(result.parts)   # ['A', 'B']
print(type(result))   # <class 'AdvancedBuilder'>`,
    explanation: "`Self` (Python 3.11+) in a return annotation means \"the actual type of self\" — in a subclass, `Self` resolves to the subclass rather than the base class, making method-chaining builders type-safe.",
  },
  {
    id: "py-0521-b1-unpacking-nested",
    language: "python",
    title: "nested tuple unpacking",
    tag: "snippet",
    code: `# Nested unpacking mirrors the structure
(a, (b, c), d) = (1, (2, 3), 4)
print(a, b, c, d)   # 1 2 3 4

# Works in for loops
pairs = [(1, (2, 3)), (4, (5, 6))]
for x, (y, z) in pairs:
    print(x, y, z)   # 1 2 3 / 4 5 6

# Practical: unpack CSV rows
rows = [("Alice", (25, "F")), ("Bob", (30, "M"))]
for name, (age, gender) in rows:
    print(f"{name}: {age} {gender}")`,
    explanation: "Python's assignment unpacking mirrors arbitrary nesting — the target structure must match the value structure exactly, making it a concise way to destructure complex tuples without intermediate variables.",
  },
  {
    id: "py-0521-b1-importlib-metadata",
    language: "python",
    title: "importlib.metadata for package version info",
    tag: "snippet",
    code: `from importlib.metadata import version, packages_distributions

# Get installed version of a package
print(version("pip"))        # e.g. "24.0"
print(version("setuptools")) # e.g. "69.5.1"

# Map top-level modules to their distribution packages
dist_map = packages_distributions()
print(dist_map.get("requests"))   # ['requests']

# Replaces the old pkg_resources approach
# import pkg_resources
# pkg_resources.get_distribution("pip").version`,
    explanation: "`importlib.metadata` (stdlib since 3.8) reads installed package metadata without importing the package itself — prefer it over `pkg_resources` (setuptools) which is heavier and slower to import.",
  },
  {
    id: "py-0521-b1-dataclass-post-init",
    language: "python",
    title: "dataclass __post_init__ for validation",
    tag: "classes",
    code: `from dataclasses import dataclass

@dataclass
class Percentage:
    value: float

    def __post_init__(self):
        if not 0.0 <= self.value <= 100.0:
            raise ValueError(f"Percentage must be 0-100, got {self.value}")
        self.value = round(self.value, 2)   # normalize

p = Percentage(99.999)
print(p.value)   # 100.0

try:
    Percentage(101)
except ValueError as e:
    print(e)   # Percentage must be 0-100, got 101`,
    explanation: "`__post_init__` is called by the dataclass-generated `__init__` after all fields are assigned — it's the right place for cross-field validation or derived-field initialization.",
  },
  {
    id: "py-0521-b1-isinstance-tuple",
    language: "python",
    title: "isinstance with a tuple of types",
    tag: "snippet",
    code: `def numeric(value):
    return isinstance(value, (int, float, complex))

print(numeric(42))      # True
print(numeric(3.14))    # True
print(numeric(2+3j))    # True
print(numeric("9"))     # False

# Better than chained or's:
# isinstance(x, int) or isinstance(x, float) or isinstance(x, complex)

# Also works with issubclass
print(issubclass(bool, (int, float)))   # True — bool subclasses int`,
    explanation: "`isinstance(obj, (A, B, C))` is equivalent to `isinstance(obj, A) or isinstance(obj, B) or isinstance(obj, C)` but reads as a single atomic check — note `bool` is a subclass of `int`.",
  },
  {
    id: "py-0521-b1-ternary-expression",
    language: "python",
    title: "ternary conditional expression",
    tag: "snippet",
    code: `x = 10
label = "positive" if x > 0 else "non-positive"
print(label)   # positive

# Nested (avoid deep nesting — use match or if/elif instead)
sign = "pos" if x > 0 else ("zero" if x == 0 else "neg")
print(sign)    # pos

# Common use: default value when something might be falsy
def greet(name=None):
    display = name if name else "stranger"
    # Better: name or "stranger"
    return f"Hello, {display}"

print(greet())        # Hello, stranger
print(greet("Ali"))   # Hello, Ali`,
    explanation: "Python's ternary expression is `value_if_true if condition else value_if_false` — it evaluates lazily (only one branch runs) and fits naturally into list/dict comprehensions and argument lists.",
  },
  {
    id: "py-0521-b1-contextmanager-decorator",
    language: "python",
    title: "@contextmanager generator-based context manager",
    tag: "classes",
    code: `from contextlib import contextmanager
import os

@contextmanager
def cd(path: str):
    """Temporarily change working directory."""
    original = os.getcwd()
    os.chdir(path)
    try:
        yield path         # value bound by 'as'
    finally:
        os.chdir(original) # always restore, even if exception

with cd("/tmp") as p:
    print(p, os.getcwd())  # /tmp /tmp
print(os.getcwd())         # original dir restored`,
    explanation: "`@contextmanager` wraps a generator: code before `yield` is `__enter__`, code after is `__exit__` — the `try/finally` ensures cleanup runs even when an exception is raised inside the `with` block.",
  },
  {
    id: "py-0521-b1-sum-initial",
    language: "python",
    title: "sum() with start value for flattening",
    tag: "snippet",
    code: `# Sum numbers
print(sum([1, 2, 3, 4]))          # 10
print(sum(range(101)))             # 5050

# Sum with start value
print(sum([1, 2, 3], start=10))   # 16

# Flatten list of lists (works but O(n²) — prefer itertools.chain)
nested = [[1, 2], [3, 4], [5]]
flat = sum(nested, start=[])
print(flat)   # [1, 2, 3, 4, 5]
# WARNING: don't do this for large lists — each + copies the list`,
    explanation: "`sum(iterable, start)` uses `start` as the initial accumulator — passing `[]` concatenates lists but is O(n²) because each `+` copies; use `list(itertools.chain.from_iterable(nested))` for large inputs.",
  },
  {
    id: "py-0521-b1-getattr-setattr",
    language: "python",
    title: "getattr/setattr for dynamic attribute access",
    tag: "snippet",
    code: `class Config:
    host = "localhost"
    port = 8080
    debug = False

cfg = Config()

# Dynamic access
attr = "port"
print(getattr(cfg, attr))               # 8080
print(getattr(cfg, "unknown", "N/A"))   # N/A  (default)

# Dynamic assignment
setattr(cfg, "port", 9090)
print(cfg.port)   # 9090

# Useful for building dispatch tables
fields = ["host", "port", "debug"]
values = {f: getattr(cfg, f) for f in fields}
print(values)`,
    explanation: "`getattr(obj, name, default)` and `setattr(obj, name, value)` let you access and set attributes by string name — essential for dynamic dispatch, serialization, and configuration mapping.",
  },
  {
    id: "py-0521-b1-min-max-key",
    language: "python",
    title: "min/max with key function",
    tag: "snippet",
    code: `words = ["banana", "fig", "apple", "kiwi"]

print(min(words))                      # apple   (lexicographic)
print(min(words, key=len))             # fig     (shortest)
print(max(words, key=len))             # banana  (longest)

# Multiple keys via tuple
print(min(words, key=lambda w: (len(w), w)))  # fig

# With default (avoids ValueError on empty)
print(min([], default="empty"))   # empty`,
    explanation: "`min`/`max` accept a `key` function that transforms each element before comparison — the original element (not the key) is returned; `default` prevents `ValueError` when the iterable is empty.",
  },
  {
    id: "py-0521-b1-class-init-subclass",
    language: "python",
    title: "__init_subclass__ for plugin registration",
    tag: "classes",
    code: `class Plugin:
    _registry: dict[str, type] = {}

    def __init_subclass__(cls, name: str, **kwargs):
        super().__init_subclass__(**kwargs)
        Plugin._registry[name] = cls

class JSONPlugin(Plugin, name="json"):
    def process(self): return "json"

class XMLPlugin(Plugin, name="xml"):
    def process(self): return "xml"

print(Plugin._registry)
# {'json': <class 'JSONPlugin'>, 'xml': <class 'XMLPlugin'>}

plugin = Plugin._registry["json"]()
print(plugin.process())   # json`,
    explanation: "`__init_subclass__` is called on the base class whenever a subclass is created — it's the cleanest way to auto-register subclasses in a plugin registry without metaclasses or manual `register()` calls.",
  },
  {
    id: "py-0521-b1-itertools-groupby",
    language: "python",
    title: "itertools.groupby for contiguous grouping",
    tag: "structures",
    code: `from itertools import groupby

# IMPORTANT: input must be sorted by the key first
data = [("a", 1), ("a", 2), ("b", 3), ("b", 4), ("a", 5)]
data.sort(key=lambda x: x[0])

for key, group in groupby(data, key=lambda x: x[0]):
    print(key, list(group))
# a [('a', 1), ('a', 2), ('a', 5)]
# b [('b', 3), ('b', 4)]`,
    explanation: "`groupby` groups consecutive elements with the same key — it does NOT sort, so you must sort by the key first; the group objects are one-time iterators that expire when you advance to the next group.",
  },
  {
    id: "py-0521-b1-pep673-self-type",
    language: "python",
    title: "type narrowing with TypeGuard",
    tag: "types",
    code: `from typing import TypeGuard

def is_str_list(val: list) -> TypeGuard[list[str]]:
    return all(isinstance(x, str) for x in val)

def process(items: list[int] | list[str]) -> None:
    if is_str_list(items):
        # type checker narrows: items is list[str] here
        print(items[0].upper())
    else:
        print(items[0] + 1)

process(["hello", "world"])   # HELLO
process([1, 2, 3])            # 2`,
    explanation: "`TypeGuard[T]` in a return annotation tells type checkers that when the function returns `True`, the argument has been narrowed to type `T` — enabling user-defined type narrowing beyond simple `isinstance` checks.",
  },
  {
    id: "py-0521-b1-str-partition",
    language: "python",
    title: "str.partition for single-split parsing",
    tag: "snippet",
    code: `url = "https://example.com/path?query=1"

# partition splits at FIRST occurrence, always returns 3-tuple
scheme, sep, rest = url.partition("://")
print(scheme)   # https
print(sep)      # ://
print(rest)     # example.com/path?query=1

# If separator not found: ("original", "", "")
left, sep2, right = "no-sep-here".partition("://")
print(left, repr(sep2), right)   # no-sep-here ''

# rpartition splits at LAST occurrence
name, _, ext = "archive.tar.gz".rpartition(".")
print(name, ext)   # archive.tar gz`,
    explanation: "`partition` always returns exactly three strings (before, sep, after), making the separator detection and result unpacking a single statement — `rpartition` does the same from the right.",
  },
  {
    id: "py-0521-b1-iter-tools-pairwise",
    language: "python",
    title: "itertools.pairwise for sliding pairs",
    tag: "snippet",
    code: `from itertools import pairwise  # Python 3.10+

data = [10, 20, 15, 30, 25]

# Get consecutive pairs
for a, b in pairwise(data):
    print(f"{a} -> {b} (delta {b - a:+})")
# 10 -> 20 (delta +10)
# 20 -> 15 (delta -5)
# 15 -> 30 (delta +15)
# 30 -> 25 (delta -5)

# Detect increases
increases = sum(1 for a, b in pairwise(data) if b > a)
print(increases)   # 2`,
    explanation: "`pairwise(iterable)` yields `(s[i], s[i+1])` pairs — the equivalent of `zip(s, s[1:])` but without materializing the slice; useful for difference sequences, trend detection, and graph edge iteration.",
  },
  {
    id: "py-0521-b1-assignment-expr-while",
    language: "python",
    title: "walrus in while loop avoids duplicate call",
    tag: "snippet",
    code: `import random

# Without walrus
def roll():
    return random.randint(1, 6)

result = roll()
while result != 6:
    print(f"rolled {result}")
    result = roll()

# With walrus (Python 3.8+) — cleaner
while (result := roll()) != 6:
    print(f"rolled {result}")

print("Got a 6!")`,
    explanation: "The walrus operator `:=` assigns and tests in the `while` condition, eliminating the \"prime before loop, assign at end\" pattern — the variable is also available inside the loop body.",
  },
  {
    id: "py-0521-b1-enum-basics",
    language: "python",
    title: "enum.Enum for named constants",
    tag: "types",
    code: `from enum import Enum, auto

class Direction(Enum):
    NORTH = auto()
    SOUTH = auto()
    EAST  = auto()
    WEST  = auto()

d = Direction.NORTH
print(d)           # Direction.NORTH
print(d.name)      # NORTH
print(d.value)     # 1

# Enum members are singletons
print(d is Direction.NORTH)   # True
print(d == Direction.NORTH)   # True

for direction in Direction:
    print(direction.name, direction.value)`,
    explanation: "`Enum` creates named constants that are proper objects — they're singletons, support iteration, and can be used in `match` patterns; `auto()` assigns sequential integer values automatically.",
  },
  {
    id: "py-0521-b1-map-filter",
    language: "python",
    title: "map() and filter() return lazy iterators",
    tag: "snippet",
    code: `nums = range(10)

# map applies a function to every element (lazy)
doubled = map(lambda x: x * 2, nums)
print(type(doubled))     # <class 'map'>
print(list(doubled))     # [0, 2, 4, 6, 8, 10, 12, 14, 16, 18]

# filter keeps elements where function is truthy (lazy)
evens = filter(lambda x: x % 2 == 0, range(10))
print(list(evens))       # [0, 2, 4, 6, 8]

# Prefer comprehensions for readability, map/filter for composing
pipeline = filter(lambda x: x > 5, map(lambda x: x * 2, range(10)))
print(list(pipeline))    # [6, 8, 10, 12, 14, 16, 18]`,
    explanation: "`map` and `filter` return lazy iterators — they don't compute until iterated, and can be composed without intermediate lists; list comprehensions are usually preferred for readability when the logic is simple.",
  },
  {
    id: "py-0521-b1-bytearray-mutability",
    language: "python",
    title: "bytes vs bytearray: immutable vs mutable",
    tag: "types",
    code: `# bytes is immutable
b = b"hello"
try:
    b[0] = 72
except TypeError as e:
    print(e)    # 'bytes' object does not support item assignment

# bytearray is mutable
ba = bytearray(b"hello")
ba[0] = 72       # ASCII 'H'
print(bytes(ba)) # b'Hello'

# Efficient in-place modification
ba.extend(b" world")
print(ba)        # bytearray(b'Hello world')

# Convert between them cheaply
again = bytes(ba)
back  = bytearray(b"test")`,
    explanation: "`bytearray` is the mutable counterpart of `bytes` — use it when you need to modify binary data in place (e.g., patching packet headers, building protocol frames) without copying the whole buffer.",
  },
  {
    id: "py-0521-b1-overload-runtime",
    language: "python",
    title: "runtime dispatch with singledispatch",
    tag: "snippet",
    code: `from functools import singledispatch

@singledispatch
def serialize(value) -> str:
    return str(value)

@serialize.register(int)
def _(value: int) -> str:
    return f"int:{value}"

@serialize.register(list)
def _(value: list) -> str:
    return "[" + ", ".join(serialize(v) for v in value) + "]"

print(serialize(42))          # int:42
print(serialize([1, "x"]))    # [int:1, x]
print(serialize(3.14))        # 3.14  (fallback)`,
    explanation: "`@singledispatch` implements generic functions dispatched on the type of the first argument at runtime — `@func.register(Type)` adds type-specific implementations without modifying the original function.",
  },
  {
    id: "py-0521-b1-textwrap",
    language: "python",
    title: "textwrap for wrapping and dedenting strings",
    tag: "snippet",
    code: `import textwrap

long_text = "This is a very long string that should be wrapped at a certain column width."

wrapped = textwrap.fill(long_text, width=40)
print(wrapped)
# This is a very long string that
# should be wrapped at a certain
# column width.

# dedent strips common leading whitespace
code = """
    def hello():
        print("hi")
"""
print(textwrap.dedent(code).strip())
# def hello():
#     print("hi")`,
    explanation: "`textwrap.fill` reflowslots long text to a given width; `textwrap.dedent` strips the common leading whitespace from triple-quoted strings, making embedded code snippets in docstrings look clean.",
  },
  {
    id: "py-0521-b1-format-mini-language-align",
    language: "python",
    title: "format spec: alignment and fill characters",
    tag: "snippet",
    code: `name = "Alice"
score = 97.5

# Alignment: < left, > right, ^ center
print(f"{'Name':<10} {'Score':>8}")     # Name         Score
print(f"{name:<10} {score:>8.1f}")      # Alice           97.5

# Custom fill character
print(f"{'TITLE':*^30}")   # ************TITLE*************

# Zero-padding numbers
for i in [1, 10, 100]:
    print(f"{i:05d}")      # 00001 / 00010 / 00100`,
    explanation: "The format spec `[[fill]align][width]` controls text layout — `fill` defaults to space, `align` is `<`/`>`/`^`, and numeric types accept `0` prefix for zero-padding without a fill character.",
  },
  {
    id: "py-0521-b1-list-multiplication-gotcha",
    language: "python",
    title: "list multiplication creates shared references",
    tag: "caveats",
    code: `# Flat lists: fine
row = [0] * 5
print(row)   # [0, 0, 0, 0, 0]

# 2D grid: WRONG — all rows are the same list!
grid_bad = [[0] * 3] * 4
grid_bad[0][0] = 1
print(grid_bad)
# [[1, 0, 0], [1, 0, 0], [1, 0, 0], [1, 0, 0]]   <- all changed!

# Correct: list comprehension creates independent lists
grid_ok = [[0] * 3 for _ in range(4)]
grid_ok[0][0] = 1
print(grid_ok)
# [[1, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]]`,
    explanation: "`[row] * n` repeats the same object reference n times — mutating one row mutates all; a comprehension `[expr for _ in range(n)]` creates n independent objects.",
  },
  {
    id: "py-0521-b1-zip-dict",
    language: "python",
    title: "zip to build a dict from two lists",
    tag: "snippet",
    code: `keys   = ["host", "port", "debug"]
values = ["localhost", 8080, True]

# dict() on a zip iterator
config = dict(zip(keys, values))
print(config)   # {'host': 'localhost', 'port': 8080, 'debug': True}

# Or as a dict comprehension (useful when you transform values)
config2 = {k: v for k, v in zip(keys, values)}

# Transposing: zip(*matrix) swaps rows and columns
matrix = [(1, 2, 3), (4, 5, 6)]
transposed = list(zip(*matrix))
print(transposed)   # [(1, 4), (2, 5), (3, 6)]`,
    explanation: "`dict(zip(keys, values))` pairs up two parallel sequences into a mapping in one expression; `zip(*matrix)` with splat unpacking is the idiomatic transpose of a rectangular 2D sequence.",
  },
  {
    id: "py-0521-b1-truthy-falsy",
    language: "python",
    title: "truthy and falsy values: what counts as False",
    tag: "understanding",
    code: `falsy = [None, False, 0, 0.0, 0j, "", b"", [], (), {}, set(), range(0)]
for v in falsy:
    print(f"{v!r:15} -> {bool(v)}")

# Custom objects: define __bool__ or __len__
class Empty:
    def __bool__(self): return False

print(bool(Empty()))   # False

# Common idiom: test for non-empty
items = []
if not items:
    print("empty list")   # printed`,
    explanation: "Python's truthiness test calls `__bool__`, then falls back to `__len__` — if neither is defined the object is always truthy; the falsy set covers `None`, zero, empty containers, and empty ranges.",
  },
  {
    id: "py-0521-b1-struct-pack",
    language: "python",
    title: "struct.pack for binary protocol encoding",
    tag: "snippet",
    code: `import struct

# '>I' = big-endian unsigned int (4 bytes)
packed = struct.pack(">IHH", 42, 1234, 5678)
print(packed.hex())   # 0000002a04d21632

# Unpack
magic, major, minor = struct.unpack(">IHH", packed)
print(magic, major, minor)   # 42 1234 5678

# Struct size
print(struct.calcsize(">IHH"))   # 8 bytes

# Named fields via Struct object
header_fmt = struct.Struct(">HI")
data = header_fmt.pack(0xFF, 1024)
print(header_fmt.unpack(data))   # (255, 1024)`,
    explanation: "`struct.pack/unpack` serializes Python values to/from binary byte strings using format strings — essential for reading file headers, network protocols, and interfacing with C structures.",
  },
  {
    id: "py-0521-b1-global-keyword",
    language: "python",
    title: "global keyword: when (not) to use it",
    tag: "understanding",
    code: `count = 0

def increment():
    global count    # without this, creates a local 'count'
    count += 1

increment()
increment()
print(count)   # 2

# Preferred: return the new value instead
def pure_increment(n: int) -> int:
    return n + 1

count = pure_increment(count)
print(count)   # 3

# Prefer function arguments and return values over global state`,
    explanation: "`global` lets a function rebind a module-level name — but mutable global state is hard to test and reason about; prefer passing values as arguments and returning results, using `global` only when absolutely necessary.",
  },
  {
    id: "py-0521-b1-ord-chr",
    language: "python",
    title: "ord() and chr() for character/codepoint conversion",
    tag: "snippet",
    code: `print(ord("A"))    # 65
print(ord("a"))    # 97
print(ord("€"))    # 8364

print(chr(65))     # A
print(chr(0x1F600)) # 😀

# Caesar cipher using ord/chr
def caesar(text: str, shift: int) -> str:
    result = []
    for ch in text:
        if ch.isalpha():
            base = ord("A") if ch.isupper() else ord("a")
            result.append(chr((ord(ch) - base + shift) % 26 + base))
        else:
            result.append(ch)
    return "".join(result)

print(caesar("Hello, World!", 13))   # Uryyb, Jbeyq!`,
    explanation: "`ord(ch)` returns the Unicode code point of a single character; `chr(n)` converts a code point back to a character — together they enable arithmetic on character positions like Caesar ciphers.",
  },
  {
    id: "py-0521-b1-slots-inheritance",
    language: "python",
    title: "__slots__ and inheritance pitfalls",
    tag: "classes",
    code: `class Base:
    __slots__ = ("x",)
    def __init__(self, x): self.x = x

class Child(Base):
    __slots__ = ("y",)   # must redeclare; don't repeat "x"
    def __init__(self, x, y):
        super().__init__(x)
        self.y = y

c = Child(1, 2)
print(c.x, c.y)   # 1 2

# If Child omits __slots__, it gets a __dict__ (negating savings)
class BadChild(Base):
    pass    # has __dict__ even though Base uses slots

bc = BadChild(1)
bc.extra = "oops"   # works — has __dict__`,
    explanation: "Every class in a `__slots__` chain must define its own `__slots__` — if any subclass omits it, that class gets a `__dict__`, which re-introduces the per-instance memory overhead slots were meant to avoid.",
  },
  {
    id: "py-0521-b1-typing-never",
    language: "python",
    title: "Never type for unreachable code and exhaustive checks",
    tag: "types",
    code: `from typing import Never, NoReturn
from enum import Enum

class Color(Enum):
    RED   = 1
    GREEN = 2
    BLUE  = 3

def assert_never(value: Never) -> Never:
    raise AssertionError(f"Unexpected value: {value}")

def describe_color(c: Color) -> str:
    match c:
        case Color.RED:   return "red"
        case Color.GREEN: return "green"
        case Color.BLUE:  return "blue"
        case _:           assert_never(c)  # type error if Color gains a member`,
    explanation: "`Never` is the bottom type — a function annotated `Never` never returns normally; used with `assert_never`, type checkers flag the `case _` branch as reachable if you forget to handle a new enum member.",
  },
  {
    id: "py-0521-b1-string-prefix-suffix",
    language: "python",
    title: "str.removeprefix and removesuffix (Python 3.9+)",
    tag: "snippet",
    code: `url = "https://example.com"
path = "user_report_2026.csv"

# Old way
if url.startswith("https://"):
    domain = url[len("https://"):]

# New way (does nothing if prefix absent — unlike lstrip)
domain = url.removeprefix("https://")
print(domain)    # example.com

stem = path.removesuffix(".csv")
print(stem)      # user_report_2026

# lstrip is NOT the same — it strips chars, not substrings
print("https".lstrip("h"))   # ttps  (strips each char)`,
    explanation: "`removeprefix`/`removesuffix` strip an exact substring once, returning the original string unchanged if it doesn't match — unlike `lstrip`/`rstrip` which repeatedly strip individual characters from a set.",
  },
  {
    id: "py-0521-b1-recursion-limit",
    language: "python",
    title: "recursion limit and sys.setrecursionlimit",
    tag: "caveats",
    code: `import sys

print(sys.getrecursionlimit())   # 1000 (default)

def countdown(n):
    if n <= 0: return
    countdown(n - 1)

try:
    countdown(2000)              # exceeds default limit
except RecursionError as e:
    print(e)   # maximum recursion depth exceeded

# Increase for deep recursive algorithms
sys.setrecursionlimit(5000)
countdown(2000)   # now works

# Better: convert to iteration with explicit stack`,
    explanation: "CPython limits recursion to ~1000 frames to prevent C-stack overflow — `sys.setrecursionlimit` raises it but doesn't eliminate the C stack constraint; for very deep recursion, refactor to an explicit iterative loop.",
  },
  {
    id: "py-0521-b1-pprint",
    language: "python",
    title: "pprint for readable output of nested structures",
    tag: "snippet",
    code: `from pprint import pprint, pformat

data = {
    "users": [
        {"id": 1, "name": "Alice", "scores": [90, 85, 92]},
        {"id": 2, "name": "Bob",   "scores": [78, 80, 88]},
    ],
    "count": 2,
}

# Compact but unreadable
print(data)

# Pretty-printed with indentation
pprint(data, indent=2, width=50)

# pformat returns the string instead of printing
s = pformat(data)
print(type(s))   # <class 'str'>`,
    explanation: "`pprint` wraps the output at a configurable width and indents nested structures — invaluable for debugging large dicts, JSON responses, or deeply nested objects; `pformat` returns it as a string.",
  },
];
