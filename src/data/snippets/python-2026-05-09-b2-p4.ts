import type { Snippet } from "./types";

export const pythonSnippets20260509B2P4: Snippet[] = [
  {
    id: "py-snippet-tee-iterator",
    language: "python",
    title: "itertools.tee clones an iterator into N independent ones",
    tag: "snippet",
    code: `from itertools import tee

def gen():
    for i in range(5):
        yield i

a, b = tee(gen(), 2)

print(list(a))   # [0, 1, 2, 3, 4]
print(list(b))   # [0, 1, 2, 3, 4]  -- independent copy

# WARNING: advancing one iterator far ahead buffers values in memory
# If a and b are consumed together, memory usage stays small`,
    explanation: "tee(iterable, n=2) returns n independent iterators over the same data; the original iterator should not be used after tee. Memory grows if iterators are not consumed in parallel.",
  },
  {
    id: "py-snippet-product-combinations",
    language: "python",
    title: "itertools.product, combinations, and permutations",
    tag: "snippet",
    code: `from itertools import product, combinations, permutations

# Cartesian product
print(list(product('AB', repeat=2)))
# [('A','A'),('A','B'),('B','A'),('B','B')]

# Combinations (order doesn't matter, no repetition)
print(list(combinations('ABCD', 2)))
# [('A','B'),('A','C'),('A','D'),('B','C'),('B','D'),('C','D')]

# Permutations (order matters)
print(list(permutations('ABC', 2)))
# [('A','B'),('A','C'),('B','A'),('B','C'),('C','A'),('C','B')]`,
    explanation: "product is the Cartesian product (nested loops); combinations picks r items without repetition; permutations generates all orderings. All return lazy iterators.",
  },
  {
    id: "py-snippet-chain-string",
    language: "python",
    title: "str.join is faster than += in a loop",
    tag: "snippet",
    code: `# SLOW: O(n^2) -- creates a new string on every +=
parts = []
result = ''
for i in range(1000):
    result += str(i)   # avoid this

# FAST: O(n) -- collect in a list, join once
parts = [str(i) for i in range(1000)]
result = ''.join(parts)

# With separator
csv_row = ','.join(['Alice', '30', 'Engineer'])
print(csv_row)   # Alice,30,Engineer

# join works with any iterable of strings
print(' '.join(reversed('hello'.split())))   # hello`,
    explanation: "String concatenation in a loop is O(n^2) because each += copies all existing characters; ''.join(list) builds the result in a single pass and is the canonical Python pattern.",
  },
  {
    id: "py-snippet-dict-setdefault",
    language: "python",
    title: "dict.setdefault returns or inserts a default value",
    tag: "snippet",
    code: `# Group words by first letter using setdefault
words = ['apple', 'avocado', 'banana', 'blueberry', 'cherry']
groups = {}
for w in words:
    groups.setdefault(w[0], []).append(w)

print(groups)
# {'a': ['apple', 'avocado'], 'b': ['banana', 'blueberry'], ...}

# setdefault inserts AND returns the default on first call
cache = {}
value = cache.setdefault('key', [])   # inserts []
value.append(1)
print(cache)   # {'key': [1]}`,
    explanation: "setdefault(key, default) returns the existing value if the key exists, otherwise inserts default and returns it; the returned reference lets you mutate the default in place.",
  },
  {
    id: "py-snippet-walrus-filter",
    language: "python",
    title: "Walrus operator in a comprehension filter",
    tag: "snippet",
    code: `import re

# Without walrus: compute regex match twice
texts = ['hello world', 'foo bar', 'python 3.12']
results1 = [m.group() for t in texts
            if re.search(r'\\d+', t)
            for m in [re.search(r'\\d+', t)]]  # awkward

# With walrus: compute once, use in both condition and expression
results2 = [m.group() for t in texts
            if (m := re.search(r'\\d+', t))]
print(results2)   # ['3.12']`,
    explanation: "The walrus operator (:=) assigns and tests in one step; in a comprehension filter it avoids computing the same expression twice (once to test, once to use), which matters when the expression is expensive.",
  },
  {
    id: "py-understanding-bytecode",
    language: "python",
    title: "dis.dis shows the CPython bytecode of a function",
    tag: "understanding",
    code: `import dis

def add(a, b):
    return a + b

dis.dis(add)
# LOAD_FAST  'a'
# LOAD_FAST  'b'
# BINARY_OP  +
# RETURN_VALUE

# Bytecode is executed by the CPython interpreter (not native CPU)
# PyPy JIT-compiles bytecode to machine code at runtime`,
    explanation: "dis.dis disassembles a function's bytecode; understanding bytecode helps diagnose performance issues and explains why some Python constructs are faster than others (e.g., local vs global lookups).",
  },
  {
    id: "py-understanding-descriptors-full",
    language: "python",
    title: "Data vs non-data descriptors: priority in attribute lookup",
    tag: "understanding",
    code: `class DataDesc:
    def __get__(self, obj, cls): return 'data'
    def __set__(self, obj, val): pass   # has __set__ => data descriptor

class NonDataDesc:
    def __get__(self, obj, cls): return 'non-data'
    # No __set__ => non-data descriptor

class MyClass:
    data = DataDesc()
    non_data = NonDataDesc()

obj = MyClass()
obj.__dict__['data'] = 'instance'     # shadowed? NO -- data desc wins
obj.__dict__['non_data'] = 'instance' # shadows non-data desc

print(obj.data)      # data     (data descriptor beats instance __dict__)
print(obj.non_data)  # instance (instance __dict__ beats non-data desc)`,
    explanation: "Data descriptors (defining __set__ or __delete__) take priority over instance __dict__; non-data descriptors (only __get__) are shadowed by instance attributes. property is a data descriptor.",
  },
  {
    id: "py-understanding-dunder-call",
    language: "python",
    title: "__call__ makes an instance callable like a function",
    tag: "understanding",
    code: `class Multiplier:
    def __init__(self, factor):
        self.factor = factor

    def __call__(self, x):
        return x * self.factor

triple = Multiplier(3)
print(triple(5))    # 15
print(triple(10))   # 30
print(callable(triple))   # True

# Useful for stateful callbacks
class Counter:
    def __init__(self): self.n = 0
    def __call__(self): self.n += 1; return self.n

c = Counter()
print(c(), c(), c())  # 1 2 3`,
    explanation: "__call__ turns an object into a callable; unlike a plain function, a callable object can carry state across calls, making it useful for memoisation, partial application, or stateful callbacks.",
  },
  {
    id: "py-structures-array-typecodes",
    language: "python",
    title: "array.array typecodes: 'b', 'h', 'i', 'f', 'd'",
    tag: "structures",
    code: `import array

# typecodes: b=int8, B=uint8, h=int16, H=uint16, i=int32,
#            I=uint32, l=int64, f=float32, d=float64
ints   = array.array('i', [1, 2, 3, 1000])
floats = array.array('f', [1.5, 2.5, 3.14])

print(ints.itemsize)    # 4 bytes per element
print(floats.itemsize)  # 4 bytes per element (float32)

# Convert to/from bytes
raw = ints.tobytes()
restored = array.array('i', raw)
print(list(restored))   # [1, 2, 3, 1000]`,
    explanation: "The typecode selects the C type for each element; itemsize shows bytes per element. Use 'i' for 32-bit integers, 'd' for double-precision floats. tobytes/frombytes enable efficient binary I/O.",
  },
  {
    id: "py-structures-segment-tree",
    language: "python",
    title: "Segment tree for range sum queries in O(log n)",
    tag: "structures",
    code: `class SegTree:
    def __init__(self, data):
        n = len(data)
        self.n = n
        self.tree = [0] * (2 * n)
        for i, v in enumerate(data):
            self.tree[n + i] = v
        for i in range(n - 1, 0, -1):
            self.tree[i] = self.tree[2*i] + self.tree[2*i+1]

    def update(self, i, val):
        i += self.n
        self.tree[i] = val
        while i > 1:
            i >>= 1
            self.tree[i] = self.tree[2*i] + self.tree[2*i+1]

    def query(self, l, r):   # sum [l, r)
        res, l, r = 0, l + self.n, r + self.n
        while l < r:
            if l & 1: res += self.tree[l]; l += 1
            if r & 1: r -= 1; res += self.tree[r]
            l >>= 1; r >>= 1
        return res

st = SegTree([1, 2, 3, 4, 5])
print(st.query(1, 4))   # 9 (2+3+4)
st.update(2, 10)
print(st.query(1, 4))   # 16 (2+10+4)`,
    explanation: "A segment tree stores aggregate values (sums, mins, maxes) for ranges; both point update and range query run in O(log n). The iterative version avoids recursion overhead.",
  },
  {
    id: "py-caveats-thread-lock",
    language: "python",
    title: "threading.Lock prevents race conditions",
    tag: "caveats",
    code: `import threading

counter = 0
lock = threading.Lock()

def increment():
    global counter
    for _ in range(100_000):
        # Without lock: race condition -> wrong result
        with lock:
            counter += 1

threads = [threading.Thread(target=increment) for _ in range(5)]
for t in threads: t.start()
for t in threads: t.join()

print(counter)   # 500000  (always correct with the lock)`,
    explanation: "counter += 1 is not atomic in Python (it's three bytecode operations); a threading.Lock ensures only one thread executes the critical section at a time, preventing lost updates.",
  },
  {
    id: "py-caveats-str-format-security",
    language: "python",
    title: "str.format_map with user input can leak variables",
    tag: "caveats",
    code: `# DANGEROUS: format can access arbitrary attributes
template = '{0.__class__.__name__}'
print(template.format(42))   # int  (leaked type info)

# User-supplied templates can exfiltrate data
class Secret:
    password = 's3cr3t'

s = Secret()
# If user controls template:
evil = '{0.password}'
print(evil.format(s))   # s3cr3t  -- data leak!

# Safe alternative: use string.Template with $var syntax
from string import Template
t = Template('Hello $name')
print(t.safe_substitute({'name': 'Alice'}))`,
    explanation: "str.format with user-supplied templates can access object attributes via dot notation, leaking sensitive data; string.Template.safe_substitute only allows explicit variable names and is safe with untrusted input.",
  },
  {
    id: "py-caveats-mutable-kwonly",
    language: "python",
    title: "Keyword-only arguments prevent positional misuse",
    tag: "caveats",
    code: `# Without *: easy to confuse positional args
def connect(host, port, ssl, timeout):
    pass
connect('db', 5432, True, 30)   # which is ssl, which is timeout?

# With *: force keyword arguments after *
def connect_safe(host, port, *, ssl=False, timeout=30):
    pass

# connect_safe('db', 5432, True, 30)  # TypeError!
connect_safe('db', 5432, ssl=True, timeout=30)  # clear`,
    explanation: "A bare * in the parameter list makes all following arguments keyword-only; callers must name them explicitly, preventing silent bugs from wrong positional ordering.",
  },
  {
    id: "py-types-typed-dict-inheritance",
    language: "python",
    title: "TypedDict supports inheritance to extend schemas",
    tag: "types",
    code: `from typing import TypedDict

class BaseEvent(TypedDict):
    type: str
    timestamp: float

class ClickEvent(BaseEvent):
    x: int
    y: int
    button: str

click: ClickEvent = {
    'type': 'click',
    'timestamp': 1234567890.0,
    'x': 100,
    'y': 200,
    'button': 'left',
}
print(click['type'])    # click`,
    explanation: "TypedDict inheritance extends the schema; ClickEvent has all BaseEvent keys plus its own. This lets you build a hierarchy of event types or API response shapes without code duplication.",
  },
  {
    id: "py-types-protocol-callable",
    language: "python",
    title: "Protocol with __call__ types callable objects",
    tag: "types",
    code: `from typing import Protocol

class Transformer(Protocol):
    def __call__(self, text: str) -> str: ...

def apply(transforms: list[Transformer], text: str) -> str:
    for t in transforms:
        text = t(text)
    return text

def upper(s: str) -> str: return s.upper()
def strip(s: str) -> str: return s.strip()

result = apply([upper, strip], '  hello  ')
print(result)   # HELLO`,
    explanation: "A Protocol with __call__ defines the expected signature for a callable; plain functions satisfy it structurally without inheriting, making it the type-safe way to accept 'any function with this signature'.",
  },
  {
    id: "py-families-hmac-hashlib",
    language: "python",
    title: "hashlib and hmac for hashing and message authentication",
    tag: "families",
    code: `import hashlib, hmac, os

# One-shot hash
digest = hashlib.sha256(b'hello world').hexdigest()
print(digest[:16])   # b94d27b9934d...

# Incremental hash for large data
h = hashlib.sha256()
for chunk in [b'hello ', b'world']:
    h.update(chunk)
print(h.hexdigest()[:16])   # same result

# HMAC for message authentication
key = os.urandom(32)
mac = hmac.new(key, b'payload', hashlib.sha256).hexdigest()
print(len(mac))   # 64 hex chars`,
    explanation: "hashlib provides one-way hashes (SHA-256, SHA-3); hmac adds a secret key to authenticate messages and prevent tampering. Always use hmac.compare_digest for constant-time comparison to avoid timing attacks.",
  },
  {
    id: "py-families-csv-module",
    language: "python",
    title: "csv.reader and csv.DictReader for CSV parsing",
    tag: "families",
    code: `import csv, io

data = "name,age,city\\nAlice,30,NYC\\nBob,25,LA"

# DictReader: each row is a dict
reader = csv.DictReader(io.StringIO(data))
for row in reader:
    print(row['name'], row['age'])
# Alice 30 / Bob 25

# DictWriter: write with header
output = io.StringIO()
writer = csv.DictWriter(output, fieldnames=['name', 'age'])
writer.writeheader()
writer.writerow({'name': 'Carol', 'age': 35})
print(output.getvalue())`,
    explanation: "csv.DictReader maps each row to a dict using the header row as keys, handling quoting and escaping automatically. DictWriter performs the reverse, ensuring correct CSV formatting.",
  },
  {
    id: "py-families-string-methods",
    language: "python",
    title: "str method families: split, strip, case, find, replace",
    tag: "families",
    code: `s = '  Hello, World!  '

# Whitespace
print(s.strip())            # 'Hello, World!'
print(s.lstrip().rstrip())  # same

# Case
print(s.strip().lower())    # 'hello, world!'
print(s.strip().title())    # 'Hello, World!'

# Split and join
parts = s.strip().split(', ')
print(parts)                # ['Hello', 'World!']

# Find and replace
print(s.strip().replace('World', 'Python'))  # Hello, Python!
print(s.strip().find('World'))               # 7`,
    explanation: "Python strings have a rich method API; strip/lstrip/rstrip remove whitespace, split/join partition and join, find returns the index of the first match, and replace creates a modified copy.",
  },
  {
    id: "py-classes-super-cooperative",
    language: "python",
    title: "super() without arguments works in Python 3",
    tag: "classes",
    code: `class Base:
    def greet(self):
        return 'Base'

class Middle(Base):
    def greet(self):
        base = super().greet()   # super() -- no args needed in Python 3
        return f'Middle({base})'

class Top(Middle):
    def greet(self):
        mid = super().greet()
        return f'Top({mid})'

print(Top().greet())   # Top(Middle(Base))`,
    explanation: "In Python 3, super() with no arguments uses the __class__ cell variable set by the compiler; no need to repeat the class name. It follows the MRO, so diamond inheritance works correctly.",
  },
  {
    id: "py-classes-eq-ordering",
    language: "python",
    title: "functools.total_ordering generates all comparison methods",
    tag: "classes",
    code: `from functools import total_ordering

@total_ordering
class Version:
    def __init__(self, major, minor):
        self.major = major
        self.minor = minor

    def __eq__(self, other):
        return (self.major, self.minor) == (other.major, other.minor)

    def __lt__(self, other):
        return (self.major, self.minor) < (other.major, other.minor)

v1 = Version(1, 2)
v2 = Version(2, 0)
print(v1 < v2)    # True
print(v2 > v1)    # True  (generated from __lt__ and __eq__)
print(v1 <= v1)   # True`,
    explanation: "@total_ordering generates __gt__, __ge__, __le__ from __lt__ and __eq__, so you only need to implement two comparison methods to get all six. The tradeoff is a small performance overhead per comparison.",
  },
  {
    id: "py-classes-functools-wraps",
    language: "python",
    title: "@functools.wraps preserves the wrapped function's metadata",
    tag: "classes",
    code: `import functools, time

def timer(fn):
    @functools.wraps(fn)     # copies __name__, __doc__, __annotations__
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        result = fn(*args, **kwargs)
        print(f'{fn.__name__} took {time.perf_counter()-start:.4f}s')
        return result
    return wrapper

@timer
def compute(n: int) -> int:
    """Compute the sum."""
    return sum(range(n))

print(compute.__name__)   # compute  (not 'wrapper')
print(compute.__doc__)    # Compute the sum.`,
    explanation: "@functools.wraps copies the wrapped function's __name__, __qualname__, __doc__, and __annotations__ to the wrapper; without it, introspection tools (help(), debuggers) see 'wrapper' instead of the original function.",
  },
];
