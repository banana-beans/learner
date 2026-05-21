import type { Snippet } from "./types";

export const pythonSnippets20260521B3: Snippet[] = [
  {
    id: "py-0521-b3-hash-dict-internals",
    language: "python",
    title: "how Python dict lookup works (hash table)",
    tag: "understanding",
    code: `# Python dict uses open addressing hash tables
# Key lookup: hash(key) -> slot -> compare

d = {"a": 1, "b": 2}

# hash() must be stable and consistent with ==
print(hash("hello"))     # some integer (implementation defined)
print(hash(1))           # 1  (int hashes to itself)
print(hash(1.0))         # 1  (== to 1, so same hash)
print(1 == 1.0)          # True — same hash is required!

# Objects that compare equal must have the same hash
class Bad:
    def __eq__(self, other): return True
    # Not defining __hash__ -> sets __hash__ = None -> unhashable

b = Bad()
try: {b}
except TypeError: print("unhashable — correct, but accidental")`,
    explanation: "Python requires that `a == b` implies `hash(a) == hash(b)` — violating this makes objects disappear from sets and dicts; defining `__eq__` without `__hash__` sets `__hash__` to `None`, making the object unhashable.",
  },
  {
    id: "py-0521-b3-generator-delegation",
    language: "python",
    title: "yield from for generator delegation",
    tag: "snippet",
    code: `def inner():
    yield 1
    yield 2
    yield 3

def outer():
    yield "start"
    yield from inner()      # delegates all values from inner
    yield from range(4, 7)  # works with any iterable
    yield "end"

print(list(outer()))
# ['start', 1, 2, 3, 4, 5, 6, 'end']

# yield from also passes .send() and .throw() through
def accumulator():
    total = 0
    while True:
        value = yield total
        total += value

def proxy():
    gen = accumulator()
    yield from gen   # transparently passes send/throw`,
    explanation: "`yield from iterable` is equivalent to `for x in iterable: yield x` but also delegates `.send()`, `.throw()`, and `.close()` calls through to the sub-generator — essential for composing coroutine pipelines.",
  },
  {
    id: "py-0521-b3-class-init-class-var",
    language: "python",
    title: "class variable mutation trap with mutable objects",
    tag: "caveats",
    code: `class Config:
    settings = {}   # class variable — shared across ALL instances!

a = Config()
b = Config()

a.settings["debug"] = True   # mutates the shared dict!
print(b.settings)             # {'debug': True}  — not what you wanted

# Fix: initialize mutable state in __init__
class Config2:
    def __init__(self):
        self.settings = {}   # instance variable — per object

a2 = Config2()
b2 = Config2()
a2.settings["debug"] = True
print(b2.settings)   # {}  — independent`,
    explanation: "Mutable class variables are shared across all instances — mutating them (`.append`, `.update`, item assignment) affects every instance; only reassignment (`self.settings = {}`) creates a per-instance shadow.",
  },
  {
    id: "py-0521-b3-copy-protocol",
    language: "python",
    title: "__copy__ and __deepcopy__ customization",
    tag: "classes",
    code: `import copy

class Node:
    def __init__(self, value, next_node=None):
        self.value = value
        self.next = next_node

    def __copy__(self):
        # Shallow: share next, don't copy it
        new = Node(self.value)
        new.next = self.next
        return new

    def __deepcopy__(self, memo):
        # Deep: recursively copy next
        new = Node(copy.deepcopy(self.value, memo))
        new.next = copy.deepcopy(self.next, memo)
        memo[id(self)] = new   # handle cycles
        return new

n1 = Node(1, Node(2))
n2 = copy.copy(n1)
n3 = copy.deepcopy(n1)

print(n2.next is n1.next)   # True  — shallow: shared
print(n3.next is n1.next)   # False — deep: independent`,
    explanation: "`__copy__` and `__deepcopy__` let classes control their copy behavior — the `memo` dict in `__deepcopy__` prevents infinite recursion on cyclic structures by tracking already-copied objects.",
  },
  {
    id: "py-0521-b3-match-class-pattern-custom",
    language: "python",
    title: "match_args for class pattern matching",
    tag: "classes",
    code: `class Point:
    __match_args__ = ("x", "y")   # positional pattern order

    def __init__(self, x, y):
        self.x = x
        self.y = y

def classify(shape):
    match shape:
        case Point(0, 0):
            return "origin"
        case Point(x, 0):       # positional patterns use __match_args__
            return f"x-axis at {x}"
        case Point(0, y):
            return f"y-axis at {y}"
        case Point(x, y):
            return f"({x}, {y})"

print(classify(Point(0, 0)))   # origin
print(classify(Point(3, 0)))   # x-axis at 3`,
    explanation: "`__match_args__` defines which attributes positional class patterns bind in order — without it, only keyword patterns (`Point(x=3, y=0)`) work; dataclasses and named tuples define `__match_args__` automatically.",
  },
  {
    id: "py-0521-b3-float-precision",
    language: "python",
    title: "floating-point representation and epsilon comparison",
    tag: "types",
    code: `import math, sys

# Binary float cannot represent 0.1 exactly
print(0.1)              # 0.1  (repr rounds)
print(repr(0.1))        # 0.1
print(f"{0.1:.20f}")    # 0.10000000000000000555...

# Equality comparison: use tolerance
a = 0.1 + 0.2
b = 0.3
print(a == b)                          # False
print(math.isclose(a, b))             # True  (relative tolerance)
print(math.isclose(a, b, rel_tol=1e-9, abs_tol=0.0))  # True

# Machine epsilon
print(sys.float_info.epsilon)         # 2.22e-16`,
    explanation: "Never compare floats with `==` — use `math.isclose` which applies a relative tolerance (default 1e-9) to account for floating-point errors; `abs_tol` is also needed when comparing values near zero.",
  },
  {
    id: "py-0521-b3-typing-annotated",
    language: "python",
    title: "Annotated for attaching metadata to types",
    tag: "types",
    code: `from typing import Annotated, get_type_hints, get_args

# Attach arbitrary metadata to a type annotation
class Gt:
    def __init__(self, value): self.value = value

class Lt:
    def __init__(self, value): self.value = value

Positive = Annotated[int, Gt(0)]
Score    = Annotated[float, Gt(0), Lt(100)]

def create_score(value: Score) -> Score:
    return value

# Libraries (Pydantic, beartype) read these annotations at runtime
hints = get_type_hints(create_score, include_extras=True)
print(hints["value"])                  # Annotated[float, Gt(0), Lt(100)]
print(get_args(hints["value"]))        # (float, Gt(0), Lt(100))`,
    explanation: "`Annotated[T, metadata...]` attaches arbitrary metadata to a type annotation — the metadata is ignored by the runtime and standard type checkers but read by libraries like Pydantic and beartype for validation.",
  },
  {
    id: "py-0521-b3-exception-notes",
    language: "python",
    title: "__notes__: adding context to exceptions (Python 3.11+)",
    tag: "caveats",
    code: `def parse_config(filename: str) -> dict:
    try:
        with open(filename) as f:
            import json
            return json.load(f)
    except json.JSONDecodeError as e:
        e.add_note(f"While parsing config file: {filename}")
        e.add_note("Ensure the file contains valid JSON")
        raise

try:
    parse_config("bad.json")
except Exception as e:
    print(e.__notes__)   # ['While parsing config file: bad.json', ...]
    # Tracebacks also display notes automatically`,
    explanation: "`exception.add_note(str)` (Python 3.11+) attaches additional context to an exception without wrapping it in a new exception — notes appear in the traceback and are stored in `e.__notes__`.",
  },
  {
    id: "py-0521-b3-class-override-new",
    language: "python",
    title: "immutable object creation via __new__",
    tag: "classes",
    code: `class ImmutablePoint(tuple):
    """Immutable 2D point built on tuple so it's hashable."""

    def __new__(cls, x: float, y: float):
        return super().__new__(cls, (x, y))

    @property
    def x(self) -> float: return self[0]

    @property
    def y(self) -> float: return self[1]

    def __repr__(self) -> str:
        return f"ImmutablePoint({self.x}, {self.y})"

p = ImmutablePoint(3.0, 4.0)
print(p.x, p.y)   # 3.0 4.0
print(hash(p))    # works — it's a tuple
print({p: "point"})   # usable as dict key`,
    explanation: "Subclassing immutable types (`tuple`, `str`, `int`, `frozenset`) requires overriding `__new__` instead of `__init__`, because the value is fixed at creation time and `__init__` receives an already-finalized object.",
  },
  {
    id: "py-0521-b3-re-compile-flags",
    language: "python",
    title: "regex flags: IGNORECASE, MULTILINE, DOTALL, VERBOSE",
    tag: "snippet",
    code: `import re

text = """
# User record
NAME=Alice
EMAIL=alice@example.com
AGE=30
"""

# VERBOSE: whitespace and # comments inside pattern
pattern = re.compile(r"""
    ^           # start of line
    (\\w+)      # key
    =           # delimiter
    (.+)        # value
    $           # end of line
""", re.MULTILINE | re.VERBOSE)

for match in pattern.finditer(text):
    key, value = match.groups()
    if not key.startswith("#"):
        print(f"{key!r}: {value!r}")
# 'NAME': 'Alice' / 'EMAIL': '...' / 'AGE': '30'`,
    explanation: "`re.MULTILINE` makes `^`/`$` match line boundaries instead of string boundaries; `re.VERBOSE` strips whitespace and `#` comments from the pattern for documentation; combine flags with `|`.",
  },
  {
    id: "py-0521-b3-abstract-classmethod",
    language: "python",
    title: "abstract class method and static method",
    tag: "classes",
    code: `from abc import ABC, abstractmethod

class Serializer(ABC):
    @classmethod
    @abstractmethod
    def from_string(cls, data: str) -> "Serializer": ...

    @staticmethod
    @abstractmethod
    def format_name() -> str: ...

    @abstractmethod
    def to_string(self) -> str: ...

class JSONSerializer(Serializer):
    def __init__(self, data: dict):
        self._data = data

    @classmethod
    def from_string(cls, data: str) -> "JSONSerializer":
        import json
        return cls(json.loads(data))

    @staticmethod
    def format_name() -> str: return "json"

    def to_string(self) -> str:
        import json
        return json.dumps(self._data)

s = JSONSerializer.from_string('{"key": 1}')
print(s.to_string())   # {"key": 1}`,
    explanation: "Abstract class methods and static methods work similarly to abstract instance methods — the decorators must be stacked in order: `@classmethod @abstractmethod` or `@staticmethod @abstractmethod` (the abstract decorator innermost).",
  },
  {
    id: "py-0521-b3-itertools-combinations",
    language: "python",
    title: "itertools combinations and permutations",
    tag: "snippet",
    code: `from itertools import combinations, permutations, combinations_with_replacement

items = ["A", "B", "C"]

# combinations: order doesn't matter, no repetition
print(list(combinations(items, 2)))
# [('A','B'), ('A','C'), ('B','C')]

# permutations: order matters, no repetition
print(list(permutations(items, 2)))
# [('A','B'),('A','C'),('B','A'),('B','C'),('C','A'),('C','B')]

# combinations_with_replacement: order doesn't matter, repetition allowed
print(list(combinations_with_replacement("AB", 2)))
# [('A','A'), ('A','B'), ('B','B')]

# Count without generating (math.comb)
import math
print(math.comb(52, 5))   # 2598960 — poker hand combinations`,
    explanation: "`combinations(n,k)` generates C(n,k) tuples in lexicographic order; `permutations` generates P(n,k) ordered tuples; both are lazy iterators — use `math.comb`/`math.perm` just to count without materializing all combinations.",
  },
  {
    id: "py-0521-b3-class-slots-inheritance-fixed",
    language: "python",
    title: "using __init_subclass__ to enforce subclass constraints",
    tag: "classes",
    code: `class RequireDocstring:
    def __init_subclass__(cls, **kwargs):
        super().__init_subclass__(**kwargs)
        for name, method in cls.__dict__.items():
            if callable(method) and not name.startswith("_"):
                if not method.__doc__:
                    raise TypeError(
                        f"{cls.__name__}.{name} must have a docstring"
                    )

class MyAPI(RequireDocstring):
    def good_method(self):
        """This is documented."""
        pass

try:
    class BadAPI(RequireDocstring):
        def no_doc(self):   # no docstring
            pass
except TypeError as e:
    print(e)   # BadAPI.no_doc must have a docstring`,
    explanation: "`__init_subclass__` fires at class creation time, letting a base class validate that all subclasses satisfy structural constraints — this pattern enforces coding standards at import time rather than at runtime.",
  },
  {
    id: "py-0521-b3-int-overflow-safe",
    language: "python",
    title: "safe arithmetic: Python ints vs numpy ints",
    tag: "types",
    code: `import numpy as np

# Python int: unbounded
python_big = 2 ** 63
print(python_big)          # 9223372036854775808 (no overflow)

# numpy int64: fixed 64-bit — overflows silently!
numpy_big = np.int64(2 ** 62)
result = numpy_big * 4     # overflow!
print(result)              # -9223372036854775808  (wrong!)

# Use Python int or check overflow explicitly
safe = int(numpy_big) * 4
print(safe)                # 9223372036854775808  (correct)

# Detect numpy overflow
print(np.iinfo(np.int64).max)   # 9223372036854775807`,
    explanation: "Python `int` is unbounded and never overflows; numpy `int64` is a C-style 64-bit integer and wraps silently on overflow — convert to Python `int` for arithmetic that may exceed 64-bit range, or check `np.iinfo(dtype).max`.",
  },
  {
    id: "py-0521-b3-typing-covariant",
    language: "python",
    title: "covariant and contravariant TypeVar",
    tag: "types",
    code: `from typing import TypeVar, Generic

# Covariant: read-only container
T_co = TypeVar("T_co", covariant=True)

class ReadOnly(Generic[T_co]):
    def __init__(self, value: T_co):
        self._value = value
    def get(self) -> T_co:
        return self._value

# Contravariant: write-only consumer
T_contra = TypeVar("T_contra", contravariant=True)

class Consumer(Generic[T_contra]):
    def accept(self, value: T_contra) -> None:
        print(value)

class Animal: pass
class Dog(Animal): pass

# Covariant: ReadOnly[Dog] is a ReadOnly[Animal]
ro: ReadOnly[Animal] = ReadOnly(Dog())   # OK

# Contravariant: Consumer[Animal] is a Consumer[Dog]
c: Consumer[Dog] = Consumer()   # OK — accepts any Animal, so also Dog`,
    explanation: "Covariant `TypeVar` (`covariant=True`) allows subtype assignment in the \"output\" position; contravariant allows it in the \"input\" position — Python's type system enforces Liskov Substitution through these annotations.",
  },
  {
    id: "py-0521-b3-dataclass-field-metadata",
    language: "python",
    title: "dataclass field metadata for framework integration",
    tag: "classes",
    code: `from dataclasses import dataclass, field, fields
from typing import Any

def validated(min_val=None, max_val=None) -> Any:
    return field(metadata={"min": min_val, "max": max_val})

@dataclass
class Config:
    port:    int   = validated(min_val=1, max_val=65535)
    timeout: float = validated(min_val=0.1, max_val=300.0)

    def __post_init__(self):
        for f in fields(self):
            val = getattr(self, f.name)
            lo = f.metadata.get("min")
            hi = f.metadata.get("max")
            if lo is not None and val < lo:
                raise ValueError(f"{f.name} below minimum {lo}")
            if hi is not None and val > hi:
                raise ValueError(f"{f.name} above maximum {hi}")

c = Config(port=8080, timeout=30.0)
try:
    Config(port=0, timeout=30.0)
except ValueError as e:
    print(e)   # port below minimum 1`,
    explanation: "The `metadata` argument to `field()` is an immutable mapping accessible via `fields(cls)` — frameworks like SQLAlchemy and attrs use it to attach ORM mappings, validators, or schema hints to dataclass fields.",
  },
  {
    id: "py-0521-b3-string-codec-bytes",
    language: "python",
    title: "base64 encoding and decoding",
    tag: "snippet",
    code: `import base64

# Encode bytes to base64 string
data = b"Hello, World! \\x00\\x01\\xff"
encoded = base64.b64encode(data)
print(encoded)           # b'SGVsbG8sIFdvcmxkIQAB/w=='
print(type(encoded))     # <class 'bytes'>

# Decode back
decoded = base64.b64decode(encoded)
print(decoded == data)   # True

# URL-safe variant (uses - and _ instead of + and /)
url_safe = base64.urlsafe_b64encode(data)
print(url_safe)          # b'SGVsbG8sIFdvcmxkIQAB_w=='

# Encode string via bytes
text_b64 = base64.b64encode("python".encode()).decode()
print(text_b64)          # cHl0aG9u`,
    explanation: "Base64 encodes binary data as ASCII text — useful for embedding binary in JSON or URLs; `urlsafe_b64encode` replaces `+`/`/` with `-`/`_` for HTTP-safe strings; always `decode()` the result for a `str`.",
  },
  {
    id: "py-0521-b3-zip-unzip",
    language: "python",
    title: "zip for transposing and unzipping",
    tag: "snippet",
    code: `# Zip: pairing
names  = ["Alice", "Bob", "Carol"]
scores = [90, 85, 92]
paired = list(zip(names, scores))
print(paired)   # [('Alice', 90), ('Bob', 85), ('Carol', 92)]

# Unzip: use zip(*iterable) to transpose
unzipped_names, unzipped_scores = zip(*paired)
print(list(unzipped_names))    # ['Alice', 'Bob', 'Carol']
print(list(unzipped_scores))   # [90, 85, 92]

# Transpose a matrix
matrix = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]
transposed = list(zip(*matrix))
print(transposed)   # [(1,4,7), (2,5,8), (3,6,9)]`,
    explanation: "`zip(*iterable)` is the unzip operation — the splat unpacks rows as separate arguments to `zip`, which then reassembles by column; this works for any rectangular 2D sequence without numpy.",
  },
  {
    id: "py-0521-b3-functools-singledispatchmethod",
    language: "python",
    title: "singledispatchmethod for class method overloading",
    tag: "classes",
    code: `from functools import singledispatchmethod

class Formatter:
    @singledispatchmethod
    def format(self, value) -> str:
        return str(value)   # fallback

    @format.register(int)
    def _(self, value: int) -> str:
        return f"{value:,}"

    @format.register(float)
    def _(self, value: float) -> str:
        return f"{value:.2f}"

    @format.register(list)
    def _(self, value: list) -> str:
        return ", ".join(self.format(x) for x in value)

f = Formatter()
print(f.format(1234567))        # 1,234,567
print(f.format(3.14159))        # 3.14
print(f.format([1000, 2.5]))    # 1,000, 2.50`,
    explanation: "`singledispatchmethod` (Python 3.8+) is the class method version of `singledispatch` — registered implementations are looked up by the type of the first non-`self` argument; type annotations on registered methods aren't used for dispatch.",
  },
  {
    id: "py-0521-b3-abc-mixin-combination",
    language: "python",
    title: "combining ABC with mixin for reusable interface + implementation",
    tag: "classes",
    code: `from abc import ABC, abstractmethod

class Persistable(ABC):
    @abstractmethod
    def to_dict(self) -> dict: ...

    @classmethod
    @abstractmethod
    def from_dict(cls, data: dict) -> "Persistable": ...

class JSONMixin:
    def to_json(self) -> str:
        import json
        return json.dumps(self.to_dict())   # calls abstractmethod

class User(Persistable, JSONMixin):
    def __init__(self, name: str, age: int):
        self.name = name
        self.age = age

    def to_dict(self) -> dict:
        return {"name": self.name, "age": self.age}

    @classmethod
    def from_dict(cls, data: dict) -> "User":
        return cls(data["name"], data["age"])

u = User("Alice", 30)
print(u.to_json())   # {"name": "Alice", "age": 30}`,
    explanation: "An ABC defines the interface contract; a mixin provides concrete behavior that depends on that interface — together they let you write generic utilities (JSON serialization) that work for any class implementing the ABC.",
  },
  {
    id: "py-0521-b3-pattern-matching-complex",
    language: "python",
    title: "match with nested class and sequence patterns",
    tag: "snippet",
    code: `from dataclasses import dataclass

@dataclass
class Token:
    type: str
    value: str | int

def evaluate(tokens: list[Token]) -> str:
    match tokens:
        case [Token("NUMBER", n), Token("PLUS"), Token("NUMBER", m)]:
            return f"{n} + {m} = {n + m}"
        case [Token("STRING", s), Token("CONCAT"), Token("STRING", t)]:
            return f"{s!r} + {t!r} = {(s + t)!r}"
        case [Token(type=t)]:
            return f"single {t} token"
        case _:
            return "unrecognized pattern"

toks = [Token("NUMBER", 3), Token("PLUS", "+"), Token("NUMBER", 4)]
print(evaluate(toks))   # 3 + 4 = 7`,
    explanation: "Match patterns can nest arbitrarily — a sequence pattern can contain class patterns, which can have keyword sub-patterns; each named binding (`n`, `m`, `s`, `t`) is available in the arm's body and in the guard.",
  },
  {
    id: "py-0521-b3-io-performance",
    language: "python",
    title: "buffered vs unbuffered I/O performance",
    tag: "snippet",
    code: `import io, time, os

path = "/tmp/perf_test.txt"

# Unbuffered: system call on every write — very slow
start = time.perf_counter()
with open(path, "wb", buffering=0) as f:   # buffering=0: raw I/O
    for _ in range(10_000):
        f.write(b"x")
unbuffered = time.perf_counter() - start

# Buffered: OS write only when buffer fills — very fast
start = time.perf_counter()
with open(path, "wb") as f:               # default: 8KB buffer
    for _ in range(10_000):
        f.write(b"x")
buffered = time.perf_counter() - start

print(f"unbuffered: {unbuffered:.3f}s, buffered: {buffered:.4f}s")
os.unlink(path)`,
    explanation: "Buffered I/O (the default) batches writes into 8KB blocks and makes one system call per block — unbuffered I/O makes a system call for every single byte, making it 100–1000× slower for small repeated writes.",
  },
  {
    id: "py-0521-b3-namedtuple-defaults",
    language: "python",
    title: "NamedTuple with defaults (Python 3.6.1+)",
    tag: "structures",
    code: `from typing import NamedTuple

class HTTPResponse(NamedTuple):
    status: int
    body: str = ""
    headers: dict = {}
    version: str = "HTTP/1.1"

# defaults apply from right-to-left
r1 = HTTPResponse(200)
r2 = HTTPResponse(404, "Not Found")
r3 = HTTPResponse(200, "OK", {"Content-Type": "text/plain"})

print(r1)   # HTTPResponse(status=200, body='', headers={}, version='HTTP/1.1')
print(r2.status, r2.body)   # 404 Not Found

# Mutable default (dict) is shared — use field(default_factory=dict)
# in dataclass instead if mutation is needed`,
    explanation: "Class-based `NamedTuple` syntax supports default values (from Python 3.6.1) — defaults apply right-to-left like function default arguments; be careful with mutable defaults that are shared across instances.",
  },
  {
    id: "py-0521-b3-typing-new-type",
    language: "python",
    title: "NewType for nominal typing without overhead",
    tag: "types",
    code: `from typing import NewType

UserId   = NewType("UserId",   int)
OrderId  = NewType("OrderId",  int)

def get_user(uid: UserId) -> str:
    return f"user-{uid}"

def get_order(oid: OrderId) -> str:
    return f"order-{oid}"

uid = UserId(42)
oid = OrderId(99)

get_user(uid)    # OK
# get_user(oid)  # type error: OrderId is not UserId
# get_user(42)   # type error: plain int is not UserId

# At runtime, NewType is an identity function — no overhead
print(uid == 42)   # True  (it's still an int at runtime)`,
    explanation: "`NewType` creates a distinct type for type checking without any runtime overhead — `UserId(42)` is just `42` at runtime; this prevents accidentally passing an `OrderId` where a `UserId` is expected.",
  },
  {
    id: "py-0521-b3-class-registry-pattern",
    language: "python",
    title: "class registry with __init_subclass__",
    tag: "classes",
    code: `class Handler:
    _registry: dict[str, type] = {}

    def __init_subclass__(cls, command: str = "", **kwargs):
        super().__init_subclass__(**kwargs)
        if command:
            Handler._registry[command] = cls

    @classmethod
    def get(cls, command: str) -> "Handler":
        handler_cls = cls._registry.get(command)
        if handler_cls is None:
            raise KeyError(f"No handler for {command!r}")
        return handler_cls()

    def execute(self) -> str: ...

class QuitHandler(Handler, command="quit"):
    def execute(self) -> str: return "quitting"

class HelpHandler(Handler, command="help"):
    def execute(self) -> str: return "showing help"

h = Handler.get("help")
print(h.execute())   # showing help`,
    explanation: "The registry pattern with `__init_subclass__` auto-registers each subclass in a class-level dict — new command handlers are discovered just by defining a subclass with a `command=` keyword argument, no manual `register()` call needed.",
  },
  {
    id: "py-0521-b3-contextlib-contextdecorator",
    language: "python",
    title: "contextlib.ContextDecorator for dual-mode use",
    tag: "classes",
    code: `from contextlib import ContextDecorator, contextmanager
import time

class Timer(ContextDecorator):
    def __enter__(self):
        self._start = time.perf_counter()
        return self

    def __exit__(self, *exc):
        self.elapsed = time.perf_counter() - self._start
        print(f"elapsed: {self.elapsed:.3f}s")
        return False   # don't suppress exceptions

timer = Timer()

# As context manager
with timer:
    sum(range(1_000_000))

# As decorator — same class, zero extra code
@timer
def heavy():
    return sum(range(1_000_000))

heavy()   # elapsed: ...s`,
    explanation: "Inheriting `ContextDecorator` gives a context manager class dual-mode capability — it can be used both as a `with` block and as a function decorator without any extra code.",
  },
  {
    id: "py-0521-b3-bytes-struct-parsing",
    language: "python",
    title: "struct for parsing binary file headers",
    tag: "snippet",
    code: `import struct

# PNG file signature + IHDR chunk
PNG_SIG = b"\\x89PNG\\r\\n\\x1a\\n"

# Simulate reading a PNG header
png_data = (
    PNG_SIG
    + struct.pack(">I", 13)          # IHDR chunk length
    + b"IHDR"                         # chunk type
    + struct.pack(">II", 800, 600)   # width, height
    + b"\\x08\\x02\\x00\\x00\\x00"    # bit depth, color type, etc.
)

# Parse
sig = png_data[:8]
assert sig == PNG_SIG

offset = 8
length, = struct.unpack_from(">I", png_data, offset); offset += 4
chunk_type = png_data[offset:offset+4].decode(); offset += 4
width, height = struct.unpack_from(">II", png_data, offset)
print(f"{chunk_type}: {width}×{height}")   # IHDR: 800×600`,
    explanation: "`struct.unpack_from(fmt, buffer, offset)` reads from a specific byte offset without slicing — combine with `calcsize(fmt)` to advance the offset by each field's size when walking a binary format.",
  },
  {
    id: "py-0521-b3-typing-reveal-type",
    language: "python",
    title: "reveal_type() for type checker queries",
    tag: "types",
    code: `# reveal_type() is a special function understood by mypy/pyright
# It prints the inferred type and is a no-op at runtime

from typing import reveal_type

x = [1, 2, 3]
reveal_type(x)          # Revealed type: list[int]

y = x[0] + 1.0
reveal_type(y)          # Revealed type: float

def process(n: int | str) -> None:
    if isinstance(n, int):
        reveal_type(n)  # Revealed type: int  (narrowed!)
    else:
        reveal_type(n)  # Revealed type: str  (narrowed!)`,
    explanation: "`reveal_type(expr)` is a special type-checker directive that outputs the inferred type without producing an error — it's the static equivalent of `print(type(x))`, useful when debugging type inference.",
  },
  {
    id: "py-0521-b3-class-method-resolution",
    language: "python",
    title: "method resolution and attribute lookup order",
    tag: "understanding",
    code: `class A:
    x = "class A"
    def method(self): return "A.method"

class B(A):
    pass

obj = B()
obj.x = "instance"

# Python lookup order for obj.x:
# 1. Data descriptors from class hierarchy
# 2. Instance __dict__
# 3. Non-data descriptors + class vars from MRO

print(obj.x)         # "instance"  (instance wins over class)
del obj.x
print(obj.x)         # "class A"   (falls back to class)
print(obj.method())  # "A.method"  (inherited from A)

# type(obj).__mro__ shows the search order for class lookup
print(B.__mro__)     # (<class 'B'>, <class 'A'>, <class 'object'>)`,
    explanation: "Python's attribute lookup checks data descriptors first, then the instance `__dict__`, then non-data descriptors and class attributes in MRO order — understanding this order explains why `property` (a data descriptor) overrides instance attributes.",
  },
  {
    id: "py-0521-b3-exec-dynamic-class",
    language: "python",
    title: "type() for dynamic class creation",
    tag: "classes",
    code: `# type(name, bases, namespace) creates a class at runtime
Animal = type("Animal", (object,), {
    "sound": "...",
    "speak": lambda self: f"{self.sound}!",
})

Dog = type("Dog", (Animal,), {
    "sound": "Woof",
    "__init__": lambda self, name: setattr(self, "name", name),
    "__repr__": lambda self: f"Dog({self.name!r})",
})

d = Dog("Rex")
print(d.speak())    # Woof!
print(repr(d))      # Dog('Rex')
print(isinstance(d, Animal))   # True`,
    explanation: "`type(name, bases, dict)` is the metaclass call that creates every class — `class Foo(Bar): ...` is just syntactic sugar for `Foo = type('Foo', (Bar,), {...})`; use this for programmatic class generation (ORMs, test factories).",
  },
  {
    id: "py-0521-b3-contextmanager-stack",
    language: "python",
    title: "ExitStack for dynamic context manager composition",
    tag: "snippet",
    code: `from contextlib import ExitStack
import tempfile, os

def process_files(paths: list[str]) -> list[str]:
    results = []
    with ExitStack() as stack:
        # Open a variable number of files
        files = [stack.enter_context(open(p)) for p in paths]
        for f in files:
            results.append(f.read())
    # All files closed here
    return results

# Create temp files for demo
tmps = []
with ExitStack() as s:
    for content in ["hello", "world"]:
        f = s.enter_context(tempfile.NamedTemporaryFile(mode="w", delete=False))
        f.write(content)
        tmps.append(f.name)

print(process_files(tmps))   # ['hello', 'world']
for t in tmps: os.unlink(t)`,
    explanation: "`ExitStack` dynamically manages an arbitrary number of context managers in one `with` block — each `enter_context` adds to the stack and all are exited in LIFO order when the block exits, even if some raise.",
  },
  {
    id: "py-0521-b3-string-center-ljust-rjust",
    language: "python",
    title: "str.center, ljust, rjust for text alignment",
    tag: "snippet",
    code: `title = "REPORT"
value = "42"

# Pad to width with optional fill character
print(title.center(20))         # '       REPORT       '
print(title.center(20, "="))    # '=======REPORT======='
print(value.rjust(10))          # '        42'
print(value.rjust(10, "0"))     # '0000000042'
print(title.ljust(15, "."))     # 'REPORT.........'

# Build a formatted table
headers = ["Name", "Score", "Grade"]
print("  ".join(h.center(10) for h in headers))
# '   Name    '  '  Score   '  '  Grade   '`,
    explanation: "`center`, `ljust`, and `rjust` are shortcuts for fixed-width alignment — the optional `fillchar` argument pads with a custom character; `zfill` is a special case that zero-pads and handles `+`/`-` signs.",
  },
  {
    id: "py-0521-b3-typing-cast",
    language: "python",
    title: "typing.cast for type narrowing assertions",
    tag: "types",
    code: `from typing import cast, Any

# cast(T, value) is a no-op at runtime — only informs type checker
def get_value(data: dict[str, Any], key: str) -> str:
    raw = data.get(key)
    if raw is None:
        raise KeyError(key)
    # Type checker infers raw: Any — cast tells it to trust us
    return cast(str, raw)

config = {"host": "localhost", "port": 8080}
host = get_value(config, "host")
# host: str  (type checker trusts the cast)

# Use sparingly — cast bypasses type safety; prefer isinstance narrowing
assert isinstance(host, str)   # runtime check, not just assertion`,
    explanation: "`cast(T, value)` is a type-checker directive that costs nothing at runtime — it overrides the inferred type; prefer `isinstance` narrowing when possible since `cast` provides no runtime validation.",
  },
  {
    id: "py-0521-b3-class-method-chaining",
    language: "python",
    title: "method chaining via return self",
    tag: "classes",
    code: `class Query:
    def __init__(self, table: str):
        self._table = table
        self._filters: list[str] = []
        self._limit: int | None = None
        self._offset: int = 0

    def filter(self, condition: str) -> "Query":
        self._filters.append(condition)
        return self

    def limit(self, n: int) -> "Query":
        self._limit = n
        return self

    def offset(self, n: int) -> "Query":
        self._offset = n
        return self

    def build(self) -> str:
        q = f"SELECT * FROM {self._table}"
        if self._filters:
            q += " WHERE " + " AND ".join(self._filters)
        if self._limit:
            q += f" LIMIT {self._limit}"
        if self._offset:
            q += f" OFFSET {self._offset}"
        return q

sql = Query("users").filter("age > 18").filter("active=1").limit(20).offset(40).build()
print(sql)`,
    explanation: "Returning `self` from each method enables fluent method chaining — note that `-> 'Query'` (quoted for forward reference) is needed; in Python 3.11+ `Self` type is cleaner and avoids the string annotation.",
  },
  {
    id: "py-0521-b3-set-vs-dict-keys",
    language: "python",
    title: "set vs dict.keys() for membership testing",
    tag: "understanding",
    code: `import timeit

large_list = list(range(100_000))
large_set  = set(large_list)
large_dict = {k: None for k in large_list}

target = 99_999

# List: O(n) linear scan
t_list = timeit.timeit(lambda: target in large_list, number=1000)

# Set: O(1) hash lookup
t_set = timeit.timeit(lambda: target in large_set, number=1000)

# dict.keys(): O(1) hash lookup (dict_keys IS a set view)
t_dict = timeit.timeit(lambda: target in large_dict, number=1000)

print(f"list: {t_list:.4f}s")
print(f"set:  {t_set:.6f}s")   # ~1000× faster
print(f"dict: {t_dict:.6f}s")  # similar to set`,
    explanation: "`in` on a `list` is O(n) linear scan; `in` on a `set` or `dict.keys()` is O(1) hash lookup — if you need many membership tests on a fixed collection, convert to a set once; `dict.keys()` already provides this.",
  },
  {
    id: "py-0521-b3-generator-close",
    language: "python",
    title: "generator .close() and GeneratorExit",
    tag: "understanding",
    code: `def resource_gen():
    try:
        print("opening resource")
        while True:
            yield "data"
    except GeneratorExit:
        print("closing resource")   # cleanup on close()
    finally:
        print("finally block")      # also runs

gen = resource_gen()
print(next(gen))    # opening resource / data
print(next(gen))    # data
gen.close()         # closing resource / finally block

# Generators used as context managers (contextlib.closing)
from contextlib import closing
with closing(resource_gen()) as g:
    print(next(g))  # opening resource / data
# generator closed automatically at end of with block`,
    explanation: "Calling `.close()` on a generator throws `GeneratorExit` at the current `yield` — the generator can catch it for cleanup but must not yield again; `contextlib.closing` wraps any closable object as a context manager.",
  },
  {
    id: "py-0521-b3-dict-pop-clear",
    language: "python",
    title: "dict.pop, popitem, setdefault",
    tag: "snippet",
    code: `d = {"a": 1, "b": 2, "c": 3}

# pop: remove and return value (or default)
val = d.pop("a")
print(val)   # 1
print(d)     # {'b': 2, 'c': 3}

missing = d.pop("x", -1)   # won't raise
print(missing)   # -1

# popitem: remove and return last inserted (LIFO, Python 3.7+)
k, v = d.popitem()
print(k, v)   # c 3

# setdefault: get if exists, else set and return default
d.setdefault("b", 99)    # 'b' exists, returns 2
d.setdefault("new", 0)   # 'new' absent, inserts 0 and returns 0
print(d)   # {'b': 2, 'new': 0}`,
    explanation: "`pop(key, default)` removes a key safely; `popitem()` is useful for processing a dict as a work queue (LIFO); `setdefault(key, default)` inserts only if absent — cleaner than `if key not in d: d[key] = default`.",
  },
  {
    id: "py-0521-b3-class-bool-none",
    language: "python",
    title: "None vs False vs empty: why they're not all the same",
    tag: "understanding",
    code: `# All falsy, but different semantics
print(None == False)   # False
print(None == 0)       # False
print(None == "")      # False
print(False == 0)      # True   (bool subclasses int)

# The 'is None' check is idiomatic for optional values
def func(value=None):
    if value is None:           # missing argument
        value = "default"
    if not value:               # empty, zero, or False
        return "falsy"
    return value

print(func())           # default
print(func(0))          # falsy (0 is not None, but is falsy)
print(func(False))      # falsy
print(func([]))         # falsy
print(func([1]))        # [1]`,
    explanation: "Use `is None` to check for explicitly missing values; use `if not x` for any falsy value (empty, zero, False); mixing them leads to bugs where `0` or `False` are accidentally treated as \"not provided\".",
  },
  {
    id: "py-0521-b3-itertools-islice",
    language: "python",
    title: "itertools.islice for lazy sequence slicing",
    tag: "snippet",
    code: `from itertools import islice, count

# islice: slice a lazy iterator without materializing it
def naturals():
    n = 1
    while True:
        yield n
        n += 1

# Take first 5 natural numbers
print(list(islice(naturals(), 5)))         # [1, 2, 3, 4, 5]

# Skip 10, then take 5
print(list(islice(naturals(), 10, 15)))    # [11, 12, 13, 14, 15]

# Every other element (step=2) from an infinite stream
print(list(islice(count(0), 0, 10, 2)))   # [0, 2, 4, 6, 8]

# Peek at first element without consuming the rest
gen = naturals()
first = next(islice(gen, 1))   # same as next(gen) here`,
    explanation: "`islice(iterable, stop)` or `islice(iterable, start, stop, step)` lazily slices any iterable — unlike list slicing, it doesn't materialize the sequence first, making it safe for infinite generators.",
  },
  {
    id: "py-0521-b3-multiprocessing-pool",
    language: "python",
    title: "multiprocessing.Pool for CPU-parallel work",
    tag: "snippet",
    code: `from multiprocessing import Pool
import os

def expensive(n: int) -> int:
    return sum(i * i for i in range(n))

if __name__ == "__main__":   # required on Windows/macOS
    inputs = [100_000, 200_000, 150_000, 300_000]

    with Pool(processes=4) as pool:
        # map: apply function to each input in parallel
        results = pool.map(expensive, inputs)
        print(results)   # four sums, computed in parallel

        # starmap: for functions taking multiple arguments
        pairs = [(100, 200), (300, 400)]
        sums  = pool.starmap(lambda a, b: a + b, pairs)`,
    explanation: "`multiprocessing.Pool` spawns worker processes (bypassing the GIL) and distributes work with `.map()`; always guard the entry point with `if __name__ == '__main__'` to prevent recursive process spawning on Windows/macOS.",
  },
  {
    id: "py-0521-b3-class-dataclass-factory",
    language: "python",
    title: "dataclass as a lightweight factory with default_factory",
    tag: "classes",
    code: `from dataclasses import dataclass, field
import uuid, datetime

@dataclass
class Event:
    name: str
    payload: dict = field(default_factory=dict)
    id: str       = field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: datetime.datetime = field(
        default_factory=datetime.datetime.utcnow
    )

    def add(self, key: str, value) -> None:
        self.payload[key] = value

e1 = Event("user.login")
e2 = Event("order.placed", payload={"item": "book"})

print(e1.id != e2.id)         # True — unique IDs
print(type(e1.timestamp))     # <class 'datetime.datetime'>`,
    explanation: "`default_factory` is called for each new instance — `lambda: str(uuid.uuid4())` and `datetime.datetime.utcnow` generate fresh values per instance, making dataclasses effective self-documenting factory objects.",
  },
  {
    id: "py-0521-b3-string-casefold",
    language: "python",
    title: "str.casefold for aggressive case-insensitive comparison",
    tag: "snippet",
    code: `# lower() handles ASCII; casefold() handles all Unicode
german = "Straße"   # ß is the German 'ss' ligature

print(german.lower())     # "straße"  (lower keeps ß)
print(german.casefold())  # "strasse" (casefold expands ß -> ss)

# Case-insensitive comparison across languages
a = "Straße"
b = "STRASSE"
print(a.lower()    == b.lower())    # False  (ß ≠ S)
print(a.casefold() == b.casefold()) # True   (strasse == strasse)

# casefold() is the recommended way for case-insensitive matching
words = ["Munich", "München", "MÜNCHEN"]
normalized = {w.casefold() for w in words}
print(len(normalized))   # 2 (münchen appears twice)`,
    explanation: "`casefold()` applies Unicode case folding (e.g., German ß→ss) rather than just ASCII lowercasing — always prefer it over `lower()` for case-insensitive string comparison in multilingual applications.",
  },
  {
    id: "py-0521-b3-match-negative-lookahead",
    language: "python",
    title: "regex lookahead and lookbehind assertions",
    tag: "snippet",
    code: `import re

# Positive lookahead (?=...)
prices = "apple $1.50 banana $0.75 cherry $2.00"
# Match price digits only if preceded by $
nums = re.findall(r"(?<=\\$)[\\d.]+", prices)
print(nums)   # ['1.50', '0.75', '2.00']

# Negative lookahead (?!...)
# Match 'foo' not followed by 'bar'
text = "foobar fooBAZ foobaz"
matches = re.findall(r"foo(?!bar)", text, re.IGNORECASE)
print(matches)   # ['foo', 'foo']  (fooBAZ and foobaz, not foobar)

# Lookahead and lookbehind don't consume characters
result = re.sub(r"(?<=\\d)(?=\\d{3}\\b)", ",", "1234567")
print(result)   # 1,234,567`,
    explanation: "Lookahead `(?=...)` and lookbehind `(?<=...)` are zero-width assertions — they check context without including it in the match; negative variants `(?!...)` / `(?<!...)` assert the opposite condition.",
  },
  {
    id: "py-0521-b3-perf-slots-cached",
    language: "python",
    title: "combining __slots__ with cached_property",
    tag: "caveats",
    code: `from functools import cached_property
import sys

class Point:
    __slots__ = ("x", "y", "__dict__")  # __dict__ needed for cached_property!

    def __init__(self, x: float, y: float):
        self.x = x
        self.y = y

    @cached_property
    def distance(self) -> float:        # cached in __dict__
        return (self.x ** 2 + self.y ** 2) ** 0.5

p = Point(3, 4)
print(p.distance)   # 5.0 (computed)
print(p.distance)   # 5.0 (cached)

# __dict__ slot adds some memory back but less than without __slots__
print(sys.getsizeof(p))   # smaller than pure __dict__ class`,
    explanation: "`cached_property` stores its cache in the instance `__dict__` — when using `__slots__`, you must explicitly include `'__dict__'` in the slots list or `cached_property` will raise `AttributeError` on first access.",
  },
  {
    id: "py-0521-b3-abstract-property-setter",
    language: "python",
    title: "abstract property with setter in subclass",
    tag: "classes",
    code: `from abc import ABC, abstractmethod

class Shape(ABC):
    @property
    @abstractmethod
    def color(self) -> str: ...

    @color.setter
    @abstractmethod
    def color(self, value: str) -> None: ...

class Circle(Shape):
    def __init__(self, color: str):
        self._color = color

    @property
    def color(self) -> str:
        return self._color

    @color.setter
    def color(self, value: str) -> None:
        self._color = value

c = Circle("red")
print(c.color)    # red
c.color = "blue"
print(c.color)    # blue`,
    explanation: "To make an abstract property with a setter, both `@property @abstractmethod` AND `@name.setter @abstractmethod` must appear in the abstract class — the subclass must implement both the getter and the setter.",
  },
  {
    id: "py-0521-b3-iter-tools-starmap",
    language: "python",
    title: "itertools.starmap for unpacking argument tuples",
    tag: "snippet",
    code: `from itertools import starmap
import operator

# starmap(f, iterable_of_tuples): unpacks each tuple as args to f
pairs = [(2, 3), (4, 5), (6, 7)]
products = list(starmap(operator.mul, pairs))
print(products)   # [6, 20, 42]

# Equivalent to: [f(*args) for args in iterable]
# But starmap is lazy

# Practical: apply a function to matched pairs
def distance(x1, y1, x2, y2):
    return ((x2-x1)**2 + (y2-y1)**2)**0.5

coords = [(0,0,3,4), (1,1,4,5)]
dists = list(starmap(distance, coords))
print(dists)   # [5.0, 5.0]`,
    explanation: "`starmap(f, iterable)` is like `map(f, iterable)` but unpacks each element as positional arguments — use it when your data is already structured as tuples matching the function's parameter list.",
  },
  {
    id: "py-0521-b3-walrus-list-comprehension-side-effect",
    language: "python",
    title: "walrus operator scope: leaking from comprehensions",
    tag: "caveats",
    code: `# Regular comprehension variables stay local (Python 3)
result = [x for x in range(5)]
# print(x)  # NameError!

# BUT: walrus := leaks out of the comprehension
result2 = [last := x for x in range(5)]
print(last)   # 4  — the final value leaked into enclosing scope

# This is intentional behavior — useful for capturing the last value
found = None
matches = [found := x for x in range(10) if x % 7 == 0]
print(found)  # 7  (last value that matched)
print(matches) # [0, 7]

# Gotcha: in nested comprehensions, := leaks to the function/module level
def func():
    vals = [y := i for i in range(3)]
    print(y)   # 2 — y is a local variable in func, not in the comprehension`,
    explanation: "The walrus operator `:=` deliberately leaks its binding out of comprehension scope to the enclosing function or module — this makes it useful for capturing intermediate values but surprising if you expect comprehension variable isolation.",
  },
  {
    id: "py-0521-b3-class-prepare",
    language: "python",
    title: "__prepare__ metaclass method for ordered namespaces",
    tag: "classes",
    code: `class OrderedMeta(type):
    @classmethod
    def __prepare__(mcs, name, bases, **kwargs):
        # Return a custom dict to use as the class namespace
        from collections import OrderedDict
        return OrderedDict()

    def __new__(mcs, name, bases, namespace, **kwargs):
        cls = super().__new__(mcs, name, bases, dict(namespace))
        # Capture definition order before Python 3.7 guaranteed it
        cls._fields_order = [k for k in namespace if not k.startswith("_")]
        return cls

class Config(metaclass=OrderedMeta):
    host = "localhost"
    port = 8080
    debug = False

print(Config._fields_order)   # ['host', 'port', 'debug']`,
    explanation: "`__prepare__` is called before the class body executes and returns the namespace object used during class definition — returning a custom mapping lets you capture definition order, validate attribute names, or intercept assignments.",
  },
  {
    id: "py-0521-b3-bytes-memoryview-efficient",
    language: "python",
    title: "memoryview.tobytes() and cast() for reinterpretation",
    tag: "types",
    code: `import array

# Create a typed array of ints
ints = array.array("i", [1, 2, 3, 4])   # signed int32

# memoryview exposes the buffer
mv = memoryview(ints)
print(mv.itemsize)   # 4  (bytes per int)
print(mv.ndim)       # 1
print(mv[0])         # 1

# cast reinterprets as bytes — zero copy
as_bytes = mv.cast("B")
print(list(as_bytes))   # [1,0,0,0, 2,0,0,0, ...] (little-endian)

# cast to short ints
as_shorts = mv.cast("h")
print(list(as_shorts))  # [1, 0, 2, 0, 3, 0, 4, 0]`,
    explanation: "`memoryview.cast(typecode)` reinterprets the same memory as a different element type — this is how numpy-style reinterpret_cast works in pure Python, enabling zero-copy type punning on buffer-protocol objects.",
  },
  {
    id: "py-0521-b3-typing-guards-complex",
    language: "python",
    title: "TypeGuard for narrowing complex union types",
    tag: "types",
    code: `from typing import TypeGuard, Union

def is_list_of_int(val: list) -> TypeGuard[list[int]]:
    return all(isinstance(x, int) for x in val)

def is_list_of_str(val: list) -> TypeGuard[list[str]]:
    return all(isinstance(x, str) for x in val)

def process(data: list[int] | list[str]) -> None:
    if is_list_of_int(data):
        print(sum(data))        # type checker: data is list[int]
    elif is_list_of_str(data):
        print(", ".join(data))  # type checker: data is list[str]

process([1, 2, 3])         # 6
process(["a", "b", "c"])   # a, b, c`,
    explanation: "`TypeGuard[T]` enables user-defined narrowing — the type checker narrows the argument's type inside the `if` block when the function returns `True`; it only narrows the FIRST argument, not subsequent ones.",
  },
  {
    id: "py-0521-b3-class-dunder-format",
    language: "python",
    title: "__format__ for custom format spec support",
    tag: "classes",
    code: `class Money:
    def __init__(self, amount: float, currency: str = "USD"):
        self.amount = amount
        self.currency = currency

    def __format__(self, spec: str) -> str:
        if spec == "short":
            return f"{self.amount:.0f}{self.currency[0]}"
        elif spec == "full":
            return f"{self.amount:,.2f} {self.currency}"
        else:
            return f"{self.amount:{spec}}"   # delegate numeric spec

m = Money(1234.567, "USD")
print(f"{m:short}")      # 1235$
print(f"{m:full}")       # 1,234.57 USD
print(f"{m:.1f}")        # 1234.6   (delegates to float format)`,
    explanation: "`__format__(spec)` is called by `format(obj, spec)` and f-string format expressions — `spec` is the part after `:` in `{value:spec}`; implement it to add domain-specific formatting like `short`, `full`, or `compact`.",
  },
  {
    id: "py-0521-b3-class-descriptor-lazy",
    language: "python",
    title: "lazy descriptor for computed attributes",
    tag: "classes",
    code: `import math

class lazy_property:
    """Computes once on first access, then caches in instance __dict__."""
    def __init__(self, func):
        self.func = func
        self.name = func.__name__

    def __get__(self, obj, objtype=None):
        if obj is None:
            return self
        value = self.func(obj)
        obj.__dict__[self.name] = value   # shadows the descriptor
        return value

class Circle:
    def __init__(self, r):
        self.r = r

    @lazy_property
    def area(self):
        print("computing area...")
        return math.pi * self.r ** 2

c = Circle(5)
print(c.area)   # computing area... / 78.54
print(c.area)   # 78.54  (no recomputation — cached in __dict__)`,
    explanation: "Storing the computed value in the instance `__dict__` under the descriptor's name shadows the descriptor itself — subsequent attribute access hits the instance dict directly, bypassing the descriptor protocol.",
  },
  {
    id: "py-0521-b3-re-sub-callback",
    language: "python",
    title: "re.sub with a callable replacement",
    tag: "snippet",
    code: `import re

text = "The price is $42 and also $1.5 and $100"

# Replace each dollar amount with formatted version
def format_price(m: re.Match) -> str:
    amount = float(m.group(1))
    if amount >= 100:
        return f"\${amount:,.0f}"
    return f"\${amount:.2f}"

result = re.sub(r"\\$([\\d.]+)", format_price, text)
print(result)
# The price is $42.00 and also $1.50 and $100

# Callable receives the match object — can access groups
def swap(m: re.Match) -> str:
    return m.group(2) + "-" + m.group(1)

print(re.sub(r"(\\w+)/(\\w+)", swap, "A/B C/D"))
# B-A D-C`,
    explanation: "`re.sub(pattern, callable, text)` calls the function with each match object and uses its return value as the replacement — this enables transformation logic (not just static strings) including accessing capture groups.",
  },
  {
    id: "py-0521-b3-typing-protocol-callables",
    language: "python",
    title: "Protocol for typed callable interfaces",
    tag: "types",
    code: `from typing import Protocol

class Transformer(Protocol):
    def __call__(self, value: str) -> str: ...

# Any callable with matching signature satisfies Transformer
def apply(text: str, transform: Transformer) -> str:
    return transform(text)

# All of these satisfy Transformer:
print(apply("hello", str.upper))           # HELLO
print(apply("  hi  ", str.strip))          # hi
print(apply("world", lambda s: s[::-1]))   # dlrow

class Prefixer:
    def __init__(self, prefix: str):
        self._prefix = prefix
    def __call__(self, value: str) -> str:
        return self._prefix + value

print(apply("name", Prefixer("Mr. ")))     # Mr. name`,
    explanation: "A `Protocol` with `__call__` types a callable by its signature — any function, lambda, or class with `__call__` matching the signature satisfies it, enabling dependency injection and higher-order functions in typed code.",
  },
  {
    id: "py-0521-b3-class-borg-pattern",
    language: "python",
    title: "Borg pattern: shared state without singleton identity",
    tag: "classes",
    code: `class Borg:
    """All instances share the same state dict, but are distinct objects."""
    _shared: dict = {}

    def __init__(self):
        self.__dict__ = Borg._shared   # same dict for all instances

class Config(Borg):
    def set(self, key: str, value) -> None:
        self._shared[key] = value      # sets on shared state

a = Config()
b = Config()

a.set("debug", True)
print(b._shared.get("debug"))   # True — shared
print(a is b)                    # False — different objects
print(a.__dict__ is b.__dict__)  # True  — same dict`,
    explanation: "The Borg pattern shares state (by pointing all instances' `__dict__` to the same object) while allowing distinct instances — different from a singleton where `a is b`; useful when identity comparison doesn't matter but state sharing does.",
  },
  {
    id: "py-0521-b3-format-string-safety",
    language: "python",
    title: "str.format_map for safe dict-based substitution",
    tag: "snippet",
    code: `template = "Hello, {name}! You have {count} messages."

data = {"name": "Alice", "count": 5}
print(template.format_map(data))
# Hello, Alice! You have 5 messages.

# SafeDict: leaves missing keys unreplaced
class SafeDict(dict):
    def __missing__(self, key):
        return "{" + key + "}"   # return the original placeholder

partial = "Hello, {name}! Balance: {balance}"
result = partial.format_map(SafeDict(name="Bob"))
print(result)   # Hello, Bob! Balance: {balance}`,
    explanation: "`str.format_map(mapping)` is like `str.format(**mapping)` but passes the mapping directly — no dict unpacking — which enables subclasses of dict like `SafeDict` with `__missing__` to handle undefined keys gracefully.",
  },
  {
    id: "py-0521-b3-contextmanager-exception-handling",
    language: "python",
    title: "context manager exception suppression",
    tag: "classes",
    code: `class IgnoreError:
    def __init__(self, *exception_types):
        self.exception_types = exception_types

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, tb):
        if exc_type and issubclass(exc_type, self.exception_types):
            print(f"suppressed {exc_type.__name__}: {exc_val}")
            return True   # suppress the exception
        return False       # re-raise

with IgnoreError(ValueError, TypeError):
    raise ValueError("oops")     # suppressed

with IgnoreError(KeyError):
    raise ValueError("not suppressed")  # re-raises`,
    explanation: "`__exit__` returning `True` suppresses the exception — the `with` block completes as if no exception occurred; returning `False` or `None` propagates it; always check `exc_type` first (it's `None` when no exception occurred).",
  },
  {
    id: "py-0521-b3-sentinel-pattern",
    language: "python",
    title: "sentinel objects for distinguishing None from unset",
    tag: "snippet",
    code: `# Create a unique sentinel that is not None or any user value
_MISSING = object()

def get_setting(settings: dict, key: str, default=_MISSING):
    result = settings.get(key, _MISSING)
    if result is _MISSING:
        if default is _MISSING:
            raise KeyError(f"Setting {key!r} not found")
        return default
    return result

cfg = {"debug": False, "timeout": None}

print(get_setting(cfg, "debug"))       # False (not missing!)
print(get_setting(cfg, "timeout"))     # None  (explicitly set to None)
print(get_setting(cfg, "host", "localhost"))  # localhost (default)
# get_setting(cfg, "missing")          # KeyError`,
    explanation: "A sentinel object (a unique `object()` instance) distinguishes \"no argument provided\" from `None` — this is how Python's own `dict.get` works internally, enabling APIs where `None` is a valid user value.",
  },
  {
    id: "py-0521-b3-async-to-thread",
    language: "python",
    title: "asyncio.to_thread for blocking code in async context",
    tag: "snippet",
    code: `import asyncio
import time

def blocking_io() -> str:
    time.sleep(0.1)   # simulates blocking DB/file call
    return "data"

def cpu_work(n: int) -> int:
    return sum(i * i for i in range(n))

async def main():
    # Run blocking code without freezing the event loop
    result1 = await asyncio.to_thread(blocking_io)
    result2 = await asyncio.to_thread(cpu_work, 100_000)

    # Or concurrently
    r1, r2 = await asyncio.gather(
        asyncio.to_thread(blocking_io),
        asyncio.to_thread(blocking_io),
    )
    print(result1, result2, r1, r2)

asyncio.run(main())`,
    explanation: "`asyncio.to_thread(func, *args)` (Python 3.9+) runs a synchronous function in the thread pool executor without blocking the event loop — it's the recommended way to integrate legacy blocking code into async programs.",
  },
  {
    id: "py-0521-b3-dataclass-inherit",
    language: "python",
    title: "dataclass inheritance and field ordering",
    tag: "classes",
    code: `from dataclasses import dataclass

@dataclass
class Animal:
    name: str
    sound: str = "..."

@dataclass
class Dog(Animal):
    breed: str = "unknown"
    # Fields with defaults must come after fields without defaults
    # This works because Animal's 'sound' has a default before Dog's 'breed'

d = Dog(name="Rex", breed="Labrador")
print(d)   # Dog(name='Rex', sound='...', breed='Labrador')

# DANGER: parent field without default after child field with default
@dataclass
class Base:
    x: int = 0

# @dataclass
# class Bad(Base):
#     y: int   # TypeError: non-default arg after default!`,
    explanation: "Dataclass inheritance concatenates parent fields before child fields — a child field without a default after a parent field WITH a default is a `TypeError`; keep required fields in the most-derived class or make all fields optional.",
  },
  {
    id: "py-0521-b3-typing-optional-meaning",
    language: "python",
    title: "Optional[T] is exactly T | None",
    tag: "types",
    code: `from typing import Optional, get_args, get_origin
import types

# Optional[T] is just syntactic sugar for Union[T, None]
def find(items: list[int], target: int) -> Optional[int]:
    try:
        return items.index(target)
    except ValueError:
        return None

# At runtime, Optional[int] is Union[int, None]
print(get_origin(Optional[int]))   # typing.Union
print(get_args(Optional[int]))     # (<class 'int'>, <class 'NoneType'>)

# Preferred modern syntax (Python 3.10+)
def find2(items: list[int], target: int) -> int | None:
    ...

# Both are identical to type checkers`,
    explanation: "`Optional[T]` is exactly `Union[T, None]` — use `int | None` in Python 3.10+ code for clarity; `Optional` doesn't mean \"this parameter is optional to pass\" (that's a default value), it means the value can be `None`.",
  },
  {
    id: "py-0521-b3-sys-exit-vs-raise",
    language: "python",
    title: "sys.exit() vs raise SystemExit vs os._exit()",
    tag: "understanding",
    code: `import sys, os

# sys.exit(code) raises SystemExit — can be caught!
try:
    sys.exit(1)
except SystemExit as e:
    print(f"caught SystemExit({e.code})")   # caught SystemExit(1)
# Execution continues

# Use in tests to verify exit behavior:
# pytest: with pytest.raises(SystemExit) as exc_info: sys.exit(1)

# os._exit(code): immediately terminates — no cleanup, no finally blocks
# os._exit(0)   # DO NOT call in normal code — use sys.exit()

# raise SystemExit(code) is equivalent to sys.exit(code)
# Both run finally blocks and atexit handlers`,
    explanation: "`sys.exit()` raises `SystemExit`, which propagates through the call stack — `finally` blocks run and `atexit` handlers fire; `os._exit()` bypasses all of that and immediately calls `_exit(2)` in C — only use it in child processes after `fork`.",
  },
  {
    id: "py-0521-b3-class-slots-property",
    language: "python",
    title: "property and __slots__ together",
    tag: "classes",
    code: `class Circle:
    __slots__ = ("_radius",)   # store private attribute only

    def __init__(self, radius: float):
        self.radius = radius   # goes through setter

    @property
    def radius(self) -> float:
        return self._radius

    @radius.setter
    def radius(self, value: float) -> None:
        if value <= 0:
            raise ValueError("radius must be positive")
        self._radius = value

    @property
    def area(self) -> float:
        import math
        return math.pi * self._radius ** 2

c = Circle(5)
print(c.area)   # 78.54...
c.radius = 10
print(c.area)   # 314.15...`,
    explanation: "`property` and `__slots__` work together cleanly — declare the private backing slot (e.g., `_radius`) in `__slots__`, and the property itself lives on the class, not in any instance slot.",
  },
  {
    id: "py-0521-b3-typing-overload-dispatch",
    language: "python",
    title: "@overload with multiple return types based on flag",
    tag: "types",
    code: `from typing import overload, Literal

@overload
def parse(data: str, as_json: Literal[True]) -> dict: ...
@overload
def parse(data: str, as_json: Literal[False]) -> str: ...
@overload
def parse(data: str) -> str: ...

def parse(data: str, as_json: bool = False) -> dict | str:
    if as_json:
        import json
        return json.loads(data)
    return data

# Type checker knows:
obj: dict = parse('{"a":1}', as_json=True)   # dict
raw: str  = parse("hello",   as_json=False)  # str
def_: str = parse("world")                    # str (default)`,
    explanation: "Using `Literal[True]`/`Literal[False]` in `@overload` signatures lets the type checker differentiate the return type based on a boolean flag value — more precise than `dict | str` and enables safe attribute access without casting.",
  },
  {
    id: "py-0521-b3-class-method-super-init",
    language: "python",
    title: "super().__init__ with keyword arguments in MRO",
    tag: "classes",
    code: `class Base:
    def __init__(self, **kwargs):
        # Consume kwargs here or pass them up
        print(f"Base.__init__ remaining kwargs: {kwargs}")
        super().__init__(**kwargs)

class Named(Base):
    def __init__(self, name: str, **kwargs):
        self.name = name
        super().__init__(**kwargs)   # pass remaining to Base

class Tagged(Base):
    def __init__(self, tag: str, **kwargs):
        self.tag = tag
        super().__init__(**kwargs)

class Component(Named, Tagged):
    pass

c = Component(name="widget", tag="ui")
print(c.name, c.tag)   # widget ui
# MRO: Component -> Named -> Tagged -> Base -> object`,
    explanation: "Using `**kwargs` and passing them to `super().__init__(**kwargs)` enables cooperative `__init__` in multiple inheritance — each class pops its own arguments and passes the rest up the MRO chain.",
  },
  {
    id: "py-0521-b3-bytes-xor-mask",
    language: "python",
    title: "bytes and bytearray XOR masking",
    tag: "snippet",
    code: `# XOR two byte strings element-wise
def xor_bytes(a: bytes, b: bytes) -> bytes:
    return bytes(x ^ y for x, y in zip(a, b))

key = b"\\xAB\\xCD\\xEF\\x01"
data = b"Hello!!!"[:4]   # take first 4 bytes

masked = xor_bytes(data, key)
print(masked.hex())   # some hex

unmasked = xor_bytes(masked, key)
print(unmasked)       # b'Hell'  (XOR is its own inverse)

# Faster with bytearray
def xor_inplace(data: bytearray, key: bytes) -> bytearray:
    for i in range(len(data)):
        data[i] ^= key[i % len(key)]
    return data`,
    explanation: "XOR masking is symmetric — `(data ^ key) ^ key == data` — making it the basis for simple stream ciphers and bit-flipping attacks; `bytearray` allows in-place mutation, avoiding an extra allocation for large buffers.",
  },
  {
    id: "py-0521-b3-thread-event",
    language: "python",
    title: "threading.Event for inter-thread signaling",
    tag: "snippet",
    code: `import threading, time

ready = threading.Event()

def worker():
    print("worker: waiting for signal")
    ready.wait()               # blocks until event is set
    print("worker: got signal, running")

t = threading.Thread(target=worker)
t.start()

time.sleep(0.1)
print("main: setting event")
ready.set()                    # unblocks all waiting threads
t.join()

# One-shot use: once set, wait() returns immediately
ready.wait()   # returns immediately (event is already set)
ready.clear()  # reset for reuse`,
    explanation: "`threading.Event` is a boolean flag with blocking `wait()` — `set()` wakes all waiting threads; `clear()` resets it; `wait(timeout)` has an optional timeout that returns `False` if the event wasn't set in time.",
  },
  {
    id: "py-0521-b3-class-comparison-ops",
    language: "python",
    title: "NotImplemented: the right way to decline comparison",
    tag: "classes",
    code: `class Measurement:
    def __init__(self, value: float, unit: str):
        self.value = value
        self.unit = unit

    def __eq__(self, other):
        if not isinstance(other, Measurement):
            return NotImplemented   # not False! lets Python try other.__eq__
        if self.unit != other.unit:
            raise ValueError(f"Cannot compare {self.unit} and {other.unit}")
        return self.value == other.value

    def __lt__(self, other):
        if not isinstance(other, Measurement):
            return NotImplemented
        if self.unit != other.unit:
            raise ValueError(f"Cannot compare {self.unit} and {other.unit}")
        return self.value < other.value

m1 = Measurement(5.0, "kg")
m2 = Measurement(3.0, "kg")
print(m1 > m2)   # True (Python inverts __lt__)`,
    explanation: "Return `NotImplemented` (not `False`) from comparison methods when the types are incompatible — Python then tries the right operand's reflected operation (e.g., `__gt__` when `__lt__` returns `NotImplemented`).",
  },
  {
    id: "py-0521-b3-typing-dataclass-transform",
    language: "python",
    title: "@dataclass_transform for custom class frameworks",
    tag: "types",
    code: `from typing import dataclass_transform

# This decorator tells type checkers that your framework
# produces dataclass-like behavior for decorated classes
@dataclass_transform()
def my_model(cls):
    # In a real ORM/framework, this would generate __init__, etc.
    import dataclasses
    return dataclasses.dataclass(cls)

@my_model
class User:
    id: int
    name: str
    email: str = ""

# Type checker now understands User(id=1, name="Alice")
# generates __init__(id: int, name: str, email: str = "") -> None
u = User(id=1, name="Alice")
print(u.name)   # Alice`,
    explanation: "`@dataclass_transform()` (PEP 681) signals to type checkers that a decorator or base class creates dataclass-like semantics — SQLAlchemy, Pydantic, and attrs use it so IDEs and type checkers understand their generated `__init__` signatures.",
  },
  {
    id: "py-0521-b3-tqdm-progress",
    language: "python",
    title: "tqdm for progress bars in loops",
    tag: "snippet",
    code: `# pip install tqdm
from tqdm import tqdm
import time

# Wrap any iterable with tqdm
for i in tqdm(range(100), desc="Processing", unit="items"):
    time.sleep(0.01)   # simulate work

# For unknown lengths: use tqdm() without total and update manually
with tqdm(total=None, desc="Downloading") as pbar:
    for chunk_size in [1024, 512, 2048]:
        time.sleep(0.05)
        pbar.update(chunk_size)
        pbar.set_postfix(speed=f"{chunk_size/0.05:.0f} B/s")

# Nested progress bars
for batch in tqdm(range(3), desc="Batches"):
    for item in tqdm(range(5), desc="Items", leave=False):
        time.sleep(0.01)`,
    explanation: "`tqdm(iterable)` wraps any iterable with a live progress bar showing ETA and rate — `desc` sets the label, `unit` customizes the count noun; `set_postfix` adds live statistics like speed or loss values.",
  },
  {
    id: "py-0521-b3-abstract-class-comparison",
    language: "python",
    title: "collections.abc for abstract base classes",
    tag: "structures",
    code: `from collections.abc import (
    Iterable, Iterator, Sequence,
    Mapping, MutableMapping, Set
)

# Check duck-type conformance
print(isinstance([1,2,3], Sequence))         # True
print(isinstance([1,2,3], MutableMapping))   # False
print(isinstance({1,2,3}, Set))              # True
print(isinstance({}, MutableMapping))        # True

# Subclass check
print(issubclass(list, Sequence))   # True
print(issubclass(dict, Mapping))    # True

# Custom class registration
class MyBag:
    def __contains__(self, item): return True
    def __iter__(self): return iter([])
    def __len__(self): return 0

Set.register(MyBag)
print(isinstance(MyBag(), Set))   # True`,
    explanation: "`collections.abc` provides abstract base classes for container types — use them for `isinstance` checks instead of concrete types; any class implementing the required methods qualifies, or you can explicitly `register` a class.",
  },
  {
    id: "py-0521-b3-typing-callable-signature",
    language: "python",
    title: "Callable type with precise signature",
    tag: "types",
    code: `from typing import Callable

# Callable[[ArgTypes...], ReturnType]
def apply_twice(func: Callable[[int], int], value: int) -> int:
    return func(func(value))

print(apply_twice(lambda x: x * 2, 3))   # 12

# Callable with no args
def run(fn: Callable[[], None]) -> None:
    fn()

# Callable with keyword args: use ParamSpec for full signature
from typing import ParamSpec, TypeVar
P = ParamSpec("P")
R = TypeVar("R")

def decorator(fn: Callable[P, R]) -> Callable[P, R]:
    def wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
        return fn(*args, **kwargs)
    return wrapper`,
    explanation: "`Callable[[A, B], R]` specifies a callable that accepts specific positional argument types — use `ParamSpec` when you need to preserve the full parameter signature (names and defaults) through a decorator.",
  },
  {
    id: "py-0521-b3-match-exhaustiveness",
    language: "python",
    title: "exhaustive match with Never for safety",
    tag: "types",
    code: `from typing import NoReturn
from enum import Enum

class Status(Enum):
    PENDING  = "pending"
    ACTIVE   = "active"
    INACTIVE = "inactive"

def assert_never(x: NoReturn) -> NoReturn:
    raise AssertionError(f"Unhandled case: {x!r}")

def describe(s: Status) -> str:
    match s:
        case Status.PENDING:  return "pending"
        case Status.ACTIVE:   return "active"
        case Status.INACTIVE: return "inactive"
        case _ as unreachable:
            assert_never(unreachable)
            # Type checker flags this if Status gains a new member
            # and the match isn't updated

print(describe(Status.ACTIVE))   # active`,
    explanation: "Calling `assert_never` in the `case _` arm proves exhaustiveness — the type checker flags `assert_never(unreachable)` as a type error if the `match` is non-exhaustive (i.e., `unreachable` could have a non-`Never` type).",
  },
  {
    id: "py-0521-b3-class-abstract-property-final",
    language: "python",
    title: "combining @final and @property for locked computed attributes",
    tag: "classes",
    code: `from abc import ABC, abstractmethod
from typing import final

class Shape(ABC):
    @property
    @abstractmethod
    def _area_impl(self) -> float: ...

    @property
    @final
    def area(self) -> float:
        """Sealed — subclasses cannot override area, only _area_impl."""
        raw = self._area_impl
        return max(0.0, raw)   # always non-negative

class Triangle(Shape):
    def __init__(self, base, height):
        self._base = base
        self._height = height

    @property
    def _area_impl(self) -> float:
        return 0.5 * self._base * self._height

t = Triangle(6, 4)
print(t.area)   # 12.0`,
    explanation: "Combining `@final` on the public property and `@abstractmethod` on the private implementation enforces the Template Method pattern in properties — the base class controls the algorithm, subclasses fill in the details.",
  },
  {
    id: "py-0521-b3-comprehension-memory",
    language: "python",
    title: "generator vs list comprehension: memory trade-off",
    tag: "understanding",
    code: `import sys

# List comprehension: all values in memory at once
big_list = [x * x for x in range(1_000_000)]
print(sys.getsizeof(big_list))   # ~8.5 MB

# Generator expression: one value at a time
big_gen = (x * x for x in range(1_000_000))
print(sys.getsizeof(big_gen))    # ~112 bytes (just the generator object)

# Both produce the same sum, but generator uses ~80,000× less memory
# print(sum(big_list))   # 333332833333500000
# print(sum(big_gen))    # same

# Use list when: you need indexing, multiple passes, or len()
# Use generator when: single-pass consumption, large/infinite data`,
    explanation: "A generator expression creates a lazy iterator object of fixed size — it computes values one at a time during iteration; a list comprehension eagerly builds the full list in memory; for `sum`, `max`, and other single-pass operations, generators are always more memory-efficient.",
  },
];
