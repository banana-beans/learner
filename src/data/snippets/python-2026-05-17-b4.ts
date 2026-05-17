import type { Snippet } from "./types";

export const pythonSnippets20260517B4: Snippet[] = [
  {
    id: "py-b17-b4-heapq-nlargest",
    language: "python",
    title: "heapq.nlargest and nsmallest",
    tag: "snippet",
    code: `import heapq

scores = [34, 78, 12, 99, 56, 43, 88]
top3 = heapq.nlargest(3, scores)
bot3 = heapq.nsmallest(3, scores)
print(top3)  # [99, 88, 78]
print(bot3)  # [12, 34, 43]`,
    explanation: "`heapq.nlargest`/`nsmallest` find top-N elements in O(n log k) time, faster than sorting when k is small.",
  },
  {
    id: "py-b17-b4-collections-counter-subtract",
    language: "python",
    title: "Counter.subtract and set operations",
    tag: "snippet",
    code: `from collections import Counter

a = Counter("aabbcc")
b = Counter("abcd")
a.subtract(b)
print(dict(a))   # {'a': 1, 'b': 1, 'c': 2, 'd': -1}
print(a + b)     # Counter({'c': 2, 'a': 2, 'b': 2})`,
    explanation: "`Counter.subtract` allows negative counts; arithmetic operators (`+`, `-`, `&`, `|`) keep only positive results.",
  },
  {
    id: "py-b17-b4-itertools-accumulate",
    language: "python",
    title: "itertools.accumulate for running totals",
    tag: "snippet",
    code: `import itertools, operator

data = [1, 2, 3, 4, 5]
running_sum = list(itertools.accumulate(data))
running_product = list(itertools.accumulate(data, operator.mul))
print(running_sum)      # [1, 3, 6, 10, 15]
print(running_product)  # [1, 2, 6, 24, 120]`,
    explanation: "`itertools.accumulate` computes prefix reductions; pass a custom function (default is addition) to get prefix products, maxima, etc.",
  },
  {
    id: "py-b17-b4-dict-merge-operator",
    language: "python",
    title: "Dict merge with | operator (PEP 584)",
    tag: "snippet",
    code: `defaults = {"timeout": 30, "retries": 3, "verbose": False}
overrides = {"timeout": 60, "debug": True}

config = defaults | overrides
print(config)
# {'timeout': 60, 'retries': 3, 'verbose': False, 'debug': True}`,
    explanation: "The `|` operator merges two dicts (Python 3.9+), with the right-hand side's values taking precedence for duplicate keys.",
  },
  {
    id: "py-b17-b4-pathlib-suffix-stem",
    language: "python",
    title: "pathlib Path.suffix, stem, and with_suffix",
    tag: "snippet",
    code: `from pathlib import Path

p = Path("/data/report.final.csv")
print(p.suffix)          # .csv
print(p.stem)            # report.final
print(p.suffixes)        # ['.final', '.csv']
print(p.with_suffix(".gz"))  # /data/report.final.gz`,
    explanation: "`suffix` returns only the last extension; `suffixes` returns all; `with_suffix` replaces the last extension cleanly.",
  },
  {
    id: "py-b17-b4-contextlib-redirect-stdout",
    language: "python",
    title: "Capture stdout with contextlib.redirect_stdout",
    tag: "snippet",
    code: `import io
from contextlib import redirect_stdout

buf = io.StringIO()
with redirect_stdout(buf):
    print("hello")
    print("world")

captured = buf.getvalue()
print(repr(captured))  # 'hello\\nworld\\n'`,
    explanation: "`redirect_stdout` temporarily redirects `sys.stdout` to any file-like object, useful for capturing output in tests.",
  },
  {
    id: "py-b17-b4-functools-partial",
    language: "python",
    title: "functools.partial for argument binding",
    tag: "snippet",
    code: `from functools import partial

def power(base, exp):
    return base ** exp

square = partial(power, exp=2)
cube   = partial(power, exp=3)
print(square(5))  # 25
print(cube(3))    # 27`,
    explanation: "`functools.partial` creates a new callable with some arguments pre-filled, acting like currying without changing the original function.",
  },
  {
    id: "py-b17-b4-dataclass-post-init",
    language: "python",
    title: "dataclass __post_init__ validation",
    tag: "snippet",
    code: `from dataclasses import dataclass

@dataclass
class Range:
    start: int
    end: int

    def __post_init__(self):
        if self.start >= self.end:
            raise ValueError(f"start must be < end, got {self.start} >= {self.end}")

r = Range(1, 10)
print(r)  # Range(start=1, end=10)`,
    explanation: "`__post_init__` runs after the auto-generated `__init__`, making it the right place for validation or derived-field computation.",
  },
  {
    id: "py-b17-b4-zip-strict",
    language: "python",
    title: "zip with strict=True (Python 3.10+)",
    tag: "snippet",
    code: `names = ["Alice", "Bob", "Carol"]
scores = [90, 85]

try:
    pairs = list(zip(names, scores, strict=True))
except ValueError as e:
    print(e)  # zip() has argument 2 shorter than argument 1`,
    explanation: "`zip(strict=True)` raises `ValueError` if the iterables have different lengths, preventing silent data truncation.",
  },
  {
    id: "py-b17-b4-string-removeprefix",
    language: "python",
    title: "str.removeprefix and str.removesuffix (Python 3.9+)",
    tag: "snippet",
    code: `url = "https://example.com"
path = "report.csv"

print(url.removeprefix("https://"))  # example.com
print(path.removesuffix(".csv"))     # report
print(path.removesuffix(".txt"))     # report.csv  (unchanged)`,
    explanation: "`removeprefix`/`removesuffix` return the string unchanged if the affix is not found, unlike `lstrip`/`rstrip` which strip characters.",
  },
  {
    id: "py-b17-b4-enumerate-start",
    language: "python",
    title: "enumerate with custom start index",
    tag: "snippet",
    code: `items = ["alpha", "beta", "gamma"]

for i, item in enumerate(items, start=1):
    print(f"{i}. {item}")
# 1. alpha
# 2. beta
# 3. gamma`,
    explanation: "`enumerate(iterable, start=N)` begins counting at N instead of 0, eliminating manual offset arithmetic.",
  },
  {
    id: "py-b17-b4-typing-overload",
    language: "python",
    title: "@overload for different return types by argument",
    tag: "snippet",
    code: `from typing import overload

@overload
def parse(x: str) -> list[str]: ...
@overload
def parse(x: bytes) -> list[bytes]: ...

def parse(x):
    return x.split()

result: list[str] = parse("hello world")`,
    explanation: "`@overload` lets type checkers infer the correct return type based on overloaded signatures without changing runtime behavior.",
  },
  {
    id: "py-b17-b4-match-sequence",
    language: "python",
    title: "Structural pattern matching on sequences",
    tag: "snippet",
    code: `def process(cmd):
    match cmd.split():
        case ["quit"]:
            return "quit"
        case ["go", direction]:
            return f"moving {direction}"
        case ["go", direction, speed]:
            return f"moving {direction} at {speed}"
        case _:
            return "unknown"

print(process("go north fast"))  # moving north at fast`,
    explanation: "Sequence patterns in `match` destructure lists/tuples by length and position, with captures bound as local variables.",
  },
  {
    id: "py-b17-b4-generator-expression-sum",
    language: "python",
    title: "Generator expressions in function calls",
    tag: "snippet",
    code: `data = [1, -2, 3, -4, 5]

total_pos = sum(x for x in data if x > 0)
max_abs   = max(abs(x) for x in data)
any_neg   = any(x < 0 for x in data)

print(total_pos, max_abs, any_neg)  # 9 5 True`,
    explanation: "Passing a generator expression directly to `sum`, `max`, `any`, etc. avoids building an intermediate list, saving memory.",
  },
  {
    id: "py-b17-b4-slots-memory",
    language: "python",
    title: "__slots__ reduces per-instance memory",
    tag: "snippet",
    code: `import sys

class WithDict:
    def __init__(self, x, y): self.x = x; self.y = y

class WithSlots:
    __slots__ = ("x", "y")
    def __init__(self, x, y): self.x = x; self.y = y

print(sys.getsizeof(WithDict(1,2).__dict__))   # ~232 bytes
print(sys.getsizeof(WithSlots(1,2)))           # ~56 bytes`,
    explanation: "`__slots__` removes the per-instance `__dict__`, cutting memory by ~60–80% when many instances are created.",
  },
  {
    id: "py-b17-b4-abc-register",
    language: "python",
    title: "ABC.register for virtual subclassing",
    tag: "snippet",
    code: `from abc import ABC, abstractmethod

class Drawable(ABC):
    @abstractmethod
    def draw(self): ...

class OldWidget:          # third-party, can't subclass
    def draw(self): print("OldWidget.draw")

Drawable.register(OldWidget)
w = OldWidget()
print(isinstance(w, Drawable))  # True`,
    explanation: "`ABC.register` declares a class as a virtual subclass without inheritance, making `isinstance` checks pass for legacy or third-party classes.",
  },
  {
    id: "py-b17-b4-contextmanager-value",
    language: "python",
    title: "@contextmanager yielding a value",
    tag: "snippet",
    code: `from contextlib import contextmanager
import time

@contextmanager
def timer(label):
    start = time.perf_counter()
    yield
    elapsed = time.perf_counter() - start
    print(f"{label}: {elapsed:.4f}s")

with timer("sorting"):
    data = sorted(range(10_000), reverse=True)`,
    explanation: "`@contextmanager` functions yield once; code before the yield is `__enter__`, code after (in `finally`) is `__exit__`.",
  },
  {
    id: "py-b17-b4-tuple-unpacking-star",
    language: "python",
    title: "Extended unpacking with star expression",
    tag: "snippet",
    code: `first, *middle, last = [10, 20, 30, 40, 50]
print(first)   # 10
print(middle)  # [20, 30, 40]
print(last)    # 50

head, *tail = range(5)
print(head, tail)  # 0 [1, 2, 3, 4]`,
    explanation: "The starred variable in unpacking greedily captures all remaining items as a list, usable at any position.",
  },
  {
    id: "py-b17-b4-dict-setdefault",
    language: "python",
    title: "dict.setdefault to build grouped dicts",
    tag: "snippet",
    code: `words = ["apple", "ant", "banana", "bear", "cherry"]
grouped = {}
for word in words:
    grouped.setdefault(word[0], []).append(word)

print(grouped)
# {'a': ['apple', 'ant'], 'b': ['banana', 'bear'], 'c': ['cherry']}`,
    explanation: "`setdefault(key, default)` inserts the default only if the key is absent and returns the (possibly existing) value, enabling one-liner group accumulation.",
  },
  {
    id: "py-b17-b4-class-method-factory",
    language: "python",
    title: "@classmethod as alternative constructor",
    tag: "snippet",
    code: `class Color:
    def __init__(self, r, g, b):
        self.r, self.g, self.b = r, g, b

    @classmethod
    def from_hex(cls, hex_str):
        h = hex_str.lstrip("#")
        return cls(int(h[0:2],16), int(h[2:4],16), int(h[4:6],16))

c = Color.from_hex("#1a2b3c")
print(c.r, c.g, c.b)  # 26 43 60`,
    explanation: "`@classmethod` receives the class as first argument, making it the idiomatic way to add named constructors that work correctly with subclasses.",
  },
  {
    id: "py-b17-b4-understanding-gil",
    language: "python",
    title: "GIL limits CPU-bound thread parallelism",
    tag: "understanding",
    code: `import threading, time

def count(n):
    while n > 0: n -= 1

t1 = threading.Thread(target=count, args=(10_000_000,))
t2 = threading.Thread(target=count, args=(10_000_000,))
start = time.perf_counter()
t1.start(); t2.start(); t1.join(); t2.join()
print(f"threaded: {time.perf_counter()-start:.2f}s")
# Often slower than sequential due to GIL contention`,
    explanation: "CPython's GIL ensures only one thread executes Python bytecode at a time; use `multiprocessing` or async I/O to escape this for CPU-bound work.",
  },
  {
    id: "py-b17-b4-understanding-name-mangling",
    language: "python",
    title: "Name mangling with double underscore prefix",
    tag: "understanding",
    code: `class Base:
    def __init__(self):
        self.__x = 42       # becomes _Base__x

class Child(Base):
    def show(self):
        # self.__x → AttributeError (looks for _Child__x)
        print(self._Base__x)  # 42 — explicit mangled name

c = Child()
c.show()`,
    explanation: "Python mangles `__attr` to `_ClassName__attr` to prevent accidental override in subclasses; it's not truly private but discourages casual external access.",
  },
  {
    id: "py-b17-b4-understanding-mro-c3",
    language: "python",
    title: "Method Resolution Order uses C3 linearisation",
    tag: "understanding",
    code: `class A: pass
class B(A): pass
class C(A): pass
class D(B, C): pass

print([c.__name__ for c in D.__mro__])
# ['D', 'B', 'C', 'A', 'object']`,
    explanation: "Python's C3 MRO guarantees that in multiple inheritance every class appears after all its subclasses and preserves the order given in each class definition.",
  },
  {
    id: "py-b17-b4-understanding-descriptors",
    language: "python",
    title: "Data vs non-data descriptors",
    tag: "understanding",
    code: `class DataDescriptor:
    def __set_name__(self, owner, name): self.name = name
    def __get__(self, obj, objtype=None):
        return obj.__dict__.get(self.name)
    def __set__(self, obj, value):
        obj.__dict__[self.name] = value  # data descriptor takes priority

class MyClass:
    x = DataDescriptor()

m = MyClass()
m.x = 10
print(m.x)  # 10`,
    explanation: "A data descriptor (defines `__set__`) takes priority over instance `__dict__`; a non-data descriptor (only `__get__`) is overridden by instance attributes.",
  },
  {
    id: "py-b17-b4-understanding-generator-close",
    language: "python",
    title: "Generator .close() injects GeneratorExit",
    tag: "understanding",
    code: `def gen():
    try:
        for i in range(100):
            yield i
    except GeneratorExit:
        print("cleanup on close")

g = gen()
print(next(g))  # 0
print(next(g))  # 1
g.close()       # prints "cleanup on close"`,
    explanation: "Calling `.close()` throws `GeneratorExit` at the yield point, allowing the generator to run `finally` blocks for resource cleanup.",
  },
  {
    id: "py-b17-b4-understanding-weakref",
    language: "python",
    title: "weakref prevents reference cycles from leaking",
    tag: "understanding",
    code: `import weakref

class Node:
    def __init__(self, val): self.val = val

n = Node(42)
ref = weakref.ref(n)
print(ref())   # <Node ...>
del n
print(ref())   # None  — GC collected it`,
    explanation: "Weak references don't prevent garbage collection; they're essential for caches and parent-child back-references that would otherwise create reference cycles.",
  },
  {
    id: "py-b17-b4-understanding-exception-group",
    language: "python",
    title: "ExceptionGroup and except* (Python 3.11+)",
    tag: "understanding",
    code: `def risky():
    raise ExceptionGroup("multi", [
        ValueError("bad value"),
        TypeError("bad type"),
    ])

try:
    risky()
except* ValueError as eg:
    print("caught values:", eg.exceptions)
except* TypeError as eg:
    print("caught types:", eg.exceptions)`,
    explanation: "`ExceptionGroup` bundles multiple exceptions; `except*` handles only the matching sub-exceptions, letting others propagate — designed for `asyncio.TaskGroup`.",
  },
  {
    id: "py-b17-b4-structures-namedtuple-defaults",
    language: "python",
    title: "namedtuple with defaults",
    tag: "structures",
    code: `from collections import namedtuple

Point = namedtuple("Point", ["x", "y", "z"], defaults=[0])
p2d = Point(1, 2)
p3d = Point(1, 2, 3)
print(p2d)  # Point(x=1, y=2, z=0)
print(p3d)  # Point(x=1, y=2, z=3)`,
    explanation: "`defaults` fills trailing fields right-to-left, letting you define optional fields without subclassing.",
  },
  {
    id: "py-b17-b4-structures-deque-rotate",
    language: "python",
    title: "deque.rotate for cyclic shift",
    tag: "structures",
    code: `from collections import deque

d = deque([1, 2, 3, 4, 5])
d.rotate(2)
print(d)   # deque([4, 5, 1, 2, 3])
d.rotate(-1)
print(d)   # deque([5, 1, 2, 3, 4])`,
    explanation: "`rotate(n)` moves the last n items to the front (positive) or the first n items to the back (negative) in O(k) time.",
  },
  {
    id: "py-b17-b4-structures-ordereddict-move",
    language: "python",
    title: "OrderedDict.move_to_end for LRU-like access",
    tag: "structures",
    code: `from collections import OrderedDict

od = OrderedDict.fromkeys("abcde")
od.move_to_end("b")          # move 'b' to end
od.move_to_end("d", last=False)  # move 'd' to front
print(list(od.keys()))  # ['d', 'a', 'c', 'e', 'b']`,
    explanation: "`move_to_end` repositions a key without reinserting it, making `OrderedDict` efficient as an LRU cache backbone.",
  },
  {
    id: "py-b17-b4-structures-chainmap",
    language: "python",
    title: "ChainMap for layered configuration",
    tag: "structures",
    code: `from collections import ChainMap

defaults  = {"color": "blue",  "size": "M"}
env_vars  = {"size": "L"}
cli_args  = {"color": "red"}

config = ChainMap(cli_args, env_vars, defaults)
print(config["color"])  # red   (cli wins)
print(config["size"])   # L     (env wins over default)`,
    explanation: "`ChainMap` searches mappings in order without copying, so it reflects updates to underlying dicts and supports scoped variable lookup.",
  },
  {
    id: "py-b17-b4-structures-heap-push-pop",
    language: "python",
    title: "heapq as a min-heap priority queue",
    tag: "structures",
    code: `import heapq

pq = []
heapq.heappush(pq, (3, "low"))
heapq.heappush(pq, (1, "urgent"))
heapq.heappush(pq, (2, "normal"))

while pq:
    priority, task = heapq.heappop(pq)
    print(priority, task)
# 1 urgent  2 normal  3 low`,
    explanation: "Python's `heapq` is a min-heap; store tuples `(priority, item)` and the lowest priority value is always popped first.",
  },
  {
    id: "py-b17-b4-structures-bisect-insort",
    language: "python",
    title: "bisect.insort maintains sorted order",
    tag: "structures",
    code: `import bisect

data = [1, 3, 5, 7, 9]
bisect.insort(data, 4)
bisect.insort(data, 6)
print(data)  # [1, 3, 4, 5, 6, 7, 9]`,
    explanation: "`bisect.insort` finds the insertion point with binary search and inserts in O(log n) search + O(n) shift — keep short lists sorted cheaply.",
  },
  {
    id: "py-b17-b4-structures-array-module",
    language: "python",
    title: "array module for typed homogeneous arrays",
    tag: "structures",
    code: `import array, sys

lst = list(range(10_000))
arr = array.array("i", range(10_000))

print(sys.getsizeof(lst))  # ~85,176 bytes
print(sys.getsizeof(arr))  # ~40,060 bytes`,
    explanation: "`array.array` stores elements as C primitives with no boxing overhead — 2–4× smaller than a list for numeric data.",
  },
  {
    id: "py-b17-b4-caveats-mutable-default-arg",
    language: "python",
    title: "Mutable default argument is shared across calls",
    tag: "caveats",
    code: `def append_to(item, lst=[]):
    lst.append(item)
    return lst

print(append_to(1))   # [1]
print(append_to(2))   # [1, 2]  ← shared!

def safe_append(item, lst=None):
    if lst is None: lst = []
    lst.append(item)
    return lst`,
    explanation: "Default argument values are evaluated once at function definition time; mutable defaults like `[]` or `{}` persist between calls — use `None` as a sentinel instead.",
  },
  {
    id: "py-b17-b4-caveats-late-binding-closure",
    language: "python",
    title: "Late-binding closures capture variable by reference",
    tag: "caveats",
    code: `funcs = [lambda: i for i in range(5)]
print([f() for f in funcs])  # [4, 4, 4, 4, 4]

# Fix: bind i at creation time
funcs2 = [lambda i=i: i for i in range(5)]
print([f() for f in funcs2])  # [0, 1, 2, 3, 4]`,
    explanation: "Closures capture variables, not values; by the time lambdas run, `i` is 4. Use a default argument `i=i` to snapshot the value at lambda creation.",
  },
  {
    id: "py-b17-b4-caveats-float-equality",
    language: "python",
    title: "Float arithmetic is not exact",
    tag: "caveats",
    code: `import math

print(0.1 + 0.2 == 0.3)          # False
print(0.1 + 0.2)                 # 0.30000000000000004
print(math.isclose(0.1+0.2, 0.3))  # True

from decimal import Decimal
print(Decimal("0.1") + Decimal("0.2") == Decimal("0.3"))  # True`,
    explanation: "IEEE 754 floating-point cannot represent most decimals exactly; use `math.isclose` for comparisons and `decimal.Decimal` for exact arithmetic.",
  },
  {
    id: "py-b17-b4-caveats-class-variable-instance",
    language: "python",
    title: "Class variable vs instance variable shadowing",
    tag: "caveats",
    code: `class Counter:
    count = 0                   # class variable

    def increment(self):
        self.count += 1         # creates an instance variable!

c1 = Counter()
c1.increment()
print(c1.count)        # 1
print(Counter.count)   # 0  ← class variable unchanged`,
    explanation: "`self.count += 1` reads the class variable but writes to the instance's `__dict__`, shadowing the class variable. Use `Counter.count += 1` to mutate the class variable.",
  },
  {
    id: "py-b17-b4-caveats-is-string-interning",
    language: "python",
    title: "String interning makes some `is` comparisons true",
    tag: "caveats",
    code: `a = "hello"
b = "hello"
print(a is b)   # True  (interned)

c = "hello world"
d = "hello world"
print(c is d)   # True in CPython (implementation detail)

e = "".join(["h","e","l","l","o"])
print(e is a)   # False — runtime-built string not interned`,
    explanation: "CPython interns short strings and identifiers at compile time; never rely on `is` for string equality — it's an implementation detail that can change.",
  },
  {
    id: "py-b17-b4-caveats-iteration-deletion",
    language: "python",
    title: "Modifying a list while iterating skips elements",
    tag: "caveats",
    code: `data = [1, 2, 3, 4, 5]
for x in data:
    if x % 2 == 0:
        data.remove(x)    # BAD: skips elements
print(data)  # [1, 3, 5] ← happens to work here but is fragile

safe = [x for x in data if x % 2 != 0]  # preferred`,
    explanation: "Mutating a list's length while iterating shifts indices and causes elements to be skipped; filter with a list comprehension instead.",
  },
  {
    id: "py-b17-b4-caveats-exception-scope",
    language: "python",
    title: "Exception variable deleted after except block",
    tag: "caveats",
    code: `try:
    raise ValueError("oops")
except ValueError as e:
    msg = str(e)   # save before block exits

# print(e)  # NameError: e is deleted after except block
print(msg)  # "oops" — safe to use`,
    explanation: "Python deletes the exception variable `e` at the end of the `except` block to break reference cycles; save any information you need before the block exits.",
  },
  {
    id: "py-b17-b4-types-literal",
    language: "python",
    title: "typing.Literal for exact value constraints",
    tag: "types",
    code: `from typing import Literal

Direction = Literal["north", "south", "east", "west"]

def move(direction: Direction) -> None:
    print(f"Moving {direction}")

move("north")   # OK
# move("up")   # type error: not in Literal`,
    explanation: "`Literal` restricts a parameter to a fixed set of values, giving type checkers the information to flag invalid constants at static analysis time.",
  },
  {
    id: "py-b17-b4-types-typeguard",
    language: "python",
    title: "TypeGuard for custom type narrowing",
    tag: "types",
    code: `from typing import TypeGuard

def is_str_list(val: list[object]) -> TypeGuard[list[str]]:
    return all(isinstance(x, str) for x in val)

data: list[object] = ["a", "b"]
if is_str_list(data):
    # mypy knows data is list[str] here
    print(data[0].upper())`,
    explanation: "`TypeGuard[T]` as a return type tells the type checker that the function narrows the argument to `T` in the `if` branch.",
  },
  {
    id: "py-b17-b4-types-protocol-callable",
    language: "python",
    title: "Protocol with __call__ for callable types",
    tag: "types",
    code: `from typing import Protocol

class Transformer(Protocol):
    def __call__(self, x: int) -> int: ...

def apply(value: int, fn: Transformer) -> int:
    return fn(value)

print(apply(5, lambda x: x * 2))   # 10`,
    explanation: "A `Protocol` with `__call__` describes any callable matching that signature without inheritance, enabling structural subtyping for functions and callable objects.",
  },
  {
    id: "py-b17-b4-types-final",
    language: "python",
    title: "typing.Final prevents reassignment",
    tag: "types",
    code: `from typing import Final

MAX_SIZE: Final = 100
# MAX_SIZE = 200   # type checker error

class Config:
    HOST: Final = "localhost"
    PORT: Final[int] = 8080`,
    explanation: "`Final` tells type checkers that a variable must not be reassigned after its definition; it's checked statically and does not enforce at runtime.",
  },
  {
    id: "py-b17-b4-types-typevar-constraints",
    language: "python",
    title: "TypeVar with constraints (not bounds)",
    tag: "types",
    code: `from typing import TypeVar

# T must be exactly int or str, not a subtype
T = TypeVar("T", int, str)

def double(x: T) -> T:
    return x + x  # type: ignore[operator]

print(double(3))      # 6
print(double("ab"))   # abab`,
    explanation: "A constrained `TypeVar` allows only the listed exact types (not subclasses), while a bounded TypeVar (`bound=`) also allows subclasses.",
  },
  {
    id: "py-b17-b4-types-unpack-typeddict",
    language: "python",
    title: "Unpack[TypedDict] for **kwargs typing",
    tag: "types",
    code: `from typing import TypedDict, Unpack

class Options(TypedDict, total=False):
    timeout: int
    retries: int

def connect(host: str, **opts: Unpack[Options]) -> None:
    print(host, opts)

connect("example.com", timeout=5, retries=3)`,
    explanation: "`Unpack[TypedDict]` in `**kwargs` annotations lets type checkers validate keyword arguments against the TypedDict's field names and types.",
  },
  {
    id: "py-b17-b4-types-runtime-checkable",
    language: "python",
    title: "@runtime_checkable Protocol with isinstance",
    tag: "types",
    code: `from typing import Protocol, runtime_checkable

@runtime_checkable
class Sized(Protocol):
    def __len__(self) -> int: ...

print(isinstance([], Sized))      # True
print(isinstance({}, Sized))      # True
print(isinstance(42, Sized))      # False`,
    explanation: "`@runtime_checkable` allows `isinstance` checks against a Protocol based on method presence; only checks existence, not signatures.",
  },
  {
    id: "py-b17-b4-families-functools-cache",
    language: "python",
    title: "functools.cache (unbounded lru_cache)",
    tag: "families",
    code: `from functools import cache

@cache
def fib(n: int) -> int:
    if n < 2: return n
    return fib(n-1) + fib(n-2)

print(fib(50))  # 12586269025
print(fib.cache_info())`,
    explanation: "`functools.cache` is equivalent to `@lru_cache(maxsize=None)` — it caches all calls with no eviction, suitable when the input space is bounded.",
  },
  {
    id: "py-b17-b4-families-itertools-chain-from-iterable",
    language: "python",
    title: "itertools.chain.from_iterable to flatten one level",
    tag: "families",
    code: `import itertools

nested = [[1, 2], [3, 4], [5, 6]]
flat = list(itertools.chain.from_iterable(nested))
print(flat)  # [1, 2, 3, 4, 5, 6]

# Equivalent but lazily:
words = [["hello", "world"], ["foo"]]
chars = list(itertools.chain.from_iterable(words))`,
    explanation: "`chain.from_iterable` takes a single iterable of iterables and flattens one level lazily, equivalent to `chain(*iterable)` without unpacking.",
  },
  {
    id: "py-b17-b4-families-re-module",
    language: "python",
    title: "re.compile, search, findall, sub",
    tag: "families",
    code: `import re

pattern = re.compile(r"\\b\\d{3}-\\d{4}\\b")
text = "Call 555-1234 or 555-5678 for info."

print(pattern.findall(text))          # ['555-1234', '555-5678']
print(pattern.sub("XXX-XXXX", text))  # Call XXX-XXXX or XXX-XXXX for info.`,
    explanation: "`re.compile` pre-compiles a pattern for reuse; `findall` returns all non-overlapping matches; `sub` replaces all matches.",
  },
  {
    id: "py-b17-b4-families-pathlib-ops",
    language: "python",
    title: "pathlib common operations overview",
    tag: "families",
    code: `from pathlib import Path

p = Path("data") / "report" / "2024.csv"
print(p.parent)   # data/report
print(p.name)     # 2024.csv
print(p.stem)     # 2024
p.parent.mkdir(parents=True, exist_ok=True)
# p.write_text("..."); p.read_text()`,
    explanation: "`pathlib.Path` uses `/` for joining, exposes `parent`/`name`/`stem`/`suffix` as attributes, and provides `mkdir`, `read_text`, `write_text` for I/O.",
  },
  {
    id: "py-b17-b4-families-io-stringio",
    language: "python",
    title: "io.StringIO and io.BytesIO as in-memory files",
    tag: "families",
    code: `import io, csv

output = io.StringIO()
writer = csv.writer(output)
writer.writerows([["name","age"],["Alice",30],["Bob",25]])
csv_text = output.getvalue()
print(csv_text)`,
    explanation: "`StringIO`/`BytesIO` implement the full file interface in memory, making them drop-in replacements for real files in tests or when building strings incrementally.",
  },
  {
    id: "py-b17-b4-families-subprocess-run",
    language: "python",
    title: "subprocess.run for external commands",
    tag: "families",
    code: `import subprocess

result = subprocess.run(
    ["ls", "-la"],
    capture_output=True,
    text=True,
    check=True,
)
print(result.stdout[:80])`,
    explanation: "`subprocess.run` with `capture_output=True, text=True` captures stdout/stderr as strings; `check=True` raises `CalledProcessError` on non-zero exit.",
  },
  {
    id: "py-b17-b4-classes-property-setter",
    language: "python",
    title: "@property with getter and setter",
    tag: "classes",
    code: `class Temperature:
    def __init__(self, celsius=0.0):
        self._celsius = celsius

    @property
    def fahrenheit(self):
        return self._celsius * 9/5 + 32

    @fahrenheit.setter
    def fahrenheit(self, value):
        self._celsius = (value - 32) * 5/9

t = Temperature(100)
print(t.fahrenheit)   # 212.0
t.fahrenheit = 32
print(t._celsius)     # 0.0`,
    explanation: "`@property` turns a method into a computed attribute; `@<name>.setter` lets you intercept assignments with validation or conversion logic.",
  },
  {
    id: "py-b17-b4-classes-repr-str",
    language: "python",
    title: "__repr__ vs __str__",
    tag: "classes",
    code: `class Vector:
    def __init__(self, x, y):
        self.x, self.y = x, y
    def __repr__(self): return f"Vector({self.x!r}, {self.y!r})"
    def __str__(self):  return f"<{self.x}, {self.y}>"

v = Vector(1, 2)
print(str(v))    # <1, 2>
print(repr(v))   # Vector(1, 2)
print([v])       # [Vector(1, 2)]  — list uses repr`,
    explanation: "`__repr__` targets developers (should be unambiguous and ideally eval-able); `__str__` targets users. Containers like lists call `__repr__` on their elements.",
  },
  {
    id: "py-b17-b4-classes-slots-inheritance",
    language: "python",
    title: "__slots__ with inheritance",
    tag: "classes",
    code: `class Base:
    __slots__ = ("x",)
    def __init__(self, x): self.x = x

class Child(Base):
    __slots__ = ("y",)   # adds 'y'; 'x' comes from Base
    def __init__(self, x, y):
        super().__init__(x)
        self.y = y

c = Child(1, 2)
print(c.x, c.y)   # 1 2
print(hasattr(c, "__dict__"))  # False`,
    explanation: "Each class in the hierarchy must declare its own `__slots__`; if any class omits `__slots__` a `__dict__` is created and the memory saving is lost.",
  },
  {
    id: "py-b17-b4-classes-eq-hash",
    language: "python",
    title: "__eq__ and __hash__ contract",
    tag: "classes",
    code: `class Point:
    def __init__(self, x, y): self.x, self.y = x, y
    def __eq__(self, other): return (self.x, self.y) == (other.x, other.y)
    def __hash__(self): return hash((self.x, self.y))

p1 = Point(1, 2)
p2 = Point(1, 2)
print(p1 == p2)          # True
print(p1 is p2)          # False
print({p1, p2})          # {Point} — deduplicated`,
    explanation: "If you define `__eq__` you must also define `__hash__` (Python sets it to `None` otherwise); hash equal objects identically so they work in sets and dict keys.",
  },
  {
    id: "py-b17-b4-classes-context-manager-class",
    language: "python",
    title: "Class-based context manager",
    tag: "classes",
    code: `class ManagedFile:
    def __init__(self, path, mode="r"):
        self.path, self.mode = path, mode

    def __enter__(self):
        self.file = open(self.path, self.mode)
        return self.file

    def __exit__(self, exc_type, exc_val, tb):
        self.file.close()
        return False   # don't suppress exceptions

with ManagedFile("/etc/hostname") as f:
    print(f.read().strip())`,
    explanation: "`__enter__` should return the resource; `__exit__` receives exception info and returns `True` to suppress or `False` to propagate the exception.",
  },
  {
    id: "py-b17-b4-classes-init-subclass",
    language: "python",
    title: "__init_subclass__ for automatic registration",
    tag: "classes",
    code: `class Plugin:
    _registry: dict = {}

    def __init_subclass__(cls, name, **kwargs):
        super().__init_subclass__(**kwargs)
        Plugin._registry[name] = cls

class CsvPlugin(Plugin, name="csv"): pass
class JsonPlugin(Plugin, name="json"): pass

print(Plugin._registry)
# {'csv': <class 'CsvPlugin'>, 'json': <class 'JsonPlugin'>}`,
    explanation: "`__init_subclass__` is called on the parent whenever a subclass is defined, enabling plugin registries without metaclasses.",
  },
  {
    id: "py-b17-b4-classes-abstract-property",
    language: "python",
    title: "abstractmethod with @property",
    tag: "classes",
    code: `from abc import ABC, abstractmethod

class Shape(ABC):
    @property
    @abstractmethod
    def area(self) -> float: ...

class Circle(Shape):
    def __init__(self, r): self.r = r

    @property
    def area(self) -> float:
        import math; return math.pi * self.r ** 2

print(Circle(5).area)   # 78.53...`,
    explanation: "Combine `@property` and `@abstractmethod` (in that order) to require subclasses to implement the attribute as a property, not just any method.",
  },
  {
    id: "py-b17-b4-snippet-walrus-readline",
    language: "python",
    title: "Walrus operator to read lines until empty",
    tag: "snippet",
    code: `import io

data = io.StringIO("line1\\nline2\\nline3\\n")
while chunk := data.readline():
    print(repr(chunk))
# 'line1\\n'  'line2\\n'  'line3\\n'`,
    explanation: "The walrus operator in a `while` condition reads and assigns in one step, looping until the value is falsy (empty string from EOF).",
  },
  {
    id: "py-b17-b4-snippet-sorted-key-lambda",
    language: "python",
    title: "sorted with multi-key lambda",
    tag: "snippet",
    code: `people = [
    {"name": "Alice", "age": 30},
    {"name": "Bob",   "age": 25},
    {"name": "Carol", "age": 30},
]
result = sorted(people, key=lambda p: (p["age"], p["name"]))
for p in result: print(p["age"], p["name"])
# 25 Bob  30 Alice  30 Carol`,
    explanation: "A tuple key in `sorted` produces lexicographic ordering — age first, then name as a tiebreaker, without a second call to sort.",
  },
  {
    id: "py-b17-b4-snippet-dict-comprehension-invert",
    language: "python",
    title: "Invert a dict with dict comprehension",
    tag: "snippet",
    code: `original = {"a": 1, "b": 2, "c": 3}
inverted = {v: k for k, v in original.items()}
print(inverted)  # {1: 'a', 2: 'b', 3: 'c'}`,
    explanation: "A dict comprehension over `.items()` swaps keys and values in one expression; duplicate values will silently overwrite each other.",
  },
  {
    id: "py-b17-b4-snippet-async-timeout",
    language: "python",
    title: "asyncio.timeout context manager (Python 3.11+)",
    tag: "snippet",
    code: `import asyncio

async def slow():
    await asyncio.sleep(5)

async def main():
    try:
        async with asyncio.timeout(1.0):
            await slow()
    except TimeoutError:
        print("timed out!")

asyncio.run(main())`,
    explanation: "`asyncio.timeout` cancels the enclosed coroutine if it exceeds the deadline, raising `TimeoutError`; it supersedes `asyncio.wait_for` for most uses.",
  },
  {
    id: "py-b17-b4-snippet-dataclass-field-factory",
    language: "python",
    title: "dataclass field with default_factory",
    tag: "snippet",
    code: `from dataclasses import dataclass, field

@dataclass
class Graph:
    nodes: list = field(default_factory=list)
    edges: dict = field(default_factory=dict)

g1 = Graph()
g2 = Graph()
g1.nodes.append(1)
print(g1.nodes, g2.nodes)  # [1] []  — separate lists`,
    explanation: "`field(default_factory=...)` calls the factory for each new instance, avoiding the shared-mutable-default bug that plain `nodes: list = []` would cause.",
  },
  {
    id: "py-b17-b4-snippet-match-guard",
    language: "python",
    title: "Match case with guard clause",
    tag: "snippet",
    code: `def classify(n):
    match n:
        case x if x < 0:
            return "negative"
        case 0:
            return "zero"
        case x if x % 2 == 0:
            return "positive even"
        case _:
            return "positive odd"

print(classify(-3), classify(0), classify(4), classify(7))`,
    explanation: "A `case` guard (`if condition`) adds a boolean check after the pattern match; the case only fires if both the pattern and guard are true.",
  },
  {
    id: "py-b17-b4-snippet-type-alias",
    language: "python",
    title: "type alias statement (Python 3.12+)",
    tag: "snippet",
    code: `type Vector = list[float]
type Matrix = list[Vector]

def dot(a: Vector, b: Vector) -> float:
    return sum(x * y for x, y in zip(a, b))

v1: Vector = [1.0, 2.0, 3.0]
v2: Vector = [4.0, 5.0, 6.0]
print(dot(v1, v2))   # 32.0`,
    explanation: "The `type` statement (Python 3.12) creates a proper `TypeAliasType` with lazy evaluation and is preferred over `TypeAlias` from `typing`.",
  },
  {
    id: "py-b17-b4-snippet-frozenset-ops",
    language: "python",
    title: "frozenset as dict key and set element",
    tag: "snippet",
    code: `cache: dict[frozenset[int], int] = {}

def sum_of_set(s: frozenset[int]) -> int:
    if s not in cache:
        cache[s] = sum(s)
    return cache[s]

fs = frozenset([1, 2, 3])
print(sum_of_set(fs))   # 6
print(sum_of_set(fs))   # 6 (cached)`,
    explanation: "`frozenset` is an immutable, hashable set, making it usable as a dict key or as an element of another set — `set` cannot be used this way.",
  },
  {
    id: "py-b17-b4-snippet-complex-numbers",
    language: "python",
    title: "Python built-in complex numbers",
    tag: "snippet",
    code: `z1 = 3 + 4j
z2 = 1 - 2j

print(abs(z1))          # 5.0  (magnitude)
print(z1 + z2)          # (4+2j)
print(z1 * z2)          # (11-2j)
print(z1.real, z1.imag) # 3.0 4.0
print(z1.conjugate())   # (3-4j)`,
    explanation: "Python natively supports complex numbers with `j` notation; `abs` returns the magnitude and arithmetic operators work element-wise on real and imaginary parts.",
  },
  {
    id: "py-b17-b4-snippet-min-max-key",
    language: "python",
    title: "min/max with key function",
    tag: "snippet",
    code: `words = ["banana", "fig", "apple", "date"]
print(min(words, key=len))   # fig
print(max(words, key=len))   # banana

records = [{"name":"A","score":90},{"name":"B","score":75}]
best = max(records, key=lambda r: r["score"])
print(best["name"])   # A`,
    explanation: "`min`/`max` accept a `key` function just like `sorted`, finding the element with the minimum/maximum key value without modifying the input.",
  },
  {
    id: "py-b17-b4-snippet-unpacking-call",
    language: "python",
    title: "Unpacking in function calls with * and **",
    tag: "snippet",
    code: `def greet(first, last, greeting="Hello"):
    print(f"{greeting}, {first} {last}!")

args   = ("Jane", "Doe")
kwargs = {"greeting": "Hi"}

greet(*args, **kwargs)         # Hi, Jane Doe!
greet(*args)                   # Hello, Jane Doe!`,
    explanation: "`*args` unpacks a sequence into positional arguments and `**kwargs` unpacks a mapping into keyword arguments, enabling flexible call sites.",
  },
  {
    id: "py-b17-b4-snippet-set-comprehension",
    language: "python",
    title: "Set comprehension for deduplication",
    tag: "snippet",
    code: `data = ["Alice", "bob", "ALICE", "Bob", "carol"]
unique_lower = {name.lower() for name in data}
print(unique_lower)  # {'alice', 'bob', 'carol'}`,
    explanation: "A set comprehension `{expr for item in iterable}` applies a transformation and deduplicates in one pass, more readable than `set(map(...))`.",
  },
  {
    id: "py-b17-b4-snippet-global-nonlocal",
    language: "python",
    title: "nonlocal to mutate enclosing scope variable",
    tag: "snippet",
    code: `def make_counter(start=0):
    count = start
    def increment(by=1):
        nonlocal count
        count += by
        return count
    return increment

counter = make_counter(10)
print(counter())    # 11
print(counter(5))   # 16`,
    explanation: "`nonlocal` lets an inner function assign to a variable in the enclosing (non-global) scope; without it, `count += by` would create a new local variable.",
  },
  {
    id: "py-b17-b4-snippet-tuple-immutable",
    language: "python",
    title: "Tuples containing mutable objects",
    tag: "snippet",
    code: `t = ([1, 2], [3, 4])
t[0].append(99)          # OK — modifying the list, not the tuple
print(t)                 # ([1, 2, 99], [3, 4])

try:
    t[0] = [5, 6]        # TypeError
except TypeError as e:
    print(e)`,
    explanation: "Tuple immutability means the references stored in the tuple cannot be replaced, but the objects those references point to can still be mutated.",
  },
  {
    id: "py-b17-b4-snippet-bool-is-int",
    language: "python",
    title: "bool is a subclass of int",
    tag: "snippet",
    code: `print(isinstance(True, int))   # True
print(True + True)             # 2
print(True * 10)               # 10
print(sum([True, False, True, True]))  # 3

# Use this to count truthy values:
data = [0, 1, "", "hi", None, [1]]
count = sum(bool(x) for x in data)
print(count)  # 3`,
    explanation: "`bool` inherits from `int` with `True == 1` and `False == 0`, so boolean values work in arithmetic — useful for counting truthy elements.",
  },
  {
    id: "py-b17-b4-snippet-string-format-spec",
    language: "python",
    title: "Format spec mini-language in f-strings",
    tag: "snippet",
    code: `pi = 3.14159265
n  = 1_234_567

print(f"{pi:.3f}")       # 3.142
print(f"{pi:>10.2f}")    # "      3.14"
print(f"{n:,}")          # 1,234,567
print(f"{n:#010x}")      # 0x0012d687
print(f"{'hi':^10}")     # "    hi    "`,
    explanation: "The format spec after `:` inside `{}` controls width, fill character, alignment, precision, numeric bases, and thousand separators.",
  },
  {
    id: "py-b17-b4-snippet-zip-transpose",
    language: "python",
    title: "zip(*matrix) to transpose a 2D list",
    tag: "snippet",
    code: `matrix = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9],
]
transposed = [list(row) for row in zip(*matrix)]
print(transposed)
# [[1, 4, 7], [2, 5, 8], [3, 6, 9]]`,
    explanation: "`zip(*matrix)` unpacks rows as separate arguments, and `zip` pairs up the corresponding column elements — a one-liner transpose for rectangular matrices.",
  },
  {
    id: "py-b17-b4-understanding-cpython-bytecode",
    language: "python",
    title: "Inspect bytecode with dis module",
    tag: "understanding",
    code: `import dis

def add(a, b):
    return a + b

dis.dis(add)
# LOAD_FAST  'a'
# LOAD_FAST  'b'
# BINARY_OP  +
# RETURN_VALUE`,
    explanation: "CPython compiles functions to bytecode before execution; `dis.dis` shows the opcodes, helping understand performance and optimization opportunities.",
  },
  {
    id: "py-b17-b4-understanding-gc-cycles",
    language: "python",
    title: "gc module detects reference cycles",
    tag: "understanding",
    code: `import gc

class Node:
    def __init__(self, val):
        self.val = val
        self.next = None

a = Node(1)
b = Node(2)
a.next = b
b.next = a   # cycle

del a, b
collected = gc.collect()
print(collected, "unreachable objects collected")`,
    explanation: "CPython's reference counting cannot free cyclic garbage; the cyclic GC (`gc.collect`) traces and breaks reference cycles periodically.",
  },
  {
    id: "py-b17-b4-understanding-import-sys-path",
    language: "python",
    title: "How Python resolves module imports",
    tag: "understanding",
    code: `import sys

# Python searches in this order:
# 1. sys.modules cache (already imported modules)
# 2. Built-in modules (sys, builtins, etc.)
# 3. Each directory in sys.path

print(sys.path[:3])

import importlib
mod = importlib.import_module("json")
print(mod.__file__)`,
    explanation: "`sys.modules` is checked first for every import; on a cache miss Python searches `sys.path` directories in order, stopping at the first match.",
  },
  {
    id: "py-b17-b4-understanding-slots-dict-tradeoff",
    language: "python",
    title: "__slots__ removes __dict__ flexibility",
    tag: "understanding",
    code: `class Rigid:
    __slots__ = ("x", "y")
    def __init__(self, x, y): self.x, self.y = x, y

r = Rigid(1, 2)
try:
    r.z = 3            # AttributeError
except AttributeError as e:
    print(e)

# Cannot monkey-patch or add dynamic attributes`,
    explanation: "The memory savings from `__slots__` come at the cost of losing `__dict__`, so instances cannot have arbitrary attributes assigned at runtime.",
  },
  {
    id: "py-b17-b4-understanding-comprehension-scope",
    language: "python",
    title: "Comprehension variables don't leak (Python 3)",
    tag: "understanding",
    code: `x = "outer"
result = [x for x in range(5)]
print(x)       # "outer"  — comprehension variable didn't leak

# In Python 2 it WOULD have been 4 — this changed in Python 3
print(result)  # [0, 1, 2, 3, 4]`,
    explanation: "List/set/dict comprehensions and generator expressions have their own scope in Python 3; the iteration variable is not visible in the enclosing scope.",
  },
  {
    id: "py-b17-b4-understanding-string-interning2",
    language: "python",
    title: "sys.intern for explicit string interning",
    tag: "understanding",
    code: `import sys

a = sys.intern("long_repeated_key")
b = sys.intern("long_repeated_key")
print(a is b)   # True — same object guaranteed

# Useful for dict keys loaded from large files
data = {sys.intern(line.strip()): True for line in ["key1", "key2"]}`,
    explanation: "`sys.intern` forces two equal strings to share one object, making `is` comparisons O(1) and reducing memory for large repeated string keys.",
  },
  {
    id: "py-b17-b4-caveats-try-else",
    language: "python",
    title: "try/else runs only when no exception was raised",
    tag: "caveats",
    code: `def safe_divide(a, b):
    try:
        result = a / b
    except ZeroDivisionError:
        print("division by zero")
    else:
        print(f"result = {result}")  # only if try succeeded
    finally:
        print("always runs")

safe_divide(10, 2)   # result = 5.0 / always runs
safe_divide(10, 0)   # division by zero / always runs`,
    explanation: "The `else` clause on a `try` block runs only if the `try` body completed without raising an exception — distinct from `finally` which always runs.",
  },
  {
    id: "py-b17-b4-caveats-shallow-copy",
    language: "python",
    title: "list copy() vs copy.deepcopy",
    tag: "caveats",
    code: `import copy

original = [[1, 2], [3, 4]]
shallow  = original.copy()        # or list(original)
deep     = copy.deepcopy(original)

original[0].append(99)
print(shallow[0])  # [1, 2, 99]  — inner list shared!
print(deep[0])     # [1, 2]      — independent copy`,
    explanation: "A shallow copy duplicates the outer container but shares references to inner objects; `deepcopy` recursively copies all nested objects.",
  },
  {
    id: "py-b17-b4-structures-sortedcontainers",
    language: "python",
    title: "SortedList from sortedcontainers",
    tag: "structures",
    code: `from sortedcontainers import SortedList

sl = SortedList([5, 1, 3, 2, 4])
sl.add(0)
print(sl)           # SortedList([0, 1, 2, 3, 4, 5])
print(sl.bisect_left(3))   # 2
sl.remove(3)
print(sl)           # SortedList([0, 1, 2, 4, 5])`,
    explanation: "`SortedList` maintains sorted order on every `add`/`remove` in O(log n), implemented as a list-of-lists for cache efficiency.",
  },
  {
    id: "py-b17-b4-families-logging-module",
    language: "python",
    title: "logging module basic setup",
    tag: "families",
    code: `import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
log = logging.getLogger(__name__)

log.info("starting")
log.warning("low disk space: %s%%", 10)
log.debug("this won't show at INFO level")`,
    explanation: "`logging.basicConfig` configures the root logger; use `getLogger(__name__)` in each module so the logger hierarchy mirrors the package structure.",
  },
  {
    id: "py-b17-b4-families-json-module",
    language: "python",
    title: "json.dumps / json.loads with indent and default",
    tag: "families",
    code: `import json
from datetime import date

def default(obj):
    if isinstance(obj, date):
        return obj.isoformat()
    raise TypeError(f"not serializable: {type(obj)}")

data = {"name": "Alice", "joined": date(2024, 1, 15)}
print(json.dumps(data, default=default, indent=2))`,
    explanation: "`json.dumps` accepts a `default` function for custom serialization of non-JSON types; `indent` produces human-readable multi-line output.",
  },
  {
    id: "py-b17-b4-classes-dataclass-kw-only",
    language: "python",
    title: "dataclass with kw_only fields (Python 3.10+)",
    tag: "classes",
    code: `from dataclasses import dataclass, field

@dataclass
class Config:
    host: str
    port: int
    debug: bool = field(default=False, kw_only=True)
    timeout: int = field(default=30, kw_only=True)

cfg = Config("localhost", 8080, debug=True)
print(cfg)`,
    explanation: "`kw_only=True` on a field forces it to be keyword-only in the generated `__init__`, preventing accidental positional misuse of optional configuration.",
  },
  {
    id: "py-b17-b4-classes-dataclass-compare",
    language: "python",
    title: "dataclass with order=True for comparison",
    tag: "classes",
    code: `from dataclasses import dataclass

@dataclass(order=True)
class Version:
    major: int
    minor: int
    patch: int = 0

v1 = Version(1, 2)
v2 = Version(1, 3)
print(v1 < v2)   # True
print(sorted([Version(2,0), Version(1,5), Version(1,2)]))`,
    explanation: "`order=True` generates `__lt__`, `__le__`, `__gt__`, `__ge__` that compare field values in declaration order, enabling sorting without custom methods.",
  },
  {
    id: "py-b17-b4-types-concatenate",
    language: "python",
    title: "Concatenate for typed higher-order functions",
    tag: "types",
    code: `from typing import Callable, Concatenate, TypeVar

P = TypeVar("P")

def logged(fn: Callable[Concatenate[str, ...], P]) -> Callable[..., P]:
    def wrapper(*args, **kwargs):
        print(f"calling {fn.__name__}")
        return fn(*args, **kwargs)
    return wrapper`,
    explanation: "`Concatenate[T, ...]` in a `Callable` type prepends a known first-argument type to an arbitrary `ParamSpec`, used to type decorators that inject arguments.",
  },
  {
    id: "py-b17-b4-understanding-asyncio-event-loop",
    language: "python",
    title: "asyncio event loop mechanics",
    tag: "understanding",
    code: `import asyncio

async def task(name, delay):
    print(f"{name} start")
    await asyncio.sleep(delay)
    print(f"{name} done")

async def main():
    # Tasks run concurrently on the same thread
    await asyncio.gather(task("A", 2), task("B", 1))

asyncio.run(main())
# A start, B start, B done, A done`,
    explanation: "The asyncio event loop multiplexes coroutines on one thread; `await asyncio.sleep` yields control, letting other coroutines advance while waiting for I/O.",
  },
  {
    id: "py-b17-b4-snippet-bytes-decoding",
    language: "python",
    title: "bytes.decode with error handling",
    tag: "snippet",
    code: `raw = b"caf\\xe9 menu"   # é in latin-1

try:
    text = raw.decode("utf-8")
except UnicodeDecodeError:
    text = raw.decode("utf-8", errors="replace")   # replace with U+FFFD
print(text)   # caf� menu

text2 = raw.decode("latin-1")   # correct encoding
print(text2)  # café menu`,
    explanation: "Decode bytes specifying the correct codec; use `errors='replace'` or `'ignore'` to handle malformed sequences instead of crashing.",
  },
  {
    id: "py-b17-b4-families-threading-lock",
    language: "python",
    title: "threading.Lock protects shared state",
    tag: "families",
    code: `import threading

counter = 0
lock = threading.Lock()

def increment(n):
    global counter
    for _ in range(n):
        with lock:
            counter += 1

threads = [threading.Thread(target=increment, args=(10_000,)) for _ in range(4)]
for t in threads: t.start()
for t in threads: t.join()
print(counter)   # 40000`,
    explanation: "A `threading.Lock` used as a context manager acquires on entry and releases on exit, making the increment atomic across all threads.",
  },
  {
    id: "py-b17-b4-snippet-itertools-pairwise",
    language: "python",
    title: "itertools.pairwise for sliding window of 2",
    tag: "snippet",
    code: `import itertools

values = [1, 3, 6, 10, 15]
diffs = [b - a for a, b in itertools.pairwise(values)]
print(diffs)  # [2, 3, 4, 5]`,
    explanation: "`itertools.pairwise` (Python 3.10+) yields overlapping consecutive pairs, useful for computing differences, detecting changes, or checking adjacency.",
  },
  {
    id: "py-b17-b4-snippet-int-bit-methods",
    language: "python",
    title: "int.bit_length and int.bit_count",
    tag: "snippet",
    code: `n = 255   # 0b11111111

print(n.bit_length())   # 8   — bits needed to represent n
print(n.bit_count())    # 8   — number of 1-bits (Python 3.10+)
print((12).bit_length())   # 4
print((12).bit_count())    # 2   # 0b1100`,
    explanation: "`bit_length()` returns the minimum number of bits required; `bit_count()` returns the Hamming weight (popcount) — useful in bitwise algorithms.",
  },
  {
    id: "py-b17-b4-snippet-assignment-expression-while",
    language: "python",
    title: "Walrus operator to consume a queue",
    tag: "snippet",
    code: `from collections import deque

q = deque([10, 20, 30, 40])
results = []
while item := (q.popleft() if q else None):
    results.append(item * 2)

print(results)  # [20, 40, 60, 80]`,
    explanation: "The walrus operator can combine the dequeue-and-test into the `while` condition, making queue-draining loops more concise.",
  },
];
