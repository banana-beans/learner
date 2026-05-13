import type { Snippet } from "./types";
export const pythonSnippets20260513B1: Snippet[] = [
  {
    id: "py-re-lookbehind",
    language: "python",
    title: "Regex lookbehind assertion",
    tag: "snippet",
    code: `import re

text = "100USD 200EUR 300GBP"
# (?<=USD) matches position immediately after "USD"
amounts_after_usd = re.findall(r'(?<=USD)\\d+', '100USD200 300EUR400')
# (?<!USD) negative lookbehind
non_usd = re.findall(r'\\b\\d+(?= EUR)', text)
print(non_usd)  # ['200']`,
    explanation: "Lookbehind assertions (?<=...) and (?<!...) match positions based on what precedes them without consuming characters — useful for extracting values that follow (or don't follow) a specific pattern.",
  },
  {
    id: "py-understand-bytearray-id",
    language: "python",
    title: "bytearray is mutable; bytes is not",
    tag: "understanding",
    code: `b = bytearray(b"hello")
print(id(b))
b[0] = ord('H')
print(id(b))        # same id — mutated in place
print(b)            # bytearray(b'Hello')

s = b"hello"
s2 = s.replace(b"h", b"H")
print(s is s2)      # False — new object`,
    explanation: "bytearray supports item assignment and in-place mutation, sharing identity across mutations, while bytes is immutable and any 'modification' produces a new object.",
  },
  {
    id: "py-class-abstract-property",
    language: "python",
    title: "Abstract property in ABC",
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
        return 3.14159 * self.r ** 2

c = Circle(5)
print(c.area)   # 78.53975`,
    explanation: "Combining @property with @abstractmethod forces subclasses to implement the attribute as a property, ensuring the interface contract is honoured at class definition time.",
  },
  {
    id: "py-struct-iter-unpack",
    language: "python",
    title: "struct.iter_unpack for repeated records",
    tag: "structures",
    code: `import struct

# Pack three 4-byte big-endian integers
data = struct.pack('>3I', 10, 20, 30)
fmt = '>I'
# iter_unpack yields one tuple per record
for (val,) in struct.iter_unpack(fmt, data):
    print(val)
# 10
# 20
# 30`,
    explanation: "struct.iter_unpack lazily yields fixed-size records from a buffer, making it memory-efficient when parsing binary data that contains many repeated identically-formatted records.",
  },
  {
    id: "py-caveat-signal-thread",
    language: "python",
    title: "Signals only work on the main thread",
    tag: "caveats",
    code: `import signal, threading

def handler(sig, frame):
    print("signal received")

def worker():
    try:
        signal.signal(signal.SIGINT, handler)
    except ValueError as e:
        print(f"Error: {e}")
        # ValueError: signal only works in main thread of the main interpreter

t = threading.Thread(target=worker)
t.start(); t.join()`,
    explanation: "Python only allows signal handlers to be set from the main thread; attempting to call signal.signal() in a worker thread raises ValueError, so signal handling logic must be centralised in the main thread.",
  },
  {
    id: "py-typing-required-notrequired",
    language: "python",
    title: "Required and NotRequired in TypedDict",
    tag: "types",
    code: `from typing import TypedDict, Required, NotRequired

class Movie(TypedDict, total=False):
    title: Required[str]   # must always be present
    year: int              # optional because total=False
    rating: NotRequired[float]  # explicitly optional

m: Movie = {"title": "Dune"}
print(m["title"])  # Dune`,
    explanation: "Required and NotRequired let you mix mandatory and optional keys in a TypedDict regardless of the total= flag, giving fine-grained per-field control over key presence.",
  },
  {
    id: "py-re-subn",
    language: "python",
    title: "re.subn returns substitution count",
    tag: "snippet",
    code: `import re

text = "the cat sat on the mat"
# subn returns (new_string, number_of_substitutions)
result, count = re.subn(r'\\b\\w*at\\b', 'X', text)
print(result)   # the X X on the X
print(count)    # 3`,
    explanation: "re.subn behaves like re.sub but additionally returns the number of replacements made, which is handy when you want to confirm that substitutions actually occurred.",
  },
  {
    id: "py-families-io-hierarchy",
    language: "python",
    title: "io module class hierarchy",
    tag: "families",
    code: `import io

# RawIOBase -> BufferedIOBase -> TextIOBase
raw = io.FileIO('/dev/null', 'r')
buffered = io.BufferedReader(raw)
text = io.TextIOWrapper(buffered, encoding='utf-8')

print(isinstance(raw, io.RawIOBase))        # True
print(isinstance(buffered, io.BufferedIOBase))  # True
print(isinstance(text, io.TextIOBase))      # True
text.close()`,
    explanation: "The io module layers raw, buffered, and text I/O classes in a strict hierarchy; understanding this lets you choose the right level of abstraction and compose streams correctly.",
  },
  {
    id: "py-weakref-set",
    language: "python",
    title: "WeakSet for tracking live objects",
    tag: "structures",
    code: `import weakref

class Node:
    def __init__(self, val):
        self.val = val

live = weakref.WeakSet()
a = Node(1)
b = Node(2)
live.add(a); live.add(b)
print(len(live))    # 2
del b
import gc; gc.collect()
print(len(live))    # 1 — b was collected`,
    explanation: "WeakSet holds weak references so that membership does not prevent garbage collection; it automatically shrinks as referents are collected, making it ideal for tracking currently-live instances.",
  },
  {
    id: "py-class-classmethod-abstract",
    language: "python",
    title: "Abstract classmethod in ABC",
    tag: "classes",
    code: `from abc import ABC, abstractmethod

class Serializer(ABC):
    @classmethod
    @abstractmethod
    def from_string(cls, s: str) -> "Serializer": ...

class JsonSerializer(Serializer):
    @classmethod
    def from_string(cls, s: str) -> "JsonSerializer":
        print(f"Parsing JSON: {s}")
        return cls()

j = JsonSerializer.from_string('{}')`,
    explanation: "Combining @classmethod with @abstractmethod requires subclasses to implement the method as a classmethod, ensuring factory or alternative-constructor patterns are consistently available across the hierarchy.",
  },
  {
    id: "py-threading-timer",
    language: "python",
    title: "threading.Timer for delayed execution",
    tag: "snippet",
    code: `import threading

def greet(name):
    print(f"Hello, {name}!")

# Fire after 0.1 seconds
t = threading.Timer(0.1, greet, args=["World"])
t.start()
t.join()
# Can cancel before it fires:
t2 = threading.Timer(10, greet, args=["Late"])
t2.start()
t2.cancel()`,
    explanation: "threading.Timer schedules a callable to run in a separate thread after a delay and can be cancelled at any point before it fires, providing a simple one-shot delayed-execution mechanism.",
  },
  {
    id: "py-understand-frozenset-eq",
    language: "python",
    title: "frozenset equality with set",
    tag: "understanding",
    code: `s = {1, 2, 3}
fs = frozenset([1, 2, 3])

print(s == fs)          # True
print(fs == s)          # True
print(hash(fs))         # some stable int
# print(hash(s))        # TypeError: unhashable type: 'set'
print(fs in {fs: "ok"}) # True — usable as dict key`,
    explanation: "frozenset compares equal to a set with the same elements and is hashable, so it can be used as a dictionary key or set member while still supporting all set operations.",
  },
  {
    id: "py-caveat-multiprocessing-fork",
    language: "python",
    title: "Fork start method copies file descriptors unsafely",
    tag: "caveats",
    code: `import multiprocessing as mp

# On Linux default is 'fork'; on macOS/Windows use 'spawn'
# Fork copies parent FDs — can cause lock deadlocks
# Safe pattern: explicitly choose start method
if __name__ == "__main__":
    mp.set_start_method("spawn")   # safe on all platforms
    p = mp.Process(target=print, args=("child",))
    p.start()
    p.join()`,
    explanation: "The 'fork' start method copies the parent process including any open file descriptors and lock state, which can cause deadlocks in child processes; using 'spawn' avoids these issues at the cost of a slightly slower start.",
  },
  {
    id: "py-ast-literal-eval",
    language: "python",
    title: "ast.literal_eval for safe evaluation",
    tag: "snippet",
    code: `import ast

# Safely parse Python literals without executing arbitrary code
data = ast.literal_eval('{"key": [1, 2, 3], "flag": True}')
print(data)         # {'key': [1, 2, 3], 'flag': True}
print(type(data))   # <class 'dict'>

try:
    ast.literal_eval("__import__('os').system('ls')")
except ValueError as e:
    print(f"Blocked: {e}")`,
    explanation: "ast.literal_eval parses only Python literals (strings, numbers, tuples, lists, dicts, booleans, None) and raises ValueError for anything else, making it safe for deserialising user-provided data.",
  },
  {
    id: "py-typing-readonly-typeddict",
    language: "python",
    title: "ReadOnly fields in TypedDict (Python 3.13+)",
    tag: "types",
    code: `from typing import TypedDict, ReadOnly

class Config(TypedDict):
    host: ReadOnly[str]
    port: ReadOnly[int]
    debug: bool          # mutable field

cfg: Config = {"host": "localhost", "port": 8080, "debug": True}
# Type checkers will flag: cfg["host"] = "other"
cfg["debug"] = False    # allowed
print(cfg)`,
    explanation: "ReadOnly marks individual TypedDict fields as structurally immutable to type checkers, providing finer-grained immutability than a fully frozen TypedDict without losing flexibility on other fields.",
  },
  {
    id: "py-multiprocessing-pipe",
    language: "python",
    title: "multiprocessing.Pipe for inter-process communication",
    tag: "snippet",
    code: `from multiprocessing import Process, Pipe

def worker(conn):
    conn.send("hello from child")
    conn.close()

if __name__ == "__main__":
    parent_conn, child_conn = Pipe()
    p = Process(target=worker, args=(child_conn,))
    p.start()
    print(parent_conn.recv())   # hello from child
    p.join()`,
    explanation: "multiprocessing.Pipe creates a pair of connection objects that can send and receive arbitrary picklable Python objects between processes, acting as a bidirectional or unidirectional channel.",
  },
  {
    id: "py-understand-tuple-singleton",
    language: "python",
    title: "Empty tuple is a singleton",
    tag: "understanding",
    code: `a = ()
b = ()
c = tuple()

print(a is b)       # True — same object
print(b is c)       # True
print(id(a) == id(c))  # True

# One-element tuple requires trailing comma
t = (42,)
print(type(t))      # <class 'tuple'>
print(type((42)))   # <class 'int'>`,
    explanation: "CPython interns the empty tuple as a singleton, so all empty tuples are the same object in memory; this is an implementation detail but also illustrates the importance of the trailing comma for single-element tuples.",
  },
  {
    id: "py-class-mixin-pattern",
    language: "python",
    title: "Mixin pattern for reusable behaviour",
    tag: "classes",
    code: `class JsonMixin:
    def to_json(self):
        import json
        return json.dumps(self.__dict__)

class LogMixin:
    def log(self):
        print(f"[LOG] {self.__class__.__name__}: {self.__dict__}")

class User(JsonMixin, LogMixin):
    def __init__(self, name, age):
        self.name = name; self.age = age

u = User("Alice", 30)
u.log()
print(u.to_json())`,
    explanation: "Mixins are small classes that provide a single reusable behaviour without state; combining them via multiple inheritance composes functionality while keeping each concern isolated and independently testable.",
  },
  {
    id: "py-io-rawio-basic",
    language: "python",
    title: "RawIOBase read with io.FileIO",
    tag: "structures",
    code: `import io, tempfile, os

with tempfile.NamedTemporaryFile(delete=False) as f:
    f.write(b"raw binary data")
    path = f.name

raw = io.FileIO(path, 'r')
chunk = raw.read(4)
print(chunk)            # b'raw '
rest = raw.readall()
print(rest)             # b'binary data'
raw.close()
os.unlink(path)`,
    explanation: "io.FileIO is the lowest-level file I/O class that works directly with the OS without buffering, returning bytes objects; it is the foundation on which BufferedReader and TextIOWrapper are layered.",
  },
  {
    id: "py-caveat-pickle-lambda",
    language: "python",
    title: "Lambdas and local functions cannot be pickled",
    tag: "caveats",
    code: `import pickle

# Named top-level function — picklable
def double(x): return x * 2
print(pickle.dumps(double))   # works

# Lambda — not picklable
fn = lambda x: x * 2
try:
    pickle.dumps(fn)
except AttributeError as e:
    print(f"Error: {e}")`,
    explanation: "pickle serialises functions by reference (module + qualified name), so only top-level named functions work; lambdas and closures lack a stable importable name and raise AttributeError when pickled.",
  },
  {
    id: "py-re-match-span",
    language: "python",
    title: "Match object span and groups",
    tag: "snippet",
    code: `import re

pattern = re.compile(r'(\\d{4})-(\\d{2})-(\\d{2})')
m = pattern.search("Event on 2026-05-13 at noon")
if m:
    print(m.group(0))   # 2026-05-13
    print(m.group(1))   # 2026
    print(m.span())     # (10, 20)
    print(m.start(), m.end())  # 10 20`,
    explanation: "A Match object exposes group() for named or numbered capture groups and span()/start()/end() for the character positions of the match, enabling precise extraction and replacement operations.",
  },
  {
    id: "py-typing-type-alias-stmt",
    language: "python",
    title: "type alias statement (Python 3.12+)",
    tag: "types",
    code: `# PEP 695: new 'type' soft keyword for type aliases
type Vector = list[float]
type Matrix = list[Vector]

def scale(v: Vector, factor: float) -> Vector:
    return [x * factor for x in v]

v: Vector = [1.0, 2.0, 3.0]
print(scale(v, 2.0))   # [2.0, 4.0, 6.0]
print(type(Vector))    # <class 'typing.TypeAliasType'>`,
    explanation: "The type statement (PEP 695) defines a TypeAliasType object that is lazily evaluated, supports generics, and is clearly distinguishable from ordinary variable assignments by both humans and type checkers.",
  },
  {
    id: "py-understand-none-bool",
    language: "python",
    title: "None is falsy; identity vs equality",
    tag: "understanding",
    code: `x = None

# Identity check is correct
print(x is None)        # True
print(x is not None)    # False

# Equality can be overridden by __eq__
print(x == None)        # True (but fragile)
print(bool(None))       # False
print(not None)         # True
if not x:
    print("None is falsy")`,
    explanation: "None is a singleton so identity checks (is None) are preferred over equality (== None); any object can override __eq__ to return True when compared with None, making is the robust choice.",
  },
  {
    id: "py-abc-virtual-subclass",
    language: "python",
    title: "ABC.register for virtual subclasses",
    tag: "structures",
    code: `from abc import ABC

class Drawable(ABC):
    pass

class Canvas:   # does NOT inherit Drawable
    def draw(self):
        print("drawing")

Drawable.register(Canvas)

c = Canvas()
print(isinstance(c, Drawable))  # True
print(issubclass(Canvas, Drawable))  # True`,
    explanation: "ABC.register declares a class as a virtual subclass of an abstract base class without modifying its inheritance chain, enabling isinstance/issubclass checks for third-party types you cannot modify.",
  },
  {
    id: "py-threading-enumerate",
    language: "python",
    title: "Listing all live threads",
    tag: "snippet",
    code: `import threading, time

def worker(n):
    time.sleep(0.5)

threads = [threading.Thread(target=worker, args=(i,)) for i in range(3)]
for t in threads:
    t.start()

for t in threading.enumerate():
    print(t.name, t.is_alive())

for t in threads:
    t.join()`,
    explanation: "threading.enumerate() returns a list of all currently alive Thread objects including the main thread, which is useful for diagnostics and ensuring all threads complete before shutdown.",
  },
  {
    id: "py-caveat-generator-coroutine-diff",
    language: "python",
    title: "Generator vs async coroutine — not interchangeable",
    tag: "caveats",
    code: `import asyncio, inspect

def gen():
    yield 1

async def coro():
    return 1

print(inspect.isgeneratorfunction(gen))   # True
print(inspect.iscoroutinefunction(coro))  # True
# asyncio.run(gen())  # TypeError — gen() is a generator, not a coroutine
result = asyncio.run(coro())
print(result)   # 1`,
    explanation: "Generator functions (yield) and async coroutine functions (async def) are distinct; asyncio cannot drive generators, and forgetting to use async def when working with the async ecosystem causes subtle TypeErrors.",
  },
  {
    id: "py-class-singleton-meta",
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
        self.value = 42

a = Config()
b = Config()
print(a is b)   # True`,
    explanation: "Implementing the singleton pattern through a metaclass intercepts __call__, ensuring only one instance is ever created while keeping the pattern reusable across multiple classes.",
  },
  {
    id: "py-multiprocessing-apply-async",
    language: "python",
    title: "Pool.apply_async for non-blocking tasks",
    tag: "snippet",
    code: `from multiprocessing import Pool

def square(n):
    return n * n

if __name__ == "__main__":
    with Pool(4) as pool:
        results = [pool.apply_async(square, (i,)) for i in range(5)]
        values = [r.get(timeout=5) for r in results]
    print(values)   # [0, 1, 4, 9, 16]`,
    explanation: "Pool.apply_async submits a task without blocking the caller and returns an AsyncResult; calling .get() later blocks until the result is available, enabling simple parallel fan-out patterns.",
  },
  {
    id: "py-typing-variadics",
    language: "python",
    title: "TypeVarTuple for variadic generics",
    tag: "types",
    code: `from typing import TypeVarTuple, Unpack

Ts = TypeVarTuple('Ts')

def broadcast(values: tuple[Unpack[Ts]]) -> tuple[Unpack[Ts]]:
    return values

result = broadcast((1, "hello", 3.14))
print(result)   # (1, 'hello', 3.14)
# Type checker knows result is tuple[int, str, float]`,
    explanation: "TypeVarTuple (PEP 646) allows functions and classes to be generic over an arbitrary number of types, enabling precise typing of functions that operate on heterogeneous tuples like array shapes.",
  },
  {
    id: "py-understand-iter-protocol",
    language: "python",
    title: "Custom iterator via __iter__ and __next__",
    tag: "understanding",
    code: `class Countdown:
    def __init__(self, n):
        self.n = n
    def __iter__(self):
        return self
    def __next__(self):
        if self.n <= 0:
            raise StopIteration
        self.n -= 1
        return self.n + 1

for v in Countdown(3):
    print(v)    # 3, 2, 1`,
    explanation: "The iterator protocol requires __iter__ returning self and __next__ raising StopIteration when exhausted; any object implementing both is directly usable in for loops, unpacking, and all iterator consumers.",
  },
  {
    id: "py-shelve-writeback",
    language: "python",
    title: "shelve with writeback=True for mutable values",
    tag: "structures",
    code: `import shelve, os, tempfile

path = tempfile.mktemp()
with shelve.open(path, writeback=True) as db:
    db["users"] = ["alice"]
    db["users"].append("bob")   # works with writeback=True

with shelve.open(path) as db:
    print(db["users"])  # ['alice', 'bob']

for ext in [".db", ".dir", ".bak", ""]:
    try: os.unlink(path + ext)
    except FileNotFoundError: pass`,
    explanation: "Without writeback=True, mutations to mutable values retrieved from a shelf are not persisted; writeback=True caches all accessed entries and writes them back on close, at the cost of higher memory use.",
  },
  {
    id: "py-caveat-super-mro-missing",
    language: "python",
    title: "super() skips classes not in MRO",
    tag: "caveats",
    code: `class A:
    def greet(self): print("A")

class B(A):
    def greet(self):
        super().greet()
        print("B")

class C(A):
    def greet(self):
        super().greet()
        print("C")

class D(B, C):
    def greet(self):
        super().greet()
        print("D")

D().greet()   # A C B D  (C3 MRO order)`,
    explanation: "super() follows the C3 MRO of the actual instance's class, not just the direct parent; in diamond inheritance each class is visited exactly once in a well-defined order, which can surprise developers expecting depth-first left-to-right traversal.",
  },
  {
    id: "py-tokenize-tokens",
    language: "python",
    title: "tokenize module to inspect Python source",
    tag: "snippet",
    code: `import tokenize, io

source = 'x = 1 + 2\\n'
tokens = tokenize.generate_tokens(io.StringIO(source).readline)
for tok in tokens:
    print(tokenize.tok_name[tok.type], repr(tok.string))
# NAME 'x'
# OP '='
# NUMBER '1'
# OP '+'
# NUMBER '2'`,
    explanation: "The tokenize module exposes Python's own lexer and produces a stream of typed tokens from source text, enabling syntax-aware tools like linters, formatters, and code analysers.",
  },
  {
    id: "py-families-exc-groups",
    language: "python",
    title: "Exception groups and except* (Python 3.11+)",
    tag: "families",
    code: `def risky():
    raise ExceptionGroup("multi", [
        ValueError("bad value"),
        TypeError("bad type"),
    ])

try:
    risky()
except* ValueError as eg:
    print("ValueErrors:", [str(e) for e in eg.exceptions])
except* TypeError as eg:
    print("TypeErrors:", [str(e) for e in eg.exceptions])`,
    explanation: "ExceptionGroup bundles multiple simultaneous exceptions and except* clauses handle each matching subgroup independently, enabling concurrent tasks to report several failures without losing any of them.",
  },
  {
    id: "py-understand-next-default",
    language: "python",
    title: "next() with a default avoids StopIteration",
    tag: "understanding",
    code: `it = iter([10, 20])
print(next(it))             # 10
print(next(it))             # 20
print(next(it, "done"))     # done — no StopIteration
print(next(it, None))       # None

# Find first even number safely
nums = [1, 3, 5, 7]
first_even = next((x for x in nums if x % 2 == 0), -1)
print(first_even)   # -1`,
    explanation: "Passing a default to next() prevents StopIteration when the iterator is exhausted, making it a concise alternative to try/except for the common pattern of finding the first matching element.",
  },
  {
    id: "py-ast-node-transformer",
    language: "python",
    title: "NodeTransformer to rewrite AST nodes",
    tag: "snippet",
    code: `import ast

class DoubleNumbers(ast.NodeTransformer):
    def visit_Constant(self, node):
        if isinstance(node.value, int):
            return ast.Constant(value=node.value * 2)
        return node

src = "x = 5 + 3"
tree = ast.parse(src)
new_tree = DoubleNumbers().visit(tree)
ast.fix_missing_locations(new_tree)
exec(compile(new_tree, "<string>", "exec"))
print(x)    # 16  (10 + 6)`,
    explanation: "ast.NodeTransformer lets you walk and rewrite an AST by overriding visit_* methods; combined with compile() it enables source-to-source transformations purely in Python.",
  },
  {
    id: "py-class-registry-meta",
    language: "python",
    title: "Auto-registering subclasses via metaclass",
    tag: "classes",
    code: `class PluginMeta(type):
    registry: dict = {}
    def __init__(cls, name, bases, ns):
        super().__init__(name, bases, ns)
        if bases:
            PluginMeta.registry[name] = cls

class Plugin(metaclass=PluginMeta): pass

class AudioPlugin(Plugin): pass
class VideoPlugin(Plugin): pass

print(PluginMeta.registry)
# {'AudioPlugin': <class ...>, 'VideoPlugin': <class ...>}`,
    explanation: "Overriding __init__ in a metaclass lets you automatically register every subclass at definition time, building a plugin or command-dispatch table without requiring explicit registration calls.",
  },
  {
    id: "py-queue-sentinel",
    language: "python",
    title: "Sentinel value pattern to stop queue workers",
    tag: "structures",
    code: `import queue, threading

_STOP = object()   # unique sentinel

def worker(q):
    while True:
        item = q.get()
        if item is _STOP:
            break
        print(f"Processing {item}")

q = queue.Queue()
t = threading.Thread(target=worker, args=(q,))
t.start()
for i in range(3): q.put(i)
q.put(_STOP)
t.join()`,
    explanation: "Using a unique sentinel object (not None or -1) to signal queue workers to stop is idiomatic; identity comparison (is) ensures no data value can accidentally match the sentinel.",
  },
  {
    id: "py-caveat-classmethod-inherit-diff",
    language: "python",
    title: "classmethod cls refers to the calling class",
    tag: "caveats",
    code: `class Base:
    @classmethod
    def create(cls):
        print(f"creating {cls.__name__}")
        return cls()

class Child(Base):
    pass

Base.create()    # creating Base
Child.create()   # creating Child — cls is Child, not Base
# This is intentional but surprises devs expecting Base`,
    explanation: "In inherited classmethods, cls is bound to the class the method is called on, not the class that defined it; this enables the factory pattern but means behaviour differs between parent and subclass calls.",
  },
  {
    id: "py-multiprocessing-starmap",
    language: "python",
    title: "Pool.starmap for multi-argument functions",
    tag: "snippet",
    code: `from multiprocessing import Pool

def power(base, exp):
    return base ** exp

if __name__ == "__main__":
    pairs = [(2, 10), (3, 5), (5, 3)]
    with Pool() as pool:
        results = pool.starmap(power, pairs)
    print(results)   # [1024, 243, 125]`,
    explanation: "Pool.starmap unpacks each iterable element as positional arguments to the target function, making it a cleaner alternative to map() when the target function takes multiple parameters.",
  },
  {
    id: "py-typing-intersection",
    language: "python",
    title: "Simulating intersection types with Protocol",
    tag: "types",
    code: `from typing import Protocol, runtime_checkable

@runtime_checkable
class Readable(Protocol):
    def read(self) -> str: ...

@runtime_checkable
class Closeable(Protocol):
    def close(self) -> None: ...

class Stream:
    def read(self) -> str: return "data"
    def close(self) -> None: print("closed")

s = Stream()
print(isinstance(s, Readable))    # True
print(isinstance(s, Closeable))   # True`,
    explanation: "Python lacks a built-in intersection type, but runtime_checkable Protocols can be checked independently with isinstance, and type checkers understand a function accepting both as separate overloads or a combined Protocol.",
  },
  {
    id: "py-understand-map-filter-lazy",
    language: "python",
    title: "map and filter are lazy iterators",
    tag: "understanding",
    code: `nums = range(10)
doubled = map(lambda x: x * 2, nums)
evens = filter(lambda x: x % 2 == 0, nums)

print(type(doubled))    # <class 'map'>
print(type(evens))      # <class 'filter'>
# Nothing computed yet — consume to evaluate
print(list(doubled))    # [0, 2, 4, ..., 18]
print(list(evens))      # [0, 2, 4, 6, 8]`,
    explanation: "map() and filter() return lazy iterator objects that produce values on demand rather than building a full list immediately, so they are memory-efficient for large sequences and can be composed without intermediate allocation.",
  },
  {
    id: "py-sys-getframe",
    language: "python",
    title: "sys._getframe for call stack inspection",
    tag: "snippet",
    code: `import sys

def inner():
    frame = sys._getframe(0)    # current frame
    caller = sys._getframe(1)   # caller's frame
    print(f"I am: {frame.f_code.co_name}")
    print(f"Called from: {caller.f_code.co_name}")
    print(f"Line: {caller.f_lineno}")

def outer():
    inner()

outer()`,
    explanation: "sys._getframe() provides access to the call stack's frame objects, enabling introspective utilities like custom logging, debuggers, and automatic caller-name detection, though it is CPython-specific.",
  },
  {
    id: "py-weakref-value-dict",
    language: "python",
    title: "WeakValueDictionary auto-removes dead entries",
    tag: "structures",
    code: `import weakref

class Resource:
    def __init__(self, name): self.name = name

cache = weakref.WeakValueDictionary()
r1 = Resource("db_conn")
cache["db"] = r1
print("db" in cache)    # True
del r1
import gc; gc.collect()
print("db" in cache)    # False — entry removed`,
    explanation: "WeakValueDictionary stores weak references to values and automatically removes entries when the referent is garbage collected, making it ideal for caches that should not prevent object cleanup.",
  },
  {
    id: "py-class-context-manager-class",
    language: "python",
    title: "Context manager via __enter__ and __exit__",
    tag: "classes",
    code: `class ManagedDB:
    def __init__(self, dsn):
        self.dsn = dsn
    def __enter__(self):
        print(f"Connecting to {self.dsn}")
        return self
    def __exit__(self, exc_type, exc_val, exc_tb):
        print("Closing connection")
        return False  # don't suppress exceptions

with ManagedDB("sqlite:///test.db") as db:
    print(f"Using {db.dsn}")`,
    explanation: "__enter__ sets up the resource and returns it as the 'as' target; __exit__ tears it down and receives exception information, returning True to suppress the exception or False to propagate it.",
  },
  {
    id: "py-caveat-property-inherit",
    language: "python",
    title: "Overriding only getter breaks inherited setter",
    tag: "caveats",
    code: `class Base:
    @property
    def value(self): return self._v
    @value.setter
    def value(self, v): self._v = v

class Child(Base):
    @property          # re-declaring drops the setter!
    def value(self):
        return self._v * 2

c = Child()
try:
    c.value = 5        # AttributeError: can't set attribute
except AttributeError as e:
    print(e)`,
    explanation: "Re-defining a property in a subclass creates a fresh property descriptor that has no setter unless you explicitly add one or use Base.value.setter(func); the parent's setter is silently lost.",
  },
  {
    id: "py-threading-daemon-join",
    language: "python",
    title: "Daemon threads and join behaviour",
    tag: "snippet",
    code: `import threading, time

def background():
    time.sleep(10)      # long-running
    print("background done")   # may not print if main exits

t = threading.Thread(target=background, daemon=True)
t.start()
print("Main finishing")
# daemon=True: process exits without waiting for t
# t.join() would wait; omitting it lets main exit freely`,
    explanation: "Daemon threads are abruptly killed when all non-daemon threads (including main) finish; use daemon=True for background housekeeping tasks that should not prevent program exit, and call join() when you need to await completion.",
  },
  {
    id: "py-understand-dict-merge",
    language: "python",
    title: "Dict merge operators | and |= (Python 3.9+)",
    tag: "understanding",
    code: `a = {"x": 1, "y": 2}
b = {"y": 99, "z": 3}

merged = a | b          # new dict; b wins on conflicts
print(merged)           # {'x': 1, 'y': 99, 'z': 3}
print(a)                # unchanged

a |= b                  # in-place merge
print(a)                # {'x': 1, 'y': 99, 'z': 3}`,
    explanation: "The | operator creates a new merged dict with right-hand values winning on key conflicts, while |= updates the left dict in place; both are cleaner than {**a, **b} and explicit update() calls.",
  },
  {
    id: "py-ast-walk",
    language: "python",
    title: "ast.walk to visit all nodes",
    tag: "snippet",
    code: `import ast, collections

src = """
x = 1 + 2
y = x * 3
"""
tree = ast.parse(src)
counter = collections.Counter(
    type(node).__name__ for node in ast.walk(tree)
)
for name, count in counter.most_common():
    print(f"{name}: {count}")`,
    explanation: "ast.walk() yields every node in the AST in breadth-first order without requiring a custom visitor class, making it convenient for simple analysis tasks like counting node types or searching for specific patterns.",
  },
  {
    id: "py-families-weakref-types",
    language: "python",
    title: "weakref container family overview",
    tag: "families",
    code: `import weakref

class Obj:
    def __init__(self, n): self.n = n

o = Obj("a")
# Single reference
ref = weakref.ref(o)
# Keyed by weak refs
wd = weakref.WeakKeyDictionary({o: "meta"})
# Values are weak refs
wv = weakref.WeakValueDictionary({"key": o})
# Set of weak refs
ws = weakref.WeakSet([o])
print(ref(), list(wv.values()), len(ws))`,
    explanation: "The weakref module provides four complementary containers — ref, WeakKeyDictionary, WeakValueDictionary, and WeakSet — each allowing garbage collection to proceed when no strong references remain.",
  },
  {
    id: "py-dbm-basic",
    language: "python",
    title: "dbm for simple persistent key-value store",
    tag: "structures",
    code: `import dbm, os, tempfile

path = tempfile.mktemp()
with dbm.open(path, 'c') as db:
    db['name'] = 'Alice'
    db['score'] = '100'

with dbm.open(path, 'r') as db:
    print(db['name'].decode())    # Alice
    print(list(db.keys()))

for f in [path, path+'.db', path+'.dir', path+'.bak']:
    try: os.unlink(f)
    except FileNotFoundError: pass`,
    explanation: "dbm provides a dictionary-like interface backed by a persistent on-disk hash table; it is simpler than shelve (values must be bytes or strings) but very fast for basic key-value persistence.",
  },
  {
    id: "py-caveat-del-item",
    language: "python",
    title: "del removes name binding, not necessarily the object",
    tag: "caveats",
    code: `a = [1, 2, 3]
b = a           # b holds same list

del a           # removes name 'a', not the list object
try:
    print(a)    # NameError
except NameError:
    print("a is gone")

print(b)        # [1, 2, 3] — list still alive via b
del b[1]        # THIS removes item from list
print(b)        # [1, 3]`,
    explanation: "del applied to a variable only removes the name binding from the local namespace; the object persists until all references are removed, while del applied to an index or key removes the item from the collection.",
  },
  {
    id: "py-multiprocessing-manager-dict",
    language: "python",
    title: "Manager dict for shared state across processes",
    tag: "snippet",
    code: `from multiprocessing import Process, Manager

def increment(d, key):
    d[key] = d.get(key, 0) + 1

if __name__ == "__main__":
    with Manager() as mgr:
        shared = mgr.dict()
        procs = [Process(target=increment, args=(shared, "count"))
                 for _ in range(5)]
        for p in procs: p.start()
        for p in procs: p.join()
        print(shared["count"])   # 5`,
    explanation: "Manager().dict() creates a proxy object backed by a manager server process so multiple worker processes can safely read and write shared dictionary state without explicit locking.",
  },
  {
    id: "py-typing-callable-proto",
    language: "python",
    title: "Callable Protocol for typed callbacks",
    tag: "types",
    code: `from typing import Protocol

class Transformer(Protocol):
    def __call__(self, value: int) -> str: ...

def apply(t: Transformer, v: int) -> str:
    return t(v)

def fmt(value: int) -> str:
    return f"value={value}"

print(apply(fmt, 42))       # value=42
# lambda and any matching callable also satisfies the Protocol`,
    explanation: "A Protocol with __call__ describes a callable's exact signature more precisely than Callable[[int], str], enabling type checkers to verify named functions, lambdas, and class instances uniformly.",
  },
  {
    id: "py-understand-set-from-str",
    language: "python",
    title: "set() from a string iterates characters",
    tag: "understanding",
    code: `s = set("banana")
print(s)            # {'b', 'a', 'n'} — unique chars

# Common mistake: set("hello") != {"hello"}
print(set("hello"))         # {'h', 'e', 'l', 'o'}
print({"hello"})            # {'hello'} — set with one string

chars = frozenset("mississippi")
print(len(chars))   # 4 (m, i, s, p)`,
    explanation: "set() takes any iterable; passing a string iterates its characters, not treating the string as a single element — a common source of confusion when trying to create a one-element set from a string.",
  },
  {
    id: "py-class-asynccontext",
    language: "python",
    title: "Async context manager with __aenter__/__aexit__",
    tag: "classes",
    code: `import asyncio

class AsyncDB:
    async def __aenter__(self):
        print("opening async connection")
        return self
    async def __aexit__(self, *exc):
        print("closing async connection")
        return False
    async def query(self):
        return "result"

async def main():
    async with AsyncDB() as db:
        print(await db.query())

asyncio.run(main())`,
    explanation: "__aenter__ and __aexit__ are the async equivalents of __enter__/__exit__ and must be coroutines; they enable the 'async with' statement for managing resources in async code such as database connections or HTTP sessions.",
  },
  {
    id: "py-concurrent-futures-cancel",
    language: "python",
    title: "Cancelling pending futures",
    tag: "snippet",
    code: `from concurrent.futures import ThreadPoolExecutor
import time

def slow(n):
    time.sleep(n)
    return n

with ThreadPoolExecutor(max_workers=1) as ex:
    f1 = ex.submit(slow, 5)   # running
    f2 = ex.submit(slow, 5)   # queued
    cancelled = f2.cancel()
    print(f"f2 cancelled: {cancelled}")    # True
    f1.cancel()   # too late — already running
    print(f"f1 cancelled: {f1.cancelled()}")  # False`,
    explanation: "Future.cancel() succeeds only if the future is still in the queue and has not started executing; already-running futures cannot be cancelled, so task decomposition and queue depth matter for responsiveness.",
  },
  {
    id: "py-understand-truthy-nonzero",
    language: "python",
    title: "__bool__ and __len__ control truthiness",
    tag: "understanding",
    code: `class Bag:
    def __init__(self, items):
        self.items = items
    def __len__(self):
        return len(self.items)

b_full = Bag([1, 2, 3])
b_empty = Bag([])
print(bool(b_full))     # True
print(bool(b_empty))    # False
if b_full:
    print("has items")  # has items`,
    explanation: "Python checks __bool__ first for truthiness; if absent it falls back to __len__, treating the object as falsy when length is zero — so defining __len__ automatically makes empty containers falsy.",
  },
  {
    id: "py-dis-bytecode-obj",
    language: "python",
    title: "dis.Bytecode for programmatic disassembly",
    tag: "snippet",
    code: `import dis

def add(a, b):
    return a + b

bc = dis.Bytecode(add)
for instr in bc:
    print(f"{instr.offset:3d} {instr.opname:<20s} {instr.argval}")
# Shows RESUME, LOAD_FAST, BINARY_OP, RETURN_VALUE etc.`,
    explanation: "dis.Bytecode returns an iterable of Instruction namedtuples for a function or code object, enabling programmatic analysis of CPython bytecode without parsing the text output of dis.dis().",
  },
  {
    id: "py-caveat-augmented-tuple",
    language: "python",
    title: "+= on tuple raises TypeError but modifies list inside",
    tag: "caveats",
    code: `t = ([1, 2], "x")
try:
    t[0] += [3]         # TypeError: tuple does not support item assignment
except TypeError as e:
    print(e)

# But the in-place list extend still happened!
print(t[0])             # [1, 2, 3] — mutation occurred despite error

# Safe pattern:
lst = t[0]
lst.append(4)
print(t[0])             # [1, 2, 3, 4]`,
    explanation: "When augmented assignment targets a mutable object inside a tuple, the in-place operation succeeds before the tuple assignment fails; the result is a partially applied mutation with an exception — a CPython implementation artefact.",
  },
  {
    id: "py-asyncio-streams-client",
    language: "python",
    title: "asyncio streams client",
    tag: "snippet",
    code: `import asyncio

async def tcp_echo_client(message):
    reader, writer = await asyncio.open_connection(
        '127.0.0.1', 8888)
    writer.write(message.encode())
    await writer.drain()
    data = await reader.read(100)
    print(f"Received: {data.decode()!r}")
    writer.close()
    await writer.wait_closed()

# asyncio.run(tcp_echo_client("Hello"))`,
    explanation: "asyncio.open_connection returns a (StreamReader, StreamWriter) pair providing high-level coroutine-based reading and writing over a TCP connection without manually managing protocol callbacks.",
  },
  {
    id: "py-families-json-alternatives",
    language: "python",
    title: "JSON serialisation alternatives in stdlib",
    tag: "families",
    code: `import json, pickle, shelve, marshal

data = {"x": [1, 2, 3], "y": True}

j = json.dumps(data)            # human-readable, language-agnostic
p = pickle.dumps(data)          # Python-only, full object graph
m = marshal.dumps(data)         # CPython-internal, faster, limited types
print(type(j), type(p), type(m))
# Re-load
print(json.loads(j))
print(pickle.loads(p))
print(marshal.loads(m))`,
    explanation: "json, pickle, and marshal each serialise Python data but differ in portability (json is universal), safety (pickle can execute code), and speed (marshal is fastest but limited to simple types and CPython-internal).",
  },
  {
    id: "py-class-dataclass-post-inherit",
    language: "python",
    title: "Dataclass inheritance and __post_init__",
    tag: "classes",
    code: `from dataclasses import dataclass

@dataclass
class Base:
    name: str
    def __post_init__(self):
        self.name = self.name.strip()

@dataclass
class Employee(Base):
    department: str
    def __post_init__(self):
        super().__post_init__()   # must call parent
        self.department = self.department.upper()

e = Employee("  alice  ", "engineering")
print(e.name, e.department)    # alice ENGINEERING`,
    explanation: "Dataclass inheritance chains __post_init__ calls just like regular methods; you must explicitly call super().__post_init__() to ensure parent post-processing runs, since @dataclass does not chain them automatically.",
  },
  {
    id: "py-weakref-key-dict",
    language: "python",
    title: "WeakKeyDictionary for object metadata",
    tag: "structures",
    code: `import weakref

class Widget:
    def __init__(self, name): self.name = name

metadata = weakref.WeakKeyDictionary()
w1 = Widget("button")
metadata[w1] = {"color": "blue", "size": 10}
print(metadata[w1])

del w1
import gc; gc.collect()
print(len(metadata))   # 0 — entry auto-removed`,
    explanation: "WeakKeyDictionary uses weak references for its keys, so it does not prevent garbage collection of the key objects; it is ideal for attaching side-channel metadata to objects without creating a reference cycle.",
  },
  {
    id: "py-typing-annotated-meta",
    language: "python",
    title: "Annotated for attaching metadata to types",
    tag: "types",
    code: `from typing import Annotated, get_type_hints
import inspect

Positive = Annotated[int, "must be > 0"]
Email = Annotated[str, "valid email format"]

def create_user(age: Positive, email: Email) -> None:
    pass

hints = get_type_hints(create_user, include_extras=True)
print(hints["age"])     # typing.Annotated[int, 'must be > 0']
print(hints["age"].__metadata__)   # ('must be > 0',)`,
    explanation: "Annotated wraps a type with arbitrary metadata accessible via __metadata__; frameworks like Pydantic and FastAPI use this to attach validation rules, serialisation hints, and dependency injection markers to parameters.",
  },
  {
    id: "py-understand-slice-step",
    language: "python",
    title: "Slice with step — including negative step",
    tag: "understanding",
    code: `lst = list(range(10))   # [0..9]
print(lst[::2])         # [0, 2, 4, 6, 8]  every other
print(lst[1::2])        # [1, 3, 5, 7, 9]  odd indices
print(lst[::-1])        # [9, 8, ..., 0]   reverse
print(lst[8:2:-2])      # [8, 6, 4]  step=-2 from 8 down to 3
s = "hello"
print(s[::-1])          # olleh`,
    explanation: "The step parameter in a slice controls direction and stride; a negative step reverses traversal so start must be greater than stop, and omitting start/stop with step=-1 produces a reversed copy of the sequence.",
  },
  {
    id: "py-signal-alarm",
    language: "python",
    title: "signal.alarm for timeout enforcement",
    tag: "snippet",
    code: `import signal

def timeout_handler(sig, frame):
    raise TimeoutError("operation timed out")

signal.signal(signal.SIGALRM, timeout_handler)
signal.alarm(2)   # seconds
try:
    import time; time.sleep(5)   # will be interrupted
except TimeoutError as e:
    print(e)     # operation timed out
finally:
    signal.alarm(0)   # cancel alarm`,
    explanation: "signal.alarm() schedules a SIGALRM after a delay; combined with a handler that raises an exception it enforces hard timeouts on blocking operations — available only on Unix systems.",
  },
  {
    id: "py-understand-enumerate-list",
    language: "python",
    title: "enumerate with start parameter",
    tag: "understanding",
    code: `fruits = ["apple", "banana", "cherry"]

# Default start=0
for i, f in enumerate(fruits):
    print(i, f)

# Custom start
for i, f in enumerate(fruits, start=1):
    print(f"{i}. {f}")

# Convert to list of tuples
indexed = list(enumerate(fruits, 100))
print(indexed)   # [(100, 'apple'), (101, 'banana'), ...]`,
    explanation: "enumerate() pairs each element with its index and the optional start parameter lets you begin counting from any integer, making it easy to produce 1-based or offset-based numbering without a separate counter.",
  },
  {
    id: "py-asyncio-streams-server",
    language: "python",
    title: "asyncio streams server",
    tag: "snippet",
    code: `import asyncio

async def handle(reader, writer):
    data = await reader.read(100)
    writer.write(data)          # echo back
    await writer.drain()
    writer.close()
    await writer.wait_closed()

async def main():
    srv = await asyncio.start_server(handle, '127.0.0.1', 8888)
    async with srv:
        await srv.serve_forever()

# asyncio.run(main())   # uncomment to run`,
    explanation: "asyncio.start_server registers an async callback that receives a (reader, writer) pair for each new TCP connection, providing a high-level coroutine-based server without subclassing Protocol.",
  },
  {
    id: "py-caveat-star-import",
    language: "python",
    title: "Star import pollutes namespace and hides origins",
    tag: "caveats",
    code: `# Bad: from os.path import *
# Makes dirname, join, exists etc available but hides their origin

# Good: explicit imports
from os.path import join, dirname, exists

path = join(dirname(__file__), "data")
print(exists(path))   # clear where 'exists' came from

# __all__ controls what * exports from a module
# Without __all__, * exports everything without leading _`,
    explanation: "Star imports make it impossible to grep for where a name came from, can overwrite previously imported names silently, and make code harder to refactor; explicit imports are always preferred in production code.",
  },
  {
    id: "py-mmap-basic",
    language: "python",
    title: "mmap for memory-mapped file access",
    tag: "structures",
    code: `import mmap, os, tempfile

path = tempfile.mktemp()
with open(path, 'wb') as f:
    f.write(b"Hello, memory-mapped world!")

with open(path, 'r+b') as f:
    mm = mmap.mmap(f.fileno(), 0)
    print(mm[:5])           # b'Hello'
    mm[7:13] = b"mmap  "   # in-place edit
    mm.seek(0)
    print(mm.readline())    # updated content
    mm.close()
os.unlink(path)`,
    explanation: "mmap maps a file into virtual memory so it can be read and written like a bytearray while the OS handles paging; it is efficient for large files since only accessed pages are loaded into physical memory.",
  },
  {
    id: "py-typing-overload-impl",
    language: "python",
    title: "@overload for type-narrowed return types",
    tag: "types",
    code: `from typing import overload

@overload
def parse(value: int) -> int: ...
@overload
def parse(value: str) -> str: ...

def parse(value):
    if isinstance(value, int):
        return value * 2
    return value.strip()

print(parse(5))         # 10
print(parse("  hi  "))  # hi`,
    explanation: "@overload lets you declare multiple signatures for the same function so type checkers can narrow the return type based on argument type, while the actual implementation (without @overload) handles all cases at runtime.",
  },
  {
    id: "py-caveat-sys-path-order",
    language: "python",
    title: "sys.path order affects which module is imported",
    tag: "caveats",
    code: `import sys

# sys.path[0] is '' or the script directory — searched FIRST
# A local file named 'json.py' would shadow stdlib json!
print(sys.path[:3])   # ['', '/usr/lib/python3...', ...]

# Safe pattern: don't name scripts after stdlib modules
# To prepend a path:
# sys.path.insert(0, '/my/libs')  — use with caution
print(sys.path.index('') if '' in sys.path else 'no empty entry')`,
    explanation: "Python searches sys.path entries in order; an empty string '' represents the current directory and is usually first, meaning a local file can shadow any stdlib or installed module with the same name.",
  },
  {
    id: "py-class-frozen-record",
    language: "python",
    title: "Frozen dataclass as immutable record",
    tag: "classes",
    code: `from dataclasses import dataclass

@dataclass(frozen=True)
class Point:
    x: float
    y: float

    def distance(self) -> float:
        return (self.x**2 + self.y**2) ** 0.5

p = Point(3.0, 4.0)
print(p.distance())   # 5.0
print(hash(p))        # stable — usable as dict key
try:
    p.x = 0           # FrozenInstanceError
except Exception as e:
    print(e)`,
    explanation: "frozen=True makes a dataclass immutable by implementing __setattr__ and __delattr__ to raise FrozenInstanceError, and also generates __hash__ so instances can be used as dictionary keys or set members.",
  },
  {
    id: "py-sys-version-info",
    language: "python",
    title: "sys.version_info for runtime version checks",
    tag: "snippet",
    code: `import sys

vi = sys.version_info
print(vi.major, vi.minor, vi.micro)   # e.g. 3 12 0
print(vi >= (3, 11))    # True if Python >= 3.11

if sys.version_info < (3, 10):
    print("match/case not available")
else:
    print("match/case supported")

print(sys.version)   # full version string with build info`,
    explanation: "sys.version_info is a named tuple allowing tuple comparison for version gating; comparing against a tuple like (3, 11) works because missing elements default to zero in Python's tuple comparison rules.",
  },
  {
    id: "py-understand-print-sep-end",
    language: "python",
    title: "print sep and end parameters",
    tag: "understanding",
    code: `# sep: separator between values (default ' ')
print("a", "b", "c", sep=", ")         # a, b, c
print("x", "y", sep="")                # xy
print(1, 2, 3, sep=" | ")              # 1 | 2 | 3

# end: string after last value (default '\\n')
print("loading", end="")
print("...", end="\\n")                 # loading...
print(*range(5), sep="-")              # 0-1-2-3-4`,
    explanation: "print()'s sep and end keyword arguments control how multiple values are joined and what terminates the output; combining them with argument unpacking (*) makes formatting compact without string concatenation.",
  },
  {
    id: "py-pkgutil-iter-modules",
    language: "python",
    title: "pkgutil.iter_modules to list package contents",
    tag: "snippet",
    code: `import pkgutil, os, sys, email

# List top-level modules in the email package
pkg_path = email.__path__
for finder, name, ispkg in pkgutil.iter_modules(pkg_path):
    kind = "pkg" if ispkg else "mod"
    print(f"{kind}: {name}")
# mod: base64mime
# mod: charset  ... etc`,
    explanation: "pkgutil.iter_modules() discovers importable modules and sub-packages at a given path without importing them, enabling plugin systems and dynamic module loaders to inventory available extensions.",
  },
  {
    id: "py-caveat-thread-gil-cpu",
    language: "python",
    title: "GIL prevents true CPU parallelism in threads",
    tag: "caveats",
    code: `import threading, time

def cpu_work():
    total = 0
    for i in range(5_000_000):
        total += i
    return total

start = time.perf_counter()
t1 = threading.Thread(target=cpu_work)
t2 = threading.Thread(target=cpu_work)
t1.start(); t2.start()
t1.join(); t2.join()
elapsed = time.perf_counter() - start
print(f"Threaded: {elapsed:.2f}s")   # ~same as sequential`,
    explanation: "The GIL ensures only one thread runs Python bytecode at a time, so CPU-bound threads see no speedup from threading; use multiprocessing, concurrent.futures.ProcessPoolExecutor, or free-threaded Python 3.13+ for true CPU parallelism.",
  },
  {
    id: "py-array-frombytes",
    language: "python",
    title: "array.frombytes for binary deserialization",
    tag: "structures",
    code: `import array

# Create array of signed shorts
original = array.array('h', [10, -20, 300, -400])
raw = original.tobytes()

# Reconstruct from raw bytes
restored = array.array('h')
restored.frombytes(raw)
print(list(restored))       # [10, -20, 300, -400]
print(restored == original) # True`,
    explanation: "array.tobytes() / frombytes() provide a fast, compact binary serialisation of typed numeric arrays without per-element Python object overhead, making them efficient for protocol buffers and file I/O.",
  },
  {
    id: "py-atexit-unregister",
    language: "python",
    title: "atexit.unregister to cancel cleanup callbacks",
    tag: "snippet",
    code: `import atexit

def cleanup(name):
    print(f"Cleaning up {name}")

atexit.register(cleanup, "resource_A")
atexit.register(cleanup, "resource_B")

# Cancel a specific callback before exit
atexit.unregister(cleanup)   # removes ALL registrations of cleanup
print("Running — cleanup won't fire now")
# Interpret exit: nothing printed from cleanup`,
    explanation: "atexit.unregister() removes all registrations of a given callable, useful when a resource that was registered for cleanup is released early and you want to avoid a redundant or erroneous cleanup call at exit.",
  },
  {
    id: "py-understand-format-float",
    language: "python",
    title: "Format spec mini-language for floats",
    tag: "understanding",
    code: `pi = 3.14159265358979

print(f"{pi:.2f}")      # 3.14  — 2 decimal places
print(f"{pi:.4e}")      # 3.1416e+00 — scientific
print(f"{pi:.6g}")      # 3.14159 — significant figures
print(f"{pi:10.3f}")    # '     3.142' — width 10
print(f"{pi:+.2f}")     # +3.14 — force sign
print(format(1234567.89, ",.2f"))   # 1,234,567.89`,
    explanation: "Python's format specification mini-language controls alignment, width, sign, grouping, and precision for floats; f-strings and format() both accept the same spec, making formatting consistent across contexts.",
  },
  {
    id: "py-typing-runtime-protocol",
    language: "python",
    title: "runtime_checkable Protocol and isinstance",
    tag: "types",
    code: `from typing import Protocol, runtime_checkable

@runtime_checkable
class Drawable(Protocol):
    def draw(self) -> None: ...

class Circle:
    def draw(self) -> None:
        print("O")

class Square:
    pass

print(isinstance(Circle(), Drawable))   # True
print(isinstance(Square(), Drawable))   # False
print(isinstance(42, Drawable))         # False`,
    explanation: "runtime_checkable makes a Protocol usable with isinstance() at runtime by checking that the required methods exist (structural check only — not signatures); without it, isinstance raises TypeError.",
  },
  {
    id: "py-caveat-async-generator-close",
    language: "python",
    title: "Async generator must be explicitly closed",
    tag: "caveats",
    code: `import asyncio

async def ticker(n):
    for i in range(n):
        yield i
        await asyncio.sleep(0)

async def main():
    gen = ticker(100)
    async for val in gen:
        if val == 3:
            break       # exits loop but generator open
    # Must close to trigger GeneratorExit + finally blocks
    await gen.aclose()
    print("generator closed")

asyncio.run(main())`,
    explanation: "Breaking out of an async for loop leaves the async generator suspended; you must call aclose() to trigger any finally blocks inside the generator and allow its resources to be released properly.",
  },
  {
    id: "py-io-buffered-reader",
    language: "python",
    title: "io.BufferedReader wrapping a raw stream",
    tag: "structures",
    code: `import io

raw = io.BytesIO(b"abcdefghijklmnopqrstuvwxyz")
buffered = io.BufferedReader(raw, buffer_size=8)

print(buffered.read(3))     # b'abc'
print(buffered.peek(4))     # b'defg' (peek doesn't advance)
print(buffered.read(4))     # b'defg'
print(buffered.read1(10))   # up to 10 bytes in one system call`,
    explanation: "BufferedReader wraps any RawIOBase and adds an in-memory buffer to reduce system-call overhead; peek() reads without advancing the position, and read1() performs at most one underlying read, useful for non-blocking contexts.",
  },
  {
    id: "py-threading-barrier",
    language: "python",
    title: "threading.Barrier synchronises a fixed party count",
    tag: "snippet",
    code: `import threading, time

barrier = threading.Barrier(3)

def worker(n):
    print(f"Thread {n} working...")
    time.sleep(n * 0.1)
    barrier.wait()           # blocks until all 3 arrive
    print(f"Thread {n} past barrier")

threads = [threading.Thread(target=worker, args=(i,)) for i in range(3)]
for t in threads: t.start()
for t in threads: t.join()`,
    explanation: "threading.Barrier blocks each participating thread at wait() until the specified number of threads have all called wait(), then releases them simultaneously — ideal for phased parallel algorithms.",
  },
  {
    id: "py-understand-neg-modulo",
    language: "python",
    title: "Modulo with negative numbers — Python vs C",
    tag: "understanding",
    code: `# Python: result has same sign as DIVISOR
print(-7 % 3)    #  2  (not -1 as in C/Java)
print(7 % -3)    # -2  (not 1)
print(-7 % -3)   # -1

# Useful: always produces 0..n-1 for positive n
def wrap(index, size):
    return index % size

print(wrap(-1, 5))   # 4 — circular indexing
print(wrap(7, 5))    # 2`,
    explanation: "Python's % operator always returns a result with the same sign as the divisor (floor division semantics), unlike C and Java which use truncation division; this makes circular/wrap-around indexing trivially correct.",
  },
  {
    id: "py-zipimport-basic",
    language: "python",
    title: "zipimport — importing modules from a ZIP",
    tag: "snippet",
    code: `import zipimport, sys, os, zipfile, tempfile

# Create a zip with a simple module
tmp = tempfile.mktemp(suffix=".zip")
with zipfile.ZipFile(tmp, 'w') as zf:
    zf.writestr("mymod.py", "VALUE = 42\\n")

importer = zipimport.zipimporter(tmp)
mod = importer.load_module("mymod")
print(mod.VALUE)    # 42
os.unlink(tmp)`,
    explanation: "zipimport lets Python import modules directly from ZIP archives; it is how .egg files and embedded distributions work, and sys.path entries can be ZIP file paths for self-contained deployments.",
  },
  {
    id: "py-class-slots-property",
    language: "python",
    title: "__slots__ combined with property",
    tag: "classes",
    code: `class Temperature:
    __slots__ = ("_celsius",)

    def __init__(self, c: float):
        self._celsius = c

    @property
    def celsius(self) -> float:
        return self._celsius

    @property
    def fahrenheit(self) -> float:
        return self._celsius * 9/5 + 32

t = Temperature(100)
print(t.fahrenheit)     # 212.0
print(t.__slots__)      # ('_celsius',)`,
    explanation: "__slots__ restricts the instance to a fixed set of attributes and eliminates the per-instance __dict__, reducing memory use; properties still work because they are class-level descriptors, not instance attributes.",
  },
  {
    id: "py-caveat-format-spec-type",
    language: "python",
    title: "Format spec type codes are strict",
    tag: "caveats",
    code: `# 'd' requires integer; 'f' requires float-like
try:
    print(format("hello", 'd'))   # ValueError
except ValueError as e:
    print(e)

try:
    print(format(3.5, 'd'))       # TypeError or ValueError
except (ValueError, TypeError) as e:
    print(e)

# Correct: convert first
print(format(int(3.5), 'd'))     # 3
print(format(3, 'f'))            # 3.000000`,
    explanation: "Format type codes like 'd', 'f', and 's' require the value to already be of a compatible type; Python does not coerce automatically, so passing a float to 'd' raises an error and requires explicit int() conversion.",
  },
  {
    id: "py-array-buffer",
    language: "python",
    title: "array as buffer for struct unpacking",
    tag: "structures",
    code: `import array, struct

# Build a byte buffer using array
buf = array.array('B', [0] * 8)    # 8 unsigned bytes
struct.pack_into('>2I', buf, 0, 0xDEAD, 0xBEEF)

# Read back via memoryview
mv = memoryview(buf)
a, b = struct.unpack_from('>2I', mv, 0)
print(hex(a), hex(b))   # 0xdead 0xbeef`,
    explanation: "array objects expose the buffer protocol so they can be used directly with struct.pack_into and memoryview, enabling zero-copy binary data manipulation without converting to and from bytes objects.",
  },
  {
    id: "py-runpy-basic",
    language: "python",
    title: "runpy.run_module executes a module as __main__",
    tag: "snippet",
    code: `import runpy

# Equivalent to: python -m json.tool
result = runpy.run_module(
    "json.tool",
    run_name="__main__",
    alter_sys=False
)
# result is the module's global namespace dict
print(type(result))   # <class 'dict'>`,
    explanation: "runpy.run_module() executes a module as if invoked with -m, setting __name__ to '__main__'; it is useful for programmatically running entry points and capturing or testing their side effects.",
  },
  {
    id: "py-families-thread-sync",
    language: "python",
    title: "threading synchronisation primitives family",
    tag: "families",
    code: `import threading

lock = threading.Lock()          # mutual exclusion
rlock = threading.RLock()        # reentrant lock
event = threading.Event()        # one-time signal
cond = threading.Condition(lock) # wait/notify
sem = threading.Semaphore(3)     # counting gate
barrier = threading.Barrier(2)   # rendezvous point

with lock:
    print("Lock acquired")
event.set()
print("Event set:", event.is_set())  # True`,
    explanation: "Python's threading module provides six synchronisation primitives covering every common concurrent coordination pattern: mutual exclusion, reentrant locking, signalling, condition variables, rate limiting, and phased rendezvous.",
  },
  {
    id: "py-sys-getsize-container",
    language: "python",
    title: "sys.getsizeof measures shallow object size",
    tag: "snippet",
    code: `import sys

lst = [1, 2, 3, 4, 5]
d = {"a": 1, "b": 2}
tup = (1, 2, 3)

print(sys.getsizeof(lst))   # e.g. 120 bytes (shallow)
print(sys.getsizeof(d))     # e.g. 232 bytes
print(sys.getsizeof(tup))   # e.g. 64 bytes
print(sys.getsizeof(0))     # 28 bytes (int object)
# Does NOT include size of contained objects`,
    explanation: "sys.getsizeof returns the shallow memory footprint of an object — just the container overhead without recursing into contained items; for deep size measurement you must recursively sum getsizeof of all referents.",
  },
  {
    id: "py-typing-final-var-assign",
    language: "python",
    title: "Final prevents reassignment of variables",
    tag: "types",
    code: `from typing import Final

MAX_SIZE: Final = 1024
DB_URL: Final[str] = "sqlite:///prod.db"

# Type checkers flag:
# MAX_SIZE = 2048   # Cannot assign to final variable

class Config:
    TIMEOUT: Final = 30

print(MAX_SIZE, DB_URL, Config.TIMEOUT)`,
    explanation: "Final declares that a variable or attribute must not be reassigned after its initial assignment; type checkers enforce this statically, providing a lightweight immutability guarantee without runtime overhead.",
  },
  {
    id: "py-caveat-regex-backtrack",
    language: "python",
    title: "Catastrophic backtracking in greedy regex",
    tag: "caveats",
    code: `import re, time

# Catastrophic: (a+)+ against non-matching input
bad_pattern = re.compile(r'(a+)+b')
start = time.perf_counter()
result = bad_pattern.match('aaaaaaaaaaaaaaac')  # no match
elapsed = time.perf_counter() - start
print(f"Elapsed: {elapsed:.3f}s")   # may be very slow

# Fix: use atomic-group equivalent or possessive quantifier
# Or restructure to avoid nested repetition`,
    explanation: "Nested quantifiers like (a+)+ cause exponential backtracking on non-matching input because the engine explores every possible grouping; the fix is to restructure the pattern or use regex libraries that support atomic groups.",
  },
  {
    id: "py-functools-cmp-to-key",
    language: "python",
    title: "functools.cmp_to_key adapts legacy comparators",
    tag: "snippet",
    code: `import functools

# Old-style comparator: <0, 0, >0
def by_last_digit(a, b):
    return (a % 10) - (b % 10)

nums = [25, 13, 44, 7, 31, 58]
nums.sort(key=functools.cmp_to_key(by_last_digit))
print(nums)   # sorted by last digit: [31, 13, 44, 25, 7, 58]`,
    explanation: "functools.cmp_to_key wraps a two-argument comparison function into a key function suitable for sort() and sorted(), enabling migration of legacy C-style comparators and complex multi-field ordering logic.",
  },
  {
    id: "py-io-protocol-check",
    language: "python",
    title: "Checking IO protocol capabilities at runtime",
    tag: "structures",
    code: `import io

stream = io.StringIO("hello world")

print(stream.readable())    # True
print(stream.writable())    # True
print(stream.seekable())    # True
print(isinstance(stream, io.TextIOBase))    # True
print(isinstance(stream, io.IOBase))        # True

raw = io.FileIO('/dev/null', 'w')
print(raw.readable())   # False
print(raw.writable())   # True
raw.close()`,
    explanation: "IO objects expose readable(), writable(), and seekable() methods for runtime capability checks; isinstance checks against io abstract base classes let you write code that works with any stream conforming to the right protocol level.",
  },
  {
    id: "py-struct-calcsize",
    language: "python",
    title: "struct.calcsize for format byte sizes",
    tag: "structures",
    code: `import struct

formats = ['B', 'H', 'I', 'Q', 'f', 'd', '4s', '2H3I']
for fmt in formats:
    size = struct.calcsize(fmt)
    print(f"'{fmt}': {size} bytes")
# 'B': 1  'H': 2  'I': 4  'Q': 8
# 'f': 4  'd': 8  '4s': 4  '2H3I': 16`,
    explanation: "struct.calcsize returns the number of bytes required to pack a format string, which is essential for pre-allocating buffers, computing record offsets, and validating binary protocol frame sizes before packing.",
  },
  {
    id: "py-operator-methodcaller",
    language: "python",
    title: "operator.methodcaller for deferred method calls",
    tag: "snippet",
    code: `from operator import methodcaller

words = ["  hello  ", "  WORLD  ", "  Python  "]

strip_lower = methodcaller("strip")
lower = methodcaller("lower")

processed = [lower(strip_lower(w)) for w in words]
print(processed)   # ['hello', 'world', 'python']

# As a sort key
data = [{"name": "Bob"}, {"name": "Alice"}]
data.sort(key=methodcaller("__getitem__", "name"))
print([d["name"] for d in data])   # ['Alice', 'Bob']`,
    explanation: "operator.methodcaller creates a callable that invokes a named method with fixed arguments, enabling method calls to be passed as first-class functions to sorted(), map(), and other higher-order utilities.",
  },
  {
    id: "py-itertools-starmap",
    language: "python",
    title: "itertools.starmap unpacks argument tuples",
    tag: "snippet",
    code: `import itertools

pairs = [(2, 3), (4, 5), (10, 2)]

# starmap unpacks each tuple as positional args
results = list(itertools.starmap(pow, pairs))
print(results)   # [8, 1024, 100]

# Equivalent to: [pow(*args) for args in pairs]
manual = [pow(*args) for args in pairs]
print(results == manual)   # True`,
    explanation: "itertools.starmap applies a function to each element of an iterable by unpacking it as positional arguments, making it a lazy alternative to a list comprehension with argument unpacking.",
  },
];
