import type { Snippet } from "./types";

export const pythonSnippets20260518B2: Snippet[] = [
  {
    id: "py-b18-b2-heapq-nsmallest",
    language: "python",
    title: "heapq.nsmallest and nlargest for top-N queries",
    tag: "snippet",
    code: `import heapq

nums = [5, 1, 8, 3, 9, 2, 7, 4, 6]

top3    = heapq.nlargest(3, nums)
bottom3 = heapq.nsmallest(3, nums)

print(top3)     # [9, 8, 7]
print(bottom3)  # [1, 2, 3]

# With a key function:
words = ["banana", "fig", "apple", "cherry"]
print(heapq.nsmallest(2, words, key=len))   # ['fig', 'apple']`,
    explanation: "`heapq.nlargest/nsmallest(n, iterable, key)` use a heap to find the top-N elements in O(k log n) time — more efficient than sorting the whole sequence when n is much smaller than len(iterable).",
  },
  {
    id: "py-b18-b2-itertools-pairwise",
    language: "python",
    title: "itertools.pairwise for consecutive pairs",
    tag: "snippet",
    code: `import itertools

data = [10, 20, 30, 40, 50]

# Python 3.10+: itertools.pairwise
for a, b in itertools.pairwise(data):
    print(f"{a} -> {b}")
# 10 -> 20  20 -> 30  30 -> 40  40 -> 50

# Pre-3.10 equivalent:
# zip(data, data[1:])`,
    explanation: "`itertools.pairwise(iterable)` yields consecutive overlapping pairs `(s[0],s[1])`, `(s[1],s[2])` etc. — useful for computing differences or checking adjacent elements.",
  },
  {
    id: "py-b18-b2-str-removeprefix-removesuffix",
    language: "python",
    title: "str.removeprefix and str.removesuffix (Python 3.9+)",
    tag: "snippet",
    code: `filename = "test_login.py"

# Old way — fragile if prefix is absent:
if filename.startswith("test_"):
    name = filename[len("test_"):]

# New way — returns string unchanged if prefix not present:
name = filename.removeprefix("test_").removesuffix(".py")
print(name)   # login`,
    explanation: "`removeprefix(p)` removes `p` from the start only if the string starts with it; `removesuffix(s)` does the same for the end — unlike slicing, they're safe when the affix is absent.",
  },
  {
    id: "py-b18-b2-match-structural",
    language: "python",
    title: "Structural pattern matching with match/case (Python 3.10+)",
    tag: "snippet",
    code: `def handle(event):
    match event:
        case {"type": "click", "x": x, "y": y}:
            print(f"click at ({x}, {y})")
        case {"type": "key", "key": k}:
            print(f"key pressed: {k}")
        case {"type": str(t)}:
            print(f"unknown event type: {t}")
        case _:
            print("not an event dict")

handle({"type": "click", "x": 10, "y": 20})  # click at (10, 20)
handle({"type": "key",   "key": "Enter"})     # key pressed: Enter`,
    explanation: "Structural pattern matching deconstructs dicts, sequences, and objects in `case` arms; capture patterns (`x`, `k`) bind matched values without an explicit assignment.",
  },
  {
    id: "py-b18-b2-contextlib-suppress",
    language: "python",
    title: "contextlib.suppress silences specific exceptions",
    tag: "snippet",
    code: `from contextlib import suppress
import os

# Without suppress:
try:
    os.remove("nonexistent.txt")
except FileNotFoundError:
    pass

# With suppress — same effect, more readable:
with suppress(FileNotFoundError):
    os.remove("nonexistent.txt")

# Multiple exception types:
with suppress(FileNotFoundError, PermissionError):
    os.remove("/etc/passwd")`,
    explanation: "`contextlib.suppress(*exceptions)` catches and ignores the listed exception types in the block — a cleaner alternative to a `try/except: pass` for expected non-errors.",
  },
  {
    id: "py-b18-b2-itertools-chain-from-iterable",
    language: "python",
    title: "itertools.chain.from_iterable flattens one level",
    tag: "snippet",
    code: `import itertools

nested = [[1, 2, 3], [4, 5], [6, 7, 8, 9]]

flat = list(itertools.chain.from_iterable(nested))
print(flat)   # [1, 2, 3, 4, 5, 6, 7, 8, 9]

# Equivalent to:
# list(itertools.chain(*nested))
# [x for sub in nested for x in sub]

# Only flattens one level deep:
deep = [[[1, 2], [3]], [[4, 5]]]
print(list(itertools.chain.from_iterable(deep)))
# [[1, 2], [3], [4, 5]]`,
    explanation: "`chain.from_iterable` takes a single iterable of iterables and concatenates them without creating a temporary expanded argument list — more memory-efficient than `chain(*nested)`.",
  },
  {
    id: "py-b18-b2-pathlib-read-write",
    language: "python",
    title: "pathlib.Path read_text and write_text",
    tag: "snippet",
    code: `from pathlib import Path

p = Path("/tmp/demo.txt")

# Write and read in one call:
p.write_text("hello world", encoding="utf-8")
content = p.read_text(encoding="utf-8")
print(content)   # hello world

# Binary:
p.write_bytes(b"\\x00\\x01\\x02")
print(p.read_bytes())   # b'\\x00\\x01\\x02'

p.unlink()   # delete`,
    explanation: "`Path.write_text/read_text` handles the open/write/close lifecycle in one call; always pass `encoding=` to avoid platform-dependent defaults.",
  },
  {
    id: "py-b18-b2-collections-ordereddict-move",
    language: "python",
    title: "OrderedDict.move_to_end for LRU cache pattern",
    tag: "snippet",
    code: `from collections import OrderedDict

class LRUCache:
    def __init__(self, capacity):
        self.cache = OrderedDict()
        self.cap = capacity

    def get(self, key):
        if key not in self.cache: return -1
        self.cache.move_to_end(key)   # mark as recently used
        return self.cache[key]

    def put(self, key, val):
        self.cache[key] = val
        self.cache.move_to_end(key)
        if len(self.cache) > self.cap:
            self.cache.popitem(last=False)   # evict oldest

c = LRUCache(2)
c.put(1, 10); c.put(2, 20)
print(c.get(1))   # 10  — 1 becomes most recent
c.put(3, 30)      # evicts key 2 (least recently used)
print(c.get(2))   # -1`,
    explanation: "`OrderedDict.move_to_end(key, last=True)` moves a key to the most-recent (or least-recent) end — the core primitive for implementing an O(1) LRU cache without a doubly-linked list.",
  },
  {
    id: "py-b18-b2-dataclass-field-compare",
    language: "python",
    title: "dataclass field(compare=False) excludes field from equality",
    tag: "snippet",
    code: `from dataclasses import dataclass, field

@dataclass
class Task:
    name:    str
    priority: int
    _id: int = field(default=0, compare=False, repr=False)

t1 = Task("deploy", 1, _id=101)
t2 = Task("deploy", 1, _id=202)
print(t1 == t2)   # True  — _id excluded from comparison
print(repr(t1))   # Task(name='deploy', priority=1)  — _id excluded`,
    explanation: "`field(compare=False)` prevents a field from being included in the auto-generated `__eq__` and `__lt__` methods; `repr=False` also hides it from `__repr__`.",
  },
  {
    id: "py-b18-b2-type-narrowing-assert",
    language: "python",
    title: "assert isinstance() narrows types in branches",
    tag: "snippet",
    code: `from typing import Union

def process(val: Union[int, str, None]) -> int:
    if val is None:
        return 0
    if isinstance(val, str):
        return len(val)   # type narrowed to str here
    return val * 2        # type narrowed to int here

print(process(None))   # 0
print(process("hi"))   # 2
print(process(5))      # 10`,
    explanation: "Type checkers like mypy and pyright narrow the type of `val` inside each `isinstance` branch — the code is both runtime-correct and statically typed without explicit casts.",
  },
  {
    id: "py-b18-b2-float-nan-semantics",
    language: "python",
    title: "NaN is not equal to itself — use math.isnan",
    tag: "understanding",
    code: `import math

nan = float("nan")

print(nan == nan)      # False  — IEEE 754 rule
print(nan != nan)      # True
print(nan < 0)         # False
print(nan > 0)         # False
print(nan is nan)      # True  — same object, but == is False

# Correct check:
print(math.isnan(nan))   # True

# In collections, nan creates surprising duplicates:
s = {nan, nan}
print(len(s))   # 2 on CPython (both fail == check)`,
    explanation: "IEEE 754 specifies that NaN is not equal to anything, including itself; use `math.isnan()` (or `cmath.isnan` for complex) to test for NaN rather than `==`.",
  },
  {
    id: "py-b18-b2-generator-send",
    language: "python",
    title: "generator.send() passes a value back into the generator",
    tag: "understanding",
    code: `def accumulator():
    total = 0
    while True:
        delta = yield total   # receives sent value, yields running total
        total += delta

gen = accumulator()
next(gen)           # advance to first yield (priming)
print(gen.send(10)) # 10
print(gen.send(5))  # 15
print(gen.send(20)) # 35`,
    explanation: "`generator.send(value)` resumes the generator and makes the `yield` expression evaluate to `value`; `next(gen)` is equivalent to `gen.send(None)`. The first call must be `next()` or `send(None)` to prime the generator.",
  },
  {
    id: "py-b18-b2-weakref-dict",
    language: "python",
    title: "weakref.WeakValueDictionary auto-evicts collected entries",
    tag: "understanding",
    code: `import weakref, gc

class Widget:
    def __init__(self, name): self.name = name

cache = weakref.WeakValueDictionary()

w = Widget("button")
cache["btn"] = w
print("btn" in cache)   # True

del w
gc.collect()
print("btn" in cache)   # False — evicted automatically`,
    explanation: "`WeakValueDictionary` stores weak references to values; when no strong reference to a value remains, the entry is automatically removed — ideal for caches that shouldn't prevent GC.",
  },
  {
    id: "py-b18-b2-property-caching",
    language: "python",
    title: "functools.cached_property for memoised properties",
    tag: "understanding",
    code: `from functools import cached_property
import time

class Analysis:
    def __init__(self, data):
        self.data = data

    @cached_property
    def result(self):
        print("computing...")
        time.sleep(0.01)   # simulate expensive work
        return sum(self.data)

a = Analysis(range(1000))
print(a.result)   # computing... 499500
print(a.result)   # 499500  — served from instance dict, no recompute`,
    explanation: "`functools.cached_property` computes on first access, then stores the value in the instance's `__dict__` under the same name — shadowing the descriptor for all future accesses.",
  },
  {
    id: "py-b18-b2-exception-groups",
    language: "python",
    title: "ExceptionGroup and except* (Python 3.11)",
    tag: "understanding",
    code: `# ExceptionGroup wraps multiple exceptions:
eg = ExceptionGroup("io errors", [
    ValueError("bad value"),
    TypeError("wrong type"),
])

try:
    raise eg
except* ValueError as eg_val:
    print("ValueError(s):", eg_val.exceptions)
except* TypeError as eg_type:
    print("TypeError(s):", eg_type.exceptions)
# ValueError(s): (ValueError('bad value'),)
# TypeError(s):  (TypeError('wrong type'),)`,
    explanation: "`ExceptionGroup` bundles multiple exceptions; `except*` handles only the matching sub-exceptions from a group, letting others propagate — designed for `asyncio.TaskGroup` concurrent errors.",
  },
  {
    id: "py-b18-b2-class-var-default",
    language: "python",
    title: "Class variable vs instance variable — assignment semantics",
    tag: "understanding",
    code: `class Counter:
    count = 0   # class variable

    def increment(self):
        Counter.count += 1    # modifies class variable (correct)
        # self.count += 1     # would create an instance variable!

c1, c2 = Counter(), Counter()
c1.increment()
c2.increment()
print(Counter.count)   # 2  — shared state
print(c1.count)        # 2  — reads class variable
c1.count = 99          # creates an instance variable on c1
print(Counter.count)   # 2  — class variable unchanged`,
    explanation: "Reading `self.attr` checks the instance dict first, then the class. Writing `self.attr = value` always creates an instance variable — use the class name to modify the class variable.",
  },
  {
    id: "py-b18-b2-try-except-else-finally",
    language: "python",
    title: "try/except/else/finally — all four clauses",
    tag: "understanding",
    code: `def read_config(path):
    try:
        f = open(path)
    except FileNotFoundError:
        print("file not found")
        return {}
    else:
        # Runs only if no exception was raised in try
        data = f.read()
        print("file read successfully")
    finally:
        # Always runs — even after return/raise in try or else
        f.close()
        print("file closed")
    return data`,
    explanation: "The `else` clause runs only when the `try` block succeeds without exception; `finally` runs unconditionally — even if a `return` or re-raise occurs in other clauses.",
  },
  {
    id: "py-b18-b2-set-update-methods",
    language: "python",
    title: "Set update methods: add, update, discard, remove",
    tag: "structures",
    code: `s = {1, 2, 3}

s.add(4)           # add a single element
s.update([5, 6])   # add multiple elements from iterable
print(s)           # {1, 2, 3, 4, 5, 6}

s.discard(10)      # no error if not present
s.remove(3)        # KeyError if not present
print(s)           # {1, 2, 4, 5, 6}

# Intersection update (in-place):
s &= {1, 2, 4, 7}
print(s)   # {1, 2, 4}`,
    explanation: "`discard` is safer than `remove` when the element may not exist; `update` bulk-adds from any iterable; `&=` / `|=` / `-=` do in-place set operations.",
  },
  {
    id: "py-b18-b2-deque-as-stack",
    language: "python",
    title: "deque as a thread-safe stack or queue",
    tag: "structures",
    code: `from collections import deque

# Stack (LIFO): append / pop
stack = deque()
stack.append(1)
stack.append(2)
stack.append(3)
print(stack.pop())    # 3

# Queue (FIFO): append / popleft
queue = deque()
queue.append("a")
queue.append("b")
print(queue.popleft())  # a

# Both ends O(1) — unlike list.insert(0, ...) which is O(n)`,
    explanation: "`deque` supports O(1) appends and pops from both ends; use it instead of a list when you need a queue (popleft) — `list.pop(0)` is O(n) due to shifting.",
  },
  {
    id: "py-b18-b2-dict-pop-popitem",
    language: "python",
    title: "dict.pop vs dict.popitem — key lookup vs arbitrary removal",
    tag: "structures",
    code: `d = {"a": 1, "b": 2, "c": 3}

# pop: remove and return by key
val = d.pop("b")
print(val)   # 2
print(d)     # {'a': 1, 'c': 3}

# pop with default — safe if key absent:
print(d.pop("z", None))   # None

# popitem: remove and return (key, value) — LIFO since Python 3.7
k, v = d.popitem()
print(k, v)   # c 3  (last inserted)`,
    explanation: "`dict.pop(k)` removes a key by name; `popitem()` removes and returns the last-inserted item (LIFO order) — useful for graph algorithms that process and drain a dict.",
  },
  {
    id: "py-b18-b2-heapq-pushpop",
    language: "python",
    title: "heapq.heappushpop is more efficient than push then pop",
    tag: "structures",
    code: `import heapq

heap = [1, 3, 5, 7]
heapq.heapify(heap)

# heappushpop: push then pop, but more efficient (one heap sift)
result = heapq.heappushpop(heap, 4)
print(result)     # 1  (old minimum, 4 displaced it)
print(heap)       # [3, 4, 5, 7]

# heapreplace: pop then push (always replaces root)
result2 = heapq.heapreplace(heap, 0)
print(result2)    # 3
print(heap)       # [0, 4, 5, 7]`,
    explanation: "`heappushpop` and `heapreplace` combine two operations into one heap sift — O(log n) vs 2×O(log n) — `heapreplace` requires the heap to be non-empty.",
  },
  {
    id: "py-b18-b2-memoryview-shared",
    language: "python",
    title: "memoryview protocol for zero-copy buffer sharing",
    tag: "structures",
    code: `import struct

data = bytearray(16)
view = memoryview(data)

# Write a 4-byte int at offset 4:
struct.pack_into(">I", data, 4, 0xDEADBEEF)

# Read back via a view slice:
chunk = view[4:8]
print(chunk.tobytes().hex())   # deadbeef
print(bytes(chunk))            # b'\\xde\\xad\\xbe\\xef'

# cast to interpret bytes as shorts:
ints = view.cast("H")   # unsigned 16-bit
print(len(ints))        # 8  (16 bytes / 2)`,
    explanation: "`memoryview.cast(format)` reinterprets the bytes as a different numeric type — no copy — giving C-like raw memory access for binary protocol work.",
  },
  {
    id: "py-b18-b2-subprocess-check",
    language: "python",
    title: "subprocess.check_output vs run with check=True",
    tag: "structures",
    code: `import subprocess

# Legacy: raises CalledProcessError on non-zero exit code
output = subprocess.check_output(["echo", "hello"], text=True)
print(output.strip())   # hello

# Modern equivalent: capture output + raise on failure
result = subprocess.run(
    ["echo", "world"], capture_output=True, text=True, check=True
)
print(result.stdout.strip())   # world

# Both raise subprocess.CalledProcessError on failure`,
    explanation: "`check_output` is a legacy helper; prefer `subprocess.run(..., capture_output=True, check=True)` — it returns a `CompletedProcess` with both stdout and stderr accessible.",
  },
  {
    id: "py-b18-b2-mutable-default-class-pattern",
    language: "python",
    title: "Mutable default argument trap — shared across all calls",
    tag: "caveats",
    code: `# BROKEN — the list is created ONCE at function definition
def append_item(item, lst=[]):
    lst.append(item)
    return lst

print(append_item("a"))   # ['a']
print(append_item("b"))   # ['a', 'b']  — same list!

# CORRECT — use None as sentinel
def append_safe(item, lst=None):
    if lst is None:
        lst = []
    lst.append(item)
    return lst

print(append_safe("x"))   # ['x']
print(append_safe("y"))   # ['y']  — independent`,
    explanation: "Default argument values are evaluated once when the function is defined; mutable defaults (list, dict, set) are shared across all calls. Use `None` as a sentinel and create the object inside.",
  },
  {
    id: "py-b18-b2-is-vs-equals",
    language: "python",
    title: "is checks identity, == checks value — they differ for strings",
    tag: "caveats",
    code: `a = "hello"
b = "hello"
print(a is b)    # True  — CPython interns short strings
print(a == b)    # True

c = "hello world"
d = "hello world"
print(c is d)    # MAYBE False — longer strings may not be interned
print(c == d)    # True

# Never use 'is' to compare values — always use ==
# 'is' is only correct for None, True, False:
x = None
print(x is None)   # correct idiom`,
    explanation: "CPython interns some strings as an implementation detail but doesn't guarantee it; `is` should only be used to test for `None`, `True`, `False`, or other singletons.",
  },
  {
    id: "py-b18-b2-float-equality",
    language: "python",
    title: "Floating-point equality — use math.isclose",
    tag: "caveats",
    code: `a = 0.1 + 0.2
b = 0.3

print(a == b)        # False!  0.1+0.2 = 0.30000000000000004

import math
print(math.isclose(a, b))                        # True
print(math.isclose(a, b, rel_tol=1e-9))          # True

# For currency / exact decimal arithmetic:
from decimal import Decimal
x = Decimal("0.1") + Decimal("0.2")
print(x == Decimal("0.3"))   # True`,
    explanation: "`0.1 + 0.2 != 0.3` due to IEEE 754 rounding; use `math.isclose(a, b, rel_tol=1e-9)` for approximate comparisons, or `decimal.Decimal` for exact arithmetic.",
  },
  {
    id: "py-b18-b2-exception-base-class",
    language: "python",
    title: "except Exception doesn't catch SystemExit or KeyboardInterrupt",
    tag: "caveats",
    code: `import sys

# BaseException
# ├── SystemExit          — sys.exit()
# ├── KeyboardInterrupt   — Ctrl-C
# ├── GeneratorExit
# └── Exception           — all "normal" errors
#     ├── ValueError, TypeError, ...

try:
    raise SystemExit(1)
except Exception:
    print("caught")         # NOT printed

try:
    raise SystemExit(1)
except BaseException:
    print("caught base")    # printed`,
    explanation: "`except Exception` is best practice for general error handling; `SystemExit`, `KeyboardInterrupt`, and `GeneratorExit` all derive from `BaseException` directly and should not be swallowed.",
  },
  {
    id: "py-b18-b2-walrus-while-sentinel",
    language: "python",
    title: "Walrus operator in while for sentinel reads",
    tag: "caveats",
    code: `import io

buf = io.BytesIO(b"hello world from the buffer")
CHUNK = 4

# Without walrus — reads data twice in spirit:
data = buf.read(CHUNK)
while data:
    print(data)
    data = buf.read(CHUNK)

# With walrus — assignment inside condition:
buf.seek(0)
while chunk := buf.read(CHUNK):
    print(chunk)`,
    explanation: "The walrus operator eliminates the read-before-loop pattern by assigning and testing in the same expression — avoids duplicating the `read()` call.",
  },
  {
    id: "py-b18-b2-threading-local",
    language: "python",
    title: "threading.local vs contextvars.ContextVar",
    tag: "families",
    code: `import threading
import contextvars

# threading.local: per-thread storage
local = threading.local()
local.value = 42
print(local.value)  # 42

# contextvars.ContextVar: per-task storage for async code
request_id: contextvars.ContextVar[int] = contextvars.ContextVar("request_id")

token = request_id.set(1)
print(request_id.get())   # 1
request_id.reset(token)   # restore previous value`,
    explanation: "`threading.local` is per-OS-thread; `contextvars.ContextVar` is per-async-task (coroutine context) — use `ContextVar` for asyncio code so each request gets its own isolated state.",
  },
  {
    id: "py-b18-b2-functools-reduce",
    language: "python",
    title: "functools.reduce vs sum/max/min for aggregation",
    tag: "families",
    code: `from functools import reduce
import operator

nums = [1, 2, 3, 4, 5]

# reduce is the general form — most specific built-ins are faster:
print(reduce(operator.add, nums))   # 15  — use sum() instead
print(reduce(operator.mul, nums))   # 120 — use math.prod() instead

# reduce is useful for operations without a built-in:
from collections import Counter
counters = [Counter("abc"), Counter("bcd")]
merged = reduce(operator.add, counters)
print(merged)   # Counter({'b': 2, 'c': 2, 'a': 1, 'd': 1})`,
    explanation: "`functools.reduce` applies a binary function cumulatively — use it for operations without a dedicated built-in; prefer `sum`, `max`, `min`, or `math.prod` when available.",
  },
  {
    id: "py-b18-b2-csv-writer",
    language: "python",
    title: "csv.writer for correct CSV output with quoting",
    tag: "families",
    code: `import csv, io

buf = io.StringIO()
writer = csv.writer(buf)
writer.writerow(["name", "score", "note"])
writer.writerow(["Alice", 95, "first place"])
writer.writerow(["Bob, Jr.", 82, 'said "great"'])  # handles special chars

buf.seek(0)
print(buf.read())
# name,score,note
# Alice,95,first place
# "Bob, Jr.",82,"said ""great"""`,
    explanation: "`csv.writer` automatically quotes fields containing commas or double-quotes and escapes embedded quotes — never build CSV by hand-joining strings.",
  },
  {
    id: "py-b18-b2-unittest-mock-return",
    language: "python",
    title: "MagicMock return_value and side_effect",
    tag: "families",
    code: `from unittest.mock import MagicMock

# Configure fixed return value:
m = MagicMock(return_value=42)
print(m())    # 42
print(m())    # 42

# Configure side_effect to raise or return a sequence:
m.side_effect = [1, 2, ValueError("boom")]
print(m())   # 1
print(m())   # 2
try:
    m()       # raises ValueError
except ValueError as e:
    print(e)  # boom`,
    explanation: "`return_value` fixes every call's return; `side_effect` allows per-call responses from a sequence or raises an exception — essential for testing retry logic or multi-call sequences.",
  },
  {
    id: "py-b18-b2-abc-register",
    language: "python",
    title: "ABC.register for virtual subclasses",
    tag: "classes",
    code: `from abc import ABC, abstractmethod

class Drawable(ABC):
    @abstractmethod
    def draw(self): ...

# Register an existing class as a virtual subclass:
class LegacyCircle:
    def draw(self): print("legacy circle")

Drawable.register(LegacyCircle)

c = LegacyCircle()
print(isinstance(c, Drawable))   # True
print(issubclass(LegacyCircle, Drawable))  # True
# c.draw() still works — no change to LegacyCircle`,
    explanation: "`ABC.register(cls)` declares `cls` as a virtual subclass — `isinstance` and `issubclass` will return `True` without `cls` inheriting from the ABC. Useful for integrating third-party types.",
  },
  {
    id: "py-b18-b2-dunder-iter-next",
    language: "python",
    title: "__iter__ and __next__ for custom iterators",
    tag: "classes",
    code: `class Countdown:
    def __init__(self, start):
        self.n = start

    def __iter__(self):
        return self   # iterator is its own iterable

    def __next__(self):
        if self.n < 0:
            raise StopIteration
        val = self.n
        self.n -= 1
        return val

for i in Countdown(3):
    print(i)   # 3  2  1  0`,
    explanation: "An iterator implements both `__iter__` (returns self) and `__next__` (returns next value or raises `StopIteration`); a generator function produces this protocol automatically.",
  },
  {
    id: "py-b18-b2-dunder-add-radd",
    language: "python",
    title: "__add__ and __radd__ for symmetric arithmetic",
    tag: "classes",
    code: `class Vector:
    def __init__(self, x, y): self.x, self.y = x, y
    def __add__(self, other):
        if isinstance(other, Vector):
            return Vector(self.x + other.x, self.y + other.y)
        return NotImplemented
    def __radd__(self, other):
        # Called when other doesn't know how to add a Vector
        return self.__add__(other)
    def __repr__(self): return f"Vec({self.x},{self.y})"

v1 = Vector(1, 2)
v2 = Vector(3, 4)
print(v1 + v2)   # Vec(4,6)
# 0 + v1 would call int.__add__(v1) first, get NotImplemented,
# then call v1.__radd__(0)`,
    explanation: "Returning `NotImplemented` (not `None`) from `__add__` tells Python to try the other operand's `__radd__` — this implements symmetric binary operators for custom types.",
  },
  {
    id: "py-b18-b2-dunder-sizeof",
    language: "python",
    title: "__sizeof__ and sys.getsizeof for memory introspection",
    tag: "classes",
    code: `import sys

class Dense:
    def __init__(self, n):
        self.data = [0] * n

class Slotted:
    __slots__ = ("data",)
    def __init__(self, n):
        self.data = [0] * n

d = Dense(100)
s = Slotted(100)
print(sys.getsizeof(d))  # larger (has __dict__)
print(sys.getsizeof(s))  # smaller (no __dict__)

# sys.getsizeof calls __sizeof__ and adds the GC overhead`,
    explanation: "`sys.getsizeof(obj)` returns the shallow size (not including referenced objects); define `__sizeof__` to customise what's reported for your type.",
  },
  {
    id: "py-b18-b2-descriptor-data-non-data",
    language: "python",
    title: "Data vs non-data descriptors — priority over instance dict",
    tag: "classes",
    code: `class DataDescriptor:
    def __get__(self, obj, objtype=None): return "data descriptor"
    def __set__(self, obj, val): pass   # has __set__ = data descriptor

class NonDataDescriptor:
    def __get__(self, obj, objtype=None): return "non-data descriptor"
    # no __set__

class A:
    x = DataDescriptor()
    y = NonDataDescriptor()

a = A()
a.__dict__["x"] = "instance x"   # shadowed by data descriptor
a.__dict__["y"] = "instance y"   # shadows non-data descriptor

print(a.x)   # data descriptor  (descriptor wins)
print(a.y)   # instance y       (instance dict wins)`,
    explanation: "Data descriptors (defining `__set__` or `__delete__`) take priority over instance `__dict__`; non-data descriptors (only `__get__`) can be overridden by instance attributes.",
  },
  {
    id: "py-b18-b2-generic-class",
    language: "python",
    title: "Generic class with TypeVar for type-safe containers",
    tag: "types",
    code: `from typing import Generic, TypeVar

T = TypeVar("T")

class Stack(Generic[T]):
    def __init__(self): self._items: list[T] = []

    def push(self, item: T) -> None:
        self._items.append(item)

    def pop(self) -> T:
        return self._items.pop()

    def peek(self) -> T:
        return self._items[-1]

s: Stack[int] = Stack()
s.push(1)
s.push(2)
print(s.pop())   # 2  — type checker knows it's int`,
    explanation: "Inheriting from `Generic[T]` makes a class parameterisable; instances annotated as `Stack[int]` give the type checker full information about `push/pop` argument and return types.",
  },
  {
    id: "py-b18-b2-typing-overload-return",
    language: "python",
    title: "typing.overload with differing return types",
    tag: "types",
    code: `from typing import overload, Union

@overload
def parse(s: str,  default: None = None) -> int | None: ...
@overload
def parse(s: str,  default: int)         -> int: ...

def parse(s: str, default: int | None = None) -> int | None:
    try:
        return int(s)
    except ValueError:
        return default

result1 = parse("42")       # type: int | None
result2 = parse("bad", 0)   # type: int (never None)`,
    explanation: "`@overload` allows different type signatures for the same function name; the type checker picks the matching overload based on argument types to infer the precise return type.",
  },
  {
    id: "py-b18-b2-typevar-covariant",
    language: "python",
    title: "Covariant TypeVar for read-only generics",
    tag: "types",
    code: `from typing import TypeVar, Generic

T_co = TypeVar("T_co", covariant=True)

class ReadOnly(Generic[T_co]):
    def __init__(self, value: T_co): self._v = value
    def get(self) -> T_co: return self._v

class Animal: pass
class Dog(Animal): pass

ro_dog: ReadOnly[Dog] = ReadOnly(Dog())
ro_animal: ReadOnly[Animal] = ro_dog  # covariance — Dog ⊆ Animal

print(ro_animal.get())   # <__main__.Dog object>`,
    explanation: "A covariant type parameter (`covariant=True`) allows `Generic[Dog]` to be assigned to `Generic[Animal]` — safe only for read-only containers that never accept new values of type `T`.",
  },
  {
    id: "py-b18-b2-typing-noreturn",
    language: "python",
    title: "typing.NoReturn for functions that never return",
    tag: "types",
    code: `from typing import NoReturn
import sys

def abort(msg: str) -> NoReturn:
    print(f"FATAL: {msg}", file=sys.stderr)
    sys.exit(1)

def process(val: int | None) -> str:
    if val is None:
        abort("value required")   # checker knows this path doesn't return
    return str(val * 2)           # val is narrowed to int here`,
    explanation: "`NoReturn` indicates a function always raises or calls `sys.exit`; the type checker narrows subsequent code to know the function's code path is unreachable after the call.",
  },
  {
    id: "py-b18-b2-typing-unpack",
    language: "python",
    title: "typing.Unpack for TypedDict keyword arguments",
    tag: "types",
    code: `from typing import TypedDict, Unpack

class Options(TypedDict):
    width:  int
    height: int
    title:  str

def create_window(**kwargs: Unpack[Options]) -> str:
    return f"{kwargs['title']}: {kwargs['width']}x{kwargs['height']}"

print(create_window(title="App", width=800, height=600))
# App: 800x600`,
    explanation: "`Unpack[TD]` (Python 3.12+) allows a `TypedDict` to annotate `**kwargs`, giving the type checker full knowledge of which keyword arguments are expected and their types.",
  },
  {
    id: "py-b18-b2-int-bit-length",
    language: "python",
    title: "int.bit_length and bit_count for binary representation",
    tag: "types",
    code: `n = 255
print(n.bit_length())   # 8  — bits needed to represent 255 (11111111)
print(bin(n))           # 0b11111111

m = 1024
print(m.bit_length())   # 11  — 2^10 needs 11 bits

# Python 3.10+: count set bits
print((0b10110101).bit_count())   # 5  — popcount`,
    explanation: "`int.bit_length()` returns the number of bits required to represent the integer (excluding the sign); `bit_count()` (3.10+) counts the number of set bits (population count / Hamming weight).",
  },
  {
    id: "py-b18-b2-number-types-precision",
    language: "python",
    title: "int, float, Decimal — precision hierarchy",
    tag: "types",
    code: `from decimal import Decimal, getcontext

getcontext().prec = 50

a = 1 / 3                     # float: ~0.3333... (limited precision)
b = Decimal(1) / Decimal(3)   # Decimal: 50-digit precision

print(f"{a:.20f}")   # 0.33333333333333331483
print(f"{b}")        # 0.33333333333333333333333333333333333333333333333333

# int: arbitrary precision (never loses bits)
print(2**1000)   # 10715086071862673...  (entire 302-digit result)`,
    explanation: "`float` uses 64-bit IEEE 754 (~15 significant digits); `Decimal` uses arbitrary fixed precision; `int` is exact and unbounded — choose based on whether precision or exact integer arithmetic matters.",
  },
  {
    id: "py-b18-b2-protocols-intersection",
    language: "python",
    title: "Composing Protocols for intersection types",
    tag: "types",
    code: `from typing import Protocol

class HasName(Protocol):
    name: str

class HasLength(Protocol):
    def __len__(self) -> int: ...

class HasBoth(HasName, HasLength, Protocol): ...

def describe(obj: HasBoth) -> str:
    return f"{obj.name} has {len(obj)} items"

class Tagged:
    def __init__(self, name, items):
        self.name = name
        self._items = items
    def __len__(self): return len(self._items)

print(describe(Tagged("tags", [1,2,3])))   # tags has 3 items`,
    explanation: "A Protocol that inherits from multiple Protocols creates a structural intersection — the object must implement all required attributes and methods from every parent.",
  },
  {
    id: "py-b18-b2-typing-self-forward",
    language: "python",
    title: "Using 'Self' for methods that return the same subclass",
    tag: "types",
    code: `from typing import Self

class Node:
    def __init__(self, val):
        self.val = val
        self.children: list[Self] = []

    def add(self, child: Self) -> Self:
        self.children.append(child)
        return self

class TreeNode(Node):
    pass

# Type checker knows TreeNode.add() returns TreeNode, not Node:
root = TreeNode(1)
child = TreeNode(2)
root.add(child).add(TreeNode(3))`,
    explanation: "`Self` (Python 3.11+) binds to the actual runtime class, so `TreeNode.add()` is typed as returning `TreeNode`, not the base `Node` — critical for fluent APIs on subclasses.",
  },
  {
    id: "py-b18-b2-enumerate-multi",
    language: "python",
    title: "Parallel iteration with zip and multiple sequences",
    tag: "snippet",
    code: `names   = ["Alice", "Bob", "Carol"]
scores  = [95, 82, 78]
grades  = ["A", "B+", "B"]

for name, score, grade in zip(names, scores, grades):
    print(f"{name}: {score} ({grade})")
# Alice: 95 (A)
# Bob: 82 (B+)
# Carol: 78 (B)`,
    explanation: "`zip` accepts any number of iterables and stops at the shortest; it avoids index-based access like `names[i]`, keeping the loop body focused on values rather than indices.",
  },
  {
    id: "py-b18-b2-collections-counter-elements",
    language: "python",
    title: "Counter.elements for expanding counts back to items",
    tag: "snippet",
    code: `from collections import Counter

c = Counter({"a": 3, "b": 1, "c": 2})
print(sorted(c.elements()))   # ['a', 'a', 'a', 'b', 'c', 'c']

# Useful for comparing multi-sets:
def is_anagram(s1, s2):
    return Counter(s1) == Counter(s2)

print(is_anagram("listen", "silent"))   # True
print(is_anagram("hello",  "world"))    # False`,
    explanation: "`Counter.elements()` returns an iterator yielding each element repeated by its count — effectively expanding a compressed representation back to a sequence.",
  },
  {
    id: "py-b18-b2-format-spec-numbers",
    language: "python",
    title: "f-string format specs for numeric output",
    tag: "snippet",
    code: `n = 1_234_567.89

print(f"{n:,.2f}")    # 1,234,567.89  — thousands separator
print(f"{n:>15.2f}")  # right-aligned in 15-char field
print(f"{n:e}")       # 1.234568e+06  — scientific notation
print(f"{n:_}")       # 1_234_567.89  — underscores (Python 3.6+)

x = 255
print(f"{x:08b}")  # 11111111  — binary, zero-padded to 8 chars
print(f"{x:#x}")   # 0xff      — hex with prefix`,
    explanation: "Format specs after `:` in f-strings control alignment, padding, precision, and numeric base — the full mini-language is documented in Python's `Format Specification Mini-Language`.",
  },
  {
    id: "py-b18-b2-global-keyword",
    language: "python",
    title: "global keyword for module-level assignment inside functions",
    tag: "snippet",
    code: `count = 0

def increment():
    global count
    count += 1

increment()
increment()
print(count)   # 2

# Without 'global', count += 1 would create a local variable
# (and fail with UnboundLocalError if read before write)

# Prefer returning values or using class state instead of globals`,
    explanation: "`global name` inside a function declares that assignments to `name` should target the module scope — use sparingly; mutable module-level state is a code smell in most designs.",
  },
  {
    id: "py-b18-b2-string-translate",
    language: "python",
    title: "str.translate for multi-character substitution in O(n)",
    tag: "snippet",
    code: `# Build a table once, reuse for many strings:
table = str.maketrans({
    "a": "@",
    "e": "3",
    "i": "!",
    "o": "0",
    "u": "v",
})

text = "hello world"
print(text.translate(table))   # h3ll0 w0rld`,
    explanation: "`str.translate` applies a character-to-character mapping in a single O(n) pass over the string — much faster than chaining `.replace()` calls for many substitutions.",
  },
  {
    id: "py-b18-b2-contextmanager-yield-value",
    language: "python",
    title: "contextmanager can yield a value via 'as'",
    tag: "snippet",
    code: `from contextlib import contextmanager
import time

@contextmanager
def timed(label: str):
    t0 = time.perf_counter()
    try:
        yield t0   # value available as 'start' below
    finally:
        elapsed = time.perf_counter() - t0
        print(f"{label}: {elapsed:.4f}s")

with timed("sort") as start:
    sorted(range(10_000, 0, -1))
    print(f"started at {start:.4f}")`,
    explanation: "The value passed to `yield` in a `@contextmanager` function becomes the `as` target; wrapping it in `try/finally` ensures the cleanup code runs even if the body raises.",
  },
  {
    id: "py-b18-b2-unpickling-trust",
    language: "python",
    title: "Never unpickle data from untrusted sources",
    tag: "caveats",
    code: `import pickle, os

# An attacker can craft pickle data that executes arbitrary code:
# class Exploit:
#     def __reduce__(self):
#         return (os.system, ("rm -rf /",))
# malicious = pickle.dumps(Exploit())

# SAFE alternatives for external data:
# - json.loads (only basic types)
# - ast.literal_eval (only Python literals)
# - MessagePack, Protocol Buffers, etc.

# If you must accept pickles, verify a HMAC signature first.`,
    explanation: "`pickle.loads` calls arbitrary Python code during deserialization — it's fundamentally unsafe for untrusted input. Use JSON or schema-validated formats for external data.",
  },
  {
    id: "py-b18-b2-global-interpreter-lock",
    language: "python",
    title: "The GIL limits CPU-bound threading in CPython",
    tag: "caveats",
    code: `import threading, time

def count(n):
    while n > 0:
        n -= 1

start = time.perf_counter()
# Single thread:
count(10_000_000)
single = time.perf_counter() - start

start = time.perf_counter()
# Two threads — same CPU-bound work, often SLOWER due to GIL:
t1 = threading.Thread(target=count, args=(5_000_000,))
t2 = threading.Thread(target=count, args=(5_000_000,))
t1.start(); t2.start(); t1.join(); t2.join()
threaded = time.perf_counter() - start

print(f"single={single:.3f}s  threaded={threaded:.3f}s")`,
    explanation: "CPython's GIL allows only one thread to run Python bytecode at a time — multiple threads don't parallelize CPU-bound work. Use `multiprocessing` or `concurrent.futures.ProcessPoolExecutor` for true parallelism.",
  },
  {
    id: "py-b18-b2-comparison-chaining-pitfall",
    language: "python",
    title: "Chained comparisons work differently than you might expect",
    tag: "caveats",
    code: `# Python evaluates each pair:  1 < 2 < 3  means  1 < 2 and 2 < 3
print(1 < 2 < 3)    # True
print(1 < 3 > 2)    # True   (1<3 and 3>2)
print(1 == 1 == 1)  # True

# Gotcha with 'in':
print(1 in [1, 2] == True)   # False!
# Means: (1 in [1, 2]) and ([1, 2] == True)
# = True and False = False`,
    explanation: "Python's chained comparisons are mathematically natural, but combining `in` with `==` in a chain often produces surprising results — add parentheses to make the order explicit.",
  },
  {
    id: "py-b18-b2-asyncio-gather",
    language: "python",
    title: "asyncio.gather runs coroutines concurrently",
    tag: "snippet",
    code: `import asyncio

async def fetch(n):
    await asyncio.sleep(0.1 * n)
    return n * 10

async def main():
    # All three start concurrently — total time ≈ 0.3s not 0.6s
    results = await asyncio.gather(
        fetch(1),
        fetch(2),
        fetch(3),
    )
    print(results)   # [10, 20, 30]

asyncio.run(main())`,
    explanation: "`asyncio.gather(*coros)` runs all coroutines concurrently and returns a list of results in the same order as the arguments — exceptions in any task cause gather to cancel the others by default.",
  },
  {
    id: "py-b18-b2-classmethod-inheritance",
    language: "python",
    title: "@classmethod and subclass-aware factory methods",
    tag: "classes",
    code: `class Animal:
    def __init__(self, name): self.name = name

    @classmethod
    def create(cls, name: str) -> "Animal":
        return cls(name)   # cls is the actual (sub)class

class Dog(Animal):
    def speak(self): return "woof"

# cls in create() is Dog, not Animal:
fido = Dog.create("Fido")
print(type(fido))    # <class '__main__.Dog'>
print(fido.speak())  # woof`,
    explanation: "When a `@classmethod` is called on a subclass, `cls` receives the subclass, not the defining class — so factory methods using `cls(...)` correctly instantiate the subclass.",
  },
  {
    id: "py-b18-b2-dunder-hash-consistency",
    language: "python",
    title: "__hash__ must be consistent with __eq__",
    tag: "classes",
    code: `class Point:
    def __init__(self, x, y):
        self.x, self.y = x, y

    def __eq__(self, other):
        return isinstance(other, Point) and (self.x, self.y) == (other.x, other.y)

    def __hash__(self):
        # hash must be same for equal objects:
        return hash((self.x, self.y))

p1 = Point(1, 2)
p2 = Point(1, 2)
print(p1 == p2)   # True
print(hash(p1) == hash(p2))   # True

seen = {p1}
print(p2 in seen)  # True — correct dict/set lookup`,
    explanation: "Objects that compare equal must have the same hash; failing this invariant causes silent bugs in dicts and sets where equal objects fail to find each other.",
  },
  {
    id: "py-b18-b2-dunder-len-bool",
    language: "python",
    title: "__len__ implicitly defines boolean truth",
    tag: "classes",
    code: `class Queue:
    def __init__(self): self._items = []
    def enqueue(self, x): self._items.append(x)
    def dequeue(self): return self._items.pop(0)
    def __len__(self): return len(self._items)

q = Queue()
if not q:                   # len(q) == 0 → falsy
    print("queue is empty")

q.enqueue("task")
while q:                    # truthy while len > 0
    print(q.dequeue())`,
    explanation: "If `__bool__` is absent, Python calls `__len__`; an object is falsy when `len(obj) == 0`. This lets custom containers work naturally in boolean contexts.",
  },
  {
    id: "py-b18-b2-dunder-getitem-setitem",
    language: "python",
    title: "__getitem__ and __setitem__ for subscript support",
    tag: "classes",
    code: `class Matrix:
    def __init__(self, rows, cols):
        self._data = [[0] * cols for _ in range(rows)]

    def __getitem__(self, key):
        row, col = key
        return self._data[row][col]

    def __setitem__(self, key, value):
        row, col = key
        self._data[row][col] = value

m = Matrix(3, 3)
m[1, 1] = 42
print(m[1, 1])   # 42`,
    explanation: "`__getitem__(key)` and `__setitem__(key, value)` implement the `[]` operator; the key can be a tuple (for multi-dimensional indexing), a slice, or any hashable object.",
  },
  {
    id: "py-b18-b2-abstract-class-interface-distinction",
    language: "python",
    title: "Abstract base class with concrete helper methods",
    tag: "classes",
    code: `from abc import ABC, abstractmethod

class DataProcessor(ABC):
    @abstractmethod
    def fetch(self) -> list: ...

    @abstractmethod
    def process(self, items: list) -> list: ...

    # Concrete method uses abstract ones:
    def run(self) -> list:
        raw = self.fetch()
        return self.process(raw)

class CsvProcessor(DataProcessor):
    def fetch(self):   return ["a,1", "b,2"]
    def process(self, items):
        return [tuple(row.split(",")) for row in items]

print(CsvProcessor().run())   # [('a', '1'), ('b', '2')]`,
    explanation: "Abstract base classes can mix abstract and concrete methods; the concrete methods form the fixed 'template' while abstract methods delegate the variable logic to subclasses.",
  },
  {
    id: "py-b18-b2-typing-concatenate",
    language: "python",
    title: "Concatenate combines ParamSpec with positional args",
    tag: "types",
    code: `from typing import Callable, Concatenate, TypeVar
from functools import wraps

P = __import__("typing").ParamSpec("P")
R = TypeVar("R")

def inject_logger(fn: Callable[Concatenate[str, P], R]) -> Callable[P, R]:
    @wraps(fn)
    def wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
        return fn("LOG", *args, **kwargs)
    return wrapper

@inject_logger
def greet(logger: str, name: str) -> str:
    return f"[{logger}] Hello {name}"

# Caller doesn't pass the logger argument:
print(greet("Alice"))   # [LOG] Hello Alice`,
    explanation: "`Concatenate[T, P]` prepends a concrete parameter type `T` to a `ParamSpec` `P`, allowing decorators to inject or remove parameters while preserving the rest of the signature.",
  },
  {
    id: "py-b18-b2-exception-base-notes",
    language: "python",
    title: "exception.add_note() attaches context (Python 3.11)",
    tag: "understanding",
    code: `def validate(value, field):
    if value < 0:
        err = ValueError(f"must be non-negative, got {value}")
        err.add_note(f"field: {field}")
        err.add_note("Check the input source.")
        raise err

try:
    validate(-5, "price")
except ValueError as e:
    print(e)
    print(e.__notes__)
# must be non-negative, got -5
# ['field: price', 'Check the input source.']`,
    explanation: "`Exception.add_note(msg)` (Python 3.11+) appends context messages to an exception without changing the message — accessible via `e.__notes__` and shown in the traceback.",
  },
  {
    id: "py-b18-b2-async-context-manager",
    language: "python",
    title: "async with for async context managers",
    tag: "understanding",
    code: `import asyncio

class AsyncDB:
    async def __aenter__(self):
        await asyncio.sleep(0)   # simulate async connect
        print("connected")
        return self

    async def __aexit__(self, *args):
        await asyncio.sleep(0)   # simulate async close
        print("disconnected")

    async def query(self, sql):
        return f"result of: {sql}"

async def main():
    async with AsyncDB() as db:
        result = await db.query("SELECT 1")
        print(result)

asyncio.run(main())`,
    explanation: "`async with` calls `__aenter__` and `__aexit__` as coroutines — necessary for resources like database connections or HTTP sessions that require async I/O to open and close.",
  },
  {
    id: "py-b18-b2-async-for",
    language: "python",
    title: "async for iterates over async iterables",
    tag: "understanding",
    code: `import asyncio

class AsyncRange:
    def __init__(self, n): self.n = n

    def __aiter__(self): self.i = 0; return self

    async def __anext__(self):
        if self.i >= self.n: raise StopAsyncIteration
        await asyncio.sleep(0)   # yield to event loop
        val = self.i; self.i += 1
        return val

async def main():
    async for n in AsyncRange(5):
        print(n)   # 0 1 2 3 4

asyncio.run(main())`,
    explanation: "`async for` uses `__aiter__` and `__anext__` coroutines — designed for async generators and I/O-backed streams where each item requires an await (e.g., database cursors, server-sent events).",
  },
  {
    id: "py-b18-b2-dataclass-ordering",
    language: "python",
    title: "dataclass(order=True) generates comparison operators",
    tag: "structures",
    code: `from dataclasses import dataclass

@dataclass(order=True)
class Version:
    major: int
    minor: int
    patch: int

v1 = Version(1, 2, 3)
v2 = Version(1, 3, 0)
v3 = Version(1, 2, 3)

print(v1 < v2)    # True  (1.2.3 < 1.3.0)
print(v1 == v3)   # True
print(sorted([v2, v1, v3]))
# [Version(1,2,3), Version(1,2,3), Version(1,3,0)]`,
    explanation: "`@dataclass(order=True)` auto-generates `__lt__`, `__le__`, `__gt__`, `__ge__` based on fields in declaration order — enabling sorting and comparison operators without manual code.",
  },
  {
    id: "py-b18-b2-lrucache-method",
    language: "python",
    title: "lru_cache on methods requires care — self is a key",
    tag: "caveats",
    code: `from functools import lru_cache

class Fetcher:
    def __init__(self, host): self.host = host

    @lru_cache(maxsize=128)
    def get(self, path):
        # self is part of the cache key — prevents sharing across instances
        return f"GET {self.host}{path}"

f1 = Fetcher("http://a.com")
f2 = Fetcher("http://b.com")
# These don't share cache entries because self (host) differs:
print(f1.get("/api"))   # GET http://a.com/api
print(f2.get("/api"))   # GET http://b.com/api`,
    explanation: "`@lru_cache` on a method includes `self` as a cache key — the instance must be hashable (default for Python objects) and the cache is kept alive as long as the instance is.",
  },
  {
    id: "py-b18-b2-list-extend-vs-append",
    language: "python",
    title: "list.extend vs list.append for adding multiple items",
    tag: "snippet",
    code: `a = [1, 2, 3]

# append adds the argument as a single element:
a.append([4, 5])
print(a)   # [1, 2, 3, [4, 5]]  — nested list

a = [1, 2, 3]

# extend iterates the argument and adds each element:
a.extend([4, 5])
print(a)   # [1, 2, 3, 4, 5]   — flat

# += on lists calls extend:
a += [6, 7]
print(a)   # [1, 2, 3, 4, 5, 6, 7]`,
    explanation: "`append(x)` adds `x` as a single element (may create a nested list); `extend(iterable)` adds each element of the iterable individually — equivalent to `+= iterable`.",
  },
  {
    id: "py-b18-b2-sorted-cmp-to-key",
    language: "python",
    title: "functools.cmp_to_key converts old-style comparators",
    tag: "snippet",
    code: `from functools import cmp_to_key

def compare_lengths(a, b):
    return len(a) - len(b)   # negative=a first, 0=equal, positive=b first

words = ["banana", "kiwi", "apple", "fig"]
print(sorted(words, key=cmp_to_key(compare_lengths)))
# ['fig', 'kiwi', 'apple', 'banana']

# More pythonic: key=len
print(sorted(words, key=len))`,
    explanation: "`cmp_to_key` wraps a C-style `cmp(a, b)` comparator (returning -1/0/1) into a key function — useful when migrating old Python 2 code or working with custom orderings that are hard to express as a key.",
  },
  {
    id: "py-b18-b2-json-encoder-decoder",
    language: "python",
    title: "Custom JSON encoder and decoder hooks",
    tag: "families",
    code: `import json
from datetime import date

class DateEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, date):
            return obj.isoformat()
        return super().default(obj)

data = {"name": "Alice", "dob": date(1990, 5, 15)}
j = json.dumps(data, cls=DateEncoder)
print(j)   # {"name": "Alice", "dob": "1990-05-15"}

# Decoding hook:
def as_date(d):
    if "dob" in d:
        d["dob"] = date.fromisoformat(d["dob"])
    return d

loaded = json.loads(j, object_hook=as_date)
print(type(loaded["dob"]))   # datetime.date`,
    explanation: "Subclassing `JSONEncoder` and overriding `default` encodes custom types; `object_hook` in `json.loads` is called on every decoded object dict, enabling custom type reconstruction.",
  },
  {
    id: "py-b18-b2-pprint-sorted",
    language: "python",
    title: "pprint.pformat and sorted keys",
    tag: "snippet",
    code: `import pprint

data = {
    "z": [3, 1, 2],
    "a": {"nested": True},
    "m": list(range(5)),
}

# sort_dicts=True (default) prints keys alphabetically:
print(pprint.pformat(data, sort_dicts=True))
# {'a': {'nested': True}, 'm': [0, 1, 2, 3, 4], 'z': [3, 1, 2]}

# sort_dicts=False preserves insertion order (Python 3.8+):
print(pprint.pformat(data, sort_dicts=False))`,
    explanation: "`pprint.pformat` returns the formatted string (unlike `pprint.pprint` which prints it); `sort_dicts=False` (Python 3.8+) preserves dict insertion order for reproducible output.",
  },
  {
    id: "py-b18-b2-pathlib-mkdir",
    language: "python",
    title: "pathlib.Path.mkdir with parents and exist_ok",
    tag: "snippet",
    code: `from pathlib import Path

p = Path("/tmp/a/b/c")

# exists_ok=True: no error if already exists
# parents=True: create all intermediate directories
p.mkdir(parents=True, exist_ok=True)
print(p.exists())   # True

# Clean up
import shutil
shutil.rmtree("/tmp/a")`,
    explanation: "`Path.mkdir(parents=True, exist_ok=True)` creates the full directory path atomically without raising if it already exists — the portable replacement for `os.makedirs`.",
  },
  {
    id: "py-b18-b2-typing-typedalias",
    language: "python",
    title: "TypeAlias for explicit type alias declarations",
    tag: "types",
    code: `from typing import TypeAlias

# Without TypeAlias — might be misread as a variable assignment:
Vector = list[float]

# With TypeAlias — intent is clear to both humans and type checkers:
Vector2: TypeAlias = list[float]

def scale(v: Vector2, factor: float) -> Vector2:
    return [x * factor for x in v]

print(scale([1.0, 2.0, 3.0], 2.0))   # [2.0, 4.0, 6.0]`,
    explanation: "`TypeAlias` (Python 3.10+) marks a declaration as a type alias rather than a regular variable assignment — tooling shows the alias correctly in hover docs and error messages.",
  },
  {
    id: "py-b18-b2-dataclass-init-false",
    language: "python",
    title: "dataclass field with init=False for computed fields",
    tag: "classes",
    code: `from dataclasses import dataclass, field

@dataclass
class Circle:
    radius: float
    area: float = field(init=False, repr=True)

    def __post_init__(self):
        self.area = 3.14159 * self.radius ** 2

c = Circle(5.0)
print(c)       # Circle(radius=5.0, area=78.53975)
print(c.area)  # 78.53975

# Circle(radius=5.0) — area not in __init__, computed in post_init`,
    explanation: "`field(init=False)` excludes the field from `__init__`; use `__post_init__` to compute derived values after the primary fields are set.",
  },
  {
    id: "py-b18-b2-asyncio-taskgroup",
    language: "python",
    title: "asyncio.TaskGroup for structured concurrency (Python 3.11)",
    tag: "snippet",
    code: `import asyncio

async def fetch(name, delay):
    await asyncio.sleep(delay)
    return f"{name} done"

async def main():
    async with asyncio.TaskGroup() as tg:
        t1 = tg.create_task(fetch("A", 0.1))
        t2 = tg.create_task(fetch("B", 0.2))
    # Both tasks complete before here
    print(t1.result())   # A done
    print(t2.result())   # B done

asyncio.run(main())`,
    explanation: "`asyncio.TaskGroup` (Python 3.11+) creates tasks and waits for all to finish, cancelling remaining tasks if any raises — structured concurrency without manual `gather` exception handling.",
  },
  {
    id: "py-b18-b2-string-format-vs-fstring",
    language: "python",
    title: "str.format vs f-strings — when each makes sense",
    tag: "families",
    code: `name = "World"
n = 42

# f-string: best for immediate, readable formatting
msg = f"Hello, {name}! Answer is {n}."

# str.format: best for templates stored as data
template = "Hello, {name}! Answer is {n}."
msg2 = template.format(name=name, n=n)
print(msg2)

# %-formatting: legacy, avoid in new code
msg3 = "Hello, %s! Answer is %d." % (name, n)`,
    explanation: "Prefer f-strings for inline formatting (readable, fast); use `str.format` when the template is stored in a variable or config file (can't use f-strings for data-driven templates).",
  },
  {
    id: "py-b18-b2-os-environ",
    language: "python",
    title: "os.environ for reading and writing environment variables",
    tag: "snippet",
    code: `import os

# Read (raises KeyError if absent):
# debug = os.environ["DEBUG"]

# Read with default:
debug = os.environ.get("DEBUG", "false")
print(debug)   # false (or value if set)

# Set for current process (not exported to parent shell):
os.environ["MY_VAR"] = "hello"
print(os.environ.get("MY_VAR"))   # hello

# Immutable view of all vars:
all_vars = dict(os.environ)`,
    explanation: "`os.environ` is a live mapping of environment variables; `get(key, default)` is safer than direct indexing; setting a value only affects the current process and its children.",
  },
];
