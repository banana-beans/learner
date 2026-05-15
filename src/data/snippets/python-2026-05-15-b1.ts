import type { Snippet } from "./types";
export const pythonSnippets20260515B1: Snippet[] = [
  {
    id: "py-b15-str-removeprefix",
    language: "python",
    title: "str.removeprefix / removesuffix",
    tag: "snippet",
    code: `url = "https://example.com/path"
slug = url.removeprefix("https://example.com")
print(slug)   # /path

tag = "v1.2.3"
ver = tag.removeprefix("v")
print(ver)    # 1.2.3

filename = "report.pdf"
base = filename.removesuffix(".pdf")
print(base)   # report`,
    explanation: "Added in Python 3.9, these methods strip a prefix/suffix only if it's present — unlike `lstrip`/`rstrip` which strip individual characters.",
  },
  {
    id: "py-b15-int-bool-arith",
    language: "python",
    title: "bool is a subclass of int",
    tag: "snippet",
    code: `print(True + True)    # 2
print(True * 5)       # 5
print(False + 1)      # 1
print(sum([True, False, True, True]))  # 3

# Practical: count truthy values
data = [0, 1, None, "hello", [], [1]]
count_truthy = sum(bool(x) for x in data)
print(count_truthy)   # 3`,
    explanation: "`bool` inherits from `int` with `True == 1` and `False == 0`, so boolean values participate in arithmetic — useful for counting without an explicit `if`.",
  },
  {
    id: "py-b15-zip-to-dict",
    language: "python",
    title: "zip to build a dict",
    tag: "snippet",
    code: `keys = ["name", "age", "city"]
values = ["Alice", 30, "Berlin"]

mapping = dict(zip(keys, values))
print(mapping)
# {'name': 'Alice', 'age': 30, 'city': 'Berlin'}

# Also works with dict comprehension for transforms
upper = {k: v for k, v in zip(keys, values)}
print(upper)`,
    explanation: "`dict(zip(keys, values))` is the idiomatic one-liner for converting two parallel sequences into a dict without a loop.",
  },
  {
    id: "py-b15-sorted-key-attrgetter",
    language: "python",
    title: "sorted() with operator.attrgetter",
    tag: "snippet",
    code: `from operator import attrgetter
from dataclasses import dataclass

@dataclass
class Person:
    name: str
    age: int

people = [Person("Zara", 25), Person("Bob", 30), Person("Alice", 22)]
by_age = sorted(people, key=attrgetter("age"))
print([p.name for p in by_age])  # ['Alice', 'Zara', 'Bob']

# Multi-key sort
by_age_name = sorted(people, key=attrgetter("age", "name"))`,
    explanation: "`attrgetter` is faster than a lambda and reads more cleanly when sorting objects by one or more attributes.",
  },
  {
    id: "py-b15-list-clear-vs-reassign",
    language: "python",
    title: "list.clear() vs reassigning []",
    tag: "snippet",
    code: `a = [1, 2, 3]
b = a          # b is an alias

a.clear()      # mutates the list object in-place
print(b)       # []  — b sees the change

a = [1, 2, 3]
b = a
a = []         # rebinds a to a new list
print(b)       # [1, 2, 3]  — b still holds original`,
    explanation: "`.clear()` empties the list object all aliases share; `a = []` rebinds only the name `a`, leaving other references untouched.",
  },
  {
    id: "py-b15-set-symmetric-diff",
    language: "python",
    title: "set symmetric difference",
    tag: "snippet",
    code: `a = {1, 2, 3, 4}
b = {3, 4, 5, 6}

# Elements in exactly one of the two sets
diff = a ^ b
print(diff)   # {1, 2, 5, 6}

# In-place variant
a ^= b
print(a)      # {1, 2, 5, 6}

# Same via method (accepts any iterable)
result = a.symmetric_difference([1, 2, 7])
print(result)`,
    explanation: "The `^` operator (symmetric difference) returns elements that are in one set but not both — the set equivalent of XOR.",
  },
  {
    id: "py-b15-str-split-maxsplit",
    language: "python",
    title: "str.split with maxsplit",
    tag: "snippet",
    code: `line = "2024-01-15 INFO  Server started on port 8080"

# Without maxsplit: splits on every whitespace
parts = line.split()
print(len(parts))      # 7

# maxsplit=2: stops after 2 splits
date, level, rest = line.split(None, 2)
print(date)    # 2024-01-15
print(level)   # INFO
print(rest)    # Server started on port 8080`,
    explanation: "`maxsplit` is handy for log-line parsing where the first N fields have a known format but the trailing message may contain the delimiter.",
  },
  {
    id: "py-b15-any-generator-short-circuit",
    language: "python",
    title: "any() / all() short-circuit with generators",
    tag: "snippet",
    code: `def is_prime(n):
    if n < 2:
        return False
    return all(n % i != 0 for i in range(2, int(n**0.5) + 1))

# all() stops at the first False — no unnecessary checks
print(is_prime(7))    # True
print(is_prime(12))   # False

# any() stops at the first True
nums = range(1, 1_000_000)
has_large = any(n > 500 for n in nums)
print(has_large)      # True  (stops early)`,
    explanation: "`any()` and `all()` short-circuit over generators, so they avoid constructing the full sequence — use a generator expression instead of a list comprehension here.",
  },
  {
    id: "py-b15-dict-pop-default",
    language: "python",
    title: "dict.pop() with a default",
    tag: "snippet",
    code: `cache = {"a": 1, "b": 2, "c": 3}

val = cache.pop("b")        # removes and returns 2
print(val, cache)           # 2  {'a': 1, 'c': 3}

# Without default, missing key raises KeyError
# cache.pop("z")  →  KeyError

# With default: safe removal, returns sentinel if missing
val2 = cache.pop("z", None)
print(val2)                 # None  (no exception)`,
    explanation: "`dict.pop(key, default)` is the safest way to remove a key-value pair when you're not sure the key exists.",
  },
  {
    id: "py-b15-reversed-str-slice",
    language: "python",
    title: "Reversing a sequence with [::-1]",
    tag: "snippet",
    code: `s = "hello"
print(s[::-1])       # olleh

lst = [1, 2, 3, 4, 5]
print(lst[::-1])     # [5, 4, 3, 2, 1]

# For in-place list reversal use .reverse() — no copy
lst.reverse()
print(lst)           # [5, 4, 3, 2, 1]

# reversed() returns an iterator (lazy, no copy)
for x in reversed(lst):
    print(x, end=" ")  # 1 2 3 4 5`,
    explanation: "`[::-1]` creates a reversed copy; `.reverse()` mutates in-place (O(1) space); `reversed()` is a lazy iterator. Choose based on whether you need a copy.",
  },
  {
    id: "py-b15-understand-mutable-default",
    language: "python",
    title: "Mutable default argument trap (trace)",
    tag: "understanding",
    code: `def append_to(val, lst=[]):   # lst created ONCE at definition
    lst.append(val)
    return lst

print(append_to(1))   # [1]
print(append_to(2))   # [1, 2]  ← shared across calls!
print(append_to(3))   # [1, 2, 3]

# Fix: use None as sentinel
def append_safe(val, lst=None):
    if lst is None:
        lst = []
    lst.append(val)
    return lst`,
    explanation: "Default argument values are evaluated once at function definition time, not at each call — so a mutable default like `[]` is shared across all calls.",
  },
  {
    id: "py-b15-understand-is-small-int",
    language: "python",
    title: "Integer identity caching (trace)",
    tag: "understanding",
    code: `a = 256
b = 256
print(a is b)    # True  — same cached object

x = 257
y = 257
print(x is y)    # False (CPython) — new objects above 256

# In an interactive session, assignment on one line may cache:
z = w = 1000
print(z is w)    # True  — same object

# Always use == for value comparison, not is
print(256 == 256)  # True (always correct)`,
    explanation: "CPython caches small integers (−5 to 256) so `is` accidentally works in that range; above 256 it's implementation-defined. Use `==` for value equality.",
  },
  {
    id: "py-b15-understand-nonlocal",
    language: "python",
    title: "nonlocal variable binding (trace)",
    tag: "understanding",
    code: `def make_counter():
    count = 0
    def increment():
        nonlocal count   # binds to outer scope's count
        count += 1
        return count
    return increment

c = make_counter()
print(c())   # 1
print(c())   # 2
print(c())   # 3

# Without nonlocal, count += 1 would raise UnboundLocalError`,
    explanation: "`nonlocal` tells Python to look up the enclosing (non-global) scope for the name, allowing the inner function to mutate the outer variable.",
  },
  {
    id: "py-b15-understand-del-name",
    language: "python",
    title: "del unbinds names, doesn't destroy objects (trace)",
    tag: "understanding",
    code: `a = [1, 2, 3]
b = a          # b is another reference to the same list

del a          # removes the name 'a', not the list
# print(a)    # NameError

print(b)       # [1, 2, 3]  — list still alive via b

# del on a dict key
d = {"x": 1, "y": 2}
del d["x"]
print(d)       # {'y': 2}`,
    explanation: "`del name` removes the name binding from the current namespace; the object persists as long as any other reference points to it.",
  },
  {
    id: "py-b15-understand-augassign-list",
    language: "python",
    title: "+= on list vs int (trace)",
    tag: "understanding",
    code: `# Lists: += calls __iadd__ (extend in-place)
a = [1, 2]
b = a
a += [3, 4]    # mutates the list object
print(b)       # [1, 2, 3, 4]  — b sees the change

# Integers: += rebinds (ints are immutable)
x = 10
y = x
x += 5         # x now points to a new int object
print(y)       # 10  — unchanged`,
    explanation: "For mutable types `+=` calls `__iadd__` (in-place mutation); for immutable types it creates a new object and rebinds the name — aliases behave differently.",
  },
  {
    id: "py-b15-understand-except-bind",
    language: "python",
    title: "Exception variable scope (trace)",
    tag: "understanding",
    code: `try:
    raise ValueError("oops")
except ValueError as e:
    msg = str(e)      # save the message
    print(e)          # oops

# e is DELETED after the except block ends
try:
    print(e)          # NameError: name 'e' is not defined
except NameError:
    print("e gone")   # e gone

print(msg)            # oops  — msg persists`,
    explanation: "Python deletes the `as` variable at the end of an `except` block to break reference cycles; copy any needed information into a separate name before the block ends.",
  },
  {
    id: "py-b15-understand-and-or-return",
    language: "python",
    title: "and / or return operands, not booleans (trace)",
    tag: "understanding",
    code: `print(1 and 2)       # 2  — first truthy not enough; returns last
print(0 and 2)       # 0  — returns first falsy
print([] or "default")   # 'default'  — first truthy
print("hi" or "default") # 'hi'

# Classic default pattern (but prefer 'x if x is not None else default')
name = None
display = name or "Anonymous"
print(display)       # Anonymous`,
    explanation: "`and` returns the first falsy value or the last value; `or` returns the first truthy value or the last value — never a `bool` unless the operand is already one.",
  },
  {
    id: "py-b15-understand-tuple-mutable",
    language: "python",
    title: "Tuple containing a mutable object (trace)",
    tag: "understanding",
    code: `t = ([1, 2], [3, 4])

# The tuple is immutable — you can't reassign t[0]
# t[0] = [9]  →  TypeError

# But the list inside can be mutated
t[0].append(99)
print(t)   # ([1, 2, 99], [3, 4])

# Hashing fails if a mutable element exists
try:
    hash(t)
except TypeError as e:
    print(e)   # unhashable type: 'list'`,
    explanation: "Tuple immutability means the references it stores can't be rebound, but if those references point to mutable objects, those objects can still change.",
  },
  {
    id: "py-b15-understand-float-eq",
    language: "python",
    title: "Floating-point equality pitfall (trace)",
    tag: "understanding",
    code: `x = 0.1 + 0.2
print(x)              # 0.30000000000000004
print(x == 0.3)       # False

import math
print(math.isclose(x, 0.3))          # True
print(math.isclose(x, 0.3, rel_tol=1e-9))  # True

# For financial arithmetic, use Decimal
from decimal import Decimal
print(Decimal("0.1") + Decimal("0.2"))  # 0.3`,
    explanation: "IEEE 754 binary floating point can't represent 0.1 or 0.3 exactly; use `math.isclose` for approximate comparison, or `Decimal` for exact decimal arithmetic.",
  },
  {
    id: "py-b15-understand-dict-iter-order",
    language: "python",
    title: "dict preserves insertion order (trace)",
    tag: "understanding",
    code: `d = {}
d["c"] = 3
d["a"] = 1
d["b"] = 2

print(list(d.keys()))    # ['c', 'a', 'b']  — insertion order

# update() also preserves order of the incoming items
d.update({"z": 26, "m": 13})
print(list(d.keys()))    # ['c', 'a', 'b', 'z', 'm']

# Updating an existing key moves it? No — position stays
d["a"] = 99
print(list(d.keys()))    # ['c', 'a', 'b', 'z', 'm']`,
    explanation: "Since Python 3.7 `dict` guarantees insertion order. Updating an existing key preserves its position; only inserting a new key appends to the end.",
  },
  {
    id: "py-b15-understand-class-dict",
    language: "python",
    title: "Class dict vs instance dict (trace)",
    tag: "understanding",
    code: `class Counter:
    count = 0          # class variable

    def increment(self):
        self.count += 1   # creates an INSTANCE attribute!

c1 = Counter()
c2 = Counter()
c1.increment()

print(Counter.count)   # 0  — class var unchanged
print(c1.count)        # 1  — instance var shadows class var
print(c2.count)        # 0  — reads class var (no instance var yet)`,
    explanation: "`self.count += 1` reads from the class, then writes to the instance (`self.__dict__`), shadowing the class variable only for that instance.",
  },
  {
    id: "py-b15-structures-counter-ops",
    language: "python",
    title: "Counter arithmetic operators",
    tag: "structures",
    code: `from collections import Counter

a = Counter({"x": 4, "y": 2, "z": 1})
b = Counter({"x": 1, "y": 3, "w": 5})

print(a + b)   # Counter({'w': 5, 'x': 5, 'y': 5, 'z': 1})
print(a - b)   # Counter({'x': 3, 'z': 1})  — drops negatives/zero
print(a & b)   # Counter({'x': 1, 'y': 2})  — min of each
print(a | b)   # Counter({'w': 5, 'x': 4, 'y': 3, 'z': 1})  — max`,
    explanation: "`Counter` supports `+`, `-`, `&` (intersection/min), `|` (union/max); subtraction drops zero/negative counts, making it clean for set-like multiset operations.",
  },
  {
    id: "py-b15-structures-ordered-dict-eq",
    language: "python",
    title: "OrderedDict equality respects order",
    tag: "structures",
    code: `from collections import OrderedDict

d1 = OrderedDict([("a", 1), ("b", 2)])
d2 = OrderedDict([("b", 2), ("a", 1)])

print(d1 == d2)                      # False — order matters
print(dict(d1) == dict(d2))          # True  — plain dicts ignore order

d3 = OrderedDict([("a", 1), ("b", 2)])
print(d1 == d3)                      # True`,
    explanation: "Two `OrderedDict`s compare equal only if both order and content match; comparing against a plain `dict` ignores order and only checks content.",
  },
  {
    id: "py-b15-structures-chainmap-child",
    language: "python",
    title: "ChainMap new_child for scoped writes",
    tag: "structures",
    code: `from collections import ChainMap

base = {"x": 1, "y": 2}
overrides = {"y": 99}

scope = ChainMap(overrides, base)
print(scope["x"])   # 1  (from base)
print(scope["y"])   # 99 (overrides wins)

# new_child creates a new writable layer on top
child = scope.new_child({"z": 3})
child["x"] = 100     # writes to the child map only
print(scope["x"])    # 1  — parent unchanged`,
    explanation: "`ChainMap` overlays multiple dicts for reading; writes go to the first (top) map. `new_child()` pushes a fresh layer for temporary scoping like a config or symbol table.",
  },
  {
    id: "py-b15-structures-array-typecodes",
    language: "python",
    title: "array module typecodes",
    tag: "structures",
    code: `import array, sys

ints   = array.array("i", range(1000))   # signed int
floats = array.array("f", [1.0, 2.5])   # single float
doubles = array.array("d", [1.0, 2.5])  # double float
shorts = array.array("h", range(100))   # signed short

# Memory comparison
lst = list(range(1000))
print(sys.getsizeof(lst))    # ~8056 bytes
print(sys.getsizeof(ints))   # ~4064 bytes  — half the memory`,
    explanation: "The `array` module stores typed values in a compact C array; choosing a smaller typecode like `'h'` (2 bytes) vs `'l'` (8 bytes) can halve memory use compared to a Python list.",
  },
  {
    id: "py-b15-structures-queue-taskdone",
    language: "python",
    title: "Queue.join() and task_done()",
    tag: "structures",
    code: `import queue, threading

q = queue.Queue()

def worker():
    while True:
        item = q.get()
        if item is None:
            break
        print(f"processing {item}")
        q.task_done()    # signal item is done

t = threading.Thread(target=worker, daemon=True)
t.start()
for i in range(3):
    q.put(i)
q.join()             # blocks until all task_done() called
q.put(None)          # stop worker`,
    explanation: "`Queue.join()` blocks the main thread until every enqueued item has had `task_done()` called — the standard pattern for wait-until-all-work-is-done producer/consumer.",
  },
  {
    id: "py-b15-structures-defaultdict-vs-setdefault",
    language: "python",
    title: "defaultdict vs dict.setdefault",
    tag: "structures",
    code: `from collections import defaultdict

# defaultdict: factory called on missing key access
dd = defaultdict(list)
dd["a"].append(1)
dd["a"].append(2)
print(dict(dd))   # {'a': [1, 2]}

# setdefault: inserts default on first access
d = {}
d.setdefault("a", []).append(1)
d.setdefault("a", []).append(2)
print(d)           # {'a': [1, 2]}

# defaultdict is faster for many inserts; setdefault works on any dict`,
    explanation: "Both solve the missing-key problem for accumulator dicts. `defaultdict` is cleaner when all missing keys need the same factory; `setdefault` is more flexible when the default varies.",
  },
  {
    id: "py-b15-structures-collections-abc-check",
    language: "python",
    title: "Checking abstract base classes with isinstance",
    tag: "structures",
    code: `from collections.abc import (
    Mapping, MutableMapping, Sequence, MutableSequence, Set
)

print(isinstance({}, Mapping))            # True
print(isinstance({}, MutableMapping))     # True
print(isinstance((), Sequence))           # True
print(isinstance((), MutableSequence))    # False — tuples immutable
print(isinstance(frozenset(), Set))       # True

# Use these in type checks to accept any dict-like, not just dict
def process(data: Mapping):
    return list(data.items())`,
    explanation: "The `collections.abc` classes let you test structural compatibility (does it behave like a Mapping?) rather than checking for a specific concrete type.",
  },
  {
    id: "py-b15-structures-namedtuple-make",
    language: "python",
    title: "namedtuple._make() classmethod",
    tag: "structures",
    code: `from collections import namedtuple

Point = namedtuple("Point", ["x", "y", "z"])

# _make: create from any iterable (row from DB, CSV, etc.)
row = [3.0, 4.5, 1.2]
p = Point._make(row)
print(p)          # Point(x=3.0, y=4.5, z=1.2)

# _asdict: convert back to an OrderedDict
print(p._asdict())   # {'x': 3.0, 'y': 4.5, 'z': 1.2}

# _replace: create a modified copy
p2 = p._replace(z=0.0)
print(p2)         # Point(x=3.0, y=4.5, z=0.0)`,
    explanation: "`_make` is the classmethod form of the constructor; it unpacks any iterable into the named fields — ideal when you're consuming rows from a database or CSV file.",
  },
  {
    id: "py-b15-structures-bidict-pattern",
    language: "python",
    title: "Bidirectional dict pattern",
    tag: "structures",
    code: `# No stdlib bidict — build one with two dicts
class BiDict:
    def __init__(self):
        self._fwd = {}
        self._inv = {}

    def put(self, k, v):
        self._fwd[k] = v
        self._inv[v] = k

    def get(self, k):   return self._fwd[k]
    def inv(self, v):   return self._inv[v]

b = BiDict()
b.put("USD", "US Dollar")
print(b.get("USD"))      # US Dollar
print(b.inv("US Dollar")) # USD`,
    explanation: "A bidirectional dict lets you look up by key or value in O(1). The pattern uses two backing dicts; the `bidict` PyPI package provides a fully-featured version.",
  },
  {
    id: "py-b15-caveat-star-import",
    language: "python",
    title: "Star import name collision caveat",
    tag: "caveats",
    code: `# math.floor returns an int
from math import *

# After this import, 'floor', 'ceil' etc. are in namespace
print(floor(3.7))   # 3

# Problem: later import silently clobbers names
from os.path import *  # also exports many names

# If both modules export a same name, the LAST import wins
# Tools like flake8 flag 'from x import *' for this reason

# Safe alternative: import the module, keep namespace clear
import math
print(math.floor(3.7))  # 3`,
    explanation: "Star imports pollute the namespace and the last imported name silently wins when two modules export the same identifier — always import names explicitly or import the module.",
  },
  {
    id: "py-b15-caveat-dict-update-order",
    language: "python",
    title: "dict.update() key precedence",
    tag: "caveats",
    code: `defaults = {"color": "red", "size": 10, "weight": 5}
overrides = {"size": 20, "opacity": 0.8}

# update() applies overrides — incoming keys win
merged = {**defaults, **overrides}
print(merged)
# {'color': 'red', 'size': 20, 'weight': 5, 'opacity': 0.8}

# Gotcha: order matters!
wrong = {**overrides, **defaults}
print(wrong["size"])   # 10  — defaults overwrote override!`,
    explanation: "When merging dicts, the rightmost source wins for duplicate keys; always put `defaults` first and `overrides` last in `{**a, **b}` expressions.",
  },
  {
    id: "py-b15-caveat-generator-exhaust",
    language: "python",
    title: "Generator exhaustion caveat",
    tag: "caveats",
    code: `gen = (x * 2 for x in range(5))

first_pass = list(gen)
print(first_pass)     # [0, 2, 4, 6, 8]

second_pass = list(gen)
print(second_pass)    # []  — generator is exhausted!

# Fix: use a function to create a fresh generator
def make_gen():
    return (x * 2 for x in range(5))

print(list(make_gen()))   # [0, 2, 4, 6, 8]
print(list(make_gen()))   # [0, 2, 4, 6, 8]`,
    explanation: "A generator can only be iterated once; after it's exhausted it yields nothing. Wrap it in a function or convert to a list if you need to iterate multiple times.",
  },
  {
    id: "py-b15-caveat-copy-shallow",
    language: "python",
    title: "list.copy() is shallow — nested objects shared",
    tag: "caveats",
    code: `import copy

original = [[1, 2], [3, 4]]
shallow = original.copy()   # or list(original) or original[:]

shallow[0].append(99)       # mutates the shared inner list
print(original[0])          # [1, 2, 99]  — oops!

# Fix: deep copy
deep = copy.deepcopy(original)
deep[0].append(0)
print(original[0])          # [1, 2, 99]  — unchanged`,
    explanation: "`.copy()` copies the outer container but the inner objects are still shared references; use `copy.deepcopy` when nested mutable objects must be independent.",
  },
  {
    id: "py-b15-caveat-sorted-stable",
    language: "python",
    title: "sorted() is stable — original order preserved for ties",
    tag: "caveats",
    code: `data = [("bob", 2), ("alice", 1), ("carol", 2), ("dave", 1)]

# Sort only by score (second element)
by_score = sorted(data, key=lambda x: x[1])
print(by_score)
# [('alice', 1), ('dave', 1), ('bob', 2), ('carol', 2)]
# Ties (score=1) keep original relative order: alice before dave
# Ties (score=2) keep original relative order: bob before carol

# Stability enables multi-key sort by chaining
by_score_then_name = sorted(sorted(data, key=lambda x: x[0]),
                             key=lambda x: x[1])`,
    explanation: "Python's `sorted()` (Timsort) is stable: equal elements retain their relative order from the input, enabling multi-pass sorting as an alternative to composite keys.",
  },
  {
    id: "py-b15-caveat-bytes-indexing",
    language: "python",
    title: "bytes indexing returns int, not bytes",
    tag: "caveats",
    code: `data = b"hello"

# Indexing returns an int (the byte value)
print(data[0])         # 104  — not b'h'!
print(type(data[0]))   # <class 'int'>

# Slicing returns bytes
print(data[0:1])       # b'h'
print(type(data[0:1])) # <class 'bytes'>

# To get a single-char bytes object: slice or pack
first = data[0:1]
also = bytes([data[0]])
print(first == also)   # True`,
    explanation: "Indexing `bytes` with a single integer yields an `int` (0–255), not a length-1 `bytes` object — use a slice `[i:i+1]` when you need `bytes`.",
  },
  {
    id: "py-b15-caveat-slice-obj",
    language: "python",
    title: "slice objects as reusable parameters",
    tag: "caveats",
    code: `data = list(range(20))

# Hard-coded slice literals scatter magic numbers
# data[2:10:2]  — what does 2:10:2 mean?

# Named slice objects are self-documenting
EVERY_OTHER = slice(None, None, 2)  # ::2
FIRST_FIVE  = slice(0, 5)           # 0:5

print(data[FIRST_FIVE])           # [0, 1, 2, 3, 4]
print(data[EVERY_OTHER])          # [0, 2, 4, 6, 8, 10, 12, 14, 16, 18]

# slice.indices(len) gives (start, stop, step) clamped to length
print(FIRST_FIVE.indices(3))      # (0, 3, 1)`,
    explanation: "`slice(start, stop, step)` creates a reusable slice object; giving it a meaningful name makes slicing logic readable and avoids repeating magic numbers.",
  },
  {
    id: "py-b15-caveat-dict-view-live",
    language: "python",
    title: "dict_keys and dict_values are live views",
    tag: "caveats",
    code: `d = {"a": 1, "b": 2}
keys = d.keys()     # a live view, not a copy

print(list(keys))   # ['a', 'b']

d["c"] = 3          # modify the dict
print(list(keys))   # ['a', 'b', 'c']  — view updated!

# Gotcha: can't modify dict while iterating its view
# for k in d:  d["x"] = 0  →  RuntimeError

# Safe: iterate over a snapshot
for k in list(d.keys()):
    if k == "a":
        del d[k]`,
    explanation: "`dict.keys()`, `.values()`, and `.items()` return live view objects that reflect subsequent changes to the dict — copy to a list if you'll modify the dict mid-loop.",
  },
  {
    id: "py-b15-caveat-functools-wraps",
    language: "python",
    title: "Missing @wraps hides function metadata",
    tag: "caveats",
    code: `import functools

# Without @wraps
def bad_decorator(fn):
    def wrapper(*args, **kwargs):
        return fn(*args, **kwargs)
    return wrapper

@bad_decorator
def greet(name): "Say hello."
print(greet.__name__)   # 'wrapper'  — metadata lost
print(greet.__doc__)    # None

# With @wraps
def good_decorator(fn):
    @functools.wraps(fn)
    def wrapper(*args, **kwargs):
        return fn(*args, **kwargs)
    return wrapper

@good_decorator
def greet2(name): "Say hello."
print(greet2.__name__)  # 'greet2'`,
    explanation: "`@functools.wraps(fn)` copies `__name__`, `__doc__`, `__qualname__`, and `__wrapped__` from the wrapped function — critical for debugging and tools that inspect function metadata.",
  },
  {
    id: "py-b15-types-int-bit-length",
    language: "python",
    title: "int.bit_length() and bit operations",
    tag: "types",
    code: `n = 255
print(n.bit_length())    # 8  — bits needed to represent n
print(bin(n))            # 0b11111111

# Compute next power of two
import math
def next_pow2(n):
    return 1 << math.ceil(math.log2(n)) if n > 0 else 1

print(next_pow2(100))    # 128
print(next_pow2(128))    # 128

# Check if power of two: n & (n-1) == 0
print(128 & 127 == 0)    # True
print(100 & 99  == 0)    # False`,
    explanation: "`int.bit_length()` returns the number of bits in the integer's binary representation (excluding leading zeros); combined with bit masking it enables efficient power-of-two checks.",
  },
  {
    id: "py-b15-types-complex-parts",
    language: "python",
    title: "Python complex type",
    tag: "types",
    code: `z = 3 + 4j
print(z.real)     # 3.0
print(z.imag)     # 4.0
print(abs(z))     # 5.0  — magnitude (Pythagorean)
print(z.conjugate())  # (3-4j)

import cmath
print(cmath.phase(z))             # 0.927  radians
print(cmath.polar(z))             # (5.0, 0.927)
print(cmath.sqrt(-1))             # 1j`,
    explanation: "Python's built-in `complex` supports `j` literals and attribute access via `.real`/`.imag`; the `cmath` module provides complex-aware versions of `sqrt`, `exp`, `log`, etc.",
  },
  {
    id: "py-b15-types-typevar-covariant",
    language: "python",
    title: "TypeVar covariant and contravariant",
    tag: "types",
    code: `from typing import TypeVar, Generic

T_co = TypeVar("T_co", covariant=True)
T_contra = TypeVar("T_contra", contravariant=True)

class Producer(Generic[T_co]):
    def produce(self) -> T_co: ...

class Consumer(Generic[T_contra]):
    def consume(self, item: T_contra) -> None: ...

# Covariant: Producer[int] is a subtype of Producer[object]
# Contravariant: Consumer[object] is a subtype of Consumer[int]

# Invariant (default T): List[int] is NOT a subtype of List[object]
T = TypeVar("T")
class Box(Generic[T]):
    def get(self) -> T: ...
    def set(self, v: T) -> None: ...`,
    explanation: "Covariant TypeVars (`covariant=True`) flow in the same direction as the type hierarchy; contravariant flow opposite. Invariance (the default) disables subtyping for the generic class.",
  },
  {
    id: "py-b15-types-newtype-alias",
    language: "python",
    title: "NewType vs plain type alias",
    tag: "types",
    code: `from typing import NewType

# Plain alias: just another name for the same type
UserId = int          # UserId IS int — no distinction at type-check time
name: UserId = "bob"  # no error from mypy

# NewType: creates a distinct type at checking time
UserId2 = NewType("UserId2", int)
uid: UserId2 = UserId2(42)   # must call to "tag" the value
# bad: uid2: UserId2 = 42   # mypy error — plain int not accepted

# At runtime NewType is a no-op (identity function)
print(uid)        # 42`,
    explanation: "`NewType` creates a nominal distinction that type checkers enforce — `int` won't silently pass as `UserId2` — while costing nothing at runtime.",
  },
  {
    id: "py-b15-types-annotated-validator",
    language: "python",
    title: "Annotated for attaching runtime metadata",
    tag: "types",
    code: `from typing import Annotated, get_type_hints

class Gt:
    def __init__(self, val): self.val = val

class Le:
    def __init__(self, val): self.val = val

def validate(cls, instance):
    for name, hint in get_type_hints(cls, include_extras=True).items():
        for meta in getattr(hint, "__metadata__", ()):
            v = getattr(instance, name)
            if isinstance(meta, Gt) and not (v > meta.val):
                raise ValueError(f"{name} must be > {meta.val}")

class Order:
    amount: Annotated[float, Gt(0), Le(10000)]
    def __init__(self, amount): self.amount = amount`,
    explanation: "`Annotated[T, *metadata]` attaches arbitrary metadata to a type hint; `get_type_hints(include_extras=True)` retrieves it at runtime for validation frameworks like Pydantic.",
  },
  {
    id: "py-b15-types-typeguard-narrow",
    language: "python",
    title: "TypeGuard for narrowing union types",
    tag: "types",
    code: `from typing import TypeGuard

def is_str_list(val: list[object]) -> TypeGuard[list[str]]:
    return all(isinstance(x, str) for x in val)

def process(items: list[object]) -> None:
    if is_str_list(items):
        # type checker knows items: list[str] here
        upper = [s.upper() for s in items]
        print(upper)

process(["hello", "world"])  # ['HELLO', 'WORLD']
process([1, 2, 3])           # skipped — not all strings`,
    explanation: "`TypeGuard[T]` return type tells the type checker that if the function returns `True`, the argument has been narrowed to type `T` inside the guarded branch.",
  },
  {
    id: "py-b15-types-union-new-syntax",
    language: "python",
    title: "X | Y union syntax (Python 3.10+)",
    tag: "types",
    code: `# Old syntax (still valid)
from typing import Union, Optional
def old(x: Union[int, str]) -> Optional[int]: ...

# New syntax (3.10+): cleaner, no import needed
def process(x: int | str) -> int | None:
    if isinstance(x, str):
        return len(x)
    return x

# Works in isinstance too (3.10+)
val = 42
print(isinstance(val, int | str))   # True
print(isinstance(val, float | str)) # False`,
    explanation: "The `X | Y` union syntax introduced in Python 3.10 works in annotations and `isinstance`/`issubclass` calls, removing the need for `Union` and `Optional` imports.",
  },
  {
    id: "py-b15-types-cast",
    language: "python",
    title: "typing.cast() for type narrowing",
    tag: "types",
    code: `from typing import cast, Any

def load_config() -> Any:
    return {"host": "localhost", "port": 5432}

config = load_config()

# Type checker infers config: Any — no completions
# cast tells the checker to trust you
typed_config = cast(dict[str, int | str], config)
print(typed_config["port"])   # 5432

# cast is a no-op at runtime — pure type-checker hint
import typing
print(typing.cast(int, "hello"))  # "hello"  (no conversion!)`,
    explanation: "`typing.cast(T, val)` is a zero-runtime-cost instruction to the type checker saying \"trust me, this is `T`\"; it never converts the value and has no effect on execution.",
  },
  {
    id: "py-b15-types-runtime-checkable",
    language: "python",
    title: "runtime_checkable Protocol",
    tag: "types",
    code: `from typing import Protocol, runtime_checkable

@runtime_checkable
class Drawable(Protocol):
    def draw(self) -> None: ...

class Circle:
    def draw(self) -> None:
        print("O")

class Square:
    def draw(self) -> None:
        print("[]")

class Point:
    pass  # no draw method

for obj in [Circle(), Square(), Point()]:
    print(isinstance(obj, Drawable), type(obj).__name__)
# True Circle / True Square / False Point`,
    explanation: "`@runtime_checkable` enables `isinstance` checks against a Protocol; it only checks for method/attribute presence (structural), not full signature compatibility.",
  },
  {
    id: "py-b15-types-optional-equiv",
    language: "python",
    title: "Optional[X] is exactly X | None",
    tag: "types",
    code: `from typing import Optional, Union, get_args, get_origin
import types

# These three are equivalent
def f1(x: Optional[int]) -> None: ...
def f2(x: Union[int, None]) -> None: ...
def f3(x: int | None) -> None: ...  # Python 3.10+

# Verify at runtime
hint = Optional[int]
print(get_origin(hint))   # typing.Union
print(get_args(hint))     # (<class 'int'>, <class 'NoneType'>)

# Never write Optional[Optional[X]] — it flattens to Optional[X]`,
    explanation: "`Optional[X]` is syntactic sugar for `Union[X, None]`; the `X | None` syntax is now preferred. Nesting `Optional` is harmless (it flattens) but confusing.",
  },
  {
    id: "py-b15-families-list-deque-cost",
    language: "python",
    title: "list vs deque: append/pop cost",
    tag: "families",
    code: `from collections import deque
import timeit

N = 100_000

# list: O(1) amortised append/pop at RIGHT end
# list: O(n) pop(0) or insert(0, ...) at LEFT end
t1 = timeit.timeit(lambda: [0] * N, number=10)

# deque: O(1) at BOTH ends
dq = deque()
dq_pop_left = timeit.timeit(
    setup="from collections import deque; dq = deque(range(1000))",
    stmt="dq.popleft()",
    number=10_000,
)
print(f"deque.popleft: {dq_pop_left:.4f}s  (always O(1))")`,
    explanation: "Use `deque` when you need fast O(1) appends and pops from both ends; `list` is faster for indexed random access but O(n) at the left end.",
  },
  {
    id: "py-b15-families-dict-counter",
    language: "python",
    title: "dict vs Counter for tallying",
    tag: "families",
    code: `from collections import Counter

words = ["apple", "banana", "apple", "cherry", "banana", "apple"]

# dict way — verbose
counts = {}
for w in words:
    counts[w] = counts.get(w, 0) + 1

# Counter way — concise and feature-rich
c = Counter(words)
print(c)                           # Counter({'apple': 3, ...})
print(c.most_common(2))            # [('apple', 3), ('banana', 2)]
print(c["missing"])                # 0  — never KeyError
c.update(["apple", "date"])        # increment in-place`,
    explanation: "`Counter` is a `dict` subclass; it adds `most_common()`, arithmetic operators, and safe 0-default for missing keys — always prefer it over a manual tally dict.",
  },
  {
    id: "py-b15-families-set-frozenset",
    language: "python",
    title: "set vs frozenset trade-offs",
    tag: "families",
    code: `# set: mutable, not hashable, can't be dict key
s = {1, 2, 3}
s.add(4)

# frozenset: immutable, hashable, usable as dict key
fs = frozenset([1, 2, 3])
# fs.add(4)  →  AttributeError

# frozenset as dict key
graph = {
    frozenset(["a", "b"]): "edge_1",
    frozenset(["b", "c"]): "edge_2",
}
print(graph[frozenset(["b", "a"])])  # edge_1  (order doesn't matter)

# Both support all read-only set ops: |, &, -, ^, issubset, etc.`,
    explanation: "`frozenset` is the immutable, hashable counterpart of `set`; use it when you need to store a set inside another set or as a dict key.",
  },
  {
    id: "py-b15-families-typeddict-dataclass",
    language: "python",
    title: "TypedDict vs dataclass: when to use which",
    tag: "families",
    code: `from typing import TypedDict
from dataclasses import dataclass

# TypedDict: annotates a plain dict — no behaviour, JSON-friendly
class Movie(TypedDict):
    title: str
    year: int

m: Movie = {"title": "Dune", "year": 2021}  # still a dict at runtime

# dataclass: creates a real class with methods, identity, defaults
@dataclass
class MovieObj:
    title: str
    year: int

    def age(self, current=2025) -> int:
        return current - self.year

obj = MovieObj("Dune", 2021)
print(obj.age())   # 4`,
    explanation: "Use `TypedDict` for annotating dicts you'll serialize to JSON or receive from APIs; use `dataclass` when you want methods, default values, or an actual object identity.",
  },
  {
    id: "py-b15-families-io-stringio-bytesio",
    language: "python",
    title: "StringIO vs BytesIO",
    tag: "families",
    code: `from io import StringIO, BytesIO

# StringIO: in-memory text file
text_buf = StringIO()
text_buf.write("hello ")
text_buf.write("world")
text_buf.seek(0)
print(text_buf.read())    # hello world

# BytesIO: in-memory binary file
bin_buf = BytesIO()
bin_buf.write(b"\x00\x01\x02")
print(bin_buf.tell())     # 3
bin_buf.seek(0)
print(bin_buf.read(2))    # b'\x00\x01'`,
    explanation: "`StringIO` wraps a `str` buffer for text operations; `BytesIO` wraps a `bytes` buffer for binary operations — both implement the full file-like interface in memory.",
  },
  {
    id: "py-b15-families-format-options",
    language: "python",
    title: "%-format vs str.format vs f-string",
    tag: "families",
    code: `name, score = "Alice", 98.5

# % formatting (old, C-style)
msg1 = "Hello %s, score: %.1f" % (name, score)

# str.format (Python 2.6+)
msg2 = "Hello {}, score: {:.1f}".format(name, score)

# f-string (Python 3.6+, preferred)
msg3 = f"Hello {name}, score: {score:.1f}"

print(msg1 == msg2 == msg3)  # True

# f-strings: can embed arbitrary expressions
print(f"{2 ** 10 = }")        # 2 ** 10 = 1024  (debug mode with =)`,
    explanation: "f-strings are the fastest and most readable for most uses; `str.format` is useful when the template is stored separately (e.g., in a config file).",
  },
  {
    id: "py-b15-families-comprehension-types",
    language: "python",
    title: "List / set / dict / generator comprehension",
    tag: "families",
    code: `data = range(1, 6)

lst  = [x**2 for x in data]              # list
st   = {x**2 for x in data}              # set (no duplicates)
dct  = {x: x**2 for x in data}           # dict
gen  = (x**2 for x in data)              # generator (lazy)

print(type(lst), lst)   # <class 'list'> [1, 4, 9, 16, 25]
print(type(st),  st)    # <class 'set'>  {1, 4, 9, 16, 25}
print(type(dct), dct)   # <class 'dict'> {1:1, 2:4, ...}
print(type(gen))         # <class 'generator'>`,
    explanation: "Square brackets give a list, curly braces give a set or dict (based on whether there's a `:`), and parentheses give a lazy generator — all share the same filter/map syntax.",
  },
  {
    id: "py-b15-families-abc-protocol",
    language: "python",
    title: "ABC vs Protocol: nominal vs structural",
    tag: "families",
    code: `from abc import ABC, abstractmethod
from typing import Protocol

# ABC: nominal subtyping — must explicitly inherit
class Flyable(ABC):
    @abstractmethod
    def fly(self): ...

class Bird(Flyable):
    def fly(self): print("flap")

# Protocol: structural subtyping — duck typing
class Swimmable(Protocol):
    def swim(self): ...

class Fish:          # no explicit inheritance
    def swim(self): print("splash")

from typing import runtime_checkable
@runtime_checkable
class Swimmable2(Protocol):
    def swim(self): ...

print(isinstance(Fish(), Swimmable2))  # True`,
    explanation: "ABCs require explicit registration or inheritance (nominal); Protocols check for the presence of methods (structural/duck typing). Protocols are preferred for library APIs that shouldn't force inheritance.",
  },
  {
    id: "py-b15-families-path-os",
    language: "python",
    title: "pathlib.Path vs os.path",
    tag: "families",
    code: `from pathlib import Path
import os

p = Path("/tmp/data/report.txt")

# os.path style (strings)
print(os.path.dirname("/tmp/data/report.txt"))   # /tmp/data
print(os.path.join("/tmp", "data", "out.csv"))   # /tmp/data/out.csv

# pathlib style (OO)
print(p.parent)           # /tmp/data
print(p.stem)             # report
print(p.suffix)           # .txt
print(p.with_suffix(".csv"))  # /tmp/data/report.csv
new = p.parent / "output" / "result.csv"
print(new)  # /tmp/data/output/result.csv`,
    explanation: "`pathlib.Path` uses `/` for joining and exposes parts as properties; `os.path` uses functions and strings. `pathlib` is strongly preferred in modern Python for readability.",
  },
  {
    id: "py-b15-classes-getitem-impl",
    language: "python",
    title: "__getitem__ for custom indexing",
    tag: "classes",
    code: `class BitVector:
    def __init__(self, size):
        self._data = bytearray((size + 7) // 8)
        self._size = size

    def __setitem__(self, i, val):
        if val:
            self._data[i // 8] |= (1 << (i % 8))
        else:
            self._data[i // 8] &= ~(1 << (i % 8))

    def __getitem__(self, i):
        return bool(self._data[i // 8] & (1 << (i % 8)))

bv = BitVector(16)
bv[3] = True
print(bv[3], bv[4])   # True False`,
    explanation: "Implementing `__getitem__` (and `__setitem__`) gives your class `[]` subscript syntax; Python also calls `__getitem__` with `slice` objects when slicing.",
  },
  {
    id: "py-b15-classes-len-bool",
    language: "python",
    title: "__len__ controls bool conversion",
    tag: "classes",
    code: `class Bag:
    def __init__(self, items):
        self._items = list(items)

    def __len__(self):
        return len(self._items)

    # __bool__ is consulted first; if absent, __len__ is used
    # (if len == 0: falsy; else truthy)

empty = Bag([])
full  = Bag([1, 2, 3])

print(bool(empty))   # False
print(bool(full))    # True

if full:
    print(f"Bag has {len(full)} item(s)")  # Bag has 3 item(s)`,
    explanation: "If `__bool__` is not defined Python falls back to `__len__`: an object is falsy when `len(obj) == 0`. Define `__bool__` explicitly to override this.",
  },
  {
    id: "py-b15-classes-iter-protocol",
    language: "python",
    title: "__iter__ and __next__ iterator protocol",
    tag: "classes",
    code: `class Countdown:
    def __init__(self, start):
        self.current = start

    def __iter__(self):
        return self          # self IS the iterator

    def __next__(self):
        if self.current <= 0:
            raise StopIteration
        val = self.current
        self.current -= 1
        return val

for n in Countdown(3):
    print(n)   # 3, 2, 1

# Can also unpack
a, b, c = Countdown(3)
print(a, b, c)  # 3 2 1`,
    explanation: "An iterator implements both `__iter__` (returns `self`) and `__next__` (returns the next value or raises `StopIteration`); a `for` loop calls both automatically.",
  },
  {
    id: "py-b15-classes-context-manager",
    language: "python",
    title: "__enter__ / __exit__ context manager",
    tag: "classes",
    code: `class Timer:
    import time as _time

    def __enter__(self):
        self._start = self._time.perf_counter()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.elapsed = self._time.perf_counter() - self._start
        # return True to suppress exceptions; False to propagate
        return False

with Timer() as t:
    total = sum(range(1_000_000))

print(f"Sum: {total}, elapsed: {t.elapsed:.4f}s")`,
    explanation: "`__enter__` sets up the resource and its return value is bound by `as`; `__exit__` tears down and receives exception info (return `True` to suppress).",
  },
  {
    id: "py-b15-classes-descriptor-nondata",
    language: "python",
    title: "Non-data descriptor vs data descriptor",
    tag: "classes",
    code: `class NonData:
    """Has __get__ only — instance __dict__ shadows it."""
    def __get__(self, obj, objtype=None):
        return "non-data"

class DataDesc:
    """Has __get__ AND __set__ — takes priority over instance __dict__."""
    def __get__(self, obj, objtype=None):
        return obj.__dict__.get("_x", "data-desc")
    def __set__(self, obj, value):
        obj.__dict__["_x"] = value

class A:
    nd = NonData()
    dd = DataDesc()

a = A()
a.__dict__["nd"] = "shadow"   # instance var shadows non-data descriptor
a.dd = 42                      # goes through DataDesc.__set__
print(a.nd)    # shadow        # instance var wins
print(a.dd)    # 42            # data descriptor wins`,
    explanation: "Data descriptors (both `__get__` and `__set__`) take priority over instance `__dict__`; non-data descriptors (only `__get__`) are shadowed by instance attributes.",
  },
  {
    id: "py-b15-classes-classmethod-alt-ctor",
    language: "python",
    title: "@classmethod as alternative constructor",
    tag: "classes",
    code: `from datetime import date

class Event:
    def __init__(self, name, year, month, day):
        self.name = name
        self.date = date(year, month, day)

    @classmethod
    def from_iso(cls, name, iso_str):
        """Create from 'YYYY-MM-DD' string."""
        year, month, day = map(int, iso_str.split("-"))
        return cls(name, year, month, day)

    @classmethod
    def today(cls, name):
        d = date.today()
        return cls(name, d.year, d.month, d.day)

e = Event.from_iso("Launch", "2024-03-15")
print(e.date)   # 2024-03-15`,
    explanation: "`@classmethod` receives the class as `cls`, not an instance, allowing it to call `cls(...)` and return a properly initialized instance — the idiomatic pattern for factory constructors.",
  },
  {
    id: "py-b15-classes-abstract-property",
    language: "python",
    title: "Abstract property in ABC",
    tag: "classes",
    code: `from abc import ABC, abstractmethod

class Shape(ABC):
    @property
    @abstractmethod
    def area(self) -> float:
        ...

    @property
    @abstractmethod
    def perimeter(self) -> float:
        ...

class Circle(Shape):
    def __init__(self, r): self.r = r

    @property
    def area(self) -> float:
        import math
        return math.pi * self.r ** 2

    @property
    def perimeter(self) -> float:
        import math
        return 2 * math.pi * self.r

c = Circle(5)
print(f"{c.area:.2f}")   # 78.54`,
    explanation: "Stack `@property` on top of `@abstractmethod` (order matters) to require subclasses to provide a property with the given name rather than a plain method.",
  },
  {
    id: "py-b15-classes-property-setter",
    language: "python",
    title: "Property setter for validation",
    tag: "classes",
    code: `class Temperature:
    def __init__(self, celsius):
        self.celsius = celsius   # uses setter

    @property
    def celsius(self):
        return self._celsius

    @celsius.setter
    def celsius(self, value):
        if value < -273.15:
            raise ValueError(f"Below absolute zero: {value}")
        self._celsius = value

    @property
    def fahrenheit(self):
        return self._celsius * 9/5 + 32

t = Temperature(100)
print(t.fahrenheit)   # 212.0
# Temperature(-300)  →  ValueError`,
    explanation: "A property setter enforces invariants at assignment time; the backing attribute is conventionally named with a leading underscore to distinguish it from the public property.",
  },
  {
    id: "py-b15-classes-repr-vs-str",
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
print(repr(c))    # Color(255, 128, 0)  — unambiguous, for devs
print(str(c))     # #ff8000             — readable, for users
print(c)          # #ff8000  (print calls __str__)
print([c])        # [Color(255, 128, 0)]  (list uses __repr__)`,
    explanation: "`__repr__` should return a string that could recreate the object; `__str__` should return a human-friendly string. Collections always use `__repr__` for their contents.",
  },
  {
    id: "py-b15-classes-eq-hash",
    language: "python",
    title: "__eq__ clears __hash__ by default",
    tag: "classes",
    code: `class Point:
    def __init__(self, x, y):
        self.x, self.y = x, y

    def __eq__(self, other):
        return (self.x, self.y) == (other.x, other.y)
    # Python implicitly sets __hash__ = None now!

p = Point(1, 2)
try:
    hash(p)   # TypeError: unhashable type: 'Point'
except TypeError as e:
    print(e)

# Fix: define __hash__ consistent with __eq__
class PointH(Point):
    def __hash__(self):
        return hash((self.x, self.y))

s = {PointH(1, 2), PointH(1, 2)}
print(len(s))  # 1  — correctly deduplicated`,
    explanation: "When you define `__eq__`, Python sets `__hash__` to `None` to prevent objects from being used in sets/dicts with an inconsistent hash — you must explicitly define `__hash__` too.",
  },
  {
    id: "py-b15-classes-mro-c3",
    language: "python",
    title: "C3 linearization and method resolution order",
    tag: "classes",
    code: `class A:
    def who(self): return "A"

class B(A):
    def who(self): return "B"

class C(A):
    def who(self): return "C"

class D(B, C):  # diamond inheritance
    pass

print(D.__mro__)
# (<class 'D'>, <class 'B'>, <class 'C'>, <class 'A'>, <class 'object'>)

d = D()
print(d.who())   # B  — B comes first in MRO
# super() follows the MRO for cooperative calls`,
    explanation: "Python uses C3 linearization to compute the MRO: each class appears after all its subclasses, and the order of bases is respected — `D(B, C)` places B before C in the MRO.",
  },
  {
    id: "py-b15-classes-copy-protocol",
    language: "python",
    title: "__copy__ and __deepcopy__ protocol",
    tag: "classes",
    code: `import copy

class Config:
    def __init__(self, data):
        self.data = data
        self._cache = {}   # do NOT deep-copy the cache

    def __copy__(self):
        cls = self.__class__
        new = cls.__new__(cls)
        new.__dict__.update(self.__dict__)
        return new

    def __deepcopy__(self, memo):
        cls = self.__class__
        new = cls.__new__(cls)
        memo[id(self)] = new
        new.data  = copy.deepcopy(self.data, memo)
        new._cache = {}   # fresh cache — not copied
        return new`,
    explanation: "`__copy__` / `__deepcopy__` let you control exactly what gets copied; the `memo` dict in `__deepcopy__` prevents infinite recursion for circular references.",
  },
  {
    id: "py-b15-classes-pickle-protocol",
    language: "python",
    title: "__getstate__ / __setstate__ for pickling",
    tag: "classes",
    code: `import pickle

class Connection:
    def __init__(self, host, port):
        self.host, self.port = host, port
        self.socket = None   # can't pickle a socket!

    def __getstate__(self):
        state = self.__dict__.copy()
        del state["socket"]   # exclude unpicklable object
        return state

    def __setstate__(self, state):
        self.__dict__.update(state)
        self.socket = None    # reconnect lazily on use

c = Connection("localhost", 5432)
data = pickle.dumps(c)
c2 = pickle.loads(data)
print(c2.host, c2.port, c2.socket)  # localhost 5432 None`,
    explanation: "`__getstate__` controls what data is saved; `__setstate__` restores it — use them to exclude unpicklable objects (sockets, file handles, locks) while preserving the rest.",
  },
  {
    id: "py-b15-classes-slots-inheritance",
    language: "python",
    title: "__slots__ across an inheritance chain",
    tag: "classes",
    code: `class Base:
    __slots__ = ("x",)
    def __init__(self, x): self.x = x

class Child(Base):
    __slots__ = ("y",)   # only NEW slots here
    def __init__(self, x, y):
        super().__init__(x)
        self.y = y

c = Child(1, 2)
print(c.x, c.y)   # 1 2

# If Child omits __slots__, it gets a __dict__ via the implicit object slot
class Leaky(Base):
    pass  # no __slots__ — gets __dict__ from somewhere

l = Leaky(1)
l.extra = "yes"   # allowed because Leaky has __dict__`,
    explanation: "Each class in the hierarchy must declare `__slots__` to avoid a `__dict__`; if any class in the chain omits it, a `__dict__` is reintroduced for the subclass.",
  },
  {
    id: "py-b15-classes-metaclass-getattr",
    language: "python",
    title: "Metaclass __getattr__ for class-level attribute access",
    tag: "classes",
    code: `class PluginMeta(type):
    _registry = {}

    def __getattr__(cls, name):
        if name in cls._registry:
            return cls._registry[name]
        raise AttributeError(f"No plugin: {name!r}")

class Plugin(metaclass=PluginMeta):
    pass

Plugin._registry["my_plugin"] = lambda: "hello"

# Accessing Plugin.my_plugin calls PluginMeta.__getattr__
print(Plugin.my_plugin())  # hello`,
    explanation: "A metaclass's `__getattr__` is called when normal attribute lookup on the *class* (not an instance) fails — useful for registry-based plugin access or lazy class properties.",
  },
  {
    id: "py-b15-classes-delattr",
    language: "python",
    title: "__delattr__ to control attribute deletion",
    tag: "classes",
    code: `class Frozen:
    """An object whose attributes can be set once but not deleted."""
    def __init__(self, **kw):
        object.__setattr__(self, "_data", kw)

    def __getattr__(self, name):
        try:
            return self._data[name]
        except KeyError:
            raise AttributeError(name)

    def __delattr__(self, name):
        raise AttributeError("Attributes are permanent")

f = Frozen(x=1, y=2)
print(f.x)      # 1
try:
    del f.x     # AttributeError: Attributes are permanent
except AttributeError as e:
    print(e)`,
    explanation: "`__delattr__` is called whenever code tries to `del obj.attr`; raise an exception to make attributes permanent, or implement custom cleanup before removal.",
  },
  {
    id: "py-b15-understand-comprehension-scope",
    language: "python",
    title: "Comprehension scope isolation (trace)",
    tag: "understanding",
    code: `x = 10

# List comprehension has its own scope (Python 3)
result = [x for x in range(3)]
print(result)   # [0, 1, 2]
print(x)        # 10  — outer x unchanged!

# Compare to a plain for loop (leaks the loop variable)
for x in range(3):
    pass
print(x)        # 2  — loop var leaked into enclosing scope

# Generator expression: same isolation as comprehension
vals = (i * 2 for i in range(5))
print(i if "i" in dir() else "i not defined")  # i not defined`,
    explanation: "In Python 3 comprehensions (list, set, dict, genexpr) create their own scope and don't leak the loop variable — unlike a bare `for` loop, which always binds in the enclosing scope.",
  },
  {
    id: "py-b15-understand-global-var",
    language: "python",
    title: "global statement (trace)",
    tag: "understanding",
    code: `count = 0

def bad_increment():
    count += 1   # UnboundLocalError: count referenced before assignment

def good_increment():
    global count
    count += 1

# Without 'global', Python treats any assignment as a local variable;
# reading it before assignment in the same function raises UnboundLocalError
try:
    bad_increment()
except UnboundLocalError as e:
    print(e)

good_increment()
good_increment()
print(count)    # 2`,
    explanation: "Once Python sees an assignment to a name anywhere in a function, it treats that name as local throughout the entire function — even before the assignment line.",
  },
  {
    id: "py-b15-understand-chained-comparison",
    language: "python",
    title: "Chained comparisons (trace)",
    tag: "understanding",
    code: `x = 5

# Chained: equivalent to  1 < x  and  x < 10
print(1 < x < 10)   # True

# Each middle operand evaluated only once (important for side effects)
def val():
    print("called")
    return 5

# "called" prints only once, not twice:
print(1 < val() < 10)
# called
# True`,
    explanation: "Python chained comparisons like `a < b < c` evaluate each operand once and expand to `a < b and b < c`; the middle expression is not duplicated.",
  },
  {
    id: "py-b15-understand-none-check",
    language: "python",
    title: "if x vs if x is not None (trace)",
    tag: "understanding",
    code: `def process(value=None):
    # WRONG: treats 0, [], "", False as "not provided"
    if value:
        print(f"value: {value}")
    else:
        print("no value")

process(0)     # no value  ← wrong! 0 was provided
process([])    # no value  ← wrong! empty list was provided

def process2(value=None):
    # CORRECT: only treats None as "not provided"
    if value is not None:
        print(f"value: {value}")
    else:
        print("no value")

process2(0)    # value: 0
process2([])   # value: []`,
    explanation: "`if x` tests truthiness — zero, empty containers, and `None` all fail it. Use `if x is not None` as the sentinel check when any non-None value should be accepted.",
  },
  {
    id: "py-b15-caveat-scope-comprehension-walrus",
    language: "python",
    title: "Walrus in comprehension leaks to enclosing scope",
    tag: "caveats",
    code: `# Normal comprehension variable stays local
result = [y for y in range(5)]
# print(y)  →  NameError  (in Python 3)

# Walrus operator := leaks OUT of the comprehension
result2 = [last := x for x in range(5)]
print(last)    # 4  — last leaked into enclosing scope!

# This is intentional: walrus is designed to expose a result
found = None
if any((found := x) > 3 for x in range(10)):
    print(f"first > 3: {found}")   # first > 3: 4`,
    explanation: "Unlike regular comprehension loop variables, values bound by `:=` (walrus) escape into the enclosing scope — a deliberate design choice for streaming `any()`/`all()` patterns.",
  },
  {
    id: "py-b15-caveat-exception-context",
    language: "python",
    title: "Exception chaining: __cause__ vs __context__",
    tag: "caveats",
    code: `# Implicit chaining: __context__ (from X) raises inside except
try:
    try:
        1/0
    except ZeroDivisionError:
        raise ValueError("bad input")  # __context__ = ZeroDivisionError
except ValueError as e:
    print(e.__context__)   # division by zero

# Explicit chaining: raise ... from ... sets __cause__
try:
    try:
        int("abc")
    except ValueError as orig:
        raise RuntimeError("parse failed") from orig
except RuntimeError as e:
    print(e.__cause__)     # invalid literal for int()...`,
    explanation: "`raise X from Y` sets `__cause__` (explicit chain, shown with \"The above exception was the direct cause\"); raising inside an `except` block sets `__context__` implicitly.",
  },
  {
    id: "py-b15-structures-deque-rotate",
    language: "python",
    title: "deque.rotate() for cyclic structures",
    tag: "structures",
    code: `from collections import deque

# Simulate a round-robin scheduler
tasks = deque(["task_A", "task_B", "task_C", "task_D"])

# rotate(1): move last to front (next element becomes active)
tasks.rotate(1)
print(tasks[0])   # task_D  — now at front

# rotate(-1): move first to back
tasks.rotate(-1)
print(list(tasks))  # ['task_D', 'task_A', 'task_B', 'task_C']

# Rotate by N > 1: effectively a cyclic shift
tasks.rotate(2)
print(list(tasks))  # ['task_B', 'task_C', 'task_D', 'task_A']`,
    explanation: "`deque.rotate(n)` moves `n` elements from the right to the left (positive) or left to the right (negative) in O(n) time — useful for implementing ring buffers and round-robin iteration.",
  },
  {
    id: "py-b15-caveat-print-flush",
    language: "python",
    title: "print(flush=True) for unbuffered output",
    tag: "caveats",
    code: `import time, sys

# Without flush, output may appear late in a piped/redirected context
for i in range(3):
    print(f"step {i}", flush=True)   # force flush after each line
    time.sleep(0.1)

# Alternatively, change buffering globally:
# python -u script.py   (unbuffered mode)
# or: sys.stdout = open(sys.stdout.fileno(), 'w', buffering=1)

# Check current buffering mode
print(sys.stdout.line_buffering)   # True in terminal, False in pipe`,
    explanation: "`flush=True` tells Python to immediately flush the output buffer after printing — critical for progress indicators in piped commands or when output needs to appear in real time.",
  },
  {
    id: "py-b15-types-tuple-fixed-length",
    language: "python",
    title: "Tuple type hints: fixed vs variable length",
    tag: "types",
    code: `from typing import Tuple  # old style
# or use built-in tuple (3.9+)

# Fixed-length: exact types for each position
point: tuple[int, int] = (3, 4)
rgb:   tuple[int, int, int] = (255, 128, 0)

# Variable-length: all same type, any count
coords: tuple[float, ...] = (1.0, 2.5, 3.7, 4.2)

# Empty tuple
nothing: tuple[()] = ()

def swap(pair: tuple[int, str]) -> tuple[str, int]:
    return pair[1], pair[0]

print(swap((42, "hello")))   # ('hello', 42)`,
    explanation: "`tuple[T, U, V]` fixes the arity and per-position types; `tuple[T, ...]` allows any number of `T` elements — the two syntaxes serve distinct purposes.",
  },
  {
    id: "py-b15-families-open-modes",
    language: "python",
    title: "open() mode strings",
    tag: "families",
    code: `# Text modes
with open("f.txt", "r")  as f: pass   # read (default)
with open("f.txt", "w")  as f: pass   # write (truncate)
with open("f.txt", "a")  as f: pass   # append
with open("f.txt", "r+") as f: pass   # read+write (no truncate)
with open("f.txt", "x")  as f: pass   # exclusive create (fails if exists)

# Binary modes (add 'b')
with open("f.bin", "rb") as f: pass   # binary read
with open("f.bin", "wb") as f: pass   # binary write

# Text mode decodes bytes using locale.getpreferredencoding() by default
# Always pass encoding= explicitly for portability
with open("f.txt", "r", encoding="utf-8") as f:
    content = f.read()`,
    explanation: "The mode string controls read/write/append, text vs binary, and creation behaviour; always specify `encoding='utf-8'` in text mode to avoid locale-dependent surprises.",
  },
  {
    id: "py-b15-families-slots-dict-tradeoff",
    language: "python",
    title: "__slots__ vs __dict__: memory and flexibility",
    tag: "families",
    code: `import sys

class WithDict:
    def __init__(self, x, y): self.x, self.y = x, y

class WithSlots:
    __slots__ = ("x", "y")
    def __init__(self, x, y): self.x, self.y = x, y

a = WithDict(1, 2)
b = WithSlots(1, 2)

# Memory footprint
print(sys.getsizeof(a))             # ~48 bytes (+ dict overhead)
print(sys.getsizeof(a.__dict__))    # ~232 bytes for empty dict
print(sys.getsizeof(b))             # ~56 bytes (no dict)

# Flexibility
a.z = 3          # fine — dict is open
# b.z = 3        # AttributeError — slots are closed`,
    explanation: "`__slots__` replaces the per-instance `__dict__` with fixed C-level slots, saving ~200+ bytes per instance — critical when creating millions of small objects.",
  },
  {
    id: "py-b15-caveat-class-var-share",
    language: "python",
    title: "Shared class variable gotcha",
    tag: "caveats",
    code: `class Config:
    settings = {}    # shared across ALL instances!

c1 = Config()
c2 = Config()

c1.settings["debug"] = True   # mutates the CLASS variable
print(c2.settings)             # {'debug': True}  — shared!

# Fix: initialize per-instance in __init__
class Config2:
    def __init__(self):
        self.settings = {}   # each instance gets its own dict

c3 = Config2()
c4 = Config2()
c3.settings["debug"] = True
print(c4.settings)             # {}  — independent`,
    explanation: "Mutable class variables (dicts, lists) are shared across all instances; mutations through any instance affect all. Move mutable defaults to `__init__` to get per-instance state.",
  },
  {
    id: "py-b15-types-none-type",
    language: "python",
    title: "type(None) and NoneType",
    tag: "types",
    code: `print(type(None))           # <class 'NoneType'>
print(type(None).__name__)  # NoneType

# NoneType is not directly accessible — get it via type()
NoneType = type(None)
print(isinstance(None, NoneType))   # True

# In type hints, use None directly (not NoneType)
def greet(name: str | None = None) -> None:
    if name is None:
        print("Hello, World!")
    else:
        print(f"Hello, {name}!")

# None is a singleton — always use 'is' for comparison
print(None is None)    # True
print(None == None)    # True (but is is preferred)`,
    explanation: "`None` is the sole instance of `NoneType`; in type hints write `None` directly (not `NoneType`), and always compare with `is` rather than `==`.",
  },
  {
    id: "py-b15-types-forward-ref",
    language: "python",
    title: "Forward references in type hints",
    tag: "types",
    code: `from __future__ import annotations  # makes all hints lazy strings

class Node:
    def __init__(self, val: int, nxt: Node | None = None):
        self.val = val
        self.next = nxt

    def append(self, val: int) -> Node:
        self.next = Node(val)
        return self.next

# Without 'from __future__ import annotations', the class name
# is not yet defined when the annotation is parsed — use a string:
# def foo(x: "Node") -> "Node": ...

head = Node(1)
head.append(2).append(3)
print(head.val, head.next.val)  # 1 2`,
    explanation: "`from __future__ import annotations` (PEP 563) makes all annotations strings evaluated lazily, resolving forward reference `NameError`s without wrapping names in quotes manually.",
  },
  {
    id: "py-b15-understand-augassign-in-loop",
    language: "python",
    title: "Augmented assignment on loop variable (trace)",
    tag: "understanding",
    code: `# Comprehension variables are local; what about += in loops?
total = 0
for i in [1, 2, 3]:
    total += i    # fine: total is in enclosing scope, no ambiguity

print(total)   # 6

# Inside a nested function, += would be an UnboundLocalError
def bad():
    for i in [1, 2, 3]:
        total += i  # UnboundLocalError: total is local to bad()

# Fix with nonlocal or passing total as arg
def good():
    t = 0
    for i in [1, 2, 3]:
        t += i
    return t`,
    explanation: "A simple loop does not create a new scope in Python; `for` loop variables and any augmented assignments in the loop body bind in the enclosing function (or module) scope.",
  },
  {
    id: "py-b15-snippet-zip-strict",
    language: "python",
    title: "zip(..., strict=True) detects length mismatch",
    tag: "snippet",
    code: `names  = ["Alice", "Bob", "Carol"]
scores = [90, 85, 92]

# strict=False (default): stops at shortest, silently drops extras
for n, s in zip(names, scores):
    print(n, s)

# strict=True (Python 3.10+): raises if lengths differ
names_bad = ["Alice", "Bob"]
try:
    list(zip(names, names_bad, strict=True))
except ValueError as e:
    print(e)   # zip() has arguments with different lengths`,
    explanation: "`strict=True` makes `zip` raise `ValueError` if the iterables have different lengths — catching accidental data mismatches that would silently truncate with default `zip`.",
  },
  {
    id: "py-b15-snippet-dict-pipe-merge",
    language: "python",
    title: "Dict merge with | operator (Python 3.9+)",
    tag: "snippet",
    code: `defaults = {"color": "red", "width": 10, "style": "solid"}
custom   = {"color": "blue", "opacity": 0.8}

# | creates a new merged dict; right side wins on conflicts
merged = defaults | custom
print(merged)
# {'color': 'blue', 'width': 10, 'style': 'solid', 'opacity': 0.8}

# |= merges in-place
defaults |= custom
print(defaults["color"])   # blue

# Old equivalent: {**defaults, **custom}`,
    explanation: "The `|` operator merges two dicts into a new one (right operand wins); `|=` updates in-place — cleaner than `{**a, **b}` and introduced in Python 3.9.",
  },
  {
    id: "py-b15-snippet-enumerate-start",
    language: "python",
    title: "enumerate() with a start offset",
    tag: "snippet",
    code: `items = ["apple", "banana", "cherry"]

# Default: starts at 0
for i, item in enumerate(items):
    print(i, item)   # 0 apple / 1 banana / 2 cherry

# start=1: human-friendly numbering
print("\nMenu:")
for i, item in enumerate(items, start=1):
    print(f"  {i}. {item}")
# 1. apple
# 2. banana
# 3. cherry`,
    explanation: "`enumerate(iterable, start=N)` lets you pick the initial counter value — start=1 for 1-indexed display, or any offset to continue a running sequence.",
  },
  {
    id: "py-b15-snippet-tuple-unpack-func",
    language: "python",
    title: "* unpacking in function calls",
    tag: "snippet",
    code: `def add(a, b, c):
    return a + b + c

args = (1, 2, 3)
print(add(*args))   # 6

# ** unpacking for keyword args
def greet(name, greeting="Hello"):
    return f"{greeting}, {name}!"

kw = {"name": "Alice", "greeting": "Hi"}
print(greet(**kw))   # Hi, Alice!

# Mix positional and keyword
print(add(*[10], b=20, c=30))   # 60`,
    explanation: "`*iterable` unpacks positional arguments; `**mapping` unpacks keyword arguments — both can be mixed in the same call and combined with literal arguments.",
  },
  {
    id: "py-b15-snippet-conditional-import",
    language: "python",
    title: "Conditional / fallback import",
    tag: "snippet",
    code: `# Use a faster C extension if available, fall back to pure Python
try:
    from functools import cache        # Python 3.9+
except ImportError:
    from functools import lru_cache as cache

# TYPE_CHECKING guard: import only for type checkers, not at runtime
from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from collections.abc import Sequence

def process(items):   # 'Sequence' used only in annotation string
    return list(items)`,
    explanation: "Try/except imports provide version-safe fallbacks; the `TYPE_CHECKING` guard imports expensive or circular modules only during static analysis, not at runtime.",
  },
  {
    id: "py-b15-snippet-unpacking-nested",
    language: "python",
    title: "Nested sequence unpacking",
    tag: "snippet",
    code: `matrix = [(1, 2, 3), (4, 5, 6), (7, 8, 9)]

# Unpack each row
for a, b, c in matrix:
    print(a, b, c)

# Nested unpacking
((x1, y1), (x2, y2)) = ((0, 0), (5, 3))
print(x1, y1, x2, y2)   # 0 0 5 3

# Star in nested context
first, *middle, last = range(10)
_, (a, b), *rest = [0, (1, 2), 3, 4, 5]
print(a, b, rest)   # 1 2 [3, 4, 5]`,
    explanation: "Python's unpacking syntax mirrors the structure of the data; star (`*`) collects any number of elements into a list and can appear once on the left-hand side.",
  },
  {
    id: "py-b15-snippet-walrus-while",
    language: "python",
    title: "Walrus operator in while loops",
    tag: "snippet",
    code: `import io

data = io.BytesIO(b"hello world! this is a test buffer.")

# Classic read-in-chunks idiom without walrus
chunk = data.read(4)
while chunk:
    print(chunk)
    chunk = data.read(4)

data.seek(0)

# Walrus form: condition and assignment in one line
while chunk := data.read(4):
    print(chunk)`,
    explanation: "The walrus operator `:=` assigns and tests in one expression, eliminating the read-then-test-then-re-read pattern common in stream processing and REPL loops.",
  },
  {
    id: "py-b15-families-copy-deepcopy",
    language: "python",
    title: "copy.copy vs copy.deepcopy",
    tag: "families",
    code: `import copy

original = {"a": [1, 2, 3], "b": {"nested": True}}

shallow = copy.copy(original)
deep    = copy.deepcopy(original)

# shallow: top-level is independent, but inner objects are shared
shallow["a"].append(99)
print(original["a"])     # [1, 2, 99]  — shared!

# deep: everything is independent
deep["b"]["nested"] = False
print(original["b"])     # {'nested': True}  — unaffected

# copy() on a list: same as list.copy() or lst[:]
lst_copy = copy.copy([1, [2, 3]])`,
    explanation: "`copy.copy` duplicates the container but keeps references to inner objects; `copy.deepcopy` recursively copies all nested objects — use deep copy when you need full independence.",
  },
  {
    id: "py-b15-understand-lambda-scope",
    language: "python",
    title: "Lambda captures variables by reference (trace)",
    tag: "understanding",
    code: `# Classic gotcha: lambdas in a loop share the same 'i'
fns = [lambda: i for i in range(4)]
print([f() for f in fns])   # [3, 3, 3, 3]  — all capture the same i

# Fix 1: default argument to freeze the value
fns2 = [lambda i=i: i for i in range(4)]
print([f() for f in fns2])  # [0, 1, 2, 3]

# Fix 2: functools.partial
from functools import partial
def val(n): return n
fns3 = [partial(val, i) for i in range(4)]
print([f() for f in fns3])  # [0, 1, 2, 3]`,
    explanation: "Lambdas close over the *variable*, not the value — all lambdas in the loop reference the same `i`. Use a default argument or `partial` to bind the value at creation time.",
  },
  {
    id: "py-b15-snippet-string-ljust-rjust",
    language: "python",
    title: "str.ljust, rjust, center for padding",
    tag: "snippet",
    code: `header = "Name"
print(header.ljust(12))           # 'Name        '
print(header.rjust(12))           # '        Name'
print(header.center(12))          # '    Name    '
print(header.center(12, "-"))     # '----Name----'

# zfill: pad with zeros on the left
n = "42"
print(n.zfill(6))                 # 000042

# Equivalent f-string format specs:
print(f"{'Name':<12}")            # left
print(f"{'Name':>12}")            # right
print(f"{'Name':^12}")            # center`,
    explanation: "`ljust`, `rjust`, and `center` pad strings with spaces (or a custom fill character); `zfill` zero-pads numbers. All are equivalent to f-string format specs but occasionally more readable.",
  },
  {
    id: "py-b15-snippet-itertools-pairwise",
    language: "python",
    title: "itertools.pairwise for sliding window of 2",
    tag: "snippet",
    code: `from itertools import pairwise   # Python 3.10+

data = [1, 5, 2, 8, 3]

# Consecutive pairs
for a, b in pairwise(data):
    print(a, "->", b)
# 1 -> 5 / 5 -> 2 / 2 -> 8 / 8 -> 3

# Compute differences between consecutive elements
diffs = [b - a for a, b in pairwise(data)]
print(diffs)   # [4, -3, 6, -5]

# Pre-3.10 equivalent:
def pairwise_compat(it):
    a, b = iter(it), iter(it)
    next(b, None)
    yield from zip(a, b)`,
    explanation: "`itertools.pairwise(iterable)` yields overlapping pairs `(s[0],s[1]), (s[1],s[2]), ...` — the simplest way to compute consecutive differences or detect adjacent duplicates.",
  },
  {
    id: "py-b15-snippet-dict-fromkeys",
    language: "python",
    title: "dict.fromkeys() for initializing with a default",
    tag: "snippet",
    code: `keys = ["a", "b", "c", "d"]

# All keys start at 0
counts = dict.fromkeys(keys, 0)
print(counts)   # {'a': 0, 'b': 0, 'c': 0, 'd': 0}

# Default is None if no value given
empty = dict.fromkeys(keys)
print(empty)    # {'a': None, 'b': None, ...}

# Warning: mutable default is SHARED (not per-key)
bad = dict.fromkeys(keys, [])
bad["a"].append(1)
print(bad["b"])   # [1]  — all keys share the same list!

# Fix: use dict comprehension for mutable values
good = {k: [] for k in keys}`,
    explanation: "`dict.fromkeys(iterable, value)` is the fastest way to pre-populate a dict with a uniform value — but pass only immutable defaults, or use a comprehension to get independent mutable values.",
  },
  {
    id: "py-b15-structures-enum-strenum",
    language: "python",
    title: "StrEnum — string values and str behavior",
    tag: "structures",
    code: `from enum import StrEnum   # Python 3.11+

class Status(StrEnum):
    PENDING  = "pending"
    ACTIVE   = "active"
    ARCHIVED = "archived"

s = Status.ACTIVE

# Acts like a string directly (no .value needed)
print(s.upper())           # ACTIVE
print(f"Status: {s}")      # Status: active
print(s == "active")       # True  — str comparison

# Still has enum features
print(list(Status))        # [<Status.PENDING: 'pending'>, ...]
print(Status("archived"))  # Status.ARCHIVED  — lookup by value`,
    explanation: "`StrEnum` members are both `Enum` instances and `str` instances, so they can be passed anywhere a plain string is expected without calling `.value`.",
  },
  {
    id: "py-b15-caveat-int-cache",
    language: "python",
    title: "CPython integer cache range (−5 to 256)",
    tag: "caveats",
    code: `# Cached range: same object is reused
a, b = 100, 100
print(a is b)     # True  — same cached object

# Outside cache range: new objects
x = 1000
y = 1000
print(x is y)     # False (in most contexts)

# Within a single code object, compiler may deduplicate literals
def check():
    p = 1000
    q = 1000
    return p is q

print(check())   # True (compiler constant folding in CPython)
# But don't rely on this! Always use == for value comparison.`,
    explanation: "CPython caches integers from −5 to 256 and may fold repeated literals in a single code object, making `is` accidentally work — never use `is` for integer value comparison.",
  },
  {
    id: "py-b15-types-protocol-callable",
    language: "python",
    title: "Callable type hints and Protocol",
    tag: "types",
    code: `from typing import Callable, Protocol

# Simple callable annotation
def apply(fn: Callable[[int], str], x: int) -> str:
    return fn(x)

print(apply(str, 42))   # '42'

# Protocol for callables with extra attributes
class Transformer(Protocol):
    __name__: str
    def __call__(self, x: int) -> str: ...

def describe(t: Transformer) -> str:
    return f"{t.__name__} transforms int to str"

# Any callable with a __name__ attribute satisfies the protocol
print(describe(str))   # str transforms int to str`,
    explanation: "`Callable[[ArgTypes], ReturnType]` annotates simple callables; a `Protocol` with `__call__` lets you describe callables that also carry extra attributes like `__name__` or metadata.",
  },
  {
    id: "py-b15-snippet-contextmanager-suppress",
    language: "python",
    title: "contextlib.suppress as a one-liner try/except",
    tag: "snippet",
    code: `from contextlib import suppress
import os

# Classic verbose form
try:
    os.remove("nonexistent.txt")
except FileNotFoundError:
    pass

# Concise form
with suppress(FileNotFoundError):
    os.remove("nonexistent.txt")

# Suppress multiple exception types
with suppress(FileNotFoundError, PermissionError):
    os.remove("/root/protected.txt")`,
    explanation: "`contextlib.suppress(*exceptions)` is the idiomatic replacement for a `try/except: pass` block when you explicitly want to ignore specific exceptions.",
  },
  {
    id: "py-b15-snippet-match-sequence",
    language: "python",
    title: "match / case with sequence patterns",
    tag: "snippet",
    code: `def describe_point(point):
    match point:
        case (0, 0):
            return "origin"
        case (x, 0):
            return f"on x-axis at {x}"
        case (0, y):
            return f"on y-axis at {y}"
        case (x, y):
            return f"point at ({x}, {y})"
        case _:
            return "not a 2D point"

print(describe_point((0, 0)))     # origin
print(describe_point((3, 0)))     # on x-axis at 3
print(describe_point((2, 5)))     # point at (2, 5)`,
    explanation: "Sequence patterns in `match/case` destructure tuples/lists; captured names (`x`, `y`) are bound within the matching case block — much cleaner than chains of `if isinstance` checks.",
  },
  {
    id: "py-b15-snippet-functools-reduce",
    language: "python",
    title: "functools.reduce for left-fold",
    tag: "snippet",
    code: `from functools import reduce
import operator

nums = [1, 2, 3, 4, 5]

# Sum via reduce (illustrative — use sum() in practice)
total = reduce(operator.add, nums)
print(total)   # 15

# Product (no built-in, reduce is appropriate)
product = reduce(operator.mul, nums)
print(product) # 120

# With initial value
product2 = reduce(operator.mul, nums, 1)

# Compose functions
def compose(*fns):
    return reduce(lambda f, g: lambda x: g(f(x)), fns)

double_then_str = compose(lambda x: x * 2, str)
print(double_then_str(5))   # '10'`,
    explanation: "`functools.reduce(fn, iterable, initial)` applies `fn` cumulatively left-to-right; the `initial` prevents `TypeError` on empty iterables and serves as the fold identity.",
  },
  {
    id: "py-b15-snippet-heapq-nlargest",
    language: "python",
    title: "heapq.nlargest / nsmallest",
    tag: "snippet",
    code: `import heapq

scores = [45, 92, 67, 88, 23, 100, 55, 71]

top3    = heapq.nlargest(3, scores)
bottom3 = heapq.nsmallest(3, scores)
print(top3)    # [100, 92, 88]
print(bottom3) # [23, 45, 55]

# With a key function
records = [{"name": "Alice", "score": 95},
           {"name": "Bob",   "score": 78},
           {"name": "Carol", "score": 88}]
top2 = heapq.nlargest(2, records, key=lambda r: r["score"])
print([r["name"] for r in top2])   # ['Alice', 'Carol']`,
    explanation: "`heapq.nlargest(n, iterable)` and `nsmallest` use a heap internally; they're O(k log n) and more efficient than fully sorting the sequence when k is small.",
  },
  {
    id: "py-b15-snippet-bisect-insort",
    language: "python",
    title: "bisect.insort for maintaining sorted order",
    tag: "snippet",
    code: `import bisect

scores = [10, 20, 30, 40, 50]

bisect.insort(scores, 25)
print(scores)   # [10, 20, 25, 30, 40, 50]

bisect.insort(scores, 25)   # duplicates allowed; goes to right side
print(scores)   # [10, 20, 25, 25, 30, 40, 50]

# bisect_left / bisect_right give insertion points without inserting
pos = bisect.bisect_left(scores, 30)
print(pos)      # 4  — first position where 30 could be inserted`,
    explanation: "`bisect.insort` maintains a sorted list by finding the correct position via binary search (O(log n)) and inserting (O(n) shift) — best for small or rarely-modified sorted lists.",
  },
  {
    id: "py-b15-classes-abstract-not-instantiable",
    language: "python",
    title: "ABC prevents direct instantiation",
    tag: "classes",
    code: `from abc import ABC, abstractmethod

class Vehicle(ABC):
    @abstractmethod
    def max_speed(self) -> float: ...

    @abstractmethod
    def fuel_type(self) -> str: ...

    def describe(self):
        return f"{self.fuel_type()}, {self.max_speed()} km/h"

# Trying to instantiate ABC raises TypeError
try:
    v = Vehicle()
except TypeError as e:
    print(e)   # Can't instantiate abstract class Vehicle

class Car(Vehicle):
    def max_speed(self): return 200.0
    def fuel_type(self):  return "gasoline"

print(Car().describe())  # gasoline, 200.0 km/h`,
    explanation: "A class with any unimplemented `@abstractmethod` cannot be instantiated — Python raises `TypeError` listing which methods are missing, enforcing the contract at object creation time.",
  },
  {
    id: "py-b15-snippet-string-translate",
    language: "python",
    title: "str.translate for bulk character replacement",
    tag: "snippet",
    code: `text = "héllo wörld! it's 2024."

# Build a translation table: char -> replacement (or None to delete)
table = str.maketrans(
    "héö",          # from
    "heo",          # to (must be same length)
    "!.'",          # delete these characters
)

print(text.translate(table))   # hello world its 2024

# Remove digits
no_digits = str.maketrans("", "", "0123456789")
print("abc123".translate(no_digits))   # abc`,
    explanation: "`str.translate` with a table built by `str.maketrans` replaces or deletes multiple characters in a single O(n) pass — faster than chained `.replace()` calls.",
  },
  {
    id: "py-b15-snippet-math-isclose",
    language: "python",
    title: "math.isclose for floating-point comparison",
    tag: "snippet",
    code: `import math

a = 0.1 + 0.2
b = 0.3

print(a == b)                               # False
print(math.isclose(a, b))                  # True (default: rel_tol=1e-09)
print(math.isclose(a, b, rel_tol=1e-9))   # True

# abs_tol: use when values might be near zero
print(math.isclose(1e-10, 0.0))           # False (relative diff is huge)
print(math.isclose(1e-10, 0.0,
      rel_tol=1e-9, abs_tol=1e-9))         # True`,
    explanation: "`math.isclose` uses both a relative tolerance (`rel_tol`) and an absolute tolerance (`abs_tol`); `rel_tol` works for normal-sized values but breaks down near zero, where `abs_tol` is needed.",
  },
];
