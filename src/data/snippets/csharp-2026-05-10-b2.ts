import type { Snippet } from "./types";

export const csharpSnippets20260510B2: Snippet[] = [
  // ── snippet ──────────────────────────────────────────────────────────────
  {
    id: "cs-file-scoped-namespace",
    language: "csharp",
    title: "File-scoped namespace declaration (C# 10)",
    tag: "snippet",
    code: `namespace MyApp.Services;  // no braces, applies to entire file

public class OrderService
{
    public void Process(int orderId) { }
}`,
    explanation:
      "File-scoped namespaces eliminate one level of indentation; the declaration applies to all types in the file and cannot be mixed with block namespaces.",
  },
  {
    id: "cs-global-using",
    language: "csharp",
    title: "Global using directives (C# 10)",
    tag: "snippet",
    code: `// GlobalUsings.cs
global using System;
global using System.Collections.Generic;
global using System.Linq;
global using System.Threading.Tasks;`,
    explanation:
      "Global usings placed in any file make those namespaces available project-wide without per-file declarations; SDK-style projects auto-generate some via <ImplicitUsings>.",
  },
  {
    id: "cs-primary-constructor",
    language: "csharp",
    title: "Primary constructors (C# 12)",
    tag: "snippet",
    code: `public class Logger(string name, LogLevel level)
{
    public void Log(string msg) =>
        Console.WriteLine($"[{name}][{level}] {msg}");
}

// Usage
var log = new Logger("App", LogLevel.Info);
log.Log("Started");`,
    explanation:
      "Primary constructors capture parameters as fields scoped to the class body; they reduce boilerplate but offer no explicit field declaration — capture is implicit.",
  },
  {
    id: "cs-collection-expression",
    language: "csharp",
    title: "Collection expressions (C# 12)",
    tag: "snippet",
    code: `int[] nums = [1, 2, 3, 4, 5];
List<string> names = ["Alice", "Bob"];
Span<byte> buf = [0x00, 0xFF, 0x7F];

// spread operator
int[] more = [0, ..nums, 6];`,
    explanation:
      "Collection expressions unify array, list, and span initialization syntax; the compiler selects the most efficient construction strategy and supports .. spread.",
  },
  {
    id: "cs-pattern-list",
    language: "csharp",
    title: "List patterns (C# 11)",
    tag: "snippet",
    code: `int[] arr = [1, 2, 3];
string result = arr switch
{
    []          => "empty",
    [var x]     => $"one: {x}",
    [1, 2, ..]  => "starts 1,2",
    [.., > 10]  => "ends > 10",
    _           => "other"
};`,
    explanation:
      "List patterns match arrays and spans by structure; [] is empty, [x] is single element, .. is a discard/range slice, and conditions can appear on elements.",
  },
  {
    id: "cs-raw-string",
    language: "csharp",
    title: "Raw string literals (C# 11)",
    tag: "snippet",
    code: `string json = """
    {
        "name": "Alice",
        "age": 30
    }
    """;

string query = $"""
    SELECT *
    FROM users
    WHERE id = {userId}
    """;`,
    explanation:
      "Raw strings delimited by \"\"\" need no escape sequences and strip leading whitespace aligned to the closing delimiter; interpolated variants use $\"\"\".",
  },
  {
    id: "cs-required-member",
    language: "csharp",
    title: "Required members (C# 11)",
    tag: "snippet",
    code: `public class Config
{
    public required string ConnectionString { get; init; }
    public required int Port { get; init; }
    public string? Description { get; init; }
}

// Compiler error if required members are not set:
var cfg = new Config { ConnectionString = "...", Port = 5432 };`,
    explanation:
      "required forces callers to set a property in an object initializer; combined with init-only setters it replaces many constructor overloads while retaining immutability.",
  },
  {
    id: "cs-init-only",
    language: "csharp",
    title: "Init-only setters (C# 9)",
    tag: "snippet",
    code: `public class Point
{
    public double X { get; init; }
    public double Y { get; init; }
}

var p = new Point { X = 3.0, Y = 4.0 };
// p.X = 1.0;  // CS8852 — init-only after construction`,
    explanation:
      "init setters allow object-initializer syntax but make properties read-only after the constructor completes, giving immutability without sacrificing ergonomics.",
  },
  {
    id: "cs-with-expression",
    language: "csharp",
    title: "with expression for non-destructive mutation",
    tag: "snippet",
    code: `record Point(double X, double Y);

var origin = new Point(0, 0);
var moved  = origin with { X = 5.0 };

Console.WriteLine(origin); // Point { X = 0, Y = 0 }
Console.WriteLine(moved);  // Point { X = 5, Y = 0 }`,
    explanation:
      "with creates a shallow copy of a record (or struct in C# 10+) with specified properties changed; the original is unmodified, enabling immutable value transformations.",
  },
  {
    id: "cs-interpolated-string-handler",
    language: "csharp",
    title: "Interpolated string handlers",
    tag: "snippet",
    code: `// Logger avoids allocating the string unless the level is active
logger.LogDebug($"Value is {ComputeExpensiveValue()}");

// The compiler lowers this to a handler that checks IsEnabled first
// so ComputeExpensiveValue() may never run.`,
    explanation:
      "C# 10 lets APIs accept custom interpolated string handlers that conditionally evaluate or format holes; logging frameworks use this to avoid allocations for disabled log levels.",
  },

  // ── understanding ─────────────────────────────────────────────────────────
  {
    id: "cs-understand-ref-vs-out",
    language: "csharp",
    title: "ref vs out vs in parameters",
    tag: "understanding",
    code: `void Inc(ref int x)  { x++; }               // must be init before call
void Init(out int x) { x = 42; }            // must be assigned before return
void Read(in  int x) { Console.Write(x); }  // caller's variable, readonly alias

int a = 10;  Inc(ref a);   // a == 11
int b;       Init(out b);  // b == 42
int c = 99;  Read(in c);   // c unchanged`,
    explanation:
      "ref requires pre-initialized variable and allows read+write; out requires assignment inside the method (no pre-init needed); in passes by reference but forbids writes.",
  },
  {
    id: "cs-understand-value-vs-ref-type",
    language: "csharp",
    title: "Value types vs reference types — stack vs heap",
    tag: "understanding",
    code: `struct Vec2 { public float X, Y; }
class  Box  { public float X, Y; }

Vec2 a = new Vec2 { X = 1 };
Vec2 b = a;       // full copy; b.X = 9 does NOT affect a

Box  c = new Box  { X = 1 };
Box  d = c;       // shared reference; d.X = 9 DOES affect c`,
    explanation:
      "Structs are value types copied on assignment; classes are reference types that share the same heap object, causing aliasing if not deliberately cloned.",
  },
  {
    id: "cs-understand-nullable-context",
    language: "csharp",
    title: "Nullable reference types — annotations vs runtime",
    tag: "understanding",
    code: `#nullable enable

string? maybeNull = null;
string  notNull   = null!;  // null-forgiving operator suppresses warning

int len = maybeNull?.Length ?? 0;  // safe
// int len2 = maybeNull.Length;    // CS8602 — dereference of possibly null`,
    explanation:
      "Nullable reference types (#nullable enable) are a compile-time analysis tool only — null! bypasses the check, and no runtime null-safety is added; NullReferenceException can still occur.",
  },
  {
    id: "cs-understand-async-void",
    language: "csharp",
    title: "async void — the exception trap",
    tag: "understanding",
    code: `// BAD: exceptions from async void are unobservable / crash process
async void FireAndForget() { throw new Exception("lost!"); }

// GOOD: return Task so callers can await and handle exceptions
async Task SafeOperation() { throw new Exception("catchable"); }

// async void is only acceptable for event handlers:
button.Click += async (s, e) => { await DoWorkAsync(); };`,
    explanation:
      "Exceptions thrown inside async void propagate on the SynchronizationContext rather than to the caller, making them impossible to catch with try/catch and potentially crashing the process.",
  },
  {
    id: "cs-understand-iequatable",
    language: "csharp",
    title: "IEquatable<T> and GetHashCode contract",
    tag: "understanding",
    code: `public record struct Money(decimal Amount, string Currency)
    : IEquatable<Money>
{
    public bool Equals(Money other) =>
        Amount == other.Amount && Currency == other.Currency;

    public override int GetHashCode() =>
        HashCode.Combine(Amount, Currency);
}`,
    explanation:
      "If two objects are equal (Equals returns true), they must return the same hash code; violating this breaks Dictionary and HashSet because equal keys may land in different buckets.",
  },
  {
    id: "cs-understand-disposable-scope",
    language: "csharp",
    title: "Dispose is not a destructor — lifetime is manual",
    tag: "understanding",
    code: `// The using statement guarantees Dispose even on exceptions:
using var conn = new SqlConnection(cs);
conn.Open();
// Dispose called here even if Open throws

// Forgetting using means Dispose only runs when GC finalizes,
// which may be seconds or never in low-memory conditions.`,
    explanation:
      "IDisposable.Dispose releases unmanaged resources (file handles, connections) deterministically; relying on the finalizer is non-deterministic and can exhaust handles before GC runs.",
  },

  // ── structures ────────────────────────────────────────────────────────────
  {
    id: "cs-priority-queue",
    language: "csharp",
    title: "PriorityQueue<TElement, TPriority>",
    tag: "structures",
    code: `var pq = new PriorityQueue<string, int>();
pq.Enqueue("low",    10);
pq.Enqueue("urgent",  1);
pq.Enqueue("medium",  5);

while (pq.TryDequeue(out string? item, out int priority))
    Console.WriteLine($"{priority}: {item}");
// 1: urgent  5: medium  10: low`,
    explanation:
      "PriorityQueue is a min-heap by default; elements with the lowest priority value dequeue first. For a max-heap, negate the priority or use a custom IComparer.",
  },
  {
    id: "cs-frozen-dictionary",
    language: "csharp",
    title: "FrozenDictionary<TKey, TValue> (.NET 8)",
    tag: "structures",
    code: `using System.Collections.Frozen;

var map = new Dictionary<string, int>
{
    ["one"]   = 1,
    ["two"]   = 2,
    ["three"] = 3
}.ToFrozenDictionary();

Console.WriteLine(map["two"]);  // 2
// map["four"] = 4;  // NotSupportedException — read-only`,
    explanation:
      "FrozenDictionary trades construction cost for faster lookup via perfect hashing; ideal for static lookup tables that are built once at startup and read many times.",
  },
  {
    id: "cs-channel",
    language: "csharp",
    title: "System.Threading.Channels for producer-consumer",
    tag: "structures",
    code: `using System.Threading.Channels;

var ch = Channel.CreateBounded<int>(capacity: 100);

// Producer
_ = Task.Run(async () => {
    for (int i = 0; i < 10; i++) await ch.Writer.WriteAsync(i);
    ch.Writer.Complete();
});

// Consumer
await foreach (int item in ch.Reader.ReadAllAsync())
    Console.WriteLine(item);`,
    explanation:
      "Channels provide a thread-safe async producer-consumer queue; bounded channels apply backpressure by making WriteAsync wait when full.",
  },
  {
    id: "cs-concurrent-bag",
    language: "csharp",
    title: "ConcurrentBag<T> — thread-local work stealing",
    tag: "structures",
    code: `var bag = new ConcurrentBag<int>();

Parallel.For(0, 100, i => bag.Add(i * i));

Console.WriteLine($"Count: {bag.Count}");  // 100
Console.WriteLine($"Sum: {bag.Sum()}");`,
    explanation:
      "ConcurrentBag optimises for scenarios where each thread mostly adds and removes its own items; it uses thread-local storage and work-stealing so lock contention is minimal.",
  },
  {
    id: "cs-sorted-list",
    language: "csharp",
    title: "SortedList<TKey, TValue> vs SortedDictionary",
    tag: "structures",
    code: `// SortedList: O(log n) lookup, O(n) insert, lower memory
var sl = new SortedList<string, int> { ["b"] = 2, ["a"] = 1 };
Console.WriteLine(sl.Keys[0]);   // "a" — index access

// SortedDictionary: O(log n) insert/delete, more memory (red-black tree)
var sd = new SortedDictionary<string, int> { ["b"] = 2, ["a"] = 1 };`,
    explanation:
      "SortedList stores keys/values in parallel arrays (compact, index-accessible) while SortedDictionary uses a red-black tree (O(log n) insert/delete vs O(n) for list).",
  },
  {
    id: "cs-memory-cache",
    language: "csharp",
    title: "MemoryCache with absolute and sliding expiration",
    tag: "structures",
    code: `using Microsoft.Extensions.Caching.Memory;

var cache = new MemoryCache(new MemoryCacheOptions());

cache.Set("key", "value", new MemoryCacheEntryOptions
{
    AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(10),
    SlidingExpiration               = TimeSpan.FromMinutes(2),
    Priority                        = CacheItemPriority.High
});

if (cache.TryGetValue("key", out string? val))
    Console.WriteLine(val);`,
    explanation:
      "MemoryCache evicts entries when memory is under pressure; AbsoluteExpiration sets a hard deadline while SlidingExpiration resets each time the entry is accessed.",
  },

  // ── caveats ───────────────────────────────────────────────────────────────
  {
    id: "cs-caveat-closure-loop",
    language: "csharp",
    title: "Captured loop variable in delegates",
    tag: "caveats",
    code: `// WRONG — all delegates capture the same 'i' variable
var fns = new List<Func<int>>();
for (int i = 0; i < 3; i++)
    fns.Add(() => i);  // i == 3 for all

// CORRECT — copy to a new variable per iteration
for (int i = 0; i < 3; i++) {
    int local = i;
    fns.Add(() => local);  // 0, 1, 2
}`,
    explanation:
      "Lambda closures capture the variable itself, not its value at capture time; introducing a loop-local copy forces each iteration to bind to a distinct variable.",
  },
  {
    id: "cs-caveat-struct-mutation",
    language: "csharp",
    title: "Struct mutation in collections",
    tag: "caveats",
    code: `struct Counter { public int N; }

var list = new List<Counter> { new Counter { N = 0 } };

// CS1612 — cannot modify a return value of a non-variable
// list[0].N++;

// Fix: copy, mutate, put back
var c = list[0];
c.N++;
list[0] = c;`,
    explanation:
      "Indexers return a copy of struct values; mutating the copy (rather than putting it back) is a silent no-op that the compiler catches for properties but not all indexers.",
  },
  {
    id: "cs-caveat-default-interface",
    language: "csharp",
    title: "Default interface members are not inherited by classes",
    tag: "caveats",
    code: `interface IPlugin
{
    string Name { get; }
    string Version => "1.0";  // default implementation
}

class MyPlugin : IPlugin
{
    public string Name => "Mine";
    // Version not overridden — but:
}

IPlugin p = new MyPlugin();
Console.WriteLine(p.Version);   // "1.0" — OK via interface ref

MyPlugin m = new MyPlugin();
// Console.WriteLine(m.Version); // CS1061 — not visible on class ref`,
    explanation:
      "Default interface members are only accessible through an interface reference; classes do not inherit the implementation, so calling through the concrete type requires a cast.",
  },
  {
    id: "cs-caveat-int-overflow",
    language: "csharp",
    title: "Integer overflow is silent by default",
    tag: "caveats",
    code: `int x = int.MaxValue;
int y = x + 1;          // silently wraps to -2147483648

checked
{
    int z = x + 1;      // OverflowException at runtime
}

// Compile-time checked context:
// int bad = 2147483647 + 1;  // CS0220 — compile error`,
    explanation:
      "C# integer arithmetic wraps on overflow unless in a checked context; use checked{} blocks or the /checked compiler switch for arithmetic that must not overflow.",
  },
  {
    id: "cs-caveat-task-result-deadlock",
    language: "csharp",
    title: ".Result / .Wait() deadlock on UI thread",
    tag: "caveats",
    code: `// BAD — blocks calling thread; if SynchronizationContext captures it,
// the continuation can never resume → deadlock
string data = GetDataAsync().Result;

// GOOD — let the runtime manage the continuation
string data2 = await GetDataAsync();

// Only .Result is safe when there is no SynchronizationContext (e.g. console apps)`,
    explanation:
      "Calling .Result or .Wait() on a Task blocks the current thread; if the async continuation needs that same thread (WPF, ASP.NET Classic), the program deadlocks.",
  },
  {
    id: "cs-caveat-linq-deferred",
    language: "csharp",
    title: "LINQ deferred execution — query runs on enumeration",
    tag: "caveats",
    code: `var nums = new List<int> { 1, 2, 3 };
var query = nums.Where(x => x > 1);  // not executed yet

nums.Add(4);   // modifies source before enumeration

foreach (var n in query)  // query runs here, includes 4
    Console.Write(n + " ");  // 2 3 4

// Force immediate execution:
var snapshot = nums.Where(x => x > 1).ToList();`,
    explanation:
      "LINQ queries are lazy; they re-evaluate the source every time they are enumerated. Call .ToList() or .ToArray() to materialise a snapshot if the source may change.",
  },
  {
    id: "cs-caveat-string-compare",
    language: "csharp",
    title: "String comparison — ordinal vs culture-sensitive",
    tag: "caveats",
    code: `string a = "resume";
string b = "résumé";

// Culture-sensitive (default for .Equals in older code):
bool ce = string.Compare(a, b, StringComparison.CurrentCulture) == 0;

// Ordinal — byte-by-byte, safe for IDs/paths:
bool ord = string.Equals(a, b, StringComparison.Ordinal);       // false

// Case-insensitive ordinal (recommended for most non-UI comparisons):
bool ci = string.Equals("ABC", "abc", StringComparison.OrdinalIgnoreCase); // true`,
    explanation:
      "Culture-sensitive comparison can yield unexpected results across locales (Turkish 'I'/'i' issue); use OrdinalIgnoreCase for identifiers, file paths, and internal keys.",
  },
  {
    id: "cs-caveat-foreach-no-remove",
    language: "csharp",
    title: "Modifying a collection during foreach throws",
    tag: "caveats",
    code: `var list = new List<int> { 1, 2, 3, 4 };

// Throws InvalidOperationException: "Collection was modified"
foreach (var n in list)
    if (n % 2 == 0) list.Remove(n);

// Fix: iterate over a copy, or use RemoveAll
list.RemoveAll(n => n % 2 == 0);`,
    explanation:
      "Most .NET collections track a version counter; modifying the collection during enumeration increments it and causes the enumerator to throw.",
  },

  // ── types ─────────────────────────────────────────────────────────────────
  {
    id: "cs-generic-math",
    language: "csharp",
    title: "Generic math with INumber<T> (C# 11 / .NET 7)",
    tag: "types",
    code: `using System.Numerics;

static T Sum<T>(IEnumerable<T> source) where T : INumber<T>
{
    T total = T.Zero;
    foreach (T item in source)
        total += item;
    return total;
}

Console.WriteLine(Sum(new[] { 1, 2, 3 }));       // 6
Console.WriteLine(Sum(new[] { 1.1, 2.2, 3.3 })); // 6.6`,
    explanation:
      "INumber<T> is a static abstract interface; generic math eliminates the need to write separate Sum<int>, Sum<double>, etc. overloads while retaining full type safety.",
  },
  {
    id: "cs-discriminated-union-sealed",
    language: "csharp",
    title: "Discriminated union via sealed hierarchy + switch",
    tag: "types",
    code: `abstract record Shape;
sealed record Circle(double Radius)    : Shape;
sealed record Rectangle(double W, double H) : Shape;
sealed record Triangle(double Base, double H) : Shape;

double Area(Shape s) => s switch
{
    Circle c       => Math.PI * c.Radius * c.Radius,
    Rectangle r    => r.W * r.H,
    Triangle t     => 0.5 * t.Base * t.H,
    _              => throw new UnreachableException()
};`,
    explanation:
      "C# lacks native discriminated unions but sealed record hierarchies combined with exhaustive switch expressions approximate them; the compiler can warn on missing cases.",
  },
  {
    id: "cs-span-type",
    language: "csharp",
    title: "Span<T> — zero-copy slice over contiguous memory",
    tag: "types",
    code: `static int SumSlice(ReadOnlySpan<int> span)
{
    int total = 0;
    foreach (int n in span) total += n;
    return total;
}

int[] arr = { 1, 2, 3, 4, 5 };
Console.WriteLine(SumSlice(arr.AsSpan(1, 3)));  // 2+3+4 = 9`,
    explanation:
      "Span<T> is a ref struct that points into array, stack, or unmanaged memory without copying; ReadOnlySpan is the immutable variant accepted by most parsing APIs.",
  },
  {
    id: "cs-memory-type",
    language: "csharp",
    title: "Memory<T> — heap-storable async-friendly slice",
    tag: "types",
    code: `async Task ProcessAsync(Memory<byte> buffer)
{
    await Task.Delay(1);  // can store Memory across await unlike Span
    buffer.Span[0] = 0xFF;
}

byte[] data = new byte[256];
await ProcessAsync(data.AsMemory(0, 128));`,
    explanation:
      "Memory<T> wraps a segment of array or MemoryManager<T> and can cross async suspension points; Span<T> cannot because it is a ref struct restricted to the stack.",
  },
  {
    id: "cs-func-action-types",
    language: "csharp",
    title: "Func<T> and Action<T> delegate families",
    tag: "types",
    code: `Func<int, int, int> add  = (a, b) => a + b;    // returns int
Action<string>       print = Console.WriteLine;    // returns void
Predicate<int>       even  = n => n % 2 == 0;     // Func<int, bool> alias

Console.WriteLine(add(3, 4));   // 7
print("hello");
Console.WriteLine(even(6));     // True`,
    explanation:
      "Func<..., TResult> covers methods with a return value (up to 16 parameters), Action<...> covers void methods, and Predicate<T> is a bool-returning alias used in legacy APIs.",
  },
  {
    id: "cs-expression-type",
    language: "csharp",
    title: "Expression<Func<T>> — inspectable lambda trees",
    tag: "types",
    code: `using System.Linq.Expressions;

Expression<Func<int, bool>> expr = x => x > 5;

// Compile and invoke:
Func<int, bool> fn = expr.Compile();
Console.WriteLine(fn(10));  // True

// Inspect the tree:
var binary = (BinaryExpression)expr.Body;
Console.WriteLine(binary.NodeType);  // GreaterThan`,
    explanation:
      "Expression<Func<T>> stores a lambda as an inspectable AST rather than compiled IL; ORMs like EF Core translate these trees into SQL rather than running them in-process.",
  },

  // ── families ──────────────────────────────────────────────────────────────
  {
    id: "cs-family-exception-types",
    language: "csharp",
    title: "Exception type selection guide",
    tag: "families",
    code: `// Programming errors (caller's fault) — do NOT catch:
throw new ArgumentNullException(nameof(param));
throw new ArgumentOutOfRangeException(nameof(index));
throw new InvalidOperationException("Wrong state");
throw new NotSupportedException("Not implemented for this type");

// Runtime errors (environment) — can catch:
catch (IOException ex)  { /* file/network */ }
catch (TimeoutException) { /* retry */ }

// Never throw or catch:
// SystemException, Exception directly (too broad)`,
    explanation:
      "Argument* exceptions signal caller bugs and should bubble to the developer; IOException / TimeoutException signal recoverable conditions worth catching.",
  },
  {
    id: "cs-family-sync-primitives",
    language: "csharp",
    title: "Synchronization primitives comparison",
    tag: "families",
    code: `// lock / Monitor — mutual exclusion, re-entrant, thread-affine
lock (obj) { /* critical section */ }

// SemaphoreSlim — async-compatible, limits concurrent access
await semaphore.WaitAsync();

// ReaderWriterLockSlim — many readers or one writer
rwl.EnterReadLock();

// Interlocked — atomic ops without locking
Interlocked.Increment(ref counter);

// System.Threading.Lock (.NET 9) — modern, non-re-entrant option
var lk = new System.Threading.Lock();
using (lk.EnterScope()) { }`,
    explanation:
      "Use lock for simple mutual exclusion; SemaphoreSlim for async throttling; ReaderWriterLockSlim when reads vastly outnumber writes; Interlocked for single numeric updates.",
  },
  {
    id: "cs-family-serialization",
    language: "csharp",
    title: "Serialization options: System.Text.Json vs Newtonsoft vs MessagePack",
    tag: "families",
    code: `// System.Text.Json (built-in, .NET 6+): fast, AOT-friendly
var json = JsonSerializer.Serialize(obj);
var obj2 = JsonSerializer.Deserialize<MyType>(json);

// Newtonsoft.Json: mature, flexible, NuGet
var json3 = JsonConvert.SerializeObject(obj);

// MessagePack: binary, smallest payload, fastest round-trip
var bytes = MessagePackSerializer.Serialize(obj);`,
    explanation:
      "System.Text.Json is preferred for new .NET projects (no NuGet, AOT compatible); Newtonsoft.Json for broad compatibility; MessagePack for performance-critical or bandwidth-limited scenarios.",
  },
  {
    id: "cs-family-collection-creation",
    language: "csharp",
    title: "Five ways to create an IEnumerable<T> sequence",
    tag: "families",
    code: `// 1. Array literal
int[] a = [1, 2, 3];

// 2. LINQ range / generate
var evens = Enumerable.Range(0, 10).Where(x => x % 2 == 0);

// 3. yield iterator
IEnumerable<int> Fib() {
    int a = 0, b = 1;
    while (true) { yield return a; (a, b) = (b, a + b); }
}

// 4. Collection expression
List<string> names = ["Alice", "Bob"];

// 5. Immutable
var frozen = new[] { 1, 2, 3 }.ToImmutableList();`,
    explanation:
      "Choose array literals for known-size fixed data, LINQ for transformed/filtered sequences, iterators for infinite/lazy, and immutable collections for thread-safe sharing.",
  },
  {
    id: "cs-family-di-lifetime",
    language: "csharp",
    title: "DI lifetimes: Transient vs Scoped vs Singleton",
    tag: "families",
    code: `// Transient — new instance per injection
services.AddTransient<IEmailSender, SmtpEmailSender>();

// Scoped — one instance per request (web) or scope
services.AddScoped<IDbContext, AppDbContext>();

// Singleton — one instance for the app lifetime
services.AddSingleton<IConfiguration>(config);

// Captive dependency: NEVER inject Scoped into Singleton!`,
    explanation:
      "Singleton > Scoped > Transient in terms of lifetime; injecting a shorter-lived service into a longer-lived container (captive dependency) causes stale state or concurrency bugs.",
  },
  {
    id: "cs-family-async-return-types",
    language: "csharp",
    title: "Async return types: Task vs ValueTask vs IAsyncEnumerable",
    tag: "families",
    code: `// Task<T> — general purpose, always allocates a Task object
async Task<int> GetCountAsync() => await db.CountAsync();

// ValueTask<T> — avoids allocation when result is often synchronous
async ValueTask<int> CachedCountAsync() {
    if (_cache.TryGet(out int n)) return n;  // synchronous fast-path
    return await db.CountAsync();
}

// IAsyncEnumerable<T> — streaming, push-back
async IAsyncEnumerable<Row> StreamAsync() {
    await foreach (var r in reader) yield return r;
}`,
    explanation:
      "Use Task<T> by default; ValueTask<T> only when profiling shows significant allocation pressure from frequently-hot async methods; IAsyncEnumerable for streaming data.",
  },

  // ── classes ───────────────────────────────────────────────────────────────
  {
    id: "cs-class-generic-repo",
    language: "csharp",
    title: "Generic repository pattern with constraints",
    tag: "classes",
    code: `interface IEntity { int Id { get; } }

class Repository<T> where T : class, IEntity
{
    private readonly List<T> _store = new();

    public void Add(T entity) => _store.Add(entity);

    public T? FindById(int id) =>
        _store.FirstOrDefault(e => e.Id == id);

    public IReadOnlyList<T> All() => _store;
}`,
    explanation:
      "Generic constraints (class, IEntity) let the repository share CRUD logic across entity types while the compiler enforces that only class types implementing IEntity are used.",
  },
  {
    id: "cs-class-fluent-builder",
    language: "csharp",
    title: "Fluent builder with method chaining",
    tag: "classes",
    code: `class QueryBuilder
{
    private string _table  = "";
    private string _where  = "";
    private int    _limit  = 100;

    public QueryBuilder From(string table)  { _table = table; return this; }
    public QueryBuilder Where(string cond)  { _where = cond;  return this; }
    public QueryBuilder Limit(int n)        { _limit = n;     return this; }
    public string Build() =>
        $"SELECT * FROM {_table}" +
        (_where != "" ? $" WHERE {_where}" : "") +
        $" LIMIT {_limit}";
}

var sql = new QueryBuilder()
    .From("users").Where("age > 18").Limit(50).Build();`,
    explanation:
      "Returning this from each setter enables fluent chaining; the pattern is readable and avoids constructor overload explosion for optional parameters.",
  },
  {
    id: "cs-class-observer",
    language: "csharp",
    title: "Observer pattern with IObservable<T> / IObserver<T>",
    tag: "classes",
    code: `class EventSource : IObservable<string>
{
    private readonly List<IObserver<string>> _obs = new();

    public IDisposable Subscribe(IObserver<string> observer)
    {
        _obs.Add(observer);
        return new Unsubscriber(_obs, observer);
    }

    public void Publish(string msg)
    {
        foreach (var o in _obs) o.OnNext(msg);
    }

    class Unsubscriber(List<IObserver<string>> list, IObserver<string> obs)
        : IDisposable
    {
        public void Dispose() => list.Remove(obs);
    }
}`,
    explanation:
      "IObservable<T>/IObserver<T> form the .NET reactive contract; Subscribe returns an IDisposable whose Dispose unregisters the observer, preventing memory leaks.",
  },
  {
    id: "cs-class-decorator",
    language: "csharp",
    title: "Decorator pattern — wrapping a service transparently",
    tag: "classes",
    code: `interface ILogger { void Log(string msg); }

class ConsoleLogger : ILogger
{
    public void Log(string msg) => Console.WriteLine(msg);
}

class TimestampLogger(ILogger inner) : ILogger
{
    public void Log(string msg) =>
        inner.Log($"[{DateTime.UtcNow:O}] {msg}");
}

ILogger logger = new TimestampLogger(new ConsoleLogger());
logger.Log("Hello");`,
    explanation:
      "The decorator wraps the original implementation via the same interface; callers are unaware of the wrapping, enabling cross-cutting concerns without inheritance.",
  },
  {
    id: "cs-class-value-object",
    language: "csharp",
    title: "Value Object with record struct",
    tag: "classes",
    code: `readonly record struct Money(decimal Amount, string Currency)
{
    public static Money operator +(Money a, Money b)
    {
        if (a.Currency != b.Currency)
            throw new InvalidOperationException("Currency mismatch");
        return new Money(a.Amount + b.Amount, a.Currency);
    }

    public override string ToString() => $"{Amount:N2} {Currency}";
}

var total = new Money(10.00m, "USD") + new Money(5.50m, "USD");
Console.WriteLine(total);  // 15.50 USD`,
    explanation:
      "record struct gives value equality and immutability by default; operator overloading encapsulates domain rules (like currency matching) inside the type.",
  },
  {
    id: "cs-class-specification",
    language: "csharp",
    title: "Specification pattern — composable predicates",
    tag: "classes",
    code: `abstract class Spec<T>
{
    public abstract bool IsSatisfiedBy(T item);
    public Spec<T> And(Spec<T> other) => new AndSpec<T>(this, other);
}

class AndSpec<T>(Spec<T> left, Spec<T> right) : Spec<T>
{
    public override bool IsSatisfiedBy(T item) =>
        left.IsSatisfiedBy(item) && right.IsSatisfiedBy(item);
}

class AgeSpec(int min, int max) : Spec<int>
{
    public override bool IsSatisfiedBy(int age) => age >= min && age <= max;
}

var adult = new AgeSpec(18, 99).And(new AgeSpec(0, 65));
Console.WriteLine(adult.IsSatisfiedBy(30));  // True`,
    explanation:
      "Specification encapsulates a boolean rule as an object; And/Or/Not combinators build composite rules without if/else chains, improving readability and testability.",
  },
  {
    id: "cs-class-state-machine",
    language: "csharp",
    title: "State machine with enum + switch expression",
    tag: "classes",
    code: `enum State { Idle, Running, Paused, Stopped }
enum Event { Start, Pause, Resume, Stop }

class StateMachine
{
    private State _state = State.Idle;

    public void Send(Event ev)
    {
        _state = (_state, ev) switch
        {
            (State.Idle,    Event.Start)  => State.Running,
            (State.Running, Event.Pause)  => State.Paused,
            (State.Paused,  Event.Resume) => State.Running,
            (State.Running, Event.Stop)   => State.Stopped,
            _                             => throw new InvalidOperationException(
                                                $"Invalid: {_state} + {ev}")
        };
    }
}`,
    explanation:
      "Tuple patterns in switch expressions map (current state, event) pairs to next states; exhaustiveness checking prevents invalid transitions from compiling.",
  },
  {
    id: "cs-class-pipeline",
    language: "csharp",
    title: "Middleware pipeline pattern",
    tag: "classes",
    code: `delegate Task Middleware(string ctx, Func<Task> next);

class Pipeline
{
    private readonly List<Middleware> _steps = new();

    public Pipeline Use(Middleware m) { _steps.Add(m); return this; }

    public async Task RunAsync(string ctx)
    {
        int i = 0;
        async Task Next() {
            if (i < _steps.Count) await _steps[i++](ctx, Next);
        }
        await Next();
    }
}

var p = new Pipeline()
    .Use(async (ctx, next) => { Console.Write("[A"); await next(); Console.Write("A]"); })
    .Use(async (ctx, next) => { Console.Write("[B"); await next(); Console.Write("B]"); });

await p.RunAsync("x");  // [A[BA]B]`,
    explanation:
      "The pipeline captures a recursive Next delegate; each middleware calls (or skips) it to pass control forward, enabling onion-style pre/post processing like ASP.NET Core middleware.",
  },
  {
    id: "cs-class-lazy-singleton",
    language: "csharp",
    title: "Thread-safe lazy singleton with Lazy<T>",
    tag: "classes",
    code: `public sealed class AppSettings
{
    private static readonly Lazy<AppSettings> _instance =
        new(() => new AppSettings(), LazyThreadSafetyMode.ExecutionAndPublication);

    public static AppSettings Instance => _instance.Value;

    private AppSettings() { /* load from file */ }

    public string Environment { get; } = "production";
}

var s = AppSettings.Instance;`,
    explanation:
      "Lazy<T> with ExecutionAndPublication ensures the factory runs exactly once even under concurrent access; the sealed keyword prevents subclassing which could bypass the singleton.",
  },
  {
    id: "cs-class-result-monad",
    language: "csharp",
    title: "Result<T, E> monad for error handling without exceptions",
    tag: "classes",
    code: `readonly record struct Result<T, E>
{
    private readonly T? _value;
    private readonly E? _error;
    public bool IsOk { get; }

    private Result(T value) { _value = value; IsOk = true; }
    private Result(E error) { _error = error; IsOk = false; }

    public static Result<T, E> Ok(T v)  => new(v);
    public static Result<T, E> Err(E e) => new(e);

    public Result<U, E> Map<U>(Func<T, U> f) =>
        IsOk ? Result<U, E>.Ok(f(_value!)) : Result<U, E>.Err(_error!);
}`,
    explanation:
      "Result<T,E> makes failure an explicit part of the return type; Map chains operations without try/catch, and the caller is forced to handle both paths.",
  },
  {
    id: "cs-class-aggregate-root",
    language: "csharp",
    title: "Aggregate root with domain events",
    tag: "classes",
    code: `abstract class AggregateRoot
{
    private readonly List<object> _events = new();
    protected void Raise(object ev) => _events.Add(ev);
    public IReadOnlyList<object> PopEvents()
    {
        var copy = _events.ToList();
        _events.Clear();
        return copy;
    }
}

record OrderPlaced(int OrderId, decimal Total);

class Order : AggregateRoot
{
    public int Id { get; }
    public Order(int id, decimal total) {
        Id = id;
        Raise(new OrderPlaced(id, total));
    }
}`,
    explanation:
      "Aggregate roots collect domain events during command processing; the caller pops and dispatches them after the transaction commits, keeping domain logic decoupled from infrastructure.",
  },

  // ── more snippets ─────────────────────────────────────────────────────────
  {
    id: "cs-regex-source-gen",
    language: "csharp",
    title: "Regex source generator (C# 11 / .NET 7)",
    tag: "snippet",
    code: `using System.Text.RegularExpressions;

partial class Parser
{
    [GeneratedRegex(@"\\d{4}-\\d{2}-\\d{2}", RegexOptions.Compiled)]
    private static partial Regex DatePattern();

    public bool IsDate(string s) => DatePattern().IsMatch(s);
}`,
    explanation:
      "GeneratedRegex emits a Regex implementation at compile time, eliminating runtime compilation overhead and enabling AOT-compatible pattern matching.",
  },
  {
    id: "cs-source-gen-aware",
    language: "csharp",
    title: "System.Text.Json source generation for AOT",
    tag: "snippet",
    code: `using System.Text.Json;
using System.Text.Json.Serialization;

[JsonSerializable(typeof(Person))]
partial class PersonContext : JsonSerializerContext { }

record Person(string Name, int Age);

string json = JsonSerializer.Serialize(
    new Person("Alice", 30),
    PersonContext.Default.Person);`,
    explanation:
      "JsonSerializerContext generates serialization code at compile time; this avoids runtime reflection and is required for NativeAOT-compiled apps.",
  },
  {
    id: "cs-unsafe-stackalloc",
    language: "csharp",
    title: "stackalloc with Span<T> — stack-allocated buffer",
    tag: "snippet",
    code: `static void XorBuffer(ReadOnlySpan<byte> input, byte key)
{
    Span<byte> buf = stackalloc byte[input.Length];
    for (int i = 0; i < input.Length; i++)
        buf[i] = (byte)(input[i] ^ key);

    Console.WriteLine(Convert.ToHexString(buf));
}

XorBuffer("Hello"u8, 0x20);`,
    explanation:
      "stackalloc allocates a buffer on the stack (no GC pressure); assigning to Span<byte> lets you use it safely without unsafe blocks when size is bounded.",
  },
  {
    id: "cs-utf8-string-literal",
    language: "csharp",
    title: "UTF-8 string literals (C# 11)",
    tag: "snippet",
    code: `ReadOnlySpan<byte> hello = "Hello"u8;    // no encoding at runtime
ReadOnlySpan<byte> json  = """{"k":"v"}"""u8;

// Useful for writing to streams without Encoding.UTF8.GetBytes():
await stream.WriteAsync(hello.ToArray());`,
    explanation:
      "The u8 suffix produces a ReadOnlySpan<byte> with the UTF-8 representation computed at compile time, avoiding Encoding.UTF8.GetBytes() allocations in hot paths.",
  },
  {
    id: "cs-periodic-timer",
    language: "csharp",
    title: "PeriodicTimer — async-friendly ticker",
    tag: "snippet",
    code: `using var timer = new PeriodicTimer(TimeSpan.FromSeconds(1));

while (await timer.WaitForNextTickAsync())
{
    Console.WriteLine($"Tick at {DateTime.Now:T}");
    // Do work; next tick won't fire until WaitForNextTickAsync is called again
}`,
    explanation:
      "PeriodicTimer is cancellation-aware and never fires concurrently — if work takes longer than the period it simply delays the next tick rather than overlapping.",
  },
  {
    id: "cs-env-process",
    language: "csharp",
    title: "Process.Start with redirect and async read",
    tag: "snippet",
    code: `var psi = new ProcessStartInfo("git", "log --oneline -5")
{
    RedirectStandardOutput = true,
    UseShellExecute        = false,
};

using var proc = Process.Start(psi)!;
string output  = await proc.StandardOutput.ReadToEndAsync();
await proc.WaitForExitAsync();
Console.WriteLine(output);`,
    explanation:
      "RedirectStandardOutput combined with async reading prevents the deadlock that occurs when synchronously reading stdout while the child process blocks on its write buffer.",
  },
  {
    id: "cs-span-string-parse",
    language: "csharp",
    title: "Parsing with Span<char> — allocation-free splitting",
    tag: "snippet",
    code: `ReadOnlySpan<char> csv = "Alice,30,Engineer";

int first  = csv.IndexOf(',');
var name   = csv[..first];
var rest   = csv[(first + 1)..];
int second = rest.IndexOf(',');
var age    = rest[..second];

Console.WriteLine(name.ToString());   // Alice
Console.WriteLine(int.Parse(age));    // 30`,
    explanation:
      "Slicing ReadOnlySpan<char> instead of using string.Split avoids heap allocation; int.Parse, double.TryParse, and DateTime.TryParse all accept spans directly.",
  },
  {
    id: "cs-object-pool",
    language: "csharp",
    title: "ObjectPool<T> from Microsoft.Extensions",
    tag: "snippet",
    code: `using Microsoft.Extensions.ObjectPool;

var policy = new DefaultPooledObjectPolicy<StringBuilder>();
var pool   = new DefaultObjectPool<StringBuilder>(policy);

StringBuilder sb = pool.Get();
try
{
    sb.Append("Hello").Append(", ").Append("World");
    Console.WriteLine(sb.ToString());
}
finally
{
    pool.Return(sb);   // sb.Clear() called internally by policy
}`,
    explanation:
      "ObjectPool reuses expensive-to-create objects (StringBuilder, MemoryStream) to reduce GC pressure in high-throughput code; always return objects in a finally block.",
  },

  // ── more understanding ────────────────────────────────────────────────────
  {
    id: "cs-understand-covariance",
    language: "csharp",
    title: "Covariance and contravariance in generics",
    tag: "understanding",
    code: `// IEnumerable<out T> is covariant — T can vary to derived type
IEnumerable<string>  strings = new List<string>();
IEnumerable<object>  objects = strings;  // OK — string IS-A object

// Action<in T> is contravariant — T can vary to base type
Action<object>  printObj = o => Console.WriteLine(o);
Action<string>  printStr = printObj;  // OK — can use base handler for derived

// List<T> is INVARIANT — neither direction works
// List<object> objs = new List<string>(); // CS0266`,
    explanation:
      "out marks a type parameter covariant (usable where base is expected); in marks it contravariant; unadorned generics are invariant and accept no substitution.",
  },
  {
    id: "cs-understand-gc-generations",
    language: "csharp",
    title: "GC generations and Large Object Heap",
    tag: "understanding",
    code: `// Short-lived objects stay in Gen 0 — cheapest to collect
// Surviving Gen 0 → Gen 1 → Gen 2 (full collection, most expensive)

// Objects >= 85,000 bytes go to Large Object Heap (LOH):
byte[] big = new byte[90_000];  // allocated on LOH, collected only on Gen 2

// Fragmentation tip: use ArrayPool<byte> for large temporary buffers
byte[] rented = ArrayPool<byte>.Shared.Rent(90_000);
// ... use rented ...
ArrayPool<byte>.Shared.Return(rented);`,
    explanation:
      "LOH objects are expensive because they trigger Gen 2 collections and are not compacted by default; rent from ArrayPool to avoid LOH pressure for large temporary buffers.",
  },
  {
    id: "cs-understand-record-equality",
    language: "csharp",
    title: "Record equality is structural, not referential",
    tag: "understanding",
    code: `record Point(int X, int Y);

var a = new Point(1, 2);
var b = new Point(1, 2);
var c = a;

Console.WriteLine(a == b);          // True  — structural equality
Console.WriteLine(ReferenceEquals(a, b)); // False — different objects
Console.WriteLine(ReferenceEquals(a, c)); // True  — same reference`,
    explanation:
      "Records auto-generate Equals and GetHashCode based on all properties; two separate instances with the same data are considered equal, unlike classes which compare by reference.",
  },
  {
    id: "cs-understand-extension-methods",
    language: "csharp",
    title: "Extension methods — static methods called as instance methods",
    tag: "understanding",
    code: `public static class StringExtensions
{
    public static bool IsNullOrEmpty(this string? s) =>
        string.IsNullOrEmpty(s);

    public static string Truncate(this string s, int max) =>
        s.Length <= max ? s : s[..max] + "…";
}

string? name = null;
Console.WriteLine(name.IsNullOrEmpty());   // True (no NullRef!)
Console.WriteLine("Hello World".Truncate(5)); // Hello…`,
    explanation:
      "Extension methods are syntactic sugar; the compiler rewrites them to static calls, so calling on null is safe as long as the method handles it — no virtual dispatch occurs.",
  },

  // ── more structures ────────────────────────────────────────────────────────
  {
    id: "cs-blocking-collection",
    language: "csharp",
    title: "BlockingCollection<T> for bounded producer-consumer",
    tag: "structures",
    code: `using var bc = new BlockingCollection<int>(boundedCapacity: 5);

var producer = Task.Run(() => {
    for (int i = 0; i < 10; i++) bc.Add(i);  // blocks when full
    bc.CompleteAdding();
});

foreach (int item in bc.GetConsumingEnumerable())
    Console.Write(item + " ");  // 0 1 2 3 4 5 6 7 8 9

await producer;`,
    explanation:
      "BlockingCollection wraps a ConcurrentQueue (or other IProducerConsumerCollection) with bounded capacity and blocking semantics; CompleteAdding signals consumers to stop.",
  },
  {
    id: "cs-immutable-stack",
    language: "csharp",
    title: "ImmutableStack<T> — functional stack",
    tag: "structures",
    code: `using System.Collections.Immutable;

var stack = ImmutableStack<int>.Empty;
var s1    = stack.Push(1);
var s2    = s1.Push(2);
var s3    = s2.Push(3);

// Original unchanged:
Console.WriteLine(s2.Peek());  // 2
Console.WriteLine(s3.Peek());  // 3

// Pop returns new stack:
var s4 = s3.Pop(out int top);
Console.WriteLine(top);  // 3`,
    explanation:
      "ImmutableStack is a persistent linked-list; Push/Pop return new stacks sharing structure with the original, making it safe to share across threads without copying.",
  },

  // ── more types ──────────────────────────────────────────────────────────
  {
    id: "cs-type-alias",
    language: "csharp",
    title: "Global type aliases (C# 12)",
    tag: "types",
    code: `// In GlobalUsings.cs:
global using Point2D = (double X, double Y);
global using Matrix  = double[][];

// In any file:
Point2D origin  = (0.0, 0.0);
Point2D shifted = (origin.X + 1, origin.Y + 2);

Matrix identity = [[1, 0], [0, 1]];`,
    explanation:
      "Global using aliases give meaningful names to complex types like tuples or arrays; combined with global using they eliminate repetition across all files in a project.",
  },
  {
    id: "cs-type-pattern-matching",
    language: "csharp",
    title: "Pattern matching — type, property, and when guards",
    tag: "types",
    code: `object obj = new List<int> { 1, 2, 3 };

string desc = obj switch
{
    int n when n < 0          => "negative int",
    int n                     => $"int: {n}",
    string { Length: 0 }      => "empty string",
    string s                  => $"string: {s}",
    ICollection { Count: > 5} => "large collection",
    ICollection c             => $"collection of {c.Count}",
    null                      => "null",
    _                         => "other"
};

Console.WriteLine(desc);  // collection of 3`,
    explanation:
      "Switch expressions test type, then structural properties via property patterns, then when guards; the compiler checks ordering and warns about unreachable arms.",
  },
  {
    id: "cs-type-open-generic",
    language: "csharp",
    title: "Open generic types — typeof and GetGenericTypeDefinition",
    tag: "types",
    code: `Type openList  = typeof(List<>);
Type openDict  = typeof(Dictionary<,>);

Type closedList = openList.MakeGenericType(typeof(int));
// Same as typeof(List<int>)

object instance = Activator.CreateInstance(closedList)!;
Console.WriteLine(instance.GetType().Name);  // List\`1

// Check if a type is constructed from an open generic:
bool isList = typeof(List<string>).GetGenericTypeDefinition() == openList; // true`,
    explanation:
      "Open generic types (List<>) are templates; MakeGenericType constructs a closed type at runtime, enabling generic factory patterns and plugin systems that instantiate unknown types.",
  },

  // ── more caveats ──────────────────────────────────────────────────────────
  {
    id: "cs-caveat-value-task-double-await",
    language: "csharp",
    title: "ValueTask must not be awaited more than once",
    tag: "caveats",
    code: `ValueTask<int> vt = GetValueAsync();

int a = await vt;   // OK
// int b = await vt; // UNDEFINED BEHAVIOR — may throw or return garbage

// If you need to await multiple times, convert:
Task<int> t = vt.AsTask();  // safe to await multiple times`,
    explanation:
      "ValueTask is a one-shot value; awaiting it twice is undefined behavior because the underlying value object may have been returned to a pool after the first await.",
  },
  {
    id: "cs-caveat-is-null-vs-equals-null",
    language: "csharp",
    title: "is null vs == null — operator overloading trap",
    tag: "caveats",
    code: `class MyClass
{
    public static bool operator ==(MyClass? a, MyClass? b) => false; // broken overload
    public static bool operator !=(MyClass? a, MyClass? b) => !(a == b);
    public override bool Equals(object? o) => false;
    public override int GetHashCode() => 0;
}

MyClass? obj = null;
Console.WriteLine(obj == null);  // FALSE — calls overloaded ==
Console.WriteLine(obj is null);  // TRUE  — pattern match, no overload`,
    explanation:
      "is null uses the is pattern which always checks for null without invoking == overloads; prefer is null / is not null in null checks to avoid operator-overloading surprises.",
  },

  // ── more families ─────────────────────────────────────────────────────────
  {
    id: "cs-family-linq-aggregation",
    language: "csharp",
    title: "LINQ aggregation: Aggregate vs Sum vs Fold",
    tag: "families",
    code: `int[] nums = { 1, 2, 3, 4, 5 };

int sum     = nums.Sum();                   // 15
int product = nums.Aggregate(1, (acc, x) => acc * x); // 120
int max     = nums.Max();                   // 5
double avg  = nums.Average();               // 3.0

// Running totals with Scan (not built-in, use Aggregate):
var running = nums.Aggregate(
    new List<int>(),
    (list, x) => { list.Add((list.Count > 0 ? list[^1] : 0) + x); return list; });`,
    explanation:
      "Sum/Max/Min/Average are specialised terminal operators; Aggregate(seed, func) is the general fold that can express any accumulation including running totals.",
  },
  {
    id: "cs-family-string-builder-vs-interpolation",
    language: "csharp",
    title: "StringBuilder vs string interpolation — when to use which",
    tag: "families",
    code: `// Few concatenations: $ interpolation is clearest and fastest
string greeting = $"Hello, {name}! You have {count} messages.";

// Many concatenations in a loop: StringBuilder avoids O(n²) copies
var sb = new StringBuilder();
foreach (var item in items)
    sb.AppendLine(item.ToString());
string result = sb.ToString();

// High-perf hot path: use handler or stackalloc Span<char>`,
    explanation:
      "Each string + in a loop allocates a new string (O(n²) total); StringBuilder maintains a resizable buffer (amortised O(n)); for 2-3 concatenations interpolation is fine.",
  },

  // ── more classes ──────────────────────────────────────────────────────────
  {
    id: "cs-class-disposable-pattern",
    language: "csharp",
    title: "Full Dispose pattern with finalizer",
    tag: "classes",
    code: `public class ResourceHolder : IDisposable
{
    private bool _disposed;
    private readonly IntPtr _handle = AcquireNativeHandle();

    public void Dispose()
    {
        Dispose(true);
        GC.SuppressFinalize(this);
    }

    protected virtual void Dispose(bool disposing)
    {
        if (_disposed) return;
        if (disposing) { /* release managed resources */ }
        ReleaseNativeHandle(_handle); // always release unmanaged
        _disposed = true;
    }

    ~ResourceHolder() => Dispose(false);

    private static IntPtr AcquireNativeHandle() => IntPtr.Zero;
    private static void   ReleaseNativeHandle(IntPtr h) { }
}`,
    explanation:
      "The bool disposing parameter distinguishes Dispose (can touch managed objects) from the finalizer (managed objects may already be collected); GC.SuppressFinalize avoids double-release.",
  },
  {
    id: "cs-class-template-method",
    language: "csharp",
    title: "Template method pattern with abstract class",
    tag: "classes",
    code: `abstract class DataProcessor
{
    // Template method — defines the algorithm skeleton
    public void Process(string path)
    {
        var data = Read(path);
        var transformed = Transform(data);
        Write(transformed);
    }

    protected abstract string[]  Read(string path);
    protected abstract string[]  Transform(string[] data);
    protected virtual  void      Write(string[] data) =>
        Console.WriteLine(string.Join("\\n", data));
}

class UpperCaseProcessor : DataProcessor
{
    protected override string[] Read(string p)       => System.IO.File.ReadAllLines(p);
    protected override string[] Transform(string[] d) => Array.ConvertAll(d, s => s.ToUpper());
}`,
    explanation:
      "The abstract class fixes the algorithm structure (read-transform-write) while subclasses supply concrete steps; virtual Write provides a default that subclasses may override.",
  },
  {
    id: "cs-class-chain-of-responsibility",
    language: "csharp",
    title: "Chain of responsibility with linked handlers",
    tag: "classes",
    code: `abstract class Handler
{
    protected Handler? Next;
    public Handler SetNext(Handler n) { Next = n; return n; }
    public abstract void Handle(int request);
}

class SmallHandler : Handler {
    public override void Handle(int r) {
        if (r < 10) Console.WriteLine($"Small: {r}");
        else Next?.Handle(r);
    }
}

class BigHandler : Handler {
    public override void Handle(int r) =>
        Console.WriteLine($"Big: {r}");
}

var small = new SmallHandler();
small.SetNext(new BigHandler());
small.Handle(5);   // Small: 5
small.Handle(99);  // Big: 99`,
    explanation:
      "Each handler decides whether to process the request or pass it along the chain; SetNext returns the next handler enabling fluent chain construction.",
  },
  {
    id: "cs-class-strategy",
    language: "csharp",
    title: "Strategy pattern with delegates",
    tag: "classes",
    code: `class Sorter<T>
{
    private readonly Comparison<T> _strategy;
    public Sorter(Comparison<T> strategy) => _strategy = strategy;
    public void Sort(T[] data) => Array.Sort(data, _strategy);
}

var asc  = new Sorter<int>((a, b) => a.CompareTo(b));
var desc = new Sorter<int>((a, b) => b.CompareTo(a));

int[] data = { 3, 1, 4, 1, 5 };
asc.Sort(data);
Console.WriteLine(string.Join(", ", data));   // 1, 1, 3, 4, 5`,
    explanation:
      "Using Comparison<T> delegates instead of a Strategy interface keeps the code concise; lambdas passed at construction time replace entire implementation classes.",
  },
  {
    id: "cs-class-event-aggregator",
    language: "csharp",
    title: "Event aggregator — decoupled pub/sub with weak references",
    tag: "classes",
    code: `class EventAggregator
{
    private readonly Dictionary<Type, List<WeakReference<Delegate>>> _handlers = new();

    public void Subscribe<T>(Action<T> handler)
    {
        if (!_handlers.TryGetValue(typeof(T), out var list))
            _handlers[typeof(T)] = list = new();
        list.Add(new WeakReference<Delegate>(handler));
    }

    public void Publish<T>(T ev)
    {
        if (!_handlers.TryGetValue(typeof(T), out var list)) return;
        foreach (var wr in list)
            if (wr.TryGetTarget(out var d))
                ((Action<T>)d)(ev);
    }
}`,
    explanation:
      "WeakReference<Delegate> lets subscribers be garbage-collected without explicit unsubscription; stale entries are skipped (TryGetTarget returns false) and can be pruned periodically.",
  },
  {
    id: "cs-class-unit-of-work",
    language: "csharp",
    title: "Unit of Work pattern",
    tag: "classes",
    code: `class UnitOfWork : IDisposable
{
    private readonly List<Action> _operations = new();
    private bool _committed;

    public void Register(Action op) => _operations.Add(op);

    public void Commit()
    {
        foreach (var op in _operations) op();
        _committed = true;
    }

    public void Dispose()
    {
        if (!_committed) Console.WriteLine("Rolled back — changes discarded");
    }
}

using var uow = new UnitOfWork();
uow.Register(() => Console.WriteLine("Saving order"));
uow.Register(() => Console.WriteLine("Updating inventory"));
uow.Commit();`,
    explanation:
      "Unit of Work collects operations and applies them atomically on Commit; if Dispose fires before Commit, the work can be rolled back — useful for batching database operations.",
  },
];
