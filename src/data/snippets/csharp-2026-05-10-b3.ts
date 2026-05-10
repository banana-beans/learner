import type { Snippet } from "./types";

export const csharpSnippets20260510B3: Snippet[] = [
  // ── snippet ──────────────────────────────────────────────────────────────
  {
    id: "cs-async-enumerable",
    language: "csharp",
    title: "IAsyncEnumerable<T> — streaming async sequences",
    tag: "snippet",
    code: `using System.Runtime.CompilerServices;

async IAsyncEnumerable<int> GenerateAsync(
    [EnumeratorCancellation] CancellationToken ct = default)
{
    for (int i = 0; i < 100; i++)
    {
        await Task.Delay(10, ct);
        yield return i;
    }
}

await foreach (int n in GenerateAsync().WithCancellation(token))
    Console.WriteLine(n);`,
    explanation:
      "IAsyncEnumerable<T> allows async iteration with await foreach; [EnumeratorCancellation] enables the token injected via WithCancellation to cancel mid-iteration.",
  },
  {
    id: "cs-pipeline-reader",
    language: "csharp",
    title: "System.IO.Pipelines — high-performance I/O",
    tag: "snippet",
    code: `using System.IO.Pipelines;

async Task FillPipe(PipeWriter writer, CancellationToken ct)
{
    while (!ct.IsCancellationRequested)
    {
        Memory<byte> buf = writer.GetMemory(512);
        int read = await ReadFromSource(buf, ct);
        if (read == 0) break;
        writer.Advance(read);
        await writer.FlushAsync(ct);
    }
    await writer.CompleteAsync();
}

private static Task<int> ReadFromSource(Memory<byte> buf, CancellationToken ct)
    => Task.FromResult(0);`,
    explanation:
      "Pipelines eliminate buffer copying between read and parse stages; GetMemory borrows from a shared pool, Advance commits the filled portion, and backpressure is built-in via FlushAsync.",
  },
  {
    id: "cs-http-client-factory",
    language: "csharp",
    title: "IHttpClientFactory — lifecycle-managed HttpClient",
    tag: "snippet",
    code: `// In Program.cs / Startup.cs:
builder.Services.AddHttpClient("github", c =>
{
    c.BaseAddress = new Uri("https://api.github.com/");
    c.DefaultRequestHeaders.Add("User-Agent", "MyApp");
});

// In consumer:
class GitHubService(IHttpClientFactory factory)
{
    public async Task<string> GetReposAsync()
    {
        using var client = factory.CreateClient("github");
        return await client.GetStringAsync("repos");
    }
}`,
    explanation:
      "IHttpClientFactory manages HttpMessageHandler lifetimes to prevent socket exhaustion from creating new HttpClient instances; named clients centralise base address and header configuration.",
  },
  {
    id: "cs-array-pool",
    language: "csharp",
    title: "ArrayPool<T> — rent and return buffers",
    tag: "snippet",
    code: `using System.Buffers;

static void ProcessData(ReadOnlySpan<byte> input)
{
    byte[] rented = ArrayPool<byte>.Shared.Rent(input.Length * 2);
    try
    {
        Span<byte> work = rented.AsSpan(0, input.Length * 2);
        input.CopyTo(work);
        // ... transform work ...
    }
    finally
    {
        ArrayPool<byte>.Shared.Return(rented, clearArray: false);
    }
}`,
    explanation:
      "ArrayPool avoids LOH allocations for large temporary buffers; Rent returns an array that may be larger than requested — always track the actual length separately and always Return in finally.",
  },
  {
    id: "cs-time-provider",
    language: "csharp",
    title: "TimeProvider — injectable, testable time (NET 8)",
    tag: "snippet",
    code: `class Scheduler(TimeProvider clock)
{
    public bool IsExpired(DateTimeOffset deadline) =>
        clock.GetUtcNow() > deadline;

    public ITimer CreateTimer(TimerCallback cb, TimeSpan period) =>
        clock.CreateTimer(cb, null, period, period);
}

// Production:
var s = new Scheduler(TimeProvider.System);

// Test:
var fake = new FakeTimeProvider();
fake.Advance(TimeSpan.FromHours(1));
var ts = new Scheduler(fake);`,
    explanation:
      "TimeProvider (abstract in .NET 8) replaces direct DateTime.UtcNow calls; inject it so tests can control time via FakeTimeProvider from Microsoft.Extensions.TimeProvider.Testing.",
  },
  {
    id: "cs-data-annotations",
    language: "csharp",
    title: "Data annotations + Validator.TryValidateObject",
    tag: "snippet",
    code: `using System.ComponentModel.DataAnnotations;

class CreateUserRequest
{
    [Required, StringLength(50, MinimumLength = 2)]
    public string Name { get; set; } = "";

    [EmailAddress]
    public string Email { get; set; } = "";

    [Range(0, 150)]
    public int Age { get; set; }
}

var req = new CreateUserRequest { Name = "A", Email = "bad", Age = -1 };
var ctx = new ValidationContext(req);
var errors = new List<ValidationResult>();
bool valid = Validator.TryValidateObject(req, ctx, errors, validateAllProperties: true);
foreach (var e in errors) Console.WriteLine(e.ErrorMessage);`,
    explanation:
      "TryValidateObject validates all annotated properties in one call; ASP.NET Core calls this automatically and populates ModelState, but you can use it directly in domain or service layers.",
  },
  {
    id: "cs-configuration-builder",
    language: "csharp",
    title: "ConfigurationBuilder — layered configuration",
    tag: "snippet",
    code: `using Microsoft.Extensions.Configuration;

var config = new ConfigurationBuilder()
    .SetBasePath(Directory.GetCurrentDirectory())
    .AddJsonFile("appsettings.json",         optional: false, reloadOnChange: true)
    .AddJsonFile("appsettings.Development.json", optional: true)
    .AddEnvironmentVariables()
    .AddCommandLine(args)
    .Build();

string connStr = config.GetConnectionString("Default")!;
int port       = config.GetValue<int>("Server:Port", defaultValue: 8080);`,
    explanation:
      "Providers added later override earlier ones; this standard layer stack (json → env → command-line) lets environment variables and CLI args override file-based defaults cleanly.",
  },
  {
    id: "cs-options-pattern",
    language: "csharp",
    title: "Options pattern — strongly-typed configuration sections",
    tag: "snippet",
    code: `class DatabaseOptions
{
    public const string Section = "Database";
    public string ConnectionString { get; set; } = "";
    public int    CommandTimeout   { get; set; } = 30;
}

// Registration:
builder.Services.Configure<DatabaseOptions>(
    builder.Configuration.GetSection(DatabaseOptions.Section));

// Consumption:
class Repo(IOptions<DatabaseOptions> opts)
{
    string Conn => opts.Value.ConnectionString;
}`,
    explanation:
      "IOptions<T> binds a configuration section to a strongly-typed class at startup; IOptionsSnapshot<T> refreshes per request; IOptionsMonitor<T> supports change notifications.",
  },
  {
    id: "cs-typed-http-client",
    language: "csharp",
    title: "Typed HttpClient pattern",
    tag: "snippet",
    code: `class WeatherClient(HttpClient http)
{
    public async Task<string> GetForecastAsync(string city)
    {
        var response = await http.GetFromJsonAsync<WeatherResponse>(
            \$"forecast?city={Uri.EscapeDataString(city)}");
        return response?.Summary ?? "N/A";
    }
}

record WeatherResponse(string Summary);

// Registration:
builder.Services.AddHttpClient<WeatherClient>(c =>
    c.BaseAddress = new Uri("https://api.weather.example.com/"));`,
    explanation:
      "A typed client wraps HttpClient with domain methods; AddHttpClient<T> creates a named client matching the type, managing its lifetime and base address configuration.",
  },
  {
    id: "cs-minimal-api",
    language: "csharp",
    title: "Minimal API with route groups and filters",
    tag: "snippet",
    code: `var app = WebApplication.Create(args);

var items = app.MapGroup("/items")
    .RequireAuthorization()
    .WithTags("Items");

items.MapGet("/",         () => Results.Ok(ItemDb.All()));
items.MapGet("/{id:int}", (int id) =>
    ItemDb.Find(id) is { } item ? Results.Ok(item) : Results.NotFound());
items.MapPost("/",        ([FromBody] CreateItemDto dto) => {
    var item = ItemDb.Create(dto);
    return Results.Created(\$"/items/{item.Id}", item);
});

app.Run();`,
    explanation:
      "MapGroup shares route prefix, middleware (RequireAuthorization), and metadata (WithTags) across all child endpoints; route constraints like {id:int} provide automatic 400 responses.",
  },

  // ── understanding ─────────────────────────────────────────────────────────
  {
    id: "cs-understand-ref-struct",
    language: "csharp",
    title: "ref struct — why Span<T> can't live on the heap",
    tag: "understanding",
    code: `ref struct StackOnly
{
    public int Value;
}

// These are all illegal:
// StackOnly[] arr = new StackOnly[10];    // no array
// object boxed = new StackOnly();          // no boxing
// class Container { StackOnly field; }     // no heap storage
// async Task UseIt() { var s = new StackOnly(); await Task.Delay(1); }  // no async

// Legal — stack only:
Span<byte> span = stackalloc byte[64];`,
    explanation:
      "ref structs are guaranteed to live on the stack; this constraint lets the GC ignore them and enables Span<T> to safely point into stack memory, which the GC must not move.",
  },
  {
    id: "cs-understand-configure-await",
    language: "csharp",
    title: "ConfigureAwait(false) — avoiding context capture",
    tag: "understanding",
    code: `// Library code — don't need to resume on original context
async Task<Data> LoadAsync()
{
    var raw = await FetchRawAsync().ConfigureAwait(false);
    // continuation runs on any thread pool thread — OK for lib
    return Parse(raw);
}

// App code (UI / ASP.NET Classic) — need original context
async void Button_Click(object s, EventArgs e)
{
    var data = await LoadAsync();  // no ConfigureAwait
    label.Text = data.Name;        // must be on UI thread
}`,
    explanation:
      "ConfigureAwait(false) tells the awaiter not to capture and restore the current SynchronizationContext, reducing overhead and preventing deadlocks in library code that doesn't need the UI thread.",
  },
  {
    id: "cs-understand-cancellation-token",
    language: "csharp",
    title: "CancellationToken — cooperative cancellation",
    tag: "understanding",
    code: `async Task DoWorkAsync(CancellationToken ct)
{
    for (int i = 0; i < 100; i++)
    {
        ct.ThrowIfCancellationRequested();    // check before work
        await Task.Delay(100, ct);            // pass to awaitables
    }
}

using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(1));
try
{
    await DoWorkAsync(cts.Token);
}
catch (OperationCanceledException)
{
    Console.WriteLine("Cancelled");
}`,
    explanation:
      "CancellationToken is a value type — pass it everywhere rather than checking a shared bool; ThrowIfCancellationRequested and passing to awaitables are the two standard cooperative cancellation patterns.",
  },
  {
    id: "cs-understand-aggregate-exception",
    language: "csharp",
    title: "Task.WhenAll error handling — AggregateException",
    tag: "understanding",
    code: `var tasks = new[]
{
    Task.Run(() => throw new InvalidOperationException("A")),
    Task.Run(() => throw new ArgumentException("B")),
};

try
{
    await Task.WhenAll(tasks);
}
catch (Exception e)
{
    // await unwraps the first exception only:
    Console.WriteLine(e.Message);  // "A"
}

// To see all exceptions:
var aggregate = tasks[0].Exception!;  // or tasks[1].Exception`,
    explanation:
      "Task.WhenAll waits for all tasks but await unwraps only the first exception from the AggregateException; examine each Task.Exception to collect all failures.",
  },
  {
    id: "cs-understand-async-local",
    language: "csharp",
    title: "AsyncLocal<T> — ambient data flowing through async calls",
    tag: "understanding",
    code: `static readonly AsyncLocal<string?> CorrelationId = new();

async Task HandleRequest(string id)
{
    CorrelationId.Value = id;
    await ProcessAsync();        // CorrelationId flows into this call
}

async Task ProcessAsync()
{
    Console.WriteLine(CorrelationId.Value);  // still visible here

    // Child tasks get a copy — changes don't flow back up:
    await Task.Run(() => CorrelationId.Value = "child");  // doesn't affect parent
    Console.WriteLine(CorrelationId.Value);  // original id
}`,
    explanation:
      "AsyncLocal<T> flows ambient values down into child async operations (like CallContext in synchronous code); changes in child tasks are isolated, preventing accidental mutation of the parent's context.",
  },
  {
    id: "cs-understand-thread-local",
    language: "csharp",
    title: "ThreadLocal<T> vs AsyncLocal<T>",
    tag: "understanding",
    code: `static readonly ThreadLocal<Random> Rng =
    new(() => new Random(Thread.CurrentThread.ManagedThreadId));

// Safe: each thread gets its own Random instance
Parallel.For(0, 4, i => Console.WriteLine(Rng.Value!.Next()));

// AsyncLocal flows with async context (not thread):
static readonly AsyncLocal<string> Label = new();
Label.Value = "main";
await Task.Run(() => Console.WriteLine(Label.Value));  // "main" — flows through`,
    explanation:
      "ThreadLocal<T> ties a value to a physical thread (good for non-thread-safe objects like Random); AsyncLocal<T> flows through logical async execution contexts regardless of which thread runs the code.",
  },

  // ── structures ────────────────────────────────────────────────────────────
  {
    id: "cs-recyclable-memory-stream",
    language: "csharp",
    title: "RecyclableMemoryStream — LOH-safe memory streams",
    tag: "structures",
    code: `using Microsoft.IO;

static readonly RecyclableMemoryStreamManager Manager =
    new RecyclableMemoryStreamManager();

async Task SerialiseAsync<T>(T obj)
{
    using var ms = Manager.GetStream();          // pooled, avoids LOH
    await JsonSerializer.SerializeAsync(ms, obj);
    byte[] bytes = ms.ToArray();
    await SendAsync(bytes);
}

private static Task SendAsync(byte[] bytes) => Task.CompletedTask;`,
    explanation:
      "RecyclableMemoryStream (from Microsoft.IO.RecyclableMemoryStream NuGet) uses a pool of small blocks to avoid LOH allocations that large MemoryStream buffers would cause.",
  },
  {
    id: "cs-sequence-reader",
    language: "csharp",
    title: "SequenceReader<T> — parse ReadOnlySequence without copies",
    tag: "structures",
    code: `using System.Buffers;

bool TryReadLength(ref SequenceReader<byte> reader, out int length)
{
    length = 0;
    if (reader.Remaining < 4) return false;

    Span<byte> buf = stackalloc byte[4];
    reader.TryCopyTo(buf);
    reader.Advance(4);
    length = System.Buffers.Binary.BinaryPrimitives.ReadInt32BigEndian(buf);
    return true;
}`,
    explanation:
      "SequenceReader<T> navigates a potentially multi-segment ReadOnlySequence<T> (produced by Pipelines) without copying data; TryCopyTo reads spanning segments into a contiguous buffer.",
  },
  {
    id: "cs-concurrent-dictionary",
    language: "csharp",
    title: "ConcurrentDictionary — thread-safe map",
    tag: "structures",
    code: `var counts = new ConcurrentDictionary<string, int>();

// Thread-safe increment:
counts.AddOrUpdate("hits",
    addValue:    1,
    updateValueFactory: (_, existing) => existing + 1);

// GetOrAdd — factory may run multiple times under contention!
var expiry = counts.GetOrAdd("session",
    _ => ExpensiveCompute());  // may be called more than once

// Atomic-only operations:
bool set = counts.TryAdd("flag", 1);
bool upd = counts.TryUpdate("hits", newValue: 5, comparisonValue: 4);`,
    explanation:
      "GetOrAdd and AddOrUpdate are NOT atomic — the factory can run multiple times; use Lazy<T> wrapping or separate locking when the value must only be computed once.",
  },
  {
    id: "cs-sorted-set",
    language: "csharp",
    title: "SortedSet<T> — ordered unique elements",
    tag: "structures",
    code: `var set = new SortedSet<int> { 5, 2, 8, 1, 9, 3 };

Console.WriteLine(set.Min);   // 1
Console.WriteLine(set.Max);   // 9

// Range view — O(log n) to find boundaries
var view = set.GetViewBetween(3, 8);
Console.WriteLine(string.Join(",", view));  // 3,5,8

// Reversal
foreach (int n in set.Reverse()) Console.Write(n + " ");  // 9 8 5 3 2 1`,
    explanation:
      "SortedSet is a balanced binary search tree; GetViewBetween returns a live view (not a copy) of elements in the range, so mutations to the set are visible through the view.",
  },
  {
    id: "cs-linked-list",
    language: "csharp",
    title: "LinkedList<T> — O(1) insert/remove at known node",
    tag: "structures",
    code: `var list = new LinkedList<string>(["A", "B", "D"]);
var bNode = list.Find("B")!;

// O(1) insert after known node — no shifting
list.AddAfter(bNode, "C");
Console.WriteLine(string.Join("→", list));  // A→B→C→D

// O(1) remove
list.Remove(bNode);
Console.WriteLine(string.Join("→", list));  // A→C→D`,
    explanation:
      "LinkedList<T> provides O(1) insertion and deletion given a LinkedListNode<T>; finding the node is O(n), so it is useful when you cache nodes from a previous traversal.",
  },

  // ── caveats ───────────────────────────────────────────────────────────────
  {
    id: "cs-caveat-parallel-shared-state",
    language: "csharp",
    title: "Parallel.For with shared mutable state",
    tag: "caveats",
    code: `int total = 0;

// WRONG — race condition; total can lose updates
Parallel.For(0, 1000, i => total += i);
Console.WriteLine(total);  // unpredictable

// CORRECT — Interlocked for atomic add
int safe = 0;
Parallel.For(0, 1000, i => Interlocked.Add(ref safe, i));
Console.WriteLine(safe);   // 499500

// BETTER — local subtotals + final reduce
Parallel.For(0, 1000,
    () => 0,                              // local init
    (i, _, sub) => sub + i,              // body
    sub => Interlocked.Add(ref safe, sub)); // combine`,
    explanation:
      "+= is not atomic; concurrent increments race and lose updates; Interlocked.Add is lock-free atomic; the localInit overload of Parallel.For minimises interlocked calls by accumulating locally.",
  },
  {
    id: "cs-caveat-gc-collect",
    language: "csharp",
    title: "GC.Collect() is almost never appropriate",
    tag: "caveats",
    code: `// Tempting but harmful:
GC.Collect();           // forces Gen2 collection — expensive, pauses threads
GC.WaitForPendingFinalizers();  // waits for finalizer queue — can deadlock

// The GC's heuristics are almost always better than manual hints.

// Rare legitimate use: after releasing a large object in a benchmark
// to get a clean baseline measurement:
LargeObject = null;
GC.Collect();
GC.WaitForPendingFinalizers();
GC.Collect();`,
    explanation:
      "Manual GC.Collect interrupts all threads, promotes objects to higher generations (making future collections more expensive), and defeats the GC's tuned heuristics — only use it in test/benchmark teardown.",
  },
  {
    id: "cs-caveat-timer-drift",
    language: "csharp",
    title: "System.Threading.Timer fires on thread pool — not UI thread",
    tag: "caveats",
    code: `// Timer callback runs on a thread-pool thread — not safe to touch UI:
var timer = new System.Threading.Timer(_ =>
{
    // label.Text = "..."; // InvalidOperationException on WinForms/WPF!

    // Must marshal to UI thread:
    label.Invoke(() => label.Text = DateTime.Now.ToString());
}, null, TimeSpan.Zero, TimeSpan.FromSeconds(1));

// PeriodicTimer avoids the problem by letting you await on the UI thread:
using var pt = new PeriodicTimer(TimeSpan.FromSeconds(1));
while (await pt.WaitForNextTickAsync())
    label.Text = DateTime.Now.ToString();  // running on whatever context awaited`,
    explanation:
      "Threading.Timer callbacks execute on thread-pool threads; UI controls must be updated on their owning thread — use Invoke/BeginInvoke or prefer PeriodicTimer with async/await instead.",
  },
  {
    id: "cs-caveat-event-leak",
    language: "csharp",
    title: "Event handler memory leak — subscriber keeps publisher alive",
    tag: "caveats",
    code: `class EventSource  { public event EventHandler? DataReceived; }

class Subscriber
{
    public Subscriber(EventSource src)
    {
        src.DataReceived += OnData;   // src now holds a reference to this
    }

    void OnData(object? s, EventArgs e) { }
    // If Subscriber is "released" but never unsubscribes,
    // EventSource keeps it alive through the delegate list.
}

// Fix: implement IDisposable and unsubscribe:
public void Dispose() => _source.DataReceived -= OnData;`,
    explanation:
      "Event subscriptions create a strong reference from publisher to subscriber; if the publisher outlives the subscriber, the subscriber cannot be garbage-collected until the handler is removed.",
  },
  {
    id: "cs-caveat-generic-static",
    language: "csharp",
    title: "Generic static fields are per type argument",
    tag: "caveats",
    code: `class Cache<T>
{
    // Separate static field for each T!
    public static int Count = 0;
    public static void Add() => Count++;
}

Cache<int>.Add();
Cache<string>.Add();
Cache<double>.Add();

Console.WriteLine(Cache<int>.Count);    // 1
Console.WriteLine(Cache<string>.Count); // 1 — NOT 3!
Console.WriteLine(Cache<double>.Count); // 1`,
    explanation:
      "The CLR creates a distinct class for each closed generic type; static fields are per-closed-type, not shared across all T — do not use generic statics as a global counter or cache.",
  },
  {
    id: "cs-caveat-boxing-perf",
    language: "csharp",
    title: "Boxing value types into object — hidden allocations",
    tag: "caveats",
    code: `// Boxing: struct copied to heap-allocated object wrapper
int n = 42;
object boxed = n;       // heap allocation + copy

// Unboxing: copies value out of box, throws if wrong type
int back = (int)boxed;  // OK
// long bad = (long)boxed; // InvalidCastException

// Hidden boxing in older APIs:
ArrayList list = new ArrayList();
list.Add(42);        // boxes each int!

// Use generic collections to avoid boxing:
List<int> safeList = new List<int>();
safeList.Add(42);    // no boxing`,
    explanation:
      "Boxing allocates a heap object for each value type stored as object or interface; in tight loops this creates GC pressure — use generic collections and interfaces to avoid boxing.",
  },

  // ── types ─────────────────────────────────────────────────────────────────
  {
    id: "cs-type-delegate",
    language: "csharp",
    title: "Custom delegates vs Func/Action — when to use each",
    tag: "types",
    code: `// Custom delegate: adds a named type to the API surface
delegate double Transform(double input);

Transform square = x => x * x;
Transform cube   = x => x * x * x;

// Func equivalent — anonymous, no type name benefit
Func<double, double> squareFn = x => x * x;

// Prefer Func/Action for internal / generic code
// Prefer named delegate when the signature needs a distinct type in the public API`,
    explanation:
      "Custom delegates give the parameter a meaningful type name in IntelliSense and allow overloads to distinguish otherwise identical signatures; Func/Action reduce boilerplate for internal callbacks.",
  },
  {
    id: "cs-type-nullable-struct",
    language: "csharp",
    title: "Nullable<T> — value type with null state",
    tag: "types",
    code: `int? x = null;   // Nullable<int>

// Check before use:
if (x.HasValue)
    Console.WriteLine(x.Value);

// Null-coalescing:
int result = x ?? -1;

// Pattern matching (preferred):
if (x is int n)
    Console.WriteLine(n);

// Arithmetic propagates null:
int? sum = x + 5;  // null`,
    explanation:
      "Nullable<T> is a struct wrapping T with a bool HasValue flag; arithmetic and comparisons propagate null (lifted operators); pattern matching extracts the value safely without boxing.",
  },
  {
    id: "cs-type-anonymous",
    language: "csharp",
    title: "Anonymous types — projection results",
    tag: "types",
    code: `var people = new[] {
    new { Name = "Alice", Age = 30 },
    new { Name = "Bob",   Age = 25 }
};

// LINQ projection to anonymous type:
var result = people
    .Where(p => p.Age > 20)
    .Select(p => new { p.Name, Score = p.Age * 2 });

foreach (var r in result)
    Console.WriteLine(\$"{r.Name}: {r.Score}");`,
    explanation:
      "Anonymous types are compiler-generated immutable classes with value equality; they are convenient for LINQ projections but cannot cross method boundaries — use records or tuples when you need to return them.",
  },
  {
    id: "cs-type-tuple-named",
    language: "csharp",
    title: "ValueTuple with named elements",
    tag: "types",
    code: `// Named tuple elements:
(string Name, int Age) GetPerson() => ("Alice", 30);

var (name, age) = GetPerson();   // deconstruction
Console.WriteLine(name);         // Alice

// In LINQ:
var stats = numbers.Aggregate(
    (Min: int.MaxValue, Max: int.MinValue, Sum: 0L),
    (acc, n) => (Math.Min(acc.Min, n), Math.Max(acc.Max, n), acc.Sum + n));

Console.WriteLine(\$"Min={stats.Min} Max={stats.Max} Sum={stats.Sum}");`,
    explanation:
      "ValueTuple elements with names are syntactic sugar — names exist only in source and metadata, not at runtime; they make tuple-returning methods self-documenting without needing a full class.",
  },
  {
    id: "cs-type-open-interface",
    language: "csharp",
    title: "Open generic interface and typeof(I<>)",
    tag: "types",
    code: `interface IHandler<T> { void Handle(T message); }

// Discover all closed implementations at startup:
var handlers = Assembly.GetExecutingAssembly()
    .GetTypes()
    .Where(t => t.GetInterfaces().Any(i =>
        i.IsGenericType && i.GetGenericTypeDefinition() == typeof(IHandler<>)))
    .ToList();

foreach (var h in handlers)
{
    var msgType = h.GetInterfaces()
        .First(i => i.IsGenericType && i.GetGenericTypeDefinition() == typeof(IHandler<>))
        .GetGenericArguments()[0];
    Console.WriteLine(\$"{h.Name} handles {msgType.Name}");
}`,
    explanation:
      "typeof(IHandler<>) is the open generic type; comparing GetGenericTypeDefinition() against it lets you discover and register all message handler implementations at startup via reflection.",
  },

  // ── families ──────────────────────────────────────────────────────────────
  {
    id: "cs-family-hosted-service",
    language: "csharp",
    title: "IHostedService vs BackgroundService",
    tag: "families",
    code: `// IHostedService — full control
class StartupTask : IHostedService
{
    public Task StartAsync(CancellationToken ct) { /* warm cache */ return Task.CompletedTask; }
    public Task StopAsync(CancellationToken ct) => Task.CompletedTask;
}

// BackgroundService — long-running loops (implements IHostedService)
class Poller : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        while (!ct.IsCancellationRequested)
        {
            await PollAsync();
            await Task.Delay(TimeSpan.FromMinutes(1), ct);
        }
    }

    private Task PollAsync() => Task.CompletedTask;
}`,
    explanation:
      "IHostedService is for one-shot startup/shutdown tasks; BackgroundService provides the ExecuteAsync loop scaffold where the host handles cancellation on shutdown.",
  },
  {
    id: "cs-family-orm-comparison",
    language: "csharp",
    title: "EF Core vs Dapper vs ADO.NET",
    tag: "families",
    code: `// EF Core — LINQ, change tracking, migrations, code-first schema
var users = await db.Users.Where(u => u.Age > 18).ToListAsync();

// Dapper — SQL strings, lightweight, micro-ORM
var users2 = await conn.QueryAsync<User>(
    "SELECT * FROM Users WHERE Age > @age", new { age = 18 });

// ADO.NET — maximum control, maximum verbosity
using var cmd = new SqlCommand("SELECT * FROM Users WHERE Age > @a", conn);
cmd.Parameters.AddWithValue("@a", 18);
using var reader = await cmd.ExecuteReaderAsync();`,
    explanation:
      "EF Core is best for applications that need migrations and type-safe LINQ; Dapper is ideal for complex queries that EF would generate poorly; ADO.NET when every microsecond counts.",
  },
  {
    id: "cs-family-testing-frameworks",
    language: "csharp",
    title: "xUnit vs NUnit vs MSTest — comparison",
    tag: "families",
    code: `// xUnit — constructor DI, Fact/Theory, no [SetUp]
public class CalculatorTests
{
    [Fact]
    public void Add_ReturnsSum() => Assert.Equal(3, 1 + 2);

    [Theory, InlineData(1,2,3), InlineData(-1,-2,-3)]
    public void Add_Theory(int a, int b, int expected)
        => Assert.Equal(expected, a + b);
}

// NUnit — [SetUp]/[TearDown], Assert.That
// MSTest — [TestMethod], [DataRow], Assert.AreEqual`,
    explanation:
      "xUnit is preferred for new projects (no shared state between tests via constructor injection); NUnit is popular in older codebases; MSTest is Microsoft's native runner integrated into Visual Studio.",
  },
  {
    id: "cs-family-span-memory-segment",
    language: "csharp",
    title: "Span<T> vs Memory<T> vs ArraySegment<T>",
    tag: "families",
    code: `byte[] arr = new byte[256];

// Span<T> — ref struct, stack only, cannot cross async
Span<byte> span = arr.AsSpan(0, 128);

// Memory<T> — heap-storable, async-compatible
Memory<byte> mem = arr.AsMemory(0, 128);
async Task UseMemory(Memory<byte> m) { await Task.Delay(1); m.Span[0] = 0xFF; }

// ArraySegment<T> — pre-Span legacy, implements IList<T>
ArraySegment<byte> seg = new ArraySegment<byte>(arr, 0, 128);
IList<byte> list = seg;  // can use as IList`,
    explanation:
      "Span is the fastest but stack-restricted; Memory bridges to async contexts; ArraySegment is the old API that implements IList<T> — prefer Span/Memory in new code.",
  },
  {
    id: "cs-family-null-handling",
    language: "csharp",
    title: "Null handling patterns — six approaches",
    tag: "families",
    code: `// 1. Explicit null check
if (value == null) throw new ArgumentNullException(nameof(value));

// 2. ArgumentNullException.ThrowIfNull (.NET 6+)
ArgumentNullException.ThrowIfNull(value);

// 3. Null-coalescing operator
string name = input ?? "default";

// 4. Null-conditional operator
int? len = str?.Length;

// 5. is null pattern
if (obj is null) return;
if (obj is not null) Use(obj);

// 6. NullObject pattern — return an empty object instead of null
IEnumerable<Item> GetItems() => _db.Items ?? Enumerable.Empty<Item>();`,
    explanation:
      "ArgumentNullException.ThrowIfNull is the cleanest guard clause in .NET 6+; ?? handles defaults; ?. chains through null safely; is null beats == null when operators are overloaded.",
  },

  // ── classes ───────────────────────────────────────────────────────────────
  {
    id: "cs-class-background-service",
    language: "csharp",
    title: "BackgroundService with graceful shutdown",
    tag: "classes",
    code: `class QueueConsumer(IMessageQueue queue, ILogger<QueueConsumer> log)
    : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        log.LogInformation("Consumer started");
        try
        {
            await foreach (var msg in queue.ReadAllAsync(ct))
            {
                await ProcessAsync(msg, ct);
            }
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            log.LogInformation("Consumer stopping gracefully");
        }
    }

    private Task ProcessAsync(object msg, CancellationToken ct) => Task.CompletedTask;
}`,
    explanation:
      "Catching OperationCanceledException only when the token is cancelled lets other cancellations (timeouts, different tokens) propagate normally; the host sets ct on shutdown.",
  },
  {
    id: "cs-class-custom-json-converter",
    language: "csharp",
    title: "Custom JsonConverter<T>",
    tag: "classes",
    code: `using System.Text.Json;
using System.Text.Json.Serialization;

class VersionConverter : JsonConverter<Version>
{
    public override Version Read(ref Utf8JsonReader r, Type t, JsonSerializerOptions o)
    {
        var s = r.GetString() ?? throw new JsonException("null version");
        return Version.Parse(s);
    }

    public override void Write(Utf8JsonWriter w, Version v, JsonSerializerOptions o)
        => w.WriteStringValue(v.ToString());
}

var opts = new JsonSerializerOptions();
opts.Converters.Add(new VersionConverter());

string json = JsonSerializer.Serialize(new Version(2, 1, 0), opts);
Console.WriteLine(json);  // "2.1.0"`,
    explanation:
      "Custom JsonConverter<T> handles types that System.Text.Json can't serialise by default; register via JsonSerializerOptions or [JsonConverter] attribute on the property or class.",
  },
  {
    id: "cs-class-middleware",
    language: "csharp",
    title: "ASP.NET Core middleware class",
    tag: "classes",
    code: `class RequestTimingMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext ctx)
    {
        var sw = System.Diagnostics.Stopwatch.StartNew();
        try
        {
            await next(ctx);
        }
        finally
        {
            sw.Stop();
            ctx.Response.Headers["X-Response-Time"] =
                \$"{sw.ElapsedMilliseconds}ms";
        }
    }
}

// Registration:
app.UseMiddleware<RequestTimingMiddleware>();`,
    explanation:
      "Middleware classes use primary constructor injection; InvokeAsync receives HttpContext and calls next to pass control down the pipeline; finally runs on both success and exception.",
  },
  {
    id: "cs-class-generic-factory",
    language: "csharp",
    title: "Generic factory with Activator.CreateInstance",
    tag: "classes",
    code: `class Factory<TBase> where TBase : class
{
    private readonly Dictionary<string, Type> _registry = new();

    public void Register<T>(string key) where T : TBase => _registry[key] = typeof(T);

    public TBase Create(string key, params object?[]? args)
    {
        if (!_registry.TryGetValue(key, out var type))
            throw new KeyNotFoundException(key);
        return (TBase)(Activator.CreateInstance(type, args)
               ?? throw new InvalidOperationException());
    }
}

var factory = new Factory<IPlugin>();
factory.Register<JsonPlugin>("json");
factory.Register<XmlPlugin>("xml");
IPlugin plugin = factory.Create("json");`,
    explanation:
      "Activator.CreateInstance reflectively constructs a type by name; the generic constraint TBase : class prevents value types and provides a typed return; args are passed to the constructor.",
  },
  {
    id: "cs-class-retry-policy",
    language: "csharp",
    title: "Retry policy with exponential backoff",
    tag: "classes",
    code: `static async Task<T> RetryAsync<T>(
    Func<CancellationToken, Task<T>> operation,
    int maxAttempts,
    CancellationToken ct)
{
    for (int attempt = 0; attempt < maxAttempts; attempt++)
    {
        try
        {
            return await operation(ct);
        }
        catch (HttpRequestException) when (attempt < maxAttempts - 1)
        {
            var delay = TimeSpan.FromSeconds(Math.Pow(2, attempt));
            await Task.Delay(delay, ct);
        }
    }
    throw new InvalidOperationException("All retries exhausted");
}`,
    explanation:
      "Exponential backoff avoids thundering-herd problems; the when guard re-throws on the final attempt; passing CancellationToken to Task.Delay allows the retry loop to be cancelled.",
  },
  {
    id: "cs-class-event-source",
    language: "csharp",
    title: "EventSource — ETW/cross-platform structured logging",
    tag: "classes",
    code: `using System.Diagnostics.Tracing;

[EventSource(Name = "MyApp-Orders")]
sealed class OrderEvents : EventSource
{
    public static readonly OrderEvents Log = new();

    [Event(1, Level = EventLevel.Informational)]
    public void OrderPlaced(int orderId, decimal total) =>
        WriteEvent(1, orderId, total);

    [Event(2, Level = EventLevel.Error)]
    public void OrderFailed(int orderId, string reason) =>
        WriteEvent(2, orderId, reason);
}

// Usage:
OrderEvents.Log.OrderPlaced(42, 99.99m);`,
    explanation:
      "EventSource emits structured events to ETW on Windows and EventPipe cross-platform; it has near-zero overhead when no listener is active because WriteEvent short-circuits if not enabled.",
  },
  {
    id: "cs-class-guard-clause",
    language: "csharp",
    title: "Guard clause pattern — fail fast at boundaries",
    tag: "classes",
    code: `static class Guard
{
    public static T NotNull<T>(T? value, string name) where T : class
    {
        ArgumentNullException.ThrowIfNull(value, name);
        return value;
    }

    public static int Positive(int value, string name)
    {
        if (value <= 0)
            throw new ArgumentOutOfRangeException(name, value, "Must be positive");
        return value;
    }
}

class OrderService(IOrderRepo repo)
{
    public void Place(Order? order, int quantity)
    {
        var o = Guard.NotNull(order, nameof(order));
        var q = Guard.Positive(quantity, nameof(quantity));
        repo.Save(o, q);
    }
}`,
    explanation:
      "Guard clauses centralise validation logic and keep business methods free of nested if/throw; each guard returns the validated value enabling assignment and validation in one expression.",
  },
  {
    id: "cs-class-immutable-builder",
    language: "csharp",
    title: "Immutable configuration built via mutable builder",
    tag: "classes",
    code: `sealed class ConnectionConfig
{
    public string Host    { get; }
    public int    Port    { get; }
    public bool   UseTls  { get; }

    private ConnectionConfig(Builder b) =>
        (Host, Port, UseTls) = (b.Host, b.Port, b.UseTls);

    public sealed class Builder
    {
        public string Host   { get; set; } = "localhost";
        public int    Port   { get; set; } = 5432;
        public bool   UseTls { get; set; }
        public ConnectionConfig Build() => new(this);
    }
}

var cfg = new ConnectionConfig.Builder
    { Host = "db.prod.example.com", Port = 5433, UseTls = true }
    .Build();`,
    explanation:
      "The nested Builder is mutable during construction and hands off to an immutable outer class via private constructor; callers cannot mutate the config after Build() returns.",
  },
  {
    id: "cs-class-aggregate-event",
    language: "csharp",
    title: "Domain event dispatch after transaction commit",
    tag: "classes",
    code: `class OrderService(OrderRepository repo, IDomainEventDispatcher dispatcher)
{
    public async Task PlaceOrderAsync(Cart cart)
    {
        var order = Order.Create(cart);      // raises domain events internally

        await repo.SaveAsync(order);         // persist — commit transaction

        foreach (var ev in order.PopEvents())
            await dispatcher.DispatchAsync(ev);  // publish AFTER commit
    }
}`,
    explanation:
      "Domain events should be dispatched after the transaction commits to avoid notifying other services about changes that may be rolled back; PopEvents clears the collected events.",
  },

  // ── more snippets ─────────────────────────────────────────────────────────────
  {
    id: "cs-activity-tracing",
    language: "csharp",
    title: "System.Diagnostics.Activity — distributed tracing",
    tag: "snippet",
    code: `using System.Diagnostics;

static readonly ActivitySource Source = new("MyApp.Orders");

async Task ProcessOrderAsync(int orderId)
{
    using var activity = Source.StartActivity("ProcessOrder");
    activity?.SetTag("order.id", orderId);

    try
    {
        await DoWorkAsync();
        activity?.SetStatus(ActivityStatusCode.Ok);
    }
    catch (Exception ex)
    {
        activity?.RecordException(ex);
        activity?.SetStatus(ActivityStatusCode.Error, ex.Message);
        throw;
    }
}

private static Task DoWorkAsync() => Task.CompletedTask;`,
    explanation:
      "ActivitySource/Activity implement W3C TraceContext; tags and events are exported to OpenTelemetry collectors without taking a dependency on any specific APM vendor.",
  },
  {
    id: "cs-unsafe-sizeof",
    language: "csharp",
    title: "Unsafe.SizeOf<T> vs Marshal.SizeOf<T>",
    tag: "snippet",
    code: `using System.Runtime.CompilerServices;
using System.Runtime.InteropServices;

struct Point { public float X, Y; }

// Unsafe.SizeOf: managed in-memory layout (no marshalling)
Console.WriteLine(Unsafe.SizeOf<Point>());       // 8 bytes

// Marshal.SizeOf: unmanaged/native layout (may differ due to blittability)
Console.WriteLine(Marshal.SizeOf<Point>());      // 8 bytes (both same here)

// Use Unsafe.SizeOf for Span arithmetic; Marshal.SizeOf for P/Invoke structs`,
    explanation:
      "Unsafe.SizeOf<T> returns the managed runtime size (always equal to sizeof for blittable types); Marshal.SizeOf<T> returns the native size used in interop, which can differ for non-blittable structs.",
  },
];
