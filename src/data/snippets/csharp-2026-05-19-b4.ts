import { Snippet } from "./types";

export const csharpSnippets20260519B4: Snippet[] = [
  {
    id: "cs-0519-b4-span-stackalloc-string",
    language: "csharp",
    title: "Span<char> from stackalloc for string building",
    tag: "snippet",
    code: `Span<char> buf = stackalloc char[64];
int pos = 0;
"Hello".AsSpan().CopyTo(buf.Slice(pos));
pos += 5;
buf[pos++] = ',';
" World".AsSpan().CopyTo(buf.Slice(pos));
pos += 6;
string result = new string(buf.Slice(0, pos));
Console.WriteLine(result); // Hello, World`,
    explanation: "stackalloc on Span<char> builds strings without heap allocation. CopyTo copies spans in-place; final `new string(span)` converts to managed string only at the end.",
  },
  {
    id: "cs-0519-b4-record-positional-derived",
    language: "csharp",
    title: "Derived positional record with additional property",
    tag: "snippet",
    code: `record Point(int X, int Y);
record Point3D(int X, int Y, int Z) : Point(X, Y);

var p = new Point3D(1, 2, 3);
var p2 = p with { Z = 10 };
Console.WriteLine(p2);       // Point3D { X = 1, Y = 2, Z = 10 }
Console.WriteLine(p2 is Point); // True`,
    explanation: "Derived records inherit the base positional properties. `with` copies all properties including inherited ones. The derived type satisfies the base type via normal inheritance.",
  },
  {
    id: "cs-0519-b4-interface-static-abstract",
    language: "csharp",
    title: "Static abstract members in interfaces (generic math)",
    tag: "snippet",
    code: `interface IFactory<T> where T : IFactory<T>
{
    static abstract T Create(int seed);
}
class Foo : IFactory<Foo>
{
    public int Value;
    public static Foo Create(int seed) => new Foo { Value = seed * 2 };
}
static T Make<T>(int s) where T : IFactory<T> => T.Create(s);
Console.WriteLine(Make<Foo>(5).Value); // 10`,
    explanation: "Static abstract interface members allow generic algorithms that call static methods on type parameters. The constraint `where T : IFactory<T>` is the curiously recurring template pattern in C#.",
  },
  {
    id: "cs-0519-b4-collection-expr-spread",
    language: "csharp",
    title: "Collection expressions with spread element",
    tag: "snippet",
    code: `int[] a = [1, 2, 3];
int[] b = [4, 5, 6];
int[] c = [..a, ..b, 7];     // spread with extra element
List<int> list = [..a, 10];  // target-typed to List<int>
Span<int> span = [..a];      // target-typed to Span<int>
Console.WriteLine(c.Length); // 7`,
    explanation: "C# 12 collection expressions allow `..` spread syntax to inline one collection into another. The compiler selects the builder pattern based on the target type, enabling zero-copy for Span.",
  },
  {
    id: "cs-0519-b4-primary-ctor-service",
    language: "csharp",
    title: "Primary constructor for dependency injection",
    tag: "snippet",
    code: `class OrderService(IOrderRepo repo, ILogger<OrderService> logger)
{
    public async Task<Order?> GetAsync(int id)
    {
        logger.LogInformation("Fetching {Id}", id);
        return await repo.FindAsync(id);
    }
}`,
    explanation: "C# 12 primary constructors capture parameters as fields automatically. DI containers inject via the generated constructor. This removes the boilerplate field + assignment pattern.",
  },
  {
    id: "cs-0519-b4-frozen-set",
    language: "csharp",
    title: "FrozenSet<T> for constant lookup tables",
    tag: "snippet",
    code: `using System.Collections.Frozen;

FrozenSet<string> keywords = new[]
{
    "if", "else", "while", "for", "return"
}.ToFrozenSet(StringComparer.Ordinal);

bool isKeyword = keywords.Contains("while"); // True
// FrozenSet optimizes for read-only, no locking needed`,
    explanation: "FrozenSet and FrozenDictionary (.NET 8) are immutable collections optimized for repeated lookups. They compute a perfect hash at creation time for O(1) Contains with no allocation.",
  },
  {
    id: "cs-0519-b4-discriminated-union-records",
    language: "csharp",
    title: "Discriminated union via sealed record hierarchy",
    tag: "snippet",
    code: `abstract record Shape;
sealed record Circle(double Radius) : Shape;
sealed record Rectangle(double W, double H) : Shape;

double Area(Shape s) => s switch
{
    Circle c    => Math.PI * c.Radius * c.Radius,
    Rectangle r => r.W * r.H,
    _           => throw new UnreachableException()
};
Console.WriteLine(Area(new Circle(3)));`,
    explanation: "Sealed records with a shared abstract base simulate discriminated unions. Switch expressions with pattern matching give exhaustive dispatch; `UnreachableException` documents the invariant.",
  },
  {
    id: "cs-0519-b4-iasync-enumerable-producer",
    language: "csharp",
    title: "IAsyncEnumerable<T> producer with cancellation",
    tag: "snippet",
    code: `async IAsyncEnumerable<int> CountAsync(
    [EnumeratorCancellation] CancellationToken ct = default)
{
    for (int i = 0; i < 100; i++)
    {
        await Task.Delay(10, ct);
        yield return i;
    }
}
await foreach (var n in CountAsync().WithCancellation(cts.Token))
    Console.WriteLine(n);`,
    explanation: "[EnumeratorCancellation] links the CancellationToken passed to WithCancellation into the iterator body. Without it, the token from WithCancellation is ignored by the generator.",
  },
  {
    id: "cs-0519-b4-memory-pool-rental",
    language: "csharp",
    title: "MemoryPool<T> for reusable buffer rental",
    tag: "snippet",
    code: `using var owner = MemoryPool<byte>.Shared.Rent(256);
Memory<byte> mem = owner.Memory.Slice(0, 256);
Span<byte> span = mem.Span;
span.Fill(0xAB);
int count = span.Count(b => b == 0xAB);
Console.WriteLine(count); // 256
// owner disposed → buffer returned to pool`,
    explanation: "MemoryPool.Rent returns an IMemoryOwner<T>; disposing it returns the buffer to the pool. Always slice to the exact length needed — rented buffers may be larger than requested.",
  },
  {
    id: "cs-0519-b4-channel-producer-consumer",
    language: "csharp",
    title: "Channel<T> bounded producer-consumer",
    tag: "snippet",
    code: `var ch = Channel.CreateBounded<int>(capacity: 10);
var producer = Task.Run(async () =>
{
    for (int i = 0; i < 20; i++)
        await ch.Writer.WriteAsync(i);
    ch.Writer.Complete();
});
await foreach (int item in ch.Reader.ReadAllAsync())
    Console.Write(item + " ");
await producer;`,
    explanation: "Bounded channels apply back-pressure: WriteAsync awaits when the buffer is full. Reader.ReadAllAsync streams items as an IAsyncEnumerable and completes when Complete() is called.",
  },
  {
    id: "cs-0519-b4-generic-constraint-notnull",
    language: "csharp",
    title: "notnull constraint vs class vs struct",
    tag: "snippet",
    code: `static string Serialize<T>(T value) where T : notnull
    => value.ToString()!;

// class: reference types only (nullable ref still satisfies at runtime)
// struct: value types only (never null)
// notnull: both non-nullable ref and value types
// Foo? does NOT satisfy notnull in a nullable-enabled context`,
    explanation: "`notnull` excludes nullable reference and nullable value types in nullable-enabled contexts. It is broader than `class` (includes structs) but narrower than unconstrained T.",
  },
  {
    id: "cs-0519-b4-aggressive-inlining",
    language: "csharp",
    title: "[MethodImpl(AggressiveInlining)] hot path",
    tag: "snippet",
    code: `using System.Runtime.CompilerServices;

[MethodImpl(MethodImplOptions.AggressiveInlining)]
static int Clamp(int v, int lo, int hi)
    => v < lo ? lo : v > hi ? hi : v;

// JIT will inline this at call sites in Release mode.
// Use sparingly — bloating call sites can hurt i-cache.`,
    explanation: "AggressiveInlining is a hint, not a guarantee. It helps eliminate call overhead for hot, tiny methods. Avoid on large methods — the resulting code bloat can reduce cache efficiency.",
  },
  {
    id: "cs-0519-b4-valuetask-caching",
    language: "csharp",
    title: "ValueTask for synchronous fast-path caching",
    tag: "snippet",
    code: `class Cache
{
    private string? _cached;
    public ValueTask<string> GetAsync()
    {
        if (_cached is not null)
            return ValueTask.FromResult(_cached);   // no alloc
        return new ValueTask<string>(FetchAsync());
    }
    private async Task<string> FetchAsync() { await Task.Delay(10); return _cached = "data"; }
}`,
    explanation: "ValueTask avoids heap allocation when the result is available synchronously. Always return `ValueTask.FromResult` for the cached path; delegate to a Task-returning method for the async path.",
  },
  {
    id: "cs-0519-b4-source-generator-partial",
    language: "csharp",
    title: "Source generator with partial class pattern",
    tag: "snippet",
    code: `// User writes:
[AutoNotify]
partial class PersonViewModel
{
    private string _name = "";
}
// Generator emits (in a separate file):
partial class PersonViewModel : INotifyPropertyChanged
{
    public event PropertyChangedEventHandler? PropertyChanged;
    public string Name { get => _name; set { _name = value; PropertyChanged?.Invoke(this, ...); } }
}`,
    explanation: "Source generators extend partial classes at compile time without reflection. The [AutoNotify] attribute triggers the generator; the user sees a complete type with generated boilerplate.",
  },
  {
    id: "cs-0519-b4-readonly-ref-struct",
    language: "csharp",
    title: "readonly ref struct for zero-copy parsing",
    tag: "snippet",
    code: `readonly ref struct CsvLine
{
    private readonly ReadOnlySpan<char> _raw;
    public CsvLine(ReadOnlySpan<char> raw) => _raw = raw;
    public ReadOnlySpan<char> Field(int index)
    {
        int start = 0, count = 0;
        foreach (var range in _raw.Split(','))
        {
            if (count++ == index) return _raw[range];
        }
        return default;
    }
}`,
    explanation: "readonly ref structs can only live on the stack or inside other ref structs. They cannot be boxed, stored in arrays, or used as generic arguments, which is what lets them safely hold Span fields.",
  },
  {
    id: "cs-0519-b4-exception-filter-when",
    language: "csharp",
    title: "Exception filter with when clause",
    tag: "snippet",
    code: `try
{
    await httpClient.GetAsync(url);
}
catch (HttpRequestException ex) when (ex.StatusCode == HttpStatusCode.TooManyRequests)
{
    await Task.Delay(retryDelay);
}
catch (HttpRequestException ex) when (ex.StatusCode >= HttpStatusCode.InternalServerError)
{
    logger.LogError(ex, "Server error");
    throw;
}`,
    explanation: "Exception filters evaluate without unwinding the stack — the exception remains active for debugging. Multiple catch clauses with when clauses replace nested if/else inside a single catch.",
  },
  {
    id: "cs-0519-b4-string-split-options",
    language: "csharp",
    title: "string.Split with StringSplitOptions flags",
    tag: "snippet",
    code: `string csv = "a,,b, ,c";
string[] parts1 = csv.Split(',');
// ["a", "", "b", " ", "c"]
string[] parts2 = csv.Split(',',
    StringSplitOptions.RemoveEmptyEntries |
    StringSplitOptions.TrimEntries);
// ["a", "b", "c"]`,
    explanation: "TrimEntries (added in .NET 5) removes leading/trailing whitespace from each token. Combined with RemoveEmptyEntries, it produces clean CSV tokens without a follow-up LINQ Select(s => s.Trim()).",
  },
  {
    id: "cs-0519-b4-iequatable-struct",
    language: "csharp",
    title: "IEquatable<T> on struct to avoid boxing",
    tag: "snippet",
    code: `readonly struct Money : IEquatable<Money>
{
    public decimal Amount { get; init; }
    public string Currency { get; init; }
    public bool Equals(Money other)
        => Amount == other.Amount && Currency == other.Currency;
    public override bool Equals(object? obj)
        => obj is Money m && Equals(m);
    public override int GetHashCode()
        => HashCode.Combine(Amount, Currency);
}`,
    explanation: "Implementing IEquatable<T> on a struct provides a typed Equals that avoids boxing. Always also override object.Equals and GetHashCode to keep them consistent with the typed overload.",
  },
  {
    id: "cs-0519-b4-pattern-list-decon",
    language: "csharp",
    title: "List pattern matching with deconstruction",
    tag: "snippet",
    code: `int[] Classify(int[] nums) => nums switch
{
    []          => [0],
    [var x]     => [x],
    [var x, var y] => [x + y],
    [var head, .. var tail] => [head, ..tail.Select(n => n * 2)]
};
Console.WriteLine(string.Join(",", Classify([3, 4, 5]))); // 3,8,10`,
    explanation: "List patterns match arrays and lists. `..` is a slice pattern capturing remaining elements. Combined with collection expressions, transformations stay purely declarative.",
  },
  {
    id: "cs-0519-b4-lock-statement-contention",
    language: "csharp",
    title: "lock statement and Monitor under the hood",
    tag: "snippet",
    code: `object _lock = new();
int _count = 0;
void Increment()
{
    lock (_lock)   // compiles to Monitor.Enter/Exit with try/finally
    {
        _count++;
    }
}
// Never lock on: this, typeof(T), string literals, or value types.
// Prefer a dedicated private object for clarity.`,
    explanation: "lock(obj) is syntactic sugar for Monitor.Enter/Exit wrapped in try/finally. Locking on `this` or public objects exposes the lock to external code, risking deadlock.",
  },
  {
    id: "cs-0519-b4-interlocked-compareexchange",
    language: "csharp",
    title: "Interlocked.CompareExchange for lock-free updates",
    tag: "snippet",
    code: `int _state = 0; // 0 = idle, 1 = running
bool TryStart()
{
    int old = Interlocked.CompareExchange(ref _state, 1, 0);
    return old == 0; // true if we won the race
}
void Stop() => Interlocked.Exchange(ref _state, 0);`,
    explanation: "CompareExchange atomically sets the value to `value` only if it equals `comparand`, returning the original. It is the building block for most lock-free algorithms (spinlocks, queues, state machines).",
  },
  {
    id: "cs-0519-b4-span-tryformat",
    language: "csharp",
    title: "TryFormat to write into a Span<char> without allocation",
    tag: "snippet",
    code: `Span<char> buf = stackalloc char[64];
if (DateTime.UtcNow.TryFormat(buf, out int written, "yyyy-MM-dd"))
{
    ReadOnlySpan<char> formatted = buf.Slice(0, written);
    Console.WriteLine(new string(formatted));
}`,
    explanation: "TryFormat writes directly into a caller-supplied Span<char>, avoiding string allocation. Most primitive types (int, double, DateTime, Guid) implement ISpanFormattable with TryFormat.",
  },
  {
    id: "cs-0519-b4-awaitable-pattern",
    language: "csharp",
    title: "Custom awaitable via GetAwaiter pattern",
    tag: "snippet",
    code: `struct DelayAwaiter : INotifyCompletion
{
    private readonly int _ms;
    public DelayAwaiter(int ms) => _ms = ms;
    public bool IsCompleted => _ms <= 0;
    public void OnCompleted(Action cont) => Task.Delay(_ms).ContinueWith(_ => cont());
    public void GetResult() { }
}
struct Delay { public DelayAwaiter GetAwaiter() => new(100); }
// await new Delay(); // works without Task`,
    explanation: "The C# `await` keyword works on any type with a GetAwaiter() method returning a type that has IsCompleted, OnCompleted, and GetResult. Task<T> itself uses this same pattern.",
  },
  {
    id: "cs-0519-b4-covariant-return",
    language: "csharp",
    title: "Covariant return types in overrides",
    tag: "snippet",
    code: `class Animal
{
    public virtual Animal Clone() => new Animal();
}
class Dog : Animal
{
    public override Dog Clone() => new Dog(); // C# 9+: covariant return
}
Dog d = new Dog().Clone(); // No cast needed`,
    explanation: "C# 9 allows overriding a method with a more derived return type. The override is still virtual; CLR metadata tracks both the original and derived return type signatures.",
  },
  {
    id: "cs-0519-b4-disposable-ref-struct",
    language: "csharp",
    title: "Disposable ref struct with using",
    tag: "snippet",
    code: `ref struct NativeBuffer
{
    private Span<byte> _span;
    public NativeBuffer(int size) => _span = new byte[size];
    public Span<byte> Span => _span;
    public void Dispose() => _span = default; // release reference
}
using var buf = new NativeBuffer(1024);
buf.Span.Fill(0);`,
    explanation: "ref structs can implement Dispose (without IDisposable, since they can't implement interfaces) and work with `using`. The compiler calls Dispose at end of scope via pattern matching, not interface dispatch.",
  },
  {
    id: "cs-0519-b4-generic-variance-covariant",
    language: "csharp",
    title: "Covariant (out) and contravariant (in) generic parameters",
    tag: "snippet",
    code: `IEnumerable<string> strings = new List<string>();
IEnumerable<object> objects = strings; // covariant: out T

Action<object> writeObj = o => Console.WriteLine(o);
Action<string> writeStr = writeObj;    // contravariant: in T

// out T: can read T, can't write T
// in T: can write T, can't read T`,
    explanation: "Covariance (out) allows assignment to a base type parameter — safe only for producers. Contravariance (in) allows assignment to a derived type parameter — safe only for consumers.",
  },
  {
    id: "cs-0519-b4-nullable-ref-flow",
    language: "csharp",
    title: "Nullable reference type flow analysis",
    tag: "snippet",
    code: `string? MaybeNull() => null;
string s = MaybeNull()!;       // null-forgiving, your responsibility
string? n = MaybeNull();
if (n is not null)
    Console.WriteLine(n.Length); // safe: compiler knows n != null
n?.TrimEnd();                   // null-conditional: no warning`,
    explanation: "The nullable analyzer tracks nullability flow through branches. After `if (n is not null)`, n is promoted to string inside the branch. ! suppresses the warning but does not change runtime behavior.",
  },
  {
    id: "cs-0519-b4-params-span",
    language: "csharp",
    title: "params Span<T> — zero-alloc variadic (C# 13)",
    tag: "snippet",
    code: `static int Sum(params ReadOnlySpan<int> values)
{
    int total = 0;
    foreach (var v in values) total += v;
    return total;
}
int r = Sum(1, 2, 3, 4, 5); // compiler creates span on stack, no array alloc`,
    explanation: "C# 13 allows params on Span/ReadOnlySpan. Call sites with a fixed argument list are stack-allocated by the compiler. This removes the array allocation that params int[] would produce.",
  },
  {
    id: "cs-0519-b4-interceptors-preview",
    language: "csharp",
    title: "Interceptors (preview) for compile-time method replacement",
    tag: "snippet",
    code: `// Interceptors replace a specific call site at compile time.
// Used internally by source generators (e.g. minimal API route generators).
// [InterceptsLocation("Program.cs", line: 10, character: 5)]
// static void MyInterceptor(this MyService svc, int x) { ... }
// The original method body is never called at that site.
// Available in .NET 8+ as experimental/preview feature.`,
    explanation: "Interceptors are a source-generator-only feature that replaces a specific call site with a different static method. Used by ASP.NET Core's request delegate generator to avoid reflection.",
  },
  {
    id: "cs-0519-b4-disposable-async",
    language: "csharp",
    title: "IAsyncDisposable and await using",
    tag: "snippet",
    code: `class AsyncConn : IAsyncDisposable
{
    public async ValueTask DisposeAsync()
    {
        await FlushAsync();
        await CloseAsync();
    }
    private Task FlushAsync() => Task.CompletedTask;
    private Task CloseAsync() => Task.CompletedTask;
}
await using var conn = new AsyncConn();`,
    explanation: "`await using` calls DisposeAsync and awaits the returned ValueTask. Use IAsyncDisposable when cleanup requires I/O (flushing buffers, closing sockets) that must not block the thread.",
  },
  {
    id: "cs-0519-b4-record-custom-equality",
    language: "csharp",
    title: "Record with custom Equals override",
    tag: "snippet",
    code: `record Product(string Name, decimal Price)
{
    public virtual bool Equals(Product? other)
        => other is not null &&
           string.Equals(Name, other.Name, StringComparison.OrdinalIgnoreCase);
    public override int GetHashCode()
        => StringComparer.OrdinalIgnoreCase.GetHashCode(Name);
}
var a = new Product("Widget", 1.99m);
var b = new Product("WIDGET", 2.50m);
Console.WriteLine(a == b); // True — only Name compared`,
    explanation: "Records generate Equals based on all properties. Override virtual Equals(T?) to customize equality semantics. Always keep GetHashCode consistent with Equals to avoid broken collections.",
  },
  {
    id: "cs-0519-b4-linq-group-by-to-dict",
    language: "csharp",
    title: "LINQ GroupBy followed by ToDictionary",
    tag: "snippet",
    code: `var orders = new[] {
    (Id: 1, Cat: "A", Amt: 100m),
    (Id: 2, Cat: "B", Amt: 200m),
    (Id: 3, Cat: "A", Amt: 150m),
};
Dictionary<string, decimal> totals = orders
    .GroupBy(o => o.Cat)
    .ToDictionary(g => g.Key, g => g.Sum(o => o.Amt));
// { "A": 250, "B": 200 }`,
    explanation: "GroupBy produces IGrouping<K,V> sequences. Chaining ToDictionary materializes the groups into a Dictionary where keys are group keys and values are aggregate results.",
  },
  {
    id: "cs-0519-b4-weak-reference-cache",
    language: "csharp",
    title: "WeakReference<T> for a GC-friendly cache",
    tag: "snippet",
    code: `class ImageCache
{
    private readonly Dictionary<string, WeakReference<byte[]>> _cache = new();
    public byte[] Get(string key, Func<string, byte[]> loader)
    {
        if (_cache.TryGetValue(key, out var wr) && wr.TryGetTarget(out var img))
            return img;
        img = loader(key);
        _cache[key] = new WeakReference<byte[]>(img);
        return img;
    }
}`,
    explanation: "WeakReference<T>.TryGetTarget returns false if the GC has collected the target. The cache serves data while memory is available and transparently reloads on eviction.",
  },
  {
    id: "cs-0519-b4-struct-default-zeroed",
    language: "csharp",
    title: "struct default value is zero-initialized",
    tag: "snippet",
    code: `struct Color
{
    public byte R, G, B, A;
    // No parameterless ctor needed — default(Color) zeros all fields.
}
Color[] palette = new Color[256]; // all zero, no ctor calls
var c = default(Color);
Console.WriteLine(c.A); // 0
// In C# 10+ structs may have explicit parameterless ctors, but
// default(T) always produces the zero-initialized value.`,
    explanation: "Value types are always zero-initialized by the CLR. Arrays of structs are filled with zeros, not constructed. In C# 10+, a parameterless struct constructor runs for `new Color()` but NOT for `default(Color)`.",
  },
  {
    id: "cs-0519-b4-enum-flags-bitwise",
    language: "csharp",
    title: "[Flags] enum bitwise composition",
    tag: "snippet",
    code: `[Flags]
enum Permissions { None = 0, Read = 1, Write = 2, Execute = 4 }

var perms = Permissions.Read | Permissions.Write;
bool canRead  = (perms & Permissions.Read) != 0;
bool canExec  = perms.HasFlag(Permissions.Execute); // false
perms |= Permissions.Execute;   // grant
perms &= ~Permissions.Write;    // revoke
Console.WriteLine(perms);       // Read, Execute`,
    explanation: "[Flags] tells ToString to render composite values as comma-separated names. HasFlag is a convenience but slightly slower than bitwise AND. Values must be powers of 2 for correct composition.",
  },
  {
    id: "cs-0519-b4-expression-tree-compile",
    language: "csharp",
    title: "Expression tree compiled to a delegate at runtime",
    tag: "snippet",
    code: `using System.Linq.Expressions;

ParameterExpression x = Expression.Parameter(typeof(int), "x");
Expression body = Expression.Multiply(x, Expression.Constant(2));
var lambda = Expression.Lambda<Func<int, int>>(body, x);
Func<int, int> doubler = lambda.Compile();
Console.WriteLine(doubler(7)); // 14`,
    explanation: "Expression trees represent code as data (an AST). Compile() JIT-compiles the tree into a real delegate. LINQ providers (EF Core) translate expression trees to SQL without executing C# code.",
  },
  {
    id: "cs-0519-b4-lazy-initialization",
    language: "csharp",
    title: "Lazy<T> thread-safe initialization modes",
    tag: "snippet",
    code: `// Thread-safe (default): factory runs at most once across threads
Lazy<Config> safe = new(() => LoadConfig(), LazyThreadSafetyMode.ExecutionAndPublication);

// Publication only: multiple threads may run factory, one result published
Lazy<Config> pub  = new(() => LoadConfig(), LazyThreadSafetyMode.PublicationOnly);

// None: no thread safety — use only on single-threaded paths
Lazy<Config> none = new(() => LoadConfig(), LazyThreadSafetyMode.None);
var value = safe.Value;`,
    explanation: "LazyThreadSafetyMode.ExecutionAndPublication uses a lock; only one thread runs the factory. PublicationOnly allows parallel construction but discards extras — safe only when construction has no side effects.",
  },
  {
    id: "cs-0519-b4-string-intern-performance",
    language: "csharp",
    title: "string.Intern and IsInterned for identity equality",
    tag: "snippet",
    code: `string a = string.Intern(new string(new[] { 'h','i' }));
string b = string.Intern(new string(new[] { 'h','i' }));
Console.WriteLine(ReferenceEquals(a, b)); // True
// string.IsInterned returns null if not already interned (no add)
string? exists = string.IsInterned("hi"); // non-null — literals auto-interned`,
    explanation: "Interned strings share the same reference, enabling reference equality for value equality. Literals are automatically interned. Avoid interning arbitrary user input — the intern table is never GC'd.",
  },
  {
    id: "cs-0519-b4-required-members",
    language: "csharp",
    title: "required members enforce initialization at call site",
    tag: "snippet",
    code: `class Config
{
    public required string Host { get; init; }
    public required int Port { get; init; }
    public string? Username { get; init; }
}
// Compiler error if Host or Port omitted:
var cfg = new Config { Host = "localhost", Port = 5432 };`,
    explanation: "The `required` modifier (C# 11) forces callers to set the member in an object initializer. It is checked at compile time, not runtime, and works with both properties and fields.",
  },
  {
    id: "cs-0519-b4-marshal-sizeof",
    language: "csharp",
    title: "sizeof vs Marshal.SizeOf vs Unsafe.SizeOf",
    tag: "snippet",
    code: `// sizeof: compile-time, unmanaged types only, no padding for marshal
Console.WriteLine(sizeof(int));          // 4
// Marshal.SizeOf: runtime, managed struct → native layout with marshal attributes
// Console.WriteLine(Marshal.SizeOf<MyStruct>());
// Unsafe.SizeOf: runtime, CLR layout including padding, works on any T
// Console.WriteLine(Unsafe.SizeOf<(int, byte)>()); // typically 8`,
    explanation: "sizeof gives the C# layout size for unmanaged types. Marshal.SizeOf gives the native marshaling size (affected by [MarshalAs]). Unsafe.SizeOf gives the CLR's actual in-memory size including padding.",
  },
  {
    id: "cs-0519-b4-task-whenall-exception",
    language: "csharp",
    title: "Task.WhenAll — collecting all exceptions",
    tag: "snippet",
    code: `var tasks = new[] { Task.FromException(new IOException("disk")),
                        Task.FromException(new TimeoutException("net")) };
try
{
    await Task.WhenAll(tasks);
}
catch
{
    foreach (var t in tasks.Where(t => t.IsFaulted))
        Console.WriteLine(t.Exception!.InnerException!.Message);
}`,
    explanation: "WhenAll aggregates exceptions but the awaited result rethrows only the first. Inspect each task's Exception.InnerException after the catch to see all failures.",
  },
  {
    id: "cs-0519-b4-abstract-property",
    language: "csharp",
    title: "Abstract property vs abstract field",
    tag: "snippet",
    code: `abstract class Shape
{
    public abstract double Area { get; }    // OK
    // public abstract double _area;        // Error: fields cannot be abstract
}
class Square(double side) : Shape
{
    public override double Area => side * side;
}
Console.WriteLine(new Square(4).Area); // 16`,
    explanation: "Abstract properties define a contract that derived classes must implement as a property. Fields cannot be abstract — use an auto-property or a backing field in the derived class.",
  },
  {
    id: "cs-0519-b4-overload-resolution-ambiguity",
    language: "csharp",
    title: "Overload resolution with implicit conversions",
    tag: "snippet",
    code: `static void Print(long n) => Console.WriteLine("long");
static void Print(double n) => Console.WriteLine("double");
Print(1);    // long — int→long is better than int→double
Print(1L);   // long
Print(1.0);  // double
// Adding Print(int) would make Print(1) unambiguous via exact match`,
    explanation: "C# picks the most specific applicable overload. Numeric implicit conversions are ranked; int→long is preferred over int→double because long is considered 'closer'. Adding an exact-match overload always wins.",
  },
  {
    id: "cs-0519-b4-tpl-dataflow",
    language: "csharp",
    title: "TPL Dataflow pipeline with TransformBlock",
    tag: "snippet",
    code: `using System.Threading.Tasks.Dataflow;
var parse  = new TransformBlock<string, int>(int.Parse);
var square = new TransformBlock<int, int>(n => n * n);
var print  = new ActionBlock<int>(Console.WriteLine);
parse.LinkTo(square); square.LinkTo(print);
foreach (var s in new[] { "2", "3", "4" }) parse.Post(s);
parse.Complete(); await print.Completion;`,
    explanation: "TPL Dataflow builds declarative pipelines with back-pressure and bounded parallelism. LinkTo connects blocks; Complete propagates downstream. Completion awaits the final block's drain.",
  },
  {
    id: "cs-0519-b4-caller-info-attributes",
    language: "csharp",
    title: "CallerMemberName / CallerFilePath / CallerLineNumber",
    tag: "snippet",
    code: `static void Log(string msg,
    [CallerMemberName] string member = "",
    [CallerFilePath]   string file   = "",
    [CallerLineNumber] int    line   = 0)
{
    Console.WriteLine(\`[\${Path.GetFileName(file)}:{line} {member}] {msg}\`);
}
Log("started"); // [Program.cs:12 Main] started`,
    explanation: "Caller info attributes are filled in by the compiler at the call site, not at runtime. They add zero overhead and eliminate fragile string literals like nameof() for diagnostics.",
  },
  {
    id: "cs-0519-b4-span-sorting",
    language: "csharp",
    title: "Sorting a Span<T> in-place without allocation",
    tag: "snippet",
    code: `Span<int> nums = stackalloc int[] { 5, 3, 1, 4, 2 };
MemoryExtensions.Sort(nums);
foreach (var n in nums) Console.Write(n + " "); // 1 2 3 4 5
// Also: MemoryExtensions.Sort(keys, values) for co-sorted pairs`,
    explanation: "MemoryExtensions.Sort sorts a Span<T> in-place using an introspective sort. No boxing, no allocation. For struct types this avoids the overhead of IComparer dispatch via the generic overload.",
  },
  {
    id: "cs-0519-b4-ordered-dictionary",
    language: "csharp",
    title: "OrderedDictionary<TKey,TValue> (.NET 9) by insertion order",
    tag: "snippet",
    code: `using System.Collections.Generic;
// .NET 9: OrderedDictionary<TKey,TValue> — generic, preserves insertion order
var od = new System.Collections.Generic.OrderedDictionary<string, int>();
od["b"] = 2; od["a"] = 1; od["c"] = 3;
foreach (var kv in od)
    Console.Write(\`\${kv.Key}=\${kv.Value} \`); // b=2 a=1 c=3
// Also: GetAt(index), SetAt, Insert, RemoveAt for index-based access`,
    explanation: "OrderedDictionary<TKey,TValue> (.NET 9) is a generic ordered dictionary preserving insertion order with O(1) lookup by key and O(1) access by index. Fills the gap between Dictionary and List of tuples.",
  },
  {
    id: "cs-0519-b4-global-using",
    language: "csharp",
    title: "global using directives for project-wide imports",
    tag: "snippet",
    code: `// GlobalUsings.cs — one file, project-wide effect
global using System;
global using System.Collections.Generic;
global using System.Linq;
global using System.Threading.Tasks;
// All files in the project gain these usings without repeating them.
// SDK-style projects auto-generate global usings for common namespaces
// when <ImplicitUsings>enable</ImplicitUsings> is set.`,
    explanation: "global using (C# 10) applies a using to every file in the compilation. SDK projects enable implicit usings by default. Centralizing them reduces boilerplate but can obscure where types originate.",
  },
  {
    id: "cs-0519-b4-file-scoped-type",
    language: "csharp",
    title: "file-scoped type visibility modifier (C# 11)",
    tag: "snippet",
    code: `// SomeService.cs
file class Helper // visible only within this source file
{
    public static string Format(int n) => \`value=\${n}\`;
}
class SomeService
{
    public string Process(int n) => Helper.Format(n);
}
// Helper is invisible in all other files — no internal leakage`,
    explanation: "The `file` access modifier restricts a type to the declaring source file. Source generators use it to emit helper types that won't clash with user-defined names in other files.",
  },
];
