import type { Snippet } from "./types";

export const pythonSnippets20260510B1: Snippet[] = [
  {
    id: "py-snippet-graphlib-topo",
    language: "python",
    title: "graphlib.TopologicalSorter for DAG ordering",
    tag: "snippet",
    code: `import graphlib

# Build a dependency graph: key depends on values
deps = {
    'deploy':  {'test', 'build'},
    'test':    {'lint'},
    'build':   {'lint'},
    'lint':    set(),
}

ts = graphlib.TopologicalSorter(deps)

# Iterate in topological order (dependencies before dependents)
print(list(ts.static_order()))
# ['lint', 'build', 'test', 'deploy']  (or 'lint', 'test', 'build', 'deploy')

# Cycle detection: raises CycleError
try:
    bad = graphlib.TopologicalSorter({'a': {'b'}, 'b': {'a'}})
    list(bad.static_order())
except graphlib.CycleError as e:
    print(e)`,
    explanation: "graphlib.TopologicalSorter (Python 3.9+) computes a topological ordering of a directed acyclic graph defined as a dict of node→dependencies. It raises CycleError if the graph has a cycle. Use static_order() for a simple iterator, or prepare()/get_ready()/done() for parallel task scheduling.",
  },
  {
    id: "py-snippet-tomllib-load",
    language: "python",
    title: "tomllib parses TOML config files (Python 3.11+)",
    tag: "snippet",
    code: `import tomllib

toml_text = b"""
[server]
host = "localhost"
port = 8080
debug = true

[database]
url = "postgres://localhost/mydb"
pool_size = 5

[features]
flags = ["auth", "cache", "logging"]
"""

config = tomllib.loads(toml_text.decode())
print(config['server']['host'])        # localhost
print(config['server']['port'])        # 8080
print(config['features']['flags'])     # ['auth', 'cache', 'logging']

# From a file (must open in binary mode)
# with open("pyproject.toml", "rb") as f:
#     data = tomllib.load(f)`,
    explanation: "tomllib (Python 3.11+, PEP 680) parses TOML into Python dicts; tomllib.loads takes a str, tomllib.load takes a binary file. TOML maps cleanly to Python types: strings, ints, booleans, arrays, and inline tables. Note: it is read-only — use the third-party tomli-w package to write TOML.",
  },
  {
    id: "py-snippet-shlex-split",
    language: "python",
    title: "shlex.split handles shell-like quoting in strings",
    tag: "snippet",
    code: `import shlex

# Split a shell command string, respecting quotes
cmd = 'grep -r "hello world" --include="*.py" /src'
parts = shlex.split(cmd)
print(parts)
# ['grep', '-r', 'hello world', '--include=*.py', '/src']

# Plain str.split() would break on spaces inside quotes
print(cmd.split())
# ['grep', '-r', '"hello', 'world"', '--include="*.py"', '/src']  WRONG

# shlex.quote makes a string safe to embed in a shell command
filename = "my file (2).txt"
safe = shlex.quote(filename)
print(safe)   # 'my file (2).txt'

# Build a command string safely
args = ['cp', safe, '/tmp/']
print(' '.join(args))   # cp 'my file (2).txt' /tmp/`,
    explanation: "shlex.split parses shell-style tokenization including quoted strings and escape characters; str.split() ignores quoting. Use shlex.quote to safely wrap a string that may contain spaces or special characters before embedding it in a shell command.",
  },
  {
    id: "py-snippet-fnmatch-filter",
    language: "python",
    title: "fnmatch matches filenames with shell-style wildcards",
    tag: "snippet",
    code: `import fnmatch, os

files = [
    'report.pdf', 'data.csv', 'notes.txt',
    'image.PNG', 'script.py', 'backup.csv.gz',
]

# fnmatch.filter returns matched names (case-sensitive on Unix)
csvs = fnmatch.filter(files, '*.csv')
print(csvs)   # ['data.csv']

# fnmatch.fnmatch for single name
print(fnmatch.fnmatch('report.pdf', '*.pdf'))   # True

# Case-insensitive: fnmatch.fnmatchcase vs fnmatch.fnmatch
print(fnmatch.fnmatch('image.PNG', '*.png'))        # False (Unix)
print(fnmatch.fnmatchcase('image.PNG', '*.PNG'))    # True

# Practical: find Python files recursively
py_files = [f for f in os.listdir('.') if fnmatch.fnmatch(f, '*.py')]
print(py_files[:3])`,
    explanation: "fnmatch matches strings against shell-style wildcards (* any chars, ? one char, [seq] char class). fnmatch.filter applies the pattern to a list. On Unix, fnmatch is case-sensitive; fnmatchcase is always case-sensitive. For recursive glob patterns, use pathlib.Path.rglob() or glob.glob() instead.",
  },
  {
    id: "py-snippet-linecache-getline",
    language: "python",
    title: "linecache.getline retrieves a specific line from a file",
    tag: "snippet",
    code: `import linecache, tempfile, os

# Write a sample file
tmp = tempfile.NamedTemporaryFile(mode='w', suffix='.py',
                                   delete=False)
tmp.write("line one\\nline two\\nline three\\n")
tmp.close()

# getline(filename, lineno) -- 1-indexed, returns '' if out of range
line2 = linecache.getline(tmp.name, 2)
print(repr(line2))   # 'line two\\n'

line99 = linecache.getline(tmp.name, 99)
print(repr(line99))  # ''  (out of range)

# linecache caches results; checkcache() invalidates stale entries
linecache.checkcache(tmp.name)

# Used internally by traceback to show source lines
import traceback
# traceback uses linecache to fetch the guilty source line

os.unlink(tmp.name)`,
    explanation: "linecache.getline(filename, lineno) fetches a specific 1-indexed line from any file, returning '' for missing lines. It caches file contents in memory for repeated access. Python's traceback machinery uses linecache internally to display source code in exceptions.",
  },
  {
    id: "py-snippet-ast-unparse",
    language: "python",
    title: "ast.unparse reconstructs source code from an AST node",
    tag: "snippet",
    code: `import ast

src = "result = [x**2 for x in range(10) if x % 2 == 0]"

tree = ast.parse(src)

# ast.unparse converts AST back to a canonical source string (3.9+)
reconstructed = ast.unparse(tree)
print(reconstructed)
# result = [x ** 2 for x in range(10) if x % 2 == 0]

# Modify the AST and unparse the result
class DoubleExponent(ast.NodeTransformer):
    def visit_BinOp(self, node):
        self.generic_visit(node)
        if isinstance(node.op, ast.Pow):
            node.right = ast.Constant(value=node.right.value * 2)
        return node

new_tree = DoubleExponent().visit(tree)
ast.fix_missing_locations(new_tree)
print(ast.unparse(new_tree))
# result = [x ** 4 for x in range(10) if x % 2 == 0]`,
    explanation: "ast.unparse (Python 3.9+) converts an AST back into a canonical Python source string — useful for code transformation pipelines. Combine it with ast.NodeTransformer to parse, modify, and regenerate code. The output is normalized (consistent spacing, no comments).",
  },
  {
    id: "py-snippet-string-formatter",
    language: "python",
    title: "string.Formatter enables custom format string behavior",
    tag: "snippet",
    code: `import string

# Default Formatter works like str.format()
fmt = string.Formatter()
result = fmt.format("{name} scored {score:.1f}%", name="Alice", score=87.5)
print(result)   # Alice scored 87.5%

# Subclass to intercept field lookup
class DefaultFormatter(string.Formatter):
    def get_value(self, key, args, kwargs):
        # Return placeholder if key is missing
        try:
            return super().get_value(key, args, kwargs)
        except (KeyError, IndexError):
            return f'<{key}>'

df = DefaultFormatter()
print(df.format("{name} from {city}", name="Bob"))
# Bob from <city>

# parse() tokenizes a format string
for lit, field, spec, conv in fmt.parse("{x!r:.10}"):
    print(f"literal={lit!r} field={field!r} spec={spec!r} conv={conv!r}")`,
    explanation: "string.Formatter provides the full machinery behind str.format(). Subclass it to override get_value (field lookup), format_field (conversion), or get_field (attribute/index traversal). parse() tokenizes a format string into (literal_text, field_name, format_spec, conversion) tuples.",
  },
  {
    id: "py-snippet-sched-scheduler",
    language: "python",
    title: "sched.scheduler runs timed callbacks without threads",
    tag: "snippet",
    code: `import sched, time

scheduler = sched.scheduler(time.monotonic, time.sleep)

results = []

def record(label):
    results.append((label, time.monotonic()))

# Schedule events: enter(delay, priority, action, args)
scheduler.enter(0.01, 1, record, ('first',))
scheduler.enter(0.02, 1, record, ('second',))
scheduler.enter(0.01, 2, record, ('first-low-pri',))  # same delay, lower pri

scheduler.run()   # blocks until all events have fired

# Events with same delay: priority 1 fires before priority 2
for label, t in results:
    print(label)
# first
# first-low-pri
# second`,
    explanation: "sched.scheduler is a single-threaded event scheduler using time.sleep for delays; no background thread is needed. Priority breaks ties among events at the same scheduled time (lower value = higher priority). Use it for scripted delay sequences; for recurring timers, prefer threading.Timer or asyncio.",
  },
  {
    id: "py-snippet-csv-dictreader",
    language: "python",
    title: "csv.DictReader / DictWriter for named-column CSV I/O",
    tag: "snippet",
    code: `import csv, io

raw = """name,age,city
Alice,30,London
Bob,25,Paris
Carol,35,Tokyo"""

# DictReader: each row is a dict keyed by header
reader = csv.DictReader(io.StringIO(raw))
for row in reader:
    print(row['name'], row['city'])
# Alice London
# Bob Paris
# Carol Tokyo

# DictWriter: write rows from dicts
out = io.StringIO()
fields = ['name', 'age', 'city']
writer = csv.DictWriter(out, fieldnames=fields)
writer.writeheader()
writer.writerow({'name': 'Dave', 'age': 28, 'city': 'Berlin'})
print(out.getvalue())
# name,age,city
# Dave,28,Berlin`,
    explanation: "csv.DictReader wraps a CSV file so each row is an OrderedDict keyed by the header row. DictWriter takes dicts and serializes them using fieldnames. Both handle quoting, delimiters, and newlines; pass dialect='excel' (default) or delimiter='\\t' for TSV.",
  },
  {
    id: "py-snippet-html-escape",
    language: "python",
    title: "html.escape prevents XSS when embedding text in HTML",
    tag: "snippet",
    code: `import html

user_input = '<script>alert("xss")</script>'

# html.escape replaces &, <, >, ", ' with HTML entities
safe = html.escape(user_input)
print(safe)
# &lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;

# By default, only & < > " are escaped; quote=True also escapes '
safe2 = html.escape("It's a <test>", quote=True)
print(safe2)  # It&#x27;s a &lt;test&gt;

# html.unescape reverses the process
original = html.unescape("&lt;div&gt;&amp;nbsp;&lt;/div&gt;")
print(original)   # <div>&nbsp;</div>`,
    explanation: "html.escape converts the five HTML special characters to safe entities, preventing script injection when user-controlled text is rendered in HTML. Always escape before insertion into HTML templates; modern template engines like Jinja2 do this automatically, but raw string formatting does not.",
  },
  {
    id: "py-snippet-concurrent-futures-map",
    language: "python",
    title: "concurrent.futures.ThreadPoolExecutor.map for parallel I/O",
    tag: "snippet",
    code: `import concurrent.futures, time

def fetch(url: str) -> str:
    time.sleep(0.05)          # simulate network I/O
    return f"result:{url}"

urls = [f"https://example.com/{i}" for i in range(10)]

# map() submits all tasks, yields results in SUBMISSION order
start = time.monotonic()
with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:
    results = list(pool.map(fetch, urls))
elapsed = time.monotonic() - start

print(results[:3])   # ['result:https://...0', ...]
print(f"elapsed: {elapsed:.2f}s")   # ~0.10s (2 rounds of 5)

# as_completed for results in COMPLETION order:
with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:
    futs = {pool.submit(fetch, u): u for u in urls[:3]}
    for fut in concurrent.futures.as_completed(futs):
        print(fut.result())`,
    explanation: "ThreadPoolExecutor.map is the parallel equivalent of built-in map: it fans out tasks to worker threads and yields results in submission order. For I/O-bound work (HTTP, disk), threads overcome the GIL. Use as_completed when you want to process each result the moment it's ready.",
  },
  {
    id: "py-snippet-logging-rotating",
    language: "python",
    title: "RotatingFileHandler limits log files by size",
    tag: "snippet",
    code: `import logging
from logging.handlers import RotatingFileHandler
import tempfile, os

log_path = tempfile.mktemp(suffix='.log')

logger = logging.getLogger('myapp')
logger.setLevel(logging.DEBUG)

# Rotate after 1 KB, keep at most 3 backup files
handler = RotatingFileHandler(
    log_path, maxBytes=1024, backupCount=3
)
handler.setFormatter(logging.Formatter('%(asctime)s %(levelname)s %(message)s'))
logger.addHandler(handler)

for i in range(20):
    logger.info(f"log message {i}: {'x' * 60}")

# Backup files: myapp.log, myapp.log.1, myapp.log.2, myapp.log.3
import glob
files = sorted(glob.glob(log_path + '*'))
print([os.path.basename(f) for f in files])

for f in files:
    os.unlink(f)`,
    explanation: "RotatingFileHandler rotates the log file when it reaches maxBytes, keeping backupCount numbered backups (.1, .2, …). TimedRotatingFileHandler rotates on a schedule (midnight, weekly, hourly). Both live in logging.handlers and integrate with the standard logging hierarchy.",
  },
  {
    id: "py-snippet-codecs-transform",
    language: "python",
    title: "codecs.encode with text transforms (rot13, base64, zlib)",
    tag: "snippet",
    code: `import codecs

# rot13: Caesar cipher with period 13 (self-inverse)
encoded = codecs.encode("Hello, World!", "rot_13")
print(encoded)   # Uryyb, Jbeyq!
print(codecs.decode(encoded, "rot_13"))   # Hello, World!

# hex_codec: hex encoding of bytes
hex_str = codecs.encode(b"\\x00\\xff\\xab", "hex_codec")
print(hex_str)   # b'00ffab'

# base64_codec: base64 encoding
b64 = codecs.encode(b"Python", "base64_codec")
print(b64)   # b'UHl0aG9u\\n'

# zlib_codec: compress bytes
compressed = codecs.encode(b"aaaaaaaaaa", "zlib_codec")
print(len(compressed), "bytes")   # shorter than 10
original = codecs.decode(compressed, "zlib_codec")
print(original)   # b'aaaaaaaaaa'`,
    explanation: "codecs.encode/decode support not just character encodings but also binary transforms like rot_13, hex_codec, base64_codec, and zlib_codec. These are text/bytes transforms rather than character encodings. They're handy for quick obfuscation or compression without importing separate modules.",
  },
  {
    id: "py-snippet-operator-attrgetter",
    language: "python",
    title: "operator.attrgetter and itemgetter for fast key extraction",
    tag: "snippet",
    code: `import operator
from dataclasses import dataclass

@dataclass
class Employee:
    name: str
    dept: str
    salary: float

staff = [
    Employee('Alice', 'Eng', 90000),
    Employee('Bob',   'HR',  70000),
    Employee('Carol', 'Eng', 95000),
    Employee('Dave',  'HR',  72000),
]

# attrgetter is faster than lambda for attribute access
by_salary = sorted(staff, key=operator.attrgetter('salary'))
print([e.name for e in by_salary])   # ['Bob', 'Dave', 'Alice', 'Carol']

# Multi-key sort: dept first, then salary
by_dept_sal = sorted(staff, key=operator.attrgetter('dept', 'salary'))
print([e.name for e in by_dept_sal])   # ['Carol', 'Alice', 'Dave', 'Bob']

# itemgetter for dicts/tuples
rows = [('a', 3), ('b', 1), ('c', 2)]
print(sorted(rows, key=operator.itemgetter(1)))   # [('b',1),('c',2),('a',3)]`,
    explanation: "operator.attrgetter and itemgetter are faster than equivalent lambda functions because they're implemented in C. Multi-key attrgetter('a', 'b') returns a tuple (a, b), enabling compound sorts without a tuple-returning lambda.",
  },
  {
    id: "py-understanding-missing-key",
    language: "python",
    title: "__missing__ is called when a dict key is not found",
    tag: "understanding",
    code: `class DefaultList(dict):
    """Returns a new empty list for missing keys (like defaultdict(list))."""
    def __missing__(self, key):
        value = []
        self[key] = value   # store so next access is a regular hit
        return value

d = DefaultList()
d['a'].append(1)
d['a'].append(2)
d['b'].append(3)
print(d)   # {'a': [1, 2], 'b': [3]}

# __missing__ is only called by __getitem__, NOT by .get()
print(d.get('c'))   # None  (no __missing__ call)
print(d)            # {'a': [1, 2], 'b': [3]}  -- 'c' not added

# This is how defaultdict works internally
from collections import defaultdict
dd = defaultdict(list)
dd['x'].append(9)
print(dd)   # defaultdict(<class 'list'>, {'x': [9]})`,
    explanation: "__missing__(self, key) is called by dict.__getitem__ when the key is absent. It can return or raise; if it stores the value under the key first, future lookups are fast. Importantly, .get() and 'in' do NOT trigger __missing__ — only bracket access does.",
  },
  {
    id: "py-understanding-set-name",
    language: "python",
    title: "__set_name__ lets a descriptor know its attribute name",
    tag: "understanding",
    code: `class Typed:
    """Descriptor that type-checks assignments."""
    def __set_name__(self, owner, name):
        # Called when the class body is executed; name is the attribute name
        self._name = name
        self._attr = f"_{name}"

    def __init__(self, expected_type):
        self._type = expected_type

    def __get__(self, obj, objtype=None):
        if obj is None:
            return self
        return getattr(obj, self._attr, None)

    def __set__(self, obj, value):
        if not isinstance(value, self._type):
            raise TypeError(f"{self._name} must be {self._type.__name__}")
        setattr(obj, self._attr, value)

class Person:
    name = Typed(str)
    age  = Typed(int)

p = Person()
p.name = "Alice"   # OK
p.age  = 30        # OK
print(p.name, p.age)   # Alice 30
try:
    p.age = "thirty"   # TypeError: age must be int
except TypeError as e:
    print(e)`,
    explanation: "__set_name__(owner, name) is called automatically after the class body executes, passing the attribute name the descriptor was assigned to. Without it, descriptors had to be told their name explicitly; __set_name__ enables self-aware descriptors that can produce clear error messages.",
  },
  {
    id: "py-understanding-slots-inheritance",
    language: "python",
    title: "__slots__ in subclasses must be declared carefully",
    tag: "understanding",
    code: `class Base:
    __slots__ = ('x', 'y')

class Child(Base):
    __slots__ = ('z',)   # only NEW slots; x, y inherited

c = Child()
c.x = 1   # inherited slot
c.z = 3   # own slot
print(c.x, c.z)   # 1 3

# If you forget __slots__ in Child, __dict__ reappears
class Leaky(Base):
    pass   # no __slots__ => has __dict__

l = Leaky()
l.x = 1
l.unexpected = 99   # this works even though Base has __slots__
print(l.__dict__)   # {'unexpected': 99}

# Duplicate slots across the chain waste memory
class Dup(Base):
    __slots__ = ('x', 'extra')   # 'x' duplicated -- silent but wastes space

d = Dup()
print(type(d).x, type(d.__mro__[1]).x)   # two separate slot descriptors`,
    explanation: "Slots are inherited automatically; a subclass's __slots__ should list only the NEW attributes it introduces. If a subclass omits __slots__, a __dict__ is added back, undoing the memory savings. Duplicate slot names across the hierarchy create separate descriptors and waste memory without error.",
  },
  {
    id: "py-understanding-generator-throw",
    language: "python",
    title: "generator.throw() injects an exception at the yield point",
    tag: "understanding",
    code: `def controlled():
    try:
        while True:
            value = yield
            print(f"received: {value}")
    except ValueError as e:
        print(f"caught inside generator: {e}")
        yield "recovered"

gen = controlled()
next(gen)          # advance to first yield

gen.send(42)       # prints: received: 42
gen.send("hello")  # prints: received: hello

# Inject a ValueError at the current yield point
result = gen.throw(ValueError, "bad input")
# prints: caught inside generator: bad input
print(result)   # recovered

# After recovering, the generator can continue or exit
try:
    next(gen)
except StopIteration:
    print("generator done")`,
    explanation: "gen.throw(ExcType, val) raises ExcType at the current yield inside the generator. The generator can catch it with a try/except and yield a recovery value, which becomes the return value of throw(). This is the mechanism contextlib.contextmanager uses to send exceptions into @contextmanager functions.",
  },
  {
    id: "py-understanding-coroutine-close",
    language: "python",
    title: "generator.close() sends GeneratorExit for cleanup",
    tag: "understanding",
    code: `def resource_holder():
    print("acquiring resource")
    try:
        while True:
            yield
    except GeneratorExit:
        print("releasing resource (GeneratorExit caught)")
    finally:
        print("finally block always runs")

gen = resource_holder()
next(gen)   # acquiring resource

gen.close()
# releasing resource (GeneratorExit caught)
# finally block always runs

# Attempting to yield after GeneratorExit raises RuntimeError
def bad_close():
    try:
        yield
    except GeneratorExit:
        yield 1   # RuntimeError: generator ignored GeneratorExit

bg = bad_close()
next(bg)
try:
    bg.close()
except RuntimeError as e:
    print(e)   # generator ignored GeneratorExit`,
    explanation: "gen.close() throws GeneratorExit into the generator; this lets the generator run finally blocks or release resources. If the generator catches GeneratorExit but then yields instead of returning, Python raises RuntimeError. Context managers built with generators rely on this for cleanup.",
  },
  {
    id: "py-understanding-exec-scope",
    language: "python",
    title: "exec() with explicit globals/locals dicts controls scope",
    tag: "understanding",
    code: `# exec with no scope args uses caller's globals + locals
x = 10
exec("y = x + 1")
# print(y)  # NameError! exec's locals are a COPY, not injected back

# Pass a dict to capture output
ns = {'x': 10}
exec("y = x + 1", ns)
print(ns['y'])   # 11

# Separate globals and locals
g = {'__builtins__': __builtins__, 'x': 5}
loc = {}
exec("y = x * 2", g, loc)
print(loc)   # {'y': 10}

# Security: restrict builtins
restricted = {'__builtins__': {}}
exec("result = 1 + 1", restricted)
print(restricted['result'])   # 2
try:
    exec("import os", restricted)
except ImportError:
    print("import blocked")`,
    explanation: "exec(code, globals, locals) runs code with explicit namespace dicts. Without arguments, exec uses a copy of the caller's locals — changes don't propagate back. To capture results, pass a dict. To sandbox execution, set __builtins__ to {} or a restricted dict; note that true sandboxing in CPython is hard.",
  },
  {
    id: "py-understanding-classvar-shadow",
    language: "python",
    title: "Assigning to a class variable on an instance creates an instance variable",
    tag: "understanding",
    code: `class Config:
    debug = False       # class variable
    count = 0

a = Config()
b = Config()

# Reading: both see the class variable
print(a.debug, b.debug)   # False False

# Assignment on instance creates an INSTANCE variable that shadows the class var
a.debug = True
print(a.debug)            # True  (instance var)
print(b.debug)            # False (class var unchanged)
print(Config.debug)       # False (class var unchanged)

# Mutating (not assigning) a mutable class variable affects ALL instances
Config.count += 1
print(a.count, b.count)   # 1 1

a.count += 1   # creates a.count instance var (a.count = a.count + 1)
print(a.count, b.count, Config.count)   # 2 1 1`,
    explanation: "Assignment on an instance (instance.attr = val) always creates an instance attribute, shadowing any class attribute of the same name. Reading an attribute walks the MRO — instance dict first, then class. Mutable class attributes (lists, dicts) shared by all instances are a classic gotcha.",
  },
  {
    id: "py-understanding-contextvar-task",
    language: "python",
    title: "contextvars.ContextVar isolates values across asyncio tasks",
    tag: "understanding",
    code: `import asyncio
from contextvars import ContextVar

request_id: ContextVar[str] = ContextVar('request_id', default='none')

async def handle(rid: str):
    token = request_id.set(rid)    # set for this task's context
    await asyncio.sleep(0.01)      # yields; other tasks run
    print(f"task {rid}: request_id={request_id.get()}")
    request_id.reset(token)        # restore previous value

async def main():
    await asyncio.gather(
        handle("req-1"),
        handle("req-2"),
        handle("req-3"),
    )

asyncio.run(main())
# task req-1: request_id=req-1
# task req-2: request_id=req-2
# task req-3: request_id=req-3
# (each task sees its own value despite yielding to the event loop)`,
    explanation: "ContextVar stores a value that is isolated per asyncio task (and per thread). Each task inherits a copy of the context from its creator; set() returns a Token for reset(). This solves the thread-local problem for async code — tasks that yield don't clobber each other's request context.",
  },
  {
    id: "py-understanding-bytes-decode-errors",
    language: "python",
    title: "bytes.decode error handlers control what happens with bad bytes",
    tag: "understanding",
    code: `bad = b"caf\\xe9 resume"   # 0xe9 is valid latin-1 but not utf-8

# 'strict' (default): raises UnicodeDecodeError
try:
    bad.decode('utf-8')
except UnicodeDecodeError as e:
    print(e)

# 'replace': substitutes U+FFFD for each bad byte
print(bad.decode('utf-8', errors='replace'))
# caf� resume

# 'ignore': drops bad bytes entirely
print(bad.decode('utf-8', errors='ignore'))
# caf resume

# 'backslashreplace': \\xNN for each undecodable byte
print(bad.decode('utf-8', errors='backslashreplace'))
# caf\\xe9 resume

# 'surrogateescape': round-trips arbitrary bytes via surrogates (PEP 383)
s = bad.decode('utf-8', errors='surrogateescape')
print(s.encode('utf-8', errors='surrogateescape') == bad)   # True`,
    explanation: "The errors parameter selects the decode error handler: 'replace' inserts U+FFFD, 'ignore' discards bad bytes, 'backslashreplace' shows escape sequences. 'surrogateescape' (PEP 383) round-trips arbitrary bytes by encoding them as surrogate characters — used by the OS filesystem interface.",
  },
  {
    id: "py-structures-enum-flag",
    language: "python",
    title: "enum.Flag for composable bit-flag permissions",
    tag: "structures",
    code: `from enum import Flag, auto

class Permission(Flag):
    READ    = auto()   # 1
    WRITE   = auto()   # 2
    EXECUTE = auto()   # 4

# Combine with |
rw = Permission.READ | Permission.WRITE
print(rw)          # Permission.READ|WRITE
print(repr(rw))    # <Permission.READ|WRITE: 3>

# Check membership with 'in'
print(Permission.READ in rw)     # True
print(Permission.EXECUTE in rw)  # False

# Intersect with &
print(rw & Permission.WRITE)     # Permission.WRITE

# Remove a flag with ^ (XOR) or &~
read_only = rw ^ Permission.WRITE
print(read_only)   # Permission.READ

# Iterate individual flags
for perm in rw:
    print(perm)   # Permission.READ then Permission.WRITE`,
    explanation: "enum.Flag creates enumerations that support bitwise operators (|, &, ^, ~). auto() assigns successive powers of two. Members combine into composite values and support 'in' membership testing. IntFlag works identically but also behaves like an int, allowing comparison with raw integer values.",
  },
  {
    id: "py-structures-enum-strenum",
    language: "python",
    title: "enum.StrEnum makes members valid strings (Python 3.11+)",
    tag: "structures",
    code: `from enum import StrEnum, auto

class Color(StrEnum):
    RED   = auto()   # 'red'  (lowercased name)
    GREEN = auto()   # 'green'
    BLUE  = auto()   # 'blue'

# StrEnum members ARE strings
print(Color.RED)           # Color.RED
print(str(Color.RED))      # red
print(Color.RED == 'red')  # True   (unlike regular Enum!)

# Useful for JSON serialization without extra conversion
import json
data = {'color': Color.GREEN, 'label': 'test'}
print(json.dumps(data))    # {"color": "green", "label": "test"}

# Works as dict keys and in string operations
mapping = {'red': '#FF0000', 'green': '#00FF00', 'blue': '#0000FF'}
print(mapping[Color.RED])   # #FF0000

class Status(StrEnum):
    PENDING = "pending"
    DONE    = "done"`,
    explanation: "StrEnum (Python 3.11+) members are strings; they compare equal to their string value and serialise to JSON directly without .value. auto() uses the lowercase member name. Use it for status codes, API field values, and any string constant that benefits from enum's autocomplete and type safety.",
  },
  {
    id: "py-structures-userdict-subclass",
    language: "python",
    title: "collections.UserDict is safe to subclass unlike dict",
    tag: "structures",
    code: `from collections import UserDict

class LowercaseDict(UserDict):
    """Keys are automatically lowercased on set and lookup."""

    def __setitem__(self, key, value):
        super().__setitem__(key.lower(), value)

    def __getitem__(self, key):
        return super().__getitem__(key.lower())

    def __contains__(self, key):
        return super().__contains__(key.lower())

d = LowercaseDict({'Name': 'Alice', 'AGE': 30})
print(d)             # {'name': 'Alice', 'age': 30}
d['City'] = 'London'
print(d['city'])     # London
print('CITY' in d)   # True

# PITFALL with raw dict: update() bypasses __setitem__
class BrokenDict(dict):
    def __setitem__(self, key, value):
        super().__setitem__(key.lower(), value)

bd = BrokenDict({'NAME': 'Alice'})  # bypasses __setitem__!
print(list(bd.keys()))   # ['NAME']  -- not lowercased`,
    explanation: "dict.__init__ and update() call C-level dict operations that bypass __setitem__ in dict subclasses, making custom dicts unreliable. UserDict stores data in self.data (a plain dict) and routes all operations through the Python methods, making subclassing safe and predictable.",
  },
  {
    id: "py-structures-weakset",
    language: "python",
    title: "weakref.WeakSet holds weak references to objects",
    tag: "structures",
    code: `import weakref

class Observer:
    def __init__(self, name):
        self.name = name
    def update(self, event):
        print(f"{self.name} received {event}")

class EventBus:
    def __init__(self):
        self._observers = weakref.WeakSet()

    def subscribe(self, obs):
        self._observers.add(obs)

    def emit(self, event):
        for obs in list(self._observers):
            obs.update(event)

bus = EventBus()
a = Observer('A')
b = Observer('B')
bus.subscribe(a)
bus.subscribe(b)
bus.emit('click')   # A received click, B received click

del b               # b is garbage collected
import gc; gc.collect()
bus.emit('hover')   # only A received hover (b is gone)`,
    explanation: "WeakSet stores weak references; when an object has no other strong references, it's garbage-collected and silently removed from the set. This is ideal for observer/pub-sub patterns where the EventBus should not keep subscribers alive — subscribers naturally unregister themselves when they're destroyed.",
  },
  {
    id: "py-structures-ordereddict-move",
    language: "python",
    title: "OrderedDict.move_to_end implements LRU eviction",
    tag: "structures",
    code: `from collections import OrderedDict

class LRUCache:
    def __init__(self, capacity: int):
        self._cap = capacity
        self._cache: OrderedDict = OrderedDict()

    def get(self, key: int) -> int:
        if key not in self._cache:
            return -1
        self._cache.move_to_end(key)   # mark as recently used
        return self._cache[key]

    def put(self, key: int, value: int) -> None:
        if key in self._cache:
            self._cache.move_to_end(key)
        self._cache[key] = value
        if len(self._cache) > self._cap:
            self._cache.popitem(last=False)   # evict least recently used

cache = LRUCache(3)
cache.put(1, 10); cache.put(2, 20); cache.put(3, 30)
cache.get(1)            # access 1 -> LRU order: 2,3,1
cache.put(4, 40)        # evicts 2
print(cache.get(2))     # -1 (evicted)
print(cache.get(3))     # 30`,
    explanation: "OrderedDict.move_to_end(key, last=True) moves a key to the back (most recent), or front (last=False for LRU). popitem(last=False) removes from the front. This two-method combination is the classic O(1) LRU cache implementation; Python 3.2+ functools.lru_cache does the same internally.",
  },
  {
    id: "py-structures-struct-pack",
    language: "python",
    title: "struct.pack / unpack for binary protocol serialisation",
    tag: "structures",
    code: `import struct

# Format string: '!' = network (big-endian), H = uint16, I = uint32, 4s = 4 bytes
header_fmt = '!HI4s'

# Pack: Python values -> bytes
data = struct.pack(header_fmt, 42, 1024, b'HTTP')
print(data.hex())          # 002a000004004854545050  (approx)
print(len(data))           # 10 bytes (2 + 4 + 4)

# Unpack: bytes -> Python values
version, length, magic = struct.unpack(header_fmt, data)
print(version, length, magic)   # 42 1024 b'HTTP'

# calcsize tells you the byte size of a format
print(struct.calcsize(header_fmt))   # 10

# Struct class caches compiled format for repeated use
packer = struct.Struct('!HH')
for port in [80, 443, 8080]:
    packed = packer.pack(port, port ^ 0xFFFF)
    print(packed.hex())`,
    explanation: "struct.pack converts Python ints, floats, and bytes to a compact binary representation using C-struct layout. The format string prefix ('!', '<', '>') controls byte order. Pre-compiling with struct.Struct() is faster when packing/unpacking many times with the same format.",
  },
  {
    id: "py-structures-bytearray-ops",
    language: "python",
    title: "bytearray is a mutable bytes sequence with in-place ops",
    tag: "structures",
    code: `# bytearray is mutable; bytes is immutable
ba = bytearray(b'Hello, World!')

# Modify in place
ba[0] = ord('h')          # lowercase h
ba[7:12] = b'Python'      # replace slice
print(ba)                  # bytearray(b'hello, Python!')

# Append and extend
ba.append(ord('!'))
ba.extend(b' wow')
print(bytes(ba))           # b'hello, Python!! wow'

# bytearray supports all bytes methods and returns bytearray
print(ba.upper())          # bytearray(b'HELLO, PYTHON!! WOW')

# buffer protocol: pass to C extensions without copying
import struct
buf = bytearray(4)
struct.pack_into('!I', buf, 0, 12345)
print(buf.hex())           # 00003039

# Zero-initialise a buffer of 1 KB
blank = bytearray(1024)    # all zero bytes`,
    explanation: "bytearray is the mutable counterpart to bytes; individual bytes can be assigned as integers 0–255, and slices can be replaced. It supports the buffer protocol so C extensions (struct, ctypes, socket) can write directly into it without copying. Convert with bytes(ba) or memoryview(ba).",
  },
  {
    id: "py-structures-frozenset-key",
    language: "python",
    title: "frozenset is hashable and can be a dict key or set member",
    tag: "structures",
    code: `# frozenset is immutable and hashable
fs1 = frozenset({1, 2, 3})
fs2 = frozenset({3, 4, 5})

# Use as dict key (set cannot be a dict key)
graph = {
    frozenset({'A', 'B'}): 'edge',
    frozenset({'B', 'C'}): 'edge',
}
print(graph[frozenset({'B', 'A'})])   # 'edge' (order doesn't matter)

# Set of frozensets (no duplicates by value)
visited = set()
visited.add(frozenset({1, 2}))
visited.add(frozenset({2, 1}))   # same as {1, 2}
print(len(visited))               # 1

# Frozenset supports all set operations
inter = fs1 & fs2
print(inter)          # frozenset({3})
print(type(inter))    # <class 'frozenset'>

# Useful for canonical set representation (e.g., unordered pairs)
pairs = {frozenset({a, b}) for a in 'abc' for b in 'abc' if a != b}
print(len(pairs))   # 3`,
    explanation: "frozenset is the immutable (and hashable) version of set; it can be used as a dictionary key or stored inside another set. All set operations (union, intersection, difference) return frozensets when applied to a frozenset. It's ideal for representing unordered pairs or as memoization keys for sets.",
  },
  {
    id: "py-structures-chainmap-priority",
    language: "python",
    title: "ChainMap layers dicts without copying, first wins",
    tag: "structures",
    code: `from collections import ChainMap

# Simulate environment variable layering
defaults   = {'debug': False, 'timeout': 30, 'host': 'localhost'}
env_vars   = {'timeout': 60, 'host': 'prod.example.com'}
cli_flags  = {'debug': True}

# First map wins; later maps are fallback
config = ChainMap(cli_flags, env_vars, defaults)
print(config['debug'])    # True   (from cli_flags)
print(config['timeout'])  # 60     (from env_vars)
print(config['host'])     # prod.example.com

# Writes go to the FIRST map only
config['port'] = 8080
print(cli_flags)   # {'debug': True, 'port': 8080}

# new_child() creates a sub-scope
child = config.new_child({'debug': False})
print(child['debug'])   # False (child overrides)
print(config['debug'])  # True  (parent unchanged)

print(dict(config))     # merged flat dict`,
    explanation: "ChainMap wraps multiple dicts into a single view without copying; lookups walk the chain from left to right, and the first match wins. Writes and deletes always target the first map. new_child() creates a new ChainMap with a fresh empty dict prepended — perfect for scoped variable environments.",
  },
  {
    id: "py-caveats-float-nan",
    language: "python",
    title: "NaN is not equal to itself — use math.isnan()",
    tag: "caveats",
    code: `import math

nan = float('nan')

print(nan == nan)    # False  -- NaN != NaN by IEEE 754
print(nan != nan)    # True
print(nan < 0)       # False
print(nan > 0)       # False

# Use math.isnan() to test for NaN
print(math.isnan(nan))     # True
print(math.isnan(float('inf')))   # False

# NaN in collections
data = [1, float('nan'), 3]
print(float('nan') in data)   # True (uses 'is' fast path first, then ==)
# NOTE: in uses 'is' before '==', so nan IS the same object here

nan2 = float('nan')
print(nan2 in data)   # False! different object, and nan2 == data[1] is False

# Sorting with NaN gives undefined order
import random
nums = [3, float('nan'), 1, 2]
nums.sort()   # no error, but NaN's position is unspecified`,
    explanation: "NaN (Not a Number) violates reflexivity: nan != nan by IEEE 754. The 'in' operator first checks identity (is), so the same NaN object appears to be 'in' a list. Always use math.isnan() to detect NaN. Sorting lists containing NaN produces implementation-defined (and potentially incorrect) order.",
  },
  {
    id: "py-caveats-list-multiply-nested",
    language: "python",
    title: "List multiplication shares inner list references",
    tag: "caveats",
    code: `# Create a 3x3 grid — WRONG way
grid = [[0] * 3] * 3
grid[0][0] = 1
print(grid)
# [[1, 0, 0], [1, 0, 0], [1, 0, 0]]  -- ALL rows affected!
# Because all 3 rows are THE SAME list object

# Verify: all rows are identical objects
print(grid[0] is grid[1])   # True

# CORRECT: use a list comprehension to create independent rows
grid2 = [[0] * 3 for _ in range(3)]
grid2[0][0] = 1
print(grid2)
# [[1, 0, 0], [0, 0, 0], [0, 0, 0]]  -- only first row changed

print(grid2[0] is grid2[1])   # False -- independent lists

# Outer multiplication of immutables is fine
row = [0] * 3   # OK: creates 3 independent zero ints
print(row)      # [0, 0, 0]`,
    explanation: "list * n copies the list's references, not the objects themselves. For a 2D grid, [inner_list] * n creates n references to the same inner list, so modifying one row modifies all. Use a list comprehension to create truly independent inner lists.",
  },
  {
    id: "py-caveats-sum-strings",
    language: "python",
    title: "sum() on strings raises TypeError — use str.join()",
    tag: "caveats",
    code: `words = ['Hello', ' ', 'World', '!']

# sum() with strings: TypeError (and would be O(n^2) even if allowed)
try:
    result = sum(words, '')
except TypeError as e:
    print(e)   # sum() can't sum strings [use ''.join(seq) instead]

# Correct: str.join is O(n)
result = ''.join(words)
print(result)   # Hello World!

# sum() works for numbers (and other addable types)
print(sum([1, 2, 3], 0))         # 6
print(sum([[1], [2], [3]], []))   # [1, 2, 3] -- O(n^2)! join lists with itertools

# For lists of lists, itertools.chain.from_iterable is O(n)
import itertools
nested = [[1, 2], [3, 4], [5, 6]]
flat = list(itertools.chain.from_iterable(nested))
print(flat)   # [1, 2, 3, 4, 5, 6]`,
    explanation: "sum(['a','b'], '') raises TypeError intentionally — concatenating strings with sum() is O(n²) because each += creates a new string. Python blocks this to push you toward ''.join(), which allocates once. The same O(n²) trap applies to sum([[]], []) for list flattening; use itertools.chain.from_iterable.",
  },
  {
    id: "py-caveats-global-scope",
    language: "python",
    title: "Reading a global and assigning to it in the same function fails",
    tag: "caveats",
    code: `counter = 0

def increment_wrong():
    # Python sees the assignment below and marks 'counter' as LOCAL
    # The read before the assignment then fails — UnboundLocalError
    print(counter)   # UnboundLocalError: free variable referenced before assignment
    counter += 1     # this line makes 'counter' a local

try:
    increment_wrong()
except UnboundLocalError as e:
    print(e)

# Fix 1: declare global
def increment_global():
    global counter
    counter += 1

# Fix 2: use a mutable container at module scope
state = {'counter': 0}
def increment_via_dict():
    state['counter'] += 1   # no assignment to 'state', so no issue

increment_global()
print(counter)   # 1`,
    explanation: "Python's scoping rule: if a name appears on the left side of an assignment anywhere in a function, it's treated as a local throughout that function — including lines before the assignment. Use 'global' to write to a module-level variable, or store state in a mutable object (dict, list) to avoid the issue.",
  },
  {
    id: "py-caveats-for-else-break",
    language: "python",
    title: "for-else: the else runs only if the loop completes without break",
    tag: "caveats",
    code: `def find_prime(candidates):
    for n in candidates:
        for d in range(2, int(n**0.5) + 1):
            if n % d == 0:
                break          # found a divisor, not prime
        else:
            # for-else: runs only when inner loop exhausted without break
            return n           # n is prime
    return None

print(find_prime([4, 6, 7, 9, 11]))   # 7 (first prime)

# Common misunderstanding: else does NOT mean "loop found nothing"
nums = [1, 2, 3]
for n in nums:
    pass
else:
    print("loop finished normally")   # ALWAYS prints (no break)

# Also works on while loops
i = 0
while i < 3:
    i += 1
else:
    print("while done without break")   # prints`,
    explanation: "The for/while else clause runs when the loop exits normally (not via break). It's commonly used for search loops: if break wasn't hit, the target wasn't found. The name 'else' is confusing — think of it as 'no-break'.",
  },
  {
    id: "py-caveats-enumerate-start",
    language: "python",
    title: "enumerate(start=N) offsets the counter, not the iterable",
    tag: "caveats",
    code: `items = ['a', 'b', 'c']

# Default: starts at 0
for i, v in enumerate(items):
    print(i, v)   # 0 a, 1 b, 2 c

# start=1: count starts at 1, still iterates all items
for i, v in enumerate(items, start=1):
    print(i, v)   # 1 a, 2 b, 3 c

# Common mistake: thinking start=1 skips the first item
for i, v in enumerate(items, start=1):
    pass
print(i)   # 3 (all three items processed, counter ends at 3)

# If you want to skip the first item, use slicing
for i, v in enumerate(items[1:], start=1):
    print(i, v)   # 1 b, 2 c

# Useful: 1-based display numbering
for num, name in enumerate(['Alice', 'Bob', 'Carol'], start=1):
    print(f"{num}. {name}")`,
    explanation: "enumerate(iterable, start=N) sets the initial counter value; it does not skip elements. All items in the iterable are still visited. This is useful for producing 1-based numbering or continuing a count from a specific offset.",
  },
  {
    id: "py-caveats-sort-key-stability",
    language: "python",
    title: "Python's sort is stable — equal elements keep their original order",
    tag: "caveats",
    code: `from operator import attrgetter

records = [
    ('Alice', 'Eng', 3),
    ('Bob',   'HR',  1),
    ('Carol', 'Eng', 1),
    ('Dave',  'HR',  3),
    ('Eve',   'Eng', 2),
]

# Sort by department only; within a dept, original order preserved (stable)
by_dept = sorted(records, key=lambda r: r[1])
print([r[0] for r in by_dept])
# ['Alice', 'Carol', 'Eve', 'Bob', 'Dave']  -- Eng before HR, original order within

# Multi-key sort can be done in two stable passes (Schwartzian-like)
# Or with a tuple key in one pass
both = sorted(records, key=lambda r: (r[1], r[2]))
print([r[0] for r in both])
# ['Carol', 'Eve', 'Alice', 'Bob', 'Dave']  (Eng by level, then HR by level)`,
    explanation: "Python's sort (Timsort) is guaranteed stable: elements that compare equal stay in their original relative order. This means you can sort by a secondary key first, then by the primary key, and the two-key ordering is preserved without needing a tuple key.",
  },
  {
    id: "py-caveats-integer-floor-div-negative",
    language: "python",
    title: "Floor division rounds toward negative infinity, not zero",
    tag: "caveats",
    code: `# // floors toward negative infinity (not truncation like C)
print(7 // 2)     #  3
print(-7 // 2)    # -4  (NOT -3 !)
print(7 // -2)    # -4
print(-7 // -2)   #  3

# % (modulo) has the same sign as the DIVISOR
print(7 % 2)      #  1
print(-7 % 2)     #  1  (NOT -1 !)
print(7 % -2)     # -1
print(-7 % -2)    # -1

# Invariant: a == (a // b) * b + (a % b)
a, b = -7, 2
print((a // b) * b + (a % b) == a)   # True

# math.trunc for C-style truncation toward zero
import math
print(math.trunc(-7 / 2))   # -3 (toward zero)
print(int(-7 / 2))           # -3 (int() also truncates)`,
    explanation: "Python's // always floors (rounds toward -∞), not truncates (rounds toward 0). This means -7 // 2 is -4, not -3. The modulo % has the sign of the divisor. This is mathematically consistent (the invariant always holds) but surprises programmers coming from C, Java, or JavaScript.",
  },
  {
    id: "py-caveats-deep-recursion",
    language: "python",
    title: "Default recursion limit is 1000 — use iteration or sys.setrecursionlimit",
    tag: "caveats",
    code: `import sys

print(sys.getrecursionlimit())   # 1000 (default)

def recursive_sum(n):
    if n == 0:
        return 0
    return n + recursive_sum(n - 1)

try:
    recursive_sum(2000)
except RecursionError as e:
    print(f"RecursionError: {e}")

# Fix 1: increase the limit (risky on large inputs)
sys.setrecursionlimit(5000)
print(recursive_sum(2000))   # 2001000

# Fix 2: convert to iteration
def iterative_sum(n):
    total = 0
    while n > 0:
        total += n
        n -= 1
    return total

print(iterative_sum(100000))   # 5000050000

# Fix 3: use stack + loop for DFS/traversal algorithms`,
    explanation: "CPython's default recursion limit is 1000 (frames); hitting it raises RecursionError. sys.setrecursionlimit() raises it but risks stack overflow for very large inputs. The robust fix is to convert to an explicit stack-based iteration. Tail-call optimisation is not done in CPython.",
  },
  {
    id: "py-caveats-none-as-sentinel",
    language: "python",
    title: "None as a default can mask legitimate None arguments",
    tag: "caveats",
    code: `# Problem: caller can't distinguish "not passed" from "passed None"
def process(value=None):
    if value is None:
        print("no value provided")
    else:
        print(f"value: {value}")

process()         # no value provided
process(None)     # no value provided  <-- can't distinguish!
process(0)        # value: 0

# Solution: use a private sentinel object
_MISSING = object()

def process_v2(value=_MISSING):
    if value is _MISSING:
        print("no value provided")
    elif value is None:
        print("explicitly passed None")
    else:
        print(f"value: {value}")

process_v2()         # no value provided
process_v2(None)     # explicitly passed None
process_v2(0)        # value: 0

# Python stdlib uses this pattern extensively
# e.g., dict.pop(key, _MISSING)`,
    explanation: "Using None as a default argument means you can't distinguish 'caller passed None' from 'caller passed nothing'. Use a module-level sentinel object() as the default instead. This pattern appears in dict.pop, list.remove return values, and many library APIs.",
  },
  {
    id: "py-types-literal-string",
    language: "python",
    title: "typing.LiteralString prevents SQL/shell injection at type-check time",
    tag: "types",
    code: `from typing import LiteralString

def execute_query(sql: LiteralString) -> None:
    print(f"executing: {sql}")

# OK: string literals are LiteralString
execute_query("SELECT * FROM users WHERE id = 1")

# OK: concatenating LiteralStrings gives a LiteralString
table: LiteralString = "users"
execute_query("SELECT * FROM " + table)

# ERROR (type checker flags this):
user_input = input("table name: ")   # type: str, not LiteralString
# execute_query(user_input)  # Argument of type "str" cannot be assigned to "LiteralString"
# execute_query(f"SELECT * FROM {user_input}")  # also an error!

# Safe pattern: parameterised queries bypass this
def safe_query(sql: LiteralString, params: tuple) -> None:
    print(f"sql={sql}, params={params}")

safe_query("SELECT * FROM users WHERE id = ?", (user_input,))`,
    explanation: "LiteralString (PEP 675, Python 3.11+) is a type that only string literals and their concatenations satisfy — not runtime strings built from user input. Type checkers use it to flag SQL injection and shell command construction that includes untrusted strings.",
  },
  {
    id: "py-types-typevartuple-unpack",
    language: "python",
    title: "TypeVarTuple enables variadic generic types",
    tag: "types",
    code: `from typing import TypeVarTuple, Unpack, Generic

Ts = TypeVarTuple('Ts')

# A Zip-like type that preserves element types
class TypedZip(Generic[*Ts]):
    def __init__(self, *iterables: *Ts):
        self._iters = iterables

# Function that preserves types of multiple args
def first_of_each(*args: *Ts) -> tuple[*Ts]:
    return args  # type: ignore

a: tuple[int, str, float] = first_of_each(1, "x", 3.14)
print(a)   # (1, 'x', 3.14)

# Shape-typed arrays (numpy-style)
from typing import Annotated
Height = int
Width  = int
# Annotated[list[list[float]], Height, Width]  -- shape-tagged type

# PEP 695 syntax (Python 3.12+)
# def concat[*Ts](*args: *Ts) -> tuple[*Ts]: ...`,
    explanation: "TypeVarTuple (PEP 646, Python 3.11+) captures an arbitrary-length tuple of types, enabling variadic generic functions and classes. Unpack[Ts] (or *Ts in 3.12+) spreads the TypeVarTuple in annotations. This is primarily used for typed array shapes and functions that preserve the types of multiple positional arguments.",
  },
  {
    id: "py-types-required-not-required",
    language: "python",
    title: "TypedDict Required / NotRequired for partial optionality",
    tag: "types",
    code: `from typing import TypedDict, Required, NotRequired

# total=True (default): all keys required
# total=False: all keys optional
# Mix: use Required / NotRequired on individual fields

class Config(TypedDict, total=False):
    host: Required[str]   # always required even in total=False dict
    port: int             # optional (total=False)
    debug: bool           # optional

class User(TypedDict):
    id: int               # required (total=True default)
    name: str             # required
    email: NotRequired[str]  # optional despite total=True

# Type checker enforces the constraints
def make_config(c: Config) -> str:
    return f"{c['host']}:{c.get('port', 8080)}"

make_config({'host': 'localhost'})           # OK
make_config({'host': 'localhost', 'port': 443})  # OK
# make_config({})  # Error: missing required key 'host'`,
    explanation: "Required[T] and NotRequired[T] (PEP 655, Python 3.11+) mark individual TypedDict fields as required or optional regardless of the class's total setting. This lets you mix mandatory and optional fields in a single TypedDict without splitting into two classes.",
  },
  {
    id: "py-types-pep695-type-stmt",
    language: "python",
    title: "PEP 695 type statement for type aliases (Python 3.12+)",
    tag: "types",
    code: `# Old style (verbose):
from typing import TypeAlias
Vector: TypeAlias = list[float]

# New style (Python 3.12+):
type Vector = list[float]

v: Vector = [1.0, 2.0, 3.0]
print(v)   # [1.0, 2.0, 3.0]

# Generic type alias with type parameters
type Matrix[T] = list[list[T]]

m: Matrix[int] = [[1, 2], [3, 4]]

# Recursive type alias
type Tree[T] = T | list['Tree[T]']

# The type statement creates a TypeAliasType object
print(type(Vector))   # <class 'typing.TypeAliasType'>
print(Vector.__value__)   # list[float]`,
    explanation: "The type statement (PEP 695, Python 3.12+) creates an explicit type alias with optional type parameters. It replaces the TypeAlias annotation and is evaluated lazily (the right-hand side is not evaluated immediately, enabling recursive types without quotes in most cases).",
  },
  {
    id: "py-types-pep695-generic-func",
    language: "python",
    title: "PEP 695 generic functions and classes with [T] syntax (Python 3.12+)",
    tag: "types",
    code: `# Old style
from typing import TypeVar
T = TypeVar('T')
def first_old(lst: list[T]) -> T:
    return lst[0]

# New style (Python 3.12+): bracket syntax
def first[T](lst: list[T]) -> T:
    return lst[0]

print(first([1, 2, 3]))      # 1
print(first(['a', 'b']))     # a

# Generic class
class Stack[T]:
    def __init__(self) -> None:
        self._items: list[T] = []

    def push(self, item: T) -> None:
        self._items.append(item)

    def pop(self) -> T:
        return self._items.pop()

s: Stack[int] = Stack()
s.push(1)
s.push(2)
print(s.pop())   # 2

# Constrained TypeVar
def max_val[T: (int, float, str)](a: T, b: T) -> T:
    return a if a > b else b`,
    explanation: "PEP 695 (Python 3.12+) introduces bracket syntax for generic functions and classes: def f[T](...) and class C[T]. This replaces the verbose TypeVar declaration pattern. Type constraints use T: (Type1, Type2) and upper bounds use T: BaseClass.",
  },
  {
    id: "py-types-override-decorator",
    language: "python",
    title: "@typing.override flags methods that must override a base class method",
    tag: "types",
    code: `from typing import override

class Base:
    def process(self, data: str) -> str:
        return data.upper()

    def validate(self, x: int) -> bool:
        return x > 0

class Child(Base):
    @override
    def process(self, data: str) -> str:   # OK: overrides Base.process
        return data.lower()

    @override
    def validaet(self, x: int) -> bool:   # type checker ERROR: typo!
        return x >= 0

# Without @override, the typo silently creates a new method
class SilentBug(Base):
    def validaet(self, x: int) -> bool:   # new method, no warning
        return x >= 0

obj = SilentBug()
print(obj.validate(0))  # False (calls Base.validate, not SilentBug.validaet!)`,
    explanation: "@typing.override (PEP 698, Python 3.12+) tells type checkers that the decorated method must override a method in a parent class; if no such method exists, it's a type error. This catches rename refactors where the base class method is renamed but a subclass override is not updated.",
  },
  {
    id: "py-types-warnings-deprecated",
    language: "python",
    title: "@warnings.deprecated marks APIs as deprecated (Python 3.13+)",
    tag: "types",
    code: `import warnings
from typing import deprecated

@deprecated("Use new_function() instead")
def old_function(x: int) -> int:
    return x * 2

# Calling the function emits a DeprecationWarning at runtime
import warnings as _w
with _w.catch_warnings(record=True) as caught:
    _w.simplefilter("always")
    result = old_function(5)
    print(result)   # 10
    if caught:
        print(caught[0].category.__name__)   # DeprecationWarning
        print(str(caught[0].message))        # Use new_function() instead

# Type checkers also flag call sites statically (no need to run the code)

@deprecated("Use NewClass instead")
class OldClass:
    pass

# obj = OldClass()  # type checker warns: OldClass is deprecated`,
    explanation: "@deprecated (PEP 702, Python 3.13+) from the warnings module marks functions, methods, and classes as deprecated at both static analysis time (type checkers flag call sites) and runtime (emits DeprecationWarning). It unifies what previously required docstring conventions or manual warn() calls.",
  },
  {
    id: "py-types-dataclass-transform",
    language: "python",
    title: "@dataclass_transform enables type-safe custom class factories",
    tag: "types",
    code: `from typing import dataclass_transform, Any

# Tell type checkers this function/class creates dataclass-like types
@dataclass_transform(eq_default=True, frozen_default=False)
def my_model(cls=None, /, **kwargs):
    """Custom decorator that adds __init__ based on annotations."""
    def wrap(c):
        fields = {k: v for k, v in c.__annotations__.items()}
        def __init__(self, **kw):
            for name in fields:
                setattr(self, name, kw.get(name))
        c.__init__ = __init__
        return c
    if cls is None:
        return wrap
    return wrap(cls)

@my_model
class Point:
    x: float
    y: float

# Type checker treats Point as having __init__(x: float, y: float)
p = Point(x=1.0, y=2.0)
print(p.x, p.y)   # 1.0 2.0`,
    explanation: "@dataclass_transform (PEP 681, Python 3.12+) decorates a factory function or class to tell type checkers it produces dataclass-like types. Libraries like attrs, SQLModel, and Pydantic use this so type checkers understand auto-generated __init__ signatures without special-casing each library.",
  },
  {
    id: "py-types-typeguard-narrowing",
    language: "python",
    title: "TypeGuard narrows types in the True branch of a callable",
    tag: "types",
    code: `from typing import TypeGuard

def is_str_list(val: list[object]) -> TypeGuard[list[str]]:
    return all(isinstance(x, str) for x in val)

def process(items: list[object]) -> None:
    if is_str_list(items):
        # Type checker narrows: items is list[str] here
        for s in items:
            print(s.upper())   # no type error: s is str
    else:
        print("not all strings")

process(["hello", "world"])   # HELLO WORLD
process([1, "two", 3])        # not all strings

# Without TypeGuard, isinstance inside is_str_list doesn't narrow
# the type of 'items' at the call site

# TypeIs (Python 3.13+): stricter version, narrows in BOTH branches
from typing import TypeIs
def is_int(x: object) -> TypeIs[int]:
    return isinstance(x, int)`,
    explanation: "TypeGuard[T] as a return type tells type checkers that the function acts as a type predicate: when it returns True, the argument has type T. The narrowing only applies in the True branch. TypeIs (Python 3.13, PEP 742) is a stricter variant that also narrows in the False branch.",
  },
  {
    id: "py-types-final-class",
    language: "python",
    title: "@final prevents subclassing and method overriding",
    tag: "types",
    code: `from typing import final

@final
class Immutable:
    def __init__(self, value: int):
        self._value = value
    def get(self) -> int:
        return self._value

# Type checker error: cannot subclass a @final class
# class SubImmutable(Immutable): ...   # Error!

class Base:
    @final
    def critical_method(self) -> str:
        return "base implementation"

    def overridable(self) -> str:
        return "can override"

class Child(Base):
    # Type checker error:
    # def critical_method(self) -> str: ...   # Error: cannot override final method

    def overridable(self) -> str:   # OK
        return "overridden"

# @final is purely a type system construct; no runtime enforcement
c = Child()
print(c.critical_method())   # "base implementation"`,
    explanation: "@final (PEP 591) tells type checkers that a class cannot be subclassed or a method cannot be overridden. It's purely a static signal — Python does not enforce it at runtime. Use it to communicate design intent for sealed implementations or performance-critical methods.",
  },
  {
    id: "py-families-tomllib-vs-configparser",
    language: "python",
    title: "tomllib vs configparser: TOML vs INI for config files",
    tag: "families",
    code: `# --- INI-style with configparser ---
import configparser, io

ini = """
[server]
host = localhost
port = 8080
debug = true

[database]
pool_size = 5
"""

cfg = configparser.ConfigParser()
cfg.read_string(ini)
print(cfg['server']['host'])       # 'localhost' (always a string)
print(cfg['server'].getint('port'))  # 8080 (explicit type conversion)
print(cfg['server'].getboolean('debug'))  # True

# --- TOML with tomllib ---
import tomllib
toml = b"""
[server]
host = "localhost"
port = 8080
debug = true
"""
data = tomllib.loads(toml.decode())
print(data['server']['host'])    # 'localhost' (already a str)
print(data['server']['port'])    # 8080 (already an int!)
print(data['server']['debug'])   # True (already a bool!)`,
    explanation: "configparser parses INI files and returns everything as strings; you call getint/getboolean for type conversion. TOML (via tomllib) has a richer type system — integers, booleans, dates, and arrays are parsed to the correct Python type automatically. TOML is preferred for modern project config (pyproject.toml).",
  },
  {
    id: "py-families-shlex-vs-split",
    language: "python",
    title: "shlex.split vs str.split for shell command tokenisation",
    tag: "families",
    code: `import shlex

cmd = 'python -c "print(1 + 2)" --flag "hello world"'

# str.split: splits on whitespace, ignores quoting
print(cmd.split())
# ['python', '-c', '"print(1', '+', '2)"', '--flag', '"hello', 'world"']
# WRONG: breaks quoted strings

# shlex.split: handles quoting, escapes, comments
print(shlex.split(cmd))
# ['python', '-c', 'print(1 + 2)', '--flag', 'hello world']
# CORRECT: quoted strings kept intact, quotes removed

# Posix=False preserves quotes (Windows behaviour)
print(shlex.split(cmd, posix=False))
# ['python', '-c', '"print(1 + 2)"', '--flag', '"hello world"']

# shlex.join is the inverse (Python 3.8+)
parts = ['ls', '-la', '/my dir/file.txt']
print(shlex.join(parts))   # ls -la '/my dir/file.txt'`,
    explanation: "str.split() tokenises on whitespace without understanding shell quoting; shlex.split() mimics POSIX shell tokenisation, preserving quoted strings as single tokens and handling escapes. Use shlex.split when parsing command strings entered by users or coming from shell config files.",
  },
  {
    id: "py-families-json-vs-pickle",
    language: "python",
    title: "json vs pickle vs marshal for Python object serialisation",
    tag: "families",
    code: `import json, pickle, marshal, io

data = {'name': 'Alice', 'scores': [10, 20, 30], 'active': True}

# json: text, human-readable, cross-language, safe
j = json.dumps(data)
print(j)   # '{"name": "Alice", "scores": [10, 20, 30], "active": true}'
print(json.loads(j) == data)   # True
# Limitation: only str/int/float/bool/None/list/dict

# pickle: binary, Python-only, handles almost any object, UNSAFE
p = pickle.dumps(data)
print(len(p), "bytes")         # compact binary
print(pickle.loads(p) == data) # True
# Supports: classes, lambdas (via dill), numpy arrays, etc.

# marshal: binary, very fast, only for Python bytecode objects
# Not for general use; format may change between Python versions
code = compile("x = 1 + 1", "<string>", "exec")
buf = io.BytesIO()
marshal.dump(code, buf)
print("marshal size:", len(buf.getvalue()), "bytes")`,
    explanation: "json is safe, cross-platform, and human-readable but limited to basic types. pickle handles arbitrary Python objects but is insecure (deserialising untrusted data can execute code). marshal is a low-level format for Python bytecode objects and not stable across Python versions.",
  },
  {
    id: "py-families-generators-vs-lists",
    language: "python",
    title: "Generator expressions vs list comprehensions: lazy vs eager",
    tag: "families",
    code: `import sys

n = 1_000_000

# List comprehension: builds the whole list in memory
lst = [x * x for x in range(n)]
print(sys.getsizeof(lst), "bytes")   # ~8 MB (8 bytes per pointer)

# Generator expression: lazy, produces values on demand
gen = (x * x for x in range(n))
print(sys.getsizeof(gen), "bytes")   # ~104 bytes (constant size!)

# Both give same sum
print(sum(lst) == sum(gen))   # True

# Use a list when: multiple passes, indexing, len(), slicing needed
# Use a generator when: single pass, potentially infinite, memory matters

# Generator can only be iterated once
gen2 = (x for x in range(3))
print(list(gen2))   # [0, 1, 2]
print(list(gen2))   # []  (exhausted!)

# List can be iterated many times
lst2 = [x for x in range(3)]
print(list(lst2))   # [0, 1, 2]
print(list(lst2))   # [0, 1, 2]  (still intact)`,
    explanation: "List comprehensions evaluate eagerly and store all elements; generator expressions are lazy and hold only the current state (~104 bytes regardless of size). Use generators for single-pass pipelines and when elements may be very large or infinite. Use lists when you need indexing, len(), or multiple iterations.",
  },
  {
    id: "py-families-dict-methods",
    language: "python",
    title: "dict[key] vs .get() vs .setdefault() vs defaultdict",
    tag: "families",
    code: `d = {'a': 1}

# [] raises KeyError if missing
try:
    val = d['missing']
except KeyError:
    pass

# .get(key, default): returns default (None) without storing it
print(d.get('missing'))     # None
print(d.get('missing', 0))  # 0
print(d)                    # {'a': 1}  -- unchanged

# .setdefault(key, default): stores the default if key is absent, then returns it
val = d.setdefault('b', 99)
print(val)   # 99
print(d)     # {'a': 1, 'b': 99}  -- 'b' now stored

# Useful for grouping without conditional
groups = {}
for word in ['apple', 'avocado', 'banana', 'blueberry']:
    groups.setdefault(word[0], []).append(word)
print(groups)   # {'a': ['apple', 'avocado'], 'b': ['banana', 'blueberry']}

# defaultdict: same but cleaner for grouping
from collections import defaultdict
groups2 = defaultdict(list)
for word in ['apple', 'avocado', 'banana']:
    groups2[word[0]].append(word)`,
    explanation: "d[key] raises on missing; .get() returns a default without modifying the dict; .setdefault() stores and returns the default (useful for initialising nested structures); defaultdict calls a factory for missing keys. Choose based on whether you want to store the default and how often keys repeat.",
  },
  {
    id: "py-families-threading-event-cond",
    language: "python",
    title: "threading.Event vs Condition vs Semaphore for coordination",
    tag: "families",
    code: `import threading, time

# Event: one-shot or repeating signal (set/clear/wait)
ready = threading.Event()
def waiter():
    ready.wait()   # blocks until set()
    print("event: go!")

threading.Thread(target=waiter, daemon=True).start()
time.sleep(0.01)
ready.set()   # unblocks all waiters at once
time.sleep(0.01)

# Semaphore: controls access to N slots
sem = threading.Semaphore(3)   # at most 3 threads at once
def limited():
    with sem:
        time.sleep(0.01)

threads = [threading.Thread(target=limited) for _ in range(6)]
for t in threads: t.start()
for t in threads: t.join()

# Condition: wait for a state change on a shared resource
buf = []
cond = threading.Condition()
def producer():
    with cond:
        buf.append(42)
        cond.notify()
def consumer():
    with cond:
        cond.wait_for(lambda: len(buf) > 0)
        print("consumed:", buf.pop())`,
    explanation: "Event is a simple flag: set() unblocks all wait()ers. Semaphore allows N concurrent acquirers; Semaphore(1) is a mutex. Condition wraps a Lock and lets threads wait() for a predicate, then be notified by notify()/notify_all(). Condition is the most flexible but most complex.",
  },
  {
    id: "py-families-string-find-index",
    language: "python",
    title: "str.find vs str.index vs 'in' operator for substring search",
    tag: "families",
    code: `s = "Hello, World!"

# 'in': returns bool, fastest for presence check
print('World' in s)    # True
print('world' in s)    # False (case-sensitive)

# str.find(sub): returns index or -1 if not found
idx = s.find('World')
print(idx)              # 7
print(s.find('world'))  # -1 (not found, no exception)

# str.index(sub): returns index or raises ValueError
try:
    s.index('world')
except ValueError:
    print("not found")  # raises, unlike find

# Optional start/end slice args
print(s.find('l', 4))      # 10 (searches from position 4)
print(s.count('l'))        # 3 (count all occurrences)
print(s.rfind('l'))        # 10 (rightmost occurrence)

# For regex patterns, use re.search / re.findall
import re
print(re.findall(r'[A-Z]', s))   # ['H', 'W']`,
    explanation: "Use 'in' for a simple boolean check (fastest). Use str.find when the position is needed and you want -1 for 'not found'. Use str.index when 'not found' should raise an error. str.rfind searches from the right. All accept start/end arguments to limit the search range.",
  },
  {
    id: "py-classes-missing-dunder",
    language: "python",
    title: "Implementing __missing__ for a sparse grid dict",
    tag: "classes",
    code: `class SparseGrid(dict):
    """2D grid stored sparsely; missing cells return a default."""
    def __init__(self, default=0):
        super().__init__()
        self._default = default

    def __missing__(self, key: tuple) -> int:
        # Do NOT store the default — keep the dict sparse
        return self._default

    def set(self, row: int, col: int, value) -> None:
        if value == self._default:
            self.pop((row, col), None)   # keep sparse
        else:
            self[(row, col)] = value

grid = SparseGrid(default=0)
grid.set(0, 0, 1)
grid.set(1, 1, 5)

print(grid[0, 0])   # 1
print(grid[5, 5])   # 0  (missing, returns default without storing)
print(len(grid))    # 2  (only non-default cells stored)`,
    explanation: "Unlike defaultdict, this __missing__ implementation returns the default without storing it, keeping the dict sparse. This is ideal for large 2D grids where most cells have the same value — only exceptions are stored. __missing__ is only triggered by d[key], not by .get() or 'key in d'.",
  },
  {
    id: "py-classes-set-name-typed",
    language: "python",
    title: "__set_name__ creates self-aware validators without boilerplate",
    tag: "classes",
    code: `class Bounded:
    """Descriptor for a numeric field with min/max validation."""
    def __set_name__(self, owner, name):
        self._name = name
        self._private = f"_{name}"

    def __init__(self, lo, hi):
        self._lo, self._hi = lo, hi

    def __get__(self, obj, objtype=None):
        if obj is None: return self
        return getattr(obj, self._private, self._lo)

    def __set__(self, obj, value):
        if not (self._lo <= value <= self._hi):
            raise ValueError(
                f"{self._name} must be in [{self._lo}, {self._hi}], got {value}"
            )
        setattr(obj, self._private, value)

class Sensor:
    temperature = Bounded(-40.0, 85.0)
    humidity    = Bounded(0.0, 100.0)

s = Sensor()
s.temperature = 25.0   # OK
s.humidity = 60.0      # OK
try:
    s.temperature = 200.0
except ValueError as e:
    print(e)   # temperature must be in [-40.0, 85.0], got 200.0`,
    explanation: "__set_name__ is called once when the class body is processed, giving the descriptor the attribute name it was assigned to. This eliminates the need to pass the name to the descriptor's __init__, reducing repetition and making the error messages self-documenting.",
  },
  {
    id: "py-classes-abstract-property",
    language: "python",
    title: "Combining @abstractmethod with @property in ABCs",
    tag: "classes",
    code: `from abc import ABC, abstractmethod

class Shape(ABC):
    @property
    @abstractmethod
    def area(self) -> float: ...

    @property
    @abstractmethod
    def perimeter(self) -> float: ...

    def describe(self) -> str:
        return f"area={self.area:.2f}, perimeter={self.perimeter:.2f}"

class Circle(Shape):
    def __init__(self, radius: float):
        self._r = radius

    @property
    def area(self) -> float:
        import math
        return math.pi * self._r ** 2

    @property
    def perimeter(self) -> float:
        import math
        return 2 * math.pi * self._r

c = Circle(5)
print(c.describe())   # area=78.54, perimeter=31.42

# Forgetting either property raises TypeError at instantiation
try:
    class BadShape(Shape): pass
    BadShape()
except TypeError as e:
    print(e)   # Can't instantiate abstract class...`,
    explanation: "To define an abstract property, stack @property above @abstractmethod (that order matters). Subclasses must implement it as a property (or any descriptor); a regular method would not satisfy the abstract property contract, and Python raises TypeError at instantiation.",
  },
  {
    id: "py-classes-class-decorator-factory",
    language: "python",
    title: "Parametric class decorator: add retry logic to all methods",
    tag: "classes",
    code: `import functools, time

def retry(max_attempts=3, delay=0.01):
    """Class decorator that wraps every public method with retry logic."""
    def decorate(cls):
        for name, method in list(vars(cls).items()):
            if callable(method) and not name.startswith('_'):
                @functools.wraps(method)
                def wrapper(*args, _m=method, **kwargs):
                    for attempt in range(max_attempts):
                        try:
                            return _m(*args, **kwargs)
                        except Exception:
                            if attempt == max_attempts - 1:
                                raise
                            time.sleep(delay)
                setattr(cls, name, wrapper)
        return cls
    return decorate

@retry(max_attempts=3, delay=0.01)
class DatabaseClient:
    def fetch(self, query: str) -> str:
        return f"result: {query}"

db = DatabaseClient()
print(db.fetch("SELECT 1"))   # result: SELECT 1`,
    explanation: "A class decorator that iterates the class namespace and replaces each public method with a wrapped version. The _m=method default-argument trick captures the method in the closure to avoid late-binding bugs. This pattern can add cross-cutting concerns (logging, retry, timing) to all methods without touching the class body.",
  },
  {
    id: "py-classes-custom-format",
    language: "python",
    title: "__format__ enables custom f-string format specs",
    tag: "classes",
    code: `class Temperature:
    def __init__(self, celsius: float):
        self.celsius = celsius

    def __format__(self, spec: str) -> str:
        if spec == 'F':
            return f"{self.celsius * 9/5 + 32:.1f}°F"
        elif spec == 'K':
            return f"{self.celsius + 273.15:.2f}K"
        elif spec == 'C' or spec == '':
            return f"{self.celsius:.1f}°C"
        raise ValueError(f"Unknown format spec: {spec!r}")

    def __repr__(self) -> str:
        return f"Temperature({self.celsius})"

t = Temperature(100)
print(f"{t}")       # 100.0°C  (empty spec -> __format__(''))
print(f"{t:C}")     # 100.0°C
print(f"{t:F}")     # 212.0°F
print(f"{t:K}")     # 373.15K

# format() built-in also calls __format__
print(format(t, 'F'))   # 212.0°F`,
    explanation: "__format__(self, spec) is called by f-strings and format() with the text after the colon. It receives the format specification as a string, allowing custom mini-languages per object. This is how datetime supports strftime-style specs ('%Y-%m-%d') and decimal.Decimal supports precision specs.",
  },
  {
    id: "py-classes-iter-reversed",
    language: "python",
    title: "__iter__ and __reversed__ for bidirectional iteration",
    tag: "classes",
    code: `class DoubleLinkedRange:
    """Supports forward and reverse iteration."""
    def __init__(self, start: int, stop: int):
        self._start = start
        self._stop = stop

    def __iter__(self):
        # Forward iteration
        n = self._start
        while n < self._stop:
            yield n
            n += 1

    def __reversed__(self):
        # Efficient reverse — no need to build a list
        n = self._stop - 1
        while n >= self._start:
            yield n
            n -= 1

r = DoubleLinkedRange(1, 6)
print(list(r))           # [1, 2, 3, 4, 5]
print(list(reversed(r))) # [5, 4, 3, 2, 1]

# Without __reversed__, reversed() falls back to len()+__getitem__
# If those are absent too, reversed() raises TypeError`,
    explanation: "reversed() calls __reversed__() if present; otherwise it falls back to __len__() + __getitem__(). Defining __reversed__() directly avoids materialising the full sequence into a list and is important for large or infinite sequences where reverse iteration is still possible (linked lists, files).",
  },
  {
    id: "py-classes-descriptor-non-data",
    language: "python",
    title: "Non-data vs data descriptors: instance dict priority",
    tag: "classes",
    code: `class NonData:
    """Non-data descriptor: only __get__, no __set__ or __delete__."""
    def __get__(self, obj, objtype=None):
        if obj is None: return self
        return "from non-data descriptor"

class Data:
    """Data descriptor: has __get__ AND __set__."""
    def __get__(self, obj, objtype=None):
        if obj is None: return self
        return "from data descriptor"

    def __set__(self, obj, value):
        print(f"set called with {value!r}")

class MyClass:
    nd = NonData()
    d  = Data()

obj = MyClass()

# Instance dict can SHADOW a non-data descriptor
obj.__dict__['nd'] = "from instance dict"
print(obj.nd)   # from instance dict (instance dict wins!)

# Instance dict CANNOT shadow a data descriptor
obj.__dict__['d'] = "from instance dict"
print(obj.d)    # from data descriptor (descriptor wins!)`,
    explanation: "Data descriptors (with __set__ or __delete__) take priority over the instance dict. Non-data descriptors (only __get__) can be shadowed by instance attributes. This is why property (data descriptor) overrides instance attributes, but classmethod/staticmethod (non-data) do not.",
  },
  {
    id: "py-classes-singleton-metaclass",
    language: "python",
    title: "Singleton via metaclass vs module-level instance",
    tag: "classes",
    code: `class SingletonMeta(type):
    _instances: dict = {}

    def __call__(cls, *args, **kwargs):
        if cls not in cls._instances:
            cls._instances[cls] = super().__call__(*args, **kwargs)
        return cls._instances[cls]

class Config(metaclass=SingletonMeta):
    def __init__(self):
        self.values: dict = {}

a = Config()
b = Config()
print(a is b)   # True -- same object

a.values['debug'] = True
print(b.values)   # {'debug': True}

# Simpler alternative: module-level instance (Python's preferred way)
# In config.py:
#   class _Config: ...
#   config = _Config()   # single instance
# Then: from config import config

# Thread-safe singleton with threading.Lock
import threading
class ThreadSafeSingleton(metaclass=SingletonMeta):
    _lock = threading.Lock()`,
    explanation: "A metaclass Singleton intercepts __call__ (which normally creates a new instance) and returns the cached instance after the first creation. The simpler and more Pythonic approach is a module-level instance — Python's import system caches modules, so a module-level object is naturally a singleton.",
  },
  {
    id: "py-classes-mixin-composable",
    language: "python",
    title: "Composable mixins via super() for cooperative multiple inheritance",
    tag: "classes",
    code: `class LogMixin:
    def save(self):
        print(f"[LOG] saving {self.__class__.__name__}")
        super().save()   # must call super() for cooperation

class ValidationMixin:
    def save(self):
        print(f"[VALID] validating {self.__class__.__name__}")
        super().save()

class BaseModel:
    def save(self):
        print(f"[BASE] {self.__class__.__name__} saved to DB")

# MRO: LoggedValidated -> LogMixin -> ValidationMixin -> BaseModel
class LoggedValidated(LogMixin, ValidationMixin, BaseModel):
    pass

obj = LoggedValidated()
obj.save()
# [LOG] saving LoggedValidated
# [VALID] validating LoggedValidated
# [BASE] LoggedValidated saved to DB

# MRO determines super() chain
print([c.__name__ for c in LoggedValidated.__mro__])
# ['LoggedValidated', 'LogMixin', 'ValidationMixin', 'BaseModel', 'object']`,
    explanation: "Mixins must call super().method() to pass control to the next class in the MRO — without it, only the first mixin in the chain runs. Python's C3 linearisation ensures a consistent, predictable MRO. Cooperative mixins form a chain-of-responsibility where each adds behaviour and passes on.",
  },
  {
    id: "py-classes-dataclass-ordering",
    language: "python",
    title: "@dataclass(order=True) auto-generates comparison methods",
    tag: "classes",
    code: `from dataclasses import dataclass, field

@dataclass(order=True)
class Version:
    major: int
    minor: int
    patch: int
    # Comparison uses fields in declaration order: major, then minor, then patch

v1 = Version(1, 2, 3)
v2 = Version(1, 10, 0)
v3 = Version(2, 0, 0)

print(v1 < v2)    # True  (1.2.3 < 1.10.0)
print(v2 < v3)    # True  (1.10.0 < 2.0.0)
print(sorted([v3, v1, v2]))
# [Version(1,2,3), Version(1,10,0), Version(2,0,0)]

# Exclude a field from comparison with compare=False
@dataclass(order=True)
class Task:
    priority: int
    name: str = field(compare=False)   # name ignored in sorting

tasks = [Task(3,'C'), Task(1,'A'), Task(2,'B')]
print(sorted(tasks))   # [Task(1,'A'), Task(2,'B'), Task(3,'C')]`,
    explanation: "order=True in @dataclass generates __lt__, __le__, __gt__, __ge__ methods that compare tuples of field values in declaration order. Use field(compare=False) to exclude a field from ordering. If eq=True (default) and order=True, the class is also hashable only if frozen=True.",
  },
  {
    id: "py-classes-context-manager-class",
    language: "python",
    title: "Class-based context manager with __enter__ and __exit__",
    tag: "classes",
    code: `import time

class Timer:
    """Measures elapsed time for a with block."""
    def __enter__(self):
        self._start = time.monotonic()
        return self          # 'as' target receives this

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.elapsed = time.monotonic() - self._start
        # Return True to suppress exceptions; False/None to propagate
        return False

with Timer() as t:
    total = sum(range(1_000_000))

print(f"elapsed: {t.elapsed:.4f}s")
print(f"sum: {total}")

# __exit__ receives exception info if an error occurred
class Suppressor:
    def __enter__(self): return self
    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is ValueError:
            print(f"suppressed ValueError: {exc_val}")
            return True  # suppress
        return False

with Suppressor():
    raise ValueError("whoops")   # suppressed
print("after suppressor")       # still runs`,
    explanation: "__enter__ returns the context value (the 'as' target); __exit__ receives exception info (or three Nones on clean exit) and returns True to suppress the exception. Class-based context managers are preferable over @contextmanager when the cleanup logic is complex or when the manager needs to be reusable across multiple 'with' blocks.",
  },
  {
    id: "py-classes-metaclass-registry",
    language: "python",
    title: "Metaclass as automatic plugin registry",
    tag: "classes",
    code: `class PluginMeta(type):
    _registry: dict = {}

    def __new__(mcs, name, bases, namespace):
        cls = super().__new__(mcs, name, bases, namespace)
        # Don't register the base class itself
        if bases:
            mcs._registry[name] = cls
        return cls

class Plugin(metaclass=PluginMeta):
    def run(self): raise NotImplementedError

class JsonPlugin(Plugin):
    def run(self): return "json output"

class CsvPlugin(Plugin):
    def run(self): return "csv output"

# All subclasses are automatically registered
print(PluginMeta._registry)
# {'JsonPlugin': <class 'JsonPlugin'>, 'CsvPlugin': <class 'CsvPlugin'>}

def get_plugin(name: str) -> Plugin:
    cls = PluginMeta._registry.get(name)
    if cls is None:
        raise KeyError(f"unknown plugin: {name}")
    return cls()

print(get_plugin('JsonPlugin').run())   # json output`,
    explanation: "A metaclass's __new__ is called once per class definition; the subclass check (if bases:) prevents registering the base class itself. This pattern automatically registers all subclasses without requiring explicit registration calls. __init_subclass__ is a simpler modern alternative for many cases.",
  },
  {
    id: "py-classes-init-subclass-hook",
    language: "python",
    title: "__init_subclass__ for lightweight subclass hooks without metaclasses",
    tag: "classes",
    code: `class Serializable:
    _registry: dict = {}

    def __init_subclass__(cls, format: str = 'json', **kwargs):
        super().__init_subclass__(**kwargs)
        # Called when any class inherits from Serializable
        cls._format = format
        Serializable._registry[format] = cls
        print(f"registered {cls.__name__!r} as format={format!r}")

class JsonSerializer(Serializable, format='json'):
    def dump(self, obj): return str(obj)

class CsvSerializer(Serializable, format='csv'):
    def dump(self, obj): return ','.join(str(v) for v in obj)

# Output during class definition:
# registered 'JsonSerializer' as format='json'
# registered 'CsvSerializer' as format='csv'

print(Serializable._registry)
def get_serializer(fmt: str):
    return Serializable._registry[fmt]()

print(get_serializer('csv').dump([1, 2, 3]))   # 1,2,3`,
    explanation: "__init_subclass__(cls, **kwargs) is a classmethod called on the parent whenever a subclass is defined. Keyword arguments from the class statement (class Child(Parent, key=val)) are forwarded. It replaces many metaclass uses and is simpler because it's defined on the parent class, not a separate metaclass.",
  },
  {
    id: "py-classes-slots-memory",
    language: "python",
    title: "__slots__ reduces per-instance memory by eliminating __dict__",
    tag: "classes",
    code: `import sys

class WithDict:
    def __init__(self, x, y):
        self.x = x
        self.y = y

class WithSlots:
    __slots__ = ('x', 'y')
    def __init__(self, x, y):
        self.x = x
        self.y = y

d = WithDict(1, 2)
s = WithSlots(1, 2)

# Instance size
print(sys.getsizeof(d))   # ~48 bytes (object) + 232 bytes (__dict__)
print(sys.getsizeof(s))   # ~56 bytes (object with 2 slots, no __dict__)

# __dict__ is absent on slotted instances
print(hasattr(d, '__dict__'))   # True
print(hasattr(s, '__dict__'))   # False

# Can't add arbitrary attributes to slotted instances
try:
    s.z = 3
except AttributeError as e:
    print(e)   # 'WithSlots' object has no attribute 'z'

# Benchmark: slots are also slightly faster to access (C-level offset lookup)`,
    explanation: "__slots__ tells Python to allocate fixed-size struct slots instead of a per-instance dict. This saves ~200–300 bytes per instance (significant when creating millions of objects) and speeds up attribute access. The trade-off: no dynamic attribute assignment and extra care with inheritance.",
  },
  {
    id: "py-classes-repr-hash-eq",
    language: "python",
    title: "__eq__ and __hash__ must be consistent for dicts and sets",
    tag: "classes",
    code: `class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y

    def __eq__(self, other):
        if not isinstance(other, Point):
            return NotImplemented
        return self.x == other.x and self.y == other.y

    def __hash__(self):
        # Must be consistent: equal objects must have the same hash
        return hash((self.x, self.y))

    def __repr__(self):
        return f"Point({self.x}, {self.y})"

p1 = Point(1, 2)
p2 = Point(1, 2)
p3 = Point(3, 4)

print(p1 == p2)   # True
print(p1 is p2)   # False

# Works correctly as dict key and set member
d = {p1: 'origin'}
print(d[p2])       # 'origin'  (p2 == p1 and same hash)

s = {p1, p2, p3}
print(s)           # {Point(1, 2), Point(3, 4)}  (p1 == p2, deduplicated)`,
    explanation: "If you define __eq__, Python sets __hash__ to None (making the class unhashable) unless you also define __hash__. Equal objects must have equal hashes (the contract). Use a tuple of the identifying fields for __hash__; this matches the equality check and avoids hash collisions from constant return values.",
  },
  {
    id: "py-classes-classmethod-factory",
    language: "python",
    title: "@classmethod as named constructors / factory methods",
    tag: "classes",
    code: `from datetime import date
import json

class Event:
    def __init__(self, name: str, date: date, venue: str):
        self.name = name
        self.date = date
        self.venue = venue

    @classmethod
    def from_dict(cls, data: dict) -> 'Event':
        return cls(
            name=data['name'],
            date=date.fromisoformat(data['date']),
            venue=data.get('venue', 'TBD'),
        )

    @classmethod
    def from_json(cls, text: str) -> 'Event':
        return cls.from_dict(json.loads(text))

    def __repr__(self):
        return f"Event({self.name!r}, {self.date}, {self.venue!r})"

e1 = Event("PyCon", date(2026, 5, 15), "Pittsburgh")
e2 = Event.from_dict({'name': 'EuroPython', 'date': '2026-07-14'})
e3 = Event.from_json('{"name": "DjangoCon", "date": "2026-09-01"}')

print(e1)   # Event('PyCon', 2026-05-15, 'Pittsburgh')
print(e2)   # Event('EuroPython', 2026-07-14, 'TBD')
print(e3)   # Event('DjangoCon', 2026-09-01, 'TBD')`,
    explanation: "@classmethod factories give you alternate constructors with descriptive names. Using cls (not the class name) makes them subclass-friendly: a subclass calling from_dict gets an instance of the subclass back. This pattern is cleaner than overloading __init__ with optional args or type-sniffing the input.",
  },
];
