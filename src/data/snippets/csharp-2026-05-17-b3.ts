import type { Snippet } from "./types";

export const csharpSnippets20260517B3: Snippet[] = [
  // === snippet ===
  {
    id: "cs-b17-b3-linq-zip",
    language: "csharp",
    title: "LINQ Zip — pair elements from two sequences",
    tag: "snippet",
    code: `using System.Linq;

int[] nums = [1, 2, 3];
string[] words = ["one", "two", "three"];

var pairs = nums.Zip(words, (n, w) => \`\${n}=\${w}\`);
Console.WriteLine(string.Join(", ", pairs));  // 1=one, 2=two, 3=three

// .NET 6+ overload: returns tuples
var tuples = nums.Zip(words);
foreach (var (n, w) in tuples)
    Console.WriteLine(n, w);`,
    explanation: "`Enumerable.Zip` pairs elements from two sequences by position, stopping at the shorter sequence; the result-selector overload lets you project each pair into any output type.",
  },
  {
    id: "cs-b17-b3-linq-chunk",
    language: "csharp",
    title: "LINQ Chunk — split sequence into fixed-size batches",
    tag: "snippet",
    code: `using System.Linq;

int[] data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// Split into batches of 3:
foreach (int[] batch in data.Chunk(3))
    Console.WriteLine(string.Join(", ", batch));
// 1, 2, 3
// 4, 5, 6
// 7, 8, 9
// 10`,
    explanation: "`Enumerable.Chunk(n)` (.NET 6+) splits the sequence into arrays of at most `n` elements — the last chunk may be smaller if the sequence length isn't divisible by `n`.",
  },
  {
    id: "cs-b17-b3-linq-distinct-by",
    language: "csharp",
    title: "LINQ DistinctBy — deduplicate by a key",
    tag: "snippet",
    code: `using System.Linq;

var people = new[]
{
    (Name: "Alice", Dept: "Eng"),
    (Name: "Bob",   Dept: "HR"),
    (Name: "Carol", Dept: "Eng"),
};

// Keep first occurrence of each department:
var firstPerDept = people.DistinctBy(p => p.Dept);

foreach (var p in firstPerDept)
    Console.WriteLine(p.Name);
// Alice
// Bob`,
    explanation: "`DistinctBy(keySelector)` (.NET 6+) removes duplicates based on a projected key, keeping the first element that produces each distinct key value — without needing a custom `IEqualityComparer`.",
  },
  {
    id: "cs-b17-b3-linq-order-by",
    language: "csharp",
    title: "LINQ OrderBy / ThenBy chaining",
    tag: "snippet",
    code: `using System.Linq;

var people = new[] {
    (Name: "Carol", Age: 30, Dept: "Eng"),
    (Name: "Alice", Age: 25, Dept: "HR"),
    (Name: "Bob",   Age: 30, Dept: "Eng"),
    (Name: "Dave",  Age: 25, Dept: "Eng"),
};

var sorted = people
    .OrderBy(p => p.Age)
    .ThenBy(p => p.Dept)
    .ThenBy(p => p.Name);

foreach (var p in sorted)
    Console.WriteLine(\`\${p.Age} \${p.Dept} \${p.Name}\`);`,
    explanation: "`OrderBy` establishes the primary sort; `ThenBy` adds secondary, tertiary, etc. sort keys — each `ThenBy` is applied only to elements that compare equal under all previous keys.",
  },
  {
    id: "cs-b17-b3-record-deconstruct",
    language: "csharp",
    title: "Record Deconstruct for pattern matching",
    tag: "snippet",
    code: `record Point(double X, double Y);
record Circle(Point Center, double Radius);

var shape = new Circle(new Point(1, 2), 5);

// Deconstruct in switch:
string Describe(Circle c) => c switch
{
    { Center: (0, 0), Radius: var r } => \`circle at origin, r=\${r}\`,
    { Radius: > 10 }                  => "large circle",
    var (center, r)                   => \`circle at \${center}, r=\${r}\`,
};

Console.WriteLine(Describe(shape));  // circle at Point { X = 1, Y = 2 }, r=5`,
    explanation: "Records auto-generate a `Deconstruct` method matching their primary constructor; this allows positional destructuring in `var (x, y)` patterns and property patterns like `(0, 0)` in switch expressions.",
  },
  {
    id: "cs-b17-b3-string-span-tokenize",
    language: "csharp",
    title: "MemoryExtensions.Split for allocation-free tokenizing",
    tag: "snippet",
    code: `using System;

ReadOnlySpan<char> csv = "alice,30,engineer".AsSpan();

// Iterate over comma-delimited tokens without allocating substrings:
foreach (Range range in csv.Split(','))
{
    ReadOnlySpan<char> token = csv[range];
    Console.WriteLine(token.ToString());
}
// alice
// 30
// engineer`,
    explanation: "`MemoryExtensions.Split(delimiter)` returns a `SpanSplitEnumerator` that yields `Range` values — indexing the original span with each range gives a token without any allocation.",
  },
  {
    id: "cs-b17-b3-pattern-list",
    language: "csharp",
    title: "List patterns for matching sequences",
    tag: "snippet",
    code: `int[] nums = [1, 2, 3, 4, 5];

// Exact match:
if (nums is [1, 2, 3, 4, 5]) Console.WriteLine("exact");

// Starts with:
if (nums is [1, 2, ..]) Console.WriteLine("starts with 1, 2");

// Ends with:
if (nums is [.., 4, 5]) Console.WriteLine("ends with 4, 5");

// Capture middle:
if (nums is [var first, ..var middle, var last])
    Console.WriteLine(\`first=\${first} last=\${last} middle count=\${middle.Length}\`);`,
    explanation: "List patterns (`[...]`) match sequences by position and element count; `..` is a slice that matches zero or more elements and can optionally bind the matched slice to a variable.",
  },
  {
    id: "cs-b17-b3-throw-expression",
    language: "csharp",
    title: "throw as an expression in ternary and ?? chains",
    tag: "snippet",
    code: `string? input = null;

// throw expression in ?? chain:
string value = input ?? throw new ArgumentNullException(nameof(input));

// throw expression in ternary:
int Parse(string s) =>
    int.TryParse(s, out int n) ? n : throw new FormatException(\`'\${s}' is not a number\`);

// throw expression in => method body:
class Config
{
    private string? _host;
    public string Host => _host ?? throw new InvalidOperationException("not initialized");
}`,
    explanation: "`throw` can appear as an expression (not just a statement) in ternary operators, null-coalescing chains, and expression-bodied members — enabling guard clauses without standalone `if` blocks.",
  },
  {
    id: "cs-b17-b3-linq-first-default",
    language: "csharp",
    title: "FirstOrDefault with a default value (overload)",
    tag: "snippet",
    code: `using System.Linq;

int[] nums = [5, 3, 8, 1, 4];

// FirstOrDefault without args: returns default(T) = 0 for int
int first10 = nums.FirstOrDefault(n => n > 10);
Console.WriteLine(first10);   // 0 — not found, no way to distinguish!

// .NET 6+: FirstOrDefault with explicit default
int first10Alt = nums.FirstOrDefault(n => n > 10, defaultValue: -1);
Console.WriteLine(first10Alt);  // -1 — clearly 'not found'

// SingleOrDefault behaves the same:
int? single = nums.Cast<int?>().SingleOrDefault(n => n > 100);`,
    explanation: "`FirstOrDefault(predicate, defaultValue)` (.NET 6+) accepts an explicit default, eliminating the ambiguity between 'not found' and 'found a zero/null' that plagued the two-argument overload.",
  },
  {
    id: "cs-b17-b3-math-divrem",
    language: "csharp",
    title: "Math.DivRem returns quotient and remainder together",
    tag: "snippet",
    code: `// Single call returns both quotient and remainder:
(int quotient, int remainder) = Math.DivRem(17, 5);
Console.WriteLine(\`17 / 5 = \${quotient} remainder \${remainder}\`);
// 17 / 5 = 3 remainder 2

// Also available for long:
(long q, long r) = Math.DivRem(100L, 7L);
Console.WriteLine(\`q=\${q} r=\${r}\`);  // q=14 r=2

// Before .NET 6: Math.DivRem(17, 5, out int rem) — out parameter style`,
    explanation: "`Math.DivRem` computes both the quotient and remainder in a single operation (matching CPU instructions); the .NET 6 tuple-return overload is cleaner than the legacy `out` parameter style.",
  },
  {
    id: "cs-b17-b3-string-equals-span",
    language: "csharp",
    title: "MemoryExtensions.Equals for zero-alloc string comparison",
    tag: "snippet",
    code: `using System;

ReadOnlySpan<char> span = "Hello World".AsSpan();

// Compare a span region without allocating a substring:
bool startsHello = span[..5].Equals("Hello", StringComparison.Ordinal);
Console.WriteLine(startsHello);   // True

// Case-insensitive span comparison:
bool hasWorld = span[6..].Equals("world", StringComparison.OrdinalIgnoreCase);
Console.WriteLine(hasWorld);   // True`,
    explanation: "`ReadOnlySpan<char>.Equals(string, StringComparison)` compares the span to a string without allocating a substring, enabling zero-allocation comparison of substrings in parsing hot paths.",
  },
  {
    id: "cs-b17-b3-interlock",
    language: "csharp",
    title: "Interlocked for lock-free atomic operations",
    tag: "snippet",
    code: `using System.Threading;

int counter = 0;

// Thread-safe increment without a lock:
Parallel.For(0, 1000, _ => Interlocked.Increment(ref counter));
Console.WriteLine(counter);   // 1000

// CompareExchange: set if current equals expected (CAS):
int value = 5;
int prev = Interlocked.CompareExchange(ref value, 10, 5);
Console.WriteLine(value);   // 10  (was 5, now set to 10)
Console.WriteLine(prev);    // 5   (original value)`,
    explanation: "`Interlocked` methods are atomic CPU instructions that avoid locking — `Increment/Decrement/Add` are standard counters; `CompareExchange` implements a CAS loop for lock-free state machines.",
  },
  {
    id: "cs-b17-b3-objectpool",
    language: "csharp",
    title: "ObjectPool<T> for reusing expensive objects",
    tag: "snippet",
    code: `using Microsoft.Extensions.ObjectPool;

// DefaultObjectPool uses a stack internally:
var pool = new DefaultObjectPool<System.Text.StringBuilder>(
    new StringBuilderPooledObjectPolicy());

// Rent an object:
var sb = pool.Get();
try
{
    sb.Append("Hello");
    sb.Append(", World!");
    Console.WriteLine(sb.ToString());  // Hello, World!
}
finally
{
    pool.Return(sb);   // returns to pool (sb is cleared)
}`,
    explanation: "`ObjectPool<T>` (Microsoft.Extensions.ObjectPool) maintains a pool of reusable objects; `Get()` returns an instance (creating one if empty) and `Return()` puts it back — reducing GC pressure for expensive-to-create objects.",
  },
  {
    id: "cs-b17-b3-span-sort",
    language: "csharp",
    title: "Span<T>.Sort() sorts in place without allocation",
    tag: "snippet",
    code: `int[] data = [5, 2, 8, 1, 9, 3];

// Sort the full array:
Span<int> span = data;
span.Sort();
Console.WriteLine(string.Join(", ", data));   // 1, 2, 3, 5, 8, 9

// Sort a slice in place:
data = [5, 2, 8, 1, 9, 3];
data.AsSpan(1, 4).Sort();   // sort elements at index 1..4
Console.WriteLine(string.Join(", ", data));   // 5, 1, 2, 8, 9, 3`,
    explanation: "`Span<T>.Sort()` sorts the contents in place using an introspective sort — since it operates on a `Span`, it can sort any contiguous memory including array slices, stack-allocated arrays, and `MemoryMarshal` views.",
  },
  {
    id: "cs-b17-b3-interpolated-string-handler",
    language: "csharp",
    title: "Interpolated string handlers avoid allocation in hot paths",
    tag: "snippet",
    code: `using System.Runtime.CompilerServices;

// Logging API that accepts an interpolated string handler:
static class Logger
{
    public static bool IsEnabled = false;

    public static void Log(
        [InterpolatedStringHandlerArgument("")]
        ref DefaultInterpolatedStringHandler handler)
    {
        if (!IsEnabled) return;   // if disabled, handler was never built!
        Console.WriteLine(handler.ToStringAndClear());
    }
}

// No string allocation when disabled:
Logger.Log(\`expensive data: \${string.Join(",", Enumerable.Range(0, 1000))}\`);`,
    explanation: "Custom interpolated string handlers avoid constructing the formatted string unless it will actually be used — loggers and assertion libraries use this so disabled logging/assertions have zero allocation overhead.",
  },
  // === understanding ===
  {
    id: "cs-b17-b3-exception-filter",
    language: "csharp",
    title: "Exception filters with 'when' avoid catching then rethrowing",
    tag: "understanding",
    code: `// Without filter — loses original stack trace on rethrow:
try { ThrowSomething(); }
catch (Exception ex)
{
    if (ex.Message.Contains("transient")) throw;   // rethrows, OK
    Handle(ex);
}

// With 'when' filter — never enters catch for transient errors:
try { ThrowSomething(); }
catch (Exception ex) when (!ex.Message.Contains("transient"))
{
    Handle(ex);
}

static void ThrowSomething() => throw new InvalidOperationException("transient failure");
static void Handle(Exception ex) => Console.WriteLine("handled: " + ex.Message);`,
    explanation: "`when (condition)` evaluates the condition in the stack context of the throw site (before unwinding) — if false, the catch is skipped entirely without disturbing the stack trace; this is more precise than catch-then-rethrow.",
  },
  {
    id: "cs-b17-b3-interface-explicit-override",
    language: "csharp",
    title: "Explicit interface implementation prevents accidental use",
    tag: "understanding",
    code: `interface IComparable<T> { int CompareTo(T other); }

class Priority : IComparable<Priority>
{
    public int Level { get; }
    public Priority(int level) => Level = level;

    // Explicit — only accessible via interface reference:
    int IComparable<Priority>.CompareTo(Priority other)
        => Level.CompareTo(other.Level);
}

Priority a = new(3), b = new(5);

// a.CompareTo(b);   // compile error — not accessible directly

IComparable<Priority> ca = a;
Console.WriteLine(ca.CompareTo(b));   // -1 (3 < 5)

// Array.Sort works because it uses the interface:
Priority[] arr = [new(5), new(1), new(3)];
Array.Sort(arr);   // sorts via IComparable<Priority>`,
    explanation: "Explicit implementation hides a method from the class's public surface, forcing consumers to work through the interface — useful when the implementation is a contract fulfillment that shouldn't be part of the class's natural API.",
  },
  {
    id: "cs-b17-b3-covariant-return",
    language: "csharp",
    title: "Covariant return types in overrides (C# 9+)",
    tag: "understanding",
    code: `class Animal
{
    public virtual Animal Create() => new Animal();
}

class Dog : Animal
{
    // Return type is more derived — covariant return:
    public override Dog Create() => new Dog();
}

Dog dog = new Dog();
Dog pup = dog.Create();   // type is Dog, not Animal!

// Compare: before C# 9, override had to return Animal:
// public override Animal Create() => new Dog();   // old way`,
    explanation: "C# 9 allows override methods to return a more derived type than the base method — this is covariant return types; callers through a `Dog` reference get `Dog` without a cast, while `Animal` callers still get `Animal`.",
  },
  {
    id: "cs-b17-b3-target-typed-switch",
    language: "csharp",
    title: "Target-typed switch expression infers common type",
    tag: "understanding",
    code: `record Point(int X, int Y);
record Circle(Point Center, double Radius);

// Both branches return different types but share a common base:
object shape = true
    ? new Point(0, 0)           // Point
    : (object)new Circle(new Point(1, 1), 5.0);  // Circle

// Switch expression with target-typed new():
double result = (new Random().Next(2)) switch
{
    0 => Math.PI,               // double
    _ => 0,                     // int promoted to double
};`,
    explanation: "The compiler infers a switch expression's type from the best common type of all arms; if arms have different types, an explicit target type (the variable's declared type) guides the inference and may trigger implicit conversions.",
  },
  {
    id: "cs-b17-b3-static-local-function",
    language: "csharp",
    title: "static local functions prevent accidental closure",
    tag: "understanding",
    code: `int counter = 0;

// Regular local function — can close over 'counter':
void Increment() => counter++;

// static local function — CANNOT capture outer variables:
static int Double(int x) => x * 2;   // compiler enforces no capture

// Use static local functions for helper logic that shouldn't
// accidentally capture and pin outer objects in memory:
void Process(List<int> items)
{
    // static ensures 'items' is not accidentally captured:
    static bool IsPositive(int n) => n > 0;
    var result = items.Where(IsPositive);
}`,
    explanation: "`static` local functions cannot capture any variables from the enclosing scope — the compiler enforces this; use them for nested helpers that should be pure to prevent accidental allocations from closures.",
  },
  {
    id: "cs-b17-b3-sealed-record",
    language: "csharp",
    title: "Sealed records and equality",
    tag: "understanding",
    code: `// Non-sealed record: Equals checks runtime type
record Base(int X);
record Child(int X, int Y) : Base(X);

Base b = new Base(1);
Child c = new Child(1, 2);

// Base.Equals compares EqualityContract (runtime type):
Console.WriteLine(b.Equals(new Base(1)));   // True — same type, same X
Console.WriteLine(b.Equals(c));             // False — different EqualityContracts

// sealed record: no subtyping — simpler equality
sealed record Point(int X, int Y);
// class Sub : Point { }  // compile error`,
    explanation: "Record equality checks `EqualityContract` (the runtime type) before comparing values, so a base record and a derived record are never equal — `sealed` records prevent this complexity by disallowing inheritance.",
  },
  {
    id: "cs-b17-b3-implicit-conversions-numeric",
    language: "csharp",
    title: "Implicit numeric conversions and widening rules",
    tag: "understanding",
    code: `// Safe widening conversions (implicit):
byte  b = 100;
short s = b;   // byte -> short
int   i = s;   // short -> int
long  l = i;   // int -> long
float f = l;   // long -> float (may lose precision for large values!)
double d = f;  // float -> double

// NOT safe (require explicit cast):
int   big = 300;
byte  small = (byte)big;   // truncates: 300 % 256 = 44
Console.WriteLine(small);  // 44`,
    explanation: "C# allows implicit widening (byte→short→int→long→float→double) because the target type can represent all values of the source type; narrowing (int→byte) requires an explicit cast because data loss is possible.",
  },
  {
    id: "cs-b17-b3-struct-interface",
    language: "csharp",
    title: "Struct implementing an interface boxes when stored as interface",
    tag: "understanding",
    code: `interface IValue { int Get(); }

struct MyInt : IValue
{
    private int _v;
    public MyInt(int v) => _v = v;
    public int Get() => _v;
    public void Set(int v) => _v = v;  // modifies struct
}

MyInt s = new(42);
IValue iv = s;   // BOXING — iv holds a heap copy of s

s.Set(99);       // modifies s
Console.WriteLine(s.Get());   // 99  — the original struct
Console.WriteLine(iv.Get());  // 42  — the boxed COPY is unchanged`,
    explanation: "Assigning a struct to an interface variable creates a heap copy (boxing); mutations to the original struct are invisible through the boxed copy — use classes for mutable objects stored behind interface references.",
  },
  {
    id: "cs-b17-b3-generic-new-constraint",
    language: "csharp",
    title: "new() constraint enables constructing T in generic code",
    tag: "understanding",
    code: `// Without new() — cannot do 'new T()':
// T Create<T>() => new T();   // compile error

// With new() constraint:
T Create<T>() where T : new() => new T();

class Config { public Config() { } }
struct Point { }  // structs always have parameterless ctor

var c = Create<Config>();
var p = Create<Point>();

// Useful for factory generics:
T CreateAndInit<T>(Action<T> init) where T : new()
{
    T obj = new();
    init(obj);
    return obj;
}`,
    explanation: "The `new()` constraint requires `T` to have a public parameterless constructor, enabling `new T()` inside generic methods — all structs satisfy this (they always have a parameterless default constructor).",
  },
  {
    id: "cs-b17-b3-extension-method-null",
    language: "csharp",
    title: "Extension methods can be called on null",
    tag: "understanding",
    code: `static class StringExtensions
{
    public static bool IsNullOrEmpty(this string? s)
        => string.IsNullOrEmpty(s);

    public static string OrDefault(this string? s, string def)
        => string.IsNullOrEmpty(s) ? def : s!;
}

string? name = null;

// Extension methods are static calls — 'this' can be null:
Console.WriteLine(name.IsNullOrEmpty());   // True — no NullRef!
Console.WriteLine(name.OrDefault("N/A"));  // N/A`,
    explanation: "Extension methods are syntactic sugar for static calls — the `this` parameter CAN be `null` if the parameter type is nullable; this enables fluent null-safe helper methods that are impossible with regular instance methods.",
  },
  {
    id: "cs-b17-b3-task-completed",
    language: "csharp",
    title: "Task.CompletedTask and Task.FromResult for synchronous Tasks",
    tag: "understanding",
    code: `using System.Threading.Tasks;

// Return a pre-completed Task (zero allocation):
Task DoNothing() => Task.CompletedTask;

// Return a pre-completed Task<T>:
Task<int> GetFive() => Task.FromResult(5);

// Task.FromException for pre-faulted Tasks:
Task<int> Fail() => Task.FromException<int>(new InvalidOperationException("bad"));

// Useful for implementing async interfaces synchronously:
class SyncService : IAsyncService
{
    public Task<string> GetAsync() => Task.FromResult("sync result");
}

interface IAsyncService { Task<string> GetAsync(); }`,
    explanation: "`Task.CompletedTask` and `Task.FromResult(value)` return pre-completed task singletons or wrappers — use them to implement async interfaces synchronously without allocating a state machine.",
  },
  {
    id: "cs-b17-b3-conditional-compilation",
    language: "csharp",
    title: "#if, #define, and ConditionalAttribute",
    tag: "understanding",
    code: `#define DEBUG   // or set via project properties

// Conditional compilation:
#if DEBUG
    Console.WriteLine("debug build");
#endif

// [Conditional] — entire call is removed in non-DEBUG builds:
using System.Diagnostics;

static class Log
{
    [Conditional("DEBUG")]
    public static void Debug(string msg) => Console.WriteLine(msg);
}

Log.Debug("expensive computation result");  // entire call removed in Release`,
    explanation: "`#if` eliminates code at the preprocessor level; `[Conditional(\"SYMBOL\")]` eliminates call sites when the symbol is not defined — the method body still compiles but all its call sites are removed, making it cheaper than a `if (isDebug)` check.",
  },
  // === structures ===
  {
    id: "cs-b17-b3-channel-bounded",
    language: "csharp",
    title: "Bounded Channel for backpressure control",
    tag: "structures",
    code: `using System.Threading.Channels;
using System.Threading.Tasks;

// Bounded: producer blocks when buffer is full
var ch = Channel.CreateBounded<int>(new BoundedChannelOptions(3)
{
    FullMode = BoundedChannelFullMode.Wait   // block producer
});

Task producer = Task.Run(async () =>
{
    for (int i = 0; i < 6; i++)
    {
        await ch.Writer.WriteAsync(i);   // blocks when buffer full
        Console.WriteLine(\`wrote \${i}\`);
    }
    ch.Writer.Complete();
});

Task consumer = Task.Run(async () =>
{
    await foreach (int item in ch.Reader.ReadAllAsync())
    {
        await Task.Delay(20);   // slow consumer
        Console.WriteLine(\`  read \${item}\`);
    }
});
await Task.WhenAll(producer, consumer);`,
    explanation: "A bounded `Channel<T>` limits the buffer size and blocks or drops producers when full — `BoundedChannelFullMode.Wait` applies natural backpressure, while `DropOldest/DropNewest/DropWrite` discard items instead.",
  },
  {
    id: "cs-b17-b3-immutablearray",
    language: "csharp",
    title: "ImmutableArray<T>: value-type immutable sequence",
    tag: "structures",
    code: `using System.Collections.Immutable;

ImmutableArray<int> arr = ImmutableArray.Create(1, 2, 3);
ImmutableArray<int> arr2 = arr.Add(4);      // new array
ImmutableArray<int> arr3 = arr.Remove(2);   // new array

Console.WriteLine(string.Join(", ", arr));   // 1, 2, 3  (unchanged)
Console.WriteLine(string.Join(", ", arr2));  // 1, 2, 3, 4
Console.WriteLine(string.Join(", ", arr3));  // 1, 3

// ImmutableArray<T> is a struct (unlike ImmutableList<T> which is a class):
Console.WriteLine(arr.IsEmpty);   // False
Console.WriteLine(ImmutableArray<int>.Empty.IsEmpty);  // True`,
    explanation: "`ImmutableArray<T>` is a struct wrapping an array — it has O(1) index access and no heap allocation for the wrapper (unlike `ImmutableList<T>`), making it ideal for small-to-medium collections that are read often and mutated rarely.",
  },
  {
    id: "cs-b17-b3-concurrent-queue",
    language: "csharp",
    title: "ConcurrentQueue<T> for thread-safe FIFO",
    tag: "structures",
    code: `using System.Collections.Concurrent;
using System.Threading.Tasks;

var queue = new ConcurrentQueue<string>();

// Multiple producers:
Parallel.For(0, 10, i => queue.Enqueue(\`item\${i}\`));

Console.WriteLine(queue.Count);   // 10

// Consumer:
while (queue.TryDequeue(out string? item))
    Console.Write(item + " ");

Console.WriteLine(queue.IsEmpty);  // True`,
    explanation: "`ConcurrentQueue<T>` is a lock-free FIFO that uses Compare-And-Swap internally; `TryDequeue` returns `false` on empty instead of blocking — combine with `BlockingCollection` if you need blocking behaviour.",
  },
  {
    id: "cs-b17-b3-string-pool",
    language: "csharp",
    title: "StringPool from CommunityToolkit for string deduplication",
    tag: "structures",
    code: `// Without StringPool: many equal strings as separate objects
var seen = new System.Collections.Generic.HashSet<string>();
foreach (string s in Enumerable.Repeat("hello", 1000))
    seen.Add(s);   // still only one entry (HashSet dedupes)

// With string.Intern: global pool, never collected
string interned = string.Intern("hello");

// Alternative: custom pool for bounded deduplication
var pool = new System.Collections.Generic.Dictionary<string, string>();
string Intern(string s) => pool.TryGetValue(s, out var v) ? v : (pool[s] = s);

Console.WriteLine(ReferenceEquals(Intern("hello"), Intern("hello")));  // True`,
    explanation: "`string.Intern` deduplicates strings into a global pool that persists for the process lifetime; a custom `Dictionary<string,string>` pool gives the same deduplication but can be cleared when no longer needed.",
  },
  {
    id: "cs-b17-b3-list-span-collectionsmarshal",
    language: "csharp",
    title: "CollectionsMarshal.AsSpan for zero-copy List<T> access",
    tag: "structures",
    code: `using System.Runtime.InteropServices;

var list = new System.Collections.Generic.List<int> { 1, 2, 3, 4, 5 };

// Get a Span over List's internal array — zero copy!
Span<int> span = CollectionsMarshal.AsSpan(list);
span[0] = 99;   // modifies the List's backing array

Console.WriteLine(list[0]);   // 99

// WARNING: the span is invalidated if the list is resized:
list.Add(6);   // resizes — span now points to old array!`,
    explanation: "`CollectionsMarshal.AsSpan(list)` exposes the internal array of a `List<T>` as a `Span<T>` with zero copying — useful for bulk SIMD operations, but the span is immediately invalidated if the list is resized.",
  },
  {
    id: "cs-b17-b3-hash-set-operations",
    language: "csharp",
    title: "HashSet<T> set operations: union, intersect, except",
    tag: "structures",
    code: `var a = new System.Collections.Generic.HashSet<int> { 1, 2, 3, 4 };
var b = new System.Collections.Generic.HashSet<int> { 3, 4, 5, 6 };

// Modifying operations (in-place):
var union = new System.Collections.Generic.HashSet<int>(a);
union.UnionWith(b);         // {1,2,3,4,5,6}

var intersect = new System.Collections.Generic.HashSet<int>(a);
intersect.IntersectWith(b); // {3,4}

var except = new System.Collections.Generic.HashSet<int>(a);
except.ExceptWith(b);       // {1,2}

// Non-modifying queries:
Console.WriteLine(a.IsSubsetOf(new[] {1,2,3,4,5}));  // True`,
    explanation: "`HashSet<T>` set operations (`UnionWith`, `IntersectWith`, `ExceptWith`, `SymmetricExceptWith`) modify in place; `IsSubsetOf`, `IsSupersetOf`, and `Overlaps` are non-modifying queries — all run in O(n) time.",
  },
  {
    id: "cs-b17-b3-dictionary-enumerator",
    language: "csharp",
    title: "Deconstructing KeyValuePair in foreach",
    tag: "structures",
    code: `var scores = new System.Collections.Generic.Dictionary<string, int>
{
    ["Alice"] = 95,
    ["Bob"]   = 82,
    ["Carol"] = 78,
};

// Classic:
foreach (var kv in scores)
    Console.WriteLine(\`\${kv.Key}: \${kv.Value}\`);

// Deconstruction syntax (cleaner):
foreach (var (name, score) in scores)
    Console.WriteLine(\`\${name}: \${score}\`);

// LINQ on dictionary:
var top = scores.Where(kv => kv.Value >= 90).Select(kv => kv.Key);`,
    explanation: "`KeyValuePair<K,V>` supports deconstruction in `foreach`, enabling `(key, value)` syntax; `Dictionary<K,V>` enumeration yields key-value pairs in insertion order (.NET 5+).",
  },
  {
    id: "cs-b17-b3-recyclable-memory-stream",
    language: "csharp",
    title: "RecyclableMemoryStream for GC-friendly large buffers",
    tag: "structures",
    code: `// Microsoft.IO.RecyclableMemoryStream (NuGet package)
using Microsoft.IO;

var manager = new RecyclableMemoryStreamManager();

// Rents buffer blocks instead of allocating new byte[]:
using var stream = manager.GetStream();
await WriteDataAsync(stream);

// Disposed stream returns blocks to pool:
// No LOH (Large Object Heap) pressure even for large streams

static async Task WriteDataAsync(System.IO.Stream s)
{
    var data = new byte[65536];
    await s.WriteAsync(data);
}`,
    explanation: "`RecyclableMemoryStream` pools 128KB (or configurable) block segments, avoiding the Large Object Heap allocations that standard `MemoryStream` causes for streams that grow beyond 85KB — important for high-throughput servers.",
  },
  {
    id: "cs-b17-b3-sortedset-range",
    language: "csharp",
    title: "SortedSet<T> GetViewBetween for range queries",
    tag: "structures",
    code: `var dates = new System.Collections.Generic.SortedSet<DateTime>
{
    new(2024, 1, 1),
    new(2024, 3, 15),
    new(2024, 6, 1),
    new(2024, 12, 31),
};

// Efficient O(log n) range view — no full scan:
var q2 = dates.GetViewBetween(
    new DateTime(2024, 4, 1),
    new DateTime(2024, 9, 30));

Console.WriteLine(q2.Count);           // 1
Console.WriteLine(q2.First());         // 6/1/2024
Console.WriteLine(dates.Min);          // 1/1/2024`,
    explanation: "`SortedSet<T>.GetViewBetween(min, max)` returns a live view of the elements in the range without copying — the view updates as the set changes, and range boundaries are inclusive.",
  },
  // === caveats ===
  {
    id: "cs-b17-b3-task-delay-zero",
    language: "csharp",
    title: "Task.Delay(0) yields the thread back to the scheduler",
    tag: "caveats",
    code: `using System.Threading.Tasks;

async Task ProcessItems(int[] items)
{
    for (int i = 0; i < items.Length; i++)
    {
        // CPU-bound work inside async method:
        DoHeavyWork(items[i]);

        // Yield periodically to let other tasks run:
        if (i % 100 == 0)
            await Task.Yield();   // equivalent to Task.Delay(0) but more direct
    }
}

// Task.Delay(0) completes synchronously in most cases,
// but Task.Yield() always posts continuation to the scheduler.
static void DoHeavyWork(int n) { }`,
    explanation: "`Task.Yield()` forces the async continuation to be posted back to the scheduler, giving other pending tasks a chance to run; `Task.Delay(0)` can complete synchronously depending on the timer resolution.",
  },
  {
    id: "cs-b17-b3-event-null-race",
    language: "csharp",
    title: "Thread-safe event invocation pattern",
    tag: "caveats",
    code: `class Button
{
    public event EventHandler? Click;

    void OnClick_Unsafe()
    {
        // RACE: another thread may set Click=null between check and invoke
        if (Click != null)
            Click(this, EventArgs.Empty);
    }

    void OnClick_Safe()
    {
        // Copy to local first — local reference can't be set to null
        EventHandler? handler = Click;
        handler?.Invoke(this, EventArgs.Empty);
    }
}`,
    explanation: "Between the null check and the invocation, another thread could set the event to `null`, causing a `NullReferenceException`; copying to a local variable makes the null test and invocation use the same reference.",
  },
  {
    id: "cs-b17-b3-dispose-twice",
    language: "csharp",
    title: "Disposing an object twice should be safe",
    tag: "caveats",
    code: `class SafeResource : System.IDisposable
{
    private bool _disposed;

    public void Dispose()
    {
        if (_disposed) return;   // guard against double-dispose
        _disposed = true;
        // cleanup...
        Console.WriteLine("disposed");
    }

    public void Use()
    {
        if (_disposed) throw new ObjectDisposedException(nameof(SafeResource));
        Console.WriteLine("using");
    }
}

var r = new SafeResource();
r.Dispose();   // "disposed"
r.Dispose();   // no-op — safe`,
    explanation: "The `IDisposable` contract requires that `Dispose()` is idempotent — calling it multiple times must be safe; guard with a `_disposed` flag and throw `ObjectDisposedException` from methods called after disposal.",
  },
  {
    id: "cs-b17-b3-linqto-list-multiple",
    language: "csharp",
    title: "Materializing LINQ twice re-evaluates the query",
    tag: "caveats",
    code: `using System.Linq;

int count = 0;
IEnumerable<int> query = Enumerable.Range(1, 5)
    .Select(n => { count++; return n * 2; });

// First enumeration:
int sum1 = query.Sum();

// Second enumeration — Select runs AGAIN:
int sum2 = query.Sum();

Console.WriteLine(count);  // 10 — Select was called 10 times (5 + 5)

// Fix: materialize once
var list = query.ToList();
int s1 = list.Sum();
int s2 = list.Sum();
Console.WriteLine(count);  // 15 (10 from before + 5 from ToList)`,
    explanation: "A LINQ query is a recipe, not a result — every `foreach`, `Sum`, `Count`, `ToList`, etc. re-evaluates the entire pipeline; if the query has side effects or hits a database, it runs multiple times.",
  },
  {
    id: "cs-b17-b3-value-tuple-equality",
    language: "csharp",
    title: "ValueTuple equality vs reference tuple equality",
    tag: "caveats",
    code: `// ValueTuple (struct) — value equality:
(int X, int Y) a = (1, 2);
(int X, int Y) b = (1, 2);
Console.WriteLine(a == b);          // True — same values
Console.WriteLine(a.Equals(b));     // True

// Tuple class (reference type) — reference equality by default:
Tuple<int, int> ra = Tuple.Create(1, 2);
Tuple<int, int> rb = Tuple.Create(1, 2);
Console.WriteLine(ra == rb);        // False — different objects!
Console.WriteLine(ra.Equals(rb));   // True — Tuple.Equals is overridden

// Prefer ValueTuple (struct) for performance and natural == semantics`,
    explanation: "`ValueTuple` structs use structural equality for `==`; the class-based `Tuple<>` (C# 7 predecessor) uses reference equality for `==` but structural equality for `Equals` — always use `ValueTuple` for new code.",
  },
  {
    id: "cs-b17-b3-static-field-thread",
    language: "csharp",
    title: "Static fields are shared across all instances (and threads)",
    tag: "caveats",
    code: `class Counter
{
    public static int Total;  // shared by ALL instances and threads!
    public int Id;

    public Counter(int id)
    {
        Id = id;
        Interlocked.Increment(ref Total);
    }
}

Parallel.For(0, 100, i => new Counter(i));
Console.WriteLine(Counter.Total);  // should be 100

// Without Interlocked, Total may be less than 100 due to race`,
    explanation: "Static fields are process-wide singletons — all threads see and modify the same value; without proper synchronization (`Interlocked`, `lock`, or immutability), concurrent writes cause data races.",
  },
  {
    id: "cs-b17-b3-generic-catch",
    language: "csharp",
    title: "Cannot catch a generic type parameter as exception type",
    tag: "caveats",
    code: `// C# does not allow generic exception types in catch clauses:
// void TryCatch<T>() where T : Exception
// {
//     try { }
//     catch (T) { }    // compile error!
// }

// Workarounds:
void TryCatch<T>(Action action) where T : Exception
{
    try { action(); }
    catch (Exception e) when (e is T)  // filter pattern
    {
        Console.WriteLine(\`caught \${typeof(T).Name}\`);
    }
}

TryCatch<InvalidOperationException>(() =>
    throw new InvalidOperationException("test"));`,
    explanation: "C# catch clauses require a concrete exception type known at compile time; use an `exception filter` with `when (e is T)` to simulate catching a generic type parameter — it checks the type at runtime without the IL restriction.",
  },
  // === types ===
  {
    id: "cs-b17-b3-generic-math-inum",
    language: "csharp",
    title: "INumber<T> for generic arithmetic algorithms",
    tag: "types",
    code: `using System.Numerics;

// Works for int, long, double, decimal, float, short...
T Sum<T>(IEnumerable<T> values) where T : INumber<T>
{
    T total = T.Zero;
    foreach (T v in values)
        total += v;
    return total;
}

Console.WriteLine(Sum(new[] { 1, 2, 3, 4, 5 }));         // 15
Console.WriteLine(Sum(new[] { 1.1, 2.2, 3.3 }));          // 6.6
Console.WriteLine(Sum(new[] { 1m, 2.5m, 3.75m }));        // 7.25`,
    explanation: "`INumber<T>` (System.Numerics, .NET 7+) is an interface with static abstract arithmetic operators and constants like `T.Zero` — it enables true generic math algorithms that compile to the same efficient code as hand-written type-specific versions.",
  },
  {
    id: "cs-b17-b3-class-hierarchy-interfaces",
    language: "csharp",
    title: "Implementing multiple interfaces with conflicting members",
    tag: "types",
    code: `interface IA { string Name { get; } }
interface IB { string Name { get; } }

class Widget : IA, IB
{
    // One property — satisfies BOTH interfaces implicitly:
    public string Name => "Widget";

    // OR: explicit for each if different behaviour is needed:
    // string IA.Name => "IA.Widget";
    // string IB.Name => "IB.Widget";
}

Widget w = new();
Console.WriteLine(w.Name);       // Widget
Console.WriteLine(((IA)w).Name); // Widget
Console.WriteLine(((IB)w).Name); // Widget`,
    explanation: "When two interfaces declare the same member name and signature, a single implementation satisfies both; explicit implementation is only required when the signatures differ or you need different behaviour per interface.",
  },
  {
    id: "cs-b17-b3-nullable-value-hasvalue",
    language: "csharp",
    title: "Nullable<T>: HasValue, Value, and GetValueOrDefault",
    tag: "types",
    code: `int? a = 42;
int? b = null;

Console.WriteLine(a.HasValue);           // True
Console.WriteLine(a.Value);             // 42

Console.WriteLine(b.HasValue);           // False
// Console.WriteLine(b.Value);          // InvalidOperationException!

Console.WriteLine(b.GetValueOrDefault());     // 0 (default for int)
Console.WriteLine(b.GetValueOrDefault(-1));   // -1

// Null coalescing operator is preferred:
Console.WriteLine(b ?? -1);   // -1`,
    explanation: "`Nullable<T>.Value` throws `InvalidOperationException` when the value is null — always check `HasValue` first, use `GetValueOrDefault(fallback)`, or the null-coalescing `??` operator to provide a safe default.",
  },
  {
    id: "cs-b17-b3-generic-constraint-notnull",
    language: "csharp",
    title: "notnull constraint for non-nullable generic types",
    tag: "types",
    code: `#nullable enable

// notnull: T can be a value type OR a non-nullable reference type
T FirstOrThrow<T>(T[] arr) where T : notnull
{
    if (arr.Length == 0)
        throw new InvalidOperationException("empty");
    return arr[0];
}

// Works with int (value type) and string (non-nullable ref type):
Console.WriteLine(FirstOrThrow(new[] { 42 }));       // 42
Console.WriteLine(FirstOrThrow(new[] { "hello" }));   // hello

// String? (nullable reference) would be rejected by the compiler:
// FirstOrThrow(new string?[] { null });  // warning/error`,
    explanation: "The `notnull` constraint (with `#nullable enable`) restricts `T` to non-nullable reference types or any value type, ensuring the generic code can treat `T` as always non-null without null checks.",
  },
  {
    id: "cs-b17-b3-required-property-constructor",
    language: "csharp",
    title: "required members work with SetsRequiredMembers",
    tag: "types",
    code: `using System.Diagnostics.CodeAnalysis;

class Config
{
    public required string Host { get; init; }
    public required int Port { get; init; }

    // Constructor that satisfies all required members:
    [SetsRequiredMembers]
    public Config(string host, int port) => (Host, Port) = (host, port);
}

// Via constructor — OK (SetsRequiredMembers suppresses requirement):
var c1 = new Config("localhost", 8080);

// Via object initializer — must supply required members:
var c2 = new Config { Host = "localhost", Port = 8080 };`,
    explanation: "`[SetsRequiredMembers]` on a constructor tells the compiler that the constructor sets all `required` members, allowing it to be called without an object initializer — useful for primary constructors or factory methods.",
  },
  {
    id: "cs-b17-b3-abstract-static-interface",
    language: "csharp",
    title: "Abstract static interface members and operator overloading",
    tag: "types",
    code: `using System.Numerics;

// Define an interface with a static abstract factory:
interface IParseable<T>
{
    static abstract T Parse(string s);
}

class Coordinate : IParseable<Coordinate>
{
    public double X, Y;
    public static Coordinate Parse(string s)
    {
        var parts = s.Split(',');
        return new Coordinate { X = double.Parse(parts[0]), Y = double.Parse(parts[1]) };
    }
}

// Generic parser that works for any IParseable<T>:
T ParseValue<T>(string input) where T : IParseable<T> => T.Parse(input);

var coord = ParseValue<Coordinate>("3.14,2.71");
Console.WriteLine(coord.X);  // 3.14`,
    explanation: "Static abstract interface members (C# 11) allow interfaces to define static methods and operators that implementing types must provide — enabling generic algorithms that call type-level methods like `Parse`, `Create`, or operator overloads.",
  },
  {
    id: "cs-b17-b3-generic-allow-unmanaged",
    language: "csharp",
    title: "Generic method with multiple constraints",
    tag: "types",
    code: `using System;

// Combine constraints with commas (AND logic):
T CreateDefault<T>()
    where T : class,    // reference type
              ICloneable, // implements ICloneable
              new()        // has parameterless ctor
{
    T obj = new T();
    return obj;
}

class CloneableWidget : ICloneable
{
    public object Clone() => new CloneableWidget();
}

var w = CreateDefault<CloneableWidget>();`,
    explanation: "Multiple `where T : ...` constraints are combined with AND logic; the order convention is `class`/`struct` first, then interfaces, then `new()` last — all must be satisfied for a type to substitute `T`.",
  },
  // === families ===
  {
    id: "cs-b17-b3-span-memory-family",
    language: "csharp",
    title: "Span<T> / Memory<T> / ReadOnlySpan<T> family overview",
    tag: "families",
    code: `// Span<T>           — stack-only, synchronous, fastest
// ReadOnlySpan<T>    — like Span<T> but read-only
// Memory<T>          — heap-safe, can cross await/field
// ReadOnlyMemory<T>  — like Memory<T> but read-only

int[] arr = [1, 2, 3, 4, 5];

Span<int>           span  = arr;             // read+write, stack only
ReadOnlySpan<int>   ros   = arr;             // read-only view
Memory<int>         mem   = arr;             // heap-safe view
ReadOnlyMemory<int> rom   = arr;             // read-only heap-safe

// Convert Memory -> Span:
Span<int> fromMem = mem.Span;   // valid but stack-scoped`,
    explanation: "The `Span`/`Memory` family forms a 2×2 grid: mutable vs read-only, and stack-only vs heap-safe — use `Span<T>` for maximum performance in synchronous code and `Memory<T>` when the view must be stored or cross await points.",
  },
  {
    id: "cs-b17-b3-httpclient-json",
    language: "csharp",
    title: "HttpClient.GetFromJsonAsync for typed deserialization",
    tag: "families",
    code: `using System.Net.Http.Json;
using System.Threading.Tasks;

record Todo(int Id, string Title, bool Completed);

async Task Demo(HttpClient client)
{
    // GET + deserialize in one call:
    Todo? todo = await client.GetFromJsonAsync<Todo>(
        "https://jsonplaceholder.typicode.com/todos/1");

    Console.WriteLine(todo?.Title);

    // POST with JSON body:
    var newTodo = new Todo(0, "learn spans", false);
    var response = await client.PostAsJsonAsync(
        "https://jsonplaceholder.typicode.com/todos", newTodo);
    response.EnsureSuccessStatusCode();
}`,
    explanation: "`System.Net.Http.Json` extension methods (`GetFromJsonAsync`, `PostAsJsonAsync`) serialize/deserialize using `System.Text.Json` in a single call — no manual `JsonSerializer` plumbing needed.",
  },
  {
    id: "cs-b17-b3-semaphore-vs-mutex",
    language: "csharp",
    title: "SemaphoreSlim vs Mutex vs lock",
    tag: "families",
    code: `using System.Threading;
using System.Threading.Tasks;

// lock: in-process, non-reentrant, fastest
object _lock = new();
lock (_lock) { /* critical section */ }

// SemaphoreSlim: in-process, awaitable, supports N concurrent entries
var sem = new SemaphoreSlim(initialCount: 3);
await sem.WaitAsync();
try { /* up to 3 threads concurrently */ }
finally { sem.Release(); }

// Mutex: cross-process, slower
using var mutex = new Mutex(false, "Global\\\\MyMutex");
if (mutex.WaitOne(1000))
{
    try { /* cross-process exclusive section */ }
    finally { mutex.ReleaseMutex(); }
}`,
    explanation: "`lock` is for fast in-process exclusion; `SemaphoreSlim` allows N concurrent entries and is `await`-able; `Mutex` is heavier but works across process boundaries — choose the lightest tool for your scenario.",
  },
  {
    id: "cs-b17-b3-readerwriterlock",
    language: "csharp",
    title: "ReaderWriterLockSlim for concurrent read, exclusive write",
    tag: "families",
    code: `using System.Threading;

class Cache<TKey, TValue> where TKey : notnull
{
    private readonly Dictionary<TKey, TValue> _dict = new();
    private readonly ReaderWriterLockSlim _rw = new();

    public bool TryGet(TKey key, out TValue? value)
    {
        _rw.EnterReadLock();
        try { return _dict.TryGetValue(key, out value); }
        finally { _rw.ExitReadLock(); }
    }

    public void Set(TKey key, TValue value)
    {
        _rw.EnterWriteLock();
        try { _dict[key] = value; }
        finally { _rw.ExitWriteLock(); }
    }
}`,
    explanation: "`ReaderWriterLockSlim` allows multiple concurrent readers or one exclusive writer — use it when reads vastly outnumber writes and you want to maximize read throughput while still protecting writes.",
  },
  {
    id: "cs-b17-b3-mediator-pattern",
    language: "csharp",
    title: "Mediator pattern for decoupled request/response",
    tag: "families",
    code: `// Simplified MediatR-style mediator:
interface IRequest<TResponse> { }
interface IHandler<TRequest, TResponse> where TRequest : IRequest<TResponse>
{
    Task<TResponse> Handle(TRequest request, CancellationToken ct);
}

record GetUserQuery(int Id) : IRequest<string>;

class GetUserHandler : IHandler<GetUserQuery, string>
{
    public Task<string> Handle(GetUserQuery q, CancellationToken ct)
        => Task.FromResult(\`User \${q.Id}\`);
}

// Dispatcher resolves handler from DI container and calls Handle`,
    explanation: "The Mediator pattern (popularized by MediatR) routes requests to handlers via a central dispatcher — decoupling callers from implementations and enabling cross-cutting concerns (logging, validation) via pipeline behaviors.",
  },
  // === classes ===
  {
    id: "cs-b17-b3-abstract-factory-pattern",
    language: "csharp",
    title: "Abstract Factory pattern for platform-agnostic UI",
    tag: "classes",
    code: `interface IButton { void Render(); }
interface IDialog { void Show(); }

interface IUIFactory
{
    IButton CreateButton();
    IDialog CreateDialog();
}

class WindowsButton : IButton { public void Render() => Console.WriteLine("[Win Button]"); }
class WindowsDialog : IDialog { public void Show() => Console.WriteLine("[Win Dialog]"); }

class WindowsFactory : IUIFactory
{
    public IButton CreateButton() => new WindowsButton();
    public IDialog CreateDialog() => new WindowsDialog();
}

static void BuildUI(IUIFactory factory)
{
    factory.CreateButton().Render();
    factory.CreateDialog().Show();
}

BuildUI(new WindowsFactory());`,
    explanation: "Abstract Factory provides an interface for creating families of related objects — switching the factory implementation switches the entire product family, enabling platform/theme independence without `if/switch` conditionals scattered throughout the code.",
  },
  {
    id: "cs-b17-b3-observer-pattern",
    language: "csharp",
    title: "Observer pattern with IObservable<T> / IObserver<T>",
    tag: "classes",
    code: `class StockTicker : IObservable<decimal>
{
    private readonly List<IObserver<decimal>> _observers = [];

    public IDisposable Subscribe(IObserver<decimal> observer)
    {
        _observers.Add(observer);
        return new Unsubscriber(_observers, observer);
    }

    public void Tick(decimal price)
    {
        foreach (var o in _observers) o.OnNext(price);
    }

    class Unsubscriber(List<IObserver<decimal>> obs, IObserver<decimal> o) : IDisposable
    {
        public void Dispose() => obs.Remove(o);
    }
}`,
    explanation: "`IObservable<T>` and `IObserver<T>` are the BCL interfaces for the Observer/Reactive pattern; `Subscribe` returns a disposable that unsubscribes when disposed — this is the foundation of Reactive Extensions (Rx.NET).",
  },
  {
    id: "cs-b17-b3-generic-repository",
    language: "csharp",
    title: "Generic Repository<T> pattern",
    tag: "classes",
    code: `interface IRepository<T, TId>
{
    Task<T?> GetByIdAsync(TId id, CancellationToken ct = default);
    Task<IReadOnlyList<T>> GetAllAsync(CancellationToken ct = default);
    Task AddAsync(T entity, CancellationToken ct = default);
    Task DeleteAsync(TId id, CancellationToken ct = default);
}

class InMemoryRepository<T, TId> : IRepository<T, TId>
    where TId : notnull
{
    private readonly Dictionary<TId, T> _store = new();
    public Task<T?> GetByIdAsync(TId id, CancellationToken ct = default)
        => Task.FromResult(_store.TryGetValue(id, out var v) ? v : default);
    public Task<IReadOnlyList<T>> GetAllAsync(CancellationToken ct = default)
        => Task.FromResult<IReadOnlyList<T>>(_store.Values.ToList());
    public Task AddAsync(T e, CancellationToken ct = default)
    {
        _store[GetId(e)] = e; return Task.CompletedTask;
    }
    public Task DeleteAsync(TId id, CancellationToken ct = default)
    {
        _store.Remove(id); return Task.CompletedTask;
    }
    private TId GetId(T e) => throw new NotImplementedException();
}`,
    explanation: "The Generic Repository pattern abstracts data access behind a type-safe interface — the generic parameters make the contract reusable for any entity type, and an in-memory implementation is trivial to write for unit tests.",
  },
  {
    id: "cs-b17-b3-fluent-builder",
    language: "csharp",
    title: "Fluent builder with method chaining",
    tag: "classes",
    code: `class QueryBuilder
{
    private string _table = "";
    private readonly List<string> _conditions = [];
    private int? _limit;

    public QueryBuilder From(string table) { _table = table; return this; }
    public QueryBuilder Where(string cond) { _conditions.Add(cond); return this; }
    public QueryBuilder Limit(int n) { _limit = n; return this; }

    public string Build()
    {
        string sql = \`SELECT * FROM \${_table}\`;
        if (_conditions.Any())
            sql += \` WHERE \${string.Join(" AND ", _conditions)}\`;
        if (_limit.HasValue)
            sql += \` LIMIT \${_limit}\`;
        return sql;
    }
}

string query = new QueryBuilder()
    .From("users")
    .Where("age > 18")
    .Where("active = 1")
    .Limit(10)
    .Build();
Console.WriteLine(query);`,
    explanation: "Fluent builder methods return `this` so calls can be chained; the builder accumulates state and `Build()` validates and constructs the final object — decoupling complex object construction from the object's class.",
  },
  {
    id: "cs-b17-b3-decorator-pattern",
    language: "csharp",
    title: "Decorator pattern wraps behaviour without inheritance",
    tag: "classes",
    code: `interface ICache<K, V> { bool TryGet(K key, out V? value); void Set(K key, V value); }

class MemoryCache<K, V> : ICache<K, V> where K : notnull
{
    private Dictionary<K, V> _d = new();
    public bool TryGet(K k, out V? v) => _d.TryGetValue(k, out v);
    public void Set(K k, V v) => _d[k] = v;
}

class LoggingCache<K, V>(ICache<K, V> inner) : ICache<K, V> where K : notnull
{
    public bool TryGet(K k, out V? v)
    {
        bool hit = inner.TryGet(k, out v);
        Console.WriteLine(\`cache \${(hit ? "hit" : "miss")}: \${k}\`);
        return hit;
    }
    public void Set(K k, V v) { Console.WriteLine(\`cache set: \${k}\`); inner.Set(k, v); }
}

ICache<string, int> cache = new LoggingCache<string, int>(new MemoryCache<string, int>());
cache.Set("x", 42);
cache.TryGet("x", out _);`,
    explanation: "Decorators implement the same interface as the component they wrap, forwarding calls and adding cross-cutting behaviour (logging, caching, retries) — they compose via DI without modifying the decorated class.",
  },
  {
    id: "cs-b17-b3-primary-ctor-validation",
    language: "csharp",
    title: "Validation in primary constructors",
    tag: "classes",
    code: `// C# 12 primary constructors — validation via field initializer
class Temperature(double celsius)
{
    // Field initializer runs before body — can validate inline:
    private readonly double _celsius = celsius >= -273.15
        ? celsius
        : throw new ArgumentOutOfRangeException(nameof(celsius), "below absolute zero");

    public double Celsius    => _celsius;
    public double Fahrenheit => _celsius * 9.0 / 5.0 + 32;
    public double Kelvin     => _celsius + 273.15;
}

var t = new Temperature(100);
Console.WriteLine(t.Fahrenheit);   // 212
// new Temperature(-300);           // throws`,
    explanation: "Primary constructor parameters are in scope for field initializers — you can validate parameters inline using a conditional throw expression before the value is stored, without a separate constructor body.",
  },
  {
    id: "cs-b17-b3-equals-hashcode-combine",
    language: "csharp",
    title: "HashCode.Combine for correct GetHashCode",
    tag: "classes",
    code: `class Point : System.IEquatable<Point>
{
    public int X { get; }
    public int Y { get; }
    public Point(int x, int y) => (X, Y) = (x, y);

    public bool Equals(Point? other)
        => other is not null && X == other.X && Y == other.Y;

    public override bool Equals(object? obj) => Equals(obj as Point);

    // HashCode.Combine produces a good hash from multiple fields:
    public override int GetHashCode() => HashCode.Combine(X, Y);
}

var s = new System.Collections.Generic.HashSet<Point>
{
    new(1, 2), new(3, 4), new(1, 2)   // duplicate removed
};
Console.WriteLine(s.Count);   // 2`,
    explanation: "`HashCode.Combine(fields...)` produces a good distribution hash from multiple values using a modern mixing algorithm — far better than the old `x ^ y` XOR approach which collapses to zero for identical fields.",
  },
  {
    id: "cs-b17-b3-dispose-async",
    language: "csharp",
    title: "IAsyncDisposable and await using",
    tag: "classes",
    code: `using System;
using System.Threading.Tasks;

class AsyncWriter : IAsyncDisposable
{
    public async ValueTask DisposeAsync()
    {
        Console.WriteLine("flushing buffer...");
        await Task.Delay(10);   // async flush
        Console.WriteLine("closed");
    }
}

async Task Demo()
{
    await using var writer = new AsyncWriter();
    Console.WriteLine("writing...");
}   // DisposeAsync called here

await Demo();
// writing...
// flushing buffer...
// closed`,
    explanation: "`await using` calls `DisposeAsync()` with `await`, allowing async cleanup operations like flushing network buffers or closing database connections — synchronous `Dispose` would block the thread for such operations.",
  },
];
