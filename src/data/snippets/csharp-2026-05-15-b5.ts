import type { Snippet } from "./types";

export const csharpSnippets20260515B5: Snippet[] = [
  {
    id: "cs-b15-b5-span-compare",
    language: "csharp",
    title: "MemoryExtensions.SequenceEqual for span comparison",
    tag: "snippet",
    code: `ReadOnlySpan<byte> a = [1, 2, 3, 4, 5];
ReadOnlySpan<byte> b = [1, 2, 3, 4, 5];
ReadOnlySpan<byte> c = [1, 2, 3, 4, 6];

Console.WriteLine(a.SequenceEqual(b));  // True
Console.WriteLine(a.SequenceEqual(c));  // False`,
    explanation: "`SequenceEqual` compares spans element-by-element without allocation. On modern hardware with AVX2, it's vectorized to compare 32 bytes at a time."
  },
  {
    id: "cs-b15-b5-record-copy-ctor",
    language: "csharp",
    title: "Record copy constructor customization",
    tag: "snippet",
    code: `record Config(string Host, int Port, List<string> Tags)
{
    protected Config(Config original) : this(
        original.Host,
        original.Port,
        new List<string>(original.Tags))  // deep copy
    { }
}

var c1 = new Config("localhost", 8080, ["debug"]);
var c2 = c1 with { Host = "prod.example.com" };
c2.Tags.Add("production");

Console.WriteLine(c1.Tags.Count);  // 1 — not affected`,
    explanation: "Defining the protected copy constructor in a record lets you control how `with` copies complex properties — replacing the shallow copy with a deep one."
  },
  {
    id: "cs-b15-b5-primary-ctor-guard",
    language: "csharp",
    title: "Primary constructor with guard clauses",
    tag: "snippet",
    code: `public class Connection(string host, int port)
{
    private readonly string _host = string.IsNullOrEmpty(host)
        ? throw new ArgumentException("host required", nameof(host))
        : host;

    private readonly int _port = port is >= 1 and <= 65535
        ? port
        : throw new ArgumentOutOfRangeException(nameof(port));

    public override string ToString() => \`\${_host}:\${_port}\`;
}`,
    explanation: "Field initializers in primary constructors can use conditional expressions to validate and throw, combining initialization and validation in one expression."
  },
  {
    id: "cs-b15-b5-collection-expr-interface",
    language: "csharp",
    title: "Collection expression for ImmutableArray",
    tag: "snippet",
    code: `using System.Collections.Immutable;

ImmutableArray<int> primes = [2, 3, 5, 7, 11, 13, 17];
ImmutableList<string> names = ["Alice", "Bob", "Carol"];
ImmutableHashSet<string> tags = ["csharp", "dotnet", "api"];

Console.WriteLine(primes.Length);     // 7
Console.WriteLine(names.Count);       // 3
Console.WriteLine(tags.Contains("api")); // True`,
    explanation: "Collection expressions work with immutable collection types from `System.Collections.Immutable`. The compiler selects the appropriate factory method for each target type."
  },
  {
    id: "cs-b15-b5-span-base64",
    language: "csharp",
    title: "Convert.TryToBase64Chars for span-based encoding",
    tag: "snippet",
    code: `byte[] data = [0xDE, 0xAD, 0xBE, 0xEF, 0xCA, 0xFE];
Span<char> dest = stackalloc char[12];

bool ok = Convert.TryToBase64Chars(data, dest, out int written);
Console.WriteLine(new string(dest[..written]));  // 3q2+78r+`,
    explanation: "`TryToBase64Chars` encodes directly into a `Span<char>`, avoiding a `string` allocation for the intermediate base64 representation."
  },
  {
    id: "cs-b15-b5-memory-sequence",
    language: "csharp",
    title: "SequenceReader<T> for parsing binary data",
    tag: "snippet",
    code: `using System.Buffers;

static bool TryReadHeader(ReadOnlySequence<byte> seq,
    out ushort magic, out uint length)
{
    magic = 0; length = 0;
    var reader = new SequenceReader<byte>(seq);
    if (!reader.TryReadLittleEndian(out magic)) return false;
    if (!reader.TryReadLittleEndian(out length)) return false;
    return true;
}`,
    explanation: "`SequenceReader<T>` reads structured data from a `ReadOnlySequence<T>` — the standard API for System.IO.Pipelines consumers that span multiple memory segments."
  },
  {
    id: "cs-b15-b5-channel-transform",
    language: "csharp",
    title: "Channel pipeline: transform stage",
    tag: "snippet",
    code: `using System.Threading.Channels;

async Task TransformStage<T, U>(
    ChannelReader<T> input,
    ChannelWriter<U> output,
    Func<T, U> transform,
    CancellationToken ct)
{
    await foreach (var item in input.ReadAllAsync(ct))
        await output.WriteAsync(transform(item), ct);
    output.Complete();
}`,
    explanation: "Chaining channels with transform stages creates a typed pipeline. Each stage reads from the previous channel and writes to the next — separation of concerns with back-pressure."
  },
  {
    id: "cs-b15-b5-valuetask-iop",
    language: "csharp",
    title: "IValueTaskSource for pooled ValueTask",
    tag: "snippet",
    code: `using System.Threading.Tasks.Sources;

// High-performance pattern: reuse a ValueTask without allocation
// by implementing IValueTaskSource<T>. Used internally by:
// - Socket.ReceiveAsync
// - Stream.ReadAsync overloads
// - SocketsHttpHandler

// Example skeleton:
class ReusableOperation : IValueTaskSource<int>
{
    private ManualResetValueTaskSourceCore<int> _core;
    public ValueTask<int> RunAsync() => new(this, _core.Version);
    public int GetResult(short token) => _core.GetResult(token);
    public ValueTaskSourceStatus GetStatus(short token) => _core.GetStatus(token);
    public void OnCompleted(Action<object?> c, object? s, short t, ValueTaskSourceOnCompletedFlags f)
        => _core.OnCompleted(c, s, t, f);
}`,
    explanation: "`ManualResetValueTaskSourceCore<T>` implements `IValueTaskSource<T>` with reset support. The BCL uses this pattern for zero-allocation async I/O operations."
  },
  {
    id: "cs-b15-b5-parallel-plinq",
    language: "csharp",
    title: "PLINQ for parallel LINQ queries",
    tag: "snippet",
    code: `var squares = Enumerable.Range(1, 1_000_000)
    .AsParallel()
    .WithDegreeOfParallelism(4)
    .Where(n => n % 2 == 0)
    .Select(n => (long)(n * n))
    .Sum();

Console.WriteLine(squares);`,
    explanation: "`.AsParallel()` partitions the source and runs LINQ operators on multiple threads. `WithDegreeOfParallelism` caps CPU usage. Results are aggregated automatically."
  },
  {
    id: "cs-b15-b5-interlocked-lazy",
    language: "csharp",
    title: "Interlocked.CompareExchange for lazy singleton",
    tag: "snippet",
    code: `using System.Threading;

class Service
{
    private static Service? _instance;

    public static Service Instance
    {
        get
        {
            if (_instance != null) return _instance;
            var created = new Service();
            var prev = Interlocked.CompareExchange(
                ref _instance, created, null);
            return prev ?? created;
        }
    }
}`,
    explanation: "CAS-based lazy initialization creates the instance only once. If two threads race, one wins the CAS and the loser's instance is discarded — both see the winner's value."
  },
  {
    id: "cs-b15-b5-semaphore-timeout",
    language: "csharp",
    title: "SemaphoreSlim.WaitAsync with timeout",
    tag: "snippet",
    code: `using System.Threading;

var sem = new SemaphoreSlim(1, 1);

async Task<bool> TryAcquireAsync(TimeSpan timeout)
{
    if (!await sem.WaitAsync(timeout))
    {
        Console.WriteLine("Could not acquire lock within timeout");
        return false;
    }
    try { await Task.Delay(100); return true; }
    finally { sem.Release(); }
}`,
    explanation: "`WaitAsync(TimeSpan)` returns `false` instead of waiting indefinitely — preventing deadlocks in scenarios where the resource might be held for an unpredictable time."
  },
  {
    id: "cs-b15-b5-reader-writer-lock",
    language: "csharp",
    title: "ReaderWriterLockSlim for concurrent reads",
    tag: "snippet",
    code: `using System.Threading;

var rwLock = new ReaderWriterLockSlim();
var cache = new Dictionary<string, string>();

string Get(string key)
{
    rwLock.EnterReadLock();
    try { return cache.TryGetValue(key, out var v) ? v : ""; }
    finally { rwLock.ExitReadLock(); }
}

void Set(string key, string value)
{
    rwLock.EnterWriteLock();
    try { cache[key] = value; }
    finally { rwLock.ExitWriteLock(); }
}`,
    explanation: "`ReaderWriterLockSlim` allows concurrent reads but exclusive writes. Multiple readers proceed simultaneously; writers wait for all readers to release."
  },
  {
    id: "cs-b15-b5-generic-where-class",
    language: "csharp",
    title: "Multiple generic constraints on one type parameter",
    tag: "types",
    code: `interface IEntity { int Id { get; } }
interface IAuditable { DateTime CreatedAt { get; } }

T GetLatest<T>(IEnumerable<T> items)
    where T : class, IEntity, IAuditable, new()
{
    return items.OrderByDescending(i => i.CreatedAt).First();
}`,
    explanation: "Multiple `where` constraints are ANDed. `class` ensures reference type; `new()` allows instantiation; the interface constraints enforce structural requirements."
  },
  {
    id: "cs-b15-b5-dateonly-iso-week",
    language: "csharp",
    title: "ISO week number with DateOnly",
    tag: "snippet",
    code: `using System.Globalization;

DateOnly GetIsoWeek(DateOnly date, out int weekNumber)
{
    var cal = CultureInfo.InvariantCulture.Calendar;
    weekNumber = cal.GetWeekOfYear(
        date.ToDateTime(TimeOnly.MinValue),
        CalendarWeekRule.FirstFourDayWeek,
        DayOfWeek.Monday);

    // Start of that ISO week (Monday)
    int dayOfWeek = ((int)date.DayOfWeek + 6) % 7;
    return date.AddDays(-dayOfWeek);
}

var monday = GetIsoWeek(new DateOnly(2026, 5, 15), out int week);
Console.WriteLine(\`Week \${week}, starting \${monday}\`);`,
    explanation: "`CalendarWeekRule.FirstFourDayWeek` with `DayOfWeek.Monday` implements ISO 8601 week numbering. `DateOnly.ToDateTime` bridges to `Calendar` APIs that require `DateTime`."
  },
  {
    id: "cs-b15-b5-timeonly-parsing",
    language: "csharp",
    title: "TimeOnly TryParse with multiple formats",
    tag: "snippet",
    code: `string[] inputs = ["9:30 AM", "14:45", "23:59:59", "bad"];

foreach (var input in inputs)
{
    if (TimeOnly.TryParse(input, out var t))
        Console.WriteLine(\`\${input} → \${t:HH:mm:ss}\`);
    else
        Console.WriteLine(\`Invalid: \${input}\`);
}`,
    explanation: "`TimeOnly.TryParse` handles 12-hour (with AM/PM) and 24-hour formats. Returns `false` instead of throwing for invalid input — safe for user-supplied strings."
  },
  {
    id: "cs-b15-b5-flags-enum-iterate",
    language: "csharp",
    title: "Iterating set bits in a Flags enum",
    tag: "snippet",
    code: `[Flags]
enum Feature { None = 0, Auth = 1, Cache = 2, Logging = 4, Metrics = 8 }

IEnumerable<Feature> GetSetFlags(Feature flags) =>
    Enum.GetValues<Feature>()
        .Where(f => f != Feature.None && flags.HasFlag(f));

var enabled = Feature.Auth | Feature.Cache | Feature.Metrics;
foreach (var f in GetSetFlags(enabled))
    Console.WriteLine(f);`,
    explanation: "`Enum.GetValues<T>()` (generic, .NET 5+) returns all defined enum values. Filtering with `HasFlag` extracts only the set bits from the combined value."
  },
  {
    id: "cs-b15-b5-observable-binding",
    language: "csharp",
    title: "Two-way data binding pattern",
    tag: "snippet",
    code: `using System.ComponentModel;

class BindableBase : INotifyPropertyChanged
{
    public event PropertyChangedEventHandler? PropertyChanged;

    protected bool SetField<T>(ref T field, T value,
        [System.Runtime.CompilerServices.CallerMemberName] string? name = null)
    {
        if (EqualityComparer<T>.Default.Equals(field, value)) return false;
        field = value;
        PropertyChanged?.Invoke(this, new(name));
        return true;
    }
}

class ViewModel : BindableBase
{
    private string _name = "";
    public string Name { get => _name; set => SetField(ref _name, value); }
}`,
    explanation: "`SetField` with `CallerMemberName` eliminates the string literal in every setter. The equality check prevents unnecessary change notifications for the same value."
  },
  {
    id: "cs-b15-b5-concurrent-queue",
    language: "csharp",
    title: "ConcurrentQueue for FIFO work queues",
    tag: "structures",
    code: `using System.Collections.Concurrent;

var queue = new ConcurrentQueue<string>();

Parallel.For(0, 5, i => queue.Enqueue(\`item-\${i}\`));

while (queue.TryDequeue(out string? item))
    Console.WriteLine(\`Dequeued: \${item}\`);

Console.WriteLine(\`Remaining: \${queue.Count}\`);`,
    explanation: "`ConcurrentQueue<T>` is a lock-free FIFO queue. `TryDequeue` returns `false` when empty, so a `while` loop cleanly drains it without exception handling."
  },
  {
    id: "cs-b15-b5-memory-marshal-struct",
    language: "csharp",
    title: "MemoryMarshal.GetReference for unsafe span access",
    tag: "snippet",
    code: `using System.Runtime.InteropServices;

unsafe static void XorSpan(Span<byte> data, byte key)
{
    ref byte start = ref MemoryMarshal.GetReference(data);
    for (int i = 0; i < data.Length; i++)
        Unsafe.Add(ref start, i) ^= key;
}

byte[] buf = [1, 2, 3, 4];
XorSpan(buf, 0xFF);
Console.WriteLine(string.Join(",", buf));`,
    explanation: "`MemoryMarshal.GetReference` gets a reference to the first element without bounds checks. `Unsafe.Add` advances the ref by index — faster than `span[i]` in tight loops."
  },
  {
    id: "cs-b15-b5-raw-string-regex",
    language: "csharp",
    title: "Raw string literals for regex patterns",
    tag: "snippet",
    code: `using System.Text.RegularExpressions;

var emailRegex = new Regex("""
    ^
    (?<local>[\w.+-]+)
    @
    (?<domain>[\w-]+(\.[\w-]+)+)
    $
    """, RegexOptions.IgnorePatternWhitespace);

var m = emailRegex.Match("user@example.co.uk");
Console.WriteLine(m.Groups["local"]);   // user
Console.WriteLine(m.Groups["domain"]);  // example.co.uk`,
    explanation: "Raw string literals eliminate double-escaping in regex patterns — `\\w` stays as `\\w` instead of `\\\\w`. Combined with `IgnorePatternWhitespace`, patterns become self-documenting."
  },
  {
    id: "cs-b15-b5-pattern-extended-prop",
    language: "csharp",
    title: "Extended property pattern with nested access",
    tag: "snippet",
    code: `record Address(string City, string Country);
record Order(decimal Total, Address ShipTo);

bool IsDomesticLargeOrder(Order o) => o is
{
    Total: > 500m,
    ShipTo.Country: "US",
    ShipTo.City.Length: > 0,
};

var o = new Order(600m, new Address("NYC", "US"));
Console.WriteLine(IsDomesticLargeOrder(o));  // True`,
    explanation: "Extended property patterns use `.` for nested access — `ShipTo.Country` avoids an intermediate variable. Multiple conditions are ANDed within the `{ }` block."
  },
  {
    id: "cs-b15-b5-record-sealed-override",
    language: "csharp",
    title: "Sealing ToString in a record",
    tag: "snippet",
    code: `record Point(double X, double Y)
{
    public sealed override string ToString() =>
        \$"({X:F2}, {Y:F2})\`;
}

record Point3D(double X, double Y, double Z) : Point(X, Y)
{
    // Can't override ToString — it's sealed in Point
}

var p = new Point3D(1.5, 2.3, 4.1);
Console.WriteLine(p);  // (1.50, 2.30)`,
    explanation: "`sealed override` in a record prevents derived records from overriding again. Records generate a virtual `ToString` that `sealed` stops the chain."
  },
  {
    id: "cs-b15-b5-allows-ref-struct-span",
    language: "csharp",
    title: "Generic algorithm accepting Span or array",
    tag: "types",
    code: `// .NET 9 / C# 13
static T Max<T, TCollection>(TCollection items)
    where TCollection : allows ref struct, IEnumerable<T>
    where T : IComparable<T>
{
    T max = default!;
    bool first = true;
    foreach (var item in items)
    {
        if (first || item.CompareTo(max) > 0) { max = item; first = false; }
    }
    return max;
}

int[] arr = [3, 1, 4, 1, 5, 9, 2, 6];
Console.WriteLine(Max<int, Span<int>>(arr.AsSpan()));`,
    explanation: "`allows ref struct` enables `Span<T>` to satisfy the generic constraint alongside regular collections, unifying array-based and span-based code paths."
  },
  {
    id: "cs-b15-b5-stack-overflow-prevention",
    language: "csharp",
    title: "Iterative tree traversal to prevent stack overflow",
    tag: "snippet",
    code: `class TreeNode { public int Value; public TreeNode? Left, Right; }

IEnumerable<int> InOrder(TreeNode? root)
{
    var stack = new Stack<TreeNode>();
    var current = root;
    while (current != null || stack.Count > 0)
    {
        while (current != null) { stack.Push(current); current = current.Left; }
        current = stack.Pop();
        yield return current.Value;
        current = current.Right;
    }
}`,
    explanation: "Iterative in-order traversal using an explicit stack avoids recursion-depth limits. For trees with millions of nodes, this prevents `StackOverflowException`."
  },
  {
    id: "cs-b15-b5-required-with-ctor",
    language: "csharp",
    title: "required members with constructor bypass",
    tag: "snippet",
    code: `using System.Diagnostics.CodeAnalysis;
using System.Text.Json;

public class Entity
{
    public required int Id { get; set; }
    public required string Name { get; set; }
}

// Deserialize without required members check:
var json = """{"Id": 1, "Name": "Alice"}""";
var e = JsonSerializer.Deserialize<Entity>(json)!;
Console.WriteLine(e.Name);`,
    explanation: "JSON deserializers bypass the `required` check because they use reflection/source generators that call `[SetsRequiredMembers]` constructors internally."
  },
  {
    id: "cs-b15-b5-file-top-level",
    language: "csharp",
    title: "File-scoped namespace declaration",
    tag: "snippet",
    code: `namespace MyApp.Services;  // file-scoped — no braces

public class OrderService
{
    public Task<Order> GetOrderAsync(int id) =>
        Task.FromResult(new Order(id));
}

public record Order(int Id);`,
    explanation: "File-scoped namespace declaration (C# 10) removes one level of indentation from the entire file. Only one namespace per file is allowed in this form."
  },
  {
    id: "cs-b15-b5-generic-math-vector",
    language: "csharp",
    title: "Generic vector operations with INumber<T>",
    tag: "types",
    code: `using System.Numerics;

record Vector2<T>(T X, T Y) where T : INumber<T>
{
    public T Dot(Vector2<T> other) => X * other.X + Y * other.Y;

    public Vector2<T> Add(Vector2<T> other) =>
        new(X + other.X, Y + other.Y);

    public Vector2<T> Scale(T factor) =>
        new(X * factor, Y * factor);
}

var v = new Vector2<float>(3, 4);
Console.WriteLine(v.Dot(new Vector2<float>(1, 0)));  // 3`,
    explanation: "`INumber<T>` provides `+`, `*`, and other operators as static abstract members. The generic `Vector2<T>` works identically for `float`, `double`, `decimal`, etc."
  },
  {
    id: "cs-b15-b5-static-abstract-op",
    language: "csharp",
    title: "Static abstract operators in interfaces",
    tag: "types",
    code: `interface IAddable<TSelf> where TSelf : IAddable<TSelf>
{
    static abstract TSelf operator +(TSelf left, TSelf right);
}

record Money(decimal Amount) : IAddable<Money>
{
    public static Money operator +(Money a, Money b) =>
        new(a.Amount + b.Amount);
}

T Sum<T>(IEnumerable<T> items, T zero) where T : IAddable<T>
    => items.Aggregate(zero, (a, b) => a + b);

var total = Sum(new[] { new Money(10), new Money(20) }, new Money(0));
Console.WriteLine(total);  // Money { Amount = 30 }`,
    explanation: "Operator `+` as a static abstract interface member enables generic arithmetic without boxing. The generic `Sum` works for any `IAddable<T>` implementation."
  },
  {
    id: "cs-b15-b5-caller-member-name-set",
    language: "csharp",
    title: "SetField with CallerMemberName for MVVM",
    tag: "snippet",
    code: `using System.Runtime.CompilerServices;
using System.ComponentModel;

abstract class ObservableObject : INotifyPropertyChanged
{
    public event PropertyChangedEventHandler? PropertyChanged;

    protected void OnPropertyChanged(
        [CallerMemberName] string? name = null) =>
        PropertyChanged?.Invoke(this, new(name));

    protected bool Set<T>(
        ref T backing, T value,
        [CallerMemberName] string? name = null)
    {
        if (EqualityComparer<T>.Default.Equals(backing, value)) return false;
        backing = value;
        OnPropertyChanged(name);
        return true;
    }
}`,
    explanation: "The MVVM base class uses `CallerMemberName` twice — in both `Set` and `OnPropertyChanged`. Properties call `Set(ref _field, value)` and get notification for free."
  },
  {
    id: "cs-b15-b5-pattern-switch-deconstruct",
    language: "csharp",
    title: "Switch expression with custom Deconstruct",
    tag: "snippet",
    code: `class Range
{
    public int Min { get; init; }
    public int Max { get; init; }
    public void Deconstruct(out int min, out int max)
        => (min, max) = (Min, Max);
}

string Classify(Range r) => r switch
{
    (0, 0) => "empty",
    (0, var hi) => \`0 to \${hi}\`,
    (var lo, var hi) when hi - lo < 10 => "narrow",
    _ => "wide",
};`,
    explanation: "Custom `Deconstruct` makes any class usable in positional patterns. The compiler calls `Deconstruct` to extract values for the tuple-style matching."
  },
  {
    id: "cs-b15-b5-frozen-dict-perf",
    language: "csharp",
    title: "FrozenDictionary vs Dictionary benchmark context",
    tag: "structures",
    code: `using System.Collections.Frozen;

var regular = new Dictionary<string, int>
{
    ["alpha"] = 1, ["beta"] = 2, ["gamma"] = 3,
    ["delta"] = 4, ["epsilon"] = 5,
};

FrozenDictionary<string, int> frozen = regular.ToFrozenDictionary();

// Frozen uses perfect hashing — no collision chains:
Console.WriteLine(frozen["delta"]);   // 4
Console.WriteLine(frozen.Count);      // 5
Console.WriteLine(frozen.ContainsKey("zeta"));  // False`,
    explanation: "`FrozenDictionary` analyzes keys at construction and builds a minimal perfect hash. Lookups avoid hash collisions entirely, making them faster for read-heavy code."
  },
  {
    id: "cs-b15-b5-task-when-each-ordered",
    language: "csharp",
    title: "Processing tasks in completion order",
    tag: "snippet",
    code: `using System.Threading.Tasks;

async Task ProcessInOrder(int[] ids)
{
    var tasks = ids.Select(async id =>
    {
        await Task.Delay(new Random().Next(10, 100));
        return id;
    }).ToList();

    // Task.WhenEach yields tasks as they complete:
    await foreach (var task in Task.WhenEach(tasks))
    {
        int result = await task;
        Console.WriteLine(\`Completed: \${result}\`);
    }
}

await ProcessInOrder([5, 3, 1, 4, 2]);`,
    explanation: "`Task.WhenEach` (.NET 9) yields tasks as they finish — enabling streaming processing without waiting for all tasks or using complex continuation chains."
  },
  {
    id: "cs-b15-b5-partial-property-mvvm",
    language: "csharp",
    title: "Partial properties for CommunityToolkit.Mvvm",
    tag: "snippet",
    code: `// With CommunityToolkit.Mvvm source generator:
// [ObservableProperty] generates partial property implementation

// User writes:
// public partial class MainViewModel : ObservableObject
// {
//     [ObservableProperty]
//     private string _title = "Hello";
// }

// Generator produces:
// public partial string Title { get => _title; set => SetProperty(ref _title, value); }

// Placeholder:
Console.WriteLine("Partial property generated at compile time");`,
    explanation: "CommunityToolkit.Mvvm's `[ObservableProperty]` generates the property implementation via source generators, reducing MVVM boilerplate to a single attribute."
  },
  {
    id: "cs-b15-b5-params-interface",
    language: "csharp",
    title: "params IEnumerable with LINQ",
    tag: "snippet",
    code: `static string Join(string separator, params IEnumerable<string> values)
{
    return string.Join(separator, values);
}

Console.WriteLine(Join(", ", "Alice", "Bob", "Carol"));
Console.WriteLine(Join(", ", ["Dave", "Eve"]));
Console.WriteLine(Join(", ", Enumerable.Range(1, 3).Select(i => \$"item{i}"\`)));`,
    explanation: "`params IEnumerable<string>` (C# 13) accepts varargs, array literals, and any `IEnumerable<string>` — unifying the call sites for all three patterns."
  },
  {
    id: "cs-b15-b5-utf8-string-compare",
    language: "csharp",
    title: "Comparing UTF-8 spans without decoding",
    tag: "snippet",
    code: `using System;

ReadOnlySpan<byte> a = "hello"u8;
ReadOnlySpan<byte> b = "hello"u8;
ReadOnlySpan<byte> c = "world"u8;

Console.WriteLine(a.SequenceEqual(b));   // True
Console.WriteLine(a.SequenceEqual(c));   // False

// Case-insensitive comparison requires Encoding:
bool ciEqual = System.Text.Encoding.UTF8.GetString(a)
    .Equals(System.Text.Encoding.UTF8.GetString(c),
        StringComparison.OrdinalIgnoreCase);`,
    explanation: "UTF-8 literal spans compare with `SequenceEqual` for exact byte equality — no allocation. Case-insensitive comparison requires decoding to string."
  },
  {
    id: "cs-b15-b5-exception-aggregate",
    language: "csharp",
    title: "AggregateException flattening",
    tag: "snippet",
    code: `var tasks = Enumerable.Range(1, 5).Select(async i =>
{
    await Task.Delay(i * 10);
    if (i % 2 == 0) throw new Exception(\`Error in task \${i}\`);
});

try
{
    await Task.WhenAll(tasks);
}
catch (Exception)
{
    var allTasks = tasks.ToList();
    var exceptions = allTasks
        .Where(t => t.IsFaulted)
        .SelectMany(t => t.Exception!.Flatten().InnerExceptions);
    foreach (var ex in exceptions)
        Console.WriteLine(ex.Message);
}`,
    explanation: "`AggregateException.Flatten()` unwraps nested `AggregateException` instances into a flat list of `InnerExceptions`, simplifying multi-task error handling."
  },
  {
    id: "cs-b15-b5-global-using-static",
    language: "csharp",
    title: "Global using static for utility methods",
    tag: "snippet",
    code: `// GlobalUsings.cs
global using static System.Console;
global using static System.Math;
global using static System.Environment;

// Any file:
class Program
{
    static void Main()
    {
        double h = Sqrt(3.0 * 3.0 + 4.0 * 4.0);
        WriteLine(\`Hypotenuse: \${h}\`);  // no Console.
        WriteLine(\`CPU count: \${ProcessorCount}\`);  // no Environment.
    }
}`,
    explanation: "`global using static` imports static members globally — `Console.WriteLine` becomes just `WriteLine`, reducing noise in I/O-heavy code."
  },
  {
    id: "cs-b15-b5-struct-record-comparison",
    language: "csharp",
    title: "record struct vs struct equality",
    tag: "snippet",
    code: `struct Point { public int X, Y; }
record struct RecordPoint(int X, int Y);

var s1 = new Point { X = 1, Y = 2 };
var s2 = new Point { X = 1, Y = 2 };
var r1 = new RecordPoint(1, 2);
var r2 = new RecordPoint(1, 2);

Console.WriteLine(s1.Equals(s2));  // True (uses reflection fallback)
Console.WriteLine(s1 == s2);       // CS0019 — struct has no == by default
Console.WriteLine(r1 == r2);       // True — record struct generates ==`,
    explanation: "Regular structs don't generate `==`/`!=` operators — comparing uses `Equals` which may use reflection. `record struct` generates proper value equality including `==`."
  },
  {
    id: "cs-b15-b5-interface-default-abstract",
    language: "csharp",
    title: "Abstract base in interface with default",
    tag: "snippet",
    code: `interface IFormattable<TSelf> where TSelf : IFormattable<TSelf>
{
    string Format();
    string FormatWith(string prefix) => \`\${prefix}: \${Format()}\`;
}

class Temperature(double celsius) : IFormattable<Temperature>
{
    public string Format() => \`\${celsius:F1}°C\`;
}

IFormattable<Temperature> t = new Temperature(22.5);
Console.WriteLine(t.Format());           // 22.5°C
Console.WriteLine(t.FormatWith("Temp")); // Temp: 22.5°C`,
    explanation: "Interface default methods combined with CRTP constraints give concrete types a derived method for free while keeping the base interface clean."
  },
  {
    id: "cs-b15-b5-linq-group-join",
    language: "csharp",
    title: "LINQ GroupJoin for left outer joins",
    tag: "snippet",
    code: `record Customer(int Id, string Name);
record Order(int CustomerId, decimal Amount);

var customers = new[] { new Customer(1,"Alice"), new Customer(2,"Bob") };
var orders = new[] { new Order(1, 100), new Order(1, 200), new Order(2, 50) };

var result = customers.GroupJoin(
    orders, c => c.Id, o => o.CustomerId,
    (c, os) => (c.Name, Total: os.Sum(o => o.Amount)));

foreach (var r in result)
    Console.WriteLine(\`\${r.Name}: \${r.Total:C}\`);`,
    explanation: "`GroupJoin` is a left outer join that groups matching right-side elements. It works like SQL `LEFT JOIN ... GROUP BY`, producing zero-count groups for unmatched left rows."
  },
  {
    id: "cs-b15-b5-string-pool",
    language: "csharp",
    title: "StringPool for interning hot strings",
    tag: "snippet",
    code: `// From Microsoft.Toolkit.HighPerformance (or custom):
class StringPool
{
    private readonly Dictionary<ReadOnlyMemory<char>, string>
        _pool = new(ReadOnlyMemoryCharComparer.Instance);

    public string GetOrAdd(ReadOnlySpan<char> span)
    {
        var key = new string(span).AsMemory();
        if (!_pool.TryGetValue(key, out var str))
            _pool[key] = str = key.ToString();
        return str;
    }
}

class ReadOnlyMemoryCharComparer : IEqualityComparer<ReadOnlyMemory<char>>
{
    public static readonly ReadOnlyMemoryCharComparer Instance = new();
    public bool Equals(ReadOnlyMemory<char> a, ReadOnlyMemory<char> b) =>
        a.Span.SequenceEqual(b.Span);
    public int GetHashCode(ReadOnlyMemory<char> m) =>
        string.GetHashCode(m.Span);
}`,
    explanation: "A custom `StringPool` interns frequently seen strings (e.g., repeated JSON keys), reducing allocations when parsing high-throughput structured data."
  },
  {
    id: "cs-b15-b5-object-pool-reset",
    language: "csharp",
    title: "ObjectPool with custom reset policy",
    tag: "snippet",
    code: `using Microsoft.Extensions.ObjectPool;

class ResetableBuffer
{
    public List<int> Items { get; } = new();
    public void Reset() => Items.Clear();
}

class ResetPolicy : IPooledObjectPolicy<ResetableBuffer>
{
    public ResetableBuffer Create() => new();
    public bool Return(ResetableBuffer obj)
    {
        obj.Reset();
        return true;
    }
}

var pool = new DefaultObjectPool<ResetableBuffer>(new ResetPolicy());
var buf = pool.Get();
buf.Items.Add(42);
pool.Return(buf);  // Items cleared`,
    explanation: "A custom `IPooledObjectPolicy` controls both creation and return logic. `Return` returning `false` discards the object instead of pooling it — useful for size limits."
  },
  {
    id: "cs-b15-b5-cancellation-cooperative",
    language: "csharp",
    title: "Cooperative cancellation in CPU-bound work",
    tag: "snippet",
    code: `static long SumLarge(int limit, CancellationToken ct)
{
    long sum = 0;
    for (int i = 0; i < limit; i++)
    {
        ct.ThrowIfCancellationRequested();
        sum += i;
    }
    return sum;
}

using var cts = new CancellationTokenSource(TimeSpan.FromMilliseconds(100));
try
{
    long result = await Task.Run(() => SumLarge(int.MaxValue, cts.Token));
}
catch (OperationCanceledException) { Console.WriteLine("Cancelled"); }`,
    explanation: "`ThrowIfCancellationRequested` is the cooperative check for CPU-bound loops. Don't call it every iteration — every 100-1000 iterations balances responsiveness and overhead."
  },
  {
    id: "cs-b15-b5-linq-first-or-default",
    language: "csharp",
    title: "LINQ FirstOrDefault with predicate and default",
    tag: "snippet",
    code: `int[] numbers = [5, 2, 8, 1, 9, 3];

int first = numbers.FirstOrDefault(n => n > 10, -1);
Console.WriteLine(first);  // -1 — not found, uses default

int found = numbers.FirstOrDefault(n => n > 7, -1);
Console.WriteLine(found);  // 8`,
    explanation: "`FirstOrDefault(predicate, defaultValue)` (.NET 6+) returns the specified default instead of `0`/`null` when nothing matches — avoiding ambiguous zero returns."
  },
  {
    id: "cs-b15-b5-switch-when-pattern",
    language: "csharp",
    title: "Switch expression exhaustive with abstract record",
    tag: "snippet",
    code: `abstract record Expr;
record Num(double Value) : Expr;
record Add(Expr Left, Expr Right) : Expr;
record Mul(Expr Left, Expr Right) : Expr;

double Eval(Expr e) => e switch
{
    Num(var v) => v,
    Add(var l, var r) => Eval(l) + Eval(r),
    Mul(var l, var r) => Eval(l) * Eval(r),
    _ => throw new NotSupportedException(),
};

var expr = new Add(new Num(3), new Mul(new Num(4), new Num(2)));
Console.WriteLine(Eval(expr));  // 11`,
    explanation: "A sealed record hierarchy forms a discriminated union. The switch expression recursively evaluates the AST — the compiler warns if a known subtype is missing."
  },
  {
    id: "cs-b15-b5-async-observable",
    language: "csharp",
    title: "Converting IAsyncEnumerable to IObservable",
    tag: "snippet",
    code: `using System.Reactive.Linq;

static IObservable<T> ToObservable<T>(IAsyncEnumerable<T> source) =>
    Observable.Create<T>(async (observer, ct) =>
    {
        try
        {
            await foreach (var item in source.WithCancellation(ct))
                observer.OnNext(item);
            observer.OnCompleted();
        }
        catch (Exception ex) { observer.OnError(ex); }
    });`,
    explanation: "Bridging `IAsyncEnumerable` to `IObservable` enables using Rx operators (throttle, debounce, etc.) on async streams from database cursors or gRPC streaming RPCs."
  },
  {
    id: "cs-b15-b5-span-split-lines",
    language: "csharp",
    title: "Splitting lines in a span without allocation",
    tag: "snippet",
    code: `static void ProcessLines(ReadOnlySpan<char> text)
{
    foreach (var range in text.EnumerateLines())
    {
        var line = text[range];
        if (!line.IsEmpty)
            Console.WriteLine(line.ToString());
    }
}

ProcessLines("Line 1\\nLine 2\\r\\nLine 3\\n");`,
    explanation: "`EnumerateLines` (.NET 6+) handles `\\n`, `\\r\\n`, and `\\r` line endings, yielding `Range` values without allocating substrings."
  },
  {
    id: "cs-b15-b5-record-interface-default",
    language: "csharp",
    title: "Record with interface default method",
    tag: "snippet",
    code: `interface IDisplayable
{
    string Display() => \`[\${GetType().Name}]\`;
}

record Product(string Name, decimal Price) : IDisplayable
{
    public string Display() => \`\${Name}: \${Price:C}\`;
}

record Category(string Label) : IDisplayable;  // uses default

IDisplayable p = new Product("Widget", 9.99m);
IDisplayable c = new Category("Electronics");

Console.WriteLine(p.Display());  // Widget: $9.99
Console.WriteLine(c.Display());  // [Category]`,
    explanation: "Records can override interface default methods or inherit them. `Category` gets the default `[ClassName]` display without any additional code."
  },
  {
    id: "cs-b15-b5-generic-result-extensions",
    language: "csharp",
    title: "Extension methods on generic Result type",
    tag: "snippet",
    code: `readonly record struct Result<T>(T? Value, string? Error)
{
    public bool IsOk => Error is null;
    public static Result<T> Ok(T v) => new(v, null);
    public static Result<T> Fail(string e) => new(default, e);
}

static class ResultExtensions
{
    public static Result<U> Map<T, U>(
        this Result<T> r, Func<T, U> f) =>
        r.IsOk ? Result<U>.Ok(f(r.Value!)) : Result<U>.Fail(r.Error!);

    public static T GetOrElse<T>(this Result<T> r, T fallback) =>
        r.IsOk ? r.Value! : fallback;
}

var r = Result<int>.Ok(5).Map(x => x * 2).GetOrElse(0);
Console.WriteLine(r);  // 10`,
    explanation: "Extension methods on generic types add fluent chaining without modifying the type. `Map` and `GetOrElse` enable monadic-style composition over `Result<T>`."
  },
  {
    id: "cs-b15-b5-unsafe-unmanaged-memory",
    language: "csharp",
    title: "NativeMemory for unmanaged allocations",
    tag: "snippet",
    code: `using System.Runtime.InteropServices;

static unsafe void UseUnmanagedBuffer(int count)
{
    int* buffer = (int*)NativeMemory.Alloc((nuint)(count * sizeof(int)));
    try
    {
        for (int i = 0; i < count; i++)
            buffer[i] = i * i;
        Console.WriteLine(buffer[3]);  // 9
    }
    finally
    {
        NativeMemory.Free(buffer);
    }
}

UseUnmanagedBuffer(10);`,
    explanation: "`NativeMemory.Alloc` allocates unmanaged memory outside the GC heap. It's faster than `Marshal.AllocHGlobal` and must be paired with `NativeMemory.Free`."
  },
  {
    id: "cs-b15-b5-minimal-api-filter",
    language: "csharp",
    title: "Minimal API endpoint filter",
    tag: "snippet",
    code: `// ASP.NET Core 7+
// app.MapGet("/items/{id}", (int id) => ...)
//    .AddEndpointFilter(async (ctx, next) =>
//    {
//        if (ctx.HttpContext.Request.Headers["X-API-Key"] != "secret")
//            return Results.Unauthorized();
//        return await next(ctx);
//    });

// Placeholder:
Console.WriteLine("Endpoint filter applied");`,
    explanation: "`AddEndpointFilter` adds pre/post processing to a single endpoint. Filters compose like middleware — call `next` to continue, return early to short-circuit."
  },
  {
    id: "cs-b15-b5-memory-owner-pool",
    language: "csharp",
    title: "Custom IMemoryOwner using ArrayPool",
    tag: "snippet",
    code: `using System.Buffers;

sealed class PooledMemory<T> : IMemoryOwner<T>
{
    private T[] _array;
    private readonly int _length;

    public PooledMemory(int length)
    {
        _array = ArrayPool<T>.Shared.Rent(length);
        _length = length;
    }

    public Memory<T> Memory => _array.AsMemory(0, _length);

    public void Dispose()
    {
        ArrayPool<T>.Shared.Return(_array);
        _array = [];
    }
}`,
    explanation: "Custom `IMemoryOwner<T>` using `ArrayPool` provides ownership semantics for pooled arrays. `Dispose` returns the array to the pool, preventing both leaks and double-returns."
  },
  {
    id: "cs-b15-b5-source-gen-diagnostic",
    language: "csharp",
    title: "Source generator emitting diagnostics",
    tag: "snippet",
    code: `using Microsoft.CodeAnalysis;

// In a source generator:
static readonly DiagnosticDescriptor MissingAttribute = new(
    id: "MYSG001",
    title: "Missing required attribute",
    messageFormat: "Type '{0}' must have [MyAttribute]",
    category: "MyGenerator",
    defaultSeverity: DiagnosticSeverity.Error,
    isEnabledByDefault: true);

// ctx.ReportDiagnostic(
//     Diagnostic.Create(MissingAttribute,
//         symbol.Locations[0], symbol.Name));

Console.WriteLine("Diagnostic descriptor registered");`,
    explanation: "Source generators report diagnostics using `DiagnosticDescriptor` with a stable ID. Errors prevent compilation; warnings surface in the IDE without blocking builds."
  },
  {
    id: "cs-b15-b5-dispose-async",
    language: "csharp",
    title: "IAsyncDisposable for async cleanup",
    tag: "snippet",
    code: `class AsyncResource : IAsyncDisposable
{
    private bool _disposed;

    public async ValueTask DisposeAsync()
    {
        if (_disposed) return;
        _disposed = true;
        await Task.Delay(10);  // async cleanup (flush, close connection)
        Console.WriteLine("Resource released");
    }
}

await using var res = new AsyncResource();
Console.WriteLine("Using resource");
// DisposeAsync called at end of await using block`,
    explanation: "`IAsyncDisposable` with `await using` enables async cleanup — flushing buffers, closing network connections, or awaiting background tasks before release."
  },
  {
    id: "cs-b15-b5-pattern-relational-chain",
    language: "csharp",
    title: "Chained relational patterns for range checks",
    tag: "snippet",
    code: `string ScoreGrade(int score) => score switch
{
    >= 90 => "A",
    >= 80 => "B",
    >= 70 => "C",
    >= 60 => "D",
    _ => "F",
};

// Explicit range pattern:
bool IsValidPort(int port) => port is >= 1 and <= 65535;

Console.WriteLine(ScoreGrade(85));     // B
Console.WriteLine(IsValidPort(8080));  // True`,
    explanation: "Relational patterns (`>=`, `<=`, `<`, `>`) are evaluated in declaration order. The `and` combinator creates an inclusive range check in a single expression."
  },
];
