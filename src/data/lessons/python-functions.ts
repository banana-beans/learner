// ============================================================
// Python Tier 4 — Functions Lessons
// ============================================================

import type { LessonContent } from "./python-basics";

export const pythonFunctionsLessons: Record<string, LessonContent> = {
  "python:t4:functions-basics": {
    nodeId: "python:t4:functions-basics",
    title: "Defining Functions",
    sections: [
      {
        heading: "def and return",
        body: "Define functions with def name(params): ... — return sends a value back, or None if you don't return explicitly. Functions are first-class objects: you can pass them around and assign them to variables.",
      },
      {
        heading: "Docstrings and Type Hints",
        body: "A triple-quoted string immediately under def becomes the function's docstring (accessible as func.__doc__ and via help()). Type hints (def f(x: int) -> str) are pure documentation by default — runtime ignores them, but tools like mypy enforce.",
      },
      {
        heading: "Single Responsibility",
        body: "A good function does one thing and is named after that thing. Functions over ~30 lines are usually too big. Pure functions (no side effects, output depends only on inputs) are easier to test and reason about.",
      },
    ],
    codeExamples: [
      {
        title: "Basic function",
        code: `def greet(name):
    return f"Hello, {name}!"

print(greet("Ada"))   # Hello, Ada!
print(greet("Linus")) # Hello, Linus!`,
        explanation: "Simple input → output. The return value is what callers receive.",
      },
      {
        title: "Docstring + type hints",
        code: `def square(n: int) -> int:
    """Return n squared."""
    return n * n

print(square(5))      # 25
print(square.__doc__) # Return n squared.`,
        explanation: "Hints show intent. Tools like mypy verify them statically.",
      },
      {
        title: "Functions are first-class",
        code: `def double(x): return x * 2
def triple(x): return x * 3

ops = [double, triple]
for op in ops:
    print(op(5))
# 10 / 15`,
        explanation: "Functions are objects — store them in lists, pass to other functions, return them.",
      },
    ],
    keyTakeaways: [
      "def name(params): defines; return value sends back",
      "No return = returns None",
      "Type hints document; mypy enforces",
      "Functions are first-class objects",
      "One job per function — name it after that job",
    ],
  },

  "python:t4:arguments": {
    nodeId: "python:t4:arguments",
    title: "Arguments (*args, **kwargs)",
    sections: [
      {
        heading: "Positional and Keyword",
        body: "Arguments can be passed positionally (def f(a, b): ...) or by name (f(b=2, a=1)). Defaults make them optional: def f(x=10). Default values are evaluated once at function definition — never use mutable defaults like [] or {}.",
      },
      {
        heading: "*args and **kwargs",
        body: "*args collects extra positional args into a tuple; **kwargs collects extra keywords into a dict. Use them when you don't know how many args, or when forwarding args to another function. Naming convention: args/kwargs.",
      },
      {
        heading: "Argument Order Rules",
        body: "Order: positional, *args, keyword-only, **kwargs. After *args, all params are keyword-only. Use bare * to enforce keyword-only without packing: def f(a, *, key=None) means key must be passed by name.",
      },
    ],
    codeExamples: [
      {
        title: "Defaults and keywords",
        code: `def greet(name, greeting="Hello"):
    return f"{greeting}, {name}!"

print(greet("Ada"))                    # Hello, Ada!
print(greet("Ada", "Hi"))              # Hi, Ada!
print(greet(name="Ada", greeting="Hey")) # Hey, Ada!`,
        explanation: "Defaults make params optional. Keyword args let you skip earlier defaults.",
      },
      {
        title: "*args and **kwargs",
        code: `def stats(*nums, label="result"):
    return f"{label}: total={sum(nums)} count={len(nums)}"

print(stats(1, 2, 3))                  # result: total=6 count=3
print(stats(10, 20, label="scores"))   # scores: total=30 count=2`,
        explanation: "*nums collects positionals into a tuple. label is keyword-only after the *.",
      },
      {
        title: "Mutable default trap",
        code: `# WRONG — list is shared across calls
def add_bad(x, items=[]):
    items.append(x)
    return items

print(add_bad(1))  # [1]
print(add_bad(2))  # [1, 2]   # !!

# RIGHT — sentinel default
def add_good(x, items=None):
    if items is None:
        items = []
    items.append(x)
    return items`,
        explanation: "Mutable defaults persist across calls. Use None and create fresh inside.",
      },
    ],
    keyTakeaways: [
      "*args = tuple of extra positional; **kwargs = dict of extra keyword",
      "Bare * forces following params to be keyword-only",
      "Defaults evaluate once at def time — never use [] or {} as defaults",
      "Order: positional, *args, keyword-only, **kwargs",
      "Forward args with f(*args, **kwargs) — same syntax both directions",
    ],
  },

  "python:t4:scope-closures": {
    nodeId: "python:t4:scope-closures",
    title: "Scope (LEGB) and Closures",
    sections: [
      {
        heading: "LEGB Lookup",
        body: "Python resolves names in order: Local → Enclosing → Global → Built-in. Local is the current function. Enclosing is any outer function. Global is module-level. Built-in is print, len, etc. First match wins.",
      },
      {
        heading: "global and nonlocal",
        body: "Assigning a name inside a function creates a local — even if a global with that name exists. Use global x to write the module-level binding. Use nonlocal x to write the nearest enclosing function's binding (not global).",
      },
      {
        heading: "Closures",
        body: "A closure is a function that captures variables from its enclosing scope. Returning an inner function that references outer variables creates one. Useful for factories, callbacks, and stateful functions without classes.",
      },
    ],
    codeExamples: [
      {
        title: "LEGB in action",
        code: `x = "global"

def outer():
    x = "enclosing"
    def inner():
        x = "local"
        print(x)
    inner()
    print(x)

outer()
print(x)
# local / enclosing / global`,
        explanation: "Each level shadows the outer one. Innermost wins.",
      },
      {
        title: "Counter via closure",
        code: `def make_counter():
    n = 0
    def step():
        nonlocal n
        n += 1
        return n
    return step

c = make_counter()
print(c(), c(), c())  # 1 2 3`,
        explanation: "step closes over n. nonlocal lets it write back to the enclosing binding.",
      },
      {
        title: "Closure trap with loops",
        code: `# WRONG — all functions reference the same i
funcs = [lambda: i for i in range(3)]
print([f() for f in funcs])  # [2, 2, 2]

# RIGHT — bind via default arg
funcs = [lambda i=i: i for i in range(3)]
print([f() for f in funcs])  # [0, 1, 2]`,
        explanation: "Closures capture variables, not values. Use a default arg to snapshot.",
      },
    ],
    keyTakeaways: [
      "LEGB = Local, Enclosing, Global, Built-in — lookup order",
      "Assignment inside a function creates a local by default",
      "global x and nonlocal x let you write to outer bindings",
      "Closures capture variables, not snapshots",
      "Loop+lambda gotcha: bind via default arg lambda x=x: ...",
    ],
  },

  "python:t4:recursion": {
    nodeId: "python:t4:recursion",
    title: "Recursion",
    sections: [
      {
        heading: "Functions Calling Themselves",
        body: "A recursive function solves a problem by reducing it to a smaller version of itself. Two parts: a base case that ends the recursion, and a recursive case that gets closer to the base. Without a base case, you'll blow the stack.",
      },
      {
        heading: "When To Use It",
        body: "Recursion shines on naturally recursive structures: trees, file systems, divide-and-conquer algorithms (mergesort, quicksort), permutations. For linear iteration, prefer a loop — Python doesn't tail-call optimize and you'll hit RecursionError around depth 1000.",
      },
      {
        heading: "Memoization",
        body: "Recursive functions often recompute the same subproblems. Cache results with functools.lru_cache or @cache (3.9+). This converts exponential recursive solutions (fib) into linear ones for free.",
      },
    ],
    codeExamples: [
      {
        title: "Factorial",
        code: `def fact(n):
    if n <= 1:        # base case
        return 1
    return n * fact(n - 1)  # recursive case

print(fact(5))  # 120`,
        explanation: "Each call does one multiplication and recurses on a smaller n.",
      },
      {
        title: "Sum a nested list",
        code: `def total(items):
    s = 0
    for x in items:
        s += total(x) if isinstance(x, list) else x
    return s

print(total([1, [2, 3, [4, 5]], 6]))  # 21`,
        explanation: "Recursion handles arbitrary nesting that loops can't easily.",
      },
      {
        title: "Memoized fibonacci",
        code: `from functools import cache

@cache
def fib(n):
    if n < 2:
        return n
    return fib(n - 1) + fib(n - 2)

print(fib(30))  # 832040`,
        explanation: "@cache memoizes return values keyed by args. Without it, fib(30) is millions of calls.",
      },
    ],
    keyTakeaways: [
      "Always have a base case",
      "Each recursive call must move toward the base case",
      "Python recursion limit is ~1000 — no tail-call optimization",
      "Use @cache or @lru_cache to memoize repeated subproblems",
      "Trees and divide-and-conquer love recursion; linear loops don't need it",
    ],
  },

  "python:t4:lambda": {
    nodeId: "python:t4:lambda",
    title: "Lambda Functions",
    sections: [
      {
        heading: "Anonymous Functions",
        body: "lambda args: expr makes a small anonymous function. Limited to a single expression — no statements, no return keyword. Common as the key= argument to sorted/min/max, or as a quick callback.",
      },
      {
        heading: "When NOT To Use Lambda",
        body: "If you find yourself reaching for multiple lines, conditionals, or assigning a lambda to a name (foo = lambda x: ...), use def instead. Named functions get tracebacks with their name; lambdas show up as <lambda>.",
      },
      {
        heading: "Lambda vs operator vs functools",
        body: "For simple operations, the operator module (operator.itemgetter, operator.attrgetter) is faster and clearer than a lambda. functools.partial fixes args without the lambda boilerplate.",
      },
    ],
    codeExamples: [
      {
        title: "Sort by key",
        code: `users = [("ada", 36), ("linus", 54), ("grace", 42)]
by_age = sorted(users, key=lambda u: u[1])
print(by_age)
# [('ada', 36), ('grace', 42), ('linus', 54)]`,
        explanation: "key= takes a function. lambda u: u[1] extracts the second element of each tuple.",
      },
      {
        title: "Filter and map idiomatically",
        code: `nums = [1, 2, 3, 4, 5]
evens = list(filter(lambda n: n % 2 == 0, nums))
doubled = list(map(lambda n: n * 2, nums))
print(evens, doubled)
# [2, 4] [2, 4, 6, 8, 10]
# Better in Python: list comps
# [n for n in nums if n % 2 == 0]`,
        explanation: "Lambdas with map/filter work, but list comps are usually more Pythonic.",
      },
      {
        title: "operator beats lambda",
        code: `from operator import itemgetter
users = [("ada", 36), ("linus", 54), ("grace", 42)]
by_age = sorted(users, key=itemgetter(1))
print(by_age)  # same as lambda u: u[1] but faster`,
        explanation: "itemgetter(1) returns a callable that grabs index 1. Cleaner than lambda u: u[1].",
      },
    ],
    keyTakeaways: [
      "lambda args: expr — single expression, no statements",
      "Use as key= or for short callbacks",
      "Don't assign lambdas to names — use def",
      "List comps usually beat lambda + map/filter",
      "operator.itemgetter / attrgetter beat lambda for simple extraction",
    ],
  },

  "python:t4:decorators": {
    nodeId: "python:t4:decorators",
    title: "Decorators",
    sections: [
      {
        heading: "Functions That Wrap Functions",
        body: "A decorator is a callable that takes a function and returns a (usually wrapped) function. The @decorator syntax above a def is sugar for func = decorator(func). Used everywhere: caching, logging, timing, auth, route registration.",
      },
      {
        heading: "Writing Your Own",
        body: "A basic decorator is a function that takes a func, defines an inner wrapper, and returns wrapper. Use functools.wraps to preserve __name__, __doc__, and signature. Without @wraps, your decorated function loses its identity.",
      },
      {
        heading: "Decorators With Arguments",
        body: "If you want @decorator(arg), you write a factory: a function that takes the args and returns a decorator. Three layers deep can be confusing — read it as: @(decorator(arg))(func).",
      },
    ],
    codeExamples: [
      {
        title: "Timing decorator",
        code: `import time
from functools import wraps

def timed(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        result = func(*args, **kwargs)
        elapsed = time.perf_counter() - start
        print(f"{func.__name__} took {elapsed*1000:.1f}ms")
        return result
    return wrapper

@timed
def slow():
    time.sleep(0.1)
    return "done"

print(slow.__name__)  # slow (preserved by @wraps)`,
        explanation: "@wraps copies metadata so slow.__name__ stays 'slow', not 'wrapper'.",
      },
      {
        title: "Decorator with args",
        code: `def repeat(times):
    def decorator(func):
        def wrapper(*args, **kwargs):
            for _ in range(times):
                result = func(*args, **kwargs)
            return result
        return wrapper
    return decorator

@repeat(3)
def hi():
    print("hi")

hi()  # hi / hi / hi`,
        explanation: "repeat(3) returns a decorator, which then wraps hi. Three layers.",
      },
      {
        title: "Built-in decorators",
        code: `from functools import cache

@cache
def fib(n):
    return n if n < 2 else fib(n-1) + fib(n-2)

print(fib(50))  # 12586269025 — instant thanks to caching`,
        explanation: "Stdlib has @cache, @lru_cache, @property, @staticmethod, @classmethod and more.",
      },
    ],
    keyTakeaways: [
      "@dec is sugar for func = dec(func)",
      "Always use functools.wraps to preserve metadata",
      "Decorator with arguments needs three nested functions",
      "Common uses: caching, timing, logging, auth, registration",
      "Stdlib has powerful built-ins: @cache, @property, @dataclass",
    ],
  },

  "python:t4:generators": {
    nodeId: "python:t4:generators",
    title: "Generators & Iterators",
    sections: [
      {
        heading: "Yield Instead Of Return",
        body: "A function with yield becomes a generator. Each call returns a generator object; iterating it advances to the next yield. Generators are lazy — they produce values on demand, never building the full list in memory.",
      },
      {
        heading: "Generator Expressions",
        body: "(expr for item in iterable) is a generator expression — same syntax as a list comp but with parens. Pass directly to functions that take iterables: sum(x*x for x in nums) avoids building the intermediate list.",
      },
      {
        heading: "Composable Pipelines",
        body: "Generators chain naturally — each one transforms the previous. Memory stays constant regardless of input size. Pair with itertools (chain, islice, takewhile, groupby) for powerful streaming pipelines.",
      },
    ],
    codeExamples: [
      {
        title: "Generator function",
        code: `def squares_up_to(n):
    for i in range(n):
        yield i * i

g = squares_up_to(5)
print(next(g))  # 0
print(list(g))  # [1, 4, 9, 16] — already advanced past 0`,
        explanation: "yield pauses; next() resumes. Once exhausted, raises StopIteration.",
      },
      {
        title: "Lazy filtering",
        code: `def evens(seq):
    for x in seq:
        if x % 2 == 0:
            yield x

# Read 10 evens from a huge range without materializing it
from itertools import islice
result = list(islice(evens(range(10**9)), 10))
print(result)  # [0, 2, 4, 6, 8, 10, 12, 14, 16, 18]`,
        explanation: "evens never holds more than one value. islice takes the first 10 from any iterable.",
      },
      {
        title: "Generator expression",
        code: `total = sum(x * x for x in range(1000))
print(total)  # 332833500`,
        explanation: "No intermediate list — sum reads the generator one value at a time.",
      },
    ],
    keyTakeaways: [
      "yield turns a function into a generator",
      "Generators are lazy — values produced on demand",
      "(...) gives a generator expression; [...] gives a list",
      "Use for streams of unknown or huge size — constant memory",
      "Compose with itertools for chained pipelines",
    ],
  },
};
