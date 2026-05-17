import type { Snippet } from "./types";

export const pythonSnippets20260517B5: Snippet[] = [
  {
    id: "py-b17-b5-tee-itertools",
    language: "python",
    title: "itertools.tee to fork an iterator",
    tag: "snippet",
    code: `import itertools

def gen():
    for i in range(5):
        yield i

it1, it2 = itertools.tee(gen(), 2)
print(list(it1))  # [0, 1, 2, 3, 4]
print(list(it2))  # [0, 1, 2, 3, 4]`,
    explanation: "`itertools.tee` creates N independent iterators from one, buffering items so each clone can advance independently — avoid holding both for long (memory grows).",
  },
  {
    id: "py-b17-b5-itertools-cycle",
    language: "python",
    title: "itertools.cycle for repeating sequences",
    tag: "snippet",
    code: `import itertools

colors = itertools.cycle(["red", "green", "blue"])
items  = ["a", "b", "c", "d", "e"]

paired = [(item, next(colors)) for item in items]
print(paired)
# [('a','red'),('b','green'),('c','blue'),('d','red'),('e','green')]`,
    explanation: "`itertools.cycle` repeats an iterable indefinitely; combined with `zip` or `next`, it assigns elements from a finite pool in round-robin fashion.",
  },
  {
    id: "py-b17-b5-typing-self",
    language: "python",
    title: "Self type for fluent builder chains",
    tag: "snippet",
    code: `from typing import Self

class Builder:
    def __init__(self): self._parts: list = []

    def add(self, part: str) -> Self:
        self._parts.append(part)
        return self

    def build(self) -> str:
        return ", ".join(self._parts)

result = Builder().add("a").add("b").add("c").build()
print(result)  # a, b, c`,
    explanation: "`Self` (Python 3.11+) annotates the return type of methods that return `self`, letting type checkers infer the correct subclass type in chains.",
  },
  {
    id: "py-b17-b5-str-casefold",
    language: "python",
    title: "str.casefold for Unicode-aware case folding",
    tag: "snippet",
    code: `a = "Straße"
b = "strasse"

print(a.lower() == b.lower())     # False — ß vs ss
print(a.casefold() == b.casefold())  # True  — ß folds to ss`,
    explanation: "`casefold` is more aggressive than `lower` for case-insensitive comparison, correctly handling ligatures and locale-specific characters like the German ß.",
  },
  {
    id: "py-b17-b5-math-prod",
    language: "python",
    title: "math.prod for multiplying an iterable",
    tag: "snippet",
    code: `import math

nums = [1, 2, 3, 4, 5]
print(math.prod(nums))      # 120
print(math.prod(range(1, 6)))  # 120

# Factorial-style:
n = 6
print(math.prod(range(1, n + 1)))  # 720`,
    explanation: "`math.prod` (Python 3.8+) computes the product of an iterable, equivalent to `functools.reduce(operator.mul, nums)` but more readable.",
  },
  {
    id: "py-b17-b5-walrus-any",
    language: "python",
    title: "Walrus operator inside any()/all()",
    tag: "snippet",
    code: `data = [4, -1, 7, -3, 5]

if first_neg := next((x for x in data if x < 0), None):
    print(f"first negative: {first_neg}")  # first negative: -1`,
    explanation: "Combining the walrus operator with `next` and a generator expression finds the first matching element and binds it in one expression.",
  },
  {
    id: "py-b17-b5-classvar-type",
    language: "python",
    title: "ClassVar to annotate class-level attributes",
    tag: "snippet",
    code: `from typing import ClassVar
from dataclasses import dataclass

@dataclass
class Registry:
    _instances: ClassVar[list] = []   # shared across all instances
    name: str

    def __post_init__(self):
        Registry._instances.append(self)

Registry("a"); Registry("b")
print([r.name for r in Registry._instances])  # ['a', 'b']`,
    explanation: "`ClassVar[T]` tells type checkers (and dataclasses) that the annotated attribute is a class variable, not a per-instance field — dataclass won't include it in `__init__`.",
  },
  {
    id: "py-b17-b5-functools-singledispatch",
    language: "python",
    title: "functools.singledispatch for type-based dispatch",
    tag: "snippet",
    code: `from functools import singledispatch

@singledispatch
def serialize(obj):
    return str(obj)

@serialize.register(list)
def _(obj): return "[" + ", ".join(serialize(x) for x in obj) + "]"

@serialize.register(dict)
def _(obj): return "{" + ", ".join(f"{k}:{serialize(v)}" for k,v in obj.items()) + "}"

print(serialize([1, {"a": 2}]))   # [1, {a:2}]`,
    explanation: "`@singledispatch` dispatches to type-specific implementations registered with `@fn.register(type)`, avoiding `isinstance` chains.",
  },
  {
    id: "py-b17-b5-contextlib-nullcontext",
    language: "python",
    title: "contextlib.nullcontext as a no-op context",
    tag: "snippet",
    code: `from contextlib import nullcontext
import threading

def process(data, lock=None):
    ctx = lock if lock is not None else nullcontext()
    with ctx:
        return sum(data)

print(process([1, 2, 3]))                          # 6
print(process([1, 2, 3], threading.Lock()))        # 6`,
    explanation: "`nullcontext()` is a do-nothing context manager, useful for making `lock` optional without duplicating code for the locked/unlocked cases.",
  },
  {
    id: "py-b17-b5-dict-fromkeys",
    language: "python",
    title: "dict.fromkeys to initialize with default value",
    tag: "snippet",
    code: `keys = ["a", "b", "c"]

# All keys map to the same default (suitable for immutables)
counts = dict.fromkeys(keys, 0)
print(counts)  # {'a': 0, 'b': 0, 'c': 0}

# For mutable defaults use dict comprehension:
groups = {k: [] for k in keys}`,
    explanation: "`dict.fromkeys(keys, default)` creates a dict with all keys set to the same value; for mutable defaults use a comprehension to get independent objects per key.",
  },
  {
    id: "py-b17-b5-re-verbose",
    language: "python",
    title: "re.VERBOSE for readable patterns",
    tag: "snippet",
    code: `import re

date_pattern = re.compile(r"""
    (?P<year>  \\d{4}) -   # four-digit year
    (?P<month> \\d{2}) -   # two-digit month
    (?P<day>   \\d{2})     # two-digit day
""", re.VERBOSE)

m = date_pattern.match("2024-07-04")
print(m.group("year"), m.group("month"), m.group("day"))`,
    explanation: "`re.VERBOSE` (or `re.X`) ignores unescaped whitespace and `#` comments inside the pattern, making complex regexes self-documenting.",
  },
  {
    id: "py-b17-b5-super-mro-call",
    language: "python",
    title: "super() respects MRO in cooperative multiple inheritance",
    tag: "understanding",
    code: `class A:
    def hello(self): print("A"); super().hello()

class B(A):
    def hello(self): print("B"); super().hello()

class C(A):
    def hello(self): print("C"); super().hello()

class D(B, C):
    def hello(self): print("D"); super().hello()

class Base:
    def hello(self): print("Base")

# Patch Base into the chain to avoid AttributeError
D.__mro__[-2].hello = Base.hello  # illustration only
D().hello()  # D B C A Base`,
    explanation: "`super()` follows the MRO, not the class hierarchy; in cooperative multiple inheritance every class's `super().method()` continues the chain correctly.",
  },
  {
    id: "py-b17-b5-typing-protocol-inheritance",
    language: "python",
    title: "Protocol inheritance to compose interfaces",
    tag: "types",
    code: `from typing import Protocol

class Readable(Protocol):
    def read(self) -> str: ...

class Writable(Protocol):
    def write(self, data: str) -> None: ...

class ReadWrite(Readable, Writable, Protocol): ...

def copy(src: Readable, dst: Writable) -> None:
    dst.write(src.read())`,
    explanation: "Protocols can inherit from other Protocols to compose larger structural interfaces without requiring implementors to inherit from any base class.",
  },
  {
    id: "py-b17-b5-asyncio-create-task",
    language: "python",
    title: "asyncio.create_task for fire-and-forget",
    tag: "snippet",
    code: `import asyncio

async def background(name):
    await asyncio.sleep(0.1)
    print(f"{name} done")

async def main():
    t1 = asyncio.create_task(background("A"))
    t2 = asyncio.create_task(background("B"))
    print("tasks started")
    await t1
    await t2

asyncio.run(main())
# tasks started  A done  B done`,
    explanation: "`create_task` schedules a coroutine to run concurrently without blocking; the returned `Task` can be awaited later or cancelled if needed.",
  },
  {
    id: "py-b17-b5-dataclass-frozen",
    language: "python",
    title: "Frozen dataclass as dict key",
    tag: "structures",
    code: `from dataclasses import dataclass

@dataclass(frozen=True)
class Point:
    x: int
    y: int

cache: dict[Point, str] = {}
cache[Point(1, 2)] = "origin-ish"
print(cache[Point(1, 2)])  # origin-ish

# Point(1,2).x = 99  # FrozenInstanceError`,
    explanation: "`frozen=True` makes the dataclass immutable and hashable by auto-generating `__hash__` based on all fields, allowing it to be used as a dict key or set element.",
  },
  {
    id: "py-b17-b5-string-partition",
    language: "python",
    title: "str.partition splits into exactly three parts",
    tag: "snippet",
    code: `header = "Content-Type: application/json; charset=utf-8"

key, sep, value = header.partition(": ")
print(key)    # Content-Type
print(value)  # application/json; charset=utf-8

_, _, last = header.rpartition(";")
print(last.strip())  # charset=utf-8`,
    explanation: "`partition(sep)` splits on the first occurrence of `sep` into `(before, sep, after)`; if `sep` is not found, `before` is the whole string and the rest are empty.",
  },
  {
    id: "py-b17-b5-operator-attrgetter",
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

staff = [
    Employee("Bob",   "eng",  90_000),
    Employee("Alice", "eng",  95_000),
    Employee("Carol", "sales",80_000),
]
staff.sort(key=attrgetter("dept", "salary"))
for e in staff: print(e.name, e.dept, e.salary)`,
    explanation: "`operator.attrgetter('a', 'b')` returns a callable that extracts a tuple of attributes, suitable as a multi-key sort key without a lambda.",
  },
  {
    id: "py-b17-b5-int-from-bytes",
    language: "python",
    title: "int.from_bytes and int.to_bytes",
    tag: "snippet",
    code: `data = b"\\x00\\x01\\x00\\x00"

n = int.from_bytes(data, byteorder="big")
print(n)            # 65536

back = n.to_bytes(4, byteorder="big")
print(back)         # b'\\x00\\x01\\x00\\x00'`,
    explanation: "`int.from_bytes` and `int.to_bytes` convert between integers and byte sequences with explicit endianness control, essential for binary protocol parsing.",
  },
  {
    id: "py-b17-b5-contextlib-ExitStack",
    language: "python",
    title: "contextlib.ExitStack for dynamic context managers",
    tag: "snippet",
    code: `from contextlib import ExitStack

files = ["a.txt", "b.txt", "c.txt"]
with ExitStack() as stack:
    handles = [stack.enter_context(open(f, "w")) for f in files]
    for h, f in zip(handles, files):
        h.write(f"content of {f}\\n")
# all files closed on exit`,
    explanation: "`ExitStack` manages a dynamic number of context managers entered at runtime; each is registered with `enter_context` and cleaned up in LIFO order on exit.",
  },
  {
    id: "py-b17-b5-struct-pack-network",
    language: "python",
    title: "struct.pack for network protocol data",
    tag: "snippet",
    code: `import struct

# Packet: type (1 byte), length (2 bytes big-endian), payload (variable)
payload = b"hello"
header = struct.pack("!BH", 0x01, len(payload))
packet = header + payload
print(packet.hex())  # 010005 68656c6c6f

ptype, plen = struct.unpack_from("!BH", packet)
print(ptype, plen)   # 1 5`,
    explanation: "`struct.pack` with `!` (network byte order) serializes integers into bytes for binary protocols; `unpack_from` extracts them back using the same format string.",
  },
  {
    id: "py-b17-b5-typing-annotated-metadata",
    language: "python",
    title: "Annotated with metadata for validation frameworks",
    tag: "types",
    code: `from typing import Annotated

class Gt:
    def __init__(self, val): self.val = val

Positive = Annotated[int, Gt(0)]
Percent  = Annotated[float, Gt(0.0), "0.0 <= x <= 1.0"]

def set_rate(rate: Percent) -> None:
    print(f"rate = {rate}")

set_rate(0.5)`,
    explanation: "`Annotated[T, metadata...]` attaches arbitrary metadata to a type hint; frameworks like Pydantic, beartype, and FastAPI read these annotations for runtime validation.",
  },
  {
    id: "py-b17-b5-typing-typevar-tuple",
    language: "python",
    title: "TypeVarTuple for variadic generics (PEP 646)",
    tag: "types",
    code: `from typing import TypeVarTuple, Unpack

Ts = TypeVarTuple("Ts")

def broadcast(fn, *args: Unpack[Ts]) -> tuple[Unpack[Ts]]:
    return args   # type: ignore

result = broadcast(print, 1, "hello", 3.14)
print(result)  # (1, 'hello', 3.14)`,
    explanation: "`TypeVarTuple` (Python 3.11+) captures a variadic sequence of types, enabling type-safe heterogeneous tuple operations like NumPy shape typing.",
  },
  {
    id: "py-b17-b5-caveats-dict-ordering",
    language: "python",
    title: "dict preserves insertion order (Python 3.7+)",
    tag: "caveats",
    code: `d = {}
d["b"] = 2
d["a"] = 1
d["c"] = 3

print(list(d.keys()))   # ['b', 'a', 'c']  — insertion order

# Updating an existing key does NOT change its position:
d["a"] = 99
print(list(d.keys()))   # ['b', 'a', 'c']  — 'a' stays in place`,
    explanation: "CPython dicts preserve insertion order since 3.6 (guaranteed by language spec since 3.7); updating a key's value does not move it — only new keys are appended.",
  },
  {
    id: "py-b17-b5-caveats-augmented-assign-list",
    language: "python",
    title: "+= on a list mutates in place; + creates a new list",
    tag: "caveats",
    code: `a = [1, 2]
b = a
a += [3]       # equivalent to a.extend([3]) — mutates in place
print(b)       # [1, 2, 3]  — b sees the change

a = a + [4]    # new list object
print(b)       # [1, 2, 3]  — b unchanged
print(a is b)  # False`,
    explanation: "`list += other` calls `__iadd__`, which calls `list.extend` in place; `list + other` creates a brand-new list. This distinction matters when aliases exist.",
  },
  {
    id: "py-b17-b5-caveats-assert-optimization",
    language: "python",
    title: "assert is removed in optimised (-O) mode",
    tag: "caveats",
    code: `def process(data):
    assert isinstance(data, list), "data must be a list"
    # If Python is run with -O, the assert is stripped entirely
    # Never rely on assert for input validation in production code
    return sum(data)

# Use explicit checks for security/correctness:
def safe_process(data):
    if not isinstance(data, list):
        raise TypeError("data must be a list")
    return sum(data)`,
    explanation: "`assert` statements are compiled out when Python runs with the `-O` flag; use explicit `if/raise` for input validation and security checks.",
  },
  {
    id: "py-b17-b5-caveats-star-import",
    language: "python",
    title: "Star imports pollute namespace and hide origins",
    tag: "caveats",
    code: `# BAD: unclear where 'reduce' comes from; may shadow builtins
from functools import *
from itertools import *

# GOOD: explicit imports are self-documenting
from functools import reduce
from itertools import chain, islice`,
    explanation: "Wildcard imports import all public names, potentially shadowing builtins or other imports silently; always use explicit imports in production code.",
  },
  {
    id: "py-b17-b5-understanding-copy-protocol",
    language: "python",
    title: "__copy__ and __deepcopy__ hooks",
    tag: "understanding",
    code: `import copy

class Cached:
    def __init__(self, data):
        self.data = data
        self._cache = {}     # should not be deep-copied

    def __deepcopy__(self, memo):
        new = Cached(copy.deepcopy(self.data, memo))
        new._cache = {}      # fresh cache, don't copy old one
        return new

c1 = Cached([1, 2, 3])
c2 = copy.deepcopy(c1)
print(c1.data is c2.data)   # False — deep copied`,
    explanation: "Override `__deepcopy__` to control how `copy.deepcopy` handles your object — useful to skip re-creating caches or file handles that should not be duplicated.",
  },
  {
    id: "py-b17-b5-understanding-lru-cache-eviction",
    language: "python",
    title: "lru_cache evicts LRU entries when full",
    tag: "understanding",
    code: `from functools import lru_cache

@lru_cache(maxsize=3)
def square(n):
    print(f"computing {n}²")
    return n * n

for x in [1, 2, 3, 4]:   # fills cache then evicts 1
    square(x)
square(1)                  # recomputed — 1 was evicted
print(square.cache_info()) # hits=3 misses=5 maxsize=3 currsize=3`,
    explanation: "`lru_cache` evicts the least-recently-used entry when the cache is full; `cache_info()` shows hits, misses, and current size for tuning `maxsize`.",
  },
  {
    id: "py-b17-b5-understanding-tricky-truthiness",
    language: "python",
    title: "Tricky truthiness edge cases",
    tag: "understanding",
    code: `print(bool([]))         # False
print(bool([[]]))       # True  — list with one element (even empty)
print(bool(0))          # False
print(bool(0.0))        # False
print(bool(""))         # False
print(bool("0"))        # True  — non-empty string
print(bool(None))       # False`,
    explanation: "An object is falsy if `__bool__` returns `False` or `__len__` returns 0; `[[ ]]` is a list with one element so it's truthy even though that element is empty.",
  },
  {
    id: "py-b17-b5-understanding-bytes-bytearray",
    language: "python",
    title: "bytes is immutable; bytearray is mutable",
    tag: "understanding",
    code: `b = bytes([65, 66, 67])
print(b)   # b'ABC'

ba = bytearray(b)
ba[0] = 90         # 'Z'
print(ba)          # bytearray(b'ZBC')
print(bytes(ba))   # b'ZBC'`,
    explanation: "`bytes` is an immutable sequence of integers 0–255; `bytearray` is its mutable counterpart. Convert between them with `bytes(ba)` / `bytearray(b)` — both are O(n).",
  },
  {
    id: "py-b17-b5-families-concurrent-futures",
    language: "python",
    title: "concurrent.futures.ProcessPoolExecutor",
    tag: "families",
    code: `from concurrent.futures import ProcessPoolExecutor
import math

def heavy(n):
    return math.factorial(n)

with ProcessPoolExecutor() as pool:
    results = list(pool.map(heavy, range(1, 6)))

print(results)  # [1, 2, 6, 24, 120]`,
    explanation: "`ProcessPoolExecutor` distributes work across OS processes, bypassing the GIL for CPU-bound tasks; `pool.map` mirrors the built-in `map` interface.",
  },
  {
    id: "py-b17-b5-families-dataclasses-replace",
    language: "python",
    title: "dataclasses.replace for non-destructive update",
    tag: "families",
    code: `from dataclasses import dataclass, replace

@dataclass(frozen=True)
class Config:
    host: str = "localhost"
    port: int = 8080
    debug: bool = False

prod = Config(host="prod.example.com", port=443)
debug_cfg = replace(prod, debug=True)
print(debug_cfg)  # Config(host='prod.example.com', port=443, debug=True)`,
    explanation: "`dataclasses.replace` returns a shallow copy of the dataclass with specified fields overridden — the record `with` expression equivalent for dataclasses.",
  },
  {
    id: "py-b17-b5-families-enum-auto",
    language: "python",
    title: "enum.auto() for automatic values",
    tag: "families",
    code: `from enum import Enum, auto

class Direction(Enum):
    NORTH = auto()
    SOUTH = auto()
    EAST  = auto()
    WEST  = auto()

print(Direction.NORTH.value)   # 1
print(list(Direction))`,
    explanation: "`enum.auto()` assigns the next integer value automatically; override `_generate_next_value_` to change the scheme (e.g., to use the member name).",
  },
  {
    id: "py-b17-b5-structures-defaultdict-nested",
    language: "python",
    title: "Nested defaultdict for multi-level grouping",
    tag: "structures",
    code: `from collections import defaultdict

# Factory that creates defaultdict(list) for each new key
tree = defaultdict(lambda: defaultdict(list))

records = [("eng","alice",90),("eng","bob",85),("hr","carol",88)]
for dept, name, score in records:
    tree[dept][name].append(score)

print(dict(tree["eng"]))  # {'alice': [90], 'bob': [85]}`,
    explanation: "A `defaultdict` whose factory creates another `defaultdict` produces a two-level tree that auto-initialises both levels on first access.",
  },
  {
    id: "py-b17-b5-structures-queue-lifo",
    language: "python",
    title: "queue.LifoQueue for thread-safe LIFO",
    tag: "structures",
    code: `from queue import LifoQueue
import threading

lq = LifoQueue()
for i in range(5): lq.put(i)

results = []
while not lq.empty():
    results.append(lq.get())
print(results)   # [4, 3, 2, 1, 0]`,
    explanation: "`queue.LifoQueue` is a thread-safe stack; prefer it over `deque` when multiple threads produce and consume items concurrently.",
  },
  {
    id: "py-b17-b5-classes-metaclass-singleton",
    language: "python",
    title: "Singleton via metaclass",
    tag: "classes",
    code: `class SingletonMeta(type):
    _instances: dict = {}

    def __call__(cls, *args, **kwargs):
        if cls not in cls._instances:
            cls._instances[cls] = super().__call__(*args, **kwargs)
        return cls._instances[cls]

class Config(metaclass=SingletonMeta):
    def __init__(self): self.value = 42

a = Config()
b = Config()
print(a is b)   # True`,
    explanation: "Overriding `__call__` in a metaclass intercepts class instantiation, enabling the singleton pattern without modifying the class's own `__new__` or `__init__`.",
  },
  {
    id: "py-b17-b5-classes-descriptor-lazy",
    language: "python",
    title: "Lazy-computed property via descriptor",
    tag: "classes",
    code: `class lazy_property:
    def __set_name__(self, owner, name): self.name = name
    def __get__(self, obj, objtype=None):
        if obj is None: return self
        value = self.func(obj)
        setattr(obj, self.name, value)   # replace descriptor with value
        return value
    def __init__(self, func): self.func = func

class Circle:
    def __init__(self, r): self.r = r
    @lazy_property
    def area(self): return 3.14159 * self.r ** 2

c = Circle(5)
print(c.area)   # computed once
print(c.area)   # served from instance dict`,
    explanation: "A lazy property descriptor computes the value on first access, then stores it directly in the instance `__dict__`, which shadows the descriptor on subsequent accesses.",
  },
  {
    id: "py-b17-b5-classes-mixin",
    language: "python",
    title: "Mixin classes for composable behaviour",
    tag: "classes",
    code: `class JsonMixin:
    def to_json(self):
        import json
        return json.dumps(vars(self))

class LogMixin:
    def log(self):
        print(f"[LOG] {self.__class__.__name__}: {vars(self)}")

class User(JsonMixin, LogMixin):
    def __init__(self, name, age):
        self.name, self.age = name, age

u = User("Alice", 30)
print(u.to_json())  # {"name": "Alice", "age": 30}
u.log()`,
    explanation: "Mixins are classes with specific behaviour but no data of their own; they compose into target classes via multiple inheritance without creating tight coupling.",
  },
  {
    id: "py-b17-b5-classes-dunder-contains",
    language: "python",
    title: "__contains__ for the in operator",
    tag: "classes",
    code: `class Range:
    def __init__(self, lo, hi): self.lo, self.hi = lo, hi
    def __contains__(self, item): return self.lo <= item <= self.hi

r = Range(1, 10)
print(5  in r)   # True
print(15 in r)   # False
print(1  in r)   # True`,
    explanation: "`__contains__` powers the `in` operator; without it Python falls back to iterating with `__iter__`, so implementing `__contains__` gives O(1) membership tests.",
  },
  {
    id: "py-b17-b5-snippet-itertools-dropwhile",
    language: "python",
    title: "itertools.dropwhile and takewhile",
    tag: "snippet",
    code: `import itertools

data = [2, 4, 6, 7, 8, 10]

taken   = list(itertools.takewhile(lambda x: x % 2 == 0, data))
dropped = list(itertools.dropwhile(lambda x: x % 2 == 0, data))

print(taken)    # [2, 4, 6]
print(dropped)  # [7, 8, 10]`,
    explanation: "`takewhile` yields items while the predicate is true and stops at the first false; `dropwhile` skips items while true and yields everything from the first false onward.",
  },
  {
    id: "py-b17-b5-snippet-all-any-generator",
    language: "python",
    title: "Short-circuit evaluation in all() and any()",
    tag: "snippet",
    code: `def check(x):
    print(f"checking {x}")
    return x > 0

data = [1, 2, -3, 4, 5]

result = all(check(x) for x in data)
# checking 1  checking 2  checking -3  — stops here
print(result)  # False`,
    explanation: "`all` stops at the first `False` and `any` stops at the first `True`; generator expressions ensure elements are evaluated lazily, avoiding unnecessary work.",
  },
  {
    id: "py-b17-b5-snippet-exception-from",
    language: "python",
    title: "raise ... from to chain exceptions explicitly",
    tag: "snippet",
    code: `def read_config(path):
    try:
        with open(path) as f:
            return f.read()
    except FileNotFoundError as e:
        raise RuntimeError(f"config missing: {path}") from e

try:
    read_config("missing.cfg")
except RuntimeError as e:
    print(e)
    print("caused by:", e.__cause__)`,
    explanation: "`raise X from Y` sets `X.__cause__ = Y`, preserving the original exception in the chain; `from None` explicitly suppresses the context.",
  },
  {
    id: "py-b17-b5-snippet-pprint-depth",
    language: "python",
    title: "pprint with depth and width control",
    tag: "snippet",
    code: `import pprint

data = {"a": list(range(20)), "b": {"c": list(range(10))}}

pprint.pprint(data, depth=1)
# {'a': [...], 'b': {...}}

pprint.pprint(data, width=40)
# wrapped at 40 chars`,
    explanation: "`pprint.pprint` formats nested structures readably; `depth` limits recursion display and `width` controls line length, both defaulting to unlimited/80.",
  },
  {
    id: "py-b17-b5-snippet-list-multiplication-caveat",
    language: "python",
    title: "List multiplication shares inner references",
    tag: "snippet",
    code: `matrix = [[0] * 3] * 3    # all rows are the SAME list
matrix[0][0] = 9
print(matrix)  # [[9,0,0],[9,0,0],[9,0,0]]  — all rows changed!

# Correct:
matrix2 = [[0] * 3 for _ in range(3)]
matrix2[0][0] = 9
print(matrix2)  # [[9,0,0],[0,0,0],[0,0,0]]`,
    explanation: "`[x] * n` creates n references to the same object; for nested mutable containers use a list comprehension to create independent inner lists.",
  },
  {
    id: "py-b17-b5-snippet-map-filter",
    language: "python",
    title: "map and filter return lazy iterators",
    tag: "snippet",
    code: `data = [1, 2, 3, 4, 5]

doubled = map(lambda x: x * 2, data)    # lazy iterator
evens   = filter(lambda x: x % 2 == 0, data)  # lazy iterator

print(list(doubled))  # [2, 4, 6, 8, 10]
print(list(evens))    # [2, 4]

# Often clearer as comprehensions:
print([x*2 for x in data])
print([x for x in data if x % 2 == 0])`,
    explanation: "`map` and `filter` return lazy iterators; wrap with `list()` to materialise. For most cases list comprehensions are more readable.",
  },
  {
    id: "py-b17-b5-snippet-memoryview-slicing",
    language: "python",
    title: "memoryview for zero-copy slicing",
    tag: "snippet",
    code: `data = bytearray(b"Hello, World!")

view = memoryview(data)
chunk = view[7:12]      # no copy — references original buffer
print(bytes(chunk))     # b'World'

chunk[0] = ord("M")     # mutates original!
print(data)             # bytearray(b'Hello, Morld!')`,
    explanation: "`memoryview` exposes the buffer protocol, allowing slices to be taken and mutated without copying data — critical for performance with large binary buffers.",
  },
  {
    id: "py-b17-b5-snippet-type-narrowing-isinstance",
    language: "python",
    title: "isinstance for type narrowing in type checkers",
    tag: "snippet",
    code: `from typing import Union

def process(value: Union[int, str]) -> str:
    if isinstance(value, int):
        return str(value * 2)   # type checker knows: int here
    return value.upper()        # type checker knows: str here

print(process(5))       # 10
print(process("hi"))    # HI`,
    explanation: "`isinstance` narrows the type inside each branch, giving type checkers precise information to validate attribute access and method calls.",
  },
  {
    id: "py-b17-b5-snippet-vars-builtin",
    language: "python",
    title: "vars() returns the __dict__ of an object",
    tag: "snippet",
    code: `class Config:
    def __init__(self, host, port):
        self.host = host
        self.port = port

cfg = Config("localhost", 8080)
print(vars(cfg))   # {'host': 'localhost', 'port': 8080}

# Useful for dict-style access to instance attributes:
d = vars(cfg)
print(d.get("host"))   # localhost`,
    explanation: "`vars(obj)` returns `obj.__dict__` as a live dict; modifying it modifies the object's attributes, making it useful for dynamic attribute manipulation.",
  },
  {
    id: "py-b17-b5-snippet-fstring-debug",
    language: "python",
    title: "f-string = for debug printing",
    tag: "snippet",
    code: `x = 42
name = "Alice"
result = x * 3

print(f"{x=}")           # x=42
print(f"{name=}")        # name='Alice'
print(f"{result=}")      # result=126
print(f"{x*2+1=}")       # x*2+1=85`,
    explanation: "Adding `=` after the expression in an f-string prints both the expression text and its value — a quick debugging tool without `print('x =', x)` boilerplate.",
  },
  {
    id: "py-b17-b5-snippet-string-maketrans",
    language: "python",
    title: "str.maketrans and translate for bulk substitution",
    tag: "snippet",
    code: `table = str.maketrans(
    "aeiou",   # chars to replace
    "AEIOU",   # replacements
    " ",       # chars to delete
)

text = "hello world"
print(text.translate(table))  # hEllOwOrld`,
    explanation: "`str.maketrans` builds a translation table; `translate` applies it in a single O(n) pass, faster than repeated `replace` calls for many character substitutions.",
  },
  {
    id: "py-b17-b5-snippet-slice-objects",
    language: "python",
    title: "slice objects for reusable slices",
    tag: "snippet",
    code: `data = list(range(20))

ROW1 = slice(0, 5)
ROW2 = slice(5, 10)
EVEN = slice(None, None, 2)

print(data[ROW1])   # [0, 1, 2, 3, 4]
print(data[EVEN])   # [0, 2, 4, 6, 8, 10, 12, 14, 16, 18]`,
    explanation: "`slice(start, stop, step)` creates a reusable slice object that can be stored in variables or constants, making column/row extraction readable in data-processing code.",
  },
  {
    id: "py-b17-b5-snippet-next-default",
    language: "python",
    title: "next() with a default to avoid StopIteration",
    tag: "snippet",
    code: `data = [10, 20, 30, 40]

first_gt25 = next((x for x in data if x > 25), None)
print(first_gt25)   # 30

first_gt100 = next((x for x in data if x > 100), -1)
print(first_gt100)  # -1`,
    explanation: "`next(iter, default)` returns the first element from an iterator or the default if the iterator is exhausted, avoiding a `StopIteration` exception.",
  },
  {
    id: "py-b17-b5-snippet-namedtuple-typed",
    language: "python",
    title: "typing.NamedTuple for typed named tuples",
    tag: "snippet",
    code: `from typing import NamedTuple

class Point(NamedTuple):
    x: float
    y: float
    z: float = 0.0

p = Point(1.0, 2.0)
print(p)             # Point(x=1.0, y=2.0, z=0.0)
print(p._asdict())   # {'x': 1.0, 'y': 2.0, 'z': 0.0}
x, y, z = p         # unpacks like a tuple`,
    explanation: "`typing.NamedTuple` subclass syntax supports type annotations and default values while preserving full tuple compatibility including unpacking and indexing.",
  },
  {
    id: "py-b17-b5-snippet-collections-counter-most-common",
    language: "python",
    title: "Counter.most_common for frequency ranking",
    tag: "snippet",
    code: `from collections import Counter

text = "the quick brown fox jumps over the lazy dog"
words = text.split()

freq = Counter(words)
for word, count in freq.most_common(3):
    print(f"{word}: {count}")
# the: 2  quick: 1  brown: 1  (order varies for ties)`,
    explanation: "`Counter.most_common(n)` returns the n most frequent elements in descending order using a heap internally, making it O(k log n) for the top-n query.",
  },
  {
    id: "py-b17-b5-classes-abstract-classmethod",
    language: "python",
    title: "@abstractmethod with @classmethod",
    tag: "classes",
    code: `from abc import ABC, abstractmethod

class Serializer(ABC):
    @classmethod
    @abstractmethod
    def from_string(cls, s: str) -> "Serializer": ...

    @abstractmethod
    def to_string(self) -> str: ...

class JsonSerializer(Serializer):
    def __init__(self, data): self.data = data
    @classmethod
    def from_string(cls, s): import json; return cls(json.loads(s))
    def to_string(self): import json; return json.dumps(self.data)`,
    explanation: "Stacking `@classmethod` and `@abstractmethod` (classmethod first) forces subclasses to implement named constructors, enforcing factory patterns at the interface level.",
  },
  {
    id: "py-b17-b5-types-new-type",
    language: "python",
    title: "NewType creates distinct type aliases",
    tag: "types",
    code: `from typing import NewType

UserId  = NewType("UserId",  int)
OrderId = NewType("OrderId", int)

def get_user(uid: UserId) -> str:
    return f"user-{uid}"

uid = UserId(42)
oid = OrderId(42)
get_user(uid)   # OK
# get_user(oid) # type error: OrderId != UserId`,
    explanation: "`NewType` creates a distinct type alias so type checkers treat `UserId(42)` and `OrderId(42)` as incompatible, preventing bugs from passing the wrong ID type.",
  },
  {
    id: "py-b17-b5-snippet-breakpoint",
    language: "python",
    title: "breakpoint() for inline debugging",
    tag: "snippet",
    code: `def compute(data):
    total = 0
    for item in data:
        # breakpoint()   # uncomment to drop into pdb here
        total += item
    return total

result = compute([1, 2, 3])
print(result)  # 6`,
    explanation: "`breakpoint()` (Python 3.7+) invokes the debugger set by `PYTHONBREAKPOINT`; it defaults to `pdb.set_trace()` but can be configured to use `ipdb`, `pudb`, etc.",
  },
  {
    id: "py-b17-b5-snippet-format-nested-brace",
    language: "python",
    title: "Nested braces in format strings",
    tag: "snippet",
    code: `width = 10
for name, value in [("pi", 3.14159), ("e", 2.71828)]:
    print(f"{name:>{width}}: {value:.4f}")
#          pi: 3.1416
#           e: 2.7183`,
    explanation: "F-string format specs can reference variables with nested `{}`, allowing dynamic field widths and precisions computed at runtime.",
  },
  {
    id: "py-b17-b5-snippet-any-iterable",
    language: "python",
    title: "any() and all() on empty iterables",
    tag: "snippet",
    code: `print(any([]))    # False — no element is truthy
print(all([]))    # True  — vacuously true (no element is falsy)

# Useful identity:
# all(pred(x) for x in []) is always True
# any(pred(x) for x in []) is always False`,
    explanation: "`all([])` returns `True` (vacuous truth — no counterexample exists); `any([])` returns `False`. Know these edge cases when using them in production logic.",
  },
  {
    id: "py-b17-b5-snippet-typing-cast",
    language: "python",
    title: "typing.cast for type checker hints without runtime cost",
    tag: "snippet",
    code: `from typing import cast

def parse(data: object) -> None:
    if not isinstance(data, dict):
        raise TypeError
    d = cast(dict[str, int], data)  # tells checker: trust me
    print(d["key"] + 1)

parse({"key": 41})  # 42`,
    explanation: "`typing.cast` is a no-op at runtime (returns its second argument unchanged); it only informs the type checker of the intended type, avoiding unsafe ignore comments.",
  },
  {
    id: "py-b17-b5-understanding-reference-counting",
    language: "python",
    title: "CPython uses reference counting for memory",
    tag: "understanding",
    code: `import sys

x = []
print(sys.getrefcount(x))   # 2 (x and the getrefcount argument)

y = x
print(sys.getrefcount(x))   # 3

del y
print(sys.getrefcount(x))   # 2

del x   # ref count hits 0 → immediately freed`,
    explanation: "CPython increments a reference count on each assignment and decrements on `del` or scope exit; the object is freed immediately when the count reaches zero (no GC needed for non-cyclic objects).",
  },
  {
    id: "py-b17-b5-understanding-generator-pipeline",
    language: "python",
    title: "Generator pipelines process streams lazily",
    tag: "understanding",
    code: `def read_lines(path):
    with open(path) as f:
        yield from f

def only_errors(lines):
    return (l for l in lines if "ERROR" in l)

def extract_msg(lines):
    return (l.split("ERROR:", 1)[-1].strip() for l in lines)

# Composing the pipeline: nothing runs until consumed
# msgs = extract_msg(only_errors(read_lines("app.log")))
# for msg in msgs: print(msg)`,
    explanation: "Each generator in the pipeline yields one item at a time; data flows through all stages before the next item is pulled, keeping memory usage constant regardless of file size.",
  },
  {
    id: "py-b17-b5-structures-heap-tasks",
    language: "python",
    title: "Using heapq with task priority and tie-breaking",
    tag: "structures",
    code: `import heapq, itertools

counter = itertools.count()  # unique tie-breaker sequence
queue = []

def push(priority, task):
    heapq.heappush(queue, (priority, next(counter), task))

push(2, "medium")
push(1, "urgent")
push(2, "also medium")

while queue:
    _, _, task = heapq.heappop(queue)
    print(task)
# urgent  medium  also medium`,
    explanation: "Add a unique counter as a secondary sort key to prevent Python from comparing the task object when priorities are equal — tasks may be non-comparable types.",
  },
  {
    id: "py-b17-b5-snippet-textwrap-dedent",
    language: "python",
    title: "textwrap.dedent to strip common indentation",
    tag: "snippet",
    code: `import textwrap

code = """
    def hello():
        print("hi")
    """

print(textwrap.dedent(code).strip())
# def hello():
#     print("hi")`,
    explanation: "`textwrap.dedent` removes the common leading whitespace from all lines, making it easy to define indented multi-line strings in code without affecting the output.",
  },
  {
    id: "py-b17-b5-classes-dunder-enter-return",
    language: "python",
    title: "__enter__ returning self for fluent use",
    tag: "classes",
    code: `class Connection:
    def connect(self): print("connected"); return self
    def query(self, sql): print(f"query: {sql}"); return self
    def __enter__(self): return self.connect()
    def __exit__(self, *args): print("disconnected"); return False

with Connection() as conn:
    conn.query("SELECT 1").query("SELECT 2")`,
    explanation: "Returning `self` from `__enter__` and from methods enables method chaining within a `with` block, common in database connection and test fixture patterns.",
  },
  {
    id: "py-b17-b5-families-shelve",
    language: "python",
    title: "shelve for persistent dict-like object storage",
    tag: "families",
    code: `import shelve, tempfile, os

path = tempfile.mktemp()
with shelve.open(path) as db:
    db["config"] = {"host": "localhost", "port": 8080}
    db["counter"] = 42

with shelve.open(path) as db:
    print(db["config"])    # {'host': 'localhost', 'port': 8080}
    print(db["counter"])   # 42`,
    explanation: "`shelve.open` gives a dict-like interface backed by `dbm`, automatically pickling/unpickling values — suitable for lightweight persistent storage of Python objects.",
  },
  {
    id: "py-b17-b5-understanding-nonlocal-vs-global",
    language: "python",
    title: "nonlocal vs global scope declarations",
    tag: "understanding",
    code: `x = "global"

def outer():
    x = "outer"
    def inner():
        nonlocal x
        x = "inner"
    inner()
    print(x)   # "inner"  — nonlocal modified outer's x

outer()
print(x)   # "global"  — outer's x was a separate variable`,
    explanation: "`nonlocal` modifies the nearest enclosing (non-global) scope; `global` modifies the module-level scope. Neither is needed for reading — only for assignment.",
  },
  {
    id: "py-b17-b5-snippet-walrus-regex",
    language: "python",
    title: "Walrus operator with regex match",
    tag: "snippet",
    code: `import re

lines = ["user: Alice", "info: debug", "user: Bob"]
for line in lines:
    if m := re.match(r"user: (\\w+)", line):
        print(f"Found user: {m.group(1)}")
# Found user: Alice
# Found user: Bob`,
    explanation: "The walrus operator assigns the regex match object in the `if` condition, making the match available in the body without a separate assignment line.",
  },
  {
    id: "py-b17-b5-families-timeit",
    language: "python",
    title: "timeit for micro-benchmarks",
    tag: "families",
    code: `import timeit

# Compare list comprehension vs map
lc_time  = timeit.timeit("[x*2 for x in range(1000)]", number=10_000)
map_time = timeit.timeit("list(map(lambda x: x*2, range(1000)))", number=10_000)

print(f"list comp: {lc_time:.3f}s")
print(f"map:       {map_time:.3f}s")`,
    explanation: "`timeit.timeit` runs a statement many times and returns total elapsed seconds; avoid manual `time.time` loops which suffer from startup noise and vary between runs.",
  },
];
