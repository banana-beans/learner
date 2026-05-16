import type { Snippet } from "./types";

export const csharpSnippets20260516B1: Snippet[] = [
  {
    id: "cs-b16-b1-linq-where-select",
    language: "csharp",
    title: "LINQ Where + Select chain",
    tag: "snippet",
    code: `var products = new[]
{
    new { Name = "Apple",  Price = 1.50, InStock = true },
    new { Name = "Banana", Price = 0.75, InStock = false },
    new { Name = "Cherry", Price = 3.00, InStock = true },
    new { Name = "Date",   Price = 5.00, InStock = true },
};

var affordable = products
    .Where(p => p.InStock && p.Price < 4.00)
    .Select(p => \`\${p.Name}: \${p.Price:C}\`)
    .ToList();

foreach (var item in affordable)
    Console.WriteLine(item);
// Apple: $1.50
// Cherry: $3.00`,
    explanation: "LINQ's `Where` filters elements and `Select` projects them — chaining the two is the C# equivalent of Python's `[f(x) for x in seq if pred(x)]`, and the lazy evaluation means no intermediate lists are created.",
  },
  {
    id: "cs-b16-b1-value-vs-ref-equality",
    language: "csharp",
    title: "Value type vs reference type equality",
    tag: "understanding",
    code: `// Value types: == compares content
int a = 42, b = 42;
Console.WriteLine(a == b);          // True — same value
Console.WriteLine(object.ReferenceEquals(a, b)); // False after boxing

// Reference types: == compares reference by default
var s1 = new StringBuilder("hi");
var s2 = new StringBuilder("hi");
Console.WriteLine(s1 == s2);        // False — different objects
Console.WriteLine(s1.Equals(s2));   // False — StringBuilder doesn't override Equals

// string overrides == to compare content
string x = "hello", y = "hello";
Console.WriteLine(x == y);          // True — value comparison
Console.WriteLine(object.ReferenceEquals(x, y)); // True (interned)`,
    explanation: "`==` on value types compares content; on reference types it compares references by default unless the class overrides the `==` operator. `string` is a reference type that overrides `==` to compare content, which can mislead beginners.",
  },
  {
    id: "cs-b16-b1-null-coalescing",
    language: "csharp",
    title: "?? and ??= null-coalescing operators",
    tag: "snippet",
    code: `string? name = null;

// ?? returns left if non-null, else right
string display = name ?? "Anonymous";
Console.WriteLine(display);   // Anonymous

// ??= assigns only if left is null (C# 8+)
name ??= "Default";
Console.WriteLine(name);      // Default

name ??= "Other";             // no-op — name is already non-null
Console.WriteLine(name);      // Default

// Chaining
string? a = null, b = null, c = "found";
Console.WriteLine(a ?? b ?? c ?? "nothing");  // found`,
    explanation: "`??` is the null-coalescing operator — it returns the left operand if it's non-null, otherwise the right. `??=` is the null-coalescing assignment, a concise lazy-initialization pattern that avoids a full `if (x == null) x = value;` block.",
  },
  {
    id: "cs-b16-b1-list-vs-array-resizing",
    language: "csharp",
    title: "List<T> vs T[]: resizing behavior",
    tag: "structures",
    code: `// Array: fixed size at creation
int[] arr = new int[5];
// arr[5] = 99;  // IndexOutOfRangeException — can't grow

// List<T>: backed by array, doubles capacity when full
var list = new List<int>(capacity: 4);
Console.WriteLine(list.Capacity);  // 4

for (int i = 0; i < 6; i++)
{
    list.Add(i);
    Console.WriteLine(\`Count=\${list.Count} Capacity=\${list.Capacity}\`);
}
// At 5 items: Capacity jumps to 8 (doubled)

// Pre-allocate if you know the count — avoids reallocations
var sized = new List<int>(1000);
Console.WriteLine(sized.Capacity);  // 1000`,
    explanation: "`List<T>` doubles its internal array capacity when it runs out of space — each resize copies all elements, so pre-allocating with the expected count avoids O(n log n) total copy work during bulk inserts.",
  },
  {
    id: "cs-b16-b1-async-void",
    language: "csharp",
    title: "async void: unhandled exceptions crash the process",
    tag: "caveats",
    code: `// async void — exception cannot be awaited or caught by caller
async void DangerousAsync()
{
    await Task.Delay(1);
    throw new InvalidOperationException("Unobserved!");
    // This exception propagates to SynchronizationContext
    // and typically crashes the process
}

// async Task — caller can await and catch
async Task SafeAsync()
{
    await Task.Delay(1);
    throw new InvalidOperationException("Caught!");
}

// Usage
try
{
    await SafeAsync();   // exception catchable
}
catch (InvalidOperationException ex)
{
    Console.WriteLine(ex.Message);   // Caught!
}
// DangerousAsync() has no await — fire-and-forget unobserved exception`,
    explanation: "`async void` is only appropriate for event handlers because exceptions thrown inside it can't be caught by the caller — they propagate to the `SynchronizationContext` and often crash the process. Always use `async Task` for any awaitable method.",
  },
  {
    id: "cs-b16-b1-switch-expression",
    language: "csharp",
    title: "Switch expression with patterns",
    tag: "snippet",
    code: `object value = 42;

string description = value switch
{
    int n when n < 0  => "negative integer",
    int n when n == 0 => "zero",
    int n             => \`positive integer \${n}\`,
    string s          => \`string of length \${s.Length}\`,
    null              => "null",
    _                 => "something else",
};

Console.WriteLine(description);  // positive integer 42

// Property patterns (C# 8+)
var point = (X: 3, Y: 0);
string quadrant = point switch
{
    (0, 0)          => "origin",
    (> 0, > 0)      => "Q1",
    (< 0, > 0)      => "Q2",
    (< 0, < 0)      => "Q3",
    _               => "on an axis",
};
Console.WriteLine(quadrant);  // on an axis`,
    explanation: "Switch expressions (C# 8+) are expressions that return a value — combined with type, property, and positional patterns they replace lengthy `if/else if` chains with concise, exhaustiveness-checked code.",
  },
  {
    id: "cs-b16-b1-boxing-unboxing",
    language: "csharp",
    title: "Boxing and unboxing cost",
    tag: "understanding",
    code: `// Boxing: value type -> object (heap allocation)
int x = 42;
object boxed = x;   // allocates a new heap object
Console.WriteLine(boxed.GetType());  // System.Int32

// Unboxing: object -> value type (type-checked cast)
int y = (int)boxed;
Console.WriteLine(y);  // 42

// Hidden boxing in non-generic collections
var list = new System.Collections.ArrayList();
list.Add(1);   // boxes each int
list.Add(2);

// Avoid with generics — no boxing
var typedList = new System.Collections.Generic.List<int>();
typedList.Add(1);  // stored directly — no allocation

// Another hidden boxing source: interface call on struct
interface IHello { void Hello(); }
struct Point : IHello { public void Hello() => Console.WriteLine("hi"); }
IHello h = new Point();   // boxes the struct!`,
    explanation: "Boxing wraps a value type in a heap-allocated object reference — it's implicit but expensive, causing GC pressure in tight loops. Generic collections like `List<T>` eliminate boxing by specializing for each value type.",
  },
  {
    id: "cs-b16-b1-range-index",
    language: "csharp",
    title: "Range and Index operators (^, ..)",
    tag: "snippet",
    code: `int[] nums = [10, 20, 30, 40, 50, 60, 70, 80];

// ^ counts from end (^1 = last element)
Console.WriteLine(nums[^1]);        // 80
Console.WriteLine(nums[^2]);        // 70

// Range: [start..end) — end is exclusive
var middle = nums[2..5];
Console.WriteLine(string.Join(", ", middle));   // 30, 40, 50

// From end with range
var lastThree = nums[^3..];
Console.WriteLine(string.Join(", ", lastThree)); // 60, 70, 80

var withoutFirstLast = nums[1..^1];
Console.WriteLine(string.Join(", ", withoutFirstLast)); // 20, 30, 40, 50, 60, 70`,
    explanation: "`^n` is a shorthand for `length - n` and `..` creates a `Range` — together they make slice operations readable without computing offsets manually. Both work on arrays, strings, spans, and any type implementing `Index`/`Range` indexers.",
  },
  {
    id: "cs-b16-b1-hashset-sortedset",
    language: "csharp",
    title: "HashSet<T> vs SortedSet<T> complexity",
    tag: "structures",
    code: `var hashSet   = new HashSet<int>();
var sortedSet = new SortedSet<int>();

int[] data = [5, 2, 8, 1, 9, 3, 7, 4, 6];
foreach (int n in data)
{
    hashSet.Add(n);
    sortedSet.Add(n);
}

// HashSet: O(1) average lookup, unordered output
Console.WriteLine(string.Join(", ", hashSet));   // arbitrary order

// SortedSet: O(log n) lookup, always sorted (red-black tree)
Console.WriteLine(string.Join(", ", sortedSet)); // 1, 2, 3, 4, 5, 6, 7, 8, 9

// SortedSet has range operations
var range = sortedSet.GetViewBetween(3, 7);
Console.WriteLine(string.Join(", ", range));     // 3, 4, 5, 6, 7`,
    explanation: "`HashSet<T>` uses a hash table (O(1) average operations) while `SortedSet<T>` uses a red-black tree (O(log n) but maintains order) — choose `HashSet` for raw speed and `SortedSet` when you need ordered iteration or range queries.",
  },
  {
    id: "cs-b16-b1-string-immutability",
    language: "csharp",
    title: "String immutability: every operation makes a new object",
    tag: "understanding",
    code: `string s = "hello";
string t = s;

// Concatenation creates a new string object
s = s + " world";
Console.WriteLine(s);  // hello world
Console.WriteLine(t);  // hello — t still points to original

// "Modifying" a string replaces the reference
s = s.ToUpper();
Console.WriteLine(s);  // HELLO WORLD

// String interning: identical literals share one object
string a = "cat";
string b = "cat";
Console.WriteLine(object.ReferenceEquals(a, b));  // True (interned)

string c = string.Intern("cat");   // explicitly intern a dynamic string
Console.WriteLine(object.ReferenceEquals(a, c));  // True`,
    explanation: "Every `string` operation in C# produces a new `string` object — strings are immutable reference types. String interning reuses one heap object for identical content, which is automatic for compile-time literals but must be explicit for dynamic strings.",
  },
  {
    id: "cs-b16-b1-tuple-deconstruction",
    language: "csharp",
    title: "Tuple deconstruction",
    tag: "snippet",
    code: `// Method returning multiple values via tuple
static (string Name, int Age, double Score) GetRecord()
    => ("Alice", 30, 95.5);

var (name, age, score) = GetRecord();   // deconstruction
Console.WriteLine(\`\${name}, age \${age}, score \${score}\`);

// Discard unwanted elements with _
var (firstName, _, _) = GetRecord();
Console.WriteLine(firstName);   // Alice

// Swap without temp variable
int a = 1, b = 2;
(a, b) = (b, a);
Console.WriteLine(\`a=\${a} b=\${b}\`);   // a=2 b=1

// Dictionary iteration with deconstruction
var dict = new Dictionary<string, int> { ["x"] = 10, ["y"] = 20 };
foreach (var (key, val) in dict)
    Console.WriteLine(\`\${key}=\${val}\`);`,
    explanation: "C# tuple deconstruction lets you unpack a tuple (or any type with a `Deconstruct` method) directly into named variables — the `_` discard pattern cleanly ignores components you don't need.",
  },
  {
    id: "cs-b16-b1-struct-copy-semantics",
    language: "csharp",
    title: "Struct copy semantics — modifications don't propagate",
    tag: "caveats",
    code: `struct Point
{
    public int X, Y;
    public void Shift(int dx, int dy) { X += dx; Y += dy; }
}

Point p1 = new Point { X = 1, Y = 2 };
Point p2 = p1;   // full COPY — p2 is independent

p2.X = 99;
Console.WriteLine(p1.X);   // 1 — p1 unchanged

// Common trap: modifying a struct in a collection
var points = new List<Point> { new Point { X = 1, Y = 2 } };
// points[0].X = 99;   // compile error — can't modify indexer return (copy)

// Must replace the whole element
Point tmp = points[0];
tmp.X = 99;
points[0] = tmp;
Console.WriteLine(points[0].X);   // 99`,
    explanation: "Struct assignment copies all fields — the copy is entirely independent of the original. This bites developers who expect reference-type mutation semantics, especially when retrieving structs from collections where indexers return copies.",
  },
  {
    id: "cs-b16-b1-nullable-value-type",
    language: "csharp",
    title: "Nullable<T> / T? syntax and boxing behavior",
    tag: "types",
    code: `// Nullable<T> and T? are identical
Nullable<int> a = null;
int? b = null;
int? c = 42;

Console.WriteLine(a.HasValue);     // False
Console.WriteLine(c.HasValue);     // True
Console.WriteLine(c.Value);        // 42
Console.WriteLine(c.GetValueOrDefault(-1));   // 42
Console.WriteLine(b.GetValueOrDefault(-1));   // -1

// Boxing nullable: null -> null object, value -> boxed T (not boxed Nullable<T>!)
object boxed = c;
Console.WriteLine(boxed is int);     // True — boxed as int, not int?
Console.WriteLine(boxed is int?);    // True — int? matches int

object nulled = b;
Console.WriteLine(nulled is null);   // True — boxed null`,
    explanation: "A `null` `Nullable<T>` boxes to a null object reference, while a non-null `Nullable<T>` boxes to the underlying `T` — not `Nullable<T>`. This asymmetry trips up reflection and pattern-matching code that expects `int?`.",
  },
  {
    id: "cs-b16-b1-record-with-expression",
    language: "csharp",
    title: "Record immutability and with-expression",
    tag: "classes",
    code: `record Person(string Name, int Age, string Email);

var alice = new Person("Alice", 30, "alice@example.com");

// with: creates a copy with specified properties changed
var olderAlice = alice with { Age = 31 };
Console.WriteLine(alice);        // Person { Name = Alice, Age = 30, Email = alice@example.com }
Console.WriteLine(olderAlice);   // Person { Name = Alice, Age = 31, Email = alice@example.com }

// Records provide == based on all properties
var alice2 = new Person("Alice", 30, "alice@example.com");
Console.WriteLine(alice == alice2);   // True — value equality!
Console.WriteLine(ReferenceEquals(alice, alice2));  // False — different objects

// Deconstruction is auto-generated
var (name, age, email) = alice;
Console.WriteLine(name);   // Alice`,
    explanation: "`record` types have compiler-generated value equality, `ToString`, and `Deconstruct` — the `with` expression creates a modified copy without mutating the original, enabling immutable update patterns similar to functional programming.",
  },
  {
    id: "cs-b16-b1-ienumerable-covariance",
    language: "csharp",
    title: "IEnumerable<T> covariance with out",
    tag: "types",
    code: `// IEnumerable<T> is covariant (out T) — allows widening
IEnumerable<string> strings = new List<string> { "hello", "world" };

// Can assign to IEnumerable<object> — safe because we only READ
IEnumerable<object> objects = strings;  // covariance — no cast needed!
foreach (var o in objects)
    Console.WriteLine(o.GetType().Name);   // String

// IList<T> is NOT covariant — it allows writes
// IList<object> objList = new List<string>(); // compile error!
// objList.Add(42);   // would add int to a List<string> — unsafe!

// Contravariance: Action<object> -> Action<string>
Action<object> printObj = x => Console.WriteLine(x);
Action<string> printStr = printObj;  // safe: string is-an object`,
    explanation: "Covariance (`out T`) allows a more-derived generic to be used where a less-derived one is expected — safe for read-only interfaces like `IEnumerable<T>`. Contravariance (`in T`) works the opposite way for write-only scenarios.",
  },
  {
    id: "cs-b16-b1-stringbuilder-chaining",
    language: "csharp",
    title: "StringBuilder for efficient string building",
    tag: "snippet",
    code: `using System.Text;

// O(n²) — creates a new string on each += in a loop
string bad = "";
for (int i = 0; i < 5; i++)
    bad += i + ", ";   // 5 allocations (simplified for demo)

// O(n) — StringBuilder mutates an internal buffer
var sb = new StringBuilder();
for (int i = 0; i < 5; i++)
    sb.Append(i).Append(", ");   // fluent chaining

string result = sb.ToString();
Console.WriteLine(result);   // 0, 1, 2, 3, 4,

// Multi-line with AppendLine
var html = new StringBuilder()
    .AppendLine("<ul>")
    .AppendLine("  <li>Item 1</li>")
    .AppendLine("  <li>Item 2</li>")
    .AppendLine("</ul>");
Console.Write(html);`,
    explanation: "`StringBuilder` maintains a mutable char buffer that grows geometrically — concatenating strings in a loop with `+=` is O(n²) because each operation allocates a new string. Use `StringBuilder` when building strings incrementally in a loop.",
  },
  {
    id: "cs-b16-b1-captured-loop-var",
    language: "csharp",
    title: "Captured loop variable in lambda",
    tag: "understanding",
    code: `// for-loop: all lambdas share the same 'i' variable
var actions = new List<Action>();
for (int i = 0; i < 5; i++)
{
    actions.Add(() => Console.Write(i + " "));   // captures 'i' by ref
}
actions.ForEach(a => a());
Console.WriteLine();
// 5 5 5 5 5  — all see final value of i

// Fix: copy to a local variable inside the loop
actions.Clear();
for (int i = 0; i < 5; i++)
{
    int copy = i;   // new variable per iteration
    actions.Add(() => Console.Write(copy + " "));
}
actions.ForEach(a => a());
Console.WriteLine();
// 0 1 2 3 4  — correct

// foreach in C# 5+ generates a new variable per iteration (already fixed)
var letters = new[] { "a", "b", "c" };
var fns = letters.Select(letter => (Action)(() => Console.Write(letter))).ToList();
fns.ForEach(f => f());  // a b c`,
    explanation: "Lambdas in C# capture variables by reference — in a `for` loop all closures share the same `i` variable, which holds the final value when invoked later. The fix is capturing a copy inside the loop. `foreach` has been fixed since C# 5 to generate a fresh variable per iteration.",
  },
  {
    id: "cs-b16-b1-priority-queue",
    language: "csharp",
    title: "PriorityQueue<T,P> for min-heap ordering",
    tag: "structures",
    code: `// PriorityQueue dequeues lowest priority first (min-heap)
var pq = new PriorityQueue<string, int>();

pq.Enqueue("low priority task",    10);
pq.Enqueue("critical task",         1);
pq.Enqueue("medium priority task",  5);
pq.Enqueue("urgent task",           2);

while (pq.Count > 0)
{
    string item = pq.Dequeue();
    Console.WriteLine(item);
}
// critical task
// urgent task
// medium priority task
// low priority task

// TryDequeue and TryPeek are non-throwing alternatives
bool success = pq.TryDequeue(out string? elem, out int priority);`,
    explanation: "`PriorityQueue<TElement, TPriority>` (added in .NET 6) is a min-heap that dequeues the element with the lowest priority value — unlike a `SortedSet`, it allows duplicate priorities and has O(log n) enqueue and dequeue.",
  },
  {
    id: "cs-b16-b1-int-vs-long-range",
    language: "csharp",
    title: "int vs long range limits",
    tag: "types",
    code: `Console.WriteLine(int.MinValue);    // -2,147,483,648  (-(2^31))
Console.WriteLine(int.MaxValue);    //  2,147,483,647  (2^31 - 1)
Console.WriteLine(long.MinValue);   // -9,223,372,036,854,775,808  (-(2^63))
Console.WriteLine(long.MaxValue);   //  9,223,372,036,854,775,807  (2^63 - 1)

// int overflow wraps silently in unchecked context (default)
int max = int.MaxValue;
Console.WriteLine(max + 1);         // -2,147,483,648 — wrapped!

// checked throws instead
try
{
    checked { int overflow = max + 1; }
}
catch (OverflowException e)
{
    Console.WriteLine(e.Message);   // Arithmetic operation resulted in an overflow
}

// For larger numbers: BigInteger
var big = System.Numerics.BigInteger.Pow(2, 128);
Console.WriteLine(big);`,
    explanation: "`int` is a 32-bit signed integer capped at ~2.1 billion; `long` is 64-bit at ~9.2 quintillion. Integer overflow silently wraps in unchecked contexts — use the `checked` keyword or `BigInteger` when values may exceed the type's range.",
  },
  {
    id: "cs-b16-b1-abstract-vs-interface",
    language: "csharp",
    title: "Abstract class vs interface: when to use each",
    tag: "classes",
    code: `// Interface: defines a contract — what something CAN DO
// Multiple interfaces allowed, no state
interface ISerializable
{
    string Serialize();
    static abstract string Format { get; }  // C# 11 static abstract
}

// Abstract class: partial implementation — what something IS
// Single inheritance, can have state and non-abstract methods
abstract class Animal
{
    public string Name { get; init; } = "";  // shared state
    public abstract string Sound();          // must override
    public string Describe() => \`\${Name} says \${Sound()}\`;  // shared impl
}

class Dog : Animal, ISerializable
{
    public override string Sound() => "woof";
    public string Serialize() => \`{"name":"\${Name}"}\`;
    public static string Format => "json";
}

var d = new Dog { Name = "Rex" };
Console.WriteLine(d.Describe());    // Rex says woof`,
    explanation: "Prefer interfaces when defining capabilities a class should support (can be combined freely); prefer abstract classes when sharing implementation or state across a hierarchy. In modern C#, interface default methods blur the line, but abstract classes still win for shared mutable state.",
  },
  {
    id: "cs-b16-b1-task-result-deadlock",
    language: "csharp",
    title: "Task.Result deadlock on sync context",
    tag: "caveats",
    code: `// In a UI or ASP.NET Classic context, this deadlocks:
// async Task<string> GetDataAsync() { ... await ... }
// string data = GetDataAsync().Result;  // DEADLOCK!

// Why: .Result blocks the calling thread, which owns the sync context.
// The continuation tries to resume on that same thread — impossible.

// Fix 1: go async all the way
// string data = await GetDataAsync();

// Fix 2: ConfigureAwait(false) to release the sync context
async Task<string> LibraryMethod()
{
    await Task.Delay(1).ConfigureAwait(false);
    return "done";
}
// Now .Result is safe IF the continuation has no sync context dependency

// Fix 3: Task.Run to offload (last resort)
string result = Task.Run(() => LibraryMethod()).Result;
Console.WriteLine(result);  // done`,
    explanation: "`Task.Result` and `Task.Wait()` synchronously block the current thread — in environments with a single-threaded `SynchronizationContext` (WinForms, WPF, classic ASP.NET), this deadlocks because the awaited continuation needs the same thread. Always `await` instead of blocking.",
  },
  {
    id: "cs-b16-b1-ienumerable-vs-ilist",
    language: "csharp",
    title: "IEnumerable<T> vs IList<T> vs IReadOnlyList<T>",
    tag: "families",
    code: `void PrintCount(IEnumerable<int> seq)
{
    // Can't use Count without ToList() or Cast to IList
    // Must enumerate the whole sequence
    Console.WriteLine(seq.Count());  // O(n) — enumerates!
}

void PrintFast(IList<int> list)
{
    Console.WriteLine(list.Count);   // O(1) — stored property
    Console.WriteLine(list[0]);      // O(1) indexed access
}

void ReadOnly(IReadOnlyList<int> list)
{
    Console.WriteLine(list.Count);   // O(1)
    Console.WriteLine(list[0]);      // O(1)
    // list[0] = 99;   // compile error — read-only
}

var data = new List<int> { 1, 2, 3 };
PrintCount(data);    // all three accept List<int>
PrintFast(data);
ReadOnly(data);`,
    explanation: "`IEnumerable<T>` is the most flexible but weakest contract — no count, no index access, possibly lazy. `IList<T>` adds O(1) count and random access but exposes mutation. `IReadOnlyList<T>` gives fast access without allowing mutation, making it the ideal return type for APIs that shouldn't expose collection internals.",
  },
  {
    id: "cs-b16-b1-span-slice",
    language: "csharp",
    title: "Span<T> slice without allocation",
    tag: "snippet",
    code: `// Span<T> is a stack-only view over contiguous memory
int[] array = [10, 20, 30, 40, 50, 60, 70, 80];

Span<int> full  = array.AsSpan();
Span<int> slice = array.AsSpan(2, 4);  // no copy!

Console.WriteLine(slice[0]);  // 30
Console.WriteLine(slice.Length);  // 4

// Mutating the span mutates the original array
slice[0] = 99;
Console.WriteLine(array[2]);  // 99 — original changed

// String slicing without allocation
string text = "Hello, World!";
ReadOnlySpan<char> span = text.AsSpan(7, 5);
Console.WriteLine(span.ToString());  // World`,
    explanation: "`Span<T>` is a ref struct that represents a contiguous slice of memory — slicing it is O(1) with zero allocation because it's just a pointer and length. It enables high-performance parsing and transformation without creating intermediate arrays.",
  },
  {
    id: "cs-b16-b1-idisposable-double-dispose",
    language: "csharp",
    title: "IDisposable double-dispose pattern",
    tag: "caveats",
    code: `class ManagedResource : IDisposable
{
    private bool _disposed = false;

    public void Use()
    {
        ObjectDisposedException.ThrowIf(_disposed, this);
        Console.WriteLine("Using resource");
    }

    public void Dispose()
    {
        Dispose(disposing: true);
        GC.SuppressFinalize(this);
    }

    protected virtual void Dispose(bool disposing)
    {
        if (_disposed) return;   // idempotent — safe to call twice
        if (disposing)
            Console.WriteLine("Releasing managed resources");
        _disposed = true;
    }
}

using var r = new ManagedResource();
r.Use();
r.Dispose();   // explicit
// r auto-disposed again at end of using scope — but _disposed guard prevents double-free`,
    explanation: "The standard `IDisposable` pattern uses a `_disposed` flag to make `Dispose` idempotent — calling it multiple times is safe. The `protected virtual Dispose(bool)` overload supports subclassing while the public `Dispose()` suppresses finalization.",
  },
  {
    id: "cs-b16-b1-collection-expression",
    language: "csharp",
    title: "Collection expression syntax (C# 12)",
    tag: "snippet",
    code: `// Collection expressions work for arrays, List, Span, etc.
int[] nums    = [1, 2, 3, 4, 5];
List<string>  names  = ["Alice", "Bob", "Carol"];
Span<double>  prices = [1.99, 3.49, 0.75];

Console.WriteLine(nums[0]);    // 1
Console.WriteLine(names[1]);   // Bob

// Spread operator ..
int[] first  = [1, 2, 3];
int[] second = [4, 5, 6];
int[] merged = [..first, ..second, 7, 8];
Console.WriteLine(string.Join(", ", merged));
// 1, 2, 3, 4, 5, 6, 7, 8

// Nested collections
List<int[]> matrix = [[1, 2], [3, 4], [5, 6]];`,
    explanation: "Collection expressions (`[...]`) in C# 12 provide a uniform syntax for initializing any collection type — the compiler chooses the most efficient construction path. The `..` spread operator is the C# equivalent of Python's `*` unpacking in a list literal.",
  },
  {
    id: "cs-b16-b1-sealed-class",
    language: "csharp",
    title: "sealed class enables devirtualization",
    tag: "classes",
    code: `// sealed prevents inheritance — JIT can devirtualize calls
sealed class FastCounter
{
    private int _count;
    public void Increment() => _count++;   // JIT: direct call, no vtable
    public int Count => _count;
}

// Compare: non-sealed — JIT must check for overrides
class SlowCounter
{
    protected int _count;
    public virtual void Increment() => _count++;   // vtable dispatch
    public int Count => _count;
}

// Sealed also useful on overrides to stop further derivation
class Base
{
    public virtual void Greet() => Console.WriteLine("Base");
}
class Mid : Base
{
    public sealed override void Greet() => Console.WriteLine("Mid");
    // No class can override Greet after Mid
}

var c = new FastCounter();
for (int i = 0; i < 1_000_000; i++) c.Increment();
Console.WriteLine(c.Count);   // 1000000`,
    explanation: "`sealed` on a class prevents subclassing, which allows the JIT to replace virtual method calls with direct calls (devirtualization) — measurable throughput improvement in hot paths. It also documents intent: this class is not designed to be extended.",
  },
  {
    id: "cs-b16-b1-float-nan",
    language: "csharp",
    title: "float NaN is never equal to itself",
    tag: "caveats",
    code: `double nan = double.NaN;

Console.WriteLine(nan == nan);         // False — NaN != NaN!
Console.WriteLine(nan != nan);         // True
Console.WriteLine(nan < 1.0);         // False
Console.WriteLine(nan > 1.0);         // False

// Correct check
Console.WriteLine(double.IsNaN(nan));  // True

// NaN propagates
Console.WriteLine(nan + 1.0);         // NaN
Console.WriteLine(nan * 0.0);         // NaN  (not 0!)

// Positive and Negative Infinity
Console.WriteLine(1.0 / 0.0);         // Infinity
Console.WriteLine(-1.0 / 0.0);        // -Infinity
Console.WriteLine(double.IsInfinity(1.0 / 0.0));  // True`,
    explanation: "IEEE 754 defines NaN as not equal to anything, including itself — `double.IsNaN()` is the only reliable check. NaN also propagates through arithmetic, so a single NaN input silently corrupts an entire calculation chain.",
  },
  {
    id: "cs-b16-b1-generic-constraints",
    language: "csharp",
    title: "Generic where constraints",
    tag: "types",
    code: `// new(): T must have a parameterless constructor
T CreateNew<T>() where T : new() => new T();

// class: reference type; struct: value type
void PrintHash<T>(T item) where T : class
    => Console.WriteLine(item.GetHashCode());

// interface + new
T CreateAndInit<T>() where T : IDisposable, new()
{
    var obj = new T();
    return obj;
}

// Combine: class, interface, new
class Repository<T> where T : class, IComparable<T>, new()
{
    public T Create() => new T();
}

// notnull: excludes nullable reference and value types (C# 8+)
void Process<T>(T value) where T : notnull
    => Console.WriteLine(value);

Process("hello");
Process(42);
// Process(null);   // warning`,
    explanation: "Generic `where` constraints restrict which types can be substituted for `T` — `new()` guarantees parameterless construction, `class`/`struct` restricts to reference/value types, and interface constraints ensure required API surface.",
  },
  {
    id: "cs-b16-b1-task-vs-valuetask",
    language: "csharp",
    title: "Task vs ValueTask: allocation trade-offs",
    tag: "families",
    code: `// Task always allocates a heap object — even for sync-completed work
async Task<int> AlwaysAllocates()
{
    return 42;  // still creates a Task object
}

// ValueTask avoids allocation when result is synchronous
async ValueTask<int> MaybeAllocates(bool cache)
{
    if (cache) return 42;           // no heap allocation
    await Task.Delay(1);            // allocates only when truly async
    return 42;
}

// Usage is identical
int a = await AlwaysAllocates();
int b = await MaybeAllocates(true);
Console.WriteLine(a + b);  // 84

// WARNING: ValueTask can only be awaited ONCE
ValueTask<int> vt = MaybeAllocates(false);
int r1 = await vt;
// int r2 = await vt;   // undefined behavior — don't do this`,
    explanation: "`ValueTask<T>` is a discriminated union of a result and a `Task<T>` — when the operation completes synchronously, it avoids a heap allocation. It's a micro-optimization for hot code paths where the common case is a cached/synchronous result.",
  },
  {
    id: "cs-b16-b1-linq-groupby",
    language: "csharp",
    title: "LINQ GroupBy + Select for aggregation",
    tag: "snippet",
    code: `var orders = new[]
{
    new { Product = "Apple",  Qty = 3, Region = "North" },
    new { Product = "Banana", Qty = 5, Region = "South" },
    new { Product = "Apple",  Qty = 2, Region = "South" },
    new { Product = "Banana", Qty = 1, Region = "North" },
    new { Product = "Cherry", Qty = 4, Region = "North" },
};

var summary = orders
    .GroupBy(o => o.Product)
    .Select(g => new
    {
        Product  = g.Key,
        Total    = g.Sum(o => o.Qty),
        Regions  = g.Select(o => o.Region).Distinct().Count(),
    })
    .OrderByDescending(s => s.Total);

foreach (var s in summary)
    Console.WriteLine(\`\${s.Product}: qty=\${s.Total} regions=\${s.Regions}\`);`,
    explanation: "LINQ `GroupBy` partitions a sequence into groups by a key — the resulting `IGrouping<K,V>` is itself `IEnumerable<V>` so you can chain any LINQ operator on the group, enabling SQL-style aggregations without writing a loop.",
  },
  {
    id: "cs-b16-b1-partial-class",
    language: "csharp",
    title: "Partial class use cases",
    tag: "classes",
    code: `// File 1: MyForm.Designer.cs (generated by tooling)
partial class MyForm
{
    private System.Windows.Forms.Button _okButton = null!;
    private void InitializeComponent()
    {
        _okButton = new System.Windows.Forms.Button();
        // ... designer-generated code
    }
}

// File 2: MyForm.cs (hand-written logic)
partial class MyForm
{
    public MyForm() => InitializeComponent();

    private void OnOkClicked(object? sender, EventArgs e)
        => Console.WriteLine("OK clicked");
}

// Source generators also emit partial classes/methods
partial class WeatherService
{
    // Source-generated: context-specific code
    partial void OnForecastLoaded(string city);
}`,
    explanation: "`partial class` splits a class definition across multiple files — the compiler merges them before compiling. This is primarily used by code generators (WinForms Designer, Roslyn source generators, Entity Framework) so generated code lives in its own file that can be safely regenerated.",
  },
  {
    id: "cs-b16-b1-enum-flags",
    language: "csharp",
    title: "Flags enum with bitwise operations",
    tag: "understanding",
    code: `[Flags]
enum Permissions
{
    None    = 0,
    Read    = 1 << 0,   // 0001
    Write   = 1 << 1,   // 0010
    Execute = 1 << 2,   // 0100
    Admin   = Read | Write | Execute,
}

var p = Permissions.Read | Permissions.Write;
Console.WriteLine(p);                    // Read, Write
Console.WriteLine(p.HasFlag(Permissions.Read));    // True
Console.WriteLine(p.HasFlag(Permissions.Execute)); // False

// Add a permission
p |= Permissions.Execute;
Console.WriteLine(p);  // Read, Write, Execute

// Remove a permission
p &= ~Permissions.Write;
Console.WriteLine(p);  // Read, Execute`,
    explanation: "`[Flags]` tells the runtime that the enum values represent bit flags that can be combined with `|` — `HasFlag`, `ToString`, and `Enum.Parse` all understand the combination. Always define values as powers of two (or explicit bit combinations).",
  },
  {
    id: "cs-b16-b1-linq-aggregate",
    language: "csharp",
    title: "LINQ Aggregate for custom folds",
    tag: "snippet",
    code: `int[] nums = [1, 2, 3, 4, 5];

// Running product
int product = nums.Aggregate(1, (acc, x) => acc * x);
Console.WriteLine(product);   // 120

// Build a string from parts
string sentence = new[] { "Hello", "world", "from", "LINQ" }
    .Aggregate((acc, word) => acc + " " + word);
Console.WriteLine(sentence);  // Hello world from LINQ

// Seed + result selector (3-argument overload)
string formatted = nums.Aggregate(
    seed:           new System.Text.StringBuilder(),
    func:           (sb, n) => sb.Append(n).Append(", "),
    resultSelector: sb => sb.ToString().TrimEnd(',', ' ')
);
Console.WriteLine(formatted);  // 1, 2, 3, 4, 5`,
    explanation: "`Aggregate` is LINQ's general fold — the two-argument overload uses the first element as seed, the three-argument overload allows a different seed type and a final projection. It replaces any loop that accumulates a single value from a sequence.",
  },
  {
    id: "cs-b16-b1-double-vs-decimal",
    language: "csharp",
    title: "double vs decimal: speed vs precision for money",
    tag: "types",
    code: `// double: binary floating-point — fast but imprecise
double d1 = 0.1 + 0.2;
Console.WriteLine(d1);         // 0.30000000000000004
Console.WriteLine(d1 == 0.3);  // False

// decimal: base-10 floating-point — slower but exact
decimal m1 = 0.1m + 0.2m;
Console.WriteLine(m1);         // 0.3
Console.WriteLine(m1 == 0.3m); // True

// decimal range and precision
Console.WriteLine(decimal.MaxValue);  // 79,228,162,514,264,337,593,543,950,335
Console.WriteLine(decimal.MinValue);  // negative of above

// Always use decimal for financial calculations
decimal price = 19.99m;
decimal tax   = 0.08m;
decimal total = Math.Round(price * (1 + tax), 2, MidpointRounding.AwayFromZero);
Console.WriteLine(total);   // 21.59`,
    explanation: "`double` uses binary floating-point (IEEE 754) and cannot represent 0.1 exactly — use `decimal` for financial or tax calculations where exact base-10 arithmetic matters. `decimal` is ~3-10x slower but avoids penny-rounding errors.",
  },
  {
    id: "cs-b16-b1-multiple-enumeration",
    language: "csharp",
    title: "Multiple enumeration of IEnumerable",
    tag: "caveats",
    code: `// Every time you enumerate, it re-executes the query
IEnumerable<int> expensive = Enumerable.Range(1, 5)
    .Select(x => { Console.Write(\`[eval \${x}] \`); return x * x; });

// First enumeration
int count = expensive.Count();    // evaluates 5 times
Console.WriteLine();

// Second enumeration — evaluates AGAIN
int sum   = expensive.Sum();      // evaluates 5 more times
Console.WriteLine();

// Fix: materialize once
var materialized = expensive.ToList();  // evaluates once
int count2 = materialized.Count;        // O(1), no re-evaluation
int sum2   = materialized.Sum();        // iterates the list (already computed)
Console.WriteLine(\`count=\${count2} sum=\${sum2}\`);`,
    explanation: "LINQ queries on `IEnumerable<T>` are lazy — each enumeration re-executes the entire pipeline from source. If the source has side effects (DB queries, API calls, expensive computation), calling `Count()`, `Sum()`, `First()`, etc. separately each causes a full re-evaluation. Call `.ToList()` or `.ToArray()` to materialize once.",
  },
  {
    id: "cs-b16-b1-action-func-predicate",
    language: "csharp",
    title: "Action vs Func vs Predicate<T>",
    tag: "families",
    code: `// Action<T>: void delegate — does something, returns nothing
Action<string> log = msg => Console.WriteLine(\`[LOG] \${msg}\`);
log("hello");   // [LOG] hello

// Func<T,TResult>: returns a value
Func<int, int, int> add = (a, b) => a + b;
Console.WriteLine(add(3, 4));   // 7

// Predicate<T>: Func<T,bool> alias — returns true/false
Predicate<int> isEven = n => n % 2 == 0;
Console.WriteLine(isEven(4));   // True

// All three are just generic delegate types
// Predicate<T> == Func<T, bool>
Func<int, bool> isEvenFunc = n => n % 2 == 0;

var nums = new List<int> { 1, 2, 3, 4, 5 };
// List.FindAll takes Predicate<T>
var evens = nums.FindAll(isEven);
Console.WriteLine(string.Join(", ", evens));  // 2, 4`,
    explanation: "`Action<T...>` covers void delegates, `Func<T..., TResult>` covers value-returning delegates, and `Predicate<T>` is a specialized `Func<T, bool>` kept for historical compatibility. Prefer `Func`/`Action` in new code for consistency with LINQ.",
  },
  {
    id: "cs-b16-b1-extension-method",
    language: "csharp",
    title: "Extension method pattern",
    tag: "classes",
    code: `// Must be in a static class; first parameter is 'this T'
static class StringExtensions
{
    public static string Truncate(this string s, int maxLength, string suffix = "...")
    {
        if (s.Length <= maxLength) return s;
        return s[..(maxLength - suffix.Length)] + suffix;
    }

    public static bool IsNullOrEmpty(this string? s)
        => string.IsNullOrEmpty(s);
}

string title = "The quick brown fox jumps over the lazy dog";
Console.WriteLine(title.Truncate(20));     // The quick brown f...
Console.WriteLine(title.Truncate(20, "…")); // The quick brown fox…

string? name = null;
Console.WriteLine(name.IsNullOrEmpty());   // True — even on null!`,
    explanation: "Extension methods add methods to existing types without modifying or subclassing them — you can call them as if they were instance methods, even on `null` (as long as the method handles it). They're how LINQ adds query operators to `IEnumerable<T>`.",
  },
  {
    id: "cs-b16-b1-lazy-thread-safety",
    language: "csharp",
    title: "Lazy<T> thread safety modes",
    tag: "understanding",
    code: `// Default: LazyThreadSafetyMode.ExecutionAndPublication — safe but uses locks
var safeDefault = new Lazy<string>(() =>
{
    Console.WriteLine("  initializing...");
    return "computed";
});

// Not thread-safe — no locking, fastest
var notSafe = new Lazy<string>(
    () => "fast",
    LazyThreadSafetyMode.None
);

// PublicationOnly: multiple threads may compute, first one wins
var pubOnly = new Lazy<string>(
    () => "raced",
    LazyThreadSafetyMode.PublicationOnly
);

Console.WriteLine(safeDefault.IsValueCreated);  // False
Console.WriteLine(safeDefault.Value);           //   initializing... computed
Console.WriteLine(safeDefault.IsValueCreated);  // True
Console.WriteLine(safeDefault.Value);           // computed — cached`,
    explanation: "`Lazy<T>` defers initialization until first access — `ExecutionAndPublication` (default) uses a lock to guarantee a single initialization; `PublicationOnly` allows races but discards losers; `None` skips locking entirely for single-threaded scenarios.",
  },
  {
    id: "cs-b16-b1-icomparable-iequatable",
    language: "csharp",
    title: "IComparable<T> vs IEquatable<T>",
    tag: "families",
    code: `class Temperature : IComparable<Temperature>, IEquatable<Temperature>
{
    public double Celsius { get; }
    public Temperature(double c) => Celsius = c;

    // IComparable<T>: ordering — used by Sort, Min, Max
    public int CompareTo(Temperature? other)
    {
        if (other is null) return 1;
        return Celsius.CompareTo(other.Celsius);
    }

    // IEquatable<T>: value equality — faster than object.Equals
    public bool Equals(Temperature? other)
        => other is not null && Celsius == other.Celsius;

    public override bool Equals(object? obj) => Equals(obj as Temperature);
    public override int GetHashCode() => Celsius.GetHashCode();
}

var temps = new[] { new Temperature(100), new Temperature(0), new Temperature(37) };
Array.Sort(temps);
Console.WriteLine(temps[0].Celsius);  // 0`,
    explanation: "`IComparable<T>` provides ordering (`<`, `>`) used by `Array.Sort` and `SortedSet`; `IEquatable<T>` provides typed equality that avoids boxing in generic collections. Implement both when your type has a natural total order.",
  },
  {
    id: "cs-b16-b1-required-member",
    language: "csharp",
    title: "required member (C# 11)",
    tag: "classes",
    code: `class Order
{
    public required string OrderId { get; init; }     // must be set
    public required string CustomerId { get; init; }  // must be set
    public int Quantity { get; init; } = 1;           // optional (has default)
    public string? Notes { get; init; }               // optional (nullable)
}

// Compiler error if required member is omitted
// var bad = new Order { OrderId = "O-001" };  // CS9035: CustomerId required

var order = new Order
{
    OrderId    = "O-001",
    CustomerId = "C-42",
    // Quantity and Notes are optional
};

Console.WriteLine(\`\${order.OrderId} for \${order.CustomerId}\`);
// O-001 for C-42`,
    explanation: "`required` (C# 11) marks an object initializer property or field as mandatory — the compiler enforces that it's set at construction, providing clearer intent than a runtime `ArgumentNullException` in the constructor body.",
  },
  {
    id: "cs-b16-b1-unchecked-overflow",
    language: "csharp",
    title: "unchecked int overflow wrap-around",
    tag: "caveats",
    code: `// Default context is unchecked — overflow wraps silently
int max = int.MaxValue;   // 2,147,483,647
Console.WriteLine(unchecked(max + 1));   // -2,147,483,648 — wrapped!

// Same in constant context (unchecked is the default)
int wrap = max + 1;   // no warning in release build!
Console.WriteLine(wrap);   // -2,147,483,648

// Hash code tricks intentionally use overflow:
unchecked
{
    int hash = 17;
    hash = hash * 31 + "field1".GetHashCode();
    hash = hash * 31 + 42.GetHashCode();
    Console.WriteLine(hash);  // some int, overflow intended
}

// Use checked to detect overflow
try { checked { int x = max + 1; } }
catch (OverflowException) { Console.WriteLine("overflow!"); }`,
    explanation: "C# arithmetic is unchecked by default — integer overflow silently wraps around, which is intentional for hash codes but catastrophic for counters or financial totals. Enable `checked` in project settings or use the `checked` keyword around critical arithmetic.",
  },
  {
    id: "cs-b16-b1-linq-zip",
    language: "csharp",
    title: "LINQ Zip to combine two sequences",
    tag: "snippet",
    code: `string[] names  = ["Alice", "Bob", "Carol"];
int[]    scores = [95, 87, 92];
char[]   grades = ['A', 'B', 'A'];

// Two-sequence Zip — pairs corresponding elements
var pairs = names.Zip(scores, (n, s) => \`\${n}: \${s}\`);
foreach (var p in pairs)
    Console.WriteLine(p);
// Alice: 95
// Bob: 87
// Carol: 92

// Three-sequence Zip (C# 9+) — triples
var triples = names.Zip(scores).Zip(grades,
    (ns, g) => \`\${ns.First} scored \${ns.Second} (\${g})\`);
foreach (var t in triples)
    Console.WriteLine(t);`,
    explanation: "`Enumerable.Zip` combines corresponding elements from two (or three in .NET 6+) sequences into pairs — it stops at the shortest sequence, so mismatched lengths silently drop trailing elements (same caveat as Python's `zip`).",
  },
  {
    id: "cs-b16-b1-readonly-struct",
    language: "csharp",
    title: "readonly struct: guaranteed immutability",
    tag: "types",
    code: `readonly struct Vector2D
{
    public double X { get; }  // init-only by default in readonly struct
    public double Y { get; }

    public Vector2D(double x, double y) { X = x; Y = y; }

    // All methods are implicitly readonly — no defensive copies
    public double Length => Math.Sqrt(X * X + Y * Y);
    public Vector2D Add(Vector2D other) => new(X + other.X, Y + other.Y);
    public override string ToString() => \`(\${X}, \${Y})\`;
}

var v1 = new Vector2D(3, 4);
var v2 = new Vector2D(1, 2);
Console.WriteLine(v1.Length);     // 5
Console.WriteLine(v1.Add(v2));    // (4, 6)
Console.WriteLine(v1);            // (3, 4) — v1 unchanged`,
    explanation: "Marking a struct `readonly` guarantees all fields are set only in the constructor — the compiler prevents mutation and eliminates defensive copies that the runtime normally makes before calling a non-readonly method on a struct.",
  },
  {
    id: "cs-b16-b1-enumerable-range",
    language: "csharp",
    title: "Enumerable.Range for sequences without a loop",
    tag: "snippet",
    code: `// Generates integers from start to start+count-1
var oneToTen = Enumerable.Range(1, 10).ToArray();
Console.WriteLine(string.Join(", ", oneToTen));
// 1, 2, 3, 4, 5, 6, 7, 8, 9, 10

// Use with Select to generate derived sequences
var squares = Enumerable.Range(1, 5).Select(n => n * n);
Console.WriteLine(string.Join(", ", squares));  // 1, 4, 9, 16, 25

// Fibonacci-like without a loop — using Aggregate with tuple state
var fibs = Enumerable.Range(0, 8)
    .Aggregate(
        (a: 0, b: 1, acc: new List<int>()),
        (state, _) => (state.b, state.a + state.b, state.acc.Concat([state.a]).ToList() as List<int>),
        state => state.acc
    );
Console.WriteLine(string.Join(", ", fibs));`,
    explanation: "`Enumerable.Range(start, count)` produces a lazy sequence of `count` integers starting at `start` — chaining `.Select()` turns it into any derived sequence, replacing explicit `for` loops in LINQ query pipelines.",
  },
  {
    id: "cs-b16-b1-dictionary-sorteddictionary",
    language: "csharp",
    title: "Dictionary vs SortedDictionary complexity",
    tag: "structures",
    code: `// Dictionary: O(1) average, unordered
var dict = new Dictionary<string, int>
{
    ["banana"] = 2,
    ["apple"]  = 5,
    ["cherry"] = 1,
};
Console.WriteLine(string.Join(", ", dict.Keys));
// insertion order (in .NET 5+) but not sorted

// SortedDictionary: O(log n), always sorted by key
var sorted = new SortedDictionary<string, int>
{
    ["banana"] = 2,
    ["apple"]  = 5,
    ["cherry"] = 1,
};
Console.WriteLine(string.Join(", ", sorted.Keys));
// apple, banana, cherry — alphabetical

// SortedList: same API as SortedDictionary but backed by arrays
// Better memory, faster iteration — but O(n) insert/delete
var sl = new SortedList<string, int>(dict);
Console.WriteLine(sl.Keys[0]);  // apple`,
    explanation: "`Dictionary<K,V>` is a hash table (O(1) average); `SortedDictionary<K,V>` is a red-black tree (O(log n), ordered); `SortedList<K,V>` is a sorted array pair (O(n) insert but compact and faster to iterate). Choose based on your access pattern.",
  },
  {
    id: "cs-b16-b1-static-constructor",
    language: "csharp",
    title: "Static constructor: runs once per type",
    tag: "understanding",
    code: `class Config
{
    public static readonly string ConnectionString;
    public static readonly int MaxRetries;

    // Static constructor — runs once before first use of the type
    static Config()
    {
        Console.WriteLine("Static constructor running");
        ConnectionString = Environment.GetEnvironmentVariable("DB_URL")
            ?? "Server=localhost;Database=app";
        MaxRetries = int.TryParse(
            Environment.GetEnvironmentVariable("MAX_RETRIES"), out int r) ? r : 3;
    }
}

Console.WriteLine("Before first access");
Console.WriteLine(Config.MaxRetries);   // triggers static ctor
Console.WriteLine(Config.MaxRetries);   // no re-run
// Output:
// Before first access
// Static constructor running
// 3
// 3`,
    explanation: "A static constructor runs exactly once per type — immediately before the first access to any static member or before the first instance is created. It's guaranteed to complete before any code can observe the type's static state, making it thread-safe without explicit locking.",
  },
  {
    id: "cs-b16-b1-string-split-options",
    language: "csharp",
    title: "string.Split with StringSplitOptions",
    tag: "snippet",
    code: `string csv = "apple,,banana, ,cherry,  ";

// Default: keeps empty entries
string[] defaults = csv.Split(',');
Console.WriteLine(defaults.Length);      // 6
Console.WriteLine(defaults[1]);          // empty string

// RemoveEmptyEntries: drops blank entries
string[] noEmpties = csv.Split(',', StringSplitOptions.RemoveEmptyEntries);
Console.WriteLine(noEmpties.Length);     // 4  (includes " " and "  ")

// TrimEntries | RemoveEmptyEntries (C# 8+): trim AND drop
string[] clean = csv.Split(',',
    StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
foreach (var s in clean)
    Console.WriteLine(\`'\${s}'\`);
// 'apple', 'banana', 'cherry'`,
    explanation: "`StringSplitOptions.TrimEntries` (added in .NET 5) trims whitespace from each token, and combined with `RemoveEmptyEntries` it cleans up messy CSV-style input in one call — previously this required a `.Select(s => s.Trim()).Where(s => s.Length > 0)` chain.",
  },
  {
    id: "cs-b16-b1-idisposable-vs-iasync",
    language: "csharp",
    title: "IDisposable vs IAsyncDisposable",
    tag: "families",
    code: `// IDisposable: synchronous cleanup (file handles, unmanaged resources)
class FileWriter : IDisposable
{
    private readonly System.IO.StreamWriter _writer;
    public FileWriter(string path) => _writer = new System.IO.StreamWriter(path);
    public void Write(string text) => _writer.Write(text);
    public void Dispose() => _writer.Dispose();  // synchronous
}

// IAsyncDisposable: async cleanup (network connections, async streams)
class AsyncDbConnection : IAsyncDisposable
{
    public async ValueTask DisposeAsync()
    {
        await Task.Delay(1);   // simulate async flush/close
        Console.WriteLine("Connection closed asynchronously");
    }
}

// using statement auto-calls Dispose
using (var fw = new FileWriter("out.txt")) fw.Write("hi");

// await using auto-calls DisposeAsync
await using (var db = new AsyncDbConnection()) { }`,
    explanation: "`IAsyncDisposable` and `await using` allow cleanup code to be asynchronous — essential for network connections, database pools, and async streams where synchronous blocking in `Dispose` would cause thread-pool starvation.",
  },
  {
    id: "cs-b16-b1-concurrent-dict",
    language: "csharp",
    title: "ConcurrentDictionary AddOrUpdate",
    tag: "structures",
    code: `using System.Collections.Concurrent;

var wordCount = new ConcurrentDictionary<string, int>(StringComparer.OrdinalIgnoreCase);

string[] words = ["the", "cat", "sat", "on", "the", "mat", "the", "cat"];

// Thread-safe increment: AddOrUpdate is atomic
foreach (string word in words)
    wordCount.AddOrUpdate(word, addValue: 1, updateValueFactory: (_, c) => c + 1);

foreach (var (word, count) in wordCount.OrderByDescending(kv => kv.Value))
    Console.WriteLine(\`\${word}: \${count}\`);
// the: 3, cat: 2, sat: 1, on: 1, mat: 1

// GetOrAdd: returns existing or creates new value
var entry = wordCount.GetOrAdd("new", _ => 0);
Console.WriteLine(entry);  // 0`,
    explanation: "`ConcurrentDictionary.AddOrUpdate` atomically adds a new key-value pair or updates an existing one — it handles the read-modify-write race condition that would occur with a regular `Dictionary` accessed from multiple threads.",
  },
  {
    id: "cs-b16-b1-init-only-setter",
    language: "csharp",
    title: "init-only setter for post-construction immutability",
    tag: "classes",
    code: `class Config
{
    // init: can be set in object initializer, but not after
    public string Host { get; init; } = "localhost";
    public int    Port { get; init; } = 8080;
    public bool   Debug { get; init; }

    // Regular property — mutable after construction
    public string? LastError { get; set; }
}

var cfg = new Config { Host = "prod.example.com", Port = 443, Debug = false };
Console.WriteLine(\`\${cfg.Host}:\${cfg.Port}\`);  // prod.example.com:443

// cfg.Host = "other";   // CS8852: cannot assign to init-only property

// But regular properties are still settable
cfg.LastError = "timeout";
Console.WriteLine(cfg.LastError);   // timeout`,
    explanation: "`init` accessors (C# 9) allow a property to be set during object initialization (including `with` expressions) but not afterward — they give records-like immutability to regular classes without making all properties `readonly`.",
  },
  {
    id: "cs-b16-b1-linq-distinctby",
    language: "csharp",
    title: "DistinctBy to deduplicate by a key",
    tag: "snippet",
    code: `record Product(string Name, string Category, decimal Price);

var products = new[]
{
    new Product("Apple",      "Fruit",  1.50m),
    new Product("Banana",     "Fruit",  0.75m),
    new Product("Carrot",     "Veggie", 0.60m),
    new Product("Broccoli",   "Veggie", 2.10m),
    new Product("Blueberry",  "Fruit",  4.00m),
};

// One product per category — keeps the first occurrence
var onePerCategory = products.DistinctBy(p => p.Category);
foreach (var p in onePerCategory)
    Console.WriteLine(\`\${p.Name} (\${p.Category})\`);
// Apple (Fruit)
// Carrot (Veggie)`,
    explanation: "`DistinctBy` (added in .NET 6) is a more ergonomic alternative to `GroupBy().Select(g => g.First())` when you need one representative element per key — it's O(n) with a hash set internally.",
  },
  {
    id: "cs-b16-b1-named-args",
    language: "csharp",
    title: "Named arguments for clarity",
    tag: "snippet",
    code: `static string FormatDate(int year, int month, int day,
    string separator = "-", bool yearFirst = true)
{
    return yearFirst
        ? \`\${year}\${separator}\${month:D2}\${separator}\${day:D2}\`
        : \`\${day:D2}\${separator}\${month:D2}\${separator}\${year}\`;
}

// Named arguments: order doesn't matter, intent is clear
Console.WriteLine(FormatDate(2026, 5, 16));
// 2026-05-16

Console.WriteLine(FormatDate(day: 16, month: 5, year: 2026, yearFirst: false));
// 16-05-2026

Console.WriteLine(FormatDate(year: 2026, month: 5, day: 16, separator: "/"));
// 2026/05/16

// Named args are especially useful when skipping optional parameters
Console.WriteLine(FormatDate(2026, 5, 16, yearFirst: false));`,
    explanation: "Named arguments allow passing parameters in any order and make call sites self-documenting — they're essential when a method has multiple optional parameters and you need to set only specific ones without specifying the preceding ones.",
  },
  {
    id: "cs-b16-b1-dynamic-dispatch",
    language: "csharp",
    title: "dynamic: runtime dispatch",
    tag: "types",
    code: `// dynamic skips compile-time type checking
dynamic obj = 42;
Console.WriteLine(obj + 1);      // 43  — resolved at runtime

obj = "hello";
Console.WriteLine(obj.Length);   // 5   — resolved at runtime

// Duck typing via dynamic
static void PrintLength(dynamic thing)
{
    Console.WriteLine(thing.Length);  // works for string, array, list...
}

PrintLength("hello");              // 5
PrintLength(new int[] { 1, 2, 3 }); // 3

// COM interop and JSON deserialization often return dynamic
dynamic json = Newtonsoft.Json.JsonConvert.DeserializeObject(\`{"Name":"Alice","Age":30}\`);
// Console.WriteLine(json.Name);   // would print "Alice"`,
    explanation: "`dynamic` defers member resolution to runtime via the DLR — it enables duck typing and simplifies COM/reflection interop, but loses all compile-time safety and IDE support. Use it sparingly and only at system boundaries.",
  },
  {
    id: "cs-b16-b1-take-skip",
    language: "csharp",
    title: "Take and Skip for pagination",
    tag: "snippet",
    code: `var items = Enumerable.Range(1, 50).ToList();

int pageSize = 10;

// Page 1 (0-based)
var page1 = items.Take(pageSize);
Console.WriteLine(string.Join(", ", page1));
// 1, 2, 3, 4, 5, 6, 7, 8, 9, 10

// Page 3
int pageIndex = 2;
var page3 = items.Skip(pageIndex * pageSize).Take(pageSize);
Console.WriteLine(string.Join(", ", page3));
// 21, 22, 23, 24, 25, 26, 27, 28, 29, 30

// TakeLast / SkipLast (.NET 6+)
var lastFive = items.TakeLast(5);
Console.WriteLine(string.Join(", ", lastFive));   // 46, 47, 48, 49, 50

// Chunk (NET 6+): split into fixed-size pages
var pages = items.Chunk(10);
Console.WriteLine(pages.Count());   // 5`,
    explanation: "`Skip(n).Take(m)` is the standard LINQ pagination pattern — most ORM query providers translate this directly to SQL `OFFSET`/`FETCH`. `.Chunk(n)` (added in .NET 6) is a higher-level operator that splits the sequence into fixed-size arrays.",
  },
  {
    id: "cs-b16-b1-stackalloc",
    language: "csharp",
    title: "stackalloc for small stack-allocated buffers",
    tag: "structures",
    code: `// stackalloc: allocate on the stack — no GC pressure
// Only safe in fixed-size, short-lived scenarios

Span<int> buffer = stackalloc int[8];
for (int i = 0; i < buffer.Length; i++)
    buffer[i] = i * i;

Console.WriteLine(string.Join(", ", buffer.ToArray()));
// 0, 1, 4, 9, 16, 25, 36, 49

// Useful for small scratch buffers in hot paths
ReadOnlySpan<byte> GetUtf8(string text)
{
    Span<byte> scratch = stackalloc byte[256];
    int written = System.Text.Encoding.UTF8.GetBytes(text, scratch);
    return scratch[..written].ToArray();  // must copy before returning (stack frame gone)
}

var bytes = GetUtf8("hello");
Console.WriteLine(bytes.Length);  // 5`,
    explanation: "`stackalloc` allocates a block on the current stack frame — no GC, no heap, zero allocation overhead. It's only safe for small, bounded buffers (the stack is limited to ~1 MB) and the span becomes invalid after the method returns.",
  },
  {
    id: "cs-b16-b1-func-lambda",
    language: "csharp",
    title: "Func<T,TResult> lambda as first-class value",
    tag: "snippet",
    code: `// Lambdas assigned to Func<>
Func<int, int>    square = x => x * x;
Func<int, int, int> power = (b, e) => (int)Math.Pow(b, e);

Console.WriteLine(square(5));     // 25
Console.WriteLine(power(2, 10));  // 1024

// Higher-order functions
Func<int, Func<int, int>> adder = a => b => a + b;
var add5 = adder(5);
Console.WriteLine(add5(3));       // 8
Console.WriteLine(add5(10));      // 15

// Pass lambdas as method arguments
static T ApplyTwice<T>(Func<T, T> f, T x) => f(f(x));
Console.WriteLine(ApplyTwice(square, 2));   // 16  (2²)² = 16
Console.WriteLine(ApplyTwice(add5, 0));     // 10`,
    explanation: "`Func<T, TResult>` is a delegate type for lambdas that return a value — lambdas are first-class values in C# and can be stored, passed, returned, and composed just like objects, enabling functional patterns alongside OOP.",
  },
  {
    id: "cs-b16-b1-interface-default-method",
    language: "csharp",
    title: "Interface default method resolution",
    tag: "understanding",
    code: `interface ILogger
{
    void Log(string msg);

    // Default implementation (C# 8+)
    void LogInfo(string msg) => Log(\`[INFO] \${msg}\`);
    void LogError(string msg) => Log(\`[ERROR] \${msg}\`);
}

class ConsoleLogger : ILogger
{
    public void Log(string msg) => Console.WriteLine(msg);
    // LogInfo and LogError are inherited from interface
}

ILogger logger = new ConsoleLogger();
logger.LogInfo("starting");    // [INFO] starting
logger.LogError("failed");     // [ERROR] failed

// Default methods are NOT visible on the class — only on the interface
ConsoleLogger cl = new ConsoleLogger();
// cl.LogInfo("x");   // compile error — must cast to interface
((ILogger)cl).LogInfo("x");   // works`,
    explanation: "Interface default methods (C# 8) let interface authors add new methods without breaking existing implementations — but they're only accessible through the interface type, not the concrete class, to avoid conflict with class-level method resolution.",
  },
  {
    id: "cs-b16-b1-linq-orderby-thenby",
    language: "csharp",
    title: "LINQ OrderBy + ThenBy for multi-key sort",
    tag: "snippet",
    code: `var students = new[]
{
    new { Name = "Alice", Grade = "B", Score = 85 },
    new { Name = "Bob",   Grade = "A", Score = 90 },
    new { Name = "Carol", Grade = "B", Score = 90 },
    new { Name = "Dave",  Grade = "A", Score = 85 },
};

var sorted = students
    .OrderBy(s => s.Grade)           // primary: grade ascending
    .ThenByDescending(s => s.Score)  // secondary: score descending
    .ThenBy(s => s.Name);            // tertiary: name ascending

foreach (var s in sorted)
    Console.WriteLine(\`\${s.Grade} \${s.Score} \${s.Name}\`);
// A 90 Bob
// A 85 Dave
// B 90 Carol
// B 85 Alice`,
    explanation: "`OrderBy` sorts by a primary key; `ThenBy`/`ThenByDescending` add secondary sort keys — each subsequent key only breaks ties from the previous level. LINQ's sort is stable, so equal elements preserve their original relative order.",
  },
  {
    id: "cs-b16-b1-static-class",
    language: "csharp",
    title: "Static class constraints and use cases",
    tag: "classes",
    code: `// Static class: cannot be instantiated or inherited
// Every member must be static
static class MathHelper
{
    public const double GoldenRatio = 1.6180339887;

    public static int Clamp(int value, int min, int max)
        => Math.Max(min, Math.Min(max, value));

    public static IEnumerable<int> Primes()
    {
        yield return 2;
        for (int n = 3; ; n += 2)
            if (IsPrime(n)) yield return n;
    }

    private static bool IsPrime(int n)
        => Enumerable.Range(2, (int)Math.Sqrt(n) - 1).All(i => n % i != 0);
}

Console.WriteLine(MathHelper.GoldenRatio);        // 1.6180339887
Console.WriteLine(MathHelper.Clamp(150, 0, 100)); // 100
Console.WriteLine(string.Join(", ", MathHelper.Primes().Take(5))); // 2, 3, 5, 7, 11`,
    explanation: "Static classes cannot be instantiated or used as a base class — the compiler enforces that all members are static, making the intent explicit. They're ideal for utility functions, extension method containers, and constants that don't belong to any instance.",
  },
  {
    id: "cs-b16-b1-type-pattern-is",
    language: "csharp",
    title: "Type pattern in is expression",
    tag: "types",
    code: `object[] items = [42, "hello", 3.14, true, null!, new List<int> { 1, 2 }];

foreach (object item in items)
{
    if (item is int n)
        Console.WriteLine(\`int: \${n * 2}\`);
    else if (item is string { Length: > 3 } s)  // property pattern
        Console.WriteLine(\`long string: \${s}\`);
    else if (item is double d)
        Console.WriteLine(\`double: \${d:F1}\`);
    else if (item is null)
        Console.WriteLine("null");
    else
        Console.WriteLine(\`other: \${item.GetType().Name}\`);
}
// int: 84
// long string: hello
// double: 3.1
// bool (from 'other')
// null
// other: List\`1`,
    explanation: "The `is` type pattern simultaneously tests the type, casts, and introduces a new scoped variable — property patterns (`{ Length: > 3 }`) add further conditions without nesting. This replaces the verbose `if (x is T) { var t = (T)x; ... }` idiom.",
  },
  {
    id: "cs-b16-b1-convert-base64",
    language: "csharp",
    title: "Convert.ToBase64String for binary encoding",
    tag: "snippet",
    code: `byte[] data = [0x48, 0x65, 0x6C, 0x6C, 0x6F]; // "Hello" in UTF-8

// Encode to Base64
string encoded = Convert.ToBase64String(data);
Console.WriteLine(encoded);  // SGVsbG8=

// Decode back
byte[] decoded = Convert.FromBase64String(encoded);
Console.WriteLine(System.Text.Encoding.UTF8.GetString(decoded));  // Hello

// With line breaks for MIME (76-char lines)
byte[] big = System.Text.Encoding.UTF8.GetBytes("The quick brown fox");
string mime = Convert.ToBase64String(big, Base64FormattingOptions.InsertLineBreaks);
Console.WriteLine(mime);

// URL-safe Base64 (replace + / with - _)
string urlSafe = encoded.Replace('+', '-').Replace('/', '_').TrimEnd('=');
Console.WriteLine(urlSafe);  // SGVsbG8`,
    explanation: "`Convert.ToBase64String` encodes arbitrary binary data as ASCII text — essential for embedding binary in JSON/XML, HTTP Basic auth, and email attachments. URL-safe Base64 replaces `+`/`/` to avoid percent-encoding in query strings.",
  },
  {
    id: "cs-b16-b1-multicast-delegate",
    language: "csharp",
    title: "Multicast delegate invocation order",
    tag: "understanding",
    code: `Action<string> handler = null!;

handler += msg => Console.WriteLine(\`Handler A: \${msg}\`);
handler += msg => Console.WriteLine(\`Handler B: \${msg}\`);
handler += msg => Console.WriteLine(\`Handler C: \${msg}\`);

handler("event!");
// Handler A: event!
// Handler B: event!
// Handler C: event!   — invoked in subscription order

// Remove a specific handler
Action<string> b = msg => Console.WriteLine(\`Handler B: \${msg}\`);
// Note: lambda equality by reference — use a named method or stored reference
// to remove correctly:
Action<string> storedB = msg => Console.WriteLine(\`Stored B: \${msg}\`);
handler += storedB;
handler -= storedB;   // removes last matching delegate from the chain`,
    explanation: "C# delegates are multicast — `+=` appends a method to the invocation list, `-=` removes it, and calling the delegate invokes all subscribers in subscription order. To remove a handler, you must hold a reference to the exact same delegate instance.",
  },
  {
    id: "cs-b16-b1-ilookup-tolookup",
    language: "csharp",
    title: "ILookup<K,V> via ToLookup for one-to-many maps",
    tag: "structures",
    code: `var orders = new[]
{
    (Customer: "Alice", Item: "Apple"),
    (Customer: "Bob",   Item: "Banana"),
    (Customer: "Alice", Item: "Cherry"),
    (Customer: "Alice", Item: "Date"),
    (Customer: "Bob",   Item: "Elderberry"),
};

// ToLookup: like GroupBy but eagerly evaluated and supports [key]
ILookup<string, string> byCustomer = orders.ToLookup(o => o.Customer, o => o.Item);

foreach (string item in byCustomer["Alice"])
    Console.WriteLine(item);  // Apple, Cherry, Date

// Missing key returns empty sequence (no KeyNotFoundException)
foreach (string item in byCustomer["Dave"])
    Console.WriteLine(item);  // nothing — no exception

Console.WriteLine(byCustomer.Count);  // 2 (distinct keys)`,
    explanation: "`ToLookup` is like `GroupBy` but returns an `ILookup<K,V>` that's immediately materialized and supports O(1) key lookup — accessing a missing key returns an empty sequence rather than throwing, which simplifies code that aggregates optional groups.",
  },
  {
    id: "cs-b16-b1-nullable-ref-vs-value",
    language: "csharp",
    title: "Nullable reference type vs nullable value type",
    tag: "caveats",
    code: `#nullable enable

// Nullable VALUE type: Nullable<T> — stored inline, has HasValue/Value
int? nullableInt = null;
Console.WriteLine(nullableInt.HasValue);        // False
Console.WriteLine(nullableInt.GetValueOrDefault(0));  // 0

// Nullable REFERENCE type: compiler annotation only (not a different type)
string? nullableString = null;
// string? is still System.String — no HasValue, same runtime type

// Both can be null at runtime, but for different reasons
Console.WriteLine(nullableInt is null);    // True  (HasValue == false)
Console.WriteLine(nullableString is null); // True

// Nullable ref type warnings (compile-time only):
// string s = null;           // CS8600: converting null to non-nullable
// int len = nullableString.Length;  // CS8602: dereference of possibly null

int len = nullableString?.Length ?? 0;  // safe
Console.WriteLine(len);   // 0`,
    explanation: "`int?` is a true runtime type (`Nullable<int>`) with value semantics and `HasValue`; `string?` is a compiler annotation that adds null-safety warnings but has the exact same runtime type as `string` — there's no performance difference and no boxing.",
  },
  {
    id: "cs-b16-b1-linq-any-all",
    language: "csharp",
    title: "LINQ Any and All with short-circuiting",
    tag: "snippet",
    code: `int[] nums = [2, 4, 6, 8, 10];

// Any: returns true if at least one element satisfies predicate
Console.WriteLine(nums.Any(n => n > 9));   // True  (stops at 10)
Console.WriteLine(nums.Any(n => n > 99));  // False (exhausts all)
Console.WriteLine(nums.Any());             // True  (non-empty check)

// All: returns true if ALL elements satisfy predicate
Console.WriteLine(nums.All(n => n % 2 == 0));  // True  (all even)
Console.WriteLine(nums.All(n => n > 5));        // False (stops at 2)

// Practical: validate a list of rules
var rules = new Func<string, bool>[]
{
    s => s.Length >= 8,
    s => s.Any(char.IsUpper),
    s => s.Any(char.IsDigit),
};
string password = "Secret42";
bool valid = rules.All(rule => rule(password));
Console.WriteLine(valid);  // True`,
    explanation: "`Any` short-circuits on the first `true` (like `||`) and `All` short-circuits on the first `false` (like `&&`) — using generator-like lazy sequences as the source means expensive elements after the short-circuit point are never computed.",
  },
  {
    id: "cs-b16-b1-ref-vs-out",
    language: "csharp",
    title: "ref vs out semantic difference",
    tag: "caveats",
    code: `// ref: caller must initialize; callee may read AND write
static void Increment(ref int value)
{
    value++;   // reads existing value then writes
}

// out: caller need not initialize; callee MUST write before returning
static bool TryParse(string s, out int result)
{
    if (int.TryParse(s, out int n)) { result = n; return true; }
    result = 0;   // must assign before returning
    return false;
}

int x = 10;
Increment(ref x);
Console.WriteLine(x);   // 11 — x modified through ref

// out: don't need to pre-initialize
if (TryParse("42", out int parsed))
    Console.WriteLine(parsed);   // 42

// Discard with _
bool ok = TryParse("abc", out _);
Console.WriteLine(ok);   // False`,
    explanation: "`ref` requires the caller to initialize the variable first (the callee may or may not write to it); `out` requires the callee to write before returning (the caller's pre-initialization is irrelevant). `out` is the idiom for methods that produce a value alongside a return code.",
  },
  {
    id: "cs-b16-b1-dictionary-trygetvalue",
    language: "csharp",
    title: "Dictionary.TryGetValue for safe lookup",
    tag: "snippet",
    code: `var capitals = new Dictionary<string, string>
{
    ["France"]  = "Paris",
    ["Germany"] = "Berlin",
    ["Japan"]   = "Tokyo",
};

// TryGetValue: single lookup, no exception on missing key
if (capitals.TryGetValue("France", out string? capital))
    Console.WriteLine(\`Capital: \${capital}\`);   // Capital: Paris

if (!capitals.TryGetValue("Canada", out string? notFound))
    Console.WriteLine("Not found");              // Not found

// Compare: ContainsKey then [] is TWO lookups (race-prone in ConcurrentDictionary)
// if (capitals.ContainsKey("France"))            // lookup 1
//     Console.WriteLine(capitals["France"]);    // lookup 2  -- avoid

// GetValueOrDefault (C# 7.4+)
string city = capitals.GetValueOrDefault("India", "Unknown");
Console.WriteLine(city);   // Unknown`,
    explanation: "`TryGetValue` performs a single hash lookup and returns `false` instead of throwing `KeyNotFoundException` — it's preferred over `ContainsKey + []` which does two lookups and can race in concurrent scenarios.",
  },
  {
    id: "cs-b16-b1-covariant-contravariant",
    language: "csharp",
    title: "Covariant out / contravariant in generics",
    tag: "types",
    code: `// out T (covariant): T only appears in output positions
// Allows IProducer<Dog> to be used as IProducer<Animal>
interface IProducer<out T>
{
    T Produce();
}

// in T (contravariant): T only appears in input positions
// Allows IConsumer<Animal> to be used as IConsumer<Dog>
interface IConsumer<in T>
{
    void Consume(T item);
}

class Animal { public string Name { get; init; } = ""; }
class Dog : Animal { }

class DogFactory : IProducer<Dog>
{
    public Dog Produce() => new Dog { Name = "Rex" };
}

IProducer<Animal> factory = new DogFactory();  // covariance
Animal a = factory.Produce();
Console.WriteLine(a.Name);  // Rex`,
    explanation: "Covariance (`out T`) allows a derived generic type to substitute a base generic type when `T` is only produced (returned). Contravariance (`in T`) allows the reverse when `T` is only consumed (accepted as a parameter). Attempting both makes the interface invariant.",
  },
  {
    id: "cs-b16-b1-immutablelist-builder",
    language: "csharp",
    title: "ImmutableList<T> builder pattern",
    tag: "structures",
    code: `using System.Collections.Immutable;

// Direct creation — each Add creates a new list (slow for bulk)
ImmutableList<int> list = ImmutableList<int>.Empty;
list = list.Add(1);
list = list.Add(2);
Console.WriteLine(list.Count);  // 2

// Builder pattern — mutate in bulk, then seal
var builder = ImmutableList.CreateBuilder<int>();
for (int i = 0; i < 5; i++)
    builder.Add(i * i);

ImmutableList<int> squares = builder.ToImmutable();
Console.WriteLine(string.Join(", ", squares));   // 0, 1, 4, 9, 16

// ImmutableList is safe to share across threads — no mutation possible
ImmutableList<int> modified = squares.Add(25);  // new list
Console.WriteLine(squares.Count);   // 5 — original unchanged`,
    explanation: "`ImmutableList<T>` uses a persistent balanced tree — operations return new lists sharing structure with the original (structural sharing), but bulk construction via `CreateBuilder` is more efficient since it builds the tree once.",
  },
  {
    id: "cs-b16-b1-params-null",
    language: "csharp",
    title: "Passing null to a params array",
    tag: "caveats",
    code: `static void PrintAll(params string[] items)
{
    if (items == null)
    {
        Console.WriteLine("items is null!");
        return;
    }
    foreach (var item in items)
        Console.WriteLine(item);
}

// Normal usage
PrintAll("a", "b", "c");    // a, b, c

// Empty call — items is empty array, not null
PrintAll();                  // nothing printed

// Explicit null — passes null for the array itself!
PrintAll(null!);             // items is null!

// Explicit empty array
PrintAll([]);               // nothing printed`,
    explanation: "Passing `null` directly to a `params` parameter sets the array itself to null — unlike calling with no arguments which passes an empty array. Methods accepting `params` must null-check if callers may explicitly pass null.",
  },
  {
    id: "cs-b16-b1-valuetuple-vs-tuple",
    language: "csharp",
    title: "ValueTuple vs Tuple: stack vs heap allocation",
    tag: "structures",
    code: `// Tuple<T1,T2>: reference type — heap allocated
Tuple<int, string> refTuple = Tuple.Create(42, "hello");
Console.WriteLine(refTuple.Item1);   // 42
Console.WriteLine(refTuple.Item2);   // hello

// ValueTuple<T1,T2>: struct — stack allocated, zero heap cost
(int age, string name) valTuple = (42, "hello");
Console.WriteLine(valTuple.age);     // 42 — named access
Console.WriteLine(valTuple.name);    // hello

// Named elements are compile-time only (field names are TupleElementNames attribute)
var t = (x: 1, y: 2);
Console.WriteLine(t.x + t.y);   // 3

// ValueTuple supports deconstruction natively
var (a, b) = valTuple;
Console.WriteLine(\`\${a} \${b}\`);  // 42 hello`,
    explanation: "`ValueTuple` (and the `(T1, T2)` syntax) is a value type stored on the stack — returning multiple values from a method creates no heap allocation. `Tuple<T>` is a class (heap allocated) and should generally be avoided in new code.",
  },
  {
    id: "cs-b16-b1-linked-list",
    language: "csharp",
    title: "LinkedList<T>: O(1) insert at known node",
    tag: "structures",
    code: `var list = new LinkedList<string>();

LinkedListNode<string> b = list.AddFirst("B");
LinkedListNode<string> a = list.AddBefore(b, "A");
LinkedListNode<string> c = list.AddAfter(b, "C");

Console.WriteLine(string.Join(" -> ", list));  // A -> B -> C

// O(1) insert at a known node — no shifting like List<T>
list.AddAfter(b, "B2");
Console.WriteLine(string.Join(" -> ", list));  // A -> B -> B2 -> C

// Remove by node — O(1)
list.Remove(b);
Console.WriteLine(string.Join(" -> ", list));  // A -> B2 -> C

// First/Last are O(1)
Console.WriteLine(list.First!.Value);   // A
Console.WriteLine(list.Last!.Value);    // C`,
    explanation: "`LinkedList<T>` offers O(1) insertion and removal at a known `LinkedListNode<T>` — unlike `List<T>` which must shift elements. The trade-off is O(n) random access and much worse cache locality than arrays.",
  },
  {
    id: "cs-b16-b1-queue-vs-stack",
    language: "csharp",
    title: "Queue<T> FIFO vs Stack<T> LIFO",
    tag: "structures",
    code: `// Queue<T>: FIFO — first in, first out
var queue = new Queue<string>();
queue.Enqueue("first");
queue.Enqueue("second");
queue.Enqueue("third");

Console.WriteLine(queue.Dequeue());  // first
Console.WriteLine(queue.Peek());     // second (not removed)
Console.WriteLine(queue.Count);     // 2

// Stack<T>: LIFO — last in, first out
var stack = new Stack<string>();
stack.Push("first");
stack.Push("second");
stack.Push("third");

Console.WriteLine(stack.Pop());     // third
Console.WriteLine(stack.Peek());    // second (not removed)
Console.WriteLine(stack.Count);    // 2`,
    explanation: "`Queue<T>` (backed by a circular array) is for task scheduling and breadth-first search; `Stack<T>` is for undo history and depth-first search. Both offer O(1) amortized push/pop with much better cache performance than `LinkedList<T>`.",
  },
  {
    id: "cs-b16-b1-environ-getvar",
    language: "csharp",
    title: "Environment.GetEnvironmentVariable with fallback",
    tag: "snippet",
    code: `// Returns null if variable is not set
string? dbUrl = Environment.GetEnvironmentVariable("DATABASE_URL");
Console.WriteLine(dbUrl ?? "(not set)");

// Pattern: throw if required, fall back if optional
static string RequiredEnv(string name)
    => Environment.GetEnvironmentVariable(name)
       ?? throw new InvalidOperationException(\`Environment variable '\${name}' is required\`);

static int OptionalEnvInt(string name, int defaultValue)
{
    string? raw = Environment.GetEnvironmentVariable(name);
    return int.TryParse(raw, out int val) ? val : defaultValue;
}

int port    = OptionalEnvInt("PORT", 8080);
bool isDev  = (Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Production")
                  .Equals("Development", StringComparison.OrdinalIgnoreCase);

Console.WriteLine(\`port=\${port} dev=\${isDev}\`);`,
    explanation: "`Environment.GetEnvironmentVariable` returns `null` when the variable is absent — distinguishing between an absent variable and an empty one is important for configuration. Wrapping it in a helper that throws or provides defaults encapsulates the policy.",
  },
  {
    id: "cs-b16-b1-bit-array",
    language: "csharp",
    title: "BitArray for compact boolean collections",
    tag: "structures",
    code: `using System.Collections;

int size = 16;
var bits = new BitArray(size, defaultValue: false);

// Set individual bits
bits[0] = true;
bits[3] = true;
bits[7] = true;

// Bitwise operations
var mask = new BitArray(size, false);
mask[3] = true; mask[7] = true; mask[15] = true;

var intersection = (BitArray)bits.Clone();
intersection.And(mask);   // in-place AND

Console.WriteLine(intersection[0]);   // False (bit 0 not in mask)
Console.WriteLine(intersection[3]);   // True  (both had bit 3)
Console.WriteLine(intersection[15]);  // False (bits only had bit 15 in mask)

// Count set bits
int count = 0;
foreach (bool b in bits) if (b) count++;
Console.WriteLine(count);   // 3`,
    explanation: "`BitArray` packs 8 booleans per byte — 32x more compact than `bool[]` (which uses 1 byte per element). It supports bitwise AND, OR, XOR, and NOT in-place, making it efficient for permission flags, Bloom filters, and sieve algorithms.",
  },
  {
    id: "cs-b16-b1-string-concat-loop",
    language: "csharp",
    title: "String concat in a loop is O(n²)",
    tag: "caveats",
    code: `// SLOW: creates a new string object on every iteration
string slow = "";
for (int i = 0; i < 1000; i++)
    slow += i + ", ";   // 1000 allocations, O(n²) total

// FAST: StringBuilder mutates a single buffer
var sb = new System.Text.StringBuilder();
for (int i = 0; i < 1000; i++)
    sb.Append(i).Append(", ");
string fast = sb.ToString();

// FAST for static joins: string.Join or string.Concat
string joined  = string.Join(", ", Enumerable.Range(0, 1000));
string concatd = string.Concat(Enumerable.Range(0, 10).Select(i => i.ToString()));

Console.WriteLine(joined[..20]);   // 0, 1, 2, 3, 4, 5, 6,
Console.WriteLine(concatd);        // 0123456789`,
    explanation: "Each `+=` on a string allocates a new string object containing a copy of both parts — in a loop of n iterations that's O(n²) total characters copied. Use `StringBuilder` for iterative construction or `string.Join`/`string.Concat` for static aggregation.",
  },
  {
    id: "cs-b16-b1-array-sort-comparison",
    language: "csharp",
    title: "Array.Sort with Comparison<T> delegate",
    tag: "snippet",
    code: `string[] words = ["banana", "Apple", "cherry", "Date", "fig"];

// Default: ordinal sort (uppercase before lowercase)
Array.Sort(words);
Console.WriteLine(string.Join(", ", words));
// Apple, Date, banana, cherry, fig

// Custom: case-insensitive
Array.Sort(words, (a, b) => string.Compare(a, b, StringComparison.OrdinalIgnoreCase));
Console.WriteLine(string.Join(", ", words));
// Apple, banana, cherry, Date, fig

// Sort by multiple criteria: length then alphabetic
string[] tags = ["go", "c#", "rust", "python", "java", "c"];
Array.Sort(tags, (a, b) =>
{
    int cmp = a.Length.CompareTo(b.Length);
    return cmp != 0 ? cmp : string.Compare(a, b, StringComparison.Ordinal);
});
Console.WriteLine(string.Join(", ", tags));  // c, go, c#, java, rust, python`,
    explanation: "`Array.Sort(array, comparison)` accepts a `Comparison<T>` delegate (equivalent to `Func<T,T,int>`) for custom ordering without creating a separate `IComparer<T>` class — negative return means first comes before second.",
  },
  {
    id: "cs-b16-b1-math-clamp",
    language: "csharp",
    title: "Math.Clamp for bounded values",
    tag: "snippet",
    code: `// Math.Clamp(value, min, max): returns value constrained to [min, max]
int score = 150;
int clamped = Math.Clamp(score, 0, 100);
Console.WriteLine(clamped);   // 100

double temperature = -5.0;
double safe = Math.Clamp(temperature, 0.0, 100.0);
Console.WriteLine(safe);   // 0

// Works with any IComparable<T> (int, double, float, etc.)
byte volume = 255;
byte adjusted = Math.Clamp((byte)(volume + 10), (byte)0, (byte)255);
Console.WriteLine(adjusted);  // 255 — no overflow

// Practical: normalize sensor reading to 0-1
double raw = 1.75;
double normalized = Math.Clamp(raw, 0.0, 1.0);
Console.WriteLine(normalized);  // 1.0`,
    explanation: "`Math.Clamp` constrains a value within [min, max] in one call — it's clearer than `Math.Max(min, Math.Min(max, value))` and avoids off-by-one errors from manually implemented clamp logic.",
  },
  {
    id: "cs-b16-b1-enum-out-of-range",
    language: "csharp",
    title: "Enum out-of-range cast is silent",
    tag: "caveats",
    code: `enum Color { Red = 0, Green = 1, Blue = 2 }

// Casting an int to an enum never throws — even for invalid values!
Color c = (Color)99;
Console.WriteLine(c);             // 99  — no exception
Console.WriteLine(c == Color.Red);  // False
Console.WriteLine((int)c);        // 99

// Validate with Enum.IsDefined
bool valid = Enum.IsDefined(typeof(Color), 99);
Console.WriteLine(valid);   // False

// Safe parse from string
if (Enum.TryParse<Color>("Green", out Color parsed))
    Console.WriteLine(parsed);   // Green

// Flags: any combination of bits is "valid"
[System.Flags] enum Opts { None = 0, A = 1, B = 2, C = 4 }
Opts combo = (Opts)7;   // A | B | C — valid
Opts bad   = (Opts)8;   // not defined, but no exception`,
    explanation: "C# allows casting any integer to an enum without runtime validation — the value is stored as-is even if it doesn't correspond to any named member. Always use `Enum.IsDefined` or `Enum.TryParse` when accepting enum values from untrusted sources.",
  },
  {
    id: "cs-b16-b1-default-t-zero",
    language: "csharp",
    title: "default(T) zero-initializes value types",
    tag: "caveats",
    code: `// default(T) returns the zero value for any type
Console.WriteLine(default(int));      // 0
Console.WriteLine(default(bool));     // False
Console.WriteLine(default(double));   // 0
Console.WriteLine(default(char));     // NUL character ('\0')
Console.WriteLine(default(string));   // (null)
Console.WriteLine(default(int?));     // (null — HasValue = false)

struct Point { public int X, Y; }
Point p = default;
Console.WriteLine(p.X + "," + p.Y);  // 0,0

// Generic methods often need the zero value
T ZeroOrValue<T>(bool useDefault, T value)
    => useDefault ? default! : value;

Console.WriteLine(ZeroOrValue(true, 42));   // 0 (default int)
Console.WriteLine(ZeroOrValue(false, 42));  // 42`,
    explanation: "`default(T)` returns `null` for reference types, `false` for `bool`, `0` for numeric types, and recursively zero-initializes struct fields — in generic code it's the only way to obtain a type-appropriate zero value without constraints.",
  },
  {
    id: "cs-b16-b1-string-interpolation-format",
    language: "csharp",
    title: "String interpolation formatting",
    tag: "snippet",
    code: `double price   = 1234567.89;
DateTime today = new DateTime(2026, 5, 16);
double pi      = Math.PI;

// Number formatting
Console.WriteLine(\`\${price:C}\`);          // $1,234,567.89  (currency)
Console.WriteLine(\`\${price:N2}\`);         // 1,234,567.89   (number, 2 dp)
Console.WriteLine(\`\${price:E3}\`);         // 1.235E+006     (scientific)
Console.WriteLine(\`\${pi:F4}\`);            // 3.1416         (fixed 4 dp)
Console.WriteLine(\`\${255:X8}\`);           // 000000FF       (hex, padded)

// Date formatting
Console.WriteLine(\`\${today:yyyy-MM-dd}\`);  // 2026-05-16
Console.WriteLine(\`\${today:ddd dd MMM yyyy}\`);  // Sat 16 May 2026

// Padding and alignment
string name = "Bob";
Console.WriteLine(\`\${name,10}\`);   // "       Bob"  (right-aligned width 10)
Console.WriteLine(\`\${name,-10}|\`); // "Bob       |" (left-aligned)`,
    explanation: "String interpolation uses the same format specifiers as `string.Format` — numeric formats (C, N, F, E, X), date formats, and alignment with `,width` before the `:format`. A negative width left-aligns; positive right-aligns.",
  },
  {
    id: "cs-b16-b1-null-conditional",
    language: "csharp",
    title: "?. null-conditional chain",
    tag: "snippet",
    code: `class Address { public string? City { get; set; } }
class Person  { public string Name { get; set; } = ""; public Address? Address { get; set; } }
class Company { public Person? Ceo { get; set; } }

var company = new Company
{
    Ceo = new Person { Name = "Alice", Address = new Address { City = "Berlin" } }
};

// Without ?. — verbose null checks
string? city1 = null;
if (company?.Ceo != null && company.Ceo.Address != null)
    city1 = company.Ceo.Address.City;

// With ?. — short-circuits to null on first null
string? city2 = company?.Ceo?.Address?.City;
Console.WriteLine(city2);   // Berlin

// Works with indexers and methods
var emptyCompany = new Company();
int? nameLen = emptyCompany?.Ceo?.Name?.Length;
Console.WriteLine(nameLen);   // (null — no exception)`,
    explanation: "The null-conditional operator `?.` short-circuits the entire chain to `null` if any part is null — it replaces nested null-guard `if` statements and is especially readable when navigating deep object graphs.",
  },
  {
    id: "cs-b16-b1-checked-unchecked",
    language: "csharp",
    title: "checked vs unchecked overflow",
    tag: "understanding",
    code: `byte b = 255;

// unchecked (default): wraps around silently
byte wrapped = unchecked((byte)(b + 1));
Console.WriteLine(wrapped);   // 0 — wrapped!

// checked: throws OverflowException
try
{
    byte overflow = checked((byte)(b + 1));
}
catch (OverflowException e)
{
    Console.WriteLine(\`OverflowException: \${e.Message}\`);
}

// Project-wide checked context via csproj:
// <CheckForOverflowUnderflow>true</CheckForOverflowUnderflow>

// Intentional wrap-around (hash codes, cyclic counters):
unchecked
{
    int hash = 17;
    hash = hash * 397 + "key".GetHashCode();
    Console.WriteLine(hash);  // some value, overflow intentional
}`,
    explanation: "C# defaults to `unchecked` arithmetic where overflow wraps silently — `checked` adds overflow detection at a small performance cost. You can enable `checked` project-wide in the `.csproj` and selectively opt out with `unchecked {}` blocks for intentional wrap-around code.",
  },
  {
    id: "cs-b16-b1-array-segment",
    language: "csharp",
    title: "ArraySegment<T> as a lightweight window",
    tag: "structures",
    code: `int[] data = [10, 20, 30, 40, 50, 60, 70, 80];

// ArraySegment: a view into a portion of the array
var segment = new ArraySegment<int>(data, offset: 2, count: 4);

Console.WriteLine(segment.Count);    // 4
Console.WriteLine(segment[0]);       // 30  (maps to data[2])
Console.WriteLine(segment[3]);       // 60  (maps to data[5])

// Iterate the segment
foreach (int n in segment)
    Console.Write(n + " ");   // 30 40 50 60
Console.WriteLine();

// Mutations affect the original array
segment[0] = 99;
Console.WriteLine(data[2]);   // 99 — original changed

// Slice of a segment
ArraySegment<int> sub = segment.Slice(1, 2);
Console.WriteLine(string.Join(", ", sub));  // 40, 50`,
    explanation: "`ArraySegment<T>` is a struct that holds a reference to an existing array plus offset and count — it allows passing a window of an array without copying. For async code or stack-allocation, `Memory<T>` is the modern successor.",
  },
  {
    id: "cs-b16-b1-record-struct",
    language: "csharp",
    title: "record struct: value semantics + record features",
    tag: "types",
    code: `// record struct: value equality + with-expression + Deconstruct — on the stack
record struct Point(double X, double Y)
{
    public double Length => Math.Sqrt(X * X + Y * Y);
}

var p1 = new Point(3, 4);
var p2 = new Point(3, 4);

// Value equality — structs normally use field-by-field comparison
Console.WriteLine(p1 == p2);      // True

// with-expression (was only available for records before)
var p3 = p1 with { Y = 0 };
Console.WriteLine(p3);            // Point { X = 3, Y = 0 }

// Deconstruction
var (x, y) = p1;
Console.WriteLine(\`\${x}, \${y}\`);  // 3, 4

// Stack-allocated — no heap allocation when local
Console.WriteLine(p1.Length);     // 5`,
    explanation: "`record struct` (C# 10) combines the value semantics of a struct (stack allocation, copy-on-assign) with the record conveniences of compiler-generated equality, `ToString`, `Deconstruct`, and `with` expressions — ideal for small immutable coordinate/vector types.",
  },
  {
    id: "cs-b16-b1-span-vs-memory",
    language: "csharp",
    title: "Span<T> vs Memory<T> for async use",
    tag: "structures",
    code: `// Span<T>: ref struct — can only live on the stack
// Cannot be used in async methods or stored in fields
Span<byte> stackSpan = stackalloc byte[16];
stackSpan[0] = 42;
Console.WriteLine(stackSpan[0]);   // 42

// Memory<T>: can cross async boundaries and be stored in fields
Memory<byte> heapMemory = new byte[16];
heapMemory.Span[0] = 42;          // access via .Span property

// Async-compatible: Span<T> would be a compile error here
async Task ProcessAsync(Memory<byte> mem)
{
    await Task.Delay(1);           // Span couldn't survive this await
    Console.WriteLine(mem.Span[0]);  // 42
}

byte[] arr = [1, 2, 3, 4, 5, 6, 7, 8];
await ProcessAsync(arr.AsMemory(2, 4));   // slice [3,4,5,6]`,
    explanation: "`Span<T>` is a ref struct that cannot outlive the stack frame or cross `await` points — `Memory<T>` is the heap-friendly alternative that wraps the same contiguous memory but can be stored in fields and used in async methods.",
  },
  {
    id: "cs-b16-b1-event-null-check",
    language: "csharp",
    title: "Event null check before invoke",
    tag: "caveats",
    code: `class Button
{
    // Event is null until at least one subscriber adds a handler
    public event EventHandler? Clicked;

    public void SimulateClick()
    {
        // WRONG: race condition — Clicked could become null between check and invoke
        // if (Clicked != null) Clicked(this, EventArgs.Empty);

        // CORRECT: copy reference first (thread-safe)
        Clicked?.Invoke(this, EventArgs.Empty);
        // ?. atomically reads and invokes — if null, does nothing
    }
}

var btn = new Button();

// No subscribers — Clicked is null
btn.SimulateClick();  // no exception with ?.

btn.Clicked += (s, e) => Console.WriteLine("Clicked!");
btn.SimulateClick();  // Clicked!`,
    explanation: "Events are multicast delegates that start as `null` — invoking a null delegate throws `NullReferenceException`. The `?.Invoke()` pattern is the thread-safe idiom: it reads the delegate reference once and short-circuits if null, avoiding the race between a null check and the invocation.",
  },
  {
    id: "cs-b16-b1-generic-covariant-out",
    language: "csharp",
    title: "out generic type parameter in practice",
    tag: "types",
    code: `// IEnumerable<out T> is covariant — built into .NET
IEnumerable<string> strings = ["hello", "world"];

// Widening assignment: IEnumerable<string> -> IEnumerable<object>
IEnumerable<object> objects = strings;  // no cast needed!
Console.WriteLine(objects.First().GetType().Name);  // String

// Build your own covariant interface
interface IReader<out T>
{
    T Read();
}

class StringReader : IReader<string>
{
    public string Read() => "data";
}

IReader<object> reader = new StringReader();  // covariance
Console.WriteLine(reader.Read());  // data

// If T appeared in a parameter (input position), it would be invariant
// interface IReadWrite<T> { T Read(); void Write(T v); }  — invariant`,
    explanation: "A type parameter marked `out` can only appear in output (return) positions — this allows the compiler to prove that widening assignments are safe, because you're only reading `T` values (never writing), so a `string` can always be used where an `object` is expected.",
  },
  {
    id: "cs-b16-b1-linq-firstordefault",
    language: "csharp",
    title: "FirstOrDefault with predicate and default",
    tag: "snippet",
    code: `var products = new[]
{
    new { Name = "Apple",  Price = 1.50 },
    new { Name = "Banana", Price = 0.75 },
    new { Name = "Cherry", Price = 4.00 },
};

// FirstOrDefault returns null (or default) if no match — no exception
var cheap = products.FirstOrDefault(p => p.Price < 1.00);
Console.WriteLine(cheap?.Name ?? "none");  // Banana

var expensive = products.FirstOrDefault(p => p.Price > 10.00);
Console.WriteLine(expensive?.Name ?? "none");  // none

// With explicit default (C# 10+) — avoids null propagation
var fallback = products.FirstOrDefault(
    p => p.Price > 10.00,
    defaultValue: new { Name = "Unknown", Price = 0.0 }
);
Console.WriteLine(fallback.Name);   // Unknown`,
    explanation: "`FirstOrDefault` returns the first matching element or a default value (null for reference types, zero for value types) — the two-argument overload added in .NET 6 lets you specify a meaningful sentinel instead of null.",
  },
  {
    id: "cs-b16-b1-argument-exception-hierarchy",
    language: "csharp",
    title: "ArgumentException hierarchy",
    tag: "families",
    code: `void Process(string? name, int age, IEnumerable<int> items)
{
    // ArgumentNullException: parameter is null when it shouldn't be
    ArgumentNullException.ThrowIfNull(name);

    // ArgumentException: parameter has an invalid value
    if (name.Length == 0)
        throw new ArgumentException("Name cannot be empty.", nameof(name));

    // ArgumentOutOfRangeException: numeric value is out of acceptable range
    ArgumentOutOfRangeException.ThrowIfNegative(age);
    ArgumentOutOfRangeException.ThrowIfGreaterThan(age, 150);

    // All three inherit from ArgumentException
    // catch (ArgumentException) catches all three
    Console.WriteLine(\`Processing \${name}, age \${age}\`);
}

try { Process(null, 25, []); }
catch (ArgumentNullException e) { Console.WriteLine(e.ParamName); }  // name

try { Process("Alice", -1, []); }
catch (ArgumentOutOfRangeException e) { Console.WriteLine(e.Message); }`,
    explanation: "`ArgumentNullException` and `ArgumentOutOfRangeException` are specialized subclasses of `ArgumentException` — .NET 6+ added static `ThrowIf*` helpers that eliminate the null check + throw boilerplate and make the `ParamName` always accurate via `[CallerArgumentExpression]`.",
  },
  {
    id: "cs-b16-b1-string-vs-span-char",
    language: "csharp",
    title: "string vs Span<char> for zero-copy parsing",
    tag: "families",
    code: `string csv = "Alice,30,Berlin";

// Traditional: Split allocates new strings for each token
string[] parts = csv.Split(',');
Console.WriteLine(parts[0]);   // Alice

// Zero-allocation: parse directly from a Span<char>
ReadOnlySpan<char> span = csv.AsSpan();
int comma1 = span.IndexOf(',');
ReadOnlySpan<char> name = span[..comma1];

int comma2 = span[(comma1 + 1)..].IndexOf(',') + comma1 + 1;
ReadOnlySpan<char> ageSpan = span[(comma1 + 1)..comma2];
int age = int.Parse(ageSpan);

Console.WriteLine(name.ToString());  // Alice (ToString allocates once)
Console.WriteLine(age);              // 30`,
    explanation: "String slicing with `AsSpan()` and `ReadOnlySpan<char>` avoids allocating new `string` objects for every token — parsers in hot paths (CSV readers, HTTP header parsing) use this technique to reduce GC pressure significantly.",
  },
  {
    id: "cs-b16-b1-disposable-using-var",
    language: "csharp",
    title: "using var for scoped disposal (C# 8)",
    tag: "snippet",
    code: `// Classic using: braces define the scope
using (var stream = new System.IO.MemoryStream())
{
    stream.WriteByte(42);
    Console.WriteLine(stream.Length);  // 1
}   // Dispose() called here

// Modern using declaration (C# 8+): scope = end of enclosing block
static void WriteAndRead()
{
    using var ms    = new System.IO.MemoryStream();
    using var writer = new System.IO.StreamWriter(ms);

    writer.Write("hello");
    writer.Flush();

    ms.Position = 0;
    using var reader = new System.IO.StreamReader(ms);
    Console.WriteLine(reader.ReadToEnd());  // hello
}   // writer, reader, ms all Disposed in reverse order here

WriteAndRead();`,
    explanation: "`using var` (C# 8) eliminates brace nesting — the resource is disposed at the end of the enclosing block in reverse declaration order. This is purely syntactic sugar over the classic `using (...)` statement.",
  },
  {
    id: "cs-b16-b1-static-local-function",
    language: "csharp",
    title: "Static local function prevents accidental capture",
    tag: "classes",
    code: `int multiplier = 3;

// Regular local function: can accidentally capture outer variables
int ScaleRegular(int x) => x * multiplier;   // captures 'multiplier'

// Static local function: cannot capture — must pass everything explicitly
static int ScaleStatic(int x, int m) => x * m;  // no capture allowed

Console.WriteLine(ScaleRegular(5));           // 15
Console.WriteLine(ScaleStatic(5, multiplier)); // 15

// Practical: avoid closure allocation in tight loops
int[] data = [1, 2, 3, 4, 5];
int sum = 0;
foreach (int n in data)
{
    sum += Transform(n);

    static int Transform(int x) => x * x + 1;  // no allocation
}
Console.WriteLine(sum);   // 1+4+9+16+26 = 55 + 5 = 60... (1+1)+(4+1)+(9+1)+(16+1)+(25+1) = 60`,
    explanation: "Adding `static` to a local function prevents it from capturing any variables from the enclosing scope — the compiler enforces this, eliminating accidental closures that would allocate a display class object on every call.",
  },
  {
    id: "cs-b16-b1-pattern-list-pattern",
    language: "csharp",
    title: "List pattern matching (C# 11)",
    tag: "snippet",
    code: `int[] Classify(int[] arr) => arr switch
{
    []              => throw new ArgumentException("empty"),
    [var single]    => [single * 2],          // exactly one element
    [var first, ..] => [first, ..arr[1..]],   // two or more (spread)
    _               => arr,
};

// List patterns in if/switch
void Describe(int[] nums)
{
    if (nums is [1, 2, 3])
        Console.WriteLine("exactly [1,2,3]");
    else if (nums is [1, ..])
        Console.WriteLine("starts with 1");
    else if (nums is [.., 0])
        Console.WriteLine("ends with 0");
    else
        Console.WriteLine("other");
}

Describe([1, 2, 3]);      // exactly [1,2,3]
Describe([1, 99, 100]);   // starts with 1
Describe([5, 3, 0]);      // ends with 0`,
    explanation: "List patterns (C# 11) match against the shape and content of arrays or spans directly in `is` expressions and `switch` cases — `..` is a discard-slice that matches zero or more elements, enabling head/tail destructuring like Haskell or Python.",
  },
  {
    id: "cs-b16-b1-ireadonlylist-contract",
    language: "csharp",
    title: "IReadOnlyList<T> as a safe API contract",
    tag: "structures",
    code: `class ProductCatalog
{
    private readonly List<string> _items = ["Apple", "Banana", "Cherry"];

    // Expose as read-only — callers cannot Add/Remove
    public IReadOnlyList<string> Items => _items;

    public void AddItem(string item) => _items.Add(item);
}

var catalog = new ProductCatalog();
IReadOnlyList<string> items = catalog.Items;

Console.WriteLine(items.Count);    // 3
Console.WriteLine(items[0]);       // Apple

// Attempting mutation fails at compile time:
// items.Add("Date");              // CS1061: no 'Add' method
// items[0] = "Mango";            // CS0200: read-only indexer

// Caller can cast — you can't stop a determined caller, but the intent is clear
catalog.AddItem("Date");
Console.WriteLine(items.Count);    // 4 — same underlying list`,
    explanation: "`IReadOnlyList<T>` exposes `Count` and indexed access but hides mutation methods — returning it from a property communicates 'read this, don't modify it' to callers and prevents accidental mutation without the overhead of copying.",
  },
  {
    id: "cs-b16-b1-object-base-type",
    language: "csharp",
    title: "object as the universal base type",
    tag: "types",
    code: `// Every type in C# implicitly inherits from object (System.Object)
Console.WriteLine(typeof(int).BaseType);      // System.ValueType
Console.WriteLine(typeof(int).BaseType!.BaseType);  // System.Object

// object members available on everything
int n = 42;
Console.WriteLine(n.GetType().Name);   // Int32
Console.WriteLine(n.GetHashCode());    // some int
Console.WriteLine(n.Equals(42));       // True
Console.WriteLine(n.ToString());       // 42

// object can hold any value (with boxing for value types)
object[] mixed = [1, "hello", 3.14, true, new int[] { 1, 2 }];
foreach (object item in mixed)
    Console.WriteLine(\`\${item.GetType().Name}: \${item}\`);`,
    explanation: "All C# types inherit from `System.Object` — value types inherit through `System.ValueType`. `object` provides `GetType()`, `ToString()`, `Equals()`, and `GetHashCode()` to everything, and can store any value (boxing value types to the heap).",
  },
  {
    id: "cs-b16-b1-delegate-invocation-list",
    language: "csharp",
    title: "Multicast delegate invocation list inspection",
    tag: "understanding",
    code: `Action handler = () => Console.WriteLine("A");
handler += () => Console.WriteLine("B");
handler += () => Console.WriteLine("C");

// Inspect the invocation list
Delegate[] list = handler.GetInvocationList();
Console.WriteLine(list.Length);   // 3

// Invoke in controlled order or conditionally
foreach (Action a in list.Cast<Action>())
{
    try { a(); }
    catch (Exception e) { Console.WriteLine(\`Error: \${e.Message}\`); }
}
// A
// B
// C

// Without iteration, a multicast delegate swallows exceptions
// from intermediate handlers — only the last exception propagates
handler();`,
    explanation: "`GetInvocationList()` returns the ordered array of individual delegates in a multicast delegate — iterating it lets you catch exceptions from each handler independently, whereas invoking the multicast directly only surfaces the last exception thrown.",
  },
  {
    id: "cs-b16-b1-pattern-relational",
    language: "csharp",
    title: "Relational and logical patterns in switch",
    tag: "snippet",
    code: `static string ClassifyBMI(double bmi) => bmi switch
{
    < 18.5                   => "Underweight",
    >= 18.5 and < 25.0       => "Normal weight",
    >= 25.0 and < 30.0       => "Overweight",
    >= 30.0                  => "Obese",
    _                        => "Unknown",  // unreachable but satisfies exhaustiveness
};

Console.WriteLine(ClassifyBMI(17.0));   // Underweight
Console.WriteLine(ClassifyBMI(22.5));   // Normal weight
Console.WriteLine(ClassifyBMI(27.1));   // Overweight
Console.WriteLine(ClassifyBMI(32.4));   // Obese

// 'or' pattern
static bool IsWeekend(DayOfWeek day) => day is DayOfWeek.Saturday or DayOfWeek.Sunday;
Console.WriteLine(IsWeekend(DayOfWeek.Saturday));  // True
Console.WriteLine(IsWeekend(DayOfWeek.Monday));    // False`,
    explanation: "Relational patterns (`< 18.5`), combined with `and`/`or`/`not` logical patterns (C# 9), let you express numeric range checks and enum membership directly in `is` expressions and `switch` arms — far more readable than nested `if/else if` chains.",
  },
  {
    id: "cs-b16-b1-cancellation-token",
    language: "csharp",
    title: "CancellationToken for cooperative cancellation",
    tag: "snippet",
    code: `using var cts = new CancellationTokenSource();
CancellationToken token = cts.Token;

// Cancel after 200ms
cts.CancelAfter(TimeSpan.FromMilliseconds(200));

async Task LongWork(CancellationToken ct)
{
    for (int i = 0; i < 10; i++)
    {
        ct.ThrowIfCancellationRequested();  // cooperative check
        Console.WriteLine(\`Step \${i}\`);
        await Task.Delay(50, ct);           // also honors cancellation
    }
}

try
{
    await LongWork(token);
}
catch (OperationCanceledException)
{
    Console.WriteLine("Cancelled!");  // after ~200ms
}`,
    explanation: "`CancellationToken` enables cooperative cancellation — code periodically calls `ThrowIfCancellationRequested()` or passes the token to awaitable APIs. The token is read-only; the paired `CancellationTokenSource` is what triggers cancellation.",
  },
  {
    id: "cs-b16-b1-nameof-expression",
    language: "csharp",
    title: "nameof for refactoring-safe names",
    tag: "snippet",
    code: `class Order
{
    private int _quantity;

    public int Quantity
    {
        get => _quantity;
        set
        {
            if (value < 0)
                // nameof: resolved at compile time — refactoring renames it too
                throw new ArgumentOutOfRangeException(nameof(value),
                    \`\${nameof(Quantity)} must be non-negative\`);
            _quantity = value;
        }
    }
}

// nameof in logging
static void Process(string input, int count)
{
    Console.WriteLine(\`\${nameof(input)} = '{input}', \${nameof(count)} = \${count}\`);
    // input = 'hello', count = 5
}

Process("hello", 5);

var o = new Order();
try { o.Quantity = -1; }
catch (ArgumentOutOfRangeException e) { Console.WriteLine(e.ParamName); }  // value`,
    explanation: "`nameof(x)` evaluates to the string name of a symbol at compile time — if you rename the variable or property via IDE refactoring, `nameof` updates automatically, preventing stale strings in error messages, logging, and `INotifyPropertyChanged` implementations.",
  },
];
