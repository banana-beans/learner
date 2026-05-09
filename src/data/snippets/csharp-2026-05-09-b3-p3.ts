import type { Snippet } from "./types";

export const csharpSnippets20260509B3P3: Snippet[] = [
  {
    id: "cs-snippet-span-split-range",
    language: "csharp",
    title: "Span<char>.Split() avoids string allocations when parsing",
    tag: "snippet",
    code: `ReadOnlySpan<char> csv = "alice,30,NYC".AsSpan();

// Split without allocating substrings
foreach (var range in csv.Split(','))
{
    ReadOnlySpan<char> field = csv[range];
    Console.WriteLine(field.ToString());
}
// alice
// 30
// NYC

// Parse numbers directly from span
ReadOnlySpan<char> num = "42".AsSpan();
int n = int.Parse(num);   // no string allocation
Console.WriteLine(n);     // 42`,
    explanation: "MemoryExtensions.Split enumerates Range values into the original span, avoiding substring allocations. Parsing primitives directly from ReadOnlySpan<char> (int.Parse, double.TryParse etc.) is supported and eliminates the intermediate string.",
  },
  {
    id: "cs-snippet-string-intern",
    language: "csharp",
    title: "string.Intern deduplicates repeated string values",
    tag: "snippet",
    code: `// String literals are interned automatically
string a = "hello";
string b = "hello";
Console.WriteLine(ReferenceEquals(a, b));   // True (same interned object)

// Runtime strings are NOT interned automatically
string c = new string(new[] { 'h','e','l','l','o' });
Console.WriteLine(ReferenceEquals(a, c));   // False

// Manually intern to deduplicate
string interned = string.Intern(c);
Console.WriteLine(ReferenceEquals(a, interned));  // True

// IsInterned: check without adding to intern table
string? check = string.IsInterned("hello");
Console.WriteLine(check != null);  // True`,
    explanation: "The intern pool deduplicates string values so identical strings share one object; useful when loading many repeated strings from a database or file. The downside: interned strings live for the application's lifetime and can't be GC'd.",
  },
  {
    id: "cs-snippet-environment-vars",
    language: "csharp",
    title: "Environment.GetEnvironmentVariable reads config from the shell",
    tag: "snippet",
    code: `// Read a variable (returns null if missing)
string? dbUrl = Environment.GetEnvironmentVariable("DATABASE_URL");
Console.WriteLine(dbUrl ?? "not set");

// With a default
string logLevel = Environment.GetEnvironmentVariable("LOG_LEVEL") ?? "info";

// Set (current process only)
Environment.SetEnvironmentVariable("MY_VAR", "hello");
Console.WriteLine(Environment.GetEnvironmentVariable("MY_VAR"));   // hello

// All variables
var vars = Environment.GetEnvironmentVariables();
foreach (System.Collections.DictionaryEntry kv in vars)
    if (kv.Key.ToString()!.StartsWith("PATH"))
        Console.WriteLine(kv.Key);`,
    explanation: "Environment.GetEnvironmentVariable reads process environment variables set before the process started; SetEnvironmentVariable changes them for the current process only. Use EnvironmentVariableTarget.Machine/User to read persistent variables (requires elevation).",
  },
  {
    id: "cs-snippet-file-stream",
    language: "csharp",
    title: "FileStream with explicit buffer for efficient binary I/O",
    tag: "snippet",
    code: `using System.IO;

// Write binary data
await using var ws = new FileStream("/tmp/data.bin",
    FileMode.Create, FileAccess.Write,
    FileShare.None, bufferSize: 4096, useAsync: true);

byte[] data = System.Text.Encoding.UTF8.GetBytes("Hello, Binary!");
await ws.WriteAsync(data);
await ws.FlushAsync();

// Read binary data
await using var rs = new FileStream("/tmp/data.bin",
    FileMode.Open, FileAccess.Read,
    FileShare.Read, bufferSize: 4096, useAsync: true);

byte[] buf = new byte[rs.Length];
int read = await rs.ReadAsync(buf);
Console.WriteLine(System.Text.Encoding.UTF8.GetString(buf, 0, read));

File.Delete("/tmp/data.bin");`,
    explanation: "FileStream with explicit bufferSize and useAsync:true uses I/O completion ports on Windows (or equivalent), avoiding thread blocking. Prefer async overloads (ReadAsync/WriteAsync) in async methods; FlushAsync ensures data reaches the OS buffer.",
  },
  {
    id: "cs-snippet-compression",
    language: "csharp",
    title: "GZipStream compresses and decompresses data on the fly",
    tag: "snippet",
    code: `using System.IO;
using System.IO.Compression;
using System.Text;

string original = "Hello, compressed world! " +
    string.Concat(Enumerable.Repeat("compress me ", 20));

// Compress
byte[] compressed;
using (var ms = new MemoryStream())
{
    using (var gz = new GZipStream(ms, CompressionLevel.Optimal))
        gz.Write(Encoding.UTF8.GetBytes(original));
    compressed = ms.ToArray();
}

// Decompress
using var rms = new MemoryStream(compressed);
using var rgz = new GZipStream(rms, CompressionMode.Decompress);
using var reader = new StreamReader(rgz);
string decompressed = reader.ReadToEnd();

Console.WriteLine($"original: {original.Length} compressed: {compressed.Length}");
Console.WriteLine(decompressed == original);   // True`,
    explanation: "GZipStream wraps any Stream and transparently compresses on write or decompresses on read. Wrap it in a StreamReader/Writer for text or use raw byte[] I/O for binary. BrotliStream (.NET 5+) often achieves better ratios for text.",
  },
  {
    id: "cs-snippet-regex-compiled",
    language: "csharp",
    title: "Compiled Regex is faster for repeated matching",
    tag: "snippet",
    code: `using System.Text.RegularExpressions;

// Interpreted: compiled on first use, cached for reuse
var pattern = new Regex(@"\b\d{4}-\d{2}-\d{2}\b");

// Compiled to IL at construction: faster for hot loops
var compiled = new Regex(@"\b\d{4}-\d{2}-\d{2}\b",
    RegexOptions.Compiled);

string text = "Dates: 2026-05-09 and 2025-12-31.";
foreach (Match m in compiled.Matches(text))
    Console.WriteLine(m.Value);
// 2026-05-09
// 2025-12-31

// .NET 7+ source generators: zero-overhead, compile-time compiled
// [GeneratedRegex(@"\b\d{4}-\d{2}-\d{2}\b")]
// private static partial Regex DatePattern();`,
    explanation: "RegexOptions.Compiled generates IL at construction time for faster matching, at the cost of longer startup and higher memory. For the best performance in .NET 7+, use [GeneratedRegex] source generators which emit code at compile time with no runtime overhead.",
  },
  {
    id: "cs-snippet-regex-namedgroup",
    language: "csharp",
    title: "Named capture groups make regex matches self-documenting",
    tag: "snippet",
    code: `using System.Text.RegularExpressions;

var pattern = new Regex(
    @"(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})");

string input = "Event date: 2026-05-09";
Match m = pattern.Match(input);

if (m.Success)
{
    Console.WriteLine(m.Groups["year"].Value);   // 2026
    Console.WriteLine(m.Groups["month"].Value);  // 05
    Console.WriteLine(m.Groups["day"].Value);    // 09
}

// Access all named groups
foreach (string name in pattern.GetGroupNames())
    if (int.TryParse(name, out _) == false)   // skip numeric groups
        Console.WriteLine($"{name}: {m.Groups[name].Value}");`,
    explanation: "(?<name>...) syntax names a capture group; access it via Match.Groups[\"name\"] instead of a fragile numeric index. Named groups document the regex intent and make refactoring safer when the pattern changes.",
  },
  {
    id: "cs-understanding-jit-tiers",
    language: "csharp",
    title: "Tiered JIT: quick compile first, optimise hot methods later",
    tag: "understanding",
    code: `// Tiered compilation (default since .NET Core 3):
// Tier 0: fast unoptimized JIT on first call (minimises startup latency)
// Tier 1: after N calls, re-JIT with full optimizations (maximises throughput)

// Methods marked [MethodImpl(MethodImplOptions.AggressiveOptimization)]
// go directly to Tier 1 (skip Tier 0)
using System.Runtime.CompilerServices;

[MethodImpl(MethodImplOptions.AggressiveOptimization)]
static double HotLoop(int n)
{
    double sum = 0;
    for (int i = 0; i < n; i++) sum += i;
    return sum;
}

Console.WriteLine(HotLoop(1_000_000));

// Check JIT tier at runtime:
// RuntimeHelpers.EnsureSufficientExecutionStack(); (not tier info, but related)`,
    explanation: "Tiered JIT compiles methods quickly at Tier 0 then recompiles hot methods at Tier 1 with full optimisations (inlining, loop unrolling, SIMD). AggressiveOptimization skips Tier 0 for methods known to be immediately hot.",
  },
  {
    id: "cs-understanding-array-covariance",
    language: "csharp",
    title: "Array covariance is a legacy design flaw -- avoid it",
    tag: "understanding",
    code: `// C# inherited Java's covariant arrays (a mistake)
string[] strings = { "a", "b", "c" };
object[] objects = strings;  // compiles!

// Reading is safe
Console.WriteLine(objects[0]);  // a

// Writing is NOT safe -- throws at runtime
try
{
    objects[0] = 42;  // ArrayTypeMismatchException!
}
catch (ArrayTypeMismatchException e)
{
    Console.WriteLine(e.GetType().Name);
}

// Safe alternatives:
// IReadOnlyList<object> readOnly = strings;  // CS0266: still invariant
// IEnumerable<object> seq = strings;  // OK: IEnumerable<out T> is covariant`,
    explanation: "Arrays are covariant for reference types: string[] can be assigned to object[]. But writes are checked at runtime, causing ArrayTypeMismatchException. This is a legacy flaw; prefer IEnumerable<T> (covariant) or IReadOnlyList<T> for safe covariant collection references.",
  },
  {
    id: "cs-understanding-boxing-interface",
    language: "csharp",
    title: "Calling an interface method on a struct value-type boxes it",
    tag: "understanding",
    code: `interface IDescribable { string Describe(); }

struct Point : IDescribable
{
    public int X, Y;
    public string Describe() => $"({X},{Y})";
}

Point p = new Point { X = 1, Y = 2 };

// DIRECT call: no boxing
string s1 = p.Describe();   // no allocation

// INTERFACE call: struct is boxed onto the heap
IDescribable d = p;          // boxing: heap allocation!
string s2 = d.Describe();

// Fix: use generics with a constraint to avoid boxing
static string NoBox<T>(T val) where T : IDescribable
    => val.Describe();     // constrained call, no boxing

Console.WriteLine(NoBox(p));   // no allocation`,
    explanation: "Assigning a struct to an interface reference boxes it onto the heap; the boxed copy is what the interface method is called on. Generic constraints with interface bounds generate a constrained call instruction that avoids boxing for value types.",
  },
  {
    id: "cs-structures-hashset",
    language: "csharp",
    title: "HashSet<T> for O(1) membership tests and set operations",
    tag: "structures",
    code: `var set = new HashSet<int> { 1, 2, 3, 4, 5 };

// O(1) membership
Console.WriteLine(set.Contains(3));   // True
Console.WriteLine(set.Contains(9));   // False

// Set operations (mutate in place)
var other = new HashSet<int> { 3, 4, 5, 6, 7 };
set.IntersectWith(other);
Console.WriteLine(string.Join(",", set));   // 3,4,5

set.UnionWith(new[] { 1, 2 });
Console.WriteLine(string.Join(",", set));   // 1,2,3,4,5

// Non-mutating: create new set
var diff = new HashSet<int>(set);
diff.ExceptWith(other);
Console.WriteLine(string.Join(",", diff));  // 1,2`,
    explanation: "HashSet<T> provides O(1) average-case Add, Remove, and Contains. Set operations (IntersectWith, UnionWith, ExceptWith) modify the set in place; create a copy first for non-destructive variants. Equality is determined by GetHashCode/Equals.",
  },
  {
    id: "cs-structures-sorted-set",
    language: "csharp",
    title: "SortedSet<T> maintains elements in sorted order",
    tag: "structures",
    code: `var ss = new SortedSet<int> { 5, 2, 8, 1, 9, 3 };

// Always sorted
Console.WriteLine(string.Join(",", ss));   // 1,2,3,5,8,9

// Min/Max are O(log n)
Console.WriteLine(ss.Min);   // 1
Console.WriteLine(ss.Max);   // 9

// GetViewBetween: O(log n) subset view (no copy)
var between = ss.GetViewBetween(3, 8);
Console.WriteLine(string.Join(",", between));  // 3,5,8

// Set operations
ss.ExceptWith(new[] { 2, 5 });
Console.WriteLine(string.Join(",", ss));   // 1,3,8,9`,
    explanation: "SortedSet<T> uses a red-black tree internally; all operations are O(log n). GetViewBetween returns a live view of elements in the range, not a copy. Use it when you need both sorted iteration and O(log n) lookup without the extra memory of a sorted list.",
  },
  {
    id: "cs-structures-weak-reference",
    language: "csharp",
    title: "WeakReference<T> holds a reference that doesn't prevent GC",
    tag: "structures",
    code: `class BigCache
{
    public byte[] Data = new byte[1024 * 1024];  // 1 MB
}

var weakRef = new WeakReference<BigCache>(new BigCache());

// Try to get the object (may have been collected)
if (weakRef.TryGetTarget(out BigCache? cache))
{
    Console.WriteLine($"cache alive: {cache.Data.Length} bytes");
}

// Force GC (in production code, don't force GC)
GC.Collect(2, GCCollectionMode.Forced);
GC.WaitForPendingFinalizers();

bool alive = weakRef.TryGetTarget(out _);
Console.WriteLine($"alive after GC: {alive}");  // likely False`,
    explanation: "WeakReference<T> holds a reference that doesn't count toward the object's reachability; the GC can collect the target. TryGetTarget returns false if it's been collected. Use it for caches: objects live as long as they're needed but are freed under memory pressure.",
  },
  {
    id: "cs-caveats-default-interface",
    language: "csharp",
    title: "Default interface methods are not inherited by implementing classes",
    tag: "caveats",
    code: `interface ILogger
{
    void Log(string msg);
    // Default implementation
    void LogWarning(string msg) => Log($"[WARN] {msg}");
}

class ConsoleLogger : ILogger
{
    public void Log(string msg) => Console.WriteLine(msg);
    // LogWarning is NOT automatically available on ConsoleLogger!
}

var logger = new ConsoleLogger();
// logger.LogWarning("oops");  // CS1061: ConsoleLogger has no LogWarning

// MUST cast to the interface to access the default method
((ILogger)logger).LogWarning("oops");  // works`,
    explanation: "Default interface methods (C# 8+) are only accessible via the interface reference, not through a concrete class variable. They serve as a versioning mechanism for adding new interface members without breaking existing implementations, not as class method inheritance.",
  },
  {
    id: "cs-caveats-params-array",
    language: "csharp",
    title: "params array allocates a new array on every call",
    tag: "caveats",
    code: `// Every call to Sum allocates a new int[]
static int Sum(params int[] nums)
{
    int total = 0;
    foreach (int n in nums) total += n;
    return total;
}

// Each of these allocates int[]:
Console.WriteLine(Sum(1, 2, 3));       // alloc int[3]
Console.WriteLine(Sum(4, 5, 6, 7));    // alloc int[4]

// In hot loops, prefer overloads or Span<T>
static int SumSpan(ReadOnlySpan<int> nums)
{
    int total = 0;
    foreach (int n in nums) total += n;
    return total;
}
// Caller can pass stackalloc or array without intermediate alloc
Span<int> data = stackalloc int[] { 1, 2, 3 };
Console.WriteLine(SumSpan(data));`,
    explanation: "params creates a new array for every call site unless the caller explicitly passes an array. In hot paths, prefer ReadOnlySpan<T> overloads or manual overloads for common arities (1, 2, 3 args) to avoid the allocation.",
  },
  {
    id: "cs-types-static-abstract",
    language: "csharp",
    title: "Static abstract interface members enable generic math (C# 11)",
    tag: "types",
    code: `using System.Numerics;

// Define an interface with a static abstract member
interface IFactory<T> where T : IFactory<T>
{
    static abstract T Create();
}

class Widget : IFactory<Widget>
{
    public static Widget Create() => new Widget();
    public override string ToString() => "Widget";
}

// Generic method using the static factory
static T MakeOne<T>() where T : IFactory<T>
    => T.Create();   // calls the static method on T

Console.WriteLine(MakeOne<Widget>());  // Widget

// INumber<T> uses the same mechanism for operators:
static T Double<T>(T value) where T : INumber<T>
    => value + value;
Console.WriteLine(Double(21));   // 42`,
    explanation: "Static abstract interface members (C# 11) allow interfaces to declare static members that implementing types must provide; generic methods can then call T.Method() without an instance. This powers System.Numerics.INumber<T> and the generic math APIs.",
  },
  {
    id: "cs-types-generic-attribute",
    language: "csharp",
    title: "Generic attributes (C# 11) replace typeof(T) in attribute arguments",
    tag: "types",
    code: `// Before C# 11: attributes had to take Type as a constructor argument
// [Serializer(typeof(JsonSerializer))]

// C# 11: generic attributes
class SerializerAttribute<T> : Attribute where T : ISerializer {}
interface ISerializer {}
class JsonSerializer : ISerializer {}
class XmlSerializer  : ISerializer {}

[Serializer<JsonSerializer>]
class UserDto { public string Name { get; set; } = ""; }

[Serializer<XmlSerializer>]
class ProductDto { public string Title { get; set; } = ""; }

// Retrieve at runtime
var attr = (SerializerAttribute<JsonSerializer>?)
    Attribute.GetCustomAttribute(typeof(UserDto),
        typeof(SerializerAttribute<JsonSerializer>));
Console.WriteLine(attr != null);   // True`,
    explanation: "Generic attributes (C# 11) allow type parameters directly on attribute classes, providing type safety and avoiding typeof(T) arguments. Type constraints are enforced at compile time; the generic type argument is inspectable via reflection.",
  },
  {
    id: "cs-families-polly-resilience",
    language: "csharp",
    title: "Polly retry and circuit-breaker for resilient HTTP calls",
    tag: "families",
    code: `// Microsoft.Extensions.Http.Resilience or Polly NuGet
using Polly;
using Polly.Retry;

// Retry up to 3 times with exponential backoff
ResiliencePipeline pipeline = new ResiliencePipelineBuilder()
    .AddRetry(new RetryStrategyOptions
    {
        MaxRetryAttempts = 3,
        Delay = TimeSpan.FromMilliseconds(200),
        BackoffType = DelayBackoffType.Exponential,
        OnRetry = args =>
        {
            Console.WriteLine($"retry {args.AttemptNumber}");
            return ValueTask.CompletedTask;
        }
    })
    .AddTimeout(TimeSpan.FromSeconds(5))
    .Build();

await pipeline.ExecuteAsync(async ct =>
{
    // your HTTP call here
    await Task.Delay(10, ct);
    Console.WriteLine("succeeded");
});`,
    explanation: "Polly (and its .NET 8 integration via Microsoft.Extensions.Resilience) provides retry, circuit breaker, timeout, and rate limiting pipelines. Chain multiple strategies in ResiliencePipelineBuilder; each wraps the inner execution and handles failure modes independently.",
  },
  {
    id: "cs-structures-observable-collection",
    language: "csharp",
    title: "ObservableCollection<T> notifies when items are added or removed",
    tag: "structures",
    code: `using System.Collections.ObjectModel;
using System.Collections.Specialized;

var list = new ObservableCollection<string>();

list.CollectionChanged += (s, e) =>
{
    Console.WriteLine($"action={e.Action} " +
        $"new={string.Join(",", e.NewItems?.Cast<string>() ?? [])}");
};

list.Add("Alice");    // action=Add new=Alice
list.Add("Bob");      // action=Add new=Bob
list.Remove("Alice"); // action=Remove new=

list.Move(0, 1);      // action=Move`,
    explanation: "ObservableCollection<T> raises CollectionChanged whenever items are added, removed, moved, or replaced; it implements INotifyCollectionChanged. It's the standard collection for WPF/MAUI data binding since UI controls subscribe to CollectionChanged to refresh automatically.",
  },
];
