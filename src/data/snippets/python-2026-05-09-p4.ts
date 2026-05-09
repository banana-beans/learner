import type { Snippet } from "./types";

export const pythonSnippets20260509P4: Snippet[] = [
  {
    id: "py-caveats-chained-not-in",
    language: "python",
    title: "not x in y vs x not in y: only one is idiomatic",
    tag: "caveats",
    code: `lst = [1, 2, 3]
x = 4

# Both are valid Python and produce the same result
print(not x in lst)   # True
print(x not in lst)   # True

# 'not ... in' is parsed as 'not (x in lst)'
# pylint/ruff flags 'not x in y' as non-idiomatic (E713)
# Prefer: x not in y  -- reads like English`,
    explanation: "'not in' is a single comparison operator in Python (like 'is not'); prefer it over 'not x in y' because it expresses the intent directly and avoids operator precedence confusion.",
  },
  {
    id: "py-types-protocol-structural",
    language: "python",
    title: "Protocol enables structural subtyping (duck typing + types)",
    tag: "types",
    code: `from typing import Protocol, runtime_checkable

@runtime_checkable
class Drawable(Protocol):
    def draw(self) -> str: ...

class Circle:
    def draw(self) -> str: return 'O'

class Square:
    def draw(self) -> str: return '#'

def render(shape: Drawable) -> None:
    print(shape.draw())

render(Circle())    # O
render(Square())    # #
print(isinstance(Circle(), Drawable))   # True`,
    explanation: "Protocols provide structural subtyping: any class with the right methods satisfies the Protocol without explicit inheritance. @runtime_checkable enables isinstance checks at runtime.",
  },
  {
    id: "py-families-threading-asyncio-cmp",
    language: "python",
    title: "threading vs multiprocessing vs asyncio: concurrency models",
    tag: "families",
    code: `# threading: I/O-bound tasks; GIL limits CPU parallelism
import threading

# multiprocessing: CPU-bound tasks; separate processes bypass GIL
import multiprocessing

# asyncio: single-threaded cooperative I/O via event loop
import asyncio

# Rule of thumb:
# - Network/disk I/O   -> threading or asyncio
# - CPU-heavy work     -> multiprocessing
# - Mixing both        -> asyncio + ProcessPoolExecutor

print('threading:', threading.active_count())
print('cpus:', multiprocessing.cpu_count())`,
    explanation: "The GIL prevents true thread parallelism for CPU-bound work; multiprocessing sidesteps it by using separate processes. asyncio handles high-concurrency I/O with a single thread via cooperative yielding.",
  },
  {
    id: "py-classes-abstract-method-property",
    language: "python",
    title: "Combining @abstractmethod with @property",
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
print(f'{c.area:.2f}')      # 78.54`,
    explanation: "Stacking @property on top of @abstractmethod forces subclasses to implement the property using the @property decorator; instantiating a concrete class without the property raises TypeError.",
  },
  {
    id: "py-snippet-int-to-base",
    language: "python",
    title: "Convert integers to different bases",
    tag: "snippet",
    code: `n = 255
print(bin(n))    # 0b11111111
print(oct(n))    # 0o377
print(hex(n))    # 0xff

print(format(n, 'b'))    # 11111111  (no prefix)
print(format(n, 'o'))    # 377
print(format(n, 'X'))    # FF (uppercase)

# Parse back with int(str, base)
print(int('ff', 16))      # 255
print(int('11111111', 2)) # 255`,
    explanation: "bin/oct/hex return strings with prefixes (0b, 0o, 0x); format() gives the digit-only representation. int(s, base) is the inverse, parsing any base from 2 to 36.",
  },
  {
    id: "py-understanding-str-immutable",
    language: "python",
    title: "Strings are immutable: every operation creates a new string",
    tag: "understanding",
    code: `s = 'hello'
# s[0] = 'H'   # TypeError: 'str' object does not support item assignment

upper = s.upper()
print(s)        # hello (unchanged)
print(upper)    # HELLO

# Concatenation in a loop is O(n^2) -- use join
parts = ['a', 'b', 'c', 'd']
good  = ', '.join(parts)   # single pass, O(n)
print(good)     # a, b, c, d`,
    explanation: "Python strings are immutable; every operation returns a new string object. Concatenating n strings with += copies all previous characters each time, making it O(n^2); str.join() builds the result in a single pass.",
  },
  {
    id: "py-structures-set-discard-vs-remove",
    language: "python",
    title: "set.discard vs set.remove: safe vs strict deletion",
    tag: "structures",
    code: `s = {1, 2, 3, 4, 5}

s.remove(3)       # removes 3; raises KeyError if absent
print(s)          # {1, 2, 4, 5}

s.discard(99)     # does nothing if 99 not in s (no error)
print(s)          # {1, 2, 4, 5}

try:
    s.remove(99)  # KeyError!
except KeyError:
    print('KeyError raised by remove')`,
    explanation: "set.remove raises KeyError when the element is absent; set.discard silently does nothing. Use discard when absence is expected; use remove when absence indicates a bug.",
  },
  {
    id: "py-types-runtime-checkable",
    language: "python",
    title: "@runtime_checkable allows isinstance checks on Protocols",
    tag: "types",
    code: `from typing import Protocol, runtime_checkable

@runtime_checkable
class HasLength(Protocol):
    def __len__(self) -> int: ...

print(isinstance([], HasLength))        # True
print(isinstance('hello', HasLength))   # True
print(isinstance(42, HasLength))        # False

# Without @runtime_checkable, isinstance raises TypeError
# Only checks for method presence, not signatures`,
    explanation: "@runtime_checkable enables isinstance/issubclass checks on Protocol classes; it only verifies the presence of required methods (not their signatures), so it's a shallow structural check.",
  },
  {
    id: "py-families-bytes-memview-cmp",
    language: "python",
    title: "bytes vs bytearray vs memoryview",
    tag: "families",
    code: `# bytes: immutable sequence of bytes
b = bytes([65, 66, 67])
print(b)           # b'ABC'

# bytearray: mutable bytes
ba = bytearray(b'hello')
ba[0] = 72
print(ba)          # bytearray(b'Hello')

# memoryview: zero-copy view into a buffer
mv = memoryview(ba)
print(mv[1:3].tobytes())   # b'el'
# Slicing memoryview doesn't copy the data`,
    explanation: "bytes is immutable like str; bytearray is its mutable counterpart; memoryview exposes the internal buffer of any object supporting the buffer protocol without copying, enabling zero-copy slicing.",
  },
  {
    id: "py-classes-dunder-add-op",
    language: "python",
    title: "__add__ and __radd__ implement the + operator",
    tag: "classes",
    code: `class Vec2:
    def __init__(self, x, y): self.x=x; self.y=y
    def __repr__(self): return f'Vec2({self.x}, {self.y})'
    def __add__(self, other):
        if isinstance(other, Vec2):
            return Vec2(self.x+other.x, self.y+other.y)
        return NotImplemented
    def __radd__(self, other):
        return self.__add__(other)

a = Vec2(1, 2)
b = Vec2(3, 4)
print(a + b)        # Vec2(4, 6)
print(sum([a, b], Vec2(0,0)))  # Vec2(4, 6)`,
    explanation: "__add__ handles left-operand cases (a + b); __radd__ is called when the left operand's __add__ returns NotImplemented, enabling your type to participate as the right operand too.",
  },
  {
    id: "py-snippet-zip-strict-usage",
    language: "python",
    title: "zip(strict=True) catches mismatched-length iterables",
    tag: "snippet",
    code: `names  = ['Alice', 'Bob', 'Carol']
scores = [95, 87, 91]

for n, s in zip(names, scores):
    print(n, s)

# strict=True raises ValueError if lengths differ (Python 3.10+)
try:
    list(zip(['a', 'b'], [1, 2, 3], strict=True))
except ValueError as e:
    print(e)   # zip() has arguments with different lengths`,
    explanation: "zip() by default truncates silently, which can hide bugs when two parallel lists should always be the same length; zip(strict=True) raises ValueError immediately when the lengths don't match.",
  },
  {
    id: "py-understanding-dict-update-order",
    language: "python",
    title: "dict.update processes keys left to right, last write wins",
    tag: "understanding",
    code: `base = {'a': 1, 'b': 2, 'c': 3}
base.update({'b': 20, 'd': 4})
print(base)   # {'a': 1, 'b': 20, 'c': 3, 'd': 4}

d = {}
d.update({'x': 1})
d.update({'x': 2})   # overwrites x
print(d)             # {'x': 2}

e = dict(base, b=999)
print(e['b'])  # 999`,
    explanation: "dict.update merges keys from the argument into the target; if a key already exists, the new value wins. The dict() constructor with a mapping plus keyword args follows the same last-write-wins rule.",
  },
  {
    id: "py-structures-dict-fromkeys",
    language: "python",
    title: "dict.fromkeys initialises a dict with a default value",
    tag: "structures",
    code: `keys = ['a', 'b', 'c', 'd']
zero_counts = dict.fromkeys(keys, 0)
print(zero_counts)   # {'a': 0, 'b': 0, 'c': 0, 'd': 0}

seen = dict.fromkeys('abcde')
print(seen)          # {'a': None, 'b': None, ...}

# WARNING: mutable default is shared (same bug as mutable default args)
bad = dict.fromkeys(keys, [])
bad['a'].append(1)
print(bad['b'])      # [1]  -- shared list!`,
    explanation: "dict.fromkeys(iterable, value) creates a new dict; the same value object is used for every key, so mutable defaults (lists, dicts) are shared -- use a dict comprehension with individual list() calls instead.",
  },
  {
    id: "py-caveats-none-comparison",
    language: "python",
    title: "Always compare to None with 'is', not '=='",
    tag: "caveats",
    code: `x = None

if x is None:
    print('x is None')   # this prints

if x is not None:
    print('has value')

# Some objects override __eq__ making '== None' unreliable
import numpy as np
arr = np.array([1, 2, 3])
# arr == None  returns array([False, False, False]) -- not a simple bool`,
    explanation: "None is a singleton; 'is None' tests object identity (always correct), while '== None' calls __eq__ which can be overridden -- NumPy arrays, for example, broadcast == across elements.",
  },
  {
    id: "py-types-typedalias",
    language: "python",
    title: "TypeAlias documents complex type signatures",
    tag: "types",
    code: `from typing import TypeAlias

Vector: TypeAlias = list[float]
Matrix: TypeAlias = list[list[float]]

def dot(a: Vector, b: Vector) -> float:
    return sum(x*y for x, y in zip(a, b))

# Python 3.12+ uses 'type' keyword
# type Vector = list[float]  -- cleaner, lazy evaluation

v1: Vector = [1.0, 2.0, 3.0]
v2: Vector = [4.0, 5.0, 6.0]
print(dot(v1, v2))   # 32.0`,
    explanation: "TypeAlias (PEP 613) makes the alias declaration explicit so type checkers don't confuse it with a variable assignment; Python 3.12+ introduced the type keyword as a cleaner alternative.",
  },
  {
    id: "py-families-functools-cmp",
    language: "python",
    title: "functools: partial, reduce, cache, total_ordering",
    tag: "families",
    code: `from functools import partial, reduce, cache

# partial: fix some arguments
double = partial(pow, exp=2)
print(double(base=5))             # 25

# cache: memoize any function (unbounded, 3.9+)
@cache
def fib(n): return n if n < 2 else fib(n-1) + fib(n-2)
print(fib(30))   # 832040

# reduce: fold a sequence
print(reduce(lambda a, b: a*b, range(1, 6)))   # 120 (5!)`,
    explanation: "functools is Python's standard library for higher-order function tools; partial creates argument-fixed callables, cache memoizes without a size limit, and reduce applies a binary function cumulatively.",
  },
  {
    id: "py-classes-descriptor-protocol",
    language: "python",
    title: "Descriptor protocol: __get__, __set__, __delete__",
    tag: "classes",
    code: `class Validated:
    def __set_name__(self, owner, name): self.name = name
    def __get__(self, obj, objtype=None):
        if obj is None: return self
        return obj.__dict__.get(self.name)
    def __set__(self, obj, value):
        if not isinstance(value, (int, float)):
            raise TypeError(f'{self.name} must be numeric')
        obj.__dict__[self.name] = value

class Measurement:
    value = Validated()

m = Measurement()
m.value = 3.14
print(m.value)    # 3.14
# m.value = 'x'  # TypeError`,
    explanation: "Descriptors are objects that customise attribute access by implementing __get__, __set__, or __delete__; they're the mechanism behind property, classmethod, staticmethod, and ORMs like SQLAlchemy.",
  },
  {
    id: "py-families-dataclass-vs-namedtuple",
    language: "python",
    title: "dataclass vs NamedTuple vs TypedDict: structured data options",
    tag: "families",
    code: `from dataclasses import dataclass
from typing import NamedTuple, TypedDict

@dataclass
class DCPoint: x: float; y: float

class NTPoint(NamedTuple): x: float; y: float

class TDPoint(TypedDict): x: float; y: float

dc = DCPoint(1, 2); nt = NTPoint(1, 2); td: TDPoint = {'x': 1, 'y': 2}
print(isinstance(nt, tuple))     # True
print(isinstance(dc, tuple))     # False
print(dc.x, nt.x, td['x'])      # 1.0 1.0 1.0`,
    explanation: "NamedTuple is a tuple subclass (unpackable, immutable, hashable by default); dataclass is a regular class with generated methods; TypedDict is just a plain dict with type annotations for type checkers only.",
  },
  {
    id: "py-snippet-conditional-expr",
    language: "python",
    title: "Conditional expression (ternary) in Python",
    tag: "snippet",
    code: `x = 10
sign = 'positive' if x > 0 else 'non-positive'
print(sign)    # positive

# Nested ternary (use sparingly)
category = 'high' if x > 100 else ('medium' if x > 50 else 'low')
print(category)  # low

# In list comprehension
labels = ['even' if n % 2 == 0 else 'odd' for n in range(6)]
print(labels)   # ['even', 'odd', 'even', 'odd', 'even', 'odd']`,
    explanation: "Python's conditional expression (a if condition else b) returns a when the condition is true, b otherwise; it's a single expression usable inside list comprehensions and assignments.",
  },
  {
    id: "py-caveats-global-keyword",
    language: "python",
    title: "global declares a name refers to the module-level variable",
    tag: "caveats",
    code: `counter = 0

def increment():
    global counter    # without this, counter would be local
    counter += 1

increment()
increment()
print(counter)   # 2

# Prefer: return new values instead of mutating globals
def pure_increment(c): return c + 1
counter = pure_increment(counter)`,
    explanation: "global is necessary to rebind a module-level name inside a function; without it, any assignment creates a new local variable and reads before the assignment raise UnboundLocalError. Prefer returning values over mutating globals.",
  },
];
