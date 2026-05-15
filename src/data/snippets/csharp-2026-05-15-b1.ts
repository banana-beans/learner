import type { Snippet } from "./types";
export const csharpSnippets20260515B1: Snippet[] = [
  {
    id: "cs-b15-throwisnull",
    language: "csharp",
    title: "ArgumentNullException.ThrowIfNull",
    tag: "snippet",
    code: `using System;

void Process(string name, object data)
{
    ArgumentNullException.ThrowIfNull(name);   // C# 10 / .NET 6+
    ArgumentNullException.ThrowIfNull(data);

    Console.WriteLine(name.ToUpper());
}

Process("Alice", new object());  // OK
// Process(null, new object());  // ArgumentNullException: name`,
    explanation: "`ArgumentNullException.ThrowIfNull` is the one-liner guard introduced in .NET 6; it avoids the boilerplate `if (x is null) throw new ArgumentNullException(nameof(x))` pattern.",
  },
  {
    id: "cs-b15-collection-initializer",
    language: "csharp",
    title: "Collection initializer syntax",
    tag: "snippet",
    code: `// List initializer
var names = new List<string> { "Alice", "Bob", "Carol" };

// Dictionary initializer
var ages = new Dictionary<string, int>
{
    ["Alice"] = 30,
    ["Bob"]   = 25,
};

// C# 12 collection expression (no 'new' keyword)
List<int> nums = [1, 2, 3, 4, 5];
int[]     arr  = [10, 20, 30];

Console.WriteLine(string.Join(", ", nums));  // 1, 2, 3, 4, 5`,
    explanation: "Collection initializers call `Add` behind the scenes; the C# 12 collection expression syntax `[...]` works for any collection type and is more concise than `new List<T> { ... }`.",
  },
  {
    id: "cs-b15-index-range-hat",
    language: "csharp",
    title: "Index (^) and Range (..) operators",
    tag: "snippet",
    code: `int[] data = { 10, 20, 30, 40, 50 };

// ^ counts from the end
Console.WriteLine(data[^1]);       // 50  (last element)
Console.WriteLine(data[^2]);       // 40  (second-to-last)

// .. creates a Range
Console.WriteLine(string.Join(",", data[1..3]));   // 20,30
Console.WriteLine(string.Join(",", data[..2]));    // 10,20
Console.WriteLine(string.Join(",", data[3..]));    // 40,50
Console.WriteLine(string.Join(",", data[1..^1]));  // 20,30,40`,
    explanation: "`^n` is an index from the end (`^1` == last); `a..b` is a range (exclusive end). Both work with arrays, `Span<T>`, strings, and any type that implements `Index`/`Range` support.",
  },
  {
    id: "cs-b15-tuple-deconstruct",
    language: "csharp",
    title: "ValueTuple deconstruction",
    tag: "snippet",
    code: `// Named tuple from method
(string Name, int Age) GetPerson() => ("Alice", 30);

var (name, age) = GetPerson();
Console.WriteLine($"{name} is {age}");   // Alice is 30

// Positional deconstruct with discard
var (_, score) = ("ignored", 99);
Console.WriteLine(score);   // 99

// Swap two variables without a temp
int a = 1, b = 2;
(a, b) = (b, a);
Console.WriteLine($"a={a} b={b}");  // a=2 b=1`,
    explanation: "ValueTuple deconstruction with `var (x, y) = tuple` is syntactic sugar that calls `Deconstruct` or directly assigns tuple elements — the swap idiom `(a, b) = (b, a)` is particularly elegant.",
  },
  {
    id: "cs-b15-target-typed-new",
    language: "csharp",
    title: "Target-typed new() (C# 9+)",
    tag: "snippet",
    code: `// Target-typed new: type inferred from the left side
List<string>              names   = new();
Dictionary<string, int>   scores  = new();
StringBuilder             sb      = new();

// Works in field initializers
class Config
{
    public List<string> Tags    = new();
    public HashSet<int> Ids     = new();
}

// And in method arguments
void Print(List<int> items) { }
Print(new() { 1, 2, 3 });`,
    explanation: "Target-typed `new()` drops the redundant type name when the compiler can infer it from context — reduces noise in variable declarations and field initializers.",
  },
  {
    id: "cs-b15-using-declaration",
    language: "csharp",
    title: "using declaration (C# 8+)",
    tag: "snippet",
    code: `using System.IO;

void WriteFile(string path, string content)
{
    // Disposed when 'writer' goes out of scope (end of method)
    using var writer = new StreamWriter(path);
    writer.WriteLine(content);
    writer.WriteLine("done");
}   // writer.Dispose() called here automatically

// vs classic using statement (explicit scope)
void WriteFileClassic(string path, string content)
{
    using (var writer = new StreamWriter(path))
    {
        writer.WriteLine(content);
    }   // Dispose called here
}`,
    explanation: "`using var` (without braces) disposes the resource when the enclosing scope ends; it reduces nesting compared to the classic `using (...)  { }` statement.",
  },
  {
    id: "cs-b15-local-func-vs-lambda",
    language: "csharp",
    title: "Local function vs lambda",
    tag: "snippet",
    code: `// Lambda: captures variables, stored as delegate (heap allocation)
Func<int, int> square = x => x * x;

// Local function: no allocation, can be recursive, supports ref/out
int Factorial(int n) => n <= 1 ? 1 : n * Factorial(n - 1);

Console.WriteLine(Factorial(5));   // 120

// Local function also avoids allocating a delegate object
// useful in hot paths or when you need ref params
int Sum(ref int accumulator, int value)
{
    accumulator += value;
    return accumulator;
}`,
    explanation: "Local functions (declared inside another method) are compiled as regular methods — no delegate allocation, they support recursion, `ref`/`out` params, and `unsafe` — unlike lambdas.",
  },
  {
    id: "cs-b15-pattern-is-not-null",
    language: "csharp",
    title: "is not null pattern check",
    tag: "snippet",
    code: `string? name = GetName();

// Old style
if (name != null)
    Console.WriteLine(name.Length);

// Modern pattern (C# 9+)
if (name is not null)
    Console.WriteLine(name.Length);

// Combined with type pattern
object? obj = GetObj();
if (obj is string s and { Length: > 0 })
    Console.WriteLine($"Non-empty string: {s}");

string? GetName() => "Alice";
object? GetObj() => "hello";`,
    explanation: "`is not null` is preferred over `!= null` for nullable reference types because it uses pattern matching — consistent with other patterns and avoids operator overload pitfalls.",
  },
  {
    id: "cs-b15-switch-arm-when",
    language: "csharp",
    title: "switch expression with when guard",
    tag: "snippet",
    code: `int Classify(double value) => value switch
{
    < 0            => -1,
    0              => 0,
    > 0 and < 1    => 1,
    >= 1 and <= 10 => 2,
    _              => 3,
};

Console.WriteLine(Classify(-5));    // -1
Console.WriteLine(Classify(0.5));   // 1
Console.WriteLine(Classify(7));     // 2
Console.WriteLine(Classify(100));   // 3`,
    explanation: "Switch expressions use `=>` arms and support relational patterns (`< 0`), combined patterns (`> 0 and < 1`), and `_` as the default — all without `break` statements.",
  },
  {
    id: "cs-b15-string-join-aggregate",
    language: "csharp",
    title: "string.Join vs LINQ Aggregate",
    tag: "snippet",
    code: `var words = new[] { "Hello", "World", "from", "C#" };

// string.Join: purpose-built, fastest
string s1 = string.Join(" ", words);
Console.WriteLine(s1);   // Hello World from C#

// String.Concat: no separator
string s2 = string.Concat(words);
Console.WriteLine(s2);   // HelloWorldfromC#

// LINQ Aggregate: flexible but slower (allocates per step)
string s3 = words.Aggregate((a, b) => a + " " + b);
Console.WriteLine(s1 == s3);   // True`,
    explanation: "`string.Join` uses `StringBuilder` internally and is the fastest way to join a sequence with a separator; prefer it over LINQ `Aggregate` for string concatenation.",
  },
  {
    id: "cs-b15-understand-value-vs-ref-copy",
    language: "csharp",
    title: "Value type vs reference type copy (trace)",
    tag: "understanding",
    code: `struct Point { public int X, Y; }
class PointRef { public int X, Y; }

Point a = new Point { X = 1, Y = 2 };
Point b = a;          // COPY of the struct
b.X = 99;
Console.WriteLine(a.X);   // 1  — a is unchanged

PointRef c = new PointRef { X = 1, Y = 2 };
PointRef d = c;        // copy of the REFERENCE (same object)
d.X = 99;
Console.WriteLine(c.X);   // 99  — c and d share the object`,
    explanation: "Assigning a struct copies all fields; assigning a class copies only the reference — both `c` and `d` point to the same heap object, so mutations are visible through either name.",
  },
  {
    id: "cs-b15-understand-boxing-interface",
    language: "csharp",
    title: "Boxing a value type via interface (trace)",
    tag: "understanding",
    code: `interface IHasValue { int Value { get; set; } }

struct Counter : IHasValue
{
    public int Value { get; set; }
}

Counter s = new Counter { Value = 0 };
IHasValue iface = s;     // boxing! copies s to the heap

iface.Value = 99;        // mutates the BOXED copy
Console.WriteLine(s.Value);     // 0  — original struct unchanged
Console.WriteLine(iface.Value); // 99 — boxed copy changed`,
    explanation: "Casting a struct to an interface boxes it onto the heap — mutations through the interface don't affect the original stack copy, which is a common source of bugs.",
  },
  {
    id: "cs-b15-understand-captured-loop-var",
    language: "csharp",
    title: "Captured loop variable in lambdas (trace)",
    tag: "understanding",
    code: `var actions = new List<Action>();

// Old-style for loop: i is captured by reference
for (int i = 0; i < 3; i++)
    actions.Add(() => Console.Write(i + " "));

actions.ForEach(a => a());  // 3 3 3  — all see final i=3

actions.Clear();

// Fix: capture a local copy
for (int i = 0; i < 3; i++)
{
    int copy = i;           // new variable per iteration
    actions.Add(() => Console.Write(copy + " "));
}
actions.ForEach(a => a());  // 0 1 2`,
    explanation: "All lambdas in the loop close over the *same* `i` variable; when they execute later `i` is 3. Creating a local copy `int copy = i` inside the loop gives each lambda its own binding.",
  },
  {
    id: "cs-b15-understand-struct-copy",
    language: "csharp",
    title: "Struct mutation through method call (trace)",
    tag: "understanding",
    code: `struct Rect
{
    public int Width, Height;
    public void Scale(int factor) { Width *= factor; Height *= factor; }
}

Rect r = new Rect { Width = 10, Height = 5 };

// Passing to a non-ref method passes a COPY
void BadScale(Rect rect) { rect.Scale(2); }   // mutates the copy
BadScale(r);
Console.WriteLine(r.Width);   // 10  — unchanged!

// Use ref to mutate the original
void GoodScale(ref Rect rect) { rect.Scale(2); }
GoodScale(ref r);
Console.WriteLine(r.Width);  // 20`,
    explanation: "Structs are value types — passing to a method copies the struct. Without `ref`, any mutations inside the method are discarded when the method returns.",
  },
  {
    id: "cs-b15-understand-static-ctor-order",
    language: "csharp",
    title: "Static constructor ordering (trace)",
    tag: "understanding",
    code: `class A
{
    public static int Value = B.Value + 1;  // B initialized first
    static A() { Console.WriteLine($"A cctor, Value={Value}"); }
}

class B
{
    public static int Value = 10;
    static B() { Console.WriteLine($"B cctor, Value={Value}"); }
}

// Accessing A triggers A's static init, which needs B first
Console.WriteLine(A.Value);
// B cctor, Value=10
// A cctor, Value=11
// 11`,
    explanation: "Static constructors run once per type, triggered by first use. If `A`'s initializer references `B`, .NET ensures `B`'s static init runs first — the order depends on the initialization chain.",
  },
  {
    id: "cs-b15-understand-async-void",
    language: "csharp",
    title: "async void exception behavior (trace)",
    tag: "understanding",
    code: `// async void: exceptions are unobservable and crash the process
async void FireAndForget()
{
    await Task.Delay(10);
    throw new InvalidOperationException("boom");
}

// async Task: exceptions are captured in the Task and can be awaited
async Task SafeAsync()
{
    await Task.Delay(10);
    throw new InvalidOperationException("boom");
}

// Prefer async Task; async void only for event handlers
// where the signature requires void:
// button.Click += async (s, e) => { await DoWorkAsync(); };`,
    explanation: "`async void` exceptions bypass the normal Task exception model and surface on the `SynchronizationContext`, making them hard to catch — always use `async Task` except for event handlers.",
  },
  {
    id: "cs-b15-understand-covariant-array",
    language: "csharp",
    title: "Array covariance and ArrayTypeMismatchException (trace)",
    tag: "understanding",
    code: `string[] strings = { "hello", "world" };
object[] objects = strings;   // allowed! array covariance

objects[0] = 42;  // compiles, but throws at runtime:
                  // ArrayTypeMismatchException

// Safe alternative: IReadOnlyList<T> is covariant via 'out'
IReadOnlyList<string> safeStrings = strings;
IReadOnlyList<object> safeObjects = safeStrings;  // OK (read-only)
// safeObjects is read-only so no mutation is possible`,
    explanation: "Array covariance (`string[]` assignable to `object[]`) is a legacy language design; the type safety hole manifests as a runtime exception. Use `IReadOnlyList<out T>` for safe covariance.",
  },
  {
    id: "cs-b15-understand-integer-overflow",
    language: "csharp",
    title: "Integer overflow in unchecked context (trace)",
    tag: "understanding",
    code: `// Default context is unchecked — wraps silently
int max = int.MaxValue;   // 2,147,483,647
int next = max + 1;
Console.WriteLine(next);  // -2,147,483,648  — wrapped!

// checked block raises OverflowException
try
{
    checked
    {
        int boom = int.MaxValue + 1;
    }
}
catch (OverflowException e)
{
    Console.WriteLine(e.Message);  // Arithmetic operation resulted in an overflow.
}

// Use long for counters that might exceed int range
long safe = (long)max + 1;
Console.WriteLine(safe);  // 2,147,483,648`,
    explanation: "C# integer arithmetic wraps silently in the default unchecked context; use `checked { }` or compile with `/checked+` to turn overflow into a catchable `OverflowException`.",
  },
  {
    id: "cs-b15-understand-float-nan",
    language: "csharp",
    title: "NaN comparison behavior (trace)",
    tag: "understanding",
    code: `double nan = double.NaN;

Console.WriteLine(nan == nan);      // False  — NaN != NaN
Console.WriteLine(nan != nan);      // True
Console.WriteLine(nan < 0);         // False
Console.WriteLine(nan > 0);         // False

// Correct check
Console.WriteLine(double.IsNaN(nan));  // True

// Sorting: NaN causes inconsistent comparisons
double[] vals = { 3.0, double.NaN, 1.0 };
Array.Sort(vals);
Console.WriteLine(string.Join(",", vals));  // NaN may appear anywhere`,
    explanation: "IEEE 754 NaN is not equal to itself (`nan != nan` is true); always use `double.IsNaN()` to check for NaN, and guard against NaN values before sorting.",
  },
  {
    id: "cs-b15-understand-string-null",
    language: "csharp",
    title: "null vs \"\" vs string.Empty (trace)",
    tag: "understanding",
    code: `string? a = null;
string  b = "";
string  c = string.Empty;

Console.WriteLine(b == c);           // True  — same value
Console.WriteLine(ReferenceEquals(b, c));  // True  — interned

Console.WriteLine(string.IsNullOrEmpty(a));    // True
Console.WriteLine(string.IsNullOrEmpty(b));    // True
Console.WriteLine(string.IsNullOrEmpty("hi")); // False

// Calling .Length on null throws NullReferenceException
// Calling .Length on "" returns 0`,
    explanation: "`null` and `\"\"` are distinct: `null` has no object, so member access throws; use `string.IsNullOrEmpty` (or `IsNullOrWhiteSpace`) to check both in one call.",
  },
  {
    id: "cs-b15-structures-priority-queue",
    language: "csharp",
    title: "PriorityQueue<T, TPriority>",
    tag: "structures",
    code: `var pq = new PriorityQueue<string, int>();

pq.Enqueue("low priority task",    10);
pq.Enqueue("urgent task",          1);
pq.Enqueue("normal task",          5);
pq.Enqueue("another urgent",       1);

while (pq.Count > 0)
{
    string task = pq.Dequeue();   // smallest priority number first
    Console.WriteLine(task);
}
// urgent task
// another urgent
// normal task
// low priority task`,
    explanation: "`PriorityQueue<TElement, TPriority>` dequeues the element with the *smallest* priority value; for max-heap behavior negate the priority or implement `IComparer<TPriority>`.",
  },
  {
    id: "cs-b15-structures-sorteddict-order",
    language: "csharp",
    title: "SortedDictionary vs Dictionary iteration order",
    tag: "structures",
    code: `var d  = new Dictionary<string, int>();
var sd = new SortedDictionary<string, int>();

foreach (var key in new[] { "banana", "apple", "cherry" })
{
    d[key]  = key.Length;
    sd[key] = key.Length;
}

Console.WriteLine(string.Join(", ", d.Keys));
// insertion order (not guaranteed): banana, apple, cherry

Console.WriteLine(string.Join(", ", sd.Keys));
// always alphabetical: apple, banana, cherry`,
    explanation: "`SortedDictionary<K,V>` keeps keys in sorted order (red-black tree, O(log n) operations); `Dictionary<K,V>` preserves insertion order but is O(1) average — choose based on whether sorted iteration matters.",
  },
  {
    id: "cs-b15-structures-concurrent-dict",
    language: "csharp",
    title: "ConcurrentDictionary.GetOrAdd",
    tag: "structures",
    code: `using System.Collections.Concurrent;

var cache = new ConcurrentDictionary<string, int>();

// Thread-safe get or create — factory called at most once per key
int len = cache.GetOrAdd("hello", key => key.Length);
Console.WriteLine(len);   // 5

// AddOrUpdate: atomically update an existing value
cache.AddOrUpdate(
    "counter",
    addValue: 1,
    updateValueFactory: (key, old) => old + 1);

// TryGetValue before GetOrAdd avoids factory call when cached
if (!cache.TryGetValue("hello", out int cached))
    cached = cache.GetOrAdd("hello", k => k.Length);`,
    explanation: "`GetOrAdd` is atomic: if the key is missing the factory runs and the result is inserted as one operation. Use `TryGetValue` first when the factory is expensive.",
  },
  {
    id: "cs-b15-structures-sortedset-range",
    language: "csharp",
    title: "SortedSet.GetViewBetween for range queries",
    tag: "structures",
    code: `var set = new SortedSet<int> { 5, 12, 3, 8, 20, 1, 15 };

// GetViewBetween returns a live view within [lo, hi] (inclusive)
SortedSet<int> range = set.GetViewBetween(5, 15);
Console.WriteLine(string.Join(", ", range));  // 5, 8, 12, 15

// The view is live — changes to the set appear in the view
set.Add(10);
Console.WriteLine(string.Join(", ", range));  // 5, 8, 10, 12, 15

// Min/Max on the full set
Console.WriteLine(set.Min);   // 1
Console.WriteLine(set.Max);   // 20`,
    explanation: "`SortedSet<T>.GetViewBetween` returns a live `SortedSet<T>` view backed by the original set — efficient O(log n) range access without copying elements.",
  },
  {
    id: "cs-b15-structures-immutable-update",
    language: "csharp",
    title: "ImmutableList.SetItem and Add return new lists",
    tag: "structures",
    code: `using System.Collections.Immutable;

var list = ImmutableList.Create(1, 2, 3, 4, 5);

// All mutations return a NEW list — original is unchanged
var added   = list.Add(6);
var removed = list.Remove(3);
var updated = list.SetItem(0, 99);

Console.WriteLine(string.Join(",", list));     // 1,2,3,4,5
Console.WriteLine(string.Join(",", added));    // 1,2,3,4,5,6
Console.WriteLine(string.Join(",", removed));  // 1,2,4,5
Console.WriteLine(string.Join(",", updated));  // 99,2,3,4,5`,
    explanation: "Immutable collections never modify in-place; every mutation returns a new collection sharing structural pieces with the old one (persistent data structure) — safe to share across threads.",
  },
  {
    id: "cs-b15-structures-hashset-ops",
    language: "csharp",
    title: "HashSet set operations",
    tag: "structures",
    code: `var a = new HashSet<int> { 1, 2, 3, 4, 5 };
var b = new HashSet<int> { 3, 4, 5, 6, 7 };

// Non-destructive queries
Console.WriteLine(a.IsSubsetOf(b));            // False
Console.WriteLine(a.Overlaps(b));              // True

// Mutating operations (modify 'a' in place)
var union = new HashSet<int>(a); union.UnionWith(b);
var inter = new HashSet<int>(a); inter.IntersectWith(b);
var diff  = new HashSet<int>(a); diff.ExceptWith(b);

Console.WriteLine(string.Join(",", union));  // 1,2,3,4,5,6,7
Console.WriteLine(string.Join(",", inter));  // 3,4,5
Console.WriteLine(string.Join(",", diff));   // 1,2`,
    explanation: "`HashSet<T>` exposes set algebra methods: `UnionWith`, `IntersectWith`, `ExceptWith`, `SymmetricExceptWith` — all modify the receiver in-place, so copy first if you need the original.",
  },
  {
    id: "cs-b15-structures-frozen-dict",
    language: "csharp",
    title: "FrozenDictionary for read-only lookup tables",
    tag: "structures",
    code: `using System.Collections.Frozen;

// Build once, query many times — optimised for read performance
var dict = new Dictionary<string, int>
{
    ["apple"]  = 1,
    ["banana"] = 2,
    ["cherry"] = 3,
};

FrozenDictionary<string, int> frozen = dict.ToFrozenDictionary();

Console.WriteLine(frozen["apple"]);                     // 1
Console.WriteLine(frozen.ContainsKey("banana"));        // True
Console.WriteLine(frozen.TryGetValue("mango", out _));  // False`,
    explanation: "`FrozenDictionary<K,V>` (.NET 8+) is optimised at creation time for maximum read throughput — internal layout is tuned to the actual keys. Use it for compile-time-known lookup tables.",
  },
  {
    id: "cs-b15-structures-channel-bounded",
    language: "csharp",
    title: "Channel.CreateBounded for backpressure",
    tag: "structures",
    code: `using System.Threading.Channels;

var ch = Channel.CreateBounded<int>(new BoundedChannelOptions(4)
{
    FullMode = BoundedChannelFullMode.Wait  // writer awaits space
});

// Producer
async Task Produce()
{
    for (int i = 0; i < 8; i++)
    {
        await ch.Writer.WriteAsync(i);
        Console.WriteLine($"wrote {i}");
    }
    ch.Writer.Complete();
}

// Consumer
async Task Consume()
{
    await foreach (var item in ch.Reader.ReadAllAsync())
        Console.WriteLine($"  read {item}");
}`,
    explanation: "A bounded channel limits the in-flight item count; when full, `WriteAsync` awaits until the consumer frees capacity — this backpressure prevents unbounded memory growth.",
  },
  {
    id: "cs-b15-caveat-struct-default",
    language: "csharp",
    title: "Struct fields default to zero / null",
    tag: "caveats",
    code: `struct Invoice
{
    public string Description;   // null by default
    public decimal Amount;       // 0m by default
    public DateTime Date;        // DateTime.MinValue by default
    public bool Paid;            // false by default
}

Invoice inv = default;
Console.WriteLine(inv.Description ?? "(null)");  // (null)
Console.WriteLine(inv.Amount);                   // 0
Console.WriteLine(inv.Date);                     // 01/01/0001

// Auto-default structs (C# 11): constructor doesn't need to set all fields
struct Point { public int X, Y; }
Point p = new Point { X = 3 };   // Y defaults to 0`,
    explanation: "Structs are value types; `default(T)` zero-initialises them — all fields are 0, false, or null. Unlike classes, there's no 'uninitialised struct'; `DateTime.MinValue` is a common surprise.",
  },
  {
    id: "cs-b15-caveat-foreach-readonly-ref",
    language: "csharp",
    title: "foreach loop variable is read-only",
    tag: "caveats",
    code: `int[] nums = { 1, 2, 3 };

// This does NOT compile: loop variable is read-only
// foreach (var n in nums) { n = n * 2; }  // CS1656

// Fix: use a regular for loop
for (int i = 0; i < nums.Length; i++)
    nums[i] *= 2;

Console.WriteLine(string.Join(",", nums));  // 2,4,6

// For structs: foreach over a Span<T> gives a ref alias
Span<int> span = nums;
foreach (ref int x in span)   // C# 7.3+
    x *= 2;
Console.WriteLine(string.Join(",", nums));  // 4,8,12`,
    explanation: "The `foreach` iteration variable is a read-only copy; you can't assign to it. Use a `for` index loop or `foreach (ref T x in span)` to mutate elements in-place.",
  },
  {
    id: "cs-b15-caveat-linq-deferred",
    language: "csharp",
    title: "LINQ deferred execution — double enumeration",
    tag: "caveats",
    code: `var nums = new List<int> { 1, 2, 3 };

// LINQ query is NOT executed yet
IEnumerable<int> query = nums.Where(n => n > 1);

// Materialise once, use twice
nums.Add(4);   // query hasn't run yet!

Console.WriteLine(query.Count());        // 3  (includes 4 — evaluated NOW)
Console.WriteLine(query.Sum());          // 9  (evaluated AGAIN)

// Fix: materialise first
var result = query.ToList();             // one pass
Console.WriteLine(result.Count);        // 3`,
    explanation: "LINQ queries are lazy — they re-enumerate the source on every `Count()`, `Sum()`, or `foreach`. Materialise with `.ToList()` or `.ToArray()` when you need a snapshot or plan to iterate multiple times.",
  },
  {
    id: "cs-b15-caveat-event-multicast-dup",
    language: "csharp",
    title: "Duplicate event handler subscription",
    tag: "caveats",
    code: `class Button { public event EventHandler? Clicked; }

var btn = new Button();
void OnClick(object? s, EventArgs e) => Console.WriteLine("clicked");

// += adds the same handler TWICE — handler fires twice!
btn.Clicked += OnClick;
btn.Clicked += OnClick;

btn.Clicked?.Invoke(btn, EventArgs.Empty);
// clicked
// clicked

// Fix: unsubscribe before subscribing, or check if already subscribed
btn.Clicked -= OnClick;
btn.Clicked += OnClick;
btn.Clicked?.Invoke(btn, EventArgs.Empty);
// clicked  (once)`,
    explanation: "Events use multicast delegates; `+=` with the same method reference adds a second entry. If your subscription code can run more than once (re-initialization, hot-reload), always `-=` before `+=`.",
  },
  {
    id: "cs-b15-caveat-nullable-compare",
    language: "csharp",
    title: "Nullable<T> comparison with null (trace)",
    tag: "caveats",
    code: `int? a = null;
int? b = 5;

// Arithmetic with null always returns null
Console.WriteLine(a + 10);          // (null)
Console.WriteLine(a * b);           // (null)

// Comparison operators: null is NOT less/greater than anything
Console.WriteLine(a < b);           // False
Console.WriteLine(a > b);           // False
Console.WriteLine(a == null);       // True

// Sorting: null sorts as less than any value
int?[] arr = { 5, null, 3, null, 1 };
Array.Sort(arr);   // null, null, 1, 3, 5`,
    explanation: "Comparisons involving `null` `Nullable<T>` always return `false` (not `null`), except `==` — this means `!(a < b)` and `!(a >= b)` can both be true when `a` is null.",
  },
  {
    id: "cs-b15-caveat-decimal-vs-double",
    language: "csharp",
    title: "decimal vs double precision",
    tag: "caveats",
    code: `double d1 = 0.1 + 0.2;
Console.WriteLine(d1);              // 0.30000000000000004
Console.WriteLine(d1 == 0.3);       // False

decimal m1 = 0.1m + 0.2m;
Console.WriteLine(m1);              // 0.3
Console.WriteLine(m1 == 0.3m);      // True

// decimal has 28-29 significant decimal digits but is ~2x slower
// double has ~15-17 significant digits but is hardware-accelerated

// For money: always use decimal
decimal price = 19.99m;
decimal tax   = price * 0.07m;
Console.WriteLine(price + tax);     // 21.3893`,
    explanation: "`decimal` is a 128-bit base-10 type that avoids binary floating-point rounding; it's mandatory for money and slower for scientific computation where `double` is appropriate.",
  },
  {
    id: "cs-b15-types-checked-unchecked",
    language: "csharp",
    title: "checked / unchecked arithmetic blocks",
    tag: "types",
    code: `int max = int.MaxValue;

// Default context is unchecked — silent wrap
int silentWrap = max + 1;
Console.WriteLine(silentWrap);   // -2147483648

// checked throws OverflowException
try
{
    int boom = checked(max + 1);
}
catch (OverflowException) { Console.WriteLine("overflow caught"); }

// checked block for multiple statements
checked
{
    short s = 30000;
    s += 10000;   // OverflowException if > short.MaxValue (32767)
}`,
    explanation: "`checked` / `unchecked` control overflow behaviour for integral arithmetic. The project-level default is unchecked; use `checked` for sensitive computations like financial calculations.",
  },
  {
    id: "cs-b15-types-typeof-gettype",
    language: "csharp",
    title: "typeof(T) vs obj.GetType()",
    tag: "types",
    code: `using System;

class Animal { }
class Dog : Animal { }

// typeof: compile-time, works without an instance
Type t1 = typeof(Dog);
Console.WriteLine(t1.Name);   // Dog

// GetType: runtime, returns the actual concrete type
Animal a = new Dog();
Type t2 = a.GetType();
Console.WriteLine(t2.Name);   // Dog  (not Animal!)

// typeof never boxes; GetType on a value type does
int n = 42;
Console.WriteLine(n.GetType() == typeof(int));    // True
Console.WriteLine(n.GetType() == typeof(object)); // False`,
    explanation: "`typeof(T)` is resolved at compile time with no boxing; `GetType()` is a virtual call on the object and returns the *runtime* type — critical for polymorphism checks.",
  },
  {
    id: "cs-b15-types-nullable-hasvalue",
    language: "csharp",
    title: "Nullable<T> HasValue and Value",
    tag: "types",
    code: `int? score = null;

// Safe access pattern
if (score.HasValue)
    Console.WriteLine(score.Value);

// Null-coalescing
int display = score ?? -1;
Console.WriteLine(display);   // -1

// GetValueOrDefault
int safe = score.GetValueOrDefault(0);
Console.WriteLine(safe);      // 0

// Pattern matching (preferred)
if (score is int actual)
    Console.WriteLine(actual);
else
    Console.WriteLine("no score");   // no score`,
    explanation: "`Nullable<T>` (or `T?`) wraps `HasValue` and `Value`; prefer the `??` operator and `is int x` pattern over `.HasValue`/`.Value` for more concise null handling.",
  },
  {
    id: "cs-b15-types-covariant-out",
    language: "csharp",
    title: "out covariant generic type parameter",
    tag: "types",
    code: `// IEnumerable<T> is covariant (out T)
IEnumerable<string> strings = new List<string> { "a", "b" };
IEnumerable<object> objects = strings;  // allowed!

// Covariance only on interfaces/delegates, not classes
// List<string> → List<object>  NOT ALLOWED (List<T> is invariant)

// Creating a covariant interface
interface IProducer<out T>
{
    T Produce();
}
class StringProducer : IProducer<string>
{
    public string Produce() => "hello";
}
IProducer<object> p = new StringProducer();  // OK via covariance
Console.WriteLine(p.Produce());   // hello`,
    explanation: "`out T` marks a type parameter as covariant: `IProducer<string>` is assignable to `IProducer<object>`. This is only valid when `T` appears only in output positions.",
  },
  {
    id: "cs-b15-types-contravariant-in",
    language: "csharp",
    title: "in contravariant generic type parameter",
    tag: "types",
    code: `// Action<T> is contravariant (in T)
Action<object> printObj  = o  => Console.WriteLine(o);
Action<string> printStr  = printObj;  // allowed! contravariance
printStr("hello");   // hello

// IComparer<T> is also contravariant
IComparer<object> objCmp = Comparer<object>.Default;
IComparer<string> strCmp = objCmp;  // allowed

// Creating a contravariant interface
interface IConsumer<in T> { void Consume(T item); }
class ObjectConsumer : IConsumer<object>
{
    public void Consume(object o) => Console.WriteLine(o);
}
IConsumer<string> c = new ObjectConsumer();  // OK
c.Consume("world");   // world`,
    explanation: "`in T` marks a type parameter as contravariant: `IConsumer<object>` is assignable to `IConsumer<string>`. Valid only when `T` appears only in input (parameter) positions.",
  },
  {
    id: "cs-b15-types-unmanaged-constraint",
    language: "csharp",
    title: "where T : unmanaged generic constraint",
    tag: "types",
    code: `using System.Runtime.InteropServices;

// Unmanaged: struct with no managed references
unsafe void PrintBytes<T>(T value) where T : unmanaged
{
    byte* ptr = (byte*)&value;
    for (int i = 0; i < sizeof(T); i++)
        Console.Write($"{ptr[i]:X2} ");
    Console.WriteLine();
}

// Works with int, double, structs of primitives
PrintBytes(42);       // 2A 00 00 00
PrintBytes(3.14);     // 1F 85 EB 51 B8 1E 09 40

// Does NOT work with string, object, or structs containing refs`,
    explanation: "`where T : unmanaged` restricts the type parameter to blittable value types (no managed references), enabling pointer arithmetic and `sizeof(T)` without `unsafe` object pinning.",
  },
  {
    id: "cs-b15-types-new-constraint",
    language: "csharp",
    title: "where T : new() — parameterless constructor constraint",
    tag: "types",
    code: `class Factory<T> where T : new()
{
    public T Create() => new T();   // requires parameterless ctor

    public List<T> CreateMany(int count)
    {
        var result = new List<T>(count);
        for (int i = 0; i < count; i++)
            result.Add(new T());
        return result;
    }
}

class Config { public string Name = "default"; }

var factory = new Factory<Config>();
var items = factory.CreateMany(3);
Console.WriteLine(items[0].Name);   // default`,
    explanation: "`where T : new()` requires `T` to have a public parameterless constructor; the compiler then allows `new T()` inside the generic method — but consider alternatives like factory delegates for flexibility.",
  },
  {
    id: "cs-b15-types-enum-constraint",
    language: "csharp",
    title: "where T : Enum and Enum utilities",
    tag: "types",
    code: `// Generic method that works with any enum (C# 7.3+)
IEnumerable<T> GetValues<T>() where T : Enum
    => (T[])Enum.GetValues(typeof(T));

enum Color { Red, Green, Blue }
enum Day   { Mon, Tue, Wed, Thu, Fri }

foreach (var c in GetValues<Color>())
    Console.Write(c + " ");  // Red Green Blue
Console.WriteLine();

// Parse / TryParse
Color c2 = Enum.Parse<Color>("Green");
bool ok = Enum.TryParse("Mon", out Day d);
Console.WriteLine(c2);  // Green
Console.WriteLine(ok && d == Day.Mon);  // True`,
    explanation: "`where T : Enum` constrains a type parameter to enum types, enabling generic utility methods like `GetValues<T>()` that work with any enum without reflection gymnastics.",
  },
  {
    id: "cs-b15-types-notnull-constraint",
    language: "csharp",
    title: "where T : notnull constraint",
    tag: "types",
    code: `#nullable enable

// notnull: T must be non-nullable (value type OR non-null ref type)
class NonNullBox<T> where T : notnull
{
    private T _value;
    public NonNullBox(T value) { _value = value; }
    public T Value => _value;
}

var box1 = new NonNullBox<int>(42);
var box2 = new NonNullBox<string>("hello");

// These would produce a warning (nullable reference type):
// var box3 = new NonNullBox<string?>("hi");  // CS8714 warning`,
    explanation: "`where T : notnull` accepts both non-nullable value types and non-nullable reference types — useful for containers that guarantee they never hold a `null` element.",
  },
  {
    id: "cs-b15-families-list-vs-array",
    language: "csharp",
    title: "List<T> vs T[] — when to use which",
    tag: "families",
    code: `// T[]: fixed size, slightly faster indexing, stack-allocatable as Span
int[] arr = { 1, 2, 3, 4, 5 };
Span<int> span = arr;   // zero-copy

// List<T>: dynamic size, richer API
var list = new List<int> { 1, 2, 3 };
list.Add(4);
list.RemoveAt(0);

// Choose array when: size known upfront, max performance, Span<T> needed
// Choose List<T> when: size varies, LINQ operations, API compatibility

// Convert between them
int[] fromList = list.ToArray();
List<int> fromArr = new List<int>(arr);`,
    explanation: "Arrays offer raw speed and `Span<T>` support; `List<T>` adds dynamic resizing and a richer API. Prefer arrays for fixed-size, performance-critical buffers and `List<T>` for dynamic collections.",
  },
  {
    id: "cs-b15-families-task-valuetask",
    language: "csharp",
    title: "Task vs ValueTask — when to use which",
    tag: "families",
    code: `// Task: always allocates on heap — fine for most async work
async Task<int> ReadAsync() {
    await Task.Delay(10);
    return 42;
}

// ValueTask: avoids allocation when result is synchronously available
async ValueTask<int> ReadCachedAsync(bool cached)
{
    if (cached)
        return 42;   // returns synchronously — no Task allocated
    await Task.Delay(10);
    return 42;
}

// Rule: default to Task; use ValueTask for hot-path methods
// where the result is frequently available synchronously`,
    explanation: "`ValueTask<T>` avoids heap allocation when the async operation completes synchronously (cache hit, already-buffered data). Don't use `ValueTask` when the operation always awaits.",
  },
  {
    id: "cs-b15-families-record-class-vs-struct",
    language: "csharp",
    title: "record class vs record struct",
    tag: "families",
    code: `// record class: reference type, heap allocated
record class Point2D(int X, int Y);

// record struct: value type, stack allocated (C# 10+)
record struct Point3D(int X, int Y, int Z);

Point2D a = new(1, 2);
Point2D b = new(1, 2);
Console.WriteLine(a == b);    // True (value equality by default)

Point3D p = new(1, 2, 3);
Point3D q = p;                 // full copy (value type)
q = q with { Z = 99 };
Console.WriteLine(p.Z);       // 3  — p unaffected`,
    explanation: "`record class` is a reference type with value equality and `with` expressions; `record struct` is a value type with the same features but stack-allocated — use it for small immutable data that benefits from avoiding heap allocations.",
  },
  {
    id: "cs-b15-families-span-memory",
    language: "csharp",
    title: "Span<T> vs Memory<T>",
    tag: "families",
    code: `// Span<T>: stack-only, cannot be stored in fields or used across awaits
void ProcessSpan(Span<int> span)
{
    for (int i = 0; i < span.Length; i++) span[i] *= 2;
}

// Memory<T>: can be stored in fields, survives async boundaries
async Task ProcessMemoryAsync(Memory<int> mem)
{
    await Task.Delay(10);
    ProcessSpan(mem.Span);   // convert to Span for sync work
}

int[] data = { 1, 2, 3, 4 };
ProcessSpan(data);
await ProcessMemoryAsync(data);`,
    explanation: "`Span<T>` is a ref struct (stack-only); `Memory<T>` is a managed struct that can be stored in fields and survive `await` points. Use `Span<T>` for synchronous work, `Memory<T>` across async boundaries.",
  },
  {
    id: "cs-b15-families-ilist-ienumerable",
    language: "csharp",
    title: "IList<T> vs IEnumerable<T> vs IReadOnlyList<T>",
    tag: "families",
    code: `// IEnumerable<T>: iteration only, lazy possible
IEnumerable<int> enumerable = new List<int> { 1, 2, 3 };

// IReadOnlyList<T>: indexed read, no mutation
IReadOnlyList<int> readOnly = new List<int> { 1, 2, 3 };
Console.WriteLine(readOnly[0]);   // 1, but no .Add()

// IList<T>: indexed read+write
IList<int> list = new List<int> { 1, 2, 3 };
list[0] = 99; list.Add(4);

// Method parameters: accept the weakest interface you need
void PrintAll(IEnumerable<int> items) { foreach (var i in items) Console.Write(i + " "); }
void GetFirst(IReadOnlyList<int> items) => items[0];`,
    explanation: "Accept the weakest interface in method signatures: `IEnumerable<T>` for iteration, `IReadOnlyList<T>` for indexed reads, `IList<T>` for mutation — this maximises callsite flexibility.",
  },
  {
    id: "cs-b15-families-hashset-sortedset",
    language: "csharp",
    title: "HashSet<T> vs SortedSet<T>",
    tag: "families",
    code: `// HashSet: O(1) add/remove/contains; unordered
var hs = new HashSet<int> { 5, 1, 3, 2, 4 };
Console.WriteLine(string.Join(",", hs));
// unordered output: 5,1,3,2,4 (order undefined)

// SortedSet: O(log n) operations; always sorted
var ss = new SortedSet<int> { 5, 1, 3, 2, 4 };
Console.WriteLine(string.Join(",", ss));   // 1,2,3,4,5
Console.WriteLine(ss.Min);                 // 1
Console.WriteLine(ss.Max);                 // 5
Console.WriteLine(string.Join(",", ss.GetViewBetween(2, 4)));  // 2,3,4`,
    explanation: "`HashSet<T>` is O(1) for membership tests; `SortedSet<T>` is O(log n) but keeps elements ordered and supports range queries. Choose based on whether you need ordering or max-speed lookup.",
  },
  {
    id: "cs-b15-families-abstract-interface",
    language: "csharp",
    title: "abstract class vs interface",
    tag: "families",
    code: `// Interface: pure contract, no state, multiple inheritance allowed
interface ILogger
{
    void Log(string message);
    void LogError(string msg) => Log($"ERROR: {msg}");  // default impl
}

// Abstract class: partial implementation, single inheritance, can have state
abstract class BaseLogger
{
    protected string Prefix = "[LOG]";
    public abstract void Log(string message);
    public void LogError(string msg) => Log($"ERROR: {msg}");
}

// When to use abstract class: shared state / implementation across a family
// When to use interface: contract that unrelated types can satisfy`,
    explanation: "Interfaces define contracts (multiple allowed, no state); abstract classes provide shared implementation and state for a type family. C# 8+ default interface methods blur the line but don't add state.",
  },
  {
    id: "cs-b15-families-action-func-predicate",
    language: "csharp",
    title: "Action / Func / Predicate delegate types",
    tag: "families",
    code: `// Action: void return, 0-16 parameters
Action<string>       print  = Console.WriteLine;
Action<int, int>     swap   = (a, b) => Console.WriteLine($"{b},{a}");

// Func: non-void return, last type is return type
Func<int, int, int>  add    = (a, b) => a + b;
Func<string, int>    len    = s => s.Length;

// Predicate: bool return, single parameter (= Func<T, bool>)
Predicate<int>       isEven = n => n % 2 == 0;

print("hello");                  // hello
Console.WriteLine(add(3, 4));    // 7
Console.WriteLine(isEven(6));    // True`,
    explanation: "`Action<T>` for void callbacks, `Func<TIn, TOut>` for transformations, `Predicate<T>` for filters — all are shorthand delegate types; `Predicate<T>` is exactly `Func<T, bool>`.",
  },
  {
    id: "cs-b15-families-struct-class-memory",
    language: "csharp",
    title: "struct vs class memory layout",
    tag: "families",
    code: `struct SmallValue { public int A, B; }           // 8 bytes, on stack
class  SmallRef   { public int A, B; }           // ~24 bytes, on heap

// Struct array: elements stored contiguously in memory
SmallValue[] arr = new SmallValue[1000];   // ~8 KB contiguous

// Class array: stores references, objects scattered on heap
SmallRef[]   refArr = new SmallRef[1000]; // 8 KB refs + 24 KB * 1000 objects

// Struct method call: no virtual dispatch
// Class method call: virtual dispatch via vtable

// Rule of thumb: < 16 bytes + no identity + immutable → consider struct`,
    explanation: "Struct arrays are cache-friendly (contiguous memory); class object arrays store heap pointers with objects scattered, creating GC pressure and cache misses. Structs avoid GC entirely for value-like data.",
  },
  {
    id: "cs-b15-classes-iequatable",
    language: "csharp",
    title: "Implementing IEquatable<T> correctly",
    tag: "classes",
    code: `class Money : IEquatable<Money>
{
    public decimal Amount { get; }
    public string  Currency { get; }

    public Money(decimal amount, string currency)
        => (Amount, Currency) = (amount, currency);

    public bool Equals(Money? other)
        => other is not null
           && Amount == other.Amount
           && Currency == other.Currency;

    public override bool Equals(object? obj) => Equals(obj as Money);
    public override int  GetHashCode() => HashCode.Combine(Amount, Currency);

    public static bool operator ==(Money? a, Money? b)
        => a?.Equals(b) ?? b is null;
    public static bool operator !=(Money? a, Money? b) => !(a == b);
}`,
    explanation: "A complete `IEquatable<T>` implementation overrides `object.Equals`, `GetHashCode`, and the `==`/`!=` operators — all four must be consistent for correct behaviour in collections and LINQ.",
  },
  {
    id: "cs-b15-classes-icomparable",
    language: "csharp",
    title: "Implementing IComparable<T>",
    tag: "classes",
    code: `class Version : IComparable<Version>
{
    public int Major, Minor, Patch;
    public Version(int ma, int mi, int pa) => (Major, Minor, Patch) = (ma, mi, pa);

    public int CompareTo(Version? other)
    {
        if (other is null) return 1;
        int c = Major.CompareTo(other.Major);
        if (c != 0) return c;
        c = Minor.CompareTo(other.Minor);
        return c != 0 ? c : Patch.CompareTo(other.Patch);
    }

    public override string ToString() => $"{Major}.{Minor}.{Patch}";
}

var versions = new[] { new Version(1,2,0), new Version(1,0,5), new Version(2,0,0) };
Array.Sort(versions);
Console.WriteLine(string.Join(", ", versions as object[]));  // 1.0.5, 1.2.0, 2.0.0`,
    explanation: "`IComparable<T>.CompareTo` returns negative/zero/positive, enabling `Array.Sort`, `SortedSet`, and LINQ `OrderBy` to work with your type without a custom comparer.",
  },
  {
    id: "cs-b15-classes-operator-overload",
    language: "csharp",
    title: "Operator overloading",
    tag: "classes",
    code: `readonly struct Vector2
{
    public float X, Y;
    public Vector2(float x, float y) => (X, Y) = (x, y);

    public static Vector2 operator +(Vector2 a, Vector2 b)
        => new(a.X + b.X, a.Y + b.Y);

    public static Vector2 operator *(Vector2 v, float s)
        => new(v.X * s, v.Y * s);

    public static Vector2 operator *(float s, Vector2 v)
        => v * s;   // commutative: delegate to above

    public float Length => MathF.Sqrt(X * X + Y * Y);
    public override string ToString() => $"({X}, {Y})";
}

var v = new Vector2(3, 4) + new Vector2(1, 0);
Console.WriteLine(v * 2);          // (8, 8)
Console.WriteLine(v.Length);       // 5`,
    explanation: "Operator overloading uses `static` methods named `operator+` etc.; defining both `*(Vec, float)` and `*(float, Vec)` ensures commutativity — the compiler picks the matching overload.",
  },
  {
    id: "cs-b15-classes-implicit-explicit-conv",
    language: "csharp",
    title: "implicit and explicit conversion operators",
    tag: "classes",
    code: `readonly struct Celsius
{
    public double Value { get; }
    public Celsius(double v) => Value = v;

    // implicit: safe, no data loss
    public static implicit operator Fahrenheit(Celsius c)
        => new Fahrenheit(c.Value * 9 / 5 + 32);
}

readonly struct Fahrenheit
{
    public double Value { get; }
    public Fahrenheit(double v) => Value = v;

    // explicit: potential data loss — cast required
    public static explicit operator Celsius(Fahrenheit f)
        => new Celsius((f.Value - 32) * 5 / 9);
}

Celsius c = new Celsius(100);
Fahrenheit f = c;           // implicit: no cast needed
Celsius c2 = (Celsius)f;    // explicit: cast required`,
    explanation: "Implicit conversions happen automatically (safe, no data loss); explicit conversions require a cast at the call site — use explicit when precision or range loss is possible.",
  },
  {
    id: "cs-b15-classes-generic-base",
    language: "csharp",
    title: "Generic base class pattern",
    tag: "classes",
    code: `// Repository pattern with a generic base
abstract class Repository<T, TId>
{
    protected readonly Dictionary<TId, T> _store = new();

    public void Save(TId id, T entity)   => _store[id] = entity;
    public bool TryGet(TId id, out T? e) => _store.TryGetValue(id, out e);
    public void Delete(TId id)           => _store.Remove(id);
    public IEnumerable<T> All()          => _store.Values;
}

class UserRepository : Repository<string, int>
{
    public string? FindByName(string name)
        => All().FirstOrDefault(u => u == name);
}`,
    explanation: "A generic base class captures shared logic parameterised by type; concrete subclasses specialise the type arguments — a lighter-weight alternative to full-blown generic interfaces.",
  },
  {
    id: "cs-b15-classes-sealed-override",
    language: "csharp",
    title: "sealed override prevents further overriding",
    tag: "classes",
    code: `class Base
{
    public virtual string Describe() => "Base";
}

class Middle : Base
{
    public sealed override string Describe() => "Middle";
    // 'sealed' prevents any further override in derived classes
}

class Leaf : Middle
{
    // public override string Describe() => "Leaf";  // CS0239: cannot override sealed
}

Console.WriteLine(new Leaf().Describe());  // Middle

// Benefit: JIT can devirtualise the call — potential perf gain`,
    explanation: "`sealed override` stops the inheritance chain for that method; the JIT may devirtualise calls to `sealed` methods, turning virtual dispatch into a direct call.",
  },
  {
    id: "cs-b15-classes-explicit-interface",
    language: "csharp",
    title: "Explicit interface implementation",
    tag: "classes",
    code: `interface ILogger  { void Log(string msg); }
interface IAudit   { void Log(string msg); }

class Service : ILogger, IAudit
{
    // Explicit: only accessible via the interface, not the class
    void ILogger.Log(string msg) => Console.WriteLine($"[LOG] {msg}");
    void IAudit.Log(string msg)  => Console.WriteLine($"[AUDIT] {msg}");
}

var svc = new Service();
((ILogger)svc).Log("started");   // [LOG] started
((IAudit)svc).Log("action");     // [AUDIT] action
// svc.Log("x");  // CS0117: Service has no member 'Log'`,
    explanation: "Explicit interface implementation resolves name conflicts between two interfaces with the same member signature; the method is hidden from the class's public surface and only accessible through the interface.",
  },
  {
    id: "cs-b15-classes-record-deconstruct",
    language: "csharp",
    title: "record Deconstruct and positional patterns",
    tag: "classes",
    code: `record Point(int X, int Y);
record Circle(Point Center, double Radius);

var c = new Circle(new Point(3, 4), 5.0);

// Positional pattern: uses auto-generated Deconstruct
if (c is Circle(Point(var x, var y), var r))
    Console.WriteLine($"Center: ({x},{y}), r={r}");
// Center: (3,4), r=5

// Manual deconstruct
var (center, radius) = c;
var (cx, cy) = center;
Console.WriteLine(cx);   // 3`,
    explanation: "Positional records auto-generate a `Deconstruct` method matching the primary constructor; this enables destructuring in variable declarations and nested positional patterns in `switch`/`if`.",
  },
  {
    id: "cs-b15-classes-record-with",
    language: "csharp",
    title: "with expression for non-destructive mutation",
    tag: "classes",
    code: `record Person(string Name, int Age, string City);

var alice = new Person("Alice", 30, "London");

// 'with' creates a copy with specified fields changed
var olderAlice = alice with { Age = 31 };
var bobInLondon = alice with { Name = "Bob" };

Console.WriteLine(alice);       // Person { Name = Alice, Age = 30, City = London }
Console.WriteLine(olderAlice);  // Person { Name = Alice, Age = 31, City = London }
Console.WriteLine(alice == olderAlice);  // False

// with on record struct (C# 10+)
record struct Size(int Width, int Height);
var s = new Size(800, 600);
var hd = s with { Width = 1920, Height = 1080 };`,
    explanation: "The `with` expression creates a shallow copy of a record with specified properties changed; the original is unmodified, enabling efficient immutable update patterns.",
  },
  {
    id: "cs-b15-classes-disposable-pattern",
    language: "csharp",
    title: "Full IDisposable pattern",
    tag: "classes",
    code: `class ManagedResource : IDisposable
{
    private bool _disposed = false;

    // Unmanaged resources (e.g. IntPtr)
    private IntPtr _handle = IntPtr.Zero;

    public void Dispose()
    {
        Dispose(disposing: true);
        GC.SuppressFinalize(this);
    }

    protected virtual void Dispose(bool disposing)
    {
        if (_disposed) return;
        if (disposing)
        {
            // Free managed resources here
        }
        // Free unmanaged resources here (always)
        _handle = IntPtr.Zero;
        _disposed = true;
    }

    ~ManagedResource() => Dispose(disposing: false);
}`,
    explanation: "The dispose pattern distinguishes managed cleanup (only when `disposing=true`) from unmanaged cleanup (always); `GC.SuppressFinalize` avoids a redundant finalizer run after explicit `Dispose`.",
  },
  {
    id: "cs-b15-classes-static-ctor-singleton",
    language: "csharp",
    title: "Thread-safe lazy singleton via static constructor",
    tag: "classes",
    code: `class Configuration
{
    // CLR guarantees static constructor runs once, thread-safely
    public static readonly Configuration Instance = new Configuration();

    private readonly Dictionary<string, string> _settings;

    private Configuration()
    {
        _settings = new Dictionary<string, string>
        {
            ["timeout"] = "30",
            ["retries"] = "3",
        };
    }

    public string Get(string key) => _settings.GetValueOrDefault(key, "");
}

Console.WriteLine(Configuration.Instance.Get("timeout"));  // 30`,
    explanation: "The CLR guarantees a static field initialiser runs exactly once in a thread-safe manner; this gives a simpler, allocation-efficient singleton compared to `Lazy<T>` when initialization is always needed.",
  },
  {
    id: "cs-b15-classes-indexer-2d",
    language: "csharp",
    title: "2D indexer on a custom class",
    tag: "classes",
    code: `class Matrix
{
    private readonly double[,] _data;
    public int Rows { get; }
    public int Cols { get; }

    public Matrix(int rows, int cols)
    {
        Rows = rows; Cols = cols;
        _data = new double[rows, cols];
    }

    public double this[int row, int col]
    {
        get => _data[row, col];
        set => _data[row, col] = value;
    }
}

var m = new Matrix(3, 3);
m[0, 0] = 1; m[1, 1] = 2; m[2, 2] = 3;
Console.WriteLine(m[1, 1]);  // 2`,
    explanation: "Indexers are syntactic sugar over `this[params]`; supporting multiple parameters enables 2D subscript syntax `m[row, col]` — the compiler lowers it to `get_Item` and `set_Item` calls.",
  },
  {
    id: "cs-b15-classes-partial-class",
    language: "csharp",
    title: "partial class split across files",
    tag: "classes",
    code: `// File: Order.Core.cs
partial class Order
{
    public int    Id    { get; init; }
    public decimal Total { get; private set; }

    public void AddItem(decimal price) => Total += price;
}

// File: Order.Validation.cs
partial class Order
{
    public bool IsValid()
        => Id > 0 && Total > 0;

    public IEnumerable<string> Validate()
    {
        if (Id <= 0)    yield return "Id must be positive";
        if (Total <= 0) yield return "Total must be positive";
    }
}

// Both halves compile into one class
var o = new Order { Id = 1 };
o.AddItem(9.99m);
Console.WriteLine(o.IsValid());  // True`,
    explanation: "`partial class` lets you split a class across multiple files — useful for separating generated code from hand-written code or grouping related methods (core vs validation vs serialization).",
  },
  {
    id: "cs-b15-classes-finalizer",
    language: "csharp",
    title: "Finalizer for unmanaged resource cleanup",
    tag: "classes",
    code: `class NativeBuffer
{
    private IntPtr _ptr;
    private bool   _freed;

    public NativeBuffer(int size)
    {
        _ptr = System.Runtime.InteropServices.Marshal.AllocHGlobal(size);
    }

    ~NativeBuffer()
    {
        if (!_freed)
        {
            System.Runtime.InteropServices.Marshal.FreeHGlobal(_ptr);
            _freed = true;
        }
    }

    // Always pair with IDisposable for deterministic cleanup
}

// Finalizers run on the GC thread — never throw or block in them`,
    explanation: "Finalizers (`~ClassName`) are a last-resort cleanup for unmanaged memory; the GC calls them non-deterministically. Always also implement `IDisposable` for deterministic release.",
  },
  {
    id: "cs-b15-understand-lazy-thread",
    language: "csharp",
    title: "Lazy<T> thread-safety modes (trace)",
    tag: "understanding",
    code: `// ExecutionAndPublication (default): thread-safe, single init
var safe = new Lazy<int>(() =>
{
    Console.WriteLine("initialized");
    return 42;
});

// Value accessed from two threads — factory runs only once
Parallel.Invoke(
    () => Console.WriteLine(safe.Value),
    () => Console.WriteLine(safe.Value)
);
// initialized   ← printed once
// 42
// 42

// None: no thread safety — fastest but only for single-threaded use
var fast = new Lazy<int>(() => 99, LazyThreadSafetyMode.None);`,
    explanation: "`Lazy<T>` with the default `ExecutionAndPublication` mode guarantees the factory runs once; `LazyThreadSafetyMode.None` skips locking entirely — only safe on single-threaded code paths.",
  },
  {
    id: "cs-b15-understand-dispose-finalize",
    language: "csharp",
    title: "IDisposable vs finalizer order (trace)",
    tag: "understanding",
    code: `class Resource : IDisposable
{
    bool _disposed;

    public void Dispose()
    {
        if (_disposed) return;
        Console.WriteLine("Dispose called");
        _disposed = true;
        GC.SuppressFinalize(this);  // skip finalizer
    }

    ~Resource()
    {
        Console.WriteLine("Finalizer called");
        Dispose();
    }
}

using (var r = new Resource()) { }
// Dispose called   ← deterministic, SuppressFinalize skips ~Resource

var r2 = new Resource();
// GC runs eventually → Finalizer called → Dispose called`,
    explanation: "Calling `Dispose` explicitly (via `using`) runs cleanup immediately and suppresses the finalizer; without `using`, the finalizer runs non-deterministically on the GC thread.",
  },
  {
    id: "cs-b15-caveat-task-result-deadlock",
    language: "csharp",
    title: ".Result / .Wait() deadlock risk",
    tag: "caveats",
    code: `// In a synchronisation-context environment (ASP.NET classic, WinForms):
// Calling .Result or .Wait() on an async method DEADLOCKS because:
// 1. .Result blocks the UI/request thread
// 2. The continuation needs that same thread to resume
// 3. => deadlock

// Safe pattern: use async all the way
async Task SafeAsync()
{
    var data = await GetDataAsync();   // good
    Console.WriteLine(data);
}

// If you MUST call sync, use ConfigureAwait(false):
async Task<string> GetDataAsync()
{
    return await Task.FromResult("data").ConfigureAwait(false);
}`,
    explanation: "`.Result` and `.Wait()` synchronously block the calling thread; in a `SynchronizationContext` environment this deadlocks because the continuation needs the blocked thread. Use `await` end-to-end.",
  },
  {
    id: "cs-b15-caveat-value-tuple-names",
    language: "csharp",
    title: "ValueTuple names are erased at runtime",
    tag: "caveats",
    code: `// Named tuple elements are syntactic sugar over ValueTuple<T1,T2>
(string Name, int Age) person = ("Alice", 30);
Console.WriteLine(person.Name);  // Alice  — works via compiler alias

// At runtime: just a ValueTuple<string, int>
var t = ((ValueTuple<string, int>)(object)person);
// t.Item1 == "Alice", t.Name → compile error at this cast

// Reflection shows no names
var type = person.GetType();
Console.WriteLine(type.Name);   // ValueTuple\`2  — no Name/Age here

// Cross-assembly: names in return types survive in attributes but
// cannot be retrieved reliably via dynamic/reflection`,
    explanation: "Tuple element names exist only at compile time as `[TupleElementNames]` attributes on parameters/return types; at runtime the object is just `ValueTuple<T1,T2>` with `Item1`/`Item2`.",
  },
  {
    id: "cs-b15-caveat-generic-default",
    language: "csharp",
    title: "default(T) for generic types",
    tag: "caveats",
    code: `T GetDefault<T>() => default(T)!;  // ! suppresses nullable warning

Console.WriteLine(GetDefault<int>());      // 0
Console.WriteLine(GetDefault<bool>());     // False
Console.WriteLine(GetDefault<string>());   // (null — may surprise)
Console.WriteLine(GetDefault<int?>());     // (null)

// Gotcha: default(T) for a class T is null, not a "zero" instance
// Use 'where T : new()' if you need an actual object:
T CreateDefault<T>() where T : new() => new T();`,
    explanation: "`default(T)` is `0` for numeric types, `false` for bool, and `null` for reference types and nullable value types — a common source of null reference bugs in generic code.",
  },
  {
    id: "cs-b15-caveat-static-field-order",
    language: "csharp",
    title: "Static field initialization order",
    tag: "caveats",
    code: `class Config
{
    public static readonly int Base   = 10;
    public static readonly int Double = Base * 2;   // 20 — ok
    // If Double were declared BEFORE Base, Double would be 0!

    // Ordering matters: fields init top-to-bottom in source
    public static readonly int Bad    = Computed;   // 0 if Computed below
    public static readonly int Computed = 42;
}

Console.WriteLine(Config.Double);   // 20
Console.WriteLine(Config.Bad);      // 0  — Computed not yet initialized!`,
    explanation: "Static field initialisers run top-to-bottom in source order; if field `A` depends on field `B` that's declared later in the file, `B` is still 0/null when `A` is initialised.",
  },
  {
    id: "cs-b15-caveat-interface-explicit-hide",
    language: "csharp",
    title: "Explicit interface implementation hides members",
    tag: "caveats",
    code: `interface IShape { double Area(); }

class Circle : IShape
{
    public double Radius { get; }
    public Circle(double r) => Radius = r;

    // explicit: only visible through IShape reference
    double IShape.Area() => Math.PI * Radius * Radius;
}

var c = new Circle(5);
// c.Area();  // CS0117: Circle does not contain a definition for 'Area'

IShape shape = c;
Console.WriteLine(shape.Area().ToString("F2"));  // 78.54

// Fix: use explicit only to resolve ambiguity, not as a general hiding mechanism`,
    explanation: "Explicit interface members are hidden from the class's public surface — callers must cast to the interface. This resolves name conflicts but can make APIs unexpectedly hard to call.",
  },
  {
    id: "cs-b15-types-allows-ref-struct",
    language: "csharp",
    title: "allows ref struct generic constraint (C# 13)",
    tag: "types",
    code: `// C# 13: allows ref struct permits Span<T> and other ref structs
// in generic type parameters

interface IProcessor<T> where T : allows ref struct
{
    void Process(T item);
}

// Now you can use Span<byte> as T:
// class ByteProcessor : IProcessor<Span<byte>> { ... }

// Without this constraint, you could NOT substitute a ref struct
// because they can't be used as generic type arguments normally

// This enables building zero-allocation pipeline abstractions
// that work with Span<T>, ReadOnlySpan<T>, etc.`,
    explanation: "`allows ref struct` (C# 13) is an anti-constraint that opts-in to accepting ref structs as type arguments, enabling zero-allocation generic APIs that work with `Span<T>` and `Memory<T>`.",
  },
];
