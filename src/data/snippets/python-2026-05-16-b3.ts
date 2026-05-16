import type { Snippet } from "./types";

export const pythonSnippets20260516B3: Snippet[] = [
  {
    id: "py-b16-b3-asyncio-gather-parallel",
    language: "python",
    title: "asyncio.gather – run tasks in parallel",
    tag: "snippet",
    code: `import asyncio

async def fetch(name: str, delay: float) -> str:
    await asyncio.sleep(delay)   # simulate I/O
    return f"{name} done"

async def main():
    results = await asyncio.gather(
        fetch("A", 1.0),
        fetch("B", 0.5),
        fetch("C", 0.8),
    )
    print(results)  # ['A done', 'B done', 'C done']

asyncio.run(main())`,
    explanation: "asyncio.gather schedules all coroutines concurrently and returns their results in the same order as passed, regardless of completion order.",
  },
  {
    id: "py-b16-b3-asyncio-create-task",
    language: "python",
    title: "asyncio.create_task – fire and track",
    tag: "snippet",
    code: `import asyncio

async def work(n: int) -> int:
    await asyncio.sleep(0.1 * n)
    return n * n

async def main():
    # Tasks start running immediately in the background
    t1 = asyncio.create_task(work(3))
    t2 = asyncio.create_task(work(4))
    print(await t1)  # 9
    print(await t2)  # 16

asyncio.run(main())`,
    explanation: "create_task wraps a coroutine in a Task and schedules it on the running event loop immediately, so it can make progress while you do other work before awaiting it.",
  },
  {
    id: "py-b16-b3-asyncio-queue-producer-consumer",
    language: "python",
    title: "asyncio.Queue – producer / consumer",
    tag: "snippet",
    code: `import asyncio

async def producer(q: asyncio.Queue):
    for i in range(5):
        await q.put(i)          # blocks if queue is full
        await asyncio.sleep(0.05)
    await q.put(None)           # sentinel to stop consumer

async def consumer(q: asyncio.Queue):
    while True:
        item = await q.get()    # blocks until item available
        if item is None:
            break
        print("consumed", item)
        q.task_done()

async def main():
    q: asyncio.Queue = asyncio.Queue(maxsize=3)
    await asyncio.gather(producer(q), consumer(q))

asyncio.run(main())`,
    explanation: "asyncio.Queue coordinates async producers and consumers without threads — put/get naturally yield control to the event loop when the queue is full or empty.",
  },
  {
    id: "py-b16-b3-asyncio-semaphore-rate-limit",
    language: "python",
    title: "asyncio.Semaphore – cap concurrency",
    tag: "snippet",
    code: `import asyncio

sem = asyncio.Semaphore(3)   # at most 3 concurrent workers

async def limited_task(n: int) -> int:
    async with sem:           # acquires one slot
        await asyncio.sleep(0.1)
        return n

async def main():
    tasks = [asyncio.create_task(limited_task(i)) for i in range(10)]
    results = await asyncio.gather(*tasks)
    print(results)

asyncio.run(main())`,
    explanation: "A Semaphore limits how many coroutines run simultaneously — useful for rate-limiting outbound requests or protecting a resource with a fixed pool size.",
  },
  {
    id: "py-b16-b3-async-context-manager",
    language: "python",
    title: "Async context manager with __aenter__/__aexit__",
    tag: "classes",
    code: `import asyncio

class AsyncDB:
    async def __aenter__(self):
        await asyncio.sleep(0.01)  # simulate connect
        print("connected")
        return self

    async def __aexit__(self, exc_type, exc, tb):
        await asyncio.sleep(0.01)  # simulate close
        print("disconnected")
        return False               # don't suppress exceptions

    async def query(self, sql: str) -> list:
        return [{"id": 1}]

async def main():
    async with AsyncDB() as db:
        rows = await db.query("SELECT 1")
        print(rows)

asyncio.run(main())`,
    explanation: "__aenter__ and __aexit__ are the async equivalents of __enter__/__exit__, enabling resource acquisition and cleanup to involve awaiting I/O inside a context manager.",
  },
  {
    id: "py-b16-b3-async-generator",
    language: "python",
    title: "Async generator – yield from async source",
    tag: "snippet",
    code: `import asyncio

async def paginate(total: int, page_size: int):
    offset = 0
    while offset < total:
        await asyncio.sleep(0.01)           # simulate DB call
        batch = list(range(offset, min(offset + page_size, total)))
        for item in batch:
            yield item                      # async yield
        offset += page_size

async def main():
    async for item in paginate(12, 4):
        print(item, end=" ")
    print()

asyncio.run(main())`,
    explanation: "An async generator uses yield inside an async def and is consumed with async for, letting each iteration perform awaitable I/O between items.",
  },
  {
    id: "py-b16-b3-aiohttp-session-stub",
    language: "python",
    title: "aiohttp session pattern (stub)",
    tag: "snippet",
    code: `# pip install aiohttp
import asyncio
import aiohttp  # type: ignore

async def fetch_json(url: str) -> dict:
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as resp:
            resp.raise_for_status()
            return await resp.json()

async def main():
    data = await fetch_json("https://httpbin.org/get")
    print(data["url"])

asyncio.run(main())`,
    explanation: "aiohttp's ClientSession should be used as an async context manager so the underlying TCP connector pool is properly closed when the block exits.",
  },
  {
    id: "py-b16-b3-socket-create-connection",
    language: "python",
    title: "socket.create_connection – TCP connect helper",
    tag: "snippet",
    code: `import socket

# High-level helper that resolves host and connects
with socket.create_connection(("example.com", 80), timeout=5) as sock:
    request = b"GET / HTTP/1.0\\r\\nHost: example.com\\r\\n\\r\\n"
    sock.sendall(request)
    chunks = []
    while chunk := sock.recv(4096):
        chunks.append(chunk)
    body = b"".join(chunks)
    print(body[:200])`,
    explanation: "socket.create_connection is a convenience wrapper over getaddrinfo + connect that handles IPv4/IPv6 fallback and returns a connected socket ready for use.",
  },
  {
    id: "py-b16-b3-http-server-basehttprequesthandler",
    language: "python",
    title: "http.server – simple BaseHTTPRequestHandler",
    tag: "snippet",
    code: `from http.server import BaseHTTPRequestHandler, HTTPServer

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        body = b"Hello, world!"
        self.send_response(200)
        self.send_header("Content-Type", "text/plain")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *args):
        pass  # suppress access logs

server = HTTPServer(("localhost", 8080), Handler)
print("Serving on :8080 — Ctrl-C to stop")
server.serve_forever()`,
    explanation: "BaseHTTPRequestHandler provides do_GET/do_POST hooks for building minimal HTTP servers without external dependencies — ideal for local tooling and tests.",
  },
  {
    id: "py-b16-b3-threading-thread-daemon",
    language: "python",
    title: "threading.Thread with daemon flag",
    tag: "snippet",
    code: `import threading
import time

def background_job():
    while True:
        print("tick")
        time.sleep(1)

t = threading.Thread(target=background_job, daemon=True)
# daemon=True: thread dies automatically when main thread exits
t.start()

time.sleep(3)   # main thread does real work
print("main done — daemon thread will be killed")`,
    explanation: "A daemon thread runs in the background and is killed automatically when all non-daemon threads finish, making it ideal for housekeeping tasks that shouldn't block program exit.",
  },
  {
    id: "py-b16-b3-threading-event-coordination",
    language: "python",
    title: "threading.Event – signal between threads",
    tag: "snippet",
    code: `import threading
import time

ready = threading.Event()

def worker():
    print("worker: waiting for signal...")
    ready.wait()            # blocks until event is set
    print("worker: signal received, running")

t = threading.Thread(target=worker)
t.start()

time.sleep(1)
ready.set()                 # wake the worker
t.join()`,
    explanation: "threading.Event acts as a one-shot gate: worker threads block on wait() and are all released atomically when the main thread calls set().",
  },
  {
    id: "py-b16-b3-threadpool-executor-map",
    language: "python",
    title: "ThreadPoolExecutor.map – parallel I/O",
    tag: "snippet",
    code: `from concurrent.futures import ThreadPoolExecutor
import urllib.request

URLS = [
    "https://example.com",
    "https://httpbin.org/get",
    "https://python.org",
]

def fetch(url: str) -> int:
    with urllib.request.urlopen(url, timeout=5) as r:
        return len(r.read())

with ThreadPoolExecutor(max_workers=4) as pool:
    sizes = list(pool.map(fetch, URLS))   # preserves order
    print(dict(zip(URLS, sizes)))`,
    explanation: "ThreadPoolExecutor.map applies a function to each iterable item in parallel threads and yields results in input order, raising any exception from a worker on iteration.",
  },
  {
    id: "py-b16-b3-process-pool-executor",
    language: "python",
    title: "ProcessPoolExecutor – CPU-bound parallelism",
    tag: "snippet",
    code: `from concurrent.futures import ProcessPoolExecutor
import math

def is_prime(n: int) -> bool:
    if n < 2:
        return False
    for i in range(2, math.isqrt(n) + 1):
        if n % i == 0:
            return False
    return True

if __name__ == "__main__":           # guard required on Windows/macOS
    candidates = range(1_000_000, 1_000_200)
    with ProcessPoolExecutor() as pool:
        primes = [n for n, ok in zip(candidates, pool.map(is_prime, candidates)) if ok]
    print(primes[:5])`,
    explanation: "ProcessPoolExecutor bypasses the GIL by spawning separate interpreter processes, making it the right choice for CPU-bound work like number crunching or image processing.",
  },
  {
    id: "py-b16-b3-subprocess-run-capture",
    language: "python",
    title: "subprocess.run – capture stdout/stderr",
    tag: "snippet",
    code: `import subprocess

result = subprocess.run(
    ["git", "log", "--oneline", "-5"],
    capture_output=True,    # sets stdout=PIPE, stderr=PIPE
    text=True,              # decode bytes to str automatically
    check=True,             # raise CalledProcessError on non-zero exit
)
print("stdout:", result.stdout)
print("returncode:", result.returncode)`,
    explanation: "subprocess.run with capture_output=True and text=True is the idiomatic way to run a command and inspect its output as strings in Python 3.7+.",
  },
  {
    id: "py-b16-b3-os-walk-directory-tree",
    language: "python",
    title: "os.walk – traverse directory tree",
    tag: "snippet",
    code: `import os

for root, dirs, files in os.walk("/tmp"):
    # root: current directory path
    # dirs: list of subdirectories (modify in-place to prune)
    # files: list of file names in root
    dirs[:] = [d for d in dirs if not d.startswith(".")]  # skip hidden
    level = root.count(os.sep) - "/tmp".count(os.sep)
    indent = "  " * level
    print(f"{indent}{os.path.basename(root)}/")
    for f in files:
        print(f"{indent}  {f}")`,
    explanation: "os.walk yields (dirpath, dirnames, filenames) tuples for each directory in a tree; mutating the dirnames list in-place prunes which subdirectories are visited.",
  },
  {
    id: "py-b16-b3-shutil-copytree",
    language: "python",
    title: "shutil.copytree – copy a directory tree",
    tag: "snippet",
    code: `import shutil
import tempfile
import os

src = tempfile.mkdtemp()
# create some files in src
open(os.path.join(src, "a.txt"), "w").close()
open(os.path.join(src, "b.txt"), "w").close()

dst = src + "_copy"
shutil.copytree(
    src, dst,
    ignore=shutil.ignore_patterns("*.pyc", "__pycache__"),
)
print(os.listdir(dst))

shutil.rmtree(src)
shutil.rmtree(dst)`,
    explanation: "shutil.copytree recursively copies an entire directory tree; the ignore parameter accepts a callable (shutil.ignore_patterns is the built-in factory) to skip unwanted files.",
  },
  {
    id: "py-b16-b3-glob-patterns",
    language: "python",
    title: "glob.glob – shell-style wildcard matching",
    tag: "snippet",
    code: `import glob
import os

# Find all .py files recursively (** requires recursive=True)
py_files = glob.glob("**/*.py", recursive=True)
print("Python files:", py_files[:3])

# Non-recursive single-dir match
txt_files = glob.glob("/tmp/*.txt")
print("txt in /tmp:", txt_files)

# glob.iglob is a lazy iterator — better for large trees
for path in glob.iglob("/tmp/**", recursive=True):
    if os.path.isfile(path):
        print(path)
        break`,
    explanation: "glob.glob translates shell wildcards (*, ?, [...]) to matching file paths; using ** with recursive=True performs a full directory tree search.",
  },
  {
    id: "py-b16-b3-fnmatch-fnmatch",
    language: "python",
    title: "fnmatch.fnmatch – filename pattern matching",
    tag: "snippet",
    code: `import fnmatch
import os

files = ["report.pdf", "data.csv", "notes.txt", "archive.tar.gz", "photo.jpg"]

# Match against a shell-style pattern (case-insensitive on Windows)
matches = [f for f in files if fnmatch.fnmatch(f, "*.csv")]
print(matches)   # ['data.csv']

# fnmatch.filter is a convenient bulk-filter shorthand
docs = fnmatch.filter(files, "*.pdf")
print(docs)      # ['report.pdf']`,
    explanation: "fnmatch.fnmatch tests a filename string against a Unix shell-style pattern without touching the filesystem, making it useful inside os.walk filters.",
  },
  {
    id: "py-b16-b3-tempfile-mkdtemp",
    language: "python",
    title: "tempfile.mkdtemp – create a temp directory",
    tag: "snippet",
    code: `import tempfile
import os
import shutil

# mkdtemp never auto-cleans — you are responsible for removal
tmpdir = tempfile.mkdtemp(prefix="myapp_", suffix="_work")
try:
    out = os.path.join(tmpdir, "output.txt")
    with open(out, "w") as f:
        f.write("temporary data")
    print("temp dir:", tmpdir)
    print("contents:", os.listdir(tmpdir))
finally:
    shutil.rmtree(tmpdir)   # always clean up`,
    explanation: "tempfile.mkdtemp creates a uniquely-named directory in the system temp area and returns its path; unlike TemporaryDirectory it does not auto-delete, so cleanup is your responsibility.",
  },
  {
    id: "py-b16-b3-asyncio-event-loop-mechanics",
    language: "python",
    title: "asyncio event loop – how it schedules coroutines",
    tag: "understanding",
    code: `import asyncio

async def say(msg: str, delay: float):
    print(f"before sleep: {msg}")
    await asyncio.sleep(delay)      # yields control to loop
    print(f"after sleep:  {msg}")

async def main():
    # Both tasks are registered; event loop interleaves them
    await asyncio.gather(
        say("hello", 0.2),
        say("world", 0.1),
    )
    # Output order: before hello, before world, after world, after hello

asyncio.run(main())`,
    explanation: "Every await is a checkpoint where the event loop can run other ready callbacks; the loop itself is single-threaded and advances coroutines in FIFO order as I/O events arrive.",
  },
  {
    id: "py-b16-b3-async-await-vs-threading",
    language: "python",
    title: "async/await vs threading – key difference",
    tag: "understanding",
    code: `import asyncio
import threading
import time

# Async: cooperative, single thread, switches at await points
async def async_task(name):
    await asyncio.sleep(0.1)   # yields explicitly
    print(f"async {name}")

# Threading: preemptive, multiple threads, OS decides switch
def thread_task(name):
    time.sleep(0.1)            # blocks thread, OS may switch
    print(f"thread {name}")

async def run_async():
    await asyncio.gather(async_task("A"), async_task("B"))

asyncio.run(run_async())

ts = [threading.Thread(target=thread_task, args=(n,)) for n in ("A", "B")]
for t in ts: t.start()
for t in ts: t.join()`,
    explanation: "async/await uses cooperative multitasking — coroutines yield voluntarily at await points in a single thread, while threading uses OS-managed preemptive scheduling across multiple threads.",
  },
  {
    id: "py-b16-b3-gil-release-io",
    language: "python",
    title: "GIL release during I/O – why threads help",
    tag: "understanding",
    code: `# The GIL is released during blocking I/O calls,
# so multiple threads CAN overlap on network/disk work.

import threading
import urllib.request

results = {}

def fetch(url: str):
    # GIL released while waiting for network data
    with urllib.request.urlopen(url, timeout=5) as r:
        results[url] = len(r.read())

urls = ["https://example.com", "https://httpbin.org/get"]
threads = [threading.Thread(target=fetch, args=(u,)) for u in urls]
for t in threads: t.start()
for t in threads: t.join()
print(results)`,
    explanation: "CPython releases the GIL during system calls like socket reads, so threading genuinely speeds up I/O-bound code even though only one thread runs Python bytecode at a time.",
  },
  {
    id: "py-b16-b3-threading-event-vs-condition",
    language: "python",
    title: "threading.Event vs threading.Condition",
    tag: "understanding",
    code: `import threading

# Event: stateless gate — all waiters released at once
event = threading.Event()
# event.set()   -> wakes all
# event.clear() -> re-arms it
# event.wait()  -> blocks until set

# Condition: stateful — control how many waiters to wake
cond = threading.Condition()

def waiter():
    with cond:
        cond.wait()          # releases lock, blocks
        print("notified")

t = threading.Thread(target=waiter)
t.start()

with cond:
    cond.notify()            # wake exactly one waiter
    # cond.notify_all()      # wake all waiters

t.join()`,
    explanation: "Event is a simple boolean gate that releases all waiters at once; Condition provides fine-grained notify(n) / notify_all() control and is the foundation for higher-level synchronisation primitives like queues.",
  },
  {
    id: "py-b16-b3-queue-blocking-semantics",
    language: "python",
    title: "queue.Queue blocking semantics",
    tag: "understanding",
    code: `import queue
import threading

q: queue.Queue = queue.Queue(maxsize=2)

def producer():
    for i in range(4):
        q.put(i)             # blocks when full (maxsize=2)
        print(f"put {i}")

def consumer():
    import time
    time.sleep(0.2)
    while True:
        try:
            item = q.get(timeout=0.5)
            print(f"got {item}")
            q.task_done()
        except queue.Empty:
            break

threading.Thread(target=producer).start()
threading.Thread(target=consumer).start()`,
    explanation: "queue.Queue.put blocks the caller when the queue is full and get blocks when empty, providing built-in backpressure and thread-safe coordination without explicit locks.",
  },
  {
    id: "py-b16-b3-daemon-threads-non-daemon",
    language: "python",
    title: "Daemon vs non-daemon threads at exit",
    tag: "understanding",
    code: `import threading
import time

def non_daemon():
    time.sleep(2)
    print("non-daemon finished")   # always runs

def daemon_fn():
    time.sleep(5)
    print("daemon finished")       # may never print

t1 = threading.Thread(target=non_daemon, daemon=False)  # default
t2 = threading.Thread(target=daemon_fn,  daemon=True)

t1.start(); t2.start()
# Main thread exits here; t1 is awaited, t2 is killed
t1.join()   # blocks until t1 done
# t2 is forcibly terminated when all non-daemon threads finish`,
    explanation: "Python's interpreter waits for all non-daemon threads before shutting down, but kills daemon threads immediately when the last non-daemon thread exits — so daemon threads suit heartbeats and monitors, never work requiring cleanup.",
  },
  {
    id: "py-b16-b3-process-vs-thread-memory",
    language: "python",
    title: "Process vs thread – memory isolation",
    tag: "understanding",
    code: `import threading
import multiprocessing

shared = [0]   # threads share this object

def thread_inc():
    shared[0] += 1   # unsafe without a lock, but visible to all threads

t = threading.Thread(target=thread_inc)
t.start(); t.join()
print("threads see:", shared[0])   # 1

# Processes get a COPY of memory (fork) or fresh state (spawn)
def proc_inc(lst):
    lst[0] += 1   # only affects the subprocess copy
    print("proc internal:", lst[0])

if __name__ == "__main__":
    p = multiprocessing.Process(target=proc_inc, args=(shared,))
    p.start(); p.join()
    print("main still sees:", shared[0])   # still 1`,
    explanation: "Threads share the same memory space so mutations are immediately visible to all threads (requiring locks), while processes get independent address spaces so changes are invisible to the parent unless you use shared memory or IPC.",
  },
  {
    id: "py-b16-b3-pickle-protocol-versions",
    language: "python",
    title: "pickle protocol versions",
    tag: "understanding",
    code: `import pickle
import sys

obj = {"key": [1, 2, 3], "nested": {"a": True}}

# Protocol 0: ASCII — human-readable, slowest
p0 = pickle.dumps(obj, protocol=0)

# Protocol 5: latest (Python 3.8+) — supports out-of-band buffers
p5 = pickle.dumps(obj, protocol=pickle.HIGHEST_PROTOCOL)
print(f"proto 0: {len(p0)} bytes")
print(f"proto {pickle.HIGHEST_PROTOCOL}: {len(p5)} bytes")

# Always specify protocol for cross-version files
with open("/tmp/data.pkl", "wb") as f:
    pickle.dump(obj, f, protocol=4)   # 4 is widely compatible`,
    explanation: "Higher pickle protocol numbers produce smaller, faster output but require a minimum Python version on the reader; specify an explicit protocol when writing files that cross system boundaries.",
  },
  {
    id: "py-b16-b3-reduce-for-pickling",
    language: "python",
    title: "__reduce__ – custom pickle serialisation",
    tag: "understanding",
    code: `import pickle

class Connection:
    def __init__(self, host: str, port: int):
        self.host = host
        self.port = port
        self._socket = None   # not picklable!

    def __reduce__(self):
        # Return (callable, args) — pickle calls callable(*args) to rebuild
        return (self.__class__, (self.host, self.port))

    def __repr__(self):
        return f"Connection({self.host!r}, {self.port})"

conn = Connection("localhost", 5432)
data = pickle.dumps(conn)
restored = pickle.loads(data)
print(restored)   # Connection('localhost', 5432)`,
    explanation: "__reduce__ lets you control exactly how an object is pickled and unpickled, which is essential when the object holds non-serialisable resources like file descriptors or sockets.",
  },
  {
    id: "py-b16-b3-getnewargs-ex",
    language: "python",
    title: "__getnewargs_ex__ – pickle with keyword args",
    tag: "understanding",
    code: `import pickle

class Point:
    def __new__(cls, *, x: float, y: float):
        obj = super().__new__(cls)
        obj.x = x
        obj.y = y
        return obj

    def __getnewargs_ex__(self):
        # Returns (positional_args_tuple, kwargs_dict)
        # pickle calls cls(*args, **kwargs) to reconstruct
        return (), {"x": self.x, "y": self.y}

    def __repr__(self):
        return f"Point(x={self.x}, y={self.y})"

p = Point(x=1.5, y=2.5)
print(pickle.loads(pickle.dumps(p)))  # Point(x=1.5, y=2.5)`,
    explanation: "__getnewargs_ex__ is used when the class's __new__ takes keyword-only arguments; it returns the (args, kwargs) pair that pickle passes back to __new__ during reconstruction.",
  },
  {
    id: "py-b16-b3-sys-modules-caching",
    language: "python",
    title: "sys.modules – import cache",
    tag: "understanding",
    code: `import sys
import json

# sys.modules maps module name -> module object
print("json" in sys.modules)   # True — already imported

# Second import is free — returns cached object
import json as json2
print(json is json2)           # True, same object

# You can inject a fake module
from types import ModuleType
fake = ModuleType("fake_pkg")
fake.value = 42
sys.modules["fake_pkg"] = fake

import fake_pkg  # type: ignore
print(fake_pkg.value)          # 42`,
    explanation: "Every imported module is cached in sys.modules keyed by its fully-qualified name; subsequent import statements return the cached object without re-executing the module, which is why module-level code runs only once.",
  },
  {
    id: "py-b16-b3-asyncio-queue-vs-queue",
    language: "python",
    title: "asyncio.Queue vs queue.Queue – choose the right one",
    tag: "structures",
    code: `import asyncio
import queue as stdlib_queue

# queue.Queue — thread-safe, blocks the THREAD
tq: stdlib_queue.Queue = stdlib_queue.Queue()
tq.put("item")           # blocks thread if full
tq.get()                 # blocks thread if empty

# asyncio.Queue — coroutine-safe, suspends the COROUTINE
async def demo():
    aq: asyncio.Queue = asyncio.Queue()
    await aq.put("item") # suspends coroutine if full
    item = await aq.get() # suspends coroutine if empty
    print(item)

asyncio.run(demo())
# Rule: use asyncio.Queue inside async code, queue.Queue with threads`,
    explanation: "asyncio.Queue suspends the coroutine at await points without blocking the thread, while queue.Queue blocks the OS thread — mixing them causes deadlocks because a blocked thread can't service the event loop.",
  },
  {
    id: "py-b16-b3-asyncio-priority-queue",
    language: "python",
    title: "asyncio.PriorityQueue – lowest priority first",
    tag: "structures",
    code: `import asyncio

async def main():
    pq: asyncio.PriorityQueue = asyncio.PriorityQueue()

    # Items are (priority, value); lower number = higher priority
    await pq.put((3, "low"))
    await pq.put((1, "high"))
    await pq.put((2, "medium"))

    while not pq.empty():
        priority, value = await pq.get()
        print(priority, value)
    # Output: 1 high, 2 medium, 3 low

asyncio.run(main())`,
    explanation: "asyncio.PriorityQueue orders items by their natural sort order (tuples are compared element-by-element), so wrapping payloads in (priority_int, data) tuples gives you priority scheduling.",
  },
  {
    id: "py-b16-b3-asyncio-lifo-queue",
    language: "python",
    title: "asyncio.LifoQueue – last in, first out",
    tag: "structures",
    code: `import asyncio

async def main():
    lq: asyncio.LifoQueue = asyncio.LifoQueue()

    for i in range(5):
        await lq.put(i)   # put 0, 1, 2, 3, 4

    while not lq.empty():
        print(await lq.get(), end=" ")  # 4 3 2 1 0
    print()

asyncio.run(main())`,
    explanation: "asyncio.LifoQueue behaves like a stack — the last item put is the first retrieved — which models depth-first task scheduling or undo stacks in async programs.",
  },
  {
    id: "py-b16-b3-threading-local",
    language: "python",
    title: "threading.local – per-thread storage",
    tag: "structures",
    code: `import threading

# Each thread sees its own independent copy of local attributes
local = threading.local()

def worker(value: int):
    local.data = value       # set on this thread only
    import time; time.sleep(0.05)
    print(f"thread sees: {local.data}")  # always its own value

threads = [threading.Thread(target=worker, args=(i,)) for i in range(3)]
for t in threads: t.start()
for t in threads: t.join()`,
    explanation: "threading.local stores attributes per-thread, so each thread sees only its own copy; it's the standard way to hold thread-specific context like database connections or request state.",
  },
  {
    id: "py-b16-b3-multiprocessing-manager-dict",
    language: "python",
    title: "multiprocessing.Manager – shared dict across processes",
    tag: "structures",
    code: `import multiprocessing

def worker(shared: dict, key: str):
    shared[key] = multiprocessing.current_process().pid

if __name__ == "__main__":
    with multiprocessing.Manager() as mgr:
        d = mgr.dict()       # proxy to a server process
        procs = [
            multiprocessing.Process(target=worker, args=(d, f"p{i}"))
            for i in range(3)
        ]
        for p in procs: p.start()
        for p in procs: p.join()
        print(dict(d))       # {p0: pid0, p1: pid1, p2: pid2}`,
    explanation: "Manager().dict() creates a proxy object backed by a manager server process; all child processes communicate with that server to read/write the shared dict without manual locking.",
  },
  {
    id: "py-b16-b3-multiprocessing-value-shared-memory",
    language: "python",
    title: "multiprocessing.Value – shared typed scalar",
    tag: "structures",
    code: `import multiprocessing

def increment(counter: multiprocessing.Value, n: int):
    for _ in range(n):
        with counter.get_lock():   # acquire the built-in lock
            counter.value += 1

if __name__ == "__main__":
    count = multiprocessing.Value("i", 0)   # 'i' = C int
    procs = [multiprocessing.Process(target=increment, args=(count, 1000))
             for _ in range(4)]
    for p in procs: p.start()
    for p in procs: p.join()
    print(count.value)   # 4000`,
    explanation: "multiprocessing.Value allocates a typed scalar in shared memory accessible by all processes; the built-in lock (get_lock()) must be used for read-modify-write operations to avoid races.",
  },
  {
    id: "py-b16-b3-mmap-random-access",
    language: "python",
    title: "mmap.mmap – memory-mapped file random access",
    tag: "structures",
    code: `import mmap
import tempfile
import os

# Write some data to a temp file first
with tempfile.NamedTemporaryFile(delete=False) as f:
    fname = f.name
    f.write(b"Hello, memory-mapped world!")

with open(fname, "r+b") as f:
    mm = mmap.mmap(f.fileno(), 0)   # 0 = map entire file
    print(mm[0:5])                  # b'Hello'
    mm[7:13] = b"MAPPED"            # in-place edit
    mm.seek(0)
    print(mm.read())                # b'Hello, MAPPED world!'
    mm.close()

os.unlink(fname)`,
    explanation: "mmap maps a file directly into the process's virtual address space, enabling random read/write access with slice notation without loading the entire file into a Python bytes object.",
  },
  {
    id: "py-b16-b3-shelve-persistent-dict",
    language: "python",
    title: "shelve.open – persistent dict on disk",
    tag: "structures",
    code: `import shelve
import os

path = "/tmp/myshelf"

# Write
with shelve.open(path) as db:
    db["user"]    = {"name": "Alice", "age": 30}
    db["counter"] = 42

# Read back (survives process restart)
with shelve.open(path) as db:
    print(db["user"])      # {'name': 'Alice', 'age': 30}
    print(db["counter"])   # 42

# Clean up shelf files
for ext in ["", ".db", ".dir", ".bak", ".dat"]:
    if os.path.exists(path + ext):
        os.remove(path + ext)`,
    explanation: "shelve provides a persistent dict backed by dbm that can store arbitrary picklable Python objects; it's useful for simple local caching between runs without a full database.",
  },
  {
    id: "py-b16-b3-sqlite3-context-manager",
    language: "python",
    title: "sqlite3 connection context manager",
    tag: "structures",
    code: `import sqlite3

with sqlite3.connect(":memory:") as conn:
    # Context manager commits on exit, rolls back on exception
    conn.execute("CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)")
    conn.executemany(
        "INSERT INTO users (name) VALUES (?)",
        [("Alice",), ("Bob",), ("Carol",)],
    )
    # conn.commit() is called automatically on __exit__

with sqlite3.connect(":memory:") as conn2:
    conn2.execute("CREATE TABLE t (x)")
    conn2.execute("INSERT INTO t VALUES (1)")
print("committed automatically")`,
    explanation: "sqlite3.connect used as a context manager automatically calls commit on clean exit and rollback on exception, but the connection itself is NOT closed — call conn.close() explicitly if needed.",
  },
  {
    id: "py-b16-b3-sqlite3-row-factory",
    language: "python",
    title: "sqlite3 row_factory – access columns by name",
    tag: "structures",
    code: `import sqlite3

conn = sqlite3.connect(":memory:")
conn.row_factory = sqlite3.Row   # rows behave like dicts

conn.execute("CREATE TABLE books (title TEXT, year INT)")
conn.execute("INSERT INTO books VALUES ('Clean Code', 2008)")
conn.execute("INSERT INTO books VALUES ('SICP', 1996)")

for row in conn.execute("SELECT * FROM books"):
    print(row["title"], row["year"])   # access by column name
    print(dict(row))                   # convert to plain dict

conn.close()`,
    explanation: "Setting row_factory = sqlite3.Row replaces plain tuples with objects that support both index-based and name-based access, making query result handling much more readable.",
  },
  {
    id: "py-b16-b3-csv-reader-vs-dictreader",
    language: "python",
    title: "csv.reader vs csv.DictReader",
    tag: "structures",
    code: `import csv
import io

data = "name,age,city\\nAlice,30,NYC\\nBob,25,LA"

# csv.reader: rows are lists of strings
reader = csv.reader(io.StringIO(data))
header = next(reader)           # ['name', 'age', 'city']
print(header)
for row in reader:
    print(row)                  # ['Alice', '30', 'NYC']

# csv.DictReader: rows are dicts keyed by header
dict_reader = csv.DictReader(io.StringIO(data))
for row in dict_reader:
    print(row["name"], row["age"])   # Alice 30`,
    explanation: "csv.reader gives raw lists (faster), while csv.DictReader maps each row to a dict using the header line as keys — choose DictReader when column order might change or readability matters.",
  },
  {
    id: "py-b16-b3-xml-etree-parse-find",
    language: "python",
    title: "xml.etree – parse and query XML",
    tag: "structures",
    code: `import xml.etree.ElementTree as ET

xml_str = """<catalog>
  <book id="1"><title>Python</title><year>2023</year></book>
  <book id="2"><title>C#</title><year>2022</year></book>
</catalog>"""

root = ET.fromstring(xml_str)

# Find all <book> elements
for book in root.findall("book"):
    bid   = book.get("id")               # attribute access
    title = book.findtext("title", "?")  # text of child element
    year  = book.findtext("year", "?")
    print(f"[{bid}] {title} ({year})")`,
    explanation: "xml.etree.ElementTree is the standard library's lightweight XML parser; findall uses a limited XPath subset for searching children, and findtext returns the text content of the first matching element.",
  },
  {
    id: "py-b16-b3-configparser-interpolation",
    language: "python",
    title: "configparser interpolation – variable substitution",
    tag: "structures",
    code: `import configparser

cfg_text = """
[DEFAULT]
base_dir = /var/app

[paths]
log_dir = %(base_dir)s/logs
data_dir = %(base_dir)s/data
"""

cfg = configparser.ConfigParser()
cfg.read_string(cfg_text)

print(cfg["paths"]["log_dir"])    # /var/app/logs
print(cfg["paths"]["data_dir"])   # /var/app/data

# Disable interpolation with RawConfigParser if % appears in values
raw = configparser.RawConfigParser()
raw.read_string(cfg_text)
print(raw["paths"]["log_dir"])    # %(base_dir)s/logs (unexpanded)`,
    explanation: "ConfigParser's default interpolation expands %(key)s references using values from the same section or [DEFAULT], providing simple variable substitution in INI-style config files.",
  },
  {
    id: "py-b16-b3-tomllib-parse",
    language: "python",
    title: "tomllib – parse TOML (Python 3.11+)",
    tag: "structures",
    code: `# tomllib is in the standard library from Python 3.11
import tomllib

toml_bytes = b"""
[project]
name = "myapp"
version = "1.0.0"
requires-python = ">=3.11"

[project.dependencies]
requests = ">=2.28"
"""

config = tomllib.loads(toml_bytes.decode())
print(config["project"]["name"])           # myapp
print(config["project"]["requires-python"]) # >=3.11

# From file: tomllib.load() requires "rb" mode
# with open("pyproject.toml", "rb") as f:
#     config = tomllib.load(f)`,
    explanation: "tomllib (Python 3.11+) provides read-only TOML parsing in the standard library; it only accepts binary mode input to ensure correct UTF-8 decoding of the TOML spec.",
  },
  {
    id: "py-b16-b3-asyncio-run-vs-loop",
    language: "python",
    title: "asyncio.run vs loop.run_until_complete – caveat",
    tag: "caveats",
    code: `import asyncio

async def main():
    return 42

# PREFERRED (Python 3.7+): creates a fresh loop, cleans up on exit
result = asyncio.run(main())
print(result)  # 42

# LEGACY: manual loop lifecycle — easy to forget cleanup
loop = asyncio.new_event_loop()
try:
    result = loop.run_until_complete(main())
    print(result)
finally:
    loop.run_until_complete(loop.shutdown_asyncgens())
    loop.close()

# asyncio.run() also handles shutdown_asyncgens and executor shutdown`,
    explanation: "asyncio.run() is the correct high-level entry point because it sets up and tears down the event loop cleanly (including async generators and the default executor); the manual loop API is error-prone and mostly needed in frameworks.",
  },
  {
    id: "py-b16-b3-forgetting-await",
    language: "python",
    title: "Caveat: forgetting await returns a coroutine object",
    tag: "caveats",
    code: `import asyncio

async def get_data() -> int:
    await asyncio.sleep(0)
    return 99

async def bad():
    result = get_data()    # WRONG: result is a coroutine object, not 99
    print(type(result))    # <class 'coroutine'>
    print(result)          # <coroutine object get_data at 0x...>
    # RuntimeWarning: coroutine 'get_data' was never awaited

async def good():
    result = await get_data()  # correct
    print(result)              # 99

asyncio.run(good())`,
    explanation: "Calling an async function without await creates a coroutine object but does not execute it; Python emits a RuntimeWarning, and the code silently does the wrong thing — always await async function calls.",
  },
  {
    id: "py-b16-b3-task-without-reference-gc",
    language: "python",
    title: "Caveat: tasks without references can be garbage collected",
    tag: "caveats",
    code: `import asyncio

async def risky():
    await asyncio.sleep(1)
    print("finished")        # may never print!

async def bad_main():
    asyncio.create_task(risky())  # no reference kept
    await asyncio.sleep(0.1)
    # risky() may be GC'd before it finishes

async def safe_main():
    task = asyncio.create_task(risky())  # store the reference
    background = {task}                  # or use a set
    task.add_done_callback(background.discard)
    await asyncio.sleep(2)

asyncio.run(safe_main())`,
    explanation: "Tasks created with asyncio.create_task can be garbage-collected if no Python reference to the Task object is kept, silently dropping in-flight work; always store tasks in a variable or collection.",
  },
  {
    id: "py-b16-b3-asyncio-shield-cancellation",
    language: "python",
    title: "asyncio.shield – protect a coroutine from cancellation",
    tag: "caveats",
    code: `import asyncio

async def critical_cleanup():
    await asyncio.sleep(0.2)
    print("cleanup done")   # must not be cancelled

async def main():
    task = asyncio.create_task(
        asyncio.shield(critical_cleanup())
    )
    await asyncio.sleep(0.05)
    task.cancel()           # cancels the outer task...
    try:
        await task
    except asyncio.CancelledError:
        print("outer cancelled, but cleanup continues")
    await asyncio.sleep(0.3)  # give cleanup time to finish

asyncio.run(main())`,
    explanation: "asyncio.shield wraps a coroutine so that cancellation of the outer Task does not cancel the inner future — the inner coroutine continues running, though you still need to await it separately to observe its result.",
  },
  {
    id: "py-b16-b3-nested-event-loop-forbidden",
    language: "python",
    title: "Caveat: nested event loops are forbidden",
    tag: "caveats",
    code: `import asyncio

async def inner():
    return 1

async def outer():
    # This would raise RuntimeError: This event loop is already running
    # asyncio.run(inner())   # WRONG inside a running loop

    # Correct: just await the coroutine directly
    result = await inner()
    return result

# asyncio.run starts a loop; nesting another asyncio.run inside fails
# Use nest_asyncio (third-party) only as a last resort in notebooks
print(asyncio.run(outer()))  # 1`,
    explanation: "asyncio.run() cannot be called from inside a running event loop because it tries to create and run a new loop; inside async code, await the coroutine directly instead.",
  },
  {
    id: "py-b16-b3-threading-race-condition",
    language: "python",
    title: "Caveat: threading race condition without a lock",
    tag: "caveats",
    code: `import threading

counter = 0   # shared mutable state

def unsafe_increment():
    global counter
    for _ in range(100_000):
        counter += 1   # NOT atomic: read-modify-write can interleave

threads = [threading.Thread(target=unsafe_increment) for _ in range(2)]
for t in threads: t.start()
for t in threads: t.join()
print(counter)   # should be 200_000, but often isn't

lock = threading.Lock()
counter = 0
def safe_increment():
    global counter
    for _ in range(100_000):
        with lock:
            counter += 1

threads = [threading.Thread(target=safe_increment) for _ in range(2)]
for t in threads: t.start()
for t in threads: t.join()
print(counter)   # 200_000 every time`,
    explanation: "Even simple counter += 1 is not atomic in CPython because it compiles to multiple bytecode instructions that can be interleaved between threads; a Lock serialises access and prevents lost updates.",
  },
  {
    id: "py-b16-b3-multiprocessing-start-method",
    language: "python",
    title: "Caveat: multiprocessing start method platform differences",
    tag: "caveats",
    code: `import multiprocessing
import sys

# Default start methods:
#   Linux/macOS: 'fork'  (fast, copies parent state)
#   macOS 3.8+:  'spawn' (safe, fresh interpreter)
#   Windows:     'spawn' (only option)

print("default method:", multiprocessing.get_start_method())

# 'fork' can deadlock if parent has background threads at fork time
# 'spawn' is safer but slower and requires picklable targets

if __name__ == "__main__":
    # Explicitly set spawn for portable, safe behaviour
    multiprocessing.set_start_method("spawn", force=True)
    def task(): print("hello from child")
    p = multiprocessing.Process(target=task)
    p.start(); p.join()`,
    explanation: "Python's multiprocessing default start method varies by OS; spawn is the safest choice (fresh interpreter, no inherited locks) but requires the if __name__ == '__main__' guard and picklable target functions.",
  },
  {
    id: "py-b16-b3-signal-main-thread-only",
    language: "python",
    title: "Caveat: signal.signal only works in the main thread",
    tag: "caveats",
    code: `import signal
import threading

def handler(signum, frame):
    print(f"signal {signum} caught")

# Works fine in the main thread
signal.signal(signal.SIGTERM, handler)

def thread_fn():
    try:
        signal.signal(signal.SIGINT, handler)   # raises!
    except ValueError as e:
        print(f"error in thread: {e}")
        # ValueError: signal only works in main thread of the main interpreter

t = threading.Thread(target=thread_fn)
t.start(); t.join()`,
    explanation: "CPython only allows signal handlers to be installed from the main thread because the OS delivers signals to the process as a whole; background threads should use threading.Event or queues instead.",
  },
  {
    id: "py-b16-b3-futures-exception-propagation",
    language: "python",
    title: "Caveat: concurrent.futures exception propagation",
    tag: "caveats",
    code: `from concurrent.futures import ThreadPoolExecutor

def might_fail(n: int) -> int:
    if n == 2:
        raise ValueError(f"bad input: {n}")
    return n * n

with ThreadPoolExecutor() as pool:
    futures = [pool.submit(might_fail, i) for i in range(4)]

# Exceptions are NOT raised until you call result()
for f in futures:
    try:
        print(f.result())
    except ValueError as e:
        print(f"caught: {e}")

# With pool.map: exception is raised at iteration time
with ThreadPoolExecutor() as pool:
    try:
        for val in pool.map(might_fail, range(4)):
            print(val)
    except ValueError as e:
        print(f"map raised: {e}")`,
    explanation: "concurrent.futures captures exceptions inside worker threads/processes and re-raises them when you call Future.result() or iterate over pool.map() — never letting exceptions silently vanish.",
  },
  {
    id: "py-b16-b3-subprocess-pipe-deadlock",
    language: "python",
    title: "Caveat: subprocess PIPE deadlock",
    tag: "caveats",
    code: `import subprocess

# DANGER: do not use Popen with PIPE and read stdout/stderr separately
# if the child writes a lot — the pipe buffer fills and deadlocks.

# SAFE: use communicate() which reads both pipes concurrently
proc = subprocess.Popen(
    ["python3", "-c", "print('x' * 10000)"],
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
)
stdout, stderr = proc.communicate()   # no deadlock
print(len(stdout))

# SAFER STILL: use subprocess.run with capture_output=True
result = subprocess.run(
    ["python3", "-c", "print('hello')"],
    capture_output=True, text=True, check=True,
)
print(result.stdout.strip())`,
    explanation: "Reading proc.stdout.read() while ignoring stderr can deadlock when the child fills the stderr pipe buffer waiting for the reader; communicate() drains both pipes concurrently, avoiding the deadlock.",
  },
  {
    id: "py-b16-b3-shutil-rmtree-race",
    language: "python",
    title: "Caveat: shutil.rmtree race with concurrent writers",
    tag: "caveats",
    code: `import shutil
import os
import tempfile

tmpdir = tempfile.mkdtemp()
open(os.path.join(tmpdir, "file.txt"), "w").close()

# shutil.rmtree is NOT atomic and can fail mid-delete
# if another process creates files in the tree concurrently.
# Use ignore_errors=True to tolerate partial deletion (e.g. CI cleanup).
shutil.rmtree(tmpdir, ignore_errors=True)

# For safety, use onerror to log failures instead of silently ignoring
def on_err(func, path, exc_info):
    print(f"rmtree error: {path}: {exc_info[1]}")

tmpdir2 = tempfile.mkdtemp()
shutil.rmtree(tmpdir2, onerror=on_err)`,
    explanation: "shutil.rmtree deletes files and directories one by one; concurrent file creation inside the tree during deletion causes FileNotFoundError or PermissionError, so use onerror for graceful handling.",
  },
  {
    id: "py-b16-b3-tempfile-cleanup-on-exception",
    language: "python",
    title: "Caveat: tempfile cleanup on exception",
    tag: "caveats",
    code: `import tempfile
import shutil
import os

# mkdtemp does NOT auto-clean — leaked on exception without try/finally
def bad_usage():
    d = tempfile.mkdtemp()
    open(os.path.join(d, "f"), "w").close()
    raise RuntimeError("oops")   # tmpdir leaks!

# SAFE: TemporaryDirectory auto-deletes even on exception
with tempfile.TemporaryDirectory() as d:
    open(os.path.join(d, "f"), "w").close()
    # d is cleaned up on exit, even if an exception occurs
    print("tmp:", d)

print("cleaned up:", not os.path.exists(d))  # True`,
    explanation: "tempfile.mkdtemp requires manual cleanup; prefer tempfile.TemporaryDirectory as a context manager so the directory is removed even when an exception aborts the block.",
  },
  {
    id: "py-b16-b3-asyncio-future-vs-task",
    language: "python",
    title: "asyncio.Future vs asyncio.Task",
    tag: "types",
    code: `import asyncio

async def demo():
    # Future: a low-level promise; set_result() from outside
    loop = asyncio.get_running_loop()
    fut: asyncio.Future[int] = loop.create_future()
    loop.call_soon(fut.set_result, 42)
    print(await fut)   # 42

    # Task: a Future that wraps and drives a coroutine
    async def work() -> str:
        await asyncio.sleep(0)
        return "done"

    task: asyncio.Task[str] = asyncio.create_task(work())
    print(await task)  # "done"
    # Task IS-A Future — isinstance(task, asyncio.Future) is True

asyncio.run(demo())`,
    explanation: "asyncio.Future is a low-level result container that you resolve manually with set_result(); asyncio.Task is a subclass that wraps a coroutine and advances it through the event loop automatically.",
  },
  {
    id: "py-b16-b3-typing-awaitable",
    language: "python",
    title: "typing.Awaitable – accept any awaitable",
    tag: "types",
    code: `from typing import Awaitable
import asyncio

async def run_anything(coro: Awaitable[int]) -> int:
    return await coro

async def produce() -> int:
    return 7

async def main():
    # Works with coroutines, Tasks, and Futures
    result = await run_anything(produce())
    print(result)   # 7

    fut: asyncio.Future[int] = asyncio.get_event_loop().create_future()
    asyncio.get_event_loop().call_soon(fut.set_result, 99)
    print(await run_anything(fut))  # 99

asyncio.run(main())`,
    explanation: "typing.Awaitable[T] is the broadest annotation for objects that support await — it covers coroutines, Tasks, and Futures, letting you write functions that accept any awaitable without locking into a specific type.",
  },
  {
    id: "py-b16-b3-typing-coroutine",
    language: "python",
    title: "typing.Coroutine – fully specify a coroutine's type",
    tag: "types",
    code: `from typing import Coroutine, Generator
import asyncio

# Coroutine[YieldType, SendType, ReturnType]
# For most async defs: YieldType=Any, SendType=Any, ReturnType=T
def make_task() -> Coroutine[None, None, int]:
    async def inner() -> int:
        await asyncio.sleep(0)
        return 10
    return inner()

coro = make_task()
print(asyncio.run(coro))   # 10

# In practice, use the simpler async def -> int annotation
# Coroutine is only needed when storing/passing coroutines as values`,
    explanation: "typing.Coroutine[Yield, Send, Return] precisely types coroutine objects; in practice you only need it when a function returns a coroutine object rather than awaiting it internally.",
  },
  {
    id: "py-b16-b3-typing-async-generator",
    language: "python",
    title: "typing.AsyncGenerator – type async generators",
    tag: "types",
    code: `from typing import AsyncGenerator
import asyncio

# AsyncGenerator[YieldType, SendType]
# For send-less generators, SendType is None
async def countdown(n: int) -> AsyncGenerator[int, None]:
    while n > 0:
        yield n
        n -= 1
        await asyncio.sleep(0)

async def main():
    async for val in countdown(5):
        print(val, end=" ")  # 5 4 3 2 1

asyncio.run(main())`,
    explanation: "typing.AsyncGenerator[Y, S] annotates an async generator function's return type; use YieldType for the yielded values and None for SendType if you don't use asend().",
  },
  {
    id: "py-b16-b3-typing-async-context-manager",
    language: "python",
    title: "typing.AsyncContextManager – type async with",
    tag: "types",
    code: `from typing import AsyncContextManager
from contextlib import asynccontextmanager
import asyncio

@asynccontextmanager
async def managed_resource(name: str):
    print(f"open {name}")
    try:
        yield name.upper()
    finally:
        print(f"close {name}")

def get_ctx(name: str) -> AsyncContextManager[str]:
    return managed_resource(name)

async def main():
    async with get_ctx("db") as handle:
        print(handle)   # DB

asyncio.run(main())`,
    explanation: "typing.AsyncContextManager[T] types objects usable in async with blocks, where T is the type yielded by __aenter__; contextlib.asynccontextmanager is the easiest way to create one.",
  },
  {
    id: "py-b16-b3-concurrent-future-vs-asyncio-future",
    language: "python",
    title: "concurrent.futures.Future vs asyncio.Future",
    tag: "types",
    code: `import concurrent.futures
import asyncio

def sync_work() -> int:
    return 42

async def bridge():
    loop = asyncio.get_running_loop()

    # Run blocking function in thread pool, get an asyncio.Future back
    # concurrent.futures.Future is NOT awaitable directly
    cf: concurrent.futures.Future[int] = concurrent.futures.Future()

    # asyncio.wrap_future bridges the two worlds
    af: asyncio.Future[int] = asyncio.wrap_future(
        loop.run_in_executor(None, sync_work)
    )
    result = await af
    print(result)   # 42

asyncio.run(bridge())`,
    explanation: "concurrent.futures.Future is thread-safe and used by Executor.submit(); asyncio.Future is single-threaded and event-loop-native — asyncio.wrap_future and loop.run_in_executor bridge them.",
  },
  {
    id: "py-b16-b3-generator-type-annotation",
    language: "python",
    title: "Generator[YieldType, SendType, ReturnType]",
    tag: "types",
    code: `from typing import Generator

def counter(start: int, stop: int) -> Generator[int, None, str]:
    for i in range(start, stop):
        yield i
    return "done"   # StopIteration.value

gen = counter(0, 3)
print(next(gen))    # 0
print(next(gen))    # 1
print(next(gen))    # 2
try:
    next(gen)
except StopIteration as e:
    print(e.value)  # "done"`,
    explanation: "Generator[Y, S, R] precisely types a generator that yields Y, can receive values via send(S), and returns R as StopIteration.value — useful when calling code needs to distinguish generator kinds.",
  },
  {
    id: "py-b16-b3-io-str-vs-textio",
    language: "python",
    title: "IO[str] vs TextIO – file type annotations",
    tag: "types",
    code: `from typing import IO, TextIO, BinaryIO
import io

# IO[str] is the generic base; TextIO and BinaryIO are aliases
def process_text(f: TextIO) -> str:
    return f.read()

def process_binary(f: BinaryIO) -> bytes:
    return f.read()

text_buf: IO[str] = io.StringIO("hello")
bin_buf: IO[bytes] = io.BytesIO(b"bytes")

print(process_text(text_buf))      # hello
print(process_binary(bin_buf))     # b'bytes'

# open() in text mode -> TextIO; binary mode -> BinaryIO
with open("/dev/null", "r") as f:
    result: str = process_text(f)`,
    explanation: "TextIO and BinaryIO are convenient aliases for IO[str] and IO[bytes]; annotate function parameters with these types to accept any file-like object, not just concrete file objects.",
  },
  {
    id: "py-b16-b3-threading-vs-asyncio-family",
    language: "python",
    title: "threading vs asyncio – choose for I/O bound work",
    tag: "families",
    code: `# ASYNCIO: single thread, cooperative, scales to thousands of connections
# THREADING: multiple threads, preemptive, limited by OS and GIL
#
# Rule of thumb:
#   - High concurrency (>100 connections): asyncio
#   - Legacy blocking APIs, simpler code: threading
#   - CPU-bound: multiprocessing (both asyncio and threading fail here)

import asyncio, threading, time

def blocking_io():
    time.sleep(0.1)

async def async_io():
    await asyncio.sleep(0.1)

# Threading version
start = time.monotonic()
threads = [threading.Thread(target=blocking_io) for _ in range(10)]
for t in threads: t.start()
for t in threads: t.join()
print(f"threads: {time.monotonic() - start:.2f}s")  # ~0.1s

# Asyncio version
async def run():
    await asyncio.gather(*[async_io() for _ in range(10)])
start = time.monotonic()
asyncio.run(run())
print(f"asyncio: {time.monotonic() - start:.2f}s")  # ~0.1s`,
    explanation: "Both asyncio and threading run I/O-bound tasks concurrently in ~the same wall time; asyncio wins on memory and scalability at high concurrency, while threading is simpler to retrofit into existing synchronous code.",
  },
  {
    id: "py-b16-b3-multiprocessing-vs-processpool-family",
    language: "python",
    title: "multiprocessing vs ProcessPoolExecutor – family comparison",
    tag: "families",
    code: `# multiprocessing.Process: full control, verbose, manual lifecycle
# concurrent.futures.ProcessPoolExecutor: simpler API, map/submit

import multiprocessing
from concurrent.futures import ProcessPoolExecutor

def square(n): return n * n

if __name__ == "__main__":
    # Low-level Process
    with multiprocessing.Pool(4) as pool:
        low = pool.map(square, range(8))
    print("mp.Pool:", low)

    # High-level futures
    with ProcessPoolExecutor(max_workers=4) as ex:
        high = list(ex.map(square, range(8)))
    print("PPE:    ", high)
    # Both produce [0, 1, 4, 9, 16, 25, 36, 49]`,
    explanation: "ProcessPoolExecutor gives you a cleaner Future-based API and integrates with asyncio via loop.run_in_executor; multiprocessing.Pool offers more control (apply_async, chunksize, maxtasksperchild) at the cost of verbosity.",
  },
  {
    id: "py-b16-b3-asyncio-queue-family",
    language: "python",
    title: "asyncio.Queue vs PriorityQueue vs LifoQueue",
    tag: "families",
    code: `import asyncio

async def demo():
    # FIFO Queue — fairest, first-come first-served
    q: asyncio.Queue[int] = asyncio.Queue()
    for i in [3, 1, 2]: await q.put(i)
    print("FIFO:", [await q.get() for _ in range(3)])  # [3,1,2]

    # PriorityQueue — smallest item first
    pq: asyncio.PriorityQueue[int] = asyncio.PriorityQueue()
    for i in [3, 1, 2]: await pq.put(i)
    print("PQ:  ", [await pq.get() for _ in range(3)])  # [1,2,3]

    # LifoQueue — most recent first (stack)
    lq: asyncio.LifoQueue[int] = asyncio.LifoQueue()
    for i in [3, 1, 2]: await lq.put(i)
    print("LIFO:", [await lq.get() for _ in range(3)])  # [2,1,3]

asyncio.run(demo())`,
    explanation: "All three async queues share the same put/get API; choose FIFO for fairness, PriorityQueue when tasks have urgency, and LifoQueue when recency (depth-first scheduling) is preferred.",
  },
  {
    id: "py-b16-b3-subprocess-run-vs-popen-family",
    language: "python",
    title: "subprocess.run vs subprocess.Popen – when to use each",
    tag: "families",
    code: `import subprocess

# subprocess.run: blocking, returns CompletedProcess — use for one-shot commands
result = subprocess.run(
    ["echo", "hello"],
    capture_output=True, text=True, check=True
)
print("run:", result.stdout.strip())

# subprocess.Popen: non-blocking, streaming — use for long-running processes
proc = subprocess.Popen(
    ["python3", "-c", "import sys; sys.stdout.write('line\\n'); sys.stdout.flush()"],
    stdout=subprocess.PIPE, text=True
)
for line in proc.stdout:
    print("popen line:", line.strip())
proc.wait()`,
    explanation: "Use subprocess.run when you need the full output after a command finishes; use Popen when you need to stream output, write to stdin, or interact with a long-running process.",
  },
  {
    id: "py-b16-b3-os-path-vs-pathlib-family",
    language: "python",
    title: "os.path vs pathlib.Path – modern path handling",
    tag: "families",
    code: `import os
import pathlib

# os.path: functional, string-based (compatible with legacy code)
p_str = os.path.join("/tmp", "data", "file.txt")
print(os.path.basename(p_str))   # file.txt
print(os.path.exists(p_str))     # False

# pathlib.Path: OO, method-chaining, cross-platform (preferred in 3.6+)
p = pathlib.Path("/tmp") / "data" / "file.txt"
print(p.name)        # file.txt
print(p.suffix)      # .txt
print(p.parent)      # /tmp/data
print(p.exists())    # False
print(str(p))        # /tmp/data/file.txt  (interop with os APIs)`,
    explanation: "pathlib.Path is the modern, object-oriented path API that composes with / operator and provides readable attribute access; os.path remains useful for interop with legacy code expecting plain strings.",
  },
  {
    id: "py-b16-b3-http-client-family",
    language: "python",
    title: "http.client vs urllib vs requests pattern",
    tag: "families",
    code: `# http.client: lowest-level, manual header/body handling
import http.client
conn = http.client.HTTPSConnection("httpbin.org")
conn.request("GET", "/status/200")
resp = conn.getresponse()
print("http.client:", resp.status)
conn.close()

# urllib: stdlib, handles redirects and encodings
import urllib.request
with urllib.request.urlopen("https://httpbin.org/status/200") as r:
    print("urllib:", r.status)

# requests: third-party, ergonomic, sessions, retries (pip install requests)
# import requests
# r = requests.get("https://httpbin.org/status/200")
# print("requests:", r.status_code)`,
    explanation: "http.client gives raw control, urllib adds redirect handling and auth helpers, and requests (third-party) adds session management, retry adapters, and a clean API — prefer requests for production HTTP work.",
  },
  {
    id: "py-b16-b3-asyncio-protocol-tcp",
    language: "python",
    title: "asyncio.Protocol – TCP server handler class",
    tag: "classes",
    code: `import asyncio

class EchoProtocol(asyncio.Protocol):
    def connection_made(self, transport: asyncio.Transport):
        peer = transport.get_extra_info("peername")
        print(f"connected from {peer}")
        self.transport = transport

    def data_received(self, data: bytes):
        self.transport.write(data)   # echo back

    def connection_lost(self, exc):
        print("connection closed")

async def main():
    loop = asyncio.get_running_loop()
    server = await loop.create_server(EchoProtocol, "127.0.0.1", 8888)
    print("echo server on :8888")
    async with server:
        await server.serve_forever()

# asyncio.run(main())  # uncomment to run`,
    explanation: "asyncio.Protocol is the callback-based building block for custom TCP protocols; connection_made/data_received/connection_lost are called by the event loop as connection events arrive.",
  },
  {
    id: "py-b16-b3-asyncio-datagram-protocol",
    language: "python",
    title: "asyncio.DatagramProtocol – UDP handler",
    tag: "classes",
    code: `import asyncio

class UDPEcho(asyncio.DatagramProtocol):
    def __init__(self):
        self.transport = None

    def connection_made(self, transport: asyncio.DatagramTransport):
        self.transport = transport

    def datagram_received(self, data: bytes, addr: tuple):
        print(f"received {data!r} from {addr}")
        self.transport.sendto(data, addr)   # echo back

    def error_received(self, exc: Exception):
        print(f"error: {exc}")

async def main():
    loop = asyncio.get_running_loop()
    transport, protocol = await loop.create_datagram_endpoint(
        UDPEcho, local_addr=("127.0.0.1", 9999)
    )
    print("UDP echo on :9999 — send a packet to test")
    await asyncio.sleep(5)
    transport.close()

# asyncio.run(main())`,
    explanation: "asyncio.DatagramProtocol handles UDP sockets via datagram_received callbacks; unlike TCP, each datagram is independent and you pass the peer address explicitly when sending replies.",
  },
  {
    id: "py-b16-b3-abstract-async-method",
    language: "python",
    title: "Abstract async method in ABC",
    tag: "classes",
    code: `from abc import ABC, abstractmethod
import asyncio

class BaseRepository(ABC):
    @abstractmethod
    async def find(self, id: int) -> dict:
        """Subclasses must implement this async method."""

class InMemoryRepo(BaseRepository):
    def __init__(self):
        self._store = {1: {"id": 1, "name": "Alice"}}

    async def find(self, id: int) -> dict:
        await asyncio.sleep(0)   # simulate async I/O
        return self._store.get(id, {})

async def main():
    repo: BaseRepository = InMemoryRepo()
    print(await repo.find(1))   # {'id': 1, 'name': 'Alice'}

asyncio.run(main())`,
    explanation: "Combining @abstractmethod with async def forces subclasses to provide an async implementation; the ABC machinery enforces this at instantiation time, not at call time.",
  },
  {
    id: "py-b16-b3-async-generator-class",
    language: "python",
    title: "Async generator class with __aiter__/__anext__",
    tag: "classes",
    code: `import asyncio

class AsyncRange:
    def __init__(self, start: int, stop: int):
        self.current = start
        self.stop = stop

    def __aiter__(self):
        return self

    async def __anext__(self) -> int:
        if self.current >= self.stop:
            raise StopAsyncIteration
        await asyncio.sleep(0)       # simulate async work
        value = self.current
        self.current += 1
        return value

async def main():
    async for n in AsyncRange(0, 5):
        print(n, end=" ")   # 0 1 2 3 4

asyncio.run(main())`,
    explanation: "Implementing __aiter__ and __anext__ turns any class into an async iterable consumable with async for; __anext__ must raise StopAsyncIteration (not return) when exhausted.",
  },
  {
    id: "py-b16-b3-contextlib-async-context-manager",
    language: "python",
    title: "contextlib.asynccontextmanager decorator",
    tag: "classes",
    code: `from contextlib import asynccontextmanager
import asyncio

@asynccontextmanager
async def open_connection(host: str, port: int):
    print(f"connecting to {host}:{port}")
    reader, writer = await asyncio.open_connection(host, port)
    try:
        yield reader, writer
    finally:
        writer.close()
        await writer.wait_closed()
        print("connection closed")

async def main():
    # Using a real connection; change host/port for a real server
    # async with open_connection("example.com", 80) as (r, w): ...
    print("asynccontextmanager wraps the generator into a context manager")

asyncio.run(main())`,
    explanation: "contextlib.asynccontextmanager turns an async generator function with a single yield into an async context manager, avoiding the boilerplate of __aenter__/__aexit__ for straightforward resource management.",
  },
  {
    id: "py-b16-b3-dataclass-with-lock",
    language: "python",
    title: "Dataclass with asyncio.Lock field",
    tag: "classes",
    code: `from dataclasses import dataclass, field
import asyncio

@dataclass
class Counter:
    value: int = 0
    _lock: asyncio.Lock = field(default_factory=asyncio.Lock, repr=False)

    async def increment(self):
        async with self._lock:
            self.value += 1

    async def get(self) -> int:
        async with self._lock:
            return self.value

async def main():
    c = Counter()
    await asyncio.gather(*[c.increment() for _ in range(100)])
    print(await c.get())   # 100

asyncio.run(main())`,
    explanation: "Using field(default_factory=asyncio.Lock) creates a per-instance lock inside a dataclass; the repr=False argument keeps the lock out of the repr output to avoid noise in logs and debugging.",
  },
  {
    id: "py-b16-b3-thread-safe-singleton",
    language: "python",
    title: "Thread-safe singleton with threading.Lock",
    tag: "classes",
    code: `import threading

class Singleton:
    _instance = None
    _lock = threading.Lock()   # class-level lock

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            with cls._lock:
                # Double-checked locking
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self, value: int = 0):
        if not hasattr(self, "_initialized"):
            self.value = value
            self._initialized = True

s1 = Singleton(10)
s2 = Singleton(99)
print(s1 is s2)      # True
print(s1.value)      # 10 — second __init__ skipped`,
    explanation: "Double-checked locking minimises lock contention: the first check avoids the lock after initialisation, and the second check inside the lock prevents duplicate construction when two threads race at startup.",
  },
  {
    id: "py-b16-b3-xmlrpc-simple-server",
    language: "python",
    title: "xmlrpc simple server",
    tag: "snippet",
    code: `from xmlrpc.server import SimpleXMLRPCServer

def add(a: int, b: int) -> int:
    return a + b

def greet(name: str) -> str:
    return f"Hello, {name}!"

server = SimpleXMLRPCServer(("localhost", 8765), allow_none=True, logRequests=False)
server.register_function(add)
server.register_function(greet)
print("XML-RPC server on :8765")
# server.serve_forever()   # uncomment to run

# Client side (in another script):
# import xmlrpc.client
# proxy = xmlrpc.client.ServerProxy("http://localhost:8765/")
# print(proxy.add(3, 4))      # 7
# print(proxy.greet("Alice"))  # Hello, Alice!`,
    explanation: "SimpleXMLRPCServer exposes Python functions as XML-RPC methods with a few lines of setup; clients call them transparently through a ServerProxy that handles serialisation over HTTP.",
  },
  {
    id: "py-b16-b3-importlib-import-module",
    language: "python",
    title: "importlib.import_module – dynamic import",
    tag: "understanding",
    code: `import importlib

# Import a module by string name at runtime
json = importlib.import_module("json")
print(json.dumps({"key": 1}))   # {"key": 1}

# Import a sub-module with package context
encoder = importlib.import_module(".encoder", package="json")
print(type(encoder.JSONEncoder()))

# Reload a module after changes (useful in REPLs and plugins)
import types
mod = types.ModuleType("dynamic")
mod.value = 42
import sys; sys.modules["dynamic"] = mod
reloaded = importlib.import_module("dynamic")
print(reloaded.value)  # 42`,
    explanation: "importlib.import_module lets you import modules whose names are known only at runtime — essential for plugin systems, dependency injection, and lazy loading of optional dependencies.",
  },
  {
    id: "py-b16-b3-module-all-attribute",
    language: "python",
    title: "__all__ – control what 'from module import *' exposes",
    tag: "understanding",
    code: `# mymodule.py (simulated inline)
import types, sys

mod = types.ModuleType("mymodule")
mod.__all__ = ["public_func", "PublicClass"]

def public_func(): return "public"
def _private_func(): return "private"
class PublicClass: pass
class _PrivateClass: pass

mod.public_func  = public_func
mod._private_func = _private_func
mod.PublicClass  = PublicClass
mod._PrivateClass = _PrivateClass
sys.modules["mymodule"] = mod

# Only names in __all__ are exported by 'from mymodule import *'
# Without __all__, all names not starting with _ are exported
# With __all__, ONLY the listed names are exported (overrides _ convention)
print(mod.__all__)   # ['public_func', 'PublicClass']`,
    explanation: "__all__ is a list of strings that defines the public API for 'from module import *'; it also serves as documentation of intended exports and is respected by tools like pydoc and static analysers.",
  },
  {
    id: "py-b16-b3-dunder-import",
    language: "python",
    title: "__import__ – the built-in behind import",
    tag: "understanding",
    code: `# __import__ is what the 'import' statement calls internally
json = __import__("json")
print(json.dumps([1, 2, 3]))   # [1, 2, 3]

# For sub-modules, the semantics differ from importlib
# __import__("os.path") returns the top-level 'os' package, not os.path
top = __import__("os.path")
print(top is __import__("os"))  # True — returns 'os', not 'os.path'

# importlib.import_module is cleaner for dynamic imports
import importlib
ospath = importlib.import_module("os.path")
print(ospath.join("/a", "b"))   # /a/b`,
    explanation: "__import__ is the low-level hook called by the import statement; for sub-module imports it returns the top-level package, which surprises most people — always use importlib.import_module for dynamic imports instead.",
  },
  {
    id: "py-b16-b3-multiprocessing-array",
    language: "python",
    title: "multiprocessing.Array – shared typed array",
    tag: "structures",
    code: `import multiprocessing

def fill(arr: multiprocessing.Array, start: int):
    for i in range(len(arr)):
        arr[i] = start + i

if __name__ == "__main__":
    # 'd' = C double, '5' elements, shared across processes
    arr = multiprocessing.Array("d", 5)
    p = multiprocessing.Process(target=fill, args=(arr, 10))
    p.start(); p.join()
    print(list(arr))   # [10.0, 11.0, 12.0, 13.0, 14.0]`,
    explanation: "multiprocessing.Array allocates a fixed-length typed array in shared memory that all processes can read and write; it supports the same typecodes as Python's array module ('i', 'd', 'b', etc.).",
  },
  {
    id: "py-b16-b3-copyreg-dispatch-table",
    language: "python",
    title: "copyreg.dispatch_table – global pickle customisation",
    tag: "understanding",
    code: `import copyreg
import pickle

class Color:
    def __init__(self, r: int, g: int, b: int):
        self.r, self.g, self.b = r, g, b

    def __repr__(self):
        return f"Color({self.r}, {self.g}, {self.b})"

def reduce_color(c: Color):
    return (Color, (c.r, c.g, c.b))

# Register without modifying the class itself
copyreg.dispatch_table[Color] = reduce_color

data = pickle.dumps(Color(255, 128, 0))
restored = pickle.loads(data)
print(restored)   # Color(255, 128, 0)`,
    explanation: "copyreg.dispatch_table maps classes to reducer functions without touching the class itself — useful for adding pickle support to third-party classes you don't control.",
  },
  {
    id: "py-b16-b3-fork-duplicates-fds",
    language: "python",
    title: "Caveat: os.fork duplicates file descriptors",
    tag: "caveats",
    code: `import os

# os.fork copies ALL open file descriptors into the child process.
# Both parent and child write to the same underlying file / socket.
# This causes interleaved writes and double-close bugs.

with open("/tmp/fork_test.txt", "w") as f:
    pid = os.fork()   # NOT available on Windows
    if pid == 0:
        # Child process — same file descriptor!
        f.write("child\\n")
        f.flush()
        os._exit(0)   # use _exit to avoid cleanup running twice
    else:
        # Parent process
        f.write("parent\\n")
        os.waitpid(pid, 0)

with open("/tmp/fork_test.txt") as f:
    print(f.read())   # may show "parent" and "child" interleaved
os.unlink("/tmp/fork_test.txt")`,
    explanation: "os.fork inherits all open file descriptors, so both parent and child share the same file position and buffers; close unneeded FDs in the child immediately after forking to avoid double-writes and leaks.",
  },
  {
    id: "py-b16-b3-os-environ-mutation",
    language: "python",
    title: "Caveat: os.environ mutation affects child processes",
    tag: "caveats",
    code: `import os
import subprocess

# os.environ changes are inherited by subsequently spawned subprocesses
os.environ["MY_VAR"] = "hello"

result = subprocess.run(
    ["python3", "-c", "import os; print(os.environ.get('MY_VAR', 'unset'))"],
    capture_output=True, text=True,
)
print(result.stdout.strip())   # hello

# To pass env without polluting os.environ, use the env parameter
clean_env = {**os.environ}
clean_env.pop("MY_VAR", None)
result2 = subprocess.run(
    ["python3", "-c", "import os; print(os.environ.get('MY_VAR', 'unset'))"],
    env=clean_env, capture_output=True, text=True,
)
print(result2.stdout.strip())  # unset`,
    explanation: "os.environ is inherited by child processes through fork/exec, so mutations before subprocess.run are visible in the child; use the env parameter to pass a custom environment without affecting subsequent spawns.",
  },
  {
    id: "py-b16-b3-socket-vs-asyncio-streams",
    language: "python",
    title: "socket vs asyncio streams – family comparison",
    tag: "families",
    code: `import asyncio
import socket

# Blocking socket: simple, one connection per thread
def sync_echo():
    with socket.create_connection(("example.com", 80)) as s:
        s.sendall(b"GET / HTTP/1.0\\r\\nHost: example.com\\r\\n\\r\\n")
        return s.recv(1024)

# asyncio streams: async reader/writer, scales to many connections
async def async_echo():
    reader, writer = await asyncio.open_connection("example.com", 80)
    writer.write(b"GET / HTTP/1.0\\r\\nHost: example.com\\r\\n\\r\\n")
    await writer.drain()
    data = await reader.read(1024)
    writer.close()
    await writer.wait_closed()
    return data

# sync_echo()        # uncomment to test
# asyncio.run(async_echo())`,
    explanation: "asyncio.open_connection returns high-level StreamReader/StreamWriter objects that support async read/write without blocking the event loop, while blocking sockets work naturally in threads but don't scale to many concurrent connections.",
  },
  {
    id: "py-b16-b3-asyncio-task-typing",
    language: "python",
    title: "typing.AsyncIterator – annotate async for sources",
    tag: "types",
    code: `from typing import AsyncIterator
import asyncio

# AsyncIterator[T] is the base for anything usable in "async for"
async def ticker(interval: float) -> AsyncIterator[int]:
    # This is really an AsyncGenerator but AsyncIterator annotation is broader
    n = 0
    while True:
        await asyncio.sleep(interval)
        yield n
        n += 1

async def main():
    count = 0
    async for tick in ticker(0.05):
        print(tick, end=" ")
        count += 1
        if count >= 5:
            break

asyncio.run(main())`,
    explanation: "typing.AsyncIterator[T] is the most general annotation for objects that support async for; async generators satisfy this interface automatically, and it lets callers swap in any async iterable without coupling to a specific implementation.",
  },
  {
    id: "py-b16-b3-concurrent-futures-process-pool-future",
    language: "python",
    title: "concurrent.futures — Future result and cancel",
    tag: "types",
    code: `from concurrent.futures import ThreadPoolExecutor
import time

def slow(n: int) -> int:
    time.sleep(n)
    return n * n

with ThreadPoolExecutor(max_workers=2) as pool:
    f1 = pool.submit(slow, 0.1)
    f2 = pool.submit(slow, 10)  # long task

    # f2 might not have started yet — cancel returns True if so
    cancelled = f2.cancel()
    print("cancelled:", cancelled)

    # Check state without blocking
    print("f1 done:", f1.done())
    time.sleep(0.2)
    print("f1 done:", f1.done())   # True
    print("f1 result:", f1.result())`,
    explanation: "concurrent.futures.Future exposes done(), cancel(), and result() for inspecting and controlling submitted work; cancel() only succeeds if the task hasn't started running yet.",
  },
  {
    id: "py-b16-b3-asyncio-run-in-executor",
    language: "python",
    title: "loop.run_in_executor – run blocking code async",
    tag: "snippet",
    code: `import asyncio
import time

def blocking_sleep(n: float) -> str:
    time.sleep(n)            # blocks a thread, not the event loop
    return f"slept {n}s"

async def main():
    loop = asyncio.get_running_loop()
    # Runs blocking_sleep in the default ThreadPoolExecutor
    result = await loop.run_in_executor(None, blocking_sleep, 0.2)
    print(result)

asyncio.run(main())`,
    explanation: "loop.run_in_executor wraps a blocking function in a thread pool and returns an awaitable Future, letting you integrate legacy synchronous code into an async program without blocking the event loop.",
  },
  {
    id: "py-b16-b3-contextlib-async-exit-stack",
    language: "python",
    title: "contextlib.AsyncExitStack – dynamic async context managers",
    tag: "snippet",
    code: `import asyncio
from contextlib import asynccontextmanager, AsyncExitStack

@asynccontextmanager
async def resource(name: str):
    print(f"open {name}")
    try:
        yield name
    finally:
        print(f"close {name}")

async def main():
    resources = ["db", "cache", "queue"]
    async with AsyncExitStack() as stack:
        handles = [await stack.enter_async_context(resource(r))
                   for r in resources]
        print("all open:", handles)
    # all three are closed in LIFO order here

asyncio.run(main())`,
    explanation: "AsyncExitStack lets you enter a variable number of async context managers dynamically and ensures they are all exited in LIFO order on exit, even if one of the enter calls fails.",
  },
  {
    id: "py-b16-b3-asyncio-timeout",
    language: "python",
    title: "asyncio.timeout – per-operation deadline (3.11+)",
    tag: "snippet",
    code: `import asyncio

async def slow_operation():
    await asyncio.sleep(5)
    return "done"

async def main():
    try:
        async with asyncio.timeout(1.0):   # Python 3.11+
            result = await slow_operation()
            print(result)
    except TimeoutError:
        print("operation timed out")

asyncio.run(main())`,
    explanation: "asyncio.timeout (Python 3.11+) is the idiomatic way to apply a deadline to any block of async code; it raises TimeoutError and properly cancels the inner coroutine, unlike the old asyncio.wait_for pattern.",
  },
  {
    id: "py-b16-b3-asyncio-wait",
    language: "python",
    title: "asyncio.wait – fine-grained task completion control",
    tag: "snippet",
    code: `import asyncio

async def job(n: int) -> int:
    await asyncio.sleep(n * 0.1)
    return n

async def main():
    tasks = {asyncio.create_task(job(i)) for i in range(1, 5)}

    # FIRST_COMPLETED: process results as they arrive
    done, pending = await asyncio.wait(
        tasks, return_when=asyncio.FIRST_COMPLETED
    )
    for t in done:
        print("first done:", t.result())

    # Cancel remaining tasks
    for t in pending:
        t.cancel()
    await asyncio.gather(*pending, return_exceptions=True)

asyncio.run(main())`,
    explanation: "asyncio.wait returns two sets (done, pending) and supports FIRST_COMPLETED, FIRST_EXCEPTION, and ALL_COMPLETED modes, giving more control over task completion than asyncio.gather.",
  },
  {
    id: "py-b16-b3-threading-rlock",
    language: "python",
    title: "threading.RLock – reentrant lock",
    tag: "snippet",
    code: `import threading

rlock = threading.RLock()

def outer():
    with rlock:          # acquires once
        print("outer acquired")
        inner()          # safe: same thread can acquire again

def inner():
    with rlock:          # reentrant — doesn't deadlock
        print("inner acquired (reentrant)")

outer()
# A regular Lock would deadlock here because outer() holds it
# and inner() would block waiting for it forever`,
    explanation: "threading.RLock (re-entrant lock) can be acquired multiple times by the same thread; the lock is only released when the acquisition count drops to zero, preventing self-deadlocks in recursive or nested code.",
  },
  {
    id: "py-b16-b3-threading-barrier",
    language: "python",
    title: "threading.Barrier – synchronise a group of threads",
    tag: "snippet",
    code: `import threading
import time

N = 4
barrier = threading.Barrier(N)   # wait for all N threads

def worker(n: int):
    print(f"thread {n} doing phase 1")
    time.sleep(n * 0.05)
    barrier.wait()               # block until all N reach this point
    print(f"thread {n} in phase 2 — all threads sync'd")

threads = [threading.Thread(target=worker, args=(i,)) for i in range(N)]
for t in threads: t.start()
for t in threads: t.join()`,
    explanation: "threading.Barrier blocks each thread at wait() until all N parties arrive; once the last thread calls wait(), all are released simultaneously — useful for phased parallel algorithms.",
  },
  {
    id: "py-b16-b3-asyncio-gather-return-exceptions",
    language: "python",
    title: "asyncio.gather with return_exceptions=True",
    tag: "snippet",
    code: `import asyncio

async def risky(n: int) -> int:
    if n == 2:
        raise ValueError(f"bad: {n}")
    await asyncio.sleep(0.05)
    return n * 10

async def main():
    results = await asyncio.gather(
        risky(1), risky(2), risky(3),
        return_exceptions=True,   # don't cancel others on failure
    )
    for r in results:
        if isinstance(r, Exception):
            print(f"error: {r}")
        else:
            print(f"ok: {r}")

asyncio.run(main())`,
    explanation: "By default asyncio.gather cancels all remaining tasks if one raises; return_exceptions=True instead returns exceptions as regular values in the results list, letting you handle partial failures gracefully.",
  },
  {
    id: "py-b16-b3-asyncio-task-group",
    language: "python",
    title: "asyncio.TaskGroup – structured concurrency (3.11+)",
    tag: "snippet",
    code: `import asyncio

async def fetch(n: int) -> int:
    await asyncio.sleep(0.1)
    if n == 3:
        raise ValueError("bad n")
    return n * 10

async def main():
    try:
        async with asyncio.TaskGroup() as tg:  # Python 3.11+
            t1 = tg.create_task(fetch(1))
            t2 = tg.create_task(fetch(2))
            t3 = tg.create_task(fetch(3))   # will raise
        # never reached — TaskGroup cancels all on first exception
    except* ValueError as eg:               # ExceptionGroup (3.11+)
        for exc in eg.exceptions:
            print(f"caught: {exc}")
    print("t1:", t1.result(), "t2:", t2.result())

asyncio.run(main())`,
    explanation: "asyncio.TaskGroup (Python 3.11+) is the structured concurrency primitive: if any task raises, all remaining tasks are cancelled and exceptions are collected into an ExceptionGroup for joint handling.",
  },
  {
    id: "py-b16-b3-functools-partial-with-threads",
    language: "python",
    title: "functools.partial with ThreadPoolExecutor",
    tag: "snippet",
    code: `from concurrent.futures import ThreadPoolExecutor
import functools

def process(data: str, prefix: str, suffix: str) -> str:
    return f"{prefix}:{data}:{suffix}"

# Bind common arguments ahead of time with partial
handler = functools.partial(process, prefix="LOG", suffix="END")

items = ["alpha", "beta", "gamma", "delta"]
with ThreadPoolExecutor(max_workers=3) as pool:
    results = list(pool.map(handler, items))

print(results)
# ['LOG:alpha:END', 'LOG:beta:END', ...]`,
    explanation: "functools.partial creates a new callable with some arguments pre-filled, making it easy to pass a multi-argument function to pool.map which only supplies one argument per iteration.",
  },
  {
    id: "py-b16-b3-asyncio-queue-join",
    language: "python",
    title: "asyncio.Queue.join – wait for all tasks done",
    tag: "snippet",
    code: `import asyncio

async def worker(q: asyncio.Queue, worker_id: int):
    while True:
        item = await q.get()
        print(f"worker {worker_id} processing {item}")
        await asyncio.sleep(0.05)
        q.task_done()   # signal that this item is complete

async def main():
    q: asyncio.Queue[int] = asyncio.Queue()
    workers = [asyncio.create_task(worker(q, i)) for i in range(3)]

    for i in range(9):
        await q.put(i)

    await q.join()   # block until all task_done() calls balance puts
    print("all items processed")
    for w in workers:
        w.cancel()

asyncio.run(main())`,
    explanation: "Queue.join() blocks until every item that was put() has had a matching task_done() call, providing a clean way to wait for a worker pool to drain its queue without knowing which worker handled what.",
  },
  {
    id: "py-b16-b3-itertools-chain-with-threads",
    language: "python",
    title: "itertools + ThreadPoolExecutor for chunked parallel work",
    tag: "snippet",
    code: `from concurrent.futures import ThreadPoolExecutor
import itertools

def process_chunk(chunk: list) -> list:
    return [x * x for x in chunk]

data = list(range(20))
CHUNK = 5
chunks = [data[i:i+CHUNK] for i in range(0, len(data), CHUNK)]

with ThreadPoolExecutor(max_workers=4) as pool:
    results = list(itertools.chain.from_iterable(pool.map(process_chunk, chunks)))

print(results[:8])   # [0, 1, 4, 9, 16, 25, 36, 49]`,
    explanation: "Chunking work before passing it to pool.map reduces per-task overhead; itertools.chain.from_iterable flattens the list-of-lists result back into a single sequence.",
  },
  {
    id: "py-b16-b3-multiprocessing-pipe",
    language: "python",
    title: "multiprocessing.Pipe – bidirectional IPC",
    tag: "snippet",
    code: `import multiprocessing

def child(conn):
    msg = conn.recv()          # receive from parent
    print(f"child got: {msg}")
    conn.send(msg.upper())     # send back
    conn.close()

if __name__ == "__main__":
    parent_conn, child_conn = multiprocessing.Pipe()
    p = multiprocessing.Process(target=child, args=(child_conn,))
    p.start()
    parent_conn.send("hello from parent")
    reply = parent_conn.recv()
    print(f"parent got: {reply}")  # HELLO FROM PARENT
    p.join()`,
    explanation: "multiprocessing.Pipe creates a pair of Connection objects for bidirectional IPC between processes; send/recv use pickle serialisation so any picklable Python object can be passed across.",
  },
  {
    id: "py-b16-b3-concurrent-futures-as-completed",
    language: "python",
    title: "as_completed – process futures as they finish",
    tag: "snippet",
    code: `from concurrent.futures import ThreadPoolExecutor, as_completed
import time

def task(n: int) -> int:
    time.sleep(n * 0.1)
    return n * n

with ThreadPoolExecutor(max_workers=4) as pool:
    futures = {pool.submit(task, i): i for i in range(1, 6)}

    # Yields futures in completion order, not submission order
    for fut in as_completed(futures):
        original = futures[fut]
        try:
            print(f"task({original}) -> {fut.result()}")
        except Exception as e:
            print(f"task({original}) raised: {e}")`,
    explanation: "as_completed yields futures in completion order rather than submission order, letting you process results as soon as they're ready rather than waiting for the slowest task before seeing earlier results.",
  },
];

