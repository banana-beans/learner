import type { Snippet } from "./types";

export const csharpSnippets20260516B2: Snippet[] = [
  {
    id: "cs-b16-b2-linq-selectmany",
    language: "csharp",
    title: "LINQ SelectMany (flatMap)",
    tag: "snippet",
    code: `var orders = new[]
{
    new { Id = 1, Items = new[] { "apple", "banana" } },
    new { Id = 2, Items = new[] { "cherry", "date", "elderberry" } },
};

var allItems = orders.SelectMany(o => o.Items).ToList();
Console.WriteLine(string.Join(", ", allItems));
// apple, banana, cherry, date, elderberry

// With result selector
var pairs = orders.SelectMany(
    o => o.Items, (o, item) => \$"{o.Id}:{item}");
Console.WriteLine(string.Join(", ", pairs));`,
    explanation: "SelectMany flattens a sequence of sequences into a single sequence, equivalent to flatMap in other languages. The two-argument overload lets you project each element together with its source.",
  },
  {
    id: "cs-b16-b2-struct-layout",
    language: "csharp",
    title: "struct layout and padding",
    tag: "understanding",
    code: `using System.Runtime.InteropServices;

[StructLayout(LayoutKind.Sequential)]
struct BadLayout   // 12 bytes due to padding
{
    public byte  A;  // 1 byte + 3 padding
    public int   B;  // 4 bytes
    public byte  C;  // 1 byte + 3 padding
}

[StructLayout(LayoutKind.Sequential)]
struct GoodLayout  // 6 bytes — fields largest-first
{
    public int   B;  // 4 bytes
    public byte  A;  // 1 byte
    public byte  C;  // 1 byte
}

Console.WriteLine(Marshal.SizeOf<BadLayout>());  // 12
Console.WriteLine(Marshal.SizeOf<GoodLayout>()); // 8`,
    explanation: "The CLR aligns fields to their natural size boundaries, inserting padding bytes between mismatched fields. Ordering fields largest-first (or using LayoutKind.Explicit) minimises wasted space.",
  },
  {
    id: "cs-b16-b2-immutable-dict-builder",
    language: "csharp",
    title: "ImmutableDictionary<K,V> builder",
    tag: "structures",
    code: `using System.Collections.Immutable;

// Use a builder for efficient batch construction
var builder = ImmutableDictionary.CreateBuilder<string, int>();
builder.Add("a", 1);
builder.Add("b", 2);
builder.Add("c", 3);
ImmutableDictionary<string, int> dict = builder.ToImmutable();

// Any modification returns a NEW dictionary
var dict2 = dict.Add("d", 4);
Console.WriteLine(dict.ContainsKey("d"));   // False
Console.WriteLine(dict2.ContainsKey("d"));  // True`,
    explanation: "ImmutableDictionary is thread-safe by immutability — every modification returns a new instance sharing structural nodes with the original. Use a builder when adding many entries at once to avoid O(n²) overhead.",
  },
  {
    id: "cs-b16-b2-configureawait",
    language: "csharp",
    title: "ConfigureAwait(false) in library code",
    tag: "caveats",
    code: `using System.Net.Http;

// Library code: always use ConfigureAwait(false)
public async Task<string> FetchAsync(string url)
{
    using var client = new HttpClient();
    // Without ConfigureAwait(false), resumes on original context
    // (e.g., UI thread), causing deadlocks in sync-over-async
    var response = await client.GetAsync(url)
                               .ConfigureAwait(false);
    return await response.Content.ReadAsStringAsync()
                                 .ConfigureAwait(false);
}`,
    explanation: "ConfigureAwait(false) tells the awaiter not to capture the synchronisation context, preventing deadlocks when library code is called from a context with a single-threaded synchroniser (WinForms, WPF, ASP.NET classic).",
  },
  {
    id: "cs-b16-b2-nint-nuint",
    language: "csharp",
    title: "nint/nuint native integers",
    tag: "types",
    code: `// nint and nuint are platform-sized integers
// (32-bit on 32-bit CLR, 64-bit on 64-bit CLR)
nint a = 100;
nuint b = 200u;

Console.WriteLine(sizeof(nint));           // 8 (on 64-bit)
Console.WriteLine(nint.MaxValue);          // 9223372036854775807

// Useful for interop and pointer arithmetic
unsafe
{
    int[] arr = { 1, 2, 3 };
    fixed (int* p = arr)
    {
        nint offset = 1;
        Console.WriteLine(*(p + offset));  // 2
    }
}`,
    explanation: "nint and nuint (C# 9) are aliases for System.IntPtr and System.UIntPtr but support arithmetic operators directly, making pointer math and P/Invoke interop more readable without casting.",
  },
  {
    id: "cs-b16-b2-linq-tolookup",
    language: "csharp",
    title: "LINQ ToLookup",
    tag: "snippet",
    code: `var words = new[] { "apple", "ant", "banana", "bat", "cherry" };

// ToLookup: like GroupBy but materialised into an ILookup
var byFirstLetter = words.ToLookup(w => w[0]);

foreach (var group in byFirstLetter)
    Console.WriteLine(\$"'{group.Key}': {string.Join(", ", group)}");

// 'a': apple, ant
// 'b': banana, bat
// 'c': cherry

// Missing key returns empty group, not null
Console.WriteLine(byFirstLetter['z'].Count()); // 0`,
    explanation: "ToLookup is like GroupBy but eagerly materialised into an indexed structure. Looking up a non-existent key returns an empty sequence instead of throwing, making it safer than a Dictionary<K, List<V>>.",
  },
  {
    id: "cs-b16-b2-readonly-vs-const",
    language: "csharp",
    title: "readonly field vs const",
    tag: "understanding",
    code: `public class Config
{
    // const: compile-time, implicitly static, inlined at call sites
    public const int MaxRetries = 3;

    // readonly: runtime, per-instance or static, not inlined
    public readonly int Timeout;
    public static readonly HttpClient SharedClient = new();

    public Config(int timeout) => Timeout = timeout;
}

// const is baked into referencing assemblies at compile time —
// changing it requires recompiling dependents
Console.WriteLine(Config.MaxRetries);  // 3`,
    explanation: "const values are inlined at compile time and must be literals, making them faster but fragile across assembly updates. readonly values are evaluated at runtime, allowing non-literal expressions and supporting versioning.",
  },
  {
    id: "cs-b16-b2-arraypool",
    language: "csharp",
    title: "ArrayPool<T> rent/return",
    tag: "structures",
    code: `using System.Buffers;

// Rent a buffer — may be larger than requested
int[] buffer = ArrayPool<int>.Shared.Rent(1024);
try
{
    // Use only the first 1024 elements
    for (int i = 0; i < 1024; i++)
        buffer[i] = i * 2;

    int sum = buffer.AsSpan(0, 1024)
                    .ToArray()
                    .Sum();
    Console.WriteLine(sum);
}
finally
{
    // Always return — true clears the array first
    ArrayPool<int>.Shared.Return(buffer, clearArray: true);
}`,
    explanation: "ArrayPool<T>.Shared avoids heap allocations for temporary buffers by reusing arrays from a thread-local pool. Always return buffers in a finally block; clearArray: true prevents sensitive data leaks.",
  },
  {
    id: "cs-b16-b2-object-disposed",
    language: "csharp",
    title: "ObjectDisposedException after Dispose",
    tag: "caveats",
    code: `using System.IO;

var stream = new MemoryStream(new byte[] { 1, 2, 3 });
stream.Dispose();

try
{
    // Using a disposed object throws ObjectDisposedException
    int b = stream.ReadByte();
}
catch (ObjectDisposedException ex)
{
    Console.WriteLine(ex.Message);
    // Cannot access a disposed object. Object name: 'MemoryStream'.
}

// Pattern: use 'using' to guarantee disposal
using var safe = new MemoryStream(new byte[] { 4, 5 });
Console.WriteLine(safe.ReadByte()); // 4`,
    explanation: "Calling methods on a disposed IDisposable should throw ObjectDisposedException — well-behaved types check a private flag in every method. Always use the using statement or using declaration to avoid accessing disposed objects.",
  },
  {
    id: "cs-b16-b2-linq-except-intersect",
    language: "csharp",
    title: "LINQ Except/Intersect/Union",
    tag: "snippet",
    code: `var a = new[] { 1, 2, 3, 4, 5 };
var b = new[] { 3, 4, 5, 6, 7 };

var onlyInA  = a.Except(b).ToList();    // [1, 2]
var inBoth   = a.Intersect(b).ToList(); // [3, 4, 5]
var combined = a.Union(b).ToList();     // [1,2,3,4,5,6,7]

Console.WriteLine(string.Join(" ", onlyInA));
Console.WriteLine(string.Join(" ", inBoth));
Console.WriteLine(string.Join(" ", combined));`,
    explanation: "Except, Intersect, and Union perform set operations on sequences using the default equality comparer. All three deduplicate results and accept an optional IEqualityComparer<T> overload for custom comparison.",
  },
  {
    id: "cs-b16-b2-half-float",
    language: "csharp",
    title: "Half precision float",
    tag: "types",
    code: `// Half is a 16-bit IEEE 754 floating-point type (.NET 5+)
Half h1 = (Half)3.14f;
Half h2 = Half.Parse("2.71");

Console.WriteLine(h1);              // 3.14
Console.WriteLine(Half.IsNaN(h1));  // False
Console.WriteLine((float)h1);       // 3.140625 (limited precision)

// Useful for ML model weights and GPU interop
Half[] weights = new Half[1024];
Array.Fill(weights, (Half)0.1f);
Console.WriteLine(weights[0]);      // 0.1`,
    explanation: "Half (System.Half, .NET 5+) stores a 16-bit float with 5 exponent bits and 10 mantissa bits, offering about 3 decimal digits of precision. It halves memory usage compared to float, useful for ML and graphics workloads.",
  },
  {
    id: "cs-b16-b2-channel-producer-consumer",
    language: "csharp",
    title: "Channel<T> producer-consumer",
    tag: "structures",
    code: `using System.Threading.Channels;

var channel = Channel.CreateBounded<int>(capacity: 10);

var producer = Task.Run(async () => {
    for (int i = 0; i < 5; i++) {
        await channel.Writer.WriteAsync(i);
        Console.WriteLine(\$"produced {i}");
    }
    channel.Writer.Complete();
});

var consumer = Task.Run(async () => {
    await foreach (int item in channel.Reader.ReadAllAsync())
        Console.WriteLine(\$"consumed {item}");
});

await Task.WhenAll(producer, consumer);`,
    explanation: "Channel<T> is a thread-safe async-compatible queue for producer-consumer pipelines. BoundedChannel applies backpressure; UnboundedChannel grows without limit. ReadAllAsync supports await foreach for clean consumption.",
  },
  {
    id: "cs-b16-b2-cancellation-propagation",
    language: "csharp",
    title: "CancellationToken propagation",
    tag: "caveats",
    code: `using System.Threading;

async Task DoWorkAsync(CancellationToken ct = default)
{
    // Always pass ct to every awaitable
    await Task.Delay(1000, ct);

    // For CPU-bound code, check explicitly
    ct.ThrowIfCancellationRequested();

    await InnerAsync(ct);  // propagate downward
}

async Task InnerAsync(CancellationToken ct)
{
    await Task.Delay(500, ct);
}

using var cts = new CancellationTokenSource(TimeSpan.FromMilliseconds(200));
try { await DoWorkAsync(cts.Token); }
catch (OperationCanceledException) { Console.WriteLine("cancelled"); }`,
    explanation: "CancellationToken must be threaded through every async call in the chain — stopping at any level breaks cooperative cancellation. ThrowIfCancellationRequested() inserts a cancellation checkpoint in synchronous loops.",
  },
  {
    id: "cs-b16-b2-pattern-matching-exhaustive",
    language: "csharp",
    title: "Pattern matching exhaustiveness",
    tag: "understanding",
    code: `abstract record Shape;
record Circle(double Radius) : Shape;
record Rectangle(double W, double H) : Shape;
record Triangle(double Base, double Height) : Shape;

static double Area(Shape s) => s switch
{
    Circle c       => Math.PI * c.Radius * c.Radius,
    Rectangle r    => r.W * r.H,
    Triangle t     => 0.5 * t.Base * t.Height,
    _              => throw new ArgumentOutOfRangeException()
};

Console.WriteLine(Area(new Circle(5)));      // 78.53...
Console.WriteLine(Area(new Rectangle(3,4))); // 12`,
    explanation: "Switch expressions with type patterns can be exhaustive when all derived types are covered. The compiler warns when a sealed type hierarchy has uncovered cases, making it a compile-time safety net for discriminated unions.",
  },
  {
    id: "cs-b16-b2-frozen-dictionary",
    language: "csharp",
    title: "FrozenDictionary (.NET 8)",
    tag: "structures",
    code: `using System.Collections.Frozen;

var source = new Dictionary<string, int>
{
    ["one"] = 1, ["two"] = 2, ["three"] = 3
};

FrozenDictionary<string, int> frozen = source.ToFrozenDictionary();

// Read-only; lookup is faster than Dictionary for stable data
Console.WriteLine(frozen["two"]);           // 2
Console.WriteLine(frozen.ContainsKey("four")); // False
Console.WriteLine(frozen.Count);            // 3
// frozen["four"] = 4;  // compile error — no indexer setter`,
    explanation: "FrozenDictionary (.NET 8) builds a perfect hash at construction time, yielding faster lookups than Dictionary<K,V> for read-heavy workloads with a stable key set known at startup.",
  },
  {
    id: "cs-b16-b2-generic-math",
    language: "csharp",
    title: "Generic math INumber<T>",
    tag: "types",
    code: `using System.Numerics;

static T Sum<T>(IEnumerable<T> values)
    where T : INumber<T>
{
    T total = T.Zero;
    foreach (var v in values)
        total += v;
    return total;
}

Console.WriteLine(Sum(new[] { 1, 2, 3, 4 }));          // 10
Console.WriteLine(Sum(new[] { 1.5, 2.5, 3.0 }));       // 7
Console.WriteLine(Sum(new[] { 1m, 2m, 3m }));           // 6`,
    explanation: "INumber<T> (System.Numerics, .NET 7+) is a static abstract interface that exposes arithmetic operators and constants like T.Zero. Code constrained to INumber<T> works generically across int, double, decimal, and custom numeric types.",
  },
  {
    id: "cs-b16-b2-linq-join",
    language: "csharp",
    title: "LINQ Join two sequences",
    tag: "snippet",
    code: `var customers = new[]
{
    new { Id = 1, Name = "Alice" },
    new { Id = 2, Name = "Bob" },
};
var orders = new[]
{
    new { CustomerId = 1, Product = "Widget" },
    new { CustomerId = 1, Product = "Gadget" },
    new { CustomerId = 2, Product = "Doohickey" },
};

var result = customers.Join(
    orders,
    c => c.Id,
    o => o.CustomerId,
    (c, o) => \$"{c.Name} bought {o.Product}"
);
foreach (var line in result) Console.WriteLine(line);`,
    explanation: "LINQ Join performs an inner equi-join using a key selector for each sequence and a result selector to shape the output. It builds a hash lookup on the inner sequence for O(n+m) performance.",
  },
  {
    id: "cs-b16-b2-primary-constructor",
    language: "csharp",
    title: "Primary constructor with field capture",
    tag: "classes",
    code: `// C# 12 primary constructors for non-record classes
public class Logger(string prefix, bool verbose)
{
    // Parameters are in scope throughout the class body
    private readonly string _prefix = prefix;

    public void Log(string message)
    {
        if (verbose)
            Console.WriteLine(\$"[{_prefix}] {message}");
    }

    public string Prefix => _prefix;
}

var log = new Logger("INFO", verbose: true);
log.Log("hello");  // [INFO] hello`,
    explanation: "Primary constructor parameters (C# 12) are available throughout the class body. They are NOT automatically stored as fields — you must capture them into fields explicitly to ensure they're retained after construction.",
  },
  {
    id: "cs-b16-b2-interlocked",
    language: "csharp",
    title: "Interlocked operations",
    tag: "caveats",
    code: `using System.Threading;

int counter = 0;

var threads = Enumerable.Range(0, 10).Select(_ =>
    new Thread(() =>
    {
        for (int i = 0; i < 1000; i++)
            Interlocked.Increment(ref counter); // atomic
            // counter++;  // NOT thread-safe!
    }));

foreach (var t in threads) t.Start();
foreach (var t in threads) t.Join();

Console.WriteLine(counter); // 10000 (always)`,
    explanation: "Interlocked.Increment uses a hardware atomic instruction (LOCK XADD on x86) to increment a shared variable without a lock. Plain counter++ compiles to three non-atomic instructions, leading to lost updates under concurrency.",
  },
  {
    id: "cs-b16-b2-linq-cast-oftype",
    language: "csharp",
    title: "LINQ Cast<T>/OfType<T>",
    tag: "snippet",
    code: `using System.Collections;

ArrayList legacy = new() { 1, "two", 3, "four", 5 };

// Cast<T>: throws InvalidCastException on wrong type
try { legacy.Cast<int>().ToList(); }
catch (InvalidCastException) { Console.WriteLine("cast failed"); }

// OfType<T>: filters, skips wrong types safely
var ints = legacy.OfType<int>().ToList();
Console.WriteLine(string.Join(", ", ints));  // 1, 3, 5

var strings = legacy.OfType<string>().ToList();
Console.WriteLine(string.Join(", ", strings)); // two, four`,
    explanation: "Cast<T> asserts every element is of type T and throws on the first mismatch — use it when the sequence is known to be homogeneous. OfType<T> silently skips non-matching elements, ideal for heterogeneous legacy collections.",
  },
  {
    id: "cs-b16-b2-required-init",
    language: "csharp",
    title: "required init properties and object initializers",
    tag: "understanding",
    code: `public class Order
{
    public required string ProductId { get; init; }
    public required int Quantity    { get; init; }
    public string Note              { get; init; } = "";
}

// required: compiler error if property is missing at init
var o = new Order { ProductId = "SKU-001", Quantity = 3 };
Console.WriteLine(\$"{o.ProductId} x{o.Quantity}");

// o.Quantity = 5;  // error: init-only property`,
    explanation: "required (C# 11) makes a property mandatory in object initializers — the compiler errors if it's omitted, catching typos and missing values earlier than runtime NullReferenceException. init ensures the property can't be mutated after construction.",
  },
  {
    id: "cs-b16-b2-cancellation-vs-timeout",
    language: "csharp",
    title: "CancellationToken vs TimeoutToken",
    tag: "families",
    code: `using System.Threading;

// Manual cancellation
using var cts = new CancellationTokenSource();
// cts.Cancel() triggered by user or upstream logic

// Timeout: automatically cancels after duration
using var timeout = new CancellationTokenSource(TimeSpan.FromSeconds(5));

// Combine: cancel if either fires
using var linked = CancellationTokenSource.CreateLinkedTokenSource(
    cts.Token, timeout.Token);

async Task DoAsync(CancellationToken ct)
    => await Task.Delay(Timeout.Infinite, ct);

try { await DoAsync(linked.Token); }
catch (OperationCanceledException) { Console.WriteLine("stopped"); }`,
    explanation: "CreateLinkedTokenSource merges two tokens so cancellation fires if either source triggers. This cleanly separates timeout logic (CancellationTokenSource with delay) from user-initiated cancellation without coupling the two.",
  },
  {
    id: "cs-b16-b2-list-patterns",
    language: "csharp",
    title: "List patterns (C# 11)",
    tag: "understanding",
    code: `int[] empty = [];
int[] one   = [42];
int[] many  = [1, 2, 3, 4, 5];

string Describe(int[] arr) => arr switch
{
    []           => "empty",
    [var x]      => \$"single: {x}",
    [var h, ..]  => \$"starts with {h}, length {arr.Length}",
};

Console.WriteLine(Describe(empty)); // empty
Console.WriteLine(Describe(one));   // single: 42
Console.WriteLine(Describe(many));  // starts with 1, length 5`,
    explanation: "List patterns (C# 11) match arrays and lists by structure. The .. discard pattern matches zero or more elements, enabling head/tail decomposition similar to functional pattern matching.",
  },
  {
    id: "cs-b16-b2-concurrent-queue",
    language: "csharp",
    title: "ConcurrentQueue<T>",
    tag: "structures",
    code: `using System.Collections.Concurrent;

var queue = new ConcurrentQueue<string>();

// Enqueue from multiple threads safely
Parallel.For(0, 5, i => queue.Enqueue(\$"item-{i}"));

Console.WriteLine(queue.Count); // 5 (order not guaranteed)

// TryDequeue: never blocks, returns false if empty
while (queue.TryDequeue(out string? item))
    Console.WriteLine(\$"dequeued: {item}");

// Peek without removing
queue.Enqueue("peek-me");
queue.TryPeek(out string? peeked);
Console.WriteLine(peeked); // peek-me`,
    explanation: "ConcurrentQueue<T> is a thread-safe FIFO queue using lock-free CAS operations. TryDequeue and TryPeek never block — they return false when the queue is empty, making them safe to call from multiple threads without coordination.",
  },
  {
    id: "cs-b16-b2-gc-suppress-finalize",
    language: "csharp",
    title: "GC.SuppressFinalize pattern",
    tag: "caveats",
    code: `public class Resource : IDisposable
{
    private bool _disposed;

    ~Resource()  // finalizer — avoid if possible
    {
        Dispose(false);
    }

    public void Dispose()
    {
        Dispose(true);
        GC.SuppressFinalize(this); // skip finalizer queue
    }

    protected virtual void Dispose(bool disposing)
    {
        if (_disposed) return;
        if (disposing) { /* free managed resources */ }
        /* free unmanaged resources */
        _disposed = true;
    }
}`,
    explanation: "GC.SuppressFinalize tells the GC to skip the finalizer queue for this object after Dispose has already cleaned up. Without it, the object would incur an extra GC cycle even though there's nothing left to finalize.",
  },
  {
    id: "cs-b16-b2-file-local-type",
    language: "csharp",
    title: "file-local types (file modifier)",
    tag: "classes",
    code: `// file modifier restricts the type to this source file only
file class InternalHelper
{
    public static string Format(int n) => \$"#{n:D4}";
}

file record Config(string Host, int Port);

public class OrderService
{
    public string GetOrderId(int n) => InternalHelper.Format(n);

    public void Configure()
    {
        var cfg = new Config("localhost", 8080);
        Console.WriteLine(cfg);
    }
}`,
    explanation: "The file access modifier (C# 11) scopes a type to the source file where it's declared, preventing name collisions between generated code files and providing a scoping level between private and internal.",
  },
  {
    id: "cs-b16-b2-string-create-spanaction",
    language: "csharp",
    title: "string.Create with SpanAction",
    tag: "snippet",
    code: `using System;

// Allocation-free string construction
string HexEncode(ReadOnlySpan<byte> data)
{
    return string.Create(data.Length * 2, data, (span, bytes) =>
    {
        const string hex = "0123456789abcdef";
        for (int i = 0; i < bytes.Length; i++)
        {
            span[i * 2]     = hex[bytes[i] >> 4];
            span[i * 2 + 1] = hex[bytes[i] & 0xF];
        }
    });
}

byte[] data = { 0xDE, 0xAD, 0xBE, 0xEF };
Console.WriteLine(HexEncode(data)); // deadbeef`,
    explanation: "string.Create allocates a string and passes its backing Span<char> directly to the action, avoiding intermediate StringBuilder or char[] allocations. The state parameter avoids closures over local variables.",
  },
  {
    id: "cs-b16-b2-task-whenall-partial",
    language: "csharp",
    title: "Task.WhenAll partial failure",
    tag: "caveats",
    code: `var t1 = Task.FromResult(1);
var t2 = Task.FromException<int>(new IOException("disk full"));
var t3 = Task.FromResult(3);

try
{
    int[] results = await Task.WhenAll(t1, t2, t3);
}
catch (IOException ex)
{
    // WhenAll throws first exception, but ALL tasks ran
    Console.WriteLine(ex.Message);  // disk full
    // Inspect individual tasks for all errors:
    Console.WriteLine(t2.Exception?.InnerException?.Message);
}`,
    explanation: "Task.WhenAll waits for all tasks regardless of failures, but the resulting AggregateException exposed via the task only surfaces the first exception when awaited directly. Inspect each Task.Exception to collect all errors.",
  },
  {
    id: "cs-b16-b2-static-abstract-interface",
    language: "csharp",
    title: "static abstract interface members",
    tag: "types",
    code: `public interface IParser<T>
{
    static abstract T Parse(string s);
    static abstract bool TryParse(string s, out T value);
}

public readonly struct Meters : IParser<Meters>
{
    public double Value { get; }
    public Meters(double v) => Value = v;

    public static Meters Parse(string s)
        => new(double.Parse(s));

    public static bool TryParse(string s, out Meters m)
    {
        bool ok = double.TryParse(s, out double v);
        m = new(ok ? v : 0);
        return ok;
    }
}

Meters m = Meters.Parse("3.5");
Console.WriteLine(m.Value); // 3.5`,
    explanation: "Static abstract interface members (C# 11) let interfaces declare factory methods and operators that must be implemented as static members. This underpins the generic math interfaces like INumber<T> and IParsable<T>.",
  },
  {
    id: "cs-b16-b2-linq-chunk",
    language: "csharp",
    title: "LINQ Chunk (batch)",
    tag: "snippet",
    code: `var items = Enumerable.Range(1, 11).ToArray();

// Split into batches of 3
foreach (int[] batch in items.Chunk(3))
{
    Console.WriteLine(\$"[{string.Join(", ", batch)}]");
}
// [1, 2, 3]
// [4, 5, 6]
// [7, 8, 9]
// [10, 11]   ← last batch may be smaller`,
    explanation: "Chunk (LINQ .NET 6+) splits a sequence into fixed-size arrays. The last chunk contains the remaining elements if the count isn't evenly divisible — it's simpler and more correct than manual Skip/Take batching loops.",
  },
  {
    id: "cs-b16-b2-observable-collection",
    language: "csharp",
    title: "ObservableCollection<T>",
    tag: "structures",
    code: `using System.Collections.ObjectModel;
using System.Collections.Specialized;

var list = new ObservableCollection<string>();

list.CollectionChanged += (_, e) =>
{
    Console.WriteLine(\$"{e.Action}: "
        + string.Join(", ", e.NewItems ?? Array.Empty<object>()));
};

list.Add("alpha");   // Add: alpha
list.Add("beta");    // Add: beta
list.Remove("alpha");// Remove:
list.Insert(0, "gamma"); // Add: gamma`,
    explanation: "ObservableCollection<T> fires CollectionChanged whenever items are added, removed, or replaced. It's the standard data-binding collection in WPF, MAUI, and Xamarin, allowing the UI to update automatically.",
  },
  {
    id: "cs-b16-b2-collection-expressions",
    language: "csharp",
    title: "Collection expressions (C# 12)",
    tag: "understanding",
    code: `// Unified syntax for all collection types
int[] arr   = [1, 2, 3];
List<int> list = [1, 2, 3];
Span<int> span = [1, 2, 3];
ReadOnlySpan<int> ros = [1, 2, 3];

// Spread operator ..
int[] a = [1, 2];
int[] b = [3, 4];
int[] merged = [..a, ..b, 5];      // [1,2,3,4,5]

Console.WriteLine(string.Join(",", merged));`,
    explanation: "Collection expressions (C# 12) provide a single [] literal syntax for arrays, lists, and spans. The spread operator .. embeds an existing collection inline, and the compiler picks the most efficient construction strategy.",
  },
  {
    id: "cs-b16-b2-semaphore-slim",
    language: "csharp",
    title: "SemaphoreSlim vs Semaphore",
    tag: "caveats",
    code: `using System.Threading;

// SemaphoreSlim: async-compatible, in-process only
var slim = new SemaphoreSlim(3); // max 3 concurrent

async Task WorkAsync(int id)
{
    await slim.WaitAsync();
    try { await Task.Delay(100); Console.WriteLine(id); }
    finally { slim.Release(); }
}

await Task.WhenAll(Enumerable.Range(1, 6).Select(WorkAsync));

// Semaphore: kernel object, cross-process, no WaitAsync
// var sem = new Semaphore(3, 3, "MyGlobalSemaphore");`,
    explanation: "SemaphoreSlim is a lightweight, async-compatible semaphore restricted to a single process. System.Semaphore wraps a Windows kernel object, enabling cross-process synchronisation at the cost of higher overhead and no async support.",
  },
  {
    id: "cs-b16-b2-file-readalllines",
    language: "csharp",
    title: "File.ReadAllLines",
    tag: "snippet",
    code: `using System.IO;

// Write a file to read back
string path = Path.GetTempFileName();
File.WriteAllLines(path, ["alpha", "beta", "gamma"]);

// ReadAllLines: loads all lines into a string array
string[] lines = File.ReadAllLines(path);
Console.WriteLine(lines.Length);       // 3
Console.WriteLine(lines[1]);           // beta

// For large files prefer ReadLines (lazy)
foreach (string line in File.ReadLines(path))
    Console.Write(\$"{line} ");
// alpha beta gamma`,
    explanation: "ReadAllLines eagerly loads all lines into memory — convenient for small files but wasteful for large ones. File.ReadLines returns an IEnumerable<string> that reads lazily line-by-line, keeping memory usage constant.",
  },
  {
    id: "cs-b16-b2-init-accessor",
    language: "csharp",
    title: "init accessor deep dive",
    tag: "classes",
    code: `public struct Point
{
    public double X { get; init; }
    public double Y { get; init; }

    // init can be called from within object initializer
    // and from the constructor — nowhere else
    public Point(double x, double y) { X = x; Y = y; }

    public Point Translated(double dx, double dy)
        // 'with' uses init accessors internally
        => this with { X = X + dx, Y = Y + dy };
}

var p = new Point(1, 2);
var q = p.Translated(3, 4);
Console.WriteLine(\$"({q.X}, {q.Y})"); // (4, 6)`,
    explanation: "init accessors behave like set during object construction (initializers, constructors, with-expressions) but are read-only afterwards. Structs can use with-expressions to produce modified copies the same way records do.",
  },
  {
    id: "cs-b16-b2-guid-new",
    language: "csharp",
    title: "Guid.NewGuid",
    tag: "snippet",
    code: `Guid id = Guid.NewGuid();
Console.WriteLine(id);              // e.g. 550e8400-e29b-41d4-a716-446655440000
Console.WriteLine(id.ToString("N"));// no dashes
Console.WriteLine(id.ToString("B"));// {braces}

// Parse from string
Guid parsed = Guid.Parse("550e8400-e29b-41d4-a716-446655440000");
bool ok = Guid.TryParse("bad", out Guid g2);
Console.WriteLine(ok); // False

byte[] bytes = id.ToByteArray();
Console.WriteLine(bytes.Length);    // 16`,
    explanation: "Guid.NewGuid() generates a version-4 (random) GUID using a cryptographically secure RNG. Format specifiers N (32 hex digits), D (with dashes), B (braces), P (parens) control string representation.",
  },
  {
    id: "cs-b16-b2-regex-match-groups",
    language: "csharp",
    title: "Regex.Match groups",
    tag: "snippet",
    code: `using System.Text.RegularExpressions;

string log = "2026-05-16 ERROR MyService: disk full";

var pattern = new Regex(
    @"(?<date>\d{4}-\d{2}-\d{2}) (?<level>\w+) (?<source>\w+): (?<msg>.+)");

Match m = pattern.Match(log);
if (m.Success)
{
    Console.WriteLine(m.Groups["date"].Value);   // 2026-05-16
    Console.WriteLine(m.Groups["level"].Value);  // ERROR
    Console.WriteLine(m.Groups["msg"].Value);    // disk full
}`,
    explanation: "Named capture groups (?<name>...) let you retrieve matched substrings by name rather than index, making regex code self-documenting and resilient to reordering groups.",
  },
  {
    id: "cs-b16-b2-ilogger-vs-iloggert",
    language: "csharp",
    title: "ILogger vs ILogger<T>",
    tag: "families",
    code: `using Microsoft.Extensions.Logging;

// ILogger<T>: category name derived from T automatically
public class OrderService
{
    private readonly ILogger<OrderService> _logger;

    public OrderService(ILogger<OrderService> logger)
        => _logger = logger;

    public void Process(int id)
        => _logger.LogInformation("Processing order {OrderId}", id);
}

// ILogger: inject a named logger explicitly
ILogger namedLogger = loggerFactory.CreateLogger("MyCategory");
namedLogger.LogWarning("something happened");`,
    explanation: "ILogger<T> infers the category name from the generic type argument, ensuring log entries are automatically scoped to the class. ILogger allows explicit category names, useful for cross-cutting concerns or shared utilities.",
  },
  {
    id: "cs-b16-b2-ienumerable-deferred",
    language: "csharp",
    title: "IEnumerable deferred execution pitfall",
    tag: "caveats",
    code: `var data = new List<int> { 1, 2, 3, 4, 5 };
var query = data.Where(x => x > 2); // NOT evaluated yet

data.Add(6); // modifying source before enumeration

// Evaluated NOW — sees the added 6
foreach (var n in query)
    Console.Write(\$"{n} ");
// 3 4 5 6

// Fix: materialise immediately with ToList/ToArray
var snap = data.Where(x => x > 2).ToList();`,
    explanation: "LINQ queries over IEnumerable<T> are lazy — they re-evaluate the source on every enumeration. Mutations to the source between query definition and enumeration are visible, which can cause surprising results in loops or multi-pass algorithms.",
  },
  {
    id: "cs-b16-b2-sorted-dictionary",
    language: "csharp",
    title: "SortedList<TKey,TValue> vs SortedDictionary",
    tag: "structures",
    code: `var sortedList = new SortedList<string, int>();
var sortedDict  = new SortedDictionary<string, int>();

foreach (string key in new[] { "banana", "apple", "cherry" })
{
    sortedList[key] = key.Length;
    sortedDict[key] = key.Length;
}

// Both iterate in key order
Console.WriteLine(string.Join(", ", sortedList.Keys));
// apple, banana, cherry

// SortedList: O(n) insert/delete, O(log n) lookup, less memory
// SortedDictionary: O(log n) insert/delete, red-black tree`,
    explanation: "SortedList<K,V> stores keys in an array (cache-friendly, less memory) but has O(n) inserts. SortedDictionary<K,V> uses a red-black tree for O(log n) insertions, better when keys are inserted in random order.",
  },
  {
    id: "cs-b16-b2-covariant-return",
    language: "csharp",
    title: "Covariant return types",
    tag: "types",
    code: `public class Animal
{
    public virtual Animal Create() => new Animal();
    public override string ToString() => "Animal";
}

public class Dog : Animal
{
    // Covariant return: overrides Animal.Create() but returns Dog
    public override Dog Create() => new Dog();
    public override string ToString() => "Dog";
}

Animal a = new Dog();
Animal offspring = a.Create();
Console.WriteLine(offspring);  // Dog  (virtual dispatch)
Console.WriteLine(offspring.GetType().Name); // Dog`,
    explanation: "Covariant return types (C# 9) allow an override to declare a more derived return type than the base method. The runtime still uses virtual dispatch, so calling Create() on a Dog reference always returns a Dog.",
  },
  {
    id: "cs-b16-b2-regex-replace-evaluator",
    language: "csharp",
    title: "Regex.Replace with MatchEvaluator",
    tag: "snippet",
    code: `using System.Text.RegularExpressions;

string text = "The price is $12 and $345.";

string result = Regex.Replace(
    text,
    @"\$(\d+)",
    m =>
    {
        int amount = int.Parse(m.Groups[1].Value);
        return \$"USD {amount * 100:N0} cents";
    }
);

Console.WriteLine(result);
// The price is USD 1,200 cents and USD 34,500 cents.`,
    explanation: "Regex.Replace with a MatchEvaluator delegate invokes the function for each match, passing the Match object. The delegate's return value replaces the matched text, enabling transforms that depend on captured group content.",
  },
  {
    id: "cs-b16-b2-abstract-record",
    language: "csharp",
    title: "abstract record",
    tag: "classes",
    code: `public abstract record Vehicle(string Make, int Year)
{
    public abstract string FuelType { get; }
    public virtual string Description =>
        \$"{Year} {Make} ({FuelType})";
}

public record ElectricCar(string Make, int Year, int RangeKm)
    : Vehicle(Make, Year)
{
    public override string FuelType => "Electric";
    public override string Description =>
        base.Description + \$", range {RangeKm}km";
}

Vehicle v = new ElectricCar("Tesla", 2026, 600);
Console.WriteLine(v.Description);`,
    explanation: "Abstract records combine record value semantics (positional constructor, Equals, with-expressions) with abstract class features. Derived records inherit the base positional parameters and can extend or override members.",
  },
  {
    id: "cs-b16-b2-path-combine",
    language: "csharp",
    title: "Path.Combine",
    tag: "snippet",
    code: `using System.IO;

string root  = "/home/user";
string sub   = "documents";
string file  = "report.pdf";

string full  = Path.Combine(root, sub, file);
Console.WriteLine(full);
// /home/user/documents/report.pdf

// Gotcha: absolute segment resets the path
string reset = Path.Combine(root, "/etc", "hosts");
Console.WriteLine(reset); // /etc/hosts  (root discarded!)

Console.WriteLine(Path.GetExtension(full)); // .pdf
Console.WriteLine(Path.GetFileNameWithoutExtension(full)); // report`,
    explanation: "Path.Combine joins path segments in an OS-independent way. Watch out: if any segment after the first is rooted (starts with /), it resets the accumulated path, silently discarding everything before it.",
  },
  {
    id: "cs-b16-b2-blocking-collection",
    language: "csharp",
    title: "BlockingCollection<T>",
    tag: "structures",
    code: `using System.Collections.Concurrent;

var bc = new BlockingCollection<int>(boundedCapacity: 5);

var producer = Task.Run(() => {
    for (int i = 0; i < 10; i++)
        bc.Add(i);  // blocks if full
    bc.CompleteAdding();
});

var consumer = Task.Run(() => {
    foreach (int item in bc.GetConsumingEnumerable())
        Console.Write(\$"{item} ");
    Console.WriteLine();
});

await Task.WhenAll(producer, consumer);`,
    explanation: "BlockingCollection<T> wraps any IProducerConsumerCollection<T> (default: ConcurrentQueue) with bounded capacity and blocking semantics. GetConsumingEnumerable blocks until items are available and stops when CompleteAdding is called.",
  },
  {
    id: "cs-b16-b2-in-parameter",
    language: "csharp",
    title: "in parameter modifier",
    tag: "understanding",
    code: `readonly struct BigVector
{
    public readonly double X, Y, Z, W;
    public BigVector(double x, double y, double z, double w)
        => (X, Y, Z, W) = (x, y, z, w);
}

// 'in' passes by reference but prevents modification
static double Magnitude(in BigVector v)
    => Math.Sqrt(v.X*v.X + v.Y*v.Y + v.Z*v.Z + v.W*v.W);
    // v.X = 0;  // compile error — readonly reference

var vec = new BigVector(1, 2, 3, 4);
Console.WriteLine(Magnitude(in vec)); // 5.477...`,
    explanation: "The in modifier passes a value type by reference (avoiding a copy) while preventing the callee from modifying it. For large readonly structs this improves performance without sacrificing immutability guarantees.",
  },
  {
    id: "cs-b16-b2-lazy-t",
    language: "csharp",
    title: "Lazy<T> vs AsyncLazy<T>",
    tag: "families",
    code: `using System;
using System.Threading;

// Lazy<T>: thread-safe lazy initialization (synchronous)
var lazyConfig = new Lazy<string>(
    () => { Console.WriteLine("loading..."); return "config-data"; },
    LazyThreadSafetyMode.ExecutionAndPublication);

Console.WriteLine(lazyConfig.Value); // loading... config-data
Console.WriteLine(lazyConfig.Value); // config-data (cached)

// AsyncLazy<T>: community pattern for async init
// (no built-in; typically Lazy<Task<T>>)
var asyncLazy = new Lazy<Task<string>>(
    () => Task.FromResult("async-config"));
string val = await asyncLazy.Value;`,
    explanation: "Lazy<T> defers synchronous initialisation until first access, guaranteeing thread-safety via LazyThreadSafetyMode. For async initialisation, Lazy<Task<T>> is the common pattern — the task is created once, then awaited on every access.",
  },
  {
    id: "cs-b16-b2-record-struct-mutable",
    language: "csharp",
    title: "record struct with mutable fields",
    tag: "classes",
    code: `// record struct: value semantics + mutable by default
public record struct MutablePoint(double X, double Y)
{
    public void Translate(double dx, double dy)
    {
        X += dx;  // allowed — record struct props are mutable
        Y += dy;
    }

    public double Distance => Math.Sqrt(X*X + Y*Y);
}

var p = new MutablePoint(3, 4);
Console.WriteLine(p.Distance); // 5
p.Translate(1, 0);
Console.WriteLine(p);           // MutablePoint { X = 4, Y = 4 }`,
    explanation: "record struct differs from record class in two key ways: it's a value type (stack-allocated, copied on assignment) and its generated positional properties use both get and set rather than init, making them mutable by default.",
  },
  {
    id: "cs-b16-b2-directory-enumerate",
    language: "csharp",
    title: "Directory.EnumerateFiles",
    tag: "snippet",
    code: `using System.IO;
using System.Linq;

// EnumerateFiles: lazy, low-memory
var tsFiles = Directory.EnumerateFiles(
    "/home/user/learner/src",
    "*.ts",
    SearchOption.AllDirectories);

int count = tsFiles.Count();
Console.WriteLine(\$"Found {count} .ts files");

// GetFiles: eager, loads all into array
string[] all = Directory.GetFiles("/tmp", "*",
    SearchOption.TopDirectoryOnly);
Console.WriteLine(\$"Tmp files: {all.Length}");`,
    explanation: "EnumerateFiles returns an IEnumerable<string> that reads directory entries lazily, which matters for huge directories. GetFiles loads all paths into memory at once — simpler but wastes memory for large trees.",
  },
  {
    id: "cs-b16-b2-sealed-record",
    language: "csharp",
    title: "sealed record",
    tag: "classes",
    code: `public record Point(double X, double Y)
{
    public double Distance => Math.Sqrt(X*X + Y*Y);
}

// sealed prevents further inheritance and enables
// better equality/ToString code generation
public sealed record Pixel(double X, double Y, int Color)
    : Point(X, Y)
{
    public override string ToString()
        => \$"Pixel({X}, {Y}, 0x{Color:X6})";
}

var px = new Pixel(3, 4, 0xFF0000);
Console.WriteLine(px);          // Pixel(3, 4, 0xFF0000)
Console.WriteLine(px.Distance); // 5`,
    explanation: "Sealing a record prevents subclassing and lets the compiler generate more efficient Equals and GetHashCode implementations by omitting virtual dispatch. It also communicates intent that the type is a leaf in the hierarchy.",
  },
  {
    id: "cs-b16-b2-formattable-string",
    language: "csharp",
    title: "FormattableString",
    tag: "snippet",
    code: `using System.Globalization;

FormattableString fs = \$"Pi is approximately {Math.PI:.4f}";

// Current culture
Console.WriteLine(fs.ToString());

// Invariant culture (safe for serialisation)
string inv = fs.ToString(CultureInfo.InvariantCulture);
Console.WriteLine(inv);

// Custom format provider for SQL parameterisation
static string ToSql(FormattableString sql)
    => string.Format(
        CultureInfo.InvariantCulture,
        sql.Format.Replace("{", "{{").Replace("}", "}}"),
        sql.GetArguments());`,
    explanation: "Assigning an interpolated string to FormattableString captures the format template and arguments separately, allowing culture-aware or custom formatting. This enables safe SQL or localisation scenarios impossible with plain string.",
  },
  {
    id: "cs-b16-b2-progress-t",
    language: "csharp",
    title: "Progress<T> vs IProgress<T>",
    tag: "families",
    code: `using System;
using System.Threading.Tasks;

// IProgress<T>: interface accepted by library code
static async Task CountAsync(int n, IProgress<int>? progress = null)
{
    for (int i = 1; i <= n; i++)
    {
        await Task.Delay(10);
        progress?.Report(i);  // fire-and-forget, marshal to UI thread
    }
}

// Progress<T>: concrete implementation; captures SynchronizationContext
var prog = new Progress<int>(pct => Console.Write(\$"\r{pct}%  "));
await CountAsync(10, prog);
Console.WriteLine();`,
    explanation: "IProgress<T> is the interface library code accepts so callers can inject any implementation. Progress<T> is the standard implementation that marshals Report calls to the SynchronizationContext captured at construction — avoiding manual Invoke in UI code.",
  },
  {
    id: "cs-b16-b2-linq-side-effects-where",
    language: "csharp",
    title: "LINQ side effects in Where",
    tag: "caveats",
    code: `var log = new List<string>();

var data = new[] { 1, 2, 3, 4, 5 };
var query = data.Where(x =>
{
    log.Add(\$"tested {x}");  // side effect in predicate!
    return x % 2 == 0;
});

// Side effects run TWICE — once per enumeration
var a = query.ToList();
var b = query.ToList();

Console.WriteLine(log.Count); // 10, not 5`,
    explanation: "LINQ predicates run every time the query is enumerated. Placing side effects (logging, mutation, I/O) inside Where, Select, or similar operators leads to multiple executions. Always materialise with ToList/ToArray if you need exactly one evaluation.",
  },
  {
    id: "cs-b16-b2-default-interface",
    language: "csharp",
    title: "Default interface implementation",
    tag: "types",
    code: `public interface IGreeter
{
    string Name { get; }

    // Default implementation — no need to override
    string Greet() => \$"Hello, {Name}!";
    string FormalGreet() => \$"Good day, {Name}.";
}

public class Person(string name) : IGreeter
{
    public string Name => name;
    // Greet() inherited from interface

    public string FormalGreet() => \$"Salutations, {name}!";
}

IGreeter g = new Person("Alice");
Console.WriteLine(g.Greet());        // Hello, Alice!
Console.WriteLine(g.FormalGreet());  // Salutations, Alice!`,
    explanation: "Default interface implementations (C# 8) allow interfaces to provide method bodies, enabling API evolution without breaking existing implementors. The method is only accessible through the interface type, not the concrete class.",
  },
  {
    id: "cs-b16-b2-convert-base64",
    language: "csharp",
    title: "Convert.FromBase64String",
    tag: "snippet",
    code: `using System;
using System.Text;

string text = "Hello, Base64!";
byte[] bytes = Encoding.UTF8.GetBytes(text);

// Encode
string encoded = Convert.ToBase64String(bytes);
Console.WriteLine(encoded);
// SGVsbG8sIEJhc2U2NCE=

// Decode
byte[] decoded = Convert.FromBase64String(encoded);
Console.WriteLine(Encoding.UTF8.GetString(decoded));
// Hello, Base64!

// URL-safe variant (manual)
string urlSafe = encoded.Replace('+', '-').Replace('/', '_').TrimEnd('=');
Console.WriteLine(urlSafe);`,
    explanation: "Convert.ToBase64String encodes bytes to standard Base64 with + and / characters. For URLs and cookies, replace + with - and / with _ and strip trailing = padding to produce URL-safe Base64 (RFC 4648).",
  },
  {
    id: "cs-b16-b2-concurrent-stack",
    language: "csharp",
    title: "ConcurrentStack<T>",
    tag: "structures",
    code: `using System.Collections.Concurrent;

var stack = new ConcurrentStack<string>();

stack.Push("first");
stack.Push("second");
stack.Push("third");

// TryPop: atomic peek + remove
while (stack.TryPop(out string? item))
    Console.WriteLine(item);
// third, second, first (LIFO)

// PushRange / TryPopRange for batch operations
stack.PushRange(new[] { "a", "b", "c" });
string[] batch = new string[2];
int count = stack.TryPopRange(batch);
Console.WriteLine(\$"popped {count}: {string.Join(",", batch)}");`,
    explanation: "ConcurrentStack<T> is a lock-free LIFO stack using CAS operations. TryPop never blocks and returns false on empty; TryPopRange retrieves multiple items atomically, reducing contention in high-throughput scenarios.",
  },
  {
    id: "cs-b16-b2-int128",
    language: "csharp",
    title: "Int128/UInt128",
    tag: "types",
    code: `// Int128 and UInt128: 128-bit integers (.NET 7+)
Int128 big = Int128.MaxValue;
Console.WriteLine(big);
// 170141183460469231731687303715884105727

Int128 a = (Int128)long.MaxValue * 1000;
Console.WriteLine(a);
// 9223372036854775807000

UInt128 product = (UInt128)ulong.MaxValue * ulong.MaxValue;
Console.WriteLine(product);

// Supports all arithmetic operators
Console.WriteLine(Int128.IsPow2(big + 1)); // True`,
    explanation: "Int128 and UInt128 (.NET 7) provide 128-bit integer arithmetic without requiring BigInteger's heap allocation. They support all standard operators and implement INumber<T>, working with generic math algorithms.",
  },
  {
    id: "cs-b16-b2-hashset-intersectwith",
    language: "csharp",
    title: "HashSet.IntersectWith in-place",
    tag: "snippet",
    code: `var a = new HashSet<int> { 1, 2, 3, 4, 5 };
var b = new HashSet<int> { 3, 4, 5, 6, 7 };

// In-place operations modify the set itself
a.IntersectWith(b);
Console.WriteLine(string.Join(" ", a)); // 3 4 5

var x = new HashSet<string> { "apple", "banana", "cherry" };
x.ExceptWith(new[] { "banana" });
Console.WriteLine(string.Join(" ", x)); // apple cherry

x.UnionWith(new[] { "date", "elderberry" });
Console.WriteLine(string.Join(" ", x));`,
    explanation: "HashSet's IntersectWith, ExceptWith, and UnionWith modify the set in-place rather than returning new collections, avoiding allocations. Use Intersect/Except/Union (LINQ) if you need to preserve the original.",
  },
  {
    id: "cs-b16-b2-eventhandler-vs-action",
    language: "csharp",
    title: "EventHandler<T> vs Action<T>",
    tag: "families",
    code: `// EventHandler<T>: classic .NET event pattern
public class Button
{
    public event EventHandler<string>? Clicked;
    protected void OnClick(string label)
        => Clicked?.Invoke(this, label);
    public void Simulate() => OnClick("OK");
}

var btn = new Button();
btn.Clicked += (sender, label) =>
    Console.WriteLine(\$"Clicked: {label} from {sender?.GetType().Name}");
btn.Simulate();

// Action<T>: simpler delegate, no sender convention
Action<string> handler = label => Console.WriteLine(\$"Action: {label}");
handler("Submit");`,
    explanation: "EventHandler<TEventArgs> follows the .NET event pattern with (sender, args) parameters, integrating with the event keyword and IDE tooling. Action<T> is lighter-weight but lacks the sender and doesn't integrate with event add/remove multicast semantics.",
  },
  {
    id: "cs-b16-b2-json-serialize",
    language: "csharp",
    title: "JsonSerializer.Serialize with options",
    tag: "snippet",
    code: `using System.Text.Json;
using System.Text.Json.Serialization;

record Product(string Name, decimal Price, bool InStock);

var opts = new JsonSerializerOptions
{
    PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    WriteIndented = true,
    DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
};

var p = new Product("Widget", 9.99m, true);
string json = JsonSerializer.Serialize(p, opts);
Console.WriteLine(json);
// { "name": "Widget", "price": 9.99, "inStock": true }

var p2 = JsonSerializer.Deserialize<Product>(json, opts);
Console.WriteLine(p2?.Name);`,
    explanation: "JsonSerializerOptions is reusable and thread-safe — create one static instance rather than recreating per call. CamelCase naming policy, indentation, and null-ignoring are the most commonly tuned settings.",
  },
  {
    id: "cs-b16-b2-readonly-dict-wrapper",
    language: "csharp",
    title: "ReadOnlyDictionary<K,V> wrapper",
    tag: "structures",
    code: `using System.Collections.ObjectModel;
using System.Collections.Generic;

var mutable = new Dictionary<string, int>
{
    ["a"] = 1, ["b"] = 2
};

// Wrap without copying — changes to mutable are visible
var readOnly = new ReadOnlyDictionary<string, int>(mutable);

Console.WriteLine(readOnly["a"]);          // 1
// readOnly["c"] = 3;                      // compile error

mutable["c"] = 3;
Console.WriteLine(readOnly.ContainsKey("c")); // True (live view)`,
    explanation: "ReadOnlyDictionary<K,V> is a zero-copy read-only view over an existing dictionary, not a snapshot. This makes it efficient for exposing internal state as read-only without the overhead of ImmutableDictionary's structural copying.",
  },
  {
    id: "cs-b16-b2-iparsable",
    language: "csharp",
    title: "IParsable<T>",
    tag: "types",
    code: `using System;
using System.Globalization;

public readonly struct Celsius : IParsable<Celsius>
{
    public double Value { get; }
    public Celsius(double v) => Value = v;

    public static Celsius Parse(string s, IFormatProvider? provider)
        => new(double.Parse(s.TrimEnd('°','C'), provider));

    public static bool TryParse(string? s, IFormatProvider? provider,
        out Celsius result)
    {
        bool ok = double.TryParse(s?.TrimEnd('°','C'), provider, out double v);
        result = new(ok ? v : 0);
        return ok;
    }
}

var temp = Celsius.Parse("98.6°C", CultureInfo.InvariantCulture);
Console.WriteLine(temp.Value); // 98.6`,
    explanation: "IParsable<T> (System, .NET 7+) standardises string parsing for custom types, enabling generic parse utilities and static-abstract dispatch. Implementing it makes your type work with generic parsing helpers that accept where T : IParsable<T>.",
  },
  {
    id: "cs-b16-b2-checked-operators",
    language: "csharp",
    title: "checked operators",
    tag: "types",
    code: `// checked context: arithmetic overflow throws OverflowException
checked
{
    int max = int.MaxValue;
    try
    {
        int overflow = max + 1; // throws
    }
    catch (OverflowException)
    {
        Console.WriteLine("overflow caught");
    }
}

// unchecked (default): wraps silently
int wrapped = unchecked(int.MaxValue + 1);
Console.WriteLine(wrapped); // -2147483648

// checked works on conversions too
try { checked { int x = (int)3_000_000_000u; } }
catch (OverflowException) { Console.WriteLine("conversion overflow"); }`,
    explanation: "The checked keyword enables overflow checking for integer arithmetic and conversions in a block or expression. Without it (unchecked, the default), overflow silently wraps — which is often a security or correctness bug.",
  },
  {
    id: "cs-b16-b2-string-builder-appendjoin",
    language: "csharp",
    title: "StringBuilder.AppendJoin",
    tag: "snippet",
    code: `using System.Text;

var names = new[] { "Alice", "Bob", "Carol", "Dave" };

var sb = new StringBuilder();
sb.Append("Attendees: ");
sb.AppendJoin(", ", names);
sb.AppendLine();
sb.AppendJoin(" | ", Enumerable.Range(1, 5));

Console.WriteLine(sb.ToString());
// Attendees: Alice, Bob, Carol, Dave
// 1 | 2 | 3 | 4 | 5`,
    explanation: "StringBuilder.AppendJoin writes elements with a separator directly into the builder in a single pass, avoiding the intermediate string allocation that string.Join would create before the Append call.",
  },
  {
    id: "cs-b16-b2-async-constructor-workaround",
    language: "csharp",
    title: "async in constructors workaround",
    tag: "caveats",
    code: `// Constructors can't be async — use a static factory method
public class DbContext
{
    private readonly string _connectionString;

    private DbContext(string cs) => _connectionString = cs;

    public static async Task<DbContext> CreateAsync(string cs)
    {
        var ctx = new DbContext(cs);
        await ctx.InitialiseAsync(); // async setup
        return ctx;
    }

    private async Task InitialiseAsync()
        => await Task.Delay(10); // simulate async init

    public string ConnectionString => _connectionString;
}

var ctx = await DbContext.CreateAsync("Server=localhost");
Console.WriteLine(ctx.ConnectionString);`,
    explanation: "C# constructors are synchronous — you can't await in them. The standard workaround is a private constructor plus a public static async factory method that awaits any async initialisation before returning the ready object.",
  },
  {
    id: "cs-b16-b2-immutable-hashset",
    language: "csharp",
    title: "ImmutableHashSet",
    tag: "structures",
    code: `using System.Collections.Immutable;

var set = ImmutableHashSet.Create("apple", "banana", "cherry");

// Each operation returns a new set; original unchanged
var set2 = set.Add("date");
var set3 = set2.Remove("banana");

Console.WriteLine(set.Contains("date"));   // False
Console.WriteLine(set2.Contains("date"));  // True
Console.WriteLine(set3.Contains("banana")); // False
Console.WriteLine(set3.Count);              // 3

// Set operations
var other = ImmutableHashSet.Create("cherry", "elderberry");
var union = set.Union(other);
Console.WriteLine(union.Count); // 4`,
    explanation: "ImmutableHashSet provides thread-safe set operations where every modification returns a new set sharing structural nodes with the original. It's ideal for snapshot semantics and functional-style programming patterns.",
  },
  {
    id: "cs-b16-b2-volatile-keyword",
    language: "csharp",
    title: "volatile keyword",
    tag: "caveats",
    code: `using System.Threading;

class Worker
{
    // volatile: prevents caching in CPU registers; ensures visibility
    private volatile bool _running = true;

    public void Run()
    {
        while (_running)
        {
            // do work
        }
        Console.WriteLine("stopped");
    }

    public void Stop() => _running = false;
}

var w = new Worker();
var t = new Thread(w.Run);
t.Start();
Thread.Sleep(50);
w.Stop();
t.Join(); // prints "stopped"`,
    explanation: "volatile tells the compiler and JIT not to cache the field's value in a CPU register across iterations, ensuring every read fetches from memory. It doesn't guarantee atomicity for operations larger than a word — use Interlocked for that.",
  },
  {
    id: "cs-b16-b2-datetime-offset",
    language: "csharp",
    title: "DateTimeOffset arithmetic",
    tag: "snippet",
    code: `var now = DateTimeOffset.UtcNow;

DateTimeOffset future  = now.AddDays(30);
DateTimeOffset past    = now.AddHours(-48);
TimeSpan       diff    = future - past;

Console.WriteLine(\$"Now:    {now:yyyy-MM-dd HH:mm} UTC");
Console.WriteLine(\$"Future: {future:yyyy-MM-dd}");
Console.WriteLine(\$"Diff:   {diff.TotalHours:F1} hours");

// Convert to a specific time zone
var eastern = TimeZoneInfo.FindSystemTimeZoneById("Eastern Standard Time");
DateTimeOffset easternTime = TimeZoneInfo.ConvertTime(now, eastern);
Console.WriteLine(easternTime.Offset);`,
    explanation: "DateTimeOffset stores the UTC offset with each value, making it unambiguous across time zones — unlike DateTime which has ambiguous 'Unspecified' or 'Local' kinds. Always prefer DateTimeOffset for timezone-aware applications.",
  },
  {
    id: "cs-b16-b2-record-positional-vs-standard",
    language: "csharp",
    title: "record positional properties vs standard",
    tag: "classes",
    code: `// Positional: concise, generates init-only properties + Deconstruct
public record Point(double X, double Y);

// Standard: more control over accessors and attributes
public record Person
{
    public required string Name { get; init; }
    public int Age             { get; init; }
    public string Display      => \$"{Name} (age {Age})";
}

var p = new Point(3, 4);
var (x, y) = p;   // Deconstruct from positional
Console.WriteLine(\$"x={x} y={y}");

var person = new Person { Name = "Alice", Age = 30 };
Console.WriteLine(person.Display);`,
    explanation: "Positional record syntax auto-generates the constructor, init-only properties, and a Deconstruct method, minimising boilerplate. Standard property syntax gives per-property control over accessors, attributes, and computed members.",
  },
  {
    id: "cs-b16-b2-file-scoped-namespace",
    language: "csharp",
    title: "File-scoped namespaces",
    tag: "understanding",
    code: `// Old style: block namespace — adds one level of indentation
// namespace MyApp.Services
// {
//     public class OrderService { }
// }

// File-scoped namespace (C# 10): applies to entire file
// namespace MyApp.Services;
//
// public class OrderService { }   // no extra indentation

// Both produce the same IL; file-scoped is now the convention
// enforced by the IDE0161 analyzer.

Console.WriteLine("File-scoped namespace saves one indent level.");`,
    explanation: "File-scoped namespace declarations (C# 10) apply a single namespace to the entire file with a semicolon instead of braces, eliminating one level of indentation for every type in the file.",
  },
  {
    id: "cs-b16-b2-bitconverter",
    language: "csharp",
    title: "BitConverter.GetBytes",
    tag: "snippet",
    code: `using System;

int value = 0x12345678;
byte[] bytes = BitConverter.GetBytes(value);

Console.WriteLine(string.Join(" ", bytes.Select(b => b.ToString("X2"))));
// 78 56 34 12  (little-endian on x86)

Console.WriteLine(BitConverter.IsLittleEndian); // True

// Round-trip
int restored = BitConverter.ToInt32(bytes, 0);
Console.WriteLine(restored == value); // True

double pi = Math.PI;
byte[] piBytes = BitConverter.GetBytes(pi);
Console.WriteLine(piBytes.Length);   // 8`,
    explanation: "BitConverter converts between primitive types and their byte representations. The byte order depends on the system's endianness (BitConverter.IsLittleEndian). Use BinaryPrimitives in System.Buffers.Binary for endianness-explicit code.",
  },
  {
    id: "cs-b16-b2-list-removeall",
    language: "csharp",
    title: "List.RemoveAll",
    tag: "snippet",
    code: `var numbers = new List<int> { 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 };

int removed = numbers.RemoveAll(n => n % 2 == 0);
Console.WriteLine(\$"Removed {removed} items");   // Removed 5 items
Console.WriteLine(string.Join(", ", numbers));   // 1, 3, 5, 7, 9

// Equivalent but less efficient:
// numbers = numbers.Where(n => n % 2 != 0).ToList();

var words = new List<string> { "foo", "", "bar", null!, "baz" };
words.RemoveAll(string.IsNullOrEmpty);
Console.WriteLine(string.Join(", ", words)); // foo, bar, baz`,
    explanation: "RemoveAll takes a predicate, removes all matching elements in a single O(n) pass, and returns the count removed. It's more efficient than filtering to a new list because it modifies the existing buffer in place.",
  },
  {
    id: "cs-b16-b2-positional-pattern",
    language: "csharp",
    title: "Positional patterns",
    tag: "understanding",
    code: `public record Point(int X, int Y);

static string Quadrant(Point p) => p switch
{
    (0,  0)       => "origin",
    (> 0, > 0)    => "Q1",
    (< 0, > 0)    => "Q2",
    (< 0, < 0)    => "Q3",
    (> 0, < 0)    => "Q4",
    (0, _) or (_, 0) => "axis",
    _             => "?"
};

Console.WriteLine(Quadrant(new Point(3,  4)));  // Q1
Console.WriteLine(Quadrant(new Point(-1, 2)));  // Q2
Console.WriteLine(Quadrant(new Point(0,  5)));  // axis`,
    explanation: "Positional patterns deconstruct records (or types with a Deconstruct method) inline in a switch expression. Relational sub-patterns (> 0, < 0) and logical patterns (or, and, not) can be composed freely within each arm.",
  },
  {
    id: "cs-b16-b2-queue-peek-dequeue",
    language: "csharp",
    title: "Queue.Peek vs Dequeue",
    tag: "snippet",
    code: `var q = new Queue<string>();
q.Enqueue("first");
q.Enqueue("second");
q.Enqueue("third");

Console.WriteLine(q.Peek());    // first  (no removal)
Console.WriteLine(q.Count);     // 3

Console.WriteLine(q.Dequeue()); // first  (removes)
Console.WriteLine(q.Count);     // 2

// Safe versions that don't throw on empty
bool ok = q.TryPeek(out string? peeked);
Console.WriteLine(\$"peek ok={ok} val={peeked}"); // peek ok=True val=second

q.Clear();
q.TryDequeue(out string? item);
Console.WriteLine(item ?? "empty"); // empty`,
    explanation: "Peek inspects the front element without removing it; Dequeue removes and returns it. The Try* variants (TryPeek, TryDequeue) return false instead of throwing InvalidOperationException on an empty queue, making them safer in uncertain states.",
  },
  {
    id: "cs-b16-b2-global-using",
    language: "csharp",
    title: "Global using directives",
    tag: "understanding",
    code: `// GlobalUsings.cs — applied project-wide
global using System;
global using System.Collections.Generic;
global using System.Linq;
global using System.Threading.Tasks;

// In SDK-style projects, these are emitted automatically
// by <ImplicitUsings>enable</ImplicitUsings> in .csproj

// Any file in the project can now use List<T>, Task, Linq etc.
// without explicit using statements

// File-local using still hides the global:
// using SomeOtherList = System.Collections.ArrayList;

Console.WriteLine("global usings reduce boilerplate.");`,
    explanation: "Global using directives (C# 10) apply a using to every file in the compilation unit, eliminating repetitive using blocks. Implicit usings in SDK projects auto-generate common global usings based on the project type (console, web, etc.).",
  },
  {
    id: "cs-b16-b2-memory-pool",
    language: "csharp",
    title: "MemoryPool<T>",
    tag: "structures",
    code: `using System.Buffers;

// MemoryPool<T>: returns Memory<T> (heap-friendly)
using IMemoryOwner<byte> owner = MemoryPool<byte>.Shared.Rent(256);

Memory<byte> mem = owner.Memory;
Span<byte> span  = mem.Span;

for (int i = 0; i < 10; i++)
    span[i] = (byte)(i * 10);

Console.WriteLine(span[5]);        // 50
Console.WriteLine(mem.Length);     // >= 256 (may be larger)
// Returned to pool when owner is Disposed (using statement)`,
    explanation: "MemoryPool<T>.Shared is the async-friendly counterpart to ArrayPool<T>: it returns an IMemoryOwner<T> whose Memory<T> can be passed across async boundaries. Always dispose the owner to return the buffer to the pool.",
  },
  {
    id: "cs-b16-b2-httpcliente-vs-factory",
    language: "csharp",
    title: "HttpClient vs HttpClientFactory",
    tag: "families",
    code: `// HttpClient (wrong): creates a new instance per call
// Exhausts sockets and ignores DNS changes!
// using var client = new HttpClient();

// HttpClientFactory (correct in DI): manages lifetime and DNS refresh
// services.AddHttpClient<MyService>();

// Manual singleton pattern (outside DI):
public static class Http
{
    // Single shared instance — thread-safe for concurrent requests
    public static readonly HttpClient Client = new(
        new SocketsHttpHandler { PooledConnectionLifetime = TimeSpan.FromMinutes(2) }
    );
}

// Use it:
// var resp = await Http.Client.GetStringAsync("https://example.com");
Console.WriteLine("Singleton HttpClient avoids socket exhaustion.");`,
    explanation: "Creating a new HttpClient per request exhausts socket descriptors and ignores DNS TTL changes. Use IHttpClientFactory in DI scenarios for managed lifetime and resilience policies, or a single static SocketsHttpHandler with PooledConnectionLifetime outside DI.",
  },
  {
    id: "cs-b16-b2-encoding-utf8-getbytes",
    language: "csharp",
    title: "Encoding.UTF8.GetBytes",
    tag: "snippet",
    code: `using System.Text;

string text = "Hello, 世界! 🌍";
byte[] utf8  = Encoding.UTF8.GetBytes(text);
byte[] utf16 = Encoding.Unicode.GetBytes(text);

Console.WriteLine(\$"UTF-8:  {utf8.Length} bytes");   // varies
Console.WriteLine(\$"UTF-16: {utf16.Length} bytes");  // varies

// Round-trip
string back = Encoding.UTF8.GetString(utf8);
Console.WriteLine(back == text);  // True

// Allocation-free path with Span
Span<byte> buf = stackalloc byte[512];
int written = Encoding.UTF8.GetBytes(text, buf);
Console.WriteLine(\$"written: {written}");`,
    explanation: "Encoding.UTF8.GetBytes converts a string to its UTF-8 byte representation. For hot paths, the Span<byte> overload writes directly into a stack-allocated buffer, eliminating the heap allocation entirely.",
  },
  {
    id: "cs-b16-b2-array-copy-blockjopy",
    language: "csharp",
    title: "Array.Copy vs Buffer.BlockCopy",
    tag: "snippet",
    code: `int[] src  = { 1, 2, 3, 4, 5 };
int[] dst1 = new int[5];
int[] dst2 = new int[5];

// Array.Copy: element-wise, handles casts, reference types
Array.Copy(src, dst1, src.Length);
Console.WriteLine(string.Join(" ", dst1)); // 1 2 3 4 5

// Buffer.BlockCopy: byte-level memcpy, only for primitives
// count is in BYTES, not elements
Buffer.BlockCopy(src, 0, dst2, 0, src.Length * sizeof(int));
Console.WriteLine(string.Join(" ", dst2)); // 1 2 3 4 5`,
    explanation: "Buffer.BlockCopy is a low-level byte-level copy that is faster than Array.Copy for primitive arrays but only works with value types and counts bytes, not elements. Array.Copy is safer, handles type coercions, and works with reference types.",
  },
  {
    id: "cs-b16-b2-stack-trypop",
    language: "csharp",
    title: "Stack.TryPop",
    tag: "snippet",
    code: `var stack = new Stack<int>();
stack.Push(10);
stack.Push(20);
stack.Push(30);

// TryPop: safe, no exception on empty
while (stack.TryPop(out int value))
    Console.Write(\$"{value} ");
// 30 20 10

Console.WriteLine();
Console.WriteLine(stack.Count); // 0

// TryPeek: look without removing
stack.Push(42);
bool ok = stack.TryPeek(out int top);
Console.WriteLine(\$"peek: ok={ok} top={top}"); // peek: ok=True top=42
Console.WriteLine(stack.Count);                  // still 1`,
    explanation: "TryPop and TryPeek return a bool and use an out parameter instead of throwing InvalidOperationException on an empty stack, making them the preferred API when stack emptiness is a normal condition rather than a bug.",
  },
  {
    id: "cs-b16-b2-timespan-ops",
    language: "csharp",
    title: "TimeSpan operations",
    tag: "snippet",
    code: `TimeSpan t1 = TimeSpan.FromHours(1.5);
TimeSpan t2 = TimeSpan.FromMinutes(45);

TimeSpan sum  = t1 + t2;
TimeSpan diff = t1 - t2;

Console.WriteLine(sum.TotalMinutes);  // 135
Console.WriteLine(diff.TotalSeconds); // 2700

// Formatting
Console.WriteLine(t1.ToString(@"hh\:mm\:ss")); // 01:30:00
Console.WriteLine(\$"{t2.Hours}h {t2.Minutes}m");

// Multiply / Divide (C# 7.2+)
Console.WriteLine((t2 * 3).TotalHours); // 2.25`,
    explanation: "TimeSpan supports arithmetic operators (+, -, *, /) and provides TotalSeconds/TotalMinutes/TotalHours for computing elapsed durations as a single double. The verbatim string format @\"hh\\:mm\\:ss\" formats as a clock-style string.",
  },
  {
    id: "cs-b16-b2-thread-static",
    language: "csharp",
    title: "thread-static field",
    tag: "caveats",
    code: `using System.Threading;

class Counter
{
    [ThreadStatic]
    private static int _count;  // each thread has its own copy

    public static void Increment() => _count++;
    public static int Value => _count;
}

var t1 = new Thread(() => {
    Counter.Increment(); Counter.Increment();
    Console.WriteLine(\$"t1: {Counter.Value}"); // 2
});
var t2 = new Thread(() => {
    Counter.Increment();
    Console.WriteLine(\$"t2: {Counter.Value}"); // 1
});
t1.Start(); t2.Start(); t1.Join(); t2.Join();`,
    explanation: "[ThreadStatic] gives each thread its own independent copy of a static field. The critical caveat: the initialiser (e.g., = 0) only runs for the thread that initialises the class — other threads start with the default value (null/0), not the initialiser value.",
  },
  {
    id: "cs-b16-b2-concurrent-bag",
    language: "csharp",
    title: "ConcurrentBag<T>",
    tag: "structures",
    code: `using System.Collections.Concurrent;

var bag = new ConcurrentBag<int>();

Parallel.For(0, 10, i => bag.Add(i * i));

Console.WriteLine(\$"Count: {bag.Count}"); // 10

// Order is NOT guaranteed
while (bag.TryTake(out int item))
    Console.Write(\$"{item} ");

Console.WriteLine();
// e.g. 81 64 49 36 25 16 9 4 1 0 (any order)`,
    explanation: "ConcurrentBag<T> is a thread-safe, unordered collection optimised for scenarios where the same thread both produces and consumes items. It uses thread-local storage to minimise contention, but offers no ordering guarantees.",
  },
  {
    id: "cs-b16-b2-task-delay-vs-sleep",
    language: "csharp",
    title: "Task.Delay vs Thread.Sleep",
    tag: "caveats",
    code: `// Thread.Sleep: blocks the thread — wastes thread pool resources
// Thread.Sleep(1000);

// Task.Delay: releases the thread during the wait
async Task WaitAsync()
{
    Console.WriteLine("before delay");
    await Task.Delay(100); // thread returned to pool during wait
    Console.WriteLine("after delay");
}

// Task.Delay also accepts CancellationToken
using var cts = new CancellationTokenSource(50);
try { await Task.Delay(1000, cts.Token); }
catch (OperationCanceledException) { Console.WriteLine("delay cancelled"); }`,
    explanation: "Thread.Sleep blocks the calling thread for the entire duration, burning a thread pool thread. Task.Delay yields the thread back to the pool immediately and resumes on a pool thread when the timer fires, supporting far higher concurrency.",
  },
  {
    id: "cs-b16-b2-weakreference-t",
    language: "csharp",
    title: "WeakReference<T> collection",
    tag: "caveats",
    code: `var weakRef = new WeakReference<byte[]>(new byte[1024 * 1024]);

if (weakRef.TryGetTarget(out byte[]? arr))
    Console.WriteLine(\$"alive: {arr.Length}");  // 1048576

// Simulate GC pressure
arr = null;
GC.Collect();
GC.WaitForPendingFinalizers();

if (!weakRef.TryGetTarget(out _))
    Console.WriteLine("collected — object was large");`,
    explanation: "WeakReference<T> holds a reference that doesn't prevent garbage collection. TryGetTarget returns false once the GC has collected the target, making it suitable for caches that should yield memory under pressure without explicit eviction logic.",
  },
  {
    id: "cs-b16-b2-sorted-dict-iteration",
    language: "csharp",
    title: "SortedDictionary iteration order",
    tag: "snippet",
    code: `var sd = new SortedDictionary<string, int>(
    StringComparer.OrdinalIgnoreCase);

sd["Banana"] = 3;
sd["apple"]  = 5;
sd["Cherry"] = 2;

// Always iterates in ascending key order
foreach (var kv in sd)
    Console.WriteLine(\$"{kv.Key}: {kv.Value}");
// apple: 5
// Banana: 3
// Cherry: 2

// Keys and Values collections also ordered
Console.WriteLine(sd.Keys.First()); // apple`,
    explanation: "SortedDictionary<TKey,TValue> maintains entries in a red-black tree sorted by key. The Keys and Values collections preserve that order, and a custom IComparer<TKey> (like StringComparer.OrdinalIgnoreCase) controls the sort semantics.",
  },
  {
    id: "cs-b16-b2-monitor-lock",
    language: "csharp",
    title: "Monitor vs lock",
    tag: "caveats",
    code: `using System.Threading;

var obj = new object();
int shared = 0;

// 'lock' is syntactic sugar for Monitor.Enter/Exit + try/finally
void Increment()
{
    lock (obj) { shared++; }

    // Equivalent:
    Monitor.Enter(obj);
    try { shared++; }
    finally { Monitor.Exit(obj); }
}

// Monitor extras: TryEnter with timeout
bool acquired = Monitor.TryEnter(obj, TimeSpan.FromMilliseconds(100));
if (acquired) try { shared++; } finally { Monitor.Exit(obj); }`,
    explanation: "lock is shorthand for Monitor.Enter wrapped in try/finally, ensuring the monitor is always released even if an exception is thrown. Use Monitor directly when you need TryEnter with a timeout or Pulse/PulseAll for condition variables.",
  },
  {
    id: "cs-b16-b2-iadditional-operators",
    language: "csharp",
    title: "IAdditionOperators<T,T,T>",
    tag: "types",
    code: `using System.Numerics;

public readonly struct Money : IAdditionOperators<Money, Money, Money>
{
    public decimal Amount { get; }
    public string Currency { get; }

    public Money(decimal amount, string currency)
        => (Amount, Currency) = (amount, currency);

    public static Money operator +(Money a, Money b)
    {
        if (a.Currency != b.Currency)
            throw new InvalidOperationException("Currency mismatch");
        return new(a.Amount + b.Amount, a.Currency);
    }
}

var a = new Money(10.00m, "USD");
var b = new Money(5.50m,  "USD");
Console.WriteLine((a + b).Amount); // 15.50`,
    explanation: "IAdditionOperators<TSelf, TOther, TResult> (System.Numerics) is a static abstract interface requiring operator +. Implementing it lets your type participate in generic math algorithms constrained to IAdditionOperators without boxing.",
  },
  {
    id: "cs-b16-b2-binding-list",
    language: "csharp",
    title: "BindingList<T>",
    tag: "structures",
    code: `using System.ComponentModel;

var list = new BindingList<string>();

list.ListChanged += (_, e) =>
    Console.WriteLine(\$"Action: {e.ListChangedType} index: {e.NewIndex}");

list.Add("first");    // ListChangedType: ItemAdded, index: 0
list.Add("second");   // ListChangedType: ItemAdded, index: 1
list[0] = "changed";  // ListChangedType: ItemChanged, index: 0
list.RemoveAt(1);     // ListChangedType: ItemDeleted, index: 1

Console.WriteLine(list.Count); // 1`,
    explanation: "BindingList<T> extends List<T> with ListChanged events that fire on add, remove, and change. It integrates with WinForms data binding and DataGridView, providing two-way synchronisation between the list and the UI.",
  },
  {
    id: "cs-b16-b2-local-function-vs-lambda",
    language: "csharp",
    title: "Local functions vs lambdas",
    tag: "understanding",
    code: `static int Factorial(int n)
{
    // Local function: recursive, no allocation, can be generic
    int Inner(int x) => x <= 1 ? 1 : x * Inner(x - 1);
    return Inner(n);
}

// Lambda: allocated as a delegate object on first call
Func<int, int> factorial = null!;
factorial = n => n <= 1 ? 1 : n * factorial(n - 1);

Console.WriteLine(Factorial(5));   // 120
Console.WriteLine(factorial(5));   // 120`,
    explanation: "Local functions compile to regular private methods — they can be recursive by name, generic, and allocation-free. Lambdas compile to delegate objects that allocate and capture variables by reference, making local functions preferable for performance-critical helpers.",
  },
  {
    id: "cs-b16-b2-static-local-function",
    language: "csharp",
    title: "static local function",
    tag: "understanding",
    code: `static double Process(double[] values)
{
    // static: compiler error if it accidentally captures outer state
    static double Square(double x) => x * x;
    static double SumArr(double[] arr)
    {
        double total = 0;
        foreach (var v in arr) total += v;
        return total;
    }

    double sumOfSquares = SumArr(Array.ConvertAll(values, Square));
    return Math.Sqrt(sumOfSquares / values.Length);
}

Console.WriteLine(Process(new[] { 3.0, 4.0 })); // 3.535...`,
    explanation: "The static modifier on a local function prevents it from capturing any variables from the enclosing scope, acting as a compile-time guard against accidental closures and their associated allocations.",
  },
  {
    id: "cs-b16-b2-expression-bodied-limits",
    language: "csharp",
    title: "Expression-bodied members limitations",
    tag: "understanding",
    code: `public class Account
{
    private decimal _balance;

    public string Owner { get; }
    public decimal Balance => _balance;
    public override string ToString() => \$"Balance: {_balance:C}";

    // void method: OK as long as the body is a single statement expr
    public void Deposit(decimal amt) => _balance += amt;

    public Account(string owner) => Owner = owner;
}

var a = new Account("Alice");
a.Deposit(100m);
Console.WriteLine(a); // Balance: $100.00`,
    explanation: "Expression-bodied members require a single expression, not a block statement. void methods can use => only when the expression is itself a statement (assignment, method call). Multi-statement logic always needs braces.",
  },
  {
    id: "cs-b16-b2-generic-average",
    language: "csharp",
    title: "Generic math average with INumber<T>",
    tag: "snippet",
    code: `using System.Numerics;

static T Average<T>(IEnumerable<T> values)
    where T : INumber<T>
{
    T sum   = T.Zero;
    int count = 0;
    foreach (var v in values) { sum += v; count++; }
    return sum / T.CreateChecked(count);
}

Console.WriteLine(Average(new[] { 1, 3, 5, 7, 9 }));      // 5
Console.WriteLine(Average(new[] { 1.0, 2.0, 3.0 }));      // 2
Console.WriteLine(Average(new[] { 10m, 20m, 30m, 40m })); // 25`,
    explanation: "T.CreateChecked converts an int to T at runtime without boxing, enabling generic arithmetic over any INumber<T> implementation. This replaces dozens of overloads with a single algorithm that the JIT specialises per numeric type.",
  },
  {
    id: "cs-b16-b2-memory-cache",
    language: "csharp",
    title: "MemoryCache vs IDistributedCache",
    tag: "families",
    code: `using Microsoft.Extensions.Caching.Memory;

// MemoryCache: in-process, fast, lost on restart
var cache = new MemoryCache(new MemoryCacheOptions());

cache.Set("key", "value", TimeSpan.FromMinutes(5));

if (cache.TryGetValue("key", out string? val))
    Console.WriteLine(\$"hit: {val}");

// IDistributedCache (e.g., Redis): cross-process, bytes only
// services.AddStackExchangeRedisCache(o => o.Configuration = "...");
// await distributedCache.SetStringAsync("key", "value");
// string? v = await distributedCache.GetStringAsync("key");

Console.WriteLine("MemoryCache: single-node; IDistributedCache: cluster-wide.");`,
    explanation: "MemoryCache stores objects in process memory — fast and allocation-free for lookups, but lost on restart and not shared across instances. IDistributedCache stores serialised bytes in an external store (Redis, SQL Server), enabling multi-instance sharing.",
  },
  {
    id: "cs-b16-b2-concurrent-dict-addorupdate",
    language: "csharp",
    title: "ConcurrentDictionary AddOrUpdate and GetOrAdd",
    tag: "snippet",
    code: `using System.Collections.Concurrent;

var counts = new ConcurrentDictionary<string, int>();

string[] words = { "apple", "banana", "apple", "cherry", "banana", "apple" };

foreach (var word in words)
    counts.AddOrUpdate(word, 1, (_, old) => old + 1);

foreach (var (k, v) in counts.OrderBy(p => p.Key))
    Console.WriteLine(\$"{k}: {v}");
// apple: 3, banana: 2, cherry: 1

var seen = new ConcurrentDictionary<int, string>();
string item = seen.GetOrAdd(1, key => \$"item-{key}");
Console.WriteLine(item); // item-1`,
    explanation: "AddOrUpdate atomically adds or updates a key; the updateValueFactory may run multiple times under contention so keep it side-effect-free. GetOrAdd atomically inserts only when the key is absent, making it safe for concurrent lazy initialisation.",
  },
  {
    id: "cs-b16-b2-implicit-using",
    language: "csharp",
    title: "Implicit using directives",
    tag: "understanding",
    code: `// In .csproj: <ImplicitUsings>enable</ImplicitUsings>
// The SDK auto-generates a hidden GlobalUsings.g.cs file:
//   global using global::System;
//   global using global::System.Collections.Generic;
//   global using global::System.IO;
//   global using global::System.Linq;
//   global using global::System.Net.Http;
//   global using global::System.Threading;
//   global using global::System.Threading.Tasks;

// Result: top-level programs need zero using directives:
var numbers = new List<int> { 1, 2, 3 };
await Task.Delay(0);
Console.WriteLine(numbers.Sum()); // 6`,
    explanation: "ImplicitUsings (.NET 6+) auto-generates global using directives from the SDK based on the project type. Console apps get System, Linq, Collections.Generic, IO, Threading, Tasks, and Net.Http. Web projects add ASP.NET Core namespaces on top.",
  },
  {
    id: "cs-b16-b2-record-with-expression",
    language: "csharp",
    title: "record with-expression",
    tag: "classes",
    code: `public record UserProfile(
    string Name,
    string Email,
    bool IsAdmin = false);

var alice = new UserProfile("Alice", "alice@example.com");

// with-expression: copy and change specified properties
var admin = alice with { IsAdmin = true };
var bob   = alice with { Name = "Bob", Email = "bob@example.com" };

Console.WriteLine(alice);
// UserProfile { Name = Alice, Email = alice@example.com, IsAdmin = False }
Console.WriteLine(alice == admin);  // False (value equality)
Console.WriteLine(alice == alice with { }); // True`,
    explanation: "The with-expression (C# 9) creates a shallow copy of a record with specified properties changed. The compiler generates a Clone method and the copy constructor that with-expressions invoke; properties must be init-only to participate.",
  },
  {
    id: "cs-b16-b2-linq-groupby-aggregate",
    language: "csharp",
    title: "LINQ GroupBy with aggregate",
    tag: "snippet",
    code: `var sales = new[]
{
    new { Region = "North", Amount = 100m },
    new { Region = "South", Amount = 200m },
    new { Region = "North", Amount = 150m },
    new { Region = "South", Amount = 50m  },
    new { Region = "East",  Amount = 300m },
};

var totals = sales
    .GroupBy(s => s.Region)
    .Select(g => new { Region = g.Key, Total = g.Sum(s => s.Amount) })
    .OrderByDescending(x => x.Total);

foreach (var r in totals)
    Console.WriteLine(\$"{r.Region}: {r.Total:C}");`,
    explanation: "GroupBy returns IEnumerable<IGrouping<TKey,T>> where each group exposes its Key and the matching elements. Chaining Sum, Average, Count, or Max on the group is the standard way to produce per-group aggregates.",
  },
  {
    id: "cs-b16-b2-recyclable-memory-stream",
    language: "csharp",
    title: "RecyclableMemoryStream pattern",
    tag: "structures",
    code: `using System.IO;

// Standard MemoryStream doubles its buffer on resize (LOH risk)
// For production use the NuGet Microsoft.IO.RecyclableMemoryStream:
//   var mgr = new RecyclableMemoryStreamManager();
//   using var rms = mgr.GetStream();

// Simulate the intent with a reusable buffer approach:
static byte[] ProcessData(ReadOnlySpan<byte> input)
{
    using var ms = new MemoryStream(input.Length);
    ms.Write(input);
    return ms.ToArray();
}

byte[] data = new byte[256];
byte[] result = ProcessData(data);
Console.WriteLine(result.Length); // 256`,
    explanation: "RecyclableMemoryStream (Microsoft.IO.RecyclableMemoryStream NuGet) rents fixed-size blocks from a pool instead of allocating one contiguous buffer that doubles in size, keeping large allocations off the Large Object Heap and reducing GC fragmentation.",
  },
  {
    id: "cs-b16-b2-span-stackalloc",
    language: "csharp",
    title: "Span<T> with stackalloc",
    tag: "snippet",
    code: `using System;

static string FormatHex(ReadOnlySpan<byte> data)
{
    Span<char> buf = stackalloc char[data.Length * 2];
    const string hex = "0123456789abcdef";
    for (int i = 0; i < data.Length; i++)
    {
        buf[i * 2]     = hex[data[i] >> 4];
        buf[i * 2 + 1] = hex[data[i] & 0xF];
    }
    return new string(buf);
}

byte[] bytes = { 0xCA, 0xFE, 0xBA, 0xBE };
Console.WriteLine(FormatHex(bytes)); // cafebabe`,
    explanation: "stackalloc allocates a Span<char> on the stack, avoiding heap allocation for small, short-lived buffers. Span<T> enforces that the memory doesn't escape the method, giving the compiler confidence that the stack frame remains valid.",
  },
];

