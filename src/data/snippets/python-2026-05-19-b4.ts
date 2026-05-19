import type { Snippet } from "./types";

export const pythonSnippets20260519B4: Snippet[] = [
  {
    id: "py-0519-b4-logging-structured",
    language: "python",
    title: "logging with structured extra fields",
    tag: "snippet",
    code: `import logging

logging.basicConfig(
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger("myapp")

# Pass extra dict for custom fields
logger.info("User login", extra={"user_id": 42, "ip": "10.0.0.1"})

# Better: use LogRecord extras with a filter
class ContextFilter(logging.Filter):
    def filter(self, record):
        record.request_id = "abc-123"
        return True

logger.addFilter(ContextFilter())
logger.warning("slow query")`,
    explanation: "The extra= dict adds arbitrary fields to the LogRecord, making structured logging compatible with JSON formatters; filters can inject request-scoped context without passing it through every call.",
  },
  {
    id: "py-0519-b4-logging-handler",
    language: "python",
    title: "Custom logging handler for async queues",
    tag: "snippet",
    code: `import logging
from collections import deque

class BufferHandler(logging.Handler):
    def __init__(self, capacity=100):
        super().__init__()
        self.buffer = deque(maxlen=capacity)

    def emit(self, record):
        self.buffer.append(self.format(record))

    def dump(self):
        return list(self.buffer)

handler = BufferHandler(capacity=50)
handler.setFormatter(logging.Formatter("%(levelname)s %(message)s"))

log = logging.getLogger("buffered")
log.addHandler(handler)
log.setLevel(logging.DEBUG)
log.info("hello")
print(handler.dump())  # ['INFO hello']`,
    explanation: "A custom Handler only needs to implement emit(record); using a deque with maxlen keeps the last N log records in memory without growing unboundedly — useful for in-process ring buffers.",
  },
  {
    id: "py-0519-b4-abc-all-abstract",
    language: "python",
    title: "Checking which methods are still abstract",
    tag: "classes",
    code: `from abc import ABC, abstractmethod

class Interface(ABC):
    @abstractmethod
    def read(self): ...

    @abstractmethod
    def write(self, data): ...

    @abstractmethod
    def close(self): ...

class PartialImpl(Interface):
    def read(self):
        return b""
    # write and close not implemented

# __abstractmethods__ holds the names of unimplemented abstract methods
print(PartialImpl.__abstractmethods__)   # frozenset({'write', 'close'})

# Trying to instantiate raises TypeError listing the missing methods
try:
    PartialImpl()
except TypeError as e:
    print(e)`,
    explanation: "__abstractmethods__ is a frozenset of names still abstract in a class; Python checks it at instantiation time and lists all missing implementations in the TypeError message.",
  },
  {
    id: "py-0519-b4-type-annotations-runtime",
    language: "python",
    title: "Accessing __annotations__ at runtime",
    tag: "types",
    code: `class Config:
    host: str
    port: int
    debug: bool = False

# __annotations__ only includes this class's own annotations
print(Config.__annotations__)
# {'host': <class 'str'>, 'port': <class 'int'>, 'debug': <class 'bool'>}

# For inherited annotations use typing.get_type_hints (resolves forward refs)
from typing import get_type_hints

class Child(Config):
    timeout: float = 30.0

print(get_type_hints(Child))
# includes host, port, debug, timeout`,
    explanation: "__annotations__ only contains the class's own annotations, not inherited ones; get_type_hints traverses the MRO and resolves string annotations — use it for reliable runtime introspection.",
  },
  {
    id: "py-0519-b4-zip-dict-keys-values",
    language: "python",
    title: "zip(d.keys(), d.values()) vs d.items()",
    tag: "understanding",
    code: `d = {"a": 1, "b": 2, "c": 3}

# Equivalent but d.items() is cleaner and slightly faster
for k, v in zip(d.keys(), d.values()):
    print(k, v)

# Preferred idiom
for k, v in d.items():
    print(k, v)

# zip approach is wrong if the dict is mutated between .keys() and .values()
# d.items() always returns consistent pairs from the same snapshot`,
    explanation: "dict.items() is safer than zip(d.keys(), d.values()) because it always returns matched key-value pairs; zip relies on iteration order alignment which breaks if the dict is mutated between the two views.",
  },
  {
    id: "py-0519-b4-pickle-basics",
    language: "python",
    title: "pickle for Python object serialisation",
    tag: "snippet",
    code: `import pickle, io

class Config:
    def __init__(self, host, port):
        self.host = host
        self.port = port

cfg = Config("localhost", 5432)

# Serialise to bytes
data = pickle.dumps(cfg)

# Deserialise
cfg2 = pickle.loads(data)
print(cfg2.host, cfg2.port)   # localhost 5432

# NEVER unpickle untrusted data — it can execute arbitrary code!
# Use json / msgpack for cross-language or untrusted data`,
    explanation: "pickle serialises Python objects including class instances, closures, and custom types; it requires the same class to be importable on deserialisation and must never be used with untrusted data.",
  },
  {
    id: "py-0519-b4-json-custom-encoder",
    language: "python",
    title: "Custom JSON encoder and decoder",
    tag: "snippet",
    code: `import json
from datetime import datetime

class DateEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, datetime):
            return {"__datetime__": obj.isoformat()}
        return super().default(obj)

def date_decoder(dct):
    if "__datetime__" in dct:
        return datetime.fromisoformat(dct["__datetime__"])
    return dct

data = {"name": "Alice", "created": datetime(2026, 5, 19)}
encoded = json.dumps(data, cls=DateEncoder)
decoded = json.loads(encoded, object_hook=date_decoder)
print(decoded["created"].year)   # 2026`,
    explanation: "Subclassing JSONEncoder and overriding default handles non-serialisable types; object_hook on the decode side intercepts every dict and can reconstruct custom types from sentinel fields.",
  },
  {
    id: "py-0519-b4-collections-counter-most",
    language: "python",
    title: "Counter.most_common and Counter.elements",
    tag: "structures",
    code: `from collections import Counter

text = "the quick brown fox jumps over the lazy dog"
word_count = Counter(text.split())

# most_common(n): top N by frequency
print(word_count.most_common(3))
# [('the', 2), ('quick', 1), ('brown', 1)]

# elements(): iterator that yields each element repeated by its count
small = Counter({"a": 3, "b": 1, "c": 2})
print(sorted(small.elements()))   # ['a', 'a', 'a', 'b', 'c', 'c']

# subtract: in-place difference (keeps negative counts)
small.subtract({"a": 5})
print(small["a"])    # -2`,
    explanation: "most_common() returns items sorted by count (None for all); elements() expands back to a flat sequence; subtract keeps negative counts unlike - which drops them.",
  },
  {
    id: "py-0519-b4-collections-deque-maxlen",
    language: "python",
    title: "deque maxlen for sliding window tracking",
    tag: "structures",
    code: `from collections import deque

def moving_average(data, window):
    dq = deque(maxlen=window)
    for x in data:
        dq.append(x)
        if len(dq) == window:
            yield sum(dq) / window

data = [1, 2, 3, 4, 5, 6, 7, 8]
print(list(moving_average(data, 3)))
# [2.0, 3.0, 4.0, 5.0, 6.0, 7.0]`,
    explanation: "A deque with maxlen automatically evicts the oldest element when full, making it the natural O(1) data structure for sliding windows without manual index arithmetic.",
  },
  {
    id: "py-0519-b4-typing-literal-str",
    language: "python",
    title: "LiteralString for SQL injection prevention",
    tag: "types",
    code: `from typing import LiteralString

def execute_query(sql: LiteralString) -> list:
    """Only accepts string literals — not runtime-constructed strings."""
    print(f"Running: {sql}")
    return []

# OK — literal string
execute_query("SELECT * FROM users WHERE active = 1")

# Type error — user input could be injected
# user_input = input()
# execute_query("SELECT * FROM " + user_input)  # type checker warns

# Use parameterised queries for actual security:
# cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))`,
    explanation: "LiteralString (PEP 675) only accepts string literals or concatenations of them; type checkers flag any value that could come from user input, preventing SQL injection at the type-checking level.",
  },
  {
    id: "py-0519-b4-dataclass-ordering-field",
    language: "python",
    title: "dataclass compare=False to exclude fields from ordering",
    tag: "classes",
    code: `from dataclasses import dataclass, field

@dataclass(order=True)
class Task:
    priority: int
    name: str = field(compare=False)   # excluded from all comparisons
    tags: list = field(default_factory=list, compare=False, repr=False)

t1 = Task(1, "write tests", ["dev"])
t2 = Task(2, "deploy",      ["ops"])
t3 = Task(1, "review PR",   ["dev"])

print(t1 < t2)    # True  (priority 1 < 2)
print(t1 == t3)   # True  (same priority, name/tags excluded)
print(sorted([t2, t3, t1]))  # sorted by priority only`,
    explanation: "compare=False on a field excludes it from __eq__, __lt__, etc.; repr=False hides it from __repr__; combine them to control which fields determine object identity and ordering independently.",
  },
  {
    id: "py-0519-b4-enum-value",
    language: "python",
    title: "Enum with descriptive value and extra attributes",
    tag: "types",
    code: `from enum import Enum

class Planet(Enum):
    # value is a tuple — __new__ unpacks it
    MERCURY = (3.303e+23, 2.4397e6)
    VENUS   = (4.869e+24, 6.0518e6)
    EARTH   = (5.976e+24, 6.37814e6)

    def __new__(cls, mass, radius):
        obj = object.__new__(cls)
        obj._value_ = (mass, radius)
        obj.mass = mass
        obj.radius = radius
        return obj

    def surface_gravity(self):
        G = 6.67430e-11
        return G * self.mass / (self.radius ** 2)

print(Planet.EARTH.surface_gravity())   # ~9.8`,
    explanation: "Overriding __new__ in Enum lets each member carry multiple attributes derived from the tuple value; _value_ determines what .value returns while additional attributes are stored directly on the member.",
  },
  {
    id: "py-0519-b4-threading-lock",
    language: "python",
    title: "threading.Lock vs threading.RLock",
    tag: "snippet",
    code: `import threading

# Lock: basic mutex — can't be acquired twice from the same thread
lock = threading.Lock()

# RLock (reentrant): same thread can acquire multiple times
rlock = threading.RLock()

def recursive_task(depth):
    with rlock:          # OK to acquire again from this thread
        if depth > 0:
            recursive_task(depth - 1)
        print(f"depth {depth}")

# Lock would deadlock here:
# with lock:
#     with lock:  # blocks forever — same thread can't re-acquire

recursive_task(3)`,
    explanation: "Lock deadlocks if the same thread tries to acquire it again; RLock tracks the owning thread and a count, allowing recursive acquisition — use when a method calls another method that also locks.",
  },
  {
    id: "py-0519-b4-typing-selfbounded",
    language: "python",
    title: "TypeVar with bound for self-referential methods",
    tag: "types",
    code: `from typing import TypeVar

T = TypeVar("T", bound="Comparable")

class Comparable:
    def __lt__(self: T, other: T) -> bool:
        raise NotImplementedError

    def clamp(self: T, lo: T, hi: T) -> T:
        if self < lo:
            return lo
        if hi < self:
            return hi
        return self

class Score(Comparable):
    def __init__(self, v): self.v = v
    def __lt__(self, other): return self.v < other.v
    def __repr__(self): return f"Score({self.v})"

print(Score(150).clamp(Score(0), Score(100)))  # Score(100)`,
    explanation: "Binding TypeVar to the class itself (bound=) preserves the subclass type through method chains; without it, clamp would return Comparable instead of Score in the subclass.",
  },
  {
    id: "py-0519-b4-asyncio-queue",
    language: "python",
    title: "asyncio.Queue for producer-consumer",
    tag: "snippet",
    code: `import asyncio

async def producer(q: asyncio.Queue):
    for i in range(5):
        await asyncio.sleep(0.01)
        await q.put(i)
        print(f"Produced {i}")
    await q.put(None)   # sentinel

async def consumer(q: asyncio.Queue):
    while True:
        item = await q.get()
        if item is None:
            break
        print(f"Consumed {item}")
        q.task_done()

async def main():
    q: asyncio.Queue[int | None] = asyncio.Queue(maxsize=3)
    await asyncio.gather(producer(q), consumer(q))

asyncio.run(main())`,
    explanation: "asyncio.Queue is the async counterpart to queue.Queue; maxsize creates backpressure (producer awaits put when full); task_done() + join() can synchronise graceful shutdown.",
  },
  {
    id: "py-0519-b4-typing-unpack-typed",
    language: "python",
    title: "Typed **kwargs with TypedDict",
    tag: "types",
    code: `from typing import TypedDict, Unpack

class ConnectOptions(TypedDict, total=False):
    timeout: float
    retries: int
    ssl: bool

def connect(host: str, **kwargs: Unpack[ConnectOptions]) -> None:
    timeout = kwargs.get("timeout", 30.0)
    retries = kwargs.get("retries", 3)
    print(f"Connecting to {host} (timeout={timeout}, retries={retries})")

# Type checker validates kwarg names and types
connect("db.example.com", timeout=60.0, retries=5)
# connect("db.example.com", unknown=True)  # type error`,
    explanation: "Unpack[TypedDict] annotates **kwargs with a TypedDict's structure, giving type checkers full visibility into accepted keyword arguments including their types and whether they're required.",
  },
  {
    id: "py-0519-b4-context-manager-reuse",
    language: "python",
    title: "contextlib.contextmanager generator state reset",
    tag: "understanding",
    code: `from contextlib import contextmanager

@contextmanager
def cm():
    print("enter")
    yield
    print("exit")

# A @contextmanager cannot be reused once exhausted
mgr = cm()   # creates the generator

with mgr:
    print("inside 1")
# enter / inside 1 / exit

try:
    with mgr:   # generator is exhausted — StopIteration raised
        print("inside 2")
except RuntimeError as e:
    print(e)  # generator didn't yield

# Fix: call cm() each time to get a fresh generator
with cm():
    print("fresh")`,
    explanation: "A @contextmanager generator is single-use; once the generator is exhausted, the with statement raises RuntimeError — always call the factory function again to get a fresh context manager.",
  },
  {
    id: "py-0519-b4-classmethod-descriptors",
    language: "python",
    title: "classmethod is a descriptor",
    tag: "classes",
    code: `class MyClass:
    @classmethod
    def create(cls):
        return cls()

# classmethod is implemented as a non-data descriptor
print(type(MyClass.__dict__["create"]))  # <class 'classmethod'>

# Accessing via the class returns a bound method (cls pre-filled)
bound = MyClass.create
print(bound)   # <bound method MyClass.create of <class 'MyClass'>>

# classmethod wraps the function in a descriptor whose __get__
# returns a bound method with cls=the class (or subclass)
class Child(MyClass):
    pass

print(Child.create())  # <Child object>`,
    explanation: "classmethod is implemented as a non-data descriptor; its __get__ is called with obj=None when accessed on a class and returns a partial that pre-fills cls with the class — that's how subclass-aware factories work.",
  },
  {
    id: "py-0519-b4-bytes-literal",
    language: "python",
    title: "bytes literals: b'', rb'', hex encoding",
    tag: "types",
    code: `# Regular bytes literal
b1 = b"hello"

# Raw bytes literal: backslash not interpreted
b2 = rb"line1\\nline2"   # \\n is two chars, not newline
print(len(b2))   # 14

# Hex encoding round-trip
data = bytes.fromhex("deadbeef")
print(data.hex())        # deadbeef
print(data.hex(" "))     # de ad be ef

# Escape sequences in bytes
b3 = b"\\x00\\xff\\t\\r\\n"
print(len(b3))   # 5`,
    explanation: "Bytes literals support the same escape sequences as str (\\x, \\n, \\t, etc.) for arbitrary byte values; rb'' keeps backslashes literal; fromhex/hex convert between bytes and hex strings.",
  },
  {
    id: "py-0519-b4-int-from-bytes",
    language: "python",
    title: "int.from_bytes and to_bytes for binary protocols",
    tag: "types",
    code: `# Build a 4-byte network packet header field
seq_num = 12345
raw = seq_num.to_bytes(4, byteorder="big")
print(raw.hex())   # '00003039'

# Parse back
parsed = int.from_bytes(raw, byteorder="big")
print(parsed)   # 12345

# Little-endian (x86 native)
le = seq_num.to_bytes(4, byteorder="little")
print(le.hex())   # '39300000'

# Signed integers
neg = (-1).to_bytes(2, byteorder="big", signed=True)
print(neg.hex())  # 'ffff'`,
    explanation: "to_bytes and from_bytes encode/decode Python ints to/from a fixed number of bytes with explicit byte order and sign, which is exactly what binary protocol serialisation requires.",
  },
  {
    id: "py-0519-b4-abstract-generic",
    language: "python",
    title: "Generic ABC combining TypeVar and abstractmethod",
    tag: "classes",
    code: `from abc import ABC, abstractmethod
from typing import TypeVar, Generic

T = TypeVar("T")

class Repository(ABC, Generic[T]):
    @abstractmethod
    def get(self, id: int) -> T | None: ...

    @abstractmethod
    def save(self, entity: T) -> None: ...

    @abstractmethod
    def delete(self, id: int) -> bool: ...

class User:
    def __init__(self, id, name): self.id, self.name = id, name

class UserRepo(Repository[User]):
    def __init__(self): self._store: dict[int, User] = {}
    def get(self, id): return self._store.get(id)
    def save(self, user): self._store[user.id] = user
    def delete(self, id): return self._store.pop(id, None) is not None`,
    explanation: "Combining Generic[T] with ABC creates a typed repository pattern; type checkers enforce that UserRepo's methods use User, not a generic T, while abstractmethod ensures all operations are implemented.",
  },
  {
    id: "py-0519-b4-threading-event",
    language: "python",
    title: "threading.Event for cross-thread signalling",
    tag: "snippet",
    code: `import threading, time

ready = threading.Event()

def worker():
    print("Worker: waiting for signal...")
    ready.wait()   # blocks until event is set
    print("Worker: got signal, working")

t = threading.Thread(target=worker)
t.start()

time.sleep(0.1)
print("Main: setting event")
ready.set()     # unblocks all waiters

t.join()

# reset allows reuse
ready.clear()
print("Event reset:", ready.is_set())  # False`,
    explanation: "threading.Event is a simple flag: wait() blocks until set() is called; set() wakes all waiters; clear() resets for reuse — the threading equivalent of asyncio.Event.",
  },
  {
    id: "py-0519-b4-match-mapping",
    language: "python",
    title: "match-case mapping pattern for JSON-like data",
    tag: "snippet",
    code: `def handle(event: dict):
    match event:
        case {"type": "click", "button": int(b), "x": x, "y": y}:
            print(f"Button {b} click at ({x},{y})")

        case {"type": "key", "key": str(k), "modifiers": [*mods]}:
            print(f"Key '{k}' with {len(mods)} modifier(s)")

        case {"type": str(t)}:
            print(f"Unknown event type: {t}")

        case _:
            print("Malformed event")

handle({"type": "click", "button": 1, "x": 100, "y": 200})
handle({"type": "key", "key": "a", "modifiers": ["shift"]})`,
    explanation: "Mapping patterns match dict-like objects by key; extra keys are allowed (no strict mode); class patterns like int(b) match and cast in one step; ** rest captures remaining keys.",
  },
  {
    id: "py-0519-b4-dataclass-post-validate",
    language: "python",
    title: "Dataclass field validation in __post_init__",
    tag: "classes",
    code: `from dataclasses import dataclass

@dataclass
class Range:
    start: float
    stop: float
    step: float = 1.0

    def __post_init__(self):
        if self.start >= self.stop:
            raise ValueError(f"start ({self.start}) must be < stop ({self.stop})")
        if self.step <= 0:
            raise ValueError(f"step must be positive, got {self.step}")

r = Range(0.0, 10.0)   # OK

try:
    Range(10.0, 0.0)   # ValueError
except ValueError as e:
    print(e)`,
    explanation: "__post_init__ is the right place for cross-field validation in dataclasses; it runs after __init__ so all fields are already set; raising ValueError here is conventional for invalid arguments.",
  },
  {
    id: "py-0519-b4-typing-concatenate",
    language: "python",
    title: "Concatenate for injected first arguments",
    tag: "types",
    code: `from typing import Callable, Concatenate, ParamSpec, TypeVar

P = ParamSpec("P")
R = TypeVar("R")

def inject_user(fn: Callable[Concatenate[str, P], R]) -> Callable[P, R]:
    """Decorator that injects a user string as the first argument."""
    import functools
    @functools.wraps(fn)
    def wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
        return fn("system_user", *args, **kwargs)
    return wrapper

@inject_user
def create_post(user: str, title: str, body: str) -> str:
    return f"{user}: {title}"

# Caller doesn't pass user — injected automatically
result = create_post("Hello", "World")
print(result)  # system_user: Hello`,
    explanation: "Concatenate[ExtraType, P] describes a callable that expects ExtraType as an additional first parameter before the parameters captured by P — the correct typing for decorators that inject arguments.",
  },
  {
    id: "py-0519-b4-struct-format-endian",
    language: "python",
    title: "struct format string: endianness and alignment",
    tag: "structures",
    code: `import struct

# Format prefixes:
# @ = native byte order + native alignment (default)
# = = native byte order + no alignment padding
# < = little-endian, > = big-endian, ! = network (big-endian)

# Network byte order: big-endian
pkt = struct.pack("!HH", 1234, 5678)   # two unsigned shorts
print(pkt.hex())   # '04d2162e'

# Native ordering
native = struct.pack("=HH", 1234, 5678)

# Struct with padding
aligned   = struct.calcsize("@BHI")   # may have padding bytes
noalign   = struct.calcsize("=BHI")   # no padding: 1+2+4 = 7`,
    explanation: "The format prefix controls byte order and padding; use ! for network protocols, < or > for file formats with specified endianness, and = for packed binary without alignment waste.",
  },
  {
    id: "py-0519-b4-functools-reduce-tree",
    language: "python",
    title: "functools.reduce for tree fold",
    tag: "snippet",
    code: `from functools import reduce

# Build a balanced expression tree using reduce
# (illustrates reduce for non-linear aggregations)
def tree_sum(nodes):
    """Sum a list of values using a tree structure via reduce."""
    if len(nodes) == 1:
        return nodes[0]
    pairs = [nodes[i] + nodes[i+1] if i+1 < len(nodes) else nodes[i]
             for i in range(0, len(nodes), 2)]
    return tree_sum(pairs)

data = list(range(1, 9))   # [1..8]
print(tree_sum(data))       # 36

# For simple sums, use sum(). reduce shines for binary tree ops.
print(reduce(lambda a, b: a + b, data, 0))  # 36`,
    explanation: "reduce applies a binary function repeatedly to collapse a sequence to a single value; for a tree fold you'd recurse with pairs — reduce is the functional pattern, but built-ins are clearer for standard aggregations.",
  },
  {
    id: "py-0519-b4-sys-exit-atexit",
    language: "python",
    title: "sys.exit, atexit, and shutdown handlers",
    tag: "snippet",
    code: `import atexit, sys

def cleanup():
    print("Cleanup ran")

atexit.register(cleanup)   # runs on normal exit

def cleanup_with_args(name):
    print(f"Cleaning up {name}")

atexit.register(cleanup_with_args, "connection")

# sys.exit raises SystemExit — atexit handlers run
# os._exit skips atexit handlers — for post-fork in child processes
print("Exiting...")
# sys.exit(0)   # Exiting... / Cleaning up connection / Cleanup ran`,
    explanation: "atexit.register queues functions to run when the interpreter shuts down normally (including sys.exit); os._exit terminates immediately without running atexit handlers — use it only in multiprocessing child processes.",
  },
  {
    id: "py-0519-b4-array-typed-perf",
    language: "python",
    title: "array.array vs list for numeric-heavy storage",
    tag: "structures",
    code: `import array, time

N = 1_000_000

# list: each element is a Python int object (~28 bytes each)
lst = list(range(N))

# array.array: contiguous C ints (4 bytes each)
arr = array.array("i", range(N))

# Memory comparison
import sys
print(sys.getsizeof(lst))   # ~8 MB
print(sys.getsizeof(arr))   # ~4 MB

# Sum performance (sum is a C loop over Python objects for list)
start = time.perf_counter()
sum(lst)
print("list sum:", time.perf_counter() - start)

start = time.perf_counter()
sum(arr)
print("array sum:", time.perf_counter() - start)`,
    explanation: "array.array stores C-typed values compactly (half the memory of a list for int32); iteration is still slightly slower than NumPy but faster than list for I/O-heavy workloads because less data is read.",
  },
  {
    id: "py-0519-b4-match-sequence-capture",
    language: "python",
    title: "match-case sequence pattern with variable capture",
    tag: "snippet",
    code: `def process(cmd):
    match cmd.split():
        case ["quit"]:
            return "quitting"
        case ["go", direction]:
            return f"going {direction}"
        case ["go", direction, steps] if steps.isdigit():
            return f"going {direction} for {steps} steps"
        case ["get", item, *rest]:
            return f"getting {item}, extra={rest}"
        case _:
            return f"unknown: {cmd}"

print(process("go north"))              # going north
print(process("go south 5"))            # going south for 5 steps
print(process("get sword shield bow"))  # getting sword, extra=['shield', 'bow']`,
    explanation: "Sequence patterns match lists and tuples by structure; bare names like direction bind the matched element; *rest binds remaining elements as a list; guards add conditions beyond structure.",
  },
  {
    id: "py-0519-b4-property-settable",
    language: "python",
    title: "property with validation in setter vs __setattr__",
    tag: "classes",
    code: `class BoundedInt:
    def __init__(self, lo, hi):
        self._lo, self._hi = lo, hi
        self._value = lo

    @property
    def value(self):
        return self._value

    @value.setter
    def value(self, v):
        if not (self._lo <= v <= self._hi):
            raise ValueError(f"{v} not in [{self._lo}, {self._hi}]")
        self._value = v

x = BoundedInt(0, 100)
x.value = 50
print(x.value)   # 50

try:
    x.value = 150   # ValueError
except ValueError as e:
    print(e)`,
    explanation: "Using a property setter keeps validation close to the attribute and avoids the footgun of __setattr__ (which intercepts ALL assignments including internal ones, requiring careful __dict__ manipulation).",
  },
  {
    id: "py-0519-b4-protocol-abstract-mix",
    language: "python",
    title: "Protocol vs ABC: when to use which",
    tag: "families",
    code: `from abc import ABC, abstractmethod
from typing import Protocol

# ABC: nominal subtyping — explicit inheritance required
class ILogger(ABC):
    @abstractmethod
    def log(self, msg: str) -> None: ...

# Protocol: structural — any class with log() method works
class LoggableP(Protocol):
    def log(self, msg: str) -> None: ...

class ConsoleLogger:
    def log(self, msg):
        print(msg)

# For ABC: must inherit
class AppLogger(ConsoleLogger, ILogger):
    def log(self, msg): super().log(msg)

# For Protocol: no inheritance needed
def write(logger: LoggableP, msg: str):
    logger.log(msg)   # ConsoleLogger works without inheriting anything

write(ConsoleLogger(), "hello")`,
    explanation: "Use ABC when you want to enforce an explicit is-a relationship and share base class code; use Protocol when you want structural duck-typing where any compatible class works without inheritance.",
  },
  {
    id: "py-0519-b4-dataclass-asdict-astuple",
    language: "python",
    title: "dataclasses.asdict and astuple",
    tag: "classes",
    code: `from dataclasses import dataclass, asdict, astuple

@dataclass
class Point:
    x: float
    y: float

@dataclass
class Line:
    start: Point
    end: Point

line = Line(Point(0, 0), Point(3, 4))

# asdict: recursively converts to nested dicts (deep copy)
d = asdict(line)
print(d)   # {'start': {'x': 0, 'y': 0}, 'end': {'x': 3, 'y': 4}}

# astuple: recursively converts to nested tuples
t = astuple(line)
print(t)   # ((0, 0), (3, 4))`,
    explanation: "asdict and astuple perform deep recursive conversion of dataclass instances (including nested dataclasses) to plain dicts/tuples — useful for JSON serialisation and functional transformations.",
  },
  {
    id: "py-0519-b4-generator-throw",
    language: "python",
    title: "Generator .throw() for injecting exceptions",
    tag: "snippet",
    code: `def safe_gen():
    for i in range(10):
        try:
            yield i
        except ValueError as e:
            print(f"Caught in gen: {e}")
            # continue without stopping the generator

g = safe_gen()
print(next(g))        # 0
print(next(g))        # 1
g.throw(ValueError, "test error")   # Caught in gen: test error / returns 2
print(next(g))        # 3`,
    explanation: "throw() injects an exception at the generator's current yield point; the generator can catch it and continue with the next yield, enabling error injection and cancellation patterns.",
  },
  {
    id: "py-0519-b4-typing-sequence-vs-list",
    language: "python",
    title: "Sequence[T] vs List[T] vs Iterable[T] in annotations",
    tag: "types",
    code: `from typing import Sequence, Iterable

# Iterable[T]: anything you can for-loop over (generators, sets, etc.)
# Can only be consumed once if it's a generator
def consume(items: Iterable[int]) -> int:
    return sum(items)

# Sequence[T]: supports len() + random indexing (list, tuple, str)
def last(items: Sequence[int]) -> int:
    return items[-1]   # needs indexing

# List[T]: a concrete mutable list
def append_one(items: list[int]) -> None:
    items.append(1)    # needs mutability

consume(range(5))       # generator OK
last([1, 2, 3])         # list OK
# last(range(5))        # range is Sequence, OK too
# last(x for x in [])  # generator NOT OK — no len/index`,
    explanation: "Annotate with the narrowest type you actually need: Iterable for one-pass loops, Sequence for index access, list/List only if you require mutability — accepting Iterable lets callers pass generators.",
  },
  {
    id: "py-0519-b4-contextlib-aclosing",
    language: "python",
    title: "contextlib.aclosing for async generators",
    tag: "snippet",
    code: `import asyncio
from contextlib import aclosing

async def number_stream():
    for i in range(100):
        await asyncio.sleep(0.001)
        yield i

async def main():
    # aclosing ensures aclose() is called even if we break early
    async with aclosing(number_stream()) as stream:
        async for n in stream:
            if n >= 5:
                break   # without aclosing, generator may not be closed
    print("done")

asyncio.run(main())`,
    explanation: "aclosing wraps an async generator in a context manager that calls aclose() on exit, ensuring cleanup code in the generator's finally block runs even when iteration is cut short by break.",
  },
  {
    id: "py-0519-b4-collections-abc-check",
    language: "python",
    title: "collections.abc for interface membership checks",
    tag: "families",
    code: `from collections.abc import (
    Callable, Iterable, Sequence, Mapping, MutableMapping
)

print(isinstance([1, 2], Sequence))      # True
print(isinstance((1, 2), Sequence))      # True
print(isinstance({1, 2}, Sequence))      # False (no index)
print(isinstance({}, Mapping))           # True
print(isinstance({}, MutableMapping))    # True
print(isinstance(lambda: 0, Callable))   # True

# Use these for type checks rather than concrete types
def process(data):
    if isinstance(data, Mapping):
        return list(data.keys())
    if isinstance(data, Iterable):
        return list(data)`,
    explanation: "collections.abc defines abstract base classes for container protocols; use isinstance against these for duck-typing checks rather than concrete types like list or dict.",
  },
  {
    id: "py-0519-b4-weakref-proxy",
    language: "python",
    title: "weakref.proxy — transparent weak reference",
    tag: "structures",
    code: `import weakref

class Node:
    def __init__(self, val): self.val = val
    def __repr__(self): return f"Node({self.val})"

n = Node(42)

# proxy: transparent — access attributes directly without calling ()
proxy = weakref.proxy(n)
print(proxy.val)   # 42   (transparent, no () needed)

del n   # underlying object gone

try:
    print(proxy.val)
except ReferenceError:
    print("proxy is dead")   # proxy is dead`,
    explanation: "weakref.proxy creates a proxy that forwards attribute access directly, unlike weakref.ref which requires calling the reference to get the object; both raise ReferenceError if the referent is collected.",
  },
  {
    id: "py-0519-b4-type-tuple-union",
    language: "python",
    title: "tuple as a fixed-length type vs variable-length",
    tag: "types",
    code: `from typing import Tuple

# Fixed-length tuple: each position has a specific type
Point = tuple[float, float]
p: Point = (1.0, 2.0)

# Variable-length homogeneous tuple (old style)
Nums = Tuple[int, ...]   # zero or more ints
# New style (3.9+)
Nums2 = tuple[int, ...]

# Empty tuple
empty: tuple[()] = ()

def stats(data: tuple[int, ...]) -> float:
    return sum(data) / len(data)

print(stats((1, 2, 3, 4)))  # 2.5`,
    explanation: "tuple[T1, T2] annotates a fixed-length tuple; tuple[T, ...] annotates a homogeneous variable-length tuple; the distinction matters for type checkers and lets you express structured data without a dataclass.",
  },
  {
    id: "py-0519-b4-functools-cmp-to-key",
    language: "python",
    title: "functools.cmp_to_key for legacy comparators",
    tag: "snippet",
    code: `from functools import cmp_to_key

def compare_version(a, b):
    """Return negative if a < b, 0 if equal, positive if a > b."""
    av = list(map(int, a.split(".")))
    bv = list(map(int, b.split(".")))
    for x, y in zip(av, bv):
        if x != y: return x - y
    return len(av) - len(bv)

versions = ["1.10.0", "1.9.0", "2.0.0", "1.9.1"]
sorted_v = sorted(versions, key=cmp_to_key(compare_version))
print(sorted_v)   # ['1.9.0', '1.9.1', '1.10.0', '2.0.0']`,
    explanation: "Python 3 removed the cmp= argument to sorted(); cmp_to_key converts an old-style comparator (negative/zero/positive) to a key function — useful when converting Python 2 code or sorting with complex pairwise logic.",
  },
  {
    id: "py-0519-b4-io-bufferedreader",
    language: "python",
    title: "io.BufferedReader for explicit buffered I/O",
    tag: "snippet",
    code: `import io

# Wrap a raw stream in explicit buffering
raw = io.RawIOBase()   # conceptual

# Typical use: wrap a socket in a buffered reader
import socket
# sock = socket.socket()
# reader = io.BufferedReader(sock.makefile("rb"), buffer_size=8192)

# In-memory example
data = b"Hello\\nWorld\\nEnd\\n"
raw_buf = io.BytesIO(data)
buffered = io.BufferedReader(raw_buf)

line = buffered.readline()
print(line)   # b'Hello\\n'

# peek: read-ahead without consuming
ahead = buffered.peek(5)
print(ahead)  # b'World'`,
    explanation: "BufferedReader wraps a RawIOBase and adds efficient buffering and readline(); it's also the right way to add line-based reading to raw byte streams like sockets.",
  },
  {
    id: "py-0519-b4-abstractmethod-multiple",
    language: "python",
    title: "Multiple abstract classes in one hierarchy",
    tag: "classes",
    code: `from abc import ABC, abstractmethod

class Serialisable(ABC):
    @abstractmethod
    def serialise(self) -> bytes: ...

    @abstractmethod
    def deserialise(self, data: bytes) -> None: ...

class Persistable(ABC):
    @abstractmethod
    def save(self, path: str) -> None: ...

    @abstractmethod
    def load(self, path: str) -> None: ...

class Document(Serialisable, Persistable):
    def serialise(self) -> bytes: return b"..."
    def deserialise(self, data): pass
    def save(self, path): pass
    def load(self, path): pass

d = Document()   # OK — all abstract methods implemented`,
    explanation: "A class can inherit from multiple ABCs; it must implement all abstract methods from all of them; the MRO ensures each parent's abstractmethod is resolved correctly.",
  },
  {
    id: "py-0519-b4-exception-notes",
    language: "python",
    title: "Exception notes (Python 3.11+)",
    tag: "snippet",
    code: `def process(data):
    try:
        return int(data)
    except ValueError as e:
        # Add context without replacing the exception
        e.add_note(f"Input was: {data!r}")
        e.add_note("Expected a decimal integer string")
        raise

try:
    process("abc")
except ValueError as e:
    print(e)
    # invalid literal for int() with base 10: 'abc'
    for note in e.__notes__:
        print("  Note:", note)
    # Note: Input was: 'abc'
    # Note: Expected a decimal integer string`,
    explanation: "Exception notes (Python 3.11) attach additional context to an exception without modifying its message; they appear in tracebacks and are stored in __notes__ for programmatic access.",
  },
];
