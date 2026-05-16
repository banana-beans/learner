import type { Snippet } from "./types";

export const pythonSnippets20260516B2: Snippet[] = [
  {
    id: "py-b16-b2-lru-cache",
    language: "python",
    title: "functools.lru_cache decorator",
    tag: "snippet",
    code: `from functools import lru_cache

@lru_cache(maxsize=128)
def fib(n: int) -> int:
    if n < 2:
        return n
    return fib(n - 1) + fib(n - 2)

print(fib(40))          # fast
print(fib.cache_info()) # CacheInfo(hits=38, misses=41, ...)`,
    explanation: "lru_cache memoises calls using a least-recently-used cache of up to maxsize results. cache_info() lets you inspect hits, misses, and current size at runtime.",
  },
  {
    id: "py-b16-b2-legb-scope",
    language: "python",
    title: "Python's LEGB scope rule",
    tag: "understanding",
    code: `x = "global"

def outer():
    x = "enclosing"
    def inner():
        x = "local"
        print(x)   # local
    inner()
    print(x)       # enclosing

outer()
print(x)           # global`,
    explanation: "Python resolves names in Local → Enclosing → Global → Built-in order. Each assignment creates a name in the innermost enclosing scope without affecting outer ones.",
  },
  {
    id: "py-b16-b2-abc-sequence",
    language: "python",
    title: "collections.abc.Sequence vs MutableSequence",
    tag: "structures",
    code: `from collections.abc import Sequence, MutableSequence

class ReadOnly(Sequence):
    def __init__(self, data): self._d = data
    def __getitem__(self, i): return self._d[i]
    def __len__(self): return len(self._d)

ro = ReadOnly([1, 2, 3])
print(ro[1], len(ro))       # 2 3
print(isinstance(ro, MutableSequence))  # False`,
    explanation: "Sequence requires __getitem__ and __len__ and provides index/count/contains for free. MutableSequence additionally mandates __setitem__, __delitem__, and insert.",
  },
  {
    id: "py-b16-b2-nonlocal-caveat",
    language: "python",
    title: "nonlocal in a nested function",
    tag: "caveats",
    code: `def make_counter():
    count = 0
    def increment():
        nonlocal count   # without this, count += 1 raises UnboundLocalError
        count += 1
        return count
    return increment

c = make_counter()
print(c(), c(), c())   # 1 2 3`,
    explanation: "Assigning to a name inside a function makes Python treat it as local throughout that function. Use nonlocal to rebind a variable from an enclosing (non-global) scope.",
  },
  {
    id: "py-b16-b2-typing-any",
    language: "python",
    title: "typing.Any escape hatch",
    tag: "types",
    code: `from typing import Any

def process(value: Any) -> Any:
    # type checker won't complain about ANY operation
    return value.whatever + value[0] * value()

def typed(x: int) -> int:
    return x

result: int = process(42)   # no error even though Any leaks`,
    explanation: "Any is both a subtype and supertype of every type, so assignments to/from Any are always allowed. It is an explicit escape hatch — prefer more specific types wherever possible.",
  },
  {
    id: "py-b16-b2-itertools-product",
    language: "python",
    title: "itertools.product cartesian product",
    tag: "snippet",
    code: `from itertools import product

suits = ["♠", "♥", "♦", "♣"]
ranks = ["A", "K", "Q", "J"]

deck = list(product(ranks, suits))
print(deck[:4])
# [('A', '♠'), ('A', '♥'), ('A', '♦'), ('A', '♣')]

# repeat= shorthand for same-iterable power
rolls = list(product(range(1, 4), repeat=2))
print(len(rolls))  # 9`,
    explanation: "itertools.product yields all combinations from multiple iterables, equivalent to nested for-loops. The repeat keyword produces the cartesian power of a single iterable with itself.",
  },
  {
    id: "py-b16-b2-init-subclass",
    language: "python",
    title: "__init_subclass__ hook",
    tag: "classes",
    code: `class Plugin:
    _registry: dict = {}

    def __init_subclass__(cls, name: str = "", **kw):
        super().__init_subclass__(**kw)
        if name:
            Plugin._registry[name] = cls

class FooPlugin(Plugin, name="foo"):
    pass

class BarPlugin(Plugin, name="bar"):
    pass

print(Plugin._registry)
# {'foo': <class 'FooPlugin'>, 'bar': <class 'BarPlugin'>}`,
    explanation: "__init_subclass__ is called on the parent whenever a new subclass is defined, making it a clean way to implement auto-registration patterns without a metaclass.",
  },
  {
    id: "py-b16-b2-nonlocal-kw",
    language: "python",
    title: "nonlocal keyword effect",
    tag: "understanding",
    code: `def adder(start):
    total = start
    def add(n):
        nonlocal total
        total += n
        return total
    return add

add5 = adder(0)
print(add5(3))   # 3
print(add5(7))   # 10
print(add5(-2))  # 8`,
    explanation: "nonlocal lets a closure mutate a variable in the immediately enclosing function scope rather than creating a new local binding. The state persists across calls because it lives in the enclosing frame.",
  },
  {
    id: "py-b16-b2-itertools-permutations",
    language: "python",
    title: "itertools.permutations",
    tag: "snippet",
    code: `from itertools import permutations

letters = ["A", "B", "C"]

for p in permutations(letters):
    print("".join(p))
# ABC ACB BAC BCA CAB CBA

# r-length permutations
pairs = list(permutations(letters, 2))
print(pairs)  # [('A','B'),('A','C'),('B','A'),('B','C'),('C','A'),('C','B')]`,
    explanation: "permutations(it, r) yields all r-length ordered arrangements without repetition. Omitting r gives full-length permutations (n! total).",
  },
  {
    id: "py-b16-b2-iterator-exhaustion",
    language: "python",
    title: "Iterator protocol exhaustion",
    tag: "caveats",
    code: `nums = iter([1, 2, 3])

first_pass = list(nums)   # [1, 2, 3]
second_pass = list(nums)  # []  ← exhausted!

# Safe pattern: keep the list, not the iterator
data = [1, 2, 3]
a = list(data)
b = list(data)   # works fine`,
    explanation: "An iterator can only be traversed once — calling list() or a for-loop on an exhausted iterator silently returns nothing. Store the original sequence if you need multiple passes.",
  },
  {
    id: "py-b16-b2-typing-namedtuple",
    language: "python",
    title: "typing.NamedTuple vs collections.namedtuple",
    tag: "structures",
    code: `from typing import NamedTuple
from collections import namedtuple

# Old style — no type annotations, error-prone defaults
OldPoint = namedtuple("OldPoint", ["x", "y"])

# New style — typed, supports defaults and methods
class Point(NamedTuple):
    x: float
    y: float
    label: str = ""

p = Point(1.0, 2.5)
print(p.x, p.label)  # 1.0 ''
print(p._asdict())   # {'x': 1.0, 'y': 2.5, 'label': ''}`,
    explanation: "typing.NamedTuple gives you a class-based syntax with per-field type annotations and default values while remaining fully compatible with tuple unpacking and _asdict().",
  },
  {
    id: "py-b16-b2-contextmanager",
    language: "python",
    title: "contextlib.contextmanager decorator",
    tag: "snippet",
    code: `from contextlib import contextmanager
import time

@contextmanager
def timer(label: str):
    start = time.perf_counter()
    try:
        yield
    finally:
        elapsed = time.perf_counter() - start
        print(f"{label}: {elapsed:.4f}s")

with timer("loop"):
    total = sum(range(1_000_000))`,
    explanation: "contextmanager turns a generator function into a context manager: code before yield is __enter__, code after (in the finally block) is __exit__. This avoids writing a full class.",
  },
  {
    id: "py-b16-b2-generator-send",
    language: "python",
    title: "generator send() method",
    tag: "understanding",
    code: `def accumulator():
    total = 0
    while True:
        value = yield total   # yield sends current total, receives next value
        if value is None:
            break
        total += value

g = accumulator()
next(g)          # prime the generator
print(g.send(10))  # 10
print(g.send(5))   # 15
print(g.send(3))   # 18`,
    explanation: "send(value) resumes the generator and makes the yield expression evaluate to value. You must call next() (or send(None)) once first to advance to the first yield.",
  },
  {
    id: "py-b16-b2-io-stringio",
    language: "python",
    title: "io.StringIO vs io.BytesIO",
    tag: "families",
    code: `import io

# StringIO: in-memory text file
text_buf = io.StringIO()
text_buf.write("hello\n")
text_buf.write("world\n")
text_buf.seek(0)
print(text_buf.read())        # hello\nworld\n

# BytesIO: in-memory binary file
byte_buf = io.BytesIO(b"\x00\x01\x02")
print(byte_buf.read(2))       # b'\x00\x01'`,
    explanation: "StringIO holds Unicode text and works wherever a text-mode file is expected. BytesIO holds raw bytes and works with binary-mode APIs like struct, PIL, or network sockets.",
  },
  {
    id: "py-b16-b2-dataclass-asdict",
    language: "python",
    title: "dataclasses.asdict",
    tag: "snippet",
    code: `from dataclasses import dataclass, asdict

@dataclass
class Address:
    street: str
    city: str

@dataclass
class Person:
    name: str
    age: int
    address: Address

p = Person("Alice", 30, Address("1 Main St", "Springfield"))
d = asdict(p)
print(d)
# {'name': 'Alice', 'age': 30, 'address': {'street': '1 Main St', 'city': 'Springfield'}}`,
    explanation: "asdict recursively converts a dataclass (and any nested dataclasses) into a plain dictionary, which is handy for JSON serialisation or passing data to libraries that expect dicts.",
  },
  {
    id: "py-b16-b2-stopiteration-runtime",
    language: "python",
    title: "StopIteration inside generator becomes RuntimeError",
    tag: "caveats",
    code: `def inner():
    raise StopIteration("oops")

def outer():
    yield 1
    inner()        # In Python 3.7+ this propagates as RuntimeError
    yield 2

try:
    list(outer())
except RuntimeError as e:
    print(f"RuntimeError: {e}")
    # RuntimeError: generator raised StopIteration`,
    explanation: "PEP 479 (active since Python 3.7) converts any StopIteration that escapes a generator body into RuntimeError. This prevents accidental early termination of generators that call other iterators.",
  },
  {
    id: "py-b16-b2-property-descriptor",
    language: "python",
    title: "property as descriptor",
    tag: "classes",
    code: `class Temperature:
    def __init__(self, celsius: float = 0.0):
        self._c = celsius

    @property
    def celsius(self) -> float:
        return self._c

    @celsius.setter
    def celsius(self, value: float) -> None:
        if value < -273.15:
            raise ValueError("Below absolute zero")
        self._c = value

    @property
    def fahrenheit(self) -> float:
        return self._c * 9 / 5 + 32

t = Temperature(100)
print(t.fahrenheit)  # 212.0`,
    explanation: "property implements the descriptor protocol to attach getter/setter/deleter logic to an attribute while keeping plain dot-access syntax. Validation runs automatically on every assignment.",
  },
  {
    id: "py-b16-b2-itertools-combinations",
    language: "python",
    title: "itertools.combinations",
    tag: "snippet",
    code: `from itertools import combinations

players = ["Alice", "Bob", "Carol", "Dave"]

# All 2-player matchups
matchups = list(combinations(players, 2))
print(len(matchups))   # 6
print(matchups[0])     # ('Alice', 'Bob')

# combinations_with_replacement allows repeats
from itertools import combinations_with_replacement
rolls = list(combinations_with_replacement(range(1, 4), 2))
print(rolls)  # [(1,1),(1,2),(1,3),(2,2),(2,3),(3,3)]`,
    explanation: "combinations(it, r) yields all r-length subsets in lexicographic order with no repeated positions. Unlike permutations, order within each combination doesn't matter.",
  },
  {
    id: "py-b16-b2-classmethod-staticmethod",
    language: "python",
    title: "classmethod vs staticmethod dispatch",
    tag: "understanding",
    code: `class Converter:
    factor = 1.0

    @classmethod
    def from_string(cls, s: str) -> "Converter":
        obj = cls()
        obj.factor = float(s)
        return obj

    @staticmethod
    def unit_name() -> str:
        return "generic"

c = Converter.from_string("2.5")
print(c.factor)                # 2.5
print(Converter.unit_name())   # generic`,
    explanation: "classmethod receives the class (cls) as its first argument, enabling factory patterns that work correctly with subclasses. staticmethod receives no implicit argument — it's a plain function scoped to the class.",
  },
  {
    id: "py-b16-b2-io-stringio-detail",
    language: "python",
    title: "io.StringIO in-memory file",
    tag: "snippet",
    code: `import io, csv

output = io.StringIO()
writer = csv.writer(output)
writer.writerow(["name", "score"])
writer.writerow(["Alice", 95])
writer.writerow(["Bob", 87])

csv_text = output.getvalue()
print(repr(csv_text))
# 'name,score\r\nAlice,95\r\nBob,87\r\n'`,
    explanation: "StringIO lets you use any text-based library that writes to a file without touching the filesystem. getvalue() retrieves the entire contents regardless of the current seek position.",
  },
  {
    id: "py-b16-b2-dataclass-vs-typeddict",
    language: "python",
    title: "dataclass vs NamedTuple vs TypedDict comparison",
    tag: "structures",
    code: `from dataclasses import dataclass
from typing import NamedTuple, TypedDict

@dataclass
class DC:
    x: int; y: int = 0   # mutable, has methods, not a tuple

class NT(NamedTuple):
    x: int; y: int = 0   # immutable tuple, unpackable

class TD(TypedDict):
    x: int                # plain dict at runtime, type-checked only

dc = DC(1); nt = NT(1); td: TD = {"x": 1}
print(isinstance(nt, tuple))   # True
print(isinstance(td, dict))    # True
print(isinstance(dc, tuple))   # False`,
    explanation: "dataclass gives you a mutable object with optional __eq__/__hash__; NamedTuple is an immutable indexed tuple; TypedDict is just a dict with a type-checker overlay and no runtime enforcement.",
  },
  {
    id: "py-b16-b2-typing-never",
    language: "python",
    title: "typing.Never (bottom type)",
    tag: "types",
    code: `from typing import Never, NoReturn

def raise_always(msg: str) -> Never:
    raise RuntimeError(msg)

def assert_unreachable(value: Never) -> Never:
    raise AssertionError(f"Unreachable: {value!r}")

def process(x: int | str) -> str:
    if isinstance(x, int):
        return str(x)
    elif isinstance(x, str):
        return x
    else:
        assert_unreachable(x)  # type checker knows x: Never here`,
    explanation: "Never (and its alias NoReturn) is the bottom type — a value of type Never can never exist. It's used to annotate functions that always raise or to mark exhausted union branches for the type checker.",
  },
  {
    id: "py-b16-b2-re-findall",
    language: "python",
    title: "re.findall with groups",
    tag: "snippet",
    code: `import re

text = "Call 555-1234 or 555-5678 for info."

# Without groups: returns list of full matches
print(re.findall(r"\d{3}-\d{4}", text))
# ['555-1234', '555-5678']

# With one group: returns list of group contents
print(re.findall(r"\d{3}-(\d{4})", text))
# ['1234', '5678']

# With multiple groups: returns list of tuples
print(re.findall(r"(\d{3})-(\d{4})", text))
# [('555', '1234'), ('555', '5678')]`,
    explanation: "When the pattern has no groups findall returns full matches; with one group it returns a list of that group's captures; with multiple groups it returns a list of tuples — one tuple per match.",
  },
  {
    id: "py-b16-b2-mro-linearization",
    language: "python",
    title: "Multiple inheritance MRO (C3 linearization)",
    tag: "understanding",
    code: `class A:
    def who(self): return "A"

class B(A):
    def who(self): return "B"

class C(A):
    def who(self): return "C"

class D(B, C):
    pass

print(D().who())         # B  (MRO: D → B → C → A)
print([c.__name__ for c in D.__mro__])
# ['D', 'B', 'C', 'A', 'object']`,
    explanation: "Python uses C3 linearization to build the Method Resolution Order, guaranteeing a consistent left-to-right, depth-first search that respects the order in which base classes are listed.",
  },
  {
    id: "py-b16-b2-pathlib-readwrite",
    language: "python",
    title: "pathlib.Path read_text/write_text",
    tag: "snippet",
    code: `from pathlib import Path

tmp = Path("/tmp/demo.txt")

# Write
tmp.write_text("Hello, pathlib!\nLine 2\n", encoding="utf-8")

# Read back
content = tmp.read_text(encoding="utf-8")
print(content)

# Iterate lines
for line in tmp.read_text().splitlines():
    print(repr(line))`,
    explanation: "Path.write_text and read_text handle open/write/close in one call with explicit encoding support. They complement read_bytes/write_bytes for binary files.",
  },
  {
    id: "py-b16-b2-string-format-edge",
    language: "python",
    title: "String formatting % vs .format vs f-string edge cases",
    tag: "caveats",
    code: `value = 1/3

print("%.4f" % value)           # '0.3333'
print("{:.4f}".format(value))   # '0.3333'
print(f"{value:.4f}")           # '0.3333'

# % silently ignores extra args; .format raises IndexError for missing
try:
    "{0} {1}".format("only one")
except IndexError as e:
    print(e)   # tuple index out of range

# f-strings evaluate at definition time, not lazily
name = "world"
tmpl = f"hello {name}"   # already rendered`,
    explanation: "All three produce the same output for basic cases, but they differ in error handling (% is lenient), laziness (f-strings are eager), and composability (.format is best for templates stored as strings).",
  },
  {
    id: "py-b16-b2-exitstack",
    language: "python",
    title: "contextlib.ExitStack",
    tag: "snippet",
    code: `from contextlib import ExitStack

files = ["a.txt", "b.txt", "c.txt"]
# Write sample files first
for f in files:
    open(f"/tmp/{f}", "w").close()

with ExitStack() as stack:
    handles = [
        stack.enter_context(open(f"/tmp/{f}")) for f in files
    ]
    for h in handles:
        print(h.name)
# All files closed when block exits`,
    explanation: "ExitStack manages a dynamic number of context managers — each enter_context call registers a new one, and all are cleaned up in LIFO order when the with block exits, even on exceptions.",
  },
  {
    id: "py-b16-b2-pathlib-vs-ospath",
    language: "python",
    title: "pathlib.Path vs os.path",
    tag: "families",
    code: `import os
from pathlib import Path

# os.path style (string-based)
joined = os.path.join("/home", "user", "file.txt")
base = os.path.basename(joined)
exists = os.path.exists(joined)

# pathlib style (object-based)
p = Path("/home") / "user" / "file.txt"
base2 = p.name
exists2 = p.exists()

print(joined == str(p))  # True
print(base == base2)     # True`,
    explanation: "pathlib.Path offers an OO interface with operator overloading for joining (/) and properties like .stem, .suffix, .parent. os.path operates on raw strings and is more explicit but more verbose.",
  },
  {
    id: "py-b16-b2-inspect-signature",
    language: "python",
    title: "inspect.signature",
    tag: "snippet",
    code: `import inspect

def greet(name: str, *, greeting: str = "Hello") -> str:
    return f"{greeting}, {name}!"

sig = inspect.signature(greet)
print(sig)                        # (name: str, *, greeting: str = 'Hello') -> str

for name, param in sig.parameters.items():
    print(name, param.kind.name, param.default)
# name POSITIONAL_OR_KEYWORD <class 'inspect._empty'>
# greeting KEYWORD_ONLY Hello`,
    explanation: "inspect.signature returns a Signature object describing all parameters, their kinds (positional, keyword-only, etc.), defaults, and annotations — useful for building decorators or frameworks.",
  },
  {
    id: "py-b16-b2-cached-property",
    language: "python",
    title: "cached_property",
    tag: "classes",
    code: `from functools import cached_property

class Circle:
    def __init__(self, radius: float):
        self.radius = radius

    @cached_property
    def area(self) -> float:
        import math
        print("computing...")
        return math.pi * self.radius ** 2

c = Circle(5)
print(c.area)   # computing... 78.539...
print(c.area)   # 78.539...  (no second print)`,
    explanation: "cached_property computes the value on first access, stores it as an instance attribute, and returns the cached value on every subsequent access without invoking the function again.",
  },
  {
    id: "py-b16-b2-itertools-accumulate",
    language: "python",
    title: "itertools.accumulate running total",
    tag: "snippet",
    code: `from itertools import accumulate
import operator

data = [1, 2, 3, 4, 5]

# Default: running sum
print(list(accumulate(data)))
# [1, 3, 6, 10, 15]

# Running product
print(list(accumulate(data, operator.mul)))
# [1, 2, 6, 24, 120]

# Running maximum
print(list(accumulate([3, 1, 4, 1, 5, 9, 2], max)))
# [3, 3, 4, 4, 5, 9, 9]`,
    explanation: "accumulate applies a binary function (default: addition) cumulatively and yields each intermediate result, making prefix-sum, running-max, and scan-reduce patterns trivial.",
  },
  {
    id: "py-b16-b2-property-getattr",
    language: "python",
    title: "__getattr__ vs __getattribute__",
    tag: "understanding",
    code: `class Fallback:
    def __init__(self):
        self.real = 42

    def __getattr__(self, name):
        # Called ONLY when normal lookup fails
        return f"<missing: {name}>"

class Intercept:
    def __getattribute__(self, name):
        # Called for EVERY attribute access
        print(f"access: {name}")
        return object.__getattribute__(self, name)

f = Fallback()
print(f.real)    # 42 (no __getattr__ call)
print(f.nope)    # <missing: nope>`,
    explanation: "__getattr__ is a last-resort fallback invoked only when the attribute isn't found through normal means. __getattribute__ intercepts every attribute lookup and must call the base implementation to avoid infinite recursion.",
  },
  {
    id: "py-b16-b2-queue-threadsafe",
    language: "python",
    title: "queue.Queue thread-safe",
    tag: "structures",
    code: `import queue, threading

q: queue.Queue[int] = queue.Queue(maxsize=5)

def producer():
    for i in range(5):
        q.put(i)
        print(f"put {i}")
    q.put(None)  # sentinel

def consumer():
    while (item := q.get()) is not None:
        print(f"got {item}")

t1 = threading.Thread(target=producer)
t2 = threading.Thread(target=consumer)
t1.start(); t2.start()
t1.join(); t2.join()`,
    explanation: "queue.Queue is thread-safe by design, blocking put() when full and get() when empty, making it the standard way to hand off work between threads without explicit locks.",
  },
  {
    id: "py-b16-b2-typing-self",
    language: "python",
    title: "typing.Self return type",
    tag: "types",
    code: `from typing import Self

class Builder:
    def __init__(self) -> None:
        self._parts: list[str] = []

    def add(self, part: str) -> Self:
        self._parts.append(part)
        return self

    def build(self) -> str:
        return ", ".join(self._parts)

class ExtBuilder(Builder):
    def add_upper(self, part: str) -> Self:
        return self.add(part.upper())

# type checker knows ExtBuilder.add() returns ExtBuilder, not Builder
result = ExtBuilder().add_upper("hello").add("world").build()
print(result)  # HELLO, world`,
    explanation: "Self (from typing) annotates methods that return the same type as their receiver, so subclasses automatically get the correct return type without needing TypeVar boilerplate.",
  },
  {
    id: "py-b16-b2-re-sub-function",
    language: "python",
    title: "re.sub with a function",
    tag: "snippet",
    code: `import re

def double_number(m: re.Match) -> str:
    return str(int(m.group()) * 2)

text = "I have 3 cats and 12 dogs"
result = re.sub(r"\d+", double_number, text)
print(result)
# I have 6 cats and 24 dogs`,
    explanation: "When re.sub's replacement argument is callable, it is invoked with each Match object and must return the replacement string, enabling transformations that depend on the matched value.",
  },
  {
    id: "py-b16-b2-csv-dictreader",
    language: "python",
    title: "csv.DictReader",
    tag: "snippet",
    code: `import csv, io

data = """name,age,city
Alice,30,New York
Bob,25,London
Carol,35,Tokyo"""

reader = csv.DictReader(io.StringIO(data))
for row in reader:
    print(row["name"], row["age"])
# Alice 30
# Bob 25
# Carol 35

print(reader.fieldnames)  # ['name', 'age', 'city']`,
    explanation: "DictReader parses each CSV row into an OrderedDict (plain dict in Python 3.8+) keyed by header names, eliminating index-based column access and making code self-documenting.",
  },
  {
    id: "py-b16-b2-threading-logging",
    language: "python",
    title: "logging vs print",
    tag: "families",
    code: `import logging

logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
log = logging.getLogger(__name__)

log.debug("detail for devs")
log.info("normal operation")
log.warning("something odd")
log.error("something failed")
# Levels can be filtered; print cannot`,
    explanation: "logging supports levels, handlers, formatters, and per-module loggers, allowing production code to emit structured, filterable output without littering or removing print statements.",
  },
  {
    id: "py-b16-b2-exception-chaining",
    language: "python",
    title: "Exception chaining (raise X from Y)",
    tag: "understanding",
    code: `def parse_config(s: str) -> int:
    try:
        return int(s)
    except ValueError as e:
        raise RuntimeError(f"Invalid config value: {s!r}") from e

try:
    parse_config("bad")
except RuntimeError as e:
    print(e)               # Invalid config value: 'bad'
    print(e.__cause__)     # invalid literal for int()...`,
    explanation: "raise X from Y creates an explicit exception chain where X.__cause__ is Y. The traceback shows both exceptions, making it clear why the higher-level error was raised.",
  },
  {
    id: "py-b16-b2-dataclass-replace",
    language: "python",
    title: "dataclasses.replace",
    tag: "snippet",
    code: `from dataclasses import dataclass, replace

@dataclass(frozen=True)
class Config:
    host: str = "localhost"
    port: int = 8080
    debug: bool = False

base = Config()
dev = replace(base, debug=True, port=9000)
prod = replace(base, host="prod.example.com")

print(dev)   # Config(host='localhost', port=9000, debug=True)
print(prod)  # Config(host='prod.example.com', port=8080, debug=False)`,
    explanation: "dataclasses.replace returns a new instance with specified fields changed and all others copied from the original — the idiomatic way to derive a modified immutable dataclass.",
  },
  {
    id: "py-b16-b2-pickle-security",
    language: "python",
    title: "pickle security warning",
    tag: "caveats",
    code: `import pickle

# Dangerous: never unpickle untrusted data
class Exploit:
    def __reduce__(self):
        import os
        return (os.system, ("echo pwned",))

payload = pickle.dumps(Exploit())
# pickle.loads(payload)  # would execute os.system("echo pwned")

# Safe alternative for data interchange: json
import json
safe = json.dumps({"key": "value"})
print(json.loads(safe))`,
    explanation: "pickle.loads executes arbitrary Python code embedded in the payload, so deserialising data from untrusted sources is a remote code execution vulnerability. Use JSON or schema-validated formats instead.",
  },
  {
    id: "py-b16-b2-itertools-cycle",
    language: "python",
    title: "itertools.cycle",
    tag: "snippet",
    code: `from itertools import cycle, islice

colors = cycle(["red", "green", "blue"])

# Take first 7 from an infinite cycle
palette = list(islice(colors, 7))
print(palette)
# ['red', 'green', 'blue', 'red', 'green', 'blue', 'red']

# Round-robin task assignment
workers = cycle(["w1", "w2", "w3"])
tasks = ["t1", "t2", "t3", "t4", "t5"]
assignments = [(t, next(workers)) for t in tasks]
print(assignments)`,
    explanation: "cycle(it) returns an infinite iterator that loops over the iterable repeatedly. Combine it with islice or next() to take a finite number of elements.",
  },
  {
    id: "py-b16-b2-abstract-property",
    language: "python",
    title: "abstract property",
    tag: "classes",
    code: `from abc import ABC, abstractmethod

class Shape(ABC):
    @property
    @abstractmethod
    def area(self) -> float: ...

    @property
    @abstractmethod
    def perimeter(self) -> float: ...

class Square(Shape):
    def __init__(self, side: float):
        self.side = side

    @property
    def area(self) -> float:
        return self.side ** 2

    @property
    def perimeter(self) -> float:
        return 4 * self.side

print(Square(3).area)  # 9.0`,
    explanation: "Combining @property with @abstractmethod forces subclasses to implement the attribute as a property. Attempting to instantiate a class that skips either abstract property raises TypeError.",
  },
  {
    id: "py-b16-b2-context-manager-protocol",
    language: "python",
    title: "Context manager protocol (__enter__/__exit__)",
    tag: "understanding",
    code: `class Managed:
    def __enter__(self):
        print("entering")
        return self          # becomes 'as' target

    def __exit__(self, exc_type, exc_val, exc_tb):
        print(f"exiting, exc={exc_type}")
        return False         # don't suppress exceptions

with Managed() as m:
    print(f"inside, m={m}")
    # raise ValueError("test")  # __exit__ still called

# entering
# inside, m=<...>
# exiting, exc=None`,
    explanation: "__enter__ sets up the resource and optionally returns a value for the as clause. __exit__ receives exception info (all None if no error) and returning True suppresses the exception.",
  },
  {
    id: "py-b16-b2-heapq-merge",
    language: "python",
    title: "heapq.merge sorted iterables",
    tag: "snippet",
    code: `import heapq

a = [1, 4, 7, 10]
b = [2, 5, 8, 11]
c = [3, 6, 9, 12]

merged = list(heapq.merge(a, b, c))
print(merged)
# [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

# Works lazily — efficient for large sorted files
import itertools
first_five = list(itertools.islice(heapq.merge(a, b, c), 5))
print(first_five)  # [1, 2, 3, 4, 5]`,
    explanation: "heapq.merge lazily merges multiple pre-sorted iterables in O(n log k) time where k is the number of inputs. Unlike sorted(chain(...)), it doesn't need to load everything into memory at once.",
  },
  {
    id: "py-b16-b2-typing-typealias",
    language: "python",
    title: "typing.TypeAlias",
    tag: "types",
    code: `from typing import TypeAlias

# Explicit alias — tells type checkers this is intentional
Vector: TypeAlias = list[float]
Matrix: TypeAlias = list[Vector]

def dot(a: Vector, b: Vector) -> float:
    return sum(x * y for x, y in zip(a, b))

v1: Vector = [1.0, 2.0, 3.0]
v2: Vector = [4.0, 5.0, 6.0]
print(dot(v1, v2))  # 32.0`,
    explanation: "TypeAlias (PEP 613, Python 3.10+) explicitly marks a variable as a type alias rather than a regular assignment, preventing type checkers from treating it as a variable with a type value.",
  },
  {
    id: "py-b16-b2-hashlib-sha256",
    language: "python",
    title: "hashlib.sha256",
    tag: "snippet",
    code: `import hashlib

data = b"hello, world"

digest = hashlib.sha256(data).hexdigest()
print(digest)
# b94d27b9934d3e08a52e52d7da7dabfac...

# Incremental hashing for large data
h = hashlib.sha256()
for chunk in [b"hello", b", ", b"world"]:
    h.update(chunk)
print(h.hexdigest() == digest)  # True`,
    explanation: "hashlib.sha256 computes a cryptographic hash of bytes. The incremental update() API avoids loading large files into memory all at once and produces the same result.",
  },
  {
    id: "py-b16-b2-atexit-order",
    language: "python",
    title: "atexit handler order",
    tag: "caveats",
    code: `import atexit

def cleanup_a():
    print("cleanup A")

def cleanup_b():
    print("cleanup B")

def cleanup_c():
    print("cleanup C")

atexit.register(cleanup_a)
atexit.register(cleanup_b)
atexit.register(cleanup_c)

# At exit, prints:
# cleanup C   (last registered, first called — LIFO)
# cleanup B
# cleanup A`,
    explanation: "atexit handlers are called in LIFO (last-in, first-out) order, similar to a stack. Handlers are not called if the process is killed with SIGKILL or os._exit().",
  },
  {
    id: "py-b16-b2-operator-itemgetter",
    language: "python",
    title: "operator.itemgetter as sort key",
    tag: "snippet",
    code: `from operator import itemgetter, attrgetter

records = [
    {"name": "Bob",   "age": 30},
    {"name": "Alice", "age": 25},
    {"name": "Carol", "age": 35},
]

by_age = sorted(records, key=itemgetter("age"))
print([r["name"] for r in by_age])  # ['Alice', 'Bob', 'Carol']

# Multi-key sort
by_age_name = sorted(records, key=itemgetter("age", "name"))
print(by_age_name[0])`,
    explanation: "itemgetter(key) returns a callable that fetches that key from a mapping or index from a sequence. It is faster than an equivalent lambda and supports multi-key extraction in one call.",
  },
  {
    id: "py-b16-b2-io-stringio-families",
    language: "python",
    title: "threading vs multiprocessing vs asyncio",
    tag: "families",
    code: `# threading: I/O-bound, shared memory, GIL limits CPU
import threading
t = threading.Thread(target=lambda: None)

# multiprocessing: CPU-bound, separate memory spaces
import multiprocessing
p = multiprocessing.Process(target=lambda: None)

# asyncio: I/O-bound, single-threaded, cooperative
import asyncio
async def main():
    await asyncio.sleep(0)

# Rule of thumb:
# asyncio > threading > multiprocessing (overhead order)
print("choose based on workload type")`,
    explanation: "asyncio has the lowest overhead for many concurrent I/O tasks; threading suits simpler I/O concurrency with blocking libraries; multiprocessing bypasses the GIL for CPU-bound parallel work.",
  },
  {
    id: "py-b16-b2-dataclass-field-init-false",
    language: "python",
    title: "dataclass field with init=False",
    tag: "classes",
    code: `from dataclasses import dataclass, field
import time

@dataclass
class Event:
    name: str
    payload: dict = field(default_factory=dict)
    created_at: float = field(init=False)

    def __post_init__(self):
        self.created_at = time.time()

e = Event("click", {"x": 10, "y": 20})
print(e.name)        # click
print(e.created_at)  # 1716... (auto-set)`,
    explanation: "field(init=False) excludes a field from the generated __init__ signature, so it must be set in __post_init__ or via a default/default_factory. This is ideal for computed or auto-generated fields.",
  },
  {
    id: "py-b16-b2-uuid4",
    language: "python",
    title: "uuid.uuid4",
    tag: "snippet",
    code: `import uuid

# Generate a random UUID
uid = uuid.uuid4()
print(uid)                    # e.g. 550e8400-e29b-41d4-a716-446655440000
print(str(uid))               # same, as string
print(uid.hex)                # without dashes
print(uid.int)                # as 128-bit integer

# Reconstruct from string
parsed = uuid.UUID("550e8400-e29b-41d4-a716-446655440000")
print(parsed.version)        # None (version 4 not guaranteed by that string)`,
    explanation: "uuid.uuid4() generates a cryptographically random 128-bit UUID with near-zero collision probability. The UUID object can be converted to string, hex, int, or bytes representations.",
  },
  {
    id: "py-b16-b2-descriptor-protocol",
    language: "python",
    title: "Descriptor protocol order",
    tag: "understanding",
    code: `class Descriptor:
    def __get__(self, obj, objtype=None):
        if obj is None:
            return self          # accessed on class
        return obj.__dict__.get("_val", "default")

    def __set__(self, obj, value):
        obj.__dict__["_val"] = value

class MyClass:
    attr = Descriptor()

m = MyClass()
print(m.attr)       # default  (data descriptor __get__)
m.attr = 42
print(m.attr)       # 42       (data descriptor wins over instance dict)
print(MyClass.attr) # <Descriptor object>`,
    explanation: "Data descriptors (defining both __get__ and __set__) take priority over the instance __dict__. Non-data descriptors (only __get__) are overridden by instance attributes of the same name.",
  },
  {
    id: "py-b16-b2-functools-wraps",
    language: "python",
    title: "functools.wraps preserving metadata",
    tag: "snippet",
    code: `from functools import wraps
import time

def timing(func):
    @wraps(func)          # copies __name__, __doc__, __annotations__
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        result = func(*args, **kwargs)
        print(f"{func.__name__}: {time.perf_counter()-start:.4f}s")
        return result
    return wrapper

@timing
def compute(n: int) -> int:
    """Sum 0..n."""
    return sum(range(n))

print(compute.__name__)  # compute  (not 'wrapper')
print(compute.__doc__)   # Sum 0..n.`,
    explanation: "Without @wraps, a decorator replaces the wrapped function's __name__ and __doc__ with those of the inner wrapper. @wraps copies all relevant dunder attributes from the original function.",
  },
  {
    id: "py-b16-b2-csv-dictwriter",
    language: "python",
    title: "csv.DictWriter",
    tag: "structures",
    code: `import csv, io

output = io.StringIO()
fields = ["name", "score", "grade"]
writer = csv.DictWriter(output, fieldnames=fields)

writer.writeheader()
writer.writerows([
    {"name": "Alice", "score": 95, "grade": "A"},
    {"name": "Bob",   "score": 78, "grade": "C"},
])

print(output.getvalue())`,
    explanation: "DictWriter accepts dicts for each row, automatically mapping keys to the correct CSV columns and writing them in the order defined by fieldnames. extrasaction='raise' (default) prevents silently dropping extra keys.",
  },
  {
    id: "py-b16-b2-typing-paramspec",
    language: "python",
    title: "typing.ParamSpec for decorator types",
    tag: "types",
    code: `from typing import Callable, TypeVar
from typing import ParamSpec
from functools import wraps

P = ParamSpec("P")
R = TypeVar("R")

def retry(n: int) -> Callable[[Callable[P, R]], Callable[P, R]]:
    def decorator(fn: Callable[P, R]) -> Callable[P, R]:
        @wraps(fn)
        def wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
            for i in range(n):
                try:
                    return fn(*args, **kwargs)
                except Exception:
                    if i == n - 1: raise
        return wrapper
    return decorator`,
    explanation: "ParamSpec captures the parameter specification of a callable so that a decorator can declare it returns a function with exactly the same signature, enabling accurate type-checking of decorated functions.",
  },
  {
    id: "py-b16-b2-textwrap-dedent",
    language: "python",
    title: "textwrap.dedent",
    tag: "snippet",
    code: `import textwrap

def generate_sql():
    query = """
        SELECT id, name
        FROM users
        WHERE active = 1
        ORDER BY name
    """
    return textwrap.dedent(query).strip()

print(generate_sql())
# SELECT id, name
# FROM users
# WHERE active = 1
# ORDER BY name`,
    explanation: "textwrap.dedent strips the common leading whitespace from all non-empty lines, letting you indent triple-quoted strings to match surrounding code without that indentation appearing in the output.",
  },
  {
    id: "py-b16-b2-json-default",
    language: "python",
    title: "json.loads/dumps with default",
    tag: "snippet",
    code: `import json
from datetime import datetime, date

def json_default(obj):
    if isinstance(obj, (datetime, date)):
        return obj.isoformat()
    raise TypeError(f"Not serializable: {type(obj)}")

data = {"name": "Alice", "joined": date(2024, 1, 15)}
serialized = json.dumps(data, default=json_default, indent=2)
print(serialized)
# {
#   "name": "Alice",
#   "joined": "2024-01-15"
# }`,
    explanation: "The default callable is invoked by json.dumps for any object it can't serialise normally. Raising TypeError tells the encoder to propagate the error rather than silently skip the value.",
  },
  {
    id: "py-b16-b2-weakref-del",
    language: "python",
    title: "__del__ not guaranteed",
    tag: "caveats",
    code: `class Resource:
    def __init__(self, name):
        self.name = name

    def __del__(self):
        print(f"Deleting {self.name}")

r = Resource("A")
del r   # may print "Deleting A" — but not guaranteed

# Use context managers instead:
class SafeResource:
    def __enter__(self): return self
    def __exit__(self, *_): print("cleanup guaranteed")

with SafeResource():
    pass  # cleanup guaranteed`,
    explanation: "__del__ is called when the object's reference count reaches zero (CPython), but the timing is not guaranteed in other implementations and can be delayed or omitted entirely during interpreter shutdown.",
  },
  {
    id: "py-b16-b2-typing-overload",
    language: "python",
    title: "typing.overload for multiple signatures",
    tag: "types",
    code: `from typing import overload

@overload
def process(x: int) -> str: ...
@overload
def process(x: str) -> int: ...

def process(x):
    if isinstance(x, int):
        return str(x)
    return len(x)

print(process(42))      # "42"  — type checker knows return is str
print(process("hello")) # 5     — type checker knows return is int`,
    explanation: "@overload lets you declare multiple typed signatures for a single function. The type checker uses the overload declarations for inference; only the implementation (without @overload) runs at runtime.",
  },
  {
    id: "py-b16-b2-dataclass-postinit",
    language: "python",
    title: "dataclass post_init validation",
    tag: "classes",
    code: `from dataclasses import dataclass

@dataclass
class Rectangle:
    width: float
    height: float

    def __post_init__(self):
        if self.width <= 0 or self.height <= 0:
            raise ValueError(
                f"Dimensions must be positive: {self.width}x{self.height}"
            )
        self.area = self.width * self.height

r = Rectangle(3.0, 4.0)
print(r.area)  # 12.0

try:
    Rectangle(-1, 4)
except ValueError as e:
    print(e)`,
    explanation: "__post_init__ is called automatically after the generated __init__ completes, making it the right place for cross-field validation or deriving computed attributes that depend on constructor arguments.",
  },
  {
    id: "py-b16-b2-secrets-token",
    language: "python",
    title: "secrets.token_hex",
    tag: "snippet",
    code: `import secrets

# 32-byte (64 hex chars) cryptographically secure token
token = secrets.token_hex(32)
print(token)   # e.g. 'a8f3b2e1...' (64 chars)

# URL-safe base64 token
url_token = secrets.token_urlsafe(32)
print(url_token)   # e.g. 'abc123-...' (43 chars)

# Constant-time comparison to prevent timing attacks
stored = secrets.token_hex(16)
incoming = "some_user_provided_value"
if secrets.compare_digest(stored, incoming):
    print("match")`,
    explanation: "secrets is the correct module for generating tokens, passwords, and API keys — it uses os.urandom and is not predictable like random. compare_digest prevents timing-based token enumeration.",
  },
  {
    id: "py-b16-b2-subprocess-vs-os",
    language: "python",
    title: "subprocess vs os.system vs os.popen",
    tag: "families",
    code: `import subprocess, os

# os.system: runs in shell, returns exit code only (legacy)
ret = os.system("echo hello")   # prints to stdout
print(ret)   # 0

# subprocess.run: modern, captures output, no shell needed
result = subprocess.run(
    ["echo", "hello"],
    capture_output=True, text=True
)
print(result.stdout)   # hello\n

# os.popen: deprecated — use subprocess.PIPE instead
with os.popen("echo hi") as f:
    print(f.read())`,
    explanation: "subprocess.run is the modern preferred API: it avoids shell injection by accepting a list, can capture stdout/stderr separately, and raises on non-zero exit with check=True. os.system and os.popen are legacy.",
  },
  {
    id: "py-b16-b2-itertools-takewhile",
    language: "python",
    title: "itertools.takewhile",
    tag: "snippet",
    code: `from itertools import takewhile, dropwhile

data = [2, 4, 6, 1, 8, 10]

evens_from_start = list(takewhile(lambda x: x % 2 == 0, data))
print(evens_from_start)   # [2, 4, 6]  stops at 1

after_odd = list(dropwhile(lambda x: x % 2 == 0, data))
print(after_odd)          # [1, 8, 10]  skips until odd`,
    explanation: "takewhile yields elements while the predicate is True and stops at the first False — it does not scan the rest. dropwhile is the complement: it skips elements until the predicate is False, then yields everything.",
  },
  {
    id: "py-b16-b2-typing-typeguard",
    language: "python",
    title: "typing.TypeGuard narrowing",
    tag: "types",
    code: `from typing import TypeGuard

def is_str_list(val: list[object]) -> TypeGuard[list[str]]:
    return all(isinstance(x, str) for x in val)

def process(items: list[object]) -> None:
    if is_str_list(items):
        # type checker knows items: list[str] here
        print(items[0].upper())
    else:
        print("not all strings")

process(["hello", "world"])   # HELLO
process([1, "two", 3])        # not all strings`,
    explanation: "TypeGuard in a return annotation tells the type checker that when the function returns True, the checked argument should be narrowed to the given type inside the if-branch.",
  },
  {
    id: "py-b16-b2-mmap",
    language: "python",
    title: "mmap memory-mapped file",
    tag: "structures",
    code: `import mmap, os

path = "/tmp/mmap_demo.bin"
with open(path, "wb") as f:
    f.write(b"Hello, world!" + b"\x00" * 100)

with open(path, "r+b") as f:
    mm = mmap.mmap(f.fileno(), 0)
    print(mm[:5])         # b'Hello'
    mm[7:12] = b"mmap!"   # write in-place
    mm.seek(0)
    print(mm[:13])        # b'Hello, mmap!!'
    mm.close()`,
    explanation: "mmap maps a file into virtual memory, allowing random-access reads and writes as if the file were a bytearray. This avoids explicit read/write calls and is efficient for large files.",
  },
  {
    id: "py-b16-b2-eval-exec-risk",
    language: "python",
    title: "eval/exec security risk",
    tag: "caveats",
    code: `# NEVER eval/exec untrusted input
user_input = "__import__('os').system('id')"
# eval(user_input)  # would execute arbitrary code!

# Safer alternatives:
import ast

def safe_eval_int(s: str) -> int:
    tree = ast.parse(s, mode="eval")
    if not isinstance(tree.body, ast.Constant):
        raise ValueError("Only literals allowed")
    return int(tree.body.value)

print(safe_eval_int("42"))  # 42`,
    explanation: "eval and exec run arbitrary Python code with full interpreter access. User-supplied strings can import modules, read files, or spawn processes. Use ast.literal_eval for data or proper parsers for expressions.",
  },
  {
    id: "py-b16-b2-operator-attrgetter",
    language: "python",
    title: "operator.attrgetter",
    tag: "snippet",
    code: `from operator import attrgetter
from dataclasses import dataclass

@dataclass
class Employee:
    name: str
    department: str
    salary: float

staff = [
    Employee("Alice", "Eng", 90000),
    Employee("Bob",   "HR",  60000),
    Employee("Carol", "Eng", 95000),
]

by_dept_salary = sorted(staff, key=attrgetter("department", "salary"))
for e in by_dept_salary:
    print(e.name, e.department, e.salary)`,
    explanation: "attrgetter(attr) returns a callable that fetches the named attribute from an object. Multi-attribute attrgetter provides stable compound sorting without lambda functions.",
  },
  {
    id: "py-b16-b2-zipfile",
    language: "python",
    title: "zipfile.ZipFile",
    tag: "structures",
    code: `import zipfile, io

# Create an in-memory zip
buf = io.BytesIO()
with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
    zf.writestr("hello.txt", "Hello, World!")
    zf.writestr("data/info.txt", "some data")

# Read it back
buf.seek(0)
with zipfile.ZipFile(buf, "r") as zf:
    print(zf.namelist())        # ['hello.txt', 'data/info.txt']
    print(zf.read("hello.txt")) # b'Hello, World!'`,
    explanation: "zipfile.ZipFile can read and write zip archives to files or in-memory BytesIO objects. writestr lets you add files from strings or bytes without touching the filesystem.",
  },
  {
    id: "py-b16-b2-class-getitem",
    language: "python",
    title: "__class_getitem__ for generics",
    tag: "classes",
    code: `class TypedList:
    def __class_getitem__(cls, item):
        # Returns a parameterised alias, enabling List[int] syntax
        return type(f"{cls.__name__}[{item.__name__}]", (cls,), {"_type": item})

    def __init__(self, items=None):
        self._items = list(items or [])

IntList = TypedList[int]
print(IntList._type)          # <class 'int'>
print(issubclass(IntList, TypedList))  # True`,
    explanation: "__class_getitem__ is called when you subscript a class (e.g., MyClass[T]). It powers PEP 585 generics (list[int], dict[str, int]) and lets you add the same syntax to your own classes.",
  },
  {
    id: "py-b16-b2-textwrap-wrap",
    language: "python",
    title: "textwrap.wrap",
    tag: "snippet",
    code: `import textwrap

long = (
    "Python's textwrap module is useful for formatting text "
    "output in terminal applications where line width matters."
)

lines = textwrap.wrap(long, width=40)
for line in lines:
    print(line)

# Also: textwrap.fill returns a single joined string
filled = textwrap.fill(long, width=40)
print(repr(filled[:50]))`,
    explanation: "textwrap.wrap returns a list of lines each at most width characters long, breaking at word boundaries. textwrap.fill is a convenience wrapper that joins those lines with newlines.",
  },
  {
    id: "py-b16-b2-typing-get-type-hints",
    language: "python",
    title: "typing.get_type_hints",
    tag: "snippet",
    code: `from typing import get_type_hints
from dataclasses import dataclass

@dataclass
class Config:
    host: str
    port: int
    debug: bool = False

hints = get_type_hints(Config)
print(hints)
# {'host': <class 'str'>, 'port': <class 'int'>, 'debug': <class 'bool'>}

# Works on functions too
def greet(name: str) -> str:
    return f"Hello, {name}"

print(get_type_hints(greet))
# {'name': <class 'str'>, 'return': <class 'str'>}`,
    explanation: "get_type_hints evaluates string annotations (from __future__ import annotations or quoted strings) into actual type objects, making it the correct way to inspect annotations at runtime.",
  },
  {
    id: "py-b16-b2-tempfile",
    language: "python",
    title: "tempfile.NamedTemporaryFile",
    tag: "structures",
    code: `import tempfile, os

with tempfile.NamedTemporaryFile(
    mode="w", suffix=".txt", delete=False
) as f:
    f.write("temporary content\n")
    tmp_path = f.name

try:
    with open(tmp_path) as f:
        print(f.read())   # temporary content
finally:
    os.unlink(tmp_path)   # manual cleanup when delete=False`,
    explanation: "NamedTemporaryFile creates a file with a real filesystem path (unlike SpooledTemporaryFile). On Windows, delete=False is usually needed because the file can't be opened by name while already open.",
  },
  {
    id: "py-b16-b2-slots-inheritance",
    language: "python",
    title: "slots and inheritance",
    tag: "understanding",
    code: `class Base:
    __slots__ = ("x",)

class Child(Base):
    __slots__ = ("y",)   # must redeclare; DON'T repeat "x"

c = Child()
c.x = 1
c.y = 2
# c.z = 3  # AttributeError — no __dict__ in either class

class Broken(Base):
    pass  # no __slots__ → __dict__ added, defeating savings

print(hasattr(Child, "__dict__"))   # False (no instance dict)
print(hasattr(Broken, "__dict__"))  # True  (instance dict back)`,
    explanation: "__slots__ eliminates the per-instance __dict__ to save memory, but every class in the hierarchy must declare __slots__. A subclass without __slots__ silently reintroduces __dict__, negating the benefit.",
  },
  {
    id: "py-b16-b2-sys-recursion",
    language: "python",
    title: "sys.setrecursionlimit side effects",
    tag: "caveats",
    code: `import sys

print(sys.getrecursionlimit())  # default: 1000

# Raising the limit can mask bugs and risks stack overflow
sys.setrecursionlimit(5000)

def count_down(n):
    if n == 0:
        return
    count_down(n - 1)

# Better: convert to iteration
def count_down_iter(n):
    while n > 0:
        n -= 1`,
    explanation: "setrecursionlimit raises the Python stack depth limit, but the actual usable depth depends on the OS stack size — a very high limit can cause a hard C-level stack overflow rather than a clean RecursionError.",
  },
  {
    id: "py-b16-b2-set-name-descriptor",
    language: "python",
    title: "__set_name__ descriptor hook",
    tag: "classes",
    code: `class Validated:
    def __set_name__(self, owner, name):
        self.public_name = name
        self.private_name = "_" + name

    def __get__(self, obj, objtype=None):
        if obj is None: return self
        return getattr(obj, self.private_name, None)

    def __set__(self, obj, value):
        if not isinstance(value, int):
            raise TypeError(f"{self.public_name} must be int")
        setattr(obj, self.private_name, value)

class Point:
    x = Validated()
    y = Validated()

p = Point()
p.x = 10; p.y = 20
print(p.x, p.y)  # 10 20`,
    explanation: "__set_name__ is called by the metaclass when a descriptor is assigned to a class attribute, giving the descriptor access to the attribute name without requiring it to be passed manually.",
  },
  {
    id: "py-b16-b2-typing-unpack",
    language: "python",
    title: "typing.Unpack for TypedDict",
    tag: "types",
    code: `from typing import TypedDict, Unpack

class Options(TypedDict, total=False):
    timeout: float
    retries: int
    verbose: bool

def fetch(url: str, **kwargs: Unpack[Options]) -> bytes:
    timeout = kwargs.get("timeout", 30.0)
    retries = kwargs.get("retries", 3)
    # ... actual fetch logic ...
    return b""

fetch("https://example.com", timeout=10.0, retries=5)`,
    explanation: "Unpack[TD] (PEP 692) annotates **kwargs with a TypedDict shape, letting the type checker validate keyword argument names and types at call sites rather than accepting arbitrary **kwargs.",
  },
  {
    id: "py-b16-b2-coroutine-vs-generator",
    language: "python",
    title: "Coroutine vs generator",
    tag: "understanding",
    code: `import asyncio

# Generator: uses yield, driven by next()
def counter():
    for i in range(3):
        yield i

print(list(counter()))   # [0, 1, 2]

# Coroutine: uses await, driven by event loop
async def async_counter():
    for i in range(3):
        await asyncio.sleep(0)
        print(i)

asyncio.run(async_counter())  # 0 1 2`,
    explanation: "Generators produce values with yield and are iterated synchronously. Coroutines suspend at await points and are scheduled by an event loop — they don't produce values through a protocol but return a single result.",
  },
  {
    id: "py-b16-b2-configparser",
    language: "python",
    title: "configparser.ConfigParser",
    tag: "structures",
    code: `import configparser, io

cfg_text = """
[database]
host = localhost
port = 5432
name = mydb

[cache]
ttl = 300
"""

cfg = configparser.ConfigParser()
cfg.read_string(cfg_text)

print(cfg["database"]["host"])        # localhost
print(cfg.getint("database", "port")) # 5432
print(cfg.getint("cache", "ttl"))     # 300`,
    explanation: "ConfigParser reads INI-style configuration files and provides type-converting accessors (getint, getfloat, getboolean). Sections act like dicts and support fallback default values.",
  },
  {
    id: "py-b16-b2-dataclasses-transform",
    language: "python",
    title: "typing.dataclass_transform",
    tag: "types",
    code: `from typing import dataclass_transform

@dataclass_transform()
def my_model(cls):
    """Minimal ORM-like decorator."""
    cls.__fields__ = {
        k: v for k, v in cls.__annotations__.items()
    }
    return cls

@my_model
class User:
    name: str
    age: int

print(User.__fields__)   # {'name': <class 'str'>, 'age': <class 'int'>}`,
    explanation: "dataclass_transform (PEP 681) marks a decorator, base class, or metaclass as transforming a plain class into a dataclass-like type. Type checkers then give auto-complete and type-checking for the synthesised __init__.",
  },
  {
    id: "py-b16-b2-datetime-timedelta",
    language: "python",
    title: "datetime arithmetic with timedelta",
    tag: "snippet",
    code: `from datetime import datetime, timedelta

now = datetime(2026, 5, 16, 12, 0, 0)

in_30_days = now + timedelta(days=30)
last_week  = now - timedelta(weeks=1)
diff       = in_30_days - last_week

print(in_30_days.date())  # 2026-06-15
print(last_week.date())   # 2026-05-09
print(diff.days)          # 37`,
    explanation: "timedelta represents a duration and can be added to or subtracted from datetime objects. Subtracting two datetimes produces a timedelta; attributes like .days and .total_seconds() extract the magnitude.",
  },
  {
    id: "py-b16-b2-typing-concatenate",
    language: "python",
    title: "typing.Concatenate",
    tag: "types",
    code: `from typing import Callable, Concatenate, ParamSpec, TypeVar

P = ParamSpec("P")
R = TypeVar("R")

def with_logging(fn: Callable[Concatenate[str, P], R]) \
        -> Callable[P, R]:
    def wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
        print("calling", fn.__name__)
        return fn("LOG", *args, **kwargs)
    return wrapper

@with_logging
def greet(log_prefix: str, name: str) -> str:
    return f"[{log_prefix}] Hello {name}"

print(greet("Alice"))  # calling greet\n[LOG] Hello Alice`,
    explanation: "Concatenate[X, P] describes a callable whose first parameter is X and whose remaining parameters match ParamSpec P. This precisely types decorators that prepend an extra argument to the wrapped function.",
  },
  {
    id: "py-b16-b2-xml-etree",
    language: "python",
    title: "xml.etree.ElementTree parse",
    tag: "structures",
    code: `import xml.etree.ElementTree as ET

xml_str = """<catalog>
  <book id="1"><title>Python</title><price>29.99</price></book>
  <book id="2"><title>Algorithms</title><price>49.99</price></book>
</catalog>"""

root = ET.fromstring(xml_str)
for book in root.findall("book"):
    bid = book.get("id")
    title = book.findtext("title")
    price = float(book.findtext("price"))
    print(f"[{bid}] {title}: \${price:.2f}")`,
    explanation: "ElementTree.fromstring parses an XML string into an Element tree. findall navigates by tag name, get retrieves attributes, and findtext gets the text content of the first matching child.",
  },
  {
    id: "py-b16-b2-generator-throw",
    language: "python",
    title: "generator throw()",
    tag: "understanding",
    code: `def guarded():
    try:
        while True:
            value = yield
    except ValueError as e:
        print(f"caught: {e}")
        yield "recovered"

g = guarded()
next(g)                      # prime
next(g)                      # advances; value = None
result = g.throw(ValueError, "oops")
print(result)                # recovered`,
    explanation: "throw(exc_type, value) raises an exception at the point where the generator is suspended. If the generator catches it and yields again, throw returns that yielded value — useful for signalling cancellation or errors into a coroutine.",
  },
  {
    id: "py-b16-b2-unittest-pytest",
    language: "python",
    title: "unittest vs pytest conventions",
    tag: "families",
    code: `import unittest

# unittest style
class TestMath(unittest.TestCase):
    def test_add(self):
        self.assertEqual(1 + 1, 2)
    def test_raises(self):
        with self.assertRaises(ZeroDivisionError):
            1 / 0

# pytest style (no class needed, plain assert)
def test_add_pytest():
    assert 1 + 1 == 2

def test_raises_pytest():
    import pytest
    with pytest.raises(ZeroDivisionError):
        1 / 0`,
    explanation: "unittest requires subclassing TestCase and using self.assert* methods; pytest lets you use plain assert statements with rich failure diffs and requires no boilerplate class. Both can co-exist in a project.",
  },
  {
    id: "py-b16-b2-shelve",
    language: "python",
    title: "shelve for persistent dict",
    tag: "structures",
    code: `import shelve

path = "/tmp/myshelf"

with shelve.open(path) as db:
    db["user"] = {"name": "Alice", "score": 42}
    db["count"] = 1

with shelve.open(path) as db:
    print(db["user"])    # {'name': 'Alice', 'score': 42}
    db["count"] += 1
    print(db["count"])   # 2`,
    explanation: "shelve wraps dbm to provide a dict-like interface that pickles arbitrary Python objects to a file. It's useful for simple persistence without a full database — but beware that it uses pickle internally.",
  },
  {
    id: "py-b16-b2-signal-main-thread",
    language: "python",
    title: "signal handling only in main thread",
    tag: "caveats",
    code: `import signal, threading

def handler(sig, frame):
    print("signal received")

# This works (main thread)
signal.signal(signal.SIGINT, handler)

# This raises ValueError:
def try_in_thread():
    try:
        signal.signal(signal.SIGTERM, handler)
    except ValueError as e:
        print(f"Error: {e}")
        # Error: signal only works in main thread

t = threading.Thread(target=try_in_thread)
t.start(); t.join()`,
    explanation: "Python only allows signal handlers to be set from the main thread — attempting it from a worker thread raises ValueError. Use threading.Event or queue.Queue to communicate signals to worker threads.",
  },
  {
    id: "py-b16-b2-threading-local",
    language: "python",
    title: "threading.local vs global",
    tag: "caveats",
    code: `import threading

# Shared global: race condition!
shared_count = 0

# Per-thread storage: safe
local_data = threading.local()

def worker(tid):
    local_data.value = tid   # each thread gets its own .value
    import time; time.sleep(0.01)
    print(f"thread {tid}: {local_data.value}")

threads = [threading.Thread(target=worker, args=(i,)) for i in range(3)]
for t in threads: t.start()
for t in threads: t.join()`,
    explanation: "threading.local provides a namespace where each attribute is private to the thread that sets it. It's the standard way to store per-thread state (e.g., database connections) without locks.",
  },
  {
    id: "py-b16-b2-multiprocessing-fork-spawn",
    language: "python",
    title: "multiprocessing fork vs spawn",
    tag: "caveats",
    code: `import multiprocessing

# fork (default on Linux): copies parent process memory
# Danger: copies locks, file handles, sockets in bad state

# spawn (default on macOS/Windows): starts fresh interpreter
# Safer but slower; requires picklable targets

if __name__ == "__main__":
    ctx = multiprocessing.get_context("spawn")
    p = ctx.Process(target=print, args=("hello from spawn",))
    p.start()
    p.join()`,
    explanation: "fork is faster because it copies parent memory, but can corrupt shared state (locks, C extensions). spawn is safer — it starts a clean Python interpreter and re-imports modules, requiring all objects to be picklable.",
  },
  {
    id: "py-b16-b2-argparse-sysargv",
    language: "python",
    title: "argparse vs sys.argv",
    tag: "families",
    code: `import argparse, sys

# sys.argv: raw strings, no parsing
print(sys.argv)   # ['script.py', ...]

# argparse: structured, with validation and help
parser = argparse.ArgumentParser(description="Demo")
parser.add_argument("name")
parser.add_argument("--count", type=int, default=1)
parser.add_argument("--verbose", action="store_true")

# Simulate: args = parser.parse_args(["Alice", "--count", "3"])
args = parser.parse_args(["Alice", "--count", "3"])
print(args.name, args.count, args.verbose)
# Alice 3 False`,
    explanation: "sys.argv gives raw CLI strings; argparse converts them to typed Python values with automatic --help generation, usage errors, and default values. Use argparse for anything more complex than a single positional argument.",
  },
  {
    id: "py-b16-b2-abstract-class-getitem",
    language: "python",
    title: "__class_getitem__ for generics (understanding)",
    tag: "understanding",
    code: `class Stack:
    def __class_getitem__(cls, item):
        # Called when someone writes Stack[int]
        import types
        alias = types.GenericAlias(cls, (item,))
        return alias

    def __init__(self):
        self._data = []

    def push(self, val): self._data.append(val)
    def pop(self): return self._data.pop()

IntStack = Stack[int]    # calls __class_getitem__(int)
print(IntStack)          # __main__.Stack[int]
s = IntStack()           # still creates a plain Stack
s.push(1); print(s.pop())`,
    explanation: "__class_getitem__ is called by Python's subscript syntax on a class (MyClass[T]). It returns a GenericAlias that carries the type parameter for type-checking without affecting runtime behaviour.",
  },
  {
    id: "py-b16-b2-weakref-types",
    language: "python",
    title: "weakref to unweak-refable types",
    tag: "caveats",
    code: `import weakref

class MyClass:
    pass

obj = MyClass()
ref = weakref.ref(obj)
print(ref())    # <MyClass object>
del obj
print(ref())    # None — object was collected

# Built-in types without __weakref__ slot raise TypeError:
try:
    weakref.ref(42)
except TypeError as e:
    print(e)  # cannot create weak reference to 'int'`,
    explanation: "weakref.ref holds a reference that doesn't prevent garbage collection. Many built-in types (int, str, tuple, etc.) don't support weak references unless they define __weakref__ in their __slots__.",
  },
  {
    id: "py-b16-b2-tarfile",
    language: "python",
    title: "tarfile.TarFile",
    tag: "structures",
    code: `import tarfile, io

# Create an in-memory .tar.gz
buf = io.BytesIO()
with tarfile.open(fileobj=buf, mode="w:gz") as tf:
    content = b"Hello from tar!"
    info = tarfile.TarInfo(name="hello.txt")
    info.size = len(content)
    tf.addfile(info, io.BytesIO(content))

# Read it back
buf.seek(0)
with tarfile.open(fileobj=buf, mode="r:gz") as tf:
    print(tf.getnames())            # ['hello.txt']
    f = tf.extractfile("hello.txt")
    print(f.read())                 # b'Hello from tar!'`,
    explanation: "tarfile.open supports reading and writing tar archives in plain, gzip, bzip2, and xz formats to files or BytesIO buffers. addfile accepts a TarInfo header and a file-like object for the contents.",
  },
  {
    id: "py-b16-b2-dbm-keyvalue",
    language: "python",
    title: "dbm key-value storage",
    tag: "structures",
    code: `import dbm

with dbm.open("/tmp/mydb", "c") as db:
    db["name"] = "Alice"
    db["score"] = "42"

with dbm.open("/tmp/mydb", "r") as db:
    print(db["name"].decode())   # Alice
    print(list(db.keys()))       # [b'name', b'score']`,
    explanation: "dbm provides a simple persistent key-value store backed by the platform's best available database (gdbm, ndbm, or dumbdbm). Keys and values are always bytes, so encode/decode when working with strings.",
  },
  {
    id: "py-b16-b2-io-bytesio",
    language: "python",
    title: "io.BytesIO binary buffer",
    tag: "structures",
    code: `import io, struct

buf = io.BytesIO()
# Write structured binary data
buf.write(struct.pack(">HH", 1920, 1080))  # big-endian width, height
buf.write(b"IMGDATA")

# Read back
buf.seek(0)
width, height = struct.unpack(">HH", buf.read(4))
rest = buf.read()
print(width, height)   # 1920 1080
print(rest)            # b'IMGDATA'`,
    explanation: "io.BytesIO is an in-memory binary stream compatible with any API expecting a file-like binary object. It's useful for constructing binary formats in memory before writing to a network socket or compressor.",
  },
  {
    id: "py-b16-b2-typing-nonstatic-overload",
    language: "python",
    title: "typing.dataclass_transform usage",
    tag: "understanding",
    code: `from dataclasses import dataclass

# __post_init__ receives InitVar fields as plain arguments
from dataclasses import field, InitVar

@dataclass
class HashedPassword:
    raw: InitVar[str]        # passed to __post_init__, not stored
    digest: str = field(init=False)

    def __post_init__(self, raw: str) -> None:
        import hashlib
        self.digest = hashlib.sha256(raw.encode()).hexdigest()

hp = HashedPassword("secret")
print(hasattr(hp, "raw"))    # False
print(hp.digest[:8])         # 2bb80d53...`,
    explanation: "InitVar marks a field that is passed to __post_init__ as a normal parameter but is not stored as an instance attribute. This is the standard way to supply constructor-only data that the dataclass processes internally.",
  },
  {
    id: "py-b16-b2-multiprocessing-queue",
    language: "python",
    title: "multiprocessing.Queue",
    tag: "structures",
    code: `import multiprocessing

def worker(q: multiprocessing.Queue, val: int) -> None:
    result = val ** 2
    q.put(result)

if __name__ == "__main__":
    q: multiprocessing.Queue = multiprocessing.Queue()
    procs = [multiprocessing.Process(target=worker, args=(q, i))
             for i in range(5)]
    for p in procs: p.start()
    for p in procs: p.join()
    results = [q.get() for _ in range(5)]
    print(sorted(results))  # [0, 1, 4, 9, 16]`,
    explanation: "multiprocessing.Queue uses OS pipes and pickled data to safely pass objects between separate processes. Unlike threading.Queue it serialises values with pickle, so only picklable objects can be sent.",
  },
  {
    id: "py-b16-b2-typing-class-getitem-understanding",
    language: "python",
    title: "__init__ vs __new__ execution order",
    tag: "understanding",
    code: `class Singleton:
    _instance = None

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            print("__new__ called")
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self, value: int):
        print(f"__init__ called with {value}")
        self.value = value

a = Singleton(1)  # __new__ called; __init__ called with 1
b = Singleton(2)  # __new__ NOT called; __init__ called with 2
print(a is b)     # True — same object`,
    explanation: "__new__ creates and returns the object; __init__ initialises the already-created instance. Because __new__ returns the existing instance in this Singleton, __new__ runs only once, but __init__ runs on every call and can reset state.",
  },
  {
    id: "py-b16-b2-functools-wraps-understanding",
    language: "python",
    title: "Property getter/setter interaction",
    tag: "understanding",
    code: `class BoundedFloat:
    def __init__(self, lo: float, hi: float):
        self._lo, self._hi = lo, hi
        self._val = lo

    @property
    def value(self) -> float:
        return self._val

    @value.setter
    def value(self, v: float) -> None:
        self._val = max(self._lo, min(self._hi, v))

f = BoundedFloat(0.0, 1.0)
f.value = 2.5
print(f.value)    # 1.0  (clamped)
f.value = -0.5
print(f.value)    # 0.0  (clamped)`,
    explanation: "The getter is called whenever the attribute is read; the setter is called on every assignment. They share the decorated name but live as separate functions inside the property descriptor, allowing transparent validation without changing the call site.",
  },
  {
    id: "py-b16-b2-abc-mutableseq",
    language: "python",
    title: "collections.abc.MutableSequence",
    tag: "structures",
    code: `from collections.abc import MutableSequence

class CappedList(MutableSequence):
    def __init__(self, cap: int):
        self._data: list = []
        self._cap = cap

    def __getitem__(self, i): return self._data[i]
    def __setitem__(self, i, v): self._data[i] = v
    def __delitem__(self, i): del self._data[i]
    def __len__(self): return len(self._data)

    def insert(self, i, v):
        if len(self._data) >= self._cap:
            raise OverflowError("cap reached")
        self._data.insert(i, v)

cl = CappedList(3)
cl.append(1); cl.append(2); cl.append(3)
print(list(cl))  # [1, 2, 3]`,
    explanation: "Implementing MutableSequence requires only __getitem__, __setitem__, __delitem__, __len__, and insert; the ABC provides append, extend, remove, pop, index, count, __contains__, __iter__, __reversed__, and __iadd__ for free.",
  },
  {
    id: "py-b16-b2-exception-groups",
    language: "python",
    title: "Exception chaining and context",
    tag: "caveats",
    code: `def load(path: str):
    try:
        return open(path).read()
    except FileNotFoundError as e:
        raise ValueError(f"Cannot load config: {path}") from e

try:
    load("/nonexistent/file.cfg")
except ValueError as e:
    print(repr(e))
    # ValueError: Cannot load config: /nonexistent/file.cfg
    print(repr(e.__cause__))
    # FileNotFoundError: [Errno 2] No such file or directory

# raise X (no 'from'): sets __context__, not __cause__
# raise X from None: suppresses the original exception`,
    explanation: "Python distinguishes explicit chaining (raise X from Y, sets __cause__) from implicit chaining (raise inside except, sets __context__). Use raise ... from None to suppress an irrelevant original exception and present a cleaner traceback.",
  },
];
