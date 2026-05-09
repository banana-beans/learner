import type { Snippet } from "./types";

export const pythonSnippets20260509B3P3: Snippet[] = [
  {
    id: "py-snippet-argparse-basic",
    language: "python",
    title: "argparse builds CLI argument parsers with help text",
    tag: "snippet",
    code: `import argparse

parser = argparse.ArgumentParser(description='Process files')
parser.add_argument('input',           help='input file path')
parser.add_argument('-o', '--output',  default='out.txt',
                    help='output file path')
parser.add_argument('-n', '--count',   type=int, default=10,
                    help='number of lines')
parser.add_argument('--verbose',       action='store_true')

# args = parser.parse_args()           # reads sys.argv
args = parser.parse_args(['data.txt', '--count', '5', '--verbose'])
print(args.input)    # data.txt
print(args.count)    # 5
print(args.verbose)  # True`,
    explanation: "argparse automatically generates --help output, type-converts arguments, and handles defaults. Positional arguments are required; options start with - or --. action='store_true' makes a flag that sets a boolean.",
  },
  {
    id: "py-snippet-os-environ",
    language: "python",
    title: "os.environ for reading and setting environment variables",
    tag: "snippet",
    code: `import os

# Read (KeyError if missing)
# db_url = os.environ['DATABASE_URL']

# Safe read with default
db_url = os.environ.get('DATABASE_URL', 'sqlite:///dev.db')
print(db_url)

# Set (affects only current process)
os.environ['MY_VAR'] = 'hello'
print(os.environ.get('MY_VAR'))   # hello

# Unset
os.environ.pop('MY_VAR', None)

# All variables
for key, value in os.environ.items():
    if 'PATH' in key:
        print(f'{key}={value[:40]}...')
        break`,
    explanation: "os.environ is a dict-like mapping of environment variables; changes affect only the current process and its children. Use .get() with a default instead of direct access to avoid KeyError on missing variables.",
  },
  {
    id: "py-snippet-configparser",
    language: "python",
    title: "configparser reads and writes INI-style configuration files",
    tag: "snippet",
    code: `import configparser, io

config = configparser.ConfigParser()

# Parse an INI string
config.read_string("""
[server]
host = localhost
port = 8080
debug = true

[database]
url = sqlite:///app.db
pool_size = 5
""")

print(config['server']['host'])      # localhost
print(config.getint('server', 'port'))       # 8080
print(config.getboolean('server', 'debug'))  # True
print(config['database'].get('url'))  # sqlite:///app.db

# Write back
out = io.StringIO()
config.write(out)
print(out.getvalue()[:50])`,
    explanation: "configparser parses INI-format config files with sections and key=value pairs; getint/getfloat/getboolean convert types automatically. It supports fallback values and interpolation of values referencing other keys.",
  },
  {
    id: "py-snippet-sqlite3-context",
    language: "python",
    title: "sqlite3: embedded SQL database with context manager",
    tag: "snippet",
    code: `import sqlite3

# Connection as context manager commits on exit (or rolls back on exception)
with sqlite3.connect(':memory:') as conn:
    conn.execute('''CREATE TABLE users
                    (id INTEGER PRIMARY KEY, name TEXT, age INTEGER)''')
    conn.executemany('INSERT INTO users VALUES (?, ?, ?)',
                     [(1, 'Alice', 30), (2, 'Bob', 25)])
    conn.commit()

    cursor = conn.execute('SELECT name, age FROM users WHERE age > ?', (20,))
    for row in cursor:
        print(row)   # ('Alice', 30) / ('Bob', 25)

    # Dict-like rows
    conn.row_factory = sqlite3.Row`,
    explanation: "sqlite3 is built into Python; using the connection as a context manager provides automatic commit/rollback. Parameterised queries (? placeholders) prevent SQL injection. row_factory=sqlite3.Row gives column access by name.",
  },
  {
    id: "py-snippet-zipfile-read",
    language: "python",
    title: "zipfile reads and writes ZIP archives without external tools",
    tag: "snippet",
    code: `import zipfile, io

# Create a ZIP in memory
buf = io.BytesIO()
with zipfile.ZipFile(buf, 'w', compression=zipfile.ZIP_DEFLATED) as zf:
    zf.writestr('hello.txt', 'Hello, World!')
    zf.writestr('data/config.json', '{"key": "value"}')

# Read back
buf.seek(0)
with zipfile.ZipFile(buf, 'r') as zf:
    print(zf.namelist())   # ['hello.txt', 'data/config.json']
    content = zf.read('hello.txt').decode()
    print(content)          # Hello, World!
    # Extract all: zf.extractall('/tmp/output')`,
    explanation: "zipfile reads and writes ZIP archives; writestr adds a file from a string/bytes without touching the filesystem. ZIP_DEFLATED compresses the entries. Use ZipFile.extractall() to expand the archive to disk.",
  },
  {
    id: "py-understanding-gc-cycles",
    language: "python",
    title: "gc.disable() speeds up allocation-heavy code with no cycles",
    tag: "understanding",
    code: `import gc

# Cyclic garbage collector runs periodically and can pause code
# If you know your code creates no reference cycles, disable it

gc.disable()   # turn off cyclic GC

# ... allocation-heavy computation with no cycles ...
data = [dict(i=i) for i in range(100_000)]
# Process data
del data

gc.enable()    # re-enable
gc.collect()   # manual collection to clean up any cycles

# Check GC stats
print(gc.get_count())   # (young, middle, old) generation counts
print(gc.get_threshold())   # (700, 10, 10) default thresholds`,
    explanation: "CPython's cyclic GC runs when the young generation count exceeds gc.get_threshold()[0]; disabling it during allocation-heavy loops avoids GC pauses. Always re-enable and call gc.collect() afterward to free any cycles.",
  },
  {
    id: "py-understanding-traceback",
    language: "python",
    title: "traceback module captures and formats exception details",
    tag: "understanding",
    code: `import traceback, sys

def risky():
    raise ValueError('something went wrong')

def safe_call():
    try:
        risky()
    except Exception:
        # Format the current exception as a string
        tb_str = traceback.format_exc()
        print('Caught:', tb_str[:80])

        # Get structured info
        exc_type, exc_val, exc_tb = sys.exc_info()
        frames = traceback.extract_tb(exc_tb)
        for frame in frames:
            print(f'{frame.filename}:{frame.lineno} in {frame.name}')

safe_call()`,
    explanation: "The traceback module lets you inspect, format, and log exception info programmatically. format_exc() is a one-liner for the current exception's traceback string; extract_tb gives a list of FrameSummary objects for programmatic analysis.",
  },
  {
    id: "py-understanding-frame-object",
    language: "python",
    title: "sys._getframe() introspects the current call stack",
    tag: "understanding",
    code: `import sys

def get_caller_name(depth=1):
    frame = sys._getframe(depth)
    return frame.f_code.co_name

def foo():
    print(get_caller_name(2))   # prints 'bar' (caller of foo)

def bar():
    foo()

bar()   # bar

# Frame attributes
frame = sys._getframe(0)
print(frame.f_code.co_filename)  # current file
print(frame.f_lineno)            # current line
print(frame.f_locals)            # local variables dict`,
    explanation: "sys._getframe(n) returns the frame n levels up the call stack; it's used by logging, debugging, and magic functions that need to know who called them. Avoid in production code — it's slow and ties your code to CPython.",
  },
  {
    id: "py-structures-bloom-filter",
    language: "python",
    title: "Bloom filter: probabilistic set membership with no false negatives",
    tag: "structures",
    code: `import math, hashlib

class BloomFilter:
    def __init__(self, capacity: int, error_rate: float = 0.01):
        self.size = math.ceil(-(capacity * math.log(error_rate)) / (math.log(2) ** 2))
        self.k = max(1, round((self.size / capacity) * math.log(2)))
        self._bits = bytearray(math.ceil(self.size / 8))

    def _hashes(self, item: str):
        for i in range(self.k):
            h = int(hashlib.md5(f'{i}{item}'.encode()).hexdigest(), 16)
            yield h % self.size

    def add(self, item: str) -> None:
        for h in self._hashes(item):
            self._bits[h // 8] |= (1 << (h % 8))

    def __contains__(self, item: str) -> bool:
        return all(self._bits[h // 8] & (1 << (h % 8)) for h in self._hashes(item))

bf = BloomFilter(1000)
bf.add('alice')
print('alice' in bf)   # True
print('bob' in bf)     # False (probably)`,
    explanation: "A Bloom filter uses k hash functions and a bit array; adding sets k bits, membership tests whether all k bits are set. False positives are possible (tuned by error_rate); false negatives are impossible. Space is O(n log(1/p)).",
  },
  {
    id: "py-structures-lru-functools",
    language: "python",
    title: "functools.lru_cache memoises function results with LRU eviction",
    tag: "structures",
    code: `from functools import lru_cache
import time

@lru_cache(maxsize=128)
def fibonacci(n: int) -> int:
    if n < 2:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

start = time.perf_counter()
print(fibonacci(35))   # 9227465
print(f'{time.perf_counter()-start:.4f}s')  # ~0.0001s

# Cache info
print(fibonacci.cache_info())
# CacheInfo(hits=33, misses=36, maxsize=128, currsize=36)

# Clear the cache
fibonacci.cache_clear()`,
    explanation: "lru_cache wraps a function and caches its return values keyed by arguments; when full (maxsize), it evicts the least recently used entry. Arguments must be hashable. cache_info() reports hit/miss stats.",
  },
  {
    id: "py-caveats-recursion-memoize",
    language: "python",
    title: "Memoisation converts exponential recursion to linear",
    tag: "caveats",
    code: `# Without memoisation: O(2^n) calls
def fib_slow(n):
    if n < 2: return n
    return fib_slow(n-1) + fib_slow(n-2)

# With manual memo dict: O(n)
def fib_memo(n, memo={}):
    if n in memo: return memo[n]
    if n < 2: return n
    memo[n] = fib_memo(n-1, memo) + fib_memo(n-2, memo)
    return memo[n]

# WARNING: mutable default memo dict is shared across ALL calls
# Better: use @lru_cache or pass memo as a kwarg with default {}
from functools import lru_cache

@lru_cache(None)
def fib(n):
    return n if n < 2 else fib(n-1) + fib(n-2)

print(fib(50))   # 12586269025`,
    explanation: "The classic Fibonacci recurrence has 2^n calls without memoisation; caching each result reduces it to O(n) unique calls. Using a mutable default dict as a memo is a Python anti-pattern; prefer @lru_cache(None) for unbounded memoisation.",
  },
  {
    id: "py-caveats-multiprocessing-pickle",
    language: "python",
    title: "multiprocessing requires picklable objects for inter-process passing",
    tag: "caveats",
    code: `from multiprocessing import Pool

def square(x):
    return x * x

# Works: module-level function is picklable
with Pool(4) as p:
    results = p.map(square, range(10))
print(results)

# Fails: lambda is NOT picklable
# p.map(lambda x: x*x, range(10))  # PicklingError!

# Fails: local function may not pickle on some platforms
# def local(): pass
# p.apply(local)

# Fix: use a module-level function or functools.partial
from functools import partial
cube = partial(pow, exp=3)`,
    explanation: "multiprocessing sends data between processes via pickle; lambdas, closures, and non-top-level functions often can't be pickled. Define worker functions at module level or use functools.partial for configurable workers.",
  },
  {
    id: "py-caveats-thread-daemon",
    language: "python",
    title: "Daemon threads are killed abruptly when the main thread exits",
    tag: "caveats",
    code: `import threading, time

def background():
    while True:
        print('background tick')
        time.sleep(0.5)

# Daemon: killed when main thread exits (no cleanup!)
t = threading.Thread(target=background, daemon=True)
t.start()

# Non-daemon (default): program waits for thread to finish
# t2 = threading.Thread(target=background)
# t2.start()
# Main program would never exit because background() loops forever!

time.sleep(1)
print('main exits')
# Background thread is killed here (daemon=True)`,
    explanation: "Daemon threads run in the background and are terminated when all non-daemon threads finish; they don't prevent program exit. Use daemon=True for monitoring/logging threads. Non-daemon threads must complete before the process exits.",
  },
  {
    id: "py-types-classvar",
    language: "python",
    title: "ClassVar annotation marks a class-level (not instance) variable",
    tag: "types",
    code: `from typing import ClassVar
from dataclasses import dataclass

@dataclass
class Registry:
    name: str
    _instances: ClassVar[list['Registry']] = []   # shared, not per-instance

    def __post_init__(self):
        Registry._instances.append(self)

    @classmethod
    def all(cls) -> list['Registry']:
        return cls._instances

Registry('alice')
Registry('bob')
print([r.name for r in Registry.all()])   # ['alice', 'bob']

# Type checkers reject:
# r = Registry('x')
# r._instances = []   # ClassVar can't be set on instances`,
    explanation: "ClassVar[T] tells type checkers that this variable belongs to the class, not instances; dataclasses exclude ClassVar fields from __init__, __repr__, and comparison. Assigning a ClassVar through an instance is a type error.",
  },
  {
    id: "py-types-typedalias",
    language: "python",
    title: "TypeAlias makes type alias intent explicit (PEP 613)",
    tag: "types",
    code: `from typing import TypeAlias

# Without TypeAlias: type checkers may treat this as a variable assignment
# Vector = list[float]  # ambiguous

# With TypeAlias: clearly a type definition, not a value
Vector: TypeAlias = list[float]
Matrix: TypeAlias = list[Vector]

def dot(a: Vector, b: Vector) -> float:
    return sum(x * y for x, y in zip(a, b))

v1: Vector = [1.0, 2.0, 3.0]
v2: Vector = [4.0, 5.0, 6.0]
print(dot(v1, v2))   # 32.0

# Python 3.12+: use 'type' statement instead
# type Vector = list[float]`,
    explanation: "TypeAlias explicitly marks an assignment as a type alias rather than a runtime variable; type checkers use this to provide better error messages and avoid treating the alias as a variable of type 'type'. Python 3.12 introduces the 'type' statement as a cleaner replacement.",
  },
  {
    id: "py-types-guard",
    language: "python",
    title: "TypeGuard narrows a type inside a conditional block",
    tag: "types",
    code: `from typing import TypeGuard

def is_str_list(val: list[object]) -> TypeGuard[list[str]]:
    return all(isinstance(x, str) for x in val)

def process(items: list[object]) -> None:
    if is_str_list(items):
        # type checker knows items: list[str] here
        print(items[0].upper())   # no error

process(['hello', 'world'])   # HELLO

# Without TypeGuard, type checker sees list[object] inside the if block
# and flags .upper() as an error

# isinstance narrows automatically; TypeGuard is for custom predicates`,
    explanation: "TypeGuard[T] declares that if a predicate function returns True, the argument's type is narrowed to T in the enclosing scope. It extends the built-in isinstance/issubclass narrowing to arbitrary predicate functions.",
  },
  {
    id: "py-understanding-pattern-matching",
    language: "python",
    title: "Structural pattern matching (match/case) for data dispatch",
    tag: "understanding",
    code: `def process(event: dict) -> str:
    match event:
        case {'type': 'click', 'x': x, 'y': y}:
            return f'click at ({x}, {y})'
        case {'type': 'key', 'key': str(k)} if k.isalpha():
            return f'letter key: {k}'
        case {'type': 'resize', 'width': w, 'height': h}:
            return f'resize to {w}x{h}'
        case _:
            return 'unknown event'

print(process({'type': 'click', 'x': 10, 'y': 20}))  # click at (10, 20)
print(process({'type': 'key',   'key': 'q'}))          # letter key: q`,
    explanation: "match/case (Python 3.10+) matches structure, not just values; dictionary patterns match subsets of keys, variable patterns bind extracted values, and guards (if) add extra conditions. It's exhaustive by default with the _ wildcard.",
  },
  {
    id: "py-understanding-exception-chaining",
    language: "python",
    title: "raise X from Y sets __cause__ for explicit exception chaining",
    tag: "understanding",
    code: `class DatabaseError(Exception): pass

def connect(url: str):
    try:
        raise ConnectionRefusedError('refused')
    except ConnectionRefusedError as e:
        # Explicit chaining: e is stored in new_exc.__cause__
        raise DatabaseError('could not connect') from e

try:
    connect('postgres://localhost')
except DatabaseError as e:
    print(e)           # could not connect
    print(e.__cause__) # refused

# 'raise X from None' suppresses the implicit chain
try:
    raise ValueError('low-level')
except ValueError:
    raise RuntimeError('high-level') from None`,
    explanation: "'raise X from Y' chains exceptions explicitly; __cause__ holds Y and Python displays both in the traceback. 'raise X from None' suppresses the implicit context (__context__) shown when re-raising from an except block.",
  },
  {
    id: "py-understanding-with-statement",
    language: "python",
    title: "__enter__ and __exit__ implement the context manager protocol",
    tag: "understanding",
    code: `class Timer:
    import time

    def __enter__(self):
        self._start = self.time.perf_counter()
        return self   # value bound to 'as' target

    def __exit__(self, exc_type, exc_val, exc_tb):
        elapsed = self.time.perf_counter() - self._start
        print(f'elapsed: {elapsed:.4f}s')
        # Return True to suppress the exception; False/None to propagate
        return False

with Timer() as t:
    result = sum(range(1_000_000))

print(result)   # 499999500000

# contextlib.contextmanager converts a generator into a context manager
from contextlib import contextmanager

@contextmanager
def managed():
    print('enter')
    yield 42
    print('exit')`,
    explanation: "__enter__ sets up the context and returns the 'as' value; __exit__ tears down and receives exception info. Returning True suppresses the exception. @contextmanager allows writing context managers as generators with a single yield.",
  },
  {
    id: "py-structures-mmap",
    language: "python",
    title: "mmap maps a file into memory for random-access I/O",
    tag: "structures",
    code: `import mmap, os

# Create a file
with open('/tmp/test.bin', 'wb') as f:
    f.write(b'Hello, mmap world!')

# Memory-map the file for reading
with open('/tmp/test.bin', 'r+b') as f:
    mm = mmap.mmap(f.fileno(), 0)   # 0 = map entire file

    # Read like bytes
    print(mm[0:5])          # b'Hello'

    # Seek and read
    mm.seek(7)
    print(mm.read(4))       # b'mmap'

    # Modify in place (writes back to file)
    mm[0:5] = b'Howdy'
    mm.close()

os.unlink('/tmp/test.bin')`,
    explanation: "mmap maps a file's bytes into virtual memory; reads and writes go directly to the file without buffering. It's ideal for large files accessed randomly (binary databases, log files) because the OS pages in only the accessed regions.",
  },
];
