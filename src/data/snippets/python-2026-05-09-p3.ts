import type { Snippet } from "./types";

export const pythonSnippets20260509P3: Snippet[] = [
  {
    id: "py-understanding-generator-lazy",
    language: "python",
    title: "Generators are lazy: they yield on demand",
    tag: "understanding",
    code: `def lazy_squares(n):
    for i in range(n):
        print(f'computing {i}')
        yield i * i

gen = lazy_squares(5)   # nothing printed yet
x = next(gen)           # 'computing 0' then x=0
y = next(gen)           # 'computing 1' then y=1
print(x, y)             # 0 1
# Remaining 3 values never computed if we stop here`,
    explanation: "A generator function returns a generator object immediately without executing the body; the body runs only as far as the next yield each time next() is called, keeping memory usage flat for large sequences.",
  },
  {
    id: "py-structures-array-typed",
    language: "python",
    title: "array.array stores homogeneous typed values compactly",
    tag: "structures",
    code: `import array, sys

ints = array.array('i', range(1000))
lst  = list(range(1000))

print(sys.getsizeof(ints))   # ~4056 bytes (4 per int)
print(sys.getsizeof(lst))    # ~8056 bytes (pointer + object)

ints.append(1001)
ints.extend(range(3))
print(ints[:3].tolist())     # [0, 1, 2]`,
    explanation: "array.array stores raw C-type values without Python object overhead, using roughly half the memory of an equivalent list; prefer it when you have large homogeneous numeric data and don't need NumPy.",
  },
  {
    id: "py-caveats-os-path-abs",
    language: "python",
    title: "os.path.join discards everything before an absolute segment",
    tag: "caveats",
    code: `import os
print(os.path.join('/home/user', 'docs', 'file.txt'))
# /home/user/docs/file.txt

# Trap: an absolute component resets the path
print(os.path.join('/home/user', '/etc', 'passwd'))
# /etc/passwd  -- /home/user is discarded!

# pathlib behaves the same way
from pathlib import Path
print(Path('/home/user') / '/etc/passwd')
# /etc/passwd`,
    explanation: "Both os.path.join and pathlib's / operator discard all previous components when they encounter an absolute path segment; this can produce surprising results when joining user-supplied paths.",
  },
  {
    id: "py-types-self-method-chain",
    language: "python",
    title: "Self type enables type-safe method chaining in subclasses",
    tag: "types",
    code: `from typing import Self

class Builder:
    def __init__(self): self._parts: list[str] = []
    def add(self, part: str) -> Self:
        self._parts.append(part)
        return self
    def build(self) -> str:
        return ', '.join(self._parts)

class FancyBuilder(Builder):
    def decorate(self) -> Self:
        self._parts = [f'**{p}**' for p in self._parts]
        return self

result = FancyBuilder().add('a').add('b').decorate().build()
print(result)   # **a**, **b**`,
    explanation: "Using Self instead of the base class name means type checkers infer the correct subclass return type, so FancyBuilder.add() is typed as returning FancyBuilder, not Builder.",
  },
  {
    id: "py-families-format-styles-cmp",
    language: "python",
    title: "% vs .format() vs f-string: three interpolation styles",
    tag: "families",
    code: `name, score = 'Alice', 97.5

# %-formatting (old, C-style)
print('%-10s scored %.1f' % (name, score))

# str.format() (Python 2.6+)
print('{:<10} scored {:.1f}'.format(name, score))

# f-strings (Python 3.6+, recommended)
print(f'{name:<10} scored {score:.1f}')

# All produce: Alice      scored 97.5
# Logging prefers % style to defer interpolation`,
    explanation: "All three styles support the same format specifiers; f-strings are fastest and most readable, but the logging module recommends % style to defer interpolation unless the message is actually emitted.",
  },
  {
    id: "py-classes-metaclass-auto-reg",
    language: "python",
    title: "Metaclass auto-registers every concrete subclass",
    tag: "classes",
    code: `_registry: dict = {}

class PluginMeta(type):
    def __new__(mcs, name, bases, namespace):
        cls = super().__new__(mcs, name, bases, namespace)
        if bases:                  # skip the base class itself
            _registry[name] = cls
        return cls

class Plugin(metaclass=PluginMeta): pass

class AudioPlugin(Plugin): pass
class VideoPlugin(Plugin): pass

print(list(_registry))   # ['AudioPlugin', 'VideoPlugin']`,
    explanation: "A metaclass __new__ is called for every class created with that metaclass; checking if bases is non-empty skips the abstract base itself and registers only concrete subclasses automatically.",
  },
  {
    id: "py-snippet-chr-ord-usage",
    language: "python",
    title: "chr() and ord() convert between characters and code points",
    tag: "snippet",
    code: `print(ord('A'))    # 65
print(ord('Z'))    # 90
print(chr(65))     # A

# Build alphabet
alphabet = ''.join(chr(i) for i in range(ord('a'), ord('z') + 1))
print(alphabet)    # abcdefghijklmnopqrstuvwxyz

# Caesar cipher shift
def shift(c, n=13):
    base = ord('a') if c.islower() else ord('A')
    return chr((ord(c) - base + n) % 26 + base)
print(shift('a', 3))   # d`,
    explanation: "ord() returns the Unicode code point of a single character and chr() is its inverse; together they enable arithmetic on characters like shifting for ciphers or generating character ranges.",
  },
  {
    id: "py-understanding-nonlocal-kw",
    language: "python",
    title: "nonlocal lets inner functions rebind enclosing scope variables",
    tag: "understanding",
    code: `def make_counter(start=0):
    count = start
    def increment(by=1):
        nonlocal count        # rebind, not shadow
        count += by
        return count
    def reset():
        nonlocal count
        count = start
    return increment, reset

inc, rst = make_counter(10)
print(inc())    # 11
print(inc(5))   # 16
rst()
print(inc())    # 11`,
    explanation: "Without nonlocal, count += by would create a new local variable and raise UnboundLocalError; nonlocal declares that assignments should target the nearest enclosing function scope that owns the variable.",
  },
  {
    id: "py-structures-namedtuple-asdict",
    language: "python",
    title: "namedtuple._asdict converts a record to a dict",
    tag: "structures",
    code: `from collections import namedtuple
Point = namedtuple('Point', ['x', 'y', 'z'])
p = Point(1, 2, 3)

d = p._asdict()
print(d)                       # {'x': 1, 'y': 2, 'z': 3}

# _replace creates a new instance with changed fields
p2 = p._replace(z=99)
print(p2)                      # Point(x=1, y=2, z=99)
print(p)                       # Point(x=1, y=2, z=3) unchanged
print(Point._fields)           # ('x', 'y', 'z')`,
    explanation: "namedtuple's underscore methods (_asdict, _replace, _fields) are intentionally prefixed to avoid clashing with user-defined field names; _asdict is useful for serialisation and _replace for functional-style updates.",
  },
  {
    id: "py-caveats-lambda-loop-capture",
    language: "python",
    title: "Lambdas in a loop all capture the same loop variable",
    tag: "caveats",
    code: `buttons = []
for i in range(5):
    buttons.append(lambda: print(f'button {i}'))

buttons[0]()   # button 4  (not button 0!)
buttons[2]()   # button 4

# Fix: bind i at creation time with a default arg
buttons2 = []
for i in range(5):
    buttons2.append(lambda i=i: print(f'button {i}'))
buttons2[0]()  # button 0`,
    explanation: "Every lambda in the list references the same i variable in the enclosing scope; by the time any callback fires, the loop has finished and i is 4. A default argument forces capture of the current value.",
  },
  {
    id: "py-types-typevar-tuple-variadic",
    language: "python",
    title: "TypeVarTuple enables variadic generic types (PEP 646)",
    tag: "types",
    code: `from typing import TypeVarTuple, Generic, Unpack

Ts = TypeVarTuple('Ts')

class Zipper(Generic[Unpack[Ts]]):
    def __init__(self, *items: Unpack[Ts]):
        self.items = items
    def first(self):
        return self.items[0]

z = Zipper(1, 'hello', 3.14)
print(z.first())   # 1
# Type checker knows z.items is tuple[int, str, float]`,
    explanation: "TypeVarTuple (Python 3.11+) enables generics that vary in the number and types of their type parameters, enabling precise typing of heterogeneous tuples and multi-stage pipelines.",
  },
  {
    id: "py-families-context-mgr-cmp",
    language: "python",
    title: "@contextmanager vs class-based context manager",
    tag: "families",
    code: `from contextlib import contextmanager
import time

# Generator-based (concise)
@contextmanager
def timer(label):
    start = time.perf_counter()
    try: yield
    finally: print(f'{label}: {time.perf_counter()-start:.4f}s')

# Class-based (more control, can expose state to caller)
class Timer:
    def __enter__(self):
        self.start = time.perf_counter()
        return self
    def __exit__(self, *_):
        self.elapsed = time.perf_counter() - self.start

with timer('gen'): pass
with Timer() as t: pass
print(t.elapsed)`,
    explanation: "The @contextmanager decorator turns a generator with a single yield into a context manager; the class-based approach is preferred when you need to expose values or share state between __enter__ and __exit__.",
  },
  {
    id: "py-classes-property-setter-valid",
    language: "python",
    title: "property getter/setter adds validation without changing the API",
    tag: "classes",
    code: `class Temperature:
    def __init__(self, celsius: float):
        self.celsius = celsius   # calls setter

    @property
    def celsius(self) -> float:
        return self._celsius

    @celsius.setter
    def celsius(self, value: float) -> None:
        if value < -273.15:
            raise ValueError(f'{value} is below absolute zero')
        self._celsius = value

    @property
    def fahrenheit(self) -> float:
        return self._celsius * 9/5 + 32

t = Temperature(100)
print(t.fahrenheit)   # 212.0`,
    explanation: "Defining a property first and adding a .setter means existing code using dot-attribute access doesn't change; validation and computed attributes are added transparently.",
  },
  {
    id: "py-snippet-format-spec-str",
    language: "python",
    title: "Format specification mini-language in f-strings",
    tag: "snippet",
    code: `# Alignment and fill
print(f'{"left":<10}|')    # left      |
print(f'{"right":>10}|')   # right     |
print(f'{"center":^10}|')  #   center  |

# Number formatting
print(f'{3.14159:.2f}')    # 3.14
print(f'{1000000:,}')       # 1,000,000
print(f'{255:#010x}')       # 0x000000ff
print(f'{0.75:.1%}')        # 75.0%`,
    explanation: "The format spec mini-language (after the colon in an f-string) controls alignment, fill character, sign, grouping separators, precision, and type codes.",
  },
  {
    id: "py-understanding-del-name",
    language: "python",
    title: "del removes the name binding, not necessarily the object",
    tag: "understanding",
    code: `a = [1, 2, 3]
b = a            # b and a reference the same list

del a            # removes only the name 'a'
print(b)         # [1, 2, 3] -- object still alive via 'b'

lst = [10, 20, 30]
del lst[1]
print(lst)       # [10, 30]

import sys; x = []; y = x
print(sys.getrefcount(x))   # 3`,
    explanation: "del name removes the reference from the current scope; the underlying object is only freed by the garbage collector when its reference count drops to zero.",
  },
  {
    id: "py-snippet-slice-step-neg",
    language: "python",
    title: "Slice with negative step reverses a sequence",
    tag: "snippet",
    code: `s = 'hello'
print(s[::-1])          # olleh  (reverse)

lst = [1, 2, 3, 4, 5]
print(lst[::-1])        # [5, 4, 3, 2, 1]
print(lst[::2])         # [1, 3, 5]  (every other)
print(lst[4:1:-1])      # [5, 4, 3]  (reverse subset)

rev = list(reversed(lst))  # also works, more explicit`,
    explanation: "The third slice argument is the step; a negative step walks the sequence in reverse. lst[::-1] is idiomatic Python for reversal and compiles to a single BINARY_SUBSCR call.",
  },
  {
    id: "py-understanding-class-body-exec",
    language: "python",
    title: "A class body is executed immediately at definition time",
    tag: "understanding",
    code: `print('before class')

class MyClass:
    print('inside class body')   # runs at class definition
    x = 10 + 5
    print(f'x = {x}')

print('after class')
# Output:
# before class
# inside class body
# x = 15
# after class`,
    explanation: "Python executes the class body as a block of code when the class statement is encountered; the resulting local namespace becomes the class's __dict__. Side effects in class bodies run at import time.",
  },
  {
    id: "py-structures-frozenset-as-key",
    language: "python",
    title: "frozenset is hashable and can be used as a dict key",
    tag: "structures",
    code: `a = frozenset({1, 2, 3})
b = frozenset({2, 3, 4})

print(a & b)   # frozenset({2, 3})  intersection
print(a | b)   # frozenset({1, 2, 3, 4})  union

# Usable as dict key (order doesn't matter for frozenset equality)
graph = {frozenset({0, 1}): 'edge A', frozenset({1, 2}): 'edge B'}
print(graph[frozenset({1, 0})])   # edge A`,
    explanation: "frozenset is the immutable counterpart of set; because it's hashable, it can serve as a dict key or appear in another set -- useful for representing edges in an undirected graph.",
  },
  {
    id: "py-caveats-round-half-even",
    language: "python",
    title: "round() uses banker's rounding (round half to even)",
    tag: "caveats",
    code: `print(round(0.5))   # 0  (round to even)
print(round(1.5))   # 2  (round to even)
print(round(2.5))   # 2  (round to even)
print(round(3.5))   # 4  (round to even)

# For always-round-half-up: use Decimal
from decimal import Decimal, ROUND_HALF_UP
print(Decimal('2.5').quantize(Decimal('1'), ROUND_HALF_UP))  # 3`,
    explanation: "Python's built-in round() implements IEEE 754 round-half-to-even (banker's rounding) to reduce statistical bias; if you need traditional half-up rounding, use the Decimal module with an explicit rounding mode.",
  },
  {
    id: "py-types-classvar",
    language: "python",
    title: "ClassVar marks attributes that belong to the class, not instances",
    tag: "types",
    code: `from typing import ClassVar
from dataclasses import dataclass

@dataclass
class Connection:
    host: str
    port: int
    # ClassVar: shared by all instances, excluded from __init__
    pool_size: ClassVar[int] = 10
    timeout: ClassVar[float] = 30.0

c = Connection('localhost', 5432)
print(Connection.pool_size)   # 10
# ClassVar fields are not included in dataclass __init__ or __repr__`,
    explanation: "ClassVar[T] signals to type checkers and dataclasses that an attribute is a class variable; dataclass excludes ClassVar fields from __init__, __repr__, and __eq__.",
  },
  {
    id: "py-families-exception-types-cmp",
    language: "python",
    title: "ValueError vs TypeError vs RuntimeError: when to raise which",
    tag: "families",
    code: `# TypeError: wrong type of argument
def add(a: int, b: int) -> int:
    if not isinstance(a, int): raise TypeError(f'expected int, got {type(a).__name__}')
    return a + b

# ValueError: right type, wrong value
def sqrt(n: float) -> float:
    if n < 0: raise ValueError(f'negative input: {n}')
    return n ** 0.5

# RuntimeError: valid input but operation failed at runtime
def connect(host: str) -> None:
    raise RuntimeError(f'connection to {host} refused')`,
    explanation: "TypeError signals the wrong kind of argument; ValueError signals the right type but an invalid value (negative square root); RuntimeError is a catch-all for unexpected runtime failures.",
  },
  {
    id: "py-classes-repr-eq-hash",
    language: "python",
    title: "__repr__, __eq__, and __hash__ form a trio",
    tag: "classes",
    code: `class Color:
    def __init__(self, r, g, b): self.r=r; self.g=g; self.b=b
    def __repr__(self): return f'Color({self.r}, {self.g}, {self.b})'
    def __eq__(self, other):
        return isinstance(other, Color) and (self.r,self.g,self.b)==(other.r,other.g,other.b)
    def __hash__(self):
        return hash((self.r, self.g, self.b))

red = Color(255, 0, 0)
print(red)                          # Color(255, 0, 0)
print(red == Color(255, 0, 0))      # True
print({red, Color(255, 0, 0)})      # {Color(255, 0, 0)}`,
    explanation: "Defining __eq__ without __hash__ makes the class unhashable (Python sets __hash__ to None); always define __hash__ alongside __eq__ so instances can appear in sets and as dict keys.",
  },
  {
    id: "py-snippet-dict-get-default",
    language: "python",
    title: "dict.get() returns a default instead of raising KeyError",
    tag: "snippet",
    code: `config = {'host': 'localhost', 'port': 5432}

print(config.get('host'))           # localhost
print(config.get('user'))           # None
print(config.get('user', 'root'))   # root

# Counting without defaultdict
counts = {}
for word in 'the cat the mat'.split():
    counts[word] = counts.get(word, 0) + 1
print(counts)   # {'the': 2, 'cat': 1, 'mat': 1}`,
    explanation: "dict.get(key, default=None) returns the default without raising KeyError; it's cleaner than a try/except block and avoids the double-lookup of an if-key-in-dict pattern.",
  },
  {
    id: "py-understanding-module-import-once",
    language: "python",
    title: "Module code runs only once: imports are cached",
    tag: "understanding",
    code: `import sys
# First import: runs module body
import os            # runs os module code once
# Second import: returns cached module from sys.modules
import os            # nothing re-executed
print('os' in sys.modules)   # True

# Force reload if you need to re-execute
import importlib
importlib.reload(os)   # rare, use with caution`,
    explanation: "Python caches every imported module in sys.modules after the first import; subsequent import statements just look up the cached module object, so top-level module code runs exactly once per interpreter session.",
  },
  {
    id: "py-structures-counter-subtract",
    language: "python",
    title: "Counter.subtract updates counts in-place",
    tag: "structures",
    code: `from collections import Counter

inventory = Counter({'apples': 10, 'bananas': 5, 'oranges': 3})
sold      = Counter({'apples': 3, 'bananas': 7})

inventory.subtract(sold)   # in-place, allows negatives
print(inventory)
# Counter({'apples': 7, 'oranges': 3, 'bananas': -2})

# Use - operator to drop non-positive counts
print(inventory - Counter())
# Counter({'apples': 7, 'oranges': 3})`,
    explanation: "Counter.subtract allows negative counts (unlike - which drops them); subtract modifies in-place while - returns a new Counter with non-positive counts removed.",
  }
];
