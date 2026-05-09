import type { Snippet } from "./types";

export const pythonSnippets20260509P1: Snippet[] = [
  {
    id: "py-snippet-walrus-while",
    language: "python",
    title: "Walrus operator := in a while loop",
    tag: "snippet",
    code: `import random
# := assigns and returns the value in one expression
while (val := random.randint(1, 10)) != 7:
    print(f'rolled {val}')
print(f'got 7!')
# Avoids calling randint twice or introducing a sentinel variable`,
    explanation: "The walrus operator (:=) assigns a value inside an expression, letting the while condition both compute and test in a single step.",
  },
  {
    id: "py-understanding-late-binding",
    language: "python",
    title: "Closures capture variables by reference, not by value",
    tag: "understanding",
    code: `fns = [lambda: i for i in range(5)]
print([f() for f in fns])   # [4, 4, 4, 4, 4] -- all see i=4

# Fix: bind i at definition time via a default argument
fns2 = [lambda i=i: i for i in range(5)]
print([f() for f in fns2])  # [0, 1, 2, 3, 4]`,
    explanation: "Python closures capture the variable itself, not its current value; when the loop ends i is 4, so every lambda sees 4. A default-argument forces immediate binding.",
  },
  {
    id: "py-structures-deque-rotate",
    language: "python",
    title: "deque.rotate shifts elements efficiently",
    tag: "structures",
    code: `from collections import deque
d = deque([1, 2, 3, 4, 5])
d.rotate(2)          # shift right by 2
print(d)             # deque([4, 5, 1, 2, 3])
d.rotate(-1)         # shift left by 1
print(d)             # deque([5, 1, 2, 3, 4])
# Equivalent to: d.appendleft(d.pop()) repeated n times`,
    explanation: "deque.rotate is O(k) and implemented in C; it's the canonical way to implement a circular buffer or rotate a queue without slicing.",
  },
  {
    id: "py-caveats-float-equality",
    language: "python",
    title: "Never compare floats with ==",
    tag: "caveats",
    code: `x = 0.1 + 0.2
print(x == 0.3)          # False
print(x)                 # 0.30000000000000004

# Fix: use math.isclose
import math
print(math.isclose(x, 0.3))          # True
print(math.isclose(x, 0.3, rel_tol=1e-9))  # True`,
    explanation: "IEEE 754 floating-point arithmetic introduces tiny rounding errors, so exact equality almost always fails; math.isclose compares within a tolerance instead.",
  },
  {
    id: "py-types-literal-annotation",
    language: "python",
    title: "Literal restricts a variable to specific values",
    tag: "types",
    code: `from typing import Literal

Mode = Literal['r', 'w', 'a', 'rb', 'wb']

def open_file(path: str, mode: Mode) -> None:
    print(f'opening {path} in mode {mode}')

open_file('data.txt', 'r')     # OK
# open_file('data.txt', 'x')  # type checker flags this`,
    explanation: "Literal narrows a type to a finite set of constant values, letting the type checker catch invalid arguments at analysis time rather than at runtime.",
  },
  {
    id: "py-families-io-string-bytes",
    language: "python",
    title: "StringIO vs BytesIO: in-memory file objects",
    tag: "families",
    code: `from io import StringIO, BytesIO

# StringIO holds text (str)
sbuf = StringIO()
sbuf.write('hello world')
sbuf.seek(0)
print(sbuf.read())           # hello world

# BytesIO holds raw bytes
bbuf = BytesIO()
bbuf.write(b'\\x00\\x01\\x02')
bbuf.seek(0)
print(list(bbuf.read()))     # [0, 1, 2]`,
    explanation: "StringIO is used when an API expects a text-mode file object but you only have a string; BytesIO does the same for binary-mode APIs. Both behave exactly like open() file objects.",
  },
  {
    id: "py-classes-slots-memory",
    language: "python",
    title: "__slots__ eliminates per-instance __dict__",
    tag: "classes",
    code: `import sys

class WithDict:
    def __init__(self, x, y): self.x = x; self.y = y

class WithSlots:
    __slots__ = ('x', 'y')
    def __init__(self, x, y): self.x = x; self.y = y

a = WithDict(1, 2)
b = WithSlots(1, 2)
print(sys.getsizeof(a.__dict__))   # ~232 bytes
print(hasattr(b, '__dict__'))      # False`,
    explanation: "__slots__ replaces the per-instance __dict__ with fixed-size C slots, reducing memory by 30-50% and slightly speeding up attribute access on classes with many instances.",
  },
  {
    id: "py-snippet-dict-merge-pipe",
    language: "python",
    title: "Merge dicts with | (Python 3.9+)",
    tag: "snippet",
    code: `defaults = {'color': 'blue', 'size': 'M', 'qty': 1}
overrides = {'size': 'L', 'qty': 3}

# | creates a new merged dict; right side wins on key conflicts
merged = defaults | overrides
print(merged)  # {'color': 'blue', 'size': 'L', 'qty': 3}

# |= updates in place
defaults |= overrides
print(defaults['size'])  # L`,
    explanation: "The | operator for dicts (Python 3.9+) is cleaner than {**a, **b} and makes the merge intent explicit; the right operand's values win on conflicts.",
  },
  {
    id: "py-understanding-mutable-default",
    language: "python",
    title: "Mutable default argument is shared across calls",
    tag: "understanding",
    code: `def append_item(item, lst=[]):   # lst created ONCE at def time
    lst.append(item)
    return lst

print(append_item(1))  # [1]
print(append_item(2))  # [1, 2]  -- same list!
print(append_item(3))  # [1, 2, 3]

# Fix: use None as sentinel
def safe_append(item, lst=None):
    if lst is None: lst = []
    lst.append(item)
    return lst`,
    explanation: "Default argument values are evaluated once when the function is defined, not on each call; mutable defaults like [] or {} accumulate state across calls.",
  },
  {
    id: "py-structures-heapq-nsmallest",
    language: "python",
    title: "heapq.nsmallest finds k smallest efficiently",
    tag: "structures",
    code: `import heapq
data = [15, 3, 22, 7, 1, 18, 9, 4]
print(heapq.nsmallest(3, data))   # [1, 3, 4]
print(heapq.nlargest(3, data))    # [22, 18, 15]

# With a key function:
records = [('Alice', 30), ('Bob', 25), ('Carol', 35)]
print(heapq.nsmallest(2, records, key=lambda r: r[1]))
# [('Bob', 25), ('Alice', 30)]`,
    explanation: "heapq.nsmallest(k, iterable) runs in O(n log k) and is more efficient than sorting the full list when k is much smaller than n.",
  },
  {
    id: "py-caveats-mutable-class-var-shared",
    language: "python",
    title: "Mutable class variable is shared by all instances",
    tag: "caveats",
    code: `class Team:
    members = []                # class-level list, shared!
    def add(self, name): self.members.append(name)

t1, t2 = Team(), Team()
t1.add('Alice')
t2.add('Bob')
print(t1.members)  # ['Alice', 'Bob'] -- not what you expected!

# Fix: initialise in __init__
class Team2:
    def __init__(self): self.members = []`,
    explanation: "Class-level mutable objects are stored once on the class and shared by every instance; only assigning to self.members creates a per-instance attribute.",
  },
  {
    id: "py-types-final-annotation",
    language: "python",
    title: "Final prevents reassignment",
    tag: "types",
    code: `from typing import Final

MAX_RETRIES: Final = 3
API_URL: Final[str] = 'https://api.example.com'

# Type checkers flag this:
# MAX_RETRIES = 5  # Cannot assign to final name

class Config:
    TIMEOUT: Final = 30   # also works on class attributes`,
    explanation: "Final tells type checkers that a variable must not be reassigned after its initial binding; it's the Python equivalent of const and has no runtime enforcement.",
  },
  {
    id: "py-families-json-pickle-cmp",
    language: "python",
    title: "json vs pickle vs shelve for serialisation",
    tag: "families",
    code: `import json, pickle, shelve

data = {'name': 'Alice', 'scores': [95, 87, 92]}

# json: human-readable, only basic types, cross-language
json_str = json.dumps(data)

# pickle: binary, any Python object, Python-only, unsafe
blob = pickle.dumps(data)

# shelve: persistent dict backed by pickle, keyed on strings
with shelve.open('/tmp/store') as db:
    db['record'] = data
    print(db['record']['name'])   # Alice`,
    explanation: "Use json for interoperability and human-readable storage; use pickle only for Python-to-Python serialisation of complex objects; shelve adds a file-backed dict layer on top of pickle.",
  },
  {
    id: "py-classes-getattr-hook",
    language: "python",
    title: "__getattr__ handles missing attribute access",
    tag: "classes",
    code: `class FlexConfig:
    def __init__(self, data): self._data = data
    def __getattr__(self, name):
        # Called only when normal lookup fails
        if name in self._data:
            return self._data[name]
        raise AttributeError(f'No config key: {name!r}')

cfg = FlexConfig({'timeout': 30, 'retries': 3})
print(cfg.timeout)   # 30
print(cfg.retries)   # 3
# print(cfg.missing) # raises AttributeError`,
    explanation: "__getattr__ is only invoked when the attribute is not found through normal means (instance dict and class dict); use it for dynamic attribute delegation without overriding every real attribute lookup.",
  },
  {
    id: "py-snippet-removeprefix",
    language: "python",
    title: "str.removeprefix and str.removesuffix (Python 3.9+)",
    tag: "snippet",
    code: `s = 'https://example.com/path'
clean = s.removeprefix('https://')
print(clean)    # example.com/path

filename = 'report_final.csv'
print(filename.removesuffix('.csv'))   # report_final
print(filename.removesuffix('.txt'))   # report_final.csv (unchanged)
# removeprefix/removesuffix return the original string if not found`,
    explanation: "removeprefix/removesuffix return the string unchanged if the prefix/suffix is absent, unlike slicing which always removes characters regardless.",
  },
  {
    id: "py-understanding-bool-is-int",
    language: "python",
    title: "bool is a subclass of int in Python",
    tag: "understanding",
    code: `print(isinstance(True, int))    # True
print(True + True)              # 2
print(True * 5)                 # 5
print(False - 1)                # -1
print(sum([True, False, True, True]))  # 3
# Count truthy items in a list
data = [0, 1, '', 'hi', None, 42]
print(sum(bool(x) for x in data))  # 3`,
    explanation: "bool inherits from int with True==1 and False==0; this makes bool values usable in arithmetic, including the common pattern of summing a boolean generator to count truthy items.",
  },
  {
    id: "py-structures-bisect-left",
    language: "python",
    title: "bisect maintains a sorted list without full re-sort",
    tag: "structures",
    code: `import bisect
scores = [60, 70, 75, 85, 90]
# Find insertion point (left) for 78
pos = bisect.bisect_left(scores, 78)
print(pos)   # 3
bisect.insort(scores, 78)
print(scores)  # [60, 70, 75, 78, 85, 90]
# Binary search: O(log n) lookup
idx = bisect.bisect_left(scores, 85)
print(scores[idx] == 85)   # True`,
    explanation: "bisect.insort keeps a list sorted in O(log n) search + O(n) insertion; it's ideal for maintaining a running sorted collection without always re-sorting from scratch.",
  },
  {
    id: "py-caveats-generator-exhaust",
    language: "python",
    title: "Generators can only be consumed once",
    tag: "caveats",
    code: `def evens(n):
    for i in range(n):
        if i % 2 == 0: yield i

gen = evens(10)
print(list(gen))   # [0, 2, 4, 6, 8]
print(list(gen))   # []  -- exhausted!

# Fix: wrap in a function or materialise as a list
data = list(evens(10))
print(data)        # [0, 2, 4, 6, 8]
print(data)        # [0, 2, 4, 6, 8]`,
    explanation: "A generator is a single-pass iterator; once it raises StopIteration there is no rewind. If you need to iterate multiple times, materialise it into a list first.",
  },
  {
    id: "py-types-overload-decorator",
    language: "python",
    title: "@overload provides per-signature type narrowing",
    tag: "types",
    code: `from typing import overload, Union

@overload
def process(x: int) -> int: ...
@overload
def process(x: str) -> str: ...

def process(x: Union[int, str]) -> Union[int, str]:
    if isinstance(x, int):
        return x * 2
    return x.upper()

print(process(5))       # 10
print(process('hi'))    # HI`,
    explanation: "@overload lets you declare multiple call signatures for the same function so that type checkers can infer the return type precisely based on the argument type passed.",
  },
  {
    id: "py-families-path-os-cmp",
    language: "python",
    title: "pathlib.Path vs os.path for file system operations",
    tag: "families",
    code: `import os
from pathlib import Path

# os.path style: string-based
p_str = os.path.join('/data', 'reports', 'q1.csv')
print(os.path.basename(p_str))   # q1.csv

# pathlib style: object-oriented
p = Path('/data') / 'reports' / 'q1.csv'
print(p.name)        # q1.csv
print(p.stem)        # q1
print(p.suffix)      # .csv
print(p.parent)      # /data/reports`,
    explanation: "pathlib.Path (3.4+) treats paths as objects with attributes and methods rather than strings, making common operations like joining, globbing, and reading files more readable and less error-prone.",
  },
  {
    id: "py-classes-contains-protocol",
    language: "python",
    title: "__contains__ powers the in operator",
    tag: "classes",
    code: `class IPRange:
    def __init__(self, start, end): self.start=start; self.end=end
    def __contains__(self, ip):
        def to_int(s): return int.from_bytes(bytes(map(int, s.split('.'))), 'big')
        return to_int(self.start) <= to_int(ip) <= to_int(self.end)

r = IPRange('10.0.0.1', '10.0.0.100')
print('10.0.0.50' in r)   # True
print('10.0.1.1' in r)    # False`,
    explanation: "__contains__(self, item) is called by the in operator; implementing it lets your custom class behave naturally in membership tests without requiring the caller to know internal structure.",
  },
  {
    id: "py-snippet-min-key-fn",
    language: "python",
    title: "min/max with a key function",
    tag: "snippet",
    code: `students = [
    {'name': 'Alice', 'gpa': 3.8},
    {'name': 'Bob',   'gpa': 3.5},
    {'name': 'Carol', 'gpa': 3.9},
]
top = max(students, key=lambda s: s['gpa'])
print(top['name'])   # Carol

words = ['banana', 'fig', 'cherry', 'apple']
print(min(words, key=len))   # fig`,
    explanation: "The key parameter accepts any callable; min/max compare the key's return values rather than the objects themselves, avoiding a full sort when you only need the extreme element.",
  },
  {
    id: "py-understanding-except-scope",
    language: "python",
    title: "Exception variable is deleted after the except block",
    tag: "understanding",
    code: `try:
    1 / 0
except ZeroDivisionError as e:
    msg = str(e)    # capture before e disappears
    print(e)        # division by zero

# e is deleted here to break reference cycles
try:
    print(e)
except NameError:
    print('e is gone')  # this prints`,
    explanation: "Python deletes the as-target variable (e) at the end of an except clause to break the reference cycle between the exception and its traceback; capture anything you need before the block ends.",
  },
  {
    id: "py-structures-counter-most-common",
    language: "python",
    title: "Counter.most_common returns top-N frequencies",
    tag: "structures",
    code: `from collections import Counter
words = 'the cat sat on the mat the cat'.split()
c = Counter(words)
print(c.most_common(3))
# [('the', 3), ('cat', 2), ('sat', 1)]

# Counter arithmetic
a = Counter({'x': 3, 'y': 2})
b = Counter({'x': 1, 'y': 4, 'z': 1})
print(a + b)   # Counter({'y': 6, 'x': 4, 'z': 1})
print(a - b)   # Counter({'x': 2})  -- negatives dropped`,
    explanation: "Counter.most_common(n) uses a heap for efficiency; Counter supports +, -, &, | operations that merge or intersect frequency maps.",
  },
  {
    id: "py-caveats-augmented-tuple-error",
    language: "python",
    title: "+= on a tuple raises TypeError but still mutates nested list",
    tag: "caveats",
    code: `t = ([1, 2], 'hello')
try:
    t[0] += [3, 4]   # raises TypeError...
except TypeError as e:
    print(e)         # 'tuple' object does not support item assignment
print(t)             # ([1, 2, 3, 4], 'hello') -- mutation happened!
# Because: LOAD t[0], call __iadd__ (mutates list), STORE back -> TypeError`,
    explanation: "Python's += compiles to an in-place operation then a store; the list mutation succeeds but the tuple store raises TypeError, leaving the tuple modified despite the exception.",
  }
];
