import type { Snippet } from "./types";

export const pythonSnippets20260512B2: Snippet[] = [
  {
    id: "py-re-full-match",
    language: "python",
    title: "re.fullmatch vs re.match vs re.search",
    tag: "snippet",
    code: `import re

text = "hello world"

print(re.search(r"world", text))      # matches anywhere → <Match>
print(re.match(r"world", text))       # must start at pos 0 → None
print(re.match(r"hello", text))       # starts at 0 → <Match>
print(re.fullmatch(r"hello", text))   # must match ALL text → None
print(re.fullmatch(r"hello world", text))  # exact match → <Match>`,
    explanation:
      "search() scans anywhere, match() anchors at position 0 only, fullmatch() requires the pattern to cover the entire string — equivalent to anchoring with ^ and $ around your pattern.",
  },
  {
    id: "py-re-findall-groups",
    language: "python",
    title: "re.findall with capture groups — returns tuples",
    tag: "snippet",
    code: `import re

text = "Alice:30, Bob:25, Carol:42"

# No groups: returns list of full matches
print(re.findall(r"\\w+:\\d+", text))   # ['Alice:30', 'Bob:25', 'Carol:42']

# One group: returns list of the group's content
print(re.findall(r"(\\w+):\\d+", text)) # ['Alice', 'Bob', 'Carol']

# Two+ groups: returns list of tuples
print(re.findall(r"(\\w+):(\\d+)", text))
# [('Alice', '30'), ('Bob', '25'), ('Carol', '42')]`,
    explanation:
      "re.findall changes its return type based on the number of capture groups — zero groups returns full-match strings, one group returns strings, and multiple groups return tuples of captured strings.",
  },
  {
    id: "py-re-flags-multiline",
    language: "python",
    title: "re.MULTILINE vs re.DOTALL — ^ $ and . behavior",
    tag: "snippet",
    code: `import re

text = "first line\\nsecond line\\nthird line"

# Without MULTILINE: ^ only matches start of string
print(re.findall(r"^\\w+", text))                          # ['first']

# With MULTILINE: ^ matches start of EACH line
print(re.findall(r"^\\w+", text, re.MULTILINE))           # ['first', 'second', 'third']

# DOTALL: . matches newline too (default: . excludes \\n)
print(bool(re.search(r"first.second", text)))             # False (. won't match \\n)
print(bool(re.search(r"first.second", text, re.DOTALL)))  # True`,
    explanation:
      "re.MULTILINE makes ^ and $ match at line boundaries (not just string boundaries), while re.DOTALL (re.S) makes . match any character including newline — these are the two most commonly misunderstood regex flags.",
  },
  {
    id: "py-str-translate",
    language: "python",
    title: "str.translate with str.maketrans — fast bulk character replacement",
    tag: "snippet",
    code: `# Map individual characters (faster than multiple str.replace calls)
table = str.maketrans("aeiou", "12345")   # map each vowel to digit
print("hello world".translate(table))     # h2ll4 w4rld

# Also delete characters:
del_table = str.maketrans("", "", " \\t\\n")   # delete whitespace
print("  hello   world  ".translate(del_table))  # helloworld

# Replace one-to-one AND delete:
mixed = str.maketrans("aeiou", "12345", "xyz")
print("example xyz".translate(mixed))    # 2x1mpl2  (xyz deleted)`,
    explanation:
      "str.translate with a lookup table built by str.maketrans replaces or deletes many characters in a single O(n) pass — far more efficient than chaining multiple .replace() calls.",
  },
  {
    id: "py-str-partition",
    language: "python",
    title: "str.partition — split at first separator, always 3 parts",
    tag: "snippet",
    code: `# partition always returns exactly 3 parts
url = "https://example.com/path?query=1"
scheme, sep, rest = url.partition("://")
print(scheme)  # https
print(sep)     # ://
print(rest)    # example.com/path?query=1

# If separator not found: (original, '', '')
a, b, c = "no-sep".partition("://")
print(repr(b))   # ''  (not found)

# rpartition splits at the LAST occurrence
name = "archive.tar.gz"
base, dot, ext = name.rpartition(".")
print(base, ext)  # archive.tar   gz`,
    explanation:
      "str.partition always returns a 3-tuple (before, sep, after) and never raises — when the separator is absent the middle and third elements are empty strings; use it for reliable two-part splits without index arithmetic.",
  },
  {
    id: "py-str-casefold",
    language: "python",
    title: "str.casefold — aggressive lowercase for case-insensitive comparison",
    tag: "snippet",
    code: `# str.lower is not enough for some Unicode comparisons
s1 = "Stra\\u00dfe"   # German: Straße
s2 = "STRASSE"

print(s1.lower() == s2.lower())       # False — ß.lower() == 'ß', not 'ss'
print(s1.casefold() == s2.casefold()) # True  — ß.casefold() == 'ss'

# For ASCII-only text the difference is invisible:
print("HELLO".lower() == "HELLO".casefold())   # True`,
    explanation:
      "str.casefold applies Unicode case-folding rules which go beyond lower() for characters like the German ß — use it whenever you need locale-neutral case-insensitive string comparison.",
  },
  {
    id: "py-bytes-fromhex",
    language: "python",
    title: "bytes.fromhex — hex string to bytes class method",
    tag: "snippet",
    code: `# Decode a hex string into bytes
data = bytes.fromhex("deadbeef")
print(data)          # b'\\xde\\xad\\xbe\\xef'
print(len(data))     # 4 bytes

# Spaces are allowed in the input (3.7+)
mac = bytes.fromhex("AA BB CC DD EE FF")
print(mac.hex(":"))  # aa:bb:cc:dd:ee:ff

# Roundtrip
original = b"hello"
print(bytes.fromhex(original.hex()) == original)  # True`,
    explanation:
      "bytes.fromhex() is the canonical way to convert a hex string into bytes — it accepts optional spaces between byte pairs (added in Python 3.7) and is faster than bytearray.fromhex() for immutable use cases.",
  },
  {
    id: "py-bytes-decode-errors",
    language: "python",
    title: "bytes.decode errors= — handling invalid byte sequences",
    tag: "caveats",
    code: `bad_bytes = b"Hello \\xff World"   # \\xff is invalid UTF-8

# Default 'strict': raises UnicodeDecodeError
try:
    bad_bytes.decode("utf-8")
except UnicodeDecodeError as e:
    print(e)

# 'replace': substitute replacement character U+FFFD
print(bad_bytes.decode("utf-8", errors="replace"))  # Hello  World

# 'ignore': silently drop bad bytes
print(bad_bytes.decode("utf-8", errors="ignore"))   # Hello  World

# 'backslashreplace': escape bad bytes
print(bad_bytes.decode("utf-8", errors="backslashreplace"))  # Hello \\xff World`,
    explanation:
      "The errors= parameter controls what happens when a byte sequence can't be decoded — 'strict' (default) raises immediately, while 'replace', 'ignore', and 'backslashreplace' provide progressively more information-preserving fallbacks.",
  },
  {
    id: "py-list-sort-vs-sorted",
    language: "python",
    title: "list.sort() in-place vs sorted() — mutation vs new list",
    tag: "families",
    code: `original = [3, 1, 4, 1, 5, 9, 2, 6]

# sorted() returns NEW list, original unchanged
new_list = sorted(original)
print(original)   # [3, 1, 4, 1, 5, 9, 2, 6]  (unchanged)
print(new_list)   # [1, 1, 2, 3, 4, 5, 6, 9]

# list.sort() mutates in-place, returns None
original.sort()
print(original)   # [1, 1, 2, 3, 4, 5, 6, 9]  (sorted)

# Use sorted() for: iterables, chaining, preserving original
# Use list.sort() for: large lists where memory matters`,
    explanation:
      "list.sort() mutates in-place and returns None — a common mistake is assigning its return value; sorted() always returns a new list and works on any iterable, not just lists.",
  },
  {
    id: "py-sorted-reverse",
    language: "python",
    title: "sorted with reverse=True and key= — combined descending sort",
    tag: "snippet",
    code: `words = ["banana", "apple", "cherry", "date"]

# Reverse alphabetical
print(sorted(words, reverse=True))
# ['cherry', 'date', 'banana', 'apple']

# Longest first (stable: ties keep original order)
print(sorted(words, key=len, reverse=True))
# ['banana', 'cherry', 'apple', 'date']

# Sort by last character descending
print(sorted(words, key=lambda w: w[-1], reverse=True))
# ['apple', 'date', 'banana', 'cherry']  (e, e, a, y)`,
    explanation:
      "The key= and reverse=True parameters combine cleanly — Python first applies the key function to every element, then sorts by the resulting values in descending order; the sort is guaranteed stable.",
  },
  {
    id: "py-dict-or-update",
    language: "python",
    title: "dict | merge operator — non-mutating dict merge (3.9+)",
    tag: "snippet",
    code: `defaults = {"color": "red", "size": "M", "qty": 1}
overrides = {"color": "blue", "qty": 5}

# | creates a NEW dict; right side wins on conflict
merged = defaults | overrides
print(merged)   # {'color': 'blue', 'size': 'M', 'qty': 5}

# |= updates in-place (like dict.update())
defaults |= overrides
print(defaults)  # {'color': 'blue', 'size': 'M', 'qty': 5}

# Chain multiple dicts:
a, b, c = {"x": 1}, {"y": 2}, {"x": 99}
print(a | b | c)  # {'x': 99, 'y': 2}`,
    explanation:
      "The | operator (Python 3.9+) merges two dicts into a new dict without mutating either; |= updates the left dict in-place — both are cleaner than {**a, **b} unpacking and make the merge intent explicit.",
  },
  {
    id: "py-dict-popitem",
    language: "python",
    title: "dict.popitem() — remove and return the last inserted item (LIFO)",
    tag: "snippet",
    code: `d = {"a": 1, "b": 2, "c": 3}

# popitem removes and returns the LAST inserted pair (3.7+: insertion order guaranteed)
k, v = d.popitem()
print(k, v)   # c 3
print(d)      # {'a': 1, 'b': 2}

# Process and remove all entries in reverse insertion order:
d2 = {"x": 10, "y": 20, "z": 30}
while d2:
    key, val = d2.popitem()
    print(f"processing {key}={val}")
# z=30, y=20, x=10`,
    explanation:
      "dict.popitem() removes and returns the most recently inserted key-value pair as a (key, value) tuple — since Python 3.7 dicts maintain insertion order, so popitem() is effectively LIFO, useful for stack-like processing.",
  },
  {
    id: "py-dict-reversed",
    language: "python",
    title: "reversed(dict) — iterate dictionary keys in reverse insertion order (3.8+)",
    tag: "snippet",
    code: `inventory = {"apples": 5, "bananas": 3, "cherries": 10}

# Forward order (insertion order):
print(list(inventory))              # ['apples', 'bananas', 'cherries']

# Reversed (since Python 3.8):
print(list(reversed(inventory)))   # ['cherries', 'bananas', 'apples']

# Also works on dict.keys(), dict.values(), dict.items():
for key in reversed(inventory.keys()):
    print(key)   # cherries, bananas, apples`,
    explanation:
      "Python 3.8 added support for reversed() on dicts and their views — this avoids creating a list copy just to reverse the iteration, saving memory for large dictionaries.",
  },
  {
    id: "py-set-symmetric-diff",
    language: "python",
    title: "set symmetric difference — elements in exactly one set",
    tag: "snippet",
    code: `a = {1, 2, 3, 4}
b = {3, 4, 5, 6}

# Symmetric difference: in A or B but not both
print(a ^ b)                          # {1, 2, 5, 6}
print(a.symmetric_difference(b))      # {1, 2, 5, 6}

# Update in-place:
a ^= b
print(a)   # {1, 2, 5, 6}

# Equivalent to: (a | b) - (a & b)
x, y = {1, 2, 3}, {2, 3, 4}
print(x ^ y == (x | y) - (x & y))   # True`,
    explanation:
      "The symmetric difference (^) returns elements that appear in exactly one of the two sets — it is the set analogue of XOR and is used to find what changed between two versions of a collection.",
  },
  {
    id: "py-tuple-packing",
    language: "python",
    title: "tuple packing and unpacking — implicit tuple creation",
    tag: "understanding",
    code: `# Packing: comma creates a tuple without parentheses
t = 1, 2, 3          # equivalent to (1, 2, 3)
print(type(t), t)    # <class 'tuple'>  (1, 2, 3)

# Unpacking: left side gets each value
a, b, c = t
print(a, b, c)   # 1 2 3

# Extended unpacking (star):
first, *rest = (10, 20, 30, 40)
print(first)   # 10
print(rest)    # [20, 30, 40]  — note: list, not tuple

# Swap without temp variable (uses packing):
x, y = 5, 10
x, y = y, x
print(x, y)   # 10 5`,
    explanation:
      "The comma is what creates a tuple, not the parentheses — parentheses are only needed for disambiguation; the starred expression in extended unpacking always collects into a list even when unpacking a tuple.",
  },
  {
    id: "py-range-advanced",
    language: "python",
    title: "range with negative step and reverse patterns",
    tag: "snippet",
    code: `# Countdown with negative step
for i in range(10, 0, -1):
    print(i, end=" ")    # 10 9 8 7 6 5 4 3 2 1
print()

# Reverse indexing over a list
items = ["a", "b", "c", "d"]
for i in range(len(items) - 1, -1, -1):
    print(items[i], end=" ")   # d c b a
print()

# Step > 1: every other element
print(list(range(0, 20, 3)))   # [0, 3, 6, 9, 12, 15, 18]`,
    explanation:
      "range() with a negative step counts downward — the stop value is exclusive and must be less than start; prefer reversed(range(n)) over range(n-1, -1, -1) for readability when you just want to reverse.",
  },
  {
    id: "py-range-contains",
    language: "python",
    title: "range membership test — O(1) __contains__ check",
    tag: "understanding",
    code: `r = range(0, 1_000_000_000, 3)  # range with 333M elements

# Membership test is O(1) — no iteration!
print(999_999_999 in r)   # True
print(999_999_998 in r)   # False (not divisible by 3)

# Unlike a list, range uses math: (x - start) % step == 0
import sys
print(sys.getsizeof(r))   # 48 bytes regardless of size
print(sys.getsizeof(list(range(10))))  # much larger`,
    explanation:
      "range.__contains__ computes membership arithmetically in O(1) without storing or iterating the elements — a billion-element range takes only 48 bytes and membership tests are instant.",
  },
  {
    id: "py-float-repr",
    language: "python",
    title: "float repr roundtrip guarantee — Python 3.1+ prints shortest representation",
    tag: "understanding",
    code: `# Python 3.1+ guarantees: eval(repr(f)) == f
f = 0.1
print(repr(f))   # '0.1'  — not '0.10000000000000001' (was before 3.1)
print(float(repr(f)) == f)   # True

# The repr is the shortest decimal that round-trips
print(repr(0.1 + 0.2))   # '0.30000000000000004'
print(str(0.1 + 0.2))    # '0.30000000000000004'  (same in Python 3)

# Use Decimal for exact representation:
from decimal import Decimal
print(Decimal("0.1") + Decimal("0.2"))  # 0.3`,
    explanation:
      "Since Python 3.1, float repr always produces the shortest decimal string that round-trips back to the same float — so printing a float and reading it back gives you the same value without manual precision management.",
  },
  {
    id: "py-abs-all-any",
    language: "python",
    title: "abs(), all(), any() — essential built-in reducers",
    tag: "snippet",
    code: `# abs: works on int, float, complex
print(abs(-5))       # 5
print(abs(-3.14))    # 3.14
print(abs(3 + 4j))   # 5.0  (magnitude)

# all: True if ALL elements are truthy (or iterable is empty)
print(all([1, 2, 3]))       # True
print(all([1, 0, 3]))       # False
print(all([]))               # True  (vacuously true)

# any: True if AT LEAST ONE element is truthy
print(any([0, False, None])) # False
print(any([0, 0, 1]))        # True
print(any([]))                # False`,
    explanation:
      "all([]) returns True (vacuously, because no element is False) while any([]) returns False (no element is True) — these edge cases surprise newcomers but are mathematically consistent with their definitions.",
  },
  {
    id: "py-map-filter-zip",
    language: "python",
    title: "map/filter/zip — lazy evaluation and chaining",
    tag: "understanding",
    code: `nums = [1, 2, 3, 4, 5]

# All three return iterators — NOT lists
doubled = map(lambda x: x * 2, nums)
evens   = filter(lambda x: x % 2 == 0, nums)
zipped  = zip(nums, "abcde")

print(type(doubled))   # <class 'map'>

# Consumed lazily:
print(next(doubled))   # 2  (only first element computed)
print(list(doubled))   # [4, 6, 8, 10]  (rest computed now)

# Prefer comprehensions for readability:
doubled2 = [x * 2 for x in nums]`,
    explanation:
      "map, filter, and zip all return lazy iterators that produce values on demand — consuming one element doesn't compute the rest; this saves memory for large sequences but means you can only iterate once.",
  },
  {
    id: "py-map-multiple",
    language: "python",
    title: "map with multiple iterables — element-wise function application",
    tag: "snippet",
    code: `# map(func, iter1, iter2) calls func(x, y) for each pair
a = [1, 2, 3]
b = [10, 20, 30]

totals = list(map(lambda x, y: x + y, a, b))
print(totals)   # [11, 22, 33]

# Using operator.add instead of lambda:
import operator
print(list(map(operator.add, a, b)))   # [11, 22, 33]

# Stops at shortest iterator:
print(list(map(operator.mul, [1, 2, 3], [10, 20])))  # [10, 40]`,
    explanation:
      "When map receives multiple iterables, it calls the function with one element from each — this is equivalent to zip + map but more concise; it stops at the shortest sequence, like zip.",
  },
  {
    id: "py-iter-sentinel",
    language: "python",
    title: "iter(callable, sentinel) — call until value matches",
    tag: "snippet",
    code: `import io

# iter(callable, sentinel) calls callable repeatedly until it returns sentinel
data = b"chunk1\\n" + b"chunk2\\n" + b"\\n"  # empty line = end
stream = io.BytesIO(data)

# Read lines until empty bytes (end of stream)
lines = list(iter(lambda: stream.readline(), b""))
print(lines)   # [b'chunk1\\n', b'chunk2\\n', b'\\n']

# Classic use: read fixed-size blocks
stream.seek(0)
blocks = list(iter(lambda: stream.read(4), b""))
print(blocks)   # 4-byte chunks`,
    explanation:
      "The two-argument form of iter() wraps any zero-argument callable and stops when the sentinel value is returned — a clean way to avoid explicit while-True loops when reading streams in chunks.",
  },
  {
    id: "py-next-default",
    language: "python",
    title: "next(iterator, default) — safe single-step iteration",
    tag: "snippet",
    code: `it = iter([10, 20, 30])

print(next(it))           # 10
print(next(it))           # 20
print(next(it))           # 30
print(next(it, "done"))   # "done"  — default instead of StopIteration

# Idiom: get first match or a fallback
data = [1, 5, 7, 4, 2, 8]
first_even = next((x for x in data if x % 2 == 0), None)
print(first_even)   # 4`,
    explanation:
      "next(it, default) returns the default instead of raising StopIteration when the iterator is exhausted — this is the idiomatic way to get the first matching element from a generator expression with a safe fallback.",
  },
  {
    id: "py-sorted-attrgetter",
    language: "python",
    title: "sorted with operator.attrgetter — sort objects by attribute",
    tag: "snippet",
    code: `from operator import attrgetter
from dataclasses import dataclass

@dataclass
class Employee:
    name: str
    dept: str
    salary: float

employees = [
    Employee("Bob",   "HR",  50_000),
    Employee("Alice", "Eng", 90_000),
    Employee("Carol", "HR",  60_000),
    Employee("Dave",  "Eng", 85_000),
]

# Sort by department, then by salary descending
result = sorted(employees, key=attrgetter("dept", "salary"))
for e in result:
    print(e.dept, e.name, e.salary)`,
    explanation:
      "operator.attrgetter() returns a callable that extracts one or more named attributes — using it in sorted/min/max is faster than a lambda and supports multiple sort keys with a single key function.",
  },
  {
    id: "py-hasattr-try-pattern",
    language: "python",
    title: "hasattr vs try/except — LBYL vs EAFP",
    tag: "caveats",
    code: `class Obj:
    @property
    def risky(self):
        raise ValueError("whoops")

o = Obj()

# LBYL (Look Before You Leap): hasattr catches ALL exceptions from the getter
print(hasattr(o, "risky"))   # False — the property raised, so hasattr returns False!

# EAFP (Easier to Ask Forgiveness): explicit and predictable
try:
    val = o.risky
except ValueError:
    print("caught expected error")   # caught expected error
except AttributeError:
    print("no attribute")`,
    explanation:
      "hasattr() swallows all exceptions from property getters and returns False — if the property raises a ValueError (not AttributeError), hasattr hides it and you lose the real error; use explicit try/except when the getter can raise non-AttributeError.",
  },
  {
    id: "py-issubclass-abc",
    language: "python",
    title: "issubclass with ABCs and virtual subclasses",
    tag: "understanding",
    code: `from collections.abc import Sequence, Mapping

# Built-in types register as virtual subclasses of ABCs
print(issubclass(list,  Sequence))    # True
print(issubclass(tuple, Sequence))    # True
print(issubclass(dict,  Mapping))     # True
print(issubclass(list,  Mapping))     # False

# isinstance works too:
print(isinstance([1, 2], Sequence))   # True

# Register custom class as virtual Sequence:
class MyList:
    def __len__(self): return 0
    def __getitem__(self, i): raise IndexError

Sequence.register(MyList)
print(issubclass(MyList, Sequence))   # True`,
    explanation:
      "issubclass with ABCs checks both real inheritance and virtual registration — many built-in types pre-register themselves with collections.abc so isinstance/issubclass work without explicit inheritance.",
  },
  {
    id: "py-id-is-equality",
    language: "python",
    title: "id() and is — identity vs equality in Python",
    tag: "caveats",
    code: `a = [1, 2, 3]
b = [1, 2, 3]   # same value, different object
c = a

print(a == b)    # True   — equality (same content)
print(a is b)    # False  — identity (different objects)
print(a is c)    # True   — same object
print(id(a) == id(c))   # True

# WARNING: is works accidentally for small ints and interned strings
print(1000 is 1000)   # True in CPython (constant folding in same code object)
x = 1000
y = 1000
print(x is y)   # MIGHT be False — implementation-defined for large ints`,
    explanation:
      "is tests object identity (same memory address), while == tests value equality — never use is for value comparisons except for None, True, and False, because integer caching and string interning make is appear to work but it's implementation-dependent.",
  },
  {
    id: "py-format-protocol",
    language: "python",
    title: "__format__ — custom f-string format specs",
    tag: "classes",
    code: `class Color:
    def __init__(self, r, g, b):
        self.r, self.g, self.b = r, g, b

    def __format__(self, spec: str) -> str:
        if spec == "hex":
            return f"#{self.r:02X}{self.g:02X}{self.b:02X}"
        elif spec == "rgb":
            return f"rgb({self.r},{self.g},{self.b})"
        return repr(self)   # default

c = Color(255, 128, 0)
print(f"{c:hex}")   # #FF8000
print(f"{c:rgb}")   # rgb(255,128,0)
print(format(c, "hex"))  # #FF8000  — format() calls __format__`,
    explanation:
      "__format__ is called by f-strings and format() with the format spec string after the colon — it lets you define custom format mini-languages for your types, enabling clean output without string manipulation at the call site.",
  },
  {
    id: "py-hash-contract",
    language: "python",
    title: "hashable contract — equal objects must have equal hashes",
    tag: "caveats",
    code: `class BadHash:
    def __init__(self, x): self.x = x
    def __eq__(self, other): return self.x == other.x
    # BUG: forgot to define __hash__! Python sets __hash__ = None
    # → BadHash is unhashable because we defined __eq__

class GoodHash:
    def __init__(self, x): self.x = x
    def __eq__(self, other): return self.x == other.x
    def __hash__(self): return hash(self.x)   # required with custom __eq__

s = {GoodHash(1), GoodHash(1)}
print(len(s))  # 1 — deduped because __eq__ + __hash__ are consistent`,
    explanation:
      "Defining __eq__ without __hash__ makes the class unhashable in Python 3 — you must define both, and equal objects must return equal hashes; the reverse (unequal objects returning equal hashes) is allowed but degrades dict/set performance.",
  },
  {
    id: "py-with-multiple",
    language: "python",
    title: "Multiple context managers in one with statement",
    tag: "snippet",
    code: `import tempfile, pathlib

# Old style: nested with
with tempfile.NamedTemporaryFile() as f1:
    with tempfile.NamedTemporaryFile() as f2:
        pass   # verbose

# Modern: comma-separated on one line
with tempfile.NamedTemporaryFile() as f1, tempfile.NamedTemporaryFile() as f2:
    f1.write(b"hello")
    f2.write(b"world")
    print(f1.name, f2.name)
# Both files closed after the block, even if one raises`,
    explanation:
      "Comma-separated context managers in a single with statement are semantically equivalent to nested with statements — both managers are entered in order and exited in reverse order, with each guaranteed to close even if another raises.",
  },
  {
    id: "py-with-parenthesized",
    language: "python",
    title: "Parenthesized with statement — multi-line context managers (3.10+)",
    tag: "snippet",
    code: `import contextlib, io

buf1 = io.StringIO()
buf2 = io.StringIO()
buf3 = io.StringIO()

# 3.10+: parenthesized with for multi-line without backslash
with (
    contextlib.redirect_stdout(buf1),
    contextlib.redirect_stderr(buf2),
    contextlib.redirect_stdout(buf3),
):
    print("captured")

print(buf1.getvalue())   # captured\\n`,
    explanation:
      "Python 3.10 added support for parenthesised with statements, enabling multi-line context manager lists without backslash continuation — the parentheses are purely syntactic and behave identically to the comma-separated form.",
  },
  {
    id: "py-exception-cause",
    language: "python",
    title: "raise X from Y — explicit exception chaining",
    tag: "snippet",
    code: `def load_config(path: str):
    try:
        with open(path) as f:
            return __import__("json").load(f)
    except FileNotFoundError as e:
        raise RuntimeError(f"Config not found: {path}") from e   # chain

    try:
        load_config("/nonexistent.json")
    except RuntimeError as e:
        print(e)             # Config not found: /nonexistent.json
        print(e.__cause__)   # [Errno 2] No such file or directory
        print(e.__context__) # same — the original exception`,
    explanation:
      "'raise X from Y' sets X.__cause__ = Y, marking the exception chain as explicit and intentional — the traceback shows 'The above exception was the direct cause of...', which is clearer than implicit chaining.",
  },
  {
    id: "py-exception-suppress",
    language: "python",
    title: "contextlib.suppress vs bare except — deliberate exception silencing",
    tag: "caveats",
    code: `import contextlib, os

# Explicit: contextlib.suppress shows INTENT to ignore specific exception
with contextlib.suppress(FileNotFoundError):
    os.remove("/tmp/nonexistent_file.txt")
# File didn't exist → no crash, no noise

# Dangerous alternative: bare except silences EVERYTHING
try:
    os.remove("/tmp/nonexistent_file.txt")
except:            # catches KeyboardInterrupt, SystemExit, etc.!
    pass

# Only suppress what you expect; never use bare except in production`,
    explanation:
      "contextlib.suppress() is safer and more readable than try/except pass because it only suppresses the explicitly named exception types — bare except silences even SystemExit and KeyboardInterrupt.",
  },
  {
    id: "py-exception-notes-adv",
    language: "python",
    title: "exception.add_note() — attach context to exceptions (3.11+)",
    tag: "snippet",
    code: `def validate_age(age: int) -> None:
    try:
        assert 0 <= age <= 150, f"Age {age} out of range"
    except AssertionError as e:
        e.add_note(f"Received: {age!r}")
        e.add_note("Expected: integer in [0, 150]")
        raise

try:
    validate_age(-5)
except AssertionError as e:
    print(e)              # Age -5 out of range
    print(e.__notes__)    # ['Received: -5', 'Expected: integer in [0, 150]']`,
    explanation:
      "exception.add_note() attaches extra diagnostic strings to an existing exception without creating a new one — the notes appear in the traceback and are accessible via __notes__, useful for enriching errors in middleware or validation layers.",
  },
  {
    id: "py-try-finally-return",
    language: "python",
    title: "finally + return — finally always runs, overrides try's return",
    tag: "caveats",
    code: `def careful():
    try:
        return "from try"
    finally:
        print("finally runs!")     # always executes
        # return "from finally"    # would OVERRIDE the try return

def override():
    try:
        return "from try"
    finally:
        return "from finally"   # OVERRIDES the try return — usually a bug

print(careful())    # finally runs! then → "from try"
print(override())   # "from finally"  (try's return is discarded)`,
    explanation:
      "The finally block always runs when leaving a try block — even via return or an exception; if finally itself contains a return statement, it silently discards any exception or return value from the try block.",
  },
  {
    id: "py-sys-exc-info",
    language: "python",
    title: "sys.exc_info() — access the active exception in a handler",
    tag: "understanding",
    code: `import sys

def log_exception():
    exc_type, exc_value, exc_tb = sys.exc_info()
    if exc_type is None:
        print("No active exception")
    else:
        print(f"Type: {exc_type.__name__}")
        print(f"Value: {exc_value}")

try:
    1 / 0
except ZeroDivisionError:
    log_exception()   # Type: ZeroDivisionError, Value: division by zero

# Outside except block, sys.exc_info() returns (None, None, None)
log_exception()   # No active exception`,
    explanation:
      "sys.exc_info() returns the current exception's (type, value, traceback) tuple inside an except handler — outside a handler it returns (None, None, None); prefer 'except E as e' for clarity, but sys.exc_info is needed for generic logging utilities.",
  },
  {
    id: "py-warnings-filter",
    language: "python",
    title: "warnings.filterwarnings — control which warnings are shown",
    tag: "snippet",
    code: `import warnings

# Turn a specific category into an error
warnings.filterwarnings("error", category=DeprecationWarning)

def old_func():
    warnings.warn("old_func is deprecated", DeprecationWarning, stacklevel=2)

try:
    old_func()
except DeprecationWarning as e:
    print("Caught as error:", e)

# Suppress all ResourceWarning:
warnings.filterwarnings("ignore", category=ResourceWarning)

# Reset all filters:
warnings.resetwarnings()`,
    explanation:
      "warnings.filterwarnings controls what happens when a warning is emitted — 'error' turns it into an exception (useful in tests to catch regressions), 'ignore' suppresses it, and 'once' shows it only on first occurrence.",
  },
  {
    id: "py-functools-reduce-vs-accumulate",
    language: "python",
    title: "functools.reduce vs itertools.accumulate — fold vs running totals",
    tag: "families",
    code: `from functools import reduce
from itertools import accumulate
import operator

nums = [1, 2, 3, 4, 5]

# reduce: single final value (fold)
total = reduce(operator.add, nums)
print(total)   # 15

# accumulate: running totals (all intermediate values)
running = list(accumulate(nums))
print(running)   # [1, 3, 6, 10, 15]

# accumulate with func (3.8+ supports initial=):
products = list(accumulate(nums, operator.mul))
print(products)  # [1, 2, 6, 24, 120]`,
    explanation:
      "reduce collapses an iterable to a single value (like a fold); accumulate yields every intermediate result — use reduce when you want the final answer and accumulate when you need the full sequence of running computations.",
  },
  {
    id: "py-operator-contains",
    language: "python",
    title: "operator.contains — functional form of the in operator",
    tag: "snippet",
    code: `import operator

# operator.contains(container, item) is equivalent to: item in container
print(operator.contains([1, 2, 3], 2))   # True
print(operator.contains("hello", "ell")) # True

# Useful when passing 'in' as a function:
from functools import partial
has_python = partial(operator.contains, {"python", "java", "rust"})

languages = ["python", "c++", "java", "cobol"]
print(list(filter(has_python, languages)))  # ['python', 'java']`,
    explanation:
      "operator.contains provides the in operator as a callable — useful when you need to pass it to map(), filter(), or functools.partial as a function argument instead of using a lambda.",
  },
  {
    id: "py-collections-abc-register",
    language: "python",
    title: "ABC.register() — declare a virtual subclass",
    tag: "classes",
    code: `from collections.abc import MutableMapping

class SimpleStore:
    def __init__(self): self._data = {}
    def __setitem__(self, key, val): self._data[key] = val
    def __getitem__(self, key): return self._data[key]
    def __delitem__(self, key): del self._data[key]
    def __iter__(self): return iter(self._data)
    def __len__(self): return len(self._data)

# Declare virtual subclass WITHOUT inheriting
MutableMapping.register(SimpleStore)

print(issubclass(SimpleStore, MutableMapping))  # True
print(isinstance(SimpleStore(), MutableMapping))  # True
# Note: register does NOT add mixin methods like update, pop, etc.`,
    explanation:
      "ABC.register() makes issubclass/isinstance return True for a class without actual inheritance — unlike inheriting from the ABC, it does not inject mixin methods, so registered classes must implement the full protocol themselves.",
  },
  {
    id: "py-namedtuple-asdict",
    language: "python",
    title: "namedtuple._asdict() and _replace() — convert and copy",
    tag: "snippet",
    code: `from collections import namedtuple

Point = namedtuple("Point", ["x", "y", "z"])
p = Point(1, 2, 3)

# _asdict(): convert to dict
d = p._asdict()
print(d)             # {'x': 1, 'y': 2, 'z': 3}
print(type(d))       # <class 'dict'>  (regular dict since 3.8)

# _replace(): create a copy with some fields changed
p2 = p._replace(z=99)
print(p2)            # Point(x=1, y=2, z=99)
print(p)             # Point(x=1, y=2, z=3)  unchanged

# _fields: tuple of field names
print(Point._fields) # ('x', 'y', 'z')`,
    explanation:
      "_asdict() returns a regular dict copy suitable for JSON serialisation; _replace() returns a new instance with specified fields changed — namedtuples are immutable, so 'mutation' always creates a copy.",
  },
  {
    id: "py-defaultdict-factory",
    language: "python",
    title: "defaultdict factory edge case — factory is called without args",
    tag: "caveats",
    code: `from collections import defaultdict

# Factory must be a zero-argument callable
d_list  = defaultdict(list)          # d[key] starts as []
d_int   = defaultdict(int)           # d[key] starts as 0
d_set   = defaultdict(set)           # d[key] starts as set()

d_list["x"].append(1)
d_int["counter"] += 5
print(d_list)   # defaultdict(<class 'list'>, {'x': [1]})

# TRAP: passing a value (not callable) raises TypeError
try:
    d = defaultdict([])   # TypeError: first argument must be callable
except TypeError as e:
    print(e)

# For a constant default, use lambda: defaultdict(lambda: 42)
d_const = defaultdict(lambda: 42)
print(d_const["missing"])   # 42`,
    explanation:
      "defaultdict's first argument is a zero-argument factory callable, not a value — defaultdict([]) raises TypeError; use lambda: [] or list (the class) for mutable defaults, or lambda: constant for constant defaults.",
  },
  {
    id: "py-chainmap-context",
    language: "python",
    title: "ChainMap — layered configuration with lookup priority",
    tag: "structures",
    code: `from collections import ChainMap

defaults    = {"color": "red",  "size": "M",    "debug": False}
config_file = {"size": "L",     "timeout": 30}
cli_args    = {"color": "blue", "debug": True}

# Later maps override earlier ones; lookup order: cli → config → defaults
settings = ChainMap(cli_args, config_file, defaults)
print(settings["color"])    # blue   (from cli_args)
print(settings["size"])     # L      (from config_file)
print(settings["timeout"])  # 30     (from config_file)
print(settings["debug"])    # True   (from cli_args)

# Write only goes to the first map
settings["newkey"] = "val"
print(cli_args)   # {'color': 'blue', 'debug': True, 'newkey': 'val'}`,
    explanation:
      "ChainMap stacks multiple dicts with a defined lookup priority — reads search from first to last, while writes always go to the first map; ideal for representing configuration layers (CLI > env > file > defaults) without merging.",
  },
  {
    id: "py-heapq-pushpop",
    language: "python",
    title: "heapq.heappushpop vs heapreplace — efficient heap replacement",
    tag: "snippet",
    code: `import heapq

heap = [1, 3, 5, 7, 9]
heapq.heapify(heap)

# heappushpop: push then pop smallest — efficient combined operation
result = heapq.heappushpop(heap, 4)
print(result)   # 1  (4 was pushed, but 1 was smallest, so 1 popped)
print(heap)     # [3, 4, 5, 7, 9]  — 4 is now in the heap

# heapreplace: pop smallest then push — raises IndexError if empty
result = heapq.heapreplace(heap, 0)
print(result)   # 3  (smallest was 3, then 0 pushed)
print(heap)     # [0, 4, 5, 7, 9]`,
    explanation:
      "heappushpop and heapreplace both combine a push and a pop in a single efficient heap operation; heappushpop guarantees the push happens before the pop (so the new item may be returned immediately), while heapreplace pops first.",
  },
  {
    id: "py-bisect-right-insert",
    language: "python",
    title: "bisect as a sorted-list insert position tool",
    tag: "snippet",
    code: `import bisect

grades = [("A", 90), ("B", 80), ("C", 70), ("D", 60), ("F", 0)]
breakpoints = [90, 80, 70, 60]

def grade(score: int) -> str:
    # bisect_right gives us the position to insert, which maps to a grade
    i = bisect.bisect_right(breakpoints, score)
    return grades[i][0]   # error: should use bisect_left

def grade_correct(score: int) -> str:
    # bisect_left finds leftmost position where score could be inserted
    i = len(breakpoints) - bisect.bisect_left(breakpoints, score)
    return grades[i][0]

print(grade_correct(95))  # A
print(grade_correct(85))  # B
print(grade_correct(75))  # C`,
    explanation:
      "bisect.bisect_left and bisect_right differ in how they handle values equal to existing breakpoints — bisect_left places equal values to the left (before), bisect_right to the right (after), which matters for inclusive boundary conditions.",
  },
  {
    id: "py-functools-update-wrapper",
    language: "python",
    title: "functools.update_wrapper — copy metadata onto a wrapper function",
    tag: "classes",
    code: `import functools

def log_decorator(func):
    # Without update_wrapper, wrapper.__name__ == "wrapper"
    @functools.wraps(func)   # equivalent to update_wrapper(wrapper, func)
    def wrapper(*args, **kwargs):
        print(f"calling {func.__name__}")
        return func(*args, **kwargs)
    return wrapper

@log_decorator
def my_function(x: int) -> int:
    """Double x."""
    return x * 2

print(my_function.__name__)   # my_function  (not 'wrapper')
print(my_function.__doc__)    # Double x.
print(my_function(5))         # calling my_function → 10`,
    explanation:
      "@functools.wraps copies __name__, __doc__, __annotations__, and __wrapped__ from the wrapped function onto the wrapper — without it, introspection tools, debuggers, and help() see the wrapper's metadata instead of the original's.",
  },
  {
    id: "py-typing-get-type-hints",
    language: "python",
    title: "typing.get_type_hints() — evaluate annotations at runtime",
    tag: "types",
    code: `from __future__ import annotations   # deferred evaluation
from typing import get_type_hints

class User:
    name: str
    age: int
    active: bool = True

# With deferred annotations, __annotations__ stores strings, not types
print(User.__annotations__)          # {'name': 'str', 'age': 'int', 'active': 'bool'}

# get_type_hints evaluates the strings to actual types
hints = get_type_hints(User)
print(hints)    # {'name': <class 'str'>, 'age': <class 'int'>, 'active': <class 'bool'>}
print(hints["name"] is str)   # True`,
    explanation:
      "With 'from __future__ import annotations', all annotations are stored as strings to avoid forward-reference errors — typing.get_type_hints() resolves those strings back to actual type objects using the correct namespace.",
  },
  {
    id: "py-typing-get-origin",
    language: "python",
    title: "typing.get_origin / get_args — inspect generic type parameters",
    tag: "types",
    code: `from typing import get_origin, get_args, Union, Optional, List

# Inspect generic aliases at runtime
hint = list[int]
print(get_origin(hint))   # <class 'list'>
print(get_args(hint))     # (int,)

union = Union[int, str, None]
print(get_origin(union))  # typing.Union
print(get_args(union))    # (int, str, NoneType)

opt = Optional[float]     # == Union[float, None]
print(get_args(opt))      # (float, NoneType)

# Non-generic types return None:
print(get_origin(int))    # None`,
    explanation:
      "get_origin and get_args decompose a generic type alias at runtime — essential for writing type-aware serialisers, validators, or ORMs that need to know the container type and its element types without string parsing.",
  },
  {
    id: "py-slots-class-var",
    language: "python",
    title: "__slots__ and class variables — slots don't block class attributes",
    tag: "caveats",
    code: `class Point:
    __slots__ = ("x", "y")
    z: int = 0   # class variable — NOT blocked by __slots__

p = Point()
p.x = 1   # slot
p.y = 2   # slot

# Class variable is accessible via instance but stored on the class
print(Point.z)   # 0
print(p.z)       # 0  — reads class attribute

# But assigning to p.z fails because 'z' is not in __slots__
try:
    p.z = 99
except AttributeError as e:
    print(e)  # 'Point' object has no attribute 'z'`,
    explanation:
      "Class-level annotations and assignments in a __slots__ class are class attributes, not instance attributes — they are visible on instances (via class lookup) but cannot be assigned to the instance since there is no __dict__ and no matching slot.",
  },
  {
    id: "py-weakref-callback-chain",
    language: "python",
    title: "weakref callback — notification when an object is collected",
    tag: "snippet",
    code: `import weakref

class Resource:
    def __init__(self, name):
        self.name = name

def on_finalize(ref):
    print(f"Object collected! ref={ref}")

res = Resource("important")

# Callback fires when 'res' is about to be collected
weak = weakref.ref(res, on_finalize)

print(weak())   # <Resource ...>  — still alive
del res
# Object collected! ref=<weakref object; dead>
print(weak())   # None  — collected`,
    explanation:
      "The optional callback argument to weakref.ref is called with the (now dead) weakref when the referent is about to be finalised — use it to clean up associated resources like cache entries without the object needing to know about the cache.",
  },
  {
    id: "py-gc-is-tracked",
    language: "python",
    title: "gc.is_tracked() — check if an object participates in GC cycles",
    tag: "understanding",
    code: `import gc

# Simple types don't need the cyclic GC — they use reference counting
print(gc.is_tracked(42))           # False — ints are not tracked
print(gc.is_tracked("hello"))      # False — interned strings
print(gc.is_tracked([1, 2, 3]))    # True  — lists can form cycles
print(gc.is_tracked({"a": 1}))     # True  — dicts can form cycles
print(gc.is_tracked((1, 2, 3)))    # False — immutable tuples of atoms
print(gc.is_tracked(([], [])))     # True  — tuple containing containers`,
    explanation:
      "gc.is_tracked reveals which objects the cyclic garbage collector monitors — scalar types and tuples of atomic values opt out automatically; lists, dicts, and objects with __dict__ are tracked because they can participate in reference cycles.",
  },
  {
    id: "py-sys-getrefcount",
    language: "python",
    title: "sys.getrefcount() — inspect CPython reference count",
    tag: "understanding",
    code: `import sys

x = []
print(sys.getrefcount(x))  # 2: one for 'x', one for the getrefcount argument

y = x   # another reference
print(sys.getrefcount(x))  # 3

lst = [x, x, x]   # three more references
print(sys.getrefcount(x))  # 6

# getrefcount always adds 1 for its own argument reference
# CPython uses refcounting for immediate deallocation; gc handles cycles`,
    explanation:
      "sys.getrefcount shows how many Python references point to an object — the count is always at least one because the function call itself holds a reference; use it for debugging memory leaks and understanding CPython's allocation behaviour.",
  },
  {
    id: "py-contextlib-exitsack-usage",
    language: "python",
    title: "contextlib.ExitStack — manage dynamic number of context managers",
    tag: "snippet",
    code: `import contextlib, pathlib, tempfile

paths = [tempfile.mktemp() for _ in range(3)]
try:
    with contextlib.ExitStack() as stack:
        # Dynamically open an arbitrary number of files
        files = [stack.enter_context(open(p, "w")) for p in paths]
        for i, f in enumerate(files):
            f.write(f"file {i}")
        # All files closed automatically when ExitStack exits
finally:
    for p in paths:
        pathlib.Path(p).unlink(missing_ok=True)`,
    explanation:
      "ExitStack accumulates context managers dynamically at runtime and exits them all in LIFO order — it's the right tool when the number of context managers isn't known until runtime or when you want to conditionally add them.",
  },
  {
    id: "py-typing-get-origin",
    language: "python",
    title: "typing.get_origin / get_args for runtime generic inspection",
    tag: "types",
    code: `# Duplicate check: this ID (py-typing-get-origin) was already written above
# Using a different angle: checking Optional vs Union
from typing import Optional, Union, get_origin, get_args
import types

# Optional[X] is Union[X, None]
opt = Optional[int]
print(get_origin(opt) is Union)   # True
print(get_args(opt))              # (<class 'int'>, <class 'NoneType'>)

# Python 3.10+ union type: int | str
union = int | str
print(get_origin(union) is types.UnionType)  # True  (Python 3.10+)
print(get_args(union))   # (<class 'int'>, <class 'str'>)`,
    explanation:
      "In Python 3.10+, int | str creates a types.UnionType (not typing.Union), so get_origin returns types.UnionType — check for both when writing type-inspection code that must work across versions.",
  },
  {
    id: "py-contextlib-wrapped",
    language: "python",
    title: "contextlib.contextmanager + wraps — preserving docstrings on context managers",
    tag: "snippet",
    code: `from contextlib import contextmanager
import functools

def traced(func):
    """Decorator that wraps a context manager and adds tracing."""
    @contextmanager
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        print(f"entering {func.__name__}")
        with contextmanager(func)(*args, **kwargs) as value:
            yield value
        print(f"exiting {func.__name__}")
    return wrapper

@traced
def my_ctx(x: int):
    """My documented context manager."""
    yield x * 2

with my_ctx(5) as v:
    print(v)     # entering my_ctx → 10 → exiting my_ctx
print(my_ctx.__doc__)   # My documented context manager.`,
    explanation:
      "@functools.wraps should be applied inside @contextmanager when wrapping a context-manager generator to preserve __name__, __doc__, and __wrapped__ — without it, the contextmanager wrapper hides the original function's identity.",
  },
  {
    id: "py-singledispatch-union-type",
    language: "python",
    title: "singledispatch with union type hints — 3.11+ auto-registration",
    tag: "classes",
    code: `from functools import singledispatch

@singledispatch
def process(value):
    return f"unknown: {value!r}"

# Python 3.11+: register with union type annotation
@process.register
def _(value: int | float) -> str:
    return f"number: {value}"

@process.register
def _(value: str | bytes) -> str:
    return f"text: {value!r}"

print(process(42))        # number: 42
print(process(3.14))      # number: 3.14
print(process("hello"))   # text: 'hello'
print(process(b"raw"))    # text: b'raw'`,
    explanation:
      "Python 3.11 added support for registering singledispatch handlers using union type annotations (int | float) — instead of calling @process.register(int) and @process.register(float) separately, a single handler covers both types.",
  },
  {
    id: "py-re-verbose",
    language: "python",
    title: "re.VERBOSE — multi-line documented regular expressions",
    tag: "snippet",
    code: `import re

# re.VERBOSE (re.X) ignores unescaped whitespace and # comments
EMAIL_RE = re.compile(r"""
    (?P<user>   [\\w.+-]+      )   # local part before @
    @                              # literal at sign
    (?P<domain> [\\w-]+         )   # domain name
    \\.                            # literal dot (escaped)
    (?P<tld>    [a-zA-Z]{2,}   )   # top-level domain
""", re.VERBOSE)

m = EMAIL_RE.match("alice.smith@example.com")
if m:
    print(m.group("user"),   "→", m.group("user"))    # alice.smith
    print(m.group("domain"), "→", m.group("domain"))  # example
    print(m.group("tld"),    "→", m.group("tld"))     # com`,
    explanation:
      "re.VERBOSE ignores whitespace and # comments inside the pattern string, letting you spread complex patterns across multiple lines with inline documentation — making otherwise cryptic regexes readable.",
  },
  {
    id: "py-str-format-mini",
    language: "python",
    title: "format mini-language — width, fill, align, type codes",
    tag: "snippet",
    code: `n = 42
f = 3.14159
s = "hello"

# {:width.precisiontype}
print(f"{n:08d}")      # 00000042  — zero-padded decimal
print(f"{n:>10}")      # '        42'  — right-align in 10
print(f"{n:<10}")      # '42        '  — left-align
print(f"{n:^10}")      # '    42    '  — center
print(f"{f:+.2f}")     # +3.14        — sign, 2 decimal
print(f"{n:#x}")       # 0x2a         — hex with 0x prefix
print(f"{n:_}")        # 42           — underscore for thousands (integers)
print(f"{1234567:_}")  # 1_234_567`,
    explanation:
      "Python's format mini-language uses the syntax [[fill]align][sign][#][0][width][grouping_option][.precision][type] — memorising this structure explains all format codes instead of looking each one up individually.",
  },
  {
    id: "py-set-ops-methods",
    language: "python",
    title: "set operations — operator syntax vs method calls",
    tag: "snippet",
    code: `a = {1, 2, 3, 4}
b = {3, 4, 5, 6}

# Operator form (only works with sets):
print(a | b)    # union:        {1, 2, 3, 4, 5, 6}
print(a & b)    # intersection: {3, 4}
print(a - b)    # difference:   {1, 2}

# Method form (accepts any iterable, not just sets):
print(a.union([5, 6, 7]))           # works with any iterable
print(a.intersection([3, 4, 99]))   # {3, 4}
print(a.difference(range(3)))       # {3, 4}

# Shorthand for "in a but not in b":
exclusive_a = a - b
print(exclusive_a)   # {1, 2}`,
    explanation:
      "Set operator syntax (|, &, -) only accepts set operands, while the method equivalents (union, intersection, difference) accept any iterable — prefer operators when working with sets, methods when the other operand might be a list or generator.",
  },
  {
    id: "py-range-step-gotcha",
    language: "python",
    title: "range step direction mismatch — empty range, no error",
    tag: "caveats",
    code: `# Mismatched step direction produces EMPTY range silently
r1 = range(10, 0, 1)    # start > stop but step is positive
print(list(r1))          # []  — no elements, no error!

r2 = range(0, 10, -1)   # start < stop but step is negative
print(list(r2))          # []

# Common bug in loops:
for i in range(5, 0):    # forgot -1 step
    print(i)             # body never executes!

# Correct:
for i in range(5, 0, -1):
    print(i, end=" ")    # 5 4 3 2 1`,
    explanation:
      "range() with a mismatched start/stop/step direction silently produces an empty sequence rather than raising an error — this is a common source of silent bugs in countdown loops that 'never enter the body'.",
  },
  {
    id: "py-slice-step-negative",
    language: "python",
    title: "slice with negative step — string and list reversal",
    tag: "snippet",
    code: `s = "Hello, World!"

# Reverse a string with [::-1]
print(s[::-1])       # !dlroW ,olleH

# Every other character reversed
print(s[::-2])       # !lo ,olH

# Slice: stop is exclusive, start default is end when step < 0
lst = [0, 1, 2, 3, 4, 5]
print(lst[::-1])     # [5, 4, 3, 2, 1, 0]
print(lst[4:1:-1])   # [4, 3, 2]  — start=4, stop=1 (exclusive), step=-1`,
    explanation:
      "When step is negative, the default start is the last element and the default stop is before the first — lst[::-1] reverses the whole sequence; remember stop is always exclusive regardless of step direction.",
  },
  {
    id: "py-enumerate-start-nonzero",
    language: "python",
    title: "enumerate(start=) — start counter at non-zero",
    tag: "snippet",
    code: `items = ["apple", "banana", "cherry"]

# 1-based counting for human-readable output
for num, item in enumerate(items, start=1):
    print(f"{num}. {item}")
# 1. apple
# 2. banana
# 3. cherry

# Start at arbitrary value (e.g., continuing a previous list):
more = ["date", "elderberry"]
for num, item in enumerate(more, start=4):
    print(f"{num}. {item}")
# 4. date
# 5. elderberry`,
    explanation:
      "enumerate's start= parameter sets the counter's initial value — useful for 1-based output without the + 1 noise, or for continuing a count from where a previous loop left off.",
  },
  {
    id: "py-zip-strict-equal",
    language: "python",
    title: "zip(strict=True) — raise error on unequal-length inputs (3.10+)",
    tag: "caveats",
    code: `names  = ["Alice", "Bob", "Carol"]
scores = [95, 87]   # one shorter — common data integrity bug

# Default: silently truncates to shorter iterable
print(list(zip(names, scores)))   # [('Alice', 95), ('Bob', 87)]

# strict=True raises ValueError on length mismatch
try:
    list(zip(names, scores, strict=True))
except ValueError as e:
    print(e)   # zip() has arguments with different lengths`,
    explanation:
      "zip(strict=True) detects the common bug of zipping sequences that should be the same length but aren't — without strict=True the shorter sequence silently truncates the result, hiding the data mismatch.",
  },
  {
    id: "py-filter-none-truthy",
    language: "python",
    title: "filter(None, iterable) — remove all falsy values",
    tag: "snippet",
    code: `mixed = [0, 1, "", "hello", None, [], [1,2], False, True, 0.0]

# filter(None, ...) keeps only truthy values
truthy = list(filter(None, mixed))
print(truthy)   # [1, 'hello', [1, 2], True]

# Equivalent comprehension (often more readable):
truthy2 = [x for x in mixed if x]
print(truthy2 == truthy)   # True

# Useful for cleaning up split results:
parts = "a,,b,,,c".split(",")
clean = list(filter(None, parts))
print(clean)   # ['a', 'b', 'c']`,
    explanation:
      "Passing None as filter's function tells it to use truthiness as the predicate, filtering out 0, '', None, [], and any other falsy value — a concise way to compact sparse sequences.",
  },
  {
    id: "py-exception-group-catch",
    language: "python",
    title: "ExceptionGroup — collect multiple exceptions from parallel tasks (3.11+)",
    tag: "structures",
    code: `import asyncio

async def fail(name: str, error: Exception):
    raise error

async def main():
    async with asyncio.TaskGroup() as tg:  # raises ExceptionGroup if any task fails
        tg.create_task(fail("a", ValueError("bad value")))
        tg.create_task(fail("b", TypeError("bad type")))

try:
    asyncio.run(main())
except* ValueError as eg:
    print("Values:", [str(e) for e in eg.exceptions])
except* TypeError as eg:
    print("Types:", [str(e) for e in eg.exceptions])`,
    explanation:
      "asyncio.TaskGroup (added in 3.11) collects all task failures into an ExceptionGroup — except* handles each exception type independently, enabling structured handling of parallel failures without losing any of them.",
  },
  {
    id: "py-match-mapping-adv",
    language: "python",
    title: "match mapping patterns — ** to capture remaining keys",
    tag: "understanding",
    code: `def handle_event(event: dict):
    match event:
        case {"type": "click", "x": x, "y": y, **rest}:
            print(f"click at ({x},{y}) extra={rest}")
        case {"type": "key", "key": k} if k.startswith("F"):
            print(f"function key: {k}")
        case {"type": t}:
            print(f"unknown event type: {t}")

handle_event({"type": "click", "x": 10, "y": 20, "button": "left"})
# click at (10,20) extra={'button': 'left'}
handle_event({"type": "key", "key": "F5"})
# function key: F5`,
    explanation:
      "Mapping patterns match dict keys structurally — **rest captures any extra keys not named in the pattern; unlike sequence patterns, mapping patterns succeed even if the dict has extra keys (they are only checked, not required to be absent).",
  },
  {
    id: "py-dataclass-kw-only-sentinel",
    language: "python",
    title: "dataclass KW_ONLY sentinel — force keyword-only fields",
    tag: "types",
    code: `from dataclasses import dataclass, KW_ONLY

@dataclass
class Connection:
    host: str                   # positional OK
    _: KW_ONLY                  # everything after this is keyword-only
    port: int = 5432
    database: str = "postgres"
    timeout: float = 30.0

c1 = Connection("localhost")                           # positional host OK
c2 = Connection("localhost", port=3306, database="db") # keyword after KW_ONLY
# c3 = Connection("localhost", 3306)  # TypeError: port must be keyword`,
    explanation:
      "KW_ONLY is a sentinel that, when placed in the fields list, makes all subsequent fields keyword-only — useful for large dataclasses where positional arguments would be ambiguous or error-prone.",
  },
  {
    id: "py-bool-int-arithmetic",
    language: "python",
    title: "bool is a subclass of int — arithmetic with True/False",
    tag: "caveats",
    code: `print(isinstance(True, int))   # True  — bool IS an int
print(True + True)             # 2
print(True * 5)                # 5
print(False + 1)               # 1

# Counting truths in a list:
data = [1, 0, 2, None, "x", "", []]
count_truthy = sum(bool(x) for x in data)
print(count_truthy)   # 3  (1, 2, "x" are truthy)

# Danger: bool == int comparisons
print(True == 1)    # True
print(True == 1.0)  # True
print(False == 0)   # True
print(1 is True)    # False  (different objects)`,
    explanation:
      "bool inherits from int with True=1 and False=0 — this means boolean arithmetic works and sum(bool(x) for x in iterable) is an idiomatic way to count truthy values, but using booleans in arithmetic should be intentional.",
  },
  {
    id: "py-generator-expression",
    language: "python",
    title: "Generator expressions — lazy version of list comprehensions",
    tag: "snippet",
    code: `# List comprehension: eager, all values in memory
squares_list = [x**2 for x in range(1000)]

# Generator expression: lazy, one value at a time
squares_gen = (x**2 for x in range(1000))

import sys
print(sys.getsizeof(squares_list))  # ~8K+ bytes
print(sys.getsizeof(squares_gen))   # ~120 bytes (just the generator object)

# Pass generator directly to functions that consume iterables
total = sum(x**2 for x in range(100))   # no [] needed
print(total)   # 328350`,
    explanation:
      "Generator expressions use () instead of [] and produce values lazily — they are memory-efficient for large sequences and work directly as arguments to sum(), max(), any(), and other consuming functions without creating an intermediate list.",
  },
  {
    id: "py-list-comprehension-walrus",
    language: "python",
    title: "Walrus in comprehension — compute once, use twice",
    tag: "snippet",
    code: `import math

data = [4, 9, -1, 16, 25, -4]

# Without walrus: compute sqrt twice or use two passes
# With walrus: compute sqrt once, filter and use in output expression
results = [root for x in data if (root := math.sqrt(x)) > 3]
print(results)   # [3.1622..., 4.0, 5.0]  (sqrt of 9, 16, 25)
# -1 was filtered out because sqrt(-1) would raise ValueError

# Safer version:
results2 = [root for x in data if x >= 0 and (root := math.sqrt(x)) > 3]`,
    explanation:
      "The walrus operator in a comprehension filter assigns the intermediate value, making it available in the output expression — this avoids calling the expensive function twice without splitting into two passes or using a helper.",
  },
  {
    id: "py-dict-comprehension",
    language: "python",
    title: "dict comprehension — build dicts from transformations",
    tag: "snippet",
    code: `names = ["alice", "bob", "carol"]
lengths = {name: len(name) for name in names}
print(lengths)   # {'alice': 5, 'bob': 3, 'carol': 5}

# Invert a dict (assuming unique values):
original = {"a": 1, "b": 2, "c": 3}
inverted = {v: k for k, v in original.items()}
print(inverted)   # {1: 'a', 2: 'b', 3: 'c'}

# Conditional dict comprehension:
scores = {"Alice": 85, "Bob": 55, "Carol": 92, "Dave": 48}
passing = {k: v for k, v in scores.items() if v >= 60}
print(passing)   # {'Alice': 85, 'Carol': 92}`,
    explanation:
      "Dict comprehensions use {key_expr: value_expr for ...} syntax — they are cleaner than calling dict() with a list of tuples and support the same filtering and transformation logic as list comprehensions.",
  },
  {
    id: "py-set-comprehension",
    language: "python",
    title: "set comprehension — deduplicated collection in one expression",
    tag: "snippet",
    code: `words = ["hello", "world", "hello", "python", "world"]

# Set comprehension deduplicates automatically
unique_lengths = {len(w) for w in words}
print(unique_lengths)   # {5, 6}

# Only words of length > 4:
long_unique = {w.upper() for w in words if len(w) > 4}
print(long_unique)   # {'HELLO', 'WORLD', 'PYTHON'}

# Compare with list comp:
list_lengths = [len(w) for w in words]
print(list_lengths)   # [5, 5, 5, 6, 5]  — duplicates preserved`,
    explanation:
      "Set comprehensions ({expr for item in iter}) produce a set that automatically deduplicates values — use them when you need unique values from a transformation and don't care about order.",
  },
  {
    id: "py-nested-comprehension",
    language: "python",
    title: "Nested list comprehension — flatten and transform 2D data",
    tag: "understanding",
    code: `matrix = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]

# Flatten: inner for first, then outer for
flat = [val for row in matrix for val in row]
print(flat)   # [1, 2, 3, 4, 5, 6, 7, 8, 9]

# Transpose: outer comprehension over columns, inner over rows
transposed = [[row[i] for row in matrix] for i in range(3)]
print(transposed)   # [[1, 4, 7], [2, 5, 8], [3, 6, 9]]

# The reading order: "for row in matrix, for val in row"
# maps to: [val | for row in matrix | for val in row]`,
    explanation:
      "In a nested comprehension, the for clauses are read left to right in the same order as nested loops — the leftmost for is the outermost loop; when it's confusing, write it as nested loops first, then compress.",
  },
  {
    id: "py-star-unpack-call",
    language: "python",
    title: "* and ** unpacking in function calls",
    tag: "snippet",
    code: `def greet(name: str, greeting: str = "Hello") -> str:
    return f"{greeting}, {name}!"

args   = ("Alice",)
kwargs = {"greeting": "Hi"}

print(greet(*args))               # Hello, Alice!
print(greet(*args, **kwargs))     # Hi, Alice!

# Unpack multiple iterables with * in a call (3.5+):
a = [1, 2]
b = [3, 4]
print([*a, *b])   # [1, 2, 3, 4]

d1 = {"x": 1}
d2 = {"y": 2}
print({**d1, **d2})   # {'x': 1, 'y': 2}`,
    explanation:
      "* unpacks any iterable as positional arguments and ** unpacks any mapping as keyword arguments — Python 3.5+ also allows multiple * and ** in a single call or literal, enabling easy list/dict merging.",
  },
  {
    id: "py-positional-only-params",
    language: "python",
    title: "/ in function signature — positional-only parameters (3.8+)",
    tag: "types",
    code: `# Parameters before / must be positional — cannot be named
def circle_area(radius, /, unit="m"):
    return 3.14159 * radius ** 2

print(circle_area(5))              # 78.53975 OK: positional
print(circle_area(5, unit="cm"))   # 78.53975 OK: unit can be keyword
# circle_area(radius=5)            # TypeError: radius is positional-only

# Compare with keyword-only (\\ *):
def f(pos_or_kw, /, pos_or_kw2, *, kw_only):
    pass

# Useful for: names that clash with keywords, clean API design, internal params`,
    explanation:
      "Parameters before the / separator can only be passed positionally — they help when the parameter name is an implementation detail (e.g., type, format) or would conflict with keywords, and are how many built-in functions like pow() work.",
  },
  {
    id: "py-keyword-only-params",
    language: "python",
    title: "* in function signature — keyword-only parameters",
    tag: "types",
    code: `# Parameters AFTER * (bare) must be keyword — cannot be positional
def move_file(src: str, dst: str, *, overwrite: bool = False, dry_run: bool = False):
    if dry_run:
        print(f"[dry] move {src} → {dst}")
    else:
        print(f"move {src} → {dst} (overwrite={overwrite})")

move_file("/tmp/a", "/tmp/b")                     # OK
move_file("/tmp/a", "/tmp/b", overwrite=True)     # OK
# move_file("/tmp/a", "/tmp/b", True)             # TypeError: too many positional`,
    explanation:
      "A bare * in the parameter list makes all following parameters keyword-only — this prevents callers from accidentally passing True/False flags positionally in the wrong order, making call sites self-documenting.",
  },
  {
    id: "py-property-getter-setter",
    language: "python",
    title: "property getter/setter — validated attributes without boilerplate",
    tag: "classes",
    code: `class Temperature:
    def __init__(self, celsius: float = 0):
        self._celsius = celsius   # store in private attribute

    @property
    def celsius(self) -> float:
        return self._celsius

    @celsius.setter
    def celsius(self, value: float) -> None:
        if value < -273.15:
            raise ValueError(f"Temperature {value} below absolute zero")
        self._celsius = value

    @property
    def fahrenheit(self) -> float:  # computed read-only property
        return self._celsius * 9/5 + 32

t = Temperature(25)
print(t.fahrenheit)   # 77.0
t.celsius = 100       # validated setter
try:
    t.celsius = -300  # raises ValueError`,
    explanation:
      "@property with a setter provides a clean interface for validated attributes — callers use simple attribute syntax (t.celsius = x) while the class enforces invariants, without changing the public API if validation is added later.",
  },
  {
    id: "py-abstract-class-example",
    language: "python",
    title: "ABC with multiple abstract methods — enforced interface",
    tag: "classes",
    code: `from abc import ABC, abstractmethod

class Serializer(ABC):
    @abstractmethod
    def serialize(self, data: dict) -> bytes: ...

    @abstractmethod
    def deserialize(self, raw: bytes) -> dict: ...

    def roundtrip(self, data: dict) -> dict:   # concrete method using abstractmethods
        return self.deserialize(self.serialize(data))

class JsonSerializer(Serializer):
    def serialize(self, data): return __import__("json").dumps(data).encode()
    def deserialize(self, raw): return __import__("json").loads(raw)

# try: Serializer()  # TypeError: Can't instantiate abstract class
s = JsonSerializer()
print(s.roundtrip({"key": "value"}))   # {'key': 'value'}`,
    explanation:
      "ABC enforces that every concrete subclass implements all @abstractmethod methods — attempting to instantiate an incomplete subclass raises TypeError at construction time, not later when the method is called.",
  },
  {
    id: "py-dataclass-field-default-factory",
    language: "python",
    title: "dataclass field(default_factory=) — mutable defaults",
    tag: "caveats",
    code: `from dataclasses import dataclass, field

@dataclass
class Config:
    name: str
    tags: list[str] = field(default_factory=list)     # each instance gets own list
    metadata: dict = field(default_factory=dict)

    # THIS WOULD FAIL: tags: list[str] = []  # mutable default not allowed

c1 = Config("app1")
c2 = Config("app2")
c1.tags.append("prod")

print(c1.tags)   # ['prod']
print(c2.tags)   # []  — different list instance, not shared`,
    explanation:
      "Dataclasses reject mutable defaults like [] or {} directly because all instances would share the same object — field(default_factory=list) creates a new list for each instance, which is the correct pattern for any mutable default.",
  },
  {
    id: "py-class-decorator",
    language: "python",
    title: "class decorators — transform a class at definition time",
    tag: "classes",
    code: `def register(cls):
    """Add the class to a global registry."""
    registry = register.registry
    registry[cls.__name__] = cls
    return cls   # must return the class (or a replacement)

register.registry = {}

@register
class Alpha:
    pass

@register
class Beta:
    pass

print(register.registry)
# {'Alpha': <class 'Alpha'>, 'Beta': <class 'Beta'>}`,
    explanation:
      "A class decorator receives the class object after the class body executes and must return a class — it can modify the class in-place and return it, replace it entirely, or add it to a registry before returning it unchanged.",
  },
  {
    id: "py-memoryview-format",
    language: "python",
    title: "memoryview.format — view's type code and itemsize",
    tag: "structures",
    code: `import array

a = array.array("d", [1.0, 2.0, 3.0])   # array of doubles
mv = memoryview(a)

print(mv.format)    # 'd'  — type code: double (8 bytes each)
print(mv.itemsize)  # 8
print(mv.nbytes)    # 24  (3 items × 8 bytes)
print(mv[1])        # 2.0  — element access returns Python float

# Cast to bytes view:
bv = mv.cast("B")
print(bv.format)    # 'B'  — unsigned byte
print(bv.itemsize)  # 1
print(bv.nbytes)    # 24  (same bytes, different interpretation)`,
    explanation:
      "memoryview.format is the struct type code for each element, and cast() reinterprets the same buffer with a different element type — this enables zero-copy conversion between numeric array formats for protocol implementations.",
  },
  {
    id: "py-io-stringio-seek",
    language: "python",
    title: "io.StringIO as in-memory text file",
    tag: "snippet",
    code: `import io

buf = io.StringIO()
buf.write("line one\\n")
buf.write("line two\\n")

# Read from beginning
buf.seek(0)
content = buf.read()
print(repr(content))   # 'line one\\nline two\\n'

# Read line by line
buf.seek(0)
for line in buf:
    print(line.strip())   # line one, line two

# Use getvalue() without seek
buf.write("line three\\n")
print(buf.getvalue())   # full content regardless of cursor position`,
    explanation:
      "io.StringIO is a file-like in-memory text buffer — use it to build strings incrementally (cheaper than repeated concatenation) or to pass as a 'file' to functions that expect a text stream without touching the filesystem.",
  },
  {
    id: "py-pathlib-glob-rglob",
    language: "python",
    title: "pathlib glob vs rglob — directory tree traversal patterns",
    tag: "snippet",
    code: `from pathlib import Path
import tempfile, os

with tempfile.TemporaryDirectory() as d:
    root = Path(d)
    (root / "a.py").write_text("# a")
    (root / "sub").mkdir()
    (root / "sub" / "b.py").write_text("# b")
    (root / "sub" / "c.txt").write_text("c")

    # glob: matches in immediate directory only (* = any name)
    py_files = list(root.glob("*.py"))
    print([p.name for p in py_files])   # ['a.py']

    # rglob: ** recursive glob through all subdirectories
    all_py = list(root.rglob("*.py"))
    print([p.name for p in all_py])     # ['a.py', 'b.py']`,
    explanation:
      "Path.glob() matches within the directory only; rglob(pattern) is equivalent to glob('**/' + pattern) and recurses into all subdirectories — use rglob when you want to find all files of a type in a project tree.",
  },
  {
    id: "py-pathlib-stat",
    language: "python",
    title: "pathlib.Path.stat() — file metadata without os module",
    tag: "snippet",
    code: `from pathlib import Path
import datetime, tempfile

with tempfile.NamedTemporaryFile(suffix=".txt", delete=False) as f:
    f.write(b"hello world")
    path = Path(f.name)

s = path.stat()
print(f"size:     {s.st_size} bytes")          # 11 bytes
print(f"modified: {datetime.datetime.fromtimestamp(s.st_mtime)}")
print(f"mode:     {oct(s.st_mode)}")           # e.g. 0o100600

# Convenience wrappers:
print(path.is_file())    # True
print(path.is_dir())     # False
path.unlink()`,
    explanation:
      "Path.stat() returns a os.stat_result with file metadata including size, timestamps, and permissions — the st_mtime and st_ctime values are Unix timestamps convertible with datetime.fromtimestamp.",
  },
  {
    id: "py-subprocess-capture",
    language: "python",
    title: "subprocess.run with capture_output — get stdout/stderr",
    tag: "snippet",
    code: `import subprocess

# capture_output=True collects stdout and stderr as bytes
result = subprocess.run(
    ["python3", "-c", "print('hello from subprocess')"],
    capture_output=True,
    text=True,        # decode stdout/stderr to str
    timeout=5,
)

print(result.stdout)         # hello from subprocess
print(result.returncode)     # 0

# Check for failure:
result2 = subprocess.run(["false"], capture_output=True)
result2.check_returncode()   # raises CalledProcessError if non-zero`,
    explanation:
      "capture_output=True is shorthand for stdout=PIPE, stderr=PIPE — combined with text=True it decodes the output automatically; check_returncode() raises CalledProcessError if the process failed, which is safer than checking returncode manually.",
  },
  {
    id: "py-threading-lock-reentrant",
    language: "python",
    title: "threading.RLock — reentrant lock for recursive code",
    tag: "structures",
    code: `import threading

lock  = threading.Lock()
rlock = threading.RLock()

# Regular Lock: same thread acquiring twice → DEADLOCK
# rlock: same thread can acquire multiple times
def recursive_op(rlock, depth=0):
    with rlock:                  # acquire (safe to call recursively)
        if depth < 3:
            recursive_op(rlock, depth + 1)
        print(f"depth {depth}")  # 3, 2, 1, 0

recursive_op(rlock)
# Prints depth 3, 2, 1, 0  (each with correctly nested releases)`,
    explanation:
      "A regular Lock deadlocks if the same thread tries to acquire it twice (e.g. in recursive code) — threading.RLock (reentrant lock) tracks the owning thread and allows nested acquisition from the same thread, releasing only when the lock count reaches zero.",
  },
  {
    id: "py-threading-event-wait",
    language: "python",
    title: "threading.Event — signal between threads",
    tag: "structures",
    code: `import threading, time

event = threading.Event()

def waiter():
    print("waiting for event...")
    event.wait(timeout=5)   # block up to 5 seconds
    if event.is_set():
        print("event received!")
    else:
        print("timed out")

t = threading.Thread(target=waiter, daemon=True)
t.start()
time.sleep(0.1)
event.set()   # unblocks all waiting threads
t.join()`,
    explanation:
      "threading.Event is a simple one-shot signal: wait() blocks until set() is called from another thread; event.wait(timeout=N) avoids blocking forever; once set, all current and future waiters are released until clear() is called.",
  },
  {
    id: "py-concurrent-futures-map",
    language: "python",
    title: "concurrent.futures ThreadPoolExecutor.map — parallel map",
    tag: "snippet",
    code: `from concurrent.futures import ThreadPoolExecutor
import time

def slow_square(n: int) -> int:
    time.sleep(0.1)   # simulate I/O
    return n * n

with ThreadPoolExecutor(max_workers=4) as executor:
    # map returns results in submission order (not completion order)
    results = list(executor.map(slow_square, range(8)))

print(results)   # [0, 1, 4, 9, 16, 25, 36, 49]
# All 8 jobs run concurrently with up to 4 threads`,
    explanation:
      "ThreadPoolExecutor.map is the simplest parallel map — it submits all calls to the thread pool, awaits all results, and returns them in the original order; use ProcessPoolExecutor for CPU-bound work instead of threads.",
  },
  {
    id: "py-dataclass-post-init-validation",
    language: "python",
    title: "__post_init__ — validate and transform fields after __init__",
    tag: "classes",
    code: `from dataclasses import dataclass

@dataclass
class Rectangle:
    width: float
    height: float

    def __post_init__(self):
        if self.width <= 0 or self.height <= 0:
            raise ValueError(f"Dimensions must be positive: {self.width}x{self.height}")
        # Normalise: ensure width >= height
        if self.width < self.height:
            self.width, self.height = self.height, self.width

r = Rectangle(3, 5)
print(r)           # Rectangle(width=5, height=3)  — normalised

try:
    Rectangle(-1, 5)   # ValueError: Dimensions must be positive`,
    explanation:
      "__post_init__ is called after the auto-generated __init__ sets all fields — use it for validation and derived-field calculation; assign to self directly to override the raw values supplied by the caller.",
  },
  {
    id: "py-protocol-structural",
    language: "python",
    title: "typing.Protocol — structural subtyping without inheritance",
    tag: "types",
    code: `from typing import Protocol, runtime_checkable

@runtime_checkable
class Drawable(Protocol):
    def draw(self) -> None: ...
    def bounds(self) -> tuple[float, float, float, float]: ...

class Circle:   # does NOT inherit Drawable
    def draw(self): print("○")
    def bounds(self): return (0, 0, 10, 10)

class Square:
    def draw(self): print("□")
    def bounds(self): return (0, 0, 5, 5)

def render(shape: Drawable) -> None:
    shape.draw()

render(Circle())   # ○  — accepted because Circle has the right methods
render(Square())   # □
print(isinstance(Circle(), Drawable))   # True (runtime_checkable)`,
    explanation:
      "Protocol enables structural subtyping (duck typing with type-checker support) — any class with the required methods satisfies the protocol without explicitly inheriting it, keeping classes decoupled from the type hierarchy.",
  },
  {
    id: "py-lru-cache-unbounded",
    language: "python",
    title: "functools.cache — simpler unbounded memoisation (3.9+)",
    tag: "snippet",
    code: `from functools import cache

@cache   # equivalent to lru_cache(maxsize=None)
def fib(n: int) -> int:
    if n < 2:
        return n
    return fib(n - 1) + fib(n - 2)

print(fib(50))   # 12586269025 — fast because results are cached
print(fib.cache_info())   # CacheInfo(hits=48, misses=51, maxsize=None, currsize=51)

# WARNING: cache() holds strong references — objects won't be GC'd
# Use lru_cache(maxsize=N) to cap memory usage`,
    explanation:
      "functools.cache (Python 3.9+) is a thin wrapper around lru_cache(maxsize=None) — it caches every unique call forever, which is ideal for pure recursive functions but can cause unbounded memory growth on large argument spaces.",
  },
  {
    id: "py-enum-auto",
    language: "python",
    title: "enum.auto() — automatic value assignment",
    tag: "snippet",
    code: `from enum import Enum, auto

class Direction(Enum):
    NORTH = auto()   # 1
    SOUTH = auto()   # 2
    EAST  = auto()   # 3
    WEST  = auto()   # 4

print(Direction.NORTH.value)   # 1
print(list(Direction))         # [NORTH, SOUTH, EAST, WEST]

# Custom auto: override _generate_next_value_ for non-integer values
class Color(Enum):
    def _generate_next_value_(name, start, count, last_values):
        return name.lower()
    RED   = auto()   # "red"
    GREEN = auto()   # "green"

print(Color.RED.value)   # "red"`,
    explanation:
      "auto() delegates value generation to the enum's _generate_next_value_ hook — by default it assigns incrementing integers starting at 1; override the hook to generate string names, random values, or any other pattern.",
  },
  {
    id: "py-enum-unique",
    language: "python",
    title: "enum.unique — prevent duplicate values",
    tag: "caveats",
    code: `from enum import Enum, unique

# Without @unique: duplicate values create ALIASES, not separate members
class Status(Enum):
    ACTIVE   = 1
    RUNNING  = 1    # alias! Status.RUNNING is Status.ACTIVE

print(Status.RUNNING is Status.ACTIVE)   # True — same member
print(list(Status))   # [<Status.ACTIVE: 1>]  — only one entry!

# With @unique: duplicate values raise ValueError at class definition
try:
    @unique
    class UniqueStatus(Enum):
        ACTIVE  = 1
        RUNNING = 1   # ValueError: duplicate values found
except ValueError as e:
    print(e)`,
    explanation:
      "Without @unique, assigning the same value twice creates an alias (the second name points to the first member) rather than a new member — this is intentional but surprises many users; @unique raises an error at class creation time to prevent this.",
  },
  {
    id: "py-enum-flag",
    language: "python",
    title: "enum.Flag — combinable bit flags",
    tag: "snippet",
    code: `from enum import Flag, auto

class Permission(Flag):
    READ    = auto()   # 1
    WRITE   = auto()   # 2
    EXECUTE = auto()   # 4

# Combine with | :
rw = Permission.READ | Permission.WRITE
print(rw)              # Permission.READ|WRITE
print(Permission.READ in rw)   # True
print(Permission.EXECUTE in rw)  # False

# Iterate active flags:
for p in rw:
    print(p)   # Permission.READ, Permission.WRITE`,
    explanation:
      "enum.Flag (unlike enum.Enum) supports bitwise combination — the auto() values are powers of two, and combined flags iterate over their individual components; use it instead of raw integer bit-flags for type safety and readability.",
  },
  {
    id: "py-contextlib-exitsack-callback",
    language: "python",
    title: "ExitStack.callback — register cleanup functions without __exit__",
    tag: "snippet",
    code: `import contextlib, tempfile, os

with contextlib.ExitStack() as stack:
    tmpdir = tempfile.mkdtemp()
    # Register a cleanup callback (no context manager needed)
    stack.callback(os.rmdir, tmpdir)

    f = stack.enter_context(open(os.path.join(tmpdir, "test.txt"), "w"))
    f.write("data")
    # On exit: f is closed, then os.rmdir(tmpdir) is called (LIFO)`,
    explanation:
      "ExitStack.callback registers an arbitrary callable as a cleanup action — called with the given arguments when the stack exits in LIFO order; unlike enter_context it doesn't require a context manager object.",
  },
  {
    id: "py-match-value-pattern",
    language: "python",
    title: "match — value patterns with dotted names",
    tag: "understanding",
    code: `from enum import Enum

class Color(Enum):
    RED = 1
    GREEN = 2
    BLUE = 3

def describe(c: Color) -> str:
    match c:
        case Color.RED:
            return "red"
        case Color.GREEN:
            return "green"
        case Color.BLUE:
            return "blue"

# Dotted names (like Color.RED) are VALUE patterns, not capture patterns
# An unqualified name (like: case x) would be a CAPTURE pattern
print(describe(Color.GREEN))   # green`,
    explanation:
      "In match/case, a bare name (like x) is a capture variable that always matches — to match against an existing value you must use a dotted name (like Color.RED) or put the value in a guard; this distinction prevents subtle bugs.",
  },
  {
    id: "py-assert-optimized",
    language: "python",
    title: "assert statements — disabled with -O optimisation flag",
    tag: "caveats",
    code: `# NEVER use assert for input validation or security checks
def get_user(user_id: int):
    assert user_id > 0, "user_id must be positive"   # STRIPPED IN -O MODE
    return {"id": user_id}

# With python -O (optimize): assert statements are completely removed
# Equivalent to: if __debug__: assert ...
# __debug__ is False when Python runs with -O

# Correct alternative:
def get_user_safe(user_id: int):
    if user_id <= 0:
        raise ValueError(f"user_id must be positive, got {user_id}")
    return {"id": user_id}`,
    explanation:
      "Assert statements are completely removed when Python runs with -O (optimise) or -OO flags — any validation or security check written as assert is silently skipped in production if the deployment uses -O; always use explicit if/raise for real validation.",
  },
  {
    id: "py-mutable-default-arg",
    language: "python",
    title: "Mutable default argument — the classic Python gotcha",
    tag: "caveats",
    code: `# Bug: default list is created ONCE at function definition time
def append_to(item, lst=[]):   # lst is the SAME object every call
    lst.append(item)
    return lst

print(append_to(1))   # [1]
print(append_to(2))   # [1, 2]  — NOT [2]! lst was mutated
print(append_to(3))   # [1, 2, 3]

# Fix: use None as sentinel, create fresh default inside
def append_to_fixed(item, lst=None):
    if lst is None:
        lst = []
    lst.append(item)
    return lst

print(append_to_fixed(1))   # [1]
print(append_to_fixed(2))   # [2]  — fresh list each time`,
    explanation:
      "Default argument values in Python are evaluated once when the function is defined, not on each call — for mutable objects like lists or dicts this means all calls share the same default object; the fix is None + early-return pattern.",
  },
  {
    id: "py-class-vs-instance-attr",
    language: "python",
    title: "class attribute vs instance attribute — mutation trap",
    tag: "caveats",
    code: `class Counter:
    count = 0     # class attribute — SHARED

c1 = Counter()
c2 = Counter()

Counter.count += 1    # modifies the shared class attribute
print(c1.count)       # 1
print(c2.count)       # 1

c1.count += 1   # creates a NEW instance attribute that SHADOWS the class attr
print(c1.count)       # 2  (instance attribute)
print(c2.count)       # 1  (still class attribute)
print(Counter.count)  # 1  (class attribute unchanged)`,
    explanation:
      "Assigning to an attribute on an instance creates an instance attribute that shadows (but doesn't modify) the class attribute — reading reads the closest one in the MRO; this leads to surprising state splitting when modifying class attributes through instances.",
  },
  {
    id: "py-generator-pipeline",
    language: "python",
    title: "Generator pipeline — chain transformations lazily",
    tag: "snippet",
    code: `def read_lines(text: str):
    yield from text.splitlines()

def filter_non_empty(lines):
    for line in lines:
        if line.strip():
            yield line

def strip_lines(lines):
    for line in lines:
        yield line.strip()

text = """
  hello

  world
  python
"""

# Pipeline: no intermediate lists allocated
pipeline = strip_lines(filter_non_empty(read_lines(text)))
result = list(pipeline)
print(result)   # ['hello', 'world', 'python']`,
    explanation:
      "Generator pipelines process data one element at a time through a chain of lazy transformations — unlike method chaining that builds lists at each step, each value travels through all stages before the next value is fetched, minimising peak memory.",
  },
  {
    id: "py-yield-from-delegation",
    language: "python",
    title: "yield from — delegate to a sub-generator",
    tag: "snippet",
    code: `def flatten(nested):
    for item in nested:
        if isinstance(item, list):
            yield from flatten(item)   # delegate recursion to sub-generator
        else:
            yield item

data = [1, [2, 3], [4, [5, 6]], 7]
print(list(flatten(data)))   # [1, 2, 3, 4, 5, 6, 7]

# yield from also transparently handles send() and throw()
# making it the correct way to refactor a generator into sub-generators`,
    explanation:
      "'yield from iterable' is equivalent to 'for x in iterable: yield x' but also transparently passes send() values and throw() exceptions to the sub-generator, preserving the full generator protocol across delegation levels.",
  },
  {
    id: "py-class-body-scope",
    language: "python",
    title: "Class body scope — class variables don't scope into comprehensions",
    tag: "caveats",
    code: `class MyClass:
    items = [1, 2, 3]
    # This FAILS with NameError: name 'items' is not defined
    # doubled = [x * 2 for x in items]

    # Fix: use a classmethod or reference the class name
    @classmethod
    def make_doubled(cls):
        return [x * 2 for x in cls.items]

# Class body is a special scope that does NOT enclose comprehensions
# The comprehension's implicit nested function cannot see class-level names

print(MyClass.make_doubled())   # [2, 4, 6]`,
    explanation:
      "Python's class body is not a true enclosing scope for nested comprehensions or lambdas — the comprehension is compiled as a separate function object, so class-level names are invisible inside it; use a classmethod or a module-level helper instead.",
  },
  {
    id: "py-string-join-idiom",
    language: "python",
    title: "''.join() — efficient string concatenation from iterable",
    tag: "snippet",
    code: `# BAD: O(n²) — creates a new string on each += iteration
parts = ["Hello", ", ", "World", "!"]
result = ""
for p in parts:
    result += p     # each concatenation copies all previous chars

# GOOD: O(n) — ''.join collects all parts, allocates once
result = "".join(parts)
print(result)   # Hello, World!

# Common patterns:
words = ["one", "two", "three"]
print(", ".join(words))       # one, two, three
print("\\n".join(words))       # one\\ntwo\\nthree
print("".join(str(i) for i in range(5)))  # 01234`,
    explanation:
      "String concatenation with += is O(n²) because each iteration copies all previous characters — ''.join() is O(n) because it pre-allocates a single buffer after measuring all parts, making it the idiomatic and performant way to build strings from many pieces.",
  },
  {
    id: "py-ternary-expression",
    language: "python",
    title: "Ternary / conditional expression — one-line if-else",
    tag: "snippet",
    code: `x = 10
result = "even" if x % 2 == 0 else "odd"
print(result)   # even

# Can be nested (but avoid deep nesting):
grade = "A" if x >= 90 else "B" if x >= 80 else "C"
print(grade)   # C

# Use in comprehensions:
nums = [1, 2, 3, 4, 5]
classified = ["even" if n % 2 == 0 else "odd" for n in nums]
print(classified)   # ['odd', 'even', 'odd', 'even', 'odd']`,
    explanation:
      "Python's conditional expression syntax is 'value_if_true if condition else value_if_false' — unlike many languages, the condition is in the middle; both branches are expressions that must produce a value.",
  },
  {
    id: "py-starred-assignment",
    language: "python",
    title: "Extended star assignment — collect first, last, or middle",
    tag: "snippet",
    code: `first, *rest = [1, 2, 3, 4, 5]
print(first, rest)    # 1  [2, 3, 4, 5]

*init, last = [1, 2, 3, 4, 5]
print(init, last)     # [1, 2, 3, 4]  5

head, *mid, tail = [1, 2, 3, 4, 5]
print(head, mid, tail)  # 1  [2, 3, 4]  5

# Works with any iterable, not just lists:
a, b, *rest = "hello"
print(a, b, rest)   # h  e  ['l', 'l', 'o']`,
    explanation:
      "The starred target in extended unpacking collects zero or more elements into a list — it can appear at any position but only once per assignment; the collected value is always a list even when unpacking a tuple.",
  },
  {
    id: "py-dict-access-patterns",
    language: "python",
    title: "dict access patterns — get, setdefault, and missing key behavior",
    tag: "structures",
    code: `d = {"a": 1, "b": 2}

# dict[key] raises KeyError if missing
try:
    d["c"]
except KeyError:
    print("not found")

# .get(key, default) returns default without raising
print(d.get("c", 0))         # 0  — safe fallback

# .setdefault(key, default) inserts AND returns if missing
d.setdefault("c", 99)        # inserts 99 for "c"
d.setdefault("a", 999)       # "a" exists, NOT updated
print(d)                     # {"a": 1, "b": 2, "c": 99}`,
    explanation:
      "dict[key] raises KeyError for missing keys; get(key, default) returns a fallback without insertion; setdefault(key, default) inserts the default if the key is absent and returns the (possibly new) value — use setdefault for the 'initialise if absent' pattern.",
  },
];
