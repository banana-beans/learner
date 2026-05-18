import type { Snippet } from "./types";

export const pythonSnippets20260518B1: Snippet[] = [
  {
    id: "py-b18-b1-zip-longest",
    language: "python",
    title: "itertools.zip_longest pads short iterables",
    tag: "snippet",
    code: `import itertools

a = [1, 2, 3]
b = ["a", "b"]

for pair in itertools.zip_longest(a, b, fillvalue=0):
    print(pair)
# (1, 'a')
# (2, 'b')
# (3, 0)  <-- filled`,
    explanation: "`zip_longest` continues until the longest iterable is exhausted, substituting `fillvalue` for the shorter ones instead of truncating at the shortest.",
  },
  {
    id: "py-b18-b1-split-maxsplit",
    language: "python",
    title: "str.split with maxsplit limit",
    tag: "snippet",
    code: `line = "GET /index.html HTTP/1.1"

method, rest = line.split(" ", maxsplit=1)
print(method)  # GET
print(rest)    # /index.html HTTP/1.1

# Without maxsplit, all spaces are split:
print(line.split())  # ['GET', '/index.html', 'HTTP/1.1']`,
    explanation: "`split(sep, maxsplit)` stops after `maxsplit` splits, useful for parsing protocols where only the first delimiter matters and the rest should stay intact.",
  },
  {
    id: "py-b18-b1-dict-setdefault",
    language: "python",
    title: "dict.setdefault avoids a redundant key check",
    tag: "snippet",
    code: `words = ["apple", "banana", "avocado", "blueberry"]
groups = {}

for word in words:
    groups.setdefault(word[0], []).append(word)

print(groups)
# {'a': ['apple', 'avocado'], 'b': ['banana', 'blueberry']}`,
    explanation: "`setdefault(key, default)` inserts `default` under `key` if absent, then returns the stored value — one operation instead of a check-then-insert pattern.",
  },
  {
    id: "py-b18-b1-set-symmetric-difference",
    language: "python",
    title: "Set symmetric_difference finds items in exactly one set",
    tag: "snippet",
    code: `a = {1, 2, 3, 4}
b = {3, 4, 5, 6}

sym = a.symmetric_difference(b)  # or a ^ b
print(sym)   # {1, 2, 5, 6}

# Useful for detecting which items changed between two snapshots:
before = {"a", "b", "c"}
after  = {"b", "c", "d"}
changed = before ^ after   # {'a', 'd'}`,
    explanation: "`symmetric_difference` (or `^`) returns elements that are in either set but not both — equivalent to `(a | b) - (a & b)`.",
  },
  {
    id: "py-b18-b1-str-zfill",
    language: "python",
    title: "str.zfill pads with leading zeros",
    tag: "snippet",
    code: `for i in [1, 42, 255, 1024]:
    print(str(i).zfill(5))
# 00001
# 00042
# 00255
# 01024

# Preserves sign:
print("-7".zfill(5))   # -0007`,
    explanation: "`zfill(width)` pads a string with leading zeros to reach `width`, preserving a leading `+` or `-` sign — useful for zero-padded identifiers and fixed-width output.",
  },
  {
    id: "py-b18-b1-enumerate-reversed",
    language: "python",
    title: "enumerate on reversed() for descending index",
    tag: "snippet",
    code: `items = ["a", "b", "c", "d"]

for i, val in enumerate(reversed(items)):
    print(i, val)
# 0 d
# 1 c
# 2 b
# 3 a

# Count down from the last index:
n = len(items)
for i, val in enumerate(reversed(items), start=1):
    print(n - i, val)   # original index`,
    explanation: "`reversed()` returns a reverse iterator; wrapping it with `enumerate` gives a descending index counter without creating a reversed copy.",
  },
  {
    id: "py-b18-b1-itertools-compress",
    language: "python",
    title: "itertools.compress for boolean mask filtering",
    tag: "snippet",
    code: `import itertools

data    = ["apple", "banana", "cherry", "date", "elderberry"]
include = [True, False, True, False, True]

result = list(itertools.compress(data, include))
print(result)  # ['apple', 'cherry', 'elderberry']`,
    explanation: "`itertools.compress(data, selectors)` yields elements from `data` where the corresponding selector is truthy — the functional equivalent of a boolean-mask array index.",
  },
  {
    id: "py-b18-b1-functools-cache",
    language: "python",
    title: "functools.cache — unbounded memoization",
    tag: "snippet",
    code: `from functools import cache

@cache
def fib(n):
    if n < 2:
        return n
    return fib(n - 1) + fib(n - 2)

print(fib(50))           # 12586269025
print(fib.cache_info())  # CacheInfo(hits=48, misses=51, ...)`,
    explanation: "`functools.cache` (Python 3.9+) is `lru_cache(maxsize=None)` — an unbounded, thread-safe memoization decorator that uses a dictionary under the hood.",
  },
  {
    id: "py-b18-b1-pathlib-glob",
    language: "python",
    title: "pathlib.Path.glob and rglob for file discovery",
    tag: "snippet",
    code: `from pathlib import Path

base = Path(".")

# Direct children matching *.py
py_files = list(base.glob("*.py"))

# Recursive search
all_py = list(base.rglob("*.py"))

# Pattern with directory
tests = list(base.glob("tests/**/*.py"))`,
    explanation: "`Path.glob(pattern)` matches files in the directory; `rglob(pattern)` is shorthand for `glob('**/' + pattern)`, searching the entire subtree recursively.",
  },
  {
    id: "py-b18-b1-deque-rotate",
    language: "python",
    title: "deque.rotate for circular buffer simulation",
    tag: "snippet",
    code: `from collections import deque

buf = deque([1, 2, 3, 4, 5])

buf.rotate(2)   # shift right by 2
print(list(buf))  # [4, 5, 1, 2, 3]

buf.rotate(-1)  # shift left by 1
print(list(buf))  # [5, 1, 2, 3, 4]`,
    explanation: "`deque.rotate(n)` moves `n` elements from the right to the left (positive) or vice versa (negative) in O(n) time, simulating a circular buffer rotation.",
  },
  {
    id: "py-b18-b1-bytearray-fromhex",
    language: "python",
    title: "bytearray.fromhex and hex() for binary encoding",
    tag: "snippet",
    code: `data = bytearray.fromhex("deadbeef")
print(data)         # bytearray(b'\\xde\\xad\\xbe\\xef')
print(data.hex())   # deadbeef
print(data.hex(":"))  # de:ad:be:ef  (separator, Python 3.8+)

b = bytes.fromhex("48656c6c6f")
print(b.decode())   # Hello`,
    explanation: "`fromhex` parses a hex string into bytes; `.hex()` encodes bytes as lowercase hex, optionally with a separator — useful for cryptographic and network protocol work.",
  },
  {
    id: "py-b18-b1-sorted-stable",
    language: "python",
    title: "sorted() is stable — equal elements keep original order",
    tag: "snippet",
    code: `from dataclasses import dataclass

@dataclass
class Task:
    priority: int
    name: str

tasks = [Task(2, "write"), Task(1, "read"), Task(2, "review"), Task(1, "test")]

by_priority = sorted(tasks, key=lambda t: t.priority)
for t in by_priority:
    print(t.priority, t.name)
# 1 read   <- same order as input
# 1 test
# 2 write
# 2 review`,
    explanation: "Python's `sorted()` uses Timsort which is stable — elements with equal keys appear in the same relative order as they did in the input.",
  },
  {
    id: "py-b18-b1-dict-comprehension-invert",
    language: "python",
    title: "Dict comprehension to invert a mapping",
    tag: "snippet",
    code: `original = {"a": 1, "b": 2, "c": 3}

inverted = {v: k for k, v in original.items()}
print(inverted)  # {1: 'a', 2: 'b', 3: 'c'}

# Warning: if values are duplicated, last key wins:
dupes = {"x": 1, "y": 1}
print({v: k for k, v in dupes.items()})  # {1: 'y'}`,
    explanation: "Swapping key and value with a dict comprehension produces an inverted map; duplicate original values will silently keep only the last key.",
  },
  {
    id: "py-b18-b1-str-center",
    language: "python",
    title: "str.center for padded text alignment",
    tag: "snippet",
    code: `title = "Summary"
print(title.center(30))         # spaces
print(title.center(30, "="))    # =========Summary=========

for label, value in [("total", 42), ("count", 7)]:
    print(f"{label.ljust(10)}{str(value).rjust(6)}")
# total          42
# count           7`,
    explanation: "`str.center(width, fillchar)` centers text within a field, useful alongside `ljust` and `rjust` for building fixed-width textual reports.",
  },
  {
    id: "py-b18-b1-zip-dict-construction",
    language: "python",
    title: "zip to construct a dict from two parallel lists",
    tag: "snippet",
    code: `keys   = ["name", "age", "city"]
values = ["Alice", 30, "Paris"]

record = dict(zip(keys, values))
print(record)  # {'name': 'Alice', 'age': 30, 'city': 'Paris'}

# Equivalent comprehension:
record2 = {k: v for k, v in zip(keys, values)}`,
    explanation: "`dict(zip(keys, values))` is the idiomatic way to build a dict from two parallel sequences; it stops at the shorter iterable just like regular `zip`.",
  },
  {
    id: "py-b18-b1-chained-assignment",
    language: "python",
    title: "Chained assignment — both names point to the same object",
    tag: "understanding",
    code: `a = b = []    # a and b reference the SAME list
a.append(1)
print(b)      # [1]  — b is affected

# Contrast with separate assignments:
x = []
y = []
x.append(1)
print(y)      # []  — independent objects`,
    explanation: "In `a = b = []`, Python evaluates the right side once and binds both names to that single object — mutating through one name is visible via the other.",
  },
  {
    id: "py-b18-b1-bool-is-int",
    language: "python",
    title: "bool is a subclass of int",
    tag: "understanding",
    code: `print(isinstance(True, int))   # True
print(True  + True)            # 2
print(True  * 5)               # 5
print(True  == 1)              # True
print(False == 0)              # True
print(True  is 1)              # False (different objects)
print(sum([True, False, True, True]))  # 3  — counts Trues`,
    explanation: "`bool` subclasses `int` with `True == 1` and `False == 0`; arithmetic on booleans works but `True is 1` is still `False` because they're different objects.",
  },
  {
    id: "py-b18-b1-legb-rule",
    language: "python",
    title: "LEGB scope lookup order",
    tag: "understanding",
    code: `x = "global"

def outer():
    x = "enclosing"
    def inner():
        x = "local"
        print(x)   # local  (L)
    inner()
    print(x)       # enclosing  (E)

outer()
print(x)           # global  (G)

# Built-in (B): print, len, etc. — searched last`,
    explanation: "Python resolves names in LEGB order: Local → Enclosing → Global → Built-in. Assignment always creates a local binding unless `global` or `nonlocal` is declared.",
  },
  {
    id: "py-b18-b1-late-binding-closure",
    language: "python",
    title: "Late binding causes loop closure gotcha",
    tag: "understanding",
    code: `# BROKEN — all functions capture the same variable i
funcs = [lambda: i for i in range(5)]
print([f() for f in funcs])   # [4, 4, 4, 4, 4]

# FIX — bind i at definition time with a default arg
funcs2 = [lambda i=i: i for i in range(5)]
print([f() for f in funcs2])  # [0, 1, 2, 3, 4]`,
    explanation: "Closures capture the variable, not its value at creation time; by the time any lambda runs, `i` has the final loop value. A default argument copies the value eagerly.",
  },
  {
    id: "py-b18-b1-slots-memory",
    language: "python",
    title: "__slots__ eliminates the per-instance __dict__",
    tag: "understanding",
    code: `import sys

class Regular:
    def __init__(self, x, y):
        self.x = x
        self.y = y

class Slotted:
    __slots__ = ("x", "y")
    def __init__(self, x, y):
        self.x = x
        self.y = y

r = Regular(1, 2)
s = Slotted(1, 2)
print(sys.getsizeof(r.__dict__))  # ~232 bytes for the dict
print(hasattr(s, "__dict__"))     # False`,
    explanation: "`__slots__` replaces the per-instance `__dict__` with fixed-offset descriptors, reducing memory per instance by ~100–200 bytes and speeding up attribute access.",
  },
  {
    id: "py-b18-b1-generator-exhaustion",
    language: "python",
    title: "Generators are single-use iterators",
    tag: "understanding",
    code: `def gen():
    yield 1
    yield 2
    yield 3

g = gen()
print(list(g))  # [1, 2, 3]
print(list(g))  # []  — already exhausted

# list() creates a new iterator each time, safe:
lst = [1, 2, 3]
print(list(lst))  # [1, 2, 3]
print(list(lst))  # [1, 2, 3]`,
    explanation: "A generator object can only be iterated once; after `StopIteration`, it remains exhausted. Re-call the generator function to get a fresh one.",
  },
  {
    id: "py-b18-b1-getattr-vs-getattribute",
    language: "python",
    title: "__getattr__ vs __getattribute__ lookup hooks",
    tag: "understanding",
    code: `class Demo:
    def __init__(self): self.x = 10

    def __getattr__(self, name):
        # Only called when normal lookup FAILS
        return f"missing: {name}"

    def __getattribute__(self, name):
        # Called for EVERY attribute access
        print(f"accessing {name}")
        return super().__getattribute__(name)

d = Demo()
print(d.x)      # prints "accessing x", then 10
print(d.z)      # prints "accessing z", then "missing: z"`,
    explanation: "`__getattribute__` intercepts every attribute access; `__getattr__` is only called as a fallback when the attribute isn't found by normal means.",
  },
  {
    id: "py-b18-b1-del-gc-timing",
    language: "python",
    title: "del removes the name, not necessarily the object",
    tag: "understanding",
    code: `class Resource:
    def __del__(self): print("freed!")

a = Resource()
b = a           # two references to the same object
del a           # only removes name 'a'; b still holds a ref
print("after del a")
del b           # last reference gone — freed! prints here
print("after del b")
# Output: after del a  freed!  after del b`,
    explanation: "`del name` decrements the reference count; the object is freed only when the count reaches zero. With a second reference, `del a` merely unbinds the name.",
  },
  {
    id: "py-b18-b1-python-no-overflow",
    language: "python",
    title: "Python integers have arbitrary precision",
    tag: "understanding",
    code: `big = 2 ** 100
print(big)          # 1267650600228229401496703205376
print(type(big))    # <class 'int'>

# No overflow:
x = 9_999_999_999_999_999_999_999
print(x + 1)  # 10000000000000000000000

# But float has limits:
import sys
print(sys.float_info.max)   # ~1.8e308`,
    explanation: "Python's `int` is a bignum — it grows as needed and never overflows. Only `float` (a 64-bit IEEE 754 double) has a finite range.",
  },
  {
    id: "py-b18-b1-class-body-scope",
    language: "python",
    title: "Class body scope does not create an enclosing scope",
    tag: "understanding",
    code: `x = "global"

class MyClass:
    x = "class"
    # list comp runs in its OWN scope, not the class scope
    items1 = [x for _ in range(3)]   # uses global x!
    # generator expression also uses its own scope
    items2 = list(x for _ in range(3))

print(MyClass.items1)   # ['global', 'global', 'global']
print(MyClass.items2)   # ['global', 'global', 'global']`,
    explanation: "Class body variables are not visible inside nested comprehensions and generator expressions; those create their own scope and walk up to the global scope, skipping the class.",
  },
  {
    id: "py-b18-b1-starred-unpack",
    language: "python",
    title: "Starred unpacking in assignments",
    tag: "understanding",
    code: `first, *middle, last = [1, 2, 3, 4, 5]
print(first)   # 1
print(middle)  # [2, 3, 4]
print(last)    # 5

# Works with any iterable:
a, *rest = "hello"
print(a)    # h
print(rest) # ['e', 'l', 'l', 'o']

# Swap without temp:
x, y = 10, 20
x, y = y, x
print(x, y)  # 20 10`,
    explanation: "The starred `*name` in an unpacking assignment captures a variable-length middle (or prefix or suffix) as a list — the surrounding names must match exactly.",
  },
  {
    id: "py-b18-b1-sys-intern",
    language: "python",
    title: "sys.intern shares identical string objects",
    tag: "understanding",
    code: `import sys

a = sys.intern("hello world")
b = sys.intern("hello world")
print(a is b)   # True  — same object

# Short identifer-like strings are automatically interned:
x = "hello"
y = "hello"
print(x is y)   # True (CPython implementation detail)

# Longer or computed strings may not be:
s1 = "hello " + "world"
s2 = "hello " + "world"
print(s1 is s2)  # False (may vary by interpreter)`,
    explanation: "`sys.intern` forces string identity sharing so `is` comparison is O(1) — useful for dictionary keys or enum-like constants that are compared very frequently.",
  },
  {
    id: "py-b18-b1-exception-chaining",
    language: "python",
    title: "Implicit and explicit exception chaining",
    tag: "understanding",
    code: `# Implicit chaining — context preserved automatically
def load():
    try:
        int("bad")
    except ValueError:
        raise RuntimeError("load failed")  # __context__ set

# Explicit chaining
def load2():
    try:
        int("bad")
    except ValueError as e:
        raise RuntimeError("load failed") from e  # __cause__ set

# Suppress the chain:
def load3():
    try:
        int("bad")
    except ValueError:
        raise RuntimeError("load failed") from None`,
    explanation: "Python automatically stores the in-flight exception in `__context__`; `raise X from Y` sets `__cause__` (a deliberate link); `from None` suppresses both.",
  },
  {
    id: "py-b18-b1-custom-bool",
    language: "python",
    title: "__bool__ and __len__ for truthiness",
    tag: "understanding",
    code: `class Bag:
    def __init__(self, items):
        self.items = items
    def __len__(self):
        return len(self.items)
    # __bool__ not defined — falls back to __len__

b1 = Bag([])
b2 = Bag([1, 2])
print(bool(b1))   # False  (len == 0)
print(bool(b2))   # True   (len > 0)

if b2:
    print("bag has items")`,
    explanation: "If `__bool__` is absent Python falls back to `__len__`; if both are absent the object is always truthy. Define `__bool__` for explicit control.",
  },
  {
    id: "py-b18-b1-dict-views-live",
    language: "python",
    title: "dict views are live — they reflect mutations",
    tag: "structures",
    code: `d = {"a": 1, "b": 2}
keys   = d.keys()
values = d.values()

d["c"] = 3
print(list(keys))    # ['a', 'b', 'c']  — includes new key
print(list(values))  # [1, 2, 3]

# Set-like operations on keys view:
other = {"b": 99, "d": 4}
print(keys & other.keys())   # {'b'}`,
    explanation: "Dict views (`keys()`, `values()`, `items()`) are live proxies — they update automatically when the dict changes. `keys()` supports set operations.",
  },
  {
    id: "py-b18-b1-heapq-max-heap",
    language: "python",
    title: "Simulating a max-heap by negating values",
    tag: "structures",
    code: `import heapq

nums = [3, 1, 4, 1, 5, 9, 2, 6]

# Min-heap gives smallest first
min_heap = nums[:]
heapq.heapify(min_heap)
print(heapq.heappop(min_heap))   # 1

# Max-heap: negate to flip the ordering
max_heap = [-x for x in nums]
heapq.heapify(max_heap)
largest = -heapq.heappop(max_heap)
print(largest)   # 9`,
    explanation: "Python's `heapq` is a min-heap only; negate values before pushing to simulate a max-heap, then negate again on pop.",
  },
  {
    id: "py-b18-b1-stringio-memory-file",
    language: "python",
    title: "io.StringIO as an in-memory text file",
    tag: "structures",
    code: `import io

buf = io.StringIO()
buf.write("line one\\n")
buf.write("line two\\n")

buf.seek(0)
for line in buf:
    print(repr(line))
# 'line one\\n'
# 'line two\\n'

# Capture print() output:
out = io.StringIO()
import sys; old = sys.stdout; sys.stdout = out
print("captured!")
sys.stdout = old
print(out.getvalue())  # captured!`,
    explanation: "`io.StringIO` implements the full text-file interface in memory — useful for building strings incrementally or redirecting `sys.stdout` in tests.",
  },
  {
    id: "py-b18-b1-bisect-insort",
    language: "python",
    title: "bisect.insort keeps a list sorted on insert",
    tag: "structures",
    code: `import bisect

lst = [1, 3, 5, 7, 9]

bisect.insort(lst, 4)
print(lst)   # [1, 3, 4, 5, 7, 9]

bisect.insort(lst, 6)
print(lst)   # [1, 3, 4, 5, 6, 7, 9]

# Find insertion point without modifying:
pos = bisect.bisect_left(lst, 5)
print(pos)   # 3`,
    explanation: "`bisect.insort` uses binary search to find the correct position and inserts in O(n) time (shifting elements); `bisect_left/right` return the position without inserting.",
  },
  {
    id: "py-b18-b1-weakref-ref",
    language: "python",
    title: "weakref.ref for non-owning references",
    tag: "structures",
    code: `import weakref

class Node:
    def __init__(self, val): self.val = val
    def __repr__(self): return f"Node({self.val})"

node = Node(42)
ref  = weakref.ref(node)

print(ref())   # Node(42)  — dereference while alive
del node
print(ref())   # None  — object was collected`,
    explanation: "A weak reference does not prevent garbage collection; `ref()` returns the object if it's still alive or `None` if it's been collected — useful for caches and back-references.",
  },
  {
    id: "py-b18-b1-array-typed-buffer",
    language: "python",
    title: "array.array for compact typed numeric storage",
    tag: "structures",
    code: `import array, sys

lst = list(range(1000))
arr = array.array("i", range(1000))  # 'i' = signed int

print(sys.getsizeof(lst))  # ~8056 bytes (Python objects)
print(arr.buffer_info())   # (address, 1000)
print(arr.itemsize)        # 4  — bytes per element

arr.append(1000)
print(arr[-1])   # 1000`,
    explanation: "`array.array` stores numbers in a C-compatible contiguous buffer using the type code (e.g., `'i'` for signed int), using far less memory than a list of Python ints.",
  },
  {
    id: "py-b18-b1-chainmap-lookup",
    language: "python",
    title: "ChainMap for layered configuration lookup",
    tag: "structures",
    code: `from collections import ChainMap

defaults = {"color": "red",  "size": 10, "debug": False}
user     = {"color": "blue", "debug": True}
cli_args = {"size": 20}

config = ChainMap(cli_args, user, defaults)
print(config["color"])   # blue  (from user)
print(config["size"])    # 20    (from cli_args)
print(config["debug"])   # True  (from user)

# Mutations go to the first map only:
config["size"] = 30
print(cli_args)  # {'size': 30}`,
    explanation: "`ChainMap` chains multiple dicts into a single lookup table without copying data; writes go to the first map, making it ideal for layered config (defaults → user → env).",
  },
  {
    id: "py-b18-b1-bytesio-binary",
    language: "python",
    title: "io.BytesIO as an in-memory binary file",
    tag: "structures",
    code: `import io, struct

buf = io.BytesIO()
# Write a header: type (1 byte) + value (4 bytes big-endian)
buf.write(struct.pack(">Bi", 0x01, 12345))
buf.write(b"payload data")

buf.seek(0)
msg_type, value = struct.unpack_from(">Bi", buf.read(5))
print(msg_type, value)  # 1 12345
print(buf.read())       # b'payload data'`,
    explanation: "`io.BytesIO` gives a binary file interface over an in-memory `bytes` buffer — useful for building and parsing binary messages without touching the filesystem.",
  },
  {
    id: "py-b18-b1-counter-subtract",
    language: "python",
    title: "Counter.subtract for element-wise decrement",
    tag: "structures",
    code: `from collections import Counter

inventory = Counter(apples=5, bananas=3, cherries=8)
order     = Counter(apples=2, bananas=3, cherries=10)

inventory.subtract(order)
print(inventory)
# Counter({'cherries': -2, 'apples': 3, 'bananas': 0})

# Use elements() to only see non-negative counts:
positive = +inventory
print(positive)  # Counter({'apples': 3})`,
    explanation: "`Counter.subtract` decrements counts (unlike `-` which removes non-positive entries); use the unary `+` operator to filter out zero and negative counts.",
  },
  {
    id: "py-b18-b1-csv-dictreader",
    language: "python",
    title: "csv.DictReader for header-keyed row access",
    tag: "structures",
    code: `import csv, io

data = """name,age,city
Alice,30,Paris
Bob,25,London"""

reader = csv.DictReader(io.StringIO(data))
for row in reader:
    print(row["name"], row["age"])
# Alice 30
# Bob 25

# Change the field names:
reader2 = csv.DictReader(io.StringIO(data), fieldnames=["n","a","c"])`,
    explanation: "`csv.DictReader` uses the first row (or `fieldnames`) as column keys, returning each row as an `OrderedDict`/`dict` — no manual column indexing needed.",
  },
  {
    id: "py-b18-b1-open-encoding",
    language: "python",
    title: "Always specify encoding when opening text files",
    tag: "caveats",
    code: `# RISKY: uses platform default (UTF-8 on Linux, cp1252 on Windows)
with open("file.txt") as f:
    data = f.read()

# SAFE: explicit is always better
with open("file.txt", encoding="utf-8") as f:
    data = f.read()

# For binary data, use binary mode — no encoding issues:
with open("image.png", "rb") as f:
    data = f.read()`,
    explanation: "The default encoding of `open()` is `locale.getpreferredencoding()`, which differs across platforms; always pass `encoding=` explicitly for portable text I/O.",
  },
  {
    id: "py-b18-b1-float-inf",
    language: "python",
    title: "float('inf') in comparisons and arithmetic",
    tag: "caveats",
    code: `inf = float("inf")
print(inf > 1_000_000_000)   # True
print(inf + inf)              # inf
print(inf - inf)              # nan
print(inf * 0)                # nan
print(1 / inf)                # 0.0
print(math.isinf(inf))        # True

import math
print(math.isfinite(inf))     # False`,
    explanation: "`float('inf')` satisfies any numeric comparison but some arithmetic on it produces `nan`; use `math.isinf()` and `math.isfinite()` for explicit checks.",
  },
  {
    id: "py-b18-b1-perf-counter",
    language: "python",
    title: "time.perf_counter for high-resolution timing",
    tag: "caveats",
    code: `import time

# BAD for timing: time.time() has low resolution on some platforms
t0 = time.time()
sum(range(10**6))
print(time.time() - t0)   # may show 0.0 on Windows

# GOOD: perf_counter gives sub-microsecond resolution
t0 = time.perf_counter()
sum(range(10**6))
elapsed = time.perf_counter() - t0
print(f"{elapsed:.6f}s")`,
    explanation: "`time.perf_counter()` is the highest-resolution clock on each platform; `time.time()` returns wall-clock time but may have coarser resolution on some systems.",
  },
  {
    id: "py-b18-b1-hash-randomization",
    language: "python",
    title: "Hash randomization is on by default since Python 3.3",
    tag: "caveats",
    code: `# Python 3.3+: str/bytes/datetime hash values change each process run
# Set PYTHONHASHSEED=0 to disable for reproducibility

h1 = hash("hello")
h2 = hash("hello")
print(h1 == h2)   # True within the SAME process

# But running this script twice gives different values each time.
# For persistent hashing, use hashlib:
import hashlib
print(hashlib.sha256(b"hello").hexdigest()[:8])  # always same`,
    explanation: "Hash randomization (enabled by default) defends against hash-collision DoS attacks but means you can't store `hash(obj)` across process restarts; use `hashlib` for stable hashes.",
  },
  {
    id: "py-b18-b1-functools-wraps",
    language: "python",
    title: "Forgetting @functools.wraps hides the function name",
    tag: "caveats",
    code: `from functools import wraps

# WITHOUT wraps — metadata is lost:
def decorator_bad(fn):
    def wrapper(*args, **kwargs):
        return fn(*args, **kwargs)
    return wrapper

# WITH wraps — metadata preserved:
def decorator_good(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        return fn(*args, **kwargs)
    return wrapper

@decorator_bad
def my_func(): pass
print(my_func.__name__)  # 'wrapper' — confusing!

@decorator_good
def my_func2(): pass
print(my_func2.__name__)  # 'my_func2'`,
    explanation: "`@functools.wraps(fn)` copies `__name__`, `__doc__`, and other attributes from the wrapped function onto the wrapper — required for documentation and debugging tools.",
  },
  {
    id: "py-b18-b1-deepcopy-nested",
    language: "python",
    title: "copy.copy is shallow — nested mutable objects are shared",
    tag: "caveats",
    code: `import copy

original = [[1, 2], [3, 4]]

shallow  = copy.copy(original)
deep     = copy.deepcopy(original)

original[0].append(99)
print(shallow[0])  # [1, 2, 99]  — inner list is SHARED
print(deep[0])     # [1, 2]      — deep copy is independent`,
    explanation: "`copy.copy` duplicates the container but not the nested objects; `copy.deepcopy` recursively copies everything. Use `deepcopy` when inner mutable objects must be independent.",
  },
  {
    id: "py-b18-b1-print-flush",
    language: "python",
    title: "print() may buffer output — use flush=True for real-time logging",
    tag: "caveats",
    code: `import sys, time

# Without flush, output may not appear until buffer is full
for i in range(5):
    print(f"step {i}")   # may appear in a batch

# With flush=True, each line is sent immediately:
for i in range(5):
    print(f"step {i}", flush=True)

# Or set it globally:
# python -u script.py  (unbuffered)
# PYTHONUNBUFFERED=1 python script.py`,
    explanation: "`print()` buffers output by default when stdout is not a terminal; pass `flush=True` or run with `-u` for real-time progress in pipelines and containers.",
  },
  {
    id: "py-b18-b1-recursion-limit",
    language: "python",
    title: "Default recursion limit is 1000 — convert to iterative for deep trees",
    tag: "caveats",
    code: `import sys
print(sys.getrecursionlimit())  # 1000

def depth(n):
    if n == 0: return 0
    return 1 + depth(n - 1)

try:
    depth(2000)
except RecursionError:
    print("stack overflow!")

# Safe iterative alternative:
def depth_iter(n):
    count = 0
    while n > 0:
        count += 1
        n -= 1
    return count`,
    explanation: "Python's default recursion limit is 1000 frames; deeply recursive algorithms on unbounded input should be rewritten iteratively or use `sys.setrecursionlimit` carefully.",
  },
  {
    id: "py-b18-b1-daemon-thread",
    language: "python",
    title: "Daemon threads are killed abruptly when the main thread exits",
    tag: "caveats",
    code: `import threading, time

def background():
    while True:
        print("tick")
        time.sleep(0.5)

t = threading.Thread(target=background, daemon=True)
t.start()
time.sleep(1.2)
# When main exits here, daemon thread is killed immediately
# (may not print all "tick"s, no cleanup runs)`,
    explanation: "Daemon threads are automatically killed when the main program exits without joining them — don't use them for work that needs graceful shutdown or cleanup.",
  },
  {
    id: "py-b18-b1-paramspec",
    language: "python",
    title: "ParamSpec preserves callable signatures through decorators",
    tag: "types",
    code: `from typing import Callable, TypeVar, ParamSpec
from functools import wraps

P = ParamSpec("P")
R = TypeVar("R")

def timed(fn: Callable[P, R]) -> Callable[P, R]:
    @wraps(fn)
    def wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
        import time; t = time.perf_counter()
        result = fn(*args, **kwargs)
        print(f"{fn.__name__}: {time.perf_counter()-t:.4f}s")
        return result
    return wrapper

@timed
def add(x: int, y: int) -> int:
    return x + y

add(1, 2)  # type-checker knows add(x: int, y: int) -> int`,
    explanation: "`ParamSpec` captures the full parameter specification of a callable so that a decorator can claim the wrapper has the same signature as the wrapped function.",
  },
  {
    id: "py-b18-b1-typeguard",
    language: "python",
    title: "TypeGuard narrows types in type-checked branches",
    tag: "types",
    code: `from typing import TypeGuard

def is_list_of_str(val: list) -> TypeGuard[list[str]]:
    return all(isinstance(x, str) for x in val)

data: list[object] = ["a", "b", "c"]

if is_list_of_str(data):
    # type checker now knows data: list[str]
    joined = ", ".join(data)   # no type error
    print(joined)`,
    explanation: "`TypeGuard[T]` as a return annotation tells the type checker that the function narrows the argument to type `T` in the `True` branch.",
  },
  {
    id: "py-b18-b1-final-constant",
    language: "python",
    title: "typing.Final marks variables that must not be reassigned",
    tag: "types",
    code: `from typing import Final

MAX_SIZE: Final = 100
API_URL:  Final[str] = "https://api.example.com"

# Type checkers reject:
# MAX_SIZE = 200  # error: cannot reassign a Final variable

class Config:
    TIMEOUT: Final[int] = 30
    # Subclasses cannot override Final class attributes`,
    explanation: "`Final` is a type-checker-only constraint; at runtime the value can technically be changed, but mypy/pyright will flag any reassignment as an error.",
  },
  {
    id: "py-b18-b1-literal-type",
    language: "python",
    title: "Literal type restricts to specific values",
    tag: "types",
    code: `from typing import Literal

Mode = Literal["r", "w", "a", "rb", "wb"]

def open_file(path: str, mode: Mode) -> None:
    with open(path, mode) as f:
        pass

open_file("data.txt", "r")    # OK
# open_file("data.txt", "x")  # type error: not a valid mode

# Useful for status codes, directions, etc.:
Direction = Literal["north", "south", "east", "west"]`,
    explanation: "`Literal` restricts a parameter to a specific set of values, giving better autocomplete and static checking than bare `str` or `int`.",
  },
  {
    id: "py-b18-b1-typevar-bound",
    language: "python",
    title: "TypeVar with bound constrains to a type hierarchy",
    tag: "types",
    code: `from typing import TypeVar
from numbers import Number

N = TypeVar("N", bound=Number)

def add_twice(x: N) -> N:
    return x + x   # type: ignore

print(add_twice(5))    # 10  (int)
print(add_twice(2.5))  # 5.0 (float)

# TypeVar bound means: T must be Number or a subtype of Number`,
    explanation: "`TypeVar('N', bound=X)` means the type variable can only be `X` or its subtypes; unlike plain `TypeVar`, it still preserves the specific subtype in the return.",
  },
  {
    id: "py-b18-b1-callable-type",
    language: "python",
    title: "typing.Callable for function type annotations",
    tag: "types",
    code: `from typing import Callable

# Callable[[arg_types...], return_type]
Handler = Callable[[str, int], bool]

def apply(fn: Handler, msg: str, code: int) -> bool:
    return fn(msg, code)

def my_handler(s: str, n: int) -> bool:
    return len(s) > n

print(apply(my_handler, "hello", 3))   # True

# No args, any return:
NoArgFn = Callable[[], None]`,
    explanation: "`Callable[[P1, P2], R]` annotates callables with explicit parameter and return types; use `ParamSpec` when the parameter types should be preserved through a decorator.",
  },
  {
    id: "py-b18-b1-overload",
    language: "python",
    title: "@typing.overload for multiple dispatch signatures",
    tag: "types",
    code: `from typing import overload, Union

@overload
def process(x: int) -> str: ...
@overload
def process(x: str) -> int: ...

def process(x: Union[int, str]) -> Union[str, int]:
    if isinstance(x, int):
        return str(x)
    return len(x)

print(process(42))      # "42"
print(process("hello")) # 5`,
    explanation: "`@overload` defines type-only signatures that tell the type checker which input→output type pairs are valid; the actual implementation uses a broad `Union` type.",
  },
  {
    id: "py-b18-b1-union-pipe-syntax",
    language: "python",
    title: "X | Y union syntax (Python 3.10+)",
    tag: "types",
    code: `# Old style (still valid everywhere):
from typing import Union, Optional
def old(x: Union[int, str]) -> Optional[str]: ...

# New style (Python 3.10+):
def new(x: int | str) -> str | None:
    if isinstance(x, int):
        return str(x)
    return x

print(new(42))      # "42"
print(new("hi"))    # "hi"
print(new(None))    # type error at check time`,
    explanation: "PEP 604 (Python 3.10) allows `X | Y` directly in annotations as a shorthand for `Union[X, Y]`; `X | None` replaces `Optional[X]`.",
  },
  {
    id: "py-b18-b1-optional-is-none-union",
    language: "python",
    title: "Optional[X] is exactly X | None",
    tag: "types",
    code: `from typing import Optional, Union, get_args

def greet(name: Optional[str]) -> str:
    if name is None:
        return "Hello, stranger"
    return f"Hello, {name}"

# Under the hood:
print(Optional[str])          # typing.Optional[str]
print(get_args(Optional[str]))  # (str, NoneType)

# These are equivalent:
# Optional[str]  ==  Union[str, None]  ==  str | None`,
    explanation: "`Optional[X]` is syntactic sugar for `Union[X, None]`; always narrow it with an `is None` or `is not None` check before accessing attributes.",
  },
  {
    id: "py-b18-b1-protocol-runtime-checkable",
    language: "python",
    title: "@runtime_checkable Protocol enables isinstance checks",
    tag: "types",
    code: `from typing import Protocol, runtime_checkable

@runtime_checkable
class Drawable(Protocol):
    def draw(self) -> None: ...

class Circle:
    def draw(self) -> None:
        print("drawing circle")

class Square:
    pass

c = Circle()
s = Square()

print(isinstance(c, Drawable))   # True
print(isinstance(s, Drawable))   # False`,
    explanation: "`@runtime_checkable` allows `isinstance(obj, Protocol)` at runtime, checking only for the presence of the required methods (structural subtyping).",
  },
  {
    id: "py-b18-b1-typeddict-total-false",
    language: "python",
    title: "TypedDict with total=False for optional keys",
    tag: "types",
    code: `from typing import TypedDict, Required, NotRequired

class UserBase(TypedDict):
    id: int
    name: str

class UserFull(TypedDict, total=False):
    id: Required[int]   # always required
    name: Required[str]
    email: str          # optional (total=False)
    age: int            # optional

u: UserFull = {"id": 1, "name": "Alice"}   # valid
u2: UserFull = {"id": 2, "name": "Bob", "email": "b@example.com"}`,
    explanation: "`total=False` makes all keys optional; combine with `Required[T]` to mark specific keys as mandatory — giving fine-grained control over which keys must be present.",
  },
  {
    id: "py-b18-b1-stringio-vs-bytesio",
    language: "python",
    title: "io.StringIO vs io.BytesIO — text vs binary",
    tag: "families",
    code: `import io

# StringIO: text mode (str)
sio = io.StringIO()
sio.write("hello\\n")
sio.seek(0)
print(sio.read())   # hello

# BytesIO: binary mode (bytes)
bio = io.BytesIO()
bio.write(b"\\x00\\x01\\x02")
bio.seek(0)
print(bio.read())   # b'\\x00\\x01\\x02'

# Cannot mix:
# bio.write("text")  # TypeError`,
    explanation: "`StringIO` operates on `str` (text mode); `BytesIO` operates on `bytes` (binary mode). Mixing types raises `TypeError`, mirroring the `open()` text/binary distinction.",
  },
  {
    id: "py-b18-b1-json-vs-pickle",
    language: "python",
    title: "json vs pickle — portability vs power",
    tag: "families",
    code: `import json, pickle

data = {"key": [1, 2, 3], "val": "hello"}

# JSON: text, cross-language, human-readable, limited types
j = json.dumps(data)
print(j)              # {"key": [1, 2, 3], "val": "hello"}

# pickle: binary, Python-only, supports arbitrary objects
p = pickle.dumps(data)
print(p[:20])         # binary gibberish

# NEVER unpickle untrusted data — it can execute arbitrary code
restored = pickle.loads(p)
print(restored == data)   # True`,
    explanation: "Use `json` for data shared across languages or stored long-term; use `pickle` for short-lived Python-internal caching — never unpickle data from untrusted sources.",
  },
  {
    id: "py-b18-b1-subprocess-run-vs-popen",
    language: "python",
    title: "subprocess.run vs subprocess.Popen",
    tag: "families",
    code: `import subprocess

# run(): high-level, waits for completion
result = subprocess.run(
    ["echo", "hello"],
    capture_output=True, text=True, check=True
)
print(result.stdout.strip())   # hello

# Popen(): low-level, streaming, non-blocking
proc = subprocess.Popen(["cat"], stdin=subprocess.PIPE,
                        stdout=subprocess.PIPE, text=True)
out, _ = proc.communicate("input data")
print(out)   # input data`,
    explanation: "`subprocess.run` blocks until the process finishes and returns a `CompletedProcess`; use `Popen` when you need streaming I/O or to interact with a long-running process.",
  },
  {
    id: "py-b18-b1-pathlib-vs-ospath",
    language: "python",
    title: "pathlib.Path vs os.path — modern vs classic",
    tag: "families",
    code: `from pathlib import Path
import os

p = Path("/home/user/docs/report.txt")

# pathlib (OOP, readable):
print(p.parent)      # /home/user/docs
print(p.stem)        # report
print(p.suffix)      # .txt
print(p.exists())    # bool

# os.path (procedural, strings):
s = "/home/user/docs/report.txt"
print(os.path.dirname(s))    # /home/user/docs
print(os.path.splitext(os.path.basename(s))[0])  # report`,
    explanation: "`pathlib.Path` offers an object-oriented interface with convenient properties; `os.path` is older, string-based, and more portable to pre-3.4 code — prefer `pathlib` for new code.",
  },
  {
    id: "py-b18-b1-logging-vs-print",
    language: "python",
    title: "logging vs print — structured diagnostics",
    tag: "families",
    code: `import logging

logging.basicConfig(level=logging.DEBUG,
                    format="%(levelname)s: %(message)s")

# Levels: DEBUG < INFO < WARNING < ERROR < CRITICAL
logging.debug("detailed trace")
logging.info("server started on port 8080")
logging.warning("disk space low: %d%%", 10)
logging.error("connection refused to %s", "db:5432")

# print() is unstructured — no level filtering, no routing`,
    explanation: "The `logging` module adds severity levels, timestamps, and configurable outputs; `print` is fine for scripts but `logging` scales to libraries and production services.",
  },
  {
    id: "py-b18-b1-lock-vs-rlock",
    language: "python",
    title: "threading.Lock vs RLock — non-reentrant vs reentrant",
    tag: "families",
    code: `import threading

lock  = threading.Lock()
rlock = threading.RLock()

# Lock deadlocks on re-acquire in the same thread:
# lock.acquire(); lock.acquire()  # hangs!

# RLock allows same thread to acquire multiple times:
rlock.acquire()
rlock.acquire()
print("both acquired")
rlock.release()
rlock.release()`,
    explanation: "`RLock` (reentrant lock) can be acquired multiple times by the same thread; regular `Lock` will deadlock if the owning thread tries to acquire it again.",
  },
  {
    id: "py-b18-b1-asyncio-queue-vs-queue",
    language: "python",
    title: "asyncio.Queue vs queue.Queue — async vs thread-safe",
    tag: "families",
    code: `import asyncio
import queue as sync_queue

# asyncio.Queue: for async tasks (not thread-safe)
async def demo():
    q = asyncio.Queue()
    await q.put("item")
    item = await q.get()
    print(item)

asyncio.run(demo())

# queue.Queue: for threads (blocks in a thread, not async)
sq = sync_queue.Queue()
sq.put("item")
print(sq.get())`,
    explanation: "`asyncio.Queue` uses `await put/get` and must be used from coroutines; `queue.Queue` uses blocking calls and is designed for OS threads. Never mix them.",
  },
  {
    id: "py-b18-b1-sleep-async-vs-sync",
    language: "python",
    title: "time.sleep blocks the thread; asyncio.sleep yields",
    tag: "families",
    code: `import asyncio, time

async def bad():
    # Blocks the ENTIRE event loop for 1 second:
    time.sleep(1)

async def good():
    # Yields control back to the event loop:
    await asyncio.sleep(1)

async def main():
    t = asyncio.create_task(good())
    await t   # other tasks can run during the 1s`,
    explanation: "`time.sleep` blocks the OS thread, starving all coroutines in the event loop; `await asyncio.sleep` suspends only the calling coroutine, letting others proceed.",
  },
  {
    id: "py-b18-b1-hashlib-md5-sha256",
    language: "python",
    title: "hashlib.md5 vs hashlib.sha256 — speed vs security",
    tag: "families",
    code: `import hashlib

data = b"hello world"

md5    = hashlib.md5(data).hexdigest()
sha256 = hashlib.sha256(data).hexdigest()

print(md5[:16])    # 5eb63bbbe01ee...  (128-bit, fast, NOT secure)
print(sha256[:16]) # b94d27b9934d3...  (256-bit, slower, secure)

# For passwords, use hashlib.pbkdf2_hmac or bcrypt (not raw hash):
dk = hashlib.pbkdf2_hmac("sha256", b"password", b"salt", 100_000)`,
    explanation: "MD5 is fast but cryptographically broken — use it only for checksums, not security. SHA-256 is secure for hashing; for passwords, use key-derivation functions like PBKDF2.",
  },
  {
    id: "py-b18-b1-contextmanager-vs-class",
    language: "python",
    title: "contextlib.contextmanager vs __enter__/__exit__ class",
    tag: "families",
    code: `from contextlib import contextmanager

@contextmanager
def managed(name):
    print(f"enter {name}")
    try:
        yield name.upper()
    finally:
        print(f"exit {name}")

with managed("resource") as r:
    print(r)   # RESOURCE

# Equivalent class-based version needs __enter__ and __exit__
# The decorator style is more concise for simple managers`,
    explanation: "`@contextmanager` lets you write a context manager as a generator function with `yield`; the class approach with `__enter__`/`__exit__` is better when state is complex or reuse is needed.",
  },
  {
    id: "py-b18-b1-tempfile-usage",
    language: "python",
    title: "tempfile.NamedTemporaryFile vs tempfile.TemporaryDirectory",
    tag: "families",
    code: `import tempfile, os

# Named temp file — auto-deleted on close
with tempfile.NamedTemporaryFile(suffix=".txt", delete=True) as f:
    f.write(b"temp content")
    print(f.name)   # e.g. /tmp/tmpXXXXXX.txt
# file deleted after the with block

# Temp directory — auto-deleted with all contents
with tempfile.TemporaryDirectory() as d:
    path = os.path.join(d, "data.bin")
    with open(path, "wb") as f:
        f.write(b"\\x00" * 100)`,
    explanation: "`NamedTemporaryFile` creates a single auto-deleted file; `TemporaryDirectory` creates a whole directory tree that is recursively deleted on exit — both are safe for tests.",
  },
  {
    id: "py-b18-b1-abstract-property",
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

class Circle(Shape):
    def __init__(self, r): self.r = r
    @property
    def area(self): return 3.14159 * self.r ** 2
    @property
    def perimeter(self): return 2 * 3.14159 * self.r

c = Circle(5)
print(c.area)       # 78.53975
# Shape()  # TypeError: can't instantiate abstract class`,
    explanation: "Stacking `@property` and `@abstractmethod` forces subclasses to provide property implementations — omitting either decorator prevents the abstract contract from being enforced.",
  },
  {
    id: "py-b18-b1-class-getitem",
    language: "python",
    title: "__class_getitem__ enables subscript notation",
    tag: "classes",
    code: `class TypedList:
    def __class_getitem__(cls, item_type):
        class _TypedList(cls):
            _type = item_type
            def append(self, val):
                if not isinstance(val, self._type):
                    raise TypeError(f"expected {self._type}")
                super().append(val)
        return _TypedList

IntList = TypedList[int]
lst = IntList()
lst.append(42)
# lst.append("hello")  # TypeError`,
    explanation: "`__class_getitem__` is called when you write `MyClass[T]`; it returns a new class (or a generic alias), enabling parameterized types without metaclasses.",
  },
  {
    id: "py-b18-b1-init-subclass",
    language: "python",
    title: "__init_subclass__ for automatic plugin registration",
    tag: "classes",
    code: `class Handler:
    _registry: dict = {}

    def __init_subclass__(cls, name=None, **kw):
        super().__init_subclass__(**kw)
        if name:
            Handler._registry[name] = cls

class JsonHandler(Handler, name="json"):
    def handle(self, data): return f"JSON: {data}"

class XmlHandler(Handler, name="xml"):
    def handle(self, data): return f"XML: {data}"

print(Handler._registry.keys())  # dict_keys(['json', 'xml'])
h = Handler._registry["json"]()
print(h.handle("{}"))`,
    explanation: "`__init_subclass__` is called on the base class whenever a new subclass is created; keyword arguments passed in the class header are forwarded to it — ideal for self-registering plugins.",
  },
  {
    id: "py-b18-b1-classmethod-alt-constructor",
    language: "python",
    title: "@classmethod as named alternative constructor",
    tag: "classes",
    code: `class Date:
    def __init__(self, year, month, day):
        self.year, self.month, self.day = year, month, day

    @classmethod
    def from_string(cls, s: str) -> "Date":
        y, m, d = map(int, s.split("-"))
        return cls(y, m, d)

    @classmethod
    def today(cls) -> "Date":
        import datetime as dt
        today = dt.date.today()
        return cls(today.year, today.month, today.day)

d = Date.from_string("2026-05-18")
print(d.year, d.month, d.day)   # 2026 5 18`,
    explanation: "`@classmethod` receives the class as the first argument (`cls`), allowing factory methods that work correctly with subclasses — the idiom for named constructors.",
  },
  {
    id: "py-b18-b1-reduce-for-pickle",
    language: "python",
    title: "__reduce__ for custom pickling",
    tag: "classes",
    code: `import pickle

class Connection:
    def __init__(self, host, port):
        self.host = host
        self.port = port
        self._socket = None   # not picklable

    def __reduce__(self):
        # Return (callable, args) to reconstruct
        return (self.__class__, (self.host, self.port))

c = Connection("localhost", 5432)
data = pickle.dumps(c)
restored = pickle.loads(data)
print(restored.host, restored.port)   # localhost 5432
print(restored._socket)               # None  — fresh start`,
    explanation: "`__reduce__` returns a `(callable, args)` pair; pickle calls `callable(*args)` to reconstruct the object — useful for excluding non-picklable state like file handles.",
  },
  {
    id: "py-b18-b1-new-vs-init",
    language: "python",
    title: "__new__ runs before __init__ — controls object creation",
    tag: "classes",
    code: `class Singleton:
    _instance = None

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self, val):
        self.val = val

a = Singleton(1)
b = Singleton(2)
print(a is b)     # True  — same object
print(a.val)      # 2     — __init__ ran again on same object`,
    explanation: "`__new__` creates the instance; `__init__` configures it. Overriding `__new__` is used for singletons, immutable types (`int`, `str` subclasses), and metaclasses.",
  },
  {
    id: "py-b18-b1-staticmethod-vs-module",
    language: "python",
    title: "staticmethod vs module-level function",
    tag: "classes",
    code: `class MathUtils:
    @staticmethod
    def clamp(value, lo, hi):
        return max(lo, min(hi, value))

# Call without an instance:
print(MathUtils.clamp(15, 0, 10))  # 10

# Module-level function is equivalent and often simpler:
def clamp(value, lo, hi):
    return max(lo, min(hi, value))

# Use @staticmethod when the function is logically coupled
# to the class (e.g., a helper only useful in its context)`,
    explanation: "`@staticmethod` is a regular function namespaced inside a class; use it when the function is conceptually tied to the class but doesn't need `self` or `cls`.",
  },
  {
    id: "py-b18-b1-mro-diamond",
    language: "python",
    title: "C3 linearization resolves the diamond inheritance problem",
    tag: "classes",
    code: `class A:
    def greet(self): return "A"

class B(A):
    def greet(self): return f"B->{super().greet()}"

class C(A):
    def greet(self): return f"C->{super().greet()}"

class D(B, C):
    pass

print(D().greet())   # B->C->A
print(D.__mro__)
# (D, B, C, A, object)`,
    explanation: "Python's MRO (C3 linearization) ensures `A.greet` is called once even with diamond inheritance; `super()` follows the MRO so every class in the chain is visited in order.",
  },
  {
    id: "py-b18-b1-repr-unambiguous",
    language: "python",
    title: "__repr__ should return a string that recreates the object",
    tag: "classes",
    code: `class Vector:
    def __init__(self, x, y):
        self.x, self.y = x, y

    def __repr__(self):
        return f"Vector({self.x!r}, {self.y!r})"

    def __str__(self):
        return f"<{self.x}, {self.y}>"

v = Vector(1, 2)
print(repr(v))  # Vector(1, 2)  — unambiguous, eval()-able
print(str(v))   # <1, 2>        — human-friendly

# In containers repr() is used, not str():
print([v])      # [Vector(1, 2)]`,
    explanation: "`__repr__` is for developers — it should ideally be eval()-able to recreate the object; `__str__` is for users. When only one is defined, `__repr__` is used as fallback.",
  },
  {
    id: "py-b18-b1-custom-format",
    language: "python",
    title: "__format__ powers the format() built-in and f-strings",
    tag: "classes",
    code: `class Money:
    def __init__(self, amount, currency="USD"):
        self.amount = amount
        self.currency = currency

    def __format__(self, spec):
        if spec == "symbol":
            symbols = {"USD": "$", "EUR": "€", "GBP": "£"}
            return f"{symbols.get(self.currency, self.currency)}{self.amount:.2f}"
        return f"{self.amount:{spec}} {self.currency}"

m = Money(1234.5, "USD")
print(f"{m}")           # 1234.5 USD
print(f"{m:.2f}")       # 1234.50 USD
print(f"{m:symbol}")    # $1234.50`,
    explanation: "`__format__(self, spec)` is called by `format()` and f-string format specs; the `spec` string is whatever appears after the `:` in the format expression.",
  },
  {
    id: "py-b18-b1-property-deleter",
    language: "python",
    title: "Property deleter for cleanup on attribute deletion",
    tag: "classes",
    code: `class TempFile:
    def __init__(self, path):
        self._path = path

    @property
    def path(self): return self._path

    @path.deleter
    def path(self):
        import os
        if os.path.exists(self._path):
            os.remove(self._path)
            print(f"deleted {self._path}")
        self._path = None

tf = TempFile("/tmp/test.txt")
del tf.path   # triggers deleter`,
    explanation: "The `@prop.deleter` decorator defines what happens when `del obj.prop` is called, allowing cleanup logic to run alongside resource release.",
  },
  {
    id: "py-b18-b1-set-name-descriptor",
    language: "python",
    title: "__set_name__ gives a descriptor its own attribute name",
    tag: "classes",
    code: `class Validated:
    def __set_name__(self, owner, name):
        self.name = f"_{name}"   # store as private attribute

    def __get__(self, obj, objtype=None):
        if obj is None: return self
        return getattr(obj, self.name, None)

    def __set__(self, obj, value):
        if not isinstance(value, int) or value < 0:
            raise ValueError(f"{self.name} must be non-negative int")
        setattr(obj, self.name, value)

class Order:
    quantity = Validated()
    price    = Validated()

o = Order()
o.quantity = 5
o.price    = 100
# o.quantity = -1  # ValueError`,
    explanation: "`__set_name__` is called by the metaclass at class creation time with the attribute name the descriptor is assigned to — eliminating the need to pass the name as a constructor argument.",
  },
  {
    id: "py-b18-b1-dataclass-eq-hash",
    language: "python",
    title: "dataclass auto-generates __eq__ and can generate __hash__",
    tag: "classes",
    code: `from dataclasses import dataclass

@dataclass
class Point:
    x: int
    y: int

p1 = Point(1, 2)
p2 = Point(1, 2)
print(p1 == p2)    # True  — __eq__ compares fields

# hash is NOT generated by default (mutable classes have hash=None):
try:
    hash(p1)
except TypeError as e:
    print(e)   # unhashable type

@dataclass(frozen=True)
class FrozenPoint:
    x: int
    y: int

fp = FrozenPoint(1, 2)
print(hash(fp))   # works — frozen implies eq=True, unsafe_hash not needed`,
    explanation: "By default, `@dataclass` generates `__eq__` from all fields and sets `__hash__ = None` (to prevent silent hash collisions with mutable objects). Use `frozen=True` to get a proper hash.",
  },
  {
    id: "py-b18-b1-slots-descriptor",
    language: "python",
    title: "__slots__ creates slot descriptors accessible from the class",
    tag: "classes",
    code: `class Point:
    __slots__ = ("x", "y")
    def __init__(self, x, y): self.x, self.y = x, y

# slot descriptors exist on the class:
print(type(Point.x))      # <class 'member_descriptor'>
print(Point.x.__get__(Point(1, 2)))   # 1

p = Point(3, 4)
print(p.x, p.y)   # 3 4
# p.z = 5         # AttributeError — no __dict__ and no 'z' slot`,
    explanation: "Each name in `__slots__` becomes a `member_descriptor` on the class, providing direct attribute access without a per-instance `__dict__` — accessing a slot descriptor directly is possible but rarely needed in application code.",
  },
  {
    id: "py-b18-b1-abc-vs-protocol",
    language: "python",
    title: "ABC requires explicit inheritance; Protocol uses structural typing",
    tag: "classes",
    code: `from abc import ABC, abstractmethod
from typing import Protocol

class Animal(ABC):
    @abstractmethod
    def speak(self) -> str: ...

class Dog(Animal):        # must inherit
    def speak(self): return "woof"

class SpeakProtocol(Protocol):
    def speak(self) -> str: ...

class Cat:                # no inheritance needed!
    def speak(self): return "meow"

def make_sound(a: SpeakProtocol) -> None:
    print(a.speak())

make_sound(Cat())   # works — Cat is structurally compatible`,
    explanation: "ABCs require explicit `class X(MyABC)` inheritance; Protocols use structural (duck) typing — any class with the right methods satisfies the Protocol without inheriting from it.",
  },
  {
    id: "py-b18-b1-list-comp-vs-genexp",
    language: "python",
    title: "List comprehension vs generator expression memory use",
    tag: "snippet",
    code: `import sys

lst = [x * 2 for x in range(10_000)]   # all in memory
gen = (x * 2 for x in range(10_000))   # lazy iterator

print(sys.getsizeof(lst))   # ~85,176 bytes
print(sys.getsizeof(gen))   # ~104 bytes

# Generator is preferable when you only iterate once:
total = sum(x * 2 for x in range(10_000))   # no list created`,
    explanation: "A list comprehension materialises all results at once; a generator expression yields one at a time, using O(1) memory — prefer generators when you don't need random access.",
  },
  {
    id: "py-b18-b1-dict-get-default",
    language: "python",
    title: "dict.get with default avoids KeyError",
    tag: "snippet",
    code: `scores = {"Alice": 95, "Bob": 82}

# KeyError for missing key:
# print(scores["Carol"])

# .get() returns None by default:
print(scores.get("Carol"))          # None
print(scores.get("Carol", 0))       # 0
print(scores.get("Alice", 0))       # 95

# For mutable defaults, use setdefault instead:
scores.setdefault("Dave", 0)
print(scores["Dave"])  # 0`,
    explanation: "`dict.get(key, default)` returns `default` instead of raising `KeyError`; it's read-only (unlike `setdefault`), safe for lookups where missing keys are expected.",
  },
  {
    id: "py-b18-b1-unpacking-function-args",
    language: "python",
    title: "* and ** unpacking in function calls",
    tag: "snippet",
    code: `def greet(first, last, greeting="Hello"):
    return f"{greeting}, {first} {last}!"

names = ("Alice", "Smith")
opts  = {"greeting": "Hi"}

print(greet(*names))           # Hello, Alice Smith!
print(greet(*names, **opts))   # Hi, Alice Smith!

# Combine multiple iterables:
a, b = [1, 2], [3, 4]
combined = [*a, *b]   # [1, 2, 3, 4]`,
    explanation: "`*iterable` unpacks positional args; `**mapping` unpacks keyword args. Both work in function calls and in literals (list/dict/set constructors since Python 3.5).",
  },
  {
    id: "py-b18-b1-isinstance-tuple",
    language: "python",
    title: "isinstance accepts a tuple of types",
    tag: "snippet",
    code: `def to_string(val):
    if isinstance(val, (int, float, complex)):
        return f"number: {val}"
    if isinstance(val, (list, tuple)):
        return f"sequence: {list(val)}"
    return str(val)

print(to_string(3.14))    # number: 3.14
print(to_string([1,2]))   # sequence: [1, 2]
print(to_string("hi"))    # hi`,
    explanation: "`isinstance(obj, (TypeA, TypeB))` returns `True` if `obj` is an instance of any type in the tuple — shorter than chaining `or` conditions.",
  },
  {
    id: "py-b18-b1-functools-partial",
    language: "python",
    title: "functools.partial to pre-fill function arguments",
    tag: "snippet",
    code: `from functools import partial

def power(base, exponent):
    return base ** exponent

square = partial(power, exponent=2)
cube   = partial(power, exponent=3)

print(square(4))   # 16
print(cube(3))     # 27

# Useful for callbacks:
import os
join_home = partial(os.path.join, "/home/user")
print(join_home("docs", "report.txt"))`,
    explanation: "`functools.partial` creates a new callable with some arguments pre-filled — a lightweight alternative to lambdas for currying or adapting APIs.",
  },
  {
    id: "py-b18-b1-collections-namedtuple-methods",
    language: "python",
    title: "namedtuple helper methods: _asdict, _replace, _fields",
    tag: "structures",
    code: `from collections import namedtuple

Color = namedtuple("Color", ["red", "green", "blue"])
c = Color(255, 128, 0)

print(c._asdict())         # {'red': 255, 'green': 128, 'blue': 0}
print(c._replace(green=200))  # Color(red=255, green=200, blue=0)
print(Color._fields)       # ('red', 'green', 'blue')
print(c[0], c.red)         # 255 255  — index and name both work`,
    explanation: "`_asdict()` returns an `OrderedDict`; `_replace(**kw)` produces a copy with modified fields; `_fields` lists the field names — namedtuples are tuples with a dict-like API.",
  },
  {
    id: "py-b18-b1-open-mode-x",
    language: "python",
    title: "File mode 'x' creates a file, failing if it exists",
    tag: "caveats",
    code: `import os, tempfile

path = tempfile.mktemp()   # path that doesn't exist yet

# 'x' mode creates and raises FileExistsError if already there:
with open(path, "x") as f:
    f.write("first write")

try:
    with open(path, "x") as f:
        f.write("second write")  # won't happen
except FileExistsError:
    print("file already exists!")

os.remove(path)`,
    explanation: "Mode `'x'` (exclusive creation) fails atomically if the file exists — unlike `'w'` which silently truncates. Use it when creating a file is also a lock acquisition.",
  },
  {
    id: "py-b18-b1-multiprocessing-pickle",
    language: "python",
    title: "multiprocessing requires picklable targets",
    tag: "caveats",
    code: `from multiprocessing import Pool

def square(n):
    return n * n

# Works fine — module-level function is picklable:
with Pool(2) as p:
    print(p.map(square, range(5)))   # [0, 1, 4, 9, 16]

# FAILS — lambda is not picklable:
# with Pool(2) as p:
#     p.map(lambda x: x*x, range(5))   # PicklingError`,
    explanation: "`multiprocessing` serialises work with `pickle` to send to worker processes; lambdas and locally defined functions cannot be pickled — use module-level or `functools.partial` instead.",
  },
  {
    id: "py-b18-b1-get-type-hints",
    language: "python",
    title: "typing.get_type_hints resolves annotations at runtime",
    tag: "types",
    code: `from typing import get_type_hints

class Config:
    host: str
    port: int
    debug: bool = False

hints = get_type_hints(Config)
print(hints)   # {'host': <class 'str'>, 'port': <class 'int'>, 'debug': <class 'bool'>}

# Resolves forward references that __annotations__ stores as strings:
class Node:
    left:  "Node | None"
    right: "Node | None"

print(get_type_hints(Node))   # {left: Node | None, right: Node | None}`,
    explanation: "`get_type_hints()` resolves forward references (string annotations) to actual type objects — required for runtime introspection frameworks like dataclasses, Pydantic, and FastAPI.",
  },
  {
    id: "py-b18-b1-unittest-mock-patch",
    language: "python",
    title: "unittest.mock.patch replaces names in a module's namespace",
    tag: "families",
    code: `from unittest.mock import patch, MagicMock

# Patch targets the name AS USED in the module being tested:
with patch("os.path.exists", return_value=True) as mock_exists:
    import os
    result = os.path.exists("/fake/path")
    print(result)           # True
    mock_exists.assert_called_once_with("/fake/path")`,
    explanation: "`patch` replaces an attribute in the named module for the duration of the `with` block; patch the name **as imported** in the module under test, not where it's defined.",
  },
  {
    id: "py-b18-b1-concurrent-futures-thread",
    language: "python",
    title: "ThreadPoolExecutor for I/O-bound concurrency",
    tag: "families",
    code: `from concurrent.futures import ThreadPoolExecutor
import urllib.request

urls = [
    "http://example.com",
    "http://example.org",
    "http://example.net",
]

def fetch_size(url):
    with urllib.request.urlopen(url, timeout=5) as r:
        return len(r.read())

with ThreadPoolExecutor(max_workers=3) as ex:
    sizes = list(ex.map(fetch_size, urls))
print(sizes)`,
    explanation: "`ThreadPoolExecutor` runs callables in OS threads, ideal for I/O-bound tasks where the GIL is released during I/O — use `ProcessPoolExecutor` for CPU-bound work.",
  },
];
