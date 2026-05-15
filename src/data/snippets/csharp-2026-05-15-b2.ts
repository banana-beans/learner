import type { Snippet } from "./types";
export const csharpSnippets20260515B2: Snippet[] = [
  {
    id: "cs-b15-b2-pattern-property",
    language: "csharp",
    title: "Property pattern matching",
    tag: "snippet",
    code: `record Person(string Name, int Age, string Country);

string Greet(Person p) => p switch
{
    { Age: < 18 }                            => "Hello, young one",
    { Age: >= 65 }                           => "Good day, senior",
    { Country: "US", Age: >= 21 }            => "Hi, American adult",
    { Name: var n, Age: var a }              => \`Hi \${n}, age \${a}\`,
};

Console.WriteLine(Greet(new("Alice", 30, "US")));  // Hi American adult
Console.WriteLine(Greet(new("Bob",   10, "UK")));  // Hello, young one`,
    explanation: "Property patterns `{ Prop: value }` destructure an object's properties directly in a switch arm; nested patterns and `var` captures let you match and bind in one expression.",
  },
  {
    id: "cs-b15-b2-switch-tuple-pattern",
    language: "csharp",
    title: "switch expression with tuple patterns",
    tag: "snippet",
    code: `string TrafficLight(string current, string input) =>
    (current, input) switch
    {
        ("red",    "timer") => "green",
        ("green",  "timer") => "yellow",
        ("yellow", "timer") => "red",
        ("red",    "emergency") => "red",
        _ => throw new InvalidOperationException($"No rule for {current}/{input}")
    };

Console.WriteLine(TrafficLight("red",    "timer"));    // green
Console.WriteLine(TrafficLight("green",  "timer"));    // yellow
Console.WriteLine(TrafficLight("yellow", "timer"));    // red`,
    explanation: "Switching over a tuple `(a, b)` matches combinations of values in a concise table-like form — perfect for state machines where the transition depends on multiple inputs.",
  },
  {
    id: "cs-b15-b2-deconstruct-custom",
    language: "csharp",
    title: "Custom Deconstruct method",
    tag: "classes",
    code: `class DateRange
{
    public DateTime Start { get; }
    public DateTime End   { get; }

    public DateRange(DateTime start, DateTime end)
        => (Start, End) = (start, end);

    // Enables: var (start, end) = range;
    public void Deconstruct(out DateTime start, out DateTime end)
        => (start, end) = (Start, End);
}

var range = new DateRange(DateTime.Today, DateTime.Today.AddDays(7));
var (from, to) = range;
Console.WriteLine($"{from:d} to {to:d}");

// Also works in switch patterns
if (range is var (s, e) && (e - s).Days == 7)
    Console.WriteLine("one week range");`,
    explanation: "A `void Deconstruct(out T1 a, out T2 b)` method enables tuple-style destructuring of your class; the compiler matches the `out` parameter count to determine which overload to call.",
  },
  {
    id: "cs-b15-b2-extension-methods-chain",
    language: "csharp",
    title: "Extension methods for fluent chaining",
    tag: "classes",
    code: `public static class StringExtensions
{
    public static string TruncateAt(this string s, int max)
        => s.Length <= max ? s : s[..max] + "…";

    public static string NullIfEmpty(this string? s)
        => string.IsNullOrEmpty(s) ? null! : s;

    public static string ToTitleCase(this string s)
        => System.Globalization.CultureInfo.CurrentCulture
               .TextInfo.ToTitleCase(s.ToLower());
}

string result = "  hello world  "
    .Trim()
    .ToTitleCase()
    .TruncateAt(8);

Console.WriteLine(result);   // Hello W…`,
    explanation: "Extension methods add behaviour to types you don't control; chaining them with method syntax creates fluent, readable pipelines while keeping the extension logic in separate, testable static methods.",
  },
  {
    id: "cs-b15-b2-yield-enumerator",
    language: "csharp",
    title: "yield return for custom IEnumerable<T>",
    tag: "classes",
    code: `class FibonacciSequence : IEnumerable<long>
{
    private readonly int _count;
    public FibonacciSequence(int count) => _count = count;

    public IEnumerator<long> GetEnumerator()
    {
        long a = 0, b = 1;
        for (int i = 0; i < _count; i++)
        {
            yield return a;
            (a, b) = (b, a + b);
        }
    }

    System.Collections.IEnumerator System.Collections.IEnumerable.GetEnumerator()
        => GetEnumerator();
}

foreach (var n in new FibonacciSequence(10))
    Console.Write(n + " ");   // 0 1 1 2 3 5 8 13 21 34`,
    explanation: "`yield return` in `GetEnumerator` implements the state machine automatically; the compiler generates a class that remembers position between `MoveNext` calls — no manual `IEnumerator<T>` class needed.",
  },
  {
    id: "cs-b15-b2-await-using",
    language: "csharp",
    title: "await using for async disposable",
    tag: "snippet",
    code: `class AsyncDbConnection : IAsyncDisposable
{
    public AsyncDbConnection() => Console.WriteLine("connected");

    public async Task QueryAsync(string sql)
    {
        await Task.Delay(10);
        Console.WriteLine($"result of: {sql}");
    }

    public async ValueTask DisposeAsync()
    {
        await Task.Delay(5);   // flush, close socket, etc.
        Console.WriteLine("disconnected");
    }
}

async Task RunAsync()
{
    await using var conn = new AsyncDbConnection();
    await conn.QueryAsync("SELECT 1");
}   // DisposeAsync awaited here

await RunAsync();`,
    explanation: "`await using` calls `DisposeAsync()` and awaits the resulting `ValueTask` at the end of scope — the async counterpart of `using var`, essential for async I/O resources like database connections.",
  },
  {
    id: "cs-b15-b2-iasyncenumerable-yield",
    language: "csharp",
    title: "async iterator with yield return",
    tag: "snippet",
    code: `async IAsyncEnumerable<int> GenerateAsync(int count)
{
    for (int i = 0; i < count; i++)
    {
        await Task.Delay(5);   // simulate async I/O
        yield return i * 10;
    }
}

async Task Main()
{
    await foreach (var value in GenerateAsync(5))
        Console.Write(value + " ");   // 0 10 20 30 40
    Console.WriteLine();

    // With cancellation
    using var cts = new CancellationTokenSource();
    await foreach (var v in GenerateAsync(100).WithCancellation(cts.Token))
    {
        if (v > 20) { cts.Cancel(); break; }
        Console.Write(v + " ");
    }
}`,
    explanation: "Combining `async` with `yield return` creates an `IAsyncEnumerable<T>` — a lazy, awaitable stream. `await foreach` consumes it one item at a time, enabling memory-efficient streaming.",
  },
  {
    id: "cs-b15-b2-cancellation-linked",
    language: "csharp",
    title: "Linked CancellationTokenSource",
    tag: "snippet",
    code: `async Task ProcessWithTimeout(CancellationToken userToken)
{
    // Create a token that cancels on timeout OR user cancellation
    using var timeoutCts = new CancellationTokenSource(TimeSpan.FromSeconds(5));
    using var linked    = CancellationTokenSource.CreateLinkedTokenSource(
                              userToken, timeoutCts.Token);

    try
    {
        await DoWorkAsync(linked.Token);
    }
    catch (OperationCanceledException) when (timeoutCts.IsCancellationRequested)
    {
        Console.WriteLine("Timed out");
    }
    catch (OperationCanceledException)
    {
        Console.WriteLine("Cancelled by user");
    }
}

async Task DoWorkAsync(CancellationToken ct) => await Task.Delay(10_000, ct);`,
    explanation: "`CreateLinkedTokenSource` merges multiple tokens into one: the combined token fires when *any* source is cancelled. Use it to layer timeouts on top of user-provided cancellation tokens.",
  },
  {
    id: "cs-b15-b2-task-whenall",
    language: "csharp",
    title: "Task.WhenAll for parallel async work",
    tag: "snippet",
    code: `async Task<int> FetchScore(string user)
{
    await Task.Delay(100);   // simulate network call
    return user.Length;      // fake score
}

async Task Main()
{
    var users = new[] { "Alice", "Bob", "Charlie" };

    // Run all concurrently and wait for all to finish
    int[] scores = await Task.WhenAll(users.Select(FetchScore));
    Console.WriteLine(string.Join(", ", scores));  // 5, 3, 7

    // WhenAll captures ALL exceptions (not just first)
    try
    {
        await Task.WhenAll(
            Task.FromException(new Exception("A")),
            Task.FromException(new Exception("B")));
    }
    catch (Exception e) when (e.Message == "A")
    {
        Console.WriteLine("Caught first exception");
    }
}`,
    explanation: "`Task.WhenAll` runs tasks concurrently and returns an array of results in the same order as the input; if multiple tasks fail, all exceptions are wrapped in an `AggregateException`.",
  },
  {
    id: "cs-b15-b2-configure-await",
    language: "csharp",
    title: "ConfigureAwait(false) for library code",
    tag: "snippet",
    code: `// Library code should use ConfigureAwait(false)
// to avoid capturing the SynchronizationContext
public async Task<string> GetDataAsync(string url)
{
    using var client = new System.Net.Http.HttpClient();
    // ConfigureAwait(false): continuation runs on any thread pool thread
    string data = await client.GetStringAsync(url).ConfigureAwait(false);
    return data.ToUpper();   // no context needed here
}

// Application code (UI, ASP.NET) does NOT need ConfigureAwait(false)
// because it benefits from resuming on the original context
async void Button_Click(object s, EventArgs e)
{
    var result = await GetDataAsync("...");
    // Resumes on UI thread — can access UI elements
    // label.Text = result;  // safe
}`,
    explanation: "`ConfigureAwait(false)` tells the awaiter not to capture and restore the `SynchronizationContext`; library code should use it to avoid deadlocks and improve performance in non-UI applications.",
  },
  {
    id: "cs-b15-b2-parallel-foreach",
    language: "csharp",
    title: "Parallel.ForEach with ParallelOptions",
    tag: "snippet",
    code: `using System.Threading.Tasks;

int[] data = Enumerable.Range(1, 20).ToArray();
long sum = 0;
object lockObj = new();

Parallel.ForEach(
    data,
    new ParallelOptions { MaxDegreeOfParallelism = 4 },
    item =>
    {
        int result = item * item;
        lock (lockObj) { sum += result; }
    }
);

Console.WriteLine(sum);   // 2870  (sum of squares 1..20)

// For aggregation: use localInit / localFinally to avoid lock per iteration
long sum2 = 0;
Parallel.ForEach(data,
    () => 0L,                        // thread-local init
    (item, state, local) => local + (long)item * item,   // body
    local => Interlocked.Add(ref sum2, local));           // merge`,
    explanation: "`Parallel.ForEach` distributes loop iterations across threads; the `localInit`/`localFinally` overload avoids lock contention by accumulating per-thread results and merging with `Interlocked`.",
  },
  {
    id: "cs-b15-b2-interlocked-ops",
    language: "csharp",
    title: "Interlocked for lock-free atomic operations",
    tag: "snippet",
    code: `using System.Threading;

int counter = 0;

// Atomic increment — thread-safe without locks
Parallel.For(0, 1000, _ => Interlocked.Increment(ref counter));
Console.WriteLine(counter);   // 1000

// CompareExchange: CAS (compare-and-swap)
int expected = 5;
int actual   = Interlocked.CompareExchange(ref counter, 99, expected);
// Sets counter = 99 if counter == 5; actual = old value
Console.WriteLine(actual);   // 1000  (not 5, so not swapped)

// Exchange: atomic set, returns old value
int old = Interlocked.Exchange(ref counter, 0);
Console.WriteLine(old);      // 1000`,
    explanation: "`Interlocked` provides hardware-backed atomic operations (`Increment`, `Decrement`, `Exchange`, `CompareExchange`) that are faster and composable than `lock` for simple counter scenarios.",
  },
  {
    id: "cs-b15-b2-semaphore-slim",
    language: "csharp",
    title: "SemaphoreSlim for limiting concurrency",
    tag: "snippet",
    code: `using System.Threading;

// Allow at most 3 concurrent database connections
var sem = new SemaphoreSlim(initialCount: 3, maxCount: 3);

async Task ProcessAsync(int id)
{
    await sem.WaitAsync();
    try
    {
        Console.WriteLine($"[{id}] working, sem={sem.CurrentCount}");
        await Task.Delay(100);
    }
    finally
    {
        sem.Release();
    }
}

await Task.WhenAll(Enumerable.Range(1, 8).Select(ProcessAsync));`,
    explanation: "`SemaphoreSlim.WaitAsync()` is the async-friendly way to throttle concurrency — it awaits instead of blocking, letting the thread pool serve other work while waiting for a slot.",
  },
  {
    id: "cs-b15-b2-countdown-event",
    language: "csharp",
    title: "CountdownEvent for multi-phase synchronization",
    tag: "snippet",
    code: `using System.Threading;

var ready = new CountdownEvent(3);  // wait for 3 workers

void Worker(int id)
{
    Thread.Sleep(id * 100);
    Console.WriteLine($"Worker {id} ready");
    ready.Signal();   // decrement the count
}

Thread[] threads = Enumerable.Range(1, 3)
    .Select(i => new Thread(() => Worker(i))).ToArray();

foreach (var t in threads) t.Start();

ready.Wait();   // blocks until count reaches 0
Console.WriteLine("All workers ready — proceeding!");`,
    explanation: "`CountdownEvent` starts at a count and decrements with `Signal()`; `Wait()` blocks until the count hits zero. Use it when one thread needs to wait for multiple workers to reach a checkpoint.",
  },
  {
    id: "cs-b15-b2-reader-writer-lock",
    language: "csharp",
    title: "ReaderWriterLockSlim for read-heavy shared state",
    tag: "snippet",
    code: `using System.Threading;

class Cache
{
    private readonly Dictionary<string, string> _data = new();
    private readonly ReaderWriterLockSlim _lock = new();

    public string? Get(string key)
    {
        _lock.EnterReadLock();
        try   { return _data.GetValueOrDefault(key); }
        finally { _lock.ExitReadLock(); }
    }

    public void Set(string key, string value)
    {
        _lock.EnterWriteLock();
        try   { _data[key] = value; }
        finally { _lock.ExitWriteLock(); }
    }
}`,
    explanation: "`ReaderWriterLockSlim` allows multiple concurrent readers but only one writer at a time; it's more efficient than a plain `lock` when reads vastly outnumber writes.",
  },
  {
    id: "cs-b15-b2-hash-code-combine",
    language: "csharp",
    title: "HashCode.Combine for GetHashCode",
    tag: "classes",
    code: `class Point : IEquatable<Point>
{
    public int X { get; }
    public int Y { get; }

    public Point(int x, int y) => (X, Y) = (x, y);

    public bool Equals(Point? other)
        => other is not null && X == other.X && Y == other.Y;

    public override bool Equals(object? obj) => Equals(obj as Point);

    // HashCode.Combine: easy, well-distributed, avalanche-safe
    public override int GetHashCode() => HashCode.Combine(X, Y);
}

var set = new HashSet<Point>();
set.Add(new Point(1, 2));
set.Add(new Point(1, 2));   // duplicate — same hash and equal
Console.WriteLine(set.Count);  // 1`,
    explanation: "`HashCode.Combine(fields...)` produces a well-distributed hash with up to 8 components; it uses hardware acceleration when available and is far better than XOR (`x.GetHashCode() ^ y.GetHashCode()`).",
  },
  {
    id: "cs-b15-b2-string-comparison",
    language: "csharp",
    title: "StringComparison for culture-aware comparisons",
    tag: "snippet",
    code: `string a = "resume";
string b = "résumé";

// Default == is ordinal (byte-by-byte)
Console.WriteLine(a == b);                             // False

// Ordinal: fastest, binary comparison
Console.WriteLine(string.Equals(a, b, StringComparison.Ordinal));           // False

// InvariantCultureIgnoreCase: language-neutral, case-insensitive
Console.WriteLine(string.Equals(a, b, StringComparison.InvariantCultureIgnoreCase));  // False (accents differ)

// OrdinalIgnoreCase: fastest for case-insensitive paths, filenames, URLs
Console.WriteLine("Hello".Equals("hello", StringComparison.OrdinalIgnoreCase));  // True

// Culture-sensitive: use for user-visible text
Console.WriteLine(string.Compare("ä", "a", StringComparison.CurrentCulture));`,
    explanation: "Always pass an explicit `StringComparison` to `Equals`, `Compare`, `StartsWith` etc. `OrdinalIgnoreCase` is fastest for internal identifiers; `CurrentCulture` is appropriate for displayed text.",
  },
  {
    id: "cs-b15-b2-string-builder-cap",
    language: "csharp",
    title: "StringBuilder with pre-allocated capacity",
    tag: "snippet",
    code: `using System.Text;

// Pre-allocate to avoid reallocations
var sb = new StringBuilder(capacity: 256);

// Fluent API
sb.Append("Hello")
  .Append(", ")
  .Append("World")
  .AppendLine("!")
  .AppendFormat("Pi = {0:F4}", Math.PI);

Console.WriteLine(sb.ToString());

// Replace, Insert, Remove
sb.Replace("World", "C#");
Console.WriteLine(sb);

// Clear for reuse (keeps allocated memory)
sb.Clear();
Console.WriteLine(sb.Length);   // 0`,
    explanation: "Pre-sizing `StringBuilder(capacity)` avoids the geometric resizing copies that happen when you exceed the default 16-char capacity; reuse with `.Clear()` to avoid GC pressure in loops.",
  },
  {
    id: "cs-b15-b2-span-stackalloc",
    language: "csharp",
    title: "stackalloc with Span<T> for stack buffers",
    tag: "snippet",
    code: `// stackalloc: allocate on stack, no GC, must use Span<T>
Span<int> nums = stackalloc int[8];

for (int i = 0; i < nums.Length; i++)
    nums[i] = i * i;

int sum = 0;
foreach (int n in nums) sum += n;
Console.WriteLine(sum);   // 140

// Safe: no unsafe block needed when assigning to Span<T>
// Limit stack use: stack is typically 1–8 MB
// Use threshold: stackalloc if size < 1024 bytes, else rent from pool

Span<byte> buf = stackalloc byte[64];
buf.Fill(0);`,
    explanation: "`stackalloc int[N]` allocates on the stack — zero GC overhead. Assigning to `Span<T>` requires no `unsafe` block (C# 7.2+). Limit to small, fixed-size buffers to avoid stack overflow.",
  },
  {
    id: "cs-b15-b2-array-pool",
    language: "csharp",
    title: "ArrayPool<T> to avoid GC pressure",
    tag: "snippet",
    code: `using System.Buffers;

byte[] buffer = ArrayPool<byte>.Shared.Rent(minimumLength: 1024);
try
{
    // buffer.Length may be >= 1024 (pool may give a larger bucket)
    int actual = 1024;
    var span = buffer.AsSpan(0, actual);
    span.Fill(0xAA);
    Console.WriteLine(span[0]);   // 170
}
finally
{
    // MUST return to pool — never let it be GC'd
    ArrayPool<byte>.Shared.Return(buffer, clearArray: false);
}`,
    explanation: "`ArrayPool<T>.Shared.Rent` returns an array from a reusable pool, avoiding heap allocations for temporary buffers; always `Return` in a `finally` block — forgetting leaks the array from the pool.",
  },
  {
    id: "cs-b15-b2-memory-marshal-cast",
    language: "csharp",
    title: "MemoryMarshal.Cast for zero-copy reinterpretation",
    tag: "snippet",
    code: `using System.Runtime.InteropServices;

// Interpret a byte span as a span of ints (zero-copy reinterpret cast)
byte[] raw = { 1, 0, 0, 0,  2, 0, 0, 0,  3, 0, 0, 0 };
ReadOnlySpan<int> ints = MemoryMarshal.Cast<byte, int>(raw);

Console.WriteLine(ints.Length);   // 3
Console.WriteLine(ints[0]);       // 1  (little-endian 0x00000001)
Console.WriteLine(ints[1]);       // 2
Console.WriteLine(ints[2]);       // 3`,
    explanation: "`MemoryMarshal.Cast<TFrom, TTo>` reinterprets a span's memory as a different element type — zero allocation, no copying. The span's length is recalculated based on the new type's size.",
  },
  {
    id: "cs-b15-b2-records-equality",
    language: "csharp",
    title: "Record equality semantics vs class equality",
    tag: "understanding",
    code: `record Point(int X, int Y);
class  PointClass { public int X, Y; }

// Records: value equality by default
var p1 = new Point(1, 2);
var p2 = new Point(1, 2);
Console.WriteLine(p1 == p2);           // True
Console.WriteLine(p1.Equals(p2));      // True
Console.WriteLine(ReferenceEquals(p1, p2));  // False (different objects)

// Classes: reference equality by default
var c1 = new PointClass { X = 1, Y = 2 };
var c2 = new PointClass { X = 1, Y = 2 };
Console.WriteLine(c1 == c2);           // False (different references)
Console.WriteLine(c1.Equals(c2));      // False`,
    explanation: "Records auto-generate `Equals`, `GetHashCode`, and `==` based on all properties (value equality); classes inherit `object`'s reference equality unless overridden.",
  },
  {
    id: "cs-b15-b2-understand-ref-returns",
    language: "csharp",
    title: "ref returns and ref locals (trace)",
    tag: "understanding",
    code: `int[] data = { 10, 20, 30, 40, 50 };

// ref return: returns a reference to an array element
ref int GetRef(int[] arr, int idx) => ref arr[idx];

ref int elem = ref GetRef(data, 2);   // ref to data[2]
Console.WriteLine(elem);   // 30

elem = 999;                // mutates data[2] through the ref
Console.WriteLine(data[2]); // 999

// Common use: finding the max element and mutating it
ref int Max(int[] arr)
{
    ref int max = ref arr[0];
    foreach (ref int x in arr.AsSpan())
        if (x > max) max = ref x;
    return ref max;
}`,
    explanation: "`ref return` lets a method return a reference to a location (array element, field); assigning to the `ref int` local modifies the original storage — enables zero-copy update patterns.",
  },
  {
    id: "cs-b15-b2-understand-default-interface",
    language: "csharp",
    title: "Default interface method dispatch (trace)",
    tag: "understanding",
    code: `interface IGreeter
{
    string Greet(string name);
    // Default implementation (C# 8+)
    string GreetLoudly(string name) => Greet(name).ToUpper();
}

class FormalGreeter : IGreeter
{
    public string Greet(string name) => $"Good day, {name}";
    // GreetLoudly NOT overridden — uses default
}

class CasualGreeter : IGreeter
{
    public string Greet(string name) => $"Hey {name}";
    string IGreeter.GreetLoudly(string name) => $"YO {name.ToUpper()}!";
}

IGreeter f = new FormalGreeter();
IGreeter c = new CasualGreeter();
Console.WriteLine(f.GreetLoudly("Alice")); // GOOD DAY, ALICE
Console.WriteLine(c.GreetLoudly("Bob"));   // YO BOB!`,
    explanation: "Default interface implementations are dispatched virtually through the interface; calling through the class type (not the interface) gives `CS0117` because the method lives on the interface, not the class.",
  },
  {
    id: "cs-b15-b2-understand-generic-variance",
    language: "csharp",
    title: "Generic variance in practice (trace)",
    tag: "understanding",
    code: `// IEnumerable<out T> is covariant
IEnumerable<string> strings = new List<string> { "a", "b" };
IEnumerable<object> objects = strings;   // OK — covariant

// IList<T> is invariant — this DOES NOT compile:
// IList<object> list = new List<string>();   // CS0266

// Action<in T> is contravariant
Action<object> printAny = o => Console.WriteLine(o);
Action<string> printStr = printAny;   // OK — contravariant

// Why contravariance is safe: Action<object> can handle any string
printStr("hello");  // "hello"

// Why IList<T> can't be covariant:
// If it were, list.Add(42) on an IList<object> that is actually List<string> would crash`,
    explanation: "Covariance (`out T`) is safe for read-only interfaces; contravariance (`in T`) for write-only/consumer interfaces; `IList<T>` is invariant because it both reads and writes, so neither variance is safe.",
  },
  {
    id: "cs-b15-b2-understand-using-statement",
    language: "csharp",
    title: "using statement vs GC finalization (trace)",
    tag: "understanding",
    code: `class Resource : IDisposable
{
    public Resource()  => Console.WriteLine("created");
    public void Use()  => Console.WriteLine("used");
    public void Dispose() => Console.WriteLine("disposed");
}

// using: deterministic disposal
using (var r = new Resource()) { r.Use(); }
// created, used, disposed  — in order, immediately

// Without using: GC might never call finalizer (or calls it late)
{
    var r2 = new Resource();
    r2.Use();
    // r2 out of scope but NOT disposed until GC collects it
    // In practice: could be megabytes of resources held for seconds`,
    explanation: "`using` ensures `Dispose` is called immediately when the scope exits regardless of exceptions; without it, unmanaged resources like file handles and DB connections are held until the GC eventually runs.",
  },
  {
    id: "cs-b15-b2-understand-null-propagation",
    language: "csharp",
    title: "Null propagation operator short-circuits (trace)",
    tag: "understanding",
    code: `class Node { public Node? Next; public int Value; }

Node? head = new Node { Value = 1, Next = new Node { Value = 2 } };
Node? tail = null;

// ?. short-circuits: if left side is null, result is null (not NullReferenceException)
Console.WriteLine(head?.Next?.Value);   // 2
Console.WriteLine(tail?.Next?.Value);   // null  — no exception

// ?[] for nullable indexers
string[]? arr = null;
Console.WriteLine(arr?[0]);             // null  — no IndexOutOfRange

// Null-coalescing after propagation
int len = head?.Next?.Value ?? -1;
Console.WriteLine(len);   // 2`,
    explanation: "`?.` evaluates to `null` (not throws) when the left side is null; chains of `?.` short-circuit at the first null, returning `null` for the entire expression. Combine with `??` to provide defaults.",
  },
  {
    id: "cs-b15-b2-structures-observablecoll",
    language: "csharp",
    title: "ObservableCollection<T> with CollectionChanged",
    tag: "structures",
    code: `using System.Collections.ObjectModel;
using System.Collections.Specialized;

var items = new ObservableCollection<string>();

items.CollectionChanged += (sender, e) =>
{
    Console.WriteLine($"Action: {e.Action}");
    if (e.NewItems != null)
        Console.WriteLine($"  Added: {string.Join(", ", e.NewItems.Cast<string>())}");
    if (e.OldItems != null)
        Console.WriteLine($"  Removed: {string.Join(", ", e.OldItems.Cast<string>())}");
};

items.Add("Alpha");     // Action: Add / Added: Alpha
items.Add("Beta");      // Action: Add / Added: Beta
items.RemoveAt(0);      // Action: Remove / Removed: Alpha`,
    explanation: "`ObservableCollection<T>` fires `CollectionChanged` events on any structural mutation (add, remove, move, replace, reset); it's the backbone of data binding in WPF, MAUI, and Blazor.",
  },
  {
    id: "cs-b15-b2-structures-concurrent-stack",
    language: "csharp",
    title: "ConcurrentStack<T> for lock-free LIFO",
    tag: "structures",
    code: `using System.Collections.Concurrent;

var stack = new ConcurrentStack<int>();

// Push single or multiple items
stack.Push(1);
stack.PushRange(new[] { 2, 3, 4, 5 });

Console.WriteLine(stack.Count);   // 5

// Thread-safe pop
if (stack.TryPop(out int top))
    Console.WriteLine(top);   // 5  (LIFO)

// Pop multiple
int[] batch = new int[3];
int taken = stack.TryPopRange(batch);
Console.WriteLine(taken);                        // 3
Console.WriteLine(string.Join(",", batch[..taken]));  // 4,3,2`,
    explanation: "`ConcurrentStack<T>` is a lock-free thread-safe LIFO collection; `TryPop` returns false instead of throwing if the stack is empty — always use `Try*` methods with concurrent collections.",
  },
  {
    id: "cs-b15-b2-structures-sorted-list",
    language: "csharp",
    title: "SortedList<K,V> vs SortedDictionary<K,V>",
    tag: "families",
    code: `// SortedList<K,V>: backed by two arrays (keys[], values[])
// SortedDictionary<K,V>: backed by a red-black tree

var sl = new SortedList<int, string>();
var sd = new SortedDictionary<int, string>();

foreach (int k in new[] { 5, 1, 3, 2, 4 })
{
    sl[k] = $"v{k}";
    sd[k] = $"v{k}";
}

// Both iterate in sorted key order
Console.WriteLine(string.Join(", ", sl.Keys));  // 1, 2, 3, 4, 5
Console.WriteLine(string.Join(", ", sd.Keys));  // 1, 2, 3, 4, 5

// SortedList: smaller memory, O(n) insert/delete (array shift)
// SortedDictionary: O(log n) insert/delete, larger memory overhead`,
    explanation: "`SortedList<K,V>` uses less memory and is faster for bulk-load+iterate scenarios; `SortedDictionary<K,V>` handles frequent insertions and deletions better (O(log n) vs O(n) for SortedList).",
  },
  {
    id: "cs-b15-b2-structures-bitarray",
    language: "csharp",
    title: "BitArray for compact boolean flags",
    tag: "structures",
    code: `using System.Collections;

var flags = new BitArray(8, false);  // 8 bits, all false
flags[0] = true;
flags[3] = true;
flags[7] = true;

// Compact: 8 bits in one byte
Console.WriteLine(flags.Count);   // 8

// Bitwise operations
var other = new BitArray(new bool[] { true, true, false, false, false, false, false, true });
var anded = (BitArray)flags.Clone();
anded.And(other);

for (int i = 0; i < anded.Count; i++)
    Console.Write(anded[i] ? "1" : "0");  // 10000001`,
    explanation: "`BitArray` packs 8 booleans per byte; it supports bitwise `And`, `Or`, `Xor`, `Not` on the entire array — useful for permission sets, bloom filters, and compact flag storage.",
  },
  {
    id: "cs-b15-b2-types-date-only",
    language: "csharp",
    title: "DateOnly and TimeOnly types",
    tag: "types",
    code: `// .NET 6+ DateOnly and TimeOnly avoid time-zone confusion
var today  = DateOnly.FromDateTime(DateTime.Now);
var open   = new TimeOnly(9, 0);
var close  = new TimeOnly(17, 30);
var appt   = new DateOnly(2025, 6, 15);

Console.WriteLine(today);           // e.g. 05/15/2026
Console.WriteLine(open);            // 09:00

// Arithmetic
var tomorrow = today.AddDays(1);
var apptClose = close.AddHours(0.5);  // TimeOnly.Add returns TimeOnly

// Check if time is in range
var now = TimeOnly.FromDateTime(DateTime.Now);
bool isOpen = now >= open && now <= close;
Console.WriteLine(isOpen);`,
    explanation: "`DateOnly` represents a date without time (no time zone issues); `TimeOnly` represents a time of day. Both are struct types added in .NET 6 to replace `DateTime` for date-only and time-only scenarios.",
  },
  {
    id: "cs-b15-b2-types-int-long-overflow",
    language: "csharp",
    title: "int vs long overflow boundaries",
    tag: "types",
    code: `Console.WriteLine(int.MaxValue);    // 2,147,483,647  (~2.1 billion)
Console.WriteLine(int.MinValue);    // -2,147,483,648
Console.WriteLine(long.MaxValue);   // 9,223,372,036,854,775,807  (~9.2 quintillion)

// Common overflow scenario
int visits = int.MaxValue;
visits++;   // unchecked: wraps to int.MinValue
Console.WriteLine(visits);   // -2147483648

// Safe: use long for counters that might exceed int
long safe = (long)int.MaxValue + 1;
Console.WriteLine(safe);   // 2147483648

// Check without exception: cast to long first
bool wouldOverflow = (long)visits + 1 > int.MaxValue;`,
    explanation: "`int` holds ±2.1 billion; use `long` for counters that may exceed 2 billion (total page views, byte offsets, timestamps in ticks). Detect overflow before it happens by widening to `long`.",
  },
  {
    id: "cs-b15-b2-types-nullable-ref-context",
    language: "csharp",
    title: "Nullable reference types — annotation context",
    tag: "types",
    code: `#nullable enable

// Non-nullable: compiler warns if null assignment possible
string name = "Alice";
// name = null;  // CS8600 warning

// Nullable: must check before dereferencing
string? opt = GetName();
Console.WriteLine(opt?.Length);    // ok — null propagation
// Console.WriteLine(opt.Length);  // CS8602 warning

if (opt is not null)
    Console.WriteLine(opt.Length); // ok — null checked

// Null-forgiving operator: tell compiler "I know it's not null"
Console.WriteLine(opt!.Length);   // suppresses CS8602

string? GetName() => null;`,
    explanation: "`#nullable enable` makes reference types non-nullable by default; appending `?` explicitly allows null and the compiler warns on any dereference that might be null — catching null bugs at compile time.",
  },
  {
    id: "cs-b15-b2-types-guid",
    language: "csharp",
    title: "Guid creation and parsing",
    tag: "types",
    code: `// Random GUID (version 4)
Guid id = Guid.NewGuid();
Console.WriteLine(id);           // e.g. 3f2504e0-4f89-11d3-9a0c-0305e82c3301

// Parsing
Guid parsed = Guid.Parse("3f2504e0-4f89-11d3-9a0c-0305e82c3301");
Guid tryParsed;
bool ok = Guid.TryParse("invalid", out tryParsed);
Console.WriteLine(ok);           // False
Console.WriteLine(tryParsed);    // 00000000-0000-0000-0000-000000000000

// Different string formats
Console.WriteLine(id.ToString("N"));  // no hyphens
Console.WriteLine(id.ToString("B"));  // {braces}
Console.WriteLine(Guid.Empty);        // 00000000-0000-0000-0000-000000000000`,
    explanation: "`Guid.NewGuid()` generates a random 128-bit identifier; `Guid.Parse` throws on invalid format while `TryParse` returns `false`. Use `Guid.Empty` as a sentinel null-equivalent for GUID fields.",
  },
  {
    id: "cs-b15-b2-types-timespan",
    language: "csharp",
    title: "TimeSpan arithmetic and formatting",
    tag: "types",
    code: `TimeSpan duration = TimeSpan.FromHours(2.5);
Console.WriteLine(duration.TotalMinutes);   // 150
Console.WriteLine(duration.Hours);          // 2
Console.WriteLine(duration.Minutes);        // 30

// Arithmetic
TimeSpan doubled = duration * 2;
Console.WriteLine(doubled.TotalHours);      // 5

TimeSpan diff = TimeSpan.FromDays(1) - TimeSpan.FromHours(3);
Console.WriteLine(diff.TotalHours);         // 21

// From DateTime subtraction
DateTime start = DateTime.UtcNow;
DateTime end   = start.AddMinutes(90);
Console.WriteLine((end - start).TotalMinutes);  // 90`,
    explanation: "`TimeSpan` represents a duration; use factory methods (`FromHours`, `FromDays`) for clarity over the constructor. `Total*` properties give the whole duration in one unit; component properties give the breakdown.",
  },
  {
    id: "cs-b15-b2-types-enum-flagops",
    language: "csharp",
    title: "[Flags] enum bitwise operations",
    tag: "types",
    code: `[Flags]
enum Permission
{
    None    = 0,
    Read    = 1 << 0,   // 1
    Write   = 1 << 1,   // 2
    Delete  = 1 << 2,   // 4
    Admin   = Read | Write | Delete,  // 7
}

Permission user = Permission.Read | Permission.Write;

// Test a flag
Console.WriteLine(user.HasFlag(Permission.Read));    // True
Console.WriteLine(user.HasFlag(Permission.Delete));  // False

// Add a flag
user |= Permission.Delete;

// Remove a flag
user &= ~Permission.Write;

Console.WriteLine(user);  // Read, Delete`,
    explanation: "`[Flags]` marks an enum for bitwise combination; `HasFlag` tests a single bit, `|=` adds a flag, `&= ~flag` removes it. Values should be powers of two (use `1 << n`) so combinations are unambiguous.",
  },
  {
    id: "cs-b15-b2-families-concurrent-coll",
    language: "csharp",
    title: "Thread-safe collection family",
    tag: "families",
    code: `using System.Collections.Concurrent;

// ConcurrentDictionary: thread-safe key-value store
var dict = new ConcurrentDictionary<string, int>();

// ConcurrentQueue: FIFO, lock-free
var queue = new ConcurrentQueue<int>();
queue.Enqueue(1);
queue.TryDequeue(out int item);

// ConcurrentStack: LIFO, lock-free
var stack = new ConcurrentStack<int>();
stack.Push(1);

// ConcurrentBag: unordered, optimised for producer=consumer thread
var bag = new ConcurrentBag<int>();
bag.Add(1);
bag.TryTake(out int bagItem);

// BlockingCollection<T>: wrapper adding bounding and blocking
var bc = new BlockingCollection<int>(boundedCapacity: 10);`,
    explanation: "The `System.Collections.Concurrent` namespace has four main types: `ConcurrentDictionary` (key-value), `ConcurrentQueue` (FIFO), `ConcurrentStack` (LIFO), `ConcurrentBag` (unordered); `BlockingCollection` wraps any of them with blocking/bounding.",
  },
  {
    id: "cs-b15-b2-families-icomparable-iequatable",
    language: "csharp",
    title: "IComparable vs IEquatable",
    tag: "families",
    code: `// IEquatable<T>: defines equality (==, Equals, GetHashCode)
// Used by: Dictionary, HashSet, LINQ Contains/Distinct/GroupBy

// IComparable<T>: defines ordering (<, >, CompareTo)
// Used by: Array.Sort, SortedSet, SortedDictionary, LINQ OrderBy

class Rating : IEquatable<Rating>, IComparable<Rating>
{
    public int Value { get; }
    public Rating(int v) => Value = v;

    public bool Equals(Rating? o)    => o is not null && Value == o.Value;
    public override bool Equals(object? o) => Equals(o as Rating);
    public override int GetHashCode()  => Value;
    public int CompareTo(Rating? o)    => o is null ? 1 : Value.CompareTo(o.Value);
}`,
    explanation: "`IEquatable<T>` is for collections that need equality (hash-based); `IComparable<T>` is for collections that need ordering (sorted structures). Implement both for a type that works in both kinds of collections.",
  },
  {
    id: "cs-b15-b2-families-throw-statement-expr",
    language: "csharp",
    title: "throw expression vs throw statement",
    tag: "families",
    code: `// throw statement: a statement, only in statement contexts
void ProcessOld(string? s)
{
    if (s is null) throw new ArgumentNullException(nameof(s));
}

// throw expression (C# 7): can appear in expression contexts
string Coerce(string? s)
    => s ?? throw new ArgumentNullException(nameof(s));

// In ternary
string Upper(string? s)
    => s is not null ? s.ToUpper() : throw new InvalidOperationException();

// In null-coalescing assignment
string? name = null;
// name ??= throw new Exception("required");   // also valid`,
    explanation: "`throw` as an expression (C# 7+) can appear in `??`, ternary `?:`, and `=>` expression bodies; it lets you embed a guard without a separate `if` statement.",
  },
  {
    id: "cs-b15-b2-families-string-build-interp",
    language: "csharp",
    title: "string.Create vs Interpolation vs StringBuilder",
    tag: "families",
    code: `// Interpolation: most readable, allocates for each call
string name = "Alice"; int n = 42;
string a = $"Hello {name}, value={n}";

// StringBuilder: good for many appends in a loop
var sb = new System.Text.StringBuilder();
for (int i = 0; i < 1000; i++) sb.Append(i).Append(',');
string b = sb.ToString();

// string.Create: zero-copy creation for known-length output
string c = string.Create(5, "hello", (span, state) =>
{
    for (int i = 0; i < span.Length; i++)
        span[i] = char.ToUpper(state[i]);
});
Console.WriteLine(c);   // HELLO`,
    explanation: "`string.Create` is the fastest option for string construction when you know the length upfront: it allocates once and writes directly into the buffer via a `Span<char>`, avoiding any intermediate allocation.",
  },
  {
    id: "cs-b15-b2-classes-generic-constraints-multi",
    language: "csharp",
    title: "Multiple generic constraints on one type parameter",
    tag: "classes",
    code: `interface IEntity { int Id { get; } }
interface IAuditable { DateTime CreatedAt { get; } }

// T must: be a class, implement both interfaces, AND have a parameterless ctor
class Repository<T>
    where T : class, IEntity, IAuditable, new()
{
    public T Create()
    {
        var entity = new T();
        Console.WriteLine($"Created entity id={entity.Id} at={entity.CreatedAt}");
        return entity;
    }
}

class Order : IEntity, IAuditable
{
    public int      Id        { get; } = 1;
    public DateTime CreatedAt { get; } = DateTime.UtcNow;
}`,
    explanation: "Multiple `where T :` constraints are comma-separated and all must be satisfied; `class` (reference type) must come first if present, `new()` must come last — constraints compose and narrow the set of valid types.",
  },
  {
    id: "cs-b15-b2-classes-init-accessor",
    language: "csharp",
    title: "init accessor — settable only at object creation",
    tag: "classes",
    code: `class Config
{
    public string Host   { get; init; } = "localhost";
    public int    Port   { get; init; } = 5432;
    public bool   Debug  { get; init; }
}

// Can set in object initializer...
var cfg = new Config { Host = "prod.db", Port = 5433, Debug = false };

// ...but NOT after construction:
// cfg.Port = 9999;   // CS8852: init-only property

// With primary constructor (C# 12):
class ServerInfo(string host, int port)
{
    public string Host { get; init; } = host;
    public int    Port { get; init; } = port;
}`,
    explanation: "`init` setters (C# 9+) allow property assignment only in constructors, `object { ... }` initializers, or `with` expressions — creating immutable-by-default objects without the verbosity of private setters.",
  },
  {
    id: "cs-b15-b2-classes-primary-ctor",
    language: "csharp",
    title: "Primary constructor on a class (C# 12)",
    tag: "classes",
    code: `// Primary constructor: params accessible throughout the class body
class Logger(string name, bool verbose = false)
{
    // 'name' and 'verbose' are in scope for the whole class
    public void Log(string msg)
    {
        if (verbose)
            Console.WriteLine($"[{name}] VERBOSE: {msg}");
        else
            Console.WriteLine($"[{name}] {msg}");
    }

    public string Name => name;   // expose as property
}

var log = new Logger("App", verbose: true);
log.Log("started");   // [App] VERBOSE: started`,
    explanation: "Primary constructors on classes (C# 12) keep parameter names in scope for the entire class body; they're captured as fields if referenced outside the constructor — reducing boilerplate for simple dependency injection.",
  },
  {
    id: "cs-b15-b2-caveat-int-division-truncation",
    language: "csharp",
    title: "Integer division truncates toward zero",
    tag: "caveats",
    code: `// Integer division truncates (floor toward zero)
Console.WriteLine(7  / 2);     // 3  (not 3.5)
Console.WriteLine(-7 / 2);     // -3 (not -4 — truncates toward zero, not floor)

// To get actual floor division:
Console.WriteLine((int)Math.Floor(-7.0 / 2));   // -4

// % (remainder) has the same sign as the dividend
Console.WriteLine( 7 % 2);    //  1
Console.WriteLine(-7 % 2);    // -1  (not 1!)

// Convert to double before dividing for decimal result
double result = 7.0 / 2;
Console.WriteLine(result);    // 3.5`,
    explanation: "C# integer division truncates toward zero (not floor); `-7 / 2` is `-3`, not `-4`. The `%` remainder carries the sign of the dividend. Promote to `double` or use `Math.Floor` for floor division.",
  },
  {
    id: "cs-b15-b2-caveat-event-leak",
    language: "csharp",
    title: "Event subscription memory leak",
    tag: "caveats",
    code: `class Publisher
{
    public event Action? DataReady;
    public void Fire() => DataReady?.Invoke();
}

class Subscriber
{
    public Subscriber(Publisher pub)
    {
        pub.DataReady += OnData;   // pub holds a ref to this subscriber
    }

    private void OnData() => Console.WriteLine("data!");
}

var pub = new Publisher();
for (int i = 0; i < 1000; i++)
    new Subscriber(pub);   // 1000 subs still alive via pub.DataReady

// Fix: unsubscribe in IDisposable.Dispose()
// pub.DataReady -= OnData;
GC.Collect();   // subs NOT collected — publisher holds roots`,
    explanation: "An event subscription is a strong reference from publisher to subscriber; if you create subscribers in a loop without unsubscribing, the publisher keeps them all alive forever — a classic event memory leak.",
  },
  {
    id: "cs-b15-b2-caveat-static-interface-hiding",
    language: "csharp",
    title: "Explicit interface hides member from base class",
    tag: "caveats",
    code: `interface IShape { string Describe(); }

class Circle : IShape
{
    public double Radius { get; init; }

    // Explicit implementation — NOT accessible as Circle.Describe()
    string IShape.Describe() => $"Circle r={Radius}";
}

var c = new Circle { Radius = 5 };

// Circle has no 'Describe' method accessible directly
// c.Describe();  // CS0117

// Must cast to interface
Console.WriteLine(((IShape)c).Describe());   // Circle r=5

// Also: polymorphism still works
IShape shape = c;
Console.WriteLine(shape.Describe());         // Circle r=5`,
    explanation: "Explicit interface members are only accessible via the interface type — not through the class reference. This is useful for resolving conflicts but can surprise callers who expect a class-level method.",
  },
  {
    id: "cs-b15-b2-caveat-string-plus-concat",
    language: "csharp",
    title: "String concatenation in loops allocates O(n²)",
    tag: "caveats",
    code: `// Each += creates a new string — O(n²) total allocation
var result = "";
for (int i = 0; i < 10000; i++)
    result += i.ToString();   // 10000 string allocations!

// Fix 1: StringBuilder (best for many appends)
var sb = new System.Text.StringBuilder();
for (int i = 0; i < 10000; i++)
    sb.Append(i);
string r2 = sb.ToString();

// Fix 2: string.Join for a known collection
var parts = Enumerable.Range(0, 10000).Select(i => i.ToString());
string r3 = string.Join("", parts);

Console.WriteLine(result.Length == r2.Length);  // True`,
    explanation: "String concatenation with `+=` copies both strings on every iteration — O(n²) total work and memory. Use `StringBuilder` for many unknown-count appends or `string.Join` when the collection is already available.",
  },
  {
    id: "cs-b15-b2-caveat-linq-select-side-effects",
    language: "csharp",
    title: "LINQ Select should not have side effects",
    tag: "caveats",
    code: `int count = 0;

var query = Enumerable.Range(1, 5)
    .Select(x => { count++; return x * 2; });   // side effect!

// First enumeration
var list = query.ToList();
Console.WriteLine(count);   // 5

// Second enumeration
var list2 = query.ToList();
Console.WriteLine(count);   // 10  — Select ran again!

// LINQ is lazy — each enumeration re-runs the pipeline
// Side effects in Select/Where lead to repeated/unexpected execution
// Rule: keep LINQ lambdas pure (no side effects)`,
    explanation: "LINQ pipelines re-execute on every enumeration; side effects in `Select`, `Where`, or `OrderBy` lambdas multiply with each enumeration. Keep LINQ lambdas pure and materialise with `.ToList()` when you need a snapshot.",
  },
  {
    id: "cs-b15-b2-types-records-with-inheritance",
    language: "csharp",
    title: "Record inheritance and equality",
    tag: "types",
    code: `record Animal(string Name);
record Dog(string Name, string Breed) : Animal(Name);

var d1 = new Dog("Rex", "Husky");
var d2 = new Dog("Rex", "Husky");
Animal a1 = d1;
Animal a2 = new Animal("Rex");

Console.WriteLine(d1 == d2);    // True  — same type + same values
Console.WriteLine(a1 == d1);    // True  — via virtual Equals, checks runtime type
Console.WriteLine(a1 == a2);    // False — Dog != Animal (different runtime types)

// Records use runtime type in equality check
Console.WriteLine(a1.GetType().Name);  // Dog`,
    explanation: "Record equality considers the runtime type — a `Dog` and an `Animal` with the same `Name` are NOT equal because their types differ. This prevents subtle bugs when using records in polymorphic collections.",
  },
  {
    id: "cs-b15-b2-snippet-pattern-not",
    language: "csharp",
    title: "not pattern for negation",
    tag: "snippet",
    code: `// 'not' pattern: negates any pattern (C# 9+)

object? obj = "hello";

// not null — most common use
if (obj is not null)
    Console.WriteLine(((string)obj).Length);   // 5

// not type pattern
if (obj is not int)
    Console.WriteLine("not an int");

// Combine: and / or / not
int n = 42;
if (n is > 0 and not > 100)
    Console.WriteLine("positive and <= 100");   // prints

// In switch
string Category(int x) => x switch
{
    < 0         => "negative",
    0           => "zero",
    not (< 100) => "large",   // >= 100
    _           => "small positive",
};`,
    explanation: "`not pattern` (C# 9+) negates any pattern; it composes with `and`/`or` to build readable range checks and is especially useful as `is not null` for nullable reference type guards.",
  },
  {
    id: "cs-b15-b2-snippet-range-slice-strings",
    language: "csharp",
    title: "Range slicing strings with .. and ^",
    tag: "snippet",
    code: `string s = "Hello, World!";

Console.WriteLine(s[7..]);      // World!   (from index 7 to end)
Console.WriteLine(s[..5]);      // Hello    (first 5 chars)
Console.WriteLine(s[7..12]);    // World    (exclusive end)
Console.WriteLine(s[^6..^1]);   // World    (from-end indices)
Console.WriteLine(s[^1..]);     // !        (last char)

// Safe trimming
string code = "  abc  ";
string trimmed = code.Trim();

// Extract middle
string tag = "<b>bold</b>";
string inner = tag[3..^4];
Console.WriteLine(inner);  // bold`,
    explanation: "`..` range with `^` end-relative indices makes string slicing expressive; `s[^n..]` gets the last `n` characters — cleaner than `s.Substring(s.Length - n)`.",
  },
  {
    id: "cs-b15-b2-snippet-caller-info",
    language: "csharp",
    title: "CallerMemberName / CallerFilePath attributes",
    tag: "snippet",
    code: `using System.Runtime.CompilerServices;

void Log(string message,
    [CallerMemberName] string member = "",
    [CallerFilePath]   string file   = "",
    [CallerLineNumber] int    line   = 0)
{
    Console.WriteLine($"{file}:{line} [{member}] {message}");
}

void ProcessData()
{
    Log("started");   // compiler fills in member="ProcessData", line=N, file="..."
}

ProcessData();
// /path/to/file.cs:18 [ProcessData] started`,
    explanation: "The `Caller*` attributes tell the compiler to automatically inject method name, file path, and line number at the call site — zero-argument logging that provides precise origin information without reflection.",
  },
  {
    id: "cs-b15-b2-snippet-nameof-refactoring",
    language: "csharp",
    title: "nameof() for refactor-safe names",
    tag: "snippet",
    code: `class Order
{
    public int Quantity { get; set; }
    public decimal Price { get; set; }

    public void Validate()
    {
        if (Quantity <= 0)
            throw new ArgumentOutOfRangeException(nameof(Quantity),
                $"{nameof(Quantity)} must be positive");

        if (Price < 0)
            throw new ArgumentOutOfRangeException(nameof(Price));
    }
}

// nameof(Quantity) == "Quantity" (evaluated at compile time)
// Renaming the property via IDE refactoring also updates the nameof() call`,
    explanation: "`nameof(expr)` returns the string name of a member or variable at compile time; it's rename-safe (IDEs refactor it), unlike hardcoded `\"Quantity\"` strings that go stale silently.",
  },
  {
    id: "cs-b15-b2-snippet-global-using",
    language: "csharp",
    title: "global using for project-wide imports",
    tag: "snippet",
    code: `// GlobalUsings.cs  (dedicated file convention)
global using System;
global using System.Collections.Generic;
global using System.Linq;
global using System.Threading.Tasks;

// Any .cs file in the project can now use these without local 'using'
// No need to repeat at the top of every file

// The SDK also generates global usings automatically for common namespaces
// when you set <ImplicitUsings>enable</ImplicitUsings> in .csproj

// Local 'using' still works and takes precedence for conflicts
using static System.Console;   // just for this file`,
    explanation: "`global using` (C# 10+) applies an import to every source file in the project, eliminating the boilerplate of repeating common namespaces. Put them in a single `GlobalUsings.cs` for easy maintenance.",
  },
  {
    id: "cs-b15-b2-snippet-file-scoped-namespace",
    language: "csharp",
    title: "File-scoped namespace declaration",
    tag: "snippet",
    code: `// Traditional: all code inside braces
namespace MyApp.Services
{
    class OldStyle { }
}

// File-scoped (C# 10+): applies to entire file, no extra indentation
namespace MyApp.Services;

class UserService
{
    public string GetUser(int id) => $"User {id}";
}

class EmailService
{
    public void Send(string to, string body) => Console.WriteLine($"To: {to}");
}`,
    explanation: "File-scoped `namespace Name;` (C# 10+) eliminates one level of indentation across the entire file; the convention is to use it for all new files — the whole team saves thousands of indent characters.",
  },
  {
    id: "cs-b15-b2-snippet-collection-expr-spread",
    language: "csharp",
    title: "Collection expression spread operator ..",
    tag: "snippet",
    code: `// Collection expressions with spread (C# 12)
int[] first  = [1, 2, 3];
int[] second = [4, 5, 6];

// Spread ..: inline elements from another collection
int[] combined = [..first, ..second, 7, 8];
Console.WriteLine(string.Join(",", combined));  // 1,2,3,4,5,6,7,8

// Works with List<T>
List<string> names = ["Alice", ..new[] { "Bob", "Carol" }, "Dave"];

// Useful for prepend/append without allocating lists
int[] withHeader = [0, ..combined];
int[] withFooter = [..combined, 99];`,
    explanation: "The spread element `..collection` in a C# 12 collection expression inlines all elements from the collection — a clean replacement for `Concat` or manual `AddRange` calls.",
  },
  {
    id: "cs-b15-b2-snippet-raw-string-literal",
    language: "csharp",
    title: "Raw string literals for multi-line text",
    tag: "snippet",
    code: `// Raw string literal (C# 11): no escaping needed inside
string json = """
    {
        "name": "Alice",
        "age": 30,
        "path": "C:\\Users\\Alice"
    }
    """;

Console.WriteLine(json);

// Three or more quotes to start; same count to end
// Leading whitespace matched to closing """ is stripped
string regex = """^\d{3}-\d{4}$""";

// Interpolated raw strings
string name = "World";
string greeting = $"""Hello, {name}! Use {{braces}} literally.""";
Console.WriteLine(greeting);  // Hello, World! Use {braces} literally.`,
    explanation: "Raw string literals (`\"\"\"...\"\"\"`) don't require escaping backslashes or quotes inside; leading whitespace up to the closing `\"\"\"` is stripped — ideal for SQL, JSON, and regex strings.",
  },
  {
    id: "cs-b15-b2-snippet-pattern-list",
    language: "csharp",
    title: "List pattern matching (C# 11)",
    tag: "snippet",
    code: `int[] empty = [];
int[] one   = [42];
int[] many  = [1, 2, 3, 4, 5];

string Describe(int[] arr) => arr switch
{
    []          => "empty",
    [var x]     => $"single: {x}",
    [var a, var b] => $"pair: {a}, {b}",
    [1, ..]     => "starts with 1",
    [.., var last] => $"ends with {last}",
};

Console.WriteLine(Describe(empty));   // empty
Console.WriteLine(Describe(one));     // single: 42
Console.WriteLine(Describe(many));    // starts with 1`,
    explanation: "List patterns (C# 11) match arrays and lists by length and content; `..` is a discard/slice that matches zero or more elements. Captures with `var` bind matched elements for use in the expression.",
  },
  {
    id: "cs-b15-b2-caveat-boxing-perf",
    language: "csharp",
    title: "Boxing in generic collections vs non-generic",
    tag: "caveats",
    code: `using System.Collections;
using System.Collections.Generic;

// ArrayList (pre-generics): boxes every value type!
var al = new ArrayList();
al.Add(42);       // 42 is boxed to object on heap
int val = (int)al[0];   // unboxed back

// List<int>: NO boxing — stores ints directly
var list = new List<int>();
list.Add(42);     // stored as raw int (no heap allocation for the value)

// Impact at scale
var arrayListInts = new ArrayList();
var genericInts   = new List<int>();

for (int i = 0; i < 1_000_000; i++) arrayListInts.Add(i);  // 1M heap objects
for (int i = 0; i < 1_000_000; i++) genericInts.Add(i);    // 1 array on heap`,
    explanation: "Non-generic collections like `ArrayList` box every value type, creating heap objects and GC pressure; generic `List<T>` stores value types directly — prefer generics for all new code.",
  },
  {
    id: "cs-b15-b2-caveat-struct-in-interface",
    language: "csharp",
    title: "Struct implementing interface — boxing trap",
    tag: "caveats",
    code: `interface IResettable { void Reset(); }

struct Counter : IResettable
{
    public int Value;

    public void Reset()
    {
        Value = 0;   // this works on the boxed copy, not the original!
    }
}

Counter c = new Counter { Value = 5 };
IResettable r = c;   // boxing! r holds a heap copy
r.Reset();           // resets the heap copy

Console.WriteLine(c.Value);   // 5 — original unchanged!

// Fix: use ref parameter or avoid interface mutation for structs
void Reset(ref Counter counter) => counter.Value = 0;`,
    explanation: "Casting a struct to an interface boxes it; mutating through the interface modifies the boxed heap copy, not the original stack variable. Structs that implement stateful interfaces are a common source of bugs.",
  },
  {
    id: "cs-b15-b2-snippet-string-span-ops",
    language: "csharp",
    title: "String operations via ReadOnlySpan<char>",
    tag: "snippet",
    code: `string input = "  Hello, World!  ";

// Trim without allocation (returns a ReadOnlySpan<char>)
ReadOnlySpan<char> trimmed = input.AsSpan().Trim();
Console.WriteLine(trimmed.ToString());   // Hello, World!

// Split without allocating a string[] (manual scan)
ReadOnlySpan<char> data = "Alice,Bob,Carol";
int comma = data.IndexOf(',');
ReadOnlySpan<char> first = data[..comma];
ReadOnlySpan<char> rest  = data[(comma + 1)..];
Console.WriteLine(first.ToString());   // Alice

// Contains check
Console.WriteLine(data.Contains("Bob", StringComparison.Ordinal));  // True`,
    explanation: "`string.AsSpan()` and `ReadOnlySpan<char>` let you slice and search strings without allocating substrings; operations like `Trim()`, `IndexOf`, and `Contains` work on spans for zero-allocation string processing.",
  },
  {
    id: "cs-b15-b2-snippet-pattern-type-var",
    language: "csharp",
    title: "Type pattern with var binding",
    tag: "snippet",
    code: `object[] items = { 42, "hello", 3.14, null, true, new int[] { 1, 2 } };

foreach (object item in items)
{
    string desc = item switch
    {
        null           => "null",
        int n          => $"int: {n}",
        string s       => $"string: '{s}'",
        double d       => $"double: {d:F2}",
        bool b         => $"bool: {b}",
        int[] { Length: var len } => $"int[{len}]",
        var x          => $"other: {x.GetType().Name}",
    };
    Console.WriteLine(desc);
}`,
    explanation: "Type patterns (`int n`) test type and bind in one step; `var x` is a catch-all that matches any non-null value; nested property patterns `{ Length: var len }` further destructure the matched object.",
  },
  {
    id: "cs-b15-b2-understand-value-task-pitfall",
    language: "csharp",
    title: "ValueTask can only be awaited once (trace)",
    tag: "understanding",
    code: `async ValueTask<int> GetOnce()
{
    await Task.Delay(1);
    return 42;
}

// ValueTask must be awaited exactly once
var vt = GetOnce();
int result1 = await vt;    // OK

// Awaiting a second time is UNDEFINED BEHAVIOR
// int result2 = await vt;  // may return wrong value or throw!

// If you need to await multiple times, convert to Task first:
var vt2 = GetOnce();
Task<int> t = vt2.AsTask();
int r1 = await t;
int r2 = await t;   // OK — Task can be awaited multiple times`,
    explanation: "`ValueTask` may use an underlying pooled object that's returned after the first await; awaiting it again accesses freed memory. If you need multiple awaits, call `.AsTask()` to get a regular `Task` first.",
  },
];
