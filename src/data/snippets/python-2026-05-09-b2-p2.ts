import type { Snippet } from "./types";

export const pythonSnippets20260509B2P2: Snippet[] = [
  {
    id: "py-families-itertools-chain",
    language: "python",
    title: "itertools.chain and chain.from_iterable flatten iterables",
    tag: "families",
    code: `from itertools import chain

# chain: concatenate multiple iterables
a, b, c = [1, 2], [3, 4], [5]
print(list(chain(a, b, c)))   # [1, 2, 3, 4, 5]

# chain.from_iterable: flatten one level of nesting
nested = [[1, 2], [3, 4], [5, 6]]
print(list(chain.from_iterable(nested)))   # [1, 2, 3, 4, 5, 6]

# More efficient than sum(nested, []) which is O(n^2)`,
    explanation: "chain concatenates iterables lazily; chain.from_iterable takes a single iterable of iterables and flattens one level. Both avoid materialising intermediate lists.",
  },
  {
    id: "py-families-concurrent-futures",
    language: "python",
    title: "concurrent.futures: ThreadPoolExecutor and ProcessPoolExecutor",
    tag: "families",
    code: `from concurrent.futures import ThreadPoolExecutor, as_completed

urls = ['http://a', 'http://b', 'http://c']

def fetch(url):
    import time; time.sleep(0.1)   # simulate I/O
    return f'data from {url}'

with ThreadPoolExecutor(max_workers=3) as ex:
    futures = {ex.submit(fetch, u): u for u in urls}
    for f in as_completed(futures):
        print(f.result())`,
    explanation: "ThreadPoolExecutor is ideal for I/O-bound work; ProcessPoolExecutor for CPU-bound work. as_completed yields futures as they finish rather than in submission order.",
  },
  {
    id: "py-families-logging-levels",
    language: "python",
    title: "logging: levels, handlers, and formatters",
    tag: "families",
    code: `import logging

logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s %(levelname)s %(name)s: %(message)s'
)
log = logging.getLogger(__name__)

log.debug('low-level detail')       # only shown if DEBUG
log.info('informational')
log.warning('something unexpected')
log.error('error occurred')
log.critical('fatal error')

# Level hierarchy: DEBUG < INFO < WARNING < ERROR < CRITICAL`,
    explanation: "The logging module provides a hierarchy of loggers; setting level=DEBUG shows all messages, level=WARNING shows only WARNING and above. Use named loggers (__name__) so each module can be tuned independently.",
  },
  {
    id: "py-families-subprocess-run",
    language: "python",
    title: "subprocess.run captures output and checks exit code",
    tag: "families",
    code: `import subprocess

result = subprocess.run(
    ['ls', '-la', '/tmp'],
    capture_output=True,
    text=True,
    check=True     # raises CalledProcessError if exit != 0
)
print(result.stdout[:80])
print('exit code:', result.returncode)

# Shell command via shell=True (be careful with untrusted input)
r = subprocess.run('echo hello', shell=True, capture_output=True, text=True)
print(r.stdout)   # hello`,
    explanation: "subprocess.run is the high-level API; capture_output=True fills result.stdout and result.stderr, check=True raises CalledProcessError on non-zero exit codes. Prefer a list of args over shell=True to avoid injection.",
  },
  {
    id: "py-families-pathlib-glob",
    language: "python",
    title: "pathlib glob and rglob for file discovery",
    tag: "families",
    code: `from pathlib import Path

p = Path('/tmp')

# glob: match pattern in this directory
for f in p.glob('*.txt'):
    print(f.name)

# rglob: recursive glob (searches all subdirectories)
for py_file in Path('.').rglob('*.py'):
    print(py_file)

# Check properties
f = Path('/tmp/test.txt')
print(f.exists(), f.is_file(), f.suffix)  # True/False True/False .txt`,
    explanation: "Path.glob matches shell-style patterns in the directory; Path.rglob is equivalent to **/pattern and searches recursively. Both return lazy generators of Path objects.",
  },
  {
    id: "py-classes-init-subclass",
    language: "python",
    title: "__init_subclass__ is called when a subclass is defined",
    tag: "classes",
    code: `class PluginBase:
    _registry: dict = {}

    def __init_subclass__(cls, name: str = '', **kwargs):
        super().__init_subclass__(**kwargs)
        if name:
            PluginBase._registry[name] = cls

class AudioPlugin(PluginBase, name='audio'):
    def run(self): return 'playing audio'

class VideoPlugin(PluginBase, name='video'):
    def run(self): return 'playing video'

print(PluginBase._registry)
# {'audio': <class 'AudioPlugin'>, 'video': <class 'VideoPlugin'>}`,
    explanation: "__init_subclass__ is called on the parent class each time a subclass is defined, enabling automatic registration without metaclasses or decorators.",
  },
  {
    id: "py-classes-mixin-pattern",
    language: "python",
    title: "Mixins add reusable behaviour without full inheritance",
    tag: "classes",
    code: `class JsonMixin:
    def to_json(self):
        import json
        return json.dumps(self.__dict__)

class LogMixin:
    def log(self, msg):
        print(f'[{self.__class__.__name__}] {msg}')

class User(JsonMixin, LogMixin):
    def __init__(self, name, age):
        self.name = name
        self.age = age

u = User('Alice', 30)
print(u.to_json())   # {"name": "Alice", "age": 30}
u.log('created')     # [User] created`,
    explanation: "Mixins are small classes that provide a specific capability; they're meant to be combined via multiple inheritance rather than instantiated directly. Name them with the *Mixin suffix to signal their intent.",
  },
  {
    id: "py-classes-dataclass-post-init",
    language: "python",
    title: "__post_init__ runs after the generated __init__",
    tag: "classes",
    code: `from dataclasses import dataclass, field

@dataclass
class Rectangle:
    width: float
    height: float
    area: float = field(init=False)

    def __post_init__(self):
        if self.width <= 0 or self.height <= 0:
            raise ValueError('dimensions must be positive')
        self.area = self.width * self.height

r = Rectangle(3.0, 4.0)
print(r.area)   # 12.0
# Rectangle(-1, 4) raises ValueError`,
    explanation: "__post_init__ is called by the generated __init__ after all fields are set; use it for validation, computing derived fields (with field(init=False)), or other setup that requires all fields to be present.",
  },
  {
    id: "py-classes-classmethod-factory",
    language: "python",
    title: "@classmethod as an alternative constructor",
    tag: "classes",
    code: `from datetime import date

class Person:
    def __init__(self, name: str, birth_year: int):
        self.name = name
        self.birth_year = birth_year

    @classmethod
    def from_string(cls, s: str) -> 'Person':
        name, year = s.split(',')
        return cls(name.strip(), int(year.strip()))

    @property
    def age(self) -> int:
        return date.today().year - self.birth_year

p = Person.from_string('Alice, 1994')
print(p.name, p.age)`,
    explanation: "@classmethod receives the class as its first argument (cls); it's the idiomatic way to provide alternative constructors that know about the class hierarchy and can be overridden by subclasses.",
  },
  {
    id: "py-understanding-async-await",
    language: "python",
    title: "async/await: coroutines and the event loop",
    tag: "understanding",
    code: `import asyncio

async def fetch(url: str) -> str:
    await asyncio.sleep(0.1)   # yields control, doesn't block thread
    return f'data:{url}'

async def main():
    # Run concurrently with gather
    results = await asyncio.gather(
        fetch('a'), fetch('b'), fetch('c')
    )
    print(results)

asyncio.run(main())
# ['data:a', 'data:b', 'data:c'] -- all run concurrently`,
    explanation: "async def defines a coroutine; await suspends it and yields control to the event loop, which can run other coroutines. asyncio.gather runs multiple coroutines concurrently in a single thread.",
  },
  {
    id: "py-understanding-event-loop",
    language: "python",
    title: "The event loop is single-threaded: blocking code freezes it",
    tag: "understanding",
    code: `import asyncio, time

async def bad():
    time.sleep(1)   # BLOCKS the event loop -- no other coroutine runs!

async def good():
    await asyncio.sleep(1)   # releases control, others can run

async def show_issue():
    start = time.time()
    await asyncio.gather(bad(), bad())   # sequential despite gather!
    print(f'bad: {time.time()-start:.1f}s')  # ~2s

    start = time.time()
    await asyncio.gather(good(), good())
    print(f'good: {time.time()-start:.1f}s')  # ~1s`,
    explanation: "asyncio is cooperative; a coroutine runs until it hits an await. Blocking calls (time.sleep, CPU loops) never yield and starve all other coroutines -- always use the async equivalents.",
  },
  {
    id: "py-understanding-contextvar",
    language: "python",
    title: "contextvars.ContextVar provides per-task state in asyncio",
    tag: "understanding",
    code: `import asyncio
from contextvars import ContextVar

request_id: ContextVar[str] = ContextVar('request_id', default='none')

async def handle(req_id: str):
    token = request_id.set(req_id)
    await asyncio.sleep(0)   # simulate async work
    print(f'handling {request_id.get()}')
    request_id.reset(token)

async def main():
    await asyncio.gather(handle('req-1'), handle('req-2'))
asyncio.run(main())
# handling req-1 / handling req-2  (each task sees its own value)`,
    explanation: "ContextVar provides context-local storage; each asyncio Task inherits a copy of the context, so request IDs and user sessions don't leak between concurrent tasks.",
  },
  {
    id: "py-structures-lru-cache-custom",
    language: "python",
    title: "Manual LRU cache with OrderedDict",
    tag: "structures",
    code: `from collections import OrderedDict

class LRUCache:
    def __init__(self, capacity: int):
        self.cap = capacity
        self.cache: OrderedDict = OrderedDict()

    def get(self, key):
        if key not in self.cache:
            return -1
        self.cache.move_to_end(key)
        return self.cache[key]

    def put(self, key, value):
        self.cache[key] = value
        self.cache.move_to_end(key)
        if len(self.cache) > self.cap:
            self.cache.popitem(last=False)

lru = LRUCache(2)
lru.put(1, 'a'); lru.put(2, 'b')
print(lru.get(1))   # a (moves 1 to end)
lru.put(3, 'c')     # evicts key 2 (LRU)
print(lru.get(2))   # -1`,
    explanation: "An LRU cache evicts the least recently used item; OrderedDict.move_to_end marks recent access and popitem(last=False) removes the oldest entry efficiently.",
  },
  {
    id: "py-structures-union-find",
    language: "python",
    title: "Union-Find (Disjoint Set Union) with path compression",
    tag: "structures",
    code: `class UnionFind:
    def __init__(self, n):
        self.parent = list(range(n))
        self.rank = [0] * n

    def find(self, x):
        if self.parent[x] != x:
            self.parent[x] = self.find(self.parent[x])  # path compression
        return self.parent[x]

    def union(self, x, y):
        px, py = self.find(x), self.find(y)
        if px == py: return False
        if self.rank[px] < self.rank[py]: px, py = py, px
        self.parent[py] = px
        if self.rank[px] == self.rank[py]: self.rank[px] += 1
        return True

uf = UnionFind(5)
uf.union(0, 1); uf.union(1, 2)
print(uf.find(0) == uf.find(2))   # True`,
    explanation: "Union-Find tracks connected components with near-O(1) union and find operations; path compression flattens the tree on each find, and union by rank keeps trees shallow.",
  },
  {
    id: "py-caveats-regex-greedy",
    language: "python",
    title: "Regex quantifiers are greedy by default; add ? for lazy",
    tag: "caveats",
    code: `import re
html = '<b>bold</b> and <i>italic</i>'

# Greedy: matches as much as possible
print(re.findall(r'<.*>', html))
# ['<b>bold</b> and <i>italic</i>']  (one big match)

# Lazy: matches as little as possible
print(re.findall(r'<.*?>', html))
# ['<b>', '</b>', '<i>', '</i>']`,
    explanation: "The * and + quantifiers consume as much as they can (greedy); adding ? makes them lazy (match as little as possible). Greedy matching often surprises people when parsing HTML or nested structures.",
  },
  {
    id: "py-caveats-encode-decode",
    language: "python",
    title: "str.encode() and bytes.decode() must use the same encoding",
    tag: "caveats",
    code: `s = 'héllo'
b = s.encode('utf-8')
print(b)          # b'h\\xc3\\xa9llo'  (é is 2 bytes in UTF-8)

# Decoding with wrong codec corrupts the string
try:
    bad = b.decode('ascii')
except UnicodeDecodeError as e:
    print(e)      # 'ascii' codec can't decode byte 0xc3

# Always specify encoding explicitly
round_trip = b.decode('utf-8')
print(round_trip == s)  # True`,
    explanation: "Encoding converts str → bytes using a codec; decoding reverses it. Always encode and decode with the same codec; UTF-8 is the modern default and handles all Unicode code points.",
  },
  {
    id: "py-caveats-is-not-equal-list",
    language: "python",
    title: "x is not None vs x != None: subtle difference with NumPy",
    tag: "caveats",
    code: `import numpy as np

arr = np.array([1, 2, 3])

# == None broadcasts over the array
result = arr == None
print(result)        # [False False False]  (not a bool!)
print(bool(result))  # ValueError: ambiguous truth value

# is None / is not None always returns a single bool
print(arr is None)       # False  -- correct
print(arr is not None)   # True   -- correct`,
    explanation: "arr == None returns a NumPy array (element-wise comparison) rather than a boolean; is None uses object identity and always returns a plain bool, making it safe with NumPy, Pandas, and other operator-overloading types.",
  },
  {
    id: "py-types-optional-vs-union",
    language: "python",
    title: "Optional[X] is exactly Union[X, None]",
    tag: "types",
    code: `from typing import Optional, Union

# These are identical
def greet(name: Optional[str]) -> str:
    return f'Hello, {name or "stranger"}'

def greet2(name: Union[str, None]) -> str:
    return f'Hello, {name or "stranger"}'

# Python 3.10+ syntax
def greet3(name: str | None) -> str:
    return f'Hello, {name or "stranger"}'

print(Optional[str] == Union[str, None])  # True`,
    explanation: "Optional[X] is just shorthand for Union[X, None]; all three forms are equivalent. The 3.10+ X | None syntax is the most concise and doesn't require importing from typing.",
  },
  {
    id: "py-types-literal-union",
    language: "python",
    title: "Literal union as a discriminated union",
    tag: "types",
    code: `from typing import Literal, Union
from dataclasses import dataclass

@dataclass
class SuccessResult:
    status: Literal['ok']
    data: str

@dataclass
class ErrorResult:
    status: Literal['error']
    message: str

Result = Union[SuccessResult, ErrorResult]

def handle(r: Result) -> str:
    if r.status == 'ok':
        return r.data       # type checker knows r: SuccessResult
    return r.message        # type checker knows r: ErrorResult`,
    explanation: "A Literal field used as a discriminant lets type checkers narrow a Union to the correct variant inside each branch, eliminating the need for isinstance checks.",
  },
  {
    id: "py-types-total-false",
    language: "python",
    title: "TypedDict(total=False) makes all keys optional",
    tag: "types",
    code: `from typing import TypedDict

class PartialConfig(TypedDict, total=False):
    host: str
    port: int
    ssl: bool
    timeout: float

# All keys are optional
cfg: PartialConfig = {'host': 'localhost'}   # valid
cfg2: PartialConfig = {}                      # also valid

# Mix required and optional via inheritance
class Config(TypedDict):
    host: str                    # required

class FullConfig(Config, PartialConfig):
    pass                         # host required, rest optional`,
    explanation: "total=False makes every key in the TypedDict optional; inherit from both a required TypedDict and a total=False one to mix required and optional keys in the same dict type.",
  },
  {
    id: "py-families-datetime-timezone",
    language: "python",
    title: "datetime: timezone-aware vs naive datetimes",
    tag: "families",
    code: `from datetime import datetime, timezone, timedelta

# Naive datetime: no timezone info
naive = datetime.now()

# Aware datetime: includes timezone
utc_now = datetime.now(tz=timezone.utc)
print(utc_now.isoformat())  # 2026-05-09T10:30:00+00:00

# Fixed-offset timezone
eastern = timezone(timedelta(hours=-5))
et_now = datetime.now(tz=eastern)

# Convert between timezones
print(utc_now.astimezone(eastern))`,
    explanation: "Naive datetimes have no timezone info and are ambiguous; always use timezone-aware datetimes in server code. datetime.now(tz=timezone.utc) is the safe way to get the current UTC time.",
  },
  {
    id: "py-families-enum-class",
    language: "python",
    title: "enum.Enum: type-safe named constants",
    tag: "families",
    code: `from enum import Enum, auto

class Color(Enum):
    RED   = auto()
    GREEN = auto()
    BLUE  = auto()

c = Color.RED
print(c)           # Color.RED
print(c.name)      # RED
print(c.value)     # 1

# Iteration and membership
print(list(Color))              # [Color.RED, Color.GREEN, Color.BLUE]
print(Color.GREEN in Color)     # True

# Comparison by identity
print(Color.RED == Color.RED)   # True
print(Color.RED == 1)           # False  (not the integer 1)`,
    explanation: "Enum values are singletons compared by identity; auto() assigns sequential integers automatically. Unlike plain constants, Enum members are type-safe and can be iterated, serialised, and used in match statements.",
  },
  {
    id: "py-families-contextlib-tools",
    language: "python",
    title: "contextlib: nullcontext, ExitStack, AsyncExitStack",
    tag: "families",
    code: `from contextlib import nullcontext, ExitStack

# nullcontext: placeholder when a context manager is optional
def process(f=None):
    cm = open(f) if f else nullcontext()
    with cm as handle:
        pass   # handle is None if no file

# ExitStack: manage a variable number of context managers
with ExitStack() as stack:
    files = [stack.enter_context(open(f'f{i}.txt', 'w'))
             for i in range(3)]
    for i, f in enumerate(files):
        f.write(str(i))
# All 3 files closed automatically`,
    explanation: "nullcontext is a no-op context manager useful when a dependency is optional. ExitStack dynamically composes context managers, making it easy to manage a variable number of resources.",
  },
];
