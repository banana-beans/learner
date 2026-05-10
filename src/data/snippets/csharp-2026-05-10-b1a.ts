import type { Snippet } from "./types";

export const csharpSnippets20260510B1A: Snippet[] = [
  {
    id: "cs-snippet-params-collection",
    language: "csharp",
    title: "params collections accept any IEnumerable type (C# 13)",
    tag: "snippet",
    code: `// C# 13: params now works with any collection type, not just arrays
static int Sum(params IEnumerable<int> numbers)
{
    int total = 0;
    foreach (int n in numbers) total += n;
    return total;
}

// Call with a list, span, or inline args
Console.WriteLine(Sum(1, 2, 3, 4, 5));               // 15 -- inline args
Console.WriteLine(Sum(new List<int> { 10, 20, 30 })); // 60 -- List<T>

int[] arr = [1, 2, 3];
Console.WriteLine(Sum(arr));   // 6 -- array

// ReadOnlySpan<T> overload avoids heap allocation
static int SumSpan(params ReadOnlySpan<int> nums)
{
    int total = 0;
    foreach (int n in nums) total += n;
    return total;
}
Console.WriteLine(SumSpan(1, 2, 3));   // 6 -- stack-allocated, no heap`,
    explanation: "C# 13 extends params to any collection type that supports the collection expression syntax (IEnumerable<T>, List<T>, Span<T>, etc.). The ReadOnlySpan<T> overload is particularly useful for performance since inline arguments are stored on the stack without a heap allocation.",
  },
  {
    id: "cs-snippet-lock-object-type",
    language: "csharp",
    title: "System.Threading.Lock replaces object locking (C# 13)",
    tag: "snippet",
    code: `using System.Threading;

// C# 13: System.Threading.Lock is the preferred lock primitive
Lock _lock = new Lock();

// lock statement works with Lock objects
void CriticalSection(string name)
{
    lock (_lock)
    {
        Console.WriteLine($"{name} entered");
        Thread.Sleep(10);
        Console.WriteLine($"{name} exiting");
    }
}

// EnterScope() for try/finally pattern (IDisposable)
void CriticalSection2(string name)
{
    using (_lock.EnterScope())
    {
        Console.WriteLine($"{name} with using");
    }
}

var t1 = new Thread(() => CriticalSection("T1"));
var t2 = new Thread(() => CriticalSection("T2"));
t1.Start(); t2.Start();
t1.Join();  t2.Join();`,
    explanation: "System.Threading.Lock (C# 13 / .NET 9) is a dedicated lock type that replaces locking on plain objects. The lock statement recognises Lock and uses EnterScope() internally, which avoids boxing and improves performance. Use EnterScope() in a using statement for explicit try/finally patterns.",
  },
  {
    id: "cs-snippet-alias-any-type",
    language: "csharp",
    title: "using aliases can alias any type including tuples (C# 12)",
    tag: "snippet",
    code: `// C# 12: 'using' can alias any type, including tuples, arrays, and pointers
using Point = (double X, double Y);
using Matrix = double[][];
using StringPair = (string First, string Last);

// Use the aliases like normal types
Point origin = (0.0, 0.0);
Point p = (3.0, 4.0);

double distance = Math.Sqrt(
    Math.Pow(p.X - origin.X, 2) +
    Math.Pow(p.Y - origin.Y, 2));
Console.WriteLine(distance);   // 5

// Named tuple members work through the alias
StringPair name = ("John", "Doe");
Console.WriteLine($"{name.First} {name.Last}");   // John Doe

// Matrix alias
Matrix m = [[1, 2], [3, 4]];
Console.WriteLine(m[0][0]);   // 1`,
    explanation: "C# 12 allows using aliases for any type, not just named types — including tuples, arrays, nullable types, and pointer types. This gives complex types a short, readable name without wrapping them in a class. Named tuple members are preserved through the alias.",
  },
  {
    id: "cs-snippet-collection-expression-spread",
    language: "csharp",
    title: "Collection expressions with spread operator .. (C# 12)",
    tag: "snippet",
    code: `// C# 12 collection expressions and spread operator
int[] first  = [1, 2, 3];
int[] second = [4, 5, 6];

// Spread with .. to concatenate collections inline
int[] combined = [..first, ..second, 7, 8];
Console.WriteLine(string.Join(", ", combined));
// 1, 2, 3, 4, 5, 6, 7, 8

// Works with List<T>
List<string> a = ["apple", "banana"];
List<string> b = ["cherry", "date"];
List<string> all = [..a, ..b, "elderberry"];
Console.WriteLine(all.Count);   // 5

// Mixed types that have a common base
IReadOnlyList<int> ro = [1, 2, 3];

// Span<T> with spread (efficient, no intermediate allocations)
Span<int> span1 = [1, 2];
Span<int> span2 = [3, 4];
int[] merged = [..span1, ..span2];
Console.WriteLine(merged.Length);   // 4`,
    explanation: "The spread operator (..) in collection expressions expands an IEnumerable into the containing collection inline. This replaces Concat(), AddRange(), and manual copying. The compiler optimises spread expressions — for Span<T> and known-size collections, it may allocate the exact final size upfront.",
  },
  {
    id: "cs-snippet-default-lambda-params",
    language: "csharp",
    title: "Lambda expressions can have default parameter values (C# 12)",
    tag: "snippet",
    code: `// C# 12: lambdas support default parameter values
var greet = (string name, string greeting = "Hello") =>
    $"{greeting}, {name}!";

Console.WriteLine(greet("Alice"));            // Hello, Alice!
Console.WriteLine(greet("Bob", "Hi"));        // Hi, Bob!

// Works with Func<> too
Func<int, int, int> add = (int x, int y = 1) => x + y;
Console.WriteLine(add(5));      // 6
Console.WriteLine(add(5, 10));  // 15

// Useful for optional config in callback-heavy APIs
var log = (string msg, bool prefix = true) =>
    Console.WriteLine(prefix ? $"[LOG] {msg}" : msg);

log("Starting...");           // [LOG] Starting...
log("raw message", false);    // raw message`,
    explanation: "C# 12 allows lambda parameters to have default values, matching the syntax of regular method parameters. The containing delegate type must be able to represent the arity without the defaults — typically Func or Action, or a compatible delegate. This reduces boilerplate for optional-argument callbacks.",
  },
  {
    id: "cs-snippet-ref-readonly-param",
    language: "csharp",
    title: "ref readonly parameters pass large structs without copying or mutation",
    tag: "snippet",
    code: `readonly struct BigMatrix
{
    public readonly double[,] Data;
    public int Rows { get; }
    public int Cols { get; }

    public BigMatrix(int rows, int cols)
    {
        Rows = rows; Cols = cols;
        Data = new double[rows, cols];
    }
}

// ref readonly: pass by reference (no copy), caller guarantees no write
static double Trace(ref readonly BigMatrix m)
{
    double sum = 0;
    int n = Math.Min(m.Rows, m.Cols);
    for (int i = 0; i < n; i++)
        sum += m.Data[i, i];
    return sum;
}

var mat = new BigMatrix(100, 100);
// No copy of the struct when passing
double t = Trace(ref mat);
Console.WriteLine(t);   // 0`,
    explanation: "ref readonly parameters (C# 12) pass a struct by reference for performance (no copy) while preventing the callee from modifying it. The caller can pass a regular variable with the ref keyword or an rvalue (which the compiler stores temporarily). Use it for large readonly structs to avoid expensive copies.",
  },
  {
    id: "cs-understanding-value-equality-records",
    language: "csharp",
    title: "Records use value-based equality: all properties are compared",
    tag: "understanding",
    code: `record Point(double X, double Y);
record NamedPoint(string Name, double X, double Y) : Point(X, Y);

var p1 = new Point(1.0, 2.0);
var p2 = new Point(1.0, 2.0);
var p3 = new Point(3.0, 4.0);

// Value equality: all properties compared
Console.WriteLine(p1 == p2);   // True  (same values)
Console.WriteLine(p1 == p3);   // False
Console.WriteLine(ReferenceEquals(p1, p2));   // False (different objects)

// GetHashCode is consistent with Equals
Console.WriteLine(p1.GetHashCode() == p2.GetHashCode());   // True

// with expression: copies with modifications
var moved = p1 with { X = 10.0 };
Console.WriteLine(moved);   // Point { X = 10, Y = 2 }
Console.WriteLine(p1);      // Point { X = 1, Y = 2 }  (unchanged)

// Inheritance: derived record equality includes base properties
var np = new NamedPoint("A", 1.0, 2.0);
Console.WriteLine(np == new NamedPoint("A", 1.0, 2.0));   // True`,
    explanation: "Record types generate Equals and GetHashCode based on all declared properties, so two records with identical property values are equal even if they're different objects. The with expression creates a non-destructive copy. Inherited records include base properties in equality.",
  },
  {
    id: "cs-understanding-covariance-arrays",
    language: "csharp",
    title: "Array covariance allows assignment but throws at runtime on writes",
    tag: "understanding",
    code: `// Array covariance: string[] can be assigned to object[]
string[] strings = ["hello", "world"];
object[] objs = strings;   // compiles -- arrays are covariant

// Reading is safe
Console.WriteLine(objs[0]);   // hello

// Writing a non-string throws ArrayTypeMismatchException at runtime!
try
{
    objs[1] = 42;   // int is object, but array is really string[]
}
catch (ArrayTypeMismatchException e)
{
    Console.WriteLine(e.GetType().Name);   // ArrayTypeMismatchException
}

// IList<T> / IEnumerable<T> interfaces are also covariant (safely)
IEnumerable<string> strSeq = strings;
IEnumerable<object> objSeq = strSeq;   // covariant, read-only, safe
// objSeq[0] = 42;  -- IEnumerable has no write, so no runtime danger

// List<T> is NOT covariant (no implicit cast)
// List<object> objList = new List<string>();  // compile error`,
    explanation: "Array covariance lets a string[] be stored as object[], but writes check the actual element type at runtime and throw ArrayTypeMismatchException if there's a mismatch. This is a legacy design; generic collections like List<T> are invariant (no implicit covariant conversion) to avoid this runtime trap.",
  },
  {
    id: "cs-understanding-captured-loop-variable",
    language: "csharp",
    title: "Captured loop variables in closures — the classic C# gotcha",
    tag: "understanding",
    code: `// WRONG: all lambdas capture the same 'i' variable
var actions = new List<Action>();
for (int i = 0; i < 5; i++)
    actions.Add(() => Console.Write(i + " "));

foreach (var a in actions) a();
// 5 5 5 5 5  -- all print 5 (i == 5 after loop ends)

Console.WriteLine();

// FIX: capture a copy in a local variable inside the loop
var fixed_actions = new List<Action>();
for (int i = 0; i < 5; i++)
{
    int copy = i;   // new variable per iteration
    fixed_actions.Add(() => Console.Write(copy + " "));
}
foreach (var a in fixed_actions) a();
// 0 1 2 3 4

Console.WriteLine();

// foreach with value types in C# 5+: each iteration gets its own copy
var better = Enumerable.Range(0, 5)
    .Select(n => (Action)(() => Console.Write(n + " ")));
foreach (var a in better) a();
// 0 1 2 3 4  (LINQ Select creates a new 'n' per iteration)`,
    explanation: "Closures capture variables by reference, not by value. In a for loop, all lambdas share the same i variable, which equals the loop's exit value by the time they run. Fix it by copying i to a local variable per iteration. The foreach loop with LINQ Select already creates a new binding per element.",
  },
  {
    id: "cs-understanding-struct-copy",
    language: "csharp",
    title: "Structs are copied on assignment — mutations don't propagate",
    tag: "understanding",
    code: `struct Counter
{
    public int Value;
    public void Increment() => Value++;
}

// Assignment copies the struct
Counter a = new Counter { Value = 5 };
Counter b = a;       // b is a COPY of a
b.Increment();

Console.WriteLine(a.Value);   // 5  (unchanged)
Console.WriteLine(b.Value);   // 6

// Same with method parameters
static void Modify(Counter c)
{
    c.Increment();   // modifies the local copy
}

Counter x = new Counter { Value = 10 };
Modify(x);
Console.WriteLine(x.Value);   // 10  (unchanged)

// ref parameter to mutate in-place
static void ModifyRef(ref Counter c) => c.Increment();
ModifyRef(ref x);
Console.WriteLine(x.Value);   // 11

// Arrays of structs: element access returns a reference in C#
Counter[] arr = [new Counter { Value = 1 }];
arr[0].Increment();   // modifies the array element directly
Console.WriteLine(arr[0].Value);   // 2`,
    explanation: "Structs are value types; every assignment, method call, and return creates a copy. Methods that mutate struct fields must use ref parameters to write back to the original. Accessing a struct array element (arr[i].Method()) directly mutates the element — the compiler optimises away the copy for lvalue expressions.",
  },
  {
    id: "cs-understanding-async-state-machine",
    language: "csharp",
    title: "async/await generates a state machine, not threads",
    tag: "understanding",
    code: `using System.Threading;

static async Task ShowThreads()
{
    Console.WriteLine($"Before await: thread {Thread.CurrentThread.ManagedThreadId}");

    await Task.Delay(10);   // suspends here; thread is RELEASED

    Console.WriteLine($"After await: thread {Thread.CurrentThread.ManagedThreadId}");
    // May be a different thread ID after resuming!
}

await ShowThreads();

// async void: fire-and-forget (avoid except for event handlers)
static async void FireAndForget()
{
    await Task.Delay(10);
    Console.WriteLine("done");
    // Exceptions here are unobserved and crash the process!
}

// The compiler rewrites async methods as a state machine struct
// States: 0=not started, 1=awaiting Task.Delay, 2=after resumption
// No thread is blocked during the await -- the thread returns to the pool`,
    explanation: "async methods are compiled into state machine structs. At each await, the method suspends and returns the calling thread to the thread pool; a continuation resumes on a pool thread (or the original context in UI apps). No OS thread is blocked. async void is dangerous — exceptions become unobserved.",
  },
  {
    id: "cs-understanding-generic-variance",
    language: "csharp",
    title: "Generic variance: covariant out T, contravariant in T",
    tag: "understanding",
    code: `// Covariant (out T): safe to use T as output only
IEnumerable<string> strings = ["a", "b"];
IEnumerable<object> objects = strings;   // OK: string IS-A object, read-only
// objects.Add(42);  -- IEnumerable has no Add, so no write danger

// IReadOnlyList<T> is also covariant (out T)
IReadOnlyList<string> roList = new List<string> { "x" };
IReadOnlyList<object> roObj = roList;   // OK

// Contravariant (in T): safe to use T as input only
Action<object> actObj = o => Console.WriteLine(o);
Action<string> actStr = actObj;   // OK: can use string-handler as object-handler
actStr("hello");   // works

// IComparer<T> is contravariant: IComparer<object> can compare strings
IComparer<object> objComp = Comparer<object>.Default;
IComparer<string> strComp = objComp;   // OK

// Invariant: List<T> -- cannot assign List<string> to List<object>
// List<object> x = new List<string>();  // compile error`,
    explanation: "out T (covariant) means T only appears in output positions; you can assign a derived to a base (List<string> to IEnumerable<object>). in T (contravariant) means T only appears in input positions; you can assign a base to a derived handler (Action<object> to Action<string>). Both prevent the ArrayTypeMismatchException problem of array covariance.",
  },
  {
    id: "cs-structures-priority-queue-custom",
    language: "csharp",
    title: "PriorityQueue<TElement,TPriority> with custom comparer",
    tag: "structures",
    code: `using System.Collections.Generic;

// Max-heap: reverse the default min-heap using a custom comparer
var maxHeap = new PriorityQueue<string, int>(
    Comparer<int>.Create((a, b) => b.CompareTo(a)));   // reversed

maxHeap.Enqueue("low",    1);
maxHeap.Enqueue("high",   10);
maxHeap.Enqueue("medium", 5);

// Dequeue returns highest priority first
while (maxHeap.Count > 0)
{
    maxHeap.TryDequeue(out string? item, out int priority);
    Console.WriteLine($"{priority}: {item}");
}
// 10: high
// 5:  medium
// 1:  low

// EnqueueRange for bulk insertions
var pq = new PriorityQueue<string, int>();
pq.EnqueueRange([("task-a", 3), ("task-b", 1), ("task-c", 2)]);
Console.WriteLine(pq.Dequeue());   // task-b (priority 1)`,
    explanation: "PriorityQueue<TElement,TPriority> is a min-heap by default (lowest priority value dequeued first). To get a max-heap, pass a reversed comparer. EnqueueRange accepts (element, priority) tuples. Unlike SortedSet, duplicate priorities are allowed and order among equals is unspecified.",
  },
  {
    id: "cs-structures-frozen-dictionary",
    language: "csharp",
    title: "FrozenDictionary for high-performance read-only lookups",
    tag: "structures",
    code: `using System.Collections.Frozen;

// Build from existing dictionary
var source = new Dictionary<string, int>
{
    ["one"]   = 1,
    ["two"]   = 2,
    ["three"] = 3,
};

FrozenDictionary<string, int> frozen = source.ToFrozenDictionary();

// Read-only access — same API as Dictionary
Console.WriteLine(frozen["two"]);          // 2
Console.WriteLine(frozen.ContainsKey("four"));  // False
frozen.TryGetValue("three", out int val);
Console.WriteLine(val);                    // 3

// frozen["five"] = 5;  -- NotSupportedException

// FrozenSet for read-only sets
FrozenSet<string> frozenSet = new HashSet<string> { "a", "b", "c" }
    .ToFrozenSet();
Console.WriteLine(frozenSet.Contains("b"));   // True`,
    explanation: "FrozenDictionary and FrozenSet (.NET 8+) are immutable collections optimised for reads. They use a perfect hash function built from the initial contents, giving faster lookups than regular Dictionary especially for string keys. Build them once at startup, then share across threads without locking.",
  },
  {
    id: "cs-structures-immutable-dict",
    language: "csharp",
    title: "ImmutableDictionary: persistent functional dictionary",
    tag: "structures",
    code: `using System.Collections.Immutable;

var dict = ImmutableDictionary<string, int>.Empty;

// Each operation returns a NEW dictionary; original is unchanged
var d1 = dict.Add("a", 1);
var d2 = d1.Add("b", 2).Add("c", 3);

Console.WriteLine(dict.Count);   // 0 (original empty)
Console.WriteLine(d2.Count);     // 3

// SetItem: add or update
var d3 = d2.SetItem("a", 99);
Console.WriteLine(d3["a"]);   // 99
Console.WriteLine(d2["a"]);   // 1  (d2 unchanged)

// Remove
var d4 = d3.Remove("b");
Console.WriteLine(d4.ContainsKey("b"));   // False

// Bulk build: efficient builder
var builder = ImmutableDictionary.CreateBuilder<string, int>();
builder.Add("x", 10); builder.Add("y", 20);
ImmutableDictionary<string, int> built = builder.ToImmutable();`,
    explanation: "ImmutableDictionary uses a structural-sharing (HAMT) tree, so Add/Remove/SetItem return new dictionaries in O(log n) while sharing most of the internal structure with the original. Use ImmutableDictionary.CreateBuilder() when constructing many entries at once — it mutates in place then seals with ToImmutable().",
  },
  {
    id: "cs-structures-linked-list",
    language: "csharp",
    title: "LinkedList<T>: O(1) insertion/removal at known nodes",
    tag: "structures",
    code: `var list = new LinkedList<int>();

// AddFirst / AddLast
list.AddLast(1);
list.AddLast(2);
list.AddLast(3);
list.AddFirst(0);

Console.WriteLine(string.Join(" -> ", list));   // 0 -> 1 -> 2 -> 3

// Get a node and insert after it — O(1), no shifting
var node2 = list.Find(2)!;
list.AddAfter(node2, 99);
Console.WriteLine(string.Join(" -> ", list));   // 0 -> 1 -> 2 -> 99 -> 3

// Remove a node by reference — O(1)
list.Remove(node2);
Console.WriteLine(string.Join(" -> ", list));   // 0 -> 1 -> 99 -> 3

// Move to front (detach + re-add) — O(1) with node reference
var node99 = list.Find(99)!;
list.Remove(node99);
list.AddFirst(node99);
Console.WriteLine(string.Join(" -> ", list));   // 99 -> 0 -> 1 -> 3`,
    explanation: "LinkedList<T> stores LinkedListNode<T> references that allow O(1) insertion and removal at a known position — no shifting needed. This makes it ideal for LRU caches, task queues, or any structure requiring frequent mid-list insertions. The trade-off is O(n) random access and poor cache locality.",
  },
  {
    id: "cs-structures-sorted-set",
    language: "csharp",
    title: "SortedSet<T>: ordered set with range queries",
    tag: "structures",
    code: `var scores = new SortedSet<int> { 85, 72, 90, 65, 88, 95, 78 };

// Always maintained in sorted order
Console.WriteLine(string.Join(", ", scores));
// 65, 72, 78, 85, 88, 90, 95

Console.WriteLine(scores.Min);   // 65
Console.WriteLine(scores.Max);   // 95

// GetViewBetween: efficient range query (no copying)
var high = scores.GetViewBetween(85, 100);
Console.WriteLine(string.Join(", ", high));   // 85, 88, 90, 95

// Reverse: O(n) enumeration in descending order
Console.WriteLine(string.Join(", ", scores.Reverse()));
// 95, 90, 88, 85, 78, 72, 65

// Set operations
var other = new SortedSet<int> { 80, 85, 90, 100 };
scores.IntersectWith(other);
Console.WriteLine(string.Join(", ", scores));   // 85, 90`,
    explanation: "SortedSet<T> is a balanced BST (red-black tree) that keeps elements sorted without duplicates. GetViewBetween returns a live view (not a copy) of the range — mutations to the view affect the original set. Unlike List + Sort, insertions maintain order in O(log n).",
  },
  {
    id: "cs-caveats-string-equality",
    language: "csharp",
    title: "String equality: == vs Equals vs ReferenceEquals vs ordinal",
    tag: "caveats",
    code: `string a = "hello";
string b = "hello";
string c = new string("hello".ToCharArray());   // force new object

// == for strings uses value equality (calls Equals internally)
Console.WriteLine(a == b);             // True
Console.WriteLine(a == c);             // True (value equal)
Console.WriteLine(ReferenceEquals(a, b));   // True  (interned!)
Console.WriteLine(ReferenceEquals(a, c));   // False (new object)

// Equals with StringComparison for control
Console.WriteLine("Hello".Equals("hello", StringComparison.Ordinal));          // False
Console.WriteLine("Hello".Equals("hello", StringComparison.OrdinalIgnoreCase)); // True
Console.WriteLine("café".Equals("café", StringComparison.Ordinal));       // False
Console.WriteLine("café".Equals("café", StringComparison.CurrentCulture));// True (normalised)

// null-safe comparison
string? s = null;
Console.WriteLine(string.Equals(s, null));   // True (static method)`,
    explanation: "String == uses value equality via Equals(). ReferenceEquals reveals interning (literals are interned; runtime strings may not be). Ordinal comparison is byte-by-byte and fastest; CurrentCulture handles Unicode normalisation but varies by locale. Always specify StringComparison explicitly in library code.",
  },
  {
    id: "cs-caveats-integer-overflow",
    language: "csharp",
    title: "Integer arithmetic overflows silently by default; use checked",
    tag: "caveats",
    code: `// Unchecked (default): overflow wraps silently
int max = int.MaxValue;   // 2,147,483,647
int overflow = max + 1;
Console.WriteLine(overflow);   // -2147483648 (wrapped!)

// checked block: overflow throws OverflowException
try
{
    int result = checked(max + 1);
}
catch (OverflowException)
{
    Console.WriteLine("OverflowException in checked");
}

// checked block for multiple statements
checked
{
    int x = max;
    x++;   // throws OverflowException
}

// unchecked block: explicit opt-out (useful inside a checked region)
int wrapped = unchecked(max + 1);
Console.WriteLine(wrapped);   // -2147483648

// For large values, use long or BigInteger
long big = (long)max + 1;
Console.WriteLine(big);   // 2147483648`,
    explanation: "Integer arithmetic in C# silently wraps on overflow by default. The checked keyword or block throws OverflowException on overflow. Use it in security-sensitive or financial code. For values that may exceed int.MaxValue, use long; for arbitrary precision, use System.Numerics.BigInteger.",
  },
  {
    id: "cs-caveats-dispose-async",
    language: "csharp",
    title: "IAsyncDisposable requires await using, not plain using",
    tag: "caveats",
    code: `class AsyncResource : IAsyncDisposable
{
    public async ValueTask DisposeAsync()
    {
        Console.WriteLine("async cleanup started");
        await Task.Delay(10);   // simulated async flush
        Console.WriteLine("async cleanup done");
    }
}

// CORRECT: await using calls DisposeAsync()
await using (var res = new AsyncResource())
{
    Console.WriteLine("using resource");
}
// using resource
// async cleanup started
// async cleanup done

// WRONG: plain using calls IDisposable.Dispose(), which may not exist
// using (var res = new AsyncResource()) { }
// -- If only IAsyncDisposable is implemented, this won't compile
// -- If both are implemented, plain using calls Dispose() -- skips async cleanup!

// await using without braces
await using var res2 = new AsyncResource();
Console.WriteLine("will be disposed at end of scope");`,
    explanation: "Types implementing IAsyncDisposable must be disposed with await using, which calls DisposeAsync() and awaits it. Plain using calls the synchronous IDisposable.Dispose(); if only IAsyncDisposable is implemented, the cleanup is either skipped or calls a sync wrapper that may block the thread.",
  },
  {
    id: "cs-caveats-default-interface-method",
    language: "csharp",
    title: "Default interface methods are not inherited by classes",
    tag: "caveats",
    code: `interface IGreeter
{
    void Greet(string name);
    // Default implementation -- appears in the interface's vtable
    void GreetLoud(string name) => Console.WriteLine(name.ToUpper());
}

class SimpleGreeter : IGreeter
{
    public void Greet(string name) => Console.WriteLine($"Hello, {name}");
    // GreetLoud is NOT inherited; calling via class reference won't work
}

var g = new SimpleGreeter();
g.Greet("Alice");   // Hello, Alice

// Must cast to the interface to reach the default method
((IGreeter)g).GreetLoud("Alice");   // ALICE

// g.GreetLoud("Alice");  -- compile error: SimpleGreeter has no GreetLoud

// Classes can override the default method
class LoudGreeter : IGreeter
{
    public void Greet(string name) => Console.WriteLine($"HELLO, {name.ToUpper()}");
    public void GreetLoud(string name) => Console.WriteLine($"!!{name.ToUpper()}!!");
}`,
    explanation: "Default interface methods are accessible only through the interface reference, not through a class variable. Classes that implement an interface do not inherit its default methods — this avoids the multiple-inheritance diamond problem. Override the method in the class to make it accessible via the class type.",
  },
  {
    id: "cs-caveats-value-task-await-twice",
    language: "csharp",
    title: "ValueTask must not be awaited more than once",
    tag: "caveats",
    code: `// ValueTask is a struct; awaiting it twice is undefined behaviour
static async ValueTask<int> ComputeAsync()
{
    await Task.Delay(10);
    return 42;
}

ValueTask<int> vt = ComputeAsync();

int first = await vt;   // OK
Console.WriteLine(first);   // 42

// WRONG: awaiting the same ValueTask again
// int second = await vt;  // undefined behaviour -- may throw or return stale data

// Safe: convert to Task first (Task can be awaited multiple times)
ValueTask<int> vt2 = ComputeAsync();
Task<int> task = vt2.AsTask();
int a = await task;
int b = await task;   // OK -- Task caches the result
Console.WriteLine(a == b);   // True`,
    explanation: "ValueTask<T> is a struct optimised for synchronous-fast-path methods; it avoids a heap allocation when the result is already available. Unlike Task, a ValueTask must be awaited at most once and must not be used after being awaited. Call .AsTask() to get a re-awaitable Task when multiple consumers are needed.",
  },
  {
    id: "cs-caveats-null-coalescing-assign",
    language: "csharp",
    title: "??= only assigns if the left operand is null",
    tag: "caveats",
    code: `// ??= (null-coalescing assignment): assign only if null
string? name = null;
name ??= "default";
Console.WriteLine(name);   // default

name ??= "other";
Console.WriteLine(name);   // default (not reassigned -- name was not null)

// Equivalent to: if (name is null) name = "other";

// Useful for lazy initialisation
List<int>? _cache = null;
List<int> GetCache() => _cache ??= new List<int>();

var c1 = GetCache();
var c2 = GetCache();
Console.WriteLine(ReferenceEquals(c1, c2));   // True (same list)

// Chaining
string? a = null, b = null, c = "found";
string result = (a ??= b ??= c) ?? "none";
Console.WriteLine(result);   // found
Console.WriteLine(b);        // found (b was assigned)`,
    explanation: "??= (C# 8+) assigns the right-hand value to the left-hand variable only when the variable is null; if already non-null, it does nothing. It's shorter than null-check + assignment and is commonly used for lazy field initialisation. The right side is not evaluated if the left side is already non-null.",
  },
  {
    id: "cs-types-generic-math-iadditionoperators",
    language: "csharp",
    title: "IAdditionOperators<T,T,T> enables generic addition across numeric types",
    tag: "types",
    code: `using System.Numerics;

// IAdditionOperators is satisfied by int, double, decimal, etc.
static T Sum<T>(IEnumerable<T> values) where T : IAdditionOperators<T, T, T>, IAdditiveIdentity<T, T>
{
    T result = T.AdditiveIdentity;   // 0 for numerics
    foreach (T v in values)
        result += v;
    return result;
}

Console.WriteLine(Sum<int>([1, 2, 3, 4, 5]));       // 15
Console.WriteLine(Sum<double>([1.5, 2.5, 3.0]));    // 7
Console.WriteLine(Sum<decimal>([1.1m, 2.2m, 3.3m])); // 6.6

// IMultiplyOperators, IDivisionOperators etc. work the same way
static T Product<T>(T a, T b) where T : IMultiplyOperators<T, T, T>
    => a * b;

Console.WriteLine(Product(3, 4));      // 12
Console.WriteLine(Product(2.5, 4.0));  // 10`,
    explanation: "The generic math interfaces (IAdditionOperators, IMultiplyOperators, etc.) in System.Numerics allow writing truly generic numeric algorithms without overloads. IAdditiveIdentity<T,T> provides the zero value. All built-in numeric types (int, double, decimal, BigInteger) implement these interfaces.",
  },
  {
    id: "cs-types-static-abstract-interface",
    language: "csharp",
    title: "static abstract interface members for type-level contracts",
    tag: "types",
    code: `// Interface with static abstract members (C# 11)
interface IFactory<TSelf, TInput> where TSelf : IFactory<TSelf, TInput>
{
    static abstract TSelf Create(TInput input);
}

class Celsius : IFactory<Celsius, double>
{
    public double Value { get; }
    private Celsius(double v) => Value = v;
    public static Celsius Create(double v) => new(v);
    public override string ToString() => $"{Value}°C";
}

class Fahrenheit : IFactory<Fahrenheit, double>
{
    public double Value { get; }
    private Fahrenheit(double v) => Value = v;
    public static Fahrenheit Create(double v) => new(v);
    public override string ToString() => $"{Value}°F";
}

static T MakeTwo<T>(double a, double b)
    where T : IFactory<T, double>
{
    var first  = T.Create(a);   // static abstract call -- no instance needed
    var second = T.Create(b);
    return first;
}

Console.WriteLine(MakeTwo<Celsius>(100, 0));     // 100°C
Console.WriteLine(MakeTwo<Fahrenheit>(212, 32)); // 212°F`,
    explanation: "Static abstract interface members (C# 11) allow interfaces to define static method and operator contracts. The implementing type provides the static member. This enables generic code that calls factory methods or operators on the type parameter itself — the core mechanism behind generic math.",
  },
  {
    id: "cs-types-nullable-ref-annotations",
    language: "csharp",
    title: "Nullable reference type annotations: ?, !, and MaybeNull",
    tag: "types",
    code: `#nullable enable

// string (non-nullable): type checker warns if assigned null
string nonNull = "hello";
// nonNull = null;   // warning: cannot assign null to non-nullable

// string? (nullable): must null-check before dereferencing
string? maybeNull = null;
// maybeNull.Length;   // warning: possible null dereference

int len = maybeNull?.Length ?? 0;   // safe: null-conditional
Console.WriteLine(len);   // 0

// ! (null-forgiving): suppress the warning when you know it's safe
string definitelyNotNull = maybeNull!;   // suppresses warning
// Console.WriteLine(definitelyNotNull.Length);  // runtime NullRef if wrong!

// Attributes for flow analysis
using System.Diagnostics.CodeAnalysis;

static bool TryGetValue(string key, [MaybeNullWhen(false)] out string value)
{
    value = key == "known" ? "found" : null;
    return value != null;
}

if (TryGetValue("known", out string? result))
    Console.WriteLine(result.Length);   // no warning: TryGetValue returned true`,
    explanation: "Nullable reference types (C# 8+, #nullable enable) add compile-time flow analysis to catch null dereferences. string? means nullable; string means non-nullable. The ! postfix suppresses warnings but doesn't add runtime checks. Attributes like MaybeNullWhen, NotNullWhen, and NotNull guide the analyser through conditional patterns.",
  },
  {
    id: "cs-types-discriminated-union-pattern",
    language: "csharp",
    title: "Discriminated unions via records and pattern matching",
    tag: "types",
    code: `// Simulate discriminated unions with sealed record hierarchy
abstract record Shape;
sealed record Circle(double Radius) : Shape;
sealed record Rectangle(double Width, double Height) : Shape;
sealed record Triangle(double Base, double Height) : Shape;

static double Area(Shape shape) => shape switch
{
    Circle c      => Math.PI * c.Radius * c.Radius,
    Rectangle r   => r.Width * r.Height,
    Triangle t    => 0.5 * t.Base * t.Height,
    _             => throw new ArgumentException($"unknown shape: {shape}")
};

Console.WriteLine(Area(new Circle(5)));           // 78.54...
Console.WriteLine(Area(new Rectangle(4, 6)));     // 24
Console.WriteLine(Area(new Triangle(3, 8)));      // 12

// Exhaustiveness: the compiler warns if a derived type is unhandled
// (when all cases are sealed records, _ is unreachable)

Shape s = new Circle(1);
if (s is Circle { Radius: > 3 } bigCircle)
    Console.WriteLine($"big circle r={bigCircle.Radius}");`,
    explanation: "Sealed record hierarchies model discriminated unions in C#. Pattern matching in switch expressions provides exhaustive handling; the compiler warns when cases may be missed. Records supply structural equality and deconstruction. This pattern is idiomatic for Result<T>, Option<T>, and AST node types.",
  },
  {
    id: "cs-types-span-generics",
    language: "csharp",
    title: "Span<T> and Memory<T>: zero-copy slicing of arrays and strings",
    tag: "types",
    code: `// Span<T>: stack-only, synchronous, zero-copy view
string csv = "Alice,30,London,Engineer";
ReadOnlySpan<char> span = csv.AsSpan();

// Slice without allocating a new string
int idx = span.IndexOf(',');
ReadOnlySpan<char> name = span[..idx];
Console.WriteLine(name.ToString());   // Alice

// Parse numbers directly from a span
ReadOnlySpan<char> rest = span[(idx + 1)..];
idx = rest.IndexOf(',');
int age = int.Parse(rest[..idx]);
Console.WriteLine(age);   // 30

// Memory<T>: heap-safe, can be stored in fields, used across await
ReadOnlyMemory<char> mem = csv.AsMemory();
ReadOnlyMemory<char> nameMem = mem[..5];

async Task ProcessAsync(ReadOnlyMemory<char> data)
{
    await Task.Yield();
    Console.WriteLine(data.Span.ToString());
}
await ProcessAsync(nameMem);   // Alice`,
    explanation: "Span<T> is a stack-only ref struct that provides a view over array, string, or stack memory without copying. ReadOnlySpan<char> lets you slice and parse strings with zero allocations. Memory<T> is the heap-compatible version that can cross async boundaries. Use Span for sync hot paths, Memory for async.",
  },
  {
    id: "cs-families-list-ienumerable-icollection",
    language: "csharp",
    title: "List<T> vs IEnumerable<T> vs ICollection<T> vs IReadOnlyList<T>",
    tag: "families",
    code: `// IEnumerable<T>: read-forward only, lazy, widest contract
IEnumerable<int> seq = Enumerable.Range(1, 5);
foreach (int n in seq) Console.Write(n + " ");  // 1 2 3 4 5

// ICollection<T>: adds Count, Add, Remove, Contains
ICollection<int> col = new List<int> { 1, 2, 3 };
col.Add(4);
Console.WriteLine(col.Count);   // 4

// IList<T>: adds indexer and Insert/RemoveAt
IList<int> lst = new List<int> { 1, 2, 3 };
lst[0] = 99;
Console.WriteLine(lst[0]);   // 99

// IReadOnlyList<T>: read-only indexer + Count (no mutation)
IReadOnlyList<int> ro = new List<int> { 1, 2, 3 };
Console.WriteLine(ro[1]);    // 2
Console.WriteLine(ro.Count); // 3
// ro.Add(4);  -- no Add method

// Return widest read-only type for API surfaces
static IReadOnlyList<int> GetData() => new List<int> { 1, 2, 3 };
// Callers can index and Count but not mutate`,
    explanation: "Use IEnumerable<T> for lazy sequences and function parameters that only iterate. ICollection<T> adds Count and mutation. IList<T> adds random access. IReadOnlyList<T> exposes indexing without mutation — ideal for public API return types. Accepting the widest applicable interface makes methods more reusable.",
  },
  {
    id: "cs-families-dictionary-concurrent",
    language: "csharp",
    title: "Dictionary vs ConcurrentDictionary vs ImmutableDictionary",
    tag: "families",
    code: `using System.Collections.Concurrent;
using System.Collections.Immutable;

// Dictionary<K,V>: fast, single-threaded, not thread-safe
var dict = new Dictionary<string, int>();
dict["a"] = 1;
dict.TryGetValue("a", out int v);
Console.WriteLine(v);   // 1

// ConcurrentDictionary<K,V>: lock-striped, thread-safe mutations
var cd = new ConcurrentDictionary<string, int>();
cd["a"] = 1;
cd.AddOrUpdate("a", 1, (k, old) => old + 1);   // atomic increment
Console.WriteLine(cd["a"]);   // 2
cd.GetOrAdd("b", k => 99);    // atomically adds if missing

// ImmutableDictionary<K,V>: persistent, thread-safe reads
var id = ImmutableDictionary<string, int>.Empty;
var id2 = id.Add("a", 1).Add("b", 2);
Console.WriteLine(id.Count);  // 0 (original unchanged)
Console.WriteLine(id2["a"]);  // 1

// FrozenDictionary: read-only after construction, fastest lookups
var fd = dict.ToFrozenDictionary(StringComparer.Ordinal);
Console.WriteLine(fd["a"]);   // 1`,
    explanation: "Dictionary is the default for single-threaded use. ConcurrentDictionary provides atomic operations (GetOrAdd, AddOrUpdate) for multi-threaded access. ImmutableDictionary is thread-safe for reads and returns new versions for writes (O(log n)). FrozenDictionary uses a perfect hash for maximum read throughput.",
  },
  {
    id: "cs-families-task-valuetask-thread",
    language: "csharp",
    title: "Task vs ValueTask vs Thread vs ThreadPool for async work",
    tag: "families",
    code: `using System.Threading;

// Thread: OS thread, heavy (1 MB stack), full control
var thread = new Thread(() => Console.WriteLine($"thread {Thread.CurrentThread.ManagedThreadId}"));
thread.Start();
thread.Join();

// ThreadPool.QueueUserWorkItem: reuses pool threads, fire-and-forget
ThreadPool.QueueUserWorkItem(_ => Console.WriteLine("pool work item"));
Thread.Sleep(50);   // wait for it

// Task.Run: runs on the pool, returns awaitable Task
Task<int> task = Task.Run(() => { Thread.Sleep(10); return 42; });
Console.WriteLine(await task);   // 42

// Task: heap-allocated, reference type, always async
// ValueTask: stack-/pool-friendly, avoids allocation on sync-fast paths
static async ValueTask<int> MaybeFast(bool fast)
{
    if (fast) return 0;           // no allocation (synchronous)
    await Task.Delay(10);
    return 1;
}
Console.WriteLine(await MaybeFast(true));  // 0`,
    explanation: "Thread gives full OS thread control but is expensive. ThreadPool reuses threads for short-lived work. Task.Run wraps work in an awaitable promise on the pool. ValueTask<T> avoids the Task heap allocation when the result is available synchronously — important in high-throughput servers that serve many fast paths.",
  },
  {
    id: "cs-families-string-builder-interpolated",
    language: "csharp",
    title: "string + vs StringBuilder vs interpolated string handlers",
    tag: "families",
    code: `using System.Text;

// + concatenation: O(n^2) in a loop — allocates a new string each time
string bad = "";
for (int i = 0; i < 1000; i++) bad += i.ToString();   // 1000 allocations

// StringBuilder: O(n) amortised, single allocation at ToString()
var sb = new StringBuilder(capacity: 4000);
for (int i = 0; i < 1000; i++) sb.Append(i);
string good = sb.ToString();   // single allocation
Console.WriteLine(good.Length);

// String.Concat / Join: efficient for known-size collections
string[] parts = ["Hello", ", ", "World", "!"];
Console.WriteLine(string.Concat(parts));   // Hello, World!
Console.WriteLine(string.Join(" | ", parts));   // Hello, | ,  | World! | !

// Interpolated string with IFormattable: no temp string when passed to format methods
// FormattableString s = $"pi={Math.PI:.2f}";  -- deferred formatting
// (In .NET 6+ handlers, $"..." is optimised to use an inline buffer)`,
    explanation: "String + in a loop is O(n²); each concatenation allocates a new string. StringBuilder uses a doubling buffer, making append O(1) amortised. For fixed-size concatenations, string.Concat is optimal. In .NET 6+, interpolated strings use compiler-generated handlers that write into a stack buffer before converting to a string.",
  },
  {
    id: "cs-classes-record-struct",
    language: "csharp",
    title: "record struct: value-type record with stack allocation",
    tag: "classes",
    code: `// record struct: value semantics + auto-generated Equals/ToString/Deconstruct
record struct Point(double X, double Y);

var p1 = new Point(1.0, 2.0);
var p2 = new Point(1.0, 2.0);

Console.WriteLine(p1 == p2);   // True (value equality)
Console.WriteLine(p1);         // Point { X = 1, Y = 2 }

// Mutable by default (unlike record class which is init-only)
var p3 = p1;
p3.X = 99;
Console.WriteLine(p1.X);   // 1.0 -- p3 is a copy, p1 unchanged

// readonly record struct: immutable value type record
readonly record struct Vector(double X, double Y)
{
    public double Length => Math.Sqrt(X * X + Y * Y);
}

Vector v = new(3, 4);
// v.X = 9;   -- CS8852: cannot assign to init-only member
Console.WriteLine(v.Length);   // 5

// with expression still works
Vector w = v with { X = 0 };
Console.WriteLine(w);   // Vector { X = 0, Y = 4 }`,
    explanation: "record struct (C# 10) combines record convenience (auto Equals, ToString, Deconstruct, with) with value-type semantics (stack-allocated, copied on assignment). Without readonly, fields are mutable. readonly record struct gives an immutable stack-allocated value type — ideal for mathematical types like coordinates and RGB colours.",
  },
  {
    id: "cs-classes-partial-class",
    language: "csharp",
    title: "partial class splits a class across multiple files",
    tag: "classes",
    code: `// File 1: generated by a tool
// partial class Customer_Generated.cs
partial class Customer
{
    // Generated property
    public int Id { get; set; }
    public string Email { get; set; } = "";
}

// File 2: hand-written
// partial class Customer_Manual.cs
partial class Customer
{
    public string DisplayName => $"Customer #{Id}";

    // partial methods: declaration in generated, implementation in manual
    partial void OnEmailChanged(string newEmail);

    public void SetEmail(string email)
    {
        Email = email;
        OnEmailChanged(email);   // calls manual implementation if it exists
    }
}

// partial method implementation (C# 9+: can have non-void return)
partial class Customer
{
    partial void OnEmailChanged(string newEmail) =>
        Console.WriteLine($"email changed to {newEmail}");
}

var c = new Customer { Id = 1 };
c.SetEmail("alice@example.com");   // email changed to alice@example.com`,
    explanation: "partial class splits a class definition across files; the compiler merges them. Source generators use this to add generated code without modifying hand-written files. partial methods allow generated code to call hooks that only exist if a manual implementation is provided — the call is removed if the method is unimplemented.",
  },
  {
    id: "cs-classes-abstract-generic",
    language: "csharp",
    title: "Abstract generic base class for template method pattern",
    tag: "classes",
    code: `// Template method pattern with generic base class
abstract class Transformer<TInput, TOutput>
{
    // Template method: fixed algorithm skeleton
    public TOutput Transform(TInput input)
    {
        var validated = Validate(input);
        var processed = Process(validated);
        return Finalise(processed);
    }

    protected abstract TInput Validate(TInput input);
    protected abstract TOutput Process(TInput input);
    protected virtual TOutput Finalise(TOutput result) => result;
}

class TextNormaliser : Transformer<string, string>
{
    protected override string Validate(string input) =>
        string.IsNullOrWhiteSpace(input)
            ? throw new ArgumentException("empty")
            : input;

    protected override string Process(string input) =>
        input.Trim().ToLowerInvariant();
}

var norm = new TextNormaliser();
Console.WriteLine(norm.Transform("  Hello World  "));   // hello world`,
    explanation: "The template method pattern defines an algorithm skeleton in an abstract base class, with abstract steps that subclasses fill in. Generic type parameters let the base class enforce the contract for different input/output types. virtual Finalise provides a hook with a default implementation subclasses can optionally override.",
  },
  {
    id: "cs-classes-interface-default-override",
    language: "csharp",
    title: "Classes can re-implement interface default methods",
    tag: "classes",
    code: `interface ILogger
{
    void Log(string msg);
    void LogError(string msg) => Log($"[ERROR] {msg}");   // default impl
    void LogInfo(string msg)  => Log($"[INFO] {msg}");    // default impl
}

// Uses both default implementations
class ConsoleLogger : ILogger
{
    public void Log(string msg) => Console.WriteLine(msg);
}

// Overrides one default
class PrefixLogger : ILogger
{
    private readonly string _prefix;
    public PrefixLogger(string prefix) => _prefix = prefix;

    public void Log(string msg) => Console.WriteLine($"{_prefix} {msg}");

    // Override the default LogError with a richer version
    public void LogError(string msg) =>
        Console.WriteLine($"{_prefix} [ERROR] {msg} !!!");
}

ILogger cl = new ConsoleLogger();
ILogger pl = new PrefixLogger("[APP]");

cl.LogError("disk full");     // [ERROR] disk full
pl.LogError("disk full");     // [APP] [ERROR] disk full !!!`,
    explanation: "A class can override a default interface method by simply declaring the method in the class body (no override keyword needed). The class version shadows the default for calls through a class variable. Calls through the interface variable use whichever implementation is most derived in the class's interface implementation chain.",
  },
  {
    id: "cs-classes-sealed-override",
    language: "csharp",
    title: "sealed override prevents further overriding down the hierarchy",
    tag: "classes",
    code: `class Animal
{
    public virtual string Speak() => "...";
}

class Dog : Animal
{
    // sealed: Dog.Speak cannot be overridden by Dog subclasses
    public sealed override string Speak() => "Woof";
}

class Labrador : Dog
{
    // public override string Speak() => "Bark";  // CS0239: sealed
}

// sealed class: nothing can inherit from it
sealed class Singleton
{
    public static Singleton Instance { get; } = new();
    private Singleton() { }
}

// class MySingleton : Singleton { }  // CS0509: cannot inherit from sealed

Dog d = new Dog();
Console.WriteLine(d.Speak());         // Woof

Labrador l = new Labrador();
Console.WriteLine(l.Speak());         // Woof (Dog.Speak inherited)
Console.WriteLine(Singleton.Instance is Singleton);   // True`,
    explanation: "sealed override prevents a method from being overridden further down the inheritance chain while keeping it overrideable from the declaring class upward. A sealed class cannot be subclassed at all. Both signal design intent — sealed methods can also be devirtualised by the JIT, improving performance.",
  },
  {
    id: "cs-classes-extension-method-interface",
    language: "csharp",
    title: "Extension methods add behaviour to interfaces",
    tag: "classes",
    code: `interface IShape
{
    double Area();
    double Perimeter();
}

record Circle(double Radius) : IShape
{
    public double Area() => Math.PI * Radius * Radius;
    public double Perimeter() => 2 * Math.PI * Radius;
}

record Rectangle(double Width, double Height) : IShape
{
    public double Area() => Width * Height;
    public double Perimeter() => 2 * (Width + Height);
}

// Extension methods on the interface -- available to all implementers
static class ShapeExtensions
{
    public static bool IsLargerThan(this IShape a, IShape b) =>
        a.Area() > b.Area();

    public static string Describe(this IShape s) =>
        $"area={s.Area():F2}, perimeter={s.Perimeter():F2}";
}

IShape c = new Circle(5);
IShape r = new Rectangle(8, 4);
Console.WriteLine(c.Describe());       // area=78.54, perimeter=31.42
Console.WriteLine(c.IsLargerThan(r));  // True`,
    explanation: "Extension methods on an interface automatically apply to every class that implements it — similar to default interface methods but defined outside the interface. They can be in a different assembly and added without modifying the interface or its implementors. LINQ's entire API is built this way on IEnumerable<T>.",
  },
];
