import type { Snippet } from "./types";
export const pythonSnippets20260515B2: Snippet[] = [
  {
    id: "py-b15-b2-lru-cache-method",
    language: "python",
    title: "functools.lru_cache on methods — pitfall",
    tag: "caveats",
    code: `from functools import lru_cache, cached_property

class Analyser:
    def __init__(self, data):
        self.data = data

    # WRONG: lru_cache on a regular method holds a ref to 'self',
    # preventing garbage collection
    # @lru_cache(maxsize=128)
    # def expensive(self, n): return sum(self.data[:n])

    # RIGHT: cached_property for a zero-arg "lazy attribute"
    @cached_property
    def total(self):
        return sum(self.data)

a = Analyser(list(range(1000)))
print(a.total)   # 499500  (computed once, stored in instance.__dict__)
print(a.total)   # 499500  (from cache)`,
    explanation: "`lru_cache` on an instance method caches `(self, args)` — `self` prevents the instance from being garbage-collected. Use `cached_property` for no-arg computations or `methodtools` for general method caching.",
  },
  {
    id: "py-b15-b2-dataclass-slots",
    language: "python",
    title: "dataclass with slots=True (Python 3.10+)",
    tag: "classes",
    code: `from dataclasses import dataclass
import sys

@dataclass
class WithDict:
    x: int
    y: int

@dataclass(slots=True)
class WithSlots:
    x: int
    y: int

a = WithDict(1, 2)
b = WithSlots(1, 2)

print(sys.getsizeof(a))           # ~48 + dict overhead
print(sys.getsizeof(b))           # ~48  (no __dict__)
print(hasattr(b, "__dict__"))     # False
# b.extra = "oops"  → AttributeError`,
    explanation: "`@dataclass(slots=True)` generates `__slots__` automatically from the field list, saving memory and slightly speeding up attribute access — the idiomatic approach since Python 3.10.",
  },
  {
    id: "py-b15-b2-dataclass-frozen",
    language: "python",
    title: "Frozen dataclass as hashable key",
    tag: "classes",
    code: `from dataclasses import dataclass

@dataclass(frozen=True)
class Point:
    x: float
    y: float

p1 = Point(1.0, 2.0)
p2 = Point(1.0, 2.0)

print(p1 == p2)         # True (value equality)
print(hash(p1))         # deterministic hash
print(p1 is p2)         # False (different objects)

# Usable as dict key or in a set
distances = {p1: 5.0, Point(3.0, 4.0): 10.0}
visited = {p1, p2}
print(len(visited))     # 1  (p1 == p2, same hash)`,
    explanation: "`frozen=True` makes the dataclass immutable (setattr/delattr raise `FrozenInstanceError`) and auto-generates `__hash__`, enabling use as dict keys and set members.",
  },
  {
    id: "py-b15-b2-dataclass-kw-only",
    language: "python",
    title: "dataclass kw_only for required keyword-only fields",
    tag: "classes",
    code: `from dataclasses import dataclass, field

@dataclass
class Request:
    url: str
    method: str = "GET"
    timeout: float = field(default=30.0, kw_only=True)
    retries: int   = field(default=3,    kw_only=True)

# kw_only fields MUST be passed by keyword
r = Request("https://example.com", retries=5)
print(r.url, r.method, r.timeout, r.retries)
# https://example.com GET 30.0 5

# Positional order: url, method (positional), then only keyword
# Request("url", "POST", 60.0)  → TypeError (timeout is kw_only)`,
    explanation: "`kw_only=True` on a field (or the whole `@dataclass`) forces callers to pass the argument by name, preventing order-dependent bugs when optional fields are mixed with defaults.",
  },
  {
    id: "py-b15-b2-protocol-runtime",
    language: "python",
    title: "Protocol with runtime_checkable and partial checks",
    tag: "types",
    code: `from typing import Protocol, runtime_checkable

@runtime_checkable
class Sized(Protocol):
    def __len__(self) -> int: ...

@runtime_checkable
class Reversible(Protocol):
    def __reversed__(self): ...

# isinstance only checks method/attribute presence — NOT signatures
print(isinstance([1, 2, 3], Sized))       # True
print(isinstance("hello", Sized))          # True
print(isinstance({1, 2}, Sized))           # True

# Custom class satisfies without inheriting
class MyBag:
    def __len__(self): return 42

print(isinstance(MyBag(), Sized))          # True`,
    explanation: "`@runtime_checkable` makes `isinstance` work with Protocols, but it only checks that the required attribute/method *names* exist — it doesn't validate parameter types or return types.",
  },
  {
    id: "py-b15-b2-typing-literal",
    language: "python",
    title: "Literal type for exact value constraints",
    tag: "types",
    code: `from typing import Literal, overload

Direction = Literal["N", "S", "E", "W"]

def move(d: Direction, steps: int) -> str:
    return f"Move {steps} steps {d}"

print(move("N", 3))    # Move 3 steps N
# move("X", 3)  → mypy: Argument 1 has incompatible type "Literal['X']"

# Combine with overload for different return types
@overload
def parse(raw: Literal["int"]) -> int: ...
@overload
def parse(raw: Literal["str"]) -> str: ...
def parse(raw):
    if raw == "int": return 0
    return ""`,
    explanation: "`Literal[v1, v2, ...]` restricts a parameter to exactly those values — the type checker validates call sites and can also infer different return types via `@overload`.",
  },
  {
    id: "py-b15-b2-match-guard",
    language: "python",
    title: "match / case with guard conditions",
    tag: "snippet",
    code: `def classify_temp(celsius):
    match celsius:
        case t if t < -10:
            return "extreme cold"
        case t if t < 0:
            return "freezing"
        case t if t < 20:
            return "cool"
        case t if t < 35:
            return "warm"
        case _:
            return "hot"

print(classify_temp(-15))   # extreme cold
print(classify_temp(22))    # warm
print(classify_temp(40))    # hot`,
    explanation: "`case pattern if condition:` is a guard — the case only matches when both the pattern and the boolean guard are satisfied, enabling range checks inside structural pattern matching.",
  },
  {
    id: "py-b15-b2-match-mapping",
    language: "python",
    title: "match / case with mapping patterns",
    tag: "snippet",
    code: `def handle_event(event: dict):
    match event:
        case {"type": "click", "x": x, "y": y}:
            print(f"Click at ({x}, {y})")
        case {"type": "keypress", "key": key}:
            print(f"Key: {key}")
        case {"type": str(t)}:
            print(f"Unknown event type: {t}")
        case _:
            print("malformed event")

handle_event({"type": "click",    "x": 10, "y": 20})  # Click at (10, 20)
handle_event({"type": "keypress", "key": "Enter"})     # Key: Enter
handle_event({"type": "scroll"})                       # Unknown event type: scroll`,
    explanation: "Mapping patterns destructure dicts by key; unmatched keys are ignored (use `**rest` to capture them). Sub-patterns like `str(t)` can further constrain the type of a value.",
  },
  {
    id: "py-b15-b2-match-class-pattern",
    language: "python",
    title: "match / case with class patterns",
    tag: "classes",
    code: `from dataclasses import dataclass

@dataclass
class Rect:
    width: float
    height: float

@dataclass
class Circle:
    radius: float

def area(shape):
    match shape:
        case Rect(width=w, height=h):
            return w * h
        case Circle(radius=r):
            import math
            return math.pi * r * r
        case _:
            raise TypeError(f"Unknown shape: {type(shape).__name__}")

print(f"{area(Rect(4, 3)):.2f}")    # 12.00
print(f"{area(Circle(5)):.2f}")     # 78.54`,
    explanation: "Class patterns match an instance's type and destructure its attributes; the `case Rect(width=w, height=h)` syntax binds attributes to names — similar to calling `Rect.__match_args__`.",
  },
  {
    id: "py-b15-b2-itertools-groupby",
    language: "python",
    title: "itertools.groupby — requires pre-sorted input",
    tag: "structures",
    code: `from itertools import groupby

data = [
    ("alice", "eng"), ("bob", "eng"),
    ("carol", "mkt"), ("dave", "mkt"),
    ("eve",   "eng"),
]

# groupby groups consecutive elements with the same key
for dept, members in groupby(data, key=lambda x: x[1]):
    names = [m[0] for m in members]
    print(dept, names)
# eng ['alice', 'bob']
# mkt ['carol', 'dave']
# eng ['eve']        ← eve is separate because not consecutive!

# Fix: sort first
for dept, members in groupby(sorted(data, key=lambda x: x[1]),
                              key=lambda x: x[1]):
    print(dept, [m[0] for m in members])`,
    explanation: "`itertools.groupby` only groups *consecutive* items with the same key — if the data isn't sorted by the grouping key first, the same key will produce multiple groups.",
  },
  {
    id: "py-b15-b2-itertools-islice",
    language: "python",
    title: "itertools.islice for lazy slicing",
    tag: "snippet",
    code: `from itertools import islice

def fibonacci():
    a, b = 0, 1
    while True:
        yield a
        a, b = b, a + b

# Take the first 10 Fibonacci numbers without generating all of them
first10 = list(islice(fibonacci(), 10))
print(first10)
# [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]

# Skip first 5, take next 5
skip5_take5 = list(islice(fibonacci(), 5, 10))
print(skip5_take5)
# [5, 8, 13, 21, 34]`,
    explanation: "`itertools.islice(it, start, stop, step)` slices any iterator lazily — crucial for infinite generators where `list(gen)[:n]` would never terminate.",
  },
  {
    id: "py-b15-b2-itertools-chain",
    language: "python",
    title: "itertools.chain and chain.from_iterable",
    tag: "snippet",
    code: `from itertools import chain

a = [1, 2, 3]
b = (4, 5)
c = range(6, 9)

# chain: concatenate multiple iterables lazily
for x in chain(a, b, c):
    print(x, end=" ")   # 1 2 3 4 5 6 7 8
print()

# chain.from_iterable: flatten one level of nesting
nested = [[1, 2], [3, 4], [5, 6]]
flat = list(chain.from_iterable(nested))
print(flat)   # [1, 2, 3, 4, 5, 6]

# More efficient than sum(nested, []) which O(n²) copies`,
    explanation: "`chain` concatenates iterables without creating a combined list; `chain.from_iterable` is the efficient alternative to `sum(lists, [])` for one-level flattening.",
  },
  {
    id: "py-b15-b2-itertools-product",
    language: "python",
    title: "itertools.product for Cartesian product",
    tag: "snippet",
    code: `from itertools import product

colors = ["red", "green", "blue"]
sizes  = ["S", "M", "L"]

# All (color, size) combinations
combos = list(product(colors, sizes))
print(len(combos))   # 9

# Print first 3
for c, s in combos[:3]:
    print(f"{c}-{s}")
# red-S  red-M  red-L

# repeat= for n-fold self-product
dice_rolls = list(product(range(1, 7), repeat=2))
print(len(dice_rolls))  # 36  (all outcomes of 2 dice)`,
    explanation: "`itertools.product(*iterables, repeat=n)` computes the Cartesian product — equivalent to nested for loops but as a lazy iterator; `repeat=n` is shorthand for n copies of the same iterable.",
  },
  {
    id: "py-b15-b2-itertools-combinations",
    language: "python",
    title: "itertools.combinations and permutations",
    tag: "snippet",
    code: `from itertools import combinations, permutations, combinations_with_replacement

items = ["A", "B", "C", "D"]

# combinations: order doesn't matter, no repetition
c2 = list(combinations(items, 2))
print(len(c2))   # 6  (4 choose 2)
print(c2[:3])    # [('A','B'), ('A','C'), ('A','D')]

# permutations: order matters, no repetition
p2 = list(permutations(items, 2))
print(len(p2))   # 12  (4 * 3)

# combinations_with_replacement: allow repeats
cwr = list(combinations_with_replacement("AB", 2))
print(cwr)   # [('A','A'), ('A','B'), ('B','B')]`,
    explanation: "`combinations(r)` gives C(n,r) unordered selections; `permutations(r)` gives P(n,r) ordered selections; `combinations_with_replacement(r)` allows the same element multiple times.",
  },
  {
    id: "py-b15-b2-weakref-proxy",
    language: "python",
    title: "weakref.proxy for transparent weak references",
    tag: "structures",
    code: `import weakref

class Database:
    def query(self, sql):
        return f"Result of: {sql}"

db = Database()

# weakref.ref: must call to dereference: ref()
ref = weakref.ref(db)
print(ref().query("SELECT 1"))   # call ref() to get the object

# weakref.proxy: transparent, no need to call
proxy = weakref.proxy(db)
print(proxy.query("SELECT 2"))   # use directly

del db                            # original object deleted
try:
    proxy.query("SELECT 3")       # ReferenceError: weakly-referenced object gone
except ReferenceError as e:
    print("gone!")`,
    explanation: "`weakref.proxy` creates a proxy that looks and acts like the object itself — no need to call `ref()` — but raises `ReferenceError` when the underlying object has been collected.",
  },
  {
    id: "py-b15-b2-gc-collect",
    language: "python",
    title: "gc module and manual collection",
    tag: "snippet",
    code: `import gc

# Disable GC to avoid pauses (useful in latency-sensitive code)
gc.disable()

# ... do latency-sensitive work ...

# Manually trigger GC at a safe point
collected = gc.collect()
print(f"GC collected {collected} objects")
gc.enable()

# Check if object is tracked by GC
x = [1, 2, 3]
print(gc.is_tracked(x))      # True (lists are tracked)
print(gc.is_tracked(42))     # False (small ints are not)

# Print garbage (objects in an uncollectable cycle)
print(gc.garbage)            # [] if no cycles`,
    explanation: "Python's GC handles reference cycles; disabling it reduces latency jitter at the cost of holding cycle garbage longer. `gc.collect()` forces a sweep at an application-chosen safe point.",
  },
  {
    id: "py-b15-b2-contextmanager-reuse",
    language: "python",
    title: "contextlib.contextmanager for reusable managers",
    tag: "snippet",
    code: `from contextlib import contextmanager
import time

@contextmanager
def timer(label=""):
    start = time.perf_counter()
    try:
        yield          # everything inside 'with' runs here
    finally:
        elapsed = time.perf_counter() - start
        print(f"{label}: {elapsed:.4f}s")

with timer("list build"):
    data = list(range(500_000))

with timer("sort"):
    data.sort()`,
    explanation: "`@contextmanager` wraps a generator function: code before `yield` is `__enter__`, code after (in `finally`) is `__exit__`. Far simpler than writing a full class with `__enter__`/`__exit__`.",
  },
  {
    id: "py-b15-b2-contextmanager-exception",
    language: "python",
    title: "contextmanager that catches exceptions",
    tag: "snippet",
    code: `from contextlib import contextmanager

@contextmanager
def tolerant():
    try:
        yield
    except ZeroDivisionError:
        print("Caught ZeroDivisionError, continuing")
    # Other exceptions propagate normally

with tolerant():
    result = 10 / 0     # handled
    print("never reached")

print("code continues after with block")
# Caught ZeroDivisionError, continuing
# code continues after with block`,
    explanation: "A `@contextmanager` can catch and suppress exceptions by wrapping `yield` in a `try/except`; the `with` block body's exceptions flow up to the `yield` inside the generator.",
  },
  {
    id: "py-b15-b2-asynccontextmanager",
    language: "python",
    title: "asynccontextmanager for async context managers",
    tag: "snippet",
    code: `from contextlib import asynccontextmanager
import asyncio

@asynccontextmanager
async def managed_connection(url):
    print(f"Connecting to {url}")
    conn = {"url": url, "open": True}
    try:
        yield conn
    finally:
        conn["open"] = False
        print(f"Disconnected from {url}")

async def main():
    async with managed_connection("db://localhost") as conn:
        print(f"Using connection: {conn['url']}")

asyncio.run(main())
# Connecting to db://localhost
# Using connection: db://localhost
# Disconnected from db://localhost`,
    explanation: "`@asynccontextmanager` turns an `async def` generator into an `AsyncContextManager`, supporting `async with` blocks — the async analogue of `@contextmanager`.",
  },
  {
    id: "py-b15-b2-generator-delegation",
    language: "python",
    title: "yield from for generator delegation",
    tag: "snippet",
    code: `def flatten(nested):
    for item in nested:
        if isinstance(item, list):
            yield from flatten(item)   # delegate to sub-generator
        else:
            yield item

data = [1, [2, 3, [4, 5]], 6, [7, [8, 9]]]
print(list(flatten(data)))
# [1, 2, 3, 4, 5, 6, 7, 8, 9]

# yield from also propagates .send() and .throw() to the sub-generator
def gen():
    result = yield from range(3)
    print(f"sub-gen returned: {result}")`,
    explanation: "`yield from iterable` is shorthand for `for x in iterable: yield x`, but also transparently forwards `.send()`, `.throw()`, and `.close()` calls to the sub-generator.",
  },
  {
    id: "py-b15-b2-async-generator",
    language: "python",
    title: "Async generator for streaming data",
    tag: "snippet",
    code: `import asyncio

async def number_stream(n):
    for i in range(n):
        await asyncio.sleep(0)   # simulate async I/O
        yield i * 10

async def main():
    async for value in number_stream(5):
        print(value, end=" ")
    print()

    # Also works with async comprehension
    squares = [x ** 2 async for x in number_stream(4)]
    print(squares)

asyncio.run(main())
# 0 10 20 30 40
# [0, 100, 400, 900]`,
    explanation: "An async generator (`async def` with `yield`) lets you iterate with `async for`; it enables lazy, non-blocking data streaming without materialising the whole sequence in memory.",
  },
  {
    id: "py-b15-b2-class-init-subclass",
    language: "python",
    title: "__init_subclass__ for subclass registration",
    tag: "classes",
    code: `class Plugin:
    _registry: dict[str, type] = {}

    def __init_subclass__(cls, name: str = "", **kwargs):
        super().__init_subclass__(**kwargs)
        if name:
            Plugin._registry[name] = cls

class LogPlugin(Plugin, name="log"):
    def run(self): print("logging")

class MetricPlugin(Plugin, name="metrics"):
    def run(self): print("metrics")

print(Plugin._registry)
# {'log': <class 'LogPlugin'>, 'metrics': <class 'MetricPlugin'>}

# Instantiate by name
Plugin._registry["log"]().run()   # logging`,
    explanation: "`__init_subclass__` is called on the parent class whenever a subclass is defined; keyword arguments in the class definition are forwarded as `kwargs`, enabling automatic plugin registration without a decorator.",
  },
  {
    id: "py-b15-b2-descriptor-set-name",
    language: "python",
    title: "__set_name__ for descriptor self-configuration",
    tag: "classes",
    code: `class Validated:
    def __set_name__(self, owner, name):
        self._name = name           # called at class definition time

    def __get__(self, obj, objtype=None):
        if obj is None: return self
        return obj.__dict__.get(self._name)

    def __set__(self, obj, value):
        if not isinstance(value, (int, float)):
            raise TypeError(f"{self._name} must be numeric")
        obj.__dict__[self._name] = value

class Order:
    amount = Validated()    # __set_name__(Order, "amount") called here
    discount = Validated()  # __set_name__(Order, "discount") called

o = Order()
o.amount = 99.0    # ok
# o.amount = "hi" → TypeError: amount must be numeric`,
    explanation: "`__set_name__(owner, name)` is called by the metaclass at class creation with the attribute name the descriptor was assigned to — eliminates the need to pass the name manually to the descriptor.",
  },
  {
    id: "py-b15-b2-metaclass-register",
    language: "python",
    title: "Metaclass for automatic class registration",
    tag: "classes",
    code: `class CommandMeta(type):
    _commands: dict[str, type] = {}

    def __new__(mcs, name, bases, namespace):
        cls = super().__new__(mcs, name, bases, namespace)
        cmd_name = namespace.get("name")
        if cmd_name:
            mcs._commands[cmd_name] = cls
        return cls

class Command(metaclass=CommandMeta):
    name: str = ""
    def execute(self): ...

class QuitCommand(Command):
    name = "quit"
    def execute(self): print("Quitting")

class HelpCommand(Command):
    name = "help"
    def execute(self): print("Showing help")

print(CommandMeta._commands.keys())   # dict_keys(['quit', 'help'])
CommandMeta._commands["help"]().execute()   # Showing help`,
    explanation: "A metaclass's `__new__` runs for each class definition; capturing `name` from the namespace enables automatic registration without requiring a decorator on every subclass.",
  },
  {
    id: "py-b15-b2-super-cooperative",
    language: "python",
    title: "super() in cooperative multiple inheritance",
    tag: "classes",
    code: `class Logger:
    def process(self, data):
        print(f"[LOG] processing: {data}")
        return super().process(data)

class Validator:
    def process(self, data):
        assert data, "data must not be empty"
        return super().process(data)

class Base:
    def process(self, data):
        return data.upper()

class Pipeline(Logger, Validator, Base):
    pass

p = Pipeline()
print(p.process("hello"))
# [LOG] processing: hello
# HELLO  (Validator asserts, Base uppercases)`,
    explanation: "In cooperative multiple inheritance, each `super().process()` call follows the MRO chain — `Logger → Validator → Base` — ensuring every mixin's code runs even though no class knows about the others.",
  },
  {
    id: "py-b15-b2-property-cached",
    language: "python",
    title: "functools.cached_property for lazy instance attributes",
    tag: "classes",
    code: `from functools import cached_property
import hashlib

class Document:
    def __init__(self, text: str):
        self.text = text

    @cached_property
    def word_count(self) -> int:
        print("computing word_count")
        return len(self.text.split())

    @cached_property
    def digest(self) -> str:
        return hashlib.md5(self.text.encode()).hexdigest()

doc = Document("the quick brown fox")
print(doc.word_count)   # computing word_count → 4
print(doc.word_count)   # 4  (from __dict__, no recomputation)
print("word_count" in doc.__dict__)   # True`,
    explanation: "`cached_property` computes the value once on first access, stores it in the instance's `__dict__`, and never calls the function again — cheaper than `lru_cache` for per-instance computations.",
  },
  {
    id: "py-b15-b2-enum-methods",
    language: "python",
    title: "Enum with custom methods",
    tag: "structures",
    code: `from enum import Enum

class Planet(Enum):
    MERCURY = (3.303e+23, 2.4397e6)
    VENUS   = (4.869e+24, 6.0518e6)
    EARTH   = (5.976e+24, 6.37814e6)

    def __init__(self, mass, radius):
        self.mass = mass
        self.radius = radius

    @property
    def surface_gravity(self):
        G = 6.67430e-11
        return G * self.mass / (self.radius ** 2)

    def weight(self, earth_weight):
        return earth_weight * self.surface_gravity / Planet.EARTH.surface_gravity

print(f"{Planet.EARTH.surface_gravity:.2f}")   # 9.80
print(f"{Planet.MARS.weight(75):.2f}" if hasattr(Planet, "MARS") else "no Mars")`,
    explanation: "Enum members can hold per-member data via a custom `__init__` that receives the tuple value; adding `@property` and regular methods makes enums behaviour-rich domain objects.",
  },
  {
    id: "py-b15-b2-enum-functional",
    language: "python",
    title: "Functional Enum creation",
    tag: "structures",
    code: `from enum import Enum, IntEnum

# Functional API: create an Enum from a list of names
Color = Enum("Color", ["RED", "GREEN", "BLUE"])
print(Color.RED)          # Color.RED
print(Color.RED.value)    # 1  (auto-assigned)

# From a mapping — control values
Status = Enum("Status", {"PENDING": "pending", "DONE": "done"})
print(Status.PENDING.value)   # pending

# IntEnum functional form
Priority = IntEnum("Priority", {"LOW": 1, "MED": 5, "HIGH": 10})
print(Priority.HIGH > Priority.LOW)   # True (int comparison)`,
    explanation: "The functional form `Enum(name, names)` creates an Enum class dynamically — useful when member names come from a config file or database at runtime rather than being hardcoded.",
  },
  {
    id: "py-b15-b2-typing-typeddict-total-false",
    language: "python",
    title: "TypedDict with total=False for optional keys",
    tag: "types",
    code: `from typing import TypedDict, Required, NotRequired

# All keys optional
class Config(TypedDict, total=False):
    host: str
    port: int
    debug: bool

cfg: Config = {"host": "localhost"}   # port and debug may be absent

# Mix required and optional (Python 3.11+)
class Server(TypedDict):
    host: Required[str]   # must be present
    port: Required[int]
    debug: NotRequired[bool]  # optional

s: Server = {"host": "localhost", "port": 8080}  # debug omitted: ok`,
    explanation: "`total=False` makes all keys optional; `Required` and `NotRequired` (Python 3.11+) let you mix required and optional keys in a single `TypedDict` class.",
  },
  {
    id: "py-b15-b2-typing-final",
    language: "python",
    title: "typing.Final and @final decorator",
    tag: "types",
    code: `from typing import Final, final

# Final: constant that shouldn't be reassigned
MAX_RETRIES: Final[int] = 3
# MAX_RETRIES = 4  → mypy error: Cannot assign to final name

# Final without annotation: value inferred
API_URL: Final = "https://api.example.com"

class Base:
    @final
    def must_not_override(self):
        return "base"

class Child(Base):
    # def must_not_override(self): ...  → mypy error: Cannot override final method
    pass

print(Child().must_not_override())  # base`,
    explanation: "`Final[T]` tells the type checker a variable must not be reassigned; `@final` marks a method or class that must not be overridden or subclassed.",
  },
  {
    id: "py-b15-b2-typing-self",
    language: "python",
    title: "typing.Self for fluent builder pattern",
    tag: "types",
    code: `from typing import Self

class QueryBuilder:
    def __init__(self):
        self._parts: list[str] = []

    def select(self, *cols: str) -> Self:
        self._parts.append(f"SELECT {', '.join(cols)}")
        return self

    def where(self, condition: str) -> Self:
        self._parts.append(f"WHERE {condition}")
        return self

    def build(self) -> str:
        return " ".join(self._parts)

class PgQueryBuilder(QueryBuilder):
    def limit(self, n: int) -> Self:
        self._parts.append(f"LIMIT {n}")
        return self

# Self preserves the concrete subtype through chaining
q = PgQueryBuilder().select("id", "name").where("age > 18").limit(10)
print(q.build())   # SELECT id, name WHERE age > 18 LIMIT 10`,
    explanation: "`Self` (Python 3.11+) annotates a method return type as \"the same type as `self`\"; in subclasses the type checker correctly infers the subclass type, not the base class.",
  },
  {
    id: "py-b15-b2-typing-override",
    language: "python",
    title: "@override decorator for safe method overriding",
    tag: "types",
    code: `from typing import override  # Python 3.12+

class Animal:
    def speak(self) -> str:
        return ""

    def move(self) -> None:
        print("moving")

class Dog(Animal):
    @override
    def speak(self) -> str:   # type checker verifies a base method exists
        return "Woof!"

    @override
    def move(self) -> None:   # ok
        print("running")

    # @override
    # def fly(self): ...      # mypy error: not in base class

print(Dog().speak())   # Woof!`,
    explanation: "`@override` (Python 3.12+) is a type-checker hint that verifies the annotated method actually overrides a base class method — catches typos in method names and base class renames.",
  },
  {
    id: "py-b15-b2-typing-never",
    language: "python",
    title: "typing.Never for exhaustive checks",
    tag: "types",
    code: `from typing import Never, assert_never

type Shape = "Circle | Rect | Triangle"

def area(shape) -> float:
    match shape:
        case {"kind": "circle", "r": r}:
            import math; return math.pi * r * r
        case {"kind": "rect",   "w": w, "h": h}:
            return w * h
        # Forgetting "triangle" here would NOT be a type error without Never

def process(shape) -> float:
    if isinstance(shape, dict) and shape.get("kind") == "circle":
        return area(shape)
    # ... other cases ...
    else:
        assert_never(shape)   # mypy error if this branch is reachable`,
    explanation: "`Never` is the bottom type — a value of type `Never` can never exist. `assert_never(x)` causes a type-checker error if `x` is not provably unreachable, enabling exhaustiveness checking.",
  },
  {
    id: "py-b15-b2-pathlib-write-read",
    language: "python",
    title: "pathlib read_text / write_text / iterdir",
    tag: "snippet",
    code: `from pathlib import Path

tmp = Path("/tmp/demo_dir")
tmp.mkdir(parents=True, exist_ok=True)

# write_text and read_text: no open() needed
(tmp / "hello.txt").write_text("Hello, pathlib!\n", encoding="utf-8")
content = (tmp / "hello.txt").read_text(encoding="utf-8")
print(content.strip())   # Hello, pathlib!

# iterdir: list directory entries
for p in tmp.iterdir():
    print(p.name, p.is_file())

# glob with pattern
py_files = list(tmp.parent.glob("**/*.txt"))
print(len(py_files))`,
    explanation: "`Path.write_text` / `read_text` eliminate boilerplate `open()` calls; `iterdir()` lists a directory; `glob` / `rglob` find files matching a pattern recursively.",
  },
  {
    id: "py-b15-b2-os-environ",
    language: "python",
    title: "os.environ and environment variable patterns",
    tag: "snippet",
    code: `import os

# Read with default
debug = os.environ.get("DEBUG", "false").lower() == "true"
port  = int(os.environ.get("PORT", "8080"))
db    = os.environ.get("DATABASE_URL") or "sqlite:///default.db"

print(port, debug)   # 8080 False

# Set a variable in current process only
os.environ["MY_VAR"] = "hello"
print(os.environ["MY_VAR"])    # hello

# Check existence without getting value
if "SECRET_KEY" not in os.environ:
    raise RuntimeError("SECRET_KEY env var must be set")`,
    explanation: "`os.environ.get(key, default)` is the safe way to read env vars; `os.environ[key]` raises `KeyError` if absent. Changes to `os.environ` affect only the current process and its children.",
  },
  {
    id: "py-b15-b2-subprocess-run",
    language: "python",
    title: "subprocess.run for external commands",
    tag: "snippet",
    code: `import subprocess

# Run a command, capture output
result = subprocess.run(
    ["echo", "hello world"],
    capture_output=True,
    text=True,          # decode bytes to str
    check=True,         # raise CalledProcessError if exit code != 0
)
print(result.stdout.strip())   # hello world
print(result.returncode)       # 0

# Shell string (avoid unless necessary — injection risk)
# subprocess.run("echo $HOME", shell=True, capture_output=True)

# Timeout prevents hangs
try:
    subprocess.run(["sleep", "10"], timeout=1)
except subprocess.TimeoutExpired:
    print("timed out")`,
    explanation: "`subprocess.run` is the high-level API for running external commands; `check=True` turns non-zero exit codes into exceptions, `capture_output=True` captures stdout/stderr as strings.",
  },
  {
    id: "py-b15-b2-shutil-patterns",
    language: "python",
    title: "shutil for file and directory operations",
    tag: "snippet",
    code: `import shutil
from pathlib import Path

src = Path("/tmp/source.txt")
src.write_text("hello")

# Copy file (with metadata)
shutil.copy2(src, "/tmp/dest.txt")

# Copy directory tree
# shutil.copytree("/tmp/src_dir", "/tmp/dst_dir")

# Move file or directory
# shutil.move("/tmp/dest.txt", "/tmp/moved.txt")

# Remove directory tree
# shutil.rmtree("/tmp/dir_to_remove")

# Disk usage
usage = shutil.disk_usage("/")
print(f"Free: {usage.free // 1_073_741_824} GB")`,
    explanation: "`shutil` provides high-level file operations: `copy2` preserves metadata, `copytree` copies directories recursively, `move` works across filesystems, and `disk_usage` reports free space.",
  },
  {
    id: "py-b15-b2-logging-config",
    language: "python",
    title: "Configuring logging with dictConfig",
    tag: "snippet",
    code: `import logging
import logging.config

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "simple": {"format": "%(levelname)s %(name)s: %(message)s"},
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "simple",
        },
    },
    "root": {"level": "DEBUG", "handlers": ["console"]},
}

logging.config.dictConfig(LOGGING)
log = logging.getLogger(__name__)
log.info("configured")     # INFO __main__: configured
log.warning("careful")     # WARNING __main__: careful`,
    explanation: "`dictConfig` is the recommended way to configure logging in production; the dict can come from a JSON/YAML file. It configures all loggers, handlers, and formatters in one call.",
  },
  {
    id: "py-b15-b2-logging-exception",
    language: "python",
    title: "logging.exception includes traceback",
    tag: "snippet",
    code: `import logging

logging.basicConfig(level=logging.DEBUG)
log = logging.getLogger(__name__)

def risky():
    return 1 / 0

try:
    risky()
except ZeroDivisionError:
    # log.error("failed") would log without traceback
    log.exception("Division failed")  # includes full traceback

# Output:
# ERROR __main__: Division failed
# Traceback (most recent call last):
#   File "...", line 6, in risky
# ZeroDivisionError: division by zero`,
    explanation: "`log.exception(msg)` logs at ERROR level and automatically appends the current exception's traceback — the one-liner replacement for `log.error(msg, exc_info=True)` inside an `except` block.",
  },
  {
    id: "py-b15-b2-re-named-groups",
    language: "python",
    title: "re named groups for readable extraction",
    tag: "snippet",
    code: `import re

LOG_LINE = "2024-01-15 14:32:05 ERROR api.views: timeout after 30s"

pattern = re.compile(
    r"(?P<date>\d{4}-\d{2}-\d{2}) "
    r"(?P<time>\d{2}:\d{2}:\d{2}) "
    r"(?P<level>\w+) "
    r"(?P<logger>[\w.]+): "
    r"(?P<message>.+)"
)

m = pattern.match(LOG_LINE)
if m:
    print(m.group("date"))     # 2024-01-15
    print(m.group("level"))    # ERROR
    print(m.groupdict())       # {'date': '2024-01-15', 'time': '14:32:05', ...}`,
    explanation: "`(?P<name>...)` creates a named group; `m.group('name')` or `m.groupdict()` extracts it by name — far more readable than positional `group(1)`, `group(2)` when there are many groups.",
  },
  {
    id: "py-b15-b2-re-sub-function",
    language: "python",
    title: "re.sub with a replacement function",
    tag: "snippet",
    code: `import re

# Replace each number with its double
text = "I have 3 cats and 10 dogs and 1 bird"

def double_number(m):
    return str(int(m.group()) * 2)

result = re.sub(r"\d+", double_number, text)
print(result)   # I have 6 cats and 20 dogs and 2 birds

# Redact emails with a lambda
emails = "Contact alice@example.com or bob@test.org"
redacted = re.sub(r"[\w.+-]+@[\w-]+\.\w+", lambda m: "***@***", emails)
print(redacted)   # Contact ***@*** or ***@***`,
    explanation: "When `re.sub` receives a callable as the replacement, it passes each `Match` object to the function and uses the return value — enabling per-match logic impossible with a fixed string.",
  },
  {
    id: "py-b15-b2-struct-pack",
    language: "python",
    title: "struct.pack / unpack for binary data",
    tag: "snippet",
    code: `import struct

# Pack: Python values → bytes (big-endian: >, little-endian: <)
data = struct.pack(">HHI", 1, 2, 3)  # 2 unsigned shorts + 1 unsigned int
print(data.hex())      # 00010002 00000003
print(len(data))       # 8 bytes

# Unpack: bytes → Python values
a, b, c = struct.unpack(">HHI", data)
print(a, b, c)   # 1 2 3

# struct.Struct reuses the format string (faster in loops)
fmt = struct.Struct("<f")   # little-endian float
for x in [1.5, 2.5, 3.5]:
    print(fmt.pack(x).hex())`,
    explanation: "`struct.pack/unpack` converts between Python values and C-layout binary data; use `struct.Struct` when applying the same format repeatedly to avoid re-parsing the format string.",
  },
  {
    id: "py-b15-b2-hashlib-usage",
    language: "python",
    title: "hashlib for cryptographic hashing",
    tag: "snippet",
    code: `import hashlib

data = b"Hello, World!"

# MD5 (not for security — use for checksums)
md5 = hashlib.md5(data).hexdigest()
print(md5)   # 65a8e27d8879283831b664bd8b7f0ad4

# SHA-256 for secure hashing
sha256 = hashlib.sha256(data).hexdigest()
print(sha256[:16])   # dffd6021bb2b...

# Streaming hash for large files
h = hashlib.sha256()
for chunk in [b"part1", b"part2", b"part3"]:
    h.update(chunk)
print(h.hexdigest()[:16])   # same as sha256(b"part1part2part3")[:16]`,
    explanation: "`hashlib` provides cryptographic hash functions; use `.update()` to hash data in chunks (for large files) without loading everything into memory. Use SHA-256+ for security, MD5 only for checksums.",
  },
  {
    id: "py-b15-b2-secrets-module",
    language: "python",
    title: "secrets module for cryptographic randomness",
    tag: "snippet",
    code: `import secrets
import string

# Secure token for URL-safe API keys
token = secrets.token_urlsafe(32)
print(token)   # e.g. "XY3z..." — 43 chars, URL-safe base64

# Hex token
hex_token = secrets.token_hex(16)  # 32 hex chars = 128 bits
print(hex_token)

# Secure random integer in range
idx = secrets.randbelow(100)  # 0 to 99

# Secure random password
alphabet = string.ascii_letters + string.digits + "!@#$"
password = "".join(secrets.choice(alphabet) for _ in range(16))
print(password)`,
    explanation: "`secrets` uses the OS's cryptographically secure RNG — always use it instead of `random` for passwords, tokens, nonces, and any security-sensitive random value.",
  },
  {
    id: "py-b15-b2-uuid-module",
    language: "python",
    title: "uuid module for unique identifiers",
    tag: "snippet",
    code: `import uuid

# UUID4: random (most common)
u4 = uuid.uuid4()
print(u4)               # e.g. 550e8400-e29b-41d4-a716-446655440000
print(str(u4))          # string form
print(u4.hex)           # without hyphens

# UUID5: deterministic from a namespace + name
ns = uuid.NAMESPACE_URL
u5 = uuid.uuid5(ns, "https://example.com")
print(u5)               # deterministic

# Parse a UUID string
u = uuid.UUID("550e8400-e29b-41d4-a716-446655440000")
print(u.version)        # None (v4 has random bytes)`,
    explanation: "`uuid.uuid4()` generates a random 128-bit UUID; `uuid.uuid5()` is reproducible for the same (namespace, name) pair — useful for content-addressable identifiers.",
  },
  {
    id: "py-b15-b2-statistics-module",
    language: "python",
    title: "statistics module for descriptive stats",
    tag: "snippet",
    code: `import statistics

data = [4, 7, 2, 9, 1, 5, 7, 3, 8, 6]

print(statistics.mean(data))      # 5.2
print(statistics.median(data))    # 5.5
print(statistics.mode([1,2,2,3])) # 2
print(statistics.stdev(data))     # 2.39...  (sample std dev)
print(statistics.pstdev(data))    # 2.27...  (population std dev)
print(statistics.variance(data))  # 5.73...

# NormalDist for probability calculations
nd = statistics.NormalDist(mean=5.2, stdev=2.4)
print(f"{nd.cdf(7):.3f}")         # cumulative probability P(X ≤ 7)`,
    explanation: "The `statistics` module covers common descriptive statistics in pure Python; `NormalDist` computes CDF and inverse CDF — useful for basic statistical modelling without NumPy.",
  },
  {
    id: "py-b15-b2-decimal-context",
    language: "python",
    title: "decimal.Context for rounding control",
    tag: "types",
    code: `from decimal import Decimal, ROUND_HALF_UP, ROUND_DOWN, localcontext

price = Decimal("19.999")

# Default rounding: ROUND_HALF_EVEN (banker's rounding)
print(price.quantize(Decimal("0.01")))          # 20.00

# Specific rounding mode
print(price.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))  # 20.00
print(price.quantize(Decimal("0.01"), rounding=ROUND_DOWN))     # 19.99

# localcontext: temporary context change
with localcontext() as ctx:
    ctx.prec = 4
    ctx.rounding = ROUND_HALF_UP
    print(Decimal("1") / Decimal("3"))  # 0.3333`,
    explanation: "`Decimal.quantize(places, rounding=...)` rounds to a specific number of decimal places with the chosen rounding mode; `localcontext()` changes the default without affecting global state.",
  },
  {
    id: "py-b15-b2-fractions-exact",
    language: "python",
    title: "fractions.Fraction for exact rational arithmetic",
    tag: "types",
    code: `from fractions import Fraction

# Exact rational arithmetic
a = Fraction(1, 3)
b = Fraction(1, 6)

print(a + b)          # 1/2  (not 0.49999...)
print(a * b)          # 1/18
print(a == Fraction(2, 6))   # True  (auto-reduced)

# From float (warning: may be imprecise)
print(Fraction(0.1))          # 3602879701896397/36028797018963968
print(Fraction("0.1"))        # 1/10  — from string is exact

# Use case: unit conversions without rounding errors
inch = Fraction(1, 12)    # 1 foot = 12 inches
feet = Fraction(5, 2)     # 2.5 feet
print(feet / inch)        # 30  (exact)`,
    explanation: "`Fraction` represents rational numbers exactly; constructing from a string `Fraction('0.1')` gives `1/10`, while `Fraction(0.1)` inherits the float's imprecision.",
  },
  {
    id: "py-b15-b2-operator-module",
    language: "python",
    title: "operator module as faster function equivalents",
    tag: "snippet",
    code: `import operator
from functools import reduce

# operator functions are faster than lambdas
items = [(1, "z"), (2, "a"), (3, "m")]
items.sort(key=operator.itemgetter(1))
print(items)   # [(2, 'a'), (3, 'm'), (1, 'z')]

# attrgetter for nested attributes
from dataclasses import dataclass
@dataclass
class Point:
    x: float; y: float

pts = [Point(3, 1), Point(1, 2), Point(2, 0)]
pts.sort(key=operator.attrgetter("y"))

# reduce with operator functions
print(reduce(operator.mul, [1, 2, 3, 4, 5]))   # 120
print(reduce(operator.or_,  [{1,2}, {2,3}, {3,4}]))  # {1,2,3,4}`,
    explanation: "`operator.itemgetter`, `attrgetter`, `methodcaller` are faster than equivalent lambdas and cleaner for functional pipelines; they also support multiple keys in one call.",
  },
  {
    id: "py-b15-b2-copy-replace",
    language: "python",
    title: "copy.replace() for updating frozen/slots objects",
    tag: "snippet",
    code: `import copy

# Python 3.13+: copy.replace() for any object with __replace__
# Works on dataclasses, namedtuples, and custom __replace__ classes

from dataclasses import dataclass

@dataclass(frozen=True)
class Config:
    host: str
    port: int
    debug: bool = False

c1 = Config("localhost", 5432)
c2 = copy.replace(c1, port=5433, debug=True)

print(c1)   # Config(host='localhost', port=5432, debug=False)
print(c2)   # Config(host='localhost', port=5433, debug=True)`,
    explanation: "`copy.replace(obj, **changes)` (Python 3.13+) is a protocol-based generalization of namedtuple's `_replace` and dataclass's `replace` — works with any class that implements `__replace__`.",
  },
  {
    id: "py-b15-b2-pep695-type-alias",
    language: "python",
    title: "PEP 695 type statement (Python 3.12+)",
    tag: "types",
    code: `# Old syntax
from typing import TypeAlias
Vector: TypeAlias = list[float]

# PEP 695 new syntax (Python 3.12+) — cleaner
type Point = tuple[float, float]
type Matrix[T] = list[list[T]]    # generic type alias

# Generic function with new syntax
def first[T](items: list[T]) -> T:
    return items[0]

# Generic class
class Stack[T]:
    def __init__(self) -> None:
        self._items: list[T] = []
    def push(self, item: T) -> None:
        self._items.append(item)
    def pop(self) -> T:
        return self._items.pop()`,
    explanation: "PEP 695 introduces `type Name = ...` for type aliases and `[T]` syntax for generic classes and functions, replacing the verbose `TypeVar` + `Generic[T]` pattern.",
  },
  {
    id: "py-b15-b2-sys-getsizeof",
    language: "python",
    title: "sys.getsizeof for object memory size",
    tag: "snippet",
    code: `import sys

print(sys.getsizeof(0))         # 24 bytes (Python int object)
print(sys.getsizeof(2**30))     # 28 bytes (slightly larger int)
print(sys.getsizeof(""))        # 49 bytes (empty string)
print(sys.getsizeof("hello"))   # 54 bytes
print(sys.getsizeof([]))        # 56 bytes (empty list)
print(sys.getsizeof([1,2,3]))   # 88 bytes (with 3 items)

# Note: getsizeof only counts the top-level object, not nested ones
lst = [[1,2,3], [4,5,6]]
print(sys.getsizeof(lst))  # 72 bytes — does NOT count inner lists

import tracemalloc
tracemalloc.start()
big = list(range(10_000))
_, peak = tracemalloc.get_traced_memory()
print(f"peak: {peak:,} bytes")`,
    explanation: "`sys.getsizeof` returns the shallow size of an object; for the total recursive size use `tracemalloc` or sum `getsizeof` over all sub-objects with `gc.get_referents`.",
  },
  {
    id: "py-b15-b2-dis-module",
    language: "python",
    title: "dis module to inspect bytecode",
    tag: "snippet",
    code: `import dis

def add(a, b):
    return a + b

dis.dis(add)
# LOAD_FAST 0 (a)
# LOAD_FAST 1 (b)
# BINARY_OP 0 (+)
# RETURN_VALUE

# Compare two idioms: which is faster?
def concat_plus(items):
    result = ""
    for s in items:
        result += s
    return result

def concat_join(items):
    return "".join(items)

# inspect bytecode count
print(len(dis.Bytecode(concat_plus)))   # more instructions`,
    explanation: "`dis.dis(fn)` shows the CPython bytecode for a function; useful for understanding performance differences between two idioms and diagnosing unexpected LEGB lookups.",
  },
  {
    id: "py-b15-b2-abc-virtual-subclass",
    language: "python",
    title: "ABC.register for virtual subclasses",
    tag: "classes",
    code: `from abc import ABC, abstractmethod

class Drawable(ABC):
    @abstractmethod
    def draw(self): ...

# Third-party class we can't modify
class ExternalCircle:
    def draw(self): print("external circle")

# Register as virtual subclass — no inheritance required
Drawable.register(ExternalCircle)

ec = ExternalCircle()
print(isinstance(ec, Drawable))    # True (registered)
print(issubclass(ExternalCircle, Drawable))  # True

# Limitation: abstract method contract is NOT enforced
class BadShape:
    pass   # no draw()
Drawable.register(BadShape)
# isinstance(BadShape(), Drawable) → True  (but BadShape.draw missing!)`,
    explanation: "`ABC.register(cls)` makes `cls` a virtual subclass — `isinstance` and `issubclass` return `True` — without actual inheritance. Useful for adapting third-party classes, but the abstract interface is not enforced.",
  },
  {
    id: "py-b15-b2-multiple-inherit-mro",
    language: "python",
    title: "Resolving diamond inheritance with super()",
    tag: "classes",
    code: `class Base:
    def greet(self):
        print("Base.greet")

class Left(Base):
    def greet(self):
        print("Left.greet")
        super().greet()

class Right(Base):
    def greet(self):
        print("Right.greet")
        super().greet()

class Diamond(Left, Right):
    def greet(self):
        print("Diamond.greet")
        super().greet()

Diamond().greet()
# Diamond.greet
# Left.greet
# Right.greet
# Base.greet   ← called once, not twice

print(Diamond.__mro__)
# [Diamond, Left, Right, Base, object]`,
    explanation: "With cooperative `super()` calls each class in the MRO runs exactly once; without it `Base.greet` would be called twice or Right's override would be skipped.",
  },
  {
    id: "py-b15-b2-new-vs-init",
    language: "python",
    title: "__new__ vs __init__: object creation vs initialisation",
    tag: "classes",
    code: `class Singleton:
    _instance = None

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance   # always return same object

    def __init__(self, value):
        self.value = value     # called each time even for same instance

a = Singleton(1)
b = Singleton(2)
print(a is b)        # True  — same object
print(a.value)       # 2  — __init__ ran again with new value!`,
    explanation: "`__new__` controls object creation and returns the instance; `__init__` receives the instance and initialises it. `__init__` is called every time, even if `__new__` returns an existing object.",
  },
  {
    id: "py-b15-b2-class-creation-hooks",
    language: "python",
    title: "__prepare__ metaclass hook for ordered namespace",
    tag: "classes",
    code: `from collections import OrderedDict

class OrderedMeta(type):
    @classmethod
    def __prepare__(mcs, name, bases, **kwargs):
        # Returns the mapping used to collect class body
        return OrderedDict()

    def __new__(mcs, name, bases, namespace):
        cls = super().__new__(mcs, name, bases, namespace)
        # Store definition order of methods
        cls._method_order = [k for k, v in namespace.items()
                              if callable(v) and not k.startswith("_")]
        return cls

class API(metaclass=OrderedMeta):
    def create(self): ...
    def read(self): ...
    def update(self): ...
    def delete(self): ...

print(API._method_order)   # ['create', 'read', 'update', 'delete']`,
    explanation: "`__prepare__` returns the namespace dict used to execute the class body; returning an `OrderedDict` (or dict since Python 3.7) captures attribute definition order for introspection.",
  },
  {
    id: "py-b15-b2-types-simplenamespace",
    language: "python",
    title: "types.SimpleNamespace for ad-hoc objects",
    tag: "snippet",
    code: `from types import SimpleNamespace

# Lightweight container for named attributes
config = SimpleNamespace(
    host="localhost",
    port=5432,
    debug=False,
)

print(config.host)     # localhost
config.timeout = 30    # add attribute dynamically
del config.debug       # delete attribute

# Useful for converting dicts to attribute-access objects
d = {"x": 1, "y": 2}
ns = SimpleNamespace(**d)
print(ns.x, ns.y)      # 1 2`,
    explanation: "`SimpleNamespace` is a trivial class with `__init__(**kwargs)` and `__repr__` — essentially `object` with a writable `__dict__`. Use it instead of bare `object()` when you want attribute-style access to a dict.",
  },
  {
    id: "py-b15-b2-contextvars",
    language: "python",
    title: "contextvars.ContextVar for async-safe context",
    tag: "snippet",
    code: `import asyncio
from contextvars import ContextVar

request_id: ContextVar[str] = ContextVar("request_id", default="none")

async def handle_request(rid: str):
    token = request_id.set(rid)   # set for this task only
    await process()
    request_id.reset(token)

async def process():
    print(f"processing request: {request_id.get()}")

async def main():
    await asyncio.gather(
        handle_request("req-1"),
        handle_request("req-2"),
    )

asyncio.run(main())
# processing request: req-1
# processing request: req-2   (each task has its own value)`,
    explanation: "`ContextVar` stores a value per-context (each asyncio Task gets its own context), making it safe for request-scoped data like request IDs, users, or database connections.",
  },
  {
    id: "py-b15-b2-tempfile-usage",
    language: "python",
    title: "tempfile for safe temporary files",
    tag: "snippet",
    code: `import tempfile
from pathlib import Path

# Auto-deleted named temp file
with tempfile.NamedTemporaryFile(mode="w", suffix=".csv", delete=True) as f:
    f.write("name,score\n")
    f.write("Alice,95\n")
    print(f.name)   # e.g. /tmp/tmpXXXXXX.csv

# Auto-deleted temp directory
with tempfile.TemporaryDirectory() as tmp:
    p = Path(tmp) / "data.json"
    p.write_text('{"ok": true}')
    print(list(Path(tmp).iterdir()))

# Both are deleted when the with block exits`,
    explanation: "`tempfile.NamedTemporaryFile` and `TemporaryDirectory` create secure temp resources that are automatically cleaned up when the `with` block exits — no manual `os.unlink` needed.",
  },
  {
    id: "py-b15-b2-inspect-signature",
    language: "python",
    title: "inspect.signature for runtime introspection",
    tag: "snippet",
    code: `import inspect

def greet(name: str, *, greeting: str = "Hello") -> str:
    return f"{greeting}, {name}!"

sig = inspect.signature(greet)
print(sig)                               # (name: str, *, greeting: str = 'Hello') -> str

for name, param in sig.parameters.items():
    print(name, param.kind, param.default)

# Useful for building decorators that validate arguments
def validate_types(fn):
    sig = inspect.signature(fn)
    hints = fn.__annotations__
    def wrapper(**kwargs):
        for k, v in kwargs.items():
            if k in hints and not isinstance(v, hints[k]):
                raise TypeError(f"{k} must be {hints[k].__name__}")
        return fn(**kwargs)
    return wrapper`,
    explanation: "`inspect.signature` returns a `Signature` with `Parameter` objects describing each argument's kind, default value, and annotation — the foundation for building validation decorators.",
  },
  {
    id: "py-b15-b2-zipfile-usage",
    language: "python",
    title: "zipfile module for reading and writing ZIPs",
    tag: "snippet",
    code: `import zipfile, io

# Write a ZIP in memory
buf = io.BytesIO()
with zipfile.ZipFile(buf, "w", compression=zipfile.ZIP_DEFLATED) as zf:
    zf.writestr("hello.txt", "Hello, ZIP!")
    zf.writestr("data/info.json", '{"version": 1}')

# Read it back
buf.seek(0)
with zipfile.ZipFile(buf, "r") as zf:
    print(zf.namelist())                 # ['hello.txt', 'data/info.json']
    text = zf.read("hello.txt").decode()
    print(text)                          # Hello, ZIP!`,
    explanation: "`zipfile.ZipFile` works with files on disk or in-memory `BytesIO` buffers; `writestr` adds content without needing an actual file — useful for building ZIP archives programmatically.",
  },
  {
    id: "py-b15-b2-json-custom",
    language: "python",
    title: "json with custom encoder and decoder",
    tag: "snippet",
    code: `import json
from datetime import date

class DateEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, date):
            return {"__date__": obj.isoformat()}
        return super().default(obj)

def date_decoder(d):
    if "__date__" in d:
        return date.fromisoformat(d["__date__"])
    return d

data = {"name": "Alice", "birthday": date(1990, 5, 15)}
json_str = json.dumps(data, cls=DateEncoder)
print(json_str)   # {"name": "Alice", "birthday": {"__date__": "1990-05-15"}}

restored = json.loads(json_str, object_hook=date_decoder)
print(restored["birthday"])   # 1990-05-15  (a date object)`,
    explanation: "Subclass `json.JSONEncoder` and override `default` to handle custom types; pass `object_hook` to `json.loads` to reconstruct them on the way out.",
  },
  {
    id: "py-b15-b2-configparser-fallback",
    language: "python",
    title: "ConfigParser interpolation and fallbacks",
    tag: "snippet",
    code: `import configparser, io

INI = """
[DEFAULT]
base_url = https://api.example.com

[production]
base_url = https://api.prod.com
timeout = 30

[development]
timeout = 5
debug = true
"""

cfg = configparser.ConfigParser()
cfg.read_string(INI)

# DEFAULT values act as fallback for all sections
print(cfg["development"]["base_url"])  # https://api.example.com (from DEFAULT)
print(cfg["development"]["timeout"])   # 5
print(cfg.get("development", "debug", fallback="false"))  # true`,
    explanation: "`configparser` reads INI files; the `[DEFAULT]` section provides fallbacks for all sections. `.get(section, key, fallback=...)` returns the fallback instead of raising `NoOptionError`.",
  },
  {
    id: "py-b15-b2-pprint-depth",
    language: "python",
    title: "pprint for readable nested structures",
    tag: "snippet",
    code: `import pprint

data = {
    "users": [
        {"id": 1, "name": "Alice", "roles": ["admin", "editor"]},
        {"id": 2, "name": "Bob",   "roles": ["viewer"]},
    ],
    "total": 2,
    "metadata": {"version": "1.0", "generated": "2024-01-15"},
}

pprint.pprint(data, depth=2, width=60)
# {'metadata': {'generated': '2024-01-15', 'version': '1.0'},
#  'total': 2,
#  'users': [{...}, {...}]}  ← depth=2 truncates deeper levels`,
    explanation: "`pprint.pprint(obj, depth=N, width=W)` pretty-prints nested structures; `depth` limits how many levels deep to expand (showing `{...}` for truncated objects), `width` sets the line width.",
  },
  {
    id: "py-b15-b2-textwrap-dedent",
    language: "python",
    title: "textwrap.dedent removes common leading whitespace",
    tag: "snippet",
    code: `import textwrap

def describe():
    text = """
        Hello world.
        This is indented because
        it's inside a function.
    """
    return textwrap.dedent(text).strip()

print(describe())
# Hello world.
# This is indented because
# it's inside a function.

# fill: wraps long text to a width
long = "Python is a versatile, high-level programming language known for its readable syntax."
print(textwrap.fill(long, width=40))`,
    explanation: "`textwrap.dedent` strips the common leading whitespace from all lines, letting you indent multi-line strings inside functions without affecting the output; `fill` wraps text to a column width.",
  },
  {
    id: "py-b15-b2-string-interning",
    language: "python",
    title: "sys.intern for string deduplication",
    tag: "types",
    code: `import sys

# CPython automatically interns short, identifier-like strings
a = "hello"
b = "hello"
print(a is b)   # True (automatically interned)

# Strings with spaces or special chars may NOT be interned automatically
x = "hello world"
y = "hello world"
print(x is y)   # False in most contexts

# Force interning for comparison speed in hot loops
x2 = sys.intern("hello world")
y2 = sys.intern("hello world")
print(x2 is y2)   # True — same object, O(1) identity check`,
    explanation: "`sys.intern(s)` ensures only one copy of a string is kept in memory; subsequent `intern` calls with the same value return the same object, enabling O(1) `is` comparison instead of O(n) `==`.",
  },
  {
    id: "py-b15-b2-signal-handler",
    language: "python",
    title: "signal module for OS signal handling",
    tag: "snippet",
    code: `import signal, sys

shutdown_requested = False

def graceful_shutdown(signum, frame):
    global shutdown_requested
    print(f"\nReceived signal {signum}, shutting down gracefully...")
    shutdown_requested = True

signal.signal(signal.SIGINT,  graceful_shutdown)   # Ctrl+C
signal.signal(signal.SIGTERM, graceful_shutdown)   # kill command

import time
print("Running. Press Ctrl+C to stop.")
while not shutdown_requested:
    time.sleep(0.1)
print("Shutdown complete.")`,
    explanation: "`signal.signal(sig, handler)` registers a Python function to run when the process receives an OS signal; use it to implement graceful shutdown on `SIGTERM`/`SIGINT` instead of abrupt termination.",
  },
  {
    id: "py-b15-b2-multiprocessing-shared",
    language: "python",
    title: "multiprocessing.Value and Array for shared state",
    tag: "snippet",
    code: `from multiprocessing import Process, Value, Array
import ctypes

def worker(counter, data):
    counter.value += 1      # atomic? No — use Lock for safety
    for i in range(len(data)):
        data[i] *= 2

counter = Value(ctypes.c_int, 0)
data    = Array(ctypes.c_double, [1.0, 2.0, 3.0])

p = Process(target=worker, args=(counter, data))
p.start()
p.join()

print(counter.value)        # 1
print(list(data))           # [2.0, 4.0, 6.0]`,
    explanation: "`multiprocessing.Value` and `Array` create objects in shared memory, visible to all processes; they use `ctypes` type codes and optionally a lock — combine with `multiprocessing.Lock` for true atomicity.",
  },
  {
    id: "py-b15-b2-frozenset-as-key",
    language: "python",
    title: "frozenset as a dict key for unordered sets of items",
    tag: "structures",
    code: `# Track which unordered pairs of nodes have edges
edges = {}
edges[frozenset(("A", "B"))] = {"weight": 1.5}
edges[frozenset(("B", "C"))] = {"weight": 2.0}

# Look up in any order
print(edges[frozenset(("B", "A"))]["weight"])   # 1.5  — same key!

# Use case: counting unique unordered item combinations
from collections import Counter
from itertools import combinations

basket = ["apple", "banana", "apple", "cherry"]
pair_counts = Counter(
    frozenset(pair) for pair in combinations(basket, 2)
)
print(pair_counts)`,
    explanation: "Since `frozenset` is hashable and order-independent, using it as a dict key lets you model undirected graph edges or unordered combinations without having to normalize the key order.",
  },
  {
    id: "py-b15-b2-understand-yield-from-return",
    language: "python",
    title: "yield from return value (trace)",
    tag: "understanding",
    code: `def sub_gen():
    yield 1
    yield 2
    return "sub done"   # value becomes return of yield from

def main_gen():
    result = yield from sub_gen()
    print(f"sub_gen returned: {result!r}")
    yield 3

gen = main_gen()
print(next(gen))   # 1
print(next(gen))   # 2
# sub_gen exhausted; main_gen receives "sub done" as yield-from return value
print(next(gen))
# sub_gen returned: 'sub done'
# 3`,
    explanation: "The value that a sub-generator passes to `StopIteration` (via `return`) becomes the value of the `yield from` expression in the delegating generator — useful for coroutine result passing.",
  },
  {
    id: "py-b15-b2-understand-deepcopy-memo",
    language: "python",
    title: "deepcopy memo dict prevents infinite recursion (trace)",
    tag: "understanding",
    code: `import copy

# A list that references itself (circular reference)
lst = [1, 2]
lst.append(lst)   # lst = [1, 2, [...]]

# Without memo tracking, deepcopy would recurse infinitely
deep = copy.deepcopy(lst)
print(deep[:2])           # [1, 2]
print(deep[2] is deep)    # True — the copy also references itself!

# The memo dict maps id(original) → copy
# When deepcopy encounters an already-copied id, it returns the copy
# This prevents infinite recursion and preserves sharing structure`,
    explanation: "`copy.deepcopy` uses a `memo` dict mapping `id(obj)` to the already-copied object; when a circular reference is encountered the existing copy is reused instead of recursing infinitely.",
  },
  {
    id: "py-b15-b2-understand-bytes-int",
    language: "python",
    title: "bytes vs bytearray mutability (trace)",
    tag: "understanding",
    code: `b = bytes([72, 101, 108, 108, 111])
print(b)           # b'Hello'
# b[0] = 104     # TypeError: 'bytes' object does not support item assignment

ba = bytearray([72, 101, 108, 108, 111])
ba[0] = 104        # lowercase 'h'
print(ba)          # bytearray(b'hello')
print(bytes(ba))   # b'hello'

# bytes is immutable (like str), bytearray is mutable (like list)
# Both are sequences of ints in range 0-255
print(b[0])        # 72  (int, not b'H')`,
    explanation: "`bytes` is an immutable sequence of integers (0-255); `bytearray` is the mutable version. Both index as `int`, not single-byte `bytes` — a common surprise for newcomers.",
  },
  {
    id: "py-b15-b2-caveat-mutable-class-var",
    language: "python",
    title: "List class variable mutation propagates to all instances",
    tag: "caveats",
    code: `class Team:
    members = []   # class-level list — shared!

t1 = Team()
t2 = Team()

t1.members.append("Alice")   # mutates the class variable
print(t2.members)             # ['Alice']  — !!

# Even 'reading' through an instance does not create a copy
print(t1.members is Team.members)   # True

# Fix: define mutable state in __init__
class Team2:
    def __init__(self):
        self.members = []   # per-instance

t3, t4 = Team2(), Team2()
t3.members.append("Alice")
print(t4.members)             # []  — independent`,
    explanation: "A mutable class variable is shared: mutating it through any instance (or the class) affects all references. Move mutable state to `__init__` to give each instance its own independent copy.",
  },
  {
    id: "py-b15-b2-comprehension-conditional",
    language: "python",
    title: "Comprehension with conditional expression",
    tag: "snippet",
    code: `data = [1, -2, 3, -4, 5]

# Filter (condition after 'for')
positives = [x for x in data if x > 0]
print(positives)   # [1, 3, 5]

# Transform (ternary before 'for')
abs_vals = [x if x > 0 else -x for x in data]
print(abs_vals)    # [1, 2, 3, 4, 5]

# Both: filter then transform
positive_squares = [x*x for x in data if x > 0]
print(positive_squares)   # [1, 9, 25]

# Nested with filter
matrix = [[1,-2,3],[-4,5,-6]]
flat_pos = [x for row in matrix for x in row if x > 0]
print(flat_pos)   # [1, 3, 5]`,
    explanation: "Comprehensions support both a trailing `if` filter and a ternary `value if cond else other` transform — they serve different purposes: filtering removes elements, the ternary maps every element.",
  },
  {
    id: "py-b15-b2-string-maketrans",
    language: "python",
    title: "str.maketrans for ROT13 and cipher tables",
    tag: "snippet",
    code: `import string

# ROT13: shift each letter by 13 positions
lower = string.ascii_lowercase
upper = string.ascii_uppercase

rot13_table = str.maketrans(
    lower + upper,
    lower[13:] + lower[:13] + upper[13:] + upper[:13]
)

print("Hello, World!".translate(rot13_table))  # Uryyb, Jbeyq!
print("Uryyb, Jbeyq!".translate(rot13_table))  # Hello, World!

# Remove punctuation
no_punct = str.maketrans("", "", string.punctuation)
print("Hello, World!".translate(no_punct))  # Hello World`,
    explanation: "`str.maketrans(from, to, delete)` builds a translation table; combined with `.translate()` it applies all character mappings in a single O(n) pass — efficient for ciphers and text normalisation.",
  },
  {
    id: "py-b15-b2-traceback-format",
    language: "python",
    title: "traceback module for formatting exceptions",
    tag: "snippet",
    code: `import traceback, io

def risky():
    return 1 / 0

try:
    risky()
except ZeroDivisionError as e:
    # Get traceback as a string (for logging, not printing)
    tb_str = traceback.format_exc()

    # Get individual parts
    lines = traceback.format_exception(type(e), e, e.__traceback__)

    # Pretty-print to a buffer
    buf = io.StringIO()
    traceback.print_exc(file=buf)
    print(buf.getvalue()[:80])`,
    explanation: "`traceback.format_exc()` captures the current exception's traceback as a string — the idiomatic way to include traceback details in log messages without printing to stderr.",
  },
  {
    id: "py-b15-b2-caveat-zip-unequal-length",
    language: "python",
    title: "zip truncates at shortest iterable",
    tag: "caveats",
    code: `names  = ["Alice", "Bob", "Carol", "Dave"]
scores = [90, 85, 92]

# zip stops at the SHORTEST iterable — Dave is silently dropped
for n, s in zip(names, scores):
    print(n, s)
# Alice 90  Bob 85  Carol 92  — Dave missing!

# itertools.zip_longest fills shorter iterables with a fill value
from itertools import zip_longest
for n, s in zip_longest(names, scores, fillvalue=0):
    print(n, s)
# Alice 90 / Bob 85 / Carol 92 / Dave 0`,
    explanation: "`zip` silently truncates at the shortest iterable; use `itertools.zip_longest` with a `fillvalue` when unequal lengths should be handled explicitly rather than ignored.",
  },
  {
    id: "py-b15-b2-bytes-from-int",
    language: "python",
    title: "int.to_bytes() and from_bytes() for binary encoding",
    tag: "types",
    code: `n = 123456789

# Encode integer as fixed-width bytes (big-endian)
be = n.to_bytes(4, byteorder="big")
print(be.hex())    # 075bcd15

# Little-endian
le = n.to_bytes(4, byteorder="little")
print(le.hex())    # 15cd5b07

# Decode back
print(int.from_bytes(be, byteorder="big"))    # 123456789
print(int.from_bytes(le, byteorder="little")) # 123456789

# signed=True handles negative numbers
neg = (-1).to_bytes(2, byteorder="big", signed=True)
print(neg.hex())   # ffff`,
    explanation: "`int.to_bytes(length, byteorder)` serializes an integer into a fixed-length byte sequence; `int.from_bytes` is the inverse — essential for binary protocol parsing and serialization.",
  },
  {
    id: "py-b15-b2-typing-paramspec",
    language: "python",
    title: "ParamSpec for decorators that preserve signatures",
    tag: "types",
    code: `from typing import ParamSpec, TypeVar, Callable
from functools import wraps
import time

P = ParamSpec("P")
T = TypeVar("T")

def timeit(fn: Callable[P, T]) -> Callable[P, T]:
    @wraps(fn)
    def wrapper(*args: P.args, **kwargs: P.kwargs) -> T:
        start = time.perf_counter()
        result = fn(*args, **kwargs)
        print(f"{fn.__name__}: {time.perf_counter() - start:.4f}s")
        return result
    return wrapper

@timeit
def add(a: int, b: int) -> int:
    return a + b

# Type checker knows add(a: int, b: int) -> int — not (*args, **kwargs)
print(add(3, 4))   # 3 + 4 = 7 (with timing)`,
    explanation: "`ParamSpec` captures the full parameter signature of a callable; used with `P.args` / `P.kwargs` in the wrapper, the type checker preserves the original function's parameter types through the decorator.",
  },
];
