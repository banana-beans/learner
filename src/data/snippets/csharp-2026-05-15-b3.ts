import type { Snippet } from "./types";

export const csharpSnippets20260515B3: Snippet[] = [
  {
    id: "cs-b15-b3-pattern-not",
    language: "csharp",
    title: "Negation pattern with 'not'",
    tag: "snippet",
    code: `object? value = GetValue();
if (value is not null)
    Console.WriteLine(value);

bool IsLetter(char c) => c is not (< 'a' or > 'z') and
                              not (< 'A' or > 'Z');`,
    explanation: "The `not` pattern inverts any pattern. Combining `not`, `and`, and `or` patterns creates expressive boolean conditions without nested if-statements."
  },
  {
    id: "cs-b15-b3-record-with-expression",
    language: "csharp",
    title: "Record with-expression for immutable updates",
    tag: "snippet",
    code: `record Point(double X, double Y);

var origin = new Point(0, 0);
var shifted = origin with { X = 3.0, Y = 4.0 };
var movedX = shifted with { X = shifted.X + 1 };

Console.WriteLine(shifted);   // Point { X = 3, Y = 4 }
Console.WriteLine(movedX);    // Point { X = 4, Y = 4 }`,
    explanation: "`with` creates a shallow copy with specified properties changed. Since records are immutable, this is the idiomatic way to produce modified versions."
  },
  {
    id: "cs-b15-b3-primary-ctor-inject",
    language: "csharp",
    title: "Primary constructors for DI",
    tag: "snippet",
    code: `public class OrderService(
    IOrderRepository repo,
    ILogger<OrderService> logger)
{
    public async Task<Order> GetAsync(int id)
    {
        logger.LogInformation("Fetching order {Id}", id);
        return await repo.GetByIdAsync(id);
    }
}`,
    explanation: "Primary constructor parameters are in scope throughout the class body, eliminating the boilerplate of declaring fields and assigning them in a conventional constructor."
  },
  {
    id: "cs-b15-b3-init-accessor",
    language: "csharp",
    title: "init-only properties for immutable initialization",
    tag: "snippet",
    code: `public class Config
{
    public required string Host { get; init; }
    public required int Port { get; init; }
    public int Timeout { get; init; } = 30;
}

var cfg = new Config { Host = "localhost", Port = 5432 };
// cfg.Host = "other"; // compile error`,
    explanation: "`init` permits assignment only in object initializers or constructors, while `required` enforces that callers always provide the property."
  },
  {
    id: "cs-b15-b3-collection-expr-spread",
    language: "csharp",
    title: "Collection expressions with spread operator",
    tag: "snippet",
    code: `int[] first = [1, 2, 3];
int[] second = [4, 5, 6];
int[] combined = [..first, ..second, 7, 8];

List<string> names = ["Alice", "Bob"];
string[] more = [..names, "Carol"];`,
    explanation: "The `..` spread operator in collection expressions flattens any enumerable inline. The target type determines the concrete collection type created."
  },
  {
    id: "cs-b15-b3-span-slice",
    language: "csharp",
    title: "Span<T> for zero-copy slicing",
    tag: "snippet",
    code: `byte[] buffer = new byte[1024];
FillBuffer(buffer);

Span<byte> header = buffer.AsSpan(0, 16);
Span<byte> payload = buffer.AsSpan(16);

ushort version = System.Buffers.Binary.BinaryPrimitives
    .ReadUInt16BigEndian(header);

static void FillBuffer(byte[] b) { }`,
    explanation: "`Span<T>` slices into existing memory without allocation. `BinaryPrimitives` reads multibyte integers from spans respecting byte order."
  },
  {
    id: "cs-b15-b3-arraypool-rent",
    language: "csharp",
    title: "ArrayPool<T> for temporary buffers",
    tag: "snippet",
    code: `using System.Buffers;

byte[] buffer = ArrayPool<byte>.Shared.Rent(4096);
try
{
    int read = stream.Read(buffer, 0, buffer.Length);
    Process(buffer.AsSpan(0, read));
}
finally
{
    ArrayPool<byte>.Shared.Return(buffer, clearArray: true);
}

static Stream stream = Stream.Null;
static void Process(Span<byte> data) { }`,
    explanation: "`ArrayPool` recycles arrays from a shared pool, avoiding GC pressure for short-lived buffers. `clearArray: true` zeroes sensitive data before returning."
  },
  {
    id: "cs-b15-b3-channel-producer-consumer",
    language: "csharp",
    title: "Channel<T> for producer-consumer pattern",
    tag: "snippet",
    code: `using System.Threading.Channels;

var channel = Channel.CreateUnbounded<int>();

async Task Produce()
{
    for (int i = 0; i < 5; i++)
    {
        await channel.Writer.WriteAsync(i);
    }
    channel.Writer.Complete();
}

async Task Consume()
{
    await foreach (var item in channel.Reader.ReadAllAsync())
        Console.WriteLine(item);
}`,
    explanation: "`Channel<T>` is a thread-safe async queue. `ReadAllAsync` returns an `IAsyncEnumerable` that completes when the writer calls `Complete`."
  },
  {
    id: "cs-b15-b3-valuetask-sync-fast",
    language: "csharp",
    title: "ValueTask for synchronous fast-path",
    tag: "snippet",
    code: `using System.Threading.Tasks;

class Cache
{
    private readonly Dictionary<int, string> _store = new();

    public ValueTask<string> GetAsync(int key)
    {
        if (_store.TryGetValue(key, out var val))
            return ValueTask.FromResult(val);
        return new ValueTask<string>(FetchAsync(key));
    }

    private async Task<string> FetchAsync(int key)
    {
        await Task.Delay(10);
        return _store[key] = $"value_{key}";
    }
}`,
    explanation: "`ValueTask` avoids heap allocation when the result is already available (the common case for caches). `ValueTask.FromResult` wraps a synchronous value cheaply."
  },
  {
    id: "cs-b15-b3-iasync-enumerable",
    language: "csharp",
    title: "IAsyncEnumerable for async streaming",
    tag: "snippet",
    code: `async IAsyncEnumerable<int> GenerateAsync(int count)
{
    for (int i = 0; i < count; i++)
    {
        await Task.Delay(50);
        yield return i;
    }
}

await foreach (var n in GenerateAsync(5))
    Console.WriteLine(n);`,
    explanation: "`yield return` inside an `async` method produces an `IAsyncEnumerable`. Each value is produced only when requested, enabling lazy async streaming."
  },
  {
    id: "cs-b15-b3-parallel-foreach",
    language: "csharp",
    title: "Parallel.ForEach with degree of parallelism",
    tag: "snippet",
    code: `using System.Threading.Tasks;

var options = new ParallelOptions { MaxDegreeOfParallelism = 4 };
var results = new System.Collections.Concurrent.ConcurrentBag<int>();

Parallel.ForEach(Enumerable.Range(1, 20), options, n =>
{
    results.Add(n * n);
});

Console.WriteLine(string.Join(", ", results.OrderBy(x => x)));`,
    explanation: "`MaxDegreeOfParallelism` caps CPU threads. `ConcurrentBag<T>` handles thread-safe writes without explicit locking."
  },
  {
    id: "cs-b15-b3-interlocked-compare-exchange",
    language: "csharp",
    title: "Interlocked.CompareExchange for lock-free updates",
    tag: "snippet",
    code: `using System.Threading;

int counter = 0;

void Increment()
{
    int current, updated;
    do
    {
        current = counter;
        updated = current + 1;
    }
    while (Interlocked.CompareExchange(ref counter, updated, current) != current);
}`,
    explanation: "`CompareExchange` atomically sets `counter = updated` only if `counter == current`. The retry loop implements optimistic lock-free increment."
  },
  {
    id: "cs-b15-b3-semaphore-slim",
    language: "csharp",
    title: "SemaphoreSlim for async rate limiting",
    tag: "snippet",
    code: `using System.Threading;

var sem = new SemaphoreSlim(3);

async Task<int> LimitedWorkAsync(int n)
{
    await sem.WaitAsync();
    try
    {
        await Task.Delay(100);
        return n * n;
    }
    finally
    {
        sem.Release();
    }
}`,
    explanation: "`SemaphoreSlim.WaitAsync` is the async-compatible equivalent of `Wait`. The `try/finally` guarantees `Release` even on exception."
  },
  {
    id: "cs-b15-b3-countdown-event",
    language: "csharp",
    title: "CountdownEvent for fan-out coordination",
    tag: "snippet",
    code: `using System.Threading;

int workerCount = 4;
using var countdown = new CountdownEvent(workerCount);

for (int i = 0; i < workerCount; i++)
{
    int id = i;
    Task.Run(() =>
    {
        Console.WriteLine(\`Worker \${id} done\`);
        countdown.Signal();
    });
}

countdown.Wait();
Console.WriteLine("All workers completed");`,
    explanation: "`CountdownEvent` starts at a count and each `Signal` decrements it. `Wait` blocks until the count reaches zero — ideal for coordinating parallel fan-out."
  },
  {
    id: "cs-b15-b3-generic-unmanaged",
    language: "csharp",
    title: "Generic constraint: unmanaged",
    tag: "types",
    code: `using System.Runtime.InteropServices;

unsafe T ReadFromPointer<T>(byte* ptr) where T : unmanaged
{
    return *(T*)ptr;
}

int size = sizeof(double);   // works: double is unmanaged
Console.WriteLine(size);`,
    explanation: "The `unmanaged` constraint allows using a type in unsafe pointer operations and `sizeof`. It accepts any value type with no reference-type fields."
  },
  {
    id: "cs-b15-b3-generic-notnull",
    language: "csharp",
    title: "Generic constraint: notnull",
    tag: "types",
    code: `#nullable enable

T RequireValue<T>(T? value, string paramName) where T : notnull
{
    if (value is null)
        throw new ArgumentNullException(paramName);
    return value;
}

string name = RequireValue<string>(null, "name"); // throws`,
    explanation: "`notnull` constrains `T` to non-nullable reference or value types. Combined with nullable annotations it eliminates nullable references entering the function."
  },
  {
    id: "cs-b15-b3-generic-enum-constraint",
    language: "csharp",
    title: "Generic constraint: Enum",
    tag: "types",
    code: `T Parse<T>(string value) where T : struct, Enum
{
    if (Enum.TryParse<T>(value, ignoreCase: true, out var result))
        return result;
    throw new ArgumentException(\`'\${value}' is not a valid \${typeof(T).Name}\`);
}

var day = Parse<DayOfWeek>("monday");
Console.WriteLine(day);  // Monday`,
    explanation: "The `Enum` constraint allows calling `Enum.TryParse<T>` generically. Adding `struct` prevents passing `Enum` itself or nullable enum types."
  },
  {
    id: "cs-b15-b3-dateonly-range",
    language: "csharp",
    title: "DateOnly for calendar-based logic",
    tag: "snippet",
    code: `var start = new DateOnly(2026, 1, 1);
var end = new DateOnly(2026, 12, 31);

int days = end.DayNumber - start.DayNumber + 1;
Console.WriteLine(\`\${days} days in 2026\`);

DateOnly today = DateOnly.FromDateTime(DateTime.Today);
bool isWeekend = today.DayOfWeek is DayOfWeek.Saturday or DayOfWeek.Sunday;`,
    explanation: "`DateOnly` represents a calendar date without time or timezone — avoiding the classic midnight-UTC trap when working with dates only."
  },
  {
    id: "cs-b15-b3-timeonly-range",
    language: "csharp",
    title: "TimeOnly for business hours checks",
    tag: "snippet",
    code: `var open = new TimeOnly(9, 0);
var close = new TimeOnly(17, 30);

TimeOnly now = TimeOnly.FromDateTime(DateTime.Now);
bool isOpen = now.IsBetween(open, close);

Console.WriteLine(\`Business hours: \${isOpen}\`);`,
    explanation: "`TimeOnly` represents a time of day without a date or timezone. `IsBetween` handles midnight-wrapping ranges correctly (e.g., 22:00 to 06:00)."
  },
  {
    id: "cs-b15-b3-flags-enum",
    language: "csharp",
    title: "Flags enum for bitmask permissions",
    tag: "snippet",
    code: `[Flags]
enum Permission
{
    None   = 0,
    Read   = 1 << 0,
    Write  = 1 << 1,
    Delete = 1 << 2,
    Admin  = Read | Write | Delete,
}

var perm = Permission.Read | Permission.Write;
Console.WriteLine(perm.HasFlag(Permission.Write)); // True
Console.WriteLine(perm.HasFlag(Permission.Delete)); // False`,
    explanation: "`[Flags]` enables `|` combination and `HasFlag` testing. Using bit-shift literals (`1 << n`) makes the values self-documenting and avoids typos."
  },
  {
    id: "cs-b15-b3-observable-collection",
    language: "csharp",
    title: "ObservableCollection with change notification",
    tag: "snippet",
    code: `using System.Collections.ObjectModel;
using System.Collections.Specialized;

var items = new ObservableCollection<string>();
items.CollectionChanged += (s, e) =>
{
    if (e.Action == NotifyCollectionChangedAction.Add)
        Console.WriteLine(\`Added: \${e.NewItems![0]}\`);
};

items.Add("Alpha");
items.Add("Beta");`,
    explanation: "`ObservableCollection<T>` fires `CollectionChanged` on add/remove/reset. `NewItems` and `OldItems` contain the changed elements."
  },
  {
    id: "cs-b15-b3-concurrent-stack",
    language: "csharp",
    title: "ConcurrentStack for thread-safe LIFO",
    tag: "structures",
    code: `using System.Collections.Concurrent;

var stack = new ConcurrentStack<int>();

Parallel.For(0, 10, i => stack.Push(i));

if (stack.TryPop(out int top))
    Console.WriteLine(\`Top: \${top}\`);

stack.TryPopRange(new int[3], 0, 3);
Console.WriteLine(\`Remaining: \${stack.Count}\`);`,
    explanation: "`ConcurrentStack<T>` is lock-free. `TryPopRange` efficiently pops multiple items atomically, reducing contention versus repeated single pops."
  },
  {
    id: "cs-b15-b3-sorted-list",
    language: "csharp",
    title: "SortedList<K,V> for ordered key-value pairs",
    tag: "structures",
    code: `var scores = new SortedList<string, int>();
scores["Alice"] = 95;
scores["Bob"] = 87;
scores["Charlie"] = 92;

foreach (var kv in scores)
    Console.WriteLine(\`\${kv.Key}: \${kv.Value}\`);

int idx = scores.IndexOfKey("Bob");
Console.WriteLine(\`Bob is at index \${idx}\`);`,
    explanation: "`SortedList<K,V>` maintains keys in sorted order using binary search. Unlike `SortedDictionary`, it uses arrays internally, enabling index-based access."
  },
  {
    id: "cs-b15-b3-memory-marshal-cast",
    language: "csharp",
    title: "MemoryMarshal.Cast for type reinterpretation",
    tag: "snippet",
    code: `using System.Runtime.InteropServices;

float[] floats = [1.0f, 2.0f, 3.0f, 4.0f];
Span<float> src = floats;
Span<byte> bytes = MemoryMarshal.Cast<float, byte>(src);

Console.WriteLine(\`Bytes: \${bytes.Length}\`);  // 16`,
    explanation: "`MemoryMarshal.Cast` reinterprets a `Span<TFrom>` as `Span<TTo>` without copying, adjusting the length to match total byte size."
  },
  {
    id: "cs-b15-b3-raw-string-multiline",
    language: "csharp",
    title: "Raw string literals for multiline content",
    tag: "snippet",
    code: `string json = """
    {
        "name": "Alice",
        "scores": [95, 87, 92]
    }
    """;

string sql = """
    SELECT id, name
    FROM users
    WHERE active = 1
    """;`,
    explanation: "Raw string literals (`\"\"\"`) don't require escaping backslashes or quotes. The indentation of the closing `\"\"\"` determines how much leading whitespace is stripped."
  },
  {
    id: "cs-b15-b3-pattern-list",
    language: "csharp",
    title: "List pattern matching",
    tag: "snippet",
    code: `int[] numbers = [1, 2, 3, 4, 5];
string description = numbers switch
{
    [] => "empty",
    [var only] => \`single: \${only}\`,
    [var first, var second] => \`pair: \${first}, \${second}\`,
    [var head, .., var tail] => \`from \${head} to \${tail}\`,
};
Console.WriteLine(description);`,
    explanation: "List patterns match array/list contents. The `..` discard pattern matches any number of elements in the middle, enabling head/tail decomposition."
  },
  {
    id: "cs-b15-b3-pattern-tuple",
    language: "csharp",
    title: "Tuple pattern in switch expression",
    tag: "snippet",
    code: `string Classify(int x, int y) => (x, y) switch
{
    (0, 0) => "origin",
    (0, _) => "y-axis",
    (_, 0) => "x-axis",
    (> 0, > 0) => "quadrant I",
    (< 0, > 0) => "quadrant II",
    _ => "other",
};

Console.WriteLine(Classify(-1, 3));  // quadrant II`,
    explanation: "Tuple patterns decompose multiple values simultaneously. Relational patterns (`> 0`, `< 0`) apply directly inside tuple positions."
  },
  {
    id: "cs-b15-b3-pattern-property",
    language: "csharp",
    title: "Property pattern for deep matching",
    tag: "snippet",
    code: `record Address(string City, string Country);
record User(string Name, Address Address, int Age);

string Greet(User u) => u switch
{
    { Address.Country: "US", Age: >= 18 } => \`Hello, \${u.Name}!\`,
    { Address.Country: "US" } => \`Hi, young \${u.Name}!\`,
    _ => \`Greetings, \${u.Name}!\`,
};`,
    explanation: "Property patterns use dot-notation for nested properties (`Address.Country`), enabling deep structural matching without temporary variables."
  },
  {
    id: "cs-b15-b3-record-struct",
    language: "csharp",
    title: "Record struct for value-type records",
    tag: "snippet",
    code: `readonly record struct Temperature(double Celsius)
{
    public double Fahrenheit => Celsius * 9.0 / 5.0 + 32;
    public double Kelvin => Celsius + 273.15;
}

var t = new Temperature(100);
Console.WriteLine(\`\${t.Fahrenheit}°F, \${t.Kelvin}K\`);`,
    explanation: "`record struct` combines struct value semantics (stack allocation, copy by value) with record features (value equality, `with`, deconstruction)."
  },
  {
    id: "cs-b15-b3-generic-allows-ref-struct",
    language: "csharp",
    title: "Generic constraint: allows ref struct",
    tag: "types",
    code: `// Requires C# 13 / .NET 9
static void ProcessSpan<T>(T data)
    where T : allows ref struct
{
    Console.WriteLine("Processing...");
}

ProcessSpan(new Span<int>([1, 2, 3]));`,
    explanation: "`allows ref struct` (C# 13) lifts the restriction that prevented `Span<T>` from satisfying generic constraints, enabling span-based generic algorithms."
  },
  {
    id: "cs-b15-b3-inline-array",
    language: "csharp",
    title: "Inline arrays for fixed-size buffers",
    tag: "snippet",
    code: `using System.Runtime.CompilerServices;

[InlineArray(8)]
struct Buffer8
{
    private int _element0;
}

var buf = new Buffer8();
for (int i = 0; i < 8; i++)
    buf[i] = i * i;

Span<int> span = buf;
Console.WriteLine(span[3]);  // 9`,
    explanation: "`InlineArray` (C# 12) embeds a fixed-length array inline in a struct, providing span access without unsafe code or `fixed` buffers."
  },
  {
    id: "cs-b15-b3-lock-object",
    language: "csharp",
    title: "System.Threading.Lock for improved locking",
    tag: "snippet",
    code: `using System.Threading;

// C# 13 / .NET 9
var myLock = new Lock();

void SafeIncrement(ref int counter)
{
    using (myLock.EnterScope())
    {
        counter++;
    }
}`,
    explanation: "The new `Lock` type (C# 13) uses a `using` scope instead of `Monitor.Enter/Exit`, preventing accidental `lock(this)` anti-patterns and enabling future optimizations."
  },
  {
    id: "cs-b15-b3-span-stackalloc",
    language: "csharp",
    title: "Span<T> with stackalloc",
    tag: "snippet",
    code: `Span<int> buffer = stackalloc int[64];

for (int i = 0; i < buffer.Length; i++)
    buffer[i] = i * 2;

int sum = 0;
foreach (var v in buffer)
    sum += v;

Console.WriteLine(sum);`,
    explanation: "`stackalloc` allocates on the stack; assigning to `Span<T>` (not `int*`) is safe and doesn't require the `unsafe` keyword in modern C#."
  },
  {
    id: "cs-b15-b3-required-members",
    language: "csharp",
    title: "required members for mandatory initialization",
    tag: "snippet",
    code: `public class UserProfile
{
    public required string Username { get; set; }
    public required string Email { get; set; }
    public string? DisplayName { get; set; }
}

// Must provide required members:
var profile = new UserProfile
{
    Username = "alice",
    Email = "alice@example.com"
};`,
    explanation: "`required` (C# 11) enforces that callers always set the property in an object initializer, catching missing initialization at compile time."
  },
  {
    id: "cs-b15-b3-file-scoped-types",
    language: "csharp",
    title: "file-scoped type access modifier",
    tag: "snippet",
    code: `// Only accessible within this .cs file
file class InternalHelper
{
    public static string Format(string s) => s.Trim().ToLower();
}

public class PublicService
{
    public string Process(string input) =>
        InternalHelper.Format(input);
}`,
    explanation: "`file` access modifier (C# 11) restricts a type to the containing source file, allowing implementation details to be truly private without nesting."
  },
  {
    id: "cs-b15-b3-scoped-ref",
    language: "csharp",
    title: "scoped ref parameters for lifetime safety",
    tag: "snippet",
    code: `ref struct SpanWrapper
{
    private Span<int> _data;
    public SpanWrapper(Span<int> data) => _data = data;
    public ref int this[int i] => ref _data[i];
}

static ref int GetFirst(scoped ref SpanWrapper w) =>
    ref w[0];`,
    explanation: "`scoped ref` (C# 11) restricts the parameter's lifetime to the method scope, preventing it from escaping and enabling more ref struct operations."
  },
  {
    id: "cs-b15-b3-utf8-string-literals",
    language: "csharp",
    title: "UTF-8 string literals",
    tag: "snippet",
    code: `ReadOnlySpan<byte> greeting = "Hello, World!"u8;
ReadOnlySpan<byte> contentType = "application/json"u8;

Console.WriteLine(greeting.Length);    // 13
Console.WriteLine(contentType.Length); // 16`,
    explanation: "The `u8` suffix creates a `ReadOnlySpan<byte>` from a UTF-8 encoded string literal at compile time — no encoding at runtime, no allocation."
  },
  {
    id: "cs-b15-b3-interceptors",
    language: "csharp",
    title: "Source generator with interceptors",
    tag: "snippet",
    code: `// In a source generator output file:
// [System.Runtime.CompilerServices.InterceptsLocation(...)]
// public static void InterceptedMethod(this MyClass c) { ... }

// Interceptors allow compile-time replacement of method calls
// Example: replacing Console.WriteLine for logging injection
Console.WriteLine("Original call site");`,
    explanation: "Interceptors (experimental C# 12+) let source generators redirect method call sites at compile time, enabling zero-overhead AOP-style code generation."
  },
  {
    id: "cs-b15-b3-primary-ctor-validation",
    language: "csharp",
    title: "Primary constructor with field validation",
    tag: "snippet",
    code: `public class PositiveValue(double value)
{
    private readonly double _value = value > 0
        ? value
        : throw new ArgumentOutOfRangeException(nameof(value));

    public double Value => _value;
}`,
    explanation: "Primary constructor parameters can be used in field initializers. A conditional expression in the initializer validates before assignment."
  },
  {
    id: "cs-b15-b3-discriminated-union-pattern",
    language: "csharp",
    title: "Discriminated union via abstract record",
    tag: "structures",
    code: `abstract record Shape;
record Circle(double Radius) : Shape;
record Rectangle(double Width, double Height) : Shape;
record Triangle(double Base, double Height) : Shape;

double Area(Shape s) => s switch
{
    Circle(var r) => Math.PI * r * r,
    Rectangle(var w, var h) => w * h,
    Triangle(var b, var h) => 0.5 * b * h,
    _ => throw new ArgumentException("Unknown shape"),
};`,
    explanation: "Abstract records with sealed subtype hierarchy simulate discriminated unions. Switch expressions with deconstruction patterns provide exhaustive, concise dispatch."
  },
  {
    id: "cs-b15-b3-interface-default-impl",
    language: "csharp",
    title: "Interface default implementation",
    tag: "snippet",
    code: `interface IGreeter
{
    string Greet(string name);
    string GreetAll(IEnumerable<string> names) =>
        string.Join(", ", names.Select(Greet));
}

class FormalGreeter : IGreeter
{
    public string Greet(string name) => \`Good day, \${name}.\`;
}

IGreeter g = new FormalGreeter();
Console.WriteLine(g.GreetAll(["Alice", "Bob"]));`,
    explanation: "Interface default implementations provide optional behavior without breaking existing implementors. They're invoked only through the interface type, not the concrete class."
  },
  {
    id: "cs-b15-b3-extension-everything",
    language: "csharp",
    title: "Extension members (C# 14 preview)",
    tag: "snippet",
    code: `// C# 14 preview syntax
// extension class StringExtensions for string
// {
//     public bool IsEmail =>
//         Contains('@') && Contains('.');
//     public string Truncate(int max) =>
//         Length <= max ? this : this[..max] + "...";
// }

// Current syntax:
static class StringExtensions
{
    public static bool IsEmail(this string s) =>
        s.Contains('@') && s.Contains('.');
}`,
    explanation: "C# 14 proposes `extension` classes with full property and indexer support. Until then, static extension methods remain the standard approach."
  },
  {
    id: "cs-b15-b3-generic-math",
    language: "csharp",
    title: "Generic math with INumber<T>",
    tag: "types",
    code: `using System.Numerics;

T Sum<T>(IEnumerable<T> values) where T : INumber<T>
{
    T result = T.Zero;
    foreach (var v in values)
        result += v;
    return result;
}

Console.WriteLine(Sum(new[] { 1, 2, 3, 4 }));      // 10
Console.WriteLine(Sum(new[] { 1.5, 2.5, 3.0 }));    // 7`,
    explanation: "`INumber<T>` (System.Numerics, .NET 7+) provides static abstract interface members for arithmetic, enabling generic algorithms over all numeric types."
  },
  {
    id: "cs-b15-b3-static-abstract-interface",
    language: "csharp",
    title: "Static abstract interface members",
    tag: "types",
    code: `interface IFactory<T>
{
    static abstract T Create();
    static abstract T Create(string config);
}

class Connection : IFactory<Connection>
{
    public static Connection Create() => new();
    public static Connection Create(string cfg) => new();
}

T BuildDefault<T>() where T : IFactory<T> => T.Create();`,
    explanation: "Static abstract members (C# 11) allow interfaces to require static methods. Combined with generic constraints, they enable factory patterns without reflection."
  },
  {
    id: "cs-b15-b3-caller-attributes",
    language: "csharp",
    title: "CallerMemberName and CallerFilePath",
    tag: "snippet",
    code: `using System.Runtime.CompilerServices;

void Log(
    string message,
    [CallerMemberName] string caller = "",
    [CallerFilePath] string file = "",
    [CallerLineNumber] int line = 0)
{
    Console.WriteLine(\`[\${caller}@\${line}] \${message}\`);
}

void DoWork() => Log("Processing...");`,
    explanation: "Caller information attributes inject compile-time constants — no runtime reflection. They default to empty/zero so they're truly optional parameters."
  },
  {
    id: "cs-b15-b3-pattern-var",
    language: "csharp",
    title: "var pattern for always-matching capture",
    tag: "snippet",
    code: `object? GetValue() => DateTime.Now.Second % 2 == 0
    ? "even"
    : (object?)null;

if (GetValue() is var val)
{
    Console.WriteLine(val is null ? "null" : val);
}

var result = GetValue() switch
{
    var x when x is string s => \`string: \${s}\`,
    _ => "other",
};`,
    explanation: "The `var` pattern always matches and captures the value — useful as a `when` guard anchor to introduce a variable without adding an explicit type check."
  },
  {
    id: "cs-b15-b3-frozen-collections",
    language: "csharp",
    title: "FrozenDictionary for read-only performance",
    tag: "structures",
    code: `using System.Collections.Frozen;

var lookup = new Dictionary<string, int>
{
    ["alpha"] = 1, ["beta"] = 2, ["gamma"] = 3,
}.ToFrozenDictionary();

Console.WriteLine(lookup["beta"]);  // 2
Console.WriteLine(lookup.ContainsKey("delta"));  // False`,
    explanation: "`FrozenDictionary` (.NET 8+) is optimized for read-only workloads — faster lookups than regular `Dictionary` by using a perfect hash at construction time."
  },
  {
    id: "cs-b15-b3-task-when-each",
    language: "csharp",
    title: "Task.WhenEach for as-they-complete streaming",
    tag: "snippet",
    code: `using System.Threading.Tasks;

async IAsyncEnumerable<int> StreamResults(int[] ids)
{
    var tasks = ids.Select(async id =>
    {
        await Task.Delay(id * 50);
        return id * id;
    }).ToList();

    await foreach (var task in Task.WhenEach(tasks))
        yield return await task;
}`,
    explanation: "`Task.WhenEach` (.NET 9+) returns an `IAsyncEnumerable` that yields tasks as they complete, enabling processing results in arrival order rather than submission order."
  },
  {
    id: "cs-b15-b3-partial-properties",
    language: "csharp",
    title: "Partial properties in source generators",
    tag: "snippet",
    code: `// Declare side (user code):
public partial class ViewModel
{
    public partial string Name { get; set; }
}

// Implementation side (generated code):
public partial class ViewModel
{
    private string _name = "";
    public partial string Name
    {
        get => _name;
        set { _name = value; OnPropertyChanged(); }
    }
    partial void OnPropertyChanged();
}`,
    explanation: "Partial properties (C# 13) allow source generators to provide property implementations while user code provides the declaration — key for MVVM source generator patterns."
  },
  {
    id: "cs-b15-b3-params-collection",
    language: "csharp",
    title: "params with any collection type",
    tag: "snippet",
    code: `void PrintAll(params IEnumerable<string> items)
{
    foreach (var item in items)
        Console.WriteLine(item);
}

PrintAll("alpha", "beta", "gamma");
PrintAll(["delta", "epsilon"]);`,
    explanation: "`params` (C# 13) now accepts any collection type, not just arrays. The compiler creates the appropriate collection from the argument list."
  },
  {
    id: "cs-b15-b3-allows-null-ref",
    language: "csharp",
    title: "Nullable reference type annotations",
    tag: "types",
    code: `#nullable enable

string? TryFind(Dictionary<string, string> dict, string key) =>
    dict.TryGetValue(key, out var val) ? val : null;

void Process(string? value)
{
    if (value is null) return;
    Console.WriteLine(value.Length);  // value is non-null here
}`,
    explanation: "With `#nullable enable`, `string?` marks nullable intent. The compiler flows null state so post-null-check uses don't require `!` suppressors."
  },
  {
    id: "cs-b15-b3-index-range",
    language: "csharp",
    title: "Index and Range with custom types",
    tag: "snippet",
    code: `class WordList
{
    private string[] _words;
    public WordList(string[] w) => _words = w;
    public int Length => _words.Length;
    public string this[int i] => _words[i];
    public string this[Index i] => _words[i];
    public WordList this[Range r] => new(_words[r]);
}

var wl = new WordList(["a", "b", "c", "d", "e"]);
var slice = wl[1..4];`,
    explanation: "Implementing `this[Index]` and `this[Range]` with `Length` enables the `^` and `..` syntax on custom collection types."
  },
  {
    id: "cs-b15-b3-interpolated-verbatim",
    language: "csharp",
    title: "Interpolated verbatim string for paths",
    tag: "snippet",
    code: `string root = @"C:\\Users\\Alice";
string file = "report.csv";

string path = \$@"{root}\\Documents\\{file}";
Console.WriteLine(path);
// C:\\Users\\Alice\\Documents\\report.csv`,
    explanation: "`$@` combines verbatim (no escape sequences) with interpolation. Use it for Windows paths where you want literal backslashes and `{expr}` insertions."
  },
  {
    id: "cs-b15-b3-record-deconstruct",
    language: "csharp",
    title: "Record deconstruction in patterns",
    tag: "snippet",
    code: `record Product(string Name, decimal Price, int Stock);

bool IsHotDeal(Product p) => p switch
{
    (_, < 10m, > 100) => true,
    _ => false,
};

var p = new Product("Widget", 9.99m, 200);
Console.WriteLine(IsHotDeal(p));  // True`,
    explanation: "Positional patterns use the record's generated `Deconstruct` method. Underscores discard unneeded values, keeping patterns concise."
  },
  {
    id: "cs-b15-b3-linq-chunk",
    language: "csharp",
    title: "LINQ Chunk for batching sequences",
    tag: "snippet",
    code: `int[] numbers = Enumerable.Range(1, 10).ToArray();

foreach (var batch in numbers.Chunk(3))
{
    Console.WriteLine(string.Join(", ", batch));
}
// 1, 2, 3
// 4, 5, 6
// 7, 8, 9
// 10`,
    explanation: "`Chunk` (.NET 6+) splits a sequence into arrays of at most `n` elements. The last chunk may be smaller than `n`."
  },
  {
    id: "cs-b15-b3-linq-order",
    language: "csharp",
    title: "LINQ Order and OrderDescending",
    tag: "snippet",
    code: `int[] nums = [5, 2, 8, 1, 9, 3];
var asc = nums.Order();
var desc = nums.OrderDescending();

Console.WriteLine(string.Join(" ", asc));    // 1 2 3 5 8 9
Console.WriteLine(string.Join(" ", desc));   // 9 8 5 3 2 1`,
    explanation: "`Order()` (.NET 7+) is shorthand for `OrderBy(x => x)`. `OrderDescending()` replaces `OrderByDescending(x => x)` for natural ordering."
  },
  {
    id: "cs-b15-b3-linq-minmax-by",
    language: "csharp",
    title: "LINQ MinBy and MaxBy",
    tag: "snippet",
    code: `record Employee(string Name, decimal Salary);

var team = new[]
{
    new Employee("Alice", 95000m),
    new Employee("Bob", 87000m),
    new Employee("Carol", 102000m),
};

var highest = team.MaxBy(e => e.Salary);
var lowest = team.MinBy(e => e.Salary);

Console.WriteLine(\`Highest: \${highest!.Name}\`);`,
    explanation: "`MinBy`/`MaxBy` (.NET 6+) return the element with the min/max key value — more efficient than `OrderBy(...).First()` as they don't sort the whole sequence."
  },
  {
    id: "cs-b15-b3-linq-zip-three",
    language: "csharp",
    title: "LINQ Zip with three sequences",
    tag: "snippet",
    code: `string[] names = ["Alice", "Bob", "Carol"];
int[] scores = [95, 87, 92];
string[] grades = ["A", "B+", "A-"];

var combined = names.Zip(scores, grades)
    .Select(t => \`\${t.First}: \${t.Second} (\${t.Third})\`);

foreach (var line in combined)
    Console.WriteLine(line);`,
    explanation: "`Zip` with three sequences (.NET 6+) merges them element-by-element into value tuples, stopping at the shortest sequence."
  },
  {
    id: "cs-b15-b3-string-create",
    language: "csharp",
    title: "String.Create for allocation-free formatting",
    tag: "snippet",
    code: `string FormatIp(byte a, byte b, byte c, byte d)
{
    return string.Create(15, (a, b, c, d), static (span, args) =>
    {
        var (a, b, c, d) = args;
        int pos = 0;
        void Write(byte v)
        {
            if (v >= 100) span[pos++] = (char)('0' + v / 100);
            if (v >= 10)  span[pos++] = (char)('0' + v / 10 % 10);
            span[pos++] = (char)('0' + v % 10);
        }
        Write(a); span[pos++] = '.';
        Write(b); span[pos++] = '.';
        Write(c); span[pos++] = '.';
        Write(d);
    });
}`,
    explanation: "`String.Create` allocates the string once and lets you fill it via a `Span<char>` callback, avoiding intermediate string allocations."
  },
  {
    id: "cs-b15-b3-asynclocal",
    language: "csharp",
    title: "AsyncLocal<T> for async context flow",
    tag: "snippet",
    code: `using System.Threading;

static AsyncLocal<string> _requestId = new();

async Task HandleRequestAsync(string id)
{
    _requestId.Value = id;
    await DoWorkAsync();
}

async Task DoWorkAsync()
{
    await Task.Delay(10);
    Console.WriteLine(\`RequestId: \${_requestId.Value}\`);
}`,
    explanation: "`AsyncLocal<T>` flows values through the async call context. Unlike `ThreadLocal<T>`, it correctly propagates across `await` boundaries and task continuations."
  },
  {
    id: "cs-b15-b3-memory-owner",
    language: "csharp",
    title: "IMemoryOwner<T> for owned memory segments",
    tag: "snippet",
    code: `using System.Buffers;

IMemoryOwner<byte> owner = MemoryPool<byte>.Shared.Rent(1024);
try
{
    Memory<byte> mem = owner.Memory;
    Span<byte> span = mem.Span;
    span[0] = 0xFF;
    Console.WriteLine(span[0]);
}
finally
{
    owner.Dispose();
}`,
    explanation: "`IMemoryOwner<T>` from `MemoryPool` provides ownership semantics. `Dispose` returns the backing memory to the pool, enabling reuse without GC."
  },
  {
    id: "cs-b15-b3-pipeline-writer",
    language: "csharp",
    title: "System.IO.Pipelines for high-throughput I/O",
    tag: "snippet",
    code: `using System.IO.Pipelines;

async Task WriteDataAsync(PipeWriter writer)
{
    Memory<byte> mem = writer.GetMemory(512);
    int written = Encoding.UTF8.GetBytes("Hello, Pipelines!", mem.Span);
    writer.Advance(written);
    await writer.FlushAsync();
}

static System.Text.Encoding Encoding => System.Text.Encoding.UTF8;`,
    explanation: "`PipeWriter.GetMemory` returns a buffer directly into the pipe's memory — no intermediate `byte[]` allocation. `Advance` commits written bytes."
  },
  {
    id: "cs-b15-b3-record-abstract-derived",
    language: "csharp",
    title: "Abstract record hierarchy for domain events",
    tag: "structures",
    code: `abstract record DomainEvent(DateTime OccurredAt);
record UserRegistered(DateTime OccurredAt, string Email)
    : DomainEvent(OccurredAt);
record OrderPlaced(DateTime OccurredAt, int OrderId, decimal Total)
    : DomainEvent(OccurredAt);

void Handle(DomainEvent e) => _ = e switch
{
    UserRegistered(_, var email) => Console.WriteLine(\`Registered: \${email}\`),
    OrderPlaced(_, var id, _) => Console.WriteLine(\`Order: \${id}\`),
    _ => Console.WriteLine("Unknown event"),
};`,
    explanation: "Inheritance in record hierarchies with positional parameters enables clean discriminated union patterns for event-driven architectures."
  },
  {
    id: "cs-b15-b3-regex-source-gen",
    language: "csharp",
    title: "Regex source generator for compile-time regex",
    tag: "snippet",
    code: `using System.Text.RegularExpressions;

partial class Validator
{
    [GeneratedRegex(@"^[\\w.+-]+@[\\w-]+\\.[\\w.]+$",
        RegexOptions.IgnoreCase)]
    private static partial Regex EmailRegex();

    public static bool IsEmail(string s) =>
        EmailRegex().IsMatch(s);
}`,
    explanation: "`[GeneratedRegex]` (C# 11+) generates the regex at compile time instead of constructing it at runtime, eliminating startup overhead and JIT costs."
  },
  {
    id: "cs-b15-b3-keyed-services",
    language: "csharp",
    title: "Keyed services in DI (.NET 8)",
    tag: "snippet",
    code: `// Registration:
// builder.Services.AddKeyedSingleton<ICache, RedisCache>("redis");
// builder.Services.AddKeyedSingleton<ICache, MemoryCache>("memory");

// Injection:
class ReportService(
    [FromKeyedServices("redis")] ICache remoteCache,
    [FromKeyedServices("memory")] ICache localCache)
{
    public void Generate() { /* use both caches */ }
}

interface ICache { }
class RedisCache : ICache { }
class MemoryCache : ICache { }`,
    explanation: "Keyed services (.NET 8+) allow registering multiple implementations of the same interface and injecting them by key, eliminating factory workarounds."
  },
  {
    id: "cs-b15-b3-time-provider",
    language: "csharp",
    title: "TimeProvider for testable time",
    tag: "snippet",
    code: `// Production:
// services.AddSingleton(TimeProvider.System);

class Scheduler(TimeProvider time)
{
    public bool IsExpired(DateTimeOffset expiresAt) =>
        time.GetUtcNow() > expiresAt;
}

// Test:
// var fake = new FakeTimeProvider();
// fake.SetUtcNow(DateTimeOffset.UtcNow.AddHours(25));
// var sched = new Scheduler(fake);`,
    explanation: "`TimeProvider` (.NET 8) abstracts `DateTime.UtcNow`. Inject `TimeProvider.System` in production and a `FakeTimeProvider` in tests for deterministic time."
  },
  {
    id: "cs-b15-b3-hybrid-cache",
    language: "csharp",
    title: "HybridCache for two-level caching (.NET 9)",
    tag: "snippet",
    code: `// Requires Microsoft.Extensions.Caching.Hybrid
// builder.Services.AddHybridCache();

class ProductService(HybridCache cache)
{
    public async Task<string> GetAsync(int id,
        CancellationToken ct = default)
    {
        return await cache.GetOrCreateAsync(
            \`product:\${id}\`,
            async token => await FetchFromDb(id, token),
            cancellationToken: ct);
    }

    static async Task<string> FetchFromDb(int id, CancellationToken ct)
    {
        await Task.Delay(50, ct);
        return \`Product \${id}\`;
    }
}

class HybridCache { public Task<T> GetOrCreateAsync<T>(string k, Func<CancellationToken,Task<T>> f, CancellationToken cancellationToken = default) => f(cancellationToken); }`,
    explanation: "`HybridCache` combines in-process (L1) and distributed (L2) caching. `GetOrCreateAsync` handles stampede protection automatically."
  },
  {
    id: "cs-b15-b3-collection-expressions-dict",
    language: "csharp",
    title: "Collection expressions for dictionaries",
    tag: "snippet",
    code: `// C# 13 preview / .NET 9
Dictionary<string, int> scores = new()
{
    ["Alice"] = 95,
    ["Bob"] = 87,
};

// Equivalent collection expression (C# 13):
// Dictionary<string, int> scores = [
//     "Alice": 95,
//     "Bob": 87,
// ];

Console.WriteLine(scores["Alice"]);`,
    explanation: "C# 13 extends collection expressions to dictionary syntax with `key: value` pairs. Until then, the `new() { }` initializer syntax is the cleanest option."
  },
  {
    id: "cs-b15-b3-exception-filter",
    language: "csharp",
    title: "Exception filter with when clause",
    tag: "snippet",
    code: `async Task<string> FetchWithRetry(string url)
{
    try
    {
        return await HttpClient.GetStringAsync(url);
    }
    catch (HttpRequestException ex)
        when (ex.StatusCode == System.Net.HttpStatusCode.TooManyRequests)
    {
        await Task.Delay(1000);
        return await HttpClient.GetStringAsync(url);
    }
}

static HttpClient HttpClient { get; } = new();`,
    explanation: "`when` clauses filter catches without catching and rethrowing — the stack trace remains intact and only matching exceptions are handled."
  },
  {
    id: "cs-b15-b3-nullable-cast",
    language: "csharp",
    title: "Null-safe cast with 'as' and null coalescing",
    tag: "snippet",
    code: `object? value = GetValue();

string text = (value as string) ?? "default";
int? number = value as int?;

int length = (value as string)?.Length ?? 0;

object? GetValue() => DateTime.Now.Second % 2 == 0
    ? "hello"
    : 42;`,
    explanation: "`as` returns `null` instead of throwing on type mismatch. Combining with `?.` and `??` creates safe, null-tolerant extraction chains."
  },
  {
    id: "cs-b15-b3-span-indexof",
    language: "csharp",
    title: "Span<T> search methods",
    tag: "snippet",
    code: `ReadOnlySpan<byte> data = [1, 2, 3, 4, 5, 3, 6];

int first = data.IndexOf((byte)3);          // 2
int last = data.LastIndexOf((byte)3);       // 5
int count = data.Count((byte)3);            // 2
bool any = data.Contains((byte)4);         // true

Console.WriteLine(\$"First: {first}, Last: {last}, Count: {count}\`);`,
    explanation: "`ReadOnlySpan<T>` supports `IndexOf`, `LastIndexOf`, `Contains`, and `Count` without allocating — preferred over LINQ for binary data scanning."
  },
  {
    id: "cs-b15-b3-functional-option",
    language: "csharp",
    title: "Option/Maybe monad pattern",
    tag: "structures",
    code: `readonly record struct Option<T>
{
    private readonly T? _value;
    public bool HasValue { get; }

    private Option(T value) { _value = value; HasValue = true; }
    public static Option<T> Some(T v) => new(v);
    public static Option<T> None => default;

    public Option<TResult> Map<TResult>(Func<T, TResult> f) =>
        HasValue ? Option<TResult>.Some(f(_value!)) : Option<TResult>.None;
}`,
    explanation: "An `Option<T>` value struct avoids `null` for optional returns. `Map` chains transformations safely — the function only runs when a value is present."
  },
  {
    id: "cs-b15-b3-pipe-operator-extension",
    language: "csharp",
    title: "Pipe-style chaining with extension methods",
    tag: "snippet",
    code: `static class Pipe
{
    public static TOut Pipe<TIn, TOut>(this TIn value, Func<TIn, TOut> fn)
        => fn(value);
    public static T Also<T>(this T value, Action<T> action)
        { action(value); return value; }
}

var result = "  Hello, World!  "
    .Pipe(s => s.Trim())
    .Pipe(s => s.ToLower())
    .Also(s => Console.WriteLine(\`Processed: \${s}\`));`,
    explanation: "`Pipe` passes a value to a function; `Also` executes a side effect and returns the original value. Together they enable point-free style chaining in C#."
  },
  {
    id: "cs-b15-b3-source-gen-incremental",
    language: "csharp",
    title: "Incremental source generator skeleton",
    tag: "snippet",
    code: `using Microsoft.CodeAnalysis;

[Generator]
public class MyGenerator : IIncrementalGenerator
{
    public void Initialize(IncrementalGeneratorInitializationContext ctx)
    {
        var classes = ctx.SyntaxProvider
            .CreateSyntaxProvider(
                predicate: static (n, _) =>
                    n is ClassDeclarationSyntax,
                transform: static (ctx, _) =>
                    ctx.Node as ClassDeclarationSyntax)
            .Where(c => c is not null);

        ctx.RegisterSourceOutput(classes, Generate);
    }

    static void Generate(SourceProductionContext ctx,
        ClassDeclarationSyntax? cls) { }
}`,
    explanation: "Incremental generators only reprocess changed syntax nodes, drastically reducing IDE overhead compared to `ISourceGenerator`."
  },
  {
    id: "cs-b15-b3-object-pool",
    language: "csharp",
    title: "ObjectPool<T> for expensive object reuse",
    tag: "snippet",
    code: `using Microsoft.Extensions.ObjectPool;

var pool = new DefaultObjectPool<StringBuilder>(
    new DefaultPooledObjectPolicy<StringBuilder>());

StringBuilder sb = pool.Get();
try
{
    sb.Append("Hello").Append(", ").Append("World!");
    Console.WriteLine(sb.ToString());
}
finally
{
    pool.Return(sb);
}`,
    explanation: "`ObjectPool<T>` recycles expensive-to-create objects. `StringBuilder` is a classic candidate — reset and reused rather than allocated per operation."
  },
  {
    id: "cs-b15-b3-cancellation-token",
    language: "csharp",
    title: "CancellationTokenSource with timeout",
    tag: "snippet",
    code: `using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(5));

try
{
    await DoLongWorkAsync(cts.Token);
}
catch (OperationCanceledException)
{
    Console.WriteLine("Operation timed out or cancelled");
}

async Task DoLongWorkAsync(CancellationToken token)
{
    await Task.Delay(10_000, token);
}`,
    explanation: "`CancellationTokenSource(TimeSpan)` automatically fires the token after the timeout. Passing the token to `Task.Delay` makes it cancel promptly."
  },
  {
    id: "cs-b15-b3-linq-aggregate",
    language: "csharp",
    title: "LINQ Aggregate for custom folding",
    tag: "snippet",
    code: `string[] words = ["the", "quick", "brown", "fox"];

string sentence = words.Aggregate(
    seed: "",
    func: (acc, w) => acc.Length == 0 ? w : \`\${acc} \${w}\`,
    resultSelector: s => char.ToUpper(s[0]) + s[1..] + "."
);

Console.WriteLine(sentence);  // The quick brown fox.`,
    explanation: "`Aggregate` with a seed and result selector folds a sequence into an arbitrary type. It's the general case for `Sum`, `Max`, `string.Join`, etc."
  },
  {
    id: "cs-b15-b3-switch-expression-throw",
    language: "csharp",
    title: "Switch expression with throw expressions",
    tag: "snippet",
    code: `enum Color { Red, Green, Blue }

int ToRgb(Color c) => c switch
{
    Color.Red => 0xFF0000,
    Color.Green => 0x00FF00,
    Color.Blue => 0x0000FF,
    _ => throw new ArgumentOutOfRangeException(nameof(c), c, null),
};

Console.WriteLine(ToRgb(Color.Green).ToString("X6"));`,
    explanation: "Switch expressions require all cases to return a value or `throw`. The discard arm `_` handles unknown enum values exhaustively."
  },
  {
    id: "cs-b15-b3-abstract-generic-base",
    language: "csharp",
    title: "Abstract generic base class for CRTP pattern",
    tag: "classes",
    code: `abstract class Repository<T, TId> where T : class
{
    protected abstract Task<T?> FindAsync(TId id);
    protected abstract Task SaveAsync(T entity);

    public async Task<T> GetOrThrowAsync(TId id)
    {
        return await FindAsync(id)
            ?? throw new KeyNotFoundException(\`\${typeof(T).Name} \${id} not found\`);
    }
}

class UserRepo : Repository<User, int>
{
    protected override Task<User?> FindAsync(int id) =>
        Task.FromResult<User?>(null);
    protected override Task SaveAsync(User u) => Task.CompletedTask;
}

class User { }`,
    explanation: "CRTP (Curiously Recurring Template Pattern) in C# via generic base classes — `GetOrThrowAsync` is implemented once in the generic base for all concrete repositories."
  },
  {
    id: "cs-b15-b3-ref-return",
    language: "csharp",
    title: "ref return for direct struct access",
    tag: "snippet",
    code: `struct Point { public float X, Y; }

Point[] points = [new() { X=1, Y=2 }, new() { X=3, Y=4 }];

ref Point GetRef(int index) => ref points[index];

ref Point p = ref GetRef(0);
p.X = 99;

Console.WriteLine(points[0].X);  // 99`,
    explanation: "`ref return` gives callers a reference into the array element — mutations via the ref affect the original, avoiding struct copy overhead for large value types."
  },
  {
    id: "cs-b15-b3-global-using",
    language: "csharp",
    title: "Global using directives",
    tag: "snippet",
    code: `// GlobalUsings.cs
global using System;
global using System.Collections.Generic;
global using System.Linq;
global using System.Threading.Tasks;
global using Microsoft.Extensions.Logging;

// All other files automatically have these using directives.
// No need to repeat them per file.`,
    explanation: "`global using` (C# 10) applies a using directive to every file in the project, eliminating repetitive namespace imports. Typically placed in a dedicated `GlobalUsings.cs`."
  },
  {
    id: "cs-b15-b3-struct-interface",
    language: "csharp",
    title: "Struct implementing interface without boxing",
    tag: "types",
    code: `interface IScalable<T> where T : IScalable<T>
{
    T Scale(double factor);
}

struct Size(double Width, double Height) : IScalable<Size>
{
    public Size Scale(double factor) =>
        new(Width * factor, Height * factor);
}

T Double<T>(T s) where T : IScalable<T> => s.Scale(2.0);

var big = Double(new Size(10, 5));`,
    explanation: "Constraining `T : IScalable<T>` with a generic method call avoids boxing the struct. The JIT generates specialized code per `T`, keeping it stack-allocated."
  },
  {
    id: "cs-b15-b3-unsafe-fixed",
    language: "csharp",
    title: "unsafe fixed for pinning managed arrays",
    tag: "snippet",
    code: `unsafe void XorBuffer(byte[] data, byte key)
{
    fixed (byte* ptr = data)
    {
        for (int i = 0; i < data.Length; i++)
            ptr[i] ^= key;
    }
}

byte[] buf = [1, 2, 3, 4];
XorBuffer(buf, 0xFF);
Console.WriteLine(buf[0]);  // 254`,
    explanation: "`fixed` pins the managed array so the GC doesn't move it during pointer arithmetic. The pin is released when the `fixed` block exits."
  },
];
