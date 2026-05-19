import type { Snippet } from "./types";

export const csharpSnippets20260519B2: Snippet[] = [
  {
    id: "cs-0519-b2-pattern-type",
    language: "csharp",
    title: "Type patterns and is expressions (C# 7+)",
    tag: "snippet",
    code: `object obj = "hello";

// Type pattern: test + cast in one
if (obj is string s)
    Console.WriteLine(s.ToUpper());  // HELLO

// In switch expressions
string Describe(object o) => o switch
{
    int n    => $"int: {n}",
    string s => $"string: {s}",
    null     => "null",
    _        => $"other: {o.GetType().Name}"
};

Console.WriteLine(Describe(42));      // int: 42
Console.WriteLine(Describe("hi"));   // string: hi`,
    explanation: "The is type pattern test-and-binds in one expression, eliminating a separate cast; switch expressions with type arms replace long if/else-if chains over object types.",
  },
  {
    id: "cs-0519-b2-pattern-property",
    language: "csharp",
    title: "Property patterns in match expressions (C# 8)",
    tag: "snippet",
    code: `record Point(int X, int Y);

string Classify(Point p) => p switch
{
    { X: 0, Y: 0 } => "origin",
    { X: 0 }       => "y-axis",
    { Y: 0 }       => "x-axis",
    { X: > 0, Y: > 0 } => "quadrant I",
    _              => "other"
};

Console.WriteLine(Classify(new Point(0, 0)));  // origin
Console.WriteLine(Classify(new Point(3, 4)));  // quadrant I`,
    explanation: "Property patterns match specific property values inline in a switch expression; you can combine them with relational patterns (> 0) and logical patterns (and/or/not).",
  },
  {
    id: "cs-0519-b2-pattern-relational",
    language: "csharp",
    title: "Relational and logical patterns (C# 9)",
    tag: "snippet",
    code: `static string Grade(int score) => score switch
{
    >= 90         => "A",
    >= 80 and < 90 => "B",
    >= 70 and < 80 => "C",
    >= 60 and < 70 => "D",
    _              => "F"
};

Console.WriteLine(Grade(95));  // A
Console.WriteLine(Grade(73));  // C

// 'not' pattern
static bool IsNotNull(object? x) => x is not null;`,
    explanation: "Relational patterns (>= 90) and logical combiners (and/or/not) in C# 9 express ranges and exclusions cleanly inside switch arms without boolean logic in the arm body.",
  },
  {
    id: "cs-0519-b2-span-stackalloc",
    language: "csharp",
    title: "Span<T> with stackalloc for zero-heap operations",
    tag: "snippet",
    code: `// Allocate 256 bytes on the stack — no GC pressure
Span<byte> buffer = stackalloc byte[256];
buffer.Fill(0);

// String to span without allocation
ReadOnlySpan<char> text = "Hello, World!".AsSpan();
int commaIdx = text.IndexOf(',');
ReadOnlySpan<char> greeting = text[..commaIdx];

Console.WriteLine(greeting.ToString());  // Hello

// Use Span<T> in parsing hot paths to avoid substring allocation
bool HasPrefix(ReadOnlySpan<char> input, ReadOnlySpan<char> prefix)
    => input.StartsWith(prefix, StringComparison.Ordinal);`,
    explanation: "stackalloc combined with Span<T> allocates a fixed buffer on the stack with zero GC overhead; ReadOnlySpan<char> slices into strings without allocating substring objects.",
  },
  {
    id: "cs-0519-b2-record-deconstruct",
    language: "csharp",
    title: "Record deconstruction and pattern matching",
    tag: "snippet",
    code: `record Person(string Name, int Age, string City);

var people = new[]
{
    new Person("Alice", 30, "NYC"),
    new Person("Bob", 17, "LA"),
    new Person("Carol", 25, "NYC"),
};

// Deconstruct in switch expression
var adults = people.Where(p => p is { Age: >= 18 });

// Positional deconstruction
foreach (var (name, age, city) in people)
    Console.WriteLine($"{name} ({age}) in {city}");`,
    explanation: "Positional records auto-generate a Deconstruct method, enabling tuple-style destructuring in foreach and var patterns; combine with property patterns for expressive filtering.",
  },
  {
    id: "cs-0519-b2-iasyncenumerable",
    language: "csharp",
    title: "IAsyncEnumerable<T> for async streams",
    tag: "snippet",
    code: `using System.Collections.Generic;

async IAsyncEnumerable<int> GetDataAsync()
{
    for (int i = 0; i < 5; i++)
    {
        await Task.Delay(10);   // simulate async fetch
        yield return i;
    }
}

await foreach (int item in GetDataAsync())
    Console.Write(item + " ");  // 0 1 2 3 4`,
    explanation: "IAsyncEnumerable<T> pairs yield return with await, letting you produce items one-by-one from an async source; await foreach consumes them without buffering the whole sequence.",
  },
  {
    id: "cs-0519-b2-nullable-context",
    language: "csharp",
    title: "Nullable reference types — #nullable enable",
    tag: "snippet",
    code: `#nullable enable

string  nonNull  = "hello";    // can't be null
string? nullable = null;       // explicitly nullable

// Null-forgiving operator ! suppresses the warning
int len = nullable!.Length;   // you take responsibility

// Null-conditional + null-coalescing
int safeLen = nullable?.Length ?? 0;  // 0

// Pattern for null checking
if (nullable is { } s)   // s: string (non-null)
    Console.WriteLine(s.Length);`,
    explanation: "Enabling nullable reference types makes the compiler track null-ability and warn about potential NullReferenceExceptions; ? marks nullable, ! suppresses the warning when you know it can't be null.",
  },
  {
    id: "cs-0519-b2-string-interpolation-align",
    language: "csharp",
    title: "String interpolation with alignment and format",
    tag: "snippet",
    code: `string name  = "Alice";
double score = 98.567;
int    rank  = 1;

// {expression,width:format}
Console.WriteLine($"{"Name",-10} {"Score",8} {"Rank",4}");
Console.WriteLine($"{name,-10} {score,8:F2} {rank,4}");
// Name        Score   Rank
// Alice       98.57      1

// Numeric formats
Console.WriteLine($"{1234567:N0}");   // 1,234,567
Console.WriteLine($"{0.15:P0}");      // 15%
Console.WriteLine($"{255:X4}");       // 00FF`,
    explanation: "Interpolated strings support ,width for alignment (negative = left-align) and :format for standard format specifiers — the same mini-language as string.Format.",
  },
  {
    id: "cs-0519-b2-linq-groupby",
    language: "csharp",
    title: "LINQ GroupBy and grouping projections",
    tag: "snippet",
    code: `var orders = new[]
{
    new { Item = "apple",  Region = "West", Qty = 3 },
    new { Item = "banana", Region = "East", Qty = 5 },
    new { Item = "cherry", Region = "West", Qty = 2 },
    new { Item = "date",   Region = "East", Qty = 8 },
};

var byRegion = orders
    .GroupBy(o => o.Region)
    .Select(g => new
    {
        Region = g.Key,
        Total  = g.Sum(o => o.Qty),
        Items  = g.Select(o => o.Item).ToList()
    });

foreach (var r in byRegion)
    Console.WriteLine($"{r.Region}: {r.Total} ({string.Join(",", r.Items)})");`,
    explanation: "GroupBy returns IGrouping<TKey,TElement> sequences; chaining Select with g.Key and aggregates like Sum/Count enables SQL-style GROUP BY with projections.",
  },
  {
    id: "cs-0519-b2-linq-join",
    language: "csharp",
    title: "LINQ Join and GroupJoin",
    tag: "snippet",
    code: `var customers = new[] { (Id: 1, Name: "Alice"), (Id: 2, Name: "Bob") };
var orders    = new[] { (CustId: 1, Order: "A"), (CustId: 1, Order: "B"), (CustId: 2, Order: "C") };

// Inner join
var joined = customers.Join(
    orders,
    c => c.Id,
    o => o.CustId,
    (c, o) => $"{c.Name}: {o.Order}"
);
Console.WriteLine(string.Join(", ", joined));  // Alice: A, Alice: B, Bob: C

// Left outer join via GroupJoin + SelectMany
var left = customers
    .GroupJoin(orders, c => c.Id, o => o.CustId, (c, os) => (c.Name, Orders: os))
    .SelectMany(x => x.Orders.DefaultIfEmpty(), (x, o) => $"{x.Name}:{o.Order}");`,
    explanation: "Join performs an inner join by matching keys; GroupJoin performs a left outer join by grouping matching right-side elements, then SelectMany flattens them with DefaultIfEmpty for null rows.",
  },
  {
    id: "cs-0519-b2-linq-aggregate",
    language: "csharp",
    title: "LINQ Aggregate for fold operations",
    tag: "snippet",
    code: `int[] nums = { 1, 2, 3, 4, 5 };

// Aggregate is the general fold
int product = nums.Aggregate(1, (acc, x) => acc * x);
Console.WriteLine(product);  // 120

// Build a string left-to-right
string joined = nums.Aggregate("", (s, n) => s + (s.Length > 0 ? "," : "") + n);
Console.WriteLine(joined);   // 1,2,3,4,5

// Three-arg overload for result projection
string result = nums.Aggregate(
    seed: 0,
    func: (sum, n) => sum + n,
    resultSelector: sum => $"Total={sum}"
);
Console.WriteLine(result);   // Total=15`,
    explanation: "Aggregate is LINQ's fold: it accumulates a value by applying a function to each element; the three-argument form separates the seed type from the result type, enabling type-changing folds.",
  },
  {
    id: "cs-0519-b2-expression-bodied",
    language: "csharp",
    title: "Expression-bodied members (C# 6+)",
    tag: "snippet",
    code: `class Circle
{
    public double Radius { get; }
    public Circle(double r) => Radius = r;   // ctor

    public double Area         => Math.PI * Radius * Radius;   // property
    public double Circumference => 2 * Math.PI * Radius;        // property

    public string Describe() => $"Circle(r={Radius:F2})";       // method
    public override string ToString() => Describe();            // override
}

var c = new Circle(5);
Console.WriteLine(c.Area);        // 78.54...
Console.WriteLine(c.Describe());  // Circle(r=5.00)`,
    explanation: "Expression-bodied members use => to define single-expression constructors, methods, properties, and operators, reducing boilerplate for simple members that are just returning or assigning.",
  },
  {
    id: "cs-0519-b2-deconstruct-custom",
    language: "csharp",
    title: "Custom Deconstruct method",
    tag: "snippet",
    code: `class Rectangle
{
    public double Width  { get; }
    public double Height { get; }
    public Rectangle(double w, double h) => (Width, Height) = (w, h);

    // Enable tuple-style deconstruction
    public void Deconstruct(out double width, out double height)
        => (width, height) = (Width, Height);
}

var rect = new Rectangle(3, 4);
var (w, h) = rect;        // calls Deconstruct
Console.WriteLine(w * h); // 12

// Also works in switch expressions
string Classify(Rectangle r) => r switch
{
    var (w, h) when w == h => "square",
    _ => "rectangle"
};`,
    explanation: "Defining a Deconstruct method (out parameters, no return value) enables tuple-style var (a, b) = obj deconstruction in assignments, foreach, and switch expressions.",
  },
  {
    id: "cs-0519-b2-caller-attributes",
    language: "csharp",
    title: "CallerMemberName / CallerFilePath / CallerLineNumber",
    tag: "snippet",
    code: `using System.Runtime.CompilerServices;

void Log(
    string message,
    [CallerMemberName] string member = "",
    [CallerFilePath]   string file   = "",
    [CallerLineNumber] int    line   = 0)
{
    Console.WriteLine($"{file}:{line} [{member}] {message}");
}

void Foo()
{
    Log("starting");   // no need to pass caller info manually
}

Foo();
// Program.cs:14 [Foo] starting`,
    explanation: "Compiler attributes [CallerMemberName], [CallerFilePath], [CallerLineNumber] inject call-site information as default argument values, enabling diagnostic logging without reflection or nameof.",
  },
  {
    id: "cs-0519-b2-generic-math",
    language: "csharp",
    title: "Generic math with INumber<T> (C# 11 / .NET 7)",
    tag: "snippet",
    code: `using System.Numerics;

static T Sum<T>(IEnumerable<T> items) where T : INumber<T>
{
    T total = T.Zero;
    foreach (var item in items)
        total += item;
    return total;
}

Console.WriteLine(Sum(new int[]    { 1, 2, 3 }));    // 6
Console.WriteLine(Sum(new double[] { 1.1, 2.2 }));   // 3.3
Console.WriteLine(Sum(new decimal[] { 1.5m, 2.5m })); // 4.0

// INumber<T> also provides T.One, T.MinValue, T.MaxValue, etc.`,
    explanation: "The INumber<T> interface (.NET 7) enables truly generic numeric algorithms; the compiler resolves operators like + via the interface so the same method works with int, double, decimal, and custom numeric types.",
  },
  {
    id: "cs-0519-b2-channel",
    language: "csharp",
    title: "System.Threading.Channels for async producer-consumer",
    tag: "snippet",
    code: `using System.Threading.Channels;

var channel = Channel.CreateBounded<int>(capacity: 10);

// Producer
_ = Task.Run(async () =>
{
    for (int i = 0; i < 20; i++)
    {
        await channel.Writer.WriteAsync(i);
    }
    channel.Writer.Complete();
});

// Consumer
await foreach (int item in channel.Reader.ReadAllAsync())
    Console.Write(item + " ");  // 0 1 2 ... 19`,
    explanation: "Channels provide a thread-safe, backpressure-aware async queue; CreateBounded limits the buffer so the writer awaits when full, naturally throttling producers relative to consumers.",
  },
  {
    id: "cs-0519-b2-source-generator-hint",
    language: "csharp",
    title: "partial class and methods for source generators",
    tag: "snippet",
    code: `// Declare the partial method; source generator provides the implementation
partial class MyModel
{
    public string Name { get; set; } = "";

    // partial method: generator fills this in
    partial void OnNameChanged(string oldValue, string newValue);

    public void SetName(string value)
    {
        string old = Name;
        Name = value;
        OnNameChanged(old, value);  // calls generated code
    }
}

// Generator-side (different file, same class):
// partial class MyModel
// {
//     partial void OnNameChanged(string oldValue, string newValue)
//         => Console.WriteLine($"Changed: {oldValue} -> {newValue}");
// }`,
    explanation: "partial methods declare an optional hook that the calling code can use even when no implementation exists; source generators provide the implementation in a generated file.",
  },
  {
    id: "cs-0519-b2-unsafe-pointer",
    language: "csharp",
    title: "Unsafe pointer arithmetic",
    tag: "snippet",
    code: `unsafe void XorBuffer(byte[] data, byte key)
{
    fixed (byte* ptr = data)  // pin the array to prevent GC moving it
    {
        byte* p = ptr;
        byte* end = ptr + data.Length;
        while (p < end)
        {
            *p ^= key;
            p++;
        }
    }
}

byte[] buf = { 0x01, 0x02, 0x03 };
// Requires: project compiled with /unsafe or <AllowUnsafeBlocks>true</AllowUnsafeBlocks>
// (conceptual — cannot call directly without unsafe context)`,
    explanation: "unsafe blocks let you use C-style pointer arithmetic; fixed pins a managed array in memory so the GC doesn't move it while the pointer is live — needed for interop with native code.",
  },
  {
    id: "cs-0519-b2-interpolated-verbatim",
    language: "csharp",
    title: "Verbatim interpolated strings @$",
    tag: "snippet",
    code: `string folder = "C:\\\\Users\\\\Alice";
string file   = "report.csv";

// Regular interpolated: needs escape sequences
string path1 = $"C:\\\\Users\\\\Alice\\\\{file}";

// Verbatim (@): no escape sequences, but can't use \\n
string path2 = @$"C:\Users\Alice\{file}";   // @ then $

// Also valid: $@
string path3 = $@"C:\Users\Alice\{file}";

Console.WriteLine(path2);   // C:\Users\Alice\report.csv`,
    explanation: "Combining $ (interpolation) with @ (verbatim) gives you string interpolation without backslash escaping, which is cleaner for Windows paths and regex patterns.",
  },
  {
    id: "cs-0519-b2-object-initializer",
    language: "csharp",
    title: "Object and collection initializers",
    tag: "snippet",
    code: `// Object initializer
var p = new System.Drawing.Point { X = 10, Y = 20 };

// Nested object initializer
class Address { public string City { get; set; } = ""; }
class Person  { public string Name { get; set; } = ""; public Address Address { get; set; } = new(); }

var alice = new Person
{
    Name    = "Alice",
    Address = { City = "NYC" }   // nested initializer
};

// Collection initializer (calls Add)
var nums = new List<int> { 1, 2, 3, 4, 5 };

// Dictionary initializer
var map = new Dictionary<string, int> { ["a"] = 1, ["b"] = 2 };`,
    explanation: "Object initializers set public writable properties/fields without needing constructor overloads; collection initializers call Add for each element; dictionary initializers use the indexer.",
  },
  {
    id: "cs-0519-b2-anonymous-types",
    language: "csharp",
    title: "Anonymous types with var",
    tag: "snippet",
    code: `// Compiler generates a class with read-only properties
var point = new { X = 3, Y = 4 };
Console.WriteLine(point.X);  // 3
// point.X = 5;  // compile error — anonymous types are read-only

// Projection in LINQ
var customers = new[] { ("Alice", 30, "NYC"), ("Bob", 25, "LA") };
var result = customers
    .Select(c => new { Name = c.Item1, Age = c.Item2 })
    .Where(c => c.Age > 20);

foreach (var c in result)
    Console.WriteLine(c);`,
    explanation: "Anonymous types create read-only objects on the fly; the compiler generates equality and GetHashCode based on all properties, making them useful for LINQ projections where a named class would be overkill.",
  },
  {
    id: "cs-0519-b2-index-initializer",
    language: "csharp",
    title: "Index initializers for dict-like types",
    tag: "snippet",
    code: `// Standard dictionary initializer
var d1 = new Dictionary<string, int>
{
    { "a", 1 },
    { "b", 2 }
};

// Index initializer (C# 6) — cleaner for string keys
var d2 = new Dictionary<string, int>
{
    ["first"]  = 1,
    ["second"] = 2,
    ["third"]  = 3
};

// Works with any type that has an indexer + Add
// Including custom types`,
    explanation: "Index initializers use [key] = value syntax inside {} and call the indexer setter; they're cleaner than { { k, v } } when keys are long strings or complex expressions.",
  },
  {
    id: "cs-0519-b2-target-typed-new",
    language: "csharp",
    title: "Target-typed new expressions (C# 9)",
    tag: "snippet",
    code: `// C# 9: 'new()' without the type name when type is known from context
List<int> items = new();             // same as new List<int>()
Dictionary<string, int> map = new(); // same as new Dictionary<...>()

// In method parameters
void Process(List<string> names) { }
Process(new() { "Alice", "Bob" });   // new List<string> { ... }

// In return statements
List<int> GetNums()
{
    return new() { 1, 2, 3 };       // type inferred from return type
}`,
    explanation: "Target-typed new() infers the type from the left-hand side or method signature, reducing repetition especially for long generic types — without losing any type information.",
  },
  {
    id: "cs-0519-b2-coalescing-chain",
    language: "csharp",
    title: "Null-conditional chaining with ?. and ?[]",
    tag: "snippet",
    code: `class Order
{
    public Customer? Customer { get; set; }
}
class Customer
{
    public string? Name { get; set; }
    public List<string>? Tags { get; set; }
}

Order? order = null;

// Safe chain — each ?. short-circuits on null
string? city = order?.Customer?.Name?.ToUpper();
Console.WriteLine(city ?? "none");  // none

// Null-conditional indexer
Order? o2 = new Order { Customer = new Customer { Tags = new() { "vip" } } };
string? tag = o2?.Customer?.Tags?[0];
Console.WriteLine(tag);  // vip`,
    explanation: "?. and ?[] short-circuit the entire chain and return null if any step is null, eliminating deeply nested null checks while keeping the expression readable.",
  },
  {
    id: "cs-0519-b2-enum-flags-csharp",
    language: "csharp",
    title: "[Flags] enum for bitfield permissions",
    tag: "snippet",
    code: `[Flags]
enum Permission
{
    None    = 0,
    Read    = 1 << 0,   // 1
    Write   = 1 << 1,   // 2
    Execute = 1 << 2,   // 4
    All     = Read | Write | Execute
}

Permission user = Permission.Read | Permission.Write;
Console.WriteLine(user);              // Read, Write
Console.WriteLine(user.HasFlag(Permission.Read));    // True
Console.WriteLine(user.HasFlag(Permission.Execute)); // False

user |= Permission.Execute;           // add permission
user &= ~Permission.Write;            // remove permission`,
    explanation: "[Flags] makes ToString() show combined names instead of a number; assign powers of 2 explicitly so each bit represents a single permission and combinations remain distinct.",
  },
  {
    id: "cs-0519-b2-tuple-return",
    language: "csharp",
    title: "Named tuple return values",
    tag: "snippet",
    code: `// Return multiple values without an out param or a class
static (double Min, double Max, double Avg) Stats(double[] data)
{
    double min = data.Min(), max = data.Max();
    return (min, max, data.Average());
}

var (min, max, avg) = Stats(new[] { 1.0, 5.0, 3.0, 2.0, 4.0 });
Console.WriteLine($"Min={min} Max={max} Avg={avg}");
// Min=1 Max=5 Avg=3

// Access by name if not destructuring
var stats = Stats(new[] { 1.0, 2.0 });
Console.WriteLine(stats.Avg);  // 1.5`,
    explanation: "Named tuples in return types give both caller and callee readable names; they're lightweight alternatives to creating a result class for internal method returns.",
  },
  {
    id: "cs-0519-b2-local-function",
    language: "csharp",
    title: "Local functions for helper methods",
    tag: "snippet",
    code: `int Factorial(int n)
{
    if (n < 0) throw new ArgumentException("n must be >= 0");

    // Local function: visible only inside Factorial
    // Can access outer variables (n above)
    return Core(n);

    int Core(int x) => x <= 1 ? 1 : x * Core(x - 1);
}

Console.WriteLine(Factorial(5));  // 120

// Benefits over lambdas:
// 1. Can be recursive naturally
// 2. No delegate allocation
// 3. Can have generic type parameters`,
    explanation: "Local functions are full methods nested inside another method; unlike lambdas they're not delegate-backed (no allocation), support recursion naturally, and can be generic.",
  },
  {
    id: "cs-0519-b2-collection-expressions",
    language: "csharp",
    title: "Collection expressions (C# 12)",
    tag: "snippet",
    code: `// Unified syntax for creating collections
int[] array  = [1, 2, 3, 4, 5];
List<int> list = [1, 2, 3];
Span<int> span = [1, 2, 3];

// Spread operator ..
int[] first = [1, 2, 3];
int[] second = [4, 5, 6];
int[] combined = [..first, ..second, 7];
Console.WriteLine(combined.Length);  // 7

// Works with IEnumerable<T> targets too
IEnumerable<string> names = ["Alice", "Bob"];`,
    explanation: "Collection expressions (C# 12) provide a uniform [] literal syntax for arrays, lists, spans, and any type with a Create method; .. spreads one collection into another.",
  },
  {
    id: "cs-0519-b2-primary-constructor",
    language: "csharp",
    title: "Primary constructors for classes (C# 12)",
    tag: "snippet",
    code: `// Primary constructor — parameters available throughout the class body
class Logger(string name, bool verbose)
{
    // Parameters used directly in methods and initializers
    private readonly string _prefix = $"[{name}]";

    public void Log(string msg)
    {
        if (verbose)
            Console.WriteLine($"{_prefix} DEBUG: {msg}");
        Console.WriteLine($"{_prefix} {msg}");
    }
}

var log = new Logger("App", verbose: true);
log.Log("started");`,
    explanation: "Class primary constructors (C# 12) place constructor parameters at the class level, usable in field initializers and method bodies — avoiding boilerplate constructor-to-field assignments.",
  },
  {
    id: "cs-0519-b2-linq-zip",
    language: "csharp",
    title: "LINQ Zip and Zip with result selector",
    tag: "snippet",
    code: `int[]    ids   = { 1, 2, 3 };
string[] names = { "Alice", "Bob", "Carol" };
double[] scores = { 90.5, 85.0, 92.1 };

// Two-sequence Zip
var pairs = ids.Zip(names, (id, name) => $"{id}:{name}");
Console.WriteLine(string.Join(", ", pairs));  // 1:Alice, 2:Bob, 3:Carol

// Three-sequence Zip (.NET 6+)
var triples = ids.Zip(names).Zip(scores, (pair, score) =>
    new { Id = pair.First, Name = pair.Second, Score = score });

foreach (var t in triples)
    Console.WriteLine($"{t.Id} {t.Name} {t.Score}");`,
    explanation: "Zip pairs elements from two sequences by index; a result-selector lambda transforms each pair into the output type; three-sequence Zip (.NET 6) avoids chaining Zip+Zip.",
  },
  {
    id: "cs-0519-b2-linq-chunk",
    language: "csharp",
    title: "LINQ Chunk for batching (.NET 6+)",
    tag: "snippet",
    code: `int[] data = Enumerable.Range(1, 10).ToArray();

// Split into batches of size N
foreach (int[] batch in data.Chunk(3))
    Console.WriteLine(string.Join(",", batch));
// 1,2,3
// 4,5,6
// 7,8,9
// 10

// Useful for bulk DB inserts, rate-limited API calls, etc.
var requests = Enumerable.Range(1, 100);
foreach (var batch in requests.Chunk(10))
{
    // Process batch of 10 at a time
}`,
    explanation: "Chunk(n) splits an IEnumerable into arrays of at most n elements; the last chunk may be smaller, and the method is lazy (it yields one chunk at a time from the source).",
  },
  {
    id: "cs-0519-b2-stringcomparison-ordinal",
    language: "csharp",
    title: "StringComparison: why you should always specify it",
    tag: "caveats",
    code: `// Without StringComparison: uses CurrentCulture (locale-dependent!)
bool eq1 = "hello".Equals("HELLO", StringComparison.CurrentCultureIgnoreCase);

// Turkish locale: "I".ToLower() == "ı" (dotless i), not "i"
// This can break "http" comparisons, file extension checks, etc.

// Always use Ordinal for programmatic comparisons
bool eq2 = "hello".Equals("HELLO", StringComparison.OrdinalIgnoreCase);

// For sorting user-visible text: use CurrentCulture
// For dictionary keys, protocol parsing: use Ordinal

var dict = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
dict["Key"] = 1;
Console.WriteLine(dict["key"]); // 1`,
    explanation: "Not specifying StringComparison uses CurrentCulture, which can give surprising results in non-English locales (Turkish I, German ß); always specify Ordinal for code and IDs.",
  },
  {
    id: "cs-0519-b2-using-ienumerable-trap",
    language: "csharp",
    title: "IEnumerable<T> multiple enumeration trap",
    tag: "caveats",
    code: `IEnumerable<int> GetData()
{
    Console.WriteLine("Querying...");
    return Enumerable.Range(1, 5);  // lazy
}

var data = GetData();   // no execution yet

// First enumeration
Console.WriteLine(data.Count());  // Querying...  5

// Second enumeration — re-executes the source!
Console.WriteLine(data.First());  // Querying...  1

// Fix: materialise once
var cached = GetData().ToList();  // Querying... (once)
Console.WriteLine(cached.Count); // 5 (no re-query)`,
    explanation: "IEnumerable<T> is lazy and has no memory; iterating it twice re-executes the producer (which may re-query a database or re-read a file); ToList/ToArray materialises it once for safe reuse.",
  },
  {
    id: "cs-0519-b2-value-type-interface",
    language: "csharp",
    title: "Interface constraint avoids boxing for structs",
    tag: "caveats",
    code: `interface IValue { int Get(); }
struct Wrapper : IValue
{
    public int Value;
    public int Get() => Value;
}

// Calling via interface reference BOXES the struct
IValue iv = new Wrapper { Value = 42 };  // boxes!
Console.WriteLine(iv.Get());  // 42 but allocated on heap

// Generic constraint avoids boxing
static int CallGeneric<T>(T v) where T : IValue
    => v.Get();  // no boxing — called directly on stack value

var w = new Wrapper { Value = 42 };
Console.WriteLine(CallGeneric(w));  // 42, no allocation`,
    explanation: "Assigning a struct to an interface variable boxes it; a generic method with an interface constraint avoids boxing because the compiler generates type-specific code for each T.",
  },
  {
    id: "cs-0519-b2-string-concat-perf",
    language: "csharp",
    title: "string + in loops allocates O(n²) memory",
    tag: "caveats",
    code: `// BAD: each + creates a new string — O(n²) allocations
string bad = "";
for (int i = 0; i < 10000; i++)
    bad += i.ToString();   // 10000 allocations!

// GOOD: StringBuilder amortises — O(n) allocations
var sb = new System.Text.StringBuilder();
for (int i = 0; i < 10000; i++)
    sb.Append(i);
string good = sb.ToString();

// GOOD: string.Join for known collections
string joined = string.Join(",", Enumerable.Range(0, 10000));`,
    explanation: "Concatenating strings with + in a loop creates a new string object on every iteration; StringBuilder's internal buffer doubles when full, giving amortised O(1) append.",
  },
  {
    id: "cs-0519-b2-finalizer-suppress",
    language: "csharp",
    title: "GC.SuppressFinalize when Dispose runs first",
    tag: "caveats",
    code: `class Resource : IDisposable
{
    private bool _disposed;

    ~Resource()
    {
        // Finalizer: called by GC if Dispose was never called
        Dispose(false);
        Console.WriteLine("Finalized (Dispose was NOT called)");
    }

    public void Dispose()
    {
        Dispose(true);
        // Tell GC: no need to call the finalizer, we already cleaned up
        GC.SuppressFinalize(this);
    }

    private void Dispose(bool disposing) { /* cleanup */ }
}`,
    explanation: "GC.SuppressFinalize removes an object from the finalization queue; without it, the GC still runs the finalizer after Dispose, wasting time double-cleaning an already-released object.",
  },
  {
    id: "cs-0519-b2-lock-statement",
    language: "csharp",
    title: "lock statement and Monitor equivalence",
    tag: "caveats",
    code: `class Counter
{
    private int _count;
    private readonly object _lock = new();

    public void Increment()
    {
        lock (_lock)   // Monitor.Enter + Monitor.Exit in try/finally
        {
            _count++;
        }
    }

    public int Value
    {
        get { lock (_lock) { return _count; } }
    }
}

// DON'T lock on: this, typeof(T), or string literals
// They can be locked by external code, causing deadlocks`,
    explanation: "lock compiles to Monitor.Enter/Exit wrapped in try/finally; always lock on a private readonly object to prevent outsiders from accidentally locking on the same object.",
  },
  {
    id: "cs-0519-b2-ref-return",
    language: "csharp",
    title: "ref return and ref local for alias to data",
    tag: "types",
    code: `static ref int FindFirst(int[] arr, int target)
{
    for (int i = 0; i < arr.Length; i++)
        if (arr[i] == target) return ref arr[i];  // ref to element
    throw new KeyNotFoundException();
}

int[] data = { 1, 2, 3, 4, 5 };

// ref local: alias into the array element
ref int element = ref FindFirst(data, 3);
element = 99;   // modifies the array in place

Console.WriteLine(data[2]);  // 99`,
    explanation: "ref returns let a method return a managed reference to a location (array element, field, local) rather than a copy; the caller can then modify the original through the ref alias.",
  },
  {
    id: "cs-0519-b2-readonly-field",
    language: "csharp",
    title: "readonly fields and in-place initialization",
    tag: "types",
    code: `class Config
{
    // readonly: can only be assigned in declaration or constructor
    public readonly string Host;
    public readonly int Port;

    // Inline initializer — runs before constructor body
    public readonly string Protocol = "https";

    public Config(string host, int port)
    {
        Host = host;
        Port = port;
        // Protocol = "https"; // could be set here too
    }
}

var cfg = new Config("example.com", 443);
// cfg.Host = "other"; // compile error`,
    explanation: "readonly fields can only be assigned in the declaration or the constructor; unlike const they're evaluated at runtime and can hold reference-type values.",
  },
  {
    id: "cs-0519-b2-const-vs-static-readonly",
    language: "csharp",
    title: "const vs static readonly — compile-time vs runtime",
    tag: "types",
    code: `class Settings
{
    // const: baked into consuming assemblies at compile time
    public const int MaxItems = 100;

    // static readonly: evaluated once at runtime, not baked in
    public static readonly DateTime BuildTime = DateTime.UtcNow;
    public static readonly string[] Supported = { "json", "xml" };
}

// Changing MaxItems in the library requires recompiling all consumers
// (they have the value 100 baked in, not a reference to the field)

// Arrays can't be const — use static readonly
// const int[] Bad = { 1, 2 };  // compile error`,
    explanation: "const values are substituted at compile time (breaking consumers when changed without recompile); static readonly is computed once at runtime and changes automatically when the assembly is updated.",
  },
  {
    id: "cs-0519-b2-implicit-explicit-conv",
    language: "csharp",
    title: "Implicit vs explicit conversion operators",
    tag: "types",
    code: `struct Celsius
{
    public double Value;
    public Celsius(double v) => Value = v;

    // Implicit: no cast required (safe, no data loss)
    public static implicit operator double(Celsius c) => c.Value;

    // Explicit: cast required (may lose data or throw)
    public static explicit operator Celsius(double d) => new(d);
}

Celsius c = new(100.0);
double d = c;                // implicit — OK, no cast
Celsius c2 = (Celsius)d;    // explicit — cast required`,
    explanation: "implicit conversions should never lose information or throw; explicit conversions (requiring a cast) signal that data loss or failure is possible and the caller must acknowledge the risk.",
  },
  {
    id: "cs-0519-b2-generic-variance-interface",
    language: "csharp",
    title: "Covariance and contravariance in custom interfaces",
    tag: "types",
    code: `// Covariant: out T means T only appears in output positions
interface IProducer<out T>
{
    T Produce();
}

// Contravariant: in T means T only appears in input positions
interface IConsumer<in T>
{
    void Consume(T item);
}

class StringProducer : IProducer<string>
{
    public string Produce() => "hello";
}

IProducer<object> p = new StringProducer();  // covariant: string -> object
Console.WriteLine(p.Produce());  // hello`,
    explanation: "Declaring out T allows assigning IProducer<Derived> to IProducer<Base>; declaring in T allows assigning IConsumer<Base> to IConsumer<Derived> — only safe because T is restricted to output or input positions respectively.",
  },
  {
    id: "cs-0519-b2-generic-where-notnull",
    language: "csharp",
    title: "where T : notnull constraint",
    tag: "types",
    code: `#nullable enable

// notnull: T can be any non-nullable type (value or reference)
static void Process<T>(T value) where T : notnull
{
    Console.WriteLine(value.ToString());  // safe — no null check needed
}

Process(42);       // OK: int is non-nullable
Process("hello");  // OK: string is non-null here

// Process<string?>(null);  // Compile warning: violates notnull`,
    explanation: "The notnull constraint accepts both non-nullable reference types (with nullable context enabled) and value types, ensuring the generic method never receives a null argument.",
  },
  {
    id: "cs-0519-b2-discriminated-union-pattern",
    language: "csharp",
    title: "Discriminated union pattern via records",
    tag: "types",
    code: `abstract record Shape;
record Circle(double Radius) : Shape;
record Rectangle(double Width, double Height) : Shape;
record Triangle(double Base, double Height) : Shape;

double Area(Shape s) => s switch
{
    Circle c     => Math.PI * c.Radius * c.Radius,
    Rectangle r  => r.Width * r.Height,
    Triangle t   => 0.5 * t.Base * t.Height,
    _            => throw new ArgumentException("Unknown shape")
};

Console.WriteLine(Area(new Circle(5)));        // 78.54
Console.WriteLine(Area(new Rectangle(3, 4)));  // 12`,
    explanation: "Sealing a record hierarchy with an abstract base and concrete records simulates discriminated unions; switch exhaustiveness checking flags missing cases when all subtypes are in the same assembly.",
  },
  {
    id: "cs-0519-b2-ienumerable-lazy",
    language: "csharp",
    title: "yield return for lazy IEnumerable<T>",
    tag: "families",
    code: `static IEnumerable<int> Fibonacci()
{
    int a = 0, b = 1;
    while (true)
    {
        yield return a;
        (a, b) = (b, a + b);
    }
}

// Take the first 10 Fibonacci numbers
foreach (int f in Fibonacci().Take(10))
    Console.Write(f + " ");  // 0 1 1 2 3 5 8 13 21 34`,
    explanation: "yield return produces an IEnumerable<T> whose body runs on demand; each call to MoveNext advances execution to the next yield, enabling infinite sequences without infinite memory.",
  },
  {
    id: "cs-0519-b2-task-whenall",
    language: "csharp",
    title: "Task.WhenAll vs Task.WhenAny",
    tag: "families",
    code: `async Task<string> Fetch(string url)
{
    await Task.Delay(100);  // simulate
    return $"data:{url}";
}

// WhenAll: await all tasks, get array of results
string[] all = await Task.WhenAll(
    Fetch("api/a"), Fetch("api/b"), Fetch("api/c"));
Console.WriteLine(all.Length);  // 3

// WhenAny: complete as soon as first task finishes
Task<string> first = await Task.WhenAny(
    Fetch("api/a"), Fetch("api/b"), Fetch("api/c"));
Console.WriteLine(await first);  // data:api/a (or whichever finished first)`,
    explanation: "WhenAll waits for all tasks to finish and returns results in input order; WhenAny returns the first Task that completes, useful for timeouts or racing multiple data sources.",
  },
  {
    id: "cs-0519-b2-parallel-for",
    language: "csharp",
    title: "Parallel.For vs Task.WhenAll for CPU-bound work",
    tag: "families",
    code: `int[] data = Enumerable.Range(0, 1_000_000).ToArray();
long sum = 0;

// Parallel.For: partitions work across threads, shared result via Interlocked
Parallel.For(0, data.Length, () => 0L,
    (i, _, local) => local + data[i],
    local => Interlocked.Add(ref sum, local));

Console.WriteLine(sum);   // 499999500000

// Task.WhenAll: better for I/O-bound tasks (awaiting network/disk)
// Parallel.For: better for CPU-bound computation
var tasks = data.Chunk(1000).Select(chunk => Task.Run(() => chunk.Sum(x => (long)x)));
long total = (await Task.WhenAll(tasks)).Sum();`,
    explanation: "Parallel.For uses thread-pool partitioning and is optimised for CPU-bound work; Task.WhenAll with Task.Run is better for I/O-bound tasks where threads spend time waiting.",
  },
  {
    id: "cs-0519-b2-enumerable-range",
    language: "csharp",
    title: "Enumerable.Range and Repeat",
    tag: "families",
    code: `// Range: generates a sequence of consecutive ints
var nums = Enumerable.Range(1, 5);  // 1 2 3 4 5 (start, count)
Console.WriteLine(string.Join(",", nums));  // 1,2,3,4,5

// Repeat: repeats a single value N times
var zeros = Enumerable.Repeat(0, 5);
Console.WriteLine(string.Join(",", zeros));  // 0,0,0,0,0

// Generate: like Range but with a factory function (.NET 6+)
var squares = Enumerable.Range(1, 5).Select(n => n * n);
Console.WriteLine(string.Join(",", squares));  // 1,4,9,16,25

// Initialize a 2D jagged array
var grid = Enumerable.Range(0, 3).Select(_ => new int[3]).ToArray();`,
    explanation: "Enumerable.Range and Repeat create simple sequences without a loop; Range(start, count) starts at start and generates count consecutive integers (not an exclusive end).",
  },
  {
    id: "cs-0519-b2-memory-stream-recycling",
    language: "csharp",
    title: "MemoryStream recycling with GetBuffer / ToArray",
    tag: "families",
    code: `using var ms = new System.IO.MemoryStream();
ms.Write(new byte[] { 1, 2, 3 });

// ToArray: returns a copy (safe, correct size)
byte[] copy = ms.ToArray();
Console.WriteLine(copy.Length);  // 3

// GetBuffer: returns the internal buffer (may be larger!)
byte[] raw = ms.GetBuffer();
Console.WriteLine(raw.Length);   // 256 (internal capacity, not data length)
// Use ms.Length for the actual data size: 3

// Seeking for re-reading
ms.Position = 0;
int b = ms.ReadByte();  // 1`,
    explanation: "GetBuffer returns the internal backing array which may be larger than the written data; always use ms.Position or ms.Length rather than buffer.Length when working with MemoryStream contents.",
  },
  {
    id: "cs-0519-b2-abstract-override-sealed",
    language: "csharp",
    title: "Sealed override on a specific method",
    tag: "classes",
    code: `class Vehicle
{
    public virtual string FuelType() => "gasoline";
    public virtual string Drive() => "on road";
}

class ElectricCar : Vehicle
{
    // sealed override: ElectricCar subclasses cannot re-override this
    public sealed override string FuelType() => "electric";

    // Drive() still virtual — subclasses can override it
    public override string Drive() => "quietly";
}

class PerformanceEV : ElectricCar
{
    // public override string FuelType() => ...;  // compile error!
    public override string Drive() => "fast";     // OK
}`,
    explanation: "sealed override stops a specific virtual method from being overridden further down the hierarchy while leaving other virtual methods open; the JIT can inline sealed calls more aggressively.",
  },
  {
    id: "cs-0519-b2-generic-interface-impl",
    language: "csharp",
    title: "Implementing a generic interface with constraints",
    tag: "classes",
    code: `interface IRepository<T> where T : class
{
    T? Get(int id);
    void Save(T entity);
    IEnumerable<T> GetAll();
}

class InMemoryRepo<T> : IRepository<T> where T : class
{
    private readonly Dictionary<int, T> _store = new();
    private int _nextId = 1;

    public T? Get(int id) => _store.GetValueOrDefault(id);
    public void Save(T entity) => _store[_nextId++] = entity;
    public IEnumerable<T> GetAll() => _store.Values;
}

var repo = new InMemoryRepo<string>();
repo.Save("hello");
Console.WriteLine(repo.Get(1));  // hello`,
    explanation: "Generic interfaces with constraints propagate those constraints to implementing classes; the class may add further constraints but cannot remove or weaken the interface's constraints.",
  },
  {
    id: "cs-0519-b2-object-pool",
    language: "csharp",
    title: "ObjectPool<T> to reduce allocations",
    tag: "classes",
    code: `using Microsoft.Extensions.ObjectPool;

// ObjectPool: reuse expensive-to-create objects
var policy = new DefaultPooledObjectPolicy<System.Text.StringBuilder>();
var pool   = new DefaultObjectPool<System.Text.StringBuilder>(policy, maximumRetained: 16);

string Build(string[] parts)
{
    var sb = pool.Get();
    try
    {
        sb.Clear();
        foreach (var p in parts) sb.Append(p);
        return sb.ToString();
    }
    finally
    {
        pool.Return(sb);  // return to pool for reuse
    }
}

Console.WriteLine(Build(new[] { "Hello", ", ", "World!" }));`,
    explanation: "ObjectPool<T> maintains a pool of pre-allocated objects that are leased and returned; it's the right pattern for reusing StringBuilder, byte arrays, and other objects in hot paths.",
  },
  {
    id: "cs-0519-b2-lazy-singleton",
    language: "csharp",
    title: "Thread-safe lazy singleton with Lazy<T>",
    tag: "classes",
    code: `class Singleton
{
    // Lazy<T> with LazyThreadSafetyMode.ExecutionAndPublication
    // is thread-safe and runs the factory exactly once
    private static readonly Lazy<Singleton> _lazy =
        new(() => new Singleton());

    public static Singleton Instance => _lazy.Value;

    private Singleton()
    {
        Console.WriteLine("Singleton created");
    }

    public void DoWork() => Console.WriteLine("Working");
}

// Thread-safe — factory runs exactly once
var a = Singleton.Instance;  // Singleton created
var b = Singleton.Instance;  // (no output — cached)
Console.WriteLine(ReferenceEquals(a, b));  // True`,
    explanation: "Lazy<T> defaults to ExecutionAndPublication thread-safety mode, ensuring the factory runs exactly once even with concurrent access — the clearest way to implement lazy initialization in C#.",
  },
  {
    id: "cs-0519-b2-interface-static-abstract",
    language: "csharp",
    title: "Static abstract interface members (C# 11)",
    tag: "classes",
    code: `interface ICreatable<T> where T : ICreatable<T>
{
    // Implementing types must provide a static Create method
    static abstract T Create();
}

class Widget : ICreatable<Widget>
{
    public string Name { get; set; } = "default";
    public static Widget Create() => new Widget();
}

// Generic factory — knows T has a Create method
static T MakeOne<T>() where T : ICreatable<T>
    => T.Create();

var w = MakeOne<Widget>();
Console.WriteLine(w.Name);  // default`,
    explanation: "Static abstract interface members let interfaces define contracts for static methods (including operators and factories); combined with the Self-referential T : ICreatable<T> pattern, they enable generic factories.",
  },
  {
    id: "cs-0519-b2-string-create",
    language: "csharp",
    title: "string.Create for zero-allocation string building",
    tag: "snippet",
    code: `// string.Create avoids an intermediate buffer allocation
static string FormatHex(ReadOnlySpan<byte> bytes)
{
    return string.Create(bytes.Length * 2, bytes, static (span, data) =>
    {
        const string hex = "0123456789abcdef";
        for (int i = 0; i < data.Length; i++)
        {
            span[i * 2]     = hex[data[i] >> 4];
            span[i * 2 + 1] = hex[data[i] & 0xF];
        }
    });
}

byte[] data = { 0xDE, 0xAD, 0xBE, 0xEF };
Console.WriteLine(FormatHex(data));  // deadbeef`,
    explanation: "string.Create allocates the string and writes directly into its underlying char buffer via a Span<char>, avoiding the extra allocation that StringBuilder.ToString() would need.",
  },
  {
    id: "cs-0519-b2-delegate-vs-interface",
    language: "csharp",
    title: "Delegate vs single-method interface",
    tag: "families",
    code: `// Old style: SAM interface
interface ITransform { int Apply(int value); }

// Modern style: delegate type (or Func<>)
delegate int Transform(int value);
// Func<int, int> is identical and preferred

// Using Func<T,TResult>
static int[] MapAll(int[] data, Func<int, int> fn)
    => data.Select(fn).ToArray();

// Lambda or method group
int[] doubled = MapAll(new[] {1, 2, 3}, x => x * 2);
int[] squared = MapAll(new[] {1, 2, 3}, x => x * x);

Console.WriteLine(string.Join(",", doubled));  // 2,4,6`,
    explanation: "For single-method functional abstractions prefer Func/Action over custom delegate types or SAM interfaces; Func<T,TResult> is the lingua franca that all LINQ methods and callers understand.",
  },
  {
    id: "cs-0519-b2-overload-resolution",
    language: "csharp",
    title: "Overload resolution and ambiguity",
    tag: "understanding",
    code: `class Printer
{
    public void Print(int n)    => Console.WriteLine($"int: {n}");
    public void Print(long n)   => Console.WriteLine($"long: {n}");
    public void Print(object o) => Console.WriteLine($"object: {o}");
}

var p = new Printer();
p.Print(42);         // int: 42  (exact match beats widening)
p.Print(42L);        // long: 42
p.Print("hello");    // object: hello

// Ambiguity example
// p.Print(null);    // CS0121: ambiguous between int/long/object
p.Print((object)null);   // explicit cast resolves it`,
    explanation: "C# overload resolution picks the most specific match: exact type > implicit widening > boxing/interface; when two candidates are equally specific, an explicit cast or named argument resolves ambiguity.",
  },
  {
    id: "cs-0519-b2-struct-default",
    language: "csharp",
    title: "Struct default value is always zero-initialised",
    tag: "understanding",
    code: `struct Point { public int X; public int Y; }

// Default struct: all fields zeroed — no constructor needed
Point p = default;
Console.WriteLine(p.X);  // 0

// Array of structs: all zeroed automatically
Point[] points = new Point[3];
Console.WriteLine(points[1].Y);  // 0

// Can't have a parameterless constructor that doesn't call base
// (in older C#; C# 10 allows parameterless struct ctors)
struct Counter
{
    public int Value;
    public Counter() { Value = -1; }  // C# 10+ only
}`,
    explanation: "Struct instances are always zero-initialised by the runtime; this is guaranteed by the CLR even without a constructor call, which is why you can't force structs to have a non-zero default before C# 10.",
  },
  {
    id: "cs-0519-b2-covariant-return",
    language: "csharp",
    title: "Covariant return types (C# 9)",
    tag: "understanding",
    code: `class Animal
{
    public virtual Animal Clone() => new Animal();
}

class Dog : Animal
{
    // Return type is Dog (more derived) — covariant return
    public override Dog Clone() => new Dog();
}

Animal a = new Dog();

// a.Clone() returns Animal at compile time but Dog at runtime
Animal clone = a.Clone();
Console.WriteLine(clone.GetType().Name);  // Dog`,
    explanation: "Covariant return types (C# 9) allow an overriding method to return a more derived type; callers using the base class still compile, but callers with a Dog reference can receive a Dog directly.",
  },
  {
    id: "cs-0519-b2-interface-segregation",
    language: "csharp",
    title: "Interface segregation — narrow interfaces",
    tag: "understanding",
    code: `// Fat interface — implementors must stub methods they don't use
interface IBadPrinter
{
    void Print();
    void Scan();
    void Fax();
}

// Segregated — combine only what each class needs
interface IPrintable { void Print(); }
interface IScannable  { void Scan();  }
interface IFaxable    { void Fax();   }

class SimplePrinter : IPrintable
{
    public void Print() => Console.WriteLine("Printing...");
    // No Scan/Fax — no stub needed!
}

class AllInOne : IPrintable, IScannable, IFaxable
{
    public void Print() => Console.WriteLine("Printing...");
    public void Scan()  => Console.WriteLine("Scanning...");
    public void Fax()   => Console.WriteLine("Faxing...");
}`,
    explanation: "Interface segregation keeps interfaces small and focused; clients only depend on the methods they use, preventing forced stub implementations and reducing coupling.",
  },
  {
    id: "cs-0519-b2-ctor-chaining",
    language: "csharp",
    title: "Constructor chaining with this() and base()",
    tag: "classes",
    code: `class Connection
{
    public string Host { get; }
    public int Port { get; }
    public bool Secure { get; }

    // Most specific constructor
    public Connection(string host, int port, bool secure)
    {
        Host   = host;
        Port   = port;
        Secure = secure;
    }

    // Delegates to the most specific via this()
    public Connection(string host, int port) : this(host, port, false) { }
    public Connection(string host)           : this(host, 80)          { }
}

var c = new Connection("example.com");
Console.WriteLine(c.Port);    // 80
Console.WriteLine(c.Secure);  // False`,
    explanation: "Constructor chaining with this() calls another constructor in the same class before the body runs; this avoids duplicating initialization logic while providing convenient overloads.",
  },
  {
    id: "cs-0519-b2-protected-internal",
    language: "csharp",
    title: "Access modifiers: protected internal vs private protected",
    tag: "classes",
    code: `class Base
{
    protected internal void A() { }   // accessible in same assembly OR derived classes
    private protected  void B() { }   // accessible in same assembly AND derived classes only
}

// In SAME assembly:
class SameAssembly : Base
{
    void Use() { A(); B(); }  // both OK
}
class Unrelated     { void Use(Base b) { b.A(); /* b.B() — error */ } }

// In DIFFERENT assembly:
// class Other : Base {
//     void Use() { A(); /* OK — derived */ B(); /* error — wrong assembly */ }
// }`,
    explanation: "protected internal is the union (derived OR same-assembly); private protected is the intersection (derived AND same-assembly) — the latter is stricter and more encapsulated.",
  },
  {
    id: "cs-0519-b2-property-pattern-nested",
    language: "csharp",
    title: "Nested property patterns",
    tag: "classes",
    code: `record Address(string City, string Country);
record Customer(string Name, Address Address, bool IsPremium);

string Tier(Customer c) => c switch
{
    { IsPremium: true, Address.Country: "US" }     => "US Premium",
    { IsPremium: true }                            => "Global Premium",
    { Address: { City: "NYC" } }                  => "NYC Standard",
    _                                              => "Standard"
};

var c = new Customer("Alice", new Address("NYC", "US"), true);
Console.WriteLine(Tier(c));  // US Premium`,
    explanation: "Property patterns can nest arbitrarily; { Address.Country: \"US\" } matches nested Address.Country without destructuring, making switch expressions readable for deep object inspection.",
  },
  {
    id: "cs-0519-b2-extension-methods-linq",
    language: "csharp",
    title: "Writing a custom LINQ-style extension method",
    tag: "classes",
    code: `public static class EnumerableExtensions
{
    public static IEnumerable<(T item, int index)> Indexed<T>(
        this IEnumerable<T> source)
    {
        int i = 0;
        foreach (var item in source)
            yield return (item, i++);
    }
}

string[] names = { "Alice", "Bob", "Carol" };

foreach (var (name, i) in names.Indexed())
    Console.WriteLine($"{i}: {name}");
// 0: Alice
// 1: Bob
// 2: Carol`,
    explanation: "Extension methods on IEnumerable<T> integrate naturally into LINQ chains; using yield return keeps the extension lazy and composable, matching the deferred execution model of built-in LINQ.",
  },
];
