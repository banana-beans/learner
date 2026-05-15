import type { Snippet } from "./types";

export const csharpSnippets20260515B4: Snippet[] = [
  {
    id: "cs-b15-b4-span-write",
    language: "csharp",
    title: "Writing to Span<char> for zero-alloc formatting",
    tag: "snippet",
    code: `bool TryFormat(Span<char> dest, int value, out int written)
{
    return value.TryFormat(dest, out written, "D6");
}

Span<char> buf = stackalloc char[32];
if (TryFormat(buf, 42, out int n))
    Console.WriteLine(new string(buf[..n]));  // 000042`,
    explanation: "`TryFormat` writes directly into a `Span<char>` without intermediate string allocation — the foundation of high-throughput formatting in .NET."
  },
  {
    id: "cs-b15-b4-record-equality",
    language: "csharp",
    title: "Record value equality semantics",
    tag: "snippet",
    code: `record Money(decimal Amount, string Currency);

var a = new Money(100m, "USD");
var b = new Money(100m, "USD");
var c = new Money(200m, "USD");

Console.WriteLine(a == b);        // True
Console.WriteLine(a.Equals(b));   // True
Console.WriteLine(ReferenceEquals(a, b)); // False
Console.WriteLine(a == c);        // False`,
    explanation: "Records generate `Equals`, `==`, `!=`, and `GetHashCode` based on all property values. Two records with equal properties are equal even if they're different objects."
  },
  {
    id: "cs-b15-b4-primary-ctor-services",
    language: "csharp",
    title: "Primary constructor capturing multiple services",
    tag: "snippet",
    code: `public class NotificationService(
    IEmailSender email,
    ISmsSender sms,
    ILogger<NotificationService> logger)
{
    public async Task NotifyAsync(string userId, string message)
    {
        logger.LogInformation("Notifying {UserId}", userId);
        await Task.WhenAll(
            email.SendAsync(userId, message),
            sms.SendAsync(userId, message));
    }
}

interface IEmailSender { Task SendAsync(string to, string msg); }
interface ISmsSender { Task SendAsync(string to, string msg); }`,
    explanation: "Primary constructors are especially clean for DI: each service is named once, available throughout the class body without private field declarations."
  },
  {
    id: "cs-b15-b4-init-with-required",
    language: "csharp",
    title: "Combining init with required and default",
    tag: "snippet",
    code: `public class HttpOptions
{
    public required Uri BaseAddress { get; init; }
    public TimeSpan Timeout { get; init; } = TimeSpan.FromSeconds(30);
    public int MaxRetries { get; init; } = 3;
    public bool FollowRedirects { get; init; } = true;
}

var opts = new HttpOptions
{
    BaseAddress = new Uri("https://api.example.com"),
    Timeout = TimeSpan.FromMinutes(1),
};`,
    explanation: "`required init` enforces `BaseAddress` is always set while optional `init` properties default to sensible values, keeping the object initializer clean."
  },
  {
    id: "cs-b15-b4-collection-expr-readonly",
    language: "csharp",
    title: "Collection expression to IReadOnlyList",
    tag: "snippet",
    code: `IReadOnlyList<string> days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
IReadOnlyCollection<int> primes = [2, 3, 5, 7, 11, 13];

Console.WriteLine(days[2]);     // Wed
Console.WriteLine(primes.Count); // 6`,
    explanation: "Collection expressions work with any target type the compiler knows how to construct — including `IReadOnlyList<T>` and `IReadOnlyCollection<T>`, not just arrays."
  },
  {
    id: "cs-b15-b4-span-tokenize",
    language: "csharp",
    title: "Tokenizing with MemoryExtensions",
    tag: "snippet",
    code: `ReadOnlySpan<char> csv = "alpha,beta,gamma,delta";
int count = 0;

foreach (var range in csv.Split(','))
{
    Console.WriteLine(csv[range].ToString());
    count++;
}
Console.WriteLine(\`\${count} fields\`);`,
    explanation: "`ReadOnlySpan<char>.Split` (via `MemoryExtensions`) yields `Range` values for each token — no string allocations, no temporary arrays."
  },
  {
    id: "cs-b15-b4-arraypool-sequence",
    language: "csharp",
    title: "ReadOnlySequence<T> for segmented buffers",
    tag: "snippet",
    code: `using System.Buffers;

var first = new byte[] { 1, 2, 3, 4 };
var second = new byte[] { 5, 6, 7, 8 };

var seq = new ReadOnlySequence<byte>(first);
Console.WriteLine(\`Length: \${seq.Length}\`);

foreach (var segment in seq)
    Console.Write(string.Join(" ", segment.ToArray()));`,
    explanation: "`ReadOnlySequence<T>` represents a possibly-segmented buffer — essential for pipeline-based I/O where data spans multiple memory segments."
  },
  {
    id: "cs-b15-b4-channel-bounded",
    language: "csharp",
    title: "Bounded channel for back-pressure",
    tag: "snippet",
    code: `using System.Threading.Channels;

var channel = Channel.CreateBounded<int>(
    new BoundedChannelOptions(capacity: 5)
    {
        FullMode = BoundedChannelFullMode.Wait,
    });

async Task FastProducer()
{
    for (int i = 0; i < 20; i++)
        await channel.Writer.WriteAsync(i);
    channel.Writer.Complete();
}`,
    explanation: "`BoundedChannelFullMode.Wait` blocks the producer when the buffer is full, applying natural back-pressure instead of dropping items or throwing."
  },
  {
    id: "cs-b15-b4-valuetask-cached",
    language: "csharp",
    title: "ValueTask with cached completed results",
    tag: "snippet",
    code: `using System.Threading.Tasks;

static readonly ValueTask<int> Zero = ValueTask.FromResult(0);
static readonly ValueTask<bool> True = ValueTask.FromResult(true);
static readonly ValueTask<bool> False = ValueTask.FromResult(false);

ValueTask<bool> ValidateAsync(int value) =>
    value > 0 ? True : False;`,
    explanation: "Pre-allocated `ValueTask` singletons eliminate allocation for common synchronous return values. This is the same pattern used internally by the BCL."
  },
  {
    id: "cs-b15-b4-iasync-enumerable-cancellation",
    language: "csharp",
    title: "IAsyncEnumerable with cancellation",
    tag: "snippet",
    code: `using System.Runtime.CompilerServices;

async IAsyncEnumerable<int> Stream(
    [EnumeratorCancellation] CancellationToken ct = default)
{
    for (int i = 0; !ct.IsCancellationRequested; i++)
    {
        await Task.Delay(100, ct);
        yield return i;
    }
}

using var cts = new CancellationTokenSource(500);
await foreach (var n in Stream().WithCancellation(cts.Token))
    Console.WriteLine(n);`,
    explanation: "`[EnumeratorCancellation]` routes the `WithCancellation` token into the iterator parameter. The loop stops cleanly when the token fires."
  },
  {
    id: "cs-b15-b4-parallel-foreach-async",
    language: "csharp",
    title: "Parallel.ForEachAsync for async parallelism",
    tag: "snippet",
    code: `using System.Threading.Tasks;

var urls = Enumerable.Range(1, 10)
    .Select(i => \`https://api.example.com/item/\${i}\`)
    .ToList();

await Parallel.ForEachAsync(
    urls,
    new ParallelOptions { MaxDegreeOfParallelism = 4 },
    async (url, ct) =>
    {
        await Task.Delay(100, ct);
        Console.WriteLine(\`Fetched: \${url}\`);
    });`,
    explanation: "`Parallel.ForEachAsync` (.NET 6+) runs async lambdas concurrently with bounded parallelism — unlike `Task.WhenAll`, it doesn't launch all tasks immediately."
  },
  {
    id: "cs-b15-b4-interlocked-add",
    language: "csharp",
    title: "Interlocked.Add and Exchange",
    tag: "snippet",
    code: `using System.Threading;

long total = 0;
object[] results = new object[10];

Parallel.For(0, 10, i =>
{
    long contribution = i * i;
    Interlocked.Add(ref total, contribution);
    Interlocked.Exchange(ref results[i], (object)(i * i));
});

Console.WriteLine(\`Total: \${total}\`);`,
    explanation: "`Interlocked.Add` atomically adds and returns the new value. `Exchange` atomically replaces and returns the old value — both work without locks."
  },
  {
    id: "cs-b15-b4-semaphore-throttle",
    language: "csharp",
    title: "SemaphoreSlim as API rate limiter",
    tag: "snippet",
    code: `using System.Threading;

class RateLimiter(int maxConcurrent)
{
    private readonly SemaphoreSlim _sem = new(maxConcurrent);

    public async Task<T> ExecuteAsync<T>(
        Func<CancellationToken, Task<T>> work,
        CancellationToken ct = default)
    {
        await _sem.WaitAsync(ct);
        try { return await work(ct); }
        finally { _sem.Release(); }
    }
}`,
    explanation: "A `SemaphoreSlim` wrapper enforces maximum concurrency across async calls. The `try/finally` guarantees release even if `work` throws."
  },
  {
    id: "cs-b15-b4-barrier-sync",
    language: "csharp",
    title: "Barrier for phase-synchronized parallel work",
    tag: "snippet",
    code: `using System.Threading;

int phases = 3, workers = 4;
using var barrier = new Barrier(workers, b =>
    Console.WriteLine(\`Phase \${b.CurrentPhaseNumber} complete\`));

Parallel.For(0, workers, id =>
{
    for (int p = 0; p < phases; p++)
    {
        Console.WriteLine(\`Worker \${id} phase \${p}\`);
        barrier.SignalAndWait();
    }
});`,
    explanation: "`Barrier` holds all threads until all participants call `SignalAndWait`, then runs the phase-complete callback before releasing them for the next phase."
  },
  {
    id: "cs-b15-b4-generic-where-new",
    language: "csharp",
    title: "Generic constraint: new() for factory creation",
    tag: "types",
    code: `T CreateAndInit<T>() where T : class, new()
{
    var instance = new T();
    Console.WriteLine(\`Created \${typeof(T).Name}\`);
    return instance;
}

class Widget { public string Name = "Widget"; }

var w = CreateAndInit<Widget>();
Console.WriteLine(w.Name);`,
    explanation: "The `new()` constraint guarantees `T` has a public parameterless constructor, enabling `new T()` calls in generic methods — otherwise the compiler rejects it."
  },
  {
    id: "cs-b15-b4-dateonly-parsing",
    language: "csharp",
    title: "DateOnly parsing and formatting",
    tag: "snippet",
    code: `var date = DateOnly.Parse("2026-05-15");
var formatted = date.ToString("MMMM d, yyyy");
Console.WriteLine(formatted);  // May 15, 2026

var nextWeek = date.AddDays(7);
Console.WriteLine(nextWeek.ToString("o"));  // 2026-05-22`,
    explanation: "`DateOnly.Parse` accepts ISO 8601 and other standard formats. `.ToString(\"o\")` produces the ISO sortable format without time component."
  },
  {
    id: "cs-b15-b4-timeonly-arithmetic",
    language: "csharp",
    title: "TimeOnly arithmetic and comparisons",
    tag: "snippet",
    code: `var start = new TimeOnly(9, 30);
var end = new TimeOnly(17, 45);

TimeSpan duration = end - start;
Console.WriteLine(\`Duration: \${duration}\`);  // 08:15:00

bool midday = new TimeOnly(12, 0).IsBetween(start, end);
Console.WriteLine(\`Midday in range: \${midday}\`);`,
    explanation: "`TimeOnly` subtraction returns a `TimeSpan`. `IsBetween` handles overnight ranges (start > end) correctly, unlike manual comparison."
  },
  {
    id: "cs-b15-b4-flags-enum-operations",
    language: "csharp",
    title: "Flags enum bit operations",
    tag: "snippet",
    code: `[Flags]
enum Access { None = 0, Read = 1, Write = 2, Execute = 4 }

var perm = Access.Read | Access.Write;
perm |= Access.Execute;        // add
perm &= ~Access.Write;         // remove
bool canExec = perm.HasFlag(Access.Execute);

Console.WriteLine(perm);       // Read, Execute
Console.WriteLine(canExec);    // True`,
    explanation: "`|=` adds a flag; `&= ~flag` removes it. `HasFlag` checks presence. `[Flags]` makes `ToString()` emit named combinations instead of raw numbers."
  },
  {
    id: "cs-b15-b4-observable-property-changed",
    language: "csharp",
    title: "INotifyPropertyChanged with ObservableCollection",
    tag: "snippet",
    code: `using System.ComponentModel;
using System.Collections.ObjectModel;

class ViewModel : INotifyPropertyChanged
{
    public event PropertyChangedEventHandler? PropertyChanged;
    private string _title = "";

    public string Title
    {
        get => _title;
        set { _title = value; PropertyChanged?.Invoke(this, new(nameof(Title))); }
    }

    public ObservableCollection<string> Items { get; } = new();
}`,
    explanation: "`INotifyPropertyChanged` enables data binding to scalar properties. `ObservableCollection<T>` handles collection change notification — both are WPF/MAUI binding fundamentals."
  },
  {
    id: "cs-b15-b4-concurrent-bag",
    language: "csharp",
    title: "ConcurrentBag<T> for unordered parallel results",
    tag: "structures",
    code: `using System.Collections.Concurrent;

var bag = new ConcurrentBag<int>();

Parallel.For(0, 100, i => bag.Add(i * i));

Console.WriteLine(\`Count: \${bag.Count}\`);
Console.WriteLine(\`Sum: \${bag.Sum()}\`);`,
    explanation: "`ConcurrentBag<T>` is optimized for scenarios where each thread adds items it later consumes — it uses thread-local storage to minimize contention."
  },
  {
    id: "cs-b15-b4-sorted-dict",
    language: "csharp",
    title: "SortedDictionary for ordered iteration",
    tag: "structures",
    code: `var inventory = new SortedDictionary<string, int>
{
    ["banana"] = 30,
    ["apple"] = 50,
    ["cherry"] = 15,
};

foreach (var (item, count) in inventory)
    Console.WriteLine(\`\${item}: \${count}\`);
// apple: 50, banana: 30, cherry: 15`,
    explanation: "`SortedDictionary` uses a red-black tree — O(log n) for insert/lookup/delete, always iterates in key order. Prefer over `SortedList` when frequent modifications occur."
  },
  {
    id: "cs-b15-b4-memory-marshal-read",
    language: "csharp",
    title: "MemoryMarshal.Read for struct overlaying",
    tag: "snippet",
    code: `using System.Runtime.InteropServices;

[StructLayout(LayoutKind.Sequential, Pack = 1)]
struct Header { public ushort Magic; public uint Length; }

byte[] data = [0xFE, 0xCA, 0x10, 0x00, 0x00, 0x00];
ref readonly Header h = ref MemoryMarshal.AsRef<Header>(data.AsSpan());

Console.WriteLine(h.Magic.ToString("X4"));   // CAFE (little-endian)
Console.WriteLine(h.Length);                  // 16`,
    explanation: "`MemoryMarshal.AsRef<T>` overlays a struct directly on a byte span — zero-copy parsing of binary headers without unsafe code."
  },
  {
    id: "cs-b15-b4-raw-string-json",
    language: "csharp",
    title: "Raw string literals for JSON templates",
    tag: "snippet",
    code: `string BuildPayload(string name, int score) => \$"""
    {
        "player": "\${name}",
        "score": \${score},
        "timestamp": "\${DateTime.UtcNow:O}"
    }
    """;

Console.WriteLine(BuildPayload("Alice", 9500));`,
    explanation: "Interpolated raw string literals combine `$` with `\"\"\"`. No escaping needed for `{` inside JSON — only `${expr}` triggers interpolation."
  },
  {
    id: "cs-b15-b4-pattern-combined",
    language: "csharp",
    title: "Combined pattern with and/or/not",
    tag: "snippet",
    code: `bool IsValidAge(object? age) => age is int n and (>= 0 and <= 150);
bool IsText(object? v) => v is string or char[];
bool IsNonEmptyString(object? v) => v is string { Length: > 0 };

Console.WriteLine(IsValidAge(25));    // True
Console.WriteLine(IsValidAge(-1));    // False
Console.WriteLine(IsNonEmptyString("hello")); // True`,
    explanation: "Logical `and`/`or`/`not` operators compose patterns. Property patterns inline (`{ Length: > 0 }`) check properties without separate variables."
  },
  {
    id: "cs-b15-b4-record-clone",
    language: "csharp",
    title: "Record clone and mutation via inheritance",
    tag: "snippet",
    code: `record BaseConfig(string Host, int Port);
record TlsConfig(string Host, int Port, string CertPath)
    : BaseConfig(Host, Port);

var plain = new BaseConfig("localhost", 8080);
var tls = new TlsConfig(plain.Host, plain.Port, "/certs/server.pem");
var updated = tls with { Host = "prod.example.com" };
Console.WriteLine(updated);`,
    explanation: "Records support inheritance with positional parameters. `with` on a derived record copies all properties including inherited ones."
  },
  {
    id: "cs-b15-b4-allows-ref-struct-generic",
    language: "csharp",
    title: "Span<T> in generic method with allows ref struct",
    tag: "types",
    code: `// .NET 9 / C# 13
static int SumAll<T>(T items)
    where T : allows ref struct, IEnumerable<int>
{
    int total = 0;
    foreach (var n in items)
        total += n;
    return total;
}

int[] arr = [1, 2, 3, 4, 5];
Console.WriteLine(SumAll(arr.AsSpan()));`,
    explanation: "`allows ref struct` lets `Span<T>` satisfy the generic constraint. Without it, the compiler rejects ref struct types from being type arguments."
  },
  {
    id: "cs-b15-b4-unsafe-span-interop",
    language: "csharp",
    title: "Unsafe interop with managed spans",
    tag: "snippet",
    code: `using System.Runtime.InteropServices;

unsafe void FillWithNative(Span<byte> buffer)
{
    fixed (byte* ptr = buffer)
    {
        for (int i = 0; i < buffer.Length; i++)
            ptr[i] = (byte)(i & 0xFF);
    }
}

Span<byte> buf = stackalloc byte[8];
FillWithNative(buf);
Console.WriteLine(string.Join(",", buf.ToArray()));`,
    explanation: "`fixed` on a `Span<byte>` pins the underlying memory for pointer arithmetic. The span correctly handles both stack-allocated and heap-allocated buffers."
  },
  {
    id: "cs-b15-b4-required-ctor-bypass",
    language: "csharp",
    title: "SetsRequiredMembers to bypass required check",
    tag: "snippet",
    code: `using System.Diagnostics.CodeAnalysis;

public class Entity
{
    public required string Id { get; init; }
    public required string Name { get; init; }

    [SetsRequiredMembers]
    public Entity(string id, string name)
    {
        Id = id;
        Name = name;
    }

    public Entity() { }  // used by deserializers
}

var e = new Entity("1", "Alice");`,
    explanation: "`[SetsRequiredMembers]` tells the compiler a constructor always sets required members, allowing deserialization-friendly parameterless constructors alongside the primary constructor."
  },
  {
    id: "cs-b15-b4-file-access-modifier",
    language: "csharp",
    title: "file modifier for implementation helpers",
    tag: "snippet",
    code: `// Parser.cs
file static class TokenHelpers
{
    public static bool IsKeyword(string token) =>
        token is "if" or "else" or "while" or "return";
}

public class Parser
{
    public bool IsReserved(string token) =>
        TokenHelpers.IsKeyword(token);
}`,
    explanation: "`file` types don't leak into other files — no risk of naming conflicts with similarly-named helpers in other files. Ideal for source-generator output."
  },
  {
    id: "cs-b15-b4-generic-math-sqrt",
    language: "csharp",
    title: "Generic math with IRootFunctions",
    tag: "types",
    code: `using System.Numerics;

T Hypotenuse<T>(T a, T b)
    where T : IFloatingPoint<T>, IRootFunctions<T>
{
    return T.Sqrt(a * a + b * b);
}

Console.WriteLine(Hypotenuse(3.0, 4.0));    // 5
Console.WriteLine(Hypotenuse(3.0f, 4.0f));  // 5`,
    explanation: "`IRootFunctions<T>` provides `T.Sqrt` as a static abstract interface member — combining with `IFloatingPoint<T>` enables fully generic floating-point math."
  },
  {
    id: "cs-b15-b4-static-abstract-parse",
    language: "csharp",
    title: "IParsable<T> static abstract interface",
    tag: "types",
    code: `using System;

T ParseValue<T>(string s) where T : IParsable<T>
{
    return T.Parse(s, null);
}

int n = ParseValue<int>("42");
double d = ParseValue<double>("3.14");
DateTime dt = ParseValue<DateTime>("2026-05-15");

Console.WriteLine(n);  // 42`,
    explanation: "`IParsable<T>` exposes `T.Parse` as a static abstract member (.NET 7+). Generic methods can now call `Parse` without knowing the concrete type."
  },
  {
    id: "cs-b15-b4-caller-argument-expr",
    language: "csharp",
    title: "CallerArgumentExpression for rich assertions",
    tag: "snippet",
    code: `using System.Runtime.CompilerServices;

static void Require(
    bool condition,
    [CallerArgumentExpression(nameof(condition))] string expr = "")
{
    if (!condition)
        throw new ArgumentException(\`Assertion failed: \${expr}\`);
}

int value = -5;
Require(value > 0);
// throws: Assertion failed: value > 0`,
    explanation: "`CallerArgumentExpression` captures the source text of a parameter expression — enabling assertion libraries to show the exact failing expression."
  },
  {
    id: "cs-b15-b4-var-pattern-when",
    language: "csharp",
    title: "var pattern combined with complex when guards",
    tag: "snippet",
    code: `string Classify(object obj) => obj switch
{
    var x when x is int n && n > 0 => \`positive int \${n}\`,
    var x when x is string s && s.Length > 5 => \`long string "\${s}"\`,
    null => "null",
    _ => \`other: \${obj}\`,
};

Console.WriteLine(Classify(42));
Console.WriteLine(Classify("hello world"));`,
    explanation: "`var` captures the value; the `when` clause applies additional logic. This pattern is useful when you need the variable in the guard before narrowing its type."
  },
  {
    id: "cs-b15-b4-frozen-set",
    language: "csharp",
    title: "FrozenSet for high-performance membership tests",
    tag: "structures",
    code: `using System.Collections.Frozen;

FrozenSet<string> keywords = new HashSet<string>
{
    "if", "else", "while", "for", "return", "class", "new"
}.ToFrozenSet();

bool IsKeyword(string token) => keywords.Contains(token);

Console.WriteLine(IsKeyword("while"));  // True
Console.WriteLine(IsKeyword("hello"));  // False`,
    explanation: "`FrozenSet<T>` builds a perfect-hash structure at construction time. `Contains` is faster than `HashSet<T>` for read-only membership lookups in hot paths."
  },
  {
    id: "cs-b15-b4-task-when-all-typed",
    language: "csharp",
    title: "Task.WhenAll with typed result tuple",
    tag: "snippet",
    code: `async Task<(int Count, decimal Total)> GetStatsAsync()
{
    var countTask = Task.FromResult(42);
    var totalTask = Task.FromResult(1234.56m);

    await Task.WhenAll(countTask, totalTask);
    return (countTask.Result, totalTask.Result);
}

var (count, total) = await GetStatsAsync();
Console.WriteLine(\`\${count} items totaling \${total:C}\`);`,
    explanation: "After `WhenAll`, accessing `.Result` on completed tasks is safe and synchronous. Returning a tuple avoids an extra class for multi-valued async results."
  },
  {
    id: "cs-b15-b4-partial-class-gen",
    language: "csharp",
    title: "Partial class with source-generated implementation",
    tag: "snippet",
    code: `// User-written:
public partial class Config
{
    public partial string GetConnectionString(string name);
}

// Source-generator output:
public partial class Config
{
    private readonly Dictionary<string, string> _connections = new();
    public partial string GetConnectionString(string name) =>
        _connections.TryGetValue(name, out var cs)
            ? cs
            : throw new KeyNotFoundException(name);
}`,
    explanation: "Partial methods with implementations (C# 9+) allow source generators to provide the full body while user code declares the signature — enabling IDE-friendly generation."
  },
  {
    id: "cs-b15-b4-params-span",
    language: "csharp",
    title: "params ReadOnlySpan<T> for zero-alloc varargs",
    tag: "snippet",
    code: `static int Sum(params ReadOnlySpan<int> values)
{
    int total = 0;
    foreach (var v in values)
        total += v;
    return total;
}

Console.WriteLine(Sum(1, 2, 3, 4, 5));   // 15
Console.WriteLine(Sum([6, 7, 8]));         // 21`,
    explanation: "`params ReadOnlySpan<T>` (C# 13) avoids array allocation for `params` arguments — the compiler uses `stackalloc` for small counts when possible."
  },
  {
    id: "cs-b15-b4-utf8-formatting",
    language: "csharp",
    title: "UTF-8 formatted strings",
    tag: "snippet",
    code: `using System.Text;

static byte[] BuildResponse(string status, int code)
{
    Span<byte> buf = stackalloc byte[256];
    int written = Encoding.UTF8.GetBytes(
        \$"HTTP/1.1 \${code} \${status}\\r\\n"u8.Length > 0
            ? \$"HTTP/1.1 \${code} \${status}\\r\\n"
            : "",
        buf);
    return buf[..written].ToArray();
}

var resp = BuildResponse("OK", 200);
Console.WriteLine(Encoding.UTF8.GetString(resp));`,
    explanation: "Combining `stackalloc` span with `Encoding.UTF8.GetBytes` produces UTF-8 bytes without heap allocation — suitable for high-frequency protocol encoding."
  },
  {
    id: "cs-b15-b4-exception-expression",
    language: "csharp",
    title: "Throw expressions in null coalescing",
    tag: "snippet",
    code: `string? GetConfig(string key) => null;

string host = GetConfig("host")
    ?? throw new InvalidOperationException("host not configured");

int port = int.TryParse(GetConfig("port"), out var p)
    ? p
    : throw new FormatException("port must be a number");`,
    explanation: "Throw expressions (C# 7+) enable throwing directly in expression contexts — null-coalescing, ternary, and expression-bodied members — without extra `if` blocks."
  },
  {
    id: "cs-b15-b4-global-using-alias",
    language: "csharp",
    title: "Global using with alias for type shortcuts",
    tag: "snippet",
    code: `// In GlobalUsings.cs:
global using Json = System.Text.Json.JsonSerializer;
global using CT = System.Threading.CancellationToken;

// In any file:
class DataService
{
    public string Serialize<T>(T obj) =>
        Json.Serialize(obj);

    public async Task FetchAsync(CT ct)
    {
        await Task.Delay(100, ct);
    }
}`,
    explanation: "Global using aliases (C# 10) make verbose type names available as short aliases across the project without polluting each file with repeated using directives."
  },
  {
    id: "cs-b15-b4-struct-default",
    language: "csharp",
    title: "Struct default value safety",
    tag: "snippet",
    code: `struct Connection
{
    public string Host;
    public int Port;
    public bool IsConnected;

    public bool IsValid => Host is { Length: > 0 } && Port > 0;
}

Connection c = default;
Console.WriteLine(c.Host is null);      // True
Console.WriteLine(c.IsValid);           // False
Console.WriteLine(c.Port);              // 0`,
    explanation: "The `default` value of a struct has all fields zeroed/null. Defensive properties like `IsValid` protect against accidental use of uninitialized structs."
  },
  {
    id: "cs-b15-b4-interface-covariant",
    language: "csharp",
    title: "Covariant interface with out type parameter",
    tag: "types",
    code: `interface IProducer<out T>
{
    T Produce();
    IEnumerable<T> ProduceMany(int count);
}

class AnimalProducer : IProducer<Dog>
{
    public Dog Produce() => new();
    public IEnumerable<Dog> ProduceMany(int n) =>
        Enumerable.Range(0, n).Select(_ => new Dog());
}

IProducer<Animal> producer = new AnimalProducer();

class Animal { }
class Dog : Animal { }`,
    explanation: "The `out` variance annotation allows `IProducer<Dog>` to be assigned to `IProducer<Animal>` — safe because producers only return (never accept) `T`."
  },
  {
    id: "cs-b15-b4-contravariant-interface",
    language: "csharp",
    title: "Contravariant interface with in type parameter",
    tag: "types",
    code: `interface IConsumer<in T>
{
    void Consume(T item);
}

class AnimalConsumer : IConsumer<Animal>
{
    public void Consume(Animal a) => Console.WriteLine(a.GetType().Name);
}

IConsumer<Dog> dogConsumer = new AnimalConsumer();
dogConsumer.Consume(new Dog());

class Animal { }
class Dog : Animal { }`,
    explanation: "The `in` variance annotation allows `IConsumer<Animal>` to be used as `IConsumer<Dog>` — safe because consumers only accept (never return) `T`."
  },
  {
    id: "cs-b15-b4-linq-to-dictionary",
    language: "csharp",
    title: "LINQ ToDictionary and ToLookup",
    tag: "snippet",
    code: `record Product(string Name, string Category, decimal Price);

var products = new[]
{
    new Product("Apple", "Fruit", 0.5m),
    new Product("Banana", "Fruit", 0.3m),
    new Product("Carrot", "Veg", 0.2m),
};

var byName = products.ToDictionary(p => p.Name);
var byCategory = products.ToLookup(p => p.Category);

foreach (var item in byCategory["Fruit"])
    Console.WriteLine(item.Name);`,
    explanation: "`ToDictionary` requires unique keys and throws on duplicates. `ToLookup` groups by key allowing multiple values per key — like a `Dictionary<K, IEnumerable<V>>`."
  },
  {
    id: "cs-b15-b4-linq-selectmany",
    language: "csharp",
    title: "LINQ SelectMany for flattening",
    tag: "snippet",
    code: `record Order(string Customer, List<string> Items);

var orders = new[]
{
    new Order("Alice", ["Book", "Pen"]),
    new Order("Bob", ["Laptop", "Mouse", "Keyboard"]),
};

var allItems = orders.SelectMany(o => o.Items).ToList();
Console.WriteLine(string.Join(", ", allItems));

var withCustomer = orders.SelectMany(
    o => o.Items,
    (o, item) => (o.Customer, item));`,
    explanation: "`SelectMany` flattens one level of nesting. The two-parameter overload provides both the source element and each sub-element, useful for cross-reference joins."
  },
  {
    id: "cs-b15-b4-string-intern",
    language: "csharp",
    title: "String.Intern for memory deduplication",
    tag: "snippet",
    code: `string a = new string(new[] { 'h', 'e', 'l', 'l', 'o' });
string b = new string(new[] { 'h', 'e', 'l', 'l', 'o' });

Console.WriteLine(ReferenceEquals(a, b));  // False

string ia = string.Intern(a);
string ib = string.Intern(b);
Console.WriteLine(ReferenceEquals(ia, ib));  // True`,
    explanation: "`String.Intern` returns the pool reference for the string — two interned strings with equal content share the same object, reducing memory for repeated string values."
  },
  {
    id: "cs-b15-b4-object-initializer-record",
    language: "csharp",
    title: "Object initializers vs record constructors",
    tag: "snippet",
    code: `// Record with positional constructor:
record Vector3(double X, double Y, double Z);

// Record with init-only properties:
record class Config
{
    public double X { get; init; }
    public double Y { get; init; }
    public double Z { get; init; }
}

var v = new Vector3(1, 2, 3);
var c = new Config { X = 1, Y = 2, Z = 3 };
Console.WriteLine(v.X == c.X);  // True`,
    explanation: "Positional records use constructor syntax; init-property records use object initializers. Choose based on whether named arguments or positional clarity matters more."
  },
  {
    id: "cs-b15-b4-linq-except-intersect",
    language: "csharp",
    title: "LINQ set operations: Except and Intersect",
    tag: "snippet",
    code: `int[] all = [1, 2, 3, 4, 5, 6];
int[] evens = [2, 4, 6];

var odds = all.Except(evens).ToList();
var even2 = all.Intersect(evens).ToList();
var union = odds.Union(evens).Order().ToList();

Console.WriteLine(string.Join(",", odds));   // 1,3,5
Console.WriteLine(string.Join(",", even2));  // 2,4,6`,
    explanation: "`Except`, `Intersect`, and `Union` use `GetHashCode`/`Equals` for comparison by default. Pass a custom `IEqualityComparer<T>` to override."
  },
  {
    id: "cs-b15-b4-async-retry",
    language: "csharp",
    title: "Async retry with exponential backoff",
    tag: "snippet",
    code: `async Task<T> RetryAsync<T>(
    Func<Task<T>> op, int maxRetries = 3,
    CancellationToken ct = default)
{
    for (int attempt = 0; attempt < maxRetries; attempt++)
    {
        try { return await op(); }
        catch when (attempt < maxRetries - 1)
        {
            int delay = (int)(100 * Math.Pow(2, attempt));
            await Task.Delay(delay, ct);
        }
    }
    return await op();
}`,
    explanation: "Exponential backoff doubles the delay each retry. The `catch when` guard re-runs the final attempt without swallowing its exception."
  },
  {
    id: "cs-b15-b4-span-parse",
    language: "csharp",
    title: "Parsing from ReadOnlySpan<char>",
    tag: "snippet",
    code: `ReadOnlySpan<char> input = "42 3.14 true";
int pos = 0;

ReadOnlySpan<char> Next(ref ReadOnlySpan<char> s)
{
    int space = s.IndexOf(' ');
    if (space < 0) { var r = s; s = default; return r; }
    var token = s[..space];
    s = s[(space + 1)..];
    return token;
}

int n = int.Parse(Next(ref input));
double d = double.Parse(Next(ref input));
bool b = bool.Parse(Next(ref input));
Console.WriteLine(\$"\${n} \${d} \${b}\`);`,
    explanation: "Overloads of `int.Parse`, `double.Parse`, etc. accept `ReadOnlySpan<char>` directly — no `ToString()` needed, eliminating temporary string allocations."
  },
  {
    id: "cs-b15-b4-interface-static-const",
    language: "csharp",
    title: "Interface with static constants and helpers",
    tag: "types",
    code: `interface IStatusCode
{
    static readonly int Success = 0;
    static readonly int Failure = 1;

    static string Describe(int code) => code switch
    {
        0 => "Success",
        1 => "Failure",
        _ => \`Unknown (\${code})\`,
    };
}

Console.WriteLine(IStatusCode.Describe(IStatusCode.Success));`,
    explanation: "Interfaces can hold static fields and methods (C# 8+). Static interface members are accessed through the interface name, not through instances."
  },
  {
    id: "cs-b15-b4-generic-create",
    language: "csharp",
    title: "Generic factory with IFactory static abstract",
    tag: "types",
    code: `interface IFactory<TSelf> where TSelf : IFactory<TSelf>
{
    static abstract TSelf Create();
}

class Point : IFactory<Point>
{
    public float X, Y;
    public static Point Create() => new() { X = 0, Y = 0 };
}

T Make<T>() where T : IFactory<T> => T.Create();
var p = Make<Point>();`,
    explanation: "CRTP + static abstract interface member lets `Make<T>` call a per-type static factory without reflection — resolved entirely at compile time."
  },
  {
    id: "cs-b15-b4-using-declaration",
    language: "csharp",
    title: "using declaration without extra braces",
    tag: "snippet",
    code: `async Task ProcessFileAsync(string path)
{
    using var file = File.OpenRead(path);
    using var reader = new StreamReader(file);

    string? line;
    while ((line = await reader.ReadLineAsync()) != null)
        Console.WriteLine(line.ToUpper());
}  // file and reader disposed here`,
    explanation: "`using var` (C# 8) disposes at the end of the enclosing scope without nested braces, keeping indentation flat for multiple disposables."
  },
  {
    id: "cs-b15-b4-expression-tree-build",
    language: "csharp",
    title: "Building expression trees at runtime",
    tag: "snippet",
    code: `using System.Linq.Expressions;

Expression<Func<int, bool>> BuildGreaterThan(int threshold)
{
    var param = Expression.Parameter(typeof(int), "n");
    var body = Expression.GreaterThan(
        param,
        Expression.Constant(threshold));
    return Expression.Lambda<Func<int, bool>>(body, param);
}

var isPositive = BuildGreaterThan(0).Compile();
Console.WriteLine(isPositive(5));   // True
Console.WriteLine(isPositive(-1));  // False`,
    explanation: "Expression trees represent code as data, allowing ORM frameworks to translate LINQ queries to SQL. `Compile()` JIT-compiles the expression for direct execution."
  },
  {
    id: "cs-b15-b4-lazy-init",
    language: "csharp",
    title: "Lazy<T> for thread-safe lazy initialization",
    tag: "snippet",
    code: `class ExpensiveService
{
    private readonly Lazy<DatabaseConnection> _db =
        new(() => new DatabaseConnection(), isThreadSafe: true);

    public DatabaseConnection Db => _db.Value;
}

class DatabaseConnection
{
    public DatabaseConnection() => Console.WriteLine("Connected");
}

var svc = new ExpensiveService();
Console.WriteLine("Service created");
_ = svc.Db;  // "Connected" printed here`,
    explanation: "`Lazy<T>` defers initialization until first access. `isThreadSafe: true` uses double-checked locking internally — safe for multiple concurrent accesses."
  },
  {
    id: "cs-b15-b4-weak-reference",
    language: "csharp",
    title: "WeakReference<T> for cache-friendly references",
    tag: "snippet",
    code: `class Cache<TKey, TValue> where TValue : class
{
    private readonly Dictionary<TKey, WeakReference<TValue>> _store = new();

    public void Put(TKey key, TValue value) =>
        _store[key!] = new WeakReference<TValue>(value);

    public TValue? Get(TKey key)
    {
        if (_store.TryGetValue(key!, out var wr) &&
            wr.TryGetTarget(out var val))
            return val;
        _store.Remove(key!);
        return null;
    }
}`,
    explanation: "`WeakReference<T>` doesn't prevent GC collection. `TryGetTarget` returns false if the object was collected — enabling caches that yield memory under pressure."
  },
  {
    id: "cs-b15-b4-result-type",
    language: "csharp",
    title: "Result<T,E> for railway-oriented programming",
    tag: "structures",
    code: `readonly record struct Result<T, E>
{
    private readonly T? _value;
    private readonly E? _error;
    public bool IsOk { get; }

    private Result(T v) { _value = v; IsOk = true; }
    private Result(E e) { _error = e; IsOk = false; }

    public static Result<T, E> Ok(T v) => new(v);
    public static Result<T, E> Fail(E e) => new(e);

    public Result<U, E> Map<U>(Func<T, U> f) =>
        IsOk ? Result<U, E>.Ok(f(_value!)) : Result<U, E>.Fail(_error!);
}`,
    explanation: "`Result<T,E>` encodes success or failure without exceptions. `Map` chains transformations that only run on success — the functional alternative to try/catch."
  },
  {
    id: "cs-b15-b4-dispatch-table",
    language: "csharp",
    title: "Dispatch table replacing large switch",
    tag: "snippet",
    code: `static readonly Dictionary<string, Func<int, int>> Ops = new()
{
    ["double"]  = x => x * 2,
    ["square"]  = x => x * x,
    ["negate"]  = x => -x,
    ["abs"]     = Math.Abs,
};

int Apply(string op, int value) =>
    Ops.TryGetValue(op, out var fn)
        ? fn(value)
        : throw new ArgumentException(\`Unknown op: \${op}\`);

Console.WriteLine(Apply("square", 7));  // 49`,
    explanation: "A dispatch table replaces O(n) switch statements with O(1) dictionary lookup. The static `readonly` initializer runs once; delegates avoid reflection overhead."
  },
  {
    id: "cs-b15-b4-cancellation-linked",
    language: "csharp",
    title: "Linked CancellationTokenSource",
    tag: "snippet",
    code: `using System.Threading;

async Task HandleRequest(CancellationToken requestToken)
{
    using var timeout = new CancellationTokenSource(TimeSpan.FromSeconds(10));
    using var linked = CancellationTokenSource.CreateLinkedTokenSource(
        requestToken, timeout.Token);

    try
    {
        await DoWorkAsync(linked.Token);
    }
    catch (OperationCanceledException)
    {
        bool timedOut = timeout.IsCancellationRequested;
        Console.WriteLine(timedOut ? "Timeout" : "Cancelled");
    }
}

static Task DoWorkAsync(CancellationToken ct) => Task.Delay(30_000, ct);`,
    explanation: "`CreateLinkedTokenSource` fires when either token fires — the linked token combines a per-request timeout with the caller's cancellation signal."
  },
  {
    id: "cs-b15-b4-span-writer",
    language: "csharp",
    title: "IBufferWriter<byte> for incremental writes",
    tag: "snippet",
    code: `using System.Buffers;
using System.Text;

class PooledWriter : IBufferWriter<byte>
{
    private byte[] _buf = ArrayPool<byte>.Shared.Rent(256);
    private int _pos;

    public void Advance(int count) => _pos += count;
    public Memory<byte> GetMemory(int hint = 0) =>
        _buf.AsMemory(_pos);
    public Span<byte> GetSpan(int hint = 0) =>
        _buf.AsSpan(_pos);

    public string AsString() =>
        Encoding.UTF8.GetString(_buf, 0, _pos);
}`,
    explanation: "`IBufferWriter<T>` is the standard interface for incremental write destinations. Libraries like `Utf8JsonWriter` accept it to write without intermediate allocations."
  },
  {
    id: "cs-b15-b4-record-interface",
    language: "csharp",
    title: "Record implementing interface",
    tag: "snippet",
    code: `interface IIdentifiable { string Id { get; } }
interface ITimestamped { DateTime CreatedAt { get; } }

record Event(string Id, string Type, DateTime CreatedAt)
    : IIdentifiable, ITimestamped;

void Process(IIdentifiable item) =>
    Console.WriteLine(\`Processing \${item.Id}\`);

var e = new Event("evt-1", "click", DateTime.UtcNow);
Process(e);`,
    explanation: "Records implement interfaces naturally. The positional properties satisfy the interface requirements — no extra boilerplate for the implementations."
  },
  {
    id: "cs-b15-b4-minimal-api-group",
    language: "csharp",
    title: "Minimal API route groups",
    tag: "snippet",
    code: `// In Program.cs (ASP.NET Core 7+)
// var app = WebApplication.Create();

// var api = app.MapGroup("/api/v1").RequireAuthorization();
// var users = api.MapGroup("/users");

// users.MapGet("/{id:int}", (int id) => \`User \${id}\`);
// users.MapPost("/", (UserDto dto) => Results.Created(\$"/users/1\`, dto));
// users.MapDelete("/{id:int}", (int id) => Results.NoContent());

// Placeholder to compile:
record UserDto(string Name);
Console.WriteLine("Routes registered");`,
    explanation: "`MapGroup` shares prefixes and middleware (auth, rate limiting) across multiple endpoints. The fluent API avoids repeating the prefix on every `Map*` call."
  },
  {
    id: "cs-b15-b4-record-with-array",
    language: "csharp",
    title: "Record with array: shallow copy caveat",
    tag: "caveats",
    code: `record Snapshot(string Name, int[] Scores);

var s1 = new Snapshot("Alice", [90, 85, 92]);
var s2 = s1 with { Name = "Copy" };

s2.Scores[0] = 0;
Console.WriteLine(s1.Scores[0]);  // 0 — shared reference!`,
    explanation: "`with` performs a **shallow** copy. Arrays inside records are shared between the original and the copy. Use `s1 with { Scores = [..s1.Scores] }` to avoid aliasing."
  },
  {
    id: "cs-b15-b4-covariant-return",
    language: "csharp",
    title: "Covariant return types in overrides",
    tag: "snippet",
    code: `class Animal
{
    public virtual Animal Create() => new Animal();
}

class Dog : Animal
{
    public override Dog Create() => new Dog();
}

Animal a = new Dog();
Animal created = a.Create();
Console.WriteLine(created.GetType().Name);  // Dog`,
    explanation: "Covariant return types (C# 9+) allow overrides to return a more derived type. The virtual dispatch still works polymorphically — `a.Create()` returns a `Dog`."
  },
  {
    id: "cs-b15-b4-switch-arm-when",
    language: "csharp",
    title: "Switch expression with when guards",
    tag: "snippet",
    code: `decimal Discount(string customer, decimal amount) =>
    (customer, amount) switch
    {
        ("vip", > 1000m) => 0.20m,
        ("vip", _) => 0.10m,
        (_, > 500m) => 0.05m,
        _ => 0m,
    };

Console.WriteLine(Discount("vip", 1500m));   // 0.20
Console.WriteLine(Discount("regular", 600m)); // 0.05`,
    explanation: "Tuple patterns in switch expressions enable multi-variable dispatch. Arms are evaluated top-to-bottom — place the most specific cases first."
  },
];
