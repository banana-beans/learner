import type { Snippet } from "./types";

export const csharpSnippets20260518B2: Snippet[] = [
  {
    id: "cs-b18-b2-linq-selectmany-flatten",
    language: "csharp",
    title: "LINQ SelectMany flattens nested sequences",
    tag: "snippet",
    code: `using System.Linq;

var departments = new[]
{
    new { Name = "eng",  Members = new[] { "Alice", "Bob" } },
    new { Name = "hr",   Members = new[] { "Carol" } },
    new { Name = "ops",  Members = new[] { "Dave", "Eve" } },
};

var allMembers = departments.SelectMany(d => d.Members).ToList();
Console.WriteLine(string.Join(", ", allMembers));
// Alice, Bob, Carol, Dave, Eve`,
    explanation: "`SelectMany` maps each element to a sub-sequence and concatenates the results — the LINQ equivalent of a nested `foreach` loop or Python's `itertools.chain.from_iterable`.",
  },
  {
    id: "cs-b18-b2-pattern-var-discard",
    language: "csharp",
    title: "var pattern and discard _ in switch",
    tag: "snippet",
    code: `object value = "hello";

string result = value switch
{
    int n when n > 0 => $"positive int: {n}",
    int n            => $"non-positive int: {n}",
    string s         => $"string of length {s.Length}",
    null             => "null",
    var other        => $"unknown: {other.GetType().Name}",
};

Console.WriteLine(result);  // string of length 5`,
    explanation: "`var pattern` matches any non-null value and binds it — essentially a typed wildcard; `_` discards and matches anything including null (the true fallthrough).",
  },
  {
    id: "cs-b18-b2-string-interpolation-verbatim",
    language: "csharp",
    title: "@$ or $@ combines verbatim and interpolated strings",
    tag: "snippet",
    code: `string user = "Alice";
string path = @$"C:\Users\{user}\Documents\report.txt";
Console.WriteLine(path);
// C:\Users\Alice\Documents\report.txt

// Multiline verbatim interpolated:
string sql = $@"
    SELECT *
    FROM Users
    WHERE Name = '{user}'
      AND Active = 1
";`,
    explanation: "`$@\"...\"` (or `@$`) combines raw verbatim strings (no escape processing) with interpolation — ideal for Windows paths, multiline SQL, or regex patterns with `{name}` placeholders.",
  },
  {
    id: "cs-b18-b2-span-write-format",
    language: "csharp",
    title: "Span-based formatting avoids string allocation",
    tag: "snippet",
    code: `Span<char> buffer = stackalloc char[64];

// TryFormat writes into the span, no heap allocation:
if (42.TryFormat(buffer, out int written, "D5"))
{
    Console.WriteLine(buffer[..written].ToString());  // 00042
}

// DateTime also supports TryFormat:
bool ok = DateTime.Now.TryFormat(buffer, out written, "yyyy-MM-dd");
Console.WriteLine(buffer[..written].ToString());`,
    explanation: "Most numeric and date types expose `TryFormat(Span<char>, out int, format)` — fills a stack-allocated span without creating a `string` heap object, useful in hot parsing loops.",
  },
  {
    id: "cs-b18-b2-linq-aggregate-custom",
    language: "csharp",
    title: "LINQ Aggregate with seed and result selector",
    tag: "snippet",
    code: `using System.Linq;

var words = new[] { "hello", "world", "foo", "bar", "baz" };

// Count total characters across all words:
int totalLen = words.Aggregate(0, (acc, w) => acc + w.Length);
Console.WriteLine(totalLen);  // 18

// Build a frequency map:
var freq = words.Aggregate(
    new Dictionary<char, int>(),
    (acc, w) => { foreach (var c in w) acc[c] = acc.GetValueOrDefault(c) + 1; return acc; });`,
    explanation: "`Aggregate(seed, accumulator)` is the LINQ equivalent of `functools.reduce` — the seed initialises the accumulator, which is passed to each element transform.",
  },
  {
    id: "cs-b18-b2-task-whenall-results",
    language: "csharp",
    title: "Task.WhenAll collects results from multiple tasks",
    tag: "snippet",
    code: `async Task<string> Fetch(string url, int delay)
{
    await Task.Delay(delay);
    return $"response from {url}";
}

// All three run concurrently:
string[] results = await Task.WhenAll(
    Fetch("a.com", 100),
    Fetch("b.com", 200),
    Fetch("c.com", 50)
);

foreach (var r in results)
    Console.WriteLine(r);
// response from a.com
// response from b.com
// response from c.com`,
    explanation: "`Task.WhenAll` runs all tasks concurrently and returns an array of results in argument order when all complete — if any task faults, the aggregate exception wraps all errors.",
  },
  {
    id: "cs-b18-b2-pattern-deconstruct-switch",
    language: "csharp",
    title: "Deconstruct in switch patterns",
    tag: "snippet",
    code: `record Point(int X, int Y);

string Quadrant(Point p) => p switch
{
    (0, 0)           => "origin",
    (> 0, > 0)       => "Q1",
    (< 0, > 0)       => "Q2",
    (< 0, < 0)       => "Q3",
    (> 0, < 0)       => "Q4",
    ({ } x, 0)       => $"x-axis at {x}",
    (0, { } y)       => $"y-axis at {y}",
    _                => "unknown"
};

Console.WriteLine(Quadrant(new Point(3, -2)));   // Q4
Console.WriteLine(Quadrant(new Point(0, 5)));    // y-axis at 5`,
    explanation: "Records deconstruct in positional patterns — the switch arm `(> 0, > 0)` matches when `X > 0 and Y > 0`. Works for any type with a `Deconstruct` method.",
  },
  {
    id: "cs-b18-b2-enumerable-skip-take",
    language: "csharp",
    title: "Skip and Take for pagination",
    tag: "snippet",
    code: `using System.Linq;

var items = Enumerable.Range(1, 100).ToList();

int page = 2, pageSize = 10;

var page2 = items.Skip((page - 1) * pageSize).Take(pageSize).ToList();
Console.WriteLine(string.Join(", ", page2));  // 11, 12, ..., 20

// .NET 6+: SkipLast / TakeLast
var last5 = items.TakeLast(5).ToList();
Console.WriteLine(string.Join(", ", last5));  // 96, 97, 98, 99, 100`,
    explanation: "`Skip(n).Take(pageSize)` is the standard LINQ pagination idiom; for `IQueryable` this translates to SQL `OFFSET ... FETCH NEXT` — avoid calling `Count()` separately as it hits the DB twice.",
  },
  {
    id: "cs-b18-b2-nullable-value-getvalueodefault",
    language: "csharp",
    title: "Nullable<T> GetValueOrDefault avoids HasValue checks",
    tag: "snippet",
    code: `int? a = 42;
int? b = null;

Console.WriteLine(a.GetValueOrDefault());    // 42
Console.WriteLine(b.GetValueOrDefault());    // 0
Console.WriteLine(b.GetValueOrDefault(-1));  // -1

// The ?? operator is equivalent and more idiomatic:
int result = b ?? -1;
Console.WriteLine(result);  // -1

// HasValue is useful for conditional logic:
if (a.HasValue)
    Console.WriteLine(a.Value * 2);  // 84`,
    explanation: "`GetValueOrDefault(fallback)` avoids a `HasValue` check when you just want a default; use `??` for the inline form — accessing `.Value` on null throws `InvalidOperationException`.",
  },
  {
    id: "cs-b18-b2-environment-getvar",
    language: "csharp",
    title: "Environment.GetEnvironmentVariable with null handling",
    tag: "snippet",
    code: `string? host = Environment.GetEnvironmentVariable("DB_HOST");
string  port = Environment.GetEnvironmentVariable("DB_PORT") ?? "5432";

if (host is null)
    throw new InvalidOperationException("DB_HOST is required");

Console.WriteLine($"Connecting to {host}:{port}");

// Set for the current process:
Environment.SetEnvironmentVariable("TEMP_FLAG", "1");`,
    explanation: "`GetEnvironmentVariable` returns `null` when the variable is absent — always handle the null case; use `??` for optional variables with defaults.",
  },
  {
    id: "cs-b18-b2-span-indexof-parse",
    language: "csharp",
    title: "Using ReadOnlySpan<char> to parse numbers without allocation",
    tag: "snippet",
    code: `ReadOnlySpan<char> input = "price: 1234.56 USD";

// Find the number portion:
int start = input.IndexOf(' ') + 1;
int end   = input.LastIndexOf(' ');
ReadOnlySpan<char> numPart = input[start..end];

double price = double.Parse(numPart);   // no substring allocation
Console.WriteLine(price);  // 1234.56`,
    explanation: "`double.Parse(ReadOnlySpan<char>)` and similar overloads parse directly from a span — no intermediate `string` allocation, critical for high-throughput text parsing.",
  },
  {
    id: "cs-b18-b2-iasyncenumerable-cancellation",
    language: "csharp",
    title: "Cancellation in IAsyncEnumerable with [EnumeratorCancellation]",
    tag: "snippet",
    code: `using System.Runtime.CompilerServices;

async IAsyncEnumerable<int> Stream(
    int count,
    [EnumeratorCancellation] CancellationToken ct = default)
{
    for (int i = 0; i < count; i++)
    {
        ct.ThrowIfCancellationRequested();
        await Task.Delay(10, ct);
        yield return i;
    }
}

using var cts = new CancellationTokenSource(TimeSpan.FromMilliseconds(35));
await foreach (int item in Stream(100).WithCancellation(cts.Token))
    Console.WriteLine(item);`,
    explanation: "`[EnumeratorCancellation]` marks the parameter that receives the token from `.WithCancellation()`; calling `ct.ThrowIfCancellationRequested()` stops iteration gracefully.",
  },
  {
    id: "cs-b18-b2-readonly-struct",
    language: "csharp",
    title: "readonly struct prevents defensive copies",
    tag: "understanding",
    code: `struct Mutable  { public int X; public void Inc() => X++; }
readonly struct Immutable { public int X { get; init; } }

Mutable m = new Mutable { X = 1 };
// Calling method on readonly context makes a COPY:
readonly Mutable rm = new Mutable { X = 1 };
rm.Inc();                        // modifies a copy — rm.X still 1!
Console.WriteLine(rm.X);        // 1

Immutable im = new Immutable { X = 1 };
// No copy needed — struct is readonly`,
    explanation: "When a struct method isn't read-only, the compiler creates a defensive copy before calling it on a `readonly` variable — `readonly struct` eliminates this by forbidding all mutation.",
  },
  {
    id: "cs-b18-b2-generic-constraint-multiple",
    language: "csharp",
    title: "Multiple generic constraints with where clauses",
    tag: "types",
    code: `using System.Numerics;

T Max<T>(T a, T b)
    where T : struct,           // value type
              IComparable<T>,   // can compare
              IMinMaxValue<T>   // has Min/MaxValue (INumber<T> subset)
{
    return a.CompareTo(b) >= 0 ? a : b;
}

Console.WriteLine(Max(3, 7));        // 7
Console.WriteLine(Max(3.14, 2.71));  // 3.14`,
    explanation: "Multiple `where` constraints are ANDed — the type argument must satisfy all of them; combining `struct` with `IComparable<T>` avoids boxing and ensures comparability.",
  },
  {
    id: "cs-b18-b2-interface-default-method",
    language: "csharp",
    title: "Interface default methods for API evolution (C# 8)",
    tag: "types",
    code: `interface IGreeter
{
    string Greet(string name);

    // Default method added later — existing implementors still compile
    string GreetLoudly(string name) =>
        Greet(name).ToUpperInvariant() + "!";
}

class SimpleGreeter : IGreeter
{
    public string Greet(string name) => $"Hello, {name}";
    // GreetLoudly uses the default implementation
}

IGreeter g = new SimpleGreeter();
Console.WriteLine(g.GreetLoudly("Alice"));  // HELLO, ALICE!`,
    explanation: "Interface default methods allow adding new members without breaking existing implementors — they're resolved via the interface type (not the class), so only visible through `IGreeter`, not `SimpleGreeter`.",
  },
  {
    id: "cs-b18-b2-record-struct-new",
    language: "csharp",
    title: "record struct for value-type records (C# 10)",
    tag: "types",
    code: `record struct Point(double X, double Y)
{
    public double Length => Math.Sqrt(X * X + Y * Y);
}

var p1 = new Point(3, 4);
var p2 = p1 with { Y = 0 };   // with-expression on struct

Console.WriteLine(p1.Length);   // 5
Console.WriteLine(p2);          // Point { X = 3, Y = 0 }
Console.WriteLine(p1 == p2);    // False — value equality

// record struct is a VALUE type — allocated on the stack`,
    explanation: "`record struct` combines record semantics (value equality, `with`-expression, deconstruction) with struct semantics (value type, stack allocation) — ideal for lightweight immutable values.",
  },
  {
    id: "cs-b18-b2-using-alias-everything",
    language: "csharp",
    title: "using aliases for complex generic types (C# 12)",
    tag: "types",
    code: `using IntMatrix    = int[,];
using NamedPoint   = (string Label, double X, double Y);
using ErrorHandler = System.Action<System.Exception>;

NamedPoint origin = ("O", 0.0, 0.0);
Console.WriteLine(origin.Label);  // O
Console.WriteLine(origin.X);      // 0

ErrorHandler log = ex => Console.WriteLine(ex.Message);

IntMatrix grid = new int[3, 3];
grid[1, 1] = 42;`,
    explanation: "C# 12 lifts restrictions on `using` aliases — tuples, arrays, and generic types can all be aliased, reducing noise in signatures that use complex types repeatedly.",
  },
  {
    id: "cs-b18-b2-exception-filter-when",
    language: "csharp",
    title: "Exception filters with when clause",
    tag: "types",
    code: `async Task<string> FetchWithRetry(string url, int maxAttempts = 3)
{
    for (int attempt = 1; attempt <= maxAttempts; attempt++)
    {
        try
        {
            return await new HttpClient().GetStringAsync(url);
        }
        catch (HttpRequestException ex)
            when (attempt < maxAttempts)
        {
            Console.WriteLine($"Attempt {attempt} failed: {ex.Message}");
            await Task.Delay(attempt * 100);
        }
        // On last attempt, exception propagates naturally
    }
    throw new UnreachableException();
}`,
    explanation: "`catch (Ex) when (condition)` catches the exception only when the filter is true; on the last attempt the filter is false, so the exception propagates without being caught and re-thrown.",
  },
  {
    id: "cs-b18-b2-delegate-variance",
    language: "csharp",
    title: "Delegate covariance and contravariance",
    tag: "types",
    code: `class Animal { }
class Dog : Animal { }

Func<Dog>    dogFactory    = () => new Dog();
Func<Animal> animalFactory = dogFactory;   // covariant return

Action<Animal> handleAnimal = a => Console.WriteLine(a.GetType().Name);
Action<Dog>    handleDog    = handleAnimal;   // contravariant parameter

handleDog(new Dog());   // Dog`,
    explanation: "`Func<TResult>` is covariant in `TResult` (you can assign `Func<Dog>` to `Func<Animal>`); `Action<T>` is contravariant in `T` (you can assign `Action<Animal>` to `Action<Dog>`).",
  },
  {
    id: "cs-b18-b2-immutablearray",
    language: "csharp",
    title: "ImmutableArray<T> vs ImmutableList<T> — tradeoffs",
    tag: "structures",
    code: `using System.Collections.Immutable;

// ImmutableArray: fast indexing (underlying T[]), slow mutation
ImmutableArray<int> arr = ImmutableArray.Create(1, 2, 3);
ImmutableArray<int> arr2 = arr.Add(4);   // creates new array

// ImmutableList: O(log n) indexing (AVL tree), fast mutation
ImmutableList<int> lst = ImmutableList.Create(1, 2, 3);
ImmutableList<int> lst2 = lst.Add(4);   // structural share

Console.WriteLine(arr[0]);   // 1
Console.WriteLine(lst[0]);   // 1`,
    explanation: "`ImmutableArray<T>` is a wrapper over `T[]` — O(1) indexing, great for read-heavy usage; `ImmutableList<T>` uses structural sharing with an AVL tree — better for frequent small mutations.",
  },
  {
    id: "cs-b18-b2-frozen-dictionary",
    language: "csharp",
    title: "FrozenDictionary for maximum read throughput",
    tag: "structures",
    code: `using System.Collections.Frozen;

// Build once (expensive); read many times (very fast)
var config = new Dictionary<string, string>
{
    ["host"] = "localhost",
    ["port"] = "5432",
    ["db"]   = "myapp",
}.ToFrozenDictionary();

// Lookups are faster than Dictionary due to optimised layout
Console.WriteLine(config["host"]);         // localhost
Console.WriteLine(config.ContainsKey("port"));  // True`,
    explanation: "`FrozenDictionary<TKey, TValue>` (.NET 8) is built once and optimised for read performance — its perfect hash avoids collision probing, making it faster than `Dictionary` for static datasets.",
  },
  {
    id: "cs-b18-b2-weakreference-cache",
    language: "csharp",
    title: "WeakReference<T> for cache entries that shouldn't block GC",
    tag: "structures",
    code: `var cache = new Dictionary<string, WeakReference<byte[]>>();

// Store a large buffer:
byte[] buffer = new byte[1024 * 1024];
cache["large"] = new WeakReference<byte[]>(buffer);

// Retrieve if still alive:
if (cache["large"].TryGetTarget(out byte[]? found))
    Console.WriteLine($"cached: {found.Length} bytes");

buffer = null!;   // release strong reference
GC.Collect();

// May now return false — object eligible for collection
Console.WriteLine(cache["large"].TryGetTarget(out _));`,
    explanation: "`WeakReference<T>.TryGetTarget` returns the object if it's still alive — weak references don't prevent GC, so cached objects are freed under memory pressure.",
  },
  {
    id: "cs-b18-b2-channels",
    language: "csharp",
    title: "Channel<T> for producer-consumer pipelines",
    tag: "structures",
    code: `using System.Threading.Channels;

// Bounded channel limits backpressure
var channel = Channel.CreateBounded<string>(capacity: 10);
ChannelWriter<string> writer = channel.Writer;
ChannelReader<string> reader = channel.Reader;

// Producer:
_ = Task.Run(async () =>
{
    foreach (var item in new[] { "a", "b", "c" })
    {
        await writer.WriteAsync(item);
    }
    writer.Complete();
});

// Consumer:
await foreach (string item in reader.ReadAllAsync())
    Console.WriteLine(item);`,
    explanation: "`Channel<T>` is an async producer-consumer queue; bounded channels apply back-pressure to the producer when full; `ReadAllAsync` completes when `writer.Complete()` is called.",
  },
  {
    id: "cs-b18-b2-memory-owner",
    language: "csharp",
    title: "IMemoryOwner<T> for pooled buffer management",
    tag: "structures",
    code: `using System.Buffers;

// Rent a buffer from the pool:
IMemoryOwner<byte> owner = MemoryPool<byte>.Shared.Rent(4096);

try
{
    Memory<byte> buffer = owner.Memory;
    buffer.Span.Fill(0);
    // use buffer...
    Console.WriteLine(buffer.Length);  // >= 4096 (may be larger)
}
finally
{
    owner.Dispose();   // returns buffer to the pool
}`,
    explanation: "`IMemoryOwner<T>` owns a `Memory<T>` slice from the pool; `Dispose` returns it — the `using` or `try/finally` pattern ensures the buffer is always returned.",
  },
  {
    id: "cs-b18-b2-linq-left-outer-join",
    language: "csharp",
    title: "LINQ left outer join using GroupJoin",
    tag: "snippet",
    code: `using System.Linq;

var customers = new[] { (Id: 1, Name: "Alice"), (Id: 2, Name: "Bob") };
var orders    = new[] { (CustomerId: 1, Total: 100), (CustomerId: 1, Total: 200) };

var result = customers
    .GroupJoin(orders, c => c.Id, o => o.CustomerId,
               (c, os) => (c.Name, OrderCount: os.Count()));

foreach (var r in result)
    Console.WriteLine($"{r.Name}: {r.OrderCount} orders");
// Alice: 2 orders
// Bob: 0 orders`,
    explanation: "`GroupJoin` performs a left outer join — every left element is included with a (possibly empty) collection of matching right elements, then projected into the result.",
  },
  {
    id: "cs-b18-b2-await-configureawait",
    language: "csharp",
    title: "ConfigureAwait(false) for library code",
    tag: "caveats",
    code: `// LIBRARY CODE: should not capture synchronization context
async Task<string> LibraryFetchAsync(string url)
{
    // ConfigureAwait(false): resume on thread pool, not captured context
    var response = await new HttpClient()
        .GetStringAsync(url)
        .ConfigureAwait(false);

    // Safe to use response here — no captured context needed
    return response.Substring(0, 100);
}

// APPLICATION CODE: let context propagate to update UI
async void Button_Click(object sender, EventArgs e)
{
    string data = await LibraryFetchAsync("http://example.com");
    // Still on UI thread — can update UI
}`,
    explanation: "`ConfigureAwait(false)` prevents capturing the `SynchronizationContext`, improving library throughput; app code (UI/ASP.NET) should generally avoid it so continuations run on the correct context.",
  },
  {
    id: "cs-b18-b2-string-ordinal-comparison",
    language: "csharp",
    title: "Use StringComparison.Ordinal for keys and IDs",
    tag: "caveats",
    code: `var lookup = new Dictionary<string, int>(StringComparer.Ordinal)
{
    ["user:1"] = 100,
    ["user:2"] = 200,
};

// Always specify comparison for code that runs across cultures:
bool found = lookup.ContainsKey("user:1");   // True

// File paths: use OrdinalIgnoreCase on Windows
bool pathMatch = string.Equals(
    "Report.txt", "report.txt",
    StringComparison.OrdinalIgnoreCase);   // True

Console.WriteLine(found);
Console.WriteLine(pathMatch);`,
    explanation: "Use `Ordinal` (or `OrdinalIgnoreCase`) for programmatic identifiers, keys, and file paths — it's faster and consistent across cultures; use `CurrentCulture` only for user-visible text sorting.",
  },
  {
    id: "cs-b18-b2-dispose-pattern-checked",
    language: "csharp",
    title: "Dispose guard prevents double-dispose errors",
    tag: "caveats",
    code: `class ManagedResource : IDisposable
{
    private bool _disposed;

    protected virtual void Dispose(bool disposing)
    {
        if (_disposed) return;  // guard against double calls

        if (disposing)
        {
            // free managed resources
        }
        // free unmanaged resources

        _disposed = true;
    }

    public void Dispose()
    {
        Dispose(true);
        GC.SuppressFinalize(this);
    }

    public void DoWork()
    {
        ObjectDisposedException.ThrowIf(_disposed, this);
        Console.WriteLine("working");
    }
}`,
    explanation: "The canonical Dispose pattern uses a `_disposed` guard so double-calling `Dispose` is a no-op; `ObjectDisposedException.ThrowIf` (.NET 7) replaces the manual check in other methods.",
  },
  {
    id: "cs-b18-b2-int-overflow-checked",
    language: "csharp",
    title: "Integer arithmetic wraps by default — use checked or nint carefully",
    tag: "caveats",
    code: `// Silent wrap (default, unchecked):
int max = int.MaxValue;
int wrapped = max + 1;
Console.WriteLine(wrapped);   // -2147483648 (silently wrong)

// Checked: throws OverflowException:
try
{
    int overflow = checked(max + 1);
}
catch (OverflowException)
{
    Console.WriteLine("overflow detected");
}

// Use long for sums of many ints:
long safeSum = (long)max + 1;
Console.WriteLine(safeSum);  // 2147483648`,
    explanation: "C# arithmetic wraps silently by default; use `checked(...)` or the project-wide `<CheckForOverflowUnderflow>true</CheckForOverflowUnderflow>` MSBuild property to detect overflow at runtime.",
  },
  {
    id: "cs-b18-b2-datetime-kind-unspecified",
    language: "csharp",
    title: "DateTime.Kind = Unspecified is a silent timezone bug",
    tag: "caveats",
    code: `// Parsed DateTime has Kind = Unspecified
DateTime dt = DateTime.Parse("2026-05-18T12:00:00");
Console.WriteLine(dt.Kind);   // Unspecified

// ToUniversalTime() on Unspecified assumes Local — often wrong in containers!
DateTime utc = dt.ToUniversalTime();   // may add/subtract offset incorrectly

// Safe: use DateTimeOffset which stores the offset:
DateTimeOffset dto = DateTimeOffset.Parse("2026-05-18T12:00:00+02:00");
Console.WriteLine(dto.UtcDateTime);   // always correct`,
    explanation: "`DateTime` with `Kind = Unspecified` is a landmine — `ToUniversalTime` assumes it's local, which is wrong in servers running in UTC. `DateTimeOffset` stores the offset explicitly.",
  },
  {
    id: "cs-b18-b2-foreach-value-type",
    language: "csharp",
    title: "foreach on a List<struct> copies the struct per iteration",
    tag: "caveats",
    code: `struct Counter { public int Value; }

var counters = new List<Counter>
{
    new Counter { Value = 0 },
    new Counter { Value = 0 },
};

// foreach gives a COPY of each struct:
foreach (var c in counters)
{
    c.Value = 99;   // modifies the copy, not the list element
}
Console.WriteLine(counters[0].Value);  // 0 — unchanged

// Use index-based access to modify structs in a List:
for (int i = 0; i < counters.Count; i++)
{
    var c = counters[i];
    c.Value = 99;
    counters[i] = c;
}`,
    explanation: "`foreach` gives you a copy of each value-type element from a `List<T>` — modifying the copy doesn't affect the original. Use indexed access to mutate struct elements in place.",
  },
  {
    id: "cs-b18-b2-static-constructor-order",
    language: "csharp",
    title: "Static field initializers and static constructor ordering",
    tag: "understanding",
    code: `class Demo
{
    // Field initializers run in textual order, before the static constructor
    public static string A = Init("A");
    public static string B = Init("B");

    static Demo()
    {
        Console.WriteLine("static ctor");
    }

    static string Init(string label)
    {
        Console.WriteLine($"init {label}");
        return label;
    }
}

_ = Demo.A;
// Output: init A  init B  static ctor`,
    explanation: "Static field initializers always run in declaration order, just before the static constructor — the static constructor sees all fields already initialized.",
  },
  {
    id: "cs-b18-b2-span-memory-differences",
    language: "csharp",
    title: "Span<T> vs Memory<T> — stack vs heap lifetimes",
    tag: "understanding",
    code: `void Synchronous(Span<byte> data)
{
    // Span: stack-only, cannot be stored in a field or heap object
    data.Fill(0xFF);
}

async Task Asynchronous(Memory<byte> data)
{
    // Memory: can cross await points and be stored in fields
    await Task.Delay(1);
    data.Span.Fill(0xFF);
}

byte[] arr = new byte[4];
Synchronous(arr);         // Span implicitly from array
await Asynchronous(arr);  // Memory implicitly from array`,
    explanation: "`Span<T>` is a ref struct that must live on the stack — it can't cross `await` points or be stored in class fields. `Memory<T>` is a regular struct that works anywhere.",
  },
  {
    id: "cs-b18-b2-value-ref-type-comparison",
    language: "csharp",
    title: "Value types compared by value; reference types by reference",
    tag: "understanding",
    code: `// Value type: == compares data
int a = 5, b = 5;
Console.WriteLine(a == b);   // True

// Reference type (class): == compares references by default
class Box { public int Val; }
var x = new Box { Val = 5 };
var y = new Box { Val = 5 };
Console.WriteLine(x == y);   // False — different objects
Console.WriteLine(ReferenceEquals(x, y));  // False

// string is reference type but == is overloaded to compare value:
string s1 = "hi", s2 = new string(new[] {'h','i'});
Console.WriteLine(s1 == s2);  // True (value equality)`,
    explanation: "`==` is value equality for value types and reference equality for class types by default; `string` overrides `==` for value semantics. Records also override `==` for value equality.",
  },
  {
    id: "cs-b18-b2-delegate-null-invoke",
    language: "csharp",
    title: "Always null-check delegates before invocation",
    tag: "understanding",
    code: `class Button
{
    // ?.Invoke is the safe null-check invocation pattern
    public event EventHandler? Clicked;

    public void Click()
    {
        // Thread-safe null check via local copy:
        var handler = Clicked;
        handler?.Invoke(this, EventArgs.Empty);
    }
}

var btn = new Button();
btn.Click();   // no subscribers — no exception

btn.Clicked += (s, e) => Console.WriteLine("clicked!");
btn.Click();   // clicked!`,
    explanation: "Copy the delegate to a local variable before the null check to avoid a TOCTOU race where another thread removes the last subscriber between the null check and invocation.",
  },
  {
    id: "cs-b18-b2-generic-type-inference",
    language: "csharp",
    title: "Generic type inference from method arguments",
    tag: "understanding",
    code: `T FirstOrDefault<T>(IEnumerable<T> source, T fallback = default!)
    => source.Any() ? source.First() : fallback;

// T inferred as int:
int result = FirstOrDefault(new[] { 1, 2, 3 });
Console.WriteLine(result);   // 1

// T inferred as string:
string? s = FirstOrDefault(Array.Empty<string>(), "none");
Console.WriteLine(s);   // none

// Cannot infer from return type — specify explicitly:
var empty = FirstOrDefault<double>(Array.Empty<double>());`,
    explanation: "The compiler infers type arguments from the types of method arguments — you rarely need to write `Method<T>(...)` explicitly. Type inference fails only when T appears solely in the return type.",
  },
  {
    id: "cs-b18-b2-interface-segregation",
    language: "csharp",
    title: "Interface segregation — keep interfaces focused",
    tag: "classes",
    code: `// Fat interface: forces implementors to provide everything
// interface IRepository { void Add(T); T Get(int); void Delete(int); void Update(T); IEnumerable<T> GetAll(); }

// Better: segregated interfaces
interface IReadRepository<T>  { T? Get(int id); IEnumerable<T> GetAll(); }
interface IWriteRepository<T> { void Add(T item); void Update(T item); void Delete(int id); }
interface IRepository<T>      : IReadRepository<T>, IWriteRepository<T> { }

class ReadOnlyCache<T> : IReadRepository<T>
{
    private readonly Dictionary<int, T> _store = new();
    public T? Get(int id) => _store.GetValueOrDefault(id);
    public IEnumerable<T> GetAll() => _store.Values;
}`,
    explanation: "Splitting a large interface into focused ones lets clients depend only on what they use — a read-only component can implement `IReadRepository<T>` without being forced to implement mutations.",
  },
  {
    id: "cs-b18-b2-generic-class-constraints",
    language: "csharp",
    title: "Generic class with new() and IDisposable constraints",
    tag: "classes",
    code: `class ResourceManager<T>
    where T : class, IDisposable, new()
{
    private T? _resource;

    public T Get() => _resource ??= new T();

    public void Reset()
    {
        _resource?.Dispose();
        _resource = null;
    }
}

class Connection : IDisposable
{
    public void Dispose() => Console.WriteLine("disposed");
}

var mgr = new ResourceManager<Connection>();
var c = mgr.Get();
mgr.Reset();   // disposed`,
    explanation: "`new()` constrains `T` to have a public parameterless constructor; combining it with `IDisposable` allows the generic class to both create and clean up instances safely.",
  },
  {
    id: "cs-b18-b2-record-inheritance",
    language: "csharp",
    title: "Record inheritance and equality across hierarchy",
    tag: "classes",
    code: `record Animal(string Name);
record Dog(string Name, string Breed) : Animal(Name);

var a = new Dog("Rex", "Labrador");
var b = new Dog("Rex", "Labrador");
var c = new Animal("Rex");

Console.WriteLine(a == b);   // True  — same type and values
Console.WriteLine(a == c);   // False — different runtime types!

// with-expression respects the actual type:
var d = a with { Breed = "Poodle" };
Console.WriteLine(d);   // Dog { Name = Rex, Breed = Poodle }`,
    explanation: "Record equality checks the runtime type first — `Dog(\"Rex\", ...) != Animal(\"Rex\")` even though `Animal` is a base record. `with`-expression on a `Dog` returns a `Dog`.",
  },
  {
    id: "cs-b18-b2-static-abstract-interface",
    language: "csharp",
    title: "Static abstract interface members for generic math (C# 11)",
    tag: "classes",
    code: `interface IAddable<T> where T : IAddable<T>
{
    static abstract T Zero { get; }
    static abstract T operator +(T a, T b);
}

T Sum<T>(IEnumerable<T> items) where T : IAddable<T>
{
    T total = T.Zero;
    foreach (var item in items)
        total = total + item;
    return total;
}

struct Currency(decimal Amount) : IAddable<Currency>
{
    public static Currency Zero => new(0);
    public static Currency operator +(Currency a, Currency b) => new(a.Amount + b.Amount);
}

Console.WriteLine(Sum(new[] { new Currency(10), new Currency(5) }).Amount);  // 15`,
    explanation: "Static abstract interface members (C# 11) allow writing generic algorithms that call static methods (`T.Zero`, `T.operator+`) on type parameters — the foundation of .NET 7's generic math.",
  },
  {
    id: "cs-b18-b2-extension-method-fluent",
    language: "csharp",
    title: "Extension methods for fluent domain DSLs",
    tag: "classes",
    code: `static class QueryExtensions
{
    public static IEnumerable<T> WhereNotNull<T>(this IEnumerable<T?> src)
        where T : class
        => src.Where(x => x is not null).Select(x => x!);

    public static string ToCommaSeparated<T>(
        this IEnumerable<T> src, Func<T, string>? selector = null)
        => string.Join(", ", selector is null ? src.Select(x => x?.ToString()) : src.Select(selector));
}

string?[] names = { "Alice", null, "Bob", null, "Carol" };
Console.WriteLine(names.WhereNotNull().ToCommaSeparated());
// Alice, Bob, Carol`,
    explanation: "Extension methods can be chained fluently; targeting `IEnumerable<T?>` and returning `IEnumerable<T>` (non-nullable) is a common pattern for null-filtering pipelines.",
  },
  {
    id: "cs-b18-b2-pattern-relational",
    language: "csharp",
    title: "Relational patterns for numeric range checks",
    tag: "snippet",
    code: `static string Grade(int score) => score switch
{
    >= 90 => "A",
    >= 80 => "B",
    >= 70 => "C",
    >= 60 => "D",
    _     => "F",
};

Console.WriteLine(Grade(95));   // A
Console.WriteLine(Grade(73));   // C
Console.WriteLine(Grade(45));   // F

// Combine with and:
static bool IsWorkingHour(int hour) =>
    hour is >= 9 and <= 17;`,
    explanation: "Relational patterns (`>= n`, `< n`) in switch arms eliminate if/else if chains for numeric ranges; they short-circuit top-to-bottom like traditional if chains.",
  },
  {
    id: "cs-b18-b2-iequatable-struct",
    language: "csharp",
    title: "Implementing IEquatable<T> on a struct for performance",
    tag: "classes",
    code: `struct Coordinate : IEquatable<Coordinate>
{
    public double Lat { get; }
    public double Lon { get; }
    public Coordinate(double lat, double lon) { Lat = lat; Lon = lon; }

    public bool Equals(Coordinate other) =>
        Math.Abs(Lat - other.Lat) < 1e-9 &&
        Math.Abs(Lon - other.Lon) < 1e-9;

    public override bool Equals(object? obj) =>
        obj is Coordinate c && Equals(c);

    public override int GetHashCode() =>
        HashCode.Combine(Math.Round(Lat, 7), Math.Round(Lon, 7));
}

var a = new Coordinate(51.5, -0.1);
var b = new Coordinate(51.5, -0.1);
Console.WriteLine(a.Equals(b));  // True (no boxing)`,
    explanation: "Implementing `IEquatable<T>` on structs avoids boxing when the struct is compared in collections; the generic `Equals(T)` overload is called instead of the `object` overload.",
  },
  {
    id: "cs-b18-b2-partial-class-generated",
    language: "csharp",
    title: "Partial class for separating generated and hand-written code",
    tag: "classes",
    code: `// Generated file: OrderEntity.Generated.cs
partial class OrderEntity
{
    public int Id { get; set; }
    public string Customer { get; set; } = "";
    public decimal Total { get; set; }
}

// Hand-written file: OrderEntity.cs
partial class OrderEntity
{
    public bool IsHighValue => Total > 1_000m;

    public string Summary =>
        $"Order #{Id} for {Customer}: {Total:C}";
}

var order = new OrderEntity { Id = 1, Customer = "Alice", Total = 1_500m };
Console.WriteLine(order.IsHighValue);  // True`,
    explanation: "Partial classes split across files allow generated code (from EF scaffolding, source generators, or designers) to live separately from hand-written logic — regenerating one file won't overwrite the other.",
  },
  {
    id: "cs-b18-b2-linq-minmaxby",
    language: "csharp",
    title: "LINQ MinBy and MaxBy return the element, not the key",
    tag: "snippet",
    code: `using System.Linq;

var products = new[]
{
    (Name: "apple",  Price: 1.50),
    (Name: "banana", Price: 0.75),
    (Name: "cherry", Price: 3.00),
};

var cheapest   = products.MinBy(p => p.Price);
var mostExpensive = products.MaxBy(p => p.Price);

Console.WriteLine(cheapest.Name);       // banana
Console.WriteLine(mostExpensive.Name);  // cherry`,
    explanation: "`MinBy(key)` and `MaxBy(key)` (.NET 6+) return the element with the minimum/maximum key, unlike `Min(selector)` which returns the key value itself — no need to `OrderBy(...).First()`.",
  },
  {
    id: "cs-b18-b2-record-custom-equality",
    language: "csharp",
    title: "Overriding Equals in a record for custom semantics",
    tag: "classes",
    code: `record Temperature(double Celsius)
{
    // Override to allow tolerance-based equality:
    public virtual bool Equals(Temperature? other) =>
        other is not null &&
        Math.Abs(Celsius - other.Celsius) < 0.01;

    public override int GetHashCode() =>
        ((int)Math.Round(Celsius, 1)).GetHashCode();
}

var a = new Temperature(20.00);
var b = new Temperature(20.005);
Console.WriteLine(a == b);   // True  (within tolerance)`,
    explanation: "Records use value equality by default; override `Equals(T? other)` (the typed overload, not `object`) to customise equality semantics while keeping record syntax.",
  },
  {
    id: "cs-b18-b2-observer-event-pattern",
    language: "csharp",
    title: "Observer pattern via events and EventHandler<T>",
    tag: "classes",
    code: `class StockTicker
{
    public event EventHandler<decimal>? PriceChanged;

    private decimal _price;
    public decimal Price
    {
        get => _price;
        set
        {
            if (value != _price)
            {
                _price = value;
                PriceChanged?.Invoke(this, value);
            }
        }
    }
}

var ticker = new StockTicker();
ticker.PriceChanged += (s, price) =>
    Console.WriteLine($"New price: {price:C}");

ticker.Price = 150.00m;   // New price: $150.00
ticker.Price = 150.00m;   // no event (same price)
ticker.Price = 148.50m;   // New price: $148.50`,
    explanation: "Events restrict access to `+=`/`-=` from outside the class; `EventHandler<TData>` is the standard delegate signature — `sender` and `data` match .NET framework conventions.",
  },
  {
    id: "cs-b18-b2-linq-distinct-by",
    language: "csharp",
    title: "LINQ DistinctBy for deduplication by key (.NET 6+)",
    tag: "snippet",
    code: `using System.Linq;

var items = new[]
{
    (Id: 1, Name: "apple"),
    (Id: 2, Name: "banana"),
    (Id: 1, Name: "apple (duplicate id)"),
    (Id: 3, Name: "cherry"),
};

var unique = items.DistinctBy(x => x.Id).ToList();
foreach (var item in unique)
    Console.WriteLine(item);
// (1, apple)  (2, banana)  (3, cherry)`,
    explanation: "`DistinctBy(key)` (.NET 6+) keeps the first element for each unique key value — cleaner than `GroupBy(k).Select(g => g.First())` and uses a `HashSet` internally.",
  },
  {
    id: "cs-b18-b2-string-pool-intern",
    language: "csharp",
    title: "String.Intern for explicit string pooling",
    tag: "understanding",
    code: `string a = string.Intern("hello world");
string b = string.Intern("hello world");

Console.WriteLine(ReferenceEquals(a, b));   // True — same pooled object

// Interning is automatic for string literals:
string c = "hello";
string d = "hello";
Console.WriteLine(ReferenceEquals(c, d));   // True (literal pool)

// Runtime strings are not interned automatically:
string e = new string("hello".ToCharArray());
string f = new string("hello".ToCharArray());
Console.WriteLine(ReferenceEquals(e, f));   // False`,
    explanation: "`String.Intern` adds a string to the intern pool and returns the pooled reference; subsequent `Intern` calls for equal strings return the same reference — enables O(1) identity comparison.",
  },
  {
    id: "cs-b18-b2-async-enumerable-producer",
    language: "csharp",
    title: "async yield with IAsyncEnumerable<T>",
    tag: "snippet",
    code: `using System.IO;

async IAsyncEnumerable<string> ReadLinesAsync(string path)
{
    using var reader = new StreamReader(path);
    string? line;
    while ((line = await reader.ReadLineAsync()) is not null)
        yield return line;
}

// Consuming:
// await foreach (var line in ReadLinesAsync("data.txt"))
//     Console.WriteLine(line);`,
    explanation: "An `async` method that `yield return`s items produces an `IAsyncEnumerable<T>`; each `ReadLineAsync` call suspends the coroutine, freeing the thread until data arrives.",
  },
  {
    id: "cs-b18-b2-interpolated-handler",
    language: "csharp",
    title: "Custom interpolated string handler avoids allocation when unused",
    tag: "types",
    code: `using System.Runtime.CompilerServices;

[InterpolatedStringHandler]
struct LogHandler
{
    private readonly System.Text.StringBuilder _builder;
    public LogHandler(int literalLength, int formattedCount, bool enabled, out bool shouldFormat)
    {
        shouldFormat = enabled;
        _builder = enabled ? new System.Text.StringBuilder() : null!;
    }

    public void AppendLiteral(string s) => _builder?.Append(s);
    public void AppendFormatted<T>(T value) => _builder?.Append(value);
    public override string ToString() => _builder?.ToString() ?? "";
}

void Log(bool enabled, [InterpolatedStringHandler] LogHandler handler)
{
    if (enabled) Console.WriteLine(handler.ToString());
}`,
    explanation: "Custom interpolated string handlers (C# 10) receive components before building the string — if `shouldFormat = false`, the interpolation work is skipped entirely, avoiding allocation.",
  },
  {
    id: "cs-b18-b2-generic-math-interface",
    language: "csharp",
    title: "INumber<T> in .NET 7 for numeric algorithms",
    tag: "types",
    code: `using System.Numerics;

static T Average<T>(IEnumerable<T> items)
    where T : INumber<T>
{
    T sum = T.Zero;
    int count = 0;
    foreach (var item in items)
    {
        sum += item;
        count++;
    }
    return sum / T.CreateChecked(count);
}

Console.WriteLine(Average(new[] { 10, 20, 30 }));        // 20
Console.WriteLine(Average(new[] { 1.0, 2.0, 3.0 }));     // 2`,
    explanation: "`INumber<T>` abstracts over all numeric types including `int`, `long`, `double`, `decimal`, and user-defined types — enabling one generic implementation instead of per-type overloads.",
  },
  {
    id: "cs-b18-b2-async-lock",
    language: "csharp",
    title: "SemaphoreSlim(1,1) as an async mutual exclusion lock",
    tag: "snippet",
    code: `using System.Threading;

class AsyncQueue<T>
{
    private readonly List<T> _items = new();
    private readonly SemaphoreSlim _lock = new SemaphoreSlim(1, 1);

    public async Task AddAsync(T item)
    {
        await _lock.WaitAsync();
        try   { _items.Add(item); }
        finally { _lock.Release(); }
    }

    public int Count => _items.Count;
}

var q = new AsyncQueue<int>();
await Task.WhenAll(Task.Run(() => q.AddAsync(1)), Task.Run(() => q.AddAsync(2)));
Console.WriteLine(q.Count);  // 2`,
    explanation: "`SemaphoreSlim(1, 1)` acts as a mutex for async code — `WaitAsync()` suspends the coroutine rather than blocking the thread, making it safe inside async methods.",
  },
  {
    id: "cs-b18-b2-primary-ctor-base",
    language: "csharp",
    title: "Primary constructor chaining with base (C# 12)",
    tag: "classes",
    code: `class Shape(string Color)
{
    public string Color { get; } = Color;
}

class Circle(string Color, double Radius) : Shape(Color)
{
    public double Radius { get; } = Radius;
    public double Area => Math.PI * Radius * Radius;
}

var c = new Circle("red", 5.0);
Console.WriteLine(c.Color);   // red
Console.WriteLine(c.Area);    // 78.5398...`,
    explanation: "Primary constructor parameters can be passed directly to the base constructor, eliminating the need for explicit constructor bodies in simple inheritance hierarchies.",
  },
  {
    id: "cs-b18-b2-linq-zip-three",
    language: "csharp",
    title: "LINQ Zip with three sequences (.NET 6+)",
    tag: "snippet",
    code: `using System.Linq;

var names   = new[] { "Alice", "Bob", "Carol" };
var scores  = new[] { 95, 82, 78 };
var grades  = new[] { "A", "B+", "B" };

var combined = names.Zip(scores, grades)
    .Select(t => $"{t.First}: {t.Second} ({t.Third})");

foreach (var line in combined)
    Console.WriteLine(line);
// Alice: 95 (A)
// Bob: 82 (B+)
// Carol: 78 (B)`,
    explanation: "`Zip(second, third)` (.NET 6+) zips three sequences into tuples — the result stops at the shortest sequence. Older code needed nested `Zip` calls with custom result selectors.",
  },
  {
    id: "cs-b18-b2-abstract-static-interface-math",
    language: "csharp",
    title: "Abstract static operators in interfaces for type-safe domain math",
    tag: "classes",
    code: `interface IVector2D<T> where T : IVector2D<T>
{
    static abstract T operator +(T a, T b);
    static abstract T Scale(T v, double factor);
}

record struct Vec2(double X, double Y) : IVector2D<Vec2>
{
    public static Vec2 operator +(Vec2 a, Vec2 b) => new(a.X + b.X, a.Y + b.Y);
    public static Vec2 Scale(Vec2 v, double f) => new(v.X * f, v.Y * f);
}

T MoveBy<T>(T pos, T delta) where T : IVector2D<T> => pos + delta;

var result = MoveBy(new Vec2(1, 2), new Vec2(3, 4));
Console.WriteLine(result);  // Vec2 { X = 4, Y = 6 }`,
    explanation: "Static abstract interface operators enable generic algorithms that apply arithmetic on custom types — a key pattern in geometry, physics simulations, and unit-typed quantities.",
  },
  {
    id: "cs-b18-b2-valuetuple-return",
    language: "csharp",
    title: "ValueTuple returns for multiple values without out params",
    tag: "snippet",
    code: `(double Min, double Max, double Average) Stats(IEnumerable<double> data)
{
    double min = double.MaxValue, max = double.MinValue, sum = 0;
    int count = 0;
    foreach (var x in data) { if (x < min) min = x; if (x > max) max = x; sum += x; count++; }
    return (min, max, sum / count);
}

var (min, max, avg) = Stats(new[] { 3.0, 1.0, 4.0, 1.0, 5.0 });
Console.WriteLine($"min={min} max={max} avg={avg}");  // 1 5 2.8`,
    explanation: "Named tuple returns avoid `out` parameters and custom structs for simple multi-value returns; the caller can destructure with `var (a, b, c) = method()` or use `.Name` property access.",
  },
  {
    id: "cs-b18-b2-caller-info-attributes",
    language: "csharp",
    title: "[CallerMemberName], [CallerFilePath], [CallerLineNumber]",
    tag: "snippet",
    code: `using System.Runtime.CompilerServices;

static void Log(
    string message,
    [CallerMemberName] string member = "",
    [CallerFilePath]   string file   = "",
    [CallerLineNumber] int    line   = 0)
{
    Console.WriteLine($"{file}:{line} ({member}): {message}");
}

void DoWork()
{
    Log("starting work");
    // Program.cs:25 (DoWork): starting work
}`,
    explanation: "Caller info attributes are filled by the compiler at the call site — zero runtime overhead and no reflection. Useful for logging, INotifyPropertyChanged, and assertion helpers.",
  },
  {
    id: "cs-b18-b2-lock-new",
    language: "csharp",
    title: "System.Threading.Lock — faster alternative to object lock (.NET 9)",
    tag: "snippet",
    code: `using System.Threading;

// .NET 9: dedicated Lock type — better performance than 'lock (object)'
var myLock = new Lock();

Parallel.For(0, 1000, i =>
{
    using (myLock.EnterScope())
    {
        // critical section
    }
    // OR: myLock.Enter() / myLock.Exit() for try/finally
});`,
    explanation: "`System.Threading.Lock` (.NET 9) replaces `lock(object)` with a purpose-built type that avoids Monitor overhead — `EnterScope()` returns a disposable that calls `Exit()` on dispose.",
  },
  {
    id: "cs-b18-b2-span-foreach-ref",
    language: "csharp",
    title: "foreach ref over Span<T> for in-place mutation",
    tag: "snippet",
    code: `Span<int> numbers = new[] { 1, 2, 3, 4, 5 };

// ref foreach — modifies elements in place:
foreach (ref int n in numbers)
    n *= 2;

Console.WriteLine(string.Join(" ", numbers.ToArray()));  // 2 4 6 8 10`,
    explanation: "`foreach (ref T item in span)` iterates by reference — each assignment to `item` modifies the element in the original span without indexing overhead.",
  },
  {
    id: "cs-b18-b2-async-stream-cancellation",
    language: "csharp",
    title: "Combining async streams with Task.WhenAny for timeouts",
    tag: "snippet",
    code: `async IAsyncEnumerable<int> Infinite()
{
    for (int i = 0; ; i++) { await Task.Delay(50); yield return i; }
}

using var cts = new CancellationTokenSource(TimeSpan.FromMilliseconds(175));

try
{
    await foreach (int item in Infinite().WithCancellation(cts.Token))
        Console.WriteLine(item);   // 0  1  2  then cancelled
}
catch (OperationCanceledException)
{
    Console.WriteLine("stream cancelled");
}`,
    explanation: "`.WithCancellation(ct)` wires a `CancellationToken` to the `await foreach` loop; when the token is cancelled, the next `await` inside the async iterator throws `OperationCanceledException`.",
  },
  {
    id: "cs-b18-b2-collections-remove-predicate",
    language: "csharp",
    title: "List.RemoveAll for predicate-based bulk removal",
    tag: "snippet",
    code: `var items = new List<int> { 1, 2, 3, 4, 5, 6, 7, 8 };

// Remove all even numbers in one O(n) pass:
int removed = items.RemoveAll(x => x % 2 == 0);

Console.WriteLine(removed);                   // 4
Console.WriteLine(string.Join(" ", items));   // 1 3 5 7`,
    explanation: "`List.RemoveAll(predicate)` does one pass to compact the list in place — faster and cleaner than iterating backward with `Remove` calls or creating a new filtered list.",
  },
  {
    id: "cs-b18-b2-binary-search",
    language: "csharp",
    title: "Array.BinarySearch for O(log n) lookup in sorted arrays",
    tag: "snippet",
    code: `int[] sorted = { 1, 3, 5, 7, 9, 11, 13 };

int idx = Array.BinarySearch(sorted, 7);
Console.WriteLine(idx);   // 3

// Missing value returns bitwise complement of insertion point:
int missingIdx = Array.BinarySearch(sorted, 6);
Console.WriteLine(missingIdx);   // -4 (would insert at index 3)
int insertAt = ~missingIdx;
Console.WriteLine(insertAt);     // 3`,
    explanation: "`Array.BinarySearch` returns the index if found, or the bitwise complement (`~result`) of where the value would be inserted if not found — use `~result` to get the insertion point.",
  },
  {
    id: "cs-b18-b2-disposable-ref-struct",
    language: "csharp",
    title: "ref struct with Dispose for stack-based resources",
    tag: "types",
    code: `ref struct StackToken
{
    private readonly long _startTick;
    private readonly string _label;

    public StackToken(string label)
    {
        _label = label;
        _startTick = System.Diagnostics.Stopwatch.GetTimestamp();
    }

    public void Dispose()
    {
        long elapsed = System.Diagnostics.Stopwatch.GetTimestamp() - _startTick;
        Console.WriteLine($"{_label}: {elapsed} ticks");
    }
}

using var token = new StackToken("operation");
// ... do work ...
// Dispose called when 'token' goes out of scope`,
    explanation: "`ref struct` types can implement `Dispose` without implementing `IDisposable` (which would box them); `using var` still works, calling `Dispose` at scope exit.",
  },
  {
    id: "cs-b18-b2-task-completionsource",
    language: "csharp",
    title: "TaskCompletionSource for bridging callback APIs",
    tag: "snippet",
    code: `TaskCompletionSource<string> tcs = new();

// Simulate a callback-based API:
void StartLegacyOperation(Action<string, Exception?> callback)
{
    Task.Run(async () =>
    {
        await Task.Delay(100);
        callback("result", null);
    });
}

StartLegacyOperation((result, ex) =>
{
    if (ex is not null) tcs.SetException(ex);
    else tcs.SetResult(result);
});

string value = await tcs.Task;
Console.WriteLine(value);  // result`,
    explanation: "`TaskCompletionSource<T>` creates a `Task<T>` that you complete manually — the standard pattern for wrapping callback, event, or APM APIs into awaitable tasks.",
  },
  {
    id: "cs-b18-b2-dictionary-count-or-create",
    language: "csharp",
    title: "Dictionary.GetOrAdd pattern with TryGetValue",
    tag: "snippet",
    code: `var groups = new Dictionary<string, List<int>>();

int[] data = { 1, 2, 3, 4, 5, 6 };
foreach (int n in data)
{
    string key = n % 2 == 0 ? "even" : "odd";
    if (!groups.TryGetValue(key, out var list))
    {
        list = new List<int>();
        groups[key] = list;
    }
    list.Add(n);
}

Console.WriteLine(string.Join(", ", groups["even"]));  // 2, 4, 6
Console.WriteLine(string.Join(", ", groups["odd"]));   // 1, 3, 5`,
    explanation: "`TryGetValue` avoids two dictionary lookups (one for existence check, one for read); combine it with `groups[key] = new List<int>()` for a safe get-or-create pattern without a `ConcurrentDictionary`.",
  },
  {
    id: "cs-b18-b2-string-split-delimiter",
    language: "csharp",
    title: "String.Split with a multi-character delimiter",
    tag: "snippet",
    code: `string text = "one::two::three::four";

// Array of string delimiters:
string[] parts = text.Split(new[] { "::" }, StringSplitOptions.None);
Console.WriteLine(string.Join("|", parts));  // one|two|three|four

// Count-limited split:
string[] firstTwo = text.Split("::", 2);
Console.WriteLine(string.Join("|", firstTwo));  // one|two::three::four`,
    explanation: "`string.Split(new[] { \"::\" }, ...)` splits on a multi-character delimiter; passing `count` as the second argument limits the number of segments, keeping the remainder unsplit.",
  },
  {
    id: "cs-b18-b2-guid-format",
    language: "csharp",
    title: "Guid formatting and parsing",
    tag: "snippet",
    code: `var id = Guid.NewGuid();

Console.WriteLine(id);          // d3f1a2b0-...  (D format, default)
Console.WriteLine(id.ToString("N"));  // d3f1a2b0... (no hyphens)
Console.WriteLine(id.ToString("B"));  // {d3f1a2b0-...} (braces)

// Parse:
var parsed = Guid.Parse("00000000-0000-0000-0000-000000000001");
Console.WriteLine(parsed == Guid.Empty);  // False

// Zero-allocation parse from span:
Guid.TryParse("00000000-0000-0000-0000-000000000001", out var g2);`,
    explanation: "`Guid.ToString(format)` supports several formats (D, N, B, P, X); use `Guid.TryParse` for robust parsing from user input; `Guid.NewGuid()` generates a cryptographically random version 4 GUID.",
  },
  {
    id: "cs-b18-b2-file-scopednamespace",
    language: "csharp",
    title: "Using declarations vs block scopes for cleanup",
    tag: "snippet",
    code: `// Traditional: all resources inside the block
void ProcessOld(string path)
{
    using (var reader = new StreamReader(path))
    using (var writer = new StreamWriter(path + ".out"))
    {
        // deeply nested
    }
}

// C# 8+ using declaration: disposed at end of method
void ProcessNew(string path)
{
    using var reader = new StreamReader(path);
    using var writer = new StreamWriter(path + ".out");
    // same disposal order (reverse) at method end — no nesting
}`,
    explanation: "`using var` disposes at end of the enclosing scope in reverse declaration order; same semantics as nested `using(...){}` but without indentation creep.",
  },
  {
    id: "cs-b18-b2-pattern-negated",
    language: "csharp",
    title: "Negated patterns with not keyword",
    tag: "snippet",
    code: `object? obj = "hello";

// 'not null' pattern — cleaner than != null
if (obj is not null)
    Console.WriteLine(obj.GetType().Name);  // String

// Combine with type patterns:
void Process(object o)
{
    if (o is not string and not int)
        Console.WriteLine("unexpected type");
    else if (o is string s)
        Console.WriteLine($"string: {s}");
}

Process("hi");     // string: hi
Process(3.14);     // unexpected type`,
    explanation: "`not` negates any pattern; `is not null` is the idiomatic null check for nullable reference types; `not string and not int` combines negation with conjunction.",
  },
  {
    id: "cs-b18-b2-generic-where-unmanaged",
    language: "csharp",
    title: "where T : unmanaged for unsafe/Span-based generics",
    tag: "types",
    code: `using System.Runtime.InteropServices;

static int SizeOf<T>() where T : unmanaged =>
    Marshal.SizeOf<T>();

static unsafe Span<T> FromPointer<T>(T* ptr, int length)
    where T : unmanaged
    => new Span<T>(ptr, length);

Console.WriteLine(SizeOf<int>());     // 4
Console.WriteLine(SizeOf<double>());  // 8

// struct Vec3 { float X, Y, Z; }
// Console.WriteLine(SizeOf<Vec3>());  // 12`,
    explanation: "`where T : unmanaged` constrains to blittable value types (no managed references) — required for `unsafe` pointer operations, `Span<T>` creation from raw memory, and P/Invoke interop.",
  },
  {
    id: "cs-b18-b2-linq-prepend-append",
    language: "csharp",
    title: "LINQ Prepend and Append to extend sequences",
    tag: "snippet",
    code: `using System.Linq;

var middle = new[] { 2, 3, 4 };

var full = middle.Prepend(1).Append(5);
Console.WriteLine(string.Join(", ", full));  // 1, 2, 3, 4, 5

// Build header+data+footer lazily:
var header = Enumerable.Repeat("---", 1);
var footer = Enumerable.Repeat("===", 1);
var report = header.Concat(middle.Select(x => x.ToString())).Concat(footer);
Console.WriteLine(string.Join(" ", report));  // --- 2 3 4 ===`,
    explanation: "`Prepend` and `Append` return new lazy sequences with one element added at either end — they don't copy the original sequence, making them useful for framing or wrapping sequences.",
  },
  {
    id: "cs-b18-b2-format-composite",
    language: "csharp",
    title: "String.Format with composite formatting",
    tag: "snippet",
    code: `// Composite formatting: {index[,alignment][:formatString]}
string result = string.Format(
    "|{0,-10}|{1,8:N2}|",   // left-align 10, right-align 8, 2 decimals
    "Price",
    1234.56
);
Console.WriteLine(result);
// |Price     | 1,234.56|

// Equivalent f-string (prefer this in new code):
string name = "Price";
double value = 1234.56;
Console.WriteLine($"|{name,-10}|{value,8:N2}|");`,
    explanation: "Composite format strings use `{index,width:spec}` — positive width right-aligns, negative left-aligns. Prefer interpolated strings in new code; use `string.Format` for stored templates.",
  },
  {
    id: "cs-b18-b2-interface-readonly-property",
    language: "csharp",
    title: "Interface with readonly property enforces get-only contract",
    tag: "classes",
    code: `interface IShape
{
    double Area    { get; }
    double Perimeter { get; }
    string Name    { get; }
}

// Struct implementing the interface:
struct Triangle : IShape
{
    public double A, B, C;
    public string Name => "Triangle";
    public double Perimeter => A + B + C;
    public double Area
    {
        get
        {
            double s = Perimeter / 2;
            return Math.Sqrt(s * (s-A) * (s-B) * (s-C));
        }
    }
}

IShape shape = new Triangle { A = 3, B = 4, C = 5 };
Console.WriteLine(shape.Area);       // 6
Console.WriteLine(shape.Perimeter);  // 12`,
    explanation: "A `get`-only interface property can be implemented by a read-only property or even a read-write property; the interface just guarantees the get accessor is exposed.",
  },
  {
    id: "cs-b18-b2-concurrent-dict-methods",
    language: "csharp",
    title: "ConcurrentDictionary atomic operations",
    tag: "structures",
    code: `using System.Collections.Concurrent;

var counts = new ConcurrentDictionary<string, int>();

// AddOrUpdate: atomic increment
foreach (var word in new[] { "a", "b", "a", "c", "a" })
    counts.AddOrUpdate(word, 1, (key, old) => old + 1);

Console.WriteLine(counts["a"]);  // 3

// GetOrAdd with a factory to avoid double creation:
var items = new ConcurrentDictionary<int, List<int>>();
items.GetOrAdd(1, _ => new List<int>()).Add(42);`,
    explanation: "`AddOrUpdate` atomically inserts or transforms a value in one step; `GetOrAdd` atomically inserts with a factory — both avoid the check-then-act race condition of plain `Dictionary`.",
  },
  {
    id: "cs-b18-b2-objectdisposedexception",
    language: "csharp",
    title: "ObjectDisposedException.ThrowIf (.NET 7)",
    tag: "snippet",
    code: `class Service : IDisposable
{
    private bool _disposed;

    public void Process()
    {
        ObjectDisposedException.ThrowIf(_disposed, this);
        Console.WriteLine("processing");
    }

    public void Dispose()
    {
        _disposed = true;
        GC.SuppressFinalize(this);
    }
}

var svc = new Service();
svc.Process();   // processing
svc.Dispose();
svc.Process();   // throws ObjectDisposedException`,
    explanation: "`ObjectDisposedException.ThrowIf(condition, this)` (.NET 7) replaces `if (_disposed) throw new ObjectDisposedException(...)` — concise, consistent naming, and the type is in the message.",
  },
  {
    id: "cs-b18-b2-collections-marshal",
    language: "csharp",
    title: "CollectionsMarshal.AsSpan for zero-copy List access",
    tag: "structures",
    code: `using System.Runtime.InteropServices;

var numbers = new List<int> { 1, 2, 3, 4, 5 };

// Get direct access to the underlying array — zero copy:
Span<int> span = CollectionsMarshal.AsSpan(numbers);

// Modify elements in-place:
span[0] = 99;
Console.WriteLine(numbers[0]);   // 99

// WARNING: span is invalidated if the list is resized
numbers.Add(6);  // Do NOT use 'span' after this`,
    explanation: "`CollectionsMarshal.AsSpan<T>(list)` returns a span over the list's internal buffer — zero allocation, but the span is invalidated if the list reallocates (Add may cause this).",
  },
  {
    id: "cs-b18-b2-unsafe-hash",
    language: "csharp",
    title: "Providing a custom IEqualityComparer for Dictionary",
    tag: "structures",
    code: `class CaseInsensitive : IEqualityComparer<string>
{
    public bool Equals(string? x, string? y) =>
        string.Equals(x, y, StringComparison.OrdinalIgnoreCase);

    public int GetHashCode(string obj) =>
        obj.ToUpperInvariant().GetHashCode(StringComparison.Ordinal);
}

var dict = new Dictionary<string, int>(new CaseInsensitive())
{
    ["Hello"] = 1,
};

Console.WriteLine(dict["hello"]);   // 1
Console.WriteLine(dict["HELLO"]);   // 1`,
    explanation: "Passing a custom `IEqualityComparer<TKey>` at construction time controls how keys are hashed and compared — essential for case-insensitive string lookups or custom domain key semantics.",
  },
  {
    id: "cs-b18-b2-nullability-flow",
    language: "csharp",
    title: "Nullable analysis flow through conditional branches",
    tag: "types",
    code: `#nullable enable

string? GetName(bool includeUser) =>
    includeUser ? "Alice" : null;

string name = GetName(true)!;   // force non-null (assertion)

// Or guard with null check:
string? maybe = GetName(false);
if (maybe is not null)
{
    int len = maybe.Length;   // safe: narrowed to string
}

// Null-coalescing in one line:
int length = maybe?.Length ?? 0;`,
    explanation: "The nullable flow analysis narrows types inside null-guard branches; `?.` returns a nullable type; `??` provides a default. Use `!` only when you have out-of-band knowledge that the value is non-null.",
  },
  {
    id: "cs-b18-b2-tuple-element-names",
    language: "csharp",
    title: "Tuple element names inferred from variables",
    tag: "types",
    code: `int count = 5;
string label = "items";

// C# 7.1: element names inferred from variable names
var pair = (count, label);
Console.WriteLine(pair.count);   // 5
Console.WriteLine(pair.label);   // items

// Explicit names:
var point = (X: 3.0, Y: 4.0);
Console.WriteLine(point.X);   // 3

// Deconstruct:
var (x, y) = point;
Console.WriteLine(Math.Sqrt(x*x + y*y));  // 5`,
    explanation: "Tuple element names are inferred from variable names (C# 7.1+) or declared explicitly — they're compiler-only names (erased to `Item1`, `Item2` at runtime) used for readability.",
  },
  {
    id: "cs-b18-b2-strategy-pattern",
    language: "csharp",
    title: "Strategy pattern using delegates",
    tag: "classes",
    code: `class Sorter<T>
{
    private Comparison<T> _strategy;

    public Sorter(Comparison<T> strategy) => _strategy = strategy;

    public void SetStrategy(Comparison<T> strategy) => _strategy = strategy;

    public List<T> Sort(IEnumerable<T> items)
    {
        var list = items.ToList();
        list.Sort(_strategy);
        return list;
    }
}

var sorter = new Sorter<int>((a, b) => a - b);
Console.WriteLine(string.Join(" ", sorter.Sort(new[] { 5, 1, 3 })));  // 1 3 5

sorter.SetStrategy((a, b) => b - a);  // descending
Console.WriteLine(string.Join(" ", sorter.Sort(new[] { 5, 1, 3 })));  // 5 3 1`,
    explanation: "The strategy pattern can be implemented with a delegate field instead of an interface hierarchy — simpler when strategies are stateless lambdas or method groups.",
  },
  {
    id: "cs-b18-b2-collection-expressions",
    language: "csharp",
    title: "Collection expressions unify array and list literals (C# 12)",
    tag: "snippet",
    code: `// Array:
int[] arr = [1, 2, 3, 4, 5];

// List:
List<string> names = ["Alice", "Bob", "Carol"];

// Spread operator:
int[] a = [1, 2, 3];
int[] b = [4, 5, 6];
int[] combined = [..a, ..b];   // [1, 2, 3, 4, 5, 6]

// ImmutableArray:
System.Collections.Immutable.ImmutableArray<int> ia = [1, 2, 3];`,
    explanation: "C# 12 collection expressions `[...]` replace `new T[] { }` and `new List<T> { }` syntax; the spread operator `..seq` inline-expands a sequence — the target type determines what's created.",
  },
  {
    id: "cs-b18-b2-array-pool-pinned",
    language: "csharp",
    title: "PinnedArrayPool for GC-pinned buffers",
    tag: "structures",
    code: `using System.Buffers;

// Standard pool: buffers may move during GC
byte[] buf = ArrayPool<byte>.Shared.Rent(1024);
try
{
    buf.AsSpan().Fill(0x00);
}
finally
{
    ArrayPool<byte>.Shared.Return(buf, clearArray: true);
}

// clearArray: true zeroes the buffer before returning — security best practice`,
    explanation: "Pass `clearArray: true` to `Return` when the buffer contained sensitive data; `Shared` pool is thread-safe and uses power-of-two sizes — actual rented length may exceed the minimum requested.",
  },
];
