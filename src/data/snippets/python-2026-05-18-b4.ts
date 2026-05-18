import type { Snippet } from "./types";

export const pythonSnippets20260518B4: Snippet[] = [
  // --- snippet ---
  {
    id: "py-b18-b4-struct-pack",
    language: "python",
    title: "struct.pack for binary serialization",
    tag: "snippet",
    code: `import struct

# Pack: >HI = big-endian unsigned short + unsigned int
data = struct.pack(">HI", 256, 1048576)
print(data.hex())          # 010000100000

# Unpack back
version, offset = struct.unpack(">HI", data)
print(version, offset)     # 256 1048576

# calcsize
print(struct.calcsize(">HI"))  # 6 bytes`,
    explanation: "struct.pack serializes Python values into binary bytes using format strings; >HI means big-endian unsigned short (2 bytes) + unsigned int (4 bytes), matching C struct layouts.",
  },
  {
    id: "py-b18-b4-csv-dictreader",
    language: "python",
    title: "csv.DictReader for structured CSV parsing",
    tag: "snippet",
    code: `import csv
import io

data = """name,age,city
Alice,30,NYC
Bob,25,LA
Carol,35,Chicago"""

reader = csv.DictReader(io.StringIO(data))
for row in reader:
    print(f"{row['name']} lives in {row['city']}")

# Writing
output = io.StringIO()
writer = csv.DictWriter(output, fieldnames=["name", "age", "city"])
writer.writeheader()
writer.writerow({"name": "Dave", "age": 28, "city": "Austin"})
print(output.getvalue())`,
    explanation: "DictReader yields each row as a dict keyed by the header names; DictWriter writes dicts as CSV rows — both handle quoting and escaping automatically.",
  },
  {
    id: "py-b18-b4-json-custom-encoder",
    language: "python",
    title: "Custom JSON encoder/decoder",
    tag: "snippet",
    code: `import json
from datetime import datetime, date

class DateEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (datetime, date)):
            return obj.isoformat()
        return super().default(obj)

payload = {"created": datetime(2026, 5, 18, 12, 0), "count": 5}
encoded = json.dumps(payload, cls=DateEncoder)
print(encoded)  # {"created": "2026-05-18T12:00:00", "count": 5}

# Decoder hook
def decode_dates(d):
    for k, v in d.items():
        try:
            d[k] = datetime.fromisoformat(v)
        except (TypeError, ValueError):
            pass
    return d

decoded = json.loads(encoded, object_hook=decode_dates)
print(type(decoded["created"]))  # <class 'datetime.datetime'>`,
    explanation: "Subclassing JSONEncoder lets you serialize custom types; object_hook in json.loads allows deserializing JSON objects back into custom Python types.",
  },
  {
    id: "py-b18-b4-functools-reduce",
    language: "python",
    title: "functools.reduce for fold operations",
    tag: "snippet",
    code: `from functools import reduce
from operator import mul

# Product of a list
nums = [1, 2, 3, 4, 5]
product = reduce(mul, nums)
print(product)  # 120

# Flatten nested lists
nested = [[1, 2], [3, 4], [5, 6]]
flat = reduce(lambda acc, x: acc + x, nested, [])
print(flat)  # [1, 2, 3, 4, 5, 6]

# Max without max()
mx = reduce(lambda a, b: a if a > b else b, nums)
print(mx)  # 5`,
    explanation: "functools.reduce applies a function cumulatively to a sequence (left fold); the optional initial value handles empty sequences. Use it when you need a single value from a sequence.",
  },
  {
    id: "py-b18-b4-contextlib-redirect",
    language: "python",
    title: "contextlib.redirect_stdout for output capture",
    tag: "snippet",
    code: `import io
import contextlib

output = io.StringIO()

with contextlib.redirect_stdout(output):
    print("Hello, World!")
    print("Second line")

captured = output.getvalue()
print(repr(captured))   # 'Hello, World!\\nSecond line\\n'

# Suppress output entirely
with contextlib.redirect_stdout(io.StringIO()):
    print("this disappears")`,
    explanation: "redirect_stdout temporarily replaces sys.stdout; combined with StringIO it captures print output for testing or processing without touching the original stream.",
  },
  {
    id: "py-b18-b4-itertools-accumulate",
    language: "python",
    title: "itertools.accumulate for running totals",
    tag: "snippet",
    code: `from itertools import accumulate
import operator

nums = [1, 2, 3, 4, 5]

# Running sum (default)
print(list(accumulate(nums)))           # [1, 3, 6, 10, 15]

# Running product
print(list(accumulate(nums, operator.mul)))  # [1, 2, 6, 24, 120]

# Running maximum
print(list(accumulate(nums, max)))      # [1, 2, 3, 4, 5]

# With initial value (Python 3.8+)
print(list(accumulate(nums, initial=100)))  # [100, 101, 103, 106, 110, 115]`,
    explanation: "itertools.accumulate produces a running aggregate; it generalizes cumsum to any binary function. The initial parameter prepends a seed value to the output.",
  },
  {
    id: "py-b18-b4-pathlib-write",
    language: "python",
    title: "pathlib write_text and read_text",
    tag: "snippet",
    code: `from pathlib import Path
import tempfile

with tempfile.TemporaryDirectory() as tmp:
    p = Path(tmp) / "notes.txt"

    # Write
    p.write_text("Hello, pathlib!\\nLine 2\\n", encoding="utf-8")

    # Read
    content = p.read_text(encoding="utf-8")
    print(content)

    # Bytes
    p.write_bytes(b"\\x00\\x01\\x02")
    print(p.read_bytes().hex())  # 000102`,
    explanation: "pathlib.Path.write_text/read_text handle opening, encoding, writing, and closing in one call; write_bytes/read_bytes do the same for binary data.",
  },
  {
    id: "py-b18-b4-dataclass-kw-only",
    language: "python",
    title: "dataclass with kw_only fields",
    tag: "snippet",
    code: `from dataclasses import dataclass, field

@dataclass
class Config:
    host: str
    port: int = field(default=8080, kw_only=True)   # Python 3.10+
    debug: bool = field(default=False, kw_only=True)

# port and debug must be keyword arguments
c = Config("localhost", port=5000, debug=True)
print(c)

# @dataclass(kw_only=True) makes all fields keyword-only
@dataclass(kw_only=True)
class StrictConfig:
    host: str
    port: int = 8080`,
    explanation: "kw_only=True on a field (or the whole dataclass) requires callers to pass that argument by name, preventing positional argument order confusion in large dataclasses.",
  },
  {
    id: "py-b18-b4-decimal-precision",
    language: "python",
    title: "decimal.Decimal for exact arithmetic",
    tag: "snippet",
    code: `from decimal import Decimal, getcontext

# Float imprecision
print(0.1 + 0.2)                    # 0.30000000000000004

# Exact decimal
a = Decimal("0.1")
b = Decimal("0.2")
print(a + b)                        # 0.3

# Set precision
getcontext().prec = 50
result = Decimal(1) / Decimal(3)
print(result)  # 0.33333333333333333333333333333333333333333333333333

# Financial rounding
from decimal import ROUND_HALF_UP
amount = Decimal("19.995")
print(amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))  # 20.00`,
    explanation: "decimal.Decimal provides exact base-10 arithmetic without binary floating-point rounding errors; essential for financial calculations where 0.1 + 0.2 must equal exactly 0.3.",
  },
  {
    id: "py-b18-b4-collections-defaultdict-nested",
    language: "python",
    title: "Nested defaultdict for multi-level grouping",
    tag: "snippet",
    code: `from collections import defaultdict

# Infinitely nestable defaultdict factory
def nested_dict():
    return defaultdict(nested_dict)

data = nested_dict()
data["US"]["CA"]["SF"] = "San Francisco"
data["US"]["NY"]["NYC"] = "New York City"

print(data["US"]["CA"]["SF"])       # San Francisco
print(data["US"]["TX"])             # defaultdict(...) — auto-created

# Simpler 2-level: defaultdict(dict)
groups = defaultdict(dict)
groups["fruits"]["apple"] = 1
groups["fruits"]["banana"] = 2`,
    explanation: "A defaultdict whose factory is itself creates arbitrarily deep nested dicts on first access; useful for building tree-shaped data structures without explicit initialization.",
  },
  {
    id: "py-b18-b4-hash-file",
    language: "python",
    title: "Hashing a file with hashlib",
    tag: "snippet",
    code: `import hashlib

def sha256_file(path: str) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        # Read in chunks — works for large files
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()

# In-memory
digest = hashlib.sha256(b"hello world").hexdigest()
print(digest)  # b94d27b9934d3e...

# Available algorithms
print(hashlib.algorithms_available)`,
    explanation: "hashlib provides cryptographic hash functions; reading in 64 KB chunks avoids loading large files into memory. sha256 is the modern default; md5/sha1 are available but cryptographically weak.",
  },
  {
    id: "py-b18-b4-typing-cast",
    language: "python",
    title: "typing.cast for type narrowing",
    tag: "snippet",
    code: `from typing import cast, Any

def get_config(key: str) -> Any:
    store = {"timeout": 30, "name": "app"}
    return store.get(key)

# Tell the type checker this is definitely an int
timeout = cast(int, get_config("timeout"))
# Type checkers treat timeout as int; no runtime overhead
print(timeout + 10)   # 40

from typing import TYPE_CHECKING
if TYPE_CHECKING:
    import some_module  # import only for type checking`,
    explanation: "cast(T, x) is a no-op at runtime but tells type checkers to treat x as type T; use it as a last resort when you know the type but can't express it through annotations.",
  },
  {
    id: "py-b18-b4-string-format-spec",
    language: "python",
    title: "Format specification mini-language",
    tag: "snippet",
    code: `pi = 3.14159265
n = 1234567

# Float formatting
print(f"{pi:.2f}")       # 3.14  — 2 decimal places
print(f"{pi:10.3f}")     # '     3.142' — width 10
print(f"{pi:e}")         # 3.141593e+00 — scientific

# Integer formatting
print(f"{n:,}")          # 1,234,567 — thousands sep
print(f"{n:010d}")       # 0001234567 — zero-padded
print(f"{255:#010x}")    # 0x000000ff — hex with prefix

# String alignment
print(f"{'hi':>10}")     # '        hi'
print(f"{'hi':^10}")     # '    hi    '`,
    explanation: "Python's format specification mini-language controls alignment, padding, width, precision, and type codes; it works inside f-strings and with format().",
  },
  {
    id: "py-b18-b4-pprint-module",
    language: "python",
    title: "pprint for readable data structures",
    tag: "snippet",
    code: `import pprint

data = {
    "users": [
        {"id": 1, "name": "Alice", "roles": ["admin", "user"]},
        {"id": 2, "name": "Bob",   "roles": ["user"]},
    ],
    "total": 2,
}

# Default print: one long line
print(data)

# pprint: indented, sorted, readable
pprint.pprint(data, indent=2, width=40)

# As string
pretty = pprint.pformat(data)`,
    explanation: "pprint.pprint formats complex nested structures with indentation and sorted dict keys, making large data dumps readable during debugging.",
  },
  {
    id: "py-b18-b4-time-perf-counter",
    language: "python",
    title: "time.perf_counter for accurate timing",
    tag: "snippet",
    code: `import time

start = time.perf_counter()
total = sum(range(1_000_000))
elapsed = time.perf_counter() - start
print(f"sum={total} in {elapsed:.6f}s")

# time.process_time excludes sleep
time.sleep(0.1)
pt_start = time.process_time()
sum(range(100_000))
pt_end = time.process_time()
print(f"CPU time: {pt_end - pt_start:.6f}s")  # excludes sleep time`,
    explanation: "time.perf_counter measures wall-clock time with the highest available resolution; time.process_time measures only CPU time, excluding sleep() and I/O waits.",
  },

  // --- understanding ---
  {
    id: "py-b18-b4-pickle-security",
    language: "python",
    title: "Pickle security risks",
    tag: "understanding",
    code: `import pickle
import os

# Pickle can execute arbitrary code on deserialization!
class Exploit:
    def __reduce__(self):
        # This executes during unpickling
        return (os.system, ("echo pwned",))

# NEVER unpickle untrusted data
malicious = pickle.dumps(Exploit())
# pickle.loads(malicious)  # would execute 'echo pwned'

# Safe alternatives: json, msgpack, protobuf
import json
safe = json.dumps({"key": "value"})
json.loads(safe)  # safe`,
    explanation: "__reduce__ controls how an object is pickled; malicious code in __reduce__ executes during deserialization. Never unpickle data from untrusted sources — use JSON or protobuf instead.",
  },
  {
    id: "py-b18-b4-copy-deepcopy",
    language: "python",
    title: "Shallow vs deep copy",
    tag: "understanding",
    code: `import copy

original = {"a": [1, 2, 3], "b": [4, 5, 6]}

shallow = copy.copy(original)
deep    = copy.deepcopy(original)

# Shallow: top-level is new, but nested lists are shared
original["a"].append(99)
print(shallow["a"])   # [1, 2, 3, 99]  — affected!
print(deep["a"])      # [1, 2, 3]      — independent

# Shallow: adding a key to original doesn't affect copies
original["c"] = [7, 8]
print("c" in shallow)  # False
print("c" in deep)     # False`,
    explanation: "copy.copy creates a new container but shares nested objects; copy.deepcopy recursively copies everything. Use deepcopy when you need a fully independent copy of a nested structure.",
  },
  {
    id: "py-b18-b4-thread-local",
    language: "python",
    title: "threading.local for per-thread state",
    tag: "understanding",
    code: `import threading

local = threading.local()
local.value = "main thread"

def worker(n):
    local.value = f"thread {n}"  # isolated to this thread
    import time; time.sleep(0.01)
    print(f"Thread {n} sees: {local.value}")

threads = [threading.Thread(target=worker, args=(i,)) for i in range(3)]
for t in threads: t.start()
for t in threads: t.join()

print(f"Main thread sees: {local.value}")  # "main thread"`,
    explanation: "threading.local stores data per-thread; each thread sees its own isolated value for each attribute, making it safe for state like database connections or request contexts in threaded servers.",
  },
  {
    id: "py-b18-b4-memory-mapped-file",
    language: "python",
    title: "mmap for memory-mapped files",
    tag: "understanding",
    code: `import mmap
import os
import tempfile

with tempfile.NamedTemporaryFile(delete=False) as f:
    f.write(b"Hello, mmap!" + b"\\x00" * 100)
    fname = f.name

with open(fname, "r+b") as f:
    with mmap.mmap(f.fileno(), 0) as mm:
        print(mm[:5])            # b'Hello'
        mm[0:5] = b"WORLD"      # write through mmap
        mm.seek(0)
        print(mm.read(5))        # b'WORLD'

os.unlink(fname)`,
    explanation: "mmap maps a file into virtual memory, allowing random-access reads and writes as if it were a bytearray; the OS handles caching and writes back to disk, making it efficient for large files.",
  },
  {
    id: "py-b18-b4-asyncio-event",
    language: "python",
    title: "asyncio.Event for coroutine signaling",
    tag: "understanding",
    code: `import asyncio

async def waiter(event: asyncio.Event, name: str):
    print(f"{name} waiting...")
    await event.wait()
    print(f"{name} got the signal!")

async def main():
    event = asyncio.Event()

    tasks = [
        asyncio.create_task(waiter(event, "Alice")),
        asyncio.create_task(waiter(event, "Bob")),
    ]

    await asyncio.sleep(0.1)
    event.set()  # wake all waiters

    await asyncio.gather(*tasks)

asyncio.run(main())`,
    explanation: "asyncio.Event lets coroutines wait for a condition; event.set() wakes all waiters simultaneously. Unlike threading.Event, it doesn't block threads and works within the event loop.",
  },
  {
    id: "py-b18-b4-import-system",
    language: "python",
    title: "Python import system: sys.path and __init__.py",
    tag: "understanding",
    code: `import sys

# Python searches these locations in order
print(sys.path[:3])   # ['', '/usr/lib/python3.x', ...]

# Add a directory dynamically
sys.path.insert(0, "/my/custom/path")

# Modules are cached after first import
import os
print(sys.modules["os"] is os)  # True — same object

# Reload if source changed
import importlib
importlib.reload(os)  # re-executes the module`,
    explanation: "Python finds modules by searching sys.path in order; imported modules are cached in sys.modules so subsequent imports return the same object. importlib.reload forces re-execution.",
  },
  {
    id: "py-b18-b4-type-annotations-runtime",
    language: "python",
    title: "Type annotations at runtime with __annotations__",
    tag: "understanding",
    code: `from __future__ import annotations
import typing

class Config:
    host: str
    port: int
    debug: bool = False

# __annotations__ stores annotation strings (with 'from __future__')
print(Config.__annotations__)  # {'host': 'str', 'port': 'int', 'debug': 'bool'}

# Resolve strings to types
hints = typing.get_type_hints(Config)
print(hints)  # {'host': <class 'str'>, ...}

def greet(name: str) -> str:
    return f"Hi {name}"

print(greet.__annotations__)  # {'name': 'str', 'return': 'str'}`,
    explanation: "from __future__ import annotations defers annotation evaluation to strings; __annotations__ stores them; typing.get_type_hints() resolves strings back to types at runtime.",
  },
  {
    id: "py-b18-b4-signal-handling",
    language: "python",
    title: "signal module for Unix signal handling",
    tag: "understanding",
    code: `import signal
import time

def handle_sigterm(signum, frame):
    print("SIGTERM received — shutting down gracefully")
    raise SystemExit(0)

# Register handler for SIGTERM (sent by 'kill')
signal.signal(signal.SIGTERM, handle_sigterm)

# SIGINT (Ctrl+C) is similar
signal.signal(signal.SIGINT, handle_sigterm)

print("Running... press Ctrl+C to test")
try:
    # In real apps this would be your main loop
    time.sleep(5)
except SystemExit:
    print("Exited cleanly")`,
    explanation: "signal.signal registers a handler for OS signals; this is how long-running processes (daemons, servers) handle graceful shutdown on SIGTERM without abrupt termination.",
  },
  {
    id: "py-b18-b4-protocol-buffer-like",
    language: "python",
    title: "dataclasses for structured serialization",
    tag: "understanding",
    code: `from dataclasses import dataclass, asdict, astuple
import json

@dataclass
class Point:
    x: float
    y: float
    label: str = ""

p = Point(1.5, 2.5, "origin")

# To dict (shallow)
d = asdict(p)
print(d)             # {'x': 1.5, 'y': 2.5, 'label': 'origin'}

# To tuple
t = astuple(p)
print(t)             # (1.5, 2.5, 'origin')

# To JSON
print(json.dumps(asdict(p)))

# From dict
p2 = Point(**d)`,
    explanation: "dataclasses.asdict and astuple convert dataclass instances to standard Python containers; they deep-convert nested dataclasses, enabling simple serialization pipelines.",
  },
  {
    id: "py-b18-b4-dynamic-class-creation",
    language: "python",
    title: "Dynamic class creation with type()",
    tag: "understanding",
    code: `# type(name, bases, namespace) creates a new class dynamically
Dog = type("Dog", (object,), {
    "sound": "woof",
    "speak": lambda self: f"The dog says {self.sound}",
    "__repr__": lambda self: "Dog()"
})

d = Dog()
print(d.speak())   # The dog says woof

# Equivalent to:
class DogStatic:
    sound = "woof"
    def speak(self): return f"The dog says {self.sound}"

# Useful for metaprogramming and class factories
def make_model(name, fields):
    return type(name, (), {f: None for f in fields})

User = make_model("User", ["name", "email"])`,
    explanation: "type() with three arguments is Python's metaclass; it creates new classes at runtime, enabling metaprogramming patterns like ORM model generation and dynamic class factories.",
  },
  {
    id: "py-b18-b4-context-vars",
    language: "python",
    title: "contextvars for async context propagation",
    tag: "understanding",
    code: `import asyncio
from contextvars import ContextVar

request_id: ContextVar[str] = ContextVar("request_id", default="none")

async def handler(rid: str):
    token = request_id.set(rid)  # set for this task's context
    try:
        await process()
    finally:
        request_id.reset(token)  # restore previous value

async def process():
    print(f"Processing request: {request_id.get()}")

async def main():
    await asyncio.gather(handler("req-1"), handler("req-2"))

asyncio.run(main())
# Processing request: req-1
# Processing request: req-2  (isolated per task)`,
    explanation: "ContextVar provides task-local variables that propagate through async call chains; unlike threading.local, they're isolated per asyncio Task, perfect for request IDs and user contexts.",
  },
  {
    id: "py-b18-b4-property-validation",
    language: "python",
    title: "Properties for validated attribute access",
    tag: "understanding",
    code: `class Temperature:
    def __init__(self, celsius: float = 0.0):
        self.celsius = celsius  # calls setter

    @property
    def celsius(self) -> float:
        return self._celsius

    @celsius.setter
    def celsius(self, value: float):
        if value < -273.15:
            raise ValueError(f"Temperature {value}°C is below absolute zero")
        self._celsius = value

    @property
    def fahrenheit(self) -> float:
        return self._celsius * 9/5 + 32

t = Temperature(100)
print(t.fahrenheit)  # 212.0
t.celsius = -300     # raises ValueError`,
    explanation: "@property turns a method into an attribute-style accessor; the setter adds validation logic, while computed properties like fahrenheit are recalculated on each access.",
  },
  {
    id: "py-b18-b4-generator-pipeline",
    language: "python",
    title: "Generator pipelines for lazy transformation",
    tag: "understanding",
    code: `def read_lines(text: str):
    for line in text.splitlines():
        yield line.strip()

def filter_empty(lines):
    for line in lines:
        if line:
            yield line

def to_upper(lines):
    for line in lines:
        yield line.upper()

text = """
  hello world

  foo bar
  baz
"""

# Chain: lazy, memory-efficient
pipeline = to_upper(filter_empty(read_lines(text)))
for line in pipeline:
    print(line)
# HELLO WORLD
# FOO BAR
# BAZ`,
    explanation: "Generator pipelines compose transformations lazily: each generator pulls one item from its input only when its output is pulled, processing large streams with constant memory.",
  },
  {
    id: "py-b18-b4-enum-methods",
    language: "python",
    title: "Enum with methods and properties",
    tag: "understanding",
    code: `from enum import Enum

class Planet(Enum):
    MERCURY = (3.303e+23, 2.4397e6)
    VENUS   = (4.869e+24, 6.0518e6)
    EARTH   = (5.976e+24, 6.37814e6)

    def __init__(self, mass, radius):
        self.mass   = mass
        self.radius = radius

    @property
    def surface_gravity(self) -> float:
        G = 6.67430e-11
        return G * self.mass / (self.radius ** 2)

print(f"Earth gravity: {Planet.EARTH.surface_gravity:.2f} m/s²")  # ~9.80
print(f"Mercury gravity: {Planet.MERCURY.surface_gravity:.2f} m/s²")  # ~3.70`,
    explanation: "Enums can store additional data via __init__ and expose computed properties; this encapsulates domain constants with their associated calculations in one place.",
  },

  // --- structures ---
  {
    id: "py-b18-b4-trie-structure",
    language: "python",
    title: "Trie (prefix tree) implementation",
    tag: "structures",
    code: `class TrieNode:
    def __init__(self):
        self.children = {}
        self.is_end = False

class Trie:
    def __init__(self):
        self.root = TrieNode()

    def insert(self, word: str):
        node = self.root
        for ch in word:
            node = node.children.setdefault(ch, TrieNode())
        node.is_end = True

    def search(self, word: str) -> bool:
        node = self.root
        for ch in word:
            if ch not in node.children: return False
            node = node.children[ch]
        return node.is_end

    def starts_with(self, prefix: str) -> bool:
        node = self.root
        for ch in prefix:
            if ch not in node.children: return False
            node = node.children[ch]
        return True

t = Trie()
t.insert("apple")
print(t.search("apple"))      # True
print(t.starts_with("app"))   # True
print(t.search("app"))        # False`,
    explanation: "A Trie stores strings as tree paths; insert/search/starts_with are all O(L) where L is the string length. It's the canonical structure for autocomplete and prefix matching.",
  },
  {
    id: "py-b18-b4-disjoint-set",
    language: "python",
    title: "Disjoint Set Union (Union-Find)",
    tag: "structures",
    code: `class DSU:
    def __init__(self, n: int):
        self.parent = list(range(n))
        self.rank   = [0] * n

    def find(self, x: int) -> int:
        # Path compression
        if self.parent[x] != x:
            self.parent[x] = self.find(self.parent[x])
        return self.parent[x]

    def union(self, x: int, y: int) -> bool:
        px, py = self.find(x), self.find(y)
        if px == py: return False  # already connected
        # Union by rank
        if self.rank[px] < self.rank[py]: px, py = py, px
        self.parent[py] = px
        if self.rank[px] == self.rank[py]: self.rank[px] += 1
        return True

dsu = DSU(5)
dsu.union(0, 1)
dsu.union(2, 3)
print(dsu.find(0) == dsu.find(1))  # True
print(dsu.find(0) == dsu.find(2))  # False`,
    explanation: "Union-Find with path compression and union-by-rank achieves near-O(1) amortized operations; it's the standard algorithm for Kruskal's MST and cycle detection in graphs.",
  },
  {
    id: "py-b18-b4-segment-tree",
    language: "python",
    title: "Segment tree for range queries",
    tag: "structures",
    code: `class SegTree:
    def __init__(self, arr):
        n = len(arr)
        self.n = n
        self.tree = [0] * (4 * n)
        self._build(arr, 0, 0, n - 1)

    def _build(self, arr, node, start, end):
        if start == end:
            self.tree[node] = arr[start]
        else:
            mid = (start + end) // 2
            self._build(arr, 2*node+1, start, mid)
            self._build(arr, 2*node+2, mid+1, end)
            self.tree[node] = self.tree[2*node+1] + self.tree[2*node+2]

    def query(self, l, r, node=0, start=0, end=None):
        if end is None: end = self.n - 1
        if r < start or end < l: return 0
        if l <= start and end <= r: return self.tree[node]
        mid = (start + end) // 2
        return (self.query(l, r, 2*node+1, start, mid) +
                self.query(l, r, 2*node+2, mid+1, end))

st = SegTree([1, 3, 5, 7, 9])
print(st.query(1, 3))  # 3+5+7=15`,
    explanation: "A segment tree supports range sum (or min/max/other) queries in O(log n) after O(n) build; each node stores the aggregate of a sub-array, enabling logarithmic range queries.",
  },
  {
    id: "py-b18-b4-lru-cache-class",
    language: "python",
    title: "LRU cache implemented with OrderedDict",
    tag: "structures",
    code: `from collections import OrderedDict

class LRUCache:
    def __init__(self, capacity: int):
        self.capacity = capacity
        self.cache: OrderedDict = OrderedDict()

    def get(self, key: int) -> int:
        if key not in self.cache:
            return -1
        self.cache.move_to_end(key)   # mark as recently used
        return self.cache[key]

    def put(self, key: int, value: int):
        if key in self.cache:
            self.cache.move_to_end(key)
        self.cache[key] = value
        if len(self.cache) > self.capacity:
            self.cache.popitem(last=False)  # evict LRU

cache = LRUCache(3)
cache.put(1, 1); cache.put(2, 2); cache.put(3, 3)
cache.get(1)       # promotes 1
cache.put(4, 4)    # evicts 2 (LRU)
print(cache.cache) # OrderedDict {3, 1, 4}`,
    explanation: "OrderedDict's move_to_end and popitem(last=False) implement O(1) LRU cache get and put; this is the canonical Python LRU Cache interview solution.",
  },
  {
    id: "py-b18-b4-graph-adjacency-list",
    language: "python",
    title: "Graph with adjacency list and BFS",
    tag: "structures",
    code: `from collections import defaultdict, deque

class Graph:
    def __init__(self):
        self.adj = defaultdict(list)

    def add_edge(self, u, v):
        self.adj[u].append(v)
        self.adj[v].append(u)  # undirected

    def bfs(self, start):
        visited = {start}
        queue = deque([start])
        order = []
        while queue:
            node = queue.popleft()
            order.append(node)
            for neighbor in self.adj[node]:
                if neighbor not in visited:
                    visited.add(neighbor)
                    queue.append(neighbor)
        return order

g = Graph()
for u, v in [(1,2),(1,3),(2,4),(3,4)]:
    g.add_edge(u, v)
print(g.bfs(1))  # [1, 2, 3, 4]`,
    explanation: "An adjacency list (defaultdict of lists) is the standard sparse graph representation; BFS uses a deque and visited set to explore nodes level by level in O(V+E).",
  },
  {
    id: "py-b18-b4-min-heap-custom",
    language: "python",
    title: "Min-heap with custom comparison via tuple",
    tag: "structures",
    code: `import heapq

class Task:
    def __init__(self, priority, name):
        self.priority = priority
        self.name = name

# Use (priority, tie_breaker, task) tuples to avoid __lt__ on Task
counter = 0
heap = []

def push_task(priority, name):
    global counter
    heapq.heappush(heap, (priority, counter, Task(priority, name)))
    counter += 1

push_task(3, "low")
push_task(1, "urgent")
push_task(2, "medium")

while heap:
    prio, _, task = heapq.heappop(heap)
    print(f"[{prio}] {task.name}")
# [1] urgent
# [2] medium
# [3] low`,
    explanation: "Python's heap compares tuples element by element; using (priority, counter, object) avoids needing __lt__ on the object and ensures stable ordering when priorities are equal.",
  },
  {
    id: "py-b18-b4-circular-linked-list",
    language: "python",
    title: "Circular linked list for round-robin",
    tag: "structures",
    code: `class Node:
    def __init__(self, val):
        self.val = val
        self.next = None

class CircularList:
    def __init__(self, items):
        nodes = [Node(v) for v in items]
        for i in range(len(nodes)):
            nodes[i].next = nodes[(i + 1) % len(nodes)]
        self.head = nodes[0]

    def round_robin(self, steps: int):
        cur = self.head
        for _ in range(steps):
            print(cur.val, end=" ")
            cur = cur.next
        print()

cl = CircularList([1, 2, 3])
cl.round_robin(7)   # 1 2 3 1 2 3 1`,
    explanation: "A circular linked list connects the tail back to the head; it's the natural structure for round-robin scheduling, as iterating never needs a boundary check.",
  },
  {
    id: "py-b18-b4-bloom-filter",
    language: "python",
    title: "Bloom filter for probabilistic membership",
    tag: "structures",
    code: `import hashlib

class BloomFilter:
    def __init__(self, size=1000, num_hashes=3):
        self.size = size
        self.num_hashes = num_hashes
        self.bits = bytearray(size)

    def _hashes(self, item: str):
        for i in range(self.num_hashes):
            digest = hashlib.md5(f"{i}:{item}".encode()).hexdigest()
            yield int(digest, 16) % self.size

    def add(self, item: str):
        for idx in self._hashes(item):
            self.bits[idx] = 1

    def might_contain(self, item: str) -> bool:
        return all(self.bits[idx] for idx in self._hashes(item))

bf = BloomFilter()
bf.add("alice")
print(bf.might_contain("alice"))  # True
print(bf.might_contain("bob"))    # False (probably)`,
    explanation: "A Bloom filter uses multiple hash functions to map items to bits; might_contain returns False means definitely absent, True means probably present. It never has false negatives.",
  },
  {
    id: "py-b18-b4-red-black-like-sorteddict",
    language: "python",
    title: "SortedDict for ordered key-value store",
    tag: "structures",
    code: `# pip install sortedcontainers
from sortedcontainers import SortedDict

sd = SortedDict()
sd["banana"] = 2
sd["apple"]  = 1
sd["cherry"] = 3

print(list(sd.keys()))        # ['apple', 'banana', 'cherry']
print(sd.peekitem(0))         # ('apple', 1)   — min
print(sd.peekitem(-1))        # ('cherry', 3)  — max

# Range query: keys between 'b' and 'c'
idx_l = sd.bisect_left("b")
idx_r = sd.bisect_right("bzzzz")
print(list(sd.islice(idx_l, idx_r)))  # ['banana']`,
    explanation: "SortedDict from sortedcontainers maintains keys in sorted order with O(log n) operations; islice, bisect_left/right, and peekitem enable range queries that plain dict can't express.",
  },
  {
    id: "py-b18-b4-matrix-sparse",
    language: "python",
    title: "Sparse matrix with defaultdict",
    tag: "structures",
    code: `from collections import defaultdict

class SparseMatrix:
    def __init__(self):
        self.data = defaultdict(float)

    def set(self, r: int, c: int, v: float):
        if v == 0:
            self.data.pop((r, c), None)
        else:
            self.data[(r, c)] = v

    def get(self, r: int, c: int) -> float:
        return self.data.get((r, c), 0.0)

    def multiply(self, other: "SparseMatrix") -> "SparseMatrix":
        result = SparseMatrix()
        for (r, k), v in self.data.items():
            for (kr, c), w in other.data.items():
                if k == kr:
                    result.set(r, c, result.get(r, c) + v * w)
        return result

m = SparseMatrix()
m.set(0, 0, 1); m.set(1, 1, 2)
print(m.get(0, 0))  # 1.0`,
    explanation: "A sparse matrix stores only non-zero values in a dict keyed by (row, col); this is memory-efficient when most entries are zero, as in adjacency matrices or NLP co-occurrence matrices.",
  },
  {
    id: "py-b18-b4-interval-tree",
    language: "python",
    title: "Interval set with sorted list",
    tag: "structures",
    code: `from sortedcontainers import SortedList

class IntervalSet:
    def __init__(self):
        self.intervals = SortedList(key=lambda x: x[0])

    def add(self, start: int, end: int):
        self.intervals.add((start, end))

    def overlapping(self, start: int, end: int):
        result = []
        for s, e in self.intervals:
            if s > end: break      # intervals are sorted by start
            if e >= start:
                result.append((s, e))
        return result

iv = IntervalSet()
iv.add(1, 5); iv.add(3, 7); iv.add(8, 10)
print(iv.overlapping(4, 6))  # [(1, 5), (3, 7)]`,
    explanation: "An interval set backed by a SortedList enables efficient range overlap queries; sorting by start and breaking early avoids scanning all intervals for each query.",
  },

  // --- caveats ---
  {
    id: "py-b18-b4-mutable-default-function",
    language: "python",
    title: "Mutable default argument evaluated once",
    tag: "caveats",
    code: `# WRONG: list is created once at function definition time
def append_to(item, lst=[]):
    lst.append(item)
    return lst

print(append_to(1))   # [1]
print(append_to(2))   # [1, 2]  — unexpected!
print(append_to(3))   # [1, 2, 3]

# RIGHT: use None sentinel
def append_to_fixed(item, lst=None):
    if lst is None:
        lst = []
    lst.append(item)
    return lst`,
    explanation: "Default argument expressions are evaluated once when the function is defined, not on each call; mutable defaults (list, dict, set) are shared across calls. Use None as the sentinel.",
  },
  {
    id: "py-b18-b4-multithread-shared-state",
    language: "python",
    title: "Race condition with shared mutable state",
    tag: "caveats",
    code: `import threading

counter = 0
lock = threading.Lock()

def increment_safe():
    global counter
    with lock:
        counter += 1  # atomic under lock

def increment_unsafe():
    global counter
    counter += 1  # read-modify-write is NOT atomic!

threads = [threading.Thread(target=increment_safe) for _ in range(1000)]
for t in threads: t.start()
for t in threads: t.join()
print(counter)  # 1000 (safe)`,
    explanation: "counter += 1 compiles to LOAD, ADD, STORE — three bytecodes. The GIL doesn't guarantee atomicity across bytecodes; use threading.Lock or atomic operations from the queue module.",
  },
  {
    id: "py-b18-b4-string-bytes-confusion",
    language: "python",
    title: "str vs bytes: encoding confusion",
    tag: "caveats",
    code: `# str is Unicode text; bytes is raw octets
text  = "Héllo"
raw   = text.encode("utf-8")    # str -> bytes
back  = raw.decode("utf-8")     # bytes -> str

print(type(text))   # <class 'str'>
print(type(raw))    # <class 'bytes'>

# Cannot mix without encoding
try:
    text + raw
except TypeError as e:
    print(e)  # can only concatenate str (not "bytes") to str

# Latin-1 encoded file decoded as UTF-8 will error
try:
    "caf\\xe9".encode("latin-1").decode("utf-8")
except UnicodeDecodeError as e:
    print(e)`,
    explanation: "Python 3 strictly separates str (text) and bytes (binary); always specify encoding when converting between them. Mixing them raises TypeError; using the wrong codec raises UnicodeDecodeError.",
  },
  {
    id: "py-b18-b4-generator-exhaustion",
    language: "python",
    title: "Generators can only be consumed once",
    tag: "caveats",
    code: `gen = (x * x for x in range(5))

print(list(gen))  # [0, 1, 4, 9, 16]
print(list(gen))  # []  — exhausted!

# Fix: convert to list if you need multiple iterations
squares = list(x * x for x in range(5))
print(squares)   # [0, 1, 4, 9, 16]
print(squares)   # [0, 1, 4, 9, 16]

# Or use a function that returns a fresh generator
def squares_gen(n): return (x*x for x in range(n))`,
    explanation: "A generator expression or function maintains state and can only be iterated once; after exhaustion, further iteration yields nothing. Wrap in list() or use a factory function when you need re-iteration.",
  },
  {
    id: "py-b18-b4-class-variable-vs-instance",
    language: "python",
    title: "Reading class variable through self creates confusion",
    tag: "caveats",
    code: `class Config:
    timeout = 30  # class variable

c = Config()
print(c.timeout)    # 30 (reads class variable)

# Assignment creates a NEW instance variable, shadowing class var
c.timeout = 60
print(c.timeout)    # 60 (instance variable)
print(Config.timeout)  # 30 (class variable unchanged)

# Deleting instance var reveals class var again
del c.timeout
print(c.timeout)    # 30`,
    explanation: "Python looks up instance variables before class variables; assigning through self creates an instance variable that shadows the class variable without modifying it.",
  },
  {
    id: "py-b18-b4-circular-import",
    language: "python",
    title: "Circular imports and how to avoid them",
    tag: "caveats",
    code: `# a.py: from b import func_b  <- CIRCULAR if b imports from a
# b.py: from a import func_a

# Fix 1: move shared code to a third module c.py

# Fix 2: defer the import inside the function
def func_a():
    from b import func_b  # imported at call time, not module load
    return func_b()

# Fix 3: use TYPE_CHECKING guard for type hints
from __future__ import annotations
from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from b import TypeFromB  # only imported during type checking`,
    explanation: "Circular imports fail because Python can't finish loading module A before loading module B which needs A; fix by restructuring, deferring imports inside functions, or using TYPE_CHECKING guards.",
  },
  {
    id: "py-b18-b4-silent-exception-swallow",
    language: "python",
    title: "contextlib.suppress silences specific exceptions",
    tag: "caveats",
    code: `import contextlib

# Verbose way
try:
    result = int("not a number")
except ValueError:
    result = 0

# Clean way with suppress
result = 0
with contextlib.suppress(ValueError):
    result = int("not a number")

# But be careful: suppress hides ALL raises of that type
with contextlib.suppress(FileNotFoundError):
    open("/nonexistent")   # OK to suppress
    # Don't suppress broad exceptions like Exception or OSError`,
    explanation: "contextlib.suppress is clean for expected, non-exceptional failures; but suppressing broad exception classes can hide real bugs — be specific about which exceptions you expect.",
  },

  // --- types ---
  {
    id: "py-b18-b4-generic-protocol",
    language: "python",
    title: "Generic Protocol for typed duck typing",
    tag: "types",
    code: `from typing import Protocol, TypeVar

T_co = TypeVar("T_co", covariant=True)

class Readable(Protocol[T_co]):
    def read(self) -> T_co: ...

class FileReader:
    def read(self) -> str:
        return "file contents"

class ByteReader:
    def read(self) -> bytes:
        return b"raw bytes"

def process(reader: Readable[str]) -> str:
    return reader.read().upper()

print(process(FileReader()))  # FILE CONTENTS`,
    explanation: "Generic Protocols combine generics with structural subtyping; Readable[str] matches any class with a read() -> str method without explicit inheritance.",
  },
  {
    id: "py-b18-b4-conditional-type-import",
    language: "python",
    title: "Conditional imports for optional dependencies",
    tag: "types",
    code: `try:
    import numpy as np
    HAS_NUMPY = True
except ImportError:
    HAS_NUMPY = False

def compute(data):
    if HAS_NUMPY:
        return np.array(data).mean()
    return sum(data) / len(data)

print(compute([1, 2, 3, 4, 5]))  # 3.0`,
    explanation: "Wrapping optional-dependency imports in try/except makes code work without the package installed; a boolean flag records availability for conditional use in functions.",
  },
  {
    id: "py-b18-b4-type-alias-new",
    language: "python",
    title: "TypeAlias explicit type aliases",
    tag: "types",
    code: `from typing import TypeAlias

# Explicit alias — type checkers know this is an alias, not a variable
UserId: TypeAlias = int
UserMap: TypeAlias = dict[UserId, str]

def get_user(uid: UserId, users: UserMap) -> str | None:
    return users.get(uid)

users: UserMap = {1: "Alice", 2: "Bob"}
print(get_user(1, users))  # Alice

# Python 3.12+ syntax (no import needed)
# type UserId = int`,
    explanation: "TypeAlias (PEP 613) explicitly marks type aliases so type checkers don't confuse them with variable assignments; clearer than bare assignment for complex alias types.",
  },
  {
    id: "py-b18-b4-runtime-checkable",
    language: "python",
    title: "runtime_checkable Protocol for isinstance",
    tag: "types",
    code: `from typing import Protocol, runtime_checkable

@runtime_checkable
class Sizeable(Protocol):
    def __len__(self) -> int: ...

print(isinstance([], Sizeable))          # True
print(isinstance({}, Sizeable))          # True
print(isinstance("hello", Sizeable))     # True
print(isinstance(42, Sizeable))          # False

# NOTE: only checks method existence, not signatures
class Fake:
    def __len__(self): return "not an int"  # wrong return type

print(isinstance(Fake(), Sizeable))  # True (can't check return type)`,
    explanation: "@runtime_checkable makes a Protocol usable with isinstance; it checks method existence but not signatures. Use it carefully — it's not a full type check, just a structural presence check.",
  },
  {
    id: "py-b18-b4-kw-only-dataclass-init",
    language: "python",
    title: "Keyword-only dataclass with InitVar",
    tag: "types",
    code: `from dataclasses import dataclass, InitVar, field

@dataclass
class DatabaseConfig:
    host: str
    port: int = 5432
    # InitVar: passed to __post_init__ but not stored
    password: InitVar[str] = field(default="", kw_only=True)
    _password_hash: str = field(init=False, repr=False, default="")

    def __post_init__(self, password: str):
        import hashlib
        self._password_hash = hashlib.sha256(password.encode()).hexdigest()[:8]

cfg = DatabaseConfig("localhost", password="secret123")
print(cfg.host)             # localhost
print(cfg._password_hash)   # first 8 hex chars of hash`,
    explanation: "InitVar declares a parameter for __post_init__ that doesn't become an attribute; useful for one-time processing (hashing, validation) of constructor data that shouldn't be stored raw.",
  },
  {
    id: "py-b18-b4-unpack-operator-types",
    language: "python",
    title: "Unpack for variadic generic tuple types",
    tag: "types",
    code: `from typing import TypeVarTuple, Unpack, Generic

Ts = TypeVarTuple("Ts")

class Pipeline(Generic[Unpack[Ts]]):
    def __init__(self, *steps: Unpack[Ts]):
        self.steps = steps

# PEP 646 (Python 3.11+) variadic generics
from typing import TypeAlias
RGB: TypeAlias = tuple[int, int, int]
RGBA: TypeAlias = tuple[int, int, int, int]

def blend(c1: RGB, c2: RGB) -> RGB:
    return tuple(a//2 + b//2 for a, b in zip(c1, c2))  # type: ignore

print(blend((255, 0, 0), (0, 255, 0)))  # (127, 127, 0)`,
    explanation: "TypeVarTuple and Unpack (PEP 646) enable variadic generic types — useful for typed N-tuples and pipelines where the number and types of steps are statically known.",
  },

  // --- families ---
  {
    id: "py-b18-b4-aiohttp-server",
    language: "python",
    title: "aiohttp async web server",
    tag: "families",
    code: `from aiohttp import web

async def hello(request):
    name = request.match_info.get("name", "World")
    return web.json_response({"message": f"Hello, {name}!"})

async def handle_post(request):
    data = await request.json()
    return web.json_response({"echo": data})

app = web.Application()
app.router.add_get("/hello/{name}", hello)
app.router.add_post("/echo", handle_post)

# web.run_app(app, port=8080)`,
    explanation: "aiohttp provides a fully async web server and client; route handlers are coroutines, request.json() awaits body parsing, and web.json_response serializes the response.",
  },
  {
    id: "py-b18-b4-tenacity-retry",
    language: "python",
    title: "tenacity for robust retry logic",
    tag: "families",
    code: `from tenacity import (
    retry, stop_after_attempt, wait_exponential,
    retry_if_exception_type
)
import random

@retry(
    stop=stop_after_attempt(4),
    wait=wait_exponential(multiplier=1, min=1, max=10),
    retry=retry_if_exception_type(ConnectionError),
    reraise=True,
)
def flaky_request():
    if random.random() < 0.7:
        raise ConnectionError("network error")
    return "success"

try:
    print(flaky_request())
except ConnectionError:
    print("all retries exhausted")`,
    explanation: "tenacity decorates functions with rich retry strategies: exponential backoff, selective exception types, attempt limits, and reraise on final failure — more expressive than manual retry loops.",
  },
  {
    id: "py-b18-b4-rich-console",
    language: "python",
    title: "Rich library for beautiful terminal output",
    tag: "families",
    code: `from rich.console import Console
from rich.table import Table
from rich.progress import track

console = Console()

console.print("[bold green]Success![/bold green] Task completed.")
console.print("[red]Error:[/red] Something went wrong", style="bold")

table = Table(title="Users")
table.add_column("Name",  style="cyan")
table.add_column("Score", style="magenta")
table.add_row("Alice", "95")
table.add_row("Bob",   "87")
console.print(table)

# Progress bar (use with iterable)
# for item in track(range(100), description="Processing..."):
#     pass`,
    explanation: "Rich provides markup, syntax highlighting, tables, progress bars, and panels for terminal output; it detects if stdout is a TTY and degrades gracefully when not.",
  },
  {
    id: "py-b18-b4-redis-py",
    language: "python",
    title: "redis-py for caching and pub/sub",
    tag: "families",
    code: `import redis

r = redis.Redis(host="localhost", port=6379, decode_responses=True)

# String operations
r.set("user:1:name", "Alice", ex=3600)  # expires in 1 hour
print(r.get("user:1:name"))             # Alice

# Hash (like a dict)
r.hset("user:2", mapping={"name": "Bob", "age": "30"})
print(r.hgetall("user:2"))              # {'name': 'Bob', 'age': '30'}

# List
r.rpush("queue", "task1", "task2")
print(r.lpop("queue"))                  # task1

# Set
r.sadd("tags", "python", "redis")
print(r.smembers("tags"))`,
    explanation: "redis-py wraps Redis commands as Python methods; hset with mapping replaces the deprecated hmset; decode_responses=True returns str instead of bytes.",
  },
  {
    id: "py-b18-b4-typer-cli",
    language: "python",
    title: "Typer CLI framework with type hints",
    tag: "families",
    code: `import typer
from typing import Optional

app = typer.Typer()

@app.command()
def greet(
    name: str,
    count: int = typer.Option(1, "--count", "-n", help="How many times"),
    upper: bool = typer.Option(False, "--upper", help="Uppercase output"),
):
    """Greet a user N times."""
    msg = f"Hello, {name}!"
    if upper:
        msg = msg.upper()
    for _ in range(count):
        typer.echo(msg)

if __name__ == "__main__":
    app()
# python script.py Alice --count 3 --upper`,
    explanation: "Typer builds CLI applications from type-annotated functions; it auto-generates help text, handles type coercion, and supports commands/subcommands with minimal boilerplate.",
  },
  {
    id: "py-b18-b4-arrow-datetime",
    language: "python",
    title: "Arrow for human-friendly datetime handling",
    tag: "families",
    code: `import arrow

now = arrow.now()
print(now.format("YYYY-MM-DD HH:mm:ss"))   # 2026-05-18 ...

# Shifting
tomorrow = now.shift(days=1)
last_week = now.shift(weeks=-1)

# Human readable
print(now.shift(hours=-2).humanize())      # 2 hours ago

# Timezone conversion
utc = arrow.utcnow()
eastern = utc.to("US/Eastern")
print(eastern.format("h:mm A ZZZ"))       # 8:00 AM EDT

# From string
parsed = arrow.get("2026-05-18", "YYYY-MM-DD")
print(parsed.year)  # 2026`,
    explanation: "Arrow provides a clean API for datetime parsing, formatting, shifting, and timezone conversion; humanize() converts durations to natural language descriptions.",
  },
  {
    id: "py-b18-b4-attrs-library",
    language: "python",
    title: "attrs library for powerful class definitions",
    tag: "families",
    code: `import attr

@attr.s(auto_attribs=True, frozen=True)
class Point:
    x: float
    y: float

    @x.validator
    def _check_x(self, attribute, value):
        if not isinstance(value, (int, float)):
            raise TypeError("x must be numeric")

    @property
    def length(self):
        return (self.x ** 2 + self.y ** 2) ** 0.5

p = Point(3.0, 4.0)
print(p.length)    # 5.0
print(attr.asdict(p))  # {'x': 3.0, 'y': 4.0}

# frozen=True makes it immutable
try:
    p.x = 10  # raises FrozenInstanceError
except attr.exceptions.FrozenInstanceError:
    print("immutable!")`,
    explanation: "attrs predates dataclasses and offers validators, converters, and frozen instances; auto_attribs=True uses type annotations like dataclasses for a clean, validated class definition.",
  },

  // --- classes ---
  {
    id: "py-b18-b4-command-pattern",
    language: "python",
    title: "Command pattern with undo/redo",
    tag: "classes",
    code: `from abc import ABC, abstractmethod
from typing import Deque
from collections import deque

class Command(ABC):
    @abstractmethod
    def execute(self): ...
    @abstractmethod
    def undo(self): ...

class Counter:
    def __init__(self): self.value = 0

class IncrementCommand(Command):
    def __init__(self, counter: Counter, amount: int = 1):
        self.counter = counter
        self.amount = amount
    def execute(self): self.counter.value += self.amount
    def undo(self):    self.counter.value -= self.amount

class History:
    def __init__(self):
        self._done: Deque[Command] = deque()
    def execute(self, cmd: Command):
        cmd.execute(); self._done.append(cmd)
    def undo(self):
        if self._done: self._done.pop().undo()

c = Counter()
h = History()
h.execute(IncrementCommand(c, 5))
h.execute(IncrementCommand(c, 3))
print(c.value)   # 8
h.undo()
print(c.value)   # 5`,
    explanation: "The Command pattern encapsulates actions as objects; storing them in a history deque enables undo/redo. Each command carries enough context to reverse its effect.",
  },
  {
    id: "py-b18-b4-flyweight-pattern",
    language: "python",
    title: "Flyweight pattern for shared objects",
    tag: "classes",
    code: `import sys

class Color:
    _cache: dict = {}

    def __new__(cls, r, g, b):
        key = (r, g, b)
        if key not in cls._cache:
            obj = super().__new__(cls)
            obj.r, obj.g, obj.b = r, g, b
            cls._cache[key] = obj
        return cls._cache[key]

# Same color values return the same object
red1 = Color(255, 0, 0)
red2 = Color(255, 0, 0)
print(red1 is red2)   # True — shared instance

# With 1000 pixels using only 3 colors:
pixels = [Color(255, 0, 0)] * 500 + [Color(0, 255, 0)] * 500
print(len(Color._cache))  # 2 (only 2 objects)`,
    explanation: "Flyweight caches and reuses instances for identical values using __new__; when many objects share the same intrinsic state, flyweight can dramatically reduce memory usage.",
  },
  {
    id: "py-b18-b4-mediator-pattern",
    language: "python",
    title: "Mediator pattern for decoupled communication",
    tag: "classes",
    code: `from typing import Callable

class EventBus:
    def __init__(self):
        self._handlers: dict[str, list[Callable]] = {}

    def subscribe(self, event: str, handler: Callable):
        self._handlers.setdefault(event, []).append(handler)

    def publish(self, event: str, data=None):
        for h in self._handlers.get(event, []):
            h(data)

bus = EventBus()

class OrderService:
    def __init__(self, bus: EventBus):
        self.bus = bus
    def place_order(self, item: str):
        print(f"Order placed: {item}")
        self.bus.publish("order_placed", {"item": item})

class EmailService:
    def __init__(self, bus: EventBus):
        bus.subscribe("order_placed", self.send_confirmation)
    def send_confirmation(self, data):
        print(f"Email sent for: {data['item']}")

bus2 = EventBus()
orders = OrderService(bus2)
emails = EmailService(bus2)
orders.place_order("Widget")
# Order placed: Widget
# Email sent for: Widget`,
    explanation: "The Mediator (EventBus) centralizes communication between components; OrderService doesn't know about EmailService. New listeners can subscribe without changing the publisher.",
  },
  {
    id: "py-b18-b4-visitor-pattern",
    language: "python",
    title: "Visitor pattern for double dispatch",
    tag: "classes",
    code: `from abc import ABC, abstractmethod

class Expr(ABC):
    @abstractmethod
    def accept(self, visitor): ...

class Number(Expr):
    def __init__(self, val): self.val = val
    def accept(self, v): return v.visit_number(self)

class Add(Expr):
    def __init__(self, l, r): self.l, self.r = l, r
    def accept(self, v): return v.visit_add(self)

class Evaluator:
    def visit_number(self, n): return n.val
    def visit_add(self, a): return a.l.accept(self) + a.r.accept(self)

class Printer:
    def visit_number(self, n): return str(n.val)
    def visit_add(self, a): return f"({a.l.accept(self)} + {a.r.accept(self)})"

expr = Add(Number(1), Add(Number(2), Number(3)))
print(Evaluator().visit_add(expr))  # 6
print(Printer().visit_add(expr))    # (1 + (2 + 3))`,
    explanation: "Visitor separates algorithms from data structures; new operations (Evaluator, Printer) can be added without changing the expression classes. accept() implements double dispatch.",
  },
  {
    id: "py-b18-b4-null-object-pattern",
    language: "python",
    title: "Null Object pattern to eliminate None checks",
    tag: "classes",
    code: `from abc import ABC, abstractmethod

class Logger(ABC):
    @abstractmethod
    def log(self, msg: str): ...

class ConsoleLogger(Logger):
    def log(self, msg: str): print(f"LOG: {msg}")

class NullLogger(Logger):
    def log(self, msg: str): pass  # do nothing

class Service:
    def __init__(self, logger: Logger = None):
        self.logger = logger or NullLogger()  # never None

    def process(self, data: str):
        self.logger.log(f"Processing: {data}")
        return data.upper()

s1 = Service(ConsoleLogger())
s1.process("hello")   # LOG: Processing: hello

s2 = Service()        # no logger
s2.process("world")   # silent`,
    explanation: "The Null Object provides a default no-op implementation of an interface, eliminating conditional None checks throughout the codebase; code calls logger.log() without ever checking if logger is None.",
  },
  {
    id: "py-b18-b4-monad-maybe",
    language: "python",
    title: "Maybe monad for safe chaining",
    tag: "classes",
    code: `from typing import TypeVar, Generic, Callable, Optional

T = TypeVar("T")
U = TypeVar("U")

class Maybe(Generic[T]):
    def __init__(self, value: Optional[T]):
        self._value = value

    @classmethod
    def of(cls, value: Optional[T]) -> "Maybe[T]":
        return cls(value)

    def bind(self, func: Callable[[T], "Maybe[U]"]) -> "Maybe[U]":
        if self._value is None:
            return Maybe(None)
        return func(self._value)

    def get_or(self, default: T) -> T:
        return self._value if self._value is not None else default

users = {"alice": {"profile": {"age": 30}}}
result = (Maybe.of(users.get("alice"))
          .bind(lambda u: Maybe.of(u.get("profile")))
          .bind(lambda p: Maybe.of(p.get("age")))
          .get_or(0))
print(result)  # 30`,
    explanation: "The Maybe monad chains operations on possibly-None values; bind skips the function when the value is None, propagating absence through the chain without nested None checks.",
  },
];
