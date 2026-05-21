import type { Snippet } from "./types";

export const csharpSnippets20260521B2: Snippet[] = [
  {
    id: "cs-0521-b2-collection-expression",
    language: "csharp",
    title: "collection expressions (C# 12+)",
    tag: "snippet",
    code: `// Before C# 12
int[] arr1 = new int[] { 1, 2, 3 };
List<int> list1 = new List<int> { 1, 2, 3 };

// C# 12: collection expression [...]
int[] arr2 = [1, 2, 3];
List<int> list2 = [1, 2, 3];
Span<int> span = [1, 2, 3];
ImmutableArray<int> ia = [1, 2, 3];

// Spread operator ..
int[] first = [1, 2, 3];
int[] second = [4, 5, 6];
int[] combined = [..first, ..second, 7, 8];
Console.WriteLine(combined.Length);  // 8`,
    explanation: "Collection expressions (C# 12) unify collection initialization syntax across all collection types — `[..]` works for arrays, `List<T>`, `Span<T>`, `ImmutableArray`, and more; the `..` spread operator flattens nested collections.",
  },
  {
    id: "cs-0521-b2-linq-chunk",
    language: "csharp",
    title: "LINQ Chunk for batching (.NET 6+)",
    tag: "snippet",
    code: `using System.Linq;

int[] data = Enumerable.Range(1, 15).ToArray();

// Split into batches of 4
foreach (var batch in data.Chunk(4))
    Console.WriteLine(string.Join(",", batch));
// 1,2,3,4
// 5,6,7,8
// 9,10,11,12
// 13,14,15   <- last batch may be smaller

// Practical: bulk database inserts
var records = Enumerable.Range(1, 1000);
foreach (var batch in records.Chunk(100))
{
    // InsertBatch(batch);  // 10 calls instead of 1000
}`,
    explanation: "`Chunk(size)` splits a sequence into arrays of at most `size` elements — the last chunk may be shorter; it's the clean replacement for manual page/skip-take pagination and bulk operation batching.",
  },
  {
    id: "cs-0521-b2-required-with-constructor",
    language: "csharp",
    title: "SetsRequiredMembers attribute for constructor bypass",
    tag: "classes",
    code: `using System.Diagnostics.CodeAnalysis;

class User
{
    public required string Name  { get; init; }
    public required string Email { get; init; }
    public int Age { get; init; }

    // This constructor satisfies all required members
    [SetsRequiredMembers]
    public User(string name, string email)
    {
        Name  = name;
        Email = email;
    }
}

// Both ways work:
var u1 = new User("Alice", "a@b.com");                // ctor
var u2 = new User { Name = "Bob", Email = "b@b.com" }; // initializer
Console.WriteLine(u1.Name);   // Alice`,
    explanation: "`[SetsRequiredMembers]` tells the compiler that a constructor initializes all `required` members — without it, callers of the constructor would also need to provide the required members in the object initializer.",
  },
  {
    id: "cs-0521-b2-string-create",
    language: "csharp",
    title: "string.Create for zero-copy string building",
    tag: "snippet",
    code: `using System;

// Build a formatted string without intermediate allocations
int length = 5;
string result = string.Create(length, (42, 'X'), (span, state) =>
{
    var (value, fill) = state;
    // Fill span in-place — no intermediate string
    span.Fill(fill);
    span[0] = (char)('0' + value / 10);
    span[1] = (char)('0' + value % 10);
});
Console.WriteLine(result);   // 42XXX

// More practical: GUID-like ID generation
string id = string.Create(8, 0, (span, _) =>
{
    var guid = Guid.NewGuid().ToString("N");
    guid.AsSpan(0, 8).CopyTo(span);
});
Console.WriteLine(id.Length);   // 8`,
    explanation: "`string.Create` allocates a string of a fixed length and passes a writable `Span<char>` to a callback — the string is initialized in-place with no intermediate allocations, making it ideal for formatted output in hot paths.",
  },
  {
    id: "cs-0521-b2-record-inheritance",
    language: "csharp",
    title: "record inheritance and polymorphism",
    tag: "classes",
    code: `abstract record Shape
{
    public abstract double Area { get; }
}

record Circle(double Radius) : Shape
{
    public override double Area => Math.PI * Radius * Radius;
}

record Rectangle(double W, double H) : Shape
{
    public override double Area => W * H;
}

Shape[] shapes = [new Circle(5), new Rectangle(3, 4)];
foreach (var s in shapes)
    Console.WriteLine($"{s.GetType().Name}: {s.Area:F2}");
// Circle: 78.54
// Rectangle: 12.00

// with-expression respects derived type
var c = new Circle(5);
var bigger = c with { Radius = 10 };
Console.WriteLine(bigger.GetType().Name);   // Circle`,
    explanation: "Records support inheritance — derived records inherit properties and generated methods from the base; `with`-expressions on a derived record return the same derived type, preserving polymorphism.",
  },
  {
    id: "cs-0521-b2-memory-pool",
    language: "csharp",
    title: "ArrayPool<T> for renting and returning buffers",
    tag: "snippet",
    code: `using System.Buffers;

// Rent a buffer — may be larger than requested
byte[] buffer = ArrayPool<byte>.Shared.Rent(1024);
Console.WriteLine(buffer.Length);  // >= 1024

try
{
    // Use only the first 1024 bytes
    var span = buffer.AsSpan(0, 1024);
    span.Fill(0xAB);
    Console.WriteLine(span[0]);  // 171
}
finally
{
    // Always return — clearArray: true wipes sensitive data
    ArrayPool<byte>.Shared.Return(buffer, clearArray: false);
}`,
    explanation: "`ArrayPool<T>.Shared` rents pre-allocated arrays from a pool and accepts them back — it eliminates GC pressure from repeatedly allocating large temporary buffers; always return in a `finally` block and remember the actual slice you're using.",
  },
  {
    id: "cs-0521-b2-span-write",
    language: "csharp",
    title: "writing to Span<char> with TryFormat",
    tag: "types",
    code: `using System;

// TryFormat writes directly into a Span<char> — no string allocation
Span<char> buffer = stackalloc char[64];

double value = 1234567.891;

// Format into the span
if (value.TryFormat(buffer, out int written, "N2"))
{
    ReadOnlySpan<char> formatted = buffer[..written];
    Console.WriteLine(formatted.ToString());  // 1,234,567.89
}

// DateTime also supports TryFormat
var now = DateTime.UtcNow;
if (now.TryFormat(buffer, out written, "yyyy-MM-dd"))
    Console.WriteLine(buffer[..written].ToString());`,
    explanation: "`TryFormat` is the allocation-free companion to `ToString(format)` — it writes directly into a `Span<char>` and returns the number of characters written; combine with `stackalloc` for zero-heap-allocation formatting.",
  },
  {
    id: "cs-0521-b2-optional-parameter-overloads",
    language: "csharp",
    title: "optional parameters vs method overloads",
    tag: "caveats",
    code: `class Logger
{
    // Optional parameters: caller must recompile if defaults change
    public void Log(string msg, bool timestamp = true, string level = "INFO") =>
        Console.WriteLine($"[{level}] {msg}");

    // Overloads: callers don't see the implementation detail
    public void Log(string msg) => Log(msg, true, "INFO");
    public void Log(string msg, string level) => Log(msg, true, level);
    public void Log(string msg, bool timestamp, string level)
    {
        if (timestamp) Console.Write(DateTime.Now.ToString("HH:mm:ss "));
        Console.WriteLine($"[{level}] {msg}");
    }
}

var log = new Logger();
log.Log("started");            // both work
log.Log("error", "ERROR");`,
    explanation: "Optional parameter defaults are baked into the call site at compile time — changing a default requires recompiling callers; overloads encode the API surface in the type system and let you change internals without breaking callers.",
  },
  {
    id: "cs-0521-b2-span-numbers",
    language: "csharp",
    title: "MemoryMarshal for reinterpreting Span<T> types",
    tag: "types",
    code: `using System;
using System.Runtime.InteropServices;

byte[] data = { 0x01, 0x00, 0x00, 0x00,
                0x02, 0x00, 0x00, 0x00 };

// Reinterpret bytes as ints — zero copy, little-endian
ReadOnlySpan<int> ints = MemoryMarshal.Cast<byte, int>(data);
Console.WriteLine(ints.Length);   // 2
Console.WriteLine(ints[0]);       // 1
Console.WriteLine(ints[1]);       // 2

// Write ints into a byte buffer
Span<byte> output = stackalloc byte[8];
Span<int> intView = MemoryMarshal.Cast<byte, int>(output);
intView[0] = 42;
intView[1] = 99;
Console.WriteLine(output[0]);   // 42  (little-endian)`,
    explanation: "`MemoryMarshal.Cast<TFrom, TTo>` reinterprets the same memory as a different element type without copying — essential for binary protocol parsing where you need to read multi-byte integers directly from a byte buffer.",
  },
  {
    id: "cs-0521-b2-interface-covariance-consumer",
    language: "csharp",
    title: "IEnumerable covariance vs IList invariance",
    tag: "types",
    code: `using System.Collections.Generic;
using System.Linq;

class Animal { }
class Dog : Animal { }

// IEnumerable<T> is covariant: IEnumerable<Dog> -> IEnumerable<Animal>
IEnumerable<Dog> dogs = new List<Dog> { new Dog(), new Dog() };
IEnumerable<Animal> animals = dogs;   // OK
Console.WriteLine(animals.Count());   // 2

// List<T> is invariant: cannot assign List<Dog> to List<Animal>
// List<Animal> animalList = new List<Dog>();  // compile error

// IReadOnlyList<T> is covariant
IReadOnlyList<Dog> rdogs = new List<Dog> { new Dog() };
IReadOnlyList<Animal> ranimals = rdogs;   // OK
Console.WriteLine(ranimals[0].GetType().Name);  // Dog`,
    explanation: "Covariance (`out T`) is safe for read-only interfaces — you can only get items out; `IList<T>` is invariant because `Add(Animal)` could insert a non-Dog into a `List<Dog>`, breaking type safety.",
  },
  {
    id: "cs-0521-b2-env-config",
    language: "csharp",
    title: "IConfiguration for layered app configuration",
    tag: "snippet",
    code: `using Microsoft.Extensions.Configuration;

// Layer: appsettings.json < appsettings.{env}.json < env vars < cmd args
var config = new ConfigurationBuilder()
    .SetBasePath(Directory.GetCurrentDirectory())
    .AddJsonFile("appsettings.json", optional: true)
    .AddEnvironmentVariables()
    .AddCommandLine(args: System.Environment.GetCommandLineArgs())
    .Build();

string host = config["Database:Host"] ?? "localhost";
int    port = config.GetValue<int>("Database:Port", 5432);

Console.WriteLine($"DB: {host}:{port}");

// Typed config section
// var dbConfig = config.GetSection("Database").Get<DbConfig>();`,
    explanation: "`IConfiguration` layers sources with later additions overriding earlier ones — environment variables override JSON files, command-line args override everything; `GetSection` + `Get<T>` binds a config section to a typed class.",
  },
  {
    id: "cs-0521-b2-dispose-pattern",
    language: "csharp",
    title: "IDisposable and the dispose pattern",
    tag: "classes",
    code: `class ManagedResource : IDisposable
{
    private bool _disposed;
    private readonly System.IO.Stream _stream;

    public ManagedResource(string path)
        => _stream = System.IO.File.OpenRead(path);

    public void Read(byte[] buf) => _stream.Read(buf);

    public void Dispose()
    {
        Dispose(disposing: true);
        GC.SuppressFinalize(this);
    }

    protected virtual void Dispose(bool disposing)
    {
        if (_disposed) return;
        if (disposing) _stream.Dispose();   // managed resources
        _disposed = true;
    }

    ~ManagedResource() => Dispose(disposing: false);
}

using var res = new ManagedResource("/etc/hostname");
// res.Dispose() called automatically when scope exits`,
    explanation: "The full dispose pattern uses a `protected virtual Dispose(bool)` to separate managed (IDisposable children) from unmanaged (handles) cleanup — `GC.SuppressFinalize` prevents the finalizer from running if `Dispose` already cleaned up.",
  },
  {
    id: "cs-0521-b2-record-deconstruct",
    language: "csharp",
    title: "record deconstruction and positional patterns",
    tag: "snippet",
    code: `record Point(double X, double Y);
record Rect(Point TopLeft, Point BottomRight);

var r = new Rect(new Point(0, 0), new Point(10, 5));

// Nested deconstruction
var (tl, br) = r;
var (x1, y1) = tl;
Console.WriteLine($"({x1},{y1}) to ({br.X},{br.Y})");  // (0,0) to (10,5)

// Positional pattern in switch
string Describe(Point p) => p switch
{
    (0, 0)     => "origin",
    (0, _)     => "on Y-axis",
    (_, 0)     => "on X-axis",
    (var x, var y) when x == y => $"on diagonal y={y}",
    (var x, var y) => $"({x},{y})",
};
Console.WriteLine(Describe(new Point(3, 3)));   // on diagonal y=3`,
    explanation: "Records auto-generate `Deconstruct` methods matching their primary constructor parameters — this enables tuple-style unpacking and positional patterns in switch expressions without any extra code.",
  },
  {
    id: "cs-0521-b2-unsafe-fixed-array",
    language: "csharp",
    title: "fixed-size buffers in unsafe structs",
    tag: "types",
    code: `using System.Runtime.InteropServices;

[StructLayout(LayoutKind.Sequential, Pack = 1)]
unsafe struct EthernetHeader
{
    public fixed byte Destination[6];   // 6-byte MAC
    public fixed byte Source[6];        // 6-byte MAC
    public ushort EtherType;
}

// Total size: 14 bytes — perfect for network parsing
Console.WriteLine(sizeof(EthernetHeader));   // 14

unsafe
{
    byte[] packet = new byte[14];
    fixed (byte* ptr = packet)
    {
        var header = (EthernetHeader*)ptr;
        header->EtherType = 0x0800;  // IPv4 in network byte order
    }
}`,
    explanation: "Fixed-size buffers (`fixed T name[N]`) in `unsafe` structs embed a C-style array inline — combined with `[StructLayout(Sequential)]`, they map directly to network packet headers or binary file formats for zero-copy parsing.",
  },
  {
    id: "cs-0521-b2-task-run-vs-async",
    language: "csharp",
    title: "Task.Run for offloading CPU work vs async for I/O",
    tag: "caveats",
    code: `using System.Threading.Tasks;
using System.Linq;

// CPU-bound: use Task.Run to avoid blocking the thread pool
async Task<int> ComputeSumAsync(int n)
{
    return await Task.Run(() =>
        Enumerable.Range(1, n).Sum());
}

// I/O-bound: async/await directly — no Task.Run needed
async Task<string> ReadFileAsync(string path)
{
    return await System.IO.File.ReadAllTextAsync(path);
}

// Anti-pattern: wrapping already-async code in Task.Run
// (wastes a thread on top of the I/O machinery)
// async Task<string> Bad(string path)
//     => await Task.Run(() => File.ReadAllTextAsync(path));  // WRONG

int sum = await ComputeSumAsync(1_000_000);
Console.WriteLine(sum);`,
    explanation: "`Task.Run` moves work to a thread-pool thread, preventing UI/server thread blocking for CPU-bound operations — never wrap already-async I/O operations in `Task.Run`, as that wastes a thread waiting on I/O the async machinery handles for free.",
  },
  {
    id: "cs-0521-b2-generic-class-constraints-new",
    language: "csharp",
    title: "generic factory pattern with new() constraint",
    tag: "classes",
    code: `using System;
using System.Collections.Generic;

class ObjectPool<T> where T : class, new()
{
    private readonly Stack<T> _pool = new();

    public T Rent()
        => _pool.TryPop(out var obj) ? obj : new T();

    public void Return(T obj)
    {
        // Optionally reset obj state here
        _pool.Push(obj);
    }
}

class Connection
{
    public bool IsOpen { get; set; }
    public Connection() { IsOpen = true; }
}

var pool = new ObjectPool<Connection>();
var c1 = pool.Rent();
Console.WriteLine(c1.IsOpen);  // True
pool.Return(c1);
var c2 = pool.Rent();
Console.WriteLine(c2 == c1);   // True — reused`,
    explanation: "`where T : class, new()` constrains `T` to reference types with a parameterless constructor — the `new()` constraint lets you call `new T()` inside the generic method, enabling generic factory patterns like object pools.",
  },
  {
    id: "cs-0521-b2-linq-selectmany",
    language: "csharp",
    title: "LINQ SelectMany for flattening nested sequences",
    tag: "snippet",
    code: `using System.Linq;

var departments = new[]
{
    new { Name = "Eng",  Members = new[] { "Alice", "Carol" } },
    new { Name = "HR",   Members = new[] { "Bob" } },
    new { Name = "Ops",  Members = new[] { "Dave", "Eve" } },
};

// Flatten: one sequence of all members
var allMembers = departments.SelectMany(d => d.Members);
Console.WriteLine(string.Join(", ", allMembers));
// Alice, Carol, Bob, Dave, Eve

// With result selector: include context
var withDept = departments.SelectMany(
    d => d.Members,
    (d, m) => new { Dept = d.Name, Name = m });
foreach (var x in withDept)
    Console.WriteLine($"{x.Name} ({x.Dept})");`,
    explanation: "`SelectMany` maps each element to a sub-sequence and then flattens all sub-sequences into one — it's the LINQ equivalent of `flatMap`; the two-argument overload passes both the source element and the projected element to the result selector.",
  },
  {
    id: "cs-0521-b2-span-binary-read",
    language: "csharp",
    title: "BinaryPrimitives for portable binary reading",
    tag: "snippet",
    code: `using System;
using System.Buffers.Binary;

byte[] data = { 0x00, 0x01, 0x02, 0x03,
                0xFF, 0xFF, 0xFF, 0xFF };

ReadOnlySpan<byte> span = data;

// Read with explicit endianness — portable across architectures
int  bigEndian    = BinaryPrimitives.ReadInt32BigEndian(span[..4]);
uint littleEndian = BinaryPrimitives.ReadUInt32LittleEndian(span[4..]);

Console.WriteLine(bigEndian);      // 66051 (0x00010203)
Console.WriteLine(littleEndian);   // 4294967295 (0xFFFFFFFF)

// Write
Span<byte> buf = stackalloc byte[4];
BinaryPrimitives.WriteInt32BigEndian(buf, 12345);
Console.WriteLine(buf[0]);   // 0`,
    explanation: "`BinaryPrimitives` reads and writes integer types with explicit endianness from `Span<byte>` — it replaces `BitConverter` which uses host endianness (non-portable) and returns arrays (allocating).",
  },
  {
    id: "cs-0521-b2-singleton-di",
    language: "csharp",
    title: "dependency injection lifetimes: Singleton, Scoped, Transient",
    tag: "classes",
    code: `using Microsoft.Extensions.DependencyInjection;

interface IService { Guid Id { get; } }
class MyService : IService { public Guid Id { get; } = Guid.NewGuid(); }

var services = new ServiceCollection();
services.AddSingleton<IService, MyService>();  // one instance ever
// services.AddScoped<IService, MyService>();  // one per request/scope
// services.AddTransient<IService, MyService>(); // new every time

var provider = services.BuildServiceProvider();

var s1 = provider.GetRequiredService<IService>();
var s2 = provider.GetRequiredService<IService>();

Console.WriteLine(s1.Id == s2.Id);  // True — same instance (Singleton)`,
    explanation: "DI lifetimes control when new instances are created — `Singleton` creates one instance shared across the application; `Scoped` creates one per logical scope (HTTP request); `Transient` creates a new instance every time.",
  },
  {
    id: "cs-0521-b2-await-foreach-async",
    language: "csharp",
    title: "ConfigureAwait for library code",
    tag: "caveats",
    code: `using System.Net.Http;
using System.Threading.Tasks;

// Library code: use ConfigureAwait(false) to avoid deadlocks
// in synchronization-context-bound callers (WinForms, ASP.NET Classic)
async Task<string> LibraryFetchAsync(string url)
{
    using var client = new HttpClient();
    string content = await client.GetStringAsync(url)
        .ConfigureAwait(false);    // don't capture sync context
    return content[..Math.Min(50, content.Length)];
}

// Application code: omit ConfigureAwait (context is useful)
async Task AppCodeAsync()
{
    string data = await LibraryFetchAsync("https://example.com");
    Console.WriteLine(data.Length);
}

await AppCodeAsync();`,
    explanation: "`ConfigureAwait(false)` tells `await` not to resume on the original synchronization context — in libraries this prevents deadlocks when callers block on async code using `.Result` or `.Wait()` inside a context that has a single-threaded scheduler.",
  },
  {
    id: "cs-0521-b2-abstract-factory",
    language: "csharp",
    title: "abstract factory pattern",
    tag: "classes",
    code: `interface IButton  { void Render(); }
interface IDialog  { void Show(); }

// Abstract factory
interface IUIFactory
{
    IButton CreateButton();
    IDialog CreateDialog();
}

// Concrete factories
class WindowsFactory : IUIFactory
{
    public IButton CreateButton() => new WindowsButton();
    public IDialog CreateDialog() => new WindowsDialog();
}

class MacFactory : IUIFactory
{
    public IButton CreateButton() => new MacButton();
    public IDialog CreateDialog() => new MacDialog();
}

class WindowsButton : IButton { public void Render() => Console.WriteLine("Win button"); }
class WindowsDialog : IDialog { public void Show()   => Console.WriteLine("Win dialog"); }
class MacButton    : IButton  { public void Render() => Console.WriteLine("Mac button"); }
class MacDialog    : IDialog  { public void Show()   => Console.WriteLine("Mac dialog"); }

IUIFactory factory = OperatingSystem.IsWindows()
    ? new WindowsFactory()
    : new MacFactory();

factory.CreateButton().Render();
factory.CreateDialog().Show();`,
    explanation: "The abstract factory provides an interface for creating families of related objects — swap the factory to change the entire family (all Windows vs all Mac widgets) without touching client code.",
  },
  {
    id: "cs-0521-b2-string-pool-intern",
    language: "csharp",
    title: "string interning with string.Intern",
    tag: "caveats",
    code: `// Compile-time string literals are automatically interned
string a = "hello";
string b = "hello";
Console.WriteLine(object.ReferenceEquals(a, b));   // True (interned)

// Runtime strings are NOT interned by default
string c = new string(new[] { 'h', 'e', 'l', 'l', 'o' });
Console.WriteLine(object.ReferenceEquals(a, c));   // False

// Explicit interning
string d = string.Intern(c);
Console.WriteLine(object.ReferenceEquals(a, d));   // True

// IsInterned checks without adding to pool
string? interned = string.IsInterned("hello");
Console.WriteLine(interned != null);   // True`,
    explanation: "`string.Intern` adds a string to (or retrieves it from) the intern pool, enabling reference equality comparisons — useful for high-frequency string keys like column names, but the pool is never GC'd so use sparingly.",
  },
  {
    id: "cs-0521-b2-span-string-comparison",
    language: "csharp",
    title: "MemoryExtensions for Span string operations",
    tag: "snippet",
    code: `using System;
using System.MemoryExtensions;  // or just System

ReadOnlySpan<char> text = "Hello, World!".AsSpan();

// IndexOf on Span — no allocation
int comma = text.IndexOf(',');
Console.WriteLine(comma);   // 5

// StartsWith / EndsWith without allocation
Console.WriteLine(text.StartsWith("Hello", StringComparison.Ordinal));  // True
Console.WriteLine(text.EndsWith("!", StringComparison.Ordinal));        // True

// Trim
ReadOnlySpan<char> padded = "   trimmed   ".AsSpan();
ReadOnlySpan<char> trimmed = padded.Trim();
Console.WriteLine(trimmed.ToString());   // "trimmed"

// Equals comparison
ReadOnlySpan<char> word = "world".AsSpan();
Console.WriteLine(text[7..12].Equals(word, StringComparison.OrdinalIgnoreCase));  // True`,
    explanation: "`MemoryExtensions` provides `StartsWith`, `EndsWith`, `IndexOf`, `Trim`, and `Equals` on `ReadOnlySpan<char>` — all operate without allocating substrings, enabling allocation-free string parsing in tight loops.",
  },
  {
    id: "cs-0521-b2-pattern-relational",
    language: "csharp",
    title: "relational patterns in C# 9+",
    tag: "snippet",
    code: `static string Classify(int n) => n switch
{
    < 0    => "negative",
    0      => "zero",
    > 0 and <= 10  => "small positive",
    > 10 and <= 100 => "medium positive",
    _      => "large positive",
};

Console.WriteLine(Classify(-5));   // negative
Console.WriteLine(Classify(0));    // zero
Console.WriteLine(Classify(7));    // small positive
Console.WriteLine(Classify(50));   // medium positive
Console.WriteLine(Classify(999));  // large positive

// Also works with not pattern
bool isSpecial(char c) => c is not ('a' or 'e' or 'i' or 'o' or 'u');`,
    explanation: "Relational patterns (`< n`, `> n`, `<= n`, `>= n`) and logical combinators (`and`, `or`, `not`) let you express numeric ranges directly in switch expressions — no need for a guard clause.",
  },
  {
    id: "cs-0521-b2-task-continuation",
    language: "csharp",
    title: "Task.ContinueWith vs async/await",
    tag: "caveats",
    code: `using System.Threading.Tasks;

// ContinueWith: old API, tricky error handling
Task<int> task = Task.Run(() => 42);
Task<string> continued = task.ContinueWith(t =>
    t.IsFaulted
        ? "error"
        : $"result: {t.Result}");
Console.WriteLine(await continued);   // result: 42

// async/await: cleaner, natural exception propagation
async Task<string> Modern()
{
    int result = await Task.Run(() => 42);
    return $"result: {result}";   // exceptions just propagate
}
Console.WriteLine(await Modern());   // result: 42`,
    explanation: "`ContinueWith` is the low-level callback API — you must check `t.IsFaulted` manually and faults don't propagate automatically; `async/await` provides the same sequencing with natural exception flow and is almost always preferable.",
  },
  {
    id: "cs-0521-b2-struct-readonly-method",
    language: "csharp",
    title: "readonly methods on mutable structs",
    tag: "types",
    code: `struct Counter
{
    private int _value;

    public void Increment() => _value++;

    // readonly: guarantees this method doesn't mutate the struct
    // prevents defensive copies when accessed through readonly ref
    public readonly int Value => _value;
    public readonly override string ToString() => $"Counter({_value})";
}

Counter c = new Counter();
c.Increment();
c.Increment();
Console.WriteLine(c);         // Counter(2)
Console.WriteLine(c.Value);   // 2

// Without readonly on Value/ToString, calling them on a
// readonly ref forces a defensive copy of the struct`,
    explanation: "`readonly` on a struct method guarantees it doesn't modify `this` — the compiler enforces this and can avoid defensive copies when the method is called through `in` parameters or `readonly` fields, improving performance.",
  },
  {
    id: "cs-0521-b2-linq-first-single",
    language: "csharp",
    title: "First, Single, FirstOrDefault: choosing the right one",
    tag: "snippet",
    code: `using System.Linq;

int[] nums = { 3, 1, 4, 1, 5, 9 };

// First: returns first match, throws if none
Console.WriteLine(nums.First(n => n > 4));    // 5

// FirstOrDefault: returns default if none
Console.WriteLine(nums.FirstOrDefault(n => n > 100));  // 0

// Single: returns the ONE match, throws if 0 or 2+
Console.WriteLine(nums.Single(n => n == 9));  // 9
try { nums.Single(n => n == 1); }  // two matches!
catch (Exception e) { Console.WriteLine(e.GetType().Name); }
// InvalidOperationException

// SingleOrDefault: default if none, throws if 2+
int? val = nums.SingleOrDefault(n => n > 100);
Console.WriteLine(val);   // 0`,
    explanation: "`First` gets the first match; `Single` asserts exactly one match exists — use `Single` when duplicate matches indicate a data integrity problem; the `OrDefault` variants return the type's default instead of throwing for empty sequences.",
  },
  {
    id: "cs-0521-b2-generic-variance-action",
    language: "csharp",
    title: "Action<T> contravariance in practice",
    tag: "types",
    code: `// Action<T> is contravariant (in T)
// A handler for objects can be used as a handler for strings
Action<object> printObject = o => Console.WriteLine(o);
Action<string> printString = printObject;   // contravariant assignment

printString("hello");   // hello

// Practical: event handler compatibility
class Button
{
    public event Action<string>? Clicked;
    public void Click() => Clicked?.Invoke("left-click");
}

// A handler accepting object can subscribe to Action<string>
var btn = new Button();
btn.Clicked += printObject;   // works — string IS-A object
btn.Click();                   // hello (prints "left-click")`,
    explanation: "Contravariance (`in T`) means `Action<Base>` is assignable to `Action<Derived>` — safe because a handler that accepts any object certainly handles strings; the direction is reversed from covariance.",
  },
  {
    id: "cs-0521-b2-record-value-semantics",
    language: "csharp",
    title: "record value equality vs reference equality",
    tag: "classes",
    code: `record Address(string Street, string City, string Zip);
class AddressClass { public string Street = ""; public string City = ""; }

var r1 = new Address("123 Main", "Springfield", "12345");
var r2 = new Address("123 Main", "Springfield", "12345");
var c1 = new AddressClass { Street = "123 Main", City = "Springfield" };
var c2 = new AddressClass { Street = "123 Main", City = "Springfield" };

// Record: value equality
Console.WriteLine(r1 == r2);   // True
Console.WriteLine(r1.Equals(r2));   // True

// Class: reference equality (by default)
Console.WriteLine(c1 == c2);   // False
Console.WriteLine(c1.Equals(c2));  // False

// Records in sets/dicts use value equality
var set = new HashSet<Address> { r1, r2 };
Console.WriteLine(set.Count);   // 1`,
    explanation: "Records auto-generate structural equality — two records with the same property values are equal and have the same hash code; classes use reference equality by default (only equal if same object in memory).",
  },
  {
    id: "cs-0521-b2-channel-bounded",
    language: "csharp",
    title: "Channel with backpressure for rate limiting",
    tag: "structures",
    code: `using System.Threading.Channels;
using System.Threading.Tasks;

// BoundedChannelFullMode.Wait: producer awaits if channel is full
var options = new BoundedChannelOptions(capacity: 3)
{
    FullMode = BoundedChannelFullMode.Wait
};
var channel = Channel.CreateBounded<string>(options);

var producer = Task.Run(async () =>
{
    for (int i = 1; i <= 5; i++)
    {
        await channel.Writer.WriteAsync($"item-{i}");
        Console.WriteLine($"produced item-{i}");
    }
    channel.Writer.Complete();
});

await Task.Delay(100);  // let producer run ahead
var consumer = Task.Run(async () =>
{
    await foreach (var item in channel.Reader.ReadAllAsync())
        Console.WriteLine($"consumed {item}");
});

await Task.WhenAll(producer, consumer);`,
    explanation: "`BoundedChannelFullMode.Wait` makes the producer `await` when the channel is at capacity, providing natural backpressure — `DropOldest`, `DropNewest`, or `DropWrite` modes handle full channels by discarding items instead.",
  },
  {
    id: "cs-0521-b2-observer-pattern",
    language: "csharp",
    title: "IObservable<T> and IObserver<T>",
    tag: "classes",
    code: `using System;
using System.Collections.Generic;

class NumberSource : IObservable<int>
{
    private readonly List<IObserver<int>> _observers = new();

    public IDisposable Subscribe(IObserver<int> observer)
    {
        _observers.Add(observer);
        return new Unsubscriber(_observers, observer);
    }

    public void Emit(int value)
    {
        foreach (var o in _observers) o.OnNext(value);
    }

    class Unsubscriber(List<IObserver<int>> obs, IObserver<int> o) : IDisposable
    {
        public void Dispose() => obs.Remove(o);
    }
}

class Printer : IObserver<int>
{
    public void OnNext(int v) => Console.WriteLine($"got {v}");
    public void OnError(Exception e) => Console.WriteLine($"err {e.Message}");
    public void OnCompleted() => Console.WriteLine("done");
}

var source = new NumberSource();
using var sub = source.Subscribe(new Printer());
source.Emit(1); source.Emit(2);   // got 1 / got 2`,
    explanation: "`IObservable<T>`/`IObserver<T>` is .NET's push-based sequence abstraction — the observer pattern built into the framework; Reactive Extensions (Rx.NET) builds rich operators on top of these interfaces.",
  },
  {
    id: "cs-0521-b2-perf-benchmark",
    language: "csharp",
    title: "BenchmarkDotNet basics for micro-benchmarking",
    tag: "snippet",
    code: `using BenchmarkDotNet.Attributes;
using BenchmarkDotNet.Running;

[MemoryDiagnoser]
public class StringBench
{
    private const int N = 1000;
    private readonly string[] _words =
        Enumerable.Range(0, N).Select(i => $"word{i}").ToArray();

    [Benchmark(Baseline = true)]
    public string ConcatPlus()
    {
        string s = "";
        foreach (var w in _words) s += w;
        return s;
    }

    [Benchmark]
    public string JoinAll() => string.Join("", _words);
}

// Run with: BenchmarkRunner.Run<StringBench>();
// Produces: Mean, StdDev, Allocated columns`,
    explanation: "BenchmarkDotNet handles JIT warmup, multiple runs, and statistics automatically — `[MemoryDiagnoser]` adds allocation reporting; `Baseline=true` enables ratio comparison; never measure performance with `Stopwatch` in a loop.",
  },
  {
    id: "cs-0521-b2-attribute-custom",
    language: "csharp",
    title: "custom attributes and reflection",
    tag: "classes",
    code: `using System;
using System.Reflection;

[AttributeUsage(AttributeTargets.Property, AllowMultiple = false)]
class ValidateRangeAttribute(double min, double max) : Attribute
{
    public double Min { get; } = min;
    public double Max { get; } = max;
}

class Settings
{
    [ValidateRange(0, 100)]
    public double Volume { get; set; } = 50;

    [ValidateRange(1, 65535)]
    public int Port { get; set; } = 8080;
}

// Runtime validation via reflection
void Validate(object obj)
{
    foreach (var prop in obj.GetType().GetProperties())
    {
        var attr = prop.GetCustomAttribute<ValidateRangeAttribute>();
        if (attr is null) continue;
        double val = Convert.ToDouble(prop.GetValue(obj));
        if (val < attr.Min || val > attr.Max)
            throw new ArgumentOutOfRangeException(prop.Name, val, "out of range");
    }
}

var s = new Settings { Volume = 110 };
try { Validate(s); } catch (Exception e) { Console.WriteLine(e.Message); }`,
    explanation: "Custom attributes annotate types and members with metadata retrievable at runtime via reflection — `GetCustomAttribute<T>()` fetches the attribute instance; this pattern powers validation frameworks, ORMs, and serializers.",
  },
  {
    id: "cs-0521-b2-span-sequence-equal",
    language: "csharp",
    title: "Span.SequenceEqual for fast buffer comparison",
    tag: "snippet",
    code: `using System;

byte[] key     = { 0x01, 0x02, 0x03, 0x04 };
byte[] attempt = { 0x01, 0x02, 0x03, 0x04 };
byte[] wrong   = { 0x01, 0x02, 0x03, 0xFF };

// SequenceEqual compares element by element
ReadOnlySpan<byte> k = key;
Console.WriteLine(k.SequenceEqual(attempt));  // True
Console.WriteLine(k.SequenceEqual(wrong));    // False

// Constant-time comparison for security-sensitive data
// (SequenceEqual is NOT constant time — use CryptographicOperations.FixedTimeEquals)
using System.Security.Cryptography;
bool safe = CryptographicOperations.FixedTimeEquals(k, attempt);
Console.WriteLine(safe);   // True`,
    explanation: "`Span.SequenceEqual` compares two spans element-by-element and short-circuits on the first mismatch — for HMAC/password comparison use `CryptographicOperations.FixedTimeEquals` which is constant-time regardless of where values differ.",
  },
  {
    id: "cs-0521-b2-static-interface-members",
    language: "csharp",
    title: "static abstract members in interfaces (C# 11+)",
    tag: "types",
    code: `interface IFactory<T> where T : IFactory<T>
{
    static abstract T Create();        // must be implemented by T
    static abstract string TypeName { get; }
}

class Widget : IFactory<Widget>
{
    public static Widget Create() => new Widget();
    public static string TypeName => "Widget";
}

// Generic factory method — works for any IFactory<T>
T MakeOne<T>() where T : IFactory<T> => T.Create();

var w = MakeOne<Widget>();
Console.WriteLine(Widget.TypeName);   // Widget

// Enables generic math (INumber<T>) and operator overloading in generics
// T Add<T>(T a, T b) where T : INumber<T> => a + b;`,
    explanation: "Static abstract interface members (C# 11) allow interfaces to require static methods and properties from implementors — they enable the Generic Math pattern (`INumber<T>`, `IAdditionOperators<T>`) by letting you call static methods on generic types.",
  },
  {
    id: "cs-0521-b2-value-based-dispatch",
    language: "csharp",
    title: "dictionary-based dispatch vs switch",
    tag: "snippet",
    code: `using System.Collections.Generic;

// Switch: evaluated at call time — good for small, fixed sets
string SwitchRoute(string method) => method switch
{
    "GET"    => "read",
    "POST"   => "create",
    "PUT"    => "update",
    "DELETE" => "delete",
    _        => "unknown",
};

// Dictionary: O(1) lookup, extensible at runtime
var routes = new Dictionary<string, Func<string, string>>
{
    ["GET"]    = path => $"reading {path}",
    ["POST"]   = path => $"creating at {path}",
    ["DELETE"] = path => $"deleting {path}",
};

string Handle(string method, string path) =>
    routes.TryGetValue(method, out var handler)
        ? handler(path)
        : $"method not allowed: {method}";

Console.WriteLine(Handle("GET", "/users"));   // reading /users`,
    explanation: "A `Dictionary<string, Func<...>>` dispatch table is extensible at runtime (you can add routes after startup) — `switch` is better for exhaustive, compile-time-known cases where the compiler can check completeness.",
  },
  {
    id: "cs-0521-b2-iequatable",
    language: "csharp",
    title: "IEquatable<T> for high-performance equality",
    tag: "classes",
    code: `using System;
using System.Collections.Generic;

struct Point : IEquatable<Point>
{
    public int X { get; }
    public int Y { get; }
    public Point(int x, int y) => (X, Y) = (x, y);

    // IEquatable<T>: avoids boxing when T is a value type
    public bool Equals(Point other) => X == other.X && Y == other.Y;
    public override bool Equals(object? obj) =>
        obj is Point p && Equals(p);
    public override int GetHashCode() => HashCode.Combine(X, Y);

    public static bool operator ==(Point a, Point b) => a.Equals(b);
    public static bool operator !=(Point a, Point b) => !a.Equals(b);
}

var set = new HashSet<Point> { new(1, 2), new(3, 4), new(1, 2) };
Console.WriteLine(set.Count);   // 2`,
    explanation: "Implementing `IEquatable<T>` provides a typed `Equals(T)` overload that avoids boxing for value types — `HashSet<Point>` and `Dictionary<Point, V>` use this for efficient equality without allocating a boxed object.",
  },
  {
    id: "cs-0521-b2-unsafe-sizeof",
    language: "csharp",
    title: "sizeof and Unsafe.SizeOf for struct size inspection",
    tag: "types",
    code: `using System;
using System.Runtime.CompilerServices;

struct Small { public byte A; public byte B; }

[System.Runtime.InteropServices.StructLayout(System.Runtime.InteropServices.LayoutKind.Explicit)]
struct Explicit
{
    [System.Runtime.InteropServices.FieldOffset(0)] public int Value;
    [System.Runtime.InteropServices.FieldOffset(0)] public byte Byte0;
    [System.Runtime.InteropServices.FieldOffset(1)] public byte Byte1;
}

// unsafe sizeof: works for unmanaged types
unsafe { Console.WriteLine(sizeof(Small));    }  // 2
unsafe { Console.WriteLine(sizeof(int));      }  // 4

// Unsafe.SizeOf: works for any type including managed
Console.WriteLine(Unsafe.SizeOf<Small>());     // 2
Console.WriteLine(Unsafe.SizeOf<string>());    // 8 (pointer size)`,
    explanation: "`sizeof(T)` in unsafe context gives the unmanaged size; `Unsafe.SizeOf<T>()` works for any type and is safe — the difference matters for reference types where `sizeof` would fail but `Unsafe.SizeOf` returns the reference size (pointer width).",
  },
  {
    id: "cs-0521-b2-interceptor-source-gen",
    language: "csharp",
    title: "interceptors for compile-time method replacement",
    tag: "types",
    code: `// Interceptors (C# 12 / experimental) redirect calls at compile time.
// Requires: <InterceptorsPreviewNamespaces>YourNS</InterceptorsPreviewNamespaces>
// and compiler feature flag.

// The [InterceptsLocation] attribute identifies the exact call site to replace.
// Source generators (like EF's) use this to replace LINQ calls with optimized
// SQL-aware versions:

// Original LINQ call in user code:
// var result = ctx.Users.Where(u => u.Age > 18).ToList();

// Generated interceptor replaces it with a compiled SQL query at that
// exact file:line:col — no reflection, no expression-tree parsing at runtime.

// This pattern enables zero-overhead database queries that look like
// ordinary LINQ but are compiled to raw SQL by a source generator.`,
    explanation: "Interceptors let source generators replace specific method call sites with generated alternatives — EF Core and Microsoft.Extensions.Http use this to compile LINQ queries and HttpClient calls to optimal code at build time.",
  },
  {
    id: "cs-0521-b2-linq-plinq",
    language: "csharp",
    title: "PLINQ: parallel LINQ for CPU-bound queries",
    tag: "snippet",
    code: `using System.Linq;

int[] data = Enumerable.Range(1, 10_000_000).ToArray();

// Sequential
long sumSeq = data.Where(n => n % 2 == 0)
                  .Select(n => (long)n * n)
                  .Sum();

// Parallel: AsParallel() distributes work across CPU cores
long sumPar = data.AsParallel()
                  .Where(n => n % 2 == 0)
                  .Select(n => (long)n * n)
                  .Sum();

Console.WriteLine(sumSeq == sumPar);   // True

// WithDegreeOfParallelism to cap core usage
long sumCapped = data.AsParallel()
                     .WithDegreeOfParallelism(4)
                     .Sum(n => (long)n);`,
    explanation: "`AsParallel()` converts a sequential query to a parallel one — PLINQ splits the source, runs predicates/projections in parallel, and merges results; it's effective for CPU-bound work but has overhead for small or I/O-bound queries.",
  },
  {
    id: "cs-0521-b2-dispose-async",
    language: "csharp",
    title: "IAsyncDisposable and await using",
    tag: "snippet",
    code: `using System;
using System.Threading.Tasks;

class AsyncResource : IAsyncDisposable
{
    public AsyncResource() => Console.WriteLine("opened");

    public async Task UseAsync()
    {
        await Task.Delay(10);
        Console.WriteLine("used");
    }

    public async ValueTask DisposeAsync()
    {
        await Task.Delay(1);   // e.g., flush buffer asynchronously
        Console.WriteLine("disposed");
    }
}

// await using calls DisposeAsync instead of Dispose
await using (var res = new AsyncResource())
{
    await res.UseAsync();
}
// opened / used / disposed

// Shorter form (C# 8+)
await using var res2 = new AsyncResource();
await res2.UseAsync();`,
    explanation: "`IAsyncDisposable.DisposeAsync` lets cleanup code do async I/O (flush buffers, close network connections gracefully) — `await using` calls `DisposeAsync` and awaits it, unlike `using` which calls synchronous `Dispose`.",
  },
  {
    id: "cs-0521-b2-unsafe-interop",
    language: "csharp",
    title: "P/Invoke for calling native library functions",
    tag: "types",
    code: `using System.Runtime.InteropServices;

class NativeTime
{
    // Import a C function from the OS
    [DllImport("libc", EntryPoint = "clock")]
    private static extern long GetClock();

    [DllImport("libc", EntryPoint = "localtime_r",
                CallingConvention = CallingConvention.Cdecl)]
    private static extern IntPtr LocalTimeR(ref long timer, IntPtr result);

    public static long CurrentClock() => GetClock();
}

// Simpler with LibraryImport (C# 11+ source-generated, AOT-compatible)
static partial class Lib
{
    [LibraryImport("libc", EntryPoint = "getpid")]
    public static partial int GetPid();
}

Console.WriteLine(Lib.GetPid());          // current process ID
Console.WriteLine(NativeTime.CurrentClock()); // CPU clocks`,
    explanation: "`[DllImport]` generates the P/Invoke glue at runtime; `[LibraryImport]` (C# 11) generates it via source generator — AOT-compatible and faster; `CallingConvention.Cdecl` must match the C function's calling convention.",
  },
  {
    id: "cs-0521-b2-guid-newid",
    language: "csharp",
    title: "Guid generation and formatting",
    tag: "snippet",
    code: `using System;

Guid id = Guid.NewGuid();

// Standard format strings
Console.WriteLine(id);           // 3f2504e0-4f89-11d3-9a0c-0305e82c3301
Console.WriteLine(id.ToString("N")); // 3f2504e04f8911d39a0c0305e82c3301
Console.WriteLine(id.ToString("B")); // {3f2504e0-4f89-11d3-9a0c-0305e82c3301}
Console.WriteLine(id.ToString("X")); // {0x3f2504e0, ...}

// Parse back
Guid parsed = Guid.Parse("3f2504e0-4f89-11d3-9a0c-0305e82c3301");
Console.WriteLine(id == parsed);  // True

// TryParse for user input
if (!Guid.TryParse("not-a-guid", out _))
    Console.WriteLine("invalid");

// As bytes
byte[] bytes = id.ToByteArray();
Console.WriteLine(bytes.Length);  // 16`,
    explanation: "`Guid.NewGuid()` generates a cryptographically random version-4 UUID; the format string `N` removes hyphens (useful for compact storage); `ToByteArray()` returns the 16-byte binary representation for database storage.",
  },
  {
    id: "cs-0521-b2-switch-tuple",
    language: "csharp",
    title: "switch expression on tuple patterns",
    tag: "snippet",
    code: `string FizzBuzz(int n) => (n % 3, n % 5) switch
{
    (0, 0) => "FizzBuzz",
    (0, _) => "Fizz",
    (_, 0) => "Buzz",
    _      => n.ToString(),
};

for (int i = 1; i <= 15; i++)
    Console.Write(FizzBuzz(i) + " ");
// 1 2 Fizz 4 Buzz Fizz 7 8 Fizz Buzz 11 Fizz 13 14 FizzBuzz

// Multi-value state machine
string Transition(string state, string input) => (state, input) switch
{
    ("idle",    "start")   => "running",
    ("running", "pause")   => "paused",
    ("paused",  "resume")  => "running",
    ("running", "stop")    => "idle",
    _                      => state,   // stay in current state
};
Console.WriteLine(Transition("idle", "start"));   // running`,
    explanation: "Tuple patterns in switch expressions destructure a value tuple — each arm matches multiple values simultaneously; this is the idiomatic way to express state machines and multi-input dispatch tables.",
  },
  {
    id: "cs-0521-b2-numeric-parse-span",
    language: "csharp",
    title: "ISpanParsable<T> for allocation-free number parsing",
    tag: "types",
    code: `using System;

// int, double, decimal all implement ISpanParsable<T>
ReadOnlySpan<char> data = "42,3.14,99.9".AsSpan();

int  comma1 = data.IndexOf(',');
var intPart  = data[..comma1];
data = data[(comma1 + 1)..];

int  comma2 = data.IndexOf(',');
var dblPart  = data[..comma2];
var decPart  = data[(comma2 + 1)..];

int    i = int.Parse(intPart);
double d = double.Parse(dblPart);
decimal m = decimal.Parse(decPart);

Console.WriteLine(i);   // 42
Console.WriteLine(d);   // 3.14
Console.WriteLine(m);   // 99.9`,
    explanation: "`int.Parse(ReadOnlySpan<char>)` parses directly from a span without allocating a `string` — all primitive numeric types overload `Parse` and `TryParse` to accept `ReadOnlySpan<char>`, enabling zero-allocation CSV/protocol parsing.",
  },
  {
    id: "cs-0521-b2-record-with-validation",
    language: "csharp",
    title: "init-only property with validation",
    tag: "classes",
    code: `class Email
{
    private readonly string _value;

    public string Value
    {
        get => _value;
        init
        {
            if (!value.Contains('@'))
                throw new ArgumentException($"Invalid email: {value}");
            _value = value;
        }
    }

    public Email() => _value = "";   // required for init-only
}

var e1 = new Email { Value = "alice@example.com" };
Console.WriteLine(e1.Value);   // alice@example.com

try
{
    var e2 = new Email { Value = "not-an-email" };
}
catch (ArgumentException ex)
{
    Console.WriteLine(ex.Message);   // Invalid email: not-an-email
}`,
    explanation: "`init`-only property setters run only during object initialization — they allow validation logic similar to a constructor, preventing invalid state at creation time while still supporting object initializer syntax.",
  },
  {
    id: "cs-0521-b2-collections-generic-add",
    language: "csharp",
    title: "List<T> vs LinkedList<T> vs Queue<T> vs Stack<T>",
    tag: "families",
    code: `using System.Collections.Generic;

// List<T>: random access O(1), insert/delete middle O(n)
var list = new List<int> { 1, 2, 3 };
list.Insert(1, 99);   // O(n)
Console.WriteLine(list[2]);   // 3

// LinkedList<T>: O(1) insert/delete anywhere given a node
var ll = new LinkedList<int>(new[] { 1, 2, 3 });
var node = ll.Find(2)!;
ll.AddAfter(node, 99);   // O(1)

// Queue<T>: FIFO — Enqueue/Dequeue O(1)
var q = new Queue<int>();
q.Enqueue(1); q.Enqueue(2);
Console.WriteLine(q.Dequeue());   // 1

// Stack<T>: LIFO — Push/Pop O(1)
var s = new Stack<int>();
s.Push(1); s.Push(2);
Console.WriteLine(s.Pop());   // 2`,
    explanation: "`List<T>` is best for indexed access and infrequent mid-list changes; `LinkedList<T>` for frequent insertion/removal at arbitrary positions (given a node); `Queue<T>` and `Stack<T>` for FIFO and LIFO access respectively.",
  },
  {
    id: "cs-0521-b2-semaphore-async",
    language: "csharp",
    title: "SemaphoreSlim for async rate limiting",
    tag: "snippet",
    code: `using System.Threading;
using System.Threading.Tasks;

// Allow at most 3 concurrent operations
var semaphore = new SemaphoreSlim(initialCount: 3, maxCount: 3);

async Task FetchAsync(int id)
{
    await semaphore.WaitAsync();   // acquire (async — no thread block)
    try
    {
        Console.WriteLine($"  start {id} (slots: {3 - semaphore.CurrentCount})");
        await Task.Delay(100);     // simulate I/O
        Console.WriteLine($"  done  {id}");
    }
    finally
    {
        semaphore.Release();       // always release
    }
}

var tasks = Enumerable.Range(1, 8).Select(FetchAsync);
await Task.WhenAll(tasks);`,
    explanation: "`SemaphoreSlim.WaitAsync()` is the async-compatible semaphore — it doesn't block a thread while waiting for a slot; use it to cap concurrency for rate-limited APIs or connection pools without blocking the thread pool.",
  },
  {
    id: "cs-0521-b2-generic-math-sum",
    language: "csharp",
    title: "generic sum with IAdditionOperators",
    tag: "types",
    code: `using System.Numerics;
using System.Linq;

// Works for any type that supports + and has a zero
T Sum<T>(IEnumerable<T> values) where T : IAdditionOperators<T, T, T>, IAdditiveIdentity<T, T>
{
    T result = T.AdditiveIdentity;   // == 0 for numbers
    foreach (var v in values)
        result += v;
    return result;
}

Console.WriteLine(Sum(new[] { 1, 2, 3, 4 }));          // 10
Console.WriteLine(Sum(new[] { 1.5, 2.5, 3.0 }));        // 7
Console.WriteLine(Sum(new[] { 1m, 2m, 3m }));           // 6

// Interfaces from System.Numerics:
// IAdditionOperators<T,T,T>, IMultiplyOperators<T,T,T>,
// IAdditiveIdentity<T,T>, IMultiplicativeIdentity<T,T>`,
    explanation: "`IAdditionOperators<T,T,T>` abstracts the `+` operator; `IAdditiveIdentity` provides the zero element (`AdditiveIdentity`) — generic math interfaces let you write algorithms that work for `int`, `double`, `decimal`, and custom number types.",
  },
  {
    id: "cs-0521-b2-exception-type-hierarchy",
    language: "csharp",
    title: "exception hierarchy: catch most specific first",
    tag: "caveats",
    code: `using System;
using System.IO;

try
{
    throw new FileNotFoundException("file.txt not found");
}
catch (FileNotFoundException e)   // most specific first
{
    Console.WriteLine($"File missing: {e.Message}");
}
catch (IOException e)             // broader
{
    Console.WriteLine($"I/O error: {e.Message}");
}
catch (Exception e)               // catch-all last
{
    Console.WriteLine($"Unexpected: {e.Message}");
}
finally
{
    Console.WriteLine("always runs");
}`,
    explanation: "C# evaluates `catch` clauses top-to-bottom and selects the first matching type — place more specific exceptions before base types; reversing the order makes the specific handler unreachable and the compiler warns about it.",
  },
  {
    id: "cs-0521-b2-unsafe-nativeaot",
    language: "csharp",
    title: "NativeAOT publishing for self-contained native binaries",
    tag: "types",
    code: `// NativeAOT compiles C# directly to a native binary — no JIT, no runtime.
// Enable in .csproj:
// <PublishAot>true</PublishAot>
// <TrimmerRootDescriptor>...</TrimmerRootDescriptor>

// Restrictions:
// - No dynamic code generation (Reflection.Emit, dynamic types)
// - Reflection requires explicit root descriptors or [DynamicallyAccessedMembers]
// - Source generators preferred over runtime reflection

using System.Runtime.CompilerServices;

// This attribute tells the AOT compiler which members to keep
[System.Diagnostics.CodeAnalysis.DynamicallyAccessedMembers(
    System.Diagnostics.CodeAnalysis.DynamicallyAccessedMemberTypes.PublicProperties)]
static void PrintProperties(Type t)
{
    foreach (var p in t.GetProperties())
        Console.WriteLine(p.Name);
}

PrintProperties(typeof(System.DateTime));`,
    explanation: "NativeAOT produces a self-contained native binary — startup is nearly instant and memory usage is lower because there's no JIT; the trade-off is that dynamic reflection requires explicit annotations to tell the linker what to preserve.",
  },
  {
    id: "cs-0521-b2-builder-pattern",
    language: "csharp",
    title: "fluent builder pattern",
    tag: "classes",
    code: `class QueryBuilder
{
    private string _table = "";
    private readonly List<string> _conditions = new();
    private int? _limit;

    public QueryBuilder From(string table)
    {
        _table = table;
        return this;
    }

    public QueryBuilder Where(string condition)
    {
        _conditions.Add(condition);
        return this;
    }

    public QueryBuilder Limit(int n)
    {
        _limit = n;
        return this;
    }

    public string Build()
    {
        var where  = _conditions.Count > 0
            ? " WHERE " + string.Join(" AND ", _conditions) : "";
        var limit  = _limit.HasValue ? $" LIMIT {_limit}" : "";
        return $"SELECT * FROM {_table}{where}{limit}";
    }
}

var query = new QueryBuilder()
    .From("users")
    .Where("age > 18")
    .Where("active = 1")
    .Limit(100)
    .Build();
Console.WriteLine(query);
// SELECT * FROM users WHERE age > 18 AND active = 1 LIMIT 100`,
    explanation: "The fluent builder pattern returns `this` from each method, enabling method chaining — it separates object construction from representation and prevents partially initialized objects from being used.",
  },
  {
    id: "cs-0521-b2-thread-local",
    language: "csharp",
    title: "ThreadLocal<T> for per-thread state",
    tag: "snippet",
    code: `using System.Threading;
using System.Threading.Tasks;

// Each thread gets its own instance — no sharing, no locking
var rng = new ThreadLocal<Random>(() => new Random());

var results = new int[4];
Parallel.For(0, 4, i =>
{
    // Safe: each thread has its own Random
    results[i] = rng.Value!.Next(100);
    Console.WriteLine($"Thread {Thread.CurrentThread.ManagedThreadId}: {results[i]}");
});

Console.WriteLine(string.Join(", ", results));`,
    explanation: "`ThreadLocal<T>` provides a separate instance per thread initialized lazily on first access — it's the right solution for types that are expensive to create but not thread-safe (like `Random` before .NET 6's `Random.Shared`).",
  },
  {
    id: "cs-0521-b2-string-format-composite",
    language: "csharp",
    title: "composite formatting: String.Format and alignment",
    tag: "snippet",
    code: `// Positional: {index[,alignment][:format]}
string row1 = string.Format("{0,-15} {1,8} {2,10:P1}",
    "Widget A", 1234, 0.7253);
string row2 = string.Format("{0,-15} {1,8} {2,10:P1}",
    "Widget B", 89,   0.1200);
string header = string.Format("{0,-15} {1,8} {2,10}",
    "Product", "Units", "Share");

Console.WriteLine(header);
Console.WriteLine(new string('-', 34));
Console.WriteLine(row1);
Console.WriteLine(row2);
// Product          Units      Share
// ----------------------------------
// Widget A          1234      72.5%
// Widget B            89      12.0%`,
    explanation: "`{n,width}` right-aligns in `width` chars (negative for left-align); combining alignment with format specifiers like `P1` (percentage, 1 decimal) produces formatted tables without manual padding calculations.",
  },
  {
    id: "cs-0521-b2-span-sorting",
    language: "csharp",
    title: "MemoryExtensions.Sort for in-place Span sorting",
    tag: "snippet",
    code: `using System;
using System.MemoryExtensions;

int[] data = { 5, 1, 4, 2, 8, 3 };

// Sort in place — no allocation
Span<int> span = data;
span.Sort();
Console.WriteLine(string.Join(", ", data));   // 1, 2, 3, 4, 5, 8

// Sort with comparer
Span<string> words = new[] { "banana", "Apple", "cherry" };
words.Sort(StringComparer.OrdinalIgnoreCase);
Console.WriteLine(string.Join(", ", words.ToArray()));   // Apple, banana, cherry

// Sort two parallel spans together (keys + values)
Span<int> keys   = new[] { 3, 1, 2 };
Span<char> vals  = new[] { 'c', 'a', 'b' };
MemoryExtensions.Sort(keys, vals);
Console.WriteLine(string.Join("", vals.ToArray()));   // abc`,
    explanation: "`MemoryExtensions.Sort` sorts a `Span<T>` in place — the two-span overload keeps a parallel \"values\" span in sync with the sorted \"keys\" span, useful for sorting associated arrays without zipping them first.",
  },
  {
    id: "cs-0521-b2-pipe-operator-chaining",
    language: "csharp",
    title: "LINQ method chaining as a processing pipeline",
    tag: "snippet",
    code: `using System.Linq;

record LogEntry(DateTime Time, string Level, string Message);

var logs = new[]
{
    new LogEntry(DateTime.Now.AddMinutes(-5), "ERROR", "disk full"),
    new LogEntry(DateTime.Now.AddMinutes(-3), "INFO",  "backup started"),
    new LogEntry(DateTime.Now.AddMinutes(-1), "ERROR", "write failed"),
    new LogEntry(DateTime.Now,               "INFO",  "retry succeeded"),
};

var report = logs
    .Where(e => e.Level == "ERROR")
    .OrderByDescending(e => e.Time)
    .Select(e => $"[{e.Time:HH:mm}] {e.Message}")
    .Take(10)
    .ToList();

foreach (var line in report)
    Console.WriteLine(line);`,
    explanation: "LINQ method chains read like Unix pipes — each operator transforms the sequence lazily; adding `.AsParallel()` or swapping `.Take(10)` for `.Skip(n).Take(page)` changes behavior without restructuring the rest of the pipeline.",
  },
  {
    id: "cs-0521-b2-generic-constraints-interface",
    language: "csharp",
    title: "multiple generic constraints",
    tag: "types",
    code: `using System;
using System.Collections.Generic;

// T must implement both IComparable<T> and IFormattable
T Clamp<T>(T value, T min, T max)
    where T : IComparable<T>, IFormattable
{
    if (value.CompareTo(min) < 0) return min;
    if (value.CompareTo(max) > 0) return max;
    return value;
}

Console.WriteLine(Clamp(15, 0, 10));        // 10
Console.WriteLine(Clamp(-5, 0, 10));        // 0
Console.WriteLine(Clamp(3.14, 0.0, 3.0));   // 3

// Chain with struct constraint for zero-allocation
T ClampStruct<T>(T value, T min, T max)
    where T : struct, IComparable<T>
    => value.CompareTo(min) < 0 ? min
     : value.CompareTo(max) > 0 ? max : value;`,
    explanation: "Multiple `where` constraints are combined with commas — the compiler enforces all of them at call sites and grants access to all the specified interface members within the method body.",
  },
  {
    id: "cs-0521-b2-dictionary-getordefault",
    language: "csharp",
    title: "CollectionsMarshal.GetValueRefOrAddDefault for zero-lookup update",
    tag: "structures",
    code: `using System.Collections.Generic;
using System.Runtime.InteropServices;

var wordCount = new Dictionary<string, int>();

string[] words = "the cat sat on the mat the cat".Split();

foreach (var word in words)
{
    // Single lookup: get ref to value (or add default)
    ref int count = ref CollectionsMarshal.GetValueRefOrAddDefault(
        wordCount, word, out bool exists);
    count++;   // modifies the value in place — no second lookup
}

foreach (var kv in wordCount)
    Console.WriteLine($"{kv.Key}: {kv.Value}");`,
    explanation: "`CollectionsMarshal.GetValueRefOrAddDefault` returns a managed reference to the dictionary value — incrementing through the ref avoids the `TryGetValue` + `[]` double-lookup pattern, making word counting and frequency tables faster.",
  },
  {
    id: "cs-0521-b2-timer-periodic",
    language: "csharp",
    title: "System.Threading.PeriodicTimer for async polling",
    tag: "snippet",
    code: `using System.Threading;
using System.Threading.Tasks;

async Task PollAsync(CancellationToken ct)
{
    using var timer = new PeriodicTimer(TimeSpan.FromSeconds(1));

    int count = 0;
    while (await timer.WaitForNextTickAsync(ct))
    {
        Console.WriteLine($"tick {++count} at {DateTime.Now:HH:mm:ss}");
        if (count >= 3) break;
    }
}

using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(10));
await PollAsync(cts.Token);`,
    explanation: "`PeriodicTimer` is the modern replacement for `System.Threading.Timer` in async code — `WaitForNextTickAsync` is awaitable and cancellation-aware; it won't overlap ticks if a callback takes longer than the interval.",
  },
  {
    id: "cs-0521-b2-string-comparison-ordinal",
    language: "csharp",
    title: "StringComparer for dictionary key normalization",
    tag: "snippet",
    code: `using System;
using System.Collections.Generic;

// Case-insensitive dictionary via StringComparer
var headers = new Dictionary<string, string>(
    StringComparer.OrdinalIgnoreCase)
{
    ["Content-Type"]   = "application/json",
    ["Authorization"]  = "Bearer token123",
};

// Lookup regardless of casing
Console.WriteLine(headers["content-type"]);     // application/json
Console.WriteLine(headers["AUTHORIZATION"]);    // Bearer token123

// Sort using StringComparer
var words = new[] { "Banana", "apple", "Cherry" };
Array.Sort(words, StringComparer.OrdinalIgnoreCase);
Console.WriteLine(string.Join(", ", words));   // apple, Banana, Cherry`,
    explanation: "`StringComparer.OrdinalIgnoreCase` passed to `Dictionary` or `Array.Sort` makes all key comparisons case-insensitive without manually normalizing to lower/upper case — `Ordinal` variants are culture-independent and fast.",
  },
  {
    id: "cs-0521-b2-lambda-discard",
    language: "csharp",
    title: "discards in lambdas and deconstruction",
    tag: "snippet",
    code: `using System.Linq;

var people = new[] { ("Alice", 30), ("Bob", 25), ("Carol", 35) };

// Discard: _ ignores a value you don't need
var names = people.Select((person, _) => person.Item1);
foreach (var n in names) Console.WriteLine(n);   // Alice, Bob, Carol

// In deconstruction
var (_, age, _) = (1, 25, "extra");
Console.WriteLine(age);   // 25

// In switch patterns
string Classify(object o) => o switch
{
    int n when n < 0  => "negative",
    int _             => "non-negative int",
    string _          => "string",
    _                 => "other",
};
Console.WriteLine(Classify(-5));    // negative
Console.WriteLine(Classify("hi")); // string`,
    explanation: "The discard `_` signals \"I don't need this value\" — in lambda parameters, deconstruction, and switch patterns it's a convention for ignored bindings, reducing noise and making intent clear.",
  },
  {
    id: "cs-0521-b2-utf8-string-literals",
    language: "csharp",
    title: "UTF-8 string literals (C# 11+)",
    tag: "snippet",
    code: `// UTF-8 literal: suffix u8 — type is ReadOnlySpan<byte> or byte[]
ReadOnlySpan<byte> utf8Greeting = "Hello, World!"u8;

Console.WriteLine(utf8Greeting.Length);   // 13  (bytes, not chars)
Console.WriteLine(utf8Greeting[0]);       // 72  ('H')

// Useful for writing HTTP response bodies, JSON, etc. without encoding
System.Net.Http.HttpContent CreateContent()
{
    byte[] json = """{"status": "ok"}"""u8.ToArray();
    return new System.Net.Http.ByteArrayContent(json);
}

// Compile-time: the string is encoded to UTF-8 bytes at build time
// — no runtime encoding overhead`,
    explanation: "The `u8` suffix encodes a string literal to UTF-8 `byte[]` or `ReadOnlySpan<byte>` at compile time — the encoding happens once at build time, making it faster than `Encoding.UTF8.GetBytes` for static content like JSON schemas or HTTP headers.",
  },
  {
    id: "cs-0521-b2-timeonly-dateonly",
    language: "csharp",
    title: "DateOnly and TimeOnly types (.NET 6+)",
    tag: "types",
    code: `using System;

// DateOnly: date without time — no ambiguity about time zones
var birthday = new DateOnly(1990, 6, 15);
var today     = DateOnly.FromDateTime(DateTime.Today);

int age = today.Year - birthday.Year;
if (birthday > today.AddYears(-age)) age--;
Console.WriteLine($"Age: {age}");

// TimeOnly: time of day without date
var opening = new TimeOnly(9, 0);
var closing = new TimeOnly(17, 30);
var now     = TimeOnly.FromDateTime(DateTime.Now);

bool isOpen = now >= opening && now <= closing;
Console.WriteLine($"Open: {isOpen}");
Console.WriteLine(opening.ToString("HH:mm"));   // 09:00`,
    explanation: "`DateOnly` and `TimeOnly` remove the ambiguity of `DateTime` — a date without time doesn't have a time zone problem; a time-of-day without date maps cleanly to database `TIME` and `DATE` columns.",
  },
  {
    id: "cs-0521-b2-math-ibits",
    language: "csharp",
    title: "BitOperations for fast bit manipulation",
    tag: "snippet",
    code: `using System.Numerics;

uint n = 0b_0110_1100;

// Count set bits (popcount)
Console.WriteLine(BitOperations.PopCount(n));       // 4

// Leading/trailing zero count
Console.WriteLine(BitOperations.LeadingZeroCount(n));   // 24
Console.WriteLine(BitOperations.TrailingZeroCount(n));  // 2

// Round up to next power of 2
Console.WriteLine(BitOperations.RoundUpToPowerOf2(100)); // 128

// Log2 (floor)
Console.WriteLine(BitOperations.Log2(256));   // 8
Console.WriteLine(BitOperations.Log2(255));   // 7

// Is power of 2?
Console.WriteLine(BitOperations.IsPow2(64));  // True
Console.WriteLine(BitOperations.IsPow2(63));  // False`,
    explanation: "`System.Numerics.BitOperations` wraps CPU intrinsics like POPCNT, LZCNT, and TZCNT — they compile to single hardware instructions on modern CPUs, making bit manipulation operations that used to need lookup tables or loops near-free.",
  },
  {
    id: "cs-0521-b2-records-with-interfaces",
    language: "csharp",
    title: "records implementing interfaces",
    tag: "classes",
    code: `interface IRenderable { string Render(); }
interface IHasArea   { double Area { get; } }

record Circle(double Radius) : IRenderable, IHasArea
{
    public double Area => Math.PI * Radius * Radius;
    public string Render() => $"○ r={Radius:F1}";
}

record Square(double Side) : IRenderable, IHasArea
{
    public double Area => Side * Side;
    public string Render() => $"□ s={Side:F1}";
}

IRenderable[] shapes = [new Circle(5), new Square(4)];
foreach (var s in shapes)
{
    Console.WriteLine(s.Render());
    if (s is IHasArea a)
        Console.WriteLine($"  area = {a.Area:F2}");
}`,
    explanation: "Records can implement interfaces normally — the generated members (equality, `ToString`, deconstruction) are independent of interface implementation; records work well as immutable value objects in polymorphic APIs.",
  },
  {
    id: "cs-0521-b2-tuple-swap",
    language: "csharp",
    title: "tuple deconstruction for elegant swapping and multi-return",
    tag: "snippet",
    code: `// Swap without temp variable
int a = 10, b = 20;
(a, b) = (b, a);
Console.WriteLine($"a={a}, b={b}");   // a=20, b=10

// Swap elements in an array
int[] arr = { 3, 1, 4, 1, 5 };
(arr[0], arr[4]) = (arr[4], arr[0]);
Console.WriteLine(string.Join(",", arr));   // 5,1,4,1,3

// Multiple return values from method
(string First, string Last) SplitName(string full)
{
    var parts = full.Split(' ', 2);
    return (parts[0], parts.Length > 1 ? parts[1] : "");
}

var (first, last) = SplitName("Alice Wonderland");
Console.WriteLine($"{first} / {last}");   // Alice / Wonderland`,
    explanation: "Value tuple deconstruction on the left side of `=` swaps variables atomically without a temp — the right side is evaluated first; this extends to array elements and any lvalues, making it more general than Python-style swap.",
  },
];
