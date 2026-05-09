import type { Snippet } from "./types";

export const pythonSnippets20260509B3P1: Snippet[] = [
  {
    id: "py-snippet-dict-merge-update",
    language: "python",
    title: "Dict merge with | and |= operators (Python 3.9+)",
    tag: "snippet",
    code: `d1 = {'a': 1, 'b': 2}
d2 = {'b': 3, 'c': 4}

# | creates a new merged dict; right side wins on conflicts
merged = d1 | d2
print(merged)  # {'a': 1, 'b': 3, 'c': 4}

# |= updates d1 in place
d1 |= d2
print(d1)      # {'a': 1, 'b': 3, 'c': 4}

# Equivalent pre-3.9 idiom
old = {**d1, **d2}`,
    explanation: "The | operator (Python 3.9+) merges dicts and returns a new one; |= merges in place. The rightmost dict wins for duplicate keys, matching the spread idiom {**d1, **d2} but with cleaner syntax.",
  },
  {
    id: "py-snippet-frozenset-ops",
    language: "python",
    title: "frozenset: immutable set usable as dict key",
    tag: "snippet",
    code: `fs = frozenset([1, 2, 3, 2, 1])
print(fs)             # frozenset({1, 2, 3})

# Can be used as a dict key or set element (hashable)
d = {frozenset({1, 2}): 'pair', frozenset({3}): 'single'}
print(d[frozenset({1, 2})])  # pair

# Set operations work on frozenset
a = frozenset({1, 2, 3})
b = frozenset({2, 3, 4})
print(a & b)   # frozenset({2, 3})
print(a | b)   # frozenset({1, 2, 3, 4})`,
    explanation: "frozenset is the immutable counterpart to set; because it's hashable it can be used as a dictionary key or as an element of another set, unlike mutable sets.",
  },
  {
    id: "py-snippet-bytes-operations",
    language: "python",
    title: "bytes: slicing, joining, and decoding",
    tag: "snippet",
    code: `data = b'Hello, World!'

# Slicing returns bytes
print(data[:5])           # b'Hello'
print(data[-6:])          # b'orld!'

# Join multiple byte strings
parts = [b'foo', b'bar', b'baz']
print(b'-'.join(parts))   # b'foo-bar-baz'

# Decode to str
print(data.decode('utf-8'))   # Hello, World!

# Check membership
print(b'World' in data)       # True
print(data.find(b'World'))    # 7`,
    explanation: "bytes objects support most str operations (slicing, find, join, split) and return bytes; decode() converts to str using a specified codec. They are immutable; use bytearray for in-place mutation.",
  },
  {
    id: "py-snippet-memoryview-slice",
    language: "python",
    title: "memoryview enables zero-copy slicing of binary data",
    tag: "snippet",
    code: `data = bytearray(b'Hello, World!')
view = memoryview(data)

# Slicing a memoryview doesn't copy
chunk = view[7:12]
print(bytes(chunk))   # b'World'

# Modify through the view -- affects original
view[0:5] = b'Howdy'
print(data)   # bytearray(b'Howdy, World!')

# Works with bytes, bytearray, array.array
import array
arr = array.array('i', [1, 2, 3, 4])
mv = memoryview(arr)
print(mv[1])   # 2`,
    explanation: "memoryview exposes the buffer protocol interface; slicing creates a view without copying the underlying bytes. Use it when passing sub-sections of large binary buffers to I/O functions to avoid allocation.",
  },
  {
    id: "py-snippet-complex-numbers",
    language: "python",
    title: "Python has built-in complex number support",
    tag: "snippet",
    code: `z1 = 3 + 4j
z2 = 1 - 2j

print(z1 + z2)    # (4+2j)
print(z1 * z2)    # (11-2j)
print(abs(z1))    # 5.0  -- magnitude
print(z1.real)    # 3.0
print(z1.imag)    # 4.0
print(z1.conjugate())  # (3-4j)

import cmath
print(cmath.phase(z1))  # 0.927... radians
print(cmath.polar(z1))  # (5.0, 0.927...)`,
    explanation: "Python uses j (not i) for the imaginary unit; complex literals like 3+4j are a built-in type. The cmath module provides complex-aware versions of math functions like sqrt, exp, and log.",
  },
  {
    id: "py-snippet-divmod",
    language: "python",
    title: "divmod() returns quotient and remainder in one call",
    tag: "snippet",
    code: `q, r = divmod(17, 5)
print(q, r)   # 3 2  (17 = 3*5 + 2)

# Useful for time conversion
total_seconds = 3723
minutes, seconds = divmod(total_seconds, 60)
hours,   minutes = divmod(minutes, 60)
print(f'{hours}h {minutes}m {seconds}s')  # 1h 2m 3s

# Works with floats too
print(divmod(7.5, 2.5))   # (3.0, 0.0)
print(divmod(-7, 2))       # (-4, 1) -- floor division`,
    explanation: "divmod(a, b) is equivalent to (a // b, a % b) but computed in a single operation; it's useful for cascading unit conversions like seconds → hours/minutes/seconds.",
  },
  {
    id: "py-snippet-round-banker",
    language: "python",
    title: "Python's round() uses banker's rounding (round-half-to-even)",
    tag: "snippet",
    code: `# Python rounds .5 to the nearest EVEN number
print(round(0.5))   # 0  (rounds to even)
print(round(1.5))   # 2  (rounds to even)
print(round(2.5))   # 2  (rounds to even)
print(round(3.5))   # 4  (rounds to even)

# Specify decimal places
print(round(3.14159, 2))   # 3.14
print(round(3.14159, 3))   # 3.142

# Use Decimal for precise rounding control
from decimal import Decimal, ROUND_HALF_UP
d = Decimal('2.5')
print(d.quantize(Decimal('1'), ROUND_HALF_UP))  # 3`,
    explanation: "Python's built-in round() uses banker's rounding (IEEE 754): 0.5 rounds to the nearest even integer. This reduces statistical bias in bulk calculations. Use Decimal with explicit rounding mode when you need 'half-up' behaviour.",
  },
  {
    id: "py-snippet-any-all",
    language: "python",
    title: "any() and all() short-circuit over iterables",
    tag: "snippet",
    code: `nums = [1, 2, 3, 4, 5]

print(any(n > 4 for n in nums))   # True  (5 > 4)
print(all(n > 0 for n in nums))   # True  (all positive)
print(all(n > 2 for n in nums))   # False (1, 2 not > 2)

# Short-circuit: stops at first True (any) or False (all)
def check(n):
    print(f'checking {n}')
    return n > 3

print(any(check(n) for n in nums))
# checking 1 / checking 2 / checking 3 / checking 4 → True (stops)`,
    explanation: "any() returns True as soon as it finds a truthy element; all() returns False as soon as it finds a falsy element. Both accept any iterable and work lazily with generators, avoiding unnecessary evaluation.",
  },
  {
    id: "py-snippet-min-max-key",
    language: "python",
    title: "min() and max() accept a key function",
    tag: "snippet",
    code: `words = ['banana', 'apple', 'cherry', 'date']

print(min(words))                  # apple (lexicographic)
print(max(words))                  # cherry
print(min(words, key=len))         # date (shortest)
print(max(words, key=len))         # banana (longest)

# Key function on complex objects
people = [{'name': 'Alice', 'age': 30}, {'name': 'Bob', 'age': 25}]
youngest = min(people, key=lambda p: p['age'])
print(youngest['name'])   # Bob`,
    explanation: "The key parameter accepts any callable that maps each element to a comparison value; min/max then find the element whose key value is smallest/largest. The original element (not the key) is returned.",
  },
  {
    id: "py-snippet-sorted-reverse",
    language: "python",
    title: "sorted() is stable and returns a new list",
    tag: "snippet",
    code: `data = [3, 1, 4, 1, 5, 9, 2, 6]

asc  = sorted(data)               # [1, 1, 2, 3, 4, 5, 6, 9]
desc = sorted(data, reverse=True) # [9, 6, 5, 4, 3, 2, 1, 1]

# Key + reverse for secondary sort
students = [('Alice', 90), ('Bob', 85), ('Carol', 90)]
ranked = sorted(students, key=lambda s: (-s[1], s[0]))
print(ranked)  # [('Alice', 90), ('Carol', 90), ('Bob', 85)]

# list.sort() sorts in place; sorted() returns a new list
original = [3, 1, 2]
new_list = sorted(original)  # original unchanged`,
    explanation: "sorted() returns a new sorted list and never modifies the original; list.sort() modifies in place and returns None. Both are stable (equal elements retain their original order), and both accept key and reverse.",
  },
  {
    id: "py-understanding-slots",
    language: "python",
    title: "__slots__ reduces per-instance memory by eliminating __dict__",
    tag: "understanding",
    code: `import sys

class WithDict:
    def __init__(self, x, y):
        self.x = x
        self.y = y

class WithSlots:
    __slots__ = ('x', 'y')
    def __init__(self, x, y):
        self.x = x
        self.y = y

d = WithDict(1, 2)
s = WithSlots(1, 2)
print(sys.getsizeof(d))   # ~48 bytes (object) + dict overhead
print(sys.getsizeof(s))   # ~56 bytes (object with slots, no dict)
print(hasattr(d, '__dict__'))   # True
print(hasattr(s, '__dict__'))   # False`,
    explanation: "__slots__ replaces the per-instance __dict__ with fixed-size slot descriptors, saving ~50-200 bytes per instance. It also prevents accidental attribute creation. The trade-off is loss of dynamic attribute assignment.",
  },
  {
    id: "py-understanding-copy-deepcopy",
    language: "python",
    title: "copy.copy is shallow; copy.deepcopy recurses into nested objects",
    tag: "understanding",
    code: `import copy

original = {'a': [1, 2, 3], 'b': [4, 5]}

shallow = copy.copy(original)
shallow['a'].append(99)
print(original['a'])   # [1, 2, 3, 99]  -- shared list!

deep = copy.deepcopy(original)
deep['a'].append(100)
print(original['a'])   # [1, 2, 3, 99]  -- unaffected

# Shallow copy: new container, same inner objects
# Deep copy: new container AND new inner objects (recursive)`,
    explanation: "copy.copy creates a new container but shares the same inner objects; modifying a mutable inner object affects both copies. copy.deepcopy recursively copies every object in the tree, producing a fully independent clone.",
  },
  {
    id: "py-understanding-property-setter",
    language: "python",
    title: "@property with setter validates attribute assignment",
    tag: "understanding",
    code: `class Temperature:
    def __init__(self, celsius: float = 0.0):
        self._celsius = celsius

    @property
    def celsius(self) -> float:
        return self._celsius

    @celsius.setter
    def celsius(self, value: float) -> None:
        if value < -273.15:
            raise ValueError('below absolute zero')
        self._celsius = value

    @property
    def fahrenheit(self) -> float:
        return self._celsius * 9/5 + 32

t = Temperature(100)
print(t.fahrenheit)   # 212.0
t.celsius = -300      # raises ValueError`,
    explanation: "@property exposes a getter without parentheses; the @<name>.setter decorator intercepts assignments. Computed properties (like fahrenheit) are read-only; setters add validation without changing the caller's interface.",
  },
  {
    id: "py-understanding-class-vars",
    language: "python",
    title: "Class variables are shared; instance variables are per-object",
    tag: "understanding",
    code: `class Counter:
    count = 0          # class variable: shared by all instances

    def __init__(self, name):
        Counter.count += 1
        self.name = name   # instance variable: unique per object

a = Counter('a')
b = Counter('b')
print(Counter.count)   # 2
print(a.count)         # 2 (reads class variable)

# Assigning through instance creates a shadow instance variable
a.count = 99
print(a.count)         # 99 (instance var shadows class var)
print(Counter.count)   # 2  (class var unchanged)`,
    explanation: "Class variables live on the class object and are shared; reading through an instance falls back to the class. Writing through an instance creates a new instance variable that shadows (not modifies) the class variable.",
  },
  {
    id: "py-structures-ordered-dict",
    language: "python",
    title: "collections.OrderedDict remembers insertion order and supports move_to_end",
    tag: "structures",
    code: `from collections import OrderedDict

od = OrderedDict([('a', 1), ('b', 2), ('c', 3)])
print(list(od))   # ['a', 'b', 'c']

od.move_to_end('a')        # move 'a' to end
print(list(od))            # ['b', 'c', 'a']

od.move_to_end('a', last=False)  # move 'a' to front
print(list(od))            # ['a', 'b', 'c']

# popitem(last=False) removes first item (FIFO)
print(od.popitem(last=False))   # ('a', 1)

# Note: plain dict in Python 3.7+ also preserves insertion order
# OrderedDict is still needed for move_to_end and equality order`,
    explanation: "Since Python 3.7, regular dicts preserve insertion order, but OrderedDict additionally provides move_to_end() and considers order in equality comparisons. It's the building block for LRU caches.",
  },
  {
    id: "py-structures-counter-arithmetic",
    language: "python",
    title: "Counter supports arithmetic and set-like operations",
    tag: "structures",
    code: `from collections import Counter

c1 = Counter({'a': 3, 'b': 2, 'c': 1})
c2 = Counter({'b': 1, 'c': 2, 'd': 5})

print(c1 + c2)    # Counter({'d': 5, 'a': 3, 'c': 3, 'b': 3})
print(c1 - c2)    # Counter({'a': 3, 'b': 1})  -- zeros/negatives dropped
print(c1 & c2)    # Counter({'b': 1, 'c': 1})  -- min per key
print(c1 | c2)    # Counter({'d': 5, 'a': 3, 'c': 2, 'b': 2})  -- max per key

# Subtract (keeps negative counts)
c1.subtract(c2)
print(c1)   # Counter({'a': 3, 'b': 1, 'c': -1})`,
    explanation: "Counter supports +, -, &, | operations; subtraction drops non-positive counts while Counter.subtract() keeps them. These operations make it easy to compute word frequency differences or inventory deltas.",
  },
  {
    id: "py-structures-priority-queue",
    language: "python",
    title: "heapq implements a min-heap priority queue",
    tag: "structures",
    code: `import heapq

# heapq is a min-heap: smallest item always at index 0
pq = []
heapq.heappush(pq, (3, 'medium'))
heapq.heappush(pq, (1, 'high'))
heapq.heappush(pq, (5, 'low'))

print(heapq.heappop(pq))   # (1, 'high')
print(heapq.heappop(pq))   # (3, 'medium')

# heapify converts a list in O(n)
data = [5, 3, 8, 1, 2]
heapq.heapify(data)
print(data[0])   # 1 (minimum)

# nlargest / nsmallest
print(heapq.nsmallest(3, data))   # [1, 2, 3]`,
    explanation: "heapq provides a min-heap; tuples are compared lexicographically, so (priority, value) pairs work naturally. For a max-heap, negate the priority. heapify converts an existing list in O(n) vs O(n log n) for repeated pushes.",
  },
  {
    id: "py-structures-trie-basic",
    language: "python",
    title: "Trie (prefix tree) for efficient string prefix lookups",
    tag: "structures",
    code: `class Trie:
    def __init__(self):
        self.children: dict = {}
        self.is_end = False

    def insert(self, word: str) -> None:
        node = self
        for ch in word:
            node = node.children.setdefault(ch, Trie())
        node.is_end = True

    def starts_with(self, prefix: str) -> bool:
        node = self
        for ch in prefix:
            if ch not in node.children:
                return False
            node = node.children[ch]
        return True

t = Trie()
for w in ['apple', 'app', 'banana']:
    t.insert(w)
print(t.starts_with('app'))   # True
print(t.starts_with('ban'))   # True
print(t.starts_with('cat'))   # False`,
    explanation: "A trie stores strings as paths through a tree of single characters; prefix lookup is O(k) where k is the prefix length. It's more memory-efficient than keeping all strings for large shared-prefix datasets.",
  },
  {
    id: "py-caveats-generator-exhaustion",
    language: "python",
    title: "Generators are single-use iterators — once exhausted, they're empty",
    tag: "caveats",
    code: `def evens(n):
    for i in range(n):
        if i % 2 == 0:
            yield i

gen = evens(10)
print(list(gen))   # [0, 2, 4, 6, 8]
print(list(gen))   # []  -- exhausted!

# Also applies to generator expressions
squares = (x*x for x in range(5))
print(sum(squares))     # 30
print(list(squares))    # []  -- already consumed

# Fix: wrap in a function or use a list
squares_list = [x*x for x in range(5)]   # reusable`,
    explanation: "A generator object has internal state; once its StopIteration is raised it never yields again. Always re-create the generator if you need to iterate twice, or materialise it with list() when multiple passes are required.",
  },
  {
    id: "py-caveats-nonlocal-keyword",
    language: "python",
    title: "nonlocal lets an inner function rebind an enclosing scope variable",
    tag: "caveats",
    code: `def make_counter():
    count = 0
    def increment():
        nonlocal count   # without this, count += 1 would be UnboundLocalError
        count += 1
        return count
    return increment

c = make_counter()
print(c())   # 1
print(c())   # 2
print(c())   # 3

# Without nonlocal: reading works, but assignment creates a new local
def broken():
    x = 0
    def inner():
        x += 1   # UnboundLocalError: referenced before assignment
    inner()`,
    explanation: "Without nonlocal, any assignment inside the inner function creates a new local variable, shadowing the outer one. nonlocal explicitly marks the variable as belonging to the nearest enclosing (non-global) scope.",
  },
  {
    id: "py-caveats-decorator-order",
    language: "python",
    title: "Decorator stacking order: innermost decorator applies first",
    tag: "caveats",
    code: `def bold(fn):
    def wrapper(*a, **kw):
        return f'<b>{fn(*a, **kw)}</b>'
    return wrapper

def italic(fn):
    def wrapper(*a, **kw):
        return f'<i>{fn(*a, **kw)}</i>'
    return wrapper

@bold        # applied second (outermost)
@italic      # applied first (innermost)
def greet(name):
    return f'Hello, {name}'

# Equivalent to: greet = bold(italic(greet))
print(greet('Alice'))   # <b><i>Hello, Alice</i></b>`,
    explanation: "Decorators are applied bottom-up: the decorator closest to the function definition wraps first. @bold @italic means bold(italic(greet)), so italic wraps the function and bold wraps italic's result.",
  },
  {
    id: "py-types-self-type",
    language: "python",
    title: "Self type annotation for methods that return the same class",
    tag: "types",
    code: `from __future__ import annotations
from typing import Self

class Builder:
    def __init__(self) -> None:
        self._items: list[str] = []

    def add(self, item: str) -> Self:
        self._items.append(item)
        return self

    def build(self) -> list[str]:
        return self._items.copy()

class ExtendedBuilder(Builder):
    def add_many(self, *items: str) -> Self:
        for item in items:
            self.add(item)
        return self

eb = ExtendedBuilder().add('a').add_many('b', 'c')
print(eb.build())   # ['a', 'b', 'c']`,
    explanation: "Self (Python 3.11+, or via __future__ import) annotates methods that return the same type as the receiver class; this propagates correctly through subclasses, unlike the workaround TypeVar('T', bound='Builder').",
  },
  {
    id: "py-types-final",
    language: "python",
    title: "Final prevents reassignment; @final prevents subclassing or overriding",
    tag: "types",
    code: `from typing import Final, final

MAX_SIZE: Final = 100
# MAX_SIZE = 200  # type checker error: cannot assign to Final variable

@final
class Singleton:
    pass

# class SubSingleton(Singleton): pass  # type checker error

class Base:
    @final
    def locked(self) -> str:
        return 'cannot override'

class Child(Base):
    pass
    # def locked(self): ...  # type checker error`,
    explanation: "Final[T] declares a variable that must not be reassigned; @final on a class prevents subclassing; @final on a method prevents overriding in subclasses. These are enforced by type checkers, not at runtime.",
  },
  {
    id: "py-types-typevar-bound",
    language: "python",
    title: "TypeVar with bound restricts to a type and its subclasses",
    tag: "types",
    code: `from typing import TypeVar

class Animal:
    def speak(self) -> str: return '...'

class Dog(Animal):
    def speak(self) -> str: return 'Woof'

A = TypeVar('A', bound=Animal)   # T must be Animal or a subclass

def make_pair(a: A, b: A) -> tuple[A, A]:
    return (a, b)

d1, d2 = make_pair(Dog(), Dog())   # A inferred as Dog
print(d1.speak())   # Woof

# make_pair(Dog(), 'string')  # type error: str is not bound to Animal`,
    explanation: "bound=SomeClass means the TypeVar can be SomeClass or any subclass; the type checker infers the most specific common type. This preserves the concrete subtype through generic functions, unlike using the base class directly.",
  },
];
