import type { Snippet } from "./types";

export const csharpSnippets20260519B1: Snippet[] = [
  {
    id: "cs-0519-switch-expression",
    language: "csharp",
    title: "Switch expression with => arms",
    tag: "snippet",
    code: `int day = 3;

// Switch expression (C# 8) — returns a value
string name = day switch
{
    1 => "Monday",
    2 => "Tuesday",
    3 => "Wednesday",
    4 => "Thursday",
    5 => "Friday",
    6 or 7 => "Weekend",
    _ => throw new ArgumentOutOfRangeException()
};

Console.WriteLine(name);  // Wednesday`,
    explanation: "Switch expressions are a concise, value-returning alternative to switch statements; each arm uses => and the discard _ is the default case.",
  },
  {
    id: "cs-0519-tuple-deconstruct",
    language: "csharp",
    title: "Tuple deconstruction and var pattern",
    tag: "snippet",
    code: `// Create a value tuple
(int x, int y) point = (3, 4);

// Deconstruct into variables
var (px, py) = point;
Console.WriteLine(px);  // 3

// Swap without temp using tuples
int a = 1, b = 2;
(a, b) = (b, a);
Console.WriteLine($"{a} {b}");  // 2 1

// Discard unwanted elements
var (first, _, third) = (1, 2, 3);`,
    explanation: "Value tuples support deconstruction into named variables; the discard _ ignores elements you don't need, and swapping via tuple assignment avoids a temporary variable.",
  },
  {
    id: "cs-0519-null-coalesce-assign",
    language: "csharp",
    title: "Null-coalescing assignment ??= (C# 8)",
    tag: "snippet",
    code: `List<int>? items = null;

// ??= assigns only when the left side is null
items ??= new List<int>();
items.Add(1);
Console.WriteLine(items.Count);  // 1

// Repeated call is a no-op (already non-null)
items ??= new List<int> { 99 };
Console.WriteLine(items.Count);  // 1, not reset

// Useful for lazy initialization in properties
private List<string>? _cache;
public List<string> Cache => _cache ??= new List<string>();`,
    explanation: "??= assigns the right-hand side to the left-hand variable only when the variable is null, replacing the common null-guard pattern with a single, readable operator.",
  },
  {
    id: "cs-0519-static-local-function",
    language: "csharp",
    title: "Static local functions prevent accidental closure",
    tag: "snippet",
    code: `int multiplier = 3;

// Without static: can accidentally capture 'multiplier'
int NonStatic(int x) => x * multiplier;

// With static: compiler error if you try to capture outer vars
static int Square(int x) => x * x;  // can't see 'multiplier'

Console.WriteLine(NonStatic(4));  // 12
Console.WriteLine(Square(4));     // 16

// Static local functions also avoid delegate allocation overhead`,
    explanation: "Marking a local function static prevents it from capturing variables from the enclosing scope; the compiler flags accidental captures and the JIT can optimise the call more aggressively.",
  },
  {
    id: "cs-0519-range-index",
    language: "csharp",
    title: "Index ^ and Range .. operators (C# 8)",
    tag: "snippet",
    code: `int[] arr = { 10, 20, 30, 40, 50 };

// ^ counts from the end
Console.WriteLine(arr[^1]);  // 50  (last)
Console.WriteLine(arr[^2]);  // 40

// .. creates a range (start inclusive, end exclusive)
int[] slice = arr[1..3];     // [20, 30]
int[] tail  = arr[^2..];     // [40, 50]
int[] head  = arr[..3];      // [10, 20, 30]
int[] copy  = arr[..];       // all elements`,
    explanation: "The ^ index operator counts from the end (^1 is last), and .. creates a Range; together they give Python-style slice notation that works with arrays, Span<T>, and any type with an indexer.",
  },
  {
    id: "cs-0519-using-declaration",
    language: "csharp",
    title: "using declaration — dispose at end of scope (C# 8)",
    tag: "snippet",
    code: `// Traditional using statement — adds indentation
using (var conn = new System.IO.MemoryStream())
{
    conn.WriteByte(0x42);
}  // disposed here

// using declaration — disposed at end of enclosing scope
static void WriteData()
{
    using var stream = new System.IO.MemoryStream();
    stream.WriteByte(0x42);
    // ... more code
}   // stream disposed here, no extra indentation`,
    explanation: "The using declaration form (without braces) disposes the resource when the enclosing method or block exits, reducing nesting while keeping deterministic cleanup.",
  },
  {
    id: "cs-0519-init-only-property",
    language: "csharp",
    title: "init-only properties (C# 9)",
    tag: "snippet",
    code: `class Point
{
    public int X { get; init; }
    public int Y { get; init; }
}

// Can set via object initializer
var p = new Point { X = 3, Y = 4 };
Console.WriteLine(p.X);  // 3

// Cannot mutate after construction
// p.X = 10;  // CS8852: Init-only property

// Works naturally with records too
record Vector(int X, int Y);  // both properties are init-only`,
    explanation: "init-only properties can be set via object initializers but not afterward, giving you immutable-after-construction semantics without requiring constructor parameters for every field.",
  },
  {
    id: "cs-0519-required-keyword",
    language: "csharp",
    title: "required members (C# 11)",
    tag: "snippet",
    code: `class Config
{
    public required string Host { get; set; }
    public required int    Port { get; set; }
    public string? Username { get; set; }    // optional
}

// Compiler error if Host or Port are missing from initializer
var cfg = new Config
{
    Host = "localhost",
    Port = 5432
    // Username is optional — OK to omit
};`,
    explanation: "required marks properties that must be set in an object initializer; the compiler reports an error at the call site if any required member is missing, without needing a constructor.",
  },
  {
    id: "cs-0519-raw-string-literal",
    language: "csharp",
    title: "Raw string literals (C# 11)",
    tag: "snippet",
    code: `// Raw string: at least three quotes, no escape sequences
string json = """
    {
        "name": "Alice",
        "score": 100
    }
    """;

// Can embed interpolation with matching $$ count
int x = 42;
string msg = $"""The value of x is {x}.""";

// For {{ }} literals inside raw interpolated strings, use $$
string tmpl = $$"""{"key": {{x}}}""";  // {  } becomes literal`,
    explanation: "Raw string literals delimited by \"\"\" need no backslash escapes, making JSON, SQL, and regex strings readable; pairing with $ enables interpolation while keeping the raw formatting.",
  },
  {
    id: "cs-0519-list-pattern",
    language: "csharp",
    title: "List patterns (C# 11)",
    tag: "snippet",
    code: `int[] arr = { 1, 2, 3, 4, 5 };

bool result = arr switch
{
    []              => true,   // empty
    [var only]      => true,   // exactly one element
    [1, 2, ..]      => true,   // starts with 1, 2
    [.., 4, 5]      => true,   // ends with 4, 5
    [var h, .. var t] => true, // head + rest
    _               => false
};

// Deconstruct first and last
if (arr is [var first, .., var last])
    Console.WriteLine($"{first}..{last}");  // 1..5`,
    explanation: "List patterns match arrays and spans structurally: [] for empty, [..] for any, fixed elements for specific values, and var to bind matched elements — all in a single is or switch arm.",
  },
  {
    id: "cs-0519-file-scoped-namespace",
    language: "csharp",
    title: "File-scoped namespace (C# 10)",
    tag: "snippet",
    code: `// Traditional — adds one level of indentation
namespace MyApp.Models
{
    class User { }
}

// File-scoped — entire file is in this namespace
// (one namespace per file, no braces needed)
namespace MyApp.Services;

class UserService
{
    private readonly string _conn;
    public UserService(string conn) => _conn = conn;
}

// All types in this file belong to MyApp.Services`,
    explanation: "File-scoped namespace declarations (ending with ;) apply to the entire file, eliminating one level of indentation in codebases where each file contains exactly one namespace.",
  },
  {
    id: "cs-0519-captured-loop-bug",
    language: "csharp",
    title: "Captured loop variable in closures — classic bug",
    tag: "understanding",
    code: `// Bug: all lambdas capture the same 'i' variable
var actions = new List<Action>();
for (int i = 0; i < 5; i++)
    actions.Add(() => Console.Write(i));

actions.ForEach(a => a());  // 55555 — all print 5!

// Fix: capture a local copy inside the loop
var fixed_ = new List<Action>();
for (int i = 0; i < 5; i++)
{
    int local = i;  // new variable each iteration
    fixed_.Add(() => Console.Write(local));
}
fixed_.ForEach(a => a());  // 01234`,
    explanation: "Lambdas capture variables by reference; the loop variable i is a single variable that becomes 5 after the loop ends, so all closures see 5. Copy to a local inside the loop body to fix it.",
  },
  {
    id: "cs-0519-async-void-danger",
    language: "csharp",
    title: "async void — exceptions are unobservable",
    tag: "understanding",
    code: `// async void: exceptions crash the process — can't be awaited
async void BadHandler()
{
    await Task.Delay(100);
    throw new Exception("unobserved!");  // crashes the app
}

// async Task: caller can await and catch exceptions
async Task GoodHandler()
{
    await Task.Delay(100);
    throw new Exception("caught by caller");
}

// async void is only acceptable for event handlers
// button.Click += async (s, e) => { await DoWork(); };`,
    explanation: "async void methods can't be awaited, so exceptions escape to the synchronization context and usually crash the process; use async Task for everything except event handlers.",
  },
  {
    id: "cs-0519-ref-vs-out-vs-in",
    language: "csharp",
    title: "ref vs out vs in parameters",
    tag: "understanding",
    code: `void Demo(ref int a, out int b, in int c)
{
    a += 1;   // ref: read + write — must be initialised by caller
    b = 42;   // out: write-only — caller doesn't need to initialise
    // c += 1;  // in: read-only — compile error, c is immutable
    _ = c;    // reading c is fine
}

int x = 10, y, z = 99;
Demo(ref x, out y, in z);
Console.WriteLine(x);  // 11
Console.WriteLine(y);  // 42`,
    explanation: "ref allows read/write of the caller's variable; out requires the method to write before returning (no need to initialise first); in passes by reference but is read-only inside the callee.",
  },
  {
    id: "cs-0519-value-type-copy",
    language: "csharp",
    title: "Value type copy semantics",
    tag: "understanding",
    code: `struct Point { public int X, Y; }

Point p1 = new Point { X = 1, Y = 2 };
Point p2 = p1;   // full copy — p2 is independent

p2.X = 99;
Console.WriteLine(p1.X);  // 1  — unaffected

// Contrast with reference types
class PointClass { public int X, Y; }
var c1 = new PointClass { X = 1, Y = 2 };
var c2 = c1;   // copy of reference
c2.X = 99;
Console.WriteLine(c1.X);  // 99 — shared object`,
    explanation: "Structs are value types: assignment copies all fields. Classes are reference types: assignment copies the reference, so both variables alias the same object.",
  },
  {
    id: "cs-0519-string-interning",
    language: "csharp",
    title: "String interning and == vs ReferenceEquals",
    tag: "understanding",
    code: `string a = "hello";
string b = "hello";           // same literal — interned

// == on strings compares content (overloaded)
Console.WriteLine(a == b);                    // True

// ReferenceEquals checks object identity
Console.WriteLine(ReferenceEquals(a, b));     // True (both interned)

string c = new string(new[] {'h','e','l','l','o'});
Console.WriteLine(a == c);                    // True (content)
Console.WriteLine(ReferenceEquals(a, c));     // False (new object)`,
    explanation: "String == compares content because it's overloaded; compile-time string literals are interned so ReferenceEquals may be True, but dynamically created strings with the same content are different objects.",
  },
  {
    id: "cs-0519-boxing-unboxing",
    language: "csharp",
    title: "Boxing and unboxing: cost and pitfalls",
    tag: "understanding",
    code: `int value = 42;

// Boxing: copies the int to a heap-allocated object
object boxed = value;  // allocation + copy

// Unboxing: copies back — must match the exact type
int unboxed = (int)boxed;    // OK
// long wrong = (long)boxed; // InvalidCastException at runtime!

// Generics avoid boxing entirely
var list = new System.Collections.Generic.List<int>();
list.Add(42);  // no boxing

// Old-style ArrayList boxes every int
var al = new System.Collections.ArrayList();
al.Add(42);    // boxes 42`,
    explanation: "Boxing wraps a value type in a heap object (allocation + copy); unboxing extracts it back (cast must be exact). Generics were introduced to eliminate boxing in collections.",
  },
  {
    id: "cs-0519-static-constructor",
    language: "csharp",
    title: "Static constructor — when it runs",
    tag: "understanding",
    code: `class Config
{
    public static readonly string Version;
    public static readonly int MaxRetries;

    // Runs once, before first use of the class
    // No access modifier, no parameters
    static Config()
    {
        Version    = "1.0";
        MaxRetries = 3;
        Console.WriteLine("Static ctor ran");
    }
}

// First access triggers the static ctor
Console.WriteLine(Config.Version);    // "Static ctor ran"  then "1.0"
Console.WriteLine(Config.MaxRetries); // 3  (no second "Static ctor ran")`,
    explanation: "A static constructor runs exactly once, before the first access to any static member or instance creation; there's no way to call it explicitly, and it has no access modifier or parameters.",
  },
  {
    id: "cs-0519-explicit-interface",
    language: "csharp",
    title: "Explicit interface implementation hides the member",
    tag: "understanding",
    code: `interface IReader { string Read(); }
interface IWriter { string Read(); }  // same name, different meaning

class Device : IReader, IWriter
{
    string IReader.Read() => "reading input";
    string IWriter.Read() => "reading output";
}

var dev = new Device();
// dev.Read();  // Compile error — ambiguous

// Must cast to the interface to call
Console.WriteLine(((IReader)dev).Read());  // "reading input"
Console.WriteLine(((IWriter)dev).Read());  // "reading output"`,
    explanation: "Explicit interface implementation resolves method name conflicts between interfaces and hides the method from the class's public API — callers must hold a reference typed to the interface.",
  },
  {
    id: "cs-0519-delegate-multicast",
    language: "csharp",
    title: "Multicast delegates — invocation list",
    tag: "understanding",
    code: `Action<string> log = Console.WriteLine;
log += s => Console.Error.WriteLine("ERR: " + s);
log += s => System.Diagnostics.Debug.WriteLine("DBG: " + s);

// Invokes all three in order
log("hello");  // calls all three handlers

// Removing a handler
Action<string> handler = Console.WriteLine;
log -= handler;  // removes only that exact delegate

// GetInvocationList to inspect
Console.WriteLine(log.GetInvocationList().Length);  // 2`,
    explanation: "Delegates in C# are multicast by default: += adds to the invocation list, -= removes, and invoking the delegate calls all entries in order; the last return value is the delegate's return value.",
  },
  {
    id: "cs-0519-event-vs-delegate",
    language: "csharp",
    title: "event restricts delegate access from outside",
    tag: "understanding",
    code: `class Button
{
    // event restricts: outside can only += / -=
    public event Action? Clicked;

    public void Simulate() => Clicked?.Invoke();
}

var btn = new Button();
btn.Clicked += () => Console.WriteLine("click!");

// btn.Clicked = null;    // error: can only assign inside Button
// btn.Clicked();         // error: can only invoke inside Button
btn.Simulate();  // click!`,
    explanation: "event wraps a delegate field so external code can only subscribe (+= ) or unsubscribe (-=), preventing accidental invocation or replacement of all handlers from outside the class.",
  },
  {
    id: "cs-0519-checked-arithmetic",
    language: "csharp",
    title: "checked vs unchecked for integer overflow",
    tag: "understanding",
    code: `// unchecked (default): overflow wraps silently
int max = int.MaxValue;
Console.WriteLine(unchecked(max + 1));  // -2147483648

// checked: throws OverflowException
try
{
    Console.WriteLine(checked(max + 1));
}
catch (OverflowException e)
{
    Console.WriteLine("overflow!");  // overflow!
}

// You can make a whole block checked
checked
{
    int x = max + 1;  // throws
}`,
    explanation: "By default integer arithmetic wraps on overflow silently; wrapping in checked makes the CLR throw OverflowException instead — useful for financial or safety-critical calculations.",
  },
  {
    id: "cs-0519-default-value",
    language: "csharp",
    title: "default(T) for zero-value of any type",
    tag: "understanding",
    code: `Console.WriteLine(default(int));     // 0
Console.WriteLine(default(bool));    // False
Console.WriteLine(default(string));  // (null)
Console.WriteLine(default(double));  // 0

// Works in generics where T is unknown
static T Identity<T>(T value) => value;
static T Zero<T>() => default!;   // ! suppresses nullable warning

// Since C# 7.1 you can just write 'default' without the type
int x = default;    // 0
string? s = default;  // null`,
    explanation: "default(T) returns the zero-value of any type — 0 for numbers, false for bool, null for reference and nullable types — making it the safe initialiser in generic code.",
  },
  {
    id: "cs-0519-list-vs-array",
    language: "csharp",
    title: "List<T> vs T[] — flexibility vs performance",
    tag: "structures",
    code: `// T[]: fixed size, cache-friendly, faster indexed access
int[] arr = new int[5];
arr[0] = 10;
// arr.Add(6);  // doesn't exist — fixed size

// List<T>: dynamic resize, slightly more overhead
var list = new List<int> { 1, 2, 3 };
list.Add(4);                    // O(1) amortised
list.Insert(0, 0);             // O(n)
list.RemoveAt(0);              // O(n)

// List<T> wraps a T[] internally; use .ToArray() to get a snapshot
int[] snapshot = list.ToArray();`,
    explanation: "T[] has less overhead and is preferred when the size is known; List<T> is more convenient for dynamic collections and internally uses a resizing T[], doubling capacity when needed.",
  },
  {
    id: "cs-0519-linkedlist",
    language: "csharp",
    title: "LinkedList<T> — O(1) insert/remove at known nodes",
    tag: "structures",
    code: `var ll = new LinkedList<int>(new[] { 1, 2, 3, 4, 5 });

// O(1) insert after a node (if you have the node reference)
var node3 = ll.Find(3)!;
ll.AddAfter(node3, 99);   // 1 2 3 99 4 5

// O(1) remove a known node
ll.Remove(node3);          // 1 2 99 4 5

Console.WriteLine(string.Join(" ", ll));  // 1 2 99 4 5

// No O(1) random access — must traverse from head
// Use when you need frequent insertions/deletions mid-list`,
    explanation: "LinkedList<T> stores nodes with prev/next pointers; inserting or removing a node you already have a reference to is O(1), but random access by index requires O(n) traversal.",
  },
  {
    id: "cs-0519-stack-queue",
    language: "csharp",
    title: "Stack<T> vs Queue<T> — LIFO vs FIFO",
    tag: "structures",
    code: `// Stack: Last-In First-Out
var stack = new Stack<int>();
stack.Push(1); stack.Push(2); stack.Push(3);
Console.WriteLine(stack.Pop());    // 3
Console.WriteLine(stack.Peek());   // 2 (no removal)

// Queue: First-In First-Out
var queue = new Queue<int>();
queue.Enqueue(1); queue.Enqueue(2); queue.Enqueue(3);
Console.WriteLine(queue.Dequeue()); // 1
Console.WriteLine(queue.Peek());    // 2`,
    explanation: "Stack<T> uses Push/Pop (LIFO, like undo history) and Queue<T> uses Enqueue/Dequeue (FIFO, like a print queue); both are backed by arrays and support O(1) operations at the ends.",
  },
  {
    id: "cs-0519-sorted-dictionary",
    language: "csharp",
    title: "Dictionary vs SortedDictionary vs SortedList",
    tag: "structures",
    code: `// Dictionary<K,V>: hash table, O(1) lookup, unordered
var dict = new Dictionary<string, int> { ["b"] = 2, ["a"] = 1 };

// SortedDictionary<K,V>: red-black tree, O(log n) lookup, sorted
var sorted = new SortedDictionary<string, int> { ["b"] = 2, ["a"] = 1 };
foreach (var kv in sorted) Console.Write(kv.Key); // ab

// SortedList<K,V>: sorted array pair, O(log n) lookup + binary search
// - less memory than SortedDictionary
// - slower inserts (O(n) due to shifting)
// - faster enumeration and direct index access`,
    explanation: "Dictionary is fastest for lookups; SortedDictionary maintains sorted order with O(log n) operations via a tree; SortedList uses less memory but has O(n) inserts — choose based on insert vs read ratio.",
  },
  {
    id: "cs-0519-hashset",
    language: "csharp",
    title: "HashSet<T> and set operations",
    tag: "structures",
    code: `var a = new HashSet<int> { 1, 2, 3, 4 };
var b = new HashSet<int> { 3, 4, 5, 6 };

// These methods mutate 'a' in place
var union = new HashSet<int>(a); union.UnionWith(b);
Console.WriteLine(string.Join(",", union));  // 1,2,3,4,5,6

var inter = new HashSet<int>(a); inter.IntersectWith(b);
Console.WriteLine(string.Join(",", inter));  // 3,4

var diff = new HashSet<int>(a); diff.ExceptWith(b);
Console.WriteLine(string.Join(",", diff));   // 1,2

// O(1) average Contains — much faster than List<T>.Contains
Console.WriteLine(a.Contains(3));  // True`,
    explanation: "HashSet<T> provides O(1) average add/remove/contains and efficient set-algebra methods; always prefer it over List<T> when you need fast membership tests or duplicate elimination.",
  },
  {
    id: "cs-0519-priority-queue",
    language: "csharp",
    title: "PriorityQueue<T,P> (.NET 6+)",
    tag: "structures",
    code: `var pq = new PriorityQueue<string, int>();

pq.Enqueue("low priority",    10);
pq.Enqueue("high priority",    1);
pq.Enqueue("medium priority",  5);

// Dequeues in ascending priority order (min-heap)
while (pq.Count > 0)
{
    string item = pq.Dequeue();
    Console.WriteLine(item);
}
// high priority
// medium priority
// low priority`,
    explanation: "PriorityQueue<TElement,TPriority> is a min-heap where the element with the lowest priority value dequeues first; it's efficient for Dijkstra's algorithm, task scheduling, and event queues.",
  },
  {
    id: "cs-0519-memory-span",
    language: "csharp",
    title: "Memory<T> vs Span<T> — stack vs heap",
    tag: "structures",
    code: `// Span<T>: stack-only, zero-copy slice of any contiguous memory
Span<int> stackSpan = stackalloc int[] { 1, 2, 3, 4, 5 };
Span<int> slice = stackSpan[1..3];  // no copy
slice[0] = 99;
Console.WriteLine(stackSpan[1]);  // 99

// Memory<T>: heap-friendly, can be stored in fields/tasks
Memory<byte> mem = new byte[100];
Memory<byte> segment = mem.Slice(10, 20);

// Convert Memory to Span for fast operations
Span<byte> span = segment.Span;`,
    explanation: "Span<T> is a ref struct limited to the stack — zero overhead slicing, can't be captured in lambdas or async methods; Memory<T> can live on the heap and wraps Span for async scenarios.",
  },
  {
    id: "cs-0519-immutable-array",
    language: "csharp",
    title: "ImmutableArray<T> — safe shared read-only collection",
    tag: "structures",
    code: `using System.Collections.Immutable;

var builder = ImmutableArray.CreateBuilder<int>();
builder.Add(1); builder.Add(2); builder.Add(3);
ImmutableArray<int> arr = builder.ToImmutable();

// All mutation methods return a new array
ImmutableArray<int> arr2 = arr.Add(4);
Console.WriteLine(arr.Length);   // 3  (unchanged)
Console.WriteLine(arr2.Length);  // 4

// Safe to share across threads — no defensive copies needed
Console.WriteLine(arr[0]);  // 1`,
    explanation: "ImmutableArray<T> is a wrapper over a T[] that exposes no mutation; 'mutations' return new arrays, making it safe to share across threads without locks or defensive copies.",
  },
  {
    id: "cs-0519-concurrent-dict",
    language: "csharp",
    title: "ConcurrentDictionary for thread-safe access",
    tag: "structures",
    code: `using System.Collections.Concurrent;

var counts = new ConcurrentDictionary<string, int>();

// GetOrAdd: atomically get-or-create
counts.GetOrAdd("apples", 0);

// AddOrUpdate: atomically update existing or add new
Parallel.For(0, 1000, _ =>
    counts.AddOrUpdate("apples", 1, (_, c) => c + 1));

Console.WriteLine(counts["apples"]);  // 1000 (no lost updates)`,
    explanation: "ConcurrentDictionary provides lock-free reads and fine-grained locking for writes; GetOrAdd and AddOrUpdate perform atomic check-and-update without external locking.",
  },
  {
    id: "cs-0519-blocking-collection",
    language: "csharp",
    title: "BlockingCollection<T> for producer-consumer",
    tag: "structures",
    code: `using System.Collections.Concurrent;

var queue = new BlockingCollection<int>(boundedCapacity: 5);

// Producer
Task.Run(() =>
{
    for (int i = 0; i < 10; i++)
    {
        queue.Add(i);       // blocks if full (capacity 5)
        Console.WriteLine($"Produced {i}");
    }
    queue.CompleteAdding();
});

// Consumer
foreach (int item in queue.GetConsumingEnumerable())
    Console.WriteLine($"Consumed {item}");`,
    explanation: "BlockingCollection<T> wraps a ConcurrentQueue (or Stack/Bag) and provides blocking Add/Take semantics with an optional bounded capacity, making producer-consumer pipelines easy to write.",
  },
  {
    id: "cs-0519-int-overflow-silent",
    language: "csharp",
    title: "Integer overflow is silent by default",
    tag: "caveats",
    code: `int max = int.MaxValue;  // 2,147,483,647

// Default (unchecked): silently wraps to negative
int wrapped = max + 1;
Console.WriteLine(wrapped);  // -2147483648

// This can produce wrong results in financial code
int price  = int.MaxValue / 2;
int qty    = 3;
int total  = price * qty;    // overflows silently
Console.WriteLine(total < 0);  // True — clearly wrong`,
    explanation: "C# integer arithmetic wraps silently by default; use checked blocks or /checked compiler switch to detect overflow, or switch to long/ulong when values can exceed int range.",
  },
  {
    id: "cs-0519-float-equality",
    language: "csharp",
    title: "Never compare floats with == ",
    tag: "caveats",
    code: `double a = 0.1 + 0.2;
Console.WriteLine(a == 0.3);           // False
Console.WriteLine(a);                   // 0.30000000000000004

// Use an epsilon comparison
const double Eps = 1e-10;
Console.WriteLine(Math.Abs(a - 0.3) < Eps);   // True

// Or use decimal for exact decimal arithmetic
decimal x = 0.1m + 0.2m;
Console.WriteLine(x == 0.3m);  // True`,
    explanation: "Binary floating-point can't represent 0.1 or 0.2 exactly, so 0.1 + 0.2 != 0.3; always compare doubles with an epsilon tolerance, or use decimal for financial calculations.",
  },
  {
    id: "cs-0519-struct-copy-method",
    language: "csharp",
    title: "Struct is copied on method call",
    tag: "caveats",
    code: `struct Counter
{
    public int Value;
    public void Increment() => Value++;   // mutates the copy!
}

Counter c = new Counter();
c.Increment();                    // c.Value is still 0!
Console.WriteLine(c.Value);      // 0

// Fix: use ref extension method or return new value
static Counter Inc(Counter c) { c.Value++; return c; }
c = Inc(c);
Console.WriteLine(c.Value);      // 1`,
    explanation: "Calling a method on a struct passes a copy (unless using ref or in), so instance methods that mutate fields appear to have no effect on the original — a common beginner mistake.",
  },
  {
    id: "cs-0519-string-equality-culture",
    language: "csharp",
    title: "string.Equals with culture vs ordinal comparison",
    tag: "caveats",
    code: `string a = "resume";
string b = "RESUME";

// == uses ordinal (case-sensitive) comparison
Console.WriteLine(a == b);  // False

// CurrentCulture: language-aware (locale-dependent!)
Console.WriteLine(string.Equals(a, b, StringComparison.CurrentCultureIgnoreCase)); // True

// Ordinal: byte-by-byte — fast, predictable, culture-independent
Console.WriteLine(string.Equals(a, b, StringComparison.OrdinalIgnoreCase));        // True

// For dictionary keys and identifiers: always use Ordinal(IgnoreCase)
var dict = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);`,
    explanation: "Culture-sensitive comparisons can give surprising results (Turkish 'I' vs 'i', ligatures, etc.); use Ordinal or OrdinalIgnoreCase for identifiers, keys, and most programmatic comparisons.",
  },
  {
    id: "cs-0519-nullable-boxing",
    language: "csharp",
    title: "Nullable<T> boxing: null boxes to null object",
    tag: "caveats",
    code: `int? nullableInt = null;
object boxed = nullableInt;  // boxes to null, not a boxed Nullable<int>!
Console.WriteLine(boxed == null);    // True
Console.WriteLine(boxed is int);     // False — not a boxed int

int? withValue = 42;
object boxed2 = withValue;           // boxes as a plain int
Console.WriteLine(boxed2 is int);    // True
Console.WriteLine((int)boxed2);      // 42  — unbox as int, not int?`,
    explanation: "Boxing a null Nullable<T> produces a null reference; boxing a non-null Nullable<T> produces a boxed T (not a boxed Nullable<T>) — unbox with (T), not (T?).",
  },
  {
    id: "cs-0519-idisposable-no-using",
    language: "csharp",
    title: "Forgetting using can leak resources",
    tag: "caveats",
    code: `// Bad: stream may never be closed if exception occurs
System.IO.Stream stream = new System.IO.MemoryStream();
stream.WriteByte(0x42);
stream.Dispose();  // skipped on exception before this line!

// Good: using guarantees Dispose even on exception
using (var s2 = new System.IO.MemoryStream())
{
    s2.WriteByte(0x42);
}  // Dispose called here

// Also good (C# 8+)
using var s3 = new System.IO.MemoryStream();
s3.WriteByte(0x42);
// Dispose at end of scope`,
    explanation: "IDisposable.Dispose must be called even when exceptions occur; the using statement guarantees this via a compiler-generated try/finally, preventing file handles and connections from leaking.",
  },
  {
    id: "cs-0519-virtual-in-ctor",
    language: "csharp",
    title: "Calling virtual methods from constructors is dangerous",
    tag: "caveats",
    code: `class Base
{
    public Base() => Print();  // calls overridden version!

    public virtual void Print() =>
        Console.WriteLine("Base.Print");
}

class Derived : Base
{
    private readonly int _value = 42;

    public override void Print() =>
        Console.WriteLine(_value);  // _value may be 0 here!
}

_ = new Derived();
// Prints: 0  (not 42)
// Base ctor runs before Derived's field initializers complete`,
    explanation: "When a base constructor calls a virtual method, the derived override runs before the derived class's fields are initialized, so fields have their default values (0, null) — a subtle but common bug.",
  },
  {
    id: "cs-0519-readonly-struct",
    language: "csharp",
    title: "readonly struct — defensive copy pitfall",
    tag: "caveats",
    code: `struct MutablePoint { public int X; }

// Without readonly: compiler makes a defensive copy on 'in' params
void UseIn(in MutablePoint p)
{
    _ = p.X;  // compiler copies p to temp because it has mutable fields
}

// readonly struct: no defensive copy needed — all fields are read-only
readonly struct ImmutablePoint
{
    public int X { get; }
    public ImmutablePoint(int x) => X = x;
}

void UseInReadonly(in ImmutablePoint p)
{
    _ = p.X;  // no copy — compiler trusts the struct won't mutate
}`,
    explanation: "Passing a non-readonly struct as in causes a hidden defensive copy on each method call; marking the struct readonly tells the compiler no copy is needed, improving performance.",
  },
  {
    id: "cs-0519-linq-deferred",
    language: "csharp",
    title: "LINQ is deferred — query executes on iteration",
    tag: "caveats",
    code: `var source = new List<int> { 1, 2, 3 };

// Query is not executed here — just built
var query = source.Where(x => x > 1);

source.Add(4);  // mutate after query definition

// Executes NOW — sees 4 because of deferred execution
foreach (var x in query)
    Console.Write(x + " ");  // 2 3 4

// Force immediate execution with ToList/ToArray
var snapshot = source.Where(x => x > 1).ToList();
source.Add(5);
Console.WriteLine(snapshot.Count);  // 3 — snapshot not affected`,
    explanation: "LINQ queries over IEnumerable<T> are lazy: they build an execution plan and run it on each iteration, which means mutations to the source are reflected — use ToList() to get an immutable snapshot.",
  },
  {
    id: "cs-0519-task-result-deadlock",
    language: "csharp",
    title: "Task.Result deadlock in UI/ASP.NET contexts",
    tag: "caveats",
    code: `// This can deadlock in a synchronization-context environment
// (WinForms, WPF, old ASP.NET — NOT ASP.NET Core)
async Task<int> GetValueAsync() => await Task.FromResult(42);

// BAD: .Result blocks the thread that owns the sync context
// The continuation needs that same thread — deadlock!
// int x = GetValueAsync().Result;

// GOOD: await propagates the async throughout
// async Task Main() { int x = await GetValueAsync(); }

// If you must block: use .GetAwaiter().GetResult() and ConfigureAwait(false)
// int x = GetValueAsync().ConfigureAwait(false).GetAwaiter().GetResult();`,
    explanation: "Blocking on a Task via .Result or .Wait() in a SynchronizationContext environment can deadlock because the awaiter tries to resume on the blocked thread; await all the way up or use ConfigureAwait(false).",
  },
  {
    id: "cs-0519-int-vs-decimal",
    language: "csharp",
    title: "int vs long vs double vs decimal",
    tag: "types",
    code: `int    i = 2_147_483_647;       // 32-bit signed, max ~2.1 billion
long   l = 9_223_372_036_854_775_807L; // 64-bit signed
double d = 3.14159265358979;    // 64-bit IEEE 754 float
float  f = 3.14f;               // 32-bit IEEE 754 float
decimal m = 29.99m;             // 128-bit base-10, exact

// Decimal for money — no binary rounding error
decimal tax  = 0.1m;
decimal price = 29.99m;
Console.WriteLine(price * tax);  // 2.999  exact`,
    explanation: "Use int/long for whole numbers (long when >2 billion); double/float for scientific numbers where small rounding errors are acceptable; decimal for money where exact decimal representation is required.",
  },
  {
    id: "cs-0519-nullable-types",
    language: "csharp",
    title: "Nullable value types T? and Nullable<T>",
    tag: "types",
    code: `int? a = null;         // Nullable<int>
int? b = 42;

Console.WriteLine(a.HasValue);   // False
Console.WriteLine(b.HasValue);   // True
Console.WriteLine(b.Value);      // 42

// Null-coalescing operator
int c = a ?? -1;   // -1 (fallback when null)

// GetValueOrDefault
int d = a.GetValueOrDefault(0);  // 0

// Lifted operators: arithmetic with null propagates null
int? sum = a + b;
Console.WriteLine(sum.HasValue);  // False`,
    explanation: "T? (Nullable<T>) wraps a value type to add null representability; arithmetic on nullable types is 'lifted' — any null operand produces a null result.",
  },
  {
    id: "cs-0519-dynamic-type",
    language: "csharp",
    title: "dynamic defers type checking to runtime",
    tag: "types",
    code: `dynamic obj = "hello";
Console.WriteLine(obj.Length);   // 5 — works, string has Length

obj = 42;
Console.WriteLine(obj + 1);      // 43

// No compile-time error — fails at runtime instead
try
{
    Console.WriteLine(obj.Length);  // int has no Length!
}
catch (Microsoft.CSharp.RuntimeBinder.RuntimeBinderException e)
{
    Console.WriteLine(e.Message);
}`,
    explanation: "dynamic bypasses compile-time type checking — all member resolution happens at runtime via DLR; use it when interoperating with COM, reflection-heavy code, or dynamic languages, not as a general escape hatch.",
  },
  {
    id: "cs-0519-var-inference",
    language: "csharp",
    title: "var: type inference, not dynamic typing",
    tag: "types",
    code: `// var infers the type at compile time — still strongly typed
var count = 42;         // int
var name  = "Alice";    // string
var items = new List<int>();  // List<int>

// count = "hello";  // compile error — count is int

// Mandatory for anonymous types
var anon = new { X = 1, Y = 2 };
Console.WriteLine(anon.X);  // 1

// Use explicit types for clarity in method signatures
// var is best when the type is obvious from the right-hand side`,
    explanation: "var is compile-time type inference — the compiler resolves the type from the initializer and the variable is fully typed; it's not dynamic and provides the same IntelliSense and type safety.",
  },
  {
    id: "cs-0519-generics-constraints",
    language: "csharp",
    title: "Generic type constraints",
    tag: "types",
    code: `// where T : struct — value types only
static T AddOne<T>(T x) where T : struct, System.Numerics.INumber<T>
    => x + T.One;

// where T : class — reference types only (T can be null)
static string Describe<T>(T obj) where T : class
    => obj?.ToString() ?? "null";

// where T : new() — must have parameterless constructor
static T Create<T>() where T : new() => new T();

// Combine constraints
static void Process<T>(T item)
    where T : class, IComparable<T>, new()
{ }`,
    explanation: "Constraints allow a generic method to call members on T without casting; struct/class govern value vs reference, new() enables instantiation, interface constraints expose methods.",
  },
  {
    id: "cs-0519-covariant-interface",
    language: "csharp",
    title: "Covariant (out T) and contravariant (in T) generics",
    tag: "types",
    code: `// IEnumerable<out T> is covariant — T only comes OUT
IEnumerable<string> strings = new List<string> { "a" };
IEnumerable<object> objects = strings;  // OK: string IS-A object

// Action<in T> is contravariant — T only goes IN
Action<object> logObj = o => Console.WriteLine(o);
Action<string> logStr = logObj;  // OK: can accept string as object

// IList<T> is invariant — T goes both in and out
// IList<object> list = new List<string>();  // compile error`,
    explanation: "out T (covariant) allows upcasting the generic type; in T (contravariant) allows downcasting; invariant (no annotation) allows neither — only read-only interfaces can be covariant.",
  },
  {
    id: "cs-0519-nint",
    language: "csharp",
    title: "nint and nuint — native-sized integers (C# 9)",
    tag: "types",
    code: `// nint is int on 32-bit, long on 64-bit
nint ptr = 0x1234_5678;
Console.WriteLine(System.IntPtr.Size);  // 8 on 64-bit

nint a = 100;
nint b = 200;
Console.WriteLine(a + b);  // 300

// Useful for pointer arithmetic and interop
unsafe
{
    byte[] data = new byte[10];
    fixed (byte* p = data)
    {
        nint addr = (nint)p;
        Console.WriteLine(addr);
    }
}`,
    explanation: "nint/nuint are native-sized integer types that map to IntPtr/UIntPtr but support arithmetic operators; they're the idiomatic C# type for pointer arithmetic and platform-independent interop.",
  },
  {
    id: "cs-0519-record-struct",
    language: "csharp",
    title: "record struct vs record class (C# 10)",
    tag: "types",
    code: `// record class: reference type, value equality, immutable by default
record class PersonRef(string Name, int Age);

// record struct: value type, value equality, mutable by default
record struct PointVal(double X, double Y);

var p1 = new PointVal(1.0, 2.0);
var p2 = p1;       // copy (value type)
p2 = p2 with { X = 9.0 };  // non-destructive mutation

Console.WriteLine(p1.X);  // 1.0 — original unchanged
Console.WriteLine(p1 == new PointVal(1.0, 2.0));  // True`,
    explanation: "record struct is a value type with auto-generated value equality and with-expressions; unlike record class it lives on the stack and is copied by value, combining struct performance with record convenience.",
  },
  {
    id: "cs-0519-ienumerable-vs-ilist",
    language: "csharp",
    title: "IEnumerable vs IList vs ICollection vs IReadOnlyList",
    tag: "families",
    code: `// IEnumerable<T>: forward-only iteration, lazy possible
IEnumerable<int> seq = System.Linq.Enumerable.Range(1, 100);

// IReadOnlyList<T>: adds Count + indexed get (no mutation)
IReadOnlyList<int> roList = new[] { 1, 2, 3 };
Console.WriteLine(roList[0]);   // 1, but no Add()

// ICollection<T>: adds Count, Add, Remove, Clear
// IList<T>: adds indexed set + Insert + RemoveAt
IList<int> list = new List<int> { 1, 2, 3 };
list[0] = 99;   // OK`,
    explanation: "Use the narrowest interface that satisfies your need: IEnumerable for iteration-only, IReadOnlyList when callers need indexing but not mutation, IList when they need full mutation.",
  },
  {
    id: "cs-0519-list-vs-span-array",
    language: "csharp",
    title: "List<T> vs T[] vs Span<T> vs ImmutableArray<T>",
    tag: "families",
    code: `using System.Collections.Immutable;

// T[]: fixed-size, fastest random access, stackalloc-able
int[] arr = { 1, 2, 3 };

// List<T>: resizable, O(1) amortised Add, wraps an array
var list = new List<int>(arr);

// Span<T>: stack-only slice, zero-copy, no heap allocation
Span<int> span = arr.AsSpan(0, 2);

// ImmutableArray<T>: read-only, thread-safe, wraps a T[]
ImmutableArray<int> imm = ImmutableArray.Create(1, 2, 3);`,
    explanation: "T[] is fastest and lowest overhead; List<T> adds dynamic sizing; Span<T> enables zero-copy windowing within synchronous code; ImmutableArray<T> provides safe sharing across threads.",
  },
  {
    id: "cs-0519-action-func-predicate",
    language: "csharp",
    title: "Action vs Func vs Predicate",
    tag: "families",
    code: `// Action<T>: void return, up to 16 type parameters
Action<string> log = Console.WriteLine;
log("hello");

// Func<T...,TResult>: non-void return, last type is result
Func<int, int, int> add = (a, b) => a + b;
Console.WriteLine(add(2, 3));   // 5

// Predicate<T>: Func<T, bool> — kept for backwards compat
Predicate<int> isEven = n => n % 2 == 0;
Console.WriteLine(isEven(4));   // True

// All three are delegate types — interchangeable via explicit cast
Func<int, bool> isEven2 = isEven.Invoke;`,
    explanation: "Action is for void callbacks, Func for value-returning delegates, Predicate<T> is shorthand for Func<T,bool> from pre-LINQ days; prefer Func<T,bool> in new code for consistency.",
  },
  {
    id: "cs-0519-task-vs-valuetask",
    language: "csharp",
    title: "Task<T> vs ValueTask<T> — allocation vs reuse",
    tag: "families",
    code: `using System.Threading.Tasks;

// Task<T>: always allocates a heap object
async Task<int> GetFromNetworkAsync() => await Task.FromResult(42);

// ValueTask<T>: avoids allocation when result is already available
async ValueTask<int> GetCachedAsync(bool cached)
{
    if (cached) return 42;       // no allocation for synchronous path
    return await Task.FromResult(42);
}

// Rule of thumb: use ValueTask only when benchmarks show Task allocation is a bottleneck
// ValueTask must not be awaited more than once`,
    explanation: "Task<T> always allocates; ValueTask<T> can return a result without allocation when the operation completes synchronously — use it in hot paths like caches where most calls don't hit the network.",
  },
  {
    id: "cs-0519-string-vs-sb",
    language: "csharp",
    title: "string vs StringBuilder vs ReadOnlySpan<char>",
    tag: "families",
    code: `// string: immutable, heap-allocated, optimal for small fixed values
string s = "hello " + "world";  // creates a new string

// StringBuilder: mutable buffer, efficient for many concatenations
var sb = new System.Text.StringBuilder();
for (int i = 0; i < 1000; i++)
    sb.Append(i).Append(',');
string result = sb.ToString();

// ReadOnlySpan<char>: zero-copy substring over existing string
ReadOnlySpan<char> span = "hello world".AsSpan(6, 5);
Console.WriteLine(span.ToString());  // "world"`,
    explanation: "Use string for fixed values and few concatenations; StringBuilder for loops that build up a long string; ReadOnlySpan<char> to process a substring without allocating a new string.",
  },
  {
    id: "cs-0519-lazy-vs-func",
    language: "csharp",
    title: "Lazy<T> vs Func<T> for deferred initialization",
    tag: "families",
    code: `// Func<T>: called every time it's invoked
Func<int> expensiveFunc = () => { Thread.Sleep(100); return 42; };
Console.WriteLine(expensiveFunc());   // always recomputes
Console.WriteLine(expensiveFunc());   // called again!

// Lazy<T>: computes on first access, caches the result, thread-safe
var lazy = new Lazy<int>(() => { Thread.Sleep(100); return 42; });
Console.WriteLine(lazy.IsValueCreated);  // False
Console.WriteLine(lazy.Value);           // computed once
Console.WriteLine(lazy.Value);           // cached — instant`,
    explanation: "Func<T> re-executes on every call; Lazy<T> runs the factory only on first access and caches the result, defaulting to thread-safe initialization mode.",
  },
  {
    id: "cs-0519-interface-vs-abstract",
    language: "csharp",
    title: "Interface vs abstract class",
    tag: "families",
    code: `// Abstract class: can have state, constructors, non-abstract methods
abstract class Animal
{
    protected string Name { get; }
    protected Animal(string name) => Name = name;

    public abstract string Sound();
    public string Describe() => $"{Name} goes {Sound()}";
}

// Interface: no state, no constructors (before C# 8)
// Can have default methods since C# 8
interface IFlyable
{
    double MaxAltitude { get; }
    string Fly() => $"Flying at {MaxAltitude}m";  // default impl
}

// A class can implement many interfaces but inherit one class`,
    explanation: "Use an abstract class when sharing state or constructor logic; use interfaces when defining a contract that unrelated types should fulfil — C# 8+ allows default implementations in interfaces.",
  },
  {
    id: "cs-0519-hashset-vs-sortedset",
    language: "csharp",
    title: "HashSet vs SortedSet vs ImmutableHashSet",
    tag: "families",
    code: `using System.Collections.Immutable;

// HashSet<T>: hash table, O(1) ops, unordered
var hs = new HashSet<int> { 3, 1, 4, 1, 5 };
Console.WriteLine(hs.Count);  // 4 (deduped)

// SortedSet<T>: red-black tree, O(log n) ops, always sorted
var ss = new SortedSet<int> { 3, 1, 4, 1, 5 };
Console.WriteLine(string.Join(",", ss));  // 1,3,4,5

// ImmutableHashSet<T>: thread-safe, operations return new sets
var ihs = ImmutableHashSet.Create(1, 2, 3);
var ihs2 = ihs.Add(4);   // ihs unchanged`,
    explanation: "HashSet wins on lookup speed (O(1)); SortedSet keeps elements ordered (O(log n)); ImmutableHashSet is safe to share across threads but returns new sets on every mutation.",
  },
  {
    id: "cs-0519-timespan-datetime",
    language: "csharp",
    title: "TimeSpan vs DateTime vs DateTimeOffset",
    tag: "families",
    code: `// TimeSpan: a duration (no notion of timezone)
TimeSpan ts = TimeSpan.FromHours(1.5);
Console.WriteLine(ts.TotalMinutes);  // 90

// DateTime: a moment in time, can be Local or Utc (or Unspecified)
DateTime local = DateTime.Now;
DateTime utc   = DateTime.UtcNow;

// DateTimeOffset: moment + UTC offset — no ambiguity
DateTimeOffset dto = DateTimeOffset.Now;
Console.WriteLine(dto.Offset);  // e.g. +02:00

// Prefer DateTimeOffset for storage/exchange to avoid DST bugs`,
    explanation: "TimeSpan represents a duration; DateTime is a point in time but can be ambiguous about timezone; DateTimeOffset stores the UTC offset explicitly, making it unambiguous across time zones.",
  },
  {
    id: "cs-0519-cancellation-token",
    language: "csharp",
    title: "CancellationToken — cooperative cancellation",
    tag: "families",
    code: `using var cts = new CancellationTokenSource();
CancellationToken token = cts.Token;

async Task WorkAsync(CancellationToken ct)
{
    for (int i = 0; i < 100; i++)
    {
        ct.ThrowIfCancellationRequested();
        await Task.Delay(50, ct);  // also throws on cancel
        Console.Write(i + " ");
    }
}

// Cancel after 200ms
cts.CancelAfter(200);

try { await WorkAsync(token); }
catch (OperationCanceledException) { Console.WriteLine("cancelled"); }`,
    explanation: "CancellationToken enables cooperative cancellation: the producer cancels via CancellationTokenSource and each async operation checks the token, making cancellation predictable and clean.",
  },
  {
    id: "cs-0519-abstract-class",
    language: "csharp",
    title: "Abstract class with abstract and concrete members",
    tag: "classes",
    code: `abstract class Logger
{
    // Must be implemented by subclass
    protected abstract void WriteMessage(string message);

    // Concrete template method — calls abstract methods
    public void Log(string level, string msg)
    {
        WriteMessage($"[{level}] {DateTime.UtcNow:u} {msg}");
    }
}

class ConsoleLogger : Logger
{
    protected override void WriteMessage(string message)
        => Console.WriteLine(message);
}

new ConsoleLogger().Log("INFO", "started");`,
    explanation: "Abstract classes use the Template Method pattern: concrete methods define the algorithm structure and call abstract steps that subclasses fill in, without exposing the steps publicly.",
  },
  {
    id: "cs-0519-sealed-class",
    language: "csharp",
    title: "sealed class and sealed override",
    tag: "classes",
    code: `class Base
{
    public virtual void Greet() => Console.WriteLine("Base");
}

class Middle : Base
{
    // sealed prevents further overriding in Derived
    public sealed override void Greet() => Console.WriteLine("Middle");
}

class Derived : Middle
{
    // public override void Greet() { }  // compile error
}

// sealed class: no subclassing at all
sealed class Singleton
{
    public static readonly Singleton Instance = new();
    private Singleton() { }
}`,
    explanation: "sealed on a class prevents any subclassing; sealed on an override stops further overriding in subclasses — both let the JIT inline virtual calls since the target is statically known.",
  },
  {
    id: "cs-0519-partial-class",
    language: "csharp",
    title: "partial class — split across files",
    tag: "classes",
    code: `// File: Order.cs
partial class Order
{
    public int Id { get; set; }
    public decimal Total { get; set; }
}

// File: Order.Validation.cs
partial class Order
{
    public bool IsValid() => Total > 0 && Id > 0;
}

// File: Order.Persistence.cs
partial class Order
{
    public void Save() => Console.WriteLine($"Saving order {Id}");
}

// All three become one class at compile time
var o = new Order { Id = 1, Total = 99.99m };
Console.WriteLine(o.IsValid());  // True`,
    explanation: "partial lets you split a class across multiple files; it's used heavily by code generators (EF Core, WinForms, Source Generators) to keep generated code separate from hand-written code.",
  },
  {
    id: "cs-0519-record-primary-ctor",
    language: "csharp",
    title: "Record primary constructor and with-expression",
    tag: "classes",
    code: `// Positional record — primary constructor auto-generates properties
record Person(string Name, int Age);

var alice = new Person("Alice", 30);
Console.WriteLine(alice.Name);   // Alice

// Non-destructive mutation — returns a new record
var olderAlice = alice with { Age = 31 };
Console.WriteLine(alice.Age);      // 30 (unchanged)
Console.WriteLine(olderAlice.Age); // 31

// Value equality is structural
var alice2 = new Person("Alice", 30);
Console.WriteLine(alice == alice2);  // True`,
    explanation: "Records auto-generate a constructor, init-only properties, value equality, ToString, and a with-expression 'copy constructor' — ideal for immutable data models and DTOs.",
  },
  {
    id: "cs-0519-interface-default-method",
    language: "csharp",
    title: "Interface default implementations (C# 8)",
    tag: "classes",
    code: `interface IShape
{
    double Area();

    // Default implementation — optional for implementors
    string Describe() => $"Shape with area {Area():F2}";

    // Can also have static members
    static IShape CreateUnit() => throw new NotImplementedException();
}

class Circle : IShape
{
    public double Radius { get; }
    public Circle(double r) => Radius = r;
    public double Area() => Math.PI * Radius * Radius;
    // Describe() inherited from interface
}

IShape c = new Circle(5);
Console.WriteLine(c.Describe());  // Shape with area 78.54`,
    explanation: "Interface default implementations let you add new methods to an interface without breaking all existing implementors; callers must hold a reference typed to the interface to access the default.",
  },
  {
    id: "cs-0519-static-extension",
    language: "csharp",
    title: "Static classes and extension methods",
    tag: "classes",
    code: `// Static class: can't be instantiated or subclassed
public static class StringExtensions
{
    // Extension method: 'this' makes it callable on string
    public static string Truncate(this string s, int maxLen)
    {
        if (s.Length <= maxLen) return s;
        return s[..(maxLen - 3)] + "...";
    }

    public static bool IsNullOrEmpty(this string? s)
        => string.IsNullOrEmpty(s);
}

string title = "Hello, this is a long title";
Console.WriteLine(title.Truncate(15));  // "Hello, this ..."`,
    explanation: "Extension methods in a static class add methods to existing types without subclassing; the this parameter designates the type being extended, and callers use dot notation as if the method were built in.",
  },
  {
    id: "cs-0519-generic-class",
    language: "csharp",
    title: "Generic class with multiple type constraints",
    tag: "classes",
    code: `class Repository<T> where T : class, IIdentifiable, new()
{
    private readonly Dictionary<int, T> _store = new();

    public void Add(T item) => _store[item.Id] = item;
    public T? Get(int id) => _store.GetValueOrDefault(id);
}

interface IIdentifiable { int Id { get; } }

class User : IIdentifiable
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
}

var repo = new Repository<User>();
repo.Add(new User { Id = 1, Name = "Alice" });
Console.WriteLine(repo.Get(1)?.Name);  // Alice`,
    explanation: "Generic classes with constraints let you use interface members and new() inside the class body while the compiler verifies the constraint is satisfied at each instantiation site.",
  },
  {
    id: "cs-0519-explicit-interface-impl",
    language: "csharp",
    title: "Explicit interface implementation",
    tag: "classes",
    code: `interface ICount { int Count { get; } }

class Collection : ICount
{
    private readonly List<int> _items = new();

    // Implicit: accessible as collection.Count
    public void Add(int x) => _items.Add(x);

    // Explicit: only accessible via ICount reference
    int ICount.Count => _items.Count;
}

var c = new Collection();
c.Add(1); c.Add(2);
// Console.WriteLine(c.Count);           // compile error
Console.WriteLine(((ICount)c).Count);    // 2`,
    explanation: "Explicit interface implementation hides the member from the class's public surface; it's used to resolve name conflicts between interfaces or to restrict members to callers holding the interface.",
  },
  {
    id: "cs-0519-indexer",
    language: "csharp",
    title: "Indexer — subscript access for custom types",
    tag: "classes",
    code: `class TimeTable
{
    private readonly Dictionary<(int h, int m), string> _slots = new();

    public string this[int hour, int minute]
    {
        get => _slots.GetValueOrDefault((hour, minute), "free");
        set => _slots[(hour, minute)] = value;
    }
}

var tt = new TimeTable();
tt[9, 0]  = "Stand-up";
tt[14, 30] = "Code review";

Console.WriteLine(tt[9, 0]);    // Stand-up
Console.WriteLine(tt[10, 0]);   // free`,
    explanation: "An indexer uses the this keyword with a parameter list to make instances subscriptable with obj[...] syntax; the parameter can be any type and you can have multiple overloads.",
  },
  {
    id: "cs-0519-operator-overloading",
    language: "csharp",
    title: "Operator overloading",
    tag: "classes",
    code: `struct Money
{
    public decimal Amount { get; }
    public string Currency { get; }

    public Money(decimal amount, string currency)
        => (Amount, Currency) = (amount, currency);

    public static Money operator +(Money a, Money b)
    {
        if (a.Currency != b.Currency)
            throw new InvalidOperationException("Currency mismatch");
        return new Money(a.Amount + b.Amount, a.Currency);
    }

    public override string ToString() => $"{Amount} {Currency}";
}

var total = new Money(10m, "USD") + new Money(5m, "USD");
Console.WriteLine(total);  // 15 USD`,
    explanation: "Operator overloading lets your types participate in natural arithmetic syntax; keep it intuitive and only overload operators that have an obvious semantic meaning for the type.",
  },
  {
    id: "cs-0519-idisposable-pattern",
    language: "csharp",
    title: "IDisposable + finalizer pattern",
    tag: "classes",
    code: `class SafeHandle : IDisposable
{
    private bool _disposed;
    private IntPtr _handle;

    public SafeHandle(IntPtr handle) => _handle = handle;

    protected virtual void Dispose(bool disposing)
    {
        if (_disposed) return;
        if (disposing) { /* free managed resources */ }
        // always free unmanaged resources
        _handle = IntPtr.Zero;
        _disposed = true;
    }

    public void Dispose()
    {
        Dispose(disposing: true);
        GC.SuppressFinalize(this);  // no need for finalizer cleanup
    }

    ~SafeHandle() => Dispose(disposing: false);
}`,
    explanation: "The Dispose pattern separates managed (IDisposable.Dispose) from unmanaged (finalizer) cleanup; GC.SuppressFinalize avoids redundant finalization when the user already called Dispose.",
  },
  {
    id: "cs-0519-iequatable",
    language: "csharp",
    title: "IEquatable<T> for strongly-typed equality",
    tag: "classes",
    code: `struct Point : IEquatable<Point>
{
    public int X, Y;

    // Strongly-typed Equals — no boxing for value types
    public bool Equals(Point other) => X == other.X && Y == other.Y;

    // Override object.Equals to delegate to the typed version
    public override bool Equals(object? obj)
        => obj is Point p && Equals(p);

    public override int GetHashCode() => HashCode.Combine(X, Y);

    // Bonus: enable == and !=
    public static bool operator ==(Point a, Point b) => a.Equals(b);
    public static bool operator !=(Point a, Point b) => !a.Equals(b);
}`,
    explanation: "Implementing IEquatable<T> provides a non-boxing equality check for value types; collections like HashSet and Dictionary use it to avoid boxing every element during comparisons.",
  },
  {
    id: "cs-0519-icomparable",
    language: "csharp",
    title: "IComparable<T> for natural ordering",
    tag: "classes",
    code: `class Version : IComparable<Version>
{
    public int Major, Minor, Patch;

    public Version(int major, int minor, int patch)
        => (Major, Minor, Patch) = (major, minor, patch);

    public int CompareTo(Version? other)
    {
        if (other is null) return 1;
        int c = Major.CompareTo(other.Major);
        if (c != 0) return c;
        c = Minor.CompareTo(other.Minor);
        return c != 0 ? c : Patch.CompareTo(other.Patch);
    }
}

var versions = new[] { new Version(2,0,0), new Version(1,9,0) };
Array.Sort(versions);
Console.WriteLine(versions[0].Major);  // 1`,
    explanation: "IComparable<T>.CompareTo returns negative, zero, or positive; implementing it lets your type participate in Array.Sort, LINQ OrderBy, SortedSet, and any sort-based algorithm.",
  },
];
