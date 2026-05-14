import type { Snippet } from "./types";
export const pythonSnippets20260514B1: Snippet[] = [
  {
    id: "py-fstring-width-align",
    language: "python",
    title: "f-string width and alignment",
    tag: "snippet",
    code: `name = "Alice"
score = 95.5

print(f"{name:<10}|")   # 'Alice     |'  left-align, width 10
print(f"{name:>10}|")   # '     Alice|'  right-align
print(f"{name:*^10}|")  # '**Alice***|'  center, fill with *
print(f"{score:8.2f}")  # '   95.50'     width 8, 2 decimal places`,
    explanation: "The format spec after `:` supports fill character, alignment (`<`, `>`, `^`), width, and precision — the same mini-language as `str.format()`. This is readable and faster than string concatenation.",
  },
  {
    id: "py-understand-late-bind-close",
    language: "python",
    title: "Late-binding closure in a loop (trace)",
    tag: "understanding",
    code: `fns = [lambda: i for i in range(3)]
print(fns[0]())  # 2  ← NOT 0!
print(fns[1]())  # 2
print(fns[2]())  # 2

# Fix: capture the value at definition time
fns2 = [lambda i=i: i for i in range(3)]
print(fns2[0]())  # 0
print(fns2[1]())  # 1`,
    explanation: "Lambdas capture the variable `i` by reference, not by value; all three closures share the same `i`, which ends up as 2. The default-argument trick forces an early binding.",
  },
  {
    id: "py-deque-maxlen-ring",
    language: "python",
    title: "deque as a fixed-size ring buffer",
    tag: "structures",
    code: `from collections import deque

buf = deque(maxlen=3)
buf.extend([1, 2, 3])
print(list(buf))  # [1, 2, 3]
buf.append(4)
print(list(buf))  # [2, 3, 4]  oldest element dropped
buf.appendleft(0)
print(list(buf))  # [0, 2, 3]  rightmost element dropped`,
    explanation: "Setting `maxlen` turns a deque into a circular buffer: new items that overflow the capacity automatically evict the element from the opposite end.",
  },
  {
    id: "py-caveat-zip-shortest",
    language: "python",
    title: "zip() stops at the shortest iterable",
    tag: "caveats",
    code: `a = [1, 2, 3, 4]
b = ['x', 'y']

list(zip(a, b))        # [(1, 'x'), (2, 'y')]  — items 3,4 silently dropped

# If you need all items, use itertools.zip_longest
from itertools import zip_longest
list(zip_longest(a, b, fillvalue=None))
# [(1,'x'), (2,'y'), (3,None), (4,None)]`,
    explanation: "`zip()` silently discards trailing elements from longer iterables. Use `itertools.zip_longest` when you need to process every element.",
  },
  {
    id: "py-types-never-return",
    language: "python",
    title: "Never for functions that never return",
    tag: "types",
    code: `from typing import Never

def fail(msg: str) -> Never:
    raise RuntimeError(msg)

def process(val: int | None) -> int:
    if val is None:
        fail("val must not be None")
    # type checker knows code below is unreachable if val is None
    return val * 2`,
    explanation: "`Never` (or `NoReturn`) tells the type checker that a function always raises or loops forever, enabling it to narrow types after the call without explicit `assert`.",
  },
  {
    id: "py-families-stringio-bytesio",
    language: "python",
    title: "StringIO vs BytesIO",
    tag: "families",
    code: `from io import StringIO, BytesIO

# StringIO: in-memory text file
sio = StringIO()
sio.write("hello\\n")
sio.seek(0)
print(sio.read())   # 'hello\\n'

# BytesIO: in-memory binary file
bio = BytesIO()
bio.write(b"\\x89PNG")
bio.seek(0)
print(bio.read(4))  # b'\\x89PNG'`,
    explanation: "`StringIO` wraps a `str` buffer and behaves like a text file; `BytesIO` wraps a `bytes` buffer and behaves like a binary file. Both implement the full `io` interface (seek, read, write) without touching disk.",
  },
  {
    id: "py-classes-hash-eq-pair",
    language: "python",
    title: "__eq__ implicitly removes __hash__",
    tag: "classes",
    code: `class Point:
    def __init__(self, x, y):
        self.x, self.y = x, y

    def __eq__(self, other):
        return (self.x, self.y) == (other.x, other.y)

p = Point(1, 2)
# p.__hash__ is now None because __eq__ was defined without __hash__
print(hash(p))   # TypeError: unhashable type: 'Point'

# Fix: explicitly define __hash__
class PointHashable(Point):
    def __hash__(self):
        return hash((self.x, self.y))`,
    explanation: "Python sets `__hash__ = None` on any class that defines `__eq__` but not `__hash__`, making instances unhashable. If you want instances in sets or dict keys, define both.",
  },
  {
    id: "py-fstring-sign-format",
    language: "python",
    title: "f-string sign formatting",
    tag: "snippet",
    code: `x, y = 42, -7

print(f"{x:+d}")   # '+42'  always show sign
print(f"{y:+d}")   # '-7'
print(f"{x: d}")   # ' 42'  space for positive, '-' for negative
print(f"{y: d}")   # '-7'
print(f"{x:-d}")   # '42'   default (sign only for negative)`,
    explanation: "The sign specifier in format specs (`+`, ` `, `-`) controls how positive and negative numbers are displayed — useful for aligning columns that contain both.",
  },
  {
    id: "py-understand-mutable-default",
    language: "python",
    title: "Mutable default argument persists across calls (trace)",
    tag: "understanding",
    code: `def append_to(element, lst=[]):
    lst.append(element)
    return lst

print(append_to(1))  # [1]
print(append_to(2))  # [1, 2]  ← NOT [2]!
print(append_to(3))  # [1, 2, 3]

# Fix: use None sentinel
def safe_append(element, lst=None):
    if lst is None:
        lst = []
    lst.append(element)
    return lst`,
    explanation: "Default argument values are evaluated once at function definition time, so all calls share the same list. The sentinel `None` pattern forces a fresh list each call.",
  },
  {
    id: "py-deque-rotate-shift",
    language: "python",
    title: "deque.rotate() shifts elements",
    tag: "structures",
    code: `from collections import deque

d = deque([1, 2, 3, 4, 5])
d.rotate(2)          # shift right by 2
print(list(d))       # [4, 5, 1, 2, 3]

d.rotate(-3)         # shift left by 3
print(list(d))       # [2, 3, 4, 5, 1]`,
    explanation: "`rotate(n)` moves items from one end to the other in O(n) time — positive rotates right, negative rotates left. It's an efficient way to implement a circular queue.",
  },
  {
    id: "py-caveat-float-equality",
    language: "python",
    title: "Floating-point equality surprises",
    tag: "caveats",
    code: `print(0.1 + 0.2 == 0.3)    # False!
print(0.1 + 0.2)            # 0.30000000000000004

import math
print(math.isclose(0.1 + 0.2, 0.3))  # True

# Or specify tolerance
print(math.isclose(0.1 + 0.2, 0.3, rel_tol=1e-9))  # True`,
    explanation: "IEEE 754 binary floats cannot represent 0.1 exactly, so arithmetic accumulates rounding errors. Use `math.isclose()` for comparisons instead of `==`.",
  },
  {
    id: "py-types-classvar-annotation",
    language: "python",
    title: "ClassVar annotation",
    tag: "types",
    code: `from typing import ClassVar

class Counter:
    count: ClassVar[int] = 0   # class-level, not per-instance

    def __init__(self):
        Counter.count += 1
        self.id = Counter.count

a, b = Counter(), Counter()
print(Counter.count)  # 2
# Type checkers reject: Counter().count = 5  (can't assign to ClassVar via instance)`,
    explanation: "`ClassVar[T]` tells type checkers that the attribute belongs to the class, not instances. Attempting to assign it through an instance is flagged as a type error.",
  },
  {
    id: "py-families-path-pure",
    language: "python",
    title: "PurePath vs Path",
    tag: "families",
    code: `from pathlib import Path, PurePosixPath, PureWindowsPath

# PurePath: no I/O, just string manipulation
p = PurePosixPath("/usr/bin/python3")
print(p.name)    # 'python3'
print(p.suffix)  # ''
print(p.parent)  # /usr/bin

# Path: inherits PurePath + actual filesystem I/O
q = Path("/etc/hosts")
print(q.exists())   # True/False depending on OS`,
    explanation: "`PurePath` handles path manipulation with no filesystem access, making it safe to use in platform-cross tests or when working with paths from another OS. `Path` adds I/O methods on top.",
  },
  {
    id: "py-classes-mro-diamond",
    language: "python",
    title: "MRO resolves diamond inheritance",
    tag: "classes",
    code: `class A:
    def hello(self):
        return "A"

class B(A):
    def hello(self):
        return "B -> " + super().hello()

class C(A):
    def hello(self):
        return "C -> " + super().hello()

class D(B, C):
    pass

print(D().hello())      # 'B -> C -> A'
print(D.__mro__)        # D, B, C, A, object`,
    explanation: "Python's C3 linearization ensures each class in the hierarchy is visited exactly once. `super()` follows the MRO, so `B.hello` calls `C.hello` (not `A.hello`) when called through `D`.",
  },
  {
    id: "py-dict-pipe-merge",
    language: "python",
    title: "Dict merge with | operator (3.9+)",
    tag: "snippet",
    code: `a = {"x": 1, "y": 2}
b = {"y": 9, "z": 3}

merged = a | b
print(merged)   # {'x': 1, 'y': 9, 'z': 3}  b's value wins on conflict

# Original dicts are unchanged
print(a)  # {'x': 1, 'y': 2}`,
    explanation: "The `|` operator creates a new dict merging two, with the right operand's values winning on key collisions. It replaces the `{**a, **b}` idiom with cleaner syntax.",
  },
  {
    id: "py-understand-del-name",
    language: "python",
    title: "del removes the name binding, not the object",
    tag: "understanding",
    code: `a = [1, 2, 3]
b = a           # both names point to the same list
del a           # removes the name 'a', not the list

print(b)        # [1, 2, 3]  — list still alive via 'b'
# print(a)      # NameError: name 'a' is not defined

b.append(4)
print(b)        # [1, 2, 3, 4]`,
    explanation: "`del` unbinds a name from its object; the object itself is only garbage-collected when no more references point to it. Here `b` keeps the list alive after `del a`.",
  },
  {
    id: "py-counter-intersection",
    language: "python",
    title: "Counter union and intersection",
    tag: "structures",
    code: `from collections import Counter

c1 = Counter({"a": 3, "b": 1, "c": 2})
c2 = Counter({"a": 1, "b": 4, "d": 2})

print(c1 | c2)  # Counter({'b': 4, 'a': 3, 'c': 2, 'd': 2})  max per key
print(c1 & c2)  # Counter({'a': 1, 'b': 1})                  min per key
print(c1 + c2)  # Counter({'b': 5, 'a': 4, 'c': 2, 'd': 2})  sum per key`,
    explanation: "`|` and `&` on Counters act like set union/intersection on counts (max and min); `+` and `-` add or subtract counts, dropping zero or negative results.",
  },
  {
    id: "py-caveat-nan-comparison",
    language: "python",
    title: "NaN is not equal to itself",
    tag: "caveats",
    code: `import math

x = float("nan")
print(x == x)       # False  — NaN != NaN by IEEE 754
print(x != x)       # True
print(math.isnan(x))  # True  — correct check

# Beware in containers
data = [1, float("nan"), 3]
print(float("nan") in data)  # False! can't find NaN by equality`,
    explanation: "IEEE 754 defines NaN as not equal to anything, including itself. Always use `math.isnan()` to test for NaN; equality checks will always return `False`.",
  },
  {
    id: "py-types-final-const",
    language: "python",
    title: "Final for constants and sealed attributes",
    tag: "types",
    code: `from typing import Final

MAX_SIZE: Final = 100
MAX_SIZE = 200   # type checker error: Cannot assign to final variable

class Config:
    DEBUG: Final[bool] = False

    def reset(self) -> None:
        self.DEBUG = True  # type checker error`,
    explanation: "`Final` prevents reassignment at the type-checker level — it doesn't affect runtime, but tools like mypy will flag any write to a `Final` variable as an error.",
  },
  {
    id: "py-families-queue-trio",
    language: "python",
    title: "queue.Queue vs LifoQueue vs PriorityQueue",
    tag: "families",
    code: `import queue

fifo = queue.Queue()           # FIFO
lifo = queue.LifoQueue()       # LIFO (stack)
pq   = queue.PriorityQueue()   # smallest priority first

fifo.put(1); fifo.put(2)
print(fifo.get())  # 1  (first in)

lifo.put(1); lifo.put(2)
print(lifo.get())  # 2  (last in)

pq.put((5, "low")); pq.put((1, "high"))
print(pq.get())    # (1, 'high')  smallest priority first`,
    explanation: "All three classes in the `queue` module are thread-safe. The first element of a tuple in `PriorityQueue` is the priority key; smaller values come out first.",
  },
  {
    id: "py-classes-repr-str-diff",
    language: "python",
    title: "__repr__ vs __str__",
    tag: "classes",
    code: `class Color:
    def __init__(self, r, g, b):
        self.r, self.g, self.b = r, g, b

    def __repr__(self):
        return f"Color({self.r}, {self.g}, {self.b})"

    def __str__(self):
        return f"#{self.r:02x}{self.g:02x}{self.b:02x}"

c = Color(255, 128, 0)
print(repr(c))   # Color(255, 128, 0)   — unambiguous, for devs
print(str(c))    # #ff8000              — human-readable
print([c])       # [Color(255, 128, 0)] — repr in containers`,
    explanation: "`__repr__` should produce an unambiguous string that could recreate the object; `__str__` is for display. If only `__repr__` is defined, `str()` falls back to it.",
  },
  {
    id: "py-dict-pipe-update",
    language: "python",
    title: "Dict in-place update with |= (3.9+)",
    tag: "snippet",
    code: `defaults = {"timeout": 30, "retries": 3, "verbose": False}
overrides = {"timeout": 60, "debug": True}

defaults |= overrides
print(defaults)
# {'timeout': 60, 'retries': 3, 'verbose': False, 'debug': True}`,
    explanation: "`|=` merges the right-hand dict into the left-hand dict in place, letting the right side win on conflicts. It's the in-place variant of `defaults | overrides`.",
  },
  {
    id: "py-understand-try-else-flow",
    language: "python",
    title: "try/except/else control flow (trace)",
    tag: "understanding",
    code: `def parse(s):
    try:
        result = int(s)
    except ValueError:
        print("caught ValueError")
        return None
    else:
        # runs ONLY if no exception was raised
        print("parsed OK")
        return result
    finally:
        print("always runs")

parse("42")    # parsed OK / always runs
parse("bad")   # caught ValueError / always runs`,
    explanation: "The `else` block runs only when the `try` block completed without an exception — useful to separate the 'success path' logic from the exception handler without catching errors from the success code.",
  },
  {
    id: "py-counter-update-counts",
    language: "python",
    title: "Counter.update() adds counts",
    tag: "structures",
    code: `from collections import Counter

words = Counter(["cat", "dog", "cat"])
print(words)   # Counter({'cat': 2, 'dog': 1})

words.update(["cat", "fish", "dog"])
print(words)   # Counter({'cat': 3, 'dog': 2, 'fish': 1})

# subtract() decrements instead of adding
words.subtract(["cat", "cat"])
print(words)   # Counter({'dog': 2, 'fish': 1, 'cat': 1})`,
    explanation: "`update()` increments existing counts and adds new keys; `subtract()` decrements them (allowing negative counts). Both accept any iterable or mapping.",
  },
  {
    id: "py-caveat-string-concat-loop",
    language: "python",
    title: "String concatenation in a loop is O(n²)",
    tag: "caveats",
    code: `# BAD: O(n²) because strings are immutable
result = ""
for word in ["hello", "world", "python"]:
    result += word + " "

# GOOD: collect then join — O(n)
parts = []
for word in ["hello", "world", "python"]:
    parts.append(word)
result = " ".join(parts)

# BEST: one-liner
result = " ".join(["hello", "world", "python"])`,
    explanation: "Each `+=` creates a new string and copies all existing characters, making repeated concatenation quadratic. Collect into a list and join once for linear performance.",
  },
  {
    id: "py-types-typeddict-total",
    language: "python",
    title: "TypedDict with total=False for optional keys",
    tag: "types",
    code: `from typing import TypedDict

class Movie(TypedDict):
    title: str
    year: int

class PartialMovie(TypedDict, total=False):
    title: str   # all keys are optional
    year: int

m1: Movie = {"title": "Dune", "year": 2021}   # OK
m2: PartialMovie = {"title": "Dune"}           # OK, year omitted`,
    explanation: "`total=False` makes every key optional in the TypedDict, letting you represent partial records. You can also mix required and optional keys using inheritance between two TypedDict classes.",
  },
  {
    id: "py-families-lock-trio",
    language: "python",
    title: "threading.Lock vs RLock vs Semaphore",
    tag: "families",
    code: `import threading

lock  = threading.Lock()       # simple mutex; same thread can't re-acquire
rlock = threading.RLock()      # reentrant; same thread may acquire multiple times
sema  = threading.Semaphore(3) # allows up to 3 concurrent holders

with rlock:
    with rlock:   # OK for RLock; would deadlock with plain Lock
        print("inside reentrant lock")

with sema:
    print("one of up to 3 concurrent workers")`,
    explanation: "`Lock` is a simple mutex; `RLock` (reentrant lock) lets the holding thread acquire it again without deadlocking; `Semaphore(n)` limits concurrent access to n threads.",
  },
  {
    id: "py-classes-slots-no-dict",
    language: "python",
    title: "__slots__ removes __dict__ and saves memory",
    tag: "classes",
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
print(hasattr(r, "__dict__"))    # True
print(hasattr(s, "__dict__"))    # False
print(sys.getsizeof(r.__dict__)) # ~232 bytes
# s.z = 3  → AttributeError`,
    explanation: "`__slots__` stores attributes in a fixed-size C array instead of a dict, cutting per-instance memory by ~40–60% and preventing ad-hoc attribute creation.",
  },
  {
    id: "py-starred-middle-unpack",
    language: "python",
    title: "Starred assignment captures the middle",
    tag: "snippet",
    code: `first, *middle, last = [1, 2, 3, 4, 5]
print(first)   # 1
print(middle)  # [2, 3, 4]
print(last)    # 5

# Discard unwanted parts
_, *body, _ = "START data data data END".split()
print(body)    # ['data', 'data', 'data']`,
    explanation: "The starred target collects all 'remaining' elements into a list, and may appear anywhere in the unpacking target — not just at the end.",
  },
  {
    id: "py-understand-bool-int-sub",
    language: "python",
    title: "bool is a subclass of int",
    tag: "understanding",
    code: `print(isinstance(True, int))   # True
print(True + True)             # 2
print(True * 10)               # 10
print(False + 1)               # 1

# This can cause surprising results
flags = [True, False, True, True]
print(sum(flags))     # 3  — count of True values
print(True == 1)      # True
print(True is 1)      # False — different objects`,
    explanation: "`bool` inherits from `int`, so `True` is `1` and `False` is `0` in arithmetic contexts. This makes `sum()` a convenient way to count truthy values in a list.",
  },
  {
    id: "py-ordereddict-move-end",
    language: "python",
    title: "OrderedDict.move_to_end()",
    tag: "structures",
    code: `from collections import OrderedDict

od = OrderedDict([("a", 1), ("b", 2), ("c", 3)])
od.move_to_end("a")          # move 'a' to the end
print(list(od))              # ['b', 'c', 'a']

od.move_to_end("a", last=False)  # move to the front
print(list(od))              # ['a', 'b', 'c']`,
    explanation: "`move_to_end()` repositions a key to the front or back in O(1) time. Combined with `popitem()`, this is the foundation for an LRU cache (before `functools.lru_cache` existed).",
  },
  {
    id: "py-caveat-list-copy-shallow",
    language: "python",
    title: "list.copy() is a shallow copy",
    tag: "caveats",
    code: `import copy

original = [[1, 2], [3, 4]]
shallow = original.copy()     # or list(original) or original[:]

shallow.append([5, 6])        # does NOT affect original
shallow[0].append(99)         # DOES affect original (shared inner list)

print(original)  # [[1, 2, 99], [3, 4]]

deep = copy.deepcopy(original)
deep[0].append(0)
print(original)  # [[1, 2, 99], [3, 4]]  — unaffected`,
    explanation: "Shallow copy duplicates the outer container but not nested objects. Mutating a nested list through the copy also mutates the original. Use `copy.deepcopy` when you need fully independent copies.",
  },
  {
    id: "py-types-union-pipe",
    language: "python",
    title: "X | Y union type syntax (3.10+)",
    tag: "types",
    code: `# Pre-3.10
from typing import Union, Optional
def greet(name: Union[str, None]) -> str: ...
def greet2(name: Optional[str]) -> str: ...

# 3.10+: built-in | syntax
def greet3(name: str | None) -> str:
    return f"Hello, {name or 'stranger'}"

# Works for isinstance too (3.10+)
x: int | float | str = 3.14
print(isinstance(x, int | float))  # True`,
    explanation: "Python 3.10 added `X | Y` as syntax for union types, usable in both annotations and `isinstance()` checks. `Optional[X]` is now just `X | None`.",
  },
  {
    id: "py-families-copy-shallow-deep",
    language: "python",
    title: "copy.copy vs copy.deepcopy",
    tag: "families",
    code: `import copy

class Node:
    def __init__(self, val, children=None):
        self.val = val
        self.children = children or []

root = Node(1, [Node(2), Node(3)])
shallow = copy.copy(root)
deep    = copy.deepcopy(root)

# shallow: new Node, same children list reference
shallow.children.append(Node(99))
print(len(root.children))   # 3  (shared list!)

# deep: entirely independent tree
deep.children.append(Node(99))
print(len(root.children))   # still 3`,
    explanation: "`copy.copy` creates a new top-level object but shares nested objects; `copy.deepcopy` recursively copies the entire object graph, producing fully independent data.",
  },
  {
    id: "py-classes-super-cooperative",
    language: "python",
    title: "Cooperative super() pattern",
    tag: "classes",
    code: `class Mixin:
    def setup(self):
        print("Mixin.setup")
        super().setup()  # delegates up the MRO

class Base:
    def setup(self):
        print("Base.setup")

class App(Mixin, Base):
    def setup(self):
        print("App.setup")
        super().setup()

App().setup()
# App.setup
# Mixin.setup
# Base.setup`,
    explanation: "When every class in the hierarchy calls `super().method()`, control passes along the MRO in order. This pattern lets mixins insert behavior without knowing the concrete base class.",
  },
  {
    id: "py-walrus-in-comp",
    language: "python",
    title: "Walrus operator in list comprehension",
    tag: "snippet",
    code: `import re

texts = ["error: 404", "ok", "error: 500", "warning"]

# Capture the match AND filter in one pass
errors = [
    m.group(1)
    for t in texts
    if (m := re.search(r"error: (\\d+)", t))
]
print(errors)  # ['404', '500']`,
    explanation: "The walrus operator `:=` assigns and tests in the same expression, letting you avoid calling an expensive function twice (once to test, once to use the result).",
  },
  {
    id: "py-understand-augasgn-tuple",
    language: "python",
    title: "Augmented assignment on a tuple element (trace)",
    tag: "understanding",
    code: `t = ([1, 2], "b")

try:
    t[0] += [3, 4]          # raises TypeError
except TypeError as e:
    print(e)                 # 'tuple' object does not support item assignment

print(t)  # ([1, 2, 3, 4], 'b')  — list was mutated anyway!`,
    explanation: "`t[0] += [3, 4]` first calls `t[0].__iadd__([3,4])` (which mutates the list in place) and THEN tries to write back to `t[0]` — which raises `TypeError` because tuples are immutable. Both the mutation and the exception occur.",
  },
  {
    id: "py-chainmap-lookup",
    language: "python",
    title: "ChainMap lookup order",
    tag: "structures",
    code: `from collections import ChainMap

defaults = {"color": "blue", "size": "medium"}
user_cfg = {"color": "red"}

cfg = ChainMap(user_cfg, defaults)
print(cfg["color"])   # 'red'   — user_cfg wins
print(cfg["size"])    # 'medium' — falls through to defaults

# Writes go to the FIRST map only
cfg["size"] = "large"
print(user_cfg)       # {'color': 'red', 'size': 'large'}
print(defaults)       # {'color': 'blue', 'size': 'medium'}`,
    explanation: "`ChainMap` searches each underlying dict in order, so earlier maps shadow later ones. Writes always go to the first map, making it ideal for layered config (CLI → env → defaults).",
  },
  {
    id: "py-caveat-is-string-intern",
    language: "python",
    title: "String identity with `is` is unreliable",
    tag: "caveats",
    code: `a = "hello"
b = "hello"
print(a is b)      # True  — CPython interns short strings

a = "hello world"
b = "hello world"
print(a is b)      # True or False — implementation-dependent!

# NEVER use \`is\` to compare string values
print(a == b)      # True  — always correct`,
    explanation: "CPython interns some strings (identifiers, short literals) so `is` may return `True` for distinct objects. This is an implementation detail — always use `==` to compare string content.",
  },
  {
    id: "py-types-annotated-meta",
    language: "python",
    title: "Annotated for runtime metadata",
    tag: "types",
    code: `from typing import Annotated, get_type_hints
import dataclasses

Positive = Annotated[int, "must be > 0"]
Email    = Annotated[str, "email format"]

@dataclasses.dataclass
class User:
    age:   Positive
    email: Email

hints = get_type_hints(User, include_extras=True)
print(hints["age"])    # Annotated[int, 'must be > 0']
# Validation frameworks (Pydantic, etc.) read the extra metadata`,
    explanation: "`Annotated[T, metadata...]` attaches arbitrary metadata to a type without affecting runtime type checking. Libraries like Pydantic inspect the extras to drive validation.",
  },
  {
    id: "py-families-json-pickle",
    language: "python",
    title: "json vs pickle: key differences",
    tag: "families",
    code: `import json, pickle

data = {"name": "Alice", "scores": [95, 87, 92]}

# json: human-readable, cross-language, safe
s = json.dumps(data)
print(s)       # '{"name": "Alice", "scores": [95, 87, 92]}'

# pickle: binary, Python-only, supports any object
b = pickle.dumps(data)
restored = pickle.loads(b)
# NEVER unpickle untrusted data — it executes arbitrary code`,
    explanation: "`json` is safe, portable, and human-readable but limited to basic types. `pickle` can serialize any Python object but is Python-only and can execute arbitrary code on deserialization.",
  },
  {
    id: "py-classes-descriptor-nondata",
    language: "python",
    title: "Data vs non-data descriptor lookup order",
    tag: "classes",
    code: `class DataDesc:
    def __get__(self, obj, typ):  return "data get"
    def __set__(self, obj, val):  pass        # has __set__ → data descriptor

class NonDataDesc:
    def __get__(self, obj, typ):  return "non-data get"  # no __set__

class MyClass:
    data    = DataDesc()
    nondata = NonDataDesc()

obj = MyClass()
obj.__dict__["data"]    = "instance"
obj.__dict__["nondata"] = "instance"

print(obj.data)     # 'data get'     — data descriptor wins over instance dict
print(obj.nondata)  # 'instance'     — instance dict wins over non-data descriptor`,
    explanation: "Data descriptors (defining both `__get__` and `__set__`) take priority over the instance `__dict__`; non-data descriptors (only `__get__`) are overridden by instance attributes.",
  },
  {
    id: "py-slice-object-reuse",
    language: "python",
    title: "Reusable slice objects",
    tag: "snippet",
    code: `data = list(range(20))

HEADER  = slice(0, 3)
BODY    = slice(3, 17)
TRAILER = slice(17, None)

print(data[HEADER])   # [0, 1, 2]
print(data[BODY])     # [3, 4, ..., 16]
print(data[TRAILER])  # [17, 18, 19]

# Slice objects work on any sequence
s = "Hello World"
print(s[HEADER])   # 'Hel'`,
    explanation: "Named `slice()` objects document intent and can be reused across multiple sequences, avoiding repeated magic-number subscripts like `data[0:3]`.",
  },
  {
    id: "py-understand-class-var-share",
    language: "python",
    title: "Mutable class variable is shared across instances",
    tag: "understanding",
    code: `class Dog:
    tricks = []            # class variable — shared by all instances!

    def add_trick(self, trick):
        self.tricks.append(trick)   # mutates the shared list

d1, d2 = Dog(), Dog()
d1.add_trick("sit")
d2.add_trick("shake")

print(d1.tricks)  # ['sit', 'shake']  ← both tricks!
print(d2.tricks)  # ['sit', 'shake']`,
    explanation: "Mutable class variables are shared between all instances. Appending to `self.tricks` finds the class list (because there's no instance attribute yet) and mutates it. Each instance should initialize its own list in `__init__`.",
  },
  {
    id: "py-chainmap-new-child",
    language: "python",
    title: "ChainMap.new_child() for scoped overwrites",
    tag: "structures",
    code: `from collections import ChainMap

base = ChainMap({"x": 1, "y": 2})
child = base.new_child({"x": 99})  # new scope overrides 'x'

print(child["x"])   # 99
print(child["y"])   # 2  — falls through to base
print(base["x"])    # 1  — base unchanged

print(child.maps)   # [{'x': 99}, {'x': 1, 'y': 2}]`,
    explanation: "`new_child()` returns a new `ChainMap` with a fresh empty map at the front (or a provided map). It models lexical scoping: the parent scope is unaffected by mutations to the child.",
  },
  {
    id: "py-caveat-int-id-cache",
    language: "python",
    title: "CPython caches small integers (-5 to 256)",
    tag: "caveats",
    code: `a = 100
b = 100
print(a is b)   # True  — same object (cached range)

x = 1000
y = 1000
print(x is y)   # False — separate objects outside cache

# Never rely on int identity; use ==
print(x == y)   # True  — always correct`,
    explanation: "CPython pre-allocates integer objects for the range -5 to 256 as an optimization. Outside that range, each `int` literal may be a different object. Always use `==` for value comparison.",
  },
  {
    id: "py-types-runtime-checkable-proto",
    language: "python",
    title: "@runtime_checkable Protocol with isinstance()",
    tag: "types",
    code: `from typing import Protocol, runtime_checkable

@runtime_checkable
class Drawable(Protocol):
    def draw(self) -> None: ...

class Circle:
    def draw(self) -> None:
        print("O")

class Square:
    pass

print(isinstance(Circle(), Drawable))  # True
print(isinstance(Square(), Drawable))  # False`,
    explanation: "`@runtime_checkable` allows `isinstance()` checks against a Protocol at runtime by verifying that the object has the required methods. Without the decorator, `isinstance` with a Protocol raises `TypeError`.",
  },
  {
    id: "py-families-format-methods",
    language: "python",
    title: "% vs .format() vs f-strings",
    tag: "families",
    code: `name, val = "Alice", 3.14

# %-formatting (old style, still common in logging)
print("Hello %s, pi=%.2f" % (name, val))

# str.format() (Python 2.6+)
print("Hello {}, pi={:.2f}".format(name, val))
print("Hello {n}, pi={v:.2f}".format(n=name, v=val))

# f-strings (Python 3.6+) — fastest, most readable
print(f"Hello {name}, pi={val:.2f}")`,
    explanation: "f-strings are the modern standard: they're the fastest, most readable, and support arbitrary expressions. `str.format()` is useful when the template comes from outside the source code.",
  },
  {
    id: "py-classes-classmethod-inherit",
    language: "python",
    title: "classmethod receives the actual subclass",
    tag: "classes",
    code: `class Base:
    tag = "base"

    @classmethod
    def make(cls):
        return cls()    # cls is the class that received the call

    def __repr__(self):
        return f"{type(self).__name__}()"

class Child(Base):
    tag = "child"

print(Base.make())   # Base()
print(Child.make())  # Child()  — cls is Child, not Base`,
    explanation: "`classmethod` passes the *actual* class (not the defining class) as `cls`. This makes it ideal for factory methods that should produce the correct subclass when called on a child.",
  },
  {
    id: "py-reversed-dict",
    language: "python",
    title: "reversed() on a dict (3.8+)",
    tag: "snippet",
    code: `d = {"a": 1, "b": 2, "c": 3}

for key in reversed(d):
    print(key, end=" ")   # c b a

# Also works on dict.keys() and dict.items()
for k, v in reversed(d.items()):
    print(f"{k}={v}", end=" ")  # c=3 b=2 a=1`,
    explanation: "Since Python 3.7 dicts preserve insertion order; since 3.8 they also support `reversed()`. This lets you iterate from most-recently-inserted to oldest without converting to a list.",
  },
  {
    id: "py-understand-except-scope",
    language: "python",
    title: "Exception variable is deleted after except block",
    tag: "understanding",
    code: `try:
    raise ValueError("oops")
except ValueError as e:
    msg = str(e)    # capture the message now
    print(e)        # 'oops'

# print(e)          # NameError: name 'e' is not defined
print(msg)          # 'oops'  — 'msg' survives`,
    explanation: "Python deletes the exception variable `e` at the end of the `except` block (to break reference cycles). Capture any needed information into another name before leaving the block.",
  },
  {
    id: "py-heapq-push-pop",
    language: "python",
    title: "heapq: min-heap push and pop",
    tag: "structures",
    code: `import heapq

heap = []
heapq.heappush(heap, 5)
heapq.heappush(heap, 1)
heapq.heappush(heap, 3)

print(heapq.heappop(heap))  # 1  smallest first
print(heapq.heappop(heap))  # 3
print(heap)                 # [5]

# Peek without popping:
heapq.heappush(heap, 2)
print(heap[0])              # 2  — root is always smallest`,
    explanation: "Python's `heapq` implements a min-heap on a plain list. The smallest element is always at index 0; `heappush` and `heappop` maintain the heap invariant in O(log n).",
  },
  {
    id: "py-caveat-class-mut-attr",
    language: "python",
    title: "Assigning via self creates an instance attribute",
    tag: "caveats",
    code: `class Counter:
    count = 0           # class attribute

    def increment(self):
        self.count += 1   # creates an INSTANCE attribute, class attr unchanged

c1, c2 = Counter(), Counter()
c1.increment()
c1.increment()
print(c1.count)      # 2   — instance attribute
print(c2.count)      # 0   — sees class attribute
print(Counter.count) # 0   — class attribute unchanged`,
    explanation: "`self.count += 1` is `self.count = self.count + 1`. The read finds the class attribute (0), but the write creates a new instance attribute, shadowing the class attribute only for that instance.",
  },
  {
    id: "py-types-self-annotation",
    language: "python",
    title: "Self type for fluent/builder return types",
    tag: "types",
    code: `from typing import Self

class Builder:
    def __init__(self):
        self._parts: list[str] = []

    def add(self, part: str) -> Self:
        self._parts.append(part)
        return self

    def build(self) -> str:
        return ", ".join(self._parts)

class FancyBuilder(Builder):
    pass

result = FancyBuilder().add("a").add("b").build()
# type checker knows .add() returns FancyBuilder, not Builder`,
    explanation: "`Self` (from `typing`) annotates methods that return the same type as the receiver, enabling type checkers to preserve the correct subtype in method chains without generic `TypeVar` boilerplate.",
  },
  {
    id: "py-families-exception-hierarchy",
    language: "python",
    title: "BaseException vs Exception hierarchy",
    tag: "families",
    code: `# BaseException
#  ├── SystemExit          (sys.exit())
#  ├── KeyboardInterrupt   (Ctrl-C)
#  ├── GeneratorExit       (close() on generator)
#  └── Exception           (all "normal" errors)
#       ├── ValueError
#       ├── TypeError
#       ├── OSError
#       └── ...

try:
    raise SystemExit(0)
except Exception:
    print("not caught")    # won't print
except BaseException:
    print("caught")        # will print`,
    explanation: "Catching `Exception` misses `SystemExit`, `KeyboardInterrupt`, and `GeneratorExit`. Only catch `BaseException` when you genuinely need to intercept program termination signals.",
  },
  {
    id: "py-classes-staticmethod-classmethod",
    language: "python",
    title: "@staticmethod vs @classmethod",
    tag: "classes",
    code: `class Circle:
    PI = 3.14159

    def __init__(self, r):
        self.r = r

    @staticmethod
    def unit():           # no cls, no self — plain function in namespace
        return Circle(1)

    @classmethod
    def from_diameter(cls, d):   # cls = the actual class
        return cls(d / 2)

c1 = Circle.unit()
c2 = Circle.from_diameter(10)`,
    explanation: "`@staticmethod` is a plain function that happens to live on the class; it receives no implicit first argument. `@classmethod` receives `cls`, which lets it call `cls()` to construct the correct subtype.",
  },
  {
    id: "py-min-max-key",
    language: "python",
    title: "min/max with a key function",
    tag: "snippet",
    code: `words = ["banana", "fig", "apple", "elderberry"]

print(min(words))                         # 'apple'  alphabetical
print(min(words, key=len))                # 'fig'    shortest
print(max(words, key=len))                # 'elderberry' longest

students = [{"name": "Alice", "gpa": 3.8}, {"name": "Bob", "gpa": 3.5}]
top = max(students, key=lambda s: s["gpa"])
print(top["name"])   # 'Alice'`,
    explanation: "The `key=` parameter passes each element through a function before comparing — the element itself is returned, not the key. This avoids decorating/undecorating patterns.",
  },
  {
    id: "py-understand-nonlocal-scope",
    language: "python",
    title: "nonlocal vs global",
    tag: "understanding",
    code: `x = "global"

def outer():
    x = "outer"

    def inner():
        nonlocal x       # refers to outer's x, not global x
        x = "inner"

    inner()
    print(x)   # 'inner'

outer()
print(x)       # 'global'  — global x unchanged`,
    explanation: "`nonlocal` binds to the nearest enclosing scope that defines the name (not global). `global` skips all local/enclosing scopes and reaches the module level.",
  },
  {
    id: "py-heapq-heapify",
    language: "python",
    title: "heapq.heapify converts a list in-place in O(n)",
    tag: "structures",
    code: `import heapq

data = [5, 9, 1, 3, 7, 2]
heapq.heapify(data)
print(data)          # [1, 3, 2, 9, 7, 5]  heap property holds

# heapify is O(n); pushing n items one by one is O(n log n)
# Use heapify when you already have a list to convert`,
    explanation: "`heapify` rearranges a list into a valid heap in O(n) using the Floyd algorithm, which is more efficient than calling `heappush` for each element (O(n log n)).",
  },
  {
    id: "py-caveat-global-not-decl",
    language: "python",
    title: "Reading a global before declaring global raises UnboundLocalError",
    tag: "caveats",
    code: `count = 0

def bad():
    count += 1      # UnboundLocalError! Python sees 'count =' below and
    return count    # treats count as local throughout the function

def good():
    global count
    count += 1
    return count

# good()  → 1
# bad()   → UnboundLocalError: local variable 'count' referenced before assignment`,
    explanation: "Python decides whether a name is local or global at compile time: if any assignment to `count` exists in the function, it's treated as local everywhere in that function, even before the assignment.",
  },
  {
    id: "py-types-typeguard-narrow",
    language: "python",
    title: "TypeGuard for custom type narrowing",
    tag: "types",
    code: `from typing import TypeGuard

def is_list_of_str(val: list[object]) -> TypeGuard[list[str]]:
    return all(isinstance(x, str) for x in val)

def process(items: list[object]) -> None:
    if is_list_of_str(items):
        # type checker now knows items: list[str]
        print(items[0].upper())`,
    explanation: "`TypeGuard[T]` tells the type checker that when the function returns `True`, the argument is narrowed to type `T`. Without it, the checker can't narrow through custom validation functions.",
  },
  {
    id: "py-families-sequence-abc",
    language: "python",
    title: "list/tuple vs collections.abc.Sequence",
    tag: "families",
    code: `from collections.abc import Sequence, MutableSequence

def first(seq: Sequence[int]) -> int:
    return seq[0]   # any sequence works

print(first([1, 2, 3]))   # list  ✓
print(first((1, 2, 3)))   # tuple ✓
print(first(range(10)))   # range ✓

def append_one(seq: MutableSequence[int]) -> None:
    seq.append(1)

# append_one((1,2))  → TypeError at runtime; type checker also rejects`,
    explanation: "Annotating with `Sequence[T]` accepts any read-only sequence (list, tuple, range, str); `MutableSequence[T]` additionally requires `append`, `insert`, etc. Use ABCs for maximum flexibility.",
  },
  {
    id: "py-classes-abstract-concrete",
    language: "python",
    title: "Abstract and concrete methods in the same class",
    tag: "classes",
    code: `from abc import ABC, abstractmethod

class Shape(ABC):
    @abstractmethod
    def area(self) -> float: ...

    def describe(self) -> str:     # concrete method can call abstract one
        return f"Area is {self.area():.2f}"

class Circle(Shape):
    def __init__(self, r):
        self.r = r
    def area(self) -> float:
        return 3.14159 * self.r ** 2

c = Circle(5)
print(c.describe())   # 'Area is 78.54'
# Shape()             → TypeError: Can't instantiate abstract class`,
    explanation: "Abstract base classes can mix abstract and concrete methods; concrete methods can call abstract ones, relying on subclasses to supply the implementation.",
  },
  {
    id: "py-sorted-reverse-key",
    language: "python",
    title: "sorted() with key and reverse",
    tag: "snippet",
    code: `data = [("alice", 85), ("bob", 92), ("carol", 78)]

# Sort by score descending
by_score = sorted(data, key=lambda x: x[1], reverse=True)
print(by_score)
# [('bob', 92), ('alice', 85), ('carol', 78)]

# Stable sort: items with equal keys preserve relative order
names = ["banana", "Apple", "cherry"]
sorted(names, key=str.lower)  # case-insensitive`,
    explanation: "Python's `sorted()` is guaranteed stable — equal keys preserve the original order. Combining `key=` with `reverse=True` avoids negating numeric keys.",
  },
  {
    id: "py-understand-chain-compare",
    language: "python",
    title: "Chained comparisons short-circuit",
    tag: "understanding",
    code: `x = 5
print(1 < x < 10)       # True   — equivalent to (1 < x) and (x < 10)
print(1 < x < 3)        # False

# Each expression is evaluated once
def f():
    print("evaluated")
    return 5

print(1 < f() < 10)     # prints "evaluated" once, then True

print(1 < 2 < 3 < 4)    # True  — chains as long as you like`,
    explanation: "Chained comparisons are syntactic sugar for `and`-connected pairs with each middle value evaluated only once. Unlike most languages, Python's chained comparisons truly express mathematical ranges.",
  },
  {
    id: "py-heapq-nsmallest",
    language: "python",
    title: "heapq.nsmallest and nlargest",
    tag: "structures",
    code: `import heapq

data = [3, 1, 4, 1, 5, 9, 2, 6]

print(heapq.nsmallest(3, data))  # [1, 1, 2]
print(heapq.nlargest(3, data))   # [9, 6, 5]

# key= works too
students = [("Alice", 3.8), ("Bob", 3.5), ("Carol", 3.9)]
top2 = heapq.nlargest(2, students, key=lambda s: s[1])
print(top2)  # [('Carol', 3.9), ('Alice', 3.8)]`,
    explanation: "`nsmallest(n, ...)` and `nlargest(n, ...)` are efficient for small `n` (they use a size-n heap scan), beating a full sort for n << len(data). Both accept a `key=` function.",
  },
  {
    id: "py-caveat-except-reraise",
    language: "python",
    title: "Bare raise vs raise e: traceback differences",
    tag: "caveats",
    code: `def bad():
    try:
        1 / 0
    except ZeroDivisionError as e:
        raise e          # NEW traceback starting here

def good():
    try:
        1 / 0
    except ZeroDivisionError:
        raise            # re-raises with ORIGINAL traceback intact`,
    explanation: "Bare `raise` re-raises the current exception preserving the original traceback; `raise e` replaces the traceback with the current line. Use bare `raise` inside handlers to keep diagnostic info.",
  },
  {
    id: "py-types-overload-sig",
    language: "python",
    title: "@overload for multiple call signatures",
    tag: "types",
    code: `from typing import overload

@overload
def process(x: int) -> int: ...
@overload
def process(x: str) -> str: ...

def process(x: int | str) -> int | str:
    if isinstance(x, int):
        return x * 2
    return x.upper()

# Type checker knows: process(1) → int, process("a") → str
print(process(5))      # 10
print(process("hi"))   # 'HI'`,
    explanation: "`@overload` stubs express per-argument-type return types that a single union signature cannot capture. The stubs are type-checker only; the final un-decorated definition does the actual work.",
  },
  {
    id: "py-families-number-abc",
    language: "python",
    title: "numbers ABC hierarchy",
    tag: "families",
    code: `from numbers import Number, Complex, Real, Rational, Integral

print(isinstance(42, Integral))   # True
print(isinstance(3.14, Real))     # True
print(isinstance(3.14, Rational)) # False (float is Real but not Rational)
print(isinstance(1+2j, Complex))  # True

# Use as type annotation:
from numbers import Real as RealNumber
def scale(x: RealNumber, factor: RealNumber) -> RealNumber:
    return x * factor`,
    explanation: "The `numbers` module defines ABCs in a tower: `Integral ⊂ Rational ⊂ Real ⊂ Complex ⊂ Number`. Annotating with these ABCs accepts both `int` and `float` (or `Decimal`) without a union type.",
  },
  {
    id: "py-classes-init-subclass-reg",
    language: "python",
    title: "__init_subclass__ for automatic registration",
    tag: "classes",
    code: `class Plugin:
    registry: dict[str, type] = {}

    def __init_subclass__(cls, name: str = "", **kw):
        super().__init_subclass__(**kw)
        Plugin.registry[name or cls.__name__] = cls

class AudioPlugin(Plugin, name="audio"):
    pass

class VideoPlugin(Plugin, name="video"):
    pass

print(Plugin.registry)
# {'audio': <class 'AudioPlugin'>, 'video': <class 'VideoPlugin'>}`,
    explanation: "`__init_subclass__` is called whenever a class is subclassed; keyword arguments from the class definition are forwarded to it. This replaces many metaclass patterns for registration.",
  },
  {
    id: "py-any-generator-lazy",
    language: "python",
    title: "any() is lazy — stops at first True",
    tag: "snippet",
    code: `def is_big(n):
    print(f"checking {n}")
    return n > 10

nums = [3, 7, 15, 2, 20]
result = any(is_big(n) for n in nums)
# checking 3
# checking 7
# checking 15  ← stops here
print(result)   # True`,
    explanation: "`any()` and `all()` short-circuit evaluation when the result is determined. Passing a generator (not a list) ensures expensive predicates are computed only as needed.",
  },
  {
    id: "py-understand-or-returns",
    language: "python",
    title: "`or` returns first truthy value, not a bool",
    tag: "understanding",
    code: `print(0 or "default")     # 'default'  (0 is falsy, returns second)
print("" or [] or 42)     # 42
print("hello" or "world") # 'hello'    (first truthy, short-circuits)
print(None or None)       # None       (both falsy, returns last)

# Classic default-value idiom (has a gotcha with 0/'' as valid values)
name = input_name or "Anonymous"`,
    explanation: "`or` returns the first truthy operand, or the last operand if all are falsy. It's commonly used for fallback values, but breaks if `0`, `''`, or `[]` are legitimate inputs.",
  },
  {
    id: "py-array-module-typed",
    language: "python",
    title: "array.array: typed, compact numeric arrays",
    tag: "structures",
    code: `from array import array
import sys

nums_list  = list(range(10_000))
nums_array = array("i", range(10_000))   # 'i' = signed int

print(sys.getsizeof(nums_list))    # ~87624 bytes
print(nums_array.buffer_info()[1] * nums_array.itemsize)  # 40000 bytes

# Works like a list for most operations
nums_array.append(10_000)
print(nums_array[0])   # 0`,
    explanation: "`array.array` stores elements as raw C values (no Python object overhead), using ~4–8× less memory than a list of numbers. It's a lightweight alternative to NumPy for simple numeric buffers.",
  },
  {
    id: "py-caveat-dict-iter-change",
    language: "python",
    title: "Changing a dict size during iteration raises RuntimeError",
    tag: "caveats",
    code: `d = {"a": 1, "b": 2, "c": 3}

# BAD: raises RuntimeError
# for k in d:
#     if d[k] == 2:
#         del d[k]

# GOOD: iterate over a copy of keys
for k in list(d.keys()):
    if d[k] == 2:
        del d[k]
print(d)   # {'a': 1, 'c': 3}`,
    explanation: "Modifying a dict's size (add/delete keys) during iteration invalidates the iterator. Copy `d.keys()` to a list first, or build a new dict with a comprehension.",
  },
  {
    id: "py-types-typevar-bound",
    language: "python",
    title: "TypeVar with an upper bound",
    tag: "types",
    code: `from typing import TypeVar

class Shape:
    def area(self) -> float: ...

S = TypeVar("S", bound=Shape)

def largest(items: list[S]) -> S:
    return max(items, key=lambda s: s.area())

# Type checker knows the return type matches the input type (S, not just Shape)
circles: list[Circle]
result: Circle = largest(circles)  # preserves Circle, not just Shape`,
    explanation: "`bound=Shape` constrains `S` to be `Shape` or any subclass. The return type stays `S` (the concrete subtype), not the wider `Shape`, which preserves subtype information for the caller.",
  },
  {
    id: "py-families-io-hierarchy",
    language: "python",
    title: "io module class hierarchy",
    tag: "families",
    code: `# io hierarchy:
# IOBase
#  ├── RawIOBase     (FileIO)              — raw bytes, no buffering
#  ├── BufferedIOBase (BufferedReader/Writer/RWPair, BytesIO) — buffered bytes
#  └── TextIOBase    (TextIOWrapper, StringIO)  — text (str)

import io
f = open("file.txt", "rb")
print(type(f))              # BufferedReader
print(isinstance(f, io.IOBase))   # True

g = open("file.txt", "r")
print(isinstance(g, io.TextIOBase))  # True`,
    explanation: "The three branches of `io.IOBase` correspond to raw bytes, buffered bytes, and text. `open()` returns the appropriate subclass depending on mode and `buffering` arguments.",
  },
  {
    id: "py-classes-getattr-fallback",
    language: "python",
    title: "__getattr__ as a fallback for missing attributes",
    tag: "classes",
    code: `class DotDict:
    def __init__(self, data: dict):
        self._data = data

    def __getattr__(self, name: str):
        try:
            return self._data[name]
        except KeyError:
            raise AttributeError(name)

d = DotDict({"x": 10, "y": 20})
print(d.x)    # 10
print(d.y)    # 20
# d.z         → AttributeError`,
    explanation: "`__getattr__` is only called when the normal attribute lookup fails, making it a safe fallback. Don't confuse it with `__getattribute__`, which intercepts *every* attribute access.",
  },
  {
    id: "py-all-short-circuit",
    language: "python",
    title: "all() short-circuits on first False",
    tag: "snippet",
    code: `def check(n):
    print(f"check({n})")
    return n > 0

nums = [5, 3, -1, 8, 2]
result = all(check(n) for n in nums)
# check(5)
# check(3)
# check(-1)   ← stops here (False found)
print(result)  # False`,
    explanation: "`all()` stops evaluating as soon as it finds a `False` value. A generator expression ensures no unnecessary calls are made — passing a list would evaluate everything eagerly.",
  },
  {
    id: "py-understand-and-returns",
    language: "python",
    title: "`and` returns first falsy value",
    tag: "understanding",
    code: `print(1 and 2)          # 2    (1 is truthy, returns second)
print(0 and 2)          # 0    (0 is falsy, short-circuits)
print("" and "hello")   # ''
print([1] and {"a": 1}) # {'a': 1}

# Guard pattern: only call method if object exists
result = obj and obj.compute()`,
    explanation: "`and` returns the first falsy operand, or the last operand if all are truthy. This is the guard pattern — avoid calling methods on `None` without an explicit `if` check.",
  },
  {
    id: "py-userdict-custom",
    language: "python",
    title: "UserDict subclass for custom dict behavior",
    tag: "structures",
    code: `from collections import UserDict

class CaseInsensitiveDict(UserDict):
    def __setitem__(self, key, value):
        super().__setitem__(key.lower(), value)

    def __getitem__(self, key):
        return super().__getitem__(key.lower())

d = CaseInsensitiveDict()
d["Hello"] = 42
print(d["hello"])   # 42
print(d["HELLO"])   # 42`,
    explanation: "Subclassing `UserDict` is safer than subclassing `dict` directly: `dict`'s C-level methods bypass Python-level overrides, but `UserDict` routes all operations through Python.",
  },
  {
    id: "py-caveat-input-always-str",
    language: "python",
    title: "input() always returns a string",
    tag: "caveats",
    code: `# BAD: comparing str to int
age = input("Enter age: ")  # user types 25
print(type(age))            # <class 'str'>
print(age > 18)             # TypeError in Python 3!

# GOOD: convert explicitly
age = int(input("Enter age: "))
print(age > 18)    # True or False`,
    explanation: "`input()` always returns a `str`. In Python 3, comparing `str` and `int` with `>` raises `TypeError` (unlike Python 2 where it silently produced arbitrary ordering). Always convert first.",
  },
  {
    id: "py-types-literal-narrow",
    language: "python",
    title: "Literal type for exact-value narrowing",
    tag: "types",
    code: `from typing import Literal

Direction = Literal["north", "south", "east", "west"]

def move(d: Direction) -> None:
    # type checker accepts only those 4 strings
    print(f"moving {d}")

move("north")    # OK
# move("up")     # type error: Literal["up"] not in Direction

def get_dir(reverse: bool) -> Literal["left", "right"]:
    return "right" if reverse else "left"`,
    explanation: "`Literal[v1, v2, ...]` restricts a type to specific values. The type checker will flag any call that passes a value outside the literal set, catching typos that a bare `str` annotation would miss.",
  },
  {
    id: "py-families-thread-pool-exec",
    language: "python",
    title: "ThreadPoolExecutor vs ProcessPoolExecutor",
    tag: "families",
    code: `from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor

def cpu_work(n):
    return sum(i*i for i in range(n))

def io_work(url):
    import time; time.sleep(0.1); return url

# I/O-bound: threads share GIL, but release it during I/O
with ThreadPoolExecutor(max_workers=4) as ex:
    results = list(ex.map(io_work, ["a", "b", "c"]))

# CPU-bound: separate processes bypass the GIL
with ProcessPoolExecutor(max_workers=4) as ex:
    results = list(ex.map(cpu_work, [10**5, 10**5, 10**5]))`,
    explanation: "`ThreadPoolExecutor` suits I/O-bound tasks (the GIL is released during I/O); `ProcessPoolExecutor` suits CPU-bound tasks by running each worker in a separate process, bypassing the GIL.",
  },
  {
    id: "py-classes-setattr-intercept",
    language: "python",
    title: "__setattr__ to intercept all attribute writes",
    tag: "classes",
    code: `class Validated:
    def __setattr__(self, name, value):
        if name == "age" and not isinstance(value, int):
            raise TypeError("age must be int")
        super().__setattr__(name, value)   # MUST call super!

v = Validated()
v.age = 30        # OK
# v.age = "old"   → TypeError

# Note: even __init__ goes through __setattr__!
class Validated2(Validated):
    def __init__(self):
        self.age = 0   # calls our __setattr__`,
    explanation: "`__setattr__` intercepts every attribute write, including those in `__init__`. Always delegate to `super().__setattr__()` to perform the actual write, or attributes will never be stored.",
  },
  {
    id: "py-fstring-thousand-sep",
    language: "python",
    title: "f-string thousands separator",
    tag: "snippet",
    code: `n = 1_234_567
pi = 3.14159265358979

print(f"{n:,}")       # '1,234,567'
print(f"{n:_}")       # '1_234_567'  underscore separator
print(f"{pi:,.4f}")   # '3.1416'
print(f"{n:>12,}")    # ' 1,234,567'  right-aligned width 12`,
    explanation: "The `,` or `_` in a format spec inserts thousands separators — comma for display, underscore for code readability. Both work with integers and floats.",
  },
  {
    id: "py-understand-for-else",
    language: "python",
    title: "for/else: else runs when loop completes without break",
    tag: "understanding",
    code: `def find_prime(nums):
    for n in nums:
        for i in range(2, int(n**0.5) + 1):
            if n % i == 0:
                break
        else:
            # only reached if inner loop didn't break
            return n   # found a prime

print(find_prime([4, 9, 10, 7, 15]))  # 7`,
    explanation: "The `else` clause of a `for` loop runs only if the loop exhausted the iterable without hitting `break`. It's most useful for 'search and not found' patterns, removing the need for a sentinel flag.",
  },
  {
    id: "py-defaultdict-lambda",
    language: "python",
    title: "defaultdict with lambda for arbitrary defaults",
    tag: "structures",
    code: `from collections import defaultdict

# Default: list
dd = defaultdict(list)
dd["a"].append(1)
dd["a"].append(2)
dd["b"].append(3)
print(dict(dd))  # {'a': [1, 2], 'b': [3]}

# Default: dict (nested defaultdict)
nested = defaultdict(lambda: defaultdict(int))
nested["x"]["y"] += 5
print(nested["x"]["y"])  # 5`,
    explanation: "`defaultdict` accepts any zero-argument callable; `lambda: defaultdict(int)` creates a factory for nested defaultdicts. This avoids manually checking and initializing keys before updating.",
  },
  {
    id: "py-caveat-open-text-default",
    language: "python",
    title: "open() defaults to text mode and platform encoding",
    tag: "caveats",
    code: `# BAD: platform encoding may not be UTF-8 (Windows uses cp1252)
with open("data.txt") as f:
    text = f.read()

# GOOD: always specify encoding for portability
with open("data.txt", encoding="utf-8") as f:
    text = f.read()

# Binary mode bypasses encoding entirely
with open("data.bin", "rb") as f:
    raw = f.read()`,
    explanation: "The default encoding comes from `locale.getencoding()`, which is platform-dependent. Always specify `encoding='utf-8'` for text files to ensure consistent behavior across OSes.",
  },
  {
    id: "py-types-namedtuple-class",
    language: "python",
    title: "Class-syntax NamedTuple with type annotations",
    tag: "types",
    code: `from typing import NamedTuple

class Point(NamedTuple):
    x: float
    y: float
    label: str = ""    # default value

p = Point(1.0, 2.0)
print(p.x, p.y)       # 1.0 2.0
print(p)              # Point(x=1.0, y=2.0, label='')

# Immutable like a tuple
# p.x = 9            → AttributeError

# Unpackable
x, y, _ = p`,
    explanation: "The class syntax for `NamedTuple` adds type annotations and default values while keeping all tuple behavior (immutable, unpackable, indexable, and memory-efficient).",
  },
  {
    id: "py-families-bytes-types",
    language: "python",
    title: "bytes vs bytearray vs memoryview",
    tag: "families",
    code: `# bytes: immutable sequence of bytes
b = b"hello"
# b[0] = 72  → TypeError

# bytearray: mutable sequence of bytes
ba = bytearray(b"hello")
ba[0] = 72
print(ba)   # bytearray(b'Hello')

# memoryview: zero-copy view into a buffer
mv = memoryview(ba)
mv[1] = 73
print(ba)   # bytearray(b'HIllo')  — modified through the view`,
    explanation: "`bytes` is immutable; `bytearray` is mutable. `memoryview` provides a window into any object supporting the buffer protocol (bytes, bytearray, array.array), enabling zero-copy slicing.",
  },
  {
    id: "py-classes-call-functor",
    language: "python",
    title: "__call__ makes an object callable",
    tag: "classes",
    code: `class Multiplier:
    def __init__(self, factor):
        self.factor = factor

    def __call__(self, x):
        return x * self.factor

double = Multiplier(2)
triple = Multiplier(3)

print(double(5))   # 10
print(triple(5))   # 15
print(callable(double))  # True

# Useful for callbacks that need state
buttons = [Multiplier(n) for n in range(1, 4)]`,
    explanation: "`__call__` allows an instance to be invoked like a function. This is useful for stateful callables, where a closure or `partial` would work but a class offers more structure.",
  },
  {
    id: "py-fstring-precision-type",
    language: "python",
    title: "f-string precision with type specifiers",
    tag: "snippet",
    code: `x = 12345.6789

print(f"{x:.2f}")    # '12345.68'   fixed-point, 2 decimal places
print(f"{x:.4e}")    # '1.2346e+04' scientific notation
print(f"{x:.3g}")    # '1.23e+04'   general (shorter of f/e)
print(f"{x:.0%}")    # '1234568%'   percentage

n = 255
print(f"{n:08b}")    # '11111111'   binary, width 8, zero-padded
print(f"{n:#x}")     # '0xff'       hex with prefix`,
    explanation: "The type specifier (`f`, `e`, `g`, `%`, `b`, `x`) after precision controls number formatting. `g` removes trailing zeros and switches to scientific for large or small values.",
  },
  {
    id: "py-understand-generator-once",
    language: "python",
    title: "Generators are one-shot iterators",
    tag: "understanding",
    code: `def count_up(n):
    for i in range(n):
        yield i

gen = count_up(3)
print(list(gen))    # [0, 1, 2]
print(list(gen))    # []  — exhausted!

# To reuse, call the function again:
print(list(count_up(3)))  # [0, 1, 2]

# Contrast with range (not a generator — creates fresh iter each time)
r = range(3)
print(list(r))   # [0, 1, 2]
print(list(r))   # [0, 1, 2]`,
    explanation: "A generator object maintains internal state and cannot be rewound. Once it raises `StopIteration`, all subsequent iterations produce nothing. Call the generator function again to get a fresh iterator.",
  },
  {
    id: "py-queue-lifo",
    language: "python",
    title: "queue.LifoQueue as a thread-safe stack",
    tag: "structures",
    code: `from queue import LifoQueue

stack = LifoQueue()
stack.put("task_1")
stack.put("task_2")
stack.put("task_3")

while not stack.empty():
    print(stack.get())
# task_3
# task_2
# task_1`,
    explanation: "`queue.LifoQueue` is a thread-safe stack (last-in, first-out). Unlike using a plain `list` with `append`/`pop`, it handles concurrent access without a separate lock.",
  },
  {
    id: "py-caveat-scope-list-comp",
    language: "python",
    title: "List comprehension has its own scope (3.x)",
    tag: "caveats",
    code: `x = 10
result = [x for x in range(5)]  # the 'x' here is local to the comprehension
print(x)        # 10  — outer x unchanged in Python 3

# Contrast with Python 2 behavior (leaked loop variable)
# In Python 2: x == 4 after the comprehension

# Generator, set, dict comprehensions also have their own scope
gen = (n*2 for n in range(3))
# 'n' is not accessible outside`,
    explanation: "In Python 3, comprehension variables are scoped to the comprehension itself and don't leak into the enclosing scope. This was a breaking change from Python 2.",
  },
  {
    id: "py-types-optional-union",
    language: "python",
    title: "Optional[X] is exactly X | None",
    tag: "types",
    code: `from typing import Optional, get_args, get_origin, Union

# All three are equivalent
def f1(x: Optional[int]) -> None: ...
def f2(x: Union[int, None]) -> None: ...
def f3(x: int | None) -> None: ...  # 3.10+

print(Optional[int] == Union[int, None])  # True

# Unpacking Optional
hint = Optional[str]
print(get_args(hint))   # (str, NoneType)`,
    explanation: "`Optional[X]` is just `Union[X, None]`. In modern code (Python 3.10+), prefer the `X | None` syntax for clarity. Use `get_args()` to inspect union members at runtime.",
  },
  {
    id: "py-families-mapping-views",
    language: "python",
    title: "dict.keys(), .values(), .items() return live views",
    tag: "families",
    code: `d = {"a": 1, "b": 2}
keys = d.keys()     # dict_keys view — not a snapshot!

d["c"] = 3
print(list(keys))   # ['a', 'b', 'c']  — reflects the update

# Set-like operations on keys and items views
a = {"x": 1, "y": 2}
b = {"y": 3, "z": 4}
print(a.keys() & b.keys())    # {'y'}  intersection
print(a.items() ^ b.items())  # symmetric difference`,
    explanation: "Dict views are dynamic: they reflect subsequent changes to the dictionary. `.keys()` and `.items()` support set operations; `.values()` does not (values aren't hashable in general).",
  },
  {
    id: "py-classes-enter-exit",
    language: "python",
    title: "Context manager protocol: __enter__ and __exit__",
    tag: "classes",
    code: `class TempFile:
    def __init__(self, name):
        self.name = name

    def __enter__(self):
        self.f = open(self.name, "w")
        return self.f           # bound to 'as' variable

    def __exit__(self, exc_type, exc_val, tb):
        self.f.close()
        return False            # don't suppress exceptions

with TempFile("/tmp/test.txt") as f:
    f.write("hello")
# file is closed even if write raises`,
    explanation: "`__enter__` sets up the resource and returns it (bound to the `as` variable); `__exit__` tears it down. Returning `True` from `__exit__` suppresses any exception that occurred inside the block.",
  },
  {
    id: "py-fstring-binary-hex",
    language: "python",
    title: "f-string binary, octal and hex formatting",
    tag: "snippet",
    code: `n = 255

print(f"{n:b}")    # '11111111'  binary
print(f"{n:o}")    # '377'       octal
print(f"{n:x}")    # 'ff'        hex lowercase
print(f"{n:X}")    # 'FF'        hex uppercase
print(f"{n:#b}")   # '0b11111111' with prefix
print(f"{n:#x}")   # '0xff'      with prefix
print(f"{n:08x}")  # '000000ff'  zero-padded to 8 chars`,
    explanation: "Format type characters `b`, `o`, `x`/`X` convert integers to their binary, octal, or hex representations. The `#` flag adds the `0b`/`0o`/`0x` prefix.",
  },
  {
    id: "py-classes-new-singleton",
    language: "python",
    title: "__new__ to implement a singleton",
    tag: "classes",
    code: `class Singleton:
    _instance = None

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self, value):
        self.value = value

a = Singleton(1)
b = Singleton(2)
print(a is b)       # True   — same object
print(a.value)      # 2      — __init__ ran again on same instance`,
    explanation: "`__new__` creates the instance before `__init__` initializes it. By returning the same object every time, `__new__` implements the singleton pattern — but note `__init__` re-runs on every call.",
  },
];
