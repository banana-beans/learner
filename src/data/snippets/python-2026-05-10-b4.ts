import type { Snippet } from "./types";

export const pythonSnippets20260510B4: Snippet[] = [
  // ── snippet ──────────────────────────────────────────────────────────────
  {
    id: "py-asyncio-gather-return",
    language: "python",
    title: "asyncio.gather — concurrent coroutines with results",
    tag: "snippet",
    code: `import asyncio

async def fetch(url: str) -> str:
    await asyncio.sleep(0.1)   # simulate network
    return f"data from {url}"

async def main():
    urls = ["https://a.example", "https://b.example", "https://c.example"]
    results = await asyncio.gather(*[fetch(u) for u in urls])
    for r in results:
        print(r)

asyncio.run(main())`,
    explanation:
      "asyncio.gather runs coroutines concurrently and returns their results in the same order as the input; by default one exception cancels all pending coroutines.",
  },
  {
    id: "py-asyncio-create-task",
    language: "python",
    title: "asyncio.create_task — fire-and-forget background tasks",
    tag: "snippet",
    code: `import asyncio

async def background_job(n: int):
    await asyncio.sleep(n)
    print(f"job {n} done")

async def main():
    t1 = asyncio.create_task(background_job(1))
    t2 = asyncio.create_task(background_job(2))
    print("tasks created")
    await asyncio.gather(t1, t2)   # wait for both
    # or: await t1; await t2

asyncio.run(main())`,
    explanation:
      "create_task schedules a coroutine to run concurrently on the current event loop; unlike gather it returns a Task immediately; always hold a reference to avoid silent GC cancellation.",
  },
  {
    id: "py-asyncio-timeout",
    language: "python",
    title: "asyncio.timeout — deadline for async operations (3.11+)",
    tag: "snippet",
    code: `import asyncio

async def main():
    try:
        async with asyncio.timeout(2.0):
            await asyncio.sleep(5)   # cancelled after 2s
    except asyncio.TimeoutError:
        print("timed out")

    # Pre-3.11 equivalent:
    try:
        await asyncio.wait_for(asyncio.sleep(5), timeout=2.0)
    except asyncio.TimeoutError:
        print("timed out (wait_for)")

asyncio.run(main())`,
    explanation:
      "asyncio.timeout (3.11+) is a context manager that cancels the enclosed code block after the deadline; it is cleaner than wait_for for multi-step async operations that share a deadline.",
  },
  {
    id: "py-contextlib-asynccontextmanager",
    language: "python",
    title: "@asynccontextmanager — async context manager from generator",
    tag: "snippet",
    code: `from contextlib import asynccontextmanager
import asyncio

@asynccontextmanager
async def managed_connection(host: str):
    print(f"connecting to {host}")
    await asyncio.sleep(0.01)     # simulate async open
    try:
        yield f"conn:{host}"
    finally:
        await asyncio.sleep(0.01) # simulate async close
        print(f"closed {host}")

async def main():
    async with managed_connection("db.local") as conn:
        print("using", conn)

asyncio.run(main())`,
    explanation:
      "@asynccontextmanager turns an async generator with one yield into an async context manager; the finally block runs even if an exception occurs inside the with block.",
  },
  {
    id: "py-dataclasses-post-init",
    language: "python",
    title: "dataclasses.__post_init__ and InitVar",
    tag: "snippet",
    code: `from dataclasses import dataclass, field, InitVar

@dataclass
class Rectangle:
    width:  float
    height: float
    scale:  InitVar[float] = 1.0   # passed to __post_init__, not stored
    area:   float = field(init=False)

    def __post_init__(self, scale: float):
        self.width  *= scale
        self.height *= scale
        self.area    = self.width * self.height

r = Rectangle(4.0, 5.0, scale=2.0)
print(r.width, r.height, r.area)  # 8.0 10.0 80.0`,
    explanation:
      "__post_init__ runs after generated __init__; InitVar fields are passed as arguments to __post_init__ but not stored as instance attributes — useful for temporary construction inputs.",
  },
  {
    id: "py-dataclasses-kw-only",
    language: "python",
    title: "dataclasses kw_only and field KW_ONLY sentinel",
    tag: "snippet",
    code: `from dataclasses import dataclass, field, KW_ONLY

@dataclass
class Config:
    name: str
    _:    KW_ONLY           # everything after is keyword-only
    host: str = "localhost"
    port: int = 8080
    debug: bool = False

# Must use keyword syntax:
cfg = Config("MyApp", host="prod.example.com", port=443)
print(cfg.name, cfg.host, cfg.port)`,
    explanation:
      "KW_ONLY sentinel (Python 3.10+) marks all subsequent fields as keyword-only; @dataclass(kw_only=True) does this globally — both prevent accidental positional argument ordering errors.",
  },
  {
    id: "py-typing-named-tuple",
    language: "python",
    title: "typing.NamedTuple — typed, class-based namedtuple",
    tag: "snippet",
    code: `from typing import NamedTuple

class Point(NamedTuple):
    x: float
    y: float
    label: str = ""     # default value

p = Point(1.0, 2.0, label="A")
print(p.x, p[0])     # 1.0 1.0 — both attribute and index access
print(p._asdict())   # {'x': 1.0, 'y': 2.0, 'label': 'A'}

x, y, _ = p          # unpacking
q = p._replace(x=3.0)  # new instance with changed field`,
    explanation:
      "NamedTuple subclasses support type annotations, default values, and class methods while remaining tuples — immutable, iterable, and usable anywhere a tuple is expected.",
  },
  {
    id: "py-pprint",
    language: "python",
    title: "pprint — pretty-print complex data structures",
    tag: "snippet",
    code: `from pprint import pprint, pformat

data = {
    "users": [{"name": "Alice", "roles": ["admin", "editor"]},
              {"name": "Bob",   "roles": ["viewer"]}],
    "config": {"timeout": 30, "retries": 3}
}

pprint(data, width=50, sort_dicts=False)

# Get formatted string:
s = pformat(data, indent=2)
print(s)`,
    explanation:
      "pprint inserts line breaks and indentation so deeply nested structures are readable; sort_dicts=False (3.8+) preserves insertion order; pformat returns the string for logging.",
  },
  {
    id: "py-struct-network",
    language: "python",
    title: "struct — pack binary network protocol headers",
    tag: "snippet",
    code: `import struct

# Big-endian: 2-byte magic, 4-byte length, 1-byte flags
HEADER_FORMAT = ">HI B"
HEADER_SIZE   = struct.calcsize(HEADER_FORMAT)  # 7 bytes

def make_packet(payload: bytes, flags: int = 0) -> bytes:
    header = struct.pack(HEADER_FORMAT, 0xCAFE, len(payload), flags)
    return header + payload

def parse_packet(data: bytes):
    magic, length, flags = struct.unpack_from(HEADER_FORMAT, data)
    payload = data[HEADER_SIZE: HEADER_SIZE + length]
    return magic, flags, payload

pkt = make_packet(b"hello", flags=1)
print(parse_packet(pkt))  # (51966, 1, b'hello')`,
    explanation:
      "struct.pack/unpack with format strings encodes/decodes C-style binary data; '>' means big-endian, 'H' uint16, 'I' uint32, 'B' uint8; calcsize computes the header offset.",
  },
  {
    id: "py-hashlib",
    language: "python",
    title: "hashlib — cryptographic hashing",
    tag: "snippet",
    code: `import hashlib

# SHA-256 digest
h = hashlib.sha256(b"hello world").hexdigest()
print(h)   # b94d27b9...

# Streaming large file:
sha = hashlib.sha256()
with open("large.bin", "rb") as f:
    for chunk in iter(lambda: f.read(65536), b""):
        sha.update(chunk)
print(sha.hexdigest())

# BLAKE2 — fast, secure, no length-extension:
print(hashlib.blake2b(b"data", key=b"secret").hexdigest())`,
    explanation:
      "Always stream large files through update() rather than reading all at once; BLAKE2b is faster than SHA-2 and avoids length-extension attacks without HMAC wrapping.",
  },

  // ── understanding ─────────────────────────────────────────────────────────
  {
    id: "py-understand-asyncio-event-loop",
    language: "python",
    title: "asyncio event loop — single-threaded concurrency model",
    tag: "understanding",
    code: `import asyncio

async def task_a():
    print("A start")
    await asyncio.sleep(0)  # yield control to event loop
    print("A end")

async def task_b():
    print("B start")
    await asyncio.sleep(0)
    print("B end")

async def main():
    await asyncio.gather(task_a(), task_b())

asyncio.run(main())
# A start, B start, A end, B end  — interleaved at await points`,
    explanation:
      "The asyncio event loop is single-threaded; coroutines run one at a time and only switch at await points; CPU-bound work blocks the entire loop — offload it with run_in_executor.",
  },
  {
    id: "py-understand-gil",
    language: "python",
    title: "Global Interpreter Lock (GIL) and when it matters",
    tag: "understanding",
    code: `# GIL allows only one Python thread to execute bytecode at a time

# Threading helps I/O-bound work (GIL released during blocking I/O):
import threading
threads = [threading.Thread(target=download, args=(url,)) for url in urls]

# Threading does NOT speed up CPU-bound work:
# Both threads fight for the GIL, often slower than single-thread!

# For CPU-bound parallelism, use multiprocessing (separate processes, no GIL):
from multiprocessing import Pool
with Pool() as p:
    results = p.map(cpu_heavy, data)

# Python 3.13 introduces per-interpreter GIL (free-threading opt-in)`,
    explanation:
      "The GIL prevents true thread-level parallelism for CPU-bound Python code; use multiprocessing or C extensions that release the GIL (NumPy, IO syscalls) for true parallelism.",
  },
  {
    id: "py-understand-descriptor-priority",
    language: "python",
    title: "Attribute lookup order — MRO, data descriptor, instance dict",
    tag: "understanding",
    code: `# Python attribute lookup order:
# 1. Data descriptors from type (class and bases) — __get__ + __set__
# 2. Instance __dict__
# 3. Non-data descriptors and other class attributes — only __get__

class DataDescriptor:
    def __get__(self, obj, t): return "DATA"
    def __set__(self, obj, v): pass   # makes it a data descriptor

class NonData:
    def __get__(self, obj, t): return "NONDATA"

class C:
    dd = DataDescriptor()
    nd = NonData()

o = C()
o.__dict__["dd"] = "INSTANCE"   # data descriptor wins anyway
o.__dict__["nd"] = "INSTANCE"   # instance wins over non-data
print(o.dd)   # DATA     — data descriptor trumps instance dict
print(o.nd)   # INSTANCE — instance dict trumps non-data descriptor`,
    explanation:
      "Data descriptors (defining both __get__ and __set__) shadow instance variables; non-data descriptors (only __get__) are shadowed by instance variables — this distinction drives property behaviour.",
  },
  {
    id: "py-understand-generator-send",
    language: "python",
    title: "generator.send() — two-way communication",
    tag: "understanding",
    code: `def accumulator():
    total = 0
    while True:
        value = yield total    # yield current total, receive next value
        if value is None:
            break
        total += value

gen = accumulator()
next(gen)          # advance to first yield (required)
gen.send(10)       # total = 10
gen.send(20)       # total = 30
result = gen.send(5)  # total = 35
print(result)      # 35`,
    explanation:
      "send(value) resumes the generator and makes value the result of the yield expression; next(gen) is equivalent to gen.send(None); the first send must be None or use next() to prime the generator.",
  },
  {
    id: "py-understand-async-gen",
    language: "python",
    title: "Async generators — yield inside async def",
    tag: "understanding",
    code: `import asyncio

async def paginated_fetch(url: str):
    page = 1
    while True:
        await asyncio.sleep(0.01)           # simulate async fetch
        data = [f"{url}/item-{i}" for i in range((page-1)*3, page*3)]
        if not data: return
        for item in data:
            yield item
        page += 1
        if page > 3: return

async def main():
    async for item in paginated_fetch("https://api.example.com"):
        print(item)

asyncio.run(main())`,
    explanation:
      "An async generator (async def + yield) produces values asynchronously and is consumed with async for; it cannot use return with a value or yield from — use async for delegation instead.",
  },

  // ── structures ────────────────────────────────────────────────────────────
  {
    id: "py-heapq-push-pop",
    language: "python",
    title: "heapq — min-heap with push and pop",
    tag: "structures",
    code: `import heapq

heap: list[int] = []
heapq.heappush(heap, 5)
heapq.heappush(heap, 1)
heapq.heappush(heap, 3)

print(heap[0])              # 1 — smallest always at index 0
print(heapq.heappop(heap))  # 1
print(heapq.heappop(heap))  # 3

# Build heap in-place from list (O(n)):
data = [9, 4, 7, 2, 6]
heapq.heapify(data)
print(heapq.nsmallest(2, data))  # [2, 4]`,
    explanation:
      "Python's heapq is a min-heap; heappush/heappop maintain the heap invariant in O(log n); heapify converts a list in-place in O(n); nlargest/nsmallest use a partial sort — faster than full sort for small k.",
  },
  {
    id: "py-weakref-dict",
    language: "python",
    title: "weakref.WeakValueDictionary — automatic cache eviction",
    tag: "structures",
    code: `import weakref

class Resource:
    def __init__(self, name): self.name = name
    def __repr__(self): return f"Resource({self.name!r})"

cache: weakref.WeakValueDictionary[str, Resource] = weakref.WeakValueDictionary()

r1 = Resource("db-connection")
cache["db"] = r1
print(cache.get("db"))   # Resource('db-connection')

del r1                   # no other strong references
import gc; gc.collect()  # ensure collection
print(cache.get("db"))   # None — automatically evicted`,
    explanation:
      "WeakValueDictionary holds weak references to values; when the only remaining reference is the weak one (e.g., after del), the entry is automatically removed by the GC — perfect for object caches.",
  },
  {
    id: "py-enum-int-flag",
    language: "python",
    title: "enum.IntFlag — bit field permissions",
    tag: "structures",
    code: `from enum import IntFlag, auto

class Permission(IntFlag):
    READ    = auto()   # 1
    WRITE   = auto()   # 2
    EXECUTE = auto()   # 4
    ALL     = READ | WRITE | EXECUTE

p = Permission.READ | Permission.WRITE
print(p)               # Permission.READ|WRITE
print(Permission.READ in p)   # True
print(Permission.EXECUTE in p)  # False

# Integer compatibility:
mask = int(Permission.ALL)   # 7
restricted = Permission(mask & ~int(Permission.EXECUTE))
print(restricted)  # Permission.READ|WRITE`,
    explanation:
      "IntFlag members are ints so they interoperate with C bitmasks; auto() assigns successive powers of 2; combined values are named if they match a defined constant, otherwise shown as a combination.",
  },
  {
    id: "py-collections-counter",
    language: "python",
    title: "collections.Counter — multiset operations",
    tag: "structures",
    code: `from collections import Counter

words = "the quick brown fox jumps over the lazy dog the".split()
c = Counter(words)
print(c.most_common(3))   # [('the', 3), ('quick', 1), ('brown', 1)]

# Arithmetic:
c2 = Counter(["the", "fox"])
print(c + c2)   # adds counts
print(c - c2)   # subtracts, floors at 0
print(c & c2)   # intersection (min counts)
print(c | c2)   # union (max counts)`,
    explanation:
      "Counter is a dict subclass that maps elements to counts; arithmetic operators produce new Counters; subtraction drops zero and negative counts; most_common(n) uses a heap for efficiency.",
  },
  {
    id: "py-functools-reduce",
    language: "python",
    title: "functools.reduce — fold a sequence",
    tag: "structures",
    code: `from functools import reduce
import operator

# Product of all elements
product = reduce(operator.mul, [1, 2, 3, 4, 5])
print(product)  # 120

# Deep dict merge
dicts = [{"a": 1}, {"b": 2}, {"c": 3}]
merged = reduce(lambda acc, d: {**acc, **d}, dicts)
print(merged)  # {'a': 1, 'b': 2, 'c': 3}

# With initial value
total = reduce(lambda acc, x: acc + x, [1, 2, 3], 100)
print(total)  # 106`,
    explanation:
      "reduce applies a binary function cumulatively left-to-right; the optional initial value is used as the starting accumulator and is returned for empty sequences (avoiding ValueError).",
  },

  // ── caveats ───────────────────────────────────────────────────────────────
  {
    id: "py-caveat-class-method-inheritance",
    language: "python",
    title: "@classmethod — cls is the actual calling class",
    tag: "caveats",
    code: `class Animal:
    @classmethod
    def create(cls):
        return cls()    # creates an instance of the ACTUAL class

class Dog(Animal):
    pass

a = Animal.create()
d = Dog.create()
print(type(a))   # <class 'Animal'>
print(type(d))   # <class 'Dog'>  — not Animal!`,
    explanation:
      "@classmethod receives the actual class (not the defining class) as cls; this means Dog.create() returns a Dog, not an Animal — use this pattern for factories that should be polymorphic.",
  },
  {
    id: "py-caveat-deep-copy-recursion",
    language: "python",
    title: "copy.deepcopy and circular references",
    tag: "caveats",
    code: `import copy

a = [1, 2, 3]
a.append(a)       # circular reference!

# copy.deepcopy handles circular refs with a memo dict:
b = copy.deepcopy(a)
print(b[3] is b)  # True — the copy's self-ref is also circular

# Manual deepcopy without memo will recurse infinitely:
def bad_deepcopy(obj):
    if isinstance(obj, list):
        return [bad_deepcopy(x) for x in obj]  # RecursionError on circular list
    return obj`,
    explanation:
      "copy.deepcopy tracks already-copied objects in a memo dict to handle circular references; if you implement __deepcopy__, accept and pass memo to all recursive deepcopy calls.",
  },
  {
    id: "py-caveat-super-mro-order",
    language: "python",
    title: "super() without arguments in Python 3",
    tag: "caveats",
    code: `class A:
    def greet(self): return "A"

class B(A):
    def greet(self):
        return "B+" + super().greet()   # super() works without args in Py3

# In Python 2 you had to write: super(B, self).greet()
# super() uses __class__ cell — it breaks if you rename the class variable:

class C(A):
    def greet(self):
        __class__ = "oops"      # shadows the implicit __class__ cell!
        return super().greet()  # TypeError at runtime`,
    explanation:
      "Python 3's super() implicitly uses a __class__ cell injected by the compiler; manually assigning __class__ inside the method shadows the cell and breaks super() — avoid that variable name.",
  },
  {
    id: "py-caveat-import-star",
    language: "python",
    title: "from module import * — namespace pollution",
    tag: "caveats",
    code: `# AVOID — imports every public name, may shadow existing names
from os.path import *
from math import *   # 'log' now refers to math.log

# If the module defines __all__, only those names are imported:
# __all__ = ["log", "sqrt"]

# Instead, be explicit:
from math import log, sqrt
import os.path

# Star import is acceptable in interactive sessions and __init__.py re-exports`,
    explanation:
      "import * pollutes the namespace with potentially hundreds of names; it makes it impossible to tell where a name came from and can silently shadow earlier imports — always import explicitly.",
  },
  {
    id: "py-caveat-unpicklable-lambda",
    language: "python",
    title: "Lambdas and local functions are not picklable",
    tag: "caveats",
    code: `import pickle

# Module-level function — picklable:
def square(x): return x * x
pickle.dumps(square)   # OK

# Lambda — not picklable:
fn = lambda x: x * x
# pickle.dumps(fn)    # AttributeError: Can't pickle local object '<lambda>'

# Use functools.partial or module-level functions for multiprocessing:
from functools import partial
double = partial(lambda x, n: x * n, n=2)  # still not picklable!
`,
    explanation:
      "pickle serialises functions by module path and name; lambdas and nested functions have no importable name so they cannot be pickled — use top-level or class-level functions for multiprocessing.",
  },
  {
    id: "py-caveat-thread-safety-list",
    language: "python",
    title: "list.append is thread-safe, list += is not",
    tag: "caveats",
    code: `import threading

shared = []

def safe():
    for _ in range(1000):
        shared.append(1)    # single GIL-atomic bytecode — safe

def unsafe():
    global shared
    for _ in range(1000):
        shared = shared + [1]   # read, create new list, rebind — NOT atomic!

# Even dict[key] = value is atomic; del dict[key] is atomic
# But: x = x + 1 is NOT — it's LOAD + ADD + STORE (3 operations)`,
    explanation:
      "CPython's GIL makes single bytecode operations atomic; list.append is one CALL bytecode so it's safe, but augmented assignment (x += y) is multiple bytecodes and can race between threads.",
  },

  // ── types ─────────────────────────────────────────────────────────────────
  {
    id: "py-type-runtime-checkable",
    language: "python",
    title: "@runtime_checkable Protocol — isinstance checks",
    tag: "types",
    code: `from typing import Protocol, runtime_checkable

@runtime_checkable
class Drawable(Protocol):
    def draw(self) -> None: ...
    def resize(self, factor: float) -> None: ...

class Circle:
    def draw(self)        -> None: pass
    def resize(self, f)  -> None: pass

class Square:
    def draw(self) -> None: pass
    # missing resize

print(isinstance(Circle(), Drawable))  # True
print(isinstance(Square(), Drawable))  # False — missing resize`,
    explanation:
      "@runtime_checkable makes isinstance work by checking for method presence (not signatures); it only checks that the names exist, so a method with the wrong signature still passes.",
  },
  {
    id: "py-type-self-type",
    language: "python",
    title: "Self type — fluent interface return type",
    tag: "types",
    code: `from typing import Self

class Builder:
    def __init__(self): self._parts: list = []

    def add(self, part: str) -> Self:   # Self refers to the actual subclass
        self._parts.append(part)
        return self

    def build(self) -> str:
        return ", ".join(self._parts)

class ExtendedBuilder(Builder):
    def add_default(self) -> Self:
        return self.add("default")

# Type checker knows add() returns ExtendedBuilder, not just Builder:
result = ExtendedBuilder().add("x").add_default().build()`,
    explanation:
      "Self (PEP 673) annotates methods that return the current instance; without it, a subclass method typed as returning Builder loses type information about the concrete subclass.",
  },
  {
    id: "py-type-final-class",
    language: "python",
    title: "@final on class — prevent subclassing",
    tag: "types",
    code: `from typing import final

@final
class SSLCertificate:
    """Cannot be subclassed — invariants must not be overridden."""
    def __init__(self, pem: bytes):
        self._pem = pem

    def fingerprint(self) -> str:
        import hashlib
        return hashlib.sha256(self._pem).hexdigest()

# Type checkers report an error if anyone subclasses SSLCertificate
# Runtime: no enforcement (need ABCMeta or __init_subclass__ for that)`,
    explanation:
      "@final signals to type checkers that subclassing is not allowed; it does not enforce this at runtime — pair with __init_subclass__ raising TypeError for runtime enforcement.",
  },
  {
    id: "py-type-class-var",
    language: "python",
    title: "ClassVar — mark class-level variables in type hints",
    tag: "types",
    code: `from typing import ClassVar
from dataclasses import dataclass

@dataclass
class Counter:
    # ClassVar — not included in __init__, shared across all instances
    count: ClassVar[int] = 0
    name: str

    def __post_init__(self):
        Counter.count += 1

a = Counter("a")
b = Counter("b")
print(Counter.count)   # 2
print(a.count)         # 2 — same class variable
# a.count = 99 would shadow the class variable on instance 'a'`,
    explanation:
      "ClassVar tells type checkers (and dataclasses) that a variable is class-level, not per-instance; dataclasses exclude ClassVar fields from the generated __init__ parameters.",
  },

  // ── families ──────────────────────────────────────────────────────────────
  {
    id: "py-family-async-patterns",
    language: "python",
    title: "Async patterns — gather vs TaskGroup vs as_completed",
    tag: "families",
    code: `import asyncio

# gather — all at once, first error cancels rest (return_exceptions=False)
results = await asyncio.gather(f(), g(), h())

# TaskGroup (3.11+) — structured concurrency, all errors collected
async with asyncio.TaskGroup() as tg:
    t1 = tg.create_task(f())
    t2 = tg.create_task(g())
# both done here; ExceptionGroup raised if any failed

# as_completed — process results as each one finishes
for coro in asyncio.as_completed([f(), g(), h()]):
    result = await coro
    process(result)`,
    explanation:
      "Use gather for simple concurrency; TaskGroup (3.11+) for structured concurrency with proper nursery semantics; as_completed when results should be processed as they arrive.",
  },
  {
    id: "py-family-serialisation",
    language: "python",
    title: "Serialisation: json vs dataclasses vs pydantic vs attrs",
    tag: "families",
    code: `# json — stdlib, dict-based, no type safety
import json; data = json.loads('{"name":"Alice","age":30}')

# dataclasses + dacite/cattrs — simple + manual conversion
from dataclasses import dataclass
@dataclass; class User: name: str; age: int

# pydantic — validation, coercion, JSON schema
from pydantic import BaseModel
class UserModel(BaseModel): name: str; age: int
u = UserModel(name="Alice", age="30")  # coerces "30" → 30

# attrs — lightweight, fast, no pydantic overhead
import attr
@attr.s; class UserAttrs: name = attr.ib(); age = attr.ib(converter=int)`,
    explanation:
      "json for simple cases; dataclasses for pure structure; pydantic when you need coercion and validation; attrs when you need dataclass-like features with more control over slots and validators.",
  },
  {
    id: "py-family-context-managers",
    language: "python",
    title: "Context manager protocols — class vs generator vs nullcontext",
    tag: "families",
    code: `from contextlib import contextmanager, nullcontext

# 1. Class with __enter__ / __exit__
class Timer:
    def __enter__(self): import time; self._t = time.time(); return self
    def __exit__(self, *_): print(time.time() - self._t)

# 2. Generator with @contextmanager
@contextmanager
def timer():
    import time; t = time.time()
    yield
    print(time.time() - t)

# 3. nullcontext — optional context manager
def process(file=None):
    ctx = open(file) if file else nullcontext()
    with ctx as f:
        return f.read() if f else "no file"`,
    explanation:
      "Class-based context managers suit stateful objects; @contextmanager is cleaner for simple setup/teardown; nullcontext is a no-op placeholder when a context manager is optional.",
  },
  {
    id: "py-family-concurrency-patterns",
    language: "python",
    title: "Concurrency: threading vs multiprocessing vs asyncio",
    tag: "families",
    code: `# threading — I/O-bound, shared memory, GIL limits CPU parallelism
from threading import Thread
Thread(target=download, args=(url,)).start()

# multiprocessing — CPU-bound, separate processes, no shared memory by default
from multiprocessing import Process
Process(target=compute, args=(data,)).start()

# asyncio — I/O-bound, single thread, cooperative multitasking
import asyncio
await asyncio.gather(fetch(u1), fetch(u2))

# concurrent.futures — unified API for both thread and process pools
from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor`,
    explanation:
      "asyncio for high-concurrency I/O (thousands of connections); threading for simpler I/O with shared state; multiprocessing for CPU-bound work; concurrent.futures for a uniform future-based API over both.",
  },
  {
    id: "py-family-error-handling",
    language: "python",
    title: "Error handling strategies — exceptions vs result types",
    tag: "families",
    code: `# Exceptions — EAFP (easier to ask forgiveness than permission)
try:
    value = d[key]
except KeyError:
    value = default

# Result type — explicit error in return value
from typing import Union
def parse_int(s: str) -> Union[int, ValueError]:
    try: return int(s)
    except ValueError as e: return e

# Optional — None for "not found" (no error info)
def find(key: str) -> str | None:
    return d.get(key)

# Assertions — programmer errors only, disabled with -O
assert isinstance(x, int), f"Expected int, got {type(x)}"`,
    explanation:
      "Use exceptions for unexpected errors; return None/Optional for expected absence; return Result for operations that commonly fail and callers need the error detail; never use exceptions for flow control.",
  },

  // ── classes ───────────────────────────────────────────────────────────────
  {
    id: "py-class-metaclass-registry",
    language: "python",
    title: "Metaclass plugin registry",
    tag: "classes",
    code: `class PluginMeta(type):
    registry: dict[str, type] = {}

    def __new__(mcs, name, bases, namespace):
        cls = super().__new__(mcs, name, bases, namespace)
        if bases:   # skip the base class itself
            key = namespace.get("plugin_name", name.lower())
            mcs.registry[key] = cls
        return cls

class Plugin(metaclass=PluginMeta):
    plugin_name: str = ""

class JsonPlugin(Plugin):
    plugin_name = "json"
    def process(self): return "JSON"

class XmlPlugin(Plugin):
    plugin_name = "xml"
    def process(self): return "XML"

plugin = PluginMeta.registry["json"]()
print(plugin.process())  # JSON`,
    explanation:
      "The metaclass __new__ runs when each class body is executed; using it to populate a registry automates plugin discovery without explicit registration calls in application code.",
  },
  {
    id: "py-class-event-emitter",
    language: "python",
    title: "Event emitter / observable pattern",
    tag: "classes",
    code: `from typing import Callable, Any
from collections import defaultdict

class EventEmitter:
    def __init__(self):
        self._handlers: dict[str, list[Callable]] = defaultdict(list)

    def on(self, event: str, fn: Callable) -> None:
        self._handlers[event].append(fn)

    def off(self, event: str, fn: Callable) -> None:
        self._handlers[event].remove(fn)

    def emit(self, event: str, *args: Any) -> None:
        for fn in list(self._handlers[event]):
            fn(*args)

bus = EventEmitter()
bus.on("data", lambda x: print("received:", x))
bus.emit("data", 42)   # received: 42`,
    explanation:
      "Using list() in emit prevents mutation of the handler list if a handler calls off() during iteration; defaultdict(list) avoids KeyError on first subscribe.",
  },
  {
    id: "py-class-command-pattern",
    language: "python",
    title: "Command pattern — undo / redo stack",
    tag: "classes",
    code: `from abc import ABC, abstractmethod

class Command(ABC):
    @abstractmethod
    def execute(self): ...
    @abstractmethod
    def undo(self): ...

class AddTextCommand(Command):
    def __init__(self, doc: list, text: str):
        self.doc = doc; self.text = text
    def execute(self): self.doc.append(self.text)
    def undo(self):    self.doc.pop()

class Editor:
    def __init__(self):
        self.doc: list[str] = []
        self._history: list[Command] = []

    def do(self, cmd: Command):
        cmd.execute(); self._history.append(cmd)

    def undo(self):
        if self._history:
            self._history.pop().undo()

ed = Editor()
ed.do(AddTextCommand(ed.doc, "Hello"))
ed.do(AddTextCommand(ed.doc, "World"))
ed.undo()
print(ed.doc)  # ['Hello']`,
    explanation:
      "The Command pattern encapsulates operations as objects with execute/undo pairs; storing them in a history list enables unlimited undo/redo without the invoker knowing operation details.",
  },
  {
    id: "py-class-proxy",
    language: "python",
    title: "Proxy pattern — lazy loading and access control",
    tag: "classes",
    code: `from typing import Optional

class ExpensiveResource:
    def __init__(self): print("loading resource...")
    def compute(self) -> int: return 42

class LazyProxy:
    def __init__(self):
        self._resource: Optional[ExpensiveResource] = None

    def _get(self) -> ExpensiveResource:
        if self._resource is None:
            self._resource = ExpensiveResource()
        return self._resource

    def compute(self) -> int:
        return self._get().compute()

proxy = LazyProxy()          # no loading yet
print(proxy.compute())       # "loading resource..." then 42
print(proxy.compute())       # 42 (already loaded)`,
    explanation:
      "The proxy defers construction of expensive objects until first use; callers use the proxy with the same interface as the real object — no change at the call site.",
  },
  {
    id: "py-class-composite",
    language: "python",
    title: "Composite pattern — tree of uniform components",
    tag: "classes",
    code: `from abc import ABC, abstractmethod

class Component(ABC):
    @abstractmethod
    def size(self) -> int: ...

class File(Component):
    def __init__(self, name: str, size: int):
        self.name = name; self._size = size
    def size(self) -> int: return self._size

class Directory(Component):
    def __init__(self, name: str):
        self.name = name; self.children: list[Component] = []
    def add(self, c: Component): self.children.append(c)
    def size(self) -> int: return sum(c.size() for c in self.children)

root = Directory("root")
root.add(File("a.txt", 100))
sub = Directory("sub"); sub.add(File("b.txt", 200)); root.add(sub)
print(root.size())  # 300`,
    explanation:
      "Composite lets clients treat individual objects (File) and compositions (Directory) uniformly through the Component interface; the recursive size() implementation traverses the tree naturally.",
  },
  {
    id: "py-class-flyweight",
    language: "python",
    title: "Flyweight pattern — share immutable state",
    tag: "classes",
    code: `class CharStyle:
    _pool: dict = {}

    def __new__(cls, font: str, size: int):
        key = (font, size)
        if key not in cls._pool:
            obj = super().__new__(cls)
            obj.font = font; obj.size = size
            cls._pool[key] = obj
        return cls._pool[key]

# Same font+size → same object
s1 = CharStyle("Arial", 12)
s2 = CharStyle("Arial", 12)
s3 = CharStyle("Times", 10)
print(s1 is s2)  # True  — shared
print(s1 is s3)  # False — different`,
    explanation:
      "Flyweight reduces memory by sharing instances with identical intrinsic state (font, size); extrinsic state (position, content) lives in the client and is passed at use time.",
  },
  {
    id: "py-class-visitor",
    language: "python",
    title: "Visitor pattern — double dispatch with singledispatch",
    tag: "classes",
    code: `from functools import singledispatch
from dataclasses import dataclass

@dataclass
class Circle:   radius: float
@dataclass
class Square:   side: float
@dataclass
class Triangle: base: float; height: float

@singledispatch
def area(shape) -> float:
    raise NotImplementedError(f"No area for {type(shape)}")

@area.register
def _(s: Circle)   -> float: return 3.14159 * s.radius ** 2
@area.register
def _(s: Square)   -> float: return s.side ** 2
@area.register
def _(s: Triangle) -> float: return 0.5 * s.base * s.height

shapes = [Circle(3), Square(4), Triangle(5, 6)]
print([area(s) for s in shapes])`,
    explanation:
      "@singledispatch implements single dispatch visitor in Python; type-specific handlers are registered via @area.register and selected at runtime based on the first argument's type.",
  },
  {
    id: "py-class-abstract-factory",
    language: "python",
    title: "Abstract factory — families of related objects",
    tag: "classes",
    code: `from abc import ABC, abstractmethod

class Button(ABC):
    @abstractmethod
    def render(self) -> str: ...

class Checkbox(ABC):
    @abstractmethod
    def render(self) -> str: ...

class MacFactory(ABC):
    @abstractmethod
    def make_button(self) -> Button: ...
    @abstractmethod
    def make_checkbox(self) -> Checkbox: ...

class MacButton(Button):   def render(self): return "[Mac Button]"
class MacCheckbox(Checkbox): def render(self): return "[Mac ☑]"

class MacUI(MacFactory):
    def make_button(self):   return MacButton()
    def make_checkbox(self): return MacCheckbox()

factory = MacUI()
print(factory.make_button().render())
print(factory.make_checkbox().render())`,
    explanation:
      "Abstract factory ensures that related objects (Button + Checkbox) come from the same family (Mac, Windows); the factory interface is the only coupling between client code and concrete products.",
  },

  // ── more snippet ────────────────────────────────────────────────────────────
  {
    id: "py-hmac",
    language: "python",
    title: "hmac — keyed-hash message authentication",
    tag: "snippet",
    code: `import hmac, hashlib, secrets

key = secrets.token_bytes(32)
message = b"order:42:amount:99.99"

# Sign
mac = hmac.new(key, message, hashlib.sha256).hexdigest()

# Verify — constant-time comparison prevents timing attacks
def verify(key: bytes, message: bytes, received_mac: str) -> bool:
    expected = hmac.new(key, message, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, received_mac)

print(verify(key, message, mac))   # True`,
    explanation:
      "HMAC combines a secret key with a hash to authenticate messages; always use hmac.compare_digest for verification — string == comparison is vulnerable to timing attacks.",
  },
  {
    id: "py-pathlib-stat",
    language: "python",
    title: "pathlib.Path — stat, chmod, and file metadata",
    tag: "snippet",
    code: `from pathlib import Path
import stat

p = Path("example.txt")
p.write_text("hello")

info = p.stat()
print(info.st_size)    # bytes
print(info.st_mtime)   # modification timestamp (float)

# chmod — add owner execute bit
current = stat.S_IMODE(info.st_mode)
p.chmod(current | stat.S_IXUSR)

# Check file type:
print(p.is_file())   # True
print(p.is_dir())    # False
print(p.is_symlink())`,
    explanation:
      "Path.stat() returns an os.stat_result with size, timestamps, and mode; chmod takes an integer mode — use stat constants (S_IXUSR etc.) for readability when modifying permissions.",
  },
  {
    id: "py-sys-argv",
    language: "python",
    title: "sys.argv — raw command-line access",
    tag: "snippet",
    code: `import sys

# sys.argv[0] is the script name; argv[1:] are the arguments
if len(sys.argv) < 2:
    print(f"Usage: {sys.argv[0]} <filename>", file=sys.stderr)
    sys.exit(1)

filename = sys.argv[1]
print(f"Processing: {filename}")

# Redirect stdout to a file:
with open("out.txt", "w") as f:
    sys.stdout = f
    print("this goes to the file")
sys.stdout = sys.__stdout__   # restore`,
    explanation:
      "sys.argv provides raw argument access; use argparse for anything beyond trivial scripts; sys.exit(1) signals failure to the calling shell; sys.__stdout__ is the original stdout before any redirection.",
  },

  // ── more understanding ─────────────────────────────────────────────────────────────
  {
    id: "py-understand-slots-dict",
    language: "python",
    title: "__slots__ — memory savings and access speed",
    tag: "understanding",
    code: `import sys

class WithDict:
    def __init__(self, x, y): self.x = x; self.y = y

class WithSlots:
    __slots__ = ("x", "y")
    def __init__(self, x, y): self.x = x; self.y = y

d = WithDict(1, 2)
s = WithSlots(1, 2)
print(sys.getsizeof(d.__dict__))   # ~232 bytes
# s has no __dict__ — attribute storage is a C array
print(hasattr(s, "__dict__"))      # False

# Can't add new attributes to slotted classes:
# s.z = 3  # AttributeError`,
    explanation:
      "__slots__ replaces per-instance __dict__ with a compact C-level array; each instance saves ~200 bytes and attribute access is faster; the trade-off is that you cannot add arbitrary attributes.",
  },
  {
    id: "py-understand-frame-locals",
    language: "python",
    title: "exec() and locals() — dynamic code evaluation",
    tag: "understanding",
    code: `code = """
result = x ** 2 + y
"""

local_vars = {"x": 5, "y": 3}
exec(code, {}, local_vars)
print(local_vars["result"])   # 28

# WARNING: locals() returns a copy — assigning to locals() has no effect:
def f():
    x = 1
    locals()["x"] = 999   # silently ignored
    print(x)              # still 1

f()`,
    explanation:
      "exec() runs code in provided global/local dicts; when called inside a function, locals() returns a snapshot — modifying it does not affect the actual local variables.",
  },

  // ── more structures ───────────────────────────────────────────────────────────────
  {
    id: "py-itertools-product",
    language: "python",
    title: "itertools.product — Cartesian product",
    tag: "structures",
    code: `from itertools import product

# Cartesian product of two iterables:
for pair in product("AB", "12"):
    print(pair, end=" ")
# ('A', '1') ('A', '2') ('B', '1') ('B', '2')

# Repeat argument for self-product:
for triple in product(range(2), repeat=3):
    print(triple, end=" ")
# (0,0,0) (0,0,1) (0,1,0) (0,1,1) (1,0,0) (1,0,1) (1,1,0) (1,1,1)`,
    explanation:
      "itertools.product is the lazy equivalent of nested for loops; repeat=N is shorthand for product(iterable, iterable, ...) N times — useful for generating bit patterns and test combinations.",
  },
  {
    id: "py-itertools-islice",
    language: "python",
    title: "itertools.islice — lazy slicing of iterators",
    tag: "structures",
    code: `from itertools import islice

def infinite_counter(start=0):
    n = start
    while True:
        yield n
        n += 1

gen = infinite_counter()
first_10 = list(islice(gen, 10))
print(first_10)  # [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

# Skip 5, take next 3:
portion = list(islice(infinite_counter(), 5, 8))
print(portion)   # [5, 6, 7]`,
    explanation:
      "islice slices any iterator without materialising it into a list; it accepts start, stop, and step arguments like range; it is the standard way to take N items from an infinite generator.",
  },
];
