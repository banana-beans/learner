import type { Snippet } from "./types";

export const pythonSnippets20260510B5: Snippet[] = [
  // ── snippet ──────────────────────────────────────────────────────────────
  {
    id: "py-asyncio-semaphore",
    language: "python",
    title: "asyncio.Semaphore — limit concurrent operations",
    tag: "snippet",
    code: `import asyncio, httpx

async def fetch_limited(client: httpx.AsyncClient, url: str,
                         sem: asyncio.Semaphore) -> bytes:
    async with sem:            # at most 5 concurrent fetches
        r = await client.get(url)
        return r.content

async def main(urls: list[str]):
    sem = asyncio.Semaphore(5)
    async with httpx.AsyncClient() as client:
        results = await asyncio.gather(
            *[fetch_limited(client, u, sem) for u in urls])
    return results

asyncio.run(main(["https://example.com"] * 20))`,
    explanation:
      "asyncio.Semaphore limits the number of coroutines executing a critical section concurrently; async with acquires the semaphore (waiting if the limit is reached) and releases on exit.",
  },
  {
    id: "py-asyncio-event",
    language: "python",
    title: "asyncio.Event — signal between coroutines",
    tag: "snippet",
    code: `import asyncio

async def waiter(event: asyncio.Event):
    print("waiting...")
    await event.wait()
    print("event triggered!")

async def trigger(event: asyncio.Event):
    await asyncio.sleep(1)
    event.set()

async def main():
    ev = asyncio.Event()
    await asyncio.gather(waiter(ev), trigger(ev))

asyncio.run(main())`,
    explanation:
      "asyncio.Event has wait() that suspends until set() is called; unlike threading.Event, it works cooperatively — the waiting coroutine yields control while sleeping.",
  },
  {
    id: "py-functools-cached-property",
    language: "python",
    title: "functools.cached_property — lazy computed attribute",
    tag: "snippet",
    code: `from functools import cached_property
import statistics

class DataSet:
    def __init__(self, data: list[float]):
        self._data = data

    @cached_property
    def mean(self) -> float:
        print("computing mean...")
        return statistics.mean(self._data)

    @cached_property
    def stdev(self) -> float:
        return statistics.stdev(self._data)

ds = DataSet([1.0, 2.0, 3.0, 4.0])
print(ds.mean)   # "computing mean..." then 2.5
print(ds.mean)   # 2.5 (cached — no "computing" message)`,
    explanation:
      "cached_property computes the value once and stores it directly in the instance __dict__, bypassing the descriptor on subsequent access; it is not thread-safe — use threading.Lock for concurrent access.",
  },
  {
    id: "py-contextlib-redirect",
    language: "python",
    title: "contextlib.redirect_stdout — capture print output",
    tag: "snippet",
    code: `import io
from contextlib import redirect_stdout, redirect_stderr

def noisy_function():
    print("lots of output")
    print("more output")

# Capture stdout:
buf = io.StringIO()
with redirect_stdout(buf):
    noisy_function()

output = buf.getvalue()
print(repr(output))   # 'lots of output\\nmore output\\n'

# Suppress all output:
with redirect_stdout(io.StringIO()):
    noisy_function()`,
    explanation:
      "redirect_stdout temporarily replaces sys.stdout; captured output is available via StringIO.getvalue(); redirect_stderr works the same for error output — both are context managers.",
  },
  {
    id: "py-enum-str-enum",
    language: "python",
    title: "enum.StrEnum — string-valued enum (3.11+)",
    tag: "snippet",
    code: `from enum import StrEnum, auto

class Status(StrEnum):
    PENDING   = auto()   # "pending"
    RUNNING   = auto()   # "running"
    COMPLETED = auto()   # "completed"
    FAILED    = auto()   # "failed"

s = Status.PENDING
print(s)              # Status.PENDING
print(str(s))         # pending
print(s == "pending") # True  — behaves like a str

# Can use directly as dict key, URL path segment, etc.
url = f"/jobs/{Status.RUNNING}"
print(url)  # /jobs/running`,
    explanation:
      "StrEnum members ARE strings (no .value needed), so they work anywhere a str is expected; auto() generates lowercase names; ideal for API status fields and JSON serialisation.",
  },
  {
    id: "py-logging-structured",
    language: "python",
    title: "Structured logging with extra and custom formatter",
    tag: "snippet",
    code: `import logging, json

class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        data = {
            "time":    self.formatTime(record),
            "level":   record.levelname,
            "message": record.getMessage(),
            "module":  record.module,
        }
        if hasattr(record, "request_id"):
            data["request_id"] = record.request_id  # type: ignore
        return json.dumps(data)

handler = logging.StreamHandler()
handler.setFormatter(JsonFormatter())
logger = logging.getLogger("app")
logger.addHandler(handler); logger.setLevel(logging.DEBUG)

logger.info("Request received", extra={"request_id": "abc-123"})`,
    explanation:
      "Custom formatters produce machine-readable log lines; the extra dict injects arbitrary fields into the LogRecord; JSON logs integrate directly with log aggregators like Splunk and Loki.",
  },
  {
    id: "py-threading-local",
    language: "python",
    title: "threading.local — per-thread storage",
    tag: "snippet",
    code: `import threading

local = threading.local()

def worker(name: str):
    local.user = name           # stored per-thread
    import time; time.sleep(0.01)
    print(f"{threading.current_thread().name}: {local.user}")

threads = [threading.Thread(target=worker, args=(n,), name=n)
           for n in ["Alice", "Bob", "Carol"]]
for t in threads: t.start()
for t in threads: t.join()
# Each thread sees its own user — no cross-contamination`,
    explanation:
      "threading.local() creates a namespace where each attribute is independent per thread; useful for request-scoped data in multi-threaded web frameworks without passing context through every call.",
  },
  {
    id: "py-inspect-signature",
    language: "python",
    title: "inspect.signature — introspect function parameters",
    tag: "snippet",
    code: `import inspect

def greet(name: str, *, greeting: str = "Hello") -> str:
    return f"{greeting}, {name}"

sig = inspect.signature(greet)
for pname, param in sig.parameters.items():
    print(pname, param.kind.name, param.default)

# bind arguments dynamically:
bound = sig.bind("Alice", greeting="Hi")
bound.apply_defaults()
print(bound.arguments)  # {'name': 'Alice', 'greeting': 'Hi'}`,
    explanation:
      "inspect.signature enables generic decorators and frameworks to introspect expected arguments; bind() validates and maps positional + keyword arguments to parameter names.",
  },
  {
    id: "py-ast-parse",
    language: "python",
    title: "ast.parse — inspect Python code as a tree",
    tag: "snippet",
    code: `import ast

source = """
x = 1 + 2
print(x * 3)
"""

tree = ast.parse(source)
print(ast.dump(tree, indent=2))

# Find all function calls:
class CallFinder(ast.NodeVisitor):
    def visit_Call(self, node: ast.Call):
        if isinstance(node.func, ast.Name):
            print(f"call: {node.func.id}()")
        self.generic_visit(node)

CallFinder().visit(tree)`,
    explanation:
      "ast.parse returns an AST that NodeVisitor subclasses can traverse; NodeTransformer modifies the tree; use ast.unparse to emit modified code back as a string.",
  },
  {
    id: "py-warnings-warn",
    language: "python",
    title: "warnings.warn — controlled deprecation notices",
    tag: "snippet",
    code: `import warnings

def old_api(x):
    warnings.warn(
        "old_api is deprecated, use new_api instead",
        DeprecationWarning,
        stacklevel=2    # points to caller, not this function
    )
    return new_api(x)

def new_api(x):
    return x * 2

# Callers can filter:
warnings.filterwarnings("error", category=DeprecationWarning)  # turn into exception
warnings.filterwarnings("ignore", module="third_party.*")`,
    explanation:
      "stacklevel=2 makes the warning point at the caller's source line, not inside the deprecated function; filters let users escalate deprecations to errors or suppress noisy third-party ones.",
  },

  // ── understanding ─────────────────────────────────────────────────────────
  {
    id: "py-understand-bytes-str",
    language: "python",
    title: "bytes vs str — explicit encoding boundary",
    tag: "understanding",
    code: `# str: Unicode text, no encoding
text: str = "café"
print(len(text))          # 4 — code points

# bytes: raw binary data, has encoding
raw: bytes = text.encode("utf-8")
print(len(raw))           # 5 — bytes (é is 2 bytes in UTF-8)

# Decode back with the same codec:
print(raw.decode("utf-8"))  # "café"

# Never mix:
# text + raw   # TypeError
# raw.find(text) # TypeError — must encode or decode first`,
    explanation:
      "In Python 3 str is always Unicode; bytes is always binary — there is no implicit conversion. Always encode at the system boundary (files, sockets) and decode when reading back.",
  },
  {
    id: "py-understand-truthiness",
    language: "python",
    title: "Truthiness — what evaluates to False",
    tag: "understanding",
    code: `# All of these are falsy:
falsy = [None, False, 0, 0.0, 0j, "", b"", [], (), {}, set(), range(0)]
for f in falsy:
    assert not bool(f), f"Expected falsy: {f!r}"

# Custom class:
class Empty:
    def __bool__(self): return False
    # Or: def __len__(self): return 0

# CAVEAT: numpy arrays with one element are ambiguous:
# import numpy as np; if np.array([0]): pass  # ValueError`,
    explanation:
      "Python's truthiness check calls __bool__ then __len__; any zero-length collection, zero numeric value, or None is falsy; custom classes control this via __bool__ or __len__.",
  },
  {
    id: "py-understand-import-system",
    language: "python",
    title: "Import system — sys.modules, finders, loaders",
    tag: "understanding",
    code: `import sys

# sys.modules is the module cache — import checks here first
print("json" in sys.modules)   # True after first import json

# Importing again is a cache hit — no re-execution:
import json
import json   # no-op

# __import__ is the low-level hook:
mod = __import__("os.path", fromlist=["join"])

# importlib.import_module is the documented public API:
import importlib
pathlib = importlib.import_module("pathlib")`,
    explanation:
      "Every import is first looked up in sys.modules; if found, the cached module object is returned; importers find and load modules only on the first import; removing from sys.modules forces re-import.",
  },
  {
    id: "py-understand-match-statement",
    language: "python",
    title: "match statement — structural pattern matching (3.10+)",
    tag: "understanding",
    code: `def process(command: dict):
    match command:
        case {"action": "move", "direction": dir}:
            print(f"move {dir}")
        case {"action": "attack", "target": t, "power": p}:
            print(f"attack {t} with power {p}")
        case {"action": action}:
            print(f"unknown action: {action}")
        case _:
            print("invalid command")

process({"action": "move", "direction": "north"})
process({"action": "attack", "target": "goblin", "power": 10})`,
    explanation:
      "match/case matches values structurally; dict patterns match subsets (not requiring all keys); binding variables (dir, t, p) extracts matched values; _ is the wildcard catch-all.",
  },
  {
    id: "py-understand-protocol-structural",
    language: "python",
    title: "Protocol vs ABC — structural vs nominal typing",
    tag: "understanding",
    code: `from typing import Protocol
from abc import ABC, abstractmethod

# ABC — nominal: must explicitly inherit
class Drawable(ABC):
    @abstractmethod
    def draw(self): ...

# Protocol — structural: satisfied by any class with draw()
class Renderable(Protocol):
    def draw(self) -> None: ...

class Widget:   # does NOT inherit from either
    def draw(self): print("drawing")

# Protocol is satisfied implicitly:
def render(d: Renderable): d.draw()
render(Widget())    # OK — duck typing with type checker support

# ABC requires inheritance:
isinstance(Widget(), Drawable)   # False — not registered`,
    explanation:
      "Protocols enable structural (duck) typing checked statically by type checkers; ABCs require explicit registration or inheritance for isinstance to return True — use Protocols for broad interface definitions.",
  },

  // ── structures ────────────────────────────────────────────────────────────
  {
    id: "py-sortedcontainers",
    language: "python",
    title: "sortedcontainers.SortedList — always-sorted list",
    tag: "structures",
    code: `from sortedcontainers import SortedList, SortedDict, SortedSet

sl = SortedList([5, 1, 3, 2, 4])
sl.add(0)
print(sl)          # SortedList([0, 1, 2, 3, 4, 5])
sl.discard(3)
print(sl.bisect_left(4))   # 3 — insertion point for 4

sd = SortedDict(b=2, a=1, c=3)
print(list(sd.keys()))    # ['a', 'b', 'c']
print(sd.peekitem(0))     # ('a', 1) — first item`,
    explanation:
      "sortedcontainers (pure Python, no C extensions) maintains sorted order on every mutation; O(log n) add/discard with O(1) indexed access makes it a powerful sorted collection library.",
  },
  {
    id: "py-trie",
    language: "python",
    title: "Trie — prefix tree for autocomplete",
    tag: "structures",
    code: `class TrieNode:
    def __init__(self):
        self.children: dict[str, "TrieNode"] = {}
        self.is_end = False

class Trie:
    def __init__(self): self.root = TrieNode()

    def insert(self, word: str):
        node = self.root
        for ch in word:
            node = node.children.setdefault(ch, TrieNode())
        node.is_end = True

    def starts_with(self, prefix: str) -> bool:
        node = self.root
        for ch in prefix:
            if ch not in node.children: return False
            node = node.children[ch]
        return True

t = Trie()
for w in ["apple", "app", "application"]: t.insert(w)
print(t.starts_with("app"))   # True
print(t.starts_with("apt"))   # False`,
    explanation:
      "A trie stores words character-by-character; each path from root to an is_end node spells a word; prefix search is O(m) where m is prefix length, making it ideal for autocomplete.",
  },
  {
    id: "py-lru-cache-manual",
    language: "python",
    title: "Manual LRU cache with OrderedDict",
    tag: "structures",
    code: `from collections import OrderedDict

class LRUCache:
    def __init__(self, capacity: int):
        self.cap = capacity
        self.cache: OrderedDict = OrderedDict()

    def get(self, key):
        if key not in self.cache: return -1
        self.cache.move_to_end(key)   # mark as recently used
        return self.cache[key]

    def put(self, key, value):
        if key in self.cache:
            self.cache.move_to_end(key)
        self.cache[key] = value
        if len(self.cache) > self.cap:
            self.cache.popitem(last=False)  # evict least recently used

lru = LRUCache(3)
lru.put(1, "a"); lru.put(2, "b"); lru.put(3, "c")
lru.get(1)           # access 1 — it becomes MRU
lru.put(4, "d")      # evicts 2 (LRU)
print(lru.get(2))    # -1`,
    explanation:
      "OrderedDict tracks insertion order; move_to_end marks an entry as recently used; popitem(last=False) removes the oldest (least recently used) entry when capacity is exceeded.",
  },
  {
    id: "py-segment-tree",
    language: "python",
    title: "Segment tree — range query in O(log n)",
    tag: "structures",
    code: `class SegTree:
    def __init__(self, data: list[int]):
        n = len(data)
        self.n = n
        self.tree = [0] * (2 * n)
        # Build leaf nodes
        for i, v in enumerate(data):
            self.tree[n + i] = v
        # Build internal nodes
        for i in range(n - 1, 0, -1):
            self.tree[i] = self.tree[2*i] + self.tree[2*i+1]

    def update(self, i: int, val: int):
        i += self.n; self.tree[i] = val
        while i > 1:
            i //= 2; self.tree[i] = self.tree[2*i] + self.tree[2*i+1]

    def query(self, l: int, r: int) -> int:  # [l, r)
        l += self.n; r += self.n; s = 0
        while l < r:
            if l & 1: s += self.tree[l]; l += 1
            if r & 1: r -= 1; s += self.tree[r]
            l >>= 1; r >>= 1
        return s

st = SegTree([1, 3, 5, 7, 9])
print(st.query(1, 4))   # 3+5+7 = 15`,
    explanation:
      "The iterative segment tree stores 2n nodes in an array; leaves are at [n..2n); internal nodes aggregate children; both update and range-sum query run in O(log n).",
  },
  {
    id: "py-union-find",
    language: "python",
    title: "Union-Find (Disjoint Set Union) with path compression",
    tag: "structures",
    code: `class UnionFind:
    def __init__(self, n: int):
        self.parent = list(range(n))
        self.rank   = [0] * n

    def find(self, x: int) -> int:
        if self.parent[x] != x:
            self.parent[x] = self.find(self.parent[x])  # path compression
        return self.parent[x]

    def union(self, a: int, b: int) -> bool:
        ra, rb = self.find(a), self.find(b)
        if ra == rb: return False   # already connected
        if self.rank[ra] < self.rank[rb]: ra, rb = rb, ra
        self.parent[rb] = ra
        if self.rank[ra] == self.rank[rb]: self.rank[ra] += 1
        return True

uf = UnionFind(5)
uf.union(0, 1); uf.union(1, 2)
print(uf.find(0) == uf.find(2))   # True — connected
print(uf.find(0) == uf.find(3))   # False`,
    explanation:
      "Path compression flattens the tree during find; union by rank keeps the tree shallow; together they give near-O(1) amortised operations — essential for Kruskal's MST and connected components.",
  },

  // ── caveats ───────────────────────────────────────────────────────────────
  {
    id: "py-caveat-positional-only",
    language: "python",
    title: "Positional-only parameters with / in signatures",
    tag: "caveats",
    code: `def move(x, y, /, *, speed=1):
    # x and y are positional-only (cannot use as keywords)
    # speed is keyword-only
    return x, y, speed

move(1, 2)          # OK
move(1, 2, speed=5) # OK
# move(x=1, y=2)   # TypeError — positional-only params!

# Why: avoid breaking callers if you rename x to dx later
# Used in many builtins: range(stop) — stop is positional-only`,
    explanation:
      "Parameters before / are positional-only; callers cannot use them as keyword arguments; this lets library authors rename parameters without breaking call sites that use them positionally.",
  },
  {
    id: "py-caveat-async-def-is-not-run",
    language: "python",
    title: "Calling async def returns a coroutine, not a result",
    tag: "caveats",
    code: `import asyncio

async def fetch(url: str) -> str:
    await asyncio.sleep(0.1)
    return f"data from {url}"

# WRONG — this just creates a coroutine object:
result = fetch("https://example.com")
print(result)   # <coroutine object fetch at 0x...>
# RuntimeWarning: coroutine 'fetch' was never awaited

# CORRECT — must await:
result = asyncio.run(fetch("https://example.com"))
print(result)   # data from https://example.com`,
    explanation:
      "async def functions return a coroutine object when called; the code inside does not run until the coroutine is awaited; forgetting await is a common silent bug that produces RuntimeWarning.",
  },
  {
    id: "py-caveat-pep563-annotations",
    language: "python",
    title: "from __future__ import annotations — strings everywhere",
    tag: "caveats",
    code: `from __future__ import annotations   # PEP 563 — all annotations become strings

def greet(name: str) -> str:          # 'str' is stored as a string literal
    return f"Hello, {name}"

import inspect
hints = inspect.get_annotations(greet)
print(hints)   # {'name': 'str', 'return': 'str'} — strings, not types

# typing.get_type_hints() resolves them:
from typing import get_type_hints
print(get_type_hints(greet))  # {'name': <class 'str'>, 'return': <class 'str'>}`,
    explanation:
      "PEP 563 defers annotation evaluation — annotations are stored as strings for performance; code that reads __annotations__ directly (e.g., some frameworks) may get strings instead of types and needs get_type_hints() to resolve them.",
  },
  {
    id: "py-caveat-negative-index",
    language: "python",
    title: "Negative index -0 is the same as 0",
    tag: "caveats",
    code: `lst = [1, 2, 3, 4, 5]
print(lst[-1])   # 5 — last element (expected)
print(lst[-0])   # 1 — same as lst[0]! (-0 == 0 in Python)

# This catches people when computing offset from end:
def kth_from_end(lst, k):
    return lst[-k]     # WRONG when k == 0

def kth_from_end_safe(lst, k):
    if k == 0:
        raise ValueError("k must be >= 1")
    return lst[-k]`,
    explanation:
      "Because -0 == 0 in Python (and all floating-point systems), lst[-0] accesses the first element — always validate that a computed negative index is not 0 before using it.",
  },
  {
    id: "py-caveat-chained-comparison",
    language: "python",
    title: "Chained comparison — not the same as C/Java &&",
    tag: "caveats",
    code: `x = 5
# Python: chained comparison (mathematical range check)
print(1 < x < 10)    # True — equivalent to (1 < x) and (x < 10)
print(1 < x > 3)     # True — (1 < x) and (x > 3)

# C/Java: each sub-expression evaluates to bool then anded
# In Java: (1 < x) && (x < 10) — same logic, different syntax

# Subtle gotcha:
a = 3; b = 3
print(a is b is 3)   # True? — (a is b) and (b is 3)
# Works for small ints due to interning but rely on == not is`,
    explanation:
      "Python's chained comparisons are mathematically intuitive but evaluate each middle operand only once; equivalent to (a < b) and (b < c) — more efficient and readable than separate conditions.",
  },

  // ── types ─────────────────────────────────────────────────────────────────
  {
    id: "py-type-generic-class",
    language: "python",
    title: "Generic class with TypeVar (pre-3.12)",
    tag: "types",
    code: `from typing import TypeVar, Generic

T = TypeVar("T")

class Stack(Generic[T]):
    def __init__(self) -> None:
        self._items: list[T] = []

    def push(self, item: T) -> None:
        self._items.append(item)

    def pop(self) -> T:
        if not self._items:
            raise IndexError("empty stack")
        return self._items.pop()

    def __len__(self) -> int:
        return len(self._items)

s: Stack[int] = Stack()
s.push(1); s.push(2)
print(s.pop())   # 2`,
    explanation:
      "Generic[T] creates a parameterised class; type checkers enforce T consistency (pushing int into Stack[int] is fine, pushing str is a type error); the Python 3.12 syntax is 'class Stack[T]'.",
  },
  {
    id: "py-type-intersection",
    language: "python",
    title: "Intersection-like types with multiple Protocol inheritance",
    tag: "types",
    code: `from typing import Protocol

class Readable(Protocol):
    def read(self) -> bytes: ...

class Seekable(Protocol):
    def seek(self, offset: int) -> None: ...

class ReadableSeekable(Readable, Seekable, Protocol):
    pass   # combines both protocols

def process(stream: ReadableSeekable) -> bytes:
    stream.seek(0)
    return stream.read()

import io
process(io.BytesIO(b"data"))   # OK — BytesIO satisfies both`,
    explanation:
      "Python has no dedicated intersection type; combining Protocols via multiple inheritance achieves the same effect — the combined protocol requires all methods from all parents.",
  },
  {
    id: "py-type-dataclass-frozen",
    language: "python",
    title: "frozen=True dataclass — immutable, hashable",
    tag: "types",
    code: `from dataclasses import dataclass

@dataclass(frozen=True)
class Point:
    x: float
    y: float

p = Point(1.0, 2.0)
# p.x = 3.0   # FrozenInstanceError — cannot mutate

# Hashable — can be dict key or set member:
d = {p: "origin region"}
s = {Point(0, 0), Point(1, 0)}

# with expression (like record with):
import dataclasses
moved = dataclasses.replace(p, x=p.x + 1)
print(moved)   # Point(x=2.0, y=2.0)`,
    explanation:
      "frozen=True makes assignment to any field raise FrozenInstanceError at runtime and generates __hash__ so instances can be used in sets and as dict keys; dataclasses.replace creates a modified copy.",
  },
  {
    id: "py-type-newtype",
    language: "python",
    title: "NewType — distinct type wrapper for type safety",
    tag: "types",
    code: `from typing import NewType

UserId   = NewType("UserId",   int)
OrderId  = NewType("OrderId",  int)

def get_user(uid: UserId) -> str: return f"user-{uid}"

uid = UserId(42)
oid = OrderId(42)

get_user(uid)   # OK
# get_user(oid) # type error — OrderId is not UserId
# get_user(42)  # type error — plain int is not UserId

# At runtime, NewType is the identity function:
print(type(uid))   # <class 'int'>`,
    explanation:
      "NewType creates a type alias that is distinct from the base type for checkers but identical at runtime; it prevents accidentally passing an OrderId where a UserId is expected without any runtime overhead.",
  },

  // ── families ──────────────────────────────────────────────────────────────
  {
    id: "py-family-string-formatting",
    language: "python",
    title: "String formatting: % vs .format() vs f-strings vs Template",
    tag: "families",
    code: `name = "Alice"; score = 99.5

# %-formatting (old, C-style)
print("Hello %s, score: %.1f" % (name, score))

# str.format() (Python 2.6+, explicit indexing)
print("Hello {0}, score: {1:.1f}".format(name, score))

# f-string (Python 3.6+, fastest, most readable)
print(f"Hello {name}, score: {score:.1f}")

# Template strings — safe for user-provided format strings
from string import Template
t = Template("Hello $name!")
print(t.substitute(name=name))   # no arbitrary expressions — safe`,
    explanation:
      "Prefer f-strings for their readability and performance; use Template when the format string comes from user input — it prevents arbitrary expression execution unlike f-strings.",
  },
  {
    id: "py-family-file-io",
    language: "python",
    title: "File I/O: open vs pathlib vs shutil vs fileinput",
    tag: "families",
    code: `from pathlib import Path
import shutil, fileinput

# open() — explicit resource management
with open("data.txt", "r", encoding="utf-8") as f:
    content = f.read()

# pathlib — one-liners for common operations
text = Path("data.txt").read_text(encoding="utf-8")
Path("out.txt").write_text(text.upper(), encoding="utf-8")

# shutil — high-level file operations
shutil.copy("src.txt", "dst.txt")
shutil.copytree("src/", "dst/")
shutil.move("old.txt", "new.txt")
shutil.rmtree("tmp/")

# fileinput — process files or stdin line by line
for line in fileinput.input(files=("a.txt", "b.txt")):
    print(line, end="")`,
    explanation:
      "Use pathlib for modern code (read/write text, glob); open() for streaming/binary; shutil for tree copies and moves; fileinput for scripts that process multiple files or stdin like Unix tools.",
  },
  {
    id: "py-family-packaging",
    language: "python",
    title: "Python packaging: setup.py vs pyproject.toml vs poetry vs uv",
    tag: "families",
    code: `# setup.py (legacy, setuptools)
# from setuptools import setup
# setup(name="mypackage", ...)

# pyproject.toml (PEP 517/518, modern standard)
# [build-system]
# requires = ["setuptools", "wheel"]
# [project]
# name = "mypackage"
# version = "1.0.0"
# dependencies = ["requests>=2.28"]

# poetry — all-in-one dependency manager + build tool
# $ poetry add requests
# $ poetry publish

# uv — ultra-fast resolver (Rust-based), compatible with pip
# $ uv pip install requests
# $ uv venv && uv sync`,
    explanation:
      "pyproject.toml is the modern PEP 517 standard; poetry adds dependency resolution and virtual env management; uv provides pip-compatible tooling with much faster resolution; avoid setup.py in new projects.",
  },
  {
    id: "py-family-metaclasses",
    language: "python",
    title: "Metaclass use cases — when ABCMeta isn't enough",
    tag: "families",
    code: `# ABCMeta — abstract methods enforcement
from abc import ABCMeta, abstractmethod

# Singleton — one instance per class
class SingletonMeta(type):
    _instances: dict = {}
    def __call__(cls, *a, **kw):
        if cls not in cls._instances:
            cls._instances[cls] = super().__call__(*a, **kw)
        return cls._instances[cls]

# Registry — auto-register subclasses
class RegistryMeta(type):
    registry: dict = {}
    def __new__(mcs, name, bases, ns):
        cls = super().__new__(mcs, name, bases, ns)
        if bases: mcs.registry[name] = cls
        return cls

# __init_subclass__ covers 80% of metaclass use cases more simply`,
    explanation:
      "ABCMeta enforces abstract methods; SingletonMeta ensures one instance; RegistryMeta auto-registers subclasses; __init_subclass__ (Python 3.6+) achieves most of these without metaclass boilerplate.",
  },

  // ── classes ───────────────────────────────────────────────────────────────
  {
    id: "py-class-dependency-injection",
    language: "python",
    title: "Constructor injection — testable dependencies",
    tag: "classes",
    code: `from abc import ABC, abstractmethod

class EmailSender(ABC):
    @abstractmethod
    def send(self, to: str, body: str) -> None: ...

class SmtpSender(EmailSender):
    def send(self, to, body): print(f"SMTP → {to}: {body}")

class FakeSender(EmailSender):
    def __init__(self): self.sent: list[tuple] = []
    def send(self, to, body): self.sent.append((to, body))

class UserService:
    def __init__(self, email: EmailSender):
        self._email = email   # injected dependency

    def register(self, email: str):
        self._email.send(email, "Welcome!")

# Test:
fake = FakeSender()
UserService(fake).register("a@b.com")
assert fake.sent == [("a@b.com", "Welcome!")]`,
    explanation:
      "Injecting dependencies through the constructor makes classes testable without subclassing or monkey-patching; swap SmtpSender for FakeSender in tests without touching the class under test.",
  },
  {
    id: "py-class-mixin-logging",
    language: "python",
    title: "Logging mixin — add logger to any class",
    tag: "classes",
    code: `import logging

class LogMixin:
    @property
    def logger(self) -> logging.Logger:
        name = f"{self.__class__.__module__}.{self.__class__.__qualname__}"
        return logging.getLogger(name)

class UserService(LogMixin):
    def create(self, name: str):
        self.logger.info("Creating user: %s", name)
        # business logic
        self.logger.debug("User created: %s", name)

class OrderService(LogMixin):
    def place(self, order_id: int):
        self.logger.info("Placing order: %d", order_id)`,
    explanation:
      "The mixin creates a logger named after the actual class (not the mixin), so log messages show UserService not LogMixin; using a property avoids storing the logger as an instance attribute.",
  },
  {
    id: "py-class-repr-rich",
    language: "python",
    title: "Rich __repr__ and __str__ for debuggability",
    tag: "classes",
    code: `class Matrix:
    def __init__(self, data: list[list[float]]):
        self.data = data
        self.rows = len(data)
        self.cols = len(data[0]) if data else 0

    def __repr__(self) -> str:
        # Unambiguous, eval()-able representation
        return f"Matrix({self.data!r})"

    def __str__(self) -> str:
        # Human-readable
        rows = ["[" + " ".join(f"{v:6.2f}" for v in row) + "]"
                for row in self.data]
        return "\\n".join(rows)

m = Matrix([[1, 2], [3, 4]])
print(repr(m))   # Matrix([[1, 2], [3, 4]])
print(m)         # [  1.00   2.00]
                 # [  3.00   4.00]`,
    explanation:
      "__repr__ should be unambiguous and ideally eval()-able back to an equivalent object; __str__ is for human display; when only __repr__ is defined, str() falls back to it.",
  },
  {
    id: "py-class-context-manager-reusable",
    language: "python",
    title: "Reusable context manager class with state",
    tag: "classes",
    code: `import time

class Timer:
    def __init__(self, name: str = ""):
        self.name      = name
        self.elapsed   = 0.0
        self._start    = 0.0

    def __enter__(self) -> "Timer":
        self._start = time.perf_counter()
        return self

    def __exit__(self, *exc) -> bool:
        self.elapsed = time.perf_counter() - self._start
        if self.name:
            print(f"{self.name}: {self.elapsed:.4f}s")
        return False   # do not suppress exceptions

with Timer("load") as t:
    time.sleep(0.01)
print(t.elapsed)   # ~0.01`,
    explanation:
      "__enter__ returns self so the as clause gets the Timer instance; __exit__ returning False re-raises any exception; the elapsed attribute is available after the block exits.",
  },
  {
    id: "py-class-enum-behaviour",
    language: "python",
    title: "Enum with methods and properties",
    tag: "classes",
    code: `from enum import Enum

class Planet(Enum):
    MERCURY = (3.303e+23, 2.4397e6)
    VENUS   = (4.869e+24, 6.0518e6)
    EARTH   = (5.976e+24, 6.37814e6)

    def __init__(self, mass: float, radius: float):
        self.mass   = mass
        self.radius = radius

    @property
    def surface_gravity(self) -> float:
        G = 6.67430e-11
        return G * self.mass / self.radius ** 2

    def surface_weight(self, earth_weight: float) -> float:
        return earth_weight * self.surface_gravity / Planet.EARTH.surface_gravity

print(Planet.MARS.surface_weight(75))  # AttributeError — MARS not defined`,
    explanation:
      "Enum can have __init__, properties, and methods; each member's value tuple is unpacked into __init__ parameters; methods can use the member's own data to compute derived values.",
  },
  {
    id: "py-class-factory-function",
    language: "python",
    title: "Factory function vs class — choosing the right abstraction",
    tag: "classes",
    code: `# Factory function — simpler, sufficient for one output type
def make_connection(host: str, port: int, ssl: bool):
    if ssl:
        return SecureConnection(host, port)
    return PlainConnection(host, port)

# Factory method — polymorphic, subclassable
class Connection:
    @classmethod
    def create(cls, host: str, port: int, ssl: bool):
        klass = SecureConnection if ssl else PlainConnection
        return klass(host, port)

# Abstract factory — family of related objects (see abstract-factory snippet)

# Use factory function for simple creation; factory method or abstract
# factory when you need polymorphic or family-based creation.`,
    explanation:
      "Factory functions are the simplest form and cover most use cases; factory methods add polymorphism so subclasses can override creation; abstract factories coordinate multiple related factories.",
  },
  {
    id: "py-class-slots-performance",
    language: "python",
    title: "__slots__ in a performance-critical class",
    tag: "classes",
    code: `import sys

class Vector3:
    __slots__ = ("x", "y", "z")
    def __init__(self, x: float, y: float, z: float):
        self.x = x; self.y = y; self.z = z

    def magnitude(self) -> float:
        return (self.x**2 + self.y**2 + self.z**2) ** 0.5

    def __add__(self, other: "Vector3") -> "Vector3":
        return Vector3(self.x + other.x, self.y + other.y, self.z + other.z)

v1 = Vector3(1, 2, 3)
v2 = Vector3(4, 5, 6)
print((v1 + v2).magnitude())
print(sys.getsizeof(v1))   # ~56 bytes vs ~232 with __dict__`,
    explanation:
      "__slots__ is most beneficial in classes instantiated millions of times; each instance saves ~200 bytes of __dict__ overhead; attribute access is also slightly faster via C-level descriptor.",
  },
];
