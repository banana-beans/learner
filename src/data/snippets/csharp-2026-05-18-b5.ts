import type { Snippet } from "./types";

export const csharpSnippets20260518B5: Snippet[] = [
  // --- snippet ---
  {
    id: "cs-b18-b5-interceptors",
    language: "csharp",
    title: "Source generator interceptors (C# 12)",
    tag: "snippet",
    code: `// Interceptors redirect calls at compile time (experimental in C# 12)
// Requires: <InterceptorsPreviewNamespaces> in csproj

using System.Runtime.CompilerServices;

static class MyInterceptors
{
    [InterceptsLocation("Program.cs", line: 10, character: 5)]
    public static string ToUpperInterceptor(this string s)
    {
        Console.WriteLine("[intercepted]");
        return s.ToUpper();
    }
}

// At call site (line 10 of Program.cs):
// string result = "hello".ToUpper();  // redirected to interceptor`,
    explanation: "Interceptors (C# 12, experimental) redirect specific call sites to alternative methods at compile time without modifying source; source generators use them for zero-overhead instrumentation.",
  },
  {
    id: "cs-b18-b5-inline-array",
    language: "csharp",
    title: "InlineArray for fixed-size stack arrays (C# 12)",
    tag: "snippet",
    code: `using System.Runtime.CompilerServices;

// Fixed-size inline array — allocated on the stack
[InlineArray(8)]
struct Buffer8
{
    private int _element;
}

Buffer8 buf = default;
for (int i = 0; i < 8; i++)
    buf[i] = i * i;

// Index and slice like a span
Span<int> span = buf;
Console.WriteLine(span[3]);                    // 9
Console.WriteLine(string.Join(", ", span));    // 0,1,4,9,16,25,36,49`,
    explanation: "InlineArray (C# 12 / .NET 8) creates a fixed-size struct that behaves like an array with direct indexer support; it avoids heap allocation for small fixed-size buffers.",
  },
  {
    id: "cs-b18-b5-params-collection",
    language: "csharp",
    title: "params with collections (C# 13)",
    tag: "snippet",
    code: `// C# 13: params works with any collection type, not just arrays
static void PrintAll(params IEnumerable<string> items)
{
    foreach (var item in items)
        Console.WriteLine(item);
}

static int Sum(params ReadOnlySpan<int> nums)
{
    int total = 0;
    foreach (var n in nums) total += n;
    return total;
}

PrintAll("hello", "world");       // no array allocation
Console.WriteLine(Sum(1, 2, 3, 4, 5));  // 15

// Also works with List<T>, Span<T>, etc.
static void Log(params List<object?> args)
    => Console.WriteLine(string.Join(", ", args));`,
    explanation: "C# 13 extends params to work with any collection type; params ReadOnlySpan<T> avoids heap allocation entirely, combining the convenience of varargs with zero-allocation performance.",
  },
  {
    id: "cs-b18-b5-partial-property",
    language: "csharp",
    title: "Partial properties (C# 13)",
    tag: "snippet",
    code: `// Partial properties allow source generators to implement properties
// split across files (like partial methods)

// File 1: Declaration (user code)
partial class User
{
    public partial string Name { get; set; }
}

// File 2: Implementation (generated code)
partial class User
{
    private string _name = "";

    public partial string Name
    {
        get => _name;
        set
        {
            if (string.IsNullOrWhiteSpace(value))
                throw new ArgumentException("Name cannot be blank");
            _name = value;
        }
    }
}

var u = new User();
u.Name = "Alice";
Console.WriteLine(u.Name);`,
    explanation: "Partial properties (C# 13) split declaration and implementation across files, enabling source generators to inject property implementations (validation, INPC, caching) without user-visible boilerplate.",
  },
  {
    id: "cs-b18-b5-lock-type",
    language: "csharp",
    title: "System.Threading.Lock (.NET 9)",
    tag: "snippet",
    code: `using System.Threading;

// New Lock type (.NET 9) — more efficient than lock(object)
class Counter
{
    private readonly Lock _lock = new Lock();
    private int _value;

    public int Increment()
    {
        using (_lock.EnterScope())  // preferred: EnterScope for using
        {
            return ++_value;
        }
    }

    public int Value
    {
        get
        {
            using (_lock.EnterScope())
                return _value;
        }
    }
}

var c = new Counter();
Parallel.For(0, 1000, _ => c.Increment());
Console.WriteLine(c.Value);  // 1000`,
    explanation: "System.Threading.Lock (.NET 9) is a dedicated lock type that avoids boxing and provides better diagnostics than lock(object); EnterScope returns an IDisposable for using statements.",
  },
  {
    id: "cs-b18-b5-tensor-primitives",
    language: "csharp",
    title: "TensorPrimitives for vectorized math (.NET 8)",
    tag: "snippet",
    code: `using System;
using System.Numerics.Tensors;

float[] a = { 1f, 2f, 3f, 4f, 5f };
float[] b = { 5f, 4f, 3f, 2f, 1f };
float[] result = new float[5];

// Hardware-accelerated vectorized operations
TensorPrimitives.Add(a, b, result);
Console.WriteLine(string.Join(", ", result));  // 6,6,6,6,6

TensorPrimitives.Multiply(a, b, result);
Console.WriteLine(string.Join(", ", result));  // 5,8,9,8,5

float dot = TensorPrimitives.Dot<float>(a, b);
Console.WriteLine(dot);  // 35`,
    explanation: "System.Numerics.Tensors (.NET 8) provides SIMD-accelerated element-wise operations on spans of numeric types; it auto-selects AVX-512, AVX2, or SSE based on the hardware.",
  },
  {
    id: "cs-b18-b5-hybrid-cache",
    language: "csharp",
    title: "HybridCache (.NET 9)",
    tag: "snippet",
    code: `using Microsoft.Extensions.Caching.Hybrid;
using Microsoft.Extensions.DependencyInjection;

var services = new ServiceCollection();
services.AddHybridCache();

var provider = services.BuildServiceProvider();
var cache = provider.GetRequiredService<HybridCache>();

// GetOrCreateAsync: L1 (in-process) + L2 (distributed) cache
var value = await cache.GetOrCreateAsync(
    "product:42",
    async ct =>
    {
        await Task.Delay(10, ct);  // simulate DB lookup
        return new { Id = 42, Name = "Widget" };
    },
    new HybridCacheEntryOptions
    {
        Expiration = TimeSpan.FromMinutes(5),
        LocalCacheExpiration = TimeSpan.FromSeconds(30),
    });

Console.WriteLine(value?.Name);  // Widget`,
    explanation: "HybridCache (.NET 9) combines L1 in-process memory cache and an L2 distributed cache (Redis); it prevents cache stampede with automatic deduplication of concurrent fetches for the same key.",
  },
  {
    id: "cs-b18-b5-keyed-services",
    language: "csharp",
    title: "Keyed services in DI (.NET 8)",
    tag: "snippet",
    code: `using Microsoft.Extensions.DependencyInjection;

interface IMessageQueue { void Send(string msg); }
class RedisQueue : IMessageQueue { public void Send(string m) => Console.WriteLine($"Redis: {m}"); }
class SqlQueue  : IMessageQueue { public void Send(string m) => Console.WriteLine($"SQL: {m}");   }

var services = new ServiceCollection();
services.AddKeyedSingleton<IMessageQueue, RedisQueue>("redis");
services.AddKeyedSingleton<IMessageQueue, SqlQueue>("sql");

var provider = services.BuildServiceProvider();

// Resolve by key
var redis = provider.GetRequiredKeyedService<IMessageQueue>("redis");
var sql   = provider.GetRequiredKeyedService<IMessageQueue>("sql");

redis.Send("event");   // Redis: event
sql.Send("audit");     // SQL: audit`,
    explanation: "Keyed services (.NET 8) register multiple implementations of the same interface under string keys; GetRequiredKeyedService resolves the specific variant, replacing service locator workarounds.",
  },
  {
    id: "cs-b18-b5-frozen-set",
    language: "csharp",
    title: "FrozenSet<T> for read-only sets (.NET 8)",
    tag: "snippet",
    code: `using System.Collections.Frozen;
using System.Collections.Generic;

var allowedRoles = new HashSet<string> { "admin", "editor", "viewer" };
FrozenSet<string> frozen = allowedRoles.ToFrozenSet();

// Faster Contains than HashSet for read-heavy usage
Console.WriteLine(frozen.Contains("admin"));    // True
Console.WriteLine(frozen.Contains("hacker"));   // False

// Perfect hash for small sets; minimal perfect hash for large ones
var months = new[] { "Jan","Feb","Mar","Apr","May","Jun",
                     "Jul","Aug","Sep","Oct","Nov","Dec" }
    .ToFrozenSet(StringComparer.OrdinalIgnoreCase);

Console.WriteLine(months.Contains("jan"));      // True`,
    explanation: "FrozenSet<T> (.NET 8) is built once and optimized for reads with a near-perfect hash function; Contains is ~2x faster than HashSet for small sets and equivalent for large ones.",
  },
  {
    id: "cs-b18-b5-time-provider",
    language: "csharp",
    title: "TimeProvider for testable time (.NET 8)",
    tag: "snippet",
    code: `using System;
using System.Threading.Tasks;

// Production: use TimeProvider.System
class TokenValidator(TimeProvider clock)
{
    public bool IsExpired(DateTimeOffset expiry) =>
        clock.GetUtcNow() > expiry;
}

// Tests: use FakeTimeProvider (Microsoft.Extensions.TimeProvider.Testing)
// var fake = new FakeTimeProvider(DateTimeOffset.Parse("2026-01-01"));
// fake.Advance(TimeSpan.FromHours(2));

var validator = new TokenValidator(TimeProvider.System);
Console.WriteLine(validator.IsExpired(DateTimeOffset.UtcNow.AddHours(-1)));  // True
Console.WriteLine(validator.IsExpired(DateTimeOffset.UtcNow.AddHours(+1)));  // False`,
    explanation: "TimeProvider (.NET 8) abstracts the system clock; inject it instead of DateTime.Now/UtcNow so tests can control time with FakeTimeProvider without Thread.Sleep or unsafe static state.",
  },
  {
    id: "cs-b18-b5-collection-marshal",
    language: "csharp",
    title: "CollectionsMarshal for dictionary in-place update",
    tag: "snippet",
    code: `using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;

var counts = new Dictionary<string, int>
{
    ["apple"] = 5,
    ["banana"] = 3,
};

// Get a reference to the value — avoids double lookup
ref int appleCount = ref CollectionsMarshal.GetValueRefOrAddDefault(
    counts, "apple", out bool existed);

appleCount++;  // modifies value in-place — no re-hash
Console.WriteLine(counts["apple"]);  // 6

// Add a new key atomically
ref int cherryCount = ref CollectionsMarshal.GetValueRefOrAddDefault(
    counts, "cherry", out existed);
if (!existed) cherryCount = 10;
Console.WriteLine(counts["cherry"]);  // 10`,
    explanation: "CollectionsMarshal.GetValueRefOrAddDefault returns a ref to the dictionary value, enabling in-place mutation with a single lookup — twice as fast as Get+Set for frequently updated counters.",
  },
  {
    id: "cs-b18-b5-ordereddictionary",
    language: "csharp",
    title: "OrderedDictionary<K,V> (.NET 9)",
    tag: "snippet",
    code: `using System.Collections.Generic;

// .NET 9: generic, insertion-order-preserving dictionary
var od = new OrderedDictionary<string, int>();
od.Add("banana", 2);
od.Add("apple",  1);
od.Add("cherry", 3);

// Iterates in insertion order
foreach (var (k, v) in od)
    Console.WriteLine($"{k}: {v}");
// banana: 2
// apple: 1
// cherry: 3

// Index-based access
Console.WriteLine(od.GetAt(0).Value);  // 2 (first inserted)
od.SetAt(0, new KeyValuePair<string, int>("banana", 20));`,
    explanation: "OrderedDictionary<K,V> (.NET 9) is the generic, type-safe version of the classic OrderedDictionary; it preserves insertion order while providing O(1) key lookups and index-based access.",
  },
  {
    id: "cs-b18-b5-guid-v7",
    language: "csharp",
    title: "Guid.CreateVersion7 for sortable IDs (.NET 9)",
    tag: "snippet",
    code: `using System;

// Version 7 UUIDs: time-ordered (good for database clustering)
Guid id1 = Guid.CreateVersion7();
System.Threading.Thread.Sleep(1);  // ensure different timestamp
Guid id2 = Guid.CreateVersion7();

Console.WriteLine(id1);                    // sortable by time
Console.WriteLine(id2);
Console.WriteLine(string.Compare(
    id1.ToString(), id2.ToString()) < 0);  // True: id1 < id2

// Extract timestamp from v7 GUID
// (upper 48 bits contain unix milliseconds)`,
    explanation: "Guid.CreateVersion7 (.NET 9) generates UUID v7 which embeds a millisecond timestamp in the high bits; sequential GUIDs improve clustered index performance versus random UUID v4.",
  },
  {
    id: "cs-b18-b5-base64-url",
    language: "csharp",
    title: "Base64Url encoding (.NET 9)",
    tag: "snippet",
    code: `using System;
using System.Buffers.Text;

byte[] data = new byte[] { 0xFF, 0xFE, 0x00, 0x01, 0xAB };

// Standard Base64 uses + and / (not URL safe)
string standard = Convert.ToBase64String(data);
Console.WriteLine(standard);   // //4AAas=

// URL-safe Base64 (uses - and _ instead of + and /)
string urlSafe = Base64Url.EncodeToString(data);  // .NET 9
Console.WriteLine(urlSafe);    // __4AAas

// Decode back
byte[] decoded = Base64Url.DecodeFromChars(urlSafe);
Console.WriteLine(decoded.SequenceEqual(data));  // True`,
    explanation: "Base64Url (.NET 9) encodes to URL-safe base64 without padding; it uses - and _ instead of + and /, making tokens safe in URLs, cookies, and JWTs without percent-encoding.",
  },
  {
    id: "cs-b18-b5-span-split",
    language: "csharp",
    title: "MemoryExtensions.Split for zero-allocation parsing",
    tag: "snippet",
    code: `using System;
using System.Buffers;

ReadOnlySpan<char> csv = "alice,bob,carol,dave".AsSpan();

// Split without allocating strings
var tokenizer = csv.Split(',');
foreach (var range in tokenizer)
{
    ReadOnlySpan<char> token = csv[range];
    Console.WriteLine(token.ToString());
}
// alice
// bob
// carol
// dave`,
    explanation: "MemoryExtensions.Split returns a SpanSplitEnumerator that yields Range structs into the original span; combined with span slicing, it parses delimited data with zero heap allocations.",
  },

  // --- understanding ---
  {
    id: "cs-b18-b5-partial-methods-semantics",
    language: "csharp",
    title: "Partial methods and their semantics",
    tag: "understanding",
    code: `partial class DataModel
{
    // Declaring partial method (no implementation required)
    partial void OnPropertyChanged(string propertyName);

    public void UpdateName(string name)
    {
        // If no implementation, call is removed by compiler
        OnPropertyChanged(nameof(name));
        Name = name;
    }

    public string Name { get; private set; } = "";
}

// Implementation (optional; typically in generated file)
partial class DataModel
{
    partial void OnPropertyChanged(string propertyName)
    {
        Console.WriteLine($"Changed: {propertyName}");
    }
}

var m = new DataModel();
m.UpdateName("Alice");  // Changed: name`,
    explanation: "Partial methods split declaration and implementation; if no implementation is provided, the call is completely removed at compile time with zero overhead — ideal for optional hooks in generated code.",
  },
  {
    id: "cs-b18-b5-delegate-vs-lambda",
    language: "csharp",
    title: "Delegates, lambdas, and method groups",
    tag: "understanding",
    code: `using System;
using System.Collections.Generic;
using System.Linq;

// All three are equivalent delegates:
Func<int, bool> isEven1 = delegate(int n) { return n % 2 == 0; };
Func<int, bool> isEven2 = n => n % 2 == 0;
Func<int, bool> isEven3 = IsEven;   // method group

static bool IsEven(int n) => n % 2 == 0;

// Method group avoids allocating a new lambda
int[] nums = { 1, 2, 3, 4, 5 };
var evens = nums.Where(IsEven).ToList();          // no extra allocation
var evens2 = nums.Where(n => n % 2 == 0).ToList(); // lambda allocation

Console.WriteLine(string.Join(", ", evens));  // 2, 4`,
    explanation: "Method groups (Where(IsEven)) avoid lambda closure allocation; delegates and lambdas compile to the same IL but method groups can be cached by the JIT. Prefer method groups in hot paths.",
  },
  {
    id: "cs-b18-b5-csharp-enumerator",
    language: "csharp",
    title: "Custom IEnumerable<T> without yield",
    tag: "understanding",
    code: `using System;
using System.Collections;
using System.Collections.Generic;

class Range : IEnumerable<int>
{
    private readonly int _start, _end;
    public Range(int start, int end) => (_start, _end) = (start, end);

    public IEnumerator<int> GetEnumerator() => new RangeEnumerator(_start, _end);
    IEnumerator IEnumerable.GetEnumerator() => GetEnumerator();

    private class RangeEnumerator(int start, int end) : IEnumerator<int>
    {
        private int _current = start - 1;
        public int     Current    => _current;
        object IEnumerator.Current => _current;
        public bool MoveNext()    => ++_current < end;
        public void Reset()       => _current = start - 1;
        public void Dispose()     { }
    }
}

foreach (int n in new Range(1, 5))
    Console.Write(n + " ");  // 1 2 3 4`,
    explanation: "Implementing IEnumerable<T> manually shows what yield return generates automatically: GetEnumerator returns an enumerator object with MoveNext/Current/Reset. The compiler generates this for you with yield.",
  },
  {
    id: "cs-b18-b5-static-constructor",
    language: "csharp",
    title: "Static constructors and BeforeFieldInit",
    tag: "understanding",
    code: `class WithStaticCtor
{
    static readonly int X;

    static WithStaticCtor()
    {
        Console.WriteLine("Static ctor called");
        X = 42;
    }
}

class WithoutStaticCtor
{
    // No static ctor: BeforeFieldInit — initialized lazily
    static readonly int Y = 42;
}

// Static ctor is called at first type usage (before first instance/static member access)
Console.WriteLine("Before type use");
Console.WriteLine(WithStaticCtor.X);   // "Static ctor called" then 42
Console.WriteLine(WithoutStaticCtor.Y); // 42 (no printed message)`,
    explanation: "A static constructor (type initializer) runs exactly once before first type use. Without one, BeforeFieldInit applies — the runtime may initialize static fields lazily. The presence of a static ctor disables BeforeFieldInit.",
  },
  {
    id: "cs-b18-b5-stackalloc-limits",
    language: "csharp",
    title: "stackalloc limits and overflow risks",
    tag: "understanding",
    code: `using System;

static void Safe(int size)
{
    // Default stack size is ~1 MB on Windows, 8 MB on Linux
    // stackalloc for large sizes can cause StackOverflowException
    if (size > 1024)
        throw new ArgumentException("Too large for stack");

    Span<byte> buf = stackalloc byte[size];
    buf.Fill(0);
    Console.WriteLine($"Allocated {size} bytes on stack");
}

Safe(128);    // fine
// Safe(100_000); // dangerous — stack overflow

// Check available stack at runtime
Console.WriteLine(System.Runtime.CompilerServices.RuntimeHelpers.EnsureSufficientExecutionStack());`,
    explanation: "stackalloc is fast but limited by the thread's stack size (~1-8 MB); large allocations cause StackOverflowException which can't be caught. Limit to a few KB and use ArrayPool for larger needs.",
  },
  {
    id: "cs-b18-b5-equality-comparers",
    language: "csharp",
    title: "Custom IEqualityComparer<T> for collections",
    tag: "understanding",
    code: `using System;
using System.Collections.Generic;

class CaseInsensitiveComparer : IEqualityComparer<string>
{
    public bool Equals(string? x, string? y) =>
        string.Equals(x, y, StringComparison.OrdinalIgnoreCase);

    public int GetHashCode(string? s) =>
        s?.ToUpperInvariant().GetHashCode() ?? 0;
}

var set = new HashSet<string>(new CaseInsensitiveComparer());
set.Add("Hello");
Console.WriteLine(set.Contains("hello"));  // True
Console.WriteLine(set.Contains("HELLO"));  // True

// Also used for Dictionary keys and LINQ Distinct/GroupBy
var groups = new[] { "a", "A", "b", "B" }
    .GroupBy(s => s, new CaseInsensitiveComparer());
Console.WriteLine(groups.Count());  // 2`,
    explanation: "IEqualityComparer<T> decouples equality logic from the type itself; pass it to collections or LINQ operators. GetHashCode must be consistent with Equals — same-Equals objects must have same hash.",
  },
  {
    id: "cs-b18-b5-async-local",
    language: "csharp",
    title: "AsyncLocal<T> for async context propagation",
    tag: "understanding",
    code: `using System;
using System.Threading;
using System.Threading.Tasks;

static readonly AsyncLocal<string> RequestId = new();

static async Task Handler(string id)
{
    RequestId.Value = id;
    await Task.Delay(10);
    Console.WriteLine($"Handler {id}: {RequestId.Value}");
    await SubTask();
}

static async Task SubTask()
{
    // Inherits value from parent async context
    Console.WriteLine($"SubTask: {RequestId.Value}");
}

await Task.WhenAll(
    Handler("request-1"),
    Handler("request-2")
);`,
    explanation: "AsyncLocal<T> flows values through async continuations; each async Task inherits the parent's value at the point of creation. Unlike ThreadLocal, it handles async context switches correctly.",
  },
  {
    id: "cs-b18-b5-concurrent-reader-writer",
    language: "csharp",
    title: "Lock-free reads with Interlocked",
    tag: "understanding",
    code: `using System;
using System.Threading;
using System.Threading.Tasks;

class LockFreeCounter
{
    private long _count;

    public void Increment() => Interlocked.Increment(ref _count);
    public void Add(long n)  => Interlocked.Add(ref _count, n);
    public long Read()       => Interlocked.Read(ref _count);

    // Compare-and-swap: only update if still expected value
    public bool TrySetMax(long newValue)
    {
        long current = _count;
        return current < newValue &&
               Interlocked.CompareExchange(ref _count, newValue, current) == current;
    }
}

var c = new LockFreeCounter();
await Task.WhenAll(Enumerable.Range(0, 1000).Select(_ =>
    Task.Run(c.Increment)));
Console.WriteLine(c.Read());  // 1000`,
    explanation: "Interlocked provides atomic read-modify-write operations without locks; Increment/Add are atomic; CompareExchange is the CAS primitive for optimistic lock-free algorithms.",
  },
  {
    id: "cs-b18-b5-span-vs-memory",
    language: "csharp",
    title: "Span<T> ref-struct limitations",
    tag: "understanding",
    code: `using System;
using System.Collections.Generic;

// Span<T> is a ref struct — cannot be:
// - stored in a class field
// - used as a generic type argument
// - used in async methods
// - boxed or cast to object

// WORKS: local variable, method parameter, ref struct field
static int SumSpan(Span<int> data)
{
    int s = 0; foreach (var v in data) s += v; return s;
}

// FAILS: class field
// class Bad { private Span<int> _s; }  // compile error

// For async/class storage: use Memory<T>
class Processor
{
    private Memory<int> _data;  // OK in class
    public Processor(int[] arr) => _data = arr;
    public async Task<int> SumAsync()
    {
        await Task.Delay(0);
        return SumSpan(_data.Span);  // Span from Memory, only in sync context
    }
}`,
    explanation: "Span<T> is a ref struct: it can only live on the stack, preventing its use as class fields, generic arguments, or in async methods. Memory<T> is the heap-storeable alternative for those contexts.",
  },
  {
    id: "cs-b18-b5-record-equality",
    language: "csharp",
    title: "Record structural equality semantics",
    tag: "understanding",
    code: `record Point(double X, double Y);
record NamedPoint(string Label, double X, double Y) : Point(X, Y);

var p1 = new Point(1, 2);
var p2 = new Point(1, 2);
var p3 = new NamedPoint("A", 1, 2);

// Record equality: structural (value-based)
Console.WriteLine(p1 == p2);          // True
Console.WriteLine(p1.Equals(p2));     // True
Console.WriteLine(ReferenceEquals(p1, p2));  // False

// Derived record equality includes all properties
Console.WriteLine((Point)p3 == p1);   // False! p3 has Label

// Records auto-generate GetHashCode from all properties
var dict = new Dictionary<Point, string>();
dict[p1] = "first";
Console.WriteLine(dict[p2]);  // "first" (same hash and equal)`,
    explanation: "Records generate value-based equality using all properties; derived records include the runtime type in equality, so a NamedPoint(\"A\",1,2) != Point(1,2) even when upcast.",
  },
  {
    id: "cs-b18-b5-threading-model",
    language: "csharp",
    title: "SynchronizationContext and ConfigureAwait",
    tag: "understanding",
    code: `using System.Threading;
using System.Threading.Tasks;

// In ASP.NET Core: no SynchronizationContext (by design)
// In WPF/WinForms/Blazor WASM: UI thread SynchronizationContext

async Task<string> FetchData()
{
    // ConfigureAwait(false): don't capture SynchronizationContext
    // Continuation can run on any thread — more efficient in libraries
    await Task.Delay(100).ConfigureAwait(false);
    return "data";
}

// In library code: always ConfigureAwait(false)
// In application code: ConfigureAwait(true) (default) to stay on UI thread

// Capture current context
var ctx = SynchronizationContext.Current;
Console.WriteLine(ctx?.GetType().Name ?? "null (thread pool)");`,
    explanation: "ConfigureAwait(false) prevents capturing the SynchronizationContext; in libraries it's mandatory to avoid deadlocks in consumers with a sync context. In UI apps, omit it to stay on the UI thread.",
  },
  {
    id: "cs-b18-b5-expression-vs-statement",
    language: "csharp",
    title: "Expression lambdas vs statement lambdas",
    tag: "understanding",
    code: `using System;
using System.Linq.Expressions;

// Expression lambda: compilable to Expression<T> — queryable
Expression<Func<int, bool>> exprLambda = x => x > 5;

// Statement lambda: only Func<T> — not queryable
Func<int, bool> stmtLambda = x => { return x > 5; };

// EF Core, LINQ-to-SQL need Expression<T>
// They inspect the AST, not execute the delegate
Console.WriteLine(exprLambda.Body);      // (x > 5) — AST node

// Compile to delegate when needed
var fn = exprLambda.Compile();
Console.WriteLine(fn(6));  // True
Console.WriteLine(fn(3));  // False`,
    explanation: "Expression lambdas can be captured as Expression<T> trees for inspection by LINQ providers (EF Core); statement lambdas (with {}) can only be Func/Action — the compiler can't build an expression tree from them.",
  },

  // --- structures ---
  {
    id: "cs-b18-b5-span-tokenizer",
    language: "csharp",
    title: "Zero-allocation CSV tokenizer with Span",
    tag: "structures",
    code: `using System;

static void ParseCsvLine(ReadOnlySpan<char> line)
{
    int start = 0;
    for (int i = 0; i <= line.Length; i++)
    {
        if (i == line.Length || line[i] == ',')
        {
            var token = line.Slice(start, i - start).Trim();
            Console.WriteLine(token.ToString());
            start = i + 1;
        }
    }
}

ParseCsvLine("  alice , 30 , NYC ".AsSpan());
// alice
// 30
// NYC`,
    explanation: "Span-based tokenization avoids string allocations for each token; Trim() on a span returns a trimmed span pointing into the original memory, keeping the entire operation on the stack.",
  },
  {
    id: "cs-b18-b5-concurrent-sorted",
    language: "csharp",
    title: "Thread-safe sorted set with ConcurrentDictionary",
    tag: "structures",
    code: `using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;

class ConcurrentSortedSet<T> where T : notnull
{
    private readonly ConcurrentDictionary<T, byte> _dict = new();

    public bool Add(T item)    => _dict.TryAdd(item, 0);
    public bool Remove(T item) => _dict.TryRemove(item, out _);
    public bool Contains(T item) => _dict.ContainsKey(item);

    // Snapshot sorted
    public IEnumerable<T> Sorted(IComparer<T>? comparer = null) =>
        _dict.Keys.OrderBy(x => x, comparer);
}

var set = new ConcurrentSortedSet<int>();
Parallel.For(0, 20, i => set.Add(i % 10));
Console.WriteLine(string.Join(", ", set.Sorted()));  // 0,1,2,...,9`,
    explanation: "ConcurrentDictionary<T,byte> provides a thread-safe set; the byte value is a dummy. Sorted() snapshots keys and sorts them — note the sort is O(n log n) on each call.",
  },
  {
    id: "cs-b18-b5-immutable-stack",
    language: "csharp",
    title: "ImmutableStack<T> for functional data",
    tag: "structures",
    code: `using System.Collections.Immutable;
using System.Linq;

// Functional persistent stack
var empty   = ImmutableStack<int>.Empty;
var s1      = empty.Push(1);
var s2      = s1.Push(2).Push(3);

Console.WriteLine(s2.Peek());   // 3

// Pop doesn't mutate — returns new stack
var s3 = s2.Pop();
Console.WriteLine(s3.Peek());   // 2
Console.WriteLine(s2.Peek());   // 3 (s2 unchanged)

// Iterate
foreach (int v in s2)
    Console.Write(v + " ");  // 3 2 1`,
    explanation: "ImmutableStack<T> is a persistent (functional) stack using structural sharing; Push and Pop create new stacks in O(1) while sharing all existing nodes — zero-copy history for undo stacks.",
  },
  {
    id: "cs-b18-b5-lookup-grouping",
    language: "csharp",
    title: "ILookup<K,V> for multi-value grouping",
    tag: "structures",
    code: `using System.Linq;

var words = new[] { "apple", "avocado", "banana", "blueberry", "cherry" };

// ToLookup: like GroupBy but creates an ILookup (random access by key)
var byLetter = words.ToLookup(w => w[0]);

Console.WriteLine(string.Join(", ", byLetter['a']));  // apple, avocado
Console.WriteLine(string.Join(", ", byLetter['b']));  // banana, blueberry
Console.WriteLine(byLetter['z'].Any());               // False (no exception!)

// Unlike Dictionary<K, List<V>>, ILookup returns empty for missing keys
foreach (var group in byLetter)
    Console.WriteLine($"{group.Key}: {group.Count()}");`,
    explanation: "ILookup<K,V> from ToLookup() is an immutable GroupBy result with O(1) key access; unlike Dictionary<K,List<V>>, accessing a missing key returns an empty sequence instead of throwing.",
  },
  {
    id: "cs-b18-b5-sparse-set",
    language: "csharp",
    title: "Sparse set for O(1) clear and contains",
    tag: "structures",
    code: `class SparseSet
{
    private readonly int[] _sparse;  // sparse[val] = index in dense
    private readonly int[] _dense;   // dense[0..count] = values
    private int _count;

    public SparseSet(int maxVal)
    {
        _sparse = new int[maxVal];
        _dense  = new int[maxVal];
    }

    public void Add(int val)
    {
        if (Contains(val)) return;
        _sparse[val] = _count;
        _dense[_count] = val;
        _count++;
    }

    public bool Contains(int val) =>
        _sparse[val] < _count && _dense[_sparse[val]] == val;

    public void Clear() => _count = 0;  // O(1)!

    public System.Span<int> Values => _dense.AsSpan(0, _count);
}

var s = new SparseSet(100);
s.Add(5); s.Add(42); s.Add(7);
Console.WriteLine(s.Contains(42));  // True
s.Clear();
Console.WriteLine(s.Contains(42));  // False (O(1) clear)`,
    explanation: "A sparse set achieves O(1) contains, add, and clear by using two arrays; clear just resets the count, leaving stale data that the contains check ignores using the cross-reference invariant.",
  },
  {
    id: "cs-b18-b5-interval-tree-cs",
    language: "csharp",
    title: "Interval overlap query",
    tag: "structures",
    code: `using System.Collections.Generic;
using System.Linq;

record Interval(int Start, int End);

class IntervalList
{
    private readonly List<Interval> _intervals = new();

    public void Add(Interval iv) => _intervals.Add(iv);

    public IEnumerable<Interval> Overlapping(int start, int end) =>
        _intervals.Where(iv => iv.Start <= end && iv.End >= start);
}

var ivs = new IntervalList();
ivs.Add(new Interval(1, 5));
ivs.Add(new Interval(3, 7));
ivs.Add(new Interval(8, 10));

foreach (var iv in ivs.Overlapping(4, 6))
    Console.WriteLine($"[{iv.Start},{iv.End}]");
// [1,5]
// [3,7]`,
    explanation: "Two intervals [a,b] and [c,d] overlap iff a<=d && b>=c; this linear scan is O(n) — for production use a proper interval tree or segment tree when n is large.",
  },
  {
    id: "cs-b18-b5-matrix-transposition",
    language: "csharp",
    title: "Matrix transposition with Span2D",
    tag: "structures",
    code: `using System;
using System.Linq;

static int[,] Transpose(int[,] m)
{
    int rows = m.GetLength(0), cols = m.GetLength(1);
    var result = new int[cols, rows];
    for (int i = 0; i < rows; i++)
        for (int j = 0; j < cols; j++)
            result[j, i] = m[i, j];
    return result;
}

int[,] matrix = { { 1, 2, 3 }, { 4, 5, 6 } };
var t = Transpose(matrix);

for (int i = 0; i < t.GetLength(0); i++)
{
    for (int j = 0; j < t.GetLength(1); j++)
        Console.Write(t[i, j] + " ");
    Console.WriteLine();
}
// 1 4
// 2 5
// 3 6`,
    explanation: "Matrix transposition swaps rows and columns: element [i,j] becomes [j,i]. The result has dimensions swapped. Cache-friendly access matters for large matrices — iterate in row-major order.",
  },
  {
    id: "cs-b18-b5-task-completion-source",
    language: "csharp",
    title: "TaskCompletionSource as async promise",
    tag: "structures",
    code: `using System;
using System.Threading;
using System.Threading.Tasks;

class AsyncQueue<T>
{
    private readonly System.Collections.Generic.Queue<TaskCompletionSource<T>> _waiters = new();
    private readonly System.Collections.Generic.Queue<T> _items = new();

    public void Enqueue(T item)
    {
        if (_waiters.Count > 0)
            _waiters.Dequeue().SetResult(item);
        else
            _items.Enqueue(item);
    }

    public Task<T> DequeueAsync()
    {
        if (_items.Count > 0)
            return Task.FromResult(_items.Dequeue());
        var tcs = new TaskCompletionSource<T>();
        _waiters.Enqueue(tcs);
        return tcs.Task;
    }
}

var q = new AsyncQueue<int>();
var task = q.DequeueAsync();        // no item yet — returns pending task
q.Enqueue(42);                      // resolves the task
Console.WriteLine(await task);      // 42`,
    explanation: "TaskCompletionSource<T> is a manual async promise; SetResult resolves the awaitable task from outside. It bridges callback-based or event-based APIs into the async/await model.",
  },

  // --- caveats ---
  {
    id: "cs-b18-b5-integer-division",
    language: "csharp",
    title: "Integer division truncates toward zero",
    tag: "caveats",
    code: `// Integer division truncates toward zero (not floor)
Console.WriteLine(7  / 2);   //  3 (not 3.5)
Console.WriteLine(-7 / 2);   // -3 (truncated toward zero, NOT -4)

// Math.Floor rounds toward negative infinity
Console.WriteLine((int)Math.Floor(-7.0 / 2.0));  // -4

// Ceiling division (e.g., page count)
int total = 10, pageSize = 3;
int pages = (total + pageSize - 1) / pageSize;  // 4 (correct)
// Don't use Math.Ceiling(total / pageSize) — integer division first!
Console.WriteLine(pages);

// Modulo: sign follows dividend in C#
Console.WriteLine(-7 % 2);   // -1 (not 1)`,
    explanation: "C# integer division truncates toward zero, not toward negative infinity; -7/2 is -3, not -4. For floor division, use Math.Floor(a/(double)b). Modulo sign follows the dividend.",
  },
  {
    id: "cs-b18-b5-interface-explicit",
    language: "csharp",
    title: "Explicit interface implementation hides members",
    tag: "caveats",
    code: `interface IFoo { void Method(); }
interface IBar { void Method(); }

class Impl : IFoo, IBar
{
    // Explicit implementation: only accessible via interface reference
    void IFoo.Method() => Console.WriteLine("IFoo.Method");
    void IBar.Method() => Console.WriteLine("IBar.Method");
}

var obj = new Impl();
// obj.Method();          // compile error — ambiguous / hidden

IFoo foo = obj;
foo.Method();              // IFoo.Method

IBar bar = obj;
bar.Method();              // IBar.Method`,
    explanation: "Explicit interface implementations resolve ambiguity when two interfaces have the same member; the downside is that the method is only accessible through an interface-typed reference, not through the class.",
  },
  {
    id: "cs-b18-b5-using-pattern-disposal",
    language: "csharp",
    title: "Nested using and exception ordering",
    tag: "caveats",
    code: `using System;

class Resource : IDisposable
{
    private readonly string _name;
    public Resource(string name) { _name = name; Console.WriteLine($"Open {_name}"); }
    public void Dispose() => Console.WriteLine($"Close {_name}");
}

// Outer resource is always disposed even if inner throws
using var outer = new Resource("outer");   // declaration form
using (var inner = new Resource("inner"))
{
    throw new Exception("boom");
}
// Disposal order: inner first, then outer (LIFO)
// Output:
// Open outer
// Open inner
// Close inner
// Close outer
// (then exception propagates)`,
    explanation: "using disposes in LIFO order; declaration-form using (without braces) disposes at the end of the enclosing scope. Disposal always runs even when exceptions occur, preventing resource leaks.",
  },
  {
    id: "cs-b18-b5-generic-new-constraint",
    language: "csharp",
    title: "new() constraint calls default constructor",
    tag: "caveats",
    code: `using System;

class Factory<T> where T : new()
{
    public T Create() => new T();
}

class Good { public Good() { Console.WriteLine("Created"); } }

// PROBLEM: new T() always calls the default (parameterless) constructor
// You can't pass arguments or use a non-default constructor
var f = new Factory<Good>();
var g = f.Create();   // Created

// Workaround: use Activator or a factory delegate
static T CreateWith<T>(Func<T> factory) => factory();
var g2 = CreateWith(() => new Good());

// In .NET 9: CreateInstance<T>() for performance-sensitive creation`,
    explanation: "The new() constraint only allows calling the parameterless constructor; you can't pass arguments through new T(). Use a Func<T> factory delegate for parameterized construction.",
  },
  {
    id: "cs-b18-b5-volatile-not-enough",
    language: "csharp",
    title: "volatile is not a substitute for locks",
    tag: "caveats",
    code: `using System.Threading;

class Counter
{
    private volatile int _count;

    // volatile prevents read/write reordering, but not compound ops
    public void Increment()
    {
        _count++;  // NOT atomic! read-modify-write is 3 operations
    }

    // With volatile: read and write of _count are individually atomic
    // But increment is not: thread A reads 5, thread B reads 5,
    // both write 6 — lost update!

    // Correct: use Interlocked
    public void SafeIncrement() => Interlocked.Increment(ref _count);
}`,
    explanation: "volatile ensures individual reads/writes are visible across threads but doesn't make compound operations (read-modify-write) atomic. Use Interlocked or lock for thread-safe mutation.",
  },
  {
    id: "cs-b18-b5-params-array-allocation",
    language: "csharp",
    title: "params arrays allocate on each call",
    tag: "caveats",
    code: `using System;

static int Sum(params int[] nums)  // allocates int[] on each call
{
    int total = 0;
    foreach (var n in nums) total += n;
    return total;
}

// Called in a hot loop — creates a new array each iteration
for (int i = 0; i < 1_000_000; i++)
    Sum(1, 2, 3);  // 1M array allocations!

// Fix 1: params ReadOnlySpan<int> (C# 13) — no allocation
// Fix 2: overloads for 1-4 args + params for rest
static int SumFast(int a) => a;
static int SumFast(int a, int b) => a + b;
static int SumFast(int a, int b, int c) => a + b + c;
static int SumFast(params int[] rest) => Sum(rest);`,
    explanation: "params int[] allocates a new array for each call, creating GC pressure in hot loops. C# 13 params ReadOnlySpan<int> avoids this. For critical paths, provide concrete overloads for common argument counts.",
  },
  {
    id: "cs-b18-b5-string-interning-perf",
    language: "csharp",
    title: "String interning in loops vs dictionary",
    tag: "caveats",
    code: `using System;
using System.Diagnostics;

// string.Intern pools strings — O(n) for unique strings
// but slows down GC and can cause memory bloat

var sw = Stopwatch.StartNew();
for (int i = 0; i < 100_000; i++)
{
    // BAD for unique strings: fills intern pool
    // string.Intern($"key_{i}");

    // BETTER: only intern truly repeated strings
    string key = $"key_{i % 100}";  // 100 unique values
    string interned = string.Intern(key);
}
sw.Stop();
Console.WriteLine($"Elapsed: {sw.ElapsedMilliseconds}ms");`,
    explanation: "string.Intern permanently adds strings to a global pool; using it on large numbers of unique strings fills the pool, slows GC, and leaks memory. Reserve interning for a small set of repeated strings.",
  },

  // --- types ---
  {
    id: "cs-b18-b5-where-allows-ref-struct",
    language: "csharp",
    title: "allows ref struct constraint (C# 13)",
    tag: "types",
    code: `using System;

// C# 13: allows ref struct enables generics over Span<T> etc.
static void Process<T>(T data) where T : allows ref struct
{
    Console.WriteLine(data?.ToString() ?? "null");
}

// Now works with Span<T>
Span<int> span = stackalloc int[] { 1, 2, 3 };
Process(span);           // System.Span<System.Int32>[3]

// Also works with regular types
Process("hello");        // hello
Process(42);             // 42`,
    explanation: "allows ref struct (C# 13) enables generic type parameters to be ref structs like Span<T>; previously generics couldn't accept ref structs because they might be stored in ways ref structs disallow.",
  },
  {
    id: "cs-b18-b5-interceptors-source-gen",
    language: "csharp",
    title: "Compile-time duck typing via interfaces",
    tag: "types",
    code: `// Duck typing via generic constraints (structural typing workaround)
using System;
using System.Numerics;

// C# interfaces provide nominal typing, not structural typing
// But you can use generic constraints to simulate it

interface IArea { double Area(); }

static double TotalArea<T>(T[] shapes) where T : IArea
{
    double total = 0;
    foreach (var s in shapes) total += s.Area();
    return total;
}

class Circle2(double r) : IArea { public double Area() => Math.PI * r * r; }
class Rect2(double w, double h) : IArea { public double Area() => w * h; }

// Works for any mix of IArea implementations
IArea[] shapes = { new Circle2(5), new Rect2(3, 4) };
Console.WriteLine(TotalArea(shapes));  // 90.54`,
    explanation: "C# uses nominal typing (explicit interface declaration); generic where T : IArea is the closest to structural typing. This pattern works for any T implementing IArea regardless of inheritance hierarchy.",
  },
  {
    id: "cs-b18-b5-extension-everything",
    language: "csharp",
    title: "Extension methods on any type",
    tag: "types",
    code: `using System;
using System.Collections.Generic;

static class Extensions
{
    // Extend value types
    public static bool IsBetween(this int n, int lo, int hi) => n >= lo && n <= hi;

    // Extend interfaces
    public static void AddRange<T>(this ICollection<T> col, IEnumerable<T> items)
    {
        foreach (var item in items) col.Add(item);
    }

    // Extend nullables
    public static T OrDefault<T>(this T? nullable, T defaultVal) where T : struct
        => nullable ?? defaultVal;
}

Console.WriteLine(5.IsBetween(1, 10));      // True
Console.WriteLine(((int?)null).OrDefault(42));  // 42

var list = new List<int> { 1, 2, 3 };
list.AddRange(new[] { 4, 5, 6 });
Console.WriteLine(list.Count);              // 6`,
    explanation: "Extension methods work on any type including value types, interfaces, nullable types, and sealed classes; they're syntactic sugar for static calls but enable fluent APIs and retrofitting.",
  },
  {
    id: "cs-b18-b5-typeof-nameof",
    language: "csharp",
    title: "typeof, nameof, and sizeof operators",
    tag: "types",
    code: `using System;

// typeof: get Type object at compile time — no runtime lookup
Type t = typeof(List<int>);
Console.WriteLine(t.Name);              // List\`1
Console.WriteLine(t.GenericTypeArguments[0].Name);  // Int32

// nameof: string of identifier — compile-time constant, refactoring-safe
string propName = nameof(Console.WriteLine);
Console.WriteLine(propName);            // WriteLine

class Config { public string Host { get; set; } = ""; }
void Validate(Config c)
{
    if (c.Host == null)
        throw new ArgumentNullException(nameof(c.Host));  // "Host"
}

// sizeof: size in bytes of an unmanaged type
Console.WriteLine(sizeof(int));         // 4
Console.WriteLine(sizeof(double));      // 8`,
    explanation: "typeof is evaluated at compile time with no runtime overhead; nameof produces a refactoring-safe string constant; sizeof works on unmanaged types without unsafe context (for built-ins).",
  },
  {
    id: "cs-b18-b5-type-pattern-matching-new",
    language: "csharp",
    title: "Negation and conjunction patterns",
    tag: "types",
    code: `int n = 42;
string s = "hello";

// Negation: not pattern
Console.WriteLine(n is not 0);                 // True
Console.WriteLine(s is not null);              // True

// Conjunction: and pattern
Console.WriteLine(n is >= 1 and <= 100);       // True
Console.WriteLine(n is > 0 and < 50 and int i ? i : -1);  // 42

// Disjunction: or pattern
Console.WriteLine(n is 41 or 42 or 43);        // True

// Combined with type pattern
object obj = 42;
Console.WriteLine(obj is int x and > 10);      // True

// Useful in switch
string Describe(int v) => v switch
{
    0         => "zero",
    < 0       => "negative",
    > 0 and <= 10 => "small positive",
    _         => "large positive",
};`,
    explanation: "C# 9+ pattern combinators: not negates, and requires both, or requires either. They compose with type, relational, constant, and property patterns for expressive exhaustive dispatch.",
  },

  // --- families ---
  {
    id: "cs-b18-b5-orleans-grain",
    language: "csharp",
    title: "Microsoft Orleans actor model",
    tag: "families",
    code: `using Orleans;

// Grain interface
public interface ICounterGrain : IGrainWithIntegerKey
{
    Task<int> Increment();
    Task<int> GetValue();
}

// Grain implementation
public class CounterGrain : Grain, ICounterGrain
{
    private int _count;

    public Task<int> Increment()
    {
        _count++;
        return Task.FromResult(_count);
    }

    public Task<int> GetValue() => Task.FromResult(_count);
}

// Client usage:
// var grain = client.GetGrain<ICounterGrain>(grainId: 0);
// int val = await grain.Increment();`,
    explanation: "Orleans implements the Virtual Actor model; each Grain is a lightweight actor with an identity (integer/string/Guid key) automatically activated on demand and scaled across a cluster.",
  },
  {
    id: "cs-b18-b5-maui-binding",
    language: "csharp",
    title: ".NET MAUI MVVM data binding",
    tag: "families",
    code: `using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;

// Source-generated MVVM via CommunityToolkit.Mvvm
partial class MainViewModel : ObservableObject
{
    [ObservableProperty]
    private string _name = "";

    [ObservableProperty]
    private int _count;

    [RelayCommand]
    private void Increment()
    {
        Count++;
        Name = $"Clicked {Count} time(s)";
    }
}

// XAML: <Label Text="{Binding Name}" />
//       <Button Command="{Binding IncrementCommand}" Text="+" />`,
    explanation: "CommunityToolkit.Mvvm uses source generators to emit INotifyPropertyChanged boilerplate from [ObservableProperty]; [RelayCommand] generates ICommand wrappers from method names.",
  },
  {
    id: "cs-b18-b5-blazor-component",
    language: "csharp",
    title: "Blazor component with state and events",
    tag: "families",
    code: `@* Counter.razor *@
@page "/counter"

<h3>Counter: @_count</h3>
<button @onclick="Increment">+1</button>
<button @onclick="Reset">Reset</button>

@code {
    private int _count;

    private void Increment() => _count++;
    private void Reset()     => _count = 0;

    // Lifecycle hooks
    protected override void OnInitialized()
    {
        _count = 0;
    }

    // Async initialization
    protected override async Task OnInitializedAsync()
    {
        await Task.Delay(0);  // simulate async setup
    }
}`,
    explanation: "Blazor components use Razor syntax combining HTML and C# in @code blocks; OnInitialized/OnInitializedAsync are lifecycle hooks; StateHasChanged triggers re-render when called from async handlers.",
  },
  {
    id: "cs-b18-b5-yarp-proxy",
    language: "csharp",
    title: "YARP reverse proxy configuration",
    tag: "families",
    code: `using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddReverseProxy()
    .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"));

var app = builder.Build();
app.MapReverseProxy(pipeline =>
{
    pipeline.UseSessionAffinity();
    pipeline.UseLoadBalancing();
    pipeline.UsePassiveHealthChecks();
});
// app.Run();

// appsettings.json:
// "ReverseProxy": {
//   "Routes": { "route1": { "ClusterId": "cluster1", "Match": { "Path": "/api/{**catch-all}" }}},
//   "Clusters": { "cluster1": { "Destinations": { "dest1": { "Address": "http://backend/" }}}}
// }`,
    explanation: "YARP (Yet Another Reverse Proxy) is a .NET library for building reverse proxies; it loads routes and clusters from config, and middleware pipeline steps add load balancing, affinity, and health checks.",
  },
  {
    id: "cs-b18-b5-refit-httpclient",
    language: "csharp",
    title: "Refit for type-safe REST clients",
    tag: "families",
    code: `using Refit;
using System.Threading.Tasks;
using System.Collections.Generic;

// Define the API as an interface
interface IGitHubApi
{
    [Get("/users/{username}")]
    Task<User> GetUser(string username);

    [Get("/users/{username}/repos")]
    Task<List<Repo>> GetRepos(string username, [Query] int per_page = 30);
}

record User(string Login, string Name, int Public_Repos);
record Repo(string Name, string Html_Url, int Stargazers_Count);

// Registration:
// services.AddRefitClient<IGitHubApi>()
//     .ConfigureHttpClient(c => c.BaseAddress = new Uri("https://api.github.com"));

// Usage (injected):
// var user = await gitHub.GetUser("dotnet");`,
    explanation: "Refit generates HttpClient-based implementations from annotated interfaces; [Get], [Post] map to HTTP methods; [Query] binds parameters as query strings. No manual serialization needed.",
  },
  {
    id: "cs-b18-b5-quartz-scheduler",
    language: "csharp",
    title: "Quartz.NET for job scheduling",
    tag: "families",
    code: `using Quartz;
using Microsoft.Extensions.DependencyInjection;

// Define a job
class EmailJob : IJob
{
    public async Task Execute(IJobExecutionContext context)
    {
        var email = context.JobDetail.JobDataMap.GetString("email");
        Console.WriteLine($"Sending email to {email}");
        await Task.Delay(100);
    }
}

// Schedule: every day at 8 AM
var services = new ServiceCollection();
services.AddQuartz(q =>
{
    var jobKey = new JobKey("email-job");
    q.AddJob<EmailJob>(opts => opts.WithIdentity(jobKey)
        .UsingJobData("email", "user@example.com"));
    q.AddTrigger(opts => opts
        .ForJob(jobKey)
        .WithCronSchedule("0 0 8 * * ?"));  // 8 AM daily
});
services.AddQuartzHostedService(q => q.WaitForJobsToComplete = true);`,
    explanation: "Quartz.NET is a full-featured job scheduler; IJob implements Execute, JobDataMap passes parameters, and cron triggers define schedules. AddQuartzHostedService integrates with .NET's hosted service lifetime.",
  },
  {
    id: "cs-b18-b5-wolverine-messaging",
    language: "csharp",
    title: "Wolverine for message handling",
    tag: "families",
    code: `using Wolverine;

// Command
record CreateOrder(string Product, int Quantity);

// Handler — discovered by convention (no interface needed)
class CreateOrderHandler
{
    public async Task Handle(CreateOrder cmd, IMessageContext context)
    {
        Console.WriteLine($"Creating order: {cmd.Product} x {cmd.Quantity}");

        // Publish side effects
        await context.PublishAsync(new OrderCreated(cmd.Product));
    }
}

record OrderCreated(string Product);

class OrderCreatedHandler
{
    public void Handle(OrderCreated evt)
        => Console.WriteLine($"Order created event: {evt.Product}");
}

// Registration: builder.UseWolverine()`,
    explanation: "Wolverine discovers handlers by convention (Handle method), supports local and distributed messaging, and uses source generators to eliminate reflection overhead at runtime.",
  },

  // --- classes ---
  {
    id: "cs-b18-b5-interceptor-class",
    language: "csharp",
    title: "Method interception via DispatchProxy",
    tag: "classes",
    code: `using System;
using System.Reflection;

class LoggingProxy<T> : DispatchProxy where T : class
{
    private T _target = null!;

    protected override object? Invoke(MethodInfo? method, object?[]? args)
    {
        Console.WriteLine($">> {method?.Name}({string.Join(", ", args ?? Array.Empty<object?>())})");
        var result = method?.Invoke(_target, args);
        Console.WriteLine($"<< {method?.Name} = {result}");
        return result;
    }

    public static T Create(T target)
    {
        var proxy = (LoggingProxy<T>)Create<T, LoggingProxy<T>>();
        proxy._target = target;
        return proxy;
    }
}

interface ICalculator { int Add(int a, int b); }
class Calculator : ICalculator { public int Add(int a, int b) => a + b; }

ICalculator calc = LoggingProxy<ICalculator>.Create(new Calculator());
calc.Add(3, 4);
// >> Add(3, 4)
// << Add = 7`,
    explanation: "DispatchProxy creates a transparent proxy that intercepts interface method calls; it's a lighter alternative to Castle DynamicProxy for adding cross-cutting concerns (logging, caching, auth) without AOP frameworks.",
  },
  {
    id: "cs-b18-b5-result-type",
    language: "csharp",
    title: "Result<T,E> type for error handling",
    tag: "classes",
    code: `using System;

readonly struct Result<T, E>
{
    private readonly T?  _value;
    private readonly E?  _error;
    private readonly bool _isOk;

    private Result(T value)  { _value = value; _isOk = true;  _error = default; }
    private Result(E error)  { _error = error; _isOk = false; _value = default; }

    public static Result<T, E> Ok(T value)   => new(value);
    public static Result<T, E> Err(E error)  => new(error);

    public bool IsOk  => _isOk;
    public T    Value => _isOk ? _value! : throw new InvalidOperationException("Error result");
    public E    Error => !_isOk ? _error! : throw new InvalidOperationException("Ok result");

    public TOut Match<TOut>(Func<T, TOut> onOk, Func<E, TOut> onErr)
        => _isOk ? onOk(_value!) : onErr(_error!);
}

Result<int, string> Parse(string s) =>
    int.TryParse(s, out int n) ? Result<int, string>.Ok(n) : Result<int, string>.Err("Not a number");

string msg = Parse("42").Match(n => $"Got {n}", e => $"Error: {e}");
Console.WriteLine(msg);  // Got 42`,
    explanation: "Result<T,E> encodes success or failure in the type; Match forces callers to handle both cases. This eliminates exception-based control flow for expected failures (parsing, validation).",
  },
  {
    id: "cs-b18-b5-event-aggregator",
    language: "csharp",
    title: "Event aggregator with weak references",
    tag: "classes",
    code: `using System;
using System.Collections.Generic;

class EventAggregator
{
    private readonly Dictionary<Type, List<WeakReference>> _handlers = new();

    public void Subscribe<T>(Action<T> handler)
    {
        var type = typeof(T);
        if (!_handlers.ContainsKey(type))
            _handlers[type] = new List<WeakReference>();
        _handlers[type].Add(new WeakReference(handler));
    }

    public void Publish<T>(T evt)
    {
        if (!_handlers.TryGetValue(typeof(T), out var refs)) return;
        refs.RemoveAll(r => !r.IsAlive);
        foreach (var r in refs)
            if (r.Target is Action<T> h) h(evt);
    }
}

record UserLoggedIn(string Username);

var bus = new EventAggregator();
bus.Subscribe<UserLoggedIn>(e => Console.WriteLine($"Welcome {e.Username}!"));
bus.Publish(new UserLoggedIn("Alice"));  // Welcome Alice!`,
    explanation: "WeakReference event subscriptions prevent the aggregator from keeping subscribers alive; dead references are pruned on Publish. This avoids the classic event-subscription memory leak.",
  },
  {
    id: "cs-b18-b5-value-object",
    language: "csharp",
    title: "Value Object pattern with record",
    tag: "classes",
    code: `using System;

readonly record struct Money(decimal Amount, string Currency)
{
    public Money(decimal amount, string currency) : this(amount, currency)
    {
        if (amount < 0) throw new ArgumentException("Amount cannot be negative");
        if (string.IsNullOrWhiteSpace(currency)) throw new ArgumentException("Currency required");
    }

    public Money Add(Money other)
    {
        if (Currency != other.Currency) throw new InvalidOperationException("Currency mismatch");
        return this with { Amount = Amount + other.Amount };
    }

    public override string ToString() => $"{Amount:N2} {Currency}";
}

var price  = new Money(19.99m, "USD");
var tax    = new Money( 1.80m, "USD");
var total  = price.Add(tax);

Console.WriteLine(total);                   // 21.79 USD
Console.WriteLine(price == new Money(19.99m, "USD"));  // True (value equality)`,
    explanation: "record struct combines value semantics, immutability, and structural equality into a compact Value Object; the constructor validates invariants, preventing invalid state from being constructed.",
  },
  {
    id: "cs-b18-b5-aggregate-root",
    language: "csharp",
    title: "Aggregate Root with domain events",
    tag: "classes",
    code: `using System;
using System.Collections.Generic;

abstract class AggregateRoot
{
    private readonly List<object> _events = new();
    protected void RaiseDomainEvent(object evt) => _events.Add(evt);
    public IReadOnlyList<object> DomainEvents => _events;
    public void ClearEvents() => _events.Clear();
}

record OrderItemAdded(Guid OrderId, string Product, int Qty);
record OrderSubmitted(Guid OrderId, DateTimeOffset SubmittedAt);

class Order : AggregateRoot
{
    public Guid Id { get; } = Guid.NewGuid();
    public List<string> Items { get; } = new();
    public bool IsSubmitted { get; private set; }

    public void AddItem(string product, int qty)
    {
        Items.Add(product);
        RaiseDomainEvent(new OrderItemAdded(Id, product, qty));
    }

    public void Submit()
    {
        if (IsSubmitted) throw new InvalidOperationException("Already submitted");
        IsSubmitted = true;
        RaiseDomainEvent(new OrderSubmitted(Id, DateTimeOffset.UtcNow));
    }
}`,
    explanation: "Aggregate Root is the entry point to an aggregate; all mutations go through it. Domain events are collected during the operation and dispatched after the transaction commits, decoupling side effects.",
  },
];
