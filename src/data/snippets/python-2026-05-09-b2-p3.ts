import type { Snippet } from "./types";

export const pythonSnippets20260509B2P3: Snippet[] = [
  {
    id: "py-snippet-operator-attrgetter",
    language: "python",
    title: "operator.attrgetter and itemgetter as key functions",
    tag: "snippet",
    code: `from operator import attrgetter, itemgetter
from dataclasses import dataclass

@dataclass
class Person:
    name: str
    age: int

people = [Person('Bob', 30), Person('Alice', 25), Person('Carol', 35)]

# attrgetter: sort by attribute
by_age = sorted(people, key=attrgetter('age'))
print([p.name for p in by_age])   # ['Alice', 'Bob', 'Carol']

# itemgetter: sort dicts by key
rows = [{'x': 3}, {'x': 1}, {'x': 2}]
print(sorted(rows, key=itemgetter('x')))  # [{'x':1}, {'x':2}, {'x':3}]`,
    explanation: "attrgetter and itemgetter produce key functions more efficiently than lambdas and are more readable when sorting by known attribute or key names.",
  },
  {
    id: "py-snippet-partial-application",
    language: "python",
    title: "functools.partial fixes some arguments of a function",
    tag: "snippet",
    code: `from functools import partial

def power(base, exp):
    return base ** exp

square = partial(power, exp=2)
cube   = partial(power, exp=3)

print(square(4))   # 16
print(cube(3))     # 27

# Use with map
print(list(map(square, range(6))))  # [0, 1, 4, 9, 16, 25]

# Fix positional argument
double = partial(pow, exp=1, mod=None)  # pow(base, exp)
add5 = partial(lambda x, y: x + y, y=5)
print(add5(10))  # 15`,
    explanation: "partial creates a new callable with some arguments pre-filled; it's cleaner than a wrapper lambda when you need to adapt a function to a specific interface.",
  },
  {
    id: "py-snippet-zip-transpose",
    language: "python",
    title: "zip(*matrix) transposes a 2-D list",
    tag: "snippet",
    code: `matrix = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9],
]

transposed = list(zip(*matrix))
print(transposed)
# [(1, 4, 7), (2, 5, 8), (3, 6, 9)]

# Convert to list of lists
as_lists = [list(row) for row in zip(*matrix)]
print(as_lists)
# [[1, 4, 7], [2, 5, 8], [3, 6, 9]]`,
    explanation: "The * unpacking operator passes each row as a separate argument to zip; zip then groups first elements, second elements, etc., effectively transposing rows and columns.",
  },
  {
    id: "py-snippet-pairwise",
    language: "python",
    title: "itertools.pairwise yields consecutive overlapping pairs",
    tag: "snippet",
    code: `from itertools import pairwise   # Python 3.10+

seq = [1, 2, 3, 4, 5]
print(list(pairwise(seq)))
# [(1, 2), (2, 3), (3, 4), (4, 5)]

# Differences between consecutive elements
diffs = [b - a for a, b in pairwise(seq)]
print(diffs)   # [1, 1, 1, 1]

# Without pairwise (Python < 3.10)
def manual_pairwise(it):
    it = iter(it)
    a = next(it)
    for b in it:
        yield a, b
        a = b`,
    explanation: "pairwise(iterable) yields consecutive overlapping pairs (n-1 pairs from n elements); it's ideal for computing differences, detecting transitions, or processing sliding windows of size 2.",
  },
  {
    id: "py-snippet-reduce-with-init",
    language: "python",
    title: "functools.reduce with an initialiser handles empty sequences",
    tag: "snippet",
    code: `from functools import reduce
import operator

nums = [1, 2, 3, 4, 5]
product = reduce(operator.mul, nums, 1)   # 1 is the initialiser
print(product)   # 120

# Without initialiser, empty list raises TypeError
try:
    reduce(operator.add, [])
except TypeError as e:
    print(e)   # reduce() of empty iterable with no initial value

# With initialiser, empty list returns the init value
print(reduce(operator.add, [], 0))   # 0`,
    explanation: "The third argument to reduce is the initial accumulator value; providing it makes reduce safe on empty sequences and lets you control the starting point of the fold.",
  },
  {
    id: "py-snippet-starmap",
    language: "python",
    title: "itertools.starmap applies a function to each arg-tuple",
    tag: "snippet",
    code: `from itertools import starmap

pairs = [(2, 3), (3, 2), (5, 2), (4, 3)]
results = list(starmap(pow, pairs))
print(results)   # [8, 9, 25, 64]

# Equivalent to:
# [pow(*args) for args in pairs]

# starmap with map:
coords = [(0, 0), (1, 0), (0, 1)]
dists  = list(starmap(lambda x, y: (x**2 + y**2)**0.5, coords))
print(dists)  # [0.0, 1.0, 1.0]`,
    explanation: "starmap(func, iterable) is like map but unpacks each item as positional arguments to func; use it when your data is a sequence of argument tuples.",
  },
  {
    id: "py-understanding-gc-cycles",
    language: "python",
    title: "CPython's cyclic garbage collector handles reference cycles",
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
b.next = a

# Drop external references -- cycle still exists
del a, b
# CPython's reference counting alone can't free these
# But the cyclic GC can:
collected = gc.collect()
print(f'collected {collected} objects')`,
    explanation: "CPython's reference counting frees objects when refcount hits zero, but can't handle cycles; the generational cyclic GC runs periodically to detect and collect unreachable cycles.",
  },
  {
    id: "py-understanding-exec-eval",
    language: "python",
    title: "exec and eval run Python code dynamically",
    tag: "understanding",
    code: `# eval: evaluate a single expression, returns result
result = eval('2 ** 10')
print(result)   # 1024

# exec: execute a statement or block, returns None
code = '''
def greet(name):
    return f"Hello, {name}"
'''
namespace = {}
exec(code, namespace)
print(namespace['greet']('Alice'))   # Hello, Alice

# NEVER eval/exec untrusted user input -- it's arbitrary code execution`,
    explanation: "eval executes a single expression and returns its value; exec runs any Python code (including defs and classes) and populates a namespace dict. Both are powerful but dangerous with untrusted input.",
  },
  {
    id: "py-understanding-import-system",
    language: "python",
    title: "The import system: finders, loaders, and sys.path",
    tag: "understanding",
    code: `import sys

# sys.path: directories searched for modules
print(sys.path[:3])   # ['', '/usr/lib/python...', ...]

# sys.modules: cache of already-imported modules
import os
print('os' in sys.modules)   # True

# importlib.reload: force re-execution of a module
import importlib
import os
importlib.reload(os)   # re-runs os module code (rare)

# Custom import hook
class MyFinder:
    def find_module(self, name, path=None): ...
    def load_module(self, name): ...`,
    explanation: "Python's import system uses finders to locate modules and loaders to execute them; sys.path is the search list and sys.modules is the cache. importlib exposes the internals for custom import behaviour.",
  },
  {
    id: "py-structures-struct-pack",
    language: "python",
    title: "struct.pack/unpack serialises binary data",
    tag: "structures",
    code: `import struct

# Pack: convert Python values to bytes
data = struct.pack('>HHI', 1, 2, 300)   # big-endian: 2 shorts + 1 uint
print(data)          # b'\\x00\\x01\\x00\\x02\\x00\\x00\\x01,'
print(len(data))     # 8 bytes

# Unpack: convert bytes back to Python values
vals = struct.unpack('>HHI', data)
print(vals)          # (1, 2, 300)

# calcsize: bytes needed for a format string
print(struct.calcsize('>HHI'))   # 8`,
    explanation: "struct provides C-struct binary packing; the format string encodes byte order (> big-endian, < little-endian) and field types (H=uint16, I=uint32, f=float). Use it for binary protocol parsing.",
  },
  {
    id: "py-structures-bytearray-inplace",
    language: "python",
    title: "bytearray allows in-place mutation of binary data",
    tag: "structures",
    code: `# bytes is immutable; bytearray is mutable
buf = bytearray(b'\\x00\\x00\\x00\\x00')
buf[0] = 0xFF
buf[1:3] = b'\\xAB\\xCD'
print(buf)        # bytearray(b'\\xff\\xab\\xcd\\x00')

# Efficient for building binary payloads
header = bytearray(8)
import struct
struct.pack_into('>I', header, 0, 12345)   # write uint32 at offset 0
print(header[:4])   # bytearray(b'\\x009\\x00\\x00')`,
    explanation: "bytearray is a mutable sequence of bytes; struct.pack_into writes directly into a bytearray at a given offset, avoiding allocations when assembling binary packets.",
  },
  {
    id: "py-caveats-float-accumulation",
    language: "python",
    title: "Floating-point addition accumulates error over many iterations",
    tag: "caveats",
    code: `total = 0.0
for _ in range(1_000_000):
    total += 0.1

print(total)           # 100000.00000001591  (not exactly 100000)

# Fix: use math.fsum for exact floating-point summation
import math
values = [0.1] * 1_000_000
print(math.fsum(values))   # 100000.0  (exact)

# Or use Decimal for base-10 precision
from decimal import Decimal
d = sum(Decimal('0.1') for _ in range(10))
print(d)   # 1.0`,
    explanation: "Each floating-point addition introduces a tiny error; summing many values amplifies it. math.fsum uses extended precision to compensate; Decimal avoids binary floating-point entirely.",
  },
  {
    id: "py-caveats-deep-recursion",
    language: "python",
    title: "Python has a default recursion limit of 1000",
    tag: "caveats",
    code: `import sys

print(sys.getrecursionlimit())   # 1000

def factorial(n):
    return 1 if n <= 1 else n * factorial(n - 1)

try:
    factorial(2000)
except RecursionError:
    print('recursion limit exceeded')

# Increase limit (use sparingly -- prefer iteration or a stack)
sys.setrecursionlimit(5000)

# Iterative alternative
def factorial_iter(n):
    result = 1
    for i in range(2, n + 1):
        result *= i
    return result`,
    explanation: "Python enforces a default recursion limit of 1000 frames; deeply recursive calls raise RecursionError. The limit can be raised, but iterative solutions with an explicit stack are safer and more memory-efficient.",
  },
  {
    id: "py-caveats-pickle-security",
    language: "python",
    title: "pickle.loads on untrusted data executes arbitrary code",
    tag: "caveats",
    code: `import pickle

# Safe pickling of your own objects
class Config:
    def __init__(self, host, port):
        self.host = host; self.port = port

cfg = Config('localhost', 8080)
blob = pickle.dumps(cfg)
cfg2 = pickle.loads(blob)
print(cfg2.host)   # localhost

# DANGER: pickle can execute arbitrary code
# A crafted payload can run os.system('rm -rf /') on load
# NEVER unpickle data from untrusted sources
# Use json, msgpack, or protobuf instead for untrusted data`,
    explanation: "pickle can serialise arbitrary Python objects including custom __reduce__ methods; a malicious pickle payload executes code during unpickling. Only unpickle data you created yourself.",
  },
  {
    id: "py-types-newtype",
    language: "python",
    title: "NewType creates a distinct type alias for type checking",
    tag: "types",
    code: `from typing import NewType

UserId = NewType('UserId', int)
OrderId = NewType('OrderId', int)

def get_user(uid: UserId) -> str:
    return f'user:{uid}'

uid = UserId(42)
oid = OrderId(42)

print(get_user(uid))    # user:42
# get_user(oid)  -- type checker flags this: OrderId is not UserId
# get_user(42)   -- type checker flags this: int is not UserId`,
    explanation: "NewType creates a type that's a distinct subtype at check time; the runtime value is the same underlying type (no overhead), but the type checker rejects passing a plain int where UserId is expected.",
  },
  {
    id: "py-types-abstract-generic",
    language: "python",
    title: "Abstract generic class combines ABC and Generic",
    tag: "types",
    code: `from abc import ABC, abstractmethod
from typing import TypeVar, Generic

T = TypeVar('T')

class Repository(ABC, Generic[T]):
    @abstractmethod
    def get(self, id: int) -> T: ...

    @abstractmethod
    def save(self, entity: T) -> None: ...

class UserRepo(Repository['User']):
    def get(self, id: int) -> 'User':
        return User(id)
    def save(self, entity: 'User') -> None:
        print(f'saving {entity.id}')

class User:
    def __init__(self, id): self.id = id`,
    explanation: "Combining ABC with Generic[T] lets you define a typed interface for repositories or services; subclasses specify the concrete type and must implement all abstract methods.",
  },
  {
    id: "py-types-overloaded-method",
    language: "python",
    title: "@overload narrows return type based on argument type",
    tag: "types",
    code: `from typing import overload, Literal

@overload
def double(x: int) -> int: ...
@overload
def double(x: str) -> str: ...
@overload
def double(x: list) -> list: ...

def double(x):
    if isinstance(x, int): return x * 2
    if isinstance(x, str): return x * 2
    return x * 2

print(double(3))       # 6   (typed as int)
print(double('hi'))    # hihi (typed as str)
print(double([1,2]))   # [1,2,1,2] (typed as list)`,
    explanation: "@overload stubs declare the exact return type for each combination of argument types; the real implementation (without @overload) handles all cases at runtime.",
  },
  {
    id: "py-families-decimal-precision",
    language: "python",
    title: "decimal.Decimal: configurable precision arithmetic",
    tag: "families",
    code: `from decimal import Decimal, getcontext, ROUND_HALF_UP

# Set global precision
getcontext().prec = 50

result = Decimal(1) / Decimal(3)
print(result)   # 0.33333333333333333333333333333333333333333333333333

# Rounding modes
price = Decimal('2.675')
print(price.quantize(Decimal('0.01'), ROUND_HALF_UP))  # 2.68
print(price.quantize(Decimal('0.01')))                  # 2.67 (banker's)

# Exact monetary arithmetic
total = Decimal('0.10') + Decimal('0.20')
print(total == Decimal('0.30'))   # True`,
    explanation: "Decimal uses base-10 arithmetic and configurable precision; it's the standard choice for financial calculations where exact decimal representation and controlled rounding are required.",
  },
  {
    id: "py-families-dataclasses-field",
    language: "python",
    title: "dataclasses.field controls per-field dataclass behaviour",
    tag: "families",
    code: `from dataclasses import dataclass, field
from typing import ClassVar

@dataclass
class Config:
    host: str
    port: int = 8080
    # mutable default must use field(default_factory=)
    tags: list = field(default_factory=list)
    # excluded from __init__ and __repr__
    _secret: str = field(default='', repr=False, init=False)
    # class variable (not a field)
    count: ClassVar[int] = 0

c1 = Config('host1')
c2 = Config('host2')
c1.tags.append('prod')
print(c2.tags)   # []  -- independent lists`,
    explanation: "field() gives per-field control: default_factory creates a new object per instance (fixing the mutable-default bug), repr=False hides sensitive fields, init=False excludes from the constructor.",
  },
  {
    id: "py-families-inspect-module",
    language: "python",
    title: "inspect: introspect functions, classes, and source code",
    tag: "families",
    code: `import inspect

def add(a: int, b: int = 0) -> int:
    return a + b

sig = inspect.signature(add)
print(sig)                       # (a: int, b: int = 0) -> int
print(sig.parameters['b'].default)  # 0

# Get source code
print(inspect.getsource(add))

# Check if object is a coroutine function
async def coro(): pass
print(inspect.iscoroutinefunction(coro))   # True

# Get all methods of an object
print([name for name, _ in inspect.getmembers(str, predicate=inspect.isfunction)][:3])`,
    explanation: "The inspect module provides tools for introspecting live objects: signature inspection, source retrieval, and classification of callables -- useful for building decorators, serialisers, and documentation generators.",
  },
  {
    id: "py-classes-abstract-base",
    language: "python",
    title: "ABC enforces interface contracts at instantiation time",
    tag: "classes",
    code: `from abc import ABC, abstractmethod

class Shape(ABC):
    @abstractmethod
    def area(self) -> float: ...

    @abstractmethod
    def perimeter(self) -> float: ...

    def describe(self) -> str:
        return f'area={self.area():.2f} perimeter={self.perimeter():.2f}'

class Circle(Shape):
    def __init__(self, r): self.r = r
    def area(self): return 3.14159 * self.r ** 2
    def perimeter(self): return 2 * 3.14159 * self.r

# Shape()  # TypeError: Can't instantiate abstract class
print(Circle(5).describe())   # area=78.54 perimeter=31.42`,
    explanation: "Abstract base classes raise TypeError if you try to instantiate them or any subclass that hasn't implemented all abstract methods; they document and enforce the interface contract at runtime.",
  },
  {
    id: "py-classes-slots-inheritance",
    language: "python",
    title: "__slots__ in an inheritance chain",
    tag: "classes",
    code: `class Base:
    __slots__ = ('x',)
    def __init__(self, x): self.x = x

class Child(Base):
    __slots__ = ('y',)   # only NEW slots; inherits x from Base
    def __init__(self, x, y):
        super().__init__(x)
        self.y = y

c = Child(1, 2)
print(c.x, c.y)   # 1 2

# If ANY class in the hierarchy lacks __slots__, __dict__ appears
class Leaky(Base):
    pass   # no __slots__ -> has __dict__ again
print(hasattr(Leaky(1), '__dict__'))   # True`,
    explanation: "Subclasses with __slots__ only need to declare the new slots they add; if any class in the MRO lacks __slots__, the full __dict__ is reinstated because it's inherited from that class.",
  },
  {
    id: "py-classes-multiple-inheritance",
    language: "python",
    title: "Multiple inheritance: cooperative super() and __init__",
    tag: "classes",
    code: `class Animal:
    def __init__(self, name, **kwargs):
        super().__init__(**kwargs)
        self.name = name

class Flyer:
    def __init__(self, max_altitude, **kwargs):
        super().__init__(**kwargs)
        self.max_altitude = max_altitude

class FlyingSquirrel(Animal, Flyer):
    pass

fs = FlyingSquirrel(name='Rocky', max_altitude=50)
print(fs.name, fs.max_altitude)   # Rocky 50`,
    explanation: "Cooperative multiple inheritance works by having every __init__ accept and forward **kwargs via super(); this lets the MRO chain each constructor in order without explicitly knowing what comes next.",
  },
];
