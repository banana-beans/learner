import type { Snippet } from "./types";

export const pythonSnippets20260512B1: Snippet[] = [
  {
    id: "py-tomllib",
    language: "python",
    title: "tomllib — parse TOML in the standard library (3.11+)",
    tag: "snippet",
    code: `import tomllib

with open("pyproject.toml", "rb") as f:   # must open in binary mode
    data = tomllib.load(f)

print(data["project"]["name"])   # reads [project] name = "..."

# In-memory string:
text = '[server]\\nhost = "localhost"\\nport = 8080'
cfg = tomllib.loads(text)
print(cfg["server"]["port"])   # 8080`,
    explanation:
      "tomllib was added in Python 3.11 as a read-only TOML parser; it requires binary mode for files because TOML must be UTF-8 encoded.",
  },
  {
    id: "py-except-star",
    language: "python",
    title: "except* — handling ExceptionGroups (3.11+)",
    tag: "caveats",
    code: `# ExceptionGroup bundles multiple exceptions at once
try:
    raise ExceptionGroup("multi", [ValueError("bad val"), TypeError("bad type")])
except* ValueError as eg:
    print("ValueErrors:", eg.exceptions)   # (ValueError('bad val'),)
except* TypeError as eg:
    print("TypeErrors:", eg.exceptions)    # (TypeError('bad type'),)

# Both handlers run — unlike regular except which stops at first match`,
    explanation:
      "except* clauses all run (not just the first match) because an ExceptionGroup can hold many exceptions of different types simultaneously.",
  },
  {
    id: "py-asyncio-shield",
    language: "python",
    title: "asyncio.shield() — protect a coroutine from cancellation",
    tag: "snippet",
    code: `import asyncio

async def critical_work():
    await asyncio.sleep(1)
    return "done"

async def main():
    task = asyncio.create_task(critical_work())
    try:
        # shield prevents cancel from reaching critical_work
        result = await asyncio.wait_for(asyncio.shield(task), timeout=0.1)
    except asyncio.TimeoutError:
        print("timed out but task still running")
        result = await task  # wait for it to finish anyway
    print(result)            # "done"

asyncio.run(main())`,
    explanation:
      "asyncio.shield() wraps a future so that cancelling the outer wait does not cancel the inner future — useful for cleanup or commit operations that must not be interrupted.",
  },
  {
    id: "py-asyncio-as-completed",
    language: "python",
    title: "asyncio.as_completed() — yield results as each finishes",
    tag: "snippet",
    code: `import asyncio

async def fetch(n: int) -> str:
    await asyncio.sleep(n * 0.1)
    return f"result-{n}"

async def main():
    coros = [fetch(3), fetch(1), fetch(2)]
    for coro in asyncio.as_completed(coros):
        result = await coro
        print(result)   # result-1, result-2, result-3 (arrival order)

asyncio.run(main())`,
    explanation:
      "asyncio.as_completed() wraps each coroutine in a future and yields them in completion order, not submission order — ideal for processing the fastest response first.",
  },
  {
    id: "py-asyncio-barrier",
    language: "python",
    title: "asyncio.Barrier — synchronise N coroutines at a rendezvous (3.11+)",
    tag: "structures",
    code: `import asyncio

async def worker(barrier: asyncio.Barrier, n: int):
    print(f"worker {n} pre-barrier")
    await barrier.wait()             # blocks until all N arrive
    print(f"worker {n} post-barrier")

async def main():
    barrier = asyncio.Barrier(3)     # all 3 must reach wait() together
    await asyncio.gather(worker(barrier, 1), worker(barrier, 2), worker(barrier, 3))

asyncio.run(main())`,
    explanation:
      "asyncio.Barrier blocks each coroutine at wait() until the required number have arrived, then releases them all simultaneously — great for phased parallel algorithms.",
  },
  {
    id: "py-asyncio-runner",
    language: "python",
    title: "asyncio.Runner — reusable event loop context (3.11+)",
    tag: "snippet",
    code: `import asyncio

async def greet(name: str) -> str:
    await asyncio.sleep(0)
    return f"Hello, {name}"

with asyncio.Runner() as runner:
    r1 = runner.run(greet("Alice"))   # reuses the same loop
    r2 = runner.run(greet("Bob"))
    print(r1, r2)   # Hello, Alice   Hello, Bob`,
    explanation:
      "asyncio.Runner keeps the event loop alive across multiple run() calls, avoiding the per-call loop creation overhead of asyncio.run() when you need to run several top-level coroutines sequentially.",
  },
  {
    id: "py-asyncio-queue-join",
    language: "python",
    title: "asyncio.Queue.join() and task_done() — work-queue pattern",
    tag: "structures",
    code: `import asyncio

async def consumer(q: asyncio.Queue):
    while True:
        item = await q.get()
        print(f"processing {item}")
        await asyncio.sleep(0.05)
        q.task_done()            # signal this item is done

async def main():
    q: asyncio.Queue = asyncio.Queue()
    for i in range(5):
        await q.put(i)
    worker = asyncio.create_task(consumer(q))
    await q.join()               # block until all task_done() calls
    worker.cancel()

asyncio.run(main())`,
    explanation:
      "q.join() blocks until every item placed in the queue has had q.task_done() called on it — the standard producer/consumer shutdown handshake for async queues.",
  },
  {
    id: "py-asyncio-lifoqueue",
    language: "python",
    title: "asyncio.LifoQueue — last-in first-out async queue",
    tag: "structures",
    code: `import asyncio

async def main():
    q: asyncio.LifoQueue = asyncio.LifoQueue()
    for v in [1, 2, 3]:
        await q.put(v)
    while not q.empty():
        print(await q.get())   # 3, 2, 1  (stack order)

asyncio.run(main())`,
    explanation:
      "asyncio.LifoQueue behaves like a stack: the most recently put item is the first to be retrieved, useful for DFS-style async traversals or undo stacks.",
  },
  {
    id: "py-typing-Self",
    language: "python",
    title: "typing.Self — return type for fluent builder methods (3.11+)",
    tag: "types",
    code: `from __future__ import annotations
from typing import Self

class Builder:
    def __init__(self) -> None:
        self._parts: list[str] = []

    def add(self, part: str) -> Self:   # returns the concrete subclass, not just Builder
        self._parts.append(part)
        return self

    def build(self) -> str:
        return ", ".join(self._parts)

class ExtendedBuilder(Builder):
    def add_twice(self, part: str) -> Self:
        return self.add(part).add(part)  # Self is ExtendedBuilder here

print(ExtendedBuilder().add_twice("x").build())  # x, x`,
    explanation:
      "Self refers to the class in which the method is defined when called on an instance, so subclasses that override nothing still get the correct return type without repeating a TypeVar.",
  },
  {
    id: "py-typing-Never",
    language: "python",
    title: "typing.Never — the bottom type for unreachable code (3.11+)",
    tag: "types",
    code: `from typing import Never, assert_never

def bad_input(x: Never) -> Never:
    raise AssertionError(f"unreachable: {x!r}")

def process(value: int | str) -> str:
    if isinstance(value, int):
        return str(value)
    elif isinstance(value, str):
        return value
    else:
        assert_never(value)  # type-checker knows this is Never

print(process(42))    # "42"
print(process("hi")) # "hi"`,
    explanation:
      "Never is the empty type — a function annotated to accept Never can never legally be called, and assert_never() lets type checkers verify that all union branches are handled.",
  },
  {
    id: "py-typing-LiteralString",
    language: "python",
    title: "typing.LiteralString — SQL-injection-safe string annotation (3.11+)",
    tag: "types",
    code: `from typing import LiteralString

def query(sql: LiteralString, params: tuple) -> list:
    # type checker ensures sql is a literal, not user-controlled
    print(f"Running: {sql!r} with {params}")
    return []

query("SELECT * FROM users WHERE id = ?", (42,))   # OK
# query(input("enter query: "), ())                 # type error: not literal`,
    explanation:
      "LiteralString only accepts string literals and concatenations of them — any value that could flow from user input is rejected by the type checker, preventing SQL injection at the type level.",
  },
  {
    id: "py-typing-TypeVarTuple",
    language: "python",
    title: "TypeVarTuple — variadic generics for arbitrary-length tuples (3.11+)",
    tag: "types",
    code: `from typing import TypeVarTuple, Unpack

Ts = TypeVarTuple("Ts")

def broadcast(shape: tuple[Unpack[Ts]]) -> tuple[Unpack[Ts]]:
    return shape   # preserves exact tuple element types

result = broadcast((1, 2, 3))   # inferred as tuple[int, int, int]
print(result)  # (1, 2, 3)`,
    explanation:
      "TypeVarTuple captures a variable-length sequence of types, enabling functions that preserve the full element-by-element type of arbitrary-length tuples — previously impossible with standard TypeVar.",
  },
  {
    id: "py-typing-Unpack",
    language: "python",
    title: "Unpack[Ts] — spreading TypeVarTuple into signatures",
    tag: "types",
    code: `from typing import TypeVarTuple, Unpack

Ts = TypeVarTuple("Ts")

def zip_tuples(a: tuple[Unpack[Ts]], b: tuple[Unpack[Ts]]) -> list[tuple[Unpack[Ts]]]:
    return list(zip(a, b))  # type: ignore[return-value]

pairs = zip_tuples((1, "x"), (2, "y"))
print(pairs)   # [(1, 2), ('x', 'y')]`,
    explanation:
      "Unpack[Ts] unpacks a TypeVarTuple inside a tuple type annotation, similar to *args syntax, allowing both positions to be constrained to carry the same sequence of types.",
  },
  {
    id: "py-typing-override",
    language: "python",
    title: "@override — explicit subclass method override marker (3.12+)",
    tag: "types",
    code: `from typing import override

class Base:
    def greet(self, name: str) -> str:
        return f"Hello, {name}"

class Child(Base):
    @override
    def greet(self, name: str) -> str:  # type checker verifies Base has greet
        return f"Hi, {name}!"

    # @override
    # def misspelled(self) -> str: ...  # error: no such method in Base`,
    explanation:
      "@override signals to type checkers that this method must exist in a parent class — renaming the parent method without updating children becomes a caught error rather than a silent bug.",
  },
  {
    id: "py-typing-deprecated",
    language: "python",
    title: "@deprecated — mark APIs as deprecated (3.13+)",
    tag: "types",
    code: `import warnings
from typing import deprecated

@deprecated("Use new_func() instead")
def old_func(x: int) -> int:
    warnings.warn("old_func is deprecated", DeprecationWarning, stacklevel=2)
    return x * 2

result = old_func(5)  # emits DeprecationWarning at call site
# type checkers also flag uses of old_func as deprecated`,
    explanation:
      "@deprecated communicates to both static analysis tools and runtime callers that a function should no longer be used — unlike a plain comment, it's machine-readable.",
  },
  {
    id: "py-typing-dataclass-transform",
    language: "python",
    title: "@dataclass_transform — tell type checkers about custom dataclass-like decorators",
    tag: "classes",
    code: `from typing import dataclass_transform

@dataclass_transform()    # hints to type checkers this creates dataclass semantics
def my_model(cls):
    # add __init__, __repr__, etc. dynamically
    fields = {k: v for k, v in cls.__annotations__.items()}
    def __init__(self, **kwargs):
        for k in fields:
            setattr(self, k, kwargs[k])
    cls.__init__ = __init__
    return cls

@my_model
class Point:
    x: float
    y: float

p = Point(x=1.0, y=2.0)   # type checker knows x and y are required
print(p.x, p.y)             # 1.0 2.0`,
    explanation:
      "@dataclass_transform tells type checkers like mypy or pyright that the decorated class or function produces dataclass-style __init__ signatures, enabling correct completion and type checking for custom ORMs or frameworks.",
  },
  {
    id: "py-typing-assert-type",
    language: "python",
    title: "typing.assert_type() — static type assertion at the call site",
    tag: "types",
    code: `from typing import assert_type

def double(x: int) -> int:
    return x * 2

result = double(3)
assert_type(result, int)    # type checker verifies result is int — passes
# assert_type(result, str)  # type checker would flag this as an error

# At runtime assert_type is a no-op — it only exists for static analysis`,
    explanation:
      "assert_type() is a zero-cost runtime no-op that acts as an inline type assertion for type checkers — useful for verifying inferred types in complex generic code without resorting to cast().",
  },
  {
    id: "py-math-comb",
    language: "python",
    title: "math.comb() and math.perm() — combinatorics without overflow",
    tag: "snippet",
    code: `import math

print(math.comb(10, 3))   # 120  (10 choose 3, C(10,3))
print(math.perm(10, 3))   # 720  (permutations, P(10,3) = 10!/7!)
print(math.comb(52, 5))   # 2598960  (5-card poker hands)

# Both use arbitrary precision — no integer overflow
print(math.comb(1000, 500))   # huge exact integer`,
    explanation:
      "math.comb(n, k) and math.perm(n, k) compute exact binomial coefficients and permutations using Python's arbitrary-precision integers, with no risk of overflow or floating-point error.",
  },
  {
    id: "py-math-prod",
    language: "python",
    title: "math.prod() — multiply all elements of an iterable",
    tag: "snippet",
    code: `import math

print(math.prod([1, 2, 3, 4, 5]))       # 120
print(math.prod(range(1, 11)))           # 3628800  (10!)
print(math.prod([2, 3, 4], start=10))   # 240  (10 * 2 * 3 * 4)
print(math.prod([]))                     # 1   (identity for multiplication)`,
    explanation:
      "math.prod() is the multiplicative analogue of sum() — it multiplies all values in the iterable with an optional start value, and returns 1 for an empty iterable.",
  },
  {
    id: "py-math-isclose",
    language: "python",
    title: "math.isclose() — safe floating-point equality comparison",
    tag: "caveats",
    code: `import math

a = 0.1 + 0.2
print(a == 0.3)                  # False  (float representation error)
print(math.isclose(a, 0.3))      # True   (within default rel_tol=1e-9)

# Large numbers need abs_tol too
big = 1e15
print(math.isclose(big, big + 1, rel_tol=1e-9))   # True (relative error is tiny)

# Force absolute tolerance for values near zero
print(math.isclose(1e-10, 0.0, abs_tol=1e-9))     # True`,
    explanation:
      "math.isclose(a, b) uses relative tolerance by default — good for large values — but you need abs_tol when comparing numbers near zero, where relative tolerance fails.",
  },
  {
    id: "py-decimal-context",
    language: "python",
    title: "decimal.getcontext() — configure precision and rounding",
    tag: "types",
    code: `from decimal import Decimal, getcontext, localcontext

getcontext().prec = 50   # global: 50 significant digits

x = Decimal("1") / Decimal("3")
print(x)   # 0.33333333333333333333333333333333333333333333333333

# Temporary context without mutating global:
with localcontext() as ctx:
    ctx.prec = 4
    print(Decimal("1") / Decimal("7"))  # 0.1429`,
    explanation:
      "getcontext().prec sets the global decimal precision; localcontext() creates a thread-safe temporary context so precision changes don't leak across independent calculations.",
  },
  {
    id: "py-decimal-rounding",
    language: "python",
    title: "decimal rounding modes — ROUND_HALF_EVEN vs ROUND_HALF_UP",
    tag: "caveats",
    code: `from decimal import Decimal, ROUND_HALF_EVEN, ROUND_HALF_UP, ROUND_DOWN

d = Decimal("2.5")
print(d.quantize(Decimal("1"), rounding=ROUND_HALF_EVEN))  # 2  (banker's rounding)
print(d.quantize(Decimal("1"), rounding=ROUND_HALF_UP))    # 3  (school rounding)
print(d.quantize(Decimal("1"), rounding=ROUND_DOWN))       # 2  (truncation)

d2 = Decimal("3.5")
print(d2.quantize(Decimal("1"), rounding=ROUND_HALF_EVEN)) # 4  (rounds to even)`,
    explanation:
      "ROUND_HALF_EVEN (banker's rounding) minimises cumulative error by rounding to the nearest even digit at the midpoint — the default in many financial systems, but different from the school textbook ROUND_HALF_UP.",
  },
  {
    id: "py-linecache-usage",
    language: "python",
    title: "linecache — retrieve source lines efficiently",
    tag: "snippet",
    code: `import linecache

# Fetch a specific line from a source file (1-indexed)
line = linecache.getline(__file__, 1)   # first line of this script
print(repr(line))                       # 'import linecache\\n'

# Cache is populated lazily; clear it when files change:
linecache.clearcache()

# Used internally by traceback and pdb to display source context`,
    explanation:
      "linecache caches source lines in memory so repeated accesses (e.g. from traceback formatting) avoid redundant I/O — it also handles zip-imported modules and frozen modules.",
  },
  {
    id: "py-importlib-metadata",
    language: "python",
    title: "importlib.metadata — read installed package metadata",
    tag: "snippet",
    code: `from importlib.metadata import version, requires, packages_distributions

print(version("pip"))          # e.g. "24.0"
print(requires("pip")[:2])    # first two dependency strings

# Map top-level packages to their distribution names
dist_map = packages_distributions()
print(dist_map.get("requests"))  # ['requests']`,
    explanation:
      "importlib.metadata provides the standard API for querying installed packages without importing pkg_resources — use it for plugin discovery, version checks, or generating dependency reports.",
  },
  {
    id: "py-pkgutil-walk",
    language: "python",
    title: "pkgutil.walk_packages() — discover all importable modules",
    tag: "snippet",
    code: `import pkgutil
import sys

# Walk all top-level packages in the stdlib path
stdlib_path = [p for p in sys.path if "lib" in p][:1]
for info in pkgutil.walk_packages(stdlib_path, onerror=lambda n: None):
    if info.ispkg:
        print(info.name)
        break   # just show first package

# Walk a specific package namespace:
import email
for info in pkgutil.walk_packages(email.__path__, prefix="email."):
    print(info.name)
    break`,
    explanation:
      "pkgutil.walk_packages() recursively yields ModuleInfo(finder, name, ispkg) for every importable module under a path, enabling plugin systems that auto-discover submodules without hard-coding names.",
  },
  {
    id: "py-zipapp-create",
    language: "python",
    title: "zipapp — bundle a Python app into a single executable .pyz",
    tag: "snippet",
    code: `import zipapp
import pathlib, tempfile, textwrap

# Create a minimal app directory
with tempfile.TemporaryDirectory() as d:
    src = pathlib.Path(d) / "__main__.py"
    src.write_text(textwrap.dedent("""
        print(\"Hello from zipapp!\")
    """))
    out = pathlib.Path(d) / "app.pyz"
    zipapp.create_archive(d, out)
    # run with: python app.pyz`,
    explanation:
      "zipapp.create_archive() zips an entire application directory into a .pyz file with an embedded __main__.py entry point — the Python interpreter can execute it directly with python app.pyz.",
  },
  {
    id: "py-venv-programmatic",
    language: "python",
    title: "venv.EnvBuilder — create virtual environments from Python code",
    tag: "snippet",
    code: `import venv, pathlib, sys

target = pathlib.Path("/tmp/my-venv")
builder = venv.EnvBuilder(
    with_pip=True,     # install pip in the venv
    clear=True,        # remove existing contents first
)
builder.create(str(target))
print("venv python:", target / "bin" / "python")`,
    explanation:
      "venv.EnvBuilder lets you create virtual environments programmatically — useful in setup scripts or tools that need to provision isolated Python environments without shelling out to the venv command.",
  },
  {
    id: "py-compileall-compile",
    language: "python",
    title: "compileall — pre-compile .py files to .pyc bytecode",
    tag: "snippet",
    code: `import compileall, pathlib

# Compile a single file
compileall.compile_file("mymodule.py", quiet=2)

# Compile an entire directory tree
compileall.compile_dir("src/", force=True, quiet=1)

# Equivalent CLI: python -m compileall src/
# Output: __pycache__/mymodule.cpython-312.pyc`,
    explanation:
      "compileall pre-compiles Python source to .pyc files so that the first import of a module skips parsing — useful in deployment pipelines to speed up cold start times.",
  },
  {
    id: "py-copyreg-dispatch-table",
    language: "python",
    title: "copyreg — register custom pickle/unpickle functions",
    tag: "caveats",
    code: `import copyreg, pickle

class Color:
    def __init__(self, r, g, b):
        self.r, self.g, self.b = r, g, b

def pickle_color(c: Color):
    return Color, (c.r, c.g, c.b)   # (callable, args)

copyreg.pickle(Color, pickle_color)

c = Color(255, 0, 128)
data = pickle.dumps(c)
c2 = pickle.loads(data)
print(c2.r, c2.g, c2.b)   # 255 0 128`,
    explanation:
      "copyreg.pickle() registers a reduction function for types that are not picklable by default (e.g. C extensions or classes with non-standard __init__), making them work with pickle without modifying the class.",
  },
  {
    id: "py-contextlib-aclosing",
    language: "python",
    title: "contextlib.aclosing() — guarantee aclose() on any async iterable",
    tag: "snippet",
    code: `import asyncio
from contextlib import aclosing

async def countdown(n: int):
    for i in range(n, 0, -1):
        yield i
        await asyncio.sleep(0)

async def main():
    async with aclosing(countdown(5)) as gen:
        async for value in gen:
            print(value)
            if value == 3:
                break   # aclosing ensures gen.aclose() is called

asyncio.run(main())`,
    explanation:
      "aclosing() wraps any async generator in a context manager that calls aclose() on exit — even when the loop is broken early — preventing resource leaks in async generator cleanup code.",
  },
  {
    id: "py-asyncio-subprocess-exec",
    language: "python",
    title: "asyncio.create_subprocess_exec() — non-blocking subprocess",
    tag: "snippet",
    code: `import asyncio

async def run_ls():
    proc = await asyncio.create_subprocess_exec(
        "ls", "-l",
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    stdout, stderr = await proc.communicate()
    print(stdout.decode()[:100])   # first 100 chars of output
    print("exit code:", proc.returncode)

asyncio.run(run_ls())`,
    explanation:
      "asyncio.create_subprocess_exec() launches a child process without blocking the event loop — proc.communicate() reads all stdout/stderr and waits for the process, but yields to other tasks while waiting.",
  },
  {
    id: "py-asyncio-eager-task-factory",
    language: "python",
    title: "asyncio.eager_task_factory — run synchronous start of tasks inline (3.12+)",
    tag: "caveats",
    code: `import asyncio

async def fast(n: int) -> int:
    # No await before returning — runs to completion inline with eager factory
    return n * 2

async def main():
    loop = asyncio.get_event_loop()
    loop.set_task_factory(asyncio.eager_task_factory)

    t = asyncio.create_task(fast(21))
    # With eager factory, fast() already returned before we awaited
    print(t.done())   # True — completed synchronously
    print(await t)    # 42

asyncio.run(main())`,
    explanation:
      "The eager task factory runs the synchronous prefix of a coroutine immediately (before yielding to the event loop), which can eliminate scheduling overhead for tasks that complete without any await.",
  },
  {
    id: "py-memoryview-ndim",
    language: "python",
    title: "memoryview — multi-dimensional slicing without copying",
    tag: "structures",
    code: `import array

# 2D view of a flat array: 3 rows x 4 cols
flat = array.array("i", range(12))
mv = memoryview(flat).cast("i", shape=[3, 4])

print(mv[1][2])         # 6  (row 1, col 2, zero-indexed)
print(mv.ndim)          # 2
print(mv.shape)         # (3, 4)
print(bytes(mv[0]))     # first row as bytes`,
    explanation:
      "memoryview.cast() re-interprets the same buffer with a different shape, enabling zero-copy 2D (or higher) views over flat arrays — essential for numerical code that needs to avoid expensive copies.",
  },
  {
    id: "py-buffer-protocol",
    language: "python",
    title: "buffer protocol — zero-copy access to bytes-like objects",
    tag: "understanding",
    code: `# Any bytes-like object supports the buffer protocol
import struct

data = bytearray(b"\\x01\\x00\\x00\\x00\\x02\\x00\\x00\\x00")
mv = memoryview(data)          # no copy made

# Read two little-endian ints directly from the buffer
a, b = struct.unpack_from("<ii", mv)
print(a, b)   # 1  2

# slice the view — still no copy
first_half = mv[:4]
print(bytes(first_half))  # b'\\x01\\x00\\x00\\x00'`,
    explanation:
      "The buffer protocol lets C-level objects expose their internal memory to Python without copying — memoryview, struct.unpack_from, and many C extensions exploit this to achieve zero-copy data processing.",
  },
  {
    id: "py-bytesio-usage",
    language: "python",
    title: "io.BytesIO — in-memory binary stream",
    tag: "snippet",
    code: `import io, struct

buf = io.BytesIO()
buf.write(b"header:")
struct.pack_into(">I", buf.getbuffer(), 7, 42)  # overwrite bytes in-place

buf.seek(0)
print(buf.read(7))           # b'header:'
print(struct.unpack(">I", buf.read(4)))  # (42,)

# Common use: pass to any API expecting a file-like object
buf.seek(0)
content = buf.getvalue()     # get all bytes without seek`,
    explanation:
      "io.BytesIO provides a file-like binary buffer in memory — use it to build binary data incrementally or to pass bytes to APIs that expect a file object without touching the filesystem.",
  },
  {
    id: "py-marshal-module",
    language: "python",
    title: "marshal — Python's internal bytecode serialisation",
    tag: "snippet",
    code: `import marshal

# marshal only handles simple types: int, float, str, bytes, tuple, list, dict, code
data = {"key": [1, 2, 3], "value": (4.5, True)}
serialised = marshal.dumps(data)
print(type(serialised))           # <class 'bytes'>
recovered = marshal.loads(serialised)
print(recovered == data)           # True

# marshal is NOT secure — never deserialise untrusted data`,
    explanation:
      "marshal is used internally to store compiled .pyc bytecode objects; it's faster than pickle for simple types but unsafe for untrusted input and cannot handle arbitrary class instances.",
  },
  {
    id: "py-ipaddress-network",
    language: "python",
    title: "ipaddress.IPv4Network — CIDR block operations",
    tag: "structures",
    code: `import ipaddress

net = ipaddress.IPv4Network("192.168.1.0/24")
print(net.network_address)    # 192.168.1.0
print(net.broadcast_address)  # 192.168.1.255
print(net.num_addresses)      # 256
print(net.prefixlen)          # 24

# Membership test
host = ipaddress.IPv4Address("192.168.1.55")
print(host in net)            # True

# Iterate hosts (excludes network and broadcast)
hosts = list(net.hosts())
print(hosts[0], hosts[-1])    # 192.168.1.1  192.168.1.254`,
    explanation:
      "ipaddress.IPv4Network provides CIDR-aware network objects with address iteration, membership testing, and subnetting — the standard way to do IP address arithmetic in Python without third-party libraries.",
  },
  {
    id: "py-ipaddress-overlap",
    language: "python",
    title: "ipaddress — network overlap and subnet checks",
    tag: "understanding",
    code: `import ipaddress

a = ipaddress.IPv4Network("10.0.0.0/8")
b = ipaddress.IPv4Network("10.1.0.0/16")
c = ipaddress.IPv4Network("172.16.0.0/12")

print(b.subnet_of(a))         # True  — /16 is inside /8
print(a.supernet_of(b))       # True
print(a.overlaps(c))          # False — different ranges

# Collapse overlapping networks
merged = list(ipaddress.collapse_addresses([a, b, c]))
print(merged)  # [IPv4Network('10.0.0.0/8'), IPv4Network('172.16.0.0/12')]`,
    explanation:
      "subnet_of() and supernet_of() express containment relationships between CIDR blocks; collapse_addresses() merges overlapping and adjacent networks into the minimal covering set.",
  },
  {
    id: "py-uuid-versions",
    language: "python",
    title: "uuid — v1 vs v4 vs v5 and when to use each",
    tag: "families",
    code: `import uuid

# v1: time + MAC — unique but leaks node identity and timestamp
u1 = uuid.uuid1()
print(u1, "node:", hex(u1.node))

# v4: fully random — most common for database IDs
u4 = uuid.uuid4()
print(u4)   # e.g. 550e8400-e29b-41d4-a716-446655440000

# v5: deterministic SHA-1 hash of namespace + name
u5 = uuid.uuid5(uuid.NAMESPACE_URL, "https://example.com")
print(u5)   # always the same for the same input
print(u5 == uuid.uuid5(uuid.NAMESPACE_URL, "https://example.com"))  # True`,
    explanation:
      "Use uuid4() for random identifiers with no information leakage, uuid5() when you need a deterministic ID from a name (idempotent generation), and uuid1() only when you need temporal ordering and don't mind exposing the MAC address.",
  },
  {
    id: "py-hashlib-shake",
    language: "python",
    title: "hashlib SHAKE — variable-length output digests",
    tag: "snippet",
    code: `import hashlib

data = b"hello world"

# SHAKE-128: variable length output (XOF — extendable output function)
d128 = hashlib.shake_128(data)
print(d128.hexdigest(16))   # 32 hex chars (16 bytes)
print(d128.hexdigest(32))   # 64 hex chars (32 bytes) — same prefix

# Standard fixed-length digests for comparison:
print(hashlib.sha256(data).hexdigest())   # always 64 hex chars
print(hashlib.sha3_256(data).hexdigest()) # always 64 hex chars`,
    explanation:
      "SHAKE-128 and SHAKE-256 are extendable output functions (XOFs) that produce a digest of any requested length — useful when you need a compact hash of a specific byte count without fixed algorithm constraints.",
  },
  {
    id: "py-numbers-real",
    language: "python",
    title: "numbers.ABC hierarchy — Integral, Rational, Real, Complex",
    tag: "types",
    code: `import numbers

# The abstract numeric tower (from most specific to most general):
# Integral → Rational → Real → Complex → Number

print(isinstance(42, numbers.Integral))   # True  (int)
print(isinstance(3.14, numbers.Real))     # True  (float)
print(isinstance(3+2j, numbers.Complex))  # True  (complex)
print(isinstance(3.14, numbers.Integral)) # False (float is Real, not Integral)

from fractions import Fraction
print(isinstance(Fraction(1, 3), numbers.Rational))  # True`,
    explanation:
      "The numbers module provides abstract base classes for numeric types; writing isinstance(x, numbers.Real) is more Pythonic than checking for float because it also accepts Fraction, Decimal subclasses, and third-party numeric types.",
  },
  {
    id: "py-complex-arithmetic",
    language: "python",
    title: "complex type — arithmetic and component access",
    tag: "snippet",
    code: `z1 = 3 + 4j
z2 = 1 - 2j

print(z1.real, z1.imag)      # 3.0  4.0
print(z1 + z2)               # (4+2j)
print(z1 * z2)               # (11-2j)
print(abs(z1))               # 5.0  (magnitude: sqrt(3^2 + 4^2))
print(z1.conjugate())        # (3-4j)

# Use cmath for trig/log on complex numbers
import cmath
print(cmath.phase(z1))       # 0.9272952180016122  (angle in radians)`,
    explanation:
      "Python's built-in complex type supports arithmetic natively with j notation; use abs() for the modulus, .conjugate() for the complex conjugate, and cmath for transcendental functions.",
  },
  {
    id: "py-bitwise-ops",
    language: "python",
    title: "bitwise operators — AND, OR, XOR, NOT, shifts",
    tag: "snippet",
    code: `a, b = 0b1010, 0b1100   # 10 and 12

print(bin(a & b))   # 0b1000  — AND: both bits set
print(bin(a | b))   # 0b1110  — OR:  either bit set
print(bin(a ^ b))   # 0b0110  — XOR: exactly one bit set
print(bin(~a))      # -0b1011 — NOT: ~x == -(x+1)
print(bin(a << 1))  # 0b10100 — left shift by 1 (×2)
print(bin(a >> 1))  # 0b101   — right shift by 1 (÷2)`,
    explanation:
      "Bitwise operators work on the two's-complement integer representation; ~ (NOT) produces -(x+1) which surprises many newcomers, and shifts by n are equivalent to multiplying or dividing by 2ⁿ.",
  },
  {
    id: "py-bit-length",
    language: "python",
    title: "int.bit_length() and int.bit_count() — introspect integer bits",
    tag: "snippet",
    code: `n = 0b10110100   # 180

print(n.bit_length())   # 8   — minimum bits to represent n (ignores sign)
print(n.bit_count())    # 4   — number of set bits (popcount) — Python 3.10+
print((0).bit_length()) # 0
print((-1).bit_length()) # 1  — sign ignored, magnitude = 1

# Practical: next power of two
import math
def next_pow2(x: int) -> int:
    return 1 << math.ceil(math.log2(x)) if x > 0 else 1`,
    explanation:
      "bit_length() gives the minimum number of bits needed to represent the magnitude of an integer, while bit_count() (added in 3.10) counts set bits — the latter is Python's built-in popcount.",
  },
  {
    id: "py-unicodedata-normalize",
    language: "python",
    title: "unicodedata.normalize() — NFC vs NFD decomposition",
    tag: "types",
    code: `import unicodedata

# é can be represented two ways:
composed   = "\\u00e9"       # NFC: single precomposed code point
decomposed = "e\\u0301"     # NFD: base letter + combining accent

print(composed == decomposed)   # False! same visual, different bytes
print(len(composed))             # 1
print(len(decomposed))           # 2

nfc = unicodedata.normalize("NFC", decomposed)
print(nfc == composed)           # True  (normalised to same form)`,
    explanation:
      "Unicode allows visually identical strings to differ at the code-point level through composed vs decomposed forms — always normalise to NFC or NFKC before comparing or storing user-visible text.",
  },
  {
    id: "py-unicodedata-category",
    language: "python",
    title: "unicodedata.category() — classify Unicode characters",
    tag: "snippet",
    code: `import unicodedata

chars = ["A", "a", "3", " ", "!", "\\u00e9", "\\u4e2d"]
for ch in chars:
    cat = unicodedata.category(ch)
    name = unicodedata.name(ch, "UNKNOWN")
    print(f"{ch!r}: {cat}  {name}")

# Lu=uppercase letter, Ll=lowercase, Nd=decimal digit,
# Zs=space, Po=other punctuation, Ll=lowercase, Lo=other letter`,
    explanation:
      "unicodedata.category() returns a two-letter code from the Unicode character properties table — useful for writing locale-neutral character classifiers without depending on isalpha() which varies by locale.",
  },
  {
    id: "py-locale-module",
    language: "python",
    title: "locale — locale-aware number and date formatting",
    tag: "snippet",
    code: `import locale

locale.setlocale(locale.LC_ALL, "en_US.UTF-8")  # may need to be installed

print(locale.currency(1234567.89, grouping=True))
# $1,234,567.89

print(locale.format_string("%.2f", 1234567.89, grouping=True))
# 1,234,567.89

# Read locale info
info = locale.localeconv()
print(info["thousands_sep"])  # ','
print(info["decimal_point"])  # '.'`,
    explanation:
      "The locale module formats numbers and currency according to the active locale — but setlocale() affects the entire process globally, so prefer the babel library in multi-locale applications.",
  },
  {
    id: "py-codecs-encode",
    language: "python",
    title: "codecs.encode() — text transforms via the codec system",
    tag: "snippet",
    code: `import codecs

# rot-13 text transform
print(codecs.encode("Hello, World!", "rot_13"))   # Uryyb, Jbeyq!
print(codecs.decode("Uryyb, Jbeyq!", "rot_13"))   # Hello, World!

# hex encoding
print(codecs.encode(b"\\xff\\x00", "hex"))         # b'ff00'

# Base64 via codec
print(codecs.encode(b"hello", "base64"))          # b'aGVsbG8=\\n'`,
    explanation:
      "codecs.encode/decode support a wide range of text and binary codecs beyond just character encoding — rot_13, hex, base64, zlib, and bz2 are all accessible through this single interface.",
  },
  {
    id: "py-base64-urlsafe",
    language: "python",
    title: "base64 URL-safe encoding — safe for URLs and filenames",
    tag: "snippet",
    code: `import base64

data = b"\\xfb\\xfc\\xfd\\xfe\\xff"   # bytes that produce + and / in standard b64

std = base64.b64encode(data)
url = base64.urlsafe_b64encode(data)

print(std)    # b'+/z9/v8='  — contains + and /
print(url)    # b'-_z9_v8='  — + → -, / → _ (URL-safe)

# Decode back
print(base64.urlsafe_b64decode(url) == data)   # True`,
    explanation:
      "URL-safe base64 replaces + with - and / with _ so the output can be used in URLs, filenames, and HTTP headers without percent-encoding — always use it for tokens, JWT components, or file-system keys.",
  },
  {
    id: "py-binascii-hexlify",
    language: "python",
    title: "binascii.hexlify() — bytes to hex string conversion",
    tag: "snippet",
    code: `import binascii

data = b"\\x00\\xde\\xad\\xbe\\xef"
print(binascii.hexlify(data))              # b'00deadbeef'
print(binascii.hexlify(data, ":"))         # b'00:de:ad:be:ef' — separator (3.8+)
print(binascii.unhexlify("deadbeef"))      # b'\\xde\\xad\\xbe\\xef'

# bytes.hex() is equivalent for simple cases
print(data.hex())                          # '00deadbeef'
print(data.hex(":"))                       # '00:de:ad:be:ef'`,
    explanation:
      "binascii.hexlify() predates bytes.hex() but offers the separator argument and handles bytes objects without building a full string; both are equivalent for simple hex dumps.",
  },
  {
    id: "py-zlib-compress",
    language: "python",
    title: "zlib — in-memory deflate compression and decompression",
    tag: "snippet",
    code: `import zlib

data = b"hello world " * 1000    # 12000 bytes

compressed = zlib.compress(data, level=9)    # level 0-9 (0=no compression)
print(f"original: {len(data)}, compressed: {len(compressed)}")

decompressed = zlib.decompress(compressed)
print(decompressed == data)   # True

# CRC32 for integrity check
checksum = zlib.crc32(data)
print(hex(checksum))`,
    explanation:
      "zlib.compress() is the standard way to deflate bytes in-memory (no file I/O needed) — the level parameter trades CPU time for compression ratio, with 6 being a good default balance.",
  },
  {
    id: "py-gzip-open",
    language: "python",
    title: "gzip.open() — read and write gzip files transparently",
    tag: "snippet",
    code: `import gzip, pathlib

path = pathlib.Path("/tmp/data.gz")

# Write compressed
with gzip.open(path, "wt", encoding="utf-8") as f:
    f.write("Hello compressed world\\n" * 100)

# Read compressed
with gzip.open(path, "rt", encoding="utf-8") as f:
    first_line = f.readline()
    print(first_line)   # Hello compressed world

print(path.stat().st_size)  # much smaller than raw text`,
    explanation:
      "gzip.open() accepts the same mode strings as open() but transparently compresses/decompresses data — use \"wt\"/\"rt\" for text mode and \"wb\"/\"rb\" for binary, and it handles the .gz format entirely.",
  },
  {
    id: "py-bz2-compress",
    language: "python",
    title: "bz2 — block-sorting compression (better ratio, slower than gzip)",
    tag: "snippet",
    code: `import bz2

data = b"repeated data " * 500

compressed_bz2 = bz2.compress(data)
compressed_zlib = __import__("zlib").compress(data)

print(f"bz2: {len(compressed_bz2)} bytes")    # typically smaller
print(f"zlib: {len(compressed_zlib)} bytes")

# File I/O
import bz2
with bz2.open("/tmp/test.bz2", "wt") as f:
    f.write("hello bz2\\n")`,
    explanation:
      "bz2 uses the Burrows-Wheeler block-sorting algorithm which achieves better compression ratios than zlib/gzip on text, at the cost of significantly slower compression and decompression speed.",
  },
  {
    id: "py-lzma-compress",
    language: "python",
    title: "lzma — highest compression ratio in the stdlib",
    tag: "snippet",
    code: `import lzma

data = b"highly repetitive text data " * 1000

compressed = lzma.compress(data, preset=9)  # preset 0-9
print(f"original: {len(data)}, lzma: {len(compressed)}")

# XZ format (wraps LZMA with header/checksum):
xz_data = lzma.compress(data, format=lzma.FORMAT_XZ)

# Files
with lzma.open("/tmp/test.xz", "wt") as f:
    f.write("hello xz\\n")`,
    explanation:
      "lzma achieves the highest compression ratios of the three stdlib compressors (zlib, bz2, lzma) but is the slowest — ideal for archival storage where compression ratio matters more than speed.",
  },
  {
    id: "py-tarfile-add-file",
    language: "python",
    title: "tarfile — create and extract tar archives",
    tag: "snippet",
    code: `import tarfile, pathlib, tempfile

with tempfile.TemporaryDirectory() as d:
    src = pathlib.Path(d) / "hello.txt"
    src.write_text("hello tarfile")

    # Create a .tar.gz archive
    with tarfile.open(f"{d}/archive.tar.gz", "w:gz") as tar:
        tar.add(src, arcname="hello.txt")

    # Extract it
    with tarfile.open(f"{d}/archive.tar.gz", "r:gz") as tar:
        names = tar.getnames()
        print(names)         # ['hello.txt']
        tar.extractall(d)`,
    explanation:
      "tarfile.open() accepts mode strings like 'w:gz', 'r:bz2', or 'w:xz' to combine archiving with compression in one step — always use arcname= to control the path stored inside the archive.",
  },
  {
    id: "py-zipfile-namelist",
    language: "python",
    title: "zipfile — inspect and extract ZIP archives",
    tag: "snippet",
    code: `import zipfile, tempfile, pathlib

with tempfile.TemporaryDirectory() as d:
    zpath = pathlib.Path(d) / "test.zip"
    with zipfile.ZipFile(zpath, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("a.txt", "hello")
        zf.writestr("b/c.txt", "world")

    with zipfile.ZipFile(zpath) as zf:
        print(zf.namelist())          # ['a.txt', 'b/c.txt']
        print(zf.read("a.txt"))       # b'hello'
        zf.extractall(d)`,
    explanation:
      "zipfile.ZipFile.namelist() returns all paths inside the archive; writestr() adds an in-memory string or bytes as a file entry without needing a real file on disk first.",
  },
  {
    id: "py-select-module",
    language: "python",
    title: "select.select() — I/O multiplexing for non-blocking sockets",
    tag: "snippet",
    code: `import select, socket

server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
server.bind(("127.0.0.1", 0))
server.listen(1)
server.setblocking(False)

# Wait up to 0.1 s for the server socket to become readable
readable, _, _ = select.select([server], [], [], 0.1)
if server in readable:
    conn, addr = server.accept()
else:
    print("no connection yet")

server.close()`,
    explanation:
      "select.select() blocks until one or more file descriptors are ready for I/O (or a timeout expires), enabling a single thread to serve multiple sockets — the precursor to modern epoll/kqueue-based event loops.",
  },
  {
    id: "py-socket-tcp-connect",
    language: "python",
    title: "socket — TCP client connect and send/recv",
    tag: "snippet",
    code: `import socket

with socket.create_connection(("httpbin.org", 80), timeout=5) as s:
    request = b"GET /get HTTP/1.0\\r\\nHost: httpbin.org\\r\\n\\r\\n"
    s.sendall(request)

    chunks = []
    while chunk := s.recv(4096):
        chunks.append(chunk)

response = b"".join(chunks)
print(response[:100].decode())   # HTTP/1.0 200 OK ...`,
    explanation:
      "socket.create_connection() is a high-level helper that handles address resolution and connects in one call — sendall() guarantees all bytes are sent, and recv() in a loop collects the full response.",
  },
  {
    id: "py-socket-udp-send",
    language: "python",
    title: "socket — UDP sendto / recvfrom",
    tag: "snippet",
    code: `import socket

# UDP sender
sender = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)

# UDP receiver (bind first)
receiver = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
receiver.bind(("127.0.0.1", 0))
addr = receiver.getsockname()

sender.sendto(b"hello udp", addr)
data, from_addr = receiver.recvfrom(1024)
print(data, from_addr)   # b'hello udp'  ('127.0.0.1', ephemeral_port)

sender.close()
receiver.close()`,
    explanation:
      "UDP sockets use sendto(data, address) and recvfrom(bufsize) instead of connect/send/recv — there is no connection setup, so each call specifies or returns the remote address explicitly.",
  },
  {
    id: "py-http-server-basic",
    language: "python",
    title: "http.server — minimal HTTP server in stdlib",
    tag: "snippet",
    code: `from http.server import BaseHTTPRequestHandler, HTTPServer
import threading

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        body = b"Hello from stdlib!"
        self.send_response(200)
        self.send_header("Content-Type", "text/plain")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)
    def log_message(self, *_): pass   # silence access log

server = HTTPServer(("127.0.0.1", 8765), Handler)
thread = threading.Thread(target=server.serve_forever, daemon=True)
thread.start()
print("Server started at http://127.0.0.1:8765")
server.shutdown()`,
    explanation:
      "BaseHTTPRequestHandler lets you create a minimal HTTP server without any framework — override do_GET, do_POST, etc. to handle methods; it's fine for local tooling or tests but not for production.",
  },
  {
    id: "py-xmlrpc-server-basic",
    language: "python",
    title: "xmlrpc.server — expose Python functions over XML-RPC",
    tag: "snippet",
    code: `from xmlrpc.server import SimpleXMLRPCServer
import threading

def add(x: int, y: int) -> int:
    return x + y

server = SimpleXMLRPCServer(("127.0.0.1", 8766), logRequests=False)
server.register_function(add, "math.add")
t = threading.Thread(target=server.serve_forever, daemon=True)
t.start()

# Client side:
import xmlrpc.client
proxy = xmlrpc.client.ServerProxy("http://127.0.0.1:8766")
print(proxy.math.add(3, 4))   # 7

server.shutdown()`,
    explanation:
      "SimpleXMLRPCServer exposes Python functions over the XML-RPC protocol with minimal setup — the client proxy maps method names to remote calls transparently, making it a quick way to add an RPC layer to a Python service.",
  },
  {
    id: "py-email-message-build",
    language: "python",
    title: "email.message.EmailMessage — build and parse emails",
    tag: "snippet",
    code: `from email.message import EmailMessage

msg = EmailMessage()
msg["Subject"] = "Hello from Python"
msg["From"] = "sender@example.com"
msg["To"] = "recipient@example.com"
msg.set_content("This is the plain text body.")

# Access headers
print(msg["Subject"])             # Hello from Python

# Serialise to RFC 2822 text
raw = msg.as_string()
print(raw[:60])                   # Subject: Hello from Python ...`,
    explanation:
      "EmailMessage is the modern email API that auto-handles MIME encoding and content negotiation — use it over the older MIMEText/MIMEMultipart classes, which require manual MIME assembly.",
  },
  {
    id: "py-configparser-read",
    language: "python",
    title: "configparser — read and write INI-style configuration files",
    tag: "structures",
    code: `import configparser, io

ini = """
[database]
host = localhost
port = 5432
name = mydb

[app]
debug = true
workers = 4
"""
config = configparser.ConfigParser()
config.read_string(ini)

print(config["database"]["host"])         # localhost
print(config.getint("database", "port"))  # 5432
print(config.getboolean("app", "debug"))  # True`,
    explanation:
      "configparser reads .ini / .cfg files into sections and keys — the typed getters (getint, getfloat, getboolean) convert values automatically and are safer than manually casting config[section][key].",
  },
  {
    id: "py-configparser-fallback",
    language: "python",
    title: "configparser fallback — DEFAULT section and fallback values",
    tag: "caveats",
    code: `import configparser

config = configparser.ConfigParser()
config.read_string("""
[DEFAULT]
timeout = 30
retries = 3

[server_a]
host = a.example.com

[server_b]
host = b.example.com
timeout = 60
""")

print(config["server_a"]["timeout"])  # "30"  — from DEFAULT
print(config["server_b"]["timeout"])  # "60"  — overrides DEFAULT
print(config.get("server_a", "retries", fallback="5"))  # "3" (from DEFAULT)`,
    explanation:
      "The DEFAULT section provides values that all other sections inherit; configparser merges DEFAULT into every section, which can surprise you if a key you expect to be missing is actually present via DEFAULT.",
  },
  {
    id: "py-csv-dialect",
    language: "python",
    title: "csv.register_dialect() — custom delimiters and quoting",
    tag: "snippet",
    code: `import csv, io

csv.register_dialect(
    "pipe",
    delimiter="|",
    quotechar='"',
    quoting=csv.QUOTE_MINIMAL,
    lineterminator="\\n",
)

output = io.StringIO()
writer = csv.writer(output, dialect="pipe")
writer.writerows([["Alice", "30", "NY"], ["Bob", "25", "CA"]])

print(output.getvalue())
# Alice|30|NY
# Bob|25|CA`,
    explanation:
      "csv.register_dialect() lets you define a named CSV variant once and reuse it — handy when processing legacy data formats that use non-standard delimiters like pipes or semicolons.",
  },
  {
    id: "py-cmath-polar-form",
    language: "python",
    title: "cmath — polar/rectangular conversion and complex math",
    tag: "snippet",
    code: `import cmath, math

z = 3 + 4j
r, phi = cmath.polar(z)           # r=5.0, phi≈0.9273 rad
print(f"r={r:.2f}, phi={math.degrees(phi):.1f}°")  # r=5.00, phi=53.1°

# Convert back:
print(cmath.rect(r, phi))         # (3+4j)

# Complex logarithm and exponential:
print(cmath.log(z))               # log of a complex number
print(cmath.exp(1j * math.pi))    # ≈ -1+0j  (Euler's formula: e^(iπ) = -1)`,
    explanation:
      "cmath.polar() decomposes a complex number into magnitude and phase angle; cmath.rect() inverts it — all cmath functions handle complex inputs while math functions only accept real numbers.",
  },
  {
    id: "py-match-as-assign",
    language: "python",
    title: "match … as name — bind the matched value in a case arm",
    tag: "understanding",
    code: `def describe(value):
    match value:
        case [x, y] as pair:
            return f"pair: {pair}, x={x}, y={y}"
        case {"key": v} as mapping:
            return f"dict with key={v}, full={mapping}"
        case int() as n if n > 0:
            return f"positive int: {n}"
        case _:
            return "something else"

print(describe([1, 2]))          # pair: [1, 2], x=1, y=2
print(describe({"key": "abc"}))  # dict with key=abc, full={'key': 'abc'}
print(describe(7))               # positive int: 7`,
    explanation:
      "The 'as' sub-pattern binds the entire matched value to a name after it passes the structural check, making the full object available alongside any destructured variables within the case arm.",
  },
  {
    id: "py-walrus-filter-pattern",
    language: "python",
    title: "walrus operator — filter-and-transform in one pass",
    tag: "snippet",
    code: `import re

lines = ["ERROR: disk full", "INFO: starting", "ERROR: timeout", "DEBUG: done"]

# Without walrus: two passes or nested function
errors = [m.group(1) for line in lines
          if (m := re.match(r"ERROR: (.+)", line))]

print(errors)   # ['disk full', 'timeout']

# The walrus assigns the match object AND tests truthiness in one step`,
    explanation:
      "The walrus operator (:=) lets you assign the result of an expression inside a comprehension condition and reuse it in the output expression — avoiding a second expensive call or a helper variable.",
  },
  {
    id: "py-total-ordering-deco",
    language: "python",
    title: "functools.total_ordering — define one comparison, get all six",
    tag: "classes",
    code: `from functools import total_ordering

@total_ordering
class Temperature:
    def __init__(self, celsius: float):
        self.celsius = celsius
    def __eq__(self, other) -> bool:
        return self.celsius == other.celsius
    def __lt__(self, other) -> bool:   # only ONE comparison needed
        return self.celsius < other.celsius

a = Temperature(20)
b = Temperature(30)

print(a < b)    # True
print(a <= b)   # True  — derived from __eq__ + __lt__
print(b > a)    # True  — derived
print(b >= a)   # True  — derived`,
    explanation:
      "@total_ordering fills in the missing comparison methods (__le__, __gt__, __ge__) from the two you provide (__eq__ and one of __lt__/__le__/__gt__/__ge__) — it's slightly slower than writing all six but much less code.",
  },
  {
    id: "py-singledispatch-register",
    language: "python",
    title: "functools.singledispatch — type-based function overloading",
    tag: "classes",
    code: `from functools import singledispatch

@singledispatch
def process(value):
    raise NotImplementedError(f"no handler for {type(value)}")

@process.register(int)
def _(value: int) -> str:
    return f"int: {value * 2}"

@process.register(str)
def _(value: str) -> str:
    return f"str: {value.upper()}"

@process.register(list)
def _(value: list) -> str:
    return f"list with {len(value)} items"

print(process(42))          # int: 84
print(process("hello"))     # str: HELLO
print(process([1, 2, 3]))   # list with 3 items`,
    explanation:
      "@singledispatch dispatches to the registered implementation based on the type of the first argument — use .register() to add handlers for new types without modifying the original function.",
  },
  {
    id: "py-singledispatchmethod",
    language: "python",
    title: "functools.singledispatchmethod — dispatch on method's first non-self arg",
    tag: "classes",
    code: `from functools import singledispatchmethod

class Formatter:
    @singledispatchmethod
    def format(self, value) -> str:
        return repr(value)

    @format.register(int)
    def _(self, value: int) -> str:
        return f"0x{value:X}"

    @format.register(float)
    def _(self, value: float) -> str:
        return f"{value:.4f}"

f = Formatter()
print(f.format(255))    # 0xFF
print(f.format(3.14))   # 3.1400
print(f.format("hi"))   # 'hi'`,
    explanation:
      "singledispatchmethod is the class-method counterpart to singledispatch — it skips self when determining which registered handler to invoke, so each registered function also receives self.",
  },
  {
    id: "py-abc-abstractproperty",
    language: "python",
    title: "ABC abstract property — force subclasses to implement properties",
    tag: "classes",
    code: `from abc import ABC, abstractmethod

class Shape(ABC):
    @property
    @abstractmethod
    def area(self) -> float: ...    # combine property + abstractmethod

    @property
    @abstractmethod
    def perimeter(self) -> float: ...

class Circle(Shape):
    def __init__(self, r: float):
        self.r = r
    @property
    def area(self) -> float:
        return 3.14159 * self.r ** 2
    @property
    def perimeter(self) -> float:
        return 2 * 3.14159 * self.r

c = Circle(5)
print(c.area, c.perimeter)   # 78.53975 31.4159`,
    explanation:
      "Stack @property above @abstractmethod to require subclasses to provide a property implementation — if subclasses use @abstractproperty (deprecated) or only override abstractmethod without @property, the ABC contract is not satisfied.",
  },
  {
    id: "py-metaclass-call",
    language: "python",
    title: "metaclass __call__ — intercept instance creation",
    tag: "classes",
    code: `class SingletonMeta(type):
    _instances: dict = {}

    def __call__(cls, *args, **kwargs):
        if cls not in cls._instances:
            # __call__ on the metaclass is what runs when you do Foo()
            cls._instances[cls] = super().__call__(*args, **kwargs)
        return cls._instances[cls]

class Config(metaclass=SingletonMeta):
    def __init__(self, value: int = 0):
        self.value = value

a = Config(42)
b = Config(99)
print(a is b)       # True  — same instance
print(a.value)      # 42    — second call ignored`,
    explanation:
      "type.__call__() is what runs when you call a class — overriding it in a metaclass lets you intercept every instantiation attempt without modifying __init__ or __new__, making singleton/flyweight patterns transparent to users.",
  },
  {
    id: "py-class-creation-hooks",
    language: "python",
    title: "__init_subclass__ — hook called when a class is subclassed",
    tag: "classes",
    code: `class Plugin:
    _registry: dict[str, type] = {}

    def __init_subclass__(cls, name: str = "", **kwargs):
        super().__init_subclass__(**kwargs)
        if name:
            Plugin._registry[name] = cls
            print(f"Registered plugin: {name}")

class AlphaPlugin(Plugin, name="alpha"):
    pass

class BetaPlugin(Plugin, name="beta"):
    pass

print(Plugin._registry)
# {'alpha': <class 'AlphaPlugin'>, 'beta': <class 'BetaPlugin'>}`,
    explanation:
      "__init_subclass__ is called on the parent class every time it is subclassed — a clean way to build a plugin registry without metaclasses, because keyword arguments from the class statement are forwarded to it.",
  },
  {
    id: "py-class-slots-dict",
    language: "python",
    title: "__slots__ and __dict__ — coexistence caveat",
    tag: "caveats",
    code: `class SlottedWithDict:
    __slots__ = ("x",)
    # No __dict__ slot → no instance dict
    # Unless you explicitly add "__dict__" to __slots__:

class SlottedPlusDynamic:
    __slots__ = ("x", "__dict__")   # opt back in to instance dict

a = SlottedPlusDynamic()
a.x = 1          # uses slot
a.extra = 99     # uses __dict__ (allowed because we opted in)
print(a.extra)   # 99

class PureSlotted:
    __slots__ = ("x",)

b = PureSlotted()
try:
    b.extra = 99  # AttributeError — no __dict__
except AttributeError as e:
    print(e)`,
    explanation:
      "Declaring __slots__ removes the per-instance __dict__ by default, saving memory; adding \"__dict__\" to __slots__ restores dynamic attribute assignment while still benefiting from slot access for declared attributes.",
  },
  {
    id: "py-object-setattr-getattr",
    language: "python",
    title: "__getattr__ vs __getattribute__ — when each is called",
    tag: "classes",
    code: `class Proxy:
    def __init__(self, target):
        object.__setattr__(self, "_target", target)  # bypass our __setattr__

    def __getattr__(self, name: str):
        # Only called when normal attribute lookup fails
        return getattr(self._target, name)

    def __setattr__(self, name: str, value):
        if name.startswith("_"):
            object.__setattr__(self, name, value)
        else:
            setattr(self._target, name, value)

target = type("T", (), {"x": 10})()
p = Proxy(target)
print(p.x)   # 10 — forwarded to target via __getattr__`,
    explanation:
      "__getattr__ is only invoked when the attribute is not found through normal means, making it a safe fallback; __getattribute__ intercepts every access and must call object.__getattribute__ to avoid infinite recursion.",
  },
  {
    id: "py-dunder-class-getitem",
    language: "python",
    title: "__class_getitem__ — make your class subscriptable as a generic",
    tag: "classes",
    code: `class Stack:
    def __class_getitem__(cls, item):
        # Called when you write Stack[int] — return a generic alias
        return type(f"Stack[{item.__name__}]", (cls,), {"_type": item})

IntStack = Stack[int]
print(IntStack._type)       # <class 'int'>

# Used by typing.Generic automatically, but you can define it yourself
# for runtime behaviour like validation or specialisation`,
    explanation:
      "__class_getitem__ is called when you subscript a class (e.g. MyClass[int]), enabling runtime generic aliasing — Python's own list, dict, and tuple use this to support list[int] syntax without importing from typing.",
  },
  {
    id: "py-dunder-init-vs-new",
    language: "python",
    title: "__new__ vs __init__ — construction order and immutable types",
    tag: "understanding",
    code: `class ImmutablePoint(tuple):
    # tuple is immutable — __init__ can't set values; must use __new__
    def __new__(cls, x: float, y: float):
        instance = super().__new__(cls, (x, y))  # build the tuple
        return instance

    def __init__(self, x: float, y: float):
        # tuple is already built; __init__ just receives same args
        super().__init__()

p = ImmutablePoint(3, 4)
print(p[0], p[1])   # 3  4
print(type(p))       # <class '__main__.ImmutablePoint'>`,
    explanation:
      "__new__ creates and returns the instance (called first), while __init__ only initialises an already-created instance — for immutable types like tuple/str/int, all initialisation must happen in __new__ because the object cannot be mutated afterwards.",
  },
  {
    id: "py-dunder-del-caveat",
    language: "python",
    title: "__del__ — finaliser gotchas and non-deterministic ordering",
    tag: "caveats",
    code: `import gc

class Resource:
    def __init__(self, name: str):
        self.name = name
    def __del__(self):
        print(f"__del__ called for {self.name}")

# Reference cycles prevent __del__ from being called promptly:
r = Resource("A")
r.ref = r   # cycle!
del r       # NOT collected immediately

gc.collect()  # forces cycle collection → __del__ called
# Prefer contextlib.contextmanager or __exit__ for deterministic cleanup`,
    explanation:
      "__del__ is not a reliable destructor — it is not called when del is executed but when the reference count drops to zero or the garbage collector breaks cycles; for deterministic resource cleanup always use a context manager instead.",
  },
  {
    id: "py-closure-cell-inspect",
    language: "python",
    title: "closure cell objects — inspect captured variables",
    tag: "understanding",
    code: `def make_counter(start: int = 0):
    count = start
    def increment():
        nonlocal count
        count += 1
        return count
    return increment

counter = make_counter(10)
print(counter())   # 11
print(counter())   # 12

# Inspect the closure cell
cell = counter.__closure__[0]
print(cell.cell_contents)   # 12  — current value of 'count'`,
    explanation:
      "Each free variable in a closure is stored in a cell object accessible via __closure__ — inspecting cell_contents lets you peek at the current captured state, useful for debugging or testing without altering the closure.",
  },
  {
    id: "py-late-binding-default-fix",
    language: "python",
    title: "late-binding closure gotcha — default argument fix",
    tag: "caveats",
    code: `# Bug: all functions capture the same 'i' cell
funcs_bad = [lambda: i for i in range(3)]
print([f() for f in funcs_bad])   # [2, 2, 2]  — all see final i=2

# Fix 1: default argument captures value at definition time
funcs_good = [lambda i=i: i for i in range(3)]
print([f() for f in funcs_good])  # [0, 1, 2]

# Fix 2: functools.partial
from functools import partial
def val(i): return i
funcs_partial = [partial(val, i) for i in range(3)]
print([f() for f in funcs_partial])  # [0, 1, 2]`,
    explanation:
      "Lambda bodies are not evaluated at definition time — they close over the variable, not its value, so all lambdas in a loop end up seeing the final loop value; using a default argument or partial.bind forces immediate evaluation.",
  },
  {
    id: "py-generator-send-value",
    language: "python",
    title: "generator.send() — push a value into a running generator",
    tag: "snippet",
    code: `def accumulator():
    total = 0
    while True:
        value = yield total    # yield sends total OUT, receives new value IN
        if value is None:
            break
        total += value

gen = accumulator()
next(gen)           # advance to first yield (prime the generator)
print(gen.send(10)) # 10
print(gen.send(5))  # 15
print(gen.send(3))  # 18`,
    explanation:
      "gen.send(value) resumes the generator and makes the yield expression evaluate to value — the generator must be primed with next() (or send(None)) before you can send non-None values.",
  },
  {
    id: "py-generator-throw-exception",
    language: "python",
    title: "generator.throw() — inject an exception into a generator",
    tag: "snippet",
    code: `def safe_gen():
    try:
        while True:
            yield "running"
    except ValueError as e:
        print(f"caught inside generator: {e}")
        yield "recovered"

gen = safe_gen()
print(next(gen))                         # running
print(gen.throw(ValueError, "oops!"))    # caught inside generator: oops!
                                         # recovered`,
    explanation:
      "generator.throw(type, value) raises an exception at the point where the generator is suspended — the generator can catch it with a try/except and continue yielding, useful for cancellation or error injection in coroutine-style code.",
  },
  {
    id: "py-generator-close-exit",
    language: "python",
    title: "generator.close() and GeneratorExit — clean shutdown",
    tag: "understanding",
    code: `def managed_resource():
    print("opened resource")
    try:
        while True:
            yield
    except GeneratorExit:
        print("closing resource — cleanup here")

gen = managed_resource()
next(gen)     # opened resource
gen.close()   # closes resource — cleanup here
# Calling next() after close() raises StopIteration`,
    explanation:
      "gen.close() throws GeneratorExit into the generator, giving it a chance to run finally blocks and release resources; the generator must not yield again after catching GeneratorExit or a RuntimeError is raised.",
  },
  {
    id: "py-async-gen-expression",
    language: "python",
    title: "async generator — yield from an async def",
    tag: "snippet",
    code: `import asyncio

async def async_range(n: int):
    for i in range(n):
        await asyncio.sleep(0)   # allow other tasks to run
        yield i                  # async generator yields

async def main():
    values = [v async for v in async_range(5)]   # async comprehension
    print(values)   # [0, 1, 2, 3, 4]

asyncio.run(main())`,
    explanation:
      "An async generator is a coroutine function containing yield — it is consumed with async for or an async comprehension and supports cooperative scheduling at each yield point.",
  },
  {
    id: "py-async-comprehension-adv",
    language: "python",
    title: "async comprehensions — async for and async with in comprehensions",
    tag: "snippet",
    code: `import asyncio

async def triple(n: int):
    await asyncio.sleep(0)
    return n * 3

async def gen(n: int):
    for i in range(n):
        yield i

async def main():
    # async comprehension (async for inside [])
    squares = [i async for i in gen(5) if i % 2 == 0]
    print(squares)   # [0, 2, 4]

    # await inside comprehension
    triples = [await triple(i) for i in range(4)]
    print(triples)   # [0, 3, 6, 9]

asyncio.run(main())`,
    explanation:
      "async for can appear inside list/set/dict comprehensions and generator expressions declared within an async function — the entire comprehension becomes a coroutine that suspends at each iteration.",
  },
  {
    id: "py-nonlocal-closure-reassign",
    language: "python",
    title: "nonlocal — reassign an enclosing scope variable",
    tag: "understanding",
    code: `def outer():
    x = 0

    def inner():
        nonlocal x      # without nonlocal, x += 1 is an UnboundLocalError
        x += 1
        return x

    return inner

f = outer()
print(f())   # 1
print(f())   # 2
print(f())   # 3`,
    explanation:
      "Without nonlocal, assigning to x inside inner() creates a new local variable that shadows the outer x — Python sees the assignment and declares x local, making the x += 1 read an UnboundLocalError before any value is set.",
  },
  {
    id: "py-global-scope-caveat",
    language: "python",
    title: "global keyword — mutation vs rebinding in module scope",
    tag: "caveats",
    code: `counter = 0
items = []

def increment():
    global counter    # needed to rebind the module-level name
    counter += 1

def append_item(item):
    items.append(item)  # NO global needed — mutating, not rebinding

increment()
increment()
append_item("x")

print(counter)  # 2
print(items)    # ['x']

# Mistake: without global, counter += 1 would raise UnboundLocalError`,
    explanation:
      "global is only required when you want to rebind (reassign) a module-level name from inside a function — mutating a mutable object like a list or dict does not require global because you are not reassigning the name.",
  },
  {
    id: "py-exec-namespace",
    language: "python",
    title: "exec() with explicit namespace dictionaries",
    tag: "snippet",
    code: `globals_ns: dict = {"__builtins__": __builtins__}
locals_ns: dict = {}

code = """
x = 10
y = x * 2
result = x + y
"""
exec(code, globals_ns, locals_ns)
print(locals_ns["result"])   # 30

# The two-dict form isolates exec's names from the current scope
print("result" in dir())     # False — not polluted into caller's scope`,
    explanation:
      "Passing explicit dicts to exec() isolates the executed code's namespace from the caller's local scope — always do this when exec is necessary to prevent name leakage and reduce the attack surface.",
  },
  {
    id: "py-eval-restrictions",
    language: "python",
    title: "eval() security — why eval of user input is dangerous",
    tag: "caveats",
    code: `# NEVER eval untrusted input — it has full access to Python
# safe_globals = {"__builtins__": {}} only removes obvious builtins
# but __class__.__mro__ chains can reach builtins anyway:

malicious = "''.__class__.__mro__[1].__subclasses__()[100]"
# On CPython, some index reaches <class 'os._wrap_close'> or similar

# For user formulas use: ast.literal_eval (safe, literals only)
import ast
print(ast.literal_eval("[1, 2, {'key': 'val'}]"))  # safe

# For math expressions: use a restricted parser or operator.attrgetter`,
    explanation:
      "eval() with empty builtins is not safe — attackers can traverse __mro__ and __subclasses__() chains to reach os.system or open; use ast.literal_eval for data and a dedicated expression parser for formulas.",
  },
  {
    id: "py-descriptor-set-name",
    language: "python",
    title: "__set_name__ — descriptor learns its attribute name automatically",
    tag: "classes",
    code: `class Validated:
    def __set_name__(self, owner, name: str):
        self.name = name             # called when class is defined
        self.storage_name = f"_{name}_value"

    def __get__(self, obj, objtype=None):
        return getattr(obj, self.storage_name, None)

    def __set__(self, obj, value):
        if not isinstance(value, int):
            raise TypeError(f"{self.name} must be int, got {type(value).__name__}")
        setattr(obj, self.storage_name, value)

class Point:
    x = Validated()   # __set_name__(Point, "x") called here
    y = Validated()

p = Point()
p.x = 10
print(p.x)    # 10
try:
    p.y = "bad"   # TypeError: y must be int`,
    explanation:
      "__set_name__ is called by the class machinery right after the class body executes, giving each descriptor instance its owner class and the attribute name without needing it passed as a constructor argument.",
  },
  {
    id: "py-property-cached-slot",
    language: "python",
    title: "cached_property + __slots__ — they are incompatible",
    tag: "caveats",
    code: `from functools import cached_property

class SlottedBroken:
    __slots__ = ("x",)   # no __dict__ → cached_property cannot store
    @cached_property      # AttributeError at access time
    def expensive(self):
        return sum(range(10_000))

class SlottedWorking:
    __slots__ = ("x", "__dict__")   # add __dict__ back
    @cached_property
    def expensive(self):
        return sum(range(10_000))

obj = SlottedWorking()
print(obj.expensive)   # 49995000 — computed once and cached`,
    explanation:
      "cached_property stores its result in the instance's __dict__ by replacing itself on first access — but __slots__ removes __dict__ by default, so you must explicitly include \"__dict__\" in __slots__ if you want both memory efficiency and lazy caching.",
  },
  {
    id: "py-classmethod-chain",
    language: "python",
    title: "classmethod inheritance — cls always refers to the calling class",
    tag: "classes",
    code: `class Animal:
    sound = "..."

    @classmethod
    def describe(cls) -> str:
        return f"{cls.__name__} says {cls.sound}"

    @classmethod
    def create(cls) -> "Animal":
        return cls()   # creates the subclass instance, not Animal

class Dog(Animal):
    sound = "woof"

class Cat(Animal):
    sound = "meow"

print(Dog.describe())   # Dog says woof
print(Cat.describe())   # Cat says meow
print(type(Dog.create()))  # <class 'Dog'>`,
    explanation:
      "cls in a classmethod is the class it is called on, not the class where the method is defined — this makes classmethods ideal as alternative constructors that produce the correct subclass instance.",
  },
  {
    id: "py-staticmethod-vs-classmethod",
    language: "python",
    title: "staticmethod vs classmethod — when to use each",
    tag: "families",
    code: `class MathUtils:
    PI = 3.14159

    @staticmethod
    def add(a: float, b: float) -> float:
        return a + b   # no class/instance access needed

    @classmethod
    def circle_area(cls, r: float) -> float:
        return cls.PI * r * r   # accesses cls.PI — respects subclass override

class BetterMath(MathUtils):
    PI = 3.14159265358979

print(MathUtils.add(1, 2))           # 3  (same result from any class)
print(MathUtils.circle_area(5))      # 78.53975
print(BetterMath.circle_area(5))     # 78.5398163397448 — uses BetterMath.PI`,
    explanation:
      "Use @staticmethod when the function logically belongs to the class but needs neither class nor instance access; use @classmethod when you need access to the class itself, especially for subclass-aware factory methods.",
  },
  {
    id: "py-super-delegation-chain",
    language: "python",
    title: "super() in multiple inheritance — cooperative method calls",
    tag: "understanding",
    code: `class A:
    def greet(self) -> str:
        return "A"

class B(A):
    def greet(self) -> str:
        return "B-" + super().greet()   # calls C.greet via MRO, not A directly

class C(A):
    def greet(self) -> str:
        return "C-" + super().greet()

class D(B, C):   # MRO: D → B → C → A
    def greet(self) -> str:
        return "D-" + super().greet()

print(D().greet())   # D-B-C-A
print(D.__mro__)`,
    explanation:
      "super() follows the MRO, not the literal parent class — every class in the hierarchy must call super() cooperatively for all methods to be called exactly once in MRO order, not class-declaration order.",
  },
  {
    id: "py-mro-c3-diamond",
    language: "python",
    title: "C3 linearisation — MRO in a diamond inheritance",
    tag: "understanding",
    code: `class A:
    def who(self): return "A"

class B(A):
    def who(self): return "B"

class C(A):
    def who(self): return "C"

class D(B, C):   # diamond: D inherits from B and C, both inherit from A
    pass

print(D.__mro__)
# (<class 'D'>, <class 'B'>, <class 'C'>, <class 'A'>, <class 'object'>)
print(D().who())  # "B"  — first class in MRO that defines who()`,
    explanation:
      "Python's C3 algorithm ensures each class appears before its parents and before the parents of its siblings in the MRO — the diamond pattern D→B→C→A guarantees A is only called once even though both B and C inherit from it.",
  },
  {
    id: "py-dataclass-inherit-order",
    language: "python",
    title: "dataclass inheritance — field ordering and defaults caveat",
    tag: "caveats",
    code: `from dataclasses import dataclass

@dataclass
class Base:
    x: int = 0     # has default

@dataclass
class Child(Base):
    y: int         # no default — ERROR if declared after a defaulted field

# Python raises TypeError: non-default argument 'y' follows default argument
# Fix: add a default to y, or reorder so y is before x

@dataclass
class FixedChild(Base):
    y: int = 5   # OK now`,
    explanation:
      "Dataclass inheritance preserves the field order from the MRO and concatenates parent and child fields — if a parent has fields with defaults, child fields without defaults must come before those defaults or Python raises TypeError.",
  },
  {
    id: "py-namedtuple-typing-vs-class",
    language: "python",
    title: "NamedTuple — class syntax vs collections.namedtuple()",
    tag: "families",
    code: `from typing import NamedTuple
from collections import namedtuple

# Modern class syntax — type-annotated, IDE-friendly
class Point(NamedTuple):
    x: float
    y: float = 0.0   # default supported

# Functional form — dynamic, no type annotations
OldPoint = namedtuple("OldPoint", ["x", "y"], defaults=[0.0])

p1 = Point(3.0)             # y=0.0 via default
p2 = OldPoint(3.0)          # y=0.0 via default
print(p1, p2)
print(isinstance(p1, tuple))   # True — still a tuple subclass`,
    explanation:
      "The class syntax for NamedTuple supports type annotations, docstrings, default values, and method definitions — prefer it over the functional namedtuple() form for anything beyond quick-and-dirty named tuples.",
  },
  {
    id: "py-typeddict-functional-vs-class",
    language: "python",
    title: "TypedDict — class syntax vs functional form",
    tag: "families",
    code: `from typing import TypedDict, NotRequired

# Class syntax — preferred; supports inheritance and Required/NotRequired
class Movie(TypedDict):
    title: str
    year: int
    rating: NotRequired[float]   # optional key

# Functional form — needed when keys are not valid Python identifiers
WeirdDict = TypedDict("WeirdDict", {"with-dash": str, "123num": int})

m: Movie = {"title": "Dune", "year": 2021}   # rating is optional
print(m["title"])   # Dune`,
    explanation:
      "The class form of TypedDict is preferable because it supports inheritance, Required/NotRequired, and is more readable — the functional form is only needed when key names would be invalid Python identifiers.",
  },
];
