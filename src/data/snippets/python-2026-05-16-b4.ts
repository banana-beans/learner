import type { Snippet } from "./types";

export const pythonSnippets20260516B4: Snippet[] = [
  {
    id: "py-b16-b4-cached-property",
    language: "python",
    title: "functools.cached_property lazy attribute",
    tag: "snippet",
    code: `from functools import cached_property

class Circle:
    def __init__(self, radius: float) -> None:
        self.radius = radius

    @cached_property
    def area(self) -> float:
        import math
        print("computing...")
        return math.pi * self.radius ** 2

c = Circle(5)
print(c.area)  # prints "computing..." then the value
print(c.area)  # returns cached value, no "computing..."`,
    explanation: "`cached_property` computes the value once on first access and stores it directly on the instance dict, bypassing the descriptor on all subsequent reads."
  },
  {
    id: "py-b16-b4-total-ordering",
    language: "python",
    title: "functools.total_ordering fills comparison methods",
    tag: "snippet",
    code: `from functools import total_ordering

@total_ordering
class Version:
    def __init__(self, major: int, minor: int) -> None:
        self.major = major
        self.minor = minor

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, Version):
            return NotImplemented
        return (self.major, self.minor) == (other.major, other.minor)

    def __lt__(self, other: "Version") -> bool:
        if not isinstance(other, Version):
            return NotImplemented
        return (self.major, self.minor) < (other.major, other.minor)

v1, v2 = Version(1, 9), Version(2, 0)
print(v1 < v2, v1 <= v2, v1 > v2, v1 >= v2)`,
    explanation: "Defining only `__eq__` and one ordering method lets `@total_ordering` derive the remaining four comparison methods, keeping the class DRY."
  },
  {
    id: "py-b16-b4-singledispatch",
    language: "python",
    title: "functools.singledispatch type-based dispatch",
    tag: "snippet",
    code: `from functools import singledispatch

@singledispatch
def process(value):
    raise TypeError(f"No handler for {type(value)}")

@process.register(int)
def _(value: int) -> str:
    return f"integer: {value * 2}"

@process.register(str)
def _(value: str) -> str:
    return f"string: {value.upper()}"

@process.register(list)
def _(value: list) -> str:
    return f"list of {len(value)} items"

print(process(42))
print(process("hello"))
print(process([1, 2, 3]))`,
    explanation: "`singledispatch` routes calls to registered implementations based on the type of the first argument, letting you add handlers without touching the base function."
  },
  {
    id: "py-b16-b4-singledispatchmethod",
    language: "python",
    title: "functools.singledispatchmethod on a class",
    tag: "snippet",
    code: `from functools import singledispatchmethod

class Formatter:
    @singledispatchmethod
    def format(self, value) -> str:
        return str(value)

    @format.register(int)
    def _(self, value: int) -> str:
        return f"{value:,}"

    @format.register(float)
    def _(self, value: float) -> str:
        return f"{value:.2f}"

    @format.register(list)
    def _(self, value: list) -> str:
        return "[" + ", ".join(self.format(v) for v in value) + "]"

f = Formatter()
print(f.format(1000000))
print(f.format(3.14159))
print(f.format([1, 2.5, 3]))`,
    explanation: "`singledispatchmethod` is the instance-method variant of `singledispatch` — it dispatches on `type(args[1])` (skipping `self`) so each handler can still access `self`."
  },
  {
    id: "py-b16-b4-redirect-stdout",
    language: "python",
    title: "contextlib.redirect_stdout captures print output",
    tag: "snippet",
    code: `import io
from contextlib import redirect_stdout

def noisy_function() -> None:
    print("step 1")
    print("step 2")
    print("done")

buffer = io.StringIO()
with redirect_stdout(buffer):
    noisy_function()

captured = buffer.getvalue()
print(repr(captured))  # 'step 1\nstep 2\ndone\n'
lines = captured.strip().splitlines()
print(lines)`,
    explanation: "`redirect_stdout` temporarily swaps `sys.stdout` to any file-like object, letting you capture printed output from third-party code you cannot modify."
  },
  {
    id: "py-b16-b4-singledispatch-resolution",
    language: "python",
    title: "singledispatch MRO resolution order",
    tag: "understanding",
    code: `from functools import singledispatch

@singledispatch
def describe(x):
    return f"object: {x!r}"

@describe.register(object)
def _(x):
    return f"registered object: {x!r}"

@describe.register(int)
def _(x: int):
    return f"int: {x}"

# bool is a subclass of int — picks int handler
print(describe(True))   # "int: True"
print(describe(3.14))   # "registered object: 3.14"
print(describe("hi"))   # "registered object: 'hi'"

# Check dispatch table
print(list(describe.registry.keys()))`,
    explanation: "`singledispatch` walks the MRO of the argument type and picks the most-specific registered implementation, so `bool` matches `int` before `object`."
  },
  {
    id: "py-b16-b4-nullcontext",
    language: "python",
    title: "contextlib.nullcontext optional context manager",
    tag: "snippet",
    code: `from contextlib import nullcontext
import threading

def process(data: list, lock: threading.Lock | None = None) -> int:
    # Use provided lock or a no-op context when no lock needed
    ctx = lock if lock is not None else nullcontext()
    with ctx:
        total = sum(data)
    return total

# Single-threaded path — no lock overhead
print(process([1, 2, 3, 4]))

# Multi-threaded path — real lock used
real_lock = threading.Lock()
print(process([1, 2, 3, 4], lock=real_lock))`,
    explanation: "`nullcontext` is a do-nothing context manager used to unify code paths where a context is sometimes required and sometimes not, avoiding `if lock:` branching."
  },
  {
    id: "py-b16-b4-mro-super",
    language: "python",
    title: "MRO and cooperative super() inheritance",
    tag: "understanding",
    code: `class A:
    def greet(self) -> str:
        return "A"

class B(A):
    def greet(self) -> str:
        return "B->" + super().greet()

class C(A):
    def greet(self) -> str:
        return "C->" + super().greet()

class D(B, C):
    def greet(self) -> str:
        return "D->" + super().greet()

d = D()
print(d.greet())       # D->B->C->A
print(D.__mro__)       # (<class 'D'>, <class 'B'>, <class 'C'>, <class 'A'>, ...)`,
    explanation: "Python's C3 linearisation ensures `super()` follows a consistent MRO so each class in the hierarchy is called exactly once even in diamond inheritance."
  },
  {
    id: "py-b16-b4-suppress",
    language: "python",
    title: "contextlib.suppress swallows specific exceptions",
    tag: "snippet",
    code: `from contextlib import suppress
import os

# Remove a file that may or may not exist
filename = "/tmp/py-b4-temp-test.txt"

# Create it first
with open(filename, "w") as f:
    f.write("hello")

with suppress(FileNotFoundError):
    os.remove(filename)

# This will silently do nothing — file already gone
with suppress(FileNotFoundError):
    os.remove(filename)

print("done without exception handling boilerplate")`,
    explanation: "`contextlib.suppress` is the idiomatic replacement for a bare `try/except/pass` block when you genuinely want to ignore a specific exception type."
  },
  {
    id: "py-b16-b4-init-subclass",
    language: "python",
    title: "__init_subclass__ receives subclass kwargs",
    tag: "understanding",
    code: `class Plugin:
    _registry: dict[str, type] = {}

    def __init_subclass__(cls, name: str = "", **kwargs: object) -> None:
        super().__init_subclass__(**kwargs)
        if name:
            Plugin._registry[name] = cls
            print(f"Registered plugin: {name!r} -> {cls.__name__}")

class AudioPlugin(Plugin, name="audio"):
    pass

class VideoPlugin(Plugin, name="video"):
    pass

class InternalHelper(Plugin):  # no name= kwarg, not registered
    pass

print(Plugin._registry)`,
    explanation: "`__init_subclass__` is called automatically on the parent whenever a subclass is defined, making it ideal for auto-registration patterns without metaclasses."
  },
  {
    id: "py-b16-b4-mock-patch-decorator",
    language: "python",
    title: "unittest.mock.patch as decorator",
    tag: "snippet",
    code: `import unittest
from unittest.mock import patch, MagicMock

class TestFileReader(unittest.TestCase):
    @patch("builtins.open")
    def test_reads_file(self, mock_open: MagicMock) -> None:
        # Configure the mock to return specific content
        mock_open.return_value.__enter__.return_value.read.return_value = "hello"

        # Import the function under test inline to get the patched open
        def read_file(path: str) -> str:
            with open(path) as f:
                return f.read()

        result = read_file("/fake/path.txt")
        mock_open.assert_called_once_with("/fake/path.txt")
        self.assertEqual(result, "hello")

if __name__ == "__main__":
    unittest.main()`,
    explanation: "`@patch` replaces the named object for the duration of the test and injects the `MagicMock` as the last positional argument before `self`, making it trivial to assert calls."
  },
  {
    id: "py-b16-b4-testcase-setup",
    language: "python",
    title: "unittest.TestCase setUp and tearDown",
    tag: "structures",
    code: `import unittest
import tempfile
import os

class TestWithTempDir(unittest.TestCase):
    def setUp(self) -> None:
        # Runs before every test method
        self.tmpdir = tempfile.mkdtemp()
        self.filepath = os.path.join(self.tmpdir, "data.txt")

    def tearDown(self) -> None:
        # Runs after every test method, even if test fails
        import shutil
        shutil.rmtree(self.tmpdir, ignore_errors=True)

    def test_write_and_read(self) -> None:
        with open(self.filepath, "w") as f:
            f.write("content")
        with open(self.filepath) as f:
            self.assertEqual(f.read(), "content")

if __name__ == "__main__":
    unittest.main()`,
    explanation: "`setUp` and `tearDown` run before and after every individual test method, ensuring each test starts with a clean, isolated environment regardless of execution order."
  },
  {
    id: "py-b16-b4-magic-mock-spec",
    language: "python",
    title: "unittest.mock.MagicMock with spec",
    tag: "snippet",
    code: `from unittest.mock import MagicMock

class Database:
    def query(self, sql: str) -> list:
        ...
    def commit(self) -> None:
        ...
    def rollback(self) -> None:
        ...

# spec= restricts mock to only real attributes/methods
mock_db = MagicMock(spec=Database)
mock_db.query.return_value = [{"id": 1, "name": "Alice"}]

result = mock_db.query("SELECT * FROM users")
print(result)  # [{'id': 1, 'name': 'Alice'}]

# Accessing a non-existent attribute raises AttributeError
try:
    mock_db.non_existent()
except AttributeError as e:
    print(f"Caught: {e}")`,
    explanation: "Passing `spec=` to `MagicMock` constrains the mock to the real class's interface, catching typos in attribute names at test time rather than silently creating new mock attributes."
  },
  {
    id: "py-b16-b4-abstract-property-setter",
    language: "python",
    title: "Abstract property with setter pattern",
    tag: "understanding",
    code: `from abc import ABC, abstractmethod

class Shape(ABC):
    @property
    @abstractmethod
    def color(self) -> str: ...

    @color.setter
    @abstractmethod
    def color(self, value: str) -> None: ...

class Square(Shape):
    def __init__(self) -> None:
        self._color = "red"

    @property
    def color(self) -> str:
        return self._color

    @color.setter
    def color(self, value: str) -> None:
        self._color = value

s = Square()
print(s.color)
s.color = "blue"
print(s.color)`,
    explanation: "To make an abstract property with a setter you must stack `@property` + `@abstractmethod` for the getter and separately stack `@<name>.setter` + `@abstractmethod` for the setter."
  },
  {
    id: "py-b16-b4-mock-patch-context",
    language: "python",
    title: "unittest.mock.patch as context manager",
    tag: "structures",
    code: `from unittest.mock import patch, MagicMock
import datetime

def get_greeting() -> str:
    hour = datetime.datetime.now().hour
    return "Good morning" if hour < 12 else "Good afternoon"

# Patch datetime.datetime inside the function's module
with patch("datetime.datetime") as mock_dt:
    mock_now = MagicMock()
    mock_now.hour = 9
    mock_dt.now.return_value = mock_now
    result = get_greeting()
    print(result)  # Good morning
    mock_dt.now.assert_called_once()`,
    explanation: "Using `patch` as a context manager is ideal for ad-hoc patches in scripts or interactive sessions where the decorator form would be awkward."
  },
  {
    id: "py-b16-b4-simple-namespace",
    language: "python",
    title: "types.SimpleNamespace as lightweight struct",
    tag: "structures",
    code: `import types

# Quick attribute bag — no class definition required
config = types.SimpleNamespace(
    host="localhost",
    port=8080,
    debug=True,
    retries=3,
)

print(config.host, config.port)

# Attributes are mutable and inspectable
config.timeout = 30
print(vars(config))

# Compare with dataclass when you need repr/eq/frozen
print(repr(config))`,
    explanation: "`SimpleNamespace` is the fastest way to create a named-attribute container without defining a class — useful for config objects, test fixtures, and return values."
  },
  {
    id: "py-b16-b4-pytest-parametrize",
    language: "python",
    title: "pytest.parametrize for data-driven tests",
    tag: "snippet",
    code: `import pytest

def fizzbuzz(n: int) -> str:
    if n % 15 == 0:
        return "FizzBuzz"
    if n % 3 == 0:
        return "Fizz"
    if n % 5 == 0:
        return "Buzz"
    return str(n)

@pytest.mark.parametrize("n,expected", [
    (1, "1"),
    (3, "Fizz"),
    (5, "Buzz"),
    (15, "FizzBuzz"),
    (7, "7"),
    (30, "FizzBuzz"),
])
def test_fizzbuzz(n: int, expected: str) -> None:
    assert fizzbuzz(n) == expected`,
    explanation: "`@pytest.mark.parametrize` runs the same test body with different inputs, producing a separate test entry in the report for each case so failures are individually identified."
  },
  {
    id: "py-b16-b4-isinstance-vs-type",
    language: "python",
    title: "isinstance vs type() strict check",
    tag: "understanding",
    code: `class Animal:
    pass

class Dog(Animal):
    pass

fido = Dog()

# isinstance: True for subclasses (usual choice)
print(isinstance(fido, Animal))  # True
print(isinstance(fido, Dog))     # True

# type(): exact type only — subclasses don't match
print(type(fido) is Dog)         # True
print(type(fido) is Animal)      # False

# Common use case: type() for dispatch tables
handler = {Dog: "woof"}
print(handler.get(type(fido)))   # "woof"`,
    explanation: "`isinstance` respects inheritance and is almost always the right choice; use `type(x) is T` only when you explicitly need to reject subclass instances."
  },
  {
    id: "py-b16-b4-mapping-proxy",
    language: "python",
    title: "types.MappingProxyType immutable dict view",
    tag: "structures",
    code: `from types import MappingProxyType

_DEFAULTS: dict[str, int] = {"timeout": 30, "retries": 3, "port": 8080}

# Expose a read-only view — callers can read but not mutate
DEFAULTS: MappingProxyType[str, int] = MappingProxyType(_DEFAULTS)

print(DEFAULTS["timeout"])  # 30
print(dict(DEFAULTS))       # full copy is fine

try:
    DEFAULTS["timeout"] = 999  # type: ignore
except TypeError as e:
    print(f"Caught: {e}")

# Original mutable dict can still be updated internally
_DEFAULTS["timeout"] = 60
print(DEFAULTS["timeout"])  # 60 — proxy reflects changes`,
    explanation: "`MappingProxyType` wraps a dict in a read-only view without copying data, useful for exposing module-level constants that internal code can still update."
  },
  {
    id: "py-b16-b4-pytest-fixture",
    language: "python",
    title: "pytest.fixture shared test resource",
    tag: "snippet",
    code: `import pytest

class Database:
    def __init__(self) -> None:
        self.records: list[dict] = []

    def insert(self, record: dict) -> None:
        self.records.append(record)

    def find(self, **kwargs: object) -> list[dict]:
        return [r for r in self.records if all(r.get(k) == v for k, v in kwargs.items())]

@pytest.fixture
def db() -> Database:
    return Database()

def test_insert_and_find(db: Database) -> None:
    db.insert({"name": "Alice", "age": 30})
    results = db.find(name="Alice")
    assert len(results) == 1
    assert results[0]["age"] == 30`,
    explanation: "Fixtures are dependency-injected by pytest — each test that names `db` in its parameters receives a fresh instance, keeping tests isolated without manual setUp code."
  },
  {
    id: "py-b16-b4-super-no-args",
    language: "python",
    title: "super() without args only works in class body",
    tag: "caveats",
    code: `class Base:
    def greet(self) -> str:
        return "Base"

class Child(Base):
    def greet(self) -> str:
        # Zero-arg super() works — compiler adds __class__ cell
        return super().greet() + "+Child"

    @staticmethod
    def broken_greet() -> str:
        # super() in a @staticmethod has no __class__ cell!
        # This raises RuntimeError: super(): no arguments
        try:
            return super().greet()  # type: ignore
        except RuntimeError as e:
            return f"Error: {e}"

c = Child()
print(c.greet())          # Base+Child
print(Child.broken_greet())  # Error: super(): no arguments`,
    explanation: "Zero-argument `super()` relies on a compiler-injected `__class__` cell variable that only exists in regular methods — static methods have no implicit class reference."
  },
  {
    id: "py-b16-b4-type-mro",
    language: "python",
    title: "type.__mro__ computation",
    tag: "understanding",
    code: `class A: pass
class B(A): pass
class C(A): pass
class D(B, C): pass
class E(D): pass

# C3 linearisation result
print(E.__mro__)
# (<class 'E'>, <class 'D'>, <class 'B'>, <class 'C'>,
#  <class 'A'>, <class 'object'>)

# Helper to just see class names
names = [cls.__name__ for cls in E.__mro__]
print(names)

# MRO is also on instances via type()
e = E()
print([c.__name__ for c in type(e).__mro__])`,
    explanation: "The MRO is a tuple computed at class creation time using C3 linearisation; reading `__mro__` directly is the fastest way to understand and debug complex inheritance hierarchies."
  },
  {
    id: "py-b16-b4-patch-object",
    language: "python",
    title: "unittest.mock.patch.object replaces a method",
    tag: "snippet",
    code: `from unittest.mock import patch, MagicMock

class EmailService:
    def send(self, to: str, subject: str, body: str) -> bool:
        # Real implementation would use SMTP
        raise NotImplementedError("Would send real email")

class UserRegistration:
    def __init__(self, email_service: EmailService) -> None:
        self.email = email_service

    def register(self, email: str) -> None:
        # ... create user in DB ...
        self.email.send(email, "Welcome!", "Thanks for joining.")

svc = EmailService()
reg = UserRegistration(svc)

with patch.object(svc, "send", return_value=True) as mock_send:
    reg.register("alice@example.com")
    mock_send.assert_called_once_with("alice@example.com", "Welcome!", "Thanks for joining.")
    print("OK")`,
    explanation: "`patch.object` replaces a method on a specific *instance* or class rather than patching via a dotted string path, which is cleaner when you already hold a reference to the object."
  },
  {
    id: "py-b16-b4-user-dict",
    language: "python",
    title: "collections.UserDict custom dict subclass",
    tag: "structures",
    code: `from collections import UserDict

class CaseInsensitiveDict(UserDict):
    """Dict with case-insensitive string keys."""

    def __setitem__(self, key: str, value: object) -> None:
        super().__setitem__(key.lower(), value)

    def __getitem__(self, key: str) -> object:
        return super().__getitem__(key.lower())

    def __contains__(self, key: object) -> bool:
        if isinstance(key, str):
            return super().__contains__(key.lower())
        return False

d = CaseInsensitiveDict({"Content-Type": "application/json"})
print(d["content-type"])  # application/json
print(d["CONTENT-TYPE"])  # application/json
d["Accept"] = "text/html"
print(dict(d))`,
    explanation: "`UserDict` wraps a real `dict` as `self.data` and is safer to subclass than `dict` directly because all mutations go through `__setitem__` consistently."
  },
  {
    id: "py-b16-b4-issubclass-chaining",
    language: "python",
    title: "issubclass chaining and tuples",
    tag: "understanding",
    code: `class Vehicle: pass
class Car(Vehicle): pass
class ElectricCar(Car): pass

print(issubclass(ElectricCar, Car))      # True
print(issubclass(ElectricCar, Vehicle))  # True (transitive)
print(issubclass(Car, ElectricCar))      # False

# Check against multiple types at once with a tuple
print(issubclass(ElectricCar, (Car, Vehicle)))  # True (first match)

# issubclass requires a class as first argument
try:
    issubclass(42, int)  # type: ignore
except TypeError as e:
    print(f"Caught: {e}")`,
    explanation: "`issubclass` is transitive and accepts a tuple of types as the second argument — it returns `True` if the class is a subclass of *any* type in the tuple."
  },
  {
    id: "py-b16-b4-pytest-raises",
    language: "python",
    title: "pytest.raises verifies exceptions",
    tag: "snippet",
    code: `import pytest

def divide(a: float, b: float) -> float:
    if b == 0:
        raise ZeroDivisionError("Cannot divide by zero")
    return a / b

def test_divide_by_zero() -> None:
    with pytest.raises(ZeroDivisionError, match="Cannot divide by zero"):
        divide(10, 0)

def test_divide_ok() -> None:
    result = divide(10, 2)
    assert result == pytest.approx(5.0)

def test_wrong_type() -> None:
    with pytest.raises(TypeError):
        divide("10", 2)  # type: ignore`,
    explanation: "`pytest.raises` is a context manager that asserts an exception is raised; the optional `match=` parameter runs a regex against the exception message for more precise assertions."
  },
  {
    id: "py-b16-b4-property-delete",
    language: "python",
    title: "property deleter removes backing attribute",
    tag: "understanding",
    code: `class Config:
    def __init__(self) -> None:
        self._debug: bool | None = None

    @property
    def debug(self) -> bool | None:
        return self._debug

    @debug.setter
    def debug(self, value: bool) -> None:
        self._debug = bool(value)

    @debug.deleter
    def debug(self) -> None:
        print("Resetting debug to None")
        self._debug = None

cfg = Config()
cfg.debug = True
print(cfg.debug)  # True
del cfg.debug
print(cfg.debug)  # None`,
    explanation: "The `@<prop>.deleter` decorator wires `del obj.attr` to a method, useful for resetting state to a default or releasing resources tied to the attribute."
  },
  {
    id: "py-b16-b4-user-list",
    language: "python",
    title: "collections.UserList custom list subclass",
    tag: "structures",
    code: `from collections import UserList

class BoundedList(UserList):
    """List that refuses more than max_size items."""

    def __init__(self, max_size: int, iterable=()) -> None:
        self.max_size = max_size
        super().__init__(iterable)

    def append(self, item: object) -> None:
        if len(self.data) >= self.max_size:
            raise OverflowError(f"List is full (max {self.max_size})")
        super().append(item)

    def insert(self, i: int, item: object) -> None:
        if len(self.data) >= self.max_size:
            raise OverflowError(f"List is full (max {self.max_size})")
        super().insert(i, item)

bl = BoundedList(3, [1, 2])
bl.append(3)
try:
    bl.append(4)
except OverflowError as e:
    print(f"Caught: {e}")`,
    explanation: "`UserList` stores items in `self.data` and routes all mutations through the regular list API, so overriding just `append` and `insert` is enough to enforce size limits."
  },
  {
    id: "py-b16-b4-hypothesis-given",
    language: "python",
    title: "hypothesis.given property-based test",
    tag: "snippet",
    code: `# Requires: pip install hypothesis
from hypothesis import given, settings
import hypothesis.strategies as st

def encode_decode(text: str) -> str:
    """Round-trip through UTF-8 bytes."""
    return text.encode("utf-8").decode("utf-8")

@given(st.text())
@settings(max_examples=200)
def test_roundtrip(s: str) -> None:
    # Property: encoding then decoding is identity
    assert encode_decode(s) == s

# Run directly for demonstration
test_roundtrip()
print("All examples passed")`,
    explanation: "Hypothesis generates hundreds of random inputs satisfying your strategy and automatically shrinks any failing case to the minimal reproducer — far more coverage than hand-written examples."
  },
  {
    id: "py-b16-b4-types-function-type",
    language: "python",
    title: "types.FunctionType and types.MethodType",
    tag: "types",
    code: `import types

def standalone(x: int) -> int:
    return x * 2

class MyClass:
    def method(self, x: int) -> int:
        return x + 1

obj = MyClass()

print(type(standalone))       # <class 'function'>
print(type(obj.method))       # <class 'method'>

# isinstance checks
print(isinstance(standalone, types.FunctionType))   # True
print(isinstance(obj.method, types.MethodType))     # True

# Unbound (class) attribute is still a function
print(isinstance(MyClass.method, types.FunctionType))  # True`,
    explanation: "A `FunctionType` becomes a `MethodType` when accessed through an instance because the descriptor protocol binds the instance as the first argument — the underlying function object is the same."
  },
  {
    id: "py-b16-b4-getattr-infinite-recursion",
    language: "python",
    title: "__getattr__ infinite recursion pitfall",
    tag: "caveats",
    code: `class BadProxy:
    def __getattr__(self, name: str) -> object:
        # BUG: self.data triggers __getattr__ again -> RecursionError
        # because 'data' is not in __dict__ yet
        return self.data[name]  # type: ignore

class GoodProxy:
    def __init__(self, data: dict) -> None:
        # Use object.__setattr__ to bypass our own __setattr__
        object.__setattr__(self, "_data", data)

    def __getattr__(self, name: str) -> object:
        # _data is in __dict__, so no recursion
        return object.__getattribute__(self, "_data")[name]

g = GoodProxy({"x": 10, "y": 20})
print(g.x)  # 10
print(g.y)  # 20`,
    explanation: "`__getattr__` is called only when normal attribute lookup fails; if it tries to access a missing attribute on `self`, it recurses infinitely — use `object.__getattribute__` to safely reach `__dict__`."
  },
  {
    id: "py-b16-b4-dis-bytecode",
    language: "python",
    title: "dis.dis inspects bytecode of a function",
    tag: "structures",
    code: `import dis

def add_and_double(a: int, b: int) -> int:
    return (a + b) * 2

print("=== Bytecode for add_and_double ===")
dis.dis(add_and_double)

# Also works on strings of code
print("\n=== Bytecode for list comprehension ===")
dis.dis("[x*x for x in range(5)]")`,
    explanation: "`dis.dis` pretty-prints the CPython bytecode instructions for any function, method, or code string — invaluable for understanding why two seemingly equivalent snippets have different performance."
  },
  {
    id: "py-b16-b4-pytest-mark-skip",
    language: "python",
    title: "pytest.mark.skip and skipif",
    tag: "snippet",
    code: `import sys
import pytest

@pytest.mark.skip(reason="not implemented yet")
def test_future_feature() -> None:
    assert False, "This should not run"

@pytest.mark.skipif(
    sys.platform == "win32",
    reason="Unix-only file permission test"
)
def test_unix_permissions() -> None:
    import os
    assert os.access("/tmp", os.W_OK)

def test_always_runs() -> None:
    assert 1 + 1 == 2

# Run with: pytest -v this_file.py
# Skipped tests show as 's' in the output`,
    explanation: "`@pytest.mark.skip` unconditionally skips a test; `@pytest.mark.skipif` evaluates a condition at collection time, making it easy to skip platform-specific or environment-specific tests."
  },
  {
    id: "py-b16-b4-subclasshook",
    language: "python",
    title: "__subclasshook__ for virtual subclasses",
    tag: "understanding",
    code: `from abc import ABC, abstractmethod

class Drawable(ABC):
    @abstractmethod
    def draw(self) -> None: ...

    @classmethod
    def __subclasshook__(cls, subclass: type) -> bool | type(NotImplemented):
        # Any class with a 'draw' method is considered a virtual subclass
        if cls is Drawable:
            if any("draw" in C.__dict__ for C in subclass.__mro__):
                return True
        return NotImplemented

class Canvas:  # Does NOT inherit from Drawable
    def draw(self) -> None:
        print("Drawing on canvas")

c = Canvas()
print(isinstance(c, Drawable))    # True — virtual subclass
print(issubclass(Canvas, Drawable))  # True`,
    explanation: "`__subclasshook__` lets an ABC declare what structural properties satisfy it, enabling duck-typed isinstance checks without requiring inheritance — the foundation of Python's protocol approach."
  },
  {
    id: "py-b16-b4-ast-parse",
    language: "python",
    title: "ast.parse builds syntax tree from source",
    tag: "structures",
    code: `import ast

source = """
def add(a, b):
    return a + b

result = add(1, 2)
"""

tree = ast.parse(source)
print(ast.dump(tree, indent=2)[:300])  # First 300 chars

# Walk all nodes
for node in ast.walk(tree):
    if isinstance(node, ast.FunctionDef):
        print(f"Function: {node.name}, args: {[a.arg for a in node.args.args]}")
    elif isinstance(node, ast.Return):
        print(f"Return node found")`,
    explanation: "`ast.parse` turns source code into an Abstract Syntax Tree you can inspect or transform — the entry point for building linters, code generators, and refactoring tools."
  },
  {
    id: "py-b16-b4-setattr-recursion",
    language: "python",
    title: "__setattr__ recursion with object.__setattr__",
    tag: "caveats",
    code: `class Validated:
    def __setattr__(self, name: str, value: object) -> None:
        if name == "age":
            if not isinstance(value, int) or value < 0:
                raise ValueError(f"age must be non-negative int, got {value!r}")
        # MUST use object.__setattr__ to avoid infinite recursion
        # Using self.name = value here would call __setattr__ again!
        object.__setattr__(self, name, value)

v = Validated()
v.age = 25
print(v.age)  # 25

try:
    v.age = -1
except ValueError as e:
    print(f"Caught: {e}")`,
    explanation: "Inside `__setattr__`, any assignment to `self` calls `__setattr__` again — always delegate to `object.__setattr__` to actually store the value without recursion."
  },
  {
    id: "py-b16-b4-abc-registration",
    language: "python",
    title: "ABC.register for virtual subclasses",
    tag: "understanding",
    code: `from abc import ABC

class Serializable(ABC):
    pass

# Register an existing class without modifying it
import json
Serializable.register(dict)
Serializable.register(list)

# Now these pass isinstance checks
print(isinstance({}, Serializable))   # True
print(isinstance([], Serializable))   # True
print(isinstance((1,), Serializable)) # False — not registered

# Check without instantiating
print(issubclass(dict, Serializable)) # True`,
    explanation: "`ABC.register()` declares a class as a virtual subclass without inheritance, letting you retrofit protocols onto third-party types you cannot modify."
  },
  {
    id: "py-b16-b4-ast-node-visitor",
    language: "python",
    title: "ast.NodeVisitor for tree traversal",
    tag: "structures",
    code: `import ast

class NameCollector(ast.NodeVisitor):
    def __init__(self) -> None:
        self.names: list[str] = []

    def visit_Name(self, node: ast.Name) -> None:
        self.names.append(node.id)
        self.generic_visit(node)  # continue into children

    def visit_FunctionDef(self, node: ast.FunctionDef) -> None:
        print(f"Entering function: {node.name}")
        self.generic_visit(node)

source = "x = y + z; print(x)"
tree = ast.parse(source)
collector = NameCollector()
collector.visit(tree)
print("Names found:", collector.names)`,
    explanation: "`NodeVisitor` dispatches to `visit_<ClassName>` for each node type; calling `generic_visit` continues the walk into children — omitting it stops traversal at that node."
  },
  {
    id: "py-b16-b4-types-module-type",
    language: "python",
    title: "types.ModuleType and dynamic modules",
    tag: "types",
    code: `import types
import sys

# Create a module object programmatically
fake_mod = types.ModuleType("mymodule", "A dynamically created module")
fake_mod.__file__ = "<dynamic>"
fake_mod.PI = 3.14159
fake_mod.greet = lambda name: f"Hello, {name}!"

# Register it so import machinery can find it
sys.modules["mymodule"] = fake_mod

import mymodule  # noqa: E402 — dynamic module
print(mymodule.PI)
print(mymodule.greet("world"))
print(isinstance(mymodule, types.ModuleType))  # True`,
    explanation: "`types.ModuleType` lets you construct fully functional module objects at runtime and inject them into `sys.modules` — useful for plugin systems and mock imports in tests."
  },
  {
    id: "py-b16-b4-mock-vs-patch-families",
    language: "python",
    title: "mock.patch vs patch.object vs patch.dict",
    tag: "families",
    code: `from unittest.mock import patch, MagicMock
import os

# 1. patch: replaces by dotted import path
with patch("os.path.exists") as mock_exists:
    mock_exists.return_value = True
    print(os.path.exists("/fake"))  # True

# 2. patch.object: replaces attribute on existing object
with patch.object(os.path, "exists", return_value=False):
    print(os.path.exists("/fake"))  # False

# 3. patch.dict: adds/overrides keys in a dict
env_override = {"MY_VAR": "test_value"}
with patch.dict(os.environ, env_override, clear=False):
    print(os.environ.get("MY_VAR"))  # test_value

print(os.environ.get("MY_VAR"))  # None — restored`,
    explanation: "Use `patch` when you only have a name, `patch.object` when you hold a reference to the object, and `patch.dict` when you need to override environment variables or registry dictionaries."
  },
  {
    id: "py-b16-b4-slots-inheritance",
    language: "python",
    title: "__slots__ inheritance rules",
    tag: "understanding",
    code: `class Base:
    __slots__ = ("x", "y")

    def __init__(self, x: int, y: int) -> None:
        self.x = x
        self.y = y

class Child(Base):
    __slots__ = ("z",)  # only declare NEW slots

    def __init__(self, x: int, y: int, z: int) -> None:
        super().__init__(x, y)
        self.z = z

c = Child(1, 2, 3)
print(c.x, c.y, c.z)
print(hasattr(c, "__dict__"))  # False — no __dict__ if all parents use __slots__

class BadChild(Base):
    pass  # no __slots__ — gains __dict__, nullifying parent's space savings

bc = BadChild(1, 2)
print(hasattr(bc, "__dict__"))  # True`,
    explanation: "When subclassing a slotted class, only declare the *additional* slots in the subclass; omitting `__slots__` in the subclass reintroduces `__dict__` and negates the memory savings."
  },
  {
    id: "py-b16-b4-dynamic-class-attr",
    language: "python",
    title: "types.DynamicClassAttribute for class/instance split",
    tag: "structures",
    code: `from types import DynamicClassAttribute

class MyEnum:
    _value = None

    @DynamicClassAttribute
    def name(self):
        """Accessed on instances returns the instance name."""
        return f"instance-{self._value}"

    @name.getter  # type: ignore
    def name(self):
        return f"instance-{self._value}"

# DynamicClassAttribute raises AttributeError on class access,
# which lets Enum's metaclass intercept it.
# Minimal demonstration:
class Demo:
    @DynamicClassAttribute
    def info(self):
        return "instance info"

d = Demo()
print(d.info)   # "instance info"
# Demo.info would raise AttributeError (caught by metaclass in Enum)`,
    explanation: "`DynamicClassAttribute` raises `AttributeError` when accessed on the class (not an instance), which `EnumMeta` exploits so `MyEnum.name` returns the enum member rather than the descriptor."
  },
  {
    id: "py-b16-b4-custom-metaclass",
    language: "python",
    title: "Custom metaclass __new__ vs __init__",
    tag: "classes",
    code: `class TracingMeta(type):
    def __new__(mcs, name: str, bases: tuple, namespace: dict, **kwargs):
        print(f"__new__: creating class {name!r}")
        cls = super().__new__(mcs, name, bases, namespace)
        cls._created_by = "TracingMeta"
        return cls

    def __init__(cls, name: str, bases: tuple, namespace: dict, **kwargs):
        print(f"__init__: initialising class {name!r}")
        super().__init__(name, bases, namespace)

class MyClass(metaclass=TracingMeta):
    pass

print(MyClass._created_by)
print(type(MyClass))`,
    explanation: "`__new__` on a metaclass creates the class object (returns it); `__init__` receives the already-created class and configures it — the same `__new__`/`__init__` split as regular objects."
  },
  {
    id: "py-b16-b4-typing-cast",
    language: "python",
    title: "typing.cast has zero runtime effect",
    tag: "types",
    code: `from typing import cast

def get_value(data: dict, key: str) -> object:
    return data[key]

data = {"count": 42, "label": "hello"}

# Type checker treats 'count' as int; runtime it's just the value
count = cast(int, get_value(data, "count"))
print(count + 1)   # 43

# cast does NOTHING at runtime — no conversion, no validation
surprise = cast(int, "not an int")
print(type(surprise))   # <class 'str'> — still a string!
print(surprise)`,
    explanation: "`typing.cast` is a type-checker hint only; at runtime it is defined as `return obj`, so it never converts, validates, or raises — always pair it with actual runtime checks if needed."
  },
  {
    id: "py-b16-b4-classmethod-abstract",
    language: "python",
    title: "@classmethod on abstract class",
    tag: "caveats",
    code: `from abc import ABC, abstractmethod

class DataSource(ABC):
    @classmethod
    @abstractmethod
    def from_config(cls, config: dict) -> "DataSource":
        """Subclasses must implement this factory."""
        ...

    @classmethod
    def description(cls) -> str:
        """Concrete classmethod on abstract class — allowed."""
        return f"DataSource subclass: {cls.__name__}"

class FileSource(DataSource):
    def __init__(self, path: str) -> None:
        self.path = path

    @classmethod
    def from_config(cls, config: dict) -> "FileSource":
        return cls(config["path"])

fs = FileSource.from_config({"path": "/data/file.csv"})
print(fs.path)
print(FileSource.description())`,
    explanation: "Stacking `@classmethod` and `@abstractmethod` forces subclasses to implement a class-level factory; concrete classmethods on the ABC itself are perfectly valid and inherited normally."
  },
  {
    id: "py-b16-b4-linecache-getline",
    language: "python",
    title: "linecache.getline fetches source lines",
    tag: "structures",
    code: `import linecache
import os

# Write a temp file to read back
tmp = "/tmp/py_b4_demo.py"
with open(tmp, "w") as f:
    f.write("# line 1\n# line 2\nx = 42\nprint(x)\n")

# getline(filename, lineno) — 1-indexed, returns "" for missing lines
line3 = linecache.getline(tmp, 3)
print(repr(line3))  # 'x = 42\n'

line99 = linecache.getline(tmp, 99)
print(repr(line99))  # ''

# Also works for loaded modules
import linecache as lc
import inspect
src_line = linecache.getline(inspect.__file__, 1)
print(src_line[:60])

os.remove(tmp)`,
    explanation: "`linecache` caches source lines in memory for fast repeated access — it's what Python's traceback machinery uses to display the offending line without re-reading the file each time."
  },
  {
    id: "py-b16-b4-generic-alias",
    language: "python",
    title: "types.GenericAlias (list[int]) at runtime",
    tag: "types",
    code: `import types

# list[int] creates a GenericAlias — available since Python 3.9
alias = list[int]
print(type(alias))        # <class 'types.GenericAlias'>
print(alias.__origin__)   # <class 'list'>
print(alias.__args__)     # (<class 'int'>,)

# Works for any subscriptable builtin
d_alias = dict[str, list[int]]
print(d_alias.__args__)   # (<class 'str'>, list[int])

# GenericAlias vs typing.List
from typing import List
print(type(List[int]))    # typing._GenericAlias — different internal type
print(isinstance(alias, types.GenericAlias))  # True`,
    explanation: "Python 3.9+ allows `list[int]` directly as a runtime type hint; the result is a `types.GenericAlias` which carries `__origin__` and `__args__` for introspection by type checkers and validators."
  },
  {
    id: "py-b16-b4-descriptor-non-data",
    language: "python",
    title: "Descriptor non-data vs data priority",
    tag: "caveats",
    code: `class NonDataDescriptor:
    """Only __get__ — instance dict takes priority."""
    def __get__(self, obj, objtype=None):
        return "from non-data descriptor"

class DataDescriptor:
    """Has __set__ — takes priority over instance dict."""
    def __get__(self, obj, objtype=None):
        return obj.__dict__.get("_val", "default")
    def __set__(self, obj, value):
        obj.__dict__["_val"] = value

class MyClass:
    nd = NonDataDescriptor()
    dd = DataDescriptor()

obj = MyClass()
print(obj.nd)              # from non-data descriptor
obj.__dict__["nd"] = "from instance dict"
print(obj.nd)              # from instance dict (wins!)

obj.dd = 42
print(obj.dd)              # 42 (data descriptor intercepts __get__)`,
    explanation: "Data descriptors (defining `__set__` or `__delete__`) take precedence over the instance `__dict__`; non-data descriptors (only `__get__`) are overridden by instance dict entries."
  },
  {
    id: "py-b16-b4-ast-node-transformer",
    language: "python",
    title: "ast.NodeTransformer rewrites a tree",
    tag: "structures",
    code: `import ast

class DoubleNumbers(ast.NodeTransformer):
    """Multiplies every numeric literal by 2."""
    def visit_Constant(self, node: ast.Constant) -> ast.AST:
        if isinstance(node.value, (int, float)):
            new_node = ast.Constant(value=node.value * 2)
            return ast.copy_location(new_node, node)
        return node

source = "x = 5 + 3"
tree = ast.parse(source)
new_tree = DoubleNumbers().visit(tree)
ast.fix_missing_locations(new_tree)

code = compile(new_tree, "<string>", "exec")
ns: dict = {}
exec(code, ns)
print(ns["x"])  # 16  (was 5+3=8, now 10+6=16)`,
    explanation: "`NodeTransformer` is like `NodeVisitor` but `visit_*` methods can return a replacement node — the core mechanism for code rewriting, macro expansion, and optimization passes."
  },
  {
    id: "py-b16-b4-type-checking-guard",
    language: "python",
    title: "typing.TYPE_CHECKING import guard",
    tag: "types",
    code: `from __future__ import annotations
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    # This import runs ONLY during static analysis, never at runtime.
    # Prevents circular imports and speeds up module load.
    from collections.abc import Sequence

class Pipeline:
    def run(self, steps: Sequence[str]) -> list[str]:
        return [s.strip() for s in steps]

# At runtime, 'Sequence' is never imported — annotations are strings
# thanks to 'from __future__ import annotations'
import inspect
hints = {}
try:
    import typing
    hints = typing.get_type_hints(Pipeline.run)
    print(hints)
except Exception as e:
    print(f"Note: {e}")

p = Pipeline()
print(p.run(["  a  ", " b "]))`,
    explanation: "`TYPE_CHECKING` is `False` at runtime but `True` when mypy/pyright analyse the code, so heavy or circular imports inside the guard are free at runtime while still providing full type information."
  },
  {
    id: "py-b16-b4-unittest-vs-pytest",
    language: "python",
    title: "unittest vs doctest vs pytest comparison",
    tag: "families",
    code: `# --- unittest style ---
import unittest

class TestCalc(unittest.TestCase):
    def test_add(self):
        self.assertEqual(1 + 1, 2)

# --- doctest style ---
def add(a: int, b: int) -> int:
    """
    >>> add(1, 2)
    3
    >>> add(-1, 1)
    0
    """
    return a + b

import doctest
results = doctest.testmod(verbose=False)
print(f"doctest: {results.attempted} tests, {results.failed} failures")

# --- pytest style (just functions + assert) ---
def test_add_pytest():
    assert add(1, 2) == 3
    assert add(-1, 1) == 0

test_add_pytest()
print("pytest-style test passed")`,
    explanation: "`unittest` requires class hierarchy; `doctest` embeds tests in docstrings; `pytest` needs no boilerplate — they coexist and pytest can run all three formats simultaneously."
  },
  {
    id: "py-b16-b4-init-subclass-super-chain",
    language: "python",
    title: "__init_subclass__ super() chain",
    tag: "caveats",
    code: `class Base:
    def __init_subclass__(cls, tag: str = "", **kwargs):
        super().__init_subclass__(**kwargs)  # MUST forward **kwargs
        cls._tag = tag
        print(f"Base.__init_subclass__: {cls.__name__} tag={tag!r}")

class Middle(Base):
    def __init_subclass__(cls, priority: int = 0, **kwargs):
        super().__init_subclass__(**kwargs)  # forwards tag= up
        cls._priority = priority
        print(f"Middle.__init_subclass__: {cls.__name__} priority={priority}")

class Leaf(Middle, tag="important", priority=5):
    pass

print(Leaf._tag, Leaf._priority)`,
    explanation: "Each `__init_subclass__` must pass `**kwargs` to `super().__init_subclass__()` so that cooperative inheritance works — missing it causes `TypeError` when the next class in the MRO also accepts kwargs."
  },
  {
    id: "py-b16-b4-runtime-checkable",
    language: "python",
    title: "typing.runtime_checkable Protocol",
    tag: "types",
    code: `from typing import Protocol, runtime_checkable

@runtime_checkable
class Drawable(Protocol):
    def draw(self) -> None: ...
    def resize(self, factor: float) -> None: ...

class Circle:
    def draw(self) -> None:
        print("O")
    def resize(self, factor: float) -> None:
        print(f"scaled by {factor}")

class Square:
    def draw(self) -> None:
        print("[]")
    # Missing resize!

c, s = Circle(), Square()
print(isinstance(c, Drawable))  # True
print(isinstance(s, Drawable))  # False — missing resize

# NOTE: only checks method existence, not signatures
print(issubclass(Circle, Drawable))  # True`,
    explanation: "`@runtime_checkable` enables `isinstance` and `issubclass` checks against a Protocol at runtime, but only verifies that the required attributes *exist* — argument types are not checked."
  },
  {
    id: "py-b16-b4-functools-wraps-missing",
    language: "python",
    title: "functools.wraps missing attributes caveat",
    tag: "caveats",
    code: `import functools

def my_decorator(func):
    # Without @wraps: func.__name__ is 'wrapper', help text is lost
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)
    return wrapper

def my_decorator_fixed(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)
    return wrapper

@my_decorator
def greet(name: str) -> str:
    """Say hello."""
    return f"Hello, {name}"

@my_decorator_fixed
def greet2(name: str) -> str:
    """Say hello."""
    return f"Hello, {name}"

print(greet.__name__)   # 'wrapper'  — broken
print(greet2.__name__)  # 'greet2'   — fixed
print(greet2.__doc__)   # 'Say hello.'`,
    explanation: "Without `@functools.wraps`, the wrapper replaces `__name__`, `__doc__`, and `__wrapped__` on the decorated function, breaking introspection tools, docs generators, and some test frameworks."
  },
  {
    id: "py-b16-b4-mixin-pattern",
    language: "python",
    title: "Mixin pattern — no __init__",
    tag: "classes",
    code: `class JsonMixin:
    """Add JSON serialisation to any class with a __dict__."""
    def to_json(self) -> str:
        import json
        return json.dumps(self.__dict__, default=str)

    @classmethod
    def from_json(cls, text: str) -> "JsonMixin":
        import json
        data = json.loads(text)
        obj = cls.__new__(cls)
        obj.__dict__.update(data)
        return obj

class LogMixin:
    """Add simple logging to any class."""
    def log(self, msg: str) -> None:
        print(f"[{type(self).__name__}] {msg}")

class User(JsonMixin, LogMixin):
    def __init__(self, name: str, age: int) -> None:
        self.name = name
        self.age = age

u = User("Alice", 30)
print(u.to_json())
u.log("created")`,
    explanation: "Mixins define reusable behaviour without owning state or `__init__` — they compose via multiple inheritance and rely on the target class to provide the instance attributes they access."
  },
  {
    id: "py-b16-b4-missing-dict",
    language: "python",
    title: "__missing__ in dict subclass",
    tag: "understanding",
    code: `class DefaultDict(dict):
    """Like collections.defaultdict but __missing__ gets the key."""

    def __init__(self, factory):
        super().__init__()
        self.factory = factory

    def __missing__(self, key: object) -> object:
        # Called by dict.__getitem__ when key is absent
        value = self.factory(key)
        self[key] = value  # cache for next access
        return value

d = DefaultDict(lambda k: f"generated-{k}")
print(d["x"])   # generated-x
print(d["y"])   # generated-y
print(d)        # {'x': 'generated-x', 'y': 'generated-y'}

# __missing__ is NOT called by .get() or 'in' checks
print(d.get("z"))    # None
print("z" in d)      # False`,
    explanation: "`__missing__` is the hook `dict.__getitem__` calls when a key is absent; it is not triggered by `.get()` or `__contains__`, which makes it ideal for transparent auto-vivification."
  },
  {
    id: "py-b16-b4-tokenize",
    language: "python",
    title: "tokenize.generate_tokens lexes Python source",
    tag: "structures",
    code: `import tokenize
import io

source = 'x = 1 + 2  # sum\nprint(x)\n'
tokens = tokenize.generate_tokens(io.StringIO(source).readline)

for tok in tokens:
    if tok.type not in (tokenize.NEWLINE, tokenize.NL, tokenize.ENCODING):
        print(f"{tokenize.tok_name[tok.type]:10} {tok.string!r}")`,
    explanation: "`tokenize.generate_tokens` produces `TokenInfo` named tuples covering type, string, start/end positions, and the source line — lower-level than `ast` but preserves comments and whitespace."
  },
  {
    id: "py-b16-b4-iscoroutinefunction",
    language: "python",
    title: "inspect.iscoroutinefunction detects async defs",
    tag: "caveats",
    code: `import inspect
import asyncio

async def fetch(url: str) -> str:
    await asyncio.sleep(0)
    return f"data from {url}"

def sync_fetch(url: str) -> str:
    return f"data from {url}"

print(inspect.iscoroutinefunction(fetch))       # True
print(inspect.iscoroutinefunction(sync_fetch))  # False

# Calling a coroutine without await produces a coroutine object
result = fetch("http://example.com")
print(type(result))  # <class 'coroutine'>
result.close()       # avoid RuntimeWarning: coroutine never awaited

# Proper usage
async def main():
    return await fetch("http://example.com")

print(asyncio.run(main()))`,
    explanation: "`inspect.iscoroutinefunction` is the correct way to detect `async def` functions at runtime — checking `asyncio.iscoroutine` on the *result* is too late and misses the intent."
  },
  {
    id: "py-b16-b4-cooperative-mi",
    language: "python",
    title: "Cooperative multiple inheritance pattern",
    tag: "classes",
    code: `class Logger:
    def __init__(self, **kwargs):
        super().__init__(**kwargs)  # forward remaining kwargs

    def log(self, msg: str) -> None:
        print(f"LOG: {msg}")

class Validator:
    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def validate(self, value: object) -> bool:
        return value is not None

class Service(Logger, Validator):
    def __init__(self, name: str, **kwargs):
        super().__init__(**kwargs)
        self.name = name

    def run(self, data: object) -> None:
        if self.validate(data):
            self.log(f"{self.name} processed {data!r}")

svc = Service(name="DataService")
svc.run("payload")`,
    explanation: "Cooperative MI requires every class to accept and forward `**kwargs` through `super().__init__()` so the full MRO chain initialises cleanly regardless of the final diamond structure."
  },
  {
    id: "py-b16-b4-staticmethod-vs-module",
    language: "python",
    title: "@staticmethod vs plain module-level function",
    tag: "caveats",
    code: `class MathUtils:
    @staticmethod
    def add(a: int, b: int) -> int:
        return a + b

    @staticmethod
    def multiply(a: int, b: int) -> int:
        return a * b

# Module-level function — identical behaviour, less boilerplate
def add(a: int, b: int) -> int:
    return a + b

# Difference: @staticmethod lives in the class namespace
print(MathUtils.add(2, 3))       # 5 — via class
print(MathUtils().add(2, 3))     # 5 — via instance (also works)

# Cannot be overridden polymorphically — that's @classmethod's job
import inspect
print(inspect.isfunction(MathUtils.__dict__["add"]))  # True`,
    explanation: "Use `@staticmethod` for utility functions that logically belong to a class (e.g., a factory helper) but don't need `cls` or `self`; prefer module-level functions when there's no conceptual ownership."
  },
  {
    id: "py-b16-b4-union-type",
    language: "python",
    title: "types.UnionType (int | str) at runtime",
    tag: "types",
    code: `import types

# Python 3.10+ union syntax creates a types.UnionType
u = int | str
print(type(u))          # <class 'types.UnionType'>
print(u.__args__)       # (<class 'int'>, <class 'str'>)

# Works with isinstance at runtime
def accept(value: int | str) -> str:
    return f"{type(value).__name__}: {value}"

print(accept(42))       # int: 42
print(accept("hello"))  # str: hello

# isinstance with | union
x = 3.14
print(isinstance(x, int | str))   # False
print(isinstance(x, int | float)) # True`,
    explanation: "The `X | Y` syntax (Python 3.10+) creates a `types.UnionType` at runtime that supports `isinstance` checks directly, replacing the need for `typing.Union` in most contexts."
  },
  {
    id: "py-b16-b4-descriptor-set-name",
    language: "python",
    title: "__set_name__ not called on instances",
    tag: "caveats",
    code: `class Typed:
    """Descriptor that validates type on assignment."""

    def __set_name__(self, owner: type, name: str) -> None:
        # Called ONCE when the class body is processed
        self.attr = f"_{name}"
        print(f"__set_name__ called: owner={owner.__name__}, name={name}")

    def __get__(self, obj, objtype=None):
        if obj is None:
            return self
        return getattr(obj, self.attr, None)

    def __set__(self, obj, value):
        setattr(obj, self.attr, value)

class Record:
    name = Typed()    # __set_name__ fires here: name='name'
    age  = Typed()    # __set_name__ fires here: name='age'

r = Record()
r.name = "Alice"
r.age = 30
print(r.name, r.age)`,
    explanation: "`__set_name__` is called by the class machinery *at class creation time* for each descriptor-valued attribute, giving the descriptor its own attribute name without a separate argument."
  },
  {
    id: "py-b16-b4-reduce-vs-accumulate",
    language: "python",
    title: "functools.reduce vs itertools.accumulate",
    tag: "families",
    code: `from functools import reduce
from itertools import accumulate
import operator

data = [1, 2, 3, 4, 5]

# reduce: collapses to single value
total = reduce(operator.add, data)
print(total)  # 15

product = reduce(operator.mul, data, 1)
print(product)  # 120

# accumulate: yields running totals (all intermediate values)
running = list(accumulate(data))
print(running)  # [1, 3, 6, 10, 15]

# accumulate supports other operations too
running_max = list(accumulate(data, max))
print(running_max)  # [1, 2, 3, 4, 5]

running_prod = list(accumulate(data, operator.mul))
print(running_prod)  # [1, 2, 6, 24, 120]`,
    explanation: "`reduce` collapses a sequence to one value; `accumulate` is a generator that yields every intermediate result — use `accumulate` when you need the running history, not just the final answer."
  },
  {
    id: "py-b16-b4-class-decorator-vs-metaclass",
    language: "python",
    title: "Class decorator vs metaclass order",
    tag: "caveats",
    code: `def add_repr(cls):
    """Class decorator: runs AFTER class body, AFTER metaclass."""
    original_init = cls.__init__

    def __repr__(self) -> str:
        attrs = ", ".join(f"{k}={v!r}" for k, v in vars(self).items())
        return f"{type(self).__name__}({attrs})"

    cls.__repr__ = __repr__
    print(f"Class decorator applied to {cls.__name__}")
    return cls

class Meta(type):
    def __new__(mcs, name, bases, ns):
        print(f"Metaclass __new__ for {name}")
        return super().__new__(mcs, name, bases, ns)

@add_repr                          # runs 2nd
class Point(metaclass=Meta):       # Meta runs 1st
    def __init__(self, x: int, y: int) -> None:
        self.x = x
        self.y = y

p = Point(3, 4)
print(p)`,
    explanation: "The metaclass processes the class body first (creating the class object); class decorators then receive the fully-formed class — so decorators can see all metaclass modifications."
  },
  {
    id: "py-b16-b4-suppress-vs-try",
    language: "python",
    title: "contextlib.suppress vs try/except/pass",
    tag: "families",
    code: `from contextlib import suppress
import json

data = '{"key": "value"}'
bad_data = "not json"

# Old style — noisy
def parse_old(text: str) -> dict | None:
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    return None

# New style — reads like English
def parse_new(text: str) -> dict | None:
    result = None
    with suppress(json.JSONDecodeError):
        result = json.loads(text)
    return result

print(parse_old(data))      # {'key': 'value'}
print(parse_old(bad_data))  # None
print(parse_new(data))      # {'key': 'value'}
print(parse_new(bad_data))  # None`,
    explanation: "`suppress` is stylistically cleaner for single-exception ignore blocks but `try/except` is mandatory when you need to inspect the exception object, log it, or handle multiple exceptions differently."
  },
  {
    id: "py-b16-b4-abstract-concrete-methods",
    language: "python",
    title: "Abstract class with concrete methods",
    tag: "classes",
    code: `from abc import ABC, abstractmethod

class Report(ABC):
    """Template Method pattern: concrete steps, abstract hooks."""

    def generate(self) -> str:
        # Concrete orchestration
        header = self._header()
        body = self._body()
        footer = self._footer()
        return f"{header}\n{body}\n{footer}"

    def _header(self) -> str:
        return "=== REPORT ==="

    def _footer(self) -> str:
        return "=== END ==="

    @abstractmethod
    def _body(self) -> str: ...

class SalesReport(Report):
    def _body(self) -> str:
        return "Sales: $1,234,567"

r = SalesReport()
print(r.generate())`,
    explanation: "ABCs can provide concrete methods (like `generate` here) that call abstract hooks — the Template Method pattern in Python, defining a skeleton algorithm with customisable steps."
  },
  {
    id: "py-b16-b4-inspect-signature",
    language: "python",
    title: "inspect.signature vs __annotations__ vs get_type_hints",
    tag: "families",
    code: `import inspect
import typing

def greet(name: str, times: int = 1) -> str:
    return (f"Hello, {name}!\n" * times).strip()

# 1. inspect.signature — includes defaults, rich Parameter objects
sig = inspect.signature(greet)
print(sig)
for name, param in sig.parameters.items():
    print(f"  {name}: annotation={param.annotation}, default={param.default}")

# 2. __annotations__ — raw dict, no defaults, unresolved strings
print(greet.__annotations__)

# 3. typing.get_type_hints — resolves string annotations + adds return
print(typing.get_type_hints(greet))`,
    explanation: "`inspect.signature` is richest (parameters + defaults + kinds); `__annotations__` is the raw dict; `typing.get_type_hints` resolves forward-reference strings and handles `from __future__ import annotations`."
  },
  {
    id: "py-b16-b4-property-in-init",
    language: "python",
    title: "property in __init__ before backing attr set",
    tag: "caveats",
    code: `class Temperature:
    @property
    def celsius(self) -> float:
        return self._celsius  # may fail if __init__ order is wrong

    @celsius.setter
    def celsius(self, value: float) -> None:
        if value < -273.15:
            raise ValueError("Below absolute zero")
        self._celsius = value

    def __init__(self, celsius: float) -> None:
        # CORRECT: assigning via the property setter
        self.celsius = celsius  # calls setter, which sets _celsius

class BadTemperature:
    @property
    def celsius(self) -> float:
        return self._celsius

    def __init__(self, celsius: float) -> None:
        pass  # forgot to set _celsius!

t = Temperature(100)
print(t.celsius)

bt = BadTemperature(100)
try:
    print(bt.celsius)  # AttributeError: _celsius not set
except AttributeError as e:
    print(f"Caught: {e}")`,
    explanation: "When a property setter validates and stores to a backing attribute, the `__init__` must assign through the property (not bypass to `_attr`) so validation runs at construction time."
  },
  {
    id: "py-b16-b4-metaclass-call-override",
    language: "python",
    title: "Metaclass __call__ override controls instantiation",
    tag: "classes",
    code: `class SingletonMeta(type):
    _instances: dict[type, object] = {}

    def __call__(cls, *args, **kwargs):
        # __call__ on the metaclass is invoked when you do MyClass(...)
        if cls not in cls._instances:
            print(f"Creating singleton for {cls.__name__}")
            instance = super().__call__(*args, **kwargs)
            cls._instances[cls] = instance
        return cls._instances[cls]

class Config(metaclass=SingletonMeta):
    def __init__(self, value: int = 0) -> None:
        self.value = value

a = Config(42)
b = Config(99)
print(a is b)       # True — same object
print(a.value)      # 42 — second call didn't re-initialise`,
    explanation: "Overriding `__call__` on a metaclass intercepts `MyClass(...)` before `__new__` and `__init__` run, making it the cleanest place to implement singleton, pooling, or caching patterns."
  },
  {
    id: "py-b16-b4-user-string",
    language: "python",
    title: "collections.UserString custom str subclass",
    tag: "structures",
    code: `from collections import UserString

class SlugString(UserString):
    """String that auto-converts to URL-safe slug on creation."""

    def __init__(self, seq: str = "") -> None:
        import re
        slug = re.sub(r"[^a-z0-9]+", "-", seq.lower()).strip("-")
        super().__init__(slug)

    def __add__(self, other: object) -> "SlugString":
        result = super().__add__(other)
        return SlugString(result.data)

s = SlugString("Hello, World! This is a Test.")
print(s)           # hello-world-this-is-a-test
print(type(s))     # <class '__main__.SlugString'>
combined = s + " Extra"
print(combined)    # hello-world-this-is-a-test-extra`,
    explanation: "`UserString` stores the data in `self.data` and is much safer to subclass than `str` because operations return instances of your subclass (if you override the right methods) rather than plain strings."
  },
  {
    id: "py-b16-b4-prepare-metaclass",
    language: "python",
    title: "__prepare__ metaclass namespace hook",
    tag: "caveats",
    code: `class OrderedMeta(type):
    @classmethod
    def __prepare__(mcs, name: str, bases: tuple, **kwargs) -> dict:
        # Return the namespace dict used while executing the class body.
        # Here we use a regular dict but could use OrderedDict or custom.
        ns = super().__prepare__(name, bases, **kwargs)
        ns["_field_order"] = []  # inject a helper list
        return ns

    def __new__(mcs, name: str, bases: tuple, namespace: dict, **kwargs):
        cls = super().__new__(mcs, name, bases, namespace)
        return cls

class Schema(metaclass=OrderedMeta):
    _field_order.append("alpha")  # type: ignore  # uses injected list
    alpha: int = 0
    _field_order.append("beta")   # type: ignore
    beta: str = ""

print(Schema._field_order)  # ['alpha', 'beta']`,
    explanation: "`__prepare__` runs *before* the class body executes and must return the mapping used as the class namespace, enabling ordered field tracking, DSL syntax, and pre-populated namespaces."
  },
  {
    id: "py-b16-b4-slots-dict-coexist",
    language: "python",
    title: "__slots__ with __dict__ coexistence",
    tag: "understanding",
    code: `class Hybrid:
    """Slotted attributes + arbitrary extra attributes via __dict__."""
    __slots__ = ("x", "y", "__dict__")

    def __init__(self, x: int, y: int) -> None:
        self.x = x
        self.y = y

h = Hybrid(1, 2)
# Slotted attributes
h.x = 10

# Extra attributes go into __dict__
h.z = 99          # allowed because __dict__ is in __slots__
h.label = "test"

print(h.x, h.y, h.z, h.label)
print(h.__dict__)  # {'z': 99, 'label': 'test'}`,
    explanation: "Including `'__dict__'` in `__slots__` allows both fast slotted attributes and arbitrary extra attributes — a middle ground between full flexibility and maximum memory efficiency."
  },
  {
    id: "py-b16-b4-descriptor-class",
    language: "python",
    title: "Descriptor with __set__ makes it a data descriptor",
    tag: "classes",
    code: `class Positive:
    """Data descriptor — intercepts get AND set."""

    def __set_name__(self, owner: type, name: str) -> None:
        self.public_name = name
        self.private_name = f"_{name}"

    def __get__(self, obj, objtype=None) -> float:
        if obj is None:
            return self  # type: ignore
        return getattr(obj, self.private_name, 0.0)

    def __set__(self, obj, value: float) -> None:
        if value <= 0:
            raise ValueError(f"{self.public_name} must be positive, got {value}")
        setattr(obj, self.private_name, float(value))

class Product:
    price = Positive()
    quantity = Positive()

    def __init__(self, price: float, quantity: float) -> None:
        self.price = price
        self.quantity = quantity

p = Product(9.99, 100)
print(p.price, p.quantity)
try:
    p.price = -1
except ValueError as e:
    print(f"Caught: {e}")`,
    explanation: "A descriptor becomes a *data* descriptor by defining `__set__` (or `__delete__`), which gives it priority over the instance `__dict__` so validation cannot be bypassed by direct dict manipulation."
  },
  {
    id: "py-b16-b4-abc-with-concrete",
    language: "python",
    title: "ABC registration and concrete mixin",
    tag: "understanding",
    code: `from abc import ABC, abstractmethod

class Animal(ABC):
    @abstractmethod
    def speak(self) -> str: ...

    def describe(self) -> str:
        # Concrete method available to all subclasses
        return f"I am a {type(self).__name__} and I say '{self.speak()}'"

class Dog(Animal):
    def speak(self) -> str:
        return "woof"

class Cat(Animal):
    def speak(self) -> str:
        return "meow"

for animal in (Dog(), Cat()):
    print(animal.describe())

# Cannot instantiate ABC directly
try:
    Animal()
except TypeError as e:
    print(f"Caught: {e}")`,
    explanation: "ABCs enforce that abstract methods are implemented while freely providing concrete methods that form reusable behaviour — the combination is Python's primary mechanism for interface + partial implementation."
  },
  {
    id: "py-b16-b4-class-creation-hooks",
    language: "python",
    title: "Class creation hooks in order",
    tag: "classes",
    code: `print("--- Script start ---")

class Meta(type):
    @classmethod
    def __prepare__(mcs, name, bases, **kwargs):
        print(f"1. Meta.__prepare__({name!r})")
        return super().__prepare__(name, bases, **kwargs)

    def __new__(mcs, name, bases, ns, **kwargs):
        print(f"2. Meta.__new__({name!r})")
        return super().__new__(mcs, name, bases, ns)

    def __init__(cls, name, bases, ns, **kwargs):
        print(f"3. Meta.__init__({name!r})")
        super().__init__(name, bases, ns)

def class_decorator(cls):
    print(f"4. class_decorator({cls.__name__!r})")
    return cls

@class_decorator
class MyClass(metaclass=Meta):
    print("   (class body executing)")`,
    explanation: "Class creation follows a strict order: `__prepare__` → class body → `__new__` → `__init__` → class decorators; knowing this order is essential when combining metaclasses with decorators."
  },
  {
    id: "py-b16-b4-init-subclass-vs-setname",
    language: "python",
    title: "__init_subclass__ vs __set_name__ vs metaclass",
    tag: "classes",
    code: `class Descriptor:
    def __set_name__(self, owner: type, name: str) -> None:
        print(f"  __set_name__: {name!r} on {owner.__name__}")
        self.name = name

class Base:
    def __init_subclass__(cls, **kwargs):
        super().__init_subclass__(**kwargs)
        print(f"  __init_subclass__: {cls.__name__}")

class Meta(type):
    def __new__(mcs, name, bases, ns, **kwargs):
        print(f"  Meta.__new__: {name}")
        return super().__new__(mcs, name, bases, ns)

print("Creating Child:")

class Child(Base, metaclass=Meta):
    field = Descriptor()  # __set_name__ fires during class body

# Order: Meta.__new__ wraps all, then __set_name__, then __init_subclass__`,
    explanation: "`__set_name__` runs during `type.__new__` as each descriptor attribute is bound; `__init_subclass__` runs after `__new__` when the parent class is notified — both before class decorators."
  },
  {
    id: "py-b16-b4-builtin-function-type",
    language: "python",
    title: "types.BuiltinFunctionType vs FunctionType",
    tag: "types",
    code: `import types

# Python-defined function
def my_func(): pass

# Built-in functions are implemented in C
print(isinstance(len, types.BuiltinFunctionType))      # True
print(isinstance(print, types.BuiltinFunctionType))    # True
print(isinstance(my_func, types.BuiltinFunctionType))  # False
print(isinstance(my_func, types.FunctionType))         # True

# Built-ins lack __code__, __globals__ etc.
print(hasattr(len, "__code__"))    # False
print(hasattr(my_func, "__code__")) # True

# Both are callable
print(callable(len))     # True
print(callable(my_func)) # True`,
    explanation: "Built-in functions like `len` and `print` are instances of `BuiltinFunctionType` (C-implemented) while `def`-defined functions are `FunctionType` — both callable, but only the latter has `__code__`."
  },
  {
    id: "py-b16-b4-delattr-vs-delattr-dunder",
    language: "python",
    title: "delattr vs __delattr__ dispatch",
    tag: "understanding",
    code: `class Guarded:
    def __init__(self) -> None:
        object.__setattr__(self, "_protected", {"x": 1, "y": 2})

    def __delattr__(self, name: str) -> None:
        if name.startswith("_"):
            raise AttributeError(f"Cannot delete protected attribute {name!r}")
        # Delegate to normal deletion
        object.__delattr__(self, name)

g = Guarded()
g.public = "hello"
print(g.public)

delattr(g, "public")  # calls __delattr__("public") -> allowed

try:
    del g._protected  # calls __delattr__("_protected") -> blocked
except AttributeError as e:
    print(f"Caught: {e}")`,
    explanation: "`delattr(obj, name)` and `del obj.name` both call `obj.__delattr__(name)`, which you override to add deletion guards — just as `__setattr__` guards assignment."
  },
  {
    id: "py-b16-b4-ast-vs-tokenize-vs-dis",
    language: "python",
    title: "ast vs tokenize vs dis comparison",
    tag: "families",
    code: `source = "x = 1 + 2"

# 1. dis: bytecode — lowest level, CPython-specific
import dis
print("=== dis ===")
dis.dis(compile(source, "<>", "exec"))

# 2. tokenize: lexer tokens — preserves whitespace & comments
import tokenize, io
print("\n=== tokenize ===")
for tok in tokenize.generate_tokens(io.StringIO(source).readline):
    if tok.string.strip():
        print(tok.string, end=" ")
print()

# 3. ast: syntax tree — language semantics, portable
import ast
print("\n=== ast ===")
tree = ast.parse(source)
print(ast.dump(tree, indent=2)[:200])`,
    explanation: "`dis` shows CPython bytecode (implementation detail); `tokenize` is the raw lexer (preserves formatting); `ast` is the semantic tree (portable across Python versions) — choose based on what level you need."
  },
  {
    id: "py-b16-b4-namespace-vs-dataclass",
    language: "python",
    title: "SimpleNamespace vs dataclass vs dict",
    tag: "families",
    code: `import types
from dataclasses import dataclass

# 1. dict — keys, no attribute access, most flexible
config_dict = {"host": "localhost", "port": 8080}

# 2. SimpleNamespace — attribute access, no validation, mutable
config_ns = types.SimpleNamespace(host="localhost", port=8080)
print(config_ns.host, config_ns.port)

# 3. dataclass — typed, eq/repr for free, optional frozen
@dataclass(frozen=True)
class Config:
    host: str
    port: int

config_dc = Config(host="localhost", port=8080)
print(config_dc)
print(config_dc == Config("localhost", 8080))  # True

# Comparison
print(config_ns == types.SimpleNamespace(host="localhost", port=8080))  # True`,
    explanation: "Use a `dict` for dynamic/unknown keys, `SimpleNamespace` for a quick attribute bag in scripts/tests, and `dataclass` when you want types, equality semantics, and immutability guarantees."
  },
  {
    id: "py-b16-b4-classmethod-abc-factory",
    language: "python",
    title: "Abstract class with concrete classmethod factory",
    tag: "understanding",
    code: `from abc import ABC, abstractmethod

class Serialiser(ABC):
    @abstractmethod
    def serialise(self) -> bytes: ...

    @classmethod
    def load(cls, raw: bytes) -> "Serialiser":
        """Concrete factory method — creates instance from bytes."""
        obj = cls.__new__(cls)  # skip __init__
        obj._raw = raw
        return obj

class JsonSerialiser(Serialiser):
    def __init__(self, data: dict) -> None:
        self.data = data

    def serialise(self) -> bytes:
        import json
        return json.dumps(self.data).encode()

j = JsonSerialiser({"key": "value"})
raw = j.serialise()
print(raw)

loaded = JsonSerialiser.load(raw)
print(type(loaded), loaded._raw)`,
    explanation: "Concrete classmethods on ABCs are inherited by subclasses and can reference `cls` polymorphically — useful for factory methods that produce the right subclass type without duplicating logic."
  },
  {
    id: "py-b16-b4-total-ordering-detail",
    language: "python",
    title: "functools.total_ordering implementation detail",
    tag: "structures",
    code: `from functools import total_ordering
import inspect

@total_ordering
class Weight:
    def __init__(self, grams: float) -> None:
        self.grams = grams

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, Weight):
            return NotImplemented
        return self.grams == other.grams

    def __lt__(self, other: "Weight") -> bool:
        if not isinstance(other, Weight):
            return NotImplemented
        return self.grams < other.grams

w1, w2 = Weight(100), Weight(200)
print(w1 < w2)    # True  — from __lt__
print(w1 <= w2)   # True  — derived by total_ordering
print(w1 > w2)    # False — derived
print(w1 >= w2)   # False — derived
print(sorted([Weight(300), w1, w2], key=lambda w: w.grams))`,
    explanation: "`@total_ordering` inspects the class at decoration time and synthesises the missing comparisons using your provided methods — it adds only what's absent, so existing implementations are never overwritten."
  },
  {
    id: "py-b16-b4-multiple-inheritance-diamond",
    language: "python",
    title: "Diamond problem without super()",
    tag: "caveats",
    code: `class A:
    def greet(self) -> str:
        return "A"

class B(A):
    def greet(self) -> str:
        # BUG: direct call skips C in the MRO chain
        return "B->" + A.greet(self)

class C(A):
    def greet(self) -> str:
        return "C->" + A.greet(self)

class D(B, C):
    def greet(self) -> str:
        return "D->" + super().greet()

d = D()
# With super() in D but direct A.greet() in B:
# D -> B -> A (C is skipped!)
print(d.greet())   # D->B->A  (C skipped!)
print([c.__name__ for c in D.__mro__])`,
    explanation: "Bypassing `super()` with an explicit parent class call short-circuits the MRO and silently skips classes — in a diamond hierarchy this means some parents are never initialised or called."
  },
  {
    id: "py-b16-b4-is-protocol-check",
    language: "python",
    title: "typing.is_protocol check",
    tag: "types",
    code: `from typing import Protocol, runtime_checkable, is_protocol

@runtime_checkable
class Readable(Protocol):
    def read(self) -> str: ...

class NotAProtocol:
    def read(self) -> str:
        return "data"

# is_protocol checks if the class IS a Protocol (not an implementation)
print(is_protocol(Readable))        # True
print(is_protocol(NotAProtocol))    # False
print(is_protocol(int))             # False

# isinstance still checks structural conformance
r = NotAProtocol()
print(isinstance(r, Readable))      # True — has .read()`,
    explanation: "`typing.is_protocol` (Python 3.12+) tells you whether a class was defined as a Protocol, which is useful in reflection-heavy code that needs to distinguish protocol definitions from their implementations."
  },
  {
    id: "py-b16-b4-super-explicit-static",
    language: "python",
    title: "super() with explicit args in static methods",
    tag: "caveats",
    code: `class Base:
    @classmethod
    def class_info(cls) -> str:
        return f"Base: {cls.__name__}"

class Child(Base):
    @staticmethod
    def info() -> str:
        # Zero-arg super() fails in @staticmethod (no __class__ cell)
        # Must pass explicit arguments: super(Child, Child)
        return super(Child, Child).class_info()

    @classmethod
    def class_info(cls) -> str:
        # @classmethod: zero-arg super() works fine
        return "Child->" + super().class_info()

print(Child.info())         # Base: Child
print(Child.class_info())   # Child->Base: Child`,
    explanation: "In `@staticmethod` there is no `__class__` implicit closure, so you must call `super(CurrentClass, first_arg)` explicitly — the two-argument form always works everywhere."
  },
  {
    id: "py-b16-b4-singledispatch-vs-patch",
    language: "python",
    title: "Singledispatch vs patch: which tool when",
    tag: "families",
    code: `# singledispatch: runtime type-based dispatch (production logic)
from functools import singledispatch

@singledispatch
def render(value) -> str:
    return str(value)

@render.register(list)
def _(value: list) -> str:
    return "[" + ", ".join(render(v) for v in value) + "]"

@render.register(dict)
def _(value: dict) -> str:
    pairs = ", ".join(f"{k}: {render(v)}" for k, v in value.items())
    return "{" + pairs + "}"

print(render({"a": [1, 2], "b": 3}))

# mock.patch: test-time substitution — not for dispatch
from unittest.mock import patch
with patch("builtins.print") as mock_print:
    print("hello")  # doesn't actually print
    mock_print.assert_called_once_with("hello")`,
    explanation: "`singledispatch` solves the open/closed extension problem in production code; `mock.patch` is exclusively a test tool for substituting objects at import-path level during tests."
  },
  {
    id: "py-b16-b4-pytest-fixture-scope",
    language: "python",
    title: "pytest.fixture with session scope",
    tag: "snippet",
    code: `import pytest

@pytest.fixture(scope="session")
def database_url() -> str:
    # Created once per test session — expensive resources go here
    print("\n[setup] connecting to DB")
    url = "sqlite:///:memory:"
    yield url
    print("\n[teardown] disconnecting from DB")

@pytest.fixture(scope="function")
def user(database_url: str) -> dict:
    # Created fresh for every test — uses session-scoped fixture
    return {"db": database_url, "name": "Alice"}

def test_user_name(user: dict) -> None:
    assert user["name"] == "Alice"

def test_user_db(user: dict) -> None:
    assert "sqlite" in user["db"]`,
    explanation: "Fixture scope controls lifetime: `function` (default) re-creates per test; `session` creates once for the whole run — use `session` for expensive setup like database connections."
  },
  {
    id: "py-b16-b4-mock-patch-dict",
    language: "python",
    title: "unittest.mock.patch.dict for os.environ",
    tag: "snippet",
    code: `import os
from unittest.mock import patch

def get_api_key() -> str:
    key = os.environ.get("API_KEY", "")
    if not key:
        raise ValueError("API_KEY environment variable not set")
    return key

# Patch a subset of env vars — existing vars are preserved
with patch.dict(os.environ, {"API_KEY": "test-key-123"}, clear=False):
    result = get_api_key()
    print(result)  # test-key-123

# After the block, API_KEY is removed again
print(os.environ.get("API_KEY"))  # None`,
    explanation: "`patch.dict` temporarily adds or overrides keys in any dict — ideal for `os.environ` in tests so you never risk leaking real credentials or polluting the environment between tests."
  },
  {
    id: "py-b16-b4-functools-reduce-fold",
    language: "python",
    title: "functools.reduce for custom fold operations",
    tag: "snippet",
    code: `from functools import reduce

# Build a nested dict from a key path
def set_nested(d: dict, keys: list[str], value: object) -> dict:
    reduce(lambda acc, k: acc.setdefault(k, {}), keys[:-1], d)[keys[-1]] = value
    return d

config: dict = {}
set_nested(config, ["database", "primary", "host"], "localhost")
set_nested(config, ["database", "primary", "port"], 5432)
set_nested(config, ["cache", "host"], "redis")
print(config)

# Classic: product of list using reduce
from operator import mul
nums = [1, 2, 3, 4, 5]
product = reduce(mul, nums)
print(product)  # 120`,
    explanation: "`reduce` threads an accumulator through a sequence; here it traverses nested dict keys with `setdefault`, creating intermediate dicts as needed — a concise alternative to a recursive function."
  },
  {
    id: "py-b16-b4-contextlib-closing",
    language: "python",
    title: "contextlib.closing wraps objects without __exit__",
    tag: "snippet",
    code: `from contextlib import closing
import urllib.request

# closing() calls .close() on exit, even if the object isn't a context manager
def fetch_bytes(url: str) -> bytes:
    with closing(urllib.request.urlopen(url)) as resp:
        return resp.read()

# Works with any object that has .close()
import io
buffer = io.BytesIO(b"hello world")
with closing(buffer) as b:
    data = b.read()
print(data)
print(buffer.closed)  # True — closed on exit`,
    explanation: "`contextlib.closing` is the simplest way to guarantee `.close()` is called on objects that expose it but don't implement the context manager protocol — a common pattern with legacy or third-party APIs."
  },
  {
    id: "py-b16-b4-itertools-chain",
    language: "python",
    title: "itertools.chain concatenates iterables lazily",
    tag: "snippet",
    code: `import itertools

a = [1, 2, 3]
b = (4, 5, 6)
c = range(7, 10)

# chain: single lazy iterator over multiple iterables
combined = itertools.chain(a, b, c)
print(list(combined))  # [1, 2, 3, 4, 5, 6, 7, 8, 9]

# chain.from_iterable: when you have a list of iterables
nested = [[1, 2], [3, 4], [5, 6]]
flat = list(itertools.chain.from_iterable(nested))
print(flat)  # [1, 2, 3, 4, 5, 6]

# Practical: process multiple log files as one stream
import io
files = [io.StringIO("line1\nline2\n"), io.StringIO("line3\nline4\n")]
for line in itertools.chain.from_iterable(files):
    print(repr(line), end=" ")`,
    explanation: "`itertools.chain` streams multiple iterables end-to-end without materialising them; `chain.from_iterable` is the lazy equivalent of `sum(lists, [])` and avoids repeated list concatenation."
  },
  {
    id: "py-b16-b4-dataclasses-field",
    language: "python",
    title: "dataclasses.field for mutable defaults",
    tag: "snippet",
    code: `from dataclasses import dataclass, field

@dataclass
class Config:
    host: str = "localhost"
    port: int = 8080
    # WRONG: tags: list = []  -- shared across all instances!
    tags: list[str] = field(default_factory=list)
    metadata: dict[str, str] = field(default_factory=dict)
    _internal: str = field(default="", repr=False, compare=False)

c1 = Config()
c2 = Config()
c1.tags.append("web")
print(c1.tags)  # ['web']
print(c2.tags)  # []  — separate list, not shared!
print(c1)       # _internal hidden by repr=False`,
    explanation: "`field(default_factory=list)` calls the factory for each instance, preventing the classic mutable-default bug; `repr=False` hides internal fields from the generated `__repr__`."
  },
  {
    id: "py-b16-b4-enum-auto",
    language: "python",
    title: "enum.auto() and IntEnum for flags",
    tag: "snippet",
    code: `from enum import Enum, IntEnum, Flag, auto

class Color(Enum):
    RED = auto()    # 1
    GREEN = auto()  # 2
    BLUE = auto()   # 3

class Permission(Flag):
    READ    = auto()  # 1
    WRITE   = auto()  # 2
    EXECUTE = auto()  # 4
    ALL = READ | WRITE | EXECUTE

print(Color.RED.value)        # 1
print(Color.RED.name)         # RED

perms = Permission.READ | Permission.WRITE
print(perms)                  # Permission.READ|WRITE
print(Permission.READ in perms)  # True
print(Permission.EXECUTE in perms)  # False`,
    explanation: "`auto()` assigns incrementing integer values so you don't hardcode them; `Flag` enables bitwise composition so a single variable can represent a set of permissions without a separate bitmask."
  },
  {
    id: "py-b16-b4-pathlib-basics",
    language: "python",
    title: "pathlib.Path for cross-platform file ops",
    tag: "snippet",
    code: `from pathlib import Path
import tempfile

# Create a temporary directory to demonstrate
with tempfile.TemporaryDirectory() as tmpdir:
    base = Path(tmpdir)

    # Build paths with / operator
    config_file = base / "config" / "settings.toml"
    config_file.parent.mkdir(parents=True, exist_ok=True)
    config_file.write_text("[server]\nport = 8080\n")

    # Read back
    print(config_file.read_text())

    # Introspect
    print(config_file.name)       # settings.toml
    print(config_file.suffix)     # .toml
    print(config_file.stem)       # settings
    print(config_file.parent)     # .../config
    print(config_file.exists())   # True`,
    explanation: "`pathlib.Path` replaces `os.path` string juggling with an object-oriented API; the `/` operator concatenates path segments safely across Windows and Unix."
  },
  {
    id: "py-b16-b4-contextmanager-decorator",
    language: "python",
    title: "contextlib.contextmanager turns a generator into a CM",
    tag: "snippet",
    code: `from contextlib import contextmanager
import time

@contextmanager
def timer(label: str):
    start = time.perf_counter()
    try:
        yield  # body of the 'with' block runs here
    finally:
        elapsed = time.perf_counter() - start
        print(f"{label}: {elapsed*1000:.2f}ms")

with timer("list comprehension"):
    result = [x**2 for x in range(100_000)]

with timer("generator sum"):
    total = sum(x**2 for x in range(100_000))

print(total)`,
    explanation: "`@contextmanager` turns a generator into a context manager — code before `yield` is setup, code after (or in `finally`) is teardown, with the `yield` value becoming the `as` target."
  },
  {
    id: "py-b16-b4-logging-basicconfig",
    language: "python",
    title: "logging module structured setup",
    tag: "snippet",
    code: `import logging

logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%H:%M:%S",
)

log = logging.getLogger(__name__)

def process(item: str) -> str:
    log.debug("Processing %r", item)
    result = item.upper()
    log.info("Done: %r -> %r", item, result)
    return result

process("hello")
process("world")

# Module-level logger is best practice — avoids root logger pollution
# Use %r formatting, not f-strings, to defer string formatting on filtered levels`,
    explanation: "Always get a named logger with `logging.getLogger(__name__)` — it automatically creates a hierarchy matching your package structure and lets callers configure verbosity per module."
  },
  {
    id: "py-b16-b4-lru-cache",
    language: "python",
    title: "functools.lru_cache memoisation",
    tag: "snippet",
    code: `from functools import lru_cache
import time

@lru_cache(maxsize=128)
def fibonacci(n: int) -> int:
    if n < 2:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

start = time.perf_counter()
print(fibonacci(35))   # 9227465
elapsed = time.perf_counter() - start
print(f"Elapsed: {elapsed*1000:.1f}ms")

# Cache stats
info = fibonacci.cache_info()
print(f"hits={info.hits}, misses={info.misses}, size={info.currsize}")

# Clear the cache
fibonacci.cache_clear()
print(fibonacci.cache_info())`,
    explanation: "`@lru_cache` memoises calls using a dict keyed on the arguments; the LRU eviction policy keeps memory bounded; `cache_info()` exposes hit rate so you can tune `maxsize` for your workload."
  },
  {
    id: "py-b16-b4-dataclass-post-init",
    language: "python",
    title: "dataclasses __post_init__ for validation",
    tag: "snippet",
    code: `from dataclasses import dataclass, field
from datetime import date

@dataclass
class DateRange:
    start: date
    end: date

    def __post_init__(self) -> None:
        # Runs after the generated __init__ sets all fields
        if self.end < self.start:
            raise ValueError(
                f"end ({self.end}) must be >= start ({self.start})"
            )
        self.duration_days = (self.end - self.start).days

d = DateRange(date(2026, 1, 1), date(2026, 12, 31))
print(d.duration_days)  # 364

try:
    DateRange(date(2026, 6, 1), date(2026, 1, 1))
except ValueError as e:
    print(f"Caught: {e}")`,
    explanation: "`__post_init__` is called by the dataclass-generated `__init__` after all fields are set, making it the designated place for cross-field validation and derived attribute computation."
  },
  {
    id: "py-b16-b4-itertools-groupby",
    language: "python",
    title: "itertools.groupby groups consecutive elements",
    tag: "snippet",
    code: `import itertools

words = ["apple", "apricot", "banana", "blueberry", "cherry", "cranberry"]

# Group by first letter — input must be sorted by the key!
for letter, group in itertools.groupby(words, key=lambda w: w[0]):
    print(f"{letter}: {list(group)}")

# Common mistake: groupby only groups CONSECUTIVE equal keys
data = [1, 1, 2, 1, 1]  # 1 appears in two groups!
for key, grp in itertools.groupby(data):
    print(f"{key}: {list(grp)}")
# 1: [1, 1]
# 2: [2]
# 1: [1, 1]`,
    explanation: "`itertools.groupby` groups *consecutive* elements with the same key — if the input isn't sorted by the key first, identical elements in non-adjacent positions will appear as separate groups."
  },
  {
    id: "py-b16-b4-abstractmethod-property-combo",
    language: "python",
    title: "pytest.mark.parametrize with indirect fixture",
    tag: "snippet",
    code: `import pytest

def multiply(a: int, b: int) -> int:
    return a * b

# Multiple argument sets with IDs for readable test names
@pytest.mark.parametrize("a,b,expected", [
    pytest.param(2, 3, 6,   id="2x3"),
    pytest.param(0, 5, 0,   id="zero"),
    pytest.param(-1, 4, -4, id="negative"),
    pytest.param(100, 100, 10000, id="large"),
], ids=lambda x: str(x) if not isinstance(x, tuple) else None)
def test_multiply(a: int, b: int, expected: int) -> None:
    assert multiply(a, b) == expected

# Run with: pytest -v  (shows "test_multiply[2x3]", "test_multiply[zero]", ...)`,
    explanation: "`pytest.param(..., id=...)` assigns human-readable names to parametrize cases — instead of `test_multiply[2-3-6]` you get `test_multiply[2x3]`, making failure reports immediately informative."
  },
  {
    id: "py-b16-b4-slots-memory-benefit",
    language: "python",
    title: "__slots__ memory benefit demonstration",
    tag: "snippet",
    code: `import sys

class WithDict:
    def __init__(self, x: int, y: int) -> None:
        self.x = x
        self.y = y

class WithSlots:
    __slots__ = ("x", "y")
    def __init__(self, x: int, y: int) -> None:
        self.x = x
        self.y = y

d = WithDict(1, 2)
s = WithSlots(1, 2)

print(f"WithDict:  {sys.getsizeof(d)} bytes + {sys.getsizeof(d.__dict__)} dict bytes")
print(f"WithSlots: {sys.getsizeof(s)} bytes (no __dict__)")

# In a million-object collection the savings are significant
# sys.getsizeof doesn't count attribute values, only the container
has_dict = hasattr(d, "__dict__")
no_dict  = hasattr(s, "__dict__")
print(f"d has __dict__: {has_dict}, s has __dict__: {no_dict}")`,
    explanation: "`__slots__` eliminates the per-instance `__dict__` (typically 200–400 bytes) by storing attributes in a compact fixed-size array — the savings multiply significantly when creating millions of instances."
  },
  {
    id: "py-b16-b4-type-union-runtime",
    language: "python",
    title: "typing.get_args and get_origin for type introspection",
    tag: "types",
    code: `from typing import get_args, get_origin, Union, Optional
import typing

# Inspect typing generics
print(get_origin(list[int]))         # <class 'list'>
print(get_args(list[int]))           # (<class 'int'>,)

print(get_origin(dict[str, int]))    # <class 'dict'>
print(get_args(dict[str, int]))      # (<class 'str'>, <class 'int'>)

print(get_origin(Union[int, str]))   # typing.Union
print(get_args(Union[int, str]))     # (<class 'int'>, <class 'str'>)

# Optional[X] is Union[X, None]
print(get_args(Optional[str]))       # (<class 'str'>, <class 'NoneType'>)

# Python 3.10+ union syntax
u = int | str
print(get_origin(u))   # <class 'types.UnionType'>
print(get_args(u))     # (<class 'int'>, <class 'str'>)`,
    explanation: "`typing.get_origin` and `get_args` let you decompose generic type annotations at runtime — essential for building validators, serialisers, and dependency-injection containers that inspect type hints."
  },
];

