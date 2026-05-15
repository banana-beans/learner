import type { Snippet } from "./types";

export const pythonSnippets20260515B3: Snippet[] = [
  {
    id: "py-b15-b3-walrus-while-chunk",
    language: "python",
    title: "Walrus operator: read file in chunks",
    tag: "snippet",
    code: `with open("data.bin", "rb") as f:
    while chunk := f.read(4096):
        process(chunk)`,
    explanation: "The walrus operator assigns and tests in one expression, eliminating a separate assignment before the while condition."
  },
  {
    id: "py-b15-b3-match-or-pattern",
    language: "python",
    title: "match/case OR pattern",
    tag: "snippet",
    code: `def describe(status: int) -> str:
    match status:
        case 200 | 201 | 204:
            return "success"
        case 400 | 422:
            return "client error"
        case 500 | 502 | 503:
            return "server error"
        case _:
            return "unknown"`,
    explanation: "The `|` operator in a case pattern matches any of the listed values, replacing multiple `if x in (...)` checks."
  },
  {
    id: "py-b15-b3-dataclass-post-init",
    language: "python",
    title: "dataclass __post_init__ validation",
    tag: "snippet",
    code: `from dataclasses import dataclass

@dataclass
class Temperature:
    celsius: float

    def __post_init__(self) -> None:
        if self.celsius < -273.15:
            raise ValueError("Below absolute zero")`,
    explanation: "`__post_init__` runs after the generated `__init__`, providing a hook for validation without losing the convenience of dataclass field declaration."
  },
  {
    id: "py-b15-b3-protocol-callable",
    language: "python",
    title: "Protocol with __call__",
    tag: "types",
    code: `from typing import Protocol

class Transformer(Protocol):
    def __call__(self, value: str) -> str: ...

def apply(t: Transformer, data: list[str]) -> list[str]:
    return [t(item) for item in data]

result = apply(str.upper, ["hello", "world"])`,
    explanation: "A Protocol with `__call__` describes any callable matching that signature — functions, lambdas, or objects with `__call__` all satisfy it structurally."
  },
  {
    id: "py-b15-b3-typeddict-total-false",
    language: "python",
    title: "TypedDict with total=False",
    tag: "types",
    code: `from typing import TypedDict

class Options(TypedDict, total=False):
    timeout: float
    retries: int
    verbose: bool

def connect(url: str, opts: Options = {}) -> None:
    timeout = opts.get("timeout", 30.0)
    print(f"Connecting with timeout={timeout}")`,
    explanation: "`total=False` makes all keys optional, suitable for configuration dicts where any combination of keys is valid."
  },
  {
    id: "py-b15-b3-itertools-pairwise",
    language: "python",
    title: "itertools.pairwise for consecutive pairs",
    tag: "snippet",
    code: `from itertools import pairwise

data = [1, 4, 9, 16, 25]
diffs = [b - a for a, b in pairwise(data)]
print(diffs)  # [3, 5, 7, 9]`,
    explanation: "`pairwise` (Python 3.10+) yields overlapping pairs `(s[0],s[1]), (s[1],s[2])...` — useful for computing differences or detecting adjacent duplicates."
  },
  {
    id: "py-b15-b3-contextmanager-suppress",
    language: "python",
    title: "contextlib.suppress for selective exception handling",
    tag: "snippet",
    code: `from contextlib import suppress
import os

with suppress(FileNotFoundError):
    os.remove("temp.lock")`,
    explanation: "`suppress` creates a context manager that silently ignores the listed exceptions, replacing `try/except: pass` boilerplate."
  },
  {
    id: "py-b15-b3-async-gen-timeout",
    language: "python",
    title: "Async generator with asyncio.timeout",
    tag: "snippet",
    code: `import asyncio

async def timed_stream(items, delay=0.1):
    for item in items:
        await asyncio.sleep(delay)
        yield item

async def main():
    async with asyncio.timeout(1.0):
        async for val in timed_stream(range(5)):
            print(val)`,
    explanation: "`asyncio.timeout` (3.11+) wraps any async block with a deadline, raising `TimeoutError` if it exceeds the limit."
  },
  {
    id: "py-b15-b3-descriptor-cached",
    language: "python",
    title: "Descriptor implementing cached property",
    tag: "structures",
    code: `class CachedProperty:
    def __init__(self, func):
        self.func = func
        self.attrname = None

    def __set_name__(self, owner, name):
        self.attrname = f"_cached_{name}"

    def __get__(self, obj, objtype=None):
        if obj is None:
            return self
        if not hasattr(obj, self.attrname):
            setattr(obj, self.attrname, self.func(obj))
        return getattr(obj, self.attrname)`,
    explanation: "A descriptor that caches the result on the instance using a private attribute, demonstrating `__set_name__` for automatic attribute discovery."
  },
  {
    id: "py-b15-b3-metaclass-singleton",
    language: "python",
    title: "Singleton via metaclass",
    tag: "classes",
    code: `class SingletonMeta(type):
    _instances: dict = {}

    def __call__(cls, *args, **kwargs):
        if cls not in cls._instances:
            cls._instances[cls] = super().__call__(*args, **kwargs)
        return cls._instances[cls]

class Config(metaclass=SingletonMeta):
    def __init__(self):
        self.debug = False`,
    explanation: "Overriding `__call__` in the metaclass intercepts instantiation before `__new__` and `__init__`, making it the cleanest place to enforce the singleton pattern."
  },
  {
    id: "py-b15-b3-abc-abstract-property",
    language: "python",
    title: "Abstract property with ABC",
    tag: "classes",
    code: `from abc import ABC, abstractmethod

class Shape(ABC):
    @property
    @abstractmethod
    def area(self) -> float: ...

class Circle(Shape):
    def __init__(self, r: float):
        self.r = r

    @property
    def area(self) -> float:
        return 3.14159 * self.r ** 2`,
    explanation: "Combining `@property` with `@abstractmethod` forces subclasses to implement the property — forgetting it raises `TypeError` at instantiation time."
  },
  {
    id: "py-b15-b3-self-type-fluent",
    language: "python",
    title: "Self type for fluent builder",
    tag: "types",
    code: `from typing import Self

class QueryBuilder:
    def __init__(self) -> None:
        self._filters: list[str] = []

    def where(self, condition: str) -> Self:
        self._filters.append(condition)
        return self

    def build(self) -> str:
        return " AND ".join(self._filters)`,
    explanation: "`Self` (Python 3.11+) returns the exact subclass type, so subclasses of `QueryBuilder` that override `where` will still type-check correctly in chains."
  },
  {
    id: "py-b15-b3-final-var",
    language: "python",
    title: "Final variables with typing.Final",
    tag: "types",
    code: `from typing import Final

MAX_CONNECTIONS: Final = 100
API_VERSION: Final[str] = "v2"

class Config:
    DEBUG: Final = False`,
    explanation: "`Final` tells type checkers the value must not be reassigned. It's checked statically — no runtime enforcement — but makes intent explicit."
  },
  {
    id: "py-b15-b3-never-exhaustive",
    language: "python",
    title: "Never for exhaustive match checking",
    tag: "types",
    code: `from typing import Never

def assert_never(value: Never) -> Never:
    raise AssertionError(f"Unexpected value: {value}")

def handle(event: str) -> str:
    if event == "start":
        return "started"
    elif event == "stop":
        return "stopped"
    return assert_never(event)  # type: ignore[arg-type]`,
    explanation: "`Never` (formerly `NoReturn` in exhaustiveness context) signals a code path that should never be reached, turning runtime gaps into static type errors."
  },
  {
    id: "py-b15-b3-paramspec-decorator",
    language: "python",
    title: "ParamSpec preserving function signature",
    tag: "types",
    code: `from typing import Callable, TypeVar
from typing import ParamSpec

P = ParamSpec("P")
R = TypeVar("R")

def retry(fn: Callable[P, R]) -> Callable[P, R]:
    def wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
        for _ in range(3):
            try:
                return fn(*args, **kwargs)
            except Exception:
                pass
        return fn(*args, **kwargs)
    return wrapper`,
    explanation: "`ParamSpec` captures the parameter specification of the wrapped function, so the returned wrapper is typed with identical parameters — no `*args: Any` leak."
  },
  {
    id: "py-b15-b3-typeguard-isinstance",
    language: "python",
    title: "TypeGuard for custom type narrowing",
    tag: "types",
    code: `from typing import TypeGuard

def is_list_of_str(val: list) -> TypeGuard[list[str]]:
    return all(isinstance(x, str) for x in val)

def process(data: list) -> None:
    if is_list_of_str(data):
        print(data[0].upper())  # data is list[str] here`,
    explanation: "`TypeGuard[T]` as a return type tells the type checker that if the function returns `True`, the argument is narrowed to `T`."
  },
  {
    id: "py-b15-b3-literal-overload",
    language: "python",
    title: "Literal type in overloads",
    tag: "types",
    code: `from typing import Literal, overload

@overload
def fetch(mode: Literal["json"]) -> dict: ...
@overload
def fetch(mode: Literal["text"]) -> str: ...

def fetch(mode):
    if mode == "json":
        return {"key": "value"}
    return "raw text"`,
    explanation: "Combining `@overload` with `Literal` lets callers get a precise return type based on the exact string they pass — no `Union` in the result."
  },
  {
    id: "py-b15-b3-newtype-validation",
    language: "python",
    title: "NewType for domain primitives",
    tag: "types",
    code: `from typing import NewType

UserId = NewType("UserId", int)
OrderId = NewType("OrderId", int)

def get_user(user_id: UserId) -> dict:
    return {"id": user_id}

uid = UserId(42)
oid = OrderId(42)
get_user(uid)    # ok
# get_user(oid)  # type error`,
    explanation: "`NewType` creates a distinct type at the type-checker level with zero runtime cost, preventing accidental mixing of semantically different integer IDs."
  },
  {
    id: "py-b15-b3-annotated-validator",
    language: "python",
    title: "Annotated with metadata for validators",
    tag: "types",
    code: `from typing import Annotated, get_type_hints

class Gt:
    def __init__(self, value): self.value = value

Age = Annotated[int, Gt(0)]
Score = Annotated[float, Gt(0.0)]

def validate(tp, val):
    _, *meta = tp.__metadata__ if hasattr(tp, "__metadata__") else (None,)
    for m in meta:
        if isinstance(m, Gt) and val <= m.value:
            raise ValueError(f"{val} not > {m.value}")
    return val`,
    explanation: "`Annotated[T, metadata]` embeds arbitrary metadata alongside a type. Libraries like Pydantic use this to attach validation rules directly to type annotations."
  },
  {
    id: "py-b15-b3-pathlib-glob",
    language: "python",
    title: "pathlib recursive glob",
    tag: "snippet",
    code: `from pathlib import Path

src = Path("src")
py_files = sorted(src.rglob("*.py"))
for f in py_files:
    print(f.relative_to(src))`,
    explanation: "`rglob` recursively matches a pattern under a directory. `relative_to` strips the base, giving tidy relative paths in output."
  },
  {
    id: "py-b15-b3-subprocess-capture",
    language: "python",
    title: "subprocess.run capturing output",
    tag: "snippet",
    code: `import subprocess

result = subprocess.run(
    ["git", "log", "--oneline", "-5"],
    capture_output=True,
    text=True,
    check=True,
)
print(result.stdout)`,
    explanation: "`capture_output=True` is shorthand for `stdout=PIPE, stderr=PIPE`. `text=True` decodes bytes automatically. `check=True` raises on non-zero exit."
  },
  {
    id: "py-b15-b3-logging-structured",
    language: "python",
    title: "Structured logging with extra fields",
    tag: "snippet",
    code: `import logging

logger = logging.getLogger(__name__)

def handle_request(request_id: str) -> None:
    logger.info(
        "Processing request",
        extra={"request_id": request_id, "service": "api"},
    )`,
    explanation: "The `extra` parameter injects key/value pairs into the `LogRecord`, making them accessible to formatters that output structured JSON logs."
  },
  {
    id: "py-b15-b3-re-named-groups",
    language: "python",
    title: "Regex named capture groups",
    tag: "snippet",
    code: `import re

pattern = re.compile(
    r"(?P<year>\\d{4})-(?P<month>\\d{2})-(?P<day>\\d{2})"
)
m = pattern.match("2026-05-15")
if m:
    print(m.group("year"), m.group("month"), m.group("day"))`,
    explanation: "Named groups `(?P<name>...)` make match objects self-documenting — access by name instead of fragile positional indices."
  },
  {
    id: "py-b15-b3-struct-pack-unpack",
    language: "python",
    title: "struct.pack / unpack for binary data",
    tag: "snippet",
    code: `import struct

header = struct.pack(">HHI", 1, 2, 1024)
print(len(header))  # 8

version, flags, size = struct.unpack(">HHI", header)
print(version, flags, size)  # 1 2 1024`,
    explanation: "`>` specifies big-endian byte order. Format characters `H` (unsigned short) and `I` (unsigned int) control field sizes for binary protocol encoding."
  },
  {
    id: "py-b15-b3-hashlib-hmac",
    language: "python",
    title: "HMAC authentication with hashlib",
    tag: "snippet",
    code: `import hmac
import hashlib

key = b"secret-key"
message = b"payload data"

sig = hmac.new(key, message, hashlib.sha256).hexdigest()
print(sig)

def verify(key, message, sig):
    expected = hmac.new(key, message, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, sig)`,
    explanation: "`hmac.compare_digest` performs constant-time comparison, preventing timing attacks that would be possible with a plain `==` check on the hex strings."
  },
  {
    id: "py-b15-b3-secrets-token",
    language: "python",
    title: "secrets module for secure tokens",
    tag: "snippet",
    code: `import secrets

token = secrets.token_urlsafe(32)
print(token)

hex_token = secrets.token_hex(16)
print(hex_token)

pin = secrets.randbelow(10000)
print(f"{pin:04d}")`,
    explanation: "`secrets` uses the OS CSPRNG (not `random`) to generate tokens suitable for password reset links, session identifiers, and OTPs."
  },
  {
    id: "py-b15-b3-contextvars-request",
    language: "python",
    title: "contextvars for per-request state",
    tag: "snippet",
    code: `from contextvars import ContextVar
import asyncio

request_id: ContextVar[str] = ContextVar("request_id", default="unknown")

async def handle(rid: str) -> None:
    token = request_id.set(rid)
    await process()
    request_id.reset(token)

async def process() -> None:
    print(f"Handling {request_id.get()}")`,
    explanation: "`ContextVar` provides task-local storage in async code. `set` returns a token so you can `reset` to the previous value, avoiding leaks across requests."
  },
  {
    id: "py-b15-b3-walrus-regex-match",
    language: "python",
    title: "Walrus operator with regex match",
    tag: "snippet",
    code: `import re

lines = ["ERROR: disk full", "INFO: started", "WARN: low memory"]

for line in lines:
    if m := re.search(r"(ERROR|WARN): (.+)", line):
        print(f"[{m.group(1)}] {m.group(2)}")`,
    explanation: "Assigning and testing the match result in the `if` condition eliminates the two-step `m = re.search(...); if m:` pattern."
  },
  {
    id: "py-b15-b3-match-guard",
    language: "python",
    title: "match/case with guard conditions",
    tag: "snippet",
    code: `def classify(point: tuple[int, int]) -> str:
    match point:
        case (x, y) if x == y:
            return "diagonal"
        case (x, y) if x == 0 or y == 0:
            return "axis"
        case (x, y) if x > 0 and y > 0:
            return "quadrant I"
        case _:
            return "other"`,
    explanation: "Guards are `if` clauses appended to patterns. The case matches only if the pattern matches AND the guard evaluates true."
  },
  {
    id: "py-b15-b3-dataclass-field-factory",
    language: "python",
    title: "dataclass field with default_factory",
    tag: "snippet",
    code: `from dataclasses import dataclass, field

@dataclass
class Graph:
    nodes: list[str] = field(default_factory=list)
    edges: dict[str, list[str]] = field(default_factory=dict)

    def add_node(self, n: str) -> None:
        self.nodes.append(n)`,
    explanation: "`default_factory` provides a callable to create a fresh mutable default per instance, avoiding the classic mutable-default-argument bug."
  },
  {
    id: "py-b15-b3-protocol-runtime-checkable",
    language: "python",
    title: "runtime_checkable Protocol",
    tag: "types",
    code: `from typing import Protocol, runtime_checkable

@runtime_checkable
class Sized(Protocol):
    def __len__(self) -> int: ...

print(isinstance([1, 2, 3], Sized))   # True
print(isinstance("hello", Sized))     # True
print(isinstance(42, Sized))          # False`,
    explanation: "`@runtime_checkable` enables `isinstance` checks against a Protocol, but only verifies method presence — not signatures. Use sparingly; structural typing is primarily static."
  },
  {
    id: "py-b15-b3-itertools-batched",
    language: "python",
    title: "itertools.batched for chunked processing",
    tag: "snippet",
    code: `from itertools import batched

data = list(range(10))
for batch in batched(data, 3):
    print(batch)
# (0, 1, 2)
# (3, 4, 5)
# (6, 7, 8)
# (9,)`,
    explanation: "`batched` (Python 3.12+) yields non-overlapping tuples of size `n`. The last batch may be smaller if the input doesn't divide evenly."
  },
  {
    id: "py-b15-b3-contextmanager-transaction",
    language: "python",
    title: "contextmanager for transaction rollback",
    tag: "snippet",
    code: `from contextlib import contextmanager

@contextmanager
def transaction(conn):
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise`,
    explanation: "The generator-based context manager commits on clean exit and rolls back on exception. Re-raising preserves the original traceback for callers."
  },
  {
    id: "py-b15-b3-async-gen-pipeline",
    language: "python",
    title: "Chained async generators as pipeline",
    tag: "snippet",
    code: `import asyncio

async def produce(n):
    for i in range(n):
        await asyncio.sleep(0)
        yield i

async def transform(src):
    async for x in src:
        yield x * 2

async def main():
    async for val in transform(produce(5)):
        print(val)`,
    explanation: "Async generators compose naturally — `transform` wraps `produce` without buffering all values, maintaining the lazy pull-based model."
  },
  {
    id: "py-b15-b3-descriptor-lazy-init",
    language: "python",
    title: "Lazy-initialized descriptor",
    tag: "structures",
    code: `class LazyAttr:
    def __set_name__(self, owner, name):
        self.name = name
        self.private = f"_{name}"

    def __get__(self, obj, objtype=None):
        if obj is None:
            return self
        if self.private not in obj.__dict__:
            obj.__dict__[self.private] = self.init(obj)
        return obj.__dict__[self.private]

    def init(self, obj):
        raise NotImplementedError`,
    explanation: "Writing to `obj.__dict__` directly bypasses the descriptor on subsequent reads (data descriptor vs. non-data descriptor precedence)."
  },
  {
    id: "py-b15-b3-metaclass-registry",
    language: "python",
    title: "Metaclass for automatic class registry",
    tag: "classes",
    code: `class PluginMeta(type):
    registry: dict[str, type] = {}

    def __new__(mcs, name, bases, ns):
        cls = super().__new__(mcs, name, bases, ns)
        if bases:
            PluginMeta.registry[name] = cls
        return cls

class Plugin(metaclass=PluginMeta): pass
class CSVPlugin(Plugin): pass
class JSONPlugin(Plugin): pass

print(PluginMeta.registry)`,
    explanation: "Checking `if bases` skips registering the base `Plugin` class itself — only concrete subclasses are added to the registry."
  },
  {
    id: "py-b15-b3-abc-mixin-logging",
    language: "python",
    title: "ABC mixin with concrete logging method",
    tag: "classes",
    code: `from abc import ABC, abstractmethod
import logging

class LoggedWorker(ABC):
    _log = logging.getLogger(__name__)

    @abstractmethod
    def work(self) -> None: ...

    def run(self) -> None:
        self._log.info("Starting %s", type(self).__name__)
        self.work()
        self._log.info("Done")`,
    explanation: "ABCs can mix abstract and concrete methods. `run` provides a template method that subclasses get for free once they implement `work`."
  },
  {
    id: "py-b15-b3-typing-overload-narrow",
    language: "python",
    title: "Overload for narrowed return types",
    tag: "types",
    code: `from typing import overload

@overload
def parse(value: int) -> int: ...
@overload
def parse(value: str) -> list[str]: ...

def parse(value):
    if isinstance(value, int):
        return value * 2
    return value.split(",")`,
    explanation: "`@overload` lets callers see the precise return type without a `Union`, keeping downstream code free of unnecessary isinstance checks."
  },
  {
    id: "py-b15-b3-pathlib-write-text",
    language: "python",
    title: "pathlib read/write text files",
    tag: "snippet",
    code: `from pathlib import Path

config = Path("config.json")
config.write_text('{"debug": true}', encoding="utf-8")

data = config.read_text(encoding="utf-8")
print(data)

config.unlink(missing_ok=True)`,
    explanation: "`write_text` and `read_text` handle open/close automatically. `missing_ok=True` on `unlink` suppresses `FileNotFoundError` — like `rm -f`."
  },
  {
    id: "py-b15-b3-subprocess-timeout",
    language: "python",
    title: "subprocess with timeout",
    tag: "snippet",
    code: `import subprocess

try:
    result = subprocess.run(
        ["sleep", "10"],
        timeout=2,
        capture_output=True,
    )
except subprocess.TimeoutExpired as e:
    print(f"Timed out after {e.timeout}s")`,
    explanation: "The `timeout` parameter raises `TimeoutExpired` and kills the child process, preventing runaway subprocesses from stalling the parent."
  },
  {
    id: "py-b15-b3-logging-filter",
    language: "python",
    title: "Custom logging Filter",
    tag: "snippet",
    code: `import logging

class SensitiveFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        record.msg = str(record.msg).replace("password=", "password=***")
        return True

logger = logging.getLogger("app")
logger.addFilter(SensitiveFilter())
logger.warning("Login failed: password=secret123")`,
    explanation: "A `Filter` subclass can mutate `LogRecord` fields before output, enabling redaction of sensitive data without changing call sites."
  },
  {
    id: "py-b15-b3-re-finditer",
    language: "python",
    title: "re.finditer for lazy match iteration",
    tag: "snippet",
    code: `import re

text = "Call 555-1234 or 800-555-9876 for support"
pattern = re.compile(r"\\d{3}-\\d{4}")

for m in pattern.finditer(text):
    print(f"Found {m.group()} at {m.start()}-{m.end()}")`,
    explanation: "`finditer` returns an iterator of match objects, avoiding building a list of all matches at once — preferred for large texts."
  },
  {
    id: "py-b15-b3-walrus-any",
    language: "python",
    title: "Walrus operator in comprehension filter",
    tag: "snippet",
    code: `import re

emails = ["user@example.com", "bad-email", "admin@corp.org"]
pattern = re.compile(r"^[\\w.]+@[\\w.]+$")

valid = [m.group() for e in emails if (m := pattern.match(e))]
print(valid)`,
    explanation: "The walrus in a list comprehension `if` clause both tests and captures the match, giving access to the match object in the output expression."
  },
  {
    id: "py-b15-b3-match-class-pattern",
    language: "python",
    title: "match/case class pattern",
    tag: "snippet",
    code: `from dataclasses import dataclass

@dataclass
class Point:
    x: float
    y: float

def describe(obj):
    match obj:
        case Point(x=0, y=0):
            return "origin"
        case Point(x=0, y=y):
            return f"y-axis at {y}"
        case Point(x=x, y=0):
            return f"x-axis at {x}"
        case Point(x=x, y=y):
            return f"({x}, {y})"`,
    explanation: "Class patterns match attributes by name. Variables in the pattern bind to the matched attribute values, unpacking the object."
  },
  {
    id: "py-b15-b3-dataclass-kw-only",
    language: "python",
    title: "dataclass with kw_only fields",
    tag: "snippet",
    code: `from dataclasses import dataclass, field

@dataclass
class Connection:
    host: str
    port: int
    timeout: float = field(default=30.0, kw_only=True)
    tls: bool = field(default=True, kw_only=True)

conn = Connection("localhost", 5432, timeout=60.0, tls=False)`,
    explanation: "`kw_only=True` marks individual fields as keyword-only, preventing positional mistakes for optional config parameters while keeping required fields positional."
  },
  {
    id: "py-b15-b3-protocol-supports-float",
    language: "python",
    title: "Protocol for numeric duck typing",
    tag: "types",
    code: `from typing import Protocol

class SupportsFloat(Protocol):
    def __float__(self) -> float: ...

def to_percent(value: SupportsFloat) -> str:
    return f"{float(value) * 100:.1f}%"

print(to_percent(0.75))
print(to_percent(3))   # int has __float__`,
    explanation: "Protocol-based duck typing accepts any object with the required method, not just registered types — `int`, `Decimal`, custom classes all work."
  },
  {
    id: "py-b15-b3-itertools-islice",
    language: "python",
    title: "itertools.islice for lazy truncation",
    tag: "snippet",
    code: `from itertools import islice, count

def fibonacci():
    a, b = 0, 1
    while True:
        yield a
        a, b = b, a + b

first_10 = list(islice(fibonacci(), 10))
print(first_10)`,
    explanation: "`islice` applies slice semantics to any iterator without materializing it — essential for working with infinite generators."
  },
  {
    id: "py-b15-b3-contextmanager-redirect",
    language: "python",
    title: "contextlib.redirect_stdout for capturing output",
    tag: "snippet",
    code: `from contextlib import redirect_stdout
import io

buffer = io.StringIO()
with redirect_stdout(buffer):
    print("Hello, captured!")

output = buffer.getvalue()
print(repr(output))  # 'Hello, captured!\\n'`,
    explanation: "`redirect_stdout` is useful in tests to capture output from code that uses `print`, avoiding monkey-patching `sys.stdout` directly."
  },
  {
    id: "py-b15-b3-async-contextmanager",
    language: "python",
    title: "Async context manager with asynccontextmanager",
    tag: "snippet",
    code: `from contextlib import asynccontextmanager
import asyncio

@asynccontextmanager
async def managed_resource(name: str):
    print(f"Acquiring {name}")
    await asyncio.sleep(0)
    try:
        yield name
    finally:
        print(f"Releasing {name}")

async def main():
    async with managed_resource("db_conn") as res:
        print(f"Using {res}")`,
    explanation: "`asynccontextmanager` wraps an async generator function, providing `async with` support without implementing `__aenter__`/`__aexit__` manually."
  },
  {
    id: "py-b15-b3-descriptor-type-check",
    language: "python",
    title: "Descriptor with type enforcement",
    tag: "structures",
    code: `class Typed:
    def __init__(self, expected_type):
        self.expected_type = expected_type

    def __set_name__(self, owner, name):
        self.name = name

    def __set__(self, obj, value):
        if not isinstance(value, self.expected_type):
            raise TypeError(f"{self.name} must be {self.expected_type}")
        obj.__dict__[self.name] = value`,
    explanation: "Storing validated values in `obj.__dict__` makes it a non-data descriptor pattern — the dict entry shadows the descriptor for future reads."
  },
  {
    id: "py-b15-b3-metaclass-abstract-enforce",
    language: "python",
    title: "Metaclass enforcing interface conventions",
    tag: "classes",
    code: `class InterfaceMeta(type):
    def __new__(mcs, name, bases, ns):
        cls = super().__new__(mcs, name, bases, ns)
        for base in bases:
            for method in getattr(base, "_required_", []):
                if method not in ns:
                    raise TypeError(f"{name} must implement {method}()")
        return cls`,
    explanation: "Unlike ABC, this metaclass checks required methods at class definition time rather than instantiation, catching implementation gaps earlier."
  },
  {
    id: "py-b15-b3-abc-class-method",
    language: "python",
    title: "Abstract classmethod in ABC",
    tag: "classes",
    code: `from abc import ABC, abstractmethod

class Serializer(ABC):
    @classmethod
    @abstractmethod
    def from_string(cls, data: str) -> "Serializer": ...

    @abstractmethod
    def to_string(self) -> str: ...

class JSONSerializer(Serializer):
    def __init__(self, data): self.data = data
    @classmethod
    def from_string(cls, data): return cls(data)
    def to_string(self): return self.data`,
    explanation: "Stacking `@classmethod` on top of `@abstractmethod` requires subclasses to implement a class method — useful for factory-style constructors."
  },
  {
    id: "py-b15-b3-typeddict-inheritance",
    language: "python",
    title: "TypedDict inheritance for extensions",
    tag: "types",
    code: `from typing import TypedDict

class Base(TypedDict):
    id: int
    name: str

class WithTimestamp(Base):
    created_at: str
    updated_at: str

record: WithTimestamp = {
    "id": 1,
    "name": "Alice",
    "created_at": "2026-01-01",
    "updated_at": "2026-05-15",
}`,
    explanation: "TypedDict supports inheritance, composing keys from parent dicts — useful for API response types that add fields at different layers."
  },
  {
    id: "py-b15-b3-pathlib-mkdir-parents",
    language: "python",
    title: "pathlib mkdir with parents",
    tag: "snippet",
    code: `from pathlib import Path

output = Path("build/reports/2026")
output.mkdir(parents=True, exist_ok=True)

(output / "summary.txt").write_text("Done", encoding="utf-8")`,
    explanation: "`parents=True` creates all intermediate directories. `exist_ok=True` suppresses the error if the directory already exists — like `mkdir -p`."
  },
  {
    id: "py-b15-b3-subprocess-pipe",
    language: "python",
    title: "subprocess piping between commands",
    tag: "snippet",
    code: `import subprocess

ps = subprocess.Popen(["ps", "aux"], stdout=subprocess.PIPE)
grep = subprocess.Popen(
    ["grep", "python"],
    stdin=ps.stdout,
    stdout=subprocess.PIPE,
    text=True,
)
ps.stdout.close()
output, _ = grep.communicate()
print(output)`,
    explanation: "Closing `ps.stdout` after passing it to `grep.stdin` allows `ps` to receive SIGPIPE if `grep` exits early, preventing deadlocks."
  },
  {
    id: "py-b15-b3-logging-dictconfig",
    language: "python",
    title: "logging.config.dictConfig for structured setup",
    tag: "snippet",
    code: `import logging.config

logging.config.dictConfig({
    "version": 1,
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "simple",
        }
    },
    "formatters": {
        "simple": {"format": "%(levelname)s %(message)s"}
    },
    "root": {"level": "INFO", "handlers": ["console"]},
})`,
    explanation: "`dictConfig` configures the entire logging system from a dict, making it easy to store config in YAML/JSON and switch environments without code changes."
  },
  {
    id: "py-b15-b3-re-sub-callback",
    language: "python",
    title: "re.sub with function replacement",
    tag: "snippet",
    code: `import re

def double_number(m: re.Match) -> str:
    return str(int(m.group()) * 2)

result = re.sub(r"\\d+", double_number, "a1 b22 c333")
print(result)  # a2 b44 c666`,
    explanation: "When `re.sub` receives a callable, it passes each match object to the function and uses the return value as the replacement string."
  },
  {
    id: "py-b15-b3-walrus-dict-update",
    language: "python",
    title: "Walrus operator avoiding double lookup",
    tag: "snippet",
    code: `cache: dict[str, int] = {}

def get_or_compute(key: str) -> int:
    if (val := cache.get(key)) is not None:
        return val
    result = expensive(key)
    cache[key] = result
    return result

def expensive(key): return len(key)`,
    explanation: "The walrus avoids calling `cache.get(key)` twice — once for the test and again for the value — reducing dict lookups in hot paths."
  },
  {
    id: "py-b15-b3-match-sequence",
    language: "python",
    title: "match/case sequence pattern",
    tag: "snippet",
    code: `def parse_command(tokens: list[str]) -> str:
    match tokens:
        case []:
            return "empty"
        case [cmd]:
            return f"command: {cmd}"
        case [cmd, *args]:
            return f"{cmd} with {len(args)} args"`,
    explanation: "Sequence patterns match lists and tuples positionally. The `*args` star pattern captures remaining elements without knowing the length."
  },
  {
    id: "py-b15-b3-dataclass-frozen",
    language: "python",
    title: "Frozen dataclass as immutable value object",
    tag: "structures",
    code: `from dataclasses import dataclass

@dataclass(frozen=True)
class Color:
    r: int
    g: int
    b: int

    def mix(self, other: "Color") -> "Color":
        return Color((self.r+other.r)//2, (self.g+other.g)//2, (self.b+other.b)//2)

red = Color(255, 0, 0)
blue = Color(0, 0, 255)`,
    explanation: "`frozen=True` generates `__hash__` (making instances usable as dict keys and in sets) and raises `FrozenInstanceError` on attribute mutation."
  },
  {
    id: "py-b15-b3-protocol-comparable",
    language: "python",
    title: "Protocol for comparable types",
    tag: "types",
    code: `from typing import Protocol, TypeVar

class Comparable(Protocol):
    def __lt__(self, other: "Comparable") -> bool: ...

CT = TypeVar("CT", bound=Comparable)

def minimum(items: list[CT]) -> CT:
    return min(items)`,
    explanation: "Binding a TypeVar to a Protocol lets you write generic algorithms that work on any type implementing the required operations."
  },
  {
    id: "py-b15-b3-itertools-chain-from-iterable",
    language: "python",
    title: "itertools.chain.from_iterable for flattening",
    tag: "snippet",
    code: `from itertools import chain

nested = [[1, 2], [3, 4], [5, 6]]
flat = list(chain.from_iterable(nested))
print(flat)  # [1, 2, 3, 4, 5, 6]`,
    explanation: "`chain.from_iterable` lazily flattens one level of nesting. It's equivalent to `chain(*nested)` but avoids unpacking all inner iterables upfront."
  },
  {
    id: "py-b15-b3-contextmanager-exitstack",
    language: "python",
    title: "ExitStack for dynamic context managers",
    tag: "snippet",
    code: `from contextlib import ExitStack

files = ["a.txt", "b.txt", "c.txt"]

with ExitStack() as stack:
    handles = [
        stack.enter_context(open(f, "w"))
        for f in files
    ]
    for i, fh in enumerate(handles):
        fh.write(f"file {i}\\n")`,
    explanation: "`ExitStack` manages a variable number of context managers. All entered contexts are cleaned up when the stack exits, regardless of how many there are."
  },
  {
    id: "py-b15-b3-async-gather-tasks",
    language: "python",
    title: "asyncio.gather for concurrent tasks",
    tag: "snippet",
    code: `import asyncio

async def fetch(url: str) -> str:
    await asyncio.sleep(0.1)
    return f"data from {url}"

async def main():
    urls = ["http://a.com", "http://b.com", "http://c.com"]
    results = await asyncio.gather(*[fetch(u) for u in urls])
    print(results)`,
    explanation: "`gather` runs all coroutines concurrently and returns their results in the same order as the input, even though completion order may differ."
  },
  {
    id: "py-b15-b3-descriptor-readonly",
    language: "python",
    title: "Read-only descriptor with __delete__",
    tag: "structures",
    code: `class ReadOnly:
    def __set_name__(self, owner, name):
        self.name = name

    def __get__(self, obj, objtype=None):
        if obj is None:
            return self
        return obj.__dict__.get(self.name)

    def __set__(self, obj, value):
        if self.name in obj.__dict__:
            raise AttributeError(f"{self.name} is read-only")
        obj.__dict__[self.name] = value`,
    explanation: "Allowing the first `__set__` (during `__init__`) but blocking subsequent ones creates an effectively immutable attribute without `@property`."
  },
  {
    id: "py-b15-b3-metaclass-interface-check",
    language: "python",
    title: "Metaclass __instancecheck__ customization",
    tag: "classes",
    code: `class InterfaceMeta(type):
    def __instancecheck__(cls, instance):
        return all(
            callable(getattr(instance, m, None))
            for m in cls._methods_
        )

class Drawable(metaclass=InterfaceMeta):
    _methods_ = ["draw", "resize"]

class Circle:
    def draw(self): pass
    def resize(self): pass

print(isinstance(Circle(), Drawable))  # True`,
    explanation: "Overriding `__instancecheck__` in the metaclass customizes `isinstance` to perform structural/duck-typing checks rather than inheritance checks."
  },
  {
    id: "py-b15-b3-abc-register",
    language: "python",
    title: "ABC.register for virtual subclasses",
    tag: "classes",
    code: `from abc import ABC

class Flyable(ABC):
    def fly(self) -> None: ...

class Duck:
    def fly(self) -> None:
        print("Flap flap")

Flyable.register(Duck)
print(issubclass(Duck, Flyable))   # True
print(isinstance(Duck(), Flyable)) # True`,
    explanation: "`register` declares a virtual subclass relationship without modifying the class — useful for third-party types you can't modify."
  },
  {
    id: "py-b15-b3-struct-calcsize",
    language: "python",
    title: "struct.calcsize for format validation",
    tag: "snippet",
    code: `import struct

fmt = "=BHHI"
size = struct.calcsize(fmt)
print(f"Format '{fmt}' takes {size} bytes")

# Unpack a buffer of exactly that size
buf = bytes(size)
values = struct.unpack(fmt, buf)
print(values)`,
    explanation: "`calcsize` returns the byte count for a format string, useful for pre-allocating buffers or validating incoming binary data before unpacking."
  },
  {
    id: "py-b15-b3-secrets-compare-digest",
    language: "python",
    title: "Constant-time string comparison",
    tag: "snippet",
    code: `import secrets

stored_token = "abc123def456"

def verify_token(provided: str) -> bool:
    return secrets.compare_digest(
        stored_token.encode(),
        provided.encode(),
    )

print(verify_token("abc123def456"))  # True
print(verify_token("wrong"))         # False`,
    explanation: "`secrets.compare_digest` (same as `hmac.compare_digest`) takes equal time regardless of where strings differ, preventing timing-based token enumeration."
  },
  {
    id: "py-b15-b3-contextvars-copy-context",
    language: "python",
    title: "contextvars.copy_context for isolation",
    tag: "snippet",
    code: `from contextvars import ContextVar, copy_context

var: ContextVar[int] = ContextVar("var", default=0)
var.set(42)

def isolated_task():
    var.set(99)
    print("inside:", var.get())

ctx = copy_context()
ctx.run(isolated_task)
print("outside:", var.get())  # still 42`,
    explanation: "`copy_context` snapshots the current context. Changes made inside `ctx.run` don't affect the outer context, enabling true isolation in thread pools or executors."
  },
  {
    id: "py-b15-b3-walrus-parse-lines",
    language: "python",
    title: "Walrus in generator expression filter",
    tag: "snippet",
    code: `def parse_int(s: str):
    try:
        return int(s)
    except ValueError:
        return None

raw = ["1", "abc", "3", "4x", "5"]
nums = [n for s in raw if (n := parse_int(s)) is not None]
print(nums)  # [1, 3, 5]`,
    explanation: "The walrus in the `if` clause calls `parse_int` once per element and uses the result in the output expression, avoiding the double-call pattern."
  },
  {
    id: "py-b15-b3-match-mapping",
    language: "python",
    title: "match/case mapping pattern",
    tag: "snippet",
    code: `def handle_event(event: dict) -> str:
    match event:
        case {"type": "click", "x": x, "y": y}:
            return f"Click at ({x}, {y})"
        case {"type": "keypress", "key": key}:
            return f"Key: {key}"
        case {"type": str(t)}:
            return f"Unknown event type: {t}"`,
    explanation: "Mapping patterns match dict-like objects by key. Extra keys are ignored unless you use `**rest`. The pattern only checks specified keys."
  },
  {
    id: "py-b15-b3-dataclass-slots",
    language: "python",
    title: "dataclass with __slots__ for memory efficiency",
    tag: "structures",
    code: `from dataclasses import dataclass

@dataclass(slots=True)
class Vector:
    x: float
    y: float
    z: float

    def magnitude(self) -> float:
        return (self.x**2 + self.y**2 + self.z**2) ** 0.5`,
    explanation: "`slots=True` (Python 3.10+) generates `__slots__` automatically, reducing per-instance memory from ~200 bytes to ~56 bytes for small dataclasses."
  },
  {
    id: "py-b15-b3-protocol-iterable",
    language: "python",
    title: "Protocol for iterable items",
    tag: "types",
    code: `from typing import Protocol, Iterator, TypeVar

T = TypeVar("T", covariant=True)

class Iterable(Protocol[T]):
    def __iter__(self) -> Iterator[T]: ...

def first(collection: Iterable[T]) -> T:
    return next(iter(collection))

print(first([1, 2, 3]))
print(first("abc"))`,
    explanation: "A generic Protocol with a covariant TypeVar describes read-only iteration contracts. `list[int]` satisfies `Iterable[int]` structurally."
  },
  {
    id: "py-b15-b3-itertools-product",
    language: "python",
    title: "itertools.product for Cartesian product",
    tag: "snippet",
    code: `from itertools import product

sizes = ["S", "M", "L"]
colors = ["red", "blue"]
styles = ["slim", "regular"]

combos = list(product(sizes, colors, styles))
print(len(combos))    # 12
print(combos[0])      # ('S', 'red', 'slim')`,
    explanation: "`product` computes the Cartesian product of iterables, equivalent to nested for-loops but lazily evaluated and more composable."
  },
  {
    id: "py-b15-b3-contextmanager-nullcontext",
    language: "python",
    title: "contextlib.nullcontext as conditional no-op",
    tag: "snippet",
    code: `from contextlib import nullcontext

def process(data, lock=None):
    ctx = lock if lock is not None else nullcontext()
    with ctx:
        return [x * 2 for x in data]`,
    explanation: "`nullcontext` makes it easy to conditionally apply a context manager without duplicating the body in both branches."
  },
  {
    id: "py-b15-b3-async-task-group",
    language: "python",
    title: "asyncio.TaskGroup for structured concurrency",
    tag: "snippet",
    code: `import asyncio

async def work(n: int) -> int:
    await asyncio.sleep(n * 0.1)
    return n * n

async def main():
    async with asyncio.TaskGroup() as tg:
        t1 = tg.create_task(work(1))
        t2 = tg.create_task(work(2))
        t3 = tg.create_task(work(3))
    print(t1.result(), t2.result(), t3.result())`,
    explanation: "`TaskGroup` (Python 3.11+) ensures all tasks complete before the block exits and propagates exceptions, unlike `gather` which can swallow errors."
  },
  {
    id: "py-b15-b3-descriptor-compute",
    language: "python",
    title: "Computed attribute via property vs descriptor",
    tag: "structures",
    code: `class Circle:
    def __init__(self, radius: float):
        self.radius = radius

    @property
    def area(self) -> float:
        return 3.14159 * self.radius ** 2

    @property
    def circumference(self) -> float:
        return 2 * 3.14159 * self.radius`,
    explanation: "`@property` is syntactic sugar for the descriptor protocol. Prefer it over raw descriptors for per-class computed attributes."
  },
  {
    id: "py-b15-b3-metaclass-count",
    language: "python",
    title: "Metaclass tracking instance count",
    tag: "classes",
    code: `class CountedMeta(type):
    def __new__(mcs, name, bases, ns):
        cls = super().__new__(mcs, name, bases, ns)
        cls._count = 0
        original_init = cls.__init__

        def __init__(self, *args, **kwargs):
            type(self)._count += 1
            original_init(self, *args, **kwargs)

        cls.__init__ = __init__
        return cls`,
    explanation: "Wrapping `__init__` in the metaclass's `__new__` lets every subclass automatically count instances without any boilerplate in the class body."
  },
  {
    id: "py-b15-b3-abc-property-setter",
    language: "python",
    title: "Abstract property with setter",
    tag: "classes",
    code: `from abc import ABC, abstractmethod

class Gauge(ABC):
    @property
    @abstractmethod
    def value(self) -> float: ...

    @value.setter
    @abstractmethod
    def value(self, v: float) -> None: ...

class Thermometer(Gauge):
    def __init__(self): self._v = 0.0
    @property
    def value(self) -> float: return self._v
    @value.setter
    def value(self, v: float) -> None: self._v = v`,
    explanation: "To make both getter and setter abstract, define the abstract property first, then use `@<name>.setter` with `@abstractmethod` — both must be implemented."
  },
  {
    id: "py-b15-b3-typing-cast",
    language: "python",
    title: "typing.cast for type narrowing assertions",
    tag: "types",
    code: `from typing import cast

def get_config() -> object:
    return {"host": "localhost", "port": 5432}

config = cast(dict[str, object], get_config())
host = cast(str, config["host"])
print(host.upper())`,
    explanation: "`cast` is a no-op at runtime but tells the type checker to treat the value as the specified type. Use it sparingly when you have more type information than the checker can infer."
  },
  {
    id: "py-b15-b3-pathlib-stat",
    language: "python",
    title: "pathlib.stat for file metadata",
    tag: "snippet",
    code: `from pathlib import Path
import datetime

p = Path("README.md")
if p.exists():
    st = p.stat()
    mtime = datetime.datetime.fromtimestamp(st.st_mtime)
    print(f"Size: {st.st_size} bytes, Modified: {mtime}")`,
    explanation: "`stat()` returns an `os.stat_result` with file metadata. Combining it with `datetime.fromtimestamp` converts the epoch float to a readable datetime."
  },
  {
    id: "py-b15-b3-subprocess-shlex",
    language: "python",
    title: "shlex.split for safe command parsing",
    tag: "snippet",
    code: `import subprocess
import shlex

cmd = "ffmpeg -i input.mp4 -vf scale=1280:720 output.mp4"
result = subprocess.run(shlex.split(cmd), capture_output=True)`,
    explanation: "`shlex.split` parses a shell-style command string respecting quotes and escapes, producing a safe argument list for `subprocess.run`."
  },
  {
    id: "py-b15-b3-logging-lazy-eval",
    language: "python",
    title: "Lazy log evaluation with % formatting",
    tag: "snippet",
    code: `import logging

logger = logging.getLogger(__name__)

def expensive_repr(obj):
    return f"heavy({obj})"

data = [1, 2, 3]
logger.debug("Processing: %s", expensive_repr(data))`,
    explanation: "Passing `%s` args to `logger.debug` defers string formatting until the message is actually emitted — avoiding `expensive_repr` when DEBUG is disabled."
  },
  {
    id: "py-b15-b3-re-verbose",
    language: "python",
    title: "re.VERBOSE for documented patterns",
    tag: "snippet",
    code: `import re

email_pattern = re.compile(r"""
    (?P<local>[\\w.+-]+)   # local part
    @                      # literal @
    (?P<domain>[\\w-]+     # domain name
        (?:\\.[\\w-]+)+)   # one or more .extensions
""", re.VERBOSE)

m = email_pattern.match("user@example.co.uk")
print(m.group("local"), m.group("domain"))`,
    explanation: "`re.VERBOSE` ignores unescaped whitespace and `#` comments, enabling complex patterns to be written with inline documentation."
  },
  {
    id: "py-b15-b3-walrus-stream-read",
    language: "python",
    title: "Walrus operator reading until sentinel",
    tag: "snippet",
    code: `import socket

def receive_until(sock: socket.socket, sentinel: bytes) -> bytes:
    data = b""
    while (chunk := sock.recv(1024)) and sentinel not in chunk:
        data += chunk
    return data + chunk`,
    explanation: "Using walrus with `sock.recv` avoids duplicating the receive call for both the loop condition and the body — each call consumes network data."
  },
  {
    id: "py-b15-b3-match-as-pattern",
    language: "python",
    title: "match/case 'as' pattern for aliasing",
    tag: "snippet",
    code: `def process(event):
    match event:
        case {"type": "error", **rest} as full_event:
            log_error(full_event)
            return handle_error(rest)
        case {"type": str(t)} as ev:
            return dispatch(t, ev)

def log_error(e): print(e)
def handle_error(r): return r
def dispatch(t, e): return (t, e)`,
    explanation: "The `as` pattern captures the entire matched value into a variable while still applying the sub-pattern, giving access to both parts."
  },
  {
    id: "py-b15-b3-dataclass-init-false",
    language: "python",
    title: "dataclass field excluded from __init__",
    tag: "snippet",
    code: `from dataclasses import dataclass, field
import hashlib

@dataclass
class Document:
    content: str
    _hash: str = field(init=False, repr=False)

    def __post_init__(self):
        self._hash = hashlib.sha256(
            self.content.encode()
        ).hexdigest()`,
    explanation: "`init=False` excludes the field from the constructor signature. It must be set in `__post_init__` or via a default/default_factory."
  },
  {
    id: "py-b15-b3-protocol-buffer",
    language: "python",
    title: "Protocol for buffer protocol",
    tag: "types",
    code: `from typing import Protocol

class Buffer(Protocol):
    def __buffer__(self, flags: int) -> memoryview: ...

def hash_buffer(data: Buffer) -> int:
    mv = memoryview(data)
    return sum(mv.tolist()) % (2**32)`,
    explanation: "Typing the `__buffer__` protocol (Python 3.12+) allows accepting `bytes`, `bytearray`, `memoryview`, and any custom buffer object in a single type."
  },
  {
    id: "py-b15-b3-itertools-accumulate",
    language: "python",
    title: "itertools.accumulate for running totals",
    tag: "snippet",
    code: `from itertools import accumulate
import operator

data = [1, 2, 3, 4, 5]
cumsum = list(accumulate(data))
print(cumsum)  # [1, 3, 6, 10, 15]

cumprod = list(accumulate(data, operator.mul))
print(cumprod)  # [1, 2, 6, 24, 120]`,
    explanation: "`accumulate` applies a binary function cumulatively. The default is addition (running sum), but any two-argument function works — including `max` for running maximum."
  },
  {
    id: "py-b15-b3-contextmanager-async-cleanup",
    language: "python",
    title: "AsyncExitStack for dynamic async resources",
    tag: "snippet",
    code: `from contextlib import AsyncExitStack
import asyncio

async def open_resource(name):
    print(f"open {name}")
    try:
        yield name
    finally:
        print(f"close {name}")

async def main():
    async with AsyncExitStack() as stack:
        from contextlib import asynccontextmanager
        r1 = await stack.enter_async_context(
            asynccontextmanager(open_resource)("db")
        )`,
    explanation: "`AsyncExitStack` is the async equivalent of `ExitStack`, supporting both sync and async context managers in a single dynamic collection."
  },
  {
    id: "py-b15-b3-async-semaphore",
    language: "python",
    title: "asyncio.Semaphore for rate limiting",
    tag: "snippet",
    code: `import asyncio

sem = asyncio.Semaphore(3)

async def limited_task(n: int) -> int:
    async with sem:
        await asyncio.sleep(0.1)
        return n * n

async def main():
    tasks = [limited_task(i) for i in range(10)]
    results = await asyncio.gather(*tasks)
    print(results)`,
    explanation: "`Semaphore` limits concurrency to a fixed count. Using it as `async with` ensures at most 3 tasks run the critical section simultaneously."
  },
  {
    id: "py-b15-b3-descriptor-unit",
    language: "python",
    title: "Descriptor for unit conversion",
    tag: "structures",
    code: `class Celsius:
    def __set_name__(self, owner, name):
        self.name = name

    def __get__(self, obj, objtype=None):
        if obj is None: return self
        return obj.__dict__.get(self.name, 0.0)

    def __set__(self, obj, value: float):
        obj.__dict__[self.name] = float(value)

class Weather:
    temp_c = Celsius()

    @property
    def temp_f(self) -> float:
        return self.temp_c * 9/5 + 32`,
    explanation: "A descriptor for `temp_c` combined with a property for `temp_f` keeps units as derived views of the canonical celsius value."
  },
  {
    id: "py-b15-b3-metaclass-trace",
    language: "python",
    title: "Metaclass adding method tracing",
    tag: "classes",
    code: `import functools

class TracedMeta(type):
    def __new__(mcs, name, bases, ns):
        for attr, val in ns.items():
            if callable(val) and not attr.startswith("_"):
                ns[attr] = mcs._traced(val, name)
        return super().__new__(mcs, name, bases, ns)

    @staticmethod
    def _traced(fn, classname):
        @functools.wraps(fn)
        def wrapper(*args, **kwargs):
            print(f"CALL {classname}.{fn.__name__}")
            return fn(*args, **kwargs)
        return wrapper`,
    explanation: "Wrapping public methods in `__new__` before the class is created avoids modifying each method individually — useful for AOP-style cross-cutting concerns."
  },
  {
    id: "py-b15-b3-abc-concrete-override",
    language: "python",
    title: "ABC with concrete method overriding",
    tag: "classes",
    code: `from abc import ABC, abstractmethod

class Renderer(ABC):
    def render(self, items: list) -> str:
        return "\\n".join(self._format(item) for item in items)

    @abstractmethod
    def _format(self, item) -> str: ...

class HTMLRenderer(Renderer):
    def _format(self, item) -> str:
        return f"<li>{item}</li>"`,
    explanation: "The Template Method pattern: `render` defines the algorithm skeleton in the base class; subclasses only override `_format` to customize individual steps."
  },
  {
    id: "py-b15-b3-typing-get-args",
    language: "python",
    title: "typing.get_args and get_origin for introspection",
    tag: "types",
    code: `from typing import get_args, get_origin, Union, List

def describe(tp) -> str:
    origin = get_origin(tp)
    args = get_args(tp)
    if origin is Union:
        return f"Union of {[a.__name__ for a in args]}"
    if origin is list:
        return f"List[{args[0].__name__}]"
    return str(tp)

print(describe(Union[int, str]))     # Union of ['int', 'str']
print(describe(list[int]))           # List[int]`,
    explanation: "`get_origin` returns the generic alias base (e.g. `list`), and `get_args` returns the type parameters — essential for runtime type introspection in validation frameworks."
  },
  {
    id: "py-b15-b3-pathlib-iterdir",
    language: "python",
    title: "pathlib.iterdir for directory listing",
    tag: "snippet",
    code: `from pathlib import Path

def list_python_files(directory: str) -> list[Path]:
    return [
        p for p in Path(directory).iterdir()
        if p.suffix == ".py" and p.is_file()
    ]

for f in list_python_files("."):
    print(f.name)`,
    explanation: "`iterdir` yields `Path` objects for all entries in a directory. Combining `.suffix` and `.is_file()` filters without spawning a shell process."
  },
  {
    id: "py-b15-b3-subprocess-environ",
    language: "python",
    title: "subprocess with custom environment",
    tag: "snippet",
    code: `import subprocess
import os

env = {**os.environ, "MY_DEBUG": "1", "API_URL": "http://localhost"}
result = subprocess.run(
    ["python", "-c", "import os; print(os.environ['MY_DEBUG'])"],
    env=env,
    capture_output=True,
    text=True,
)
print(result.stdout)`,
    explanation: "Spreading `os.environ` and adding keys creates an augmented environment without losing PATH and system variables the child process needs."
  },
];
