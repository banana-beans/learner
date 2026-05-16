import type { Snippet } from "./types";

export const pythonSnippets20260516B5: Snippet[] = [
  {
    id: "py-b16-b5-math-comb",
    language: "python",
    title: "math.comb — combinations count",
    tag: "snippet",
    code: `import math

# How many ways to choose 3 items from 10 (order doesn't matter)?
n, k = 10, 3
result = math.comb(n, k)        # C(10,3) = 10! / (3! * 7!)
print(result)                   # 120

# Works with large numbers — uses integer arithmetic, no overflow
print(math.comb(100, 50))       # exact big integer`,
    explanation: "`math.comb(n, k)` computes the binomial coefficient n-choose-k using exact integer arithmetic, so it never loses precision even for large values.",
  },
  {
    id: "py-b16-b5-numbers-complex",
    language: "python",
    title: "numbers.Complex ABC",
    tag: "types",
    code: `import numbers

# Check whether a value belongs to the numeric tower
def accepts_complex(x: numbers.Complex) -> str:
    return f"real={x.real}, imag={x.imag}"

print(accepts_complex(3 + 4j))  # real=3.0, imag=4.0
print(accepts_complex(7))       # real=7, imag=0  (int is a Complex)
print(isinstance(7, numbers.Complex))   # True`,
    explanation: "`numbers.Complex` is the root of Python's numeric tower; every built-in numeric type is a virtual subclass, so you can use it in isinstance checks without importing each type.",
  },
  {
    id: "py-b16-b5-math-perm",
    language: "python",
    title: "math.perm — permutations count",
    tag: "snippet",
    code: `import math

# Ordered arrangements of 3 items from 10
result = math.perm(10, 3)       # P(10,3) = 10 * 9 * 8
print(result)                   # 720

# Omitting k gives n! (all items)
print(math.perm(5))             # 120  (5!)

# Compare: combinations ignore order, permutations don't
print(math.comb(10, 3) * math.factorial(3) == math.perm(10, 3))  # True`,
    explanation: "`math.perm(n, k)` counts ordered selections; when k is omitted it returns n!, and like `math.comb` it stays in exact integer arithmetic.",
  },
  {
    id: "py-b16-b5-array-type-codes",
    language: "python",
    title: "array.array type codes and usage",
    tag: "structures",
    code: `import array

# Type code 'd' = C double (8 bytes each); 'i' = signed int (4 bytes)
floats = array.array('d', [1.1, 2.2, 3.3, 4.4])
ints   = array.array('i', range(5))

print(floats.itemsize)          # 8
print(ints.itemsize)            # 4
print(floats[2])                # 3.3
floats.append(5.5)
print(floats.tobytes())         # raw IEEE-754 bytes`,
    explanation: "`array.array` stores homogeneous values in a compact C-level buffer; the type code ('d', 'i', 'B', …) selects the underlying C type, saving memory versus a plain list.",
  },
  {
    id: "py-b16-b5-math-floor-vs-int",
    language: "python",
    title: "math.floor vs int() for negative numbers",
    tag: "caveats",
    code: `import math

# For positive numbers they agree
print(int(2.9))        # 2
print(math.floor(2.9)) # 2

# For negatives they DIVERGE
print(int(-2.9))        # -2  (truncates toward zero)
print(math.floor(-2.9)) # -3  (rounds toward negative infinity)

# math.ceil also differs from -int(-x) in edge cases
print(math.ceil(-2.1))  # -2`,
    explanation: "`int()` truncates toward zero while `math.floor` always rounds toward negative infinity — for non-negative numbers they agree, but they diverge on negatives.",
  },
  {
    id: "py-b16-b5-numbers-real",
    language: "python",
    title: "numbers.Real ABC",
    tag: "types",
    code: `import numbers

def sqrt_positive(x: numbers.Real) -> float:
    if x < 0:
        raise ValueError(f"Expected non-negative, got {x!r}")
    return x ** 0.5

print(sqrt_positive(9))         # 3.0
print(sqrt_positive(2.5))       # 1.5811...
print(isinstance(3.14, numbers.Real))   # True
print(isinstance(3+0j, numbers.Real))   # False  (complex is not Real)`,
    explanation: "`numbers.Real` sits above `numbers.Rational` but below `numbers.Complex` in the tower; it excludes complex numbers, making it the right annotation when you need a value on the real line.",
  },
  {
    id: "py-b16-b5-math-isclose",
    language: "python",
    title: "math.isclose for float comparison",
    tag: "snippet",
    code: `import math

a = 0.1 + 0.2
b = 0.3

print(a == b)                            # False (float rounding)
print(math.isclose(a, b))               # True  (rel_tol=1e-9 default)

# Absolute tolerance matters near zero
print(math.isclose(1e-10, 0.0))         # False (rel_tol dominates)
print(math.isclose(1e-10, 0.0, abs_tol=1e-9))  # True`,
    explanation: "`math.isclose` uses both a relative tolerance (scaled to the magnitude of the inputs) and an optional absolute tolerance so you can handle comparisons near zero correctly.",
  },
  {
    id: "py-b16-b5-math-isclose-vs-eq",
    language: "python",
    title: "math.isclose vs == for floats (rel_tol, abs_tol)",
    tag: "understanding",
    code: `import math

# == tests bit-exact equality — almost always wrong for floats
x = sum([0.1] * 10)
print(x == 1.0)                          # False

# rel_tol: acceptable relative difference (default 1e-9)
print(math.isclose(x, 1.0))             # True

# abs_tol: needed when comparing against zero
print(math.isclose(0.0, 1e-10))                    # False
print(math.isclose(0.0, 1e-10, abs_tol=1e-9))      # True

# Formula: abs(a-b) <= max(rel_tol * max(abs(a),abs(b)), abs_tol)`,
    explanation: "The formula combines both tolerances with max(), so a value passes if it's within *either* bound — the relative tolerance handles large magnitudes while abs_tol guards the zero neighbourhood.",
  },
  {
    id: "py-b16-b5-ctypes-c-int",
    language: "python",
    title: "ctypes.c_int — C integer from Python",
    tag: "structures",
    code: `import ctypes

# Create a mutable C int on the Python heap
n = ctypes.c_int(42)
print(n.value)          # 42

n.value = 100
print(n.value)          # 100

# Overflow wraps like a signed 32-bit int
n.value = 2**31         # sets to -2147483648 (wraps)
print(n.value)          # -2147483648

# Pass by reference to a C function via byref()
# lib.some_func(ctypes.byref(n))`,
    explanation: "`ctypes.c_int` wraps a C `int` and enforces signed 32-bit wrap-around on assignment, making it the correct type to pass to C functions that expect an `int*`.",
  },
  {
    id: "py-b16-b5-math-prod",
    language: "python",
    title: "math.prod — product of an iterable",
    tag: "snippet",
    code: `import math

nums = [2, 3, 5, 7]
print(math.prod(nums))          # 210

# Optional start value (like sum's second arg)
print(math.prod(nums, start=10))  # 2100

# Works with floats
print(math.prod([0.5, 0.5, 0.5, 0.5]))  # 0.0625

# Empty iterable returns the start (1 by default)
print(math.prod([]))            # 1`,
    explanation: "`math.prod` multiplies all values in an iterable with a configurable start value, neatly replacing `functools.reduce(operator.mul, seq, 1)` without an import.",
  },
  {
    id: "py-b16-b5-divmod-negatives",
    language: "python",
    title: "divmod sign convention with negatives",
    tag: "caveats",
    code: `# divmod(a, b) returns (quotient, remainder) such that
# a == quotient * b + remainder  AND  sign(remainder) == sign(b)

print(divmod(7, 3))     # (2, 1)   normal case
print(divmod(-7, 3))    # (-3, 2)  quotient floors toward -inf
print(divmod(7, -3))    # (-3, -2) remainder is negative (matches b)
print(divmod(-7, -3))   # (2, -1)

# Compare: C-style truncating division
print((-7) // 3)        # -3  (floor division)
print((-7) % 3)         # 2   (modulo, same sign as divisor)`,
    explanation: "Python's `%` always returns a result with the same sign as the divisor (floor division semantics), so `divmod(-7, 3)` gives `(-3, 2)`, not `(-2, -1)` as C would.",
  },
  {
    id: "py-b16-b5-numbers-rational",
    language: "python",
    title: "numbers.Rational ABC",
    tag: "types",
    code: `import numbers
from fractions import Fraction

def as_ratio(x: numbers.Rational) -> str:
    return f"{x.numerator}/{x.denominator}"

f = Fraction(3, 4)
print(as_ratio(f))                      # 3/4
print(as_ratio(Fraction('1.5')))        # 3/2

# int is also Rational
print(isinstance(7, numbers.Rational))  # True
print(as_ratio(7))                      # 7/1`,
    explanation: "`numbers.Rational` guarantees `.numerator` and `.denominator` attributes; both `Fraction` and `int` implement it, so you can write generic code that handles either.",
  },
  {
    id: "py-b16-b5-math-gcd-lcm",
    language: "python",
    title: "math.gcd and math.lcm",
    tag: "snippet",
    code: `import math

# Greatest common divisor
print(math.gcd(48, 18))         # 6
print(math.gcd(100, 75, 25))    # 25  (variadic, Python 3.9+)

# Least common multiple
print(math.lcm(4, 6))           # 12
print(math.lcm(4, 6, 10))       # 60  (variadic)

# Useful for reducing fractions manually
a, b = 56, 98
g = math.gcd(a, b)
print(f"{a//g}/{b//g}")         # 4/7`,
    explanation: "Both functions accept multiple arguments since Python 3.9, so you can compute the GCD or LCM of an entire collection without a reduce call.",
  },
  {
    id: "py-b16-b5-struct-precompiled",
    language: "python",
    title: "struct.Struct pre-compiled format",
    tag: "structures",
    code: `import struct

# Pre-compile a format string for repeated packing/unpacking
fmt = struct.Struct('>HHI')     # big-endian: 2 ushorts + 1 uint
print(fmt.size)                 # 8 bytes

packed = fmt.pack(1, 2, 300)
print(packed.hex())             # 00010002 0000012c

a, b, c = fmt.unpack(packed)
print(a, b, c)                  # 1 2 300

# Unpack directly from a buffer without a separate bytes copy
data = bytearray(packed)
print(fmt.unpack_from(data, offset=0))`,
    explanation: "Creating a `struct.Struct` once compiles the format string into an internal C representation, eliminating repeated parsing overhead when you pack or unpack many records.",
  },
  {
    id: "py-b16-b5-float-inf-arithmetic",
    language: "python",
    title: "float('inf') arithmetic",
    tag: "caveats",
    code: `inf = float('inf')

print(inf + 1)          # inf
print(inf * 2)          # inf
print(inf - inf)        # nan  (indeterminate form)
print(inf / inf)        # nan

# Comparisons work as expected
print(10_000_000 < inf) # True
print(-inf < 0 < inf)   # True

# Useful as a sentinel for "no minimum found yet"
best = float('inf')
for x in [5, 3, 8, 1]:
    best = min(best, x)
print(best)             # 1`,
    explanation: "`float('inf')` participates in ordinary arithmetic under IEEE-754 rules; indeterminate forms like `inf - inf` produce NaN, and it's the idiomatic initial value for a running minimum.",
  },
  {
    id: "py-b16-b5-statistics-mean-median-stdev",
    language: "python",
    title: "statistics.mean, median, stdev",
    tag: "snippet",
    code: `import statistics

data = [4, 7, 13, 2, 1, 9, 5, 12]

print(statistics.mean(data))    # 6.625
print(statistics.median(data))  # 6.0   (average of middle two)
print(statistics.stdev(data))   # 4.140... (sample std dev, ddof=1)

# Sorted data not required — functions handle it internally
# For population std dev use pstdev
print(statistics.pstdev(data))  # 3.875... (ddof=0)`,
    explanation: "`statistics.mean` uses `Fraction` internally for integer inputs so it never loses precision to float rounding, while `stdev` computes the *sample* standard deviation (n-1 denominator) by default.",
  },
  {
    id: "py-b16-b5-math-vs-cmath",
    language: "python",
    title: "math vs cmath — real vs complex domain",
    tag: "families",
    code: `import math, cmath

# math raises for inputs that leave the real domain
try:
    math.sqrt(-1)
except ValueError as e:
    print(e)                    # math domain error

# cmath handles the same input correctly
print(cmath.sqrt(-1))           # 1j

# cmath versions of common functions
print(cmath.exp(1j * math.pi))  # (-1+1.2246...e-16j) ≈ Euler's formula
print(cmath.log(-1))            # 3.141592...j  (principal value)`,
    explanation: "`math` operates on real numbers and raises `ValueError` when a result would be complex; `cmath` mirrors the same API but works over ℂ, returning complex values for all inputs.",
  },
  {
    id: "py-b16-b5-random-choices-weighted",
    language: "python",
    title: "random.choices — weighted sampling with replacement",
    tag: "snippet",
    code: `import random

items = ['apple', 'banana', 'cherry']
weights = [10, 3, 1]            # apple is 10x more likely than cherry

# k samples WITH replacement, using relative weights
samples = random.choices(items, weights=weights, k=20)
print(samples.count('apple'))   # typically ~14 out of 20

# cum_weights accepts pre-accumulated weights (faster for repeated calls)
cum = [10, 13, 14]
print(random.choices(items, cum_weights=cum, k=5))`,
    explanation: "`random.choices` samples *with* replacement and accepts either raw weights or pre-accumulated cumulative weights; using `cum_weights` avoids recomputing the prefix sum on every call.",
  },
  {
    id: "py-b16-b5-statistics-mean-vs-sumlen",
    language: "python",
    title: "statistics.mean vs sum/len (Fraction arithmetic)",
    tag: "understanding",
    code: `import statistics, fractions

data = [1, 2, 3]  # plain integers

# Plain division loses exactness
naive = sum(data) / len(data)
print(naive)                        # 2.0  (float)

# statistics.mean converts integers to Fraction internally
exact = statistics.mean(data)
print(exact)                        # 2  (exact integer result)

# More obvious with an awkward average
data2 = [1, 2]
print(sum(data2) / len(data2))      # 1.5  (fine here, but luck)
print(statistics.mean(data2))       # 3/2  no, returns 1.5 float`,
    explanation: "`statistics.mean` converts a list of `int` to `Fraction` before summing so the result is exact; with floats it falls back to standard float arithmetic — the benefit shows most for integer datasets.",
  },
  {
    id: "py-b16-b5-ctypes-structure",
    language: "python",
    title: "ctypes.Structure — C struct mapping",
    tag: "structures",
    code: `import ctypes

class Point(ctypes.Structure):
    _fields_ = [("x", ctypes.c_double),
                ("y", ctypes.c_double)]

p = Point(1.5, 2.5)
print(p.x, p.y)             # 1.5 2.5
print(ctypes.sizeof(Point)) # 16 (two C doubles)

# Access raw bytes
raw = bytes(p)
print(len(raw))             # 16`,
    explanation: "`ctypes.Structure` maps a Python class to a C struct layout; `_fields_` declares members in order and the class handles packing, sizeof, and byte-level access automatically.",
  },
  {
    id: "py-b16-b5-round-bankers",
    language: "python",
    title: "round() uses banker's rounding (round half to even)",
    tag: "caveats",
    code: `# Python's round() follows IEEE-754 round-half-to-even

print(round(0.5))   # 0  (rounds to nearest even)
print(round(1.5))   # 2  (rounds to nearest even)
print(round(2.5))   # 2  (rounds to nearest even)
print(round(3.5))   # 4

# Contrast with Decimal ROUND_HALF_UP
from decimal import Decimal, ROUND_HALF_UP
print(Decimal('2.5').quantize(Decimal('1'), rounding=ROUND_HALF_UP))  # 3`,
    explanation: "Python's built-in `round()` uses *banker's rounding* (ties go to the nearest even digit), which reduces statistical bias in large datasets but surprises anyone expecting arithmetic rounding.",
  },
  {
    id: "py-b16-b5-statistics-mode",
    language: "python",
    title: "statistics.mode — most common value",
    tag: "snippet",
    code: `import statistics

data = [1, 2, 2, 3, 3, 3, 4]
print(statistics.mode(data))        # 3

# multimode returns all modes (Python 3.8+)
bimodal = [1, 1, 2, 2, 3]
print(statistics.multimode(bimodal))  # [1, 2]

# Works with non-numeric data too
words = ['cat', 'dog', 'cat', 'bird']
print(statistics.mode(words))        # cat`,
    explanation: "`statistics.mode` raises `StatisticsError` in Python < 3.8 when there are multiple modes; use `statistics.multimode` instead to get all tied winners as a list.",
  },
  {
    id: "py-b16-b5-numbers-integral",
    language: "python",
    title: "numbers.Integral ABC",
    tag: "types",
    code: `import numbers

def factorial(n: numbers.Integral) -> int:
    if not isinstance(n, numbers.Integral):
        raise TypeError(f"Expected Integral, got {type(n).__name__}")
    if n < 0:
        raise ValueError("n must be non-negative")
    result = 1
    for i in range(2, int(n) + 1):
        result *= i
    return result

print(factorial(5))         # 120
print(factorial(0))         # 1
# factorial(2.5) → TypeError`,
    explanation: "`numbers.Integral` is the most restrictive numeric ABC; both `int` and any integer-like custom type satisfy it, making it the right annotation for functions that truly need an integer.",
  },
  {
    id: "py-b16-b5-random-sample",
    language: "python",
    title: "random.sample — sampling without replacement",
    tag: "snippet",
    code: `import random

population = list(range(100))

# Choose 10 unique elements — no duplicates
sample = random.sample(population, k=10)
print(len(sample))              # 10
print(len(set(sample)))         # 10 (all unique)

# Works with any sequence or set
words = {'apple', 'banana', 'cherry', 'date'}
print(random.sample(sorted(words), k=2))

# k > len(population) raises ValueError
# random.sample(population, k=200)  → ValueError`,
    explanation: "`random.sample` produces a list of k unique elements drawn without replacement; it accepts any sequence and raises `ValueError` if k exceeds the population size.",
  },
  {
    id: "py-b16-b5-random-choices-vs-sample",
    language: "python",
    title: "random.choices vs random.sample — with vs without replacement",
    tag: "understanding",
    code: `import random

pool = [1, 2, 3, 4, 5]

# choices: WITH replacement — same item can appear multiple times
print(random.choices(pool, k=5))    # e.g. [3, 3, 1, 5, 3]

# sample: WITHOUT replacement — each item at most once
print(random.sample(pool, k=5))     # always a permutation of pool

# choices supports weights; sample does not
print(random.choices(pool, weights=[5,1,1,1,1], k=3))

# sample can accept k == len(pool) to shuffle without mutating
print(random.sample(pool, k=len(pool)))`,
    explanation: "`random.choices` models *sampling with replacement* (like rolling a die) while `random.sample` models drawing from a deck — the difference matters for statistical correctness.",
  },
  {
    id: "py-b16-b5-decimal-getcontext-prec",
    language: "python",
    title: "decimal.getcontext().prec — arbitrary precision arithmetic",
    tag: "snippet",
    code: `from decimal import Decimal, getcontext

# Default precision is 28 significant digits
getcontext().prec = 50

result = Decimal(1) / Decimal(3)
print(result)  # 0.33333333333333333333333333333333333333333333333333

# Precision is per-thread
getcontext().prec = 10
print(Decimal(1) / Decimal(3))  # 0.3333333333`,
    explanation: "`decimal.getcontext().prec` sets the number of significant digits for all subsequent `Decimal` operations in the current thread, letting you trade speed for precision on demand.",
  },
  {
    id: "py-b16-b5-io-rawio-vs-buffered",
    language: "python",
    title: "io.RawIOBase vs io.BufferedIOBase",
    tag: "structures",
    code: `import io

# RawIOBase: unbuffered, system-call level
raw = io.FileIO('/dev/null', 'w')
print(isinstance(raw, io.RawIOBase))        # True
print(isinstance(raw, io.BufferedIOBase))   # False

# BufferedIOBase wraps a raw stream and adds internal buffering
buf = io.BufferedWriter(raw)
print(isinstance(buf, io.BufferedIOBase))   # True

# BytesIO is a BufferedIOBase backed by a bytes object in memory
bio = io.BytesIO(b"hello")
print(bio.read())                           # b'hello'`,
    explanation: "`RawIOBase` maps directly to OS-level read/write syscalls with no internal buffer; `BufferedIOBase` wraps it and accumulates data to reduce syscall overhead.",
  },
  {
    id: "py-b16-b5-random-shuffle",
    language: "python",
    title: "random.shuffle — in-place shuffling",
    tag: "snippet",
    code: `import random

deck = list(range(1, 14))       # 1–13 like a card suit

random.shuffle(deck)            # modifies deck in-place, returns None
print(deck[:5])                 # random order

# To keep the original, shuffle a copy
original = [1, 2, 3, 4, 5]
shuffled = original.copy()
random.shuffle(shuffled)
print(original)                 # [1, 2, 3, 4, 5] unchanged`,
    explanation: "`random.shuffle` uses the Fisher-Yates algorithm in-place; it returns `None`, so assigning the result is a common mistake — copy first if you need to preserve the original.",
  },
  {
    id: "py-b16-b5-decimal-vs-fraction-vs-float",
    language: "python",
    title: "Decimal vs Fraction vs float — precision tradeoffs",
    tag: "families",
    code: `from decimal import Decimal
from fractions import Fraction

# float: fast, hardware IEEE-754, rounding errors
f = 0.1 + 0.2
print(f)                            # 0.30000000000000004

# Decimal: decimal precision, configurable, good for money
d = Decimal('0.1') + Decimal('0.2')
print(d)                            # 0.3

# Fraction: exact rational arithmetic, slow, grows large
r = Fraction(1, 10) + Fraction(2, 10)
print(r)                            # 3/10  (exact)`,
    explanation: "Use `float` for speed when small rounding errors are acceptable, `Decimal` for financial/decimal-exact work, and `Fraction` when you need provably exact rational arithmetic at the cost of performance.",
  },
  {
    id: "py-b16-b5-random-seed",
    language: "python",
    title: "random.seed — reproducible randomness",
    tag: "snippet",
    code: `import random

random.seed(42)
a = [random.random() for _ in range(5)]

random.seed(42)         # reset to same state
b = [random.random() for _ in range(5)]

print(a == b)           # True — identical sequences

# Seed with None (default) uses OS entropy
random.seed(None)
print(random.random())  # unpredictable`,
    explanation: "Seeding with a fixed integer resets the Mersenne Twister state so every subsequent call produces the same sequence — essential for reproducible tests or simulations.",
  },
  {
    id: "py-b16-b5-random-seed-global-state",
    language: "python",
    title: "random.seed affects global state",
    tag: "understanding",
    code: `import random

# The module-level functions all share ONE global Random instance
random.seed(0)
x = random.randint(1, 100)

# Any call between seed and use changes the result
random.seed(0)
_ = random.random()     # consumes one step
y = random.randint(1, 100)

print(x == y)           # False — intervening call shifted state

# Solution: use a local Random instance for isolation
rng = random.Random(0)
print(rng.randint(1, 100))  # isolated, repeatable`,
    explanation: "All module-level `random.*` functions share a single global PRNG state; any call by any part of your code (including libraries) advances it, so for reproducible results create a private `random.Random(seed)` instance.",
  },
  {
    id: "py-b16-b5-ctypes-pointer",
    language: "python",
    title: "ctypes.POINTER — typed C pointer",
    tag: "structures",
    code: `import ctypes

# Create a typed pointer type
IntPtr = ctypes.POINTER(ctypes.c_int)

n = ctypes.c_int(99)
ptr = ctypes.pointer(n)         # create a pointer to n

print(ptr[0])                   # 99  (dereference)
ptr[0] = 200
print(n.value)                  # 200  (modified through pointer)

print(isinstance(ptr, IntPtr))  # True`,
    explanation: "`ctypes.POINTER(T)` creates a pointer type that can be dereferenced with index notation; changes through the pointer are visible in the original `ctypes` object, mirroring C pointer semantics.",
  },
  {
    id: "py-b16-b5-fractions-from-string",
    language: "python",
    title: "fractions.Fraction from string",
    tag: "snippet",
    code: `from fractions import Fraction

# Parse from a string representation
f1 = Fraction('3/4')
f2 = Fraction('1.5')       # decimal string → exact Fraction
f3 = Fraction('0.(3)')     # repeating decimals NOT supported — this errors

print(f1)                  # 3/4
print(f2)                  # 3/2   (auto-simplified)
print(Fraction('22/7'))    # 22/7

# Arithmetic stays exact
print(f1 + f2)             # 9/4`,
    explanation: "`Fraction` parses both `'n/d'` and decimal strings like `'1.5'` into exact rationals; the denominator is always automatically reduced to lowest terms.",
  },
  {
    id: "py-b16-b5-float-nan-comparisons",
    language: "python",
    title: "float('nan') comparisons are always False",
    tag: "caveats",
    code: `nan = float('nan')

# NaN is not equal to anything — including itself
print(nan == nan)       # False
print(nan != nan)       # True   (the only reliable test)
print(nan < 0)          # False
print(nan > 0)          # False
print(nan == 0)         # False

# Correct way to test for NaN
import math
print(math.isnan(nan))  # True
print(math.isnan(1.0))  # False`,
    explanation: "IEEE-754 mandates that any comparison involving NaN returns False (except !=), so the only portable way to detect NaN is `math.isnan()` — never `x == float('nan')`.",
  },
  {
    id: "py-b16-b5-statistics-quantiles",
    language: "python",
    title: "statistics.quantiles — percentile computation",
    tag: "snippet",
    code: `import statistics

data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

# n=4 gives quartiles: [Q1, Q2, Q3]
q = statistics.quantiles(data, n=4)
print(q)                # [3.25, 5.5, 7.75]

# n=100 gives percentiles; method='inclusive' or 'exclusive'
p90 = statistics.quantiles(data, n=100, method='inclusive')[89]
print(p90)              # 9.1`,
    explanation: "`statistics.quantiles` divides data into n equal-probability groups and returns the n-1 cut points; choose `method='inclusive'` (default) or `'exclusive'` depending on whether endpoints are included in the population.",
  },
  {
    id: "py-b16-b5-fractions-mixing-float",
    language: "python",
    title: "Mixing Fraction with float loses exactness",
    tag: "caveats",
    code: `from fractions import Fraction

exact = Fraction(1, 3)
print(exact)                    # 1/3  (exact)

# Adding a float converts to Fraction(float) first — imprecise
result = exact + 0.1
print(result)
# Fraction(13476564153148427, 40532396646334464)  — NOT 13/30!

# Keep it exact by using Fraction throughout
result_exact = exact + Fraction(1, 10)
print(result_exact)             # 13/30`,
    explanation: "When a `Fraction` mixes with a `float`, Python converts the float to its exact binary `Fraction` equivalent first — which is almost never a nice rational — so the result looks exact but carries the float's original rounding error.",
  },
  {
    id: "py-b16-b5-cmath-sqrt-negative",
    language: "python",
    title: "cmath.sqrt of a negative number",
    tag: "understanding",
    code: `import cmath, math

# math.sqrt raises for negatives
try:
    math.sqrt(-4)
except ValueError:
    print("math domain error")

# cmath.sqrt returns the principal square root in ℂ
print(cmath.sqrt(-4))           # 2j
print(cmath.sqrt(-1))           # 1j
print(cmath.sqrt(4))            # (2+0j)

# Verify: (2j)**2 == -4
print((cmath.sqrt(-4))**2)      # (-4+0j)`,
    explanation: "`cmath.sqrt` always returns the principal square root with non-negative imaginary part, while `math.sqrt` restricts its domain to non-negative reals and raises `ValueError` otherwise.",
  },
  {
    id: "py-b16-b5-numbers-number-abc",
    language: "python",
    title: "numbers.Number ABC check",
    tag: "snippet",
    code: `import numbers

def is_numeric(val) -> bool:
    return isinstance(val, numbers.Number)

print(is_numeric(42))           # True
print(is_numeric(3.14))         # True
print(is_numeric(2+3j))         # True
from fractions import Fraction
print(is_numeric(Fraction(1,3)))# True
print(is_numeric("42"))         # False
print(is_numeric([1, 2]))       # False`,
    explanation: "`numbers.Number` is the abstract root of the numeric tower; every built-in numeric type registers with it, making it the broadest possible isinstance filter for \"any number\".",
  },
  {
    id: "py-b16-b5-memoryview-slicing",
    language: "python",
    title: "memoryview slicing without copy",
    tag: "structures",
    code: `data = bytearray(b"Hello, World!")

mv = memoryview(data)

# Slice creates a new view — no data copied
sub = mv[7:12]
print(bytes(sub))               # b'World'

# Modify through the view
sub[0] = ord('w')
print(data)                     # bytearray(b'Hello, world!')

# Works with bytes too (read-only view)
ro = memoryview(b"immutable")
print(bytes(ro[4:]))            # b'table'`,
    explanation: "`memoryview` provides a zero-copy view into any buffer-protocol object; slicing it creates another view without allocating new memory, and writes through a writable view modify the underlying buffer.",
  },
  {
    id: "py-b16-b5-random-vs-secrets",
    language: "python",
    title: "random vs secrets — reproducible vs cryptographic",
    tag: "families",
    code: `import random, secrets

# random: fast Mersenne Twister, seedable, NOT secure
token_bad = ''.join(random.choices('abcdef0123456789', k=16))

# secrets: OS entropy (/dev/urandom), cryptographically secure
token_good = secrets.token_hex(16)      # 32 hex characters
print(token_good)

# secrets.choice for secure selection
chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
print(secrets.choice(chars))

# secrets has no seed — use random for reproducible tests`,
    explanation: "`secrets` uses OS-level entropy and is suitable for security-sensitive tokens, passwords, and keys; `random` is faster and seedable but predictable once its internal state is known.",
  },
  {
    id: "py-b16-b5-decimal-rounding-modes",
    language: "python",
    title: "Decimal rounding modes (ROUND_HALF_UP etc.)",
    tag: "understanding",
    code: `from decimal import Decimal, ROUND_HALF_UP, ROUND_HALF_EVEN, ROUND_DOWN

d = Decimal('2.5')
one = Decimal('1')

print(d.quantize(one, rounding=ROUND_HALF_UP))   # 3  (classic)
print(d.quantize(one, rounding=ROUND_HALF_EVEN))  # 2  (banker's)
print(d.quantize(one, rounding=ROUND_DOWN))        # 2  (truncate)

d2 = Decimal('3.5')
print(d2.quantize(one, rounding=ROUND_HALF_UP))   # 4
print(d2.quantize(one, rounding=ROUND_HALF_EVEN)) # 4  (4 is even)`,
    explanation: "`Decimal` exposes all seven IEEE-854 rounding modes via named constants; `ROUND_HALF_UP` gives the classic school rounding while `ROUND_HALF_EVEN` (banker's rounding) reduces cumulative bias.",
  },
  {
    id: "py-b16-b5-typing-supports-int",
    language: "python",
    title: "typing.SupportsInt protocol",
    tag: "types",
    code: `from typing import SupportsInt

def to_int(x: SupportsInt) -> int:
    return int(x)

print(to_int(3.7))      # 3
print(to_int("42"))     # 42
print(to_int(True))     # 1

# Custom class that satisfies SupportsInt
class MyNum:
    def __int__(self) -> int:
        return 99

print(to_int(MyNum()))  # 99`,
    explanation: "`typing.SupportsInt` is a structural protocol that matches any object with an `__int__` method, allowing you to annotate \"anything convertible to int\" without inheriting from a base class.",
  },
  {
    id: "py-b16-b5-ctypes-cdll",
    language: "python",
    title: "ctypes.cdll — loading a shared library",
    tag: "structures",
    code: `import ctypes, ctypes.util

# Find and load the C standard library
libname = ctypes.util.find_library('c')
libc = ctypes.CDLL(libname)

# Call strlen from libc
libc.strlen.restype = ctypes.c_size_t
libc.strlen.argtypes = [ctypes.c_char_p]

result = libc.strlen(b"Hello, World!")
print(result)   # 13`,
    explanation: "`ctypes.CDLL` loads a shared library and lets you call its exported C functions; setting `restype` and `argtypes` ensures correct marshaling of arguments and return values.",
  },
  {
    id: "py-b16-b5-complex-arithmetic",
    language: "python",
    title: "Complex arithmetic in Python",
    tag: "understanding",
    code: `a = 3 + 4j
b = 1 - 2j

print(a + b)            # (4+2j)
print(a * b)            # (11-2j)   (FOIL: 3-6j+4j-8j² = 11-2j)
print(a / b)            # (-1+2j)
print(abs(a))           # 5.0  (magnitude: sqrt(3²+4²))
print(a.conjugate())    # (3-4j)
print(a.real, a.imag)   # 3.0 4.0`,
    explanation: "Python's built-in `complex` type supports all arithmetic operators directly; `abs()` computes the modulus (Euclidean distance from origin) and `.conjugate()` flips the imaginary sign.",
  },
  {
    id: "py-b16-b5-custom-integer-abc",
    language: "python",
    title: "numbers.Integral custom integer subclass",
    tag: "classes",
    code: `import numbers

class Mod7(numbers.Integral):
    def __init__(self, val):
        self._val = int(val) % 7

    def __int__(self): return self._val
    def __abs__(self): return Mod7(abs(self._val))
    def __neg__(self): return Mod7(-self._val)
    def __add__(self, o): return Mod7(self._val + int(o))
    def __radd__(self, o): return Mod7(int(o) + self._val)
    def __mul__(self, o): return Mod7(self._val * int(o))
    def __rmul__(self, o): return Mod7(int(o) * self._val)
    def __floordiv__(self, o): return Mod7(self._val // int(o))
    def __rfloordiv__(self, o): return Mod7(int(o) // self._val)
    def __mod__(self, o): return Mod7(self._val % int(o))
    def __rmod__(self, o): return Mod7(int(o) % self._val)
    def __pow__(self, exp, mod=None): return Mod7(pow(self._val, int(exp), 7))
    def __rpow__(self, base, mod=None): return Mod7(pow(int(base), self._val, 7))
    def __lshift__(self, n): return Mod7(self._val << int(n))
    def __rlshift__(self, n): return Mod7(int(n) << self._val)
    def __rshift__(self, n): return Mod7(self._val >> int(n))
    def __rrshift__(self, n): return Mod7(int(n) >> self._val)
    def __and__(self, o): return Mod7(self._val & int(o))
    def __rand__(self, o): return Mod7(int(o) & self._val)
    def __or__(self, o): return Mod7(self._val | int(o))
    def __ror__(self, o): return Mod7(int(o) | self._val)
    def __xor__(self, o): return Mod7(self._val ^ int(o))
    def __rxor__(self, o): return Mod7(int(o) ^ self._val)
    def __invert__(self): return Mod7(~self._val)
    def __trunc__(self): return self._val
    def __floor__(self): return self._val
    def __ceil__(self): return self._val
    def __round__(self, n=0): return self._val
    def __eq__(self, o): return self._val == int(o) % 7
    def __lt__(self, o): return self._val < int(o) % 7
    def __le__(self, o): return self._val <= int(o) % 7
    def __pos__(self): return Mod7(self._val)
    def __bool__(self): return bool(self._val)
    def __repr__(self): return f"Mod7({self._val})"

m = Mod7(10)
print(m)            # Mod7(3)
print(m + Mod7(5))  # Mod7(1)`,
    explanation: "Subclassing `numbers.Integral` requires implementing all abstract methods (`__int__`, bitwise ops, `__floor__`, `__ceil__`, `__round__`, `__trunc__`, etc.) so the class fully integrates with Python's numeric tower.",
  },
  {
    id: "py-b16-b5-cmath-phase-polar",
    language: "python",
    title: "cmath.phase and cmath.polar",
    tag: "understanding",
    code: `import cmath, math

z = 1 + 1j

# phase returns the angle in radians (argument of the complex number)
print(cmath.phase(z))               # 0.7853... (π/4)
print(cmath.phase(z) * 180 / math.pi)  # 45.0 degrees

# polar returns (modulus, phase) tuple
r, phi = cmath.polar(z)
print(r, phi)                       # (1.4142..., 0.7853...)

# rect converts back: rect(r, phi) == z
print(cmath.rect(r, phi))           # (1+1j)`,
    explanation: "`cmath.phase` extracts the argument θ of a complex number in radians (range (-π, π]), and `cmath.polar` returns both modulus and phase as a tuple for easy conversion to polar form.",
  },
  {
    id: "py-b16-b5-mmap-prot",
    language: "python",
    title: "mmap.PROT_READ vs PROT_WRITE",
    tag: "structures",
    code: `import mmap, os, tempfile

# Create a temporary file to mmap
with tempfile.NamedTemporaryFile(delete=False) as f:
    f.write(b"Hello mmap world!!")
    fname = f.name

with open(fname, 'r+b') as f:
    # ACCESS_READ: read-only mapping
    ro = mmap.mmap(f.fileno(), 0, access=mmap.ACCESS_READ)
    print(ro[0:5])              # b'Hello'
    ro.close()

    # ACCESS_WRITE: read/write mapping — changes propagate to file
    rw = mmap.mmap(f.fileno(), 0, access=mmap.ACCESS_WRITE)
    rw[0:5] = b'World'
    rw.close()

os.unlink(fname)`,
    explanation: "`mmap.ACCESS_READ` maps the file as read-only while `ACCESS_WRITE` (backed by `PROT_READ|PROT_WRITE`) allows mutation that propagates to the underlying file immediately.",
  },
  {
    id: "py-b16-b5-typing-supports-float",
    language: "python",
    title: "typing.SupportsFloat protocol",
    tag: "types",
    code: `from typing import SupportsFloat

def to_float(x: SupportsFloat) -> float:
    return float(x)

print(to_float(3))          # 3.0
print(to_float("3.14"))     # 3.14
print(to_float(True))       # 1.0

class Temperature:
    def __init__(self, kelvin: float):
        self.k = kelvin
    def __float__(self) -> float:
        return self.k

print(to_float(Temperature(300.15)))   # 300.15`,
    explanation: "`typing.SupportsFloat` is a structural protocol requiring only `__float__`; it's broader than `float` itself and covers strings, integers, and custom objects that define the conversion method.",
  },
  {
    id: "py-b16-b5-round-dunder",
    language: "python",
    title: "__round__ dunder for custom rounding",
    tag: "classes",
    code: `class FixedPoint:
    """Number with fixed decimal places."""
    def __init__(self, value: float, places: int = 2):
        self.value = value
        self.places = places

    def __round__(self, ndigits: int = 0) -> 'FixedPoint':
        return FixedPoint(round(self.value, ndigits), self.places)

    def __repr__(self) -> str:
        return f"FixedPoint({self.value:.{self.places}f})"

fp = FixedPoint(3.14159)
print(round(fp))        # FixedPoint(3.00)
print(round(fp, 2))     # FixedPoint(3.14)`,
    explanation: "`__round__` receives the optional `ndigits` argument from `round(x, n)`, letting custom numeric types integrate with Python's built-in rounding behaviour naturally.",
  },
  {
    id: "py-b16-b5-statistics-mean-int-vs-float",
    language: "python",
    title: "statistics.mean with integers vs floats",
    tag: "caveats",
    code: `import statistics

int_data = [1, 2, 3]
float_data = [1.0, 2.0, 3.0]

# Integer input: uses Fraction internally → returns int or Fraction
print(statistics.mean(int_data))    # 2  (exact integer)

# Float input: standard float arithmetic
print(statistics.mean(float_data))  # 2.0

# Mixed: floats dominate
print(statistics.mean([1, 2, 3.0])) # 2.0

# Large integers stay exact
big = [10**18, 10**18 + 1]
print(statistics.mean(big))         # 1000000000000000000  (exact)`,
    explanation: "`statistics.mean` detects an all-integer input and switches to `Fraction` arithmetic so the result is numerically exact; as soon as any float appears the function falls back to float arithmetic.",
  },
  {
    id: "py-b16-b5-vector-class",
    language: "python",
    title: "Vector class with __add__, __mul__, __abs__",
    tag: "classes",
    code: `import math

class Vector:
    def __init__(self, x: float, y: float):
        self.x = x
        self.y = y

    def __add__(self, other: 'Vector') -> 'Vector':
        return Vector(self.x + other.x, self.y + other.y)

    def __mul__(self, scalar: float) -> 'Vector':
        return Vector(self.x * scalar, self.y * scalar)

    def __rmul__(self, scalar: float) -> 'Vector':
        return self.__mul__(scalar)

    def __abs__(self) -> float:
        return math.hypot(self.x, self.y)   # Euclidean norm

    def __repr__(self) -> str:
        return f"Vector({self.x}, {self.y})"

v1 = Vector(3, 4)
v2 = Vector(1, 2)
print(v1 + v2)      # Vector(4, 6)
print(2 * v1)       # Vector(6, 8)
print(abs(v1))      # 5.0`,
    explanation: "Implementing `__rmul__` mirrors `__mul__` so that `scalar * vector` works too; `math.hypot` computes the Euclidean norm with better numerical stability than `sqrt(x**2 + y**2)`.",
  },
  {
    id: "py-b16-b5-array-vs-list-vs-bytes",
    language: "python",
    title: "array.array vs list vs bytes — typed buffer",
    tag: "families",
    code: `import array, sys

n = 10_000

# list: flexible but stores Python objects — high overhead
lst = list(range(n))
print(sys.getsizeof(lst))               # ~85000 bytes

# array.array: C-level typed buffer — compact
arr = array.array('l', range(n))        # signed long
print(sys.getsizeof(arr))               # ~81920 bytes (8 bytes × n)

# bytes/bytearray: fixed-width unsigned 8-bit only
b = bytearray(n)
print(sys.getsizeof(b))                 # ~10057 bytes`,
    explanation: "`array.array` stores values as raw C-typed values without Python object headers, giving significant memory savings for homogeneous numeric data compared to a list of Python ints.",
  },
  {
    id: "py-b16-b5-complex-division-by-zero",
    language: "python",
    title: "Complex division by zero",
    tag: "caveats",
    code: `# Complex division by zero raises ZeroDivisionError
try:
    result = (1 + 2j) / 0
except ZeroDivisionError as e:
    print(f"Error: {e}")        # complex division by zero

# Division by a complex zero is also an error
try:
    result = (1 + 2j) / (0 + 0j)
except ZeroDivisionError as e:
    print(f"Error: {e}")        # complex division by zero

# But float('inf') complex values are possible
print((1+0j) / 1e-400)          # (inf+0j)`,
    explanation: "Unlike float division by zero which produces `inf` (IEEE-754), complex division by zero raises `ZeroDivisionError`; Python doesn't produce complex infinity for this case.",
  },
  {
    id: "py-b16-b5-typing-supports-complex",
    language: "python",
    title: "typing.SupportsComplex protocol",
    tag: "types",
    code: `from typing import SupportsComplex

def magnitude(x: SupportsComplex) -> float:
    return abs(complex(x))

print(magnitude(3 + 4j))    # 5.0
print(magnitude(5))         # 5.0   (int has __complex__)
print(magnitude(3.0))       # 3.0

class Phasor:
    def __complex__(self) -> complex:
        return 2.0 + 2.0j

print(magnitude(Phasor()))  # 2.8284...`,
    explanation: "`typing.SupportsComplex` requires only `__complex__`, so any numeric type that can be converted to a complex number satisfies it — useful for generic signal-processing code.",
  },
  {
    id: "py-b16-b5-math-log-variants",
    language: "python",
    title: "math.log vs math.log2 vs math.log10",
    tag: "understanding",
    code: `import math

x = 1024

print(math.log(x))          # 6.931... (natural log, base e)
print(math.log(x, 2))       # 10.0     (log base 2 via two-arg form)
print(math.log2(x))         # 10.0     (dedicated, more accurate)
print(math.log10(x))        # 3.0103...

# math.log2 and math.log10 are more numerically accurate than log(x, 2/10)
# because they use the C library's log2/log10 directly
print(math.log2(2**52))     # 52.0  (exact)
print(math.log(2**52, 2))   # 51.99...  (tiny rounding error)`,
    explanation: "`math.log2` and `math.log10` call the corresponding C functions directly and are more accurate than the two-argument `math.log(x, base)` form, which computes `log(x)/log(base)` and accumulates two rounding errors.",
  },
  {
    id: "py-b16-b5-fraction-auto-simplify",
    language: "python",
    title: "Fraction simplification is automatic",
    tag: "understanding",
    code: `from fractions import Fraction

# Fraction always stores in lowest terms
print(Fraction(6, 4))       # 3/2
print(Fraction(100, 25))    # 4/1  (displayed as 4/1, but == 4)
print(Fraction(0, 7))       # 0

# Arithmetic results are also auto-reduced
a = Fraction(1, 3) + Fraction(1, 6)
print(a)                    # 1/2  (not 3/6)

# Denominator is always positive
print(Fraction(3, -4))      # -3/4`,
    explanation: "`Fraction` always reduces itself to lowest terms on construction by dividing numerator and denominator by their GCD, so you never need to simplify manually and storage is always minimal.",
  },
  {
    id: "py-b16-b5-ctypes-create-string-buffer",
    language: "python",
    title: "ctypes.create_string_buffer",
    tag: "structures",
    code: `import ctypes

# Create a mutable C char buffer of 20 bytes
buf = ctypes.create_string_buffer(20)
print(type(buf))            # <class 'ctypes.c_char_Array_20'>
print(len(buf))             # 20

# Initialize with bytes content
buf2 = ctypes.create_string_buffer(b"Hello")
print(buf2.value)           # b'Hello'
print(len(buf2))            # 6  (5 chars + NUL)

# Mutate in place
buf2[0:5] = b"World"
print(buf2.value)           # b'World'`,
    explanation: "`ctypes.create_string_buffer` allocates a mutable C `char[]` on the Python heap, useful when a C function needs a pointer to a writable byte buffer rather than an immutable `bytes` object.",
  },
  {
    id: "py-b16-b5-struct-vs-ctypes",
    language: "python",
    title: "struct vs ctypes — packing vs C interop",
    tag: "families",
    code: `import struct, ctypes

# struct: great for parsing binary protocols / file formats
header = struct.pack('>HHI', 0xFFFE, 1, 256)  # BOM, version, length
bom, ver, length = struct.unpack('>HHI', header)

# ctypes: great for calling C libraries with typed arguments
class Vec2(ctypes.Structure):
    _fields_ = [("x", ctypes.c_float), ("y", ctypes.c_float)]

v = Vec2(1.0, 2.0)
# ctypes.CDLL("mylib.so").process(ctypes.byref(v))

print(bom, ver, length)     # 65534 1 256
print(v.x, v.y)             # 1.0 2.0`,
    explanation: "Use `struct` to encode/decode binary data in a specified byte order (perfect for network packets and file headers), and `ctypes` when you need to pass typed C structures directly into shared library functions.",
  },
  {
    id: "py-b16-b5-floor-ceil-trunc-dunder",
    language: "python",
    title: "__floor__, __ceil__, __trunc__ dunders",
    tag: "classes",
    code: `import math

class Bounded:
    """Float that clamps to [0, 1]."""
    def __init__(self, v: float):
        self.v = max(0.0, min(1.0, v))

    def __floor__(self) -> int:
        return math.floor(self.v)   # 0 for any value in [0,1)

    def __ceil__(self) -> int:
        return math.ceil(self.v)    # 1 for any value in (0,1]

    def __trunc__(self) -> int:
        return math.trunc(self.v)   # same as int()

    def __repr__(self) -> str:
        return f"Bounded({self.v})"

b = Bounded(0.7)
print(math.floor(b))    # 0
print(math.ceil(b))     # 1
print(math.trunc(b))    # 0`,
    explanation: "`math.floor`, `math.ceil`, and `math.trunc` dispatch to the `__floor__`, `__ceil__`, and `__trunc__` dunders respectively, so custom numeric types can define their own integer-rounding behaviour.",
  },
  {
    id: "py-b16-b5-decimal-vs-float-01",
    language: "python",
    title: "Decimal('0.1') != float 0.1",
    tag: "caveats",
    code: `from decimal import Decimal

# float 0.1 is not exactly 0.1 in binary
f = 0.1
print(f"{f:.20f}")              # 0.10000000000000000555...

# Decimal('0.1') IS exactly 0.1 (decimal representation)
d = Decimal('0.1')
print(d)                        # 0.1  (exact)

# Converting a float to Decimal captures the float's imprecision
print(Decimal(0.1))             # 0.1000000000000000055511...

# Always use string constructor for exact decimals
print(Decimal('0.1') == Decimal(0.1))   # False`,
    explanation: "Always construct `Decimal` from a string literal; passing a float like `Decimal(0.1)` captures the binary float's inherent imprecision, defeating the purpose of using `Decimal`.",
  },
  {
    id: "py-b16-b5-typing-supports-bytes",
    language: "python",
    title: "typing.SupportsBytes protocol",
    tag: "types",
    code: `from typing import SupportsBytes

def serialize(x: SupportsBytes) -> bytes:
    return bytes(x)

print(serialize(b"hello"))      # b'hello'
print(serialize(bytearray(3)))  # b'\\x00\\x00\\x00'

class Config:
    def __bytes__(self) -> bytes:
        return b"host=localhost;port=8080"

print(serialize(Config()))      # b'host=localhost;port=8080'`,
    explanation: "`typing.SupportsBytes` is satisfied by any class with `__bytes__`; it lets you annotate parameters that can be converted with `bytes()` without requiring a concrete type.",
  },
  {
    id: "py-b16-b5-numbers-real-custom",
    language: "python",
    title: "numbers.Real custom number subclass",
    tag: "classes",
    code: `import numbers, math

class Celsius(numbers.Real):
    def __init__(self, degrees: float):
        self._deg = float(degrees)

    # Required abstract methods (minimal set shown)
    def __float__(self): return self._deg
    def __abs__(self): return Celsius(abs(self._deg))
    def __neg__(self): return Celsius(-self._deg)
    def __pos__(self): return Celsius(self._deg)
    def __add__(self, other): return Celsius(self._deg + float(other))
    def __radd__(self, other): return Celsius(float(other) + self._deg)
    def __mul__(self, other): return Celsius(self._deg * float(other))
    def __rmul__(self, other): return Celsius(float(other) * self._deg)
    def __truediv__(self, other): return Celsius(self._deg / float(other))
    def __rtruediv__(self, other): return Celsius(float(other) / self._deg)
    def __rpow__(self, base, mod=None): return NotImplemented
    def __pow__(self, exp, mod=None): return Celsius(self._deg ** float(exp))
    def __trunc__(self): return int(self._deg)
    def __floor__(self): return math.floor(self._deg)
    def __ceil__(self): return math.ceil(self._deg)
    def __round__(self, n=0): return round(self._deg, n)
    def __floordiv__(self, other): return Celsius(self._deg // float(other))
    def __rfloordiv__(self, other): return Celsius(float(other) // self._deg)
    def __mod__(self, other): return Celsius(self._deg % float(other))
    def __rmod__(self, other): return Celsius(float(other) % self._deg)
    def __lt__(self, other): return self._deg < float(other)
    def __le__(self, other): return self._deg <= float(other)
    def __eq__(self, other): return self._deg == float(other)
    def __repr__(self): return f"Celsius({self._deg})"

t = Celsius(100.0)
print(isinstance(t, numbers.Real))      # True
print(t + Celsius(20))                  # Celsius(120.0)`,
    explanation: "Subclassing `numbers.Real` requires a large set of abstract methods covering arithmetic, comparison, and rounding; once complete the class integrates with numeric protocols like `min`, `max`, and `sorted`.",
  },
  {
    id: "py-b16-b5-ctypes-cdll-nativemem",
    language: "python",
    title: "ctypes.cdll — NativeMemory pattern (alloc/free)",
    tag: "snippet",
    code: `import ctypes, ctypes.util

libc = ctypes.CDLL(ctypes.util.find_library('c'))

libc.malloc.restype  = ctypes.c_void_p
libc.malloc.argtypes = [ctypes.c_size_t]
libc.free.restype    = None
libc.free.argtypes   = [ctypes.c_void_p]

# Allocate 16 bytes of unmanaged memory
ptr = libc.malloc(16)
print(hex(ptr))         # e.g. 0x55f4a3b2c040

# Always free to avoid leaks
libc.free(ptr)
print("freed OK")`,
    explanation: "Calling `malloc`/`free` through ctypes gives you manual control over unmanaged heap memory; always declare `restype` and `argtypes` so ctypes knows how to marshal the pointer-sized return value.",
  },
  {
    id: "py-b16-b5-memoryview-vs-bytes-bytearray",
    language: "python",
    title: "memoryview vs bytes vs bytearray — zero-copy",
    tag: "families",
    code: `data = bytearray(b"ABCDEFGHIJKLMNOP")

# bytes slice: always copies
s = bytes(data[4:8])
print(id(s) == id(data))        # False (new object)

# memoryview slice: zero-copy view
mv = memoryview(data)[4:8]
print(bytes(mv))                # b'EFGH'
mv[0] = ord('e')                # modify original buffer
print(data[4:8])                # bytearray(b'eFGH')

# bytes is immutable — memoryview of bytes is read-only
ro = memoryview(b"immutable")
print(ro[0])                    # 105`,
    explanation: "Slicing `bytes` or `bytearray` always copies data, but slicing a `memoryview` produces a zero-copy view; writable views let you modify the original buffer without any allocation.",
  },
  {
    id: "py-b16-b5-typing-supports-abs",
    language: "python",
    title: "typing.SupportsAbs protocol",
    tag: "types",
    code: `from typing import SupportsAbs

def magnitude(x: SupportsAbs[float]) -> float:
    return abs(x)

print(magnitude(-5))            # 5
print(magnitude(-3.14))         # 3.14
print(magnitude(3 + 4j))        # 5.0

class Velocity:
    def __init__(self, v: float):
        self.v = v
    def __abs__(self) -> float:
        return abs(self.v)

print(magnitude(Velocity(-10.0)))  # 10.0`,
    explanation: "`typing.SupportsAbs[T]` is generic in the return type of `__abs__`, letting you express that `abs(x)` produces a `float` (or whatever T is) without constraining the input to a specific class.",
  },
  {
    id: "py-b16-b5-complex-custom",
    language: "python",
    title: "__complex__ conversion dunder",
    tag: "classes",
    code: `class Polar:
    """Complex number in polar form (magnitude, angle_radians)."""
    def __init__(self, r: float, theta: float):
        self.r = r
        self.theta = theta

    def __complex__(self) -> complex:
        import cmath
        return cmath.rect(self.r, self.theta)

    def __repr__(self) -> str:
        return f"Polar(r={self.r}, θ={self.theta:.4f})"

import math
p = Polar(5, math.pi / 4)   # 45 degrees
z = complex(p)
print(z)                    # (3.535...+3.535...j)
print(abs(z))               # 5.0`,
    explanation: "Defining `__complex__` allows `complex(myobj)` to work and also enables implicit conversion in arithmetic with complex numbers; return `cmath.rect(r, theta)` to convert from polar form.",
  },
  {
    id: "py-b16-b5-typing-supports-round",
    language: "python",
    title: "typing.SupportsRound protocol",
    tag: "types",
    code: `from typing import SupportsRound

def snap(x: SupportsRound[int], decimals: int = 0) -> int:
    return round(x, decimals)

print(snap(3.7))            # 4
print(snap(2.5))            # 2  (banker's rounding)

class Budget:
    def __init__(self, amount: float):
        self.amount = amount
    def __round__(self, ndigits: int = 0) -> int:
        return int(round(self.amount, ndigits))

print(snap(Budget(19.99)))  # 20`,
    explanation: "`typing.SupportsRound[T]` is parameterized on the return type of `__round__`; annotating with it is more precise than `float` because it works with any custom type that can be rounded.",
  },
  {
    id: "py-b16-b5-format-dunder",
    language: "python",
    title: "__format__ custom format spec",
    tag: "classes",
    code: `class Money:
    def __init__(self, amount: float, currency: str = "USD"):
        self.amount = amount
        self.currency = currency

    def __format__(self, spec: str) -> str:
        if spec == 'short':
            return f"{self.currency}{self.amount:.0f}"
        elif spec == 'long':
            return f"{self.amount:.2f} {self.currency}"
        # Fall back to standard float formatting for numeric specs
        return f"{self.amount:{spec}}"

m = Money(1234.567)
print(f"{m:short}")     # USD1235
print(f"{m:long}")      # 1234.57 USD
print(f"{m:.1f}")       # 1234.6`,
    explanation: "`__format__` receives the format spec string (everything after the colon in an f-string) so you can define a domain-specific mini-language for your type while still delegating to standard specs when appropriate.",
  },
  {
    id: "py-b16-b5-statistics-stdev-vs-pstdev",
    language: "python",
    title: "statistics vs numpy-style (stdlib vs third-party)",
    tag: "families",
    code: `import statistics

data = [2.0, 4.0, 4.0, 4.0, 5.0, 5.0, 7.0, 9.0]

# stdlib: pure Python, exact with Fraction for ints, no dependencies
print(statistics.mean(data))    # 5.0
print(statistics.stdev(data))   # 2.0   (sample, ddof=1)
print(statistics.pstdev(data))  # 2.0   (population, ddof=0)

# numpy (if available) is vectorized and 10-100x faster for large data
# import numpy as np
# arr = np.array(data)
# print(arr.mean(), arr.std(ddof=1), arr.std(ddof=0))`,
    explanation: "`statistics` is zero-dependency and exact for small datasets; NumPy or SciPy are the right choice for large arrays where vectorized C-level operations provide orders-of-magnitude speedups.",
  },
  {
    id: "py-b16-b5-index-dunder",
    language: "python",
    title: "__index__ for sequence indexing",
    tag: "classes",
    code: `class Ordinal:
    """Wraps an integer so it can be used as a sequence index."""
    def __init__(self, n: int):
        self.n = n

    def __index__(self) -> int:
        return self.n

    def __repr__(self) -> str:
        return f"Ordinal({self.n})"

items = ['a', 'b', 'c', 'd']
i = Ordinal(2)

print(items[i])             # 'c'   (__index__ called implicitly)
print(items[i:])            # ['c', 'd']
print(bin(i))               # '0b10'  (also uses __index__)`,
    explanation: "`__index__` is required for any type that wants to behave as a lossless integer in sequence indexing and slicing; Python calls it instead of `__int__` because `__int__` can be lossy (e.g., truncating floats).",
  },
  {
    id: "py-b16-b5-bytes-dunder",
    language: "python",
    title: "__bytes__ conversion dunder",
    tag: "classes",
    code: `class IPv4:
    def __init__(self, address: str):
        self._parts = [int(p) for p in address.split('.')]
        if len(self._parts) != 4 or not all(0 <= p <= 255 for p in self._parts):
            raise ValueError(f"Invalid IPv4: {address}")

    def __bytes__(self) -> bytes:
        return bytes(self._parts)   # 4-byte network representation

    def __repr__(self) -> str:
        return '.'.join(str(p) for p in self._parts)

addr = IPv4('192.168.1.1')
print(bytes(addr))          # b'\\xc0\\xa8\\x01\\x01'
print(len(bytes(addr)))     # 4`,
    explanation: "`__bytes__` is called by `bytes(obj)` and should return the most natural binary encoding of the object; for an IPv4 address that's the four-octet network representation.",
  },
  {
    id: "py-b16-b5-numeric-tower-registration",
    language: "python",
    title: "Numeric tower registration with ABC",
    tag: "classes",
    code: `import numbers

class FixedInt:
    """Third-party integer-like class (can't inherit from numbers.Integral)."""
    def __init__(self, val: int):
        self._val = int(val)
    def __int__(self) -> int:
        return self._val
    def __repr__(self) -> str:
        return f"FixedInt({self._val})"

# Register without inheriting — virtual subclass
numbers.Integral.register(FixedInt)

fi = FixedInt(5)
print(isinstance(fi, numbers.Integral))   # True
print(isinstance(fi, numbers.Number))     # True (transitively)`,
    explanation: "Calling `numbers.Integral.register(MyClass)` makes `isinstance` checks pass without requiring inheritance, letting you retrofit third-party or C-extension types into the numeric tower.",
  },
  {
    id: "py-b16-b5-statistics-quantiles-inclusive",
    language: "python",
    title: "statistics.quantiles method parameter",
    tag: "snippet",
    code: `import statistics

scores = list(range(0, 101))   # 0 to 100

# method='inclusive' treats min and max as the 0th and 100th percentiles
q_inc = statistics.quantiles(scores, n=4, method='inclusive')
print(q_inc)    # [25.0, 50.0, 75.0]

# method='exclusive' treats them as outside the sample
q_exc = statistics.quantiles(scores, n=4, method='exclusive')
print(q_exc)    # [25.5, 50.5, 75.5]

# The difference matters most for small datasets
small = [1, 2, 3, 4, 5]
print(statistics.quantiles(small, n=4, method='inclusive'))`,
    explanation: "The `method` parameter controls where the 0th and 100th percentiles are assumed to lie; `'inclusive'` (default before 3.12) includes them in the range, while `'exclusive'` assumes the population extends beyond the sample.",
  },
  {
    id: "py-b16-b5-math-isfinite",
    language: "python",
    title: "math.isfinite, isinf, isnan",
    tag: "snippet",
    code: `import math

values = [1.0, float('inf'), float('-inf'), float('nan'), 0.0]

for v in values:
    print(f"{str(v):>6}  finite={math.isfinite(v)}  "
          f"isinf={math.isinf(v)}  isnan={math.isnan(v)}")
# 1.0    finite=True  isinf=False  isnan=False
# inf    finite=False isinf=True   isnan=False
# -inf   finite=False isinf=True   isnan=False
# nan    finite=False isinf=False  isnan=True
# 0.0    finite=True  isinf=False  isnan=False`,
    explanation: "`math.isfinite` is the most useful guard: it returns `True` only for ordinary numbers, rejecting both infinities and NaN in a single check — use it to validate inputs before doing arithmetic.",
  },
  {
    id: "py-b16-b5-math-copysign",
    language: "python",
    title: "math.copysign — transfer sign between floats",
    tag: "snippet",
    code: `import math

# math.copysign(x, y) returns x with the sign of y
print(math.copysign(5.0, -3.0))    # -5.0
print(math.copysign(-5.0, 3.0))    #  5.0
print(math.copysign(0.0, -1.0))    # -0.0  (negative zero preserved)

# Useful for implementing abs() manually
def my_abs(x):
    return math.copysign(x, 1.0)   # force positive sign

print(my_abs(-7.5))    # 7.5
print(my_abs(3.0))     # 3.0`,
    explanation: "`math.copysign` is the portable way to strip or transfer the IEEE-754 sign bit, including the edge case of negative zero which `abs()` would also handle but where plain negation is ambiguous.",
  },
  {
    id: "py-b16-b5-math-fsum",
    language: "python",
    title: "math.fsum — compensated floating-point sum",
    tag: "snippet",
    code: `import math

values = [0.1] * 10   # ten copies of 0.1

# Built-in sum accumulates rounding errors
print(sum(values))       # 0.9999999999999999

# math.fsum uses compensated summation (Shewchuk algorithm)
print(math.fsum(values)) # 1.0  (exact in this case)

# More dramatic example
big = [1e16, 1.0, -1e16]
print(sum(big))           # 0.0  (catastrophic cancellation)
print(math.fsum(big))     # 1.0  (correct)`,
    explanation: "`math.fsum` uses extended-precision intermediate sums to avoid catastrophic cancellation; it's slower than `sum` but essential when adding numbers of very different magnitudes.",
  },
  {
    id: "py-b16-b5-math-hypot",
    language: "python",
    title: "math.hypot — Euclidean distance",
    tag: "snippet",
    code: `import math

# Two-argument form: classic Pythagorean theorem
print(math.hypot(3, 4))         # 5.0

# Multi-argument form (Python 3.8+): n-dimensional Euclidean norm
point = (1, 2, 2)
print(math.hypot(*point))       # 3.0  (sqrt(1+4+4))

# More numerically stable than sqrt(x**2 + y**2) for extreme values
x, y = 1e200, 1e200
print(x**2 + y**2)              # inf (overflow!)
print(math.hypot(x, y))         # 1.4142...e+200 (correct)`,
    explanation: "`math.hypot` uses an internal scaling trick that avoids overflow and underflow when squaring large or tiny values, making it safer than the naive `sqrt(x**2 + y**2)` formula.",
  },
  {
    id: "py-b16-b5-random-gauss",
    language: "python",
    title: "random.gauss and random.normalvariate",
    tag: "snippet",
    code: `import random, statistics

random.seed(42)

# Gaussian (normal) distribution: mu=mean, sigma=std dev
samples = [random.gauss(mu=0, sigma=1) for _ in range(10_000)]

print(f"mean:  {statistics.mean(samples):.4f}")   # ~0.0
print(f"stdev: {statistics.stdev(samples):.4f}")  # ~1.0

# normalvariate is thread-safe; gauss is slightly faster (no locks)
print(random.normalvariate(mu=100, sigma=15))      # IQ-scale sample`,
    explanation: "`random.gauss` is marginally faster than `random.normalvariate` because it's not thread-safe (it caches one value between calls); use `normalvariate` in multi-threaded code where multiple threads share the global RNG.",
  },
  {
    id: "py-b16-b5-math-remainder",
    language: "python",
    title: "math.remainder — IEEE-754 remainder",
    tag: "snippet",
    code: `import math

# math.remainder uses round-half-to-even for the quotient
print(math.remainder(7.0, 3.0))    # 1.0    (7 = 2*3 + 1)
print(math.remainder(8.0, 3.0))    # -1.0   (8 = 3*3 - 1, since 3 rounds to even)
print(math.remainder(-7.0, 3.0))   # -1.0

# Python's % operator uses floor division — different result for negatives
print(-7.0 % 3.0)                  # 2.0   (different!)

# math.remainder result is in [-y/2, y/2]
y = 3.0
print(abs(math.remainder(100.7, y)) <= y / 2)  # True always`,
    explanation: "`math.remainder` implements the IEEE-754 `remainder` operation whose result lies in [−y/2, y/2]; it differs from Python's `%` operator (which uses floor division) for any case where the quotient rounds up.",
  },
  {
    id: "py-b16-b5-statistics-harmonic-mean",
    language: "python",
    title: "statistics.harmonic_mean",
    tag: "snippet",
    code: `import statistics

# Harmonic mean: useful for rates (speed, price-earnings ratios)
speeds = [60, 80, 120]   # km/h for three equal-distance segments

# Arithmetic mean overestimates the average speed
print(statistics.mean(speeds))          # 86.67 km/h  (wrong)

# Harmonic mean gives the correct time-weighted average speed
print(statistics.harmonic_mean(speeds)) # 82.19 km/h  (correct)

# Formula: n / sum(1/x_i)
n = len(speeds)
manual = n / sum(1/x for x in speeds)
print(round(manual, 2))                 # 82.19`,
    explanation: "`statistics.harmonic_mean` is the correct average for rates where equal *distances* (not times) are covered — the arithmetic mean over-weights the slow leg because it takes longer.",
  },
  {
    id: "py-b16-b5-statistics-geometric-mean",
    language: "python",
    title: "statistics.geometric_mean",
    tag: "snippet",
    code: `import statistics

# Geometric mean: correct average for multiplicative quantities (growth rates)
annual_returns = [1.10, 0.90, 1.20, 1.05]  # 10%, -10%, 20%, 5%

# Arithmetic mean suggests 6.25% per year — too optimistic
arith = (sum(annual_returns) / len(annual_returns) - 1) * 100
print(f"arithmetic: {arith:.2f}%")      # 6.25%

# Geometric mean captures compounding correctly
geo = (statistics.geometric_mean(annual_returns) - 1) * 100
print(f"geometric:  {geo:.2f}%")        # ~5.68%  (actual CAGR)`,
    explanation: "`statistics.geometric_mean` computes the nth root of the product of all values; for investment returns and other multiplicative processes it gives the correct compound average rate that the arithmetic mean overstates.",
  },
  {
    id: "py-b16-b5-fractions-limit-denominator",
    language: "python",
    title: "Fraction.limit_denominator — best rational approximation",
    tag: "snippet",
    code: `from fractions import Fraction
import math

# Find the simplest fraction close to a float
pi_approx = Fraction(math.pi).limit_denominator(100)
print(pi_approx)                    # 311/99  (or similar)

# Classic approximation
print(Fraction(math.pi).limit_denominator(7))   # 22/7

# Recover the exact fraction from a repeating decimal
thirds = Fraction(0.333333333).limit_denominator(10)
print(thirds)                       # 1/3`,
    explanation: "`limit_denominator(max_d)` uses the Stern-Brocot tree to find the closest fraction whose denominator does not exceed `max_d`; it's the idiomatic way to convert a float approximation back to a human-readable fraction.",
  },
  {
    id: "py-b16-b5-complex-conjugate-mul",
    language: "python",
    title: "Complex conjugate multiplication for magnitude squared",
    tag: "understanding",
    code: `# |z|^2 = z * z.conjugate()  — avoids sqrt for magnitude comparisons

z = 3 + 4j
mag_sq = (z * z.conjugate()).real    # always real and non-negative
print(mag_sq)                        # 25.0

import math
print(math.isclose(mag_sq, abs(z)**2))  # True

# Useful for comparing magnitudes without sqrt overhead
a, b = 3+4j, 5+0j
print(abs(a) < abs(b))               # False (5 == 5)
a_sq = (a * a.conjugate()).real
b_sq = (b * b.conjugate()).real
print(a_sq < b_sq)                   # False`,
    explanation: "Multiplying a complex number by its conjugate gives |z|² as a real number; this avoids the square root in `abs()` when you only need to *compare* magnitudes, saving a sqrt call per comparison.",
  },
  {
    id: "py-b16-b5-decimal-to-float-precision",
    language: "python",
    title: "Decimal to float precision loss",
    tag: "caveats",
    code: `from decimal import Decimal, getcontext

getcontext().prec = 50

# High-precision Decimal computation
result = Decimal(1) / Decimal(7)
print(result)
# 0.14285714285714285714285714285714285714285714285714

# Converting to float truncates to 53 significant binary bits (~15-17 decimal digits)
as_float = float(result)
print(as_float)           # 0.14285714285714285

# The lost digits are gone — cannot recover them from the float
print(Decimal(as_float))  # 0.1428571428571428...  (float's inherent imprecision)`,
    explanation: "Converting a high-precision `Decimal` to `float` discards all but ~15-17 decimal digits of precision; once converted, the information is irrecoverably lost — keep values as `Decimal` throughout if precision matters.",
  },
  {
    id: "py-b16-b5-math-tau",
    language: "python",
    title: "math.tau — full circle constant",
    tag: "snippet",
    code: `import math

# tau = 2*pi — the full-circle radian constant (Python 3.6+)
print(math.tau)                   # 6.283185307179586

# Angles as fractions of a full turn are cleaner with tau
quarter_turn = math.tau / 4      # 90 degrees
half_turn    = math.tau / 2      # 180 degrees

print(math.sin(quarter_turn))    # 1.0
print(math.cos(half_turn))       # -1.0

# Converting degrees to radians with tau
def to_rad(degrees):
    return degrees * math.tau / 360

print(to_rad(45))                # 0.7853...  (pi/4)`,
    explanation: "`math.tau` is 2π and is increasingly preferred in mathematics education because angles as fractions of one full turn (τ/4 for 90°) are more intuitive than fractions of half a turn with π.",
  },
  {
    id: "py-b16-b5-random-betavariate",
    language: "python",
    title: "random.betavariate for probability sampling",
    tag: "snippet",
    code: `import random, statistics

random.seed(0)

# Beta distribution: values always in [0, 1], shaped by alpha and beta params
# alpha=beta=1 → uniform
# alpha=beta=5 → concentrated near 0.5
# alpha=2, beta=8 → skewed left (near 0)

samples_uniform = [random.betavariate(1, 1) for _ in range(5_000)]
samples_peaked  = [random.betavariate(5, 5) for _ in range(5_000)]

print(f"uniform mean:  {statistics.mean(samples_uniform):.3f}")  # ~0.500
print(f"peaked mean:   {statistics.mean(samples_peaked):.3f}")   # ~0.500
print(f"peaked stdev:  {statistics.stdev(samples_peaked):.3f}")  # ~0.149`,
    explanation: "`random.betavariate(α, β)` samples from the Beta distribution, which always falls in [0, 1] and is commonly used to model probabilities, proportions, and Bayesian priors.",
  },
  {
    id: "py-b16-b5-math-degrees-radians",
    language: "python",
    title: "math.degrees and math.radians",
    tag: "snippet",
    code: `import math

# Convert between radians and degrees
print(math.degrees(math.pi))        # 180.0
print(math.degrees(math.pi / 4))    # 45.0

print(math.radians(180))            # 3.141592653589793
print(math.radians(45))             # 0.7853981633974483

# Useful when interfacing with libraries that use degrees
angle_deg = 30
sin_val = math.sin(math.radians(angle_deg))
print(f"sin({angle_deg}°) = {sin_val:.4f}")  # 0.5000`,
    explanation: "`math.degrees` and `math.radians` are thin wrappers for `× 180/π` and `× π/180`; they're clearer than the formula inline and avoid the common mistake of forgetting the direction of conversion.",
  },
  {
    id: "py-b16-b5-cmath-isclose",
    language: "python",
    title: "cmath.isclose for complex numbers",
    tag: "snippet",
    code: `import cmath, math

# cmath.isclose compares complex numbers with tolerance
a = cmath.exp(1j * math.pi) + 1   # should be ~0+0j (Euler's identity)
print(a)                            # (-0+1.2246...e-16j)  (not exactly zero)

# Absolute tolerance handles the near-zero case
print(cmath.isclose(a, 0, abs_tol=1e-9))  # True

b = 3.0 + 4.0j
c = 3.0 + 4.0j + 1e-12j
print(cmath.isclose(b, c))                # True (rel_tol=1e-9 default)`,
    explanation: "`cmath.isclose` applies the same rel_tol/abs_tol logic as `math.isclose` but to complex numbers by comparing their absolute difference |a−b|; it's essential when checking results of complex trigonometric or exponential identities.",
  },
  {
    id: "py-b16-b5-statistics-covariance-correlation",
    language: "python",
    title: "statistics.covariance and correlation",
    tag: "snippet",
    code: `import statistics

x = [1, 2, 3, 4, 5]
y = [2, 4, 5, 4, 5]

print(statistics.covariance(x, y))     # 2.0  (positive relationship)

# Pearson correlation coefficient: covariance / (stdev_x * stdev_y)
r = statistics.correlation(x, y)
print(f"r = {r:.4f}")                  # 0.8165  (strong positive)

# Perfect correlation
print(statistics.correlation([1,2,3], [2,4,6]))  # 1.0`,
    explanation: "`statistics.covariance` and `statistics.correlation` were added in Python 3.10; `correlation` returns the Pearson r coefficient (−1 to 1), which measures linear association without requiring NumPy.",
  },
  {
    id: "py-b16-b5-math-comb-binomial-coeff",
    language: "python",
    title: "Using math.comb for binomial probability",
    tag: "snippet",
    code: `import math

def binomial_prob(n: int, k: int, p: float) -> float:
    """P(X=k) for X ~ Binomial(n, p)."""
    return math.comb(n, k) * (p ** k) * ((1 - p) ** (n - k))

# Probability of exactly 3 heads in 10 fair coin flips
print(f"{binomial_prob(10, 3, 0.5):.6f}")   # 0.117188

# Probability of 0 successes in 5 trials with p=0.2
print(f"{binomial_prob(5, 0, 0.2):.6f}")    # 0.327680

# Sum of all outcomes = 1
total = sum(binomial_prob(10, k, 0.3) for k in range(11))
print(f"{total:.10f}")                       # 1.0000000000`,
    explanation: "Combining `math.comb` (exact integer coefficient) with float power arithmetic gives an accurate binomial PMF; the exact integer path for the combination avoids precision loss from approximating C(n,k) as a float.",
  },
  {
    id: "py-b16-b5-math-nextafter",
    language: "python",
    title: "math.nextafter — adjacent float values",
    tag: "snippet",
    code: `import math

x = 1.0
# The next representable float toward +inf
above = math.nextafter(x, math.inf)
print(above)                        # 1.0000000000000002
print(above - x)                    # 2.220446049250313e-16  (machine epsilon)

# Next float toward -inf
below = math.nextafter(x, -math.inf)
print(x - below)                    # 1.1102230246251565e-16

# Useful for computing ULP (unit in the last place) errors
# math.ulp(x) gives the distance to the next float directly
print(math.ulp(1.0))               # 2.220446049250313e-16`,
    explanation: "`math.nextafter(x, y)` returns the next representable IEEE-754 float from x in the direction of y; combined with `math.ulp` it lets you measure and compare floating-point errors in units of machine epsilon.",
  },
  {
    id: "py-b16-b5-typing-supports-index",
    language: "python",
    title: "typing.SupportsIndex protocol",
    tag: "types",
    code: `from typing import SupportsIndex

def nth_item(seq: list, n: SupportsIndex) -> object:
    return seq[n]

print(nth_item(['a', 'b', 'c'], 1))   # 'b'
print(nth_item(['a', 'b', 'c'], True)) # 'b' (bool.__index__ = int value)

class Rank:
    def __init__(self, n: int): self.n = n
    def __index__(self) -> int: return self.n

print(nth_item(['a', 'b', 'c'], Rank(2)))  # 'c'`,
    explanation: "`typing.SupportsIndex` matches any type with `__index__`; unlike `SupportsInt` it guarantees the value is a *lossless* integer, so it's the precise annotation for sequence subscripting and `range` arguments.",
  },
  {
    id: "py-b16-b5-math-dist",
    language: "python",
    title: "math.dist — Euclidean distance between points",
    tag: "snippet",
    code: `import math

p = (0, 0)
q = (3, 4)
print(math.dist(p, q))          # 5.0

# Works in any number of dimensions
a = (1, 2, 3)
b = (4, 6, 3)
print(math.dist(a, b))          # 5.0  (sqrt(9+16+0))

# Points must have the same dimension
# math.dist((0,0), (1,2,3))  → ValueError

# Numerically stable for extreme values (uses hypot internally)
print(math.dist((0,), (1e300,)))  # 1e300`,
    explanation: "`math.dist(p, q)` computes the Euclidean distance between two equal-length points in any number of dimensions; it delegates to `math.hypot` internally for numerical stability against overflow.",
  },
  {
    id: "py-b16-b5-numbers-tower-isinstance",
    language: "python",
    title: "Numeric tower isinstance — tower hierarchy",
    tag: "understanding",
    code: `import numbers

# The tower: Number > Complex > Real > Rational > Integral
x = 5   # int

print(isinstance(x, numbers.Number))   # True
print(isinstance(x, numbers.Complex))  # True
print(isinstance(x, numbers.Real))     # True
print(isinstance(x, numbers.Rational)) # True
print(isinstance(x, numbers.Integral)) # True

y = 3.14
print(isinstance(y, numbers.Integral)) # False
print(isinstance(y, numbers.Real))     # True

z = 1+2j
print(isinstance(z, numbers.Real))     # False
print(isinstance(z, numbers.Complex))  # True`,
    explanation: "The numeric tower is a hierarchy of ABCs: every `Integral` is a `Rational`, every `Rational` is a `Real`, every `Real` is a `Complex`, and every `Complex` is a `Number` — so `isinstance(int_val, numbers.Complex)` is `True`.",
  },
  {
    id: "py-b16-b5-ctypes-byref",
    language: "python",
    title: "ctypes.byref for pass-by-reference to C",
    tag: "structures",
    code: `import ctypes, ctypes.util

libc = ctypes.CDLL(ctypes.util.find_library('c'))

# div_t is a struct with quot and rem fields
class DivResult(ctypes.Structure):
    _fields_ = [("quot", ctypes.c_int), ("rem", ctypes.c_int)]

libc.div.restype  = DivResult
libc.div.argtypes = [ctypes.c_int, ctypes.c_int]

result = libc.div(17, 5)
print(f"quot={result.quot} rem={result.rem}")   # quot=3 rem=2

# byref() creates a lightweight pointer for output parameters
n = ctypes.c_int(0)
# some_func(ctypes.byref(n))  # n.value updated by C function`,
    explanation: "`ctypes.byref(obj)` creates a by-reference pointer more efficiently than `ctypes.pointer(obj)` for passing output parameters to C functions; the pointer object itself is not materialised as a full Python object.",
  },
  {
    id: "py-b16-b5-statistics-variance",
    language: "python",
    title: "statistics.variance and pvariance",
    tag: "snippet",
    code: `import statistics

data = [2, 4, 4, 4, 5, 5, 7, 9]

# Sample variance (ddof=1): use when data is a sample from a population
sv = statistics.variance(data)
print(sv)                           # 4.571428...

# Population variance (ddof=0): use when data IS the entire population
pv = statistics.pvariance(data)
print(pv)                           # 4.0

# stdev is just sqrt(variance) — verify
import math
print(math.isclose(statistics.stdev(data), math.sqrt(sv)))   # True`,
    explanation: "`statistics.variance` divides by n−1 (Bessel's correction for sample variance) while `statistics.pvariance` divides by n; choose based on whether your data is a sample or the complete population.",
  },
  {
    id: "py-b16-b5-ctypes-wintypes",
    language: "python",
    title: "ctypes.c_double array — typed numeric buffer",
    tag: "structures",
    code: `import ctypes

# Create a C array type: c_double * 5
DoubleArray5 = ctypes.c_double * 5

arr = DoubleArray5(1.1, 2.2, 3.3, 4.4, 5.5)

# Access like a Python sequence
print(list(arr))                    # [1.1, 2.2, 3.3, 4.4, 5.5]
print(arr[2])                       # 3.3
print(ctypes.sizeof(arr))           # 40 bytes (5 × 8)

# Can be cast to a pointer for C function calls
ptr = ctypes.cast(arr, ctypes.POINTER(ctypes.c_double))
print(ptr[0])                       # 1.1`,
    explanation: "Multiplying a ctypes type by an integer creates a fixed-length C array type; the resulting object is a contiguous block of C-typed values and can be cast to a pointer for passing to numeric C functions.",
  },
  {
    id: "py-b16-b5-math-erf-erfc",
    language: "python",
    title: "math.erf and math.erfc — error function",
    tag: "snippet",
    code: `import math

# erf(x): probability that a normal RV falls within x standard deviations
# P(-x ≤ Z ≤ x) = erf(x / sqrt(2))

def normal_cdf(x, mu=0.0, sigma=1.0):
    """CDF of the standard normal distribution."""
    return 0.5 * (1 + math.erf((x - mu) / (sigma * math.sqrt(2))))

print(normal_cdf(0))    # 0.5  (median)
print(normal_cdf(1))    # 0.8413...  (68% rule: +1σ)
print(normal_cdf(-1))   # 0.1587...

# erfc(x) = 1 - erf(x), but more accurate near x=0
print(math.erfc(0))     # 1.0`,
    explanation: "`math.erf` computes the Gauss error function used in probability and statistics; it's numerically stable across the full real line and enables computing normal CDF values without importing `scipy`.",
  },
  {
    id: "py-b16-b5-array-buffer-protocol",
    language: "python",
    title: "array.array and the buffer protocol",
    tag: "structures",
    code: `import array

# array.array implements the buffer protocol
nums = array.array('f', [1.0, 2.0, 3.0, 4.0])   # C float (4 bytes each)

# memoryview gives zero-copy access to the raw bytes
mv = memoryview(nums)
print(mv.format)            # 'f'  (format code)
print(mv.itemsize)          # 4
print(mv.nbytes)            # 16

# Convert to bytes (copy) or reinterpret as bytes view
raw = bytes(nums)
print(len(raw))             # 16

# Write to/from files in binary format directly
import io
buf = io.BytesIO()
nums.tofile(buf)
print(buf.tell())           # 16`,
    explanation: "`array.array` exposes its internal C buffer through the buffer protocol so `memoryview`, NumPy, and file I/O methods can access or stream the raw bytes without any copying.",
  },
  {
    id: "py-b16-b5-stats-linear-regression",
    language: "python",
    title: "statistics.linear_regression",
    tag: "snippet",
    code: `import statistics

x = [1, 2, 3, 4, 5]
y = [2.2, 4.1, 5.8, 8.3, 10.1]

slope, intercept = statistics.linear_regression(x, y)
print(f"y = {slope:.4f}x + {intercept:.4f}")
# y = 1.9900x + 0.1600  (approximately)

# Predict a value
x_new = 6
y_pred = slope * x_new + intercept
print(f"y({x_new}) ≈ {y_pred:.2f}")   # ~12.10

# Pearson r for goodness of fit
r = statistics.correlation(x, y)
print(f"R² ≈ {r**2:.4f}")              # 0.9994`,
    explanation: "`statistics.linear_regression` (Python 3.10+) fits a line by ordinary least squares and returns `(slope, intercept)` as a named tuple; combine with `statistics.correlation` for R² without NumPy.",
  },
];

