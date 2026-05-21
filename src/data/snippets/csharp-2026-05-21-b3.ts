import type { Snippet } from "./types";

export const csharpSnippets20260521B3: Snippet[] = [
  {
    id: "cs-0521-b3-span-stackalloc-perf",
    language: "csharp",
    title: "Span<T> with stackalloc for zero-allocation buffers",
    tag: "understanding",
    code: `Span<byte> buffer = stackalloc byte[256];
int written = Encoding.UTF8.GetBytes("hello world", buffer);
ReadOnlySpan<byte> filled = buffer[..written];
Console.WriteLine(filled.Length); // 11 — no heap allocation`,
    explanation: "`stackalloc` allocates on the stack; wrapping it in `Span<byte>` gives safe, bounds-checked access without any GC pressure. Keep sizes small (< 1 KB) to avoid stack overflow.",
  },
  {
    id: "cs-0521-b3-record-with-expression",
    language: "csharp",
    title: "`with` expression creates a modified record copy",
    tag: "snippet",
    code: `record Point(int X, int Y);

var p1 = new Point(1, 2);
var p2 = p1 with { X = 10 };
Console.WriteLine(p1); // Point { X = 1, Y = 2 }
Console.WriteLine(p2); // Point { X = 10, Y = 2 }`,
    explanation: "`with` performs non-destructive mutation: it copies all properties from the source record then applies the specified overrides. The original is unchanged.",
  },
  {
    id: "cs-0521-b3-nullable-forgiving-operator",
    language: "csharp",
    title: "null-forgiving operator `!` suppresses nullable warning",
    tag: "caveats",
    code: `string? maybeNull = GetValue();
// Compiler warns: possible null dereference
int len1 = maybeNull.Length;     // warning CS8602

// Null-forgiving: tells compiler "trust me, not null"
int len2 = maybeNull!.Length;    // no warning — but throws if null`,
    explanation: "`!` only suppresses the compile-time warning; it does NOT add a runtime null check. Use it only when you are certain the value cannot be null at that point, after a guard or init check.",
  },
  {
    id: "cs-0521-b3-pattern-list-slice",
    language: "csharp",
    title: "list pattern with slice `..` matches rest of sequence",
    tag: "snippet",
    code: `int[] nums = { 1, 2, 3, 4, 5 };

bool result = nums switch
{
    [1, 2, ..] => true,   // starts with 1, 2
    _           => false,
};
Console.WriteLine(result); // True`,
    explanation: "The `..` slice pattern matches zero or more elements. You can also capture the slice: `[1, .. var rest]` gives you the remaining elements as an array.",
  },
  {
    id: "cs-0521-b3-generic-math-interface",
    language: "csharp",
    title: "generic math with `INumber<T>` (.NET 7+)",
    tag: "types",
    code: `using System.Numerics;

static T Sum<T>(IEnumerable<T> items) where T : INumber<T>
{
    T total = T.Zero;
    foreach (var item in items)
        total += item;
    return total;
}

Console.WriteLine(Sum(new[] { 1, 2, 3 }));       // 6
Console.WriteLine(Sum(new[] { 1.5, 2.5, 3.0 })); // 7`,
    explanation: "`INumber<T>` (and related interfaces like `IAdditionOperators<T,T,T>`) let you write arithmetic-generic code that works for `int`, `double`, `decimal`, etc. without overloads.",
  },
  {
    id: "cs-0521-b3-async-enumerable-yield",
    language: "csharp",
    title: "`IAsyncEnumerable<T>` with `yield return` for async streams",
    tag: "snippet",
    code: `async IAsyncEnumerable<int> FetchPages(int count)
{
    for (int i = 0; i < count; i++)
    {
        await Task.Delay(10); // simulate async I/O
        yield return i * 100;
    }
}

await foreach (var item in FetchPages(3))
    Console.WriteLine(item); // 0, 100, 200`,
    explanation: "Combine `async` + `yield return` to produce values one at a time as each async operation completes — ideal for paginated APIs, database cursors, or any streaming source.",
  },
  {
    id: "cs-0521-b3-required-members",
    language: "csharp",
    title: "`required` keyword forces property initialization",
    tag: "types",
    code: `class Config
{
    public required string Host { get; init; }
    public required int Port    { get; init; }
    public string? Username     { get; init; }
}

// Compile error if Host or Port are omitted:
var cfg = new Config { Host = "localhost", Port = 5432 };`,
    explanation: "`required` (C# 11) is enforced at the call site: any object-initializer that omits a required member fails to compile. Unlike constructor params, it works with object initializer syntax.",
  },
  {
    id: "cs-0521-b3-primary-constructor",
    language: "csharp",
    title: "primary constructors capture parameters as class fields",
    tag: "snippet",
    code: `class Logger(string prefix)
{
    public void Log(string message) =>
        Console.WriteLine(\`[\${prefix}] \${message}\`);
}

var log = new Logger("INFO");
log.Log("server started"); // [INFO] server started`,
    explanation: "Primary constructor parameters (C# 12) are in scope throughout the entire class body. They are NOT automatically stored as fields — the compiler captures them as needed in a compiler-generated field.",
  },
  {
    id: "cs-0521-b3-collection-expressions",
    language: "csharp",
    title: "collection expressions unify array/list/span literals",
    tag: "snippet",
    code: `int[] arr   = [1, 2, 3];
List<int> lst = [4, 5, 6];
Span<int> spn = [7, 8, 9];

int[] combined = [..arr, ..lst]; // spread operator
Console.WriteLine(combined.Length); // 6`,
    explanation: "Collection expressions (C# 12) use `[...]` syntax for any collection type. The `..` spread operator works like Python's `*` unpacking — it inlines elements from another collection.",
  },
  {
    id: "cs-0521-b3-inline-arrays",
    language: "csharp",
    title: "`[InlineArray]` creates fixed-size buffer structs",
    tag: "understanding",
    code: `using System.Runtime.CompilerServices;

[InlineArray(4)]
struct Buffer4<T>
{
    private T _element0;
}

Buffer4<int> buf;
buf[0] = 10;
buf[1] = 20;
Console.WriteLine(buf[0]); // 10`,
    explanation: "`[InlineArray(N)]` (C# 12 / .NET 8) generates a fixed-size struct with N elements stored inline — zero heap allocation, indexer support, and `Span<T>` interop, replacing unsafe fixed buffers.",
  },
  {
    id: "cs-0521-b3-lock-object-type",
    language: "csharp",
    title: "new `Lock` type (.NET 9) improves over `lock(object)`",
    tag: "snippet",
    code: `using System.Threading;

Lock _lock = new Lock();

void SafeIncrement(ref int counter)
{
    using (_lock.EnterScope())
    {
        counter++;
    }
}`,
    explanation: "The `System.Threading.Lock` type (.NET 9) is more efficient than locking on a plain `object` — it uses a dedicated kernel primitive and integrates with the `using` pattern for structured scope exit.",
  },
  {
    id: "cs-0521-b3-partial-methods-extended",
    language: "csharp",
    title: "extended partial methods can return values and have access modifiers",
    tag: "types",
    code: `partial class Validator
{
    public partial bool IsValid(string input);
}

partial class Validator
{
    public partial bool IsValid(string input) =>
        !string.IsNullOrWhiteSpace(input) && input.Length <= 100;
}`,
    explanation: "C# 9+ extended partial methods (vs. the original limited form) may have any return type, access modifier, or `out` params — as long as both the declaration and implementation are in the same `partial` class.",
  },
  {
    id: "cs-0521-b3-interceptors",
    language: "csharp",
    title: "interceptors redirect method calls at compile time",
    tag: "understanding",
    code: `// (Simplified — interceptors require source generator + [InterceptsLocation])
// They let a source generator silently replace a call site:
//   myService.Foo() → GeneratedCode.InterceptedFoo(myService)
// Used by ASP.NET minimal API source generators for AOT.`,
    explanation: "Interceptors (C# 12, experimental) allow source generators to substitute specific call sites without changing the original method. They power AOT-friendly code generation in ASP.NET Core.",
  },
  {
    id: "cs-0521-b3-discriminated-union-workaround",
    language: "csharp",
    title: "simulating discriminated unions with abstract records",
    tag: "families",
    code: `abstract record Shape;
record Circle(double Radius) : Shape;
record Rectangle(double W, double H) : Shape;

double Area(Shape s) => s switch
{
    Circle c      => Math.PI * c.Radius * c.Radius,
    Rectangle r   => r.W * r.H,
    _             => throw new UnreachableException(),
};`,
    explanation: "C# lacks true discriminated unions, but `abstract record` + `sealed` derived records come close. The switch expression exhausts all cases, and `UnreachableException` documents the invariant.",
  },
  {
    id: "cs-0521-b3-memory-marshal",
    language: "csharp",
    title: "`MemoryMarshal` reinterprets span bytes as typed data",
    tag: "snippet",
    code: `using System.Runtime.InteropServices;

byte[] raw = { 0x01, 0x00, 0x00, 0x00 }; // little-endian int32 = 1
Span<byte> span = raw;
ref int val = ref MemoryMarshal.AsRef<int>(span);
Console.WriteLine(val); // 1`,
    explanation: "`MemoryMarshal.AsRef<T>` (and `Cast<TFrom, TTo>`) reinterpret span bytes without copying — essential for binary protocol parsing. Requires the span length to be a multiple of `sizeof(T)`.",
  },
  {
    id: "cs-0521-b3-frozen-collections",
    language: "csharp",
    title: "`FrozenDictionary` and `FrozenSet` for read-only perf",
    tag: "structures",
    code: `using System.Collections.Frozen;

var dict = new Dictionary<string, int>
{
    ["one"] = 1, ["two"] = 2, ["three"] = 3,
};

FrozenDictionary<string, int> frozen = dict.ToFrozenDictionary();
Console.WriteLine(frozen["two"]); // 2`,
    explanation: "`FrozenDictionary<K,V>` and `FrozenSet<T>` (.NET 8) are immutable collections optimised for lookup speed — they pre-compute internal hash structures at creation time, giving faster reads than regular collections.",
  },
  {
    id: "cs-0521-b3-time-abstraction",
    language: "csharp",
    title: "`TimeProvider` abstracts time for testability (.NET 8)",
    tag: "snippet",
    code: `class Greeter(TimeProvider clock)
{
    public string Greet() =>
        clock.GetLocalNow().Hour < 12 ? "Good morning!" : "Good afternoon!";
}

// In tests: pass a FakeTimeProvider to control the clock.
// In production: pass TimeProvider.System`,
    explanation: "`TimeProvider` (.NET 8) replaces `DateTime.Now` / `DateTimeOffset.UtcNow` with an injectable abstraction. Tests can use `Microsoft.Extensions.TimeProvider.Testing.FakeTimeProvider` to freeze or advance time.",
  },
  {
    id: "cs-0521-b3-keyed-di-services",
    language: "csharp",
    title: "keyed DI services allow multiple implementations by key",
    tag: "snippet",
    code: `// Registration
services.AddKeyedSingleton<ICache, MemoryCache>("memory");
services.AddKeyedSingleton<ICache, RedisCache>("redis");

// Resolution
class Handler([FromKeyedServices("redis")] ICache cache) { }`,
    explanation: "Keyed services (.NET 8 DI) let you register multiple implementations of the same interface under different string keys and inject the right one at the call site — avoids factory boilerplate.",
  },
  {
    id: "cs-0521-b3-source-gen-serializer",
    language: "csharp",
    title: "`JsonSerializerContext` enables AOT-safe JSON",
    tag: "understanding",
    code: `[JsonSerializable(typeof(Person))]
partial class AppJsonContext : JsonSerializerContext { }

record Person(string Name, int Age);

string json = JsonSerializer.Serialize(
    new Person("Alice", 30),
    AppJsonContext.Default.Person);`,
    explanation: "The `System.Text.Json` source generator pre-generates serialization code at compile time — no runtime reflection, making it AOT-compatible and significantly faster than the default reflection-based path.",
  },
  {
    id: "cs-0521-b3-params-collections",
    language: "csharp",
    title: "`params` now works with any collection type (C# 13)",
    tag: "types",
    code: `static int Sum(params IEnumerable<int> numbers)
{
    int total = 0;
    foreach (var n in numbers) total += n;
    return total;
}

Console.WriteLine(Sum(1, 2, 3));       // 6
Console.WriteLine(Sum([10, 20, 30]));  // 60`,
    explanation: "C# 13 lifts the `params` restriction from `T[]` to any collection type (`IEnumerable<T>`, `List<T>`, `Span<T>`, etc.), reducing allocations when callers already have a span or list.",
  },
  {
    id: "cs-0521-b3-allows-ref-struct",
    language: "csharp",
    title: "`allows ref struct` generic anti-constraint (C# 13)",
    tag: "types",
    code: `static void Process<T>(T value)
    where T : allows ref struct
{
    // T can now be Span<byte>, ReadOnlySpan<char>, etc.
}

Process(new Span<byte>(new byte[4])); // valid`,
    explanation: "`allows ref struct` (C# 13) relaxes the default restriction that generic type params cannot be ref structs. This enables writing truly generic high-performance APIs that accept `Span<T>` without overloads.",
  },
  {
    id: "cs-0521-b3-semicolon-namespace",
    language: "csharp",
    title: "file-scoped namespace declaration reduces nesting",
    tag: "snippet",
    code: `// Old style — everything indented one level:
namespace MyApp.Services
{
    class Foo { }
}

// File-scoped (C# 10) — applies to whole file, no braces:
namespace MyApp.Services;

class Foo { }`,
    explanation: "File-scoped namespaces eliminate one level of indentation for the common case of one namespace per file. Mixing file-scoped and block namespaces in the same file is a compile error.",
  },
  {
    id: "cs-0521-b3-global-using",
    language: "csharp",
    title: "`global using` applies a using to every file in the project",
    tag: "snippet",
    code: `// GlobalUsings.cs
global using System;
global using System.Collections.Generic;
global using System.Linq;
global using Microsoft.Extensions.Logging;

// Now every .cs file in the project sees these without explicit using.`,
    explanation: "`global using` (C# 10) reduces boilerplate by declaring commonly used namespaces once. The SDK's implicit global usings (enabled by `<ImplicitUsings>enable</ImplicitUsings>`) do this automatically for common BCL namespaces.",
  },
  {
    id: "cs-0521-b3-span-string-operations",
    language: "csharp",
    title: "`AsSpan()` enables allocation-free string slicing",
    tag: "snippet",
    code: `string csv = "alice,bob,charlie";
ReadOnlySpan<char> span = csv.AsSpan();

int comma = span.IndexOf(',');
ReadOnlySpan<char> first = span[..comma];

Console.WriteLine(first.ToString()); // alice`,
    explanation: "`string.AsSpan()` returns a `ReadOnlySpan<char>` pointing into the original string's memory — slicing and searching operate without creating substrings, eliminating intermediate allocations.",
  },
  {
    id: "cs-0521-b3-unsafe-sizeof",
    language: "csharp",
    title: "`sizeof` on user-defined structs requires `unsafe`",
    tag: "understanding",
    code: `struct Point { public int X, Y; }

// Needs unsafe context:
unsafe
{
    Console.WriteLine(sizeof(Point)); // 8 (two ints)
}

// Alternative without unsafe (via Marshal):
Console.WriteLine(Marshal.SizeOf<Point>()); // 8`,
    explanation: "`sizeof` with non-primitive types requires an `unsafe` block because the result depends on layout, which may differ from managed size. `Marshal.SizeOf<T>()` gives the unmanaged size without unsafe code.",
  },
  {
    id: "cs-0521-b3-record-equality",
    language: "csharp",
    title: "records provide structural equality by default",
    tag: "understanding",
    code: `record Person(string Name, int Age);

var a = new Person("Alice", 30);
var b = new Person("Alice", 30);
var c = new Person("Bob",   25);

Console.WriteLine(a == b);      // True
Console.WriteLine(a == c);      // False
Console.WriteLine(a.Equals(b)); // True`,
    explanation: "Records auto-generate `Equals`, `GetHashCode`, and `==`/`!=` based on all declared properties. This is the main behavioral difference from classes, which use reference equality by default.",
  },
  {
    id: "cs-0521-b3-string-create",
    language: "csharp",
    title: "`string.Create` builds strings with minimal allocation",
    tag: "snippet",
    code: `string result = string.Create(5, 42, static (span, state) =>
{
    span[0] = 'v';
    span[1] = (char)('0' + state / 10);
    span[2] = (char)('0' + state % 10);
    span[3] = '.';
    span[4] = '0';
});
Console.WriteLine(result); // v42.0`,
    explanation: "`string.Create<TState>` allocates the string once and lets you write directly into its mutable buffer via a `Span<char>` callback — no intermediate `StringBuilder` or `char[]` allocation.",
  },
  {
    id: "cs-0521-b3-init-only-properties",
    language: "csharp",
    title: "`init` accessor allows setting property only during initialization",
    tag: "types",
    code: `class Order
{
    public Guid Id   { get; init; } = Guid.NewGuid();
    public string Item { get; init; } = "";
}

var order = new Order { Item = "Widget" };
// order.Item = "Gadget"; // Error: init-only property`,
    explanation: "`init` (C# 9) is like `set` but callable only in object initializers and constructors. It makes objects effectively immutable after construction while keeping the convenient initializer syntax.",
  },
  {
    id: "cs-0521-b3-covariant-return",
    language: "csharp",
    title: "covariant return types in overrides",
    tag: "types",
    code: `class Animal
{
    public virtual Animal Clone() => new Animal();
}

class Dog : Animal
{
    // Return type narrowed to Dog — covariant override (C# 9):
    public override Dog Clone() => new Dog();
}

Dog d = new Dog().Clone(); // no cast needed`,
    explanation: "Covariant return types (C# 9) let an override return a more derived type than the base method declared. This eliminates cast boilerplate at call sites and better expresses intent.",
  },
  {
    id: "cs-0521-b3-static-lambda",
    language: "csharp",
    title: "`static` lambdas prevent accidental closure captures",
    tag: "caveats",
    code: `int multiplier = 3;

// This lambda accidentally captures 'multiplier':
Func<int, int> f1 = x => x * multiplier;

// static lambda: compile error if it captures anything:
// Func<int, int> f2 = static x => x * multiplier; // Error!

Func<int, int> f3 = static x => x * 3; // OK`,
    explanation: "`static` lambdas (C# 9) produce a compile-time error if they capture a local variable or `this` — useful as a guardrail to avoid unintended heap allocations from delegate captures in hot paths.",
  },
  {
    id: "cs-0521-b3-pattern-property",
    language: "csharp",
    title: "property patterns match on nested object properties",
    tag: "snippet",
    code: `record Address(string City, string Country);
record Person(string Name, Address Home);

bool IsLondonResident(Person p) => p is
{
    Home: { City: "London", Country: "UK" }
};

var alice = new Person("Alice", new Address("London", "UK"));
Console.WriteLine(IsLondonResident(alice)); // True`,
    explanation: "Property patterns (C# 8+) destructure nested objects inline inside `is` or `switch` expressions — each `{ Prop: pattern }` block recurses into the object without explicit property access.",
  },
  {
    id: "cs-0521-b3-object-pooling",
    language: "csharp",
    title: "`ObjectPool<T>` reduces GC pressure for reusable objects",
    tag: "understanding",
    code: `using Microsoft.Extensions.ObjectPool;

var pool = ObjectPool.Create<StringBuilder>();

StringBuilder sb = pool.Get();
try
{
    sb.Append("hello").Append(" world");
    Console.WriteLine(sb.ToString());
}
finally
{
    pool.Return(sb); // resets and returns to pool
}`,
    explanation: "`ObjectPool<T>` (Microsoft.Extensions.ObjectPool) keeps a pool of pre-allocated, reusable objects. It is the standard pattern for `StringBuilder`, buffers, or heavyweight objects created in hot loops.",
  },
  {
    id: "cs-0521-b3-configuration-bind",
    language: "csharp",
    title: "`IConfiguration.Bind` maps config sections to POCOs",
    tag: "snippet",
    code: `// appsettings.json: { "Database": { "Host": "localhost", "Port": 5432 } }

class DatabaseConfig { public string Host { get; set; } = ""; public int Port { get; set; } }

var config = new DatabaseConfig();
builder.Configuration.GetSection("Database").Bind(config);
Console.WriteLine(\`\${config.Host}:\${config.Port}\`); // localhost:5432`,
    explanation: "`Bind` maps configuration keys (case-insensitive) to matching property names on the target POCO. The `Options<T>` pattern wraps this in DI with `IOptions<T>`, `IOptionsSnapshot<T>`, or `IOptionsMonitor<T>`.",
  },
  {
    id: "cs-0521-b3-channel-producer-consumer",
    language: "csharp",
    title: "`Channel<T>` is the async producer-consumer queue",
    tag: "structures",
    code: `using System.Threading.Channels;

var ch = Channel.CreateUnbounded<int>();

// Producer
_ = Task.Run(async () =>
{
    for (int i = 0; i < 5; i++) await ch.Writer.WriteAsync(i);
    ch.Writer.Complete();
});

// Consumer
await foreach (var item in ch.Reader.ReadAllAsync())
    Console.WriteLine(item); // 0 1 2 3 4`,
    explanation: "`Channel<T>` (System.Threading.Channels) is a high-performance, thread-safe async pipeline primitive. `CreateBounded(capacity)` adds backpressure; `CreateUnbounded()` grows without limit.",
  },
  {
    id: "cs-0521-b3-action-result-types",
    language: "csharp",
    title: "`Results<T1,T2>` for typed minimal API union returns",
    tag: "types",
    code: `app.MapGet("/user/{id}", (int id) =>
    id > 0
        ? TypedResults.Ok(new User(id, "Alice"))
        : TypedResults.NotFound())
   .Produces<User>()
   .ProducesProblem(404);`,
    explanation: "`Results<T1,T2,...>` (ASP.NET Core 7+) is a union result type for minimal API endpoints — OpenAPI generators can introspect it to produce accurate schemas for each possible HTTP response.",
  },
  {
    id: "cs-0521-b3-throwifnull",
    language: "csharp",
    title: "`ArgumentNullException.ThrowIfNull` replaces null guard boilerplate",
    tag: "snippet",
    code: `void Process(string? input)
{
    // Old pattern:
    // if (input is null) throw new ArgumentNullException(nameof(input));

    // .NET 6+ one-liner (captures caller member name automatically):
    ArgumentNullException.ThrowIfNull(input);

    Console.WriteLine(input.Length);
}`,
    explanation: "`ArgumentNullException.ThrowIfNull` (.NET 6) uses `[CallerArgumentExpression]` to automatically capture the parameter name — no `nameof` needed, and the message matches what you'd write manually.",
  },
  {
    id: "cs-0521-b3-half-type",
    language: "csharp",
    title: "`Half` is a 16-bit floating-point type for ML and graphics",
    tag: "types",
    code: `Half h1 = (Half)3.14f;
Half h2 = (Half)1.0f;
Half sum = h1 + h2;
Console.WriteLine((float)sum); // ~4.14 (reduced precision)`,
    explanation: "`System.Half` (.NET 5) represents IEEE 754 binary16 — 1 sign bit, 5 exponent bits, 10 mantissa bits. Useful for interop with ML frameworks (ONNX, CUDA) and reducing memory footprint in large float arrays.",
  },
  {
    id: "cs-0521-b3-int128-uint128",
    language: "csharp",
    title: "`Int128`/`UInt128` for 128-bit integer arithmetic (.NET 7)",
    tag: "types",
    code: `Int128 big = Int128.MaxValue;
Console.WriteLine(big);  // 170141183460469231731687303715884105727
big--;
Console.WriteLine(big);  // 170141183460469231731687303715884105726`,
    explanation: "`Int128` and `UInt128` (.NET 7) are primitive 128-bit integer types with full operator support. They are stored as two 64-bit words and avoid `BigInteger` overhead for fixed-width 128-bit use cases like UUIDs or cryptographic intermediates.",
  },
  {
    id: "cs-0521-b3-utf8-string-literals",
    language: "csharp",
    title: "UTF-8 string literals `\"...”u8` produce `ReadOnlySpan<byte>`",
    tag: "snippet",
    code: `ReadOnlySpan<byte> header = "HTTP/1.1 200 OK\r\n"u8;
Console.WriteLine(header.Length); // 17 (bytes, not chars)`,
    explanation: "The `u8` suffix (C# 11) converts a string literal to its UTF-8 `ReadOnlySpan<byte>` representation at compile time — zero runtime allocation, no `Encoding.UTF8.GetBytes()` call needed.",
  },
  {
    id: "cs-0521-b3-environment-processpath",
    language: "csharp",
    title: "`Environment.ProcessPath` returns the executable path",
    tag: "snippet",
    code: `string? path = Environment.ProcessPath;
Console.WriteLine(path);
// e.g. /usr/local/bin/myapp   or   C:\Program Files\myapp\myapp.exe`,
    explanation: "`Environment.ProcessPath` (.NET 6) replaces the workaround `Process.GetCurrentProcess().MainModule?.FileName` — it returns the full path of the current process executable, or `null` if unavailable.",
  },
  {
    id: "cs-0521-b3-timer-periodic",
    language: "csharp",
    title: "`PeriodicTimer` is the async-friendly replacement for `System.Timers.Timer`",
    tag: "snippet",
    code: `using var timer = new PeriodicTimer(TimeSpan.FromSeconds(1));

while (await timer.WaitForNextTickAsync())
{
    Console.WriteLine(\`Tick: \${DateTime.UtcNow:HH:mm:ss}\`);
    // break; // to stop
}`,
    explanation: "`PeriodicTimer` (.NET 6) exposes an `async`-friendly `WaitForNextTickAsync` instead of an event callback — no thread-pool surprises, no reentrancy issues, and it participates in structured cancellation.",
  },
  {
    id: "cs-0521-b3-string-comparison-ordinal",
    language: "csharp",
    title: "`StringComparison.Ordinal` is faster and culture-safe",
    tag: "caveats",
    code: `string a = "café";
string b = "café"; // 'e' + combining accent

// Culture-aware — may return 0 (equal):
Console.WriteLine(string.Compare(a, b, StringComparison.CurrentCulture));

// Ordinal — byte-by-byte, returns non-zero (not equal):
Console.WriteLine(string.Compare(a, b, StringComparison.Ordinal));`,
    explanation: "Always specify `StringComparison` explicitly. Use `Ordinal`/`OrdinalIgnoreCase` for file paths, keys, and protocol strings (fast, no culture surprises). Use `CurrentCulture` only for user-visible text sorting.",
  },
  {
    id: "cs-0521-b3-expression-trees-compile",
    language: "csharp",
    title: "compiling expression trees at runtime for dynamic predicates",
    tag: "understanding",
    code: `using System.Linq.Expressions;

ParameterExpression param = Expression.Parameter(typeof(int), "x");
Expression body = Expression.GreaterThan(param, Expression.Constant(5));
Expression<Func<int, bool>> lambda =
    Expression.Lambda<Func<int, bool>>(body, param);

Func<int, bool> gt5 = lambda.Compile();
Console.WriteLine(gt5(3));  // False
Console.WriteLine(gt5(10)); // True`,
    explanation: "Expression trees represent code as data — LINQ providers (EF Core, LINQ to XML) use them to translate C# queries to SQL or other languages. `Compile()` turns them into a real delegate for in-process execution.",
  },
  {
    id: "cs-0521-b3-cancellation-linked-token",
    language: "csharp",
    title: "linked cancellation tokens combine multiple cancellation sources",
    tag: "snippet",
    code: `var cts1 = new CancellationTokenSource();
var cts2 = new CancellationTokenSource(TimeSpan.FromSeconds(5));

using var linked = CancellationTokenSource.CreateLinkedTokenSource(
    cts1.Token, cts2.Token);

// linked.Token cancels when EITHER source is cancelled.
await DoWorkAsync(linked.Token);`,
    explanation: "`CreateLinkedTokenSource` creates a token that fires when any of its parent tokens cancel — useful for combining a user-triggered cancel with a timeout, or merging request-scoped and application-level tokens.",
  },
  {
    id: "cs-0521-b3-source-gen-logging",
    language: "csharp",
    title: "`[LoggerMessage]` source generator for high-performance logging",
    tag: "snippet",
    code: `public static partial class Log
{
    [LoggerMessage(Level = LogLevel.Information, Message = "User {UserId} logged in")]
    public static partial void UserLoggedIn(ILogger logger, int userId);
}

// Usage:
Log.UserLoggedIn(logger, 42);`,
    explanation: "`[LoggerMessage]` generates strongly-typed, zero-allocation logging methods. Unlike `logger.LogInformation(...)` with string interpolation, it uses `LogValues` to defer formatting until a sink actually needs it.",
  },
  {
    id: "cs-0521-b3-unsafe-fixed-pointer",
    language: "csharp",
    title: "`fixed` statement pins a managed object for pointer access",
    tag: "understanding",
    code: `byte[] data = { 1, 2, 3, 4 };

unsafe
{
    fixed (byte* p = data)
    {
        // GC won't move 'data' while inside this block
        Console.WriteLine(*(p + 2)); // 3
    }
}`,
    explanation: "`fixed` pins a managed array (or string) so the GC cannot relocate it during the block — allowing raw pointer arithmetic. The pin is released automatically at block exit. Minimize pin duration to avoid GC fragmentation.",
  },
  {
    id: "cs-0521-b3-valuetask-vs-task",
    language: "csharp",
    title: "`ValueTask<T>` avoids allocation for frequently-synchronous paths",
    tag: "understanding",
    code: `// Return ValueTask when the operation often completes synchronously:
async ValueTask<int> GetCachedAsync(int key)
{
    if (_cache.TryGetValue(key, out int val))
        return val; // no allocation — wraps result directly

    int fetched = await FetchFromDbAsync(key);
    _cache[key] = fetched;
    return fetched;
}`,
    explanation: "`ValueTask<T>` is a struct: when the result is already available, it costs no heap allocation vs. `Task<T>`. Use it for cache-first or frequently-hot paths. Avoid awaiting `ValueTask` more than once.",
  },
  {
    id: "cs-0521-b3-regex-source-gen",
    language: "csharp",
    title: "`[GeneratedRegex]` source-generates regex for AOT and speed",
    tag: "snippet",
    code: `using System.Text.RegularExpressions;

partial class Parser
{
    [GeneratedRegex(@"\d{4}-\d{2}-\d{2}", RegexOptions.Compiled)]
    private static partial Regex DatePattern();
}

bool isDate = Parser.DatePattern().IsMatch("2026-05-21"); // True`,
    explanation: "`[GeneratedRegex]` (C# 11 / .NET 7) emits a source-generated `Regex` subclass at compile time — no runtime compilation, AOT-safe, and often faster than `new Regex(pattern, Compiled)` because the DFA is pre-built.",
  },
  {
    id: "cs-0521-b3-implicit-interface",
    language: "csharp",
    title: "implicit vs explicit interface implementation",
    tag: "understanding",
    code: `interface IFoo { void Bar(); }
interface IBaz { void Bar(); }

class MyClass : IFoo, IBaz
{
    public void Bar() => Console.WriteLine("IFoo.Bar / IBaz.Bar");  // implicit

    void IBaz.Bar()   => Console.WriteLine("explicit IBaz.Bar");    // explicit
}

MyClass obj = new();
obj.Bar();             // IFoo.Bar / IBaz.Bar
((IBaz)obj).Bar();    // explicit IBaz.Bar`,
    explanation: "Explicit interface implementation hides the member from the class's public surface and makes it accessible only through the interface type. Use it to resolve naming conflicts or to restrict access.",
  },
  {
    id: "cs-0521-b3-span-write-vs-read",
    language: "csharp",
    title: "`Span<T>` is writable; `ReadOnlySpan<T>` is read-only",
    tag: "types",
    code: `byte[] arr = { 1, 2, 3 };

Span<byte> writable = arr;
writable[0] = 99;                  // OK — modifies arr[0]

ReadOnlySpan<byte> readable = arr;
// readable[0] = 99;              // Compile error`,
    explanation: "`Span<T>` allows in-place mutation of the underlying memory; `ReadOnlySpan<T>` is the read-only view. Functions that only need to inspect data should accept `ReadOnlySpan<T>` — it widens to accept both.",
  },
  {
    id: "cs-0521-b3-enumerable-chunk",
    language: "csharp",
    title: "`Chunk` splits a sequence into fixed-size arrays",
    tag: "snippet",
    code: `int[] nums = Enumerable.Range(1, 10).ToArray();

foreach (int[] chunk in nums.Chunk(3))
    Console.WriteLine(string.Join(", ", chunk));
// 1, 2, 3
// 4, 5, 6
// 7, 8, 9
// 10`,
    explanation: "`Enumerable.Chunk(size)` (.NET 6) partitions a sequence into arrays of at most `size` elements, with the last chunk potentially smaller. It replaces manual batch-splitting logic.",
  },
  {
    id: "cs-0521-b3-min-max-by",
    language: "csharp",
    title: "`MinBy` / `MaxBy` return the element, not the projected key",
    tag: "snippet",
    code: `var people = new[]
{
    new { Name = "Alice", Age = 30 },
    new { Name = "Bob",   Age = 25 },
    new { Name = "Carol", Age = 35 },
};

var youngest = people.MinBy(p => p.Age);
Console.WriteLine(youngest?.Name); // Bob`,
    explanation: "`MinBy`/`MaxBy` (.NET 6) return the element whose projected key is minimum/maximum — unlike `Min(selector)` which returns just the key. No `OrderBy().First()` workaround needed.",
  },
  {
    id: "cs-0521-b3-distinct-by",
    language: "csharp",
    title: "`DistinctBy` deduplicates by a key selector",
    tag: "snippet",
    code: `var items = new[]
{
    new { Id = 1, Name = "Apple" },
    new { Id = 2, Name = "Banana" },
    new { Id = 1, Name = "Apple (dupe)" },
};

var unique = items.DistinctBy(x => x.Id);
foreach (var item in unique)
    Console.WriteLine(item.Name); // Apple, Banana`,
    explanation: "`DistinctBy` (.NET 6) keeps the first occurrence of each distinct key and discards subsequent ones — equivalent to `GroupBy(key).Select(g => g.First())` but more efficient.",
  },
  {
    id: "cs-0521-b3-order-by-descending",
    language: "csharp",
    title: "`Order()` and `OrderDescending()` sort without a key selector",
    tag: "snippet",
    code: `int[] nums = { 5, 1, 4, 2, 3 };

int[] asc  = nums.Order().ToArray();           // [1,2,3,4,5]
int[] desc = nums.OrderDescending().ToArray(); // [5,4,3,2,1]`,
    explanation: "`Order()` and `OrderDescending()` (.NET 7) are shorthand for `OrderBy(x => x)` and `OrderByDescending(x => x)` respectively — less noise when sorting by the element itself.",
  },
  {
    id: "cs-0521-b3-random-getitems",
    language: "csharp",
    title: "`Random.GetItems` samples with replacement",
    tag: "snippet",
    code: `string[] choices = { "rock", "paper", "scissors" };

string[] sample = Random.Shared.GetItems(choices, count: 5);
Console.WriteLine(string.Join(", ", sample));
// e.g. rock, scissors, rock, paper, scissors`,
    explanation: "`Random.GetItems` (.NET 8) picks `count` elements from a span/array with replacement (duplicates allowed). Use `Random.Shared` to avoid creating `Random` instances; it is thread-safe.",
  },
  {
    id: "cs-0521-b3-shuffle",
    language: "csharp",
    title: "`Random.Shuffle` performs an in-place Fisher-Yates shuffle",
    tag: "snippet",
    code: `int[] deck = Enumerable.Range(1, 10).ToArray();
Random.Shared.Shuffle(deck);
Console.WriteLine(string.Join(", ", deck)); // randomised`,
    explanation: "`Random.Shuffle<T>(Span<T>)` (.NET 8) shuffles a span in-place using the Fisher-Yates algorithm. Prefer it over manual shuffle implementations which are often subtly biased.",
  },
  {
    id: "cs-0521-b3-generic-attribute",
    language: "csharp",
    title: "generic attributes allow type-safe attribute parameters (C# 11)",
    tag: "types",
    code: `[AttributeUsage(AttributeTargets.Class)]
class ValidatorAttribute<T> : Attribute where T : IValidator { }

[Validator<EmailValidator>]
class UserForm { }`,
    explanation: "Generic attributes (C# 11) let you parameterise attribute types without `typeof()` workarounds. The type argument is validated at compile time, unlike `Type`-typed attribute properties.",
  },
  {
    id: "cs-0521-b3-static-abstract-interface",
    language: "csharp",
    title: "static abstract interface members for compile-time polymorphism",
    tag: "types",
    code: `interface IFactory<TSelf> where TSelf : IFactory<TSelf>
{
    static abstract TSelf Create();
}

class Widget : IFactory<Widget>
{
    public static Widget Create() => new Widget();
}

T Make<T>() where T : IFactory<T> => T.Create();`,
    explanation: "Static abstract interface members (C# 11) enable generic algorithms that call static methods on the type parameter — the foundation of generic math (`INumber<T>`, `IAdditionOperators<T,T,T>`, etc.).",
  },
  {
    id: "cs-0521-b3-stackonly-ref-struct",
    language: "csharp",
    title: "`ref struct` is stack-only — cannot be boxed or stored on heap",
    tag: "understanding",
    code: `ref struct StackBuffer
{
    public Span<byte> Data;
}

// Cannot:
// object box = new StackBuffer();    // Error: cannot box ref struct
// Task.Run(() => new StackBuffer()); // Error: can't capture in lambda`,
    explanation: "`ref struct` guarantees stack allocation — the CLR enforces this by banning boxing, interface implementation (except `IDisposable`), and async/lambda captures. `Span<T>` is the canonical example.",
  },
  {
    id: "cs-0521-b3-caller-argument-expression",
    language: "csharp",
    title: "`[CallerArgumentExpression]` captures the expression at the call site",
    tag: "snippet",
    code: `void Assert(bool condition,
    [CallerArgumentExpression(nameof(condition))] string expr = "")
{
    if (!condition)
        throw new Exception(\`Assertion failed: \${expr}\`);
}

int x = 5;
Assert(x > 10); // throws: "Assertion failed: x > 10"`,
    explanation: "`[CallerArgumentExpression(\"param\")]` (C# 10) captures the source-code text of the argument — enabling rich diagnostic messages without manually stringifying predicates, as `ArgumentNullException.ThrowIfNull` uses.",
  },
  {
    id: "cs-0521-b3-interpolated-string-handler",
    language: "csharp",
    title: "custom interpolated string handlers avoid intermediate string allocation",
    tag: "understanding",
    code: `// Framework example — used by ILogger internally:
// logger.LogDebug(\`Processing order {orderId}\`, orderId);
//
// When log level is disabled the handler short-circuits:
// AppendLiteral / AppendFormatted are never called,
// so neither string concatenation nor boxing occurs.`,
    explanation: "Custom `[InterpolatedStringHandler]` types (C# 10) let you intercept interpolated string construction — a logger can skip expensive formatting entirely when below the minimum log level, with zero-overhead abstraction.",
  },
  {
    id: "cs-0521-b3-struct-default-constructor",
    language: "csharp",
    title: "structs can now declare parameterless constructors (C# 10)",
    tag: "types",
    code: `struct Counter
{
    public int Value;

    public Counter() { Value = 1; } // parameterless ctor (C# 10+)
}

Counter c = new Counter();
Console.WriteLine(c.Value); // 1

Counter d = default;
Console.WriteLine(d.Value); // 0 — default() bypasses the ctor!`,
    explanation: "C# 10 allows parameterless struct constructors, but `default(T)` and `new T[n]` still zero-initialise without calling the constructor. Code that relies on the constructor for invariants must avoid `default`.",
  },
  {
    id: "cs-0521-b3-pattern-var",
    language: "csharp",
    title: "`var` pattern always matches and binds the value",
    tag: "snippet",
    code: `object[] items = { 1, "hello", null!, 3.14 };

foreach (var item in items)
{
    if (item is var x && x is int n)
        Console.WriteLine(\`int: \${n}\`);
}
// int: 1
// int: 3  (if 3.14 were cast — it's not here, just illustrating)`,
    explanation: "The `var` pattern (`is var x`) always succeeds and binds the tested value to `x` — useful for introducing a variable inside a `when` guard or chained `&&` expression without an explicit type match.",
  },
  {
    id: "cs-0521-b3-throw-expressions",
    language: "csharp",
    title: "`throw` as an expression in ternary and null-coalescing contexts",
    tag: "snippet",
    code: `string? name = GetName();

// In null-coalescing:
string confirmed = name ?? throw new ArgumentNullException(nameof(name));

// In ternary:
int len = name != null ? name.Length : throw new InvalidOperationException();`,
    explanation: "`throw` became an expression (C# 7) so it can appear in `??`, `?:`, `=>`, and other expression contexts — eliminating the need for a separate `if`/`throw` statement in these common patterns.",
  },
  {
    id: "cs-0521-b3-deconstructors-extensions",
    language: "csharp",
    title: "extension `Deconstruct` adds tuple-style unpacking to existing types",
    tag: "snippet",
    code: `static class DateTimeExtensions
{
    public static void Deconstruct(this DateTime dt,
        out int year, out int month, out int day)
    {
        (year, month, day) = (dt.Year, dt.Month, dt.Day);
    }
}

var (y, m, d) = DateTime.Today;
Console.WriteLine(\`\${y}-\${m:D2}-\${d:D2}\`);`,
    explanation: "Any type gains deconstruction syntax by adding a `Deconstruct` method (instance or extension) with `out` parameters. This enables `var (a, b) = obj` without the type implementing any interface.",
  },
  {
    id: "cs-0521-b3-default-interface-diamond",
    language: "csharp",
    title: "default interface methods resolve diamond inheritance at compile time",
    tag: "caveats",
    code: `interface IA { virtual string Name() => "IA"; }
interface IB : IA { override string Name() => "IB"; }
interface IC : IA { override string Name() => "IC"; }

// Ambiguous — compile error:
// class D : IB, IC { }  // Error: no most-derived implementation

class D : IB, IC
{
    public string Name() => ((IB)this).Name(); // explicit resolution
}`,
    explanation: "When two interfaces provide default implementations of the same member, the implementing class must explicitly override or delegate to resolve the ambiguity — the compiler does not pick one silently.",
  },
  {
    id: "cs-0521-b3-unsafe-function-pointer",
    language: "csharp",
    title: "function pointers `delegate*` for low-overhead callbacks",
    tag: "types",
    code: `unsafe
{
    delegate* managed<int, int, int> add = &Add;
    Console.WriteLine(add(3, 4)); // 7
}

static int Add(int a, int b) => a + b;`,
    explanation: "`delegate*` (C# 9) is a value type that stores a raw function pointer — no allocation, no virtual dispatch, and no GC root like a delegate object. Used in interop-heavy and performance-critical code.",
  },
  {
    id: "cs-0521-b3-struct-interface-boxing",
    language: "csharp",
    title: "calling interface methods on a struct causes boxing",
    tag: "caveats",
    code: `interface ICounter { void Increment(); int Value { get; } }

struct Counter : ICounter
{
    public int Value { get; private set; }
    public void Increment() => Value++;
}

ICounter c = new Counter(); // BOXES the struct
c.Increment();
Console.WriteLine(c.Value); // 1

Counter s = new Counter();
s.Increment();              // no boxing — struct call
Console.WriteLine(s.Value); // 1`,
    explanation: "Assigning a struct to an interface variable boxes it — subsequent mutations go to the boxed copy, not the original. Use concrete struct types in performance paths; accept the interface type only if boxing is acceptable.",
  },
  {
    id: "cs-0521-b3-thread-local",
    language: "csharp",
    title: "`ThreadLocal<T>` gives each thread its own value",
    tag: "structures",
    code: `var counter = new ThreadLocal<int>(valueFactory: () => 0, trackAllValues: true);

Parallel.For(0, 4, _ =>
{
    counter.Value++;
});

Console.WriteLine(counter.Values.Sum()); // 4 (one per thread)`,
    explanation: "`ThreadLocal<T>` stores a separate instance per thread, eliminating contention. `trackAllValues: true` collects all thread instances so you can aggregate them afterward (e.g., summing per-thread counters).",
  },
  {
    id: "cs-0521-b3-span-sequence-equal",
    language: "csharp",
    title: "`SequenceEqual` compares span contents without allocation",
    tag: "snippet",
    code: `byte[] a = { 1, 2, 3 };
byte[] b = { 1, 2, 3 };
byte[] c = { 1, 2, 4 };

Console.WriteLine(a.AsSpan().SequenceEqual(b)); // True
Console.WriteLine(a.AsSpan().SequenceEqual(c)); // False`,
    explanation: "`MemoryExtensions.SequenceEqual` compares two spans element-by-element using hardware-accelerated SIMD instructions on supported platforms — much faster than a manual loop for large buffers.",
  },
  {
    id: "cs-0521-b3-environment-exitcode",
    language: "csharp",
    title: "set the process exit code with `Environment.ExitCode`",
    tag: "snippet",
    code: `// Set without immediately exiting:
Environment.ExitCode = 1;

// Or exit immediately:
Environment.Exit(2);

// In a top-level program, returning an int also sets exit code:
return 0;`,
    explanation: "Set `Environment.ExitCode` to signal success or failure to the shell without terminating immediately. Callers (CI pipelines, scripts) check `$?` or `%ERRORLEVEL%`. `0` means success by convention.",
  },
  {
    id: "cs-0521-b3-multiline-string-raw",
    language: "csharp",
    title: "raw string literals preserve exact whitespace and avoid escaping",
    tag: "snippet",
    code: `string json = """
    {
        "name": "Alice",
        "age": 30
    }
    """;

Console.WriteLine(json);
// {
//     "name": "Alice",
//     "age": 30
// }`,
    explanation: "Raw string literals (C# 11) use `\"\"\"...\"\"\"`; the indentation of the closing `\"\"\"` sets the baseline — that many leading spaces are stripped from each line. No need to escape `\"`, `\\`, or `\\n`.",
  },
  {
    id: "cs-0521-b3-scoped-keyword",
    language: "csharp",
    title: "`scoped` prevents a ref from escaping its declaration scope",
    tag: "types",
    code: `// Prevents returning the ref to the caller:
static ref int GetFirst(scoped ref int[] arr)
{
    return ref arr[0]; // Error: scoped ref cannot escape
}`,
    explanation: "`scoped` (C# 11) tells the compiler that a `ref` parameter or local cannot escape the current method scope — enabling the compiler to allow certain patterns with `ref struct` and `Span<T>` that would otherwise be rejected.",
  },
  {
    id: "cs-0521-b3-objectdisposedexception-helper",
    language: "csharp",
    title: "`ObjectDisposedException.ThrowIf` guards disposed state",
    tag: "snippet",
    code: `class MyResource : IDisposable
{
    private bool _disposed;

    public void DoWork()
    {
        ObjectDisposedException.ThrowIf(_disposed, this);
        // safe to use
    }

    public void Dispose() => _disposed = true;
}`,
    explanation: "`ObjectDisposedException.ThrowIf(condition, instance)` (.NET 7) is the idiomatic disposed-state guard — analogous to `ArgumentNullException.ThrowIfNull`, with automatic type name in the exception message.",
  },
  {
    id: "cs-0521-b3-unmanaged-constraint",
    language: "csharp",
    title: "`unmanaged` constraint restricts to blittable value types",
    tag: "types",
    code: `static unsafe int SizeOf<T>() where T : unmanaged => sizeof(T);

Console.WriteLine(SizeOf<int>());    // 4
Console.WriteLine(SizeOf<double>()); // 8
// SizeOf<string>(); // Error: string is not unmanaged`,
    explanation: "`where T : unmanaged` (C# 7.3) constrains T to value types with no managed references — `int`, `double`, `Point` (if all fields are also unmanaged). Enables `sizeof(T)` and pointer arithmetic in generic code.",
  },
  {
    id: "cs-0521-b3-index-range-operators",
    language: "csharp",
    title: "index `^` and range `..` operators for slicing",
    tag: "snippet",
    code: `int[] nums = { 0, 1, 2, 3, 4, 5 };

Console.WriteLine(nums[^1]);     // 5  (last element)
Console.WriteLine(nums[^2]);     // 4  (second-to-last)

int[] slice = nums[1..4];        // [1, 2, 3]
int[] tail  = nums[3..];         // [3, 4, 5]
int[] head  = nums[..3];         // [0, 1, 2]`,
    explanation: "`^n` is shorthand for `length - n`. `a..b` creates a `Range` struct. Arrays, strings, `Span<T>`, and any type with `Length`/`Count` + an `int`-indexed getter can use these operators.",
  },
  {
    id: "cs-0521-b3-immutable-array",
    language: "csharp",
    title: "`ImmutableArray<T>` is a struct-backed immutable sequence",
    tag: "structures",
    code: `using System.Collections.Immutable;

ImmutableArray<int> arr = ImmutableArray.Create(1, 2, 3);
ImmutableArray<int> arr2 = arr.Add(4); // new array, original unchanged

Console.WriteLine(arr.Length);  // 3
Console.WriteLine(arr2.Length); // 4`,
    explanation: "`ImmutableArray<T>` (unlike `ImmutableList<T>`) is a struct wrapping a plain array — read performance is identical to `T[]`, with no per-element indirection. Mutating operations return a new instance.",
  },
];
