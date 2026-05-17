import type { Snippet } from "./types";

export const csharpSnippets20260517B5: Snippet[] = [
  {
    id: "cs-b17-b5-linq-leftjoin",
    language: "csharp",
    title: "LINQ left outer join with GroupJoin",
    tag: "snippet",
    code: `var customers = new[] { new { Id=1, Name="Alice" }, new { Id=2, Name="Bob" } };
var orders    = new[] { new { CustId=1, Item="Widget" }, new { CustId=1, Item="Gadget" } };

var result = customers.GroupJoin(orders,
    c => c.Id, o => o.CustId,
    (c, os) => new { c.Name, Orders = os.DefaultIfEmpty() });

foreach (var r in result)
    Console.WriteLine($"{r.Name}: {r.Orders.Count()} orders");`,
    explanation: "`GroupJoin` + `DefaultIfEmpty()` implements a SQL-style left outer join, returning all left-side elements and an empty collection when no right-side matches.",
  },
  {
    id: "cs-b17-b5-record-deconstruct",
    language: "csharp",
    title: "Custom Deconstruct on non-record classes",
    tag: "snippet",
    code: `class DateRange
{
    public DateTime Start { get; }
    public DateTime End   { get; }
    public DateRange(DateTime s, DateTime e) { Start = s; End = e; }

    public void Deconstruct(out DateTime start, out DateTime end)
        => (start, end) = (Start, End);
}

var r = new DateRange(DateTime.Today, DateTime.Today.AddDays(7));
var (start, end) = r;
Console.WriteLine($"{start:d} to {end:d}");`,
    explanation: "Any class with a `Deconstruct` method supports deconstruction syntax; the out-parameter count determines how many variables the left side can bind.",
  },
  {
    id: "cs-b17-b5-span-write",
    language: "csharp",
    title: "Writing into a Span<char> buffer",
    tag: "snippet",
    code: `Span<char> buffer = stackalloc char[64];
int pos = 0;

"Hello".AsSpan().CopyTo(buffer[pos..]);
pos += 5;
buffer[pos++] = ',';
buffer[pos++] = ' ';
"World".AsSpan().CopyTo(buffer[pos..]);
pos += 5;

Console.WriteLine(buffer[..pos].ToString());  // Hello, World`,
    explanation: "Building strings into a `Span<char>` avoids intermediate `string` allocations; `AsSpan().CopyTo` is the zero-copy way to write a known string into the buffer.",
  },
  {
    id: "cs-b17-b5-pattern-property",
    language: "csharp",
    title: "Property pattern matching on nested members",
    tag: "snippet",
    code: `record Address(string City, string Country);
record Person(string Name, Address Address);

bool IsInUK(Person p) => p is { Address: { Country: "UK" } };

var alice = new Person("Alice", new Address("London", "UK"));
var bob   = new Person("Bob",   new Address("Paris",  "FR"));

Console.WriteLine(IsInUK(alice));  // True
Console.WriteLine(IsInUK(bob));    // False`,
    explanation: "Property patterns can be nested arbitrarily deep with `{ Member: { NestedMember: value } }`, avoiding repetitive null-guarded property access chains.",
  },
  {
    id: "cs-b17-b5-async-lock",
    language: "csharp",
    title: "Async-compatible locking with SemaphoreSlim(1)",
    tag: "snippet",
    code: `class AsyncCounter
{
    private int _count = 0;
    private readonly SemaphoreSlim _lock = new(1, 1);

    public async Task IncrementAsync()
    {
        await _lock.WaitAsync();
        try { _count++; }
        finally { _lock.Release(); }
    }

    public int Value => _count;
}`,
    explanation: "`SemaphoreSlim(1,1)` acts as an async mutex; `WaitAsync()` yields control while waiting instead of blocking the thread like `lock {}` would.",
  },
  {
    id: "cs-b17-b5-string-span-comparison",
    language: "csharp",
    title: "Allocation-free string comparison with AsSpan",
    tag: "snippet",
    code: `string header = "Content-Type: application/json";

ReadOnlySpan<char> prefix = "Content-Type: ";
if (header.AsSpan().StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
{
    var value = header.AsSpan(prefix.Length);
    Console.WriteLine(value.ToString());  // application/json
}`,
    explanation: "`string.AsSpan()` gives a `ReadOnlySpan<char>` over the string's buffer; `StartsWith` on spans avoids allocating a substring for prefix comparison.",
  },
  {
    id: "cs-b17-b5-linq-scan",
    language: "csharp",
    title: "Running totals (scan) with LINQ Aggregate",
    tag: "snippet",
    code: `var items = new[] { 1, 2, 3, 4, 5 };

// Aggregate with a list accumulator = prefix-sum (scan)
var prefixSums = items.Aggregate(
    new List<int> { 0 },
    (acc, x) => { acc.Add(acc[^1] + x); return acc; });

Console.WriteLine(string.Join(",", prefixSums));
// 0,1,3,6,10,15`,
    explanation: "Using a `List<T>` as the `Aggregate` seed and appending each intermediate value produces a prefix scan, equivalent to `itertools.accumulate` in Python.",
  },
  {
    id: "cs-b17-b5-target-typed-new",
    language: "csharp",
    title: "Target-typed new expressions (C# 9)",
    tag: "snippet",
    code: `List<int> numbers   = new() { 1, 2, 3 };
Dictionary<string, int> map = new();

void Process(List<string> items) { /* ... */ }
Process(new() { "a", "b", "c" });  // infers List<string>`,
    explanation: "Target-typed `new()` infers the constructed type from the context (variable type, parameter type, etc.), reducing redundancy in declarations.",
  },
  {
    id: "cs-b17-b5-file-scoped-namespace",
    language: "csharp",
    title: "File-scoped namespace declaration (C# 10)",
    tag: "snippet",
    code: `// Without file-scoped: entire file wrapped in braces
// With file-scoped: one level of indentation removed
namespace MyApp.Models;

public record Product(int Id, string Name, decimal Price);
public record Order(int Id, List<Product> Products);`,
    explanation: "File-scoped namespaces (`namespace X;`) apply to the entire file without braces, reducing indentation and making the file feel cleaner for single-namespace files.",
  },
  {
    id: "cs-b17-b5-using-declaration",
    language: "csharp",
    title: "using declaration (C# 8) vs using statement",
    tag: "snippet",
    code: `// Old: block scoped
using (var stream = File.OpenRead("data.bin"))
{
    // ...
}  // disposed here

// New: declaration — disposed at end of enclosing scope
using var reader = new StreamReader("data.txt");
string content = reader.ReadToEnd();
// reader is disposed when method returns`,
    explanation: "`using var x = ...;` ties the lifetime of the disposable to the enclosing block, removing one level of nesting while keeping identical semantics.",
  },
  {
    id: "cs-b17-b5-readonly-struct",
    language: "csharp",
    title: "readonly struct guarantees immutability",
    tag: "snippet",
    code: `readonly struct Vector3
{
    public float X { get; }
    public float Y { get; }
    public float Z { get; }

    public Vector3(float x, float y, float z) => (X, Y, Z) = (x, y, z);
    public float Length => MathF.Sqrt(X*X + Y*Y + Z*Z);
    public static Vector3 operator +(Vector3 a, Vector3 b) => new(a.X+b.X, a.Y+b.Y, a.Z+b.Z);
}`,
    explanation: "`readonly struct` ensures all fields are read-only and prevents defensive copies when passed as `in` parameters, making it more efficient for small, frequently-passed value types.",
  },
  {
    id: "cs-b17-b5-enumerable-range-select",
    language: "csharp",
    title: "Enumerable.Range and Repeat",
    tag: "snippet",
    code: `var squares = Enumerable.Range(1, 5).Select(x => x * x);
Console.WriteLine(string.Join(",", squares));  // 1,4,9,16,25

var zeros = Enumerable.Repeat(0, 5).ToArray();
Console.WriteLine(string.Join(",", zeros));    // 0,0,0,0,0`,
    explanation: "`Enumerable.Range(start, count)` generates consecutive integers; `Enumerable.Repeat(element, count)` generates the same element N times — both are lazy.",
  },
  {
    id: "cs-b17-b5-bitwise-operations",
    language: "csharp",
    title: "Bitwise flag operations with [Flags] enum",
    tag: "snippet",
    code: `[Flags]
enum Permission { None=0, Read=1, Write=2, Execute=4, All=7 }

var perms = Permission.Read | Permission.Write;
Console.WriteLine(perms);                        // Read, Write
Console.WriteLine(perms.HasFlag(Permission.Read));   // True
Console.WriteLine(perms.HasFlag(Permission.Execute)); // False

perms |= Permission.Execute;
perms &= ~Permission.Write;
Console.WriteLine(perms);  // Read, Execute`,
    explanation: "`[Flags]` makes an enum work with bitwise operators and gives `ToString()` a comma-separated representation; `HasFlag` checks individual bits safely.",
  },
  {
    id: "cs-b17-b5-generic-math-sum",
    language: "csharp",
    title: "Generic method working with any numeric type",
    tag: "snippet",
    code: `using System.Numerics;

T Average<T>(T[] data) where T : INumber<T>
{
    T sum = data.Aggregate(T.Zero, (acc, x) => acc + x);
    return sum / T.CreateChecked(data.Length);
}

Console.WriteLine(Average(new[] { 1, 2, 3, 4, 5 }));     // 3
Console.WriteLine(Average(new[] { 1.0, 2.0, 3.0 }));     // 2`,
    explanation: "`INumber<T>` provides `Zero`, arithmetic operators, and `CreateChecked` for integer conversion — enough to write fully generic numeric algorithms.",
  },
  {
    id: "cs-b17-b5-lazy-initialization",
    language: "csharp",
    title: "Lazy<T> for thread-safe lazy initialization",
    tag: "snippet",
    code: `class ExpensiveService
{
    private static readonly Lazy<ExpensiveService> _instance =
        new(() => new ExpensiveService(), isThreadSafe: true);

    public static ExpensiveService Instance => _instance.Value;

    private ExpensiveService() => Console.WriteLine("initialized");
    public void DoWork() => Console.WriteLine("working");
}

ExpensiveService.Instance.DoWork();   // "initialized" then "working"
ExpensiveService.Instance.DoWork();   // just "working"`,
    explanation: "`Lazy<T>` initialises the value on first access using the factory function; with `isThreadSafe: true` the factory runs exactly once even under concurrent access.",
  },
  {
    id: "cs-b17-b5-span-foreach",
    language: "csharp",
    title: "Span<T> foreach without bounds-check overhead",
    tag: "snippet",
    code: `static int SumSpan(ReadOnlySpan<int> data)
{
    int sum = 0;
    foreach (ref readonly int x in data)
        sum += x;
    return sum;
}

int[] arr = { 1, 2, 3, 4, 5 };
Console.WriteLine(SumSpan(arr));  // 15`,
    explanation: "`foreach` over a `Span<T>` uses the span's `GetEnumerator`, which the JIT optimises to remove bounds checks — faster than indexed access with bounds verification.",
  },
  {
    id: "cs-b17-b5-pattern-var",
    language: "csharp",
    title: "var pattern for always-matching capture",
    tag: "snippet",
    code: `static string Describe(object? obj) => obj switch
{
    null          => "null",
    int n when n < 0 => $"negative int: {n}",
    var x when x.ToString()!.Length > 5 => $"long: {x}",
    var x         => $"other: {x}",
};

Console.WriteLine(Describe(null));       // null
Console.WriteLine(Describe(-3));         // negative int: -3
Console.WriteLine(Describe("hello!!"));  // long: hello!!`,
    explanation: "The `var` pattern always matches and binds the value to a variable; useful as a default arm that still captures the value for use in a `when` guard or body.",
  },
  {
    id: "cs-b17-b5-ref-returns",
    language: "csharp",
    title: "ref return for in-place mutation",
    tag: "snippet",
    code: `static ref int Max(ref int a, ref int b) => ref (a > b ? ref a : ref b);

int x = 5, y = 3;
ref int bigger = ref Max(ref x, ref y);
bigger = 99;   // mutates x in place

Console.WriteLine(x);  // 99`,
    explanation: "`ref` returns give callers a reference to a storage location inside a struct or array; mutating the returned `ref` modifies the original — useful for high-performance scenarios.",
  },
  {
    id: "cs-b17-b5-implicit-operator",
    language: "csharp",
    title: "implicit and explicit conversion operators",
    tag: "snippet",
    code: `readonly struct Celsius
{
    public float Value { get; }
    public Celsius(float v) => Value = v;

    public static implicit operator Fahrenheit(Celsius c)
        => new Fahrenheit(c.Value * 9 / 5 + 32);
}

readonly struct Fahrenheit { public float Value { get; } public Fahrenheit(float v) => Value = v; }

Celsius c = new Celsius(100);
Fahrenheit f = c;  // implicit conversion
Console.WriteLine(f.Value);  // 212`,
    explanation: "`implicit operator T` allows silent automatic conversion; `explicit operator T` requires a cast. Use `implicit` only when the conversion is lossless and obvious.",
  },
  {
    id: "cs-b17-b5-generic-where-class-interface",
    language: "csharp",
    title: "Combining multiple generic constraints",
    tag: "snippet",
    code: `interface IEntity { int Id { get; } }
interface ICloneable<T> { T Clone(); }

class Repository<T> where T : class, IEntity, ICloneable<T>, new()
{
    private List<T> _items = new();
    public void Add(T item) => _items.Add(item.Clone());
    public T? Get(int id)   => _items.FirstOrDefault(x => x.Id == id);
}`,
    explanation: "Multiple `where` constraints combine with commas: `class` (reference type), interface constraints, and `new()` (parameterless constructor) can all apply to one type parameter.",
  },
  {
    id: "cs-b17-b5-understanding-stackvheap",
    language: "csharp",
    title: "Stack vs heap lifetime and escape analysis",
    tag: "understanding",
    code: `// struct fields stored inline in the enclosing object (heap or stack)
struct Point { public int X, Y; }

void Demo()
{
    Point local = new Point { X = 1, Y = 2 };  // on stack
    // local is freed when Demo() returns

    var heap = new Point[10];   // array on heap
    heap[0] = local;            // value copied into heap array
}`,
    explanation: "Local value types live on the stack and are freed at scope exit; storing them in an array or class field promotes them to the heap. The CLR manages heap lifetimes via GC.",
  },
  {
    id: "cs-b17-b5-understanding-task-state",
    language: "csharp",
    title: "Task status lifecycle",
    tag: "understanding",
    code: `var cts = new CancellationTokenSource();
var task = Task.Run(async () =>
{
    await Task.Delay(1000, cts.Token);
}, cts.Token);

cts.Cancel();
try { await task; } catch { }

Console.WriteLine(task.Status);   // Canceled
Console.WriteLine(task.IsCanceled);  // True`,
    explanation: "A `Task` passes through `Created → Running → RanToCompletion | Faulted | Canceled`; always check `Status` or `IsFaulted`/`IsCanceled` before accessing `Result`.",
  },
  {
    id: "cs-b17-b5-understanding-async-void",
    language: "csharp",
    title: "async void is fire-and-forget and hides exceptions",
    tag: "understanding",
    code: `// BAD: exception disappears, caller can't await
async void FireAndForget()
{
    await Task.Delay(100);
    throw new Exception("lost!");
}

// GOOD: return Task so exceptions propagate
async Task SafeWork()
{
    await Task.Delay(100);
    throw new Exception("catchable");
}`,
    explanation: "`async void` is intended only for event handlers; exceptions from it can crash the process unobserved. Always return `Task` or `Task<T>` so callers can observe errors.",
  },
  {
    id: "cs-b17-b5-understanding-string-pool",
    language: "csharp",
    title: "String interning in .NET",
    tag: "understanding",
    code: `string a = "hello";
string b = "hello";
Console.WriteLine(ReferenceEquals(a, b));    // True — interned

string c = new string(new[] { 'h','e','l','l','o' });
Console.WriteLine(ReferenceEquals(a, c));    // False

string d = string.Intern(c);
Console.WriteLine(ReferenceEquals(a, d));    // True`,
    explanation: ".NET interns literal strings at compile time; `string.Intern` looks up or adds a string to the intern pool, making `ReferenceEquals` work as equality for interned strings.",
  },
  {
    id: "cs-b17-b5-understanding-readonly-field",
    language: "csharp",
    title: "readonly fields vs const",
    tag: "understanding",
    code: `class Config
{
    public const    string Version = "1.0";   // compile-time constant
    public readonly string Name;               // set once in ctor

    public Config(string name) => Name = name;
}

// const is baked into caller's IL — recompile all dependents to change
// readonly is read at runtime — only recompile the defining assembly`,
    explanation: "`const` is a compile-time literal baked into callers; `readonly` is evaluated at runtime. Change a `const` in a library and callers won't see it without recompilation.",
  },
  {
    id: "cs-b17-b5-understanding-ienumerable-vs-ilist",
    language: "csharp",
    title: "IEnumerable<T> vs IList<T> as parameter types",
    tag: "understanding",
    code: `// Accept the weakest abstraction that satisfies the method
void Print(IEnumerable<int> items)   // only needs iteration
{
    foreach (var x in items)
        Console.WriteLine(x);
}

void Update(IList<int> items)        // needs indexed writes
{
    for (int i = 0; i < items.Count; i++)
        items[i] *= 2;
}`,
    explanation: "Accept the weakest collection interface that the method needs; `IEnumerable<T>` for read-only iteration, `IList<T>` for indexed access — this maximises the types callers can pass.",
  },
  {
    id: "cs-b17-b5-caveats-disposed-twice",
    language: "csharp",
    title: "Dispose must be safe to call multiple times",
    tag: "caveats",
    code: `class SafeResource : IDisposable
{
    private bool _disposed;

    public void Dispose()
    {
        if (_disposed) return;
        _disposed = true;
        Console.WriteLine("disposed");
    }
}

var r = new SafeResource();
r.Dispose();   // "disposed"
r.Dispose();   // no error — guard prevents double-free`,
    explanation: "`IDisposable.Dispose` must be idempotent; the `_disposed` guard prevents double-releasing unmanaged resources, which could corrupt state or throw native exceptions.",
  },
  {
    id: "cs-b17-b5-caveats-linq-requery",
    language: "csharp",
    title: "LINQ query re-executes on each enumeration",
    tag: "caveats",
    code: `int callCount = 0;
var query = Enumerable.Range(1, 5)
    .Select(x => { callCount++; return x * 2; });

var _ = query.ToList();   // 5 calls
var __ = query.ToList();  // 5 more calls
Console.WriteLine(callCount);   // 10

var cached = query.ToList();    // materialise once
var ___ = cached;               // no re-execution`,
    explanation: "LINQ queries are re-evaluated every time they're iterated; if the source changes or the projection is expensive, call `ToList()` or `ToArray()` to cache the result.",
  },
  {
    id: "cs-b17-b5-caveats-thread-static",
    language: "csharp",
    title: "[ThreadStatic] fields are per-thread",
    tag: "caveats",
    code: `class Logger
{
    [ThreadStatic]
    private static int _indentLevel;  // each thread has its own copy

    public static void Indent()   => _indentLevel++;
    public static void Unindent() => _indentLevel--;
    public static string Prefix   => new string(' ', _indentLevel * 2);
}`,
    explanation: "`[ThreadStatic]` gives each thread its own copy of a static field — initialized to `default` (0/null), NOT the field initializer value, on every thread except the first.",
  },
  {
    id: "cs-b17-b5-caveats-event-leak",
    language: "csharp",
    title: "Forgetting to unsubscribe from events causes leaks",
    tag: "caveats",
    code: `class Publisher { public event Action? Updated; public void Fire() => Updated?.Invoke(); }
class Subscriber
{
    public Subscriber(Publisher pub) => pub.Updated += OnUpdate;
    void OnUpdate() => Console.WriteLine("update");
    // BUG: never unsubscribes — Publisher keeps Subscriber alive
}

// Fix: implement IDisposable and unsubscribe in Dispose
class SafeSubscriber : IDisposable
{
    private readonly Publisher _pub;
    public SafeSubscriber(Publisher p) { _pub = p; _pub.Updated += OnUpdate; }
    void OnUpdate() => Console.WriteLine("update");
    public void Dispose() => _pub.Updated -= OnUpdate;
}`,
    explanation: "An event subscription keeps the subscriber alive as long as the publisher lives; always unsubscribe in `Dispose` to prevent memory and logic leaks.",
  },
  {
    id: "cs-b17-b5-caveats-interface-equals",
    language: "csharp",
    title: "Struct equality via interface loses value semantics",
    tag: "caveats",
    code: `struct Point { public int X, Y; }

Point a = new Point { X=1, Y=2 };
Point b = new Point { X=1, Y=2 };

Console.WriteLine(a.Equals(b));      // True — value equality
object boxedA = a;
object boxedB = b;
Console.WriteLine(boxedA.Equals(boxedB));  // True
Console.WriteLine(ReferenceEquals(boxedA, boxedB));  // False — different boxes`,
    explanation: "Structs have value equality by default but boxing them into `object` or an interface creates separate heap objects; `ReferenceEquals` on boxed structs is always `false`.",
  },
  {
    id: "cs-b17-b5-caveats-null-vs-empty",
    language: "csharp",
    title: "Prefer returning empty collections over null",
    tag: "caveats",
    code: `// BAD: caller must null-check
IEnumerable<int>? BadSearch(int[] data, int target) =>
    data.Contains(target) ? data.Where(x => x == target) : null;

// GOOD: always safe to iterate
IEnumerable<int> GoodSearch(int[] data, int target) =>
    data.Where(x => x == target);

foreach (var x in GoodSearch(new[]{1,2,3}, 5))
    Console.WriteLine(x);  // no crash on empty result`,
    explanation: "Returning an empty collection instead of `null` follows the Null Object pattern; callers can always foreach, LINQ, or `.Count()` without a null check.",
  },
  {
    id: "cs-b17-b5-structures-memory",
    language: "csharp",
    title: "Memory<T> as a heap-compatible Span",
    tag: "structures",
    code: `async Task ProcessAsync(Memory<byte> buffer)
{
    await Task.Yield();  // Span can't cross await — Memory can
    for (int i = 0; i < buffer.Length; i++)
        buffer.Span[i] ^= 0xFF;
}

byte[] data = { 1, 2, 3 };
await ProcessAsync(data.AsMemory());
Console.WriteLine(string.Join(",", data));  // 254,253,252`,
    explanation: "`Memory<T>` is the heap-safe sibling of `Span<T>`; unlike `Span`, it can be stored in fields and passed across `await` boundaries, with `.Span` for synchronous access.",
  },
  {
    id: "cs-b17-b5-structures-frozen-dict",
    language: "csharp",
    title: "FrozenDictionary for read-only lookup performance",
    tag: "structures",
    code: `using System.Collections.Frozen;

var codes = new Dictionary<string, int>
{
    ["OK"]    = 200,
    ["NotFound"] = 404,
    ["Error"] = 500,
};

FrozenDictionary<string, int> frozen = codes.ToFrozenDictionary();
Console.WriteLine(frozen["OK"]);  // 200
// frozen is optimised for read-only access with lower lookup overhead`,
    explanation: "`FrozenDictionary` (.NET 8+) is an immutable, read-only dictionary that uses a perfect-hash-based layout for faster lookups than `Dictionary<T,T>` on repeated reads.",
  },
  {
    id: "cs-b17-b5-structures-arraypool",
    language: "csharp",
    title: "ArrayPool<T> for renting temporary arrays",
    tag: "structures",
    code: `using System.Buffers;

byte[] buffer = ArrayPool<byte>.Shared.Rent(1024);
try
{
    // use buffer — may be larger than requested
    new Random().NextBytes(buffer.AsSpan(..1024));
    Console.WriteLine(buffer[0]);
}
finally
{
    ArrayPool<byte>.Shared.Return(buffer, clearArray: true);
}`,
    explanation: "`ArrayPool<T>.Shared.Rent(n)` returns an array of at least n elements from a shared pool; `Return` puts it back for reuse, dramatically reducing GC pressure for short-lived buffers.",
  },
  {
    id: "cs-b17-b5-classes-fluent-builder",
    language: "csharp",
    title: "Fluent builder with method chaining",
    tag: "classes",
    code: `class QueryBuilder
{
    private string _table = "";
    private readonly List<string> _wheres = new();
    private int? _limit;

    public QueryBuilder From(string table)  { _table = table; return this; }
    public QueryBuilder Where(string cond)  { _wheres.Add(cond); return this; }
    public QueryBuilder Limit(int n)        { _limit = n; return this; }
    public string Build()
    {
        var sql = $"SELECT * FROM {_table}";
        if (_wheres.Any()) sql += " WHERE " + string.Join(" AND ", _wheres);
        if (_limit.HasValue) sql += $" LIMIT {_limit}";
        return sql;
    }
}

var q = new QueryBuilder().From("users").Where("age > 18").Limit(10).Build();
Console.WriteLine(q);`,
    explanation: "The builder pattern accumulates configuration via chained calls that return `this`; `Build()` assembles the final object, separating construction from representation.",
  },
  {
    id: "cs-b17-b5-classes-decorator-pattern",
    language: "csharp",
    title: "Decorator pattern with interface wrapping",
    tag: "classes",
    code: `interface IStorage { void Save(string data); }

class FileStorage : IStorage
    { public void Save(string d) => Console.WriteLine($"file: {d}"); }

class LoggingStorage : IStorage
{
    private readonly IStorage _inner;
    public LoggingStorage(IStorage inner) => _inner = inner;

    public void Save(string d)
    {
        Console.WriteLine($"[LOG] saving {d.Length} bytes");
        _inner.Save(d);
    }
}

IStorage s = new LoggingStorage(new FileStorage());
s.Save("hello world");`,
    explanation: "The decorator wraps another implementation of the same interface, adding behaviour (logging, caching, retry) without modifying the wrapped class.",
  },
  {
    id: "cs-b17-b5-classes-strategy-pattern",
    language: "csharp",
    title: "Strategy pattern with Func delegates",
    tag: "classes",
    code: `class Sorter<T>
{
    private readonly Comparison<T> _strategy;
    public Sorter(Comparison<T> strategy) => _strategy = strategy;
    public List<T> Sort(List<T> items)
    {
        var copy = new List<T>(items);
        copy.Sort(_strategy);
        return copy;
    }
}

var nums = new List<int> { 3, 1, 4, 1, 5, 9 };
var asc  = new Sorter<int>((a, b) =>  a.CompareTo(b)).Sort(nums);
var desc = new Sorter<int>((a, b) => -a.CompareTo(b)).Sort(nums);

Console.WriteLine(string.Join(",", asc));   // 1,1,3,4,5,9
Console.WriteLine(string.Join(",", desc));  // 9,5,4,3,1,1`,
    explanation: "Using a delegate (`Func`/`Comparison<T>`) as the strategy avoids defining a separate interface and class hierarchy for each algorithm variant.",
  },
  {
    id: "cs-b17-b5-classes-observer-event",
    language: "csharp",
    title: "Observer pattern via events",
    tag: "classes",
    code: `class StockTicker
{
    public event EventHandler<decimal>? PriceChanged;
    private decimal _price;

    public void SetPrice(decimal price)
    {
        if (price != _price)
        {
            _price = price;
            PriceChanged?.Invoke(this, price);
        }
    }
}

var ticker = new StockTicker();
ticker.PriceChanged += (_, price) => Console.WriteLine($"Price: {price}");
ticker.SetPrice(100m);
ticker.SetPrice(105m);`,
    explanation: "C# events are multicast delegates with publisher-controlled `add`/`remove` accessors; subscribers register handlers that are called whenever the publisher fires the event.",
  },
  {
    id: "cs-b17-b5-types-covariant-return",
    language: "csharp",
    title: "Covariant return types (C# 9)",
    tag: "types",
    code: `abstract class Animal { public abstract Animal Create(); }

class Dog : Animal
{
    // Return type narrowed from Animal to Dog — covariant return
    public override Dog Create() => new Dog();
}

Dog d = new Dog().Create();  // no cast needed
Console.WriteLine(d.GetType().Name);  // Dog`,
    explanation: "Covariant return types allow an overriding method to return a more derived type than the base declared; the runtime dispatches correctly and callers get the narrow type without casting.",
  },
  {
    id: "cs-b17-b5-types-delegate-contravariance",
    language: "csharp",
    title: "Delegate contravariance for parameter types",
    tag: "types",
    code: `Action<object> handleObject = obj => Console.WriteLine(obj);
Action<string> handleString = handleObject;  // contravariant — safe

handleString("hello");   // object handler accepts string (is-a object)`,
    explanation: "A delegate accepting `object` can be stored as one accepting `string` (contravariance); any call to `handleString` passes a string, which is always a valid `object`.",
  },
  {
    id: "cs-b17-b5-types-tuple-name-inference",
    language: "csharp",
    title: "Tuple element name inference",
    tag: "types",
    code: `string name = "Alice";
int age = 30;

// Names inferred from variable names
var person = (name, age);
Console.WriteLine(person.name);   // Alice
Console.WriteLine(person.age);    // 30

// Also works with member access:
var p = (name.Length, name.ToUpper());
Console.WriteLine(p.Length);      // 5`,
    explanation: "C# 7.1+ infers tuple element names from the variable or member expression used to initialize them — no need to repeat `(name: name, age: age)`.",
  },
  {
    id: "cs-b17-b5-types-span-readonly",
    language: "csharp",
    title: "ReadOnlySpan<T> prevents mutation of spans",
    tag: "types",
    code: `static void Print(ReadOnlySpan<char> text)
{
    Console.WriteLine(text.Length);
    Console.WriteLine(text[0]);
    // text[0] = 'X';  // CS8331: cannot assign to ReadOnlySpan element
}

string s = "hello";
Print(s.AsSpan());
Print(new[] { 'w', 'o', 'r', 'l', 'd' });`,
    explanation: "`ReadOnlySpan<T>` disallows element mutation; use it for input parameters that should not be modified, providing clear API intent and enabling compiler enforcement.",
  },
  {
    id: "cs-b17-b5-snippet-nameof",
    language: "csharp",
    title: "nameof for refactoring-safe symbol names",
    tag: "snippet",
    code: `class Person
{
    private string _name = "";
    public string Name
    {
        get => _name;
        set => _name = value ?? throw new ArgumentNullException(nameof(value));
    }
}

void Validate(string param) =>
    throw new ArgumentException($"{nameof(param)} is invalid");`,
    explanation: "`nameof(symbol)` evaluates to the symbol's string name at compile time; it refactors safely (renaming the symbol updates the string) and appears in exception messages.",
  },
  {
    id: "cs-b17-b5-snippet-collection-expression",
    language: "csharp",
    title: "Collection expressions (C# 12)",
    tag: "snippet",
    code: `int[] nums    = [1, 2, 3, 4, 5];
List<string> strs = ["a", "b", "c"];
Span<int> span    = [10, 20, 30];

// Spread operator ..
int[] combined = [..nums, 6, 7];
Console.WriteLine(string.Join(",", combined));  // 1,2,3,4,5,6,7`,
    explanation: "Collection expressions (C# 12) provide a unified `[...]` syntax for arrays, lists, spans, and other collection types; the spread operator `..` embeds another collection inline.",
  },
  {
    id: "cs-b17-b5-snippet-pattern-not",
    language: "csharp",
    title: "not pattern for negation",
    tag: "snippet",
    code: `object? value = null;

if (value is not null)
    Console.WriteLine("has value");

if (value is not string)
    Console.WriteLine("not a string");

string? name = "Alice";
if (name is not null and not "")
    Console.WriteLine($"Name: {name}");`,
    explanation: "`not` negates a pattern; combining `not null` with `and` chains multiple constraints in a readable single-expression check, replacing nested null and type guards.",
  },
  {
    id: "cs-b17-b5-snippet-checked-unchecked",
    language: "csharp",
    title: "checked and unchecked arithmetic contexts",
    tag: "snippet",
    code: `int max = int.MaxValue;
try
{
    checked { int overflow = max + 1; }   // OverflowException
}
catch (OverflowException) { Console.WriteLine("overflow!"); }

unchecked
{
    int wrapped = max + 1;   // wraps silently
    Console.WriteLine(wrapped);   // -2147483648
}`,
    explanation: "`checked` throws `OverflowException` on integer overflow; `unchecked` wraps silently (the default). Use `checked` in financial calculations where silent wrap is a bug.",
  },
  {
    id: "cs-b17-b5-snippet-convert-trycatch",
    language: "csharp",
    title: "int.TryParse for safe string-to-int conversion",
    tag: "snippet",
    code: `string[] inputs = { "42", "abc", "99", "" };
foreach (var s in inputs)
{
    if (int.TryParse(s, out int value))
        Console.WriteLine($"parsed: {value}");
    else
        Console.WriteLine($"invalid: '{s}'");
}`,
    explanation: "`TryParse` returns `false` for unparseable strings and avoids exception overhead; it's the preferred pattern for user input that may contain non-numeric data.",
  },
  {
    id: "cs-b17-b5-snippet-params-span",
    language: "csharp",
    title: "params with Span<T> (C# 13)",
    tag: "snippet",
    code: `int Sum(params ReadOnlySpan<int> values)
{
    int total = 0;
    foreach (var v in values)
        total += v;
    return total;
}

Console.WriteLine(Sum(1, 2, 3));          // 6
Console.WriteLine(Sum([10, 20, 30]));     // 60`,
    explanation: "`params ReadOnlySpan<T>` (C# 13) enables `params`-style calling without array allocation; the compiler passes a stack-allocated span, reducing GC pressure on variadic call sites.",
  },
  {
    id: "cs-b17-b5-snippet-partial-class",
    language: "csharp",
    title: "partial class for code-gen separation",
    tag: "snippet",
    code: `// Designer.cs — generated code
partial class Form
{
    private Button _btn = new Button();
    private void InitializeComponent() { /* layout */ }
}

// Form.cs — hand-written code
partial class Form
{
    public void Show() { InitializeComponent(); Console.WriteLine("showing"); }
}`,
    explanation: "`partial class` splits a single class across multiple files, keeping generated code (designers, source generators) separate from human-authored business logic.",
  },
  {
    id: "cs-b17-b5-snippet-dynamic",
    language: "csharp",
    title: "dynamic bypasses compile-time type checking",
    tag: "snippet",
    code: `dynamic obj = "hello";
Console.WriteLine(obj.Length);   // 5 — resolved at runtime

obj = 42;
Console.WriteLine(obj + 8);     // 50

// RuntimeBinderException if method doesn't exist:
try { Console.WriteLine(obj.ToUpper()); }
catch (Exception e) { Console.WriteLine(e.Message); }`,
    explanation: "`dynamic` defers member resolution to the DLR at runtime; useful for interop with COM, reflection-heavy code, or JSON parsing, but removes compile-time safety.",
  },
  {
    id: "cs-b17-b5-snippet-interlock",
    language: "csharp",
    title: "Interlocked for lock-free atomic operations",
    tag: "snippet",
    code: `int counter = 0;
Parallel.For(0, 100_000, _ =>
{
    Interlocked.Increment(ref counter);
});
Console.WriteLine(counter);   // always 100000`,
    explanation: "`Interlocked.Increment/Decrement/Add/Exchange/CompareExchange` perform atomic operations using CPU instructions, achieving thread safety without lock overhead.",
  },
  {
    id: "cs-b17-b5-families-dependency-injection",
    language: "csharp",
    title: "Built-in DI container setup",
    tag: "families",
    code: `using Microsoft.Extensions.DependencyInjection;

var services = new ServiceCollection();
services.AddSingleton<ILogger, ConsoleLogger>();
services.AddTransient<IOrderService, OrderService>();

var provider = services.BuildServiceProvider();
var orderSvc = provider.GetRequiredService<IOrderService>();

interface ILogger { void Log(string msg); }
class ConsoleLogger : ILogger { public void Log(string msg) => Console.WriteLine(msg); }
interface IOrderService { }
class OrderService(ILogger logger) : IOrderService { }`,
    explanation: "The `Microsoft.Extensions.DependencyInjection` container resolves object graphs automatically; `AddSingleton` keeps one instance, `AddTransient` creates a new one per request.",
  },
  {
    id: "cs-b17-b5-families-options-pattern",
    language: "csharp",
    title: "IOptions<T> pattern for configuration binding",
    tag: "families",
    code: `using Microsoft.Extensions.Options;

class MailSettings { public string Host { get; set; } = ""; public int Port { get; set; } = 25; }

class MailSender(IOptions<MailSettings> options)
{
    private readonly MailSettings _settings = options.Value;
    public void Send(string to) => Console.WriteLine($"send via {_settings.Host}:{_settings.Port} to {to}");
}

// Registration (typically in Program.cs):
// services.Configure<MailSettings>(config.GetSection("Mail"));
// services.AddTransient<MailSender>();`,
    explanation: "`IOptions<T>` injects typed configuration objects; the framework binds JSON/environment configuration sections to the settings class automatically at startup.",
  },
  {
    id: "cs-b17-b5-families-mediatr",
    language: "csharp",
    title: "MediatR request/handler pattern",
    tag: "families",
    code: `using MediatR;

record GetUserQuery(int Id) : IRequest<string>;

class GetUserHandler : IRequestHandler<GetUserQuery, string>
{
    public Task<string> Handle(GetUserQuery q, CancellationToken ct)
        => Task.FromResult($"User-{q.Id}");
}

// Usage: var name = await mediator.Send(new GetUserQuery(42));`,
    explanation: "MediatR routes requests to their handlers by type; decoupling the sender from the handler enables CQRS patterns, decorators (logging, validation), and easier unit testing.",
  },
  {
    id: "cs-b17-b5-families-polly-retry",
    language: "csharp",
    title: "Polly retry policy for transient faults",
    tag: "families",
    code: `using Polly;

var policy = Policy
    .Handle<HttpRequestException>()
    .WaitAndRetryAsync(
        3,
        attempt => TimeSpan.FromSeconds(Math.Pow(2, attempt)),
        (ex, t) => Console.WriteLine($"retry after {t.TotalSeconds}s"));

await policy.ExecuteAsync(async () =>
{
    // call that may transiently fail
    await Task.Delay(10);
});`,
    explanation: "Polly's `WaitAndRetryAsync` retries on specified exceptions with configurable delays (here: exponential backoff); the delegate receives each exception and wait time.",
  },
  {
    id: "cs-b17-b5-snippet-math-clamp",
    language: "csharp",
    title: "Math.Clamp to bound a value",
    tag: "snippet",
    code: `int Clamp(int value, int min, int max) => Math.Clamp(value, min, max);

Console.WriteLine(Clamp(-5, 0, 100));   // 0
Console.WriteLine(Clamp(50, 0, 100));   // 50
Console.WriteLine(Clamp(150, 0, 100));  // 100

double brightness = Math.Clamp(1.5, 0.0, 1.0);
Console.WriteLine(brightness);  // 1`,
    explanation: "`Math.Clamp(value, min, max)` returns `value` if it's within range, `min` if below, or `max` if above — a one-liner replacement for `Math.Min(max, Math.Max(min, value))`.",
  },
  {
    id: "cs-b17-b5-snippet-enumerable-prepend-append",
    language: "csharp",
    title: "LINQ Prepend and Append",
    tag: "snippet",
    code: `var items = new[] { 2, 3, 4 };
var result = items.Prepend(1).Append(5);
Console.WriteLine(string.Join(",", result));  // 1,2,3,4,5`,
    explanation: "`Prepend` and `Append` add single elements to the start/end of a sequence lazily without allocating a new array, useful for wrapping sequences with sentinel values.",
  },
  {
    id: "cs-b17-b5-snippet-debugger-display",
    language: "csharp",
    title: "[DebuggerDisplay] for readable debugger views",
    tag: "snippet",
    code: `using System.Diagnostics;

[DebuggerDisplay("{Name} (id={Id})")]
class User
{
    public int    Id   { get; set; }
    public string Name { get; set; } = "";
}

// In the debugger hover/watch: shows "Alice (id=1)"
// instead of the default {YourNamespace.User}
var u = new User { Id = 1, Name = "Alice" };`,
    explanation: "`[DebuggerDisplay]` customises how the type appears in the Visual Studio debugger; the string is an expression evaluated against the instance, improving debugging speed.",
  },
];
