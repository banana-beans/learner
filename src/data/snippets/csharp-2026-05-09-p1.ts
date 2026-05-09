import type { Snippet } from "./types";

export const csharpSnippets20260509P1: Snippet[] = [
  {
    id: "cs-snippet-switch-expression",
    language: "csharp",
    title: "switch expression with pattern arms",
    tag: "snippet",
    code: `// C# 8+ switch expression returns a value
string Classify(int n) => n switch
{
    < 0            => "negative",
    0              => "zero",
    > 0 and <= 10  => "small positive",
    _              => "large positive",
};

Console.WriteLine(Classify(-5));   // negative
Console.WriteLine(Classify(0));    // zero
Console.WriteLine(Classify(7));    // small positive
Console.WriteLine(Classify(999));  // large positive`,
    explanation: "Switch expressions (C# 8+) return a value directly; relational patterns (< 0) and and/or combinators make range-based classification concise without nested if-else chains.",
  },
  {
    id: "cs-understanding-captured-loop",
    language: "csharp",
    title: "Captured loop variable in a lambda -- the classic C# gotcha",
    tag: "understanding",
    code: `var actions = new List<Action>();
for (int i = 0; i < 5; i++)
{
    actions.Add(() => Console.Write(i + " ")); // captures i, not its value
}
actions.ForEach(a => a());  // 5 5 5 5 5

// Fix: introduce a local copy inside the loop
var actions2 = new List<Action>();
for (int i = 0; i < 5; i++)
{
    int copy = i;
    actions2.Add(() => Console.Write(copy + " "));
}
actions2.ForEach(a => a());  // 0 1 2 3 4`,
    explanation: "Lambdas capture variables by reference; when all lambdas share the same loop variable i, they all see i's final value when invoked. Introducing a local copy creates a distinct capture per iteration.",
  },
  {
    id: "cs-structures-span",
    language: "csharp",
    title: "Span<T> for zero-allocation slicing",
    tag: "structures",
    code: `string csv = "alice,bob,carol,dave";
ReadOnlySpan<char> span = csv.AsSpan();

// Slice without allocating a new string
ReadOnlySpan<char> first = span[..5];   // "alice"
Console.WriteLine(first.ToString());    // alice

// Parse a number from a substring without intermediate string
ReadOnlySpan<char> digits = "   42   ".AsSpan().Trim();
int val = int.Parse(digits);
Console.WriteLine(val);   // 42`,
    explanation: "Span<T> is a stack-allocated view into a contiguous region of memory; slicing a Span never allocates a new array, making it ideal for high-throughput text parsing or binary protocol handling.",
  },
  {
    id: "cs-caveats-async-void",
    language: "csharp",
    title: "async void swallows exceptions -- use async Task instead",
    tag: "caveats",
    code: `// async void: exceptions are thrown on SynchronizationContext
// and cannot be caught by the caller
async void BadHandler()
{
    await Task.Delay(10);
    throw new InvalidOperationException("lost!");
}

// async Task: callers can await and catch
async Task GoodHandler()
{
    await Task.Delay(10);
    throw new InvalidOperationException("catchable");
}

try { await GoodHandler(); }
catch (Exception e) { Console.WriteLine(e.Message); }  // catchable`,
    explanation: "async void is only appropriate for event handlers where the signature is fixed; everywhere else use async Task so callers can await, observe exceptions, and compose asynchronous workflows correctly.",
  },
  {
    id: "cs-types-generics-constraint",
    language: "csharp",
    title: "Generic type constraints restrict what T can be",
    tag: "types",
    code: `// where T : class    -- reference type only
// where T : struct   -- value type only
// where T : new()    -- must have parameterless constructor
// where T : IComparable<T>  -- must implement interface

T Max<T>(T a, T b) where T : IComparable<T>
    => a.CompareTo(b) >= 0 ? a : b;

Console.WriteLine(Max(3, 7));             // 7
Console.WriteLine(Max("apple", "mango")); // mango`,
    explanation: "Constraints let the compiler allow operations that are valid only for certain types (like CompareTo); without the constraint, calling any member beyond object's would be a compile error.",
  },
  {
    id: "cs-families-ienumerable-hierarchy",
    language: "csharp",
    title: "IEnumerable vs ICollection vs IList hierarchy",
    tag: "families",
    code: `// IEnumerable<T>: read-only forward iteration
IEnumerable<int> seq = new[] { 1, 2, 3 };

// ICollection<T>: adds Count, Add, Remove, Contains
ICollection<int> coll = new List<int> { 1, 2, 3 };
Console.WriteLine(coll.Count);   // 3

// IList<T>: adds indexer and Insert/RemoveAt
IList<int> list = new List<int> { 1, 2, 3 };
list[1] = 99;
Console.WriteLine(list[1]);      // 99

// IReadOnlyList<T>: indexer but no mutation
IReadOnlyList<int> ro = list;`,
    explanation: "Program to the narrowest interface your code needs; IEnumerable for read-only traversal, ICollection when you need Count/Add/Remove, IList when you need indexed access.",
  },
  {
    id: "cs-classes-init-only",
    language: "csharp",
    title: "init-only properties allow set during object initialisation only",
    tag: "classes",
    code: `class Config
{
    public string Host { get; init; } = "localhost";
    public int Port { get; init; } = 5432;
    public bool Ssl { get; init; }
}

var cfg = new Config { Host = "prod-db", Port = 5433, Ssl = true };
Console.WriteLine(cfg.Host);   // prod-db

// cfg.Host = "other";  // Error CS8852: init-only property`,
    explanation: "init-only setters (C# 9) allow properties to be set in an object initialiser but not mutated afterward, providing immutability without requiring a constructor parameter for every property.",
  },
  {
    id: "cs-snippet-target-typed-new",
    language: "csharp",
    title: "Target-typed new() omits the type name",
    tag: "snippet",
    code: `// C# 9+: type inferred from the declaration context
List<string> names = new();
Dictionary<string, int> counts = new();

// Works in any context where type is unambiguous
void Process(List<int> items) { }
Process(new() { 1, 2, 3 });

// Field initializers
class Repo
{
    private readonly List<string> _items = new();
}`,
    explanation: "Target-typed new() (C# 9) infers the constructor's type from the left-hand side declaration or method parameter, reducing redundancy especially with long generic type names.",
  },
  {
    id: "cs-understanding-value-ref",
    language: "csharp",
    title: "Value types copy on assignment; reference types share the object",
    tag: "understanding",
    code: `// Value type (struct): copy on assignment
int a = 10;
int b = a;
b = 20;
Console.WriteLine(a);   // 10 -- a is unchanged

// Reference type (class): both variables point to same object
var list1 = new List<int> { 1, 2, 3 };
var list2 = list1;       // copies the reference, not the list
list2.Add(4);
Console.WriteLine(list1.Count);   // 4 -- shared object`,
    explanation: "Structs are value types: assignment copies all fields. Classes are reference types: assignment copies the reference (pointer), so both variables see mutations through either handle.",
  },
  {
    id: "cs-structures-priority-queue",
    language: "csharp",
    title: "PriorityQueue<TElement, TPriority> for sorted extraction",
    tag: "structures",
    code: `// Available in .NET 6+
var pq = new PriorityQueue<string, int>();
pq.Enqueue("low",    10);
pq.Enqueue("high",    1);
pq.Enqueue("medium",  5);

// Dequeues in ascending priority order (lowest value first)
while (pq.TryDequeue(out string? task, out int pri))
    Console.WriteLine($"{pri}: {task}");
// 1: high
// 5: medium
// 10: low`,
    explanation: "PriorityQueue<TElement, TPriority> is a min-heap added in .NET 6; elements are dequeued in ascending priority order. Use negative priorities or a custom IComparer for max-heap semantics.",
  },
  {
    id: "cs-caveats-decimal-double",
    language: "csharp",
    title: "decimal vs double: precision vs performance",
    tag: "caveats",
    code: `double d = 0.1 + 0.2;
Console.WriteLine(d == 0.3);    // False
Console.WriteLine(d);           // 0.30000000000000004

decimal m = 0.1m + 0.2m;
Console.WriteLine(m == 0.3m);   // True
Console.WriteLine(m);           // 0.3

// decimal: 28-29 significant digits, base-10, ~20x slower
// double:  15-17 significant digits, base-2, hardware-native`,
    explanation: "double uses binary floating-point (fast, hardware-native) and accumulates rounding errors; decimal uses base-10 representation (exact for most monetary values) at a significant performance cost.",
  },
  {
    id: "cs-types-record",
    language: "csharp",
    title: "record class: value equality with reference semantics",
    tag: "types",
    code: `record Person(string Name, int Age);

var alice1 = new Person("Alice", 30);
var alice2 = new Person("Alice", 30);
var bob    = new Person("Bob",   25);

Console.WriteLine(alice1 == alice2);  // True (value equality)
Console.WriteLine(alice1 == bob);     // False

// Non-destructive mutation with 'with'
var older = alice1 with { Age = 31 };
Console.WriteLine(older);  // Person { Name = Alice, Age = 31 }
Console.WriteLine(alice1); // Person { Name = Alice, Age = 30 }`,
    explanation: "record classes generate value-based equality (compares all properties), a ToString, and a with expression for non-destructive mutation -- eliminating boilerplate for immutable data-carrier types.",
  },
  {
    id: "cs-families-task-valuetask",
    language: "csharp",
    title: "Task vs ValueTask: when allocation matters",
    tag: "families",
    code: `// Task: heap-allocated, good for general async work
async Task<int> FetchCountAsync()
{
    await Task.Delay(100);
    return 42;
}

// ValueTask: avoids heap allocation when result is often synchronous
async ValueTask<int> GetCachedOrFetchAsync(bool cached)
{
    if (cached) return 42;           // sync path: no allocation
    await Task.Delay(100);
    return 99;
}

var t = await FetchCountAsync();
var v = await GetCachedOrFetchAsync(true);`,
    explanation: "ValueTask avoids the Task heap allocation on hot paths that frequently complete synchronously; it's appropriate for high-throughput APIs but harder to misuse than Task, so prefer Task unless profiling shows allocation pressure.",
  },
  {
    id: "cs-classes-primary-ctor",
    language: "csharp",
    title: "Primary constructors (C# 12) reduce boilerplate",
    tag: "classes",
    code: `// Parameters available throughout the class body
class Logger(string prefix, bool verbose)
{
    public void Log(string msg)
    {
        if (verbose)
            Console.WriteLine($"[{prefix}] {msg}");
    }

    public string Prefix => prefix;  // captured directly
}

var log = new Logger("INFO", verbose: true);
log.Log("server started");   // [INFO] server started
Console.WriteLine(log.Prefix);  // INFO`,
    explanation: "Primary constructors (C# 12) place constructor parameters directly on the class declaration; the parameters are in scope for the entire class body, eliminating manual this.field = param boilerplate.",
  },
  {
    id: "cs-snippet-range-index",
    language: "csharp",
    title: "Ranges and indices: 1..4 and ^1",
    tag: "snippet",
    code: `int[] arr = { 0, 1, 2, 3, 4, 5 };

// ^ means 'from end'
Console.WriteLine(arr[^1]);     // 5  (last element)
Console.WriteLine(arr[^2]);     // 4

// Range: start..end (end exclusive)
int[] slice = arr[1..4];
Console.WriteLine(string.Join(",", slice));  // 1,2,3

// Combine ^ with ranges
int[] last3 = arr[^3..];
Console.WriteLine(string.Join(",", last3));  // 3,4,5`,
    explanation: "C# 8 index-from-end (^n) counts from the end of the sequence; ranges (a..b) extract subsequences and work on arrays, Span<T>, and any type implementing the range/index pattern.",
  },
  {
    id: "cs-understanding-nullable-flow",
    language: "csharp",
    title: "Nullable reference type flow analysis",
    tag: "understanding",
    code: `#nullable enable
string? maybeName = GetName();

// Before null check: type is string? -- .Length is a warning
// Console.WriteLine(maybeName.Length);  // CS8602

if (maybeName != null)
{
    // Inside the if: type narrowed to string (non-nullable)
    Console.WriteLine(maybeName.Length);  // OK
}

// Null coalescing
int len = maybeName?.Length ?? 0;

string GetName() => DateTime.Now.Second > 30 ? "Alice" : null!;`,
    explanation: "With #nullable enable, the compiler tracks nullability through control flow; after a null check the type is narrowed to non-nullable, eliminating the warning -- similar to TypeScript's type narrowing.",
  },
  {
    id: "cs-structures-concurrent-dict",
    language: "csharp",
    title: "ConcurrentDictionary for thread-safe key-value storage",
    tag: "structures",
    code: `using System.Collections.Concurrent;

var dict = new ConcurrentDictionary<string, int>();

dict.GetOrAdd("visits", 0);
dict.AddOrUpdate("visits", 1, (key, old) => old + 1);
dict.AddOrUpdate("visits", 1, (key, old) => old + 1);

Console.WriteLine(dict["visits"]);   // 2

if (dict.TryGetValue("visits", out int count))
    Console.WriteLine(count);   // 2`,
    explanation: "ConcurrentDictionary uses fine-grained locking (lock striping) so multiple threads can read and write concurrently; GetOrAdd and AddOrUpdate provide atomic read-modify-write operations.",
  },
  {
    id: "cs-caveats-struct-mutation",
    language: "csharp",
    title: "Mutating a struct through a readonly field silently copies",
    tag: "caveats",
    code: `struct Counter
{
    public int Value;
    public void Increment() { Value++; }
}

class Holder
{
    public readonly Counter C = new();
}

var h = new Holder();
h.C.Increment();   // increments a COPY; h.C.Value is still 0
Console.WriteLine(h.C.Value);  // 0  (surprising!)

// Fix: use a class, or return a new struct value`,
    explanation: "When you access a struct through a readonly field, the compiler makes a defensive copy before calling any methods; the copy is mutated but the original field stays unchanged.",
  },
  {
    id: "cs-types-record-struct",
    language: "csharp",
    title: "record struct: value semantics with generated equality",
    tag: "types",
    code: `record struct Point(double X, double Y)
{
    public double Distance => Math.Sqrt(X*X + Y*Y);
}

var p1 = new Point(3, 4);
var p2 = new Point(3, 4);

Console.WriteLine(p1 == p2);          // True (value equality)
Console.WriteLine(p1.Distance);       // 5
Console.WriteLine(p1);               // Point { X = 3, Y = 4 }

var p3 = p1 with { Y = 0 };
Console.WriteLine(p3);               // Point { X = 3, Y = 0 }`,
    explanation: "record struct (C# 10) combines struct's stack allocation and value-copy semantics with record's auto-generated value equality, ToString, and with-expression support.",
  },
  {
    id: "cs-families-string-builder",
    language: "csharp",
    title: "string vs StringBuilder vs StringWriter",
    tag: "families",
    code: `using System.Text;

// string: immutable; concatenation creates new objects
string s = "";
for (int i = 0; i < 5; i++) s += i;   // O(n^2) allocations
Console.WriteLine(s);   // 01234

// StringBuilder: mutable buffer; efficient for many appends
var sb = new StringBuilder();
for (int i = 0; i < 5; i++) sb.Append(i);
Console.WriteLine(sb.ToString());   // 01234

// StringWriter: TextWriter wrapping a StringBuilder
var sw = new StringWriter();
sw.Write("hello "); sw.Write("world");
Console.WriteLine(sw.ToString());   // hello world`,
    explanation: "String concatenation in a loop is O(n^2) because each + creates a new string; StringBuilder maintains a resizable buffer and ToString() finalizes it in O(n). StringWriter adapts StringBuilder to any TextWriter API.",
  },
  {
    id: "cs-classes-sealed-record",
    language: "csharp",
    title: "sealed record prevents inheritance",
    tag: "classes",
    code: `sealed record Email(string Address)
{
    public bool IsValid => Address.Contains('@');
}

// Cannot be derived from:
// class WorkEmail : Email {}  // CS8879: cannot derive from sealed

var e = new Email("user@example.com");
Console.WriteLine(e.IsValid);   // True
Console.WriteLine(e);           // Email { Address = user@example.com }`,
    explanation: "Sealing a record prevents further inheritance; it also enables the compiler to devirtualise equality calls and generate more efficient code, so seal records that are meant to be leaf value objects.",
  },
  {
    id: "cs-snippet-null-coalesce-assign",
    language: "csharp",
    title: "??= assigns only when the variable is null",
    tag: "snippet",
    code: `string? name = null;
name ??= "Anonymous";
Console.WriteLine(name);   // Anonymous

name ??= "Other";          // name is already set
Console.WriteLine(name);   // Anonymous -- not overwritten

// Useful for lazy initialisation
List<string>? _cache;
List<string> GetCache() => _cache ??= new List<string>();`,
    explanation: "The null-coalescing assignment operator ??= (C# 8) assigns the right-hand value to the variable only when the variable is currently null; it's the idiomatic way to write lazy initialisation.",
  },
  {
    id: "cs-understanding-boxing",
    language: "csharp",
    title: "Boxing wraps a value type in a heap-allocated object",
    tag: "understanding",
    code: `int x = 42;
object boxed = x;          // boxing: heap allocation
int unboxed = (int)boxed;  // unboxing: cast + copy

// Common source of boxing: non-generic collections
var list = new System.Collections.ArrayList();
list.Add(1);   // boxes the int

// Generic collections avoid boxing
var typed = new List<int>();
typed.Add(1);  // no boxing

Console.WriteLine(boxed.GetType());  // System.Int32`,
    explanation: "Boxing copies a value type into a new heap object; unboxing extracts it back. Both have a cost in allocation and GC pressure; generic collections eliminate boxing for value types by storing them directly.",
  },
  {
    id: "cs-types-enum-flags",
    language: "csharp",
    title: "[Flags] enum enables bitwise combination of values",
    tag: "types",
    code: `[Flags]
enum Permissions
{
    None    = 0,
    Read    = 1 << 0,   // 1
    Write   = 1 << 1,   // 2
    Execute = 1 << 2,   // 4
    All     = Read | Write | Execute
}

var user = Permissions.Read | Permissions.Write;
Console.WriteLine(user);                            // Read, Write
Console.WriteLine(user.HasFlag(Permissions.Read));  // True
Console.WriteLine(user.HasFlag(Permissions.Execute)); // False`,
    explanation: "[Flags] tells the runtime and ToString to treat the enum as a bitmask; always define power-of-two values and a zero None value. HasFlag checks if a specific bit combination is set.",
  },
  {
    id: "cs-structures-sorted-dict",
    language: "csharp",
    title: "SortedDictionary vs Dictionary: ordering trade-off",
    tag: "structures",
    code: `var d = new Dictionary<string, int>  { ["c"] = 3, ["a"] = 1, ["b"] = 2 };
var sd = new SortedDictionary<string, int> { ["c"] = 3, ["a"] = 1, ["b"] = 2 };

// Dictionary: O(1) average, unordered iteration
Console.WriteLine(string.Join(",", d.Keys));   // c,a,b

// SortedDictionary: O(log n) ops, iterates in key order
Console.WriteLine(string.Join(",", sd.Keys));  // a,b,c`,
    explanation: "SortedDictionary is backed by a red-black tree giving O(log n) operations and in-order enumeration; Dictionary uses a hash table for O(1) average operations but with no ordering guarantee.",
  }
];
