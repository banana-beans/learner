// ============================================================
// Python Tier 6 — Advanced Lessons
// ============================================================

import type { LessonContent } from "./python-basics";

export const pythonAdvancedLessons: Record<string, LessonContent> = {
  "python:t6:context-managers": {
    nodeId: "python:t6:context-managers",
    title: "Context Managers (with)",
    sections: [
      {
        heading: "with for Cleanup",
        body: "with foo() as x: ... guarantees cleanup runs even on exception. Used for files (auto-close), locks (auto-release), database transactions (auto-rollback), tempfiles (auto-delete). The classic pattern: open(path) as a context manager.",
      },
      {
        heading: "Writing Your Own",
        body: "Two ways: (1) define __enter__ and __exit__ methods on a class; (2) decorate a generator with @contextmanager from contextlib — yield once to mark the boundary between setup and teardown. The decorator approach is usually shorter.",
      },
      {
        heading: "Exception Handling in __exit__",
        body: "__exit__(exc_type, exc, tb) runs whether or not an exception happened. Returning True swallows the exception; returning None or False lets it propagate. With @contextmanager, wrap yield in try/finally for the same effect.",
      },
    ],
    codeExamples: [
      {
        title: "File auto-close",
        code: `with open("/tmp/x.txt", "w") as f:
    f.write("hello")
# file is closed here, even if an exception happened in the block`,
        explanation: "Always prefer with open(...) over manual open()/close().",
      },
      {
        title: "Custom @contextmanager",
        code: `from contextlib import contextmanager

@contextmanager
def announce(label):
    print(f"--- start {label} ---")
    try:
        yield
    finally:
        print(f"--- end {label} ---")

with announce("setup"):
    print("doing work")
# --- start setup --- / doing work / --- end setup ---`,
        explanation: "Code before yield is __enter__; code after is __exit__. try/finally guarantees teardown.",
      },
      {
        title: "Suppressing exceptions",
        code: `from contextlib import suppress

with suppress(FileNotFoundError):
    open("does-not-exist.txt")
print("kept going")`,
        explanation: "contextlib.suppress is a built-in for the common 'ignore this exception' pattern.",
      },
    ],
    keyTakeaways: [
      "with cleans up automatically — even on exceptions",
      "Define __enter__/__exit__ or use @contextmanager + yield",
      "Use try/finally inside @contextmanager generators",
      "__exit__ returning True swallows the exception",
      "contextlib has suppress, redirect_stdout, ExitStack, etc.",
    ],
  },

  "python:t6:type-hints": {
    nodeId: "python:t6:type-hints",
    title: "Type Hints",
    sections: [
      {
        heading: "Annotating Functions and Variables",
        body: "Type hints document expected types. def f(x: int) -> str: ... means int in, str out. Variable hints: count: int = 0. Hints don't change runtime — they're for tools (mypy, pyright, IDE autocomplete) and humans.",
      },
      {
        heading: "Modern Syntax",
        body: "Python 3.10+ uses lowercase: list[int], dict[str, int], int | None instead of typing.List/Dict/Optional. Use list[int] for arguments you'll iterate. Use Sequence for read-only, Iterable for one-pass. typing.TypeAlias creates named types.",
      },
      {
        heading: "Generics and Protocols",
        body: "Generic types: TypeVar('T') for functions parameterized over a type. ParamSpec for decorators that preserve signatures. Protocol for structural subtyping (duck typing with type checking). Don't over-type — start simple, add complexity when mypy complains.",
      },
    ],
    codeExamples: [
      {
        title: "Basic hints",
        code: `def total(nums: list[int]) -> int:
    return sum(nums)

count: int = 0
name: str = "ada"
print(total([1, 2, 3]))  # 6`,
        explanation: "Hints are documentation by default. Tools enforce them statically.",
      },
      {
        title: "Optional and unions",
        code: `def find(items: list[str], target: str) -> int | None:
    for i, x in enumerate(items):
        if x == target:
            return i
    return None

print(find(["a", "b", "c"], "b"))  # 1
print(find(["a", "b"], "z"))       # None`,
        explanation: "int | None says the function may return either. Modern Python 3.10+ syntax.",
      },
      {
        title: "Generic function",
        code: `from typing import TypeVar

T = TypeVar("T")

def first(items: list[T]) -> T | None:
    return items[0] if items else None

x: int | None = first([1, 2, 3])
y: str | None = first(["a", "b"])
print(x, y)  # 1 a`,
        explanation: "T preserves the input type. mypy infers T=int in the first call, T=str in the second.",
      },
    ],
    keyTakeaways: [
      "Hints are documentation — runtime ignores them by default",
      "Use lowercase generics: list[int], not List[int] (Python 3.9+)",
      "T | None replaces Optional[T] (Python 3.10+)",
      "Use TypeVar for functions generic over a type",
      "Protocol for structural typing; ABC for nominal",
    ],
  },

  "python:t6:async-basics": {
    nodeId: "python:t6:async-basics",
    title: "Async / Await",
    sections: [
      {
        heading: "What async Solves",
        body: "Async lets a single thread juggle thousands of I/O-bound tasks (HTTP requests, DB queries, sockets). When a coroutine awaits, it yields control back to the event loop, which runs another ready coroutine. CPU-bound work doesn't benefit — use multiprocessing for that.",
      },
      {
        heading: "Coroutines and the Event Loop",
        body: "async def creates a coroutine function. Calling it returns a coroutine object (not a result) — you must await it or schedule it on the event loop. asyncio.run(coro) is the canonical entry point: creates a loop, runs the coroutine, closes the loop.",
      },
      {
        heading: "Concurrency Primitives",
        body: "asyncio.gather(*coros) runs coroutines concurrently and waits for all. asyncio.create_task(coro) schedules a coroutine and returns a Task you can await later. asyncio.sleep(s) is the async equivalent of time.sleep — actually awaits.",
      },
    ],
    codeExamples: [
      {
        title: "Hello async",
        code: `import asyncio

async def greet(name):
    await asyncio.sleep(0.01)
    return f"hello {name}"

async def main():
    msg = await greet("ada")
    print(msg)

asyncio.run(main())  # hello ada`,
        explanation: "main() is a coroutine; asyncio.run drives the event loop until it's done.",
      },
      {
        title: "Concurrent gather",
        code: `import asyncio, time

async def slow(label, secs):
    await asyncio.sleep(secs)
    return label

async def main():
    start = time.perf_counter()
    a, b, c = await asyncio.gather(
        slow("a", 0.1),
        slow("b", 0.1),
        slow("c", 0.1),
    )
    print(a, b, c, f"{time.perf_counter()-start:.2f}s")

asyncio.run(main())
# a b c 0.10s — total ~one sleep, not three`,
        explanation: "gather runs coroutines concurrently. Total time = max, not sum.",
      },
      {
        title: "Tasks for fire-and-await",
        code: `import asyncio

async def work(label):
    await asyncio.sleep(0.01)
    return label.upper()

async def main():
    t1 = asyncio.create_task(work("ada"))
    t2 = asyncio.create_task(work("linus"))
    print(await t1, await t2)

asyncio.run(main())  # ADA LINUS`,
        explanation: "create_task schedules immediately; await retrieves the result later.",
      },
    ],
    keyTakeaways: [
      "async + await = concurrent I/O on a single thread",
      "Calling an async function returns a coroutine — must be awaited",
      "asyncio.run is the canonical entry point",
      "gather runs coroutines concurrently and collects results",
      "Use multiprocessing for CPU-bound work, not async",
    ],
  },

  "python:t6:concurrency": {
    nodeId: "python:t6:concurrency",
    title: "Threads, Processes, GIL",
    sections: [
      {
        heading: "The GIL",
        body: "CPython's Global Interpreter Lock means only one thread executes Python bytecode at a time. Threads still help with I/O (the GIL is released during blocking calls like file reads, socket I/O), but won't speed up CPU-bound code. Python 3.13+ has experimental free-threaded builds.",
      },
      {
        heading: "concurrent.futures",
        body: "ThreadPoolExecutor and ProcessPoolExecutor share the same API. .submit returns a Future; .map runs over an iterable. Use threads for I/O-bound parallelism, processes for CPU-bound work (each process has its own GIL).",
      },
      {
        heading: "Picking a Tool",
        body: "I/O-bound + simple = threads. I/O-bound + lots of tasks = asyncio. CPU-bound = multiprocessing. Sharing state across processes is harder (use Queue, Pipe, or shared memory). Async + threads can be combined via run_in_executor for blocking calls.",
      },
    ],
    codeExamples: [
      {
        title: "ThreadPoolExecutor for I/O",
        code: `from concurrent.futures import ThreadPoolExecutor
import time

def fetch(n):
    time.sleep(0.05)  # simulated I/O
    return n * 2

with ThreadPoolExecutor(max_workers=4) as ex:
    results = list(ex.map(fetch, range(8)))
print(results)  # [0, 2, 4, 6, 8, 10, 12, 14]`,
        explanation: "Threads block on I/O concurrently. The GIL is released during sleep/socket calls.",
      },
      {
        title: "ProcessPoolExecutor for CPU",
        code: `from concurrent.futures import ProcessPoolExecutor

def count_primes(n):
    return sum(1 for x in range(2, n) if all(x % i for i in range(2, x)))

if __name__ == "__main__":
    with ProcessPoolExecutor() as ex:
        results = list(ex.map(count_primes, [1000, 1000, 1000, 1000]))
    print(results)`,
        explanation: "Each process has its own interpreter and GIL — true CPU parallelism.",
      },
      {
        title: "Picking the right tool",
        code: `# Blocking HTTP requests, ~100 of them?
# → asyncio with aiohttp

# Read 50 files in parallel?
# → ThreadPoolExecutor

# Compute SHA-256 of 1GB across cores?
# → ProcessPoolExecutor
print("see comments")`,
        explanation: "Choose based on whether you're waiting on I/O or burning CPU.",
      },
    ],
    keyTakeaways: [
      "GIL: one thread runs Python bytecode at a time in CPython",
      "Threads still help for I/O — the GIL is released during blocking calls",
      "concurrent.futures: ThreadPoolExecutor for I/O, ProcessPoolExecutor for CPU",
      "asyncio = best for many concurrent I/O tasks",
      "Multiprocessing has overhead — only worth it for real CPU work",
    ],
  },

  "python:t6:performance": {
    nodeId: "python:t6:performance",
    title: "Performance & Profiling",
    sections: [
      {
        heading: "Measure First",
        body: "Don't optimize without data. timeit measures small snippets; cProfile profiles whole runs; line_profiler shows time per line. Most performance issues are: wrong data structure, accidental O(n²), or doing work in the inner loop that belongs outside it.",
      },
      {
        heading: "Common Wins",
        body: "Use sets/dicts for membership instead of lists (O(1) vs O(n)). Use generators for streaming so you don't allocate huge lists. Hoist loop-invariant work out of loops. Cache repeated computations with @cache. Convert hot loops to NumPy or C extensions.",
      },
      {
        heading: "When To Reach For Tools",
        body: "Cython compiles annotated Python to C. NumPy for array math. Numba JIT-compiles numeric functions. PyPy is a JIT-ed Python interpreter. Before any of these — profile to confirm where the time actually goes.",
      },
    ],
    codeExamples: [
      {
        title: "timeit comparison",
        code: `import timeit

t1 = timeit.timeit("sum([n*n for n in range(1000)])", number=1000)
t2 = timeit.timeit("sum(n*n for n in range(1000))", number=1000)
print(f"list comp: {t1:.3f}s")
print(f"gen expr:  {t2:.3f}s")`,
        explanation: "timeit runs your snippet number times. Use it for quick comparisons.",
      },
      {
        title: "Set vs list membership",
        code: `import timeit

setup = "items = list(range(10000)); s = set(items)"
t_list = timeit.timeit("9999 in items", setup=setup, number=10000)
t_set  = timeit.timeit("9999 in s",      setup=setup, number=10000)
print(f"list: {t_list:.4f}s")
print(f"set:  {t_set:.4f}s")
# set is dramatically faster for membership`,
        explanation: "list 'in' is O(n); set 'in' is O(1). Big wins for hot lookups.",
      },
      {
        title: "Memoize with @cache",
        code: `from functools import cache
import timeit

@cache
def fib(n):
    return n if n < 2 else fib(n-1) + fib(n-2)

print(fib(100))  # instant; uncached fib(100) is intractable`,
        explanation: "Cache turns exponential into linear when subproblems overlap.",
      },
    ],
    keyTakeaways: [
      "Profile before optimizing — guesses are usually wrong",
      "set/dict membership is O(1); list membership is O(n)",
      "Generators save memory; list comps save time on small data",
      "@cache memoizes pure functions automatically",
      "For real numeric speed: NumPy, Numba, or Cython",
    ],
  },

  "python:t6:packaging": {
    nodeId: "python:t6:packaging",
    title: "Modules, Packages & pyproject",
    sections: [
      {
        heading: "Modules and Packages",
        body: "Any .py file is a module. A directory with files becomes a package — historically required __init__.py, now optional (namespace packages). Imports use the dotted path: from mypkg.submodule import thing.",
      },
      {
        heading: "pyproject.toml",
        body: "Modern Python packaging uses pyproject.toml. Defines metadata, dependencies, build system, and tool configs in one place. Replaces the old setup.py + requirements.txt + setup.cfg sprawl. Build tools: hatchling, setuptools, poetry, flit.",
      },
      {
        heading: "Virtual Environments and Tools",
        body: "Always isolate per-project: python -m venv .venv (stdlib) or uv venv / poetry env / pipenv. Modern fast option: uv (Rust-based, drop-in pip replacement). pip-tools / uv pip compile pin transitive deps for reproducibility.",
      },
    ],
    codeExamples: [
      {
        title: "Module structure",
        code: `# mypkg/
#   __init__.py
#   utils.py
#   cli.py

# Inside cli.py:
# from .utils import helper
# OR (absolute)
# from mypkg.utils import helper
print("see comments")`,
        explanation: "Relative imports (.utils) work inside the package; absolute imports work anywhere.",
      },
      {
        title: "Minimal pyproject.toml",
        code: `# pyproject.toml
# [build-system]
# requires = ["hatchling"]
# build-backend = "hatchling.build"
#
# [project]
# name = "mypkg"
# version = "0.1.0"
# requires-python = ">=3.11"
# dependencies = ["requests>=2.31"]
print("see comments")`,
        explanation: "Single file replaces setup.py, requirements.txt, and setup.cfg.",
      },
      {
        title: "venv workflow",
        code: `# Bash:
# python -m venv .venv
# source .venv/bin/activate    (Linux/macOS)
# .venv\\Scripts\\activate       (Windows)
# pip install -e .
# pip install -e ".[dev]"      (install dev extras)
print("see comments")`,
        explanation: "-e installs in editable mode — your code changes are reflected without reinstalling.",
      },
    ],
    keyTakeaways: [
      "A .py file is a module; a directory of them is a package",
      "pyproject.toml is the modern, single-file packaging config",
      "Always use a virtual environment per project",
      "uv is a faster modern alternative to pip + venv",
      "pip install -e . for editable installs during development",
    ],
  },

  "python:t6:testing": {
    nodeId: "python:t6:testing",
    title: "Testing with pytest",
    sections: [
      {
        heading: "Basic Tests",
        body: "Test functions start with test_. Use plain assert — pytest rewrites it to show useful diffs on failure. No need for unittest's TestCase or self.assertEqual. Run pytest from the project root and it auto-discovers tests/.",
      },
      {
        heading: "Fixtures",
        body: "@pytest.fixture creates reusable setup. Tests that take a fixture as a parameter receive its value. Fixtures can yield (setup-yield-teardown) like context managers. Scopes: function (default), class, module, session.",
      },
      {
        heading: "Parametrize and Mark",
        body: "@pytest.mark.parametrize runs the same test with multiple inputs. @pytest.mark.skip / .skipif / .xfail control execution. pytest -k 'pattern' selects tests by name; -m for marks; --lf reruns last failures.",
      },
    ],
    codeExamples: [
      {
        title: "Plain assert",
        code: `# test_math.py
def add(a, b):
    return a + b

def test_add_basic():
    assert add(2, 3) == 5

def test_add_zero():
    assert add(0, 5) == 5

# pytest output on failure shows the diff automatically
print("run: pytest test_math.py")`,
        explanation: "Test functions named test_* are auto-discovered. assert is enough.",
      },
      {
        title: "Fixture",
        code: `import pytest

@pytest.fixture
def sample():
    return {"name": "ada", "score": 95}

def test_uses_sample(sample):
    assert sample["name"] == "ada"
    assert sample["score"] >= 90
print("see comments")`,
        explanation: "sample is the fixture name. Pytest passes its value into any test that asks for it.",
      },
      {
        title: "Parametrize",
        code: `import pytest

@pytest.mark.parametrize("a,b,expected", [
    (1, 2, 3),
    (-1, 1, 0),
    (0, 0, 0),
])
def test_add(a, b, expected):
    assert a + b == expected
print("see comments")`,
        explanation: "Three test runs from one definition. Each shows up separately in pytest output.",
      },
    ],
    keyTakeaways: [
      "Test files: test_*.py; functions: def test_*",
      "Use plain assert — pytest gives great diffs",
      "@pytest.fixture for shared setup; yield for teardown",
      "@pytest.mark.parametrize for table-driven tests",
      "pytest -k name / -m mark / --lf to filter what runs",
    ],
  },

  "python:t6:descriptors": {
    nodeId: "python:t6:descriptors",
    title: "Descriptors",
    sections: [
      {
        heading: "The Protocol Behind property",
        body: "A descriptor is any class that defines __get__, __set__, or __delete__. Bind one to a class attribute and it intercepts attribute access on instances. property, classmethod, staticmethod, and methods themselves are all descriptors.",
      },
      {
        heading: "Data vs Non-Data",
        body: "Data descriptors define __set__ or __delete__. Non-data descriptors only define __get__. Lookup order: data descriptors > instance __dict__ > non-data descriptors. This is why methods (non-data) can be shadowed by instance attributes but property cannot.",
      },
      {
        heading: "When You'd Write One",
        body: "You probably don't need to. property handles 99% of cases. Reach for descriptors when you need the same getter/setter logic across many attributes — typed validation, lazy loading, ORM fields. Otherwise, keep it simple.",
      },
    ],
    codeExamples: [
      {
        title: "Validating descriptor",
        code: `class Positive:
    def __set_name__(self, owner, name):
        self.name = "_" + name

    def __get__(self, obj, objtype=None):
        return getattr(obj, self.name)

    def __set__(self, obj, value):
        if value <= 0:
            raise ValueError("must be positive")
        setattr(obj, self.name, value)

class Order:
    quantity = Positive()
    price = Positive()

    def __init__(self, q, p):
        self.quantity = q
        self.price = p

o = Order(3, 9.99)
print(o.quantity, o.price)  # 3 9.99
# Order(0, 1)  # ValueError`,
        explanation: "One descriptor handles validation for both quantity and price.",
      },
      {
        title: "property is a descriptor",
        code: `class Foo:
    @property
    def x(self):
        return 42

print(type(Foo.__dict__["x"]))
# <class 'property'>
# property is implemented as a descriptor`,
        explanation: "property() returns an instance of a descriptor class. Same protocol, simpler API.",
      },
      {
        title: "Lazy attribute via descriptor",
        code: `class Lazy:
    def __init__(self, factory):
        self.factory = factory
    def __set_name__(self, owner, name):
        self.name = name
    def __get__(self, obj, objtype=None):
        if obj is None:
            return self
        value = self.factory(obj)
        obj.__dict__[self.name] = value  # cache on the instance
        return value

class Doc:
    @Lazy
    def title(self):
        print("computing...")
        return "Hello"

d = Doc()
print(d.title)  # computing... / Hello
print(d.title)  # Hello (cached, no recompute)`,
        explanation: "After first access, the value is stored on the instance, shadowing the descriptor.",
      },
    ],
    keyTakeaways: [
      "A descriptor implements __get__, __set__, or __delete__",
      "Bind to a class attribute; intercepts instance access",
      "Data descriptors (__set__) override instance __dict__",
      "property is the simplified API on top of the descriptor protocol",
      "Use them for cross-cutting attribute logic (ORMs, validation)",
    ],
  },

  "python:t6:metaclasses": {
    nodeId: "python:t6:metaclasses",
    title: "Metaclasses",
    sections: [
      {
        heading: "Classes Are Objects Too",
        body: "Just as instances are created from classes, classes are created from metaclasses. The default metaclass is type. type(name, bases, dict) creates a class dynamically — that's exactly what class Foo: ... does under the hood.",
      },
      {
        heading: "Custom Metaclasses",
        body: "Define a metaclass by subclassing type and overriding __new__ or __init__. Use class Foo(metaclass=MyMeta): to apply it. The metaclass intercepts class creation, letting you register, validate, or transform classes at definition time.",
      },
      {
        heading: "Almost Always Overkill",
        body: "Tim Peters: 'Metaclasses are deeper magic than 99% of users should ever worry about. If you wonder whether you need them, you don't.' Class decorators or __init_subclass__ usually suffice. ABCs, ORMs, and Pydantic are the rare legitimate uses.",
      },
    ],
    codeExamples: [
      {
        title: "Class as a type instance",
        code: `class Foo:
    pass

print(type(Foo))     # <class 'type'>
print(type(Foo()))   # <class '__main__.Foo'>

# Equivalent to:
Bar = type("Bar", (), {"x": 42})
print(Bar.x)         # 42`,
        explanation: "type can build classes dynamically. The class statement is sugar for type(...).",
      },
      {
        title: "Metaclass that auto-registers",
        code: `class Registry(type):
    instances = {}
    def __init__(cls, name, bases, ns):
        super().__init__(name, bases, ns)
        Registry.instances[name] = cls

class Plugin(metaclass=Registry):
    pass

class FooPlugin(Plugin):
    pass

print(list(Registry.instances))
# ['Plugin', 'FooPlugin']`,
        explanation: "Each class declaration triggers Registry.__init__, recording the class.",
      },
      {
        title: "Usually __init_subclass__ is enough",
        code: `class Plugin:
    instances = []
    def __init_subclass__(cls, **kwargs):
        super().__init_subclass__(**kwargs)
        Plugin.instances.append(cls)

class A(Plugin): pass
class B(Plugin): pass

print([c.__name__ for c in Plugin.instances])
# ['A', 'B']`,
        explanation: "__init_subclass__ does much of what metaclasses do, without the complexity.",
      },
    ],
    keyTakeaways: [
      "Classes are instances of metaclasses (default: type)",
      "type(name, bases, dict) creates a class dynamically",
      "Custom metaclass: subclass type, override __new__ or __init__",
      "Most use cases are better served by __init_subclass__ or class decorators",
      "If you don't know you need a metaclass, you don't",
    ],
  },

  "python:t6:itertools": {
    nodeId: "python:t6:itertools",
    title: "itertools & functools",
    sections: [
      {
        heading: "itertools — Iterator Algebra",
        body: "Standard tools for combining iterables: chain (concatenate), islice (slice without materializing), groupby (run-length-style groups), takewhile/dropwhile (conditional cuts), product/permutations/combinations (combinatorics). All lazy, all composable.",
      },
      {
        heading: "Common Recipes",
        body: "Chunk an iterable: itertools.batched (3.12+) or zip-of-iters. Pairwise traversal: itertools.pairwise. Running totals: itertools.accumulate. Cycle through forever: itertools.cycle. Repeat with itertools.repeat.",
      },
      {
        heading: "functools — Higher-Order Helpers",
        body: "functools.partial fixes some args of a callable. functools.reduce folds an iterable. functools.cache / lru_cache memoize. functools.wraps preserves decorator metadata. functools.singledispatch overloads a function on its first argument's type.",
      },
    ],
    codeExamples: [
      {
        title: "chain, islice, pairwise",
        code: `from itertools import chain, islice, pairwise

print(list(chain([1, 2], [3, 4], [5])))      # [1, 2, 3, 4, 5]
print(list(islice(range(100), 5, 10)))       # [5, 6, 7, 8, 9]
print(list(pairwise([1, 2, 4, 7])))          # [(1, 2), (2, 4), (4, 7)]`,
        explanation: "chain concatenates lazily; islice slices any iterable; pairwise gives sliding pairs.",
      },
      {
        title: "groupby (sorted input!)",
        code: `from itertools import groupby

data = [("a", 1), ("a", 2), ("b", 3), ("b", 4)]
for key, group in groupby(data, key=lambda x: x[0]):
    print(key, list(group))
# a [('a', 1), ('a', 2)]
# b [('b', 3), ('b', 4)]`,
        explanation: "groupby groups consecutive elements — sort first if you want global groups.",
      },
      {
        title: "functools.partial and reduce",
        code: `from functools import partial, reduce

power_of_2 = partial(pow, 2)
print(power_of_2(10))  # 1024 — pow(2, 10)

print(reduce(lambda acc, x: acc * x, [1, 2, 3, 4], 1))
# 24 — running product`,
        explanation: "partial pre-fills arguments; reduce folds a binary op over an iterable with an initial.",
      },
    ],
    keyTakeaways: [
      "itertools = lazy iterator algebra (chain, islice, pairwise, groupby)",
      "groupby only groups consecutive items — sort first if you need global groups",
      "functools.partial pre-fills args; reduce folds an iterable",
      "functools.cache memoizes pure functions",
      "functools.wraps preserves decorator metadata",
    ],
  },
};
