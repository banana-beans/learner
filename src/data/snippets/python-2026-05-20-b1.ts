import type { Snippet } from "./types";

export const pythonSnippets20260520B1: Snippet[] = [
  {
    id: "py-0520-b1-walrus-while",
    language: "python",
    title: "walrus operator in while loop",
    tag: "snippet",
    code: `import re

text = "price: 42 qty: 7 total: 294"
pos = 0
while m := re.search(r"\\d+", text[pos:]):
    print(m.group())   # 42, 7, 294
    pos += m.end() + (pos or 0)`,
    explanation: "The walrus operator `:=` assigns and tests in one expression, letting you avoid a sentinel variable or duplicated call — especially useful when the loop condition and loop body both need the result.",
  },
  {
    id: "py-0520-b1-global-nonlocal",
    language: "python",
    title: "nonlocal vs global",
    tag: "understanding",
    code: `x = 10

def outer():
    x = 20
    def inner():
        nonlocal x   # refers to outer's x, not global
        x += 1
    inner()
    print(x)   # 21

outer()
print(x)       # 10  (global unchanged)`,
    explanation: "`nonlocal` climbs to the nearest enclosing function scope; `global` jumps all the way to the module level — mixing them up silently creates a new local instead of modifying the intended binding.",
  },
  {
    id: "py-0520-b1-array-module",
    language: "python",
    title: "array.array vs list",
    tag: "structures",
    code: `import array, sys

nums_list  = list(range(1000))
nums_array = array.array("i", range(1000))  # signed int

print(sys.getsizeof(nums_list))   # ~8056 bytes
print(sys.getsizeof(nums_array))  # ~4056 bytes

# array supports the buffer protocol; list does not
import struct
raw = bytes(nums_array)
print(len(raw))   # 4000  (1000 × 4-byte ints)`,
    explanation: "`array.array` stores homogeneous C-level values contiguously, using roughly half the memory of a list for integers and exposing the buffer protocol for zero-copy I/O — but it only holds one numeric type per instance.",
  },
  {
    id: "py-0520-b1-mutable-default-arg",
    language: "python",
    title: "mutable default argument trap",
    tag: "caveats",
    code: `def append_to(val, lst=[]):   # lst created ONCE at def time
    lst.append(val)
    return lst

print(append_to(1))  # [1]
print(append_to(2))  # [1, 2]  ← not [2]!

# Fix: use None sentinel
def append_to_safe(val, lst=None):
    if lst is None:
        lst = []
    lst.append(val)
    return lst`,
    explanation: "Default argument values are evaluated once when the `def` statement executes, so a mutable default like `[]` is shared across all calls — always use `None` as the sentinel and create the mutable inside the function.",
  },
  {
    id: "py-0520-b1-decimal-rounding",
    language: "python",
    title: "Decimal rounding modes",
    tag: "types",
    code: `from decimal import Decimal, ROUND_HALF_UP, ROUND_HALF_EVEN

d = Decimal("2.5")
print(d.quantize(Decimal("1"), rounding=ROUND_HALF_UP))   # 3
print(d.quantize(Decimal("1"), rounding=ROUND_HALF_EVEN))  # 2  (banker's)

d2 = Decimal("3.5")
print(d2.quantize(Decimal("1"), rounding=ROUND_HALF_EVEN)) # 4  (round to even)`,
    explanation: "`ROUND_HALF_EVEN` (banker's rounding) rounds 0.5 to the nearest even digit, reducing cumulative bias in financial calculations; `ROUND_HALF_UP` is the familiar school rule but can skew aggregates.",
  },
  {
    id: "py-0520-b1-defaultdict-counter-chainmap",
    language: "python",
    title: "defaultdict vs Counter vs ChainMap",
    tag: "families",
    code: `from collections import defaultdict, Counter, ChainMap

# defaultdict: missing key calls factory
dd = defaultdict(list)
dd["a"].append(1)   # no KeyError

# Counter: counts hashables, arithmetic support
c = Counter("abracadabra")
print(c.most_common(2))  # [('a', 5), ('b', 2)]

# ChainMap: layered lookup, writes go to first map
base   = {"x": 1, "y": 2}
override = {"x": 99}
cm = ChainMap(override, base)
print(cm["x"])  # 99
print(cm["y"])  # 2`,
    explanation: "Use `defaultdict` when you need auto-created mutable values, `Counter` for tallying with arithmetic on counts, and `ChainMap` when you want layered key lookup (e.g., local → global config) without merging dicts.",
  },
  {
    id: "py-0520-b1-slots-dict",
    language: "python",
    title: "__slots__ removes __dict__ overhead",
    tag: "classes",
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

a = WithDict(1, 2)
b = WithSlots(1, 2)
print(sys.getsizeof(a))           # ~48 bytes
print(sys.getsizeof(b))           # ~56 bytes (slot descriptors in class)
print(hasattr(a, "__dict__"))     # True
print(hasattr(b, "__dict__"))     # False
# b.z = 3  → AttributeError`,
    explanation: "`__slots__` replaces the per-instance `__dict__` with fixed-offset C slots, cutting memory per instance significantly when you create thousands of objects — but you lose the ability to add arbitrary attributes.",
  },
  {
    id: "py-0520-b1-str-translate",
    language: "python",
    title: "str.translate for fast character removal",
    tag: "snippet",
    code: `import string

text = "Hello, World! 123"

# Remove punctuation
table = str.maketrans("", "", string.punctuation)
clean = text.translate(table)
print(clean)   # 'Hello World 123'

# Replace and delete in one pass
table2 = str.maketrans("aeiou", "AEIOU", "123")
print(text.translate(table2))  # 'HEllO, WOrld! '`,
    explanation: "`str.translate` with a translation table built by `str.maketrans` does character-level replacement and deletion in a single C-level pass — faster than multiple `str.replace` calls for the same work.",
  },
  {
    id: "py-0520-b1-chained-comparison",
    language: "python",
    title: "chained comparisons short-circuit",
    tag: "understanding",
    code: `def check(n):
    print(f"checking {n}")
    return n

# Equivalent to: check(1) < check(2) and check(2) < check(3)
result = check(1) < check(2) < check(3)
# prints: checking 1, checking 2, checking 3
print(result)  # True

# Short-circuit: middle expression evaluated once
x = 5
print(0 < x < 10)  # True, x evaluated once`,
    explanation: "Python's chained comparisons like `a < b < c` are a single expression where each operand is evaluated at most once and the chain short-circuits on the first false pair — they're not the same as `(a < b) < c`.",
  },
  {
    id: "py-0520-b1-deque-rotate",
    language: "python",
    title: "collections.deque rotate",
    tag: "structures",
    code: `from collections import deque

d = deque([1, 2, 3, 4, 5])
d.rotate(2)          # right shift by 2
print(list(d))       # [4, 5, 1, 2, 3]

d.rotate(-2)         # left shift by 2
print(list(d))       # [1, 2, 3, 4, 5]  (back to original)

# Efficient O(1) appendleft / popleft
d.appendleft(0)
d.popleft()          # O(1) unlike list.insert(0, ...)`,
    explanation: "`deque.rotate(n)` shifts elements in O(k) where k is `min(n, len)`, and `appendleft`/`popleft` are O(1) — making deque far better than list when you need a double-ended queue.",
  },
  {
    id: "py-0520-b1-augmented-assign-tuple",
    language: "python",
    title: "+= on a tuple containing a list",
    tag: "caveats",
    code: `t = ([1, 2], "hello")

try:
    t[0] += [3]        # raises TypeError ...
except TypeError as e:
    print(e)           # 'tuple' object does not support item assignment

print(t)               # ([1, 2, 3], 'hello')  ← mutation happened anyway!`,
    explanation: "`t[0] += [3]` compiles to three steps: fetch `t[0]`, call `__iadd__` (which mutates the list in place), then assign back to `t[0]` (which raises TypeError) — so the list is mutated but the exception is still raised, leaving the program in a surprising state.",
  },
  {
    id: "py-0520-b1-fraction-exact",
    language: "python",
    title: "Fraction for exact rational arithmetic",
    tag: "types",
    code: `from fractions import Fraction

a = Fraction(1, 3)
b = Fraction(1, 6)
print(a + b)          # 1/2  (exact)
print(float(a + b))   # 0.5

# Convert from float (may be surprising)
print(Fraction(0.1))  # 3602879701896397/36028797018963968
print(Fraction("0.1"))  # 1/10  (exact, from string)`,
    explanation: "`Fraction` stores numerator and denominator as Python integers, giving exact rational arithmetic — always construct from strings or integer pairs, not floats, since float literals already carry IEEE 754 rounding error.",
  },
  {
    id: "py-0520-b1-list-deque-array",
    language: "python",
    title: "list vs deque vs array.array",
    tag: "families",
    code: `from collections import deque
import array

lst = [1, 2, 3]          # resizable, O(1) amortized append
dq  = deque([1, 2, 3])   # O(1) both ends, O(n) random access
arr = array.array("i", [1, 2, 3])  # typed, compact, buffer protocol

# list: best for random access and general use
# deque: best as FIFO queue or when prepending often
# array: best when interfacing with C, binary I/O, or needing compact storage

lst.insert(0, 0)   # O(n)
dq.appendleft(0)   # O(1)`,
    explanation: "Choose `list` for most work, `deque` when you need O(1) operations on both ends, and `array.array` when you need a typed, memory-compact buffer that speaks the C buffer protocol.",
  },
  {
    id: "py-0520-b1-property-decorator",
    language: "python",
    title: "@property getter and setter",
    tag: "classes",
    code: `class Temperature:
    def __init__(self, celsius: float = 0.0):
        self._celsius = celsius

    @property
    def celsius(self) -> float:
        return self._celsius

    @celsius.setter
    def celsius(self, value: float) -> None:
        if value < -273.15:
            raise ValueError("Below absolute zero")
        self._celsius = value

    @property
    def fahrenheit(self) -> float:
        return self._celsius * 9 / 5 + 32

t = Temperature(25)
print(t.fahrenheit)   # 77.0
t.celsius = -300      # raises ValueError`,
    explanation: "`@property` exposes a method as an attribute, letting you add validation or computation without breaking the public API — callers use dot-access syntax while the class controls exactly what happens.",
  },
  {
    id: "py-0520-b1-itertools-accumulate",
    language: "python",
    title: "itertools.accumulate for running totals",
    tag: "snippet",
    code: `import itertools, operator

data = [1, 2, 3, 4, 5]

# Running sum
print(list(itertools.accumulate(data)))
# [1, 3, 6, 10, 15]

# Running product
print(list(itertools.accumulate(data, operator.mul)))
# [1, 2, 6, 24, 120]

# Running max with initial value
print(list(itertools.accumulate([3,1,4,1,5], max, initial=0)))
# [0, 3, 3, 4, 4, 5]`,
    explanation: "`itertools.accumulate` generates a running reduction without materializing intermediate lists; the `initial` parameter (Python 3.8+) prepends a seed value, which is handy for prefix sums with a defined starting point.",
  },
  {
    id: "py-0520-b1-nan-comparison",
    language: "python",
    title: "NaN is never equal to itself",
    tag: "understanding",
    code: `import math

nan = float("nan")
print(nan == nan)    # False
print(nan != nan)    # True
print(nan < 0)       # False
print(nan > 0)       # False

# The only reliable NaN check:
print(math.isnan(nan))  # True

# NaN in a list:
data = [1, float("nan"), 3]
print(float("nan") in data)  # False  (uses ==)`,
    explanation: "IEEE 754 mandates that NaN is unordered and not equal to anything, including itself — `x != x` is the classic NaN test, but `math.isnan(x)` is more readable and correct.",
  },
  {
    id: "py-0520-b1-ordereddict-move",
    language: "python",
    title: "OrderedDict.move_to_end for LRU-style ops",
    tag: "structures",
    code: `from collections import OrderedDict

od = OrderedDict([("a", 1), ("b", 2), ("c", 3)])

od.move_to_end("a")         # move to last
print(list(od))             # ['b', 'c', 'a']

od.move_to_end("a", last=False)  # move to first
print(list(od))             # ['a', 'b', 'c']

# popitem(last=True/False) for LIFO or FIFO eviction
od.popitem(last=False)      # evict 'a'
print(list(od))             # ['b', 'c']`,
    explanation: "`OrderedDict.move_to_end` is the building block for manual LRU caches: on each access, move the key to the end; evict from the front with `popitem(last=False)` — though `functools.lru_cache` handles this automatically.",
  },
  {
    id: "py-0520-b1-float-rounding",
    language: "python",
    title: "0.1 + 0.2 is not 0.3",
    tag: "caveats",
    code: `print(0.1 + 0.2)           # 0.30000000000000004
print(0.1 + 0.2 == 0.3)    # False

import math
print(math.isclose(0.1 + 0.2, 0.3))  # True (rel_tol=1e-9)

from decimal import Decimal
print(Decimal("0.1") + Decimal("0.2"))  # 0.3  (exact)`,
    explanation: "IEEE 754 binary floating-point cannot represent 0.1 or 0.3 exactly; use `math.isclose` for comparisons with a tolerance, or `decimal.Decimal` from strings when you need exact decimal arithmetic.",
  },
  {
    id: "py-0520-b1-typealias",
    language: "python",
    title: "TypeAlias for readable annotations",
    tag: "types",
    code: `from typing import TypeAlias

# PEP 613 explicit alias (avoids ambiguity with assignment)
Vector: TypeAlias = list[float]
Matrix: TypeAlias = list[Vector]

def dot(a: Vector, b: Vector) -> float:
    return sum(x * y for x, y in zip(a, b))

# Python 3.12+: type statement
# type Vector = list[float]
# type Matrix = list[Vector]`,
    explanation: "Annotating an alias with `TypeAlias` tells type checkers it's intentional — without it, `Vector = list[float]` looks like a regular assignment and some tools may not treat it as a type alias.",
  },
  {
    id: "py-0520-b1-namedtuple-dataclass-typeddict",
    language: "python",
    title: "NamedTuple vs dataclass vs TypedDict",
    tag: "families",
    code: `from typing import NamedTuple, TypedDict
from dataclasses import dataclass

class PointN(NamedTuple):
    x: float; y: float       # immutable, tuple subclass, unpackable

@dataclass
class PointD:
    x: float; y: float       # mutable by default, rich features

class PointT(TypedDict):
    x: float; y: float       # plain dict at runtime, typed for tools

pn = PointN(1.0, 2.0)
x, y = pn                    # tuple unpacking works
pd = PointD(1.0, 2.0)
pd.x = 99                    # mutation OK
pt: PointT = {"x": 1.0, "y": 2.0}  # just a dict`,
    explanation: "Use `NamedTuple` when you need an immutable tuple with named fields; `dataclass` for mutable objects with optional methods and features like `__post_init__`; `TypedDict` when you're annotating dicts you don't control (JSON payloads, kwargs).",
  },
  {
    id: "py-0520-b1-staticmethod-classmethod",
    language: "python",
    title: "@staticmethod vs @classmethod",
    tag: "classes",
    code: `class Converter:
    _factor = 2.54  # class-level constant

    @staticmethod
    def inch_to_cm(inch: float) -> float:
        return inch * 2.54   # no access to class state

    @classmethod
    def from_factor(cls, value: float) -> float:
        return value * cls._factor  # cls = Converter (or subclass)

class MetricConverter(Converter):
    _factor = 2.540  # override

print(Converter.from_factor(10))      # 25.4
print(MetricConverter.from_factor(10))  # 25.4 (uses subclass factor)
print(Converter.inch_to_cm(10))       # 25.4`,
    explanation: "`@staticmethod` is just a namespaced function with no implicit first argument; `@classmethod` receives the class (not the instance) as `cls`, which makes it inheritable and subclass-aware — useful for alternative constructors.",
  },
  {
    id: "py-0520-b1-heapq-nlargest",
    language: "python",
    title: "heapq.nlargest / nsmallest",
    tag: "snippet",
    code: `import heapq

data = [3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5]

top3 = heapq.nlargest(3, data)
print(top3)   # [9, 6, 5]

bottom3 = heapq.nsmallest(3, data)
print(bottom3)  # [1, 1, 2]

# With key function
records = [{"name": "Alice", "score": 92}, {"name": "Bob", "score": 87}]
print(heapq.nlargest(1, records, key=lambda r: r["score"]))
# [{'name': 'Alice', 'score': 92}]`,
    explanation: "`heapq.nlargest(n, iterable)` uses a min-heap of size n, giving O(k log n) performance — more efficient than sorting when n is much smaller than the iterable, but `max()` is faster when n == 1.",
  },
  {
    id: "py-0520-b1-set-iteration-order",
    language: "python",
    title: "set has no guaranteed iteration order",
    tag: "understanding",
    code: `s = {3, 1, 4, 1, 5, 9, 2, 6}
print(s)          # {1, 2, 3, 4, 5, 6, 9} — sorted here by coincidence
print(list(s))    # order may differ between Python versions/runs

# dict preserves insertion order (Python 3.7+)
d = {"b": 2, "a": 1, "c": 3}
print(list(d))    # ['b', 'a', 'c']  — always insertion order`,
    explanation: "Set iteration order is an implementation detail that happens to look sorted for small integers in CPython, but it's not guaranteed — if you need ordered unique elements, use `dict.fromkeys()` or a list with a seen-set.",
  },
  {
    id: "py-0520-b1-defaultdict-list",
    language: "python",
    title: "defaultdict(list) for grouping",
    tag: "structures",
    code: `from collections import defaultdict

words = ["apple", "ant", "banana", "avocado", "blueberry", "cherry"]

by_letter = defaultdict(list)
for word in words:
    by_letter[word[0]].append(word)

print(dict(by_letter))
# {'a': ['apple', 'ant', 'avocado'],
#  'b': ['banana', 'blueberry'],
#  'c': ['cherry']}`,
    explanation: "`defaultdict(list)` auto-creates an empty list on the first access of any new key, eliminating the `if key not in d: d[key] = []` boilerplate — the factory is called with no arguments each time a missing key is accessed.",
  },
  {
    id: "py-0520-b1-chained-assign-list",
    language: "python",
    title: "chained assignment creates aliases",
    tag: "caveats",
    code: `a = b = []    # both names point to the SAME list
a.append(1)
print(b)      # [1]  ← b sees the mutation

# Compare: separate empty lists
a = []
b = []
a.append(1)
print(b)      # []   ← independent

# Same trap with nested structures
row = [0] * 3
grid = [row] * 3   # all three rows are aliases of the same list
grid[0][1] = 9
print(grid)   # [[0, 9, 0], [0, 9, 0], [0, 9, 0]]`,
    explanation: "Chained assignment like `a = b = []` makes both names reference the same object — mutations through either name affect all references, which is almost never intended with mutable defaults.",
  },
  {
    id: "py-0520-b1-paramspec",
    language: "python",
    title: "ParamSpec for higher-order function types",
    tag: "types",
    code: `from typing import Callable, TypeVar
from typing import ParamSpec
import functools

P = ParamSpec("P")
T = TypeVar("T")

def logged(fn: Callable[P, T]) -> Callable[P, T]:
    @functools.wraps(fn)
    def wrapper(*args: P.args, **kwargs: P.kwargs) -> T:
        print(f"calling {fn.__name__}")
        return fn(*args, **kwargs)
    return wrapper

@logged
def add(x: int, y: int) -> int:
    return x + y

result: int = add(1, 2)   # type checker knows result is int`,
    explanation: "`ParamSpec` captures the full parameter signature of a callable so decorators and wrappers can preserve it for type checkers — without it, `*args, **kwargs` loses parameter names and types.",
  },
  {
    id: "py-0520-b1-queue-types",
    language: "python",
    title: "Queue vs LifoQueue vs PriorityQueue",
    tag: "families",
    code: `import queue

q  = queue.Queue()         # FIFO, thread-safe
lq = queue.LifoQueue()     # LIFO (stack), thread-safe
pq = queue.PriorityQueue() # min-heap ordered, thread-safe

pq.put((3, "low"))
pq.put((1, "high"))
pq.put((2, "medium"))

while not pq.empty():
    print(pq.get())   # (1, 'high'), (2, 'medium'), (3, 'low')`,
    explanation: "The `queue` module provides thread-safe variants for producer/consumer patterns; `PriorityQueue` wraps `heapq` internally and orders by the first tuple element — use these over bare deque when crossing thread boundaries.",
  },
  {
    id: "py-0520-b1-new-vs-init",
    language: "python",
    title: "__new__ vs __init__",
    tag: "classes",
    code: `class Singleton:
    _instance = None

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance   # __init__ runs on the returned instance

    def __init__(self, value: int):
        self.value = value     # called every time, even on cached instance

a = Singleton(1)
b = Singleton(2)
print(a is b)        # True
print(a.value)       # 2  (re-initialized)`,
    explanation: "`__new__` creates and returns the instance (allocation); `__init__` initializes it (receives whatever `__new__` returned) — for singletons, `__new__` controls creation but `__init__` still re-runs on each call unless you guard it.",
  },
  {
    id: "py-0520-b1-bisect-insort",
    language: "python",
    title: "bisect.insort for sorted insertion",
    tag: "snippet",
    code: `import bisect

scores = [45, 67, 78, 89, 95]

bisect.insort(scores, 72)
print(scores)   # [45, 67, 72, 78, 89, 95]

# Find insertion point without inserting
pos = bisect.bisect_left(scores, 80)
print(pos)      # 4  (where 80 would be inserted)

# Binary search: is 78 present?
idx = bisect.bisect_left(scores, 78)
found = idx < len(scores) and scores[idx] == 78
print(found)    # True`,
    explanation: "`bisect.insort` uses binary search to find the correct position then shifts elements — O(n) overall due to the shift, but better than sorting from scratch when maintaining a sorted list under frequent single insertions.",
  },
  {
    id: "py-0520-b1-bool-is-int",
    language: "python",
    title: "bool is a subtype of int",
    tag: "understanding",
    code: `print(isinstance(True, int))   # True
print(True + True)             # 2
print(True * 5)                # 5
print(True == 1)               # True
print(False == 0)              # True

# Consequence: bools sort like 0/1
mixed = [True, False, 2, 0, 1]
print(sorted(mixed))  # [False, 0, False, 1, True, 2] — varies by stable sort

# Counting booleans
flags = [True, False, True, True, False]
print(sum(flags))   # 3  (counts True values)`,
    explanation: "`bool` is a subclass of `int` in Python, so `True` and `False` are literally `1` and `0` — this is intentional and lets you use `sum(pred(x) for x in iterable)` to count truthy results.",
  },
  {
    id: "py-0520-b1-heap-push-pop",
    language: "python",
    title: "heapq push and pop — min-heap operations",
    tag: "structures",
    code: `import heapq

h = []
heapq.heappush(h, 5)
heapq.heappush(h, 1)
heapq.heappush(h, 3)

print(h[0])              # 1  (always smallest)
print(heapq.heappop(h))  # 1
print(heapq.heappop(h))  # 3

# heapify converts list in-place O(n)
data = [5, 3, 1, 4, 2]
heapq.heapify(data)
print(data[0])   # 1`,
    explanation: "`heapq` implements a min-heap on a plain list; `heappush` and `heappop` are O(log n), and `heapify` is O(n) — Python has no built-in max-heap, so negate values or use `(-priority, item)` tuples.",
  },
  {
    id: "py-0520-b1-floor-division-negative",
    language: "python",
    title: "floor division with negative numbers",
    tag: "caveats",
    code: `print(7 // 2)    # 3   (floor toward -∞)
print(-7 // 2)   # -4  (NOT -3 — floors toward -∞)
print(7 // -2)   # -4
print(-7 // -2)  # 3

# Modulo follows the same convention (Euclidean-like)
print(-7 % 2)    # 1  (always non-negative when divisor is positive)
print(7 % -2)    # -1

# Relationship: a == (a // b) * b + (a % b)
print(-7 == (-4) * 2 + 1)  # True`,
    explanation: "Python's `//` always floors toward negative infinity — unlike C's truncation toward zero — so `-7 // 2` is `-4`, not `-3`; the modulo operator follows the same sign convention, keeping `a == (a // b) * b + a % b` valid.",
  },
  {
    id: "py-0520-b1-typevar-bound",
    language: "python",
    title: "TypeVar with upper bound",
    tag: "types",
    code: `from typing import TypeVar
from numbers import Number

N = TypeVar("N", bound=Number)

def double(x: N) -> N:
    return x + x  # type: ignore[operator]

# Also: constrained TypeVar (one of listed types)
from typing import Union
Numeric = TypeVar("Numeric", int, float, complex)

def to_str(x: Numeric) -> str:
    return str(x)`,
    explanation: "A `bound=` TypeVar restricts T to the bound type or its subtypes, preserving the specific type through the function; constrained TypeVars (without `bound`) limit to exactly one of the listed types — subtypes are not automatically included.",
  },
  {
    id: "py-0520-b1-stringio-bytesio",
    language: "python",
    title: "io.StringIO vs io.BytesIO",
    tag: "families",
    code: `import io

# In-memory text buffer — behaves like an opened text file
sio = io.StringIO()
sio.write("hello\\n")
sio.write("world\\n")
sio.seek(0)
print(sio.read())   # 'hello\\nworld\\n'

# In-memory bytes buffer — behaves like an opened binary file
bio = io.BytesIO(b"\\xff\\xfe")
bio.write(b"data")
print(bio.getvalue())   # b'data'  (replaced initial content after seek)

import csv, io
out = io.StringIO()
csv.writer(out).writerow(["a", "b", "c"])
print(out.getvalue())   # 'a,b,c\\r\\n'`,
    explanation: "`io.StringIO` is a file-like object for text, useful for capturing output or feeding string data to APIs expecting files; `io.BytesIO` is the binary equivalent — both avoid hitting the filesystem.",
  },
  {
    id: "py-0520-b1-init-subclass",
    language: "python",
    title: "__init_subclass__ as a lightweight hook",
    tag: "classes",
    code: `class Plugin:
    _registry: dict[str, type] = {}

    def __init_subclass__(cls, name: str = "", **kwargs):
        super().__init_subclass__(**kwargs)
        if name:
            Plugin._registry[name] = cls

class PluginA(Plugin, name="alpha"):
    pass

class PluginB(Plugin, name="beta"):
    pass

print(Plugin._registry)
# {'alpha': <class 'PluginA'>, 'beta': <class 'PluginB'>}`,
    explanation: "`__init_subclass__` is called on the parent whenever a subclass is defined, enabling lightweight plugin registration without metaclasses — keyword arguments in the class header are forwarded to it.",
  },
  {
    id: "py-0520-b1-operator-attrgetter",
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
    Employee("Bob",   "Eng", 90000),
    Employee("Alice", "HR",  70000),
    Employee("Carol", "Eng", 85000),
]

# Sort by dept, then salary descending
staff.sort(key=attrgetter("dept", "salary"))
for e in staff:
    print(e.name, e.dept, e.salary)`,
    explanation: "`operator.attrgetter` returns a callable that fetches one or more attributes — it's faster than a lambda, composable with `sorted`, and clearly communicates intent when sorting by multiple fields.",
  },
  {
    id: "py-0520-b1-class-instance-var",
    language: "python",
    title: "class variable vs instance variable shadowing",
    tag: "understanding",
    code: `class Counter:
    count = 0          # class variable shared by all instances

    def increment(self):
        self.count += 1   # creates an INSTANCE variable, shadows class var

c1 = Counter()
c2 = Counter()
c1.increment()
print(c1.count)           # 1  (instance variable)
print(c2.count)           # 0  (still class variable)
print(Counter.count)      # 0  (class variable unchanged)`,
    explanation: "Reading `self.count` looks up the class variable, but `self.count += 1` (which is `self.count = self.count + 1`) creates a new instance variable that shadows it — the class variable is never mutated.",
  },
  {
    id: "py-0520-b1-frozenset-ops",
    language: "python",
    title: "frozenset as hashable set",
    tag: "structures",
    code: `fs1 = frozenset([1, 2, 3])
fs2 = frozenset([2, 3, 4])

print(fs1 | fs2)   # frozenset({1, 2, 3, 4})
print(fs1 & fs2)   # frozenset({2, 3})
print(fs1 - fs2)   # frozenset({1})

# frozenset is hashable — can be a dict key or set element
lookup = {fs1: "set A", fs2: "set B"}
print(lookup[frozenset([1, 2, 3])])  # 'set A'

s = {fs1, fs2}    # set of frozensets
print(len(s))     # 2`,
    explanation: "`frozenset` supports all set operations but is immutable and hashable, so it can be used as a dictionary key or as an element of another set — useful for representing combinations or groups where identity by content matters.",
  },
  {
    id: "py-0520-b1-exception-chain-suppress",
    language: "python",
    title: "raise from None to suppress exception chain",
    tag: "caveats",
    code: `class ConfigError(Exception):
    pass

def load_config(path):
    try:
        with open(path) as f:
            return f.read()
    except FileNotFoundError:
        raise ConfigError(f"Config not found: {path}") from None
        # Without 'from None', Python would also print the FileNotFoundError

try:
    load_config("/missing.cfg")
except ConfigError as e:
    print(e)   # Config not found: /missing.cfg  (clean output)`,
    explanation: "`raise NewError from None` suppresses the implicit exception chain, giving users a clean error without the noisy `During handling of the above exception...` context — use it when the original exception is an implementation detail.",
  },
  {
    id: "py-0520-b1-literal-type",
    language: "python",
    title: "Literal type for exact value constraints",
    tag: "types",
    code: `from typing import Literal

Direction = Literal["north", "south", "east", "west"]

def move(direction: Direction, steps: int) -> None:
    print(f"Moving {steps} steps {direction}")

move("north", 3)    # OK
# move("up", 1)     # type error: 'up' not in Literal

# Useful for status codes, mode strings, etc.
def open_file(path: str, mode: Literal["r", "w", "a", "rb", "wb"]) -> None:
    open(path, mode)`,
    explanation: "`Literal` narrows a type to specific values, letting type checkers catch invalid arguments at type-check time — it's more precise than `str` and avoids enums when you only need to constrain a small set of string or int values.",
  },
  {
    id: "py-0520-b1-thread-process-coroutine",
    language: "python",
    title: "threading vs multiprocessing vs asyncio",
    tag: "families",
    code: `# threading: I/O bound, shared memory, GIL limits CPU parallelism
import threading
t = threading.Thread(target=lambda: print("thread"))
t.start(); t.join()

# multiprocessing: CPU bound, separate memory, true parallelism
from multiprocessing import Process
p = Process(target=lambda: print("process"))
p.start(); p.join()

# asyncio: I/O bound, single thread, cooperative multitasking
import asyncio
async def coro():
    await asyncio.sleep(0)
    print("coroutine")
asyncio.run(coro())`,
    explanation: "Use `threading` for I/O-bound work that benefits from overlapping waits; `multiprocessing` for CPU-bound work that needs to bypass the GIL; `asyncio` for high-concurrency I/O where thread overhead would dominate.",
  },
  {
    id: "py-0520-b1-set-name-descriptor",
    language: "python",
    title: "__set_name__ descriptor hook",
    tag: "classes",
    code: `class Validated:
    def __set_name__(self, owner, name):
        self.name = name  # called when class body is processed

    def __get__(self, obj, objtype=None):
        if obj is None:
            return self
        return obj.__dict__.get(self.name)

    def __set__(self, obj, value):
        if not isinstance(value, int):
            raise TypeError(f"{self.name} must be int")
        obj.__dict__[self.name] = value

class Point:
    x = Validated()
    y = Validated()

p = Point()
p.x = 10   # OK
try:
    p.y = "oops"
except TypeError as e:
    print(e)   # y must be int`,
    explanation: "`__set_name__` is called by the metaclass when the descriptor is assigned in a class body, passing the attribute name so the descriptor can store it — previously you had to pass the name manually in `__init__`.",
  },
  {
    id: "py-0520-b1-dict-setdefault",
    language: "python",
    title: "dict.setdefault for upsert pattern",
    tag: "snippet",
    code: `# Build an inverted index
words = ["the", "cat", "sat", "on", "the", "mat"]
index: dict[str, list[int]] = {}

for i, word in enumerate(words):
    index.setdefault(word, []).append(i)

print(index)
# {'the': [0, 4], 'cat': [1], 'sat': [2], 'on': [3], 'mat': [5]}

# setdefault returns the existing value if key exists
existing = index.setdefault("the", [99])
print(existing)   # [0, 4]  (not replaced)`,
    explanation: "`dict.setdefault(key, default)` inserts the default only if the key is absent and always returns the current value — it's a single-lookup alternative to `if key not in d: d[key] = default; return d[key]`.",
  },
  {
    id: "py-0520-b1-exception-value",
    language: "python",
    title: "accessing exception arguments",
    tag: "understanding",
    code: `try:
    raise ValueError("bad input", 42)
except ValueError as e:
    print(e.args)          # ('bad input', 42)
    print(e.args[0])       # 'bad input'
    print(str(e))          # "('bad input', 42)"

# Single-arg exception
try:
    raise RuntimeError("oops")
except RuntimeError as e:
    print(e.args[0])   # 'oops'
    print(str(e))      # 'oops'`,
    explanation: "All exceptions store their constructor arguments in `.args` (a tuple); `str(e)` returns that tuple's repr for multi-arg exceptions but just the string for single-arg ones — always use `.args[0]` when you know the structure.",
  },
  {
    id: "py-0520-b1-bytearray-mutation",
    language: "python",
    title: "bytearray is mutable bytes",
    tag: "structures",
    code: `ba = bytearray(b"hello")
ba[0] = ord("H")          # mutate in place
print(ba)                  # bytearray(b'Hello')

ba.extend(b" world")
print(bytes(ba))           # b'Hello world'

# bytes is immutable
b = b"hello"
try:
    b[0] = 72
except TypeError as e:
    print(e)               # 'bytes' object does not support item assignment`,
    explanation: "`bytearray` is the mutable counterpart to `bytes` — you can assign to individual indices, extend it, and convert to `bytes` at the end; useful when building binary data incrementally without the overhead of concatenation.",
  },
  {
    id: "py-0520-b1-late-binding-closure",
    language: "python",
    title: "closure late binding in loops",
    tag: "caveats",
    code: `# Late binding: all closures share the same 'i' variable
funcs = [lambda: i for i in range(5)]
print([f() for f in funcs])   # [4, 4, 4, 4, 4]

# Fix 1: default argument captures value at definition time
funcs = [lambda i=i: i for i in range(5)]
print([f() for f in funcs])   # [0, 1, 2, 3, 4]

# Fix 2: functools.partial
import functools
identity = lambda x: x
funcs = [functools.partial(identity, i) for i in range(5)]
print([f() for f in funcs])   # [0, 1, 2, 3, 4]`,
    explanation: "Lambda (and other closures) capture variables by reference, not by value — inside a loop, all lambdas share the loop variable, so they all see its final value; the `i=i` default-argument trick captures the current value at definition time.",
  },
  {
    id: "py-0520-b1-protocol-structural",
    language: "python",
    title: "Protocol for structural subtyping",
    tag: "types",
    code: `from typing import Protocol, runtime_checkable

@runtime_checkable
class Drawable(Protocol):
    def draw(self) -> None: ...

class Circle:
    def draw(self) -> None:
        print("drawing circle")

class Square:
    def draw(self) -> None:
        print("drawing square")

def render(shape: Drawable) -> None:
    shape.draw()

render(Circle())   # OK — no explicit inheritance needed
render(Square())   # OK

print(isinstance(Circle(), Drawable))  # True (runtime_checkable)`,
    explanation: "`Protocol` defines structural subtyping (duck typing with type checking): any class that has the required methods satisfies the protocol without inheriting from it — `@runtime_checkable` also enables `isinstance` checks.",
  },
  {
    id: "py-0520-b1-open-modes",
    language: "python",
    title: "file open mode comparison",
    tag: "families",
    code: `# 'r'  — read text (default), fails if file doesn't exist
# 'w'  — write text, truncates/creates
# 'a'  — append text, creates if absent
# 'x'  — exclusive create text, fails if file exists
# 'r+' — read+write text, file must exist
# 'b'  suffix: binary mode (e.g. 'rb', 'wb')
# '+' suffix: open for updating (both read and write)

# Best practice: always use 'x' when you don't want to clobber
import pathlib, tempfile, os

with tempfile.NamedTemporaryFile(delete=False) as tf:
    path = tf.name

try:
    with open(path, "x") as f:
        f.write("new")
except FileExistsError:
    print("file already exists")`,
    explanation: "Mode `'x'` (exclusive creation) is the safest way to create a new file — it raises `FileExistsError` rather than silently overwriting, preventing accidental data loss in concurrent or idempotent workflows.",
  },
  {
    id: "py-0520-b1-mro-diamond",
    language: "python",
    title: "MRO with diamond inheritance",
    tag: "classes",
    code: `class A:
    def greet(self):
        print("A")

class B(A):
    def greet(self):
        print("B")
        super().greet()

class C(A):
    def greet(self):
        print("C")
        super().greet()

class D(B, C):
    pass

D().greet()   # B  C  A
print(D.__mro__)
# (<class 'D'>, <class 'B'>, <class 'C'>, <class 'A'>, <class 'object'>)`,
    explanation: "Python uses C3 linearisation to compute the MRO, ensuring each class appears once and parents are respected left-to-right; `super()` walks this chain, so cooperative multiple inheritance works correctly when every class calls `super()`.",
  },
  {
    id: "py-0520-b1-zip-longest",
    language: "python",
    title: "itertools.zip_longest with fill",
    tag: "snippet",
    code: `from itertools import zip_longest

a = [1, 2, 3]
b = ["a", "b"]

# Regular zip stops at shortest
print(list(zip(a, b)))            # [(1, 'a'), (2, 'b')]

# zip_longest pads the shorter iterable
print(list(zip_longest(a, b, fillvalue=0)))
# [(1, 'a'), (2, 'b'), (3, 0)]

# Useful for merging rows of unequal lengths
rows = [[1, 2, 3], [4, 5], [6]]
cols = list(zip_longest(*rows, fillvalue=None))
print(cols)  # [(1, 4, 6), (2, 5, None), (3, None, None)]`,
    explanation: "`zip_longest` fills shorter iterables with a `fillvalue` so the result is as long as the longest input — essential when processing ragged data where `zip`'s early termination would silently drop values.",
  },
  {
    id: "py-0520-b1-generator-send",
    language: "python",
    title: "generator.send() for two-way communication",
    tag: "understanding",
    code: `def accumulator():
    total = 0
    while True:
        value = yield total   # yield sends total out, receives value in
        if value is None:
            break
        total += value

gen = accumulator()
next(gen)          # advance to first yield (prime the generator)
print(gen.send(10))  # 10
print(gen.send(20))  # 30
print(gen.send(5))   # 35`,
    explanation: "`send(value)` resumes the generator and makes `yield` evaluate to `value`; you must `next()` (or `send(None)`) first to advance to the first `yield` — this two-way channel is what makes coroutines possible pre-`async/await`.",
  },
  {
    id: "py-0520-b1-bisect-left-right",
    language: "python",
    title: "bisect_left vs bisect_right for duplicates",
    tag: "structures",
    code: `import bisect

data = [1, 2, 2, 2, 3, 4]

print(bisect.bisect_left(data, 2))   # 1  (insert BEFORE existing 2s)
print(bisect.bisect_right(data, 2))  # 4  (insert AFTER existing 2s)

# Use bisect_left for 'find first position of x'
idx = bisect.bisect_left(data, 2)
if data[idx] == 2:
    print("found at", idx)   # found at 1

# Use bisect_right for 'count elements <= x'
count_le_2 = bisect.bisect_right(data, 2)
print(count_le_2)   # 4`,
    explanation: "`bisect_left` returns the leftmost valid insertion point (before any equal elements); `bisect_right` returns the rightmost — when there are no duplicates they agree, but the distinction matters for range queries and rank counting.",
  },
  {
    id: "py-0520-b1-string-concat-loop",
    language: "python",
    title: "O(n²) string concatenation in loops",
    tag: "caveats",
    code: `import timeit

n = 1000

# Slow: each += creates a new string object O(n²) total
def slow():
    s = ""
    for i in range(n):
        s += str(i)
    return s

# Fast: join accumulates parts then concatenates once
def fast():
    parts = []
    for i in range(n):
        parts.append(str(i))
    return "".join(parts)

# Or with a generator expression:
def fastest():
    return "".join(str(i) for i in range(n))`,
    explanation: "String `+=` in a loop allocates a new string object each iteration (O(n) each), giving O(n²) total; `''.join(iterable)` scans the iterable once to compute the total length, allocates once, then copies — O(n) overall.",
  },
  {
    id: "py-0520-b1-annotated-metadata",
    language: "python",
    title: "Annotated for metadata in type hints",
    tag: "types",
    code: `from typing import Annotated, get_type_hints, get_args

# Attach arbitrary metadata alongside the type
UserId = Annotated[int, "positive", "database primary key"]
EmailStr = Annotated[str, {"format": "email", "max_length": 254}]

def create_user(user_id: UserId, email: EmailStr) -> None:
    pass

hints = get_type_hints(create_user, include_extras=True)
print(get_args(hints["user_id"]))   # (int, 'positive', 'database primary key')`,
    explanation: "`Annotated[T, metadata...]` lets you attach arbitrary metadata to a type hint that tools like Pydantic, FastAPI, and custom validators can inspect at runtime — the type checkers see only `T` while the extras are available via `get_args`.",
  },
  {
    id: "py-0520-b1-isinstance-issubclass",
    language: "python",
    title: "isinstance vs issubclass vs type()",
    tag: "families",
    code: `class Animal: pass
class Dog(Animal): pass

d = Dog()

print(isinstance(d, Dog))      # True
print(isinstance(d, Animal))   # True  (respects inheritance)
print(type(d) is Dog)          # True
print(type(d) is Animal)       # False  (exact type only)

print(issubclass(Dog, Animal)) # True   (class, not instance)
print(issubclass(Dog, Dog))    # True   (class is subclass of itself)

# isinstance accepts a tuple of types
print(isinstance(d, (Dog, str)))  # True`,
    explanation: "`isinstance` respects inheritance and is the idiomatic check; `type(x) is T` is an exact match that rejects subclasses; `issubclass` compares classes, not instances — always prefer `isinstance` unless you genuinely need the exact type.",
  },
  {
    id: "py-0520-b1-abstract-property",
    language: "python",
    title: "abstract property enforcement",
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
    def __init__(self, radius: float):
        self.radius = radius

    @property
    def area(self) -> float:
        import math
        return math.pi * self.radius ** 2

    @property
    def perimeter(self) -> float:
        import math
        return 2 * math.pi * self.radius

# Shape()   → TypeError: Can't instantiate abstract class
c = Circle(5)
print(f"{c.area:.2f}")       # 78.54`,
    explanation: "Stacking `@property` and `@abstractmethod` (in that order) forces subclasses to provide a concrete property — omitting either decorator in the subclass raises `TypeError` at instantiation time.",
  },
  {
    id: "py-0520-b1-functools-reduce",
    language: "python",
    title: "functools.reduce for left fold",
    tag: "snippet",
    code: `from functools import reduce
import operator

nums = [1, 2, 3, 4, 5]

product = reduce(operator.mul, nums)
print(product)   # 120

# With initial value
total = reduce(operator.add, nums, 100)
print(total)     # 115

# Practical: flatten one level
nested = [[1, 2], [3, 4], [5]]
flat = reduce(lambda acc, lst: acc + lst, nested, [])
print(flat)   # [1, 2, 3, 4, 5]`,
    explanation: "`reduce(fn, iterable, initial)` applies `fn` cumulatively left-to-right; the `initial` makes the result defined for empty iterables and serves as the fold's identity element — for simple cases, `sum`, `max`, or `all` are clearer.",
  },
  {
    id: "py-0520-b1-for-else",
    language: "python",
    title: "else clause on a for loop",
    tag: "understanding",
    code: `def find_prime_factor(n: int) -> int | None:
    for i in range(2, int(n**0.5) + 1):
        if n % i == 0:
            return i   # exits without hitting else
    else:
        # runs only if loop completed without 'break'
        return None

print(find_prime_factor(15))   # 3
print(find_prime_factor(17))   # None  (17 is prime)

# Common pattern: search-then-act
for item in [1, 3, 5]:
    if item % 2 == 0:
        break
else:
    print("no even number found")   # prints`,
    explanation: "The `else` block on a `for` loop runs only when the loop ends normally (not via `break`) — it's a compact way to detect search failures without a sentinel flag variable.",
  },
  {
    id: "py-0520-b1-memoryview",
    language: "python",
    title: "memoryview for zero-copy slicing",
    tag: "structures",
    code: `data = bytearray(b"hello world")

mv = memoryview(data)

# Slice without copying
chunk = mv[6:11]
print(bytes(chunk))       # b'world'

# Modify through the view
mv[0:5] = b"howdy"
print(data)               # bytearray(b'howdy world')

# Works with bytes too (read-only)
ro = memoryview(b"immutable")
print(bytes(ro[2:5]))     # b'mut'`,
    explanation: "`memoryview` exposes a buffer object's memory without copying, letting you slice and modify large byte arrays in-place — critical when passing chunks of a large buffer to I/O functions or struct-packing operations.",
  },
  {
    id: "py-0520-b1-is-vs-eq-strings",
    language: "python",
    title: "string interning and is vs ==",
    tag: "caveats",
    code: `a = "hello"
b = "hello"
print(a is b)   # True  (interned — same object in CPython)

# Non-interned strings
x = "hello world"
y = "hello world"
print(x is y)   # may be True or False (implementation-defined)
print(x == y)   # True  (always correct for value equality)

# Dynamic strings are not interned
import sys
s = sys.intern("dynamic " + "string")   # force intern
t = sys.intern("dynamic " + "string")
print(s is t)   # True  (after intern)`,
    explanation: "CPython interns short, identifier-like string literals, so `is` may return `True` for equal strings — but this is an implementation detail; always use `==` to compare string values and reserve `is` for identity checks (e.g., `is None`).",
  },
  {
    id: "py-0520-b1-final-constant",
    language: "python",
    title: "Final for constants and frozen attributes",
    tag: "types",
    code: `from typing import Final

# Module-level constant
MAX_RETRIES: Final = 3
# MAX_RETRIES = 5  → type error

# Class-level constant
class Config:
    DEBUG: Final[bool] = False
    VERSION: Final = "1.0.0"

# Final in __init__ — can only be assigned once
class Point:
    def __init__(self, x: float, y: float) -> None:
        self.x: Final = x
        self.y: Final = y`,
    explanation: "`Final` tells type checkers that a variable shouldn't be reassigned after its initial value; it doesn't enforce this at runtime, but mypy and pyright flag any subsequent assignment as an error.",
  },
  {
    id: "py-0520-b1-format-fstring-template",
    language: "python",
    title: "% vs .format() vs f-string vs Template",
    tag: "families",
    code: `name, score = "Alice", 98.5

# Old-style % (printf-style)
print("%-10s: %.1f" % (name, score))

# str.format() — flexible, positional or named
print("{name:10s}: {score:.1f}".format(name=name, score=score))

# f-string (Python 3.6+) — fast, inline expressions
print(f"{name:10s}: {score:.1f}")

# string.Template — safe for untrusted input (no code execution)
from string import Template
t = Template("$name: $score")
print(t.substitute(name=name, score=score))`,
    explanation: "f-strings are the fastest and most readable for trusted code; `str.Template` is the only safe choice for user-supplied format strings because it doesn't evaluate arbitrary expressions — `%` and `.format()` are legacy but still useful for compatibility.",
  },
  {
    id: "py-0520-b1-class-getitem",
    language: "python",
    title: "__class_getitem__ for generic-style indexing",
    tag: "classes",
    code: `class TypedList:
    def __class_getitem__(cls, item):
        # Called when you write TypedList[int]
        return type(f"TypedList[{item.__name__}]", (cls,), {"_type": item})

IntList = TypedList[int]
print(IntList._type)      # <class 'int'>
print(IntList.__name__)   # TypedList[int]

# Built-in generics use the same hook
print(list[int])          # list[int]
print(dict[str, int])     # dict[str, int]`,
    explanation: "`__class_getitem__` is called by the subscript syntax `MyClass[T]`, enabling user-defined classes to participate in generic type expressions; built-ins like `list` and `dict` use this same mechanism for their PEP 585 generic aliases.",
  },
  {
    id: "py-0520-b1-re-findall-groups",
    language: "python",
    title: "re.findall with capturing groups",
    tag: "snippet",
    code: `import re

text = "2026-05-20 meeting, 2026-05-21 deadline"

# No groups: returns list of full matches
print(re.findall(r"\\d{4}-\\d{2}-\\d{2}", text))
# ['2026-05-20', '2026-05-21']

# One group: returns list of group(1) strings
print(re.findall(r"(\\d{4})-(\\d{2})-(\\d{2})", text))
# [('2026', '05', '20'), ('2026', '05', '21')]

# Named groups via finditer
for m in re.finditer(r"(?P<year>\\d{4})-(?P<month>\\d{2})-(?P<day>\\d{2})", text):
    print(m.group("year"), m.group("month"))`,
    explanation: "`re.findall` returns full matches when there are no groups, but when capturing groups are present it returns a list of group tuples — use `finditer` when you also need match positions or want named group access.",
  },
  {
    id: "py-0520-b1-list-multiply",
    language: "python",
    title: "list multiplication creates aliases",
    tag: "understanding",
    code: `# Flat values are copied (immutable, so aliasing is harmless)
row = [0] * 5
print(row)        # [0, 0, 0, 0, 0]

# Nested mutable objects are all the SAME reference
grid = [[0] * 3] * 3
grid[0][0] = 9
print(grid)       # [[9, 0, 0], [9, 0, 0], [9, 0, 0]]

# Fix: list comprehension creates separate lists
grid = [[0] * 3 for _ in range(3)]
grid[0][0] = 9
print(grid)       # [[9, 0, 0], [0, 0, 0], [0, 0, 0]]`,
    explanation: "`[x] * n` creates n references to the same object — harmless for immutable `x` (integers, strings), but a subtle bug for mutable objects like lists; always use a list comprehension to create independent mutable rows.",
  },
  {
    id: "py-0520-b1-range-object",
    language: "python",
    title: "range is O(1) memory regardless of size",
    tag: "structures",
    code: `import sys

r = range(10_000_000)
print(sys.getsizeof(r))         # 48 bytes — always constant!
print(sys.getsizeof(list(r)))   # ~80 MB

# range supports membership testing in O(1)
print(999_999 in r)     # True  (computed, not searched)
print(10_000_001 in r)  # False

# range supports len, indexing, slicing — all O(1)
print(r[5_000_000])     # 5000000
print(len(r))           # 10000000`,
    explanation: "`range` is a lazy sequence that stores only start, stop, and step — membership testing and indexing are O(1) arithmetic operations, making it ideal for representing large integer sequences without materializing them.",
  },
  {
    id: "py-0520-b1-copy-vs-deepcopy",
    language: "python",
    title: "shallow copy vs deep copy for nested structures",
    tag: "caveats",
    code: `import copy

original = {"a": [1, 2, 3], "b": [4, 5]}

shallow = copy.copy(original)        # copies top-level dict
deep    = copy.deepcopy(original)    # recursively copies everything

original["a"].append(99)

print(shallow["a"])   # [1, 2, 3, 99]  — inner list is shared
print(deep["a"])      # [1, 2, 3]      — fully independent`,
    explanation: "`copy.copy` duplicates the container but shares the inner objects; `copy.deepcopy` recursively duplicates everything — use deep copy when you need complete independence from the original, at the cost of more memory and time.",
  },
  {
    id: "py-0520-b1-int-bool-subtype",
    language: "python",
    title: "int/float/complex type promotion chain",
    tag: "types",
    code: `print(type(1 + 1))       # <class 'int'>
print(type(1 + 1.0))     # <class 'float'>
print(type(1.0 + 1j))    # <class 'complex'>

# Numeric tower: bool → int → float → complex
print(isinstance(True, int))     # True
print(isinstance(1, float))      # False  (no implicit subtype)

# Division always yields float
print(type(4 / 2))    # <class 'float'>  (even when exact)
print(type(4 // 2))   # <class 'int'>    (floor division)`,
    explanation: "Python's numeric promotion follows the abstract numeric tower: operations between types promote to the 'higher' type — but `int` is not a subtype of `float` at the class level, only at the conceptual level for arithmetic.",
  },
  {
    id: "py-0520-b1-set-frozenset-dict-keys",
    language: "python",
    title: "set vs frozenset vs dict_keys",
    tag: "families",
    code: `s  = {1, 2, 3}                    # mutable, not hashable
fs = frozenset([1, 2, 3])         # immutable, hashable
d  = {1: "a", 2: "b", 3: "c"}
dk = d.keys()                     # dict_keys: live view, set-like

# All support set operations
print(dk & s)         # {1, 2, 3}
print(dk - {2})       # {1, 3}

# dict_keys reflects changes to the dict
d[4] = "d"
print(dk)             # dict_keys([1, 2, 3, 4])

# Only frozenset can be a dict key
lookup = {fs: "group"}`,
    explanation: "`dict_keys` is a live set-like view (O(1) lookup, supports set algebra) but reflects mutations to the dict — use it when you want set operations on current keys without copying; use `frozenset` when you need the result to be hashable.",
  },
  {
    id: "py-0520-b1-dunder-enter-exit",
    language: "python",
    title: "context manager protocol with __enter__ / __exit__",
    tag: "classes",
    code: `class Timer:
    def __enter__(self):
        import time
        self._start = time.perf_counter()
        return self          # value bound to 'as' target

    def __exit__(self, exc_type, exc_val, exc_tb):
        import time
        elapsed = time.perf_counter() - self._start
        print(f"Elapsed: {elapsed:.4f}s")
        return False         # False = don't suppress exceptions

with Timer() as t:
    total = sum(range(1_000_000))

print(total)  # 499999500000`,
    explanation: "`__enter__` sets up the context and returns the value for the `as` clause; `__exit__` always runs at block exit, receiving exception info if one occurred — returning `True` suppresses the exception, `False` (or `None`) re-raises it.",
  },
  {
    id: "py-0520-b1-enumerate-start",
    language: "python",
    title: "enumerate with a custom start",
    tag: "snippet",
    code: `fruits = ["apple", "banana", "cherry"]

# Default start=0
for i, fruit in enumerate(fruits):
    print(i, fruit)   # 0 apple, 1 banana, 2 cherry

# 1-indexed output
for i, fruit in enumerate(fruits, start=1):
    print(f"{i}. {fruit}")   # 1. apple, 2. banana, 3. cherry

# Useful for numbered menus, rankings
ranking = dict(enumerate(fruits, 1))
print(ranking)   # {1: 'apple', 2: 'banana', 3: 'cherry'}`,
    explanation: "`enumerate(iterable, start=N)` generates `(N, item0), (N+1, item1), ...` — the `start` parameter avoids the common `i = 1; for x in xs: use i; i += 1` anti-pattern.",
  },
  {
    id: "py-0520-b1-dict-pop-default",
    language: "python",
    title: "dict.pop vs del for safe removal",
    tag: "understanding",
    code: `d = {"a": 1, "b": 2, "c": 3}

# del raises KeyError if key is absent
try:
    del d["z"]
except KeyError as e:
    print(e)   # 'z'

# dict.pop returns value and accepts a default
val = d.pop("a", None)   # safe, returns 1
val = d.pop("z", None)   # safe, returns None
print(val)               # None

# pop without default still raises KeyError
try:
    d.pop("missing")
except KeyError:
    print("not found")`,
    explanation: "`dict.pop(key, default)` removes and returns the value, returning the default (instead of raising) if the key is absent — use it over `del` when you're not sure the key exists and want to avoid a try/except.",
  },
  {
    id: "py-0520-b1-io-stringio",
    language: "python",
    title: "io.StringIO as an in-memory text file",
    tag: "structures",
    code: `import io, csv

output = io.StringIO()
writer = csv.writer(output)
writer.writerow(["name", "score"])
writer.writerow(["Alice", 95])
writer.writerow(["Bob", 87])

csv_text = output.getvalue()
print(repr(csv_text))
# 'name,score\\r\\nAlice,95\\r\\nBob,87\\r\\n'

# Read back from the same buffer
output.seek(0)
reader = csv.reader(output)
for row in reader:
    print(row)`,
    explanation: "`io.StringIO` is an in-memory file that any text-mode I/O API can write to or read from — useful for capturing output from code that expects a file object without writing to disk.",
  },
  {
    id: "py-0520-b1-global-keyword",
    language: "python",
    title: "global keyword rebinds module-level name",
    tag: "caveats",
    code: `count = 0

def increment():
    global count
    count += 1     # modifies module-level variable

def broken():
    # Without 'global', this creates a local 'count'
    # then tries to read it before assignment → UnboundLocalError
    count += 1     # UnboundLocalError!

increment()
increment()
print(count)   # 2

try:
    broken()
except UnboundLocalError as e:
    print(e)   # local variable 'count' referenced before assignment`,
    explanation: "Python decides at compile time whether a name is local (if assigned anywhere in the function) — without `global`, assigning to `count` makes the entire function treat it as local, causing an `UnboundLocalError` even when reading it first.",
  },
  {
    id: "py-0520-b1-overload-decorator",
    language: "python",
    title: "@overload for type-safe polymorphic functions",
    tag: "types",
    code: `from typing import overload

@overload
def process(x: int) -> str: ...
@overload
def process(x: str) -> int: ...

def process(x: int | str) -> str | int:
    if isinstance(x, int):
        return str(x)
    return len(x)

result1: str = process(42)      # type checker knows it's str
result2: int = process("hello") # type checker knows it's int`,
    explanation: "`@overload` stubs tell type checkers the exact output type for each input type — only the implementation (without `@overload`) is executed at runtime, but type checkers use the overloads to infer precise return types.",
  },
  {
    id: "py-0520-b1-try-except-else-finally",
    language: "python",
    title: "try/except/else/finally — all four clauses",
    tag: "families",
    code: `def read_config(path: str) -> dict:
    f = None
    try:
        f = open(path)
        data = f.read()           # may raise IOError
    except IOError as e:
        print(f"IO error: {e}")   # only if try block raises
        return {}
    else:
        import json
        return json.loads(data)   # only if try block did NOT raise
    finally:
        if f:
            f.close()             # ALWAYS runs, even after return`,
    explanation: "The `else` block runs only when the `try` block completes without an exception — it separates 'code that can raise' from 'code that should run on success'; `finally` is the teardown that runs regardless of what happened.",
  },
  {
    id: "py-0520-b1-eq-hash-contract",
    language: "python",
    title: "defining __eq__ invalidates __hash__",
    tag: "classes",
    code: `class BadPoint:
    def __init__(self, x, y):
        self.x, self.y = x, y
    def __eq__(self, other):
        return (self.x, self.y) == (other.x, other.y)
    # Python sets __hash__ = None when you define __eq__ without __hash__

p = BadPoint(1, 2)
try:
    {p}   # TypeError: unhashable type: 'BadPoint'
except TypeError as e:
    print(e)

class GoodPoint(BadPoint):
    def __hash__(self):
        return hash((self.x, self.y))

q = GoodPoint(1, 2)
print({q})   # {<GoodPoint ...>}`,
    explanation: "Python automatically sets `__hash__ = None` when you define `__eq__` without also defining `__hash__`, making instances unhashable — always pair them, using a tuple of the same fields for both equality and hashing.",
  },
  {
    id: "py-0520-b1-any-all-short",
    language: "python",
    title: "any() and all() with short-circuit evaluation",
    tag: "snippet",
    code: `def is_positive(n):
    print(f"checking {n}")
    return n > 0

nums = [1, 2, -3, 4]

# any() stops at first True
print(any(is_positive(n) for n in nums))
# checking 1 → True (stops after 1)

# all() stops at first False
print(all(is_positive(n) for n in nums))
# checking 1, checking 2, checking -3 → False (stops at -3)

# Empty sequences:
print(any([]))   # False
print(all([]))   # True (vacuously true)`,
    explanation: "`any` and `all` short-circuit over generators, so expensive or side-effectful predicates are only evaluated as far as necessary — passing a generator expression (not a list) is essential for this optimization.",
  },
  {
    id: "py-0520-b1-ternary-precedence",
    language: "python",
    title: "conditional expression precedence surprise",
    tag: "understanding",
    code: `x = 5

# Reads as: (x if x > 0 else -x) ... but how does this parse?
result = x * 2 if x > 0 else x * -1
# Parsed as: (x * 2) if (x > 0) else (x * -1)
print(result)   # 10

# Assignment is lower precedence than ternary
a = b = 1 if True else 2
print(a, b)   # 1 1  (assigns 1 to both, NOT b = (1 if True else 2) to a)

# Chained ternary (usually avoid)
label = "neg" if x < 0 else "zero" if x == 0 else "pos"
print(label)   # pos`,
    explanation: "The conditional expression `A if C else B` has very low precedence — lower than most operators but higher than assignment — so `x * 2 if cond else y` is `(x * 2) if cond else y`, not `x * (2 if cond else y)`.",
  },
  {
    id: "py-0520-b1-namedtuple-make",
    language: "python",
    title: "NamedTuple._make and _asdict",
    tag: "structures",
    code: `from collections import namedtuple

Point = namedtuple("Point", ["x", "y", "z"])

# _make: create from any iterable
data = [1.0, 2.0, 3.0]
p = Point._make(data)
print(p)   # Point(x=1.0, y=2.0, z=3.0)

# _asdict: convert to OrderedDict/dict
print(p._asdict())   # {'x': 1.0, 'y': 2.0, 'z': 3.0}

# _replace: create modified copy (immutable)
p2 = p._replace(z=99.0)
print(p2)   # Point(x=1.0, y=2.0, z=99.0)
print(p)    # Point(x=1.0, y=2.0, z=3.0)  (unchanged)`,
    explanation: "`_make` is the class method alternative to unpacking-based construction; `_asdict` gives a plain dict for JSON serialisation; `_replace` is the immutable update pattern — all are underscore-prefixed to avoid clashing with field names.",
  },
  {
    id: "py-0520-b1-is-none-vs-eq-none",
    language: "python",
    title: "is None vs == None",
    tag: "understanding",
    code: `class Tricky:
    def __eq__(self, other):
        return True   # equal to everything, including None

t = Tricky()
print(t == None)   # True  (calls __eq__)
print(t is None)   # False (identity check, bypasses __eq__)

# PEP 8: always use 'is None' / 'is not None'
def safe_check(value):
    if value is None:       # correct
        return "absent"
    if value == None:       # risky — custom __eq__ can lie
        return "also absent"`,
    explanation: "`is None` is an identity check that cannot be overridden — it tests whether the object is literally the singleton `None`; `== None` calls `__eq__` which user classes can override to return any value, making it unreliable.",
  },
  {
    id: "py-0520-b1-chainmap-lookup",
    language: "python",
    title: "ChainMap for layered configuration",
    tag: "structures",
    code: `from collections import ChainMap
import os

defaults = {"debug": False, "timeout": 30, "host": "localhost"}
env_overrides = {k.lower(): v for k, v in os.environ.items()
                 if k in ("DEBUG", "TIMEOUT")}
cli_args = {"timeout": 5}   # highest priority

config = ChainMap(cli_args, env_overrides, defaults)
print(config["timeout"])   # 5       (from cli_args)
print(config["debug"])     # False   (from defaults)

# Writes go to the first map
config["new_key"] = "value"
print(cli_args)   # {'timeout': 5, 'new_key': 'value'}`,
    explanation: "`ChainMap` stacks multiple dicts so reads check each in order (highest-priority first) while writes always go to the first map — it's ideal for layered configurations (CLI > env > defaults) without copying or merging.",
  },
  {
    id: "py-0520-b1-recursive-repr",
    language: "python",
    title: "guarding against recursive __repr__",
    tag: "caveats",
    code: `class Node:
    def __init__(self, val, children=None):
        self.val = val
        self.children = children or []

    def __repr__(self):
        return f"Node({self.val!r}, {self.children!r})"

# Circular reference crashes repr
a = Node(1)
b = Node(2)
a.children.append(b)
b.children.append(a)  # cycle

import reprlib
print(reprlib.repr(a))  # truncated, safe

# Guard with a thread-local set in custom __repr__
import threading
_repr_running = threading.local()

class SafeNode(Node):
    def __repr__(self):
        key = id(self)
        if getattr(_repr_running, "ids", None) is None:
            _repr_running.ids = set()
        if key in _repr_running.ids:
            return f"SafeNode({self.val!r}, [...])"
        _repr_running.ids.add(key)
        try:
            return f"SafeNode({self.val!r}, {self.children!r})"
        finally:
            _repr_running.ids.discard(key)`,
    explanation: "A `__repr__` that recurses into child objects will crash with `RecursionError` on cyclic graphs; the guard pattern tracks in-progress `id(self)` values in a thread-local set and falls back to a placeholder string.",
  },
  {
    id: "py-0520-b1-exec-eval-compile",
    language: "python",
    title: "eval vs exec vs compile",
    tag: "families",
    code: `# eval: evaluates a single expression, returns its value
result = eval("2 ** 10")
print(result)   # 1024

# exec: executes statements, returns None
exec("x = 42")
print(x)        # 42  (side effect: name added to locals)

# compile: pre-compiles source to a code object (reusable)
code = compile("1 + 2", "<string>", "eval")
print(eval(code))   # 3

# Security: never eval/exec untrusted input
# Restrict globals for eval
safe = eval("len('hello')", {"__builtins__": {}}, {"len": len})
print(safe)   # 5`,
    explanation: "`eval` is for single expressions that produce a value; `exec` is for full statements or blocks; `compile` pre-parses the source so repeated execution is faster — all three execute arbitrary Python, so only use them on trusted input.",
  },
  {
    id: "py-0520-b1-repr-str-dunder",
    language: "python",
    title: "__repr__ vs __str__",
    tag: "classes",
    code: `class Color:
    def __init__(self, r, g, b):
        self.r, self.g, self.b = r, g, b

    def __repr__(self):
        return f"Color({self.r}, {self.g}, {self.b})"  # unambiguous, eval-able

    def __str__(self):
        return f"#{self.r:02x}{self.g:02x}{self.b:02x}"  # human-friendly

c = Color(255, 128, 0)
print(repr(c))   # Color(255, 128, 0)
print(str(c))    # #ff8000
print(c)         # #ff8000  (str() used by print)
print([c])       # [Color(255, 128, 0)]  (repr used inside containers)`,
    explanation: "`__repr__` should produce an unambiguous string that ideally could recreate the object; `__str__` should be human-readable — when only `__repr__` is defined it serves as the fallback for both, which is why libraries often skip `__str__`.",
  },
  {
    id: "py-0520-b1-str-maketrans",
    language: "python",
    title: "str.maketrans for multi-character substitution",
    tag: "snippet",
    code: `# Map individual characters
table = str.maketrans(
    "aeiou",        # from characters
    "12345",        # to characters
    " "             # delete characters
)
print("hello world".translate(table))  # '12ll4w4rld'

# Map characters to strings (unicode ordinals as keys)
rot13 = str.maketrans(
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
    "NOPQRSTUVWXYZABCDEFGHIJKLMnopqrstuvwxyzabcdefghijklm"
)
print("Hello!".translate(rot13))   # 'Uryyb!'`,
    explanation: "`str.maketrans` builds a translation table for `str.translate` — the three-argument form handles substitution and deletion in one step, and the table can map to multi-character strings or `None` (delete) for any character.",
  },
  {
    id: "py-0520-b1-bytes-ord",
    language: "python",
    title: "indexing bytes gives an integer, not a byte",
    tag: "understanding",
    code: `b = b"hello"
print(b[0])       # 104  (int — ASCII for 'h')
print(type(b[0])) # <class 'int'>

# Slicing still gives bytes
print(b[0:1])     # b'h'
print(type(b[0:1]))  # <class 'bytes'>

# Iterating also yields integers
for byte in b"abc":
    print(byte)   # 97, 98, 99

# Convert single int back to bytes
print(bytes([104]))   # b'h'`,
    explanation: "Indexing a `bytes` object returns an `int` (0–255), not a single-byte `bytes` object — this differs from `str` where indexing returns a length-1 string; use `b[i:i+1]` when you need a `bytes` slice of length 1.",
  },
  {
    id: "py-0520-b1-counter-arithmetic",
    language: "python",
    title: "Counter arithmetic and set operations",
    tag: "structures",
    code: `from collections import Counter

a = Counter("aabbc")
b = Counter("abcd")

print(a + b)    # Counter({'a': 3, 'b': 3, 'c': 2, 'd': 1})  # union sum
print(a - b)    # Counter({'a': 1, 'b': 1})  # subtract, drop ≤ 0
print(a & b)    # Counter({'a': 1, 'b': 1})  # intersection (min)
print(a | b)    # Counter({'a': 2, 'b': 2, 'c': 1, 'd': 1})  # union (max)

# Useful: check if one multiset contains another
print((a - b).total() == 0)  # False: a doesn't fully contain b`,
    explanation: "`Counter` supports multiset arithmetic: `+` sums counts, `-` subtracts (dropping non-positives), `&` takes the minimum count, `|` takes the maximum — powerful for anagram checks, inventory diffs, and multiset containment tests.",
  },
  {
    id: "py-0520-b1-star-import-shadowing",
    language: "python",
    title: "from module import * can shadow builtins",
    tag: "caveats",
    code: `# In a fresh Python session:
# from math import *  would import: sin, cos, pi, ...
# BUT also: 'log', 'pow', 'abs', 'round' — shadowing builtins!

from math import *
print(pow(2, 3))   # 8.0 (math.pow, not builtin pow — always float)
print(abs(-1))     # 1   (math.abs doesn't exist; builtin abs still works)

# Safer: explicit import
from math import sqrt, pi
print(sqrt(2))   # 1.4142...`,
    explanation: "`from module import *` imports all public names into the current namespace, silently overriding any name that was already bound — this is why `math.pow` shadows the builtin `pow` (which supports integers), returning a float always.",
  },
  {
    id: "py-0520-b1-str-bytes-type",
    language: "python",
    title: "str vs bytes — encoding and decoding",
    tag: "types",
    code: `text = "café"
encoded = text.encode("utf-8")   # str → bytes
print(encoded)           # b'caf\\xc3\\xa9'
print(len(encoded))      # 5  (é is 2 bytes in UTF-8)
print(len(text))         # 4  (str counts Unicode code points)

decoded = encoded.decode("utf-8")  # bytes → str
print(decoded)           # 'café'
print(decoded == text)   # True

# Mixing str and bytes raises TypeError
try:
    text + encoded
except TypeError as e:
    print(e)   # can only concatenate str (not "bytes") to str`,
    explanation: "`str` stores Unicode code points (not bytes), so `len('café')` is 4 not 5; encoding to UTF-8 may produce more bytes than characters — always `.encode()` to get bytes and `.decode()` to get text, never mix the two types.",
  },
  {
    id: "py-0520-b1-print-vs-logging",
    language: "python",
    title: "print vs logging module",
    tag: "families",
    code: `import logging

# Configure once at startup
logging.basicConfig(
    level=logging.DEBUG,
    format="%(levelname)s:%(name)s:%(message)s"
)
log = logging.getLogger("mymodule")

# print: simple, no level, no routing, always visible
print("debug info")            # bypasses logging configuration

# logging: levels, filtering, handlers, formatting
log.debug("detail only in DEBUG mode")
log.info("normal operation")
log.warning("something unexpected")
log.error("recoverable failure")
log.critical("unrecoverable error")`,
    explanation: "Use `print` for scripts and interactive exploration; use `logging` for any library or application code — it gives you level-based filtering, multiple handlers (file, console, remote), and structured context without changing call sites.",
  },
  {
    id: "py-0520-b1-metaclass-new",
    language: "python",
    title: "metaclass __new__ for class-level validation",
    tag: "classes",
    code: `class RequireDocstring(type):
    def __new__(mcs, name, bases, namespace):
        if not namespace.get("__doc__"):
            raise TypeError(f"Class {name!r} must have a docstring")
        return super().__new__(mcs, name, bases, namespace)

class Good(metaclass=RequireDocstring):
    """This class is well-documented."""
    pass

try:
    class Bad(metaclass=RequireDocstring):
        pass
except TypeError as e:
    print(e)   # Class 'Bad' must have a docstring`,
    explanation: "A metaclass's `__new__` intercepts class creation, letting you enforce conventions (docstrings, required methods, naming) at class definition time rather than at instantiation — lighter-weight than `__init_subclass__` for validating the class namespace.",
  },
  {
    id: "py-0520-b1-typeguard-narrowing",
    language: "python",
    title: "TypeGuard for custom type narrowing",
    tag: "types",
    code: `from typing import TypeGuard

def is_list_of_str(val: list[object]) -> TypeGuard[list[str]]:
    return all(isinstance(x, str) for x in val)

def process(items: list[object]) -> None:
    if is_list_of_str(items):
        # type checker now knows items: list[str]
        print(items[0].upper())   # safe — no type error
    else:
        print("not all strings")

process(["hello", "world"])   # HELLO`,
    explanation: "`TypeGuard[T]` as a return type annotation tells type checkers that when the function returns `True`, the argument is narrowed to `T` — useful for runtime checks that encode domain knowledge the type system can't infer automatically.",
  },
  {
    id: "py-0520-b1-contextlib-suppress",
    language: "python",
    title: "contextlib.suppress for ignoring specific errors",
    tag: "snippet",
    code: `from contextlib import suppress
import os

# Verbose way:
try:
    os.remove("nonexistent.txt")
except FileNotFoundError:
    pass

# Concise way:
with suppress(FileNotFoundError):
    os.remove("nonexistent.txt")

# Multiple exception types:
with suppress(FileNotFoundError, PermissionError):
    os.remove("/protected/file.txt")`,
    explanation: "`contextlib.suppress` is a context manager that silently swallows the specified exception types — cleaner than an empty `except` block and self-documenting about which errors are intentionally ignored.",
  },
  {
    id: "py-0520-b1-functools-cache",
    language: "python",
    title: "functools.cache — unbounded memoization",
    tag: "snippet",
    code: `import functools

@functools.cache   # Python 3.9+ alias for lru_cache(maxsize=None)
def fib(n: int) -> int:
    if n < 2:
        return n
    return fib(n - 1) + fib(n - 2)

print(fib(50))   # 12586269025  (instant, not exponential)
print(fib.cache_info())
# CacheInfo(hits=48, misses=51, maxsize=None, currsize=51)

fib.cache_clear()   # evict all cached results`,
    explanation: "`functools.cache` wraps a function with an unbounded dictionary-backed cache keyed on the arguments — arguments must be hashable; use `lru_cache(maxsize=N)` if you need to bound memory usage.",
  },
  {
    id: "py-0520-b1-pathlib-glob",
    language: "python",
    title: "pathlib for filesystem operations",
    tag: "snippet",
    code: `from pathlib import Path

p = Path("/tmp/demo")
p.mkdir(parents=True, exist_ok=True)

# Write and read
(p / "hello.txt").write_text("hello world")
content = (p / "hello.txt").read_text()
print(content)   # hello world

# Glob: find all .txt files recursively
for f in p.rglob("*.txt"):
    print(f.name, f.stat().st_size)

# Path arithmetic
child = p / "subdir" / "file.py"
print(child.suffix)   # .py
print(child.stem)     # file
print(child.parent)   # /tmp/demo/subdir`,
    explanation: "`pathlib.Path` replaces `os.path` string juggling with an object-oriented API — `/` for joining, `.read_text()`/`.write_text()` for I/O, `.glob()`/`.rglob()` for pattern matching, all with clear, chainable syntax.",
  },
  {
    id: "py-0520-b1-dataclass-frozen",
    language: "python",
    title: "frozen dataclass as hashable value object",
    tag: "classes",
    code: `from dataclasses import dataclass

@dataclass(frozen=True)
class Point:
    x: float
    y: float

p1 = Point(1.0, 2.0)
p2 = Point(1.0, 2.0)

print(p1 == p2)     # True  (value equality)
print(hash(p1))     # consistent hash (uses x and y)
print(hash(p1) == hash(p2))  # True

# Can be used in sets and as dict keys
points = {p1, p2}
print(len(points))  # 1

try:
    p1.x = 99       # raises FrozenInstanceError
except Exception as e:
    print(e)`,
    explanation: "`frozen=True` makes the dataclass immutable (generates `__setattr__`/`__delattr__` that raise errors) and enables `__hash__` generation — essential when you want a value-typed dataclass that can live in a set or serve as a dict key.",
  },
  {
    id: "py-0520-b1-sorted-key-lambda",
    language: "python",
    title: "sorted with complex key and reverse",
    tag: "snippet",
    code: `data = [
    {"name": "Charlie", "score": 85, "age": 28},
    {"name": "Alice",   "score": 92, "age": 24},
    {"name": "Bob",     "score": 85, "age": 31},
]

# Sort by score descending, then name ascending (stable sort preserves equal)
result = sorted(data, key=lambda d: (-d["score"], d["name"]))
for r in result:
    print(r["name"], r["score"])
# Alice 92
# Bob   85
# Charlie 85`,
    explanation: "Negate numeric keys to reverse just that field without `reverse=True` (which would flip all keys) — Python's sort is stable, so equal primary keys preserve the relative order from the previous sort step.",
  },
  {
    id: "py-0520-b1-match-case-guard",
    language: "python",
    title: "structural pattern matching with guard",
    tag: "snippet",
    code: `def classify_point(point):
    match point:
        case (0, 0):
            return "origin"
        case (x, 0):
            return f"x-axis at x={x}"
        case (0, y):
            return f"y-axis at y={y}"
        case (x, y) if x == y:
            return f"diagonal at {x}"
        case (x, y):
            return f"point ({x}, {y})"

print(classify_point((0, 0)))   # origin
print(classify_point((3, 0)))   # x-axis at x=3
print(classify_point((5, 5)))   # diagonal at 5
print(classify_point((2, 7)))   # point (2, 7)`,
    explanation: "`match`/`case` (Python 3.10+) deconstructs sequences, mappings, and objects structurally; `if` guards narrow further after a pattern matches — capture variables in patterns are local to the case branch.",
  },
];
