import type { Snippet } from "./types";

export const pythonSnippets20260518B5: Snippet[] = [
  // --- snippet ---
  {
    id: "py-b18-b5-argparse-subparsers",
    language: "python",
    title: "argparse with subcommands",
    tag: "snippet",
    code: `import argparse

parser = argparse.ArgumentParser(prog="tool")
subs = parser.add_subparsers(dest="command")

# 'run' subcommand
run_p = subs.add_parser("run", help="Execute a job")
run_p.add_argument("job", help="Job name")
run_p.add_argument("--dry-run", action="store_true")

# 'list' subcommand
list_p = subs.add_parser("list", help="List jobs")
list_p.add_argument("--limit", type=int, default=10)

args = parser.parse_args(["run", "export", "--dry-run"])
print(args)  # Namespace(command='run', job='export', dry_run=True)`,
    explanation: "argparse.add_subparsers creates Git-style subcommands; each sub-parser can have its own arguments. dest='command' captures which subcommand was invoked.",
  },
  {
    id: "py-b18-b5-functools-singledispatch",
    language: "python",
    title: "functools.singledispatch for type dispatch",
    tag: "snippet",
    code: `from functools import singledispatch

@singledispatch
def serialize(value) -> str:
    raise NotImplementedError(f"No serializer for {type(value)}")

@serialize.register(int)
@serialize.register(float)
def _(value) -> str:
    return str(value)

@serialize.register(list)
def _(value) -> str:
    return "[" + ", ".join(serialize(v) for v in value) + "]"

@serialize.register(dict)
def _(value) -> str:
    pairs = ", ".join(f"{serialize(k)}: {serialize(v)}" for k, v in value.items())
    return "{" + pairs + "}"

print(serialize(42))                    # 42
print(serialize([1, 2.5, 3]))           # [1, 2.5, 3]`,
    explanation: "singledispatch creates a function that dispatches to different implementations based on the type of the first argument; register adds type-specific overloads.",
  },
  {
    id: "py-b18-b5-asyncio-timeout",
    language: "python",
    title: "asyncio.timeout for cancellation",
    tag: "snippet",
    code: `import asyncio

async def slow_operation():
    await asyncio.sleep(10)
    return "done"

async def main():
    try:
        async with asyncio.timeout(1.0):  # Python 3.11+
            result = await slow_operation()
    except TimeoutError:
        print("Operation timed out")

    # Older pattern:
    try:
        result = await asyncio.wait_for(slow_operation(), timeout=1.0)
    except asyncio.TimeoutError:
        print("wait_for timed out")

asyncio.run(main())`,
    explanation: "asyncio.timeout (Python 3.11+) is the modern context-manager approach; asyncio.wait_for is the older equivalent. Both cancel the inner coroutine when the deadline expires.",
  },
  {
    id: "py-b18-b5-dataclass-frozen",
    language: "python",
    title: "Frozen dataclasses for immutable value objects",
    tag: "snippet",
    code: `from dataclasses import dataclass

@dataclass(frozen=True)
class Money:
    amount: float
    currency: str

    def add(self, other: "Money") -> "Money":
        if self.currency != other.currency:
            raise ValueError("currency mismatch")
        return Money(self.amount + other.amount, self.currency)

m1 = Money(10.0, "USD")
m2 = Money(5.0,  "USD")
m3 = m1.add(m2)
print(m3)  # Money(amount=15.0, currency='USD')

# Frozen — hashable
prices = {m1: "ten dollars"}
print(prices[Money(10.0, "USD")])  # ten dollars`,
    explanation: "frozen=True generates __hash__ and prevents attribute assignment after construction, making the dataclass a proper immutable value object usable as a dict key.",
  },
  {
    id: "py-b18-b5-itertools-product",
    language: "python",
    title: "itertools.product for Cartesian product",
    tag: "snippet",
    code: `from itertools import product

# All combinations of suits and ranks
suits = ["♠", "♥", "♦", "♣"]
ranks = ["A", "2", "3"]

deck = list(product(ranks, suits))
print(deck[:4])
# [('A', '♠'), ('A', '♥'), ('A', '♦'), ('A', '♣')]

# repeat parameter: same iterable n times
print(list(product("AB", repeat=2)))
# [('A','A'), ('A','B'), ('B','A'), ('B','B')]

# Grid coordinates
grid = [(x, y) for x, y in product(range(3), range(3))]
print(len(grid))  # 9`,
    explanation: "itertools.product computes the Cartesian product of iterables lazily; repeat=n is shorthand for passing the same iterable n times, useful for permutations with repetition.",
  },
  {
    id: "py-b18-b5-contextlib-asynccontextmanager",
    language: "python",
    title: "asynccontextmanager for async with",
    tag: "snippet",
    code: `from contextlib import asynccontextmanager
import asyncio

@asynccontextmanager
async def db_connection(url: str):
    print(f"Connecting to {url}")
    conn = {"url": url, "open": True}  # simulated connection
    try:
        yield conn
    finally:
        conn["open"] = False
        print(f"Disconnected from {url}")

async def main():
    async with db_connection("postgresql://localhost/mydb") as conn:
        print(f"Using connection: {conn}")

asyncio.run(main())`,
    explanation: "@asynccontextmanager creates an async context manager from an async generator; the code before yield is __aenter__, the finally block is __aexit__.",
  },
  {
    id: "py-b18-b5-string-rfind-partition",
    language: "python",
    title: "str.partition and str.rpartition",
    tag: "snippet",
    code: `url = "https://user:pass@host:8080/path"

# partition: split at FIRST occurrence
scheme, sep, rest = url.partition("://")
print(scheme)  # https
print(rest)    # user:pass@host:8080/path

# rpartition: split at LAST occurrence
path_part, _, host_part = rest.rpartition("/")
print(path_part)  # user:pass@host:8080
print(host_part)  # path

# Compare with split(maxsplit=1)
left, right = "a:b:c".partition(":")[::2]  # trick: first and last of triple
print(left, right)  # a b:c`,
    explanation: "str.partition returns a 3-tuple (before, sep, after) always including the separator in position 1; rpartition splits at the last occurrence. They're cleaner than split(maxsplit=1) when you want the separator.",
  },
  {
    id: "py-b18-b5-typing-runtime-type-check",
    language: "python",
    title: "isinstance with Union types",
    tag: "snippet",
    code: `from typing import Union, get_args, get_origin

def process(value: Union[int, float, str]) -> str:
    if isinstance(value, (int, float)):
        return f"number: {value}"
    return f"text: {value}"

print(process(42))       # number: 42
print(process(3.14))     # number: 3.14
print(process("hello"))  # text: hello

# Inspect Union at runtime
hint = Union[int, str]
print(get_origin(hint))    # typing.Union
print(get_args(hint))      # (<class 'int'>, <class 'str'>)`,
    explanation: "isinstance accepts a tuple of types for multi-type checks; get_origin and get_args inspect Union and other generic types at runtime, useful for custom serializers and validators.",
  },
  {
    id: "py-b18-b5-contextvar-token",
    language: "python",
    title: "ContextVar reset with tokens",
    tag: "snippet",
    code: `from contextvars import ContextVar

db_name: ContextVar[str] = ContextVar("db_name", default="primary")

# Save old value and restore it
token = db_name.set("replica")
print(db_name.get())   # replica

db_name.reset(token)   # restore to "primary"
print(db_name.get())   # primary

# Nested context override
t1 = db_name.set("shard-1")
t2 = db_name.set("shard-2")
print(db_name.get())   # shard-2
db_name.reset(t2)
print(db_name.get())   # shard-1
db_name.reset(t1)`,
    explanation: "ContextVar.set returns a Token that records the previous value; reset(token) restores exactly that value, enabling safe nested context overrides without manual save/restore.",
  },
  {
    id: "py-b18-b5-zlib-compress",
    language: "python",
    title: "zlib for data compression",
    tag: "snippet",
    code: `import zlib

data = b"Hello, World! " * 100
print(f"Original: {len(data)} bytes")

compressed = zlib.compress(data, level=9)
print(f"Compressed: {len(compressed)} bytes")

decompressed = zlib.decompress(compressed)
assert decompressed == data

# Checksum
crc = zlib.crc32(data)
adler = zlib.adler32(data)
print(f"CRC32: {crc:#010x}")`,
    explanation: "zlib provides DEFLATE compression; level 1 is fastest, level 9 is best compression. crc32 and adler32 compute checksums for data integrity verification.",
  },
  {
    id: "py-b18-b5-base64-encode",
    language: "python",
    title: "base64 encoding and URL-safe variant",
    tag: "snippet",
    code: `import base64

data = b"Binary data: \\x00\\x01\\x02\\xff"

# Standard base64
encoded = base64.b64encode(data)
print(encoded)   # b'QmluYXJ5IGRhdGE6AAECiA=='

decoded = base64.b64decode(encoded)
assert decoded == data

# URL-safe variant (- and _ instead of + and /)
safe = base64.urlsafe_b64encode(data)
print(safe)

# Encode string
import base64
token = base64.b64encode(b"user:password").decode()
print(f"Authorization: Basic {token}")`,
    explanation: "base64.b64encode produces standard base64 with +/ characters; urlsafe_b64encode replaces them with -_ for use in URLs and filenames. Decode with the matching decoder.",
  },
  {
    id: "py-b18-b5-uuid-generation",
    language: "python",
    title: "uuid module for unique IDs",
    tag: "snippet",
    code: `import uuid

# UUID4: random
uid = uuid.uuid4()
print(uid)          # e.g. 550e8400-e29b-41d4-a716-446655440000
print(uid.hex)      # without hyphens
print(uid.bytes)    # 16 bytes

# UUID5: namespace + name (deterministic)
ns = uuid.NAMESPACE_DNS
name_uid = uuid.uuid5(ns, "example.com")
print(name_uid)     # always same for same ns+name

# From string
parsed = uuid.UUID("550e8400-e29b-41d4-a716-446655440000")
print(parsed.version)  # 4`,
    explanation: "uuid4 generates a random UUID; uuid5 generates a deterministic one from a namespace and name (useful for reproducible IDs from natural keys like domain names).",
  },
  {
    id: "py-b18-b5-subprocess-run",
    language: "python",
    title: "subprocess.run for shell commands",
    tag: "snippet",
    code: `import subprocess

# Run command, capture output
result = subprocess.run(
    ["echo", "hello world"],
    capture_output=True,
    text=True,
    check=True,         # raises CalledProcessError on non-zero exit
)
print(result.stdout)    # hello world\\n
print(result.returncode)  # 0

# Shell=True (use sparingly — injection risk with user input)
result2 = subprocess.run(
    "ls -la | head -5",
    shell=True, capture_output=True, text=True
)
print(result2.stdout)`,
    explanation: "subprocess.run with capture_output=True and text=True captures stdout/stderr as strings; check=True raises on failure. Avoid shell=True with user-controlled input to prevent injection.",
  },
  {
    id: "py-b18-b5-dataclass-compare",
    language: "python",
    title: "dataclass with order=True for comparison",
    tag: "snippet",
    code: `from dataclasses import dataclass

@dataclass(order=True)
class Version:
    major: int
    minor: int
    patch: int

    def __str__(self):
        return f"{self.major}.{self.minor}.{self.patch}"

versions = [
    Version(2, 0, 0),
    Version(1, 9, 3),
    Version(1, 10, 0),
    Version(2, 0, 1),
]

versions.sort()
for v in versions:
    print(v)
# 1.9.3
# 1.10.0
# 2.0.0
# 2.0.1`,
    explanation: "order=True generates __lt__, __le__, __gt__, __ge__ based on the tuple of all fields in declaration order; fields are compared lexicographically, enabling sorting and comparison operators.",
  },
  {
    id: "py-b18-b5-re-fullmatch",
    language: "python",
    title: "re.fullmatch for complete string validation",
    tag: "snippet",
    code: `import re

# fullmatch: entire string must match (no partial matches)
email_re = re.compile(
    r"[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}"
)

def is_valid_email(s: str) -> bool:
    return email_re.fullmatch(s) is not None

print(is_valid_email("alice@example.com"))  # True
print(is_valid_email("not-an-email"))       # False
print(is_valid_email("alice@example.com ")) # False (trailing space)

# re.match only checks from start, not to end
print(bool(re.match(r"\\d+", "123abc")))    # True (partial!)
print(bool(re.fullmatch(r"\\d+", "123abc"))) # False`,
    explanation: "re.fullmatch requires the pattern to match the entire string; re.match only anchors at the start (trailing chars pass). Use fullmatch for input validation.",
  },

  // --- understanding ---
  {
    id: "py-b18-b5-cpython-bytecode",
    language: "python",
    title: "Inspecting CPython bytecode with dis",
    tag: "understanding",
    code: `import dis

def add_one(x):
    return x + 1

# Disassemble to bytecode
dis.dis(add_one)
# LOAD_FAST  'x'
# LOAD_CONST 1
# BINARY_OP  +
# RETURN_VALUE

# List comprehension has its own code object
gen = lambda: [x*x for x in range(5)]
dis.dis(gen)

# co_code: raw bytecode bytes
print(add_one.__code__.co_varnames)  # ('x',)
print(add_one.__code__.co_consts)    # (None, 1)`,
    explanation: "dis.dis shows the bytecode instructions CPython executes; understanding bytecode helps explain performance characteristics (e.g., LOAD_FAST vs LOAD_GLOBAL) and why generator expressions create new code objects.",
  },
  {
    id: "py-b18-b5-slots-inheritance",
    language: "python",
    title: "__slots__ and inheritance rules",
    tag: "understanding",
    code: `class Base:
    __slots__ = ("x",)
    def __init__(self, x): self.x = x

class Child(Base):
    __slots__ = ("y",)  # only ADD new slots here
    def __init__(self, x, y):
        super().__init__(x)
        self.y = y

c = Child(1, 2)
print(c.x, c.y)  # 1 2

# If any class in the hierarchy lacks __slots__, __dict__ is added
class WithDict(Base):
    pass   # no __slots__ — adds __dict__

wd = WithDict(1)
wd.extra = "dynamic"  # allowed (has __dict__)`,
    explanation: "Subclasses should only add new slots; if any class in the MRO lacks __slots__, __dict__ is added to the hierarchy. Without __slots__ on every class, you lose the memory benefit.",
  },
  {
    id: "py-b18-b5-import-hooks",
    language: "python",
    title: "Import hooks with sys.meta_path",
    tag: "understanding",
    code: `import sys
import importlib.abc
import importlib.machinery

class DebugFinder(importlib.abc.MetaPathFinder):
    def find_spec(self, name, path, target=None):
        print(f"Importing: {name}")
        return None  # let other finders handle it

# Install the hook
sys.meta_path.insert(0, DebugFinder())

import json  # "Importing: json" printed
import re    # "Importing: re" printed

# Remove hook
sys.meta_path.pop(0)`,
    explanation: "sys.meta_path contains finder objects consulted for every import; a custom MetaPathFinder can intercept, redirect, or block imports — the basis for import mocking, lazy loading, and zipimport.",
  },
  {
    id: "py-b18-b5-frame-inspection",
    language: "python",
    title: "Frame inspection with inspect module",
    tag: "understanding",
    code: `import inspect

def outer():
    x = 10
    def inner():
        frame = inspect.currentframe()
        caller = frame.f_back
        print(f"Called from: {caller.f_code.co_name}")
        print(f"Caller locals: {list(caller.f_locals.keys())}")
    inner()

outer()
# Called from: outer
# Caller locals: ['x', 'inner']

# Get call stack
def show_stack():
    for frame_info in inspect.stack()[1:3]:
        print(f"  {frame_info.function}:{frame_info.lineno}")`,
    explanation: "inspect.currentframe() returns the executing frame object; f_back walks up the call stack. inspect.stack() gives a list of FrameInfo namedtuples — used by debuggers, profilers, and traceback libraries.",
  },
  {
    id: "py-b18-b5-typing-narrowing",
    language: "python",
    title: "Type narrowing through control flow",
    tag: "understanding",
    code: `from typing import Union

def process(value: Union[int, str, None]) -> str:
    # After this check, type is Union[int, str] (None excluded)
    if value is None:
        return "none"

    # isinstance narrows to str
    if isinstance(value, str):
        return value.upper()  # type checker knows: str

    # Only int remains
    return str(value + 1)  # type checker knows: int

print(process(None))    # none
print(process("hello")) # HELLO
print(process(41))      # 42`,
    explanation: "Type checkers perform control flow analysis; each isinstance/is None/assert check narrows the type in the if-branch, enabling sound type-safe code without casting.",
  },
  {
    id: "py-b18-b5-generator-throw",
    language: "python",
    title: "generator.throw for error injection",
    tag: "understanding",
    code: `def cancellable():
    value = None
    while True:
        try:
            value = yield value
        except GeneratorExit:
            print("Cleanup on close")
            return
        except ValueError as e:
            print(f"Error injected: {e}")
            value = "default"

gen = cancellable()
print(next(gen))            # None (prime the generator)
print(gen.send("hello"))    # hello
gen.throw(ValueError, "bad input")  # Error injected: bad input
print(next(gen))            # default
gen.close()                 # Cleanup on close`,
    explanation: "generator.throw(ExcType, value) raises an exception at the yield point inside the generator; it enables error signaling from consumer to producer in cooperative pipelines.",
  },
  {
    id: "py-b18-b5-hash-collision",
    language: "python",
    title: "Hash collision and __hash__ contract",
    tag: "understanding",
    code: `class BadHash:
    def __init__(self, n): self.n = n
    def __eq__(self, other): return self.n == other.n
    def __hash__(self): return 42  # ALL objects collide!

d = {}
for i in range(100):
    d[BadHash(i)] = i

# Still correct — falls back to __eq__ for collision resolution
print(d[BadHash(50)])  # 50

import timeit
t = timeit.timeit(
    lambda: d[BadHash(99)],
    number=10000
)
print(f"Slow: {t:.4f}s")  # linear scan — much slower than O(1)`,
    explanation: "A constant hash function causes all keys to land in the same bucket, turning dict lookups from O(1) to O(n) linear scans; __hash__ should distribute well to maintain O(1) average performance.",
  },
  {
    id: "py-b18-b5-pep-657-fine-grained",
    language: "python",
    title: "Fine-grained error locations (Python 3.11+)",
    tag: "understanding",
    code: `# Python 3.11+ shows the exact expression that failed

data = {"users": [{"profile": None}]}

try:
    name = data["users"][0]["profile"]["name"]
except TypeError as e:
    print(e)
    # Python 3.11+: 'NoneType' object is not subscriptable
    # With caret pointing to: data["users"][0]["profile"]["name"]
    #                                                       ^^^^^^

# Also: AttributeError shows the object and attribute
try:
    x = None
    x.upper()
except AttributeError as e:
    print(e)  # 'NoneType' object has no attribute 'upper'`,
    explanation: "Python 3.11 added fine-grained error locations (PEP 657); error messages now include caret markers pointing to the exact sub-expression that failed, not just the line number.",
  },
  {
    id: "py-b18-b5-weakref-proxy",
    language: "python",
    title: "weakref.proxy for transparent weak references",
    tag: "understanding",
    code: `import weakref

class Resource:
    def compute(self): return "result"

res = Resource()

# proxy acts like the object but doesn't prevent GC
proxy = weakref.proxy(res)
print(proxy.compute())   # result (transparent)

del res  # original object deleted

try:
    proxy.compute()  # ReferenceError: proxy object dead
except ReferenceError as e:
    print(e)`,
    explanation: "weakref.proxy creates a transparent proxy that forwards attribute access to the referent; unlike a weak ref, you don't need to call it to get the object. ReferenceError fires when the referent is gone.",
  },
  {
    id: "py-b18-b5-exception-groups",
    language: "python",
    title: "ExceptionGroup and except* (Python 3.11+)",
    tag: "understanding",
    code: `import asyncio

async def fail1(): raise ValueError("bad value")
async def fail2(): raise TypeError("wrong type")

async def main():
    async with asyncio.TaskGroup() as tg:
        tg.create_task(fail1())
        tg.create_task(fail2())

try:
    asyncio.run(main())
except* ValueError as eg:
    print("ValueError(s):", eg.exceptions)
except* TypeError as eg:
    print("TypeError(s):", eg.exceptions)`,
    explanation: "Python 3.11 adds ExceptionGroup for collecting multiple concurrent exceptions; except* handlers filter the group by type, letting you handle each category of failure separately.",
  },
  {
    id: "py-b18-b5-pattern-matching-deep",
    language: "python",
    title: "Deep pattern matching with match/case",
    tag: "understanding",
    code: `from dataclasses import dataclass

@dataclass
class Point: x: int; y: int

command = {"action": "move", "to": Point(3, 4), "speed": 10}

match command:
    case {"action": "move", "to": Point(x=0, y=0)}:
        print("Move to origin")
    case {"action": "move", "to": Point(x, y), "speed": s} if s > 5:
        print(f"Fast move to ({x},{y}) at speed {s}")
    case {"action": "move", "to": Point(x, y)}:
        print(f"Slow move to ({x},{y})")
    case {"action": action}:
        print(f"Unknown action: {action}")`,
    explanation: "Python's match/case supports mapping patterns (dict destructuring), class patterns (dataclass field matching), guards (if conditions), and wildcards — far more expressive than isinstance chains.",
  },
  {
    id: "py-b18-b5-comprehension-conditions",
    language: "python",
    title: "Complex comprehension conditions",
    tag: "understanding",
    code: `# Filter with condition
evens = [x for x in range(20) if x % 2 == 0]

# Nested loops with filter
matrix = [[1,-2,3],[-4,5,-6],[7,-8,9]]
positives = [v for row in matrix for v in row if v > 0]
print(positives)  # [1, 3, 5, 7, 9]

# Conditional expression in output (not in filter)
signs = [("+" if x > 0 else "-") for x in [-1, 2, -3, 4]]
print(signs)  # ['-', '+', '-', '+']

# Dict comprehension with condition
scores = {"Alice": 90, "Bob": 55, "Carol": 85}
passing = {k: v for k, v in scores.items() if v >= 60}
print(passing)  # {'Alice': 90, 'Carol': 85}`,
    explanation: "Comprehension filters (if after for) exclude items; conditional expressions (x if cond else y in the output position) transform them. Nested fors are evaluated outer-to-inner.",
  },

  // --- structures ---
  {
    id: "py-b18-b5-sorted-bisect",
    language: "python",
    title: "Maintaining a sorted list with bisect",
    tag: "structures",
    code: `import bisect

class SortedArr:
    def __init__(self): self._data = []

    def add(self, val):
        bisect.insort(self._data, val)

    def contains(self, val) -> bool:
        i = bisect.bisect_left(self._data, val)
        return i < len(self._data) and self._data[i] == val

    def range_query(self, lo, hi):
        l = bisect.bisect_left(self._data, lo)
        r = bisect.bisect_right(self._data, hi)
        return self._data[l:r]

sa = SortedArr()
for v in [5, 1, 3, 7, 2, 4]: sa.add(v)
print(sa._data)           # [1, 2, 3, 4, 5, 7]
print(sa.range_query(2, 5))  # [2, 3, 4, 5]`,
    explanation: "bisect.insort maintains sorted order on insert; bisect_left/bisect_right find positions for O(log n) range queries. Together they implement a simple sorted set backed by a plain list.",
  },
  {
    id: "py-b18-b5-persistent-stack",
    language: "python",
    title: "Persistent (functional) stack",
    tag: "structures",
    code: `from __future__ import annotations
from typing import Optional, Generic, TypeVar

T = TypeVar("T")

class Stack(Generic[T]):
    def __init__(self, head: T, tail: Optional["Stack[T]"] = None):
        self._head = head
        self._tail = tail

    def push(self, value: T) -> "Stack[T]":
        return Stack(value, self)   # O(1), old stack unchanged

    def pop(self) -> tuple[T, Optional["Stack[T]"]]:
        return self._head, self._tail

    @classmethod
    def empty(cls) -> None:
        return None

s0 = None
s1 = Stack(1) if s0 is None else s0.push(1)
s2 = Stack(2, s1)   # push 2 onto s1
v, s3 = s2.pop()
print(v)                   # 2
print(s3._head)            # 1 (s1 still intact)`,
    explanation: "A persistent stack shares structure between versions; push creates a new node pointing to the old stack, so both old and new stacks remain valid — classic in functional programming and undo histories.",
  },
  {
    id: "py-b18-b5-avl-tree-concept",
    language: "python",
    title: "Binary search tree with insert and search",
    tag: "structures",
    code: `class BST:
    class Node:
        def __init__(self, val):
            self.val = val
            self.left = self.right = None

    def __init__(self): self.root = None

    def insert(self, val):
        def _ins(node, v):
            if node is None: return BST.Node(v)
            if v < node.val: node.left  = _ins(node.left, v)
            elif v > node.val: node.right = _ins(node.right, v)
            return node
        self.root = _ins(self.root, val)

    def inorder(self):
        result = []
        def _dfs(n):
            if n: _dfs(n.left); result.append(n.val); _dfs(n.right)
        _dfs(self.root)
        return result

tree = BST()
for v in [5, 3, 7, 1, 4, 6, 8]: tree.insert(v)
print(tree.inorder())  # [1, 3, 4, 5, 6, 7, 8]`,
    explanation: "A BST stores values such that left subtree values are smaller and right larger; inorder traversal yields sorted output in O(n). Unbalanced insertions degrade to O(n) — use sortedcontainers for production.",
  },
  {
    id: "py-b18-b5-max-flow-bfs",
    language: "python",
    title: "Edmonds-Karp max flow (BFS)",
    tag: "structures",
    code: `from collections import deque

def max_flow(graph, s, t):
    def bfs(source, sink, parent):
        visited = {source}
        q = deque([source])
        while q:
            u = q.popleft()
            for v, cap in enumerate(graph[u]):
                if v not in visited and cap > 0:
                    visited.add(v)
                    parent[v] = u
                    if v == sink: return True
                    q.append(v)
        return False

    n = len(graph)
    flow = 0
    while True:
        parent = [-1] * n
        if not bfs(s, t, parent): break
        path_flow = float("inf")
        v = t
        while v != s:
            u = parent[v]
            path_flow = min(path_flow, graph[u][v])
            v = u
        v = t
        while v != s:
            u = parent[v]
            graph[u][v] -= path_flow
            graph[v][u] += path_flow
            v = u
        flow += path_flow
    return flow`,
    explanation: "Edmonds-Karp is BFS-based Ford-Fulkerson, guaranteeing O(VE²) time; it finds augmenting paths in the residual graph and pushes flow until no path from source to sink exists.",
  },
  {
    id: "py-b18-b5-rope-data-structure",
    language: "python",
    title: "Rope for efficient string concatenation",
    tag: "structures",
    code: `class Rope:
    def __init__(self, s: str = ""):
        self.weight = len(s)
        self.data = s
        self.left = self.right = None

    @classmethod
    def concat(cls, a: "Rope", b: "Rope") -> "Rope":
        node = cls()
        node.left  = a
        node.right = b
        node.weight = a.weight + b.weight
        return node

    def to_string(self) -> str:
        if self.data: return self.data
        l = self.left.to_string()  if self.left  else ""
        r = self.right.to_string() if self.right else ""
        return l + r

r1 = Rope("Hello, ")
r2 = Rope("World!")
r3 = Rope.concat(r1, r2)
print(r3.to_string())  # Hello, World!`,
    explanation: "A Rope represents a string as a binary tree of substrings; concatenation is O(1) (just create a parent node) instead of O(n) string copy, making it efficient for editors and large text manipulation.",
  },
  {
    id: "py-b18-b5-skip-list-concept",
    language: "python",
    title: "Skip list node structure",
    tag: "structures",
    code: `import random

class SkipNode:
    def __init__(self, val, level):
        self.val = val
        self.forward = [None] * (level + 1)

class SkipList:
    MAX_LEVEL = 4

    def __init__(self):
        self.head = SkipNode(-float("inf"), self.MAX_LEVEL)
        self.level = 0

    def _random_level(self):
        lvl = 0
        while random.random() < 0.5 and lvl < self.MAX_LEVEL:
            lvl += 1
        return lvl

    def search(self, val) -> bool:
        cur = self.head
        for i in range(self.level, -1, -1):
            while cur.forward[i] and cur.forward[i].val < val:
                cur = cur.forward[i]
        cur = cur.forward[0]
        return cur is not None and cur.val == val`,
    explanation: "Skip lists use probabilistic multi-level linked lists to achieve O(log n) expected search without tree rotations; they're the basis for Redis's sorted sets.",
  },
  {
    id: "py-b18-b5-fenwick-tree",
    language: "python",
    title: "Fenwick tree (Binary Indexed Tree) for prefix sums",
    tag: "structures",
    code: `class FenwickTree:
    def __init__(self, n: int):
        self.tree = [0] * (n + 1)
        self.n = n

    def update(self, i: int, delta: int):
        while i <= self.n:
            self.tree[i] += delta
            i += i & (-i)          # advance to next responsible index

    def prefix_sum(self, i: int) -> int:
        s = 0
        while i > 0:
            s += self.tree[i]
            i -= i & (-i)          # move to parent
        return s

    def range_sum(self, l: int, r: int) -> int:
        return self.prefix_sum(r) - self.prefix_sum(l - 1)

ft = FenwickTree(5)
for i, v in enumerate([3, 1, 4, 1, 5], 1): ft.update(i, v)
print(ft.range_sum(2, 4))   # 1+4+1 = 6
ft.update(3, 2)              # arr[3] += 2 -> 6
print(ft.range_sum(2, 4))   # 8`,
    explanation: "Fenwick tree (BIT) supports prefix sum queries and point updates in O(log n); i & (-i) isolates the lowest set bit to navigate parent/child relationships in the implicit tree.",
  },
  {
    id: "py-b18-b5-monotonic-stack",
    language: "python",
    title: "Monotonic stack for next greater element",
    tag: "structures",
    code: `def next_greater(nums: list[int]) -> list[int]:
    result = [-1] * len(nums)
    stack = []   # stores indices, maintains decreasing values

    for i, val in enumerate(nums):
        # Pop elements for which 'val' is the next greater
        while stack and nums[stack[-1]] < val:
            idx = stack.pop()
            result[idx] = val
        stack.append(i)

    return result

print(next_greater([2, 1, 2, 4, 3]))
# [-1 is placeholder; actual: [4, 2, 4, -1, -1]]
# 2->4, 1->2, 2->4, 4->-1, 3->-1`,
    explanation: "A monotonic stack maintains elements in a specific (increasing/decreasing) order; popping elements when the invariant breaks solves next-greater/smaller problems in O(n) with a single pass.",
  },
  {
    id: "py-b18-b5-two-pointer",
    language: "python",
    title: "Two-pointer technique for sorted arrays",
    tag: "structures",
    code: `def two_sum_sorted(arr: list[int], target: int):
    left, right = 0, len(arr) - 1
    while left < right:
        s = arr[left] + arr[right]
        if s == target:
            return (left, right)
        elif s < target:
            left  += 1
        else:
            right -= 1
    return None

arr = [1, 2, 4, 7, 11, 15]
print(two_sum_sorted(arr, 9))   # (1, 3)  -> 2+7
print(two_sum_sorted(arr, 26))  # (4, 5)  -> 11+15
print(two_sum_sorted(arr, 3))   # None`,
    explanation: "Two pointers on a sorted array run in O(n) by moving the left pointer right when the sum is too small and the right pointer left when too large, converging to the answer.",
  },
  {
    id: "py-b18-b5-sliding-window",
    language: "python",
    title: "Sliding window for substring problems",
    tag: "structures",
    code: `def longest_no_repeat(s: str) -> int:
    char_index = {}
    max_len = left = 0

    for right, ch in enumerate(s):
        if ch in char_index and char_index[ch] >= left:
            left = char_index[ch] + 1   # shrink window
        char_index[ch] = right
        max_len = max(max_len, right - left + 1)

    return max_len

print(longest_no_repeat("abcabcbb"))  # 3 ("abc")
print(longest_no_repeat("bbbbb"))     # 1 ("b")
print(longest_no_repeat("pwwkew"))    # 3 ("wke")`,
    explanation: "Sliding window maintains a variable-size window by advancing the right pointer and shrinking from the left when a constraint is violated; O(n) for longest substring without repeating characters.",
  },

  // --- caveats ---
  {
    id: "py-b18-b5-walrus-in-while",
    language: "python",
    title: "Walrus in list comprehension vs while",
    tag: "caveats",
    code: `# Intended: filter and assign simultaneously
data = [1, -2, 3, -4, 5]

# WRONG: ternary doesn't filter — all elements included
filtered_bad = [abs_v if (abs_v := abs(x)) > 2 else 0 for x in data]
print(filtered_bad)   # [0, 2, 3, 4, 5] — zeros for small values

# RIGHT: walrus in the if clause filters AND captures
filtered = [abs_v for x in data if (abs_v := abs(x)) > 2]
print(filtered)       # [3, 4, 5]`,
    explanation: "Walrus in the if-clause of a comprehension both filters and captures the value; walrus in the output expression doesn't filter (it still produces a value for every element).",
  },
  {
    id: "py-b18-b5-list-multiplication",
    language: "python",
    title: "List multiplication creates shared references",
    tag: "caveats",
    code: `# WRONG: [row] * 3 creates 3 references to the SAME row
grid_bad = [[0] * 3] * 3
grid_bad[0][0] = 99
print(grid_bad)  # [[99,0,0],[99,0,0],[99,0,0]] — all rows changed!

# RIGHT: each row is a new list
grid_ok = [[0] * 3 for _ in range(3)]
grid_ok[0][0] = 99
print(grid_ok)   # [[99,0,0],[0,0,0],[0,0,0]]

# Integers are immutable — multiplication is fine
nums = [0] * 5
nums[0] = 1
print(nums)  # [1,0,0,0,0] — safe for immutables`,
    explanation: "* n on a list creates n references to the same inner object; with mutable inner lists, modifying one modifies all. Use list comprehensions to create independent mutable rows.",
  },
  {
    id: "py-b18-b5-shadowing-builtins",
    language: "python",
    title: "Shadowing built-in names",
    tag: "caveats",
    code: `# WRONG: shadows built-in 'list'
list = [1, 2, 3]          # oops!
# list([4, 5])            # TypeError: 'list' object is not callable

# Also common mistakes:
# id = 42; hash = {}; type = "str"; input = "value"
# min = 0; max = 100; sum = 0; len = 10

# Fix: use different names
items = [1, 2, 3]
user_id = 42
count = 10
total = 0

# Check if you've shadowed a built-in
import builtins
print(hasattr(builtins, "list"))  # True — it's a built-in`,
    explanation: "Assigning to names like list, dict, set, type, id, input shadows the built-in permanently in that scope; the bug is invisible until you try to use the built-in. Use descriptive names instead.",
  },
  {
    id: "py-b18-b5-assertion-disabled",
    language: "python",
    title: "assert is disabled with python -O",
    tag: "caveats",
    code: `# Assertions are stripped when Python runs with -O (optimize) flag
# NEVER use assert for security or data validation!

# WRONG: assert is silently removed with -O
def process(data):
    assert data is not None, "data required"  # can be skipped!
    return data

# RIGHT: use explicit validation
def process_safe(data):
    if data is None:
        raise ValueError("data is required")
    return data

# assert IS appropriate for invariants in debug mode:
def bisect_search(arr, target):
    assert all(arr[i] <= arr[i+1] for i in range(len(arr)-1)), "array not sorted"
    # ...`,
    explanation: "assert statements are removed when Python runs with -O or -OO optimization flags; never rely on them for security checks, input validation, or runtime invariants that must always hold.",
  },
  {
    id: "py-b18-b5-sys-exit-exception",
    language: "python",
    title: "sys.exit raises SystemExit, not exits immediately",
    tag: "caveats",
    code: `import sys

# sys.exit raises SystemExit (a BaseException, not Exception)
try:
    sys.exit(0)
except SystemExit as e:
    print(f"Caught SystemExit: {e.code}")  # 0
    # Not re-raising: program continues

# In atexit handlers and context managers, __exit__ is still called
class Cleanup:
    def __enter__(self): return self
    def __exit__(self, *args):
        print("Cleanup ran!")
        return False  # don't suppress SystemExit

with Cleanup():
    sys.exit(1)   # Cleanup ran! is printed before exit`,
    explanation: "sys.exit() raises SystemExit which propagates through the call stack; with-statements and atexit handlers still run. Use os._exit() to bypass Python cleanup if you need immediate OS-level exit.",
  },
  {
    id: "py-b18-b5-asyncio-sleep-zero",
    language: "python",
    title: "asyncio.sleep(0) for cooperative yielding",
    tag: "caveats",
    code: `import asyncio

async def cpu_hog():
    total = 0
    for i in range(1_000_000):
        total += i
        if i % 10_000 == 0:
            await asyncio.sleep(0)  # yield control to event loop
    return total

async def greeter():
    for _ in range(3):
        print("hello")
        await asyncio.sleep(0)

async def main():
    await asyncio.gather(cpu_hog(), greeter())

asyncio.run(main())`,
    explanation: "asyncio.sleep(0) yields control to the event loop, allowing other coroutines to run; without it, a tight loop monopolizes the event loop, starving all other concurrent tasks.",
  },
  {
    id: "py-b18-b5-del-none-difference",
    language: "python",
    title: "del vs assigning None",
    tag: "caveats",
    code: `d = {"a": 1, "b": 2, "c": 3}

# None: key remains, value is None
d["a"] = None
print("a" in d)   # True
print(d["a"])     # None

# del: removes the key entirely
del d["b"]
print("b" in d)   # False
try:
    print(d["b"])
except KeyError as e:
    print(e)      # 'b'

# For variables: del unbinds the name
x = 42
del x
try:
    print(x)
except NameError:
    print("x is gone")`,
    explanation: "Assigning None keeps the key in a dict with a None value; del removes the key entirely. For variables, del unbinds the name from the namespace — subsequent access raises NameError.",
  },

  // --- types ---
  {
    id: "py-b18-b5-pep-604-union",
    language: "python",
    title: "PEP 604 union syntax: X | Y",
    tag: "types",
    code: `# Python 3.10+: use | instead of Union[X, Y]
from __future__ import annotations  # for 3.9 backcompat

def greet(name: str | None = None) -> str:
    return f"Hello, {name or 'World'}!"

# isinstance also accepts union types directly (3.10+)
def process(value: int | float | str) -> str:
    if isinstance(value, int | float):
        return f"number: {value}"
    return f"text: {value}"

print(process(3.14))    # number: 3.14
print(process("hi"))    # text: hi

# Optional[X] is just X | None
from typing import Optional
def legacy(x: Optional[int]) -> int:
    return x or 0`,
    explanation: "PEP 604 (Python 3.10+) adds X | Y as syntax for unions, replacing Union[X, Y]; isinstance also accepts | expressions. Optional[X] is equivalent to X | None.",
  },
  {
    id: "py-b18-b5-pep-673-self-type",
    language: "python",
    title: "Self type for subclass-aware returns",
    tag: "types",
    code: `from __future__ import annotations
from typing import Self
from dataclasses import dataclass

@dataclass
class Node:
    value: int
    children: list[Self]

    def add_child(self, value: int) -> Self:
        child = self.__class__(value, [])
        self.children.append(child)
        return self  # fluent

class SpecialNode(Node):
    extra: str = ""

sn = SpecialNode(1, [])
# add_child returns SpecialNode (not Node) due to Self
sn2: SpecialNode = sn.add_child(2)`,
    explanation: "Self (PEP 673) annotates methods returning the current class; type checkers preserve the subclass type through fluent chains, avoiding the need for TypeVar in simple self-returning methods.",
  },
  {
    id: "py-b18-b5-pep-698-override",
    language: "python",
    title: "typing.override for safe method override",
    tag: "types",
    code: `from typing import override

class Base:
    def process(self, value: int) -> str:
        return str(value)

    def old_method(self) -> None:
        pass

class Child(Base):
    @override
    def process(self, value: int) -> str:  # type checker verifies this overrides Base
        return f"Child: {value}"

    # @override
    # def old_methd(self): ...  # typo — type checker catches it!
    # Error: method 'old_methd' marked as override but is not in parent

c = Child()
print(c.process(42))  # Child: 42`,
    explanation: "@override (PEP 698, Python 3.12) marks a method as intentionally overriding a parent method; type checkers error if the parent doesn't have a matching method, catching typos and renamed base methods.",
  },
  {
    id: "py-b18-b5-typing-unpack",
    language: "python",
    title: "Unpack for typed **kwargs",
    tag: "types",
    code: `from typing import TypedDict, Unpack

class CreateUserKwargs(TypedDict):
    name: str
    email: str
    age: int

def create_user(**kwargs: Unpack[CreateUserKwargs]) -> dict:
    return dict(kwargs)

# Type-safe kwargs!
user = create_user(name="Alice", email="a@b.com", age=30)
print(user)

# Type checkers catch:
# create_user(name="Alice", email="a@b.com")       # missing 'age'
# create_user(name="Alice", email="a@b.com", age="x")  # wrong type`,
    explanation: "Unpack[TypedDict] on **kwargs enables type checking of keyword argument names and types, replacing the untyped **kwargs: Any with a fully-specified keyword contract.",
  },
  {
    id: "py-b18-b5-dataclass-transform",
    language: "python",
    title: "dataclass_transform for third-party class factories",
    tag: "types",
    code: `from typing import dataclass_transform

# Used by libraries (attrs, pydantic, SQLModel) to tell type checkers
# that their decorator behaves like @dataclass
@dataclass_transform()
def my_model(cls):
    """A pretend model decorator."""
    cls.__init__ = lambda self, **kw: vars(self).update(kw)
    return cls

@my_model
class User:
    name: str
    age: int

# Type checkers recognize User(name="Alice", age=30) as valid
u = User(name="Alice", age=30)
print(vars(u))  # {'name': 'Alice', 'age': 30}`,
    explanation: "dataclass_transform (PEP 681) tells type checkers that a decorator/metaclass creates dataclass-like behavior; libraries like attrs and Pydantic use it so IDE type checking works correctly.",
  },
  {
    id: "py-b18-b5-typing-deprecated",
    language: "python",
    title: "typing.deprecated for deprecation warnings",
    tag: "types",
    code: `from typing import deprecated
import warnings

@deprecated("Use new_func() instead")
def old_func(x: int) -> int:
    warnings.warn("old_func is deprecated", DeprecationWarning, stacklevel=2)
    return x * 2

# Type checkers show a warning when old_func is called
# Runtime: raises DeprecationWarning
import warnings
with warnings.catch_warnings(record=True) as w:
    warnings.simplefilter("always")
    result = old_func(5)
    print(result)                  # 10
    print(w[0].category.__name__) # DeprecationWarning`,
    explanation: "@deprecated (PEP 702, Python 3.13) marks a function or class as deprecated; type checkers emit warnings at call sites, and the decorator combines with DeprecationWarning for runtime notification.",
  },

  // --- families ---
  {
    id: "py-b18-b5-hypothesis-testing",
    language: "python",
    title: "Hypothesis for property-based testing",
    tag: "families",
    code: `from hypothesis import given, strategies as st

def sort_and_dedup(lst):
    return sorted(set(lst))

# Property: result is sorted
@given(st.lists(st.integers()))
def test_sorted(lst):
    result = sort_and_dedup(lst)
    assert result == sorted(result)

# Property: result has no duplicates
@given(st.lists(st.integers()))
def test_no_duplicates(lst):
    result = sort_and_dedup(lst)
    assert len(result) == len(set(result))

# Property: output is subset of input
@given(st.lists(st.integers()))
def test_subset(lst):
    result = sort_and_dedup(lst)
    assert set(result) <= set(lst)

test_sorted()
test_no_duplicates()
test_subset()`,
    explanation: "Hypothesis generates hundreds of random inputs that satisfy the strategy; it shrinks failing cases to the minimal reproducer. Property-based testing finds edge cases unit tests miss.",
  },
  {
    id: "py-b18-b5-structlog",
    language: "python",
    title: "structlog for structured contextual logging",
    tag: "families",
    code: `import structlog

log = structlog.get_logger()

# Bind context to a logger instance
request_log = log.bind(request_id="abc-123", user_id=42)
request_log.info("Request started", method="GET", path="/users")
request_log.warning("Slow query", duration_ms=1500)

# Context accumulates
step_log = request_log.bind(step="validation")
step_log.debug("Validating input")

# Configure output format
structlog.configure(
    processors=[
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.JSONRenderer(),
    ]
)`,
    explanation: "structlog binds key-value pairs to a logger context; child loggers inherit bound context. Processors transform events — JSON rendering makes logs machine-parseable for log aggregation.",
  },
  {
    id: "py-b18-b5-apscheduler",
    language: "python",
    title: "APScheduler for scheduled tasks",
    tag: "families",
    code: `from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime
import time

def tick():
    print(f"Tick at {datetime.now().isoformat()}")

scheduler = BackgroundScheduler()

# Run every 2 seconds
scheduler.add_job(tick, "interval", seconds=2)

# Cron-style: every weekday at 9 AM
scheduler.add_job(tick, "cron", day_of_week="mon-fri", hour=9)

# One-time: run in 5 seconds
from datetime import timedelta
scheduler.add_job(tick, "date",
    run_date=datetime.now() + timedelta(seconds=5))

scheduler.start()
time.sleep(5)
scheduler.shutdown()`,
    explanation: "APScheduler runs jobs on intervals, cron schedules, or one-time dates in background threads; it integrates with async frameworks and supports persistent job stores (SQLAlchemy, Redis).",
  },
  {
    id: "py-b18-b5-dask-parallel",
    language: "python",
    title: "Dask for parallel dataframe operations",
    tag: "families",
    code: `import dask.dataframe as dd
import pandas as pd

# Create a large-ish dataset
df = pd.DataFrame({
    "x": range(1000000),
    "y": range(1000000, 2000000),
})
df.to_csv("big.csv", index=False)

# Dask reads lazily and processes in partitions
ddf = dd.read_csv("big.csv")

# Operations are lazy — nothing runs yet
result = ddf.groupby("x").y.sum()

# .compute() triggers actual computation
# print(result.compute().head())

import os; os.remove("big.csv")`,
    explanation: "Dask provides a Pandas-compatible API that partitions data and executes operations in parallel on multiple CPUs or a cluster; lazy computation builds a graph, .compute() executes it.",
  },
  {
    id: "py-b18-b5-numba-jit",
    language: "python",
    title: "Numba JIT for numeric Python acceleration",
    tag: "families",
    code: `# pip install numba
from numba import njit
import numpy as np

@njit
def mandelbrot_point(c, max_iter):
    z = 0
    for i in range(max_iter):
        z = z * z + c
        if abs(z) > 2:
            return i
    return max_iter

# First call: JIT compilation
# Subsequent calls: native machine code speed
result = mandelbrot_point(complex(-0.75, 0.1), 100)
print(result)

# Works with NumPy arrays too
@njit(parallel=True)  # requires numba >= 0.43
def sum_array(arr):
    return np.sum(arr)`,
    explanation: "Numba @njit compiles Python+NumPy functions to LLVM native code; the first call incurs compilation cost, subsequent calls run at C speed. parallel=True enables automatic loop parallelism.",
  },
  {
    id: "py-b18-b5-msgpack-serial",
    language: "python",
    title: "msgpack for compact binary serialization",
    tag: "families",
    code: `# pip install msgpack
import msgpack

data = {"name": "Alice", "scores": [95, 87, 92], "active": True}

# Pack to bytes
packed = msgpack.packb(data, use_bin_type=True)
print(f"JSON:    {len(str(data))} bytes")
print(f"msgpack: {len(packed)} bytes")  # typically ~30% smaller

# Unpack
unpacked = msgpack.unpackb(packed, raw=False)
print(unpacked)  # {'name': 'Alice', 'scores': [95, 87, 92], 'active': True}

# Streaming
buf = b""
buf += msgpack.packb(1)
buf += msgpack.packb("hello")
unpacker = msgpack.Unpacker(raw=False)
unpacker.feed(buf)
for obj in unpacker:
    print(obj)`,
    explanation: "MessagePack serializes to binary (smaller and faster than JSON); use_bin_type=True handles bytes correctly in Python 3. Streaming via Unpacker handles framing for network protocols.",
  },
  {
    id: "py-b18-b5-watchfiles",
    language: "python",
    title: "watchfiles for file system monitoring",
    tag: "families",
    code: `# pip install watchfiles
import asyncio
from watchfiles import awatch, Change

async def monitor():
    print("Watching for changes...")
    async for changes in awatch("/tmp"):
        for change_type, path in changes:
            if change_type == Change.added:
                print(f"+ Added: {path}")
            elif change_type == Change.modified:
                print(f"~ Modified: {path}")
            elif change_type == Change.deleted:
                print(f"- Deleted: {path}")
        # Stop after first batch
        break

asyncio.run(monitor())`,
    explanation: "watchfiles uses Rust (via Notify) under the hood for OS-native file watching; awatch is the async version that yields change batches whenever files in the watched path are modified.",
  },

  // --- classes ---
  {
    id: "py-b18-b5-event-system",
    language: "python",
    title: "Type-safe event system with generics",
    tag: "classes",
    code: `from typing import TypeVar, Generic, Callable, overload

T = TypeVar("T")

class Event(Generic[T]):
    def __init__(self):
        self._handlers: list[Callable[[T], None]] = []

    def subscribe(self, handler: Callable[[T], None]) -> None:
        self._handlers.append(handler)

    def unsubscribe(self, handler: Callable[[T], None]) -> None:
        self._handlers.remove(handler)

    def fire(self, data: T) -> None:
        for h in self._handlers:
            h(data)

# Usage: strongly typed events
data_received: Event[bytes] = Event()
user_logged_in: Event[str] = Event()

data_received.subscribe(lambda b: print(f"Got {len(b)} bytes"))
user_logged_in.subscribe(lambda u: print(f"Welcome, {u}!"))

data_received.fire(b"hello world")   # Got 11 bytes
user_logged_in.fire("Alice")          # Welcome, Alice!`,
    explanation: "Event[T] is a generic event dispatcher; type checkers enforce that subscribers accept T and that fire() is called with T, preventing mismatched handler signatures.",
  },
  {
    id: "py-b18-b5-pipeline-class",
    language: "python",
    title: "Pipeline class with operator overloading",
    tag: "classes",
    code: `from typing import TypeVar, Generic, Callable

A = TypeVar("A")
B = TypeVar("B")

class Pipeline(Generic[A]):
    def __init__(self, value: A):
        self._value = value

    def pipe(self, func: Callable[[A], B]) -> "Pipeline[B]":
        return Pipeline(func(self._value))

    def __or__(self, func: Callable[[A], B]) -> "Pipeline[B]":
        return self.pipe(func)

    def result(self) -> A:
        return self._value

result = (Pipeline("  hello world  ")
    | str.strip
    | str.title
    | (lambda s: s + "!")
).result()

print(result)  # Hello World!`,
    explanation: "Overloading | as a pipe operator creates an Elixir/F#-style pipeline; each step transforms the value through a function, keeping transformations linear and readable.",
  },
  {
    id: "py-b18-b5-registry-pattern",
    language: "python",
    title: "Registry pattern with class decorators",
    tag: "classes",
    code: `from typing import Callable, TypeVar

T = TypeVar("T")

class HandlerRegistry:
    def __init__(self):
        self._handlers: dict[str, Callable] = {}

    def register(self, name: str):
        def decorator(cls: type) -> type:
            self._handlers[name] = cls()
            return cls
        return decorator

    def dispatch(self, name: str, *args, **kwargs):
        h = self._handlers.get(name)
        if h is None:
            raise KeyError(f"No handler for '{name}'")
        return h.handle(*args, **kwargs)

registry = HandlerRegistry()

@registry.register("csv")
class CsvHandler:
    def handle(self, data): return f"CSV: {data}"

@registry.register("json")
class JsonHandler:
    def handle(self, data): return f"JSON: {data}"

print(registry.dispatch("csv", "a,b,c"))   # CSV: a,b,c
print(registry.dispatch("json", "{}"))     # JSON: {}`,
    explanation: "The Registry pattern maps string keys to handler instances via a decorator; new handlers self-register by applying @registry.register('key'), keeping registration co-located with the handler.",
  },
  {
    id: "py-b18-b5-dependency-injection",
    language: "python",
    title: "Simple dependency injection container",
    tag: "classes",
    code: `import inspect
from typing import Type, TypeVar

T = TypeVar("T")

class Container:
    def __init__(self):
        self._registry: dict[type, type | object] = {}

    def register(self, interface: type, implementation=None, *, singleton=False):
        if implementation is None:
            implementation = interface
        if singleton:
            self._registry[interface] = implementation()
        else:
            self._registry[interface] = implementation

    def resolve(self, cls: Type[T]) -> T:
        impl = self._registry.get(cls, cls)
        if isinstance(impl, cls): return impl   # singleton
        sig = inspect.signature(impl.__init__)
        deps = {p: self.resolve(t.annotation)
                for p, t in list(sig.parameters.items())[1:]
                if t.annotation is not inspect.Parameter.empty}
        return impl(**deps)

container = Container()
container.register(int, lambda: 42)`,
    explanation: "A minimal DI container resolves dependencies by inspecting __init__ type annotations; singleton=True instantiates once. This is the core mechanism that frameworks like FastAPI and pytest use.",
  },
  {
    id: "py-b18-b5-metaclass-registry",
    language: "python",
    title: "Metaclass for automatic subclass registry",
    tag: "classes",
    code: `class PluginMeta(type):
    _registry: dict[str, type] = {}

    def __init_subclass__(cls, /, name=None, **kwargs):
        # __init_subclass__ is cleaner than metaclass for simple registration
        super().__init_subclass__(**kwargs)
        if name:
            PluginMeta._registry[name] = cls

class Plugin:
    def __init_subclass__(cls, /, plugin_name=None, **kwargs):
        super().__init_subclass__(**kwargs)
        if plugin_name:
            PluginMeta._registry[plugin_name] = cls

class CsvPlugin(Plugin, plugin_name="csv"):
    def run(self): return "csv"

class JsonPlugin(Plugin, plugin_name="json"):
    def run(self): return "json"

print(PluginMeta._registry)  # {'csv': <class CsvPlugin>, 'json': <class JsonPlugin>}
print(PluginMeta._registry["csv"]().run())  # csv`,
    explanation: "__init_subclass__ is Python's clean hook for subclass registration; it's called on the parent class each time a subclass is defined, making automatic plugin registries without metaclasses.",
  },
  {
    id: "py-b18-b5-prototype-pattern",
    language: "python",
    title: "Prototype pattern with copy",
    tag: "classes",
    code: `import copy

class ConfigTemplate:
    def __init__(self, settings: dict):
        self.settings = settings
        self._callbacks = []  # not copied by default

    def clone(self) -> "ConfigTemplate":
        return copy.deepcopy(self)

    def with_setting(self, key, value) -> "ConfigTemplate":
        cloned = self.clone()
        cloned.settings[key] = value
        return cloned

base = ConfigTemplate({"timeout": 30, "retries": 3})
prod = base.with_setting("env", "production")
dev  = base.with_setting("env", "development").with_setting("timeout", 5)

print(base.settings)  # {'timeout': 30, 'retries': 3}
print(prod.settings)  # {..., 'env': 'production'}
print(dev.settings)   # {..., 'env': 'development', 'timeout': 5}`,
    explanation: "The Prototype pattern clones an existing object instead of constructing from scratch; combined with with_setting it creates a fluent configuration builder without mutating the original template.",
  },
];
