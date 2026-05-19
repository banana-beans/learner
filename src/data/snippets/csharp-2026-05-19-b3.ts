import type { Snippet } from "./types";

export const csharpSnippets20260519B3: Snippet[] = [
  {
    id: "cs-0519-b3-span-parsing",
    language: "csharp",
    title: "Span<char> for zero-allocation string parsing",
    tag: "snippet",
    code: `ReadOnlySpan<char> csv = "Alice,30,NYC";

// Split without allocating substrings
int firstComma  = csv.IndexOf(',');
int secondComma = csv[(firstComma + 1)..].IndexOf(',') + firstComma + 1;

ReadOnlySpan<char> name = csv[..firstComma];
ReadOnlySpan<char> age  = csv[(firstComma + 1)..secondComma];
ReadOnlySpan<char> city = csv[(secondComma + 1)..];

Console.WriteLine(name.ToString());  // Alice
int ageVal = int.Parse(age);         // 30 — no string allocation`,
    explanation: "Parsing with ReadOnlySpan<char> avoids allocating intermediate substring objects; int.Parse, double.Parse, and most BCL parsers accept spans directly in modern .NET.",
  },
  {
    id: "cs-0519-b3-valuetuple-pattern",
    language: "csharp",
    title: "Tuple switch for state machines",
    tag: "snippet",
    code: `enum State { Idle, Running, Paused, Stopped }
enum Event { Start, Pause, Resume, Stop }

State Transition(State state, Event evt) => (state, evt) switch
{
    (State.Idle,    Event.Start)  => State.Running,
    (State.Running, Event.Pause)  => State.Paused,
    (State.Paused,  Event.Resume) => State.Running,
    (State.Running, Event.Stop)   => State.Stopped,
    (State.Paused,  Event.Stop)   => State.Stopped,
    var (s, e) => throw new InvalidOperationException($"Cannot {e} from {s}")
};

Console.WriteLine(Transition(State.Idle, Event.Start));   // Running
Console.WriteLine(Transition(State.Running, Event.Pause)); // Paused`,
    explanation: "Matching on a tuple of (state, event) gives a compact, exhaustive state machine table; the discard arm catches invalid transitions and the compiler warns if you try to remove it.",
  },
  {
    id: "cs-0519-b3-pipeline-operator-ext",
    language: "csharp",
    title: "Fluent pipeline via extension methods",
    tag: "snippet",
    code: `public static class Pipeline
{
    public static TOut Pipe<TIn, TOut>(this TIn value, Func<TIn, TOut> fn)
        => fn(value);

    public static T PipeDo<T>(this T value, Action<T> action)
    {
        action(value);
        return value;
    }
}

int result = 5
    .Pipe(x => x * 2)       // 10
    .Pipe(x => x + 3)       // 13
    .PipeDo(x => Console.WriteLine($"intermediate: {x}"))
    .Pipe(x => x * x);      // 169

Console.WriteLine(result);  // 169`,
    explanation: "A Pipe extension method applies a function to the current value, enabling a left-to-right functional pipeline style without deeply nested calls — similar to F# pipe operator (|>).",
  },
  {
    id: "cs-0519-b3-record-with-clone",
    language: "csharp",
    title: "Record with-expression and inheritance",
    tag: "snippet",
    code: `record Animal(string Name, int Age);
record Dog(string Name, int Age, string Breed) : Animal(Name, Age);

var fido = new Dog("Fido", 3, "Labrador");

// with-expression works on derived records
var olderFido = fido with { Age = 4 };
Console.WriteLine(olderFido);  // Dog { Name = Fido, Age = 4, Breed = Labrador }

// Equality is structural across all properties
var fido2 = new Dog("Fido", 3, "Labrador");
Console.WriteLine(fido == fido2);  // True`,
    explanation: "with-expressions on derived records copy all properties (base + derived) and only change the specified ones; equality also considers the runtime type, so Dog != Animal even with same Name/Age.",
  },
  {
    id: "cs-0519-b3-linq-distinct-by",
    language: "csharp",
    title: "DistinctBy / MinBy / MaxBy (.NET 6+)",
    tag: "snippet",
    code: `var people = new[]
{
    new { Name = "Alice", Age = 30, City = "NYC" },
    new { Name = "Bob",   Age = 25, City = "LA"  },
    new { Name = "Carol", Age = 30, City = "NYC" },
};

// DistinctBy: keep first occurrence of each key
var uniqueAges = people.DistinctBy(p => p.Age);
Console.WriteLine(string.Join(", ", uniqueAges.Select(p => p.Name)));
// Alice, Bob

// MinBy / MaxBy: get the element with min/max key
var youngest = people.MinBy(p => p.Age);
Console.WriteLine(youngest?.Name);   // Bob`,
    explanation: "DistinctBy, MinBy, MaxBy, and MaxBy eliminate the GroupBy+Select or OrderBy+First patterns for common key-based operations, and they evaluate in a single pass.",
  },
  {
    id: "cs-0519-b3-string-handler",
    language: "csharp",
    title: "Interpolated string handlers for zero-overhead logging",
    tag: "snippet",
    code: `using System.Runtime.CompilerServices;

class Logger
{
    public static bool IsEnabled = false;

    // Handler: only builds the string if logging is enabled
    public static void Log(
        [InterpolatedStringHandlerArgument("")]
        ref DefaultInterpolatedStringHandler handler) { }

    // Simpler: use CallerArgumentExpression to avoid building string
    public static void Info(bool condition, string message)
    {
        if (condition) Console.WriteLine(message);
    }
}

// The compiler skips string building entirely if condition is false
// (with the proper handler attribute — simplified here for clarity)`,
    explanation: "Interpolated string handlers (C# 10) let library authors skip building the interpolated string entirely when logging is disabled — zero allocation for disabled log levels.",
  },
  {
    id: "cs-0519-b3-memory-owner",
    language: "csharp",
    title: "IMemoryOwner<T> and MemoryPool<T>",
    tag: "snippet",
    code: `using System.Buffers;

static void ProcessWithPool()
{
    // Rent a buffer from the pool — no heap allocation
    using IMemoryOwner<byte> owner = MemoryPool<byte>.Shared.Rent(4096);

    Memory<byte> buffer = owner.Memory[..4096]; // limit to what we need
    Span<byte>   span   = buffer.Span;

    span.Fill(0x00);   // zero it out

    // buffer is returned to pool when owner is Disposed
    Console.WriteLine(span.Length);  // 4096
}

ProcessWithPool();`,
    explanation: "MemoryPool<T>.Shared rents a reusable buffer from a pool; using IMemoryOwner returns it on dispose, eliminating repeated allocations for fixed-size byte buffers in I/O-heavy code.",
  },
  {
    id: "cs-0519-b3-weak-reference",
    language: "csharp",
    title: "WeakReference<T> for GC-friendly caches",
    tag: "snippet",
    code: `class Cache
{
    private WeakReference<byte[]>? _buffer;

    public byte[] GetBuffer()
    {
        if (_buffer != null && _buffer.TryGetTarget(out byte[]? buf))
            return buf;

        // GC collected it — reallocate
        buf = new byte[1024 * 1024];   // 1 MB
        _buffer = new WeakReference<byte[]>(buf);
        return buf;
    }
}

var cache = new Cache();
var b1 = cache.GetBuffer();
// GC may collect the buffer under memory pressure
var b2 = cache.GetBuffer();
Console.WriteLine(b1.Length);  // 1048576`,
    explanation: "WeakReference<T> holds a reference that doesn't prevent GC; TryGetTarget returns false if GC collected the object, letting you recreate it on demand — the pattern for GC-friendly caches.",
  },
  {
    id: "cs-0519-b3-thread-local",
    language: "csharp",
    title: "ThreadLocal<T> for per-thread state",
    tag: "snippet",
    code: `using System.Threading;

// Each thread gets its own instance
ThreadLocal<System.Text.StringBuilder> local =
    new(() => new System.Text.StringBuilder());

var tasks = Enumerable.Range(0, 4).Select(i => Task.Run(() =>
{
    var sb = local.Value!;   // this thread's StringBuilder
    sb.Append($"Thread {i}: ");
    sb.Append(i * i);
    Console.WriteLine(sb.ToString());
}));

await Task.WhenAll(tasks);
local.Dispose();`,
    explanation: "ThreadLocal<T> provides each thread with its own independent instance via a factory; accessing .Value always returns the current thread's copy, eliminating synchronisation overhead for per-thread state.",
  },
  {
    id: "cs-0519-b3-configuration-pattern",
    language: "csharp",
    title: "Options pattern with IOptions<T>",
    tag: "snippet",
    code: `// Typed settings class
class DatabaseOptions
{
    public required string ConnectionString { get; set; }
    public int CommandTimeout { get; set; } = 30;
    public int MaxRetries { get; set; } = 3;
}

// Registration (in Program.cs / Startup)
// services.Configure<DatabaseOptions>(config.GetSection("Database"));

// Consumption via injection
class DataService
{
    private readonly DatabaseOptions _opts;

    public DataService(Microsoft.Extensions.Options.IOptions<DatabaseOptions> opts)
        => _opts = opts.Value;

    public string ConnectionString => _opts.ConnectionString;
}`,
    explanation: "The Options pattern binds configuration sections to strongly-typed classes; IOptions<T> provides the value, IOptionsSnapshot<T> refreshes per-request, and IOptionsMonitor<T> reacts to runtime changes.",
  },
  {
    id: "cs-0519-b3-benchmark-dotnet",
    language: "csharp",
    title: "BenchmarkDotNet basics",
    tag: "snippet",
    code: `using BenchmarkDotNet.Attributes;
using BenchmarkDotNet.Running;

[MemoryDiagnoser]
public class StringBench
{
    private const int N = 1000;

    [Benchmark]
    public string Concatenation()
    {
        string s = "";
        for (int i = 0; i < N; i++) s += i;
        return s;
    }

    [Benchmark]
    public string StringBuilder_()
    {
        var sb = new System.Text.StringBuilder();
        for (int i = 0; i < N; i++) sb.Append(i);
        return sb.ToString();
    }
}

// BenchmarkRunner.Run<StringBench>();
// Produces: mean, median, alloc columns`,
    explanation: "BenchmarkDotNet handles warmup, multiple runs, statistics, and allocation measurement; [MemoryDiagnoser] adds GC allocation columns — the standard way to produce credible C# microbenchmarks.",
  },
  {
    id: "cs-0519-b3-interlocked",
    language: "csharp",
    title: "Interlocked for lock-free atomic operations",
    tag: "snippet",
    code: `using System.Threading;

int counter = 0;

// Thread-safe increment — no lock needed
Parallel.For(0, 10000, _ => Interlocked.Increment(ref counter));
Console.WriteLine(counter);  // exactly 10000

// CompareExchange: update only if current value matches expected
int current, expected, newVal;
do
{
    current  = counter;
    expected = current;
    newVal   = current * 2;
} while (Interlocked.CompareExchange(ref counter, newVal, expected) != expected);

Console.WriteLine(counter);  // 20000`,
    explanation: "Interlocked operations are hardware-atomic and avoid the overhead of Monitor/lock; CompareExchange implements optimistic concurrency (spin-wait CAS loop) for lock-free updates.",
  },
  {
    id: "cs-0519-b3-memory-marshal",
    language: "csharp",
    title: "MemoryMarshal for reinterpreting memory",
    tag: "snippet",
    code: `using System.Runtime.InteropServices;

byte[] rawBytes = { 0x01, 0x00, 0x00, 0x00, 0x02, 0x00, 0x00, 0x00 };

// Reinterpret bytes as ints without copying
ReadOnlySpan<int> ints = MemoryMarshal.Cast<byte, int>(rawBytes);
Console.WriteLine(ints[0]);  // 1  (little-endian)
Console.WriteLine(ints[1]);  // 2

// Get a byte span over a struct
int value = 0x0102_0304;
ReadOnlySpan<byte> bytes = MemoryMarshal.AsBytes(
    MemoryMarshal.CreateReadOnlySpan(ref value, 1));
Console.WriteLine(bytes[0].ToString("X2"));  // 04 (little-endian)`,
    explanation: "MemoryMarshal.Cast reinterprets the bytes of a span as a different element type (zero copy); it's the safe way to view binary data as typed values without unsafe pointers.",
  },
  {
    id: "cs-0519-b3-frozen-collections",
    language: "csharp",
    title: "FrozenDictionary and FrozenSet (.NET 8)",
    tag: "snippet",
    code: `using System.Collections.Frozen;

// Built once, optimised for repeated reads
var dict = new Dictionary<string, int>
{
    ["apple"]  = 1,
    ["banana"] = 2,
    ["cherry"] = 3
}.ToFrozenDictionary();

// Read-only, faster TryGetValue for small collections
Console.WriteLine(dict["apple"]);    // 1
Console.WriteLine(dict.ContainsKey("mango")); // False

var frozenSet = new[] { 1, 2, 3, 4, 5 }.ToFrozenSet();
Console.WriteLine(frozenSet.Contains(3));  // True`,
    explanation: "FrozenDictionary/FrozenSet are immutable collections built once from existing data; the construction is expensive but lookups are significantly faster than Dictionary for small-to-medium collections.",
  },
  {
    id: "cs-0519-b3-numeric-parsing",
    language: "csharp",
    title: "TryParse and TryParseExact for safe number parsing",
    tag: "snippet",
    code: `// TryParse: returns bool, output via out parameter
if (int.TryParse("123", out int n))
    Console.WriteLine(n * 2);  // 246

// Handle locale-sensitive decimals
string input = "1,234.56";
if (double.TryParse(input,
    System.Globalization.NumberStyles.Any,
    System.Globalization.CultureInfo.InvariantCulture,
    out double d))
{
    Console.WriteLine(d);  // 1234.56
}

// Span-based for zero-allocation hot paths (.NET 6+)
ReadOnlySpan<char> span = "42".AsSpan();
int.TryParse(span, out int result);
Console.WriteLine(result);  // 42`,
    explanation: "TryParse avoids exceptions for invalid input; specifying NumberStyles and CultureInfo prevents locale-sensitive bugs; the span overload skips string allocation entirely.",
  },
  {
    id: "cs-0519-b3-activator-generic",
    language: "csharp",
    title: "Activator.CreateInstance vs generic new() constraint",
    tag: "snippet",
    code: `// Activator.CreateInstance: uses reflection, slower, no compile check
object obj = Activator.CreateInstance(typeof(List<int>))!;

// Generic new() constraint: compile-time safe, zero overhead
static T Create<T>() where T : new() => new T();
var list = Create<List<int>>();   // fine

// For types requiring constructor arguments, use Activator
var withArgs = Activator.CreateInstance(typeof(string), new[] { 'x' }, 5);

// Or expression-tree-based factory for performance
System.Linq.Expressions.Expression.New(typeof(List<int>))
    .Compile();  // conceptual — compile the ctor to a delegate`,
    explanation: "new() constraint is zero-cost (compiled to newobj IL) and type-safe; Activator.CreateInstance uses reflection (costly) and returns object — use it only when the type isn't known at compile time.",
  },
  {
    id: "cs-0519-b3-exception-filters",
    language: "csharp",
    title: "Exception filters with when (C# 6)",
    tag: "snippet",
    code: `void ProcessResponse(int statusCode, string body)
{
    try
    {
        if (statusCode >= 400)
            throw new HttpRequestException(body) { Data = { ["code"] = statusCode } };
    }
    catch (HttpRequestException ex) when ((int)ex.Data["code"]! == 404)
    {
        Console.WriteLine("Not found — handle gracefully");
    }
    catch (HttpRequestException ex) when ((int)ex.Data["code"]! >= 500)
    {
        Console.WriteLine("Server error — retry");
        throw;  // re-throw preserving stack trace
    }
}`,
    explanation: "Exception filters (when) evaluate in the caller's frame without unwinding the stack, preserving the original stack trace for logging; they also enable fine-grained type-based routing within a catch.",
  },
  {
    id: "cs-0519-b3-conditional-weak-table",
    language: "csharp",
    title: "ConditionalWeakTable for per-object metadata",
    tag: "snippet",
    code: `using System.Runtime.CompilerServices;

class Tag
{
    public string Value { get; set; } = "";
}

// ConditionalWeakTable: attaches data to objects without modifying them
// Keys are held weakly — the table doesn't prevent GC
var tags = new ConditionalWeakTable<object, Tag>();

object host = new object();
tags.Add(host, new Tag { Value = "important" });

if (tags.TryGetValue(host, out var tag))
    Console.WriteLine(tag.Value);  // important

// When host is GC'd, its entry is removed automatically`,
    explanation: "ConditionalWeakTable attaches arbitrary metadata to existing objects without subclassing or modifying them; the weak key ensures the table doesn't keep the host object alive.",
  },
  {
    id: "cs-0519-b3-inlining-aggressiveinlining",
    language: "csharp",
    title: "MethodImpl AggressiveInlining for hot-path helpers",
    tag: "snippet",
    code: `using System.Runtime.CompilerServices;

class Math2
{
    // Hint to the JIT: always inline this method
    [MethodImpl(MethodImplOptions.AggressiveInlining)]
    public static int Clamp(int value, int min, int max)
    {
        if (value < min) return min;
        if (value > max) return max;
        return value;
    }

    // Hint: never inline (e.g. to keep cold paths off hot code paths)
    [MethodImpl(MethodImplOptions.NoInlining)]
    private static void HandleError(string msg)
        => throw new Exception(msg);
}

Console.WriteLine(Math2.Clamp(150, 0, 100));  // 100`,
    explanation: "AggressiveInlining tells the JIT to inline the method even if it exceeds heuristic size limits; NoInlining keeps cold-path code (error handlers) out of the hot path to improve instruction cache usage.",
  },
  {
    id: "cs-0519-b3-source-gen-incremental",
    language: "csharp",
    title: "Source generator output as partial class",
    tag: "snippet",
    code: `// Hand-written code (MyService.cs)
[AutoInterface]   // hypothetical attribute
public partial class MyService
{
    public void DoWork() => Console.WriteLine("working");
}

// Generated code (MyService.g.cs) — produced by source generator
// public partial interface IMyService
// {
//     void DoWork();
// }
// public partial class MyService : IMyService { }

// End result: MyService implements IMyService automatically
// No manual interface writing required`,
    explanation: "Source generators emit additional partial class or interface declarations; the hand-written class stays clean while the generator adds boilerplate like interface implementations, serialisation, or logging.",
  },
  {
    id: "cs-0519-b3-guid-newguid",
    language: "csharp",
    title: "Guid, Guid.NewGuid, and parsing",
    tag: "snippet",
    code: `Guid id = Guid.NewGuid();
Console.WriteLine(id);             // e.g. 3f2504e0-4f89-11d3-9a0c-0305e82c3301

// Parse from string
Guid parsed = Guid.Parse("3f2504e0-4f89-11d3-9a0c-0305e82c3301");

// TryParse for user input
if (Guid.TryParse("not-a-guid", out Guid result))
    Console.WriteLine(result);
else
    Console.WriteLine("invalid");  // invalid

// Format options
Console.WriteLine(id.ToString("N")); // no hyphens
Console.WriteLine(id.ToString("B")); // {with braces}`,
    explanation: "Guid.NewGuid() creates a random version-4 UUID; Parse requires exact format while TryParse handles invalid input safely; format specifiers (N, D, B, P, X) control the string representation.",
  },
  {
    id: "cs-0519-b3-environment-newline",
    language: "csharp",
    title: "Environment.NewLine and platform-agnostic paths",
    tag: "snippet",
    code: `// NewLine: \\r\\n on Windows, \\n on Unix
string text = "line1" + Environment.NewLine + "line2";

// Path.Combine: uses the platform separator
string path = System.IO.Path.Combine("home", "user", "file.txt");
// Windows: home\\user\\file.txt
// Linux:   home/user/file.txt

// Environment variables
string? home = Environment.GetEnvironmentVariable("HOME")
            ?? Environment.GetEnvironmentVariable("USERPROFILE");

Console.WriteLine(Environment.OSVersion);   // platform info
Console.WriteLine(Environment.ProcessorCount);`,
    explanation: "Using Environment.NewLine and Path.Combine instead of hardcoded \\r\\n and \\ ensures your code works on both Windows and Linux without conditional logic.",
  },
  {
    id: "cs-0519-b3-regex-compiled",
    language: "csharp",
    title: "Compiled regex vs source-generated regex (C# 10+)",
    tag: "snippet",
    code: `using System.Text.RegularExpressions;

// Traditional: compiled at runtime (RegexOptions.Compiled)
var runtimeRegex = new Regex(@"\\d{3}-\\d{4}", RegexOptions.Compiled);
Console.WriteLine(runtimeRegex.IsMatch("555-1234"));  // True

// Source-generated: compiled at build time, zero startup cost (C# 10+)
// [GeneratedRegex(@"\\d{3}-\\d{4}")]
// private static partial Regex PhoneRegex();

// Alternatively, static cached approach (avoids repeated compilation)
static readonly Regex PhoneStatic = new(@"\\d{3}-\\d{4}", RegexOptions.Compiled);

var match = PhoneStatic.Match("Call 555-1234 now");
Console.WriteLine(match.Value);  // 555-1234`,
    explanation: "RegexOptions.Compiled converts the pattern to IL at first use; [GeneratedRegex] (C# 10) compiles at build time with zero startup cost and AOT compatibility — the preferred approach for fixed patterns.",
  },
  {
    id: "cs-0519-b3-linq-left-outer",
    language: "csharp",
    title: "Left outer join in LINQ",
    tag: "snippet",
    code: `var customers = new[] { (Id: 1, Name: "Alice"), (Id: 2, Name: "Bob"), (Id: 3, Name: "Carol") };
var orders    = new[] { (CustId: 1, Item: "A"), (CustId: 1, Item: "B"), (CustId: 2, Item: "C") };

// GroupJoin + SelectMany + DefaultIfEmpty = LEFT OUTER JOIN
var leftJoin = customers
    .GroupJoin(orders, c => c.Id, o => o.CustId,
               (c, os) => new { Customer = c, Orders = os })
    .SelectMany(x => x.Orders.DefaultIfEmpty(),
               (x, o) => new { x.Customer.Name, Item = o.Item });

foreach (var row in leftJoin)
    Console.WriteLine($"{row.Name}: {row.Item ?? "(no orders)"}");
// Alice: A / Alice: B / Bob: C / Carol: (no orders)`,
    explanation: "LINQ has no left-join keyword; the pattern is GroupJoin (produces an inner sequence per outer row) then SelectMany with DefaultIfEmpty to emit null for outer rows with no matches.",
  },
  {
    id: "cs-0519-b3-extension-method-null",
    language: "csharp",
    title: "Extension methods work on null receivers",
    tag: "snippet",
    code: `public static class StringExtensions
{
    public static bool IsNullOrEmpty(this string? s)
        => string.IsNullOrEmpty(s);

    public static string OrDefault(this string? s, string fallback = "")
        => string.IsNullOrEmpty(s) ? fallback : s!;
}

string? name = null;

// Works even though name is null — no NullReferenceException
Console.WriteLine(name.IsNullOrEmpty());   // True
Console.WriteLine(name.OrDefault("N/A"));  // N/A

string? real = "Alice";
Console.WriteLine(real.OrDefault("N/A")); // Alice`,
    explanation: "Extension methods receive the receiver as a regular argument so they can be called on null without throwing — unlike instance methods; this enables fluent null-safe helpers.",
  },
  {
    id: "cs-0519-b3-generics-new-constraint",
    language: "csharp",
    title: "Generic factory pattern with new() and interface",
    tag: "snippet",
    code: `interface IResettable { void Reset(); }

static T CreateFresh<T>() where T : IResettable, new()
{
    T instance = new T();
    instance.Reset();
    return instance;
}

class Counter : IResettable
{
    public int Value { get; private set; } = 99;  // imagine dirty state
    public void Increment() => Value++;
    public void Reset() => Value = 0;
}

Counter c = CreateFresh<Counter>();
Console.WriteLine(c.Value);  // 0 (was reset)`,
    explanation: "Combining new() (parameterless constructor) and an interface constraint lets a generic method instantiate and initialise T without knowing the concrete type — a compile-safe factory pattern.",
  },
  {
    id: "cs-0519-b3-ienumerator-manual",
    language: "csharp",
    title: "Manual IEnumerator<T> implementation",
    tag: "snippet",
    code: `class EveryOther<T> : IEnumerable<T>
{
    private readonly T[] _data;
    public EveryOther(T[] data) => _data = data;

    public IEnumerator<T> GetEnumerator()
    {
        for (int i = 0; i < _data.Length; i += 2)
            yield return _data[i];  // compiler generates IEnumerator
    }

    System.Collections.IEnumerator System.Collections.IEnumerable.GetEnumerator()
        => GetEnumerator();
}

foreach (int n in new EveryOther<int>(new[] { 1, 2, 3, 4, 5 }))
    Console.Write(n + " ");  // 1 3 5`,
    explanation: "Using yield return inside GetEnumerator lets the compiler generate the full IEnumerator<T> state machine; you still need to implement the non-generic IEnumerable.GetEnumerator for backwards compatibility.",
  },
  {
    id: "cs-0519-b3-async-iterator",
    language: "csharp",
    title: "Async iterator with await and yield",
    tag: "snippet",
    code: `async IAsyncEnumerable<string> FetchPages(string baseUrl, int count)
{
    for (int page = 1; page <= count; page++)
    {
        await Task.Delay(50);   // simulate HTTP
        yield return $"page {page} data from {baseUrl}";
    }
}

await foreach (string page in FetchPages("api/items", 3))
    Console.WriteLine(page);
// page 1 data from api/items
// page 2 data from api/items
// page 3 data from api/items`,
    explanation: "Combining yield return with await inside an IAsyncEnumerable<T> method creates an async stream; each item is produced on demand and the consumer awaits each step with await foreach.",
  },
  {
    id: "cs-0519-b3-cancellable-async-stream",
    language: "csharp",
    title: "Cancellable async stream with EnumeratorCancellation",
    tag: "snippet",
    code: `using System.Runtime.CompilerServices;

async IAsyncEnumerable<int> Numbers(
    [EnumeratorCancellation] CancellationToken ct = default)
{
    for (int i = 0; ; i++)
    {
        ct.ThrowIfCancellationRequested();
        await Task.Delay(10, ct);
        yield return i;
    }
}

using var cts = new CancellationTokenSource(TimeSpan.FromMilliseconds(50));

await foreach (int n in Numbers().WithCancellation(cts.Token))
    Console.Write(n + " ");   // 0 1 2 3 (then cancelled)`,
    explanation: "[EnumeratorCancellation] lets callers pass a CancellationToken via .WithCancellation() at the foreach site; the token flows into the async stream without exposing it in the API surface.",
  },
  {
    id: "cs-0519-b3-partial-method",
    language: "csharp",
    title: "Partial methods — declare in one file, implement in another",
    tag: "classes",
    code: `// File: User.cs (or auto-generated)
partial class User
{
    public string Name { get; set; } = "";

    // Partial method: optional implementation
    partial void OnNameChanging(string newName);
    partial void OnNameChanged(string oldName);

    public void SetName(string name)
    {
        OnNameChanging(name);
        string old = Name;
        Name = name;
        OnNameChanged(old);
    }
}

// File: User.Logic.cs (hand-written)
partial class User
{
    partial void OnNameChanging(string newName)
        => Console.WriteLine($"Changing to: {newName}");
}`,
    explanation: "Partial methods with no implementation are completely removed by the compiler (zero overhead); if implemented, the body runs — used by source generators to inject hooks into hand-written code.",
  },
  {
    id: "cs-0519-b3-readonly-ref-struct",
    language: "csharp",
    title: "ref struct for stack-only types",
    tag: "types",
    code: `// ref struct: can only live on the stack
// Cannot be: boxed, assigned to object, stored in fields of normal classes,
//            used in async methods, or stored in lambda closures
ref struct StackBuffer
{
    private Span<byte> _data;
    public StackBuffer(Span<byte> data) => _data = data;

    public int Length => _data.Length;
    public byte this[int i]
    {
        get => _data[i];
        set => _data[i] = value;
    }
}

Span<byte> mem = stackalloc byte[64];
var buf = new StackBuffer(mem);
buf[0] = 42;
Console.WriteLine(buf[0]);  // 42`,
    explanation: "ref struct is restricted to the stack only (like Span<T>); the restrictions prevent it from being captured by the GC, enabling safe use of stack-allocated memory without the limitations of unsafe pointers.",
  },
  {
    id: "cs-0519-b3-type-initializer",
    language: "csharp",
    title: "Static field initializers and initialization order",
    tag: "understanding",
    code: `class A
{
    public static int X = B.Y + 1;   // reads B.Y during A's initialisation
}

class B
{
    public static int Y = 10;
}

// A's static ctor runs before first access to A
// B's static ctor runs before first access to B
// Access order: B (X depends on B.Y), then A
Console.WriteLine(A.X);  // 11
Console.WriteLine(B.Y);  // 10

// Circular static initialisation is possible and produces 0
class Circular
{
    public static int P = Q + 1;  // Q may be 0 if not yet initialised
    public static int Q = 5;
}
Console.WriteLine(Circular.P); // 1 (Q was 0 when P was computed)`,
    explanation: "Static field initializers run top-to-bottom in source order; if one field depends on another class that hasn't initialised yet, it gets the default value (0/null) — ordering bugs are hard to spot.",
  },
  {
    id: "cs-0519-b3-indexer-range",
    language: "csharp",
    title: "Custom type with Index and Range support",
    tag: "classes",
    code: `class WordList
{
    private readonly string[] _words;
    public WordList(params string[] words) => _words = words;
    public int Length => _words.Length;

    // Supports [^1] syntax via Index
    public string this[Index index] => _words[index];

    // Supports [1..3] syntax via Range
    public WordList this[Range range]
    {
        get
        {
            (int offset, int length) = range.GetOffsetAndLength(_words.Length);
            return new WordList(_words[offset..(offset + length)]);
        }
    }
}

var wl = new WordList("one", "two", "three", "four");
Console.WriteLine(wl[^1]);     // four
Console.WriteLine(wl[1..3][0]); // two`,
    explanation: "Supporting Index and Range in a custom type requires indexers typed as Index and Range respectively; GetOffsetAndLength converts a Range to an offset+length pair for any collection length.",
  },
  {
    id: "cs-0519-b3-disposable-async",
    language: "csharp",
    title: "IAsyncDisposable and await using",
    tag: "classes",
    code: `class AsyncConnection : IAsyncDisposable
{
    public AsyncConnection() => Console.WriteLine("Connected");

    public async Task QueryAsync() => await Task.Delay(10);

    public async ValueTask DisposeAsync()
    {
        await Task.Delay(10);   // flush / close async
        Console.WriteLine("Disconnected async");
    }
}

async Task Main()
{
    await using var conn = new AsyncConnection();  // DisposeAsync called at end
    await conn.QueryAsync();
}

await Main();
// Connected / Disconnected async`,
    explanation: "IAsyncDisposable provides DisposeAsync for types that need to release resources asynchronously (flushing buffers, closing network connections); await using calls it at block exit.",
  },
  {
    id: "cs-0519-b3-record-equality-custom",
    language: "csharp",
    title: "Customising record equality",
    tag: "classes",
    code: `record Point(double X, double Y)
{
    // Override auto-generated equality for floating-point tolerance
    public virtual bool Equals(Point? other)
    {
        if (other is null) return false;
        double eps = 1e-9;
        return Math.Abs(X - other.X) < eps && Math.Abs(Y - other.Y) < eps;
    }

    public override int GetHashCode()
        => HashCode.Combine(Math.Round(X, 9), Math.Round(Y, 9));
}

var p1 = new Point(1.0, 2.0);
var p2 = new Point(1.0 + 1e-12, 2.0);  // tiny floating-point error
Console.WriteLine(p1 == p2);  // True (within tolerance)`,
    explanation: "Records generate Equals from all properties, but you can override it; overriding GetHashCode consistently is mandatory — values that compare equal must return the same hash.",
  },
  {
    id: "cs-0519-b3-generic-math-min-max",
    language: "csharp",
    title: "Generic Min/Max with IComparable<T>",
    tag: "classes",
    code: `static T Min<T>(T a, T b) where T : IComparable<T>
    => a.CompareTo(b) <= 0 ? a : b;

static T Clamp<T>(T value, T min, T max) where T : IComparable<T>
{
    if (value.CompareTo(min) < 0) return min;
    if (value.CompareTo(max) > 0) return max;
    return value;
}

Console.WriteLine(Min(3, 7));          // 3
Console.WriteLine(Min("apple", "banana")); // apple (lexicographic)
Console.WriteLine(Clamp(150, 0, 100)); // 100`,
    explanation: "The IComparable<T> constraint exposes CompareTo, enabling generic ordering operations that work with any type — int, double, string, DateTime, or your own IComparable implementors.",
  },
  {
    id: "cs-0519-b3-ienumerable-extensions",
    language: "csharp",
    title: "ForEach / Batch / TakeUntil extensions",
    tag: "families",
    code: `public static class Ext
{
    // Execute an action on each element (List<T> has this, IEnumerable<T> doesn't)
    public static void ForEach<T>(this IEnumerable<T> source, Action<T> action)
    {
        foreach (var item in source) action(item);
    }

    // Yield items while predicate holds (stop at first failure)
    public static IEnumerable<T> TakeWhileInclusive<T>(
        this IEnumerable<T> src, Func<T, bool> predicate)
    {
        foreach (var item in src)
        {
            yield return item;
            if (!predicate(item)) yield break;
        }
    }
}

new[] { 1, 2, 3 }.ForEach(x => Console.Write(x));  // 123
var upTo5 = Enumerable.Range(1, 10).TakeWhileInclusive(x => x < 5);
Console.WriteLine(string.Join(",", upTo5));  // 1,2,3,4,5`,
    explanation: "Extension methods on IEnumerable<T> integrate into LINQ chains; yield return keeps them lazy; TakeWhileInclusive includes the first failing element, unlike TakeWhile which excludes it.",
  },
  {
    id: "cs-0519-b3-volatile-keyword",
    language: "csharp",
    title: "volatile field for cross-thread visibility",
    tag: "caveats",
    code: `class Flag
{
    // volatile: compiler/JIT won't cache this in a register across threads
    private volatile bool _stop = false;

    public void Stop() => _stop = true;

    public void Run()
    {
        // Without volatile, the JIT may cache _stop and loop forever!
        while (!_stop)
            Thread.SpinWait(1);
        Console.WriteLine("Stopped");
    }
}

var f = new Flag();
Task.Delay(100).ContinueWith(_ => f.Stop());
f.Run();  // Stopped (after ~100ms)`,
    explanation: "volatile ensures every read of the field goes to main memory (no register caching), providing visibility guarantees for simple flags; it's not enough for compound operations (use Interlocked or lock for those).",
  },
  {
    id: "cs-0519-b3-environment-failfast",
    language: "csharp",
    title: "Environment.FailFast for unrecoverable errors",
    tag: "caveats",
    code: `static void CheckInvariant(bool condition, string message)
{
    if (!condition)
    {
        // FailFast terminates the process immediately
        // Bypasses all try/catch, finally blocks, and finalizers
        // Writes to Windows Event Log / generates crash dump
        Environment.FailFast($"Invariant violated: {message}");
    }
}

// Use when data corruption is detected and continuing is dangerous
// e.g. in-memory data structure is inconsistent after a race condition
// CheckInvariant(headNode.Parent == null, "tree root must have no parent");`,
    explanation: "FailFast terminates immediately without unwinding the stack — unlike throw, it skips catch/finally blocks; use it when continuing would risk data corruption or security violations.",
  },
  {
    id: "cs-0519-b3-awaitable-pattern",
    language: "csharp",
    title: "Making any type awaitable via GetAwaiter",
    tag: "understanding",
    code: `using System.Runtime.CompilerServices;
using System.Threading;

// Make TimeSpan awaitable: await TimeSpan.FromSeconds(1)
public static class TimeSpanExtensions
{
    public static TaskAwaiter GetAwaiter(this TimeSpan ts)
        => Task.Delay(ts).GetAwaiter();
}

// Usage:
// await TimeSpan.FromMilliseconds(100);

// The awaitable pattern requires:
// - GetAwaiter() method that returns an awaiter
// - Awaiter must implement: IsCompleted, GetResult(), OnCompleted(Action)`,
    explanation: "C# uses duck-typing for await: any type with a GetAwaiter() method returning a type with IsCompleted, GetResult(), and OnCompleted is awaitable — no interface required.",
  },
  {
    id: "cs-0519-b3-span-char-comparison",
    language: "csharp",
    title: "Comparing spans without allocation",
    tag: "snippet",
    code: `ReadOnlySpan<char> a = "Hello World".AsSpan();
ReadOnlySpan<char> b = "world".AsSpan();

// Case-insensitive endsWith without allocating substrings
bool endsWith = a[^b.Length..].Equals(b, StringComparison.OrdinalIgnoreCase);
Console.WriteLine(endsWith);  // True

// Contains check
bool contains = a.Contains("llo".AsSpan(), StringComparison.Ordinal);
Console.WriteLine(contains);  // True

// SequenceEqual for exact match
Console.WriteLine("hello".AsSpan().SequenceEqual("hello".AsSpan())); // True`,
    explanation: "ReadOnlySpan<char> supports case-insensitive comparison, Contains, and SequenceEqual without allocating substrings — critical for parsing hot paths like HTTP header handling.",
  },
  {
    id: "cs-0519-b3-overload-bool-nullable",
    language: "csharp",
    title: "bool? and overloaded logical operators",
    tag: "types",
    code: `bool? a = true;
bool? b = null;
bool? c = false;

// & and | are lifted for nullable bool
Console.WriteLine(a & b);  // null  (true AND unknown = unknown)
Console.WriteLine(c & b);  // False (false AND anything = false!)
Console.WriteLine(a | b);  // True  (true OR anything = true!)
Console.WriteLine(c | b);  // null  (false OR unknown = unknown)

// && and || cannot be used with bool? — use & and | instead
// bool? result = a && b;  // compile error`,
    explanation: "bool? (Nullable<bool>) implements three-valued (Kleene) logic for & and |: false & null is false (false wins), true | null is true (true wins); && and || are not supported on nullable bool.",
  },
  {
    id: "cs-0519-b3-string-split-options",
    language: "csharp",
    title: "string.Split with StringSplitOptions",
    tag: "snippet",
    code: `string csv = "Alice,,Bob,  ,Carol,";

// Default: includes empty strings
string[] basic = csv.Split(',');
Console.WriteLine(basic.Length);  // 6

// Remove empty entries
string[] noEmpty = csv.Split(',', StringSplitOptions.RemoveEmptyEntries);
Console.WriteLine(noEmpty.Length);  // 4 (Bob and Carol but not spaces-only)

// Remove empty AND trim whitespace (.NET 5+)
string[] cleaned = csv.Split(',',
    StringSplitOptions.RemoveEmptyEntries |
    StringSplitOptions.TrimEntries);
Console.WriteLine(cleaned.Length);  // 3  (Alice, Bob, Carol)`,
    explanation: "StringSplitOptions.RemoveEmptyEntries drops zero-length tokens; TrimEntries (.NET 5) also strips leading/trailing whitespace from each token — combine both to robustly parse CSV-like input.",
  },
  {
    id: "cs-0519-b3-disposable-ref-struct",
    language: "csharp",
    title: "Disposable ref struct for scoped stack resources",
    tag: "types",
    code: `ref struct BufferScope
{
    private Span<byte> _buffer;

    public BufferScope(int size) => _buffer = new byte[size];  // simplified

    public Span<byte> Buffer => _buffer;

    public void Dispose()
    {
        _buffer.Clear();   // zero-fill before releasing scope
        _buffer = default;
        Console.WriteLine("Buffer scope released");
    }
}

{
    using var scope = new BufferScope(128);
    scope.Buffer[0] = 42;
}   // Dispose() called here`,
    explanation: "ref structs can implement Dispose() and work with using; they can't implement IDisposable (no interface on ref structs) but the compiler recognises the pattern and calls Dispose at end of using scope.",
  },
  {
    id: "cs-0519-b3-implicit-explicit-interface-coexist",
    language: "csharp",
    title: "Implicit and explicit interface coexisting on one class",
    tag: "classes",
    code: `interface IAnimal  { string Sound(); }
interface IRobot   { string Sound(); }

class RoboDog : IAnimal, IRobot
{
    // Implicit: accessible as roboDog.Sound()
    public string Sound() => "Woof!";

    // Explicit: only via IRobot reference
    string IRobot.Sound() => "Beep boop";
}

var rd = new RoboDog();
Console.WriteLine(rd.Sound());              // Woof!
Console.WriteLine(((IRobot)rd).Sound());    // Beep boop
Console.WriteLine(((IAnimal)rd).Sound());   // Woof! (uses implicit)`,
    explanation: "When two interfaces have the same method name, explicit implementation disambiguates; the implicit implementation satisfies all interfaces that don't have an explicit override.",
  },
  {
    id: "cs-0519-b3-struct-method-in",
    language: "csharp",
    title: "Passing large structs with 'in' to avoid copying",
    tag: "types",
    code: `struct BigStruct
{
    public double A, B, C, D, E, F, G, H;  // 64 bytes
}

// By value: 64-byte copy on every call
double SumByValue(BigStruct s) => s.A + s.B;

// With 'in': passes by reference (no copy), but read-only
double SumByIn(in BigStruct s) => s.A + s.B;

var bs = new BigStruct { A = 1.0, B = 2.0 };
Console.WriteLine(SumByValue(bs));   // 3.0 (copies 64 bytes)
Console.WriteLine(SumByIn(in bs));   // 3.0 (passes reference)`,
    explanation: "Passing large structs with in avoids copying them onto the stack; the callee gets a read-only reference — no mutation possible, so no defensive copy is needed for readonly structs.",
  },
  {
    id: "cs-0519-b3-covariant-override-return",
    language: "csharp",
    title: "Covariant return types in practice",
    tag: "understanding",
    code: `class Builder
{
    public virtual Builder SetName(string name)
    {
        Console.WriteLine($"Builder: {name}");
        return this;
    }
}

class AdvancedBuilder : Builder
{
    public string? Extra { get; private set; }

    // Return type narrowed to AdvancedBuilder — callers using AdvancedBuilder
    // don't need to cast the return value
    public override AdvancedBuilder SetName(string name)
    {
        base.SetName(name);
        return this;
    }

    public AdvancedBuilder SetExtra(string e) { Extra = e; return this; }
}

// No cast needed — SetName returns AdvancedBuilder here
var result = new AdvancedBuilder().SetName("x").SetExtra("y");`,
    explanation: "Covariant returns (C# 9) allow an override to return a more derived type; this is especially useful in builder hierarchies where every chained call should preserve the subclass type.",
  },
  {
    id: "cs-0519-b3-string-pool",
    language: "csharp",
    title: "string.Intern for explicit string pooling",
    tag: "snippet",
    code: `// Compile-time literals are interned automatically
string a = "hello";
string b = "hello";
Console.WriteLine(ReferenceEquals(a, b));  // True

// Runtime strings are not interned by default
string c = new string(new[] { 'h', 'e', 'l', 'l', 'o' });
Console.WriteLine(ReferenceEquals(a, c));  // False

// Explicit interning
string d = string.Intern(c);
Console.WriteLine(ReferenceEquals(a, d));  // True

// Check if already interned (returns null if not)
string? e = string.IsInterned("world");
Console.WriteLine(e is not null);  // True (literals are interned)`,
    explanation: "string.Intern adds a runtime-built string to the intern pool, enabling identity-based equality for that value; IsInterned returns the interned reference or null without adding to the pool.",
  },
  {
    id: "cs-0519-b3-bitoperations",
    language: "csharp",
    title: "System.Numerics.BitOperations for bit manipulation",
    tag: "snippet",
    code: `using System.Numerics;

uint n = 0b_1010_1100;   // 172

// Count leading/trailing zeros and set bits
Console.WriteLine(BitOperations.PopCount(n));          // 4  (set bits)
Console.WriteLine(BitOperations.LeadingZeroCount(n));  // 24
Console.WriteLine(BitOperations.TrailingZeroCount(n)); // 2

// Next power of 2
Console.WriteLine(BitOperations.RoundUpToPowerOf2(100));  // 128

// Rotate bits
uint rotated = BitOperations.RotateLeft(n, 4);
Console.WriteLine(rotated.ToString("X"));  // AC000000`,
    explanation: "System.Numerics.BitOperations provides hardware-backed intrinsics (POPCNT, BSF, BSR, etc.) through platform-specific JIT support, making bit manipulation fast and architecture-portable.",
  },
  {
    id: "cs-0519-b3-nint-pointer-size",
    language: "csharp",
    title: "sizeof and Unsafe.SizeOf for type sizes",
    tag: "types",
    code: `using System.Runtime.CompilerServices;

// sizeof: compile-time constant for unmanaged types
Console.WriteLine(sizeof(int));      // 4
Console.WriteLine(sizeof(double));   // 8
Console.WriteLine(sizeof(bool));     // 1

// Unsafe.SizeOf: works with managed types (generics too)
Console.WriteLine(Unsafe.SizeOf<int>());     // 4
Console.WriteLine(Unsafe.SizeOf<string>());  // 8 (pointer size on 64-bit)

// Generic version
static int SizeOf<T>() => Unsafe.SizeOf<T>();
Console.WriteLine(SizeOf<decimal>());  // 16`,
    explanation: "sizeof is a compile-time operator for unmanaged types; Unsafe.SizeOf<T>() works for any type including managed references (returning pointer size) — both are intrinsified by the JIT.",
  },
  {
    id: "cs-0519-b3-benchmark-attribute",
    language: "csharp",
    title: "[Params] and [ParamSource] in BenchmarkDotNet",
    tag: "snippet",
    code: `using BenchmarkDotNet.Attributes;

[MemoryDiagnoser]
public class SearchBench
{
    [Params(100, 1000, 10000)]
    public int N { get; set; }

    private int[] _data = null!;

    [GlobalSetup]
    public void Setup() => _data = Enumerable.Range(0, N).ToArray();

    [Benchmark(Baseline = true)]
    public int LinearSearch() => Array.IndexOf(_data, N / 2);

    [Benchmark]
    public int BinarySearch() => Array.BinarySearch(_data, N / 2);
}
// Runs 3 × 2 = 6 benchmark configurations and shows ratio vs baseline`,
    explanation: "[Params] generates separate benchmark runs for each value; [GlobalSetup] initialises state once per configuration; Baseline=true makes BenchmarkDotNet compute a ratio column for other methods.",
  },
  {
    id: "cs-0519-b3-linq-order-by-multiple",
    language: "csharp",
    title: "LINQ multi-key ordering with ThenBy",
    tag: "snippet",
    code: `var people = new[]
{
    new { Name = "Carol", Dept = "Eng",  Salary = 90_000 },
    new { Name = "Alice", Dept = "Eng",  Salary = 85_000 },
    new { Name = "Bob",   Dept = "Sales", Salary = 75_000 },
    new { Name = "Dave",  Dept = "Eng",  Salary = 85_000 },
};

var sorted = people
    .OrderBy(p => p.Dept)
    .ThenBy(p => p.Salary)
    .ThenBy(p => p.Name);

foreach (var p in sorted)
    Console.WriteLine($"{p.Dept} {p.Name} {p.Salary}");
// Eng Alice 85000 / Eng Dave 85000 / Eng Carol 90000 / Sales Bob 75000`,
    explanation: "ThenBy and ThenByDescending add secondary sort keys to an IOrderedEnumerable; the overall sort is stable — equal-keyed elements preserve their original relative order.",
  },
  {
    id: "cs-0519-b3-linq-skip-take",
    language: "csharp",
    title: "Skip/Take/SkipWhile/TakeWhile for pagination",
    tag: "snippet",
    code: `int[] data = Enumerable.Range(1, 20).ToArray();

// Classic pagination
int page = 2, pageSize = 5;
var pageItems = data.Skip((page - 1) * pageSize).Take(pageSize);
Console.WriteLine(string.Join(",", pageItems));  // 6,7,8,9,10

// SkipWhile/TakeWhile: predicate-based
var afterTen = data.SkipWhile(x => x <= 10);
Console.WriteLine(afterTen.First());  // 11

// SkipLast/TakeLast (.NET 6+)
Console.WriteLine(string.Join(",", data.TakeLast(3)));  // 18,19,20`,
    explanation: "Skip/Take implement pagination; SkipWhile/TakeWhile use a predicate that stops as soon as it becomes false (not a filter — once false, all subsequent items are included/excluded).",
  },
  {
    id: "cs-0519-b3-span-writer",
    language: "csharp",
    title: "Writing to Span<char> for formatted output without allocation",
    tag: "snippet",
    code: `Span<char> buffer = stackalloc char[64];

int written = 0;
"Hello".AsSpan().CopyTo(buffer[written..]);
written += 5;

buffer[written++] = ',';
buffer[written++] = ' ';

int n = 42;
n.TryFormat(buffer[written..], out int numChars);
written += numChars;

Console.WriteLine(buffer[..written].ToString());  // Hello, 42`,
    explanation: "TryFormat writes a formatted value directly into a Span<char> without allocating a string; building complex output this way produces zero garbage compared to string.Format or interpolation.",
  },
  {
    id: "cs-0519-b3-abstract-property-field",
    language: "csharp",
    title: "Abstract property vs abstract field (no such thing)",
    tag: "understanding",
    code: `abstract class Shape
{
    // C# has no abstract fields — use abstract properties instead
    public abstract double Area { get; }    // abstract property
    public abstract string Color { get; set; }  // with setter too

    public string Describe() => $"{Color} shape with area={Area:F2}";
}

class Square : Shape
{
    private string _color = "red";
    public double Side { get; }
    public override double Area => Side * Side;
    public override string Color { get => _color; set => _color = value; }
    public Square(double side) => Side = side;
}

Console.WriteLine(new Square(5).Describe());  // red shape with area=25.00`,
    explanation: "C# has no abstract fields; use abstract properties to enforce that subclasses provide a value; the subclass can back it with a field, computed value, or any other source.",
  },
  {
    id: "cs-0519-b3-func-curry",
    language: "csharp",
    title: "Currying functions with closures",
    tag: "snippet",
    code: `// Curried add: returns a function waiting for the second argument
Func<int, Func<int, int>> add = a => b => a + b;
var add5 = add(5);   // partial application

Console.WriteLine(add5(3));   // 8
Console.WriteLine(add5(10));  // 15

// More general: curry any Func<A,B,C>
static Func<A, Func<B, C>> Curry<A, B, C>(Func<A, B, C> f)
    => a => b => f(a, b);

var curriedMultiply = Curry<int, int, int>((a, b) => a * b);
var triple = curriedMultiply(3);
Console.WriteLine(triple(7));  // 21`,
    explanation: "Currying transforms a multi-argument function into a chain of single-argument functions; in C# this is naturally expressed with nested Func<> types and lambda closures.",
  },
];
