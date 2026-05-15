import type { Snippet } from "./types";

export const pythonSnippets20260515B5: Snippet[] = [
  {
    id: "py-b15-b5-walrus-http-response",
    language: "python",
    title: "Walrus in HTTP response inspection",
    tag: "snippet",
    code: `import urllib.request

def fetch_if_ok(url: str) -> bytes | None:
    with urllib.request.urlopen(url) as resp:
        if (code := resp.status) == 200:
            return resp.read()
        print(f"HTTP {code}: {resp.reason}")
        return None`,
    explanation: "Assigning the status code with walrus lets you both test it and log the exact code in the else branch without a separate variable declaration."
  },
  {
    id: "py-b15-b5-match-star-dict",
    language: "python",
    title: "match/case with **rest for extra keys",
    tag: "snippet",
    code: `def route(request: dict) -> str:
    match request:
        case {"method": "GET", "path": path, **rest}:
            auth = rest.get("auth")
            return f"GET {path} auth={auth}"
        case {"method": m, **_}:
            return f"Unsupported method: {m}"`,
    explanation: "`**rest` captures all remaining keys not explicitly matched. It always succeeds even if `rest` is empty, unlike sequence star patterns."
  },
  {
    id: "py-b15-b5-dataclass-ordering-key",
    language: "python",
    title: "Custom sort key with dataclass",
    tag: "snippet",
    code: `from dataclasses import dataclass, field

@dataclass
class Task:
    priority: int
    name: str
    _sort_key: tuple = field(init=False, repr=False, compare=False)

    def __post_init__(self):
        self._sort_key = (-self.priority, self.name)

tasks = [Task(1, "C"), Task(3, "A"), Task(3, "B"), Task(2, "D")]
print(sorted(tasks, key=lambda t: t._sort_key))`,
    explanation: "Pre-computing a sort key tuple in `__post_init__` avoids recomputing it on every comparison. `compare=False` keeps it out of `==` and ordering methods."
  },
  {
    id: "py-b15-b5-protocol-awaitable",
    language: "python",
    title: "Protocol for awaitable objects",
    tag: "types",
    code: `from typing import Protocol, TypeVar

T = TypeVar("T", covariant=True)

class Awaitable(Protocol[T]):
    def __await__(self): ...

async def wrap(awaitable: Awaitable[str]) -> str:
    return await awaitable

import asyncio
result = asyncio.run(wrap(asyncio.coroutine(lambda: "hello")()))`,
    explanation: "A Protocol with `__await__` matches any object usable with `await` — coroutines, `asyncio.Future`, and custom awaitable classes all qualify."
  },
  {
    id: "py-b15-b5-typeddict-readonly",
    language: "python",
    title: "TypedDict with ReadOnly fields (3.13)",
    tag: "types",
    code: `from typing import TypedDict, ReadOnly

class ImmutableUser(TypedDict):
    id: ReadOnly[int]
    name: ReadOnly[str]
    score: int

user: ImmutableUser = {"id": 1, "name": "Alice", "score": 100}
user["score"] = 110  # ok
# user["id"] = 2    # type checker error`,
    explanation: "`ReadOnly[T]` (Python 3.13) marks individual keys as non-reassignable from a type-checker perspective, mixing mutable and immutable keys in one TypedDict."
  },
  {
    id: "py-b15-b5-itertools-combinations",
    language: "python",
    title: "itertools.combinations and permutations",
    tag: "snippet",
    code: `from itertools import combinations, permutations

items = ["A", "B", "C", "D"]
pairs = list(combinations(items, 2))
print(len(pairs))   # 6

# Ordered arrangements
triples = list(permutations(items, 3))
print(len(triples))  # 24`,
    explanation: "`combinations` returns unordered selections (no repeats, C(n,r)); `permutations` returns ordered arrangements (P(n,r)). Both are lazy — wrap with `list` to materialize."
  },
  {
    id: "py-b15-b5-contextmanager-patch",
    language: "python",
    title: "unittest.mock.patch as context manager",
    tag: "snippet",
    code: `from unittest.mock import patch
import os

with patch("os.getcwd", return_value="/fake/path") as mock_cwd:
    result = os.getcwd()
    print(result)          # /fake/path
    print(mock_cwd.called) # True

print(os.getcwd() != "/fake/path")  # True — restored`,
    explanation: "`patch` as a context manager restores the original function when the block exits. The `as` alias gives access to the `MagicMock` for assertions."
  },
  {
    id: "py-b15-b5-async-event",
    language: "python",
    title: "asyncio.Event for signaling between coroutines",
    tag: "snippet",
    code: `import asyncio

async def waiter(event: asyncio.Event, name: str) -> None:
    await event.wait()
    print(f"{name} was notified")

async def main():
    event = asyncio.Event()
    tasks = [asyncio.create_task(waiter(event, f"w{i}")) for i in range(3)]
    await asyncio.sleep(0.1)
    event.set()
    await asyncio.gather(*tasks)`,
    explanation: "`asyncio.Event.wait()` suspends until `set()` is called. Multiple coroutines can wait on the same event and all resume when it fires."
  },
  {
    id: "py-b15-b5-descriptor-instance-level",
    language: "python",
    title: "Instance-level descriptor override",
    tag: "structures",
    code: `class NonDataDescriptor:
    def __get__(self, obj, objtype=None):
        if obj is None: return self
        return "from descriptor"

class MyClass:
    value = NonDataDescriptor()

obj = MyClass()
print(obj.value)       # from descriptor
obj.__dict__["value"] = "from instance"
print(obj.value)       # from instance — instance dict wins!`,
    explanation: "Non-data descriptors (only `__get__`, no `__set__`) are overridden by the instance dict. Data descriptors (with `__set__`) take precedence over the instance dict."
  },
  {
    id: "py-b15-b5-metaclass-enum",
    language: "python",
    title: "How Enum uses metaclass magic",
    tag: "classes",
    code: `from enum import EnumMeta, Enum

class Color(Enum):
    RED = 1
    GREEN = 2
    BLUE = 3

print(type(Color))          # <class 'EnumMeta'>
print(Color.RED)            # Color.RED
print(Color.RED.value)      # 1
print(list(Color))          # [<Color.RED: 1>, ...]`,
    explanation: "`Enum` uses `EnumMeta` as its metaclass. `EnumMeta.__new__` transforms the class namespace — class attributes become enum members, not plain values."
  },
  {
    id: "py-b15-b5-abc-abstract-slot",
    language: "python",
    title: "ABC with abstract class variable",
    tag: "classes",
    code: `from abc import ABC, abstractmethod
from typing import ClassVar

class Resource(ABC):
    resource_type: ClassVar[str]

    @classmethod
    def describe(cls) -> str:
        if not hasattr(cls, "resource_type"):
            raise NotImplementedError
        return f"{cls.__name__}: {cls.resource_type}"

class CPUResource(Resource):
    resource_type = "compute"`,
    explanation: "Abstract class variables can't use `@abstractmethod` — instead, check with `hasattr` in a classmethod. Mypy's `@abstractmethod` on `ClassVar` flag is separate."
  },
  {
    id: "py-b15-b5-typing-typevar-default",
    language: "python",
    title: "TypeVar with default (PEP 696)",
    tag: "types",
    code: `# Python 3.13+
from typing import TypeVar

T = TypeVar("T", default=str)

def first(items: list[T]) -> T:
    return items[0]

# Without explicit T, inferred as str:
result = first(["hello", "world"])
reveal_type(result)  # str`,
    explanation: "TypeVar defaults (PEP 696) allow omitting the type argument when a sensible default exists — reducing annotation verbosity while maintaining type safety."
  },
  {
    id: "py-b15-b5-paramspec-protocol",
    language: "python",
    title: "ParamSpec in Protocol for callback typing",
    tag: "types",
    code: `from typing import Protocol, ParamSpec, TypeVar
from typing import Callable

P = ParamSpec("P")
R = TypeVar("R")

class Middleware(Protocol):
    def __call__(
        self,
        next: Callable[P, R],
        *args: P.args,
        **kwargs: P.kwargs,
    ) -> R: ...`,
    explanation: "`ParamSpec` in a Protocol describes middleware that wraps arbitrary callables while preserving their exact signature — typed WSGI/ASGI-style composition."
  },
  {
    id: "py-b15-b5-typeguard-narrowing",
    language: "python",
    title: "TypeGuard vs assert_type for narrowing",
    tag: "types",
    code: `from typing import TypeGuard, assert_type

def is_positive(n: int) -> TypeGuard[int]:
    return n > 0

def use(value: int) -> None:
    if is_positive(value):
        assert_type(value, int)   # confirmed: int (not narrowed further)
        print(f"Positive: {value}")`,
    explanation: "`assert_type` (Python 3.11+) is a no-op at runtime but causes a type error if the argument's type doesn't match — useful for documenting and testing type narrowing logic."
  },
  {
    id: "py-b15-b5-literal-enum-union",
    language: "python",
    title: "Literal as enum alternative",
    tag: "types",
    code: `from typing import Literal, Union

HTTPMethod = Literal["GET", "POST", "PUT", "DELETE", "PATCH"]

def make_request(method: HTTPMethod, url: str) -> None:
    print(f"{method} {url}")

make_request("GET", "/api/users")
# make_request("INVALID", "/")  # type error`,
    explanation: "`Literal` unions of strings create closed sets without the overhead of `Enum` — useful for protocol-level string constants where enum instances are unnecessary."
  },
  {
    id: "py-b15-b5-newtype-currency",
    language: "python",
    title: "NewType for currency amounts",
    tag: "types",
    code: `from typing import NewType
from decimal import Decimal

USD = NewType("USD", Decimal)
EUR = NewType("EUR", Decimal)

def convert_to_eur(amount: USD, rate: Decimal) -> EUR:
    return EUR(amount * rate)

price = USD(Decimal("100.00"))
eur = convert_to_eur(price, Decimal("0.92"))
print(eur)  # 92.0000`,
    explanation: "`NewType` over `Decimal` creates distinct currency types. `convert_to_eur` only accepts `USD`, preventing accidentally passing `EUR` values as input."
  },
  {
    id: "py-b15-b5-annotated-field",
    language: "python",
    title: "Annotated in dataclass fields",
    tag: "types",
    code: `from typing import Annotated
from dataclasses import dataclass

class MinLen:
    def __init__(self, n): self.n = n

@dataclass
class User:
    name: Annotated[str, MinLen(1)]
    email: Annotated[str, MinLen(5)]
    age: Annotated[int, "must be positive"]

    def __post_init__(self):
        import typing
        for f_name, f_type in typing.get_type_hints(
            type(self), include_extras=True
        ).items():
            for meta in getattr(f_type, "__metadata__", []):
                if isinstance(meta, MinLen):
                    val = getattr(self, f_name)
                    if len(val) < meta.n:
                        raise ValueError(f"{f_name} too short")`,
    explanation: "`include_extras=True` in `get_type_hints` preserves `Annotated` wrappers. Without it, the hint resolves to the base type, losing the metadata."
  },
  {
    id: "py-b15-b5-pathlib-walk",
    language: "python",
    title: "os.walk vs pathlib for directory traversal",
    tag: "snippet",
    code: `from pathlib import Path

def find_large_files(root: str, min_bytes: int) -> list[Path]:
    return [
        p for p in Path(root).rglob("*")
        if p.is_file() and p.stat().st_size >= min_bytes
    ]

results = find_large_files(".", 1024 * 1024)
for f in results:
    print(f"{f}: {f.stat().st_size:,} bytes")`,
    explanation: "`rglob('*')` yields all files and directories recursively. Filtering with `.is_file()` and `.stat().st_size` is more readable than equivalent `os.walk` code."
  },
  {
    id: "py-b15-b5-subprocess-realtime",
    language: "python",
    title: "subprocess real-time output streaming",
    tag: "snippet",
    code: `import subprocess
import sys

def stream_output(cmd: list[str]) -> int:
    with subprocess.Popen(
        cmd,
        stdout=subprocess.PIPE,
        text=True,
        bufsize=1,
    ) as proc:
        for line in proc.stdout:
            sys.stdout.write(line)
            sys.stdout.flush()
    return proc.returncode`,
    explanation: "`bufsize=1` enables line-buffered output. Iterating over `proc.stdout` reads lines as they arrive rather than buffering the entire output."
  },
  {
    id: "py-b15-b5-logging-json",
    language: "python",
    title: "JSON log formatter",
    tag: "snippet",
    code: `import logging
import json

class JSONFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        return json.dumps({
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "time": self.formatTime(record, self.datefmt),
        })

handler = logging.StreamHandler()
handler.setFormatter(JSONFormatter())
logging.getLogger().addHandler(handler)`,
    explanation: "Overriding `format` converts log records to JSON. `getMessage()` applies % or {} formatting to the message args; `formatTime` uses ISO 8601 by default."
  },
  {
    id: "py-b15-b5-re-compile-cache",
    language: "python",
    title: "Pre-compiling regex for reuse",
    tag: "snippet",
    code: `import re
from functools import lru_cache

@lru_cache(maxsize=128)
def get_pattern(expr: str) -> re.Pattern:
    return re.compile(expr)

def matches(text: str, expr: str) -> bool:
    return bool(get_pattern(expr).search(text))`,
    explanation: "`re.compile` has an internal LRU cache (size 512), but an explicit `lru_cache` wrapper lets you control the cache size and eviction policy independently."
  },
  {
    id: "py-b15-b5-struct-format-endian",
    language: "python",
    title: "struct byte order prefixes",
    tag: "snippet",
    code: `import struct

value = 0x01020304
le = struct.pack("<I", value)
be = struct.pack(">I", value)
native = struct.pack("=I", value)

print(le.hex())     # 04030201
print(be.hex())     # 01020304
print(len(native))  # 4`,
    explanation: "`<` = little-endian, `>` = big-endian, `!` = network (big-endian), `=` = native byte order. Always specify order explicitly in protocol code to avoid platform differences."
  },
  {
    id: "py-b15-b5-hashlib-pbkdf2",
    language: "python",
    title: "Password hashing with pbkdf2_hmac",
    tag: "snippet",
    code: `import hashlib
import os

def hash_password(password: str) -> tuple[bytes, bytes]:
    salt = os.urandom(32)
    key = hashlib.pbkdf2_hmac(
        "sha256", password.encode(), salt,
        iterations=600_000,
    )
    return salt, key

def verify_password(password: str, salt: bytes, key: bytes) -> bool:
    check = hashlib.pbkdf2_hmac(
        "sha256", password.encode(), salt, iterations=600_000
    )
    return hmac.compare_digest(check, key)

import hmac`,
    explanation: "PBKDF2 with 600,000 SHA-256 iterations matches OWASP 2024 recommendations. `os.urandom(32)` provides a cryptographically random salt."
  },
  {
    id: "py-b15-b5-secrets-otp",
    language: "python",
    title: "Time-based OTP (TOTP) principles",
    tag: "snippet",
    code: `import hmac
import hashlib
import struct
import time

def hotp(secret: bytes, counter: int) -> int:
    msg = struct.pack(">Q", counter)
    h = hmac.new(secret, msg, hashlib.sha1).digest()
    offset = h[-1] & 0x0F
    code = struct.unpack(">I", h[offset:offset+4])[0] & 0x7FFFFFFF
    return code % 1_000_000

def totp(secret: bytes, interval: int = 30) -> int:
    return hotp(secret, int(time.time()) // interval)`,
    explanation: "TOTP (RFC 6238) applies HMAC-SHA1 to a time-based counter. The dynamic truncation extracts a 4-byte slice using the last nibble as the offset."
  },
  {
    id: "py-b15-b5-contextvars-token-reset",
    language: "python",
    title: "contextvars token for nested context isolation",
    tag: "snippet",
    code: `from contextvars import ContextVar

user: ContextVar[str] = ContextVar("user", default="anonymous")

def as_user(name: str):
    from contextlib import contextmanager
    @contextmanager
    def ctx():
        token = user.set(name)
        try:
            yield
        finally:
            user.reset(token)
    return ctx()

with as_user("alice"):
    print(user.get())  # alice
    with as_user("bob"):
        print(user.get())  # bob
    print(user.get())  # alice (restored)`,
    explanation: "`reset(token)` restores the exact value that existed before the `set` call — supporting correct nesting without needing to know the previous value."
  },
  {
    id: "py-b15-b5-walrus-file-parse",
    language: "python",
    title: "Walrus in configuration file parsing",
    tag: "snippet",
    code: `import re

def parse_ini(lines: list[str]) -> dict:
    result: dict = {}
    section = ""
    for line in lines:
        line = line.strip()
        if m := re.match(r"\\[(.+)\\]", line):
            section = m.group(1)
            result[section] = {}
        elif (m := re.match(r"(\\w+)\\s*=\\s*(.+)", line)) and section:
            result[section][m.group(1)] = m.group(2)
    return result`,
    explanation: "Walrus in sequential `if`/`elif` lets each branch both test and capture its match without separate variables or repeated `re.match` calls."
  },
  {
    id: "py-b15-b5-match-value-capture",
    language: "python",
    title: "match/case value pattern gotcha",
    tag: "caveats",
    code: `from enum import Enum

class Color(Enum):
    RED = 1

def check(c):
    match c:
        case Color.RED:        # ✓ value pattern (dotted name)
            return "red"
        case x:                # ✗ capture pattern (binds to x)
            return f"other: {x}"

# Bare name in case is ALWAYS a capture, not a value lookup!`,
    explanation: "A bare name like `case RED` is a capture pattern that matches anything and binds to `RED`. Use dotted names (`case Color.RED`) or literals for value matching."
  },
  {
    id: "py-b15-b5-dataclass-eq-hash",
    language: "python",
    title: "dataclass eq/hash interaction",
    tag: "caveats",
    code: `from dataclasses import dataclass

@dataclass
class Point:
    x: float; y: float

# eq=True (default) → __hash__ set to None (unhashable)
try:
    {Point(1, 2)}  # TypeError: unhashable type
except TypeError as e:
    print(e)

@dataclass(frozen=True)
class FrozenPoint:
    x: float; y: float

{FrozenPoint(1, 2)}  # ok`,
    explanation: "When `eq=True` (default), Python sets `__hash__ = None` because mutable objects shouldn't be hashable. Use `frozen=True` or `unsafe_hash=True` to get a hash."
  },
  {
    id: "py-b15-b5-protocol-runtime-methods",
    language: "python",
    title: "Protocol checking only method presence",
    tag: "caveats",
    code: `from typing import Protocol, runtime_checkable

@runtime_checkable
class Adder(Protocol):
    def add(self, a: int, b: int) -> int: ...

class BadAdder:
    def add(self, x, y):  # wrong signature, but same name
        return "nope"

print(isinstance(BadAdder(), Adder))  # True — only checks name!`,
    explanation: "`runtime_checkable` isinstance checks only verify method *presence*, not signatures. A class with the right method name satisfies the check even with wrong parameter types."
  },
  {
    id: "py-b15-b5-itertools-zip-longest",
    language: "python",
    title: "itertools.zip_longest for uneven sequences",
    tag: "snippet",
    code: `from itertools import zip_longest

a = [1, 2, 3, 4, 5]
b = ["a", "b", "c"]

for pair in zip_longest(a, b, fillvalue=None):
    print(pair)
# (1, 'a') (2, 'b') (3, 'c') (4, None) (5, None)`,
    explanation: "`zip_longest` continues until the longest iterable is exhausted, filling shorter ones with `fillvalue`. Plain `zip` stops at the shortest."
  },
  {
    id: "py-b15-b5-contextmanager-patch-dict",
    language: "python",
    title: "unittest.mock.patch.dict for env vars",
    tag: "snippet",
    code: `import os
from unittest.mock import patch

def get_env() -> dict:
    return {"db": os.environ.get("DB_URL", ""), "debug": os.environ.get("DEBUG", "0")}

with patch.dict(os.environ, {"DB_URL": "sqlite:///test.db", "DEBUG": "1"}):
    cfg = get_env()
    print(cfg)

print(os.environ.get("DB_URL", "not set"))  # not set — restored`,
    explanation: "`patch.dict` modifies a mapping for the duration of the block and restores it on exit. The second argument is merged into the dict; existing keys are preserved unless overridden."
  },
  {
    id: "py-b15-b5-async-condition",
    language: "python",
    title: "asyncio.Condition for producer-consumer signaling",
    tag: "snippet",
    code: `import asyncio

buffer: list[int] = []
condition = asyncio.Condition()

async def producer():
    async with condition:
        for i in range(3):
            buffer.append(i)
        condition.notify_all()

async def consumer():
    async with condition:
        await condition.wait_for(lambda: len(buffer) == 3)
        print("Consumed:", buffer)`,
    explanation: "`Condition.wait_for` re-checks the predicate after each notification, guarding against spurious wakeups. The condition must be acquired before waiting."
  },
  {
    id: "py-b15-b5-descriptor-property-alias",
    language: "python",
    title: "Descriptor as property alias",
    tag: "structures",
    code: `class Alias:
    def __init__(self, source: str):
        self.source = source

    def __get__(self, obj, objtype=None):
        if obj is None: return self
        return getattr(obj, self.source)

    def __set__(self, obj, value):
        setattr(obj, self.source, value)

class Person:
    def __init__(self, first: str, last: str):
        self.first_name = first
        self.last_name = last
    name = Alias("first_name")`,
    explanation: "An `Alias` descriptor forwards reads and writes to another attribute — useful for backwards-compatible renames without breaking existing code."
  },
  {
    id: "py-b15-b5-metaclass-final",
    language: "python",
    title: "Metaclass enforcing @final semantics",
    tag: "classes",
    code: `class FinalMeta(type):
    _finals: set[type] = set()

    def __new__(mcs, name, bases, ns):
        for base in bases:
            if base in mcs._finals:
                raise TypeError(f"Cannot subclass final class {base.__name__}")
        cls = super().__new__(mcs, name, bases, ns)
        if ns.get("__final__"):
            mcs._finals.add(cls)
        return cls

class Base(metaclass=FinalMeta): pass

class Leaf(Base):
    __final__ = True

# class Sub(Leaf): pass  # raises TypeError`,
    explanation: "Setting `__final__ = True` on a class registers it in the metaclass's set of final classes. Subclassing it raises `TypeError` at class creation time."
  },
  {
    id: "py-b15-b5-abc-generic",
    language: "python",
    title: "Generic ABC for typed containers",
    tag: "classes",
    code: `from abc import ABC, abstractmethod
from typing import TypeVar, Generic, Iterator

T = TypeVar("T")

class Collection(ABC, Generic[T]):
    @abstractmethod
    def add(self, item: T) -> None: ...

    @abstractmethod
    def __iter__(self) -> Iterator[T]: ...

    def to_list(self) -> list[T]:
        return list(self)

class Stack(Collection[T]):
    def __init__(self): self._data: list[T] = []
    def add(self, item): self._data.append(item)
    def __iter__(self): return iter(self._data)`,
    explanation: "Combining `ABC` with `Generic[T]` creates a typed abstract collection. Concrete subclasses specify the element type, making `to_list` fully typed."
  },
  {
    id: "py-b15-b5-typing-get-overloads",
    language: "python",
    title: "typing.get_overloads for introspection",
    tag: "types",
    code: `from typing import overload, get_overloads

@overload
def process(x: int) -> int: ...
@overload
def process(x: str) -> str: ...

def process(x):
    return x

overloads = get_overloads(process)
print(len(overloads))  # 2
print([o.__annotations__ for o in overloads])`,
    explanation: "`get_overloads` (Python 3.11+) returns the registered overload signatures of a function — useful for generating documentation or validation logic from type annotations."
  },
  {
    id: "py-b15-b5-pathlib-temp",
    language: "python",
    title: "tempfile with pathlib",
    tag: "snippet",
    code: `import tempfile
from pathlib import Path

with tempfile.TemporaryDirectory() as tmpdir:
    tmp = Path(tmpdir)
    config = tmp / "config.json"
    config.write_text('{"key": "value"}', encoding="utf-8")
    data = config.read_text(encoding="utf-8")
    print(data)
# Directory and all contents deleted on exit`,
    explanation: "`TemporaryDirectory` as a context manager creates and cleans up a temp dir. Wrapping it in `Path` enables fluent path operations."
  },
  {
    id: "py-b15-b5-subprocess-detach",
    language: "python",
    title: "subprocess detached daemon process",
    tag: "snippet",
    code: `import subprocess
import os

proc = subprocess.Popen(
    ["python3", "-c", "import time; time.sleep(60)"],
    start_new_session=True,
    stdin=subprocess.DEVNULL,
    stdout=subprocess.DEVNULL,
    stderr=subprocess.DEVNULL,
)
print(f"Daemon PID: {proc.pid}")
# Parent can exit; daemon continues running`,
    explanation: "`start_new_session=True` calls `setsid()`, detaching the child from the parent's process group. Redirecting stdio to `DEVNULL` prevents pipe inheritance issues."
  },
  {
    id: "py-b15-b5-logging-queue",
    language: "python",
    title: "QueueHandler for async logging",
    tag: "snippet",
    code: `import logging
import logging.handlers
import queue

log_queue: queue.Queue = queue.Queue()
queue_handler = logging.handlers.QueueHandler(log_queue)

root = logging.getLogger()
root.addHandler(queue_handler)

listener = logging.handlers.QueueListener(
    log_queue,
    logging.StreamHandler(),
    respect_handler_level=True,
)
listener.start()
root.info("Async log message")
listener.stop()`,
    explanation: "`QueueHandler` puts records on a queue (non-blocking); `QueueListener` dequeues and emits them in a background thread — preventing I/O from blocking the main thread."
  },
  {
    id: "py-b15-b5-re-atomic-groups",
    language: "python",
    title: "Possessive quantifiers in regex (3.11+)",
    tag: "snippet",
    code: `import re

# Atomic group prevents catastrophic backtracking:
# Pattern: (?>a+)b  — in Python 3.11+ atomic groups via (?>...)
text = "aaaaaab"
p = re.compile(r"(?>a+)b")
print(bool(p.match(text)))   # True

# Without atomic group, a+ can backtrack:
slow = re.compile(r"(a+)+b")
print(bool(slow.match("aaaaaac")))  # False but may be slow`,
    explanation: "Atomic groups `(?>...)` (Python 3.11+) prevent the regex engine from backtracking into them, eliminating catastrophic backtracking on certain patterns."
  },
  {
    id: "py-b15-b5-walrus-type-narrow",
    language: "python",
    title: "Walrus operator with isinstance narrowing",
    tag: "snippet",
    code: `from typing import Any

def describe(value: Any) -> str:
    if isinstance(value, str) and (stripped := value.strip()):
        return f"non-empty string: {stripped!r}"
    elif isinstance(value, (int, float)) and (n := abs(value)) > 0:
        return f"non-zero number: {n}"
    return "empty or zero"`,
    explanation: "Walrus works inside compound `and` conditions — the second clause only executes (and binds) if the first `isinstance` check succeeds."
  },
  {
    id: "py-b15-b5-match-deep-unpack",
    language: "python",
    title: "Deeply nested match/case pattern",
    tag: "snippet",
    code: `def handle(msg: dict) -> str:
    match msg:
        case {
            "event": "order",
            "data": {"items": [{"sku": str(sku)}, *_], "total": float(total)}
        } if total > 100:
            return f"high-value order: first sku={sku}, total={total}"
        case {"event": "order", "data": {"total": float(total)}}:
            return f"order: total={total}"
        case _:
            return "other"`,
    explanation: "Patterns compose — a mapping pattern can contain a sequence pattern which contains a class pattern. Each level narrows the structure and binds variables."
  },
  {
    id: "py-b15-b5-dataclass-field-metadata",
    language: "python",
    title: "dataclass field with metadata",
    tag: "snippet",
    code: `from dataclasses import dataclass, field, fields

@dataclass
class Schema:
    name: str = field(metadata={"max_length": 100, "index": True})
    age: int = field(default=0, metadata={"min": 0, "max": 150})

for f in fields(Schema):
    print(f.name, f.metadata)`,
    explanation: "`field(metadata=...)` stores an immutable mapping accessible via `fields()`. Libraries like marshmallow or SQLAlchemy use this to read schema hints at runtime."
  },
  {
    id: "py-b15-b5-protocol-async-context",
    language: "python",
    title: "Protocol for async context managers",
    tag: "types",
    code: `from typing import Protocol, TypeVar

T_co = TypeVar("T_co", covariant=True)

class AsyncContextManager(Protocol[T_co]):
    async def __aenter__(self) -> T_co: ...
    async def __aexit__(self, *args) -> bool | None: ...

async def use(cm: AsyncContextManager[str]) -> str:
    async with cm as val:
        return val`,
    explanation: "A Protocol for async context managers enables structural typing — any class with `__aenter__` and `__aexit__` satisfies it, regardless of inheritance."
  },
  {
    id: "py-b15-b5-itertools-merge-sorted",
    language: "python",
    title: "heapq.merge for k-way sorted merge",
    tag: "snippet",
    code: `import heapq

def merge_sorted(*iterables):
    return list(heapq.merge(*iterables))

a = [1, 4, 7, 10]
b = [2, 3, 8, 11]
c = [5, 6, 9, 12]

merged = merge_sorted(a, b, c)
print(merged)`,
    explanation: "`heapq.merge` lazily merges multiple sorted iterables in O(n log k) time — more efficient than concatenating and sorting for pre-sorted inputs."
  },
  {
    id: "py-b15-b5-contextmanager-closing",
    language: "python",
    title: "contextlib.closing for non-context-manager cleanup",
    tag: "snippet",
    code: `from contextlib import closing
import urllib.request

url = "https://python.org"
with closing(urllib.request.urlopen(url)) as response:
    data = response.read(200)
    print(len(data))`,
    explanation: "`closing` wraps any object with a `close()` method and calls it on exit. It provides `with` statement support without requiring the object to implement `__exit__`."
  },
  {
    id: "py-b15-b5-async-create-task",
    language: "python",
    title: "asyncio.create_task for fire-and-forget",
    tag: "snippet",
    code: `import asyncio
import weakref

_background_tasks: set = set()

def run_background(coro):
    task = asyncio.create_task(coro)
    _background_tasks.add(task)
    task.add_done_callback(_background_tasks.discard)
    return task

async def cleanup(): await asyncio.sleep(0.1)
async def main(): run_background(cleanup())`,
    explanation: "Storing tasks in a set prevents them from being GC'd before completion. The done callback removes the reference automatically when the task finishes."
  },
  {
    id: "py-b15-b5-descriptor-init-var",
    language: "python",
    title: "dataclass InitVar for setup-only parameters",
    tag: "structures",
    code: `from dataclasses import dataclass, InitVar

@dataclass
class HashedPassword:
    raw: InitVar[str]
    hash: str = ""

    def __post_init__(self, raw: str):
        import hashlib
        self.hash = hashlib.sha256(raw.encode()).hexdigest()

pw = HashedPassword("secret123")
print(pw.hash[:16])  # truncated hash
# 'raw' is NOT stored as a field`,
    explanation: "`InitVar[T]` parameters are passed to `__post_init__` but not stored as fields. They appear in the constructor but not in `repr`, `eq`, or serialization."
  },
  {
    id: "py-b15-b5-metaclass-method-transform",
    language: "python",
    title: "Metaclass transforming class body methods",
    tag: "classes",
    code: `import functools

class TimedMeta(type):
    def __new__(mcs, name, bases, ns):
        for key, val in list(ns.items()):
            if callable(val) and not key.startswith("_"):
                ns[key] = mcs._timed(val)
        return super().__new__(mcs, name, bases, ns)

    @staticmethod
    def _timed(fn):
        import time
        @functools.wraps(fn)
        def wrapper(*a, **kw):
            t = time.perf_counter()
            result = fn(*a, **kw)
            print(f"{fn.__name__}: {time.perf_counter()-t:.4f}s")
            return result
        return wrapper`,
    explanation: "The metaclass wraps all public methods before `type.__new__` creates the class, providing automatic timing without decorators on each method."
  },
  {
    id: "py-b15-b5-abc-iter-abstract",
    language: "python",
    title: "ABC for iterable containers",
    tag: "classes",
    code: `from abc import ABC, abstractmethod
from typing import Iterator, TypeVar

T = TypeVar("T")

class Container(ABC):
    @abstractmethod
    def __iter__(self) -> Iterator: ...

    @abstractmethod
    def __len__(self) -> int: ...

    def __contains__(self, item) -> bool:
        return any(x == item for x in self)

    def is_empty(self) -> bool:
        return len(self) == 0`,
    explanation: "`__contains__` and `is_empty` are implemented in terms of `__iter__` and `__len__` — concrete classes get them for free once they implement the abstract methods."
  },
  {
    id: "py-b15-b5-typing-typevar-tuple",
    language: "python",
    title: "TypeVarTuple for variadic generics (PEP 646)",
    tag: "types",
    code: `from typing import TypeVarTuple, Unpack

Ts = TypeVarTuple("Ts")

def broadcast(fn, *args: Unpack[Ts]) -> tuple[Unpack[Ts]]:
    return args

result = broadcast(int, 1, "hello", 3.14)
print(result)  # (1, 'hello', 3.14)`,
    explanation: "`TypeVarTuple` (PEP 646, Python 3.11+) captures arbitrary positional type sequences. With `Unpack`, it enables variadic generic typing for tuple-shaped APIs."
  },
  {
    id: "py-b15-b5-pathlib-json",
    language: "python",
    title: "pathlib for JSON config loading",
    tag: "snippet",
    code: `from pathlib import Path
import json

def load_config(path: str | Path = "config.json") -> dict:
    p = Path(path)
    if not p.exists():
        return {}
    return json.loads(p.read_text(encoding="utf-8"))

def save_config(cfg: dict, path: str | Path = "config.json") -> None:
    Path(path).write_text(
        json.dumps(cfg, indent=2),
        encoding="utf-8",
    )`,
    explanation: "`read_text`/`write_text` handle file I/O in one call. Accepting `str | Path` gives callers flexibility without extra conversion in the function body."
  },
  {
    id: "py-b15-b5-subprocess-async",
    language: "python",
    title: "asyncio.create_subprocess for async processes",
    tag: "snippet",
    code: `import asyncio

async def run_command(cmd: str) -> tuple[str, str, int]:
    proc = await asyncio.create_subprocess_shell(
        cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    stdout, stderr = await proc.communicate()
    return stdout.decode(), stderr.decode(), proc.returncode

async def main():
    out, err, code = await run_command("echo hello")
    print(f"exit={code}: {out.strip()}")`,
    explanation: "`create_subprocess_shell` runs a command asynchronously. `communicate` awaits completion and returns stdout/stderr as bytes, preventing pipe buffer deadlocks."
  },
  {
    id: "py-b15-b5-logging-multiprocessing",
    language: "python",
    title: "Safe logging in multiprocessing",
    tag: "snippet",
    code: `import logging
import multiprocessing as mp
import logging.handlers

def worker(log_queue):
    handler = logging.handlers.QueueHandler(log_queue)
    logger = logging.getLogger()
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)
    logger.info(f"Worker PID: {mp.current_process().pid}")

if __name__ == "__main__":
    log_queue = mp.Queue()
    listener = logging.handlers.QueueListener(log_queue, logging.StreamHandler())
    listener.start()
    p = mp.Process(target=worker, args=(log_queue,))
    p.start(); p.join(); listener.stop()`,
    explanation: "Direct logging across processes is not thread-safe. Each worker uses a `QueueHandler` to send records to the main process; the `QueueListener` handles actual I/O."
  },
  {
    id: "py-b15-b5-re-subn",
    language: "python",
    title: "re.subn counting replacements",
    tag: "snippet",
    code: `import re

text = "foo bar foo baz foo"
result, count = re.subn(r"foo", "qux", text)
print(result)  # qux bar qux baz qux
print(count)   # 3

# With limit:
limited, cnt = re.subn(r"foo", "qux", text, count=2)
print(limited)  # qux bar qux baz foo
print(cnt)      # 2`,
    explanation: "`subn` returns both the modified string and the number of substitutions made — equivalent to `sub` but useful when you need to know if anything changed."
  },
  {
    id: "py-b15-b5-walrus-dict-comprehension",
    language: "python",
    title: "Walrus in dictionary comprehension filter",
    tag: "snippet",
    code: `import re

records = [
    {"name": "Alice-2026", "score": 95},
    {"name": "Bob", "score": 87},
    {"name": "Carol-2025", "score": 92},
]

pattern = re.compile(r"(.+)-(\\d{4})")
named = {
    m.group(1): rec["score"]
    for rec in records
    if (m := pattern.match(rec["name"]))
}
print(named)  # {'Alice': 95, 'Carol': 92}`,
    explanation: "The walrus in the dict-comprehension `if` clause lets the output expression reference the bound match object `m` without calling `re.match` twice."
  },
  {
    id: "py-b15-b5-match-type-pattern",
    language: "python",
    title: "match/case type narrowing with isinstance",
    tag: "snippet",
    code: `def process(value: int | str | list) -> str:
    match value:
        case int(n) if n > 0:
            return f"positive int: {n}"
        case int(n):
            return f"non-positive int: {n}"
        case str(s):
            return f"string: {s!r}"
        case list(items):
            return f"list of {len(items)}"`,
    explanation: "Class patterns like `int(n)` both check the type (`isinstance(value, int)`) and bind the value to `n`. They replace `isinstance` chains with structural clarity."
  },
  {
    id: "py-b15-b5-dataclass-abstract",
    language: "python",
    title: "Abstract dataclass base with concrete subclasses",
    tag: "structures",
    code: `from abc import ABC, abstractmethod
from dataclasses import dataclass

@dataclass
class Shape(ABC):
    color: str = "black"

    @abstractmethod
    def area(self) -> float: ...

@dataclass
class Circle(Shape):
    radius: float = 1.0

    def area(self) -> float:
        return 3.14159 * self.radius ** 2

c = Circle(color="red", radius=5.0)
print(c.area())`,
    explanation: "Combining `@dataclass` and `ABC` works — the dataclass machinery generates `__init__` while ABC enforces the abstract method contract. Subclasses inherit parent fields."
  },
  {
    id: "py-b15-b5-protocol-generic-invariant",
    language: "python",
    title: "Invariant Protocol for read-write containers",
    tag: "types",
    code: `from typing import Protocol, TypeVar

T = TypeVar("T")  # invariant

class ReadWrite(Protocol[T]):
    def get(self) -> T: ...
    def set(self, value: T) -> None: ...

class Box:
    def __init__(self, v): self._v = v
    def get(self): return self._v
    def set(self, v): self._v = v

def swap(a: ReadWrite[int], b: ReadWrite[int]) -> None:
    tmp = a.get(); a.set(b.get()); b.set(tmp)`,
    explanation: "When a Protocol has both `get` (producer) and `set` (consumer) methods for the same `T`, it must be invariant — neither covariant nor contravariant."
  },
  {
    id: "py-b15-b5-itertools-count",
    language: "python",
    title: "itertools.count for infinite integer sequences",
    tag: "snippet",
    code: `from itertools import count, takewhile

# Odd numbers starting from 1
odds = takewhile(lambda x: x < 20, (n for n in count(1, 2)))
print(list(odds))  # [1, 3, 5, 7, 9, 11, 13, 15, 17, 19]

# Generate unique IDs
import itertools
id_gen = itertools.count(1000)
ids = [next(id_gen) for _ in range(3)]
print(ids)  # [1000, 1001, 1002]`,
    explanation: "`count(start, step)` generates an arithmetic sequence indefinitely. `takewhile` provides a stopping condition without materializing the infinite sequence."
  },
  {
    id: "py-b15-b5-contextmanager-suppress-exc",
    language: "python",
    title: "contextlib.suppress vs try/except pass",
    tag: "snippet",
    code: `from contextlib import suppress
import json

def parse_json_safe(text: str) -> dict | None:
    with suppress(json.JSONDecodeError, ValueError):
        return json.loads(text)
    return None

print(parse_json_safe('{"key": 1}'))  # {'key': 1}
print(parse_json_safe("not json"))    # None`,
    explanation: "`suppress` is clearer than `try/except: pass` because the suppressed exceptions are visible at the call site. It also handles multiple exception types cleanly."
  },
  {
    id: "py-b15-b5-async-timeout-cancel",
    language: "python",
    title: "asyncio.timeout vs CancelledError",
    tag: "snippet",
    code: `import asyncio

async def slow_operation() -> str:
    await asyncio.sleep(10)
    return "done"

async def main():
    try:
        async with asyncio.timeout(1.0):
            result = await slow_operation()
    except TimeoutError:
        print("Timed out")

asyncio.run(main())`,
    explanation: "`asyncio.timeout` (Python 3.11+) raises `TimeoutError` (not `CancelledError`) when the deadline expires, making timeout handling distinct from explicit task cancellation."
  },
  {
    id: "py-b15-b5-descriptor-inherit",
    language: "python",
    title: "Descriptor inheritance in class hierarchies",
    tag: "structures",
    code: `class Validated:
    def __set_name__(self, owner, name):
        self.name = name

    def __get__(self, obj, objtype=None):
        if obj is None: return self
        return obj.__dict__.get(self.name)

    def __set__(self, obj, value):
        self.validate(value)
        obj.__dict__[self.name] = value

    def validate(self, value): pass

class PositiveInt(Validated):
    def validate(self, value):
        if not isinstance(value, int) or value <= 0:
            raise ValueError(f"Expected positive int, got {value!r}")`,
    explanation: "Subclassing the descriptor and overriding `validate` creates specialized validators without duplicating the get/set boilerplate — a clean extension point."
  },
  {
    id: "py-b15-b5-metaclass-hook",
    language: "python",
    title: "__init_subclass__ as lightweight metaclass alternative",
    tag: "classes",
    code: `class Plugin:
    _registry: dict[str, type] = {}

    def __init_subclass__(cls, *, name: str | None = None, **kwargs):
        super().__init_subclass__(**kwargs)
        key = name or cls.__name__.lower()
        Plugin._registry[key] = cls

class CSVPlugin(Plugin, name="csv"): pass
class JSONPlugin(Plugin): pass

print(Plugin._registry)
# {'csv': CSVPlugin, 'jsonplugin': JSONPlugin}`,
    explanation: "`__init_subclass__` is called when a subclass is created — a simpler alternative to metaclasses for registration and hook patterns that don't need `__new__` control."
  },
  {
    id: "py-b15-b5-abc-abstract-static",
    language: "python",
    title: "Abstract static method in ABC",
    tag: "classes",
    code: `from abc import ABC, abstractmethod

class Codec(ABC):
    @staticmethod
    @abstractmethod
    def encode(data: bytes) -> str: ...

    @staticmethod
    @abstractmethod
    def decode(text: str) -> bytes: ...

class Base64Codec(Codec):
    @staticmethod
    def encode(data: bytes) -> str:
        import base64; return base64.b64encode(data).decode()

    @staticmethod
    def decode(text: str) -> bytes:
        import base64; return base64.b64decode(text)`,
    explanation: "Stacking `@staticmethod` over `@abstractmethod` requires subclasses to implement a static method. The ABC machinery enforces this at instantiation time."
  },
  {
    id: "py-b15-b5-typevar-bound-protocol",
    language: "python",
    title: "TypeVar bound to Protocol",
    tag: "types",
    code: `from typing import Protocol, TypeVar

class Named(Protocol):
    @property
    def name(self) -> str: ...

N = TypeVar("N", bound=Named)

def get_names(items: list[N]) -> list[str]:
    return [item.name for item in items]

from dataclasses import dataclass

@dataclass
class User:
    name: str
    id: int

print(get_names([User("Alice", 1), User("Bob", 2)]))`,
    explanation: "Bounding a TypeVar to a Protocol constrains the generic function to types with the required structural interface — without the items needing to subclass `Named`."
  },
  {
    id: "py-b15-b5-pathlib-copy",
    language: "python",
    title: "Copying files with pathlib and shutil",
    tag: "snippet",
    code: `from pathlib import Path
import shutil

src = Path("source.txt")
dst = Path("backup/source.txt")

dst.parent.mkdir(parents=True, exist_ok=True)
shutil.copy2(src, dst)  # copies file + metadata

# Move (rename across filesystems):
shutil.move(str(src), str(dst.parent / "moved.txt"))`,
    explanation: "`shutil.copy2` copies file content and metadata (timestamps, permissions). `pathlib` handles directory creation; `shutil.move` handles cross-filesystem moves."
  },
  {
    id: "py-b15-b5-subprocess-stdin-pipe",
    language: "python",
    title: "subprocess with stdin from Python string",
    tag: "snippet",
    code: `import subprocess

code = """
import sys
for line in sys.stdin:
    print(line.upper(), end='')
"""
result = subprocess.run(
    ["python3", "-c", code],
    input="hello\\nworld\\n",
    capture_output=True,
    text=True,
)
print(result.stdout)  # HELLO\\nWORLD\\n`,
    explanation: "`input=` provides a string to the subprocess's stdin via a pipe. Combined with `capture_output=True`, it's the cleanest way to test stdin-reading scripts."
  },
  {
    id: "py-b15-b5-logging-once",
    language: "python",
    title: "Logging each unique warning only once",
    tag: "snippet",
    code: `import logging
import warnings

def warn_once(msg: str, category=UserWarning) -> None:
    warnings.warn(msg, category, stacklevel=2)

# Or using logger:
_warned: set[str] = set()

def log_once(logger, msg: str) -> None:
    if msg not in _warned:
        _warned.add(msg)
        logger.warning(msg)`,
    explanation: "`warnings.warn` with the default filter emits each unique (message, category, location) combination only once. For logger-based dedup, a module-level set tracks seen messages."
  },
  {
    id: "py-b15-b5-re-backreference",
    language: "python",
    title: "Backreferences for repeated word detection",
    tag: "snippet",
    code: `import re

pattern = re.compile(r"\\b(\\w+)\\s+\\1\\b", re.IGNORECASE)
texts = [
    "the the quick brown fox",
    "this is is a test",
    "no repetition here",
]
for text in texts:
    m = pattern.search(text)
    if m:
        print(f"Repeated word: {m.group(1)!r}")`,
    explanation: "Backreference `\\1` matches the exact text captured by group 1. `\\b` ensures word boundary matching so `thesis` doesn't match `is`."
  },
  {
    id: "py-b15-b5-walrus-perf",
    language: "python",
    title: "Walrus avoiding expensive method calls",
    tag: "snippet",
    code: `import re

def extract_version(text: str) -> str | None:
    if m := re.search(r"version (\\d+\\.\\d+\\.\\d+)", text, re.IGNORECASE):
        return m.group(1)
    return None

texts = ["Version 1.2.3 released", "No version info"]
for t in texts:
    if version := extract_version(t):
        print(f"Found: {version}")`,
    explanation: "The walrus calls `extract_version` once and provides the result in both the test and the body — no double call, no `_v` placeholder variable."
  },
  {
    id: "py-b15-b5-match-as-alias",
    language: "python",
    title: "match/case with 'as' for complex patterns",
    tag: "snippet",
    code: `from dataclasses import dataclass

@dataclass
class Node:
    value: int
    children: list["Node"]

def find_single_child(node: Node) -> Node | None:
    match node:
        case Node(children=[single] as child_list) as n:
            print(f"Node {n.value} has one child")
            return single
        case _:
            return None`,
    explanation: "`as` can appear at multiple levels — both the whole pattern and inner sub-patterns can bind names simultaneously. `child_list` binds the single-element list."
  },
  {
    id: "py-b15-b5-dataclass-converter",
    language: "python",
    title: "dataclass with auto-coercion via __post_init__",
    tag: "structures",
    code: `from dataclasses import dataclass
from decimal import Decimal

@dataclass
class Price:
    amount: Decimal
    currency: str = "USD"

    def __post_init__(self):
        if not isinstance(self.amount, Decimal):
            object.__setattr__(self, "amount", Decimal(str(self.amount)))
        self.currency = self.currency.upper()

p = Price(9.99)
print(type(p.amount), p.amount)  # Decimal 9.99`,
    explanation: "Coercing in `__post_init__` handles callers who pass floats or ints. `object.__setattr__` is needed for frozen dataclasses to bypass the `FrozenInstanceError`."
  },
];
