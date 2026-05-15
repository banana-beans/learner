import type { Snippet } from "./types";

export const pythonSnippets20260515B4: Snippet[] = [
  {
    id: "py-b15-b4-walrus-all-truthy",
    language: "python",
    title: "Walrus operator in all() short-circuit",
    tag: "snippet",
    code: `data = [{"name": "Alice", "age": 30}, {"name": "", "age": 25}]

first_empty = next(
    (item for item in data if not (name := item.get("name"))),
    None,
)
print(first_empty)  # {'name': '', 'age': 25}`,
    explanation: "The walrus both tests the name and binds it for potential use after the loop — the generator expression short-circuits at the first falsy name."
  },
  {
    id: "py-b15-b4-match-int-enum",
    language: "python",
    title: "match/case with IntEnum values",
    tag: "snippet",
    code: `from enum import IntEnum

class Status(IntEnum):
    PENDING = 1
    ACTIVE = 2
    CLOSED = 3

def describe(s: Status) -> str:
    match s:
        case Status.PENDING:
            return "waiting"
        case Status.ACTIVE:
            return "running"
        case Status.CLOSED:
            return "finished"`,
    explanation: "match/case works with enum members by value comparison. Using the qualified name `Status.PENDING` in a case prevents unintended capture patterns."
  },
  {
    id: "py-b15-b4-dataclass-compare",
    language: "python",
    title: "dataclass with order=True for sorting",
    tag: "snippet",
    code: `from dataclasses import dataclass

@dataclass(order=True)
class Version:
    major: int
    minor: int
    patch: int

versions = [Version(1, 2, 0), Version(1, 0, 5), Version(2, 0, 0)]
print(sorted(versions))
# [Version(major=1, minor=0, patch=5), ...]`,
    explanation: "`order=True` generates comparison methods based on field declaration order. Fields earlier in the class take precedence, matching semantic version ordering."
  },
  {
    id: "py-b15-b4-protocol-context-manager",
    language: "python",
    title: "Protocol for context manager duck typing",
    tag: "types",
    code: `from typing import Protocol, TypeVar, Generator
from contextlib import contextmanager

T = TypeVar("T")

class ContextManager(Protocol[T]):
    def __enter__(self) -> T: ...
    def __exit__(self, *args) -> bool | None: ...

def use(cm: ContextManager[str]) -> str:
    with cm as val:
        return val.upper()`,
    explanation: "A Protocol for `__enter__`/`__exit__` types context managers structurally — any object with both methods satisfies it without inheriting from `AbstractContextManager`."
  },
  {
    id: "py-b15-b4-typeddict-notreq",
    language: "python",
    title: "TypedDict with NotRequired fields",
    tag: "types",
    code: `from typing import TypedDict, NotRequired

class UserUpdate(TypedDict):
    id: int
    name: NotRequired[str]
    email: NotRequired[str]
    avatar_url: NotRequired[str | None]

update: UserUpdate = {"id": 1, "name": "Bob"}`,
    explanation: "`NotRequired` (Python 3.11+) marks individual keys as optional without setting `total=False` for the whole dict — mixing required and optional at the key level."
  },
  {
    id: "py-b15-b4-itertools-groupby",
    language: "python",
    title: "itertools.groupby for consecutive groups",
    tag: "snippet",
    code: `from itertools import groupby

data = [1, 1, 2, 3, 3, 3, 1, 1]
for key, group in groupby(data):
    print(key, list(group))
# 1 [1, 1]
# 2 [2]
# 3 [3, 3, 3]
# 1 [1, 1]`,
    explanation: "`groupby` groups **consecutive** equal elements. To group all occurrences together, sort the data first — otherwise non-adjacent equal values form separate groups."
  },
  {
    id: "py-b15-b4-contextmanager-timing",
    language: "python",
    title: "Context manager for code timing",
    tag: "snippet",
    code: `from contextlib import contextmanager
import time

@contextmanager
def timer(label: str = ""):
    start = time.perf_counter()
    try:
        yield
    finally:
        elapsed = time.perf_counter() - start
        print(f"{label}: {elapsed:.4f}s")

with timer("processing"):
    sum(range(10_000_000))`,
    explanation: "`perf_counter` is the highest-resolution timer for short intervals. Printing in the `finally` block ensures the elapsed time is always logged even on exception."
  },
  {
    id: "py-b15-b4-async-gen-cleanup",
    language: "python",
    title: "Async generator with cleanup on close",
    tag: "snippet",
    code: `import asyncio

async def managed_stream():
    print("Stream opened")
    try:
        for i in range(100):
            await asyncio.sleep(0.01)
            yield i
    finally:
        print("Stream closed")

async def main():
    stream = managed_stream()
    async for item in stream:
        if item >= 3:
            await stream.aclose()
            break`,
    explanation: "`aclose()` sends a `GeneratorExit` into the async generator, triggering the `finally` block. This ensures cleanup even when the consumer stops early."
  },
  {
    id: "py-b15-b4-descriptor-validate-int",
    language: "python",
    title: "Descriptor validating integer ranges",
    tag: "structures",
    code: `class BoundedInt:
    def __init__(self, lo: int, hi: int):
        self.lo, self.hi = lo, hi

    def __set_name__(self, owner, name):
        self.name = name

    def __get__(self, obj, objtype=None):
        if obj is None: return self
        return obj.__dict__.get(self.name)

    def __set__(self, obj, value: int):
        if not (self.lo <= value <= self.hi):
            raise ValueError(f"{self.name} must be in [{self.lo}, {self.hi}]")
        obj.__dict__[self.name] = value`,
    explanation: "Parameterized descriptors carry their constraints as instance attributes. Multiple fields can share the same descriptor class with different bounds."
  },
  {
    id: "py-b15-b4-metaclass-abstract-check",
    language: "python",
    title: "Metaclass checking interface completeness",
    tag: "classes",
    code: `class StrictInterface(type):
    def __new__(mcs, name, bases, ns):
        for base in bases:
            for req in getattr(base, "__requires__", []):
                if req not in ns or not callable(ns[req]):
                    raise TypeError(f"{name} must implement {req}()")
        return super().__new__(mcs, name, bases, ns)

class IHandler(metaclass=StrictInterface):
    __requires__ = ["handle", "validate"]

class MyHandler(IHandler):
    def handle(self): pass
    def validate(self): pass`,
    explanation: "Using `__requires__` as a class-level interface list avoids the ABC machinery while still enforcing implementation at class-creation time."
  },
  {
    id: "py-b15-b4-abc-template-method",
    language: "python",
    title: "Template method with ABC",
    tag: "classes",
    code: `from abc import ABC, abstractmethod

class DataPipeline(ABC):
    def run(self, data: list) -> list:
        filtered = self.filter(data)
        transformed = self.transform(filtered)
        return self.aggregate(transformed)

    @abstractmethod
    def filter(self, data: list) -> list: ...
    @abstractmethod
    def transform(self, data: list) -> list: ...
    @abstractmethod
    def aggregate(self, data: list) -> list: ...`,
    explanation: "The template method `run` defines the pipeline's structure in the base class. Subclasses plug in each step by overriding only the abstract methods."
  },
  {
    id: "py-b15-b4-typing-runtime-checkable-deep",
    language: "python",
    title: "Protocol with multiple methods",
    tag: "types",
    code: `from typing import Protocol, runtime_checkable

@runtime_checkable
class Readable(Protocol):
    def read(self, size: int = -1) -> bytes: ...
    def seek(self, pos: int) -> int: ...
    def tell(self) -> int: ...

import io
print(isinstance(io.BytesIO(), Readable))  # True`,
    explanation: "`@runtime_checkable` with multiple methods checks all of them for presence during `isinstance`. It only checks method existence, not argument signatures."
  },
  {
    id: "py-b15-b4-final-class",
    language: "python",
    title: "Final class preventing inheritance",
    tag: "types",
    code: `from typing import final

@final
class Immutable:
    def __init__(self, value: int):
        self._value = value

    @property
    def value(self) -> int:
        return self._value

# class Sub(Immutable): pass  # type checker error`,
    explanation: "`@final` on a class tells type checkers that subclassing is forbidden. There's no runtime enforcement — it's a static analysis hint."
  },
  {
    id: "py-b15-b4-paramspec-compose",
    language: "python",
    title: "ParamSpec for composing decorators",
    tag: "types",
    code: `from typing import Callable, TypeVar
from typing import ParamSpec
import functools

P = ParamSpec("P")
T = TypeVar("T")

def logged(fn: Callable[P, T]) -> Callable[P, T]:
    @functools.wraps(fn)
    def wrapper(*args: P.args, **kwargs: P.kwargs) -> T:
        print(f"Calling {fn.__name__}")
        result = fn(*args, **kwargs)
        print(f"Done {fn.__name__}")
        return result
    return wrapper

@logged
def add(x: int, y: int) -> int:
    return x + y`,
    explanation: "`ParamSpec` in a decorator preserves the wrapped function's full signature — callers see the correct parameter types and names, not `*args, **kwargs`."
  },
  {
    id: "py-b15-b4-typeguard-dict",
    language: "python",
    title: "TypeGuard for narrowing dict types",
    tag: "types",
    code: `from typing import Any, TypeGuard

def is_string_dict(d: dict[str, Any]) -> TypeGuard[dict[str, str]]:
    return all(isinstance(v, str) for v in d.values())

config: dict[str, Any] = {"host": "localhost", "port": "5432"}
if is_string_dict(config):
    print(config["host"].upper())  # host is str here`,
    explanation: "A `TypeGuard` returning function converts an untyped or loosely typed value to a narrowed type when the check passes, enabling safe attribute access."
  },
  {
    id: "py-b15-b4-literal-union-narrow",
    language: "python",
    title: "Literal union for discriminated returns",
    tag: "types",
    code: `from typing import Literal, Union

type Status = Literal["ok", "error", "pending"]

def process(task: str) -> tuple[Status, str]:
    if not task:
        return "error", "empty task"
    return "ok", f"processed {task}"

status, msg = process("hello")
if status == "error":
    print(f"Error: {msg}")`,
    explanation: "`type` alias (Python 3.12+) creates a named `Literal` union. Comparing the first element of the tuple narrows both its type and the logic."
  },
  {
    id: "py-b15-b4-newtype-domain",
    language: "python",
    title: "NewType for validated domain values",
    tag: "types",
    code: `from typing import NewType

Email = NewType("Email", str)
PhoneNumber = NewType("PhoneNumber", str)

def parse_email(raw: str) -> Email:
    if "@" not in raw:
        raise ValueError(f"Invalid email: {raw}")
    return Email(raw)

def send(to: Email, body: str) -> None:
    print(f"Sending to {to}")

send(parse_email("user@example.com"), "Hello")`,
    explanation: "`NewType` wraps the validation in the factory function. Callers must go through `parse_email` to get an `Email` — preventing raw strings from bypassing validation."
  },
  {
    id: "py-b15-b4-annotated-pydantic",
    language: "python",
    title: "Annotated types for library metadata",
    tag: "types",
    code: `from typing import Annotated

class Gt:
    def __init__(self, gt): self.gt = gt

class Le:
    def __init__(self, le): self.le = le

PositiveInt = Annotated[int, Gt(0)]
Percentage = Annotated[float, Gt(0.0), Le(100.0)]

def validate_percentage(val: Percentage) -> Percentage:
    return val`,
    explanation: "`Annotated` chains multiple metadata objects. Validation libraries iterate `__metadata__` and apply each constraint in sequence."
  },
  {
    id: "py-b15-b4-pathlib-home",
    language: "python",
    title: "pathlib.Path.home() and expanduser",
    tag: "snippet",
    code: `from pathlib import Path

home = Path.home()
config = home / ".config" / "myapp" / "settings.json"

config.parent.mkdir(parents=True, exist_ok=True)
if not config.exists():
    config.write_text("{}", encoding="utf-8")

print(config)`,
    explanation: "`Path.home()` returns the user's home directory cross-platform. The `/` operator builds paths from components, always using the correct OS separator."
  },
  {
    id: "py-b15-b4-subprocess-communicate",
    language: "python",
    title: "subprocess.communicate with stdin",
    tag: "snippet",
    code: `import subprocess

proc = subprocess.Popen(
    ["python3", "-c", "import sys; print(sys.stdin.read().upper())"],
    stdin=subprocess.PIPE,
    stdout=subprocess.PIPE,
    text=True,
)
stdout, stderr = proc.communicate(input="hello world")
print(stdout)  # HELLO WORLD`,
    explanation: "`communicate` sends input and reads all output atomically, avoiding deadlocks from filling the pipe buffer that can occur with separate `write`/`read` calls."
  },
  {
    id: "py-b15-b4-logging-exc-info",
    language: "python",
    title: "Logging exceptions with exc_info",
    tag: "snippet",
    code: `import logging

logger = logging.getLogger(__name__)

def parse_config(path: str) -> dict:
    try:
        return {"loaded": True}
    except Exception:
        logger.error(
            "Failed to load config from %s",
            path,
            exc_info=True,
        )
        return {}`,
    explanation: "`exc_info=True` (or `logger.exception(...)`) appends the full traceback to the log record — equivalent to `logging.error(..., exc_info=sys.exc_info())`."
  },
  {
    id: "py-b15-b4-re-compile-flags",
    language: "python",
    title: "Combining regex flags",
    tag: "snippet",
    code: `import re

pattern = re.compile(
    r"^(?P<word>[a-z]+)$",
    re.IGNORECASE | re.MULTILINE
)

text = "Alpha\\nBeta\\nGamma"
matches = pattern.findall(text)
print(matches)  # ['Alpha', 'Beta', 'Gamma']`,
    explanation: "Flags can be combined with `|`. `re.MULTILINE` makes `^` and `$` match at line boundaries; `re.IGNORECASE` makes `[a-z]+` match uppercase too."
  },
  {
    id: "py-b15-b4-struct-network-header",
    language: "python",
    title: "struct for network protocol header parsing",
    tag: "snippet",
    code: `import struct

HEADER_FMT = "!BBHH"
HEADER_SIZE = struct.calcsize(HEADER_FMT)

def parse_header(data: bytes) -> tuple:
    version, typ, length, checksum = struct.unpack(
        HEADER_FMT, data[:HEADER_SIZE]
    )
    return version, typ, length, checksum

header = struct.pack(HEADER_FMT, 1, 2, 100, 0xABCD)
print(parse_header(header))`,
    explanation: "`!` specifies network byte order (big-endian). Defining the format string as a module constant makes `calcsize` and `pack`/`unpack` always consistent."
  },
  {
    id: "py-b15-b4-hashlib-file-digest",
    language: "python",
    title: "hashlib file checksumming",
    tag: "snippet",
    code: `import hashlib
from pathlib import Path

def sha256_file(path: str | Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()

print(sha256_file("README.md"))`,
    explanation: "Reading in 64 KB chunks keeps memory usage constant for arbitrarily large files. `update` incrementally feeds data into the hash state."
  },
  {
    id: "py-b15-b4-secrets-password-gen",
    language: "python",
    title: "Generating secure random passwords",
    tag: "snippet",
    code: `import secrets
import string

def generate_password(length: int = 16) -> str:
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    while True:
        pwd = "".join(secrets.choice(alphabet) for _ in range(length))
        has_upper = any(c.isupper() for c in pwd)
        has_digit = any(c.isdigit() for c in pwd)
        has_symbol = any(c in "!@#$%^&*" for c in pwd)
        if has_upper and has_digit and has_symbol:
            return pwd`,
    explanation: "`secrets.choice` draws from the OS CSPRNG. The retry loop enforces complexity requirements without biasing the distribution toward compliant passwords."
  },
  {
    id: "py-b15-b4-contextvars-middleware",
    language: "python",
    title: "contextvars in ASGI middleware",
    tag: "snippet",
    code: `from contextvars import ContextVar
import uuid

trace_id: ContextVar[str] = ContextVar("trace_id")

async def trace_middleware(scope, receive, send):
    if scope["type"] == "http":
        token = trace_id.set(str(uuid.uuid4()))
        try:
            await app(scope, receive, send)
        finally:
            trace_id.reset(token)

async def app(scope, receive, send): pass`,
    explanation: "Setting a `ContextVar` in ASGI middleware and resetting it in `finally` gives each request its own trace ID, visible anywhere in the call stack."
  },
  {
    id: "py-b15-b4-walrus-socket-recv",
    language: "python",
    title: "Walrus operator in network receive loop",
    tag: "snippet",
    code: `import socket

def read_line(conn: socket.socket) -> str:
    data = b""
    while (chunk := conn.recv(1)) and chunk != b"\\n":
        data += chunk
    return data.decode()`,
    explanation: "Walrus in `while` tests the received byte and binds it simultaneously — the loop terminates on EOF (empty bytes) or newline delimiter."
  },
  {
    id: "py-b15-b4-match-walrus-combined",
    language: "python",
    title: "Combining match/case with walrus in guard",
    tag: "snippet",
    code: `import re

def classify_log(line: str) -> str:
    match line.split(maxsplit=2):
        case [ts, "ERROR", msg] if (m := re.search(r"code=(\\d+)", msg)):
            return f"error code {m.group(1)} at {ts}"
        case [ts, "ERROR", msg]:
            return f"error at {ts}: {msg}"
        case [_, level, _]:
            return f"non-error: {level}"
        case _:
            return "unparseable"`,
    explanation: "Walrus in a case guard runs only after the pattern matches — here it extracts a code number from the already-bound `msg` variable."
  },
  {
    id: "py-b15-b4-dataclass-inherit",
    language: "python",
    title: "Dataclass inheritance",
    tag: "structures",
    code: `from dataclasses import dataclass

@dataclass
class Animal:
    name: str
    weight: float

@dataclass
class Dog(Animal):
    breed: str
    trained: bool = False

rex = Dog("Rex", 25.0, "Labrador", trained=True)
print(rex)`,
    explanation: "Inherited dataclass fields appear before child-class fields in the generated `__init__`. All parent fields must have defaults if any child field has a default."
  },
  {
    id: "py-b15-b4-protocol-hashable",
    language: "python",
    title: "Protocol for hashable types",
    tag: "types",
    code: `from typing import Protocol, TypeVar

class Hashable(Protocol):
    def __hash__(self) -> int: ...
    def __eq__(self, other: object) -> bool: ...

HT = TypeVar("HT", bound=Hashable)

def deduplicate(items: list[HT]) -> list[HT]:
    seen: set = set()
    result: list[HT] = []
    for item in items:
        if item not in seen:
            seen.add(item)
            result.append(item)
    return result`,
    explanation: "A `Hashable` Protocol includes both `__hash__` and `__eq__` since Python's hash contract requires equal objects to have equal hashes."
  },
  {
    id: "py-b15-b4-itertools-cycle-repeat",
    language: "python",
    title: "itertools.cycle and repeat for infinite sequences",
    tag: "snippet",
    code: `from itertools import cycle, repeat, islice

colors = cycle(["red", "green", "blue"])
first_7 = list(islice(colors, 7))
print(first_7)  # ['red', 'green', 'blue', 'red', 'green', 'blue', 'red']

zeros = list(islice(repeat(0), 5))
print(zeros)    # [0, 0, 0, 0, 0]`,
    explanation: "`cycle` loops an iterable indefinitely; `repeat` yields a single value forever. Both are lazy — always wrap with `islice` to limit output."
  },
  {
    id: "py-b15-b4-contextmanager-reentrant",
    language: "python",
    title: "contextlib.AbstractContextManager for reusable base",
    tag: "snippet",
    code: `from contextlib import AbstractContextManager

class DatabaseTransaction(AbstractContextManager):
    def __init__(self, conn):
        self._conn = conn

    def __enter__(self):
        self._conn.begin()
        return self._conn

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type:
            self._conn.rollback()
        else:
            self._conn.commit()
        return False`,
    explanation: "Inheriting from `AbstractContextManager` provides a default `__enter__` returning `self` and a no-op `__exit__` — override only what you need."
  },
  {
    id: "py-b15-b4-async-lock",
    language: "python",
    title: "asyncio.Lock for async mutual exclusion",
    tag: "snippet",
    code: `import asyncio

counter = 0
lock = asyncio.Lock()

async def increment():
    global counter
    async with lock:
        val = counter
        await asyncio.sleep(0)
        counter = val + 1

async def main():
    await asyncio.gather(*[increment() for _ in range(10)])
    print(counter)  # 10`,
    explanation: "`asyncio.Lock` protects state shared across coroutines. Without it, the `await` in the middle allows interleaving, producing a final count less than 10."
  },
  {
    id: "py-b15-b4-descriptor-observable",
    language: "python",
    title: "Observable attribute via descriptor",
    tag: "structures",
    code: `class Observable:
    def __set_name__(self, owner, name):
        self.name = name

    def __get__(self, obj, objtype=None):
        if obj is None: return self
        return obj.__dict__.get(self.name)

    def __set__(self, obj, value):
        old = obj.__dict__.get(self.name)
        obj.__dict__[self.name] = value
        if old != value:
            obj._notify(self.name, old, value)`,
    explanation: "The descriptor calls `_notify` on the owning object whenever the value changes, enabling observer/reactive patterns without subclassing or decorators."
  },
  {
    id: "py-b15-b4-metaclass-documented",
    language: "python",
    title: "Metaclass generating class documentation",
    tag: "classes",
    code: `class DocMeta(type):
    def __new__(mcs, name, bases, ns):
        methods = [k for k, v in ns.items()
                   if callable(v) and not k.startswith("_")]
        ns["__doc_methods__"] = methods
        cls = super().__new__(mcs, name, bases, ns)
        return cls

class Service(metaclass=DocMeta):
    def start(self): pass
    def stop(self): pass
    def status(self): return "running"

print(Service.__doc_methods__)  # ['start', 'stop', 'status']`,
    explanation: "Metaclass `__new__` inspects the namespace dict before the class exists, enabling compile-time metadata extraction without decorators."
  },
  {
    id: "py-b15-b4-abc-mixin-validate",
    language: "python",
    title: "ABC validation mixin",
    tag: "classes",
    code: `from abc import ABC, abstractmethod

class Validator(ABC):
    @abstractmethod
    def validate(self, value) -> bool: ...

    def require_valid(self, value):
        if not self.validate(value):
            raise ValueError(f"Invalid value: {value!r}")
        return value

class RangeValidator(Validator):
    def __init__(self, lo, hi):
        self.lo, self.hi = lo, hi

    def validate(self, value: int) -> bool:
        return self.lo <= value <= self.hi`,
    explanation: "`require_valid` is a concrete method on the abstract base — subclasses implement only `validate`, getting error-raising for free via the template method."
  },
  {
    id: "py-b15-b4-typing-type-alias",
    language: "python",
    title: "PEP 695 type alias syntax",
    tag: "types",
    code: `# Python 3.12+
type Vector = list[float]
type Matrix = list[Vector]
type Callback[T] = Callable[[T], None]

def scale(v: Vector, factor: float) -> Vector:
    return [x * factor for x in v]

from typing import Callable`,
    explanation: "The `type` statement (PEP 695) creates explicit type aliases that are lazily evaluated, avoiding forward-reference issues and making generic aliases cleaner."
  },
  {
    id: "py-b15-b4-pathlib-replace",
    language: "python",
    title: "pathlib rename and replace",
    tag: "snippet",
    code: `from pathlib import Path

tmp = Path("output.tmp")
tmp.write_text("final content", encoding="utf-8")

final = Path("output.txt")
tmp.replace(final)

print(final.read_text())`,
    explanation: "`replace` atomically renames the file, overwriting the destination if it exists. On most systems this is a single syscall — no partial-write window."
  },
  {
    id: "py-b15-b4-subprocess-check-output",
    language: "python",
    title: "subprocess.check_output for simple capture",
    tag: "snippet",
    code: `import subprocess

branch = subprocess.check_output(
    ["git", "rev-parse", "--abbrev-ref", "HEAD"],
    text=True,
).strip()

print(f"Current branch: {branch}")`,
    explanation: "`check_output` raises `CalledProcessError` on non-zero exit and returns stdout as a string (with `text=True`). `.strip()` removes the trailing newline."
  },
  {
    id: "py-b15-b4-logging-context-manager",
    language: "python",
    title: "Logging context manager for scoped level",
    tag: "snippet",
    code: `import logging
from contextlib import contextmanager

@contextmanager
def log_level(logger, level):
    old = logger.level
    logger.setLevel(level)
    try:
        yield logger
    finally:
        logger.setLevel(old)

logger = logging.getLogger("app")
with log_level(logger, logging.DEBUG) as log:
    log.debug("Verbose details here")`,
    explanation: "Temporarily lowering the log level inside a context manager captures verbose output for a specific code block without affecting global logging configuration."
  },
  {
    id: "py-b15-b4-re-split",
    language: "python",
    title: "re.split with capturing groups",
    tag: "snippet",
    code: `import re

text = "one+two*three-four"
parts = re.split(r"([+*-])", text)
print(parts)
# ['one', '+', 'two', '*', 'three', '-', 'four']`,
    explanation: "When the pattern contains a capturing group, the separators are included in the result list — useful for round-trip tokenization where you need to reconstruct the original."
  },
  {
    id: "py-b15-b4-walrus-input-loop",
    language: "python",
    title: "Walrus operator in input loop",
    tag: "snippet",
    code: `lines = []
import sys

# Reads from sys.stdin until EOF
def collect_input(stream) -> list[str]:
    return [line.rstrip("\\n")
            for line in iter(stream.readline, "")]

# Equivalent while loop with walrus:
def collect_walrus(stream) -> list[str]:
    lines = []
    while line := stream.readline():
        lines.append(line.rstrip("\\n"))
    return lines`,
    explanation: "`iter(callable, sentinel)` and the walrus approach are equivalent for reading until EOF. Walrus is more explicit about what the loop variable contains."
  },
  {
    id: "py-b15-b4-match-nested",
    language: "python",
    title: "Nested match/case patterns",
    tag: "snippet",
    code: `def process_packet(packet: dict) -> str:
    match packet:
        case {"type": "data", "payload": {"size": int(s)}} if s > 1024:
            return f"large data: {s} bytes"
        case {"type": "data", "payload": {"size": int(s)}}:
            return f"small data: {s} bytes"
        case {"type": "ack"}:
            return "acknowledgement"
        case _:
            return "unknown"`,
    explanation: "Patterns nest arbitrarily deep. The inner `int(s)` pattern both checks that `size` is an `int` and binds its value to `s` for use in guards and return values."
  },
  {
    id: "py-b15-b4-dataclass-classvar",
    language: "python",
    title: "dataclass with ClassVar fields",
    tag: "structures",
    code: `from dataclasses import dataclass
from typing import ClassVar

@dataclass
class Counter:
    _count: ClassVar[int] = 0
    name: str

    def __post_init__(self):
        Counter._count += 1

    @classmethod
    def total(cls) -> int:
        return cls._count

Counter("a"); Counter("b"); Counter("c")
print(Counter.total())  # 3`,
    explanation: "`ClassVar` fields are excluded from the generated `__init__` and other dataclass machinery — they're class-level attributes shared across all instances."
  },
  {
    id: "py-b15-b4-protocol-descriptor",
    language: "python",
    title: "Protocol for descriptor protocol",
    tag: "types",
    code: `from typing import Protocol, TypeVar, overload, Any

T = TypeVar("T")

class Descriptor(Protocol[T]):
    @overload
    def __get__(self, obj: None, objtype: type) -> "Descriptor[T]": ...
    @overload
    def __get__(self, obj: Any, objtype: type | None) -> T: ...
    def __set__(self, obj: Any, value: T) -> None: ...`,
    explanation: "Typing the descriptor protocol itself with overloads models the `None`-vs-instance distinction — `obj is None` returns the descriptor, otherwise returns the value."
  },
  {
    id: "py-b15-b4-itertools-starmap",
    language: "python",
    title: "itertools.starmap for argument unpacking",
    tag: "snippet",
    code: `from itertools import starmap

pairs = [(2, 3), (4, 5), (10, 2)]
results = list(starmap(pow, pairs))
print(results)  # [8, 1024, 100]`,
    explanation: "`starmap` is like `map` but unpacks each element as positional arguments — equivalent to `[fn(*args) for args in iterable]` but lazy."
  },
  {
    id: "py-b15-b4-contextmanager-error-boundary",
    language: "python",
    title: "Error boundary context manager",
    tag: "snippet",
    code: `from contextlib import contextmanager
from typing import Generator

@contextmanager
def error_boundary(
    fallback=None, suppress=(Exception,)
) -> Generator:
    try:
        yield
    except suppress:
        pass
    finally:
        pass

with error_boundary(suppress=(ValueError, TypeError)):
    result = int("not a number")`,
    explanation: "A parameterized error boundary context manager is more explicit than a bare `except Exception: pass` — the suppressed types are visible at the call site."
  },
  {
    id: "py-b15-b4-async-queue",
    language: "python",
    title: "asyncio.Queue for async producer-consumer",
    tag: "snippet",
    code: `import asyncio

async def producer(queue: asyncio.Queue) -> None:
    for i in range(5):
        await queue.put(i)
        await asyncio.sleep(0.05)
    await queue.put(None)

async def consumer(queue: asyncio.Queue) -> None:
    while (item := await queue.get()) is not None:
        print(f"Got: {item}")
        queue.task_done()

async def main():
    q: asyncio.Queue = asyncio.Queue(maxsize=3)
    await asyncio.gather(producer(q), consumer(q))`,
    explanation: "`maxsize=3` applies back-pressure — the producer blocks at `put` when the queue is full. `task_done` signals that the item has been processed."
  },
  {
    id: "py-b15-b4-descriptor-cache-invalidate",
    language: "python",
    title: "Descriptor with dependency-based cache invalidation",
    tag: "structures",
    code: `class Derived:
    def __init__(self, *deps):
        self.deps = deps

    def __set_name__(self, owner, name):
        self.name = name
        self.cache = f"_{name}_cache"

    def __get__(self, obj, objtype=None):
        if obj is None: return self
        key = tuple(getattr(obj, d) for d in self.deps)
        cached = obj.__dict__.get(self.cache)
        if cached and cached[0] == key:
            return cached[1]
        val = self.compute(obj)
        obj.__dict__[self.cache] = (key, val)
        return val

    def compute(self, obj):
        raise NotImplementedError`,
    explanation: "The cache key is a tuple of dependency values — the cached result is reused only when all dependencies are unchanged since the last computation."
  },
  {
    id: "py-b15-b4-metaclass-slots",
    language: "python",
    title: "Metaclass automatically adding __slots__",
    tag: "classes",
    code: `import typing

class SlottedMeta(type):
    def __new__(mcs, name, bases, ns):
        hints = ns.get("__annotations__", {})
        if "__slots__" not in ns and hints:
            ns["__slots__"] = tuple(hints.keys())
        return super().__new__(mcs, name, bases, ns)

class Point(metaclass=SlottedMeta):
    x: float
    y: float

p = Point()
p.x = 1.0
p.y = 2.0
print(p.__slots__)  # ('x', 'y')`,
    explanation: "The metaclass reads annotations and injects `__slots__` before calling `type.__new__`, preventing `__dict__` creation and reducing memory per instance."
  },
  {
    id: "py-b15-b4-abc-covariant-return",
    language: "python",
    title: "ABC with covariant return type in subclass",
    tag: "classes",
    code: `from abc import ABC, abstractmethod

class Builder(ABC):
    @abstractmethod
    def build(self) -> "Builder":
        ...

class CarBuilder(Builder):
    def build(self) -> "CarBuilder":
        return self`,
    explanation: "Overriding with a narrower return type (`CarBuilder` instead of `Builder`) is covariant and type-safe. The subclass returns a more specific object than the base promises."
  },
  {
    id: "py-b15-b4-unpack-typeddict",
    language: "python",
    title: "Unpack for typed **kwargs",
    tag: "types",
    code: `from typing import TypedDict, Unpack

class Options(TypedDict, total=False):
    timeout: float
    retries: int
    verify_ssl: bool

def fetch(url: str, **opts: Unpack[Options]) -> str:
    timeout = opts.get("timeout", 30.0)
    retries = opts.get("retries", 3)
    return f"fetched {url} (t={timeout}, r={retries})"`,
    explanation: "`Unpack[TypedDict]` (Python 3.12+) types `**kwargs` precisely — callers see named keyword arguments with individual types, not just `**kwargs: Any`."
  },
  {
    id: "py-b15-b4-pathlib-is-relative-to",
    language: "python",
    title: "pathlib.is_relative_to for path containment",
    tag: "snippet",
    code: `from pathlib import Path

base = Path("/var/www/html")
file = Path("/var/www/html/index.html")
outside = Path("/etc/passwd")

print(file.is_relative_to(base))    # True
print(outside.is_relative_to(base)) # False`,
    explanation: "`is_relative_to` (Python 3.9+) checks containment without raising. Use it to validate that user-supplied paths don't escape a sandbox directory."
  },
  {
    id: "py-b15-b4-subprocess-env-inherit",
    language: "python",
    title: "subprocess inheriting filtered environment",
    tag: "snippet",
    code: `import subprocess
import os

SAFE_VARS = {"PATH", "HOME", "LANG", "USER"}
clean_env = {k: v for k, v in os.environ.items() if k in SAFE_VARS}

result = subprocess.run(
    ["env"],
    env=clean_env,
    capture_output=True,
    text=True,
)
print(result.stdout[:200])`,
    explanation: "Filtering the environment to a whitelist before passing it to a child process prevents accidental leakage of secrets stored in environment variables."
  },
  {
    id: "py-b15-b4-logging-handler-file",
    language: "python",
    title: "RotatingFileHandler for log rotation",
    tag: "snippet",
    code: `import logging
from logging.handlers import RotatingFileHandler

handler = RotatingFileHandler(
    "app.log",
    maxBytes=10 * 1024 * 1024,
    backupCount=5,
)
handler.setFormatter(logging.Formatter("%(asctime)s %(message)s"))

logger = logging.getLogger("app")
logger.addHandler(handler)
logger.setLevel(logging.INFO)`,
    explanation: "`RotatingFileHandler` automatically rolls over when the file exceeds `maxBytes`, keeping `backupCount` rotated files (`.log.1`, `.log.2`, etc.)."
  },
  {
    id: "py-b15-b4-re-lookahead",
    language: "python",
    title: "Lookahead and lookbehind assertions",
    tag: "snippet",
    code: `import re

# Split on comma only when NOT inside parentheses (simplified)
price = "100.00"
# Positive lookahead: match digits followed by decimal
decimals = re.findall(r"\\d+(?=\\.\\d{2}\\b)", "12.50 and 7.99")
print(decimals)  # ['12', '7']

# Negative lookbehind: 'python' not preceded by 'i'
words = re.findall(r"(?<!i)python", "python ipython cpython")
print(words)  # ['python', 'cpython']`,
    explanation: "Lookahead `(?=...)` and lookbehind `(?<=...)` are zero-width assertions — they check context without consuming characters or including them in the match."
  },
  {
    id: "py-b15-b4-walrus-generator-early-exit",
    language: "python",
    title: "Walrus with early exit in comprehension",
    tag: "snippet",
    code: `def first_valid(items, validate):
    return next(
        (result for item in items
         if (result := validate(item)) is not None),
        None,
    )

def parse(s):
    try: return int(s)
    except ValueError: return None

print(first_valid(["x", "y", "42", "z"], parse))  # 42`,
    explanation: "`next` with a default short-circuits the generator on the first successful `validate` call. The walrus avoids calling `validate` twice for test and capture."
  },
  {
    id: "py-b15-b4-match-class-constructor",
    language: "python",
    title: "match/case positional class pattern",
    tag: "snippet",
    code: `from dataclasses import dataclass

@dataclass
class Rect:
    width: float
    height: float
    __match_args__ = ("width", "height")

def area(shape) -> float:
    match shape:
        case Rect(w, h) if w > 0 and h > 0:
            return w * h
        case Rect():
            return 0.0
        case _:
            raise TypeError`,
    explanation: "`__match_args__` defines the order of positional pattern arguments, allowing `Rect(w, h)` instead of `Rect(width=w, height=h)` in case patterns."
  },
  {
    id: "py-b15-b4-dataclass-asdict",
    language: "python",
    title: "dataclasses.asdict for serialization",
    tag: "snippet",
    code: `from dataclasses import dataclass, asdict
import json

@dataclass
class Config:
    host: str
    port: int
    debug: bool = False

cfg = Config("localhost", 8080, debug=True)
print(json.dumps(asdict(cfg), indent=2))`,
    explanation: "`asdict` recursively converts a dataclass to a dict, handling nested dataclasses and lists. Useful for JSON serialization without a custom `__dict__` traversal."
  },
  {
    id: "py-b15-b4-protocol-async-iter",
    language: "python",
    title: "Protocol for async iterables",
    tag: "types",
    code: `from typing import Protocol, AsyncIterator

class AsyncIterable(Protocol[type]):
    def __aiter__(self) -> AsyncIterator: ...

async def drain(source: AsyncIterable) -> list:
    return [item async for item in source]`,
    explanation: "Typing `__aiter__` in a Protocol accepts any async iterable — async generators, classes with `__aiter__`/`__anext__`, or custom async wrappers."
  },
  {
    id: "py-b15-b4-itertools-tee",
    language: "python",
    title: "itertools.tee for independent iterators",
    tag: "snippet",
    code: `from itertools import tee

def expensive_source():
    for i in range(5):
        print(f"producing {i}")
        yield i

a, b = tee(expensive_source(), 2)
print("first pass:", list(a))
print("second pass:", list(b))`,
    explanation: "`tee` splits one iterator into `n` independent ones. Beware: consumed items are buffered in memory until all copies advance past them."
  },
  {
    id: "py-b15-b4-contextmanager-reuse",
    language: "python",
    title: "Reusable context managers",
    tag: "snippet",
    code: `from contextlib import contextmanager

class Counter:
    def __init__(self): self.count = 0

    @contextmanager
    def track(self, label: str):
        start = self.count
        try:
            yield
        finally:
            print(f"{label}: +{self.count - start}")

c = Counter()
with c.track("block"):
    c.count += 5`,
    explanation: "A context manager defined as a method can access `self` state, making it easy to build stateful tracking helpers that don't require a separate class."
  },
  {
    id: "py-b15-b4-async-shield",
    language: "python",
    title: "asyncio.shield protecting from cancellation",
    tag: "snippet",
    code: `import asyncio

async def critical_cleanup():
    print("Cleanup started")
    await asyncio.sleep(0.5)
    print("Cleanup done")

async def main():
    task = asyncio.create_task(asyncio.shield(critical_cleanup()))
    await asyncio.sleep(0.1)
    task.cancel()
    await asyncio.sleep(1.0)
    print("Main done")`,
    explanation: "`asyncio.shield` wraps a coroutine so that cancelling the outer task doesn't cancel the inner one — useful for cleanup operations that must complete."
  },
  {
    id: "py-b15-b4-descriptor-delegation",
    language: "python",
    title: "Delegating descriptor for proxy pattern",
    tag: "structures",
    code: `class Delegated:
    def __init__(self, target_attr, attr):
        self.target_attr = target_attr
        self.attr = attr

    def __get__(self, obj, objtype=None):
        if obj is None: return self
        target = getattr(obj, self.target_attr, None)
        return getattr(target, self.attr, None)

class Order:
    def __init__(self, customer):
        self.customer = customer
    customer_name = Delegated("customer", "name")

class Customer:
    def __init__(self, name): self.name = name`,
    explanation: "`Delegated` lazily forwards attribute reads to a nested object. `Order.customer_name` transparently reads from `order.customer.name` without manual property definitions."
  },
  {
    id: "py-b15-b4-metaclass-sealed",
    language: "python",
    title: "Metaclass for sealed class hierarchy",
    tag: "classes",
    code: `class SealedMeta(type):
    _allowed_subclasses: set = set()

    def __init_subclass__(cls, **kwargs):
        pass

    def __new__(mcs, name, bases, ns):
        cls = super().__new__(mcs, name, bases, ns)
        for base in bases:
            if (isinstance(base, SealedMeta)
                    and base not in mcs._allowed_subclasses
                    and base is not object):
                raise TypeError(f"Cannot subclass sealed {base.__name__}")
        mcs._allowed_subclasses.add(cls)
        return cls`,
    explanation: "Once a class is sealed, only the original set of registered subclasses can be extended. External subclassing raises `TypeError` at class creation time."
  },
  {
    id: "py-b15-b4-abc-virtual-subclass",
    language: "python",
    title: "ABCMeta with __subclasshook__",
    tag: "classes",
    code: `from abc import ABCMeta, abstractmethod

class Hashable(metaclass=ABCMeta):
    @abstractmethod
    def __hash__(self) -> int: ...

    @classmethod
    def __subclasshook__(cls, C):
        if cls is Hashable:
            if any("__hash__" in B.__dict__ for B in C.__mro__):
                return True
        return NotImplemented

print(issubclass(int, Hashable))    # True
print(issubclass(list, Hashable))   # False (unhashable)`,
    explanation: "`__subclasshook__` customizes `issubclass` without explicit registration. Returning `NotImplemented` falls back to normal inheritance and `register` checks."
  },
  {
    id: "py-b15-b4-typing-never-return",
    language: "python",
    title: "NoReturn for functions that never return",
    tag: "types",
    code: `from typing import NoReturn
import sys

def fatal(message: str) -> NoReturn:
    print(f"FATAL: {message}", file=sys.stderr)
    sys.exit(1)

def get_required(key: str) -> str:
    value = None
    if value is None:
        fatal(f"Missing required config: {key}")
    return value  # unreachable, but now type-checks`,
    explanation: "`NoReturn` tells the type checker the function never returns normally (raises or exits). This narrows types after the call — `value` below `fatal` is unreachable."
  },
  {
    id: "py-b15-b4-pathlib-link",
    language: "python",
    title: "pathlib symlinks and hardlinks",
    tag: "snippet",
    code: `from pathlib import Path

target = Path("original.txt")
target.write_text("content", encoding="utf-8")

link = Path("link.txt")
link.symlink_to(target)

print(link.is_symlink())   # True
print(link.resolve())      # absolute path to original
print(link.read_text())    # 'content'

link.unlink()`,
    explanation: "`symlink_to` creates a soft link. `resolve` follows symlinks to the canonical path. `is_symlink` distinguishes links from regular files."
  },
  {
    id: "py-b15-b4-subprocess-windows-compat",
    language: "python",
    title: "subprocess cross-platform command",
    tag: "snippet",
    code: `import subprocess
import sys

def python_version() -> str:
    result = subprocess.run(
        [sys.executable, "--version"],
        capture_output=True,
        text=True,
    )
    return result.stdout.strip() or result.stderr.strip()

print(python_version())`,
    explanation: "`sys.executable` is the absolute path to the current Python interpreter, ensuring the subprocess uses the same Python version as the parent — works on all platforms."
  },
  {
    id: "py-b15-b4-logging-adapter",
    language: "python",
    title: "LoggerAdapter for contextual logging",
    tag: "snippet",
    code: `import logging

class RequestAdapter(logging.LoggerAdapter):
    def process(self, msg, kwargs):
        return f"[{self.extra['request_id']}] {msg}", kwargs

base_logger = logging.getLogger("app")
logger = RequestAdapter(base_logger, {"request_id": "abc123"})
logger.info("Processing started")`,
    explanation: "`LoggerAdapter` wraps a logger to prepend contextual information to every message. Override `process` to transform message and kwargs before passing to the logger."
  },
  {
    id: "py-b15-b4-re-fullmatch",
    language: "python",
    title: "re.fullmatch vs re.match vs re.search",
    tag: "snippet",
    code: `import re

pattern = r"\\d{4}-\\d{2}-\\d{2}"
text = "2026-05-15 extra"

print(bool(re.match(pattern, text)))     # True  (matches start)
print(bool(re.search(pattern, text)))    # True  (matches anywhere)
print(bool(re.fullmatch(pattern, text))) # False (must match whole)
print(bool(re.fullmatch(pattern, "2026-05-15")))  # True`,
    explanation: "`fullmatch` requires the pattern to span the entire string. Prefer it over `match(r'...$')` to avoid forgetting the `$` anchor."
  },
  {
    id: "py-b15-b4-walrus-chunked-response",
    language: "python",
    title: "Walrus with HTTP streaming response",
    tag: "snippet",
    code: `import io

def stream_response(source: io.RawIOBase, chunk_size: int = 8192):
    while chunk := source.read(chunk_size):
        yield chunk

content = b"hello world" * 1000
stream = io.BytesIO(content)
total = sum(len(c) for c in stream_response(stream))
print(f"Streamed {total} bytes")`,
    explanation: "The walrus makes the streaming loop idiom explicit: read and test in one expression, process the chunk in the body. Terminates cleanly on empty read (EOF)."
  },
  {
    id: "py-b15-b4-match-starred-rest",
    language: "python",
    title: "match/case with starred rest capture",
    tag: "snippet",
    code: `def route(path_parts: list[str]) -> str:
    match path_parts:
        case ["api", "v1", *rest]:
            return f"v1 endpoint: {'/'.join(rest)}"
        case ["api", "v2", *rest]:
            return f"v2 endpoint: {'/'.join(rest)}"
        case ["static", filename]:
            return f"static file: {filename}"
        case _:
            return "not found"

print(route(["api", "v1", "users", "42"]))`,
    explanation: "The starred element `*rest` captures zero or more remaining items. It must appear at most once in a sequence pattern."
  },
  {
    id: "py-b15-b4-dataclass-replace",
    language: "python",
    title: "dataclasses.replace for immutable updates",
    tag: "snippet",
    code: `from dataclasses import dataclass, replace

@dataclass(frozen=True)
class Config:
    host: str
    port: int
    debug: bool = False

prod = Config("prod.example.com", 443)
dev = replace(prod, host="localhost", port=8080, debug=True)
print(dev)`,
    explanation: "`dataclasses.replace` is the functional equivalent of record `with` expressions — it creates a new instance with specified fields changed and others copied."
  },
];
