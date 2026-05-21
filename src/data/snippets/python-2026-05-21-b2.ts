import type { Snippet } from "./types";

export const pythonSnippets20260521B2: Snippet[] = [
  {
    id: "py-0521-b2-dict-comprehension-filter",
    language: "python",
    title: "dict comprehension with conditional filtering",
    tag: "snippet",
    code: `inventory = {
    "apple": 5,
    "banana": 0,
    "cherry": 12,
    "date": 0,
    "elderberry": 3,
}

# Keep only items with stock > 0
in_stock = {k: v for k, v in inventory.items() if v > 0}
print(in_stock)
# {'apple': 5, 'cherry': 12, 'elderberry': 3}

# Transform keys while filtering
upper_prices = {k.upper(): v * 1.1 for k, v in in_stock.items()}
print(upper_prices)
# {'APPLE': 5.5, 'CHERRY': 13.2, 'ELDERBERRY': 3.3}`,
    explanation: "Dict comprehensions support the same `if` filter as list comprehensions — combine with key/value transforms to build filtered, remapped mappings in one readable expression.",
  },
  {
    id: "py-0521-b2-class-property-setter",
    language: "python",
    title: "property with getter and setter validation",
    tag: "classes",
    code: `class Temperature:
    def __init__(self, celsius: float):
        self._celsius = celsius

    @property
    def celsius(self) -> float:
        return self._celsius

    @celsius.setter
    def celsius(self, value: float) -> None:
        if value < -273.15:
            raise ValueError(f"Temperature below absolute zero: {value}")
        self._celsius = value

    @property
    def fahrenheit(self) -> float:
        return self._celsius * 9 / 5 + 32

t = Temperature(100)
print(t.fahrenheit)   # 212.0
t.celsius = -300      # ValueError: Temperature below absolute zero`,
    explanation: "The `@property` + `@name.setter` pair wraps attribute access in methods without changing the calling syntax — callers use `t.celsius = value` instead of `t.set_celsius(value)`, keeping the API clean.",
  },
  {
    id: "py-0521-b2-fstring-debug",
    language: "python",
    title: "f-string = debug specifier",
    tag: "snippet",
    code: `x = 42
name = "Alice"
items = [1, 2, 3]

# = prints both the expression and its value
print(f"{x=}")          # x=42
print(f"{name=}")       # name='Alice'
print(f"{items=}")      # items=[1, 2, 3]
print(f"{len(items)=}") # len(items)=3

# Combine with format spec
pi = 3.14159265
print(f"{pi=:.3f}")     # pi=3.142

# Great for quick debugging without print statements
def add(a, b):
    result = a + b
    print(f"{a=}, {b=}, {result=}")   # a=1, b=2, result=3
    return result
add(1, 2)`,
    explanation: "The `=` specifier in f-strings (Python 3.8+) prints the expression source code followed by `=` and its `repr` value — a quick debugging tool that avoids writing `print(f'x = {x}')` manually.",
  },
  {
    id: "py-0521-b2-typing-paramspec",
    language: "python",
    title: "ParamSpec for typing decorator argument preservation",
    tag: "types",
    code: `from typing import Callable, ParamSpec, TypeVar
from functools import wraps

P = ParamSpec("P")
R = TypeVar("R")

def retry(times: int):
    def decorator(func: Callable[P, R]) -> Callable[P, R]:
        @wraps(func)
        def wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
            for attempt in range(times):
                try:
                    return func(*args, **kwargs)
                except Exception:
                    if attempt == times - 1:
                        raise
            raise RuntimeError("unreachable")
        return wrapper
    return decorator

@retry(3)
def fetch(url: str, timeout: int = 5) -> str:
    return f"data from {url}"

fetch("example.com", timeout=10)   # type-safe: IDE knows the signature`,
    explanation: "`ParamSpec` captures the parameter signature of a callable — when a decorator wraps a function, `P.args` and `P.kwargs` preserve the original argument types so callers and type checkers see the wrapped function's exact signature.",
  },
  {
    id: "py-0521-b2-string-template",
    language: "python",
    title: "string.Template for safe substitution",
    tag: "snippet",
    code: `from string import Template

# $var or \${var} syntax — safe for user-controlled templates
tmpl = Template("Hello, $name! You have $count new messages.")
result = tmpl.substitute(name="Alice", count=3)
print(result)   # Hello, Alice! You have 3 new messages.

# safe_substitute: leaves missing keys unchanged instead of raising
tmpl2 = Template("$greeting, $name!")
print(tmpl2.safe_substitute(name="Bob"))
# $greeting, Bob!  — $greeting is not replaced`,
    explanation: "`string.Template` uses `$name` syntax and is safer than `%` or `.format()` for user-provided templates because `safe_substitute` leaves unrecognized placeholders intact rather than raising an error.",
  },
  {
    id: "py-0521-b2-slots-comparison",
    language: "python",
    title: "comparing objects with __eq__ and __hash__",
    tag: "classes",
    code: `from dataclasses import dataclass

@dataclass
class Point:
    x: float
    y: float

# dataclass generates __eq__ comparing all fields
p1 = Point(1, 2)
p2 = Point(1, 2)
p3 = Point(3, 4)
print(p1 == p2)   # True
print(p1 == p3)   # False

# But default dataclass is NOT hashable (mutable)
try:
    s = {p1}
except TypeError as e:
    print(e)   # unhashable type: 'Point'

# Use frozen=True or eq=False or define __hash__ manually
@dataclass(frozen=True)
class FrozenPoint:
    x: float
    y: float

fp = FrozenPoint(1, 2)
print({fp})   # {FrozenPoint(x=1, y=2)}`,
    explanation: "By default, dataclasses set `__hash__` to `None` when `__eq__` is generated (to avoid hash/equality inconsistency with mutable objects) — use `frozen=True` or `unsafe_hash=True` to get a hash.",
  },
  {
    id: "py-0521-b2-exec-eval",
    language: "python",
    title: "eval() and exec() for dynamic code execution",
    tag: "caveats",
    code: `# eval: evaluates a single expression, returns value
result = eval("2 ** 10")
print(result)   # 1024

# exec: executes statements, returns None
exec("x = 10; y = 20; print(x + y)")   # 30

# Restrict namespace for safety (never pass user input without sandboxing)
safe_env = {"__builtins__": {}, "abs": abs}
result = eval("abs(-5)", safe_env)
print(result)   # 5

# DANGER: never run user-supplied strings in full namespace
# eval(user_input)  # arbitrary code execution!`,
    explanation: "`eval` executes expressions and returns their value; `exec` runs statements — both are dangerous with user input because they execute arbitrary Python; restrict the namespace using the globals/locals arguments.",
  },
  {
    id: "py-0521-b2-typing-concatenate",
    language: "python",
    title: "Concatenate to prepend parameters in callable types",
    tag: "types",
    code: `from typing import Callable, Concatenate, ParamSpec, TypeVar

P = ParamSpec("P")
R = TypeVar("R")

# Concatenate[int, P] means: first arg is int, rest match P
def with_timeout(func: Callable[Concatenate[int, P], R]
                 ) -> Callable[P, R]:
    def wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
        return func(30, *args, **kwargs)   # inject timeout=30
    return wrapper

def fetch(timeout: int, url: str, retries: int = 1) -> str:
    return f"fetched {url} in {timeout}s"

fast_fetch = with_timeout(fetch)
# fast_fetch now has signature (url: str, retries: int = 1) -> str
print(fast_fetch("example.com"))`,
    explanation: "`Concatenate[T, P]` prepends a concrete parameter type before the `ParamSpec` — useful when a decorator consumes the first parameter (like `self` in methods) and exposes the remaining parameters to callers.",
  },
  {
    id: "py-0521-b2-queue-lifo-fifo",
    language: "python",
    title: "queue.Queue (FIFO), LifoQueue (LIFO), PriorityQueue",
    tag: "structures",
    code: `from queue import Queue, LifoQueue, PriorityQueue

# Thread-safe FIFO queue
q = Queue()
q.put("a")
q.put("b")
q.put("c")
print(q.get())   # a  (first in, first out)

# Thread-safe LIFO (stack)
stack = LifoQueue()
stack.put(1)
stack.put(2)
stack.put(3)
print(stack.get())   # 3  (last in, first out)

# Thread-safe priority queue — lower number = higher priority
pq = PriorityQueue()
pq.put((3, "low priority"))
pq.put((1, "high priority"))
pq.put((2, "medium"))
print(pq.get())   # (1, 'high priority')`,
    explanation: "`queue.Queue` and its variants are thread-safe by design (unlike `collections.deque`) — use them for producer-consumer patterns across threads; `PriorityQueue` wraps `heapq` with locking.",
  },
  {
    id: "py-0521-b2-abstract-property",
    language: "python",
    title: "abstract property in ABC",
    tag: "classes",
    code: `from abc import ABC, abstractmethod

class Shape(ABC):
    @property
    @abstractmethod
    def area(self) -> float: ...

    @property
    @abstractmethod
    def name(self) -> str: ...

class Square(Shape):
    def __init__(self, side: float):
        self._side = side

    @property
    def area(self) -> float:
        return self._side ** 2

    @property
    def name(self) -> str:
        return "Square"

s = Square(4)
print(s.name, s.area)   # Square 16.0`,
    explanation: "Combining `@property` and `@abstractmethod` (in that order) forces subclasses to implement the property as a read-only attribute — the subclass must use `@property` in its implementation too.",
  },
  {
    id: "py-0521-b2-itertools-product",
    language: "python",
    title: "itertools.product for Cartesian product",
    tag: "snippet",
    code: `from itertools import product

# All combinations of two sequences
for x, y in product([1, 2], ["a", "b"]):
    print(x, y)
# 1 a / 1 b / 2 a / 2 b

# Nested loops become one product call
colors = ["red", "green"]
sizes  = ["S", "M", "L"]
styles = ["slim", "regular"]
all_variants = list(product(colors, sizes, styles))
print(len(all_variants))   # 12

# repeat= for self-Cartesian product
for pair in product(range(2), repeat=3):
    print(pair)   # 000, 001, 010, 011, 100, 101, 110, 111`,
    explanation: "`product(*iterables)` is equivalent to nested `for` loops — it generates all combinations lazily; `repeat=n` produces the n-way self-product without writing the sequence `n` times.",
  },
  {
    id: "py-0521-b2-exception-groups",
    language: "python",
    title: "ExceptionGroup and except* (Python 3.11+)",
    tag: "caveats",
    code: `# ExceptionGroup wraps multiple exceptions from concurrent tasks
import asyncio

async def may_fail(n: int):
    if n % 2 == 0:
        raise ValueError(f"bad {n}")
    if n == 3:
        raise TypeError(f"type error {n}")

async def main():
    async with asyncio.TaskGroup() as tg:
        for i in range(1, 5):
            tg.create_task(may_fail(i))

try:
    asyncio.run(main())
except* ValueError as eg:
    print("ValueErrors:", [str(e) for e in eg.exceptions])
except* TypeError as eg:
    print("TypeErrors:", [str(e) for e in eg.exceptions])`,
    explanation: "`ExceptionGroup` bundles multiple exceptions from concurrent tasks; `except*` (note the `*`) catches matching exception types while letting non-matching ones propagate — essential for `asyncio.TaskGroup` error handling.",
  },
  {
    id: "py-0521-b2-bytes-encoding",
    language: "python",
    title: "str.encode() and bytes.decode() for encoding conversions",
    tag: "types",
    code: `text = "Hello, 世界! 🌍"

# Encode str -> bytes
utf8  = text.encode("utf-8")
utf16 = text.encode("utf-16")
latin = "Cafe".encode("latin-1")   # no emoji support

print(len(utf8))    # 18  (multi-byte for non-ASCII)
print(len(utf16))   # 26  (2 or 4 bytes per char + BOM)

# Decode bytes -> str
back = utf8.decode("utf-8")
print(back == text)   # True

# Handle errors
bad_bytes = b"\\xff\\xfe"
print(bad_bytes.decode("utf-8", errors="replace"))  # ??
print(bad_bytes.decode("utf-8", errors="ignore"))   # (empty)`,
    explanation: "Python 3 strings are Unicode; `encode` converts to bytes using the specified codec and `decode` reverses it — always specify the encoding explicitly and handle `errors='replace'` or `'ignore'` for data from untrusted sources.",
  },
  {
    id: "py-0521-b2-attrgetter",
    language: "python",
    title: "operator.attrgetter for attribute extraction",
    tag: "snippet",
    code: `from operator import attrgetter, itemgetter
from dataclasses import dataclass

@dataclass
class Employee:
    name: str
    dept: str
    salary: float

employees = [
    Employee("Alice", "Eng", 90000),
    Employee("Bob",   "HR",  70000),
    Employee("Carol", "Eng", 95000),
]

# attrgetter is faster than lambda for attribute access
by_salary = sorted(employees, key=attrgetter("salary"), reverse=True)
print([e.name for e in by_salary])   # ['Carol', 'Alice', 'Bob']

# Multi-level sort: department then salary
by_dept_salary = sorted(employees, key=attrgetter("dept", "salary"))
print([e.name for e in by_dept_salary])   # ['Carol', 'Alice', 'Bob']`,
    explanation: "`attrgetter('attr')` returns a callable that extracts the named attribute — it's slightly faster than `lambda x: x.attr` because it's implemented in C; multi-attribute form `attrgetter('a', 'b')` returns a tuple.",
  },
  {
    id: "py-0521-b2-namedtuple-methods",
    language: "python",
    title: "NamedTuple built-in methods: _replace, _asdict, _fields",
    tag: "structures",
    code: `from collections import namedtuple

Point = namedtuple("Point", ["x", "y", "label"])

p = Point(1, 2, "origin")

# _replace: return a new tuple with some fields changed
p2 = p._replace(x=5, label="moved")
print(p2)   # Point(x=5, y=2, label='moved')

# _asdict: convert to OrderedDict
d = p._asdict()
print(dict(d))   # {'x': 1, 'y': 2, 'label': 'origin'}

# _fields: field names as a tuple
print(Point._fields)   # ('x', 'y', 'label')

# _make: create from any iterable
p3 = Point._make([3, 4, "new"])
print(p3)   # Point(x=3, y=4, label='new')`,
    explanation: "`_replace` is the immutable update pattern for named tuples (similar to `with` for dataclasses); `_asdict` and `_make` bridge to dicts and iterables; `_fields` enables generic serialization code.",
  },
  {
    id: "py-0521-b2-slice-object",
    language: "python",
    title: "slice objects for reusable slice notation",
    tag: "snippet",
    code: `data = list(range(20))

# Hardcoded slice is brittle — must repeat everywhere
# data[2:10:2]

# slice object is reusable and named
EVERY_OTHER = slice(None, None, 2)   # equivalent to [::2]
ODD_INDICES = slice(1, None, 2)      # [1::2]
HEADER      = slice(0, 3)            # first 3 items
LAST_THREE  = slice(-3, None)

print(data[EVERY_OTHER])    # [0, 2, 4, 6, 8, 10, 12, 14, 16, 18]
print(data[LAST_THREE])     # [17, 18, 19]

# slice.indices(length) normalizes clamped indices
print(HEADER.indices(len(data)))   # (0, 3, 1)`,
    explanation: "`slice(start, stop, step)` creates a reusable slice object — assign it to a named constant so the intent is clear and the same slice can be applied to multiple sequences without repeating the numbers.",
  },
  {
    id: "py-0521-b2-exception-hierarchy",
    language: "python",
    title: "Python exception hierarchy and BaseException",
    tag: "understanding",
    code: `# Exception hierarchy (simplified):
# BaseException
#   ├── SystemExit
#   ├── KeyboardInterrupt
#   ├── GeneratorExit
#   └── Exception
#         ├── ArithmeticError  (ZeroDivisionError, OverflowError)
#         ├── LookupError      (IndexError, KeyError)
#         ├── ValueError, TypeError, OSError, ...

# catch Exception but NOT KeyboardInterrupt / SystemExit
try:
    raise KeyboardInterrupt
except Exception:
    print("Exception: not caught!")
except BaseException:
    print("BaseException: caught!")   # this runs

# Best practice: catch specific exceptions
try:
    int("bad")
except (ValueError, TypeError) as e:
    print(e)`,
    explanation: "`except Exception` doesn't catch `SystemExit`, `KeyboardInterrupt`, or `GeneratorExit` — these inherit from `BaseException` directly and are meant to propagate; catching `Exception` is almost always the right level.",
  },
  {
    id: "py-0521-b2-with-suppress-multi",
    language: "python",
    title: "contextlib.nullcontext for conditional context managers",
    tag: "snippet",
    code: `from contextlib import nullcontext
import threading

def process(data, thread_safe: bool = True):
    # Conditionally wrap in a lock
    lock = threading.Lock() if thread_safe else nullcontext()

    with lock:
        # same code whether or not we lock
        return sum(data)

print(process([1, 2, 3], thread_safe=True))    # 6
print(process([1, 2, 3], thread_safe=False))   # 6`,
    explanation: "`nullcontext()` is a no-op context manager that satisfies the `with` protocol without doing anything — it lets you write code that optionally wraps a block in a real context manager without an `if/else` split.",
  },
  {
    id: "py-0521-b2-type-checking-runtime",
    language: "python",
    title: "get_type_hints for runtime annotation access",
    tag: "types",
    code: `from typing import get_type_hints
from dataclasses import dataclass

@dataclass
class Config:
    host: str
    port: int
    debug: bool = False

# get_type_hints resolves forward references and evaluates strings
hints = get_type_hints(Config)
print(hints)
# {'host': <class 'str'>, 'port': <class 'int'>, 'debug': <class 'bool'>}

# Use for runtime validation
def validate(obj, cls):
    for field, expected_type in get_type_hints(cls).items():
        value = getattr(obj, field)
        if not isinstance(value, expected_type):
            raise TypeError(f"{field} should be {expected_type}")`,
    explanation: "`get_type_hints` evaluates string annotations and forward references at runtime, resolving them in the correct module namespace — it's the building block for runtime type validation in libraries like Pydantic.",
  },
  {
    id: "py-0521-b2-generators-pipelines",
    language: "python",
    title: "generator pipeline for memory-efficient data processing",
    tag: "snippet",
    code: `import csv, io

data = """name,score,grade
Alice,92,A
Bob,75,C
Carol,88,B
Dave,60,D
"""

def parse_csv(text):
    reader = csv.DictReader(io.StringIO(text))
    yield from reader

def only_passing(rows):
    for row in rows:
        if int(row["score"]) >= 70:
            yield row

def format_row(rows):
    for row in rows:
        yield f"{row['name']}: {row['score']} ({row['grade']})"

pipeline = format_row(only_passing(parse_csv(data)))
for line in pipeline:
    print(line)
# Alice: 92 (A)
# Bob: 75 (C)
# Carol: 88 (B)`,
    explanation: "Chaining generators creates a lazy pipeline — each stage processes one record at a time without loading the whole dataset into memory; this scales to files larger than RAM.",
  },
  {
    id: "py-0521-b2-class-dunder-add",
    language: "python",
    title: "__add__ and __radd__ for operator overloading",
    tag: "classes",
    code: `class Vector:
    def __init__(self, *components):
        self.v = tuple(components)

    def __add__(self, other):
        if isinstance(other, Vector):
            return Vector(*(a + b for a, b in zip(self.v, other.v)))
        return NotImplemented   # not NotImplementedError!

    def __radd__(self, other):
        # Called when left operand doesn't know how to add
        return self.__add__(other)

    def __repr__(self):
        return f"Vector{self.v}"

v1 = Vector(1, 2, 3)
v2 = Vector(4, 5, 6)
print(v1 + v2)       # Vector(5, 7, 9)
print(sum([v1, v2])) # Vector(5, 7, 9) — sum uses __radd__`,
    explanation: "Return `NotImplemented` (not raise it) from `__add__` when the types are incompatible — Python then tries the right operand's `__radd__`; `sum` starts with `0`, so `__radd__` must handle non-Vector left operands.",
  },
  {
    id: "py-0521-b2-format-number-binary",
    language: "python",
    title: "integer literals and base conversion",
    tag: "types",
    code: `# Python integer literals
dec = 255
hex_val = 0xFF        # same value
oct_val = 0o377       # same
bin_val = 0b11111111  # same

print(dec == hex_val == oct_val == bin_val)   # True

# Convert between bases
print(bin(255))    # 0b11111111
print(oct(255))    # 0o377
print(hex(255))    # 0xff

# Parse from string in any base
print(int("FF", 16))    # 255
print(int("11111111", 2))  # 255
print(int("377", 8))    # 255

# Digit separators (Python 3.6+)
billion = 1_000_000_000
mask    = 0xFF_FF_FF_FF`,
    explanation: "Python accepts `0x`, `0o`, and `0b` prefixes in integer literals; `bin`/`oct`/`hex` convert to string; `int(s, base)` parses any base string; `_` in literals is a visual separator with no effect on value.",
  },
  {
    id: "py-0521-b2-pathlib-glob-rglob",
    language: "python",
    title: "pathlib glob and rglob for file discovery",
    tag: "snippet",
    code: `from pathlib import Path

root = Path("/home/user/learner/src")

# Non-recursive glob (only current dir)
py_files = list(root.glob("*.py"))

# Recursive glob — ** matches any number of dirs
all_ts = list(root.rglob("*.ts"))
print(f"Found {len(all_ts)} .ts files")

# Multiple patterns via generator expression
import itertools
all_code = list(itertools.chain(
    root.rglob("*.py"),
    root.rglob("*.ts"),
))

# Exclude files starting with '.'
visible = [f for f in root.rglob("*") if not f.name.startswith(".")]`,
    explanation: "`Path.glob(pattern)` matches in the current directory; `rglob(pattern)` prepends `**/` to match recursively — both return `Path` objects directly and support `?` (one char) and `*` (any chars in name).",
  },
  {
    id: "py-0521-b2-descriptor-class",
    language: "python",
    title: "data descriptor vs non-data descriptor",
    tag: "classes",
    code: `class DataDescriptor:
    """Has both __get__ and __set__ — overrides instance __dict__."""
    def __get__(self, obj, owner):
        if obj is None: return self
        return obj.__dict__.get("_val", 0)
    def __set__(self, obj, value):
        obj.__dict__["_val"] = value

class NonDataDescriptor:
    """Only __get__ — instance __dict__ takes priority."""
    def __get__(self, obj, owner):
        if obj is None: return self
        return "from descriptor"

class Foo:
    data    = DataDescriptor()
    nondata = NonDataDescriptor()

f = Foo()
f.__dict__["nondata"] = "from instance"
print(f.nondata)   # from instance  (instance dict wins)
print(f.data)      # 0  (data descriptor wins)`,
    explanation: "Data descriptors (define `__set__`/`__delete__`) take priority over the instance `__dict__`; non-data descriptors (only `__get__`) are shadowed by instance attributes — `property` is a data descriptor, functions are not.",
  },
  {
    id: "py-0521-b2-complex-sorting",
    language: "python",
    title: "sort stability: timsort and stable multi-key sorting",
    tag: "understanding",
    code: `# Python's sort is stable: equal elements retain original order
data = [("Alice", "B"), ("Bob", "A"), ("Carol", "B"), ("Dave", "A")]

# Sort by grade first; equal grades preserve original (name) order
by_grade = sorted(data, key=lambda x: x[1])
print(by_grade)
# [('Bob', 'A'), ('Dave', 'A'), ('Alice', 'B'), ('Carol', 'B')]

# Decorate-sort-undecorate (DSU) pattern for complex keys
# Instead of a comparator, build a key tuple:
records = [{"name": "c", "age": 30}, {"name": "a", "age": 30}, {"name": "b", "age": 25}]
result = sorted(records, key=lambda r: (r["age"], r["name"]))
print([r["name"] for r in result])   # ['b', 'a', 'c']`,
    explanation: "Python's Timsort is stable — equal-key elements stay in their original relative order; this property enables multi-key sorting by applying sorts from least to most significant key, or by using tuple keys directly.",
  },
  {
    id: "py-0521-b2-abc-register",
    language: "python",
    title: "ABC.register for virtual subclasses",
    tag: "classes",
    code: `from abc import ABC, abstractmethod

class Drawable(ABC):
    @abstractmethod
    def draw(self) -> None: ...

# Register an existing class without modifying it
class LegacyCircle:   # from third-party lib — can't modify
    def draw(self) -> None:
        print("legacy circle")

Drawable.register(LegacyCircle)

lc = LegacyCircle()
print(isinstance(lc, Drawable))    # True
print(issubclass(LegacyCircle, Drawable))  # True

# But abstract method enforcement doesn't apply to registered classes
class Missing:
    pass
Drawable.register(Missing)
m = Missing()   # no error — Missing() doesn't have draw()`,
    explanation: "`ABC.register` makes an existing class a virtual subclass — `isinstance`/`issubclass` return `True` but the ABC's abstract method contracts are NOT enforced; use it to integrate third-party classes into your type hierarchy.",
  },
  {
    id: "py-0521-b2-concurrent-futures",
    language: "python",
    title: "concurrent.futures for parallel execution",
    tag: "snippet",
    code: `from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor
import time

def task(n: int) -> int:
    time.sleep(0.1)
    return n * n

# I/O-bound: ThreadPoolExecutor
with ThreadPoolExecutor(max_workers=4) as executor:
    futures = [executor.submit(task, i) for i in range(8)]
    results = [f.result() for f in futures]
print(results)   # [0, 1, 4, 9, 16, 25, 36, 49]

# map() variant — simpler API
with ThreadPoolExecutor(max_workers=4) as executor:
    results = list(executor.map(task, range(8)))`,
    explanation: "`ThreadPoolExecutor` is best for I/O-bound tasks (network, disk); `ProcessPoolExecutor` bypasses the GIL for CPU-bound work by spawning separate processes; both support `submit()` for futures or `map()` for simple iteration.",
  },
  {
    id: "py-0521-b2-pydantic-like-validation",
    language: "python",
    title: "__init_subclass__ for field validation at definition time",
    tag: "classes",
    code: `class Validated:
    _validators: dict = {}

    def __init_subclass__(cls, **kwargs):
        super().__init_subclass__(**kwargs)
        cls._validators = {}
        for name, annotation in cls.__annotations__.items():
            cls._validators[name] = annotation

    def __post_init__(self):
        for field, type_ in self._validators.items():
            val = getattr(self, field, None)
            if val is not None and not isinstance(val, type_):
                raise TypeError(f"{field} must be {type_.__name__}")

from dataclasses import dataclass

@dataclass
class Config(Validated):
    host: str
    port: int
    debug: bool = False

    def __post_init__(self):
        super().__post_init__()`,
    explanation: "`__init_subclass__` fires when a class inheriting from yours is defined — it can inspect `__annotations__` to build per-class validator tables, letting the base class implement common validation logic automatically.",
  },
  {
    id: "py-0521-b2-int-bit-methods",
    language: "python",
    title: "int.bit_length, bit_count, to_bytes, from_bytes",
    tag: "types",
    code: `n = 255

print(n.bit_length())   # 8  (minimum bits needed)
print(n.bit_count())    # 8  (number of set bits, Python 3.10+)

# to_bytes: encode as bytes
b = n.to_bytes(2, byteorder="big")
print(b)                # b'\\x00\\xff'
print(list(b))          # [0, 255]

# from_bytes: decode from bytes
recovered = int.from_bytes(b"\\x00\\xff", byteorder="big")
print(recovered)        # 255

# Useful for binary protocol encoding
checksum = (0x1234).to_bytes(2, "little")
print(checksum.hex())   # 3412`,
    explanation: "`bit_length()` returns the minimum number of bits to represent the value; `to_bytes`/`from_bytes` handle binary serialization with explicit byte order — critical for network protocols and file formats.",
  },
  {
    id: "py-0521-b2-unpacking-function-args",
    language: "python",
    title: "* and ** unpacking in function calls",
    tag: "snippet",
    code: `def draw(x, y, color="black", size=10):
    print(f"draw at ({x},{y}) color={color} size={size}")

coords  = (5, 10)
options = {"color": "red", "size": 20}

# Unpack tuple as positional args, dict as keyword args
draw(*coords, **options)    # draw at (5,10) color=red size=20

# Merge dicts
defaults = {"a": 1, "b": 2}
overrides = {"b": 99, "c": 3}
merged = {**defaults, **overrides}
print(merged)   # {'a': 1, 'b': 99, 'c': 3}

# Combine multiple lists
a, b = [1, 2], [3, 4]
combined = [*a, *b]
print(combined)   # [1, 2, 3, 4]`,
    explanation: "`*iterable` unpacks positional arguments and `**mapping` unpacks keyword arguments at call sites — this pattern feeds precomputed configuration directly to functions and merges dicts concisely.",
  },
  {
    id: "py-0521-b2-contextmanager-async",
    language: "python",
    title: "@asynccontextmanager for async context managers",
    tag: "classes",
    code: `from contextlib import asynccontextmanager
import asyncio

@asynccontextmanager
async def connect(host: str, port: int):
    print(f"connecting to {host}:{port}")
    conn = {"host": host, "port": port, "open": True}
    try:
        yield conn
    finally:
        conn["open"] = False
        print(f"disconnected from {host}")

async def main():
    async with connect("db.local", 5432) as conn:
        print(f"using {conn}")   # {'host': 'db.local', ...}
    print("connection closed")

asyncio.run(main())`,
    explanation: "`@asynccontextmanager` works like `@contextmanager` but for `async with` — `yield` separates setup from teardown; `finally` ensures cleanup even when an exception occurs inside the `async with` block.",
  },
  {
    id: "py-0521-b2-class-creation-lifecycle",
    language: "python",
    title: "class creation: __new__ vs __init__",
    tag: "classes",
    code: `class Singleton:
    _instance = None

    def __new__(cls, *args, **kwargs):
        # __new__ creates the object (before __init__)
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self, value: int):
        # __init__ is called EVERY time, even if __new__ returned existing obj
        self.value = value

a = Singleton(1)
b = Singleton(2)
print(a is b)      # True  — same object
print(a.value)     # 2  — __init__ ran again and mutated it`,
    explanation: "`__new__` controls object creation and can return an existing instance (singleton pattern); `__init__` initializes the object but is called every time, even when `__new__` returns an existing instance — a common gotcha.",
  },
  {
    id: "py-0521-b2-lru-cache-maxsize",
    language: "python",
    title: "lru_cache with maxsize for bounded memoization",
    tag: "snippet",
    code: `from functools import lru_cache

@lru_cache(maxsize=128)
def expensive(n: int) -> int:
    print(f"computing {n}")
    return n * n

print(expensive(4))   # computing 4 / 16
print(expensive(4))   # 16  (cached, no print)
print(expensive(5))   # computing 5 / 25

print(expensive.cache_info())
# CacheInfo(hits=1, misses=2, maxsize=128, currsize=2)

expensive.cache_clear()   # clear the cache
print(expensive(4))       # computing 4 / 16  (re-computed)`,
    explanation: "`@lru_cache(maxsize=N)` evicts the least recently used entry when the cache is full — use a power-of-two for maxsize (better hash performance); `cache_info()` and `cache_clear()` are useful for testing and monitoring.",
  },
  {
    id: "py-0521-b2-dict-views",
    language: "python",
    title: "dict views: keys(), values(), items() are live",
    tag: "understanding",
    code: `d = {"a": 1, "b": 2, "c": 3}

keys   = d.keys()    # dict_keys — live view, not a copy
values = d.values()
items  = d.items()

print(len(keys))   # 3

d["d"] = 4
print(len(keys))   # 4  — view reflects mutation!
print(list(keys))  # ['a', 'b', 'c', 'd']

# keys() supports set operations
other = {"b", "c", "e"}
print(d.keys() & other)   # {'b', 'c'}  (intersection)
print(d.keys() | other)   # {'a', 'b', 'c', 'd', 'e'}  (union)`,
    explanation: "Dict views are dynamic — they reflect additions and deletions to the dict in real time; `keys()` additionally supports set operations (`&`, `|`, `-`, `^`) because dict keys are guaranteed to be unique.",
  },
  {
    id: "py-0521-b2-type-narrowing-isinstance",
    language: "python",
    title: "type narrowing flow analysis",
    tag: "types",
    code: `def process(value: int | str | list[int]) -> str:
    if isinstance(value, int):
        # narrowed to int here
        return f"int: {value * 2}"
    elif isinstance(value, str):
        # narrowed to str here
        return f"str: {value.upper()}"
    else:
        # narrowed to list[int] here
        return f"list: {sum(value)}"

print(process(5))           # int: 10
print(process("hello"))     # str: HELLO
print(process([1, 2, 3]))   # list: 6`,
    explanation: "Type checkers perform flow analysis inside `if isinstance(x, T)` branches — after the check, `x` is narrowed to `T` within that branch, enabling attribute access and method calls without casts.",
  },
  {
    id: "py-0521-b2-functools-total-ordering",
    language: "python",
    title: "total_ordering with dataclass",
    tag: "classes",
    code: `from dataclasses import dataclass
from functools import total_ordering

@total_ordering
@dataclass
class SemanticVersion:
    major: int
    minor: int
    patch: int

    def __eq__(self, other):
        if not isinstance(other, SemanticVersion): return NotImplemented
        return (self.major, self.minor, self.patch) == (other.major, other.minor, other.patch)

    def __lt__(self, other):
        if not isinstance(other, SemanticVersion): return NotImplemented
        return (self.major, self.minor, self.patch) < (other.major, other.minor, other.patch)

versions = [SemanticVersion(2,0,0), SemanticVersion(1,9,1), SemanticVersion(1,10,0)]
print(sorted(versions))
# [SemanticVersion(1,9,1), SemanticVersion(1,10,0), SemanticVersion(2,0,0)]`,
    explanation: "Combining `@dataclass` with `@total_ordering` (in that order — decorators apply bottom-up) gives a class value equality from dataclass and all six comparison operators from just `__eq__` and `__lt__`.",
  },
  {
    id: "py-0521-b2-io-stringio",
    language: "python",
    title: "io.StringIO and io.BytesIO as in-memory files",
    tag: "snippet",
    code: `import io, csv

# StringIO: in-memory text file
output = io.StringIO()
writer = csv.writer(output)
writer.writerow(["name", "age"])
writer.writerow(["Alice", 30])

csv_text = output.getvalue()
print(repr(csv_text))   # 'name,age\\r\\nAlice,30\\r\\n'

# Parse it back
reader = csv.reader(io.StringIO(csv_text))
for row in reader:
    print(row)   # ['name', 'age'] / ['Alice', '30']

# BytesIO: in-memory binary file
buf = io.BytesIO()
buf.write(b"\\x89PNG\\r\\n")
buf.seek(0)
print(buf.read(4))   # b'\\x89PNG'`,
    explanation: "`StringIO`/`BytesIO` implement the full file-like interface in memory — useful for unit testing functions that accept file objects, or for building output before writing to disk in one batch.",
  },
  {
    id: "py-0521-b2-dataclass-kw-only",
    language: "python",
    title: "dataclass kw_only and KW_ONLY sentinel (Python 3.10+)",
    tag: "classes",
    code: `from dataclasses import dataclass, KW_ONLY, field

@dataclass
class Connection:
    host: str
    _: KW_ONLY   # everything after this must be keyword-only
    port: int = 5432
    timeout: float = 30.0
    ssl: bool = False

# Positional args only for host; rest must be keyword args
conn = Connection("db.local", port=5433, timeout=10.0)
print(conn)
# Connection(host='db.local', port=5433, timeout=10.0, ssl=False)

# This would fail:
# Connection("db.local", 5433)  # TypeError: too many positional arguments`,
    explanation: "`KW_ONLY` sentinel (Python 3.10+) marks all subsequent fields as keyword-only — it prevents callers from passing them positionally, catching accidental transpositions of optional parameters at call sites.",
  },
  {
    id: "py-0521-b2-context-nested-exception",
    language: "python",
    title: "exception context: __cause__ vs __context__",
    tag: "understanding",
    code: `# Implicit chaining: __context__ is set automatically
def implicit():
    try:
        raise ValueError("original")
    except ValueError:
        raise RuntimeError("during handling")   # __context__ = ValueError

# Explicit chaining: __cause__ is set by 'raise X from Y'
def explicit():
    try:
        raise ValueError("original")
    except ValueError as e:
        raise RuntimeError("wrapped") from e    # __cause__ = ValueError

# Suppress chaining: raise X from None
def suppress():
    try:
        raise ValueError("internal")
    except ValueError:
        raise RuntimeError("public error") from None   # hides internal

try: suppress()
except RuntimeError as e:
    print(e.__cause__)    # None
    print(e.__context__)  # ValueError('internal') — still set`,
    explanation: "`__context__` is set automatically when an exception is raised during handling of another; `__cause__` is set by `raise X from Y`; `raise X from None` sets `__cause__` to `None` and suppresses the chained traceback.",
  },
  {
    id: "py-0521-b2-type-alias-generic",
    language: "python",
    title: "Generic type aliases with TypeVar",
    tag: "types",
    code: `from typing import TypeVar, Generic

T = TypeVar("T")
K = TypeVar("K")
V = TypeVar("V")

# Generic class
class Stack(Generic[T]):
    def __init__(self) -> None:
        self._items: list[T] = []

    def push(self, item: T) -> None:
        self._items.append(item)

    def pop(self) -> T:
        return self._items.pop()

    def peek(self) -> T:
        return self._items[-1]

stack: Stack[int] = Stack()
stack.push(1)
stack.push(2)
print(stack.pop())   # 2
print(stack.peek())  # 1`,
    explanation: "`Generic[T]` lets a class be parameterized by a type — `Stack[int]` tells type checkers that `pop()` returns `int`; a single `TypeVar` can be reused across multiple generic classes.",
  },
  {
    id: "py-0521-b2-pep695-generic-function",
    language: "python",
    title: "generic functions with type parameter syntax (Python 3.12+)",
    tag: "types",
    code: `# Old style: TypeVar required
from typing import TypeVar
T_old = TypeVar("T_old")
def first_old(seq: list[T_old]) -> T_old:
    return seq[0]

# New style (Python 3.12): inline type parameter
def first[T](seq: list[T]) -> T:
    return seq[0]

def zip_map[A, B, C](f: "Callable[[A, B], C]",
                     a: list[A], b: list[B]) -> list[C]:
    return [f(x, y) for x, y in zip(a, b)]

print(first([1, 2, 3]))        # 1
print(first(["a", "b", "c"]))  # a`,
    explanation: "Python 3.12 introduces `def func[T](...):` syntax — type parameters are declared inline without importing `TypeVar`, making generic functions more readable and concise.",
  },
  {
    id: "py-0521-b2-pprint-depth",
    language: "python",
    title: "pprint depth and compact options",
    tag: "snippet",
    code: `from pprint import pprint

deep = {"a": {"b": {"c": {"d": {"e": 5}}}}}

# depth=2: truncate after 2 levels
pprint(deep, depth=2)
# {'a': {'b': {...}}}

# compact: pack short items on one line
data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]
pprint(data, width=30, compact=True)
# [1, 2, 3, 4, 5, 6, 7, 8, 9,
#  10, 11, 12, 13]

# sort_dicts=False preserves insertion order (Python 3.8+)
d = {"z": 1, "a": 2, "m": 3}
pprint(d, sort_dicts=False)
# {'z': 1, 'a': 2, 'm': 3}`,
    explanation: "`pprint` with `depth=N` replaces deeper nesting with `{...}` or `[...]` — useful for exploring large API responses without drowning in detail; `sort_dicts=False` respects insertion order in Python 3.7+ dicts.",
  },
  {
    id: "py-0521-b2-class-bool-len",
    language: "python",
    title: "__bool__ and __len__ for truthiness control",
    tag: "classes",
    code: `class Collection:
    def __init__(self, items):
        self._items = items

    def __len__(self):
        return len(self._items)

    # Without __bool__, Python uses __len__ for truthiness:
    # bool(col) == (len(col) != 0)

class AlwaysTrue:
    def __bool__(self):
        return True

    def __len__(self):
        return 0   # would be falsy, but __bool__ takes priority

col_empty = Collection([])
col_full  = Collection([1, 2, 3])

print(bool(col_empty))   # False (len is 0)
print(bool(col_full))    # True  (len is 3)
print(bool(AlwaysTrue()))  # True (bool overrides len)`,
    explanation: "Python's truth test calls `__bool__` first, then `__len__` — if neither is defined, the object is always truthy; `__bool__` has higher priority than `__len__` when both are present.",
  },
  {
    id: "py-0521-b2-string-format-nested",
    language: "python",
    title: "nested f-string format expressions",
    tag: "snippet",
    code: `width = 10
value = 3.14159

# The format spec itself can be an f-string expression
print(f"{value:{width}.3f}")   # '     3.142'  (width is variable)

# Dynamic alignment
align_char = "^"
print(f"{'title':{align_char}{width}}")   # '  title   '

# Nested f-strings (Python 3.12+): cleaner syntax
data = [1, 2, 3]
print(f"{'[' + ', '.join(str(x) for x in data) + ']'}")
# [1, 2, 3]

# Practical: column width from a variable
headers = ["Name", "Score"]
widths  = [10, 6]
for h, w in zip(headers, widths):
    print(f"{h:<{w}}", end="")`,
    explanation: "F-string format specs can themselves contain f-string expressions — `{value:{width}.{precision}f}` lets you compute the formatting parameters dynamically from variables, enabling flexible table formatting.",
  },
  {
    id: "py-0521-b2-inspect-module",
    language: "python",
    title: "inspect module for runtime introspection",
    tag: "snippet",
    code: `import inspect

def greet(name: str, greeting: str = "Hello") -> str:
    """Greet someone."""
    return f"{greeting}, {name}!"

# Get the source
print(inspect.getsource(greet))

# Signature inspection
sig = inspect.signature(greet)
for name, param in sig.parameters.items():
    print(f"{name}: default={param.default}, annotation={param.annotation}")

# Check if object is a class/function/method
print(inspect.isfunction(greet))   # True
print(inspect.isclass(str))        # True

# Get all members of a class
members = inspect.getmembers(str, predicate=inspect.isbuiltin)
print([name for name, _ in members[:5]])`,
    explanation: "`inspect` provides runtime access to object signatures, source code, class hierarchies, and module contents — it powers IDEs, debuggers, and testing frameworks that need to reason about code structure at runtime.",
  },
  {
    id: "py-0521-b2-slots-protocol",
    language: "python",
    title: "Protocol with runtime_checkable",
    tag: "types",
    code: `from typing import Protocol, runtime_checkable

@runtime_checkable
class Sized(Protocol):
    def __len__(self) -> int: ...

@runtime_checkable
class Container(Protocol):
    def __contains__(self, item: object) -> bool: ...

# Any object with __len__ satisfies Sized
print(isinstance([1, 2, 3], Sized))   # True
print(isinstance("hello", Sized))     # True
print(isinstance(42, Sized))          # False

# Structural check: don't need to inherit Sized
class MyList:
    def __len__(self): return 5

print(isinstance(MyList(), Sized))    # True`,
    explanation: "`@runtime_checkable` enables `isinstance` checks against Protocols at runtime — it checks only the presence of the required methods, not their signatures; used without this decorator, Protocol is a static-type-only construct.",
  },
  {
    id: "py-0521-b2-cProfile-timing",
    language: "python",
    title: "cProfile for function-level profiling",
    tag: "snippet",
    code: `import cProfile, pstats, io

def slow_function():
    return sum(i * i for i in range(100_000))

# Profile a callable
profiler = cProfile.Profile()
profiler.enable()
slow_function()
profiler.disable()

# Print top 10 by cumulative time
stream = io.StringIO()
ps = pstats.Stats(profiler, stream=stream)
ps.sort_stats("cumulative").print_stats(10)
print(stream.getvalue()[:500])

# Quick one-liner
cProfile.run("slow_function()", sort="cumulative")`,
    explanation: "`cProfile` is a deterministic profiler that measures call counts and time spent in each function — use `pstats.Stats` to sort by `cumulative` (total time including callees) or `tottime` (exclusive time in the function itself).",
  },
  {
    id: "py-0521-b2-ordered-dict",
    language: "python",
    title: "OrderedDict vs dict: when order matters",
    tag: "structures",
    code: `from collections import OrderedDict

# Since Python 3.7, regular dict preserves insertion order
d = {}
d["a"] = 1; d["b"] = 2; d["c"] = 3
print(list(d.keys()))   # ['a', 'b', 'c']

# OrderedDict has move_to_end for reordering
od = OrderedDict([("a", 1), ("b", 2), ("c", 3)])
od.move_to_end("a")           # move 'a' to end
print(list(od.keys()))        # ['b', 'c', 'a']
od.move_to_end("a", last=False)  # move to front
print(list(od.keys()))        # ['a', 'b', 'c']

# OrderedDict equality considers order; dict does not
od1 = OrderedDict([("a", 1), ("b", 2)])
od2 = OrderedDict([("b", 2), ("a", 1)])
print(od1 == od2)   # False
print(dict(od1) == dict(od2))   # True`,
    explanation: "`OrderedDict` predates Python 3.7's ordered dicts, but it still provides unique features: `move_to_end` for LRU-style promotion, and order-aware equality — plain `dict` equality ignores insertion order.",
  },
  {
    id: "py-0521-b2-with-walrus-file",
    language: "python",
    title: "walrus operator for file chunked reading",
    tag: "snippet",
    code: `import io

data = io.BytesIO(b"a" * 4096 + b"b" * 4096 + b"c" * 100)

chunks = []
# Without walrus: read + while check duplication
chunk = data.read(4096)
while chunk:
    chunks.append(len(chunk))
    chunk = data.read(4096)

# With walrus: single expression
data.seek(0)
chunks2 = []
while chunk := data.read(4096):
    chunks2.append(len(chunk))

print(chunks)    # [4096, 4096, 100]
print(chunks2)   # [4096, 4096, 100]`,
    explanation: "Chunked file reading is a classic walrus use case — `while chunk := file.read(N)` reads and tests in one expression; when `read()` returns an empty bytes object (falsy), the loop exits cleanly.",
  },
  {
    id: "py-0521-b2-class-mixin",
    language: "python",
    title: "mixin classes for reusable behavior",
    tag: "classes",
    code: `class JSONMixin:
    def to_json(self) -> str:
        import json
        return json.dumps(
            {k: v for k, v in self.__dict__.items() if not k.startswith("_")}
        )

class LogMixin:
    def log(self, msg: str) -> None:
        print(f"[{type(self).__name__}] {msg}")

class User(JSONMixin, LogMixin):
    def __init__(self, name: str, email: str):
        self.name = name
        self.email = email

u = User("Alice", "alice@example.com")
print(u.to_json())       # {"name": "Alice", "email": "alice@example.com"}
u.log("signed in")       # [User] signed in`,
    explanation: "Mixins are small classes that provide a specific behavior via multiple inheritance without being meant to stand alone — the MRO ensures each mixin's methods are available without conflicts as long as they don't define the same method.",
  },
  {
    id: "py-0521-b2-typing-overload-none",
    language: "python",
    title: "Optional return type with conditional None",
    tag: "types",
    code: `from typing import Optional, overload

# Without overload: return type is int | None
def find(items: list[int], target: int) -> Optional[int]:
    try:
        return items.index(target)
    except ValueError:
        return None

# With overload: differentiate based on a sentinel default
@overload
def find2(items: list[int], target: int) -> Optional[int]: ...
@overload
def find2(items: list[int], target: int, default: int) -> int: ...

def find2(items, target, default=None):
    try:
        return items.index(target)
    except ValueError:
        return default

result: int = find2([1, 2, 3], 9, -1)   # type checker: definitely int
print(result)   # -1`,
    explanation: "The `@overload` pattern with a sentinel `default` parameter lets the type checker narrow the return type — when `default` is provided, the return can't be `None`, enabling callers to avoid needless null checks.",
  },
  {
    id: "py-0521-b2-match-mapping-pattern",
    language: "python",
    title: "match: mapping (dict) pattern",
    tag: "snippet",
    code: `def handle_event(event: dict) -> str:
    match event:
        case {"type": "click", "button": btn}:
            return f"clicked {btn}"
        case {"type": "keydown", "key": key, "modifiers": mods}:
            return f"key {key} with {mods}"
        case {"type": "scroll", **rest}:
            return f"scroll event {rest}"
        case {"type": t}:
            return f"unknown event type: {t}"
        case _:
            return "not an event"

print(handle_event({"type": "click", "button": "left"}))
# clicked left
print(handle_event({"type": "scroll", "delta": 3, "x": 0}))
# scroll event {'delta': 3, 'x': 0}`,
    explanation: "Mapping patterns check that a dict contains at least the specified keys (extra keys are fine); `**rest` captures remaining key-value pairs; patterns match regardless of dict ordering.",
  },
  {
    id: "py-0521-b2-bytes-format",
    language: "python",
    title: "bytes hex display and manipulation methods",
    tag: "types",
    code: `data = b"\\x48\\x65\\x6c\\x6c\\x6f"

# Decode to string
print(data.decode())          # Hello

# Hex representations
print(data.hex())             # 48656c6c6f
print(data.hex(":"))          # 48:65:6c:6c:6f  (separator)
print(bytes.fromhex("48656c6c6f"))  # b'Hello'

# bytes methods parallel str
print(data.upper())           # b'HELLO'
print(data.count(b"l"))       # 2
print(data.split(b"l"))       # [b'He', b'', b'o']
print(data.replace(b"l", b"r"))  # b'Herro'`,
    explanation: "`bytes.hex(sep)` formats as a hex string with an optional separator — the `sep` parameter was added in Python 3.8; most string methods have bytes equivalents operating on byte values rather than Unicode code points.",
  },
  {
    id: "py-0521-b2-dunder-getitem",
    language: "python",
    title: "__getitem__, __setitem__, __delitem__ for subscript access",
    tag: "classes",
    code: `class SparseMatrix:
    def __init__(self):
        self._data: dict[tuple[int,int], float] = {}

    def __getitem__(self, key: tuple[int, int]) -> float:
        return self._data.get(key, 0.0)

    def __setitem__(self, key: tuple[int, int], value: float) -> None:
        if value == 0.0:
            self._data.pop(key, None)   # keep sparse
        else:
            self._data[key] = value

    def __delitem__(self, key: tuple[int, int]) -> None:
        self._data.pop(key, None)

m = SparseMatrix()
m[0, 0] = 5.0
m[2, 3] = 7.0
print(m[0, 0])   # 5.0
print(m[1, 1])   # 0.0 (default)
del m[0, 0]
print(m[0, 0])   # 0.0`,
    explanation: "Implementing `__getitem__`, `__setitem__`, and `__delitem__` gives a class array/dict-like syntax — Python passes the index (including tuple indices like `m[0,0]`) as the `key` argument.",
  },
  {
    id: "py-0521-b2-timedelta",
    language: "python",
    title: "datetime.timedelta for time arithmetic",
    tag: "snippet",
    code: `from datetime import datetime, timedelta

now = datetime(2026, 5, 21, 9, 0, 0)

# Arithmetic
tomorrow    = now + timedelta(days=1)
next_week   = now + timedelta(weeks=1)
three_hours = now + timedelta(hours=3)
past        = now - timedelta(days=30)

print(tomorrow.date())      # 2026-05-22
print(next_week.date())     # 2026-05-28
print(three_hours.time())   # 12:00:00

# Duration between two datetimes
delta = next_week - now
print(delta.days)           # 7
print(delta.total_seconds()) # 604800.0`,
    explanation: "`timedelta` represents a duration — arithmetic between two `datetime` objects produces a `timedelta`, and adding a `timedelta` to a `datetime` produces a new `datetime`; `.total_seconds()` normalizes to a float.",
  },
  {
    id: "py-0521-b2-functools-wraps",
    language: "python",
    title: "@functools.wraps to preserve function metadata",
    tag: "classes",
    code: `from functools import wraps

def log_call(func):
    # WITHOUT @wraps: wrapper shadows func's metadata
    def wrapper(*args, **kwargs):
        print(f"calling {func.__name__}")
        return func(*args, **kwargs)
    return wrapper

def log_call_fixed(func):
    @wraps(func)   # copies __name__, __doc__, __annotations__, etc.
    def wrapper(*args, **kwargs):
        print(f"calling {func.__name__}")
        return func(*args, **kwargs)
    return wrapper

@log_call
def add(a, b): """Add two numbers."""; return a + b
@log_call_fixed
def sub(a, b): """Subtract."""; return a - b

print(add.__name__)   # wrapper  (broken)
print(sub.__name__)   # sub      (correct)
print(sub.__doc__)    # Subtract`,
    explanation: "`@wraps(func)` copies `__name__`, `__doc__`, `__annotations__`, and other attributes from `func` to the wrapper — without it, decorators break introspection, `help()`, and tools that inspect function metadata.",
  },
  {
    id: "py-0521-b2-zoneinfo",
    language: "python",
    title: "zoneinfo for timezone-aware datetimes (Python 3.9+)",
    tag: "snippet",
    code: `from datetime import datetime
from zoneinfo import ZoneInfo

utc  = ZoneInfo("UTC")
est  = ZoneInfo("America/New_York")
ist  = ZoneInfo("Asia/Kolkata")

now_utc = datetime(2026, 5, 21, 14, 0, tzinfo=utc)
now_est = now_utc.astimezone(est)
now_ist = now_utc.astimezone(ist)

print(now_utc)   # 2026-05-21 14:00:00+00:00
print(now_est)   # 2026-05-21 10:00:00-04:00
print(now_ist)   # 2026-05-21 19:30:00+05:30`,
    explanation: "`zoneinfo.ZoneInfo` (Python 3.9+) uses the system's IANA timezone database — prefer it over `pytz` for new code; `astimezone` converts between zones while preserving the same instant in time.",
  },
  {
    id: "py-0521-b2-class-decorating",
    language: "python",
    title: "class decorators for augmenting classes",
    tag: "classes",
    code: `def singleton(cls):
    """Class decorator that turns a class into a singleton."""
    instances = {}
    def get_instance(*args, **kwargs):
        if cls not in instances:
            instances[cls] = cls(*args, **kwargs)
        return instances[cls]
    get_instance.__name__ = cls.__name__
    return get_instance

@singleton
class AppConfig:
    def __init__(self):
        self.debug = False
        self.host  = "localhost"

a = AppConfig()
b = AppConfig()
print(a is b)   # True

# Note: @singleton replaces the class with a function,
# so isinstance(a, AppConfig) will fail`,
    explanation: "A class decorator receives the class as its argument and returns a replacement — it can wrap instantiation, add methods, or replace the class entirely; @dataclass is a class decorator that adds methods automatically.",
  },
  {
    id: "py-0521-b2-string-join-build",
    language: "python",
    title: "str.join is faster than repeated + concatenation",
    tag: "snippet",
    code: `import timeit

words = ["hello", "world", "from", "python"] * 1000

# Slow: O(n²) — each + copies accumulating string
def concat_plus(words):
    result = ""
    for w in words: result += w + " "
    return result

# Fast: O(n) — join builds once
def concat_join(words):
    return " ".join(words)

t_plus = timeit.timeit(lambda: concat_plus(words), number=100)
t_join = timeit.timeit(lambda: concat_join(words), number=100)
print(f"plus: {t_plus:.3f}s, join: {t_join:.3f}s")
# join is typically 10-50× faster for many strings`,
    explanation: "`str.join` collects all parts first, computes the total length, allocates once, and fills in — `+` in a loop allocates a new string on every iteration; `join` is always preferred for building strings from iterables.",
  },
  {
    id: "py-0521-b2-keyword-only-args",
    language: "python",
    title: "keyword-only arguments with bare *",
    tag: "snippet",
    code: `def create_user(name: str, *, role: str = "user", active: bool = True):
    # role and active MUST be passed as keyword arguments
    return {"name": name, "role": role, "active": active}

# Valid calls
print(create_user("Alice"))                      # role=user, active=True
print(create_user("Bob", role="admin"))          # override role
print(create_user("Carol", active=False, role="mod"))

# Invalid: positional after *
try:
    create_user("Dave", "admin")   # TypeError
except TypeError as e:
    print(e)   # create_user() takes 1 positional argument but 2 were given`,
    explanation: "A bare `*` in a function signature marks all following parameters as keyword-only — callers must use `name=value` syntax, preventing accidental positional argument transpositions in long argument lists.",
  },
  {
    id: "py-0521-b2-super-cooperative",
    language: "python",
    title: "super() and cooperative multiple inheritance",
    tag: "classes",
    code: `class A:
    def greet(self):
        print("A")
        super().greet()   # calls B.greet, not object.greet

class B:
    def greet(self):
        print("B")
        super().greet()   # calls object.greet (does nothing)

class C(A, B):
    def greet(self):
        print("C")
        super().greet()   # follows MRO: C -> A -> B -> object

C().greet()   # prints C / A / B  (each super() follows MRO)

# MRO: C, A, B, object
print(C.__mro__)`,
    explanation: "`super()` doesn't call the parent class directly — it calls the NEXT class in the MRO, enabling cooperative multiple inheritance where each class in the chain calls `super()` to pass control forward.",
  },
  {
    id: "py-0521-b2-ast-module",
    language: "python",
    title: "ast module for parsing and analyzing Python code",
    tag: "snippet",
    code: `import ast

source = """
x = 10
y = x * 2 + 1
if y > 15:
    print(y)
"""

tree = ast.parse(source)
print(ast.dump(tree, indent=2)[:300])

# Find all names referenced
class NameFinder(ast.NodeVisitor):
    def __init__(self):
        self.names = set()
    def visit_Name(self, node):
        self.names.add(node.id)

finder = NameFinder()
finder.visit(tree)
print(finder.names)   # {'x', 'y', 'print'}`,
    explanation: "The `ast` module parses Python source into an Abstract Syntax Tree — `NodeVisitor` enables tree traversal for static analysis, linting, and code transformation without writing a parser from scratch.",
  },
  {
    id: "py-0521-b2-defaultdict-nested",
    language: "python",
    title: "nested defaultdict for multi-level grouping",
    tag: "structures",
    code: `from collections import defaultdict

# 3-level hierarchy: department -> team -> [members]
org = defaultdict(lambda: defaultdict(list))

org["Engineering"]["Backend"].append("Alice")
org["Engineering"]["Frontend"].append("Bob")
org["Engineering"]["Backend"].append("Carol")
org["HR"]["Recruitment"].append("Dave")

for dept, teams in org.items():
    for team, members in teams.items():
        print(f"{dept}/{team}: {members}")
# Engineering/Backend: ['Alice', 'Carol']
# Engineering/Frontend: ['Bob']
# HR/Recruitment: ['Dave']`,
    explanation: "Nesting `defaultdict` factories with `lambda: defaultdict(list)` builds arbitrary-depth hierarchies without `setdefault` boilerplate — accessing any missing intermediate key creates the right container automatically.",
  },
  {
    id: "py-0521-b2-enum-auto-custom",
    language: "python",
    title: "Enum with custom auto() values",
    tag: "types",
    code: `from enum import Enum, auto

class Color(Enum):
    def _generate_next_value_(name, start, count, last_values):
        return name.lower()   # auto() returns lowercase name

    RED   = auto()
    GREEN = auto()
    BLUE  = auto()

print(Color.RED.value)    # "red"
print(Color.GREEN.value)  # "green"

# StrEnum (Python 3.11+): members ARE strings
from enum import StrEnum
class Status(StrEnum):
    ACTIVE   = auto()   # "active"
    INACTIVE = auto()   # "inactive"

print(Status.ACTIVE == "active")   # True`,
    explanation: "Overriding `_generate_next_value_` in an `Enum` class customizes what `auto()` produces; `StrEnum` (Python 3.11+) makes enum members be their string values by default, enabling direct string comparison.",
  },
  {
    id: "py-0521-b2-match-or-pattern",
    language: "python",
    title: "match: OR patterns and bound variables",
    tag: "snippet",
    code: `def process_command(cmd: tuple) -> str:
    match cmd:
        case ("north" | "n",):
            return "going north"
        case ("south" | "s",):
            return "going south"
        case ("go", ("north" | "n" | "south" | "s") as dir):
            return f"going {dir}"
        case ("pick", item) | ("get", item):   # OR with binding
            return f"picking up {item}"
        case _:
            return "unknown"

print(process_command(("n",)))            # going north
print(process_command(("go", "s")))       # going s
print(process_command(("pick", "sword"))) # picking up sword
print(process_command(("get", "key")))    # picking up key`,
    explanation: "OR patterns (`p1 | p2`) match either alternative; when both alternatives bind the same variable name, the `as` clause captures the matched value; OR patterns cannot bind different names on each side.",
  },
  {
    id: "py-0521-b2-typing-unpack",
    language: "python",
    title: "TypeVarTuple and Unpack for variadic generics (3.11+)",
    tag: "types",
    code: `from typing import TypeVarTuple, Unpack
import numpy as np

Ts = TypeVarTuple("Ts")

# Variadic generic — describes arrays with known shapes
def broadcast(*arrays: Unpack[Ts]) -> tuple[Unpack[Ts]]:
    return arrays

# Practical: typed shape annotations for numpy
from typing import Generic, TypeVar

N = TypeVar("N")
M = TypeVar("M")

# Matrix[N, M] conceptually represents an N×M matrix
# TypeVarTuple lets you express arbitrary-rank tensors
# (full implementation requires numpy stubs + TypeVarTuple)`,
    explanation: "`TypeVarTuple` (Python 3.11+) captures a variable-length sequence of types — `Unpack[Ts]` spreads them into position; the primary use case is typing variadic functions and shaped arrays like numpy ndarrays.",
  },
  {
    id: "py-0521-b2-pickle-basics",
    language: "python",
    title: "pickle for Python object serialization",
    tag: "snippet",
    code: `import pickle, io

data = {
    "users": [{"name": "Alice", "scores": [90, 85]}, {"name": "Bob", "scores": [70]}],
    "version": 2,
}

# Serialize to bytes
raw = pickle.dumps(data)
print(len(raw), "bytes")

# Deserialize
restored = pickle.loads(raw)
print(restored["users"][0]["name"])   # Alice

# File I/O
buf = io.BytesIO()
pickle.dump(data, buf)
buf.seek(0)
restored2 = pickle.load(buf)

# WARNING: never unpickle untrusted data — arbitrary code execution!`,
    explanation: "Pickle serializes arbitrary Python objects (including closures and classes) — it's fast and Python-native but NOT portable across languages; NEVER load pickled data from untrusted sources as it can execute arbitrary code.",
  },
  {
    id: "py-0521-b2-named-expression-comprehension",
    language: "python",
    title: "walrus in comprehension: filter and reuse",
    tag: "snippet",
    code: `import re

texts = [
    "price: 42",
    "no match here",
    "count: 7",
    "value: 99",
]

# Extract match groups without a two-pass approach
pattern = r"(\\w+): (\\d+)"
results = [
    (m.group(1), int(m.group(2)))
    for t in texts
    if (m := re.search(pattern, t))
]
print(results)
# [('price', 42), ('count', 7), ('value', 99)]`,
    explanation: "Combining `:=` with `if` in a comprehension lets you test a computation result and use it in the output expression — this avoids a separate loop or `filter` + `map` chain for extraction patterns.",
  },
  {
    id: "py-0521-b2-class-getattr-missing",
    language: "python",
    title: "__getattr__ and __getattribute__ for attribute interception",
    tag: "classes",
    code: `class FlexRecord:
    def __init__(self, data: dict):
        self._data = data

    def __getattr__(self, name: str):
        # Only called when normal lookup FAILS
        try:
            return self._data[name]
        except KeyError:
            raise AttributeError(f"no attribute '{name}'")

rec = FlexRecord({"name": "Alice", "age": 30})
print(rec.name)   # Alice  (via __getattr__)
print(rec.age)    # 30

try:
    rec.missing
except AttributeError as e:
    print(e)   # no attribute 'missing'`,
    explanation: "`__getattr__` is called only when normal attribute lookup fails (not in `__dict__` or class); `__getattribute__` intercepts EVERY attribute access including existing ones — use the former to add fallback lookup, the latter very carefully.",
  },
  {
    id: "py-0521-b2-reduce-accumulate",
    language: "python",
    title: "itertools.accumulate vs functools.reduce",
    tag: "structures",
    code: `from itertools import accumulate
from functools import reduce
import operator

data = [1, 2, 3, 4, 5]

# reduce: returns only the final accumulated value
print(reduce(operator.add, data))   # 15

# accumulate: returns EVERY intermediate value
print(list(accumulate(data)))              # [1, 3, 6, 10, 15]
print(list(accumulate(data, operator.mul))) # [1, 2, 6, 24, 120]

# Running max
print(list(accumulate(data, max)))     # [1, 2, 3, 4, 5]
print(list(accumulate([3,1,4,1,5,9], max)))  # [3,3,4,4,5,9]`,
    explanation: "`accumulate` yields every intermediate result rather than just the final one — it's the right tool for running totals, cumulative products, or any scan operation; `reduce` is only for the final aggregated value.",
  },
  {
    id: "py-0521-b2-global-interpreter-lock",
    language: "python",
    title: "GIL: why threading doesn't speed up CPU work",
    tag: "understanding",
    code: `import threading, time

COUNT = 10_000_000

def count_down(n):
    while n > 0:
        n -= 1

# Single-threaded
start = time.perf_counter()
count_down(COUNT)
print(f"single: {time.perf_counter() - start:.2f}s")

# Two threads — NOT faster (GIL prevents true parallelism)
start = time.perf_counter()
t1 = threading.Thread(target=count_down, args=(COUNT // 2,))
t2 = threading.Thread(target=count_down, args=(COUNT // 2,))
t1.start(); t2.start()
t1.join(); t2.join()
print(f"two threads: {time.perf_counter() - start:.2f}s")
# Often SLOWER due to GIL contention overhead`,
    explanation: "CPython's GIL allows only one thread to execute Python bytecode at a time — threads help I/O-bound tasks (where the GIL is released during system calls) but actually hurt CPU-bound tasks due to contention overhead.",
  },
  {
    id: "py-0521-b2-annotations-future",
    language: "python",
    title: "from __future__ import annotations for lazy evaluation",
    tag: "types",
    code: `# Without this: forward references must be strings
class Node:
    def __init__(self, value, next_node: "Node | None" = None):
        self.value = value
        self.next = next_node

# With __future__ annotations: ALL annotations become lazy strings
from __future__ import annotations

class LinkedNode:
    def __init__(self, value: int, next_node: LinkedNode | None = None):
        self.value = value
        self.next = next_node   # no quotes needed!

    def append(self, value: int) -> LinkedNode:
        self.next = LinkedNode(value)
        return self.next`,
    explanation: "`from __future__ import annotations` defers all annotation evaluation — annotations are stored as strings and resolved only when explicitly requested (e.g., `get_type_hints()`), eliminating forward reference string quotes entirely.",
  },
  {
    id: "py-0521-b2-dunder-len-contains",
    language: "python",
    title: "__len__ and __contains__ for sequence protocol",
    tag: "classes",
    code: `class RangeSet:
    """A set of integers from lo to hi (inclusive)."""
    def __init__(self, lo: int, hi: int):
        self.lo = lo
        self.hi = hi

    def __len__(self) -> int:
        return max(0, self.hi - self.lo + 1)

    def __contains__(self, item: object) -> bool:
        if isinstance(item, int):
            return self.lo <= item <= self.hi
        return False

    def __iter__(self):
        return iter(range(self.lo, self.hi + 1))

rs = RangeSet(1, 10)
print(len(rs))       # 10
print(5 in rs)       # True
print(11 in rs)      # False
print(list(rs)[:5])  # [1, 2, 3, 4, 5]`,
    explanation: "`__len__` drives `len()`, truthiness (when `__bool__` absent), and some protocol checks; `__contains__` drives the `in` operator — without `__contains__`, Python falls back to iterating and comparing, which is O(n).",
  },
  {
    id: "py-0521-b2-contextlib-redirect",
    language: "python",
    title: "contextlib.redirect_stdout for output capture",
    tag: "snippet",
    code: `import io
from contextlib import redirect_stdout, redirect_stderr

# Capture stdout
output = io.StringIO()
with redirect_stdout(output):
    print("this goes to output")
    print("and this too")

captured = output.getvalue()
print(repr(captured))
# 'this goes to output\\nand this too\\n'

# Useful for testing functions that print to stdout
def function_under_test():
    print("result: 42")

buf = io.StringIO()
with redirect_stdout(buf):
    function_under_test()
assert "42" in buf.getvalue()`,
    explanation: "`redirect_stdout` temporarily replaces `sys.stdout` with any file-like object — it's the clean way to capture or suppress console output in tests without monkey-patching `sys.stdout` manually.",
  },
  {
    id: "py-0521-b2-str-methods-partition",
    language: "python",
    title: "str.split vs str.partition: structural differences",
    tag: "snippet",
    code: `# split: returns a list, can split multiple times
url = "scheme://host/path?query"
print(url.split("://"))      # ['scheme', 'host/path?query']
print(url.split("/"))        # ['scheme:', '', 'host', 'path?query']
print(url.split("/", 2))     # ['scheme:', '', 'host/path?query']

# partition: always returns exactly 3 parts
scheme, sep, rest = url.partition("://")
print(scheme)   # scheme
print(sep)      # ://
print(rest)     # host/path?query

# partition is safer when separator may be absent
left, sep2, right = "no-sep".partition("://")
print(left, repr(sep2), right)   # no-sep '' ''`,
    explanation: "`split(sep, n)` allows multiple splits and returns a list of variable length; `partition` always returns `(before, sep, after)` — this structural guarantee makes destructuring safe without checking length first.",
  },
  {
    id: "py-0521-b2-weakref-cache",
    language: "python",
    title: "weakref.WeakValueDictionary as an object cache",
    tag: "structures",
    code: `import weakref

class Config:
    def __init__(self, path: str):
        self.path = path

# Cache holds weak references — objects are GC'd when not in use
cache: weakref.WeakValueDictionary[str, Config] = weakref.WeakValueDictionary()

c1 = Config("/etc/app.conf")
cache["app"] = c1

print(cache.get("app"))   # <Config ...>

del c1   # no more strong references
import gc; gc.collect()

print(cache.get("app"))   # None — GC'd automatically`,
    explanation: "`WeakValueDictionary` holds weak references to values — when no strong reference to the value exists elsewhere, it's garbage collected and automatically removed from the cache, preventing memory leaks in object registries.",
  },
  {
    id: "py-0521-b2-typing-guard-vs-assert",
    language: "python",
    title: "assert for debug checks vs raising for invariants",
    tag: "caveats",
    code: `# assert: disabled by python -O (optimize flag)
def compute(x: int) -> int:
    assert x >= 0, "x must be non-negative"   # debug only!
    return x ** 2

# Explicit raise: always active, for invariant violations
def divide(a: int, b: int) -> float:
    if b == 0:
        raise ValueError("divisor cannot be zero")   # always checked
    return a / b

# Never use assert for input validation in production code:
# python -O strips all asserts, silently bypassing them
# assert user_input.isdigit()  # WRONG — security issue

import sys
print(sys.flags.optimize)   # 0 = assertions active, 1 or 2 = stripped`,
    explanation: "`assert` is a debugging tool disabled by the `-O` flag — never use it for input validation or security checks; raise specific exceptions (`ValueError`, `TypeError`) for all runtime preconditions that must hold in production.",
  },
  {
    id: "py-0521-b2-concurrent-asyncio",
    language: "python",
    title: "asyncio.TaskGroup for structured concurrency",
    tag: "snippet",
    code: `import asyncio

async def fetch(url: str) -> str:
    await asyncio.sleep(0.1)   # simulate HTTP
    return f"data:{url}"

async def main():
    # TaskGroup: all tasks run concurrently; all must succeed
    async with asyncio.TaskGroup() as tg:
        t1 = tg.create_task(fetch("example.com"))
        t2 = tg.create_task(fetch("other.com"))
    # Here, both tasks are guaranteed to be done
    print(t1.result())   # data:example.com
    print(t2.result())   # data:other.com

asyncio.run(main())`,
    explanation: "`asyncio.TaskGroup` (Python 3.11+) is structured concurrency — tasks run concurrently but are tied to the `async with` block's lifetime; if any task raises, all others are cancelled and the exception propagates.",
  },
  {
    id: "py-0521-b2-complex-defaultdict",
    language: "python",
    title: "Counter arithmetic and set operations",
    tag: "structures",
    code: `from collections import Counter

inventory = Counter(apple=5, banana=3, cherry=8)
restock   = Counter(apple=2, banana=5, date=4)

# Addition and subtraction
combined = inventory + restock
print(combined)
# Counter({'cherry': 8, 'banana': 8, 'apple': 7, 'date': 4})

depleted = inventory - restock   # removes zero/negative
print(depleted)
# Counter({'cherry': 8, 'apple': 3})

# Intersection (min) and union (max) by value
print(inventory & restock)   # Counter({'banana': 3, 'apple': 2})
print(inventory | restock)   # Counter({'cherry': 8, 'banana': 5, 'apple': 5, 'date': 4})`,
    explanation: "Counter arithmetic preserves only positive counts (`-` drops zero/negative results); `&` takes the minimum count per key, `|` takes the maximum — useful for inventory, bag-of-words, and multiset operations.",
  },
  {
    id: "py-0521-b2-class-dataclass-ordering",
    language: "python",
    title: "dataclass(order=True) for automatic comparison",
    tag: "classes",
    code: `from dataclasses import dataclass

@dataclass(order=True)
class Version:
    major: int
    minor: int
    patch: int

v1 = Version(1, 9, 0)
v2 = Version(2, 0, 0)
v3 = Version(1, 10, 0)

print(v1 < v2)   # True
print(v3 > v1)   # True
print(sorted([v2, v1, v3]))
# [Version(1,9,0), Version(1,10,0), Version(2,0,0)]

# order=True compares field by field in declaration order
# (major first, then minor, then patch)`,
    explanation: "`@dataclass(order=True)` generates `__lt__`, `__le__`, `__gt__`, `__ge__` that compare field-by-field in declaration order — equivalent to tuple comparison, so declare fields from most- to least-significant.",
  },
  {
    id: "py-0521-b2-getpass",
    language: "python",
    title: "getpass for secure password input",
    tag: "snippet",
    code: `import getpass

# Prompts without echoing input to terminal
# password = getpass.getpass("Enter password: ")

# For testing: can override with a custom stream
import io
stream = io.StringIO("secret\\n")  # simulates typed input

try:
    pwd = getpass.getpass("Password: ", stream=stream)
except Exception:
    pwd = "secret"   # fallback for non-TTY environments

print(f"got {len(pwd)} char password")   # got 6 char password

# getuser() returns the current OS username
username = getpass.getuser()
print(f"running as: {username}")`,
    explanation: "`getpass.getpass` reads a password from the terminal without echoing characters — unlike `input()`, it works correctly even when stdout is redirected; `getpass.getuser()` is a portable way to get the current user's name.",
  },
  {
    id: "py-0521-b2-set-frozenset",
    language: "python",
    title: "frozenset: hashable, immutable set",
    tag: "structures",
    code: `# frozenset is immutable and hashable
fs = frozenset([1, 2, 3, 4])

# Can be used as a dict key or in a set-of-sets
graph: dict[frozenset, str] = {}
edge = frozenset({1, 2})
graph[edge] = "connected"
print(graph[frozenset({2, 1})])   # connected — order doesn't matter

# Set of frozensets (impossible with regular sets)
cliques = {frozenset({1, 2}), frozenset({2, 3}), frozenset({1, 2})}
print(len(cliques))   # 2  (deduplicated)

# Supports all non-mutating set operations
print(fs & frozenset({2, 3, 5}))   # frozenset({2, 3})`,
    explanation: "`frozenset` has the same membership and set operations as `set` but is immutable and hashable — it can be used as a dictionary key or stored in another set, enabling graph edges and hypergraph representations.",
  },
  {
    id: "py-0521-b2-signal-handling",
    language: "python",
    title: "signal module for graceful shutdown",
    tag: "snippet",
    code: `import signal, sys, time

shutdown_requested = False

def handle_sigint(signum, frame):
    global shutdown_requested
    print("\\nShutdown requested...")
    shutdown_requested = True

signal.signal(signal.SIGINT,  handle_sigint)   # Ctrl+C
signal.signal(signal.SIGTERM, handle_sigint)   # kill command

print("Running — press Ctrl+C to stop")
try:
    for i in range(100):
        if shutdown_requested:
            print("Cleaning up...")
            break
        time.sleep(0.1)
        print(f"iteration {i}")
finally:
    print("Done")`,
    explanation: "`signal.signal` registers a Python handler for OS signals — `SIGINT` (Ctrl+C) and `SIGTERM` (from `kill`) are the standard signals for requesting graceful shutdown; the handler sets a flag and the main loop checks it cooperatively.",
  },
  {
    id: "py-0521-b2-comprehension-nested",
    language: "python",
    title: "nested comprehensions for matrix operations",
    tag: "snippet",
    code: `# Matrix transpose via nested comprehension
matrix = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9],
]

transposed = [[row[i] for row in matrix] for i in range(3)]
print(transposed)
# [[1, 4, 7], [2, 5, 8], [3, 6, 9]]

# Equivalent with zip
transposed2 = [list(row) for row in zip(*matrix)]
print(transposed2)
# [[1, 4, 7], [2, 5, 8], [3, 6, 9]]

# Flatten with nested comprehension
flat = [x for row in matrix for x in row]
print(flat)   # [1, 2, 3, 4, 5, 6, 7, 8, 9]`,
    explanation: "Nested comprehensions mirror nested loops in their left-to-right order — `[expr for outer in ... for inner in outer]` reads as two `for` loops; `zip(*matrix)` is the idiomatic transpose of a rectangular 2D list.",
  },
];
