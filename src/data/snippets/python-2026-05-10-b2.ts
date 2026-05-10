import type { Snippet } from "./types";

export const pythonSnippets20260510B2: Snippet[] = [
  {
    id: "py-snippet-graphlib-parallel",
    language: "python",
    title: "graphlib TopologicalSorter in parallel mode for concurrent tasks",
    tag: "snippet",
    code: `import graphlib, time

tasks = {
    'deploy':  {'test', 'build', 'package'},
    'package': {'build'},
    'test':    {'lint'},
    'build':   {'lint'},
    'lint':    set(),
}

ts = graphlib.TopologicalSorter(tasks)
ts.prepare()   # required before using parallel API

done = []
while ts.is_active():
    # get_ready(): nodes with all deps satisfied
    ready = ts.get_ready()
    for node in ready:
        print(f"running: {node}")
        time.sleep(0.001)   # simulate work
        ts.done(node)       # mark complete so dependents become ready
        done.append(node)

print("order:", done)
# lint, then build/test in any order, then package, then deploy`,
    explanation: "TopologicalSorter's parallel API (prepare(), get_ready(), done()) returns all currently runnable nodes so you can dispatch them to a thread pool or asyncio tasks simultaneously. Call done() when a task finishes to unblock its dependents. This is the key API for build systems and workflow engines.",
  },
  {
    id: "py-snippet-tomllib-pyproject",
    language: "python",
    title: "Reading pyproject.toml with tomllib",
    tag: "snippet",
    code: `import tomllib, pathlib, sys

# tomllib requires a binary file object
pyproject = pathlib.Path("pyproject.toml")

if not pyproject.exists():
    print("no pyproject.toml found")
    sys.exit(0)

with open(pyproject, "rb") as f:
    data = tomllib.load(f)

# Access standard pyproject.toml sections
project = data.get("project", {})
print(project.get("name", "unknown"))      # package name
print(project.get("version", "0.0.0"))    # version
print(project.get("requires-python", "")) # min Python version

deps = project.get("dependencies", [])
print(f"{len(deps)} runtime dependencies")

# Tool-specific config
ruff = data.get("tool", {}).get("ruff", {})
print("ruff line-length:", ruff.get("line-length", 88))`,
    explanation: "tomllib.load(binary_file) parses a TOML file opened in binary mode ('rb'). pyproject.toml follows the standard layout: [project] for metadata, [tool.X] for tool config. All TOML types (strings, integers, booleans, arrays, inline tables) are automatically converted to their Python equivalents.",
  },
  {
    id: "py-snippet-fnmatch-translate",
    language: "python",
    title: "fnmatch.translate converts a shell pattern to a regex",
    tag: "snippet",
    code: `import fnmatch, re

# translate converts shell glob to equivalent regex
pattern = fnmatch.translate("*.py")
print(pattern)   # (?s:.*\\.py)\\Z  (anchored, case-sensitive on Unix)

# Compile for repeated use
regex = re.compile(fnmatch.translate("test_*.py"))
files = ["test_auth.py", "conftest.py", "test_db.py", "helpers.py"]
matches = [f for f in files if regex.match(f)]
print(matches)   # ['test_auth.py', 'test_db.py']

# Case-insensitive matching (needed on Windows)
ci_regex = re.compile(fnmatch.translate("*.TXT"), re.IGNORECASE)
print(ci_regex.match("readme.txt"))   # match object

# Character class patterns
img_regex = re.compile(fnmatch.translate("*.[jJ][pP][gG]"))
imgs = ["photo.jpg", "photo.JPG", "photo.jpeg"]
print([f for f in imgs if img_regex.match(f)])   # ['photo.jpg', 'photo.JPG']`,
    explanation: "fnmatch.translate(pattern) converts a shell glob pattern to an equivalent anchored regex string. Compiling it with re.compile() lets you add flags like re.IGNORECASE for cross-platform case-insensitive matching. This is more powerful than fnmatch.fnmatch() when you need to batch-match many strings.",
  },
  {
    id: "py-snippet-contextlib-exitstack",
    language: "python",
    title: "contextlib.ExitStack manages a dynamic number of context managers",
    tag: "snippet",
    code: `import contextlib, tempfile, os

# ExitStack: enter a variable number of context managers
files = [tempfile.mktemp() for _ in range(3)]
for f in files:
    with open(f, 'w') as fp:
        fp.write(f"content of {f}")

handles = []
with contextlib.ExitStack() as stack:
    for path in files:
        # stack.enter_context() registers and enters the context manager
        fh = stack.enter_context(open(path))
        handles.append(fh)

    for fh in handles:
        print(fh.readline().strip())  # reads content from each

# All files closed automatically when the 'with' block exits

# ExitStack as a conditional context manager
def maybe_open(path, use_real_file):
    stack = contextlib.ExitStack()
    if use_real_file:
        fh = stack.enter_context(open(path))
    else:
        fh = stack.enter_context(contextlib.nullcontext(None))
    return stack, fh

for f in files:
    os.unlink(f)`,
    explanation: "ExitStack collects context managers at runtime and ensures all are exited (even if some fail). This solves the 'open N files' problem where the number is unknown at write time. stack.enter_context() returns the __enter__ value. Use it when static nesting of with statements is not possible.",
  },
  {
    id: "py-snippet-logging-filter",
    language: "python",
    title: "logging.Filter customises which records are emitted",
    tag: "snippet",
    code: `import logging

class RequestIdFilter(logging.Filter):
    """Inject a request ID into every log record."""
    def __init__(self, request_id: str):
        super().__init__()
        self.request_id = request_id

    def filter(self, record: logging.LogRecord) -> bool:
        record.request_id = self.request_id
        return True   # True: emit the record; False: suppress it

# Suppress records above a threshold
class MaxLevelFilter(logging.Filter):
    def __init__(self, max_level: int):
        super().__init__()
        self.max_level = max_level
    def filter(self, record: logging.LogRecord) -> bool:
        return record.levelno <= self.max_level

logger = logging.getLogger("api")
handler = logging.StreamHandler()
handler.setFormatter(logging.Formatter("%(request_id)s %(levelname)s %(message)s"))
handler.addFilter(RequestIdFilter("req-abc123"))
handler.addFilter(MaxLevelFilter(logging.WARNING))  # suppress ERROR+
logger.addHandler(handler)
logger.setLevel(logging.DEBUG)

logger.info("processing request")    # req-abc123 INFO processing request
logger.warning("slow response")      # req-abc123 WARNING slow response
logger.error("database down")        # suppressed by MaxLevelFilter`,
    explanation: "logging.Filter.filter() returns True to emit a record and False to suppress it. Filters can also mutate the record (like injecting a request_id) before it reaches the handler's formatter. Filters are added to handlers or loggers with addFilter() and run in the order they were added.",
  },
  {
    id: "py-understanding-super-mro-diamond",
    language: "python",
    title: "Diamond inheritance: super() follows MRO, not parent class",
    tag: "understanding",
    code: `class A:
    def greet(self): print("A.greet"); super().greet()

class B(A):
    def greet(self): print("B.greet"); super().greet()

class C(A):
    def greet(self): print("C.greet"); super().greet()

class D(B, C):
    def greet(self): print("D.greet"); super().greet()

# MRO: D -> B -> C -> A -> object
print([cls.__name__ for cls in D.__mro__])
# ['D', 'B', 'C', 'A', 'object']

D().greet()
# D.greet
# B.greet  (super() in D goes to B per MRO)
# C.greet  (super() in B goes to C per MRO, NOT back to A!)
# A.greet  (super() in C goes to A)
# object.greet would raise; A.greet must NOT call super().greet() if object.greet doesn't exist

# Key insight: super() in B doesn't call B's parent (A)
# It calls the NEXT class in D's MRO`,
    explanation: "super() looks up the MRO of the actual runtime class, not the declaring class. In a diamond, B.super().greet() calls C (not A) when accessed via a D instance. This is why cooperative multiple inheritance requires every class in the chain to call super() — omitting it breaks the chain for all deeper subclasses.",
  },
  {
    id: "py-understanding-descriptor-none",
    language: "python",
    title: "Descriptor __get__ receives None as obj when accessed on the class",
    tag: "understanding",
    code: `class Validator:
    def __set_name__(self, owner, name):
        self._name = name

    def __get__(self, obj, objtype=None):
        if obj is None:
            # Accessed via class, not instance: return the descriptor itself
            return self
        return obj.__dict__.get(self._name)

    def __set__(self, obj, value):
        if not isinstance(value, int):
            raise TypeError(f"{self._name} must be int")
        obj.__dict__[self._name] = value

class Box:
    width  = Validator()
    height = Validator()

b = Box()
b.width = 10     # calls __set__
print(b.width)   # calls __get__(obj=b, ...) -> 10

# Accessing via the class passes obj=None
print(Box.width)   # <__main__.Validator object at 0x...>
print(type(Box.width))   # <class '__main__.Validator'>

# This lets class-level access return the descriptor itself (for introspection)
print(Box.width._name)   # width`,
    explanation: "When a descriptor is accessed on the class (not an instance), Python calls __get__(None, owner_class). By returning self, the descriptor exposes itself for introspection, documentation, and tools like help(). Returning something else (e.g., a class-level default) is also valid.",
  },
  {
    id: "py-understanding-late-binding-closures",
    language: "python",
    title: "Lambda in loops captures the variable name, not its current value",
    tag: "understanding",
    code: `# All lambdas reference the same 'i' variable
fns = [lambda: i for i in range(5)]
# After the loop, i == 4 for all closures
print([f() for f in fns])   # [4, 4, 4, 4, 4]

# Fix: capture value at creation time via a default argument
fns2 = [lambda i=i: i for i in range(5)]
print([f() for f in fns2])   # [0, 1, 2, 3, 4]

# Also fix: functools.partial or a factory function
import functools
def make_fn(n):
    return lambda: n

fns3 = [make_fn(i) for i in range(5)]
print([f() for f in fns3])   # [0, 1, 2, 3, 4]

# The same issue applies to functions, not just lambdas
adders = []
for n in range(5):
    def add(x, _n=n): return x + _n   # _n=n fixes it
    adders.append(add)
print([f(10) for f in adders])   # [10, 11, 12, 13, 14]`,
    explanation: "Closures capture variable names, not values. At call time, they look up the current value of the closed-over variable. In a loop, all closures share the same loop variable which has the loop's final value. The default-argument trick (lambda v=v: v) binds the value at definition time.",
  },
  {
    id: "py-understanding-property-setter-cls",
    language: "python",
    title: "property setter and the property object's identity",
    tag: "understanding",
    code: `class Temperature:
    def __init__(self, celsius=0.0):
        self._celsius = celsius

    @property
    def celsius(self):
        return self._celsius

    # @celsius.setter returns a NEW property object
    @celsius.setter
    def celsius(self, value):
        if value < -273.15:
            raise ValueError("below absolute zero")
        self._celsius = value

    @property
    def fahrenheit(self):
        return self._celsius * 9/5 + 32

t = Temperature()
t.celsius = 100          # calls setter
print(t.celsius)         # 100 (calls getter)
print(t.fahrenheit)      # 212.0

try:
    t.celsius = -300     # ValueError
except ValueError as e:
    print(e)

# property is a descriptor: Temperature.celsius is the property object
print(type(Temperature.celsius))   # <class 'property'>
print(Temperature.celsius.fget)    # the getter function
print(Temperature.celsius.fset)    # the setter function`,
    explanation: "@celsius.setter creates a new property object that replaces the old one, carrying both getter and setter. Accessing the property on the class returns the property descriptor itself (not the value), which you can inspect via .fget, .fset, .fdel. @celsius.deleter adds a __delete__ to the descriptor.",
  },
  {
    id: "py-structures-enum-auto-mix",
    language: "python",
    title: "Mixing enum.auto() with explicit values",
    tag: "structures",
    code: `from enum import Enum, auto

class Priority(Enum):
    LOW     = 1
    MEDIUM  = auto()   # auto() calls _generate_next_value_
    HIGH    = auto()   # continues from 2 -> 3
    URGENT  = 10       # explicit; auto() after this would be 11

print(Priority.LOW.value)     # 1
print(Priority.MEDIUM.value)  # 2
print(Priority.HIGH.value)    # 3
print(Priority.URGENT.value)  # 10

# Customise auto() by overriding _generate_next_value_
class Color(Enum):
    def _generate_next_value_(name, start, count, last_values):
        return name.lower()   # use the member name as value

    RED   = auto()   # 'red'
    GREEN = auto()   # 'green'
    BLUE  = auto()   # 'blue'

print(Color.RED.value)   # red
print(Color.GREEN.name)  # GREEN (name is always the attribute name)`,
    explanation: "_generate_next_value_ is called by auto() each time it needs a value. The default (for Enum) generates 1, 2, 3, ... The StrEnum version lowercases the name. You can override it in a subclass to generate any sequence (hashes, UUIDs, hex codes). Explicit values interrupt the auto sequence at the given point.",
  },
  {
    id: "py-structures-typing-typeddict-inherit",
    language: "python",
    title: "TypedDict inheritance extends required keys",
    tag: "structures",
    code: `from typing import TypedDict, NotRequired

class BaseRecord(TypedDict):
    id: int
    created_at: str

class UserRecord(BaseRecord):
    username: str
    email: str
    display_name: NotRequired[str]

class AdminRecord(UserRecord):
    permissions: list[str]
    is_super: NotRequired[bool]

# Type checker understands the full key set
def process_user(u: UserRecord) -> str:
    return f"{u['id']}: {u['username']}"

user: UserRecord = {
    'id': 1,
    'created_at': '2026-05-10',
    'username': 'alice',
    'email': 'alice@example.com',
}
print(process_user(user))   # 1: alice

# AdminRecord requires all BaseRecord + UserRecord keys + permissions
admin: AdminRecord = {
    'id': 2,
    'created_at': '2026-05-10',
    'username': 'bob',
    'email': 'bob@example.com',
    'permissions': ['read', 'write'],
}`,
    explanation: "TypedDict inheritance works like regular class inheritance: the child type includes all keys from the parent. Inherited keys keep their Required/NotRequired status from the parent unless overridden. Multiple inheritance is supported: class C(A, B) combines both dicts' keys.",
  },
  {
    id: "py-structures-heapq-nsmallest",
    language: "python",
    title: "heapq.nsmallest and nlargest without full sort",
    tag: "structures",
    code: `import heapq

data = [34, 1, 92, 15, 67, 23, 88, 44, 5, 78]

# nsmallest / nlargest: O(n log k), more efficient than sort for small k
print(heapq.nsmallest(3, data))   # [1, 5, 15]
print(heapq.nlargest(3, data))    # [92, 88, 78]

# With a key function
records = [
    {'name': 'Alice', 'score': 85},
    {'name': 'Bob',   'score': 92},
    {'name': 'Carol', 'score': 78},
    {'name': 'Dave',  'score': 95},
]
top2 = heapq.nlargest(2, records, key=lambda r: r['score'])
print([r['name'] for r in top2])   # ['Dave', 'Bob']

# For k close to n, sorted() is more efficient
# heapq.nsmallest vs sorted: heapq wins when k << n
import random
big = random.sample(range(1_000_000), 100_000)
print(heapq.nsmallest(5, big))   # 5 smallest values`,
    explanation: "heapq.nsmallest(k, iterable) and nlargest use a heap of size k rather than sorting the full sequence, giving O(n log k) instead of O(n log n). They're faster than sort when k is much smaller than n. For k == 1, use min/max; for k close to n, use sorted.",
  },
  {
    id: "py-structures-enum-intflag",
    language: "python",
    title: "enum.IntFlag for bit-flags compatible with int arithmetic",
    tag: "structures",
    code: `from enum import IntFlag, auto

class Perm(IntFlag):
    READ    = auto()   # 1
    WRITE   = auto()   # 2
    EXECUTE = auto()   # 4

# IntFlag members ARE ints (unlike Flag)
rw = Perm.READ | Perm.WRITE
print(int(rw))          # 3
print(rw == 3)          # True  (IntFlag allows int comparison)

# Can use in int arithmetic
print(rw + 0)           # 3
print(rw & 1)           # 1 (just READ, result is int)
print(Perm(rw & 1))     # Perm.READ (wrap back to enum)

# Bitwise operations return Perm members
all_perms = Perm.READ | Perm.WRITE | Perm.EXECUTE
print(all_perms)         # Perm.READ|WRITE|EXECUTE
print(~Perm.WRITE & all_perms)  # Perm.READ|EXECUTE

# Store permissions as an int in a database
stored = int(Perm.READ | Perm.EXECUTE)   # 5
restored = Perm(stored)
print(Perm.READ in restored)             # True`,
    explanation: "IntFlag inherits from both Flag and int, making members compatible with integer arithmetic and bitwise operations on plain ints. This lets you store flags as integers in databases and restore them with Perm(value). The trade-off vs Flag: IntFlag allows spurious integer comparisons that may hide bugs.",
  },
  {
    id: "py-caveats-dict-iteration-mutation",
    language: "python",
    title: "Mutating a dict during iteration raises RuntimeError",
    tag: "caveats",
    code: `d = {'a': 1, 'b': 2, 'c': 3}

# Direct mutation during iteration: RuntimeError
try:
    for key in d:
        if key == 'b':
            del d[key]   # RuntimeError: dictionary changed size during iteration
except RuntimeError as e:
    print(e)

# Fix 1: iterate a copy of keys
for key in list(d.keys()):
    if key == 'b':
        del d[key]
print(d)   # {'a': 1, 'c': 3}

# Fix 2: build a new dict with dict comprehension
d2 = {'a': 1, 'b': 2, 'c': 3}
d2 = {k: v for k, v in d2.items() if k != 'b'}
print(d2)  # {'a': 1, 'c': 3}

# Safe: mutating values (not adding/removing keys) is allowed
d3 = {'a': 1, 'b': 2}
for key in d3:
    d3[key] *= 2   # OK: size unchanged
print(d3)          # {'a': 2, 'b': 4}`,
    explanation: "Python raises RuntimeError if a dict's size changes during iteration (adding or removing keys). This is detected cheaply via an internal version counter. Mutating values of existing keys is safe. Fix by iterating list(d.keys()) for deletions, or rebuilding with a comprehension.",
  },
  {
    id: "py-caveats-copy-vs-deepcopy",
    language: "python",
    title: "copy.copy vs = assignment: both share inner objects",
    tag: "caveats",
    code: `import copy

# = assignment: same object
a = [1, [2, 3], 4]
b = a
b.append(5)
print(a)   # [1, [2, 3], 4, 5]  -- a also changed!

# copy.copy: new outer list, but inner list is SHARED
a2 = [1, [2, 3], 4]
b2 = copy.copy(a2)
b2.append(5)         # new element on b2 only
b2[1].append(99)     # mutates the SHARED inner list!
print(a2)            # [1, [2, 3, 99], 4]  -- inner list changed

# copy.deepcopy: fully independent
a3 = [1, [2, 3], 4]
b3 = copy.deepcopy(a3)
b3[1].append(99)
print(a3)            # [1, [2, 3], 4]  -- unchanged

# Slicing also does a shallow copy (like copy.copy for lists)
a4 = [1, [2, 3]]
b4 = a4[:]
b4[1].append(99)
print(a4)            # [1, [2, 3, 99]]  -- inner list shared`,
    explanation: "Assignment shares the same object. Slicing and copy.copy create a new container but share the inner objects. copy.deepcopy creates a fully independent tree by recursively copying all nested objects. The distinction matters whenever the data contains mutable objects (lists, dicts, custom classes) at any depth.",
  },
  {
    id: "py-caveats-exception-from-chain",
    language: "python",
    title: "raise ... from ... sets the explicit exception chain",
    tag: "caveats",
    code: `# raise X from Y: explicit chaining (e.__cause__ = Y)
def low_level():
    raise ConnectionError("socket timed out")

def high_level():
    try:
        low_level()
    except ConnectionError as e:
        raise RuntimeError("failed to fetch data") from e

try:
    high_level()
except RuntimeError as e:
    print(e)               # failed to fetch data
    print(e.__cause__)     # socket timed out
    print(e.__suppress_context__)  # True (hides the implicit chain)

# raise X from None: explicitly suppress the chained context
def silent():
    try:
        low_level()
    except ConnectionError:
        raise RuntimeError("unavailable") from None

try:
    silent()
except RuntimeError as e:
    print(e.__cause__)    # None (suppressed)
    print(e.__context__)  # None (suppressed by from None)`,
    explanation: "raise X from Y creates an explicit exception chain where X.__cause__ = Y. Tracebacks show 'The above exception was the direct cause'. raise X from None suppresses all chaining — useful in APIs that convert internal errors to public ones without leaking implementation details.",
  },
  {
    id: "py-caveats-in-operator-generator",
    language: "python",
    title: "'in' on a generator consumes it up to the found element",
    tag: "caveats",
    code: `def count_up(n):
    """Generator that counts and prints each step."""
    for i in range(n):
        print(f"  yielding {i}")
        yield i

gen = count_up(10)
print(3 in gen)     # checks 0,1,2,3 -- True
# Output: yielding 0, yielding 1, yielding 2, yielding 3

# Generator is now positioned AFTER 3
print(list(gen))    # [4, 5, 6, 7, 8, 9]  (remaining elements)

# Not found: exhausts the entire generator
gen2 = count_up(5)
print(99 in gen2)   # False (consumes all 5 elements)
print(list(gen2))   # []  (exhausted)

# Safe: use 'in' only on reusable sequences (list, set, etc.)
data = list(count_up(10))
print(3 in data)    # True
print(list(data))   # still complete`,
    explanation: "'in' on a generator iterates until it finds the element (and stops there) or exhausts the generator. Any elements before the found item are consumed and lost. If 'not found', the entire generator is consumed. Use 'in' on generators only when you intend to discard the preceding elements.",
  },
  {
    id: "py-types-annotated-metadata",
    language: "python",
    title: "typing.Annotated attaches metadata to a type for validators and docs",
    tag: "types",
    code: `from typing import Annotated, get_type_hints
from dataclasses import dataclass

# Annotated[type, *metadata]: metadata is ignored by type checkers
# but available at runtime for libraries to inspect
PositiveInt = Annotated[int, "must be positive"]
Email       = Annotated[str, "must match email regex"]
Clamp       = lambda lo, hi: Annotated[float, f"clamp to [{lo},{hi}]"]

@dataclass
class Sensor:
    temperature: Clamp(-40, 85)
    reading_count: PositiveInt
    owner_email: Email

# Runtime introspection via get_type_hints(include_extras=True)
hints = get_type_hints(Sensor, include_extras=True)
for field, hint in hints.items():
    print(f"{field}: {hint}")
# temperature: typing.Annotated[float, 'clamp to [-40,85]']
# reading_count: typing.Annotated[int, 'must be positive']
# owner_email: typing.Annotated[str, 'must match email regex']

# Pydantic, attrs, and FastAPI use Annotated metadata for validation
# e.g., Annotated[int, Field(gt=0, le=100)]`,
    explanation: "Annotated[T, metadata...] adds zero or more metadata values to a type. Type checkers treat it as T for all type-checking purposes; the metadata is only visible at runtime via get_type_hints(include_extras=True). Libraries like Pydantic, FastAPI, and Python-attrs use this to attach validation constraints to type hints.",
  },
  {
    id: "py-types-classvar-type",
    language: "python",
    title: "ClassVar[T] marks class variables in dataclasses and type hints",
    tag: "types",
    code: `from typing import ClassVar
from dataclasses import dataclass

@dataclass
class Registry:
    # ClassVar: excluded from __init__ and dataclass fields
    _instances: ClassVar[dict[str, 'Registry']] = {}
    _count: ClassVar[int] = 0

    name: str   # instance field -- included in __init__

    def __post_init__(self):
        Registry._count += 1
        Registry._instances[self.name] = self

r1 = Registry("alpha")
r2 = Registry("beta")

print(Registry._count)        # 2
print(list(Registry._instances.keys()))  # ['alpha', 'beta']

# @dataclass does NOT generate __init__ param for ClassVar fields
import inspect
sig = inspect.signature(Registry.__init__)
print(list(sig.parameters))   # ['self', 'name']  -- no _instances/_count

# Type checker also understands ClassVar should not be set on instances
# r1._count = 5  # type error: ClassVar cannot be set on instance`,
    explanation: "ClassVar[T] in a dataclass tells the @dataclass decorator not to treat that attribute as an instance field — it won't appear in __init__, __repr__, or __eq__. Type checkers also flag attempts to set a ClassVar attribute on an instance. Without ClassVar, @dataclass would include it as a required constructor parameter.",
  },
  {
    id: "py-types-protocol-callable",
    language: "python",
    title: "Protocol for callable objects with specific signatures",
    tag: "types",
    code: `from typing import Protocol

class Transformer(Protocol):
    def __call__(self, text: str) -> str: ...

class Reducer(Protocol):
    def __call__(self, items: list[int]) -> int: ...

def apply_transform(text: str, transform: Transformer) -> str:
    return transform(text)

# Any callable with the right signature satisfies the protocol
def shout(text: str) -> str:
    return text.upper() + "!!!"

class TitleCase:
    def __call__(self, text: str) -> str:
        return text.title()

print(apply_transform("hello world", shout))          # HELLO WORLD!!!
print(apply_transform("hello world", TitleCase()))    # Hello World
print(apply_transform("hello world", str.strip))      # hello world (wrong sig? no: strip takes self)

# Lambda works too if the signature matches
print(apply_transform("hello", lambda t: t[::-1]))   # olleh`,
    explanation: "A Protocol with __call__ defines a callable interface. Any function, lambda, or class with __call__ that matches the signature satisfies the protocol structurally — no explicit implementation required. This is more flexible than Callable[..., ReturnType] when you need to name the callable type and reuse it.",
  },
  {
    id: "py-families-json-encoder-decoder",
    language: "python",
    title: "Custom JSONEncoder / JSONDecoder for non-standard types",
    tag: "families",
    code: `import json
from datetime import datetime, date
from decimal import Decimal

# Custom encoder for types json doesn't handle
class AppEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (datetime, date)):
            return {'__type__': 'datetime', 'value': obj.isoformat()}
        if isinstance(obj, Decimal):
            return {'__type__': 'decimal', 'value': str(obj)}
        return super().default(obj)

data = {'created': datetime(2026, 5, 10, 12, 0), 'price': Decimal('9.99')}
encoded = json.dumps(data, cls=AppEncoder)
print(encoded)
# {"created": {"__type__": "datetime", "value": "2026-05-10T12:00:00"}, ...}

# Object hook decodes back
def object_hook(d):
    if d.get('__type__') == 'datetime':
        return datetime.fromisoformat(d['value'])
    if d.get('__type__') == 'decimal':
        return Decimal(d['value'])
    return d

restored = json.loads(encoded, object_pairs_hook=None)
restored2 = json.loads(encoded, object_hook=object_hook)
print(type(restored2['price']))   # <class 'decimal.Decimal'>`,
    explanation: "JSONEncoder.default() is called for objects that are not natively serialisable. Return a JSON-compatible value (wrap the object in a dict with a type tag). object_hook in json.loads is called for every decoded dict, allowing type-tagged dicts to be converted back to Python objects.",
  },
  {
    id: "py-families-pathlib-os-path",
    language: "python",
    title: "pathlib vs os.path: same operations, different style",
    tag: "families",
    code: `import os, pathlib

# os.path: functions, string inputs
path_str = "/home/user/docs/report.pdf"
print(os.path.basename(path_str))          # report.pdf
print(os.path.dirname(path_str))           # /home/user/docs
print(os.path.splitext(path_str))          # ('/home/user/docs/report', '.pdf')
print(os.path.join("/home/user", "docs"))  # /home/user/docs

# pathlib.Path: OOP, composable
p = pathlib.Path("/home/user/docs/report.pdf")
print(p.name)       # report.pdf
print(p.parent)     # /home/user/docs
print(p.suffix)     # .pdf
print(p.stem)       # report
print(p / "backup") # /home/user/docs/report.pdf/backup  (NOTE: appends)

# New path operations pathlib makes easy
new_name = p.with_suffix(".docx")       # /home/user/docs/report.docx
backup   = p.with_name("backup.pdf")    # /home/user/docs/backup.pdf
print(new_name)
print(backup)

# Both can check existence:
print(p.exists())                       # False (hypothetical path)
print(os.path.exists(path_str))         # False`,
    explanation: "os.path is function-based and works on strings; pathlib.Path is object-oriented, allows method chaining, and provides richer operations (with_suffix, with_name, glob, rglob). The / operator composes paths. pathlib is preferred for new code; os.path is still common in legacy code and works with str-only APIs.",
  },
  {
    id: "py-families-threading-vs-asyncio",
    language: "python",
    title: "Threading vs asyncio: when to use which for concurrency",
    tag: "families",
    code: `import threading, asyncio, time, concurrent.futures

# Threading: best for blocking I/O (calls that release the GIL)
def blocking_fetch(url: str) -> str:
    time.sleep(0.05)   # simulate blocking network call
    return f"result:{url}"

# Parallel blocking calls with threads
urls = [f"url{i}" for i in range(5)]
start = time.monotonic()
with concurrent.futures.ThreadPoolExecutor(5) as pool:
    results = list(pool.map(blocking_fetch, urls))
print(f"threads: {time.monotonic()-start:.2f}s")   # ~0.05s

# asyncio: best for async I/O (coroutines, awaitable libs)
async def async_fetch(url: str) -> str:
    await asyncio.sleep(0.05)   # non-blocking wait
    return f"async:{url}"

async def main():
    start = time.monotonic()
    results = await asyncio.gather(*[async_fetch(u) for u in urls])
    print(f"asyncio: {time.monotonic()-start:.2f}s")   # ~0.05s
    return results

asyncio.run(main())

# CPU-bound: use ProcessPoolExecutor (bypasses GIL)
def cpu_work(n): return sum(range(n))
with concurrent.futures.ProcessPoolExecutor() as pool:
    list(pool.map(cpu_work, [10**6]*4))`,
    explanation: "Use threading for blocking library calls that release the GIL (database drivers, file I/O, requests). Use asyncio for async libraries (aiohttp, asyncpg) — same thread, cooperative multitasking. Use ProcessPoolExecutor for CPU-bound work that needs true parallelism. Mixing blocking calls in asyncio blocks the event loop.",
  },
  {
    id: "py-families-list-dict-set-creation",
    language: "python",
    title: "Five ways to create Python collections and their performance",
    tag: "families",
    code: `import timeit

# list: literal (fastest), list(), range, comprehension, map
lst1 = [1, 2, 3, 4, 5]               # literal
lst2 = list(range(1, 6))             # from iterable
lst3 = [x for x in range(1, 6)]     # comprehension
lst4 = list(map(lambda x: x, range(1, 6)))  # map (slowest here)

# dict: literal, dict(), comprehension, fromkeys, zip
d1 = {'a': 1, 'b': 2}                       # literal (fastest)
d2 = dict(a=1, b=2)                          # keyword args
d3 = dict([('a', 1), ('b', 2)])              # from pairs
d4 = {k: v for k, v in [('a', 1), ('b', 2)]}  # comprehension
d5 = dict.fromkeys(['a', 'b'], 0)            # same value for all keys

# set: literal (fastest), set(), comprehension, frozenset
s1 = {1, 2, 3}
s2 = set([1, 2, 3])
s3 = {x for x in [1, 2, 2, 3]}

print(lst1, d1, s1)
print(d5)   # {'a': 0, 'b': 0}`,
    explanation: "Literal syntax ({}, [], {k:v}) is fastest because the bytecode is a single BUILD_LIST/BUILD_MAP/BUILD_SET instruction. dict() with keyword args converts to a dict but incurs function call overhead. dict.fromkeys is useful for creating a dict of None or a shared default. Comprehensions are readable and fast for transformed data.",
  },
  {
    id: "py-classes-abstract-factory",
    language: "python",
    title: "Abstract factory via ABCs for pluggable storage backends",
    tag: "classes",
    code: `from abc import ABC, abstractmethod
from typing import Protocol

class Store(ABC):
    @abstractmethod
    def get(self, key: str) -> str | None: ...

    @abstractmethod
    def set(self, key: str, value: str) -> None: ...

    @abstractmethod
    def delete(self, key: str) -> None: ...

class DictStore(Store):
    def __init__(self):
        self._data: dict[str, str] = {}
    def get(self, key): return self._data.get(key)
    def set(self, key, value): self._data[key] = value
    def delete(self, key): self._data.pop(key, None)

class App:
    def __init__(self, store: Store):
        self._store = store

    def cache_user(self, user_id: str, name: str) -> None:
        self._store.set(f"user:{user_id}", name)

    def get_user(self, user_id: str) -> str | None:
        return self._store.get(f"user:{user_id}")

app = App(DictStore())
app.cache_user("1", "Alice")
print(app.get_user("1"))   # Alice
print(app.get_user("2"))   # None`,
    explanation: "Defining the storage contract as an ABC lets you swap backends (in-memory, Redis, SQL) by passing a different Store implementation. The App class is tested with DictStore and deployed with a real store, without changing App's code. The @abstractmethod decorator enforces that all methods are implemented.",
  },
  {
    id: "py-classes-property-cached",
    language: "python",
    title: "@functools.cached_property: lazy property computed once",
    tag: "classes",
    code: `import functools, math, time

class Circle:
    def __init__(self, radius: float):
        self.radius = radius

    @functools.cached_property
    def area(self) -> float:
        print("computing area...")   # runs only once
        return math.pi * self.radius ** 2

    @functools.cached_property
    def perimeter(self) -> float:
        return 2 * math.pi * self.radius

c = Circle(5)
print(c.area)      # computing area... then 78.54...
print(c.area)      # 78.54... (cached, no "computing" message)
print(c.perimeter) # computed once

# Stored in __dict__: cache can be invalidated by deletion
del c.area         # removes from __dict__, next access recomputes
print(c.area)      # computing area... again

# NOTE: cached_property requires __dict__ (incompatible with __slots__)
# NOTE: not thread-safe; use threading.Lock or regular @property + lru_cache`,
    explanation: "@cached_property (Python 3.8+) computes the property value on first access and stores it in the instance's __dict__ under the property name. Subsequent accesses hit __dict__ directly, bypassing the descriptor. Delete the key to invalidate. It's incompatible with __slots__ and not thread-safe.",
  },
  {
    id: "py-classes-dunder-getattr-getattribute",
    language: "python",
    title: "__getattr__ vs __getattribute__: missing vs all attribute access",
    tag: "classes",
    code: `class Logged:
    """__getattribute__ intercepts ALL attribute access."""
    def __init__(self, x):
        # Must use object.__setattr__ to avoid infinite recursion
        object.__setattr__(self, 'x', x)

    def __getattribute__(self, name):
        print(f"getting {name!r}")
        return object.__getattribute__(self, name)   # delegate to default

class Dynamic:
    """__getattr__ is called only for MISSING attributes."""
    def __init__(self):
        self._data = {}

    def __getattr__(self, name):
        if name in self._data:
            return self._data[name]
        raise AttributeError(f"no attribute {name!r}")

    def __setattr__(self, name, value):
        if name.startswith('_'):
            super().__setattr__(name, value)
        else:
            self._data[name] = value

d = Dynamic()
d.foo = 42     # stored in _data
print(d.foo)   # 42 (found in _data via __getattr__)
d.bar          # AttributeError`,
    explanation: "__getattribute__ intercepts every attribute access, including existing ones; override it carefully to avoid infinite recursion (call object.__getattribute__). __getattr__ is only called when normal attribute lookup fails, making it safer for dynamic attribute dispatch like proxies and ORMs.",
  },
  {
    id: "py-classes-repr-vs-str",
    language: "python",
    title: "__repr__ for developers, __str__ for end users",
    tag: "classes",
    code: `class Connection:
    def __init__(self, host: str, port: int, tls: bool = True):
        self.host = host
        self.port = port
        self.tls  = tls

    def __repr__(self) -> str:
        # Ideally reproducible: eval(repr(obj)) recreates the object
        return f"Connection({self.host!r}, {self.port}, tls={self.tls!r})"

    def __str__(self) -> str:
        # Human-readable: what a user sees
        scheme = "https" if self.tls else "http"
        return f"{scheme}://{self.host}:{self.port}"

c = Connection("example.com", 443)

print(repr(c))   # Connection('example.com', 443, tls=True)
print(str(c))    # https://example.com:443
print(c)         # https://example.com:443 (print calls str)

# !r in f-strings calls repr()
print(f"connecting to {c!r}")  # connecting to Connection('example.com', 443, tls=True)
print(f"connecting to {c!s}")  # connecting to https://example.com:443

# Without __str__, Python falls back to __repr__
# Without __repr__, Python shows <ClassName object at 0x...>`,
    explanation: "__repr__ should produce an unambiguous, ideally eval-able representation for debugging. __str__ should produce a human-friendly string for display. When __str__ is missing, Python uses __repr__ as fallback. The !r format spec in f-strings calls repr() on the value explicitly.",
  },
  {
    id: "py-classes-dunder-len-contains",
    language: "python",
    title: "__len__ and __contains__ make custom classes work with len() and 'in'",
    tag: "classes",
    code: `class TagSet:
    """A case-insensitive set of tags."""
    def __init__(self, *tags: str):
        self._tags = frozenset(t.lower() for t in tags)

    def __len__(self) -> int:
        return len(self._tags)

    def __contains__(self, item: object) -> bool:
        if not isinstance(item, str):
            return False
        return item.lower() in self._tags

    def __iter__(self):
        return iter(sorted(self._tags))

    def __repr__(self) -> str:
        return f"TagSet({', '.join(repr(t) for t in self)})"

ts = TagSet("Python", "Django", "REST")
print(len(ts))          # 3
print("python" in ts)   # True  (case-insensitive)
print("DJANGO" in ts)   # True
print("flask" in ts)    # False
print(list(ts))         # ['django', 'python', 'rest']  (sorted)
print(bool(ts))         # True (len > 0)
print(bool(TagSet()))   # False (len == 0)`,
    explanation: "__len__ enables len(obj) and determines truthiness when __bool__ is not defined (empty = False). __contains__ enables the 'in' operator; without it, Python falls back to iterating with __iter__. Defining __contains__ explicitly is important for O(1) membership tests on sets and dicts.",
  },
  {
    id: "py-snippet-sys-intern",
    language: "python",
    title: "sys.intern caches identical strings to speed up comparisons",
    tag: "snippet",
    code: `import sys

# intern forces string to be interned (shared in the pool)
a = sys.intern("frequently_used_key")
b = sys.intern("frequently_used_key")

# Now reference comparison works (is) instead of value comparison
print(a is b)    # True  (same object in pool)
print(a == b)    # True  (also equal by value)

# Without intern, runtime strings may or may not be interned
x = "hello" + ""
y = "hello" + ""
print(x is y)   # False (runtime-created strings are NOT interned)

# Performance benefit: 'is' is O(1), '==' may scan the whole string
words = ["apple", "banana"] * 100_000
interned_words = [sys.intern(w) for w in words]

import timeit
# is-comparison after interning vs string equality without
t1 = timeit.timeit(lambda: sum(1 for w in interned_words if w is "apple"), number=5)
t2 = timeit.timeit(lambda: sum(1 for w in words if w == "apple"), number=5)
print(f"intern: {t1:.3f}s, equality: {t2:.3f}s")`,
    explanation: "sys.intern stores a string in a global pool and returns the canonical copy. Interned strings of the same value are guaranteed to be the same object, making identity comparison (is) valid and faster than value comparison (==) for long strings. Useful for dict keys and frequently-compared strings in parsers.",
  },
  {
    id: "py-snippet-reprlib-repr",
    language: "python",
    title: "reprlib.repr limits repr() output for large data structures",
    tag: "snippet",
    code: `import reprlib

# reprlib.repr truncates long structures with ellipsis
big_list = list(range(1000))
print(repr(big_list)[:50])           # [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, ...
print(reprlib.repr(big_list))        # [0, 1, 2, 3, 4, 5, 6, ...]

big_dict = {str(i): i for i in range(100)}
print(reprlib.repr(big_dict))        # {'0': 0, '1': 1, '2': 2, ...}

nested = [[list(range(20))] * 5] * 5
print(reprlib.repr(nested))
# [[[0, 1, 2, ...], [0, 1, 2, ...], ...], ...]

# Customise limits with a Repr instance
r = reprlib.Repr()
r.maxlist = 3
r.maxstring = 20
print(r.repr(list(range(10))))         # [0, 1, 2, ...]
print(r.repr("a" * 50))               # 'aaaaaaaaaaaaaaaaaaaa...'

# Used internally by traceback and pdb for display`,
    explanation: "reprlib.repr is like repr() but truncates long sequences, dicts, and strings with '...' to prevent overwhelming output. It's used internally by Python's traceback module. Customise the limits by creating a Repr() instance and adjusting maxlist, maxdict, maxstring, etc.",
  },
  {
    id: "py-snippet-textwrap-wrap",
    language: "python",
    title: "textwrap.wrap and fill for text formatting",
    tag: "snippet",
    code: `import textwrap

text = """Python is a high-level, general-purpose programming language. \
Its design philosophy emphasises code readability with the use of significant indentation."""

# wrap: returns list of lines
lines = textwrap.wrap(text, width=50)
for line in lines:
    print(line)
# Python is a high-level, general-purpose
# programming language. Its design philosophy
# emphasises code readability with the use of
# significant indentation.

# fill: returns a single wrapped string
print(textwrap.fill(text, width=50, initial_indent="  "))

# dedent: strips common leading whitespace (useful for docstrings)
code = """
    def hello():
        print("hi")
"""
print(textwrap.dedent(code))

# indent: add prefix to each line
prefixed = textwrap.indent("line 1\nline 2", prefix="> ")
print(prefixed)`,
    explanation: "textwrap.wrap returns a list of lines; fill joins them back with newlines. initial_indent applies to the first line, subsequent_indent to the rest. dedent strips common leading whitespace (useful for cleansing heredoc strings). indent adds a prefix, optionally conditional on a predicate.",
  },
  {
    id: "py-snippet-gc-collect",
    language: "python",
    title: "gc module controls cyclic garbage collection",
    tag: "snippet",
    code: `import gc

# gc tracks objects involved in reference cycles
print(gc.isenabled())     # True (automatic GC is on by default)

# Count objects in each generation
print(gc.get_count())     # (gen0, gen1, gen2) counts

# Force a full collection (gen2 = full scan)
collected = gc.collect()
print(f"collected {collected} objects")

# gc.get_referrers: find what holds a reference
class Node:
    def __init__(self, name):
        self.name = name
        self.next = None   # will form a cycle

a = Node("A")
b = Node("B")
a.next = b
b.next = a   # cycle: a -> b -> a

del a, del b   # references dropped but cycle prevents immediate collection
print(gc.collect())   # frees the cycle

# Disable GC for performance-critical sections (re-enable after!)
gc.disable()
try:
    pass  # no cycles created here
finally:
    gc.enable()`,
    explanation: "Python uses reference counting plus a cyclic garbage collector for reference cycles. gc.collect() runs the cycle detector immediately. gc.get_referrers() helps find unexpected references. Temporarily disabling GC with gc.disable() can reduce pause times in latency-sensitive sections if you know no cycles are created.",
  },
  {
    id: "py-types-paramspec",
    language: "python",
    title: "ParamSpec captures parameter signatures for decorator typing",
    tag: "types",
    code: `from typing import ParamSpec, Callable, TypeVar
import functools

P = ParamSpec('P')
R = TypeVar('R')

def log_calls(fn: Callable[P, R]) -> Callable[P, R]:
    @functools.wraps(fn)
    def wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
        print(f"calling {fn.__name__}{args}")
        result = fn(*args, **kwargs)
        print(f"  -> {result!r}")
        return result
    return wrapper

@log_calls
def add(x: int, y: int) -> int:
    return x + y

result = add(3, 4)
# calling add(3, 4)
#   -> 7
print(result)   # 7

# Type checker knows: log_calls(add) returns (x: int, y: int) -> int
# not (args, kwargs) -> int -- the signature is preserved!

@log_calls
def greet(name: str, greeting: str = "Hello") -> str:
    return f"{greeting}, {name}!"`,
    explanation: "ParamSpec (PEP 612, Python 3.10+) captures the parameter specification of a callable so decorators can be typed precisely. P.args and P.kwargs in the wrapper preserve the original function's parameter signature, allowing type checkers to verify that decorated functions are called with the correct arguments.",
  },
  {
    id: "py-types-self-type",
    language: "python",
    title: "typing.Self for methods that return the same type as self",
    tag: "types",
    code: `from typing import Self

class Builder:
    def __init__(self):
        self._parts: list[str] = []

    def add(self, part: str) -> Self:
        self._parts.append(part)
        return self   # returns the same instance

    def build(self) -> str:
        return ' '.join(self._parts)

class ExtendedBuilder(Builder):
    def add_twice(self, part: str) -> Self:
        return self.add(part).add(part)

# Type checker knows result is ExtendedBuilder, not Builder
eb = ExtendedBuilder()
result = eb.add_twice("hello").add("world").build()
print(result)   # hello hello world

# Without Self:
# def add(self, part: str) -> 'Builder': ...
# Then ExtendedBuilder().add("x") would be typed as Builder,
# losing the ExtendedBuilder type after chaining

# Also useful for classmethods that create instances
class Config:
    @classmethod
    def from_dict(cls, data: dict) -> Self:
        obj = cls()
        return obj`,
    explanation: "Self (PEP 673, Python 3.11+) is a type alias for the class in which it's used; in subclasses, it refers to the subclass. This enables fluent builder chains to retain the correct derived type after each method call. Previously, developers used TypeVar('T', bound='ClassName') for the same effect.",
  },
  {
    id: "py-classes-descriptor-full",
    language: "python",
    title: "Full data descriptor: __get__, __set__, __delete__",
    tag: "classes",
    code: `class UnitLength:
    """Stores length in metres; exposes properties in metres, cm, and inches."""

    def __set_name__(self, owner, name):
        self._attr = f"_{name}_m"

    def __get__(self, obj, objtype=None):
        if obj is None: return self
        return getattr(obj, self._attr, 0.0)

    def __set__(self, obj, value: float):
        if value < 0:
            raise ValueError("length cannot be negative")
        setattr(obj, self._attr, float(value))

    def __delete__(self, obj):
        # Reset to 0 instead of deleting
        setattr(obj, self._attr, 0.0)

class Rectangle:
    width  = UnitLength()
    height = UnitLength()

r = Rectangle()
r.width  = 2.5     # stored as _width_m
r.height = 1.8

print(r.width)               # 2.5
print(r.width * 100)         # 250.0 cm
print(r.width / 0.0254)      # ~98.4 inches

del r.width
print(r.width)               # 0.0  (reset by __delete__)`,
    explanation: "A full data descriptor implements __get__, __set__, and __delete__. The __delete__ hook runs when 'del obj.attr' is executed; you can choose to reset to a default rather than truly deleting. Data descriptors (those with __set__ or __delete__) take precedence over the instance dict.",
  },
  {
    id: "py-classes-iterator-class",
    language: "python",
    title: "Iterator protocol: __iter__ + __next__ on a class",
    tag: "classes",
    code: `class Fibonacci:
    """Infinite Fibonacci number iterator."""
    def __init__(self):
        self._a, self._b = 0, 1

    def __iter__(self):
        return self   # iterator is its own iterable

    def __next__(self):
        value = self._a
        self._a, self._b = self._b, self._a + self._b
        return value

fib = Fibonacci()
first10 = [next(fib) for _ in range(10)]
print(first10)   # [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]

# Use with itertools.islice to take from an infinite iterator
import itertools
print(list(itertools.islice(Fibonacci(), 7)))   # [0, 1, 1, 2, 3, 5, 8]

# For finite iterators: raise StopIteration when done
class CountDown:
    def __init__(self, start):
        self._n = start
    def __iter__(self): return self
    def __next__(self):
        if self._n <= 0: raise StopIteration
        self._n -= 1
        return self._n + 1

print(list(CountDown(5)))   # [5, 4, 3, 2, 1]`,
    explanation: "An iterator implements __iter__ (returns self) and __next__ (returns the next value or raises StopIteration). A class that separates the iterable (__iter__ returning a new iterator) from the iterator allows multiple independent iterations. Infinite iterators work with itertools.islice and takewhile.",
  },
  {
    id: "py-understanding-walrus-comprehension",
    language: "python",
    title: "Walrus operator in comprehensions for intermediate results",
    tag: "understanding",
    code: `import re

lines = [
    "ERROR: disk full",
    "INFO: service started",
    "WARNING: low memory",
    "ERROR: connection refused",
    "DEBUG: cache hit",
]

# Without walrus: compute the match twice
errors = [line for line in lines if re.match(r"ERROR", line)]

# With walrus: compute once, use in filter and transform
# :=  assigns AND returns the value in the same expression
error_msgs = [
    m.group(0) + ": " + line.split(": ", 1)[1]
    for line in lines
    if (m := re.match(r"ERROR|WARNING", line))
]
print(error_msgs)
# ['ERROR: disk full', 'WARNING: low memory', 'ERROR: connection refused']

# Walrus in while loop for streaming reads (classic pattern)
import io
stream = io.StringIO("chunk1\nchunk2\nchunk3\n")
while chunk := stream.readline():
    print(chunk.strip())`,
    explanation: "The walrus operator (:=) assigns a value to a variable and returns it in the same expression. In comprehensions, it lets you capture an intermediate result (like a regex match) in the filter clause and reuse it in the output expression, avoiding computing it twice.",
  },
  {
    id: "py-snippet-operator-methodcaller",
    language: "python",
    title: "operator.methodcaller creates a reusable method call object",
    tag: "snippet",
    code: `import operator

# methodcaller(name, *args, **kwargs) creates a callable that calls name on its argument
upper = operator.methodcaller('upper')
print(upper('hello'))   # HELLO

strip_x = operator.methodcaller('strip', 'x')
print(strip_x('xxxhelloxxx'))   # hello

words = ['banana', 'Apple', 'cherry', 'Date']

# Sort case-insensitively using methodcaller
sorted_words = sorted(words, key=operator.methodcaller('lower'))
print(sorted_words)   # ['Apple', 'banana', 'cherry', 'Date']

# Replace method reference in map
lines = ['  hello  ', '  world  ', '  python  ']
stripped = list(map(operator.methodcaller('strip'), lines))
print(stripped)   # ['hello', 'world', 'python']

# vs lambda: methodcaller is slightly faster and avoids the lambda overhead
# operator.methodcaller('upper') == lambda s: s.upper()`,
    explanation: "operator.methodcaller(name, *args) creates a callable that calls the named method with the given arguments on whatever object it's applied to. It's slightly faster than an equivalent lambda and expresses intent more clearly. Useful in map(), sorted(key=...), and filter().",
  },
  {
    id: "py-snippet-itertools-zip-longest",
    language: "python",
    title: "itertools.zip_longest fills short iterables with a fill value",
    tag: "snippet",
    code: `from itertools import zip_longest

# zip stops at the shortest iterable
a = [1, 2, 3, 4, 5]
b = ['a', 'b', 'c']
print(list(zip(a, b)))   # [(1,'a'), (2,'b'), (3,'c')]  -- 4,5 dropped!

# zip_longest continues to the longest, filling with fillvalue
print(list(zip_longest(a, b, fillvalue=0)))
# [(1,'a'), (2,'b'), (3,'c'), (4,0), (5,0)]

# Useful for diffing two sequences of different lengths
old = ["v1", "v2", "v3"]
new = ["v1", "v2-updated", "v3", "v4"]
for i, (o, n) in enumerate(zip_longest(old, new, fillvalue="(missing)")):
    if o != n:
        print(f"[{i}] {o!r} -> {n!r}")
# [1] 'v2' -> 'v2-updated'
# [3] '(missing)' -> 'v4'

# Transpose a jagged 2D list
rows = [[1, 2, 3], [4, 5], [6]]
cols = list(zip_longest(*rows, fillvalue=0))
print(cols)   # [(1,4,6), (2,5,0), (3,0,0)]`,
    explanation: "itertools.zip_longest pads shorter iterables with a fillvalue (default None) so the result has the length of the longest input. Unlike zip, no data is silently dropped. It's useful for comparing sequences of different lengths and transposing jagged matrices.",
  },
  {
    id: "py-snippet-itertools-combinations",
    language: "python",
    title: "itertools.combinations and combinations_with_replacement",
    tag: "snippet",
    code: `from itertools import combinations, combinations_with_replacement, permutations

items = ['A', 'B', 'C', 'D']

# combinations: ordered subsets without repetition
print(list(combinations(items, 2)))
# [('A','B'), ('A','C'), ('A','D'), ('B','C'), ('B','D'), ('C','D')]

# combinations_with_replacement: repetition allowed
print(list(combinations_with_replacement(['A', 'B'], 2)))
# [('A','A'), ('A','B'), ('B','B')]

# permutations: all orderings
print(list(permutations(['X', 'Y', 'Z'], 2)))
# [('X','Y'), ('X','Z'), ('Y','X'), ('Y','Z'), ('Z','X'), ('Z','Y')]

# Count without generating: math.comb
from math import comb, perm
print(comb(4, 2))   # 6  (C(4,2))
print(perm(4, 2))   # 12 (P(4,2))

# Practical: all pairs for round-robin scheduling
teams = ['Team1', 'Team2', 'Team3', 'Team4']
schedule = list(combinations(teams, 2))
print(f"{len(schedule)} matches needed")   # 6`,
    explanation: "combinations yields r-length subsets in lexicographic order without repetition. combinations_with_replacement allows elements to be chosen more than once. permutations yields ordered arrangements. The math.comb and math.perm functions count without generating, which is faster for large inputs.",
  },
  {
    id: "py-snippet-functools-total-ordering",
    language: "python",
    title: "@functools.total_ordering fills in missing comparison methods",
    tag: "snippet",
    code: `from functools import total_ordering

@total_ordering
class Version:
    def __init__(self, major: int, minor: int, patch: int):
        self.major = major
        self.minor = minor
        self.patch = patch

    def _key(self):
        return (self.major, self.minor, self.patch)

    def __eq__(self, other):
        if not isinstance(other, Version): return NotImplemented
        return self._key() == other._key()

    def __lt__(self, other):
        if not isinstance(other, Version): return NotImplemented
        return self._key() < other._key()

    def __repr__(self):
        return f"v{self.major}.{self.minor}.{self.patch}"

# @total_ordering generates <=, >, >=, != from == and <
v1 = Version(1, 2, 3)
v2 = Version(2, 0, 0)
v3 = Version(1, 2, 3)

print(v1 < v2)   # True
print(v1 > v2)   # False
print(v1 <= v3)  # True
print(v1 >= v2)  # False

versions = [Version(2, 0, 0), Version(1, 0, 0), Version(1, 5, 0)]
print(sorted(versions))   # [v1.0.0, v1.5.0, v2.0.0]`,
    explanation: "@total_ordering (functools) generates the six comparison methods from just __eq__ and one of __lt__, __le__, __gt__, or __ge__. This avoids writing six nearly-identical comparison methods. Trade-off: slightly slower than explicitly defining all methods; use only when performance isn't critical.",
  },
  {
    id: "py-snippet-dataclasses-asdict",
    language: "python",
    title: "dataclasses.asdict and astuple for serialisation",
    tag: "snippet",
    code: `from dataclasses import dataclass, asdict, astuple, fields
import json

@dataclass
class Address:
    street: str
    city: str
    country: str

@dataclass
class Person:
    name: str
    age: int
    address: Address

p = Person("Alice", 30, Address("123 Main St", "London", "GB"))

# asdict: recursively converts to dict
d = asdict(p)
print(d)
# {'name': 'Alice', 'age': 30, 'address': {'street': '123 Main St', ...}}

# JSON serialisable
print(json.dumps(d))

# astuple: recursively converts to tuple
t = astuple(p)
print(t)   # ('Alice', 30, ('123 Main St', 'London', 'GB'))

# fields() for introspection
for f in fields(Person):
    print(f.name, f.type)
# name <class 'str'>
# age  <class 'int'>
# address <class '__main__.Address'>`,
    explanation: "dataclasses.asdict recursively converts a dataclass and nested dataclasses to a dict of plain Python types (JSON-ready). astuple does the same but as a nested tuple. Both deep-copy all fields. Use fields() to introspect field names, types, defaults, and metadata at runtime.",
  },
  {
    id: "py-understanding-import-cache",
    language: "python",
    title: "sys.modules caches imports — modifying it affects all importers",
    tag: "understanding",
    code: `import sys

# sys.modules: dict of all imported modules
print('json' in sys.modules)   # might be True or False

import json
print('json' in sys.modules)   # True after first import
print(sys.modules['json'] is json)   # True: same object

# Removing from sys.modules forces a fresh import next time
del sys.modules['json']
import json   # re-executes the module code
print(sys.modules['json'] is json)   # True again (new object)

# Trick: replace a module with a mock
class FakeOS:
    sep = '/'
    def path_join(*parts): return '/'.join(parts)

original = sys.modules.get('os')
sys.modules['os'] = FakeOS  # type: ignore
import os
print(os.sep)   # /

# Restore
sys.modules['os'] = original
import os
print(os.sep)   # original os.sep`,
    explanation: "sys.modules is the import cache. Once a module is imported, any subsequent 'import X' just retrieves sys.modules['X'] without re-executing the module file. Deleting a key forces re-import. You can replace an entry with a mock for testing, but this affects all code that imports that module in the same process.",
  },
  {
    id: "py-understanding-bool-truthy",
    language: "python",
    title: "Truthiness of custom objects: __bool__ and __len__",
    tag: "understanding",
    code: `class Empty:
    pass

class WithLen:
    def __len__(self): return 0   # empty -> falsy

class WithBool:
    def __bool__(self): return False   # always falsy

class PriorityBool:
    def __bool__(self): return True    # bool checked first
    def __len__(self): return 0        # len not used when __bool__ exists

e = Empty()
print(bool(e))          # True  (default: all objects are truthy)
print(bool(WithLen()))  # False (__len__ returns 0)
print(bool(WithBool())) # False (__bool__ returns False)
print(bool(PriorityBool()))  # True (__bool__ takes priority over __len__)

# Common truthiness rules:
# None, 0, 0.0, 0j, '', b'', [], (), {}, set() -> False
# Everything else -> True
print(bool([]))  # False
print(bool([0])) # True (list is non-empty, even if element is 0)`,
    explanation: "Python calls __bool__ first; if absent, it calls __len__ and treats 0 as False, non-zero as True; if neither exists, all instances are truthy. This explains why empty containers are falsy: list.__len__ returns 0. Custom classes should implement __bool__ for clear semantics.",
  },
  {
    id: "py-snippet-random-choices",
    language: "python",
    title: "random.choices for weighted sampling with replacement",
    tag: "snippet",
    code: `import random

# random.choices: sample k items WITH replacement
items = ['heads', 'tails']
flips = random.choices(items, k=10)
print(flips)   # e.g., ['heads', 'tails', 'heads', ...]

# Weighted sampling: weights don't need to sum to 1
prizes = ['jackpot', 'cash', 'coupon', 'nothing']
weights = [1, 5, 20, 74]   # relative probabilities
results = random.choices(prizes, weights=weights, k=100)
print({p: results.count(p) for p in prizes})
# approximately: jackpot~1, cash~5, coupon~20, nothing~74

# cumulative weights: more efficient for large weight lists
cum_weights = [1, 6, 26, 100]   # cumulative sum
result = random.choices(prizes, cum_weights=cum_weights, k=5)

# random.sample: WITHOUT replacement (no repeats)
deck = list(range(52))
hand = random.sample(deck, k=5)
print(sorted(hand))   # 5 unique cards`,
    explanation: "random.choices(population, weights) samples with replacement, applying relative weights. For efficiency with large weight lists, precompute cumulative weights. random.sample samples without replacement and raises ValueError if k > len(population). Use random.choices for any simulation that needs weighted random selection.",
  },
  {
    id: "py-snippet-secrets-token",
    language: "python",
    title: "secrets module for cryptographically secure random values",
    tag: "snippet",
    code: `import secrets

# secrets.token_urlsafe: base64url-encoded random bytes (for API keys, session tokens)
token = secrets.token_urlsafe(32)
print(token)      # e.g., 'Bj4X1mZ...' (43 chars for 32 bytes)
print(len(token)) # 43 (32 bytes -> 43 base64url chars)

# secrets.token_hex: hex-encoded random bytes
hex_token = secrets.token_hex(16)
print(hex_token)  # e.g., 'a2f3...  (32 hex chars for 16 bytes)

# secrets.choice: cryptographically secure random choice
import string
alphabet = string.ascii_letters + string.digits
password = ''.join(secrets.choice(alphabet) for _ in range(20))
print(password)   # e.g., 'K9xPq2rT...'

# secrets.compare_digest: timing-safe comparison
expected = secrets.token_urlsafe(32)
received = expected   # simulate correct token
print(secrets.compare_digest(expected, received))   # True

# DO NOT use random for security-sensitive values
# random.random() is predictable with enough samples`,
    explanation: "The secrets module uses the OS's CSPRNG (os.urandom) for values that must be unpredictable. token_urlsafe is the recommended format for API keys and password reset links. secrets.compare_digest performs a constant-time comparison to prevent timing attacks on token validation.",
  },
  {
    id: "py-understanding-exception-groups",
    language: "python",
    title: "except* handles subsets of an ExceptionGroup (Python 3.11+)",
    tag: "understanding",
    code: `# ExceptionGroup: wraps multiple exceptions (from asyncio.TaskGroup, etc.)
try:
    raise ExceptionGroup("multiple failures", [
        ValueError("bad value"),
        TypeError("wrong type"),
        ValueError("another bad value"),
    ])
except* ValueError as eg:
    # eg.exceptions: tuple of ValueError instances
    print(f"caught {len(eg.exceptions)} ValueErrors")
    for e in eg.exceptions:
        print(f"  {e}")
except* TypeError as eg:
    print(f"caught {len(eg.exceptions)} TypeErrors")

# Both except* blocks run; unmatched exceptions re-raised
# Unlike regular except, except* can have multiple matching clauses

# ExceptionGroup from asyncio.TaskGroup
import asyncio
async def main():
    try:
        async with asyncio.TaskGroup() as tg:
            tg.create_task(asyncio.sleep(0))   # succeeds
            tg.create_task(asyncio.sleep(-1))  # raises
    except* ValueError:
        pass

# asyncio.run(main())`,
    explanation: "ExceptionGroup (PEP 654, Python 3.11+) wraps multiple exceptions from concurrent operations. except* handles matching exceptions from the group; multiple except* blocks can match the same group. This enables fine-grained error handling for concurrent tasks without catching-and-inspecting a single wrapping exception.",
  },
  {
    id: "py-snippet-functools-singledispatch",
    language: "python",
    title: "@functools.singledispatch for type-based function dispatch",
    tag: "snippet",
    code: `from functools import singledispatch

@singledispatch
def describe(obj):
    """Fallback for unregistered types."""
    return f"object of type {type(obj).__name__}"

@describe.register(int)
def _(n: int) -> str:
    return f"integer: {n:,}"

@describe.register(list)
def _(items: list) -> str:
    return f"list of {len(items)} items: {items[:3]}..."

@describe.register(str)
def _(s: str) -> str:
    return f"string of {len(s)} chars: {s!r}"

print(describe(1_000_000))    # integer: 1,000,000
print(describe([1, 2, 3, 4])) # list of 4 items: [1, 2, 3]...
print(describe("hello"))      # string of 5 chars: 'hello'
print(describe(3.14))         # object of type float

# Also: singledispatchmethod for class methods
from functools import singledispatchmethod
class Serialiser:
    @singledispatchmethod
    def dump(self, obj): return str(obj)
    @dump.register(dict)
    def _(self, obj): import json; return json.dumps(obj)`,
    explanation: "@singledispatch creates a function that dispatches to a registered implementation based on the type of the first argument. It follows the MRO: if the exact type isn't registered, it searches base classes. singledispatchmethod works the same way for methods in a class.",
  },
  {
    id: "py-caveats-augmented-assign-immutable",
    language: "python",
    title: "Augmented assignment on immutables rebinds, not mutates",
    tag: "caveats",
    code: `# With immutables: += creates a new object
x = (1, 2, 3)
original_id = id(x)
x += (4, 5)   # creates a new tuple, rebinds x
print(id(x) == original_id)  # False (different object)
print(x)   # (1, 2, 3, 4, 5)

# With mutables: += mutates in place
lst = [1, 2, 3]
original_id = id(lst)
lst += [4, 5]   # calls lst.__iadd__([4, 5]) -- mutates in place
print(id(lst) == original_id)  # True (same object!)
print(lst)   # [1, 2, 3, 4, 5]

# Surprising: tuple containing a mutable
t = ([1, 2], [3, 4])
try:
    t[0] += [5]   # raises TypeError (tuple is immutable)
except TypeError:
    pass
print(t)   # ([1, 2, 5], [3, 4])  -- LIST was mutated despite the error!
# This is because: t[0].__iadd__([5]) succeeds, then t[0] = result fails`,
    explanation: "+= on an immutable type (int, str, tuple) creates a new object and rebinds the variable. On mutable types (list, dict), it calls __iadd__/__isub__ which mutates in place and returns self — the variable still points to the same object. The tuple-mutation gotcha occurs because __iadd__ runs before the tuple write attempt.",
  },
  {
    id: "py-structures-sorteddict-bisect",
    language: "python",
    title: "Maintaining a sorted dict using bisect on a keys list",
    tag: "structures",
    code: `import bisect

class SortedDict:
    """Dict with O(log n) key lookup in sorted order."""
    def __init__(self):
        self._keys = []      # sorted list of keys
        self._vals = {}      # regular dict for O(1) lookup

    def __setitem__(self, key, value):
        if key not in self._vals:
            bisect.insort(self._keys, key)   # insert in sorted position
        self._vals[key] = value

    def __getitem__(self, key):
        return self._vals[key]

    def __delitem__(self, key):
        idx = bisect.bisect_left(self._keys, key)
        if idx < len(self._keys) and self._keys[idx] == key:
            self._keys.pop(idx)
        del self._vals[key]

    def items_in_range(self, lo, hi):
        l = bisect.bisect_left(self._keys, lo)
        r = bisect.bisect_right(self._keys, hi)
        return [(k, self._vals[k]) for k in self._keys[l:r]]

sd = SortedDict()
for k, v in [('banana', 2), ('apple', 1), ('cherry', 3), ('date', 4)]:
    sd[k] = v

print(sd.items_in_range('b', 'd'))   # [('banana', 2), ('cherry', 3), ('date', 4)]`,
    explanation: "Maintaining a sorted keys list with bisect.insort gives O(n) insert (due to list shifting) but O(log n) range queries. This pattern is useful when you need both fast key lookup (dict) and efficient range iteration. For better performance, use the sortedcontainers library's SortedDict.",
  },
  {
    id: "py-understanding-gc-cycles",
    language: "python",
    title: "Reference cycles prevent immediate deallocation",
    tag: "understanding",
    code: `import gc, sys

class Node:
    def __init__(self, name):
        self.name = name
        self.other = None
    def __del__(self):
        print(f"deleting {self.name}")

# Simple reference: deleted immediately when refcount hits 0
a = Node("A")
del a   # prints: deleting A

# Cycle: neither is freed immediately (refcount never hits 0)
b = Node("B")
c = Node("C")
b.other = c
c.other = b   # cycle: b -> c -> b

del b
del c   # refcount of each is 1 (the other holds a reference)
print("after del b, c -- nodes NOT freed yet")

# Cyclic GC detects the cycle
collected = gc.collect()
print(f"gc collected {collected} objects")
# deleting B and deleting C (order not guaranteed)`,
    explanation: "CPython uses reference counting as its primary memory management strategy. Circular references (A → B → A) prevent the reference count from ever reaching zero, so the objects are never freed by the counter alone. The cyclic garbage collector (gc module) periodically detects and breaks these cycles.",
  },
  {
    id: "py-families-sorted-vs-sort",
    language: "python",
    title: "sorted() returns new list; list.sort() mutates in place",
    tag: "families",
    code: `data = [3, 1, 4, 1, 5, 9, 2, 6]

# sorted(): any iterable, returns a NEW list, original unchanged
s = sorted(data)
print(s)      # [1, 1, 2, 3, 4, 5, 6, 9]
print(data)   # [3, 1, 4, 1, 5, 9, 2, 6]  unchanged

# list.sort(): in-place, returns None (NOT the list!)
data.sort()
print(data)   # [1, 1, 2, 3, 4, 5, 6, 9]

result = [5, 3, 1].sort()   # common mistake
print(result)   # None!

# Both accept key and reverse
words = ['Banana', 'apple', 'cherry']
print(sorted(words, key=str.lower))           # ['apple', 'Banana', 'cherry']
print(sorted(words, key=str.lower, reverse=True))  # ['cherry', 'Banana', 'apple']

# sorted() works on any iterable
print(sorted({3, 1, 2}))        # [1, 2, 3]  (set -> list)
print(sorted("hello"))          # ['e', 'h', 'l', 'l', 'o']
print(sorted({'b': 2, 'a': 1})) # ['a', 'b']  (dict keys)`,
    explanation: "sorted() accepts any iterable and returns a new list; list.sort() mutates the list in place and returns None — a common mistake is to use the return value. Both use Timsort (stable, O(n log n)). Use sorted() when you need to keep the original, or when the input isn't a list.",
  },
  {
    id: "py-snippet-base64-urlsafe",
    language: "python",
    title: "base64 URL-safe encoding for tokens and query parameters",
    tag: "snippet",
    code: `import base64, secrets, json

# Standard base64 uses + and / which need URL-escaping
data = b'\\x00\\xff\\xfe\\xfd'
std = base64.b64encode(data)
print(std)            # b'AP/+/Q==' -- + and / present

# URL-safe: replaces + with - and / with _
safe = base64.urlsafe_b64encode(data)
print(safe)           # b'AP_-_Q==' -- safe for URLs

# Decode back
print(base64.urlsafe_b64decode(safe))   # original bytes

# Practical: create a signed token payload
payload = {'user_id': 42, 'exp': 9999999999}
encoded_payload = base64.urlsafe_b64encode(
    json.dumps(payload).encode()
).rstrip(b'=')   # strip padding for cleaner URLs
print(encoded_payload.decode())   # eyJ1c2VyX2lkIjogNDIsICJleHAiOiA5...

# Padding is needed to decode (re-add with % 4 trick)
def decode_b64(s: str) -> bytes:
    s += '=' * (-len(s) % 4)
    return base64.urlsafe_b64decode(s)`,
    explanation: "base64.urlsafe_b64encode replaces + with - and / with _ to produce URL-safe output. Strip padding (=) for shorter tokens; remember to re-add before decoding (the -len(s) % 4 formula calculates the missing padding). Use this for JWT payloads, signed URLs, and compact binary-to-text encoding.",
  },
  {
    id: "py-snippet-difflib-compare",
    language: "python",
    title: "difflib.unified_diff for human-readable text diffs",
    tag: "snippet",
    code: `import difflib

old = """def greet(name):
    return "Hello " + name

def farewell(name):
    return "Goodbye " + name
""".splitlines(keepends=True)

new = """def greet(name: str) -> str:
    return f"Hello, {name}!"

def farewell(name: str) -> str:
    return f"Goodbye, {name}!"
""".splitlines(keepends=True)

# unified_diff: standard diff format (like git diff)
diff = difflib.unified_diff(old, new, fromfile='a.py', tofile='b.py', lineterm='')
print('\\n'.join(list(diff)[:15]))

# SequenceMatcher for similarity ratio
sm = difflib.SequenceMatcher(None, "kitten", "sitting")
print(f"similarity: {sm.ratio():.2f}")   # 0.62

# get_close_matches for fuzzy matching
words = ['python', 'java', 'javascript', 'perl', 'ruby']
print(difflib.get_close_matches('jav', words, n=2, cutoff=0.6))
# ['java', 'javascript']`,
    explanation: "difflib.unified_diff generates standard unified diff output (the format used by git diff). SequenceMatcher.ratio() gives a similarity score 0–1. get_close_matches finds the closest matches from a list using SequenceMatcher, useful for spell-checking, command-line argument suggestions, and search.",
  },
  {
    id: "py-families-range-enumerate-zip",
    language: "python",
    title: "range vs enumerate vs zip: choosing the right loop pattern",
    tag: "families",
    code: `items = ['a', 'b', 'c', 'd']

# range(len(...)): needed only when you modify items in-place
for i in range(len(items)):
    items[i] = items[i].upper()
print(items)   # ['A', 'B', 'C', 'D']

# enumerate: when you need both index and value (read-only)
for i, item in enumerate(items, start=1):
    print(f"{i}: {item}")
# 1: A, 2: B, 3: C, 4: D

# zip: iterate two sequences together
keys   = ['name', 'age', 'city']
values = ['Alice', 30, 'London']
record = dict(zip(keys, values))
print(record)   # {'name': 'Alice', 'age': 30, 'city': 'London'}

# Nested zip for matrix columns
matrix = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]
transposed = [list(col) for col in zip(*matrix)]
print(transposed)   # [[1,4,7], [2,5,8], [3,6,9]]

# When to use each:
# range:     index arithmetic or in-place mutation
# enumerate: need index + value simultaneously
# zip:       parallel iteration over multiple sequences`,
    explanation: "range(len(x)) is only needed for in-place modification; prefer enumerate for index+value iteration (more readable, slightly faster). zip pairs items from multiple iterables with no index needed. Choosing the right pattern makes code clearer and avoids off-by-one bugs.",
  },
  {
    id: "py-types-pep-654-exceptgroup",
    language: "python",
    title: "ExceptionGroup and BaseExceptionGroup for structured errors",
    tag: "types",
    code: `# ExceptionGroup is a subclass of Exception (can be caught by except Exception)
eg1 = ExceptionGroup("validation", [
    ValueError("field 'age' must be positive"),
    TypeError("field 'name' must be string"),
])
print(eg1)
print(type(eg1))   # <class 'ExceptionGroup'>
print(isinstance(eg1, Exception))   # True

# BaseExceptionGroup: can wrap BaseExceptions (like SystemExit, KeyboardInterrupt)
beg = BaseExceptionGroup("critical", [SystemExit(1)])
print(isinstance(beg, BaseException))   # True
print(isinstance(beg, Exception))       # False (doesn't inherit Exception)

# Subgroup: filter exceptions by type
eg2 = ExceptionGroup("mixed", [
    ValueError("v1"), TypeError("t1"), ValueError("v2")
])
val_only, rest = eg2.split(ValueError)
print(val_only)   # ExceptionGroup('mixed', [ValueError('v1'), ValueError('v2')])
print(rest)       # ExceptionGroup('mixed', [TypeError('t1')])

# derive: transform exceptions in a group
mapped = eg2.derive([str(e) for e in eg2.exceptions])`,
    explanation: "ExceptionGroup wraps a list of exceptions and can be filtered with .split(ExcType) which returns (matched, unmatched) sub-groups. except* handles the matched exceptions and re-raises the rest. BaseExceptionGroup wraps BaseExceptions including SystemExit and KeyboardInterrupt.",
  },
  {
    id: "py-structures-dataclass-field-default",
    language: "python",
    title: "dataclasses.field for per-instance mutable defaults",
    tag: "structures",
    code: `from dataclasses import dataclass, field
from typing import ClassVar

@dataclass
class Task:
    title: str
    # WRONG: mutable default is a ValueError
    # tags: list[str] = []   # ValueError: mutable default not allowed

    # CORRECT: use field(default_factory=...)
    tags: list[str] = field(default_factory=list)
    priority: int   = field(default=5)
    metadata: dict  = field(default_factory=dict, repr=False)  # excluded from repr

    # Compare=False: ignored in __eq__
    _id: int = field(default=0, compare=False, init=False)

    def __post_init__(self):
        self._id = id(self)   # assign after init

t1 = Task("Buy groceries")
t2 = Task("Read book", tags=["leisure"], priority=3)

t1.tags.append("shopping")
print(t1.tags)   # ['shopping']
print(t2.tags)   # []  (separate list, not shared!)

print(t1)   # Task(title='Buy groceries', tags=['shopping'], priority=5)
print(t1 == t2)   # False`,
    explanation: "field(default_factory=list) creates a fresh list for each instance, avoiding the shared-mutable-default problem. repr=False excludes a field from __repr__, compare=False excludes it from __eq__ and __hash__, and init=False means it's not an __init__ parameter (set in __post_init__).",
  },
  {
    id: "py-snippet-struct-calcsize",
    language: "python",
    title: "struct.iter_unpack for parsing binary streams",
    tag: "snippet",
    code: `import struct

# iter_unpack: parses a buffer as a sequence of fixed-size records
header_fmt = struct.Struct('!HH')   # two unsigned shorts, big-endian

# Build a binary buffer of 3 (id, value) records
data = struct.pack('!HHHHHH', 1, 100, 2, 200, 3, 300)

# iter_unpack yields a tuple for each occurrence of the format
for record_id, value in header_fmt.iter_unpack(data):
    print(f"id={record_id}, value={value}")
# id=1, value=100
# id=2, value=200
# id=3, value=300

# pack_into: write directly into a mutable buffer
buf = bytearray(6)
struct.pack_into('!HHH', buf, 0, 10, 20, 30)
print(buf.hex())   # 000a00140001e... (hex of 10, 20, 30)

print(struct.calcsize('!HH'))   # 4 bytes per record`,
    explanation: "struct.iter_unpack is the most efficient way to parse a binary buffer containing multiple identical records — it yields tuples without creating a list of all results. pack_into writes directly into a bytearray at a given offset, avoiding allocation of a new bytes object.",
  },
  {
    id: "py-understanding-name-mangling",
    language: "python",
    title: "__name mangling makes attributes class-private (not truly private)",
    tag: "understanding",
    code: `class BankAccount:
    def __init__(self, balance: float):
        self.__balance = balance   # mangled to _BankAccount__balance

    def deposit(self, amount: float) -> None:
        self.__balance += amount

    def get_balance(self) -> float:
        return self.__balance

class FraudAccount(BankAccount):
    def steal(self) -> float:
        # Cannot access __balance directly -- it's mangled to the parent's name
        try:
            return self.__balance   # AttributeError: _FraudAccount__balance
        except AttributeError:
            return -1

    def legitimate_access(self) -> float:
        return self.get_balance()   # uses public API

acct = BankAccount(1000)
acct.deposit(500)
print(acct.get_balance())         # 1500

# Mangled name is accessible (not truly private!)
print(acct._BankAccount__balance) # 1500  -- bypasses "privacy"

fraud = FraudAccount(100)
print(fraud.steal())              # -1 (attribute not found)`,
    explanation: "Double-underscore prefix triggers name mangling: __attr becomes _ClassName__attr. This prevents accidental name collision in subclasses, not true access control (the mangled name is always accessible). Single underscore (_attr) is the Python convention for 'private by convention' without mangling.",
  },
];
