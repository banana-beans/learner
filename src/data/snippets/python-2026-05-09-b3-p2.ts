import type { Snippet } from "./types";

export const pythonSnippets20260509B3P2: Snippet[] = [
  {
    id: "py-snippet-format-spec",
    language: "python",
    title: "Format specification mini-language controls number formatting",
    tag: "snippet",
    code: `pi = 3.14159265

print(f'{pi:.2f}')      # 3.14  -- 2 decimal places
print(f'{pi:10.3f}')    # '     3.142' -- width 10, 3 decimals
print(f'{pi:>10.2f}')   # '      3.14' -- right-align
print(f'{pi:0>10.2f}')  # '0000003.14' -- zero-pad

n = 1_000_000
print(f'{n:,}')         # 1,000,000
print(f'{n:_}')         # 1_000_000
print(f'{0.75:.1%}')    # 75.0%
print(f'{255:#010x}')   # 0x000000ff`,
    explanation: "The format spec after the colon follows the pattern [[fill]align][sign][#][0][width][grouping][.precision][type]. Common types: f for fixed-point, e for scientific, % for percent, x/b/o for hex/binary/octal.",
  },
  {
    id: "py-snippet-string-template",
    language: "python",
    title: "string.Template uses $var syntax safe for user input",
    tag: "snippet",
    code: `from string import Template

t = Template('Hello, $name! You have $count messages.')
print(t.substitute(name='Alice', count=5))
# Hello, Alice! You have 5 messages.

# safe_substitute: leaves unknown $vars unchanged
t2 = Template('Dear $name, your code is $code.')
print(t2.safe_substitute(name='Bob'))
# Dear Bob, your code is $code.

# Use $$ for a literal dollar sign
money = Template('Total: $$\${amount}')
print(money.substitute(amount='42.00'))   # Total: $42.00`,
    explanation: "string.Template is safer than str.format for user-supplied templates because it only substitutes explicitly named $variables and can't access arbitrary object attributes, preventing data exfiltration.",
  },
  {
    id: "py-snippet-textwrap-indent",
    language: "python",
    title: "textwrap.indent/dedent/wrap for text manipulation",
    tag: "snippet",
    code: `import textwrap

text = 'Python is a high-level programming language. It emphasises readability.'

# Wrap to a fixed width
print(textwrap.fill(text, width=40))
# Python is a high-level programming
# language. It emphasises readability.

# Add prefix to each line
indented = textwrap.indent('line one\nline two\n', prefix='  ')
print(indented)

# Remove common leading whitespace
block = '''
    def foo():
        pass
'''
print(textwrap.dedent(block).strip())
# def foo():
#     pass`,
    explanation: "textwrap.fill wraps a paragraph to a given width; indent adds a prefix to every line; dedent strips the common leading whitespace from all lines, useful for docstrings with uniform indentation.",
  },
  {
    id: "py-snippet-bisect-insort",
    language: "python",
    title: "bisect.insort maintains a sorted list without re-sorting",
    tag: "snippet",
    code: `import bisect

# bisect: find insertion point in a sorted list (O(log n))
a = [1, 3, 5, 7, 9]
pos = bisect.bisect_left(a, 5)
print(pos)   # 2 (index where 5 would be inserted to keep order)

# insort: insert and maintain sorted order (O(n) due to list shift)
bisect.insort(a, 6)
print(a)   # [1, 3, 5, 6, 7, 9]

# bisect_right returns position after existing equal elements
bisect.insort(a, 5)
print(a)   # [1, 3, 5, 5, 6, 7, 9]

print(bisect.bisect_left(a, 5))    # 2 (first 5)
print(bisect.bisect_right(a, 5))   # 4 (after last 5)`,
    explanation: "bisect uses binary search to find the correct insertion point in O(log n); insort inserts at that position maintaining sorted order. The list shift for insort is O(n), so for frequent insertions use a sorted tree structure.",
  },
  {
    id: "py-snippet-shutil-copy",
    language: "python",
    title: "shutil provides high-level file and directory operations",
    tag: "snippet",
    code: `import shutil, os

# Copy file (with metadata)
shutil.copy2('/tmp/src.txt', '/tmp/dst.txt')

# Copy directory tree
# shutil.copytree('/tmp/src_dir', '/tmp/dst_dir')

# Move (rename across filesystems too)
# shutil.move('/tmp/old.txt', '/tmp/new.txt')

# Remove directory tree
# shutil.rmtree('/tmp/old_dir')

# Disk usage
total, used, free = shutil.disk_usage('/')
print(f'Free: {free // (1024**3)} GB')

# Find executable on PATH
print(shutil.which('python3'))   # /usr/bin/python3`,
    explanation: "shutil wraps low-level OS file operations with a high-level API; copy2 preserves timestamps; copytree copies whole directory trees; move works across filesystems unlike os.rename. Always prefer shutil over manual OS calls for portability.",
  },
  {
    id: "py-snippet-tempfile-context",
    language: "python",
    title: "tempfile creates secure temporary files and directories",
    tag: "snippet",
    code: `import tempfile, os

# NamedTemporaryFile: deleted when closed (delete=True by default)
with tempfile.NamedTemporaryFile(mode='w', suffix='.txt',
                                 delete=False) as f:
    f.write('temporary data')
    name = f.name

print(os.path.exists(name))   # True (delete=False)
os.unlink(name)

# TemporaryDirectory: cleaned up when context exits
with tempfile.TemporaryDirectory() as tmpdir:
    path = os.path.join(tmpdir, 'work.txt')
    with open(path, 'w') as f:
        f.write('data')
    print(os.listdir(tmpdir))   # ['work.txt']
# tmpdir deleted here`,
    explanation: "tempfile creates files/directories in the system's temp folder with a unique name; using them as context managers ensures cleanup even on exception. delete=False lets you rename or persist the file before cleanup.",
  },
  {
    id: "py-understanding-object-model",
    language: "python",
    title: "Everything in Python is an object, including classes",
    tag: "understanding",
    code: `# Classes are instances of 'type'
print(type(int))      # <class 'type'>
print(type(str))      # <class 'type'>
print(type(type))     # <class 'type'>  -- type is its own metaclass

# Functions are objects
def greet(): pass
print(type(greet))    # <class 'function'>
print(greet.__name__) # greet

# Integers are objects
print(type(42))       # <class 'int'>
print((42).__class__) # <class 'int'>

# Everything has __class__, __dict__ (unless __slots__), id
print(id(42))         # memory address (integer)`,
    explanation: "In Python, classes, functions, modules, and primitives are all first-class objects with a type, identity (id), and (usually) a __dict__. Classes themselves are instances of their metaclass (by default, type).",
  },
  {
    id: "py-understanding-name-mangling",
    language: "python",
    title: "Double-underscore prefix mangles names to avoid subclass conflicts",
    tag: "understanding",
    code: `class Base:
    def __init__(self):
        self.__secret = 'base secret'   # mangled to _Base__secret
        self._protected = 'protected'   # single _ is convention only

    def reveal(self):
        return self.__secret   # works inside Base

class Child(Base):
    def __init__(self):
        super().__init__()
        self.__secret = 'child secret'  # mangled to _Child__secret

b = Base()
c = Child()
print(b._Base__secret)   # base secret
print(c._Child__secret)  # child secret -- separate attribute
print(b.reveal())        # base secret  -- still accesses base's`,
    explanation: "Names with two leading underscores (but not two trailing) are textually replaced with _ClassName__name at compile time. This prevents accidental override in subclasses but is not true privacy — the mangled name is accessible.",
  },
  {
    id: "py-understanding-getattr-setattr",
    language: "python",
    title: "getattr/setattr/hasattr/delattr are the dynamic attribute API",
    tag: "understanding",
    code: `class Config:
    debug = False
    host  = 'localhost'
    port  = 8080

cfg = Config()

# getattr with default avoids AttributeError
print(getattr(cfg, 'host'))           # localhost
print(getattr(cfg, 'timeout', 30))   # 30 (default)

# setattr: set attribute by name
setattr(cfg, 'debug', True)
print(cfg.debug)   # True

# hasattr: check existence
print(hasattr(cfg, 'host'))      # True
print(hasattr(cfg, 'missing'))   # False

# delattr: delete attribute
delattr(cfg, 'debug')
print(hasattr(cfg, 'debug'))     # False`,
    explanation: "The builtin getattr/setattr/hasattr/delattr functions access attributes by string name, enabling dynamic dispatch, configuration loading, and generic serialisation without hard-coded attribute names.",
  },
  {
    id: "py-structures-bit-manipulation",
    language: "python",
    title: "Bitwise operations for flags and bit fields",
    tag: "structures",
    code: `# Bitwise operators: & AND, | OR, ^ XOR, ~ NOT, << shift left, >> shift right
flags = 0b1010   # bits 3 and 1 set

# Test a bit
BIT1 = 1 << 1   # 0b0010
print(bool(flags & BIT1))   # True

# Set a bit
flags |= (1 << 0)   # set bit 0
print(bin(flags))   # 0b1011

# Clear a bit
flags &= ~(1 << 1)  # clear bit 1
print(bin(flags))   # 0b1001

# Toggle a bit
flags ^= (1 << 3)   # toggle bit 3
print(bin(flags))   # 0b0001

# Count set bits (popcount)
print(bin(0b10110101).count('1'))   # 5`,
    explanation: "Bitwise operations on integers provide compact flag storage and bit-field manipulation. Common patterns: test with &, set with |, clear with & ~mask, toggle with ^. Python integers have arbitrary precision so bit shifting never overflows.",
  },
  {
    id: "py-structures-circular-buffer",
    language: "python",
    title: "Circular buffer (ring buffer) with deque(maxlen=N)",
    tag: "structures",
    code: `from collections import deque

class CircularBuffer:
    def __init__(self, capacity: int):
        self._buf = deque(maxlen=capacity)

    def push(self, item) -> None:
        self._buf.append(item)   # auto-evicts oldest when full

    def __iter__(self):
        return iter(self._buf)

    def __len__(self) -> int:
        return len(self._buf)

buf = CircularBuffer(4)
for i in range(7):
    buf.push(i)

print(list(buf))   # [3, 4, 5, 6]  -- last 4 items`,
    explanation: "deque(maxlen=N) is a fixed-size circular buffer: when full, appending an element automatically evicts the oldest from the other end in O(1). It's the simplest Python implementation of a ring buffer.",
  },
  {
    id: "py-caveats-dict-key-mutation",
    language: "python",
    title: "Never modify a dict's keys while iterating over it",
    tag: "caveats",
    code: `d = {'a': 1, 'b': 2, 'c': 3}

# BAD: RuntimeError -- dictionary changed size during iteration
# for k in d:
#     if k == 'b':
#         del d[k]

# GOOD: iterate over a copy of the keys
for k in list(d.keys()):
    if k == 'b':
        del d[k]
print(d)   # {'a': 1, 'c': 3}

# Also safe: dict comprehension creates a new dict
d2 = {k: v for k, v in d.items() if k != 'a'}
print(d2)  # {'c': 3}`,
    explanation: "Mutating a dict's key set during iteration raises RuntimeError; iterate over list(d.keys()) or list(d.items()) to create a snapshot first. Alternatively, build a new dict with a comprehension.",
  },
  {
    id: "py-caveats-float-comparison",
    language: "python",
    title: "Never compare floats with ==; use math.isclose instead",
    tag: "caveats",
    code: `# Floating-point representation error
print(0.1 + 0.2)          # 0.30000000000000004
print(0.1 + 0.2 == 0.3)  # False!

import math
print(math.isclose(0.1 + 0.2, 0.3))                 # True
print(math.isclose(0.1 + 0.2, 0.3, rel_tol=1e-9))  # True

# For zero comparison use absolute tolerance
print(math.isclose(0.0, 1e-20, abs_tol=1e-15))  # True

# numpy has allclose for arrays
import numpy as np
print(np.isclose(0.1 + 0.2, 0.3))   # True`,
    explanation: "Floats cannot represent most decimal fractions exactly in binary; even simple arithmetic introduces errors. math.isclose checks whether two values differ by at most rel_tol × larger_value (plus an optional abs_tol for near-zero comparisons).",
  },
  {
    id: "py-types-runtime-checkable",
    language: "python",
    title: "@runtime_checkable lets isinstance work with Protocols",
    tag: "types",
    code: `from typing import Protocol, runtime_checkable

@runtime_checkable
class Drawable(Protocol):
    def draw(self) -> None: ...

class Circle:
    def draw(self) -> None:
        print('drawing circle')

class Square:
    def draw(self) -> None:
        print('drawing square')

class NotDrawable:
    pass

c = Circle()
print(isinstance(c, Drawable))          # True
print(isinstance(NotDrawable(), Drawable))  # False

# Only checks method presence, not signatures
class Fake:
    draw = 'not a method'   # still passes isinstance check!`,
    explanation: "@runtime_checkable allows isinstance() to check whether an object has the required methods of a Protocol; it only checks for method existence (not signatures), so it's a structural duck-type check at runtime.",
  },
  {
    id: "py-types-annotated",
    language: "python",
    title: "Annotated attaches metadata to a type hint",
    tag: "types",
    code: `from typing import Annotated
from dataclasses import dataclass

# Annotated[type, metadata1, metadata2, ...]
# Extra metadata is ignored by type checkers but available at runtime
Positive = Annotated[int, 'must be > 0']
Email = Annotated[str, 'must contain @']

@dataclass
class User:
    age:   Positive
    email: Email

# Runtime inspection
import typing
hints = typing.get_type_hints(User, include_extras=True)
print(hints['age'])    # Annotated[int, 'must be > 0']
print(typing.get_args(hints['age']))   # (int, 'must be > 0')`,
    explanation: "Annotated[T, metadata] carries extra information alongside a type; the first argument is the actual type, the rest are arbitrary metadata. Frameworks like Pydantic and FastAPI use this for validation rules and documentation.",
  },
  {
    id: "py-snippet-glob-pattern",
    language: "python",
    title: "glob.glob matches files with shell-style wildcards",
    tag: "snippet",
    code: `import glob, os

# * matches any characters (not including /)
py_files = glob.glob('/tmp/*.txt')
print(py_files)   # ['/tmp/a.txt', '/tmp/b.txt', ...]

# ** with recursive=True matches any depth
all_py = glob.glob('/home/**/*.py', recursive=True)

# ? matches exactly one character
short = glob.glob('/tmp/??.log')   # files with 2-char names

# [abc] matches character class
log_files = glob.glob('/tmp/[abc]*.log')

# Prefer pathlib for modern code
from pathlib import Path
for f in Path('/tmp').glob('*.txt'):
    print(f.name)`,
    explanation: "glob.glob expands shell-style wildcards: * matches anything within a single path component, ** matches multiple components (with recursive=True), and ? matches any single character. Path.glob() is the modern equivalent.",
  },
  {
    id: "py-structures-graph-adj-list",
    language: "python",
    title: "Graph as adjacency list with defaultdict",
    tag: "structures",
    code: `from collections import defaultdict, deque

class Graph:
    def __init__(self):
        self.adj = defaultdict(list)

    def add_edge(self, u, v):
        self.adj[u].append(v)
        self.adj[v].append(u)   # undirected

    def bfs(self, start):
        visited = {start}
        queue = deque([start])
        order = []
        while queue:
            node = queue.popleft()
            order.append(node)
            for nb in self.adj[node]:
                if nb not in visited:
                    visited.add(nb)
                    queue.append(nb)
        return order

g = Graph()
for u, v in [(1,2), (1,3), (2,4), (3,4)]:
    g.add_edge(u, v)
print(g.bfs(1))   # [1, 2, 3, 4]`,
    explanation: "An adjacency list (defaultdict of lists) stores graphs compactly for sparse graphs; lookup of neighbors is O(degree). BFS uses a deque for O(1) popleft; the visited set ensures each node is processed once.",
  },
  {
    id: "py-caveats-list-copy-pitfall",
    language: "python",
    title: "list[:] and list.copy() are shallow — nested objects are shared",
    tag: "caveats",
    code: `import copy

original = [[1, 2], [3, 4], [5, 6]]

# Shallow copy: new outer list, shared inner lists
shallow1 = original[:]
shallow2 = original.copy()
shallow3 = list(original)

shallow1[0].append(99)
print(original[0])   # [1, 2, 99]  -- affected!

# Deep copy: fully independent
deep = copy.deepcopy(original)
deep[1].append(99)
print(original[1])   # [3, 4]  -- unaffected`,
    explanation: "List slicing, .copy(), and list() all perform shallow copies: the new list holds references to the same inner objects. For nested mutable structures, always use copy.deepcopy() when you need independence.",
  },
  {
    id: "py-types-concatenate",
    language: "python",
    title: "Concatenate adds arguments to a ParamSpec callable type",
    tag: "types",
    code: `from typing import Callable, Concatenate, ParamSpec, TypeVar

P = ParamSpec('P')
T = TypeVar('T')

# Decorator that prepends a 'user' argument to any function
def with_user(fn: Callable[Concatenate[str, P], T]
              ) -> Callable[P, T]:
    def wrapper(*args: P.args, **kwargs: P.kwargs) -> T:
        user = 'default_user'
        return fn(user, *args, **kwargs)
    return wrapper

@with_user
def greet(user: str, name: str) -> str:
    return f'{user} greets {name}'

print(greet('Alice'))   # default_user greets Alice`,
    explanation: "Concatenate[X, P] prepends a specific argument type to a ParamSpec; it's used to type decorators that inject an extra leading argument into the wrapped function's signature.",
  },
  {
    id: "py-snippet-random-choice",
    language: "python",
    title: "random module: choice, sample, shuffle, and randint",
    tag: "snippet",
    code: `import random

items = ['apple', 'banana', 'cherry', 'date']

# Pick one uniformly at random
print(random.choice(items))

# Pick k distinct items without replacement
print(random.sample(items, k=2))

# Shuffle in place
random.shuffle(items)
print(items)

# Random integer in [a, b] inclusive
print(random.randint(1, 6))   # dice roll

# Seed for reproducibility in tests
random.seed(42)
print(random.choice(['a', 'b', 'c']))   # always the same`,
    explanation: "random.choice picks one element; sample picks k distinct elements (no replacement); shuffle rearranges in place. Set random.seed() in tests for deterministic results. For cryptographic randomness, use the secrets module.",
  },
  {
    id: "py-snippet-secrets-token",
    language: "python",
    title: "secrets module for cryptographically secure random values",
    tag: "snippet",
    code: `import secrets

# Secure random bytes (for tokens, salts)
token_bytes = secrets.token_bytes(32)
print(len(token_bytes))   # 32

# URL-safe base64-encoded token
token_url = secrets.token_urlsafe(32)
print(token_url)   # e.g. 'Xb3K-m9...' (43 chars)

# Hex string
token_hex = secrets.token_hex(16)
print(len(token_hex))   # 32 hex chars = 16 bytes

# Secure choice (for generating passwords etc.)
alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789'
password = ''.join(secrets.choice(alphabet) for _ in range(16))
print(password)`,
    explanation: "The secrets module uses the OS CSPRNG (os.urandom); use it for tokens, API keys, passwords, and salts. Never use the random module for security-sensitive values — it's not cryptographically secure.",
  },
  {
    id: "py-snippet-uuid-generate",
    language: "python",
    title: "uuid.uuid4 generates a random universally unique identifier",
    tag: "snippet",
    code: `import uuid

# UUID4: random (most common)
u = uuid.uuid4()
print(u)           # e.g. '110e8400-e29b-41d4-a716-446655440000'
print(str(u))      # same as above
print(u.hex)       # 32 hex chars without dashes
print(u.int)       # 128-bit integer
print(u.version)   # 4

# UUID5: deterministic, namespace + name
ns_url = uuid.NAMESPACE_URL
u5 = uuid.uuid5(ns_url, 'https://example.com')
print(u5)          # always the same for the same input

# Parse a UUID string
parsed = uuid.UUID('110e8400-e29b-41d4-a716-446655440000')
print(parsed.variant)   # UUID.RFC_4122`,
    explanation: "uuid4() generates a random 128-bit UUID with 122 bits of randomness; collision probability is negligible. uuid5() deterministically derives a UUID from a namespace + name, useful for reproducible identifiers.",
  },
  {
    id: "py-snippet-datetime-parse",
    language: "python",
    title: "datetime.strptime and strftime for parsing and formatting",
    tag: "snippet",
    code: `from datetime import datetime

# Parse a string into a datetime object
dt = datetime.strptime('2026-05-09 14:30:00', '%Y-%m-%d %H:%M:%S')
print(dt)           # 2026-05-09 14:30:00
print(dt.year)      # 2026
print(dt.weekday()) # 5 (Saturday, 0=Monday)

# Format a datetime into a string
print(dt.strftime('%A, %B %d %Y'))   # Saturday, May 09 2026
print(dt.isoformat())                # 2026-05-09T14:30:00

# Parse ISO format (Python 3.7+)
dt2 = datetime.fromisoformat('2026-05-09T14:30:00')
print(dt == dt2)   # True`,
    explanation: "strptime parses a string according to a format; strftime formats a datetime as a string. isoformat()/fromisoformat() handle ISO 8601 without format strings. Always use timezone-aware datetimes for stored timestamps.",
  },
];
