import type { Snippet } from "./types";

export const csharpSnippets20260517B4: Snippet[] = [
  {
    id: "cs-b17-b4-linq-zip",
    language: "csharp",
    title: "LINQ Zip to pair two sequences",
    tag: "snippet",
    code: `var names  = new[] { "Alice", "Bob", "Carol" };
var scores = new[] { 90, 85, 92 };

var pairs = names.Zip(scores, (n, s) => $"{n}: {s}");
foreach (var p in pairs)
    Console.WriteLine(p);
// Alice: 90  Bob: 85  Carol: 92`,
    explanation: "`Zip` pairs elements from two sequences positionally into a result; it stops at the shorter sequence with no padding.",
  },
  {
    id: "cs-b17-b4-record-with-expression",
    language: "csharp",
    title: "Record with-expression for non-destructive mutation",
    tag: "snippet",
    code: `record Point(int X, int Y);

var p1 = new Point(1, 2);
var p2 = p1 with { Y = 99 };

Console.WriteLine(p1);  // Point { X = 1, Y = 2 }
Console.WriteLine(p2);  // Point { X = 1, Y = 99 }`,
    explanation: "`with` creates a copy of a record with specified properties changed, leaving all others at their original values — essential for immutable models.",
  },
  {
    id: "cs-b17-b4-span-stackalloc",
    language: "csharp",
    title: "stackalloc with Span<T> for stack allocation",
    tag: "snippet",
    code: `Span<int> buffer = stackalloc int[8];
for (int i = 0; i < buffer.Length; i++)
    buffer[i] = i * i;

foreach (var v in buffer)
    Console.Write(v + " ");
// 0 1 4 9 16 25 36 49`,
    explanation: "`stackalloc` allocates a fixed block on the stack; wrapping it in `Span<T>` makes it safe and expressible without unsafe blocks in modern C#.",
  },
  {
    id: "cs-b17-b4-switch-expression-type",
    language: "csharp",
    title: "Switch expression with type patterns",
    tag: "snippet",
    code: `object shape = new Circle(5.0);

double area = shape switch
{
    Circle  c => Math.PI * c.Radius * c.Radius,
    Rectangle r => r.Width * r.Height,
    _ => throw new ArgumentException("unknown shape"),
};
Console.WriteLine(area);

record Circle(double Radius);
record Rectangle(double Width, double Height);`,
    explanation: "Switch expressions with type patterns dispatch on runtime type and bind the matched object to a variable, replacing `is` + cast chains.",
  },
  {
    id: "cs-b17-b4-nullable-reference-bang",
    language: "csharp",
    title: "Null-forgiving operator ! for NRT warnings",
    tag: "snippet",
    code: `#nullable enable
string? maybeNull = GetValue();

// Suppresses CS8602 when you KNOW it's non-null
string definite = maybeNull!;
Console.WriteLine(definite.Length);

static string? GetValue() => "hello";`,
    explanation: "The `!` null-forgiving operator tells the compiler you know the expression is non-null; it only suppresses the warning and has no runtime effect.",
  },
  {
    id: "cs-b17-b4-list-pattern",
    language: "csharp",
    title: "List patterns for slice and shape matching",
    tag: "snippet",
    code: `int[] data = { 1, 2, 3, 4, 5 };

var message = data switch
{
    []          => "empty",
    [var only]  => $"single: {only}",
    [var first, .., var last] => $"first={first} last={last}",
};
Console.WriteLine(message);  // first=1 last=5`,
    explanation: "List patterns (C# 11) match arrays/lists by element count and position; `..` is a slice pattern that matches zero or more elements.",
  },
  {
    id: "cs-b17-b4-asyncstream",
    language: "csharp",
    title: "async streams with IAsyncEnumerable",
    tag: "snippet",
    code: `async IAsyncEnumerable<int> CountAsync(int to)
{
    for (int i = 1; i <= to; i++)
    {
        await Task.Delay(10);
        yield return i;
    }
}

await foreach (var n in CountAsync(5))
    Console.Write(n + " ");
// 1 2 3 4 5`,
    explanation: "`IAsyncEnumerable<T>` with `yield return` inside an `async` method produces items asynchronously; `await foreach` consumes them one at a time.",
  },
  {
    id: "cs-b17-b4-task-completionsource",
    language: "csharp",
    title: "TaskCompletionSource for manual task control",
    tag: "snippet",
    code: `var tcs = new TaskCompletionSource<string>();

_ = Task.Run(() =>
{
    Task.Delay(100).Wait();
    tcs.SetResult("done!");
});

string result = await tcs.Task;
Console.WriteLine(result);  // done!`,
    explanation: "`TaskCompletionSource` lets you create a `Task` whose completion is controlled externally — bridging callbacks, events, or manual signals into the async/await model.",
  },
  {
    id: "cs-b17-b4-cancellation-token",
    language: "csharp",
    title: "CancellationToken for cooperative cancellation",
    tag: "snippet",
    code: `using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(1));
try
{
    await Task.Delay(5000, cts.Token);
}
catch (OperationCanceledException)
{
    Console.WriteLine("operation cancelled");
}`,
    explanation: "`CancellationTokenSource` triggers cancellation via a token; async methods that accept `CancellationToken` cooperatively observe it and throw `OperationCanceledException`.",
  },
  {
    id: "cs-b17-b4-expression-bodied-members",
    language: "csharp",
    title: "Expression-bodied members shorthand",
    tag: "snippet",
    code: `class Circle
{
    public double Radius { get; }
    public Circle(double r) => Radius = r;

    public double Area        => Math.PI * Radius * Radius;
    public double Circumference => 2 * Math.PI * Radius;
    public override string ToString() => $"Circle(r={Radius})";
}`,
    explanation: "Expression bodies (`=>`) eliminate braces and `return` for single-expression members — constructors, properties, methods, and `ToString` all support this syntax.",
  },
  {
    id: "cs-b17-b4-dictionary-getoradd",
    language: "csharp",
    title: "Dictionary TryGetValue and CollectionsMarshal.GetValueRefOrAddDefault",
    tag: "snippet",
    code: `var freq = new Dictionary<char, int>();
string text = "hello world";

foreach (char c in text)
{
    if (!freq.TryGetValue(c, out int count))
        count = 0;
    freq[c] = count + 1;
}

foreach (var (ch, n) in freq)
    Console.WriteLine($"'{ch}': {n}");`,
    explanation: "`TryGetValue` avoids a double-lookup compared to checking `ContainsKey` and then indexing; it returns false and `default` when the key is absent.",
  },
  {
    id: "cs-b17-b4-linq-groupby-todict",
    language: "csharp",
    title: "LINQ GroupBy then ToDictionary",
    tag: "snippet",
    code: `var words = new[] { "apple", "ant", "banana", "bear", "cherry" };

Dictionary<char, List<string>> grouped = words
    .GroupBy(w => w[0])
    .ToDictionary(g => g.Key, g => g.ToList());

foreach (var (k, v) in grouped)
    Console.WriteLine($"{k}: {string.Join(", ", v)}");`,
    explanation: "`GroupBy` produces groups keyed by the selector; chaining `ToDictionary` materializes them into a dictionary with a list per key.",
  },
  {
    id: "cs-b17-b4-span-parsing",
    language: "csharp",
    title: "Span<char> parsing without allocations",
    tag: "snippet",
    code: `ReadOnlySpan<char> line = "42,hello,3.14";
int comma1 = line.IndexOf(',');
int parsed  = int.Parse(line[..comma1]);

int comma2 = line.IndexOf(',', comma1 + 1);
var word   = line.Slice(comma1 + 1, comma2 - comma1 - 1);

Console.WriteLine(parsed);  // 42
Console.WriteLine(word.ToString());  // hello`,
    explanation: "`ReadOnlySpan<char>` slicing avoids `string.Split` allocations by working directly on the character buffer; `int.Parse` accepts spans natively.",
  },
  {
    id: "cs-b17-b4-generic-constraint-new",
    language: "csharp",
    title: "Generic new() and where constraints combined",
    tag: "snippet",
    code: `T Create<T>() where T : class, new()
    => new T();

T CreateAndInit<T>(Action<T> init) where T : class, new()
{
    var obj = new T();
    init(obj);
    return obj;
}

var list = CreateAndInit<List<int>>(l => l.Add(42));
Console.WriteLine(list[0]);  // 42`,
    explanation: "Combining `class` and `new()` constraints allows instantiation of generic types; `Action<T>` delegates let callers configure the new instance.",
  },
  {
    id: "cs-b17-b4-indexrange",
    language: "csharp",
    title: "Index and Range operators (^, ..)",
    tag: "snippet",
    code: `int[] arr = { 10, 20, 30, 40, 50 };

Console.WriteLine(arr[^1]);        // 50  (last)
Console.WriteLine(arr[^2]);        // 40  (second-to-last)

int[] mid  = arr[1..^1];          // [20, 30, 40]
int[] last2 = arr[^2..];          // [40, 50]
int[] first2 = arr[..2];          // [10, 20]`,
    explanation: "`^n` is 'from the end' index (^1 = last); `a..b` is a range; both work with arrays, spans, and any type that implements the index/range pattern.",
  },
  {
    id: "cs-b17-b4-primary-constructor-record",
    language: "csharp",
    title: "Primary constructors for classes (C# 12)",
    tag: "snippet",
    code: `class Logger(string prefix)
{
    public void Log(string msg) =>
        Console.WriteLine($"[{prefix}] {msg}");
}

class AppService(Logger logger, string name)
{
    public void Run() => logger.Log($"{name} running");
}

new AppService(new Logger("INFO"), "MyApp").Run();`,
    explanation: "Primary constructors (C# 12) capture parameters as fields implicitly, reducing boilerplate for dependency injection while keeping the class mutable.",
  },
  {
    id: "cs-b17-b4-pattern-or-and",
    language: "csharp",
    title: "Logical pattern combinators or, and, not",
    tag: "snippet",
    code: `static string Classify(int n) => n switch
{
    < 0           => "negative",
    0             => "zero",
    > 0 and < 10  => "single digit",
    >= 10 and < 100 => "double digit",
    _             => "large",
};

Console.WriteLine(Classify(-1));  // negative
Console.WriteLine(Classify(7));   // single digit
Console.WriteLine(Classify(42));  // double digit`,
    explanation: "`and`, `or`, and `not` combine patterns logically inside switch expressions, replacing nested ternaries or multiple case guards.",
  },
  {
    id: "cs-b17-b4-string-raw",
    language: "csharp",
    title: "Raw string literals (C# 11)",
    tag: "snippet",
    code: `string json = """
    {
      "name": "Alice",
      "age": 30
    }
    """;

string regex = """\\d{3}-\\d{4}""";
Console.WriteLine(json);`,
    explanation: 'Raw string literals start with `"""` and end with `"""`; no escape sequences are interpreted, making JSON, regex, and XML much more readable.',
  },
  {
    id: "cs-b17-b4-required-members",
    language: "csharp",
    title: "required members enforce init-time assignment",
    tag: "snippet",
    code: `class Person
{
    public required string Name { get; init; }
    public required int Age    { get; init; }
    public string? Email       { get; init; }
}

var p = new Person { Name = "Alice", Age = 30 };
// var q = new Person { Name = "Bob" };  // CS9035: Age required`,
    explanation: "`required` (C# 11) forces object initializers to set the property; the compiler rejects construction that omits any required member.",
  },
  {
    id: "cs-b17-b4-generic-math-inumber",
    language: "csharp",
    title: "Generic math with INumber<T>",
    tag: "snippet",
    code: `using System.Numerics;

T Sum<T>(IEnumerable<T> items) where T : INumber<T>
    => items.Aggregate(T.Zero, (acc, x) => acc + x);

Console.WriteLine(Sum(new[] { 1, 2, 3, 4, 5 }));     // 15
Console.WriteLine(Sum(new[] { 1.1, 2.2, 3.3 }));     // 6.6`,
    explanation: "`INumber<T>` (from `System.Numerics`, .NET 7+) is a generic numeric interface; methods constrained to it work with `int`, `double`, `decimal`, etc. without overloads.",
  },
  {
    id: "cs-b17-b4-objectpool",
    language: "csharp",
    title: "ObjectPool<T> for reusable objects",
    tag: "snippet",
    code: `using Microsoft.Extensions.ObjectPool;

var policy  = new DefaultPooledObjectPolicy<List<int>>();
var pool    = new DefaultObjectPool<List<int>>(policy);

var list = pool.Get();
list.Add(1); list.Add(2);
Console.WriteLine(list.Count);  // 2

list.Clear();
pool.Return(list);   // reuse: Clear() before returning`,
    explanation: "`ObjectPool<T>` reduces GC pressure by reusing expensive-to-create objects; always clear state before returning to the pool.",
  },
  {
    id: "cs-b17-b4-async-dispose",
    language: "csharp",
    title: "IAsyncDisposable and await using",
    tag: "snippet",
    code: `class AsyncResource : IAsyncDisposable
{
    public async ValueTask DisposeAsync()
    {
        await Task.Delay(10);  // async cleanup
        Console.WriteLine("disposed");
    }
}

await using var res = new AsyncResource();
Console.WriteLine("using resource");
// "using resource"
// "disposed"`,
    explanation: "`IAsyncDisposable` is the async counterpart to `IDisposable`; `await using` calls `DisposeAsync` when the block exits, awaiting the async cleanup.",
  },
  {
    id: "cs-b17-b4-linq-chunk",
    language: "csharp",
    title: "LINQ Chunk to split sequence into batches",
    tag: "snippet",
    code: `var items = Enumerable.Range(1, 10);
foreach (var batch in items.Chunk(3))
    Console.WriteLine(string.Join(",", batch));
// 1,2,3
// 4,5,6
// 7,8,9
// 10`,
    explanation: "`Chunk(size)` (.NET 6+) splits a sequence into arrays of at most `size` elements; the last chunk may be smaller than `size`.",
  },
  {
    id: "cs-b17-b4-linq-distinctby",
    language: "csharp",
    title: "LINQ DistinctBy on a key selector",
    tag: "snippet",
    code: `record Person(string Name, int Age);
var people = new[]
{
    new Person("Alice", 30),
    new Person("Bob",   25),
    new Person("Carol", 30),
};

var byAge = people.DistinctBy(p => p.Age);
foreach (var p in byAge) Console.WriteLine(p.Name);
// Alice  Bob`,
    explanation: "`DistinctBy` (.NET 6+) keeps the first occurrence of each distinct key value, replacing the common `GroupBy(...).Select(g => g.First())` pattern.",
  },
  {
    id: "cs-b17-b4-linq-minmaxby",
    language: "csharp",
    title: "LINQ MinBy and MaxBy",
    tag: "snippet",
    code: `var products = new[]
{
    new { Name = "A", Price = 9.99  },
    new { Name = "B", Price = 24.99 },
    new { Name = "C", Price = 4.99  },
};

var cheapest = products.MinBy(p => p.Price);
var priciest = products.MaxBy(p => p.Price);
Console.WriteLine(cheapest!.Name);  // C
Console.WriteLine(priciest!.Name);  // B`,
    explanation: "`MinBy`/`MaxBy` (.NET 6+) return the element with the minimum/maximum key value; prefer them over `OrderBy(...).First()` for clarity and efficiency.",
  },
  {
    id: "cs-b17-b4-record-struct",
    language: "csharp",
    title: "record struct for value-type records",
    tag: "snippet",
    code: `record struct Point(double X, double Y)
{
    public double Distance => Math.Sqrt(X * X + Y * Y);
}

var p = new Point(3, 4);
Console.WriteLine(p.Distance);  // 5

var q = p with { Y = 0 };
Console.WriteLine(q);  // Point { X = 3, Y = 0 }`,
    explanation: "`record struct` (C# 10) combines value-type semantics (stack allocation, copy-on-assign) with record features: `with`, auto-equality, and deconstruction.",
  },
  {
    id: "cs-b17-b4-interpolated-handler",
    language: "csharp",
    title: "Interpolated string handler for performance",
    tag: "snippet",
    code: `using System.Runtime.CompilerServices;

// Library code: custom handler avoids allocation when logging is off
void Log(bool enabled,
    [InterpolatedStringHandlerArgument("enabled")]
    ref DefaultInterpolatedStringHandler handler)
{
    if (enabled) Console.WriteLine(handler.ToStringAndClear());
}

bool verbose = true;
Log(verbose, $"value = {42 * 2}");  // evaluates only if verbose`,
    explanation: "Custom interpolated string handlers (C# 10) let library authors avoid building the interpolated string entirely when the result won't be used.",
  },
  {
    id: "cs-b17-b4-static-abstract-interface",
    language: "csharp",
    title: "static abstract interface members (C# 11)",
    tag: "snippet",
    code: `interface IAddable<T> where T : IAddable<T>
{
    static abstract T operator +(T a, T b);
    static abstract T Zero { get; }
}

T Sum<T>(T[] items) where T : IAddable<T>
    => items.Aggregate(T.Zero, (a, b) => a + b);`,
    explanation: "Static abstract members in interfaces enable generic numeric algorithms that call operators or factory methods on type parameters without boxing.",
  },
  {
    id: "cs-b17-b4-valuetask",
    language: "csharp",
    title: "ValueTask<T> for hot-path async methods",
    tag: "snippet",
    code: `private readonly Dictionary<int, string> _cache = new();

public ValueTask<string> GetAsync(int key)
{
    if (_cache.TryGetValue(key, out var val))
        return ValueTask.FromResult(val);   // no heap alloc

    return new ValueTask<string>(FetchSlowAsync(key));
}

private async Task<string> FetchSlowAsync(int key)
{
    await Task.Delay(100);
    return _cache[key] = $"value-{key}";
}`,
    explanation: "`ValueTask<T>` avoids a heap allocation when the result is already available; use it for methods that complete synchronously in the common case.",
  },
  {
    id: "cs-b17-b4-caller-info-attributes",
    language: "csharp",
    title: "Caller info attributes for diagnostics",
    tag: "snippet",
    code: `using System.Runtime.CompilerServices;

void Assert(bool condition,
    [CallerArgumentExpression("condition")] string? expr = null,
    [CallerMemberName]  string? member = null,
    [CallerLineNumber]  int line = 0)
{
    if (!condition)
        throw new Exception($"Assertion failed: {expr} in {member} at line {line}");
}

Assert(1 + 1 == 3);  // throws with expression text`,
    explanation: "`CallerArgumentExpression` (C# 10) captures the source text of an argument; combined with `CallerMemberName`/`CallerLineNumber`, it enables rich diagnostic messages without reflection.",
  },
  {
    id: "cs-b17-b4-immutable-array",
    language: "csharp",
    title: "ImmutableArray<T> for thread-safe collections",
    tag: "snippet",
    code: `using System.Collections.Immutable;

var builder = ImmutableArray.CreateBuilder<int>();
builder.Add(1); builder.Add(2); builder.Add(3);
ImmutableArray<int> arr = builder.ToImmutable();

// 'arr' can be shared freely; any 'mutation' returns new array
var arr2 = arr.Add(4);
Console.WriteLine(arr.Length);   // 3
Console.WriteLine(arr2.Length);  // 4`,
    explanation: "`ImmutableArray<T>` is a struct wrapping an array that enforces immutability; mutation operations return a new array, making it safe to share across threads.",
  },
  {
    id: "cs-b17-b4-concurrent-dict",
    language: "csharp",
    title: "ConcurrentDictionary for thread-safe maps",
    tag: "snippet",
    code: `using System.Collections.Concurrent;

var counts = new ConcurrentDictionary<string, int>();
Parallel.ForEach(new[] { "a", "b", "a", "c", "b", "a" },
    word => counts.AddOrUpdate(word, 1, (_, n) => n + 1));

foreach (var (k, v) in counts)
    Console.WriteLine($"{k}: {v}");`,
    explanation: "`ConcurrentDictionary.AddOrUpdate` atomically adds or updates a key without external locking, making word-count style operations thread-safe.",
  },
  {
    id: "cs-b17-b4-task-whenall-exception",
    language: "csharp",
    title: "Task.WhenAll and AggregateException",
    tag: "snippet",
    code: `async Task<int> Fail(string msg) { await Task.Yield(); throw new Exception(msg); }

try
{
    await Task.WhenAll(Fail("first"), Fail("second"));
}
catch (Exception ex)
{
    // ex is the first exception; all are in the Task's Exception
    Console.WriteLine(ex.Message);
}`,
    explanation: "`Task.WhenAll` awaited re-throws the first exception; access `task.Exception.InnerExceptions` to see all failures when you need every error.",
  },
  {
    id: "cs-b17-b4-linq-aggregate-seed",
    language: "csharp",
    title: "LINQ Aggregate with seed and result selector",
    tag: "snippet",
    code: `var words = new[] { "hello", "world", "foo" };

var (longest, maxLen) = words.Aggregate(
    seed: (word: "", len: 0),
    func: (acc, w) => w.Length > acc.len ? (w, w.Length) : acc,
    resultSelector: acc => acc);

Console.WriteLine($"{longest} ({maxLen})");  // hello (5)`,
    explanation: "`Aggregate` with a seed and result selector folds a sequence into any accumulator type and optionally transforms the final accumulator.",
  },
  {
    id: "cs-b17-b4-generic-repository",
    language: "csharp",
    title: "Generic repository pattern",
    tag: "snippet",
    code: `interface IRepository<T> where T : class
{
    T? GetById(int id);
    void Add(T entity);
    void Remove(T entity);
}

class InMemoryRepo<T> : IRepository<T> where T : class
{
    private readonly List<T> _store = new();
    public T? GetById(int id) => _store.ElementAtOrDefault(id);
    public void Add(T entity)    => _store.Add(entity);
    public void Remove(T entity) => _store.Remove(entity);
}`,
    explanation: "The generic repository abstracts storage behind a type-safe interface, enabling test doubles and backend swaps without changing consuming code.",
  },
  {
    id: "cs-b17-b4-understanding-value-ref-types",
    language: "csharp",
    title: "Value types vs reference types memory layout",
    tag: "understanding",
    code: `struct Point { public int X, Y; }
class PointRef { public int X, Y; }

Point  sv = new Point   { X = 1, Y = 2 };
Point  sv2 = sv;   // full copy
sv2.X = 99;
Console.WriteLine(sv.X);   // 1  — independent

PointRef rv  = new PointRef { X = 1, Y = 2 };
PointRef rv2 = rv;   // reference copy
rv2.X = 99;
Console.WriteLine(rv.X);   // 99 — same object`,
    explanation: "Value types are stored inline and copied on assignment; reference types store a pointer to the heap — assignment copies the reference, not the data.",
  },
  {
    id: "cs-b17-b4-understanding-boxing",
    language: "csharp",
    title: "Boxing and unboxing value types",
    tag: "understanding",
    code: `int x = 42;
object boxed = x;        // boxing: copies int to heap wrapper
int y = (int)boxed;      // unboxing: copies heap value back

// Boxing happens implicitly in many places:
var list = new System.Collections.ArrayList();
list.Add(42);   // boxes the int`,
    explanation: "Boxing wraps a value type in a heap-allocated object, adding indirection and GC pressure; prefer generics (`List<int>`) to avoid implicit boxing in hot paths.",
  },
  {
    id: "cs-b17-b4-understanding-delegate-multicast",
    language: "csharp",
    title: "Multicast delegates chain invocations",
    tag: "understanding",
    code: `Action<string> greet = s => Console.WriteLine($"Hello, {s}!");
greet += s => Console.WriteLine($"Hola, {s}!");
greet += s => Console.WriteLine($"Bonjour, {s}!");

greet("World");
// Hello, World!
// Hola, World!
// Bonjour, World!`,
    explanation: "Delegates are multicast by default; `+=` adds another handler to the invocation list, and all are called in order when the delegate is invoked.",
  },
  {
    id: "cs-b17-b4-understanding-covariance",
    language: "csharp",
    title: "Covariance and contravariance in generics",
    tag: "understanding",
    code: `IEnumerable<string> strings = new List<string> { "a" };
IEnumerable<object> objects = strings;  // covariance (out T)

Action<object> actObj = obj => Console.WriteLine(obj);
Action<string> actStr = actObj;         // contravariance (in T)
actStr("hello");`,
    explanation: "`out T` (covariant) allows a narrower type to be used where a wider is expected; `in T` (contravariant) allows a wider type where a narrower is expected.",
  },
  {
    id: "cs-b17-b4-understanding-finalize-dispose",
    language: "csharp",
    title: "Dispose vs Finalize (destructor)",
    tag: "understanding",
    code: `class Resource : IDisposable
{
    private bool _disposed;

    public void Dispose()
    {
        if (_disposed) return;
        _disposed = true;
        // free unmanaged resources
        GC.SuppressFinalize(this);  // don't run finalizer
    }

    ~Resource()   // fallback: only runs if Dispose wasn't called
    {
        Dispose();
    }
}`,
    explanation: "`Dispose` is deterministic cleanup; the finalizer (`~Resource`) is a non-deterministic GC fallback. `GC.SuppressFinalize` avoids the overhead when `Dispose` already ran.",
  },
  {
    id: "cs-b17-b4-understanding-linq-deferred",
    language: "csharp",
    title: "LINQ queries are deferred (lazy) by default",
    tag: "understanding",
    code: `var numbers = new List<int> { 1, 2, 3 };
var query = numbers.Where(n => n > 1);  // no execution yet

numbers.Add(4);   // adding BEFORE iteration

foreach (var n in query)
    Console.Write(n + " ");
// 2 3 4  — 4 is included because query ran after add`,
    explanation: "Most LINQ operators are lazy; the query iterates the source only when enumerated. `ToList()`, `ToArray()`, `Count()`, etc. force immediate execution.",
  },
  {
    id: "cs-b17-b4-understanding-string-immutable",
    language: "csharp",
    title: "String is immutable; StringBuilder for concatenation",
    tag: "understanding",
    code: `// Inefficient — creates a new string on every +=
string s = "";
for (int i = 0; i < 1000; i++) s += i.ToString();

// Efficient — amortized O(1) appends
var sb = new System.Text.StringBuilder();
for (int i = 0; i < 1000; i++) sb.Append(i);
string result = sb.ToString();`,
    explanation: "Each `string +=` in a loop allocates a new string; `StringBuilder` uses an internal buffer that doubles on overflow, making it O(n) vs O(n²) for repeated concatenation.",
  },
  {
    id: "cs-b17-b4-structures-sorted-set",
    language: "csharp",
    title: "SortedSet<T> for ordered unique elements",
    tag: "structures",
    code: `var ss = new SortedSet<int> { 5, 3, 1, 4, 2, 3 };
Console.WriteLine(string.Join(",", ss));  // 1,2,3,4,5  (unique, sorted)

var view = ss.GetViewBetween(2, 4);
Console.WriteLine(string.Join(",", view));  // 2,3,4

Console.WriteLine(ss.Min, ss.Max);   // 1 5`,
    explanation: "`SortedSet<T>` maintains a balanced BST; `GetViewBetween` returns a live view of elements in the range without copying.",
  },
  {
    id: "cs-b17-b4-structures-linked-list",
    language: "csharp",
    title: "LinkedList<T> for O(1) insertion at any node",
    tag: "structures",
    code: `var ll = new LinkedList<int>(new[] { 1, 2, 4, 5 });
var node3 = ll.Find(2)!;
ll.AddAfter(node3, 3);   // insert 3 after 2

Console.WriteLine(string.Join(",", ll));  // 1,2,3,4,5`,
    explanation: "`LinkedList<T>` stores `LinkedListNode<T>` references; holding a node allows O(1) insertion or removal at that position, unlike `List<T>` which shifts elements.",
  },
  {
    id: "cs-b17-b4-structures-stack-queue",
    language: "csharp",
    title: "Stack<T> and Queue<T> for LIFO/FIFO",
    tag: "structures",
    code: `var stack = new Stack<int>(new[] { 1, 2, 3 });
Console.WriteLine(stack.Pop());   // 3  (LIFO)
Console.WriteLine(stack.Peek());  // 2  (does not remove)

var queue = new Queue<int>(new[] { 1, 2, 3 });
Console.WriteLine(queue.Dequeue());  // 1  (FIFO)
Console.WriteLine(queue.Peek());     // 2`,
    explanation: "`Stack<T>` is LIFO (last in, first out) and `Queue<T>` is FIFO (first in, first out); both expose `Peek` to inspect without removing.",
  },
  {
    id: "cs-b17-b4-structures-priority-queue",
    language: "csharp",
    title: "PriorityQueue<TElement, TPriority>",
    tag: "structures",
    code: `var pq = new PriorityQueue<string, int>();
pq.Enqueue("low",    10);
pq.Enqueue("urgent", 1);
pq.Enqueue("normal", 5);

while (pq.Count > 0)
    Console.WriteLine(pq.Dequeue());
// urgent  normal  low`,
    explanation: "`PriorityQueue<TElement, TPriority>` is a binary min-heap (.NET 6+); elements are dequeued in ascending priority order.",
  },
  {
    id: "cs-b17-b4-caveats-struct-copy",
    language: "csharp",
    title: "Struct mutation through a copy is silently ignored",
    tag: "caveats",
    code: `struct Counter { public int Value; public void Increment() => Value++; }

var list = new List<Counter> { new Counter() };
list[0].Increment();   // mutates a COPY — list[0] unchanged!
Console.WriteLine(list[0].Value);   // 0

// Fix: use a local, mutate, assign back
var c = list[0]; c.Increment(); list[0] = c;
Console.WriteLine(list[0].Value);   // 1`,
    explanation: "Indexing a `List<struct>` returns a copy; mutating it discards the change silently. Use a local variable and write back, or switch to a class.",
  },
  {
    id: "cs-b17-b4-caveats-closure-loop",
    language: "csharp",
    title: "Closures capture loop variable by reference",
    tag: "caveats",
    code: `var funcs = new List<Func<int>>();
for (int i = 0; i < 5; i++)
{
    int captured = i;       // capture a copy
    funcs.Add(() => captured);
}
Console.WriteLine(string.Join(",", funcs.Select(f => f())));
// 0,1,2,3,4

// Without 'captured', all would return 5`,
    explanation: "Lambdas close over variables, not values; in a loop, all closures share the same variable. Introduce a copy inside the loop to snapshot the current value.",
  },
  {
    id: "cs-b17-b4-caveats-interface-explicit",
    language: "csharp",
    title: "Explicit interface implementation hides method from class",
    tag: "caveats",
    code: `interface IPrintable { void Print(); }

class Doc : IPrintable
{
    void IPrintable.Print() => Console.WriteLine("IPrintable.Print");
    public void Print()     => Console.WriteLine("Doc.Print");
}

var d = new Doc();
d.Print();                          // Doc.Print
((IPrintable)d).Print();            // IPrintable.Print`,
    explanation: "Explicit interface implementations are only accessible through the interface type — calling through the class type invokes the public method instead.",
  },
  {
    id: "cs-b17-b4-caveats-null-coalescing-assign",
    language: "csharp",
    title: "??= null-coalescing assignment operator",
    tag: "caveats",
    code: `string? name = null;
name ??= "default";        // assigns only if null
Console.WriteLine(name);   // default

name ??= "other";
Console.WriteLine(name);   // default  (not reassigned)`,
    explanation: "`??=` assigns the right-hand value only if the left-hand variable is `null`, combining a null check and assignment into a single, readable expression.",
  },
  {
    id: "cs-b17-b4-caveats-event-null-check",
    language: "csharp",
    title: "Thread-safe event invocation with ?.Invoke",
    tag: "caveats",
    code: `class Button
{
    public event EventHandler? Clicked;

    public void Click()
    {
        // Thread-safe: copies reference before null check
        Clicked?.Invoke(this, EventArgs.Empty);
    }
}`,
    explanation: "`?.Invoke` copies the delegate reference before testing for null, preventing a race condition where another thread removes the last handler between the null check and invocation.",
  },
  {
    id: "cs-b17-b4-caveats-default-interface-method",
    language: "csharp",
    title: "Default interface methods don't flow to classes",
    tag: "caveats",
    code: `interface IShape { double Area() => 0; }

class Square : IShape
{
    public double Side { get; }
    public Square(double s) => Side = s;
    // Does NOT inherit default Area() into class scope
}

IShape s = new Square(4);
Console.WriteLine(s.Area());   // 0  — default used
// new Square(4).Area();       // CE: Area not on Square`,
    explanation: "Default interface methods are only accessible through the interface reference; the class does not inherit them, so `square.Area()` is a compile error.",
  },
  {
    id: "cs-b17-b4-types-generic-variance",
    language: "csharp",
    title: "Declaring variance on generic interfaces",
    tag: "types",
    code: `interface IProducer<out T> { T Produce(); }
interface IConsumer<in T>  { void Consume(T item); }

class StringProducer : IProducer<string>
    { public string Produce() => "hi"; }

IProducer<object> prod = new StringProducer();  // covariant
Console.WriteLine(prod.Produce());`,
    explanation: "`out T` marks a type parameter covariant (usable where a base type is expected); `in T` marks it contravariant (usable where a derived type is expected).",
  },
  {
    id: "cs-b17-b4-types-nullable-annotations",
    language: "csharp",
    title: "Nullable reference type annotations",
    tag: "types",
    code: `#nullable enable

string  nonNull = "hello";    // cannot be null
string? mayNull = null;       // may be null

void Print(string? s)
{
    Console.WriteLine(s?.Length ?? -1);
}

Print(nonNull);  // 5
Print(mayNull);  // -1`,
    explanation: "With `#nullable enable`, `string` means non-nullable and `string?` means nullable; the compiler warns when you may dereference a nullable without a check.",
  },
  {
    id: "cs-b17-b4-types-tuple-deconstruct",
    language: "csharp",
    title: "Tuple deconstruction and named elements",
    tag: "types",
    code: `(string Name, int Age) GetPerson() => ("Alice", 30);

var (name, age) = GetPerson();
Console.WriteLine($"{name} is {age}");

// Named access
var p = GetPerson();
Console.WriteLine(p.Name, p.Age);`,
    explanation: "Named value tuples (`(string Name, int Age)`) allow member access by name; deconstruction binds elements to local variables in one step.",
  },
  {
    id: "cs-b17-b4-types-where-notnull",
    language: "csharp",
    title: "notnull generic constraint",
    tag: "types",
    code: `T Echo<T>(T value) where T : notnull
{
    Console.WriteLine(value);
    return value;
}

Echo("hello");   // OK
Echo(42);        // OK
// Echo<string?>(null);  // compile warning`,
    explanation: "`notnull` constrains a type parameter to exclude nullable value types and nullable reference types, enabling safe member access without null checks.",
  },
  {
    id: "cs-b17-b4-types-delegate-func-action",
    language: "csharp",
    title: "Func<T,TResult>, Action<T>, and Predicate<T>",
    tag: "types",
    code: `Func<int, int, int>   add  = (a, b) => a + b;
Action<string>         log  = s => Console.WriteLine(s);
Predicate<int>         isEven = n => n % 2 == 0;

Console.WriteLine(add(3, 4));         // 7
log("hello");                          // hello
Console.WriteLine(isEven(6));          // True`,
    explanation: "`Func<..., TResult>` is a delegate with a return type; `Action<...>` returns void; `Predicate<T>` is shorthand for `Func<T, bool>` — they're all delegate types.",
  },
  {
    id: "cs-b17-b4-classes-static-class",
    language: "csharp",
    title: "Static class for utility/extension methods",
    tag: "classes",
    code: `static class StringExtensions
{
    public static string Truncate(this string s, int maxLength)
        => s.Length <= maxLength ? s : s[..maxLength] + "...";

    public static bool IsNullOrEmpty(this string? s)
        => string.IsNullOrEmpty(s);
}

Console.WriteLine("Hello World".Truncate(5));  // Hello...`,
    explanation: "Static classes cannot be instantiated or inherited; their main use is grouping utility functions and extension methods that operate on other types.",
  },
  {
    id: "cs-b17-b4-classes-abstract-class",
    language: "csharp",
    title: "Abstract class with template method pattern",
    tag: "classes",
    code: `abstract class Report
{
    public void Generate()
    {
        FetchData();
        Format();
        Send();
    }
    protected abstract void FetchData();
    protected abstract void Format();
    private void Send() => Console.WriteLine("sending...");
}

class PdfReport : Report
{
    protected override void FetchData() => Console.WriteLine("fetch");
    protected override void Format()    => Console.WriteLine("pdf");
}`,
    explanation: "Abstract classes define the skeleton of an algorithm in a `public` method, delegating extension points to `abstract` methods that subclasses must implement.",
  },
  {
    id: "cs-b17-b4-classes-sealed",
    language: "csharp",
    title: "sealed class prevents inheritance",
    tag: "classes",
    code: `sealed class Singleton
{
    private static readonly Singleton _instance = new();
    private Singleton() { }

    public static Singleton Instance => _instance;
    public void DoWork() => Console.WriteLine("working");
}

// class Derived : Singleton { }  // CS0509: cannot inherit from sealed

Singleton.Instance.DoWork();`,
    explanation: "`sealed` prevents subclassing, allows the JIT to devirtualize calls, and is the standard way to enforce the Singleton pattern at the language level.",
  },
  {
    id: "cs-b17-b4-classes-interface-default-impl",
    language: "csharp",
    title: "Interface default implementation for opt-in extension",
    tag: "classes",
    code: `interface ILogger
{
    void Log(string msg);
    void LogError(string msg) => Log($"[ERROR] {msg}");  // default
}

class ConsoleLogger : ILogger
{
    public void Log(string msg) => Console.WriteLine(msg);
    // LogError is inherited from interface
}

ILogger logger = new ConsoleLogger();
logger.LogError("something went wrong");`,
    explanation: "Default interface methods let library authors add new members without breaking existing implementations; consuming code accesses them through the interface type.",
  },
  {
    id: "cs-b17-b4-classes-nested-class",
    language: "csharp",
    title: "Private nested class for implementation hiding",
    tag: "classes",
    code: `class LinkedList<T>
{
    private class Node
    {
        public T Value;
        public Node? Next;
        public Node(T value) => Value = value;
    }

    private Node? _head;
    public void Push(T val) => _head = new Node(val) { Next = _head };
    public T? Pop() { var v = _head?.Value; _head = _head?.Next; return v; }
}`,
    explanation: "Nesting implementation details as `private` inner classes hides them from API consumers, keeping the public surface clean while still giving the outer class full access.",
  },
  {
    id: "cs-b17-b4-classes-operator-overload",
    language: "csharp",
    title: "Operator overloading",
    tag: "classes",
    code: `record Vector2(double X, double Y)
{
    public static Vector2 operator +(Vector2 a, Vector2 b)
        => new(a.X + b.X, a.Y + b.Y);

    public static Vector2 operator *(Vector2 v, double s)
        => new(v.X * s, v.Y * s);

    public double Magnitude => Math.Sqrt(X * X + Y * Y);
}

var v = new Vector2(3, 4);
Console.WriteLine((v * 2).Magnitude);  // 10`,
    explanation: "Operator overloading lets domain types like vectors and matrices use familiar arithmetic syntax; overload in pairs (`+` and `-`) for consistency.",
  },
  {
    id: "cs-b17-b4-snippet-string-join",
    language: "csharp",
    title: "string.Join and string.Concat",
    tag: "snippet",
    code: `var parts = new[] { "alpha", "beta", "gamma" };
Console.WriteLine(string.Join(", ", parts));   // alpha, beta, gamma
Console.WriteLine(string.Join(' ', parts));    // alpha beta gamma

string csv = string.Join(',', new[] { 1, 2, 3 });
Console.WriteLine(csv);  // 1,2,3`,
    explanation: "`string.Join` inserts a separator between elements; it accepts `char` separators (C# 8+) and any `IEnumerable`, calling `ToString` on each element.",
  },
  {
    id: "cs-b17-b4-snippet-local-function",
    language: "csharp",
    title: "Static local function to avoid closure overhead",
    tag: "snippet",
    code: `int SumSquares(int[] nums)
{
    return nums.Select(Square).Sum();

    static int Square(int x) => x * x;   // static: can't capture locals
}

Console.WriteLine(SumSquares(new[] { 1, 2, 3, 4 }));  // 30`,
    explanation: "`static` local functions cannot capture enclosing variables, preventing accidental closure allocation and making the intent explicit.",
  },
  {
    id: "cs-b17-b4-snippet-init-only-prop",
    language: "csharp",
    title: "init-only properties for immutable initialization",
    tag: "snippet",
    code: `class Point
{
    public int X { get; init; }
    public int Y { get; init; }
}

var p = new Point { X = 1, Y = 2 };
// p.X = 3;  // CS8852: cannot assign to init-only property
Console.WriteLine(p.X);  // 1`,
    explanation: "`init` accessor allows the property to be set in an object initializer but not afterward, giving you immutable-like behavior without needing a record.",
  },
  {
    id: "cs-b17-b4-snippet-pattern-matching-when",
    language: "csharp",
    title: "Pattern matching with when guard",
    tag: "snippet",
    code: `object[] data = { 1, "hello", -5, 3.14, "world" };

foreach (var item in data)
{
    var desc = item switch
    {
        int n when n < 0 => $"negative int: {n}",
        int n            => $"int: {n}",
        string s         => $"string: {s}",
        _                => $"other: {item}",
    };
    Console.WriteLine(desc);
}`,
    explanation: "A `when` clause in a switch expression adds a boolean guard that must be true in addition to the type pattern for the arm to match.",
  },
  {
    id: "cs-b17-b4-snippet-file-readlines",
    language: "csharp",
    title: "File.ReadLines vs File.ReadAllLines",
    tag: "snippet",
    code: `// ReadAllLines: loads everything into memory at once
string[] allLines = File.ReadAllLines("data.txt");

// ReadLines: lazy streaming, uses less memory for large files
foreach (string line in File.ReadLines("data.txt"))
    Console.WriteLine(line);`,
    explanation: "`File.ReadAllLines` returns a `string[]` by loading the whole file; `File.ReadLines` yields lines lazily — prefer it for large files to avoid OOM.",
  },
  {
    id: "cs-b17-b4-snippet-tuple-swap",
    language: "csharp",
    title: "Tuple syntax for variable swap",
    tag: "snippet",
    code: `int a = 1, b = 2;
(a, b) = (b, a);
Console.WriteLine(a, b);   // 2 1

string x = "hello", y = "world";
(x, y) = (y, x);
Console.WriteLine(x);  // world`,
    explanation: "C# tuple deconstruction evaluates the right side first as a unit, making `(a, b) = (b, a)` an allocation-free, single-instruction swap.",
  },
  {
    id: "cs-b17-b4-snippet-linq-take-skip",
    language: "csharp",
    title: "LINQ Skip, Take, and TakeLast for pagination",
    tag: "snippet",
    code: `var items = Enumerable.Range(1, 20);
int page = 2, size = 5;

var page2 = items.Skip((page - 1) * size).Take(size);
Console.WriteLine(string.Join(",", page2));  // 6,7,8,9,10

var last3 = items.TakeLast(3);
Console.WriteLine(string.Join(",", last3));  // 18,19,20`,
    explanation: "`Skip`+`Take` implement offset pagination; `TakeLast` (.NET 6+) efficiently picks the last N elements without enumerating everything first.",
  },
  {
    id: "cs-b17-b4-snippet-async-valuetask",
    language: "csharp",
    title: "Returning completed ValueTask to avoid allocation",
    tag: "snippet",
    code: `private int _cached = -1;

public ValueTask<int> GetValueAsync()
{
    if (_cached >= 0)
        return ValueTask.FromResult(_cached);

    return new ValueTask<int>(ComputeAsync());
}

private async Task<int> ComputeAsync()
{
    await Task.Delay(100);
    return _cached = 42;
}`,
    explanation: "`ValueTask.FromResult` returns a completed `ValueTask` without a heap allocation when the value is already available, reducing GC pressure in hot paths.",
  },
  {
    id: "cs-b17-b4-snippet-conditional-access-chain",
    language: "csharp",
    title: "Null-conditional chaining with ?.",
    tag: "snippet",
    code: `class Order { public Customer? Customer; }
class Customer { public Address? Address; }
class Address { public string? City; }

Order? order = new Order();
string? city = order?.Customer?.Address?.City;
Console.WriteLine(city ?? "unknown");  // unknown`,
    explanation: "`?.` short-circuits the entire chain to `null` at the first `null` dereference, replacing nested null checks with a single readable expression.",
  },
  {
    id: "cs-b17-b4-families-memorycache",
    language: "csharp",
    title: "IMemoryCache for in-process caching",
    tag: "families",
    code: `using Microsoft.Extensions.Caching.Memory;

var cache = new MemoryCache(new MemoryCacheOptions());

if (!cache.TryGetValue("key", out string? value))
{
    value = "expensive result";
    cache.Set("key", value, TimeSpan.FromMinutes(5));
}

Console.WriteLine(value);`,
    explanation: "`IMemoryCache` caches objects in-process with TTL-based expiry; `TryGetValue` + `Set` is the canonical cache-aside pattern.",
  },
  {
    id: "cs-b17-b4-families-httpclient",
    language: "csharp",
    title: "HttpClient with typed deserialization",
    tag: "families",
    code: `using System.Net.Http.Json;

var client = new HttpClient();
var todo = await client.GetFromJsonAsync<Todo>(
    "https://jsonplaceholder.typicode.com/todos/1");

Console.WriteLine(todo?.Title);

record Todo(int Id, string Title, bool Completed);`,
    explanation: "`GetFromJsonAsync<T>` combines an HTTP GET with JSON deserialization in one call using `System.Text.Json`, eliminating boilerplate response-reading code.",
  },
  {
    id: "cs-b17-b4-families-semaphore",
    language: "csharp",
    title: "SemaphoreSlim to limit concurrent tasks",
    tag: "families",
    code: `using var semaphore = new SemaphoreSlim(3);  // max 3 concurrent

var tasks = Enumerable.Range(1, 10).Select(async i =>
{
    await semaphore.WaitAsync();
    try
    {
        await Task.Delay(100);  // simulate work
        Console.WriteLine($"Task {i} done");
    }
    finally { semaphore.Release(); }
});

await Task.WhenAll(tasks);`,
    explanation: "`SemaphoreSlim` limits the number of concurrent async operations; `WaitAsync`/`Release` are the async equivalents of `Wait`/`Release` for use in async methods.",
  },
  {
    id: "cs-b17-b4-families-channel",
    language: "csharp",
    title: "Channel<T> for producer-consumer pipelines",
    tag: "families",
    code: `using System.Threading.Channels;

var ch = Channel.CreateUnbounded<int>();

_ = Task.Run(async () =>
{
    for (int i = 0; i < 5; i++)
        await ch.Writer.WriteAsync(i);
    ch.Writer.Complete();
});

await foreach (var item in ch.Reader.ReadAllAsync())
    Console.WriteLine(item);`,
    explanation: "`Channel<T>` is a thread-safe, async-friendly queue; `WriteAsync`/`ReadAllAsync` integrate naturally with `async`/`await` for producer-consumer pipelines.",
  },
  {
    id: "cs-b17-b4-types-extension-everything",
    language: "csharp",
    title: "Extension members on any type (C# 14 preview)",
    tag: "types",
    code: `// Traditional extension method on string
static class StringExt
{
    public static bool IsPalindrome(this string s)
    {
        var r = new string(s.Reverse().ToArray());
        return s == r;
    }
}

Console.WriteLine("racecar".IsPalindrome());  // True
Console.WriteLine("hello".IsPalindrome());    // False`,
    explanation: "Extension methods extend any type's apparent API without modifying or inheriting from it; they're resolved at compile time based on the `this` parameter type.",
  },
  {
    id: "cs-b17-b4-snippet-hashcode-combine",
    language: "csharp",
    title: "HashCode.Combine for composite hash codes",
    tag: "snippet",
    code: `record struct Point(int X, int Y)
{
    public override int GetHashCode() =>
        HashCode.Combine(X, Y);
}

var p1 = new Point(1, 2);
var p2 = new Point(1, 2);
Console.WriteLine(p1.GetHashCode() == p2.GetHashCode());  // True`,
    explanation: "`HashCode.Combine` mixes multiple values into a well-distributed hash using a proven algorithm, replacing the error-prone manual `XOR * prime` patterns.",
  },
];
