import type { Snippet } from "./types";

export const pythonSnippets20260517B1: Snippet[] = [
  // === snippet ===
  {
    id: "py-b17-b1-walrus-while",
    language: "python",
    title: "Walrus operator in while loop",
    tag: "snippet",
    code: `import re

text = "scores: 42 99 7"
pattern = re.compile(r"\\d+")
pos, numbers = 0, []
while m := pattern.search(text, pos):
    numbers.append(int(m.group()))
    pos = m.end()
print(numbers)  # [42, 99, 7]`,
    explanation: "The walrus operator `:=` assigns and tests in one expression, letting a while loop consume a stream of regex matches without a pre-assignment.",
  },
  {
    id: "py-b17-b1-star-unpack-middle",
    language: "python",
    title: "Star expression captures middle elements",
    tag: "snippet",
    code: `first, *middle, last = [10, 20, 30, 40, 50]
print(first)   # 10
print(middle)  # [20, 30, 40]
print(last)    # 50

head, *tail = "hello"
print(head)  # h
print(tail)  # ['e', 'l', 'l', 'o']`,
    explanation: "A `*name` target in unpacking absorbs any number of items (as a list) from that position, making it easy to split sequences without slicing.",
  },
  {
    id: "py-b17-b1-dict-merge-pipe",
    language: "python",
    title: "Dict merge with | and |= operators",
    tag: "snippet",
    code: `defaults = {"color": "blue", "size": 10}
overrides = {"size": 20, "weight": 5}

merged = defaults | overrides
print(merged)  # {'color': 'blue', 'size': 20, 'weight': 5}

# In-place update
defaults |= overrides
print(defaults)  # {'color': 'blue', 'size': 20, 'weight': 5}`,
    explanation: "`|` creates a new merged dict (right side wins on conflicts) while `|=` updates in place — both are cleaner alternatives to `{**a, **b}` for dict merging.",
  },
  {
    id: "py-b17-b1-zip-strict",
    language: "python",
    title: "zip with strict=True catches length mismatches",
    tag: "snippet",
    code: `keys = ["a", "b", "c"]
vals = [1, 2, 3]

for k, v in zip(keys, vals, strict=True):
    print(k, v)

# Mismatched lengths raise ValueError immediately:
# zip([1, 2], [3], strict=True)  # ValueError: zip() has arguments with different lengths`,
    explanation: "`zip(..., strict=True)` raises `ValueError` if the iterables have different lengths, preventing silent data loss from the default truncation behaviour.",
  },
  {
    id: "py-b17-b1-slice-assign",
    language: "python",
    title: "Slice assignment replaces a range in-place",
    tag: "snippet",
    code: `nums = [1, 2, 3, 4, 5]

# Replace elements 1–2 with a longer sequence
nums[1:3] = [20, 30, 40]
print(nums)  # [1, 20, 30, 40, 4, 5]

# Delete a slice
nums[2:4] = []
print(nums)  # [1, 20, 4, 5]`,
    explanation: "Slice assignment can insert, replace, or delete elements without creating a new list — the list is mutated in-place and the slice target can even grow or shrink.",
  },
  {
    id: "py-b17-b1-enumerate-start",
    language: "python",
    title: "enumerate with a custom start value",
    tag: "snippet",
    code: `fruits = ["apple", "banana", "cherry"]

# 1-based numbering for display
for n, fruit in enumerate(fruits, start=1):
    print(f"{n}. {fruit}")

# Output:
# 1. apple
# 2. banana
# 3. cherry`,
    explanation: "`enumerate(iterable, start=N)` offsets the counter, useful whenever you want 1-based indices or continuation from a previous count.",
  },
  {
    id: "py-b17-b1-chained-comparisons",
    language: "python",
    title: "Chained comparisons evaluate left-to-right",
    tag: "snippet",
    code: `x = 5

# Equivalent to: 1 < x and x < 10
print(1 < x < 10)   # True

# Short-circuits: middle term evaluated once
y = 7
print(0 < y < 5 < 10)  # False (y < 5 is False)

# Works with any mix of operators
print(1 <= x == 5 < 10)  # True`,
    explanation: "Python lets you chain comparisons like `a < b < c`; each middle expression is evaluated exactly once and the whole chain short-circuits as soon as one comparison is false.",
  },
  {
    id: "py-b17-b1-removeprefix",
    language: "python",
    title: "str.removeprefix — safe prefix stripping",
    tag: "snippet",
    code: `url = "https://example.com"

# lstrip would strip individual chars, not a whole prefix
print(url.lstrip("https://"))  # 'example.com' — works here but is wrong!
print("shttp".lstrip("https://"))  # ''  ← strips too many chars

# removeprefix is exact
print(url.removeprefix("https://"))   # 'example.com'
print(url.removeprefix("ftp://"))     # 'https://example.com' (unchanged)`,
    explanation: "`str.removeprefix(prefix)` strips the exact prefix string only if present; unlike `lstrip`, it won't nibble individual characters that happen to appear in the prefix.",
  },
  {
    id: "py-b17-b1-removesuffix",
    language: "python",
    title: "str.removesuffix — safe suffix stripping",
    tag: "snippet",
    code: `filename = "report.pdf"

print(filename.removesuffix(".pdf"))  # 'report'
print(filename.removesuffix(".txt"))  # 'report.pdf' (unchanged)

# Strip extension safely in a loop
files = ["a.py", "b.txt", "c.py"]
py_names = [f.removesuffix(".py") for f in files if f.endswith(".py")]
print(py_names)  # ['a', 'c']`,
    explanation: "`str.removesuffix(suffix)` removes the exact suffix string only when it's present, making file-extension stripping reliable without slicing by a fixed negative index.",
  },
  {
    id: "py-b17-b1-fstring-format-spec",
    language: "python",
    title: "f-string format spec: fill, align, width",
    tag: "snippet",
    code: `value = 42
pi = 3.14159

print(f"{value:>10}")    # '        42'  right-align in 10 chars
print(f"{value:<10}")    # '42        '  left-align
print(f"{value:0>6}")    # '000042'      zero-fill
print(f"{pi:.2f}")       # '3.14'        2 decimal places
print(f"{pi:10.2f}")     # '      3.14'  width + precision`,
    explanation: "f-string format specs follow `{value:[[fill]align][width][.precision][type]}`, allowing rich number and text formatting without a separate format call.",
  },
  {
    id: "py-b17-b1-any-generator",
    language: "python",
    title: "any() with a generator short-circuits",
    tag: "snippet",
    code: `nums = [4, 7, 2, 9, 1]

# Short-circuits at 7 — never checks 2, 9, 1
result = any(n > 5 for n in nums)
print(result)  # True

# any() on empty iterable
print(any(n > 0 for n in []))  # False`,
    explanation: "`any(gen)` returns `True` as soon as the generator yields a truthy value, so it avoids evaluating the rest of the sequence — unlike building a list first.",
  },
  {
    id: "py-b17-b1-all-generator",
    language: "python",
    title: "all() with a generator short-circuits",
    tag: "snippet",
    code: `def is_valid(s: str) -> bool:
    return s.isalpha() and len(s) > 0

words = ["hello", "world", "ok"]

# Short-circuits at first failure
print(all(is_valid(w) for w in words))  # True

# all() on empty iterable returns True
print(all(False for _ in []))  # True`,
    explanation: "`all(gen)` returns `False` the moment the generator yields a falsy value; an empty iterable always returns `True` (vacuous truth).",
  },
  {
    id: "py-b17-b1-sorted-key-lambda",
    language: "python",
    title: "sorted() with a key function",
    tag: "snippet",
    code: `people = [("Alice", 30), ("Bob", 25), ("Carol", 35)]

# Sort by age (index 1)
by_age = sorted(people, key=lambda p: p[1])
print(by_age)  # [('Bob', 25), ('Alice', 30), ('Carol', 35)]

# Sort strings case-insensitively
words = ["Banana", "apple", "Cherry"]
print(sorted(words, key=str.lower))  # ['apple', 'Banana', 'Cherry']`,
    explanation: "`sorted()`'s `key` parameter takes a one-argument callable that extracts the comparison value, keeping the original objects untouched while controlling sort order.",
  },
  {
    id: "py-b17-b1-min-default",
    language: "python",
    title: "min() with default avoids empty-sequence error",
    tag: "snippet",
    code: `nums = [3, 1, 4, 1, 5]
print(min(nums))            # 1

empty = []
# Without default: ValueError
# print(min(empty))

# With default: safe fallback
print(min(empty, default=0))  # 0
print(max(empty, default=-1)) # -1`,
    explanation: "`min()` and `max()` raise `ValueError` on empty sequences, but the `default=` keyword argument provides a fallback value instead of raising.",
  },
  {
    id: "py-b17-b1-attrgetter-sort",
    language: "python",
    title: "operator.attrgetter as sort key",
    tag: "snippet",
    code: `from operator import attrgetter
from dataclasses import dataclass

@dataclass
class Employee:
    name: str
    salary: float

staff = [Employee("Bob", 70000), Employee("Alice", 90000), Employee("Carol", 80000)]
by_salary = sorted(staff, key=attrgetter("salary"))
print([e.name for e in by_salary])  # ['Bob', 'Carol', 'Alice']`,
    explanation: "`operator.attrgetter('attr')` returns a callable that fetches a named attribute, making it a fast, readable alternative to `lambda obj: obj.attr` as a sort key.",
  },
  // === understanding ===
  {
    id: "py-b17-b1-closure-loop-var",
    language: "python",
    title: "Closure captures loop variable by reference",
    tag: "understanding",
    code: `funcs = []
for i in range(3):
    funcs.append(lambda: i)  # captures the variable i, not its value

print([f() for f in funcs])  # [2, 2, 2]  ← all see final i

# Fix: capture the value with a default argument
funcs2 = []
for i in range(3):
    funcs2.append(lambda i=i: i)

print([f() for f in funcs2])  # [0, 1, 2]`,
    explanation: "Lambdas (and nested functions) close over variables, not values — all three closures share the same `i`, which equals 2 by the time any of them is called.",
  },
  {
    id: "py-b17-b1-int-identity-range",
    language: "python",
    title: "Integer identity: CPython caches -5 to 256",
    tag: "understanding",
    code: `a, b = 100, 100
print(a is b)   # True  — same cached object

x, y = 1000, 1000
print(x is y)   # False — different objects (outside cache range)

# Interning via literals in the same code unit can vary:
z = 1000; w = 1000
print(z is w)   # True in CPython interactive, False in some contexts`,
    explanation: "CPython pre-allocates integers from -5 to 256, so `is` comparisons between small integers appear to work — but relying on `is` for value equality is undefined behaviour for larger numbers.",
  },
  {
    id: "py-b17-b1-string-intern",
    language: "python",
    title: "String interning surprises with is",
    tag: "understanding",
    code: `a = "hello"
b = "hello"
print(a is b)   # True  — CPython interns short identifier-like strings

c = "hello world"
d = "hello world"
print(c is d)   # True in CPython (compile-time constant folding)

e = "hello" + " world"   # runtime construction
f = "hello world"
print(e is f)   # False (usually) — runtime objects aren't interned`,
    explanation: "CPython interns string literals that look like identifiers and folds compile-time constants, making `is` tests accidentally pass — always use `==` to compare string values.",
  },
  {
    id: "py-b17-b1-late-binding-defaults",
    language: "python",
    title: "Late binding: default arg expressions evaluated at def time",
    tag: "understanding",
    code: `import time

# Expression is evaluated ONCE when def is executed
def log(msg, ts=time.time()):
    print(f"{ts:.0f}: {msg}")

time.sleep(0.1)
log("first")   # same timestamp as when function was defined
log("second")  # same timestamp — not the current time!

# Fix: use None sentinel
def log2(msg, ts=None):
    if ts is None:
        ts = time.time()
    print(f"{ts:.0f}: {msg}")`,
    explanation: "Default argument values are evaluated exactly once when the `def` statement executes, so mutable or time-varying defaults like `[]` or `time.time()` are shared across all calls.",
  },
  {
    id: "py-b17-b1-nan-not-equal",
    language: "python",
    title: "NaN is not equal to itself",
    tag: "understanding",
    code: `import math

nan = float("nan")

print(nan == nan)   # False  — IEEE 754 rule
print(nan != nan)   # True
print(nan is nan)   # True   — same object in memory!

# Correct NaN test:
print(math.isnan(nan))   # True
print(nan != nan)        # True (also works, but less readable)`,
    explanation: "IEEE 754 defines NaN as not equal to anything, including itself — `x != x` is the only comparison that's always true for NaN, but `math.isnan()` is the readable choice.",
  },
  {
    id: "py-b17-b1-float-sum-precision",
    language: "python",
    title: "Floating-point addition is not associative",
    tag: "understanding",
    code: `a, b, c = 0.1, 0.2, 0.3

print(a + b)           # 0.30000000000000004
print((a + b) == c)    # False

# math.fsum uses extended precision accumulation
import math
print(math.fsum([0.1, 0.2]))  # 0.3  (correctly rounded)

# For financial data use Decimal:
from decimal import Decimal
print(Decimal("0.1") + Decimal("0.2"))  # 0.3`,
    explanation: "Binary floating-point can't represent 0.1 or 0.2 exactly, so adding them produces a small rounding error; `math.fsum` and `Decimal` are the remedies for precision-sensitive code.",
  },
  {
    id: "py-b17-b1-legb-rule",
    language: "python",
    title: "LEGB scope lookup order",
    tag: "understanding",
    code: `x = "global"

def outer():
    x = "enclosing"
    def inner():
        # x = "local"   # uncomment to shadow enclosing x
        print(x)        # 'enclosing' (E before G)
    inner()

outer()   # enclosing

def shadow():
    x = "local"
    print(x)   # local (L before E/G)

shadow()`,
    explanation: "Python resolves names in the order Local → Enclosing → Global → Built-in (LEGB); a name found in an inner scope shadows the same name in any outer scope.",
  },
  {
    id: "py-b17-b1-mutable-default-mutation",
    language: "python",
    title: "Mutable default argument accumulates state",
    tag: "understanding",
    code: `def append_to(item, lst=[]):   # lst created ONCE
    lst.append(item)
    return lst

print(append_to(1))  # [1]
print(append_to(2))  # [1, 2]  ← not a fresh list!
print(append_to(3))  # [1, 2, 3]

# Inspect the default directly:
print(append_to.__defaults__)  # ([1, 2, 3],)`,
    explanation: "The `[]` default is created once when the `def` executes; every call that omits `lst` shares the same list object, so mutations accumulate across calls.",
  },
  {
    id: "py-b17-b1-list-multiply-alias",
    language: "python",
    title: "List multiplication creates aliases, not copies",
    tag: "understanding",
    code: `# Flat values: fine (immutable)
zeros = [0] * 4
print(zeros)  # [0, 0, 0, 0]

# Inner lists: ALL are the SAME object
matrix = [[0] * 3] * 3
matrix[0][1] = 99
print(matrix)
# [[0, 99, 0], [0, 99, 0], [0, 99, 0]]  ← all rows changed!

# Fix: list comprehension creates separate lists
matrix2 = [[0] * 3 for _ in range(3)]`,
    explanation: "Multiplying a list containing a mutable object repeats the *reference*, so all rows point to the same inner list — a list comprehension creates independent objects.",
  },
  {
    id: "py-b17-b1-global-keyword",
    language: "python",
    title: "global keyword lets a function rebind a module-level name",
    tag: "understanding",
    code: `count = 0

def increment():
    global count      # without this, assignment would create a local
    count += 1

increment()
increment()
print(count)  # 2

def broken():
    count += 1  # UnboundLocalError: referenced before assignment

# broken()  # would raise`,
    explanation: "Without `global count`, an assignment inside a function creates a *new local* called `count`, making any read of the same name before assignment an `UnboundLocalError`.",
  },
  {
    id: "py-b17-b1-nonlocal-keyword",
    language: "python",
    title: "nonlocal lets inner functions rebind enclosing variables",
    tag: "understanding",
    code: `def make_counter():
    count = 0
    def inc():
        nonlocal count     # rebind enclosing scope's count
        count += 1
        return count
    return inc

c = make_counter()
print(c())  # 1
print(c())  # 2
print(c())  # 3`,
    explanation: "`nonlocal` lets a nested function *assign* to a name in an enclosing (non-global) scope; without it, the assignment would create a shadowing local instead.",
  },
  {
    id: "py-b17-b1-yield-from",
    language: "python",
    title: "yield from delegates to a sub-generator",
    tag: "understanding",
    code: `def inner():
    yield 1
    yield 2
    return "done"     # return value is received by yield from

def outer():
    result = yield from inner()   # yields 1, 2; result = "done"
    yield f"inner returned: {result}"

print(list(outer()))  # [1, 2, 'inner returned: done']`,
    explanation: "`yield from subgen` transparently forwards values from the sub-generator and also captures its `StopIteration` return value, enabling generator delegation without manual forwarding loops.",
  },
  {
    id: "py-b17-b1-generator-exhaustion",
    language: "python",
    title: "Generators are exhausted after one pass",
    tag: "understanding",
    code: `def nums():
    yield 1
    yield 2
    yield 3

gen = nums()
print(list(gen))   # [1, 2, 3]
print(list(gen))   # []  ← already exhausted

# Generator expressions too:
squares = (x*x for x in range(4))
total1 = sum(squares)   # 14
total2 = sum(squares)   # 0 — exhausted!`,
    explanation: "A generator object can only be iterated once; after it raises `StopIteration`, subsequent iterations return nothing — pass it through `list()` or iterate multiple times by calling the factory again.",
  },
  {
    id: "py-b17-b1-class-body-scope",
    language: "python",
    title: "Class body scope is not inherited by methods",
    tag: "understanding",
    code: `x = "global"

class MyClass:
    x = "class"
    items = [x for _ in range(3)]   # list comp uses class scope
    # items2 = [x for x in range(3)]  # would shadow class x in py3

    def method(self):
        # print(x)  # sees 'global', NOT 'class'!
        print(self.__class__.x)   # 'class'

obj = MyClass()
obj.method()
print(MyClass.items)  # ['class', 'class', 'class']`,
    explanation: "The class body is executed in its own namespace but methods see *global* scope, not the class namespace — so `x` inside a method means the module-level `x`, not `MyClass.x`.",
  },
  // === structures ===
  {
    id: "py-b17-b1-deque-maxlen",
    language: "python",
    title: "deque with maxlen as a sliding window",
    tag: "structures",
    code: `from collections import deque

# Fixed-size window — oldest element auto-dropped
window = deque(maxlen=3)
for val in [10, 20, 30, 40, 50]:
    window.append(val)
    print(list(window))
# [10]
# [10, 20]
# [10, 20, 30]
# [20, 30, 40]   ← 10 dropped
# [30, 40, 50]   ← 20 dropped`,
    explanation: "A `deque(maxlen=N)` automatically discards the oldest element from the opposite end when a new item is appended, making it a zero-boilerplate sliding window.",
  },
  {
    id: "py-b17-b1-counter-arithmetic",
    language: "python",
    title: "Counter supports arithmetic between counters",
    tag: "structures",
    code: `from collections import Counter

a = Counter("aabbc")
b = Counter("abcd")

print(a + b)   # Counter({'b': 3, 'a': 3, 'c': 2, 'd': 1})
print(a - b)   # Counter({'a': 1, 'b': 1})  — negative counts dropped
print(a & b)   # Counter({'a': 1, 'b': 2, 'c': 1})  — min
print(a | b)   # Counter({'b': 2, 'a': 2, 'c': 1, 'd': 1})  — max`,
    explanation: "`Counter` arithmetic combines two histograms: `+` sums counts, `-` subtracts (dropping negatives), `&` takes element-wise minimums, `|` takes element-wise maximums.",
  },
  {
    id: "py-b17-b1-defaultdict-list",
    language: "python",
    title: "defaultdict(list) for grouping without setdefault",
    tag: "structures",
    code: `from collections import defaultdict

words = ["apple", "ant", "banana", "bear", "cherry"]
by_letter = defaultdict(list)
for word in words:
    by_letter[word[0]].append(word)

print(dict(by_letter))
# {'a': ['apple', 'ant'], 'b': ['banana', 'bear'], 'c': ['cherry']}`,
    explanation: "`defaultdict(list)` creates a new empty list automatically when a missing key is accessed, eliminating the `setdefault` boilerplate needed with a plain dict.",
  },
  {
    id: "py-b17-b1-chainmap-lookup",
    language: "python",
    title: "ChainMap searches multiple dicts in order",
    tag: "structures",
    code: `from collections import ChainMap

defaults = {"color": "blue", "size": 10, "debug": False}
config   = {"color": "red"}
cli_args = {"debug": True}

# cli_args > config > defaults
merged = ChainMap(cli_args, config, defaults)
print(merged["color"])  # red   (from config)
print(merged["size"])   # 10    (from defaults)
print(merged["debug"])  # True  (from cli_args)`,
    explanation: "`ChainMap` wraps multiple dicts and searches them left-to-right, giving a layered-config pattern without copying or merging the source dicts.",
  },
  {
    id: "py-b17-b1-heapq-nlargest",
    language: "python",
    title: "heapq.nlargest and nsmallest",
    tag: "structures",
    code: `import heapq

scores = [34, 98, 71, 45, 88, 62, 99, 13]

top3 = heapq.nlargest(3, scores)
print(top3)   # [99, 98, 88]

bottom3 = heapq.nsmallest(3, scores)
print(bottom3)  # [13, 34, 45]

# With a key function:
words = ["banana", "fig", "apple", "kiwi"]
print(heapq.nsmallest(2, words, key=len))  # ['fig', 'fig'] no — ['fig', 'kiwi']`,
    explanation: "`heapq.nlargest(n, iterable)` is more efficient than `sorted(..., reverse=True)[:n]` for small `n` relative to the collection size, using a heap of size `n`.",
  },
  {
    id: "py-b17-b1-bisect-insort",
    language: "python",
    title: "bisect.insort maintains a sorted list",
    tag: "structures",
    code: `import bisect

sorted_nums = [10, 20, 30, 50]

bisect.insort(sorted_nums, 25)
print(sorted_nums)   # [10, 20, 25, 30, 50]

bisect.insort(sorted_nums, 10)   # duplicate allowed
print(sorted_nums)   # [10, 10, 20, 25, 30, 50]

# Binary search — O(log n)
pos = bisect.bisect_left(sorted_nums, 25)
print(pos)  # 3`,
    explanation: "`bisect.insort` inserts in O(log n) search + O(n) shift, keeping the list sorted; pair it with `bisect.bisect_left/right` for O(log n) lookups.",
  },
  {
    id: "py-b17-b1-array-typed-buffer",
    language: "python",
    title: "array.array: typed, compact sequence",
    tag: "structures",
    code: `import array, sys

py_list = list(range(1000))
typed_arr = array.array("i", range(1000))   # 'i' = signed int

print(sys.getsizeof(py_list))    # ~8056 bytes
print(sys.getsizeof(typed_arr))  # ~4064 bytes

typed_arr.append(1000)
typed_arr.extend([1001, 1002])
print(typed_arr[-3:])  # array('i', [1000, 1001, 1002])`,
    explanation: "`array.array` stores elements as raw C-typed values (no Python object overhead), roughly halving memory vs a list for numeric data — use it when you need a compact mutable sequence but not NumPy.",
  },
  {
    id: "py-b17-b1-namedtuple-ops",
    language: "python",
    title: "NamedTuple _replace and _asdict",
    tag: "structures",
    code: `from typing import NamedTuple

class Point(NamedTuple):
    x: float
    y: float
    label: str = ""

p = Point(1.0, 2.0, "origin")
print(p.x, p.label)   # 1.0 origin

# _replace creates a NEW tuple with changed fields
p2 = p._replace(y=5.0)
print(p2)   # Point(x=1.0, y=5.0, label='origin')

print(p._asdict())  # {'x': 1.0, 'y': 2.0, 'label': 'origin'}`,
    explanation: "`_replace` returns a new `NamedTuple` with specified fields changed (tuples are immutable), and `_asdict` converts to an `OrderedDict` for easy serialization.",
  },
  {
    id: "py-b17-b1-dataclass-field-factory",
    language: "python",
    title: "dataclass field with default_factory",
    tag: "structures",
    code: `from dataclasses import dataclass, field

@dataclass
class Bag:
    name: str
    items: list = field(default_factory=list)   # new list per instance
    meta: dict = field(default_factory=dict)

a = Bag("A")
b = Bag("B")
a.items.append(1)

print(a.items)  # [1]
print(b.items)  # []  ← separate list, not shared!`,
    explanation: "`field(default_factory=list)` calls `list()` for each new instance, avoiding the mutable-default pitfall where all instances would share the same container.",
  },
  {
    id: "py-b17-b1-typeddict-usage",
    language: "python",
    title: "TypedDict for typed dict schemas",
    tag: "structures",
    code: `from typing import TypedDict, NotRequired

class Movie(TypedDict):
    title: str
    year: int
    rating: NotRequired[float]   # optional key

m: Movie = {"title": "Dune", "year": 2021}  # valid, no rating
m2: Movie = {"title": "Dune", "year": 2021, "rating": 8.0}

# Type checkers flag missing required keys or wrong types
print(m["title"])   # Dune`,
    explanation: "`TypedDict` lets you annotate the expected keys and value types of a dict so type checkers can validate usage — unlike `dataclass`, instances remain plain dicts at runtime.",
  },
  {
    id: "py-b17-b1-queue-lifo",
    language: "python",
    title: "queue.LifoQueue as a thread-safe stack",
    tag: "structures",
    code: `from queue import LifoQueue

stack = LifoQueue()
stack.put("first")
stack.put("second")
stack.put("third")

print(stack.get())  # third  (LIFO)
print(stack.get())  # second
print(stack.qsize()) # 1`,
    explanation: "`queue.LifoQueue` is a thread-safe LIFO stack with `put/get` blocking semantics, useful for producer-consumer patterns where the order matters and multiple threads are involved.",
  },
  {
    id: "py-b17-b1-weakref-value-dict",
    language: "python",
    title: "WeakValueDictionary lets values be garbage-collected",
    tag: "structures",
    code: `import weakref

class Resource:
    def __init__(self, name): self.name = name

cache = weakref.WeakValueDictionary()
r = Resource("db-conn")
cache["conn"] = r
print(cache.get("conn"))  # <Resource ...>

del r             # no other strong references
import gc; gc.collect()
print(cache.get("conn"))  # None — entry removed automatically`,
    explanation: "`WeakValueDictionary` holds weak references to values, so cached objects are automatically evicted when no other code holds a strong reference — ideal for object caches that shouldn't prevent GC.",
  },
  {
    id: "py-b17-b1-shelve-persist",
    language: "python",
    title: "shelve: persistent dict-like storage",
    tag: "structures",
    code: `import shelve, os

# Write
with shelve.open("/tmp/mydb") as db:
    db["user"] = {"name": "Alice", "score": 99}
    db["count"] = 42

# Read back in a new context
with shelve.open("/tmp/mydb") as db:
    print(db["user"])   # {'name': 'Alice', 'score': 99}
    print(db["count"])  # 42`,
    explanation: "`shelve` wraps `dbm` with a dict-like interface that transparently pickles Python objects, giving you persistent key-value storage without a database setup.",
  },
  {
    id: "py-b17-b1-ordered-dict-move",
    language: "python",
    title: "OrderedDict.move_to_end for LRU-style reordering",
    tag: "structures",
    code: `from collections import OrderedDict

od = OrderedDict([("a", 1), ("b", 2), ("c", 3)])

# Move 'a' to the end (most-recently-used position)
od.move_to_end("a")
print(list(od))  # ['b', 'c', 'a']

# Move 'a' to the front
od.move_to_end("a", last=False)
print(list(od))  # ['a', 'b', 'c']`,
    explanation: "`OrderedDict.move_to_end(key, last=True)` repositions an entry to the back or front in O(1), making it the building block for LRU-cache implementations.",
  },
  // === caveats ===
  {
    id: "py-b17-b1-mutable-default-arg",
    language: "python",
    title: "Mutable default argument — the classic gotcha",
    tag: "caveats",
    code: `def add_tag(tag, tags=[]):
    tags.append(tag)
    return tags

print(add_tag("python"))  # ['python']
print(add_tag("fast"))    # ['python', 'fast']  ← shared list!
print(add_tag.__defaults__)  # (['python', 'fast'],)

# Fix: use None as sentinel
def add_tag_safe(tag, tags=None):
    if tags is None:
        tags = []
    tags.append(tag)
    return tags`,
    explanation: "Default values are evaluated once at `def` time; a mutable default like `[]` is shared across all calls that omit the argument, so mutations accumulate invisibly.",
  },
  {
    id: "py-b17-b1-is-vs-eq-int",
    language: "python",
    title: "is vs == for integers outside the cache range",
    tag: "caveats",
    code: `a = 256
b = 256
print(a is b)   # True  — CPython caches -5..256

c = 257
d = 257
print(c is d)   # False — outside cache range, different objects
print(c == d)   # True  — value equality always works

# Lesson: NEVER use 'is' to compare integer values`,
    explanation: "`is` tests object identity, not value equality — it happens to work for small integers because CPython interns them, but breaks unpredictably for larger numbers.",
  },
  {
    id: "py-b17-b1-is-vs-eq-string",
    language: "python",
    title: "is vs == for strings — interning surprises",
    tag: "caveats",
    code: `s1 = "hello"
s2 = "hello"
print(s1 is s2)   # True  — interned by CPython

# Runtime-constructed strings are NOT interned:
prefix = "hel"
s3 = prefix + "lo"
print(s3 is s2)   # False — different objects
print(s3 == s2)   # True  — same value

import sys
s4 = sys.intern(s3)
print(s4 is s2)   # True  — forced interning`,
    explanation: "String literals may be interned by the interpreter, making `is` accidentally work, but runtime-built strings aren't — use `==` for value comparison and `sys.intern()` only for performance-critical deduplication.",
  },
  {
    id: "py-b17-b1-except-order",
    language: "python",
    title: "except clause order: more specific first",
    tag: "caveats",
    code: `class AppError(Exception): pass
class DatabaseError(AppError): pass

def risky():
    raise DatabaseError("connection failed")

try:
    risky()
except AppError:             # catches BEFORE DatabaseError
    print("caught AppError")
except DatabaseError:        # NEVER reached!
    print("caught DatabaseError")

# Output: caught AppError`,
    explanation: "Python tries `except` clauses top-to-bottom; if a parent class appears before a subclass, the parent always matches first and the subclass handler is dead code.",
  },
  {
    id: "py-b17-b1-bare-except",
    language: "python",
    title: "Bare except catches KeyboardInterrupt and SystemExit",
    tag: "caveats",
    code: `# DON'T do this:
try:
    x = int(input("number: "))
except:                      # catches EVERYTHING including Ctrl-C
    print("oops")

# DO this instead:
try:
    x = int(input("number: "))
except Exception as e:       # skips BaseException subclasses
    print(f"error: {e}")

# KeyboardInterrupt and SystemExit derive from BaseException, not Exception`,
    explanation: "A bare `except:` clause catches `BaseException`, including `KeyboardInterrupt` and `SystemExit`, making it impossible to interrupt the program — always use `except Exception:` unless you genuinely need to handle process signals.",
  },
  {
    id: "py-b17-b1-nan-comparison",
    language: "python",
    title: "NaN comparisons always return False (except !=)",
    tag: "caveats",
    code: `nan = float("nan")

print(nan < 1)    # False
print(nan > 1)    # False
print(nan == nan) # False
print(nan != nan) # True  — the only comparison that's True for NaN

# This breaks sorting:
import math
data = [3, float("nan"), 1]
# sorted(data)  # may raise or give wrong order depending on Python version

# Always sanitize NaN before sorting:
clean = [x for x in data if not math.isnan(x)]`,
    explanation: "IEEE 754 mandates that all comparisons with NaN return false except `!=`; this means NaN can silently corrupt sorted data and conditional logic — sanitize before using in comparisons.",
  },
  {
    id: "py-b17-b1-list-mult-mutable",
    language: "python",
    title: "List multiplication aliases mutable inner objects",
    tag: "caveats",
    code: `# Trap: all inner lists are the SAME object
grid = [[0] * 3] * 3
grid[0][0] = 9
print(grid)  # [[9, 0, 0], [9, 0, 0], [9, 0, 0]]  ← all changed!

# Safe: comprehension creates independent lists
grid2 = [[0] * 3 for _ in range(3)]
grid2[0][0] = 9
print(grid2)  # [[9, 0, 0], [0, 0, 0], [0, 0, 0]]  ← only first row`,
    explanation: "`[[x] * n] * m` repeats the *same inner list reference* m times; any mutation of one row mutates all rows — use a list comprehension to create independent inner lists.",
  },
  {
    id: "py-b17-b1-try-else",
    language: "python",
    title: "try/except/else: else runs only if no exception was raised",
    tag: "caveats",
    code: `def safe_divide(a, b):
    try:
        result = a / b
    except ZeroDivisionError:
        print("division by zero")
        return None
    else:
        # Only runs if try block succeeded — NOT the same as putting
        # this code after the try/except block (which also runs on except)
        print(f"result is {result}")
        return result

safe_divide(10, 2)   # result is 5.0
safe_divide(10, 0)   # division by zero`,
    explanation: "The `else` clause of a `try` block executes only when no exception was raised in the `try` body — it's the right place for code that depends on success and should not accidentally suppress errors.",
  },
  {
    id: "py-b17-b1-augmented-assign-tuple",
    language: "python",
    title: "+= on a tuple containing a list raises but still mutates",
    tag: "caveats",
    code: `t = ([1, 2], "x")

try:
    t[0] += [3]    # TypeError: 'tuple' object does not support item assignment
except TypeError as e:
    print(e)

print(t)  # ([1, 2, 3], 'x')  ← list WAS mutated despite the error!`,
    explanation: "Augmented assignment (`+=`) on a tuple item first calls `__iadd__` on the list (which succeeds and mutates it), then tries to store the result back into the tuple (which fails) — leaving the list mutated but still raising an exception.",
  },
  {
    id: "py-b17-b1-walrus-comp-scope",
    language: "python",
    title: "Walrus operator in a comprehension leaks into enclosing scope",
    tag: "caveats",
    code: `# Regular comprehension variable is scoped to the comprehension:
squares = [x**2 for x in range(5)]
# print(x)  # NameError

# Walrus operator leaks OUT of the comprehension:
filtered = [y := x for x in range(5) if x > 2]
print(filtered)  # [3, 4]
print(y)         # 4  ← last assigned value visible outside!`,
    explanation: "By design, `:=` inside a comprehension binds in the *enclosing* function or module scope (not the comprehension scope), which can cause surprising name pollution.",
  },
  {
    id: "py-b17-b1-class-vs-instance-var",
    language: "python",
    title: "Class variable vs instance variable shadowing",
    tag: "caveats",
    code: `class Counter:
    count = 0      # class variable — shared

    def increment(self):
        self.count += 1   # creates an INSTANCE variable, shadows class var

c1 = Counter()
c2 = Counter()
c1.increment()

print(c1.count)         # 1  (instance var)
print(c2.count)         # 0  (still reads class var)
print(Counter.count)    # 0  (class var unchanged)`,
    explanation: "Reading `self.count` falls through to the class variable, but `self.count += 1` creates a new instance variable that shadows the class variable — so class-level mutations need `Counter.count += 1`.",
  },
  {
    id: "py-b17-b1-del-not-guaranteed",
    language: "python",
    title: "__del__ is not guaranteed to run",
    tag: "caveats",
    code: `class Resource:
    def __del__(self):
        print("cleaned up")  # NOT a reliable cleanup hook

# Reference cycles prevent __del__ from being called promptly:
class Node:
    def __init__(self): self.sibling = None
    def __del__(self): print("Node deleted")

a = Node()
b = Node()
a.sibling = b
b.sibling = a
del a, b   # cyclic ref — __del__ may or may not be called now

# Use context managers for deterministic cleanup!`,
    explanation: "`__del__` is called when the reference count drops to zero — but cycles prevent that, and even without cycles CPython's GC timing is implementation-defined; use `__exit__` / `contextlib.closing` for reliable cleanup.",
  },
  {
    id: "py-b17-b1-python-no-int-overflow",
    language: "python",
    title: "Python integers never overflow",
    tag: "caveats",
    code: `# CPython integers have arbitrary precision:
big = 2 ** 1000
print(big)              # 10715086... (302 digits)
print(type(big))        # <class 'int'>

# Contrast with C/C++/Java/C# where int overflow wraps:
# In C:  int x = 2147483647; x++ -> -2147483648
# Python:
x = 2**31 - 1
x += 1
print(x)  # 2147483648 — no overflow, no exception`,
    explanation: "Python `int` uses arbitrary-precision arithmetic (bignum), so it never wraps or overflows — the only cost is that very large integers are slower and use more memory than fixed-width C integers.",
  },
  // === types ===
  {
    id: "py-b17-b1-int-float-coerce",
    language: "python",
    title: "int and float: automatic type coercion in arithmetic",
    tag: "types",
    code: `result = 3 + 0.5     # int + float -> float
print(result, type(result))   # 3.5 <class 'float'>

div = 7 / 2              # true division always returns float
print(div, type(div))    # 3.5 <class 'float'>

floor_div = 7 // 2       # floor division returns int (both int operands)
print(floor_div, type(floor_div))   # 3 <class 'int'>

float_floor = 7.0 // 2  # floor div with float returns float
print(float_floor)       # 3.0`,
    explanation: "Python's numeric tower automatically promotes `int` to `float` when mixed in arithmetic; `/` always returns `float` while `//` returns the same type as its operands.",
  },
  {
    id: "py-b17-b1-decimal-vs-float",
    language: "python",
    title: "Decimal vs float: when precision matters",
    tag: "types",
    code: `from decimal import Decimal, getcontext

print(0.1 + 0.2)                         # 0.30000000000000004
print(Decimal("0.1") + Decimal("0.2"))   # 0.3  (exact)

getcontext().prec = 50
print(Decimal(1) / Decimal(3))
# 0.33333333333333333333333333333333333333333333333333

# Avoid: Decimal(0.1) — inherits float imprecision
print(Decimal(0.1))  # 0.1000000000000000055511151231257827021181583404541015625`,
    explanation: "`Decimal` stores numbers as base-10 fractions and tracks significant digits, giving exact decimal arithmetic — always construct from strings (`Decimal(\"0.1\")`), not floats.",
  },
  {
    id: "py-b17-b1-fraction-exact",
    language: "python",
    title: "fractions.Fraction for exact rational arithmetic",
    tag: "types",
    code: `from fractions import Fraction

a = Fraction(1, 3)
b = Fraction(1, 6)

print(a + b)          # 1/2  (exact)
print(a * b)          # 1/18
print(float(a))       # 0.3333333333333333

# Construct from float (inherits imprecision):
print(Fraction(0.1))  # 3602879701896397/36028797018963968

# Construct from string (exact):
print(Fraction("0.1")) # 1/10`,
    explanation: "`fractions.Fraction` represents rational numbers exactly as numerator/denominator pairs, auto-reducing to lowest terms — ideal for problems where decimal or float rounding is unacceptable.",
  },
  {
    id: "py-b17-b1-complex-type",
    language: "python",
    title: "Python's built-in complex number type",
    tag: "types",
    code: `z1 = 3 + 4j
z2 = complex(1, -2)

print(z1 + z2)          # (4+2j)
print(z1 * z2)          # (11-2j)
print(abs(z1))          # 5.0  (magnitude)
print(z1.real, z1.imag) # 3.0 4.0
print(z1.conjugate())   # (3-4j)`,
    explanation: "Python has a built-in `complex` type with `j` suffix notation; arithmetic operators work naturally and `abs()` returns the modulus — no import needed for basic complex math.",
  },
  {
    id: "py-b17-b1-bool-is-int",
    language: "python",
    title: "bool is a subclass of int",
    tag: "types",
    code: `print(isinstance(True, int))  # True
print(True + True)            # 2
print(True * 5)               # 5
print(False + 1)              # 1

# Surprising list indexing:
items = ["a", "b"]
print(items[True])   # 'b'  (True == 1)
print(items[False])  # 'a'  (False == 0)

# sum() trick for counting truthy values:
data = [1, 0, 3, 0, 5]
print(sum(bool(x) for x in data))  # 3`,
    explanation: "`bool` is a subclass of `int` in Python, so `True == 1` and `False == 0`; this lets you count booleans with `sum()` but can cause subtle bugs when mixing booleans and integers.",
  },
  {
    id: "py-b17-b1-bytes-vs-str",
    language: "python",
    title: "bytes vs str: encoding and decoding",
    tag: "types",
    code: `text = "hello"
raw = text.encode("utf-8")   # str -> bytes
print(raw)                   # b'hello'
print(type(raw))             # <class 'bytes'>

back = raw.decode("utf-8")   # bytes -> str
print(back == text)          # True

# bytes supports indexing (returns int) and slicing (returns bytes):
print(raw[0])    # 104  (ord('h'))
print(raw[1:3])  # b'el'`,
    explanation: "`str` is Unicode text, `bytes` is raw binary data; `.encode()` converts text to bytes using a codec and `.decode()` reverses it — never mix them without explicit conversion.",
  },
  {
    id: "py-b17-b1-type-vs-isinstance",
    language: "python",
    title: "type() vs isinstance() for type checking",
    tag: "types",
    code: `class Animal: pass
class Dog(Animal): pass

dog = Dog()

# type() is exact — ignores inheritance
print(type(dog) is Dog)     # True
print(type(dog) is Animal)  # False  ← misses subclass!

# isinstance() includes subclasses (preferred)
print(isinstance(dog, Dog))    # True
print(isinstance(dog, Animal)) # True  ← correct OOP check

# isinstance with a tuple of types:
print(isinstance(42, (int, float)))  # True`,
    explanation: "`isinstance(obj, T)` respects the inheritance hierarchy while `type(obj) is T` requires an exact match — almost always use `isinstance` unless you explicitly want to exclude subclasses.",
  },
  {
    id: "py-b17-b1-union-pipe-syntax",
    language: "python",
    title: "Union types: X | Y syntax (Python 3.10+)",
    tag: "types",
    code: `# Old style (still valid):
from typing import Union, Optional

def greet(name: Union[str, None]) -> str:
    return f"hi {name}" if name else "hi"

# New pipe syntax (Python 3.10+):
def greet2(name: str | None) -> str:
    return f"hi {name}" if name else "hi"

# Also works in isinstance() at runtime (3.10+):
x: int | str = 42
print(isinstance(x, int | str))   # True`,
    explanation: "Python 3.10 introduced `X | Y` as syntactic sugar for `Union[X, Y]`; the same syntax works in `isinstance()` at runtime, replacing `isinstance(x, (int, str))`.",
  },
  {
    id: "py-b17-b1-type-alias",
    language: "python",
    title: "TypeAlias for readable complex annotations",
    tag: "types",
    code: `from typing import TypeAlias

# Without alias — hard to read
def process(data: dict[str, list[tuple[int, str]]]) -> None: ...

# With alias
Row: TypeAlias = tuple[int, str]
Table: TypeAlias = dict[str, list[Row]]

def process2(data: Table) -> None:
    for key, rows in data.items():
        print(key, rows)`,
    explanation: "`TypeAlias` (or just a plain assignment in Python 3.12's `type` statement) lets you name a complex type annotation for readability — the alias is just a name, not a new type.",
  },
  {
    id: "py-b17-b1-literal-type",
    language: "python",
    title: "Literal type restricts to specific values",
    tag: "types",
    code: `from typing import Literal

Direction = Literal["north", "south", "east", "west"]

def move(direction: Direction) -> None:
    print(f"moving {direction}")

move("north")   # OK
# move("up")   # type error — not in the literal set

def set_mode(mode: Literal[0, 1, 2]) -> None:
    print(f"mode {mode}")`,
    explanation: "`Literal[v1, v2, ...]` narrows a type to a specific set of values so type checkers flag any call that passes an unlisted value — useful for command strings, mode flags, and enumerations.",
  },
  {
    id: "py-b17-b1-final-annotation",
    language: "python",
    title: "Final prevents reassignment of constants",
    tag: "types",
    code: `from typing import Final

MAX_RETRIES: Final = 3
API_URL: Final[str] = "https://api.example.com"

# Type checkers will flag this:
# MAX_RETRIES = 5   # error: Cannot assign to final name

class Config:
    TIMEOUT: Final = 30    # class-level constant

# Final on instance variable — must be set in __init__
class Session:
    def __init__(self, token: str) -> None:
        self.token: Final = token`,
    explanation: "`Final` tells type checkers that a variable must not be reassigned after its initial assignment — it has no runtime effect but prevents accidental mutation of constants.",
  },
  {
    id: "py-b17-b1-typevar-basic",
    language: "python",
    title: "TypeVar for generic functions",
    tag: "types",
    code: `from typing import TypeVar

T = TypeVar("T")

def first(lst: list[T]) -> T:
    return lst[0]

x: int = first([1, 2, 3])      # T inferred as int
s: str = first(["a", "b"])     # T inferred as str

# Bounded TypeVar — T must be comparable
from typing import TypeVar
C = TypeVar("C", bound="Comparable")`,
    explanation: "A `TypeVar` is a placeholder that the type checker substitutes with the actual type at each call site, allowing a single function signature to be generic over many types while preserving type information.",
  },
  {
    id: "py-b17-b1-protocol-structural",
    language: "python",
    title: "Protocol for structural subtyping (duck typing)",
    tag: "types",
    code: `from typing import Protocol

class Drawable(Protocol):
    def draw(self) -> None: ...

class Circle:
    def draw(self) -> None:
        print("O")

class Square:
    def draw(self) -> None:
        print("□")

def render(shape: Drawable) -> None:
    shape.draw()

render(Circle())   # works — Circle satisfies Drawable structurally
render(Square())   # works — no explicit inheritance needed`,
    explanation: "`Protocol` enables structural subtyping: any class with matching methods satisfies the protocol at the type-checker level without inheriting from it — Python's type-safe form of duck typing.",
  },
  {
    id: "py-b17-b1-typeguard",
    language: "python",
    title: "TypeGuard narrows types in conditional branches",
    tag: "types",
    code: `from typing import TypeGuard

def is_str_list(val: list[object]) -> TypeGuard[list[str]]:
    return all(isinstance(x, str) for x in val)

data: list[object] = ["a", "b", "c"]

if is_str_list(data):
    # type checker knows data is list[str] here
    print(", ".join(data))    # OK — join needs Iterable[str]`,
    explanation: "`TypeGuard[T]` as a return annotation tells the type checker that a `True` return means the checked argument is of type `T` in the branch where the guard is truthy.",
  },
  {
    id: "py-b17-b1-runtime-checkable",
    language: "python",
    title: "@runtime_checkable allows isinstance with Protocol",
    tag: "types",
    code: `from typing import Protocol, runtime_checkable

@runtime_checkable
class Sized(Protocol):
    def __len__(self) -> int: ...

print(isinstance([], Sized))       # True
print(isinstance("hello", Sized))  # True
print(isinstance(42, Sized))       # False — int has no __len__

# Without @runtime_checkable, isinstance raises TypeError`,
    explanation: "`@runtime_checkable` makes `isinstance()` work with a Protocol by checking only that the required methods exist — it doesn't verify signatures, so it's a shallow structural check.",
  },
  // === families ===
  {
    id: "py-b17-b1-list-vs-tuple",
    language: "python",
    title: "list vs tuple: mutability and semantic difference",
    tag: "families",
    code: `# list: mutable homogeneous sequence
nums = [1, 2, 3]
nums.append(4)

# tuple: immutable, often heterogeneous record
point = (3.0, 4.0)
# point[0] = 1  # TypeError

# tuples are hashable (if contents are):
d = {point: "origin nearby"}

# tuple is slightly faster for iteration:
import timeit
print(timeit.timeit("for x in (1,2,3): pass", number=1_000_000))
print(timeit.timeit("for x in [1,2,3]: pass", number=1_000_000))`,
    explanation: "Use `list` for a mutable sequence of similar items, and `tuple` for a fixed-size record of heterogeneous items — tuples are hashable and marginally faster due to their immutability.",
  },
  {
    id: "py-b17-b1-dict-vs-defaultdict-counter",
    language: "python",
    title: "dict vs defaultdict vs Counter for counting",
    tag: "families",
    code: `from collections import defaultdict, Counter

text = "mississippi"

# Plain dict — needs explicit check
d = {}
for c in text:
    d[c] = d.get(c, 0) + 1

# defaultdict — auto-initializes to 0
dd = defaultdict(int)
for c in text:
    dd[c] += 1

# Counter — most idiomatic
cnt = Counter(text)
print(cnt.most_common(3))  # [('s', 4), ('i', 4), ('p', 2)]`,
    explanation: "`Counter` is the most idiomatic tool for frequency counting; `defaultdict(int)` is the step below; a plain dict with `.get()` is the most verbose and least readable.",
  },
  {
    id: "py-b17-b1-set-vs-frozenset",
    language: "python",
    title: "set vs frozenset: mutable vs hashable sets",
    tag: "families",
    code: `mutable = {1, 2, 3}
mutable.add(4)

immutable = frozenset([1, 2, 3])
# immutable.add(4)  # AttributeError

# frozenset can be used as a dict key or set element:
graph: dict[frozenset, int] = {}
edge = frozenset({"A", "B"})
graph[edge] = 5

# Set operations work on both:
print(mutable & immutable)   # {1, 2, 3}`,
    explanation: "`frozenset` is the immutable sibling of `set` — it supports all read-only set operations and is hashable, so it can serve as a dict key or be nested inside another set.",
  },
  {
    id: "py-b17-b1-stringio-bytesio",
    language: "python",
    title: "StringIO vs BytesIO: in-memory file-like objects",
    tag: "families",
    code: `from io import StringIO, BytesIO

# StringIO — in-memory text stream
buf = StringIO()
buf.write("line1\\n")
buf.write("line2\\n")
buf.seek(0)
print(buf.read())   # line1\\nline2\\n

# BytesIO — in-memory binary stream
bbuf = BytesIO(b"\\x00\\x01\\x02")
print(bbuf.read(2))  # b'\\x00\\x01'`,
    explanation: "`StringIO` and `BytesIO` expose the same file interface as opened files — use them to pass in-memory data to functions that expect a file object, without touching the filesystem.",
  },
  {
    id: "py-b17-b1-thread-vs-process",
    language: "python",
    title: "Thread vs Process: GIL and concurrency model",
    tag: "families",
    code: `from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor
import time

def cpu_task(n):
    return sum(i*i for i in range(n))

def io_task(n):
    time.sleep(0.01)
    return n

# I/O-bound: threads are fine (GIL released during I/O)
with ThreadPoolExecutor(4) as ex:
    results = list(ex.map(io_task, range(10)))

# CPU-bound: use processes (bypasses GIL)
with ProcessPoolExecutor(4) as ex:
    results = list(ex.map(cpu_task, [100_000]*4))`,
    explanation: "Python's GIL restricts CPU parallelism to one thread at a time, so I/O-bound work benefits from threads while CPU-bound work needs separate processes via `ProcessPoolExecutor`.",
  },
  {
    id: "py-b17-b1-partial-func",
    language: "python",
    title: "functools.partial fixes arguments of a function",
    tag: "families",
    code: `from functools import partial

def power(base, exp):
    return base ** exp

square = partial(power, exp=2)
cube   = partial(power, exp=3)

print(square(5))   # 25
print(cube(3))     # 27

# Useful for callbacks / higher-order functions:
from functools import partial
nums = [1, 2, 3, 4, 5]
add10 = partial(map, partial(lambda n, x: x + n, 10))
print(list(add10(nums)))  # [11, 12, 13, 14, 15]`,
    explanation: "`functools.partial` creates a new callable with some arguments pre-filled, enabling function specialization without writing a new def or lambda.",
  },
  {
    id: "py-b17-b1-namedtuple-vs-dataclass",
    language: "python",
    title: "NamedTuple vs dataclass: when to use which",
    tag: "families",
    code: `from typing import NamedTuple
from dataclasses import dataclass

class Point(NamedTuple):
    x: float; y: float   # immutable, hashable, tuple-compatible

@dataclass
class MutablePoint:
    x: float; y: float   # mutable by default

@dataclass(frozen=True)
class FrozenPoint:
    x: float; y: float   # immutable + hashable (like NamedTuple)

p = Point(1, 2)
print(p[0], len(p))   # 1 2  — tuple interface works
# MutablePoint doesn't support indexing`,
    explanation: "`NamedTuple` is a tuple with named fields — immutable, hashable, and supports positional unpacking; `dataclass` is a mutable class with more OOP features; use `frozen=True` to get immutability and hashability.",
  },
  {
    id: "py-b17-b1-abc-vs-protocol",
    language: "python",
    title: "ABC (nominal) vs Protocol (structural) subtyping",
    tag: "families",
    code: `from abc import ABC, abstractmethod
from typing import Protocol

# ABC: nominal — must explicitly inherit
class Shape(ABC):
    @abstractmethod
    def area(self) -> float: ...

class Circle(Shape):       # must inherit Shape
    def area(self): return 3.14

# Protocol: structural — no inheritance needed
class HasArea(Protocol):
    def area(self) -> float: ...

class Square:              # doesn't inherit HasArea
    def area(self): return 4.0

def print_area(s: HasArea) -> None:
    print(s.area())

print_area(Square())  # works — Square satisfies HasArea structurally`,
    explanation: "ABCs enforce nominal subtyping (must inherit), which gives a runtime `isinstance` check; Protocols enforce structural subtyping (must have matching methods), which is more flexible and doesn't require modifying existing classes.",
  },
  {
    id: "py-b17-b1-purepath-vs-path",
    language: "python",
    title: "PurePath vs Path: portable vs OS-aware",
    tag: "families",
    code: `from pathlib import PurePosixPath, PureWindowsPath, Path

# PurePath: manipulation only, no OS I/O
p = PurePosixPath("/usr/bin/python")
print(p.name)    # python
print(p.suffix)  # (empty)
print(p.parent)  # /usr/bin

# PureWindowsPath on any OS:
w = PureWindowsPath(r"C:\\Users\\Alice\\file.txt")
print(w.stem)   # file
print(w.parts)  # ('C:\\\\', 'Users', 'Alice', 'file.txt')

# Path: concrete, does filesystem I/O
Path(".").iterdir()`,
    explanation: "`PurePath` subclasses handle path manipulation without touching the filesystem (useful for cross-platform path work); `Path` adds real I/O methods and inherits from `PurePath`.",
  },
  {
    id: "py-b17-b1-asyncio-queue-vs-queue",
    language: "python",
    title: "asyncio.Queue vs queue.Queue",
    tag: "families",
    code: `import asyncio, queue

# asyncio.Queue — for coroutines (await-based)
async def demo():
    q = asyncio.Queue(maxsize=2)
    await q.put("item1")
    item = await q.get()
    print(item)   # item1

asyncio.run(demo())

# queue.Queue — for threads (blocking)
tq = queue.Queue()
tq.put("item")
print(tq.get())  # item`,
    explanation: "`asyncio.Queue` uses `await put/get` and is safe for coroutines sharing an event loop; `queue.Queue` uses blocking calls and is designed for thread-based producers and consumers.",
  },
  {
    id: "py-b17-b1-list-vs-deque-perf",
    language: "python",
    title: "list vs deque: O(1) ends vs O(n) front",
    tag: "families",
    code: `from collections import deque

lst = list(range(10_000))
dq  = deque(range(10_000))

import timeit

# Appending to the front:
t_list  = timeit.timeit(lambda: lst.insert(0, -1), number=1000)
t_deque = timeit.timeit(lambda: dq.appendleft(-1), number=1000)

print(f"list.insert(0): {t_list:.4f}s")
print(f"deque.appendleft: {t_deque:.6f}s")
# deque is ~100x faster for front insertions`,
    explanation: "`list.insert(0, x)` is O(n) because every element must shift; `deque.appendleft(x)` is O(1) thanks to its doubly-linked block structure — use `deque` when you need efficient operations at both ends.",
  },
  {
    id: "py-b17-b1-threadpool-vs-processpool",
    language: "python",
    title: "ThreadPoolExecutor vs ProcessPoolExecutor",
    tag: "families",
    code: `from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor
import math

def is_prime(n):
    if n < 2: return False
    return all(n % i for i in range(2, int(math.sqrt(n)) + 1))

nums = list(range(10_000, 10_100))

# Threads: limited by GIL for CPU work
with ThreadPoolExecutor(4) as ex:
    tp_result = list(ex.map(is_prime, nums))

# Processes: bypass GIL — better for pure CPU
with ProcessPoolExecutor(4) as ex:
    pp_result = list(ex.map(is_prime, nums))

print(tp_result == pp_result)  # True`,
    explanation: "`ThreadPoolExecutor` is simpler (shared memory, no serialization) but bounded by the GIL; `ProcessPoolExecutor` spawns real OS processes (each with its own GIL) for CPU-bound tasks that truly benefit from parallelism.",
  },
  {
    id: "py-b17-b1-task-vs-coroutine",
    language: "python",
    title: "asyncio Task vs coroutine: scheduling and cancellation",
    tag: "families",
    code: `import asyncio

async def work(name, delay):
    await asyncio.sleep(delay)
    return name

async def main():
    coro = work("direct", 0.1)     # coroutine — not yet scheduled
    task = asyncio.create_task(work("task", 0.1))  # scheduled immediately

    # Awaiting a coroutine runs it sequentially
    r1 = await coro

    # Task runs concurrently; can be cancelled
    task.cancel()
    try:
        r2 = await task
    except asyncio.CancelledError:
        r2 = "cancelled"
    print(r1, r2)

asyncio.run(main())  # direct cancelled`,
    explanation: "A coroutine is just a pausable function — it does nothing until awaited; `create_task` wraps it in a `Task` that is scheduled immediately on the event loop and can be cancelled independently.",
  },
  // === classes ===
  {
    id: "py-b17-b1-init-vs-new",
    language: "python",
    title: "__new__ creates; __init__ initializes",
    tag: "classes",
    code: `class Singleton:
    _instance = None

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance   # always same object

    def __init__(self, value):
        self.value = value

a = Singleton(1)
b = Singleton(2)
print(a is b)      # True
print(a.value)     # 2  (__init__ ran again on same object)`,
    explanation: "`__new__` is responsible for creating and returning the instance object; `__init__` receives the already-created object and initializes its attributes — controlling `__new__` is rare but necessary for Singleton or immutable type patterns.",
  },
  {
    id: "py-b17-b1-repr-vs-str",
    language: "python",
    title: "__repr__ for developers, __str__ for users",
    tag: "classes",
    code: `class Point:
    def __init__(self, x, y):
        self.x, self.y = x, y

    def __repr__(self):
        return f"Point({self.x!r}, {self.y!r})"

    def __str__(self):
        return f"({self.x}, {self.y})"

p = Point(1, 2)
print(repr(p))  # Point(1, 2)   — used in REPL, logs, containers
print(str(p))   # (1, 2)        — used by print(), f-strings
print(f"{p!r}") # Point(1, 2)   — !r forces repr`,
    explanation: "`__repr__` should return an unambiguous, ideally eval-able string for debugging; `__str__` should return a human-readable form — if only one is defined, `__repr__` is used as a fallback for both.",
  },
  {
    id: "py-b17-b1-eq-hash",
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

    def __hash__(self):                   # must define if __eq__ defined
        return hash((self.x, self.y))

s = {Point(1, 2), Point(1, 2)}
print(len(s))   # 1  — deduped correctly`,
    explanation: "Defining `__eq__` without `__hash__` makes instances unhashable (Python sets `__hash__ = None`); both must be defined together so that equal objects always hash to the same value.",
  },
  {
    id: "py-b17-b1-total-ordering",
    language: "python",
    title: "functools.total_ordering fills in comparison methods",
    tag: "classes",
    code: `from functools import total_ordering

@total_ordering
class Version:
    def __init__(self, major, minor):
        self.major, self.minor = major, minor

    def __eq__(self, other):
        return (self.major, self.minor) == (other.major, other.minor)

    def __lt__(self, other):
        return (self.major, self.minor) < (other.major, other.minor)

v1 = Version(1, 9)
v2 = Version(2, 0)
print(v1 < v2)   # True
print(v2 >= v1)  # True  — generated by total_ordering`,
    explanation: "`@total_ordering` derives the remaining comparison methods (`__le__`, `__gt__`, `__ge__`) from `__eq__` and one other, so you only need to implement two of the six comparison methods.",
  },
  {
    id: "py-b17-b1-getitem-len",
    language: "python",
    title: "__getitem__ and __len__ make a sequence",
    tag: "classes",
    code: `class FibSequence:
    def __init__(self, n):
        self._data = self._generate(n)

    def _generate(self, n):
        a, b = 0, 1
        out = []
        for _ in range(n):
            out.append(a); a, b = b, a + b
        return out

    def __len__(self):  return len(self._data)
    def __getitem__(self, idx): return self._data[idx]

fib = FibSequence(8)
print(fib[4])         # 3
print(list(fib))      # [0, 1, 1, 2, 3, 5, 8, 13]
print(5 in fib)       # True — __contains__ auto-derives`,
    explanation: "Implementing `__len__` and `__getitem__` is enough to make a class behave as a sequence: iteration, `in` membership, and slicing all work automatically through Python's data model.",
  },
  {
    id: "py-b17-b1-iter-next",
    language: "python",
    title: "__iter__ and __next__ for custom iterators",
    tag: "classes",
    code: `class Countdown:
    def __init__(self, start):
        self.current = start

    def __iter__(self):
        return self   # iterator is its own iterable

    def __next__(self):
        if self.current <= 0:
            raise StopIteration
        val = self.current
        self.current -= 1
        return val

for n in Countdown(3):
    print(n)   # 3  2  1`,
    explanation: "An iterator must implement both `__iter__` (returning self) and `__next__` (returning the next value or raising `StopIteration`); a for loop calls `iter()` then repeatedly calls `next()` until the exception.",
  },
  {
    id: "py-b17-b1-context-manager",
    language: "python",
    title: "__enter__ and __exit__ for context managers",
    tag: "classes",
    code: `class Timer:
    import time

    def __enter__(self):
        self._start = self.time.time()
        return self          # value bound to 'as' variable

    def __exit__(self, exc_type, exc_val, exc_tb):
        elapsed = self.time.time() - self._start
        print(f"elapsed: {elapsed:.3f}s")
        return False         # don't suppress exceptions

with Timer() as t:
    sum(range(1_000_000))   # elapsed: 0.03s (approx)`,
    explanation: "`__enter__` sets up the context and returns the resource; `__exit__` tears it down — returning `False` (or `None`) re-raises any exception, while returning `True` suppresses it.",
  },
  {
    id: "py-b17-b1-callable",
    language: "python",
    title: "__call__ makes an instance callable",
    tag: "classes",
    code: `class Multiplier:
    def __init__(self, factor):
        self.factor = factor

    def __call__(self, x):
        return x * self.factor

double = Multiplier(2)
triple = Multiplier(3)

print(double(5))    # 10
print(triple(4))    # 12
print(callable(double))  # True

# Use like a closure but with inspectable state:
print(double.factor)  # 2`,
    explanation: "Defining `__call__` makes instances callable like functions — useful for stateful callables where you want inspectable attributes, unlike a closure whose state is hidden.",
  },
  {
    id: "py-b17-b1-missing-dict",
    language: "python",
    title: "__missing__ in dict subclass handles missing keys",
    tag: "classes",
    code: `class AutoDict(dict):
    def __missing__(self, key):
        # Called only when key is not found
        value = f"auto:{key}"
        self[key] = value    # cache it
        return value

d = AutoDict(a=1)
print(d["a"])     # 1   (existing key — __missing__ not called)
print(d["b"])     # auto:b
print(d["b"])     # auto:b  (cached)
print(dict(d))    # {'a': 1, 'b': 'auto:b'}`,
    explanation: "`__missing__(key)` is called by `dict.__getitem__` when the key is absent, letting you compute and optionally cache a default value — this is exactly how `defaultdict` is implemented.",
  },
  {
    id: "py-b17-b1-descriptor-get",
    language: "python",
    title: "Descriptor __get__ intercepts attribute access",
    tag: "classes",
    code: `class Validated:
    """Descriptor that enforces a positive-number constraint."""
    def __set_name__(self, owner, name):
        self.name = name

    def __get__(self, obj, objtype=None):
        if obj is None: return self       # class-level access
        return obj.__dict__.get(self.name)

    def __set__(self, obj, value):
        if value < 0:
            raise ValueError(f"{self.name} must be >= 0")
        obj.__dict__[self.name] = value

class Product:
    price = Validated()

p = Product()
p.price = 9.99
# p.price = -1  # raises ValueError`,
    explanation: "A descriptor object implements `__get__`, `__set__`, or `__delete__` and is assigned as a class attribute; Python's property and classmethod are both implemented as descriptors.",
  },
  {
    id: "py-b17-b1-property-decorator",
    language: "python",
    title: "property decorator: computed attributes with validation",
    tag: "classes",
    code: `class Circle:
    def __init__(self, radius):
        self._radius = radius

    @property
    def radius(self):
        return self._radius

    @radius.setter
    def radius(self, value):
        if value < 0:
            raise ValueError("radius must be non-negative")
        self._radius = value

    @property
    def area(self):
        import math
        return math.pi * self._radius ** 2

c = Circle(5)
print(c.area)    # 78.539...
c.radius = 10`,
    explanation: "`@property` turns a method into a getter that is accessed like an attribute; adding `@name.setter` enables validation on assignment while keeping the clean `obj.attr = value` syntax.",
  },
  {
    id: "py-b17-b1-classmethod-vs-staticmethod",
    language: "python",
    title: "classmethod vs staticmethod",
    tag: "classes",
    code: `class Date:
    def __init__(self, year, month, day):
        self.year, self.month, self.day = year, month, day

    @classmethod
    def from_string(cls, s):       # cls = Date (or subclass)
        y, m, d = map(int, s.split("-"))
        return cls(y, m, d)         # respects inheritance

    @staticmethod
    def is_leap(year):             # no cls/self — pure utility
        return year % 4 == 0 and (year % 100 != 0 or year % 400 == 0)

d = Date.from_string("2024-03-15")
print(Date.is_leap(2024))   # True`,
    explanation: "`classmethod` receives the class as `cls` (enabling factory patterns that work correctly with subclasses), while `staticmethod` receives no implicit argument and is just a function namespaced inside the class.",
  },
  {
    id: "py-b17-b1-init-subclass",
    language: "python",
    title: "__init_subclass__ runs when a subclass is defined",
    tag: "classes",
    code: `class Plugin:
    _registry: dict = {}

    def __init_subclass__(cls, name=None, **kwargs):
        super().__init_subclass__(**kwargs)
        if name:
            Plugin._registry[name] = cls

class CsvPlugin(Plugin, name="csv"):
    pass

class JsonPlugin(Plugin, name="json"):
    pass

print(Plugin._registry)
# {'csv': <class 'CsvPlugin'>, 'json': <class 'JsonPlugin'>}`,
    explanation: "`__init_subclass__` is called on the base class whenever a subclass is defined, making it ideal for auto-registration patterns without needing a metaclass or decorator.",
  },
  {
    id: "py-b17-b1-dataclass-post-init",
    language: "python",
    title: "dataclass __post_init__ for derived field computation",
    tag: "classes",
    code: `from dataclasses import dataclass, field

@dataclass
class Circle:
    radius: float
    area: float = field(init=False)    # not a constructor parameter

    def __post_init__(self):
        import math
        if self.radius < 0:
            raise ValueError("radius must be non-negative")
        self.area = math.pi * self.radius ** 2

c = Circle(5)
print(c.area)    # 78.539...
# Circle(-1)     # raises ValueError`,
    explanation: "`__post_init__` runs after the generated `__init__` sets all fields, making it the right place for cross-field validation and computing derived attributes that aren't constructor parameters.",
  },
];
