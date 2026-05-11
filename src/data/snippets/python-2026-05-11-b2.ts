import type { Snippet } from "./types";

export const pythonSnippets20260511B2: Snippet[] = [
  // ── tag: snippet ────────────────────────────────────────────────────────────
  {
    id: "py-dict-get-default",
    language: "python",
    title: "dict.get() with a default value",
    tag: "snippet",
    code: `d = {"a": 1, "b": 2}
print(d.get("a"))        # 1
print(d.get("x"))        # None  — key missing, no KeyError
print(d.get("x", 99))   # 99   — explicit fallback`,
    explanation:
      "dict.get(key, default) is safer than d[key] when the key might be absent; it returns the default (None if omitted) instead of raising KeyError.",
  },
  {
    id: "py-dict-setdefault",
    language: "python",
    title: "dict.setdefault() inserts only if missing",
    tag: "snippet",
    code: `d = {"a": 1}
d.setdefault("a", 99)   # key exists — value stays 1
d.setdefault("b", 99)   # key missing — inserts b: 99
print(d)                 # {"a": 1, "b": 99}

# Classic use: grouping
groups = {}
for item in ["cat", "car", "bar"]:
    groups.setdefault(item[0], []).append(item)
print(groups)  # {"c": ["cat", "car"], "b": ["bar"]}`,
    explanation:
      "setdefault(key, val) returns the existing value if the key is present, or inserts val and returns it if absent — handy for building lists/dicts of groups without a separate if-key-not-in check.",
  },
  {
    id: "py-dict-fromkeys",
    language: "python",
    title: "dict.fromkeys() creates a dict from an iterable",
    tag: "snippet",
    code: `keys = ["x", "y", "z"]
d = dict.fromkeys(keys, 0)
print(d)   # {"x": 0, "y": 0, "z": 0}

# Default value is None when omitted
d2 = dict.fromkeys(keys)
print(d2)  # {"x": None, "y": None, "z": None}

# Gotcha: all values share the SAME object — fine for immutables,
# dangerous for mutables like lists (use a comprehension instead)
d3 = {k: [] for k in keys}   # safe — each key gets its own list`,
    explanation:
      "dict.fromkeys(iterable, value) is a concise class-method constructor; note that the default value is shared across all keys, so use a dict comprehension when the value is mutable.",
  },
  {
    id: "py-list-extend-iadd",
    language: "python",
    title: "list.extend() vs += with non-lists",
    tag: "snippet",
    code: `a = [1, 2, 3]
a.extend((4, 5))   # accepts any iterable — tuple here
print(a)           # [1, 2, 3, 4, 5]

b = [1, 2, 3]
b += (4, 5)        # += also accepts any iterable for lists
print(b)           # [1, 2, 3, 4, 5]

# Contrast with + which requires a list on the right
# c = [1, 2] + (3, 4)  # TypeError

# += on a list mutates in place (same id); + creates a new list
c = [1, 2]
original_id = id(c)
c += [3, 4]
print(id(c) == original_id)  # True — same object`,
    explanation:
      "list += and list.extend() both accept any iterable and mutate the list in place, unlike the + operator which requires a list operand and allocates a new object.",
  },
  {
    id: "py-list-sort-key-lambda",
    language: "python",
    title: "list.sort() with a key lambda",
    tag: "snippet",
    code: `words = ["banana", "fig", "apple", "date"]
words.sort(key=lambda w: len(w))
print(words)   # ["fig", "date", "apple", "banana"]

# Sort descending by length, then alphabetically on ties
words.sort(key=lambda w: (len(w), w))
print(words)   # ["fig", "date", "apple", "banana"]

# Reverse order
words.sort(key=lambda w: len(w), reverse=True)
print(words)   # ["banana", "apple", "date", "fig"]`,
    explanation:
      "list.sort() sorts in place using a key function called once per element; returning a tuple from the key function provides multi-level sort criteria with no extra library.",
  },
  {
    id: "py-sorted-key",
    language: "python",
    title: "sorted() returns a new list and works on any iterable",
    tag: "snippet",
    code: `nums = (3, 1, 4, 1, 5, 9)        # tuple
result = sorted(nums)             # [1, 1, 3, 4, 5, 9]  — always a list
print(type(result))               # <class 'list'>

# Works on strings (sorts characters)
print(sorted("hello"))            # ['e', 'h', 'l', 'l', 'o']

# Works on dicts (iterates keys)
d = {"b": 2, "a": 1}
print(sorted(d))                  # ['a', 'b']

# key= and reverse= work the same as list.sort()
pairs = [(1, "z"), (2, "a"), (1, "a")]
print(sorted(pairs, key=lambda p: (p[0], p[1])))  # [(1,'a'),(1,'z'),(2,'a')]`,
    explanation:
      "sorted() is a built-in that accepts any iterable and always returns a new list, making it safe to use on immutable sequences or when you want to preserve the original order.",
  },
  {
    id: "py-min-max-key",
    language: "python",
    title: "min() and max() with a key function",
    tag: "snippet",
    code: `words = ["banana", "fig", "apple"]
print(min(words, key=len))   # "fig"   — shortest
print(max(words, key=len))   # "banana" — longest

# Works on any iterable of objects
people = [{"name": "Alice", "age": 30}, {"name": "Bob", "age": 25}]
youngest = min(people, key=lambda p: p["age"])
print(youngest["name"])  # "Bob"

# default= avoids ValueError on empty iterables
print(min([], default=None))   # None`,
    explanation:
      "min() and max() accept a key= function just like sort, so you can find the extreme element by any computed value without sorting the whole collection first.",
  },
  {
    id: "py-enumerate-start",
    language: "python",
    title: "enumerate() with a custom start index",
    tag: "snippet",
    code: `items = ["a", "b", "c"]

# Default start=0
for i, v in enumerate(items):
    print(i, v)   # 0 a / 1 b / 2 c

# Custom start=1 — useful for 1-based output
for i, v in enumerate(items, start=1):
    print(i, v)   # 1 a / 2 b / 3 c

# Also works with any start offset
for i, v in enumerate(items, start=10):
    print(i, v)   # 10 a / 11 b / 12 c`,
    explanation:
      "enumerate(iterable, start=N) lets you choose the first index value, which is handy when generating human-readable 1-based numbering or continuing a count across loops.",
  },
  {
    id: "py-zip-dict-from-lists",
    language: "python",
    title: "Build a dict from two lists with zip()",
    tag: "snippet",
    code: `keys = ["a", "b", "c"]
vals = [1, 2, 3]

d = dict(zip(keys, vals))
print(d)   # {"a": 1, "b": 2, "c": 3}

# zip stops at the shorter iterable
d2 = dict(zip(keys, [10, 20]))
print(d2)  # {"a": 10, "b": 20}   — "c" dropped

# Use zip_longest from itertools to keep all keys
from itertools import zip_longest
d3 = dict(zip_longest(keys, [10, 20], fillvalue=0))
print(d3)  # {"a": 10, "b": 20, "c": 0}`,
    explanation:
      "dict(zip(keys, values)) is the idiomatic one-liner for pairing two lists into a mapping; zip_longest from itertools handles mismatched lengths by filling gaps with a chosen value.",
  },
  {
    id: "py-any-all-generator",
    language: "python",
    title: "any() and all() short-circuit with generator expressions",
    tag: "snippet",
    code: `nums = [2, 4, 6, 7, 8]

# any() returns True as soon as one element is truthy
print(any(n % 2 != 0 for n in nums))   # True  (7 is odd)

# all() returns False as soon as one element is falsy
print(all(n % 2 == 0 for n in nums))   # False (7 is odd)

# Short-circuit: items after the first match are never evaluated
def check(n):
    print(f"checking {n}")
    return n > 3

print(any(check(n) for n in [1, 2, 5, 6]))
# checking 1 / checking 2 / checking 5 → True  (stops at 5)`,
    explanation:
      "any() and all() stop iterating as soon as the result is determined, so pairing them with a generator expression (not a list comprehension) avoids creating the full intermediate list.",
  },
  {
    id: "py-filter-none",
    language: "python",
    title: "filter(None, iterable) removes falsy values",
    tag: "snippet",
    code: `data = [0, 1, "", "hello", None, False, True, [], [1]]
clean = list(filter(None, data))
print(clean)   # [1, "hello", True, [1]]

# Equivalent comprehension
clean2 = [x for x in data if x]
print(clean2)  # [1, "hello", True, [1]]

# filter with a function
evens = list(filter(lambda n: n % 2 == 0, range(10)))
print(evens)   # [0, 2, 4, 6, 8]`,
    explanation:
      "Passing None as the function to filter() is a shorthand for filtering out all falsy values (0, '', None, False, [], etc.) from an iterable, returning a lazy iterator.",
  },
  {
    id: "py-map-two-iters",
    language: "python",
    title: "map() with two iterables",
    tag: "snippet",
    code: `a = [1, 2, 3]
b = [10, 20, 30]

# map with two iterables passes paired elements to the function
result = list(map(lambda x, y: x + y, a, b))
print(result)   # [11, 22, 33]

# Built-in operators work too
import operator
print(list(map(operator.mul, a, b)))   # [10, 40, 90]

# Stops at the shortest iterable
print(list(map(lambda x, y: x + y, [1, 2], [10, 20, 30])))   # [11, 22]`,
    explanation:
      "map(func, iter1, iter2, ...) passes one element from each iterable as positional arguments to func per call, stopping when the shortest iterable is exhausted — a concise alternative to zip + comprehension.",
  },
  {
    id: "py-slice-object",
    language: "python",
    title: "slice() object for reusable slices",
    tag: "snippet",
    code: `data = list(range(10))   # [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

# Create a reusable slice object
every_other = slice(0, None, 2)
last_three  = slice(-3, None)

print(data[every_other])   # [0, 2, 4, 6, 8]
print(data[last_three])    # [7, 8, 9]

# Works on strings too
s = "Hello, World!"
print(s[last_three])       # "ld!"

# Inspect a slice object
print(every_other.start, every_other.stop, every_other.step)  # 0 None 2`,
    explanation:
      "slice(start, stop, step) creates a reusable slice descriptor that you can name, store, and apply to any sequence, keeping slicing logic in one place rather than scattered as magic numbers.",
  },
  {
    id: "py-reversed-custom",
    language: "python",
    title: "reversed() on a custom class with __reversed__",
    tag: "snippet",
    code: `class Countdown:
    def __init__(self, start):
        self.start = start
    def __iter__(self):
        return iter(range(self.start + 1))
    def __reversed__(self):          # called by reversed()
        return iter(range(self.start, -1, -1))

c = Countdown(4)
print(list(c))            # [0, 1, 2, 3, 4]
print(list(reversed(c)))  # [4, 3, 2, 1, 0]`,
    explanation:
      "Implementing __reversed__ lets reversed() use an efficient custom traversal instead of falling back to __len__ + __getitem__; useful when reversing via index is slower than direct reverse iteration.",
  },

  // ── tag: understanding ───────────────────────────────────────────────────────
  {
    id: "py-mro-c3",
    language: "python",
    title: "C3 linearization and __mro__",
    tag: "understanding",
    code: `class A: pass
class B(A): pass
class C(A): pass
class D(B, C): pass   # multiple inheritance

print(D.__mro__)
# (<class 'D'>, <class 'B'>, <class 'C'>, <class 'A'>, <class 'object'>)

# Method lookup follows this order left-to-right
class A:
    def greet(self): return "A"
class B(A):
    def greet(self): return "B"
class C(A):
    def greet(self): return "C"
class D(B, C): pass

print(D().greet())   # "B" — B comes first in MRO`,
    explanation:
      "Python uses C3 linearization to compute a consistent, predictable method resolution order (MRO) for multiple inheritance; inspecting ClassName.__mro__ shows the exact lookup chain.",
  },
  {
    id: "py-type-check-chain",
    language: "python",
    title: "type() is vs isinstance(): inheritance matters",
    tag: "understanding",
    code: `class Animal: pass
class Dog(Animal): pass

d = Dog()
print(type(d) is Dog)      # True  — exact type match
print(type(d) is Animal)   # False — Dog is not Animal

print(isinstance(d, Dog))    # True
print(isinstance(d, Animal)) # True  — Dog IS-A Animal

# isinstance also accepts a tuple of types
print(isinstance(d, (Dog, int)))   # True`,
    explanation:
      "type(x) is T requires an exact match and ignores inheritance, while isinstance(x, T) returns True for the object's class and any of its base classes — prefer isinstance for duck-typing friendly checks.",
  },
  {
    id: "py-exception-chaining",
    language: "python",
    title: "raise B from A sets __cause__; implicit chaining sets __context__",
    tag: "understanding",
    code: `# Explicit chaining: raise B from A
try:
    int("oops")
except ValueError as e:
    raise RuntimeError("conversion failed") from e
# RuntimeError.__cause__ = ValueError (shown in traceback)

# Implicit chaining: raise inside except block
try:
    1 / 0
except ZeroDivisionError:
    raise ValueError("bad value")
# ValueError.__context__ = ZeroDivisionError

# Suppress context with: raise B from None
try:
    int("x")
except ValueError:
    raise RuntimeError("bad") from None   # hides original`,
    explanation:
      "raise B from A records the original exception as B.__cause__ and signals intentional chaining; raising inside an except block without from sets B.__context__ implicitly; raise B from None hides the original entirely.",
  },
  {
    id: "py-traceback-chain",
    language: "python",
    title: "How Python prints chained exceptions",
    tag: "understanding",
    code: `import traceback, sys

def inner():
    raise ValueError("original")

def outer():
    try:
        inner()
    except ValueError as e:
        raise RuntimeError("wrapped") from e

try:
    outer()
except RuntimeError:
    traceback.print_exc()
# During handling of the above exception, another exception occurred:
# Then the RuntimeError traceback is shown.`,
    explanation:
      "When an exception is chained Python prints both tracebacks separated by a 'During handling…' or 'The above exception was the direct cause…' message, giving full context for debugging without losing the root cause.",
  },
  {
    id: "py-with-suppressed",
    language: "python",
    title: "contextlib.suppress() silently ignores exceptions",
    tag: "understanding",
    code: `from contextlib import suppress
import os

# Old way
try:
    os.remove("missing_file.txt")
except FileNotFoundError:
    pass

# Clean way with suppress
with suppress(FileNotFoundError):
    os.remove("missing_file.txt")   # no error if file is absent

# Multiple exception types
with suppress(FileNotFoundError, PermissionError):
    os.remove("/etc/hosts")`,
    explanation:
      "contextlib.suppress(*exceptions) is a context manager that silently swallows the listed exceptions — replacing a try/except/pass block with something more readable and intention-revealing.",
  },
  {
    id: "py-yield-from-trace",
    language: "python",
    title: "yield from delegates to a sub-generator",
    tag: "understanding",
    code: `def inner():
    yield 1
    yield 2
    return "done"   # StopIteration value

def outer():
    result = yield from inner()   # delegates all yields; captures return value
    print("inner returned:", result)   # "done"
    yield 3

print(list(outer()))   # [1, 2, 3]
# inner returned: done`,
    explanation:
      "yield from transparently forwards all values from the sub-generator to the caller and captures its return value (carried in StopIteration), making generator composition much cleaner than a manual for-loop.",
  },
  {
    id: "py-gen-send",
    language: "python",
    title: "generator .send() passes a value into yield",
    tag: "understanding",
    code: `def accumulator():
    total = 0
    while True:
        value = yield total   # yield sends total out; receives next value
        total += value

gen = accumulator()
next(gen)           # advance to first yield; returns 0
print(gen.send(10)) # sends 10 in; total=10; yields 10
print(gen.send(5))  # sends 5 in;  total=15; yields 15
print(gen.send(3))  # sends 3 in;  total=18; yields 18`,
    explanation:
      "gen.send(value) resumes the generator and makes value the result of the yield expression inside it, enabling two-way communication and turning the generator into a coroutine-style state machine.",
  },
  {
    id: "py-coroutine-throw",
    language: "python",
    title: "generator .throw() injects an exception at the yield point",
    tag: "understanding",
    code: `def guarded():
    try:
        value = yield "waiting"
        print("got:", value)
    except ValueError as e:
        yield f"caught: {e}"

gen = guarded()
print(next(gen))                        # "waiting"
print(gen.throw(ValueError, "oops!"))   # "caught: oops!"
# gen.throw raises the exception AT the yield expression inside the generator`,
    explanation:
      "gen.throw(ExcType, value) injects an exception at the point where the generator is suspended, allowing callers to signal error conditions into the generator without an external flag variable.",
  },
  {
    id: "py-async-await-trace",
    language: "python",
    title: "await suspends the coroutine until the awaitable completes",
    tag: "understanding",
    code: `import asyncio

async def fetch(name, delay):
    print(f"{name}: start")
    await asyncio.sleep(delay)   # suspends here; event loop runs other tasks
    print(f"{name}: done")
    return name

async def main():
    result = await fetch("task-A", 0.1)   # waits for task-A alone
    print("result:", result)

asyncio.run(main())
# task-A: start
# task-A: done
# result: task-A`,
    explanation:
      "await suspends the current coroutine and yields control back to the event loop until the awaitable resolves; for true concurrency you need asyncio.gather() or asyncio.create_task() — a lone await is sequential.",
  },
  {
    id: "py-future-gather",
    language: "python",
    title: "asyncio.gather() runs coroutines concurrently",
    tag: "understanding",
    code: `import asyncio, time

async def task(name, delay):
    await asyncio.sleep(delay)
    return name

async def main():
    start = time.monotonic()
    results = await asyncio.gather(
        task("A", 0.3),
        task("B", 0.1),
        task("C", 0.2),
    )
    elapsed = time.monotonic() - start
    print(results)   # ["A", "B", "C"]  — order matches input, not finish time
    print(f"{elapsed:.2f}s")   # ~0.30s — all ran concurrently

asyncio.run(main())`,
    explanation:
      "asyncio.gather() schedules all coroutines concurrently and returns their results in input order when all complete; elapsed time is the max of all delays, not their sum.",
  },
  {
    id: "py-event-loop-close",
    language: "python",
    title: "Always use asyncio.run() instead of managing the loop manually",
    tag: "understanding",
    code: `import asyncio

# WRONG — manual loop management is error-prone
loop = asyncio.get_event_loop()
loop.run_until_complete(some_coro())
loop.close()   # must remember to close; harder to do correctly

# CORRECT — asyncio.run() handles setup, teardown, and cleanup
async def main():
    await asyncio.sleep(0)
    print("done")

asyncio.run(main())   # creates loop, runs main, closes loop, cleans up tasks`,
    explanation:
      "asyncio.run() is the recommended entry point for async programs in Python 3.7+; it creates a fresh event loop, runs the coroutine to completion, cancels remaining tasks, and closes the loop — preventing resource leaks that manual loop management often misses.",
  },
  {
    id: "py-context-var-trace",
    language: "python",
    title: "ContextVar is isolated per asyncio task",
    tag: "understanding",
    code: `import asyncio
from contextvars import ContextVar

request_id: ContextVar[str] = ContextVar("request_id", default="none")

async def handle(rid):
    request_id.set(rid)
    await asyncio.sleep(0)          # yield to event loop
    print(request_id.get())         # still sees own value

async def main():
    await asyncio.gather(
        handle("req-1"),
        handle("req-2"),
    )
# req-1
# req-2   — each task sees its own context, not shared global state`,
    explanation:
      "Each asyncio task runs in its own copy of the current context, so ContextVar values set inside a task are invisible to other tasks — making it the right tool for request-scoped data like auth tokens or trace IDs.",
  },
  {
    id: "py-thread-local-trace",
    language: "python",
    title: "threading.local() stores per-thread data",
    tag: "understanding",
    code: `import threading

local = threading.local()

def worker(name):
    local.value = name          # each thread writes to its own slot
    import time; time.sleep(0.01)
    print(threading.current_thread().name, local.value)

threads = [threading.Thread(target=worker, args=(i,), name=f"T{i}")
           for i in range(3)]
for t in threads: t.start()
for t in threads: t.join()
# T0 0
# T1 1
# T2 2   — no cross-thread contamination`,
    explanation:
      "threading.local() looks like a regular object but stores a separate copy of each attribute for each thread, providing isolated storage without explicit locking — useful for per-connection DB handles or request contexts.",
  },
  {
    id: "py-class-creation-order",
    language: "python",
    title: "Class body executes top-to-bottom; __init_subclass__ fires after definition",
    tag: "understanding",
    code: `class Base:
    @classmethod
    def __init_subclass__(cls, **kw):
        super().__init_subclass__(**kw)
        print(f"Subclass created: {cls.__name__}")

print("before definition")

class Child(Base):
    x = 10          # class body runs top-to-bottom
    print("inside body")   # executes during class creation

print("after definition")
# before definition
# inside body
# Subclass created: Child
# after definition`,
    explanation:
      "The class body is executed as a code block when the class statement is reached, and __init_subclass__ on the base is called right after — making it a hook for registration or validation at class-creation time, not instance-creation time.",
  },

  // ── tag: structures ──────────────────────────────────────────────────────────
  {
    id: "py-sortedcontainers-list",
    language: "python",
    title: "SortedList: O(log n) add, O(1) index",
    tag: "structures",
    code: `from sortedcontainers import SortedList  # pip install sortedcontainers

sl = SortedList([5, 1, 3, 2, 4])
print(sl)        # SortedList([1, 2, 3, 4, 5])

sl.add(2.5)
print(sl)        # SortedList([1, 2, 2.5, 3, 4, 5])

sl.remove(3)
print(sl)        # SortedList([1, 2, 2.5, 4, 5])

print(sl[0])     # 1  — O(1) index
print(sl[-1])    # 5`,
    explanation:
      "SortedList from the sortedcontainers library maintains sorted order on every insertion with O(log n) cost while supporting O(1) indexing — a pure-Python structure that outperforms many C extensions in practice.",
  },
  {
    id: "py-trie-dict",
    language: "python",
    title: "Nested dict as a trie for prefix lookup",
    tag: "structures",
    code: `END = "$"

def insert(trie, word):
    node = trie
    for ch in word:
        node = node.setdefault(ch, {})
    node[END] = True

def search(trie, prefix):
    node = trie
    for ch in prefix:
        if ch not in node:
            return False
        node = node[ch]
    return True

trie = {}
insert(trie, "cat")
insert(trie, "car")
print(search(trie, "ca"))    # True
print(search(trie, "dog"))   # False`,
    explanation:
      "A nested dict trie stores each character as a key and uses a sentinel key to mark word endings; prefix lookup is O(k) where k is the prefix length, and the structure requires no external library.",
  },
  {
    id: "py-graph-adj-list",
    language: "python",
    title: "Adjacency-list graph with defaultdict",
    tag: "structures",
    code: `from collections import defaultdict

graph = defaultdict(list)   # undirected graph

def add_edge(u, v):
    graph[u].append(v)
    graph[v].append(u)

add_edge("A", "B")
add_edge("A", "C")
add_edge("B", "D")

# BFS
from collections import deque

def bfs(start):
    visited, queue = {start}, deque([start])
    while queue:
        node = queue.popleft()
        print(node, end=" ")
        for nb in graph[node]:
            if nb not in visited:
                visited.add(nb)
                queue.append(nb)

bfs("A")   # A B C D`,
    explanation:
      "defaultdict(list) builds a compact adjacency list where accessing a missing node auto-creates an empty list; pairing it with a deque makes BFS simple and efficient.",
  },
  {
    id: "py-lru-cache-impl",
    language: "python",
    title: "functools.lru_cache with cache info",
    tag: "structures",
    code: `from functools import lru_cache

@lru_cache(maxsize=128)
def fib(n):
    if n < 2:
        return n
    return fib(n - 1) + fib(n - 2)

print(fib(30))              # 832040
print(fib.cache_info())
# CacheInfo(hits=28, misses=31, maxsize=128, currsize=31)

fib.cache_clear()           # wipe the cache
print(fib.cache_info())
# CacheInfo(hits=0, misses=0, maxsize=128, currsize=0)`,
    explanation:
      "lru_cache(maxsize=N) memoizes the last N unique calls, evicting the least-recently-used entry when full; cache_info() exposes hit rate and current size for tuning.",
  },
  {
    id: "py-segment-tree-concept",
    language: "python",
    title: "Segment tree: range query in O(log n)",
    tag: "structures",
    code: `class SegTree:
    def __init__(self, data):
        n = len(data)
        self.n = n
        self.tree = [0] * (2 * n)
        self.tree[n:] = data          # leaves
        for i in range(n - 1, 0, -1):
            self.tree[i] = self.tree[2*i] + self.tree[2*i+1]

    def query(self, l, r):            # sum over [l, r)
        res, l, r = 0, l + self.n, r + self.n
        while l < r:
            if l & 1: res += self.tree[l]; l += 1
            if r & 1: r -= 1; res += self.tree[r]
            l >>= 1; r >>= 1
        return res

st = SegTree([1, 2, 3, 4, 5])
print(st.query(1, 4))   # 9  (2+3+4)`,
    explanation:
      "A segment tree stores range aggregates in a flat array of size 2n; queries and point updates run in O(log n) by traversing from leaves to the root, making it ideal for repeated range-sum or range-min queries.",
  },
  {
    id: "py-union-find-impl",
    language: "python",
    title: "Union-Find with path compression",
    tag: "structures",
    code: `class UnionFind:
    def __init__(self, n):
        self.parent = list(range(n))
        self.rank = [0] * n

    def find(self, x):              # path compression
        if self.parent[x] != x:
            self.parent[x] = self.find(self.parent[x])
        return self.parent[x]

    def union(self, a, b):          # union by rank
        ra, rb = self.find(a), self.find(b)
        if ra == rb: return
        if self.rank[ra] < self.rank[rb]: ra, rb = rb, ra
        self.parent[rb] = ra
        if self.rank[ra] == self.rank[rb]: self.rank[ra] += 1

uf = UnionFind(5)
uf.union(0, 1); uf.union(1, 2)
print(uf.find(0) == uf.find(2))   # True — same component`,
    explanation:
      "Union-Find (disjoint-set union) tracks connected components; path compression flattens the tree during find, and union by rank keeps it balanced, giving nearly O(1) amortized operations.",
  },
  {
    id: "py-priority-queue-heapq",
    language: "python",
    title: "heapq as a min-heap priority queue",
    tag: "structures",
    code: `import heapq

pq = []
heapq.heappush(pq, (3, "low"))
heapq.heappush(pq, (1, "high"))
heapq.heappush(pq, (2, "medium"))

print(heapq.heappop(pq))   # (1, "high")   — smallest priority first
print(heapq.heappop(pq))   # (2, "medium")

# Build from existing list in O(n)
nums = [5, 1, 3, 2, 4]
heapq.heapify(nums)
print(nums[0])   # 1  — peek at min without popping`,
    explanation:
      "Python's heapq module operates on a plain list as a min-heap; store tuples (priority, value) to rank items, and call heapify to convert an existing list in linear time instead of n pushes.",
  },
  {
    id: "py-deque-doubly-linked",
    language: "python",
    title: "deque: O(1) append and pop from both ends",
    tag: "structures",
    code: `from collections import deque

dq = deque([1, 2, 3])
dq.appendleft(0)    # [0, 1, 2, 3]
dq.append(4)        # [0, 1, 2, 3, 4]
print(dq.popleft()) # 0  — O(1) vs O(n) for list.pop(0)
print(dq.pop())     # 4  — O(1)

# maxlen creates a fixed-size ring buffer
recent = deque(maxlen=3)
for i in range(5):
    recent.append(i)
print(recent)       # deque([2, 3, 4], maxlen=3)`,
    explanation:
      "collections.deque is a doubly-linked-list backed structure with O(1) operations at both ends; maxlen turns it into an efficient ring buffer that automatically discards the oldest element when full.",
  },
  {
    id: "py-bidict-concept",
    language: "python",
    title: "Bidirectional dict: key→value and value→key",
    tag: "structures",
    code: `class Bidict:
    def __init__(self):
        self._fwd = {}
        self._inv = {}
    def put(self, k, v):
        self._fwd[k] = v
        self._inv[v] = k
    def get(self, k):
        return self._fwd[k]
    def inv(self, v):
        return self._inv[v]

bd = Bidict()
bd.put("alice", 1)
bd.put("bob",   2)
print(bd.get("alice"))   # 1
print(bd.inv(1))         # "alice"`,
    explanation:
      "A bidirectional dict maintains two mirrored dicts so lookups in either direction are O(1); the third-party bidict package provides a full-featured version with constraint enforcement.",
  },
  {
    id: "py-multiset-counter",
    language: "python",
    title: "Counter as a multiset",
    tag: "structures",
    code: `from collections import Counter

c = Counter("abracadabra")
print(c)                     # Counter({'a': 5, 'b': 2, 'r': 2, 'c': 1, 'd': 1})
print(c.most_common(2))      # [('a', 5), ('b', 2)]
print(c["z"])                # 0  — missing keys return 0, not KeyError

# Arithmetic
c2 = Counter("aab")
print(c + c2)   # add counts
print(c - c2)   # subtract, dropping non-positive counts
print(c & c2)   # intersection (min of counts)
print(c | c2)   # union (max of counts)`,
    explanation:
      "Counter is a multiset implementation that supports arithmetic operations directly on the counts, letting you combine frequency tables with + / - / & / | instead of writing explicit loops.",
  },
  {
    id: "py-named-tuple-fields",
    language: "python",
    title: "NamedTuple: _fields, _asdict(), _replace()",
    tag: "structures",
    code: `from typing import NamedTuple

class Point(NamedTuple):
    x: float
    y: float
    label: str = ""

p = Point(1.0, 2.0, "A")
print(p._fields)           # ('x', 'y', 'label')
print(p._asdict())         # {'x': 1.0, 'y': 2.0, 'label': 'A'}
p2 = p._replace(x=10.0)   # returns a new instance
print(p2)                  # Point(x=10.0, y=2.0, label='A')
print(p.x, p[0])           # 1.0  1.0  — attribute and index both work`,
    explanation:
      "_fields lists the field names, _asdict() serializes to an OrderedDict-like mapping, and _replace() creates a modified copy — all without boilerplate, since NamedTuple generates them automatically.",
  },
  {
    id: "py-namespace-obj",
    language: "python",
    title: "types.SimpleNamespace as a lightweight object",
    tag: "structures",
    code: `from types import SimpleNamespace

cfg = SimpleNamespace(host="localhost", port=8080, debug=True)
print(cfg.host)    # "localhost"
cfg.port = 9090    # mutable
print(vars(cfg))   # {'host': 'localhost', 'port': 9090, 'debug': True}

# Can also build from a dict
data = {"x": 1, "y": 2}
ns = SimpleNamespace(**data)
print(ns.x)   # 1`,
    explanation:
      "SimpleNamespace is a thin wrapper that lets you access dict entries as attributes; it is handy for config objects and test fixtures where a full class feels like overkill.",
  },
  {
    id: "py-simple-struct",
    language: "python",
    title: "dataclass as a plain struct",
    tag: "structures",
    code: `from dataclasses import dataclass, field

@dataclass
class Rect:
    width:  float
    height: float
    color:  str = "white"
    tags:   list = field(default_factory=list)

r = Rect(3.0, 4.0)
print(r)          # Rect(width=3.0, height=4.0, color='white', tags=[])
print(r.width)    # 3.0
r.color = "blue"

r2 = Rect(3.0, 4.0)
print(r == r2)    # True  — __eq__ compares fields by value`,
    explanation:
      "@dataclass generates __init__, __repr__, and __eq__ from the field annotations; use field(default_factory=…) for mutable defaults to avoid the shared-object bug common with list/dict defaults.",
  },
  {
    id: "py-enum-as-key",
    language: "python",
    title: "Enum member as dict key for state dispatch",
    tag: "structures",
    code: `from enum import Enum

class State(Enum):
    IDLE    = "idle"
    RUNNING = "running"
    STOPPED = "stopped"

def on_idle():    return "doing nothing"
def on_running(): return "processing"
def on_stopped(): return "cleaning up"

dispatch = {
    State.IDLE:    on_idle,
    State.RUNNING: on_running,
    State.STOPPED: on_stopped,
}

state = State.RUNNING
print(dispatch[state]())   # "processing"`,
    explanation:
      "Enum members are hashable and can serve as dict keys, enabling a dispatch table that replaces long if/elif chains with an O(1) lookup — and the type system knows which keys are valid.",
  },

  // ── tag: caveats ─────────────────────────────────────────────────────────────
  {
    id: "py-list-copy-vs-slice",
    language: "python",
    title: "list.copy() and list[:] both make a shallow copy",
    tag: "caveats",
    code: `original = [[1, 2], [3, 4]]
shallow = original.copy()    # same as original[:]

shallow.append([5, 6])
print(len(original))   # 2  — outer list is independent

# BUT inner lists are shared
shallow[0].append(99)
print(original[0])     # [1, 2, 99]  — mutation visible in original!

# For a true deep copy:
import copy
deep = copy.deepcopy(original)
deep[0].append(0)
print(original[0])     # [1, 2, 99]  — unchanged`,
    explanation:
      "Both list.copy() and list[:] copy only the outer list structure; the elements (inner lists, dicts, objects) are still shared references — use copy.deepcopy() when you need fully independent nested structures.",
  },
  {
    id: "py-dict-concurrent-modify",
    language: "python",
    title: "Modifying a dict while iterating raises RuntimeError",
    tag: "caveats",
    code: `d = {"a": 1, "b": 2, "c": 3}

# WRONG — raises RuntimeError: dictionary changed size during iteration
# for k in d:
#     if k == "b":
#         del d[k]

# FIX 1: iterate over a copy of keys
for k in list(d.keys()):
    if k == "b":
        del d[k]
print(d)   # {"a": 1, "c": 3}

# FIX 2: build a new dict
d2 = {"a": 1, "b": 2, "c": 3}
d2 = {k: v for k, v in d2.items() if k != "b"}
print(d2)  # {"a": 1, "c": 3}`,
    explanation:
      "Python detects structural changes to a dict during iteration and raises RuntimeError; the simplest fixes are iterating over list(d.keys()) to snapshot the keys, or building a filtered dict comprehension.",
  },
  {
    id: "py-set-unhashable",
    language: "python",
    title: "Adding an unhashable type to a set raises TypeError",
    tag: "caveats",
    code: `s = {1, 2, 3}
s.add(4)          # fine — ints are hashable
s.add("hello")    # fine — strings are hashable

# s.add([1, 2])   # TypeError: unhashable type: 'list'
# s.add({"a": 1}) # TypeError: unhashable type: 'dict'

# Frozenset IS hashable and can be added to a set
s.add(frozenset([1, 2]))
print(s)   # {1, 2, 3, 4, 'hello', frozenset({1, 2})}`,
    explanation:
      "Sets require elements to be hashable (immutable hash contract); mutable built-ins like list and dict cannot be set members — use tuple or frozenset for immutable equivalents.",
  },
  {
    id: "py-class-attr-shadow",
    language: "python",
    title: "Instance attribute shadows a class attribute",
    tag: "caveats",
    code: `class Dog:
    tricks = []   # class-level list — shared by all instances!

    def add_trick(self, trick):
        self.tricks.append(trick)   # mutates the shared class list

d1, d2 = Dog(), Dog()
d1.add_trick("sit")
print(d2.tricks)   # ["sit"]  — oops, d2 also sees it

# Shadowing: assigning to an instance attribute creates a new one
d1.name = "Rex"    # creates instance attribute, doesn't touch Dog.name
print(d1.__dict__) # {'name': 'Rex'}
print(Dog.__dict__.get("name"))  # None`,
    explanation:
      "Mutable class attributes are shared across all instances; assigning a new value to an instance creates a separate instance attribute that shadows the class attribute, but mutating the shared object (e.g., list.append) affects every instance.",
  },
  {
    id: "py-method-resolution",
    language: "python",
    title: "Instance method lookup: instance → class → bases",
    tag: "caveats",
    code: `class Animal:
    def speak(self): return "..."

class Dog(Animal):
    def speak(self): return "Woof"

d = Dog()
print(d.speak())   # "Woof"  — found on Dog

# Bypass instance dict and go directly to a class
print(Dog.speak(d))      # "Woof"
print(Animal.speak(d))   # "..."  — forces Animal's method on a Dog instance

# An instance attribute with the same name as a method shadows it
d.speak = lambda: "customized"
print(d.speak())   # "customized"  — instance dict wins over class`,
    explanation:
      "Python looks up attributes in instance.__dict__ first, then the class (and its MRO), so an instance attribute with the same name as a method silently overrides it — a common source of debugging surprises.",
  },
  {
    id: "py-property-no-setter",
    language: "python",
    title: "Assigning to a property with no setter raises AttributeError",
    tag: "caveats",
    code: `class Circle:
    def __init__(self, radius):
        self._radius = radius

    @property
    def area(self):
        return 3.14159 * self._radius ** 2

c = Circle(5)
print(c.area)   # 78.53975

# c.area = 10   # AttributeError: can't set attribute
# To allow setting, add a setter:
# @area.setter
# def area(self, value):
#     self._radius = (value / 3.14159) ** 0.5`,
    explanation:
      "A @property with only a getter is read-only; attempting to assign raises AttributeError with a confusing message — add a @prop.setter decorator or raise a clearer AttributeError with a helpful message.",
  },
  {
    id: "py-abstract-not-inst",
    language: "python",
    title: "Abstract class cannot be instantiated directly",
    tag: "caveats",
    code: `from abc import ABC, abstractmethod

class Shape(ABC):
    @abstractmethod
    def area(self) -> float: ...

# Shape()   # TypeError: Can't instantiate abstract class Shape
#             with abstract method area

class Circle(Shape):
    def __init__(self, r): self.r = r
    def area(self): return 3.14 * self.r ** 2

c = Circle(3)    # fine — all abstract methods implemented
print(c.area())  # 28.26`,
    explanation:
      "ABC prevents direct instantiation of any class with unimplemented @abstractmethod members, giving you a clear TypeError at object creation time rather than a mysterious AttributeError later.",
  },
  {
    id: "py-super-no-args",
    language: "python",
    title: "super() without arguments works via __class__ cell",
    tag: "caveats",
    code: `class Base:
    def greet(self): return "Hello from Base"

class Child(Base):
    def greet(self):
        base_result = super().greet()   # Python 3: no args needed
        return f"{base_result} + Child"

print(Child().greet())   # "Hello from Base + Child"

# Equivalent Python 2 style (still valid but verbose):
class Child2(Base):
    def greet(self):
        return super(Child2, self).greet() + " + Child2"`,
    explanation:
      "In Python 3, super() with no arguments uses a __class__ cell variable implicitly populated by the compiler, so you never need to repeat the class name — using super(ChildClass, self) is legacy Python 2 style.",
  },
  {
    id: "py-multiple-inherit-init",
    language: "python",
    title: "__init__ is not auto-chained; use super() cooperatively",
    tag: "caveats",
    code: `class A:
    def __init__(self):
        super().__init__()
        print("A.__init__")

class B:
    def __init__(self):
        super().__init__()
        print("B.__init__")

class C(A, B):
    def __init__(self):
        super().__init__()   # follows MRO: C → A → B → object
        print("C.__init__")

C()
# A.__init__
# B.__init__
# C.__init__`,
    explanation:
      "Python does not automatically call all parent __init__ methods in multiple inheritance; every class in the hierarchy must call super().__init__() for cooperative MRO traversal to work — skipping one breaks the chain.",
  },
  {
    id: "py-thread-race",
    language: "python",
    title: "Two threads incrementing a counter without a lock lose updates",
    tag: "caveats",
    code: `import threading

counter = 0

def increment():
    global counter
    for _ in range(100_000):
        counter += 1   # read-modify-write is NOT atomic

t1 = threading.Thread(target=increment)
t2 = threading.Thread(target=increment)
t1.start(); t2.start()
t1.join();  t2.join()
print(counter)   # << 200000 — some updates lost due to race

# Fix: use a Lock
lock = threading.Lock()
def safe_increment():
    global counter
    for _ in range(100_000):
        with lock:
            counter += 1`,
    explanation:
      "counter += 1 compiles to three bytecode instructions (LOAD, ADD, STORE) and the GIL can switch threads between them, causing lost updates; protect shared mutable state with threading.Lock.",
  },
  {
    id: "py-gc-reference-cycle",
    language: "python",
    title: "Reference cycles are handled by the cyclic GC, but can delay cleanup",
    tag: "caveats",
    code: `import gc, weakref

class Node:
    def __init__(self, val):
        self.val = val
        self.next = None
    def __del__(self):
        print(f"Node {self.val} deleted")

a = Node(1)
b = Node(2)
a.next = b
b.next = a   # cycle!

del a, b     # reference count > 0 for both; __del__ not called yet
print("before gc.collect")
gc.collect() # cyclic GC finds and collects them
print("after gc.collect")
# Node 1 deleted / Node 2 deleted (order may vary)`,
    explanation:
      "Python's reference counting cannot collect cycles, so the cyclic garbage collector runs periodically to find and free them; this means __del__ can fire much later than del — avoid relying on __del__ for timely resource release.",
  },
  {
    id: "py-weakref-dead",
    language: "python",
    title: "Dereferencing a dead weakref returns None",
    tag: "caveats",
    code: `import weakref

class Obj:
    pass

obj = Obj()
ref = weakref.ref(obj)

print(ref())          # <__main__.Obj object ...>  — alive

del obj               # object deleted; reference count → 0

print(ref())          # None  — weakref is now dead

# Always check before using
live = ref()
if live is not None:
    print("still alive:", live)
else:
    print("object was collected")   # this branch runs`,
    explanation:
      "A weak reference does not keep the referent alive; once the last strong reference is gone the object is collected and ref() returns None — always check the return value before using a weakref.",
  },
  {
    id: "py-format-security",
    language: "python",
    title: "Never use str.format() with untrusted template strings",
    tag: "caveats",
    code: `# Safe: you control the format string
name = "Alice"
msg = "Hello, {}!".format(name)   # fine

# DANGEROUS: user controls the template
class Config:
    secret = "s3cr3t-key"

cfg = Config()
# Attacker-supplied template:
evil_tmpl = "{cfg.__class__.__bases__[0].__subclasses__()}"
# result = evil_tmpl.format(cfg=cfg)  # leaks class internals!

# Safe alternative for user-supplied templates:
from string import Template
t = Template("Hello, \$name!")   # only allows \$var placeholders
print(t.substitute(name="Alice"))   # "Hello, Alice!"`,
    explanation:
      "str.format() and f-strings let attribute/item access inside placeholders, which can leak internal state or even achieve code execution when the template comes from untrusted input; use string.Template for user-supplied format strings.",
  },
  {
    id: "py-regex-catastrophic",
    language: "python",
    title: "Catastrophic backtracking with nested quantifiers",
    tag: "caveats",
    code: `import re, time

# Pattern (a+)+ on a string like "aaaaX" causes exponential backtracking
bad_pattern = re.compile(r"(a+)+b")

start = time.monotonic()
bad_pattern.match("aaaaaaaaaaaaaac")   # no match — tries every combo
elapsed = time.monotonic() - start
print(f"took {elapsed:.2f}s")   # can take seconds or minutes for longer input

# Fix: rewrite to eliminate ambiguity
good_pattern = re.compile(r"a+b")
good_pattern.match("aaaaaac")   # fast O(n) no-match`,
    explanation:
      "Nested quantifiers like (a+)+ create exponential backtracking when no match exists because the regex engine tries every way to split the as across groups; flatten patterns and use possessive quantifiers (via the regex module) or rewrite the logic.",
  },

  // ── tag: types ───────────────────────────────────────────────────────────────
  {
    id: "py-int-division-floor",
    language: "python",
    title: "// is floor division (rounds toward negative infinity)",
    tag: "types",
    code: `print(7 // 2)     #  3  — positive: same as truncation
print(-7 // 2)    # -4  — negative: rounds DOWN, not toward zero!
print(7 // -2)    # -4
print(-7 // -2)   #  3

# Truncation toward zero (C-style) uses int():
print(int(-7 / 2))   # -3

# Remainder is consistent with //: a == (a//b)*b + a%b
print(-7 % 2)    #  1  (sign of divisor)
print(7 % -2)    # -1  (sign of divisor)`,
    explanation:
      "Python's // always rounds toward negative infinity (floor division), which differs from C/Java truncation for negative numbers; this keeps the invariant a == (a//b)*b + a%b with the remainder always having the sign of the divisor.",
  },
  {
    id: "py-modulo-negative",
    language: "python",
    title: "Python % follows the sign of the divisor",
    tag: "types",
    code: `# Positive divisor — result is always non-negative
print(10 % 3)    #  1
print(-10 % 3)   #  2   (not -1 like C/Java!)

# Negative divisor — result is always non-positive
print(10 % -3)   # -2
print(-10 % -3)  # -1

# Use math.fmod for C-style (sign follows dividend)
import math
print(math.fmod(-10, 3))    # -1.0
print(math.fmod(10, -3))    #  1.0`,
    explanation:
      "Python's % operator returns a result with the same sign as the divisor (following mathematical modulo convention), which differs from C/Java where the sign follows the dividend — math.fmod() gives C-style behavior.",
  },
  {
    id: "py-pow-three-arg",
    language: "python",
    title: "pow(base, exp, mod) for efficient modular exponentiation",
    tag: "types",
    code: `# Two-arg pow is the same as **
print(pow(2, 10))      # 1024
print(2 ** 10)         # 1024

# Three-arg pow(base, exp, mod) — much faster than (base**exp) % mod
# Uses repeated squaring; never builds the huge intermediate number
print(pow(2, 1000, 1000000007))   # 481

# Performance difference on large exponents:
import timeit
big = 10**9
# timeit("(2**big) % big", ...) — builds number with millions of digits
# timeit("pow(2, big, big)", ...) — O(log(exp)) multiplications`,
    explanation:
      "pow(base, exp, mod) uses fast modular exponentiation (O(log exp) multiplications) and never materializes the full number, making it orders of magnitude faster than computing base**exp and then taking the modulus.",
  },
  {
    id: "py-complex-polar",
    language: "python",
    title: "cmath.polar() and cmath.rect() for polar form",
    tag: "types",
    code: `import cmath, math

z = complex(3, 4)
print(abs(z))           # 5.0        — magnitude (same as polar r)

r, phi = cmath.polar(z)
print(r, phi)           # 5.0  0.9272952180016122 radians

# Convert back from polar to rectangular
z2 = cmath.rect(r, phi)
print(z2)               # (3+4j)     — roundtrip

# Euler's formula: e^(i*pi) + 1 = 0
print(cmath.exp(1j * math.pi) + 1)   # ~0j  (floating-point noise)`,
    explanation:
      "cmath.polar(z) returns (r, phi) as magnitude and angle in radians; cmath.rect(r, phi) converts back — useful for rotating vectors, computing roots of unity, or DSP work.",
  },
  {
    id: "py-typing-protocol-impl",
    language: "python",
    title: "Protocol: structural subtyping without inheritance",
    tag: "types",
    code: `from typing import Protocol

class Drawable(Protocol):
    def draw(self) -> None: ...

class Circle:
    def draw(self) -> None:
        print("drawing circle")

class Square:
    def draw(self) -> None:
        print("drawing square")

def render(shape: Drawable) -> None:
    shape.draw()

render(Circle())   # drawing circle  — no inheritance required
render(Square())   # drawing square`,
    explanation:
      "A Protocol defines an interface by structure (duck typing), so any class with the required methods satisfies it at type-check time without explicitly inheriting — enabling interoperability with third-party classes you cannot modify.",
  },
  {
    id: "py-typing-overload-demo",
    language: "python",
    title: "@overload provides multiple signatures for one function",
    tag: "types",
    code: `from typing import overload, Union

@overload
def process(x: int) -> str: ...
@overload
def process(x: str) -> int: ...

def process(x: Union[int, str]) -> Union[str, int]:
    if isinstance(x, int):
        return str(x)
    return len(x)

result1: str = process(42)      # type checker knows → str
result2: int = process("hello") # type checker knows → int
print(result1, result2)         # "42"  5`,
    explanation:
      "@overload stubs inform type checkers of input→output type relationships for a single function; only the non-decorated implementation is called at runtime — the overloads are erased.",
  },
  {
    id: "py-typing-cast",
    language: "python",
    title: "typing.cast() is a no-op at runtime; only affects type checkers",
    tag: "types",
    code: `from typing import cast

def get_value() -> object:
    return 42

val = get_value()
# Type checker thinks val is object; we know it's int
num = cast(int, val)       # tells type checker: treat val as int
print(num + 1)             # 43 — works because it IS an int at runtime

# cast() does NOTHING at runtime — it just returns its second argument
assert cast(str, 99) == 99   # True — no conversion, no check`,
    explanation:
      "typing.cast(T, x) is a zero-cost type annotation hint that returns x unchanged at runtime; use it sparingly to silence type checker complaints when you have information the checker lacks.",
  },
  {
    id: "py-typing-runtime-check",
    language: "python",
    title: "@runtime_checkable Protocol with isinstance()",
    tag: "types",
    code: `from typing import Protocol, runtime_checkable

@runtime_checkable
class Sized(Protocol):
    def __len__(self) -> int: ...

print(isinstance([], Sized))      # True
print(isinstance("hello", Sized)) # True
print(isinstance(42, Sized))      # False

# Without @runtime_checkable, isinstance() raises TypeError
# from typing import Protocol
# class P(Protocol):
#     def foo(self): ...
# isinstance(1, P)   # TypeError`,
    explanation:
      "@runtime_checkable lets isinstance() check whether an object has the required methods; it only verifies method presence, not signatures, so it is a structural check, not a full type guard.",
  },
  {
    id: "py-typing-get-hints",
    language: "python",
    title: "typing.get_type_hints() resolves string annotations",
    tag: "types",
    code: `from __future__ import annotations   # makes all annotations strings lazily
from typing import get_type_hints

class Point:
    x: int
    y: int
    def move(self, dx: int) -> Point: ...

hints = get_type_hints(Point)
print(hints)
# {'x': <class 'int'>, 'y': <class 'int'>}

# Forward references (strings) are resolved at call time
hints2 = get_type_hints(Point.move)
print(hints2)
# {'dx': <class 'int'>, 'return': <class '__main__.Point'>}`,
    explanation:
      "get_type_hints() evaluates annotations as actual types (resolving string forward references) using the class's module globals; __annotations__ gives raw unevaluated strings when from __future__ import annotations is active.",
  },
  {
    id: "py-typing-typeddict-total",
    language: "python",
    title: "TypedDict(total=False) makes all keys optional",
    tag: "types",
    code: `from typing import TypedDict

class User(TypedDict, total=False):
    name: str       # optional — doesn't have to be present
    age:  int       # optional

u1: User = {}                  # valid — all keys optional
u2: User = {"name": "Alice"}   # valid
u3: User = {"name": "Bob", "age": 30}  # also valid

# Mix required and optional with inheritance:
class RequiredFields(TypedDict):
    id: int

class FullUser(RequiredFields, total=False):
    name: str   # optional
    age:  int   # optional`,
    explanation:
      "total=False marks every key in the TypedDict as optional (not required to be present in the dict); combine a required base class with a total=False subclass to express a mix of required and optional keys.",
  },
  {
    id: "py-typing-is-instance",
    language: "python",
    title: "isinstance() with a tuple of types",
    tag: "types",
    code: `def describe(x):
    if isinstance(x, (int, float)):
        return f"number: {x}"
    elif isinstance(x, str):
        return f"string: {x!r}"
    else:
        return f"other: {type(x).__name__}"

print(describe(42))      # "number: 42"
print(describe(3.14))    # "number: 3.14"
print(describe("hi"))    # "string: 'hi'"
print(describe([]))      # "other: list"

# Works with abstract base classes too
from collections.abc import Sequence
print(isinstance([1, 2], Sequence))   # True`,
    explanation:
      "isinstance(x, (T1, T2, ...)) checks against a tuple of types in one call, avoiding chained or/== comparisons; it also respects ABCs like Sequence, Mapping, and Iterable.",
  },
  {
    id: "py-newtype-wrapping",
    language: "python",
    title: "NewType creates a distinct type for the type checker",
    tag: "types",
    code: `from typing import NewType

UserId = NewType("UserId", int)
ProductId = NewType("ProductId", int)

def get_user(uid: UserId) -> str:
    return f"user-{uid}"

uid = UserId(42)
pid = ProductId(42)

print(get_user(uid))   # "user-42"
# get_user(pid)        # mypy error: expected UserId, got ProductId
# get_user(42)         # mypy error: expected UserId, got int

# At runtime NewType is just identity — no wrapping object
print(type(uid))   # <class 'int'>`,
    explanation:
      "NewType('Name', BaseType) creates a zero-overhead type alias that the type checker treats as distinct from the base type, preventing accidental mix-ups between semantically different IDs or quantities that happen to share the same primitive.",
  },
  {
    id: "py-typing-var-default",
    language: "python",
    title: "TypeVar with default= (Python 3.13)",
    tag: "types",
    code: `# Python 3.13+ feature
from typing import TypeVar

# TypeVar with a default type
T = TypeVar("T", default=int)

def make_list(value: T, count: int) -> list[T]:
    return [value] * count

# Type checker infers T=int when not specified
nums = make_list(1, 3)       # list[int]
strs = make_list("x", 2)     # list[str]

# The default is used when T cannot be inferred — e.g. in class contexts
class Stack[T = int]:         # PEP 696 syntax (Python 3.12+ type params)
    def __init__(self): self._data: list[T] = []`,
    explanation:
      "TypeVar with default= (PEP 696, Python 3.13) lets you omit the type argument in contexts where it cannot be inferred, falling back to the specified default instead of an error or Any.",
  },
  {
    id: "py-type-narrowing-union",
    language: "python",
    title: "isinstance / type() / assert narrow union types",
    tag: "types",
    code: `from typing import Union

def process(val: Union[int, str, list]) -> str:
    if isinstance(val, int):
        return f"int: {val * 2}"     # narrowed to int here
    if isinstance(val, str):
        return f"str: {val.upper()}" # narrowed to str here
    # narrowed to list here
    return f"list len: {len(val)}"

print(process(5))          # "int: 10"
print(process("hello"))    # "str: HELLO"
print(process([1, 2, 3]))  # "list len: 3"`,
    explanation:
      "Type narrowing lets the static type checker refine a union to a specific branch after an isinstance / type check or assert, so you get attribute completion and error detection inside each branch without any casts.",
  },

  // ── tag: families ────────────────────────────────────────────────────────────
  {
    id: "py-abc-vs-protocol-cmp",
    language: "python",
    title: "ABC (nominal) vs Protocol (structural): when to use each",
    tag: "families",
    code: `from abc import ABC, abstractmethod
from typing import Protocol

# ABC — nominal: subclass must explicitly inherit
class Serializable(ABC):
    @abstractmethod
    def serialize(self) -> bytes: ...

class Doc(Serializable):
    def serialize(self): return b"doc"

# Protocol — structural: any class with the right method qualifies
class Dumpable(Protocol):
    def dump(self) -> str: ...

class Report:                  # no inheritance!
    def dump(self): return "report"

def save(d: Dumpable): print(d.dump())
save(Report())   # works — Report satisfies Dumpable structurally`,
    explanation:
      "Use ABC when you own the hierarchy and want an enforceable contract via explicit inheritance; use Protocol when working with third-party or legacy classes that you cannot modify but that already have the required interface.",
  },
  {
    id: "py-namedtuple-dataclass-attrs",
    language: "python",
    title: "NamedTuple vs dataclass: immutability and field access",
    tag: "families",
    code: `from typing import NamedTuple
from dataclasses import dataclass

class PtNT(NamedTuple):
    x: float; y: float

@dataclass
class PtDC:
    x: float; y: float

nt = PtNT(1, 2)
dc = PtDC(1, 2)

print(nt[0], nt.x)    # 1  1  — tuple indexing + attribute
# nt.x = 5            # AttributeError — immutable

print(dc.x)           # 1
dc.x = 5              # mutable by default
print(dc.x)           # 5

# NamedTuple unpacks like a tuple
x, y = nt             # works
# x, y = dc           # TypeError — dataclass is not iterable`,
    explanation:
      "NamedTuple is an immutable tuple subclass supporting positional unpacking and index access, while @dataclass is a mutable class by default with no tuple semantics; prefer NamedTuple for value objects, dataclass for entities with behaviour.",
  },
  {
    id: "py-enum-vs-constants",
    language: "python",
    title: "Enum vs module-level constants: discoverability and safety",
    tag: "families",
    code: `# Module constants — easy to misuse
COLOR_RED   = "red"
COLOR_GREEN = "green"
COLOR_BLUE  = "blue"

def paint(color: str): ...
paint("redd")   # typo — no error, silent bug

# Enum — exhaustive, type-safe, discoverable
from enum import Enum

class Color(Enum):
    RED   = "red"
    GREEN = "green"
    BLUE  = "blue"

def paint_safe(color: Color): ...
# paint_safe("red")       # type checker warning
# paint_safe(Color.REDD)  # AttributeError at access time
list(Color)               # [Color.RED, Color.GREEN, Color.BLUE]`,
    explanation:
      "Enum members are first-class objects you can iterate, compare with is, and use as dict keys; module constants are just strings/ints with no membership check, making typos silent failures.",
  },
  {
    id: "py-function-vs-method",
    language: "python",
    title: "Free function vs instance/class/static method",
    tag: "families",
    code: `class Converter:
    factor = 2.54

    def inches_to_cm(self, inches):     # instance method — needs instance state
        return inches * self.factor

    @classmethod
    def from_factor(cls, factor):       # class method — alternative constructor
        obj = cls()
        obj.factor = factor
        return obj

    @staticmethod
    def cm_to_mm(cm):                   # static — no self/cls needed
        return cm * 10

def standalone_convert(inches):        # free function — no class needed
    return inches * 2.54`,
    explanation:
      "Prefer a free function when the logic doesn't need class or instance state; use @staticmethod when it logically belongs to the class namespace but needs neither; @classmethod for factory methods or operations on class-level state.",
  },
  {
    id: "py-lambda-vs-def",
    language: "python",
    title: "lambda (single expression) vs def (full function)",
    tag: "families",
    code: `# lambda: anonymous, single expression, used inline
square = lambda x: x * x
print(sorted([3, 1, 2], key=lambda x: -x))   # [3, 2, 1]

# def: named, multi-statement, debuggable, documentable
def square_named(x):
    """Return x squared."""
    return x * x

# Lambdas cannot contain statements
# f = lambda x: if x > 0: return x   # SyntaxError

# In tracebacks, lambdas show as <lambda>, making debugging harder
import traceback
try:
    (lambda: 1/0)()
except ZeroDivisionError:
    traceback.print_exc()   # File "...", in <lambda>`,
    explanation:
      "Use lambda for short throwaway callbacks passed to sort/map/filter where a name would be noise; use def for anything with multiple lines, documentation, or a meaningful name — lambdas produce unhelpful tracebacks.",
  },
  {
    id: "py-list-comp-vs-map",
    language: "python",
    title: "List comprehension vs map(): readability and performance",
    tag: "families",
    code: `nums = range(1_000_000)

# List comprehension — readable, Pythonic
squares_lc = [x * x for x in nums]

# map() — returns a lazy iterator, no list unless wrapped
squares_map = list(map(lambda x: x * x, nums))

# With a named function, map can be slightly faster (no lambda overhead)
def sq(x): return x * x
squares_fast = list(map(sq, nums))

# Filtering: comprehension wins on readability
evens_lc  = [x for x in nums if x % 2 == 0]
evens_map = list(filter(lambda x: x % 2 == 0, nums))`,
    explanation:
      "List comprehensions are generally preferred for readability; map() is useful when you already have a named function to apply (skipping the lambda) or when you want lazy iteration via a generator expression instead.",
  },
  {
    id: "py-global-vs-local",
    language: "python",
    title: "Global vs local variable lookup speed",
    tag: "families",
    code: `import timeit, dis

def use_global():
    return len([1, 2, 3])      # LOAD_GLOBAL len

def use_local():
    _len = len                  # cache built-in locally
    return _len([1, 2, 3])     # LOAD_FAST _len

# dis.dis(use_global)  → LOAD_GLOBAL  (dict lookup in globals)
# dis.dis(use_local)   → LOAD_FAST   (direct array index into frame)

g = timeit.timeit(use_global, number=1_000_000)
l = timeit.timeit(use_local,  number=1_000_000)
print(f"global: {g:.2f}s  local: {l:.2f}s")
# local is measurably faster in tight loops`,
    explanation:
      "LOAD_FAST is an indexed array access into the frame's local variable array, while LOAD_GLOBAL requires a dict lookup; in hot inner loops caching frequently used built-ins or globals as locals can give a noticeable speedup.",
  },
  {
    id: "py-classvar-vs-instance",
    language: "python",
    title: "Class variable vs instance variable: shared vs per-instance",
    tag: "families",
    code: `class Counter:
    count = 0          # class variable — shared across all instances

    def __init__(self):
        Counter.count += 1     # increment shared counter
        self.id = Counter.count  # instance variable — unique per object

a = Counter()
b = Counter()
c = Counter()
print(Counter.count)   # 3  — shared
print(a.id, b.id, c.id)  # 1  2  3  — per-instance

# Careful: assigning to self.count creates an instance attribute
a.count = 99       # shadows class variable for a only
print(a.count)     # 99  (instance)
print(b.count)     # 3   (class)`,
    explanation:
      "Class variables are shared state living in the class __dict__; instance variables are per-object state in the instance __dict__; assignment via self always creates/updates the instance attribute, silently shadowing the class variable.",
  },
  {
    id: "py-property-vs-attr",
    language: "python",
    title: "@property: lazy validation and computed values",
    tag: "families",
    code: `class Temperature:
    def __init__(self, celsius=0):
        self._celsius = celsius   # private backing attribute

    @property
    def celsius(self):
        return self._celsius

    @celsius.setter
    def celsius(self, value):
        if value < -273.15:
            raise ValueError("Below absolute zero!")
        self._celsius = value

    @property
    def fahrenheit(self):   # computed — no storage needed
        return self._celsius * 9/5 + 32

t = Temperature(100)
print(t.fahrenheit)   # 212.0
t.celsius = -300      # ValueError: Below absolute zero!`,
    explanation:
      "Use @property instead of plain attributes when you need validation on set, a computed value on get, or the ability to add these later without changing the public API.",
  },
  {
    id: "py-staticmethod-classmethod-cmp",
    language: "python",
    title: "staticmethod (no self/cls) vs classmethod (cls)",
    tag: "families",
    code: `class Date:
    def __init__(self, year, month, day):
        self.year, self.month, self.day = year, month, day

    @classmethod
    def from_iso(cls, iso_str):        # receives the class, can call cls()
        y, m, d = map(int, iso_str.split("-"))
        return cls(y, m, d)

    @staticmethod
    def is_leap(year):                  # no class or instance context needed
        return year % 4 == 0 and (year % 100 != 0 or year % 400 == 0)

d = Date.from_iso("2024-02-29")        # factory using classmethod
print(Date.is_leap(2024))              # True — utility function`,
    explanation:
      "@classmethod receives the class as its first argument and is ideal for alternative constructors or operations on class-level state; @staticmethod receives nothing implicitly and is just a function namespaced inside the class.",
  },
  {
    id: "py-slots-vs-dict",
    language: "python",
    title: "__slots__ saves memory and speeds attribute access",
    tag: "families",
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

print(sys.getsizeof(d) + sys.getsizeof(d.__dict__))   # ~232 bytes
print(sys.getsizeof(s))                                 # ~56 bytes

# __slots__ also prevents accidental attribute creation
# s.z = 3   # AttributeError: 'WithSlots' object has no attribute 'z'`,
    explanation:
      "__slots__ replaces the per-instance __dict__ with a fixed-size array of descriptors, cutting memory usage significantly for classes with many instances and making attribute access faster.",
  },
  {
    id: "py-abstract-concrete",
    language: "python",
    title: "Abstract vs concrete class: API contract enforcement",
    tag: "families",
    code: `from abc import ABC, abstractmethod

class Storage(ABC):
    @abstractmethod
    def read(self, key: str) -> bytes: ...

    @abstractmethod
    def write(self, key: str, data: bytes) -> None: ...

    def exists(self, key: str) -> bool:   # concrete helper — shared
        try:
            self.read(key)
            return True
        except KeyError:
            return False

class MemStorage(Storage):
    def __init__(self): self._store = {}
    def read(self, key): return self._store[key]
    def write(self, key, data): self._store[key] = data`,
    explanation:
      "Abstract classes define the contract (abstract methods) while providing shared concrete helpers; subclasses only need to implement the abstract parts — guaranteeing the API is complete without duplicating utility code.",
  },
  {
    id: "py-sync-async-gen",
    language: "python",
    title: "Synchronous generator vs async generator",
    tag: "families",
    code: `# Sync generator — normal function with yield
def count_up(n):
    for i in range(n):
        yield i

for x in count_up(3):
    print(x)   # 0  1  2

# Async generator — async function with yield; iterated with async for
import asyncio

async def async_count(n):
    for i in range(n):
        await asyncio.sleep(0)   # simulate async I/O
        yield i

async def main():
    async for x in async_count(3):
        print(x)   # 0  1  2

asyncio.run(main())`,
    explanation:
      "Use a sync generator for purely CPU-bound lazy sequences; use an async generator when each value requires awaiting I/O — mixing yield with await turns the function into an async generator that must be consumed with async for.",
  },
  {
    id: "py-bytes-memview-buffer",
    language: "python",
    title: "bytes / memoryview / buffer protocol: zero-copy slicing",
    tag: "families",
    code: `data = bytearray(b"Hello, World!")

# bytes slice creates a copy
b = bytes(data)
slice1 = b[7:]         # new bytes object — copy!

# memoryview slices WITHOUT copying
mv = memoryview(data)
slice2 = mv[7:]        # zero-copy view into same memory
print(bytes(slice2))   # b"World!"

# Modify original through memoryview
mv[0] = ord("h")
print(data)            # bytearray(b"hello, World!") — original changed

# Buffer protocol works with array, numpy, ctypes etc.
import array
arr = array.array("i", [1, 2, 3, 4])
mv2 = memoryview(arr)
print(mv2[0])          # 1`,
    explanation:
      "memoryview exposes the buffer protocol, giving you slices and subviews into mutable binary objects (bytearray, array, numpy arrays) without copying data — critical for high-performance binary parsing and I/O.",
  },

  // ── tag: classes ─────────────────────────────────────────────────────────────
  {
    id: "py-mixin-pattern",
    language: "python",
    title: "Mixin adds behavior without being a full base class",
    tag: "classes",
    code: `class JsonMixin:
    def to_json(self):
        import json
        return json.dumps(self.__dict__)

class LogMixin:
    def log(self, msg):
        print(f"[{type(self).__name__}] {msg}")

class User(JsonMixin, LogMixin):
    def __init__(self, name, age):
        self.name = name
        self.age = age

u = User("Alice", 30)
print(u.to_json())   # '{"name": "Alice", "age": 30}'
u.log("created")     # "[User] created"`,
    explanation:
      "A mixin is a class that provides reusable methods meant to be mixed into other classes via multiple inheritance without being instantiated on its own; it typically has no __init__ and makes no assumption about other base classes.",
  },
  {
    id: "py-abstract-mixin",
    language: "python",
    title: "Abstract mixin: ABC + mixin for enforced interface + helpers",
    tag: "classes",
    code: `from abc import ABC, abstractmethod

class SerializableMixin(ABC):
    @abstractmethod
    def _to_dict(self) -> dict: ...

    def to_json(self) -> str:   # concrete helper built on the abstract method
        import json
        return json.dumps(self._to_dict())

class Product(SerializableMixin):
    def __init__(self, name, price):
        self.name, self.price = name, price

    def _to_dict(self):
        return {"name": self.name, "price": self.price}

p = Product("Widget", 9.99)
print(p.to_json())   # '{"name": "Widget", "price": 9.99}'`,
    explanation:
      "Combining ABC and mixin lets you define an interface contract (@abstractmethod) alongside concrete helpers that rely on it, ensuring subclasses implement the required primitives while getting the shared utilities for free.",
  },
  {
    id: "py-data-descriptor",
    language: "python",
    title: "Data descriptor (has __set__) overrides instance dict",
    tag: "classes",
    code: `class Validated:
    def __set_name__(self, owner, name):
        self.name = name
    def __get__(self, obj, objtype=None):
        if obj is None: return self
        return obj.__dict__.get(self.name)
    def __set__(self, obj, value):
        if not isinstance(value, int):
            raise TypeError(f"{self.name} must be int")
        obj.__dict__[self.name] = value

class Point:
    x = Validated()   # data descriptor — has __set__

p = Point()
p.x = 10
print(p.x)   # 10
# p.x = "hi"  # TypeError
# p.__dict__["x"] = 99   # won't override descriptor — data descriptor wins!`,
    explanation:
      "A data descriptor (defines both __get__ and __set__) takes priority over the instance's __dict__ during attribute lookup, making it impossible for instance-level assignment to bypass validation.",
  },
  {
    id: "py-non-data-descriptor",
    language: "python",
    title: "Non-data descriptor (only __get__) is shadowed by instance dict",
    tag: "classes",
    code: `class Greeting:
    def __get__(self, obj, objtype=None):
        if obj is None: return self
        return f"Hello, {obj.name}!"
    # No __set__ — non-data descriptor

class Person:
    greet = Greeting()

    def __init__(self, name):
        self.name = name

p = Person("Alice")
print(p.greet)    # "Hello, Alice!" — descriptor called

# Instance dict assignment shadows the non-data descriptor
p.greet = "Hi!"
print(p.greet)    # "Hi!" — instance dict wins over non-data descriptor
print(p.__dict__) # {'name': 'Alice', 'greet': 'Hi!'}`,
    explanation:
      "A non-data descriptor (only __get__, no __set__) is lower priority than the instance __dict__; assigning to the attribute on the instance creates an entry that silently shadows the descriptor — unlike data descriptors which always win.",
  },
  {
    id: "py-metaclass-register",
    language: "python",
    title: "__init_subclass__ auto-registers subclasses",
    tag: "classes",
    code: `class Plugin:
    _registry: dict = {}

    def __init_subclass__(cls, name: str = "", **kw):
        super().__init_subclass__(**kw)
        if name:
            Plugin._registry[name] = cls

class AudioPlugin(Plugin, name="audio"):
    def run(self): return "playing audio"

class VideoPlugin(Plugin, name="video"):
    def run(self): return "playing video"

print(Plugin._registry)
# {'audio': <class 'AudioPlugin'>, 'video': <class 'VideoPlugin'>}

plugin = Plugin._registry["audio"]()
print(plugin.run())   # "playing audio"`,
    explanation:
      "__init_subclass__ is a class-method hook called on the base class whenever a subclass is defined, enabling automatic plugin registration without a metaclass or manual __init_subclass_hooks__ bookkeeping.",
  },
  {
    id: "py-metaclass-singleton",
    language: "python",
    title: "Metaclass-based singleton pattern",
    tag: "classes",
    code: `class SingletonMeta(type):
    _instances: dict = {}

    def __call__(cls, *args, **kw):
        if cls not in cls._instances:
            cls._instances[cls] = super().__call__(*args, **kw)
        return cls._instances[cls]

class Config(metaclass=SingletonMeta):
    def __init__(self, value=0):
        self.value = value

a = Config(1)
b = Config(2)
print(a is b)        # True  — same object
print(a.value)       # 1     — second __init__ never ran`,
    explanation:
      "A metaclass singleton intercepts __call__ (object creation), returns the cached instance on subsequent calls, and prevents __init__ from running again — more robust than module-level singletons or decorators.",
  },
  {
    id: "py-metaclass-attr-track",
    language: "python",
    title: "Metaclass __new__ tracks class attributes at definition time",
    tag: "classes",
    code: `class TrackFields(type):
    def __new__(mcs, name, bases, namespace):
        fields = [k for k, v in namespace.items()
                  if not k.startswith("_") and not callable(v)]
        cls = super().__new__(mcs, name, bases, namespace)
        cls._fields = fields
        return cls

class Record(metaclass=TrackFields):
    title = ""
    year  = 0
    genre = "unknown"

    def summary(self):
        return f"{self.title} ({self.year})"

print(Record._fields)   # ['title', 'year', 'genre']  — methods excluded`,
    explanation:
      "Metaclass __new__ receives the full class namespace before the class object is created, making it the right place to inspect or transform class-level attributes — here collecting non-callable non-private names as a schema.",
  },
  {
    id: "py-init-new-order",
    language: "python",
    title: "__new__ runs before __init__; can return a different type",
    tag: "classes",
    code: `class Singleton:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        # called every time, even though __new__ returns the same object
        pass

# Returning a different type from __new__: __init__ is skipped
class AlwaysInt:
    def __new__(cls, value):
        return int(value)   # returns an int, not AlwaysInt

obj = AlwaysInt("42")
print(type(obj))   # <class 'int'>
print(obj)         # 42`,
    explanation:
      "__new__ allocates and returns the instance; if it returns an instance of a different type, __init__ is not called — useful for immutable types, caching, or factories that transparently return existing objects.",
  },
  {
    id: "py-copy-protocol",
    language: "python",
    title: "__copy__ and __deepcopy__ for custom copy behavior",
    tag: "classes",
    code: `import copy

class Config:
    def __init__(self, data, cache=None):
        self.data = data
        self.cache = cache or {}   # transient — don't copy

    def __copy__(self):
        return Config(self.data)   # shallow: same data, fresh cache

    def __deepcopy__(self, memo):
        return Config(copy.deepcopy(self.data, memo))  # deep data, fresh cache

cfg = Config({"key": [1, 2, 3]}, cache={"x": 99})
shallow = copy.copy(cfg)
deep    = copy.deepcopy(cfg)

print(shallow.cache)   # {}  — reset
print(deep.cache)      # {}  — reset`,
    explanation:
      "__copy__ and __deepcopy__ let you control exactly which parts of an object are duplicated; here the cache is intentionally not copied because it is transient state that should start fresh in every clone.",
  },
  {
    id: "py-pickle-custom",
    language: "python",
    title: "__getstate__ / __setstate__ for custom pickling",
    tag: "classes",
    code: `import pickle

class Connection:
    def __init__(self, host, port):
        self.host = host
        self.port = port
        self._socket = None   # live socket — not picklable

    def __getstate__(self):
        state = self.__dict__.copy()
        del state["_socket"]   # exclude unpicklable field
        return state

    def __setstate__(self, state):
        self.__dict__.update(state)
        self._socket = None    # reinitialise after restore

conn = Connection("localhost", 8080)
data = pickle.dumps(conn)
conn2 = pickle.loads(data)
print(conn2.host, conn2.port, conn2._socket)   # localhost  8080  None`,
    explanation:
      "__getstate__ returns the state dict pickle should store; __setstate__ restores the object from that dict — use them to exclude unpicklable objects (sockets, locks, file handles) while preserving everything else.",
  },
  {
    id: "py-hash-equality-contract",
    language: "python",
    title: "Objects that compare equal must have the same hash",
    tag: "classes",
    code: `class Point:
    def __init__(self, x, y):
        self.x, self.y = x, y

    def __eq__(self, other):
        return isinstance(other, Point) and self.x == other.x and self.y == other.y

    def __hash__(self):                   # MUST define when __eq__ is defined
        return hash((self.x, self.y))     # use immutable tuple for stability

p1 = Point(1, 2)
p2 = Point(1, 2)
print(p1 == p2)   # True
print(hash(p1) == hash(p2))   # True — contract satisfied

s = {p1, p2}
print(len(s))     # 1  — treated as equal in set`,
    explanation:
      "Python requires that if a == b then hash(a) == hash(b); failing to define __hash__ alongside __eq__ makes the class unhashable (set/dict keys break); hash on a tuple of the relevant fields is the standard approach.",
  },
  {
    id: "py-operator-overload-add",
    language: "python",
    title: "__add__ and __radd__ for left and right operands",
    tag: "classes",
    code: `class Vec:
    def __init__(self, x, y):
        self.x, self.y = x, y

    def __add__(self, other):        # self + other
        if isinstance(other, Vec):
            return Vec(self.x + other.x, self.y + other.y)
        return NotImplemented

    def __radd__(self, other):       # other + self  (when other doesn't know Vec)
        return self.__add__(other)

    def __repr__(self):
        return f"Vec({self.x}, {self.y})"

print(Vec(1, 2) + Vec(3, 4))   # Vec(4, 6)
# sum([Vec(1,2), Vec(3,4)])   # works because sum starts with 0+... → __radd__`,
    explanation:
      "Python tries the left operand's __add__ first; if it returns NotImplemented, the right operand's __radd__ is tried — implementing both lets your objects participate naturally in expressions and built-ins like sum().",
  },
  {
    id: "py-operator-overload-cmp",
    language: "python",
    title: "Comparison operators: __eq__, __lt__, __le__, __gt__, __ge__",
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
    # total_ordering fills in __le__, __gt__, __ge__ automatically

v1, v2 = Version(1, 0), Version(1, 2)
print(v1 < v2)    # True
print(v1 > v2)    # False
print(sorted([v2, v1]))   # [Version(1,0), Version(1,2)]`,
    explanation:
      "@total_ordering generates the remaining four comparison methods from __eq__ and one of __lt__ / __le__ / __gt__ / __ge__, saving boilerplate while keeping sort(), min(), and max() working correctly.",
  },
  {
    id: "py-class-decorator",
    language: "python",
    title: "Class decorator wraps a class definition",
    tag: "classes",
    code: `def singleton(cls):
    instances = {}
    def get_instance(*args, **kw):
        if cls not in instances:
            instances[cls] = cls(*args, **kw)
        return instances[cls]
    return get_instance

@singleton
class AppConfig:
    def __init__(self, debug=False):
        self.debug = debug

a = AppConfig(debug=True)
b = AppConfig()
print(a is b)      # True
print(a.debug)     # True`,
    explanation:
      "A class decorator receives the class object and returns a replacement (often a function or a modified class); it is applied once at class definition time, making it useful for registration, wrapping constructors, or adding class-level behaviour.",
  },
  {
    id: "py-frozen-class-impl",
    language: "python",
    title: "@dataclass(frozen=True) prevents attribute mutation",
    tag: "classes",
    code: `from dataclasses import dataclass

@dataclass(frozen=True)
class Point:
    x: float
    y: float

p = Point(1.0, 2.0)
print(p.x)       # 1.0
# p.x = 5.0     # FrozenInstanceError: cannot assign to field 'x'

# frozen=True also auto-generates __hash__ (safe because immutable)
print(hash(p))   # consistent hash

# Can be used as a dict key or set member
d = {p: "origin"}
print(d[Point(1.0, 2.0)])   # "origin"`,
    explanation:
      "@dataclass(frozen=True) makes all fields read-only after __init__ by overriding __setattr__ and __delattr__, and automatically provides a __hash__ implementation — making instances safe as dict keys.",
  },
  {
    id: "py-slots-memory",
    language: "python",
    title: "__slots__ benchmark: memory reduction vs regular class",
    tag: "classes",
    code: `import sys, tracemalloc

class Regular:
    def __init__(self, x, y, z):
        self.x, self.y, self.z = x, y, z

class Slotted:
    __slots__ = ("x", "y", "z")
    def __init__(self, x, y, z):
        self.x, self.y, self.z = x, y, z

N = 100_000

tracemalloc.start()
reg_objs = [Regular(i, i, i) for i in range(N)]
reg_mem, _ = tracemalloc.get_traced_memory()
tracemalloc.stop()

tracemalloc.start()
slt_objs = [Slotted(i, i, i) for i in range(N)]
slt_mem, _ = tracemalloc.get_traced_memory()
tracemalloc.stop()

print(f"Regular: {reg_mem/1e6:.1f} MB")   # ~40 MB
print(f"Slotted: {slt_mem/1e6:.1f} MB")   # ~12 MB`,
    explanation:
      "__slots__ eliminates the per-instance __dict__ (a hash table) and replaces it with a compact fixed-size descriptor array; with 100 k instances the memory saving is typically 60–70%, which matters for data-heavy applications.",
  },
];
