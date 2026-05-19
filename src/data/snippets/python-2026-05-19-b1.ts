import type { Snippet } from "./types";

export const pythonSnippets20260519B1: Snippet[] = [
  {
    id: "py-0519-walrus-comprehension",
    language: "python",
    title: "Walrus operator in list comprehension",
    tag: "snippet",
    code: `data = [1, -3, 7, -2, 5, -8, 4]

# := assigns and tests in one expression
doubled_pos = [y for x in data if (y := x * 2) > 0]
print(doubled_pos)  # [2, 14, 10, 8]

# Also useful to avoid calling expensive functions twice
results = [clean for s in data if (clean := str(s).strip())]`,
    explanation: "The walrus operator := lets you bind a name inside an expression, so you can filter and use a transformed value in one comprehension pass without calling the transform twice.",
  },
  {
    id: "py-0519-zip-strict",
    language: "python",
    title: "zip() strict= kwarg (Python 3.10+)",
    tag: "snippet",
    code: `names = ["Alice", "Bob", "Carol"]
scores = [95, 87]  # shorter than names

# Default zip silently truncates — easy bug to miss
list(zip(names, scores))  # [('Alice', 95), ('Bob', 87)]

# strict=True raises ValueError when lengths differ
try:
    list(zip(names, scores, strict=True))
except ValueError as e:
    print(e)  # zip() has arguments with different lengths`,
    explanation: "zip(strict=True) turns a silent truncation into a loud ValueError, catching mismatched data that would otherwise produce wrong results without any warning.",
  },
  {
    id: "py-0519-dict-merge-pipe",
    language: "python",
    title: "Dict merge with | and |= (Python 3.9+)",
    tag: "snippet",
    code: `defaults = {"color": "red", "size": 10, "visible": True}
overrides = {"color": "blue", "opacity": 0.9}

# | creates a new merged dict; right side wins on conflict
merged = defaults | overrides
print(merged)
# {'color': 'blue', 'size': 10, 'visible': True, 'opacity': 0.9}

# |= updates in place
defaults |= overrides
print(defaults["color"])  # 'blue'`,
    explanation: "The | operator merges two dicts into a new one (right side wins on duplicate keys), while |= mutates the left dict in place — cleaner than {**a, **b} unpacking.",
  },
  {
    id: "py-0519-fstring-eq",
    language: "python",
    title: "f-string = for self-documenting expressions",
    tag: "snippet",
    code: `x = 42
items = [1, 2, 3]

# f"{expr=}" prints the expression text and its value
print(f"{x=}")           # x=42
print(f"{len(items)=}")  # len(items)=3
print(f"{x * 2 + 1=}")  # x * 2 + 1=85

# Combine with format spec
print(f"{x=:.2f}")       # x=42.00`,
    explanation: "Adding = after the expression in an f-string prints both the expression text and its value, making ad-hoc debugging prints self-labelling without writing the name twice.",
  },
  {
    id: "py-0519-removeprefix",
    language: "python",
    title: "str.removeprefix / str.removesuffix (Python 3.9+)",
    tag: "snippet",
    code: `url = "https://example.com/path"

# Old approach — fragile with lstrip
bad = url.lstrip("https://")  # may strip too many chars

# New methods only remove the prefix if it matches exactly
clean = url.removeprefix("https://")
print(clean)   # 'example.com/path'

filename = "report_2024.csv"
print(filename.removesuffix(".csv"))  # 'report_2024'
print(filename.removesuffix(".txt"))  # 'report_2024.csv' (no-op)`,
    explanation: "removeprefix and removesuffix return the string unchanged if the prefix/suffix isn't present, avoiding the character-stripping bug that lstrip/rstrip have.",
  },
  {
    id: "py-0519-star-unpack",
    language: "python",
    title: "Extended iterable unpacking with *rest",
    tag: "snippet",
    code: `first, *rest = [1, 2, 3, 4, 5]
print(first)  # 1
print(rest)   # [2, 3, 4, 5]

*head, last = range(5)
print(head)   # [0, 1, 2, 3]
print(last)   # 4

a, *middle, b = "hello"
print(middle)  # ['e', 'l', 'l']`,
    explanation: "The * in assignment unpacking captures zero or more items into a list, and can appear at any position — not just the end.",
  },
  {
    id: "py-0519-match-case-basic",
    language: "python",
    title: "match-case structural pattern matching (Python 3.10+)",
    tag: "snippet",
    code: `def describe(point):
    match point:
        case (0, 0):
            return "origin"
        case (x, 0):
            return f"on x-axis at {x}"
        case (0, y):
            return f"on y-axis at {y}"
        case (x, y):
            return f"at ({x}, {y})"
        case _:
            return "not a point"

print(describe((0, 5)))   # on y-axis at 5
print(describe((3, 4)))   # at (3, 4)`,
    explanation: "match-case does structural pattern matching: it destructures the value and binds names (like x, y above) simultaneously, far cleaner than chains of isinstance checks.",
  },
  {
    id: "py-0519-math-prod",
    language: "python",
    title: "math.prod for multiplying a sequence",
    tag: "snippet",
    code: `import math

nums = [2, 3, 4, 5]
print(math.prod(nums))       # 120

# With start value (like sum's second arg)
print(math.prod(nums, start=10))  # 1200

# Empty sequence returns 1 (multiplicative identity)
print(math.prod([]))         # 1

# Factorial via prod
n = 6
print(math.prod(range(1, n + 1)))  # 720`,
    explanation: "math.prod multiplies all elements of an iterable with an optional start value, mirroring the behavior of the built-in sum.",
  },
  {
    id: "py-0519-str-partition",
    language: "python",
    title: "str.partition for reliable splitting",
    tag: "snippet",
    code: `header = "Content-Type: application/json; charset=utf-8"

# partition always returns exactly 3 parts
key, sep, value = header.partition(": ")
print(key)    # 'Content-Type'
print(value)  # 'application/json; charset=utf-8'

# If separator not found, third part is empty string
a, b, c = "nocolon".partition(":")
print(repr(a), repr(b), repr(c))  # 'nocolon' '' ''`,
    explanation: "partition returns a guaranteed 3-tuple (before, sep, after) so unpacking is always safe; unlike split(sep, 1) there's no index-out-of-range risk.",
  },
  {
    id: "py-0519-pairwise",
    language: "python",
    title: "itertools.pairwise for consecutive pairs (Python 3.10+)",
    tag: "snippet",
    code: `from itertools import pairwise

data = [1, 4, 9, 16, 25]

# Consecutive overlapping pairs
for a, b in pairwise(data):
    print(b - a, end=" ")  # 3 5 7 9

# Check if sorted
is_sorted = all(a <= b for a, b in pairwise(data))
print(is_sorted)  # True`,
    explanation: "itertools.pairwise(seq) yields overlapping pairs (seq[0],seq[1]), (seq[1],seq[2]), …, which is the idiom for computing differences or checking sortedness without index arithmetic.",
  },
  {
    id: "py-0519-min-default",
    language: "python",
    title: "min/max with default= for empty iterables",
    tag: "snippet",
    code: `empty = []
nonempty = [3, 1, 4, 1, 5]

# Without default, empty iterable raises ValueError
# min(empty)  # ValueError: min() arg is an empty sequence

# default= avoids the error
print(min(empty, default=0))     # 0
print(max(empty, default=None))  # None

# Works with key too
words = []
print(max(words, key=len, default=""))  # ''`,
    explanation: "The default= keyword on min/max is returned when the iterable is empty, eliminating the try/except or pre-check that would otherwise be needed.",
  },
  {
    id: "py-0519-setdefault",
    language: "python",
    title: "dict.setdefault for grouping",
    tag: "snippet",
    code: `words = ["apple", "banana", "avocado", "blueberry", "cherry"]

groups = {}
for word in words:
    # setdefault inserts key with default only if missing
    groups.setdefault(word[0], []).append(word)

print(groups)
# {'a': ['apple', 'avocado'],
#  'b': ['banana', 'blueberry'],
#  'c': ['cherry']}`,
    explanation: "setdefault(key, default) returns the existing value if the key is present, or inserts default and returns it — one call instead of an if-key-not-in-dict guard.",
  },
  {
    id: "py-0519-enumerate-start",
    language: "python",
    title: "enumerate with start= parameter",
    tag: "snippet",
    code: `items = ["a", "b", "c"]

# Default starts at 0
for i, v in enumerate(items):
    print(i, v)   # 0 a  1 b  2 c

# 1-based indexing for user-facing output
for i, v in enumerate(items, start=1):
    print(f"{i}. {v}")  # 1. a  2. b  3. c

# Start at any offset
for i, v in enumerate(items, start=10):
    print(i, v)   # 10 a  11 b  12 c`,
    explanation: "enumerate's start= parameter sets the initial counter value, avoiding off-by-one arithmetic when you need 1-based or offset numbering.",
  },
  {
    id: "py-0519-divmod",
    language: "python",
    title: "divmod() for quotient and remainder together",
    tag: "snippet",
    code: `seconds = 3725

# divmod returns (quotient, remainder) in one call
minutes, secs = divmod(seconds, 60)
hours, mins = divmod(minutes, 60)

print(f"{hours}h {mins}m {secs}s")  # 1h 2m 5s

# Integer base conversion
def to_base(n, base):
    digits = []
    while n:
        n, r = divmod(n, base)
        digits.append(r)
    return digits[::-1]

print(to_base(255, 16))  # [15, 15]`,
    explanation: "divmod(a, b) returns (a // b, a % b) as a tuple, avoiding two separate operations when you need both the quotient and the remainder.",
  },
  {
    id: "py-0519-bytes-hex-sep",
    language: "python",
    title: "bytes.hex() with sep and bytes_per_sep",
    tag: "snippet",
    code: `data = bytes([0xDE, 0xAD, 0xBE, 0xEF, 0x00, 0xFF])

# Basic hex string
print(data.hex())           # 'deadbeef00ff'

# With separator every byte
print(data.hex(':'))        # 'de:ad:be:ef:00:ff'

# Separator every 2 bytes
print(data.hex(':', 2))    # 'dead:beef:00ff'

# Negative bytes_per_sep counts from right
print(data.hex('-', -2))   # 'dead:beef:00ff'`,
    explanation: "bytes.hex(sep, bytes_per_sep) formats raw bytes as a hex string with a delimiter every N bytes — useful for MAC addresses, checksums, and protocol debugging.",
  },
  {
    id: "py-0519-generator-send",
    language: "python",
    title: "Generator .send() — two-way communication",
    tag: "snippet",
    code: `def accumulator():
    total = 0
    while True:
        value = yield total   # yield sends total out, receives value in
        if value is None:
            break
        total += value

gen = accumulator()
next(gen)           # prime the generator (advances to first yield)
gen.send(10)        # total=10
gen.send(20)        # total=30
result = gen.send(5)
print(result)       # 35`,
    explanation: "yield is a two-way channel: it sends a value out (the right side of assignment at the call site) and receives a value in via .send(), making generators work as coroutines.",
  },
  {
    id: "py-0519-class-vs-instance-var",
    language: "python",
    title: "Class variable vs instance variable mutation",
    tag: "understanding",
    code: `class Dog:
    tricks = []           # class variable, shared by all instances

    def add_trick(self, trick):
        self.tricks.append(trick)   # mutates the shared list!

d1 = Dog()
d2 = Dog()
d1.add_trick("roll over")
print(d2.tricks)   # ['roll over'] — oops, d2 is affected

class Dog2:
    def __init__(self):
        self.tricks = []  # instance variable, each dog gets its own`,
    explanation: "Mutating a class-level mutable (list, dict) via self.name affects all instances because the attribute lookup resolves to the class's object until you assign on the instance.",
  },
  {
    id: "py-0519-for-else",
    language: "python",
    title: "for/else — the else fires when loop completes normally",
    tag: "understanding",
    code: `def find_prime(candidates):
    for n in candidates:
        for factor in range(2, n):
            if n % factor == 0:
                break           # factor found — don't want this n
        else:
            # else block runs when the inner for finishes WITHOUT break
            return n
    return None

print(find_prime([4, 6, 7, 9]))  # 7`,
    explanation: "A for's else block runs only if the loop completed without hitting break — it's a clean way to express 'if no item triggered break, then do this'.",
  },
  {
    id: "py-0519-while-else",
    language: "python",
    title: "while/else — else runs when condition becomes False",
    tag: "understanding",
    code: `import random

attempts = 0
while attempts < 5:
    guess = random.randint(1, 3)
    attempts += 1
    if guess == 2:
        print(f"Found 2 on attempt {attempts}")
        break
else:
    # Runs only if loop ended because condition became False (no break)
    print("Never guessed 2 in 5 tries")`,
    explanation: "Like for/else, a while's else block is skipped if the loop exits via break, but runs when the while condition naturally becomes False — useful for 'timeout without success' logic.",
  },
  {
    id: "py-0519-nonlocal-vs-global",
    language: "python",
    title: "nonlocal vs global — what they each reach",
    tag: "understanding",
    code: `count = 0

def outer():
    x = 10
    def inner():
        nonlocal x    # reaches outer()'s x, not module-level
        global count  # reaches module-level count
        x += 1
        count += 1
    inner()
    print(x)      # 11

outer()
print(count)      # 1`,
    explanation: "nonlocal reaches the nearest enclosing function scope (not global), while global reaches the module level — using the wrong one raises UnboundLocalError.",
  },
  {
    id: "py-0519-augmented-assign-list",
    language: "python",
    title: "'+=' on a list vs. a new binding",
    tag: "understanding",
    code: `a = [1, 2, 3]
b = a

a += [4, 5]    # calls list.__iadd__ — mutates in place
print(b)       # [1, 2, 3, 4, 5]  b sees the change!

a = a + [6, 7]  # creates a NEW list and rebinds a
print(b)         # [1, 2, 3, 4, 5]  b unchanged`,
    explanation: "list.__iadd__ mutates the existing list (so all references see it), while a = a + [...] creates a new list and only rebinds the local name.",
  },
  {
    id: "py-0519-del-semantics",
    language: "python",
    title: "del removes a name, not necessarily the object",
    tag: "understanding",
    code: `x = [1, 2, 3]
y = x          # y also points at the same list

del x          # removes the name x, doesn't destroy the list
print(y)       # [1, 2, 3]  object still alive via y

# del on a list element does modify the object
del y[1]
print(y)       # [1, 3]

# NameError if you try to use x after del
try:
    print(x)
except NameError:
    print("x is gone")`,
    explanation: "del unbinds a name from its object; the object is only garbage-collected when its reference count drops to zero, so other names pointing to it remain valid.",
  },
  {
    id: "py-0519-exception-chaining",
    language: "python",
    title: "Exception chaining: __context__ vs __cause__",
    tag: "understanding",
    code: `# Implicit chaining: __context__ (happens automatically)
try:
    int("bad")
except ValueError as e:
    raise RuntimeError("conversion failed")  # __context__ = ValueError

# Explicit chaining: __cause__ (from ... raise)
try:
    int("bad")
except ValueError as e:
    raise RuntimeError("conversion failed") from e  # __cause__ = ValueError

# Suppress context entirely
try:
    int("bad")
except ValueError:
    raise RuntimeError("conversion failed") from None`,
    explanation: "__context__ is set automatically when an exception is raised inside an except block; __cause__ is set explicitly with 'raise X from Y' to document intentional chaining.",
  },
  {
    id: "py-0519-truthiness-custom",
    language: "python",
    title: "Custom class truthiness via __bool__ and __len__",
    tag: "understanding",
    code: `class Box:
    def __init__(self, items):
        self.items = items

    def __bool__(self):
        return len(self.items) > 0

    def __len__(self):
        return len(self.items)

empty = Box([])
full = Box([1, 2])

print(bool(empty))   # False
print(bool(full))    # True

if full:
    print("has items")  # has items`,
    explanation: "Python checks __bool__ first when evaluating truthiness; if absent it falls back to __len__ != 0; if neither is defined, instances are always truthy.",
  },
  {
    id: "py-0519-string-interning",
    language: "python",
    title: "String interning and the is vs == trap",
    tag: "understanding",
    code: `a = "hello"
b = "hello"
print(a is b)   # True — CPython interns short identifier-like strings

c = "hello world"
d = "hello world"
print(c is d)   # may be True or False — implementation-dependent

e = "".join(["h", "e", "l", "l", "o"])
print(a is e)   # False — dynamically built, not interned

# Always use == to compare string content
print(a == e)   # True`,
    explanation: "CPython interns string literals that look like identifiers, so is can accidentally return True — always use == for string content equality.",
  },
  {
    id: "py-0519-late-binding-lambda",
    language: "python",
    title: "Late binding in closures and lambdas",
    tag: "understanding",
    code: `# Bug: all lambdas capture the variable i, not its value at creation
funcs = [lambda: i for i in range(5)]
print([f() for f in funcs])  # [4, 4, 4, 4, 4]

# Fix: capture value with default argument
funcs2 = [lambda i=i: i for i in range(5)]
print([f() for f in funcs2])  # [0, 1, 2, 3, 4]`,
    explanation: "Closures capture the variable (the cell), not the value at the time the closure is created, so all functions see the final value of i after the loop ends.",
  },
  {
    id: "py-0519-comprehension-scope",
    language: "python",
    title: "List comprehension variables don't leak (Python 3)",
    tag: "understanding",
    code: `x = 100

# In Python 3, the loop variable is local to the comprehension
result = [x for x in range(5)]
print(x)       # 100 — outer x unchanged

# Generator expression: same behaviour
gen = (x for x in range(5))
print(x)       # 100

# Python 2 used to leak: x would be 4 after the comprehension
# That bug was fixed in Python 3`,
    explanation: "Python 3 gives list (and set/dict) comprehensions their own scope so loop variables don't leak into the enclosing namespace.",
  },
  {
    id: "py-0519-chained-assignment",
    language: "python",
    title: "Chained assignment and shared references",
    tag: "understanding",
    code: `a = b = []    # both a and b point at the SAME list
a.append(1)
print(b)      # [1]

# Compare to independent lists
c = []
d = []
c.append(1)
print(d)      # []  — d has its own list

# For immutables, shared reference doesn't matter
x = y = 42
x += 1        # rebinds x to 43, y stays 42
print(y)      # 42`,
    explanation: "Chained assignment like a = b = [] makes both names point at the same object; mutating through one name is visible through the other unless you rebind.",
  },
  {
    id: "py-0519-deque-rotate",
    language: "python",
    title: "collections.deque rotate",
    tag: "structures",
    code: `from collections import deque

d = deque([1, 2, 3, 4, 5])

d.rotate(2)   # rotate right by 2
print(d)      # deque([4, 5, 1, 2, 3])

d.rotate(-3)  # rotate left by 3
print(d)      # deque([2, 3, 4, 5, 1])

# Efficient O(1) operations at both ends
d.appendleft(0)
d.popleft()

# Max length: old items fall off the far end
ring = deque([1, 2, 3], maxlen=3)
ring.append(4)
print(ring)   # deque([2, 3, 4], maxlen=3)`,
    explanation: "deque.rotate(n) moves n items from one end to the other in O(1) and is the idiomatic way to implement a circular buffer or round-robin scheduler.",
  },
  {
    id: "py-0519-heapq-nlargest",
    language: "python",
    title: "heapq.nlargest / nsmallest",
    tag: "structures",
    code: `import heapq

data = [3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5]

top3 = heapq.nlargest(3, data)
print(top3)   # [9, 6, 5]

bottom3 = heapq.nsmallest(3, data)
print(bottom3)  # [1, 1, 2]

# Works with key=
records = [("Alice", 90), ("Bob", 70), ("Carol", 85)]
best = heapq.nlargest(2, records, key=lambda r: r[1])
print(best)  # [('Alice', 90), ('Carol', 85)]`,
    explanation: "heapq.nlargest/nsmallest are efficient for small k relative to n (O(n log k)); for large k just use sorted().",
  },
  {
    id: "py-0519-bisect-left-right",
    language: "python",
    title: "bisect_left vs bisect_right insertion points",
    tag: "structures",
    code: `import bisect

data = [1, 2, 2, 2, 3, 4]

# bisect_left: insert before existing equal elements
print(bisect.bisect_left(data, 2))   # 1

# bisect_right: insert after existing equal elements
print(bisect.bisect_right(data, 2))  # 4

# Use for O(log n) search in sorted list
def grade(score, breaks=[60, 70, 80, 90]):
    letters = "FDCBA"
    return letters[bisect.bisect(breaks, score)]

print(grade(85))  # 'B'`,
    explanation: "bisect_left returns the leftmost insertion point for a value (useful for finding lower bound), bisect_right the rightmost (useful for upper bound and rank counting).",
  },
  {
    id: "py-0519-defaultdict-list",
    language: "python",
    title: "defaultdict(list) for grouping",
    tag: "structures",
    code: `from collections import defaultdict

pairs = [("a", 1), ("b", 2), ("a", 3), ("c", 4), ("b", 5)]

grouped = defaultdict(list)
for key, val in pairs:
    grouped[key].append(val)

print(dict(grouped))
# {'a': [1, 3], 'b': [2, 5], 'c': [4]}

# Missing key auto-creates the default
grouped["z"]  # creates [] without error
print(grouped["z"])  # []`,
    explanation: "defaultdict(factory) calls factory() to provide a value whenever a missing key is accessed, eliminating the setdefault/if-not-in pattern for grouping and counting.",
  },
  {
    id: "py-0519-counter-arithmetic",
    language: "python",
    title: "Counter arithmetic operations",
    tag: "structures",
    code: `from collections import Counter

a = Counter("aabbc")   # {'a': 2, 'b': 2, 'c': 1}
b = Counter("abc")     # {'a': 1, 'b': 1, 'c': 1}

print(a + b)   # Counter({'a': 3, 'b': 3, 'c': 2}) — sum counts
print(a - b)   # Counter({'a': 1, 'b': 1}) — subtract, drop <=0
print(a & b)   # Counter({'a': 1, 'b': 1, 'c': 1}) — min of each
print(a | b)   # Counter({'a': 2, 'b': 2, 'c': 1}) — max of each`,
    explanation: "Counter supports +, -, &, | as set-like operations on multisets; subtraction and intersection drop zero or negative counts automatically.",
  },
  {
    id: "py-0519-namedtuple-replace",
    language: "python",
    title: "namedtuple._replace() for immutable updates",
    tag: "structures",
    code: `from collections import namedtuple

Point = namedtuple("Point", ["x", "y", "z"])
p = Point(1, 2, 3)

# _replace returns a NEW namedtuple with changed fields
moved = p._replace(x=10)
print(moved)   # Point(x=10, y=2, z=3)
print(p)       # Point(x=1, y=2, z=3)  unchanged

# _asdict gives an OrderedDict for serialisation
print(p._asdict())  # {'x': 1, 'y': 2, 'z': 3}`,
    explanation: "_replace is the idiomatic way to 'modify' a namedtuple — it returns a new instance, preserving immutability while giving you a convenient copy-with-changes pattern.",
  },
  {
    id: "py-0519-array-module",
    language: "python",
    title: "array.array — typed numeric arrays",
    tag: "structures",
    code: `import array
import sys

# 'i' type = signed int (4 bytes each)
nums = array.array('i', [1, 2, 3, 4, 5])

# Much smaller than a list of ints
lst = list(range(100))
arr = array.array('i', range(100))
print(sys.getsizeof(lst))  # ~920 bytes
print(sys.getsizeof(arr))  # ~456 bytes

nums.append(6)
print(nums.tolist())  # [1, 2, 3, 4, 5, 6]`,
    explanation: "array.array stores homogeneous C-typed values contiguously, using roughly half the memory of a list of ints; it's the stdlib option between list and numpy.",
  },
  {
    id: "py-0519-weakref-dict",
    language: "python",
    title: "weakref.WeakValueDictionary — cache without preventing GC",
    tag: "structures",
    code: `import weakref

class Resource:
    def __init__(self, name):
        self.name = name
    def __repr__(self):
        return f"Resource({self.name})"

cache = weakref.WeakValueDictionary()
r = Resource("db_connection")
cache["db"] = r

print(cache["db"])  # Resource(db_connection)

del r  # remove the strong reference
import gc; gc.collect()

print(len(cache))   # 0 — entry gone, GC collected it`,
    explanation: "WeakValueDictionary holds weak references to its values, so entries vanish automatically when the last strong reference is deleted — ideal for caches that shouldn't keep objects alive.",
  },
  {
    id: "py-0519-struct-pack",
    language: "python",
    title: "struct.pack/unpack for binary data",
    tag: "structures",
    code: `import struct

# Pack: Python values -> bytes  (format string: big-endian, unsigned short, float)
packed = struct.pack(">Hf", 1024, 3.14)
print(packed.hex())           # '040040c8f5c3'

# Unpack: bytes -> Python values
val1, val2 = struct.unpack(">Hf", packed)
print(val1, round(val2, 2))   # 1024 3.14

# calcsize tells you the byte width
print(struct.calcsize(">Hf")) # 6`,
    explanation: "struct.pack/unpack lets you read and write binary protocols, file formats, and network frames where C-style fixed-width types are required.",
  },
  {
    id: "py-0519-chainmap",
    language: "python",
    title: "collections.ChainMap — layered lookup",
    tag: "structures",
    code: `from collections import ChainMap

defaults = {"color": "red", "size": 10}
user_prefs = {"color": "blue"}
cmd_args = {}

# ChainMap searches each dict in order — first match wins
config = ChainMap(cmd_args, user_prefs, defaults)
print(config["color"])  # 'blue' — user overrides default
print(config["size"])   # 10 — falls back to defaults

# Writes go only to the first map
config["size"] = 20
print(cmd_args)   # {'size': 20}
print(defaults)   # {'color': 'red', 'size': 10}  unchanged`,
    explanation: "ChainMap chains multiple dicts for read-through lookup without merging them; writes hit only the first map, making it ideal for layered configuration (defaults < user < CLI).",
  },
  {
    id: "py-0519-mappingproxy",
    language: "python",
    title: "types.MappingProxyType — read-only dict view",
    tag: "structures",
    code: `from types import MappingProxyType

source = {"x": 1, "y": 2}
proxy = MappingProxyType(source)

print(proxy["x"])   # 1
print(dict(proxy))  # {'x': 1, 'y': 2}

# Writes raise TypeError
try:
    proxy["z"] = 3
except TypeError as e:
    print(e)  # 'mappingproxy' object does not support item assignment

# But the view stays live — changes to source are reflected
source["z"] = 3
print(proxy["z"])   # 3`,
    explanation: "MappingProxyType wraps a dict in a read-only view without copying it; the proxy reflects mutations to the underlying dict, making it the right tool for exposing class __dict__ safely.",
  },
  {
    id: "py-0519-bytearray-buffer",
    language: "python",
    title: "bytearray as a mutable byte buffer",
    tag: "structures",
    code: `# bytes is immutable; bytearray is mutable
buf = bytearray(8)           # 8 zero bytes
buf[0] = 0xFF
buf[1:3] = b'\\x01\\x02'    # slice assignment
print(buf)                    # bytearray(b'\\xff\\x01\\x02\\x00\\x00\\x00\\x00\\x00')

# Efficient in-place XOR
key = 0x5A
for i in range(len(buf)):
    buf[i] ^= key

# Convert back to immutable bytes when done
result = bytes(buf)`,
    explanation: "bytearray supports in-place mutation including slice assignment, making it the right type for building or modifying binary frames before sending them over a socket.",
  },
  {
    id: "py-0519-memoryview",
    language: "python",
    title: "memoryview for zero-copy slicing",
    tag: "structures",
    code: `data = bytearray(b"Hello, World!")

# memoryview references the same buffer — no copy
mv = memoryview(data)

# Slice without copying
chunk = mv[7:12]
print(bytes(chunk))   # b'World'

# Write through the view
mv[0:5] = b"Howdy"
print(bytes(data))    # b'Howdy, World!'

# Works with bytes too (read-only view)
bv = memoryview(b"immutable")
print(bytes(bv[1:4]))  # b'mmu'`,
    explanation: "memoryview gives a slice-able, potentially writable view into a buffer without copying the data, which matters when passing large binary data between functions.",
  },
  {
    id: "py-0519-frozenset-key",
    language: "python",
    title: "frozenset as a hashable set — usable as dict key",
    tag: "structures",
    code: `# Regular sets can't be dict keys (unhashable)
try:
    d = {{1, 2}: "pair"}
except TypeError as e:
    print(e)   # unhashable type: 'set'

# frozenset is immutable and hashable
fs = frozenset([1, 2])
d = {fs: "pair"}
print(d[frozenset([2, 1])])  # 'pair' — order doesn't matter

# Use frozenset to represent unordered combos as dict keys
edges = {}
edges[frozenset(("A", "B"))] = 5
print(edges[frozenset(("B", "A"))])  # 5`,
    explanation: "frozenset is an immutable, hashable version of set that can be used as a dict key or placed inside another set, representing unordered groups without caring about element order.",
  },
  {
    id: "py-0519-float-nan",
    language: "python",
    title: "float NaN is not equal to itself",
    tag: "caveats",
    code: `import math

nan = float("nan")

# NaN != NaN is the IEEE 754 rule
print(nan == nan)   # False
print(nan != nan)   # True
print(nan < 1)      # False
print(nan > 1)      # False

# The only safe check
print(math.isnan(nan))   # True

# NaN propagates through arithmetic
print(nan + 1)      # nan
print(max(1, nan))  # nan — watch out in min/max!`,
    explanation: "NaN comparisons always return False (except !=), so `x == x` being False is a reliable but unusual way to check for NaN; math.isnan is the preferred method.",
  },
  {
    id: "py-0519-round-bankers",
    language: "python",
    title: "round() uses banker's rounding (round half to even)",
    tag: "caveats",
    code: `# Python uses IEEE 754 round-half-to-even
print(round(0.5))   # 0  (rounds to even)
print(round(1.5))   # 2  (rounds to even)
print(round(2.5))   # 2  (rounds to even)
print(round(3.5))   # 4  (rounds to even)

# For always-round-up behaviour, use Decimal
from decimal import Decimal, ROUND_HALF_UP
d = Decimal("2.5")
print(d.quantize(Decimal("1"), rounding=ROUND_HALF_UP))  # 3`,
    explanation: "Python's built-in round() implements banker's rounding (ties go to the nearest even number) to reduce statistical bias; use Decimal.quantize for traditional half-up rounding.",
  },
  {
    id: "py-0519-mutable-default-arg",
    language: "python",
    title: "Mutable default argument — the classic gotcha",
    tag: "caveats",
    code: `def append_to(element, to=[]):   # 'to' is created ONCE at def time
    to.append(element)
    return to

print(append_to(1))   # [1]
print(append_to(2))   # [1, 2]  — same list!
print(append_to(3))   # [1, 2, 3]

# Fix: use None as sentinel, create inside function
def append_to_safe(element, to=None):
    if to is None:
        to = []
    to.append(element)
    return to`,
    explanation: "Default argument values are evaluated once when the def statement executes, not each call — so a mutable default like [] accumulates state across calls.",
  },
  {
    id: "py-0519-copy-vs-deepcopy",
    language: "python",
    title: "copy.copy vs copy.deepcopy for nested structures",
    tag: "caveats",
    code: `import copy

original = [[1, 2], [3, 4]]

# Shallow copy: outer list is new, inner lists are shared
shallow = copy.copy(original)
shallow[0].append(99)
print(original)   # [[1, 2, 99], [3, 4]] — inner list mutated!

# Deep copy: fully independent clone
deep = copy.deepcopy(original)
deep[0].append(99)
print(original)   # [[1, 2, 99], [3, 4]] — unchanged`,
    explanation: "copy.copy creates a new container but keeps references to the same inner objects; copy.deepcopy recursively copies everything so no mutation leaks between the copy and the original.",
  },
  {
    id: "py-0519-generator-exhaustion",
    language: "python",
    title: "Generators are one-shot — exhaustion is silent",
    tag: "caveats",
    code: `def gen():
    yield 1
    yield 2
    yield 3

g = gen()
print(list(g))   # [1, 2, 3]
print(list(g))   # []  — already exhausted, no error!

# Same with generator expressions
squares = (x**2 for x in range(5))
print(sum(squares))   # 30
print(sum(squares))   # 0  — exhausted`,
    explanation: "Iterating a generator to the end exhausts it; subsequent iterations silently yield nothing, which is easy to miss when the same generator is passed around.",
  },
  {
    id: "py-0519-except-var-deleted",
    language: "python",
    title: "Exception variable is deleted after its except block",
    tag: "caveats",
    code: `try:
    1 / 0
except ZeroDivisionError as e:
    msg = str(e)   # save what you need INSIDE the block
    # e is valid here

# After the except block, 'e' is deleted
try:
    print(e)
except NameError:
    print("e is gone")   # e is gone

print(msg)   # 'division by zero'  — saved value still accessible`,
    explanation: "Python deletes the exception alias after the except block ends (to break reference cycles), so capture anything you need into a different name before the block exits.",
  },
  {
    id: "py-0519-modulo-negative",
    language: "python",
    title: "Modulo with negative numbers — Python vs other langs",
    tag: "caveats",
    code: `# Python modulo result has the same sign as the DIVISOR
print(7 % 3)    #  1  (positive divisor)
print(-7 % 3)   #  2  (not -1!)
print(7 % -3)   # -2  (negative divisor)
print(-7 % -3)  # -1

# Python's floor division matches: a == (a // b) * b + (a % b)
print(-7 // 3)   # -3  (floor, not truncate)
print(-7 % 3)    #  2  # (-3)*3 + 2 == -7 ✓

# C/Java truncate toward zero; Python floors
# Use math.fmod for C-style truncation
import math
print(math.fmod(-7, 3))  # -1.0`,
    explanation: "Python's % always returns a value with the same sign as the divisor because it uses floored division, not truncated division; this differs from C, Java, and JavaScript.",
  },
  {
    id: "py-0519-floor-division",
    language: "python",
    title: "// is floor division, not truncation",
    tag: "caveats",
    code: `print(7 // 2)     #  3  (same as truncation for positives)
print(-7 // 2)    # -4  (floor, not -3!)
print(7 // -2)    # -4
print(-7 // -2)   #  3

# int() truncates toward zero — different from //
print(int(-7 / 2))   # -3  (truncation)
print(-7 // 2)       # -4  (floor)

# Safe integer ceiling division
import math
print(math.ceil(7 / 2))    # 4
print(-(-7 // 2))           # 4  (bit-trick equivalent)`,
    explanation: "// floors toward negative infinity rather than truncating toward zero, so -7 // 2 == -4 not -3; use int(a/b) or -((-a)//b) if you want C-style truncation.",
  },
  {
    id: "py-0519-zip-truncation",
    language: "python",
    title: "zip() silently truncates to shortest iterable",
    tag: "caveats",
    code: `keys = ["a", "b", "c", "d"]
values = [1, 2, 3]          # one item shorter

# Silent truncation — 'd' is silently dropped
result = dict(zip(keys, values))
print(result)   # {'a': 1, 'b': 2, 'c': 3}

# Catch it with strict=
try:
    dict(zip(keys, values, strict=True))
except ValueError:
    print("lengths differ")

# Or pad shorter iterables
from itertools import zip_longest
print(list(zip_longest(keys, values, fillvalue=None)))
# [('a', 1), ('b', 2), ('c', 3), ('d', None)]`,
    explanation: "zip stops at the shortest input with no warning; use strict=True (Python 3.10+) to raise an error, or itertools.zip_longest to fill missing values.",
  },
  {
    id: "py-0519-float-sum-order",
    language: "python",
    title: "Floating-point sum order affects the result",
    tag: "caveats",
    code: `# Small + large loses precision
a = 1e16
b = 1.0
print(a + b - a)    # 0.0  (b is lost in rounding)
print(b + a - a)    # 0.0  (same problem)

# math.fsum uses extended precision — exact for finite inputs
import math
nums = [0.1] * 10
print(sum(nums))        # 0.9999999999999999
print(math.fsum(nums))  # 1.0`,
    explanation: "Floating-point addition is not associative; adding many small numbers to a large one loses the small ones. math.fsum compensates by accumulating partial sums at higher precision.",
  },
  {
    id: "py-0519-int-bignum",
    language: "python",
    title: "Python int has arbitrary precision",
    tag: "types",
    code: `# No overflow — int grows to accommodate any value
big = 2 ** 1000
print(big)          # 10715086071862673...  (302 digits)

# Factorial of 100 is exact
import math
print(math.factorial(100))

# But big ints are slower than fixed-width ones
import timeit
t1 = timeit.timeit("2**63 + 1", number=1_000_000)
t2 = timeit.timeit("2**30 + 1", number=1_000_000)
# t1 > t2 — larger magnitudes cost more`,
    explanation: "Python int is backed by arbitrary-precision arithmetic (bignums) with no maximum value, but operations slow down as numbers grow since they no longer fit in a machine word.",
  },
  {
    id: "py-0519-float-vs-decimal",
    language: "python",
    title: "float vs Decimal for money arithmetic",
    tag: "types",
    code: `# float: binary fractions — not exact for many decimals
print(0.1 + 0.2)          # 0.30000000000000004
print(0.1 + 0.2 == 0.3)  # False

from decimal import Decimal

# Decimal: decimal fractions — exact for human numbers
a = Decimal("0.10")
b = Decimal("0.20")
print(a + b)              # 0.30
print(a + b == Decimal("0.30"))  # True

# Always construct Decimal from strings, not floats
print(Decimal(0.1))   # 0.1000000000000000055511151...`,
    explanation: "float is a binary floating-point type and can't represent 0.1 exactly; Decimal stores numbers in base-10 and is the correct type for financial calculations.",
  },
  {
    id: "py-0519-complex-type",
    language: "python",
    title: "Python's built-in complex number type",
    tag: "types",
    code: `z = 3 + 4j        # j suffix for imaginary part
print(z.real)     # 3.0
print(z.imag)     # 4.0
print(abs(z))     # 5.0  (magnitude)
print(z.conjugate())  # (3-4j)

# Arithmetic
z2 = 1 - 2j
print(z + z2)     # (4+2j)
print(z * z2)     # (11-2j)

import cmath
print(cmath.phase(z))  # 0.9272952...  (angle in radians)`,
    explanation: "Python has a built-in complex type using j for the imaginary unit; the cmath module provides complex-aware versions of math functions like sqrt, exp, and phase.",
  },
  {
    id: "py-0519-fraction-exact",
    language: "python",
    title: "fractions.Fraction for exact rational arithmetic",
    tag: "types",
    code: `from fractions import Fraction

a = Fraction(1, 3)    # exactly 1/3
b = Fraction(1, 6)    # exactly 1/6

print(a + b)          # 1/2
print(a * b)          # 1/18
print(a == Fraction(2, 6))   # True  (auto-reduced)

# Convert float — reveals the exact binary representation
print(Fraction(0.1))  # 3602879701896397/36028797018963968`,
    explanation: "Fraction stores a ratio of two integers and performs exact arithmetic, never accumulating rounding error — ideal for problems where exact rationals matter more than speed.",
  },
  {
    id: "py-0519-bool-int",
    language: "python",
    title: "bool is a subclass of int",
    tag: "types",
    code: `print(isinstance(True, int))   # True
print(True + True)             # 2
print(True * 5)                # 5
print(False + 1)               # 1

# Count truthy items with sum
flags = [True, False, True, True, False]
print(sum(flags))              # 3

# Useful trick: use bool as a 0/1 index
status = True
labels = ["off", "on"]
print(labels[status])          # 'on'`,
    explanation: "bool is a subclass of int where True == 1 and False == 0, so you can use boolean values in arithmetic and sum() over them to count truthy elements.",
  },
  {
    id: "py-0519-bytes-index",
    language: "python",
    title: "Indexing bytes returns an int, not a 1-byte bytes",
    tag: "types",
    code: `data = b"hello"

# Single index returns an int (the byte value)
print(data[0])          # 104  (not b'h')
print(type(data[0]))    # <class 'int'>

# Slice returns bytes
print(data[0:1])        # b'h'
print(type(data[0:1]))  # <class 'bytes'>

# To get a single-byte bytes from an index:
print(bytes([data[0]]))  # b'h'`,
    explanation: "Indexing bytes with an integer returns an int (0-255), while slicing always returns bytes — a frequent source of bugs when iterating over binary data.",
  },
  {
    id: "py-0519-type-vs-isinstance",
    language: "python",
    title: "type() exact match vs isinstance() hierarchy check",
    tag: "types",
    code: `class Animal: pass
class Dog(Animal): pass

d = Dog()

print(type(d) is Dog)       # True  — exact type match
print(type(d) is Animal)    # False — Dog is not exactly Animal

print(isinstance(d, Dog))   # True
print(isinstance(d, Animal))  # True — Dog IS-A Animal

# Prefer isinstance in most code; type() for exact-type enforcement
print(isinstance(True, int))   # True (bool is subclass)
print(type(True) is int)       # False`,
    explanation: "isinstance traverses the MRO so it returns True for subclass instances; type() checks exact identity, which you rarely want in polymorphic code.",
  },
  {
    id: "py-0519-union-types",
    language: "python",
    title: "Union types: typing.Union vs | syntax (Python 3.10+)",
    tag: "types",
    code: `from typing import Union

# Old style (still works in all Python 3 versions)
def process(value: Union[int, str]) -> str:
    return str(value)

# New style (Python 3.10+) — cleaner
def process2(value: int | str) -> str:
    return str(value)

# Also works with isinstance in Python 3.10+
x = 42
if isinstance(x, int | str):
    print("int or str")   # int or str`,
    explanation: "Python 3.10 made the | operator available for type unions in annotations and isinstance calls, replacing the more verbose Union[X, Y] from the typing module.",
  },
  {
    id: "py-0519-optional-type",
    language: "python",
    title: "Optional[T] is just Union[T, None]",
    tag: "types",
    code: `from typing import Optional

def find(items: list, target: int) -> Optional[int]:
    try:
        return items.index(target)
    except ValueError:
        return None

# Optional[int] and int | None are identical
from typing import Union
import typing
print(Optional[int] == Union[int, None])  # True

# Python 3.10+ syntax
def find2(items: list, target: int) -> int | None:
    ...`,
    explanation: "Optional[T] is syntactic sugar for Union[T, None]; it signals that None is a valid return/argument value and type checkers enforce explicit None handling.",
  },
  {
    id: "py-0519-literal-type",
    language: "python",
    title: "typing.Literal for value-constrained types",
    tag: "types",
    code: `from typing import Literal

# Only these exact string values are valid
Direction = Literal["north", "south", "east", "west"]

def move(direction: Direction, steps: int) -> None:
    print(f"Moving {steps} step(s) {direction}")

move("north", 3)   # OK
# move("up", 1)    # type error: "up" not in Literal

# Useful for flags and sentinel values
def open_file(mode: Literal["r", "w", "rb", "wb"]) -> None:
    ...`,
    explanation: "Literal[v1, v2, ...] constrains a type to specific values; type checkers flag any argument not in the literal set, giving enum-like safety without an Enum class.",
  },
  {
    id: "py-0519-typevar",
    language: "python",
    title: "TypeVar for generic functions",
    tag: "types",
    code: `from typing import TypeVar, Sequence

T = TypeVar("T")

def first(seq: Sequence[T]) -> T:
    return seq[0]

# Type checker knows return type matches input element type
x: int = first([1, 2, 3])    # OK
s: str = first(["a", "b"])   # OK

# Constrained TypeVar
Numeric = TypeVar("Numeric", int, float)

def double(x: Numeric) -> Numeric:
    return x * 2`,
    explanation: "TypeVar lets a function be generic: the return type is linked to the input type so type checkers can propagate types through the call rather than falling back to Any.",
  },
  {
    id: "py-0519-protocol",
    language: "python",
    title: "typing.Protocol for structural subtyping (duck typing)",
    tag: "types",
    code: `from typing import Protocol

class Drawable(Protocol):
    def draw(self) -> None: ...

class Circle:
    def draw(self) -> None:
        print("O")

class Square:
    def draw(self) -> None:
        print("[]")

def render(shape: Drawable) -> None:
    shape.draw()

# Neither class inherits from Drawable — structural match is enough
render(Circle())   # O
render(Square())   # []`,
    explanation: "Protocol defines a structural interface: any class with the required methods satisfies it without explicit inheritance, matching Python's duck-typing philosophy with static-analysis support.",
  },
  {
    id: "py-0519-newtype",
    language: "python",
    title: "NewType for distinct type aliases",
    tag: "types",
    code: `from typing import NewType

UserId = NewType("UserId", int)
OrderId = NewType("OrderId", int)

def get_user(uid: UserId) -> str:
    return f"user_{uid}"

uid = UserId(42)
oid = OrderId(42)

get_user(uid)   # OK
# get_user(oid)   # type error: OrderId is not UserId
# get_user(42)    # type error: plain int is not UserId`,
    explanation: "NewType creates a distinct type that is a subtype of the base; it has zero runtime cost (it's the identity function) but prevents mixing semantically different ids in type-checked code.",
  },
  {
    id: "py-0519-typeddict",
    language: "python",
    title: "TypedDict for typed dict structures",
    tag: "types",
    code: `from typing import TypedDict, Required, NotRequired

class Movie(TypedDict):
    title: str
    year: int
    rating: NotRequired[float]  # Python 3.11+, optional key

m: Movie = {"title": "Dune", "year": 2021}  # OK (rating optional)

# Type checkers validate key names and value types
# m2: Movie = {"title": "Dune", "year": "bad"}  # error: year must be int

# Access like a normal dict at runtime
print(m["title"])   # Dune`,
    explanation: "TypedDict annotates the keys and value types of a dict structure; unlike a dataclass it remains a plain dict at runtime, so it's compatible with JSON and existing dict-based APIs.",
  },
  {
    id: "py-0519-list-vs-deque",
    language: "python",
    title: "list vs deque: when each is faster",
    tag: "families",
    code: `from collections import deque
import timeit

n = 10000
lst = list(range(n))
dq = deque(range(n))

# O(1) for deque at both ends; O(n) for list.insert(0)
t_list = timeit.timeit(lambda: lst.insert(0, -1) or lst.pop(0), number=1000)
t_deque = timeit.timeit(lambda: dq.appendleft(-1) or dq.popleft(), number=1000)

# deque is orders of magnitude faster for left-end operations
# list wins for random-access by index (deque is O(n) in middle)`,
    explanation: "Use deque when you need fast appends/pops from both ends (queue, sliding window, BFS); use list when you need O(1) random index access or mostly append/pop from the right.",
  },
  {
    id: "py-0519-dict-variants",
    language: "python",
    title: "dict / defaultdict / Counter / OrderedDict",
    tag: "families",
    code: `from collections import defaultdict, Counter, OrderedDict

# dict: general key-value store
d = {"a": 1}

# defaultdict: auto-inserts missing keys via factory
dd = defaultdict(int)
dd["x"] += 1   # no KeyError

# Counter: frequency map with arithmetic
c = Counter("aabbc")
print(c.most_common(2))  # [('a', 2), ('b', 2)]

# OrderedDict: dict that remembers insertion order
# (plain dict also preserves order since Python 3.7,
# but OrderedDict has move_to_end() and equality is order-sensitive)
od = OrderedDict([("b", 2), ("a", 1)])
od.move_to_end("b", last=False)`,
    explanation: "defaultdict avoids KeyError for missing keys; Counter adds multiset arithmetic; OrderedDict has move_to_end() and order-sensitive equality — pick based on the operation you need most.",
  },
  {
    id: "py-0519-set-frozenset",
    language: "python",
    title: "set vs frozenset: mutable vs hashable",
    tag: "families",
    code: `s = {1, 2, 3}
fs = frozenset([1, 2, 3])

# Both support set operations
print(s | {4})              # {1, 2, 3, 4}
print(fs | frozenset([4]))  # frozenset({1, 2, 3, 4})

# Only set is mutable
s.add(4)
# fs.add(4)   # AttributeError

# Only frozenset is hashable
d = {fs: "value"}   # OK as dict key
# d = {s: "value"}  # TypeError: unhashable type: 'set'`,
    explanation: "frozenset is the immutable, hashable counterpart to set; use it when you need a set that can be a dict key, a set member, or shared safely across threads without locks.",
  },
  {
    id: "py-0519-str-bytes-bytearray",
    language: "python",
    title: "str vs bytes vs bytearray",
    tag: "families",
    code: `# str: Unicode text, immutable
s = "hello"

# bytes: immutable binary sequence
b = b"hello"
print(b[0])   # 104 (int)

# bytearray: mutable binary sequence
ba = bytearray(b"hello")
ba[0] = 72
print(ba)     # bytearray(b'Hello')

# Encode/decode to convert between str and bytes
encoded = s.encode("utf-8")   # str -> bytes
decoded = encoded.decode("utf-8")  # bytes -> str`,
    explanation: "str is for text (Unicode, immutable); bytes for binary data (immutable); bytearray for binary data you need to modify in place — always encode/decode explicitly at I/O boundaries.",
  },
  {
    id: "py-0519-range-vs-list",
    language: "python",
    title: "range vs list: O(1) memory vs eager allocation",
    tag: "families",
    code: `import sys

r = range(1_000_000)
lst = list(range(1_000_000))

print(sys.getsizeof(r))    # 48 bytes — constant regardless of size!
print(sys.getsizeof(lst))  # ~8 MB

# range supports O(1) membership test
print(500_000 in r)    # True, computed directly — no scanning

# and O(1) indexing
print(r[999_999])      # 999999`,
    explanation: "range is a lazy sequence that computes elements on demand; it uses constant memory and supports O(1) membership testing and indexing — never convert to list unless you actually need a mutable sequence.",
  },
  {
    id: "py-0519-namedtuple-vs-dc",
    language: "python",
    title: "namedtuple vs dataclass vs TypedDict",
    tag: "families",
    code: `from collections import namedtuple
from dataclasses import dataclass
from typing import TypedDict

# namedtuple: immutable, tuple-compatible, no default methods
Point = namedtuple("Point", ["x", "y"])

# dataclass: mutable by default, supports defaults, methods, post_init
@dataclass
class Vector:
    x: float
    y: float
    def magnitude(self):
        return (self.x**2 + self.y**2) ** 0.5

# TypedDict: stays a plain dict at runtime
class Config(TypedDict):
    host: str
    port: int`,
    explanation: "Use namedtuple for immutable value objects that should work as tuples; dataclass for richer mutable objects with methods; TypedDict when you need typed annotations on plain dicts.",
  },
  {
    id: "py-0519-zip-vs-longest",
    language: "python",
    title: "zip vs itertools.zip_longest",
    tag: "families",
    code: `from itertools import zip_longest

a = [1, 2, 3]
b = [10, 20]

# zip: stops at shortest
print(list(zip(a, b)))                    # [(1, 10), (2, 20)]

# zip_longest: pads shorter with fillvalue
print(list(zip_longest(a, b, fillvalue=0)))
# [(1, 10), (2, 20), (3, 0)]

# zip_longest with None default
print(list(zip_longest(a, b)))
# [(1, 10), (2, 20), (3, None)]`,
    explanation: "zip truncates at the shortest input; zip_longest pads shorter iterables with a fillvalue (default None), so no data is silently dropped.",
  },
  {
    id: "py-0519-map-vs-comp",
    language: "python",
    title: "map() vs list comprehension",
    tag: "families",
    code: `nums = [1, 2, 3, 4, 5]

# map: lazy, returns a map object; good for simple functions
doubled = map(lambda x: x * 2, nums)

# list comp: eager, more readable for complex transformations
doubled2 = [x * 2 for x in nums]

# map is more efficient when passing a built-in function
strs = list(map(str, nums))       # faster than [str(x) for x in nums]
floats = list(map(float, strs))

# Conditional: list comp is cleaner
evens = [x for x in nums if x % 2 == 0]
# evens = list(filter(lambda x: x % 2 == 0, nums))  # equivalent`,
    explanation: "map is lazy and efficient when applying a named callable; list comprehensions are generally more readable and preferred for any transformation involving an expression or condition.",
  },
  {
    id: "py-0519-sorted-vs-sort",
    language: "python",
    title: "sorted() vs list.sort() — new vs in-place",
    tag: "families",
    code: `data = [3, 1, 4, 1, 5, 9]

# sorted: returns a new list, works on any iterable
new_list = sorted(data)
print(data)       # [3, 1, 4, 1, 5, 9]  unchanged
print(new_list)   # [1, 1, 3, 4, 5, 9]

# list.sort: in-place, returns None, only for lists
data.sort(reverse=True)
print(data)       # [9, 5, 4, 3, 1, 1]

# sorted works on any iterable
print(sorted("python"))  # ['h', 'n', 'o', 'p', 't', 'y']`,
    explanation: "sorted() returns a new sorted list from any iterable; list.sort() sorts in place and returns None — use sorted when you need to keep the original, .sort when memory matters.",
  },
  {
    id: "py-0519-any-vs-all",
    language: "python",
    title: "any() vs all() — short-circuit evaluation",
    tag: "families",
    code: `nums = [2, 4, 5, 8, 10]

print(any(x % 2 != 0 for x in nums))   # True (5 is odd)
print(all(x > 0 for x in nums))        # True

# Short-circuit: stops at first decisive element
def check(x):
    print(f"checking {x}")
    return x > 3

# any() stops as soon as it finds True
any(check(x) for x in [1, 2, 5, 8])   # stops at 5

# Edge cases with empty iterables
print(any([]))   # False
print(all([]))   # True  (vacuously true)`,
    explanation: "any returns True on the first truthy element and all returns False on the first falsy element — both short-circuit, so use generators (not list comps) to avoid evaluating the rest.",
  },
  {
    id: "py-0519-enumerate-vs-zip",
    language: "python",
    title: "enumerate() vs zip(range(), items)",
    tag: "families",
    code: `items = ["a", "b", "c"]

# enumerate: preferred — clear, any start value
for i, v in enumerate(items):
    print(i, v)

# zip(range, items): equivalent but verbose
for i, v in zip(range(len(items)), items):
    print(i, v)

# enumerate with start= is cleaner than zip(range(1,...))
for i, v in enumerate(items, start=1):
    print(f"{i}. {v}")`,
    explanation: "enumerate is the idiomatic choice; zip(range(len(...)), ...) is a common anti-pattern that requires knowing the length and is harder to read.",
  },
  {
    id: "py-0519-vars-dict-dir",
    language: "python",
    title: "vars() vs __dict__ vs dir()",
    tag: "families",
    code: `class Foo:
    class_attr = "shared"
    def __init__(self):
        self.x = 1
        self.y = 2

f = Foo()

# vars(obj) returns obj.__dict__ (instance attributes only)
print(vars(f))           # {'x': 1, 'y': 2}
print(f.__dict__)        # {'x': 1, 'y': 2}  same thing

# dir(obj) returns all accessible names (inherited too)
attrs = dir(f)
print("class_attr" in attrs)  # True
print("__init__" in attrs)    # True`,
    explanation: "vars() and __dict__ show an object's own instance attributes; dir() returns all accessible names including inherited ones and special methods.",
  },
  {
    id: "py-0519-reduce-vs-sum",
    language: "python",
    title: "functools.reduce vs sum/max/min",
    tag: "families",
    code: `from functools import reduce
import operator

nums = [1, 2, 3, 4, 5]

# Use built-ins when they exist — much clearer
total = sum(nums)                         # 15
product = reduce(operator.mul, nums, 1)   # 120  (no built-in)

# reduce for arbitrary binary operations
flattened = reduce(operator.add, [[1, 2], [3, 4], [5]], [])
print(flattened)   # [1, 2, 3, 4, 5]

# But list comprehension + sum or itertools.chain is usually cleaner
from itertools import chain
list(chain.from_iterable([[1, 2], [3, 4], [5]]))`,
    explanation: "Prefer sum, max, min, and any/all over reduce when a dedicated built-in exists; reduce is the right tool for arbitrary fold operations like products or nested concatenation.",
  },
  {
    id: "py-0519-abc-abstract",
    language: "python",
    title: "ABC with abstractmethod — enforced interface",
    tag: "classes",
    code: `from abc import ABC, abstractmethod

class Shape(ABC):
    @abstractmethod
    def area(self) -> float: ...

    @abstractmethod
    def perimeter(self) -> float: ...

    def describe(self) -> str:          # concrete method
        return f"area={self.area():.2f}"

class Circle(Shape):
    def __init__(self, r): self.r = r
    def area(self): return 3.14159 * self.r ** 2
    def perimeter(self): return 2 * 3.14159 * self.r

# Shape()  # TypeError: can't instantiate abstract class`,
    explanation: "Subclassing ABC and decorating methods with @abstractmethod prevents instantiation of any class that doesn't implement every abstract method — a compile-time-like safety net.",
  },
  {
    id: "py-0519-slots",
    language: "python",
    title: "__slots__ to reduce memory per instance",
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

d = WithDict(1, 2)
s = WithSlots(1, 2)

print(sys.getsizeof(d) + sys.getsizeof(d.__dict__))  # ~232 bytes
print(sys.getsizeof(s))                               # ~56 bytes`,
    explanation: "__slots__ replaces the per-instance __dict__ with a fixed set of descriptors; it saves ~4-8x memory per instance and speeds up attribute access at the cost of no dynamic attributes.",
  },
  {
    id: "py-0519-property",
    language: "python",
    title: "property: getter, setter, deleter",
    tag: "classes",
    code: `class Temperature:
    def __init__(self, celsius: float):
        self._celsius = celsius

    @property
    def celsius(self) -> float:
        return self._celsius

    @celsius.setter
    def celsius(self, value: float):
        if value < -273.15:
            raise ValueError("Below absolute zero")
        self._celsius = value

    @property
    def fahrenheit(self) -> float:
        return self._celsius * 9/5 + 32

t = Temperature(100)
print(t.fahrenheit)   # 212.0
t.celsius = -300      # ValueError`,
    explanation: "property turns method calls into attribute-style access; adding a setter enables validation without changing the calling convention from the user's perspective.",
  },
  {
    id: "py-0519-classmethod",
    language: "python",
    title: "classmethod as an alternate constructor",
    tag: "classes",
    code: `class Date:
    def __init__(self, year, month, day):
        self.year, self.month, self.day = year, month, day

    @classmethod
    def from_string(cls, s: str) -> "Date":
        y, m, d = map(int, s.split("-"))
        return cls(y, m, d)   # cls, not Date — works with subclasses

    @classmethod
    def today(cls) -> "Date":
        import datetime
        t = datetime.date.today()
        return cls(t.year, t.month, t.day)

d = Date.from_string("2026-05-19")
print(d.year, d.month, d.day)  # 2026 5 19`,
    explanation: "classmethod receives the class (not instance) as its first argument, making it the standard pattern for alternative constructors that handle different input formats.",
  },
  {
    id: "py-0519-staticmethod",
    language: "python",
    title: "staticmethod vs module-level function",
    tag: "classes",
    code: `class MathUtils:
    @staticmethod
    def clamp(value, lo, hi):
        return max(lo, min(hi, value))

    @staticmethod
    def lerp(a, b, t):
        return a + (b - a) * t

print(MathUtils.clamp(15, 0, 10))  # 10
print(MathUtils.lerp(0, 100, 0.25))  # 25.0

# staticmethod receives no implicit first arg (no self/cls)
# Use it when the function logically belongs to the class
# but doesn't need access to the instance or class`,
    explanation: "staticmethod is a plain function that lives in a class namespace for organisational reasons; prefer it over classmethod when you don't need cls or self.",
  },
  {
    id: "py-0519-context-manager",
    language: "python",
    title: "__enter__ / __exit__ for context managers",
    tag: "classes",
    code: `class Timer:
    import time

    def __enter__(self):
        self.start = self.time.perf_counter()
        return self          # what 'as' receives

    def __exit__(self, exc_type, exc_val, exc_tb):
        elapsed = self.time.perf_counter() - self.start
        print(f"Elapsed: {elapsed:.4f}s")
        return False         # False = don't suppress exceptions

with Timer() as t:
    sum(range(1_000_000))   # Elapsed: 0.0123s`,
    explanation: "__enter__ runs when entering the with block and its return value is bound by as; __exit__ runs on exit and can suppress exceptions by returning True.",
  },
  {
    id: "py-0519-getitem",
    language: "python",
    title: "__getitem__ and __setitem__ for subscript access",
    tag: "classes",
    code: `class Matrix:
    def __init__(self, rows, cols):
        self.data = [[0.0] * cols for _ in range(rows)]

    def __getitem__(self, key):
        row, col = key
        return self.data[row][col]

    def __setitem__(self, key, value):
        row, col = key
        self.data[row][col] = value

m = Matrix(3, 3)
m[0, 1] = 5.0
print(m[0, 1])   # 5.0`,
    explanation: "__getitem__ and __setitem__ enable obj[key] and obj[key] = value syntax; when the key is a tuple (like m[0,1]), Python passes the whole tuple as a single argument.",
  },
  {
    id: "py-0519-repr-str",
    language: "python",
    title: "__repr__ vs __str__ — developer vs user output",
    tag: "classes",
    code: `class Point:
    def __init__(self, x, y):
        self.x, self.y = x, y

    def __repr__(self):
        # Should be unambiguous; ideally eval()-able
        return f"Point({self.x!r}, {self.y!r})"

    def __str__(self):
        # Should be readable for end users
        return f"({self.x}, {self.y})"

p = Point(1, 2)
print(repr(p))   # Point(1, 2)
print(str(p))    # (1, 2)
print(p)         # (1, 2)  — str() used by print
print([p])       # [Point(1, 2)]  — repr() used in containers`,
    explanation: "__repr__ is for developers (shown in REPL, logs, containers) and should be unambiguous; __str__ is for end users and is called by print — if only one is defined, __repr__ is used as fallback.",
  },
  {
    id: "py-0519-eq-hash",
    language: "python",
    title: "__eq__ and __hash__ must be consistent",
    tag: "classes",
    code: `class Point:
    def __init__(self, x, y):
        self.x, self.y = x, y

    def __eq__(self, other):
        if not isinstance(other, Point):
            return NotImplemented
        return self.x == other.x and self.y == other.y

    def __hash__(self):
        # Objects that compare equal must have the same hash
        return hash((self.x, self.y))

p1 = Point(1, 2)
p2 = Point(1, 2)
print(p1 == p2)          # True
print(hash(p1) == hash(p2))  # True
print({p1, p2})          # {Point} — deduped correctly`,
    explanation: "If you define __eq__, Python sets __hash__ to None by default (making instances unhashable); you must also define __hash__ for objects that should be usable in sets or as dict keys.",
  },
  {
    id: "py-0519-descriptor",
    language: "python",
    title: "Descriptor protocol: __get__ / __set__",
    tag: "classes",
    code: `class Validated:
    def __set_name__(self, owner, name):
        self.name = name

    def __get__(self, obj, objtype=None):
        if obj is None:
            return self
        return obj.__dict__.get(self.name)

    def __set__(self, obj, value):
        if not isinstance(value, (int, float)):
            raise TypeError(f"{self.name} must be numeric")
        obj.__dict__[self.name] = value

class Circle:
    radius = Validated()   # descriptor instance as class attribute

c = Circle()
c.radius = 5.0    # OK
# c.radius = "big"  # TypeError`,
    explanation: "A descriptor is any object defining __get__ or __set__; when assigned as a class attribute it intercepts all access through that name on instances, powering property, classmethod, and staticmethod.",
  },
  {
    id: "py-0519-metaclass",
    language: "python",
    title: "Metaclass basics — class of a class",
    tag: "classes",
    code: `class SingletonMeta(type):
    _instances = {}

    def __call__(cls, *args, **kwargs):
        if cls not in cls._instances:
            cls._instances[cls] = super().__call__(*args, **kwargs)
        return cls._instances[cls]

class Config(metaclass=SingletonMeta):
    def __init__(self):
        self.debug = False

a = Config()
b = Config()
print(a is b)   # True — same instance`,
    explanation: "A metaclass is the class of a class; by overriding __call__ or __new__ you control how class instantiation works, enabling patterns like Singleton without decorator boilerplate.",
  },
  {
    id: "py-0519-init-subclass",
    language: "python",
    title: "__init_subclass__ — hook called when a subclass is defined",
    tag: "classes",
    code: `class Plugin:
    _registry = {}

    def __init_subclass__(cls, name=None, **kwargs):
        super().__init_subclass__(**kwargs)
        key = name or cls.__name__.lower()
        Plugin._registry[key] = cls

class JsonPlugin(Plugin, name="json"):
    pass

class CsvPlugin(Plugin, name="csv"):
    pass

print(Plugin._registry)
# {'json': <class 'JsonPlugin'>, 'csv': <class 'CsvPlugin'>}`,
    explanation: "__init_subclass__ is called on the parent class each time it is subclassed; it's the clean way to auto-register subclasses without a metaclass.",
  },
  {
    id: "py-0519-dc-field",
    language: "python",
    title: "dataclass field() for defaults and metadata",
    tag: "classes",
    code: `from dataclasses import dataclass, field

@dataclass
class Order:
    items: list = field(default_factory=list)  # mutable default
    total: float = 0.0
    tags: set = field(default_factory=set, repr=False)
    _id: int = field(default=0, init=False, repr=False)  # not in __init__

o1 = Order()
o2 = Order()
o1.items.append("book")
print(o2.items)   # []  — each instance gets its own list`,
    explanation: "field(default_factory=) is required for mutable defaults (lists, dicts, sets) in dataclasses; it calls the factory for each new instance rather than sharing one object.",
  },
  {
    id: "py-0519-class-getitem",
    language: "python",
    title: "__class_getitem__ for generic-style subscript",
    tag: "classes",
    code: `class Stack:
    def __class_getitem__(cls, item):
        # Return a new class or a generic alias
        return type(f"Stack[{item.__name__}]", (cls,), {})

# Enables Stack[int] syntax at runtime
IntStack = Stack[int]
print(IntStack.__name__)   # Stack[int]

# The real use: PEP 585 built-in generics use this
# list[int], dict[str, int] etc. work because
# list.__class_getitem__(int) returns a GenericAlias`,
    explanation: "__class_getitem__ is what makes built-in generics like list[int] and dict[str, int] work at runtime; implementing it lets your own classes support subscript syntax.",
  },
  {
    id: "py-0519-dunder-call",
    language: "python",
    title: "__call__ — making instances callable",
    tag: "classes",
    code: `class Multiplier:
    def __init__(self, factor):
        self.factor = factor

    def __call__(self, value):
        return value * self.factor

double = Multiplier(2)
triple = Multiplier(3)

print(double(5))    # 10
print(triple(7))    # 21

# Callable instances work anywhere a function is expected
nums = [1, 2, 3, 4]
print(list(map(double, nums)))  # [2, 4, 6, 8]

print(callable(double))  # True`,
    explanation: "__call__ makes instances behave like functions; this is useful for stateful callables (like memoized functions or configurable transformers) that need to persist state between calls.",
  },
];
