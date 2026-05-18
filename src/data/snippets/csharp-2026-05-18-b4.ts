import type { Snippet } from "./types";

export const csharpSnippets20260518B4: Snippet[] = [
  // --- snippet ---
  {
    id: "cs-b18-b4-span-utf8",
    language: "csharp",
    title: "UTF8 encoding with Span<byte>",
    tag: "snippet",
    code: `using System;
using System.Text;

string text = "Hello, 世界!";

// Encode into a stack-allocated buffer
Span<byte> buffer = stackalloc byte[128];
int bytesWritten = Encoding.UTF8.GetBytes(text, buffer);

Console.WriteLine($"Encoded {bytesWritten} bytes");

// Decode back
string decoded = Encoding.UTF8.GetString(buffer[..bytesWritten]);
Console.WriteLine(decoded);  // Hello, 世界!`,
    explanation: "Encoding.UTF8.GetBytes with Span<byte> avoids allocating a new byte array; the result is written directly into stack memory, enabling zero-allocation UTF-8 encoding.",
  },
  {
    id: "cs-b18-b4-array-pool",
    language: "csharp",
    title: "ArrayPool<T> for rented buffers",
    tag: "snippet",
    code: `using System;
using System.Buffers;

static void ProcessData(int size)
{
    byte[] buffer = ArrayPool<byte>.Shared.Rent(size);
    try
    {
        // Use buffer — may be larger than requested
        buffer.AsSpan(0, size).Fill(0xFF);
        Console.WriteLine($"Rented {buffer.Length} bytes, used {size}");
    }
    finally
    {
        ArrayPool<byte>.Shared.Return(buffer, clearArray: false);
    }
}

ProcessData(1024);`,
    explanation: "ArrayPool<T> reuses array allocations; Rent returns an array at least as large as requested, and Return puts it back for reuse, reducing GC pressure for large temporary buffers.",
  },
  {
    id: "cs-b18-b4-record-clone",
    language: "csharp",
    title: "Record clone pattern",
    tag: "snippet",
    code: `record Config(
    string Host,
    int    Port    = 5432,
    bool   Ssl     = false,
    int    PoolSize = 10)
{
    // Add validation in a custom constructor
    public Config : this(Host, Port, Ssl, PoolSize)
    {
        if (PoolSize < 1) throw new ArgumentException("PoolSize must be >= 1");
    }
}

var defaults = new Config("localhost");
var prod = defaults with { Host = "db.prod.com", Ssl = true };
var readReplica = prod with { Port = 5433, PoolSize = 20 };

Console.WriteLine(prod);
Console.WriteLine(readReplica);`,
    explanation: "Records with positional parameters and with-expressions enable configuration hierarchies; each variant is a non-destructive copy with specific overrides, creating an immutable config chain.",
  },
  {
    id: "cs-b18-b4-linq-distinct-by",
    language: "csharp",
    title: "DistinctBy for deduplication (.NET 6+)",
    tag: "snippet",
    code: `using System.Linq;

var people = new[]
{
    new { Name = "Alice", City = "NYC" },
    new { Name = "Bob",   City = "LA"  },
    new { Name = "Alice", City = "LA"  }, // duplicate name
    new { Name = "Carol", City = "NYC" },
};

// Unique by Name
var unique = people.DistinctBy(p => p.Name).ToList();
foreach (var p in unique)
    Console.WriteLine($"{p.Name} ({p.City})");
// Alice (NYC)
// Bob (LA)
// Carol (NYC)`,
    explanation: "DistinctBy (.NET 6+) removes duplicates based on a key selector without requiring a custom IEqualityComparer; the first occurrence of each key is retained.",
  },
  {
    id: "cs-b18-b4-string-builder-perf",
    language: "csharp",
    title: "StringBuilder for string concatenation loops",
    tag: "snippet",
    code: `using System;
using System.Text;
using System.Diagnostics;

// Slow: O(n²) allocations
static string SlowJoin(int n)
{
    string s = "";
    for (int i = 0; i < n; i++) s += i + ",";
    return s;
}

// Fast: O(n) with StringBuilder
static string FastJoin(int n)
{
    var sb = new StringBuilder(n * 4);  // pre-size capacity hint
    for (int i = 0; i < n; i++) sb.Append(i).Append(',');
    return sb.ToString();
}

// For joining, String.Join is cleanest
static string BestJoin(int n) =>
    string.Join(",", System.Linq.Enumerable.Range(0, n));`,
    explanation: "StringBuilder avoids O(n²) string copying in loops; pre-sizing the capacity hint with new StringBuilder(capacity) avoids internal buffer resizing. For joining, string.Join is cleaner still.",
  },
  {
    id: "cs-b18-b4-expression-body",
    language: "csharp",
    title: "Expression-bodied members",
    tag: "snippet",
    code: `class Circle
{
    public double Radius { get; }

    // Expression-bodied constructor
    public Circle(double radius) => Radius = radius;

    // Expression-bodied property
    public double Area => Math.PI * Radius * Radius;

    // Expression-bodied method
    public double Scale(double factor) => new Circle(Radius * factor).Area;

    // Expression-bodied indexer
    // public double this[int n] => Math.Pow(Radius, n);

    // Expression-bodied override
    public override string ToString() => $"Circle(r={Radius:F2})";
}

var c = new Circle(5);
Console.WriteLine(c);             // Circle(r=5.00)
Console.WriteLine(c.Area);        // 78.54`,
    explanation: "Expression-bodied members (=>) replace single-expression methods, properties, constructors, and operators with concise one-liners, reducing boilerplate without losing clarity.",
  },
  {
    id: "cs-b18-b4-local-functions",
    language: "csharp",
    title: "Local functions for encapsulation",
    tag: "snippet",
    code: `static long Fibonacci(int n)
{
    if (n < 0) throw new ArgumentException("n must be non-negative");

    // Local function: only visible inside Fibonacci
    return Fib(n);

    static long Fib(int k) => k <= 1 ? k : Fib(k - 1) + Fib(k - 2);
}

Console.WriteLine(Fibonacci(10));  // 55
Console.WriteLine(Fibonacci(20));  // 6765

// Local functions can capture outer variables (unlike static local functions)
static IEnumerable<int> Filter(int[] nums, int threshold)
{
    return GetFiltered();  // defers execution

    IEnumerable<int> GetFiltered()  // captures 'threshold'
    {
        foreach (var n in nums)
            if (n > threshold) yield return n;
    }
}`,
    explanation: "Local functions are nested inside methods; they're cleaner than private methods for helpers that are only relevant locally, support yield return, and static local functions prevent accidental captures.",
  },
  {
    id: "cs-b18-b4-pattern-property",
    language: "csharp",
    title: "Property and positional patterns",
    tag: "snippet",
    code: `record Point(int X, int Y);
record Rect(Point TopLeft, Point BottomRight);

static string Classify(Rect r) => r switch
{
    // Property pattern: access nested properties
    { TopLeft: { X: 0, Y: 0 } }        => "origin-anchored",
    // Positional pattern: deconstruct
    ({ X: var x1 }, { X: var x2 }) when x1 == x2 => "vertical line",
    // Relational pattern
    { TopLeft.X: < 0 }                  => "extends left",
    _                                   => "general rectangle",
};

Console.WriteLine(Classify(new Rect(new Point(0,0), new Point(5,5))));
// origin-anchored`,
    explanation: "Property patterns match nested properties with { Prop: pattern }; positional patterns destructure record types; they compose to express complex structural conditions cleanly.",
  },
  {
    id: "cs-b18-b4-caller-attributes",
    language: "csharp",
    title: "CallerMemberName for diagnostics",
    tag: "snippet",
    code: `using System;
using System.Runtime.CompilerServices;

class Logger
{
    public static void Log(
        string message,
        [CallerMemberName] string memberName = "",
        [CallerFilePath]   string filePath   = "",
        [CallerLineNumber] int    lineNumber  = 0)
    {
        Console.WriteLine($"[{memberName}:{lineNumber}] {message}");
    }
}

class Service
{
    public void Process()
    {
        Logger.Log("Starting process");   // [Process:14] Starting process
    }
}`,
    explanation: "CallerMemberName, CallerFilePath, and CallerLineNumber attributes are filled by the compiler with the caller's context; they enable zero-overhead diagnostic logging without reflection.",
  },
  {
    id: "cs-b18-b4-index-range",
    language: "csharp",
    title: "Index and Range operators",
    tag: "snippet",
    code: `int[] arr = { 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 };

// Index from end
Console.WriteLine(arr[^1]);         // 9 (last)
Console.WriteLine(arr[^2]);         // 8 (second to last)

// Range: start..end (exclusive)
int[] slice = arr[2..5];
Console.WriteLine(string.Join(", ", slice));  // 2, 3, 4

// Open-ended ranges
Console.WriteLine(string.Join(", ", arr[^3..]));   // 7, 8, 9
Console.WriteLine(string.Join(", ", arr[..3]));    // 0, 1, 2

// Works on strings too
string s = "Hello, World!";
Console.WriteLine(s[7..]);   // World!`,
    explanation: "The ^ operator counts from the end; .. creates a Range. Together they provide concise slice syntax for arrays, strings, and any type implementing Index/Range indexers.",
  },
  {
    id: "cs-b18-b4-with-nullable",
    language: "csharp",
    title: "Null-coalescing and null-conditional operators",
    tag: "snippet",
    code: `class User { public string? Name { get; set; } public Address? Address { get; set; } }
class Address { public string? City { get; set; } }

User? user = null;

// ?. safe navigation — short-circuits on null
string? city = user?.Address?.City;
Console.WriteLine(city);            // (null, no exception)

// ?? null-coalescing
string name = user?.Name ?? "Guest";
Console.WriteLine(name);            // Guest

// ??= null-coalescing assignment
user ??= new User();                // only assigns if user is null
user.Name ??= "Anonymous";
Console.WriteLine(user.Name);       // Anonymous`,
    explanation: "?. chains property access safely through nulls; ?? provides fallback values; ??= assigns only when the left side is null. Together they eliminate most explicit null checks.",
  },
  {
    id: "cs-b18-b4-deconstruct",
    language: "csharp",
    title: "Custom Deconstruct for positional patterns",
    tag: "snippet",
    code: `class Rectangle
{
    public double Width  { get; }
    public double Height { get; }

    public Rectangle(double w, double h) => (Width, Height) = (w, h);

    // Enables deconstruction and positional patterns
    public void Deconstruct(out double width, out double height)
        => (width, height) = (Width, Height);
}

var rect = new Rectangle(4, 6);
var (w, h) = rect;                   // deconstruct
Console.WriteLine($"{w}x{h}");       // 4x6

// Positional pattern in switch
string Describe(Rectangle r) => r switch
{
    (var x, var y) when x == y => "square",
    (var x, var y) when x > y  => "landscape",
    _                          => "portrait",
};

Console.WriteLine(Describe(rect));   // landscape`,
    explanation: "Implementing Deconstruct(out T1, out T2, ...) enables the (var x, var y) = obj syntax and positional patterns in switch expressions, composing well with records.",
  },
  {
    id: "cs-b18-b4-unsafe-simd",
    language: "csharp",
    title: "SIMD with Vector<T> for parallel math",
    tag: "snippet",
    code: `using System;
using System.Numerics;

static float DotProduct(float[] a, float[] b)
{
    float sum = 0;
    int vectorSize = Vector<float>.Count;
    int i = 0;

    // Process in SIMD chunks
    for (; i <= a.Length - vectorSize; i += vectorSize)
    {
        var va = new Vector<float>(a, i);
        var vb = new Vector<float>(b, i);
        sum += Vector.Dot(va, vb);
    }

    // Handle remainder
    for (; i < a.Length; i++) sum += a[i] * b[i];
    return sum;
}

float[] x = { 1, 2, 3, 4, 5, 6, 7, 8 };
float[] y = { 8, 7, 6, 5, 4, 3, 2, 1 };
Console.WriteLine(DotProduct(x, y));  // 120`,
    explanation: "System.Numerics.Vector<T> leverages CPU SIMD instructions to process multiple elements per clock cycle; the code falls back to scalar for remainders automatically.",
  },
  {
    id: "cs-b18-b4-switch-expression",
    language: "csharp",
    title: "Switch expression as a value",
    tag: "snippet",
    code: `enum DayOfWeek2 { Mon, Tue, Wed, Thu, Fri, Sat, Sun }

static string DayType(DayOfWeek2 day) => day switch
{
    DayOfWeek2.Sat or DayOfWeek2.Sun => "Weekend",
    DayOfWeek2.Fri                    => "TGIF",
    _                                 => "Weekday",
};

// Nested switch expression
static decimal Shipping(string zone, bool express) =>
    zone switch
    {
        "domestic" => express ? 15.99m : 4.99m,
        "europe"   => express ? 35.00m : 12.50m,
        _          => 50.00m,
    };

Console.WriteLine(DayType(DayOfWeek2.Fri));           // TGIF
Console.WriteLine(Shipping("domestic", true));         // 15.99`,
    explanation: "Switch expressions produce a value and can be used inside other expressions; or patterns combine cases, and _ is the default arm. They're exhaustiveness-checked by the compiler.",
  },
  {
    id: "cs-b18-b4-init-only",
    language: "csharp",
    title: "init accessor for post-construction immutability",
    tag: "snippet",
    code: `class Config
{
    public string Host  { get; init; } = "localhost";
    public int    Port  { get; init; } = 5432;
    public bool   Ssl   { get; init; } = false;
}

// Can only set init properties in an object initializer or with-expression
var cfg = new Config { Host = "prod.db.com", Ssl = true };
Console.WriteLine(cfg.Host);  // prod.db.com

// cfg.Host = "other";  // compile error after initialization

// Records use init by default for their positional parameters
record Point(int X, int Y);
var p = new Point(1, 2);
// p.X = 5;  // compile error`,
    explanation: "init-only setters allow properties to be set during object initializer syntax but not afterward; this gives post-construction immutability with the ergonomics of property initializers.",
  },

  // --- understanding ---
  {
    id: "cs-b18-b4-value-type-heap",
    language: "csharp",
    title: "When value types live on the heap",
    tag: "understanding",
    code: `// Value types as class fields — stored on the heap (inside the class object)
class Container { public int Value; }
var c = new Container();  // int lives in the heap object

// Value types in arrays — stored on the heap (inside the array)
int[] arr = new int[10];  // ints live in the array on the heap

// Value types as local variables — live on the stack
int x = 42;  // on the stack (usually)

// Boxing: moves value from stack to heap
object boxed = x;

// Captured by closures: moved to heap-allocated closure object
int counter = 0;
Action inc = () => counter++;
inc();
Console.WriteLine(counter);  // 1  (counter is on the heap via closure)`,
    explanation: "Value types live on the stack only when they're local variables (not captured, not boxed). As fields, array elements, or closed-over variables, they live on the heap inside a reference object.",
  },
  {
    id: "cs-b18-b4-readonly-struct",
    language: "csharp",
    title: "readonly struct for defensive copies",
    tag: "understanding",
    code: `// Without readonly: every method call copies the struct (defensive copy)
struct MutablePoint
{
    public int X;
    public void Scale(int f) => X *= f;
}

// With readonly: no defensive copies needed — compiler enforces immutability
readonly struct ImmutablePoint
{
    public readonly int X;
    public readonly int Y;
    public ImmutablePoint(int x, int y) => (X, Y) = (x, y);
    public ImmutablePoint Scale(int f) => new ImmutablePoint(X * f, Y * f);
    public override string ToString() => $"({X},{Y})";
}

var p = new ImmutablePoint(3, 4);
Console.WriteLine(p.Scale(2));  // (6, 8)`,
    explanation: "readonly struct tells the JIT no method mutates the struct, eliminating defensive copies when passing as in parameters or reading through a readonly field. Always use for immutable value types.",
  },
  {
    id: "cs-b18-b4-ref-local-return",
    language: "csharp",
    title: "ref locals and ref returns",
    tag: "understanding",
    code: `static ref int FindFirst(int[] arr, int target)
{
    for (int i = 0; i < arr.Length; i++)
        if (arr[i] == target)
            return ref arr[i];  // return reference
    throw new InvalidOperationException("Not found");
}

int[] data = { 1, 2, 3, 4, 5 };
ref int found = ref FindFirst(data, 3);

Console.WriteLine(found);   // 3
found = 99;                  // modifies array element directly
Console.WriteLine(data[2]); // 99`,
    explanation: "ref returns return a managed reference to a storage location; ref locals alias that location, enabling in-place modification of array elements or struct fields without copying.",
  },
  {
    id: "cs-b18-b4-static-analysis-attributes",
    language: "csharp",
    title: "Nullable static analysis attributes",
    tag: "understanding",
    code: `#nullable enable
using System.Diagnostics.CodeAnalysis;

static bool TryGetUser(int id, [NotNullWhen(true)] out string? name)
{
    if (id == 1) { name = "Alice"; return true; }
    name = null;
    return false;
}

if (TryGetUser(1, out string? user))
    Console.WriteLine(user.Length);  // no warning: NotNullWhen(true)

// MaybeNullWhen: opposite direction
static bool TryFail([MaybeNullWhen(false)] out string result)
{
    result = null!;
    return false;
}`,
    explanation: "Attributes like NotNullWhen, MaybeNullWhen, NotNull, and DoesNotReturn give the nullable analyzer flow-sensitive hints that it can't infer automatically.",
  },
  {
    id: "cs-b18-b4-managed-vs-unmanaged",
    language: "csharp",
    title: "Managed vs unmanaged resources",
    tag: "understanding",
    code: `using System;
using System.Runtime.InteropServices;

// Unmanaged: OS handle, memory outside GC heap, COM objects
// Must be freed explicitly
IntPtr ptr = Marshal.AllocHGlobal(1024);
try
{
    // Use ptr...
    Marshal.WriteInt32(ptr, 0, 42);
    Console.WriteLine(Marshal.ReadInt32(ptr, 0));  // 42
}
finally
{
    Marshal.FreeHGlobal(ptr);  // MUST free or leak memory
}

// SafeHandle is the modern way to wrap unmanaged handles
// using var h = new SafeFileHandle(ptr, ownsHandle: true);`,
    explanation: "Unmanaged resources (OS handles, unmanaged memory, COM) aren't tracked by the GC; they require deterministic freeing. SafeHandle wraps handles with automatic cleanup via critical finalizers.",
  },
  {
    id: "cs-b18-b4-inlining-jit",
    language: "csharp",
    title: "JIT inlining and MethodImpl hints",
    tag: "understanding",
    code: `using System.Runtime.CompilerServices;

class Math2
{
    // Suggest the JIT inline this method (small, hot path)
    [MethodImpl(MethodImplOptions.AggressiveInlining)]
    public static int Add(int a, int b) => a + b;

    // Prevent inlining (large method or debugging purposes)
    [MethodImpl(MethodImplOptions.NoInlining)]
    public static void ComplexOperation() { /* ... */ }

    // Optimize aggressively (unroll loops, etc.)
    [MethodImpl(MethodImplOptions.AggressiveOptimization)]
    public static double HotLoop(double[] arr)
    {
        double sum = 0;
        for (int i = 0; i < arr.Length; i++) sum += arr[i];
        return sum;
    }
}`,
    explanation: "MethodImpl attributes advise the JIT; AggressiveInlining is a hint (not guaranteed) to inline small hot methods, eliminating call overhead. NoInlining keeps stack traces readable for debugging.",
  },
  {
    id: "cs-b18-b4-gc-suppress-finalize",
    language: "csharp",
    title: "GC.SuppressFinalize and two-phase cleanup",
    tag: "understanding",
    code: `class HeavyResource : IDisposable
{
    private IntPtr _handle;
    private bool   _disposed;

    public HeavyResource()
    {
        _handle = System.Runtime.InteropServices.Marshal.AllocHGlobal(4096);
    }

    ~HeavyResource()
    {
        // Finalizer: runs on GC thread, called if Dispose wasn't
        Dispose(false);
    }

    public void Dispose()
    {
        Dispose(true);
        GC.SuppressFinalize(this);  // we cleaned up; skip finalizer
    }

    private void Dispose(bool fromDispose)
    {
        if (_disposed) return;
        if (fromDispose) { /* free managed */ }
        System.Runtime.InteropServices.Marshal.FreeHGlobal(_handle);
        _disposed = true;
    }
}`,
    explanation: "GC.SuppressFinalize prevents the finalizer from running after Dispose cleans up; the two-path design (disposing=true/false) ensures unmanaged resources are freed whether from Dispose or finalization.",
  },
  {
    id: "cs-b18-b4-struct-layout",
    language: "csharp",
    title: "StructLayout for interop and memory control",
    tag: "understanding",
    code: `using System;
using System.Runtime.InteropServices;

// Sequential: same order as declared, no padding
[StructLayout(LayoutKind.Sequential, Pack = 1)]
struct PacketHeader
{
    public byte  Version;
    public byte  Flags;
    public ushort Length;
    public uint  Checksum;
}

Console.WriteLine(Marshal.SizeOf<PacketHeader>());  // 8 bytes

// Explicit: manual byte offsets (like a C union)
[StructLayout(LayoutKind.Explicit)]
struct IpAddress
{
    [FieldOffset(0)] public uint  Value;
    [FieldOffset(0)] public byte  A;
    [FieldOffset(1)] public byte  B;
    [FieldOffset(2)] public byte  C;
    [FieldOffset(3)] public byte  D;
}`,
    explanation: "StructLayout controls memory layout for P/Invoke interop; Sequential with Pack=1 eliminates alignment padding; Explicit enables union-like overlapping fields at the same memory address.",
  },
  {
    id: "cs-b18-b4-async-state-machine",
    language: "csharp",
    title: "How async/await compiles to state machines",
    tag: "understanding",
    code: `using System;
using System.Threading.Tasks;

// This code:
async Task<int> ComputeAsync()
{
    int a = await Task.FromResult(1);
    int b = await Task.FromResult(2);
    return a + b;
}

// Compiles to roughly:
// A struct (state machine) with:
// - State field (0, 1, 2 for each resume point)
// - Fields for 'a', 'b' (captured locals)
// - MoveNext() called by the task scheduler
// - SetResult(3) on the Task when done

// This means awaiting a completed task has near-zero overhead
// Use ConfigureAwait(false) to avoid capturing SynchronizationContext
Task.Run(async () => Console.WriteLine(await ComputeAsync())).Wait();`,
    explanation: "The compiler transforms async methods into state machines; each await is a state transition. Understanding this explains why async has minimal overhead for already-completed tasks.",
  },
  {
    id: "cs-b18-b4-hot-reload",
    language: "csharp",
    title: "MetadataUpdateHandler for hot reload",
    tag: "understanding",
    code: `using System.Reflection.Metadata;

// Register a handler that .NET Hot Reload calls after code changes
[assembly: MetadataUpdateHandlerAttribute(typeof(HotReloadHandler))]

static class HotReloadHandler
{
    // Called before types are updated
    public static void ClearCache(Type[]? updatedTypes)
    {
        Console.WriteLine("Cache cleared for hot reload");
    }

    // Called after types are updated
    public static void UpdateApplication(Type[]? updatedTypes)
    {
        if (updatedTypes != null)
            foreach (var t in updatedTypes)
                Console.WriteLine($"Updated: {t.Name}");
    }
}`,
    explanation: "MetadataUpdateHandler hooks into .NET's Hot Reload pipeline; ClearCache and UpdateApplication are called on hot reload events so frameworks can invalidate caches and refresh state without restarting.",
  },
  {
    id: "cs-b18-b4-source-generators",
    language: "csharp",
    title: "Source generator output example",
    tag: "understanding",
    code: `// Source generators run at compile time and emit C# code.
// Example: [AutoNotify] generates INotifyPropertyChanged boilerplate.

// User writes:
partial class Person
{
    [AutoNotify] private string _name = "";
    [AutoNotify] private int    _age  = 0;
}

// Generator emits (not visible in editor):
// partial class Person : INotifyPropertyChanged {
//   public event PropertyChangedEventHandler? PropertyChanged;
//   public string Name { get => _name; set { if (_name != value) {
//     _name = value; PropertyChanged?.Invoke(this, new(...nameof(Name)));
//   }}}
//   ...
// }`,
    explanation: "Source generators analyze code at compile time and emit additional C# files; they eliminate reflection-based boilerplate (serializers, validators, INPC) with zero runtime overhead.",
  },
  {
    id: "cs-b18-b4-memory-barrier",
    language: "csharp",
    title: "Memory barriers and volatile",
    tag: "understanding",
    code: `using System;
using System.Threading;

class SharedState
{
    // volatile: prevents CPU/compiler reordering of reads/writes
    private volatile bool _stop = false;

    public void Worker()
    {
        while (!_stop)       // re-read from memory each loop
            Thread.SpinWait(1);
        Console.WriteLine("Stopped");
    }

    public void Stop()
    {
        _stop = true;        // visible to all threads immediately
        Thread.MemoryBarrier(); // full fence (stronger than volatile)
    }
}`,
    explanation: "volatile ensures reads/writes aren't cached in registers or reordered by the CPU for single variables; Thread.MemoryBarrier() inserts a full fence. Both prevent visibility issues in lock-free code.",
  },
  {
    id: "cs-b18-b4-pipe-reader",
    language: "csharp",
    title: "System.IO.Pipelines for high-throughput I/O",
    tag: "understanding",
    code: `using System;
using System.IO.Pipelines;
using System.Text;
using System.Threading.Tasks;

async Task ProcessPipeAsync()
{
    var pipe = new Pipe();

    async Task Writer()
    {
        byte[] msg = Encoding.UTF8.GetBytes("Hello, Pipelines!");
        await pipe.Writer.WriteAsync(msg);
        pipe.Writer.Complete();
    }

    async Task Reader()
    {
        while (true)
        {
            var result = await pipe.Reader.ReadAsync();
            var buffer = result.Buffer;
            Console.WriteLine(Encoding.UTF8.GetString(buffer));
            pipe.Reader.AdvanceTo(buffer.End);
            if (result.IsCompleted) break;
        }
    }

    await Task.WhenAll(Writer(), Reader());
}
await ProcessPipeAsync();`,
    explanation: "System.IO.Pipelines provides a high-performance I/O abstraction with back-pressure; the Pipe connects a writer and reader, sharing buffer memory efficiently without intermediate copies.",
  },

  // --- structures ---
  {
    id: "cs-b18-b4-channel-producer-consumer",
    language: "csharp",
    title: "Channel<T> for async producer-consumer",
    tag: "structures",
    code: `using System;
using System.Threading.Channels;
using System.Threading.Tasks;

var channel = Channel.CreateBounded<int>(capacity: 10);

async Task Producer()
{
    for (int i = 0; i < 20; i++)
    {
        await channel.Writer.WriteAsync(i);
        Console.WriteLine($"Produced {i}");
    }
    channel.Writer.Complete();
}

async Task Consumer()
{
    await foreach (var item in channel.Reader.ReadAllAsync())
        Console.WriteLine($"  Consumed {item}");
}

await Task.WhenAll(Producer(), Consumer());`,
    explanation: "Channel<T> is a thread-safe async queue; CreateBounded applies back-pressure when the buffer is full (WriteAsync awaits). ReadAllAsync is an async stream that exits when the writer completes.",
  },
  {
    id: "cs-b18-b4-concurrent-queue",
    language: "csharp",
    title: "ConcurrentQueue<T> for lock-free queuing",
    tag: "structures",
    code: `using System.Collections.Concurrent;
using System.Threading.Tasks;

var queue = new ConcurrentQueue<string>();

// Multiple producers
var producers = Task.WhenAll(
    Task.Run(() => queue.Enqueue("A")),
    Task.Run(() => queue.Enqueue("B")),
    Task.Run(() => queue.Enqueue("C"))
);

await producers;

// Consumer
while (queue.TryDequeue(out string? item))
    Console.WriteLine(item);

Console.WriteLine($"Remaining: {queue.Count}");  // 0`,
    explanation: "ConcurrentQueue<T> is a lock-free FIFO that uses CAS (compare-and-swap) internally; TryDequeue returns false instead of blocking when the queue is empty, suitable for polling consumers.",
  },
  {
    id: "cs-b18-b4-lazy-initialization",
    language: "csharp",
    title: "Lazy<T> for thread-safe lazy initialization",
    tag: "structures",
    code: `using System;
using System.Collections.Generic;

class Configuration
{
    private static readonly Lazy<Configuration> _instance =
        new Lazy<Configuration>(() => new Configuration(), isThreadSafe: true);

    public static Configuration Instance => _instance.Value;

    private readonly Dictionary<string, string> _settings;

    private Configuration()
    {
        Console.WriteLine("Loading configuration...");
        _settings = new Dictionary<string, string>
        {
            ["timeout"] = "30",
            ["host"]    = "localhost",
        };
    }

    public string Get(string key) => _settings.GetValueOrDefault(key, "");
}

var s1 = Configuration.Instance;  // "Loading configuration..."
var s2 = Configuration.Instance;  // no message (already loaded)
Console.WriteLine(ReferenceEquals(s1, s2));  // True`,
    explanation: "Lazy<T> defers initialization until first access and guarantees thread safety; it's the standard way to implement lazy singletons without manual double-checked locking.",
  },
  {
    id: "cs-b18-b4-blocking-collection",
    language: "csharp",
    title: "BlockingCollection<T> for bounded producer-consumer",
    tag: "structures",
    code: `using System.Collections.Concurrent;
using System.Threading;
using System.Threading.Tasks;

var collection = new BlockingCollection<int>(boundedCapacity: 5);

var producer = Task.Run(() =>
{
    for (int i = 0; i < 15; i++)
    {
        collection.Add(i);  // blocks when full
        Console.WriteLine($"Produced {i}");
    }
    collection.CompleteAdding();
});

var consumer = Task.Run(() =>
{
    foreach (var item in collection.GetConsumingEnumerable())
    {
        Thread.Sleep(50);   // slow consumer
        Console.WriteLine($"  Consumed {item}");
    }
});

await Task.WhenAll(producer, consumer);`,
    explanation: "BlockingCollection<T> wraps ConcurrentQueue with optional bounding; Add blocks when capacity is reached, applying back-pressure. GetConsumingEnumerable blocks until CompleteAdding is called.",
  },
  {
    id: "cs-b18-b4-concurrent-dict-atomic",
    language: "csharp",
    title: "ConcurrentDictionary atomic operations",
    tag: "structures",
    code: `using System.Collections.Concurrent;

var counts = new ConcurrentDictionary<string, int>();

// GetOrAdd: atomically adds if absent
counts.GetOrAdd("alice", 0);

// AddOrUpdate: atomically update or insert
counts.AddOrUpdate("alice",
    addValue:       1,
    updateValueFactory: (key, old) => old + 1);

// Repeat to accumulate
for (int i = 0; i < 10; i++)
    counts.AddOrUpdate("alice", 1, (_, old) => old + 1);

Console.WriteLine(counts["alice"]);  // 11

// TryUpdate: conditional update (CAS-like)
bool updated = counts.TryUpdate("alice", 100, counts["alice"]);
Console.WriteLine(updated);  // True`,
    explanation: "ConcurrentDictionary's AddOrUpdate and GetOrAdd are atomic composite operations; TryUpdate is a conditional CAS (compare-and-swap), allowing lock-free optimistic updates.",
  },
  {
    id: "cs-b18-b4-reader-writer-lock",
    language: "csharp",
    title: "ReaderWriterLockSlim for read-heavy concurrency",
    tag: "structures",
    code: `using System;
using System.Collections.Generic;
using System.Threading;

class ThreadSafeCache<K, V> where K : notnull
{
    private readonly Dictionary<K, V> _data = new();
    private readonly ReaderWriterLockSlim _lock = new();

    public V? Get(K key)
    {
        _lock.EnterReadLock();
        try { return _data.TryGetValue(key, out var v) ? v : default; }
        finally { _lock.ExitReadLock(); }
    }

    public void Set(K key, V value)
    {
        _lock.EnterWriteLock();
        try { _data[key] = value; }
        finally { _lock.ExitWriteLock(); }
    }
}`,
    explanation: "ReaderWriterLockSlim allows multiple concurrent readers and exclusive writers; it's more efficient than lock {} for read-heavy scenarios where writes are rare.",
  },
  {
    id: "cs-b18-b4-memory-mapped-file",
    language: "csharp",
    title: "MemoryMappedFile for large file I/O",
    tag: "structures",
    code: `using System;
using System.IO;
using System.IO.MemoryMappedFiles;

string path = Path.GetTempFileName();
File.WriteAllText(path, "Hello, Memory Mapped File!");

using var mmf = MemoryMappedFile.CreateFromFile(path, FileMode.Open);
using var accessor = mmf.CreateViewAccessor(0, 0, MemoryMappedFileAccess.Read);

// Random access without loading entire file
byte[] buf = new byte[5];
accessor.ReadArray(0, buf, 0, buf.Length);
Console.WriteLine(System.Text.Encoding.UTF8.GetString(buf));  // Hello

File.Delete(path);`,
    explanation: "MemoryMappedFile maps a file into virtual address space; random-access reads and writes operate on the mapped region without seeking or explicit buffering, efficient for large binary files.",
  },
  {
    id: "cs-b18-b4-trie-cs",
    language: "csharp",
    title: "Trie for autocomplete",
    tag: "structures",
    code: `using System.Collections.Generic;

class TrieNode
{
    public Dictionary<char, TrieNode> Children = new();
    public bool IsEnd;
}

class Trie
{
    private readonly TrieNode _root = new();

    public void Insert(string word)
    {
        var node = _root;
        foreach (char c in word)
            node = node.Children.TryGetValue(c, out var next)
                ? next : node.Children[c] = new TrieNode();
        node.IsEnd = true;
    }

    public bool Search(string word)
    {
        var node = _root;
        foreach (char c in word)
            if (!node.Children.TryGetValue(c, out node!)) return false;
        return node.IsEnd;
    }
}

var t = new Trie();
t.Insert("apple"); t.Insert("app");
Console.WriteLine(t.Search("app"));    // True
Console.WriteLine(t.Search("appl"));   // False`,
    explanation: "A Trie stores strings as tree paths; each character is an edge to a child node. Insert/search are O(L) in string length, making it O(L) lookup versus O(L·log n) for sorted sets.",
  },
  {
    id: "cs-b18-b4-graph-dijkstra",
    language: "csharp",
    title: "Dijkstra's algorithm with PriorityQueue",
    tag: "structures",
    code: `using System;
using System.Collections.Generic;

static Dictionary<int, int> Dijkstra(
    Dictionary<int, List<(int to, int w)>> graph, int src)
{
    var dist = new Dictionary<int, int> { [src] = 0 };
    var pq   = new PriorityQueue<int, int>();
    pq.Enqueue(src, 0);

    while (pq.TryDequeue(out int u, out int d))
    {
        if (!dist.TryGetValue(u, out int cur) || d > cur) continue;
        foreach (var (v, w) in graph.GetValueOrDefault(u, new()))
        {
            int newDist = d + w;
            if (!dist.TryGetValue(v, out int vd) || newDist < vd)
                pq.Enqueue(v, dist[v] = newDist);
        }
    }
    return dist;
}`,
    explanation: "Dijkstra with PriorityQueue<TElement,TPriority> (.NET 6+) runs in O((V+E) log V); the stale-entry check (d > cur) avoids reprocessing outdated queue entries without a decrease-key operation.",
  },
  {
    id: "cs-b18-b4-ring-buffer",
    language: "csharp",
    title: "Circular ring buffer",
    tag: "structures",
    code: `class RingBuffer<T>
{
    private readonly T[] _buf;
    private int _head, _count;

    public RingBuffer(int capacity) => _buf = new T[capacity];

    public bool TryEnqueue(T item)
    {
        if (_count == _buf.Length) return false;
        _buf[(_head + _count) % _buf.Length] = item;
        _count++;
        return true;
    }

    public bool TryDequeue(out T? item)
    {
        if (_count == 0) { item = default; return false; }
        item = _buf[_head];
        _head = (_head + 1) % _buf.Length;
        _count--;
        return true;
    }

    public int Count => _count;
}

var ring = new RingBuffer<int>(3);
ring.TryEnqueue(1); ring.TryEnqueue(2); ring.TryEnqueue(3);
Console.WriteLine(ring.TryEnqueue(4));  // False (full)
ring.TryDequeue(out int v); Console.WriteLine(v);  // 1`,
    explanation: "A ring buffer uses modulo arithmetic to wrap head and tail pointers around a fixed array; it provides O(1) enqueue and dequeue with zero allocations after initial construction.",
  },

  // --- caveats ---
  {
    id: "cs-b18-b4-capture-loop-variable",
    language: "csharp",
    title: "Capturing loop variables in closures",
    tag: "caveats",
    code: `using System;
using System.Collections.Generic;

var actions = new List<Action>();

// WRONG: all closures capture the same 'i' variable
for (int i = 0; i < 3; i++)
    actions.Add(() => Console.WriteLine(i));

actions.ForEach(a => a());  // 3, 3, 3 — all see final i

actions.Clear();

// RIGHT: capture a local copy
for (int i = 0; i < 3; i++)
{
    int copy = i;  // new variable per iteration
    actions.Add(() => Console.WriteLine(copy));
}

actions.ForEach(a => a());  // 0, 1, 2`,
    explanation: "Lambda closures capture the variable, not its value at the time of capture. In foreach and for loops, assigning to a local copy inside the loop body creates a new variable per iteration.",
  },
  {
    id: "cs-b18-b4-task-exception-unobserved",
    language: "csharp",
    title: "Unobserved task exceptions",
    tag: "caveats",
    code: `using System;
using System.Threading.Tasks;

// Unobserved exception handler
TaskScheduler.UnobservedTaskException += (s, e) =>
{
    Console.WriteLine($"Unobserved: {e.Exception.InnerException?.Message}");
    e.SetObserved();  // prevents crash in older .NET
};

// Fire-and-forget with no observation — exception disappears
Task.Run(() => throw new InvalidOperationException("lost!"));

await Task.Delay(100);
GC.Collect();              // triggers finalization of the abandoned task

// BETTER: always await or .ContinueWith to observe exceptions
var task = Task.Run(() => throw new InvalidOperationException("observed"));
try { await task; }
catch (Exception e) { Console.WriteLine(e.Message); }`,
    explanation: "Exceptions in fire-and-forget tasks are unobserved until the Task is GC'd; in .NET 4.5+ they're silently dropped unless TaskScheduler.UnobservedTaskException is handled. Always await or observe tasks.",
  },
  {
    id: "cs-b18-b4-string-comparison-ordinal",
    language: "csharp",
    title: "String comparison: Ordinal vs CurrentCulture",
    tag: "caveats",
    code: `using System;

string a = "resume";
string b = "résumé";

// Culture-sensitive: may return 0 (equal) depending on culture
Console.WriteLine(string.Compare(a, b, StringComparison.CurrentCultureIgnoreCase));

// Ordinal: byte-by-byte — 'e' != 'é', returns nonzero
Console.WriteLine(string.Compare(a, b, StringComparison.Ordinal));  // != 0

// For file paths, identifiers, protocol strings: always use Ordinal
bool sameKey = "API_KEY".Equals("api_key", StringComparison.OrdinalIgnoreCase);
Console.WriteLine(sameKey);  // True`,
    explanation: "Culture-sensitive string comparison can give unexpected results across locales (Turkish 'I' != 'i'). Use StringComparison.Ordinal for identifiers, file names, and keys; reserve CurrentCulture for UI text.",
  },
  {
    id: "cs-b18-b4-nullable-struct-perf",
    language: "csharp",
    title: "Nullable<T> doubles struct size",
    tag: "caveats",
    code: `using System;
using System.Runtime.InteropServices;

struct SmallPoint { public float X, Y; }

Console.WriteLine(Marshal.SizeOf<SmallPoint>());           // 8 bytes
Console.WriteLine(Marshal.SizeOf<SmallPoint?>() == 0);     // Nullable is generic

// Nullable<T> wraps with a bool HasValue flag
// In practice: sizeof(T) + alignment padding for HasValue
// For int: 4 bytes -> int? ≈ 8 bytes (int + bool + padding)

int    bare     = sizeof(int);         // 4
// int?  nullable = sizeof(int?) doesn't compile — use Unsafe.SizeOf
Console.WriteLine(System.Runtime.CompilerServices.Unsafe.SizeOf<int?>());  // 8`,
    explanation: "Nullable<T> adds a bool HasValue field; with alignment padding this can double the struct size. For large arrays of nullable value types, consider a separate bool[] or sentinel values to save memory.",
  },
  {
    id: "cs-b18-b4-interface-default-inheritance",
    language: "csharp",
    title: "Default interface methods aren't inherited by classes",
    tag: "caveats",
    code: `interface ILogger
{
    void Log(string msg);
    void LogError(string msg) => Log($"[ERR] {msg}");  // default impl
}

class SimpleLogger : ILogger
{
    public void Log(string msg) => Console.WriteLine(msg);
    // LogError is NOT implicitly inherited by the class
}

var logger = new SimpleLogger();
// logger.LogError("oops");  // compile error: SimpleLogger has no LogError

// Must cast to interface to access default impl
ILogger iLogger = logger;
iLogger.LogError("oops");  // works`,
    explanation: "Default interface method implementations are only accessible through an interface reference; classes implementing the interface don't inherit the default method into their own member set.",
  },
  {
    id: "cs-b18-b4-linq-multiple-enumeration",
    language: "csharp",
    title: "Multiple enumeration of expensive IEnumerable",
    tag: "caveats",
    code: `using System;
using System.Collections.Generic;
using System.Linq;

IEnumerable<int> Expensive()
{
    Console.WriteLine("Fetching data...");
    return Enumerable.Range(1, 5);  // pretend this hits a DB
}

var data = Expensive();     // no fetch yet (deferred)

// WRONG: two enumerations = two DB hits
int count = data.Count();   // Fetching data...
int sum   = data.Sum();     // Fetching data...

// RIGHT: materialize once
var materialized = Expensive().ToList();  // Fetching data... (once)
int c = materialized.Count;
int s = materialized.Sum();`,
    explanation: "IEnumerable<T> is lazy; every enumeration re-evaluates the query. Calling .Count() then .Sum() hits the source twice. Materialize with .ToList() or .ToArray() when you'll enumerate multiple times.",
  },
  {
    id: "cs-b18-b4-enum-parsing",
    language: "csharp",
    title: "Enum.Parse vs Enum.TryParse",
    tag: "caveats",
    code: `using System;

enum Color { Red, Green, Blue }

// Parse throws on invalid input
try
{
    Color bad = (Color)Enum.Parse(typeof(Color), "Purple");
}
catch (ArgumentException e)
{
    Console.WriteLine(e.Message);  // 'Purple' is not a valid value for Color
}

// TryParse is safe
if (Enum.TryParse<Color>("Green", out Color c))
    Console.WriteLine(c);   // Green

// Beware: cast from int doesn't validate membership!
Color invalid = (Color)99;
Console.WriteLine(invalid);              // 99
Console.WriteLine(Enum.IsDefined(typeof(Color), invalid));  // False`,
    explanation: "Enum.Parse throws on invalid input; Enum.TryParse is the safe alternative. Casting from int always succeeds without validating membership — use Enum.IsDefined to check if a value is a named member.",
  },

  // --- types ---
  {
    id: "cs-b18-b4-generic-interface-pattern",
    language: "csharp",
    title: "Generic interfaces with covariant output",
    tag: "types",
    code: `using System.Collections.Generic;

// out T: covariant — IEnumerable<Dog> assignable to IEnumerable<Animal>
interface IReadRepository<out T>
{
    T? GetById(int id);
    IEnumerable<T> GetAll();
}

class Animal { public string Name { get; set; } = ""; }
class Dog : Animal { public string Breed { get; set; } = ""; }

class DogRepo : IReadRepository<Dog>
{
    private static readonly List<Dog> _dogs = new() { new Dog { Name = "Rex" } };
    public Dog?        GetById(int id) => _dogs.Find(d => d.Name.Length == id);
    public IEnumerable<Dog> GetAll()   => _dogs;
}

IReadRepository<Animal> repo = new DogRepo();  // covariant upcast
Console.WriteLine(repo.GetAll().First().Name); // Rex`,
    explanation: "The out modifier on a generic interface parameter enables covariant assignment; IReadRepository<Dog> is substitutable for IReadRepository<Animal> because Dog is-an Animal.",
  },
  {
    id: "cs-b18-b4-abstract-class-vs-interface",
    language: "csharp",
    title: "Abstract class vs interface trade-offs",
    tag: "types",
    code: `// Interface: no state, multiple implementation, versioning-fragile
interface IShape
{
    double Area();
    double Perimeter();
    // C# 8+: can have default implementations
    string Describe() => $"Area={Area():F2}";
}

// Abstract class: can have state, single inheritance, reuse logic
abstract class BaseShape
{
    public abstract double Area();
    public string Category { get; set; } = "2D";

    protected double RoundTo2(double v) => Math.Round(v, 2);
}

class Circle2(double r) : BaseShape, IShape
{
    public override double Area()      => Math.PI * r * r;
    public double Perimeter()          => 2 * Math.PI * r;
}`,
    explanation: "Use interfaces when you need multiple contracts or structural typing; use abstract classes when you want shared state, partial implementations, or method visibility control. C# allows both together.",
  },
  {
    id: "cs-b18-b4-where-new-notnull",
    language: "csharp",
    title: "notnull and class/struct constraints",
    tag: "types",
    code: `#nullable enable
using System;

// notnull: T can't be nullable reference or nullable value type
static T RequireNonNull<T>(T? value, string name) where T : notnull
{
    if (value is null) throw new ArgumentNullException(name);
    return value;
}

// class constraint: T must be a reference type (enables null check)
static T? FindFirst<T>(System.Collections.Generic.IEnumerable<T> items,
    Func<T, bool> predicate) where T : class
    => System.Linq.Enumerable.FirstOrDefault(items, predicate);

// struct constraint: T must be a value type (no null)
static T Default<T>() where T : struct => default;

Console.WriteLine(Default<int>());      // 0
Console.WriteLine(Default<DateTime>()); // 01/01/0001`,
    explanation: "notnull accepts both reference and value types but excludes nullable forms; class enables nullable returns (T?); struct enables default(T) and excludes boxing/inheritance.",
  },
  {
    id: "cs-b18-b4-type-forward",
    language: "csharp",
    title: "Type forwarding with TypeForwardedTo",
    tag: "types",
    code: `// When you move a type from Assembly A to Assembly B,
// add this to Assembly A to preserve binary compatibility:

// [assembly: TypeForwardedTo(typeof(NewAssembly.MyClass))]

// Example usage context:
// OldLibrary.dll originally contained: namespace OldLib { class Config {} }
// NewLibrary.dll now contains it.
// OldLibrary.dll adds: [assembly: TypeForwardedTo(typeof(NewLib.Config))]
// Now code compiled against OldLibrary.dll still works at runtime.

// Check at runtime
Type t = typeof(string);
Console.WriteLine(t.Assembly.FullName);    // shows actual assembly
Console.WriteLine(t.FullName);             // System.String`,
    explanation: "TypeForwardedTo allows moving a type to a new assembly while maintaining binary compatibility; old code compiled against the original assembly resolves the type in the new location at runtime.",
  },
  {
    id: "cs-b18-b4-open-generic",
    language: "csharp",
    title: "Open generic types and reflection",
    tag: "types",
    code: `using System;
using System.Collections.Generic;

// Open generic type: List<T> with T unbound
Type openList = typeof(List<>);
Console.WriteLine(openList.IsGenericTypeDefinition);  // True
Console.WriteLine(openList.GetGenericArguments()[0].Name);  // T

// Closed generic type: List<int>
Type closedList = typeof(List<int>);
Console.WriteLine(closedList.IsConstructedGenericType);  // True

// Make closed type at runtime
Type closedString = openList.MakeGenericType(typeof(string));
var list = (List<string>)Activator.CreateInstance(closedString)!;
list.Add("hello");
Console.WriteLine(list[0]);  // hello`,
    explanation: "typeof(List<>) is an open generic type definition; MakeGenericType() closes it with specific type arguments at runtime, enabling generic factories in DI containers and serializers.",
  },

  // --- families ---
  {
    id: "cs-b18-b4-minimal-api",
    language: "csharp",
    title: "ASP.NET Core Minimal APIs",
    tag: "families",
    code: `using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddSingleton<TodoService>();

var app = builder.Build();

app.MapGet("/todos", (TodoService svc) => svc.GetAll());
app.MapGet("/todos/{id:int}", (int id, TodoService svc) =>
    svc.Get(id) is { } todo ? Results.Ok(todo) : Results.NotFound());
app.MapPost("/todos", (Todo todo, TodoService svc) =>
{
    svc.Add(todo);
    return Results.Created($"/todos/{todo.Id}", todo);
});

// app.Run();

record Todo(int Id, string Title, bool Done = false);

class TodoService
{
    private readonly List<Todo> _todos = new();
    public IEnumerable<Todo> GetAll() => _todos;
    public Todo? Get(int id) => _todos.Find(t => t.Id == id);
    public void Add(Todo t) => _todos.Add(t);
}`,
    explanation: "Minimal APIs register routes with MapGet/Post/Put/Delete without controllers; parameter binding (route, query, body, DI) is automatic based on the delegate signature.",
  },
  {
    id: "cs-b18-b4-output-caching",
    language: "csharp",
    title: "Output caching in ASP.NET Core",
    tag: "families",
    code: `using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.OutputCaching;
using Microsoft.Extensions.DependencyInjection;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddOutputCache(options =>
{
    options.AddBasePolicy(b => b.Cache());
    options.AddPolicy("expire30", b => b.Expire(TimeSpan.FromSeconds(30)));
});

var app = builder.Build();
app.UseOutputCache();

// Cache for 30 seconds, vary by query param
app.MapGet("/products", (string? category) => new[] { "Widget", "Gadget" })
   .CacheOutput("expire30");

// Invalidate cache by tag
app.MapPost("/products", (IOutputCacheStore store) =>
    store.EvictByTagAsync("products", default));

// app.Run();`,
    explanation: "Output caching (.NET 7+) caches full HTTP responses; policies define expiry, vary-by rules, and tags. EvictByTagAsync allows programmatic cache invalidation when data changes.",
  },
  {
    id: "cs-b18-b4-rate-limiting",
    language: "csharp",
    title: "Rate limiting middleware (.NET 7+)",
    tag: "families",
    code: `using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.DependencyInjection;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddRateLimiter(options =>
{
    options.AddFixedWindowLimiter("api", o =>
    {
        o.PermitLimit         = 10;
        o.Window              = TimeSpan.FromSeconds(1);
        o.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        o.QueueLimit          = 5;
    });

    options.RejectionStatusCode = 429;
});

var app = builder.Build();
app.UseRateLimiter();

app.MapGet("/data", () => "OK").RequireRateLimiting("api");

// app.Run();`,
    explanation: "ASP.NET Core 7+'s built-in rate limiting middleware supports fixed window, sliding window, token bucket, and concurrency limiters; policies are named and applied per route or globally.",
  },
  {
    id: "cs-b18-b4-health-checks",
    language: "csharp",
    title: "Health checks in ASP.NET Core",
    tag: "families",
    code: `using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using System.Threading;
using System.Threading.Tasks;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddHealthChecks()
    .AddCheck("self", () => HealthCheckResult.Healthy("App is running"))
    .AddCheck<DbHealthCheck>("database");

var app = builder.Build();
app.MapHealthChecks("/health");
app.MapHealthChecks("/health/ready", new HealthCheckOptions
{
    Predicate = check => check.Tags.Contains("ready"),
});
// app.Run();

class DbHealthCheck : IHealthCheck
{
    public Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext ctx, CancellationToken ct)
        => Task.FromResult(HealthCheckResult.Healthy("DB is reachable"));
}`,
    explanation: "ASP.NET Core health checks expose liveness and readiness endpoints for Kubernetes probes; custom IHealthCheck implementations test specific dependencies like databases or external services.",
  },
  {
    id: "cs-b18-b4-aspire-service-defaults",
    language: "csharp",
    title: ".NET Aspire service defaults",
    tag: "families",
    code: `// In your host project Program.cs:
// var builder = DistributedApplication.CreateBuilder(args);
// var api = builder.AddProject<Projects.MyApi>("api");
// builder.AddProject<Projects.MyWorker>("worker")
//     .WithReference(api);
// builder.Build().Run();

// In each service, call AddServiceDefaults():
// builder.AddServiceDefaults();
// This configures:
// - OpenTelemetry tracing and metrics
// - Health check endpoints (/health, /alive)
// - Service discovery (for .WithReference())
// - Resilience (HTTP retry/circuit breaker)

// Service discovery usage:
// var client = factory.CreateClient("api");
// var result = await client.GetStringAsync("/data");  // resolved by name`,
    explanation: ".NET Aspire's AddServiceDefaults() wire up observability, health checks, and service discovery in one call; the AppHost orchestrates services and injects connection strings at launch.",
  },
  {
    id: "cs-b18-b4-opentelemetry",
    language: "csharp",
    title: "OpenTelemetry distributed tracing",
    tag: "families",
    code: `using System.Diagnostics;
using OpenTelemetry;
using OpenTelemetry.Trace;

// Define an ActivitySource (one per library/service)
static readonly ActivitySource Source = new("MyService", "1.0.0");

// Configure the tracer (usually in startup)
using var tracerProvider = Sdk.CreateTracerProviderBuilder()
    .AddSource("MyService")
    .AddConsoleExporter()
    .Build();

// Instrument code with spans
using var activity = Source.StartActivity("ProcessOrder");
activity?.SetTag("order.id", 42);
activity?.SetTag("order.total", 99.99);

// Child span
using var child = Source.StartActivity("ValidatePayment");
child?.SetStatus(ActivityStatusCode.Ok);`,
    explanation: "OpenTelemetry uses ActivitySource to emit distributed traces; each StartActivity creates a span that propagates context across service boundaries. Tags enrich spans with domain-specific metadata.",
  },

  // --- classes ---
  {
    id: "cs-b18-b4-pipeline-pattern",
    language: "csharp",
    title: "Pipeline pattern with middleware",
    tag: "classes",
    code: `using System;
using System.Threading.Tasks;

delegate Task Middleware(HttpContext ctx, Func<Task> next);

class HttpContext { public string Path { get; set; } = ""; public int Status { get; set; } = 200; }

class Pipeline
{
    private readonly System.Collections.Generic.List<Middleware> _middlewares = new();

    public Pipeline Use(Middleware mw) { _middlewares.Add(mw); return this; }

    public Task Run(HttpContext ctx)
    {
        int idx = 0;
        Task Next() => idx < _middlewares.Count
            ? _middlewares[idx++](ctx, Next)
            : Task.CompletedTask;
        return Next();
    }
}

var pipeline = new Pipeline()
    .Use(async (ctx, next) => { Console.WriteLine("Before"); await next(); Console.WriteLine("After"); })
    .Use(async (ctx, next) => { Console.WriteLine("Handler"); ctx.Status = 200; await next(); });

await pipeline.Run(new HttpContext { Path = "/" });`,
    explanation: "The pipeline/middleware pattern chains request handlers; each middleware calls next() to pass control forward, enabling logging, auth, and error handling as composable, ordered stages.",
  },
  {
    id: "cs-b18-b4-specification-pattern",
    language: "csharp",
    title: "Specification pattern for business rules",
    tag: "classes",
    code: `using System;
using System.Linq.Expressions;

abstract class Specification<T>
{
    public abstract Expression<Func<T, bool>> ToExpression();

    public bool IsSatisfiedBy(T entity) => ToExpression().Compile()(entity);

    public Specification<T> And(Specification<T> other) => new AndSpec<T>(this, other);
}

class AndSpec<T>(Specification<T> left, Specification<T> right) : Specification<T>
{
    public override Expression<Func<T, bool>> ToExpression()
    {
        var param = Expression.Parameter(typeof(T));
        var body  = Expression.AndAlso(
            Expression.Invoke(left.ToExpression(),  param),
            Expression.Invoke(right.ToExpression(), param));
        return Expression.Lambda<Func<T, bool>>(body, param);
    }
}

record Product(string Name, decimal Price, bool InStock);

class PriceSpec(decimal max) : Specification<Product>
{
    public override Expression<Func<Product, bool>> ToExpression() => p => p.Price <= max;
}

class InStockSpec : Specification<Product>
{
    public override Expression<Func<Product, bool>> ToExpression() => p => p.InStock;
}

var spec = new PriceSpec(20m).And(new InStockSpec());
Console.WriteLine(spec.IsSatisfiedBy(new Product("Widget", 15m, true)));   // True
Console.WriteLine(spec.IsSatisfiedBy(new Product("Gadget", 25m, true)));   // False`,
    explanation: "Specifications encapsulate business rules as expression trees; the And/Or combinators compose them, and ToExpression() makes them usable in LINQ-to-SQL queries as well as in-memory.",
  },
  {
    id: "cs-b18-b4-unit-of-work",
    language: "csharp",
    title: "Unit of Work pattern",
    tag: "classes",
    code: `using System.Threading.Tasks;

interface IUnitOfWork
{
    IUserRepository Users    { get; }
    IOrderRepository Orders  { get; }
    Task<int> CommitAsync();
}

interface IUserRepository  { /* ... */ }
interface IOrderRepository { /* ... */ }

class AppUnitOfWork(AppDbContext db) : IUnitOfWork
{
    public IUserRepository  Users  { get; } = new UserRepository(db);
    public IOrderRepository Orders { get; } = new OrderRepository(db);

    public Task<int> CommitAsync() => db.SaveChangesAsync();
}

// EF Core's DbContext IS already a Unit of Work + Repository
// This pattern adds explicit coordination and transaction boundary
class AppDbContext : Microsoft.EntityFrameworkCore.DbContext {}
class UserRepository(AppDbContext db) : IUserRepository {}
class OrderRepository(AppDbContext db) : IOrderRepository {}`,
    explanation: "Unit of Work groups repository operations into a transaction boundary; CommitAsync flushes all accumulated changes atomically. EF Core's DbContext already implements this pattern internally.",
  },
  {
    id: "cs-b18-b4-event-sourcing",
    language: "csharp",
    title: "Event sourcing with append-only store",
    tag: "classes",
    code: `using System;
using System.Collections.Generic;

abstract record DomainEvent(Guid Id, DateTime OccurredAt);
record OrderPlaced(Guid Id, DateTime At, string Product, int Qty) : DomainEvent(Id, At);
record OrderShipped(Guid Id, DateTime At, string TrackingNo) : DomainEvent(Id, At);

class OrderAggregate
{
    private readonly List<DomainEvent> _events = new();
    public string? Product;
    public bool    Shipped;

    public void Apply(DomainEvent evt)
    {
        _events.Add(evt);
        switch (evt)
        {
            case OrderPlaced  e: Product = e.Product; break;
            case OrderShipped e: Shipped = true;       break;
        }
    }

    public IReadOnlyList<DomainEvent> Events => _events;
}

var order = new OrderAggregate();
order.Apply(new OrderPlaced(Guid.NewGuid(), DateTime.UtcNow, "Widget", 2));
order.Apply(new OrderShipped(Guid.NewGuid(), DateTime.UtcNow, "TRACK123"));
Console.WriteLine($"{order.Product} shipped: {order.Shipped}");`,
    explanation: "Event sourcing stores state as a sequence of domain events; the aggregate replays events to rebuild current state. Events are immutable and append-only, providing a full audit trail.",
  },
];
