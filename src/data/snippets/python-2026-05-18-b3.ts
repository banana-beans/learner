import type { Snippet } from "./types";

export const pythonSnippets20260518B3: Snippet[] = [
  // --- snippet ---
  {
    id: "py-b18-b3-bisect-insort",
    language: "python",
    title: "bisect.insort for sorted insertion",
    tag: "snippet",
    code: `import bisect

nums = [1, 3, 5, 7, 9]
bisect.insort(nums, 4)
print(nums)  # [1, 3, 4, 5, 7, 9]

# Find insertion point without inserting
idx = bisect.bisect_left(nums, 6)
print(idx)   # 4`,
    explanation: "bisect.insort inserts a value into a sorted list in O(log n) time while maintaining order; bisect_left/bisect_right find the insertion index.",
  },
  {
    id: "py-b18-b3-dataclass-post-init",
    language: "python",
    title: "__post_init__ in dataclasses",
    tag: "snippet",
    code: `from dataclasses import dataclass

@dataclass
class Circle:
    radius: float

    def __post_init__(self):
        if self.radius <= 0:
            raise ValueError("radius must be positive")
        self.area = 3.14159 * self.radius ** 2

c = Circle(5.0)
print(c.area)  # 78.53975`,
    explanation: "__post_init__ runs after the generated __init__ and is the right place for validation or computed attributes in dataclasses.",
  },
  {
    id: "py-b18-b3-zip-strict",
    language: "python",
    title: "zip with strict=True",
    tag: "snippet",
    code: `names = ["Alice", "Bob", "Carol"]
scores = [90, 85]  # shorter!

try:
    pairs = list(zip(names, scores, strict=True))
except ValueError as e:
    print(e)  # zip() has arguments with different lengths

# Without strict, truncates silently
pairs = list(zip(names, scores))
print(pairs)  # [('Alice', 90), ('Bob', 85)]`,
    explanation: "zip(strict=True) (Python 3.10+) raises ValueError if iterables have different lengths, catching accidental data mismatches.",
  },
  {
    id: "py-b18-b3-walrus-while",
    language: "python",
    title: "Walrus operator in while loop",
    tag: "snippet",
    code: `import io

data = io.BytesIO(b"hello world from bytes")

# Read chunks until empty
while chunk := data.read(5):
    print(chunk)
# b'hello'
# b' worl'
# b'd fro'
# b'm byt'
# b'es'`,
    explanation: "The walrus operator := assigns and tests in one expression, making chunk-reading loops concise without a separate sentinel check.",
  },
  {
    id: "py-b18-b3-enumerate-start",
    language: "python",
    title: "enumerate with custom start",
    tag: "snippet",
    code: `items = ["apple", "banana", "cherry"]

# 1-indexed list
for i, item in enumerate(items, start=1):
    print(f"{i}. {item}")
# 1. apple
# 2. banana
# 3. cherry`,
    explanation: "enumerate(iterable, start=N) lets you begin counting from any integer, avoiding manual counter arithmetic.",
  },
  {
    id: "py-b18-b3-dict-merge-operator",
    language: "python",
    title: "Dict merge with | operator",
    tag: "snippet",
    code: `defaults = {"timeout": 30, "retries": 3, "verbose": False}
overrides = {"timeout": 60, "verbose": True}

config = defaults | overrides
print(config)
# {'timeout': 60, 'retries': 3, 'verbose': True}

# In-place merge
defaults |= overrides`,
    explanation: "The | operator (Python 3.9+) merges two dicts, with right-side values taking precedence; |= updates in place.",
  },
  {
    id: "py-b18-b3-pathlib-glob",
    language: "python",
    title: "pathlib glob and rglob",
    tag: "snippet",
    code: `from pathlib import Path

p = Path(".")

# All .py files in current dir
for f in p.glob("*.py"):
    print(f.name)

# All .py files recursively
for f in p.rglob("*.py"):
    print(f.relative_to(p))`,
    explanation: "pathlib.Path.glob matches files in a directory; rglob is a recursive variant equivalent to **/*.py, both returning Path objects.",
  },
  {
    id: "py-b18-b3-textwrap-dedent",
    language: "python",
    title: "textwrap.dedent for inline code",
    tag: "snippet",
    code: `import textwrap

def generate_sql():
    query = """
        SELECT *
        FROM users
        WHERE active = 1
    """
    return textwrap.dedent(query).strip()

print(generate_sql())
# SELECT *
# FROM users
# WHERE active = 1`,
    explanation: "textwrap.dedent removes consistent leading whitespace from multiline strings, keeping indented code readable while producing clean output.",
  },
  {
    id: "py-b18-b3-functools-lru-cache",
    language: "python",
    title: "functools.lru_cache for memoization",
    tag: "snippet",
    code: `from functools import lru_cache

@lru_cache(maxsize=128)
def fib(n: int) -> int:
    if n < 2:
        return n
    return fib(n - 1) + fib(n - 2)

print(fib(50))         # fast
print(fib.cache_info())  # CacheInfo(hits=48, misses=51, ...)`,
    explanation: "lru_cache memoizes function results in a least-recently-used cache; cache_info() shows hit/miss statistics for tuning maxsize.",
  },
  {
    id: "py-b18-b3-string-template",
    language: "python",
    title: "string.Template safe substitution",
    tag: "snippet",
    code: `from string import Template

tmpl = Template("Hello, $name! You have $count messages.")
msg = tmpl.safe_substitute(name="Alice", count=5)
print(msg)  # Hello, Alice! You have 5 messages.

# safe_substitute leaves missing keys untouched
partial = tmpl.safe_substitute(name="Bob")
print(partial)  # Hello, Bob! You have $count messages.`,
    explanation: "string.Template is safer than % or format() for user-supplied templates since safe_substitute leaves unresolved placeholders intact instead of raising.",
  },
  {
    id: "py-b18-b3-contextmanager-cleanup",
    language: "python",
    title: "contextmanager for resource cleanup",
    tag: "snippet",
    code: `from contextlib import contextmanager

@contextmanager
def managed_resource(name: str):
    print(f"Acquiring {name}")
    try:
        yield name.upper()
    finally:
        print(f"Releasing {name}")

with managed_resource("database") as res:
    print(f"Using {res}")
# Acquiring database
# Using DATABASE
# Releasing database`,
    explanation: "@contextmanager turns a generator with a single yield into a context manager; code before yield is __enter__, the finally block is __exit__.",
  },
  {
    id: "py-b18-b3-slots-dataclass",
    language: "python",
    title: "__slots__ in dataclasses",
    tag: "snippet",
    code: `from dataclasses import dataclass

@dataclass(slots=True)  # Python 3.10+
class Point:
    x: float
    y: float

p = Point(1.0, 2.0)
print(p.x, p.y)

# Slots reduce memory and speed up attribute access
# No __dict__ — can't add arbitrary attributes
try:
    p.z = 3.0
except AttributeError as e:
    print(e)`,
    explanation: "slots=True on a dataclass generates __slots__, reducing per-instance memory overhead and slightly improving attribute access speed.",
  },
  {
    id: "py-b18-b3-operator-itemgetter",
    language: "python",
    title: "operator.itemgetter for sorting",
    tag: "snippet",
    code: `from operator import itemgetter

records = [
    {"name": "Carol", "age": 30},
    {"name": "Alice", "age": 25},
    {"name": "Bob",   "age": 25},
]

# Sort by age, then name
sorted_recs = sorted(records, key=itemgetter("age", "name"))
for r in sorted_recs:
    print(r)
# {'name': 'Alice', 'age': 25}
# {'name': 'Bob',   'age': 25}
# {'name': 'Carol', 'age': 30}`,
    explanation: "itemgetter returns a callable that extracts one or more keys from a mapping, commonly used as a sort key to avoid lambda overhead.",
  },
  {
    id: "py-b18-b3-re-named-groups",
    language: "python",
    title: "Named groups in regex",
    tag: "snippet",
    code: `import re

pattern = re.compile(
    r"(?P<year>\\d{4})-(?P<month>\\d{2})-(?P<day>\\d{2})"
)

m = pattern.match("2026-05-18")
if m:
    print(m.group("year"))   # 2026
    print(m.group("month"))  # 05
    print(m.groupdict())     # {'year': '2026', 'month': '05', 'day': '18'}`,
    explanation: "Named groups (?P<name>...) let you reference captures by name instead of index, making regex code self-documenting and robust to pattern changes.",
  },
  {
    id: "py-b18-b3-itertools-chain",
    language: "python",
    title: "itertools.chain to flatten iterables",
    tag: "snippet",
    code: `from itertools import chain

lists = [[1, 2], [3, 4], [5]]

flat = list(chain(*lists))
print(flat)  # [1, 2, 3, 4, 5]

# chain.from_iterable is more memory-efficient
flat2 = list(chain.from_iterable(lists))
print(flat2)  # [1, 2, 3, 4, 5]`,
    explanation: "itertools.chain connects multiple iterables end-to-end; chain.from_iterable is preferred when the input is itself an iterable of iterables.",
  },

  // --- understanding ---
  {
    id: "py-b18-b3-gc-reference-cycles",
    language: "python",
    title: "Garbage collection and reference cycles",
    tag: "understanding",
    code: `import gc

class Node:
    def __init__(self, val):
        self.val = val
        self.next = None

# Create a cycle: a -> b -> a
a = Node(1)
b = Node(2)
a.next = b
b.next = a  # cycle!

# CPython's cyclic GC breaks cycles
del a, b
collected = gc.collect()
print(f"Collected {collected} objects")`,
    explanation: "CPython's reference counting can't break reference cycles; the cyclic garbage collector (gc module) detects and frees cyclic garbage during collection.",
  },
  {
    id: "py-b18-b3-mro-c3-linearization",
    language: "python",
    title: "Method Resolution Order (MRO)",
    tag: "understanding",
    code: `class A:
    def hello(self): return "A"

class B(A):
    def hello(self): return "B"

class C(A):
    def hello(self): return "C"

class D(B, C):
    pass

print(D.__mro__)
# (<class 'D'>, <class 'B'>, <class 'C'>, <class 'A'>, <class 'object'>)
print(D().hello())  # "B"`,
    explanation: "Python uses C3 linearization to compute MRO, guaranteeing that each class appears before its parents and the order of sibling bases is preserved.",
  },
  {
    id: "py-b18-b3-descriptor-protocol",
    language: "python",
    title: "The descriptor protocol",
    tag: "understanding",
    code: `class Validator:
    def __set_name__(self, owner, name):
        self.name = name

    def __get__(self, obj, objtype=None):
        if obj is None:
            return self
        return obj.__dict__.get(self.name)

    def __set__(self, obj, value):
        if not isinstance(value, int):
            raise TypeError(f"{self.name} must be int")
        obj.__dict__[self.name] = value

class Config:
    timeout = Validator()

c = Config()
c.timeout = 30
print(c.timeout)  # 30`,
    explanation: "Descriptors implement __get__/__set__/__delete__ on a class attribute; Python dispatches attribute access through them, powering properties, classmethod, staticmethod, etc.",
  },
  {
    id: "py-b18-b3-generator-lazy",
    language: "python",
    title: "Lazy evaluation with generators",
    tag: "understanding",
    code: `def infinite_counter(start=0):
    n = start
    while True:
        yield n
        n += 1

# Take only what you need — no infinite loop
from itertools import islice
first_five = list(islice(infinite_counter(10), 5))
print(first_five)  # [10, 11, 12, 13, 14]`,
    explanation: "Generators are lazy — they produce values only when requested. Combining them with islice lets you express infinite sequences without consuming memory.",
  },
  {
    id: "py-b18-b3-global-interpreter-lock",
    language: "python",
    title: "GIL and CPU-bound parallelism",
    tag: "understanding",
    code: `import concurrent.futures
import math

def is_prime(n):
    # CPU-bound work
    return all(n % i != 0 for i in range(2, int(math.sqrt(n)) + 1))

numbers = [999983, 999979, 999961, 15485863]

# Threads share GIL — no speedup for CPU-bound work
with concurrent.futures.ThreadPoolExecutor(4) as pool:
    t_results = list(pool.map(is_prime, numbers))

# Processes bypass GIL
with concurrent.futures.ProcessPoolExecutor(4) as pool:
    p_results = list(pool.map(is_prime, numbers))

print(t_results == p_results)  # True`,
    explanation: "The GIL allows only one thread to execute Python bytecode at a time; CPU-bound tasks need ProcessPoolExecutor (separate processes) for true parallelism.",
  },
  {
    id: "py-b18-b3-name-mangling",
    language: "python",
    title: "Name mangling with double underscore",
    tag: "understanding",
    code: `class BankAccount:
    def __init__(self, balance):
        self.__balance = balance  # mangled to _BankAccount__balance

    def deposit(self, amount):
        self.__balance += amount

    def get_balance(self):
        return self.__balance

acct = BankAccount(100)
acct.deposit(50)
print(acct.get_balance())    # 150
# print(acct.__balance)      # AttributeError
print(acct._BankAccount__balance)  # 150 (still accessible)`,
    explanation: "Double-underscore prefixes trigger name mangling (_ClassName__attr), providing class-private attributes that avoid accidental override in subclasses.",
  },
  {
    id: "py-b18-b3-object-identity-equality",
    language: "python",
    title: "Identity vs equality: is vs ==",
    tag: "understanding",
    code: `a = [1, 2, 3]
b = [1, 2, 3]
c = a

print(a == b)   # True  — same contents
print(a is b)   # False — different objects
print(a is c)   # True  — same object

# Small int/str interning
x = 256
y = 256
print(x is y)   # True  — CPython interns small ints

z = 257
w = 257
print(z is w)   # False in most contexts`,
    explanation: "== calls __eq__ to compare values; is checks object identity. CPython interns small integers and short strings, so is can misleadingly return True — use == for value comparisons.",
  },
  {
    id: "py-b18-b3-scope-legb",
    language: "python",
    title: "LEGB scope resolution",
    tag: "understanding",
    code: `x = "global"

def outer():
    x = "enclosing"

    def inner():
        # Looks up: Local -> Enclosing -> Global -> Built-in
        print(x)   # "enclosing"

    inner()

outer()
print(x)  # "global"`,
    explanation: "Python resolves names in LEGB order: Local, Enclosing function, Global module, Built-in. nonlocal and global statements allow writing to outer scopes.",
  },
  {
    id: "py-b18-b3-list-tuple-immutability",
    language: "python",
    title: "Immutability and hashability",
    tag: "understanding",
    code: `# Lists are mutable — not hashable
lst = [1, 2, 3]
try:
    hash(lst)
except TypeError as e:
    print(e)  # unhashable type: 'list'

# Tuples of hashable items are hashable
t = (1, 2, 3)
print(hash(t))  # some int

# Tuples containing lists are not hashable
t2 = (1, [2, 3])
try:
    hash(t2)
except TypeError as e:
    print(e)  # unhashable type: 'list'`,
    explanation: "Hashability requires immutability all the way down; a tuple is only hashable if all its elements are hashable, making nested mutables forbidden as dict keys.",
  },
  {
    id: "py-b18-b3-generator-return-value",
    language: "python",
    title: "Return value from a generator",
    tag: "understanding",
    code: `def gen():
    yield 1
    yield 2
    return "done"  # becomes StopIteration value

g = gen()
print(next(g))  # 1
print(next(g))  # 2

try:
    next(g)
except StopIteration as e:
    print(e.value)  # "done"`,
    explanation: "A return statement inside a generator sets the value attribute of the StopIteration exception; this is how PEP 479 / yield from surfaces sub-generator return values.",
  },
  {
    id: "py-b18-b3-classmethods-factories",
    language: "python",
    title: "classmethod as alternative constructor",
    tag: "understanding",
    code: `class Date:
    def __init__(self, year, month, day):
        self.year, self.month, self.day = year, month, day

    @classmethod
    def from_iso(cls, iso_str: str) -> "Date":
        year, month, day = map(int, iso_str.split("-"))
        return cls(year, month, day)

    def __repr__(self):
        return f"Date({self.year}, {self.month}, {self.day})"

d = Date.from_iso("2026-05-18")
print(d)  # Date(2026, 5, 18)`,
    explanation: "classmethod receives the class as the first argument; this lets subclasses inherit factory methods and return the correct subclass instance via cls(...).",
  },
  {
    id: "py-b18-b3-exception-chaining",
    language: "python",
    title: "Exception chaining with raise from",
    tag: "understanding",
    code: `class DatabaseError(Exception):
    pass

def connect(url):
    try:
        raise ConnectionRefusedError("refused")
    except ConnectionRefusedError as e:
        raise DatabaseError("DB unavailable") from e

try:
    connect("db://localhost")
except DatabaseError as e:
    print(e)                 # DB unavailable
    print(e.__cause__)       # refused
    print(type(e.__cause__)) # <class 'ConnectionRefusedError'>`,
    explanation: "raise X from Y sets __cause__, explicitly chaining exceptions so tracebacks show the full context; raise X (without from) sets __context__ implicitly.",
  },
  {
    id: "py-b18-b3-abstract-base-class",
    language: "python",
    title: "Abstract base classes with ABC",
    tag: "understanding",
    code: `from abc import ABC, abstractmethod

class Shape(ABC):
    @abstractmethod
    def area(self) -> float: ...

    @abstractmethod
    def perimeter(self) -> float: ...

class Square(Shape):
    def __init__(self, side):
        self.side = side

    def area(self):
        return self.side ** 2

    def perimeter(self):
        return 4 * self.side

try:
    Shape()  # TypeError: can't instantiate abstract class
except TypeError as e:
    print(e)`,
    explanation: "ABC with @abstractmethod prevents direct instantiation and enforces that subclasses implement all abstract methods, providing interface-like contracts in Python.",
  },
  {
    id: "py-b18-b3-slots-vs-dict",
    language: "python",
    title: "__slots__ vs __dict__ memory trade-off",
    tag: "understanding",
    code: `import sys

class WithDict:
    def __init__(self, x, y):
        self.x = x
        self.y = y

class WithSlots:
    __slots__ = ("x", "y")
    def __init__(self, x, y):
        self.x = x
        self.y = y

d = WithDict(1, 2)
s = WithSlots(1, 2)

print(sys.getsizeof(d))            # ~48 bytes
print(sys.getsizeof(d.__dict__))   # ~184 bytes overhead
print(sys.getsizeof(s))            # ~56 bytes, no __dict__`,
    explanation: "__slots__ eliminates the per-instance __dict__, saving ~100-200 bytes per object — crucial for millions of small objects but it sacrifices dynamic attribute assignment.",
  },
  {
    id: "py-b18-b3-async-for",
    language: "python",
    title: "async for with async iterators",
    tag: "understanding",
    code: `import asyncio

class AsyncCounter:
    def __init__(self, stop):
        self.current = 0
        self.stop = stop

    def __aiter__(self):
        return self

    async def __anext__(self):
        if self.current >= self.stop:
            raise StopAsyncIteration
        await asyncio.sleep(0)  # yield control
        self.current += 1
        return self.current

async def main():
    async for val in AsyncCounter(3):
        print(val)  # 1, 2, 3

asyncio.run(main())`,
    explanation: "Async iterators implement __aiter__ and __anext__; async for suspends at each await inside __anext__, allowing other coroutines to run between iterations.",
  },

  // --- structures ---
  {
    id: "py-b18-b3-ordered-dict",
    language: "python",
    title: "OrderedDict move_to_end",
    tag: "structures",
    code: `from collections import OrderedDict

od = OrderedDict.fromkeys("abcd")
print(list(od))  # ['a', 'b', 'c', 'd']

od.move_to_end("b")
print(list(od))  # ['a', 'c', 'd', 'b']

od.move_to_end("c", last=False)
print(list(od))  # ['c', 'a', 'd', 'b']

# LRU cache pattern: evict last
od.popitem(last=False)  # removes 'c' (front)`,
    explanation: "OrderedDict preserves insertion order (like dict since 3.7) but adds move_to_end for efficient O(1) LRU-style reordering and popitem(last=False/True).",
  },
  {
    id: "py-b18-b3-array-module",
    language: "python",
    title: "array module for typed arrays",
    tag: "structures",
    code: `import array
import sys

# 'd' = double (8 bytes each)
arr = array.array("d", [1.1, 2.2, 3.3, 4.4])
lst = [1.1, 2.2, 3.3, 4.4]

print(sys.getsizeof(arr))  # ~120 bytes
print(sys.getsizeof(lst))  # ~88 bytes (but elements boxed separately)

arr.append(5.5)
print(arr.tolist())  # [1.1, 2.2, 3.3, 4.4, 5.5]`,
    explanation: "array.array stores homogeneous C-level values contiguously, giving better memory density than lists for large numeric arrays when numpy isn't available.",
  },
  {
    id: "py-b18-b3-heapq-heapify",
    language: "python",
    title: "heapq.heapify for in-place heap",
    tag: "structures",
    code: `import heapq

nums = [5, 1, 3, 7, 2, 4]
heapq.heapify(nums)          # O(n) in-place
print(nums)                   # [1, 2, 3, 7, 5, 4] (heap property)

print(heapq.heappop(nums))    # 1  (smallest)
print(heapq.heappop(nums))    # 2

heapq.heappush(nums, 0)
print(heapq.heappop(nums))    # 0`,
    explanation: "heapq turns a list into a min-heap in O(n); heappush/heappop maintain the heap invariant in O(log n), giving an efficient priority queue without a separate class.",
  },
  {
    id: "py-b18-b3-namedtuple-fields",
    language: "python",
    title: "namedtuple with _fields and _asdict",
    tag: "structures",
    code: `from collections import namedtuple

Color = namedtuple("Color", ["red", "green", "blue"])
c = Color(255, 128, 0)

print(c.red)        # 255
print(c._fields)    # ('red', 'green', 'blue')
print(c._asdict())  # {'red': 255, 'green': 128, 'blue': 0}

# Replace creates new instance
brighter = c._replace(red=min(c.red + 50, 255))
print(brighter)`,
    explanation: "namedtuple provides named field access while remaining an immutable tuple; _fields, _asdict, and _replace are the key utility methods for introspection and transformation.",
  },
  {
    id: "py-b18-b3-deque-rotate",
    language: "python",
    title: "deque rotate for circular buffer",
    tag: "structures",
    code: `from collections import deque

buf = deque([1, 2, 3, 4, 5], maxlen=5)
print(buf)           # deque([1, 2, 3, 4, 5], maxlen=5)

buf.rotate(2)        # shift right by 2
print(buf)           # deque([4, 5, 1, 2, 3], maxlen=5)

# Add to full deque — oldest dropped automatically
buf.appendleft(0)
print(buf)           # deque([0, 4, 5, 1, 2], maxlen=5)`,
    explanation: "deque.rotate(n) shifts elements right (n>0) or left (n<0) in O(n); combined with maxlen it gives a fixed-size circular buffer with O(1) both-end operations.",
  },
  {
    id: "py-b18-b3-set-operations",
    language: "python",
    title: "Set operations: union, intersection, difference",
    tag: "structures",
    code: `a = {1, 2, 3, 4}
b = {3, 4, 5, 6}

print(a | b)    # {1, 2, 3, 4, 5, 6}  union
print(a & b)    # {3, 4}              intersection
print(a - b)    # {1, 2}              difference
print(a ^ b)    # {1, 2, 5, 6}        symmetric difference

# Update variants (in-place)
a |= {7}
print(a)        # {1, 2, 3, 4, 7}`,
    explanation: "Python sets support all standard set operations via operators and methods; the |, &, -, ^ operators are equivalent to union, intersection, difference, symmetric_difference.",
  },
  {
    id: "py-b18-b3-chainmap-layers",
    language: "python",
    title: "ChainMap for layered config",
    tag: "structures",
    code: `from collections import ChainMap

defaults = {"color": "blue", "size": 10}
env_vars = {"color": "red"}
cli_args = {}

config = ChainMap(cli_args, env_vars, defaults)
print(config["color"])  # "red"  (env_vars wins)
print(config["size"])   # 10     (from defaults)

# Writes go to first map only
config["size"] = 20
print(cli_args)         # {'size': 20}
print(defaults["size"]) # 10 (unchanged)`,
    explanation: "ChainMap stacks multiple dicts and searches them in order for lookups; writes always go to the first map, making it ideal for layered config with defaults.",
  },
  {
    id: "py-b18-b3-sortedcontainers",
    language: "python",
    title: "SortedList from sortedcontainers",
    tag: "structures",
    code: `# pip install sortedcontainers
from sortedcontainers import SortedList

sl = SortedList([5, 1, 3])
sl.add(2)
print(sl)          # SortedList([1, 2, 3, 5])

sl.discard(3)
print(sl)          # SortedList([1, 2, 5])

# O(log n) bisect-based access
idx = sl.bisect_left(2)
print(idx)         # 1`,
    explanation: "SortedList from the sortedcontainers library maintains a sorted list with O(log n) add/remove, filling the gap between heapq (min-only) and full BST implementations.",
  },
  {
    id: "py-b18-b3-memoryview-slice",
    language: "python",
    title: "memoryview for zero-copy slicing",
    tag: "structures",
    code: `data = bytearray(b"Hello, World!")
view = memoryview(data)

# Slicing a memoryview doesn't copy bytes
sub = view[7:12]
print(bytes(sub))    # b'World'

# Modify via view — modifies original bytearray
view[0:5] = b"Howdy"
print(data)          # bytearray(b'Howdy, World!')`,
    explanation: "memoryview exposes the buffer protocol, allowing slices and modifications of bytes/bytearray/array without copying data — critical for high-throughput I/O.",
  },
  {
    id: "py-b18-b3-weakref-set",
    language: "python",
    title: "WeakSet for object tracking",
    tag: "structures",
    code: `import weakref

class Widget:
    def __init__(self, name):
        self.name = name

registry = weakref.WeakSet()

w1 = Widget("button")
w2 = Widget("slider")
registry.add(w1)
registry.add(w2)
print(len(registry))  # 2

del w1
import gc; gc.collect()
print(len(registry))  # 1  (w1 was garbage collected)`,
    explanation: "WeakSet holds weak references; objects are automatically removed when their last strong reference is deleted, allowing a registry that doesn't prevent garbage collection.",
  },
  {
    id: "py-b18-b3-counter-most-common",
    language: "python",
    title: "Counter arithmetic and most_common",
    tag: "structures",
    code: `from collections import Counter

c1 = Counter("aabbcc")
c2 = Counter("bcdd")

print(c1 + c2)  # Counter({'b': 3, 'c': 3, 'a': 2, 'd': 2})
print(c1 - c2)  # Counter({'a': 2, 'b': 1, 'c': 1}) — negatives dropped
print(c1 & c2)  # Counter({'b': 1, 'c': 1}) — min of each

print(c1.most_common(2))  # [('a', 2), ('b', 2)]`,
    explanation: "Counter supports +, -, &, | operations between counters; most_common(n) returns the n highest-count elements, useful for frequency analysis.",
  },
  {
    id: "py-b18-b3-enum-auto",
    language: "python",
    title: "Enum with auto() and IntEnum",
    tag: "structures",
    code: `from enum import Enum, IntEnum, auto

class Color(Enum):
    RED   = auto()
    GREEN = auto()
    BLUE  = auto()

print(Color.RED.value)    # 1
print(list(Color))        # [<Color.RED: 1>, ...]

class Status(IntEnum):
    OK      = 200
    NOT_FOUND = 404

print(Status.OK == 200)   # True  (IntEnum compares with ints)
print(Status(404).name)   # 'NOT_FOUND'`,
    explanation: "auto() assigns sequential values automatically; IntEnum inherits from int, allowing comparison with integer literals — useful for HTTP status codes and protocol constants.",
  },
  {
    id: "py-b18-b3-dict-setdefault",
    language: "python",
    title: "dict.setdefault for grouping",
    tag: "structures",
    code: `words = ["apple", "banana", "avocado", "blueberry", "cherry"]

groups = {}
for word in words:
    groups.setdefault(word[0], []).append(word)

print(groups)
# {'a': ['apple', 'avocado'], 'b': ['banana', 'blueberry'], 'c': ['cherry']}`,
    explanation: "dict.setdefault(key, default) inserts the default only if the key is absent and returns the value; it's a clean alternative to an if-key-not-in check for building group-by dicts.",
  },
  {
    id: "py-b18-b3-frozenset-hashable",
    language: "python",
    title: "frozenset as dict key",
    tag: "structures",
    code: `# frozenset is immutable and hashable — usable as dict key or set element
graph_edges = {
    frozenset({0, 1}): 5.0,
    frozenset({1, 2}): 3.0,
    frozenset({0, 2}): 8.0,
}

edge = frozenset({1, 0})          # order doesn't matter
print(graph_edges[edge])          # 5.0

# Check membership
print(frozenset({2, 1}) in graph_edges)  # True`,
    explanation: "frozenset is the immutable, hashable counterpart to set; using frozensets as dict keys is a natural representation for undirected graph edges where {u,v} == {v,u}.",
  },
  {
    id: "py-b18-b3-list-comprehension-matrix",
    language: "python",
    title: "Matrix operations with list comprehensions",
    tag: "structures",
    code: `# 3x3 identity matrix
I = [[1 if r == c else 0 for c in range(3)] for r in range(3)]
print(I)  # [[1, 0, 0], [0, 1, 0], [0, 0, 1]]

# Transpose a matrix
M = [[1, 2, 3], [4, 5, 6]]
T = [[M[r][c] for r in range(len(M))] for c in range(len(M[0]))]
print(T)  # [[1, 4], [2, 5], [3, 6]]

# Or with zip
T2 = [list(row) for row in zip(*M)]
print(T2)  # [[1, 4], [2, 5], [3, 6]]`,
    explanation: "Nested list comprehensions build 2-D matrices concisely; transposing with zip(*M) unpacks rows and re-zips columns, which is cleaner and equivalent.",
  },

  // --- caveats ---
  {
    id: "py-b18-b3-late-binding-closures",
    language: "python",
    title: "Late binding in closures",
    tag: "caveats",
    code: `# WRONG: all closures see the final value of i
funcs_bad = [lambda: i for i in range(3)]
print([f() for f in funcs_bad])  # [2, 2, 2]

# RIGHT: capture current value with default arg
funcs_ok = [lambda i=i: i for i in range(3)]
print([f() for f in funcs_ok])   # [0, 1, 2]`,
    explanation: "Closures capture variable names, not values; by the time the lambda runs, the loop variable has its final value. Use a default argument to snapshot the value at creation time.",
  },
  {
    id: "py-b18-b3-mutable-class-attr",
    language: "python",
    title: "Mutable class attribute shared across instances",
    tag: "caveats",
    code: `class Team:
    members = []  # shared class attribute!

    def add(self, name):
        self.members.append(name)

t1 = Team()
t2 = Team()

t1.add("Alice")
print(t2.members)  # ['Alice']  — unintended sharing!

# Fix: initialize in __init__
class TeamFixed:
    def __init__(self):
        self.members = []`,
    explanation: "Mutable class attributes are shared across all instances; mutating via self modifies the class-level object. Always initialize mutable defaults in __init__.",
  },
  {
    id: "py-b18-b3-except-bare",
    language: "python",
    title: "Bare except catches everything including SystemExit",
    tag: "caveats",
    code: `import sys

# WRONG: catches KeyboardInterrupt, SystemExit, etc.
try:
    sys.exit(0)
except:
    print("caught SystemExit — app can't exit!")

# RIGHT: catch Exception (excludes BaseException subclasses)
try:
    sys.exit(0)
except Exception:
    print("this won't catch SystemExit")`,
    explanation: "Bare except: catches BaseException and all subclasses including KeyboardInterrupt and SystemExit; always use except Exception to leave control-flow exceptions alone.",
  },
  {
    id: "py-b18-b3-float-comparison",
    language: "python",
    title: "Float equality comparison pitfalls",
    tag: "caveats",
    code: `import math

# Binary fractions can't represent 0.1 exactly
print(0.1 + 0.2 == 0.3)          # False
print(0.1 + 0.2)                   # 0.30000000000000004

# Use math.isclose for float comparisons
print(math.isclose(0.1 + 0.2, 0.3))            # True
print(math.isclose(0.1 + 0.2, 0.3, rel_tol=1e-9))  # True`,
    explanation: "Most decimal fractions can't be represented exactly in IEEE 754 binary; use math.isclose (or cmath.isclose for complex) instead of == for floating-point comparisons.",
  },
  {
    id: "py-b18-b3-in-operator-list-vs-set",
    language: "python",
    title: "Membership test: list O(n) vs set O(1)",
    tag: "caveats",
    code: `import timeit

BIG = list(range(100_000))
BIG_SET = set(BIG)

t_list = timeit.timeit(lambda: 99_999 in BIG,     number=1000)
t_set  = timeit.timeit(lambda: 99_999 in BIG_SET, number=1000)

print(f"list: {t_list:.4f}s")
print(f"set:  {t_set:.4f}s")
# list is ~100-1000x slower for large collections`,
    explanation: "The in operator on a list scans linearly O(n); on a set or dict it hashes O(1). For repeated membership tests on large collections, convert to set first.",
  },
  {
    id: "py-b18-b3-is-none-vs-equality",
    language: "python",
    title: "Always use 'is None' not '== None'",
    tag: "caveats",
    code: `class Tricky:
    def __eq__(self, other):
        return True  # claims to equal everything

obj = Tricky()
print(obj == None)   # True  — __eq__ overridden!
print(obj is None)   # False — identity check, always correct

def process(value=None):
    if value is None:   # correct sentinel check
        value = []
    return value`,
    explanation: "== None calls __eq__, which can be overridden. is None checks identity and is never overrideable, making it the correct idiom for None-sentinel checks.",
  },
  {
    id: "py-b18-b3-string-concat-loop",
    language: "python",
    title: "String concatenation in loops is O(n²)",
    tag: "caveats",
    code: `import timeit

n = 10_000

# SLOW: creates new string each iteration
def concat_loop():
    s = ""
    for i in range(n):
        s += str(i)
    return s

# FAST: single join at end
def join_method():
    parts = []
    for i in range(n):
        parts.append(str(i))
    return "".join(parts)

print(timeit.timeit(concat_loop, number=100))  # ~slower
print(timeit.timeit(join_method, number=100))  # ~faster`,
    explanation: "Repeated += on strings creates a new string each time (O(n) copy), giving O(n²) total. Accumulate in a list and join once for O(n) string building.",
  },
  {
    id: "py-b18-b3-try-finally-return",
    language: "python",
    title: "finally overrides return values",
    tag: "caveats",
    code: `def dangerous():
    try:
        return "from try"
    finally:
        return "from finally"  # overrides try's return!

print(dangerous())  # "from finally"

def safe(n):
    result = []
    try:
        result.append("tried")
        return result
    finally:
        result.append("finalized")  # mutates returned list!

print(safe(1))  # ['tried', 'finalized']`,
    explanation: "A return in finally silently overrides the try block's return; mutating a returned mutable object in finally also changes what the caller receives.",
  },
  {
    id: "py-b18-b3-dict-iteration-change",
    language: "python",
    title: "Cannot change dict size during iteration",
    tag: "caveats",
    code: `d = {"a": 1, "b": 2, "c": 3}

try:
    for k in d:
        if d[k] == 2:
            del d[k]  # RuntimeError!
except RuntimeError as e:
    print(e)  # dictionary changed size during iteration

# Fix: iterate over a copy of keys
for k in list(d.keys()):
    if d[k] == 2:
        del d[k]

print(d)  # {'a': 1, 'c': 3}`,
    explanation: "Modifying a dict's size (add/delete) while iterating raises RuntimeError; iterate over list(d.keys()) or build a new dict with a comprehension instead.",
  },
  {
    id: "py-b18-b3-args-ordering",
    language: "python",
    title: "*args and **kwargs ordering rules",
    tag: "caveats",
    code: `# Correct order: positional, *args, keyword, **kwargs
def func(a, b, *args, kw_only, **kwargs):
    print(a, b, args, kw_only, kwargs)

func(1, 2, 3, 4, kw_only="x", extra="y")
# 1 2 (3, 4) x {'extra': 'y'}

# After *, all params are keyword-only
def strict(a, *, b, c=10):
    return a + b + c

print(strict(1, b=2))      # 13
# strict(1, 2) would fail`,
    explanation: "Parameters after * are keyword-only; the full order rule is: positional, /, positional-or-keyword, *, keyword-only, **kwargs — violating order is a SyntaxError.",
  },
  {
    id: "py-b18-b3-truthy-falsy",
    language: "python",
    title: "Falsy values and truthiness pitfalls",
    tag: "caveats",
    code: `# All falsy: None, False, 0, 0.0, '', [], {}, set(), ()
falsy = [None, False, 0, 0.0, "", [], {}, set(), ()]
print([bool(v) for v in falsy])  # all False

def first_word(text):
    # BUG: empty string is falsy — treats "" and None the same
    return text if text else "default"

print(first_word(""))      # "default"  (probably wrong)
print(first_word(None))    # "default"  (correct)

# Fix: explicit None check
def first_word_fixed(text):
    return "default" if text is None else text`,
    explanation: "Python's truthiness treats many 'empty' values as False; explicitly check is None, len(x) == 0, or x is not None depending on your actual invariant.",
  },
  {
    id: "py-b18-b3-import-star",
    language: "python",
    title: "from module import * pollutes namespace",
    tag: "caveats",
    code: `# AVOID: hard to trace where names come from
# from os.path import *
# from sys import *

# OK: explicit imports are clear and grep-able
from os.path import join, exists, dirname
from sys import argv, exit as sys_exit

# In modules, __all__ limits what 'import *' exports
# __all__ = ["PublicClass", "public_func"]`,
    explanation: "Wildcard imports hide where names come from, risk name collisions between modules, and make static analysis harder; always prefer explicit imports.",
  },
  {
    id: "py-b18-b3-pep-572-walrus-scope",
    language: "python",
    title: "Walrus operator leaks scope from comprehensions",
    tag: "caveats",
    code: `# Regular comprehension variable doesn't leak
[x for x in range(5)]
try:
    print(x)  # may or may not exist depending on Python version
except NameError:
    pass

# Walrus DOES leak intentionally
filtered = [y := f for f in range(5) if (z := f * 2) > 4]
print(y)  # 4 — last matched f
print(z)  # 8 — last matched f*2`,
    explanation: "Walrus operator := in a comprehension intentionally leaks the assigned name to the enclosing scope; this is by design (PEP 572) but can cause surprising name shadowing.",
  },
  {
    id: "py-b18-b3-metaclass-conflict",
    language: "python",
    title: "Metaclass conflict in multiple inheritance",
    tag: "caveats",
    code: `class MetaA(type): pass
class MetaB(type): pass

class A(metaclass=MetaA): pass
class B(metaclass=MetaB): pass

try:
    class C(A, B): pass  # TypeError!
except TypeError as e:
    print(e)
    # metaclass conflict: the metaclass of a derived class
    # must be a (non-strict) subclass of all base metaclasses

# Fix: create a combined metaclass
class MetaC(MetaA, MetaB): pass
class C(A, B, metaclass=MetaC): pass`,
    explanation: "When two base classes have different metaclasses, Python can't automatically resolve the conflict; you must explicitly provide a combined metaclass that inherits from both.",
  },

  // --- types ---
  {
    id: "py-b18-b3-typing-protocol",
    language: "python",
    title: "typing.Protocol for structural subtyping",
    tag: "types",
    code: `from typing import Protocol

class Drawable(Protocol):
    def draw(self) -> None: ...

class Circle:
    def draw(self) -> None:
        print("Drawing circle")

class Square:
    def draw(self) -> None:
        print("Drawing square")

def render(shape: Drawable) -> None:
    shape.draw()

render(Circle())  # works without inheriting Drawable
render(Square())`,
    explanation: "Protocol enables structural subtyping ('duck typing' with type-checking support); any class implementing the required methods satisfies the protocol without explicit inheritance.",
  },
  {
    id: "py-b18-b3-typing-literal",
    language: "python",
    title: "typing.Literal for exact value types",
    tag: "types",
    code: `from typing import Literal

Direction = Literal["north", "south", "east", "west"]

def move(direction: Direction, steps: int) -> None:
    print(f"Moving {steps} step(s) {direction}")

move("north", 3)   # OK
# move("up", 1)    # type error: not in Literal values

Status = Literal[200, 404, 500]

def respond(code: Status) -> str:
    return f"HTTP {code}"`,
    explanation: "Literal restricts a type to a specific set of values; type checkers enforce that only those exact values are passed, equivalent to an enum without the overhead.",
  },
  {
    id: "py-b18-b3-typing-overload",
    language: "python",
    title: "typing.overload for different signatures",
    tag: "types",
    code: `from typing import overload

@overload
def process(value: int) -> str: ...
@overload
def process(value: str) -> int: ...

def process(value):
    if isinstance(value, int):
        return str(value)
    return len(value)

result1: str = process(42)      # -> "42"
result2: int = process("hello") # -> 5`,
    explanation: "@overload registers multiple type signatures for a function; type checkers use the overloads while the actual implementation (without @overload) handles all cases at runtime.",
  },
  {
    id: "py-b18-b3-typing-self",
    language: "python",
    title: "typing.Self for fluent interfaces",
    tag: "types",
    code: `from __future__ import annotations
from typing import Self

class Builder:
    def __init__(self):
        self._items: list[str] = []

    def add(self, item: str) -> Self:
        self._items.append(item)
        return self

    def build(self) -> list[str]:
        return self._items

class ExtBuilder(Builder):
    def add_many(self, *items: str) -> Self:
        for item in items:
            self.add(item)
        return self

# Subclass methods return ExtBuilder, not Builder
b: ExtBuilder = ExtBuilder().add("a").add_many("b", "c")`,
    explanation: "typing.Self (Python 3.11+) annotates methods that return self, ensuring subclass methods return the subclass type rather than the base class type.",
  },
  {
    id: "py-b18-b3-typing-typevar-bound",
    language: "python",
    title: "TypeVar with bound constraint",
    tag: "types",
    code: `from typing import TypeVar
from numbers import Number

N = TypeVar("N", bound=Number)

def double(x: N) -> N:
    return x * 2  # type: ignore[operator]

print(double(5))     # 10
print(double(2.5))   # 5.0

# Also: constraints (union of exact types)
AnyStr = TypeVar("AnyStr", str, bytes)

def first_char(s: AnyStr) -> AnyStr:
    return s[:1]`,
    explanation: "TypeVar(bound=T) restricts a type variable to subclasses of T, while TypeVar(X, A, B) restricts to exactly A or B; bound is more flexible for numeric hierarchies.",
  },
  {
    id: "py-b18-b3-pep-695-type-alias",
    language: "python",
    title: "PEP 695 type alias syntax (3.12+)",
    tag: "types",
    code: `# Python 3.12+ type statement
type Vector = list[float]
type Matrix = list[Vector]

def dot(a: Vector, b: Vector) -> float:
    return sum(x * y for x, y in zip(a, b))

# Generic type alias
type Pair[T] = tuple[T, T]

def swap[T](p: Pair[T]) -> Pair[T]:
    return (p[1], p[0])

print(swap((1, 2)))  # (2, 1)`,
    explanation: "The type statement (PEP 695) creates explicit type aliases that type checkers distinguish from assignment; it also supports generic type aliases without TypeVar boilerplate.",
  },
  {
    id: "py-b18-b3-annotated-metadata",
    language: "python",
    title: "Annotated for metadata-enriched types",
    tag: "types",
    code: `from typing import Annotated
from dataclasses import dataclass

# Attach metadata alongside the type
Positive = Annotated[int, "must be > 0"]
Percentage = Annotated[float, "0.0 to 1.0"]

@dataclass
class Metric:
    count: Positive
    ratio: Percentage

# Runtime: still just int/float; metadata for tools/frameworks
import typing
hints = typing.get_type_hints(Metric, include_extras=True)
print(hints["count"])  # Annotated[int, 'must be > 0']`,
    explanation: "Annotated[T, metadata...] attaches arbitrary metadata to a type without changing its runtime behavior; frameworks like Pydantic and FastAPI use it for validation rules.",
  },
  {
    id: "py-b18-b3-typedict-required",
    language: "python",
    title: "TypedDict with Required and NotRequired",
    tag: "types",
    code: `from typing import TypedDict, Required, NotRequired

class UserProfile(TypedDict):
    name: Required[str]       # must be present
    email: Required[str]
    bio: NotRequired[str]     # optional key
    age: NotRequired[int]

def greet(profile: UserProfile) -> str:
    return f"Hello, {profile['name']}!"

greet({"name": "Alice", "email": "a@example.com"})
# Missing 'bio' and 'age' are fine`,
    explanation: "Required/NotRequired (Python 3.11+) mark individual TypedDict keys as mandatory or optional, replacing the older total=False/True class-level toggle.",
  },
  {
    id: "py-b18-b3-param-spec",
    language: "python",
    title: "ParamSpec for decorator type safety",
    tag: "types",
    code: `from typing import ParamSpec, TypeVar, Callable
from functools import wraps
import logging

P = ParamSpec("P")
R = TypeVar("R")

def logged(func: Callable[P, R]) -> Callable[P, R]:
    @wraps(func)
    def wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
        logging.info(f"Calling {func.__name__}")
        return func(*args, **kwargs)
    return wrapper

@logged
def add(x: int, y: int) -> int:
    return x + y

result: int = add(1, 2)  # type-safe — preserves signature`,
    explanation: "ParamSpec captures the parameter types of a callable, enabling decorators to preserve full type information about wrapped function signatures.",
  },
  {
    id: "py-b18-b3-final-keyword",
    language: "python",
    title: "typing.Final for constants",
    tag: "types",
    code: `from typing import Final

MAX_RETRIES: Final = 3
BASE_URL: Final[str] = "https://api.example.com"

# Type checker will flag reassignment:
# MAX_RETRIES = 5  # error: cannot assign to final variable

from typing import final

class Base:
    @final
    def critical(self) -> None:
        print("cannot override")

class Child(Base):
    # def critical(self): ...  # type error: cannot override @final
    pass`,
    explanation: "Final on a variable prevents reassignment; @final on a class/method prevents subclassing or overriding — both are enforced by type checkers, not at runtime.",
  },
  {
    id: "py-b18-b3-typed-namedtuple",
    language: "python",
    title: "Typed NamedTuple class syntax",
    tag: "types",
    code: `from typing import NamedTuple

class Point(NamedTuple):
    x: float
    y: float
    label: str = ""  # default value

p = Point(1.0, 2.0, "origin")
print(p.x, p.label)   # 1.0 origin
print(p._asdict())     # {'x': 1.0, 'y': 2.0, 'label': 'origin'}

# Still a proper tuple
print(isinstance(p, tuple))  # True
x, y, label = p`,
    explanation: "The class-based NamedTuple syntax adds proper type annotations and default values while keeping full tuple compatibility, replacing the functional namedtuple() factory.",
  },
  {
    id: "py-b18-b3-never-type",
    language: "python",
    title: "typing.Never for unreachable code",
    tag: "types",
    code: `from typing import Never, assert_never

def handle_direction(d: str) -> str:
    match d:
        case "north": return "N"
        case "south": return "S"
        case "east":  return "E"
        case "west":  return "W"
        case _ as unreachable:
            assert_never(unreachable)  # type: Never`,
    explanation: "Never/NoReturn annotates functions that never return; assert_never() marks code that should be unreachable, causing type checkers to error if the type isn't actually Never.",
  },
  {
    id: "py-b18-b3-type-guard",
    language: "python",
    title: "TypeGuard for user-defined type narrowing",
    tag: "types",
    code: `from typing import TypeGuard

def is_string_list(val: list[object]) -> TypeGuard[list[str]]:
    return all(isinstance(x, str) for x in val)

def process(items: list[object]) -> None:
    if is_string_list(items):
        # type checker knows items: list[str] here
        print(items[0].upper())
    else:
        print("not all strings")

process(["hello", "world"])  # HELLO`,
    explanation: "TypeGuard[T] on a boolean function's return type tells type checkers to narrow the argument to T when the function returns True, enabling custom isinstance-style type guards.",
  },

  // --- families ---
  {
    id: "py-b18-b3-multiprocessing-pool",
    language: "python",
    title: "multiprocessing.Pool map for parallelism",
    tag: "families",
    code: `import multiprocessing as mp

def square(n):
    return n * n

if __name__ == "__main__":
    with mp.Pool(processes=4) as pool:
        results = pool.map(square, range(10))
    print(results)  # [0, 1, 4, 9, 16, 25, 36, 49, 64, 81]

    # Asynchronous variant
    with mp.Pool(4) as pool:
        async_result = pool.map_async(square, range(5))
        print(async_result.get())  # [0, 1, 4, 9, 16]`,
    explanation: "Pool.map distributes work across processes to bypass the GIL for CPU-bound tasks; the if __name__ == '__main__' guard is required on Windows and macOS to prevent infinite forking.",
  },
  {
    id: "py-b18-b3-asyncio-gather",
    language: "python",
    title: "asyncio.gather for concurrent coroutines",
    tag: "families",
    code: `import asyncio

async def fetch(url: str) -> str:
    await asyncio.sleep(0.1)  # simulate I/O
    return f"data from {url}"

async def main():
    urls = ["https://a.com", "https://b.com", "https://c.com"]
    # All run concurrently, not sequentially
    results = await asyncio.gather(*[fetch(u) for u in urls])
    for r in results:
        print(r)

asyncio.run(main())`,
    explanation: "asyncio.gather runs multiple coroutines concurrently in the same event loop; unlike sequential await, gather starts all coroutines before waiting for any, reducing total I/O time.",
  },
  {
    id: "py-b18-b3-logging-structured",
    language: "python",
    title: "Structured logging with extra fields",
    tag: "families",
    code: `import logging
import json

class JSONFormatter(logging.Formatter):
    def format(self, record):
        log_obj = {
            "level": record.levelname,
            "message": record.getMessage(),
            "module": record.module,
        }
        if hasattr(record, "request_id"):
            log_obj["request_id"] = record.request_id
        return json.dumps(log_obj)

logger = logging.getLogger("app")
handler = logging.StreamHandler()
handler.setFormatter(JSONFormatter())
logger.addHandler(handler)
logger.setLevel(logging.INFO)

logger.info("request handled", extra={"request_id": "abc123"})`,
    explanation: "Custom Formatter subclasses serialize log records as JSON, enabling structured logging that log aggregators (Datadog, Splunk) can parse and query by field.",
  },
  {
    id: "py-b18-b3-pytest-fixtures",
    language: "python",
    title: "pytest fixtures for test setup",
    tag: "families",
    code: `# test_example.py
import pytest

@pytest.fixture
def sample_data():
    return {"name": "Alice", "score": 95}

@pytest.fixture
def database(tmp_path):
    db_file = tmp_path / "test.db"
    db_file.write_text("[]")
    return db_file

def test_score(sample_data):
    assert sample_data["score"] >= 90

def test_db_exists(database):
    assert database.exists()`,
    explanation: "pytest fixtures are functions that provide test dependencies via parameter injection; they support setup/teardown via yield, scoping (function/module/session), and composition.",
  },
  {
    id: "py-b18-b3-click-cli",
    language: "python",
    title: "CLI with Click decorators",
    tag: "families",
    code: `import click

@click.group()
def cli(): pass

@cli.command()
@click.argument("name")
@click.option("--count", default=1, help="Number of greetings")
@click.option("--shout", is_flag=True)
def greet(name, count, shout):
    msg = f"Hello, {name}!"
    if shout:
        msg = msg.upper()
    for _ in range(count):
        click.echo(msg)

if __name__ == "__main__":
    cli()
# python script.py greet Alice --count 2 --shout`,
    explanation: "Click uses decorators to declare CLI commands, arguments, and options with automatic help text and type coercion, requiring no manual argparse boilerplate.",
  },
  {
    id: "py-b18-b3-pydantic-validation",
    language: "python",
    title: "Pydantic model validation",
    tag: "families",
    code: `from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional

class User(BaseModel):
    name: str
    age: int
    email: str  # EmailStr needs email-validator package

    @field_validator("age")
    @classmethod
    def age_must_be_positive(cls, v):
        if v < 0:
            raise ValueError("age must be non-negative")
        return v

u = User(name="Alice", age=30, email="alice@example.com")
print(u.model_dump())

try:
    User(name="Bob", age=-1, email="b@example.com")
except Exception as e:
    print(e)`,
    explanation: "Pydantic BaseModel validates data at instantiation using type annotations; field_validator adds custom logic, and model_dump() serializes to a dict.",
  },
  {
    id: "py-b18-b3-sqlalchemy-core",
    language: "python",
    title: "SQLAlchemy Core expression language",
    tag: "families",
    code: `from sqlalchemy import create_engine, text, Table, Column, Integer, String, MetaData

engine = create_engine("sqlite:///:memory:")
meta = MetaData()

users = Table("users", meta,
    Column("id", Integer, primary_key=True),
    Column("name", String),
)
meta.create_all(engine)

with engine.begin() as conn:
    conn.execute(users.insert(), [{"name": "Alice"}, {"name": "Bob"}])
    result = conn.execute(users.select().where(users.c.name == "Alice"))
    for row in result:
        print(row)`,
    explanation: "SQLAlchemy Core provides a Pythonic expression language that generates parameterized SQL; it's lighter than the ORM when you want direct control over queries.",
  },
  {
    id: "py-b18-b3-httpx-async",
    language: "python",
    title: "httpx async HTTP client",
    tag: "families",
    code: `import asyncio
import httpx

async def fetch_all(urls: list[str]) -> list[str]:
    async with httpx.AsyncClient() as client:
        tasks = [client.get(url) for url in urls]
        responses = await asyncio.gather(*tasks)
        return [r.text for r in responses]

# httpx also has sync API
with httpx.Client() as client:
    r = client.get("https://httpbin.org/json")
    print(r.status_code)`,
    explanation: "httpx is a modern HTTP client with both sync and async APIs, HTTP/2 support, and a requests-compatible interface — preferred over requests for async contexts.",
  },
  {
    id: "py-b18-b3-trio-nursery",
    language: "python",
    title: "Trio nursery for structured concurrency",
    tag: "families",
    code: `import trio

async def worker(name: str, delay: float):
    await trio.sleep(delay)
    print(f"{name} done")

async def main():
    async with trio.open_nursery() as nursery:
        nursery.start_soon(worker, "fast", 0.1)
        nursery.start_soon(worker, "slow", 0.3)
    print("all done")  # nursery waits for all tasks

trio.run(main)`,
    explanation: "Trio's nursery enforces structured concurrency: all tasks started in a nursery must finish before the nursery block exits, preventing orphaned background tasks.",
  },
  {
    id: "py-b18-b3-celery-task",
    language: "python",
    title: "Celery distributed task queue",
    tag: "families",
    code: `from celery import Celery

app = Celery("tasks", broker="redis://localhost/0")

@app.task
def add(x: int, y: int) -> int:
    return x + y

# Dispatch asynchronously from your app
result = add.delay(4, 6)

# Or with apply_async for more options
result2 = add.apply_async(args=[1, 2], countdown=10)

# Retrieve result (blocks until done)
print(result.get(timeout=30))  # 10`,
    explanation: "Celery distributes Python function calls to worker processes via a message broker; .delay() sends immediately and .apply_async() allows scheduling delays and other options.",
  },
  {
    id: "py-b18-b3-dataclasses-field",
    language: "python",
    title: "dataclasses.field for complex defaults",
    tag: "families",
    code: `from dataclasses import dataclass, field

@dataclass
class Config:
    name: str
    tags: list[str] = field(default_factory=list)
    metadata: dict = field(default_factory=dict, repr=False)
    _cache: dict = field(default_factory=dict, init=False, repr=False)

c1 = Config("app1")
c2 = Config("app2")

c1.tags.append("production")
print(c2.tags)   # []  — separate list per instance`,
    explanation: "dataclasses.field with default_factory creates a fresh object per instance; init=False excludes the field from __init__ (useful for internal caches); repr=False hides it from str().",
  },
  {
    id: "py-b18-b3-fastapi-dependency",
    language: "python",
    title: "FastAPI dependency injection",
    tag: "families",
    code: `from fastapi import FastAPI, Depends, HTTPException

app = FastAPI()

def get_db():
    db = {"users": [{"id": 1, "name": "Alice"}]}
    try:
        yield db
    finally:
        pass  # close connection here

def verify_token(token: str = "secret"):
    if token != "secret":
        raise HTTPException(status_code=401)
    return token

@app.get("/users/")
async def list_users(db=Depends(get_db), _=Depends(verify_token)):
    return db["users"]`,
    explanation: "FastAPI's Depends() system injects dependencies (DB sessions, auth) into route handlers; dependencies can be generators (yield once for setup/teardown) or plain functions.",
  },

  // --- classes ---
  {
    id: "py-b18-b3-singleton-pattern",
    language: "python",
    title: "Singleton pattern with __new__",
    tag: "classes",
    code: `class Singleton:
    _instance = None

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self, value: int):
        # Called every time, guard with hasattr
        if not hasattr(self, "_initialized"):
            self.value = value
            self._initialized = True

s1 = Singleton(42)
s2 = Singleton(99)
print(s1 is s2)    # True
print(s1.value)    # 42 (not 99)`,
    explanation: "__new__ controls instance creation; returning the same object every time implements Singleton. The _initialized guard prevents __init__ from resetting state on subsequent calls.",
  },
  {
    id: "py-b18-b3-observer-pattern",
    language: "python",
    title: "Observer pattern",
    tag: "classes",
    code: `from typing import Callable

class EventEmitter:
    def __init__(self):
        self._listeners: dict[str, list[Callable]] = {}

    def on(self, event: str, callback: Callable):
        self._listeners.setdefault(event, []).append(callback)

    def emit(self, event: str, *args, **kwargs):
        for cb in self._listeners.get(event, []):
            cb(*args, **kwargs)

emitter = EventEmitter()
emitter.on("data", lambda x: print(f"handler1: {x}"))
emitter.on("data", lambda x: print(f"handler2: {x * 2}"))
emitter.emit("data", 5)
# handler1: 5
# handler2: 10`,
    explanation: "The Observer (EventEmitter) pattern decouples event producers from consumers; on() registers callbacks per event type, and emit() calls all registered handlers.",
  },
  {
    id: "py-b18-b3-proxy-pattern",
    language: "python",
    title: "Proxy pattern with __getattr__",
    tag: "classes",
    code: `class LoggingProxy:
    def __init__(self, target):
        object.__setattr__(self, "_target", target)

    def __getattr__(self, name):
        attr = getattr(object.__getattribute__(self, "_target"), name)
        if callable(attr):
            def logged(*args, **kwargs):
                print(f"Calling {name}({args}, {kwargs})")
                return attr(*args, **kwargs)
            return logged
        return attr

class Calculator:
    def add(self, a, b): return a + b

proxy = LoggingProxy(Calculator())
print(proxy.add(3, 4))
# Calling add((3, 4), {})
# 7`,
    explanation: "__getattr__ is called only when normal attribute lookup fails, making it perfect for proxy objects that wrap another object and intercept method calls.",
  },
  {
    id: "py-b18-b3-strategy-pattern",
    language: "python",
    title: "Strategy pattern with callables",
    tag: "classes",
    code: `from typing import Callable

class Sorter:
    def __init__(self, strategy: Callable[[list], list]):
        self._strategy = strategy

    def sort(self, data: list) -> list:
        return self._strategy(data)

# Strategies as plain functions
def bubble_sort(data: list) -> list:
    d = data[:]
    for i in range(len(d)):
        for j in range(len(d) - i - 1):
            if d[j] > d[j+1]:
                d[j], d[j+1] = d[j+1], d[j]
    return d

sorter = Sorter(strategy=sorted)     # built-in
print(sorter.sort([3, 1, 4, 1, 5])) # [1, 1, 3, 4, 5]

sorter2 = Sorter(strategy=bubble_sort)
print(sorter2.sort([3, 1, 4]))       # [1, 3, 4]`,
    explanation: "In Python the Strategy pattern is naturally expressed by storing a callable; functions, lambdas, and classes with __call__ all work, eliminating the abstract class layer needed in Java/C#.",
  },
  {
    id: "py-b18-b3-mixin-classes",
    language: "python",
    title: "Mixin classes for reusable behavior",
    tag: "classes",
    code: `class JsonMixin:
    def to_json(self) -> str:
        import json
        return json.dumps(self.__dict__)

class ValidationMixin:
    def validate(self) -> bool:
        return all(v is not None for v in self.__dict__.values())

class User(JsonMixin, ValidationMixin):
    def __init__(self, name, email):
        self.name = name
        self.email = email

u = User("Alice", "alice@example.com")
print(u.to_json())    # {"name": "Alice", "email": "alice@example.com"}
print(u.validate())   # True`,
    explanation: "Mixins are small classes that add specific behaviors (serialization, logging, validation) without being base classes; they work through Python's multiple inheritance and MRO.",
  },
  {
    id: "py-b18-b3-context-manager-class",
    language: "python",
    title: "Context manager via class",
    tag: "classes",
    code: `import time

class Timer:
    def __enter__(self):
        self._start = time.perf_counter()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.elapsed = time.perf_counter() - self._start
        print(f"Elapsed: {self.elapsed:.4f}s")
        return False  # don't suppress exceptions

with Timer() as t:
    sum(range(1_000_000))

print(f"Total: {t.elapsed:.4f}s")`,
    explanation: "__enter__ returns the context (self here); __exit__ receives exception info and returns True to suppress exceptions or False/None to propagate them.",
  },
  {
    id: "py-b18-b3-callable-class",
    language: "python",
    title: "__call__ for callable objects",
    tag: "classes",
    code: `class Multiplier:
    def __init__(self, factor: float):
        self.factor = factor
        self.call_count = 0

    def __call__(self, value: float) -> float:
        self.call_count += 1
        return value * self.factor

double = Multiplier(2.0)
print(double(5))    # 10.0
print(double(3))    # 6.0
print(double.call_count)  # 2

# Works with higher-order functions
print(list(map(double, [1, 2, 3])))  # [2.0, 4.0, 6.0]`,
    explanation: "__call__ makes class instances callable like functions, with the benefit of carrying state (accumulated counts, caches, configurations) between invocations.",
  },
  {
    id: "py-b18-b3-repr-str-class",
    language: "python",
    title: "__repr__ vs __str__",
    tag: "classes",
    code: `class Product:
    def __init__(self, name: str, price: float):
        self.name = name
        self.price = price

    def __repr__(self) -> str:
        return f"Product({self.name!r}, {self.price!r})"

    def __str__(self) -> str:
        return f"{self.name}: \${self.price:.2f}"

p = Product("Widget", 9.99)
print(repr(p))   # Product('Widget', 9.99)  — unambiguous
print(str(p))    # Widget: $9.99            — human-friendly
print(f"{p!r}")  # Product('Widget', 9.99)
print(f"{p!s}")  # Widget: $9.99`,
    explanation: "__repr__ should return an unambiguous string ideally usable to recreate the object (eval-able); __str__ is for human consumption. If only __repr__ is defined, str() uses it.",
  },
  {
    id: "py-b18-b3-eq-hash-class",
    language: "python",
    title: "__eq__ and __hash__ contract",
    tag: "classes",
    code: `class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y

    def __eq__(self, other) -> bool:
        if not isinstance(other, Point):
            return NotImplemented
        return self.x == other.x and self.y == other.y

    def __hash__(self) -> int:
        return hash((self.x, self.y))  # consistent with __eq__

p1 = Point(1, 2)
p2 = Point(1, 2)
print(p1 == p2)      # True
print(p1 is p2)      # False
print({p1: "a"}[p2]) # "a" — hash lookup works`,
    explanation: "Objects that compare equal must have the same hash; defining __eq__ without __hash__ sets __hash__ to None making the object unhashable. Always define both together.",
  },
  {
    id: "py-b18-b3-comparison-methods",
    language: "python",
    title: "Rich comparison with @total_ordering",
    tag: "classes",
    code: `from functools import total_ordering

@total_ordering
class Version:
    def __init__(self, major, minor, patch):
        self.v = (major, minor, patch)

    def __eq__(self, other):
        return self.v == other.v

    def __lt__(self, other):
        return self.v < other.v

v1 = Version(1, 2, 3)
v2 = Version(2, 0, 0)
print(v1 < v2)   # True
print(v1 <= v2)  # True (derived)
print(v2 > v1)   # True (derived)
print(sorted([v2, v1]))  # [Version(1,2,3), Version(2,0,0)]`,
    explanation: "@total_ordering derives >, >=, <= from just __eq__ and __lt__, avoiding the tedious repetition of all six comparison methods.",
  },
  {
    id: "py-b18-b3-iterator-class",
    language: "python",
    title: "Custom iterator with __iter__ and __next__",
    tag: "classes",
    code: `class Range:
    def __init__(self, start: int, stop: int, step: int = 1):
        self.current = start
        self.stop = stop
        self.step = step

    def __iter__(self):
        return self  # iterator is its own iterable

    def __next__(self) -> int:
        if self.current >= self.stop:
            raise StopIteration
        val = self.current
        self.current += self.step
        return val

for n in Range(0, 6, 2):
    print(n)  # 0, 2, 4`,
    explanation: "An iterator implements __next__ (returning the next value or raising StopIteration) and __iter__ (returning self); an iterable's __iter__ returns an iterator.",
  },
  {
    id: "py-b18-b3-class-decorator",
    language: "python",
    title: "Class as a decorator",
    tag: "classes",
    code: `import functools

class Retry:
    def __init__(self, times: int = 3):
        self.times = times

    def __call__(self, func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            for attempt in range(1, self.times + 1):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    if attempt == self.times:
                        raise
                    print(f"Attempt {attempt} failed: {e}")
        return wrapper

@Retry(times=3)
def unstable():
    import random
    if random.random() < 0.8:
        raise RuntimeError("failed")
    return "ok"`,
    explanation: "A class with __init__ accepting decorator arguments and __call__ returning the wrapped function works as a parameterized decorator; the instance is the decorator.",
  },
  {
    id: "py-b18-b3-generics-class",
    language: "python",
    title: "Generic class with TypeVar",
    tag: "classes",
    code: `from typing import TypeVar, Generic, Optional

T = TypeVar("T")

class Stack(Generic[T]):
    def __init__(self) -> None:
        self._items: list[T] = []

    def push(self, item: T) -> None:
        self._items.append(item)

    def pop(self) -> T:
        return self._items.pop()

    def peek(self) -> Optional[T]:
        return self._items[-1] if self._items else None

s: Stack[int] = Stack()
s.push(1)
s.push(2)
print(s.pop())   # 2
print(s.peek())  # 1`,
    explanation: "Generic[T] makes a class parameterizable; type checkers enforce that all T-annotated methods use a consistent type, catching errors like pushing a str to a Stack[int].",
  },
];
