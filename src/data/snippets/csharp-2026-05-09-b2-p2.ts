import type { Snippet } from "./types";

export const csharpSnippets20260509B2P2: Snippet[] = [
  {
    id: "cs-snippet-caller-attributes",
    language: "csharp",
    title: "CallerMemberName injects the calling method's name",
    tag: "snippet",
    code: `using System.Runtime.CompilerServices;

class Logger
{
    public void Log(string msg,
        [CallerMemberName] string member = "",
        [CallerFilePath]   string file   = "",
        [CallerLineNumber] int    line   = 0)
    {
        Console.WriteLine($"[{member}:{line}] {msg}");
    }
}

class Service
{
    void DoWork()
    {
        new Logger().Log("started");   // [DoWork:16] started
    }
}`,
    explanation: "CallerMemberName, CallerFilePath, and CallerLineNumber are compiler-injected default values that capture the calling context; they enable logging, INotifyPropertyChanged, and debugging without reflection.",
  },
  {
    id: "cs-snippet-file-scoped-namespace",
    language: "csharp",
    title: "File-scoped namespace reduces indentation",
    tag: "snippet",
    code: `// Traditional (adds one level of indentation)
// namespace MyApp.Services
// {
//     class UserService { ... }
// }

// File-scoped (C# 10): no extra indentation
namespace MyApp.Services;

class UserService
{
    public string GetUser(int id) => $"User:{id}";
}

// File-scoped namespace applies to the entire file
// Only one namespace per file is allowed`,
    explanation: "File-scoped namespace declarations (C# 10) apply to the entire file without the wrapping braces, removing one level of indentation and making files with a single namespace more concise.",
  },
  {
    id: "cs-snippet-deconstruct-custom",
    language: "csharp",
    title: "Custom Deconstruct enables tuple-like destructuring",
    tag: "snippet",
    code: `class Point
{
    public int X { get; init; }
    public int Y { get; init; }
    // Deconstruct must be public void with out parameters
    public void Deconstruct(out int x, out int y) => (x, y) = (X, Y);
}

var p = new Point { X = 3, Y = 4 };
var (x, y) = p;               // uses Deconstruct
Console.WriteLine($"{x},{y}"); // 3,4

// Works in switch too
string Desc(Point pt) => pt switch
{
    (0, 0) => "origin",
    (var a, 0) => $"x-axis at {a}",
    _ => "other"
};`,
    explanation: "Defining a Deconstruct method with out parameters enables destructuring assignment and positional pattern matching; record types get Deconstruct generated automatically.",
  },
  {
    id: "cs-understanding-stack-heap-alloc",
    language: "csharp",
    title: "Stack vs heap allocation: what goes where",
    tag: "understanding",
    code: `void ShowAllocation()
{
    // Stack: value types declared locally
    int x = 42;             // 4 bytes on stack
    bool flag = true;       // 1 byte on stack (padded)

    // Heap: reference type instances
    string s = "hello";     // pointer on stack, object on heap
    int[] arr = new int[5]; // pointer on stack, array on heap

    // Boxed value type: heap
    object boxed = x;       // copy of x onto heap

    // stackalloc: raw stack array (no GC)
    Span<int> buf = stackalloc int[4];
    buf[0] = 99;
}`,
    explanation: "Local value types are on the stack (fast, no GC); reference types allocate on the heap (GC-managed). stackalloc allocates a raw array on the stack, useful for small temporary buffers in performance-critical code.",
  },
  {
    id: "cs-understanding-generics-reified",
    language: "csharp",
    title: "C# generics are reified: each closed type is distinct at runtime",
    tag: "understanding",
    code: `// Java: generics are erased at runtime (List<String> == List<Integer>)
// C#: generics are reified -- separate code is JIT-compiled per type

Console.WriteLine(typeof(List<int>)    == typeof(List<string>)); // False
Console.WriteLine(typeof(List<int>).IsGenericType);              // True
Console.WriteLine(typeof(List<int>).GetGenericArguments()[0]);   // System.Int32

// Value-type generics get specialised JIT code (no boxing)
// Reference-type generics share one JIT compilation`,
    explanation: "C# generics exist at runtime as distinct types; this allows value-type specialisation (no boxing for List<int>), reflection over type parameters, and generic constraints checked at instantiation time.",
  },
  {
    id: "cs-understanding-const-readonly",
    language: "csharp",
    title: "const vs readonly vs static readonly",
    tag: "understanding",
    code: `class Constants
{
    // const: compile-time constant, inlined by compiler
    public const int MaxRetries = 3;

    // readonly: set once (in field initialiser or constructor)
    public readonly int SessionId;

    // static readonly: lazy-ish init, evaluated at class load
    public static readonly DateTime AppStart = DateTime.UtcNow;

    public Constants(int id) { SessionId = id; }
}

// Beware: const is inlined -- changing it requires recompiling callers
// static readonly is evaluated at runtime -- safe for complex values`,
    explanation: "const is inlined at compile time (fast but causes binary coupling); readonly is set once per instance; static readonly is shared and initialised once when the class is first accessed.",
  },
  {
    id: "cs-understanding-expression-body",
    language: "csharp",
    title: "Expression-bodied members reduce ceremony",
    tag: "understanding",
    code: `class Circle(double radius)
{
    // Expression-bodied property
    public double Radius => radius;

    // Expression-bodied computed property
    public double Area => Math.PI * radius * radius;

    // Expression-bodied method
    public string Describe() => $"Circle r={radius:F2} area={Area:F2}";

    // Expression-bodied constructor
    // public Circle(double r) => radius = r;  // single-expression body

    // Expression-bodied operators
    public static Circle operator +(Circle a, Circle b)
        => new(a.radius + b.radius);
}`,
    explanation: "Expression-bodied members use => instead of a block body; they're concise for single-expression logic and work for methods, properties, constructors, operators, and indexers.",
  },
  {
    id: "cs-understanding-method-group",
    language: "csharp",
    title: "Method groups convert to delegate types implicitly",
    tag: "understanding",
    code: `// Method group: refer to a method by name without ()
static int Double(int n) => n * 2;

// Assign method group to a compatible delegate
Func<int, int> fn = Double;      // method group conversion
Console.WriteLine(fn(5));        // 10

// Use as argument (avoids lambda overhead)
var nums = new[] { 1, 2, 3, 4 };
var doubled = nums.Select(Double).ToArray();    // cleaner than n => Double(n)
Console.WriteLine(string.Join(",", doubled));   // 2,4,6,8

// Instance method group
var list = new List<int> { 3, 1, 2 };
list.Sort(Comparer<int>.Default.Compare);`,
    explanation: "A method group is a method name used as a delegate value; the compiler infers the delegate type from the context. Method groups are slightly more efficient than equivalent lambdas because no closure object is created.",
  },
  {
    id: "cs-structures-concurrent-bag",
    language: "csharp",
    title: "ConcurrentBag<T> for unordered thread-safe item storage",
    tag: "structures",
    code: `using System.Collections.Concurrent;

var bag = new ConcurrentBag<int>();

// Multiple producers
var tasks = Enumerable.Range(0, 100)
    .Select(i => Task.Run(() => bag.Add(i)));
await Task.WhenAll(tasks);

Console.WriteLine(bag.Count);   // 100

// Consume
while (bag.TryTake(out int item))
    Console.Write(item + " ");   // unordered`,
    explanation: "ConcurrentBag is optimised for scenarios where each thread mostly produces and consumes its own items (work-stealing bag); it's faster than a locked list but unordered. Use ConcurrentQueue for FIFO ordering.",
  },
  {
    id: "cs-structures-blocking-collection",
    language: "csharp",
    title: "BlockingCollection<T> provides blocking producer-consumer",
    tag: "structures",
    code: `using System.Collections.Concurrent;

var bc = new BlockingCollection<int>(boundedCapacity: 5);

// Producer thread
var producer = Task.Run(() =>
{
    for (int i = 0; i < 10; i++)
        bc.Add(i);      // blocks when capacity reached
    bc.CompleteAdding();
});

// Consumer: GetConsumingEnumerable blocks until item available
foreach (int item in bc.GetConsumingEnumerable())
    Console.Write(item + " ");

await producer;`,
    explanation: "BlockingCollection wraps any IProducerConsumerCollection; Add blocks when the bounded capacity is full, and GetConsumingEnumerable blocks when empty, providing natural backpressure in pipelines.",
  },
  {
    id: "cs-structures-sorted-list",
    language: "csharp",
    title: "SortedList<K,V> maintains sorted order with O(log n) lookup",
    tag: "structures",
    code: `var sl = new SortedList<string, int>();
sl["banana"] = 2;
sl["apple"]  = 1;
sl["cherry"] = 3;

// Keys are always sorted
Console.WriteLine(string.Join(",", sl.Keys));    // apple,banana,cherry
Console.WriteLine(string.Join(",", sl.Values));  // 1,2,3

// O(log n) lookup by key
Console.WriteLine(sl["banana"]);   // 2

// Index access (unlike SortedDictionary)
Console.WriteLine(sl.Keys[0]);     // apple
Console.WriteLine(sl.Values[0]);   // 1`,
    explanation: "SortedList<K,V> maintains two parallel arrays (keys and values) sorted by key; it allows O(1) index access (unlike SortedDictionary) but O(n) insertions in the worst case.",
  },
  {
    id: "cs-structures-bit-array",
    language: "csharp",
    title: "BitArray stores Boolean flags compactly (1 bit per element)",
    tag: "structures",
    code: `using System.Collections;

var bits = new BitArray(8, defaultValue: false);
bits[0] = true;
bits[3] = true;
bits[7] = true;

Console.WriteLine(bits.Count);  // 8
Console.WriteLine(bits[3]);     // True
Console.WriteLine(bits[1]);     // False

// Bitwise operations
var mask = new BitArray(8, true);
var result = bits.And(mask);     // in-place AND
Console.WriteLine(result[0]);    // True`,
    explanation: "BitArray stores booleans as individual bits (8 per byte vs 1 byte per bool), reducing memory by 8x for large flag arrays. It supports And/Or/Xor/Not operations on entire arrays at once.",
  },
  {
    id: "cs-caveats-string-concat-loop",
    language: "csharp",
    title: "String concatenation in a loop is O(n²): use StringBuilder",
    tag: "caveats",
    code: `// SLOW: each += allocates a new string (O(n²) total)
string result = "";
for (int i = 0; i < 10_000; i++)
    result += i;   // avoid!

// FAST: StringBuilder amortises over a resizable buffer
var sb = new System.Text.StringBuilder(capacity: 60_000);
for (int i = 0; i < 10_000; i++)
    sb.Append(i);
string r = sb.ToString();

// For small known-size concatenation, + is fine:
string greeting = "Hello, " + firstName + "!";`,
    explanation: "Each string += copies all existing characters into a new object; over n iterations this is O(n²) allocations. StringBuilder maintains a resizable buffer and allocates once at ToString().",
  },
  {
    id: "cs-caveats-enum-parse-safe",
    language: "csharp",
    title: "Enum.Parse throws; TryParse is the safe alternative",
    tag: "caveats",
    code: `enum Direction { North, South, East, West }

// Throws ArgumentException if value not defined
try
{
    var bad = Enum.Parse<Direction>("Up");
}
catch (ArgumentException e) { Console.WriteLine(e.Message); }

// Safe: TryParse returns false on failure
if (Enum.TryParse<Direction>("North", ignoreCase: true, out var dir))
    Console.WriteLine(dir);   // North
else
    Console.WriteLine("invalid");

// Also handles numeric strings: "0" -> Direction.North
Enum.TryParse<Direction>("0", out var d2);
Console.WriteLine(d2);   // North`,
    explanation: "Enum.Parse throws for invalid values; Enum.TryParse<T> returns false instead, making it safe for user or external input. It also accepts numeric strings and supports case-insensitive matching.",
  },
  {
    id: "cs-caveats-catch-order",
    language: "csharp",
    title: "catch clauses are evaluated top-to-bottom; order matters",
    tag: "caveats",
    code: `try
{
    int[] arr = null!;
    _ = arr[0];
}
// Most specific first
catch (NullReferenceException e)
{
    Console.WriteLine("null ref: " + e.Message);
}
catch (IndexOutOfRangeException e)
{
    Console.WriteLine("index: " + e.Message);
}
catch (Exception e)
{
    Console.WriteLine("general: " + e.Message);
}
// If catch(Exception) were first it would shadow all others
// CS0160: unreachable catch clause is a compile error`,
    explanation: "The runtime checks catch clauses in order and uses the first matching one; put the most specific exceptions first. The compiler rejects a catch clause that is unreachable because a broader exception appears before it.",
  },
  {
    id: "cs-caveats-double-dispose",
    language: "csharp",
    title: "Calling Dispose twice is safe if properly implemented",
    tag: "caveats",
    code: `class Resource : IDisposable
{
    private bool _disposed;

    public void Dispose()
    {
        if (_disposed) return;   // idempotent: safe to call twice
        _disposed = true;
        // free unmanaged resources here
        GC.SuppressFinalize(this);
    }

    protected virtual void Dispose(bool disposing) { }
}

var r = new Resource();
r.Dispose();
r.Dispose();   // second call is a no-op, no exception`,
    explanation: "The IDisposable contract states that Dispose must be idempotent (calling it multiple times has the same effect as once); using statements can call Dispose in edge cases, so implementations must guard with a _disposed flag.",
  },
  {
    id: "cs-classes-dispose-pattern",
    language: "csharp",
    title: "The full IDisposable pattern with a finalizer",
    tag: "classes",
    code: `class NativeWrapper : IDisposable
{
    private IntPtr _handle;   // unmanaged resource
    private bool   _disposed;

    public NativeWrapper()
    {
        _handle = /* allocate native */ IntPtr.Zero;
    }

    public void Dispose()
    {
        Dispose(disposing: true);
        GC.SuppressFinalize(this);  // prevent finalizer from running
    }

    protected virtual void Dispose(bool disposing)
    {
        if (_disposed) return;
        if (disposing) { /* free managed resources */ }
        // Always free unmanaged resources
        if (_handle != IntPtr.Zero) _handle = IntPtr.Zero;
        _disposed = true;
    }

    ~NativeWrapper() => Dispose(disposing: false);
}`,
    explanation: "The full dispose pattern separates managed cleanup (safe to run from Dispose) and unmanaged cleanup (must run from both Dispose and finalizer). GC.SuppressFinalize prevents the finalizer from running if Dispose was already called.",
  },
  {
    id: "cs-classes-singleton-lazy",
    language: "csharp",
    title: "Thread-safe singleton via Lazy<T> or nested class",
    tag: "classes",
    code: `// Option A: Lazy<T> (explicit, readable)
class Registry
{
    private static readonly Lazy<Registry> _lazy = new(() => new Registry());
    public static Registry Instance => _lazy.Value;
    private Registry() { }
    public string Get(string key) => key;
}

// Option B: nested static class (JIT-guaranteed thread-safe initialisation)
class Config
{
    private Config() { }
    public static Config Instance => Holder.Value;
    private static class Holder
    {
        internal static readonly Config Value = new Config();
    }
}`,
    explanation: "Lazy<T> is explicit and allows passing LazyThreadSafetyMode; the nested static class pattern relies on the CLR's guarantee that static fields are initialised exactly once before first access, with no extra locking code.",
  },
  {
    id: "cs-classes-builder-fluent",
    language: "csharp",
    title: "Fluent builder pattern for complex object construction",
    tag: "classes",
    code: `class QueryBuilder
{
    private string _table = "";
    private string _where = "";
    private int _limit = 100;

    public QueryBuilder From(string table) { _table = table; return this; }
    public QueryBuilder Where(string condition) { _where = condition; return this; }
    public QueryBuilder Limit(int n) { _limit = n; return this; }

    public string Build()
    {
        string sql = $"SELECT * FROM {_table}";
        if (!string.IsNullOrEmpty(_where)) sql += $" WHERE {_where}";
        sql += $" LIMIT {_limit}";
        return sql;
    }
}

var sql = new QueryBuilder()
    .From("users")
    .Where("age > 18")
    .Limit(50)
    .Build();
Console.WriteLine(sql);`,
    explanation: "The fluent builder returns this from each method, enabling method chaining; it's useful when constructing objects with many optional parameters, avoiding long constructor parameter lists.",
  },
  {
    id: "cs-classes-strategy-pattern",
    language: "csharp",
    title: "Strategy pattern: inject an algorithm as a delegate or interface",
    tag: "classes",
    code: `// Interface-based strategy
interface ISorter<T> { IEnumerable<T> Sort(IEnumerable<T> items); }

class AscSorter<T> : ISorter<T> where T : IComparable<T>
{
    public IEnumerable<T> Sort(IEnumerable<T> items)
        => items.OrderBy(x => x);
}

// Delegate-based (simpler for single-method strategies)
class Processor<T>(Func<IEnumerable<T>, IEnumerable<T>> strategy)
{
    public IEnumerable<T> Process(IEnumerable<T> data)
        => strategy(data);
}

var p = new Processor<int>(items => items.OrderByDescending(x => x));
Console.WriteLine(string.Join(",", p.Process([3, 1, 4, 1, 5])));
// 5,4,3,1,1`,
    explanation: "The Strategy pattern encapsulates an algorithm behind an interface or delegate; the context class is unaware of which strategy is used. Delegates work well for single-method strategies without the overhead of a class.",
  },
  {
    id: "cs-classes-observer-events",
    language: "csharp",
    title: "Observer pattern with C# events",
    tag: "classes",
    code: `class StockTicker
{
    public event Action<string, decimal>? PriceChanged;

    private decimal _price;
    public decimal Price
    {
        get => _price;
        set
        {
            if (_price == value) return;
            _price = value;
            PriceChanged?.Invoke("ACME", _price);
        }
    }
}

var ticker = new StockTicker();
ticker.PriceChanged += (sym, price)
    => Console.WriteLine($"{sym}: \${price:F2}");

ticker.Price = 100.50m;  // ACME: $100.50
ticker.Price = 101.00m;  // ACME: $101.00`,
    explanation: "C# events are multicast delegates with restricted access (add/remove only from outside the class); they implement the Observer pattern natively, allowing multiple subscribers without the subject knowing about them.",
  },
  {
    id: "cs-families-linq-deferred",
    language: "csharp",
    title: "LINQ deferred vs immediate execution operators",
    tag: "families",
    code: `var data = new List<int> { 1, 2, 3, 4, 5 };

// DEFERRED: returns IEnumerable, not evaluated yet
var query = data.Where(n => n > 2).Select(n => n * 10);

data.Add(6);   // modifying source before iteration

// NOW it executes (includes 6 because query was deferred)
Console.WriteLine(string.Join(",", query));   // 30,40,50,60

// IMMEDIATE: executes right away
int   sum   = data.Sum();           // evaluates now
int   count = data.Count();         // evaluates now
bool  any   = data.Any(n => n > 4); // evaluates now
int[] arr   = data.ToArray();       // evaluates and materialises`,
    explanation: "LINQ operators like Where, Select, OrderBy, Skip, Take are deferred; operators like Sum, Count, Any, First, ToList, ToArray execute immediately. Deferred queries see the source state at enumeration time, not at declaration time.",
  },
  {
    id: "cs-families-http-client",
    language: "csharp",
    title: "HttpClient: proper usage with IHttpClientFactory",
    tag: "families",
    code: `// DON'T: instantiate HttpClient per-request (socket exhaustion)
// using var client = new HttpClient(); // creates a new client each time

// DO: inject via IHttpClientFactory (ASP.NET) or reuse a static instance
using System.Net.Http;
using System.Net.Http.Json;

// In a real app, inject IHttpClientFactory and call factory.CreateClient()
using var client = new HttpClient { BaseAddress = new Uri("https://api.example.com") };
client.DefaultRequestHeaders.Add("Accept", "application/json");

// GET with JSON deserialization
// var user = await client.GetFromJsonAsync<User>("/users/1");

// POST with JSON body
// var resp = await client.PostAsJsonAsync("/users", new { name = "Alice" });
Console.WriteLine("HttpClient ready");`,
    explanation: "HttpClient reuses TCP connections via a connection pool; creating a new instance per request bypasses the pool and causes socket exhaustion. Use IHttpClientFactory (ASP.NET) or a shared static HttpClient instance.",
  },
];
