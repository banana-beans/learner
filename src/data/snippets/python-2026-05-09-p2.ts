import type { Snippet } from "./types";

export const pythonSnippets20260509P2: Snippet[] = [
  {
    id: "py-types-annotated-metadata",
    language: "python",
    title: "Annotated attaches metadata to a type hint",
    tag: "types",
    code: `from typing import Annotated

Positive = Annotated[int, 'must be > 0']
Percentage = Annotated[float, 'range: 0.0-100.0']

def set_speed(pct: Percentage) -> None:
    assert 0.0 <= pct <= 100.0, 'out of range'
    print(f'speed: {pct}%')

set_speed(75.0)
# Libraries like Pydantic and FastAPI read the metadata at runtime`,
    explanation: "Annotated[T, ...] wraps a type with arbitrary metadata that frameworks can introspect at runtime; the type checker still treats it as plain T for static analysis.",
  },
  {
    id: "py-families-re-flags-cmp",
    language: "python",
    title: "re flags: IGNORECASE, MULTILINE, DOTALL",
    tag: "families",
    code: `import re
text = 'Hello\\nWorld'

# IGNORECASE: case-insensitive match
print(bool(re.search(r'hello', text, re.I)))       # True

# MULTILINE: ^ and $ match line boundaries
print(bool(re.search(r'^World$', text, re.M)))     # True

# DOTALL: . matches newline too
print(bool(re.search(r'Hello.World', text, re.S))) # True

# Combine flags with |
print(bool(re.search(r'^hello.world$', text, re.I|re.S|re.M)))`,
    explanation: "re flags change how metacharacters are interpreted; combine them with | (bitwise OR) or embed inline with (?i), (?m), (?s) inside the pattern string.",
  },
  {
    id: "py-classes-iter-custom",
    language: "python",
    title: "__iter__ and __next__ implement the iterator protocol",
    tag: "classes",
    code: `class Countdown:
    def __init__(self, start): self.current = start
    def __iter__(self): return self
    def __next__(self):
        if self.current <= 0: raise StopIteration
        val = self.current
        self.current -= 1
        return val

for n in Countdown(5):
    print(n, end=' ')
# 5 4 3 2 1`,
    explanation: "__iter__ returns the iterator object (self here) and __next__ returns successive values or raises StopIteration; any object implementing both works in for-loops, list(), and all other iterator consumers.",
  },
  {
    id: "py-snippet-any-all-check",
    language: "python",
    title: "any() and all() with generator expressions",
    tag: "snippet",
    code: `nums = [2, 4, 6, 8, 9]
print(all(n % 2 == 0 for n in nums))   # False (9 is odd)
print(any(n % 2 != 0 for n in nums))   # True  (9 is odd)

# Short-circuits: stops at first False (all) or True (any)
def check(n): print(f'checking {n}'); return n > 0
result = all(check(n) for n in [1, 2, -1, 4])
# prints: checking 1, checking 2, checking -1 -- stops there`,
    explanation: "any() and all() short-circuit over generator expressions; they don't build the full list, stopping as soon as the outcome is determined.",
  },
  {
    id: "py-understanding-unbound-local",
    language: "python",
    title: "UnboundLocalError: assignment makes a name local throughout",
    tag: "understanding",
    code: `x = 10

def bad():
    print(x)   # UnboundLocalError! x is local because of line below
    x = 20

def good_global():
    global x
    print(x)   # 10 -- reads module-level x
    x = 20

def make_counter(val):
    def inner():
        nonlocal val
        val += 1
        return val
    return inner`,
    explanation: "If Python sees any assignment to a name anywhere in a function body, that name is treated as local for the entire function -- even lines above the assignment raise UnboundLocalError.",
  },
  {
    id: "py-structures-defaultdict-list",
    language: "python",
    title: "defaultdict(list) groups items without key checks",
    tag: "structures",
    code: `from collections import defaultdict
words = ['apple', 'ant', 'banana', 'bear', 'cherry']

by_letter = defaultdict(list)
for word in words:
    by_letter[word[0]].append(word)  # no KeyError on first access

print(dict(by_letter))
# {'a': ['apple', 'ant'], 'b': ['banana', 'bear'], 'c': ['cherry']}`,
    explanation: "defaultdict calls its factory (list here) whenever a missing key is accessed, eliminating the if-key-not-in-dict-then-initialize boilerplate pattern.",
  },
  {
    id: "py-caveats-dict-iter-mutate",
    language: "python",
    title: "Changing dict size during iteration raises RuntimeError",
    tag: "caveats",
    code: `d = {'a': 1, 'b': 2, 'c': 3}
try:
    for k in d:
        if d[k] < 2:
            del d[k]   # RuntimeError: dictionary changed size
except RuntimeError as e:
    print(e)

# Fix: iterate over a snapshot of keys
for k in list(d.keys()):
    if d[k] < 2:
        del d[k]
print(d)  # {'b': 2, 'c': 3}`,
    explanation: "Python detects dict mutation during iteration and raises RuntimeError; the fix is to iterate over list(d.keys()) which snapshots the keys before the loop starts.",
  },
  {
    id: "py-types-paramspec-decorator",
    language: "python",
    title: "ParamSpec preserves callable signatures in decorators",
    tag: "types",
    code: `from typing import Callable, TypeVar, ParamSpec
import functools

P = ParamSpec('P')
R = TypeVar('R')

def log_call(fn: Callable[P, R]) -> Callable[P, R]:
    @functools.wraps(fn)
    def wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
        print(f'calling {fn.__name__}')
        return fn(*args, **kwargs)
    return wrapper

@log_call
def add(a: int, b: int) -> int:
    return a + b
print(add(2, 3))  # calling add / 5`,
    explanation: "ParamSpec captures the full parameter specification of a callable so that decorated functions retain their original signature in type checkers rather than collapsing to (*args, **kwargs).",
  },
  {
    id: "py-families-abc-protocol-cmp",
    language: "python",
    title: "ABC vs Protocol: nominal vs structural subtyping",
    tag: "families",
    code: `from abc import ABC, abstractmethod
from typing import Protocol

class Drawable(ABC):          # nominal: must explicitly inherit
    @abstractmethod
    def draw(self): ...

class Renderable(Protocol):   # structural: duck typing
    def draw(self) -> None: ...

class Circle:                 # doesn't inherit Drawable
    def draw(self): print('O')

# Circle satisfies Renderable structurally without inheriting it
# ABCs require explicit inheritance; Protocols do not`,
    explanation: "ABCs require explicit inheritance (nominal typing); Protocols use duck typing -- any class with the required methods satisfies the Protocol, making them ideal for libraries that shouldn't impose an inheritance hierarchy.",
  },
  {
    id: "py-classes-new-singleton",
    language: "python",
    title: "__new__ implements a singleton at the class level",
    tag: "classes",
    code: `class Singleton:
    _instance = None
    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    def __init__(self, val): self.val = val

a = Singleton(1)
b = Singleton(2)
print(a is b)        # True -- same object
print(a.val)         # 2 -- __init__ ran again on same instance`,
    explanation: "__new__ controls object creation and returns the instance before __init__ is called; returning an existing instance every time implements the singleton pattern without metaclass machinery.",
  },
  {
    id: "py-snippet-chain-compare",
    language: "python",
    title: "Chained comparisons are evaluated as a conjunction",
    tag: "snippet",
    code: `# Python allows: a < b < c  which means  a < b and b < c
x = 5
print(1 < x < 10)       # True
print(0 <= x <= 5)      # True
print(1 < x < 4)        # False

# Each operand is evaluated only once
import random
y = random.randint(1, 9)
print(0 < y < 10)       # True for any result`,
    explanation: "Chained comparisons are syntactic sugar for and-joined pairs; Python evaluates each operand only once, which matters when a term has side effects or is expensive.",
  },
  {
    id: "py-understanding-floor-neg",
    language: "python",
    title: "Floor division rounds toward negative infinity",
    tag: "understanding",
    code: `print(7 // 2)     #  3  (floor of 3.5)
print(-7 // 2)    # -4  (floor of -3.5, NOT -3!)
print(7 // -2)    # -4

# Compare with int() which truncates toward zero:
import math
print(math.trunc(-7 / 2))   # -3  (truncation)
print(-7 // 2)               # -4  (floor)
print(-7 % 2)                #  1  (always same sign as divisor)`,
    explanation: "Python's // operator always rounds toward negative infinity (true floor division), unlike C/Java's integer division which truncates toward zero; this also affects the sign of the % remainder.",
  },
  {
    id: "py-structures-ordereddict-move-end",
    language: "python",
    title: "OrderedDict.move_to_end implements LRU eviction",
    tag: "structures",
    code: `from collections import OrderedDict

cache = OrderedDict()
cache['a'] = 1
cache['b'] = 2
cache['c'] = 3

# Access 'a' -- move it to most-recently-used end
cache.move_to_end('a')
print(list(cache))        # ['b', 'c', 'a']

# Evict LRU (first item)
lru_key, _ = cache.popitem(last=False)
print(lru_key)            # b`,
    explanation: "OrderedDict.move_to_end() is the building block for a manual LRU cache; move accessed items to the 'last' end and evict from the 'first' end. Python 3.2+ functools.lru_cache does this automatically.",
  },
  {
    id: "py-caveats-shallow-copy-nested",
    language: "python",
    title: "list.copy() is shallow -- nested objects are shared",
    tag: "caveats",
    code: `import copy
original = [[1, 2], [3, 4], [5, 6]]
shallow  = original.copy()
deep     = copy.deepcopy(original)

shallow[0].append(99)
print(original[0])   # [1, 2, 99] -- shared reference!
print(deep[0])       # [1, 2]     -- independent copy`,
    explanation: "Shallow copy creates a new outer container but the inner objects remain the same references; mutating a nested list affects both the original and the copy. Use copy.deepcopy() when inner objects must be independent.",
  },
  {
    id: "py-types-typeguard-narrowing",
    language: "python",
    title: "TypeGuard narrows a union type in an if branch",
    tag: "types",
    code: `from typing import TypeGuard, Union

def is_str_list(val: list) -> TypeGuard[list[str]]:
    return all(isinstance(x, str) for x in val)

def process(items: Union[list[str], list[int]]) -> None:
    if is_str_list(items):
        # type checker knows items: list[str] here
        print(', '.join(items))
    else:
        print(sum(items))  # type: ignore

process(['a', 'b', 'c'])   # a, b, c
process([1, 2, 3])          # 6`,
    explanation: "TypeGuard[T] as a return type annotation tells the type checker that a True return means the argument has been narrowed to T, enabling precise type inference in the guarded branch.",
  },
  {
    id: "py-families-iter-gen-cmp",
    language: "python",
    title: "Iterable vs Iterator vs Generator: the hierarchy",
    tag: "families",
    code: `# Iterable: has __iter__ (lists, tuples, sets, dicts, strings)
lst = [1, 2, 3]
for x in lst: pass      # OK -- lst is iterable
for x in lst: pass      # OK -- can re-iterate

# Iterator: has __iter__ + __next__ (single-pass)
it = iter(lst)
print(next(it))   # 1
print(next(it))   # 2

# Generator: iterator created by a function with yield
def gen():
    yield 1; yield 2
g = gen()
print(next(g))    # 1  -- lazy, one value at a time`,
    explanation: "All generators are iterators, all iterators are iterables, but not vice versa; the key distinction is that iterables can be re-traversed, while iterators and generators are single-pass.",
  },
  {
    id: "py-classes-class-decorator-reg",
    language: "python",
    title: "Class decorator registers classes in a global registry",
    tag: "classes",
    code: `registry = {}

def register(cls):
    registry[cls.__name__] = cls
    return cls

@register
class Dog:
    def speak(self): return 'woof'

@register
class Cat:
    def speak(self): return 'meow'

print(list(registry))        # ['Dog', 'Cat']
obj = registry['Dog']()
print(obj.speak())           # woof`,
    explanation: "A class decorator is a callable that receives the class object and returns it (possibly modified); using one for registration is simpler than a metaclass when you just want to collect classes at import time.",
  },
  {
    id: "py-snippet-star-unpack",
    language: "python",
    title: "Star * in assignment unpacks middle elements",
    tag: "snippet",
    code: `first, *middle, last = [1, 2, 3, 4, 5]
print(first)    # 1
print(middle)   # [2, 3, 4]
print(last)     # 5

# Star can appear anywhere in one assignment
head, *tail = range(5)
*init, final = range(5)
a, b, *_ = (10, 20, 30, 40, 50)  # discard rest
print(a, b)     # 10 20`,
    explanation: "The starred assignment target (*middle) greedily absorbs all elements between the fixed targets into a list; it can appear in any position but only once per assignment.",
  },
  {
    id: "py-understanding-sorted-stable",
    language: "python",
    title: "Python's sort is stable: equal elements keep their order",
    tag: "understanding",
    code: `records = [('Alice', 'B'), ('Bob', 'A'), ('Carol', 'B'), ('Dave', 'A')]
by_grade = sorted(records, key=lambda r: r[1])
print(by_grade)
# [('Bob', 'A'), ('Dave', 'A'), ('Alice', 'B'), ('Carol', 'B')]
# Bob stays before Dave (both 'A'), Alice before Carol (both 'B')
# Timsort (CPython's algorithm) is always stable`,
    explanation: "Python uses Timsort, a stable algorithm; when two elements compare equal under the key function, their original relative order is preserved -- allowing multi-key sorts by chaining single-key sorts.",
  },
  {
    id: "py-structures-chainmap-layers",
    language: "python",
    title: "ChainMap creates layered configuration lookup",
    tag: "structures",
    code: `from collections import ChainMap
defaults   = {'color': 'blue', 'size': 'M', 'debug': False}
user_prefs = {'color': 'red'}
cli_args   = {'debug': True}

cfg = ChainMap(cli_args, user_prefs, defaults)
print(cfg['color'])   # red   (user_prefs wins)
print(cfg['debug'])   # True  (cli_args wins)
print(cfg['size'])    # M     (only in defaults)

cfg['color'] = 'green'
print(user_prefs['color'])  # red (unchanged)`,
    explanation: "ChainMap layers multiple mappings into a logical view; lookups search left-to-right and stop at the first match, and writes always go to the first map -- perfect for config with defaults.",
  },
  {
    id: "py-caveats-falsy-containers",
    language: "python",
    title: "Empty containers are falsy -- and so are 0 and 0.0",
    tag: "caveats",
    code: `# Falsy: False, None, 0, 0.0, '', [], {}, set(), ()
for val in [0, 0.0, '', [], {}, None, False]:
    print(repr(val), '->', bool(val))

# Common bug: treating 0 as 'not set'
count = 0
if count:                   # BUG: 0 is falsy
    print('has count')
if count is not None:       # correct: distinguishes 0 from None
    print('count is', count)  # count is 0`,
    explanation: "Python's truthiness conflates absence with zero/empty; use explicit None checks (is not None) when 0 or an empty container is a valid value that should be treated as present.",
  },
  {
    id: "py-types-never-type",
    language: "python",
    title: "Never marks code paths that never return normally",
    tag: "types",
    code: `from typing import NoReturn

def crash(msg: str) -> NoReturn:
    raise RuntimeError(msg)

from typing import Never, Literal

def assert_unreachable(x: Never) -> Never:
    raise AssertionError(f'Unreachable: {x!r}')

def handle(mode: Literal['read', 'write']) -> None:
    if mode == 'read': return
    if mode == 'write': return
    assert_unreachable(mode)  # type checker sees mode as Never here`,
    explanation: "NoReturn means a function always raises or loops forever; Never (PEP 655) is used for exhaustiveness checks so type checkers verify every case of a union is handled.",
  },
  {
    id: "py-families-abc-container-cmp",
    language: "python",
    title: "collections.abc ABCs for containers",
    tag: "families",
    code: `from collections.abc import Sequence, Mapping, MutableMapping

# isinstance checks via ABC
print(isinstance([], Sequence))          # True
print(isinstance({}, Mapping))           # True
print(isinstance({}, MutableMapping))    # True
print(isinstance((1,2), MutableMapping)) # False

# Inheriting MutableMapping requires:
# __getitem__, __setitem__, __delitem__, __len__, __iter__
# You get: get(), keys(), values(), items(), __contains__ for free`,
    explanation: "collections.abc ABCs provide both runtime isinstance checks and mixin methods; implementing the abstract methods gives you all derived methods automatically through multiple inheritance.",
  },
  {
    id: "py-classes-dataclass-frozen",
    language: "python",
    title: "frozen=True makes a dataclass immutable and hashable",
    tag: "classes",
    code: `from dataclasses import dataclass

@dataclass(frozen=True)
class Point:
    x: float
    y: float

p = Point(1.0, 2.0)
# p.x = 3.0  # raises FrozenInstanceError

# Frozen dataclasses are hashable -- usable as dict keys or in sets
d = {p: 'origin-ish'}
s = {Point(0, 0), Point(1, 1), Point(0, 0)}
print(len(s))   # 2  (duplicate removed)`,
    explanation: "frozen=True generates __setattr__ and __delattr__ that raise FrozenInstanceError, and also generates __hash__ so instances can be used in sets and as dict keys.",
  },
  {
    id: "py-snippet-divmod-usage",
    language: "python",
    title: "divmod returns quotient and remainder in one call",
    tag: "snippet",
    code: `seconds = 3661
hours, rem = divmod(seconds, 3600)
minutes, secs = divmod(rem, 60)
print(f'{hours}h {minutes}m {secs}s')  # 1h 1m 1s

# Decompose byte sizes
def human_bytes(n):
    for unit in ('B', 'KB', 'MB', 'GB'):
        if n < 1024: return f'{n:.1f} {unit}'
        n //= 1024
    return f'{n} TB'
print(human_bytes(1536))   # 1 KB`,
    explanation: "divmod(a, b) returns (a // b, a % b) in a single operation; it's especially readable when decomposing time or byte sizes into hierarchical units.",
  }
];
