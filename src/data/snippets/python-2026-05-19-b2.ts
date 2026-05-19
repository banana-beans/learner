import type { Snippet } from "./types";

export const pythonSnippets20260519B2: Snippet[] = [
  {
    id: "py-0519-b2-itertools-chain",
    language: "python",
    title: "itertools.chain to flatten one level",
    tag: "snippet",
    code: `from itertools import chain

groups = [[1, 2, 3], [4, 5], [6, 7, 8, 9]]

# Flatten without a nested loop
flat = list(chain.from_iterable(groups))
print(flat)  # [1, 2, 3, 4, 5, 6, 7, 8, 9]

# chain(*iterables) without from_iterable
flat2 = list(chain([1, 2], [3, 4], [5]))
print(flat2)  # [1, 2, 3, 4, 5]`,
    explanation: "chain.from_iterable flattens exactly one level without building a temporary list, making it more memory-efficient than a list comprehension with sum(groups, []).",
  },
  {
    id: "py-0519-b2-itertools-islice",
    language: "python",
    title: "itertools.islice for lazy slicing of iterators",
    tag: "snippet",
    code: `from itertools import islice

def infinite_counter(start=0):
    n = start
    while True:
        yield n
        n += 1

gen = infinite_counter(10)

# Take first 5 without consuming the rest
first5 = list(islice(gen, 5))
print(first5)   # [10, 11, 12, 13, 14]

# islice(iter, start, stop, step)
gen2 = infinite_counter()
every_other = list(islice(gen2, 0, 10, 2))
print(every_other)  # [0, 2, 4, 6, 8]`,
    explanation: "islice applies slice semantics to any iterator without consuming everything first — essential when working with infinite generators or large streams you don't want to materialise.",
  },
  {
    id: "py-0519-b2-itertools-groupby",
    language: "python",
    title: "itertools.groupby — consecutive key grouping",
    tag: "snippet",
    code: `from itertools import groupby

data = [1, 1, 2, 2, 2, 3, 1, 1]

# Groups CONSECUTIVE equal elements — sort first if you want all groups
for key, group in groupby(data):
    print(key, list(group))
# 1 [1, 1]
# 2 [2, 2, 2]
# 3 [3]
# 1 [1, 1]  ← new group, not merged with first

# Sort first to group all occurrences
for key, group in groupby(sorted(data)):
    print(key, list(group))`,
    explanation: "groupby only merges consecutive identical keys, not all occurrences in the sequence — you almost always need to sort the input first if you want SQL-style GROUP BY semantics.",
  },
  {
    id: "py-0519-b2-functools-cache",
    language: "python",
    title: "functools.cache — unbounded memoisation (Python 3.9+)",
    tag: "snippet",
    code: `from functools import cache

@cache
def fib(n):
    if n < 2:
        return n
    return fib(n - 1) + fib(n - 2)

print(fib(40))   # instant; without cache: exponential time
print(fib.cache_info())
# CacheInfo(hits=38, misses=41, maxsize=None, currsize=41)

# cache is equivalent to lru_cache(maxsize=None)
# Use lru_cache(maxsize=128) to cap memory usage`,
    explanation: "functools.cache is an unbounded dict-backed memo table; each unique argument tuple is stored forever, so use lru_cache with a maxsize when the argument space is large or unbounded.",
  },
  {
    id: "py-0519-b2-functools-partial",
    language: "python",
    title: "functools.partial for pre-filled arguments",
    tag: "snippet",
    code: `from functools import partial

def power(base, exp):
    return base ** exp

square = partial(power, exp=2)
cube   = partial(power, exp=3)

print(square(5))   # 25
print(cube(3))     # 27

# Useful with map
nums = [1, 2, 3, 4, 5]
squares = list(map(square, nums))
print(squares)   # [1, 4, 9, 16, 25]`,
    explanation: "partial creates a new callable with some arguments pre-bound; it's cleaner than a lambda when you're just binding arguments to an existing function.",
  },
  {
    id: "py-0519-b2-contextlib-suppress",
    language: "python",
    title: "contextlib.suppress — ignore specific exceptions",
    tag: "snippet",
    code: `from contextlib import suppress

# Old way
try:
    int("not a number")
except ValueError:
    pass

# Concise way with suppress
with suppress(ValueError):
    int("not a number")

# Multiple exception types
with suppress(KeyError, IndexError):
    d = {}
    _ = d["missing"]  # KeyError silently ignored`,
    explanation: "contextlib.suppress is the idiomatic Python way to intentionally ignore specific exceptions in a block; it's more readable than a bare except or a try/except/pass.",
  },
  {
    id: "py-0519-b2-contextlib-contextmanager",
    language: "python",
    title: "@contextmanager — generator-based context manager",
    tag: "snippet",
    code: `from contextlib import contextmanager
import time

@contextmanager
def timer(label=""):
    start = time.perf_counter()
    try:
        yield
    finally:
        elapsed = time.perf_counter() - start
        print(f"{label}: {elapsed:.4f}s")

with timer("sort"):
    sorted(range(100_000))   # sort: 0.0032s`,
    explanation: "@contextmanager turns a generator with a single yield into a context manager; code before yield is __enter__ and code in finally is __exit__, without needing a class.",
  },
  {
    id: "py-0519-b2-pathlib-basics",
    language: "python",
    title: "pathlib.Path for OS-agnostic file paths",
    tag: "snippet",
    code: `from pathlib import Path

p = Path("/home/user/data")

child = p / "file.txt"          # join with /
print(child.suffix)             # '.txt'
print(child.stem)               # 'file'
print(child.parent)             # /home/user/data
print(child.name)               # 'file.txt'

# Glob
for f in Path(".").glob("*.py"):
    print(f)

# Read/write text without explicit open()
# child.write_text("hello")
# content = child.read_text()`,
    explanation: "pathlib.Path replaces os.path string manipulation with an object-oriented API; the / operator joins paths, and methods like read_text/write_text eliminate boilerplate open/close.",
  },
  {
    id: "py-0519-b2-dataclasses-post-init",
    language: "python",
    title: "dataclass __post_init__ for derived fields",
    tag: "snippet",
    code: `from dataclasses import dataclass

@dataclass
class Circle:
    radius: float
    # These will be set in __post_init__, not passed to __init__
    area: float = 0.0
    circumference: float = 0.0

    def __post_init__(self):
        import math
        self.area = math.pi * self.radius ** 2
        self.circumference = 2 * math.pi * self.radius

c = Circle(5.0)
print(f"{c.area:.2f}")          # 78.54
print(f"{c.circumference:.2f}") # 31.42`,
    explanation: "__post_init__ runs after the generated __init__ completes, letting you compute derived fields, validate inputs, or call super().__init__ for dataclass inheritance.",
  },
  {
    id: "py-0519-b2-typing-overload",
    language: "python",
    title: "typing.overload for multiple call signatures",
    tag: "snippet",
    code: `from typing import overload

@overload
def parse(value: int) -> str: ...
@overload
def parse(value: str) -> int: ...

def parse(value):
    if isinstance(value, int):
        return str(value)
    return int(value)

# Type checker knows which overload applies
result1: str = parse(42)     # overload 1 -> str
result2: int = parse("42")   # overload 2 -> int`,
    explanation: "@overload lets you declare multiple typed signatures for a single function; only the overloads are seen by the type checker — the actual implementation has no overload decorator.",
  },
  {
    id: "py-0519-b2-operator-module",
    language: "python",
    title: "operator module for functional-style access",
    tag: "snippet",
    code: `import operator

# operator functions are faster than lambdas for simple ops
nums = [3, 1, 4, 1, 5, 9]
print(sorted(nums, key=operator.neg))    # [9, 5, 4, 3, 1, 1]

# attrgetter / itemgetter
from operator import attrgetter, itemgetter

records = [("Alice", 30), ("Bob", 25), ("Carol", 35)]
by_age = sorted(records, key=itemgetter(1))
print(by_age)  # [('Bob', 25), ('Alice', 30), ('Carol', 35)]`,
    explanation: "The operator module provides function equivalents of Python operators and attribute/item access; they're often faster than equivalent lambdas and more explicit when passed to map/sorted/reduce.",
  },
  {
    id: "py-0519-b2-string-template",
    language: "python",
    title: "string.Template for safe user-controlled substitution",
    tag: "snippet",
    code: `from string import Template

# $name or \${name} substitution
t = Template("Hello, $name! You have $count messages.")
result = t.substitute(name="Alice", count=5)
print(result)  # Hello, Alice! You have 5 messages.

# safe_substitute doesn't raise on missing keys
t2 = Template("Dear $title $name")
print(t2.safe_substitute(name="Smith"))
# Dear $title Smith   (missing key left as-is)`,
    explanation: "string.Template uses $-substitution which is safer than % or .format() for user-supplied template strings because it doesn't evaluate expressions, preventing format-string attacks.",
  },
  {
    id: "py-0519-b2-re-named-groups",
    language: "python",
    title: "Regex named capture groups",
    tag: "snippet",
    code: `import re

pattern = re.compile(
    r"(?P<year>\\d{4})-(?P<month>\\d{2})-(?P<day>\\d{2})"
)

m = pattern.match("2026-05-19")
if m:
    print(m.group("year"))   # 2026
    print(m.group("month"))  # 05
    print(m.groupdict())     # {'year': '2026', 'month': '05', 'day': '19'}`,
    explanation: "Named groups (?P<name>...) let you retrieve matches by name instead of index, making patterns self-documenting and robust against changes to group order.",
  },
  {
    id: "py-0519-b2-decimal-context",
    language: "python",
    title: "Decimal context for precision and rounding",
    tag: "snippet",
    code: `from decimal import Decimal, getcontext, localcontext, ROUND_HALF_UP

# Global context
getcontext().prec = 10

# Temporary context (thread-local)
with localcontext() as ctx:
    ctx.prec = 4
    ctx.rounding = ROUND_HALF_UP
    result = Decimal("1") / Decimal("3")
    print(result)   # 0.3333

# Global precision still 10 outside the with block
print(Decimal("1") / Decimal("3"))   # 0.3333333333`,
    explanation: "Decimal uses a context object to control precision, rounding mode, and traps; localcontext creates a thread-local context so temporary changes don't affect other code paths.",
  },
  {
    id: "py-0519-b2-slots-inheritance",
    language: "python",
    title: "__slots__ in inheritance chains",
    tag: "snippet",
    code: `class Base:
    __slots__ = ("x",)
    def __init__(self, x): self.x = x

class Child(Base):
    __slots__ = ("y",)    # only add NEW slots; x inherited
    def __init__(self, x, y):
        super().__init__(x)
        self.y = y

c = Child(1, 2)
print(c.x, c.y)   # 1 2

# If Child omits __slots__, it gets a __dict__ anyway
class Bad(Base): pass  # no __slots__ -> __dict__ reappears
b = Bad(1)
b.z = 99           # works even though Base had __slots__`,
    explanation: "Each class in a __slots__ hierarchy only declares the new slots it introduces; forgetting __slots__ in a subclass silently re-adds __dict__, negating the memory savings.",
  },
  {
    id: "py-0519-b2-generator-yield-from",
    language: "python",
    title: "yield from — delegating to a sub-generator",
    tag: "snippet",
    code: `def flatten(items):
    for item in items:
        if isinstance(item, list):
            yield from flatten(item)   # delegate recursively
        else:
            yield item

nested = [1, [2, [3, 4], 5], [6, 7]]
print(list(flatten(nested)))   # [1, 2, 3, 4, 5, 6, 7]

# yield from also passes .send() and .throw() through
def chain_gen(a, b):
    yield from a   # transparent delegation
    yield from b`,
    explanation: "yield from transparently delegates to another generator, forwarding send/throw/close calls; it's the idiomatic way to write generator pipelines and recursive generators.",
  },
  {
    id: "py-0519-b2-asyncio-gather",
    language: "python",
    title: "asyncio.gather for concurrent coroutines",
    tag: "snippet",
    code: `import asyncio

async def fetch(url):
    await asyncio.sleep(0.1)   # simulate network
    return f"data from {url}"

async def main():
    # Run all coroutines concurrently, not sequentially
    results = await asyncio.gather(
        fetch("api/users"),
        fetch("api/posts"),
        fetch("api/comments"),
    )
    for r in results:
        print(r)

asyncio.run(main())
# Total time ~0.1s instead of 0.3s`,
    explanation: "asyncio.gather schedules multiple coroutines to run concurrently within a single thread; it returns a list of results in the same order as the inputs, collecting all before returning.",
  },
  {
    id: "py-0519-b2-asyncio-taskgroup",
    language: "python",
    title: "asyncio.TaskGroup for structured concurrency (Python 3.11+)",
    tag: "snippet",
    code: `import asyncio

async def fetch(n):
    await asyncio.sleep(0.05)
    return n * 2

async def main():
    async with asyncio.TaskGroup() as tg:
        t1 = tg.create_task(fetch(1))
        t2 = tg.create_task(fetch(2))
        t3 = tg.create_task(fetch(3))
    # All tasks complete (or exception raised) when exiting the block
    print(t1.result(), t2.result(), t3.result())  # 2 4 6

asyncio.run(main())`,
    explanation: "TaskGroup provides structured concurrency: if any task raises an exception, the remaining tasks are cancelled and an ExceptionGroup is raised — safer than gather which can leave tasks running.",
  },
  {
    id: "py-0519-b2-int-methods",
    language: "python",
    title: "int.bit_length, bit_count, to_bytes, from_bytes",
    tag: "snippet",
    code: `n = 255

print(n.bit_length())   # 8  (minimum bits to represent n)
print(n.bit_count())    # 8  (popcount — number of 1 bits; Python 3.10+)

# Convert to/from bytes
b = n.to_bytes(2, byteorder="big")
print(b.hex())           # '00ff'

n2 = int.from_bytes(b"\\x00\\xff", byteorder="big")
print(n2)                # 255

# Little-endian
le = (1024).to_bytes(4, byteorder="little")
print(le.hex())          # '00040000'`,
    explanation: "int has byte-conversion methods for binary protocols; bit_length gives the minimum number of bits for the value, and bit_count (popcount) counts set bits — both are useful for compression and hashing.",
  },
  {
    id: "py-0519-b2-str-methods-chain",
    language: "python",
    title: "Chaining str methods for text cleanup",
    tag: "snippet",
    code: `raw = "  Hello,  World!   "

# Chain multiple string methods
clean = raw.strip().lower().replace(",", "").replace("!", "")
print(clean)    # 'hello  world'

# Split and rejoin to normalize whitespace
normalized = " ".join(clean.split())
print(normalized)  # 'hello world'

# Title case, center, justify
print("python".title())       # Python
print("hi".center(10, "-"))   # ----hi----
print("left".ljust(10, "."))  # left......`,
    explanation: "String methods return new strings so they chain naturally; the split-then-join idiom is the idiomatic Python way to collapse multiple spaces into one.",
  },
  {
    id: "py-0519-b2-dict-comprehension",
    language: "python",
    title: "Dict comprehension and inversion",
    tag: "snippet",
    code: `# Forward: word -> length
words = ["apple", "banana", "cherry"]
lengths = {w: len(w) for w in words}
print(lengths)   # {'apple': 5, 'banana': 6, 'cherry': 6}

# Inversion: value -> key (only works if values are unique)
original = {"a": 1, "b": 2, "c": 3}
inverted = {v: k for k, v in original.items()}
print(inverted)  # {1: 'a', 2: 'b', 3: 'c'}

# Filter during comprehension
evens = {k: v for k, v in original.items() if v % 2 == 0}
print(evens)     # {'b': 2}`,
    explanation: "Dict comprehensions use {key_expr: val_expr for item in iterable if condition} syntax; dict inversion by swapping k and v only produces correct results when all values are unique.",
  },
  {
    id: "py-0519-b2-set-comprehension",
    language: "python",
    title: "Set comprehension for unique derived values",
    tag: "snippet",
    code: `words = ["apple", "banana", "avocado", "blueberry", "cherry"]

# Set comprehension: deduplicated result
first_letters = {w[0] for w in words}
print(first_letters)   # {'a', 'b', 'c'}  (unordered)

# Find duplicate first letters
from collections import Counter
dupes = {w[0] for w, c in Counter(w[0] for w in words).items() if c > 1}
print(dupes)   # {'a', 'b'}`,
    explanation: "Set comprehensions use {expr for item in iterable} and automatically deduplicate; they're faster than building a list and passing it to set() when the expression is non-trivial.",
  },
  {
    id: "py-0519-b2-exception-groups",
    language: "python",
    title: "ExceptionGroup and except* (Python 3.11+)",
    tag: "snippet",
    code: `# Raise multiple exceptions simultaneously
def multi_fail():
    raise ExceptionGroup("multiple failures", [
        ValueError("bad value"),
        TypeError("bad type"),
        KeyError("missing key"),
    ])

try:
    multi_fail()
except* ValueError as eg:
    print("Value errors:", eg.exceptions)
except* TypeError as eg:
    print("Type errors:", eg.exceptions)
# KeyError propagates because it's unhandled`,
    explanation: "ExceptionGroup (Python 3.11) bundles multiple exceptions together and except* handles subsets by type, enabling structured error reporting in concurrent code via TaskGroup.",
  },
  {
    id: "py-0519-b2-match-guard",
    language: "python",
    title: "match-case with guard conditions",
    tag: "snippet",
    code: `def classify(point):
    match point:
        case (x, y) if x == y:
            return "diagonal"
        case (x, y) if x == 0:
            return "y-axis"
        case (x, y) if y == 0:
            return "x-axis"
        case (x, y) if x > 0 and y > 0:
            return "quadrant I"
        case _:
            return "other"

print(classify((3, 3)))   # diagonal
print(classify((0, 5)))   # y-axis
print(classify((2, 4)))   # quadrant I`,
    explanation: "A guard (if condition) after a match-case pattern adds an additional filter; the case only fires when both the structural pattern matches AND the guard evaluates to True.",
  },
  {
    id: "py-0519-b2-match-class",
    language: "python",
    title: "match-case with class patterns",
    tag: "snippet",
    code: `from dataclasses import dataclass

@dataclass
class Point: x: float; y: float

@dataclass
class Circle: center: Point; radius: float

def describe(shape):
    match shape:
        case Circle(center=Point(x=0, y=0), radius=r):
            return f"Circle at origin, r={r}"
        case Circle(center=Point(x=cx, y=cy), radius=r):
            return f"Circle at ({cx},{cy}), r={r}"
        case _:
            return "unknown"

print(describe(Circle(Point(0, 0), 5)))  # Circle at origin, r=5`,
    explanation: "Class patterns in match-case destructure objects by inspecting named attributes, and can be nested arbitrarily — they check isinstance before binding attribute values.",
  },
  {
    id: "py-0519-b2-positional-only-args",
    language: "python",
    title: "Positional-only parameters with / (Python 3.8+)",
    tag: "snippet",
    code: `# Parameters before / are positional-only (can't be passed as keyword)
def pow(base, exp, /):
    return base ** exp

print(pow(2, 10))       # 1024
# pow(base=2, exp=10)   # TypeError: positional-only argument

# Combine with keyword-only (after *)
def f(pos_only, /, normal, *, kw_only):
    return pos_only + normal + kw_only

print(f(1, 2, kw_only=3))          # 6
print(f(1, normal=2, kw_only=3))   # 6`,
    explanation: "/ separates positional-only params (which can't be passed by keyword), useful for C extensions and APIs where the parameter name is irrelevant or might change.",
  },
  {
    id: "py-0519-b2-keyword-only-args",
    language: "python",
    title: "Keyword-only parameters with * (PEP 3102)",
    tag: "snippet",
    code: `# Parameters after * must be passed as keyword arguments
def connect(host, port, *, timeout=30, retries=3):
    print(f"Connecting to {host}:{port} (timeout={timeout})")

connect("db.example.com", 5432)                    # uses defaults
connect("db.example.com", 5432, timeout=60)        # OK
# connect("db.example.com", 5432, 60)  # TypeError: positional`,
    explanation: "Placing * in the parameter list makes everything to its right keyword-only, preventing callers from passing those arguments positionally and making the call site more self-documenting.",
  },
  {
    id: "py-0519-b2-class-decorator",
    language: "python",
    title: "Class-based decorator with state",
    tag: "snippet",
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
                    print(f"Retry {attempt + 1}")
        return wrapper

@retry(times=3)
def flaky():
    import random
    if random.random() < 0.7:
        raise ValueError("failed")
    return "ok"`,
    explanation: "A class-based decorator uses __init__ for configuration and __call__ to wrap the function, making it easy to store state (like retry counts or caches) between calls.",
  },
  {
    id: "py-0519-b2-protocol-runtime",
    language: "python",
    title: "runtime_checkable Protocol for isinstance checks",
    tag: "snippet",
    code: `from typing import Protocol, runtime_checkable

@runtime_checkable
class Sized(Protocol):
    def __len__(self) -> int: ...

# isinstance works with runtime_checkable Protocols
print(isinstance([1, 2, 3], Sized))   # True
print(isinstance("hello", Sized))     # True
print(isinstance(42, Sized))          # False

# Without @runtime_checkable, isinstance raises TypeError
from typing import SupportsInt
try:
    isinstance(42, SupportsInt)
except TypeError as e:
    print(e)`,
    explanation: "@runtime_checkable makes isinstance() work with a Protocol by checking for the presence of the required methods, enabling duck-typing checks without actual subclass registration.",
  },
  {
    id: "py-0519-b2-dataclass-frozen",
    language: "python",
    title: "Frozen dataclass as an immutable value object",
    tag: "snippet",
    code: `from dataclasses import dataclass

@dataclass(frozen=True)
class Point:
    x: float
    y: float

    def distance_from_origin(self):
        return (self.x ** 2 + self.y ** 2) ** 0.5

p = Point(3.0, 4.0)
print(p.distance_from_origin())   # 5.0

# Mutation raises FrozenInstanceError
try:
    p.x = 10
except Exception as e:
    print(type(e).__name__)   # FrozenInstanceError

# Hashable — usable in sets and as dict keys
s = {p}`,
    explanation: "frozen=True makes a dataclass immutable by raising FrozenInstanceError on any mutation, and also enables __hash__ so instances can be used as dict keys or set members.",
  },
  {
    id: "py-0519-b2-io-stringio",
    language: "python",
    title: "io.StringIO — in-memory file-like object",
    tag: "snippet",
    code: `import io, csv

# Write CSV to memory instead of disk
buffer = io.StringIO()
writer = csv.writer(buffer)
writer.writerow(["name", "age"])
writer.writerow(["Alice", 30])
writer.writerow(["Bob", 25])

# Seek back to read what was written
buffer.seek(0)
print(buffer.read())
# name,age
# Alice,30
# Bob,25`,
    explanation: "io.StringIO acts like an open text file but stores everything in memory; it's the standard way to pass text to APIs that expect a file object without actually writing to disk.",
  },
  {
    id: "py-0519-b2-re-findall-finditer",
    language: "python",
    title: "re.findall vs re.finditer",
    tag: "snippet",
    code: `import re

text = "Call 555-1234 or 555-5678 for support"

# findall: returns a list of strings (or list of tuples for groups)
numbers = re.findall(r"\\d{3}-\\d{4}", text)
print(numbers)   # ['555-1234', '555-5678']

# finditer: returns an iterator of Match objects (lazy, has span)
for m in re.finditer(r"\\d{3}-\\d{4}", text):
    print(m.group(), m.span())
# 555-1234 (5, 13)
# 555-5678 (17, 25)`,
    explanation: "findall returns all matches as strings eagerly; finditer returns Match objects lazily, giving you position info and avoiding memory overhead when there are many matches.",
  },
  {
    id: "py-0519-b2-slots-weakref",
    language: "python",
    title: "__slots__ and __weakref__",
    tag: "snippet",
    code: `import weakref

class WithSlots:
    __slots__ = ("x",)   # no __weakref__ slot!

    def __init__(self, x):
        self.x = x

class WithWeakref:
    __slots__ = ("x", "__weakref__")   # explicitly include it

    def __init__(self, x):
        self.x = x

w = WithWeakref(42)
ref = weakref.ref(w)    # works

try:
    bad = WithSlots(42)
    weakref.ref(bad)    # TypeError: cannot create weak reference
except TypeError as e:
    print(e)`,
    explanation: "Classes using __slots__ lose the implicit __weakref__ slot; add '__weakref__' to __slots__ explicitly if you need weak references to instances.",
  },
  {
    id: "py-0519-b2-typing-cast",
    language: "python",
    title: "typing.cast — tell the type checker without coercion",
    tag: "snippet",
    code: `from typing import cast

def get_value() -> object:
    return "hello"  # returns object type

# cast tells the type checker to treat value as str
# It does NOT validate or convert at runtime
s = cast(str, get_value())
print(s.upper())   # HELLO  — type checker won't complain

# cast is zero-cost at runtime — it's just an identity function
import typing
print(typing.cast.__doc__)`,
    explanation: "cast(Type, value) is purely a type-checker annotation hint — at runtime it simply returns value unchanged; use it sparingly when you know more about a type than the checker can infer.",
  },
  {
    id: "py-0519-b2-walrus-while",
    language: "python",
    title: "Walrus operator in while loops",
    tag: "snippet",
    code: `import re

text = "the cat sat on the mat"
pattern = re.compile(r"(\\w+at)")
pos = 0

# Compact read-and-test loop
while m := pattern.search(text, pos):
    print(m.group())   # cat, sat, mat
    pos = m.end()

# Classic file read loop
import io
f = io.StringIO("line1\\nline2\\nline3\\n")
while line := f.readline():
    print(line.rstrip())   # line1, line2, line3`,
    explanation: "The walrus operator in a while condition reads and tests in one expression, eliminating the read-then-break pattern for file iteration and regex scanning.",
  },
  {
    id: "py-0519-b2-pep604-typeguard",
    language: "python",
    title: "TypeGuard for narrowing types in conditions",
    tag: "snippet",
    code: `from typing import TypeGuard

def is_list_of_str(val: list) -> TypeGuard[list[str]]:
    return all(isinstance(x, str) for x in val)

def process(items: list):
    if is_list_of_str(items):
        # Inside this branch, type checker knows items: list[str]
        print(", ".join(items))
    else:
        print("not all strings")

process(["a", "b", "c"])   # a, b, c
process([1, "b", 3])       # not all strings`,
    explanation: "TypeGuard[T] as a return annotation tells the type checker that a True return means the input's type has been narrowed to T, enabling safe downstream usage without explicit casts.",
  },
  {
    id: "py-0519-b2-abc-property",
    language: "python",
    title: "Abstract property in ABC",
    tag: "snippet",
    code: `from abc import ABC, abstractmethod

class Shape(ABC):
    @property
    @abstractmethod
    def area(self) -> float: ...

    @property
    @abstractmethod
    def name(self) -> str: ...

class Triangle(Shape):
    def __init__(self, base, height):
        self._base = base
        self._height = height

    @property
    def area(self) -> float:
        return 0.5 * self._base * self._height

    @property
    def name(self) -> str:
        return "Triangle"

t = Triangle(6, 4)
print(t.area, t.name)   # 12.0 Triangle`,
    explanation: "Combining @property with @abstractmethod requires subclasses to implement a property (not just a method); both decorators must be applied, with @property outermost.",
  },
  {
    id: "py-0519-b2-classvar-vs-initvar",
    language: "python",
    title: "ClassVar vs InitVar in dataclasses",
    tag: "snippet",
    code: `from dataclasses import dataclass, field
from typing import ClassVar

@dataclass
class Employee:
    # ClassVar: class-level, not included in __init__ or __repr__
    company: ClassVar[str] = "Acme Corp"
    count:   ClassVar[int] = 0

    name: str
    dept: str

    def __post_init__(self):
        Employee.count += 1

e1 = Employee("Alice", "Engineering")
e2 = Employee("Bob", "Sales")

print(Employee.company)  # Acme Corp
print(Employee.count)    # 2
print(vars(e1))          # only name and dept — no company/count`,
    explanation: "ClassVar[T] tells dataclass (and type checkers) that a field is a class attribute, excluding it from __init__, __repr__, and __eq__; it's the correct way to have class-level constants alongside instance fields.",
  },
  {
    id: "py-0519-b2-super-mro",
    language: "python",
    title: "super() and MRO in multiple inheritance",
    tag: "snippet",
    code: `class A:
    def greet(self): print("A"); super().greet() if hasattr(super(), "greet") else None

class B(A):
    def greet(self): print("B"); super().greet()

class C(A):
    def greet(self): print("C"); super().greet()

class D(B, C):
    def greet(self): print("D"); super().greet()

D().greet()   # D B C A
print(D.__mro__)
# [D, B, C, A, object]`,
    explanation: "Python's C3 linearisation algorithm computes the MRO; super() always calls the next class in the MRO, so cooperative multiple inheritance requires every class to call super() and accept **kwargs.",
  },
  {
    id: "py-0519-b2-enum-basics",
    language: "python",
    title: "enum.Enum for named constants",
    tag: "snippet",
    code: `from enum import Enum, auto

class Color(Enum):
    RED   = auto()
    GREEN = auto()
    BLUE  = auto()

c = Color.RED
print(c)          # Color.RED
print(c.name)     # RED
print(c.value)    # 1

# Comparison
print(c == Color.RED)    # True
print(c is Color.RED)    # True (singletons)

# Iterate all members
for col in Color:
    print(col.name, col.value)`,
    explanation: "Enum members are singletons so identity comparison is safe; auto() assigns sequential integer values automatically, and accessing unknown members raises AttributeError rather than silently returning None.",
  },
  {
    id: "py-0519-b2-enum-flags",
    language: "python",
    title: "enum.Flag for bitwise combinable values",
    tag: "snippet",
    code: `from enum import Flag, auto

class Permission(Flag):
    READ    = auto()
    WRITE   = auto()
    EXECUTE = auto()

    # Combinations are also valid members
    READ_WRITE = READ | WRITE

user = Permission.READ | Permission.WRITE
print(user)                           # Permission.READ|WRITE
print(Permission.READ in user)        # True
print(Permission.EXECUTE in user)     # False

user |= Permission.EXECUTE            # add permission
print(Permission.EXECUTE in user)     # True`,
    explanation: "Flag enables bitfield-style permission masks with readable enum names; the in operator tests for a specific flag, and | combines flags into composites.",
  },
  {
    id: "py-0519-b2-contextmanager-enter-value",
    language: "python",
    title: "Context manager yield value and exception handling",
    tag: "snippet",
    code: `from contextlib import contextmanager

@contextmanager
def open_resource(name):
    print(f"Opening {name}")
    resource = {"name": name, "data": []}
    try:
        yield resource                   # value bound by 'as'
    except ValueError as e:
        print(f"Handled error: {e}")     # swallow ValueError
        # don't re-raise — exception is suppressed
    finally:
        print(f"Closing {name}")         # always runs

with open_resource("db") as res:
    res["data"].append(1)
    raise ValueError("oops")   # caught and swallowed
# Opening db / Handled error: oops / Closing db`,
    explanation: "Inside a @contextmanager generator, catching an exception in the try block suppresses it (like returning True from __exit__); re-raising or not catching lets it propagate.",
  },
  {
    id: "py-0519-b2-zip-dict-merge",
    language: "python",
    title: "zip to build a dict from two lists",
    tag: "snippet",
    code: `keys   = ["a", "b", "c", "d"]
values = [1, 2, 3, 4]

# Fastest idiom to pair two sequences
d = dict(zip(keys, values))
print(d)   # {'a': 1, 'b': 2, 'c': 3, 'd': 4}

# Equivalent dict comprehension
d2 = {k: v for k, v in zip(keys, values)}

# Unzip: split a list of pairs back into two lists
pairs = [(1, "a"), (2, "b"), (3, "c")]
nums, chars = zip(*pairs)
print(nums)   # (1, 2, 3)
print(chars)  # ('a', 'b', 'c')`,
    explanation: "dict(zip(keys, values)) is the canonical way to build a dict from parallel lists; zip(*pairs) is the transpose trick that inverts a list of pairs back into separate sequences.",
  },
  {
    id: "py-0519-b2-any-all-short-circuit",
    language: "python",
    title: "Short-circuit generators in any/all",
    tag: "snippet",
    code: `import time

def slow_check(x):
    time.sleep(0.001)
    return x > 0

# BAD: list comp evaluates all 1000 before any()
start = time.time()
any([slow_check(x) for x in range(1000)])   # checks all 1000!

# GOOD: generator stops at first True
start = time.time()
any(slow_check(x) for x in range(1000))    # stops at x=0 (>0? No)

data = [-1, -2, 5, -3]
any(slow_check(x) for x in data)  # stops at 5 (3 checks, not 4)`,
    explanation: "Passing a generator (not a list) to any/all enables short-circuit evaluation; a list comprehension evaluates everything before any/all sees the first element.",
  },
  {
    id: "py-0519-b2-heapq-merge",
    language: "python",
    title: "heapq.merge for sorted iterator merging",
    tag: "snippet",
    code: `import heapq

a = [1, 4, 7, 10]
b = [2, 5, 8, 11]
c = [3, 6, 9, 12]

# Merge sorted iterables without loading all into memory
merged = heapq.merge(a, b, c)
print(list(merged))   # [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

# Works on any number of already-sorted iterables
# O(n log k) where k is the number of iterables`,
    explanation: "heapq.merge lazily merges sorted iterables using a k-way heap merge; it's the right tool for merging large sorted files without loading everything into memory.",
  },
  {
    id: "py-0519-b2-dict-keys-views",
    language: "python",
    title: "dict keys/values/items views are live",
    tag: "snippet",
    code: `d = {"a": 1, "b": 2, "c": 3}

keys = d.keys()       # dict_keys — a live view, not a list
print(keys)           # dict_keys(['a', 'b', 'c'])

d["d"] = 4
print(keys)           # dict_keys(['a', 'b', 'c', 'd']) — updated!

# keys() view supports set operations
other = {"b": 10, "d": 20, "e": 30}
print(d.keys() & other.keys())    # {'b', 'd'}
print(d.keys() - other.keys())    # {'a', 'c'}`,
    explanation: "dict.keys(), .values(), and .items() return live views that reflect later mutations; .keys() also supports set-algebra operations without converting to a set.",
  },
  {
    id: "py-0519-b2-unpacking-in-call",
    language: "python",
    title: "* and ** unpacking in function calls",
    tag: "snippet",
    code: `def greet(name, greeting, punctuation):
    print(f"{greeting}, {name}{punctuation}")

args   = ("Alice", "Hello")
kwargs = {"punctuation": "!"}

greet(*args, **kwargs)   # Hello, Alice!

# Combine multiple unpacks
extra = {"greeting": "Hi"}
merged = {**extra, **{"punctuation": "."}}
greet("Bob", **merged)   # Hi, Bob.

# Also works in list/dict literals
a, b = [1, 2], [3, 4]
combined = [*a, *b]      # [1, 2, 3, 4]`,
    explanation: "* unpacks an iterable into positional arguments and ** unpacks a dict into keyword arguments; they also work inside list and dict literals to merge sequences and mappings.",
  },
  {
    id: "py-0519-b2-class-var-type-annotation",
    language: "python",
    title: "Annotating class vs instance variables correctly",
    tag: "snippet",
    code: `from typing import ClassVar

class Counter:
    # ClassVar: shared across all instances
    total: ClassVar[int] = 0

    # No ClassVar: each instance gets its own
    def __init__(self, name: str) -> None:
        self.name = name
        Counter.total += 1

c1 = Counter("a")
c2 = Counter("b")
print(Counter.total)   # 2

# type: ignore alternatives
class Example:
    # Bare annotation with no value -> instance variable
    value: int  # no default, must be set in __init__`,
    explanation: "ClassVar[T] in a class body signals a class attribute to both mypy and dataclasses; without ClassVar, an annotated name with a value is treated as an instance variable.",
  },
  {
    id: "py-0519-b2-abc-registration",
    language: "python",
    title: "ABC.register for virtual subclasses",
    tag: "snippet",
    code: `from abc import ABC

class JSONSerializable(ABC):
    pass

# Register a third-party class as a virtual subclass
# (without modifying the third-party code)
JSONSerializable.register(dict)
JSONSerializable.register(list)

print(issubclass(dict, JSONSerializable))   # True
print(isinstance({}, JSONSerializable))      # True

# But dict doesn't inherit from JSONSerializable
print(JSONSerializable in dict.__mro__)      # False`,
    explanation: "ABC.register declares a class as a 'virtual subclass' without actual inheritance; isinstance and issubclass return True, but the class doesn't appear in the MRO — useful for adapting third-party classes.",
  },
  {
    id: "py-0519-b2-contextlib-exitstack",
    language: "python",
    title: "contextlib.ExitStack for dynamic context managers",
    tag: "snippet",
    code: `from contextlib import ExitStack

files_to_open = ["a.txt", "b.txt", "c.txt"]  # could be 0..N

with ExitStack() as stack:
    handles = []
    for path in files_to_open:
        try:
            f = stack.enter_context(open(path))
            handles.append(f)
        except FileNotFoundError:
            pass    # skip missing files
    # All successfully opened files are closed when exiting the with block`,
    explanation: "ExitStack dynamically composes context managers; you can push an unknown number of them at runtime and they're all cleaned up in LIFO order when the stack exits.",
  },
  {
    id: "py-0519-b2-property-cached",
    language: "python",
    title: "functools.cached_property — lazy per-instance memoisation",
    tag: "snippet",
    code: `from functools import cached_property
import time

class Dataset:
    def __init__(self, path):
        self.path = path

    @cached_property
    def data(self):
        print(f"Loading {self.path}...")
        time.sleep(0.1)   # expensive
        return list(range(100))

ds = Dataset("data.csv")
print(len(ds.data))    # Loading data.csv... 100
print(len(ds.data))    # 100  (no reload — stored in instance __dict__)`,
    explanation: "cached_property computes a value once on first access and stores it in the instance's __dict__, replacing the descriptor on the instance so subsequent access is a plain dict lookup.",
  },
  {
    id: "py-0519-b2-format-spec",
    language: "python",
    title: "Format spec mini-language",
    tag: "snippet",
    code: `n = 1234567.89

print(f"{n:,.2f}")    # 1,234,567.89  (comma, 2 decimals)
print(f"{n:>15.1f}") # '      1234567.9'  (right-align, width 15)
print(f"{n:e}")       # 1.234568e+06  (scientific)

x = 255
print(f"{x:b}")   # 11111111  (binary)
print(f"{x:o}")   # 377       (octal)
print(f"{x:x}")   # ff        (hex)
print(f"{x:#010x}")  # 0x000000ff  (padded hex with prefix)`,
    explanation: "Python's format specification mini-language inside {} or format() covers alignment, fill, width, precision, grouping separators, and numeric base — all without needing a format library.",
  },
  {
    id: "py-0519-b2-functools-wraps",
    language: "python",
    title: "functools.wraps preserves decorated function metadata",
    tag: "snippet",
    code: `import functools

def my_decorator(func):
    # Without @wraps: wrapper.__name__ would be 'wrapper'
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        print("before")
        result = func(*args, **kwargs)
        print("after")
        return result
    return wrapper

@my_decorator
def greet(name: str) -> str:
    """Say hello."""
    return f"Hello, {name}"

print(greet.__name__)   # greet  (not wrapper)
print(greet.__doc__)    # Say hello.`,
    explanation: "@functools.wraps(func) copies __name__, __doc__, __module__, and __annotations__ from the original function to the wrapper so that introspection, logging, and documentation tools see the real function.",
  },
  {
    id: "py-0519-b2-singledispatch-method",
    language: "python",
    title: "singledispatchmethod for class-based dispatch",
    tag: "snippet",
    code: `from functools import singledispatchmethod

class Formatter:
    @singledispatchmethod
    def format(self, value) -> str:
        raise NotImplementedError(f"Cannot format {type(value)}")

    @format.register(int)
    @format.register(float)
    def _(self, value) -> str:
        return f"{value:,.2f}"

    @format.register(list)
    def _(self, value) -> str:
        return "[" + ", ".join(self.format(v) for v in value) + "]"

f = Formatter()
print(f.format(1234.5))       # 1,234.50
print(f.format([1, 2.5, 3]))  # [1.00, 2.50, 3.00]`,
    explanation: "singledispatchmethod brings single dispatch to instance methods; it dispatches on the type of the first non-self argument, delegating to type-specific implementations.",
  },
  {
    id: "py-0519-b2-generatorexp-memory",
    language: "python",
    title: "Generator expression vs list comprehension: memory",
    tag: "understanding",
    code: `import sys

# List comprehension: all items in memory at once
lst = [x ** 2 for x in range(1_000_000)]
print(sys.getsizeof(lst))   # ~8 MB

# Generator expression: lazy, one item at a time
gen = (x ** 2 for x in range(1_000_000))
print(sys.getsizeof(gen))   # ~112 bytes!

# You can only iterate the generator once
total = sum(gen)             # consumes the generator
print(sum(gen))              # 0 — already exhausted`,
    explanation: "A generator expression produces items lazily one at a time; the memory footprint is constant regardless of the number of items, making it ideal for large datasets you're only reading once.",
  },
  {
    id: "py-0519-b2-global-lookup",
    language: "python",
    title: "Local variable lookup is faster than global",
    tag: "understanding",
    code: `import timeit

x = 42  # global

def use_global():
    return x * x   # LOAD_GLOBAL bytecode

def use_local():
    y = 42         # LOAD_FAST bytecode (faster)
    return y * y

# Or rebind a global to a local for hot loops
import math
def fast_sqrt_loop(data):
    sqrt = math.sqrt    # local alias — one LOAD_GLOBAL, then LOAD_FAST
    return [sqrt(v) for v in data]`,
    explanation: "Python looks up local variables via a fixed-offset array (LOAD_FAST) but globals require a dict lookup (LOAD_GLOBAL); in tight loops, aliasing frequently-used globals to locals is a real optimization.",
  },
  {
    id: "py-0519-b2-mutable-default-trap",
    language: "python",
    title: "Mutable default in class — shared across instances",
    tag: "understanding",
    code: `class Config:
    options = {}    # class attribute — ONE dict shared by all instances!

    def set(self, key, value):
        self.options[key] = value   # mutates the shared dict!

c1 = Config()
c2 = Config()
c1.set("debug", True)

print(c2.options)   # {'debug': True}  — c2 sees c1's change!

# Fix: create instance dict in __init__
class ConfigFixed:
    def __init__(self):
        self.options = {}   # each instance gets its own dict`,
    explanation: "A mutable class attribute is shared across all instances; when you mutate it (append, update) rather than rebind it, the change is visible through every instance — almost always a bug.",
  },
  {
    id: "py-0519-b2-truthiness-empty",
    language: "python",
    title: "Truthiness: empty containers are falsy",
    tag: "understanding",
    code: `# All of these are falsy in Python
falsy_values = [0, 0.0, "", [], {}, set(), (), None, False, 0j]
for v in falsy_values:
    assert not v, f"{v!r} should be falsy"

# Subtle: 0-length numpy array behaviour differs
# Don't rely on truthiness for non-standard objects

# Common idiomatic use
items = []
if not items:
    print("nothing here")   # nothing here

name = ""
display = name or "Anonymous"   # "Anonymous"`,
    explanation: "Python defines falsy as: None, False, zero of any numeric type, empty strings/bytes, and empty containers; testing `if not items` is idiomatic but breaks for numpy arrays with overridden __bool__.",
  },
  {
    id: "py-0519-b2-identity-small-ints",
    language: "python",
    title: "CPython caches small integers",
    tag: "understanding",
    code: `# CPython interns integers in range [-5, 256]
a = 256
b = 256
print(a is b)   # True — same cached object

c = 257
d = 257
print(c is d)   # False — different objects (may vary by context)

# Never use 'is' to compare int values
x = int("255")
y = int("255")
print(x is y)   # True (cached)

x = int("257")
y = int("257")
print(x is y)   # False`,
    explanation: "CPython interns integers from -5 to 256 for performance; using is instead of == for integer equality accidentally works for small numbers but fails for larger ones.",
  },
  {
    id: "py-0519-b2-closure-cell",
    language: "python",
    title: "Closure cells — how closures share state",
    tag: "understanding",
    code: `def make_counter():
    count = 0        # lives in a 'cell'

    def increment():
        nonlocal count
        count += 1
        return count

    def reset():
        nonlocal count
        count = 0

    return increment, reset

inc, rst = make_counter()
print(inc(), inc(), inc())  # 1 2 3
rst()
print(inc())                # 1

# Both closures share the SAME cell
print(inc.__closure__[0].cell_contents)  # 1`,
    explanation: "Closures share variables via cell objects; both inner functions reference the same cell, so mutations from one are visible in the other — this is how Python closures provide shared mutable state.",
  },
  {
    id: "py-0519-b2-exception-hierarchy",
    language: "python",
    title: "Exception hierarchy — catch the right level",
    tag: "understanding",
    code: `# BaseException
#   SystemExit, KeyboardInterrupt, GeneratorExit  (don't catch these!)
#   Exception
#     ValueError, TypeError, KeyError, IndexError, ...
#     ArithmeticError -> ZeroDivisionError, OverflowError
#     LookupError -> KeyError, IndexError
#     OSError -> FileNotFoundError, PermissionError, ...

try:
    {}["missing"]
except LookupError:     # catches both KeyError and IndexError
    print("lookup failed")

# Never do this:
try:
    raise SystemExit(0)
except Exception:       # misses SystemExit!
    pass`,
    explanation: "Catching a parent exception class catches all its subclasses; catching Exception is often too broad (misses SystemExit, KeyboardInterrupt); catching BaseException is almost never correct.",
  },
  {
    id: "py-0519-b2-classmethod-inheritance",
    language: "python",
    title: "classmethod and inheritance — cls is the subclass",
    tag: "understanding",
    code: `class Animal:
    name = "Animal"

    @classmethod
    def create(cls):
        # cls is whatever class the method was called on
        return cls()

    def describe(self):
        return type(self).name

class Dog(Animal):
    name = "Dog"

animal = Animal.create()   # cls = Animal
dog    = Dog.create()      # cls = Dog — NOT Animal!

print(dog.describe())    # Dog`,
    explanation: "classmethod receives the actual class it was called on as cls, not the defining class; this lets subclasses inherit factory methods that correctly instantiate the subclass instead of the parent.",
  },
  {
    id: "py-0519-b2-with-multiple",
    language: "python",
    title: "Multiple context managers in one with statement",
    tag: "understanding",
    code: `import contextlib

# Python 3.1+: comma-separated
with open("/dev/null", "w") as f1, open("/dev/null", "w") as f2:
    f1.write("a")
    f2.write("b")

# Parenthesized form for multi-line (Python 3.10+)
with (
    open("/dev/null", "w") as a,
    open("/dev/null", "w") as b,
):
    pass

# ExitStack for runtime-determined count
with contextlib.ExitStack() as stack:
    files = [stack.enter_context(open("/dev/null")) for _ in range(3)]`,
    explanation: "Multiple comma-separated managers in one with clause enter in left-to-right order and exit in right-to-left order; use ExitStack when the number of managers isn't known at write time.",
  },
  {
    id: "py-0519-b2-object-creation",
    language: "python",
    title: "__new__ vs __init__ — allocation vs initialisation",
    tag: "classes",
    code: `class Singleton:
    _instance = None

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            # __new__ allocates and returns the new instance
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self, value):
        # __init__ is called every time, even if __new__ returned existing
        self.value = value

a = Singleton(1)
b = Singleton(2)
print(a is b)       # True — same object
print(a.value)      # 2 — __init__ ran again on same instance`,
    explanation: "__new__ creates and returns the instance (or an existing one for Singleton); __init__ initialises it afterward and is called whether __new__ created a new object or returned an existing one.",
  },
  {
    id: "py-0519-b2-descriptor-nondata",
    language: "python",
    title: "Data descriptor vs non-data descriptor lookup order",
    tag: "classes",
    code: `class DataDescriptor:
    def __get__(self, obj, cls): return "data_get"
    def __set__(self, obj, val): pass   # has __set__ -> data descriptor

class NonDataDescriptor:
    def __get__(self, obj, cls): return "non_data_get"
    # no __set__ -> non-data descriptor

class Example:
    d = DataDescriptor()
    nd = NonDataDescriptor()

e = Example()
e.__dict__["d"]  = "instance_d"   # shadow attempt
e.__dict__["nd"] = "instance_nd"  # shadow succeeds

print(e.d)    # data_get   — data descriptor WINS over instance dict
print(e.nd)   # instance_nd — instance dict WINS over non-data descriptor`,
    explanation: "Data descriptors (defining __set__ or __delete__) take priority over the instance __dict__; non-data descriptors are shadowed by instance dict entries — this is why classmethod/staticmethod are non-data descriptors.",
  },
  {
    id: "py-0519-b2-abstract-classmethod",
    language: "python",
    title: "abstractclassmethod and abstractstaticmethod",
    tag: "classes",
    code: `from abc import ABC, abstractmethod

class Registry(ABC):
    @classmethod
    @abstractmethod
    def from_config(cls, config: dict) -> "Registry":
        """Subclasses must implement a classmethod factory."""
        ...

    @staticmethod
    @abstractmethod
    def schema() -> dict:
        """Subclasses must implement a static schema."""
        ...

class MyRegistry(Registry):
    @classmethod
    def from_config(cls, config):
        return cls()

    @staticmethod
    def schema():
        return {"type": "object"}`,
    explanation: "There are no dedicated abstractclassmethod/abstractstaticmethod; stack @classmethod/@staticmethod on top of @abstractmethod (in that order) — the abstract enforcement still works.",
  },
  {
    id: "py-0519-b2-dunder-iter",
    language: "python",
    title: "__iter__ and __next__ for custom iterators",
    tag: "classes",
    code: `class Countdown:
    def __init__(self, start):
        self.current = start

    def __iter__(self):
        return self   # the object IS the iterator

    def __next__(self):
        if self.current < 0:
            raise StopIteration
        val = self.current
        self.current -= 1
        return val

for n in Countdown(5):
    print(n, end=" ")   # 5 4 3 2 1 0

# Can also be consumed manually
it = Countdown(3)
print(next(it), next(it))  # 3 2`,
    explanation: "__iter__ returns the iterator object (usually self for stateful iterators); __next__ returns the next value or raises StopIteration to signal exhaustion.",
  },
  {
    id: "py-0519-b2-dunder-contains",
    language: "python",
    title: "__contains__ for the 'in' operator",
    tag: "classes",
    code: `class Range:
    def __init__(self, start, stop):
        self.start = start
        self.stop  = stop

    def __contains__(self, value):
        return self.start <= value < self.stop

    def __iter__(self):
        return iter(range(self.start, self.stop))

r = Range(1, 100)
print(50 in r)    # True  — uses __contains__ (O(1))
print(200 in r)   # False

# Without __contains__, 'in' falls back to iterating __iter__
for x in r:
    pass   # works too, but O(n)`,
    explanation: "__contains__ defines the in operator; if absent Python falls back to iterating with __iter__ (O(n)); providing __contains__ enables O(1) membership tests for sorted or hashed structures.",
  },
  {
    id: "py-0519-b2-dunder-del",
    language: "python",
    title: "__del__ — finaliser, not destructor",
    tag: "classes",
    code: `class Resource:
    def __init__(self, name):
        self.name = name
        print(f"Acquired {name}")

    def __del__(self):
        # Called when reference count drops to zero
        # NOT guaranteed timing — do NOT rely on this for cleanup!
        print(f"Released {self.name}")

r = Resource("db")    # Acquired db
r2 = r                # second reference
del r                 # ref count still 1 — __del__ NOT called yet
del r2                # ref count 0 — Released db`,
    explanation: "__del__ is called when the last reference is dropped (in CPython with reference counting) but is not guaranteed to run at all in other implementations or when cycles prevent GC; use context managers for reliable cleanup.",
  },
  {
    id: "py-0519-b2-class-body-exec",
    language: "python",
    title: "Class body is executed like a function",
    tag: "classes",
    code: `# The class body runs as a function, building a namespace
print("before class")

class Meta:
    print("inside class body")
    x = 10
    items = [i * 2 for i in range(3)]

print("after class")
print(Meta.items)   # [0, 2, 4]

# You can do arbitrary computation in class bodies
class Computed:
    n = 5
    table = {i: i ** n for i in range(4)}
    del n   # clean up helper names`,
    explanation: "The class body is a block that Python executes immediately when the class statement is encountered; the resulting namespace becomes the class's __dict__, so any Python expression is valid inside.",
  },
  {
    id: "py-0519-b2-setattr-getattr",
    language: "python",
    title: "getattr / setattr / hasattr / delattr",
    tag: "classes",
    code: `class Config:
    debug = False
    version = "1.0"

cfg = Config()

# Dynamic attribute access
attr = "debug"
print(getattr(cfg, attr))           # False
print(getattr(cfg, "missing", 42))  # 42 (default)

setattr(cfg, "debug", True)
print(cfg.debug)    # True

print(hasattr(cfg, "version"))  # True
print(hasattr(cfg, "xyz"))      # False

delattr(cfg, "debug")  # removes the instance attribute`,
    explanation: "getattr/setattr/hasattr/delattr enable dynamic attribute access by name string; getattr's default argument prevents AttributeError when the attribute might be absent.",
  },
  {
    id: "py-0519-b2-string-interning-sys",
    language: "python",
    title: "sys.intern() to explicitly intern strings",
    tag: "types",
    code: `import sys

# Dynamically built strings are normally not interned
a = "hello" + "_world"
b = "hello" + "_world"
print(a is b)   # False (usually)

# Explicit interning: forces the same object
a = sys.intern("hello_world")
b = sys.intern("hello_world")
print(a is b)   # True

# Benefit: dict lookups using identity instead of hash+equality
# Useful for high-frequency string keys in performance-critical dicts`,
    explanation: "sys.intern forces a string to be stored in an interning table so future intern() calls with the same value return the identical object, enabling O(1) identity-based dict key comparisons.",
  },
  {
    id: "py-0519-b2-typing-final",
    language: "python",
    title: "typing.Final for constants",
    tag: "types",
    code: `from typing import Final

MAX_RETRIES: Final = 3
API_URL: Final[str] = "https://api.example.com"

# Type checkers flag mutation of Final variables
# MAX_RETRIES = 5  # error in mypy/pyright

class Config:
    # Class-level Final
    VERSION: Final = "1.0"
    # MAX: Final = ...  # OK if only set once`,
    explanation: "Final marks a variable or attribute as a constant; type checkers raise an error if any code attempts to reassign it, but it has no runtime enforcement.",
  },
  {
    id: "py-0519-b2-typing-annotated",
    language: "python",
    title: "typing.Annotated for metadata on types",
    tag: "types",
    code: `from typing import Annotated

# Attach arbitrary metadata to a type without changing runtime behaviour
Positive = Annotated[int, "must be > 0"]
Port     = Annotated[int, "range: 1-65535"]

def connect(host: str, port: Port) -> None:
    assert 1 <= port <= 65535, "invalid port"
    print(f"Connecting to {host}:{port}")

# Libraries like pydantic and FastAPI read the metadata
# to add validation, schema generation, etc.`,
    explanation: "Annotated[T, metadata] attaches arbitrary data to a type without changing its runtime behaviour; frameworks like Pydantic and FastAPI introspect the metadata for validation and documentation.",
  },
  {
    id: "py-0519-b2-int-floor-vs-truncate",
    language: "python",
    title: "int() truncates, math.floor() floors, math.trunc() truncates",
    tag: "types",
    code: `import math

x = -3.7

print(int(x))          # -3  (truncate toward zero)
print(math.trunc(x))   # -3  (same as int())
print(math.floor(x))   # -4  (round toward -inf)
print(math.ceil(x))    #  -3  (round toward +inf)

# For positive numbers, floor == truncate
y = 3.7
print(int(y))          # 3
print(math.floor(y))   # 3`,
    explanation: "int() and math.trunc both truncate toward zero; math.floor rounds toward negative infinity — they differ only for negative numbers, where floor gives a more negative result.",
  },
  {
    id: "py-0519-b2-generatorfunction-type",
    language: "python",
    title: "Generator functions return a generator object",
    tag: "types",
    code: `from types import GeneratorType

def my_gen():
    yield 1
    yield 2

# Calling a generator function returns a generator object
g = my_gen()
print(type(g))               # <class 'generator'>
print(isinstance(g, GeneratorType))  # True

# The function itself is not a generator
print(type(my_gen))          # <class 'function'>

# Sending values back
def echo():
    while True:
        received = yield
        print(f"Got: {received}")

e = echo()
next(e)          # prime
e.send("hello")  # Got: hello`,
    explanation: "A generator function (containing yield) is a regular function; calling it returns a generator object without executing any body code — the body runs lazily as you iterate or send values.",
  },
  {
    id: "py-0519-b2-namedtuple-typing",
    language: "python",
    title: "typing.NamedTuple for typed namedtuples",
    tag: "types",
    code: `from typing import NamedTuple

class Point(NamedTuple):
    x: float
    y: float
    z: float = 0.0   # default value

p = Point(1.0, 2.0)
print(p.x, p.y, p.z)   # 1.0 2.0 0.0

# Still a tuple
print(isinstance(p, tuple))   # True
x, y, z = p                   # unpack

# Type-annotated fields vs collections.namedtuple
from collections import namedtuple
P2 = namedtuple("P2", ["x", "y"])  # no type info`,
    explanation: "typing.NamedTuple uses class syntax for readable field definitions with type annotations and default values; the result is still a real tuple subclass compatible with tuple unpacking and indexing.",
  },
  {
    id: "py-0519-b2-int-bool-arithmetic",
    language: "python",
    title: "bool arithmetic: sum of booleans counts True values",
    tag: "types",
    code: `results = [True, False, True, True, False, True]

# Count True values — clean idiom
count_true = sum(results)
print(count_true)   # 4

# Count elements meeting a condition
data = [1, -2, 3, -4, 5, -6]
negatives = sum(x < 0 for x in data)
print(negatives)   # 3

# bool coerces to 0/1 in arithmetic
print(True + True + False)   # 2
print(True * 10)              # 10`,
    explanation: "Since bool is a subclass of int (True==1, False==0), sum() over a boolean sequence counts True values; sum(condition(x) for x in seq) is idiomatic for counting elements that satisfy a predicate.",
  },
  {
    id: "py-0519-b2-sequence-protocol",
    language: "python",
    title: "Sequence protocol: __len__ and __getitem__",
    tag: "classes",
    code: `class FibSequence:
    def __init__(self, n):
        self._n = n
        self._cache = {0: 0, 1: 1}

    def __len__(self):
        return self._n

    def __getitem__(self, index):
        if index < 0:
            index = self._n + index
        if index >= self._n:
            raise IndexError("index out of range")
        if index not in self._cache:
            self._cache[index] = self[index-1] + self[index-2]
        return self._cache[index]

fib = FibSequence(10)
print(list(fib))       # [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]
print(fib[-1])         # 34`,
    explanation: "Implementing __len__ and __getitem__ gives a class full sequence semantics including for loops, slicing (via __getitem__ with a slice object), reversed(), and list() without inheriting from anything.",
  },
  {
    id: "py-0519-b2-__missing__",
    language: "python",
    title: "__missing__ — custom missing key behaviour",
    tag: "classes",
    code: `class AutoList(dict):
    def __missing__(self, key):
        # Called when key is not found
        value = []
        self[key] = value   # cache the default
        return value

groups = AutoList()
groups["a"].append(1)
groups["a"].append(2)
groups["b"].append(3)

print(dict(groups))   # {'a': [1, 2], 'b': [3]}

# defaultdict uses the same mechanism internally
from collections import defaultdict
# defaultdict(list) is equivalent to AutoList above`,
    explanation: "__missing__(key) is called by dict.__getitem__ when a key is absent; returning (and optionally caching) a value is exactly what defaultdict does internally.",
  },
  {
    id: "py-0519-b2-dataclass-kw-only",
    language: "python",
    title: "dataclass kw_only for keyword-only fields (Python 3.10+)",
    tag: "classes",
    code: `from dataclasses import dataclass

@dataclass
class Config:
    host: str
    port: int
    timeout: float = 30.0
    # kw_only=True forces these to be keyword-only in __init__
    debug: bool = dataclasses.field(default=False, kw_only=True)
    log_level: str = dataclasses.field(default="INFO", kw_only=True)

import dataclasses

cfg = Config("localhost", 5432, debug=True)
# Config("localhost", 5432, False, "DEBUG")  # TypeError for debug/log_level`,
    explanation: "kw_only=True on a field (or @dataclass(kw_only=True) for all) prevents the field from being passed positionally, making config-style dataclasses more resistant to argument order mistakes.",
  },
  {
    id: "py-0519-b2-recursive-repr",
    language: "python",
    title: "Recursive __repr__ prevention with reprlib",
    tag: "classes",
    code: `import reprlib

class LargeList:
    def __init__(self, items):
        self.items = items

    def __repr__(self):
        # reprlib.repr truncates long sequences
        return f"LargeList({reprlib.repr(self.items)})"

big = LargeList(list(range(100)))
print(repr(big))
# LargeList([0, 1, 2, 3, 4, 5, ...])`,
    explanation: "reprlib.repr applies limits to nested collections so __repr__ doesn't produce megabytes of output for large objects; it's the safe choice for containers with unbounded contents.",
  },
  {
    id: "py-0519-b2-protocol-callable",
    language: "python",
    title: "Callable Protocol for typed callbacks",
    tag: "classes",
    code: `from typing import Protocol

class Transformer(Protocol):
    def __call__(self, value: int) -> str: ...

def apply(data: list[int], transform: Transformer) -> list[str]:
    return [transform(v) for v in data]

def to_hex(n: int) -> str:
    return hex(n)

result = apply([10, 255, 16], to_hex)
print(result)   # ['0xa', '0xff', '0x10']

# Any callable with the right signature satisfies Transformer
apply([1, 2, 3], str)  # str(int) -> str`,
    explanation: "Defining a Protocol with __call__ types callable arguments precisely — more expressive than Callable[[int], str] when the callback has keyword arguments or when you want a named protocol.",
  },
  {
    id: "py-0519-b2-dict-view-ordering",
    language: "python",
    title: "dict insertion-order guarantee (Python 3.7+)",
    tag: "structures",
    code: `# Since Python 3.7, dict preserves insertion order
d = {}
d["first"]  = 1
d["second"] = 2
d["third"]  = 3

print(list(d.keys()))   # ['first', 'second', 'third']

# Order is preserved on updates, not on re-insert
del d["first"]
d["first"] = 99         # goes at the end now
print(list(d.keys()))   # ['second', 'third', 'first']

# Move to end with OrderedDict
from collections import OrderedDict
od = OrderedDict(d)
od.move_to_end("second", last=False)   # move to front`,
    explanation: "Python dicts maintain insertion order as a language guarantee since 3.7; re-inserting a deleted key places it at the end; OrderedDict adds move_to_end() for explicit reordering.",
  },
  {
    id: "py-0519-b2-list-slicing",
    language: "python",
    title: "List slice assignment and deletion",
    tag: "structures",
    code: `data = [0, 1, 2, 3, 4, 5]

# Slice assignment replaces a section (can change length)
data[1:3] = [10, 20, 30]   # replace 2 items with 3
print(data)   # [0, 10, 20, 30, 3, 4, 5]

# Delete a slice
del data[1:4]
print(data)   # [0, 3, 4, 5]

# Insert without replacing (empty slice)
data[1:1] = [99, 98]
print(data)   # [0, 99, 98, 3, 4, 5]

# Replace entire list in place
data[:] = [1, 2, 3]
print(data)   # [1, 2, 3]`,
    explanation: "Slice assignment can insert, replace, and delete elements in one operation; assigning to [:] replaces all elements while keeping the same list object (important when other names reference it).",
  },
  {
    id: "py-0519-b2-weakref-callback",
    language: "python",
    title: "weakref with finalisation callback",
    tag: "structures",
    code: `import weakref, gc

class Expensive:
    def __init__(self, tag): self.tag = tag
    def __repr__(self): return f"Expensive({self.tag})"

def on_gc(ref):
    print(f"Object was collected: {ref}")

obj = Expensive("A")
ref = weakref.ref(obj, on_gc)   # callback fires when obj is GC'd

print(ref())   # Expensive(A)
del obj
gc.collect()   # Object was collected: <weakref object; dead>
print(ref())   # None`,
    explanation: "A weakref callback fires when the referent is garbage-collected, providing a hook for cache invalidation or resource tracking without preventing the object from being collected.",
  },
  {
    id: "py-0519-b2-ordereddict-equality",
    language: "python",
    title: "OrderedDict equality is order-sensitive",
    tag: "structures",
    code: `from collections import OrderedDict

od1 = OrderedDict([("a", 1), ("b", 2)])
od2 = OrderedDict([("b", 2), ("a", 1)])

# OrderedDict: order matters for ==
print(od1 == od2)   # False

# Regular dicts: order doesn't matter for ==
d1 = {"a": 1, "b": 2}
d2 = {"b": 2, "a": 1}
print(d1 == d2)    # True

# OrderedDict vs regular dict: compares by content only
print(od1 == d1)   # True  (cross-type ignores order)`,
    explanation: "Two OrderedDicts are equal only if they have the same items in the same order; comparing an OrderedDict to a regular dict falls back to content-only equality, ignoring order.",
  },
  {
    id: "py-0519-b2-typing-paramspec",
    language: "python",
    title: "ParamSpec for typing higher-order functions (Python 3.10+)",
    tag: "types",
    code: `from typing import ParamSpec, Callable, TypeVar
import functools

P = ParamSpec("P")
T = TypeVar("T")

def logged(func: Callable[P, T]) -> Callable[P, T]:
    @functools.wraps(func)
    def wrapper(*args: P.args, **kwargs: P.kwargs) -> T:
        print(f"Calling {func.__name__}")
        result = func(*args, **kwargs)
        print(f"Done {func.__name__}")
        return result
    return wrapper

@logged
def add(x: int, y: int) -> int:
    return x + y

add(1, 2)   # type checker knows add(x: int, y: int) -> int`,
    explanation: "ParamSpec captures the full parameter specification of a function so decorators preserve the original call signature — without it, type checkers collapse decorated functions to (*args, **kwargs).",
  },
];
