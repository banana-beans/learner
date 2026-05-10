import type { Snippet } from "./types";

export const csharpSnippets20260510B4: Snippet[] = [
  // ── snippet ──────────────────────────────────────────────────────────────
  {
    id: "cs-source-generator-incremental",
    language: "csharp",
    title: "Incremental source generator — IIncrementalGenerator",
    tag: "snippet",
    code: `using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp.Syntax;

[Generator]
public class AutoToStringGenerator : IIncrementalGenerator
{
    public void Initialize(IncrementalGeneratorInitializationContext ctx)
    {
        var records = ctx.SyntaxProvider
            .CreateSyntaxProvider(
                predicate: (node, _) => node is RecordDeclarationSyntax,
                transform:  (ctx, _)  => (RecordDeclarationSyntax)ctx.Node)
            .Collect();

        ctx.RegisterSourceOutput(records, (spc, recs) =>
        {
            foreach (var r in recs)
                spc.AddSource(\$"{r.Identifier}.g.cs", $"// generated for {r.Identifier}");
        });
    }
}`,
    explanation:
      "Incremental generators only re-run the transform when their input changes; this is the preferred pattern over ISourceGenerator because it participates in Roslyn's caching layer for faster builds.",
  },
  {
    id: "cs-span-search",
    language: "csharp",
    title: "Span<char> parsing — IndexOf and TryParse",
    tag: "snippet",
    code: `ReadOnlySpan<char> line = "Alice,30,true";

int i1 = line.IndexOf(',');
var name    = line[..i1];
var rest    = line[(i1 + 1)..];

int i2 = rest.IndexOf(',');
var ageSpan = rest[..i2];
var flagSpan = rest[(i2 + 1)..];

int.TryParse(ageSpan, out int age);
bool.TryParse(flagSpan, out bool flag);

Console.WriteLine(\$"{name} age={age} flag={flag}");
// Alice age=30 flag=True`,
    explanation:
      "ReadOnlySpan<char> slicing avoids heap allocations when parsing delimited text; int.TryParse and bool.TryParse accept spans directly, avoiding intermediate string allocations.",
  },
  {
    id: "cs-binary-primitives",
    language: "csharp",
    title: "BinaryPrimitives — portable endian-aware encoding",
    tag: "snippet",
    code: `using System.Buffers.Binary;

Span<byte> buf = stackalloc byte[4];

// Write big-endian int32:
BinaryPrimitives.WriteInt32BigEndian(buf, 0x01020304);
Console.WriteLine(buf[0]);  // 1

// Read back:
int value = BinaryPrimitives.ReadInt32BigEndian(buf);
Console.WriteLine(value);   // 16909060 == 0x01020304

// Little-endian (x86 native):
BinaryPrimitives.WriteInt32LittleEndian(buf, 12345);
int le = BinaryPrimitives.ReadInt32LittleEndian(buf);`,
    explanation:
      "BinaryPrimitives writes/reads integers in a specified byte order without unsafe code; stackalloc keeps the buffer on the stack; use it for binary protocols and file format parsers.",
  },
  {
    id: "cs-memory-marshal",
    language: "csharp",
    title: "MemoryMarshal — reinterpret memory as different types",
    tag: "snippet",
    code: `using System.Runtime.InteropServices;

float[] floats = { 1.0f, 2.0f, 3.0f };

// Zero-copy reinterpretation as bytes:
ReadOnlySpan<byte> bytes = MemoryMarshal.AsBytes(floats.AsSpan());
Console.WriteLine(bytes.Length);  // 12 (3 floats × 4 bytes)

// Read a struct from raw bytes (must be blittable):
Span<byte> raw = stackalloc byte[] { 0x01, 0x00, 0x00, 0x00 };
ref int n = ref MemoryMarshal.GetReference(
    MemoryMarshal.Cast<byte, int>(raw));
Console.WriteLine(n);  // 1 (little-endian)`,
    explanation:
      "MemoryMarshal provides zero-copy type reinterpretation for blittable types; Cast<TFrom, TTo> and AsBytes avoid allocations in binary serialisation and de-serialisation hot paths.",
  },
  {
    id: "cs-native-memory",
    language: "csharp",
    title: "NativeMemory — allocate unmanaged memory",
    tag: "snippet",
    code: `using System.Runtime.InteropServices;

// Allocate aligned unmanaged memory (no GC pressure):
void* ptr = NativeMemory.AlignedAlloc(1024, alignment: 64);
try
{
    var span = new Span<byte>(ptr, 1024);
    span.Fill(0xFF);
    Console.WriteLine(span[0]);  // 255
}
finally
{
    NativeMemory.AlignedFree(ptr);
}`,
    explanation:
      "NativeMemory (.NET 6+) allocates aligned unmanaged memory outside the GC heap; useful for SIMD buffers that require specific alignment; always free in a finally block.",
  },
  {
    id: "cs-regex-named-groups",
    language: "csharp",
    title: "Regex named groups and Match.Groups",
    tag: "snippet",
    code: `using System.Text.RegularExpressions;

var pattern = new Regex(
    @"(?<year>\\d{4})-(?<month>\\d{2})-(?<day>\\d{2})",
    RegexOptions.Compiled);

var m = pattern.Match("Today is 2026-05-10.");
if (m.Success)
{
    Console.WriteLine(m.Groups["year"].Value);   // 2026
    Console.WriteLine(m.Groups["month"].Value);  // 05
    Console.WriteLine(m.Groups["day"].Value);    // 10
}`,
    explanation:
      "Named groups (?<name>...) make Regex captures self-documenting; access them via Groups[\"name\"].Value; RegexOptions.Compiled trades startup time for faster repeated matching.",
  },
  {
    id: "cs-task-when-any",
    language: "csharp",
    title: "Task.WhenAny — first-to-complete wins",
    tag: "snippet",
    code: `async Task<string> RaceAsync(CancellationToken ct)
{
    var t1 = FetchPrimaryAsync(ct);
    var t2 = FetchFallbackAsync(ct);

    var winner = await Task.WhenAny(t1, t2);
    return await winner;  // unwrap; throws if winner faulted
}

// Timeout pattern:
var work    = DoWorkAsync();
var timeout = Task.Delay(TimeSpan.FromSeconds(5));

if (await Task.WhenAny(work, timeout) == timeout)
    throw new TimeoutException("Work exceeded 5s");

return await work;`,
    explanation:
      "Task.WhenAny returns a Task<Task> — the inner task is the winner; await it again to unwrap the result or propagate exceptions; the timeout pattern avoids WaitForNextTickAsync overhead.",
  },
  {
    id: "cs-record-positional",
    language: "csharp",
    title: "Positional record — deconstruction and pattern matching",
    tag: "snippet",
    code: `record Point(double X, double Y);
record Line(Point Start, Point End);

var line = new Line(new Point(0, 0), new Point(3, 4));

// Deconstruction
var (start, end) = line;
var (x1, y1)     = start;
Console.WriteLine(\$"({x1},{y1})");  // (0,0)

// Nested property pattern
string desc = line switch
{
    { Start: { X: 0, Y: 0 } } => "starts at origin",
    _                          => "elsewhere"
};`,
    explanation:
      "Positional records auto-generate Deconstruct; nested property patterns in switch expressions allow deep structural matching without temporary variables.",
  },
  {
    id: "cs-pattern-relational",
    language: "csharp",
    title: "Relational and logical patterns (C# 9)",
    tag: "snippet",
    code: `static string Classify(int n) => n switch
{
    < 0         => "negative",
    0           => "zero",
    > 0 and < 10 => "small positive",
    >= 10 and <= 100 => "medium",
    _           => "large"
};

static string HttpStatus(int code) => code switch
{
    >= 200 and < 300 => "success",
    >= 300 and < 400 => "redirect",
    >= 400 and < 500 => "client error",
    >= 500           => "server error",
    _                => "unknown"
};`,
    explanation:
      "Relational patterns (<, >, >=, <=) and logical combinators (and, or, not) enable expressive range checks in switch expressions without nested if/else chains.",
  },
  {
    id: "cs-interceptors",
    language: "csharp",
    title: "Interceptors — compile-time method replacement (C# 12)",
    tag: "snippet",
    code: `// Interceptors redirect specific call sites at compile time.
// Requires: <InterceptorsPreviewNamespaces> in csproj

using System.Runtime.CompilerServices;

static class Interceptors
{
    // Intercepts a specific call at file:line:column
    [InterceptsLocation("Program.cs", line: 10, character: 14)]
    public static void InterceptedMethod(this MyClass obj) =>
        Console.WriteLine("intercepted!");
}`,
    explanation:
      "Interceptors let source generators replace specific call sites with generated implementations without modifying the original code; used by EF Core and ASP.NET Core for AOT-compiled apps.",
  },

  // ── understanding ─────────────────────────────────────────────────────────
  {
    id: "cs-understand-stackalloc-safety",
    language: "csharp",
    title: "stackalloc safety with Span<T>",
    tag: "understanding",
    code: `static int SumStack(int count)
{
    // Safe stackalloc — no unsafe keyword needed when assigned to Span
    Span<int> buf = count <= 256
        ? stackalloc int[count]   // stack
        : new int[count];          // heap fallback for large sizes

    for (int i = 0; i < count; i++) buf[i] = i;
    int total = 0;
    foreach (int n in buf) total += n;
    return total;
}`,
    explanation:
      "Assigning stackalloc to Span<T> (not int*) is safe without the unsafe keyword; the conditional pattern avoids StackOverflowException for large inputs by falling back to heap allocation.",
  },
  {
    id: "cs-understand-interface-dispatch",
    language: "csharp",
    title: "Interface dispatch — virtual vs devirtualised calls",
    tag: "understanding",
    code: `interface IAnimal { void Speak(); }

class Dog : IAnimal { public void Speak() => Console.WriteLine("Woof"); }

// Interface call — indirect dispatch (vtable lookup):
IAnimal a = new Dog();
a.Speak();                   // virtual dispatch through interface

// Sealed class — JIT can devirtualise:
sealed class Cat : IAnimal { public void Speak() => Console.WriteLine("Meow"); }
IAnimal c = new Cat();
c.Speak();                   // JIT may inline — no vtable lookup

// Generics with constraint — also devirtualised:
static void MakeNoise<T>(T animal) where T : IAnimal => animal.Speak();`,
    explanation:
      "Interface calls go through an indirect vtable dispatch; sealed classes and generic constraints allow the JIT to devirtualise (inline the call), eliminating dispatch overhead in hot paths.",
  },
  {
    id: "cs-understand-value-equality",
    language: "csharp",
    title: "Value equality — struct, record, class comparison",
    tag: "understanding",
    code: `// struct: value equality by default (field-by-field via ValueType.Equals)
struct Point { public int X, Y; }
var p1 = new Point { X = 1, Y = 2 };
var p2 = new Point { X = 1, Y = 2 };
Console.WriteLine(p1 == p2);  // CS0019 unless you overload ==
Console.WriteLine(p1.Equals(p2)); // True

// record class: generated structural equality
record Pt(int X, int Y);
var r1 = new Pt(1, 2); var r2 = new Pt(1, 2);
Console.WriteLine(r1 == r2);  // True

// class: reference equality by default
class PtClass { public int X, Y; }
// Must override Equals/GetHashCode for value semantics`,
    explanation:
      "Structs compare fields by default but lack == unless overloaded; records auto-generate == and Equals; classes compare references by default and require explicit Equals/GetHashCode overrides.",
  },
  {
    id: "cs-understand-lazy-evaluation",
    language: "csharp",
    title: "Lazy<T> — thread-safe deferred initialisation",
    tag: "understanding",
    code: `// Lazy<T> with LazyThreadSafetyMode:
var lazy1 = new Lazy<int>(() => { Console.WriteLine("init!"); return 42; });
// Nothing printed yet

Console.WriteLine(lazy1.Value);  // "init!" then 42
Console.WriteLine(lazy1.Value);  // just 42 — already initialised

// PublicationOnly: factory may run multiple times but only one value is published
var lazy2 = new Lazy<object>(
    () => new object(),
    LazyThreadSafetyMode.PublicationOnly);`,
    explanation:
      "Lazy<T> with default mode (ExecutionAndPublication) uses a lock to ensure the factory runs exactly once; PublicationOnly runs the factory once per thread but only publishes the first result — useful for objects that can't be locked during construction.",
  },
  {
    id: "cs-understand-delegate-multicast",
    language: "csharp",
    title: "Multicast delegates — invocation list",
    tag: "understanding",
    code: `Action<string> print = s => Console.WriteLine("A: " + s);
Action<string> log   = s => Console.WriteLine("B: " + s);

Action<string> multi = print + log;
multi("hello");     // both called: "A: hello" then "B: hello"

multi -= log;       // remove one handler
multi("world");     // only "A: world"

// Events are multicast delegates with add/remove access:
// The last handler's return value wins for Func<T> delegates`,
    explanation:
      "Delegates are multicast — + combines invocation lists, - removes a handler; for Func<TResult> delegates all handlers run but only the last return value is observable by the caller.",
  },

  // ── structures ────────────────────────────────────────────────────────────
  {
    id: "cs-memory-pool",
    language: "csharp",
    title: "MemoryPool<T> — rentable Memory<T> segments",
    tag: "structures",
    code: `using System.Buffers;

async Task ProcessChunksAsync(Stream stream)
{
    using IMemoryOwner<byte> owner = MemoryPool<byte>.Shared.Rent(4096);
    Memory<byte> buffer = owner.Memory;

    int bytesRead;
    while ((bytesRead = await stream.ReadAsync(buffer)) > 0)
    {
        ReadOnlyMemory<byte> data = buffer[..bytesRead];
        await ProcessAsync(data);
    }
}

private static Task ProcessAsync(ReadOnlyMemory<byte> data) => Task.CompletedTask;`,
    explanation:
      "MemoryPool<T> returns an IMemoryOwner<T> that holds a pooled Memory<T> segment; Dispose (via using) returns it to the pool; unlike ArrayPool it works with async code through Memory<T>.",
  },
  {
    id: "cs-read-only-collection",
    language: "csharp",
    title: "ReadOnlyCollection<T> and ReadOnlySpan<T> wrapping",
    tag: "structures",
    code: `using System.Collections.ObjectModel;

class Catalog
{
    private readonly List<string> _items = new();

    // Expose read-only view — callers can't mutate the backing list
    public IReadOnlyList<string> Items =>
        _items.AsReadOnly();

    // Or expose as frozen for lookup-only semantics:
    public ReadOnlyCollection<string> Frozen =>
        new ReadOnlyCollection<string>(_items);

    public void Add(string item) => _items.Add(item);
}`,
    explanation:
      "AsReadOnly() wraps a List<T> in a ReadOnlyCollection<T> which implements IReadOnlyList<T>; the backing list is still mutable by the owner but callers cannot cast back to List<T>.",
  },
  {
    id: "cs-pipe-writer",
    language: "csharp",
    title: "Pipe — zero-copy producer-consumer with back-pressure",
    tag: "structures",
    code: `using System.IO.Pipelines;

var pipe = new Pipe();

async Task Producer(PipeWriter writer)
{
    var buf = writer.GetMemory(256);
    int written = Encoding.UTF8.GetBytes("Hello, Pipe!", buf.Span);
    writer.Advance(written);
    await writer.FlushAsync();
    await writer.CompleteAsync();
}

async Task Consumer(PipeReader reader)
{
    while (true)
    {
        var result = await reader.ReadAsync();
        var buf    = result.Buffer;
        Console.WriteLine(Encoding.UTF8.GetString(buf));
        reader.AdvanceTo(buf.End);
        if (result.IsCompleted) break;
    }
}

await Task.WhenAll(Producer(pipe.Writer), Consumer(pipe.Reader));`,
    explanation:
      "Pipe connects a writer and reader with a shared buffer pool; GetMemory/Advance eliminate copies; FlushAsync applies backpressure when the reader is slow.",
  },
  {
    id: "cs-ordered-dictionary",
    language: "csharp",
    title: "OrderedDictionary — insertion-order keyed collection",
    tag: "structures",
    code: `using System.Collections.Specialized;

var od = new OrderedDictionary();
od.Add("c", 3);
od.Add("a", 1);
od.Add("b", 2);

// Preserves insertion order (unlike SortedDictionary):
foreach (System.Collections.DictionaryEntry e in od)
    Console.Write(\$"{e.Key}:{e.Value} ");  // c:3 a:1 b:2

// Index-based access:
Console.WriteLine(od[0]);   // 3 (first inserted)

// Generic alternative in .NET 9:
// var generic = new System.Collections.Generic.OrderedDictionary<string, int>();`,
    explanation:
      "OrderedDictionary preserves insertion order and allows both key and index-based access; the non-generic version is in System.Collections.Specialized; a generic version arrived in .NET 9.",
  },

  // ── caveats ───────────────────────────────────────────────────────────────
  {
    id: "cs-caveat-string-format-culture",
    language: "csharp",
    title: "String.Format and culture — decimal separator surprise",
    tag: "caveats",
    code: `double price = 9.99;

// Culture-sensitive — output depends on current culture!
string s1 = price.ToString();                    // "9.99" or "9,99" depending on locale
string s2 = string.Format("{0}", price);         // same issue

// Always specify invariant culture for non-display strings:
string s3 = price.ToString(CultureInfo.InvariantCulture); // "9.99" everywhere
string s4 = FormattableString.Invariant(\$"{price}");       // "9.99"

// Use CurrentCulture only for display:
string display = price.ToString("C", CultureInfo.CurrentCulture); // "$9.99"`,
    explanation:
      "ToString() without a culture argument uses CurrentCulture; on a German machine 9.99 becomes '9,99' breaking parsers — always use InvariantCulture for stored/transmitted numeric strings.",
  },
  {
    id: "cs-caveat-iasync-disposable",
    language: "csharp",
    title: "IAsyncDisposable requires await using",
    tag: "caveats",
    code: `class AsyncResource : IAsyncDisposable
{
    public async ValueTask DisposeAsync()
    {
        await Task.Delay(1);   // async cleanup
        Console.WriteLine("Disposed");
    }
}

// WRONG — synchronous using calls Dispose() which doesn't exist:
// using var r = new AsyncResource();  // CS0117 if only IAsyncDisposable

// CORRECT:
await using var r = new AsyncResource();
// DisposeAsync is awaited at end of scope`,
    explanation:
      "IAsyncDisposable defines DisposeAsync returning ValueTask; you must use 'await using' to call it; synchronous 'using' only calls IDisposable.Dispose which may not be implemented.",
  },
  {
    id: "cs-caveat-record-mutable-field",
    language: "csharp",
    title: "Records with mutable reference-type properties",
    tag: "caveats",
    code: `record Order(int Id, List<string> Items);

var a = new Order(1, new List<string> { "Widget" });
var b = a with { Id = 2 };   // shallow copy — Items list is SHARED

b.Items.Add("Gadget");

Console.WriteLine(string.Join(",", a.Items));  // Widget,Gadget ← shared!
Console.WriteLine(string.Join(",", b.Items));  // Widget,Gadget`,
    explanation:
      "with expressions create a shallow copy; reference-type properties (List, Dictionary, arrays) are not deep-copied, so mutations through one alias affect all copies — use ImmutableList or deep-clone explicitly.",
  },
  {
    id: "cs-caveat-params-array-alloc",
    language: "csharp",
    title: "params array — hidden allocation per call",
    tag: "caveats",
    code: `static int Sum(params int[] nums) => nums.Sum();

// Each call allocates a new array:
Sum(1, 2, 3);    // new int[]{1,2,3} allocated

// Use params IEnumerable<int> (C# 13+) or overloads to avoid:
static int Sum2(int a, int b) => a + b;           // no alloc
static int Sum2(int a, int b, int c) => a + b + c; // no alloc

// Or params ReadOnlySpan<int> (C# 13 — stack allocation):
static int Sum3(params ReadOnlySpan<int> nums) {
    int t = 0; foreach (var n in nums) t += n; return t;
}`,
    explanation:
      "params int[] allocates a new array on every call site; for hot paths provide explicit overloads or use params ReadOnlySpan<int> (C# 13) which the compiler can stack-allocate.",
  },
  {
    id: "cs-caveat-readonly-struct-copy",
    language: "csharp",
    title: "Calling mutable method on readonly struct causes hidden copy",
    tag: "caveats",
    code: `struct Counter
{
    public int Value;
    public void Increment() => Value++;   // mutates the struct
}

readonly Counter c = new Counter();

// The compiler cannot mutate c (it's readonly), so it copies c first:
c.Increment();   // increments a COPY — c.Value stays 0
Console.WriteLine(c.Value);  // 0 !

// Fix: mark the method readonly if it doesn't mutate state
// Or use a class instead`,
    explanation:
      "When calling a non-readonly method on a readonly struct, the compiler silently makes a defensive copy; the method mutates the copy, not the original — mark methods 'readonly' to document and enforce immutability.",
  },
  {
    id: "cs-caveat-linq-count-enumerable",
    language: "csharp",
    title: "IEnumerable.Count() vs ICollection.Count — performance",
    tag: "caveats",
    code: `IEnumerable<int> list = Enumerable.Range(1, 1_000_000);
IEnumerable<int> query = list.Where(x => x % 2 == 0);

// list.Count() — LINQ detects it's an ICollection, returns Count in O(1)
// query.Count() — must enumerate ALL 1M elements! O(n)

// Always materialise first if you need both count and elements:
var results = query.ToList();
Console.WriteLine(results.Count);   // O(1) — already a List

// Or use Any() instead of Count() > 0:
bool any = query.Any();   // stops at first match, O(1) best case`,
    explanation:
      "LINQ's Count() checks for ICollection<T> and uses its Count property; on bare IEnumerable<T> it enumerates everything — use Any() to check emptiness, Count only on materialised collections.",
  },

  // ── types ─────────────────────────────────────────────────────────────────
  {
    id: "cs-type-discriminated-maybe",
    language: "csharp",
    title: "Option<T> / Maybe<T> — absence without null",
    tag: "types",
    code: `readonly record struct Option<T>
{
    private readonly T? _value;
    public bool HasValue { get; }

    private Option(T value) { _value = value; HasValue = true; }

    public static Option<T> Some(T v) => new(v);
    public static Option<T> None       => default;

    public Option<U> Map<U>(Func<T, U> f) =>
        HasValue ? Option<U>.Some(f(_value!)) : Option<U>.None;

    public T GetValueOrDefault(T fallback) =>
        HasValue ? _value! : fallback;
}`,
    explanation:
      "Option<T> makes absence explicit in the type system — callers must unwrap before using the value; Map chains transformations without null checks, propagating None automatically.",
  },
  {
    id: "cs-type-generic-variance-iface",
    language: "csharp",
    title: "IEnumerable<out T> — covariant generic interface",
    tag: "types",
    code: `// IEnumerable<T> is covariant (out T):
IEnumerable<string>  strings = new List<string> { "a", "b" };
IEnumerable<object>  objects = strings;  // OK — string IS-A object

// IList<T> is INVARIANT — no variance:
// IList<object> list = new List<string>();  // CS0266

// Your own covariant interface:
interface IReader<out T> { T Read(); }
class StringReader : IReader<string> { public string Read() => "hi"; }
IReader<object> r = new StringReader();  // OK — covariant`,
    explanation:
      "Covariance (out T) lets an IReader<string> be used where IReader<object> is expected because strings can be read as objects; IList<T> is invariant because you can write arbitrary objects into it.",
  },
  {
    id: "cs-type-unmanaged-constraint",
    language: "csharp",
    title: "unmanaged generic constraint — blittable types",
    tag: "types",
    code: `static unsafe int SizeOf<T>() where T : unmanaged => sizeof(T);

static Span<T> AsSpan<T>(ref T value) where T : unmanaged
{
    unsafe
    {
        return new Span<T>(System.Runtime.CompilerServices.Unsafe.AsPointer(ref value), 1);
    }
}

Console.WriteLine(SizeOf<int>());     // 4
Console.WriteLine(SizeOf<double>());  // 8`,
    explanation:
      "The unmanaged constraint restricts T to value types containing no managed references (int, double, structs of unmanaged types); it enables sizeof(T) and unsafe pointer operations on T.",
  },
  {
    id: "cs-type-where-new",
    language: "csharp",
    title: "Generic new() constraint — parameterless constructor",
    tag: "types",
    code: `static T CreateAndInitialise<T>() where T : new()
{
    var instance = new T();      // only works with new() constraint
    return instance;
}

class Widget { public int Value = 42; }

var w = CreateAndInitialise<Widget>();
Console.WriteLine(w.Value);  // 42

// Activator.CreateInstance without new() constraint — slower, unconstrained:
object obj = Activator.CreateInstance(typeof(Widget))!;`,
    explanation:
      "The new() constraint guarantees T has a public parameterless constructor, letting you call new T() in generic code; without it the compiler rejects new T() because T might not have that constructor.",
  },

  // ── families ──────────────────────────────────────────────────────────────
  {
    id: "cs-family-memory-management",
    language: "csharp",
    title: "Memory management: GC vs Dispose vs stackalloc vs pools",
    tag: "families",
    code: `// GC — automatic, no action needed for managed objects
var list = new List<int>();  // collected when no more references

// Dispose — deterministic release of unmanaged resources
using var conn = new SqlConnection(cs);

// stackalloc — stack allocation, O(1) alloc, no GC
Span<byte> buf = stackalloc byte[128];

// ArrayPool — reuse heap buffers, avoid LOH pressure
byte[] rented = ArrayPool<byte>.Shared.Rent(8192);
// ... use rented ...
ArrayPool<byte>.Shared.Return(rented);

// NativeMemory — unmanaged heap, pin-free, needs manual free
void* ptr = NativeMemory.Alloc(1024);
NativeMemory.Free(ptr);`,
    explanation:
      "Choose based on lifetime and size: GC for most objects; Dispose for unmanaged resources; stackalloc for small short-lived buffers; ArrayPool for reusable medium buffers; NativeMemory for large SIMD/interop buffers.",
  },
  {
    id: "cs-family-pattern-matching",
    language: "csharp",
    title: "Pattern matching evolution — C# 7 through 12",
    tag: "families",
    code: `object obj = 42;

// C# 7 — type patterns
if (obj is int n) Console.WriteLine(n);

// C# 8 — switch expression
string s = obj switch { int i => \$"int:{i}", _ => "other" };

// C# 9 — relational, logical
string t = obj switch { int i when i > 0 => "positive", _ => "other" };
string u = obj switch { > 0 and < 100 => "small", _ => "big" };

// C# 10 — property patterns with extended scope
// C# 11 — list patterns
int[] arr = [1,2,3];
bool match = arr is [1, .., 3];

// C# 12 — primary constructors pattern`,
    explanation:
      "Each C# version added more expressive pattern forms; list patterns and relational patterns removed the need for verbose if/else chains; property patterns enable structural deconstruction.",
  },
  {
    id: "cs-family-generics-vs-interfaces",
    language: "csharp",
    title: "Generics vs interfaces — when to use each",
    tag: "families",
    code: `// Interface — heterogeneous collections, dynamic dispatch
interface IShape { double Area(); }
List<IShape> shapes = new() { circle, square };  // mix of types

// Generic — homogeneous, devirtualised, type-safe at compile time
static double TotalArea<T>(IEnumerable<T> shapes) where T : IShape
    => shapes.Sum(s => s.Area());

// Generics + constraints: both type safety AND flexibility
static T Max<T>(T a, T b) where T : IComparable<T>
    => a.CompareTo(b) >= 0 ? a : b;`,
    explanation:
      "Interfaces allow heterogeneous collections and runtime polymorphism; generics with constraints are monomorphised by the JIT enabling devirtualisation while still accepting multiple types.",
  },
  {
    id: "cs-family-configuration-providers",
    language: "csharp",
    title: "Configuration provider priority order",
    tag: "families",
    code: `// In WebApplication.CreateBuilder(args), default providers in priority order:
// 1. appsettings.json                     — lowest
// 2. appsettings.{Environment}.json
// 3. User secrets (Development only)
// 4. Environment variables
// 5. Command-line arguments               — highest

// Override a value without touching appsettings.json:
// $ myapp --Server__Port=9090
// $ SERVER__PORT=9090 myapp

// Double underscore __ is the section separator in env vars:
// "Server:Port" → SERVER__PORT`,
    explanation:
      "Later providers override earlier ones; the __ separator maps nested JSON sections to flat environment variable names, enabling container and CI injection without code changes.",
  },

  // ── classes ───────────────────────────────────────────────────────────────
  {
    id: "cs-class-interceptor-pattern",
    language: "csharp",
    title: "Interceptor (AOP) with DispatchProxy",
    tag: "classes",
    code: `class LoggingProxy<T> : DispatchProxy where T : class
{
    private T? _target;

    public static T Create(T target)
    {
        var proxy = Create<T, LoggingProxy<T>>();
        ((LoggingProxy<T>)(object)proxy)._target = target;
        return proxy;
    }

    protected override object? Invoke(System.Reflection.MethodInfo? method, object?[]? args)
    {
        Console.WriteLine(\$"Calling {method?.Name}");
        return method?.Invoke(_target, args);
    }
}

interface ICalc { int Add(int a, int b); }
class Calc : ICalc { public int Add(int a, int b) => a + b; }

var proxy = LoggingProxy<ICalc>.Create(new Calc());
proxy.Add(1, 2);  // Calling Add`,
    explanation:
      "DispatchProxy intercepts all interface method calls, enabling logging, caching, or retry logic without modifying the original class — a lightweight AOP alternative to IL weaving.",
  },
  {
    id: "cs-class-record-struct-value",
    language: "csharp",
    title: "readonly record struct — immutable value type",
    tag: "classes",
    code: `readonly record struct Color(byte R, byte G, byte B)
{
    public static readonly Color Black = new(0, 0, 0);
    public static readonly Color White = new(255, 255, 255);

    public Color Blend(Color other) =>
        new((byte)((R + other.R) / 2),
            (byte)((G + other.G) / 2),
            (byte)((B + other.B) / 2));

    public override string ToString() => \$"#{R:X2}{G:X2}{B:X2}";
}

var mixed = Color.Black.Blend(Color.White);
Console.WriteLine(mixed);  // #7F7F7F`,
    explanation:
      "readonly record struct combines the zero-allocation storage of struct, the immutability of readonly, and the auto-generated equality/ToString/Deconstruct of record — ideal for small immutable values.",
  },
  {
    id: "cs-class-generic-event-bus",
    language: "csharp",
    title: "Typed event bus with generics",
    tag: "classes",
    code: `class EventBus
{
    private readonly Dictionary<Type, List<Delegate>> _subs = new();

    public void Subscribe<T>(Action<T> handler)
    {
        var key = typeof(T);
        if (!_subs.ContainsKey(key)) _subs[key] = new();
        _subs[key].Add(handler);
    }

    public void Publish<T>(T ev)
    {
        if (_subs.TryGetValue(typeof(T), out var handlers))
            foreach (var h in handlers)
                ((Action<T>)h)(ev);
    }
}

record UserCreated(string Name);

var bus = new EventBus();
bus.Subscribe<UserCreated>(e => Console.WriteLine(\$"Welcome {e.Name}"));
bus.Publish(new UserCreated("Alice"));`,
    explanation:
      "Using typeof(T) as the dictionary key creates per-event-type handler lists; the delegate cast is safe because Subscribe<T> always stores Action<T> for key typeof(T).",
  },
  {
    id: "cs-class-circuit-breaker",
    language: "csharp",
    title: "Circuit breaker pattern",
    tag: "classes",
    code: `class CircuitBreaker
{
    private int    _failureCount;
    private bool   _open;
    private DateTime _openedAt;

    private readonly int      _threshold;
    private readonly TimeSpan _resetAfter;

    public CircuitBreaker(int threshold, TimeSpan resetAfter)
        => (_threshold, _resetAfter) = (threshold, resetAfter);

    public async Task<T> ExecuteAsync<T>(Func<Task<T>> fn)
    {
        if (_open && DateTime.UtcNow - _openedAt < _resetAfter)
            throw new InvalidOperationException("Circuit open");

        try
        {
            var result = await fn();
            _failureCount = 0; _open = false;
            return result;
        }
        catch
        {
            if (++_failureCount >= _threshold) { _open = true; _openedAt = DateTime.UtcNow; }
            throw;
        }
    }
}`,
    explanation:
      "The circuit breaker opens after _threshold failures and stops making calls for _resetAfter; after the window passes it transitions to half-open (allows one attempt), resetting on success.",
  },
  {
    id: "cs-class-snapshot",
    language: "csharp",
    title: "Memento / snapshot pattern",
    tag: "classes",
    code: `class TextEditor
{
    private string _content = "";
    private readonly Stack<string> _history = new();

    public void Type(string text)
    {
        _history.Push(_content);  // save snapshot
        _content += text;
    }

    public void Undo()
    {
        if (_history.Count > 0)
            _content = _history.Pop();
    }

    public string Content => _content;
}

var ed = new TextEditor();
ed.Type("Hello");
ed.Type(", World");
ed.Undo();
Console.WriteLine(ed.Content);  // Hello`,
    explanation:
      "The Memento pattern saves a snapshot of internal state before each mutation; a stack of snapshots supports multi-level undo without exposing the internal representation to the caller.",
  },
  {
    id: "cs-class-rate-limiter",
    language: "csharp",
    title: "Token bucket rate limiter",
    tag: "classes",
    code: `class TokenBucket
{
    private double _tokens;
    private DateTime _lastRefill = DateTime.UtcNow;
    private readonly double _rate;      // tokens per second
    private readonly double _capacity;

    public TokenBucket(double rate, double capacity)
        => (_rate, _capacity, _tokens) = (rate, capacity, capacity);

    public bool TryConsume(double cost = 1.0)
    {
        var now = DateTime.UtcNow;
        var elapsed = (now - _lastRefill).TotalSeconds;
        _tokens = Math.Min(_capacity, _tokens + elapsed * _rate);
        _lastRefill = now;
        if (_tokens < cost) return false;
        _tokens -= cost;
        return true;
    }
}

var bucket = new TokenBucket(rate: 10, capacity: 20);
Console.WriteLine(bucket.TryConsume());   // True
Console.WriteLine(bucket.TryConsume(25)); // False — exceeds capacity`,
    explanation:
      "The token bucket refills at a constant rate up to capacity; TryConsume returns false when insufficient tokens exist, providing smooth burst handling without hard per-second limits.",
  },
  {
    id: "cs-class-object-pool-custom",
    language: "csharp",
    title: "Custom ObjectPool<T> implementation",
    tag: "classes",
    code: `class ObjectPool<T>
{
    private readonly ConcurrentBag<T> _bag = new();
    private readonly Func<T>          _factory;

    public ObjectPool(Func<T> factory) => _factory = factory;

    public T Rent() =>
        _bag.TryTake(out var item) ? item : _factory();

    public void Return(T item) => _bag.Add(item);
}

var pool = new ObjectPool<StringBuilder>(() => new StringBuilder());
var sb   = pool.Rent();
try   { sb.Append("hello"); Console.WriteLine(sb); }
finally { sb.Clear(); pool.Return(sb); }`,
    explanation:
      "ConcurrentBag provides thread-safe add/take; always clear returned objects before returning to prevent data leaks between tenants; the factory handles the first-use and pool-exhausted cases.",
  },

  // ── more snippets ─────────────────────────────────────────────────────────────
  {
    id: "cs-format-interpolated-handler",
    language: "csharp",
    title: "Interpolated string handler for structured logging",
    tag: "snippet",
    code: `// The compiler lowers $"..." to a handler when the parameter type matches
// ILogger uses this in Microsoft.Extensions.Logging (NET 6+):
using Microsoft.Extensions.Logging;

logger.LogInformation("Processing order {OrderId} for {Customer}",
    orderId, customerName);   // structured, not string-formatted

// With interpolated handler — same benefit, nicer syntax:
logger.LogInformation(\$"Processing order {orderId} for {customerName}");
// The handler checks IsEnabled before evaluating holes`,
    explanation:
      "Structured logging with named placeholders lets log sinks index on OrderId/Customer; the interpolated string handler in .NET 6 logging achieves this without sacrificing the readable $\"\" syntax.",
  },
  {
    id: "cs-unsafe-pointer",
    language: "csharp",
    title: "Unsafe pointer arithmetic for performance-critical code",
    tag: "snippet",
    code: `static unsafe int IndexOf(byte[] haystack, byte needle)
{
    fixed (byte* p = haystack)
    {
        byte* end = p + haystack.Length;
        for (byte* cur = p; cur < end; cur++)
            if (*cur == needle) return (int)(cur - p);
    }
    return -1;
}

byte[] data = { 10, 20, 30, 40 };
Console.WriteLine(IndexOf(data, 30));  // 2`,
    explanation:
      "fixed pins a managed array so the GC won't move it while a pointer holds a reference; pointer arithmetic is only valid within the fixed block — prefer Span<T> in most cases to avoid unsafe.",
  },
  {
    id: "cs-vector-simd",
    language: "csharp",
    title: "System.Numerics.Vector<T> — portable SIMD",
    tag: "snippet",
    code: `using System.Numerics;

static float[] AddArrays(float[] a, float[] b)
{
    var result = new float[a.Length];
    int vsz = Vector<float>.Count;   // 4 on SSE2, 8 on AVX2
    int i   = 0;

    for (; i <= a.Length - vsz; i += vsz)
    {
        var va = new Vector<float>(a, i);
        var vb = new Vector<float>(b, i);
        (va + vb).CopyTo(result, i);
    }
    for (; i < a.Length; i++) result[i] = a[i] + b[i];  // tail
    return result;
}`,
    explanation:
      "Vector<T> uses hardware SIMD instructions automatically; Vector<float>.Count adapts to the CPU width at runtime; process the tail elements in a scalar loop for lengths not a multiple of the vector width.",
  },
];
