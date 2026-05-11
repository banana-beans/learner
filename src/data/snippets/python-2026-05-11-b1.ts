import type { Snippet } from "./types";

export const pythonSnippets20260511B1: Snippet[] = [
  {
    id: "py-fstring-conv",
    language: "python",
    title: "f-string conversion flags !r !s !a",
    tag: "snippet",
    code: `name = "café"
print(f"{name!r}")   # 'café'   — repr(): adds quotes, escapes non-ASCII if needed
print(f"{name!s}")   # café     — str(): plain string form (default)
print(f"{name!a}")   # 'caf\\xe9' — ascii(): like repr() but escapes non-ASCII

class Point:
    def __repr__(self): return "Point(1, 2)"
    def __str__(self):  return "(1, 2)"

p = Point()
print(f"{p!r}")  # Point(1, 2)
print(f"{p!s}")  # (1, 2)`,
    explanation:
      "The !r, !s, and !a conversion flags in f-strings call repr(), str(), and ascii() on the value before any format spec is applied — !r is especially handy for debugging because it reveals the type and escaping.",
  },
  {
    id: "py-format-mini-lang",
    language: "python",
    title: "Format spec mini-language: width, fill, align, precision",
    tag: "snippet",
    code: `# [[fill]align][width][.precision][type]
print(f"{'hi':>10}")       # '        hi'  — right-align in 10 chars
print(f"{'hi':<10}")       # 'hi        '  — left-align
print(f"{'hi':^10}")       # '    hi    '  — center
print(f"{'hi':*^10}")      # '****hi****'  — fill with '*', center

print(f"{3.14159:.2f}")    # '3.14'   — 2 decimal places
print(f"{1000000:,}")      # '1,000,000'  — thousands separator
print(f"{255:#010x}")      # '0x000000ff' — hex, 10 wide, zero-padded`,
    explanation:
      "The format spec mini-language is a concise DSL inside the colon of an f-string or format() call that handles alignment, padding, number bases, and precision without any imports.",
  },
  {
    id: "py-dict-merge-pipe",
    language: "python",
    title: "Dict merge with | operator (Python 3.9+)",
    tag: "snippet",
    code: `defaults = {"color": "blue", "size": 10, "bold": False}
overrides = {"size": 20, "italic": True}

# | creates a new merged dict; right side wins on conflicts
merged = defaults | overrides
print(merged)
# {'color': 'blue', 'size': 20, 'bold': False, 'italic': True}

# Works with multiple dicts in one expression
a = {"x": 1}
b = {"y": 2}
c = {"z": 3}
print(a | b | c)  # {'x': 1, 'y': 2, 'z': 3}`,
    explanation:
      "Python 3.9 added the | operator for dicts, which returns a new dict without mutating either operand — a clean upgrade over the {**a, **b} unpacking idiom.",
  },
  {
    id: "py-dict-update-op",
    language: "python",
    title: "|= in-place dict update (Python 3.9+)",
    tag: "snippet",
    code: `config = {"debug": False, "timeout": 30}
patch   = {"timeout": 60, "retries": 3}

# |= mutates config in place; right side wins on conflicts
config |= patch
print(config)
# {'debug': False, 'timeout': 60, 'retries': 3}

# Equivalent (but older) form:
config.update(patch)

# |= also accepts any iterable of key-value pairs
config |= [("verbose", True), ("debug", True)]
print(config["verbose"])  # True`,
    explanation:
      "|= mutates the left-hand dict in place (unlike |, which creates a new one), making it a drop-in replacement for dict.update() with a more expressive operator feel.",
  },
  {
    id: "py-set-ops-union",
    language: "python",
    title: "Set union, intersection, and difference operators",
    tag: "snippet",
    code: `a = {1, 2, 3, 4}
b = {3, 4, 5, 6}

print(a | b)   # {1, 2, 3, 4, 5, 6}  — union
print(a & b)   # {3, 4}              — intersection
print(a - b)   # {1, 2}              — difference (in a but not b)
print(b - a)   # {5, 6}
print(a ^ b)   # {1, 2, 5, 6}       — symmetric difference

# Method equivalents (also accept any iterable, not just sets):
print(a.union([5, 6]))          # {1, 2, 3, 4, 5, 6}
print(a.intersection([2, 3]))   # {2, 3}`,
    explanation:
      "Sets support the full complement of mathematical set operations as both operators (|, &, -, ^) and methods; the methods accept any iterable while the operators require both operands to be sets.",
  },
  {
    id: "py-list-mult-trap",
    language: "python",
    title: "List multiplication with *: flat vs nested trap",
    tag: "snippet",
    code: `# Flat list: * copies the value — perfectly safe
row = [0] * 5
print(row)          # [0, 0, 0, 0, 0]
row[2] = 9
print(row)          # [0, 0, 9, 0, 0]  — only index 2 changed

# Nested list: * copies the REFERENCE to the inner list
grid = [[0] * 3] * 3   # all 3 rows are the same list object!
grid[0][1] = 9
print(grid)
# [[0, 9, 0], [0, 9, 0], [0, 9, 0]]  — all rows changed!

# Fix: use a list comprehension to create independent rows
grid = [[0] * 3 for _ in range(3)]
grid[0][1] = 9
print(grid)  # [[0, 9, 0], [0, 0, 0], [0, 0, 0]]`,
    explanation:
      "Multiplying a list containing mutable objects (like inner lists) creates multiple references to the same object — use a list comprehension to get truly independent copies.",
  },
  {
    id: "py-tuple-single-comma",
    language: "python",
    title: "Single-element tuple requires a trailing comma",
    tag: "snippet",
    code: `# Parentheses alone don't make a tuple — the comma does
not_a_tuple = (42)
a_tuple     = (42,)

print(type(not_a_tuple))  # <class 'int'>
print(type(a_tuple))      # <class 'tuple'>
print(len(a_tuple))       # 1

# Even without parens, a trailing comma creates a tuple
also_tuple = 42,
print(type(also_tuple))   # <class 'tuple'>

# Common gotcha: function returning "a tuple"
def f(): return (1)   # returns int!
def g(): return (1,)  # returns tuple`,
    explanation:
      "It's the comma that creates a tuple, not the parentheses — forgetting the trailing comma on a single-element tuple is a silent bug because (42) is just a parenthesised integer.",
  },
  {
    id: "py-bytes-join",
    language: "python",
    title: "bytes.join() to concatenate byte sequences",
    tag: "snippet",
    code: `parts = [b"GET", b"/index.html", b"HTTP/1.1"]

# Join with a space separator (mimics str.join)
request_line = b" ".join(parts)
print(request_line)    # b'GET /index.html HTTP/1.1'

# Join with no separator
data = b"".join([b"\\x00", b"\\xff", b"\\x0a"])
print(data)            # b'\\x00\\xff\\n'

# Works with any iterable of bytes-like objects
chunks = (bytes([i]) for i in range(3))
print(b"-".join(chunks))  # b'\\x00-\\x01-\\x02'`,
    explanation:
      "bytes.join() is the most efficient way to concatenate many small byte sequences — just like str.join() avoids O(n²) string concatenation, it avoids building large intermediate bytes objects.",
  },
  {
    id: "py-bytearray-append",
    language: "python",
    title: "bytearray mutation: append and extend",
    tag: "snippet",
    code: `buf = bytearray(b"Hello")

# append() adds a single byte (integer 0-255)
buf.append(33)          # ord('!')
print(buf)              # bytearray(b'Hello!')

# extend() adds any iterable of ints 0-255
buf.extend([32, 87, 111, 114, 108, 100])
print(buf)              # bytearray(b'Hello! World')

# In-place concatenation with +=
buf += b"!"
print(bytes(buf))       # b'Hello! World!'

# pop() removes the last byte and returns its int value
last = buf.pop()
print(last, chr(last))  # 33 !`,
    explanation:
      "bytearray is bytes' mutable sibling — you can append, extend, insert, and pop individual bytes by their integer values (0–255), making it ideal for building binary protocols incrementally.",
  },
  {
    id: "py-memoryview-slice",
    language: "python",
    title: "memoryview zero-copy slicing",
    tag: "snippet",
    code: `data = bytearray(b"Hello, World!")

# memoryview wraps the buffer without copying it
mv = memoryview(data)

# Slicing a memoryview also avoids a copy
chunk = mv[7:12]              # view of 'World'
print(bytes(chunk))           # b'World'

# Mutate through the view — changes the original bytearray
mv[0:5] = b"Howdy"
print(data)                   # bytearray(b'Howdy, World!')

# Works with bytes (read-only), bytearray, array.array, etc.
read_only = memoryview(b"immutable")
print(read_only[0])           # 105  (ord('i'))`,
    explanation:
      "memoryview lets you work with slices of large binary buffers without copying the data — essential when processing large files or network payloads a chunk at a time.",
  },
  {
    id: "py-complex-math",
    language: "python",
    title: "Complex number arithmetic and cmath",
    tag: "snippet",
    code: `import cmath

z1 = 3 + 4j          # literal complex: real=3, imag=4
z2 = complex(1, -2)  # complex(real, imag)

print(z1 + z2)        # (4+2j)
print(z1 * z2)        # (11-2j)
print(abs(z1))        # 5.0  — magnitude (|z|)
print(z1.real, z1.imag)  # 3.0  4.0
print(z1.conjugate())    # (3-4j)

# cmath provides complex-aware versions of math functions
print(cmath.phase(z1))   # 0.9272952...  — angle in radians
r, phi = cmath.polar(z1) # polar coordinates
print(r, phi)            # 5.0  0.9272...`,
    explanation:
      "Python's complex type is built-in and supports all arithmetic operators; the cmath module mirrors math but handles complex inputs for functions like sqrt, log, and exp.",
  },
  {
    id: "py-bool-as-int",
    language: "python",
    title: "bool is a subclass of int: True==1, False==0",
    tag: "snippet",
    code: `print(isinstance(True, int))   # True
print(True + True)             # 2
print(True * 7)                # 7
print(False + 1)               # 1

# Handy: count truthy items in a list
items = [0, 1, "", "hello", None, 42, [], [1]]
print(sum(bool(x) for x in items))  # 3  ("hello", 42, [1])

# Even shorter with bool's int nature:
print(sum(bool(x) for x in items))  # 3

# Gotcha: True == 1 and True == 1.0, but True is not 1
print(True == 1)    # True
print(True is 1)    # False  (different objects)`,
    explanation:
      "bool is a proper subclass of int, so True and False behave as 1 and 0 in arithmetic — a useful shortcut for counting, indexing, or conditional addition.",
  },
  {
    id: "py-walrus-return",
    language: "python",
    title: "Walrus operator in a return statement",
    tag: "snippet",
    code: `import re

def find_number(text: str) -> str | None:
    # := assigns AND evaluates in one expression
    if m := re.search(r"\\d+", text):
        return m.group()
    return None

print(find_number("price: 42 dollars"))  # '42'
print(find_number("no digits here"))     # None

# Also useful in while loops to avoid re-computing
data = iter([1, 2, 3, None, 4])
while (val := next(data)) is not None:
    print(val)   # 1  2  3  (stops at None)`,
    explanation:
      "The walrus operator (:=) assigns a value and returns it in the same expression, eliminating the common pattern of computing a value once for a condition and again to use it.",
  },
  {
    id: "py-augmented-unpack",
    language: "python",
    title: "Augmented assignment with sequence unpacking",
    tag: "snippet",
    code: `# Basic unpacking
a, b = 1, 2
print(a, b)     # 1 2

# Star unpacking: capture the middle or tail
first, *rest = [10, 20, 30, 40]
print(first, rest)       # 10  [20, 30, 40]

head, *middle, last = range(5)
print(head, middle, last)  # 0  [1, 2, 3]  4

# Swap without a temp variable
a, b = b, a
print(a, b)     # 2 1

# Nested unpacking
(x, y), z = (1, 2), 3
print(x, y, z)  # 1 2 3`,
    explanation:
      "Python's sequence unpacking, especially the starred * form, replaces many manual index operations and temp variables — the swap idiom a, b = b, a is a classic example.",
  },
  {
    id: "py-legb-scope",
    language: "python",
    title: "LEGB rule: which name binding wins",
    tag: "understanding",
    code: `x = "global"           # G — global scope

def outer():
    x = "enclosing"    # E — enclosing scope

    def inner():
        x = "local"    # L — local scope
        print(x)       # 'local'   — L wins

    inner()
    print(x)           # 'enclosing' — E wins here

outer()
print(x)               # 'global'  — G wins at module level

# Built-in scope (B): len, print, etc. are always last resort
# Search order: Local → Enclosing → Global → Built-in`,
    explanation:
      "Python resolves names by searching Local, then Enclosing, then Global, then Built-in scopes in that order — a name in an inner scope shadows the same name in an outer scope.",
  },
  {
    id: "py-closure-cell",
    language: "python",
    title: "Closure cell object stores the shared reference",
    tag: "understanding",
    code: `def make_counter():
    count = 0           # lives in a closure 'cell' object

    def increment():
        nonlocal count
        count += 1
        return count

    def reset():
        nonlocal count
        count = 0

    return increment, reset

inc, rst = make_counter()
print(inc())  # 1
print(inc())  # 2
print(inc())  # 3
rst()
print(inc())  # 1  — both closures share the same cell

# Inspect it:
import inspect
print(inspect.getclosurevars(inc).nonlocals)  # {'count': 1}`,
    explanation:
      "A closure cell is a mutable container that multiple inner functions can share — every function closed over a variable holds a reference to the same cell object, not a copy of the value.",
  },
  {
    id: "py-late-bind-loop",
    language: "python",
    title: "Late binding of loop variable in closures",
    tag: "understanding",
    code: `# BROKEN: all lambdas see the final value of i
fns = [lambda: i for i in range(5)]
print([f() for f in fns])   # [4, 4, 4, 4, 4]  — surprise!

# FIX 1: capture current value as a default argument
fns = [lambda i=i: i for i in range(5)]
print([f() for f in fns])   # [0, 1, 2, 3, 4]

# FIX 2: use functools.partial
from functools import partial
def identity(x): return x
fns = [partial(identity, i) for i in range(5)]
print([f() for f in fns])   # [0, 1, 2, 3, 4]`,
    explanation:
      "Closures capture the variable itself (via a cell), not its value at definition time — so all closures in a loop see whatever the loop variable holds when they're eventually called.",
  },
  {
    id: "py-class-var-shared",
    language: "python",
    title: "Mutable class variable shared across all instances",
    tag: "understanding",
    code: `class Team:
    members = []           # class variable — shared by all instances!

    def join(self, name):
        self.members.append(name)  # mutates the shared list

t1 = Team()
t2 = Team()
t1.join("Alice")
t2.join("Bob")
print(t1.members)  # ['Alice', 'Bob']  — t2's change shows up in t1!

# Fix: create a new list per instance in __init__
class Team:
    def __init__(self):
        self.members = []  # instance variable

t1, t2 = Team(), Team()
t1.join = lambda n: t1.members.append(n)
t1.join("Alice")
print(t1.members)  # ['Alice']
print(t2.members)  # []`,
    explanation:
      "A mutable class variable is shared among all instances — appending to it from any instance affects every other instance, so always initialize mutable per-instance state in __init__.",
  },
  {
    id: "py-int-cache-range",
    language: "python",
    title: "CPython caches integers -5 to 256",
    tag: "understanding",
    code: `# CPython pre-allocates integer objects for -5 to 256
a = 100
b = 100
print(a is b)    # True  — same cached object

a = 257
b = 257
print(a is b)    # False — new objects created (outside cache range)

# This is an implementation detail of CPython, not the language spec
# In interactive sessions, the compiler may intern larger ints too
x = 1000
y = 1000
print(x is y)    # may be True in REPL, False in scripts — unreliable

# Always use == for value comparison, never is
print(x == y)    # True  — always correct`,
    explanation:
      "CPython caches small integer objects (-5 to 256) for performance, so identity checks with 'is' appear to work for them — but this is an implementation detail you should never rely on.",
  },
  {
    id: "py-str-intern",
    language: "python",
    title: "String interning and sys.intern()",
    tag: "understanding",
    code: `import sys

# CPython automatically interns compile-time string constants
a = "hello"
b = "hello"
print(a is b)     # True — interned at compile time

# Strings with spaces are NOT automatically interned
a = "hello world"
b = "hello world"
print(a is b)     # False (or True in interactive — unreliable)

# Force interning with sys.intern()
a = sys.intern("hello world")
b = sys.intern("hello world")
print(a is b)     # True — guaranteed

# Benefit: interned strings compare by identity (pointer), not value
# Useful in parsers/symbol tables for O(1) equality checks`,
    explanation:
      "CPython interns simple identifier-like strings automatically; sys.intern() forces interning for any string, enabling O(1) identity-based equality checks useful in parsers and caches.",
  },
  {
    id: "py-is-none-vs-eq",
    language: "python",
    title: "Why `is None` is preferred over `== None`",
    tag: "understanding",
    code: `# None is a singleton — there is exactly one None object
x = None
print(x is None)     # True  — correct idiom
print(x == None)     # True  — works but can lie

# The problem: __eq__ can be overridden to return True for anything
class Tricky:
    def __eq__(self, other): return True

obj = Tricky()
print(obj == None)   # True  — misleading!
print(obj is None)   # False — correct

# PEP 8 explicitly recommends 'is None' and 'is not None'
def process(value=None):
    if value is None:
        return "default"
    return value`,
    explanation:
      "None is a singleton, so 'is None' tests identity (always correct), while '== None' calls __eq__ which can be overridden to return True for non-None objects — PEP 8 mandates 'is None'.",
  },
  {
    id: "py-del-unbind",
    language: "python",
    title: "`del x` unbinds the name, it does not delete the object",
    tag: "understanding",
    code: `a = [1, 2, 3]
b = a          # b and a point to the same list

del a          # unbinds the name 'a'; the list is NOT destroyed yet
# print(a)    # NameError: name 'a' is not defined
print(b)       # [1, 2, 3] — list still alive because b holds a reference

# The object is garbage-collected only when its reference count hits 0
import sys
x = object()
y = x
print(sys.getrefcount(x))  # 3 (x, y, and the getrefcount arg)
del x
print(sys.getrefcount(y))  # 2`,
    explanation:
      "'del x' removes the binding of the name x in the current scope — the underlying object is only freed when no other references to it exist.",
  },
  {
    id: "py-nonlocal-rebind",
    language: "python",
    title: "`nonlocal` allows rebinding in the enclosing scope",
    tag: "understanding",
    code: `def make_toggle():
    state = False   # enclosing scope variable

    def toggle():
        nonlocal state      # required to rebind (not just mutate)
        state = not state   # rebinding: would fail without nonlocal
        return state

    return toggle

t = make_toggle()
print(t())   # True
print(t())   # False
print(t())   # True

# Without nonlocal, 'state = ...' would create a NEW local variable
# and the enclosing state would remain unchanged`,
    explanation:
      "Without 'nonlocal', any assignment inside a nested function creates a local variable that shadows the enclosing one — 'nonlocal' explicitly opts in to rebinding the outer name.",
  },
  {
    id: "py-global-access",
    language: "python",
    title: "`global` declaration inside a function",
    tag: "understanding",
    code: `count = 0   # module-level variable

def increment():
    global count    # declare intent to rebind the global
    count += 1      # without 'global', this would raise UnboundLocalError

increment()
increment()
print(count)   # 2

# Reading a global doesn't need the declaration — only rebinding does
total = 100
def show():
    print(total)   # fine to read without 'global'

show()  # 100

# Mutable globals (lists/dicts) can be mutated without 'global'
items = []
def add(x): items.append(x)   # mutation, not rebinding — no 'global' needed
add(1); add(2)
print(items)  # [1, 2]`,
    explanation:
      "The 'global' declaration is only needed when you want to rebind a module-level name inside a function — reading globals and mutating mutable globals both work without it.",
  },
  {
    id: "py-listcomp-scope-py3",
    language: "python",
    title: "List comprehension has its own scope in Python 3",
    tag: "understanding",
    code: `# In Python 3, comprehension variables do NOT leak into enclosing scope
x = "outer"
result = [x for x in range(5)]   # 'x' here is local to the comprehension
print(x)       # 'outer'  — unchanged! (Python 3 behaviour)
print(result)  # [0, 1, 2, 3, 4]

# In Python 2 (old behaviour) x would have been 4 after this

# Generator expressions and dict/set comprehensions also have own scope
squares = {x: x**2 for x in range(4)}
print(x)   # 'outer'  — still unchanged

# But a for loop DOES leak its variable
for i in range(3):
    pass
print(i)   # 2  — loop variable is accessible after the loop`,
    explanation:
      "Python 3 gives each comprehension its own scope to prevent loop variable leakage — a deliberate fix from Python 2 behaviour, but plain 'for' loops still expose their variable afterward.",
  },
  {
    id: "py-gen-lazy-trace",
    language: "python",
    title: "Generator is lazy: tracing when the body executes",
    tag: "understanding",
    code: `def traced_gen():
    print("start")
    yield 1
    print("after 1")
    yield 2
    print("after 2")

g = traced_gen()          # nothing printed yet — body hasn't run
print("before next()")
v1 = next(g)              # prints "start", returns 1
print(f"got {v1}")        # got 1
v2 = next(g)              # prints "after 1", returns 2
print(f"got {v2}")        # got 2
# next(g)  would raise StopIteration and print "after 2"`,
    explanation:
      "A generator function doesn't execute any of its body when called — execution only advances to the next 'yield' each time next() is called, making generators inherently lazy.",
  },
  {
    id: "py-short-circuit-trace",
    language: "python",
    title: "`and`/`or` short-circuit and return the operand",
    tag: "understanding",
    code: `# 'and' returns the first falsy operand, or the last one if all truthy
print(1 and 2)          # 2     — all truthy, returns last
print(0 and 2)          # 0     — first falsy
print("" and "hello")   # ''    — first falsy

# 'or' returns the first truthy operand, or the last one if all falsy
print(0 or 42)          # 42    — first truthy
print(None or "")       # ''    — all falsy, returns last
print("a" or "b")       # 'a'   — first truthy

# Practical idiom: default value
name = ""
display = name or "Anonymous"
print(display)   # 'Anonymous'

# Short-circuit: right side is NOT evaluated if unnecessary
def boom(): raise RuntimeError("should not run")
result = True or boom()   # boom() never called`,
    explanation:
      "'and' and 'or' return one of their operands (not necessarily a bool), and they stop evaluating as soon as the result is determined — useful for default value patterns and conditional evaluation.",
  },
  {
    id: "py-chained-cmp",
    language: "python",
    title: "Chained comparisons evaluate the middle operand once",
    tag: "understanding",
    code: `x = 5
# Chained comparison: 1 < x < 10
print(1 < x < 10)    # True  — reads naturally, like math notation
print(1 < x and x < 10)  # equivalent expansion

# The middle expression is evaluated only once
import random
# x evaluated once even though it appears in two comparisons
print(0 <= x < 100)  # True

# Chaining works for all comparison operators
a, b, c = 1, 2, 3
print(a < b < c)    # True
print(a < b > 0)    # True  — b > 0 also checked
print(a == 1 == b - 1)  # True

# Gotcha: not a transitive chain with non-comparable types
# 1 < "a"  would raise TypeError`,
    explanation:
      "Python's chained comparisons like '1 < x < 10' are syntactic sugar for '1 < x and x < 10', with the guarantee that the middle expression x is evaluated exactly once.",
  },
  {
    id: "py-deque-maxlen-ring",
    language: "python",
    title: "deque(maxlen=N) as a ring buffer",
    tag: "structures",
    code: `from collections import deque

# Ring buffer: automatically drops oldest item when full
log = deque(maxlen=3)

for msg in ["a", "b", "c", "d", "e"]:
    log.append(msg)
    print(list(log))
# ['a']
# ['a', 'b']
# ['a', 'b', 'c']
# ['b', 'c', 'd']  — 'a' dropped
# ['c', 'd', 'e']  — 'b' dropped

print(log.maxlen)   # 3
print(len(log))     # 3`,
    explanation:
      "A deque with maxlen acts as a fixed-size ring buffer — when it's full, appending a new item automatically discards the oldest one from the opposite end.",
  },
  {
    id: "py-deque-rotate-usage",
    language: "python",
    title: "deque.rotate() to shift elements",
    tag: "structures",
    code: `from collections import deque

d = deque([1, 2, 3, 4, 5])

d.rotate(2)     # shift right by 2 (tail wraps to head)
print(list(d))  # [4, 5, 1, 2, 3]

d.rotate(-2)    # shift left by 2 (head wraps to tail)
print(list(d))  # [1, 2, 3, 4, 5]  — back to original

# Practical: implement a round-robin scheduler
tasks = deque(["A", "B", "C"])
for _ in range(5):
    print(tasks[0], end=" ")  # process current task
    tasks.rotate(-1)           # advance to next
# A B C A B`,
    explanation:
      "deque.rotate(n) moves elements from one end to the other in O(1) — positive n rotates right (last elements become first), negative n rotates left.",
  },
  {
    id: "py-dict-comp-invert",
    language: "python",
    title: "Dict comprehension to invert a mapping",
    tag: "structures",
    code: `original = {"a": 1, "b": 2, "c": 3}

# Swap keys and values
inverted = {v: k for k, v in original.items()}
print(inverted)  # {1: 'a', 2: 'b', 3: 'c'}

# Filter while inverting: only keep entries where value > 1
filtered = {v: k for k, v in original.items() if v > 1}
print(filtered)  # {2: 'b', 3: 'c'}

# Transform keys and values simultaneously
upper = {k.upper(): v * 10 for k, v in original.items()}
print(upper)     # {'A': 10, 'B': 20, 'C': 30}

# Gotcha: duplicate values in original → last one wins when inverted
dup = {"x": 1, "y": 1}
print({v: k for k, v in dup.items()})  # {1: 'y'}`,
    explanation:
      "Dict comprehensions follow the same {key: value for item in iterable} syntax as list comprehensions and are the idiomatic way to transform or invert a mapping in one readable expression.",
  },
  {
    id: "py-set-comp-filter",
    language: "python",
    title: "Set comprehension for deduplication",
    tag: "structures",
    code: `words = ["apple", "banana", "avocado", "blueberry", "apricot", "banana"]

# Remove duplicates while filtering
a_words = {w for w in words if w.startswith("a")}
print(a_words)   # {'apple', 'avocado', 'apricot'} — no duplicates

# Set comprehension with transformation
first_letters = {w[0] for w in words}
print(first_letters)  # {'a', 'b'}  — unique first letters

# Compare: list comprehension keeps duplicates
print([w for w in words if w.startswith("b")])
# ['banana', 'blueberry', 'banana']`,
    explanation:
      "Set comprehensions use curly braces and produce a set, so they deduplicate automatically — useful when you want unique results from a transformation or filter in one step.",
  },
  {
    id: "py-frozenset-dict-key",
    language: "python",
    title: "frozenset as a dictionary key",
    tag: "structures",
    code: `# frozenset is hashable, so it can be a dict key or set member
graph_edges = {}

# Store an undirected edge as a frozenset (order doesn't matter)
def add_edge(u, v, weight):
    graph_edges[frozenset({u, v})] = weight

add_edge("A", "B", 4)
add_edge("B", "A", 4)   # same edge — overwrites with same key

print(graph_edges)
# {frozenset({'A', 'B'}): 4}  — only one entry

# Look up by either order
print(graph_edges[frozenset({"B", "A"})])  # 4

# Also: frozenset in a set
seen = {frozenset({1, 2}), frozenset({3, 4})}
print(frozenset({2, 1}) in seen)   # True`,
    explanation:
      "frozenset is the immutable, hashable counterpart to set — because its contents can't change, Python can compute a stable hash, making it usable as dict keys or set elements.",
  },
  {
    id: "py-defaultdict-set",
    language: "python",
    title: "defaultdict(set) for grouping unique values",
    tag: "structures",
    code: `from collections import defaultdict

# Group words by their first letter, no duplicates per group
words = ["ant", "apple", "bat", "bee", "bat", "ant"]
by_letter = defaultdict(set)   # auto-creates set() for new keys

for word in words:
    by_letter[word[0]].add(word)

print(dict(by_letter))
# {'a': {'ant', 'apple'}, 'b': {'bat', 'bee'}}  — duplicates removed

# Access a missing key creates an empty set automatically
print(by_letter["z"])  # set()
print(dict(by_letter)) # 'z' now appears with empty set`,
    explanation:
      "defaultdict(set) eliminates the boilerplate of checking whether a key exists before adding to its group — the factory is called once per new key to produce the default value.",
  },
  {
    id: "py-counter-most-common",
    language: "python",
    title: "Counter.most_common(n) for top-N items",
    tag: "structures",
    code: `from collections import Counter

text = "the quick brown fox jumps over the lazy dog the fox"
words = text.split()

c = Counter(words)
print(c.most_common(3))
# [('the', 3), ('fox', 2), ('quick', 1)]  — sorted by count descending

# Counter also supports arithmetic
c2 = Counter({"the": 1, "cat": 5})
combined = c + c2
print(combined["the"])   # 4  (3 + 1)
print(combined["cat"])   # 5

# Subtract counts (floor at 0 for +, allow negatives for subtract)
c.subtract(c2)
print(c["the"])   # 2`,
    explanation:
      "Counter.most_common(n) returns the n highest-count elements in descending order using a heap internally — omitting n returns all items sorted, and Counters support +/-/& set-like operations.",
  },
  {
    id: "py-namedtuple-index-field",
    language: "python",
    title: "namedtuple: access by name and by index",
    tag: "structures",
    code: `from collections import namedtuple

Point = namedtuple("Point", ["x", "y", "z"])
p = Point(1, 2, 3)

# Access by attribute name
print(p.x, p.y, p.z)   # 1 2 3

# Access by index (it's a tuple!)
print(p[0], p[1])       # 1 2

# Unpack like a regular tuple
x, y, z = p
print(x, y, z)          # 1 2 3

# _replace() returns a new instance with changes
p2 = p._replace(z=99)
print(p2)               # Point(x=1, y=2, z=99)

# _asdict() gives an OrderedDict
print(p._asdict())      # {'x': 1, 'y': 2, 'z': 3}`,
    explanation:
      "namedtuple adds field names to a regular tuple — you get both attribute-style access and index/unpack access, with full tuple compatibility (immutable, hashable, memory-efficient).",
  },
  {
    id: "py-ordereddict-fifo",
    language: "python",
    title: "OrderedDict as FIFO cache with popitem(last=False)",
    tag: "structures",
    code: `from collections import OrderedDict

class FIFOCache:
    def __init__(self, capacity):
        self.cache = OrderedDict()
        self.capacity = capacity

    def get(self, key):
        return self.cache.get(key)

    def put(self, key, value):
        if key in self.cache:
            del self.cache[key]
        elif len(self.cache) >= self.capacity:
            self.cache.popitem(last=False)  # remove oldest (FIFO)
        self.cache[key] = value

c = FIFOCache(2)
c.put("a", 1); c.put("b", 2)
c.put("c", 3)   # evicts 'a'
print(c.get("a"))  # None  — evicted
print(c.get("b"))  # 2`,
    explanation:
      "OrderedDict remembers insertion order and exposes popitem(last=False) to remove the oldest entry — handy for building FIFO eviction caches before Python 3.7 guaranteed dict ordering.",
  },
  {
    id: "py-chainmap-parents",
    language: "python",
    title: "ChainMap .parents property for scoped lookups",
    tag: "structures",
    code: `from collections import ChainMap

# Simulate nested scopes: local > config > defaults
defaults = {"color": "blue",  "size": 10,  "font": "serif"}
config   = {"color": "green", "size": 12}
local    = {"color": "red"}

scope = ChainMap(local, config, defaults)
print(scope["color"])  # 'red'    — local wins
print(scope["size"])   # 12       — config wins
print(scope["font"])   # 'serif'  — from defaults

# .parents returns a new ChainMap skipping the first map
parent_scope = scope.parents
print(parent_scope["color"])  # 'green'  — local layer removed

# New child scope
child = scope.new_child({"size": 99})
print(child["size"])   # 99`,
    explanation:
      "ChainMap links multiple dicts into a single lookup chain without copying them — .parents gives you the view from the next layer up, perfect for implementing scoped configuration or variable lookup tables.",
  },
  {
    id: "py-heapq-merge",
    language: "python",
    title: "heapq.merge() for sorted merge of iterables",
    tag: "structures",
    code: `import heapq

# Each input iterable must already be sorted
a = [1, 4, 7]
b = [2, 5, 8]
c = [3, 6, 9]

# merge() returns a lazy iterator — no full list built in memory
merged = heapq.merge(a, b, c)
print(list(merged))   # [1, 2, 3, 4, 5, 6, 7, 8, 9]

# Works with any sorted iterables (files, generators, etc.)
import heapq
lines_a = ["apple\\n", "cherry\\n"]
lines_b = ["banana\\n", "date\\n"]
for line in heapq.merge(lines_a, lines_b):
    print(line.strip())   # apple  banana  cherry  date`,
    explanation:
      "heapq.merge() performs an n-way sorted merge lazily — it uses a heap of size n (number of iterables) internally, so it never loads all data into memory at once.",
  },
  {
    id: "py-array-typecodes",
    language: "python",
    title: "array.array typecodes and memory savings",
    tag: "structures",
    code: `import array, sys

# array.array stores homogeneous C-typed values compactly
ints  = array.array("i", range(1000))   # 'i' = signed int (4 bytes each)
floats = array.array("d", [1.0, 2.0, 3.0])  # 'd' = double (8 bytes each)

# Memory: array vs list
py_list = list(range(1000))
print(sys.getsizeof(ints))     # ~4056 bytes  (4 bytes * 1000 + overhead)
print(sys.getsizeof(py_list))  # ~8056 bytes  (pointers + int objects)

# Common typecodes:
# 'b' signed char, 'B' unsigned char, 'h' short, 'i' int,
# 'l' long, 'f' float, 'd' double, 'u' Py_UNICODE (deprecated)
print(ints.typecode)   # 'i'
print(ints.itemsize)   # 4`,
    explanation:
      "array.array stores elements as raw C values (not Python objects), making it 2–5× more memory-efficient than a list for large homogeneous numeric data, though numpy is preferred for computation.",
  },
  {
    id: "py-queue-lifo",
    language: "python",
    title: "queue.LifoQueue — thread-safe stack",
    tag: "structures",
    code: `from queue import LifoQueue

# LifoQueue: thread-safe Last-In-First-Out (stack)
stack = LifoQueue(maxsize=5)

stack.put("first")
stack.put("second")
stack.put("third")

print(stack.get())   # 'third'   — last in, first out
print(stack.get())   # 'second'
print(stack.qsize()) # 1

# Non-blocking get (raises queue.Empty if empty)
from queue import Empty
try:
    stack.get_nowait()
    stack.get_nowait()   # raises Empty
except Empty:
    print("stack is empty")`,
    explanation:
      "queue.LifoQueue is a thread-safe stack backed by a deque — unlike a plain list, put() and get() acquire a mutex, making it safe to use as a work stack across multiple threads.",
  },
  {
    id: "py-queue-priority",
    language: "python",
    title: "queue.PriorityQueue with tuples",
    tag: "structures",
    code: `from queue import PriorityQueue

pq = PriorityQueue()

# Items are (priority, data) tuples; lower number = higher priority
pq.put((3, "low priority task"))
pq.put((1, "urgent task"))
pq.put((2, "medium task"))

while not pq.empty():
    priority, task = pq.get()
    print(priority, task)
# 1 urgent task
# 2 medium task
# 3 low priority task

# Tie-breaking: if priorities equal, tuples compare next element
pq.put((1, "z-task"))
pq.put((1, "a-task"))
print(pq.get())  # (1, 'a-task')  — 'a' < 'z'`,
    explanation:
      "PriorityQueue is a thread-safe heap-based priority queue — items are typically (priority, data) tuples so that lower-numbered priorities are dequeued first, with lexicographic tie-breaking.",
  },
  {
    id: "py-mutable-default-caveat",
    language: "python",
    title: "Mutable default argument accumulates state across calls",
    tag: "caveats",
    code: `# BROKEN: the list is created once when the function is defined
def append_item(item, lst=[]):
    lst.append(item)
    return lst

print(append_item(1))    # [1]
print(append_item(2))    # [1, 2]  — surprise! same list persists
print(append_item(3))    # [1, 2, 3]

# FIX: use None as the sentinel and create a new list per call
def append_item(item, lst=None):
    if lst is None:
        lst = []
    lst.append(item)
    return lst

print(append_item(1))   # [1]
print(append_item(2))   # [2]  — fresh list each call`,
    explanation:
      "Default argument values are evaluated once when the function is defined, not on each call — so a mutable default like [] is shared across all calls and accumulates state between them.",
  },
  {
    id: "py-late-bind-lambda",
    language: "python",
    title: "Lambda in a loop captures the variable by reference",
    tag: "caveats",
    code: `# BROKEN: all functions capture 'i' by reference
callbacks = []
for i in range(5):
    callbacks.append(lambda: i)

# i is now 4 after the loop
print([cb() for cb in callbacks])   # [4, 4, 4, 4, 4]

# FIX: bind current value as a default argument
callbacks = []
for i in range(5):
    callbacks.append(lambda i=i: i)  # i=i captures current value

print([cb() for cb in callbacks])   # [0, 1, 2, 3, 4]`,
    explanation:
      "Lambdas (and all closures) capture variables by reference — when the loop finishes, 'i' holds its final value, so every lambda returns the same thing unless you force an early binding with a default argument.",
  },
  {
    id: "py-no-int-overflow",
    language: "python",
    title: "Python integers never overflow (arbitrary precision)",
    tag: "caveats",
    code: `# Python integers have arbitrary precision — no overflow
big = 2 ** 1000
print(big)   # a 302-digit number!
print(type(big))  # <class 'int'>

# Factorial of 100 — no overflow, no bignum library needed
import math
print(math.factorial(100))
# 93326215443944152681699238856266700490715968264381621468592963895217599993229915608941463976156518286253697920827223758251185210916864000000000000000000000000

# This is unlike C/Java/Rust where int is 32 or 64 bits
# Performance: large ints are slower; use numpy for numeric arrays
import sys
print(sys.getsizeof(2**30))   # 28 bytes
print(sys.getsizeof(2**100))  # 40 bytes  — extra limb`,
    explanation:
      "Python's int type uses variable-length internal storage (similar to a bignum library), so arithmetic never silently wraps around — you pay in speed and memory for very large values.",
  },
  {
    id: "py-float-eq-pitfall",
    language: "python",
    title: "0.1 + 0.2 != 0.3 due to IEEE 754",
    tag: "caveats",
    code: `print(0.1 + 0.2)           # 0.30000000000000004
print(0.1 + 0.2 == 0.3)   # False!

# Fix 1: math.isclose() with tolerance
import math
print(math.isclose(0.1 + 0.2, 0.3))   # True

# Fix 2: round to N decimal places before comparing
print(round(0.1 + 0.2, 10) == round(0.3, 10))   # True

# Fix 3: use decimal.Decimal for exact base-10 arithmetic
from decimal import Decimal
print(Decimal("0.1") + Decimal("0.2"))          # 0.3
print(Decimal("0.1") + Decimal("0.2") == Decimal("0.3"))  # True`,
    explanation:
      "Most decimal fractions can't be represented exactly in binary floating-point (IEEE 754), so direct equality comparisons on floats are unreliable — use math.isclose() for tolerance-based comparison or decimal.Decimal for exact arithmetic.",
  },
  {
    id: "py-nan-not-equal",
    language: "python",
    title: "float('nan') != float('nan') is True",
    tag: "caveats",
    code: `nan = float("nan")

# NaN is not equal to anything — including itself (IEEE 754 rule)
print(nan == nan)    # False
print(nan != nan)    # True
print(nan < 0)       # False
print(nan > 0)       # False
print(nan in [nan])  # False! (uses ==)

# Check for NaN with math.isnan()
import math
print(math.isnan(nan))   # True

# Sorting with NaN produces undefined order
data = [3.0, float("nan"), 1.0]
data.sort()
print(data)   # unpredictable — NaN breaks the sort invariant`,
    explanation:
      "IEEE 754 mandates that NaN is not equal to any value including itself — always use math.isnan() or numpy.isnan() to test for it, and never store NaN in sorted containers.",
  },
  {
    id: "py-string-concat-perf",
    language: "python",
    title: "'+=' on strings in a loop is O(n²); use list+join",
    tag: "caveats",
    code: `# SLOW: each += creates a new string object, copies all chars so far
# O(n^2) total work for n concatenations
result = ""
for word in ["hello", "world", "foo", "bar"]:
    result += word + " "
print(result.strip())  # 'hello world foo bar'

# FAST: collect parts, join once — O(n) total
parts = []
for word in ["hello", "world", "foo", "bar"]:
    parts.append(word)
result = " ".join(parts)
print(result)   # 'hello world foo bar'

# Even faster: list comprehension + join
result = " ".join(word for word in ["hello", "world", "foo", "bar"])`,
    explanation:
      "Strings are immutable in Python, so each += allocates a new string and copies all existing characters — for building strings incrementally, collect parts in a list and join at the end.",
  },
  {
    id: "py-list-clear-refs",
    language: "python",
    title: "list.clear() vs rebinding: clear keeps the same object",
    tag: "caveats",
    code: `a = [1, 2, 3]
b = a          # b references the same list

# Rebinding: 'a' now points to a new list; b still points to old one
a = []
print(b)       # [1, 2, 3]  — unchanged

a = [1, 2, 3]
b = a

# clear(): empties the list in place; both a and b see the change
a.clear()
print(b)       # []  — b sees the empty list!
print(a is b)  # True  — still the same object

# Also: del a[:] achieves the same in-place clear
a = [1, 2, 3]
b = a
del a[:]
print(b)   # []`,
    explanation:
      "list.clear() and del lst[:] mutate the list in place, so all references to that list object see an empty list — rebinding with lst = [] only redirects the local name, leaving other references untouched.",
  },
  {
    id: "py-tuple-mutable-nested",
    language: "python",
    title: "Tuple containing a list: 'immutable' with a mutable inside",
    tag: "caveats",
    code: `t = (1, [2, 3], 4)

# The tuple itself is immutable — you can't reassign its slots
# t[1] = "new"  # TypeError: 'tuple' object does not support item assignment

# But the list inside is still mutable!
t[1].append(99)
print(t)   # (1, [2, 3, 99], 4)  — tuple changed appearance!

# This also breaks hashing
try:
    hash(t)   # TypeError: unhashable type: 'list'
except TypeError as e:
    print(e)

# Immutability applies to the tuple's references, not the objects pointed to`,
    explanation:
      "Tuples are immutable in the sense that you can't replace their elements, but if an element is a mutable object like a list, that object itself can still be mutated in place.",
  },
  {
    id: "py-shallow-copy-trap",
    language: "python",
    title: "list.copy() is shallow: nested objects are shared",
    tag: "caveats",
    code: `import copy

original = [[1, 2], [3, 4]]
shallow  = original.copy()    # or list(original) or original[:]

# Outer list is independent
shallow.append([5, 6])
print(len(original))   # 2  — unaffected

# But inner lists are SHARED
shallow[0].append(99)
print(original[0])     # [1, 2, 99]  — original mutated!

# Fix: use copy.deepcopy() for fully independent copy
deep = copy.deepcopy(original)
deep[0].append(0)
print(original[0])     # [1, 2, 99]  — unchanged`,
    explanation:
      "A shallow copy creates a new container but fills it with references to the same objects — nested mutable structures are shared between the original and the copy until you use copy.deepcopy().",
  },
  {
    id: "py-diamond-mro-order",
    language: "python",
    title: "Diamond inheritance MRO via C3 linearization",
    tag: "caveats",
    code: `class A:
    def method(self): return "A"

class B(A):
    def method(self): return "B"

class C(A):
    def method(self): return "C"

class D(B, C):   # diamond: D -> B -> C -> A
    pass

d = D()
print(d.method())        # 'B'  — B comes before C in MRO
print(D.__mro__)
# (<class 'D'>, <class 'B'>, <class 'C'>, <class 'A'>, <class 'object'>)

# C3 linearization guarantees:
# 1. A subclass always appears before its parents
# 2. The order of bases in the class definition is respected`,
    explanation:
      "Python's C3 linearization algorithm computes the Method Resolution Order (MRO) for multiple inheritance — it ensures each class appears only once and that subclasses are always checked before their parents.",
  },
  {
    id: "py-super-coop",
    language: "python",
    title: "`super()` enables cooperative multiple inheritance",
    tag: "caveats",
    code: `class Animal:
    def speak(self):
        print("...")

class Dog(Animal):
    def speak(self):
        print("Woof")
        super().speak()   # calls next in MRO — Animal.speak

class Robot:
    def speak(self):
        print("Beep")
        super().speak()   # calls next in MRO — could be Animal!

class RoboDog(Dog, Robot):
    pass

# MRO: RoboDog -> Dog -> Robot -> Animal -> object
RoboDog().speak()
# Woof
# Beep
# ...`,
    explanation:
      "super() doesn't mean 'call the parent class' — it means 'call the next class in the MRO', enabling cooperative inheritance where every class in the chain participates via super().",
  },
  {
    id: "py-dict-order-caveat",
    language: "python",
    title: "dict preserves insertion order since Python 3.7",
    tag: "caveats",
    code: `# Python 3.7+: dict insertion order is guaranteed by the language spec
# (CPython 3.6 did it as an implementation detail)

d = {}
d["c"] = 3
d["a"] = 1
d["b"] = 2

print(list(d.keys()))    # ['c', 'a', 'b']  — insertion order preserved
print(list(d.values()))  # [3, 1, 2]

# Updating an existing key does NOT change its position
d["a"] = 99
print(list(d.keys()))    # ['c', 'a', 'b']  — 'a' stays in place

# To move a key to the end, delete and re-insert
del d["a"]
d["a"] = 99
print(list(d.keys()))    # ['c', 'b', 'a']`,
    explanation:
      "Since Python 3.7, dict preserves insertion order as a language guarantee — OrderedDict is still useful for its move_to_end() and popitem(last=False) methods, but plain dict now has reliable ordering.",
  },
  {
    id: "py-gen-exhausted",
    language: "python",
    title: "Generator is single-pass; re-iterating yields nothing",
    tag: "caveats",
    code: `def squares(n):
    for i in range(n):
        yield i * i

gen = squares(5)

# First pass: works as expected
print(list(gen))   # [0, 1, 4, 9, 16]

# Second pass: generator is exhausted — returns empty
print(list(gen))   # []

# Gotcha: if you pass a generator to a function that iterates twice
def first_and_count(it):
    first = next(it, None)
    total = sum(it)   # rest of the items
    return first, total

gen = squares(5)
print(first_and_count(gen))   # (0, 30)  — works: 1+4+9+16=30

gen = squares(5)
print(list(gen), list(gen))   # [0,1,4,9,16]  []  — second list empty`,
    explanation:
      "A generator object can only be iterated once — after StopIteration is raised, calling iter() on it again returns the same exhausted object, so list(gen) a second time gives [].",
  },
  {
    id: "py-zip-truncate",
    language: "python",
    title: "zip() stops at the shortest iterable",
    tag: "caveats",
    code: `a = [1, 2, 3, 4, 5]
b = ["a", "b", "c"]

# zip stops at the shortest — elements 4 and 5 from 'a' are silently dropped
print(list(zip(a, b)))   # [(1, 'a'), (2, 'b'), (3, 'c')]

# Fix 1: itertools.zip_longest fills with a fill value
from itertools import zip_longest
print(list(zip_longest(a, b, fillvalue=None)))
# [(1, 'a'), (2, 'b'), (3, 'c'), (4, None), (5, None)]

# Fix 2: Python 3.10+ strict= raises ValueError on length mismatch
try:
    list(zip(a, b, strict=True))
except ValueError as e:
    print(e)  # zip() has arguments with different lengths`,
    explanation:
      "zip() silently drops extra elements from longer iterables — use zip_longest() to fill missing values, or zip(strict=True) (Python 3.10+) to raise an error on length mismatch.",
  },
  {
    id: "py-bigint-arith",
    language: "python",
    title: "Python integers have arbitrary precision arithmetic",
    tag: "types",
    code: `# Standard arithmetic works on arbitrarily large integers
a = 10 ** 50
b = 10 ** 50 + 1
print(a * b)   # 100...01 * 10^50, exact

# Fibonacci to 100 terms — no overflow
def fib(n):
    a, b = 0, 1
    for _ in range(n):
        a, b = b, a + b
    return a

print(fib(100))  # 354224848179261915075

# Bit operations also work on big ints
big = (1 << 256)   # 2^256 (larger than any 64-bit value)
print(big.bit_length())  # 257

# Under the hood: CPython stores ints as arrays of 30-bit digits`,
    explanation:
      "Python's int type stores numbers in arbitrary-precision format, so operations like exponentiation and factorial never overflow — the trade-off is that very large ints are slower than C longs.",
  },
  {
    id: "py-float-decimal-compare",
    language: "python",
    title: "float vs Decimal: precision and exactness",
    tag: "types",
    code: `from decimal import Decimal, getcontext

# float: fast, 64-bit IEEE 754, ~15-16 significant digits
f = 0.1 + 0.2
print(f)            # 0.30000000000000004  — binary rounding error

# Decimal: exact base-10 arithmetic, configurable precision
d = Decimal("0.1") + Decimal("0.2")
print(d)            # 0.3  — exact!

# Decimal precision is configurable
getcontext().prec = 50
print(Decimal(1) / Decimal(3))
# 0.33333333333333333333333333333333333333333333333333  (50 digits)

# Money calculations: always use Decimal
price = Decimal("19.99")
tax   = Decimal("0.08")
total = price * (1 + tax)
print(total)   # 21.5892`,
    explanation:
      "float uses binary floating-point which can't represent most decimal fractions exactly; Decimal uses base-10 arithmetic with configurable precision, making it the right choice for financial calculations.",
  },
  {
    id: "py-bool-int-subclass",
    language: "python",
    title: "bool is a subclass of int; isinstance(True, int) is True",
    tag: "types",
    code: `print(isinstance(True,  int))   # True
print(isinstance(False, int))   # True
print(type(True))               # <class 'bool'>

# Bool inherits int's methods
print(True.bit_length())        # 1
print((True).to_bytes(1, "big"))  # b'\\x01'

# Bool values in integer context
print(True + True)   # 2
print(True * 5)      # 5

# Only two instances of bool exist
print(True  is True)   # True
print(False is False)  # True

# Surprising: True == 1 and True == 1.0
print(True == 1.0)     # True
print(True == 1)       # True`,
    explanation:
      "bool is a subclass of int with exactly two instances (True and False) — they behave as 1 and 0 in arithmetic, which enables concise patterns like sum(cond for item in iterable).",
  },
  {
    id: "py-nonetype-singleton",
    language: "python",
    title: "NoneType has exactly one instance: None",
    tag: "types",
    code: `# NoneType is a class with one instance
print(type(None))     # <class 'NoneType'>
print(type(None).__name__)  # NoneType

# All references to None point to the same object
a = None
b = None
print(a is b)         # True  — identical objects

# None is the default return value
def nothing(): pass
print(nothing() is None)   # True

# None is falsy
print(bool(None))     # False
if not None:
    print("None is falsy")   # printed

# Idiomatic test
x = None
print(x is None)     # True  — preferred over x == None`,
    explanation:
      "None is a singleton — there is only one NoneType instance ever, so identity comparison (is None) is both correct and slightly faster than equality comparison (== None).",
  },
  {
    id: "py-ellipsis-obj",
    language: "python",
    title: "Ellipsis (...) as type hint placeholder and stub",
    tag: "types",
    code: `# Ellipsis is a singleton, like None
print(type(...))      # <class 'ellipsis'>
print(... is ...)     # True

# Use in type hints: Callable[..., int] = callable with any args
from typing import Callable
def apply(fn: Callable[..., int], x: int) -> int:
    return fn(x)

# Stub body (preferred over 'pass' in protocol/abstract classes)
class Shape:
    def area(self) -> float: ...

# Tuple of fixed type, unknown length: Tuple[int, ...]
from typing import Tuple
def process(data: Tuple[int, ...]) -> None: ...

# NumPy uses ... for multi-dimensional slicing
# arr[..., 0]  selects the first element along the last axis`,
    explanation:
      "Ellipsis (...) is a built-in singleton used as a no-op body in stubs/protocols, as 'any args' in Callable type hints, and as a multi-axis slice in NumPy.",
  },
  {
    id: "py-bytes-str-diff",
    language: "python",
    title: "bytes vs str: encoding bridge and common pitfalls",
    tag: "types",
    code: `# str is Unicode text; bytes is raw binary data
s: str   = "café"
b: bytes = "café".encode("utf-8")   # str -> bytes
print(b)                            # b'caf\\xc3\\xa9'

# Decode bytes back to str
print(b.decode("utf-8"))   # café

# You CANNOT mix them without explicit conversion
try:
    result = "prefix" + b   # TypeError
except TypeError as e:
    print(e)

# Comparison always returns False (not an error)
print("a" == b"a")   # False

# Common mistake: opening a file in wrong mode
# open("f.bin", "r")  reads as str — use "rb" for bytes`,
    explanation:
      "str and bytes are completely separate types in Python 3 — you must explicitly encode/decode at the boundary, preventing the silent mojibake bugs that plagued Python 2.",
  },
  {
    id: "py-bytearray-mutable",
    language: "python",
    title: "bytearray is a mutable bytes-like object",
    tag: "types",
    code: `# bytes is immutable; bytearray is mutable
b = bytes([72, 101, 108, 108, 111])   # b'Hello'
ba = bytearray(b"Hello")              # mutable copy

# Mutate by index
ba[0] = 104                  # ord('h')
print(ba)                    # bytearray(b'hello')

# Mutate a slice
ba[1:4] = b"ELL"
print(ba)                    # bytearray(b'hELLo')

# Convert back to bytes (immutable)
frozen = bytes(ba)
print(frozen)                # b'hELLo'

# bytearray supports += without allocation (unlike bytes)
ba += b"!"
print(ba)                    # bytearray(b'hELLo!')`,
    explanation:
      "bytearray is the mutable counterpart to bytes — you can change individual bytes by index or slice, making it ideal for building binary messages or doing in-place transformations.",
  },
  {
    id: "py-literal-type",
    language: "python",
    title: "typing.Literal restricts to exact values",
    tag: "types",
    code: `from typing import Literal

# Function accepts only specific string values
Direction = Literal["north", "south", "east", "west"]

def move(direction: Direction) -> str:
    return f"Moving {direction}"

move("north")   # OK
move("up")      # mypy/pyright flags this as an error

# Combine Literals with |
Status = Literal["ok", "error"] | None

def get_status() -> Status:
    return "ok"

# Useful for mode parameters that only accept certain values
def open_file(path: str, mode: Literal["r", "w", "rb", "wb"]) -> None:
    ...`,
    explanation:
      "typing.Literal lets you specify that a variable or parameter must be one of a fixed set of values — type checkers enforce this statically, catching typos and invalid states at analysis time.",
  },
  {
    id: "py-annotated-meta",
    language: "python",
    title: "typing.Annotated attaches metadata to a type",
    tag: "types",
    code: `from typing import Annotated

# Annotated[T, metadata] — metadata is ignored by Python itself
# but can be read by frameworks (Pydantic, FastAPI, etc.)
PositiveInt = Annotated[int, "must be > 0"]
Email       = Annotated[str, "valid email address"]

def create_user(age: PositiveInt, email: Email) -> None:
    ...

# Access metadata at runtime via __metadata__
import typing
hint = typing.get_type_hints(create_user, include_extras=True)
print(hint["age"])           # typing.Annotated[int, 'must be > 0']
print(hint["age"].__metadata__)  # ('must be > 0',)`,
    explanation:
      "Annotated[T, ...] lets you attach arbitrary metadata to a type hint — Python and mypy treat it as just T for type checking, but libraries like Pydantic and FastAPI read the metadata for validation and docs.",
  },
  {
    id: "py-typealias-decl",
    language: "python",
    title: "TypeAlias explicit annotation for type aliases",
    tag: "types",
    code: `from typing import TypeAlias

# Explicit type alias — mypy and IDEs understand this is an alias
Vector: TypeAlias = list[float]
Matrix: TypeAlias = list[list[float]]

def dot(a: Vector, b: Vector) -> float:
    return sum(x * y for x, y in zip(a, b))

# Python 3.12+ has a cleaner syntax with 'type' keyword:
# type Vector = list[float]  # PEP 695

# Without TypeAlias, a bare assignment looks like a variable:
Ambiguous = list[float]   # is this a type alias or a value?
Explicit: TypeAlias = list[float]  # clearly a type alias`,
    explanation:
      "TypeAlias makes your intent explicit when defining type aliases — without it, a simple assignment like Vector = list[float] is ambiguous to tools, while TypeAlias tells them it's an alias.",
  },
  {
    id: "py-typed-namedtuple",
    language: "python",
    title: "typing.NamedTuple with typed fields",
    tag: "types",
    code: `from typing import NamedTuple

class Point(NamedTuple):
    x: float
    y: float
    label: str = "origin"   # default value

p = Point(1.0, 2.0)
print(p)             # Point(x=1.0, y=2.0, label='origin')
print(p.x, p.y)      # 1.0 2.0  — named access
print(p[0], p[1])    # 1.0 2.0  — index access (it's a tuple)

# Type checking works
# Point("a", "b")  # mypy flags: expected float

# Immutable
try:
    p.x = 99    # AttributeError
except AttributeError as e:
    print(e)`,
    explanation:
      "typing.NamedTuple is the class-based way to define named tuples with full type annotations — mypy checks field types, and you get IDE autocompletion, while still inheriting all tuple behaviour.",
  },
  {
    id: "py-new-union-syntax",
    language: "python",
    title: "X | Y union syntax (Python 3.10+)",
    tag: "types",
    code: `# Python 3.10+: use X | Y instead of Union[X, Y]
def process(value: int | str) -> str:
    return str(value)

# None union: X | None instead of Optional[X]
def find(key: str) -> int | None:
    data = {"a": 1}
    return data.get(key)

# Works with isinstance() too (Python 3.10+)
x: int | str = 42
if isinstance(x, int | str):   # new! accepts a union type
    print("int or str")

# At runtime, X | Y creates a types.UnionType object
print(type(int | str))   # <class 'types.UnionType'>

# Equivalent to Union[int, str] for type checkers`,
    explanation:
      "Python 3.10 introduced the | operator for type unions in annotations and isinstance() — it's more readable than Union[X, Y] and Optional[X], and works at runtime as well as in type checkers.",
  },
  {
    id: "py-optional-none",
    language: "python",
    title: "Optional[X] is X | None; when to use each",
    tag: "types",
    code: `from typing import Optional

# Optional[X] is exactly equivalent to Union[X, None] == X | None
def greet(name: Optional[str] = None) -> str:
    if name is None:
        return "Hello, World!"
    return f"Hello, {name}!"

# Modern style (Python 3.10+): use X | None
def greet2(name: str | None = None) -> str:
    return f"Hello, {name or 'World'}!"

# When to use Optional vs X | None:
# - Optional[X] is clear and explicit about "this might be absent"
# - X | None is more consistent when mixed with other union types
# - Both are identical to type checkers

import typing
print(Optional[str] == str | None)  # True`,
    explanation:
      "Optional[X] is just syntactic sugar for Union[X, None] and has been the standard since Python 3.5 — in Python 3.10+ code, X | None is the preferred modern style for the same concept.",
  },
  {
    id: "py-isinstance-narrow",
    language: "python",
    title: "isinstance() as a type guard for narrowing",
    tag: "types",
    code: `def process(value: int | str | list) -> str:
    if isinstance(value, int):
        # type narrowed to int in this branch
        return f"integer: {value + 1}"
    elif isinstance(value, str):
        # type narrowed to str
        return f"string: {value.upper()}"
    else:
        # type narrowed to list
        return f"list with {len(value)} items"

print(process(42))          # integer: 43
print(process("hello"))     # string: HELLO
print(process([1, 2, 3]))   # list with 3 items

# isinstance also accepts a tuple of types
x: int | float = 3.14
if isinstance(x, (int, float)):
    print(x * 2)   # 6.28`,
    explanation:
      "isinstance() is both a runtime check and a static type narrowing hint — mypy and pyright understand that inside the if-branch the variable can only be the checked type.",
  },
  {
    id: "py-list-vs-deque-ops",
    language: "python",
    title: "list vs deque: O(1) append vs O(n) insert at front",
    tag: "families",
    code: `from collections import deque
import timeit

# list: O(1) append at end, O(n) insert at beginning
lst = list(range(10000))
lst.append(99)      # O(1) amortized — fast
lst.insert(0, 99)   # O(n)           — slow: shifts all elements

# deque: O(1) at both ends
dq = deque(range(10000))
dq.append(99)       # O(1) — fast
dq.appendleft(99)   # O(1) — fast!  (list.insert(0,x) is O(n))
dq.pop()            # O(1) — fast
dq.popleft()        # O(1) — fast!  (list.pop(0) is O(n))

# deque: O(n) random access (not contiguous memory)
print(dq[5000])     # works but slower than list[5000]`,
    explanation:
      "Use list when you need fast random access or only append/pop from the right end; use deque when you need O(1) operations at both ends — queues, sliding windows, and BFS are natural fits for deque.",
  },
  {
    id: "py-dict-defaultdict-counter",
    language: "python",
    title: "dict vs defaultdict vs Counter: best fit per use case",
    tag: "families",
    code: `from collections import defaultdict, Counter

data = ["a", "b", "a", "c", "b", "a"]

# Plain dict: manual key existence check
counts = {}
for x in data:
    counts[x] = counts.get(x, 0) + 1
print(counts)   # {'a': 3, 'b': 2, 'c': 1}

# defaultdict: auto-initialises missing keys
counts2 = defaultdict(int)
for x in data: counts2[x] += 1
print(dict(counts2))  # {'a': 3, 'b': 2, 'c': 1}

# Counter: purpose-built, supports arithmetic and most_common()
counts3 = Counter(data)
print(counts3)               # Counter({'a': 3, 'b': 2, 'c': 1})
print(counts3.most_common(1))  # [('a', 3)]`,
    explanation:
      "dict.get() works for one-off defaults, defaultdict eliminates key-existence boilerplate for any default type, and Counter is the right tool whenever you're tallying occurrences.",
  },
  {
    id: "py-tuple-list-memory",
    language: "python",
    title: "tuple vs list: memory and mutability comparison",
    tag: "families",
    code: `import sys

# Tuples use less memory than lists of the same content
t = (1, 2, 3, 4, 5)
l = [1, 2, 3, 4, 5]

print(sys.getsizeof(t))   # 80  bytes (CPython 3.12)
print(sys.getsizeof(l))   # 88  bytes (lists over-allocate)

# Tuples are faster to create (CPython may reuse them)
# Tuples are immutable: hashable (if contents are) → usable as dict keys
d = {t: "value"}   # OK
# d = {l: "value"} # TypeError: unhashable type: 'list'

# Lists are mutable: append/pop/insert
l.append(6)   # OK
# t.append(6) # AttributeError

# Rule of thumb: tuples for fixed records, lists for collections`,
    explanation:
      "Tuples are slightly smaller and faster than lists, and their immutability makes them hashable — prefer tuples for fixed-structure data like coordinates or records, lists for collections you'll modify.",
  },
  {
    id: "py-set-frozenset-ops",
    language: "python",
    title: "set vs frozenset: mutability and hashability",
    tag: "families",
    code: `# set is mutable, NOT hashable
s = {1, 2, 3}
s.add(4)             # OK
s.discard(1)         # OK
# hash(s)            # TypeError: unhashable type: 'set'

# frozenset is immutable and hashable
fs = frozenset([1, 2, 3])
# fs.add(4)          # AttributeError: 'frozenset' has no 'add'
print(hash(fs))      # a stable hash value

# frozenset can be used as a dict key or set element
graph = {frozenset({1, 2}): "edge A"}
nested = {frozenset({1, 2}), frozenset({3, 4})}

# All set operations work on frozenset (return frozenset)
a = frozenset([1, 2, 3])
b = frozenset([2, 3, 4])
print(a & b)   # frozenset({2, 3})`,
    explanation:
      "set and frozenset support the same mathematical operations, but frozenset is immutable and therefore hashable — use frozenset when you need sets as dict keys or set members.",
  },
  {
    id: "py-bytes-bytearray-views",
    language: "python",
    title: "bytes / bytearray / memoryview: the buffer family",
    tag: "families",
    code: `data = bytearray(b"Hello, World!")

# bytes: immutable bytes (like str for text)
b = bytes(data)
# b[0] = 72  # TypeError

# bytearray: mutable bytes (like list for text)
data[0] = 104    # 'h'
print(data[:5])  # bytearray(b'hello')

# memoryview: zero-copy view into any buffer-protocol object
mv = memoryview(data)
chunk = mv[7:12]          # no copy of bytes
print(bytes(chunk))       # b'World'

# memoryview slice is writable if the underlying buffer is mutable
mv[7:12] = b"Earth"
print(bytes(data))        # b'hello, Earth!'`,
    explanation:
      "bytes is immutable binary data, bytearray is its mutable counterpart, and memoryview is a zero-copy window into either — together they form Python's buffer protocol family for efficient binary I/O.",
  },
  {
    id: "py-str-bytes-encode",
    language: "python",
    title: "str.encode() / bytes.decode() round-trip",
    tag: "families",
    code: `text = "Héllo, wörld!"

# str -> bytes: encode with an encoding
utf8  = text.encode("utf-8")    # default encoding
latin = text.encode("latin-1")  # only if all chars fit

print(utf8)    # b'H\\xc3\\xa9llo, w\\xc3\\xb6rld!'
print(latin)   # b'H\\xe9llo, w\\xf6rld!'

# bytes -> str: decode with the same encoding
print(utf8.decode("utf-8"))       # Héllo, wörld!

# Mismatch causes UnicodeDecodeError
try:
    utf8.decode("ascii")
except UnicodeDecodeError as e:
    print(e)

# errors= parameter controls handling
print(utf8.decode("ascii", errors="replace"))  # H?llo, w?rld!`,
    explanation:
      "str.encode(encoding) converts text to bytes and bytes.decode(encoding) converts it back — always use the same encoding on both ends, and use errors='replace' or 'ignore' only when data loss is acceptable.",
  },
  {
    id: "py-text-binary-io",
    language: "python",
    title: "TextIOWrapper vs BufferedReader: text vs binary mode",
    tag: "families",
    code: `import io

# Text mode: open() returns TextIOWrapper
with open("/etc/hostname", "r", encoding="utf-8") as f:
    print(type(f))       # <class '_io.TextIOWrapper'>
    text = f.read()      # returns str
    print(type(text))    # <class 'str'>

# Binary mode: open() returns BufferedReader
with open("/etc/hostname", "rb") as f:
    print(type(f))       # <class '_io.BufferedReader'>
    data = f.read()      # returns bytes
    print(type(data))    # <class 'bytes'>

# In-memory equivalents
text_buf = io.StringIO("hello")   # text stream
bin_buf  = io.BytesIO(b"hello")   # binary stream`,
    explanation:
      "Text mode wraps the binary stream in a codec layer that decodes bytes to str on read and encodes str to bytes on write — binary mode gives you raw bytes and is faster when you don't need decoding.",
  },
  {
    id: "py-open-mode-compare",
    language: "python",
    title: "open() modes: 'r' 'rb' 'w' 'wb' 'a' 'x'",
    tag: "families",
    code: `import tempfile, os

tmp = tempfile.mktemp()

# 'w'  write text (creates/truncates)
with open(tmp, "w") as f: f.write("hello\\n")

# 'r'  read text (default)
with open(tmp, "r") as f: print(f.read())    # hello

# 'a'  append text (creates if absent)
with open(tmp, "a") as f: f.write("world\\n")

# 'rb' read binary
with open(tmp, "rb") as f: print(f.read())  # b'hello\\nworld\\n'

# 'wb' write binary (creates/truncates)
with open(tmp, "wb") as f: f.write(b"\\xff\\x00")

# 'x'  exclusive creation (raises FileExistsError if file exists)
os.unlink(tmp)
with open(tmp, "x") as f: f.write("new file")
os.unlink(tmp)`,
    explanation:
      "The mode string in open() controls whether you get text or bytes and whether writes truncate, append, or fail on existing files — 'x' is the safe 'create-new' mode that prevents accidental overwrites.",
  },
  {
    id: "py-range-list-compare",
    language: "python",
    title: "range vs list: lazy vs eager, O(1) vs O(n) membership",
    tag: "families",
    code: `import sys

r = range(1_000_000)
l = list(range(1_000_000))

# Memory: range is O(1) regardless of size
print(sys.getsizeof(r))   # 48 bytes!
print(sys.getsizeof(l))   # ~8,000,056 bytes

# Membership test: range is O(1) (math), list is O(n) (scan)
print(999_999 in r)   # True — O(1)
print(999_999 in l)   # True — O(n)

# range supports slicing and reversing without creating a list
print(r[500_000])         # 500000
print(r[::2])             # range(0, 1000000, 2)  — still a range!

# Lists needed when: mutating, storing non-int steps, random access`,
    explanation:
      "range is a lazy sequence that computes each value on demand using arithmetic — it uses O(1) memory regardless of size and tests membership in O(1), while list needs O(n) memory and O(n) for 'in'.",
  },
  {
    id: "py-map-filter-vs-comp",
    language: "python",
    title: "map()/filter() vs list comprehension: style and laziness",
    tag: "families",
    code: `nums = [1, 2, 3, 4, 5, 6]

# map() is lazy; returns an iterator
doubled = map(lambda x: x * 2, nums)
print(list(doubled))   # [2, 4, 6, 8, 10, 12]

# filter() is lazy; returns an iterator
evens = filter(lambda x: x % 2 == 0, nums)
print(list(evens))     # [2, 4, 6]

# List comprehension: eager, more readable (PEP 8 preferred style)
doubled2 = [x * 2 for x in nums]
evens2   = [x for x in nums if x % 2 == 0]

# map/filter chained: need list() to evaluate
result = list(map(lambda x: x**2, filter(lambda x: x > 3, nums)))
# vs readable comprehension:
result2 = [x**2 for x in nums if x > 3]
print(result2)   # [16, 25, 36]`,
    explanation:
      "map() and filter() return lazy iterators and can be marginally faster when calling an existing function, but list comprehensions are generally preferred in Python for readability and PEP 8 compliance.",
  },
  {
    id: "py-gen-vs-listcomp",
    language: "python",
    title: "Generator expression vs list comprehension: memory trade-off",
    tag: "families",
    code: `import sys

# List comprehension: builds the whole list in memory immediately
squares_list = [x**2 for x in range(10000)]
print(sys.getsizeof(squares_list))   # ~87,624 bytes

# Generator expression: lazy — computes one value at a time
squares_gen = (x**2 for x in range(10000))  # note: () not []
print(sys.getsizeof(squares_gen))    # 104 bytes!

# Both work with sum(), max(), any(), all()
print(sum(x**2 for x in range(100)))  # 328350  — no list built!

# Use list when: you need to iterate multiple times, index into it
# Use generator when: single pass, potentially huge data, or pipeline`,
    explanation:
      "A generator expression uses () instead of [] and is lazy — it produces values on demand without building a list in memory, making it ideal for large datasets and single-pass pipelines.",
  },
  {
    id: "py-class-namedtuple-cmp",
    language: "python",
    title: "Plain class vs NamedTuple: when each makes sense",
    tag: "families",
    code: `from typing import NamedTuple

# NamedTuple: immutable, has tuple API, auto __repr__, lightweight
class Point(NamedTuple):
    x: float
    y: float

p = Point(1.0, 2.0)
print(p)          # Point(x=1.0, y=2.0)  — free __repr__
print(p[0])       # 1.0  — index access
x, y = p          # unpacking
print(hash(p))    # hashable!

# Plain class: mutable, full control, methods, inheritance
class PointMutable:
    def __init__(self, x, y): self.x, self.y = x, y
    def translate(self, dx, dy): self.x += dx; self.y += dy

pm = PointMutable(1.0, 2.0)
pm.translate(1, 1)
print(pm.x, pm.y)  # 2.0 3.0`,
    explanation:
      "Use NamedTuple for lightweight, immutable records that benefit from tuple semantics (unpacking, hashing, indexing); use a plain class when you need mutability, complex methods, or inheritance.",
  },
  {
    id: "py-dataclass-namedtuple-cmp",
    language: "python",
    title: "dataclass vs NamedTuple: mutability and methods",
    tag: "families",
    code: `from dataclasses import dataclass, field
from typing import NamedTuple

@dataclass
class MutablePoint:
    x: float
    y: float
    history: list = field(default_factory=list)

    def move(self, dx, dy):
        self.history.append((self.x, self.y))
        self.x += dx; self.y += dy

class ImmutablePoint(NamedTuple):
    x: float
    y: float

mp = MutablePoint(0, 0)
mp.move(1, 1)
mp.move(2, 2)
print(mp.history)   # [(0, 0), (1, 1)]

ip = ImmutablePoint(1, 2)
print(hash(ip))     # hashable — NamedTuples always are
# hash(mp)          # TypeError unless frozen=True in @dataclass`,
    explanation:
      "dataclass is mutable by default and supports methods and default factories, while NamedTuple is always immutable and hashable — use @dataclass(frozen=True) to get an immutable dataclass that can also be hashed.",
  },
  {
    id: "py-json-pickle-compare",
    language: "python",
    title: "json vs pickle: portability vs richness",
    tag: "families",
    code: `import json, pickle

data = {"name": "Alice", "scores": [95, 87, 92], "active": True}

# json: human-readable, language-agnostic, safe to deserialize
json_bytes = json.dumps(data).encode()
print(json_bytes[:40])   # b'{"name": "Alice", "scores": [95, 87, 92]'

restored = json.loads(json_bytes)
print(type(restored["scores"]))   # <class 'list'>

# pickle: binary, Python-only, supports arbitrary objects
import datetime
complex_data = {"ts": datetime.datetime.now(), "fn": lambda x: x}
pkl = pickle.dumps(complex_data)
# json.dumps(complex_data)  would fail — datetime isn't JSON-serializable

# WARNING: never unpickle data from untrusted sources!
# It can execute arbitrary code during deserialization`,
    explanation:
      "json is the right default for data exchange (human-readable, safe, cross-language), while pickle handles arbitrary Python objects including custom classes, datetimes, and functions — but only from trusted sources.",
  },
  {
    id: "py-repr-str-dunder",
    language: "python",
    title: "__repr__ for debugging, __str__ for display",
    tag: "classes",
    code: `class Temperature:
    def __init__(self, celsius):
        self.celsius = celsius

    def __repr__(self):
        # Unambiguous, ideally eval()-able
        return f"Temperature({self.celsius!r})"

    def __str__(self):
        # Human-friendly
        return f"{self.celsius}°C"

t = Temperature(100)
print(repr(t))   # Temperature(100)   — uses __repr__
print(str(t))    # 100°C              — uses __str__
print(t)         # 100°C              — print() uses __str__

# In lists/dicts, repr() is used
print([t])       # [Temperature(100)]  — uses __repr__

# If only __repr__ is defined, str() falls back to it`,
    explanation:
      "__repr__ should return an unambiguous string useful for debugging (ideally evaluable), while __str__ should return a readable string for end users — if only __repr__ is defined, str() falls back to it.",
  },
  {
    id: "py-eq-hash-pair",
    language: "python",
    title: "Defining __eq__ disables __hash__; restore explicitly",
    tag: "classes",
    code: `class Point:
    def __init__(self, x, y):
        self.x, self.y = x, y

    def __eq__(self, other):
        return isinstance(other, Point) and self.x == other.x and self.y == other.y

    # Python sets __hash__ = None when you define __eq__
    # Restore it to make Point usable in sets and as dict keys:
    __hash__ = object.__hash__   # hash by identity

p1 = Point(1, 2)
p2 = Point(1, 2)
print(p1 == p2)      # True   — by value
print(hash(p1) == hash(p2))  # False — different objects

# Or use @dataclass(frozen=True) which handles both consistently
from dataclasses import dataclass
@dataclass(frozen=True)
class FrozenPoint:
    x: float; y: float
fp = FrozenPoint(1, 2)
print(hash(fp))   # consistent with __eq__`,
    explanation:
      "Python automatically sets __hash__ to None when you define __eq__, making the class unhashable — you must explicitly restore __hash__ (either object.__hash__ or a custom one consistent with __eq__).",
  },
  {
    id: "py-lt-total-ordering",
    language: "python",
    title: "functools.total_ordering from __lt__ and __eq__",
    tag: "classes",
    code: `from functools import total_ordering

@total_ordering
class Version:
    def __init__(self, major, minor):
        self.major, self.minor = major, minor

    def __eq__(self, other):
        return (self.major, self.minor) == (other.major, other.minor)

    def __lt__(self, other):
        return (self.major, self.minor) < (other.major, other.minor)

    def __repr__(self):
        return f"Version({self.major}, {self.minor})"

v1 = Version(1, 9)
v2 = Version(2, 0)

# total_ordering derives <=, >, >= from __lt__ and __eq__
print(v1 < v2)   # True
print(v1 > v2)   # False
print(v1 <= v2)  # True
print(sorted([v2, v1]))  # [Version(1, 9), Version(2, 0)]`,
    explanation:
      "functools.total_ordering generates the remaining comparison methods (__le__, __gt__, __ge__) from just __lt__ and __eq__ — a convenient way to make a class fully sortable with minimal boilerplate.",
  },
  {
    id: "py-context-dunder",
    language: "python",
    title: "__enter__/__exit__ for the context manager protocol",
    tag: "classes",
    code: `class Timer:
    import time as _time

    def __enter__(self):
        self.start = self._time.perf_counter()
        return self   # object bound to 'as' variable

    def __exit__(self, exc_type, exc_val, exc_tb):
        elapsed = self._time.perf_counter() - self.start
        print(f"Elapsed: {elapsed:.4f}s")
        return False  # False = don't suppress exceptions

with Timer() as t:
    total = sum(range(1_000_000))
# Elapsed: 0.02xxs

# __exit__ receives exception info if one was raised inside 'with'
# Return True to suppress the exception, False/None to propagate it`,
    explanation:
      "__enter__ is called on entering the 'with' block and its return value binds to the 'as' target; __exit__ is guaranteed to run on exit, even if an exception occurs, making it perfect for resource cleanup.",
  },
  {
    id: "py-getitem-setitem",
    language: "python",
    title: "__getitem__/__setitem__ for the subscript protocol",
    tag: "classes",
    code: `class Grid:
    def __init__(self, rows, cols):
        self._data = [[0] * cols for _ in range(rows)]

    def __getitem__(self, pos):
        row, col = pos      # pos is a tuple from grid[r, c]
        return self._data[row][col]

    def __setitem__(self, pos, value):
        row, col = pos
        self._data[row][col] = value

    def __delitem__(self, pos):
        row, col = pos
        self._data[row][col] = 0

g = Grid(3, 3)
g[0, 0] = 9       # calls __setitem__
g[1, 1] = 5
print(g[0, 0])    # 9  — calls __getitem__
del g[0, 0]       # calls __delitem__
print(g[0, 0])    # 0`,
    explanation:
      "__getitem__(self, key) and __setitem__(self, key, value) let your class use square-bracket syntax — key can be any object, including tuples (enabling grid[row, col] notation).",
  },
  {
    id: "py-len-bool-dunder",
    language: "python",
    title: "__len__ and __bool__ for truthiness",
    tag: "classes",
    code: `class Bag:
    def __init__(self, items):
        self._items = list(items)

    def __len__(self):
        return len(self._items)

    # If __bool__ is absent, Python falls back to __len__ != 0
    # Define __bool__ explicitly for custom truthiness logic:
    def __bool__(self):
        return bool(self._items)

empty = Bag([])
full  = Bag([1, 2, 3])

print(len(full))    # 3
print(bool(empty))  # False
print(bool(full))   # True

if full:
    print("bag is not empty")   # printed

# Without __bool__, any class with __len__==0 is falsy
# Without either, all instances are truthy`,
    explanation:
      "Python calls __bool__ for truthiness tests; if __bool__ is absent, it falls back to __len__ != 0; if neither is defined, all instances are truthy — define __len__ and you get truthiness for free.",
  },
  {
    id: "py-iter-next-protocol",
    language: "python",
    title: "__iter__/__next__ to make a class iterable",
    tag: "classes",
    code: `class Countdown:
    def __init__(self, start):
        self.current = start

    def __iter__(self):
        return self   # the object is its own iterator

    def __next__(self):
        if self.current < 0:
            raise StopIteration
        val = self.current
        self.current -= 1
        return val

for n in Countdown(3):
    print(n)   # 3  2  1  0

# Can also unpack, pass to sum(), list(), etc.
print(list(Countdown(5)))   # [5, 4, 3, 2, 1, 0]
print(sum(Countdown(10)))   # 55`,
    explanation:
      "__iter__ returns the iterator object (often self) and __next__ returns the next value or raises StopIteration — once these are defined, your object works with for-loops and all iterator consumers.",
  },
  {
    id: "py-contains-dunder",
    language: "python",
    title: "__contains__ for the `in` operator",
    tag: "classes",
    code: `class IPRange:
    def __init__(self, start: int, end: int):
        self.start = start
        self.end   = end

    def __contains__(self, item: int) -> bool:
        return self.start <= item <= self.end

    def __repr__(self):
        return f"IPRange({self.start}, {self.end})"

r = IPRange(100, 200)
print(150 in r)    # True  — calls __contains__
print(50  in r)    # False
print(200 not in r)  # False  (not in uses __contains__ too)

# Without __contains__, Python falls back to iterating via __iter__
# For ranges/intervals, explicit __contains__ is much faster (O(1) vs O(n))`,
    explanation:
      "Defining __contains__ lets your class support the 'in' operator with custom logic — without it Python falls back to a linear scan through __iter__, so __contains__ is a critical optimization for membership tests.",
  },
  {
    id: "py-call-dunder",
    language: "python",
    title: "__call__ makes an instance callable",
    tag: "classes",
    code: `class Multiplier:
    def __init__(self, factor):
        self.factor = factor

    def __call__(self, x):
        return x * self.factor

double = Multiplier(2)
triple = Multiplier(3)

print(double(5))   # 10  — instance called like a function
print(triple(4))   # 12

# Useful: stateful callable (vs a plain function)
class Counter:
    def __init__(self): self.n = 0
    def __call__(self): self.n += 1; return self.n

c = Counter()
print(c(), c(), c())   # 1 2 3

# callable() returns True if __call__ is defined
print(callable(double))   # True`,
    explanation:
      "__call__ lets you use an instance like a function — useful for stateful callables, decorators, and objects that need to be passed where callables are expected but carry configuration.",
  },
  {
    id: "py-missing-dict",
    language: "python",
    title: "__missing__ on dict subclass for custom default values",
    tag: "classes",
    code: `class AutoDict(dict):
    """Returns key itself as default value for missing keys."""

    def __missing__(self, key):
        # Called when key is not found (only by __getitem__, not .get())
        self[key] = key   # auto-populate
        return key

d = AutoDict()
print(d["x"])   # 'x'   — key not found, __missing__ called
print(d["y"])   # 'y'
print(d)        # {'x': 'x', 'y': 'y'}

# collections.defaultdict uses the same mechanism internally
# __missing__ is NOT called by .get() or 'key in d'
d2 = AutoDict({"a": 1})
print(d2.get("b"))   # None  — .get() bypasses __missing__`,
    explanation:
      "__missing__ is called by __getitem__ when a key is not found in a dict subclass — unlike defaultdict which takes a factory, __missing__ gives you full control over the default logic.",
  },
  {
    id: "py-class-getitem-generic",
    language: "python",
    title: "__class_getitem__ to support MyClass[T] syntax",
    tag: "classes",
    code: `class Stack:
    def __init__(self):
        self._items = []

    def push(self, item): self._items.append(item)
    def pop(self):        return self._items.pop()

    def __class_getitem__(cls, item):
        # Called when you write Stack[int]; return a GenericAlias
        return type(f"Stack[{item.__name__}]", (cls,), {})

# Now Stack[int] works as a type hint AND returns a class
IntStack = Stack[int]
print(IntStack)       # <class '__main__.Stack[int]'>

# Standard library uses this: list[int], dict[str, int]
print(list[int])      # list[int]  — a GenericAlias
print(dict[str, int]) # dict[str, int]`,
    explanation:
      "__class_getitem__ is called when you subscript a class like MyClass[int] — the standard library uses it to enable generic aliases like list[int] and dict[str, int] without importing from typing.",
  },
  {
    id: "py-descriptor-get-set",
    language: "python",
    title: "Data descriptor with __get__ and __set__",
    tag: "classes",
    code: `class Validated:
    """Descriptor: validates that value is positive."""

    def __set_name__(self, owner, name):
        self.name = name
        self.private = f"_{name}"

    def __get__(self, obj, objtype=None):
        if obj is None: return self   # accessed on class
        return getattr(obj, self.private, None)

    def __set__(self, obj, value):
        if value <= 0:
            raise ValueError(f"{self.name} must be positive, got {value}")
        setattr(obj, self.private, value)

class Circle:
    radius = Validated()   # class-level descriptor

c = Circle()
c.radius = 5
print(c.radius)   # 5
try:
    c.radius = -1  # ValueError: radius must be positive, got -1
except ValueError as e:
    print(e)`,
    explanation:
      "A data descriptor (defining both __get__ and __set__) intercepts attribute access on instances — it's the mechanism behind property, classmethod, and frameworks like SQLAlchemy's column definitions.",
  },
  {
    id: "py-descriptor-delete-dunder",
    language: "python",
    title: "__delete__ in a descriptor",
    tag: "classes",
    code: `class LoggedAttribute:
    def __set_name__(self, owner, name):
        self.name = name
        self.private = f"_{name}"

    def __get__(self, obj, objtype=None):
        if obj is None: return self
        return getattr(obj, self.private, None)

    def __set__(self, obj, value):
        print(f"Setting {self.name} = {value!r}")
        setattr(obj, self.private, value)

    def __delete__(self, obj):
        print(f"Deleting {self.name}")
        try:
            delattr(obj, self.private)
        except AttributeError:
            pass

class Config:
    host = LoggedAttribute()

c = Config()
c.host = "localhost"   # Setting host = 'localhost'
print(c.host)          # localhost
del c.host             # Deleting host
print(c.host)          # None`,
    explanation:
      "__delete__ is the third slot of the descriptor protocol, called when 'del obj.attr' is executed — together with __get__ and __set__ it lets a descriptor fully control an attribute's lifecycle.",
  },
  {
    id: "py-classmethod-static-cmp",
    language: "python",
    title: "classmethod vs staticmethod: when to use each",
    tag: "classes",
    code: `class Pizza:
    TAX = 0.1

    def __init__(self, toppings):
        self.toppings = toppings

    @classmethod
    def margherita(cls):
        """Factory method: receives the class, supports subclassing."""
        return cls(["tomato", "mozzarella"])

    @staticmethod
    def validate_topping(topping: str) -> bool:
        """Utility: no access to cls or self needed."""
        return isinstance(topping, str) and len(topping) > 0

p = Pizza.margherita()         # classmethod — receives Pizza
print(p.toppings)              # ['tomato', 'mozzarella']

print(Pizza.validate_topping("basil"))   # True
print(Pizza.validate_topping(""))        # False`,
    explanation:
      "classmethod receives the class as first argument (enabling polymorphic factory methods), while staticmethod receives neither class nor instance — use staticmethod for utility functions that logically belong to the class but don't need class state.",
  },
  {
    id: "py-class-factory-pattern",
    language: "python",
    title: "Class method as factory (alternative constructors)",
    tag: "classes",
    code: `from datetime import date

class Event:
    def __init__(self, name, year, month, day):
        self.name = name
        self.date = date(year, month, day)

    @classmethod
    def from_date(cls, name, d: date):
        return cls(name, d.year, d.month, d.day)

    @classmethod
    def from_iso(cls, name, iso: str):
        d = date.fromisoformat(iso)
        return cls(name, d.year, d.month, d.day)

    def __repr__(self):
        return f"Event({self.name!r}, {self.date})"

e1 = Event("Launch", 2026, 1, 15)
e2 = Event.from_date("Conf", date.today())
e3 = Event.from_iso("Deadline", "2026-12-31")
print(e1, e2, e3)`,
    explanation:
      "Using classmethods as named constructors (from_date, from_iso) improves readability over overloaded __init__ — they also support subclassing because cls refers to the actual subclass being instantiated.",
  },
  {
    id: "py-type-dynamic-class",
    language: "python",
    title: "type() with three arguments to create a class dynamically",
    tag: "classes",
    code: `# type(name, bases, namespace) creates a new class at runtime
Animal = type("Animal", (object,), {
    "sound": "...",
    "speak": lambda self: print(f"{type(self).__name__} says {self.sound}"),
})

Dog = type("Dog", (Animal,), {"sound": "Woof"})
Cat = type("Cat", (Animal,), {"sound": "Meow"})

Dog().speak()   # Dog says Woof
Cat().speak()   # Cat says Meow

# This is exactly what the 'class' statement does under the hood
# Useful in: ORMs, plugin systems, code generation

print(issubclass(Dog, Animal))   # True
print(Dog.__bases__)             # (<class '__main__.Animal'>,)`,
    explanation:
      "type() called with three arguments is the meta-constructor that Python's 'class' statement uses internally — it's useful for dynamic class generation in ORMs, plugin systems, and meta-programming.",
  },
];
