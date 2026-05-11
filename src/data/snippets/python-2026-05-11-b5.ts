import type { Snippet } from "./types";

export const pythonSnippets20260511B5: Snippet[] = [
  // ── snippet ──────────────────────────────────────────────────────────────
  {
    id: "py-asyncio-run-main",
    language: "python",
    title: "asyncio.run(main()) — canonical async entry point",
    tag: "snippet",
    code: `import asyncio

async def main():
    print("hello from async")   # hello from async
    await asyncio.sleep(0.1)
    print("done")               # done

if __name__ == "__main__":
    asyncio.run(main())         # creates event loop, runs main, closes loop`,
    explanation:
      "asyncio.run() is the one-liner entry point for any async program; it creates a fresh event loop, runs the coroutine until completion, and tears everything down cleanly.",
  },
  {
    id: "py-asyncio-create-task",
    language: "python",
    title: "asyncio.create_task() — schedule a coroutine concurrently",
    tag: "snippet",
    code: `import asyncio

async def worker(name: str) -> str:
    await asyncio.sleep(0.1)
    return f"{name} done"

async def main():
    t1 = asyncio.create_task(worker("A"))  # scheduled immediately
    t2 = asyncio.create_task(worker("B"))  # scheduled immediately
    r1 = await t1   # "A done"
    r2 = await t2   # "B done"
    print(r1, r2)

asyncio.run(main())`,
    explanation:
      "create_task() wraps a coroutine in a Task and schedules it on the running loop right away — both tasks run concurrently without waiting for each other.",
  },
  {
    id: "py-asyncio-gather",
    language: "python",
    title: "asyncio.gather() — run coroutines concurrently",
    tag: "snippet",
    code: `import asyncio

async def fetch(url: str) -> str:
    await asyncio.sleep(0.05)
    return f"data from {url}"

async def main():
    results = await asyncio.gather(
        fetch("https://a.com"),
        fetch("https://b.com"),
        fetch("https://c.com"),
    )
    print(results)
    # ['data from https://a.com', 'data from https://b.com', 'data from https://c.com']

asyncio.run(main())`,
    explanation:
      "asyncio.gather() fires all coroutines concurrently and returns their results in the same order as the arguments, even though they may complete out of order.",
  },
  {
    id: "py-asyncio-sleep-zero",
    language: "python",
    title: "await asyncio.sleep(0) — yield to the event loop",
    tag: "snippet",
    code: `import asyncio

async def cpu_work():
    for i in range(5):
        # do a small chunk of work
        _ = sum(range(10_000))
        await asyncio.sleep(0)   # hand control back so other tasks can run
        print(f"chunk {i} done")

async def other():
    for i in range(3):
        await asyncio.sleep(0)
        print(f"  other step {i}")

asyncio.run(asyncio.gather(cpu_work(), other()))`,
    explanation:
      "await asyncio.sleep(0) is a cooperative yield — it suspends the current coroutine for exactly one event-loop iteration, letting other scheduled tasks get CPU time.",
  },
  {
    id: "py-asyncio-current-task",
    language: "python",
    title: "asyncio.current_task() — identify the running task",
    tag: "snippet",
    code: `import asyncio

async def worker():
    task = asyncio.current_task()
    print(task.get_name())   # e.g. "Task-1"
    print(repr(task))        # <Task pending name='Task-1' coro=<worker() ...>>

async def main():
    t = asyncio.create_task(worker(), name="my-worker")
    await t

asyncio.run(main())`,
    explanation:
      "asyncio.current_task() returns the Task object that is currently executing, which is handy for logging, cancellation checks, or attaching metadata to the running coroutine.",
  },
  {
    id: "py-asyncio-all-tasks",
    language: "python",
    title: "asyncio.all_tasks() — enumerate pending tasks",
    tag: "snippet",
    code: `import asyncio

async def sleeper(n: int):
    await asyncio.sleep(n)

async def main():
    tasks = [asyncio.create_task(sleeper(i)) for i in range(3)]
    await asyncio.sleep(0)          # let tasks start
    pending = asyncio.all_tasks()   # includes main itself
    for t in pending:
        print(t.get_name(), t.done())   # Task-1 False, Task-2 False ...
    for t in tasks:
        t.cancel()

asyncio.run(main())`,
    explanation:
      "asyncio.all_tasks() returns every Task that is alive in the running loop, which is useful for graceful shutdown — you can cancel them all before closing the loop.",
  },
  {
    id: "py-asyncio-cancel-task",
    language: "python",
    title: "task.cancel() — inject CancelledError into a coroutine",
    tag: "snippet",
    code: `import asyncio

async def long_running():
    try:
        await asyncio.sleep(100)
    except asyncio.CancelledError:
        print("I was cancelled — cleaning up")
        raise   # always re-raise CancelledError

async def main():
    task = asyncio.create_task(long_running())
    await asyncio.sleep(0.1)
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        print("task is cancelled:", task.cancelled())  # True

asyncio.run(main())`,
    explanation:
      "task.cancel() schedules a CancelledError to be raised at the next await inside the coroutine; the coroutine should catch it only to clean up, then re-raise so the cancellation propagates correctly.",
  },
  {
    id: "py-async-for",
    language: "python",
    title: "async for — iterate over an async iterator",
    tag: "snippet",
    code: `import asyncio

async def ticker(n: int):
    for i in range(n):
        await asyncio.sleep(0.05)
        yield i

async def main():
    async for value in ticker(4):
        print(value)   # 0  1  2  3

asyncio.run(main())`,
    explanation:
      "async for works just like a regular for loop but calls __anext__ and awaits it each iteration, making it perfect for streaming data sources like network sockets or database cursors.",
  },
  {
    id: "py-async-with",
    language: "python",
    title: "async with — async context manager",
    tag: "snippet",
    code: `import asyncio
from contextlib import asynccontextmanager

@asynccontextmanager
async def managed_resource(name: str):
    print(f"acquiring {name}")
    await asyncio.sleep(0.01)   # async setup
    try:
        yield name
    finally:
        await asyncio.sleep(0.01)   # async teardown
        print(f"released {name}")

async def main():
    async with managed_resource("db-conn") as conn:
        print(f"using {conn}")   # using db-conn

asyncio.run(main())`,
    explanation:
      "async with calls __aenter__ and __aexit__ asynchronously, which lets you do real I/O (open connections, acquire locks) during both setup and teardown without blocking.",
  },
  {
    id: "py-async-gen-yield",
    language: "python",
    title: "async def with yield — async generator",
    tag: "snippet",
    code: `import asyncio

async def paginate(page_size: int):
    page = 0
    while True:
        await asyncio.sleep(0.01)       # simulate I/O fetch
        rows = list(range(page * page_size, (page + 1) * page_size))
        if not rows:
            return
        yield rows
        page += 1
        if page >= 3:
            return   # stop after 3 pages

async def main():
    async for page in paginate(2):
        print(page)   # [0,1]  [2,3]  [4,5]

asyncio.run(main())`,
    explanation:
      "An async generator combines async def and yield — each yield suspends execution cooperatively, so you can lazily stream results from I/O without materialising everything in memory.",
  },
  {
    id: "py-aiofiles-read",
    language: "python",
    title: "aiofiles.open() — non-blocking file I/O",
    tag: "snippet",
    code: `import asyncio
import aiofiles

async def read_file(path: str) -> str:
    async with aiofiles.open(path, mode="r") as f:
        contents = await f.read()
    return contents

async def main():
    text = await read_file("/etc/hostname")
    print(text.strip())   # e.g. "myhost"

asyncio.run(main())`,
    explanation:
      "aiofiles wraps synchronous file operations in a thread pool so they don't block the event loop; the API mirrors the built-in open() so switching is straightforward.",
  },
  {
    id: "py-contextvars-var",
    language: "python",
    title: "ContextVar — task-local state",
    tag: "snippet",
    code: `import asyncio
from contextvars import ContextVar

request_id: ContextVar[str] = ContextVar("request_id", default="none")

async def handle(rid: str):
    token = request_id.set(rid)
    await asyncio.sleep(0)   # yield; other tasks keep their own value
    print(request_id.get())  # each task sees its own rid
    request_id.reset(token)  # restore previous value

async def main():
    await asyncio.gather(handle("req-1"), handle("req-2"), handle("req-3"))

asyncio.run(main())`,
    explanation:
      "ContextVar gives each async task its own isolated slot for a value — unlike a global variable, mutations in one task don't bleed into other concurrently running tasks.",
  },
  {
    id: "py-contextvars-copy",
    language: "python",
    title: "copy_context().run() — isolate context changes",
    tag: "snippet",
    code: `import contextvars

current_user: contextvars.ContextVar[str] = contextvars.ContextVar("user")

def impersonate(user: str, fn):
    ctx = contextvars.copy_context()
    def _run():
        current_user.set(user)
        fn()
    ctx.run(_run)   # changes stay inside ctx; outer context unchanged

current_user.set("alice")
impersonate("bob", lambda: print(current_user.get()))   # bob
print(current_user.get())   # alice  — unchanged outside`,
    explanation:
      "copy_context().run() creates a snapshot of the current context and runs a function inside it; any ContextVar changes made during the run are scoped to that snapshot and don't affect the caller.",
  },
  {
    id: "py-asyncio-wait-set",
    language: "python",
    title: "asyncio.wait() with FIRST_COMPLETED — done/pending sets",
    tag: "snippet",
    code: `import asyncio

async def task(name: str, delay: float):
    await asyncio.sleep(delay)
    return name

async def main():
    tasks = {asyncio.create_task(task(f"T{i}", i * 0.1)) for i in range(1, 4)}
    done, pending = await asyncio.wait(
        tasks,
        return_when=asyncio.FIRST_COMPLETED,
    )
    for t in done:
        print("finished:", t.result())   # finished: T1
    for t in pending:
        t.cancel()   # clean up remaining tasks

asyncio.run(main())`,
    explanation:
      "asyncio.wait() returns two sets — done and pending — letting you react to whichever task finishes first (or all, or first exception) without cancelling the others automatically.",
  },
  // ── understanding ─────────────────────────────────────────────────────────
  {
    id: "py-asyncio-event-loop",
    language: "python",
    title: "Event loop — one coroutine at a time",
    tag: "understanding",
    code: `import asyncio
import time

async def show_concurrency():
    # The loop runs only ONE coroutine at a time.
    # Concurrency happens because coroutines voluntarily yield at 'await'.
    t0 = time.perf_counter()
    await asyncio.gather(
        asyncio.sleep(0.1),   # yields here → other coros can run
        asyncio.sleep(0.1),   # both sleep overlap → total ~0.1 s
    )
    elapsed = time.perf_counter() - t0
    print(f"elapsed: {elapsed:.2f}s")   # elapsed: 0.10s  (not 0.20s)

asyncio.run(show_concurrency())`,
    explanation:
      "asyncio is single-threaded: the event loop runs one coroutine at a time, but I/O-bound coroutines yield at every await, so many can appear to run simultaneously — there is no true parallelism unless you add threads or processes.",
  },
  {
    id: "py-coro-vs-task",
    language: "python",
    title: "Coroutine object vs Task — scheduling matters",
    tag: "understanding",
    code: `import asyncio

async def greet(name: str):
    await asyncio.sleep(0)
    print(f"hello {name}")

async def main():
    coro = greet("world")   # coroutine object — NOT scheduled yet
    print(type(coro))       # <class 'coroutine'>

    task = asyncio.create_task(greet("task"))  # Task — scheduled immediately
    print(type(task))       # <class '_asyncio.Task'>

    await coro   # now it runs
    await task   # already running; just wait for result

asyncio.run(main())`,
    explanation:
      "Calling an async function returns a coroutine object — nothing runs until you either await it directly or wrap it in a Task; only a Task is placed on the event loop's ready queue immediately.",
  },
  {
    id: "py-task-cancel-trace",
    language: "python",
    title: "task.cancel() trace — CancelledError at next await",
    tag: "understanding",
    code: `import asyncio

async def inner():
    print("before sleep")
    await asyncio.sleep(10)     # CancelledError raised HERE
    print("after sleep")        # never reached

async def main():
    t = asyncio.create_task(inner())
    await asyncio.sleep(0)      # let inner() start
    t.cancel()                  # injects CancelledError
    try:
        await t
    except asyncio.CancelledError:
        print("caught cancellation")   # caught cancellation

asyncio.run(main())`,
    explanation:
      "task.cancel() doesn't stop the coroutine instantly — it schedules a CancelledError to be thrown at the next suspension point (await), which is why any cleanup code before that await still runs.",
  },
  {
    id: "py-gather-exception",
    language: "python",
    title: "gather(return_exceptions=True) — exceptions as values",
    tag: "understanding",
    code: `import asyncio

async def risky(n: int):
    if n == 1:
        raise ValueError("bad n=1")
    return n * 10

async def main():
    results = await asyncio.gather(
        risky(0),
        risky(1),    # raises
        risky(2),
        return_exceptions=True,   # don't propagate; collect exceptions
    )
    for r in results:
        if isinstance(r, Exception):
            print("error:", r)   # error: bad n=1
        else:
            print("ok:", r)      # ok: 0  ok: 20

asyncio.run(main())`,
    explanation:
      "By default gather() cancels all siblings and re-raises the first exception; with return_exceptions=True every exception is captured as a regular value, so you can inspect partial results.",
  },
  {
    id: "py-shield-cancel",
    language: "python",
    title: "asyncio.shield() — protect inner coro from cancellation",
    tag: "understanding",
    code: `import asyncio

async def critical_op():
    print("critical started")
    await asyncio.sleep(0.2)
    print("critical finished")   # still runs even if outer is cancelled

async def main():
    task = asyncio.create_task(asyncio.shield(critical_op()))
    await asyncio.sleep(0.05)
    task.cancel()                # cancels the shield wrapper...
    try:
        await task
    except asyncio.CancelledError:
        pass                     # ...but critical_op() keeps running in bg
    await asyncio.sleep(0.3)     # wait to see it finish

asyncio.run(main())`,
    explanation:
      "asyncio.shield() wraps a coroutine so that cancelling the outer Task only cancels the shield itself — the inner coroutine continues running, which is useful for writes or commits that must not be interrupted.",
  },
  {
    id: "py-wait-first-complete",
    language: "python",
    title: "asyncio.wait FIRST_COMPLETED — race pattern",
    tag: "understanding",
    code: `import asyncio

async def fetch(source: str, latency: float):
    await asyncio.sleep(latency)
    return f"result from {source}"

async def main():
    tasks = [
        asyncio.create_task(fetch("fast", 0.05)),
        asyncio.create_task(fetch("slow", 0.5)),
    ]
    done, pending = await asyncio.wait(tasks, return_when=asyncio.FIRST_COMPLETED)
    winner = next(iter(done))
    print(winner.result())   # result from fast
    for t in pending:
        t.cancel()

asyncio.run(main())`,
    explanation:
      "The FIRST_COMPLETED race pattern lets you use whichever data source responds earliest and then cleanly cancel the others — useful for redundant backends or timeouts.",
  },
  {
    id: "py-asyncio-lock-trace",
    language: "python",
    title: "asyncio.Lock() — mutual exclusion within one event loop",
    tag: "understanding",
    code: `import asyncio

counter = 0
lock = asyncio.Lock()

async def increment():
    global counter
    async with lock:          # only one coroutine in this block at a time
        val = counter
        await asyncio.sleep(0)  # simulate work (would race without lock)
        counter = val + 1

async def main():
    await asyncio.gather(*[increment() for _ in range(5)])
    print(counter)   # 5  (not less, which could happen without lock)

asyncio.run(main())`,
    explanation:
      "asyncio.Lock() prevents re-entry: if one coroutine holds the lock, any other coroutine that tries to acquire it will suspend until the lock is released — all within the same single-threaded event loop.",
  },
  {
    id: "py-asyncio-semaphore-trace",
    language: "python",
    title: "asyncio.Semaphore — limit concurrent coroutines",
    tag: "understanding",
    code: `import asyncio

sem = asyncio.Semaphore(3)   # at most 3 concurrent

async def fetch(i: int):
    async with sem:
        print(f"  running {i}")
        await asyncio.sleep(0.1)
        print(f"  done    {i}")

async def main():
    await asyncio.gather(*[fetch(i) for i in range(7)])
    # only 3 "running" lines appear at any given moment

asyncio.run(main())`,
    explanation:
      "A Semaphore with a count of N lets at most N coroutines execute the guarded section simultaneously — the rest queue up and resume one-by-one as slots are freed.",
  },
  {
    id: "py-asyncio-queue-trace",
    language: "python",
    title: "asyncio.Queue — async producer/consumer",
    tag: "understanding",
    code: `import asyncio

async def producer(q: asyncio.Queue):
    for i in range(4):
        await asyncio.sleep(0.05)
        await q.put(i)
        print(f"put {i}")
    await q.put(None)   # sentinel

async def consumer(q: asyncio.Queue):
    while True:
        item = await q.get()
        if item is None:
            break
        print(f"  got {item}")
        q.task_done()

async def main():
    q: asyncio.Queue[int | None] = asyncio.Queue(maxsize=2)
    await asyncio.gather(producer(q), consumer(q))

asyncio.run(main())`,
    explanation:
      "asyncio.Queue provides cooperative back-pressure: if the queue is full the producer suspends at put(), and if it's empty the consumer suspends at get() — no busy-waiting needed.",
  },
  {
    id: "py-context-run",
    language: "python",
    title: "context.run() — execute in an isolated context copy",
    tag: "understanding",
    code: `import contextvars

theme: contextvars.ContextVar[str] = contextvars.ContextVar("theme", default="light")

def report():
    print("theme inside run:", theme.get())

ctx = contextvars.copy_context()
theme.set("dark")            # change outer context

ctx.run(report)              # theme inside run: light  (snapshot was before set)
print("outer:", theme.get()) # outer: dark`,
    explanation:
      "copy_context() snapshots the current ContextVar values; ctx.run() then executes a function in that snapshot, so changes in either direction stay isolated — it's the mechanism asyncio uses to give each Task its own context.",
  },
  {
    id: "py-threadpool-executor",
    language: "python",
    title: "run_in_executor — blocking code in a thread pool",
    tag: "understanding",
    code: `import asyncio
import time

def blocking_io():
    time.sleep(0.2)      # blocks OS thread, NOT the event loop
    return "data"

async def main():
    loop = asyncio.get_running_loop()
    result = await loop.run_in_executor(
        None,            # None → default ThreadPoolExecutor
        blocking_io,
    )
    print(result)        # data

asyncio.run(main())`,
    explanation:
      "run_in_executor(None, fn) offloads a blocking synchronous function to the default thread pool and returns an awaitable, so the event loop stays free to handle other coroutines while the thread runs.",
  },
  {
    id: "py-processpool-executor",
    language: "python",
    title: "ProcessPoolExecutor — CPU-bound work outside the GIL",
    tag: "understanding",
    code: `import asyncio
from concurrent.futures import ProcessPoolExecutor

def cpu_bound(n: int) -> int:
    return sum(i * i for i in range(n))   # pure computation

async def main():
    loop = asyncio.get_running_loop()
    with ProcessPoolExecutor() as pool:
        result = await loop.run_in_executor(pool, cpu_bound, 10_000)
    print(result)   # 333283335000

asyncio.run(main())`,
    explanation:
      "For CPU-heavy work that would monopolise the GIL, use ProcessPoolExecutor so the work runs in a separate Python process; the event loop awaits the Future and resumes when the subprocess result is ready.",
  },
  {
    id: "py-concurrent-map",
    language: "python",
    title: "as_completed() — incremental results from futures",
    tag: "understanding",
    code: `from concurrent.futures import ThreadPoolExecutor, as_completed
import time

def fetch(url: str) -> str:
    time.sleep(0.1)
    return f"resp:{url}"

urls = ["a.com", "b.com", "c.com"]

with ThreadPoolExecutor(max_workers=3) as pool:
    futures = {pool.submit(fetch, url): url for url in urls}
    for fut in as_completed(futures):
        url = futures[fut]
        print(url, "→", fut.result())   # prints as each one finishes`,
    explanation:
      "as_completed() yields futures in completion order rather than submission order, so you can process results as soon as they arrive instead of waiting for the slowest one before seeing any.",
  },
  {
    id: "py-future-callback",
    language: "python",
    title: "future.add_done_callback() — fire on resolution",
    tag: "understanding",
    code: `import asyncio

async def main():
    loop = asyncio.get_running_loop()
    fut: asyncio.Future[int] = loop.create_future()

    def on_done(f: asyncio.Future[int]):
        print("callback, result:", f.result())   # callback, result: 42

    fut.add_done_callback(on_done)
    fut.set_result(42)   # triggers callback synchronously after this coroutine yields
    await asyncio.sleep(0)

asyncio.run(main())`,
    explanation:
      "add_done_callback() registers a plain (non-async) function that runs when the Future resolves or raises; it's called synchronously by the event loop immediately after the result is set, making it useful for fire-and-forget side effects.",
  },
  // ── structures ────────────────────────────────────────────────────────────
  {
    id: "py-asyncio-lifo-queue",
    language: "python",
    title: "asyncio.LifoQueue — last-in-first-out async queue",
    tag: "structures",
    code: `import asyncio

async def main():
    q: asyncio.LifoQueue[int] = asyncio.LifoQueue()
    for i in range(4):
        await q.put(i)          # put 0, 1, 2, 3

    while not q.empty():
        item = await q.get()
        print(item)             # 3  2  1  0  (LIFO order)

asyncio.run(main())`,
    explanation:
      "asyncio.LifoQueue is identical to asyncio.Queue except that get() always returns the most recently put item — useful for depth-first traversals or undo stacks in async code.",
  },
  {
    id: "py-asyncio-priorityqueue",
    language: "python",
    title: "asyncio.PriorityQueue — priority-ordered async queue",
    tag: "structures",
    code: `import asyncio

async def main():
    pq: asyncio.PriorityQueue[tuple[int, str]] = asyncio.PriorityQueue()
    await pq.put((3, "low"))
    await pq.put((1, "high"))
    await pq.put((2, "medium"))

    while not pq.empty():
        priority, task = await pq.get()
        print(priority, task)
    # 1 high
    # 2 medium
    # 3 low

asyncio.run(main())`,
    explanation:
      "asyncio.PriorityQueue uses heap ordering on the items (typically (priority, value) tuples) so get() always returns the lowest-priority-number item first — suitable for async task schedulers.",
  },
  {
    id: "py-tenacity-retry",
    language: "python",
    title: "tenacity @retry — automatic retry with back-off",
    tag: "structures",
    code: `import asyncio
from tenacity import retry, stop_after_attempt, wait_exponential

attempt_count = 0

@retry(
    stop=stop_after_attempt(4),
    wait=wait_exponential(multiplier=0.1, min=0.1, max=1),
)
async def unstable_call():
    global attempt_count
    attempt_count += 1
    if attempt_count < 3:
        raise ConnectionError(f"fail #{attempt_count}")
    return "success"

async def main():
    result = await unstable_call()
    print(result)   # success

asyncio.run(main())`,
    explanation:
      "tenacity's @retry decorator automatically re-calls an async function on exception using the strategy you configure — exponential back-off prevents hammering a flaky service during an outage.",
  },
  {
    id: "py-backoff-decorator",
    language: "python",
    title: "backoff @on_exception — exponential back-off decorator",
    tag: "structures",
    code: `import asyncio
import backoff
import httpx

@backoff.on_exception(
    backoff.expo,
    (httpx.RequestError, httpx.HTTPStatusError),
    max_tries=5,
)
async def get_data(url: str) -> dict:
    async with httpx.AsyncClient() as client:
        resp = await client.get(url)
        resp.raise_for_status()
        return resp.json()

# async def main():
#     data = await get_data("https://api.example.com/data")`,
    explanation:
      "backoff.on_exception wraps an async function and retries it with exponentially increasing delays whenever it raises the specified exception types, up to max_tries attempts.",
  },
  {
    id: "py-circuit-breaker",
    language: "python",
    title: "Circuit breaker — closed → open → half-open",
    tag: "structures",
    code: `import asyncio, time

class CircuitBreaker:
    def __init__(self, threshold=3, timeout=5.0):
        self.failures = 0
        self.threshold = threshold
        self.timeout = timeout
        self.opened_at: float | None = None

    def is_open(self):
        if self.opened_at and time.monotonic() - self.opened_at > self.timeout:
            return False   # half-open: allow one probe
        return self.opened_at is not None

    async def call(self, coro):
        if self.is_open():
            raise RuntimeError("circuit open")
        try:
            result = await coro
            self.failures = 0
            self.opened_at = None
            return result
        except Exception:
            self.failures += 1
            if self.failures >= self.threshold:
                self.opened_at = time.monotonic()
            raise`,
    explanation:
      "A circuit breaker stops forwarding calls to a failing service once errors exceed a threshold (open state), then probes again after a timeout (half-open) — protecting both the caller and the downstream service.",
  },
  {
    id: "py-rate-limiter",
    language: "python",
    title: "Token bucket rate limiter with asyncio.sleep",
    tag: "structures",
    code: `import asyncio, time

class AsyncRateLimiter:
    def __init__(self, rate: float):          # calls per second
        self.rate = rate
        self.tokens = rate
        self.last = time.monotonic()

    async def acquire(self):
        while True:
            now = time.monotonic()
            self.tokens += (now - self.last) * self.rate
            self.last = now
            self.tokens = min(self.tokens, self.rate)
            if self.tokens >= 1:
                self.tokens -= 1
                return
            await asyncio.sleep(1 / self.rate)

# limiter = AsyncRateLimiter(rate=10)
# await limiter.acquire()  # blocks if over rate`,
    explanation:
      "A token bucket refills at a fixed rate; each request consumes one token, and when the bucket is empty the coroutine sleeps just long enough for the next token to arrive — yielding cooperatively rather than busy-waiting.",
  },
  {
    id: "py-connection-pool",
    language: "python",
    title: "asyncpg connection pool — min/max size",
    tag: "structures",
    code: `import asyncio
import asyncpg

async def main():
    pool = await asyncpg.create_pool(
        dsn="postgresql://user:pass@localhost/mydb",
        min_size=5,
        max_size=20,
    )

    async with pool.acquire() as conn:
        row = await conn.fetchrow("SELECT version()")
        print(row["version"])

    await pool.close()

# asyncio.run(main())`,
    explanation:
      "asyncpg's pool keeps a minimum number of connections warm and expands up to max_size on demand; connections are returned to the pool automatically when the async with block exits.",
  },
  {
    id: "py-object-pool",
    language: "python",
    title: "Sync object pool using queue.Queue",
    tag: "structures",
    code: `import queue
from contextlib import contextmanager

class ObjectPool:
    def __init__(self, factory, size: int = 5):
        self._pool: queue.Queue = queue.Queue(maxsize=size)
        for _ in range(size):
            self._pool.put(factory())

    @contextmanager
    def acquire(self, timeout: float = 5.0):
        obj = self._pool.get(timeout=timeout)
        try:
            yield obj
        finally:
            self._pool.put(obj)   # always return to pool

class Expensive:
    def query(self) -> str:
        return "result"

pool = ObjectPool(Expensive, size=3)
with pool.acquire() as obj:
    print(obj.query())   # result`,
    explanation:
      "A queue-based object pool reuses expensive-to-create objects (DB connections, HTTP sessions); the context manager guarantees objects are returned even if an exception is raised.",
  },
  {
    id: "py-producer-consumer",
    language: "python",
    title: "Producer–consumer pattern with asyncio.Queue",
    tag: "structures",
    code: `import asyncio

async def producer(q: asyncio.Queue, n: int):
    for i in range(n):
        await asyncio.sleep(0.02)
        await q.put(i)
    for _ in range(2):          # one sentinel per consumer
        await q.put(None)

async def consumer(name: str, q: asyncio.Queue):
    while True:
        item = await q.get()
        if item is None:
            return
        print(f"{name} processed {item}")

async def main():
    q: asyncio.Queue[int | None] = asyncio.Queue(maxsize=4)
    await asyncio.gather(producer(q, 6), consumer("A", q), consumer("B", q))

asyncio.run(main())`,
    explanation:
      "Using asyncio.Queue as the channel between producer and consumer coroutines provides natural back-pressure (producer suspends when full) and clean shutdown via sentinel values.",
  },
  {
    id: "py-pub-sub-asyncio",
    language: "python",
    title: "In-process pub/sub — queue per subscriber",
    tag: "structures",
    code: `import asyncio
from collections import defaultdict

class PubSub:
    def __init__(self):
        self._subs: dict[str, list[asyncio.Queue]] = defaultdict(list)

    def subscribe(self, topic: str) -> asyncio.Queue:
        q: asyncio.Queue = asyncio.Queue()
        self._subs[topic].append(q)
        return q

    async def publish(self, topic: str, msg):
        for q in self._subs[topic]:
            await q.put(msg)

async def main():
    ps = PubSub()
    inbox = ps.subscribe("news")
    await ps.publish("news", "hello")
    print(await inbox.get())   # hello

asyncio.run(main())`,
    explanation:
      "Each subscriber gets its own asyncio.Queue; the broker fans out published messages by pushing a copy into every subscriber's queue, so they can consume at their own pace.",
  },
  {
    id: "py-event-bus",
    language: "python",
    title: "Simple async event bus — dict of async handlers",
    tag: "structures",
    code: `import asyncio
from collections import defaultdict
from typing import Callable, Awaitable

Handler = Callable[..., Awaitable[None]]

class EventBus:
    def __init__(self):
        self._handlers: dict[str, list[Handler]] = defaultdict(list)

    def on(self, event: str):
        def decorator(fn: Handler) -> Handler:
            self._handlers[event].append(fn)
            return fn
        return decorator

    async def emit(self, event: str, *args, **kwargs):
        for h in self._handlers[event]:
            await h(*args, **kwargs)

bus = EventBus()

@bus.on("login")
async def log_login(user: str):
    print(f"user logged in: {user}")

asyncio.run(bus.emit("login", "alice"))   # user logged in: alice`,
    explanation:
      "A dict mapping event names to lists of async handlers gives you a lightweight in-process event bus; emit awaits each handler in turn, keeping the execution order predictable.",
  },
  {
    id: "py-message-broker",
    language: "python",
    title: "Simple in-process message broker",
    tag: "structures",
    code: `import asyncio
from dataclasses import dataclass, field
from collections import defaultdict

@dataclass
class Broker:
    queues: dict[str, asyncio.Queue] = field(default_factory=lambda: defaultdict(asyncio.Queue))

    async def send(self, channel: str, message):
        await self.queues[channel].put(message)

    async def receive(self, channel: str):
        return await self.queues[channel].get()

async def main():
    broker = Broker()
    await broker.send("orders", {"id": 1, "item": "book"})
    msg = await broker.receive("orders")
    print(msg)   # {'id': 1, 'item': 'book'}

asyncio.run(main())`,
    explanation:
      "A named-channel broker separates message senders from receivers without a real message queue system — handy for in-process communication between async services during testing or prototyping.",
  },
  {
    id: "py-async-iter-class",
    language: "python",
    title: "Async iterator class — __aiter__ / __anext__",
    tag: "structures",
    code: `import asyncio

class CountUp:
    def __init__(self, stop: int):
        self.current = 0
        self.stop = stop

    def __aiter__(self):
        return self

    async def __anext__(self) -> int:
        if self.current >= self.stop:
            raise StopAsyncIteration
        await asyncio.sleep(0)
        val = self.current
        self.current += 1
        return val

async def main():
    async for n in CountUp(4):
        print(n)   # 0  1  2  3

asyncio.run(main())`,
    explanation:
      "Implementing __aiter__ (returns self) and __anext__ (returns next value or raises StopAsyncIteration) lets any class participate in async for loops with full cooperative scheduling at each step.",
  },
  {
    id: "py-async-cm-class",
    language: "python",
    title: "Async context manager class — __aenter__ / __aexit__",
    tag: "structures",
    code: `import asyncio

class ManagedConn:
    async def __aenter__(self) -> "ManagedConn":
        await asyncio.sleep(0.01)   # simulate async open
        print("connection opened")
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await asyncio.sleep(0.01)   # simulate async close
        print("connection closed")
        return False   # don't suppress exceptions

    async def query(self, sql: str) -> str:
        return f"result of: {sql}"

async def main():
    async with ManagedConn() as conn:
        print(await conn.query("SELECT 1"))

asyncio.run(main())`,
    explanation:
      "Defining __aenter__ and __aexit__ as async methods lets a class participate in async with blocks, enabling real async setup (acquiring connections, locks) and teardown (flushing buffers, releasing resources).",
  },
  // ── caveats ───────────────────────────────────────────────────────────────
  {
    id: "py-forget-await",
    language: "python",
    title: "Forgetting await — coroutine object, not result",
    tag: "caveats",
    code: `import asyncio

async def get_value() -> int:
    await asyncio.sleep(0)
    return 42

async def main():
    # BAD: missing await
    result = get_value()        # <coroutine object get_value at 0x...>
    print(type(result))         # <class 'coroutine'>
    print(result)               # coroutine warning + RuntimeWarning

    # GOOD: await it
    result = await get_value()
    print(result)               # 42

asyncio.run(main())`,
    explanation:
      "Calling an async function without await gives you a coroutine object, not the return value — Python will also emit a RuntimeWarning: coroutine was never awaited if it's garbage-collected without running.",
  },
  {
    id: "py-blocking-in-async",
    language: "python",
    title: "Blocking I/O in async — stalls the entire event loop",
    tag: "caveats",
    code: `import asyncio, time, requests

async def bad():
    # THIS blocks every other coroutine while the HTTP call is in progress
    resp = requests.get("https://httpbin.org/delay/1")   # blocking!
    return resp.status_code

async def good():
    # Use a non-blocking async client instead
    import httpx
    async with httpx.AsyncClient() as client:
        resp = await client.get("https://httpbin.org/delay/1")
    return resp.status_code`,
    explanation:
      "Any synchronous blocking call (requests, time.sleep, open()) inside an async function freezes the event loop for all other coroutines during that call — switch to async alternatives or use run_in_executor.",
  },
  {
    id: "py-create-task-gc",
    language: "python",
    title: "Unrooted task — may be garbage collected mid-execution",
    tag: "caveats",
    code: `import asyncio

_background_tasks: set = set()   # keep strong references here

async def background():
    await asyncio.sleep(0.1)
    print("background done")

async def main_bad():
    asyncio.create_task(background())   # no reference — may be GC'd
    await asyncio.sleep(0.2)

async def main_good():
    t = asyncio.create_task(background())
    _background_tasks.add(t)
    t.add_done_callback(_background_tasks.discard)
    await asyncio.sleep(0.2)

asyncio.run(main_good())`,
    explanation:
      "The event loop holds only a weak reference to tasks; if you don't keep a strong reference yourself, the garbage collector can destroy the task before it finishes — the recommended fix is a module-level set.",
  },
  {
    id: "py-gather-cancel",
    language: "python",
    title: "Cancelling gather — all child tasks are cancelled",
    tag: "caveats",
    code: `import asyncio

async def child(name: str, delay: float):
    try:
        await asyncio.sleep(delay)
        print(f"{name} finished")
    except asyncio.CancelledError:
        print(f"{name} was cancelled")
        raise

async def main():
    g = asyncio.gather(child("A", 0.1), child("B", 0.5))
    outer = asyncio.create_task(g)
    await asyncio.sleep(0.05)
    outer.cancel()      # cancels the gather AND both children
    try:
        await outer
    except asyncio.CancelledError:
        pass

asyncio.run(main())`,
    explanation:
      "Cancelling the task returned by asyncio.gather() propagates cancellation to every child coroutine — if you want to cancel only some children, manage the Tasks individually instead.",
  },
  {
    id: "py-timeout-cancel",
    language: "python",
    title: "asyncio.timeout() — raises TimeoutError in Python 3.11+",
    tag: "caveats",
    code: `import asyncio

async def slow():
    await asyncio.sleep(10)

async def main():
    try:
        async with asyncio.timeout(0.1):   # Python 3.11+
            await slow()
    except TimeoutError:
        # TimeoutError, NOT CancelledError (unlike older asyncio.wait_for)
        print("timed out")

asyncio.run(main())`,
    explanation:
      "Python 3.11 introduced asyncio.timeout() as a context manager that raises TimeoutError (not CancelledError) on deadline, making timeout handling more explicit and composable than the older asyncio.wait_for().",
  },
  {
    id: "py-task-exception-ignored",
    language: "python",
    title: "Ignored task exception — logged as RuntimeWarning",
    tag: "caveats",
    code: `import asyncio
import logging

logging.basicConfig(level=logging.WARNING)

async def buggy():
    await asyncio.sleep(0.01)
    raise ValueError("something went wrong")

async def main():
    t = asyncio.create_task(buggy())
    await asyncio.sleep(0.1)
    # t.result() never called — Python logs:
    # Task exception was never retrieved: ValueError: something went wrong
    del t

asyncio.run(main())`,
    explanation:
      "If a Task raises an exception and you never call task.result() or await the task, Python logs a warning when the Task is garbage-collected — always retrieve or handle task exceptions explicitly.",
  },
  {
    id: "py-event-loop-not-running",
    language: "python",
    title: "get_event_loop() in a thread — creates a new loop",
    tag: "caveats",
    code: `import asyncio, threading

def in_thread():
    # BAD: creates (or may create) a new event loop, not the main one
    loop = asyncio.get_event_loop()
    print("new loop:", id(loop))

def in_thread_good():
    try:
        loop = asyncio.get_running_loop()   # raises if not running
    except RuntimeError:
        print("no running loop in this thread — expected")

t = threading.Thread(target=in_thread_good)
t.start()
t.join()`,
    explanation:
      "asyncio.get_event_loop() may silently create a brand-new event loop when called from a thread that has no running loop; prefer asyncio.get_running_loop() which raises RuntimeError instead of creating a surprise loop.",
  },
  {
    id: "py-asyncio-run-twice",
    language: "python",
    title: "asyncio.run() from a running loop — RuntimeError",
    tag: "caveats",
    code: `import asyncio

async def inner():
    return 42

async def outer():
    # BAD: asyncio.run() cannot be called from within a running loop
    try:
        result = asyncio.run(inner())   # RuntimeError!
    except RuntimeError as e:
        print("error:", e)
    # GOOD: just await directly
    result = await inner()
    return result

asyncio.run(outer())`,
    explanation:
      "asyncio.run() creates a new event loop and runs it — calling it from inside an already-running loop raises RuntimeError; inside async code just use await or create_task instead.",
  },
  {
    id: "py-sync-in-async",
    language: "python",
    title: "time.sleep() in async — blocks the event loop",
    tag: "caveats",
    code: `import asyncio, time

async def bad_sleep():
    time.sleep(1)        # blocks entire event loop for 1 second!
    print("woke up (bad)")

async def good_sleep():
    await asyncio.sleep(1)   # yields to event loop; other tasks run
    print("woke up (good)")

# During bad_sleep(), all other coroutines are frozen.
# During good_sleep(), the loop serves other tasks.`,
    explanation:
      "time.sleep() is a blocking OS call — while it runs, the event loop cannot service any other coroutine; always use await asyncio.sleep() which cooperatively yields for the specified duration.",
  },
  {
    id: "py-thread-in-async",
    language: "python",
    title: "Thread + asyncio — use run_coroutine_threadsafe()",
    tag: "caveats",
    code: `import asyncio, threading

async def async_task():
    await asyncio.sleep(0.05)
    return "done from async"

def thread_fn(loop: asyncio.AbstractEventLoop):
    # schedule a coroutine onto the running loop from a thread
    future = asyncio.run_coroutine_threadsafe(async_task(), loop)
    print(future.result(timeout=2))   # done from async

async def main():
    loop = asyncio.get_running_loop()
    t = threading.Thread(target=thread_fn, args=(loop,))
    t.start()
    t.join()

asyncio.run(main())`,
    explanation:
      "You cannot call await or asyncio functions directly from a non-async thread; use asyncio.run_coroutine_threadsafe() to schedule a coroutine from a thread onto an already-running event loop safely.",
  },
  {
    id: "py-close-not-awaited",
    language: "python",
    title: "Async generator not exhausted — GeneratorExit on GC",
    tag: "caveats",
    code: `import asyncio

async def leaky_gen():
    try:
        for i in range(100):
            await asyncio.sleep(0)
            yield i
    except GeneratorExit:
        print("generator was closed prematurely")
        # perform cleanup here

async def main():
    gen = leaky_gen()
    val = await gen.__anext__()   # consume just one item
    print(val)                    # 0
    await gen.aclose()            # explicitly close — always do this

asyncio.run(main())`,
    explanation:
      "If you don't exhaust or explicitly aclose() an async generator, Python will eventually inject GeneratorExit into it during garbage collection — always call aclose() to ensure teardown code in finally blocks runs promptly.",
  },
  {
    id: "py-async-gen-finalize",
    language: "python",
    title: "Async generator aclose() — must be awaited",
    tag: "caveats",
    code: `import asyncio

async def counted():
    try:
        for i in range(10):
            await asyncio.sleep(0)
            yield i
    finally:
        print("cleanup in finally")   # runs when aclose() is awaited

async def main():
    gen = counted()
    print(await gen.__anext__())   # 0
    print(await gen.__anext__())   # 1
    await gen.aclose()             # triggers finally block
    # "cleanup in finally" is printed here

asyncio.run(main())`,
    explanation:
      "aclose() must be awaited — calling it without await schedules the coroutine but doesn't run it, meaning the finally block may not execute and resources may leak until the GC eventually collects the generator.",
  },
  {
    id: "py-contextvars-inherit",
    language: "python",
    title: "Child tasks inherit context — mutations don't propagate back",
    tag: "caveats",
    code: `import asyncio
from contextvars import ContextVar

user: ContextVar[str] = ContextVar("user", default="anon")

async def child():
    user.set("child-set")        # only visible inside this task's context
    print("child sees:", user.get())   # child sees: child-set

async def main():
    user.set("parent")
    t = asyncio.create_task(child())
    await t
    print("parent sees:", user.get())  # parent sees: parent  (unchanged)

asyncio.run(main())`,
    explanation:
      "Each Task starts with a copy of the parent's context; changes a child task makes to ContextVars are isolated to that task's copy — the parent's context is never mutated, which prevents accidental cross-task contamination.",
  },
  {
    id: "py-task-result-exception",
    language: "python",
    title: "task.result() re-raises stored exception",
    tag: "caveats",
    code: `import asyncio

async def failing():
    await asyncio.sleep(0)
    raise RuntimeError("boom")

async def main():
    t = asyncio.create_task(failing())
    try:
        await t
    except RuntimeError:
        pass   # already caught by await

    # Calling .result() on a failed task re-raises the exception
    try:
        t.result()
    except RuntimeError as e:
        print("re-raised:", e)   # re-raised: boom

asyncio.run(main())`,
    explanation:
      "task.result() raises the stored exception every time it's called on a failed Task — this means you can check the outcome later, but you need to be prepared to catch the exception wherever you call result().",
  },
  // ── types ─────────────────────────────────────────────────────────────────
  {
    id: "py-coroutine-type",
    language: "python",
    title: "Coroutine[YieldType, SendType, ReturnType] annotation",
    tag: "types",
    code: `from typing import Coroutine
import asyncio

# A typical async function: yields nothing, sends nothing, returns int
def make_coro() -> Coroutine[None, None, int]:
    async def _inner() -> int:
        await asyncio.sleep(0)
        return 42
    return _inner()

coro: Coroutine[None, None, int] = make_coro()
result = asyncio.run(coro)
print(result)   # 42`,
    explanation:
      "The full Coroutine[Y, S, R] type spells out what a coroutine yields, what can be sent into it, and what it returns — in practice you usually just see Coroutine[None, None, ReturnType] for ordinary async functions.",
  },
  {
    id: "py-awaitable-protocol",
    language: "python",
    title: "Awaitable[T] — anything with __await__",
    tag: "types",
    code: `from typing import Awaitable
import asyncio

async def double(x: int) -> int:
    return x * 2

def run_awaitable(aw: Awaitable[int]) -> int:
    return asyncio.run(aw)   # type: ignore[arg-type]

coro = double(5)
print(run_awaitable(coro))   # 10

# asyncio.Future is also Awaitable[T]
async def with_future():
    loop = asyncio.get_running_loop()
    fut: asyncio.Future[int] = loop.create_future()
    fut.set_result(99)
    val: int = await fut   # fut is Awaitable[int]
    print(val)   # 99`,
    explanation:
      "Awaitable[T] is the broadest async type — it covers coroutines, Tasks, and Futures, all of which implement __await__; use it as a function parameter type when you don't care which kind of awaitable you receive.",
  },
  {
    id: "py-asyncgenerator-type",
    language: "python",
    title: "AsyncGenerator[YieldType, SendType] annotation",
    tag: "types",
    code: `from typing import AsyncGenerator
import asyncio

async def ticker(n: int) -> AsyncGenerator[int, None]:
    for i in range(n):
        await asyncio.sleep(0)
        yield i

async def main():
    gen: AsyncGenerator[int, None] = ticker(3)
    async for v in gen:
        print(v)   # 0  1  2

asyncio.run(main())`,
    explanation:
      "AsyncGenerator[YieldType, SendType] types an async generator; the second parameter is None for simple generators that don't use send() — contrast with AsyncIterator[T] which only types the consumed side.",
  },
  {
    id: "py-async-iterator-type",
    language: "python",
    title: "AsyncIterator[T] and AsyncIterable[T] protocols",
    tag: "types",
    code: `from typing import AsyncIterator, AsyncIterable
import asyncio

async def nums(n: int) -> AsyncIterator[int]:
    for i in range(n):
        await asyncio.sleep(0)
        yield i

async def consume(src: AsyncIterable[int]) -> list[int]:
    return [x async for x in src]

async def main():
    result = await consume(nums(4))
    print(result)   # [0, 1, 2, 3]

asyncio.run(main())`,
    explanation:
      "AsyncIterable[T] requires only __aiter__, while AsyncIterator[T] additionally requires __anext__ — use AsyncIterable when you just need something you can loop over, AsyncIterator when you drive it manually.",
  },
  {
    id: "py-async-context-type",
    language: "python",
    title: "AsyncContextManager[T] — AbstractAsyncContextManager",
    tag: "types",
    code: `from typing import AsyncContextManager
from contextlib import asynccontextmanager
import asyncio

@asynccontextmanager
async def open_db() -> AsyncContextManager[str]:
    await asyncio.sleep(0)
    yield "db-handle"
    await asyncio.sleep(0)

async def use(cm: AsyncContextManager[str]):
    async with cm as handle:
        print(handle)   # db-handle

asyncio.run(use(open_db()))`,
    explanation:
      "AsyncContextManager[T] types objects that support async with — it's equivalent to AbstractAsyncContextManager[T] from contextlib and is fulfilled by any class or decorated function with __aenter__/__aexit__.",
  },
  {
    id: "py-task-type",
    language: "python",
    title: "asyncio.Task[T] — scheduled coroutine wrapper",
    tag: "types",
    code: `import asyncio

async def compute() -> float:
    await asyncio.sleep(0)
    return 3.14

async def main():
    task: asyncio.Task[float] = asyncio.create_task(compute())
    result: float = await task
    print(result)             # 3.14
    print(task.done())        # True
    print(task.result())      # 3.14  (cached)

asyncio.run(main())`,
    explanation:
      "asyncio.Task[T] wraps a coroutine and schedules it on the event loop; it is itself a Future[T] so you can await it, inspect its state, cancel it, or attach done callbacks.",
  },
  {
    id: "py-future-type",
    language: "python",
    title: "asyncio.Future[T] — low-level async primitive",
    tag: "types",
    code: `import asyncio

async def main():
    loop = asyncio.get_running_loop()
    fut: asyncio.Future[str] = loop.create_future()

    async def setter():
        await asyncio.sleep(0.05)
        fut.set_result("resolved!")

    asyncio.create_task(setter())
    value: str = await fut
    print(value)   # resolved!

asyncio.run(main())`,
    explanation:
      "asyncio.Future[T] is the low-level primitive that Task is built on — you manually call set_result() or set_exception() to resolve it; prefer Task for coroutine-based work and Future only when you need manual resolution.",
  },
  {
    id: "py-event-loop-type",
    language: "python",
    title: "asyncio.AbstractEventLoop — the loop type",
    tag: "types",
    code: `import asyncio

async def main():
    loop: asyncio.AbstractEventLoop = asyncio.get_running_loop()
    print(type(loop).__name__)         # _UnixSelectorEventLoop (or similar)
    print(loop.is_running())           # True
    print(loop.time())                 # monotonic clock value

asyncio.run(main())`,
    explanation:
      "asyncio.AbstractEventLoop is the type returned by asyncio.get_running_loop(); annotating with this abstract type keeps your code portable across different loop implementations (selector, IOCP, uvloop).",
  },
  {
    id: "py-transport-protocol-types",
    language: "python",
    title: "BaseTransport / BaseProtocol — low-level networking types",
    tag: "types",
    code: `import asyncio

class EchoProtocol(asyncio.Protocol):
    def connection_made(self, transport: asyncio.BaseTransport):
        self.transport = transport

    def data_received(self, data: bytes):
        print("got:", data.decode())
        self.transport.write(data)   # echo back

    def connection_lost(self, exc):
        print("connection closed")

# To use:
# loop.create_connection(EchoProtocol, '127.0.0.1', 8080)`,
    explanation:
      "asyncio.Protocol and asyncio.BaseTransport form the low-level callback-based networking API — Protocol handles events (connection_made, data_received), Transport handles actual I/O (write, close).",
  },
  {
    id: "py-stream-reader-writer",
    language: "python",
    title: "asyncio.StreamReader / StreamWriter — high-level TCP",
    tag: "types",
    code: `import asyncio

async def handle_client(reader: asyncio.StreamReader, writer: asyncio.StreamWriter):
    data = await reader.read(1024)
    addr = writer.get_extra_info("peername")
    print(f"from {addr}: {data.decode()}")
    writer.write(b"OK\n")
    await writer.drain()
    writer.close()
    await writer.wait_closed()

# server = await asyncio.start_server(handle_client, "127.0.0.1", 8888)`,
    explanation:
      "StreamReader and StreamWriter provide a coroutine-friendly stream API over TCP — reader.read/readline/readexactly handle buffering, while writer.write + drain handles flow-controlled sending.",
  },
  {
    id: "py-subprocess-protocol",
    language: "python",
    title: "asyncio.SubprocessProtocol — async subprocess I/O",
    tag: "types",
    code: `import asyncio

class EchoSubprocess(asyncio.SubprocessProtocol):
    def pipe_data_received(self, fd: int, data: bytes):
        if fd == 1:   # stdout
            print("stdout:", data.decode().strip())

    def process_exited(self):
        print("subprocess exited")

async def main():
    loop = asyncio.get_running_loop()
    transport, _ = await loop.subprocess_exec(
        EchoSubprocess, "echo", "hello asyncio"
    )
    await asyncio.sleep(0.1)
    transport.close()

asyncio.run(main())`,
    explanation:
      "asyncio.SubprocessProtocol receives callbacks when subprocess stdin/stdout/stderr have data or when the process exits — it's the low-level API; use asyncio.create_subprocess_exec for the simpler high-level version.",
  },
  {
    id: "py-typing-asynciterator",
    language: "python",
    title: "AsyncIterator[T] vs AsyncGenerator[T, None]",
    tag: "types",
    code: `from typing import AsyncIterator, AsyncGenerator
import asyncio

# AsyncGenerator[T, None] — produced by 'async def ... yield'
async def gen_style() -> AsyncGenerator[int, None]:
    yield 1
    yield 2

# AsyncIterator[T] — broader; any object with __aiter__ / __anext__
async def iter_style() -> AsyncIterator[int]:
    yield 1   # async generators also satisfy AsyncIterator

async def main():
    async for v in gen_style():
        print(v)   # 1  2

asyncio.run(main())`,
    explanation:
      "AsyncGenerator[T, None] is the precise type for async generator functions; AsyncIterator[T] is the structural protocol — both work in async for, but use AsyncGenerator when you need to expose send() or throw().",
  },
  {
    id: "py-typing-coroutine",
    language: "python",
    title: "Coroutine vs Awaitable — specificity matters",
    tag: "types",
    code: `from typing import Awaitable, Coroutine
import asyncio

# Awaitable[int]: can be awaited, result is int
def accept_any_awaitable(aw: Awaitable[int]) -> None:
    pass

# Coroutine[None, None, int]: a coroutine specifically
def accept_only_coroutine(c: Coroutine[None, None, int]) -> None:
    pass

async def sample() -> int:
    return 1

coro = sample()                # Coroutine — satisfies both
accept_any_awaitable(coro)     # ok
accept_only_coroutine(coro)    # ok
asyncio.run(sample())`,
    explanation:
      "Awaitable[T] accepts any object that supports await (coroutines, Tasks, Futures, custom __await__), while Coroutine[Y,S,R] is more specific; use Awaitable in public APIs for maximum flexibility.",
  },
  {
    id: "py-async-iter-protocol",
    language: "python",
    title: "__aiter__ / __anext__ — async iterator protocol",
    tag: "types",
    code: `import asyncio

class Countdown:
    def __init__(self, n: int):
        self.n = n

    def __aiter__(self):
        return self          # protocol: return self (or a new iterator)

    async def __anext__(self) -> int:
        if self.n <= 0:
            raise StopAsyncIteration   # signals end of iteration
        self.n -= 1
        await asyncio.sleep(0)
        return self.n + 1

async def main():
    async for v in Countdown(3):
        print(v)   # 3  2  1

asyncio.run(main())`,
    explanation:
      "__aiter__ must return an object with __anext__; typically it returns self so the object is its own iterator — StopAsyncIteration signals the end and is automatically converted to a loop termination by async for.",
  },
  // ── families ──────────────────────────────────────────────────────────────
  {
    id: "py-asyncio-vs-trio",
    language: "python",
    title: "asyncio vs trio — structured concurrency philosophy",
    tag: "families",
    code: `# asyncio (stdlib) — flexible, unstructured by default
import asyncio

async def asyncio_demo():
    t = asyncio.create_task(asyncio.sleep(0.1))   # fire-and-forget possible
    await t

# trio (third-party) — strict nursery-based structured concurrency
# import trio
#
# async def trio_demo():
#     async with trio.open_nursery() as nursery:
#         nursery.start_soon(trio.sleep, 0.1)
#     # all tasks in nursery finish before here

# Key difference: trio makes "escape" from a scope impossible by design`,
    explanation:
      "asyncio lets you fire tasks with create_task() and forget them; trio's nursery model enforces that every spawned task is joined before the nursery block exits, eliminating an entire class of lifetime bugs.",
  },
  {
    id: "py-asyncio-vs-threading",
    language: "python",
    title: "asyncio vs threading — cooperative vs preemptive",
    tag: "families",
    code: `# asyncio: cooperative, single OS thread, switches at await
import asyncio

async def asyncio_worker(n: int):
    await asyncio.sleep(0)   # explicit yield point
    return n * 2

# threading: preemptive, multiple OS threads, GIL limits parallelism
import threading

def thread_worker(n: int, results: list):
    results.append(n * 2)   # no explicit yield; OS can preempt anytime

# asyncio: best for I/O-bound work with many connections
# threading: better for blocking code you can't convert to async`,
    explanation:
      "asyncio coroutines switch only at explicit await points (cooperative), making race conditions easier to reason about; threads can switch anywhere (preemptive), requiring locks for shared state — choose asyncio for I/O-bound, threads for blocking legacy code.",
  },
  {
    id: "py-async-vs-sync-http",
    language: "python",
    title: "httpx.AsyncClient vs httpx.Client — same API, different semantics",
    tag: "families",
    code: `import httpx, asyncio

# Sync client — blocks the calling thread
def sync_fetch(url: str) -> dict:
    with httpx.Client() as client:
        return client.get(url).json()

# Async client — yields to event loop while waiting for response
async def async_fetch(url: str) -> dict:
    async with httpx.AsyncClient() as client:
        resp = await client.get(url)
        return resp.json()

# In an async app, always use AsyncClient; Client will block the loop.
# asyncio.run(async_fetch("https://httpbin.org/json"))`,
    explanation:
      "httpx provides both a sync and an async client with an identical API; in async code always use AsyncClient — using the sync Client inside an async function blocks the entire event loop.",
  },
  {
    id: "py-gather-vs-taskgroup",
    language: "python",
    title: "asyncio.gather() vs asyncio.TaskGroup — structured vs not",
    tag: "families",
    code: `import asyncio

# gather — unstructured; tasks can outlive the call site
async def with_gather():
    results = await asyncio.gather(
        asyncio.sleep(0.1),
        asyncio.sleep(0.1),
    )
    return results

# TaskGroup (3.11+) — structured; all tasks scoped to the block
async def with_task_group():
    async with asyncio.TaskGroup() as tg:
        t1 = tg.create_task(asyncio.sleep(0.1))
        t2 = tg.create_task(asyncio.sleep(0.1))
    # both tasks are done here; any exception propagates as ExceptionGroup

asyncio.run(with_task_group())`,
    explanation:
      "asyncio.TaskGroup (3.11+) enforces that all tasks finish before the block exits and collects multiple exceptions into an ExceptionGroup — gather() is simpler but lacks these lifetime and error-aggregation guarantees.",
  },
  {
    id: "py-shield-vs-timeout",
    language: "python",
    title: "asyncio.shield() vs asyncio.timeout() — protection vs deadline",
    tag: "families",
    code: `import asyncio

async def critical():
    await asyncio.sleep(0.2)
    return "done"

# shield: protect inner from outer cancellation
async def demo_shield():
    t = asyncio.create_task(asyncio.shield(critical()))
    t.cancel()
    try: await t
    except asyncio.CancelledError: pass
    await asyncio.sleep(0.3)   # critical() still runs in background

# timeout: cancel if deadline exceeded (Python 3.11+)
async def demo_timeout():
    try:
        async with asyncio.timeout(0.1):
            await critical()   # takes 0.2s → TimeoutError
    except TimeoutError:
        print("timed out")

asyncio.run(demo_timeout())`,
    explanation:
      "asyncio.shield() protects a coroutine from being cancelled by its caller, while asyncio.timeout() imposes a maximum duration and cancels the wrapped code if it takes too long — they solve opposite problems.",
  },
  {
    id: "py-queue-async-thread",
    language: "python",
    title: "asyncio.Queue vs queue.Queue — don't mix them",
    tag: "families",
    code: `import asyncio, queue, threading

# asyncio.Queue — for coroutine ↔ coroutine communication
async_q: asyncio.Queue[int] = asyncio.Queue()

# queue.Queue — for thread ↔ thread communication
thread_q: queue.Queue[int] = queue.Queue()

# Mixing them causes deadlocks or runtime errors:
# - asyncio.Queue.put() from a thread → wrong; use put_nowait or run_coroutine_threadsafe
# - queue.Queue.get() from a coroutine → blocks the event loop

# Safe cross-boundary: use asyncio.run_coroutine_threadsafe or loop.call_soon_threadsafe`,
    explanation:
      "asyncio.Queue is not thread-safe and queue.Queue is not coroutine-safe — pick the right one for your boundary, and use asyncio.run_coroutine_threadsafe or loop.call_soon_threadsafe to cross the thread/async boundary safely.",
  },
  {
    id: "py-aiofiles-vs-open",
    language: "python",
    title: "aiofiles.open() vs open() — async vs blocking",
    tag: "families",
    code: `import asyncio, aiofiles

# open() — synchronous; blocks the event loop while reading
def sync_read(path: str) -> str:
    with open(path) as f:
        return f.read()   # blocks until done

# aiofiles.open() — runs I/O in a thread pool; safe in async code
async def async_read(path: str) -> str:
    async with aiofiles.open(path) as f:
        return await f.read()

async def main():
    text = await async_read("/etc/hostname")
    print(text.strip())

asyncio.run(main())`,
    explanation:
      "Built-in open() blocks the OS thread synchronously; aiofiles.open() delegates to a thread pool and returns an awaitable, so the event loop remains responsive to other coroutines during disk I/O.",
  },
  {
    id: "py-httpx-async-vs-sync",
    language: "python",
    title: "httpx.AsyncClient vs httpx.Client — async app choice",
    tag: "families",
    code: `import httpx, asyncio

# In a FastAPI / async context — use AsyncClient
async def fetch_async(url: str) -> int:
    async with httpx.AsyncClient(timeout=5) as client:
        r = await client.get(url)
        return r.status_code

# In a Django / sync context — use Client
def fetch_sync(url: str) -> int:
    with httpx.Client(timeout=5) as client:
        return client.get(url).status_code

# Never use Client inside a running event loop — it will block it`,
    explanation:
      "httpx deliberately offers both flavours with the same interface; AsyncClient is event-loop-friendly (uses async sockets), Client is for sync frameworks — mixing them causes either blocking or RuntimeError.",
  },
  {
    id: "py-contextvars-vs-threadlocal",
    language: "python",
    title: "ContextVar vs threading.local — per-task vs per-thread",
    tag: "families",
    code: `import threading, asyncio
from contextvars import ContextVar

# threading.local — one slot per OS thread
tl = threading.local()
tl.user = "thread-user"   # isolated per thread

# ContextVar — one slot per async task (or copy_context run)
cv: ContextVar[str] = ContextVar("user", default="anon")

async def main():
    cv.set("task-user")
    print(cv.get())   # task-user  — isolated per task
    # If 10 tasks run concurrently on the same thread, each has its own cv value
    # threading.local would give them all the SAME value

asyncio.run(main())`,
    explanation:
      "threading.local gives each OS thread its own value; ContextVar gives each async Task (or context copy) its own value — in an async program many tasks share one thread, so ContextVar is the correct tool for request-scoped state.",
  },
  {
    id: "py-asyncio-lock-vs-thread",
    language: "python",
    title: "asyncio.Lock vs threading.Lock — non-blocking vs blocking",
    tag: "families",
    code: `import asyncio, threading

# asyncio.Lock — suspends the coroutine (non-blocking for OS thread)
alock = asyncio.Lock()

async def async_section():
    async with alock:
        await asyncio.sleep(0)   # yields; other coros can run

# threading.Lock — blocks the OS thread entirely while waiting
tlock = threading.Lock()

def thread_section():
    with tlock:
        pass   # OS thread blocked; no other code on this thread runs

# NEVER use threading.Lock inside async code — it blocks the event loop`,
    explanation:
      "asyncio.Lock suspends only the waiting coroutine and lets the event loop continue; threading.Lock blocks the entire OS thread — using a threading.Lock inside async code defeats the purpose of cooperative concurrency.",
  },
  {
    id: "py-asyncio-event-vs-condition",
    language: "python",
    title: "asyncio.Event vs asyncio.Condition — signal vs wait-notify",
    tag: "families",
    code: `import asyncio

# Event: set once, many waiters released together
event = asyncio.Event()

async def waiter_event():
    await event.wait()
    print("event fired")

async def fire_event():
    await asyncio.sleep(0.05)
    event.set()

# Condition: reusable, waiters check a predicate, notify() wakes one
cond = asyncio.Condition()
items = []

async def waiter_cond():
    async with cond:
        await cond.wait_for(lambda: len(items) > 0)
        print("got item:", items.pop())

asyncio.run(asyncio.gather(waiter_event(), fire_event()))`,
    explanation:
      "asyncio.Event is a simple one-shot gate: once set, all waiters are released and it stays set until cleared; asyncio.Condition is a reusable wait-notify mechanism where waiters re-check a predicate each time they're woken.",
  },
  {
    id: "py-async-gen-vs-sync-gen",
    language: "python",
    title: "Async generator vs sync generator — when to choose",
    tag: "families",
    code: `import asyncio

# Sync generator — fine when generation involves no I/O
def sync_range(n: int):
    for i in range(n):
        yield i

# Async generator — necessary when each step involves awaiting I/O
async def async_rows(n: int):
    for i in range(n):
        await asyncio.sleep(0)   # simulate DB fetch per row
        yield {"id": i}

async def main():
    # sync generator works fine in non-async for inside async fn
    for v in sync_range(3):
        print(v)                 # 0  1  2

    async for row in async_rows(2):
        print(row)               # {'id': 0}  {'id': 1}

asyncio.run(main())`,
    explanation:
      "Use a sync generator when producing values doesn't involve I/O — it's simpler and works inside both sync and async code; switch to async generator when each yield requires awaiting network or disk access.",
  },
  {
    id: "py-async-cm-vs-sync-cm",
    language: "python",
    title: "Async context manager vs sync — when async teardown is needed",
    tag: "families",
    code: `from contextlib import contextmanager, asynccontextmanager
import asyncio

@contextmanager
def sync_cm():
    print("sync enter")
    yield "sync"
    print("sync exit")   # can't await here

@asynccontextmanager
async def async_cm():
    print("async enter")
    await asyncio.sleep(0)   # real async setup
    yield "async"
    await asyncio.sleep(0)   # real async teardown
    print("async exit")

async def main():
    with sync_cm() as s:
        print(s)
    async with async_cm() as a:
        print(a)

asyncio.run(main())`,
    explanation:
      "Use a sync context manager when setup/teardown is purely synchronous; switch to async context manager (asynccontextmanager or class with __aenter__/__aexit__) when you need to await I/O like closing a connection or flushing a buffer.",
  },
  {
    id: "py-executor-vs-native-async",
    language: "python",
    title: "run_in_executor vs native async I/O — blocking vs non-blocking",
    tag: "families",
    code: `import asyncio, httpx, requests

# run_in_executor: run blocking code in a thread — works but wastes threads
async def via_executor(url: str) -> int:
    loop = asyncio.get_running_loop()
    resp = await loop.run_in_executor(None, requests.get, url)
    return resp.status_code

# Native async I/O: truly non-blocking — one event loop handles thousands
async def via_native(url: str) -> int:
    async with httpx.AsyncClient() as client:
        resp = await client.get(url)
        return resp.status_code

# Prefer native async; use executor only for legacy sync code you can't replace`,
    explanation:
      "run_in_executor delegates to a thread, so it still consumes an OS thread per call; native async I/O multiplexes thousands of concurrent operations on a single thread — use the executor only as a last resort for blocking legacy code.",
  },
  // ── classes ───────────────────────────────────────────────────────────────
  {
    id: "py-async-class-cm",
    language: "python",
    title: "Async context manager class — full __aenter__ / __aexit__",
    tag: "classes",
    code: `import asyncio

class DatabaseConnection:
    def __init__(self, dsn: str):
        self.dsn = dsn
        self._conn = None

    async def __aenter__(self) -> "DatabaseConnection":
        await asyncio.sleep(0.01)   # simulate connect
        self._conn = object()       # stand-in for real connection
        print(f"connected to {self.dsn}")
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await asyncio.sleep(0.01)   # simulate close
        self._conn = None
        print("connection closed")
        return False

async def main():
    async with DatabaseConnection("postgresql://localhost/test") as db:
        print("using connection:", db._conn is not None)

asyncio.run(main())`,
    explanation:
      "Implementing __aenter__ and __aexit__ as async methods lets the class manage resources that require I/O to acquire and release — the async with block ensures __aexit__ is always called even if an exception is raised inside.",
  },
  {
    id: "py-async-iterator-class",
    language: "python",
    title: "Async iterator class — paginated data source",
    tag: "classes",
    code: `import asyncio

class PagedResults:
    def __init__(self, total: int, page_size: int = 3):
        self.total = total
        self.page_size = page_size
        self.offset = 0

    def __aiter__(self):
        return self

    async def __anext__(self) -> list[int]:
        if self.offset >= self.total:
            raise StopAsyncIteration
        await asyncio.sleep(0.01)   # simulate async DB fetch
        batch = list(range(self.offset, min(self.offset + self.page_size, self.total)))
        self.offset += self.page_size
        return batch

async def main():
    async for page in PagedResults(8, page_size=3):
        print(page)   # [0,1,2]  [3,4,5]  [6,7]

asyncio.run(main())`,
    explanation:
      "Implementing __aiter__ (returns self) and __anext__ (awaits the next page, raises StopAsyncIteration when done) lets a class expose paginated I/O results as a natural async for loop.",
  },
  {
    id: "py-async-generator-class",
    language: "python",
    title: "Async generator as factory method",
    tag: "classes",
    code: `import asyncio

class EventStream:
    def __init__(self, source: list[str]):
        self.source = source

    async def events(self, delay: float = 0.01):
        """Async generator — yields events from the source."""
        for event in self.source:
            await asyncio.sleep(delay)
            yield event

async def main():
    stream = EventStream(["login", "view", "purchase", "logout"])
    async for event in stream.events():
        print(event)

asyncio.run(main())`,
    explanation:
      "An async generator method on a class acts as a factory for lazy I/O streams — callers iterate with async for, and the generator suspends cooperatively between yields so the event loop can handle other work.",
  },
  {
    id: "py-task-like-class",
    language: "python",
    title: "Awaitable class — __await__ delegates to a Future",
    tag: "classes",
    code: `import asyncio
from typing import Generator

class Deferred:
    """An awaitable that resolves when set_result() is called."""
    def __init__(self):
        self._future: asyncio.Future | None = None

    def _get_future(self) -> asyncio.Future:
        if self._future is None:
            self._future = asyncio.get_event_loop().create_future()
        return self._future

    def set_result(self, value):
        self._get_future().set_result(value)

    def __await__(self) -> Generator:
        return self._get_future().__await__()

async def main():
    d = Deferred()
    asyncio.get_event_loop().call_later(0.05, d.set_result, "done!")
    result = await d
    print(result)   # done!

asyncio.run(main())`,
    explanation:
      "Implementing __await__ as a generator that delegates to a Future's __await__ lets any class be awaited directly — this is how libraries expose custom async primitives without subclassing asyncio internals.",
  },
  {
    id: "py-asyncio-protocol-impl",
    language: "python",
    title: "asyncio.Protocol subclass — custom TCP protocol",
    tag: "classes",
    code: `import asyncio

class LineProtocol(asyncio.Protocol):
    def connection_made(self, transport: asyncio.Transport):
        self.transport = transport
        print("client connected")

    def data_received(self, data: bytes):
        message = data.decode().strip()
        print(f"received: {message!r}")
        self.transport.write(f"ECHO:{message}\n".encode())

    def connection_lost(self, exc: Exception | None):
        print("client disconnected")

# Usage:
# loop = asyncio.get_event_loop()
# server = await loop.create_server(LineProtocol, "127.0.0.1", 9000)`,
    explanation:
      "Subclassing asyncio.Protocol gives you callback-based TCP handling — connection_made, data_received, and connection_lost cover the full lifecycle; the transport object handles actual sending and closing.",
  },
  {
    id: "py-asyncio-stream-handler",
    language: "python",
    title: "TCP echo server with asyncio.start_server()",
    tag: "classes",
    code: `import asyncio

async def handle_echo(
    reader: asyncio.StreamReader,
    writer: asyncio.StreamWriter,
):
    addr = writer.get_extra_info("peername")
    print(f"connection from {addr}")
    while True:
        data = await reader.read(256)
        if not data:
            break
        writer.write(data)
        await writer.drain()
    writer.close()
    await writer.wait_closed()

async def main():
    server = await asyncio.start_server(handle_echo, "127.0.0.1", 8888)
    async with server:
        await server.serve_forever()

# asyncio.run(main())`,
    explanation:
      "asyncio.start_server() accepts incoming TCP connections and calls your handler coroutine with StreamReader/StreamWriter for each — it's the high-level alternative to Protocol that works well with async/await syntax.",
  },
  {
    id: "py-event-emitter-async",
    language: "python",
    title: "Async event emitter — register and emit async handlers",
    tag: "classes",
    code: `import asyncio
from collections import defaultdict
from typing import Callable, Awaitable, Any

class AsyncEmitter:
    def __init__(self):
        self._listeners: dict[str, list[Callable]] = defaultdict(list)

    def on(self, event: str, fn: Callable[..., Awaitable[Any]]):
        self._listeners[event].append(fn)

    def off(self, event: str, fn: Callable):
        self._listeners[event].remove(fn)

    async def emit(self, event: str, *args, **kwargs):
        await asyncio.gather(*[fn(*args, **kwargs) for fn in self._listeners[event]])

emitter = AsyncEmitter()

async def on_data(payload: str):
    print("received:", payload)

emitter.on("data", on_data)
asyncio.run(emitter.emit("data", "hello"))   # received: hello`,
    explanation:
      "An async event emitter runs all listeners for an event concurrently with asyncio.gather(), so a slow handler doesn't delay others — the on/off pattern mirrors Node.js EventEmitter but with proper async semantics.",
  },
  {
    id: "py-async-factory",
    language: "python",
    title: "Async factory — @classmethod async def create(cls)",
    tag: "classes",
    code: `import asyncio

class Connection:
    def __init__(self, host: str, port: int):
        self.host = host
        self.port = port
        self._socket = None   # set up in create()

    @classmethod
    async def create(cls, host: str, port: int) -> "Connection":
        self = cls(host, port)
        await asyncio.sleep(0.01)   # simulate async handshake
        self._socket = object()     # stand-in for real socket
        print(f"connected to {host}:{port}")
        return self

async def main():
    conn = await Connection.create("db.local", 5432)
    print(conn._socket is not None)   # True

asyncio.run(main())`,
    explanation:
      "Python __init__ cannot be async, so the async factory pattern uses a @classmethod named create() (or similar) that awaits all I/O-intensive setup before returning the fully-initialised instance.",
  },
  {
    id: "py-async-singleton",
    language: "python",
    title: "Async singleton — module-level lock prevents double-init",
    tag: "classes",
    code: `import asyncio

_instance = None
_lock = asyncio.Lock()

class AppConfig:
    def __init__(self, data: dict):
        self.data = data

async def get_config() -> AppConfig:
    global _instance
    if _instance is None:
        async with _lock:
            if _instance is None:   # double-checked locking
                await asyncio.sleep(0.01)   # simulate config fetch
                _instance = AppConfig({"env": "prod"})
    return _instance

async def main():
    c1, c2 = await asyncio.gather(get_config(), get_config())
    print(c1 is c2)   # True — same instance

asyncio.run(main())`,
    explanation:
      "The double-checked locking pattern with an asyncio.Lock ensures the expensive initialisation runs exactly once even when many coroutines request the singleton simultaneously during startup.",
  },
  {
    id: "py-async-resource",
    language: "python",
    title: "Async resource manager with cleanup on exit",
    tag: "classes",
    code: `import asyncio
from contextlib import asynccontextmanager

class ResourcePool:
    def __init__(self):
        self._items: list[str] = []
        self._closed = False

    async def acquire(self) -> str:
        await asyncio.sleep(0.01)
        item = f"resource-{len(self._items)}"
        self._items.append(item)
        return item

    async def close(self):
        self._closed = True
        self._items.clear()
        print("pool closed")

@asynccontextmanager
async def managed_pool():
    pool = ResourcePool()
    try:
        yield pool
    finally:
        await pool.close()

async def main():
    async with managed_pool() as pool:
        r = await pool.acquire()
        print(r)   # resource-0

asyncio.run(main())`,
    explanation:
      "Combining a resource class with an asynccontextmanager factory guarantees close() is always awaited when the block exits — even on exceptions — which is essential for releasing connections, file handles, and memory.",
  },
  {
    id: "py-service-class",
    language: "python",
    title: "Async service class — startup/shutdown lifecycle",
    tag: "classes",
    code: `import asyncio

class BackgroundService:
    def __init__(self, interval: float = 0.1):
        self.interval = interval
        self._task: asyncio.Task | None = None

    async def start(self):
        self._task = asyncio.create_task(self._run())
        print("service started")

    async def stop(self):
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        print("service stopped")

    async def _run(self):
        while True:
            await asyncio.sleep(self.interval)
            print("heartbeat")

async def main():
    svc = BackgroundService(interval=0.05)
    await svc.start()
    await asyncio.sleep(0.15)
    await svc.stop()

asyncio.run(main())`,
    explanation:
      "The start/stop lifecycle pattern lets async services be composed cleanly: start() creates a background task, stop() cancels it and awaits cancellation — ensuring no dangling tasks remain after shutdown.",
  },
  {
    id: "py-concurrent-class",
    language: "python",
    title: "Class managing a pool of async workers",
    tag: "classes",
    code: `import asyncio
from collections.abc import Callable, Awaitable

class WorkerPool:
    def __init__(self, size: int):
        self.size = size
        self._sem = asyncio.Semaphore(size)

    async def run(self, coro_fn: Callable[..., Awaitable], *args):
        async with self._sem:
            return await coro_fn(*args)

    async def map(self, coro_fn, items):
        return await asyncio.gather(*[self.run(coro_fn, item) for item in items])

async def fetch(item: int) -> str:
    await asyncio.sleep(0.05)
    return f"done-{item}"

async def main():
    pool = WorkerPool(size=3)
    results = await pool.map(fetch, range(7))
    print(results)

asyncio.run(main())`,
    explanation:
      "Encapsulating the Semaphore in a WorkerPool class gives you a reusable concurrency cap with a clean map() interface — at most size coroutines run the inner function simultaneously regardless of how many items are submitted.",
  },
  {
    id: "py-async-worker-pool",
    language: "python",
    title: "Async worker pool — N workers draining a shared queue",
    tag: "classes",
    code: `import asyncio

class AsyncWorkerPool:
    def __init__(self, num_workers: int = 4):
        self.queue: asyncio.Queue = asyncio.Queue()
        self._workers: list[asyncio.Task] = []
        self.num_workers = num_workers

    async def start(self):
        self._workers = [
            asyncio.create_task(self._worker(i)) for i in range(self.num_workers)
        ]

    async def _worker(self, wid: int):
        while True:
            item = await self.queue.get()
            if item is None:
                return
            await asyncio.sleep(0.02)   # simulate work
            print(f"worker-{wid} processed {item}")
            self.queue.task_done()

    async def submit(self, item):
        await self.queue.put(item)

    async def stop(self):
        for _ in self._workers:
            await self.queue.put(None)   # one sentinel per worker
        await asyncio.gather(*self._workers)

async def main():
    pool = AsyncWorkerPool(3)
    await pool.start()
    for i in range(6):
        await pool.submit(i)
    await pool.stop()

asyncio.run(main())`,
    explanation:
      "The worker pool pattern decouples task submission from execution: N worker coroutines drain a shared queue concurrently, and sending one None sentinel per worker provides clean shutdown without race conditions.",
  },
  {
    id: "py-async-pipeline",
    language: "python",
    title: "Async pipeline — producer → transformer → consumer",
    tag: "classes",
    code: `import asyncio

async def producer(out: asyncio.Queue, n: int):
    for i in range(n):
        await asyncio.sleep(0.01)
        await out.put(i)
    await out.put(None)

async def transformer(inp: asyncio.Queue, out: asyncio.Queue):
    while True:
        item = await inp.get()
        if item is None:
            await out.put(None)
            return
        await out.put(item * item)   # square it

async def consumer(inp: asyncio.Queue):
    while True:
        item = await inp.get()
        if item is None:
            return
        print(item, end=" ")   # 0 1 4 9 16

async def main():
    q1: asyncio.Queue = asyncio.Queue(4)
    q2: asyncio.Queue = asyncio.Queue(4)
    await asyncio.gather(producer(q1, 5), transformer(q1, q2), consumer(q2))

asyncio.run(main())`,
    explanation:
      "Connecting stages with asyncio.Queues creates a backpressured pipeline: each stage runs concurrently, a bounded queue limits memory usage, and None sentinels propagate shutdown cleanly from producer to consumer.",
  },
  {
    id: "py-structured-concurrency",
    language: "python",
    title: "TaskGroup — structured concurrency in Python 3.11+",
    tag: "classes",
    code: `import asyncio

async def fetch(name: str, delay: float) -> str:
    await asyncio.sleep(delay)
    return f"result from {name}"

async def main():
    results = []
    async with asyncio.TaskGroup() as tg:
        t1 = tg.create_task(fetch("api-1", 0.1))
        t2 = tg.create_task(fetch("api-2", 0.05))
        t3 = tg.create_task(fetch("api-3", 0.08))
    # All tasks guaranteed done here
    results = [t1.result(), t2.result(), t3.result()]
    print(results)

asyncio.run(main())`,
    explanation:
      "asyncio.TaskGroup (Python 3.11+) guarantees all child tasks complete before the block exits; if any task raises, the group cancels the rest and surfaces all exceptions as an ExceptionGroup — this is structured concurrency.",
  },
  {
    id: "py-async-timeout-class",
    language: "python",
    title: "Reusable async timeout context manager class",
    tag: "classes",
    code: `import asyncio
from typing import Optional

class AsyncTimeout:
    def __init__(self, seconds: float, message: str = "operation timed out"):
        self.seconds = seconds
        self.message = message
        self._deadline_handle: Optional[asyncio.TimerHandle] = None

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        return False

async def with_timeout(seconds: float, coro):
    """Convenience wrapper using asyncio.timeout (3.11+)."""
    try:
        async with asyncio.timeout(seconds):
            return await coro
    except TimeoutError:
        raise TimeoutError(f"exceeded {seconds}s deadline")

async def main():
    try:
        await with_timeout(0.05, asyncio.sleep(1))
    except TimeoutError as e:
        print(e)   # exceeded 0.05s deadline

asyncio.run(main())`,
    explanation:
      "Wrapping asyncio.timeout in a reusable helper lets you attach a human-readable message to the TimeoutError and centralize timeout policy — useful for adding per-operation timeouts across a codebase consistently.",
  },
];
