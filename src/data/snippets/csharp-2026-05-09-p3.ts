import type { Snippet } from "./types";

export const csharpSnippets20260509P3: Snippet[] = [
  {
    id: "cs-snippet-string-interpolation-format",
    language: "csharp",
    title: "String interpolation with format specifiers",
    tag: "snippet",
    code: `double price = 1234.567;
DateTime now   = new DateTime(2026, 5, 9);

Console.WriteLine($"Price: {price:C2}");       // Price: $1,234.57
Console.WriteLine($"Price: {price:N2}");       // Price: 1,234.57
Console.WriteLine($"Price: {price:F4}");       // Price: 1234.5670
Console.WriteLine($"Hex: {255:X4}");           // Hex: 00FF
Console.WriteLine($"Date: {now:yyyy-MM-dd}");  // Date: 2026-05-09
Console.WriteLine($"Pad: {42,10}");            //         42`,
    explanation: "Format specifiers after the colon in an interpolated string use the same format string mini-language as ToString(format); the optional width before the comma controls field width and alignment.",
  },
  {
    id: "cs-understanding-covariance",
    language: "csharp",
    title: "Array covariance is checked at runtime, not compile time",
    tag: "understanding",
    code: `string[] strings = { "a", "b", "c" };
object[] objects = strings;   // compiles: array covariance

// This compiles but throws ArrayTypeMismatchException at runtime!
try
{
    objects[0] = 42;   // can't store int into string[]
}
catch (ArrayTypeMismatchException e)
{
    Console.WriteLine(e.GetType().Name);  // ArrayTypeMismatchException
}

// IEnumerable<string> -> IEnumerable<object> is safe (read-only)`,
    explanation: "Array covariance (assigning string[] to object[]) is a historical C# feature that sacrifices compile-time safety for runtime checks; prefer IReadOnlyList<T> or IEnumerable<T> which are properly covariant.",
  },
  {
    id: "cs-structures-memory",
    language: "csharp",
    title: "Memory<T> vs Span<T>: heap-compatible slice",
    tag: "structures",
    code: `byte[] data = new byte[1024];

// Span<T>: stack-only, cannot be stored in fields or async methods
Span<byte> span = data.AsSpan()[..256];

// Memory<T>: can be stored on the heap, passed across async awaits
Memory<byte> mem = data.AsMemory()[..256];

// Convert Memory to Span inside a synchronous method
void ProcessSync(Memory<byte> m)
{
    Span<byte> s = m.Span;
    s[0] = 0xFF;
}

ProcessSync(mem);
Console.WriteLine(data[0]);   // 255`,
    explanation: "Span<T> is a ref struct and cannot be stored in class fields or survive an await; Memory<T> is the heap-compatible counterpart that can be stored and passed through async code, with a Span accessible synchronously via .Span.",
  },
  {
    id: "cs-caveats-string-compare",
    language: "csharp",
    title: "String comparison: ordinal vs culture-sensitive",
    tag: "caveats",
    code: `string a = "file10.txt";
string b = "file9.txt";

// Ordinal: byte-by-byte, deterministic, fast
int ord = string.Compare(a, b, StringComparison.Ordinal);
Console.WriteLine(ord < 0);   // True ('1' < '9' in ASCII)

// CurrentCulture: locale-aware, may change across machines
int cult = string.Compare(a, b, StringComparison.CurrentCulture);

// Best practice for file paths and protocol strings:
bool eq = string.Equals("Hello", "hello", StringComparison.OrdinalIgnoreCase);
Console.WriteLine(eq);   // True`,
    explanation: "Culture-sensitive comparison can produce different results on different machines; use StringComparison.Ordinal for file paths, keys, and protocol strings; reserve CurrentCulture for user-visible text sorting.",
  },
  {
    id: "cs-types-nullable-value",
    language: "csharp",
    title: "Nullable<T> vs T?: same thing, different syntax",
    tag: "types",
    code: `// T? is syntactic sugar for Nullable<T>
int? a = null;
Nullable<int> b = null;  // identical

a = 42;
Console.WriteLine(a.HasValue);   // True
Console.WriteLine(a.Value);      // 42
Console.WriteLine(a.GetValueOrDefault(-1));  // 42

int? c = null;
Console.WriteLine(c.GetValueOrDefault(-1));  // -1

int len = a ?? 0;`,
    explanation: "int? is exactly Nullable<int> -- the compiler desugars the ? syntax to the struct. HasValue, Value, and GetValueOrDefault are the core API; the null-conditional ?. and ?? operators work seamlessly with nullable value types.",
  },
  {
    id: "cs-families-cancellation-token",
    language: "csharp",
    title: "CancellationToken propagates cancellation signals",
    tag: "families",
    code: `using var cts = new CancellationTokenSource(timeout: TimeSpan.FromSeconds(2));
CancellationToken token = cts.Token;

async Task LongRunning(CancellationToken ct)
{
    for (int i = 0; i < 10; i++)
    {
        ct.ThrowIfCancellationRequested();
        await Task.Delay(500, ct);
        Console.WriteLine($"step {i}");
    }
}

try { await LongRunning(token); }
catch (OperationCanceledException) { Console.WriteLine("cancelled"); }`,
    explanation: "CancellationToken links a cancellation signal to async operations; ThrowIfCancellationRequested() at logical checkpoints and passing the token to Task.Delay/HttpClient/etc. ensures the operation stops promptly when cancelled.",
  },
  {
    id: "cs-classes-abstract-template",
    language: "csharp",
    title: "Template Method pattern using abstract base class",
    tag: "classes",
    code: `abstract class DataExporter
{
    // Template method: defines the algorithm skeleton
    public void Export(IEnumerable<object> data)
    {
        var header = BuildHeader();
        var rows   = data.Select(FormatRow);
        var footer = BuildFooter();
        Write(string.Join("\n", new[] { header }.Concat(rows).Append(footer)));
    }

    protected abstract string BuildHeader();
    protected abstract string FormatRow(object item);
    protected virtual  string BuildFooter() => "---";
    protected virtual  void   Write(string output) => Console.WriteLine(output);
}

class CsvExporter : DataExporter
{
    protected override string BuildHeader() => "id,name";
    protected override string FormatRow(object o) => o.ToString()!;
}`,
    explanation: "The Template Method pattern defines the algorithm structure in a base class with abstract steps for subclasses to fill in; virtual (not abstract) methods provide defaults that subclasses can optionally override.",
  },
  {
    id: "cs-snippet-using-declaration",
    language: "csharp",
    title: "using declaration disposes at end of enclosing scope",
    tag: "snippet",
    code: `void WriteFile(string path, string content)
{
    using var writer = new System.IO.StreamWriter(path);
    // 'using var' (C# 8): no extra braces needed
    // writer is disposed at the end of WriteFile

    writer.WriteLine(content);
    writer.WriteLine("done");
    // Dispose() called here automatically
}

// Compare with the older using statement form:
// using (var writer = new StreamWriter(path)) { ... }`,
    explanation: "The using declaration (C# 8) is syntactic sugar that disposes the object at the end of the enclosing block; it reduces one level of nesting compared to the using statement.",
  },
  {
    id: "cs-understanding-params-array",
    language: "csharp",
    title: "params array: variadic arguments without caller overhead",
    tag: "understanding",
    code: `static int Sum(params int[] numbers)
{
    int total = 0;
    foreach (int n in numbers) total += n;
    return total;
}

Console.WriteLine(Sum(1, 2, 3));          // 6
Console.WriteLine(Sum(1, 2, 3, 4, 5));   // 15
Console.WriteLine(Sum());                 // 0

// Calling with an existing array avoids a second allocation
int[] arr = { 10, 20, 30 };
Console.WriteLine(Sum(arr));  // 60`,
    explanation: "params makes it look like the method accepts any number of arguments; the compiler creates an int[] from the call-site values. If the caller has an existing array, pass it directly to avoid a second allocation.",
  },
  {
    id: "cs-structures-immutable-list",
    language: "csharp",
    title: "ImmutableList<T>: safe sharing across threads",
    tag: "structures",
    code: `using System.Collections.Immutable;

var list = ImmutableList.Create(1, 2, 3);
var list2 = list.Add(4);      // returns new list; original unchanged
var list3 = list2.Remove(2);  // returns new list

Console.WriteLine(string.Join(",", list));   // 1,2,3
Console.WriteLine(string.Join(",", list2));  // 1,2,3,4
Console.WriteLine(string.Join(",", list3));  // 1,3,4`,
    explanation: "ImmutableList<T> uses a persistent (structural sharing) tree; every mutation returns a new list that shares most nodes with the original, making immutable collections practical rather than prohibitively expensive.",
  },
  {
    id: "cs-caveats-default-value",
    language: "csharp",
    title: "default(T) is the zero-value, not necessarily null",
    tag: "caveats",
    code: `Console.WriteLine(default(int));      // 0
Console.WriteLine(default(bool));     // False
Console.WriteLine(default(double));   // 0
Console.WriteLine(default(string));   // (null)
Console.WriteLine(default(DateTime)); // 01/01/0001 00:00:00

// Gotcha: default(DateTime) is not a useful sentinel value
// Use DateTime? (Nullable<DateTime>) instead if you need 'no date'
DateTime? optionalDate = null;
Console.WriteLine(optionalDate.HasValue);  // False`,
    explanation: "default(T) returns the zero-initialised value for a type: 0 for numerics, false for bool, null for reference types, and a zero-filled struct for value types -- this can be surprising for DateTime and Guid.",
  },
  {
    id: "cs-types-dynamic",
    language: "csharp",
    title: "dynamic defers type checking to runtime",
    tag: "types",
    code: `dynamic d = "hello";
Console.WriteLine(d.Length);    // 5 -- works, string has Length
Console.WriteLine(d.ToUpper()); // HELLO

d = 42;                          // reassign to different type
Console.WriteLine(d + 8);       // 50

// RuntimeBinderException if method doesn't exist:
try { d.NonExistentMethod(); }
catch (Microsoft.CSharp.RuntimeBinder.RuntimeBinderException e)
    { Console.WriteLine(e.Message); }`,
    explanation: "dynamic bypasses static type checking; member resolution happens at runtime via the DLR. Use it for COM interop, reflection-heavy code, or consuming dynamic JSON/scripting APIs -- avoid it in core business logic.",
  },
  {
    id: "cs-families-channel",
    language: "csharp",
    title: "Channel<T> for producer-consumer async pipelines",
    tag: "families",
    code: `using System.Threading.Channels;

var channel = Channel.CreateBounded<int>(capacity: 10);
var writer = channel.Writer;
var reader = channel.Reader;

// Producer
_ = Task.Run(async () =>
{
    for (int i = 0; i < 5; i++)
        await writer.WriteAsync(i);
    writer.Complete();
});

// Consumer
await foreach (int item in reader.ReadAllAsync())
    Console.Write(item + " ");   // 0 1 2 3 4`,
    explanation: "Channel<T> provides backpressure-aware async producer-consumer communication; CreateBounded limits buffer size (blocking producers when full), CreateUnbounded allows unlimited buffering.",
  },
  {
    id: "cs-classes-generic-math",
    language: "csharp",
    title: "Generic math interfaces (INumber<T>) in .NET 7+",
    tag: "classes",
    code: `using System.Numerics;

// One method that works for int, double, decimal, etc.
T Sum<T>(IEnumerable<T> items) where T : INumber<T>
{
    T total = T.Zero;
    foreach (T item in items) total += item;
    return total;
}

Console.WriteLine(Sum(new[] { 1, 2, 3, 4, 5 }));         // 15
Console.WriteLine(Sum(new[] { 1.5, 2.5, 3.0 }));         // 7
Console.WriteLine(Sum(new[] { 1.1m, 2.2m, 3.3m }));      // 6.6`,
    explanation: "INumber<T> and related interfaces in .NET 7+ enable writing generic algorithms over numeric types without reflection or code duplication.",
  },
  {
    id: "cs-snippet-tuple-deconstruct",
    language: "csharp",
    title: "Tuple deconstruction and returning multiple values",
    tag: "snippet",
    code: `(int Min, int Max, double Avg) Analyse(int[] data)
{
    return (data.Min(), data.Max(), data.Average());
}

var (min, max, avg) = Analyse(new[] { 3, 1, 4, 1, 5, 9, 2, 6 });
Console.WriteLine($"min={min} max={max} avg={avg:F1}");
// min=1 max=9 avg=3.9

// Discard unwanted fields with _
var (_, maximum, _) = Analyse(new[] { 10, 20, 30 });
Console.WriteLine(maximum);  // 30`,
    explanation: "Named tuples returned from methods give callers meaningful member names via deconstruction; discard (_) ignores fields you don't need without allocating a variable for them.",
  },
  {
    id: "cs-understanding-delegate-combine",
    language: "csharp",
    title: "Delegates are multicast: += combines them into a chain",
    tag: "understanding",
    code: `Action<string> greet = s => Console.WriteLine($"Hello, {s}!");
Action<string> log   = s => Console.WriteLine($"[LOG] {s}");

// += creates a new multicast delegate (both run in order)
Action<string> combined = greet + log;
combined("Alice");
// Hello, Alice!
// [LOG] Alice

// -= removes a delegate from the chain
combined -= log;
combined("Bob");
// Hello, Bob!`,
    explanation: "Delegate instances are immutable; + and += create a new multicast delegate that invokes each constituent in order. Events use the same mechanism -- subscribers are added with +=, removed with -=.",
  },
  {
    id: "cs-structures-frozen-dict",
    language: "csharp",
    title: "FrozenDictionary: read-only dictionary optimised for lookups",
    tag: "structures",
    code: `using System.Collections.Frozen;

var dict = new Dictionary<string, int>
{
    ["alpha"] = 1, ["beta"] = 2, ["gamma"] = 3
};
FrozenDictionary<string, int> frozen = dict.ToFrozenDictionary();

// Faster TryGetValue than regular Dictionary for read-only use
Console.WriteLine(frozen["alpha"]);    // 1
Console.WriteLine(frozen.ContainsKey("beta")); // True
// frozen["new"] = 4;  // CS0200: property is read-only`,
    explanation: "FrozenDictionary (.NET 8+) trades build cost for faster reads by using perfect hashing tailored to the actual key set; ideal for lookup tables built once and read many times.",
  },
  {
    id: "cs-caveats-captured-closure",
    language: "csharp",
    title: "LINQ deferred execution captures variables by reference",
    tag: "caveats",
    code: `int threshold = 5;
var query = Enumerable.Range(1, 10).Where(n => n > threshold);

Console.WriteLine(string.Join(",", query));  // 6,7,8,9,10

threshold = 8;
// Query re-evaluates with the new threshold value
Console.WriteLine(string.Join(",", query));  // 9,10`,
    explanation: "LINQ is lazy: Where doesn't run until the query is iterated. The lambda captures threshold by reference, so changing threshold between enumerations changes the results. Materialise with .ToList() to freeze the results.",
  },
  {
    id: "cs-classes-required-members",
    language: "csharp",
    title: "required members enforce property initialisation (C# 11)",
    tag: "classes",
    code: `class UserDto
{
    public required string Name { get; init; }
    public required string Email { get; init; }
    public int Age { get; init; }  // optional
}

// Compiler error if Name or Email missing from initialiser:
// var u = new UserDto { Name = "Alice" };  // CS9035: Email required

var user = new UserDto
{
    Name  = "Alice",
    Email = "alice@example.com",
    Age   = 30,
};
Console.WriteLine(user.Name);  // Alice`,
    explanation: "required (C# 11) on a property means every object initialiser must set it; this enforces completeness at compile time without requiring constructor parameters -- useful for DTO and configuration classes.",
  },
  {
    id: "cs-snippet-is-pattern",
    language: "csharp",
    title: "is with type pattern replaces as + null check",
    tag: "snippet",
    code: `object obj = "Hello, World!";

// Old style: as + null check
string? s1 = obj as string;
if (s1 != null) Console.WriteLine(s1.Length);

// C# 7+ pattern: is + binding in one step
if (obj is string s2)
    Console.WriteLine(s2.Length);   // 13

// With negation (C# 9)
if (obj is not int)
    Console.WriteLine("not an int");  // not an int`,
    explanation: "'is Type variable' simultaneously tests the type and binds the result to a new variable that is in scope in the if branch; 'is not Type' is the idiomatic negation (C# 9).",
  },
  {
    id: "cs-structures-array-pool",
    language: "csharp",
    title: "ArrayPool<T> rents and returns buffers to avoid allocations",
    tag: "structures",
    code: `using System.Buffers;

byte[] buffer = ArrayPool<byte>.Shared.Rent(4096);
try
{
    // use buffer for I/O or processing
    int count = new Random().Next(buffer.Length);
    Console.WriteLine($"working with {count} bytes");
}
finally
{
    // Return to the pool -- always in a finally block!
    ArrayPool<byte>.Shared.Return(buffer, clearArray: false);
}`,
    explanation: "ArrayPool<T>.Shared provides a thread-safe cache of reusable arrays; renting from the pool avoids a heap allocation on every call and reduces GC pressure in high-throughput I/O code. Always return in a finally block.",
  },
  {
    id: "cs-caveats-equality-struct",
    language: "csharp",
    title: "Struct equality: auto-generated vs custom IEquatable<T>",
    tag: "caveats",
    code: `// Default struct equality uses reflection-based ValueType.Equals
// which is slower and can fail for float fields

// Override for performance and correctness
struct Point : IEquatable<Point>
{
    public double X, Y;
    public bool Equals(Point other) => X == other.X && Y == other.Y;
    public override bool Equals(object? o) => o is Point p && Equals(p);
    public override int GetHashCode() => HashCode.Combine(X, Y);
    public static bool operator ==(Point a, Point b) => a.Equals(b);
    public static bool operator !=(Point a, Point b) => !a.Equals(b);
}`,
    explanation: "Default struct equality uses reflection via ValueType.Equals, boxing each field; implementing IEquatable<T> with a custom Equals avoids boxing and is significantly faster for structs used in collections.",
  },
  {
    id: "cs-types-interface-static-abstract",
    language: "csharp",
    title: "Static abstract interface members (C# 11)",
    tag: "types",
    code: `interface IParseable<T>
{
    static abstract T Parse(string input);
}

struct Celsius : IParseable<Celsius>
{
    public double Value { get; init; }
    public static Celsius Parse(string input)
        => new() { Value = double.Parse(input) };
    public override string ToString() => $"{Value}°C";
}

static T ParseFromString<T>(string s) where T : IParseable<T>
    => T.Parse(s);

Console.WriteLine(ParseFromString<Celsius>("100"));  // 100°C`,
    explanation: "Static abstract interface members (C# 11) allow interfaces to require implementing types to provide static methods; combined with generic constraints this enables generic algorithms that call static factory methods like Parse.",
  },
  {
    id: "cs-families-memory-pool",
    language: "csharp",
    title: "MemoryPool<T> vs ArrayPool<T>: Memory<T> facade",
    tag: "families",
    code: `using System.Buffers;

// ArrayPool: rents T[], you manage the array directly
byte[] arr = ArrayPool<byte>.Shared.Rent(1024);
ArrayPool<byte>.Shared.Return(arr);

// MemoryPool: rents IMemoryOwner<T> -- owns and disposes the Memory<T>
using IMemoryOwner<byte> owner = MemoryPool<byte>.Shared.Rent(1024);
Memory<byte> mem = owner.Memory;

// Write through the Memory
mem.Span[0] = 0xAA;
Console.WriteLine(mem.Span[0]);   // 170`,
    explanation: "MemoryPool<T> wraps ArrayPool and returns an IMemoryOwner<T> that manages lifetime via Dispose; it's preferred over raw ArrayPool when passing ownership of the buffer across API boundaries.",
  },
  {
    id: "cs-classes-covariant-return",
    language: "csharp",
    title: "Covariant return types in overrides (C# 9)",
    tag: "classes",
    code: `class Animal
{
    public virtual Animal Clone() => new Animal();
}

class Dog : Animal
{
    public string Name { get; init; } = "";
    // C# 9: override can return a more derived type
    public override Dog Clone() => new Dog { Name = this.Name };
}

Dog rex = new Dog { Name = "Rex" };
Dog clone = rex.Clone();   // returns Dog directly -- no cast needed
Console.WriteLine(clone.Name);   // Rex`,
    explanation: "Covariant return types (C# 9) allow an overriding method to declare a more derived return type than its base declaration; callers using the derived type reference get the precise type without casting.",
  }
];
