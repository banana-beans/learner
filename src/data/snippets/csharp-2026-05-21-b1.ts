import type { Snippet } from "./types";

export const csharpSnippets20260521B1: Snippet[] = [
  {
    id: "cs-0521-b1-pattern-is-expression",
    language: "csharp",
    title: "is expression with pattern matching",
    tag: "snippet",
    code: `object obj = "hello";

// Type check + cast in one expression
if (obj is string s && s.Length > 3)
    Console.WriteLine(s.ToUpper());   // HELLO

// Null check pattern
string? name = null;
if (name is not null)
    Console.WriteLine(name);

// Constant pattern
int x = 42;
if (x is 42)
    Console.WriteLine("forty-two");`,
    explanation: "The `is` pattern expression combines type testing and variable binding in one step — no separate cast needed; `is not null` is the idiomatic null check preferred over `!= null` by modern style guides.",
  },
  {
    id: "cs-0521-b1-span-slice",
    language: "csharp",
    title: "Span<T> for zero-copy slice operations",
    tag: "structures",
    code: `using System;

byte[] data = { 1, 2, 3, 4, 5, 6, 7, 8 };

// Span wraps the array — no copy
Span<byte> all    = data.AsSpan();
Span<byte> middle = all[2..6];    // indices 2,3,4,5

Console.WriteLine(middle.Length); // 4
Console.WriteLine(middle[0]);     // 3

// Mutations through Span affect original
middle[0] = 99;
Console.WriteLine(data[2]);       // 99`,
    explanation: "`Span<T>` is a ref struct that points into a contiguous memory region — slicing creates a new `Span` with a different start/length but no heap allocation or data copy, making it ideal for parsing and buffer manipulation.",
  },
  {
    id: "cs-0521-b1-record-init",
    language: "csharp",
    title: "record with init-only properties and with-expression",
    tag: "classes",
    code: `record Point(double X, double Y);

var p1 = new Point(1.0, 2.0);

// Non-destructive mutation: with-expression
var p2 = p1 with { X = 5.0 };

Console.WriteLine(p1);   // Point { X = 1, Y = 2 }
Console.WriteLine(p2);   // Point { X = 5, Y = 2 }

// Records provide value equality
var p3 = new Point(1.0, 2.0);
Console.WriteLine(p1 == p3);  // True
Console.WriteLine(p1 == p2);  // False`,
    explanation: "`record` types generate value equality, `ToString`, and deconstruction automatically; `with { }` creates a copy with specified properties changed — use records for immutable data objects like DTOs or domain values.",
  },
  {
    id: "cs-0521-b1-nullable-reference",
    language: "csharp",
    title: "nullable reference types and null-coalescing",
    tag: "types",
    code: `#nullable enable

string? maybeNull = null;
string nonNull    = "hello";

// Null-coalescing operator
string result = maybeNull ?? "default";
Console.WriteLine(result);  // default

// Null-coalescing assignment
maybeNull ??= "assigned";
Console.WriteLine(maybeNull);  // assigned

// Null-conditional operator chains
string? name = null;
int? length = name?.Length;    // null, not NullReferenceException
Console.WriteLine(length);     // (blank)
Console.WriteLine(length ?? 0); // 0`,
    explanation: "With `#nullable enable`, the compiler warns when you dereference a `string?` without a null check — `??` provides a fallback value, `??=` assigns only if null, and `?.` short-circuits the whole chain to `null`.",
  },
  {
    id: "cs-0521-b1-linq-where-select",
    language: "csharp",
    title: "LINQ Where + Select pipeline",
    tag: "snippet",
    code: `using System.Linq;

var numbers = Enumerable.Range(1, 20);

// Method syntax (fluent)
var result = numbers
    .Where(n => n % 3 == 0)      // keep multiples of 3
    .Select(n => n * n)           // square them
    .ToList();

Console.WriteLine(string.Join(", ", result));
// 9, 36, 81, 144, 225, 324

// Query syntax (SQL-like)
var result2 = (from n in numbers
               where n % 3 == 0
               select n * n).ToList();`,
    explanation: "LINQ pipelines are lazy by default — `Where` and `Select` create `IEnumerable` chains that evaluate only when enumerated by `ToList()`, `foreach`, or an aggregator like `Sum()`.",
  },
  {
    id: "cs-0521-b1-value-tuple",
    language: "csharp",
    title: "value tuples and deconstruction",
    tag: "types",
    code: `// Value tuple with named fields
(string Name, int Age) person = ("Alice", 30);
Console.WriteLine(person.Name);  // Alice
Console.WriteLine(person.Age);   // 30

// Deconstruction
var (name, age) = person;
Console.WriteLine(name);         // Alice

// Swap without temp variable
int a = 1, b = 2;
(a, b) = (b, a);
Console.WriteLine(a, b);         // 2 1

// Return multiple values from method
(int min, int max) Bounds(int[] arr) =>
    (arr.Min(), arr.Max());

var (lo, hi) = Bounds(new[] { 3, 1, 4, 1, 5 });
Console.WriteLine(lo, hi);       // 1 5`,
    explanation: "C# value tuples (`ValueTuple<T1,T2,...>`) are stack-allocated structs with named fields — they replace `out` parameters for multiple return values and support pattern-based deconstruction.",
  },
  {
    id: "cs-0521-b1-string-interpolation-format",
    language: "csharp",
    title: "string interpolation format specifiers",
    tag: "snippet",
    code: `decimal price = 1234567.89m;
double ratio  = 0.7253;
int count     = 42;
DateTime now  = DateTime.Now;

Console.WriteLine($"{price:C}");          // $1,234,567.89
Console.WriteLine($"{price:N2}");         // 1,234,567.89
Console.WriteLine($"{ratio:P1}");         // 72.5%
Console.WriteLine($"{count:D5}");         // 00042
Console.WriteLine($"{count:X}");          // 2A  (hex)
Console.WriteLine($"{now:yyyy-MM-dd}");   // 2026-05-21`,
    explanation: "String interpolation supports the same format specifiers as `String.Format` — `C` for currency, `N` for number with separators, `P` for percentage, `D` for decimal with padding, `X` for hex, and standard date/time patterns.",
  },
  {
    id: "cs-0521-b1-interface-default-method",
    language: "csharp",
    title: "interface default method implementations",
    tag: "classes",
    code: `interface ILogger
{
    void Log(string message);

    // Default implementation — classes don't have to override
    void LogError(string msg) => Log($"[ERROR] {msg}");
    void LogInfo(string msg)  => Log($"[INFO]  {msg}");
}

class ConsoleLogger : ILogger
{
    public void Log(string message) =>
        Console.WriteLine(message);
    // LogError and LogInfo are inherited from the interface
}

ILogger log = new ConsoleLogger();
log.LogError("something failed");   // [ERROR] something failed
log.LogInfo("started");             // [INFO]  started`,
    explanation: "Default interface methods (C# 8+) let you add new methods to interfaces without breaking existing implementors — they provide a mixin-like mechanism while keeping the interface contract for essential members.",
  },
  {
    id: "cs-0521-b1-switch-expression",
    language: "csharp",
    title: "switch expression for concise mapping",
    tag: "snippet",
    code: `string DayType(DayOfWeek day) => day switch
{
    DayOfWeek.Saturday or DayOfWeek.Sunday => "weekend",
    DayOfWeek.Monday                       => "start of week",
    DayOfWeek.Friday                       => "end of week",
    _                                      => "weekday",
};

Console.WriteLine(DayType(DayOfWeek.Saturday));  // weekend
Console.WriteLine(DayType(DayOfWeek.Wednesday)); // weekday

// With guard (when clause)
string Grade(int score) => score switch
{
    >= 90 => "A",
    >= 80 => "B",
    >= 70 => "C",
    _     => "F",
};
Console.WriteLine(Grade(85));   // B`,
    explanation: "The switch expression evaluates to a value (unlike the switch statement) — arms use `=>` and the compiler warns if the cases aren't exhaustive, catching missing cases that a statement would silently fall through.",
  },
  {
    id: "cs-0521-b1-ienumerable-lazy",
    language: "csharp",
    title: "IEnumerable<T> and deferred execution",
    tag: "structures",
    code: `using System.Linq;

IEnumerable<int> Generate()
{
    Console.WriteLine("start");
    yield return 1;
    Console.WriteLine("after 1");
    yield return 2;
    Console.WriteLine("after 2");
    yield return 3;
}

// Nothing prints yet — query is not evaluated
var q = Generate().Where(x => x > 1);
Console.WriteLine("query built");

// Evaluation happens here
foreach (var x in q)
    Console.Write(x + " ");
// start / after 1 / after 2 / after 2 / 2 3`,
    explanation: "LINQ operators on `IEnumerable<T>` use deferred execution — the pipeline runs lazily as you enumerate it; `yield return` drives the same model, interleaving producer and consumer one item at a time.",
  },
  {
    id: "cs-0521-b1-readonly-struct",
    language: "csharp",
    title: "readonly struct for immutable value types",
    tag: "types",
    code: `readonly struct Vector2D
{
    public double X { get; init; }
    public double Y { get; init; }

    public Vector2D(double x, double y) => (X, Y) = (x, y);

    public double Magnitude => Math.Sqrt(X * X + Y * Y);

    public Vector2D Add(Vector2D other) =>
        new(X + other.X, Y + other.Y);
}

var v1 = new Vector2D(3, 4);
Console.WriteLine(v1.Magnitude);   // 5
var v2 = v1.Add(new Vector2D(1, 0));
Console.WriteLine(v2.X);           // 4`,
    explanation: "`readonly struct` guarantees no method can mutate `this` — the compiler enforces this and can skip defensive copies when passing the struct as `in` parameters, making hot-path math structs both safe and fast.",
  },
  {
    id: "cs-0521-b1-generic-constraints",
    language: "csharp",
    title: "generic type constraints",
    tag: "types",
    code: `using System;

// where T : class — only reference types
T? OrDefault<T>(T? value) where T : class
    => value;

// where T : struct — only value types
T OrZero<T>(T? value) where T : struct
    => value ?? default;

// where T : IComparable<T> — supports comparison
T Max<T>(T a, T b) where T : IComparable<T>
    => a.CompareTo(b) >= 0 ? a : b;

// where T : new() — has parameterless constructor
T Create<T>() where T : new()
    => new T();

Console.WriteLine(Max(3, 7));        // 7
Console.WriteLine(Max("abc", "xyz")); // xyz`,
    explanation: "Generic constraints (`where T : ...`) restrict which types can be used as type arguments — they unlock operations on `T` that the compiler can't otherwise guarantee, like calling `new T()`, `a.CompareTo(b)`, or `a?.Property`.",
  },
  {
    id: "cs-0521-b1-async-await-basics",
    language: "csharp",
    title: "async/await fundamentals",
    tag: "snippet",
    code: `using System.Net.Http;

async Task<string> FetchAsync(string url)
{
    using var client = new HttpClient();
    // await releases the thread during I/O
    string content = await client.GetStringAsync(url);
    return content[..100];   // first 100 chars
}

async Task Main()
{
    // Run two fetches concurrently
    var t1 = FetchAsync("https://example.com");
    var t2 = FetchAsync("https://example.org");
    // Both are already running; await here collects results
    string[] results = await Task.WhenAll(t1, t2);
    Console.WriteLine(results[0].Length);
}`,
    explanation: "`await` yields the current thread back to the thread pool during I/O so it can do other work — starting both tasks before awaiting them lets them run concurrently; `Task.WhenAll` collects results in order.",
  },
  {
    id: "cs-0521-b1-dictionary-tryfetch",
    language: "csharp",
    title: "Dictionary.TryGetValue to avoid double lookup",
    tag: "snippet",
    code: `var scores = new Dictionary<string, int>
{
    ["Alice"] = 90,
    ["Bob"]   = 85,
};

// Anti-pattern: double lookup
if (scores.ContainsKey("Alice"))
    Console.WriteLine(scores["Alice"]);  // 2 lookups

// Preferred: single lookup
if (scores.TryGetValue("Alice", out int score))
    Console.WriteLine(score);   // 90

// GetValueOrDefault — returns default if not found
int carolScore = scores.GetValueOrDefault("Carol", -1);
Console.WriteLine(carolScore);   // -1`,
    explanation: "`TryGetValue` is a single-hash-lookup operation that retrieves the value and reports success atomically — it avoids the race condition and performance cost of calling `ContainsKey` followed by the indexer.",
  },
  {
    id: "cs-0521-b1-record-struct",
    language: "csharp",
    title: "record struct: value semantics + generated members",
    tag: "classes",
    code: `record struct Point(int X, int Y);

var a = new Point(1, 2);
var b = new Point(1, 2);
var c = a with { X = 5 };

// Value equality (struct semantics)
Console.WriteLine(a == b);  // True
Console.WriteLine(a == c);  // False

// record struct is a VALUE TYPE — lives on the stack
Console.WriteLine(a.GetType().IsValueType);  // True

// Deconstruction is auto-generated
var (x, y) = a;
Console.WriteLine(x, y);    // 1 2`,
    explanation: "`record struct` combines struct value semantics with the auto-generated equality, deconstruction, and `with`-expressions of `record class` — it's a concise, allocation-free immutable value type.",
  },
  {
    id: "cs-0521-b1-linq-groupby",
    language: "csharp",
    title: "LINQ GroupBy for in-memory aggregation",
    tag: "snippet",
    code: `using System.Linq;

var orders = new[]
{
    (Product: "Apple",  Qty: 3),
    (Product: "Banana", Qty: 2),
    (Product: "Apple",  Qty: 5),
    (Product: "Banana", Qty: 1),
};

var summary = orders
    .GroupBy(o => o.Product)
    .Select(g => new {
        Product  = g.Key,
        Total    = g.Sum(o => o.Qty),
        Orders   = g.Count(),
    })
    .OrderByDescending(x => x.Total);

foreach (var s in summary)
    Console.WriteLine($"{s.Product}: {s.Total} ({s.Orders} orders)");
// Apple: 8 (2 orders)
// Banana: 3 (2 orders)`,
    explanation: "`GroupBy` partitions elements by key into `IGrouping<K,V>` objects — chaining `Select` on the groups lets you compute per-group aggregates like sum, count, or max in a single readable pipeline.",
  },
  {
    id: "cs-0521-b1-hashset-ops",
    language: "csharp",
    title: "HashSet<T> set operations",
    tag: "structures",
    code: `var a = new HashSet<int> { 1, 2, 3, 4 };
var b = new HashSet<int> { 3, 4, 5, 6 };

// Non-mutating checks
Console.WriteLine(a.IsSubsetOf(new[] { 0, 1, 2, 3, 4, 5 }));  // True
Console.WriteLine(a.Overlaps(b));                               // True

// Mutating set operations (modify a in place)
a.IntersectWith(b);
Console.WriteLine(string.Join(",", a));  // 3,4

a = new HashSet<int> { 1, 2, 3, 4 };
a.UnionWith(b);
Console.WriteLine(string.Join(",", a));  // 1,2,3,4,5,6

a.ExceptWith(b);
Console.WriteLine(string.Join(",", a));  // 1,2`,
    explanation: "`HashSet<T>` provides O(1) `Contains` and O(n) set operations — `IntersectWith`, `UnionWith`, and `ExceptWith` mutate the set in place, while `Overlaps` and `IsSubsetOf` query without mutation.",
  },
  {
    id: "cs-0521-b1-stackalloc",
    language: "csharp",
    title: "stackalloc for stack-allocated buffers",
    tag: "types",
    code: `using System;

// Allocate 256 bytes on the stack — no GC pressure
Span<byte> buffer = stackalloc byte[256];

// Fill and use
for (int i = 0; i < buffer.Length; i++)
    buffer[i] = (byte)(i & 0xFF);

Console.WriteLine(buffer[255]);   // 255

// Safe: Span prevents buffer overrun
// buffer[256] = 1;  // IndexOutOfRangeException

// Use for small, short-lived buffers — NOT for large allocations
// Large stackalloc can cause StackOverflowException`,
    explanation: "`stackalloc` allocates memory on the stack inside a `Span<T>` — it's eliminated from GC consideration entirely, making it ideal for small, short-lived buffers in tight loops; the `Span` wrapper keeps it bounds-safe.",
  },
  {
    id: "cs-0521-b1-expression-bodied",
    language: "csharp",
    title: "expression-bodied members",
    tag: "snippet",
    code: `class Circle
{
    public double Radius { get; }

    public Circle(double r) => Radius = r;       // constructor

    public double Area        => Math.PI * Radius * Radius;  // property
    public double Circumference => 2 * Math.PI * Radius;

    public override string ToString() =>
        $"Circle(r={Radius:F2})";                // method

    public static Circle Unit => new(1.0);       // static property
}

var c = new Circle(5);
Console.WriteLine(c.Area);          // 78.54...
Console.WriteLine(c.ToString());    // Circle(r=5.00)`,
    explanation: "Expression-bodied members (`=>`) replace single-expression constructors, methods, and properties with a terser syntax — they don't change behavior, just remove the `{ get { return ...; } }` boilerplate.",
  },
  {
    id: "cs-0521-b1-cts-cancellation",
    language: "csharp",
    title: "CancellationToken for cooperative task cancellation",
    tag: "snippet",
    code: `using System.Threading;

async Task LongRunning(CancellationToken ct)
{
    for (int i = 0; i < 100; i++)
    {
        ct.ThrowIfCancellationRequested();   // cooperative check
        await Task.Delay(100, ct);           // also checks token
        Console.Write($"{i} ");
    }
}

var cts = new CancellationTokenSource(TimeSpan.FromSeconds(0.5));
try
{
    await LongRunning(cts.Token);
}
catch (OperationCanceledException)
{
    Console.WriteLine("\\nCancelled!");
}`,
    explanation: "`CancellationToken` enables cooperative cancellation — callers signal cancellation via a `CancellationTokenSource`; the task checks `ThrowIfCancellationRequested()` or passes the token to `Task.Delay` and other async APIs.",
  },
  {
    id: "cs-0521-b1-string-span-parsing",
    language: "csharp",
    title: "ReadOnlySpan<char> for allocation-free string parsing",
    tag: "snippet",
    code: `using System;

string line = "Alice,30,Engineer";

// Split via Span — no string allocations
ReadOnlySpan<char> span = line.AsSpan();

int first  = span.IndexOf(',');
var name   = span[..first];            // "Alice"
span = span[(first + 1)..];

int second = span.IndexOf(',');
var age    = span[..second];           // "30"
var role   = span[(second + 1)..];    // "Engineer"

Console.WriteLine(name.ToString());    // Alice
Console.WriteLine(int.Parse(age));     // 30`,
    explanation: "`ReadOnlySpan<char>` slices a string without allocating substrings — for hot parsing paths (CSV, log lines, protocol frames) this avoids creating dozens of intermediate `string` objects that the GC must collect.",
  },
  {
    id: "cs-0521-b1-sealed-class",
    language: "csharp",
    title: "sealed class and sealed override",
    tag: "classes",
    code: `abstract class Animal
{
    public abstract string Speak();
}

class Dog : Animal
{
    public sealed override string Speak() => "Woof";
    // sealed: no further subclass can override Speak
}

// class Poodle : Dog
// {
//     public override string Speak() => "Yip";  // compile error
// }

// sealed class: cannot be subclassed at all
sealed class Singleton
{
    public static Singleton Instance { get; } = new();
    private Singleton() { }
}`,
    explanation: "`sealed` on a class prevents inheritance; `sealed override` on a method prevents further overriding in subclasses — both let the JIT devirtualize the call, and `sealed` on a class enables additional optimizations.",
  },
  {
    id: "cs-0521-b1-pattern-switch-type",
    language: "csharp",
    title: "switch with type patterns",
    tag: "snippet",
    code: `abstract record Shape;
record Circle(double Radius) : Shape;
record Rectangle(double W, double H) : Shape;
record Triangle(double Base, double Height) : Shape;

double Area(Shape s) => s switch
{
    Circle c       => Math.PI * c.Radius * c.Radius,
    Rectangle r    => r.W * r.H,
    Triangle t     => 0.5 * t.Base * t.Height,
    _              => throw new ArgumentException("unknown shape"),
};

Console.WriteLine(Area(new Circle(5)));            // 78.54...
Console.WriteLine(Area(new Rectangle(3, 4)));      // 12
Console.WriteLine(Area(new Triangle(6, 4)));       // 12`,
    explanation: "Type patterns in switch expressions match the runtime type of the input and bind it to a new variable — combined with record deconstruction they read almost like functional case analysis without explicit casting.",
  },
  {
    id: "cs-0521-b1-using-declaration",
    language: "csharp",
    title: "using declaration (C# 8+) vs using statement",
    tag: "snippet",
    code: `// Traditional using statement — braces required
using (var conn = new System.Data.SqlClient.SqlConnection("..."))
{
    // conn disposed here
}

// Using declaration — disposed at end of enclosing scope
using var reader = new System.IO.StreamReader("file.txt");
string firstLine = reader.ReadLine() ?? "";
Console.WriteLine(firstLine);
// reader disposed when method exits (no extra indent level)

// Multiple declarations stay readable
using var a = new System.IO.MemoryStream();
using var b = new System.IO.MemoryStream();`,
    explanation: "The `using` declaration (without braces) disposes the resource at the end of the enclosing scope — it reduces nesting for long-lived resources while keeping the same deterministic disposal guarantee.",
  },
  {
    id: "cs-0521-b1-ref-return",
    language: "csharp",
    title: "ref return and ref local for in-place mutation",
    tag: "types",
    code: `class Grid
{
    private int[,] _data = new int[3, 3];

    // Return a reference to the cell — caller can mutate it
    public ref int Cell(int row, int col) => ref _data[row, col];
}

var grid = new Grid();
grid.Cell(1, 1) = 42;                // mutates via ref return
Console.WriteLine(grid.Cell(1, 1));  // 42

// ref local: hold the reference
ref int center = ref grid.Cell(1, 1);
center++;
Console.WriteLine(grid.Cell(1, 1));  // 43`,
    explanation: "`ref return` lets a method hand back a managed reference to a field or array element — the caller can read or write through it without an intermediate copy, enabling high-performance in-place algorithms on value types.",
  },
  {
    id: "cs-0521-b1-ireadonly-collections",
    language: "csharp",
    title: "IReadOnlyList vs IReadOnlyCollection vs IEnumerable",
    tag: "families",
    code: `using System.Collections.Generic;

List<int> list = new() { 1, 2, 3 };

// IEnumerable<T>: forward-only iteration, no Count
IEnumerable<int> seq = list;

// IReadOnlyCollection<T>: adds Count
IReadOnlyCollection<int> col = list;
Console.WriteLine(col.Count);       // 3

// IReadOnlyList<T>: adds indexer
IReadOnlyList<int> rdList = list;
Console.WriteLine(rdList[2]);       // 3

// Exposes read-only view — callers can't add/remove
// But casting back to List<int> is still possible (unsafe)`,
    explanation: "Use the narrowest interface that satisfies callers: `IEnumerable<T>` for anything iterable, `IReadOnlyCollection<T>` when count matters, `IReadOnlyList<T>` when random access is needed — all prevent mutation through the interface.",
  },
  {
    id: "cs-0521-b1-object-initializer",
    language: "csharp",
    title: "object and collection initializers",
    tag: "snippet",
    code: `class Person
{
    public string Name { get; set; } = "";
    public int Age { get; set; }
    public List<string> Hobbies { get; set; } = new();
}

// Object initializer — sets properties without extra ctor overloads
var p = new Person
{
    Name = "Alice",
    Age  = 30,
    Hobbies = { "reading", "coding" },   // collection initializer
};
Console.WriteLine(p.Name);   // Alice
Console.WriteLine(p.Hobbies.Count);  // 2

// Target-typed new (C# 9) — type inferred from context
List<int> nums = new() { 1, 2, 3 };`,
    explanation: "Object initializers set properties after construction in a single expression — the `{ }` for collections calls `Add` on an existing instance; `new()` with target typing lets you omit the type name when it can be inferred.",
  },
  {
    id: "cs-0521-b1-func-action-delegate",
    language: "csharp",
    title: "Func, Action, and Predicate delegate types",
    tag: "types",
    code: `// Func<TIn..., TOut> — returns a value
Func<int, int, int> add = (a, b) => a + b;
Console.WriteLine(add(3, 4));   // 7

// Action<T...> — returns void
Action<string> print = msg => Console.WriteLine(msg);
print("hello");                 // hello

// Predicate<T> — equivalent to Func<T, bool>
Predicate<int> isEven = n => n % 2 == 0;
Console.WriteLine(isEven(4));   // True

// Composing via LINQ
var nums = new[] { 1, 2, 3, 4, 5, 6 };
var evens = Array.FindAll(nums, isEven);
Console.WriteLine(string.Join(",", evens));   // 2,4,6`,
    explanation: "`Func`, `Action`, and `Predicate` are the built-in generic delegate types — `Func<T1,T2,TResult>` handles up to 16 inputs plus a return value; prefer them over custom delegate types for common patterns.",
  },
  {
    id: "cs-0521-b1-string-raw",
    language: "csharp",
    title: "raw string literals (C# 11+)",
    tag: "snippet",
    code: `// Traditional verbatim string: double "" to escape
string path1 = @"C:\\Users\\Alice\\file.txt";

// Raw string literal: no escaping needed, 3+ quotes
string path2 = """C:\\Users\\Alice\\file.txt""";

// Multi-line raw string with interpolation
string name = "Alice";
string json = $"""
    {{
        "name": "{name}",
        "active": true
    }}
    """;
Console.WriteLine(json);
// {
//     "name": "Alice",
//     "active": true
// }`,
    explanation: "Raw string literals (three or more `\"`) need no escape sequences — `{{` and `}}` in interpolated raw strings produce literal braces, making embedded JSON, regex, or HTML readable without escape noise.",
  },
  {
    id: "cs-0521-b1-lazy-initialization",
    language: "csharp",
    title: "Lazy<T> for thread-safe lazy initialization",
    tag: "snippet",
    code: `using System;

class ExpensiveService
{
    public ExpensiveService()
    {
        Console.WriteLine("Constructing...");
        // Imagine expensive setup here
    }
    public string Compute() => "result";
}

class App
{
    // Not created until first access; thread-safe by default
    private static readonly Lazy<ExpensiveService> _svc =
        new(() => new ExpensiveService());

    public static string Run()
    {
        Console.WriteLine("Before first access");
        return _svc.Value.Compute();   // constructed here
    }
}

App.Run();   // Before first access / Constructing... / result`,
    explanation: "`Lazy<T>` defers construction until `.Value` is first accessed and guarantees construction happens only once even under concurrent access — it's the right tool for expensive singletons or optional dependencies.",
  },
  {
    id: "cs-0521-b1-covariance-contravariance",
    language: "csharp",
    title: "covariance (out) and contravariance (in) in generics",
    tag: "types",
    code: `// IEnumerable<T> is covariant (out T): can assign derived to base
IEnumerable<string> strings = new List<string> { "a", "b" };
IEnumerable<object> objects = strings;   // OK — covariant
Console.WriteLine(objects.First());       // a

// Action<T> is contravariant (in T): can assign base to derived
Action<object> printObj = o => Console.WriteLine(o);
Action<string> printStr = printObj;       // OK — contravariant
printStr("hello");                        // hello

// Custom covariant interface
interface IProducer<out T> { T Get(); }
// Custom contravariant interface
interface IConsumer<in T> { void Accept(T item); }`,
    explanation: "`out T` (covariance) allows assignment from `IFoo<Derived>` to `IFoo<Base>` — safe for producers; `in T` (contravariance) allows the reverse — safe for consumers; value can only flow out/in respectively.",
  },
  {
    id: "cs-0521-b1-immutable-collections",
    language: "csharp",
    title: "ImmutableList and ImmutableDictionary",
    tag: "structures",
    code: `using System.Collections.Immutable;

var list = ImmutableList.Create(1, 2, 3);
var list2 = list.Add(4);          // returns new list
Console.WriteLine(list.Count);    // 3  — original unchanged
Console.WriteLine(list2.Count);   // 4

// Builder for efficient batch construction
var builder = ImmutableList.CreateBuilder<int>();
for (int i = 0; i < 5; i++) builder.Add(i);
var immutable = builder.ToImmutable();
Console.WriteLine(immutable.Count);  // 5

var dict = ImmutableDictionary.Create<string, int>()
    .Add("a", 1).Add("b", 2);
Console.WriteLine(dict["a"]);     // 1`,
    explanation: "Immutable collections return a new collection on each mutation while sharing structure with the original — they're safe to share across threads without locking; use the `Builder` pattern when constructing many items.",
  },
  {
    id: "cs-0521-b1-string-builder",
    language: "csharp",
    title: "StringBuilder for efficient string concatenation",
    tag: "snippet",
    code: `using System.Text;

// Naive: O(n²) — each + allocates a new string
string bad = "";
for (int i = 0; i < 10000; i++) bad += i.ToString();

// StringBuilder: O(n) — amortized append
var sb = new StringBuilder(capacity: 64_000);
for (int i = 0; i < 10000; i++) sb.Append(i);
string result = sb.ToString();

Console.WriteLine(result.Length);  // 38890

// Chaining
var csv = new StringBuilder()
    .Append("name").Append(',')
    .Append("age").AppendLine()
    .Append("Alice").Append(',')
    .Append(30);`,
    explanation: "`StringBuilder` maintains an internal char buffer, doubling capacity as needed — appending is O(1) amortized; the final `ToString()` does a single allocation, making it orders of magnitude faster than `+` in a loop.",
  },
  {
    id: "cs-0521-b1-partial-class",
    language: "csharp",
    title: "partial class and partial method",
    tag: "classes",
    code: `// File: Order.cs
partial class Order
{
    public int Id { get; init; }
    public decimal Total { get; set; }

    partial void OnTotalChanged(decimal newValue);  // declaration

    public void SetTotal(decimal v)
    {
        Total = v;
        OnTotalChanged(v);   // call might be optimized away if not implemented
    }
}

// File: Order.Hooks.cs
partial class Order
{
    partial void OnTotalChanged(decimal newValue)   // implementation
    {
        Console.WriteLine($"Total changed to {newValue:C}");
    }
}`,
    explanation: "`partial class` splits a class definition across files — used heavily by code generators (EF, WinForms, source generators) to keep generated code separate from hand-written code; `partial void` methods allow optional hooks that vanish if not implemented.",
  },
  {
    id: "cs-0521-b1-tuple-deconstruct-custom",
    language: "csharp",
    title: "custom Deconstruct for pattern-based destructuring",
    tag: "classes",
    code: `class Rectangle
{
    public double Width { get; }
    public double Height { get; }
    public Rectangle(double w, double h) => (Width, Height) = (w, h);

    // Enables deconstruction syntax
    public void Deconstruct(out double w, out double h)
        => (w, h) = (Width, Height);
}

var r = new Rectangle(3, 4);
var (w, h) = r;                 // uses Deconstruct
Console.WriteLine(w, h);        // 3 4

// Also works in switch expressions
string Describe(Rectangle rect) => rect switch
{
    (var x, var y) when x == y => "square",
    (var x, var y) => $"{x}x{y}",
};
Console.WriteLine(Describe(new Rectangle(3, 4)));  // 3x4`,
    explanation: "Any class with a `Deconstruct` method (or extension method) supports deconstruction syntax — the `out` parameters become the target variables, and the compiler hooks into this for `switch` patterns and tuple assignments.",
  },
  {
    id: "cs-0521-b1-span-stackalloc-utf8",
    language: "csharp",
    title: "stackalloc + Encoding for zero-alloc UTF-8 encoding",
    tag: "snippet",
    code: `using System;
using System.Text;

string text = "Hello, 世界";

// Calculate max bytes needed
int maxBytes = Encoding.UTF8.GetMaxByteCount(text.Length);

// Stack-allocate the buffer
Span<byte> buffer = stackalloc byte[maxBytes];

// Encode without allocating a byte[]
int bytesWritten = Encoding.UTF8.GetBytes(text, buffer);
Span<byte> encoded = buffer[..bytesWritten];

Console.WriteLine(bytesWritten);  // 13  (ASCII + 6 for 世界)
Console.WriteLine(encoded[0]);    // 72  ('H')`,
    explanation: "Combining `stackalloc` with `Encoding.UTF8.GetBytes(ReadOnlySpan<char>, Span<byte>)` encodes a string to UTF-8 with zero heap allocations — critical for high-throughput serialization or network I/O in hot paths.",
  },
  {
    id: "cs-0521-b1-yield-return",
    language: "csharp",
    title: "yield return for lazy sequences",
    tag: "snippet",
    code: `IEnumerable<int> Fibonacci()
{
    int a = 0, b = 1;
    while (true)
    {
        yield return a;
        (a, b) = (b, a + b);
    }
}

// Take only what you need from the infinite sequence
var first10 = Fibonacci().Take(10).ToList();
Console.WriteLine(string.Join(", ", first10));
// 0, 1, 1, 2, 3, 5, 8, 13, 21, 34

// yield break to end early
IEnumerable<string> ReadUntilEmpty(string[] lines)
{
    foreach (var line in lines)
    {
        if (line == "") yield break;
        yield return line;
    }
}`,
    explanation: "`yield return` turns a method into an iterator that produces one element at a time — the compiler generates a state machine under the hood; `yield break` ends the sequence early without throwing.",
  },
  {
    id: "cs-0521-b1-concurrent-dictionary",
    language: "csharp",
    title: "ConcurrentDictionary for thread-safe maps",
    tag: "structures",
    code: `using System.Collections.Concurrent;
using System.Threading.Tasks;

var counts = new ConcurrentDictionary<string, int>();

// AddOrUpdate is atomic — no lock needed
Parallel.ForEach(Enumerable.Range(0, 1000), _ =>
{
    counts.AddOrUpdate("key",
        addValue: 1,
        updateValueFactory: (_, old) => old + 1);
});

Console.WriteLine(counts["key"]);  // 1000 (always correct)

// GetOrAdd for lazy creation
var cache = new ConcurrentDictionary<string, List<int>>();
var list  = cache.GetOrAdd("results", _ => new List<int>());`,
    explanation: "`ConcurrentDictionary` provides lock-free reads and fine-grained locking for writes — `AddOrUpdate` and `GetOrAdd` are atomic compound operations that safely handle the check-then-act pattern.",
  },
  {
    id: "cs-0521-b1-interface-segregation",
    language: "csharp",
    title: "interface segregation: small, focused interfaces",
    tag: "classes",
    code: `// Fat interface — forces implementors to fake methods
interface IBad { void Read(); void Write(); void Seek(); }

// Segregated — implement only what you support
interface IReadable  { string Read(); }
interface IWritable  { void Write(string data); }
interface ISeekable  { void Seek(long position); }

// Read-only stream: only IReadable
class NetworkStream : IReadable
{
    public string Read() => "data from network";
}

// Full file: all three
class FileStream : IReadable, IWritable, ISeekable
{
    public string Read()          => "file data";
    public void Write(string d)   => Console.WriteLine(d);
    public void Seek(long pos)    => Console.WriteLine($"seek {pos}");
}`,
    explanation: "Segregating interfaces prevents implementors from providing no-op or throwing stubs for methods they don't support — callers that only need `IReadable` are also insulated from changes to `IWritable`.",
  },
  {
    id: "cs-0521-b1-pattern-list",
    language: "csharp",
    title: "list pattern matching (C# 11+)",
    tag: "snippet",
    code: `int[] Describe(int[] arr) => arr switch
{
    []          => throw new ArgumentException("empty"),
    [var x]     => new[] { x },          // exactly one element
    [var h, ..] => new[] { h },          // one or more: take head
};

// Detailed list pattern
string Classify(int[] arr) => arr switch
{
    [0, 0]     => "origin pair",
    [_, _]     => "any pair",
    [0, ..]    => "starts with zero",
    [.., 0]    => "ends with zero",
    [var a, var b, var c] => $"triple {a},{b},{c}",
    _          => "other",
};
Console.WriteLine(Classify(new[] { 0, 1, 2 }));  // starts with zero
Console.WriteLine(Classify(new[] { 1, 2, 3 }));  // triple 1,2,3`,
    explanation: "List patterns match array/span structure positionally — `..` is the discard rest operator (like `*` in Python), `[var h, ..]` binds the head, and `[.., var t]` binds the tail; empty `[]` matches an empty collection.",
  },
  {
    id: "cs-0521-b1-memory-channel",
    language: "csharp",
    title: "Channel<T> for producer-consumer pipelines",
    tag: "structures",
    code: `using System.Threading.Channels;
using System.Threading.Tasks;

// Bounded: producer blocks when full
var channel = Channel.CreateBounded<int>(capacity: 10);

var producer = Task.Run(async () =>
{
    for (int i = 0; i < 5; i++)
    {
        await channel.Writer.WriteAsync(i);
        Console.WriteLine($"produced {i}");
    }
    channel.Writer.Complete();
});

var consumer = Task.Run(async () =>
{
    await foreach (var item in channel.Reader.ReadAllAsync())
        Console.WriteLine($"consumed {item}");
});

await Task.WhenAll(producer, consumer);`,
    explanation: "`Channel<T>` is the modern replacement for `BlockingCollection<T>` — it's async-first, supports both bounded and unbounded modes, and integrates with `await foreach` for clean consumer code.",
  },
  {
    id: "cs-0521-b1-delegate-multicast",
    language: "csharp",
    title: "multicast delegates and event pattern",
    tag: "classes",
    code: `class Button
{
    public event Action<string>? Clicked;

    public void Click()
    {
        Clicked?.Invoke("left-click");
    }
}

var btn = new Button();

// Subscribe multiple handlers
btn.Clicked += msg => Console.WriteLine($"Handler A: {msg}");
btn.Clicked += msg => Console.WriteLine($"Handler B: {msg}");

btn.Click();
// Handler A: left-click
// Handler B: left-click

// Unsubscribe
Action<string> handlerC = msg => Console.WriteLine($"C: {msg}");
btn.Clicked += handlerC;
btn.Clicked -= handlerC;
btn.Click();   // Only A and B`,
    explanation: "Delegates in C# are multicast — `+=` adds handlers to an invocation list; `-=` removes them; `?.Invoke()` on an event safely handles the case where no handlers are subscribed.",
  },
  {
    id: "cs-0521-b1-abstract-sealed-class",
    language: "csharp",
    title: "abstract class with sealed members",
    tag: "classes",
    code: `abstract class Payment
{
    public string Currency { get; init; } = "USD";

    // Template method pattern: subclasses fill in Authorize
    public sealed string Process(decimal amount)   // can't override
    {
        if (!Authorize(amount))
            return "declined";
        return $"processed {amount:C} via {GetType().Name}";
    }

    protected abstract bool Authorize(decimal amount);
}

class CreditCard : Payment
{
    protected override bool Authorize(decimal amount)
        => amount <= 5000m;
}

var cc = new CreditCard();
Console.WriteLine(cc.Process(100m));   // processed $100.00 via CreditCard
Console.WriteLine(cc.Process(9999m));  // declined`,
    explanation: "The template method pattern uses `sealed` on the base class method so subclasses can only override the abstract \"hook\" method — the algorithm skeleton in the base class remains invariant.",
  },
  {
    id: "cs-0521-b1-indexer",
    language: "csharp",
    title: "indexers for array-like access on custom types",
    tag: "classes",
    code: `class Matrix
{
    private readonly double[,] _data;
    public int Rows { get; }
    public int Cols { get; }

    public Matrix(int rows, int cols)
    {
        Rows = rows; Cols = cols;
        _data = new double[rows, cols];
    }

    // Indexer: obj[row, col]
    public double this[int row, int col]
    {
        get => _data[row, col];
        set => _data[row, col] = value;
    }
}

var m = new Matrix(3, 3);
m[1, 1] = 42.0;
Console.WriteLine(m[1, 1]);   // 42`,
    explanation: "Indexers use `this[...]` as the property name and support multiple parameters — they make custom types feel like arrays or dictionaries from the caller's perspective, with full get/set control.",
  },
  {
    id: "cs-0521-b1-nint-native-int",
    language: "csharp",
    title: "nint and nuint: native-size integers",
    tag: "types",
    code: `// nint = 32-bit on x86, 64-bit on x64
nint  a = 100;
nuint b = 200u;

Console.WriteLine(nint.Size);   // 8 (on a 64-bit process)

// Useful for interop with native pointer-sized values
unsafe
{
    nint ptr = (nint)System.Runtime.InteropServices.Marshal.AllocHGlobal(16);
    System.Runtime.InteropServices.Marshal.FreeHGlobal((System.IntPtr)ptr);
}

// Arithmetic works like int/long
nint sum = a + (nint)b;
Console.WriteLine(sum);   // 300`,
    explanation: "`nint`/`nuint` are aliases for `System.IntPtr`/`UIntPtr` with full arithmetic operator support — they adapt to the process's pointer size at runtime, which matters for P/Invoke, Span math, and pointer arithmetic.",
  },
  {
    id: "cs-0521-b1-linq-aggregate",
    language: "csharp",
    title: "LINQ Aggregate as a generalized fold",
    tag: "snippet",
    code: `using System.Linq;

int[] nums = { 1, 2, 3, 4, 5 };

// Product — no built-in, use Aggregate
int product = nums.Aggregate((acc, x) => acc * x);
Console.WriteLine(product);   // 120

// With seed
int sumOfSquares = nums.Aggregate(0, (acc, x) => acc + x * x);
Console.WriteLine(sumOfSquares);  // 55

// With result selector
string csv = nums.Aggregate(
    new System.Text.StringBuilder(),
    (sb, x) => { sb.Append(x).Append(','); return sb; },
    sb => sb.ToString().TrimEnd(','));
Console.WriteLine(csv);   // 1,2,3,4,5`,
    explanation: "`Aggregate` is LINQ's fold — the two-argument form starts with the first element; the three-argument form takes a seed; the four-argument form adds a result projection, useful for building non-default result types.",
  },
  {
    id: "cs-0521-b1-fixed-statement",
    language: "csharp",
    title: "fixed statement to pin managed objects",
    tag: "types",
    code: `using System;

byte[] data = { 1, 2, 3, 4, 5 };

unsafe
{
    // Pin the array so GC doesn't move it
    fixed (byte* ptr = data)
    {
        for (int i = 0; i < data.Length; i++)
            Console.Write(*(ptr + i) + " ");
        // 1 2 3 4 5
    }
    // Array is unpinned here — GC can move it again
}`,
    explanation: "`fixed` pins a managed object in place for the duration of the block so the GC doesn't relocate it while a pointer points to it — necessary for P/Invoke buffers and unmanaged memory access in `unsafe` code.",
  },
  {
    id: "cs-0521-b1-valuetuple-equality",
    language: "csharp",
    title: "ValueTuple structural equality",
    tag: "types",
    code: `var a = (X: 1, Y: 2);
var b = (X: 1, Y: 2);
var c = (1, 2);        // no names — same struct

Console.WriteLine(a == b);   // True  — structural equality
Console.WriteLine(a == c);   // True  — names don't affect equality
Console.WriteLine(a.Equals(b)); // True

// Can be used as dict keys
var dict = new Dictionary<(int, int), string>
{
    [(0, 0)] = "origin",
    [(1, 0)] = "right",
};
Console.WriteLine(dict[(0, 0)]);  // origin

// Deconstruct
var (x, y) = a;
Console.WriteLine(x + y);   // 3`,
    explanation: "Value tuples implement structural equality — two tuples are equal if all their elements are equal, regardless of field names; this makes them directly usable as dictionary keys without a custom `IEqualityComparer`.",
  },
  {
    id: "cs-0521-b1-span-vs-memory",
    language: "csharp",
    title: "Span<T> vs Memory<T>: stack vs heap constraints",
    tag: "structures",
    code: `using System;
using System.Threading.Tasks;

byte[] data = new byte[100];

// Span<T>: ref struct — cannot cross async boundaries
Span<byte> span = data.AsSpan();
// await SomeTask();  // compile error if span is in scope

// Memory<T>: heap-safe wrapper — can cross async
Memory<byte> mem = data.AsMemory();

async Task ProcessAsync(Memory<byte> m)
{
    await Task.Delay(1);              // OK — no compiler error
    m.Span[0] = 42;                   // access Span only synchronously
}

await ProcessAsync(mem);
Console.WriteLine(data[0]);   // 42`,
    explanation: "`Span<T>` is a ref struct and must stay on the stack — it cannot be stored in fields or cross `await` boundaries; `Memory<T>` wraps the same data as a regular struct, enabling async pipelines while still providing `Span` access.",
  },
  {
    id: "cs-0521-b1-linq-join",
    language: "csharp",
    title: "LINQ Join and GroupJoin",
    tag: "snippet",
    code: `using System.Linq;

var orders = new[]
{
    (Id: 1, CustomerId: 101, Total: 50m),
    (Id: 2, CustomerId: 102, Total: 75m),
    (Id: 3, CustomerId: 101, Total: 30m),
};
var customers = new[]
{
    (Id: 101, Name: "Alice"),
    (Id: 102, Name: "Bob"),
};

// Inner join
var joined = orders.Join(customers,
    o => o.CustomerId,
    c => c.Id,
    (o, c) => new { c.Name, o.Total });

foreach (var r in joined)
    Console.WriteLine($"{r.Name}: {r.Total}");
// Alice: 50 / Bob: 75 / Alice: 30`,
    explanation: "`Join` correlates two sequences by a key — equivalent to SQL INNER JOIN; `GroupJoin` produces a left outer join where each left element is paired with a (possibly empty) collection of matching right elements.",
  },
  {
    id: "cs-0521-b1-unsafe-pointer",
    language: "csharp",
    title: "unsafe pointers and pointer arithmetic",
    tag: "types",
    code: `using System;

int[] arr = { 10, 20, 30, 40, 50 };

unsafe
{
    fixed (int* p = arr)
    {
        // Pointer arithmetic: advance by sizeof(int) each step
        for (int* ptr = p; ptr < p + arr.Length; ptr++)
            Console.Write(*ptr + " ");
        // 10 20 30 40 50

        // Modify in place
        *(p + 2) = 99;
    }
}
Console.WriteLine(arr[2]);   // 99`,
    explanation: "C# unsafe blocks allow C-style pointer arithmetic — `fixed` pins the array, `*ptr` dereferences, and `ptr + n` advances by `n * sizeof(T)` bytes; enable `<AllowUnsafeBlocks>true</AllowUnsafeBlocks>` in the csproj.",
  },
  {
    id: "cs-0521-b1-expression-tree",
    language: "csharp",
    title: "expression trees: code as data",
    tag: "types",
    code: `using System.Linq.Expressions;

// Lambda as Expression — not a delegate
Expression<Func<int, int, int>> expr = (a, b) => a + b;

Console.WriteLine(expr);   // (a, b) => (a + b)

// Inspect the tree
var body = (BinaryExpression)expr.Body;
Console.WriteLine(body.NodeType);   // Add
Console.WriteLine(body.Left);       // a
Console.WriteLine(body.Right);      // b

// Compile to a real delegate
Func<int, int, int> add = expr.Compile();
Console.WriteLine(add(3, 4));   // 7`,
    explanation: "When a lambda is assigned to `Expression<Func<...>>` instead of `Func<...>`, the compiler captures the AST rather than compiling it — EF Core, LINQ to SQL, and similar frameworks translate these trees to SQL instead of executing C# code.",
  },
  {
    id: "cs-0521-b1-iasyncenumerable",
    language: "csharp",
    title: "IAsyncEnumerable<T> for async streams",
    tag: "snippet",
    code: `using System.Collections.Generic;
using System.Threading.Tasks;

async IAsyncEnumerable<int> FetchPages()
{
    for (int page = 1; page <= 3; page++)
    {
        await Task.Delay(10);        // simulate HTTP request
        yield return page * 100;     // items from this page
    }
}

async Task Main()
{
    await foreach (var item in FetchPages())
        Console.Write(item + " ");   // 100 200 300
}

await Main();`,
    explanation: "`IAsyncEnumerable<T>` pairs `yield return` with `async/await` — each `yield return` can do async I/O before producing the next item; `await foreach` consumes it without buffering all items into memory.",
  },
  {
    id: "cs-0521-b1-params-array",
    language: "csharp",
    title: "params keyword for variable argument lists",
    tag: "snippet",
    code: `int Sum(params int[] numbers)
{
    int total = 0;
    foreach (var n in numbers) total += n;
    return total;
}

Console.WriteLine(Sum(1, 2, 3));          // 6
Console.WriteLine(Sum(1, 2, 3, 4, 5));   // 15
Console.WriteLine(Sum());                 // 0

// Also accepts an existing array
int[] arr = { 10, 20, 30 };
Console.WriteLine(Sum(arr));   // 60

// C# 13: params IEnumerable<T> (any collection)
// string Join(string sep, params IEnumerable<string> parts) { ... }`,
    explanation: "`params` marks the last parameter as a variable-length argument — callers can pass individual values or an array; the compiler packs individual values into an array for you, keeping the call site clean.",
  },
  {
    id: "cs-0521-b1-operator-overload",
    language: "csharp",
    title: "operator overloading",
    tag: "classes",
    code: `readonly struct Money
{
    public decimal Amount { get; }
    public string Currency { get; }

    public Money(decimal amount, string currency)
        => (Amount, Currency) = (amount, currency);

    public static Money operator +(Money a, Money b)
    {
        if (a.Currency != b.Currency)
            throw new InvalidOperationException("currency mismatch");
        return new Money(a.Amount + b.Amount, a.Currency);
    }

    public static bool operator >(Money a, Money b)  => a.Amount > b.Amount;
    public static bool operator <(Money a, Money b)  => a.Amount < b.Amount;

    public override string ToString() => $"{Amount:F2} {Currency}";
}

var a = new Money(10m, "USD");
var b = new Money(20m, "USD");
Console.WriteLine(a + b);   // 30.00 USD
Console.WriteLine(a < b);   // True`,
    explanation: "Overloading `+`, `>`, `<` and similar operators on a struct lets your type participate in natural arithmetic expressions — `>` and `<` must be overloaded as a pair; the compiler generates `>=`/`<=` from their combination only if you also define `==`/`!=`.",
  },
  {
    id: "cs-0521-b1-interpolated-string-handler",
    language: "csharp",
    title: "conditional logging with interpolated string handlers",
    tag: "snippet",
    code: `using System.Runtime.CompilerServices;

// Realistic example: ILogger-style check
class Logger
{
    public bool IsDebugEnabled = false;

    // The compiler uses this overload and passes a handler
    // that skips interpolation if IsDebugEnabled is false
    public void Debug(
        [InterpolatedStringHandlerArgument("")] // advanced API
        ref DefaultInterpolatedStringHandler msg)
    {
        if (IsDebugEnabled)
            Console.WriteLine(msg.ToStringAndClear());
    }
}

// Practical: just use the null-conditional pattern
var log = new Logger { IsDebugEnabled = false };
// No string allocation if disabled — handler short-circuits`,
    explanation: "Interpolated string handlers (C# 10+) let libraries receive the interpolated string as a lazy builder — if logging is disabled, neither the string nor any of its arguments are evaluated, eliminating the hot-path allocation.",
  },
  {
    id: "cs-0521-b1-generic-math",
    language: "csharp",
    title: "generic math with INumber<T> (C# 11 / .NET 7+)",
    tag: "types",
    code: `using System.Numerics;

// Works for int, double, decimal, float, etc.
T Sum<T>(IEnumerable<T> values) where T : INumber<T>
{
    T total = T.Zero;
    foreach (var v in values)
        total += v;
    return total;
}

Console.WriteLine(Sum(new[] { 1, 2, 3, 4 }));            // 10
Console.WriteLine(Sum(new[] { 1.5, 2.5, 3.0 }));         // 7
Console.WriteLine(Sum(new[] { 10m, 20m, 30m }));          // 60

T Average<T>(IEnumerable<T> values) where T : INumber<T>
{
    var list = values.ToList();
    return Sum(list) / T.CreateChecked(list.Count);
}`,
    explanation: "`INumber<T>` (System.Numerics) is a static interface that abstracts over all numeric types — static abstract members like `T.Zero` and `T.CreateChecked` let you write truly generic math algorithms without boxing.",
  },
  {
    id: "cs-0521-b1-required-members",
    language: "csharp",
    title: "required members (C# 11+)",
    tag: "classes",
    code: `class Config
{
    public required string Host { get; init; }   // must be set
    public required int    Port { get; init; }
    public string? ApiKey { get; init; }         // optional

    public override string ToString() =>
        $"{Host}:{Port}";
}

// OK — all required members provided
var cfg = new Config { Host = "localhost", Port = 8080 };
Console.WriteLine(cfg);   // localhost:8080

// Compile error if you omit Host or Port:
// var bad = new Config { Port = 8080 };`,
    explanation: "`required` forces object initializers to supply the property — unlike non-nullable properties which only warn, `required` is a compile error if omitted; it works with primary constructors and record types too.",
  },
  {
    id: "cs-0521-b1-sorted-dictionary",
    language: "csharp",
    title: "SortedDictionary vs SortedList",
    tag: "structures",
    code: `using System.Collections.Generic;

var sd = new SortedDictionary<string, int>
{
    ["banana"] = 2, ["apple"] = 5, ["cherry"] = 3,
};

// Always iterates in sorted key order
foreach (var kv in sd)
    Console.Write($"{kv.Key}:{kv.Value} ");
// apple:5 banana:2 cherry:3

// SortedList uses two parallel arrays — less memory, O(n) insert
var sl = new SortedList<string, int>
{
    ["z"] = 26, ["a"] = 1, ["m"] = 13,
};
Console.WriteLine(sl.IndexOfKey("m"));   // 1 (sorted position)`,
    explanation: "`SortedDictionary` uses a red-black tree (O(log n) insert/lookup); `SortedList` uses parallel arrays (O(n) insert, O(log n) lookup, less memory) — choose `SortedDictionary` for frequent inserts, `SortedList` for build-once/read-many.",
  },
  {
    id: "cs-0521-b1-pattern-property",
    language: "csharp",
    title: "property patterns in switch expressions",
    tag: "snippet",
    code: `record Order(string Status, decimal Total, bool IsPriority);

string Classify(Order o) => o switch
{
    { Status: "cancelled" }               => "cancelled",
    { Status: "pending", Total: > 1000m } => "high-value pending",
    { IsPriority: true, Status: "pending" } => "priority pending",
    { Status: "pending" }                 => "normal pending",
    _                                     => "other",
};

Console.WriteLine(Classify(new Order("pending", 1500m, false)));
// high-value pending
Console.WriteLine(Classify(new Order("pending", 50m,   true)));
// priority pending`,
    explanation: "Property patterns `{ PropertyName: pattern }` destructure an object's properties directly in a switch arm — they can be nested, combined with relational patterns (`> 1000`), and chained with `,` for AND semantics.",
  },
  {
    id: "cs-0521-b1-linq-zip",
    language: "csharp",
    title: "LINQ Zip for parallel sequence processing",
    tag: "snippet",
    code: `using System.Linq;

var names  = new[] { "Alice", "Bob", "Carol" };
var scores = new[] { 90, 85, 92 };

// Two-sequence Zip
var paired = names.Zip(scores, (n, s) => $"{n}: {s}");
foreach (var p in paired)
    Console.WriteLine(p);
// Alice: 90 / Bob: 85 / Carol: 92

// Three-sequence Zip (C# 9 / .NET 6)
var ranks = new[] { 1, 3, 2 };
var triples = names.Zip(scores).Zip(ranks,
    (ns, r) => $"#{r} {ns.First} ({ns.Second})");
foreach (var t in triples)
    Console.WriteLine(t);`,
    explanation: "`Zip` pairs elements from two (or three) sequences positionally and applies a result selector — it stops at the shortest sequence; the .NET 6 overload without a selector returns `(TFirst, TSecond)` value tuples.",
  },
  {
    id: "cs-0521-b1-stackoverflowguard",
    language: "csharp",
    title: "int overflow and checked arithmetic",
    tag: "caveats",
    code: `// Unchecked (default): wraps around silently
int max = int.MaxValue;
int wrapped = max + 1;
Console.WriteLine(wrapped);   // -2147483648 (silent overflow!)

// Checked: throws OverflowException
try
{
    int overflow = checked(max + 1);
}
catch (OverflowException e)
{
    Console.WriteLine(e.Message);   // Arithmetic operation resulted in an overflow.
}

// checked block
checked
{
    long bigSum = (long)int.MaxValue + int.MaxValue;
    // Would throw if result were assigned to int
    Console.WriteLine(bigSum);   // 4294967294
}`,
    explanation: "C# integer arithmetic is unchecked by default — overflow wraps silently in release builds; `checked` contexts throw `OverflowException` on overflow, which is safer for financial/safety-critical code at the cost of a bounds check.",
  },
  {
    id: "cs-0521-b1-inline-array",
    language: "csharp",
    title: "InlineArray for fixed-size stack buffers (C# 12+)",
    tag: "types",
    code: `using System.Runtime.CompilerServices;

[InlineArray(8)]
struct Buffer8
{
    private int _element;   // exactly one field required
}

// Use like a fixed-size array on the stack
var buf = new Buffer8();
for (int i = 0; i < 8; i++)
    buf[i] = i * i;

Console.WriteLine(buf[3]);   // 9
Console.WriteLine(buf[7]);   // 49

// Slice into Span
Span<int> span = buf;
Console.WriteLine(span.Length);   // 8`,
    explanation: "`[InlineArray(N)]` (C# 12 / .NET 8) creates a fixed-size, stack-allocated array-like struct without unsafe code — the JIT emits it as N consecutive fields, making it faster and safer than `fixed` arrays in unsafe structs.",
  },
  {
    id: "cs-0521-b1-exception-filter",
    language: "csharp",
    title: "exception filters with when clause",
    tag: "caveats",
    code: `using System.Net.Http;

async Task FetchWithRetry(string url)
{
    int attempts = 0;
    retry:
    try
    {
        var client = new HttpClient();
        var result = await client.GetStringAsync(url);
        Console.WriteLine(result[..50]);
    }
    catch (HttpRequestException e) when (e.StatusCode == System.Net.HttpStatusCode.TooManyRequests && ++attempts < 3)
    {
        await Task.Delay(1000 * attempts);
        goto retry;   // simplified; use a loop in production
    }
    catch (HttpRequestException e)
    {
        Console.WriteLine($"Fatal: {e.Message}");
    }
}`,
    explanation: "`when (condition)` in a `catch` clause filters the exception without unwinding the stack — unlike nested `if` inside the handler, the `when` condition runs in the original call stack frame, preserving the full stack trace.",
  },
  {
    id: "cs-0521-b1-extension-methods",
    language: "csharp",
    title: "extension methods for non-invasive augmentation",
    tag: "classes",
    code: `using System.Collections.Generic;

static class Extensions
{
    // Add a method to any IEnumerable<T>
    public static IEnumerable<T> WhereNot<T>(
        this IEnumerable<T> source, Func<T, bool> predicate)
        => source.Where(x => !predicate(x));

    // Add to string
    public static bool IsNullOrEmpty(this string? s)
        => string.IsNullOrEmpty(s);

    // Batching
    public static IEnumerable<T[]> Chunk<T>(
        this IEnumerable<T> source, int size)
        => source.Chunk(size);  // built-in since .NET 6
}

var evens = Enumerable.Range(1, 10).WhereNot(x => x % 2 != 0);
Console.WriteLine(string.Join(",", evens));   // 2,4,6,8,10`,
    explanation: "Extension methods appear on a type without modifying it — defined as `static` methods with `this T` as the first parameter, they're resolved at compile time and don't affect the type's IL or interface conformance.",
  },
  {
    id: "cs-0521-b1-primary-constructor",
    language: "csharp",
    title: "primary constructors (C# 12+)",
    tag: "classes",
    code: `// Primary constructor parameters become the class's scope
class Logger(string name, bool verbose)
{
    public void Log(string msg)
    {
        if (verbose)
            Console.WriteLine($"[{name}] {msg}");
    }

    // Parameters captured in members without explicit field
    public string Name => name;
}

var log = new Logger("App", verbose: true);
log.Log("started");   // [App] started

// Struct with primary constructor
struct Point(double x, double y)
{
    public double X => x;
    public double Y => y;
    public double Magnitude => Math.Sqrt(x * x + y * y);
}`,
    explanation: "Primary constructors (C# 12) declare constructor parameters in the class header — they're captured by the class body as \"primary constructor parameters\" (not fields), reducing the boilerplate of storing them yourself.",
  },
  {
    id: "cs-0521-b1-linq-distinct-by",
    language: "csharp",
    title: "LINQ DistinctBy and ExceptBy (.NET 6+)",
    tag: "snippet",
    code: `using System.Linq;

var people = new[]
{
    (Name: "Alice", Dept: "Eng"),
    (Name: "Bob",   Dept: "HR"),
    (Name: "Carol", Dept: "Eng"),
};

// DistinctBy — keep first per key
var depts = people.DistinctBy(p => p.Dept);
foreach (var p in depts)
    Console.WriteLine(p.Name);   // Alice / Bob

// ExceptBy — items in first but not second by key
var excluded = new[] { "Eng" };
var nonEng = people.ExceptBy(excluded, p => p.Dept);
foreach (var p in nonEng)
    Console.WriteLine(p.Name);   // Bob`,
    explanation: "`DistinctBy` removes duplicates by a key selector rather than full object equality; `ExceptBy`, `IntersectBy`, and `UnionBy` extend the same idea — they arrived in .NET 6 to fill the gap between `Distinct` and `GroupBy`.",
  },
  {
    id: "cs-0521-b1-lock-statement",
    language: "csharp",
    title: "lock statement for thread-safe shared state",
    tag: "caveats",
    code: `using System.Threading;
using System.Threading.Tasks;

class Counter
{
    private int _value = 0;
    private readonly object _lock = new();

    public void Increment()
    {
        lock (_lock)       // mutual exclusion
        {
            _value++;      // read-increment-write is now atomic
        }
    }

    public int Value => _value;
}

var counter = new Counter();
Parallel.For(0, 10_000, _ => counter.Increment());
Console.WriteLine(counter.Value);   // 10000 (always)`,
    explanation: "`lock (obj)` acquires a monitor on `obj` — any thread that tries to enter the same lock blocks until the holder exits; always lock on a private `readonly object` to prevent external code from interfering.",
  },
  {
    id: "cs-0521-b1-nullable-value-type",
    language: "csharp",
    title: "Nullable<T> (T?) for optional value types",
    tag: "types",
    code: `int? a = null;
int? b = 42;

// HasValue / Value
Console.WriteLine(a.HasValue);   // False
Console.WriteLine(b.Value);      // 42

// GetValueOrDefault
Console.WriteLine(a.GetValueOrDefault(-1));   // -1

// Null-coalescing
int result = a ?? 0;
Console.WriteLine(result);   // 0

// Lifted operators: null propagates through arithmetic
int? sum = a + b;
Console.WriteLine(sum);       // (blank) — null

// Implicit conversion from T
int? x = 5;                   // implicitly wrapped`,
    explanation: "`Nullable<T>` wraps a value type with a `HasValue` flag — arithmetic operators are \"lifted\" so that any `null` operand produces `null`; `??` and `?.` are the primary tools for providing safe fallbacks.",
  },
  {
    id: "cs-0521-b1-source-generator-intro",
    language: "csharp",
    title: "source generators: compile-time code generation",
    tag: "classes",
    code: `// Source generators run during compilation and emit C# code.
// Example: JsonSerializerContext (System.Text.Json)

using System.Text.Json.Serialization;

// Mark a class so the generator emits a fast, AOT-safe serializer
[JsonSerializable(typeof(Person))]
[JsonSerializable(typeof(List<Person>))]
partial class AppJsonContext : JsonSerializerContext { }

record Person(string Name, int Age);

// Usage: no reflection at runtime
var json = System.Text.Json.JsonSerializer.Serialize(
    new Person("Alice", 30),
    AppJsonContext.Default.Person);

Console.WriteLine(json);  // {"Name":"Alice","Age":30}`,
    explanation: "Source generators hook into the compiler to emit additional C# files — `System.Text.Json`'s context-based serializer uses them to produce reflection-free serialization code that works in AOT/trimmed deployments.",
  },
  {
    id: "cs-0521-b1-array-segment",
    language: "csharp",
    title: "ArraySegment<T> as a managed array slice",
    tag: "structures",
    code: `byte[] data = { 1, 2, 3, 4, 5, 6, 7, 8 };

// Slice without copying
var seg = new ArraySegment<byte>(data, offset: 2, count: 4);

Console.WriteLine(seg.Count);    // 4
Console.WriteLine(seg[0]);       // 3  (data[2])
Console.WriteLine(seg.Offset);   // 2
Console.WriteLine(seg.Array == data);  // True — same underlying array

// Mutations affect original
seg[0] = 99;
Console.WriteLine(data[2]);      // 99

// Prefer Span<T> in new code — ArraySegment predates Span`,
    explanation: "`ArraySegment<T>` is the pre-Span way to represent a slice — it wraps an array with an offset and count, sharing the same backing array without copying; prefer `Span<T>` in new code for better API support.",
  },
  {
    id: "cs-0521-b1-fileio-path",
    language: "csharp",
    title: "Path and File for filesystem operations",
    tag: "snippet",
    code: `using System.IO;

// Path composition
string dir  = Path.Combine("/tmp", "demo");
string file = Path.Combine(dir, "log.txt");

Directory.CreateDirectory(dir);
File.WriteAllText(file, "hello world");

// Read back
string content = File.ReadAllText(file);
Console.WriteLine(content);   // hello world

// Path info
Console.WriteLine(Path.GetExtension(file));    // .txt
Console.WriteLine(Path.GetFileNameWithoutExtension(file)); // log
Console.WriteLine(Path.GetDirectoryName(file)); // /tmp/demo

// List files
foreach (var f in Directory.GetFiles(dir, "*.txt"))
    Console.WriteLine(f);`,
    explanation: "`Path.Combine` handles separators correctly across OS; `File.WriteAllText`/`ReadAllText` cover common one-shot operations; `Directory.GetFiles` with a glob pattern replaces manual directory iteration.",
  },
  {
    id: "cs-0521-b1-task-parallel-library",
    language: "csharp",
    title: "Parallel.ForEach for CPU-bound parallelism",
    tag: "snippet",
    code: `using System.Threading.Tasks;
using System.Linq;

var data = Enumerable.Range(0, 1_000_000).ToArray();

// CPU-bound: use Parallel, not async
long sum = 0;
object lockObj = new();

Parallel.ForEach(data,
    localInit:  () => 0L,                         // per-partition accumulator
    body:       (x, _, local) => local + x,       // add to local sum
    localFinally: local => { lock(lockObj) sum += local; }
);

Console.WriteLine(sum);   // 499999500000`,
    explanation: "`Parallel.ForEach` with partition-local state avoids a lock on every element — each thread accumulates into a local variable and only locks once at the end, making it far more scalable than locking inside the body.",
  },
  {
    id: "cs-0521-b1-string-comparison",
    language: "csharp",
    title: "StringComparison for culture-aware string ops",
    tag: "caveats",
    code: `string a = "café";
string b = "CAFÉ";

// Ordinal: byte-by-byte, fast, not culture-aware
Console.WriteLine(string.Equals(a, b, StringComparison.Ordinal));          // False
Console.WriteLine(string.Equals(a, b, StringComparison.OrdinalIgnoreCase));// True

// CurrentCulture: respects locale rules
// InvariantCulture: stable across machines (use for persisted data)
Console.WriteLine(string.Compare("ä", "a",
    StringComparison.InvariantCulture));  // positive (ä > a)

// Always specify comparison when it matters
bool found = "hello".Contains("HELLO", StringComparison.OrdinalIgnoreCase);
Console.WriteLine(found);   // True`,
    explanation: "String comparison in C# defaults to ordinal (byte comparison) when you use `==`, but LINQ `Contains`/`IndexOf` default to `CurrentCulture` — always pass `StringComparison` explicitly to make intent clear and avoid locale bugs.",
  },
  {
    id: "cs-0521-b1-bitwise-ops",
    language: "csharp",
    title: "bitwise operations and bit flags with [Flags]",
    tag: "snippet",
    code: `[System.Flags]
enum Permission
{
    None    = 0,
    Read    = 1 << 0,   // 1
    Write   = 1 << 1,   // 2
    Execute = 1 << 2,   // 4
    All     = Read | Write | Execute,
}

var perms = Permission.Read | Permission.Write;

Console.WriteLine(perms);                          // Read, Write
Console.WriteLine(perms.HasFlag(Permission.Read)); // True
Console.WriteLine(perms.HasFlag(Permission.Execute)); // False

// Add a flag
perms |= Permission.Execute;
// Remove a flag
perms &= ~Permission.Write;

Console.WriteLine(perms);   // Read, Execute`,
    explanation: "`[Flags]` makes `ToString()` print human-readable combinations and `HasFlag` work correctly — always assign power-of-two values; use `|=` to add a flag and `&= ~flag` to remove it.",
  },
  {
    id: "cs-0521-b1-abstract-record",
    language: "csharp",
    title: "abstract records for discriminated unions",
    tag: "classes",
    code: `abstract record Result<T>;
record Success<T>(T Value)  : Result<T>;
record Failure<T>(string Error) : Result<T>;

Result<int> ParseInt(string s)
    => int.TryParse(s, out int n)
        ? new Success<int>(n)
        : new Failure<int>($"'{s}' is not a number");

string Display<T>(Result<T> r) => r switch
{
    Success<T> s  => $"OK: {s.Value}",
    Failure<T> f  => $"Error: {f.Error}",
    _             => throw new Exception("unreachable"),
};

Console.WriteLine(Display(ParseInt("42")));    // OK: 42
Console.WriteLine(Display(ParseInt("abc")));   // Error: 'abc' is not a number`,
    explanation: "An abstract record base with concrete subtypes simulates a discriminated union — switch expressions exhaustively pattern-match on the subtype, and the compiler warns if a new subtype is added without updating the switch.",
  },
  {
    id: "cs-0521-b1-task-exception",
    language: "csharp",
    title: "exception handling in async methods",
    tag: "caveats",
    code: `async Task<int> ParseAsync(string s)
{
    await Task.Delay(1);
    return int.Parse(s);   // throws FormatException for bad input
}

// Exception is re-thrown at the await point — not at Task creation
try
{
    int result = await ParseAsync("bad");
}
catch (FormatException e)
{
    Console.WriteLine(e.Message);   // Input string was not in a correct format.
}

// Task.WhenAll wraps multiple exceptions in AggregateException
try
{
    await Task.WhenAll(ParseAsync("x"), ParseAsync("y"));
}
catch (Exception e)
{
    Console.WriteLine(e.GetType().Name);  // FormatException (first)
}`,
    explanation: "Exceptions from `async` methods are captured in the returned `Task` and re-thrown at the `await` site — `Task.WhenAll` packs all exceptions into an `AggregateException` but only re-throws the first one through `await`.",
  },
  {
    id: "cs-0521-b1-record-equality-custom",
    language: "csharp",
    title: "customizing record equality",
    tag: "classes",
    code: `record Temperature(double Celsius)
{
    // Override generated equality to allow epsilon comparison
    public virtual bool Equals(Temperature? other)
    {
        if (other is null) return false;
        return Math.Abs(Celsius - other.Celsius) < 0.001;
    }

    public override int GetHashCode()
        => Math.Round(Celsius, 3).GetHashCode();
}

var t1 = new Temperature(36.999);
var t2 = new Temperature(37.000);

Console.WriteLine(t1 == t2);          // True  (within epsilon)
Console.WriteLine(t1.Equals(t2));     // True

var set = new HashSet<Temperature> { t1 };
Console.WriteLine(set.Contains(t2));  // True`,
    explanation: "Records generate `Equals`/`GetHashCode` from all init properties — you can override them while keeping `with`-expressions and deconstruction; override `virtual bool Equals(T? other)` (not `object.Equals`) to intercept the generated path.",
  },
  {
    id: "cs-0521-b1-async-enumerable-cancel",
    language: "csharp",
    title: "cancellation in async streams",
    tag: "snippet",
    code: `using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

async IAsyncEnumerable<int> Counter(
    [System.Runtime.CompilerServices.EnumeratorCancellation]
    CancellationToken ct = default)
{
    for (int i = 0; ; i++)
    {
        ct.ThrowIfCancellationRequested();
        await Task.Delay(10, ct);
        yield return i;
    }
}

using var cts = new CancellationTokenSource(TimeSpan.FromMilliseconds(50));
await foreach (var n in Counter().WithCancellation(cts.Token))
    Console.Write(n + " ");   // 0 1 2 3 (then OperationCanceledException)`,
    explanation: "`[EnumeratorCancellation]` marks the parameter that `WithCancellation(token)` should inject — the token flows into the iterator body so it can check cancellation at each `yield` without the caller needing to pass it explicitly.",
  },
  {
    id: "cs-0521-b1-linq-order",
    language: "csharp",
    title: "OrderBy, ThenBy, and stable sorting",
    tag: "snippet",
    code: `using System.Linq;

var people = new[]
{
    (Name: "Charlie", Age: 30),
    (Name: "Alice",   Age: 25),
    (Name: "Bob",     Age: 30),
    (Name: "Diana",   Age: 25),
};

// Primary sort, then secondary
var sorted = people
    .OrderBy(p => p.Age)
    .ThenBy(p => p.Name)
    .ToList();

foreach (var p in sorted)
    Console.WriteLine($"{p.Name} {p.Age}");
// Alice 25 / Diana 25 / Bob 30 / Charlie 30

// Descending
var desc = people.OrderByDescending(p => p.Age).ToList();`,
    explanation: "LINQ sorts are stable — elements with equal keys preserve their relative input order; chain `ThenBy`/`ThenByDescending` for secondary sorts without disturbing the primary order.",
  },
  {
    id: "cs-0521-b1-environment-variables",
    language: "csharp",
    title: "reading environment variables with fallback",
    tag: "snippet",
    code: `using System;

// Basic read
string? dbUrl = Environment.GetEnvironmentVariable("DATABASE_URL");

// With fallback
string host = Environment.GetEnvironmentVariable("DB_HOST")
    ?? "localhost";

int port = int.TryParse(
    Environment.GetEnvironmentVariable("DB_PORT"), out int p)
    ? p : 5432;

Console.WriteLine($"Connecting to {host}:{port}");

// Set for the current process
Environment.SetEnvironmentVariable("MY_VAR", "hello");
Console.WriteLine(Environment.GetEnvironmentVariable("MY_VAR")); // hello`,
    explanation: "`GetEnvironmentVariable` returns `null` if the variable is unset — always provide a default via `??` for optional config and validate required variables at startup so you fail fast with a clear message.",
  },
  {
    id: "cs-0521-b1-spans-ref-struct",
    language: "csharp",
    title: "ref struct: stack-only constraint",
    tag: "types",
    code: `// ref struct can only live on the stack
ref struct StackOnly
{
    public int Value;
    public StackOnly(int v) => Value = v;
}

// These are all compile errors:
// StackOnly[] arr = new StackOnly[5];   // no heap arrays
// object box = new StackOnly(1);        // no boxing
// async Task Use(StackOnly s) { }       // no async

// Valid uses:
StackOnly s = new StackOnly(42);
Console.WriteLine(s.Value);   // 42

// Span<T> and ReadOnlySpan<T> are ref structs
Span<int> span = stackalloc int[5];
Console.WriteLine(span.Length);   // 5`,
    explanation: "`ref struct` types are constrained to the stack — they can't be boxed, stored in arrays, or captured by lambdas, but the runtime can make strong guarantees about their lifetime, enabling safe zero-copy abstractions like `Span`.",
  },
  {
    id: "cs-0521-b1-coalesce-assign",
    language: "csharp",
    title: "??= null-coalescing assignment operator",
    tag: "snippet",
    code: `string? cached = null;

// Without ??=
if (cached == null) cached = ComputeExpensiveValue();

// With ??=
cached ??= ComputeExpensiveValue();
Console.WriteLine(cached);   // computed

// Second call: already set, no-op
cached ??= "different value";
Console.WriteLine(cached);   // still the original computed value

static string ComputeExpensiveValue()
{
    Console.WriteLine("computing...");
    return "result";
}`,
    explanation: "`??=` assigns the right-hand side to the left-hand variable only if it is currently `null` — it's a clean single-expression lazy initialization idiom, equivalent to `if (x == null) x = value`.",
  },
  {
    id: "cs-0521-b1-span-indexrange",
    language: "csharp",
    title: "Index and Range: ^ and .. operators",
    tag: "snippet",
    code: `int[] arr = { 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 };

// ^ counts from the end
Console.WriteLine(arr[^1]);   // 9  (last)
Console.WriteLine(arr[^2]);   // 8

// .. creates a Range
Console.WriteLine(arr[2..5]);  // [2, 3, 4]  (exclusive end)
Console.WriteLine(arr[..3]);   // [0, 1, 2]  (from start)
Console.WriteLine(arr[7..]);   // [7, 8, 9]  (to end)
Console.WriteLine(arr[^3..]);  // [7, 8, 9]  (last 3)

// Works on strings, Span, List (with GetSlice extension)
string s = "Hello, World!";
Console.WriteLine(s[7..^1]);   // World`,
    explanation: "`^n` is shorthand for `index from end` (equivalent to `arr.Length - n`); `..` creates a `Range` — both work on arrays, strings, and `Span<T>` using the `Index`/`Range` types introduced in C# 8.",
  },
  {
    id: "cs-0521-b1-convert-parse",
    language: "csharp",
    title: "TryParse vs Parse vs Convert",
    tag: "caveats",
    code: `string input = "not a number";

// Parse: throws on failure
try
{
    int n = int.Parse(input);
}
catch (FormatException e) { Console.WriteLine(e.Message); }

// TryParse: returns bool, no exception
if (int.TryParse(input, out int result))
    Console.WriteLine(result);
else
    Console.WriteLine("parse failed");   // this prints

// Convert.ToInt32: handles null (returns 0), throws on bad format
Console.WriteLine(Convert.ToInt32(null));   // 0

// Prefer TryParse for user input, Parse for trusted data`,
    explanation: "`TryParse` is the right choice for user/external input — no exception overhead; `Parse` is fine for data you trust to be valid; `Convert` is a legacy API that silently converts `null` to zero, which can mask bugs.",
  },
  {
    id: "cs-0521-b1-generic-singleton",
    language: "csharp",
    title: "generic singleton registry pattern",
    tag: "classes",
    code: `using System.Collections.Concurrent;

static class Registry
{
    private static readonly ConcurrentDictionary<Type, object> _cache = new();

    public static T GetOrCreate<T>() where T : new()
        => (T)_cache.GetOrAdd(typeof(T), _ => new T());
}

class ServiceA { public string Name => "A"; }
class ServiceB { public string Name => "B"; }

var a1 = Registry.GetOrCreate<ServiceA>();
var a2 = Registry.GetOrCreate<ServiceA>();
Console.WriteLine(a1 == a2);    // True — same instance
Console.WriteLine(Registry.GetOrCreate<ServiceB>().Name);  // B`,
    explanation: "A `ConcurrentDictionary<Type, object>` keyed on `typeof(T)` acts as a thread-safe, type-indexed singleton store — `GetOrAdd` is atomic, so two threads racing to create the same service only construct one instance.",
  },
  {
    id: "cs-0521-b1-icomparer-custom",
    language: "csharp",
    title: "custom IComparer<T> for complex sort orders",
    tag: "structures",
    code: `using System.Collections.Generic;

class VersionComparer : IComparer<string>
{
    public int Compare(string? x, string? y)
    {
        var vx = System.Version.Parse(x ?? "0");
        var vy = System.Version.Parse(y ?? "0");
        return vx.CompareTo(vy);
    }
}

var versions = new[] { "2.0.1", "1.10.0", "1.9.0", "2.1.0" };

Array.Sort(versions, new VersionComparer());
Console.WriteLine(string.Join(", ", versions));
// 1.9.0, 1.10.0, 2.0.1, 2.1.0   <- version-aware (not lexicographic)`,
    explanation: "`IComparer<T>` decouples sort logic from the type — pass it to `Array.Sort`, `List.Sort`, `SortedDictionary`, or LINQ `OrderBy` without modifying the type; `Comparer<T>.Create` creates one from a lambda.",
  },
  {
    id: "cs-0521-b1-volatile-interlocked",
    language: "csharp",
    title: "Volatile and Interlocked for lock-free primitives",
    tag: "caveats",
    code: `using System.Threading;

class Flags
{
    private volatile bool _running = true;   // volatile: no caching

    public void Stop() => _running = false;

    public void Run()
    {
        while (_running) { /* work */ }
    }
}

// Interlocked: atomic compare-and-swap / increment
int counter = 0;
Parallel.For(0, 10_000, _ => Interlocked.Increment(ref counter));
Console.WriteLine(counter);   // 10000 (always correct)

// CompareExchange: set to newVal only if current == comparand
int val = 0;
int original = Interlocked.CompareExchange(ref val, 1, 0);
Console.WriteLine(original);  // 0 (previous value)
Console.WriteLine(val);       // 1`,
    explanation: "`volatile` prevents the CPU and compiler from reordering reads/writes to a field; `Interlocked.Increment` is an atomic read-increment-write without a lock — both are lighter than `lock` but only cover single-variable invariants.",
  },
  {
    id: "cs-0521-b1-span-text-parsing",
    language: "csharp",
    title: "parsing integers from Span<char> without allocation",
    tag: "snippet",
    code: `using System;

// Parses a CSV of integers without allocating any strings
static long SumCsv(ReadOnlySpan<char> csv)
{
    long total = 0;
    while (!csv.IsEmpty)
    {
        int comma = csv.IndexOf(',');
        ReadOnlySpan<char> token = comma >= 0
            ? csv[..comma]
            : csv;

        if (int.TryParse(token, out int n))
            total += n;

        csv = comma >= 0 ? csv[(comma + 1)..] : default;
    }
    return total;
}

Console.WriteLine(SumCsv("1,2,3,4,5,6,7,8,9,10"));  // 55`,
    explanation: "`int.TryParse(ReadOnlySpan<char>, out int)` avoids converting the slice to a `string` first — combined with index-based slicing, this parses CSV lines with zero heap allocations, critical for high-frequency log/data processing.",
  },
  {
    id: "cs-0521-b1-generic-variance-interface",
    language: "csharp",
    title: "IEnumerable covariance in practice",
    tag: "types",
    code: `using System.Collections.Generic;

class Animal { public virtual string Sound => "..."; }
class Dog : Animal { public override string Sound => "Woof"; }

// IEnumerable<Dog> can be assigned to IEnumerable<Animal>
IEnumerable<Dog> dogs = new List<Dog> { new(), new() };
IEnumerable<Animal> animals = dogs;   // covariance: Dog -> Animal is safe

foreach (var a in animals)
    Console.WriteLine(a.Sound);   // Woof / Woof

// List<Dog> cannot be assigned to List<Animal> — IList is invariant
// IList<Animal> bad = new List<Dog>();   // compile error`,
    explanation: "`IEnumerable<T>` is covariant (`out T`) so `IEnumerable<Dog>` assigns to `IEnumerable<Animal>` — safe because you only read; `IList<T>` is invariant because you can also write (`Add(animal)` could insert a non-Dog).",
  },
];
