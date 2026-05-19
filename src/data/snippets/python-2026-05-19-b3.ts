import type { Snippet } from "./types";

export const pythonSnippets20260519B3: Snippet[] = [
  {
    id: "py-0519-b3-typing-selftype",
    language: "python",
    title: "Self type for fluent builder methods (Python 3.11+)",
    tag: "types",
    code: `from typing import Self

class Builder:
    def __init__(self):
        self._parts: list[str] = []

    def add(self, part: str) -> Self:
        self._parts.append(part)
        return self   # type checker knows return type is same as self

    def build(self) -> str:
        return " ".join(self._parts)

class AdvancedBuilder(Builder):
    def add_twice(self, part: str) -> Self:
        return self.add(part).add(part)

# Type checker correctly infers AdvancedBuilder, not Builder
result = AdvancedBuilder().add("hello").add_twice("world")`,
    explanation: "Self from typing (Python 3.11) annotates methods that return the same type as the receiver, preserving the subclass type through method chains without needing TypeVar boilerplate.",
  },
  {
    id: "py-0519-b3-typing-never",
    language: "python",
    title: "typing.Never for functions that never return",
    tag: "types",
    code: `from typing import Never, NoReturn

def raise_error(msg: str) -> Never:
    raise RuntimeError(msg)   # Never returns normally

# Equivalent older spelling
def fail(msg: str) -> NoReturn:
    raise ValueError(msg)

# Type checker understands code after these calls is unreachable
def process(x: int | None) -> int:
    if x is None:
        raise_error("x must not be None")
    return x + 1   # type checker narrows x to int here`,
    explanation: "Never (or NoReturn) tells the type checker that a function never returns normally; it enables unreachable-code analysis and type narrowing after the call site.",
  },
  {
    id: "py-0519-b3-dataclass-inheritance",
    language: "python",
    title: "Dataclass inheritance and field ordering",
    tag: "classes",
    code: `from dataclasses import dataclass

@dataclass
class Animal:
    name: str
    weight: float

@dataclass
class Dog(Animal):
    breed: str
    # Fields without defaults must come before fields with defaults
    # (same rule as regular function parameters)

d = Dog(name="Rex", weight=30.0, breed="Labrador")
print(d)   # Dog(name='Rex', weight=30.0, breed='Labrador')

# But this FAILS — Animal's no-default fields before Dog's default fields
@dataclass
class BadParent:
    x: int = 0   # has default

# @dataclass
# class BadChild(BadParent):
#     y: int     # no default after parent's default — TypeError`,
    explanation: "Dataclass inheritance appends child fields after parent fields in __init__; fields with defaults must come after fields without defaults across the entire MRO, otherwise Python raises TypeError.",
  },
  {
    id: "py-0519-b3-enum-str-mixin",
    language: "python",
    title: "Enum mixed with str for JSON-friendly values",
    tag: "types",
    code: `from enum import Enum

class Status(str, Enum):
    PENDING  = "pending"
    ACTIVE   = "active"
    INACTIVE = "inactive"

s = Status.ACTIVE
print(s)               # Status.ACTIVE
print(str(s))          # active  (str value, not 'Status.ACTIVE')
print(s == "active")   # True    (str comparison works)
print(s.value)         # active

import json
# Serialises as the string value without a custom encoder
data = {"status": s}
print(json.dumps(data))  # {"status": "active"}`,
    explanation: "Mixing str with Enum makes the enum values behave as strings for comparison and JSON serialisation while retaining enum membership checks — ideal for string-valued protocol enums.",
  },
  {
    id: "py-0519-b3-abstractproperty",
    language: "python",
    title: "Abstract property combined with cached_property",
    tag: "classes",
    code: `from abc import ABC, abstractmethod
from functools import cached_property

class Source(ABC):
    @property
    @abstractmethod
    def connection_string(self) -> str: ...

    @cached_property
    def connection(self):
        # Uses abstract property — resolved in subclass
        cs = self.connection_string
        print(f"Connecting to: {cs}")
        return {"url": cs, "connected": True}

class PostgresSource(Source):
    @property
    def connection_string(self) -> str:
        return "postgresql://localhost/db"

src = PostgresSource()
print(src.connection["url"])  # Connecting to: postgresql://localhost/db
print(src.connection["url"])  # no re-connect (cached)`,
    explanation: "Abstract properties enforce implementation in subclasses; combining with cached_property in the base class lets expensive operations be computed once using the subclass-provided value.",
  },
  {
    id: "py-0519-b3-contextmanager-async",
    language: "python",
    title: "async context manager with asynccontextmanager",
    tag: "snippet",
    code: `from contextlib import asynccontextmanager
import asyncio

@asynccontextmanager
async def managed_connection(url: str):
    print(f"Connecting to {url}")
    conn = {"url": url}   # simulate async connection
    try:
        yield conn
    finally:
        print(f"Disconnecting from {url}")

async def main():
    async with managed_connection("db://localhost") as conn:
        print(f"Using {conn['url']}")

asyncio.run(main())
# Connecting to db://localhost
# Using db://localhost
# Disconnecting from db://localhost`,
    explanation: "@asynccontextmanager turns an async generator with a single yield into an async context manager; it's the async equivalent of @contextmanager and supports await before and after the yield.",
  },
  {
    id: "py-0519-b3-pep572-scope",
    language: "python",
    title: "Walrus scope: assignment leaks into enclosing scope",
    tag: "understanding",
    code: `# Walrus operator assigns to the ENCLOSING scope, not the comprehension
result = [y := f(x) for x in range(5)]

# y is now accessible here (unlike 'for' variable which leaks too)
def f(x): return x * 2

result = [y := f(x) for x in range(5)]
print(y)   # 8 — the last assigned value

# Compare to comprehension loop var leaking
[z for z in range(5)]
print(z)   # 4 — loop var leaks in Python 3 (list comp only)

# Generator expression does NOT leak
(w for w in range(5))
# print(w)  # NameError`,
    explanation: "Walrus := intentionally assigns to the nearest enclosing function scope (not the comprehension scope), so the variable is available after the comprehension; this is by design in PEP 572.",
  },
  {
    id: "py-0519-b3-match-or",
    language: "python",
    title: "OR patterns in match-case",
    tag: "snippet",
    code: `def classify(value):
    match value:
        case 0 | False | None | "" | [] | {}:
            return "falsy"
        case 1 | True:
            return "truthy-bool"
        case int() | float():
            return "number"
        case str():
            return "string"
        case _:
            return "other"

print(classify(0))       # falsy
print(classify(3.14))    # number
print(classify("hi"))    # string`,
    explanation: "The | in a match-case pattern is an OR (not bitwise or), matching any of the alternatives; each alternative in an OR pattern must bind the same names (or none at all).",
  },
  {
    id: "py-0519-b3-slots-namedtuple",
    language: "python",
    title: "namedtuple vs __slots__ class: memory comparison",
    tag: "structures",
    code: `import sys
from collections import namedtuple

Point = namedtuple("Point", ["x", "y", "z"])

class PointSlots:
    __slots__ = ("x", "y", "z")
    def __init__(self, x, y, z):
        self.x, self.y, self.z = x, y, z

p_nt = Point(1, 2, 3)
p_sl = PointSlots(1, 2, 3)

print(sys.getsizeof(p_nt))  # 72  (tuple overhead)
print(sys.getsizeof(p_sl))  # 64  (slots overhead)

# namedtuple has tuple methods; __slots__ class has no extras
print(p_nt[0])         # 1  (index access)
# p_sl[0]  # TypeError`,
    explanation: "Both namedtuple and __slots__ classes save memory vs plain classes with __dict__, but namedtuple additionally supports tuple indexing and unpacking at the cost of slightly more overhead.",
  },
  {
    id: "py-0519-b3-abstractmethod-concrete",
    language: "python",
    title: "Concrete ABC methods can be called via super()",
    tag: "classes",
    code: `from abc import ABC, abstractmethod

class Logger(ABC):
    @abstractmethod
    def log(self, message: str) -> None:
        # Abstract but has a body — callable via super()
        print(f"[BASE] {message}")

class FileLogger(Logger):
    def log(self, message: str) -> None:
        super().log(message)   # calls the abstract body!
        print(f"[FILE] {message}")

FileLogger().log("test")
# [BASE] test
# [FILE] test`,
    explanation: "Abstract methods can have a body that subclasses access via super(); this lets the base class provide optional shared logic while still requiring subclasses to provide their own implementation.",
  },
  {
    id: "py-0519-b3-functools-total-ordering",
    language: "python",
    title: "functools.total_ordering from just __eq__ and one comparison",
    tag: "classes",
    code: `from functools import total_ordering

@total_ordering
class Weight:
    def __init__(self, kg):
        self.kg = kg

    def __eq__(self, other):
        return self.kg == other.kg

    def __lt__(self, other):
        return self.kg < other.kg

w1 = Weight(50)
w2 = Weight(70)

print(w1 < w2)    # True  (from __lt__)
print(w1 > w2)    # False (derived: not __lt__ and not __eq__)
print(w1 <= w2)   # True  (derived: __lt__ or __eq__)
print(sorted([w2, w1], key=lambda w: w.kg))`,
    explanation: "@total_ordering derives the missing comparison operators (__gt__, __le__, __ge__) from __eq__ and one of __lt__, __le__, __gt__, or __ge__, eliminating boilerplate.",
  },
  {
    id: "py-0519-b3-typing-paramsspec-decorator",
    language: "python",
    title: "Using ParamSpec to type generic decorators",
    tag: "types",
    code: `from typing import ParamSpec, TypeVar, Callable
import functools

P = ParamSpec("P")
T = TypeVar("T")

def with_timeout(seconds: float):
    def decorator(func: Callable[P, T]) -> Callable[P, T]:
        @functools.wraps(func)
        def wrapper(*args: P.args, **kwargs: P.kwargs) -> T:
            import signal
            def _handler(sig, frame): raise TimeoutError()
            signal.signal(signal.SIGALRM, _handler)
            signal.alarm(int(seconds))
            try:
                return func(*args, **kwargs)
            finally:
                signal.alarm(0)
        return wrapper
    return decorator

@with_timeout(5.0)
def slow_work(x: int, y: str = "") -> str:
    return f"{x}{y}"`,
    explanation: "ParamSpec captures the parameter signature of the wrapped function so the decorator's returned callable has the exact same signature — type checkers flag wrong arguments at the call site.",
  },
  {
    id: "py-0519-b3-str-format-map",
    language: "python",
    title: "str.format_map for template dicts",
    tag: "snippet",
    code: `template = "Hello, {name}! Your score is {score:.1f}."

data = {"name": "Alice", "score": 97.3}
print(template.format_map(data))
# Hello, Alice! Your score is 97.3.

# format_map with a defaultdict handles missing keys gracefully
from collections import defaultdict
safe = defaultdict(lambda: "<missing>")
safe.update(data)
print("{name} {age}".format_map(safe))
# Alice <missing>`,
    explanation: "format_map is like format(**dict) but avoids creating a copy of the dict; using a defaultdict as the mapping provides safe defaults for keys that aren't present in the data.",
  },
  {
    id: "py-0519-b3-multiprocessing-pool",
    language: "python",
    title: "multiprocessing.Pool for CPU-bound parallelism",
    tag: "snippet",
    code: `from multiprocessing import Pool
import math

def is_prime(n):
    if n < 2: return False
    for i in range(2, int(math.sqrt(n)) + 1):
        if n % i == 0: return False
    return True

if __name__ == "__main__":
    candidates = list(range(1, 10000))
    with Pool() as pool:
        # map distributes work across CPU cores
        results = pool.map(is_prime, candidates)
    primes = [n for n, ok in zip(candidates, results) if ok]
    print(len(primes))  # 1229`,
    explanation: "multiprocessing.Pool bypasses the GIL by running workers in separate processes, making it suitable for CPU-bound tasks; pool.map sends items to workers and collects results in order.",
  },
  {
    id: "py-0519-b3-asyncio-semaphore",
    language: "python",
    title: "asyncio.Semaphore for rate-limiting concurrent tasks",
    tag: "snippet",
    code: `import asyncio

async def fetch(sem, url):
    async with sem:         # limits to N concurrent ops
        await asyncio.sleep(0.1)  # simulate HTTP
        return f"data:{url}"

async def main():
    sem = asyncio.Semaphore(3)  # max 3 concurrent requests
    tasks = [fetch(sem, f"api/{i}") for i in range(10)]
    results = await asyncio.gather(*tasks)
    print(len(results))   # 10

asyncio.run(main())`,
    explanation: "asyncio.Semaphore caps the number of concurrent coroutines inside an async with block; without it, all 10 tasks would start immediately and might overwhelm the server.",
  },
  {
    id: "py-0519-b3-descriptors-class-access",
    language: "python",
    title: "Descriptor accessed via class vs instance",
    tag: "classes",
    code: `class UnitDescriptor:
    def __set_name__(self, owner, name):
        self.name = name

    def __get__(self, obj, objtype=None):
        if obj is None:
            # Called on the class — return the descriptor itself
            return self
        return obj.__dict__.get(self.name, 0)

    def __set__(self, obj, value):
        if value < 0:
            raise ValueError(f"{self.name} must be non-negative")
        obj.__dict__[self.name] = value

class Measurement:
    meters = UnitDescriptor()

print(Measurement.meters)     # <UnitDescriptor ...>  (obj is None)
m = Measurement()
m.meters = 5
print(m.meters)               # 5`,
    explanation: "When a descriptor's __get__ is called on a class (obj is None), returning self gives callers access to the descriptor object itself — useful for chaining or inspection.",
  },
  {
    id: "py-0519-b3-singledispatch-none",
    language: "python",
    title: "singledispatch with None check",
    tag: "classes",
    code: `from functools import singledispatch
from typing import Optional

@singledispatch
def encode(value) -> bytes:
    raise NotImplementedError(f"No encoder for {type(value)}")

@encode.register(str)
def _(value: str) -> bytes:
    return value.encode("utf-8")

@encode.register(int)
def _(value: int) -> bytes:
    return value.to_bytes(4, "big")

@encode.register(type(None))
def _(value: None) -> bytes:
    return b""

print(encode("hello"))   # b'hello'
print(encode(42))        # b'\\x00\\x00\\x00*'
print(encode(None))      # b''`,
    explanation: "singledispatch dispatches on the first argument's type; to handle None you must register type(None) because None is of NoneType, not of None itself.",
  },
  {
    id: "py-0519-b3-generics-class",
    language: "python",
    title: "Generic class with TypeVar (Python 3.12 syntax)",
    tag: "types",
    code: `# Python 3.9+ (using TypeVar)
from typing import TypeVar, Generic

T = TypeVar("T")

class Stack(Generic[T]):
    def __init__(self) -> None:
        self._items: list[T] = []

    def push(self, item: T) -> None:
        self._items.append(item)

    def pop(self) -> T:
        return self._items.pop()

s: Stack[int] = Stack()
s.push(1)
s.push(2)
print(s.pop())   # 2`,
    explanation: "Generic[T] makes a class generic; the type parameter T is used in method signatures so the type checker can propagate concrete types like Stack[int] through the class's operations.",
  },
  {
    id: "py-0519-b3-str-translate",
    language: "python",
    title: "str.translate for bulk character substitution",
    tag: "snippet",
    code: `# Build a translation table
table = str.maketrans(
    "aeiou",      # from
    "AEIOU",      # to (same length)
    " "           # chars to delete
)

result = "hello world".translate(table)
print(result)   # hEllOwOrld

# Remove punctuation efficiently
import string
remove_punct = str.maketrans("", "", string.punctuation)
clean = "Hello, World! Isn't it?".translate(remove_punct)
print(clean)    # Hello World Isnt it`,
    explanation: "str.translate with a table from maketrans is faster than repeated replace() or regex for bulk character mapping and deletion, since it processes the string in one O(n) pass.",
  },
  {
    id: "py-0519-b3-dataclass-slots",
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

pn = PointNormal(1.0, 2.0)
ps = PointSlotted(1.0, 2.0)

print(sys.getsizeof(pn) + sys.getsizeof(pn.__dict__))  # ~232 bytes
print(sys.getsizeof(ps))                                # ~56 bytes

# slots=True dataclass is also faster for attribute access
print(hasattr(pn, "__dict__"))   # True
print(hasattr(ps, "__dict__"))   # False`,
    explanation: "dataclass(slots=True) automatically generates __slots__ for all fields, giving the memory and speed benefits of slots without manually maintaining them alongside the field definitions.",
  },
  {
    id: "py-0519-b3-conditional-import",
    language: "python",
    title: "Conditional and lazy imports for optional dependencies",
    tag: "snippet",
    code: `try:
    import numpy as np
    HAS_NUMPY = True
except ImportError:
    HAS_NUMPY = False

def mean(data):
    if HAS_NUMPY:
        return float(np.mean(data))
    return sum(data) / len(data)

# TYPE_CHECKING guard for annotations only
from typing import TYPE_CHECKING
if TYPE_CHECKING:
    import pandas as pd   # only imported when type-checking, not at runtime

def process(df: "pd.DataFrame") -> None:  # quoted to avoid runtime import
    pass`,
    explanation: "Guard optional dependencies in try/except and set a flag; use TYPE_CHECKING (always False at runtime) to import types for annotations without a runtime dependency on the library.",
  },
  {
    id: "py-0519-b3-operator-dunder-arithmetic",
    language: "python",
    title: "Arithmetic dunder methods and __radd__",
    tag: "classes",
    code: `class Money:
    def __init__(self, amount, currency="USD"):
        self.amount = amount
        self.currency = currency

    def __add__(self, other):
        if isinstance(other, Money):
            return Money(self.amount + other.amount, self.currency)
        return Money(self.amount + other, self.currency)

    def __radd__(self, other):
        # Called when: other + self and other doesn't know how to add Money
        return self.__add__(other)

    def __repr__(self):
        return f"{self.currency} {self.amount}"

m = Money(10)
print(m + 5)      # USD 15
print(5 + m)      # USD 15  — uses __radd__
print(sum([Money(1), Money(2), Money(3)]))  # USD 6 — sum starts with 0`,
    explanation: "__radd__ is the reflected add, called when the left operand's __add__ returns NotImplemented; it's essential for sum() (which starts with 0 + first_item) and for interop with built-in types.",
  },
  {
    id: "py-0519-b3-asyncio-timeout",
    language: "python",
    title: "asyncio.timeout context manager (Python 3.11+)",
    tag: "snippet",
    code: `import asyncio

async def slow_operation():
    await asyncio.sleep(10)
    return "done"

async def main():
    try:
        async with asyncio.timeout(2.0):
            result = await slow_operation()
    except TimeoutError:
        print("Timed out after 2 seconds")

asyncio.run(main())
# Timed out after 2 seconds`,
    explanation: "asyncio.timeout (Python 3.11) is the clean way to apply deadlines to async operations; it raises TimeoutError (not asyncio.TimeoutError) and cancels the inner task properly.",
  },
  {
    id: "py-0519-b3-itertools-accumulate",
    language: "python",
    title: "itertools.accumulate for running totals",
    tag: "snippet",
    code: `from itertools import accumulate
import operator

data = [1, 2, 3, 4, 5]

# Running sum (default)
print(list(accumulate(data)))
# [1, 3, 6, 10, 15]

# Running product
print(list(accumulate(data, operator.mul)))
# [1, 2, 6, 24, 120]

# Running max
print(list(accumulate(data, max)))
# [1, 2, 3, 4, 5]

# With initial value (Python 3.8+)
print(list(accumulate(data, initial=100)))
# [100, 101, 103, 106, 110, 115]`,
    explanation: "accumulate applies a binary function cumulatively, yielding the running result at each step; the initial= parameter prepends the seed to the output sequence.",
  },
  {
    id: "py-0519-b3-itertools-product",
    language: "python",
    title: "itertools.product for Cartesian product",
    tag: "snippet",
    code: `from itertools import product

colors = ["red", "green"]
sizes  = ["S", "M", "L"]

# All combinations
for color, size in product(colors, sizes):
    print(f"{color}-{size}", end=" ")
# red-S red-M red-L green-S green-M green-L

# repeat= for same iterable multiple times
for combo in product("AB", repeat=2):
    print("".join(combo), end=" ")
# AA AB BA BB`,
    explanation: "itertools.product generates the Cartesian product of multiple iterables (like nested for-loops), and repeat= produces the cross-product of an iterable with itself N times.",
  },
  {
    id: "py-0519-b3-itertools-combinations",
    language: "python",
    title: "itertools.combinations and permutations",
    tag: "snippet",
    code: `from itertools import combinations, permutations, combinations_with_replacement

items = [1, 2, 3, 4]

# Combinations: unordered, no repetition
print(list(combinations(items, 2)))
# [(1,2),(1,3),(1,4),(2,3),(2,4),(3,4)]

# Permutations: ordered, no repetition
print(list(permutations([1, 2, 3], 2)))
# [(1,2),(1,3),(2,1),(2,3),(3,1),(3,2)]

# Combinations with replacement
print(list(combinations_with_replacement([1, 2], 2)))
# [(1,1),(1,2),(2,2)]`,
    explanation: "combinations gives C(n,r) unique unordered selections; permutations gives P(n,r) ordered arrangements; combinations_with_replacement allows repeated elements in each selection.",
  },
  {
    id: "py-0519-b3-contextlib-redirect",
    language: "python",
    title: "contextlib.redirect_stdout/stderr for output capture",
    tag: "snippet",
    code: `import io
from contextlib import redirect_stdout, redirect_stderr

# Capture stdout to a string buffer
buf = io.StringIO()
with redirect_stdout(buf):
    print("this goes to the buffer, not the terminal")
    print("captured!")

output = buf.getvalue()
print(repr(output))  # 'this goes to the buffer, not the terminal\\ncaptured!\\n'

# Silencing stderr
with redirect_stderr(io.StringIO()):
    import warnings
    warnings.warn("silenced!")`,
    explanation: "redirect_stdout/stderr temporarily replaces sys.stdout/stderr with any file-like object, letting you capture or silence output from code you don't control — useful for testing.",
  },
  {
    id: "py-0519-b3-dict-pop-popitem",
    language: "python",
    title: "dict.pop vs dict.popitem",
    tag: "structures",
    code: `d = {"a": 1, "b": 2, "c": 3}

# pop(key): remove and return value (optional default)
val = d.pop("b")
print(val)   # 2
print(d)     # {'a': 1, 'c': 3}

missing = d.pop("z", 0)   # default avoids KeyError
print(missing)   # 0

# popitem(): remove and return last inserted (key, value)
k, v = d.popitem()
print(k, v)  # c 3  (last inserted in Python 3.7+)

# Useful for LIFO processing without tracking keys`,
    explanation: "pop removes a specific key; popitem removes and returns the most recently inserted item (LIFO in Python 3.7+) without needing to look up a key first.",
  },
  {
    id: "py-0519-b3-list-comprehension-walrus",
    language: "python",
    title: "Filtering and transforming with walrus in comprehension",
    tag: "snippet",
    code: `import re

logs = [
    "2026-05-19 ERROR: disk full",
    "2026-05-19 INFO: started",
    "2026-05-19 WARNING: memory low",
    "2026-05-19 ERROR: timeout",
]

pattern = re.compile(r"ERROR: (.+)")

# Extract error messages without scanning each string twice
errors = [m.group(1)
          for line in logs
          if (m := pattern.search(line))]

print(errors)  # ['disk full', 'timeout']`,
    explanation: "The walrus operator inside the if clause captures the regex match and makes it available in the expression, avoiding a double search() call to both test and extract.",
  },
  {
    id: "py-0519-b3-method-resolution",
    language: "python",
    title: "Method resolution order (C3 linearisation)",
    tag: "classes",
    code: `class A: pass
class B(A): pass
class C(A): pass
class D(B, C): pass
class E(C, B): pass

print(D.__mro__)
# [D, B, C, A, object]
print(E.__mro__)
# [E, C, B, A, object]

# Inconsistent hierarchy raises TypeError
try:
    class F(D, E): pass   # can't linearise D's and E's MROs consistently
except TypeError as e:
    print(e)`,
    explanation: "Python uses C3 linearisation to compute the MRO; it respects the local order of each class's bases and ensures each class appears after its bases — circular or contradictory hierarchies raise TypeError.",
  },
  {
    id: "py-0519-b3-exception-group-unwrap",
    language: "python",
    title: "ExceptionGroup.subgroup and split",
    tag: "types",
    code: `eg = ExceptionGroup("errors", [
    ValueError("bad value"),
    TypeError("bad type"),
    ValueError("also bad"),
])

# subgroup: returns a new ExceptionGroup with matching exceptions
value_errors = eg.subgroup(ValueError)
print(value_errors)  # ExceptionGroup('errors', [ValueError, ValueError])

# split: returns (matching, rest)
match, rest = eg.split(ValueError)
print(match)  # ExceptionGroup with both ValueErrors
print(rest)   # ExceptionGroup with TypeError`,
    explanation: "ExceptionGroup provides subgroup() and split() to filter exceptions by type, making it possible to handle some exceptions while re-raising others from a concurrent operation.",
  },
  {
    id: "py-0519-b3-type-narrowing-isinstance",
    language: "python",
    title: "Type narrowing with isinstance in unions",
    tag: "types",
    code: `def process(value: int | str | list[int]) -> str:
    if isinstance(value, int):
        # Type checker narrows: value is int
        return f"int: {value + 1}"
    elif isinstance(value, str):
        # Type checker narrows: value is str
        return f"str: {value.upper()}"
    else:
        # Type checker narrows: value is list[int]
        return f"list: {sum(value)}"

print(process(42))           # int: 43
print(process("hello"))      # str: HELLO
print(process([1, 2, 3]))    # list: 6`,
    explanation: "isinstance checks narrow the type in subsequent branches; inside each branch the type checker knows the exact type and flags misuse like calling .upper() on an int.",
  },
  {
    id: "py-0519-b3-recursive-datastructure",
    language: "python",
    title: "Recursive type hints with string forward references",
    tag: "types",
    code: `from __future__ import annotations
from dataclasses import dataclass, field

@dataclass
class TreeNode:
    value: int
    children: list[TreeNode] = field(default_factory=list)  # self-reference

    def total(self) -> int:
        return self.value + sum(c.total() for c in self.children)

root = TreeNode(1, [
    TreeNode(2, [TreeNode(4), TreeNode(5)]),
    TreeNode(3),
])
print(root.total())   # 15`,
    explanation: "from __future__ import annotations makes all annotations lazy strings by default, allowing forward references like list[TreeNode] inside the TreeNode class definition.",
  },
  {
    id: "py-0519-b3-typing-get-type-hints",
    language: "python",
    title: "typing.get_type_hints for runtime annotation access",
    tag: "types",
    code: `from typing import get_type_hints
from dataclasses import dataclass

@dataclass
class Config:
    host: str
    port: int
    debug: bool = False

# get_type_hints evaluates string annotations and resolves forward refs
hints = get_type_hints(Config)
print(hints)  # {'host': <class 'str'>, 'port': <class 'int'>, 'debug': <class 'bool'>}

# Useful for building validators, serializers, etc.
for field_name, field_type in hints.items():
    print(f"{field_name}: {field_type.__name__}")`,
    explanation: "get_type_hints returns the resolved type annotations as a dict, evaluating string forward references in the correct namespace — more reliable than __annotations__ for runtime use.",
  },
  {
    id: "py-0519-b3-struct-unpack-iter",
    language: "python",
    title: "struct.iter_unpack for parsing repeated binary records",
    tag: "structures",
    code: `import struct

# Binary data: three records of (unsigned short, float)
fmt = ">Hf"    # big-endian: unsigned short (2 bytes) + float (4 bytes)
data = struct.pack(fmt, 1, 1.0) + struct.pack(fmt, 2, 2.0) + struct.pack(fmt, 3, 3.0)

# iter_unpack processes all records without slicing manually
for seq_num, value in struct.iter_unpack(fmt, data):
    print(seq_num, round(value, 1))
# 1 1.0
# 2 2.0
# 3 3.0`,
    explanation: "struct.iter_unpack yields successive fixed-size records from a buffer without you needing to compute offsets or slice — ideal for parsing binary files with repeating record structures.",
  },
  {
    id: "py-0519-b3-functools-lru-typed",
    language: "python",
    title: "lru_cache typed=True for separate int/float caches",
    tag: "snippet",
    code: `from functools import lru_cache

@lru_cache(maxsize=128, typed=True)
def compute(x):
    print(f"computing {x!r}")
    return x * 2

compute(3)     # computing 3
compute(3)     # cache hit
compute(3.0)   # computing 3.0  (typed=True: int 3 != float 3.0)
compute(3.0)   # cache hit

@lru_cache(maxsize=128)  # typed=False (default)
def compute2(x):
    return x * 2

compute2(3)
compute2(3.0)  # cache hit — 3 == 3.0 so same key`,
    explanation: "typed=True makes lru_cache treat 3 (int) and 3.0 (float) as different keys; without it, equal values hash to the same cache entry even if their types differ.",
  },
  {
    id: "py-0519-b3-repr-format",
    language: "python",
    title: "__format__ for custom format spec support",
    tag: "classes",
    code: `class Duration:
    def __init__(self, seconds: int):
        self.seconds = seconds

    def __format__(self, spec: str) -> str:
        if spec == "hms":
            h, rem = divmod(self.seconds, 3600)
            m, s   = divmod(rem, 60)
            return f"{h:02d}:{m:02d}:{s:02d}"
        elif spec == "min":
            return f"{self.seconds / 60:.1f}m"
        return str(self.seconds)

    def __repr__(self):
        return f"Duration({self.seconds})"

d = Duration(3725)
print(f"{d:hms}")  # 01:02:05
print(f"{d:min}")  # 62.1m
print(f"{d}")      # 3725`,
    explanation: "__format__ receives the format specification string from the format mini-language so you can define entirely custom formatting codes for your type.",
  },
  {
    id: "py-0519-b3-set-update-ops",
    language: "python",
    title: "Set update operations: |=, &=, -=, ^=",
    tag: "structures",
    code: `a = {1, 2, 3, 4}
b = {3, 4, 5, 6}

# In-place union
a |= b
print(a)   # {1, 2, 3, 4, 5, 6}

a = {1, 2, 3, 4}
a &= b     # In-place intersection
print(a)   # {3, 4}

a = {1, 2, 3, 4}
a -= b     # In-place difference
print(a)   # {1, 2}

a = {1, 2, 3, 4}
a ^= b     # In-place symmetric difference
print(a)   # {1, 2, 5, 6}`,
    explanation: "Set augmented assignment operators update in place (same object, unlike | which creates a new set); they also accept any iterable on the right side, unlike | which requires another set.",
  },
  {
    id: "py-0519-b3-bytes-operations",
    language: "python",
    title: "bytes operations: split, find, startswith",
    tag: "structures",
    code: `data = b"GET /index.html HTTP/1.1\\r\\nHost: example.com\\r\\n"

# bytes.split works like str.split
lines = data.split(b"\\r\\n")
print(lines[0])   # b'GET /index.html HTTP/1.1'

# startswith with a tuple of prefixes
print(data.startswith((b"GET", b"POST", b"PUT")))  # True

# find returns byte index
idx = data.find(b"HTTP")
print(idx)         # 15
print(data[idx:idx+8])  # b'HTTP/1.1'`,
    explanation: "bytes supports most of the same methods as str (split, find, startswith, strip, etc.) but operates on byte values; the arguments must also be bytes, not str.",
  },
  {
    id: "py-0519-b3-dict-update-methods",
    language: "python",
    title: "dict.update vs |= vs unpacking for merging",
    tag: "families",
    code: `base = {"a": 1, "b": 2}
extra = {"b": 99, "c": 3}

# update: in-place, returns None
d1 = dict(base)
d1.update(extra)
print(d1)   # {'a': 1, 'b': 99, 'c': 3}

# |=: in-place, same as update but more readable (Python 3.9+)
d2 = dict(base)
d2 |= extra
print(d2)   # {'a': 1, 'b': 99, 'c': 3}

# | creates a new dict (non-mutating)
d3 = base | extra
print(d3)   # {'a': 1, 'b': 99, 'c': 3}
print(base) # {'a': 1, 'b': 2}  unchanged`,
    explanation: "update and |= both mutate the left dict (right side wins); | creates a new merged dict; all three give the right-side wins semantics — choose based on whether you need a new dict or in-place mutation.",
  },
  {
    id: "py-0519-b3-generator-cleanup",
    language: "python",
    title: "Generator cleanup with .close() and GeneratorExit",
    tag: "snippet",
    code: `def managed():
    try:
        print("started")
        yield 1
        yield 2
        print("all yielded")
    except GeneratorExit:
        print("generator closed early")
    finally:
        print("cleanup always runs")

g = managed()
print(next(g))   # started / 1
g.close()        # generator closed early / cleanup always runs

# The garbage collector calls close() automatically when
# the generator object is collected`,
    explanation: "close() throws GeneratorExit into the generator at the current yield point; the generator can catch it for cleanup and must not yield again; finally always runs regardless.",
  },
  {
    id: "py-0519-b3-typing-overload-union",
    language: "python",
    title: "@overload for precise return types based on input",
    tag: "types",
    code: `from typing import overload, Literal

@overload
def make_list(n: Literal[0]) -> list: ...
@overload
def make_list(n: int) -> list[int]: ...

def make_list(n: int) -> list:
    return list(range(n))

# Type checker knows the return type based on the argument
empty: list      = make_list(0)    # overload 1
nums:  list[int] = make_list(5)    # overload 2`,
    explanation: "@overload with Literal types lets the type checker select the correct return type based on a literal argument value — useful for functions that return different types for specific constant inputs.",
  },
  {
    id: "py-0519-b3-gc-module",
    language: "python",
    title: "gc module — controlling garbage collection",
    tag: "snippet",
    code: `import gc

# Disable GC for performance-critical sections
gc.disable()

# ... allocate and free many objects without GC interruptions ...

gc.enable()

# Force a collection
gc.collect()   # returns number of unreachable objects found

# Find reference cycles
class Node:
    def __init__(self): self.ref = None

a = Node()
b = Node()
a.ref = b; b.ref = a   # cycle!
del a, b

collected = gc.collect()
print(f"Collected {collected} objects in cycle")`,
    explanation: "CPython's cyclic GC (not reference counting) handles reference cycles; you can disable it during GC-unfriendly code, force a collection at a convenient time, and detect leaking cycles.",
  },
  {
    id: "py-0519-b3-typing-dataclass-transform",
    language: "python",
    title: "ParamSpec and Concatenate for typed decorators with extra args",
    tag: "types",
    code: `from typing import ParamSpec, Concatenate, Callable, TypeVar
import functools

P = ParamSpec("P")
T = TypeVar("T")

# Decorator that prepends a 'context' argument
def with_context(func: Callable[Concatenate[dict, P], T]) -> Callable[P, T]:
    @functools.wraps(func)
    def wrapper(*args: P.args, **kwargs: P.kwargs) -> T:
        ctx = {"user": "system"}
        return func(ctx, *args, **kwargs)
    return wrapper

@with_context
def create_order(ctx: dict, item: str, qty: int) -> str:
    return f"{ctx['user']} created {qty}x {item}"

print(create_order("apple", 3))  # system created 3x apple`,
    explanation: "Concatenate[ExtraType, P] describes a callable that takes an extra leading parameter before the parameters captured by P, enabling precise typing of decorators that inject arguments.",
  },
  {
    id: "py-0519-b3-weakref-finalize",
    language: "python",
    title: "weakref.finalize — reliable cleanup callback",
    tag: "structures",
    code: `import weakref

class Connection:
    def __init__(self, url):
        self.url = url
        print(f"Connected to {url}")

def on_close(url):
    print(f"Connection to {url} cleaned up")

conn = Connection("db://localhost")

# finalize registers a cleanup that fires when conn is GC'd
# (even if the object doesn't have __del__)
fin = weakref.finalize(conn, on_close, conn.url)

del conn
# Connection to db://localhost cleaned up

# Can also call manually
fin. alive   # False — already ran`,
    explanation: "weakref.finalize is more reliable than __del__: it's guaranteed to be called even if the object is in a reference cycle, and can be called manually or cancelled with fin.detach().",
  },
  {
    id: "py-0519-b3-inspect-module",
    language: "python",
    title: "inspect module for runtime introspection",
    tag: "snippet",
    code: `import inspect

def greet(name: str, greeting: str = "Hello") -> str:
    """Greet someone."""
    return f"{greeting}, {name}!"

# Signature
sig = inspect.signature(greet)
print(sig)   # (name: str, greeting: str = 'Hello') -> str

for name, param in sig.parameters.items():
    print(name, param.default, param.annotation)

# Source
print(inspect.getsource(greet))

# Check if something is a coroutine function
async def coro(): pass
print(inspect.iscoroutinefunction(coro))  # True`,
    explanation: "The inspect module exposes runtime metadata about functions, classes, and modules; inspect.signature gives a machine-readable representation of parameters and defaults without parsing source.",
  },
  {
    id: "py-0519-b3-dis-bytecode",
    language: "python",
    title: "dis module for inspecting bytecode",
    tag: "snippet",
    code: `import dis

def add(a, b):
    return a + b

dis.dis(add)
# RESUME
# LOAD_FAST  a
# LOAD_FAST  b
# BINARY_OP  +
# RETURN_VALUE

# Check how an expression compiles
dis.dis(compile("[x for x in range(5)]", "<>", "eval"))
# Lists comprehensions use LIST_COMPREHENSION and GET_ITER ops`,
    explanation: "dis.dis prints the CPython bytecode for a function; useful for understanding performance (LOAD_FAST vs LOAD_GLOBAL), verifying generator behaviour, and debugging subtle optimisation surprises.",
  },
  {
    id: "py-0519-b3-class-body-namespace",
    language: "python",
    title: "Class body has its own namespace (not a scope)",
    tag: "understanding",
    code: `x = "module"

class Foo:
    x = "class"
    # List comprehensions in class body CANNOT see class scope
    # (this is a gotcha: comprehension has its own scope, skips class body)
    try:
        values = [x for x in range(3)]   # x here is the loop var
        # values = [x] * 3  # would fail: can't see class x from comprehension
    except NameError:
        pass
    # Direct expressions CAN see class body
    direct = [1, 2, 3]
    label = x   # sees class x

print(Foo.label)   # 'class'`,
    explanation: "The class body executes in its own namespace but is NOT a scope — comprehensions inside the class body can't see the class namespace (they skip it in the lookup chain), a frequent surprise.",
  },
  {
    id: "py-0519-b3-integer-literal-bases",
    language: "python",
    title: "Integer literal bases: 0b, 0o, 0x",
    tag: "types",
    code: `# Binary, octal, hex literals
b = 0b1010_1100   # binary (underscores for readability)
o = 0o374         # octal
h = 0xDEAD_BEEF   # hex

print(b, o, h)    # 172 252 3735928559

# Convert integers to string representations
n = 255
print(bin(n))     # '0b11111111'
print(oct(n))     # '0o377'
print(hex(n))     # '0xff'

# Format spec
print(f"{n:08b}")  # '11111111'  (zero-padded 8-bit binary)`,
    explanation: "Python accepts integer literals in binary (0b), octal (0o), and hexadecimal (0x) bases; underscores can be inserted anywhere for readability and are ignored by the parser.",
  },
  {
    id: "py-0519-b3-match-as-pattern",
    language: "python",
    title: "match-case 'as' pattern for binding and matching",
    tag: "snippet",
    code: `def process(event):
    match event:
        case {"type": "click", "x": x, "y": y} as e:
            print(f"click at ({x},{y}), full event: {e}")

        case {"type": "key", "key": k} as e if k.startswith("F"):
            print(f"function key {k}")

        case _ as e:
            print(f"unknown: {e}")

process({"type": "click", "x": 3, "y": 4})
process({"type": "key", "key": "F5"})
process({"type": "other"})`,
    explanation: "The 'as' pattern captures the entire matched value into a name while the main pattern still does structural matching; it's also useful for combining with guard conditions.",
  },
  {
    id: "py-0519-b3-string-intern-perf",
    language: "python",
    title: "String interning effect on dict lookup performance",
    tag: "understanding",
    code: `import sys, timeit

# Many repeated dict lookups with interned vs non-interned keys
KEY_INTERNED = sys.intern("user_id")
KEY_DYNAMIC  = "user_" + "id"   # not interned (usually)

d = {KEY_INTERNED: 42}

def lookup_interned():
    return d[KEY_INTERNED]

def lookup_dynamic():
    return d["user_id"]  # literal — interned by compiler

# Both are fast for literals; dynamic strings that compare equal
# may need full hash + equality check if not interned
print(d[KEY_INTERNED])  # 42
print(d[KEY_DYNAMIC])   # 42`,
    explanation: "Interned strings allow identity-based dict lookups (pointer comparison instead of hash+equality); the CPython compiler interns string literals automatically, but runtime-constructed strings are not interned.",
  },
  {
    id: "py-0519-b3-metaclass-register",
    language: "python",
    title: "Metaclass auto-registration pattern",
    tag: "classes",
    code: `class PluginMeta(type):
    registry: dict[str, type] = {}

    def __new__(mcs, name, bases, namespace):
        cls = super().__new__(mcs, name, bases, namespace)
        if bases:  # don't register the base class itself
            key = namespace.get("name", name.lower())
            mcs.registry[key] = cls
        return cls

class Plugin(metaclass=PluginMeta):
    pass  # base — not registered

class CsvPlugin(Plugin):
    name = "csv"

class JsonPlugin(Plugin):
    name = "json"

print(PluginMeta.registry)
# {'csv': <class 'CsvPlugin'>, 'json': <class 'JsonPlugin'>}`,
    explanation: "Overriding metaclass __new__ runs at class creation time and is perfect for auto-registration; it's more powerful than __init_subclass__ when you need to inspect the raw class namespace.",
  },
  {
    id: "py-0519-b3-typing-protocol-inheritance",
    language: "python",
    title: "Protocol inheritance and extending protocols",
    tag: "types",
    code: `from typing import Protocol

class Readable(Protocol):
    def read(self, n: int = -1) -> bytes: ...

class Writable(Protocol):
    def write(self, data: bytes) -> int: ...

class ReadWritable(Readable, Writable, Protocol):
    """Combines both protocols structurally."""
    pass

def copy(src: Readable, dst: Writable) -> None:
    while chunk := src.read(4096):
        dst.write(chunk)

# Any object with both read() and write() satisfies ReadWritable
# without inheriting from it`,
    explanation: "Protocols can inherit other Protocols to compose larger structural requirements; the combined protocol still works with structural subtyping — no explicit declaration needed by implementing classes.",
  },
  {
    id: "py-0519-b3-class-decorator-wrap",
    language: "python",
    title: "Class decorator that modifies class attributes",
    tag: "classes",
    code: `def register_handlers(cls):
    """Collect all methods starting with 'handle_' into a registry."""
    cls._handlers = {
        name[7:]: method
        for name in dir(cls)
        if name.startswith("handle_")
        if callable(method := getattr(cls, name))
    }
    return cls

@register_handlers
class EventBus:
    def handle_click(self, event): return "click"
    def handle_key(self, event):   return "key"
    def handle_drag(self, event):  return "drag"

print(EventBus._handlers.keys())   # dict_keys(['click', 'key', 'drag'])
bus = EventBus()
print(bus._handlers["click"](bus, None))  # click`,
    explanation: "A class decorator receives the class object and returns it (or a replacement); this enables auto-discovery patterns like collecting handler methods into a registry at class definition time.",
  },
  {
    id: "py-0519-b3-unpack-function-args",
    language: "python",
    title: "TypeVarTuple for variadic generic functions (Python 3.11+)",
    tag: "types",
    code: `from typing import TypeVarTuple, Unpack

Ts = TypeVarTuple("Ts")

def broadcast(func, *args: Unpack[Ts]) -> tuple[Unpack[Ts]]:
    return tuple(func(arg) for arg in args)  # type: ignore

# TypeVarTuple lets you express functions that preserve
# a tuple's element types through transformations
# (used by NumPy stubs for shape-typed arrays)`,
    explanation: "TypeVarTuple captures a variable-length tuple of types; with Unpack it enables precise typing of functions that transform tuples element-wise, preserving each element's specific type.",
  },
  {
    id: "py-0519-b3-asyncio-event",
    language: "python",
    title: "asyncio.Event for signalling between coroutines",
    tag: "snippet",
    code: `import asyncio

async def waiter(event: asyncio.Event, name: str):
    print(f"{name} waiting...")
    await event.wait()   # blocks until event is set
    print(f"{name} done!")

async def setter(event: asyncio.Event):
    await asyncio.sleep(0.1)
    print("Setting event")
    event.set()           # wakes all waiters

async def main():
    event = asyncio.Event()
    await asyncio.gather(
        waiter(event, "A"),
        waiter(event, "B"),
        setter(event),
    )

asyncio.run(main())`,
    explanation: "asyncio.Event is a one-to-many signal; set() wakes every coroutine blocking on wait(), and clear() resets it; all waiters unblock on the same event.set() call.",
  },
  {
    id: "py-0519-b3-abstract-classmethod-factory",
    language: "python",
    title: "Abstract factory via classmethod in ABC",
    tag: "classes",
    code: `from abc import ABC, abstractmethod

class Serialiser(ABC):
    @classmethod
    @abstractmethod
    def from_string(cls, s: str) -> "Serialiser": ...

    @abstractmethod
    def to_string(self) -> str: ...

class JsonSerialiser(Serialiser):
    def __init__(self, data):
        self.data = data

    @classmethod
    def from_string(cls, s: str) -> "JsonSerialiser":
        import json
        return cls(json.loads(s))

    def to_string(self) -> str:
        import json
        return json.dumps(self.data)

j = JsonSerialiser.from_string('{"key": 1}')
print(j.to_string())  # {"key": 1}`,
    explanation: "Combining @classmethod with @abstractmethod (both decorators required) forces subclasses to implement a class-level factory, enabling the Abstract Factory pattern with typed enforcement.",
  },
  {
    id: "py-0519-b3-traceback-module",
    language: "python",
    title: "traceback module for structured exception formatting",
    tag: "snippet",
    code: `import traceback, sys

def risky():
    1 / 0

try:
    risky()
except ZeroDivisionError:
    # Format the traceback as a string instead of printing
    tb_str = traceback.format_exc()
    print("Captured:", tb_str[:40])

    # Or get structured data
    exc_type, exc_value, exc_tb = sys.exc_info()
    frames = traceback.extract_tb(exc_tb)
    for frame in frames:
        print(f"{frame.filename}:{frame.lineno} in {frame.name}")`,
    explanation: "The traceback module lets you capture, format, and inspect exception tracebacks programmatically — useful for logging structured error reports, sending to error-tracking services, or custom formatters.",
  },
  {
    id: "py-0519-b3-typing-required-notrequired",
    language: "python",
    title: "TypedDict Required and NotRequired (Python 3.11+)",
    tag: "types",
    code: `from typing import TypedDict, Required, NotRequired

class UserProfile(TypedDict, total=False):
    # total=False makes all keys optional by default
    name: Required[str]    # but this one is always required
    age: int               # optional (total=False)
    email: NotRequired[str]  # explicitly optional (redundant but clear)

# Valid — name is present, others optional
profile: UserProfile = {"name": "Alice"}

# Invalid — name is Required
# bad: UserProfile = {"age": 30}   # type error`,
    explanation: "TypedDict with total=False makes all keys optional; Required[T] and NotRequired[T] let you opt specific keys in or out regardless of the total setting — mixing the two gives fine-grained control.",
  },
  {
    id: "py-0519-b3-context-suppress-exception",
    language: "python",
    title: "Using context managers to suppress exceptions in loops",
    tag: "snippet",
    code: `from contextlib import suppress

# Process all items, silently skip ones that fail
results = []
for item in ["1", "two", "3", "four", "5"]:
    with suppress(ValueError):
        results.append(int(item))

print(results)   # [1, 3, 5]

# Equivalent but noisier:
for item in ["1", "two", "3", "four", "5"]:
    try:
        results.append(int(item))
    except ValueError:
        pass`,
    explanation: "contextlib.suppress inside a loop body continues to the next iteration when the suppressed exception fires, making 'skip bad items' logic one line instead of three.",
  },
  {
    id: "py-0519-b3-ordereddict-move",
    language: "python",
    title: "OrderedDict.move_to_end for LRU cache logic",
    tag: "structures",
    code: `from collections import OrderedDict

class LRUCache:
    def __init__(self, capacity):
        self.capacity = capacity
        self.cache = OrderedDict()

    def get(self, key):
        if key not in self.cache:
            return -1
        self.cache.move_to_end(key)  # mark as most recently used
        return self.cache[key]

    def put(self, key, value):
        self.cache[key] = value
        self.cache.move_to_end(key)
        if len(self.cache) > self.capacity:
            self.cache.popitem(last=False)  # evict least recently used

lru = LRUCache(2)
lru.put(1, "a"); lru.put(2, "b")
lru.get(1)         # 'a' — now most recent
lru.put(3, "c")    # evicts 2
print(lru.get(2))  # -1`,
    explanation: "move_to_end(key, last=True) moves an entry to the end (most-recent) and popitem(last=False) removes from the front (least-recent), making OrderedDict the natural backing structure for LRU caches.",
  },
  {
    id: "py-0519-b3-generator-pipeline",
    language: "python",
    title: "Generator pipeline for memory-efficient processing",
    tag: "snippet",
    code: `def read_lines(filename):
    """Lazily yield lines from a file."""
    with open(filename) as f:
        yield from f

def parse_csv(lines):
    """Parse comma-separated values."""
    for line in lines:
        yield line.strip().split(",")

def filter_rows(rows, min_val):
    """Keep rows where second column >= min_val."""
    for row in rows:
        if len(row) >= 2 and row[1].strip().isdigit():
            if int(row[1]) >= min_val:
                yield row

# Compose into a pipeline — only one line in memory at a time
# pipeline = filter_rows(parse_csv(read_lines("data.csv")), 100)
# for row in pipeline:
#     process(row)`,
    explanation: "Chaining generators creates a lazy pipeline where each stage pulls one item at a time; memory usage is constant regardless of file size because no stage materialises the full sequence.",
  },
  {
    id: "py-0519-b3-super-delegation",
    language: "python",
    title: "super() without arguments (Python 3)",
    tag: "classes",
    code: `class Base:
    def method(self, x):
        return x * 2

class Middle(Base):
    def method(self, x):
        result = super().method(x)   # no args needed in Python 3
        return result + 1

class Child(Middle):
    def method(self, x):
        result = super().method(x)   # calls Middle.method
        return result * 10

print(Child().method(5))   # (5*2 + 1) * 10 = 110`,
    explanation: "Python 3's zero-argument super() uses a closure cell __class__ and the first argument (self/cls) to find the next class in the MRO automatically — no need to repeat the class name.",
  },
  {
    id: "py-0519-b3-overload-return-narrowing",
    language: "python",
    title: "Overload for input-dependent return narrowing",
    tag: "types",
    code: `from typing import overload

@overload
def get_item(data: dict, key: str, default: None = None) -> str | None: ...
@overload
def get_item(data: dict, key: str, default: str) -> str: ...

def get_item(data, key, default=None):
    return data.get(key, default)

# Type checker infers the correct type based on default argument
val1: str | None = get_item({"k": "v"}, "k")         # overload 1
val2: str        = get_item({"k": "v"}, "k", "")     # overload 2`,
    explanation: "Overloading based on whether a default is None or a concrete value lets the type checker narrow the return to str | None or str — matching how dict.get works in standard library stubs.",
  },
  {
    id: "py-0519-b3-int-gcd-lcm",
    language: "python",
    title: "math.gcd and math.lcm (Python 3.9+)",
    tag: "snippet",
    code: `import math

print(math.gcd(48, 18))    # 6
print(math.gcd(48, 18, 12))  # 6  (variadic in 3.9+)

print(math.lcm(4, 6))     # 12
print(math.lcm(4, 6, 10)) # 60  (variadic in 3.9+)

# gcd is useful for fraction reduction
from fractions import Fraction
print(Fraction(48, 18))   # 8/3  (auto-reduced)

# lcm is useful for finding a common period/interval
print(math.lcm(3, 5, 7))  # 105`,
    explanation: "math.gcd and math.lcm accept multiple arguments in Python 3.9+, computing the GCD/LCM of all of them; gcd(0, x) == x and lcm(0, x) == 0 by convention.",
  },
  {
    id: "py-0519-b3-dataclass-compare",
    language: "python",
    title: "dataclass eq=True and order=True for comparisons",
    tag: "classes",
    code: `from dataclasses import dataclass

@dataclass(order=True)
class Version:
    major: int
    minor: int
    patch: int

v1 = Version(1, 9, 0)
v2 = Version(2, 0, 0)
v3 = Version(1, 9, 0)

print(v1 < v2)    # True
print(v1 == v3)   # True
print(sorted([v2, v1, v3]))   # [Version(1,9,0), Version(1,9,0), Version(2,0,0)]`,
    explanation: "order=True generates __lt__, __le__, __gt__, __ge__ based on the tuple of fields in definition order; this is why field order matters — put the most significant field first.",
  },
  {
    id: "py-0519-b3-format-f-conversion",
    language: "python",
    title: "F-string conversion flags !r, !s, !a",
    tag: "snippet",
    code: `name = "Alice"
emoji = "\\u2764"  # heart

# !s: calls str() — default for most objects
print(f"Hello {name!s}")   # Hello Alice

# !r: calls repr() — adds quotes, escapes
print(f"Name: {name!r}")   # Name: 'Alice'

# !a: calls ascii() — escapes non-ASCII
print(f"Emoji: {emoji!a}") # Emoji: '\\u2764'

# Useful for debugging with !r
x = {"key": "value with spaces"}
print(f"data={x!r}")  # data={'key': 'value with spaces'}`,
    explanation: "The !s, !r, !a conversion flags in f-strings apply str(), repr(), or ascii() to the value before formatting, letting you switch between user-readable and debug-safe representations inline.",
  },
  {
    id: "py-0519-b3-time-perf",
    language: "python",
    title: "time.perf_counter vs time.time for benchmarking",
    tag: "snippet",
    code: `import time

# time.time: wall clock (may jump on NTP sync)
start = time.time()
sum(range(1_000_000))
end = time.time()
print(f"wall: {end - start:.6f}s")

# time.perf_counter: high-resolution, monotonic (preferred)
start = time.perf_counter()
sum(range(1_000_000))
end = time.perf_counter()
print(f"perf: {end - start:.6f}s")

# time.process_time: CPU time only (no sleep)
start = time.process_time()
time.sleep(0.1)   # not counted
sum(range(100))
print(f"cpu: {time.process_time() - start:.6f}s")`,
    explanation: "perf_counter gives the highest resolution and is monotonic (never goes backward), making it the correct choice for benchmarking; process_time measures only CPU time, excluding sleep.",
  },
  {
    id: "py-0519-b3-importlib-metadata",
    language: "python",
    title: "importlib.metadata for package version info",
    tag: "snippet",
    code: `from importlib.metadata import version, packages_distributions, requires

# Get installed package version
try:
    v = version("requests")
    print(f"requests {v}")
except Exception:
    print("requests not installed")

# List dependencies of a package
try:
    deps = requires("pip")
    if deps:
        print(deps[:3])  # first 3 requirements
except Exception:
    pass`,
    explanation: "importlib.metadata (standard library since Python 3.8) reads package metadata from the installed egg-info/dist-info without importing the package — the right way to check versions at runtime.",
  },
  {
    id: "py-0519-b3-string-dedent",
    language: "python",
    title: "textwrap.dedent for multiline string indentation",
    tag: "snippet",
    code: `import textwrap

def make_sql():
    # The indentation of the triple-quoted string includes the
    # spaces from the function's body — we usually don't want those
    query = """
        SELECT id, name
        FROM users
        WHERE active = 1
        ORDER BY name
    """
    return textwrap.dedent(query).strip()

print(make_sql())
# SELECT id, name
# FROM users
# WHERE active = 1
# ORDER BY name`,
    explanation: "textwrap.dedent removes the common leading whitespace from all lines of a multi-line string, letting you indent the literal naturally inside a function without the indentation appearing in the output.",
  },
  {
    id: "py-0519-b3-pprint",
    language: "python",
    title: "pprint for readable nested structure output",
    tag: "snippet",
    code: `import pprint

data = {
    "users": [
        {"id": 1, "name": "Alice", "tags": ["admin", "user"]},
        {"id": 2, "name": "Bob",   "tags": ["user"]},
    ],
    "total": 2,
    "page": 1,
}

# print() dumps it on one line — unreadable for nested dicts
# pprint.pprint() formats it with proper indentation
pprint.pprint(data, width=40, depth=3)`,
    explanation: "pprint.pprint formats nested dicts/lists with indentation and line-wrapping at a configurable width; depth= limits how deep it shows, replacing deeper levels with '...'.",
  },
];
