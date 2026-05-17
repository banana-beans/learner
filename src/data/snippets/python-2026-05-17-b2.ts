import type { Snippet } from "./types";

export const pythonSnippets20260517B2: Snippet[] = [
  // === snippet ===
  {
    id: "py-b17-b2-itertools-chain",
    language: "python",
    title: "itertools.chain flattens multiple iterables",
    tag: "snippet",
    code: `import itertools

a = [1, 2, 3]
b = (4, 5)
c = range(6, 9)

combined = list(itertools.chain(a, b, c))
print(combined)  # [1, 2, 3, 4, 5, 6, 7, 8]

# chain.from_iterable for a single iterable of iterables:
nested = [[1, 2], [3, 4], [5]]
flat = list(itertools.chain.from_iterable(nested))
print(flat)  # [1, 2, 3, 4, 5]`,
    explanation: "`itertools.chain(*iterables)` lazily concatenates multiple iterables without creating intermediate lists; `chain.from_iterable` handles a single iterable of iterables.",
  },
  {
    id: "py-b17-b2-itertools-islice",
    language: "python",
    title: "itertools.islice — lazy slicing of any iterable",
    tag: "snippet",
    code: `import itertools

def infinite_integers():
    n = 0
    while True:
        yield n
        n += 1

# Take first 5 from an infinite generator (can't subscript a generator):
first5 = list(itertools.islice(infinite_integers(), 5))
print(first5)  # [0, 1, 2, 3, 4]

# islice(iterable, start, stop, step):
result = list(itertools.islice(range(100), 10, 20, 2))
print(result)  # [10, 12, 14, 16, 18]`,
    explanation: "`itertools.islice` extracts a slice from any iterator without materializing it; unlike list slicing it works on infinite generators and requires no random access.",
  },
  {
    id: "py-b17-b2-itertools-groupby",
    language: "python",
    title: "itertools.groupby groups consecutive elements",
    tag: "snippet",
    code: `import itertools

# Input MUST be sorted by the key first:
data = [("a", 1), ("a", 2), ("b", 3), ("b", 4), ("c", 5)]

for key, group in itertools.groupby(data, key=lambda x: x[0]):
    print(key, list(group))
# a [('a', 1), ('a', 2)]
# b [('b', 3), ('b', 4)]
# c [('c', 5)]`,
    explanation: "`itertools.groupby` groups *consecutive* equal keys — if your data isn't pre-sorted by the key, non-adjacent equal keys produce separate groups; sort first with `sorted(data, key=...)` if needed.",
  },
  {
    id: "py-b17-b2-functools-lru-cache",
    language: "python",
    title: "functools.lru_cache for memoization",
    tag: "snippet",
    code: `from functools import lru_cache

@lru_cache(maxsize=128)
def fibonacci(n: int) -> int:
    if n < 2:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

print(fibonacci(50))       # 12586269025 — fast!
print(fibonacci.cache_info())  # CacheInfo(hits=48, misses=51, maxsize=128, currsize=51)

@lru_cache(maxsize=None)   # unbounded cache — use with caution
def factorial(n):
    return 1 if n == 0 else n * factorial(n - 1)`,
    explanation: "`@lru_cache` memoizes function results by argument values (arguments must be hashable); `maxsize=None` disables eviction for pure mathematical functions with bounded input ranges.",
  },
  {
    id: "py-b17-b2-contextlib-suppress",
    language: "python",
    title: "contextlib.suppress silences specific exceptions",
    tag: "snippet",
    code: `from contextlib import suppress
import os

# Instead of:
try:
    os.remove("maybe_missing.txt")
except FileNotFoundError:
    pass

# Use suppress:
with suppress(FileNotFoundError):
    os.remove("maybe_missing.txt")

# Suppress multiple exceptions:
with suppress(KeyError, AttributeError):
    d = {}
    _ = d["key"]["nested"]`,
    explanation: "`contextlib.suppress(*exceptions)` is a context manager that silently swallows the listed exception types — cleaner than a bare try/except/pass for expected no-op cases.",
  },
  {
    id: "py-b17-b2-operator-itemgetter",
    language: "python",
    title: "operator.itemgetter as a fast extraction key",
    tag: "snippet",
    code: `from operator import itemgetter, attrgetter

records = [
    {"name": "Alice", "age": 30, "score": 88},
    {"name": "Bob",   "age": 25, "score": 95},
    {"name": "Carol", "age": 35, "score": 72},
]

# Sort by score descending:
by_score = sorted(records, key=itemgetter("score"), reverse=True)
print([r["name"] for r in by_score])  # ['Bob', 'Alice', 'Carol']

# Multi-key sort: age then name
by_age_name = sorted(records, key=itemgetter("age", "name"))`,
    explanation: "`operator.itemgetter('key')` returns a callable that retrieves a dict key or sequence index — it's slightly faster than a `lambda` because it avoids creating a closure.",
  },
  {
    id: "py-b17-b2-pathlib-glob",
    language: "python",
    title: "pathlib.Path.glob for file discovery",
    tag: "snippet",
    code: `from pathlib import Path

# Recursive glob for all Python files:
py_files = list(Path(".").rglob("*.py"))
print(f"Found {len(py_files)} .py files")

# Non-recursive: only in current dir
ts_files = list(Path(".").glob("*.ts"))

# Combine glob with filtering:
large_py = [
    p for p in Path(".").rglob("*.py")
    if p.stat().st_size > 10_000
]
print(large_py)`,
    explanation: "`Path.glob(pattern)` searches the directory non-recursively; `Path.rglob(pattern)` is equivalent to `glob('**/' + pattern)` and searches recursively — both return lazy generators.",
  },
  {
    id: "py-b17-b2-struct-pack-unpack",
    language: "python",
    title: "struct.pack and struct.unpack for binary data",
    tag: "snippet",
    code: `import struct

# Pack two shorts and a float into binary:
packed = struct.pack(">hHf", -1, 300, 3.14)
print(packed)          # binary bytes
print(len(packed))     # 8 bytes

# Unpack back:
h, H, f = struct.unpack(">hHf", packed)
print(h, H, round(f, 2))  # -1 300 3.14

# Format string: > = big-endian, h = signed short, H = unsigned short, f = float`,
    explanation: "`struct.pack(fmt, ...)` converts Python values to C binary layout; `struct.unpack(fmt, bytes)` reverses it — essential for reading binary file formats and network protocols.",
  },
  {
    id: "py-b17-b2-memoryview",
    language: "python",
    title: "memoryview for zero-copy buffer access",
    tag: "snippet",
    code: `data = bytearray(range(10))   # mutable buffer

# memoryview doesn't copy:
view = memoryview(data)

# Slice the view — still zero-copy:
chunk = view[2:6]
print(bytes(chunk))   # b'\\x02\\x03\\x04\\x05'

# Write back through the view:
chunk[0] = 99
print(data[2])        # 99 — modified original buffer

# Works with bytes (read-only) and bytearray (read-write)`,
    explanation: "`memoryview` exposes a buffer's raw bytes without copying, allowing efficient slicing, re-interpretation, and in-place modification of large binary buffers.",
  },
  {
    id: "py-b17-b2-contextlib-redirect",
    language: "python",
    title: "contextlib.redirect_stdout captures print output",
    tag: "snippet",
    code: `from contextlib import redirect_stdout
from io import StringIO

buf = StringIO()
with redirect_stdout(buf):
    print("captured")
    print("also captured")

output = buf.getvalue()
print(repr(output))  # 'captured\\nalso captured\\n'

# Useful for testing code that prints to stdout:
assert "captured" in output`,
    explanation: "`redirect_stdout(f)` temporarily replaces `sys.stdout` with `f` for the duration of the `with` block, letting you capture `print` output in tests without monkeypatching.",
  },
  {
    id: "py-b17-b2-dict-comprehension",
    language: "python",
    title: "Dict comprehension for transforming mappings",
    tag: "snippet",
    code: `prices = {"apple": 1.20, "banana": 0.50, "cherry": 2.00}

# Invert: value -> key
inverted = {v: k for k, v in prices.items()}
print(inverted)  # {1.2: 'apple', 0.5: 'banana', 2.0: 'cherry'}

# Filter + transform:
affordable = {k: round(v * 1.1, 2) for k, v in prices.items() if v < 1.5}
print(affordable)  # {'apple': 1.32, 'banana': 0.55}

# From two parallel lists:
keys = ["x", "y", "z"]
vals = [1, 2, 3]
d = {k: v for k, v in zip(keys, vals)}`,
    explanation: "Dict comprehensions `{k: v for k, v in items}` allow inline transformation and filtering of key-value pairs — they're more readable and often faster than building the dict with `.update()` in a loop.",
  },
  {
    id: "py-b17-b2-set-comprehension",
    language: "python",
    title: "Set comprehension for unique transformed values",
    tag: "snippet",
    code: `words = ["Hello", "world", "hello", "Python", "WORLD"]

# Unique lowercase versions:
unique_lower = {w.lower() for w in words}
print(unique_lower)  # {'hello', 'world', 'python'}

# Find duplicate letters in a word:
word = "programming"
dupes = {c for c in word if word.count(c) > 1}
print(dupes)  # {'r', 'g', 'm'}`,
    explanation: "Set comprehensions `{expr for x in iterable}` build a set in one expression, automatically deduplicating elements — faster than a list comprehension followed by `set()`.",
  },
  {
    id: "py-b17-b2-match-case",
    language: "python",
    title: "Structural pattern matching with match/case",
    tag: "snippet",
    code: `def describe(point):
    match point:
        case (0, 0):
            return "origin"
        case (x, 0):
            return f"x-axis at {x}"
        case (0, y):
            return f"y-axis at {y}"
        case (x, y) if x == y:
            return f"diagonal at {x}"
        case (x, y):
            return f"point ({x}, {y})"

print(describe((0, 0)))   # origin
print(describe((3, 0)))   # x-axis at 3
print(describe((4, 4)))   # diagonal at 4`,
    explanation: "`match/case` (Python 3.10+) performs structural decomposition — case patterns can bind variables, test equality, guard with `if`, and match class instances or sequences without manual comparisons.",
  },
  {
    id: "py-b17-b2-generator-expression",
    language: "python",
    title: "Generator expressions vs list comprehensions",
    tag: "snippet",
    code: `import sys

# List comprehension — builds entire list in memory:
lst = [x**2 for x in range(1000)]
print(sys.getsizeof(lst))   # ~8856 bytes

# Generator expression — lazy, one item at a time:
gen = (x**2 for x in range(1000))
print(sys.getsizeof(gen))   # ~104 bytes (just the generator object)

# Use gen when you only need to iterate once:
total = sum(x**2 for x in range(1000))   # no intermediate list
print(total)  # 332833500`,
    explanation: "Generator expressions are lazy: they yield values on demand without building a list, saving memory when you only iterate once — but they can only be consumed once, unlike a list.",
  },
  {
    id: "py-b17-b2-str-join-vs-concat",
    language: "python",
    title: "str.join is faster than += in loops",
    tag: "snippet",
    code: `import timeit

words = ["hello"] * 10_000

# Slow: O(n²) — new string each iteration
def slow():
    result = ""
    for w in words:
        result += w + " "
    return result

# Fast: O(n) — join builds one string
def fast():
    return " ".join(words)

print(timeit.timeit(slow, number=10))
print(timeit.timeit(fast, number=10))
# fast is ~100x faster`,
    explanation: "`str.join(iterable)` concatenates all parts in a single pass over a pre-allocated buffer; `+=` inside a loop creates a new string object each iteration, giving O(n²) total work.",
  },
  // === understanding ===
  {
    id: "py-b17-b2-copy-vs-deepcopy",
    language: "python",
    title: "copy.copy vs copy.deepcopy",
    tag: "understanding",
    code: `import copy

original = [[1, 2], [3, 4]]

# Shallow copy: new outer list, same inner lists
shallow = copy.copy(original)
shallow[0].append(99)
print(original[0])   # [1, 2, 99]  ← inner list was shared!

# Deep copy: completely independent tree
deep = copy.deepcopy(original)
deep[1].append(88)
print(original[1])   # [3, 4]  ← original unchanged`,
    explanation: "`copy.copy` creates a new container but shares the contained objects; `copy.deepcopy` recursively copies everything, producing a fully independent object graph.",
  },
  {
    id: "py-b17-b2-exception-chaining",
    language: "python",
    title: "Exception chaining with raise from",
    tag: "understanding",
    code: `class DatabaseError(Exception): pass

def connect():
    try:
        raise ConnectionRefusedError("port closed")
    except ConnectionRefusedError as e:
        raise DatabaseError("cannot connect") from e   # explicit chain

try:
    connect()
except DatabaseError as e:
    print(e)                   # cannot connect
    print(e.__cause__)         # port closed  (explicit cause)

# raise X from None suppresses the chain:
# raise DatabaseError("clean") from None`,
    explanation: "`raise NewError from original` explicitly chains exceptions, storing the original as `__cause__`; Python 3 also auto-sets `__context__` for implicit chaining — both appear in tracebacks to show the causal chain.",
  },
  {
    id: "py-b17-b2-slots",
    language: "python",
    title: "__slots__ reduces memory and blocks extra attributes",
    tag: "understanding",
    code: `import sys

class WithDict:
    def __init__(self, x, y):
        self.x, self.y = x, y

class WithSlots:
    __slots__ = ("x", "y")
    def __init__(self, x, y):
        self.x, self.y = x, y

a = WithDict(1, 2)
b = WithSlots(1, 2)

print(sys.getsizeof(a.__dict__))   # 104 bytes (just the dict)
# b has no __dict__:  AttributeError: 'WithSlots' object has no attribute '__dict__'

# b.z = 3   # AttributeError — only x and y allowed`,
    explanation: "`__slots__` replaces the per-instance `__dict__` with fixed-size C arrays, reducing memory by ~50–70% per instance and blocking dynamic attribute creation.",
  },
  {
    id: "py-b17-b2-super-mro",
    language: "python",
    title: "super() follows the MRO, not just the parent",
    tag: "understanding",
    code: `class A:
    def greet(self): return "A"

class B(A):
    def greet(self): return super().greet() + "B"

class C(A):
    def greet(self): return super().greet() + "C"

class D(B, C):
    def greet(self): return super().greet() + "D"

# MRO: D -> B -> C -> A
print(D.__mro__)   # (<class 'D'>, <class 'B'>, <class 'C'>, <class 'A'>, ...)
print(D().greet())  # ABCD  (cooperative multiple inheritance)`,
    explanation: "`super()` delegates to the *next class in the MRO*, not just `__bases__[0]` — in cooperative multiple inheritance, every class calls `super()` so all classes in the diamond get a chance to run.",
  },
  {
    id: "py-b17-b2-descriptor-protocol",
    language: "python",
    title: "The descriptor protocol: data vs non-data descriptors",
    tag: "understanding",
    code: `class NonData:
    """Only __get__ — instance dict wins."""
    def __get__(self, obj, objtype=None):
        return "from NonData descriptor"

class Data:
    """Both __get__ and __set__ — always wins over instance dict."""
    def __get__(self, obj, objtype=None):
        return obj.__dict__.get("_x", 0) if obj else self
    def __set__(self, obj, val):
        obj.__dict__["_x"] = val

class MyClass:
    nd = NonData()
    d  = Data()

obj = MyClass()
obj.__dict__["nd"] = "instance wins"   # non-data: instance shadows
print(obj.nd)    # instance wins

obj.d = 42       # data descriptor intercepts
print(obj.d)     # 42  (via Data.__get__)`,
    explanation: "Data descriptors (`__get__` + `__set__`) take priority over the instance `__dict__`; non-data descriptors (`__get__` only) are overridden by instance dict entries — `property` is a data descriptor.",
  },
  {
    id: "py-b17-b2-async-gen",
    language: "python",
    title: "Async generators: yield inside async def",
    tag: "understanding",
    code: `import asyncio

async def ticker(count, delay):
    for i in range(count):
        await asyncio.sleep(delay)
        yield i

async def main():
    async for tick in ticker(5, 0.01):
        print(tick, end=" ")
    # Output: 0 1 2 3 4

asyncio.run(main())`,
    explanation: "An async generator is an `async def` function that uses `yield`; you consume it with `async for` or `async with contextlib.aclosing()` — it pauses at each `yield` and resumes when the consumer requests the next value.",
  },
  {
    id: "py-b17-b2-contextmanager-decorator",
    language: "python",
    title: "@contextmanager turns a generator into a context manager",
    tag: "understanding",
    code: `from contextlib import contextmanager
import time

@contextmanager
def timer(label: str):
    start = time.perf_counter()
    try:
        yield   # code inside 'with' block runs here
    finally:
        elapsed = time.perf_counter() - start
        print(f"{label}: {elapsed:.4f}s")

with timer("loop"):
    total = sum(range(1_000_000))`,
    explanation: "`@contextmanager` converts a generator with a single `yield` into a context manager: code before `yield` is `__enter__`, code after is `__exit__` — wrapping in `try/finally` ensures teardown even on exceptions.",
  },
  {
    id: "py-b17-b2-weakref-callback",
    language: "python",
    title: "weakref callback when an object is GC'd",
    tag: "understanding",
    code: `import weakref

class Widget:
    def __init__(self, name): self.name = name

def on_collected(ref):
    print(f"Widget was garbage collected")

w = Widget("button")
weak = weakref.ref(w, on_collected)   # callback registered

print(weak())   # <Widget object>
del w           # remove strong reference
import gc; gc.collect()
# Prints: "Widget was garbage collected"
print(weak())   # None`,
    explanation: "You can pass a callback to `weakref.ref(obj, callback)` that fires when the object is garbage collected — useful for cleaning up secondary resources like caches keyed by the object.",
  },
  {
    id: "py-b17-b2-multiple-assignment",
    language: "python",
    title: "Multiple assignment evaluates the right side fully first",
    tag: "understanding",
    code: `# Swap without a temp variable:
a, b = 1, 2
a, b = b, a   # RHS tuple (2, 1) built, then unpacked
print(a, b)   # 2 1

# Common gotcha: augmented assignment is not the same:
x = y = []     # BOTH point to the SAME list
x.append(1)
print(y)       # [1] — y was aliased to x!

# Fix: separate statements
x2 = []
y2 = []`,
    explanation: "In `a, b = b, a` Python evaluates the entire right side (building a tuple) before assigning, making in-place swap work — but `x = y = []` creates one list shared between two names.",
  },
  {
    id: "py-b17-b2-integer-division-negative",
    language: "python",
    title: "Floor division rounds toward negative infinity",
    tag: "understanding",
    code: `print(7  // 2)    # 3   (rounds down)
print(-7 // 2)    # -4  (rounds toward -inf, NOT truncates to -3!)
print(7  // -2)   # -4
print(-7 // -2)   # 3

# Modulo follows the same convention:
print(-7 % 2)     # 1   (result has same sign as divisor)
print(7  % -2)    # -1

# Relationship: a == (a // b) * b + (a % b)
print((-7 // 2) * 2 + (-7 % 2))  # -7 ✓`,
    explanation: "Python's `//` is *floor* division (rounds toward negative infinity), not truncation toward zero; this means `-7 // 2 == -4`, which differs from C/Java/C# where `-7 / 2 == -3`.",
  },
  {
    id: "py-b17-b2-print-sep-end",
    language: "python",
    title: "print() sep and end parameters",
    tag: "understanding",
    code: `# sep: string inserted between arguments (default ' ')
print("a", "b", "c", sep=", ")    # a, b, c
print("a", "b", "c", sep="")      # abc

# end: string appended after the last arg (default '\\n')
print("loading", end="")
print("...", end="\\n")   # loading...

# Combine for CSV output:
row = [1, "Alice", 30]
print(*row, sep=",")      # 1,Alice,30`,
    explanation: "`print(*args, sep=' ', end='\\n')` lets you control the delimiter between arguments and the line terminator without building an intermediate string — `*row` unpacks the list as separate arguments.",
  },
  {
    id: "py-b17-b2-dict-unpacking-call",
    language: "python",
    title: "** unpacking a dict into keyword arguments",
    tag: "understanding",
    code: `def create_user(name, age, email):
    return {"name": name, "age": age, "email": email}

defaults = {"age": 18, "email": "none@example.com"}
extra    = {"name": "Alice", "age": 25}   # overrides age

# Merging + unpacking into a call:
user = create_user(**{**defaults, **extra})
print(user)  # {'name': 'Alice', 'age': 25, 'email': 'none@example.com'}`,
    explanation: "`**mapping` in a function call unpacks key-value pairs as keyword arguments; combining `{**a, **b}` first merges dicts (right side wins) before unpacking lets you layer default and override argument sets.",
  },
  {
    id: "py-b17-b2-metaclass-basics",
    language: "python",
    title: "Metaclass controls class creation",
    tag: "understanding",
    code: `class SingletonMeta(type):
    _instances: dict = {}

    def __call__(cls, *args, **kwargs):
        if cls not in cls._instances:
            cls._instances[cls] = super().__call__(*args, **kwargs)
        return cls._instances[cls]

class Database(metaclass=SingletonMeta):
    def __init__(self): print("created")

a = Database()   # created
b = Database()   # (no output — same instance returned)
print(a is b)    # True`,
    explanation: "A metaclass is a class whose instances are classes; overriding `__call__` in the metaclass intercepts object creation, making Singleton and other object-lifecycle patterns possible without `__new__`.",
  },
  {
    id: "py-b17-b2-format-protocol",
    language: "python",
    title: "__format__ controls how an object appears in f-strings",
    tag: "understanding",
    code: `class Money:
    def __init__(self, amount, currency="USD"):
        self.amount = amount
        self.currency = currency

    def __format__(self, spec):
        if spec == "short":
            return f"{self.currency} {self.amount:.0f}"
        return f"{self.currency} {self.amount:{spec}}"

m = Money(1234.567)
print(f"{m}")         # USD 1234.567   (empty spec)
print(f"{m:.2f}")     # USD 1234.57
print(f"{m:short}")   # USD 1235`,
    explanation: "`__format__(self, spec)` lets a class define custom formatting behaviour; the format spec string (everything after `:` in an f-string) is passed as `spec`, enabling domain-specific mini-languages.",
  },
  // === structures ===
  {
    id: "py-b17-b2-heapq-push-pop",
    language: "python",
    title: "heapq: min-heap push and pop",
    tag: "structures",
    code: `import heapq

heap = []
heapq.heappush(heap, 5)
heapq.heappush(heap, 2)
heapq.heappush(heap, 8)
heapq.heappush(heap, 1)

# Always pops the smallest:
print(heapq.heappop(heap))  # 1
print(heapq.heappop(heap))  # 2

# heapify converts a list in-place, O(n):
data = [5, 3, 7, 1]
heapq.heapify(data)
print(data[0])  # 1 (min is always at index 0)`,
    explanation: "`heapq` implements a min-heap; `heappush` and `heappop` are O(log n) while `heapify` is O(n) — Python has no built-in max-heap, but you can negate values to simulate one.",
  },
  {
    id: "py-b17-b2-deque-rotate",
    language: "python",
    title: "deque.rotate for circular buffer effect",
    tag: "structures",
    code: `from collections import deque

d = deque([1, 2, 3, 4, 5])

# Rotate right by 2 (positive = right):
d.rotate(2)
print(list(d))   # [4, 5, 1, 2, 3]

# Rotate left by 1 (negative = left):
d.rotate(-1)
print(list(d))   # [5, 1, 2, 3, 4]

# Use case: round-robin scheduling
tasks = deque(["A", "B", "C"])
for _ in range(6):
    tasks.rotate(-1)   # next task to front
    print(tasks[-1])`,
    explanation: "`deque.rotate(n)` moves elements from one end to the other in O(n) — a positive n shifts right (front elements wrap to the back), negative shifts left.",
  },
  {
    id: "py-b17-b2-lru-cache-typed",
    language: "python",
    title: "lru_cache typed=True treats different types separately",
    tag: "structures",
    code: `from functools import lru_cache

@lru_cache(maxsize=128, typed=True)
def process(n):
    print(f"called with {n!r} ({type(n).__name__})")
    return n * 2

process(3)    # called with 3 (int)
process(3.0)  # called with 3.0 (float)  ← separate cache entry
process(3)    # cache hit — not called again`,
    explanation: "By default `lru_cache` treats `3` and `3.0` as the same key (they compare equal); `typed=True` uses the type as part of the cache key so `int` and `float` arguments get separate entries.",
  },
  {
    id: "py-b17-b2-namedtuple-class-syntax",
    language: "python",
    title: "NamedTuple class syntax with methods",
    tag: "structures",
    code: `from typing import NamedTuple
import math

class Vector(NamedTuple):
    x: float
    y: float

    def magnitude(self) -> float:
        return math.sqrt(self.x**2 + self.y**2)

    def normalized(self) -> "Vector":
        m = self.magnitude()
        return Vector(self.x / m, self.y / m)

v = Vector(3, 4)
print(v.magnitude())          # 5.0
print(v.normalized())         # Vector(x=0.6, y=0.8)
print(v == (3, 4))            # True — still a tuple`,
    explanation: "The class-syntax `NamedTuple` allows adding methods while retaining full tuple compatibility — the instance is still a tuple so it supports unpacking, indexing, and equality comparison with raw tuples.",
  },
  {
    id: "py-b17-b2-dataclass-kw-only",
    language: "python",
    title: "dataclass kw_only forces keyword-only arguments",
    tag: "structures",
    code: `from dataclasses import dataclass, field, KW_ONLY

@dataclass
class Config:
    name: str
    _: KW_ONLY             # everything after is keyword-only
    host: str = "localhost"
    port: int = 8080
    debug: bool = False

# Must use keyword syntax:
cfg = Config("app", host="db.local", port=5432)
# Config("app", "db.local", 5432)  # TypeError — positional!
print(cfg)`,
    explanation: "`KW_ONLY` sentinel (Python 3.10+) marks subsequent fields as keyword-only in the generated `__init__`, preventing accidental positional usage of fields that have defaults.",
  },
  {
    id: "py-b17-b2-enum-module",
    language: "python",
    title: "enum.Enum for named constants with behaviour",
    tag: "structures",
    code: `from enum import Enum, auto

class Color(Enum):
    RED   = auto()   # 1
    GREEN = auto()   # 2
    BLUE  = auto()   # 3

print(Color.RED)          # Color.RED
print(Color.RED.value)    # 1
print(Color.RED.name)     # RED
print(Color(2))           # Color.GREEN

# Iteration:
for c in Color:
    print(c.name, c.value)

# Comparison (by identity, not value):
print(Color.RED == Color.RED)   # True
print(Color.RED is Color.RED)   # True`,
    explanation: "`enum.Enum` creates named constants where each member is a singleton — use `auto()` to avoid manually assigning values, and access `.name`/`.value` to get the string name or underlying value.",
  },
  {
    id: "py-b17-b2-queue-priority",
    language: "python",
    title: "queue.PriorityQueue for thread-safe priority queue",
    tag: "structures",
    code: `from queue import PriorityQueue

pq = PriorityQueue()
pq.put((3, "low"))
pq.put((1, "urgent"))
pq.put((2, "normal"))

# Items dequeued in order of (priority, item):
while not pq.empty():
    priority, task = pq.get()
    print(priority, task)
# 1 urgent
# 2 normal
# 3 low`,
    explanation: "`queue.PriorityQueue` is a thread-safe min-priority queue backed by `heapq`; elements are tuples where the first element is the numeric priority and smaller values dequeue first.",
  },
  {
    id: "py-b17-b2-io-buffered-reader",
    language: "python",
    title: "io.BufferedReader for efficient file reading",
    tag: "structures",
    code: `import io

# Open in binary mode to get a BufferedReader:
with open("/etc/hostname", "rb") as f:
    print(type(f))           # <class '_io.BufferedReader'>
    chunk = f.read(4)        # read exactly 4 bytes
    rest  = f.read()         # read remainder
    print(chunk + rest)      # full file contents

# Wrap raw file in a manually controlled buffer:
raw = open("/etc/hostname", "rb", buffering=0)
buf = io.BufferedReader(raw, buffer_size=1024)`,
    explanation: "`io.BufferedReader` wraps a raw binary stream with an internal buffer, reducing OS syscalls by satisfying small reads from the buffer rather than the underlying file.",
  },
  {
    id: "py-b17-b2-frozenset-operations",
    language: "python",
    title: "frozenset in set operations and as dict key",
    tag: "structures",
    code: `a = frozenset([1, 2, 3])
b = frozenset([2, 3, 4])

print(a | b)  # frozenset({1, 2, 3, 4})  — union
print(a & b)  # frozenset({2, 3})          — intersection
print(a - b)  # frozenset({1})             — difference
print(a ^ b)  # frozenset({1, 4})          — symmetric diff

# Use as dict key (sets can't be keys):
edge_weights = {frozenset(("A", "B")): 5, frozenset(("B", "C")): 3}
print(edge_weights[frozenset(("B", "A"))])  # 5 — order insensitive`,
    explanation: "`frozenset` supports all the same set operations as `set` and is hashable, making it suitable as a dict key or element of another set — useful for representing unordered pairs or small sets of flags.",
  },
  {
    id: "py-b17-b2-counter-most-common",
    language: "python",
    title: "Counter.most_common and elements()",
    tag: "structures",
    code: `from collections import Counter

text = "the quick brown fox jumps over the lazy dog"
word_counts = Counter(text.split())

# n most common (descending):
print(word_counts.most_common(3))
# [('the', 2), ('quick', 1), ('brown', 1)]

# All elements repeated by count:
repeated = list(Counter({"a": 2, "b": 3}).elements())
print(repeated)  # ['a', 'a', 'b', 'b', 'b']

# subtract() updates counts in-place (can go negative):
word_counts.subtract(["the", "the", "the"])
print(word_counts["the"])  # -1`,
    explanation: "`most_common(n)` returns the n highest-count items sorted descending; `elements()` expands each key to appear `count` times; `subtract` decrements counts and allows negatives.",
  },
  {
    id: "py-b17-b2-typing-overload",
    language: "python",
    title: "typing.overload for multiple call signatures",
    tag: "structures",
    code: `from typing import overload

@overload
def process(x: int) -> int: ...
@overload
def process(x: str) -> str: ...

def process(x):
    if isinstance(x, int):
        return x * 2
    return x.upper()

result_int: int = process(5)     # type checker knows this is int
result_str: str = process("hi") # type checker knows this is str
print(result_int, result_str)    # 10 HI`,
    explanation: "`@overload` lets you declare multiple typed signatures for one implementation; type checkers use the `@overload` signatures for inference while the actual implementation (without decorator) does the runtime work.",
  },
  {
    id: "py-b17-b2-dataclass-compare",
    language: "python",
    title: "dataclass(order=True) auto-generates comparison methods",
    tag: "structures",
    code: `from dataclasses import dataclass

@dataclass(order=True)
class Version:
    major: int
    minor: int
    patch: int

v1 = Version(1, 9, 0)
v2 = Version(2, 0, 0)
v3 = Version(1, 9, 0)

print(v1 < v2)   # True
print(v1 == v3)  # True
print(sorted([v2, v1, v3]))
# [Version(major=1, minor=9, patch=0), Version(major=1, minor=9, patch=0), Version(major=2, minor=0, patch=0)]`,
    explanation: "`order=True` generates `__lt__`, `__le__`, `__gt__`, `__ge__` that compare field values in the order they are declared — similar to a Python tuple comparison.",
  },
  // === caveats ===
  {
    id: "py-b17-b2-open-mode-text-vs-binary",
    language: "python",
    title: "open() text mode vs binary mode",
    tag: "caveats",
    code: `# Text mode: decodes bytes with the platform codec, translates line endings
with open("/etc/hostname") as f:          # mode='r' by default
    data = f.read()
    print(type(data))   # <class 'str'>

# Binary mode: raw bytes, no translation
with open("/etc/hostname", "rb") as f:
    data = f.read()
    print(type(data))   # <class 'bytes'>

# Common mistake: writing binary data in text mode (or vice versa)
# raises TypeError: write() argument must be str, not bytes`,
    explanation: "Text mode auto-decodes bytes (using the platform codec by default) and translates `\\r\\n` to `\\n` on Windows; use binary mode (`'rb'`, `'wb'`) for any non-text data to avoid corruption.",
  },
  {
    id: "py-b17-b2-scope-comprehension-vs-for",
    language: "python",
    title: "Comprehension variables don't leak in Python 3",
    tag: "caveats",
    code: `# Python 2: list comprehension leaked its variable
# Python 3: each comprehension has its own scope

x = "global"
squares = [x**2 for x in range(5)]   # x inside is LOCAL
print(x)   # global (unchanged in Python 3)

# But generator expression vars also scoped:
gen = (y for y in range(5))
# print(y)  # NameError — y is not in the enclosing scope

# Walrus operator IS the exception — leaks intentionally
found = [last := n for n in range(5)]
print(last)   # 4`,
    explanation: "Python 3 fixed the list comprehension variable leak from Python 2 — each comprehension (list, set, dict, generator) has its own scope; only `:=` walrus assignments intentionally escape to the enclosing scope.",
  },
  {
    id: "py-b17-b2-float-round-tie",
    language: "python",
    title: "round() uses banker's rounding (round half to even)",
    tag: "caveats",
    code: `# Python's round() uses IEEE 754 round-half-to-even:
print(round(0.5))   # 0  (rounds to even)
print(round(1.5))   # 2  (rounds to even)
print(round(2.5))   # 2  (rounds to even)
print(round(3.5))   # 4  (rounds to even)

# Compare with always-round-half-up (Decimal):
from decimal import Decimal, ROUND_HALF_UP
print(Decimal("2.5").quantize(Decimal("1"), rounding=ROUND_HALF_UP))  # 3`,
    explanation: "Python's built-in `round()` implements banker's rounding (half to nearest even) to reduce statistical bias; use `Decimal.quantize(rounding=ROUND_HALF_UP)` if you need the traditional always-round-up behaviour.",
  },
  {
    id: "py-b17-b2-dict-size-during-iteration",
    language: "python",
    title: "Modifying a dict while iterating raises RuntimeError",
    tag: "caveats",
    code: `d = {"a": 1, "b": 2, "c": 3}

# This raises: RuntimeError: dictionary changed size during iteration
try:
    for k in d:
        if k == "b":
            del d[k]   # can't modify during iteration!
except RuntimeError as e:
    print(e)

# Fix: iterate over a copy of the keys
for k in list(d.keys()):
    if k == "b":
        del d[k]
print(d)  # {'a': 1, 'c': 3}`,
    explanation: "Python's dict iteration uses an internal version counter; any structural modification (add, delete) during iteration raises `RuntimeError` — iterate over `list(d.keys())` or `list(d.items())` to work on a snapshot.",
  },
  {
    id: "py-b17-b2-chained-not-in",
    language: "python",
    title: "not in vs != — the right way to negate membership",
    tag: "caveats",
    code: `items = [1, 2, 3, 4]

# Correct:
print(3 not in items)    # False
print(5 not in items)    # True

# Wrong (not what you think!):
print(not 3 in items)    # False — same result but lower precedence
print(not 3 in [1, 2])   # True

# != is not membership — it's inequality!
print(3 != items)        # True (int is always != list)
print([3] != items)      # True (different lists)`,
    explanation: "`x not in container` is the idiomatic membership negation; `not x in container` works the same way (precedence makes it equivalent) but `x != container` is a completely different check — inequality, not non-membership.",
  },
  {
    id: "py-b17-b2-global-import-side-effects",
    language: "python",
    title: "Module-level code runs on import",
    tag: "caveats",
    code: `# module: expensive.py
print("expensive module loading...")   # runs EVERY first import
data = [compute() for _ in range(1000)]  # runs at import time!

# Any module that does:
# import expensive
# triggers all that work

# Fix: move side-effectful code into functions or if __name__ == '__main__':
def get_data():
    return [compute() for _ in range(1000)]

if __name__ == "__main__":
    data = get_data()`,
    explanation: "Python executes module-level code when the module is first imported; heavy computation or side effects at module scope slow down import and affect all importers — defer work to functions or guard it with `if __name__ == '__main__':`.",
  },
  {
    id: "py-b17-b2-string-multiplication",
    language: "python",
    title: "String multiplication repeats the string",
    tag: "caveats",
    code: `# Strings are immutable — no aliasing issue unlike lists:
line = "-" * 20
print(line)   # --------------------

# But confuse it with list multiplication:
lst = ["-"] * 3  # ['-', '-', '-']  — fine (strings are immutable)
nested = [[]] * 3  # [[], [], []] — but all the SAME list!

# Useful pattern: padding
def pad(s, width):
    return s + " " * max(0, width - len(s))

print(repr(pad("hi", 5)))   # 'hi   '`,
    explanation: "Repeating a string with `*` is safe because strings are immutable; repeating a list containing mutable objects creates aliases — but repeating a list of immutable items (like strings) is also fine.",
  },
  {
    id: "py-b17-b2-hash-mutability",
    language: "python",
    title: "Mutable objects are unhashable",
    tag: "caveats",
    code: `# Unhashable: list, dict, set
try:
    d = {[1, 2]: "value"}   # TypeError: unhashable type: 'list'
except TypeError as e:
    print(e)

# Hashable: tuple, frozenset, str, int, float
d = {(1, 2): "tuple key", frozenset([3, 4]): "frozenset key"}

# User-defined classes are hashable by default (hash = id):
class Point:
    def __init__(self, x, y): self.x, self.y = x, y

d[Point(0, 0)] = "origin"  # works (but two different Point objects != equal)`,
    explanation: "An object is hashable only if its value can't change (because changing a dict key's hash would corrupt the hash table); built-in mutable types raise `TypeError`, while user classes default to identity-based hashing.",
  },
  {
    id: "py-b17-b2-except-group",
    language: "python",
    title: "ExceptionGroup and except* (Python 3.11+)",
    tag: "caveats",
    code: `# ExceptionGroup bundles multiple exceptions:
try:
    raise ExceptionGroup("errors", [
        ValueError("bad value"),
        TypeError("wrong type"),
    ])
except* ValueError as eg:
    print(f"caught ValueError(s): {eg.exceptions}")
except* TypeError as eg:
    print(f"caught TypeError(s): {eg.exceptions}")

# except* can handle multiple types per group:
# except* (ValueError, KeyError) as eg: ...`,
    explanation: "`ExceptionGroup` (Python 3.11) wraps multiple simultaneous exceptions (e.g., from concurrent tasks); `except*` can match on type within a group, letting different handlers process different error subtypes from the same group.",
  },
  {
    id: "py-b17-b2-global-variable-shadowing",
    language: "python",
    title: "Reading before assigning a global variable causes UnboundLocalError",
    tag: "caveats",
    code: `x = 10

def bad():
    print(x)   # UnboundLocalError!
    x = 20     # assignment makes x LOCAL to the function

# Python sees the assignment and treats x as local throughout the function,
# so the print() tries to read an uninitialized local.

def good():
    global x
    print(x)   # 10 (reads global)
    x = 20     # modifies global

good()
print(x)   # 20`,
    explanation: "If a function contains any assignment to a name, Python treats that name as local *throughout the function body* — so a read before the assignment raises `UnboundLocalError`; use `global` to indicate you want the module-level name.",
  },
  // === types ===
  {
    id: "py-b17-b2-paramspec",
    language: "python",
    title: "ParamSpec for annotating decorator parameter forwarding",
    tag: "types",
    code: `from typing import Callable, ParamSpec, TypeVar

P = ParamSpec("P")
T = TypeVar("T")

def logged(fn: Callable[P, T]) -> Callable[P, T]:
    def wrapper(*args: P.args, **kwargs: P.kwargs) -> T:
        print(f"calling {fn.__name__}")
        result = fn(*args, **kwargs)
        print(f"done: {result!r}")
        return result
    return wrapper

@logged
def add(a: int, b: int) -> int:
    return a + b

add(1, 2)   # calling add / done: 3`,
    explanation: "`ParamSpec` captures the full parameter spec of a callable (both positional and keyword), letting type checkers verify that a decorator's wrapper preserves the original signature rather than losing it to `*args, **kwargs`.",
  },
  {
    id: "py-b17-b2-selftype",
    language: "python",
    title: "Self type for fluent builder returns",
    tag: "types",
    code: `from typing import Self

class Builder:
    def __init__(self):
        self._items: list = []

    def add(self, item) -> Self:       # returns the same subclass
        self._items.append(item)
        return self

    def build(self) -> list:
        return self._items

class ExtendedBuilder(Builder):
    def add_many(self, *items) -> Self:
        for i in items: self.add(i)
        return self

result = ExtendedBuilder().add(1).add_many(2, 3).build()
print(result)  # [1, 2, 3]`,
    explanation: "`Self` (Python 3.11+) in a return annotation means the method returns an instance of the same class as `self`, preserving the subclass type through chained calls instead of widening to the base class.",
  },
  {
    id: "py-b17-b2-never-type",
    language: "python",
    title: "Never / NoReturn for functions that never return",
    tag: "types",
    code: `from typing import Never, NoReturn

def crash(msg: str) -> NoReturn:   # or Never (Python 3.11+)
    raise RuntimeError(msg)

def assert_never(val: Never) -> Never:
    """Call this in an exhaustive match to catch new enum variants."""
    raise AssertionError(f"Unhandled case: {val!r}")

# Type checkers will flag if a branch can reach assert_never:
from enum import Enum
class Status(Enum):
    OK = 1
    FAIL = 2`,
    explanation: "`NoReturn` (and its alias `Never` in 3.11+) signals that a function always raises or loops forever — type checkers use this to detect unreachable code after such calls and to enforce exhaustive pattern matching.",
  },
  {
    id: "py-b17-b2-annotated",
    language: "python",
    title: "Annotated attaches metadata to type hints",
    tag: "types",
    code: `from typing import Annotated

# Annotated[T, metadata] — runtime metadata for validation frameworks
Positive = Annotated[int, "must be > 0"]
Email    = Annotated[str, "must be valid email"]

def create_user(age: Positive, email: Email) -> None:
    # Pydantic, attrs, etc. can read the metadata at runtime:
    print(age, email)

# Access metadata via __metadata__:
import typing
print(typing.get_args(Positive))  # (<class 'int'>, 'must be > 0')`,
    explanation: "`Annotated[T, *metadata]` attaches arbitrary metadata to a type hint that type checkers ignore but libraries like Pydantic or FastAPI can read at runtime for validation, documentation, or serialization hints.",
  },
  {
    id: "py-b17-b2-typevar-default",
    language: "python",
    title: "TypeVar with bound restricts to a type hierarchy",
    tag: "types",
    code: `from typing import TypeVar

class Animal:
    def sound(self) -> str: return "..."

class Dog(Animal):
    def sound(self) -> str: return "Woof"

class Cat(Animal):
    def sound(self) -> str: return "Meow"

A = TypeVar("A", bound=Animal)

def make_sound(animal: A) -> A:   # returns same subtype
    print(animal.sound())
    return animal

dog: Dog = make_sound(Dog())    # type preserved as Dog
cat: Cat = make_sound(Cat())    # type preserved as Cat`,
    explanation: "`TypeVar(bound=T)` restricts the type variable to `T` and its subclasses; the return type being the same `TypeVar` preserves the specific subclass type through the call, unlike annotating with the base class `Animal`.",
  },
  {
    id: "py-b17-b2-get-type-hints",
    language: "python",
    title: "get_type_hints resolves string annotations at runtime",
    tag: "types",
    code: `from __future__ import annotations   # makes all annotations strings (PEP 563)
import typing

class Node:
    def __init__(self, val: int, next: Node | None = None):
        self.val = val
        self.next = next

# Without get_type_hints, annotations are plain strings:
print(Node.__init__.__annotations__)
# {'val': 'int', 'next': 'Node | None', 'return': 'None'}

# get_type_hints evaluates them:
hints = typing.get_type_hints(Node.__init__)
print(hints["val"])    # <class 'int'>`,
    explanation: "With `from __future__ import annotations`, all annotations are stored as strings (lazy evaluation); `typing.get_type_hints(obj)` resolves them to actual type objects at runtime using the module's namespace.",
  },
  {
    id: "py-b17-b2-numeric-tower",
    language: "python",
    title: "numbers module defines the abstract numeric tower",
    tag: "types",
    code: `import numbers

print(isinstance(42, numbers.Integral))  # True
print(isinstance(42, numbers.Rational)) # True
print(isinstance(42, numbers.Real))     # True
print(isinstance(42, numbers.Complex))  # True

print(isinstance(3.14, numbers.Integral)) # False
print(isinstance(3.14, numbers.Real))     # True

# Use for broad numeric type checking:
def sqrt(x: numbers.Real) -> float:
    return x ** 0.5

print(sqrt(4))    # 2.0
print(sqrt(4.0))  # 2.0`,
    explanation: "The `numbers` module defines an abstract numeric tower: `Complex > Real > Rational > Integral`; use these ABCs in `isinstance` checks when you want to accept any sufficiently numeric type rather than a specific concrete class.",
  },
  {
    id: "py-b17-b2-generic-class",
    language: "python",
    title: "Generic class with TypeVar",
    tag: "types",
    code: `from typing import Generic, TypeVar

T = TypeVar("T")

class Stack(Generic[T]):
    def __init__(self) -> None:
        self._items: list[T] = []

    def push(self, item: T) -> None:
        self._items.append(item)

    def pop(self) -> T:
        return self._items.pop()

    def __len__(self) -> int:
        return len(self._items)

s: Stack[int] = Stack()
s.push(1)
s.push(2)
print(s.pop())   # 2`,
    explanation: "Inheriting from `Generic[T]` declares a class that is parameterized by a type variable; instantiating `Stack[int]` locks `T` to `int` so type checkers validate that only integers are pushed.",
  },
  {
    id: "py-b17-b2-callable-type",
    language: "python",
    title: "Callable type annotations",
    tag: "types",
    code: `from typing import Callable

# Callable[[arg_types...], return_type]
def apply(fn: Callable[[int, int], int], a: int, b: int) -> int:
    return fn(a, b)

def add(x: int, y: int) -> int: return x + y
print(apply(add, 3, 4))   # 7

# Variable-arity: use Callable[..., R]
def run(fn: Callable[..., None]) -> None:
    fn()

# For complex signatures, use Protocol instead:
from typing import Protocol
class Transformer(Protocol):
    def __call__(self, x: int, *, verbose: bool = False) -> str: ...`,
    explanation: "`Callable[[arg_types], return_type]` annotates function-typed parameters; `Callable[..., R]` accepts any arguments; for signatures with keyword-only args or overloads, use a `Protocol` with `__call__` instead.",
  },
  {
    id: "py-b17-b2-int-type-hierarchy",
    language: "python",
    title: "int is the only integer type; long is gone in Python 3",
    tag: "types",
    code: `# Python 2 had int (fixed-width) and long (arbitrary):
# Python 3: only int (always arbitrary precision)

x = 2**64
print(type(x))        # <class 'int'>
print(x)              # 18446744073709551616

# No separate 'long' type:
# long(5)  # NameError in Python 3

# For C interop, use ctypes:
import ctypes
c_int = ctypes.c_int(2**31 - 1)
print(c_int.value)    # 2147483647  (wraps at 32-bit limit)`,
    explanation: "Python 3 merged `int` and `long` into a single arbitrary-precision `int` type — there's no integer overflow in pure Python, but `ctypes` types still simulate fixed-width C integers for interop.",
  },
  {
    id: "py-b17-b2-final-class",
    language: "python",
    title: "Final class prevents subclassing (typing only)",
    tag: "types",
    code: `from typing import final, Final

@final
class Immutable:
    value: Final[int]
    def __init__(self, v: int):
        self.value = v

# Type checkers flag this:
# class BadSubclass(Immutable): pass  # error: cannot subclass Final class

# @final on a method prevents override:
class Base:
    @final
    def critical(self): print("base")

class Sub(Base):
    pass
    # def critical(self): ...  # type error`,
    explanation: "`@final` on a class tells type checkers the class must not be subclassed; `@final` on a method tells them it must not be overridden — both are type-checker enforcement only with no runtime effect.",
  },
  {
    id: "py-b17-b2-type-narrowing-assert",
    language: "python",
    title: "assert narrows types in the positive branch",
    tag: "types",
    code: `from typing import Optional

def process(value: Optional[str]) -> int:
    assert value is not None, "value must not be None"
    # After this assert, type checkers know value is str (not Optional[str])
    return len(value)

# isinstance also narrows:
def handle(obj: int | str) -> str:
    if isinstance(obj, str):
        return obj.upper()   # obj is str here
    return str(obj * 2)      # obj is int here`,
    explanation: "Type checkers perform narrowing in branches after `assert`, `isinstance`, `is not None`, and other guards — they infer a more specific type in the code path where the condition is known to be true.",
  },
  {
    id: "py-b17-b2-typed-namedtuple-defaults",
    language: "python",
    title: "NamedTuple with default values",
    tag: "types",
    code: `from typing import NamedTuple

class Config(NamedTuple):
    host: str
    port: int = 8080
    timeout: float = 30.0
    debug: bool = False

# Defaults apply from right to left (like function defaults):
c1 = Config("localhost")
c2 = Config("db.local", 5432, debug=True)

print(c1)   # Config(host='localhost', port=8080, timeout=30.0, debug=False)
print(c2)   # Config(host='db.local', port=5432, timeout=30.0, debug=True)`,
    explanation: "NamedTuple fields can have defaults (fields with defaults must come after fields without), providing optional fields with a clean class-syntax definition.",
  },
  {
    id: "py-b17-b2-concatenate",
    language: "python",
    title: "Concatenate for typing prepended arguments",
    tag: "types",
    code: `from typing import Callable, Concatenate, ParamSpec, TypeVar

P = ParamSpec("P")
T = TypeVar("T")

# Decorator that prepends a 'request' parameter:
def with_request(fn: Callable[Concatenate[str, P], T]) -> Callable[P, T]:
    def wrapper(*args: P.args, **kwargs: P.kwargs) -> T:
        return fn("REQUEST", *args, **kwargs)
    return wrapper

@with_request
def handle(req: str, name: str) -> str:
    return f"{req}: hello {name}"

print(handle("Alice"))   # REQUEST: hello Alice`,
    explanation: "`Concatenate[T, P]` lets you type a decorator that prepends extra parameters — it represents a parameter list starting with `T` followed by whatever `P` captures, enabling precise type-checking of argument-prepending decorators.",
  },
  // === families ===
  {
    id: "py-b17-b2-io-hierarchy",
    language: "python",
    title: "io module class hierarchy",
    tag: "families",
    code: `import io

# io.IOBase
#   io.RawIOBase       — unbuffered raw I/O (FileIO)
#   io.BufferedIOBase  — buffered binary I/O (BufferedReader/Writer/Random)
#   io.TextIOBase      — text I/O (TextIOWrapper, StringIO)

# In-memory equivalents:
text_buf   = io.StringIO("hello")    # TextIOBase
binary_buf = io.BytesIO(b"\\x00\\x01") # BufferedIOBase

# Check what you got from open():
with open("/etc/hostname") as f:
    print(type(f).__mro__)   # TextIOWrapper -> TextIOBase -> IOBase`,
    explanation: "The `io` module organises I/O classes in a hierarchy: raw → buffered → text; `open()` returns the appropriate concrete class depending on mode and buffering arguments.",
  },
  {
    id: "py-b17-b2-concurrent-futures-both",
    language: "python",
    title: "concurrent.futures: map, wait, as_completed",
    tag: "families",
    code: `from concurrent.futures import ThreadPoolExecutor, as_completed, wait, FIRST_COMPLETED
import time

def work(n):
    time.sleep(n)
    return n * 10

with ThreadPoolExecutor(3) as ex:
    futures = {ex.submit(work, i) for i in [0.3, 0.1, 0.2]}

    # Process results as they complete (fastest first):
    for f in as_completed(futures):
        print(f.result())
# 10  20  30`,
    explanation: "`as_completed(futures)` yields futures in completion order rather than submission order; `wait(futures, return_when=FIRST_COMPLETED)` returns as soon as any future finishes — both are more flexible than `map()` for error handling.",
  },
  {
    id: "py-b17-b2-pathlib-vs-os-path",
    language: "python",
    title: "pathlib.Path vs os.path: modern vs classic",
    tag: "families",
    code: `import os
from pathlib import Path

# os.path: functional, string-based
p1 = os.path.join("/usr", "local", "bin")
name = os.path.basename(p1)
exists = os.path.exists(p1)

# pathlib: OO, operator-based
p2 = Path("/usr") / "local" / "bin"   # / overloaded for join
name2 = p2.name
exists2 = p2.exists()

# Read a file:
# os:      with open(os.path.join(base, "file.txt")) as f: ...
# pathlib: content = (Path(base) / "file.txt").read_text()

print(p1 == str(p2))   # True`,
    explanation: "`pathlib.Path` wraps path manipulation in an object with `/` for joining, `.name/.stem/.suffix` for parts, and I/O methods like `.read_text()` and `.write_bytes()` — less error-prone than `os.path` string concatenation.",
  },
  {
    id: "py-b17-b2-contextlib-exitstack",
    language: "python",
    title: "contextlib.ExitStack for dynamic context managers",
    tag: "families",
    code: `from contextlib import ExitStack

# Open a variable number of files:
file_paths = ["/etc/hostname", "/etc/os-release"]

with ExitStack() as stack:
    files = [stack.enter_context(open(p)) for p in file_paths]
    for f in files:
        print(f.readline().strip())
# All files closed when with block exits, even on exceptions`,
    explanation: "`ExitStack` is a context manager that can dynamically enter and exit other context managers; it's the right tool when you don't know how many resources to manage at the start of the `with` block.",
  },
  {
    id: "py-b17-b2-abstractmethod-vs-protocol",
    language: "python",
    title: "ABC abstractmethod vs Protocol: enforcement vs inference",
    tag: "families",
    code: `from abc import ABC, abstractmethod
from typing import Protocol

# ABC: runtime enforcement — instantiating with missing methods raises
class Shape(ABC):
    @abstractmethod
    def area(self) -> float: ...

# shape = Shape()  # TypeError: Can't instantiate abstract class

# Protocol: type-checker only — no runtime check by default
class HasArea(Protocol):
    def area(self) -> float: ...

class Triangle:
    def area(self): return 6.0

# Works with Protocol without inheriting:
def print_area(s: HasArea) -> None: print(s.area())
print_area(Triangle())  # 6.0`,
    explanation: "Use `ABC` when you want a runtime guarantee that subclasses implement required methods; use `Protocol` for structural subtyping that works with third-party classes you can't modify.",
  },
  {
    id: "py-b17-b2-string-methods-family",
    language: "python",
    title: "str strip/split/partition/rpartition compared",
    tag: "families",
    code: `s = "  hello, world  "

print(s.strip())          # 'hello, world'    — both ends
print(s.lstrip())         # 'hello, world  '  — left only
print(s.rstrip())         # '  hello, world'  — right only

# split vs partition:
print("a:b:c".split(":", 1))    # ['a', 'b:c']  — maxsplit=1
print("a:b:c".partition(":"))   # ('a', ':', 'b:c')  — always 3-tuple

# rpartition splits at the LAST occurrence:
print("path/to/file".rpartition("/"))  # ('path/to', '/', 'file')`,
    explanation: "`partition(sep)` always returns a 3-tuple (before, sep, after) even if `sep` isn't found (returns `('', '', s)`), making it safer than `split(maxsplit=1)` for structured string parsing.",
  },
  {
    id: "py-b17-b2-heapq-max-heap",
    language: "python",
    title: "Simulating a max-heap by negating values",
    tag: "families",
    code: `import heapq

# Python has min-heap only; negate values for max-heap
nums = [3, 1, 4, 1, 5, 9, 2, 6]

max_heap = [-n for n in nums]
heapq.heapify(max_heap)

# Pop largest:
print(-heapq.heappop(max_heap))  # 9
print(-heapq.heappop(max_heap))  # 6

# For objects: use (negated_priority, item) tuples
tasks = [(-3, "urgent"), (-1, "low"), (-2, "normal")]
heapq.heapify(tasks)
print(heapq.heappop(tasks))  # (-3, 'urgent')`,
    explanation: "Since Python only provides a min-heap, negate numeric priorities to simulate a max-heap; for complex objects store `(-priority, object)` tuples so the heap orders by negated priority.",
  },
  {
    id: "py-b17-b2-typing-overload-classmethod",
    language: "python",
    title: "Overloaded classmethods for alternate constructors",
    tag: "families",
    code: `from typing import overload

class Color:
    def __init__(self, r: int, g: int, b: int):
        self.r, self.g, self.b = r, g, b

    @overload
    @classmethod
    def from_hex(cls, hex_str: str) -> "Color": ...
    @overload
    @classmethod
    def from_hex(cls, value: int) -> "Color": ...

    @classmethod
    def from_hex(cls, val):
        if isinstance(val, str):
            val = val.lstrip("#")
            return cls(int(val[0:2], 16), int(val[2:4], 16), int(val[4:6], 16))
        return cls((val >> 16) & 0xFF, (val >> 8) & 0xFF, val & 0xFF)

c = Color.from_hex("#FF8000")
print(c.r, c.g, c.b)  # 255 128 0`,
    explanation: "Combining `@overload` with `@classmethod` lets you declare multiple typed signatures for an alternate constructor, so callers get correct type inference whether they pass a string or an integer.",
  },
  {
    id: "py-b17-b2-dict-fromkeys",
    language: "python",
    title: "dict.fromkeys creates a dict from a key iterable",
    tag: "families",
    code: `# All keys initialized to the same value:
zeroed = dict.fromkeys(["a", "b", "c"], 0)
print(zeroed)   # {'a': 0, 'b': 0, 'c': 0}

# Default value is None:
empty = dict.fromkeys(range(5))
print(empty)    # {0: None, 1: None, 2: None, 3: None, 4: None}

# Gotcha: mutable default is SHARED (like mutable default args):
bad = dict.fromkeys(["a", "b"], [])
bad["a"].append(1)
print(bad)  # {'a': [1], 'b': [1]}  ← both point to same list!`,
    explanation: "`dict.fromkeys(keys, value)` creates a dict with the same value for every key; but if the value is mutable (like `[]`), all keys share the *same* object — use a comprehension `{k: [] for k in keys}` to get independent objects.",
  },
  // === classes ===
  {
    id: "py-b17-b2-dataclass-inheritance",
    language: "python",
    title: "dataclass inheritance and field ordering",
    tag: "classes",
    code: `from dataclasses import dataclass

@dataclass
class Base:
    x: int
    y: int = 0

@dataclass
class Child(Base):
    z: int = 0   # fine: default after defaults

# This would FAIL:
# @dataclass
# class Bad(Base):
#     z: int    # no default, but base has y with default -> TypeError!

c = Child(10, 20, 30)
print(c)   # Child(x=10, y=20, z=30)`,
    explanation: "When inheriting from a dataclass, child fields with no defaults cannot follow parent fields that have defaults — this would create an invalid `__init__` signature with non-default args after default args.",
  },
  {
    id: "py-b17-b2-abstract-property",
    language: "python",
    title: "Abstract property enforcement in subclasses",
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
    def __init__(self, side: float):
        self._side = side

    @property
    def area(self) -> float:
        return self._side ** 2

    @property
    def perimeter(self) -> float:
        return 4 * self._side

s = Square(5)
print(s.area, s.perimeter)  # 25.0 20.0`,
    explanation: "Stack `@property` and `@abstractmethod` to require subclasses to implement a property — the order matters: `@property` must come before `@abstractmethod` in Python 3.",
  },
  {
    id: "py-b17-b2-class-decorators",
    language: "python",
    title: "Class decorators transform the class at definition time",
    tag: "classes",
    code: `def add_repr(cls):
    """Add a generic __repr__ to any class."""
    def __repr__(self):
        attrs = ", ".join(f"{k}={v!r}" for k, v in self.__dict__.items())
        return f"{cls.__name__}({attrs})"
    cls.__repr__ = __repr__
    return cls

@add_repr
class Config:
    def __init__(self, host, port):
        self.host = host
        self.port = port

print(Config("localhost", 8080))
# Config(host='localhost', port=8080)`,
    explanation: "Class decorators receive the class object and return a (possibly modified) class; they run once at class definition time — useful for adding methods, registering classes, or transforming attributes.",
  },
  {
    id: "py-b17-b2-dunder-contains",
    language: "python",
    title: "__contains__ customizes the 'in' operator",
    tag: "classes",
    code: `class IpRange:
    def __init__(self, start: int, end: int):
        self.start, self.end = start, end

    def __contains__(self, ip: int) -> bool:
        return self.start <= ip <= self.end

    def __repr__(self):
        return f"IpRange({self.start}, {self.end})"

r = IpRange(192168001001, 192168001254)
print(192168001100 in r)   # True
print(10000000001 in r)    # False`,
    explanation: "`__contains__(self, item)` is called by the `in` operator; if not defined, Python falls back to iterating with `__iter__` — implementing it directly enables O(1) membership tests for ranges and hash-based containers.",
  },
  {
    id: "py-b17-b2-dunder-len-bool",
    language: "python",
    title: "__len__ and __bool__ for truthiness",
    tag: "classes",
    code: `class Collection:
    def __init__(self, items):
        self._items = list(items)

    def __len__(self):
        return len(self._items)

    # Without __bool__, Python falls back to len() != 0:
    # def __bool__(self):
    #     return len(self._items) > 0

c_empty = Collection([])
c_full  = Collection([1, 2, 3])

print(bool(c_empty))   # False  (len() == 0)
print(bool(c_full))    # True   (len() != 0)

if c_full:
    print("has items")  # has items`,
    explanation: "If `__bool__` is not defined, Python calls `__len__` and treats the object as falsy when `len()` returns 0; define `__bool__` explicitly if you need non-length-based truthiness.",
  },
  {
    id: "py-b17-b2-class-var-annotation",
    language: "python",
    title: "ClassVar prevents dataclass from treating a field as an instance var",
    tag: "classes",
    code: `from dataclasses import dataclass
from typing import ClassVar

@dataclass
class Employee:
    name: str
    department: str
    # ClassVar: shared across all instances, NOT a constructor param
    _headcount: ClassVar[int] = 0

    def __post_init__(self):
        Employee._headcount += 1

e1 = Employee("Alice", "Eng")
e2 = Employee("Bob", "HR")
print(Employee._headcount)  # 2`,
    explanation: "`ClassVar[T]` in a `dataclass` tells the generator to exclude that field from `__init__`, `__repr__`, and comparison methods — it's a class-level variable shared by all instances, not a per-instance field.",
  },
  {
    id: "py-b17-b2-abc-register",
    language: "python",
    title: "ABC.register declares virtual subclasses",
    tag: "classes",
    code: `from abc import ABC, abstractmethod

class Drawable(ABC):
    @abstractmethod
    def draw(self) -> None: ...

# Register an existing class as a virtual subclass:
class ExternalWidget:
    def draw(self) -> None:
        print("drawing widget")

Drawable.register(ExternalWidget)

w = ExternalWidget()
print(isinstance(w, Drawable))   # True  — virtual subclass!
# But abstract method enforcement does NOT apply:
# ExternalWidget doesn't need to have 'draw' to be registered`,
    explanation: "`ABC.register(cls)` marks a class as a virtual subclass of the ABC, making `isinstance/issubclass` return `True`, without the class actually inheriting from it — useful for retrofitting existing code.",
  },
  {
    id: "py-b17-b2-dunder-class-getitem",
    language: "python",
    title: "__class_getitem__ enables generic class subscript",
    tag: "classes",
    code: `class TypedList:
    def __init__(self, type_):
        self._type = type_
        self._items: list = []

    def __class_getitem__(cls, item):
        return cls(item)  # TypedList[int] -> TypedList(int)

    def append(self, val):
        if not isinstance(val, self._type):
            raise TypeError(f"expected {self._type.__name__}")
        self._items.append(val)

lst = TypedList[int]
lst.append(1)
try:
    lst.append("hello")
except TypeError as e:
    print(e)   # expected int`,
    explanation: "`__class_getitem__(cls, item)` is called when you write `MyClass[T]`; the built-in generics (`list[int]`, `dict[str, int]`) use this hook to create parameterized types without metaclass complexity.",
  },
  {
    id: "py-b17-b2-mixin-pattern",
    language: "python",
    title: "Mixin classes add reusable behaviour",
    tag: "classes",
    code: `class JsonMixin:
    def to_json(self) -> str:
        import json
        return json.dumps(self.__dict__)

class LogMixin:
    def log(self, msg: str) -> None:
        print(f"[{self.__class__.__name__}] {msg}")

class User(JsonMixin, LogMixin):
    def __init__(self, name: str, age: int):
        self.name, self.age = name, age

u = User("Alice", 30)
print(u.to_json())    # {"name": "Alice", "age": 30}
u.log("created")      # [User] created`,
    explanation: "Mixins are classes that provide specific functionality without being designed for standalone instantiation — they're combined via multiple inheritance to compose behaviour modularly.",
  },
  {
    id: "py-b17-b2-dunder-del-item",
    language: "python",
    title: "__delitem__ supports del obj[key] syntax",
    tag: "classes",
    code: `class LimitedDict:
    """Dict that prevents deleting protected keys."""
    def __init__(self, protected=()):
        self._data = {}
        self._protected = set(protected)

    def __setitem__(self, key, val): self._data[key] = val
    def __getitem__(self, key): return self._data[key]

    def __delitem__(self, key):
        if key in self._protected:
            raise KeyError(f"{key!r} is protected")
        del self._data[key]

d = LimitedDict(protected=["id"])
d["id"] = 1
d["name"] = "Alice"
del d["name"]     # OK
# del d["id"]     # KeyError: 'id' is protected`,
    explanation: "`__delitem__(self, key)` is called by `del obj[key]`; together with `__getitem__` and `__setitem__` it implements the full mapping protocol for custom container types.",
  },
  {
    id: "py-b17-b2-dunder-matmul",
    language: "python",
    title: "@ operator via __matmul__",
    tag: "classes",
    code: `class Matrix:
    def __init__(self, rows):
        self.data = rows

    def __matmul__(self, other):
        """Row-by-column matrix multiplication."""
        result = []
        for row in self.data:
            out_row = []
            for col_idx in range(len(other.data[0])):
                col = [other.data[r][col_idx] for r in range(len(other.data))]
                out_row.append(sum(a * b for a, b in zip(row, col)))
            result.append(out_row)
        return Matrix(result)

A = Matrix([[1, 2], [3, 4]])
B = Matrix([[5, 6], [7, 8]])
C = A @ B
print(C.data)  # [[19, 22], [43, 50]]`,
    explanation: "`__matmul__` implements the `@` operator (PEP 465), designed for matrix multiplication; NumPy uses it so `A @ B` reads cleanly — you can implement it for any type where `@` semantics make sense.",
  },
];
