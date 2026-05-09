import type { Snippet } from "./types";

export const pythonSnippets20260509B2P1: Snippet[] = [
  {
    id: "py-snippet-enumerate-start",
    language: "python",
    title: "enumerate(start=) offsets the counter",
    tag: "snippet",
    code: `items = ['a', 'b', 'c']
for i, v in enumerate(items, start=1):
    print(i, v)
# 1 a / 2 b / 3 c

# Useful for 1-based display indices
lines = ['hello', 'world']
for lineno, line in enumerate(lines, 1):
    print(f'{lineno:3}: {line}')`,
    explanation: "enumerate(iterable, start=0) adds a counter; the start parameter shifts the initial value, avoiding the need for a separate counter variable or manual offset.",
  },
  {
    id: "py-snippet-zip-longest-fillvalue",
    language: "python",
    title: "zip_longest pads shorter iterables",
    tag: "snippet",
    code: `from itertools import zip_longest
a = [1, 2, 3]
b = ['x', 'y']
for pair in zip_longest(a, b, fillvalue=None):
    print(pair)
# (1, 'x') / (2, 'y') / (3, None)

merged = list(zip_longest(a, b, fillvalue=0))
print(merged)  # [(1, 'x'), (2, 'y'), (3, 0)]`,
    explanation: "zip_longest continues until the longest iterable is exhausted, filling missing values with fillvalue; regular zip stops at the shortest.",
  },
  {
    id: "py-snippet-nested-listcomp",
    language: "python",
    title: "Nested list comprehension flattens a 2-D list",
    tag: "snippet",
    code: `matrix = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]

# Flatten: outer loop first, inner loop second
flat = [x for row in matrix for x in row]
print(flat)  # [1, 2, 3, 4, 5, 6, 7, 8, 9]

# Transpose with nested comprehension
transposed = [[row[i] for row in matrix] for i in range(3)]
print(transposed)  # [[1,4,7],[2,5,8],[3,6,9]]`,
    explanation: "In a nested comprehension the leftmost for-clause is the outer loop; reading left-to-right matches the mental model of nested for-loops.",
  },
  {
    id: "py-snippet-dict-comp-invert",
    language: "python",
    title: "Dict comprehension inverts a mapping",
    tag: "snippet",
    code: `original = {'a': 1, 'b': 2, 'c': 3}
inverted = {v: k for k, v in original.items()}
print(inverted)  # {1: 'a', 2: 'b', 3: 'c'}

# Filter during inversion
big = {v: k for k, v in original.items() if v > 1}
print(big)  # {2: 'b', 3: 'c'}`,
    explanation: "Dict comprehensions swap keys and values in one pass; if values aren't unique the last key wins, so only invert bijections or handle duplicates explicitly.",
  },
  {
    id: "py-snippet-set-symmetric-diff",
    language: "python",
    title: "Set symmetric difference finds elements in exactly one set",
    tag: "snippet",
    code: `a = {1, 2, 3, 4}
b = {3, 4, 5, 6}

diff = a ^ b          # symmetric difference
print(diff)           # {1, 2, 5, 6}

# Equivalent using |, &, -
print((a | b) - (a & b))  # {1, 2, 5, 6}

# Update in place
a ^= b
print(a)              # {1, 2, 5, 6}`,
    explanation: "The ^ operator returns elements present in one set but not both; it's equivalent to (union minus intersection) and is useful for finding changes between two versions of a dataset.",
  },
  {
    id: "py-snippet-accumulate-running",
    language: "python",
    title: "itertools.accumulate computes running aggregates",
    tag: "snippet",
    code: `from itertools import accumulate
import operator

nums = [1, 2, 3, 4, 5]
print(list(accumulate(nums)))               # [1, 3, 6, 10, 15] running sum
print(list(accumulate(nums, operator.mul))) # [1, 2, 6, 24, 120] running product

# Running max
data = [3, 1, 4, 1, 5, 9, 2, 6]
print(list(accumulate(data, max)))  # [3, 3, 4, 4, 5, 9, 9, 9]`,
    explanation: "accumulate applies a binary function cumulatively and yields each intermediate result; the default function is addition, giving a prefix-sum sequence.",
  },
  {
    id: "py-snippet-islice-take",
    language: "python",
    title: "itertools.islice takes the first N items from any iterable",
    tag: "snippet",
    code: `from itertools import islice

def integers():
    n = 0
    while True:
        yield n
        n += 1

first10 = list(islice(integers(), 10))
print(first10)  # [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

# With start and stop
evens = islice(range(100), 0, 20, 2)
print(list(evens))  # [0, 2, 4, 6, 8, 10, 12, 14, 16, 18]`,
    explanation: "islice(iterable, stop) or islice(iterable, start, stop, step) slices any iterable like a list without materialising it; essential for consuming the first N items from an infinite generator.",
  },
  {
    id: "py-snippet-groupby-sorted",
    language: "python",
    title: "itertools.groupby groups consecutive equal keys",
    tag: "snippet",
    code: `from itertools import groupby

# IMPORTANT: input must be sorted by the key first
data = sorted(['apple', 'avocado', 'banana', 'blueberry', 'cherry'],
               key=lambda w: w[0])

for letter, words in groupby(data, key=lambda w: w[0]):
    print(letter, list(words))
# a ['apple', 'avocado']
# b ['banana', 'blueberry']
# c ['cherry']`,
    explanation: "groupby groups consecutive elements with the same key value; if the input is not sorted by that key, the same key can appear in multiple groups, so always sort first.",
  },
  {
    id: "py-snippet-contextlib-suppress",
    language: "python",
    title: "contextlib.suppress silences specific exceptions",
    tag: "snippet",
    code: `from contextlib import suppress
import os

# Instead of:
# try:
#     os.remove('maybe_exists.txt')
# except FileNotFoundError:
#     pass

with suppress(FileNotFoundError):
    os.remove('maybe_exists.txt')

# Suppress multiple exception types
with suppress(KeyError, IndexError):
    d = {}
    _ = d['missing']`,
    explanation: "contextlib.suppress is the idiomatic one-liner for 'do X, ignore specific exception'; it replaces a try/except/pass block and makes the intent explicit.",
  },
  {
    id: "py-snippet-fstring-equals",
    language: "python",
    title: "f-string = suffix prints name and value for debugging",
    tag: "snippet",
    code: `x = 42
y = [1, 2, 3]
name = 'Alice'

print(f'{x=}')       # x=42
print(f'{y=}')       # y=[1, 2, 3]
print(f'{name=}')    # name='Alice'
print(f'{x + 1=}')  # x + 1=43

# Useful in debugging without a separate print per variable
a, b = 10, 20
print(f'{a=} {b=} {a+b=}')  # a=10 b=20 a+b=30`,
    explanation: "The = specifier in f-strings (Python 3.8+) prints the expression text followed by its repr, replacing print(f'x={x}') with the cleaner print(f'{x=}').",
  },
  {
    id: "py-understanding-gil-io-bound",
    language: "python",
    title: "The GIL does not block I/O-bound threads",
    tag: "understanding",
    code: `import threading, time

def download(url):
    import urllib.request
    # GIL is released during I/O syscalls
    # Other threads can run while this thread waits for network
    time.sleep(0.1)   # simulate I/O wait

threads = [threading.Thread(target=download, args=('http://x',))
           for _ in range(10)]
start = time.time()
for t in threads: t.start()
for t in threads: t.join()
print(f'{time.time()-start:.2f}s')  # ~0.1s, not 1.0s`,
    explanation: "CPython's GIL is released during I/O system calls (network, disk, sleep); multiple I/O-bound threads can overlap their waits, so threading provides real concurrency for I/O-heavy workloads.",
  },
  {
    id: "py-understanding-is-small-int",
    language: "python",
    title: "is works for small integers due to CPython caching",
    tag: "understanding",
    code: `a = 256
b = 256
print(a is b)    # True  -- cached singleton

x = 257
y = 257
print(x is y)   # False (in many contexts) -- different objects
print(x == y)   # True  -- always use == for value comparison

# In a REPL or interactive session, results may differ
# Never use 'is' to compare integers (or strings) by value`,
    explanation: "CPython caches integers from -5 to 256 as singletons; 'is' happens to return True for these but this is an implementation detail. Always use == to compare values.",
  },
  {
    id: "py-understanding-hash-eq-contract",
    language: "python",
    title: "If a == b, then hash(a) must equal hash(b)",
    tag: "understanding",
    code: `class BadKey:
    def __eq__(self, other): return True   # all equal
    # Missing __hash__ -- Python sets it to None!

# With hash: any two equal objects MUST have the same hash
class GoodKey:
    def __init__(self, v): self.v = v
    def __eq__(self, other): return self.v == other.v
    def __hash__(self): return hash(self.v)

k1, k2 = GoodKey(1), GoodKey(1)
print(k1 == k2)          # True
print(hash(k1) == hash(k2))  # True
d = {k1: 'found'}
print(d[k2])             # found -- lookup succeeds`,
    explanation: "The hash/equality contract: equal objects must hash the same (but unequal objects can collide); violating it makes dict/set lookups silently fail to find keys.",
  },
  {
    id: "py-understanding-mro-c3",
    language: "python",
    title: "MRO (Method Resolution Order) uses C3 linearisation",
    tag: "understanding",
    code: `class A:
    def greet(self): return 'A'

class B(A):
    def greet(self): return 'B'

class C(A):
    def greet(self): return 'C'

class D(B, C):
    pass

print(D().greet())       # B  (MRO: D -> B -> C -> A)
print([c.__name__ for c in D.__mro__])
# ['D', 'B', 'C', 'A', 'object']`,
    explanation: "Python's C3 linearisation algorithm computes a consistent method resolution order for diamond inheritance; the MRO ensures each class appears before its parents and respects declaration order.",
  },
  {
    id: "py-understanding-descriptor-none",
    language: "python",
    title: "__get__(None, cls) is called when accessed on the class",
    tag: "understanding",
    code: `class MyDescriptor:
    def __get__(self, obj, objtype=None):
        if obj is None:
            return self          # accessed on class: return descriptor
        return f'instance of {objtype.__name__}'

class MyClass:
    attr = MyDescriptor()

print(MyClass.attr)          # <MyDescriptor object> -- self returned
print(MyClass().attr)        # instance of MyClass`,
    explanation: "When __get__ is called via the class (not an instance), obj is None; returning self allows the descriptor to be retrieved directly from the class, enabling patterns like class-level documentation or chaining.",
  },
  {
    id: "py-structures-weakref-usage",
    language: "python",
    title: "weakref.ref avoids reference cycles",
    tag: "structures",
    code: `import weakref

class Node:
    def __init__(self, val):
        self.val = val
        self.parent = None   # would create a cycle if strong ref

class Tree:
    def __init__(self, root: Node):
        self.root = root
        root.parent = weakref.ref(self)  # weak reference

t = Tree(Node(1))
print(t.root.parent())   # <Tree object>  -- dereference with ()
del t
print(t.root.parent())   # None -- referent was collected`,
    explanation: "weakref.ref holds a reference that doesn't prevent garbage collection; calling it returns the referent or None if it was collected. Use it to break cycles between parent and child objects.",
  },
  {
    id: "py-structures-queue-threadsafe",
    language: "python",
    title: "queue.Queue is thread-safe for producer-consumer",
    tag: "structures",
    code: `import queue, threading

q = queue.Queue(maxsize=5)

def producer():
    for i in range(10):
        q.put(i)           # blocks if full
    q.put(None)            # sentinel

def consumer():
    while True:
        item = q.get()     # blocks if empty
        if item is None: break
        print(item, end=' ')
        q.task_done()

t = threading.Thread(target=producer); t.start()
consumer()`,
    explanation: "queue.Queue uses internal locks for thread-safe put/get; put blocks when full and get blocks when empty, providing natural backpressure without manual locking.",
  },
  {
    id: "py-structures-deque-maxlen",
    language: "python",
    title: "deque(maxlen=N) is a fixed-size sliding window",
    tag: "structures",
    code: `from collections import deque

# Keep last 3 values, oldest auto-evicted on append
window = deque(maxlen=3)
for n in range(7):
    window.append(n)
    print(list(window))
# [0] / [0,1] / [0,1,2] / [1,2,3] / [2,3,4] / [3,4,5] / [4,5,6]

recent = deque(maxlen=5)
recent.extend([10, 20, 30, 40, 50, 60])
print(list(recent))   # [20, 30, 40, 50, 60]`,
    explanation: "A bounded deque automatically discards from the opposite end when full; it's the canonical O(1) sliding window without explicit size management.",
  },
  {
    id: "py-structures-typing-namedtuple",
    language: "python",
    title: "typing.NamedTuple gives typed named tuples",
    tag: "structures",
    code: `from typing import NamedTuple

class Point(NamedTuple):
    x: float
    y: float
    label: str = ''   # optional with default

p = Point(1.0, 2.0, 'A')
print(p.x, p.y, p.label)   # 1.0 2.0 A
print(p[0])                  # 1.0  (tuple indexing still works)
print(p._asdict())           # {'x': 1.0, 'y': 2.0, 'label': 'A'}
print(isinstance(p, tuple))  # True`,
    explanation: "typing.NamedTuple is the class-based syntax for named tuples with type annotations and defaults; it's preferred over collections.namedtuple for type-checked code.",
  },
  {
    id: "py-caveats-string-intern",
    language: "python",
    title: "String interning: only simple identifiers are guaranteed",
    tag: "caveats",
    code: `# Compile-time constants are often interned
a = 'hello'
b = 'hello'
print(a is b)   # True (usually -- implementation detail)

# Strings with spaces are NOT guaranteed interned
x = 'hello world'
y = 'hello world'
print(x is y)   # False (or True in some contexts)

# Safe pattern: use sys.intern for deliberate interning
import sys
s1 = sys.intern('some long key string')
s2 = sys.intern('some long key string')
print(s1 is s2)   # True -- guaranteed`,
    explanation: "CPython interns short identifier-like strings automatically, but this is an optimisation detail; only strings explicitly interned with sys.intern() are guaranteed to be singletons.",
  },
  {
    id: "py-caveats-try-else-finally",
    language: "python",
    title: "try/except/else/finally: else runs only on no exception",
    tag: "caveats",
    code: `def read_file(path):
    try:
        f = open(path)
    except FileNotFoundError:
        print('file not found')
    else:
        # Runs ONLY if no exception was raised in try
        data = f.read()
        f.close()
        return data
    finally:
        # ALWAYS runs, even if return in else or except
        print('done')

result = read_file('/etc/hostname')
print(result)`,
    explanation: "The else clause runs when the try block completes without raising; it separates 'the operation that might fail' from 'what to do on success', making exception handling more precise.",
  },
  {
    id: "py-caveats-circular-import",
    language: "python",
    title: "Circular imports cause AttributeError at import time",
    tag: "caveats",
    code: `# a.py:  from b import B_val  -- imports b.py
# b.py:  from a import A_val  -- imports a.py (already being imported!)
# Python returns the partially-initialized a module,
# A_val may not exist yet -> AttributeError

# Fix 1: import the module, not the name
# In b.py: import a; use a.A_val when called (not at import time)

# Fix 2: move the import inside the function
# def func(): from a import A_val

# Fix 3: restructure to remove the cycle`,
    explanation: "Circular imports fail because Python returns a partially initialised module object; the fix is to defer the import inside a function, import the module object instead of a name, or break the cycle.",
  },
  {
    id: "py-types-typed-dict",
    language: "python",
    title: "TypedDict annotates a dict with specific key types",
    tag: "types",
    code: `from typing import TypedDict, Required, NotRequired

class Movie(TypedDict):
    title: str
    year: int
    rating: NotRequired[float]   # optional key

def display(m: Movie) -> str:
    return f"{m['title']} ({m['year']})"

film: Movie = {'title': 'Inception', 'year': 2010}
print(display(film))   # Inception (2010)
# film['rating'] = 8.8  -- valid, NotRequired means may be absent`,
    explanation: "TypedDict defines the expected key-value types for a plain dict; type checkers verify key presence and value types without requiring a class instance.",
  },
  {
    id: "py-types-generic-class",
    language: "python",
    title: "Generic class parameterised by TypeVar",
    tag: "types",
    code: `from typing import TypeVar, Generic

T = TypeVar('T')

class Stack(Generic[T]):
    def __init__(self) -> None:
        self._items: list[T] = []
    def push(self, item: T) -> None:
        self._items.append(item)
    def pop(self) -> T:
        return self._items.pop()

s: Stack[int] = Stack()
s.push(1)
s.push(2)
print(s.pop())   # 2`,
    explanation: "Generic[T] makes the class parameterisable; type checkers propagate T through push and pop, so Stack[int].pop() is typed as int and Stack[str].pop() as str.",
  },
  {
    id: "py-types-get-type-hints",
    language: "python",
    title: "typing.get_type_hints resolves forward references at runtime",
    tag: "types",
    code: `from typing import get_type_hints, Optional
from dataclasses import dataclass

@dataclass
class Node:
    value: int
    next: Optional['Node'] = None   # forward reference as string

hints = get_type_hints(Node)
print(hints)
# {'value': <class 'int'>, 'next': typing.Optional[ForwardRef('Node')]}

# get_type_hints evaluates string annotations in the right namespace
print(hints['next'])  # typing.Optional[Node]`,
    explanation: "get_type_hints() evaluates stringified annotations (forward references) in the module's namespace; use it instead of __annotations__ when forward references must be resolved.",
  },
];
