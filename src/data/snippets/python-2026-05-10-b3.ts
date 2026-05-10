import type { Snippet } from "./types";

export const pythonSnippets20260510B3: Snippet[] = [
  // ── snippet ──────────────────────────────────────────────────────────────
  {
    id: "py-urllib-parse",
    language: "python",
    title: "urllib.parse — URL manipulation",
    tag: "snippet",
    code: `from urllib.parse import urlparse, urlencode, urljoin, quote

parsed = urlparse("https://example.com/path?a=1&b=2#frag")
print(parsed.scheme, parsed.netloc, parsed.path)  # https example.com /path

params = {"q": "hello world", "lang": "en"}
qs = urlencode(params)
print(qs)  # q=hello+world&lang=en

joined = urljoin("https://example.com/base/", "../other")
print(joined)  # https://example.com/other

safe = quote("hello/world", safe="")
print(safe)  # hello%2Fworld`,
    explanation:
      "urllib.parse provides URL construction and decomposition without external dependencies; urljoin follows RFC 3986 resolution rules including parent-directory traversal.",
  },
  {
    id: "py-xml-etree",
    language: "python",
    title: "xml.etree.ElementTree — parse and build XML",
    tag: "snippet",
    code: `import xml.etree.ElementTree as ET

xml_str = """<catalog>
  <book id="1"><title>Python</title><price>39.99</price></book>
  <book id="2"><title>Clean Code</title><price>29.99</price></book>
</catalog>"""

root = ET.fromstring(xml_str)
for book in root.findall("book"):
    print(book.get("id"), book.findtext("title"))

# Build XML
new = ET.SubElement(root, "book", id="3")
ET.SubElement(new, "title").text = "New Book"
print(ET.tostring(root, encoding="unicode"))`,
    explanation:
      "ElementTree is the standard XML library; findall/findtext use a limited XPath subset; ET.tostring serialises the tree back to a string.",
  },
  {
    id: "py-zipfile",
    language: "python",
    title: "zipfile — read and write zip archives",
    tag: "snippet",
    code: `import zipfile, io

# Write
with zipfile.ZipFile("archive.zip", "w", zipfile.ZIP_DEFLATED) as zf:
    zf.writestr("hello.txt", "Hello from zip!")
    zf.write(__file__, arcname="script.py")

# Read
with zipfile.ZipFile("archive.zip") as zf:
    for name in zf.namelist():
        data = zf.read(name)
        print(name, len(data), "bytes")`,
    explanation:
      "ZipFile supports reading, writing, and appending; writestr adds bytes or strings directly without touching the filesystem; ZIP_DEFLATED compresses entries.",
  },
  {
    id: "py-sqlite3",
    language: "python",
    title: "sqlite3 — embedded relational database",
    tag: "snippet",
    code: `import sqlite3

con = sqlite3.connect(":memory:")
con.execute("CREATE TABLE user (id INTEGER PRIMARY KEY, name TEXT)")
con.executemany("INSERT INTO user VALUES (?,?)", [(1,"Alice"),(2,"Bob")])
con.commit()

cur = con.execute("SELECT * FROM user WHERE id = ?", (1,))
row = cur.fetchone()
print(row)  # (1, 'Alice')

# Row factory for dict-like access
con.row_factory = sqlite3.Row
cur = con.execute("SELECT * FROM user")
for r in cur:
    print(dict(r))`,
    explanation:
      "Always use parameterised queries (? placeholders) to prevent SQL injection; row_factory = sqlite3.Row enables column-name access on results.",
  },
  {
    id: "py-decimal",
    language: "python",
    title: "decimal.Decimal — exact numeric arithmetic",
    tag: "snippet",
    code: `from decimal import Decimal, getcontext, ROUND_HALF_UP

# float arithmetic is imprecise:
print(0.1 + 0.2)          # 0.30000000000000004

# Decimal is exact:
print(Decimal("0.1") + Decimal("0.2"))  # 0.3

getcontext().prec = 50
pi = Decimal(1).ln() + 1  # not pi, just demo

price = Decimal("19.995")
rounded = price.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
print(rounded)  # 20.00`,
    explanation:
      "Decimal uses base-10 arithmetic avoiding binary floating-point errors; quantize controls rounding mode explicitly — essential for financial calculations.",
  },
  {
    id: "py-fractions",
    language: "python",
    title: "fractions.Fraction — exact rational arithmetic",
    tag: "snippet",
    code: `from fractions import Fraction

a = Fraction(1, 3)
b = Fraction(1, 6)
print(a + b)        # 1/2
print(a * b)        # 1/18
print(float(a))     # 0.3333333333333333

# From float (often ugly):
print(Fraction(0.1))  # 3602879701896397/36028797018963968

# From string (exact):
print(Fraction("0.1"))  # 1/10`,
    explanation:
      "Fraction represents exact rationals and supports all arithmetic operations; always construct from strings for decimal values — float construction reveals binary imprecision.",
  },
  {
    id: "py-statistics",
    language: "python",
    title: "statistics — descriptive statistics",
    tag: "snippet",
    code: `from statistics import mean, median, mode, stdev, variance, quantiles

data = [2, 4, 4, 4, 5, 5, 7, 9]
print(mean(data))        # 5.0
print(median(data))      # 4.5
print(mode(data))        # 4
print(stdev(data))       # 2.0
print(variance(data))    # 4.0

qs = quantiles(data, n=4)  # quartiles
print(qs)  # [3.5, 4.5, 5.75]`,
    explanation:
      "The statistics module provides exact arithmetic on integer/Fraction data; stdev returns the sample standard deviation (Bessel correction, n-1 denominator).",
  },
  {
    id: "py-argparse",
    language: "python",
    title: "argparse — command-line argument parsing",
    tag: "snippet",
    code: `import argparse

parser = argparse.ArgumentParser(description="File processor")
parser.add_argument("input",              help="input file")
parser.add_argument("-o", "--output",     default="out.txt")
parser.add_argument("-n", "--count",      type=int, default=10)
parser.add_argument("-v", "--verbose",    action="store_true")
parser.add_argument("--mode",             choices=["fast","slow"])

args = parser.parse_args()
print(args.input, args.output, args.count, args.verbose)`,
    explanation:
      "argparse auto-generates --help, validates types/choices, and handles abbreviation of long flags; action='store_true' makes a boolean flag that defaults to False.",
  },
  {
    id: "py-configparser",
    language: "python",
    title: "configparser — INI-style configuration files",
    tag: "snippet",
    code: `import configparser

config = configparser.ConfigParser()
config["DEFAULT"] = {"timeout": "30", "retries": "3"}
config["server"] = {"host": "localhost", "port": "8080"}
config["server"]["timeout"] = "60"  # override default

with open("settings.ini", "w") as f:
    config.write(f)

cfg = configparser.ConfigParser()
cfg.read("settings.ini")
print(cfg["server"]["host"])    # localhost
print(cfg["server"]["timeout"]) # 60 (overridden)
print(cfg["server"]["retries"]) # 3  (from DEFAULT)`,
    explanation:
      "ConfigParser supports interpolation and a DEFAULT section that provides fallback values for all other sections; values are always strings — convert explicitly.",
  },
  {
    id: "py-importlib",
    language: "python",
    title: "importlib — dynamic module import and reload",
    tag: "snippet",
    code: `import importlib, sys

# Dynamic import by name string
mod = importlib.import_module("json")
print(mod.dumps({"a": 1}))

# Import a submodule
os_path = importlib.import_module("os.path")

# Reload (picks up source changes in dev tools):
import mymodule
importlib.reload(mymodule)

# Check if a module is importable:
spec = importlib.util.find_spec("numpy")
print(spec is not None)  # False if not installed`,
    explanation:
      "importlib.import_module is the documented way to do string-based imports; reload is useful in REPL sessions but risky in production (state from old module may persist in existing references).",
  },

  // ── understanding ─────────────────────────────────────────────────────────
  {
    id: "py-understand-mro-c3",
    language: "python",
    title: "MRO — C3 linearization algorithm",
    tag: "understanding",
    code: `class A: pass
class B(A): pass
class C(A): pass
class D(B, C): pass

print(D.__mro__)
# (<class 'D'>, <class 'B'>, <class 'C'>, <class 'A'>, <class 'object'>)

# Ambiguous MRO raises TypeError:
# class E(D, B): pass  # OK
# class F(A, B): pass  # TypeError — violates monotonicity`,
    explanation:
      "C3 linearization ensures every type appears after all its bases, and the order of bases in subclass declarations is preserved; violations raise TypeError at class definition time.",
  },
  {
    id: "py-understand-nonlocal",
    language: "python",
    title: "nonlocal — rebind outer (non-global) variables",
    tag: "understanding",
    code: `def make_counter():
    count = 0
    def inc():
        nonlocal count   # rebind the enclosing 'count', not create local
        count += 1
        return count
    return inc

c = make_counter()
print(c(), c(), c())  # 1 2 3

# Without nonlocal:
def broken():
    x = 0
    def f():
        x += 1  # UnboundLocalError — x is local but not yet assigned
    return f`,
    explanation:
      "nonlocal targets the nearest enclosing scope (not global); without it, any assignment to a name inside a function makes that name local for the entire function body.",
  },
  {
    id: "py-understand-slots-weakref",
    language: "python",
    title: "__slots__ and weakref — adding __weakref__ explicitly",
    tag: "understanding",
    code: `import weakref

class Node:
    __slots__ = ("value", "next", "__weakref__")  # must include __weakref__
    def __init__(self, v): self.value = v; self.next = None

n = Node(42)
ref = weakref.ref(n)
print(ref())   # <Node ...>
n = None
print(ref())   # None — object was collected`,
    explanation:
      "__slots__ removes the instance __dict__, preventing per-instance attribute storage; to allow weak references to slotted objects you must explicitly add '__weakref__' to __slots__.",
  },
  {
    id: "py-understand-instancecheck",
    language: "python",
    title: "__instancecheck__ — custom isinstance behaviour",
    tag: "understanding",
    code: `class NumberMeta(type):
    def __instancecheck__(cls, instance):
        return isinstance(instance, (int, float, complex))

class Number(metaclass=NumberMeta):
    pass

print(isinstance(42, Number))     # True
print(isinstance("hi", Number))   # False
print(isinstance(3.14, Number))   # True`,
    explanation:
      "__instancecheck__ is called by isinstance(obj, cls) when cls has a metaclass that defines it; this powers ABCs like collections.abc.Sequence which accept unregistered classes.",
  },
  {
    id: "py-understand-subclasshook",
    language: "python",
    title: "ABCMeta.__subclasshook__ — structural isinstance",
    tag: "understanding",
    code: `from abc import ABC, ABCMeta, abstractmethod

class Drawable(ABC):
    @classmethod
    def __subclasshook__(cls, C):
        if cls is Drawable:
            if any("draw" in B.__dict__ for B in C.__mro__):
                return True
        return NotImplemented

class Circle:          # NOT a subclass of Drawable
    def draw(self): pass

print(isinstance(Circle(), Drawable))   # True — structural check
print(issubclass(Circle, Drawable))     # True`,
    explanation:
      "__subclasshook__ enables structural subtyping (duck typing) for ABCs; returning True makes isinstance/issubclass return True even for unregistered classes that have the required methods.",
  },
  {
    id: "py-understand-classvar-shadow",
    language: "python",
    title: "Class variable vs instance variable — shadowing",
    tag: "understanding",
    code: `class Config:
    debug = False       # class variable

c = Config()
c.debug = True          # creates INSTANCE variable, shadows class var
print(c.debug)          # True  (instance)
print(Config.debug)     # False (class still False)
del c.debug
print(c.debug)          # False (class variable visible again)`,
    explanation:
      "Assigning to an attribute on an instance creates an instance variable that shadows the class variable; deleting the instance variable reveals the class variable again through normal lookup.",
  },

  // ── structures ────────────────────────────────────────────────────────────
  {
    id: "py-collections-deque",
    language: "python",
    title: "collections.deque with maxlen — sliding window",
    tag: "structures",
    code: `from collections import deque

# FIFO queue
q: deque[int] = deque()
q.append(1); q.append(2)
print(q.popleft())  # 1

# Sliding window (fixed size)
window: deque[int] = deque(maxlen=3)
for n in range(6):
    window.append(n)
    print(list(window))
# [0] [0,1] [0,1,2] [1,2,3] [2,3,4] [3,4,5]`,
    explanation:
      "deque supports O(1) append and popleft from both ends; maxlen creates a bounded ring buffer that automatically discards the oldest element when the limit is exceeded.",
  },
  {
    id: "py-io-stringio",
    language: "python",
    title: "io.StringIO / BytesIO — in-memory file objects",
    tag: "structures",
    code: `import io, csv

# StringIO as write buffer
buf = io.StringIO()
writer = csv.writer(buf)
writer.writerow(["name", "age"])
writer.writerow(["Alice", 30])
print(buf.getvalue())

# BytesIO for binary operations
binary = io.BytesIO(b"\\x00\\x01\\x02")
data = binary.read(2)
print(data.hex())  # 0001`,
    explanation:
      "StringIO and BytesIO implement the full file interface in memory; they are useful for testing code that writes to files or for generating content without touching disk.",
  },
  {
    id: "py-bisect",
    language: "python",
    title: "bisect — maintain a sorted list",
    tag: "structures",
    code: `import bisect

scores = [10, 20, 30, 40, 50]
bisect.insort(scores, 35)         # O(n) insert but O(log n) search
print(scores)  # [10, 20, 30, 35, 40, 50]

idx = bisect.bisect_left(scores, 35)
print(idx)  # 3

# Grade boundaries
grades = [60, 70, 80, 90]
labels = ["F", "D", "C", "B", "A"]
print(labels[bisect.bisect(grades, 85)])  # B`,
    explanation:
      "bisect maintains sorted order using binary search; bisect_left finds the leftmost insertion point (for uniqueness checks), bisect finds the rightmost (for range classification).",
  },
  {
    id: "py-array-module",
    language: "python",
    title: "array.array — typed C arrays",
    tag: "structures",
    code: `import array

# Type codes: 'b' int8, 'h' int16, 'i' int32, 'f' float32, 'd' float64
nums = array.array("i", [1, 2, 3, 4, 5])
nums.append(6)
nums.extend([7, 8])
print(nums.itemsize)    # 4 bytes per item
print(nums.tobytes())   # raw bytes

# Much more memory-efficient than list of ints for large datasets`,
    explanation:
      "array.array stores elements in a contiguous typed C array; for integer/float data it uses far less memory than a Python list and supports buffer protocol for zero-copy I/O.",
  },
  {
    id: "py-memoryview",
    language: "python",
    title: "memoryview — zero-copy buffer protocol",
    tag: "structures",
    code: `data = bytearray(b"Hello, World!")
mv = memoryview(data)

# Slice without copying:
sub = mv[7:12]
print(bytes(sub))     # b'World'

# Modify in place:
mv[0:5] = b"Howdy"
print(bytes(data))    # b'Howdy, World!'

# Works with array.array, numpy arrays, etc.`,
    explanation:
      "memoryview exposes the buffer protocol of bytes-like objects; slicing creates a view (not a copy), enabling efficient in-place modification and zero-copy data passing between APIs.",
  },
  {
    id: "py-asyncio-queue",
    language: "python",
    title: "asyncio.Queue — async producer-consumer",
    tag: "structures",
    code: `import asyncio

async def producer(q: asyncio.Queue):
    for i in range(5):
        await q.put(i)
        print(f"produced {i}")
    await q.put(None)  # sentinel

async def consumer(q: asyncio.Queue):
    while True:
        item = await q.get()
        if item is None: break
        print(f"consumed {item}")
        q.task_done()

async def main():
    q: asyncio.Queue = asyncio.Queue(maxsize=2)
    await asyncio.gather(producer(q), consumer(q))

asyncio.run(main())`,
    explanation:
      "asyncio.Queue suspends the producer coroutine with await put() when full (backpressure) and suspends the consumer with await get() when empty, without blocking the event loop.",
  },
  {
    id: "py-functools-lru-none",
    language: "python",
    title: "functools.lru_cache(maxsize=None) — unlimited memo",
    tag: "structures",
    code: `from functools import lru_cache, cache  # cache is lru_cache(None) alias

@cache
def fib(n: int) -> int:
    if n < 2: return n
    return fib(n - 1) + fib(n - 2)

print(fib(100))  # 354224848179261915075
print(fib.cache_info())  # hits=197, misses=101, maxsize=None, currsize=101`,
    explanation:
      "@cache (Python 3.9+) is an alias for @lru_cache(maxsize=None) — a pure dictionary cache with no eviction; results are stored indefinitely, so only use it for bounded argument spaces.",
  },

  // ── caveats ───────────────────────────────────────────────────────────────
  {
    id: "py-caveat-mutable-default",
    language: "python",
    title: "Mutable default argument — shared across calls",
    tag: "caveats",
    code: `# WRONG — list is created once at function definition
def append_to(val, lst=[]):
    lst.append(val)
    return lst

print(append_to(1))  # [1]
print(append_to(2))  # [2] — wait, [1, 2]!

# CORRECT — use None sentinel
def append_to_fixed(val, lst=None):
    if lst is None:
        lst = []
    lst.append(val)
    return lst`,
    explanation:
      "Default argument values are evaluated once when the def statement executes; mutable defaults (list, dict, set) are shared across all calls — always use None and create inside the body.",
  },
  {
    id: "py-caveat-string-identity",
    language: "python",
    title: "String interning — 'is' vs '==' for strings",
    tag: "caveats",
    code: `a = "hello"
b = "hello"
print(a is b)    # True  — CPython interns short literals

x = "hello world"
y = "hello world"
print(x is y)    # True  in CPython (implementation detail!)

# Never rely on 'is' for string equality:
s = "".join(["h","e","l","l","o"])
print(s is "hello")  # False — dynamically constructed string`,
    explanation:
      "CPython interns many string literals as an optimisation, making 'is' comparisons appear to work; this is an implementation detail — always use '==' to compare string values.",
  },
  {
    id: "py-caveat-tuple-single",
    language: "python",
    title: "Single-element tuple needs trailing comma",
    tag: "caveats",
    code: `not_a_tuple = (42)       # just parenthesised int
is_a_tuple  = (42,)      # one-element tuple
also_tuple  = 42,        # no parens needed, comma creates tuple

print(type(not_a_tuple))  # <class 'int'>
print(type(is_a_tuple))   # <class 'tuple'>

# Common mistake:
coords = (3.0)   # float, not tuple
coords = (3.0,)  # correct single-element tuple`,
    explanation:
      "In Python the comma creates a tuple, not the parentheses; (42) is 42 with grouping, while (42,) is a one-element tuple — the trailing comma is mandatory.",
  },
  {
    id: "py-caveat-generator-exhausted",
    language: "python",
    title: "Generator exhaustion is silent",
    tag: "caveats",
    code: `gen = (x**2 for x in range(5))

print(list(gen))  # [0, 1, 4, 9, 16]
print(list(gen))  # [] — generator is exhausted, no error!

# zip stops at the shortest iterable — no warning:
a = [1, 2, 3]
b = [10, 20]
print(list(zip(a, b)))  # [(1, 10), (2, 20)] — 3 is silently dropped

# Use zip(strict=True) in Python 3.10+ to detect mismatch:
# list(zip(a, b, strict=True))  # ValueError`,
    explanation:
      "Generators are stateful and single-pass; iterating an exhausted generator returns immediately with no items and no exception, making repeated iteration a silent data-loss bug.",
  },
  {
    id: "py-caveat-round-bankers",
    language: "python",
    title: "round() uses banker's rounding (round half to even)",
    tag: "caveats",
    code: `# Python uses IEEE 754 round-half-to-even:
print(round(0.5))   # 0  — rounds to nearest even
print(round(1.5))   # 2  — rounds to nearest even
print(round(2.5))   # 2  — rounds to nearest even
print(round(3.5))   # 4

# For always-round-up, use Decimal:
from decimal import Decimal, ROUND_HALF_UP
print(Decimal("2.5").quantize(Decimal("1"), ROUND_HALF_UP))  # 3`,
    explanation:
      "Banker's rounding reduces cumulative bias when rounding many values but surprises users expecting always-round-up; use Decimal.quantize with explicit ROUND_HALF_UP for financial rounding.",
  },
  {
    id: "py-caveat-zip-strict",
    language: "python",
    title: "zip strict=True — detect length mismatches (3.10+)",
    tag: "caveats",
    code: `names  = ["Alice", "Bob", "Carol"]
scores = [95, 87]  # one element missing

# Silent: Carol's score is dropped
for n, s in zip(names, scores):
    print(n, s)

# Explicit: ValueError on mismatch
try:
    list(zip(names, scores, strict=True))
except ValueError as e:
    print(e)  # zip() has arguments with different lengths`,
    explanation:
      "zip without strict silently truncates to the shortest iterable; strict=True raises ValueError if iterables differ in length, catching mismatched data bugs early.",
  },

  // ── types ─────────────────────────────────────────────────────────────────
  {
    id: "py-type-typealias",
    language: "python",
    title: "TypeAlias — explicit type alias declaration",
    tag: "types",
    code: `from typing import TypeAlias

# PEP 613 — explicit alias (avoids confusion with regular assignment)
Vector: TypeAlias = list[float]
Matrix: TypeAlias = list[list[float]]

def dot(a: Vector, b: Vector) -> float:
    return sum(x * y for x, y in zip(a, b))

# Python 3.12 — PEP 695 type statement:
type Point = tuple[float, float]`,
    explanation:
      "TypeAlias signals to type checkers that an assignment is an alias, not a variable; PEP 695 introduces the type keyword as a cleaner syntax in Python 3.12.",
  },
  {
    id: "py-type-never",
    language: "python",
    title: "Never / NoReturn — unreachable code and exhaustive checks",
    tag: "types",
    code: `from typing import Never, assert_never

def unreachable(x: Never) -> Never:
    raise AssertionError(f"Should be unreachable: {x!r}")

type Shape = Circle | Square | Triangle

def area(s: Shape) -> float:
    match s:
        case Circle(r=r):     return 3.14 * r**2
        case Square(side=s):  return s**2
        case Triangle():      return 0.0
        case _ as bad:
            assert_never(bad)  # type error if Shape gains a new variant`,
    explanation:
      "assert_never(x) is typed to accept Never; if x can reach it, the type checker reports an error because it proves not all cases are handled — a compile-time exhaustiveness check.",
  },
  {
    id: "py-type-get-hints",
    language: "python",
    title: "typing.get_type_hints — resolve annotations at runtime",
    tag: "types",
    code: `from typing import get_type_hints

class User:
    name: str
    age:  int
    email: "str | None"  # forward reference as string

hints = get_type_hints(User)
print(hints)
# {'name': <class 'str'>, 'age': <class 'int'>, 'email': str | None}

# get_type_hints evaluates stringified annotations in the correct namespace`,
    explanation:
      "get_type_hints evaluates PEP 563 stringified annotations (from __future__ import annotations or quoted strings) into actual types, enabling runtime introspection and validation frameworks.",
  },
  {
    id: "py-type-typevar-bound",
    language: "python",
    title: "TypeVar with bound and constraints",
    tag: "types",
    code: `from typing import TypeVar

# Bound — T must be a subtype of Comparable
Comparable = TypeVar("Comparable", bound=object)

# Constraint — T can only be int or str (not subtypes)
Number = TypeVar("Number", int, float, complex)

from typing import SupportsFloat
Numeric = TypeVar("Numeric", bound=SupportsFloat)

def double(x: Numeric) -> Numeric:
    return x + x  # type: ignore`,
    explanation:
      "A bound TypeVar accepts any subtype of the bound class; a constrained TypeVar accepts only the listed types exactly — use bound for protocol-like flexibility, constraints for closed type sets.",
  },
  {
    id: "py-type-overload",
    language: "python",
    title: "@overload — multiple call signatures",
    tag: "types",
    code: `from typing import overload

@overload
def process(x: int) -> str: ...
@overload
def process(x: str) -> int: ...

def process(x):
    if isinstance(x, int):
        return str(x)
    return int(x)

reveal_type(process(42))    # str
reveal_type(process("42"))  # int`,
    explanation:
      "@overload stubs teach the type checker about multiple call signatures; only the implementation (without @overload) runs at runtime — stubs use ... as the body.",
  },

  // ── families ──────────────────────────────────────────────────────────────
  {
    id: "py-family-subprocess",
    language: "python",
    title: "subprocess — run vs Popen vs os.system",
    tag: "families",
    code: `import subprocess, os

# os.system — no capture, shell injection risk, avoid
os.system("ls -l")

# subprocess.run — blocking, recommended for simple cases
r = subprocess.run(["ls", "-l"], capture_output=True, text=True)
print(r.stdout)

# subprocess.Popen — non-blocking, streaming
with subprocess.Popen(["tail", "-f", "app.log"],
                      stdout=subprocess.PIPE, text=True) as p:
    for line in p.stdout:  # type: ignore
        print(line, end="")`,
    explanation:
      "Always prefer subprocess.run with a list (not a shell string) to avoid shell injection; Popen is needed for streaming or bidirectional communication; never use os.system in production.",
  },
  {
    id: "py-family-logging-vs-print",
    language: "python",
    title: "logging vs print — when to use each",
    tag: "families",
    code: `import logging

# print: one-off debug during development, scripts that pipe output
print("data:", result)

# logging: production code, libraries, anything needing level control
logging.basicConfig(level=logging.INFO)
logging.info("Processing %d items", count)   # lazy formatting
logging.debug("Detail: %r", data)            # skipped if level > DEBUG
logging.exception("Unhandled error")         # includes traceback

# Libraries should NEVER configure logging — only emit:
logger = logging.getLogger(__name__)
logger.warning("Config missing, using defaults")`,
    explanation:
      "Print is appropriate for script output; logging provides levels, handlers, formatters, and lazy string formatting; libraries must not call basicConfig — that is the application's responsibility.",
  },
  {
    id: "py-family-pathlib-vs-os",
    language: "python",
    title: "pathlib.Path vs os.path — modern vs classic",
    tag: "families",
    code: `from pathlib import Path
import os

p = Path("/home/user/data")
child = p / "file.txt"          # path joining with /
print(child.suffix)             # .txt
print(child.stem)               # file
print(child.parent)             # /home/user/data
exists = child.exists()         # bool
text = child.read_text()        # one-liner

# os.path equivalent (more verbose):
full = os.path.join("/home/user/data", "file.txt")
exists2 = os.path.exists(full)`,
    explanation:
      "pathlib.Path is the modern API; / operator joins paths, methods are chainable, and common operations like read_text/write_text are one-liners — prefer it over os.path in new code.",
  },
  {
    id: "py-family-socket-requests",
    language: "python",
    title: "socket vs requests vs httpx vs aiohttp",
    tag: "families",
    code: `# socket — low-level, full control, verbose
import socket
s = socket.socket(); s.connect(("example.com", 80))

# requests — sync, simple, de-facto standard for scripts
import requests
r = requests.get("https://api.example.com/data", timeout=5)

# httpx — sync + async, modern API, HTTP/2
import httpx
async with httpx.AsyncClient() as c:
    r = await c.get("https://api.example.com/data")

# aiohttp — async, high-performance server+client
import aiohttp
async with aiohttp.ClientSession() as s:
    async with s.get("https://api.example.com") as r:
        data = await r.json()`,
    explanation:
      "Use requests for synchronous scripts; httpx for projects that need both sync and async; aiohttp for async-first high-throughput services; raw sockets only for custom protocols.",
  },
  {
    id: "py-family-multiprocessing-pool",
    language: "python",
    title: "multiprocessing.Pool vs ProcessPoolExecutor",
    tag: "families",
    code: `from multiprocessing import Pool
from concurrent.futures import ProcessPoolExecutor

def square(x): return x * x

# Pool (older API)
with Pool(processes=4) as pool:
    results = pool.map(square, range(10))

# ProcessPoolExecutor (modern, consistent with ThreadPoolExecutor)
with ProcessPoolExecutor(max_workers=4) as ex:
    futures = [ex.submit(square, i) for i in range(10)]
    results = [f.result() for f in futures]`,
    explanation:
      "ProcessPoolExecutor is preferred for new code — it shares the futures API with ThreadPoolExecutor; Pool.map is convenient but blocks; both bypass the GIL for CPU-bound work.",
  },

  // ── classes ───────────────────────────────────────────────────────────────
  {
    id: "py-class-class-getitem",
    language: "python",
    title: "__class_getitem__ — custom generic subscript",
    tag: "classes",
    code: `class TypedList:
    def __class_getitem__(cls, item):
        return type(
            f"{cls.__name__}[{item.__name__}]",
            (cls,),
            {"_type": item}
        )

    def __init__(self):
        self._data = []

    def append(self, val):
        if not isinstance(val, self._type):
            raise TypeError(f"Expected {self._type}")
        self._data.append(val)

IntList = TypedList[int]
lst = IntList()
lst.append(42)
# lst.append("x")  # TypeError`,
    explanation:
      "__class_getitem__ is called when you write ClassName[X]; the standard library uses it to enable list[int] / dict[str,int] syntax without requiring runtime metaclass machinery.",
  },
  {
    id: "py-class-getstate-setstate",
    language: "python",
    title: "__getstate__ / __setstate__ — custom pickling",
    tag: "classes",
    code: `import pickle

class Connection:
    def __init__(self, host, port):
        self.host = host
        self.port = port
        self._socket = None   # not picklable

    def __getstate__(self):
        state = self.__dict__.copy()
        del state["_socket"]   # exclude
        return state

    def __setstate__(self, state):
        self.__dict__.update(state)
        self._socket = None    # reinitialise

c = Connection("localhost", 9090)
p = pickle.dumps(c)
c2 = pickle.loads(p)
print(c2.host, c2._socket)  # localhost None`,
    explanation:
      "__getstate__ returns the state dict that pickle serialises; __setstate__ restores it — use this to exclude unpicklable attributes (sockets, file handles, locks) from serialisation.",
  },
  {
    id: "py-class-reduce",
    language: "python",
    title: "__reduce__ — full control over pickling reconstruction",
    tag: "classes",
    code: `import pickle

class Singleton:
    _instance = None

    @classmethod
    def get(cls):
        if cls._instance is None:
            cls._instance = object.__new__(cls)
        return cls._instance

    def __reduce__(self):
        return (self.get, ())   # reconstruct via class method

s1 = Singleton.get()
p  = pickle.dumps(s1)
s2 = pickle.loads(p)
print(s1 is s2)  # True — singleton preserved across pickle`,
    explanation:
      "__reduce__ returns a (callable, args) pair; pickle calls callable(*args) to reconstruct the object — useful when the normal __init__ path must not run during unpickling.",
  },
  {
    id: "py-class-abstract-classmethod",
    language: "python",
    title: "Abstract class method in ABC",
    tag: "classes",
    code: `from abc import ABC, abstractmethod

class Serialiser(ABC):
    @classmethod
    @abstractmethod
    def from_string(cls, s: str) -> "Serialiser":
        """Parse from string representation."""
        ...

    @abstractmethod
    def to_string(self) -> str: ...

class JsonSerialiser(Serialiser):
    def __init__(self, data): self.data = data

    @classmethod
    def from_string(cls, s): import json; return cls(json.loads(s))
    def to_string(self): import json; return json.dumps(self.data)`,
    explanation:
      "Combining @classmethod and @abstractmethod forces subclasses to implement a class method factory; the order must be @classmethod first, @abstractmethod second.",
  },
  {
    id: "py-class-property-deleter",
    language: "python",
    title: "@property with getter, setter, deleter",
    tag: "classes",
    code: `class Temperature:
    def __init__(self, celsius=0):
        self._c = celsius

    @property
    def celsius(self):
        return self._c

    @celsius.setter
    def celsius(self, val):
        if val < -273.15:
            raise ValueError("Below absolute zero")
        self._c = val

    @celsius.deleter
    def celsius(self):
        self._c = 0   # reset to default

t = Temperature(25)
t.celsius = -300   # ValueError
del t.celsius      # reset to 0`,
    explanation:
      "The deleter is the third property slot invoked by del obj.attr; it is useful for resetting to a default or releasing an associated resource rather than removing the attribute.",
  },
  {
    id: "py-class-copy-deepcopy",
    language: "python",
    title: "__copy__ / __deepcopy__ — custom copy behaviour",
    tag: "classes",
    code: `import copy

class Graph:
    def __init__(self):
        self.nodes: list = []
        self.edges: list = []

    def __copy__(self):
        # Shallow: same edge/node lists
        new = Graph()
        new.nodes = self.nodes
        new.edges = self.edges
        return new

    def __deepcopy__(self, memo):
        new = Graph()
        memo[id(self)] = new
        new.nodes = copy.deepcopy(self.nodes, memo)
        new.edges = copy.deepcopy(self.edges, memo)
        return new`,
    explanation:
      "__copy__ is called by copy.copy(); __deepcopy__ by copy.deepcopy(); the memo dict prevents infinite recursion on circular references by caching already-copied objects.",
  },
  {
    id: "py-class-cooperative-super",
    language: "python",
    title: "Cooperative multiple inheritance with super()",
    tag: "classes",
    code: `class LogMixin:
    def process(self):
        print("LogMixin.process")
        super().process()      # delegates to next in MRO

class ValidateMixin:
    def process(self):
        print("ValidateMixin.process")
        super().process()

class Base:
    def process(self):
        print("Base.process")

class Service(LogMixin, ValidateMixin, Base):
    pass

Service().process()
# LogMixin.process
# ValidateMixin.process
# Base.process`,
    explanation:
      "super() follows the MRO chain — each mixin's super() passes control to the next class in the MRO, enabling all mixins to participate without knowing about each other.",
  },
  {
    id: "py-class-descriptor-full",
    language: "python",
    title: "Full data descriptor — __get__, __set__, __delete__",
    tag: "classes",
    code: `class Validated:
    def __set_name__(self, owner, name):
        self._name = f"_{name}"

    def __get__(self, obj, objtype=None):
        if obj is None: return self
        return getattr(obj, self._name, None)

    def __set__(self, obj, value):
        if not isinstance(value, int):
            raise TypeError(f"{self._name} must be int")
        setattr(obj, self._name, value)

    def __delete__(self, obj):
        delattr(obj, self._name)

class Point:
    x = Validated()
    y = Validated()

p = Point()
p.x = 10
# p.x = "bad"  # TypeError`,
    explanation:
      "A data descriptor defines both __get__ and __set__ (and optionally __delete__); it takes priority over instance __dict__ entries, unlike non-data descriptors which only define __get__.",
  },
  {
    id: "py-class-paramspec",
    language: "python",
    title: "ParamSpec — preserve callable signatures in decorators",
    tag: "classes",
    code: `from typing import ParamSpec, Callable, TypeVar
import functools

P = ParamSpec("P")
R = TypeVar("R")

def retry(times: int):
    def decorator(fn: Callable[P, R]) -> Callable[P, R]:
        @functools.wraps(fn)
        def wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
            for _ in range(times):
                try: return fn(*args, **kwargs)
                except Exception: pass
            raise RuntimeError("All retries failed")
        return wrapper
    return decorator

@retry(3)
def fetch(url: str, timeout: int = 5) -> str:
    return "data"`,
    explanation:
      "ParamSpec captures the parameter specification of a callable so that wrapper functions retain full type information about the wrapped function's arguments and keyword arguments.",
  },
  {
    id: "py-class-total-ordering",
    language: "python",
    title: "@functools.total_ordering — derive comparison methods",
    tag: "classes",
    code: `from functools import total_ordering

@total_ordering
class Version:
    def __init__(self, major, minor, patch):
        self.v = (major, minor, patch)

    def __eq__(self, other): return self.v == other.v
    def __lt__(self, other): return self.v < other.v

v1 = Version(1, 2, 3)
v2 = Version(1, 3, 0)
print(v1 < v2)   # True
print(v1 <= v2)  # True  — derived
print(v2 > v1)   # True  — derived
print(v2 >= v1)  # True  — derived`,
    explanation:
      "@total_ordering fills in >, >=, <= from __eq__ and __lt__; it reduces boilerplate but is slower than manually implementing all six methods due to the indirection.",
  },

  // ── more snippets ─────────────────────────────────────────────────────────
  {
    id: "py-email-compose",
    language: "python",
    title: "email.message — compose and parse RFC 5322 messages",
    tag: "snippet",
    code: `from email.message import EmailMessage
import smtplib

msg = EmailMessage()
msg["From"]    = "sender@example.com"
msg["To"]      = "recipient@example.com"
msg["Subject"] = "Test"
msg.set_content("Hello from Python!")

# Add HTML alternative:
msg.add_alternative("<h1>Hello</h1>", subtype="html")

# Attach a file:
with open("report.pdf", "rb") as f:
    msg.add_attachment(f.read(), maintype="application",
                       subtype="pdf", filename="report.pdf")

print(msg.as_string()[:200])`,
    explanation:
      "EmailMessage (Python 3.6+) builds MIME messages with a clean API; add_alternative adds related text/html parts, add_attachment handles arbitrary binary attachments.",
  },
  {
    id: "py-pathlib-glob",
    language: "python",
    title: "pathlib.Path.glob and rglob — recursive file search",
    tag: "snippet",
    code: `from pathlib import Path

src = Path(".")
# Non-recursive — direct children only
for f in src.glob("*.py"):
    print(f)

# Recursive — all depths
for f in src.rglob("*.py"):
    print(f.relative_to(src))

# Pattern with directory
for f in src.glob("**/test_*.py"):
    print(f)`,
    explanation:
      "glob uses Unix shell patterns; ** matches any number of directories; rglob is shorthand for glob('**/<pattern>') — both return generators of Path objects.",
  },
  {
    id: "py-tarfile",
    language: "python",
    title: "tarfile — create and extract tar archives",
    tag: "snippet",
    code: `import tarfile

# Create compressed archive
with tarfile.open("backup.tar.gz", "w:gz") as tar:
    tar.add("src/", arcname="src")

# List contents
with tarfile.open("backup.tar.gz") as tar:
    tar.list()

# Extract specific member
with tarfile.open("backup.tar.gz") as tar:
    member = tar.getmember("src/main.py")
    f = tar.extractfile(member)
    if f:
        print(f.read().decode())`,
    explanation:
      "tarfile supports gz, bz2, xz compression via the mode string (w:gz, r:bz2); extractfile returns a file-like object without extracting to disk, enabling in-memory processing.",
  },
  {
    id: "py-contextlib-suppress",
    language: "python",
    title: "contextlib.suppress — silence specific exceptions",
    tag: "snippet",
    code: `from contextlib import suppress
import os

# Instead of try/except/pass
with suppress(FileNotFoundError):
    os.remove("temp.txt")

# Equivalent but noisier:
try:
    os.remove("temp.txt")
except FileNotFoundError:
    pass`,
    explanation:
      "contextlib.suppress is a context manager that silently catches and ignores the listed exception types; cleaner than bare except blocks when intentionally discarding errors.",
  },
  {
    id: "py-functools-partial",
    language: "python",
    title: "functools.partial — partial function application",
    tag: "snippet",
    code: `from functools import partial

def power(base, exponent):
    return base ** exponent

square = partial(power, exponent=2)
cube   = partial(power, exponent=3)

print(square(5))  # 25
print(cube(3))    # 27

# Useful for callbacks that need extra arguments:
import logging
log_error = partial(logging.log, logging.ERROR)
log_error("Something went wrong")`,
    explanation:
      "partial freezes some arguments of a function, returning a new callable with fewer parameters; it is cleaner than a lambda when you need to pre-bind one or more named arguments.",
  },

  // ── more understanding ────────────────────────────────────────────────────
  {
    id: "py-understand-contextmanager",
    language: "python",
    title: "@contextmanager — generator-based context managers",
    tag: "understanding",
    code: `from contextlib import contextmanager
import tempfile, os

@contextmanager
def temp_directory():
    d = tempfile.mkdtemp()
    try:
        yield d                # code inside 'with' block runs here
    finally:
        import shutil
        shutil.rmtree(d)       # always clean up

with temp_directory() as path:
    open(os.path.join(path, "file.txt"), "w").close()
print("directory cleaned up")`,
    explanation:
      "@contextmanager turns a generator with exactly one yield into a context manager; code before yield is __enter__, code after (in try/finally) is __exit__ — exceptions propagate through yield.",
  },
  {
    id: "py-understand-walrus-scope",
    language: "python",
    title: "Walrus operator scope in comprehensions",
    tag: "understanding",
    code: `# Walrus leaks out of the comprehension (unlike regular for-variable)
results = [y := f(x) for x in range(5) if (y := x**2) > 5]
print(y)   # last value of y from comprehension is accessible here

# Common use: avoid calling expensive function twice
filtered = [clean for s in strings if (clean := s.strip())]`,
    explanation:
      "The := (walrus) operator assigns and returns; unlike the comprehension iteration variable, names bound by := are visible in the enclosing scope after the comprehension finishes.",
  },
  {
    id: "py-understand-exception-chaining",
    language: "python",
    title: "Exception chaining — __cause__ vs __context__",
    tag: "understanding",
    code: `# Implicit chaining (__context__) — happens automatically
try:
    int("bad")
except ValueError:
    raise RuntimeError("parse failed")   # shows "During handling of..."

# Explicit chaining (__cause__) — 'raise X from Y'
try:
    int("bad")
except ValueError as e:
    raise RuntimeError("parse failed") from e   # "The above ... was the direct cause"

# Suppress context:
raise RuntimeError("standalone") from None`,
    explanation:
      "'raise X from Y' sets __cause__ and marks it as the direct cause; automatic chaining sets __context__; 'from None' suppresses the context so only the new exception is shown.",
  },

  // ── more structures ────────────────────────────────────────────────────────
  {
    id: "py-itertools-groupby",
    language: "python",
    title: "itertools.groupby — group consecutive elements",
    tag: "structures",
    code: `from itertools import groupby

data = [("a", 1), ("a", 2), ("b", 3), ("a", 4)]
# Sort by key FIRST — groupby only groups consecutive equal keys
data.sort(key=lambda t: t[0])

for key, group in groupby(data, key=lambda t: t[0]):
    print(key, list(group))
# a [('a', 1), ('a', 2), ('a', 4)]
# b [('b', 3)]`,
    explanation:
      "groupby groups consecutive equal key values — the input must be sorted by the key first, otherwise non-consecutive identical keys produce separate groups.",
  },
  {
    id: "py-itertools-chain",
    language: "python",
    title: "itertools.chain and chain.from_iterable",
    tag: "structures",
    code: `from itertools import chain

# Concatenate iterables lazily
combined = chain([1, 2], [3, 4], range(5, 8))
print(list(combined))  # [1, 2, 3, 4, 5, 6, 7]

# Flatten one level of nesting
nested = [[1, 2], [3, 4], [5]]
flat = list(chain.from_iterable(nested))
print(flat)  # [1, 2, 3, 4, 5]

# Equivalent to: [x for sub in nested for x in sub]`,
    explanation:
      "chain lazily concatenates iterables; chain.from_iterable flattens exactly one level of nesting without building intermediate lists — both are memory-efficient.",
  },
  {
    id: "py-itertools-accumulate",
    language: "python",
    title: "itertools.accumulate — running reductions",
    tag: "structures",
    code: `from itertools import accumulate
import operator

nums = [1, 2, 3, 4, 5]

# Default: running sum
print(list(accumulate(nums)))  # [1, 3, 6, 10, 15]

# Running product
print(list(accumulate(nums, operator.mul)))  # [1, 2, 6, 24, 120]

# Running max
print(list(accumulate(nums, max)))  # [1, 2, 3, 4, 5]

# With initial value (3.8+)
print(list(accumulate(nums, initial=100)))  # [100, 101, 103, 106, 110, 115]`,
    explanation:
      "accumulate yields partial reduction results lazily; the default operator is addition (prefix sums); any binary function works — useful for sliding aggregates without explicit loops.",
  },

  // ── more types ──────────────────────────────────────────────────────────
  {
    id: "py-type-covariant-typevar",
    language: "python",
    title: "Covariant and contravariant TypeVar",
    tag: "types",
    code: `from typing import TypeVar, Generic

T_co = TypeVar("T_co", covariant=True)     # out
T_cn = TypeVar("T_cn", contravariant=True) # in

class Producer(Generic[T_co]):
    def produce(self) -> T_co: ...

class Consumer(Generic[T_cn]):
    def consume(self, val: T_cn) -> None: ...

# Producer[str] is a subtype of Producer[object] (covariant)
# Consumer[object] is a subtype of Consumer[str] (contravariant)`,
    explanation:
      "Covariant TypeVar allows Producer[str] to be used where Producer[object] is expected (outputs are safe to widen); contravariant TypeVar allows Consumer[object] where Consumer[str] is expected (inputs are safe to generalise).",
  },
  {
    id: "py-type-protocol-callable",
    language: "python",
    title: "Protocol with __call__ — callable interface",
    tag: "types",
    code: `from typing import Protocol

class Handler(Protocol):
    def __call__(self, request: dict) -> dict: ...

def run(handler: Handler, req: dict) -> dict:
    return handler(req)

# Any callable with matching signature satisfies Handler:
def echo(request: dict) -> dict:
    return request

run(echo, {"path": "/"})  # type checks cleanly`,
    explanation:
      "A Protocol with __call__ defines a callable interface that any function or class with a matching signature satisfies — no inheritance required, enabling structural typing for callbacks.",
  },

  // ── more families ──────────────────────────────────────────────────────────
  {
    id: "py-family-testing",
    language: "python",
    title: "unittest vs pytest vs hypothesis",
    tag: "families",
    code: `# unittest — stdlib, xUnit style
import unittest
class TestMath(unittest.TestCase):
    def test_add(self):
        self.assertEqual(1 + 1, 2)

# pytest — minimal boilerplate, plugins, fixtures
def test_add():
    assert 1 + 1 == 2

# hypothesis — property-based testing
from hypothesis import given, strategies as st
@given(st.integers(), st.integers())
def test_commutative(a, b):
    assert a + b == b + a`,
    explanation:
      "unittest requires class inheritance; pytest accepts plain functions and has richer fixtures; hypothesis generates counterexamples by exploring the input space — use all three together.",
  },
  {
    id: "py-family-date-time",
    language: "python",
    title: "datetime — naive vs aware, timedelta, timezone",
    tag: "families",
    code: `from datetime import datetime, timedelta, timezone

# Naive (no tz) — local time, cannot compare with aware
naive = datetime.now()

# Aware — always UTC for storage
utc_now = datetime.now(timezone.utc)

# Convert to another timezone
import zoneinfo
eastern = utc_now.astimezone(zoneinfo.ZoneInfo("America/New_York"))

# Arithmetic
tomorrow = utc_now + timedelta(days=1)
delta    = tomorrow - utc_now
print(delta.total_seconds())  # 86400.0`,
    explanation:
      "Always store and compare timestamps in UTC (aware datetimes); convert to local timezone only for display; naive and aware datetimes cannot be compared and will raise TypeError.",
  },

  // ── more caveats ──────────────────────────────────────────────────────────
  {
    id: "py-caveat-dict-key-mutation",
    language: "python",
    title: "Mutating a dict key after insertion breaks lookup",
    tag: "caveats",
    code: `key = [1, 2, 3]
# d = {key: "value"}  # TypeError — list is not hashable

# With a custom mutable class that is hashable:
class Bad:
    def __init__(self, v): self.v = v
    def __hash__(self): return hash(self.v)
    def __eq__(self, o): return self.v == o.v

b = Bad(1)
d = {b: "found"}
b.v = 999       # mutate the key!
print(d.get(b))  # None — hash changed, key is lost`,
    explanation:
      "If an object's hash value changes after being used as a dict key, the key becomes unreachable — dict.get returns None and the entry leaks. Always use immutable objects as dict keys.",
  },
  {
    id: "py-caveat-is-comparison-small-ints",
    language: "python",
    title: "Small integer caching — 'is' works by accident",
    tag: "caveats",
    code: `a = 256
b = 256
print(a is b)   # True  — CPython caches -5 to 256

a = 257
b = 257
print(a is b)   # False in general (True in some contexts!)

# The cache range is an implementation detail:
a = -5;  b = -5;  print(a is b)   # True
a = -6;  b = -6;  print(a is b)   # False`,
    explanation:
      "CPython caches small integers (-5 to 256) so that 'is' appears to work for value comparison; outside this range separate variables may or may not share identity — always use '==' for integers.",
  },
];
