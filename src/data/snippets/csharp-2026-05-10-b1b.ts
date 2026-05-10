import type { Snippet } from "./types";

export const csharpSnippets20260510B1B: Snippet[] = [
  {
    id: "cs-classes-operator-overload",
    language: "csharp",
    title: "Operator overloading for custom value types",
    tag: "classes",
    code: `readonly record struct Money(decimal Amount, string Currency)
{
    public static Money operator +(Money a, Money b)
    {
        if (a.Currency != b.Currency)
            throw new InvalidOperationException("Currency mismatch");
        return new(a.Amount + b.Amount, a.Currency);
    }

    public static Money operator *(Money m, decimal factor) =>
        new(m.Amount * factor, m.Currency);

    public static bool operator >(Money a, Money b)
    {
        if (a.Currency != b.Currency) throw new InvalidOperationException();
        return a.Amount > b.Amount;
    }

    public static bool operator <(Money a, Money b) => b > a;

    public override string ToString() => $"{Amount:C} {Currency}";
}

var price  = new Money(10.00m, "USD");
var tax    = new Money(0.85m,  "USD");
var total  = price + tax;
var double_ = total * 2;

Console.WriteLine(total);    // $10.85 USD
Console.WriteLine(double_);  // $21.70 USD
Console.WriteLine(double_ > price);  // True`,
    explanation: "Operator overloading defines how operators (+, -, *, ==, <, etc.) behave for custom types. They must be static methods. Comparison operators must be defined in pairs (< with >, <= with >=). Using readonly record struct gives value equality for == and != automatically alongside the custom operators.",
  },
  {
    id: "cs-classes-explicit-implicit-conv",
    language: "csharp",
    title: "explicit and implicit conversion operators",
    tag: "classes",
    code: `readonly struct Celsius
{
    public double Value { get; }
    public Celsius(double v) => Value = v;

    // Explicit cast required (information may be lost)
    public static explicit operator Fahrenheit(Celsius c) =>
        new(c.Value * 9.0 / 5.0 + 32.0);

    // Implicit: always safe (no information loss)
    public static implicit operator double(Celsius c) => c.Value;

    public override string ToString() => $"{Value}°C";
}

readonly struct Fahrenheit
{
    public double Value { get; }
    public Fahrenheit(double v) => Value = v;
    public override string ToString() => $"{Value}°F";
}

Celsius boiling = new(100);
Fahrenheit f = (Fahrenheit)boiling;    // explicit cast required
Console.WriteLine(f);    // 212°F

double raw = boiling;    // implicit conversion -- no cast needed
Console.WriteLine(raw);  // 100`,
    explanation: "implicit conversions happen automatically without a cast; they should only be defined when conversion is always safe and lossless. explicit conversions require a cast and signal that the programmer acknowledges a possible loss. Both let custom types interoperate naturally with other types and numeric operations.",
  },
  {
    id: "cs-classes-generic-constraint-new",
    language: "csharp",
    title: "Generic constraints: new(), struct, class, interface, notnull",
    tag: "classes",
    code: `// new(): T must have a public parameterless constructor
static T CreateDefault<T>() where T : new() => new T();

// struct: T must be a value type (non-nullable)
static T ZeroOrDefault<T>(bool returnZero) where T : struct =>
    returnZero ? default : default;

// class: T must be a reference type
static T? FindFirst<T>(IEnumerable<T> source, Func<T, bool> pred)
    where T : class
    => source.FirstOrDefault(pred);

// notnull: T cannot be null (either non-nullable ref or value type)
static void PrintLength<T>(T value) where T : notnull
    => Console.WriteLine(value.ToString()!.Length);

// Combining constraints
static TResult Convert<TInput, TResult>(TInput input)
    where TInput : class
    where TResult : class, new()
{
    return new TResult();
}

// Interface + new
static T MakeAndInit<T>() where T : IDisposable, new()
{
    var t = new T();
    return t;
}`,
    explanation: "Generic constraints restrict what types T can be, enabling type-safe operations. new() allows new T(). struct/class enforce value vs reference type. notnull excludes nullable reference types and Nullable<T>. Multiple constraints are listed after a comma. The compiler uses constraints to determine which members are available on T.",
  },
  {
    id: "cs-snippet-pattern-list",
    language: "csharp",
    title: "List patterns match arrays and lists by structure (C# 11)",
    tag: "snippet",
    code: `int[] empty   = [];
int[] single  = [42];
int[] pair    = [1, 2];
int[] triple  = [1, 2, 3];
int[] longer  = [1, 2, 3, 4, 5];

string Describe(int[] arr) => arr switch
{
    []              => "empty",
    [var x]         => $"single: {x}",
    [var x, var y]  => $"pair: {x}, {y}",
    [1, 2, ..]      => "starts with 1,2",
    [.., 5]         => "ends with 5",
    _               => "other"
};

Console.WriteLine(Describe(empty));   // empty
Console.WriteLine(Describe(single));  // single: 42
Console.WriteLine(Describe(pair));    // pair: 1, 2
Console.WriteLine(Describe(triple));  // starts with 1,2
Console.WriteLine(Describe(longer));  // starts with 1,2

// Capture the remainder with ..slice
if (longer is [var head, .. var rest])
    Console.WriteLine($"head={head}, rest={rest.Length} items"); // head=1, rest=4`,
    explanation: "List patterns (C# 11) match arrays and indexable collections by element count and values. [] matches empty, [x] matches single-element, .. matches zero or more elements (the slice pattern). Combining .. with var captures the remainder as a subarray. Works with any type that exposes a Count/Length and an indexer.",
  },
  {
    id: "cs-snippet-required-member",
    language: "csharp",
    title: "required members must be set in object initializers (C# 11)",
    tag: "snippet",
    code: `class User
{
    public required string Username { get; init; }
    public required string Email    { get; init; }
    public string? DisplayName { get; init; }   // optional
    public int Age { get; init; }               // optional
}

// Must set both required members or compile error
var user = new User
{
    Username = "alice",
    Email    = "alice@example.com",
    // DisplayName is optional -- omitting is OK
};
Console.WriteLine(user.Username);   // alice

// var u2 = new User { Username = "bob" };  // CS9035: Email required

// SetsRequiredMembers: attribute lets constructors bypass the check
class Config
{
    public required string Host { get; init; }
    public required int Port    { get; init; }

    [System.Diagnostics.CodeAnalysis.SetsRequiredMembers]
    public Config() { Host = "localhost"; Port = 8080; }
}

var cfg = new Config();   // no initializer needed -- ctor sets them`,
    explanation: "required (C# 11) on a property forces callers to set it in the object initialiser; the compiler issues an error if it's omitted. This replaces constructor overloads for mandatory properties in data objects. The [SetsRequiredMembers] attribute tells the compiler that a constructor handles the requirement so consumers don't need to.",
  },
  {
    id: "cs-snippet-raw-string-multiline",
    language: "csharp",
    title: "Raw string literals eliminate escape sequences (C# 11)",
    tag: "snippet",
    code: `// Raw string: delimited by three or more quotes
string json = """
    {
        "name": "Alice",
        "scores": [10, 20, 30],
        "path": "C:\\Users\\Alice"
    }
    """;
Console.WriteLine(json);
// Indentation is stripped based on the closing """ column

// Interpolated raw string: $""" ... """ or $$""" ... """
string name = "World";
string greeting = $"""
    Hello, {name}!
    Today is a fine day.
    """;
Console.WriteLine(greeting);   // Hello, World!

// $$""" uses {{ }} to interpolate, allowing { } in the text
string template = $$"""
    SELECT * FROM users WHERE id = {{42}}
    AND name = 'O''Brien'
    """;
Console.WriteLine(template);`,
    explanation: "Raw string literals (C# 11) require no escape sequences inside — backslashes, quotes, and newlines are literal. The indentation of the closing delimiter determines how much leading whitespace is stripped from each line. Prefixing with $ adds interpolation; $$ requires {{ }} for interpolation holes, leaving single braces as literals.",
  },
  {
    id: "cs-snippet-span-stackalloc",
    language: "csharp",
    title: "stackalloc with Span<T> avoids heap allocation for temporary buffers",
    tag: "snippet",
    code: `// stackalloc allocates memory on the stack (no GC pressure)
// Assign to Span<T> to avoid requiring 'unsafe' context
Span<int> buffer = stackalloc int[8];

// Fill and use like an array
for (int i = 0; i < buffer.Length; i++)
    buffer[i] = i * i;

Console.WriteLine(buffer[3]);   // 9

// Practical: format a number without heap allocation
Span<char> chars = stackalloc char[20];
if (12345.TryFormat(chars, out int written))
{
    ReadOnlySpan<char> result = chars[..written];
    Console.WriteLine(result.ToString());   // 12345
}

// Limit: stack size is ~1 MB; don't stackalloc large buffers
// Use ArrayPool<T>.Shared.Rent for large temporary arrays
using System.Buffers;
int[] rented = ArrayPool<int>.Shared.Rent(1024);
try { /* use rented */ }
finally { ArrayPool<int>.Shared.Return(rented); }`,
    explanation: "stackalloc allocates a fixed-size block on the stack; combined with Span<T>, it's usable without 'unsafe'. Stack memory is automatically freed when the method returns — no GC involvement. Use it for small temporary buffers (up to a few hundred bytes). For larger buffers, ArrayPool<T>.Shared avoids repeated heap allocations.",
  },
  {
    id: "cs-snippet-linq-chunk",
    language: "csharp",
    title: "LINQ Chunk splits a sequence into fixed-size batches",
    tag: "snippet",
    code: `int[] numbers = Enumerable.Range(1, 10).ToArray();

// Chunk: splits sequence into arrays of at most 'size' elements
foreach (int[] batch in numbers.Chunk(3))
    Console.WriteLine(string.Join(", ", batch));
// 1, 2, 3
// 4, 5, 6
// 7, 8, 9
// 10          (last batch may be smaller)

// Practical: batch database inserts
IEnumerable<string> emails = ["a@x.com", "b@x.com", "c@x.com", "d@x.com"];
foreach (string[] batch in emails.Chunk(2))
{
    // InsertBatch(batch);  -- insert 2 at a time
    Console.WriteLine($"inserting {batch.Length} emails");
}

// Chunk is lazy -- elements are only enumerated when iterated
IEnumerable<int[]> chunks = Enumerable.Range(1, 1_000_000).Chunk(100);
Console.WriteLine(chunks.First().Length);   // 100 (only first batch fetched)`,
    explanation: "Chunk (LINQ .NET 6+) splits an IEnumerable<T> into arrays of at most size elements; the last chunk may be smaller. It's lazy — elements are only pulled from the source as each chunk is iterated. Use it for batching API calls, bulk database operations, or partitioning work across parallel tasks.",
  },
  {
    id: "cs-snippet-linq-index",
    language: "csharp",
    title: "LINQ Index() adds an index to each element (.NET 9)",
    tag: "snippet",
    code: `string[] fruits = ["apple", "banana", "cherry", "date"];

// Index() returns (int Index, T Item) tuples (.NET 9 / C# 13)
foreach ((int i, string fruit) in fruits.Index())
    Console.WriteLine($"{i}: {fruit}");
// 0: apple
// 1: banana
// 2: cherry
// 3: date

// Equivalent to Select with index, but cleaner
var indexed = fruits.Index()
    .Where(x => x.Index % 2 == 0)
    .Select(x => x.Item);
Console.WriteLine(string.Join(", ", indexed));   // apple, cherry

// Before .NET 9: use Select overload
var old = fruits.Select((item, idx) => (idx, item));
foreach (var (i, f) in old) Console.WriteLine($"{i}: {f}");`,
    explanation: "Enumerable.Index() (.NET 9) pairs each element with its zero-based position as (Index, Item) tuples — cleaner than the Select(item, idx) overload when you need the index in subsequent Where or Select operations. The value tuple allows deconstruction directly in foreach.",
  },
  {
    id: "cs-snippet-linq-order-by-descending",
    language: "csharp",
    title: "LINQ OrderBy with ThenBy for stable multi-key sorting",
    tag: "snippet",
    code: `record Employee(string Name, string Dept, int Salary);

var staff = new[]
{
    new Employee("Alice", "Eng", 90000),
    new Employee("Bob",   "HR",  70000),
    new Employee("Carol", "Eng", 95000),
    new Employee("Dave",  "HR",  72000),
    new Employee("Eve",   "Eng", 90000),
};

// Multi-key: department ascending, then salary descending
var sorted = staff
    .OrderBy(e => e.Dept)
    .ThenByDescending(e => e.Salary)
    .ThenBy(e => e.Name);   // tie-break by name

foreach (var e in sorted)
    Console.WriteLine($"{e.Dept} {e.Name} {e.Salary}");
// Eng Carol 95000
// Eng Alice 90000  (Alice and Eve same salary; Alice < Eve)
// Eng Eve   90000
// HR  Dave  72000
// HR  Bob   70000`,
    explanation: "OrderBy and ThenBy chain to build stable multi-key sorts without creating intermediate collections. ThenBy/ThenByDescending breaks ties in the preceding sort. The sort is stable — elements with equal keys maintain their original order. For in-place sorting of a list, use List<T>.Sort with a Comparison<T>.",
  },
  {
    id: "cs-snippet-span-write-format",
    language: "csharp",
    title: "TryFormat and TryParse on Span<char> avoid string allocations",
    tag: "snippet",
    code: `using System;

// TryFormat: write directly into a Span<char> without allocating a string
Span<char> buf = stackalloc char[32];

double pi = Math.PI;
pi.TryFormat(buf, out int written, "F4");
Console.WriteLine(buf[..written].ToString());   // 3.1416

DateTime now = new DateTime(2026, 5, 10, 12, 30, 0);
now.TryFormat(buf, out written, "yyyy-MM-dd");
Console.WriteLine(buf[..written].ToString());   // 2026-05-10

// TryParse from ReadOnlySpan<char>: parse without creating substrings
ReadOnlySpan<char> input = "  3.14159  ".AsSpan().Trim();
if (double.TryParse(input, out double value))
    Console.WriteLine(value);   // 3.14159

// Building a formatted string without heap allocations
var handler = new System.Text.StringBuilder();
handler.Append(123456789.ToString("N0"));   // "123,456,789"`,
    explanation: "TryFormat writes a formatted representation directly into a Span<char> buffer, and TryParse reads from a ReadOnlySpan<char>, both without allocating intermediate strings. Combined with stackalloc buffers, these enable zero-allocation number and date formatting in hot paths.",
  },
  {
    id: "cs-snippet-periodic-timer",
    language: "csharp",
    title: "PeriodicTimer: async-friendly recurring timer without drift",
    tag: "snippet",
    code: `using System.Threading;

// PeriodicTimer doesn't fire if the handler is still running (no overlap)
using var timer = new PeriodicTimer(TimeSpan.FromMilliseconds(50));

int count = 0;
var cts = new CancellationTokenSource(TimeSpan.FromMilliseconds(180));

try
{
    while (await timer.WaitForNextTickAsync(cts.Token))
    {
        count++;
        Console.WriteLine($"tick {count}");
        // Simulate work: if this takes > 50ms, next tick is delayed
        await Task.Delay(10);
    }
}
catch (OperationCanceledException)
{
    Console.WriteLine($"timer stopped after {count} ticks");
}

// Compare to System.Timers.Timer: fires on thread-pool, can overlap
// PeriodicTimer: one tick at a time, awaitable, no callback hell`,
    explanation: "PeriodicTimer (.NET 6+) fires once per period and waits for WaitForNextTickAsync to be called before scheduling the next tick, preventing overlapping executions. Pass a CancellationToken to stop it. Unlike Timer/Timers.Timer, it integrates naturally with async/await and doesn't require synchronisation for tick overlap.",
  },
  {
    id: "cs-snippet-activity-tracing",
    language: "csharp",
    title: "System.Diagnostics.Activity for distributed tracing",
    tag: "snippet",
    code: `using System.Diagnostics;

// ActivitySource is the entry point for creating activities (spans)
var source = new ActivitySource("MyApp.OrderService");

// Listener: receive activity events (in production, use OpenTelemetry)
ActivitySource.AddActivityListener(new ActivityListener
{
    ShouldListenTo  = s => s.Name.StartsWith("MyApp"),
    Sample          = (ref ActivityCreationOptions<ActivityContext> _) =>
        ActivitySamplingResult.AllDataAndRecorded,
    ActivityStarted = a => Console.WriteLine($"START {a.DisplayName}"),
    ActivityStopped = a => Console.WriteLine($"STOP  {a.DisplayName} ({a.Duration.Milliseconds}ms)"),
});

// Create a span (Activity)
using (var activity = source.StartActivity("ProcessOrder"))
{
    activity?.SetTag("order.id", "ORD-42");
    activity?.SetTag("customer", "Alice");
    await Task.Delay(10);   // simulate work

    using (var child = source.StartActivity("ValidatePayment"))
    {
        child?.SetTag("amount", 99.99);
        await Task.Delay(5);
    }
}`,
    explanation: "System.Diagnostics.Activity and ActivitySource implement the W3C Trace Context standard for distributed tracing. Start an activity to create a span; child activities automatically inherit the parent's trace context. Add OpenTelemetry to export spans to Jaeger, Zipkin, or an OTLP endpoint without changing instrumentation code.",
  },
  {
    id: "cs-snippet-memory-pool",
    language: "csharp",
    title: "MemoryPool<T> for reusable, heap-friendly buffers",
    tag: "snippet",
    code: `using System.Buffers;

// MemoryPool<T>.Shared: rent Memory<T> slices from a shared pool
IMemoryOwner<byte> owner = MemoryPool<byte>.Shared.Rent(1024);
try
{
    Memory<byte> buffer = owner.Memory;
    Console.WriteLine(buffer.Length);   // >= 1024 (pool may give more)

    // Fill the buffer
    buffer.Span.Fill(0xFF);
    Console.WriteLine(buffer.Span[0]);   // 255

    // Slice for use
    Memory<byte> header = buffer[..4];
    header.Span[0] = 0x01;
    header.Span[1] = 0x02;

    // Pass Memory<T> across async boundaries safely
    await ProcessAsync(buffer[..256]);
}
finally
{
    owner.Dispose();   // returns memory to pool
}

static async Task ProcessAsync(Memory<byte> data)
{
    await Task.Yield();
    Console.WriteLine($"processing {data.Length} bytes");
}`,
    explanation: "MemoryPool<T>.Shared is the managed equivalent of ArrayPool<T>; it returns an IMemoryOwner<T> whose .Memory property is a Memory<T> slice. Unlike ArrayPool, the rented size may be larger than requested. Dispose the owner to return the buffer. Use Memory<T> (not Span<T>) when the buffer needs to cross async boundaries.",
  },
  {
    id: "cs-snippet-unsafe-sizeof",
    language: "csharp",
    title: "sizeof and Unsafe.SizeOf<T> for struct layout information",
    tag: "snippet",
    code: `using System.Runtime.CompilerServices;
using System.Runtime.InteropServices;

// sizeof(T): compile-time constant for primitives
Console.WriteLine(sizeof(int));     // 4
Console.WriteLine(sizeof(double));  // 8
Console.WriteLine(sizeof(bool));    // 1

// Unsafe.SizeOf<T>: works for any unmanaged struct
[StructLayout(LayoutKind.Sequential)]
struct Rgb { public byte R, G, B; }

Console.WriteLine(Unsafe.SizeOf<Rgb>());   // 3

// Marshal.SizeOf: accounts for marshalling layout (may differ from managed)
Console.WriteLine(Marshal.SizeOf<Rgb>());  // 3 (same for simple structs)

// Check struct padding
[StructLayout(LayoutKind.Sequential)]
struct Padded { public byte A; public int B; }

Console.WriteLine(Unsafe.SizeOf<Padded>());   // 8 (1 byte + 3 padding + 4)
Console.WriteLine(Marshal.SizeOf<Padded>());  // 8

// LayoutKind.Pack to control padding
[StructLayout(LayoutKind.Sequential, Pack = 1)]
struct Packed { public byte A; public int B; }
Console.WriteLine(Unsafe.SizeOf<Packed>());   // 5`,
    explanation: "sizeof() is a compile-time operator for primitives and unmanaged types. Unsafe.SizeOf<T>() works for any struct including managed ones. Marshal.SizeOf accounts for interop marshalling rules which may differ from managed layout. StructLayout controls padding; Pack=1 eliminates alignment padding for dense binary serialisation.",
  },
  {
    id: "cs-snippet-httpclient-json",
    language: "csharp",
    title: "HttpClient with System.Net.Http.Json extension methods",
    tag: "snippet",
    code: `using System.Net.Http;
using System.Net.Http.Json;

// GetFromJsonAsync deserialises response body automatically
var client = new HttpClient { BaseAddress = new Uri("https://jsonplaceholder.typicode.com/") };

record Todo(int Id, string Title, bool Completed);

// GET + JSON deserialise in one call
Todo? todo = await client.GetFromJsonAsync<Todo>("todos/1");
Console.WriteLine(todo?.Title);   // delectus aut autem

// PostAsJsonAsync serialises and posts in one call
var newTodo = new Todo(0, "Learn C#", false);
HttpResponseMessage response = await client.PostAsJsonAsync("todos", newTodo);
Console.WriteLine(response.StatusCode);   // Created

// PutAsJsonAsync and PatchAsJsonAsync work similarly
// ReadFromJsonAsync for manual response handling:
using HttpResponseMessage res = await client.GetAsync("todos/2");
res.EnsureSuccessStatusCode();
Todo? t2 = await res.Content.ReadFromJsonAsync<Todo>();
Console.WriteLine(t2?.Completed);`,
    explanation: "System.Net.Http.Json (NuGet / .NET 5+) adds extension methods GetFromJsonAsync, PostAsJsonAsync, and ReadFromJsonAsync to HttpClient and HttpContent. They use System.Text.Json under the hood for zero-configuration JSON round-trips. Use IHttpClientFactory for proper client lifecycle management in ASP.NET Core.",
  },
  {
    id: "cs-understanding-string-interning",
    language: "csharp",
    title: "String interning: compile-time literals share references",
    tag: "understanding",
    code: `// Compile-time string literals are interned by the runtime
string a = "hello";
string b = "hello";
Console.WriteLine(ReferenceEquals(a, b));   // True -- same object!

// Runtime strings are NOT automatically interned
string c = new string("hello".ToCharArray());
Console.WriteLine(ReferenceEquals(a, c));   // False

// string.Intern manually interns a runtime string
string d = string.Intern(c);
Console.WriteLine(ReferenceEquals(a, d));   // True

// string.IsInterned checks without interning
Console.WriteLine(string.IsInterned("hello") != null);   // True
Console.WriteLine(string.IsInterned("xyz_runtime_123") != null); // likely False

// Why it matters: == always compares value, but
// interning makes ReferenceEquals work as a fast equality check
// (only use this as an optimisation with explicit string.Intern calls)`,
    explanation: "The runtime maintains an intern pool of strings. Identical string literals in source code are guaranteed to be the same object. Runtime-created strings are not interned automatically; call string.Intern() to add them. Interning enables reference-equality as a fast-path for long, frequently-compared strings.",
  },
  {
    id: "cs-understanding-boxing",
    language: "csharp",
    title: "Boxing allocates a heap object to wrap a value type",
    tag: "understanding",
    code: `int value = 42;

// Boxing: copies the int into a new heap object
object boxed = value;   // allocates
Console.WriteLine(boxed);           // 42
Console.WriteLine(boxed.GetType()); // System.Int32

// Unboxing: extracts the int from the heap object
int unboxed = (int)boxed;
Console.WriteLine(unboxed);   // 42

// Mutating the boxed copy does not affect the original
value = 100;
Console.WriteLine((int)boxed);   // 42 (still 42 -- boxed is a copy)

// Boxing in collections -- use generic List<T> to avoid
var list = new System.Collections.ArrayList();
list.Add(1);   // boxes each int
list.Add(2);
list.Add(3);
int sum = 0;
foreach (object o in list) sum += (int)o;   // unboxes each

// Generic List<int>: no boxing
var glist = new System.Collections.Generic.List<int> { 1, 2, 3 };`,
    explanation: "Boxing wraps a value type in a heap-allocated reference type object. It happens implicitly when assigning a value type to object, an interface, or a non-generic collection. Each box is an allocation and a copy; unboxing requires a runtime type check. Use generic collections to avoid boxing for numeric types.",
  },
  {
    id: "cs-understanding-span-ref-struct",
    language: "csharp",
    title: "Span<T> is a ref struct — it cannot be stored on the heap",
    tag: "understanding",
    code: `// ref struct: can only live on the stack
Span<int> span = stackalloc int[4];
span[0] = 1; span[1] = 2;

// Cannot store Span<T> in a class field
// class Holder { Span<int> span; }  // CS8345: field cannot be of ref struct type

// Cannot use Span<T> across an await boundary
// async Task Bad(Span<int> s) { await Task.Delay(1); }  // CS4012

// Cannot box Span<T>
// object o = span;   // CS0029

// Can pass as method parameter (same stack frame)
static int Sum(Span<int> s)
{
    int total = 0;
    foreach (int v in s) total += v;
    return total;
}
Console.WriteLine(Sum(span));   // 3

// ReadOnlySpan<char> from string: zero-copy
string text = "hello world";
ReadOnlySpan<char> word = text.AsSpan(0, 5);
Console.WriteLine(word.ToString());   // hello`,
    explanation: "Span<T> is a ref struct — it can only exist on the stack. This restriction prevents it from being stored in class fields, captured by lambdas, used across await points, or boxed. The compiler enforces these rules at compile time. Memory<T> is the heap-safe equivalent when Span's restrictions are too limiting.",
  },
  {
    id: "cs-types-covariant-return",
    language: "csharp",
    title: "Covariant return types: override can return a more derived type (C# 9)",
    tag: "types",
    code: `class Animal
{
    public virtual Animal Clone() => new Animal();
}

class Dog : Animal
{
    public string Name { get; init; } = "";

    // C# 9: override can return Dog (more derived than Animal)
    public override Dog Clone() => new Dog { Name = this.Name };
}

class Labrador : Dog
{
    public string Color { get; init; } = "";

    // Chain: Labrador overrides Dog.Clone returning Labrador
    public override Labrador Clone() =>
        new Labrador { Name = this.Name, Color = this.Color };
}

Dog d = new Dog { Name = "Rex" };
Dog cloned = d.Clone();     // returns Dog (not Animal) -- no cast needed
Console.WriteLine(cloned.Name);   // Rex

Labrador lab = new Labrador { Name = "Buddy", Color = "Yellow" };
Labrador clonedLab = lab.Clone();   // returns Labrador directly
Console.WriteLine(clonedLab.Color);   // Yellow`,
    explanation: "Covariant return types (C# 9) allow an override to return a type more derived than the overridden method's return type. This eliminates the need to cast the return value and makes fluent APIs and Clone() patterns more type-safe. The runtime representation is unchanged; the covariant type is enforced at compile time.",
  },
  {
    id: "cs-types-init-only-setter",
    language: "csharp",
    title: "init setters allow construction-time mutation only",
    tag: "types",
    code: `class Config
{
    public string Host { get; init; } = "localhost";
    public int Port    { get; init; } = 8080;
    public bool Debug  { get; init; } = false;
}

// Can set in object initialiser
var dev = new Config { Host = "dev.example.com", Debug = true };
Console.WriteLine(dev.Host);   // dev.example.com

// Cannot mutate after construction
// dev.Port = 443;   // CS8852: init-only property

// with expression on records uses init setters
record ServerConfig(string Host, int Port);
var prod = new ServerConfig("prod.example.com", 443);
var staging = prod with { Host = "staging.example.com" };

Console.WriteLine(staging.Port);   // 443 (unchanged)
Console.WriteLine(staging.Host);   // staging.example.com

// init vs set in interfaces
interface IPoint
{
    double X { get; init; }
    double Y { get; init; }
}`,
    explanation: "init setters (C# 9) allow a property to be set during object initialisation (new Type { Prop = val }) or in a with expression, but not after construction. Unlike get-only properties (which require a constructor), init properties work with object initialisers and are compatible with the record with expression.",
  },
  {
    id: "cs-types-pattern-when-guard",
    language: "csharp",
    title: "when guards refine pattern matching with boolean conditions",
    tag: "types",
    code: `record Order(string Id, decimal Amount, string Status);

static string Classify(Order o) => o switch
{
    { Status: "cancelled" }            => "cancelled",
    { Amount: > 1000, Status: "paid" } => "high-value paid",
    { Amount: > 1000 }                 => "high-value pending",
    { Status: "paid" } when o.Amount > 0 => "normal paid",
    _ => "other"
};

Console.WriteLine(Classify(new Order("A", 1500, "paid")));    // high-value paid
Console.WriteLine(Classify(new Order("B", 500,  "paid")));    // normal paid
Console.WriteLine(Classify(new Order("C", 2000, "pending"))); // high-value pending

// when on case labels
static string Describe(int n)
{
    switch (n)
    {
        case int x when x < 0: return "negative";
        case 0:                return "zero";
        case int x when x % 2 == 0: return "positive even";
        default:               return "positive odd";
    }
}

Console.WriteLine(Describe(-5));  // negative
Console.WriteLine(Describe(4));   // positive even`,
    explanation: "The when keyword adds a boolean guard to a pattern or case label; the pattern only matches when the guard is true. In switch expressions, property patterns { Prop: value } are checked before when guards, so combine them to avoid redundant checks. Guards enable arbitrary conditions that patterns alone can't express.",
  },
  {
    id: "cs-families-span-vs-array-vs-list",
    language: "csharp",
    title: "Span<T> vs array vs List<T>: choosing the right buffer",
    tag: "families",
    code: `// array: fixed-size, heap-allocated, supports indexing and Span slicing
int[] arr = new int[5];
arr[0] = 1;
Console.WriteLine(arr.Length);   // 5

// List<T>: dynamic-size, heap-allocated, grows automatically
var list = new List<int> { 1, 2, 3 };
list.Add(4);
Console.WriteLine(list.Count);   // 4

// Span<T>: stack or heap view, no allocation, synchronous only
Span<int> fromArr = arr;           // view over arr -- no copy
Span<int> slice   = arr.AsSpan(1, 3);   // [arr[1]..arr[3]]
slice[0] = 99;
Console.WriteLine(arr[1]);         // 99 -- Span mutated the original

// stackalloc + Span: no heap at all
Span<int> stack = stackalloc int[4] { 10, 20, 30, 40 };
Console.WriteLine(stack[2]);       // 30

// Choose:
// array  -> known fixed size, interop, LINQ
// List   -> dynamic size, collection APIs
// Span   -> hot-path slicing, no async, no field storage`,
    explanation: "Arrays are heap-allocated, fixed-size, and widely compatible. List<T> adds dynamic resizing via a doubling array. Span<T> is a zero-allocation view with no ownership — ideal for slicing and parsing but restricted to stack scope. Use AsSpan() to bridge between array/list and Span.",
  },
  {
    id: "cs-families-exception-types",
    language: "csharp",
    title: "ArgumentException vs InvalidOperationException vs ApplicationException",
    tag: "families",
    code: `// ArgumentException: caller passed a bad argument
static void SetAge(int age)
{
    if (age < 0) throw new ArgumentOutOfRangeException(nameof(age), age, "must be >= 0");
    if (age is < 0 or > 150) throw new ArgumentException("unrealistic age", nameof(age));
}

// InvalidOperationException: object is in wrong state for the operation
class Queue<T>
{
    private readonly System.Collections.Generic.Queue<T> _inner = new();
    public T Dequeue()
    {
        if (_inner.Count == 0)
            throw new InvalidOperationException("Queue is empty");
        return _inner.Dequeue();
    }
}

// NotImplementedException: method exists but isn't implemented yet
static void TodoFeature() => throw new NotImplementedException("coming in v2");

// NotSupportedException: operation is not supported in this context
static int ReadOnlyWrite() => throw new NotSupportedException("this stream is read-only");

try { SetAge(-1); } catch (ArgumentOutOfRangeException e) { Console.WriteLine(e.ParamName); }`,
    explanation: "Use ArgumentException (and its subtypes) for bad caller input. Use InvalidOperationException for calls that are invalid given the object's current state. NotImplementedException signals planned-but-unfinished code. NotSupportedException signals permanently unsupported operations. Catching these separately gives callers actionable context.",
  },
  {
    id: "cs-families-async-patterns",
    language: "csharp",
    title: "TAP vs EAP vs APM: three generations of async patterns",
    tag: "families",
    code: `using System.Net;

// APM (Async Programming Model, .NET 1.x): Begin/End pairs
// Stream stream = ...;
// IAsyncResult ar = stream.BeginRead(buf, 0, buf.Length, null, null);
// int n = stream.EndRead(ar);

// EAP (Event-based Async Pattern, .NET 2): events + BackgroundWorker
// var worker = new System.ComponentModel.BackgroundWorker();
// worker.DoWork += (_, e) => e.Result = HeavyWork();
// worker.RunWorkerCompleted += (_, e) => Console.WriteLine(e.Result);
// worker.RunWorkerAsync();

// TAP (Task-based Async Pattern, .NET 4+): modern, awaitable
static async Task<string> FetchAsync(string url)
{
    using var client = new System.Net.Http.HttpClient();
    return await client.GetStringAsync(url);
}

// TaskCompletionSource wraps APM/EAP to convert to TAP
static Task<string> ReadLineAsync(System.IO.TextReader reader)
{
    var tcs = new TaskCompletionSource<string>();
    try { tcs.SetResult(reader.ReadLine() ?? ""); }
    catch (Exception ex) { tcs.SetException(ex); }
    return tcs.Task;
}`,
    explanation: "APM (Begin/End) was .NET 1.x; EAP (events/BackgroundWorker) was .NET 2. TAP (Task/async/await) is the modern standard since .NET 4. Use TaskCompletionSource<T> to wrap legacy APM or EAP APIs into TAP so they can be awaited. New code should exclusively use TAP.",
  },
  {
    id: "cs-families-nullability-patterns",
    language: "csharp",
    title: "null checks: is null vs == null vs ?. vs ?? vs NullGuard",
    tag: "families",
    code: `string? s = null;

// is null: pattern match, cannot be overloaded, preferred
Console.WriteLine(s is null);     // True

// == null: calls operator==, can be overloaded (beware custom types)
Console.WriteLine(s == null);     // True

// is not null: positive non-null check
string? nonNull = "hello";
Console.WriteLine(nonNull is not null);   // True

// ?. (null-conditional): safe member access, returns null if left is null
Console.WriteLine(s?.Length);     // (null, no NullReferenceException)
Console.WriteLine(nonNull?.Length);   // 5

// ?? (null-coalescing): fallback value
string result = s ?? "default";
Console.WriteLine(result);   // default

// ArgumentNullException.ThrowIfNull (C# / .NET 7+)
static void Process(string? input)
{
    ArgumentNullException.ThrowIfNull(input, nameof(input));
    Console.WriteLine(input.Length);
}
try { Process(null); } catch (ArgumentNullException e) { Console.WriteLine(e.ParamName); }`,
    explanation: "is null is preferred for null checks because it uses pattern matching and cannot be fooled by a custom == operator. ?. short-circuits to null safely. ?? provides fallbacks. ArgumentNullException.ThrowIfNull (.NET 7) is the idiomatic guard clause that gives a precise parameter name in the exception.",
  },
  {
    id: "cs-classes-pattern-matching-switch",
    language: "csharp",
    title: "Switch expressions with type, property, and positional patterns",
    tag: "classes",
    code: `abstract record Expr;
record Num(double Value) : Expr;
record Add(Expr Left, Expr Right) : Expr;
record Mul(Expr Left, Expr Right) : Expr;
record Neg(Expr Operand) : Expr;

static double Eval(Expr e) => e switch
{
    Num(var v)        => v,
    Add(var l, var r) => Eval(l) + Eval(r),
    Mul(var l, var r) => Eval(l) * Eval(r),
    Neg(var o)        => -Eval(o),
    _                 => throw new ArgumentException($"unknown: {e}")
};

// (3 + 4) * -2  = -14
Expr expr = new Mul(
    new Add(new Num(3), new Num(4)),
    new Neg(new Num(2))
);
Console.WriteLine(Eval(expr));   // -14

// Property pattern with nested patterns
static string Describe(Expr e) => e switch
{
    Num { Value: 0 }  => "zero",
    Num { Value: > 0 } => "positive number",
    Num { Value: < 0 } => "negative number",
    Add { Left: Num, Right: Num } => "sum of two constants",
    _ => "complex expression"
};`,
    explanation: "Positional patterns (Num(var v)) deconstruct records using their primary constructor positions. Property patterns ({Property: value}) match on property values. Combining them with nested patterns and when guards enables elegant AST evaluation, serialisation routing, and state-machine logic without chains of if/else casts.",
  },
  {
    id: "cs-classes-record-deconstruct",
    language: "csharp",
    title: "Records auto-generate Deconstruct for positional patterns",
    tag: "classes",
    code: `record Point(double X, double Y);
record Line(Point Start, Point End);

var line = new Line(new Point(0, 0), new Point(3, 4));

// Deconstruct top level
var (start, end) = line;
Console.WriteLine(start);   // Point { X = 0, Y = 0 }

// Nested deconstruction
var (s, (ex, ey)) = line;  // not supported directly -- use positional pattern
if (line is (var p1, var p2))
{
    var (sx, sy) = p1;
    var (dx, dy) = p2;
    double length = Math.Sqrt((dx-sx)*(dx-sx) + (dy-sy)*(dy-sy));
    Console.WriteLine(length);   // 5
}

// Adding Deconstruct to non-record classes
class Circle
{
    public double X { get; }
    public double Y { get; }
    public double R { get; }
    public Circle(double x, double y, double r) { X=x; Y=y; R=r; }
    public void Deconstruct(out double x, out double y, out double r)
        => (x, y, r) = (X, Y, R);
}
var (cx, cy, cr) = new Circle(1, 2, 3);
Console.WriteLine(cx);   // 1`,
    explanation: "Positional records auto-generate a Deconstruct method matching the primary constructor parameters. This enables tuple-like destructuring assignment and positional patterns in switch expressions. Add Deconstruct manually to non-record classes to enable the same syntax.",
  },
  {
    id: "cs-classes-dependency-injection-manual",
    language: "csharp",
    title: "Manual dependency injection with constructor injection",
    tag: "classes",
    code: `// Interfaces define contracts
interface IEmailService { void Send(string to, string body); }
interface ILogger { void Log(string msg); }

// Concrete implementations
class ConsoleLogger : ILogger
{
    public void Log(string msg) => Console.WriteLine($"[LOG] {msg}");
}

class SmtpEmailService : IEmailService
{
    private readonly ILogger _logger;
    // Dependency injected through constructor
    public SmtpEmailService(ILogger logger) => _logger = logger;

    public void Send(string to, string body)
    {
        _logger.Log($"sending email to {to}");
        // real SMTP send here
    }
}

// Composition root: wire up the object graph
ILogger logger = new ConsoleLogger();
IEmailService emailSvc = new SmtpEmailService(logger);

emailSvc.Send("alice@example.com", "Hello!");
// [LOG] sending email to alice@example.com`,
    explanation: "Constructor injection passes dependencies through the constructor, making them explicit and testable. The composition root (typically Program.cs or Startup.cs) wires up the concrete types. In ASP.NET Core, services.AddScoped/AddSingleton/AddTransient automate this wiring through the built-in IoC container.",
  },
  {
    id: "cs-classes-lazy-generic",
    language: "csharp",
    title: "Lazy<T> defers expensive initialisation until first access",
    tag: "classes",
    code: `class ExpensiveService
{
    public ExpensiveService() { Console.WriteLine("ExpensiveService created"); }
    public string GetData() => "data";
}

class Controller
{
    // Lazy<T>: factory is called only on first .Value access
    private readonly Lazy<ExpensiveService> _service = new(() =>
    {
        Console.WriteLine("initialising...");
        return new ExpensiveService();
    });

    public void UseIfNeeded(bool needed)
    {
        if (needed)
            Console.WriteLine(_service.Value.GetData());   // triggers init
        else
            Console.WriteLine("skipped");
    }
}

var ctrl = new Controller();
ctrl.UseIfNeeded(false);   // skipped (no initialisation)
ctrl.UseIfNeeded(true);    // initialising... then ExpensiveService created then data
ctrl.UseIfNeeded(true);    // data (already initialised, no re-init)

// Thread-safe by default (LazyThreadSafetyMode.ExecutionAndPublication)`,
    explanation: "Lazy<T> wraps a factory delegate and calls it only when .Value is first accessed; subsequent accesses return the cached result. The default mode (ExecutionAndPublication) ensures thread safety by allowing only one thread to initialise and blocking others until complete. Use it to defer expensive one-time setup.",
  },
  {
    id: "cs-classes-observer-pattern",
    language: "csharp",
    title: "IObservable<T> / IObserver<T> for push-based event streams",
    tag: "classes",
    code: `// Custom observable source
class TemperatureSensor : IObservable<double>
{
    private readonly List<IObserver<double>> _observers = [];

    public IDisposable Subscribe(IObserver<double> observer)
    {
        _observers.Add(observer);
        return new Unsubscriber(_observers, observer);
    }

    public void Measure(double temp)
    {
        foreach (var obs in _observers) obs.OnNext(temp);
    }

    private class Unsubscriber(List<IObserver<double>> list, IObserver<double> obs) : IDisposable
    {
        public void Dispose() => list.Remove(obs);
    }
}

class AlertObserver : IObserver<double>
{
    public void OnNext(double value) =>
        Console.WriteLine(value > 80 ? $"ALERT: {value}°C" : $"OK: {value}°C");
    public void OnError(Exception e) => Console.WriteLine(e.Message);
    public void OnCompleted() => Console.WriteLine("done");
}

var sensor = new TemperatureSensor();
using var sub = sensor.Subscribe(new AlertObserver());
sensor.Measure(25); sensor.Measure(90); sensor.Measure(70);`,
    explanation: "IObservable<T>/IObserver<T> define the reactive push model: a source calls OnNext, OnError, and OnCompleted on subscribers. Subscribe returns an IDisposable to unsubscribe. Reactive Extensions (Rx.NET) builds rich operators (Where, Select, Throttle, Merge) on top of this interface.",
  },
  {
    id: "cs-classes-enumerator-struct",
    language: "csharp",
    title: "Custom struct enumerator avoids allocation in foreach",
    tag: "classes",
    code: `// Value-type enumerator: foreach uses it without boxing
struct RangeEnumerator
{
    private int _current;
    private readonly int _end;
    public RangeEnumerator(int start, int end) { _current = start - 1; _end = end; }
    public int Current => _current;
    public bool MoveNext() => ++_current <= _end;
}

// The collection type exposes the struct enumerator via GetEnumerator()
readonly struct NumberRange
{
    private readonly int _start, _end;
    public NumberRange(int start, int end) { _start = start; _end = end; }

    // foreach calls GetEnumerator(); returning a struct avoids IEnumerator boxing
    public RangeEnumerator GetEnumerator() => new(_start, _end);
}

var range = new NumberRange(1, 5);
foreach (int n in range)
    Console.Write(n + " ");   // 1 2 3 4 5
Console.WriteLine();

// No heap allocation: RangeEnumerator lives on the stack
// Compare to: IEnumerable<int> boxes the enumerator`,
    explanation: "foreach in C# calls GetEnumerator() and uses duck typing — the enumerator doesn't need to implement IEnumerator. If GetEnumerator returns a struct, no boxing occurs. This is how List<T>.Enumerator works. The pattern is used in high-performance code (game engines, low-GC servers) to eliminate per-foreach allocations.",
  },
  {
    id: "cs-classes-fluent-builder",
    language: "csharp",
    title: "Fluent builder pattern with method chaining",
    tag: "classes",
    code: `class QueryBuilder
{
    private string _table = "";
    private readonly List<string> _conditions = [];
    private int? _limit;
    private string _orderBy = "";

    public QueryBuilder From(string table) { _table = table; return this; }
    public QueryBuilder Where(string condition) { _conditions.Add(condition); return this; }
    public QueryBuilder Limit(int n) { _limit = n; return this; }
    public QueryBuilder OrderBy(string column) { _orderBy = column; return this; }

    public string Build()
    {
        var sql = $"SELECT * FROM {_table}";
        if (_conditions.Count > 0)
            sql += " WHERE " + string.Join(" AND ", _conditions);
        if (!string.IsNullOrEmpty(_orderBy))
            sql += $" ORDER BY {_orderBy}";
        if (_limit.HasValue)
            sql += $" LIMIT {_limit}";
        return sql;
    }
}

string query = new QueryBuilder()
    .From("users")
    .Where("age > 18")
    .Where("active = 1")
    .OrderBy("name")
    .Limit(10)
    .Build();

Console.WriteLine(query);
// SELECT * FROM users WHERE age > 18 AND active = 1 ORDER BY name LIMIT 10`,
    explanation: "Fluent builders return this from each configuration method, enabling method chaining. This produces readable, self-documenting construction code. The Build() method validates and constructs the final object. Use record with expressions as an alternative for immutable configuration objects that don't need step-by-step construction.",
  },
  {
    id: "cs-classes-strategy-pattern",
    language: "csharp",
    title: "Strategy pattern using delegates vs interfaces",
    tag: "classes",
    code: `// Interface-based strategy
interface ISortStrategy<T>
{
    void Sort(List<T> items);
}

class BubbleSort<T> : ISortStrategy<T> where T : IComparable<T>
{
    public void Sort(List<T> items)
    {
        for (int i = 0; i < items.Count - 1; i++)
            for (int j = 0; j < items.Count - i - 1; j++)
                if (items[j].CompareTo(items[j+1]) > 0)
                    (items[j], items[j+1]) = (items[j+1], items[j]);
    }
}

// Delegate-based strategy (simpler for single-method strategies)
class Sorter<T>
{
    private readonly Action<List<T>> _strategy;
    public Sorter(Action<List<T>> strategy) => _strategy = strategy;
    public void Sort(List<T> items) => _strategy(items);
}

var nums = new List<int> { 5, 1, 3, 2, 4 };

// Delegate approach: pass a lambda or method reference
var sorter = new Sorter<int>(items => items.Sort());
sorter.Sort(nums);
Console.WriteLine(string.Join(", ", nums));   // 1, 2, 3, 4, 5

// Interface approach
var bubble = new BubbleSort<int>();
var nums2 = new List<int> { 5, 1, 3 };
bubble.Sort(nums2);
Console.WriteLine(string.Join(", ", nums2));  // 1, 3, 5`,
    explanation: "Single-method strategies are cleanest as delegates (Func<T> or Action<T>) — they accept lambdas, method references, and closures without boilerplate. Multi-method strategies or those requiring state benefit from interfaces. C# functional-style delegates reduce the need for one-method strategy interfaces.",
  },
  {
    id: "cs-classes-dispose-pattern",
    language: "csharp",
    title: "Implement IDisposable correctly with the Dispose pattern",
    tag: "classes",
    code: `class Resource : IDisposable
{
    private bool _disposed;
    private readonly System.IO.Stream _stream;

    public Resource(string path)
        => _stream = System.IO.File.OpenRead(path);

    // Public Dispose: called by user or using statement
    public void Dispose()
    {
        Dispose(disposing: true);
        GC.SuppressFinalize(this);   // no need to run finaliser
    }

    // Protected virtual: subclasses override this
    protected virtual void Dispose(bool disposing)
    {
        if (_disposed) return;
        if (disposing)
        {
            _stream.Dispose();   // dispose managed resources
        }
        // release unmanaged resources here (handles, pointers, etc.)
        _disposed = true;
    }

    // Finaliser: last-resort cleanup if Dispose() wasn't called
    ~Resource() => Dispose(disposing: false);

    public int Read(byte[] buf) =>
        _disposed ? throw new ObjectDisposedException(nameof(Resource))
                  : _stream.Read(buf, 0, buf.Length);
}`,
    explanation: "The Dispose pattern separates managed cleanup (done when disposing=true) from unmanaged cleanup (done in both paths). GC.SuppressFinalize prevents the finaliser from running after Dispose is called, avoiding double cleanup. Subclasses override Dispose(bool) and call base. Throw ObjectDisposedException on any access after disposal.",
  },
  {
    id: "cs-caveats-generic-static-field",
    language: "csharp",
    title: "Static fields in generic types are per-type-argument, not shared",
    tag: "caveats",
    code: `class Counter<T>
{
    // This field is NOT shared — each T gets its own Counter<T>.Count
    public static int Count;
    public Counter() => Count++;
}

var a1 = new Counter<int>();
var a2 = new Counter<int>();
var b1 = new Counter<string>();

Console.WriteLine(Counter<int>.Count);    // 2 (two int counters)
Console.WriteLine(Counter<string>.Count); // 1 (one string counter)
Console.WriteLine(Counter<double>.Count); // 0 (none for double)

// This is by design: Counter<int> and Counter<string> are different types
// Each gets its own static field

// Gotcha: using a static field to enforce singleton per T
class Singleton<T>
{
    private static Singleton<T>? _instance;
    public static Singleton<T> Instance => _instance ??= new();
    // Counter<int>.Instance != Counter<string>.Instance
}`,
    explanation: "Static fields in generic types are specific to each closed generic type: Counter<int>.Count and Counter<string>.Count are completely independent fields. This is because Counter<int> and Counter<string> are different types at the CLR level. This can be a feature (per-type caching) or a bug (expecting shared state).",
  },
  {
    id: "cs-caveats-event-memory-leak",
    language: "csharp",
    title: "Event subscriptions keep subscribers alive — unsubscribe to prevent leaks",
    tag: "caveats",
    code: `class Publisher
{
    public event EventHandler? DataReceived;
    public void Publish() => DataReceived?.Invoke(this, EventArgs.Empty);
}

class Subscriber
{
    public string Name { get; }
    public Subscriber(string name, Publisher pub)
    {
        Name = name;
        pub.DataReceived += OnData;   // strong reference from pub to this
    }
    private void OnData(object? s, EventArgs e) =>
        Console.WriteLine($"{Name} received data");
}

var pub = new Publisher();
var sub = new Subscriber("Alice", pub);
pub.Publish();   // Alice received data

// Even if we 'lose' our reference to sub:
sub = null!;
GC.Collect();
pub.Publish();   // Alice still receives! pub holds a strong ref to the delegate

// Fix: unsubscribe in Dispose or use WeakEventManager (WPF) or weak delegates
class SafeSubscriber : IDisposable
{
    private readonly Publisher _pub;
    public SafeSubscriber(Publisher pub)
    {
        _pub = pub;
        _pub.DataReceived += OnData;
    }
    private void OnData(object? s, EventArgs e) => Console.WriteLine("handled");
    public void Dispose() => _pub.DataReceived -= OnData;
}`,
    explanation: "An event subscription (pub.Event += handler) adds a delegate to the event's invocation list, which holds a strong reference to the subscriber object. Until the subscription is removed with -=, the subscriber cannot be garbage collected. Always unsubscribe in Dispose or use weak-reference event patterns for long-lived publishers.",
  },
  {
    id: "cs-caveats-string-format-perf",
    language: "csharp",
    title: "String interpolation vs string.Format vs StringBuilder in loops",
    tag: "caveats",
    code: `using System.Text;
using System.Diagnostics;

const int N = 10_000;

// Slow: repeated string + in loop (O(n^2) allocations)
var sw = Stopwatch.StartNew();
string bad = "";
for (int i = 0; i < N; i++) bad += i.ToString();
sw.Stop();
Console.WriteLine($"+ concat:      {sw.ElapsedMilliseconds}ms, len={bad.Length}");

// Fast: StringBuilder (O(n) amortised)
sw.Restart();
var sb = new StringBuilder();
for (int i = 0; i < N; i++) sb.Append(i);
string good = sb.ToString();
sw.Stop();
Console.WriteLine($"StringBuilder: {sw.ElapsedMilliseconds}ms, len={good.Length}");

// Interpolated strings: fine for ONE-SHOT use (compiler optimises)
string name = "Alice"; int age = 30;
string msg = $"Hello {name}, you are {age}";
// No performance issue for a single interpolation`,
    explanation: "String concatenation in a loop creates a new string object each iteration — O(n²) time and memory. StringBuilder amortises allocation with a doubling buffer, making loop-based building O(n). Interpolated strings in single expressions are fine; the compiler generates efficient code. In .NET 6+, interpolated strings with IFormattable also avoid intermediate strings.",
  },
];
