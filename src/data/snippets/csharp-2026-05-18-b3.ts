import type { Snippet } from "./types";

export const csharpSnippets20260518B3: Snippet[] = [
  // --- snippet ---
  {
    id: "cs-b18-b3-span-stackalloc",
    language: "csharp",
    title: "Span<T> with stackalloc",
    tag: "snippet",
    code: `using System;

Span<int> buffer = stackalloc int[8];
for (int i = 0; i < buffer.Length; i++)
    buffer[i] = i * i;

foreach (var v in buffer)
    Console.Write(v + " ");
// 0 1 4 9 16 25 36 49`,
    explanation: "stackalloc allocates on the stack inside a Span<T>, enabling zero-allocation temporary buffers that are automatically freed when the method returns.",
  },
  {
    id: "cs-b18-b3-interpolated-string-handler",
    language: "csharp",
    title: "Interpolated string handler (C# 10+)",
    tag: "snippet",
    code: `using System.Runtime.CompilerServices;

// Conditional logging without string allocation when disabled
static void Log(bool enabled,
    [InterpolatedStringHandlerArgument("enabled")] ref LogHandler handler)
{
    if (enabled) Console.WriteLine(handler.GetResult());
}

[InterpolatedStringHandler]
struct LogHandler
{
    private System.Text.StringBuilder _sb;
    public LogHandler(int literalLen, int formattedCount, bool enabled)
    {
        if (!enabled) return;
        _sb = new System.Text.StringBuilder(literalLen);
    }
    public void AppendLiteral(string s) => _sb?.Append(s);
    public void AppendFormatted<T>(T value) => _sb?.Append(value);
    public string GetResult() => _sb?.ToString() ?? "";
}

Log(false, $"Expensive: {DateTime.Now}"); // no string built`,
    explanation: "Custom interpolated string handlers (C# 10) avoid building the interpolated string at all when a condition is false, enabling zero-allocation conditional logging.",
  },
  {
    id: "cs-b18-b3-record-with-expression",
    language: "csharp",
    title: "Record with-expression for immutable update",
    tag: "snippet",
    code: `record Address(string Street, string City, string ZipCode);
record Person(string Name, int Age, Address Home);

var original = new Person("Alice", 30,
    new Address("123 Main St", "Springfield", "12345"));

// Non-destructive mutation
var moved = original with {
    Home = original.Home with { City = "Shelbyville", ZipCode = "67890" }
};

Console.WriteLine(original.Home.City);  // Springfield
Console.WriteLine(moved.Home.City);     // Shelbyville`,
    explanation: "The with expression creates a copy of a record with specified properties changed; nesting with expressions handles nested immutable hierarchies cleanly.",
  },
  {
    id: "cs-b18-b3-async-stream",
    language: "csharp",
    title: "IAsyncEnumerable for async streams",
    tag: "snippet",
    code: `using System.Collections.Generic;
using System.Threading.Tasks;

async IAsyncEnumerable<int> CountAsync(int count)
{
    for (int i = 0; i < count; i++)
    {
        await Task.Delay(10); // simulate async work
        yield return i;
    }
}

await foreach (var n in CountAsync(5))
    Console.WriteLine(n);  // 0, 1, 2, 3, 4`,
    explanation: "IAsyncEnumerable<T> combines async/await with yield return, enabling push-based streaming of data without loading it all into memory.",
  },
  {
    id: "cs-b18-b3-pattern-list",
    language: "csharp",
    title: "List pattern matching (C# 11)",
    tag: "snippet",
    code: `int[] nums = { 1, 2, 3, 4, 5 };

string Describe(int[] arr) => arr switch
{
    []              => "empty",
    [var single]    => $"one element: {single}",
    [var first, ..] => $"starts with {first}",
};

Console.WriteLine(Describe(Array.Empty<int>())); // empty
Console.WriteLine(Describe(new[] { 42 }));       // one element: 42
Console.WriteLine(Describe(nums));               // starts with 1`,
    explanation: "List patterns (C# 11) match arrays and lists by element count and content; .. is a slice pattern that matches zero or more elements without binding them.",
  },
  {
    id: "cs-b18-b3-required-member",
    language: "csharp",
    title: "required members (C# 11)",
    tag: "snippet",
    code: `class Config
{
    public required string ConnectionString { get; init; }
    public required int MaxRetries { get; init; }
    public int TimeoutMs { get; init; } = 5000;
}

// Compiler error if required members missing
var cfg = new Config
{
    ConnectionString = "Server=.;Database=Test",
    MaxRetries = 3,
};

Console.WriteLine(cfg.ConnectionString);`,
    explanation: "required (C# 11) on a property forces callers to set it in the object initializer; the compiler errors at the call site rather than at runtime, unlike constructor validation.",
  },
  {
    id: "cs-b18-b3-generic-math",
    language: "csharp",
    title: "Generic math with INumber<T> (C# 11 / .NET 7)",
    tag: "snippet",
    code: `using System.Numerics;

static T Sum<T>(IEnumerable<T> values) where T : INumber<T>
{
    T total = T.Zero;
    foreach (var v in values)
        total += v;
    return total;
}

Console.WriteLine(Sum(new int[]    { 1, 2, 3 }));     // 6
Console.WriteLine(Sum(new double[] { 1.5, 2.5, 3.0 })); // 7`,
    explanation: "INumber<T> (System.Numerics) and generic math interfaces let you write arithmetic-generic algorithms that work for int, double, decimal, etc. without overloads.",
  },
  {
    id: "cs-b18-b3-raw-string-literal",
    language: "csharp",
    title: "Raw string literals (C# 11)",
    tag: "snippet",
    code: `// Triple-quoted raw string — no escaping needed
string json = """
    {
        "name": "Alice",
        "path": "C:\\Users\\Alice",
        "regex": "\\d{4}-\\d{2}-\\d{2}"
    }
    """;

Console.WriteLine(json);

// Interpolated raw string
int x = 42;
string msg = $"""
    Value is {x}
    Braces: {{ and }}
    """;
Console.WriteLine(msg);`,
    explanation: "Raw string literals (three or more quotes) need no escaping; combined with $, they form interpolated raw strings where {{ and }} are literal braces rather than escape sequences.",
  },
  {
    id: "cs-b18-b3-collection-expression",
    language: "csharp",
    title: "Collection expressions (C# 12)",
    tag: "snippet",
    code: `// Unified syntax for all collection types
int[] array      = [1, 2, 3];
List<int> list   = [4, 5, 6];
Span<int> span   = [7, 8, 9];

// Spread operator
int[] combined   = [..array, ..list];
Console.WriteLine(string.Join(", ", combined));
// 1, 2, 3, 4, 5, 6

// Empty collection
List<string> empty = [];`,
    explanation: "Collection expressions (C# 12) provide a uniform [..] syntax for arrays, List<T>, Span<T>, and other collection types; the .. spread operator flattens nested collections.",
  },
  {
    id: "cs-b18-b3-primary-constructor",
    language: "csharp",
    title: "Primary constructors (C# 12)",
    tag: "snippet",
    code: `class Point(double X, double Y)
{
    public double Length => Math.Sqrt(X * X + Y * Y);

    public Point Translate(double dx, double dy) =>
        new Point(X + dx, Y + dy);

    public override string ToString() => $"({X}, {Y})";
}

var p = new Point(3, 4);
Console.WriteLine(p.Length);                 // 5
Console.WriteLine(p.Translate(1, 0));        // (4, 4)`,
    explanation: "Primary constructors (C# 12) declare constructor parameters inline on the class/struct; the parameters are in scope throughout the class body as captured fields.",
  },
  {
    id: "cs-b18-b3-linq-aggregate",
    language: "csharp",
    title: "LINQ Aggregate for custom reductions",
    tag: "snippet",
    code: `using System.Linq;

int[] nums = { 1, 2, 3, 4, 5 };

// Sum with Aggregate
int sum = nums.Aggregate(0, (acc, x) => acc + x);

// Factorial
int factorial = Enumerable.Range(1, 5)
    .Aggregate(1, (acc, n) => acc * n);

// String join
string joined = new[] { "a", "b", "c" }
    .Aggregate((s, t) => s + ", " + t);

Console.WriteLine(sum);       // 15
Console.WriteLine(factorial); // 120
Console.WriteLine(joined);    // a, b, c`,
    explanation: "Aggregate(seed, accumulator) applies a function left-to-right to build a single result; without a seed, it uses the first element, failing on empty sequences.",
  },
  {
    id: "cs-b18-b3-linq-zip",
    language: "csharp",
    title: "LINQ Zip for pairwise operations",
    tag: "snippet",
    code: `using System.Linq;

string[] names  = { "Alice", "Bob", "Carol" };
int[]    scores = { 90, 85, 95 };

var ranked = names.Zip(scores, (name, score) =>
    new { Name = name, Score = score });

foreach (var r in ranked.OrderByDescending(r => r.Score))
    Console.WriteLine($"{r.Name}: {r.Score}");
// Carol: 95
// Alice: 90
// Bob:   85`,
    explanation: "LINQ Zip combines two sequences element-by-element; if sequences differ in length, it stops at the shorter one. Use the three-sequence overload in .NET 6+ for triple zipping.",
  },
  {
    id: "cs-b18-b3-linq-groupjoin",
    language: "csharp",
    title: "LINQ GroupJoin for left outer join",
    tag: "snippet",
    code: `using System.Linq;

var departments = new[] { (Id: 1, Name: "Eng"), (Id: 2, Name: "HR") };
var employees   = new[] {
    (Name: "Alice", DeptId: 1),
    (Name: "Bob",   DeptId: 1),
    (Name: "Carol", DeptId: 3),  // no matching dept
};

var result = departments.GroupJoin(employees,
    dept => dept.Id,
    emp  => emp.DeptId,
    (dept, emps) => new
    {
        dept.Name,
        Employees = emps.Select(e => e.Name).ToList()
    });

foreach (var g in result)
    Console.WriteLine($"{g.Name}: {string.Join(", ", g.Employees)}");
// Eng: Alice, Bob
// HR:  (empty)`,
    explanation: "GroupJoin implements a left outer join by returning all left elements with a (possibly empty) group of matching right elements; it's the LINQ equivalent of SQL's LEFT JOIN ... GROUP BY.",
  },
  {
    id: "cs-b18-b3-linq-chunk",
    language: "csharp",
    title: "LINQ Chunk for batching (.NET 6+)",
    tag: "snippet",
    code: `using System.Linq;

int[] items = Enumerable.Range(1, 10).ToArray();

foreach (var batch in items.Chunk(3))
    Console.WriteLine(string.Join(", ", batch));
// 1, 2, 3
// 4, 5, 6
// 7, 8, 9
// 10`,
    explanation: "Chunk(size) splits a sequence into arrays of at most size elements; it's the clean replacement for Skip/Take pagination loops when processing data in fixed-size batches.",
  },
  {
    id: "cs-b18-b3-linq-min-by",
    language: "csharp",
    title: "MinBy and MaxBy (.NET 6+)",
    tag: "snippet",
    code: `using System.Linq;

var products = new[]
{
    new { Name = "Widget", Price = 9.99  },
    new { Name = "Gadget", Price = 24.99 },
    new { Name = "Donut",  Price = 1.50  },
};

var cheapest  = products.MinBy(p => p.Price);
var priciest  = products.MaxBy(p => p.Price);

Console.WriteLine(cheapest?.Name);  // Donut
Console.WriteLine(priciest?.Name);  // Gadget`,
    explanation: "MinBy/MaxBy (.NET 6+) return the element with the minimum/maximum key value; unlike Min/Max which return the key itself, these return the full source element.",
  },

  // --- understanding ---
  {
    id: "cs-b18-b3-value-vs-reference",
    language: "csharp",
    title: "Value types vs reference types",
    tag: "understanding",
    code: `struct MutablePoint { public int X, Y; }

class RefPoint { public int X, Y; }

MutablePoint a = new MutablePoint { X = 1, Y = 2 };
MutablePoint b = a;        // copy
b.X = 99;
Console.WriteLine(a.X);   // 1 (unchanged)

RefPoint c = new RefPoint { X = 1, Y = 2 };
RefPoint d = c;            // reference copy
d.X = 99;
Console.WriteLine(c.X);   // 99 (same object)`,
    explanation: "Structs (value types) are copied on assignment; classes (reference types) copy the reference. Mutable structs in particular can cause subtle bugs when passed to methods.",
  },
  {
    id: "cs-b18-b3-boxing-unboxing",
    language: "csharp",
    title: "Boxing and unboxing overhead",
    tag: "understanding",
    code: `// Boxing: value type -> object (heap allocation)
int x = 42;
object boxed = x;       // boxed to heap

// Unboxing: cast back to value type
int unboxed = (int)boxed;

// Generics avoid boxing
using System.Collections.Generic;
var intList = new List<int>();   // no boxing
intList.Add(42);

var objList = new System.Collections.ArrayList();
objList.Add(42);  // boxes 42 to object`,
    explanation: "Boxing allocates a heap wrapper around a value type; repeated boxing in hot paths (ArrayList, non-generic collections) causes GC pressure. Generics like List<T> avoid boxing.",
  },
  {
    id: "cs-b18-b3-task-vs-thread",
    language: "csharp",
    title: "Task vs Thread",
    tag: "understanding",
    code: `using System.Threading;
using System.Threading.Tasks;

// Thread: OS-level, expensive to create
new Thread(() =>
{
    Console.WriteLine($"Thread {Thread.CurrentThread.ManagedThreadId}");
}).Start();

// Task: logical unit of work, scheduled on ThreadPool
await Task.Run(() =>
{
    Console.WriteLine($"Task on thread {Thread.CurrentThread.ManagedThreadId}");
});

// Tasks support cancellation, continuation, exceptions
using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(1));
await Task.Delay(500, cts.Token);`,
    explanation: "Thread is a raw OS thread (~1 MB stack, expensive); Task is scheduled on the thread pool, supports cancellation tokens, and composes via async/await. Prefer Task for async I/O.",
  },
  {
    id: "cs-b18-b3-string-immutability",
    language: "csharp",
    title: "String immutability and interning",
    tag: "understanding",
    code: `string a = "hello";
string b = "hello";

// Literal strings are interned (same reference)
Console.WriteLine(ReferenceEquals(a, b));  // True

string c = new string("hello".ToCharArray());
Console.WriteLine(ReferenceEquals(a, c));  // False

string d = string.Intern(c);
Console.WriteLine(ReferenceEquals(a, d));  // True

// Mutation requires StringBuilder
var sb = new System.Text.StringBuilder("hello");
sb.Append(" world");
Console.WriteLine(sb.ToString());`,
    explanation: "C# strings are immutable; identical literals share the same interned reference. New string instances are not interned by default. Use StringBuilder for concatenation loops.",
  },
  {
    id: "cs-b18-b3-idisposable-using",
    language: "csharp",
    title: "IDisposable and the using pattern",
    tag: "understanding",
    code: `class Resource : IDisposable
{
    private bool _disposed = false;

    public void Use() => Console.WriteLine("Using resource");

    public void Dispose()
    {
        Dispose(true);
        GC.SuppressFinalize(this);
    }

    protected virtual void Dispose(bool disposing)
    {
        if (_disposed) return;
        if (disposing)
            Console.WriteLine("Releasing managed resources");
        _disposed = true;
    }
}

// Deterministic cleanup
using (var r = new Resource())
    r.Use();

// Modern declaration form
using var r2 = new Resource();
r2.Use();`,
    explanation: "IDisposable provides deterministic cleanup of unmanaged resources; the using statement guarantees Dispose is called even if an exception is thrown. GC.SuppressFinalize prevents double cleanup.",
  },
  {
    id: "cs-b18-b3-covariance-contravariance",
    language: "csharp",
    title: "Covariance and contravariance in generics",
    tag: "understanding",
    code: `// Covariant: out — can upcast IEnumerable<Dog> to IEnumerable<Animal>
IEnumerable<string> strings = new List<string> { "hello" };
IEnumerable<object> objects = strings;  // OK because IEnumerable<out T>

// Contravariant: in — can assign Action<Animal> to Action<Dog>
Action<object> printObj = o => Console.WriteLine(o);
Action<string> printStr = printObj;     // OK because Action<in T>

printStr("hello");`,
    explanation: "Covariance (out) allows upcasting a generic to its base type; contravariance (in) allows downcasting. These are safe because out parameters are only read, and in parameters only written.",
  },
  {
    id: "cs-b18-b3-nullable-reference",
    language: "csharp",
    title: "Nullable reference types (C# 8+)",
    tag: "understanding",
    code: `#nullable enable

string  nonNullable = "hello";     // cannot be null
string? nullable    = null;        // explicitly nullable

// Compiler warning: possible null dereference
// int len = nullable.Length;

// Null-forgiving operator (tells compiler you know it's not null)
int len1 = nullable!.Length;      // suppresses warning

// Null-coalescing
int len2 = nullable?.Length ?? 0; // safe

// Pattern check
if (nullable is not null)
    Console.WriteLine(nullable.Length); // no warning here`,
    explanation: "Nullable reference types in #nullable enable mode make nullability part of the type system; the compiler warns on potential null dereferences, shifting from runtime NullReferenceException to compile-time.",
  },
  {
    id: "cs-b18-b3-value-task",
    language: "csharp",
    title: "ValueTask for low-allocation async",
    tag: "understanding",
    code: `using System.Threading.Tasks;
using System.Collections.Concurrent;

class Cache
{
    private readonly ConcurrentDictionary<string, int> _store = new();

    // ValueTask avoids heap allocation for the common cached path
    public ValueTask<int> GetAsync(string key)
    {
        if (_store.TryGetValue(key, out var value))
            return new ValueTask<int>(value);  // no allocation

        return new ValueTask<int>(FetchSlowAsync(key));
    }

    private async Task<int> FetchSlowAsync(string key)
    {
        await Task.Delay(100);
        int v = key.Length;
        _store[key] = v;
        return v;
    }
}`,
    explanation: "ValueTask<T> is a struct that avoids a heap allocation when the result is already available synchronously; use it for hot paths where most calls complete synchronously.",
  },
  {
    id: "cs-b18-b3-expression-trees",
    language: "csharp",
    title: "Expression trees for deferred execution",
    tag: "understanding",
    code: `using System.Linq.Expressions;

// Build: x => x * x + 1
ParameterExpression x = Expression.Parameter(typeof(int), "x");
Expression body = Expression.Add(
    Expression.Multiply(x, x),
    Expression.Constant(1));

var lambda = Expression.Lambda<Func<int, int>>(body, x);
Func<int, int> fn = lambda.Compile();

Console.WriteLine(fn(5));  // 26

// IQueryable providers (EF Core) inspect the expression tree
// to translate to SQL rather than executing in memory`,
    explanation: "Expression trees represent code as data (AST); LINQ providers like EF Core inspect them at runtime to translate lambda expressions to SQL, rather than executing them as .NET code.",
  },
  {
    id: "cs-b18-b3-reflection-attributes",
    language: "csharp",
    title: "Custom attributes and reflection",
    tag: "understanding",
    code: `using System;
using System.Reflection;

[AttributeUsage(AttributeTargets.Method)]
class AuditAttribute : Attribute
{
    public string Category { get; }
    public AuditAttribute(string category) => Category = category;
}

class Service
{
    [Audit("payments")]
    public void ProcessPayment() { }
}

var method = typeof(Service).GetMethod("ProcessPayment")!;
var attr = method.GetCustomAttribute<AuditAttribute>()!;
Console.WriteLine(attr.Category);  // payments`,
    explanation: "Custom attributes decorate code elements with metadata; reflection retrieves them at runtime, enabling frameworks (DI containers, ORMs, test runners) to drive behavior from annotations.",
  },
  {
    id: "cs-b18-b3-unsafe-pointers",
    language: "csharp",
    title: "Unsafe code and fixed pointers",
    tag: "understanding",
    code: `// Requires <AllowUnsafeBlocks>true</AllowUnsafeBlocks> in .csproj
unsafe
{
    int value = 42;
    int* ptr = &value;
    Console.WriteLine(*ptr);    // 42
    *ptr = 99;
    Console.WriteLine(value);   // 99

    // Pin managed array to get stable pointer
    int[] arr = { 1, 2, 3 };
    fixed (int* p = arr)
    {
        for (int i = 0; i < arr.Length; i++)
            Console.Write(*(p + i) + " ");
    }
}`,
    explanation: "The unsafe context enables pointer arithmetic; fixed pins a managed object in place (preventing GC from moving it) while a pointer to it is in use — necessary for interop and low-level optimizations.",
  },
  {
    id: "cs-b18-b3-gc-generations",
    language: "csharp",
    title: "GC generations and LOH",
    tag: "understanding",
    code: `using System;

// Gen 0: short-lived; collected frequently and cheaply
// Gen 1: survived one GC; buffer between Gen 0 and 2
// Gen 2: long-lived objects (e.g., static fields, caches)
// LOH:   objects >= 85,000 bytes; collected with Gen 2

Console.WriteLine($"Gen 0 count: {GC.CollectionCount(0)}");
Console.WriteLine($"Gen 1 count: {GC.CollectionCount(1)}");
Console.WriteLine($"Gen 2 count: {GC.CollectionCount(2)}");

// Avoid LOH fragmentation: use ArrayPool<T> for large arrays
using System.Buffers;
var pool = ArrayPool<byte>.Shared;
byte[] buf = pool.Rent(200_000);  // from pool, not LOH
// ... use buf ...
pool.Return(buf);`,
    explanation: "The .NET GC uses three generations and the Large Object Heap; understanding generations guides decisions like ArrayPool<T> (avoids LOH allocation) and cache lifetime.",
  },
  {
    id: "cs-b18-b3-pattern-matching-type",
    language: "csharp",
    title: "Type patterns in switch expressions",
    tag: "understanding",
    code: `abstract record Shape;
record Circle(double Radius) : Shape;
record Rectangle(double Width, double Height) : Shape;
record Triangle(double Base, double Height) : Shape;

static double Area(Shape s) => s switch
{
    Circle c                   => Math.PI * c.Radius * c.Radius,
    Rectangle r                => r.Width * r.Height,
    Triangle { Height: > 0 } t => 0.5 * t.Base * t.Height,
    Triangle                   => 0,
    _                          => throw new ArgumentException("unknown shape"),
};

Console.WriteLine(Area(new Circle(5)));          // 78.54
Console.WriteLine(Area(new Rectangle(3, 4)));    // 12
Console.WriteLine(Area(new Triangle(6, 4)));     // 12`,
    explanation: "Switch expressions with type patterns dispatch on runtime type; property patterns like { Height: > 0 } add guard conditions, making the dispatch table exhaustive and readable.",
  },
  {
    id: "cs-b18-b3-memory-span-perf",
    language: "csharp",
    title: "Memory<T> and Span<T> performance",
    tag: "understanding",
    code: `using System;

static int SumSpan(ReadOnlySpan<int> data)
{
    int total = 0;
    foreach (var v in data) total += v;
    return total;
}

int[] array   = { 1, 2, 3, 4, 5 };
var   memory  = new Memory<int>(array);

// Span — stack-only, synchronous
Console.WriteLine(SumSpan(array.AsSpan(1, 3)));   // 9 (2+3+4)

// Memory<T> can be stored on the heap, passed to async methods
ReadOnlyMemory<int> slice = memory.Slice(0, 3);
Console.WriteLine(SumSpan(slice.Span));            // 6`,
    explanation: "Span<T> is a stack-only ref struct for synchronous slicing; Memory<T> is its heap-storeable sibling for async scenarios. Both avoid array copies that intermediate slicing would otherwise cause.",
  },

  // --- structures ---
  {
    id: "cs-b18-b3-priority-queue",
    language: "csharp",
    title: "PriorityQueue<TElement,TPriority>",
    tag: "structures",
    code: `using System.Collections.Generic;

var pq = new PriorityQueue<string, int>();
pq.Enqueue("low",    10);
pq.Enqueue("urgent",  1);
pq.Enqueue("medium",  5);

while (pq.TryDequeue(out string? task, out int priority))
    Console.WriteLine($"[{priority}] {task}");
// [1] urgent
// [5] medium
// [10] low`,
    explanation: "PriorityQueue<TElement,TPriority> (.NET 6+) is a min-heap built into the BCL; elements dequeue in ascending priority order, requiring no third-party library.",
  },
  {
    id: "cs-b18-b3-immutable-list",
    language: "csharp",
    title: "ImmutableList<T> structural sharing",
    tag: "structures",
    code: `using System.Collections.Immutable;

var original = ImmutableList.Create(1, 2, 3);
var added    = original.Add(4);
var removed  = original.Remove(2);

Console.WriteLine(string.Join(", ", original));  // 1, 2, 3
Console.WriteLine(string.Join(", ", added));     // 1, 2, 3, 4
Console.WriteLine(string.Join(", ", removed));   // 1, 3

// Thread-safe snapshot — no lock needed
ImmutableList<int> snapshot = original;`,
    explanation: "ImmutableList<T> uses structural sharing (persistent tree) so Add/Remove/Replace return new instances in O(log n) while sharing unchanged nodes; reads are lock-free.",
  },
  {
    id: "cs-b18-b3-frozen-dictionary",
    language: "csharp",
    title: "FrozenDictionary for read-only lookups (.NET 8)",
    tag: "structures",
    code: `using System.Collections.Frozen;
using System.Collections.Generic;

var data = new Dictionary<string, int>
{
    ["one"]   = 1,
    ["two"]   = 2,
    ["three"] = 3,
};

FrozenDictionary<string, int> frozen = data.ToFrozenDictionary();

Console.WriteLine(frozen["two"]);           // 2
Console.WriteLine(frozen.ContainsKey("four")); // False
// frozen["four"] = 4;  // no setter`,
    explanation: "FrozenDictionary (.NET 8) is an immutable, read-optimized dictionary built once; it has ~30% faster lookups than Dictionary<K,V> for read-heavy workloads like config maps.",
  },
  {
    id: "cs-b18-b3-concurrent-bag",
    language: "csharp",
    title: "ConcurrentBag for unordered concurrent collection",
    tag: "structures",
    code: `using System.Collections.Concurrent;
using System.Threading.Tasks;

var bag = new ConcurrentBag<int>();

Parallel.For(0, 10, i => bag.Add(i));

Console.WriteLine(bag.Count);  // 10 (order unspecified)

while (bag.TryTake(out int item))
    Console.Write(item + " ");`,
    explanation: "ConcurrentBag<T> is a thread-safe, unordered collection optimized for producer-consumer scenarios where the same thread that adds items tends to remove them (thread-local storage internally).",
  },
  {
    id: "cs-b18-b3-sorted-dictionary",
    language: "csharp",
    title: "SortedDictionary vs SortedList",
    tag: "structures",
    code: `using System.Collections.Generic;

// SortedDictionary: red-black tree, O(log n) insert/delete/lookup
var sd = new SortedDictionary<string, int>();
sd["banana"] = 2;
sd["apple"]  = 1;
sd["cherry"] = 3;
foreach (var kv in sd) Console.WriteLine(kv.Key);
// apple, banana, cherry (sorted)

// SortedList: sorted array, O(n) insert but O(log n) lookup
// and ~50% less memory — better when populated once
var sl = new SortedList<string, int>(sd);
Console.WriteLine(sl.IndexOfKey("banana"));  // 1`,
    explanation: "SortedDictionary uses a balanced BST (good for frequent inserts/deletes); SortedList uses sorted arrays (lower memory, binary search, better for mostly-read workloads).",
  },
  {
    id: "cs-b18-b3-linked-list",
    language: "csharp",
    title: "LinkedList<T> for O(1) middle insertion",
    tag: "structures",
    code: `using System.Collections.Generic;

var ll = new LinkedList<int>(new[] { 1, 2, 4, 5 });

// Insert 3 before the node with value 4 — O(1)
var node4 = ll.Find(4)!;
ll.AddBefore(node4, 3);

Console.WriteLine(string.Join(" -> ", ll));
// 1 -> 2 -> 3 -> 4 -> 5

// Remove node without searching — O(1) if you hold the node
ll.Remove(node4);
Console.WriteLine(string.Join(" -> ", ll));
// 1 -> 2 -> 3 -> 5`,
    explanation: "LinkedList<T> provides O(1) insertion/removal given a LinkedListNode<T> reference; unlike List<T>, it has no O(n) shift cost, but element access by index is O(n).",
  },
  {
    id: "cs-b18-b3-array-segment",
    language: "csharp",
    title: "ArraySegment<T> for zero-copy slicing",
    tag: "structures",
    code: `using System;

int[] arr = { 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 };

// Slice without copying
var segment = new ArraySegment<int>(arr, 3, 4);  // [3,4,5,6]
Console.WriteLine(segment.Count);                 // 4
Console.WriteLine(segment[0]);                    // 3 (offset-aware)

// Enumerate
foreach (var v in segment) Console.Write(v + " ");
// 3 4 5 6

// Underlying array is shared
segment.Array![3] = 99;
Console.WriteLine(arr[3]);  // 99`,
    explanation: "ArraySegment<T> is a lightweight struct that references a portion of an existing array without copying; it's useful for passing sub-arrays to APIs that accept it.",
  },
  {
    id: "cs-b18-b3-stack-queue",
    language: "csharp",
    title: "Stack<T> and Queue<T>",
    tag: "structures",
    code: `using System.Collections.Generic;

// Stack: LIFO
var stack = new Stack<string>();
stack.Push("first");
stack.Push("second");
stack.Push("third");
Console.WriteLine(stack.Pop());    // third
Console.WriteLine(stack.Peek());   // second

// Queue: FIFO
var queue = new Queue<int>();
queue.Enqueue(1);
queue.Enqueue(2);
queue.Enqueue(3);
Console.WriteLine(queue.Dequeue()); // 1
Console.WriteLine(queue.Peek());    // 2`,
    explanation: "Stack<T> is LIFO (last in, first out) and Queue<T> is FIFO (first in, first out); both are generic, type-safe replacements for the non-generic Stack and Queue in System.Collections.",
  },
  {
    id: "cs-b18-b3-hashset",
    language: "csharp",
    title: "HashSet<T> for deduplication and set ops",
    tag: "structures",
    code: `using System.Collections.Generic;

var a = new HashSet<int> { 1, 2, 3, 4 };
var b = new HashSet<int> { 3, 4, 5, 6 };

var union        = new HashSet<int>(a);
union.UnionWith(b);
Console.WriteLine(string.Join(", ", union));        // 1,2,3,4,5,6

var intersection = new HashSet<int>(a);
intersection.IntersectWith(b);
Console.WriteLine(string.Join(", ", intersection)); // 3,4

a.ExceptWith(b);
Console.WriteLine(string.Join(", ", a));            // 1,2`,
    explanation: "HashSet<T> stores unique elements with O(1) add/remove/contains and set operations (UnionWith, IntersectWith, ExceptWith, IsSubsetOf) that modify the set in place.",
  },
  {
    id: "cs-b18-b3-observable-collection",
    language: "csharp",
    title: "ObservableCollection<T> for UI binding",
    tag: "structures",
    code: `using System.Collections.ObjectModel;
using System.Collections.Specialized;

var items = new ObservableCollection<string>();

items.CollectionChanged += (s, e) =>
{
    Console.WriteLine($"Action: {e.Action}");
    if (e.NewItems != null)
        foreach (var item in e.NewItems)
            Console.WriteLine($"  Added: {item}");
};

items.Add("hello");    // Action: Add, Added: hello
items.Add("world");    // Action: Add, Added: world
items.RemoveAt(0);     // Action: Remove`,
    explanation: "ObservableCollection<T> raises CollectionChanged events on mutations; WPF/MAUI/Blazor use these notifications to automatically refresh UI bindings without manual refresh calls.",
  },
  {
    id: "cs-b18-b3-readonly-span",
    language: "csharp",
    title: "ReadOnlySpan<char> for zero-allocation string ops",
    tag: "structures",
    code: `using System;

static int ParseYear(ReadOnlySpan<char> date)
{
    // Slice without allocating a new string
    return int.Parse(date[..4]);
}

string iso = "2026-05-18";
int year = ParseYear(iso.AsSpan());
Console.WriteLine(year);  // 2026

// String.Create for zero-allocation output
string reversed = string.Create(iso.Length, iso,
    (span, src) =>
    {
        src.AsSpan().CopyTo(span);
        span.Reverse();
    });
Console.WriteLine(reversed);  // 81-50-6202`,
    explanation: "ReadOnlySpan<char> lets you slice and parse substrings without heap allocation; string.Create populates a new string via a Span<char> callback to avoid intermediate allocations.",
  },
  {
    id: "cs-b18-b3-dictionary-try-pattern",
    language: "csharp",
    title: "Dictionary TryGetValue and GetValueOrDefault",
    tag: "structures",
    code: `using System.Collections.Generic;

var map = new Dictionary<string, int>
{
    ["a"] = 1,
    ["b"] = 2,
};

// TryGetValue: single lookup — preferred over ContainsKey + []
if (map.TryGetValue("a", out int val))
    Console.WriteLine(val);  // 1

// GetValueOrDefault: returns default(T) or specified default
int x = map.GetValueOrDefault("z", -1);
Console.WriteLine(x);  // -1

// CollectionsMarshal.GetValueRefOrAddDefault for in-place increment
using System.Runtime.InteropServices;
ref int counter = ref CollectionsMarshal.GetValueRefOrAddDefault(map, "a", out _);
counter++;
Console.WriteLine(map["a"]);  // 2`,
    explanation: "TryGetValue performs a single hash lookup (ContainsKey+[] does two); GetValueOrDefault is cleaner for nullable defaults; CollectionsMarshal enables in-place update without double lookup.",
  },
  {
    id: "cs-b18-b3-bit-array",
    language: "csharp",
    title: "BitArray for packed boolean flags",
    tag: "structures",
    code: `using System.Collections;

var flags = new BitArray(8, false);
flags[0] = true;
flags[3] = true;
flags[7] = true;

Console.WriteLine(flags[0]);   // True
Console.WriteLine(flags.Count);// 8

// Bitwise ops
var mask  = new BitArray(8, true);
var anded = flags.And(mask);

// Convert to array
bool[] arr = new bool[8];
flags.CopyTo(arr, 0);`,
    explanation: "BitArray stores booleans as bits (1/8th the memory of bool[]), supports AND/OR/XOR/NOT operations, and is useful for permission flags and Sieve of Eratosthenes implementations.",
  },

  // --- caveats ---
  {
    id: "cs-b18-b3-struct-copy-mutation",
    language: "csharp",
    title: "Struct mutation through interface is a copy",
    tag: "caveats",
    code: `struct Counter
{
    public int Value;
    public void Increment() => Value++;
}

// Calling through interface boxes the struct — increments the copy
Counter c = new Counter();
IComparable<Counter> boxed = c;  // only works if Counter implements it
// More common trap:
object obj = c;
((Counter)obj).Increment();   // no-op on the box!
Console.WriteLine(c.Value);  // 0 (unchanged)

// Fix: use ref local or mutable class
ref Counter r = ref c;
r.Increment();
Console.WriteLine(c.Value);  // 1`,
    explanation: "Calling a mutating method on a boxed struct modifies the temporary box, not the original. Avoid mutable structs where possible, and use ref locals/parameters when mutation is needed.",
  },
  {
    id: "cs-b18-b3-catch-rethrow",
    language: "csharp",
    title: "Catch-and-rethrow: throw vs throw ex",
    tag: "caveats",
    code: `void Process()
{
    try
    {
        throw new InvalidOperationException("original");
    }
    catch (Exception ex)
    {
        // BAD: resets stack trace to this line
        // throw ex;

        // GOOD: preserves original stack trace
        throw;

        // Or: wrap with cause
        // throw new ApplicationException("wrapper", ex);
    }
}

try { Process(); }
catch (Exception e) { Console.WriteLine(e.StackTrace); }`,
    explanation: "throw (bare) rethrows the caught exception preserving its original stack trace; throw ex resets the stack trace to the current line, hiding the root cause — always use bare throw in catch blocks.",
  },
  {
    id: "cs-b18-b3-async-void",
    language: "csharp",
    title: "async void swallows exceptions",
    tag: "caveats",
    code: `using System.Threading.Tasks;

// BAD: exceptions thrown here crash the process (can't be awaited)
async void FireAndForgetBad()
{
    await Task.Delay(10);
    throw new Exception("unobserved!");
}

// GOOD: return Task so callers can await and catch
async Task FireAndForgetGood()
{
    await Task.Delay(10);
    throw new Exception("observable");
}

// Only acceptable use of async void: event handlers
// button.Click += async (s, e) => { await DoWork(); };`,
    explanation: "async void cannot be awaited; exceptions propagate to the SynchronizationContext and typically crash the process. Only use async void for event handlers where the signature is forced.",
  },
  {
    id: "cs-b18-b3-linq-deferred",
    language: "csharp",
    title: "LINQ deferred execution gotcha",
    tag: "caveats",
    code: `using System.Linq;
using System.Collections.Generic;

var list = new List<int> { 1, 2, 3 };

// Query is NOT executed here
IEnumerable<int> query = list.Where(x => x > 1);

// Modify source before enumeration
list.Add(4);
list.Remove(2);

// Query executes NOW — sees the modified list
Console.WriteLine(string.Join(", ", query));  // 3, 4

// Force immediate execution to snapshot
List<int> snapshot = list.Where(x => x > 1).ToList();`,
    explanation: "LINQ queries are lazy by default; they execute each time you enumerate, seeing the current state of the source. Call .ToList()/.ToArray() to snapshot results when the source may change.",
  },
  {
    id: "cs-b18-b3-integer-overflow",
    language: "csharp",
    title: "Integer overflow: checked vs unchecked",
    tag: "caveats",
    code: `// Unchecked (default): wraps around silently
int max = int.MaxValue;
Console.WriteLine(max + 1);   // -2147483648 (overflow!)

// Checked block: throws OverflowException
try
{
    checked
    {
        int result = max + 1;
    }
}
catch (OverflowException e)
{
    Console.WriteLine(e.Message);
}

// Or compile with /checked flag for project-wide checking`,
    explanation: "C# integer arithmetic wraps silently by default; use the checked keyword or context to get OverflowException instead, critical in financial calculations and protocol parsing.",
  },
  {
    id: "cs-b18-b3-dispose-not-finalize",
    language: "csharp",
    title: "Don't rely on finalizer for resource cleanup",
    tag: "caveats",
    code: `class Handle : IDisposable
{
    private bool _disposed;

    // Finalizer runs on GC thread — nondeterministic timing
    ~Handle()
    {
        Dispose(false);  // only release unmanaged resources
    }

    public void Dispose()
    {
        Dispose(true);
        GC.SuppressFinalize(this);  // skip finalizer
    }

    protected virtual void Dispose(bool disposing)
    {
        if (_disposed) return;
        if (disposing)
            Console.WriteLine("Managed cleanup");
        Console.WriteLine("Unmanaged cleanup");
        _disposed = true;
    }
}

using var h = new Handle();`,
    explanation: "Finalizers run non-deterministically on the GC finalizer thread; don't rely on them for timely cleanup. IDisposable + using provides deterministic cleanup. Suppress the finalizer after Dispose.",
  },
  {
    id: "cs-b18-b3-concurrent-modification",
    language: "csharp",
    title: "Collection modification during foreach",
    tag: "caveats",
    code: `using System.Collections.Generic;

var list = new List<int> { 1, 2, 3, 4, 5 };

try
{
    foreach (var item in list)
        if (item == 3) list.Remove(item);  // InvalidOperationException!
}
catch (InvalidOperationException e)
{
    Console.WriteLine(e.Message);
}

// Fix 1: iterate backwards
for (int i = list.Count - 1; i >= 0; i--)
    if (list[i] == 3) list.RemoveAt(i);

// Fix 2: LINQ filter
list = list.Where(x => x != 3).ToList();`,
    explanation: "Modifying a list during foreach throws InvalidOperationException because the enumerator detects version changes. Iterate backwards for in-place removal, or use LINQ for a new filtered list.",
  },
  {
    id: "cs-b18-b3-nullable-enum",
    language: "csharp",
    title: "Default enum value is 0 — always define it",
    tag: "caveats",
    code: `// WRONG: default(Status) == 0 == Active — confusing
enum StatusBad { Active = 1, Inactive = 2 }
Console.WriteLine(default(StatusBad));  // 0 (not a valid member)

// RIGHT: explicit zero value
enum Status { Unknown = 0, Active = 1, Inactive = 2 }
Console.WriteLine(default(Status));    // Unknown

// Flags: always define None = 0
[Flags]
enum Perms { None = 0, Read = 1, Write = 2, Execute = 4 }
Perms p = Perms.Read | Perms.Write;
Console.WriteLine(p);                  // Read, Write`,
    explanation: "The default value of any enum is 0 regardless of defined members; always define an explicit Zero/None/Unknown member to avoid confusing 'invalid' zero values in serialized or uninitialized state.",
  },
  {
    id: "cs-b18-b3-string-format-culture",
    language: "csharp",
    title: "Culture-sensitive number and date formatting",
    tag: "caveats",
    code: `using System;
using System.Globalization;

double amount = 1234.56;
DateTime date = new DateTime(2026, 5, 18);

// Default: current culture (varies by machine)
Console.WriteLine(amount.ToString());  // may be "1234.56" or "1.234,56"

// Invariant: always "1234.56"
Console.WriteLine(amount.ToString(CultureInfo.InvariantCulture));

// Specific culture
Console.WriteLine(amount.ToString("N2", CultureInfo.GetCultureInfo("de-DE")));
// 1.234,56

Console.WriteLine(date.ToString("d", CultureInfo.InvariantCulture));
// 05/18/2026`,
    explanation: "Number and date formatting is culture-sensitive by default; when serializing to files or APIs, always use CultureInfo.InvariantCulture to avoid locale-dependent parsing failures.",
  },
  {
    id: "cs-b18-b3-task-result-deadlock",
    language: "csharp",
    title: "Task.Result deadlock in sync context",
    tag: "caveats",
    code: `using System.Threading.Tasks;

// DANGEROUS in ASP.NET (classic) or WPF — deadlocks!
// The await tries to resume on the sync context, but this
// thread is blocking the sync context waiting for Result.
// string result = GetDataAsync().Result;
// string result = GetDataAsync().GetAwaiter().GetResult();

// SAFE: use async all the way, or ConfigureAwait(false)
async Task<string> GetDataAsync()
{
    await Task.Delay(100).ConfigureAwait(false);
    return "data";
}

// In console app (no sync context) .Result is safe, but bad habit`,
    explanation: "Blocking on async code (.Result, .Wait()) can deadlock in contexts with a SynchronizationContext (ASP.NET, WPF) because the continuation needs the thread that's blocked. Always async/await.",
  },
  {
    id: "cs-b18-b3-object-lifetime-event",
    language: "csharp",
    title: "Event subscriptions prevent GC",
    tag: "caveats",
    code: `class Publisher
{
    public event EventHandler? OnData;
    public void Raise() => OnData?.Invoke(this, EventArgs.Empty);
}

class Subscriber : IDisposable
{
    private readonly Publisher _pub;
    public Subscriber(Publisher p)
    {
        _pub = p;
        _pub.OnData += Handle;  // publisher holds reference to subscriber!
    }
    void Handle(object? s, EventArgs e) => Console.WriteLine("handled");
    public void Dispose() => _pub.OnData -= Handle;  // must unsubscribe
}

var pub = new Publisher();
var sub = new Subscriber(pub);
pub.Raise();   // handled
sub.Dispose(); // unsubscribe or sub lives as long as pub`,
    explanation: "An event subscription creates a strong reference from publisher to subscriber; if you forget to unsubscribe, the subscriber is kept alive as long as the publisher exists — a classic memory leak.",
  },

  // --- types ---
  {
    id: "cs-b18-b3-generic-constraints",
    language: "csharp",
    title: "Generic constraints: where T : ...",
    tag: "types",
    code: `using System;

// Constraints: class, struct, new(), interface, base class, unmanaged
static T Max<T>(T a, T b) where T : IComparable<T>
    => a.CompareTo(b) >= 0 ? a : b;

Console.WriteLine(Max(3, 7));        // 7
Console.WriteLine(Max("apple", "banana")); // banana

// new() allows default construction
static T Create<T>() where T : new() => new T();

// unmanaged: pointer-eligible value types
static unsafe void Pin<T>(ref T value) where T : unmanaged
{
    fixed (T* p = &value) { /* use p */ }
}`,
    explanation: "Generic constraints limit what types can fill a type parameter; IComparable<T> enables comparison operators, new() enables construction, and unmanaged enables unsafe pointer operations.",
  },
  {
    id: "cs-b18-b3-interface-default-impl",
    language: "csharp",
    title: "Default interface implementations (C# 8+)",
    tag: "types",
    code: `interface ILogger
{
    void Log(string message);

    // Default implementation — not required to override
    void LogError(string message) => Log($"[ERROR] {message}");
    void LogInfo(string message)  => Log($"[INFO] {message}");
}

class ConsoleLogger : ILogger
{
    public void Log(string message) => Console.WriteLine(message);
    // LogError and LogInfo come from the interface for free
}

ILogger logger = new ConsoleLogger();
logger.LogError("something failed");
logger.LogInfo("started up");`,
    explanation: "Default interface implementations let you add methods to existing interfaces without breaking implementations; however, they're only accessible through the interface reference, not a concrete class variable.",
  },
  {
    id: "cs-b18-b3-delegate-func-action",
    language: "csharp",
    title: "Func<T,R>, Action<T>, and Predicate<T>",
    tag: "types",
    code: `using System;
using System.Collections.Generic;

Func<int, int, int> add     = (a, b) => a + b;
Action<string>      greet   = name => Console.WriteLine($"Hello, {name}!");
Predicate<int>      isEven  = n => n % 2 == 0;

Console.WriteLine(add(3, 4));  // 7
greet("Alice");                // Hello, Alice!

var nums = new List<int> { 1, 2, 3, 4, 5 };
var evens = nums.FindAll(isEven);
Console.WriteLine(string.Join(", ", evens));  // 2, 4`,
    explanation: "Func<T,...,TResult> is for functions returning a value; Action<T,...> is for void-returning procedures; Predicate<T> is shorthand for Func<T,bool>. All are built-in generic delegate types.",
  },
  {
    id: "cs-b18-b3-enum-flags",
    language: "csharp",
    title: "Flags enum for bitmask permissions",
    tag: "types",
    code: `[Flags]
enum FileAccess
{
    None    = 0,
    Read    = 1 << 0,  // 1
    Write   = 1 << 1,  // 2
    Execute = 1 << 2,  // 4
    ReadWrite = Read | Write,
}

FileAccess access = FileAccess.Read | FileAccess.Execute;

Console.WriteLine(access);                      // Read, Execute
Console.WriteLine(access.HasFlag(FileAccess.Read));    // True
Console.WriteLine(access.HasFlag(FileAccess.Write));   // False

access |= FileAccess.Write;
Console.WriteLine(access);                      // Read, Write, Execute`,
    explanation: "[Flags] on an enum enables bitwise combinations; define members as powers of 2 and use | to combine, & to intersect, and HasFlag to test individual bits.",
  },
  {
    id: "cs-b18-b3-tuple-deconstruct",
    language: "csharp",
    title: "Tuple deconstruction and named elements",
    tag: "types",
    code: `// Named tuple elements
(string Name, int Age) GetPerson() => ("Alice", 30);

var (name, age) = GetPerson();  // deconstruction
Console.WriteLine($"{name} is {age}");

// Swap without temp variable
int a = 1, b = 2;
(a, b) = (b, a);
Console.WriteLine($"a={a}, b={b}");  // a=2, b=1

// Tuple in LINQ
var pairs = new[] { (1, "one"), (2, "two"), (3, "three") };
foreach (var (num, word) in pairs)
    Console.WriteLine($"{num}: {word}");`,
    explanation: "ValueTuple supports named elements and deconstruction syntax; tuple deconstruction allows multi-value returns and the elegant swap idiom without temporary variables.",
  },
  {
    id: "cs-b18-b3-optional-parameters",
    language: "csharp",
    title: "Optional parameters and named arguments",
    tag: "types",
    code: `void Connect(
    string host,
    int    port    = 5432,
    bool   ssl     = false,
    int    timeout = 30)
{
    Console.WriteLine($"{host}:{port} ssl={ssl} timeout={timeout}");
}

Connect("localhost");                      // default all
Connect("db.prod.com", ssl: true);         // skip port, set ssl
Connect("db.prod.com", 5433, timeout: 60); // positional + named`,
    explanation: "Optional parameters with defaults and named arguments together allow calling functions with only the parameters that differ from defaults, in any order, improving readability.",
  },
  {
    id: "cs-b18-b3-pattern-guard",
    language: "csharp",
    title: "Pattern matching with when guards",
    tag: "types",
    code: `static string Classify(object obj) => obj switch
{
    int n when n < 0      => "negative",
    int n when n == 0     => "zero",
    int n when n % 2 == 0 => "positive even",
    int n                  => "positive odd",
    string s when s.Length == 0 => "empty string",
    string s               => $"string: {s}",
    null                   => "null",
    _                      => "unknown",
};

Console.WriteLine(Classify(-5));    // negative
Console.WriteLine(Classify(0));     // zero
Console.WriteLine(Classify(4));     // positive even
Console.WriteLine(Classify("hi"));  // string: hi`,
    explanation: "when guards add Boolean conditions to pattern clauses; they're evaluated only if the pattern itself matches, enabling compound conditions without nested if statements.",
  },
  {
    id: "cs-b18-b3-extension-methods",
    language: "csharp",
    title: "Extension methods for fluent APIs",
    tag: "types",
    code: `using System;
using System.Collections.Generic;
using System.Linq;

static class StringExtensions
{
    public static string Truncate(this string s, int max) =>
        s.Length <= max ? s : s[..(max - 3)] + "...";

    public static bool IsNullOrEmpty(this string? s) =>
        string.IsNullOrEmpty(s);
}

string title = "A very long article title that should be cut";
Console.WriteLine(title.Truncate(20));   // A very long artic...

string? maybeNull = null;
Console.WriteLine(maybeNull.IsNullOrEmpty());  // True`,
    explanation: "Extension methods add methods to existing types without modifying them; they're syntactic sugar for static calls but enable fluent chaining on any type including sealed classes.",
  },
  {
    id: "cs-b18-b3-record-struct",
    language: "csharp",
    title: "record struct for value-type records",
    tag: "types",
    code: `// record struct: value semantics + record features (C# 10+)
record struct Point(double X, double Y)
{
    public double Length => Math.Sqrt(X * X + Y * Y);
}

var p1 = new Point(3, 4);
var p2 = new Point(3, 4);

Console.WriteLine(p1 == p2);       // True (value equality)
Console.WriteLine(p1.Length);       // 5
Console.WriteLine(p1 with { X = 6 }); // Point { X = 6, Y = 4 }

// Unlike record class, Point is a value type (no heap allocation)`,
    explanation: "record struct combines value-type stack allocation with record features: positional syntax, value equality, with expressions, and auto-generated ToString/Deconstruct.",
  },
  {
    id: "cs-b18-b3-discriminated-union",
    language: "csharp",
    title: "Discriminated union via abstract record hierarchy",
    tag: "types",
    code: `abstract record Result<T>;
record Ok<T>(T Value) : Result<T>;
record Err<T>(string Message) : Result<T>;

static Result<int> Parse(string s) =>
    int.TryParse(s, out int n) ? new Ok<int>(n) : new Err<int>("not a number");

static void Print<T>(Result<T> result)
{
    Console.WriteLine(result switch
    {
        Ok<T>  ok  => $"Success: {ok.Value}",
        Err<T> err => $"Error: {err.Message}",
        _          => throw new InvalidOperationException(),
    });
}

Print(Parse("42"));      // Success: 42
Print(Parse("hello"));   // Error: not a number`,
    explanation: "Sealed abstract record hierarchies simulate discriminated unions; switch expressions over them are exhaustive and type-safe — a common F#/Rust-style pattern in C#.",
  },
  {
    id: "cs-b18-b3-generic-variance",
    language: "csharp",
    title: "out/in variance on generic interfaces",
    tag: "types",
    code: `// Covariant out: producer — safe to upcast return types
interface IProducer<out T> { T Produce(); }

class DogProducer : IProducer<Dog> { public Dog Produce() => new Dog(); }

IProducer<Animal> p = new DogProducer();  // Dog is-an Animal

// Contravariant in: consumer — safe to widen parameter types
interface IConsumer<in T> { void Consume(T item); }

class AnimalConsumer : IConsumer<Animal>
{
    public void Consume(Animal a) => Console.WriteLine(a.GetType().Name);
}

IConsumer<Dog> c = new AnimalConsumer();  // Animal consumer works for Dog
c.Consume(new Dog());

class Animal {}
class Dog : Animal {}`,
    explanation: "out marks covariant type parameters (only appear as return types); in marks contravariant ones (only appear as parameter types). This enables safe up/down casting of generic interfaces.",
  },

  // --- families ---
  {
    id: "cs-b18-b3-efcore-tracking",
    language: "csharp",
    title: "EF Core change tracking",
    tag: "families",
    code: `using Microsoft.EntityFrameworkCore;

class AppDb : DbContext
{
    public DbSet<Product> Products => Set<Product>();
    protected override void OnConfiguring(DbContextOptionsBuilder o)
        => o.UseInMemoryDatabase("demo");
}

class Product { public int Id { get; set; } public string Name { get; set; } = ""; }

using var db = new AppDb();
db.Products.Add(new Product { Name = "Widget" });
db.SaveChanges();

var p = db.Products.First();
p.Name = "Gadget";    // tracked automatically
db.SaveChanges();     // UPDATE generated

// Disable tracking for read-only queries (faster)
var readOnly = db.Products.AsNoTracking().ToList();`,
    explanation: "EF Core's change tracker detects modifications to loaded entities and generates UPDATE SQL on SaveChanges; use AsNoTracking() for read-only queries to avoid tracking overhead.",
  },
  {
    id: "cs-b18-b3-di-container",
    language: "csharp",
    title: "Microsoft.Extensions.DI container",
    tag: "families",
    code: `using Microsoft.Extensions.DependencyInjection;

interface IGreeter { string Greet(string name); }
class EnglishGreeter : IGreeter
{
    public string Greet(string name) => $"Hello, {name}!";
}

var services = new ServiceCollection();
services.AddSingleton<IGreeter, EnglishGreeter>();
services.AddTransient<App>();

var provider = services.BuildServiceProvider();
var app = provider.GetRequiredService<App>();
app.Run();

class App(IGreeter greeter)
{
    public void Run() => Console.WriteLine(greeter.Greet("World"));
}`,
    explanation: "Microsoft.Extensions.DependencyInjection provides a built-in DI container; AddSingleton/Scoped/Transient control lifetime; GetRequiredService throws if unregistered (prefer over GetService).",
  },
  {
    id: "cs-b18-b3-mediatr-handler",
    language: "csharp",
    title: "MediatR CQRS handler pattern",
    tag: "families",
    code: `using MediatR;

// Command
record CreateUserCommand(string Name, string Email) : IRequest<Guid>;

// Handler
class CreateUserHandler : IRequestHandler<CreateUserCommand, Guid>
{
    public Task<Guid> Handle(CreateUserCommand req, CancellationToken ct)
    {
        // Persist user, return new ID
        var id = Guid.NewGuid();
        Console.WriteLine($"Created user {req.Name} with id {id}");
        return Task.FromResult(id);
    }
}

// Usage
var mediator = /* injected */default(IMediator)!;
// var id = await mediator.Send(new CreateUserCommand("Alice", "a@b.com"));`,
    explanation: "MediatR dispatches requests to handlers by type, decoupling command senders from handlers; this enables CQRS patterns where queries and commands are separate objects.",
  },
  {
    id: "cs-b18-b3-polly-retry",
    language: "csharp",
    title: "Polly resilience pipeline",
    tag: "families",
    code: `using Polly;
using Polly.Retry;

var pipeline = new ResiliencePipelineBuilder()
    .AddRetry(new RetryStrategyOptions
    {
        MaxRetryAttempts = 3,
        Delay = TimeSpan.FromMilliseconds(200),
        BackoffType = DelayBackoffType.Exponential,
        OnRetry = args =>
        {
            Console.WriteLine($"Retry {args.AttemptNumber}: {args.Outcome.Exception?.Message}");
            return default;
        },
    })
    .AddTimeout(TimeSpan.FromSeconds(10))
    .Build();

await pipeline.ExecuteAsync(async ct =>
{
    // Your resilient operation
    await Task.Delay(50, ct);
    Console.WriteLine("Succeeded");
});`,
    explanation: "Polly v8's ResiliencePipelineBuilder composes retry, timeout, circuit breaker, and other strategies; policies execute in the order added, with timeout wrapping retry.",
  },
  {
    id: "cs-b18-b3-serilog-enrichers",
    language: "csharp",
    title: "Serilog structured logging with enrichers",
    tag: "families",
    code: `using Serilog;
using Serilog.Context;

Log.Logger = new LoggerConfiguration()
    .Enrich.FromLogContext()
    .Enrich.WithMachineName()
    .WriteTo.Console(outputTemplate:
        "[{Timestamp:HH:mm:ss} {Level:u3}] {SourceContext} {Message:lj}{NewLine}{Exception}")
    .CreateLogger();

var log = Log.ForContext<Program>();

using (LogContext.PushProperty("RequestId", "abc-123"))
{
    log.Information("Processing request for {User}", "Alice");
    log.Warning("Slow response: {Ms}ms", 1500);
}

Log.CloseAndFlush();`,
    explanation: "Serilog enrichers attach properties to all log events; LogContext.PushProperty adds scoped properties within a using block; ForContext<T> sets SourceContext to the class name.",
  },
  {
    id: "cs-b18-b3-signalr-hub",
    language: "csharp",
    title: "SignalR hub for real-time messaging",
    tag: "families",
    code: `using Microsoft.AspNetCore.SignalR;

public class ChatHub : Hub
{
    public async Task SendMessage(string user, string message)
    {
        // Broadcast to all connected clients
        await Clients.All.SendAsync("ReceiveMessage", user, message);
    }

    public async Task JoinGroup(string groupName)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
        await Clients.Group(groupName)
            .SendAsync("ReceiveMessage", "system", $"{Context.ConnectionId} joined");
    }
}`,
    explanation: "SignalR Hub methods are invoked by clients over WebSocket/SSE; Clients.All broadcasts to everyone, Clients.Group targets a named group, and Groups manages group membership.",
  },
  {
    id: "cs-b18-b3-grpc-service",
    language: "csharp",
    title: "gRPC service implementation",
    tag: "families",
    code: `// Proto: service Greeter { rpc SayHello (HelloRequest) returns (HelloReply); }
using Grpc.Core;

public class GreeterService : Greeter.GreeterBase
{
    public override Task<HelloReply> SayHello(
        HelloRequest request, ServerCallContext context)
    {
        return Task.FromResult(new HelloReply
        {
            Message = $"Hello, {request.Name}!"
        });
    }
}

// Register in Program.cs:
// app.MapGrpcService<GreeterService>();`,
    explanation: "gRPC services inherit the generated *Base class; each RPC method receives the strongly-typed request proto message and a ServerCallContext for metadata and cancellation.",
  },
  {
    id: "cs-b18-b3-background-service",
    language: "csharp",
    title: "BackgroundService for hosted workers",
    tag: "families",
    code: `using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

class PollingWorker(ILogger<PollingWorker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        while (!ct.IsCancellationRequested)
        {
            logger.LogInformation("Polling at {Time}", DateTimeOffset.UtcNow);
            await Task.Delay(TimeSpan.FromSeconds(10), ct);
        }
    }
}

// Register: services.AddHostedService<PollingWorker>();`,
    explanation: "BackgroundService is the standard base for long-running hosted services in .NET; ExecuteAsync runs until CancellationToken is cancelled (on app shutdown), and exceptions stop the host.",
  },

  // --- classes ---
  {
    id: "cs-b18-b3-builder-pattern",
    language: "csharp",
    title: "Builder pattern with fluent API",
    tag: "classes",
    code: `class EmailBuilder
{
    private string _to = "", _subject = "", _body = "";
    private readonly List<string> _cc = new();

    public EmailBuilder To(string address) { _to = address; return this; }
    public EmailBuilder Subject(string s)  { _subject = s;  return this; }
    public EmailBuilder Body(string b)     { _body = b;     return this; }
    public EmailBuilder Cc(string address) { _cc.Add(address); return this; }

    public Email Build() => new Email(_to, _subject, _body, _cc);
}

record Email(string To, string Subject, string Body, List<string> Cc);

var email = new EmailBuilder()
    .To("alice@example.com")
    .Subject("Hello")
    .Body("Hi Alice!")
    .Cc("bob@example.com")
    .Build();`,
    explanation: "The fluent Builder pattern returns this from each setter, enabling method chaining that reads like a DSL; Build() validates and constructs the final immutable object.",
  },
  {
    id: "cs-b18-b3-repository-pattern",
    language: "csharp",
    title: "Repository pattern with generic interface",
    tag: "classes",
    code: `interface IRepository<T> where T : class
{
    T? GetById(int id);
    IEnumerable<T> GetAll();
    void Add(T entity);
    void Remove(T entity);
}

class User { public int Id { get; set; } public string Name { get; set; } = ""; }

class InMemoryUserRepo : IRepository<User>
{
    private readonly List<User> _data = new();
    public User?          GetById(int id)   => _data.FirstOrDefault(u => u.Id == id);
    public IEnumerable<User> GetAll()       => _data.AsReadOnly();
    public void Add(User u)                 => _data.Add(u);
    public void Remove(User u)              => _data.Remove(u);
}`,
    explanation: "The Repository pattern abstracts data access behind an interface; swapping the in-memory implementation for EF Core or Dapper requires no changes to business logic.",
  },
  {
    id: "cs-b18-b3-decorator-pattern",
    language: "csharp",
    title: "Decorator pattern via interface wrapping",
    tag: "classes",
    code: `interface IDataService
{
    string Fetch(string key);
}

class DataService : IDataService
{
    public string Fetch(string key) => $"data:{key}";
}

class CachingDecorator(IDataService inner) : IDataService
{
    private readonly Dictionary<string, string> _cache = new();

    public string Fetch(string key)
    {
        if (_cache.TryGetValue(key, out var v)) return v;
        v = inner.Fetch(key);
        _cache[key] = v;
        return v;
    }
}

IDataService svc = new CachingDecorator(new DataService());
Console.WriteLine(svc.Fetch("hello"));  // data:hello (fetched)
Console.WriteLine(svc.Fetch("hello"));  // data:hello (cached)`,
    explanation: "The Decorator wraps an interface implementation to transparently add behavior (caching, logging); it avoids subclassing and can be stacked: new Logging(new Caching(new Real())).",
  },
  {
    id: "cs-b18-b3-composite-pattern",
    language: "csharp",
    title: "Composite pattern for tree structures",
    tag: "classes",
    code: `abstract class FileSystemItem(string name)
{
    public string Name => name;
    public abstract long Size();
    public abstract void Print(int indent = 0);
}

class File(string name, long size) : FileSystemItem(name)
{
    public override long Size() => size;
    public override void Print(int i) =>
        Console.WriteLine($"{new string(' ', i)}{Name} ({size}B)");
}

class Folder(string name) : FileSystemItem(name)
{
    private readonly List<FileSystemItem> _children = new();
    public void Add(FileSystemItem item) => _children.Add(item);
    public override long Size() => _children.Sum(c => c.Size());
    public override void Print(int i)
    {
        Console.WriteLine($"{new string(' ', i)}{Name}/");
        _children.ForEach(c => c.Print(i + 2));
    }
}`,
    explanation: "Composite treats individual objects (File) and compositions (Folder) uniformly via the same abstract class; clients traverse the tree without knowing whether they're calling on a leaf or node.",
  },
  {
    id: "cs-b18-b3-chain-of-responsibility",
    language: "csharp",
    title: "Chain of Responsibility pattern",
    tag: "classes",
    code: `abstract class Handler
{
    protected Handler? Next { get; private set; }
    public Handler SetNext(Handler h) { Next = h; return h; }
    public abstract string? Handle(int request);
}

class LowHandler : Handler
{
    public override string? Handle(int r) =>
        r <= 10 ? $"Low handled {r}" : Next?.Handle(r);
}

class MidHandler : Handler
{
    public override string? Handle(int r) =>
        r <= 50 ? $"Mid handled {r}" : Next?.Handle(r);
}

class HighHandler : Handler
{
    public override string? Handle(int r) => $"High handled {r}";
}

var chain = new LowHandler();
chain.SetNext(new MidHandler()).SetNext(new HighHandler());

Console.WriteLine(chain.Handle(5));   // Low handled 5
Console.WriteLine(chain.Handle(25));  // Mid handled 25
Console.WriteLine(chain.Handle(100)); // High handled 100`,
    explanation: "Chain of Responsibility passes a request along a handler chain; each handler either handles it or delegates to the next. SetNext returns the next handler for fluent chaining.",
  },
  {
    id: "cs-b18-b3-template-method",
    language: "csharp",
    title: "Template Method pattern",
    tag: "classes",
    code: `abstract class DataProcessor
{
    // Template method: fixed algorithm skeleton
    public void Process()
    {
        var data = Read();
        var processed = Transform(data);
        Write(processed);
    }

    protected abstract string Read();
    protected abstract string Transform(string data);
    protected virtual  void   Write(string data) =>
        Console.WriteLine($"Output: {data}");
}

class UpperCaseProcessor : DataProcessor
{
    protected override string Read()             => "hello world";
    protected override string Transform(string d) => d.ToUpperInvariant();
}

new UpperCaseProcessor().Process();  // Output: HELLO WORLD`,
    explanation: "Template Method defines an algorithm's skeleton in a base class with abstract steps filled by subclasses; the base controls flow, subclasses customize behavior without rewriting the structure.",
  },
  {
    id: "cs-b18-b3-state-pattern",
    language: "csharp",
    title: "State pattern",
    tag: "classes",
    code: `interface ITrafficState
{
    void Handle(TrafficLight light);
    string Color { get; }
}

class RedState : ITrafficState
{
    public string Color => "Red";
    public void Handle(TrafficLight l) => l.State = new GreenState();
}

class GreenState : ITrafficState
{
    public string Color => "Green";
    public void Handle(TrafficLight l) => l.State = new YellowState();
}

class YellowState : ITrafficState
{
    public string Color => "Yellow";
    public void Handle(TrafficLight l) => l.State = new RedState();
}

class TrafficLight
{
    public ITrafficState State { get; set; } = new RedState();
    public void Change() { Console.WriteLine(State.Color); State.Handle(this); }
}

var light = new TrafficLight();
for (int i = 0; i < 4; i++) light.Change();
// Red, Green, Yellow, Red`,
    explanation: "The State pattern delegates state-dependent behavior to state objects; transitions happen inside state.Handle(), so adding a new state doesn't require modifying the context class.",
  },
];
