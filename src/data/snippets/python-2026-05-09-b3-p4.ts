import type { Snippet } from "./types";

export const pythonSnippets20260509B3P4: Snippet[] = [
  {
    id: "py-snippet-pprint-usage",
    language: "python",
    title: "pprint.pprint formats nested structures readably",
    tag: "snippet",
    code: `import pprint

data = {
    'users': [
        {'name': 'Alice', 'age': 30, 'roles': ['admin', 'user']},
        {'name': 'Bob',   'age': 25, 'roles': ['user']},
    ],
    'config': {'debug': True, 'max_retries': 3},
}

# Default print: one line
print(data)

# pprint: structured, indented
pprint.pprint(data, indent=2, width=60)

# pformat: get the string without printing
s = pprint.pformat(data, sort_dicts=True)
print(len(s))`,
    explanation: "pprint.pprint prints nested data structures with indentation and line wrapping; pformat returns the formatted string. sort_dicts=True (default) sorts dict keys alphabetically for reproducible output.",
  },
  {
    id: "py-snippet-base64-encode",
    language: "python",
    title: "base64 encodes binary data as ASCII text",
    tag: "snippet",
    code: `import base64

data = b'Hello, World! \x00\xff'

# Standard base64
encoded = base64.b64encode(data)
print(encoded)   # b'SGVsbG8sIFdvcmxkISAA/w=='

decoded = base64.b64decode(encoded)
print(decoded == data)   # True

# URL-safe base64 (replaces +/ with -_)
url_safe = base64.urlsafe_b64encode(data)
print(url_safe)   # b'SGVsbG8sIFdvcmxkISAA_w=='

# Encode a string
text_encoded = base64.b64encode(b'user:password').decode()
print(text_encoded)   # dXNlcjpwYXNzd29yZA==`,
    explanation: "base64 encodes arbitrary bytes as printable ASCII, expanding 3 bytes to 4 characters. URL-safe base64 replaces + with - and / with _, making it safe for URLs and filenames. Use it for embedding binary data in JSON or HTTP headers.",
  },
  {
    id: "py-snippet-timedelta-ops",
    language: "python",
    title: "timedelta arithmetic for date and time differences",
    tag: "snippet",
    code: `from datetime import datetime, timedelta

now = datetime(2026, 5, 9, 12, 0, 0)

# Add/subtract timedelta
tomorrow = now + timedelta(days=1)
last_week = now - timedelta(weeks=1)

print(tomorrow)    # 2026-05-10 12:00:00
print(last_week)   # 2026-05-02 12:00:00

# Difference between two datetimes gives timedelta
start = datetime(2026, 1, 1)
elapsed = now - start
print(elapsed.days)          # 128
print(elapsed.total_seconds())  # 11059200.0

# timedelta components
delta = timedelta(hours=25, minutes=90)
print(delta)   # 1 day, 2:30:00`,
    explanation: "Subtracting two datetime objects yields a timedelta; adding a timedelta to a datetime shifts it. Total_seconds() converts the delta to a float; days and seconds are the stored components (days are always non-negative for positive deltas).",
  },
  {
    id: "py-understanding-async-gen",
    language: "python",
    title: "Async generators combine async/await with yield",
    tag: "understanding",
    code: `import asyncio

async def ticker(count: int, interval: float):
    for i in range(count):
        await asyncio.sleep(interval)
        yield i

async def main():
    async for value in ticker(5, 0.01):
        print(value, end=' ')
    print()
    # 0 1 2 3 4

    # Collect into list with async comprehension
    values = [v async for v in ticker(3, 0.01)]
    print(values)   # [0, 1, 2]

asyncio.run(main())`,
    explanation: "An async generator is an async def function that yields; each yield produces the next value asynchronously. Use async for to consume it and 'async for' in list comprehensions. Unlike regular generators, async generators support asynchronous operations between yields.",
  },
  {
    id: "py-understanding-protocol-structural",
    language: "python",
    title: "Protocols enable structural (duck-type) typing at check time",
    tag: "understanding",
    code: `from typing import Protocol

class Closeable(Protocol):
    def close(self) -> None: ...

class FileWrapper:
    def close(self) -> None:
        print('file closed')

class NetworkConn:
    def close(self) -> None:
        print('connection closed')

def cleanup(resource: Closeable) -> None:
    resource.close()

# No inheritance required -- structural match is enough
cleanup(FileWrapper())    # file closed
cleanup(NetworkConn())   # connection closed

# Type checkers verify the protocol is satisfied at call sites`,
    explanation: "Protocol defines a structural interface: any class with matching methods satisfies it without inheriting. This is duck typing with static verification; you get type safety without coupling unrelated classes through a common base class.",
  },
  {
    id: "py-structures-persistent-queue",
    language: "python",
    title: "shelve persists Python objects to a key-value store on disk",
    tag: "structures",
    code: `import shelve, tempfile, os

tmpfile = tempfile.mktemp()
try:
    # Open a persistent shelf (backed by dbm)
    with shelve.open(tmpfile) as db:
        db['user'] = {'name': 'Alice', 'score': 99}
        db['items'] = [1, 2, 3, 4]

    # Reopen and read back
    with shelve.open(tmpfile) as db:
        print(db['user']['name'])   # Alice
        db['items'].append(5)       # WARNING: in-place mutation NOT saved!
        db['items'] = db['items'] + [5]  # must reassign

        for key in db.keys():
            print(key)   # user, items
finally:
    for ext in ['', '.db', '.dir', '.bak', '.dat']:
        try: os.remove(tmpfile + ext)
        except FileNotFoundError: pass`,
    explanation: "shelve persists Python objects keyed by strings using pickle under the hood; it's useful for simple caching or cross-session state. Mutable objects must be explicitly reassigned to be saved — in-place mutations to retrieved objects are lost.",
  },
  {
    id: "py-structures-named-pipe",
    language: "python",
    title: "multiprocessing.Pipe creates a two-way inter-process channel",
    tag: "structures",
    code: `from multiprocessing import Process, Pipe

def worker(conn):
    msg = conn.recv()              # receive from parent
    conn.send(f'echo: {msg}')     # send back
    conn.close()

parent_conn, child_conn = Pipe()
p = Process(target=worker, args=(child_conn,))
p.start()

parent_conn.send('hello')         # send to worker
response = parent_conn.recv()     # receive from worker
print(response)   # echo: hello

p.join()
parent_conn.close()`,
    explanation: "Pipe() returns two Connection objects representing opposite ends of a duplex channel; each end can send() and recv() arbitrary picklable objects. For one-to-many scenarios, use multiprocessing.Queue which is built on a Pipe plus a Lock.",
  },
  {
    id: "py-caveats-set-dict-order",
    language: "python",
    title: "Sets are unordered — iteration order is unpredictable",
    tag: "caveats",
    code: `# Sets have no defined iteration order
s = {3, 1, 4, 1, 5, 9, 2, 6}
print(s)         # {1, 2, 3, 4, 5, 6, 9} -- looks sorted but isn't guaranteed

# Order can differ between Python versions and interpreter runs
for x in s:
    print(x, end=' ')   # order not guaranteed

# If you need sorted output, convert explicitly
print(sorted(s))        # [1, 2, 3, 4, 5, 6, 9]

# Dicts preserve insertion order (Python 3.7+) but sets never do
d = {'b': 2, 'a': 1, 'c': 3}
print(list(d))   # ['b', 'a', 'c'] -- insertion order preserved`,
    explanation: "Python sets use a hash table with no ordering guarantee; the iteration order depends on hash values and may change between runs or Python versions. Always call sorted() when you need a predictable order from a set.",
  },
  {
    id: "py-caveats-bool-is-int",
    language: "python",
    title: "bool is a subclass of int: True==1 and False==0",
    tag: "caveats",
    code: `print(isinstance(True, int))    # True
print(True + True)              # 2
print(True * 5)                 # 5
print(False + 1)                # 1

# Can be used for conditional counting
values = [1, 0, -1, 2, 0, 3]
positives = sum(v > 0 for v in values)   # True counts as 1
print(positives)   # 3

# Pitfall: True == 1 in dict/set
d = {True: 'true', 1: 'one'}
print(d)    # {True: 'one'}  -- True and 1 hash the same!
print(len({True, 1, False, 0}))   # 2 (not 4)`,
    explanation: "bool is a subclass of int with True==1 and False==0; this enables counting Booleans with sum() but can cause surprises in dicts and sets where True and 1 (and False and 0) are treated as the same key.",
  },
  {
    id: "py-caveats-comparison-chaining",
    language: "python",
    title: "Python comparison chaining: a < b < c is evaluated correctly",
    tag: "caveats",
    code: `# In Python, chaining is a < b AND b < c (b evaluated once)
x = 5
print(1 < x < 10)    # True  -- pythonic range check
print(1 < x and x < 10)  # equivalent

# Chaining works with any comparators
print(1 < 2 <= 2 < 3)   # True

# Pitfall: 'in' and 'not in' also chain
lst = [1, 2, 3]
# This does NOT check if 2 is between 1 and 3 in lst
print(1 < 2 in lst)   # True  (1 < 2) AND (2 in lst)

# In other languages, a < b < c is (a < b) < c
# In C: (1 < 5) < 10 → 1 < 10 → True (but for wrong reason!)`,
    explanation: "Python comparison chaining evaluates as a conjunction: a < b < c means (a < b) and (b < c) with b computed once. The operator 'in' can also appear in a chain. This differs from C/Java where < is left-associative and gives a boolean int.",
  },
  {
    id: "py-types-narrowing",
    language: "python",
    title: "isinstance narrows the type in the true branch",
    tag: "types",
    code: `def process(value: int | str | list[int]) -> str:
    if isinstance(value, int):
        # type checker knows: value: int here
        return f'integer: {value * 2}'
    elif isinstance(value, str):
        # type checker knows: value: str here
        return f'string: {value.upper()}'
    else:
        # type checker knows: value: list[int] here
        return f'list: {sum(value)}'

print(process(5))             # integer: 10
print(process('hello'))       # string: HELLO
print(process([1, 2, 3]))    # list: 6

# type() narrowing also works for literals
def is_exact_int(x: int | bool) -> str:
    if type(x) is bool:
        return f'bool: {x}'
    return f'int: {x}'`,
    explanation: "Type checkers track isinstance/issubclass/type checks and narrow the variable's type in the branch where the check passes. This eliminates the need for explicit casts and makes union-type handling type-safe.",
  },
  {
    id: "py-types-never",
    language: "python",
    title: "Never / NoReturn marks functions that never return normally",
    tag: "types",
    code: `from typing import Never, NoReturn

def raise_always(msg: str) -> NoReturn:
    raise RuntimeError(msg)
    # type checker knows code after this is unreachable

def assert_never(x: Never) -> NoReturn:
    raise AssertionError(f'unhandled case: {x!r}')

type Status = 'ok' | 'error' | 'pending'

def handle(status: str) -> str:
    if status == 'ok':
        return 'success'
    elif status == 'error':
        return 'failure'
    elif status == 'pending':
        return 'waiting'
    else:
        assert_never(status)  # type checker flags if any case is missing`,
    explanation: "NoReturn (and its alias Never) tells type checkers the function never returns via a normal path; code after a NoReturn call is unreachable. assert_never() in the exhaustive else branch causes a type error if any union variant is unhandled.",
  },
  {
    id: "py-types-unpack",
    language: "python",
    title: "Unpack and TypeVarTuple for variadic generic types",
    tag: "types",
    code: `from typing import TypeVarTuple, Unpack
Ts = TypeVarTuple('Ts')

# A function that returns a tuple of the same types as its arguments
def identity(*args: Unpack[Ts]) -> tuple[Unpack[Ts]]:
    return args

a, b, c = identity(1, 'hello', 3.14)
# a: int, b: str, c: float -- fully typed

# Useful for typed tuple transformation
from typing import Callable
def map_tuple(fn: Callable[[int], str], *args: Unpack[Ts]) -> None:
    pass   # example signature

print(identity(42, 'x', True))   # (42, 'x', True)`,
    explanation: "TypeVarTuple and Unpack enable variadic generics: a type variable that stands for an arbitrary-length tuple of types. This allows typing functions that preserve the types of multiple positional arguments through the return value.",
  },
  {
    id: "py-snippet-hashlib-sha256",
    language: "python",
    title: "hashlib computes cryptographic digests of data",
    tag: "snippet",
    code: `import hashlib

# One-shot hash
data = b'Hello, World!'
digest = hashlib.sha256(data).hexdigest()
print(digest)   # 64 hex chars

# Incremental hash for large files
hasher = hashlib.sha256()
with open('/etc/hostname', 'rb') as f:
    for chunk in iter(lambda: f.read(8192), b''):
        hasher.update(chunk)
print(hasher.hexdigest())

# MD5 for non-security uses (checksums)
md5 = hashlib.md5(b'data').hexdigest()

# List available algorithms
print(sorted(hashlib.algorithms_guaranteed)[:5])`,
    explanation: "hashlib provides all common cryptographic hash functions; sha256 and sha3_256 are recommended for security. Use incremental update() for streaming large files. MD5 and SHA-1 are broken for security but fine for checksums.",
  },
  {
    id: "py-snippet-calendar-module",
    language: "python",
    title: "calendar module provides month/year views and date utilities",
    tag: "snippet",
    code: `import calendar

# Text calendar for a month
print(calendar.month(2026, 5))

# monthcalendar: list of weeks (0 = day not in month)
weeks = calendar.monthcalendar(2026, 5)
print(weeks[0])   # [0, 0, 0, 0, 1, 2, 3]  (Mon-Sun, May 2026)

# Day of week (0=Monday, 6=Sunday)
print(calendar.weekday(2026, 5, 9))   # 5 (Saturday)

# Is a leap year?
print(calendar.isleap(2024))   # True
print(calendar.isleap(2026))   # False

# Number of days in a month
print(calendar.monthrange(2026, 2))  # (6, 28) -- (weekday of 1st, days)`,
    explanation: "The calendar module provides month/year text calendars, monthcalendar() for structured week lists, weekday() for the day-of-week, and isleap() for leap year checks. monthrange() returns both the weekday of the first day and the number of days.",
  },
  {
    id: "py-structures-sorted-containers",
    language: "python",
    title: "SortedList (sortedcontainers) maintains sorted order with O(log n) ops",
    tag: "structures",
    code: `# pip install sortedcontainers
# from sortedcontainers import SortedList

# Equivalent manual implementation concept:
import bisect

class SimpleSortedList:
    def __init__(self):
        self._data = []

    def add(self, val):
        bisect.insort(self._data, val)

    def __contains__(self, val):
        i = bisect.bisect_left(self._data, val)
        return i < len(self._data) and self._data[i] == val

    def irange(self, lo, hi):
        l = bisect.bisect_left(self._data, lo)
        r = bisect.bisect_right(self._data, hi)
        return self._data[l:r]

sl = SimpleSortedList()
for v in [5, 1, 3, 2, 4]:
    sl.add(v)
print(sl._data)          # [1, 2, 3, 4, 5]
print(sl.irange(2, 4))   # [2, 3, 4]`,
    explanation: "A sorted list maintains elements in sorted order; bisect.insort adds in O(n) (due to list shifting) and bisect.bisect_left searches in O(log n). The sortedcontainers library provides an O(log n) add via a B-tree-like list-of-lists structure.",
  },
  {
    id: "py-caveats-generators-in-args",
    language: "python",
    title: "Generator expression in a function call is consumed once",
    tag: "caveats",
    code: `# Generator expression passed as argument is lazy
gen = (x*x for x in range(5))

# First call consumes it
print(sum(gen))   # 30

# Second call: generator is exhausted
print(sum(gen))   # 0  -- NOT 30!

# Safe: pass a list or re-create the generator
squares = [x*x for x in range(5)]
print(sum(squares))   # 30
print(sum(squares))   # 30  -- still works

# Also: generators in tuples look like they're evaluated twice
tup = (x for x in range(3))
print(tuple(tup))   # (0, 1, 2)
print(tuple(tup))   # ()  -- exhausted`,
    explanation: "A generator expression creates a one-shot iterator; once all elements have been yielded, subsequent iterations produce nothing. If a function needs to iterate the generator twice, materialise it with list() first.",
  },
  {
    id: "py-snippet-copy-module",
    language: "python",
    title: "copy.copy vs copy.deepcopy for cloning objects",
    tag: "snippet",
    code: `import copy

class Node:
    def __init__(self, val, children=None):
        self.val = val
        self.children = children or []

# Build a tree: root -> [a, b]
root = Node(1, [Node(2), Node(3)])

# Shallow copy: same children list
shallow = copy.copy(root)
shallow.children.append(Node(99))
print(len(root.children))   # 3  -- affected!

# Deep copy: independent tree
root2 = Node(1, [Node(2), Node(3)])
deep = copy.deepcopy(root2)
deep.children.append(Node(99))
print(len(root2.children))  # 2  -- unaffected

# __copy__ / __deepcopy__ can customise copy behaviour`,
    explanation: "copy.copy calls __copy__ and creates a new top-level object with the same attribute values (shared inner objects). copy.deepcopy recursively copies every nested object. Override __copy__/__deepcopy__ for custom copy semantics.",
  },
  {
    id: "py-structures-read-only-view",
    language: "python",
    title: "types.MappingProxyType creates a read-only view of a dict",
    tag: "structures",
    code: `from types import MappingProxyType

d = {'host': 'localhost', 'port': 8080}
proxy = MappingProxyType(d)

# Reading works
print(proxy['host'])       # localhost
print(dict(proxy))         # {'host': 'localhost', 'port': 8080}

# Writing raises TypeError
try:
    proxy['host'] = 'example.com'
except TypeError as e:
    print(e)   # 'mappingproxy' object does not support item assignment

# Mutations to the underlying dict ARE reflected
d['debug'] = True
print(proxy.get('debug'))   # True`,
    explanation: "MappingProxyType wraps a dict in a read-only view; attempts to modify it raise TypeError. The proxy reflects changes to the underlying dict. Python uses it internally for class.__dict__ to prevent accidental class attribute mutation.",
  },
];
