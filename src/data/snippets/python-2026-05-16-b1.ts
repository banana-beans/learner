import type { Snippet } from "./types";

export const pythonSnippets20260516B1: Snippet[] = [
  {
    id: "py-b16-b1-list-comp-filter",
    language: "python",
    title: "List comprehension with filter",
    tag: "snippet",
    code: `numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

# Keep only even numbers, squared
evens_squared = [x ** 2 for x in numbers if x % 2 == 0]
print(evens_squared)  # [4, 16, 36, 64, 100]

# Filter strings by length
words = ["hi", "hello", "hey", "howdy", "yo"]
long_words = [w.upper() for w in words if len(w) > 3]
print(long_words)  # ['HELLO', 'HOWDY']`,
    explanation: "List comprehensions with an `if` clause are the Pythonic replacement for `filter()` + `map()` — they read left-to-right like English and avoid a lambda.",
  },
  {
    id: "py-b16-b1-value-type-int",
    language: "python",
    title: "int has arbitrary precision",
    tag: "types",
    code: `import sys

small = 42
big = 2 ** 100
huge = 10 ** 300

print(big)    # 1267650600228229401496703205376
print(huge)   # a 300-digit number — no overflow
print(type(huge))  # <class 'int'>

# Size grows with the value
print(sys.getsizeof(0))    # 24 bytes
print(sys.getsizeof(2**63))  # 36 bytes`,
    explanation: "Python's `int` is arbitrary-precision — it never overflows, unlike C or Java's fixed-width integers. The trade-off is that large integers consume proportionally more memory and are slower than machine-word arithmetic.",
  },
  {
    id: "py-b16-b1-late-binding-closure",
    language: "python",
    title: "Late binding in closures over loop vars",
    tag: "understanding",
    code: `# Common trap: all closures share the same 'i'
funcs = [lambda: i for i in range(5)]
print([f() for f in funcs])  # [4, 4, 4, 4, 4]

# Fix: capture the value at definition time with a default arg
funcs2 = [lambda i=i: i for i in range(5)]
print([f() for f in funcs2])  # [0, 1, 2, 3, 4]

# Alternative fix: use functools.partial
from functools import partial
def ret(x): return x
funcs3 = [partial(ret, i) for i in range(5)]
print([f() for f in funcs3])  # [0, 1, 2, 3, 4]`,
    explanation: "Python closures capture variables by reference, not by value — at call time, `i` holds whatever value it has in the enclosing scope, which after the loop is the last value. The `default-argument` trick forces early binding.",
  },
  {
    id: "py-b16-b1-dict-comp-invert",
    language: "python",
    title: "Dict comprehension to invert k/v",
    tag: "snippet",
    code: `# Original mapping: name -> score
scores = {"alice": 95, "bob": 87, "carol": 92}

# Invert: score -> name
inverted = {v: k for k, v in scores.items()}
print(inverted)  # {95: 'alice', 87: 'bob', 92: 'carol'}

# When values may not be unique, last one wins
roles = {"alice": "admin", "bob": "user", "carol": "user"}
by_role = {v: k for k, v in roles.items()}
print(by_role)  # {'admin': 'alice', 'user': 'carol'}`,
    explanation: "Dict comprehensions with `.items()` make inversion a one-liner; if values aren't unique, later entries silently overwrite earlier ones, so verify uniqueness first if order matters.",
  },
  {
    id: "py-b16-b1-deque-rotate",
    language: "python",
    title: "deque.rotate for circular buffers",
    tag: "structures",
    code: `from collections import deque

d = deque([1, 2, 3, 4, 5])

d.rotate(2)      # shift right by 2
print(d)         # deque([4, 5, 1, 2, 3])

d.rotate(-3)     # shift left by 3
print(d)         # deque([2, 3, 4, 5, 1])

# Practical: round-robin scheduler
tasks = deque(["task_a", "task_b", "task_c"])
for _ in range(6):
    print(f"Running {tasks[0]}")
    tasks.rotate(-1)`,
    explanation: "`deque.rotate(n)` moves elements from one end to the other in O(n) time; negative values rotate left, positive rotate right — perfect for round-robin scheduling without index math.",
  },
  {
    id: "py-b16-b1-mutable-default-arg",
    language: "python",
    title: "Mutable default argument caveat",
    tag: "caveats",
    code: `# The list is created ONCE at function definition time
def append_to(item, lst=[]):
    lst.append(item)
    return lst

print(append_to(1))  # [1]
print(append_to(2))  # [2, 2] — oops! same list reused
print(append_to(3))  # [1, 2, 3]

# Fix: use None as sentinel
def append_to_fixed(item, lst=None):
    if lst is None:
        lst = []
    lst.append(item)
    return lst`,
    explanation: "Default arguments are evaluated once when the `def` statement runs, not on each call — mutable defaults (list, dict, set) accumulate state across calls, which is almost never what you want.",
  },
  {
    id: "py-b16-b1-counter-most-common",
    language: "python",
    title: "Counter.most_common for frequency tables",
    tag: "structures",
    code: `from collections import Counter

text = "mississippi"
freq = Counter(text)
print(freq)  # Counter({'i': 4, 's': 4, 'p': 2, 'm': 1})

# Top 3 most common characters
print(freq.most_common(3))
# [('i', 4), ('s', 4), ('p', 2)]

# Count words in a sentence
words = "the cat sat on the mat the cat".split()
wc = Counter(words)
print(wc.most_common(2))  # [('the', 3), ('cat', 2)]`,
    explanation: "`Counter.most_common(n)` returns the n most frequent elements in descending order in O(n log k) time — it's a frequency table and min-heap in one step.",
  },
  {
    id: "py-b16-b1-nested-list-flatten",
    language: "python",
    title: "Flatten a nested list with itertools.chain",
    tag: "snippet",
    code: `import itertools

nested = [[1, 2, 3], [4, 5], [6, 7, 8, 9]]

# chain.from_iterable unpacks one level
flat = list(itertools.chain.from_iterable(nested))
print(flat)  # [1, 2, 3, 4, 5, 6, 7, 8, 9]

# Equivalent list comp (clearer for simple cases)
flat2 = [x for sub in nested for x in sub]
print(flat2)  # [1, 2, 3, 4, 5, 6, 7, 8, 9]

# chain.from_iterable is lazy — wraps arbitrary iterables
print(list(itertools.chain.from_iterable("abc def".split())))`,
    explanation: "`itertools.chain.from_iterable` lazily flattens one level of nesting without building intermediate lists; for deeply nested structures you'd need recursion or a stack-based approach.",
  },
  {
    id: "py-b16-b1-integer-caching",
    language: "python",
    title: "Integer caching (-5 to 256)",
    tag: "understanding",
    code: `# CPython caches small integers — same object reused
a = 256
b = 256
print(a is b)   # True — same cached object

a = 257
b = 257
print(a is b)   # False — two different objects

# Same with negative numbers
x = -5
y = -5
print(x is y)   # True

x = -6
y = -6
print(x is y)   # False (CPython-specific behavior)`,
    explanation: "CPython pre-allocates integers in the range -5 to 256 as singletons for performance; outside that range, each integer literal creates a new object, so `is` identity checks can surprise you — always use `==` for value comparison.",
  },
  {
    id: "py-b16-b1-complex-numbers",
    language: "python",
    title: "Complex numbers as a built-in type",
    tag: "types",
    code: `z1 = 3 + 4j
z2 = complex(1, -2)

print(z1.real, z1.imag)   # 3.0 4.0
print(abs(z1))             # 5.0  (magnitude: sqrt(9+16))
print(z1 * z2)             # (11+2j)
print(z1.conjugate())      # (3-4j)

import cmath
print(cmath.phase(z1))     # 0.9272952180016122 radians
print(cmath.polar(z1))     # (5.0, 0.9272...)`,
    explanation: "Python has `complex` as a first-class numeric type using `j` notation; the `cmath` module mirrors `math` but operates in the complex plane, making signal processing and physics calculations natural.",
  },
  {
    id: "py-b16-b1-star-unpack",
    language: "python",
    title: "Star unpacking for head/tail/middle",
    tag: "snippet",
    code: `first, *rest = [10, 20, 30, 40, 50]
print(first)  # 10
print(rest)   # [20, 30, 40, 50]

*init, last = [10, 20, 30, 40, 50]
print(init)   # [10, 20, 30, 40]
print(last)   # 50

head, *middle, tail = [10, 20, 30, 40, 50]
print(head, middle, tail)  # 10 [20, 30, 40] 50

# Works with any iterable
a, b, *_ = range(100)  # discard the rest
print(a, b)  # 0 1`,
    explanation: "The `*` star in assignment unpacking collects any number of items into a list — it can appear in any position, making it easy to destructure sequences without slicing.",
  },
  {
    id: "py-b16-b1-defaultdict-grouping",
    language: "python",
    title: "defaultdict(list) for grouping",
    tag: "structures",
    code: `from collections import defaultdict

data = [
    ("fruit", "apple"),
    ("veggie", "carrot"),
    ("fruit", "banana"),
    ("veggie", "spinach"),
    ("fruit", "cherry"),
]

groups = defaultdict(list)
for category, item in data:
    groups[category].append(item)

print(dict(groups))
# {'fruit': ['apple', 'banana', 'cherry'],
#  'veggie': ['carrot', 'spinach']}`,
    explanation: "`defaultdict(list)` auto-creates an empty list on first access, removing the need for `setdefault` or an `if key not in d` guard when building group-by maps.",
  },
  {
    id: "py-b16-b1-list-vs-tuple",
    language: "python",
    title: "list vs tuple: mutability and hashability",
    tag: "families",
    code: `# list: mutable, not hashable
my_list = [1, 2, 3]
my_list.append(4)

try:
    {my_list: "value"}  # TypeError
except TypeError as e:
    print(e)  # unhashable type: 'list'

# tuple: immutable, hashable (if contents are)
my_tuple = (1, 2, 3)
d = {my_tuple: "value"}  # works fine

# Tuple of mutable items is NOT hashable
bad = ([1, 2], [3, 4])
try:
    hash(bad)
except TypeError as e:
    print(e)  # unhashable type: 'list'`,
    explanation: "Tuples are hashable only when all their elements are hashable — the immutability of the container doesn't override the mutability of its contents, so a tuple containing a list still can't be used as a dict key.",
  },
  {
    id: "py-b16-b1-repr-vs-str",
    language: "python",
    title: "__repr__ vs __str__ in classes",
    tag: "classes",
    code: `class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y

    def __repr__(self):
        return f"Point({self.x!r}, {self.y!r})"  # unambiguous

    def __str__(self):
        return f"({self.x}, {self.y})"            # human-friendly

p = Point(3, 4)
print(repr(p))   # Point(3, 4)  — eval()-able
print(str(p))    # (3, 4)       — readable
print(f"{p!r}")  # Point(3, 4)  — !r forces repr
print(f"{p}")    # (3, 4)       — default is str`,
    explanation: "`__repr__` should produce an unambiguous, ideally eval()-able string for developers; `__str__` produces a human-readable string for end users. When `__str__` is absent, Python falls back to `__repr__`.",
  },
  {
    id: "py-b16-b1-walrus-while",
    language: "python",
    title: "Walrus operator in a while loop",
    tag: "snippet",
    code: `import re

text = "Error 404 on line 23, warning 200 on line 7"
pos = 0

# Without walrus: assign then check
# m = re.search(r'\\d+', text[pos:])
# while m:
#     ...

# With walrus: assign inside condition
while m := re.search(r'\\d+', text[pos:]):
    print(f"Found number: {m.group()} at offset {pos + m.start()}")
    pos += m.end()`,
    explanation: "The walrus operator `:=` assigns and returns a value in one expression — inside a `while` condition it eliminates the duplicate call pattern of assigning before the loop and again at the end of the body.",
  },
  {
    id: "py-b16-b1-float-equality",
    language: "python",
    title: "Float equality is unreliable",
    tag: "caveats",
    code: `x = 0.1 + 0.2
print(x)          # 0.30000000000000004
print(x == 0.3)   # False — not equal!

# Correct way: use math.isclose
import math
print(math.isclose(x, 0.3))           # True
print(math.isclose(x, 0.3, rel_tol=1e-9))  # True

# For exact decimal arithmetic: Decimal
from decimal import Decimal
print(Decimal("0.1") + Decimal("0.2"))  # 0.3
print(Decimal("0.1") + Decimal("0.2") == Decimal("0.3"))  # True`,
    explanation: "IEEE 754 floating-point cannot represent 0.1 or 0.2 exactly, so their sum differs from 0.3 by a tiny rounding error — always use `math.isclose` for float comparison or `decimal.Decimal` when exactness is required.",
  },
  {
    id: "py-b16-b1-heapq-nlargest",
    language: "python",
    title: "heapq.nlargest and nsmallest",
    tag: "structures",
    code: `import heapq

scores = [34, 78, 12, 56, 90, 23, 67, 45]

top3 = heapq.nlargest(3, scores)
bot3 = heapq.nsmallest(3, scores)
print(top3)  # [90, 78, 67]
print(bot3)  # [12, 23, 34]

# Works with key function
students = [("alice", 92), ("bob", 85), ("carol", 97)]
best = heapq.nlargest(2, students, key=lambda s: s[1])
print(best)  # [('carol', 97), ('alice', 92)]`,
    explanation: "`heapq.nlargest` and `nsmallest` use a heap internally and are more efficient than full-sort when n is much smaller than the list — for n close to len(lst), `sorted()` is faster.",
  },
  {
    id: "py-b16-b1-decimal-precision",
    language: "python",
    title: "Decimal for controlled precision",
    tag: "types",
    code: `from decimal import Decimal, getcontext

# Default precision is 28 significant digits
getcontext().prec = 6

a = Decimal("1") / Decimal("3")
print(a)   # 0.333333

getcontext().prec = 50
b = Decimal("1") / Decimal("3")
print(b)   # 0.33333333333333333333333333333333333333333333333333

# Rounding modes
from decimal import ROUND_HALF_UP
price = Decimal("2.675")
print(price.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))  # 2.68`,
    explanation: "`decimal.Decimal` gives you user-definable precision and multiple rounding modes — essential for financial calculations where floating-point rounding errors are unacceptable.",
  },
  {
    id: "py-b16-b1-generator-exhaustion",
    language: "python",
    title: "Generator exhaustion: single-use",
    tag: "caveats",
    code: `def count_up(n):
    for i in range(n):
        yield i

gen = count_up(5)

# First pass: works fine
print(list(gen))  # [0, 1, 2, 3, 4]

# Second pass: generator is exhausted
print(list(gen))  # []  — empty!

# Fix: use a list, or re-create the generator
data = list(count_up(5))  # materialized — reusable
print(data)  # [0, 1, 2, 3, 4]
print(data)  # [0, 1, 2, 3, 4]`,
    explanation: "A generator is a stateful iterator — once exhausted it silently returns nothing on subsequent iteration. If you need to iterate multiple times, convert it to a list or call the generator function again.",
  },
  {
    id: "py-b16-b1-f-string-format-spec",
    language: "python",
    title: "f-string format spec: padding, align, thousands",
    tag: "snippet",
    code: `name = "Alice"
score = 1234567.89
pi = 3.14159265

# Width and alignment
print(f"{name:<10}|")   # 'Alice     |'  left-align
print(f"{name:>10}|")   # '     Alice|'  right-align
print(f"{name:^10}|")   # '  Alice   |'  center

# Number formatting
print(f"{score:,.2f}")   # 1,234,567.89  thousands separator
print(f"{pi:.4f}")       # 3.1416
print(f"{255:#010x}")    # 0x000000ff    hex with prefix, zero-padded`,
    explanation: "f-string format specs follow the same mini-language as `format()`: `[fill][align][sign][#][0][width][grouping][.precision][type]` — mastering it eliminates most manual string padding code.",
  },
  {
    id: "py-b16-b1-for-else",
    language: "python",
    title: "for/else: else runs when no break",
    tag: "understanding",
    code: `def find_prime_factor(n):
    for i in range(2, int(n ** 0.5) + 1):
        if n % i == 0:
            print(f"{n} has factor {i}")
            break
    else:
        # Only reached if the loop completed without break
        print(f"{n} is prime")

find_prime_factor(12)   # 12 has factor 2
find_prime_factor(13)   # 13 is prime
find_prime_factor(49)   # 49 has factor 7`,
    explanation: "Python's `for/else` (and `while/else`) runs the `else` block only when the loop finishes without hitting a `break` — it's a clean way to signal 'search succeeded / search failed' without a flag variable.",
  },
  {
    id: "py-b16-b1-bisect-insort",
    language: "python",
    title: "bisect.insort for sorted insertion",
    tag: "structures",
    code: `import bisect

sorted_list = [10, 20, 30, 40, 50]

bisect.insort(sorted_list, 25)
print(sorted_list)  # [10, 20, 25, 30, 40, 50]

bisect.insort(sorted_list, 10)
print(sorted_list)  # [10, 10, 20, 25, 30, 40, 50]

# bisect_left / bisect_right for finding insertion point
pos = bisect.bisect_left(sorted_list, 25)
print(pos)  # 3 — index where 25 sits

# Search for closest value
def closest(lst, val):
    i = bisect.bisect_left(lst, val)
    return lst[i] if i < len(lst) else lst[-1]`,
    explanation: "`bisect.insort` maintains a sorted list with O(n) insertion (due to shifting) but O(log n) search for the position — ideal when the list is small or reads vastly outnumber writes.",
  },
  {
    id: "py-b16-b1-eq-hash-contract",
    language: "python",
    title: "__eq__ and __hash__ contract",
    tag: "classes",
    code: `class Card:
    def __init__(self, rank, suit):
        self.rank = rank
        self.suit = suit

    def __eq__(self, other):
        return self.rank == other.rank and self.suit == other.suit

    # MUST define __hash__ when you define __eq__
    # Python sets it to None otherwise (unhashable!)
    def __hash__(self):
        return hash((self.rank, self.suit))

c1 = Card("A", "spades")
c2 = Card("A", "spades")
print(c1 == c2)        # True
print(c1 is c2)        # False
print({c1, c2})        # one element — same hash + equal`,
    explanation: "Defining `__eq__` without `__hash__` makes a class unhashable (Python sets `__hash__ = None`). The contract: equal objects must have equal hashes, so always base `__hash__` on the same fields as `__eq__`.",
  },
  {
    id: "py-b16-b1-zip-silent-truncate",
    language: "python",
    title: "zip silently truncates to shortest",
    tag: "caveats",
    code: `names = ["alice", "bob", "carol", "dave"]
scores = [95, 87, 92]  # one item shorter

pairs = list(zip(names, scores))
print(pairs)
# [('alice', 95), ('bob', 87), ('carol', 92)]
# 'dave' is silently dropped!

# Fix: use itertools.zip_longest
from itertools import zip_longest
pairs2 = list(zip_longest(names, scores, fillvalue=0))
print(pairs2)
# [('alice', 95), ('bob', 87), ('carol', 92), ('dave', 0)]`,
    explanation: "`zip` stops at the shortest iterable with no warning — if your data lengths may differ and you want to catch mismatches, either assert equal lengths beforehand or use `itertools.zip_longest` with a sentinel fill value.",
  },
  {
    id: "py-b16-b1-fraction-exact",
    language: "python",
    title: "Fraction for exact rational arithmetic",
    tag: "types",
    code: `from fractions import Fraction

a = Fraction(1, 3)
b = Fraction(1, 6)

print(a + b)          # 1/2
print(a * b)          # 1/18
print(a - b)          # 1/6
print(a == Fraction(2, 6))  # True — auto-reduced

# From float (shows the hidden representation)
print(Fraction(0.1))
# 3602879701896397/36028797018963968  (not 1/10!)

# From string — exact
print(Fraction("0.1"))  # 1/10`,
    explanation: "`fractions.Fraction` performs exact rational arithmetic with automatic reduction — initialising from a `float` captures its hidden binary approximation, so use strings or integers for exact fractions.",
  },
  {
    id: "py-b16-b1-generator-vs-list",
    language: "python",
    title: "Generator vs list: lazy vs eager",
    tag: "families",
    code: `import sys

# List: evaluates everything immediately
squares_list = [x ** 2 for x in range(10_000)]
print(sys.getsizeof(squares_list))  # ~87624 bytes

# Generator: evaluates one at a time
squares_gen = (x ** 2 for x in range(10_000))
print(sys.getsizeof(squares_gen))   # 104 bytes — constant!

# First 5 from each
print(squares_list[:5])            # [0, 1, 4, 9, 16]
from itertools import islice
print(list(islice(squares_gen, 5)))  # [0, 1, 4, 9, 16]`,
    explanation: "Generator expressions use parentheses instead of brackets and produce values on demand — they're ideal for large sequences you'll consume once, since memory stays constant regardless of how many items the source could yield.",
  },
  {
    id: "py-b16-b1-slots-memory",
    language: "python",
    title: "__slots__ reduces instance memory",
    tag: "classes",
    code: `import sys

class PointDict:
    def __init__(self, x, y):
        self.x = x
        self.y = y

class PointSlots:
    __slots__ = ("x", "y")
    def __init__(self, x, y):
        self.x = x
        self.y = y

pd = PointDict(1, 2)
ps = PointSlots(1, 2)

print(sys.getsizeof(pd) + sys.getsizeof(pd.__dict__))  # ~232 bytes
print(sys.getsizeof(ps))  # ~56 bytes — no __dict__ overhead`,
    explanation: "`__slots__` replaces the per-instance `__dict__` with a fixed-size array of descriptors — it cuts memory by 50–80% for classes with many small instances and also speeds up attribute access slightly.",
  },
  {
    id: "py-b16-b1-chainmap-lookup",
    language: "python",
    title: "ChainMap for layered config lookup",
    tag: "structures",
    code: `from collections import ChainMap

defaults   = {"color": "blue",  "size": "M",  "debug": False}
user_prefs = {"color": "green", "size": "L"}
cli_args   = {"debug": True}

# Priority: cli_args > user_prefs > defaults
config = ChainMap(cli_args, user_prefs, defaults)

print(config["color"])   # green  (from user_prefs)
print(config["size"])    # L      (from user_prefs)
print(config["debug"])   # True   (from cli_args)

# Write goes to first map only
config["color"] = "red"
print(cli_args)  # {'debug': True, 'color': 'red'}`,
    explanation: "`ChainMap` chains multiple dicts into a single view with explicit priority — reads search front-to-back, writes always target the first map, making it ideal for layered config systems.",
  },
  {
    id: "py-b16-b1-augmented-assign-immutable",
    language: "python",
    title: "Augmented assignment on immutables rebinds",
    tag: "understanding",
    code: `# int is immutable: += creates a new object
x = 5
original_id = id(x)
x += 3
print(x)               # 8
print(id(x) == original_id)  # False — new object

# tuple is immutable: += also rebinds
t = (1, 2, 3)
id_before = id(t)
t += (4,)
print(t)               # (1, 2, 3, 4)
print(id(t) == id_before)  # False — new tuple

# list is mutable: += extends in place
lst = [1, 2, 3]
id_before = id(lst)
lst += [4]
print(id(lst) == id_before)  # True — same object`,
    explanation: "`+=` on immutable types (int, str, tuple) creates a new object and rebinds the variable; on mutable types (list) it calls `__iadd__` which mutates in place — this distinction matters when the object is shared.",
  },
  {
    id: "py-b16-b1-dict-merge-or",
    language: "python",
    title: "Dict merge with |= operator (3.9+)",
    tag: "snippet",
    code: `base = {"a": 1, "b": 2, "c": 3}
updates = {"b": 20, "d": 4}

# | creates a new dict (non-mutating)
merged = base | updates
print(merged)  # {'a': 1, 'b': 20, 'c': 3, 'd': 4}
print(base)    # unchanged: {'a': 1, 'b': 2, 'c': 3}

# |= updates in place
base |= updates
print(base)    # {'a': 1, 'b': 20, 'c': 3, 'd': 4}

# Chain multiple sources
config = {"host": "localhost"} | {"port": 8080} | {"debug": True}
print(config)`,
    explanation: "Python 3.9 added `|` and `|=` for dict merging — `|` produces a new dict (right side wins on duplicates) while `|=` updates the left operand in place, replacing the older `{**a, **b}` idiom.",
  },
  {
    id: "py-b16-b1-abc-abstract",
    language: "python",
    title: "ABCMeta abstract method enforcement",
    tag: "classes",
    code: `from abc import ABC, abstractmethod

class Shape(ABC):
    @abstractmethod
    def area(self) -> float: ...

    @abstractmethod
    def perimeter(self) -> float: ...

    def describe(self):  # concrete method is fine
        return f"area={self.area():.2f}, perimeter={self.perimeter():.2f}"

class Circle(Shape):
    def __init__(self, r): self.r = r
    def area(self): return 3.14159 * self.r ** 2
    def perimeter(self): return 2 * 3.14159 * self.r

try:
    Shape()  # TypeError: Can't instantiate abstract class
except TypeError as e:
    print(e)`,
    explanation: "`ABC` with `@abstractmethod` enforces a contract at instantiation time — Python raises `TypeError` if any abstract method is left unimplemented in a concrete subclass, providing interface-like guarantees.",
  },
  {
    id: "py-b16-b1-shallow-copy-nested",
    language: "python",
    title: "Shallow copy doesn't clone nested objects",
    tag: "caveats",
    code: `import copy

original = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]

shallow = original.copy()   # or list(original), or original[:]
deep    = copy.deepcopy(original)

# Outer list is different
print(shallow is original)  # False

# But inner lists are shared!
shallow[0].append(99)
print(original[0])  # [1, 2, 3, 99] — mutated!

deep[1].append(99)
print(original[1])  # [4, 5, 6] — untouched`,
    explanation: "Shallow copy creates a new container but copies references to the same inner objects — modifications to nested mutable items affect both copies. Use `copy.deepcopy` when you need a fully independent clone.",
  },
  {
    id: "py-b16-b1-any-all-generator",
    language: "python",
    title: "any/all with generator expressions",
    tag: "snippet",
    code: `nums = [4, 8, 15, 16, 23, 42]

# any: short-circuits on first True
print(any(x > 40 for x in nums))   # True  (stops at 42)
print(any(x > 100 for x in nums))  # False (exhausts all)

# all: short-circuits on first False
print(all(x > 0 for x in nums))    # True
print(all(x % 2 == 0 for x in nums))  # False (stops at 15)

# Practical: validate all fields present
record = {"name": "Alice", "age": 30, "email": "a@b.com"}
required = ["name", "age", "email"]
print(all(field in record for field in required))  # True`,
    explanation: "`any` and `all` accept any iterable and short-circuit — they stop evaluating as soon as the result is determined, so generator expressions avoid computing the whole sequence unnecessarily.",
  },
  {
    id: "py-b16-b1-struct-pack-unpack",
    language: "python",
    title: "struct.pack/unpack for binary data",
    tag: "structures",
    code: `import struct

# Pack: Python values -> bytes
data = struct.pack(">HHI", 1, 2, 300)
# > = big-endian, H = unsigned short (2 bytes), I = unsigned int (4 bytes)
print(data)        # b'\\x00\\x01\\x00\\x02\\x00\\x00\\x01,'
print(len(data))   # 8 bytes

# Unpack: bytes -> Python values
a, b, c = struct.unpack(">HHI", data)
print(a, b, c)  # 1 2 300

# calcsize tells you the byte length
print(struct.calcsize(">HHI"))  # 8`,
    explanation: "`struct.pack/unpack` converts between Python values and C-style binary representations — essential for reading binary file formats, network protocols, and interfacing with C libraries.",
  },
  {
    id: "py-b16-b1-type-none",
    language: "python",
    title: "type(None) is NoneType",
    tag: "types",
    code: `# None is the sole instance of NoneType
print(type(None))           # <class 'NoneType'>
print(type(None).__name__)  # NoneType

# NoneType is not directly accessible in builtins
type_of_none = type(None)

# isinstance check
x = None
print(isinstance(x, type(None)))  # True

# None is a singleton — always use 'is' not '=='
def maybe() -> None:
    return None

result = maybe()
print(result is None)    # True (preferred)
print(result == None)    # True (works but triggers linter warnings)`,
    explanation: "`NoneType` is not in builtins directly — you access it via `type(None)`. Checking `x is None` is preferred over `x == None` because `is` tests identity (singleton), not equality which can be overridden by `__eq__`.",
  },
  {
    id: "py-b16-b1-itertools-chain",
    language: "python",
    title: "itertools.chain to concatenate iterables",
    tag: "snippet",
    code: `from itertools import chain

list1 = [1, 2, 3]
list2 = [4, 5]
tuple1 = (6, 7, 8)
gen1 = (x for x in range(9, 12))

# chain accepts any number of iterables of any type
for item in chain(list1, list2, tuple1, gen1):
    print(item, end=" ")
# 1 2 3 4 5 6 7 8 9 10 11

print()
# Useful for building one big sequence without copying
merged = list(chain(list1, list2, tuple1))
print(merged)  # [1, 2, 3, 4, 5, 6, 7, 8]`,
    explanation: "`itertools.chain` lazily concatenates multiple iterables of different types without creating intermediate lists — it's the go-to when you want to loop over several sequences as if they were one.",
  },
  {
    id: "py-b16-b1-classmethod-constructor",
    language: "python",
    title: "classmethod as alternate constructor",
    tag: "classes",
    code: `from datetime import date

class Employee:
    def __init__(self, name, dept, salary):
        self.name = name
        self.dept = dept
        self.salary = salary

    @classmethod
    def from_csv_row(cls, row: str) -> "Employee":
        name, dept, salary = row.split(",")
        return cls(name.strip(), dept.strip(), float(salary))

    @classmethod
    def from_dict(cls, data: dict) -> "Employee":
        return cls(data["name"], data["dept"], data["salary"])

e1 = Employee.from_csv_row("Alice, Engineering, 95000")
e2 = Employee.from_dict({"name": "Bob", "dept": "HR", "salary": 72000})
print(e1.name, e1.salary)  # Alice 95000.0`,
    explanation: "Classmethods receive the class (`cls`) not the instance — the pattern of naming them `from_*` is a widespread convention for alternate constructors that parse different input formats, as seen in `datetime.date.fromisoformat`.",
  },
  {
    id: "py-b16-b1-sorted-key",
    language: "python",
    title: "sorted with key function",
    tag: "snippet",
    code: `words = ["banana", "Apple", "cherry", "date", "Fig"]

# Case-insensitive sort
print(sorted(words, key=str.lower))
# ['Apple', 'banana', 'cherry', 'date', 'Fig']

# Sort records by multiple criteria
students = [
    ("Alice", "B", 90),
    ("Bob",   "A", 85),
    ("Carol", "B", 85),
    ("Dave",  "A", 90),
]
# Primary: grade ascending, secondary: score descending
result = sorted(students, key=lambda s: (s[1], -s[2]))
for s in result: print(s)`,
    explanation: "The `key` function is called once per element and the return value is used for comparison — tuples as keys give multi-level sorting, and negating a numeric key reverses just that level without a second `.reverse()` call.",
  },
  {
    id: "py-b16-b1-bool-subclass-int",
    language: "python",
    title: "bool is a subclass of int — arithmetic implications",
    tag: "understanding",
    code: `print(issubclass(bool, int))   # True
print(isinstance(True, int))   # True

# Boolean arithmetic
votes = [True, True, False, True, False, True]
yes = sum(votes)       # sum counts True as 1
no  = len(votes) - yes
print(f"Yes: {yes}, No: {no}")   # Yes: 4, No: 2

# Conditionals still work correctly
if 0:   print("zero is falsy")
if 1:   print("one is truthy")  # prints

# Comparison returns bool, which IS an int
result = (3 > 2)
print(type(result))    # <class 'bool'>
print(result + 10)     # 11`,
    explanation: "`True` and `False` are literally `1` and `0` under the hood — this means boolean values can participate in arithmetic, indexing, and formatting operations, which is a common Pythonic pattern for counting truthy values.",
  },
  {
    id: "py-b16-b1-deque-vs-list",
    language: "python",
    title: "deque vs list: O(1) at both ends",
    tag: "families",
    code: `from collections import deque
import time

N = 100_000

# list.insert(0, x) is O(n) — shifts all elements
lst = []
for i in range(N):
    lst.insert(0, i)

# deque.appendleft(x) is O(1)
dq = deque()
for i in range(N):
    dq.appendleft(i)

# Both support indexing, but deque is O(n) for random access
print(lst[N // 2])   # O(1)
print(dq[N // 2])    # O(n) — not cached`,
    explanation: "`deque` offers O(1) append and pop from both ends, making it ideal for queues and sliding windows, while `list` provides O(1) random access but O(n) insertion/deletion at the front.",
  },
  {
    id: "py-b16-b1-sorted-stability",
    language: "python",
    title: "Sorted is stable — equal keys preserve order",
    tag: "caveats",
    code: `data = [
    ("Alice", "admin",  3),
    ("Bob",   "user",   1),
    ("Carol", "admin",  2),
    ("Dave",  "user",   4),
]

# Sort by role only — original relative order preserved within role
by_role = sorted(data, key=lambda x: x[1])
for row in by_role:
    print(row)
# ('Alice', 'admin', 3)
# ('Carol', 'admin', 2)  ← Alice before Carol (original order)
# ('Bob',   'user',  1)
# ('Dave',  'user',  4)`,
    explanation: "Python's sort (Timsort) is stable: elements that compare equal keep their original relative order. This lets you achieve multi-key sorting by applying stable sorts in reverse priority order.",
  },
  {
    id: "py-b16-b1-zip-to-dict",
    language: "python",
    title: "zip two lists into a dict",
    tag: "snippet",
    code: `keys   = ["name", "age", "city"]
values = ["Alice", 30, "Berlin"]

record = dict(zip(keys, values))
print(record)
# {'name': 'Alice', 'age': 30, 'city': 'Berlin'}

# Reverse: split a dict into two lists
names  = list(record.keys())
vals   = list(record.values())
print(names)   # ['name', 'age', 'city']
print(vals)    # ['Alice', 30, 'Berlin']

# dict(zip) is idiomatic for building from parallel arrays
headers = ["x", "y", "z"]
row     = [10,  20,  30]
point   = dict(zip(headers, row))`,
    explanation: "`dict(zip(keys, values))` is the canonical Python idiom for constructing a dictionary from two parallel sequences — it works with any iterables, not just lists.",
  },
  {
    id: "py-b16-b1-descriptor-get",
    language: "python",
    title: "Descriptor __get__ protocol",
    tag: "classes",
    code: `class Celsius:
    """Descriptor that stores temperature in Fahrenheit."""
    def __set_name__(self, owner, name):
        self.storage = f"_{name}_f"

    def __get__(self, obj, objtype=None):
        if obj is None:     # accessed from class
            return self
        return (getattr(obj, self.storage) - 32) * 5 / 9

    def __set__(self, obj, value):
        setattr(obj, self.storage, value * 9 / 5 + 32)

class Thermometer:
    temp_c = Celsius()

t = Thermometer()
t.temp_c = 100
print(t._temp_c_f)   # 212.0 — stored as Fahrenheit
print(t.temp_c)      # 100.0 — returned as Celsius`,
    explanation: "A descriptor is any class that defines `__get__`, `__set__`, or `__delete__`; when used as a class attribute it intercepts attribute access on instances — this is how `property`, `classmethod`, and `staticmethod` are implemented.",
  },
  {
    id: "py-b16-b1-set-intersection-difference",
    language: "python",
    title: "Set intersection and difference",
    tag: "snippet",
    code: `python_devs = {"alice", "bob", "carol", "dave"}
java_devs   = {"bob", "carol", "eve", "frank"}

# Intersection: know both
both   = python_devs & java_devs
print(both)   # {'bob', 'carol'}

# Difference: python only
py_only = python_devs - java_devs
print(py_only)  # {'alice', 'dave'}

# Union: know either
either = python_devs | java_devs
print(either)   # {'alice', 'bob', 'carol', 'dave', 'eve', 'frank'}

# Symmetric difference: know exactly one
exclusive = python_devs ^ java_devs
print(exclusive)  # {'alice', 'dave', 'eve', 'frank'}`,
    explanation: "Python's set operators (`&`, `|`, `-`, `^`) mirror mathematical set theory and are O(min(len(s), len(t))) for intersection — far faster than nested loops for membership-based filtering.",
  },
  {
    id: "py-b16-b1-type-literal",
    language: "python",
    title: "Literal type hint for exact values",
    tag: "types",
    code: `from typing import Literal

Direction = Literal["north", "south", "east", "west"]
Status    = Literal[200, 201, 204, 400, 404, 500]

def move(direction: Direction) -> None:
    print(f"Moving {direction}")

def handle(status: Status) -> str:
    match status:
        case 200 | 201: return "success"
        case 400:       return "bad request"
        case 404:       return "not found"
        case _:         return "other"

move("north")        # OK
# move("up")         # mypy: Argument 1 has incompatible type
print(handle(404))   # not found`,
    explanation: "`Literal` restricts a type to a specific set of values — type checkers use it to catch invalid arguments at analysis time, and `match` can exhaustively cover all literal cases.",
  },
  {
    id: "py-b16-b1-enumerate-start",
    language: "python",
    title: "enumerate with start= parameter",
    tag: "snippet",
    code: `items = ["apple", "banana", "cherry"]

# Default: starts at 0
for i, item in enumerate(items):
    print(f"{i}: {item}")
# 0: apple, 1: banana, 2: cherry

# start=1 for 1-based display
print("\\nMenu:")
for num, item in enumerate(items, start=1):
    print(f"  {num}. {item}")
# 1. apple
# 2. banana
# 3. cherry

# start can be any integer
for i, item in enumerate(items, start=100):
    print(f"ID-{i}: {item}")`,
    explanation: "`enumerate(iterable, start=n)` yields `(index, value)` pairs starting from `n` — the `start` parameter removes the need for a manual counter or post-processing offset.",
  },
  {
    id: "py-b16-b1-comprehension-scope",
    language: "python",
    title: "Comprehension scope is isolated in Python 3",
    tag: "caveats",
    code: `# Python 2 leaked the loop variable — Python 3 does NOT
i = 42

squares = [i ** 2 for i in range(5)]
print(squares)  # [0, 1, 4, 9, 16]
print(i)        # 42 — unchanged!

# Generator, set, dict comprehensions all have their own scope
x = "outer"
result = {x: len(x) for x in ["hello", "world"]}
print(x)  # "outer" — still outer x

# But a plain for-loop DOES leak its variable
for j in range(3):
    pass
print(j)  # 2 — j is visible here`,
    explanation: "In Python 3, list/set/dict/generator comprehensions have their own scope — the iteration variable doesn't leak into the surrounding scope. This was a bug-prone difference from Python 2 that was fixed by treating comprehensions like implicit functions.",
  },
  {
    id: "py-b16-b1-namedtuple-defaults",
    language: "python",
    title: "namedtuple with defaults",
    tag: "structures",
    code: `from collections import namedtuple

# defaults apply to the rightmost fields
Config = namedtuple("Config", ["host", "port", "debug", "timeout"],
                    defaults=["localhost", 8080, False, 30])

c1 = Config()
print(c1)  # Config(host='localhost', port=8080, debug=False, timeout=30)

c2 = Config(host="prod.example.com", port=443)
print(c2)  # Config(host='prod.example.com', port=443, debug=False, timeout=30)

# _asdict for easy serialization
print(c2._asdict())
# OrderedDict([('host', 'prod.example.com'), ...])`,
    explanation: "Named tuples with defaults (Python 3.6.1+) provide a lightweight, immutable data class — they're memory-efficient (no `__dict__`), iterable like tuples, and have readable attribute access.",
  },
  {
    id: "py-b16-b1-typevar-bound",
    language: "python",
    title: "TypeVar with a bound constraint",
    tag: "types",
    code: `from typing import TypeVar

class Animal:
    def speak(self) -> str: return "..."

class Dog(Animal):
    def speak(self) -> str: return "woof"

class Cat(Animal):
    def speak(self) -> str: return "meow"

T = TypeVar("T", bound=Animal)

def make_speak(animal: T) -> T:
    print(animal.speak())
    return animal  # return type matches input type exactly

d: Dog = make_speak(Dog())  # type checker knows return is Dog
c: Cat = make_speak(Cat())  # type checker knows return is Cat`,
    explanation: "`TypeVar(bound=X)` means the type variable can be `X` or any subclass — the key benefit over `def f(a: Animal) -> Animal` is that the return type preserves the concrete subtype, enabling type-safe chaining.",
  },
  {
    id: "py-b16-b1-functools-partial",
    language: "python",
    title: "functools.partial to pre-fill arguments",
    tag: "snippet",
    code: `from functools import partial

def power(base, exponent):
    return base ** exponent

square = partial(power, exponent=2)
cube   = partial(power, exponent=3)

print(square(5))   # 25
print(cube(3))     # 27

# Practical: bind url prefix
import urllib.request

def fetch(url, timeout=10):
    return f"fetching {url} with timeout={timeout}"

fetch_fast = partial(fetch, timeout=3)
print(fetch_fast("https://api.example.com/data"))`,
    explanation: "`functools.partial` freezes some arguments of a callable, returning a new callable with fewer parameters — useful when an API expects a simpler function signature than you have available.",
  },
  {
    id: "py-b16-b1-is-vs-eq-strings",
    language: "python",
    title: "is vs == for strings (interning)",
    tag: "caveats",
    code: `# String literals are interned — same object
a = "hello"
b = "hello"
print(a is b)   # True  (interned — CPython-specific)
print(a == b)   # True

# Constructed strings may NOT be interned
s1 = "hel" + "lo"
s2 = "".join(["h", "e", "l", "l", "o"])
print(s1 == s2)  # True  — same characters
print(s1 is s2)  # False — different objects (usually)

# Always use == for value comparison
user_input = input("") if False else "hello"
print(user_input == "hello")  # True — safe
print(user_input is "hello")  # possibly True, NOT reliable`,
    explanation: "CPython interns many string literals as an optimization, making `is` work for simple cases — but this is an implementation detail, not a guarantee. Always use `==` to compare string values.",
  },
  {
    id: "py-b16-b1-functools-reduce",
    language: "python",
    title: "functools.reduce for custom folds",
    tag: "snippet",
    code: `from functools import reduce
import operator

nums = [1, 2, 3, 4, 5]

# Sum: reduce with add
total = reduce(operator.add, nums)
print(total)  # 15

# Product
product = reduce(operator.mul, nums, 1)
print(product)  # 120

# Flatten: reduce with list concat
nested = [[1, 2], [3, 4], [5, 6]]
flat = reduce(operator.add, nested)
print(flat)  # [1, 2, 3, 4, 5, 6]

# Custom: running max
running_max = reduce(lambda acc, x: acc if acc > x else x, nums)
print(running_max)  # 5`,
    explanation: "`functools.reduce(f, iterable, initial)` applies `f` cumulatively left-to-right — the optional `initial` value is crucial to avoid `TypeError` on empty iterables and sets the starting accumulator.",
  },
  {
    id: "py-b16-b1-dict-vs-set",
    language: "python",
    title: "dict vs set: key-value vs key-only",
    tag: "families",
    code: `# Both use hash tables internally
d = {"a": 1, "b": 2, "c": 3}
s = {"a", "b", "c"}

print(type(d))  # <class 'dict'>
print(type(s))  # <class 'set'>

# {} is a dict, NOT a set
empty_dict = {}
empty_set  = set()
print(type(empty_dict))  # <class 'dict'>
print(type(empty_set))   # <class 'set'>

# Membership test: O(1) for both
print("a" in d)  # True  (checks keys)
print("a" in s)  # True

# Set has no associated values — less memory
import sys
big_d = {i: True for i in range(1000)}
big_s = {i for i in range(1000)}
print(sys.getsizeof(big_d) > sys.getsizeof(big_s))  # True`,
    explanation: "Both `dict` and `set` use hash tables so O(1) lookups, but `set` stores only keys — when you only need membership testing and don't need associated values, a `set` uses less memory.",
  },
  {
    id: "py-b16-b1-itertools-groupby",
    language: "python",
    title: "itertools.groupby for run-length grouping",
    tag: "snippet",
    code: `from itertools import groupby

# groupby groups CONSECUTIVE equal elements — sort first!
data = ["a", "b", "b", "c", "a", "a", "b"]
for key, group in groupby(data):
    print(key, list(group))
# a ['a']
# b ['b', 'b']
# c ['c']
# a ['a', 'a']  ← 'a' appears again after sorting it would merge
# b ['b']

# Sort first to group all matching items
for key, group in groupby(sorted(data)):
    print(key, list(group))`,
    explanation: "`itertools.groupby` groups *consecutive* equal elements — it does NOT aggregate all equal elements like SQL's `GROUP BY`. You must sort the data first if you want all items with the same key collected together.",
  },
  {
    id: "py-b16-b1-protocol-structural",
    language: "python",
    title: "Protocol for structural subtyping",
    tag: "types",
    code: `from typing import Protocol, runtime_checkable

@runtime_checkable
class Drawable(Protocol):
    def draw(self) -> str: ...
    def area(self) -> float: ...

class Circle:   # does NOT inherit Drawable
    def draw(self): return "O"
    def area(self): return 3.14 * 5 ** 2

class Square:   # also does NOT inherit
    def draw(self): return "[]"
    def area(self): return 10.0 * 10.0

def render(shape: Drawable) -> None:
    print(f"{shape.draw()} area={shape.area()}")

render(Circle())   # works — structural match
render(Square())   # works — structural match

print(isinstance(Circle(), Drawable))  # True`,
    explanation: "`Protocol` enables structural subtyping (duck typing with type-checker support) — a class satisfies a Protocol simply by having the right methods, without any inheritance or registration.",
  },
  {
    id: "py-b16-b1-pathlib-glob",
    language: "python",
    title: "pathlib.Path glob for file discovery",
    tag: "snippet",
    code: `from pathlib import Path
import tempfile, os

# Create some temp files to demo
with tempfile.TemporaryDirectory() as tmp:
    base = Path(tmp)
    (base / "a.py").write_text("# py1")
    (base / "b.py").write_text("# py2")
    (base / "c.txt").write_text("text")
    (base / "sub").mkdir()
    (base / "sub" / "d.py").write_text("# py3")

    # glob: one level only
    py_files = list(base.glob("*.py"))
    print([p.name for p in py_files])  # ['a.py', 'b.py']

    # rglob: recursive
    all_py = list(base.rglob("*.py"))
    print(sorted(p.name for p in all_py))  # ['a.py', 'b.py', 'd.py']`,
    explanation: "`Path.glob` supports Unix-style wildcards for the current directory; `Path.rglob('*.py')` is equivalent to `Path.glob('**/*.py')` and descends into all subdirectories recursively.",
  },
  {
    id: "py-b16-b1-none-singleton",
    language: "python",
    title: "None is a singleton — always use 'is'",
    tag: "understanding",
    code: `# None is literally the only instance of NoneType
a = None
b = None
print(a is b)       # True — same object always
print(id(a) == id(b))  # True

# A class can override __eq__ to equal None...
class Tricky:
    def __eq__(self, other): return True

t = Tricky()
print(t == None)    # True — __eq__ lies!
print(t is None)    # False — identity check is reliable

# Function with no return value returns None
def no_return(): pass
print(no_return() is None)  # True`,
    explanation: "`None` is a singleton — there is exactly one `None` object in a Python process, so `x is None` is the canonical check. Using `==` is technically correct but allows custom `__eq__` to masquerade as `None`.",
  },
  {
    id: "py-b16-b1-counter-update",
    language: "python",
    title: "Counter.update to merge frequency counts",
    tag: "snippet",
    code: `from collections import Counter

batch1 = Counter({"apple": 3, "banana": 1})
batch2 = Counter({"banana": 2, "cherry": 5})
batch3 = Counter("aabbbcccc")

# update adds counts (not replaces)
total = Counter()
total.update(batch1)
total.update(batch2)
total.update(batch3)

print(total)
# Counter({'c': 4, 'cherry': 5, 'apple': 3, 'banana': 3, 'b': 3, 'a': 2})

# Subtract counts
total.subtract({"cherry": 2})
print(total["cherry"])  # 3`,
    explanation: "`Counter.update` adds incoming counts to existing ones rather than replacing — it's the right way to merge frequency tables across multiple sources. `Counter.subtract` similarly decrements counts.",
  },
  {
    id: "py-b16-b1-generator-lazy",
    language: "python",
    title: "Generator expression evaluated lazily",
    tag: "understanding",
    code: `import time

def slow_square(x):
    time.sleep(0.001)   # simulate work
    return x ** 2

# List comp: evaluates ALL now
lst = [slow_square(x) for x in range(5)]  # blocks ~5ms
print("list built")

# Generator: evaluates NONE now
gen = (slow_square(x) for x in range(5))  # returns immediately
print("generator created")

# Items computed only when consumed
for val in gen:   # computes one at a time
    print(val, end=" ")
# 0 1 4 9 16`,
    explanation: "Generator expressions delay computation until each value is requested — the expression body isn't called at creation time, only at iteration. This makes generators useful for expensive or infinite sequences.",
  },
  {
    id: "py-b16-b1-ordered-dict-move-to-end",
    language: "python",
    title: "OrderedDict.move_to_end for LRU simulation",
    tag: "structures",
    code: `from collections import OrderedDict

cache = OrderedDict()
cache["a"] = 1
cache["b"] = 2
cache["c"] = 3

# Simulate access — move 'a' to end (most recently used)
cache.move_to_end("a")
print(list(cache.keys()))  # ['b', 'c', 'a']

# Evict LRU: popitem(last=False) pops from front
evicted = cache.popitem(last=False)
print(evicted)             # ('b', 2)
print(list(cache.keys()))  # ['c', 'a']

# move_to_end with last=False moves to front
cache.move_to_end("a", last=False)
print(list(cache.keys()))  # ['a', 'c']`,
    explanation: "`OrderedDict.move_to_end` and `popitem(last=False)` together provide the building blocks for an LRU cache — though `functools.lru_cache` is simpler for most use cases.",
  },
  {
    id: "py-b16-b1-staticmethod",
    language: "python",
    title: "staticmethod for utility functions",
    tag: "classes",
    code: `class Temperature:
    def __init__(self, celsius: float):
        self.celsius = celsius

    @staticmethod
    def c_to_f(c: float) -> float:
        """Pure utility — no self or cls needed."""
        return c * 9 / 5 + 32

    @staticmethod
    def f_to_c(f: float) -> float:
        return (f - 32) * 5 / 9

    @property
    def fahrenheit(self) -> float:
        return Temperature.c_to_f(self.celsius)

print(Temperature.c_to_f(100))   # 212.0
print(Temperature.f_to_c(32))    # 0.0
t = Temperature(37)
print(t.fahrenheit)               # 98.6`,
    explanation: "A `staticmethod` receives neither `self` nor `cls` — it's logically grouped with a class but doesn't depend on class or instance state, making it more honest than a module-level function when the utility belongs conceptually to the class.",
  },
  {
    id: "py-b16-b1-recursion-limit",
    language: "python",
    title: "Recursion limit and sys.setrecursionlimit",
    tag: "caveats",
    code: `import sys

print(sys.getrecursionlimit())  # 1000 (default)

def countdown(n):
    if n == 0:
        return 0
    return countdown(n - 1)

try:
    countdown(999)    # OK
    countdown(1001)   # RecursionError
except RecursionError as e:
    print(f"RecursionError: {e}")

# Can raise the limit (use carefully)
sys.setrecursionlimit(2000)
countdown(1500)  # now works`,
    explanation: "Python limits call stack depth to 1000 by default to prevent stack overflows — deep recursion should be converted to iteration or use `sys.setrecursionlimit` with caution, since the limit protects the OS stack.",
  },
  {
    id: "py-b16-b1-map-filter",
    language: "python",
    title: "map and filter return lazy iterators",
    tag: "snippet",
    code: `nums = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

# map applies a function to every element
doubled = map(lambda x: x * 2, nums)
print(type(doubled))   # <class 'map'>  — lazy!
print(list(doubled))   # [2, 4, 6, 8, 10, 12, 14, 16, 18, 20]

# filter keeps elements where predicate is True
evens = filter(lambda x: x % 2 == 0, nums)
print(list(evens))     # [2, 4, 6, 8, 10]

# Compose: filter then map
result = list(map(lambda x: x ** 2, filter(lambda x: x % 2 == 0, nums)))
print(result)   # [4, 16, 36, 64, 100]`,
    explanation: "`map` and `filter` return lazy iterators (not lists) in Python 3 — they consume memory proportional to one element at a time, but most developers prefer list comprehensions for their readability.",
  },
  {
    id: "py-b16-b1-del-name-not-object",
    language: "python",
    title: "del removes the name, not the object",
    tag: "understanding",
    code: `a = [1, 2, 3]
b = a        # b refers to the same list

del a        # removes the name 'a'

# The list still exists via 'b'
print(b)     # [1, 2, 3]

# del doesn't call __del__ or free memory immediately
# — the garbage collector handles that when refcount hits 0

class Tracked:
    def __del__(self):
        print("Tracked destroyed")

t = Tracked()
ref = t
del t          # name deleted, refcount 1 -> not destroyed yet
print("before del ref")
del ref        # refcount -> 0, __del__ called now
print("after del ref")`,
    explanation: "`del x` removes the binding between the name `x` and its object — if other references to the same object exist, the object lives on. Python uses reference counting plus a cyclic garbage collector to actually free memory.",
  },
  {
    id: "py-b16-b1-frozenset-dict-key",
    language: "python",
    title: "frozenset as a dict key",
    tag: "structures",
    code: `# frozenset is hashable — can be a dict key or set element
edge_weights = {}

edge1 = frozenset({"A", "B"})
edge2 = frozenset({"B", "C"})
edge3 = frozenset({"A", "C"})

edge_weights[edge1] = 5
edge_weights[edge2] = 3
edge_weights[edge3] = 8

print(edge_weights[frozenset({"B", "A"})])  # 5 — order doesn't matter!

# Use case: undirected graph edges, power set keys
pairs = {frozenset({i, j}) for i in range(3) for j in range(3) if i != j}
print(len(pairs))  # 3 unique undirected pairs`,
    explanation: "`frozenset` is an immutable set and therefore hashable — it's the natural key type when you need to represent an unordered collection as a dictionary key, such as edges in an undirected graph.",
  },
  {
    id: "py-b16-b1-annotated-metadata",
    language: "python",
    title: "Annotated for attaching metadata to types",
    tag: "types",
    code: `from typing import Annotated, get_type_hints, get_args
import dataclasses

# Annotated[T, metadata...] — type is T, metadata is arbitrary
Positive = Annotated[int, "must be > 0"]
Email    = Annotated[str, "must contain @"]

@dataclasses.dataclass
class User:
    age:   Positive
    email: Email

# Frameworks can read metadata at runtime
hints = get_type_hints(User, include_extras=True)
for field, hint in hints.items():
    args = get_args(hint)
    if len(args) > 1:
        print(f"{field}: type={args[0].__name__!r}, constraint={args[1]!r}")`,
    explanation: "`Annotated[T, metadata]` attaches arbitrary metadata to a type hint — the type checker sees `T`, while frameworks (Pydantic, FastAPI, custom validators) can inspect the metadata at runtime via `get_args`.",
  },
  {
    id: "py-b16-b1-str-join-listcomp",
    language: "python",
    title: "str.join with list comprehension",
    tag: "snippet",
    code: `words = ["the", "quick", "brown", "fox"]

# join with space
print(" ".join(words))          # the quick brown fox

# join with transform
print(", ".join(w.title() for w in words))  # The, Quick, Brown, Fox

# Build CSV row
row = [42, "Alice", 3.14, True]
csv_line = ",".join(str(v) for v in row)
print(csv_line)   # 42,Alice,3.14,True

# Join path parts (prefer pathlib, but this works)
parts = ["usr", "local", "bin", "python3"]
print("/".join(parts))  # usr/local/bin/python3`,
    explanation: "`str.join(iterable)` is O(n) and allocates exactly one string — it's vastly more efficient than `+=` in a loop, which creates a new string object on every concatenation.",
  },
  {
    id: "py-b16-b1-metaclass-auto-register",
    language: "python",
    title: "Metaclass for auto-registration",
    tag: "classes",
    code: `REGISTRY = {}

class PluginMeta(type):
    def __new__(mcs, name, bases, namespace):
        cls = super().__new__(mcs, name, bases, namespace)
        if bases:  # skip the base class itself
            REGISTRY[name] = cls
        return cls

class Plugin(metaclass=PluginMeta):
    def run(self): raise NotImplementedError

class EmailPlugin(Plugin):
    def run(self): return "sending email"

class SMSPlugin(Plugin):
    def run(self): return "sending SMS"

print(REGISTRY)
# {'EmailPlugin': <class '...'>, 'SMSPlugin': <class '...'>}

name = "EmailPlugin"
result = REGISTRY[name]().run()
print(result)  # sending email`,
    explanation: "A metaclass's `__new__` runs whenever a new class using that metaclass is defined — this is how plugin registries, ORM model tracking, and command-line subcommand auto-discovery are implemented without decorators.",
  },
  {
    id: "py-b16-b1-str-split-maxsplit",
    language: "python",
    title: "str.split with maxsplit parameter",
    tag: "snippet",
    code: `line = "2026-05-16 10:30:00 ERROR disk full"

# Split into at most 3 pieces (maxsplit=2)
parts = line.split(" ", maxsplit=2)
print(parts)
# ['2026-05-16', '10:30:00', 'ERROR disk full']

date, time, message = parts
print(date)    # 2026-05-16
print(message) # ERROR disk full

# Without maxsplit
print(line.split(" "))
# ['2026-05-16', '10:30:00', 'ERROR', 'disk', 'full']

# rsplit to split from the right
print("a.b.c.d".rsplit(".", maxsplit=1))  # ['a.b.c', 'd']`,
    explanation: "`str.split(sep, maxsplit=n)` performs at most `n` splits, keeping the remainder of the string intact — useful when a delimiter appears in the data portion of a record, like log lines or colon-separated key-value pairs.",
  },
  {
    id: "py-b16-b1-global-local-scope",
    language: "python",
    title: "Global vs local scope lookup (LEGB)",
    tag: "understanding",
    code: `x = "global"

def outer():
    x = "enclosing"

    def inner():
        # x = "local"  # uncomment to shadow
        print(x)       # LEGB: Local -> Enclosing -> Global -> Builtin

    inner()

outer()   # prints: enclosing

# Assigning in a function creates a local — even if same name
def rebind():
    # print(y)   # UnboundLocalError — y is seen as local due to assignment below
    y = "local"
    print(y)

rebind()`,
    explanation: "Python resolves names using LEGB order: Local, Enclosing, Global, Built-in. Simply assigning a name inside a function makes it local to that function — reading it before the assignment raises `UnboundLocalError`.",
  },
  {
    id: "py-b16-b1-weakref-weakvalue",
    language: "python",
    title: "weakref.WeakValueDictionary for caches",
    tag: "structures",
    code: `import weakref

class Resource:
    def __init__(self, name):
        self.name = name

# Entries are removed automatically when the value is GC'd
cache = weakref.WeakValueDictionary()

r1 = Resource("alpha")
cache["alpha"] = r1
print("alpha" in cache)  # True

del r1    # last strong reference dropped
import gc; gc.collect()

print("alpha" in cache)  # False — auto-evicted!

r2 = Resource("beta")
cache["beta"] = r2
print(cache["beta"].name)  # beta`,
    explanation: "`WeakValueDictionary` holds weak references to values — when the last strong reference to a value is dropped, the entry is automatically removed from the dict, preventing the cache from keeping objects alive unnecessarily.",
  },
  {
    id: "py-b16-b1-try-finally-order",
    language: "python",
    title: "Exception order in try/finally",
    tag: "understanding",
    code: `def demo():
    try:
        print("try")
        raise ValueError("oops")
    except ValueError:
        print("except")
        return "from except"
    finally:
        print("finally")   # ALWAYS runs, even with return
        # return "from finally"  # uncomment: overrides except return!

result = demo()
print(result)
# try
# except
# finally
# from except

# finally also runs when no exception occurs
def clean():
    try:
        return "ok"
    finally:
        print("cleanup")  # prints before caller gets "ok"`,
    explanation: "`finally` always executes regardless of whether an exception was raised or caught, and even if a `return` statement was hit — if `finally` itself has a `return`, it overrides any earlier `return` in the try/except block.",
  },
  {
    id: "py-b16-b1-bytes-to-hex",
    language: "python",
    title: "bytes to hex and back",
    tag: "snippet",
    code: `data = b"\\x00\\xFF\\xDE\\xAD\\xBE\\xEF"

# bytes -> hex string
hex_str = data.hex()
print(hex_str)           # 00ffdeadbeef

hex_sep = data.hex(":")
print(hex_sep)           # 00:ff:de:ad:be:ef

# hex string -> bytes
restored = bytes.fromhex("00ffdeadbeef")
print(restored)          # b'\\x00\\xff\\xde\\xad\\xbe\\xef'
print(restored == data)  # True

# MAC address formatting
mac_bytes = bytes([0x00, 0x1A, 0x2B, 0x3C, 0x4D, 0x5E])
print(mac_bytes.hex(":").upper())  # 00:1A:2B:3C:4D:5E`,
    explanation: "`bytes.hex()` converts to a lowercase hex string with an optional separator; `bytes.fromhex()` is the inverse — together they handle binary-to-text encoding for protocols, hashes, and hardware addresses.",
  },
  {
    id: "py-b16-b1-class-var-vs-instance-var",
    language: "python",
    title: "Class variable vs instance variable sharing",
    tag: "understanding",
    code: `class Dog:
    species = "Canis familiaris"  # class variable — shared
    count = 0

    def __init__(self, name):
        Dog.count += 1
        self.name = name          # instance variable — per object

d1 = Dog("Rex")
d2 = Dog("Buddy")

print(Dog.count)       # 2
print(d1.species)      # Canis familiaris
print(d2.species)      # Canis familiaris

# Assigning to d1.species creates an INSTANCE attribute
d1.species = "Mutant"
print(d1.species)      # Mutant  (shadows class var)
print(d2.species)      # Canis familiaris  (class var unchanged)`,
    explanation: "Class variables are shared across all instances — assigning to `self.species` doesn't modify the class variable, it creates a new instance variable that shadows it for that one object.",
  },
  {
    id: "py-b16-b1-and-vs-ampersand",
    language: "python",
    title: "and vs & short-circuit vs bitwise",
    tag: "understanding",
    code: `# 'and' is logical: short-circuits, returns a value (not bool)
x = 5
result = x > 0 and x < 10
print(result)  # True

# Short-circuit: right side not evaluated if left is falsy
data = None
safe = data and data["key"]  # no KeyError — right not evaluated
print(safe)   # None

# '&' is bitwise on ints, element-wise on sets/numpy
a = 0b1100   # 12
b = 0b1010   # 10
print(bin(a & b))  # 0b1000 — bitwise AND

# & does NOT short-circuit
flags = {1, 2, 3}
mask  = {2, 3, 4}
print(flags & mask)  # {2, 3}`,
    explanation: "`and` short-circuits (stops evaluating when left is falsy) and returns one of its operands, not necessarily a `bool` — `&` is a bitwise/set operator that always evaluates both sides and returns a specific type.",
  },
  {
    id: "py-b16-b1-divmod",
    language: "python",
    title: "divmod for quotient and remainder",
    tag: "snippet",
    code: `# Returns (quotient, remainder) in one call
q, r = divmod(17, 5)
print(q, r)   # 3 2  (17 = 3*5 + 2)

# Convert seconds to hours/minutes/seconds
total_seconds = 9003

minutes, secs = divmod(total_seconds, 60)
hours,   mins = divmod(minutes, 60)
print(f"{hours}h {mins}m {secs}s")   # 2h 30m 3s

# Convert integer to base-N digits
def to_base(n, base):
    digits = []
    while n:
        n, d = divmod(n, base)
        digits.append(d)
    return digits[::-1]

print(to_base(255, 16))  # [15, 15]  (0xFF)`,
    explanation: "`divmod(a, b)` computes `(a // b, a % b)` in a single operation — it avoids two separate divisions and is particularly elegant for time conversion and base-conversion algorithms.",
  },
  {
    id: "py-b16-b1-pow-modulus",
    language: "python",
    title: "pow with three arguments for modular exponentiation",
    tag: "snippet",
    code: `# Two-argument pow: regular exponentiation
print(pow(2, 10))       # 1024

# Three-argument pow: (base ** exp) % mod — FAST
print(pow(2, 10, 1000)) # 24  (same as 1024 % 1000)

# WHY it matters: RSA-style big numbers
p = 2 ** 127 - 1   # a Mersenne prime
# Naive: pow(p, 65537) % p  — would be astronomically slow
# Fast: pow(p, 65537, p)    — uses fast modular exponentiation

# Modular inverse (Python 3.8+): pow(a, -1, m)
inv = pow(3, -1, 7)   # 3 * inv ≡ 1 (mod 7)
print(inv)            # 5  (3 * 5 = 15 = 2*7 + 1)`,
    explanation: "`pow(base, exp, mod)` uses fast modular exponentiation (square-and-multiply) which runs in O(log exp) multiplications — for cryptographic-size numbers, this is the difference between milliseconds and geological time.",
  },
  {
    id: "py-b16-b1-deque-maxlen",
    language: "python",
    title: "deque with maxlen as a sliding window",
    tag: "structures",
    code: `from collections import deque

# maxlen automatically evicts the oldest element
window = deque(maxlen=3)

for n in [10, 20, 30, 40, 50]:
    window.append(n)
    print(list(window))
# [10]
# [10, 20]
# [10, 20, 30]
# [20, 30, 40]   <- 10 evicted
# [30, 40, 50]   <- 20 evicted

# Moving average
import statistics
for n in [10, 20, 30, 40, 50]:
    window.append(n)
    print(f"avg={statistics.mean(window):.1f}")`,
    explanation: "`deque(maxlen=n)` is a fixed-size circular buffer — when full, each `append` automatically evicts the oldest element from the other end, making it ideal for sliding window algorithms without manual size management.",
  },
  {
    id: "py-b16-b1-contextlib-suppress",
    language: "python",
    title: "contextlib.suppress to silence exceptions",
    tag: "snippet",
    code: `from contextlib import suppress
import os

# Without suppress:
try:
    os.remove("nonexistent.txt")
except FileNotFoundError:
    pass  # ignore

# With suppress — identical behavior, less boilerplate:
with suppress(FileNotFoundError):
    os.remove("nonexistent.txt")

# Multiple exception types
with suppress(FileNotFoundError, PermissionError):
    os.remove("/root/protected.txt")

# Works in loops
files = ["a.txt", "b.txt", "c.txt"]
for f in files:
    with suppress(FileNotFoundError):
        os.remove(f)`,
    explanation: "`contextlib.suppress(*exceptions)` is a cleaner way to write `try/except/pass` blocks — it makes the intent ('I expect and accept this error') explicit and reduces boilerplate in cleanup code.",
  },
  {
    id: "py-b16-b1-bare-except",
    language: "python",
    title: "bare except catches BaseException",
    tag: "caveats",
    code: `# 'except:' (no type) catches EVERYTHING including:
# KeyboardInterrupt, SystemExit, GeneratorExit
import sys

def dangerous():
    try:
        print("working...")
        # simulate Ctrl+C
        raise KeyboardInterrupt
    except:                    # swallows KeyboardInterrupt!
        print("caught something")

dangerous()   # program continues when it shouldn't

# Safe alternative: except Exception (excludes system exits)
def safer():
    try:
        raise KeyboardInterrupt
    except Exception:   # KeyboardInterrupt is NOT an Exception
        print("won't reach here")
    except BaseException:
        print("caught it explicitly")
        raise`,
    explanation: "Bare `except:` catches `BaseException`, which includes `KeyboardInterrupt` and `SystemExit` — swallowing these prevents clean program termination. Always catch `Exception` unless you specifically need to handle system-level exceptions.",
  },
  {
    id: "py-b16-b1-str-center-ljust-rjust",
    language: "python",
    title: "str.center, ljust, rjust for text alignment",
    tag: "snippet",
    code: `title   = "Report"
divider = "-"

# center: pad on both sides
print(title.center(20))         # '       Report       '
print(title.center(20, "="))    # '=======Report======='

# ljust: left-align with fill
print(title.ljust(20, "."))     # 'Report..............'

# rjust: right-align
print(title.rjust(20, "."))     # '..............Report'

# Table formatting without format spec
headers = ["Name", "Score", "Grade"]
for h in headers:
    print(h.ljust(10), end="")
print()
for row in [("Alice", "95", "A"), ("Bob", "87", "B")]:
    for val in row:
        print(str(val).ljust(10), end="")
    print()`,
    explanation: "`ljust`, `rjust`, and `center` pad strings to a given width with a fill character (default space) — they're simpler than format specs when you need to pad variable-width strings in a loop.",
  },
  {
    id: "py-b16-b1-itertools-islice",
    language: "python",
    title: "itertools.islice to page through a generator",
    tag: "snippet",
    code: `from itertools import islice

def infinite_counter(start=0):
    n = start
    while True:
        yield n
        n += 1

gen = infinite_counter(100)

# Take first 5
page1 = list(islice(gen, 5))
print(page1)   # [100, 101, 102, 103, 104]

# Take next 5 from same generator (stateful)
page2 = list(islice(gen, 5))
print(page2)   # [105, 106, 107, 108, 109]

# islice(iterable, start, stop, step)
data = range(100)
every_third = list(islice(data, 0, 15, 3))
print(every_third)  # [0, 3, 6, 9, 12]`,
    explanation: "`itertools.islice` applies slice semantics to any iterator without materializing it — since generators are stateful, successive `islice` calls continue from where the previous left off, enabling pagination over infinite sequences.",
  },
  {
    id: "py-b16-b1-min-max-key",
    language: "python",
    title: "min/max with key function",
    tag: "snippet",
    code: `employees = [
    {"name": "Alice", "salary": 95000, "years": 5},
    {"name": "Bob",   "salary": 72000, "years": 8},
    {"name": "Carol", "salary": 110000, "years": 3},
]

highest_paid = max(employees, key=lambda e: e["salary"])
print(highest_paid["name"])   # Carol

most_senior  = max(employees, key=lambda e: e["years"])
print(most_senior["name"])    # Bob

# min/max on strings: lexicographic by default
words = ["banana", "Apple", "cherry"]
print(min(words, key=str.lower))  # Apple`,
    explanation: "`min` and `max` accept a `key` function that transforms each element before comparison — this avoids building a separate transformed list and keeps the original object in the result.",
  },
  {
    id: "py-b16-b1-array-typed",
    language: "python",
    title: "array.array for typed numeric arrays",
    tag: "structures",
    code: `import array, sys

# 'f' = float (4 bytes), 'i' = signed int (4 bytes), 'd' = double (8 bytes)
float_arr = array.array('f', [1.0, 2.0, 3.0, 4.0, 5.0])
int_arr   = array.array('i', range(1000))

# Compare memory with list
float_list = [1.0, 2.0, 3.0, 4.0, 5.0]
print(sys.getsizeof(float_arr))   # 76 bytes  (5 * 4 + header)
print(sys.getsizeof(float_list))  # 88+ bytes (pointers to float objects)

# Supports indexing and slicing
print(float_arr[2])              # 3.0
print(float_arr.tolist())        # [1.0, 2.0, 3.0, 4.0, 5.0]

# Efficient binary I/O
import io
buf = io.BytesIO()
int_arr.tofile(buf)
print(buf.tell())  # 4000 bytes (1000 * 4)`,
    explanation: "`array.array` stores homogeneous numeric data as a compact C-style array — it's more memory-efficient than a list of Python numbers and supports fast binary file I/O, though NumPy is preferred for numerical computation.",
  },
  {
    id: "py-b16-b1-chained-comparison",
    language: "python",
    title: "Chained comparison evaluation order",
    tag: "understanding",
    code: `# Python allows chaining comparisons naturally
x = 5
print(1 < x < 10)    # True  — equivalent to (1 < x) and (x < 10)
print(1 < x < 4)     # False

# Each expression is evaluated ONCE
def val(name, v):
    print(f"  eval {name}")
    return v

# 'b' evaluated once despite appearing in two comparisons
print(val("a", 1) < val("b", 5) < val("c", 10))
# eval a, eval b, eval c -> True

# Equality chains
a = b = c = 5
print(a == b == c)   # True

# Can mix operators
print(1 <= 2 < 3 != 4)   # True`,
    explanation: "Python's chained comparisons are syntactic sugar for `(a op b) and (b op c)` — crucially, the middle expression is evaluated only once and the result is short-circuited like any `and` chain.",
  },
  {
    id: "py-b16-b1-abc-mapping",
    language: "python",
    title: "collections.abc.Mapping for duck-typed dicts",
    tag: "structures",
    code: `from collections.abc import Mapping

class FrozenJSON:
    """Read-only view over a nested dict."""
    def __init__(self, data):
        self._data = dict(data)

    def __getitem__(self, key):
        val = self._data[key]
        if isinstance(val, Mapping):
            return FrozenJSON(val)
        return val

    def __len__(self): return len(self._data)
    def __iter__(self): return iter(self._data)

fj = FrozenJSON({"a": 1, "b": {"c": 2}})
print(fj["a"])           # 1
print(fj["b"]["c"])      # 2
print(isinstance(fj, Mapping))  # False — not registered`,
    explanation: "`collections.abc.Mapping` defines the abstract interface for dict-like objects — you can check membership with `isinstance` only if your class inherits or registers with the ABC, otherwise use duck typing.",
  },
  {
    id: "py-b16-b1-queue-lifo",
    language: "python",
    title: "queue.LifoQueue as a thread-safe stack",
    tag: "structures",
    code: `from queue import LifoQueue

stack = LifoQueue(maxsize=5)

stack.put("first")
stack.put("second")
stack.put("third")

print(stack.qsize())     # 3
print(stack.full())      # False (maxsize=5)

# LIFO order — last in, first out
while not stack.empty():
    print(stack.get())
# third
# second
# first`,
    explanation: "`queue.LifoQueue` is a thread-safe stack (LIFO) from the standard library — unlike `deque` which is not thread-safe for concurrent access, `LifoQueue` uses locking internally, making it safe for producer-consumer threading patterns.",
  },
  {
    id: "py-b16-b1-tuple-multi-assign",
    language: "python",
    title: "Tuple unpacking for multiple assignment",
    tag: "snippet",
    code: `# Classic swap without temp variable
a, b = 10, 20
a, b = b, a
print(a, b)   # 20 10

# Unpack return values
def minmax(lst):
    return min(lst), max(lst)   # returns a tuple

lo, hi = minmax([3, 1, 4, 1, 5, 9, 2])
print(lo, hi)  # 1 9

# Nested unpacking
point = (1, (2, 3))
x, (y, z) = point
print(x, y, z)  # 1 2 3

# Loop unpacking
pairs = [(1, "a"), (2, "b"), (3, "c")]
for num, letter in pairs:
    print(num, letter)`,
    explanation: "Tuple unpacking in Python is powered by the iterator protocol — the right side is any iterable, and the left side can mirror any nested structure, enabling clean multi-value returns and loop destructuring.",
  },
  {
    id: "py-b16-b1-range-vs-list",
    language: "python",
    title: "range vs list: lazy vs eager",
    tag: "families",
    code: `import sys

# range is lazy — constant memory regardless of size
r = range(1_000_000)
lst = list(range(1_000_000))

print(sys.getsizeof(r))    # 48 bytes — always constant
print(sys.getsizeof(lst))  # ~8.7 MB

# range supports O(1) membership, len, indexing
print(500_000 in r)    # True — O(1) mathematical check
print(len(r))          # 1000000
print(r[999_999])      # 999999
print(r[2:7])          # range(2, 7) — a range slice!

# list is needed when you need mutable or multi-pass
nums = list(r)
nums[0] = 99`,
    explanation: "`range` computes start, stop, and step but never stores the elements — membership testing and indexing are O(1) mathematical operations, not scans. Convert to `list` only when you need mutability or random sampling.",
  },
  {
    id: "py-b16-b1-circular-import",
    language: "python",
    title: "Circular import pattern and fix",
    tag: "caveats",
    code: `# Problem: a.py imports b.py, b.py imports a.py
# At import time, 'a' is partially initialized when 'b' tries to use it

# Fix 1: move the import inside the function that needs it
# a.py
def get_from_b():
    from b import something  # deferred import — runs after both modules load
    return something()

# Fix 2: restructure — extract shared code to a third module (c.py)
# a.py: from c import shared
# b.py: from c import shared

# Fix 3: import the module, not the name
# a.py
# import b              # OK at module level
# b.do_thing()          # name resolved at call time, not import time

print("circular imports are a design smell — prefer restructuring")`,
    explanation: "Circular imports occur when two modules import each other at module level — Python partially executes the first module when the second tries to import it, causing `ImportError` or missing names. Deferred imports inside functions are the quick fix; restructuring into a shared module is the proper solution.",
  },
  {
    id: "py-b16-b1-str-vs-bytes",
    language: "python",
    title: "str vs bytes: text vs binary",
    tag: "families",
    code: `# str: sequence of Unicode code points
text = "café"
print(type(text))    # <class 'str'>
print(len(text))     # 4 characters

# bytes: sequence of integers 0-255
encoded = text.encode("utf-8")
print(type(encoded)) # <class 'bytes'>
print(encoded)       # b'caf\\xc3\\xa9'
print(len(encoded))  # 5 bytes (é is 2 bytes in UTF-8)

# Round trip
restored = encoded.decode("utf-8")
print(restored == text)  # True

# They don't mix
try:
    text + encoded   # TypeError
except TypeError as e:
    print(e)`,
    explanation: "`str` and `bytes` are deliberately separate types in Python 3 — you must explicitly encode/decode at the boundary between text and binary data. The encoding is specified at that boundary rather than assumed globally.",
  },
  {
    id: "py-b16-b1-thread-gil",
    language: "python",
    title: "GIL limits CPU-bound threading",
    tag: "caveats",
    code: `import threading, time

def cpu_work(n):
    """Pure Python CPU work — blocked by GIL."""
    count = 0
    for _ in range(n):
        count += 1
    return count

N = 10_000_000

# Single thread
t0 = time.perf_counter()
cpu_work(N)
single = time.perf_counter() - t0

# Two threads (GIL means they take turns)
t0 = time.perf_counter()
threads = [threading.Thread(target=cpu_work, args=(N // 2,)) for _ in range(2)]
for t in threads: t.start()
for t in threads: t.join()
threaded = time.perf_counter() - t0

print(f"Single: {single:.2f}s  Threaded: {threaded:.2f}s")
# Threaded is ~same or slower — GIL serializes Python bytecode`,
    explanation: "The GIL (Global Interpreter Lock) prevents multiple Python threads from executing bytecode simultaneously — CPU-bound work does not speed up with threads. Use `multiprocessing`, `concurrent.futures.ProcessPoolExecutor`, or C extensions that release the GIL (like NumPy).",
  },
  {
    id: "py-b16-b1-counter-vs-dict",
    language: "python",
    title: "Counter vs dict: missing key default",
    tag: "families",
    code: `from collections import Counter

# Regular dict raises KeyError for missing keys
d = {"a": 1, "b": 2}
# print(d["c"])   # KeyError!
print(d.get("c", 0))  # 0 — manual default

# Counter returns 0 for any missing key
c = Counter({"a": 1, "b": 2})
print(c["c"])    # 0 — no KeyError, no get()
print(c["z"])    # 0

# Counter has arithmetic operations
c1 = Counter(a=3, b=2)
c2 = Counter(a=1, b=4, c=1)
print(c1 + c2)   # Counter({'b': 6, 'a': 4, 'c': 1})
print(c1 - c2)   # Counter({'a': 2})  — drops non-positive`,
    explanation: "`Counter` subclasses `dict` but returns 0 for missing keys instead of raising `KeyError`, and supports arithmetic operations (add, subtract, intersect, union) that regular dicts don't — ideal for frequency tallying.",
  },
  {
    id: "py-b16-b1-bool-in-sum",
    language: "python",
    title: "bool as int: counting with sum()",
    tag: "snippet",
    code: `data = [1, -3, 0, 7, -2, 4, 0, 9, -1, 5]

# Count positives using sum + generator
positives  = sum(x > 0 for x in data)
negatives  = sum(x < 0 for x in data)
zeros      = sum(x == 0 for x in data)

print(f"pos={positives}, neg={negatives}, zeros={zeros}")
# pos=5, neg=3, zeros=2

# Count matching strings
words = ["hello", "world", "help", "he", "hero"]
starts_he = sum(w.startswith("he") for w in words)
print(starts_he)  # 4`,
    explanation: "Since `True == 1` and `False == 0`, passing a generator of boolean expressions to `sum()` counts the `True` values — a concise Pythonic pattern that avoids an explicit counter variable.",
  },
  {
    id: "py-b16-b1-xunion-type-hint",
    language: "python",
    title: "X|Y union type hint (Python 3.10+)",
    tag: "types",
    code: `# Before 3.10: from typing import Union, Optional
# After 3.10: use | directly in annotations

def greet(name: str | None) -> str:
    if name is None:
        return "Hello, stranger!"
    return f"Hello, {name}!"

def parse_value(raw: str) -> int | float | None:
    try:
        return int(raw)
    except ValueError:
        try:
            return float(raw)
        except ValueError:
            return None

print(greet(None))         # Hello, stranger!
print(parse_value("42"))   # 42
print(parse_value("3.14")) # 3.14
print(parse_value("abc"))  # None`,
    explanation: "PEP 604 (Python 3.10) allows `X | Y` directly in annotations without importing `Union` — it's more readable and also works at runtime with `isinstance(x, int | str)`, making it the preferred modern syntax.",
  },
  {
    id: "py-b16-b1-metaclass-type",
    language: "python",
    title: "Metaclass: type is the metaclass of all classes",
    tag: "classes",
    code: `# Every class is an instance of type (its metaclass)
print(type(int))    # <class 'type'>
print(type(str))    # <class 'type'>
print(type(type))   # <class 'type'>  — type is its own metaclass!

class MyClass:
    pass

print(type(MyClass))  # <class 'type'>

# You can create classes dynamically with type(name, bases, dict)
Dog = type("Dog", (object,), {
    "sound": "woof",
    "speak": lambda self: self.sound,
})

d = Dog()
print(d.speak())          # woof
print(isinstance(d, Dog)) # True`,
    explanation: "`type` is both a built-in function (returns the type of an object) and the default metaclass of all Python classes — calling `type(name, bases, namespace)` programmatically creates a new class at runtime.",
  },
  {
    id: "py-b16-b1-generator-vs-deque",
    language: "python",
    title: "deque vs list for O(1) queue operations",
    tag: "families",
    code: `from collections import deque
import time

N = 50_000

# list as a queue: pop(0) is O(n) — shifts everything
lst = list(range(N))
t0 = time.perf_counter()
while lst:
    lst.pop(0)  # O(n) each time
list_time = time.perf_counter() - t0

# deque as a queue: popleft() is O(1) — no shifting
dq = deque(range(N))
t0 = time.perf_counter()
while dq:
    dq.popleft()  # O(1) each time
deque_time = time.perf_counter() - t0

print(f"list: {list_time:.3f}s  deque: {deque_time:.3f}s")
# deque is dramatically faster for large N`,
    explanation: "`list.pop(0)` is O(n) because all remaining elements must shift left by one; `deque.popleft()` is O(1) because a deque is a doubly-linked list of fixed-size blocks. Use `deque` whenever you need queue (FIFO) semantics.",
  },
  {
    id: "py-b16-b1-str-bytes-encode-decode",
    language: "python",
    title: "str vs bytes round-trip encode/decode",
    tag: "families",
    code: `# Unicode strings and bytes are separate worlds in Python 3
text = "Héllo, wörld!"

# Encode: str -> bytes (requires specifying encoding)
utf8  = text.encode("utf-8")
latin = text.encode("latin-1")

print(utf8)    # b'H\\xc3\\xa9llo, w\\xc3\\xb6rld!'
print(latin)   # b'H\\xe9llo, w\\xf6rld!'

# Decode: bytes -> str
print(utf8.decode("utf-8"))    # Héllo, wörld!
print(latin.decode("latin-1")) # Héllo, wörld!

# Wrong encoding raises UnicodeDecodeError
try:
    utf8.decode("ascii")
except UnicodeDecodeError as e:
    print(e)  # 'ascii' codec can't decode byte 0xc3`,
    explanation: "In Python 3, `str` is a sequence of Unicode code points and `bytes` is a sequence of raw octets — you must explicitly choose an encoding at the boundary. UTF-8 is the safe default for most modern applications.",
  },
  {
    id: "py-b16-b1-class-decorator-order",
    language: "python",
    title: "Class decorator order matters",
    tag: "caveats",
    code: `def bold(cls):
    orig_str = cls.__str__
    cls.__str__ = lambda self: f"<b>{orig_str(self)}</b>"
    return cls

def italic(cls):
    orig_str = cls.__str__
    cls.__str__ = lambda self: f"<i>{orig_str(self)}</i>"
    return cls

@bold       # applied SECOND (outermost)
@italic     # applied FIRST (innermost)
class Title:
    def __init__(self, text): self.text = text
    def __str__(self): return self.text

t = Title("Hello")
print(t)  # <b><i>Hello</i></b>

# Reversing the decorators:
@italic
@bold
class Title2:
    def __init__(self, text): self.text = text
    def __str__(self): return self.text

print(Title2("Hello"))  # <i><b>Hello</b></i>`,
    explanation: "Python applies class (and function) decorators from bottom to top — the decorator closest to the `class` keyword runs first, and its result is passed to the next one up. This mirrors function composition: `@bold @italic f` is `bold(italic(f))`.",
  },
  {
    id: "py-b16-b1-format-percent-coercion",
    language: "python",
    title: "%-style formatting coerces types",
    tag: "caveats",
    code: `# %-style format coerces automatically — sometimes surprisingly
print("%d" % 3.9)    # 3  — truncates float to int (not rounds!)
print("%d" % True)   # 1  — bool -> int
print("%s" % [1,2])  # [1, 2]  — calls str()
print("%r" % "hi")   # 'hi'   — calls repr(), adds quotes

# Format string attacks: never use % with user input as the format
user_input = "%(password)s"  # malicious format string
data = {"password": "secret", "name": "Alice"}
# print(user_input % data)  # would print "secret"!

# Prefer f-strings or str.format() for new code
name = "Alice"
print(f"Hello, {name}")     # safe — no injection via format string
print("Hello, {}".format(name))  # also safe`,
    explanation: "`%d` silently truncates floats (not rounds), and `%s` silently calls `str()` on any object — the format-string attack is a real security issue when the format string itself comes from user input. F-strings are immune because the template and data are always in the same expression.",
  },
];
