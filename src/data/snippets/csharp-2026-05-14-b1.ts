import type { Snippet } from "./types";
export const csharpSnippets20260514B1: Snippet[] = [
  {
    id: "cs-null-coalescing-assign",
    language: "csharp",
    title: "??= null-coalescing assignment",
    tag: "snippet",
    code: `string? name = null;
name ??= "Anonymous";    // assign only if name is null
Console.WriteLine(name); // "Anonymous"

string? title = "Dr";
title ??= "Mr";           // already non-null, skipped
Console.WriteLine(title); // "Dr"

// Common use: lazy initialization
List<string>? _cache;
List<string> Cache => _cache ??= new List<string>();`,
    explanation: "`??=` assigns the right-hand value only when the left side is `null`, providing a concise lazy-initialization or defaulting pattern without a full `if` block.",
  },
  {
    id: "cs-understand-boxed-value",
    language: "csharp",
    title: "Boxing and unboxing a value type (trace)",
    tag: "understanding",
    code: `int x = 42;
object obj = x;         // boxing: copies x into a heap object
int y = (int)obj;       // unboxing: copies value back to stack

// Modifying the original doesn't affect the boxed copy
x = 99;
Console.WriteLine((int)obj);  // 42 — unaffected

// Incorrect unbox type throws at runtime
// double d = (double)obj;   // InvalidCastException`,
    explanation: "Boxing copies a value type onto the heap as an `object`; the copy is independent of the original. Unboxing requires an exact type match — casting to a different numeric type throws `InvalidCastException`.",
  },
  {
    id: "cs-stack-vs-queue",
    language: "csharp",
    title: "Stack<T> vs Queue<T>",
    tag: "structures",
    code: `var stack = new Stack<int>();
stack.Push(1); stack.Push(2); stack.Push(3);
Console.WriteLine(stack.Pop());   // 3  LIFO
Console.WriteLine(stack.Peek());  // 2  peek without removing

var queue = new Queue<int>();
queue.Enqueue(1); queue.Enqueue(2); queue.Enqueue(3);
Console.WriteLine(queue.Dequeue()); // 1  FIFO
Console.WriteLine(queue.Peek());    // 2`,
    explanation: "`Stack<T>` is LIFO (last-in, first-out) using `Push`/`Pop`; `Queue<T>` is FIFO (first-in, first-out) using `Enqueue`/`Dequeue`. Both offer `Peek()` to inspect the front/top without removing it.",
  },
  {
    id: "cs-caveat-integer-overflow",
    language: "csharp",
    title: "Integer overflow silently wraps in unchecked context",
    tag: "caveats",
    code: `int max = int.MaxValue;   // 2147483647
int overflow = max + 1;    // -2147483648  — wraps silently!
Console.WriteLine(overflow);

// Use checked to throw instead:
try
{
    int bad = checked(max + 1);
}
catch (OverflowException)
{
    Console.WriteLine("overflow caught");
}`,
    explanation: "C# arithmetic is `unchecked` by default, so integer overflow silently wraps around. Wrap with `checked(...)` or compile with `/checked+` to throw `OverflowException` instead.",
  },
  {
    id: "cs-types-nullable-ref",
    language: "csharp",
    title: "Nullable reference types (#nullable enable)",
    tag: "types",
    code: `#nullable enable

string  nonNull = "hello";    // cannot be null
string? maybeNull = null;     // explicitly nullable

nonNull = null;               // warning: cannot assign null to non-nullable
maybeNull.ToUpper();          // warning: dereference of possibly null

// Safe access patterns
int len = maybeNull?.Length ?? 0;
if (maybeNull is not null)
    Console.WriteLine(maybeNull.ToUpper());  // no warning`,
    explanation: "With `#nullable enable`, the compiler tracks nullability and warns on unsafe dereferences. `string?` is explicitly nullable; plain `string` is guaranteed non-null — catching null bugs at compile time.",
  },
  {
    id: "cs-families-ilist-ienumerable",
    language: "csharp",
    title: "IEnumerable vs ICollection vs IList",
    tag: "families",
    code: `IEnumerable<int> e = new[] { 1, 2, 3 };   // foreach only
ICollection<int> c = new List<int> { 1, 2, 3 };  // + Count, Add, Remove
IList<int> l = new List<int> { 1, 2, 3 };        // + indexer, Insert

// Use the narrowest interface that satisfies callers:
void PrintAll(IEnumerable<int> items)  // accepts List, array, LINQ query, etc.
{
    foreach (var x in items) Console.Write(x + " ");
}`,
    explanation: "The collection interfaces form a hierarchy: `IEnumerable<T>` (iteration only) ⊂ `ICollection<T>` (+ count/modify) ⊂ `IList<T>` (+ random access). Prefer `IEnumerable<T>` in method parameters for maximum flexibility.",
  },
  {
    id: "cs-classes-extension-method",
    language: "csharp",
    title: "Extension methods add methods without inheritance",
    tag: "classes",
    code: `public static class StringExtensions
{
    public static string Truncate(this string s, int maxLen)
        => s.Length <= maxLen ? s : s[..maxLen] + "...";

    public static bool IsNullOrEmpty(this string? s)
        => string.IsNullOrEmpty(s);
}

string title = "A very long title that goes on forever";
Console.WriteLine(title.Truncate(20));  // "A very long title th..."

string? n = null;
Console.WriteLine(n.IsNullOrEmpty());   // True`,
    explanation: "Extension methods add methods to existing types without modifying them. The `this` keyword on the first parameter designates the type being extended. They're syntactic sugar — the call is compiled to a static call.",
  },
  {
    id: "cs-pattern-switch-expr",
    language: "csharp",
    title: "Switch expression with pattern matching",
    tag: "snippet",
    code: `int statusCode = 404;

string message = statusCode switch
{
    200          => "OK",
    201          => "Created",
    >= 400 and < 500 => "Client error",
    >= 500       => "Server error",
    _            => "Unknown"
};
Console.WriteLine(message); // "Client error"`,
    explanation: "Switch expressions return a value, support relational and logical patterns (`and`, `or`, `not`), and require exhaustiveness (the `_` discard pattern is the default arm). They replace multi-branch `if/else` cleanly.",
  },
  {
    id: "cs-understand-lazy-linq",
    language: "csharp",
    title: "LINQ is lazy — deferred execution (trace)",
    tag: "understanding",
    code: `var nums = new List<int> { 1, 2, 3 };

var query = nums.Where(n =>
{
    Console.Write(\`check \${n} \`);
    return n > 1;
});
Console.WriteLine("query defined");   // prints FIRST — nothing evaluated yet

foreach (var x in query)              // evaluation happens HERE
    Console.Write(\`got \${x} \`);
// Output: query defined  check 1 check 2 got 2 check 3 got 3`,
    explanation: "LINQ methods return an `IEnumerable<T>` representing a computation, not a result. The computation runs only when you enumerate (e.g., `foreach`, `ToList()`, `Count()`). This can cause surprises if the source changes between definition and enumeration.",
  },
  {
    id: "cs-linkedlist-nodes",
    language: "csharp",
    title: "LinkedList<T> with node access",
    tag: "structures",
    code: `var ll = new LinkedList<string>();
var a = ll.AddLast("A");
var b = ll.AddLast("B");
var c = ll.AddLast("C");

ll.AddBefore(b, "X");             // insert before B
ll.Remove(c);                     // O(1) removal with a node reference

foreach (var s in ll)
    Console.Write(s + " ");       // A X B`,
    explanation: "`LinkedList<T>` gives O(1) insertion/removal when you already have the node reference. Unlike `List<T>`, it has no index-based access — use it only when frequent mid-list insertion or deletion is needed.",
  },
  {
    id: "cs-caveat-float-decimal",
    language: "csharp",
    title: "float/double vs decimal precision",
    tag: "caveats",
    code: `double d = 0.1 + 0.2;
Console.WriteLine(d == 0.3);    // False
Console.WriteLine(d);           // 0.30000000000000004

decimal dec = 0.1m + 0.2m;
Console.WriteLine(dec == 0.3m); // True
Console.WriteLine(dec);         // 0.3

// Rule: use decimal for money; double for physics/math`,
    explanation: "`double` and `float` use binary floating-point and cannot represent 0.1 exactly. `decimal` uses base-10 representation with 28–29 significant digits — accurate for financial calculations but slower.",
  },
  {
    id: "cs-types-valuetuple",
    language: "csharp",
    title: "ValueTuple vs Tuple: struct vs class",
    tag: "types",
    code: `// Tuple<T1,T2> — heap-allocated class, verbose
Tuple<int, string> old = Tuple.Create(1, "Alice");
Console.WriteLine(old.Item1);

// ValueTuple — stack-allocated struct with names
(int id, string name) person = (1, "Alice");
Console.WriteLine(person.name);    // "Alice"

// Deconstruct
var (x, y) = (10, 20);
Console.WriteLine(x + y);  // 30`,
    explanation: "`ValueTuple` is a value type (struct) allocated on the stack when possible, named fields, and works with deconstruction. `Tuple<>` is an older class-based version with `Item1`, `Item2` fields — prefer `ValueTuple` for new code.",
  },
  {
    id: "cs-families-func-action-pred",
    language: "csharp",
    title: "Func<T> vs Action<T> vs Predicate<T>",
    tag: "families",
    code: `Func<int, int, int> add   = (a, b) => a + b;    // returns int
Action<string>        print = s => Console.WriteLine(s); // returns void
Predicate<int>        isEven = n => n % 2 == 0;          // returns bool

Console.WriteLine(add(3, 4));     // 7
print("hello");                   // hello
Console.WriteLine(isEven(4));     // True

// Predicate<T> == Func<T, bool> — interchangeable in most APIs
Func<int, bool> isEven2 = n => n % 2 == 0;`,
    explanation: "`Func<TResult>` or `Func<T, TResult>` is a delegate returning a value; `Action` returns void; `Predicate<T>` is a `Func<T, bool>` alias used in older APIs. All three can be replaced by lambdas.",
  },
  {
    id: "cs-classes-partial-class",
    language: "csharp",
    title: "partial class splits across files",
    tag: "classes",
    code: `// File: Order.cs
public partial class Order
{
    public int Id { get; set; }
    public decimal Total { get; set; }
}

// File: Order.Validation.cs
public partial class Order
{
    public bool IsValid() => Total > 0;
}

// Both parts merged at compile time
var o = new Order { Id = 1, Total = 100m };
Console.WriteLine(o.IsValid());  // True`,
    explanation: "`partial` lets a single class span multiple files — common with code generators (Entity Framework, WinForms designer) that maintain one file while you edit another.",
  },
  {
    id: "cs-caveat-async-void",
    language: "csharp",
    title: "async void swallows exceptions",
    tag: "caveats",
    code: `// BAD: exception is unobservable, crashes the process
async void BadHandler()
{
    await Task.Delay(10);
    throw new Exception("lost!");   // crashes app silently
}

// GOOD: return Task so callers can await and observe
async Task GoodHandler()
{
    await Task.Delay(10);
    throw new Exception("observable");
}

// async void is only acceptable for top-level event handlers`,
    explanation: "`async void` methods cannot be awaited, so exceptions escape to the `SynchronizationContext` and often crash the process unobserved. Always return `Task` (or `Task<T>`) from async methods, except for event handlers.",
  },
  {
    id: "cs-types-generic-constraint",
    language: "csharp",
    title: "Generic constraints: where T : class, new(), struct",
    tag: "types",
    code: `// T must be a reference type
void PrintRef<T>(T item) where T : class
    => Console.WriteLine(item.ToString());

// T must have a parameterless constructor
T Create<T>() where T : new() => new T();

// T must be a value type
void PrintStruct<T>(T item) where T : struct
    => Console.WriteLine(item);

// Combined constraints
T CreateRef<T>() where T : class, new() => new T();`,
    explanation: "Constraints restrict what types can be used as type arguments, enabling specific operations (`new T()`, null checks, value/reference-type behavior). Multiple constraints are comma-separated after `where T :`.",
  },
  {
    id: "cs-families-task-valuetask",
    language: "csharp",
    title: "Task vs ValueTask",
    tag: "families",
    code: `using System.Threading.Tasks;

// Task: always heap-allocated, safe for general async
async Task<int> GetValueAsync() => await Task.FromResult(42);

// ValueTask: avoids allocation when result is available synchronously
async ValueTask<int> GetCachedAsync()
{
    if (_cache.TryGetValue("x", out int v))
        return v;             // synchronous path — no allocation
    return await FetchAsync("x");
}`,
    explanation: "`Task` is always heap-allocated; `ValueTask` is a struct that avoids allocation on the synchronous (hot) path. Use `ValueTask` for high-throughput code that frequently returns synchronously.",
  },
  {
    id: "cs-classes-primary-ctor",
    language: "csharp",
    title: "Primary constructors (C# 12)",
    tag: "classes",
    code: `// Parameters become part of the class scope
public class Point(double x, double y)
{
    public double X { get; } = x;
    public double Y { get; } = y;

    public double Distance()
        => Math.Sqrt(x * x + y * y);   // x, y captured directly
}

var p = new Point(3.0, 4.0);
Console.WriteLine(p.Distance());  // 5`,
    explanation: "Primary constructors eliminate the boilerplate constructor body for simple initialization. The parameters are in scope throughout the class body, so they can be used in property initializers and methods.",
  },
  {
    id: "cs-range-index",
    language: "csharp",
    title: "Range (..) and Index (^) operators",
    tag: "snippet",
    code: `int[] nums = { 0, 1, 2, 3, 4, 5 };

Console.WriteLine(nums[^1]);    // 5  (last element)
Console.WriteLine(nums[^2]);    // 4  (second from end)

int[] slice = nums[1..4];       // [1, 2, 3]  (end exclusive)
int[] tail  = nums[2..];        // [2, 3, 4, 5]
int[] head  = nums[..3];        // [0, 1, 2]
int[] last2 = nums[^2..];       // [4, 5]`,
    explanation: "`^n` counts from the end (0-based from the back), and `a..b` creates a `Range`. Both work on arrays, strings, `Span<T>`, and any type that exposes an indexer taking `Index` or `Range`.",
  },
  {
    id: "cs-understand-captured-loop-var",
    language: "csharp",
    title: "Captured loop variable in closures (trace)",
    tag: "understanding",
    code: `var actions = new List<Action>();
for (int i = 0; i < 3; i++)
{
    actions.Add(() => Console.WriteLine(i));   // captures 'i' by ref
}
actions.ForEach(a => a());   // 3 3 3  — all see final value of i

// Fix: copy to a local variable per iteration
for (int i = 0; i < 3; i++)
{
    int copy = i;
    actions.Add(() => Console.WriteLine(copy));
}`,
    explanation: "Lambdas capture variables by reference, not value. The loop variable `i` is a single variable that reaches 3 when the loop ends — all lambdas see the same final value. Capture a per-iteration copy to fix this.",
  },
  {
    id: "cs-sortedset-range",
    language: "csharp",
    title: "SortedSet<T>.GetViewBetween for range queries",
    tag: "structures",
    code: `var ss = new SortedSet<int> { 3, 1, 7, 5, 2, 9, 4 };

// Elements are always iterated in sorted order
foreach (var n in ss)
    Console.Write(n + " ");  // 1 2 3 4 5 7 9

// Range view: O(log n) to set up, O(k) to iterate
var view = ss.GetViewBetween(3, 7);
Console.WriteLine(string.Join(",", view));  // 3,4,5,7`,
    explanation: "`SortedSet<T>` is a red-black tree that keeps elements sorted. `GetViewBetween(lo, hi)` returns a live view (backed by the same tree) of elements in the inclusive range — changes are reflected immediately.",
  },
  {
    id: "cs-caveat-string-null",
    language: "csharp",
    title: "null + string concatenation produces \"\"",
    tag: "caveats",
    code: `string? s = null;

Console.WriteLine("Value: " + s);         // "Value: "  — null treated as ""
Console.WriteLine(string.Concat("A", s)); // "A"

// BUT: calling a method on null is still a NullReferenceException
// Console.WriteLine(s.ToUpper());        // NullReferenceException!

// Safe: use null-conditional operator
Console.WriteLine(s?.ToUpper() ?? "N/A"); // "N/A"`,
    explanation: "The `+` operator and `string.Concat` treat `null` as an empty string. However, instance method calls on `null` still throw `NullReferenceException` — only operators and static methods are null-safe.",
  },
  {
    id: "cs-types-record-equality",
    language: "csharp",
    title: "record generates value-based equality",
    tag: "types",
    code: `record Point(int X, int Y);

var a = new Point(1, 2);
var b = new Point(1, 2);
var c = new Point(3, 4);

Console.WriteLine(a == b);           // True  (value equality)
Console.WriteLine(a == c);           // False
Console.WriteLine(a.Equals(b));      // True
Console.WriteLine(ReferenceEquals(a, b)); // False (different objects)

// Records also generate a Deconstruct method and ToString
Console.WriteLine(a);    // Point { X = 1, Y = 2 }`,
    explanation: "`record` classes auto-generate `Equals`, `GetHashCode`, and `==` based on all properties. Unlike plain classes where `==` compares references, records compare values — great for immutable data models.",
  },
  {
    id: "cs-families-stream-hierarchy",
    language: "csharp",
    title: "Stream class hierarchy",
    tag: "families",
    code: `// Stream (abstract base)
//  ├── FileStream          — file I/O
//  ├── MemoryStream        — in-memory buffer
//  ├── NetworkStream       — TCP/socket
//  ├── GZipStream          — compression wrapper
//  └── CryptoStream        — encryption wrapper

using var ms = new MemoryStream();
ms.Write(new byte[] { 1, 2, 3 });
ms.Position = 0;
Console.WriteLine(ms.ReadByte());  // 1

// Wrapping streams compose behaviors:
using var gz = new System.IO.Compression.GZipStream(ms,
    System.IO.Compression.CompressionMode.Compress);`,
    explanation: "All I/O in .NET flows through `Stream`. Wrapper streams like `GZipStream` or `CryptoStream` take another stream as input, composing behaviors like compression and encryption without changing the underlying transport.",
  },
  {
    id: "cs-classes-interface-default",
    language: "csharp",
    title: "Interface default implementation (C# 8)",
    tag: "classes",
    code: `interface ILogger
{
    void Log(string message);

    // Default implementation — classes don't need to override it
    void LogError(string msg) => Log(\`[ERROR] \${msg}\`);
    void LogInfo(string msg)  => Log(\`[INFO]  \${msg}\`);
}

class ConsoleLogger : ILogger
{
    public void Log(string message) => Console.WriteLine(message);
    // LogError/LogInfo inherited for free
}

ILogger log = new ConsoleLogger();
log.LogError("oops");   // [ERROR] oops`,
    explanation: "C# 8 interface default implementations let you add new methods to an interface without breaking all existing implementors. Only callable through the interface type — not through the concrete class unless overridden.",
  },
  {
    id: "cs-tuple-deconstruct",
    language: "csharp",
    title: "Tuple deconstruction and swap",
    tag: "snippet",
    code: `// Function returning multiple values
(string name, int age) GetPerson() => ("Alice", 30);

var (name, age) = GetPerson();
Console.WriteLine(\`\${name} is \${age}\`);  // Alice is 30

// Swap without temp variable
int x = 1, y = 2;
(x, y) = (y, x);
Console.WriteLine(\`\${x} \${y}\`);  // 2 1`,
    explanation: "Deconstruction with `var (a, b) = ...` unpacks tuples (and any type with a `Deconstruct` method) into named local variables. The swap idiom `(x, y) = (y, x)` works in a single statement.",
  },
  {
    id: "cs-understand-struct-copy",
    language: "csharp",
    title: "Struct assignment copies the value",
    tag: "understanding",
    code: `struct Point { public int X, Y; }

Point a = new Point { X = 1, Y = 2 };
Point b = a;        // COPY — b is independent
b.X = 99;
Console.WriteLine(a.X);   // 1 — unaffected
Console.WriteLine(b.X);   // 99

// Compare with class (reference type):
// class Point { public int X, Y; }
// Point a = new Point { X = 1, Y = 2 };
// Point b = a;   // b is an ALIAS — same heap object`,
    explanation: "Struct assignment copies the entire value; both variables are independent. A class assignment copies only the reference — both variables point to the same heap object. This is the core value-vs-reference type distinction.",
  },
  {
    id: "cs-hashset-operations",
    language: "csharp",
    title: "HashSet<T> set operations",
    tag: "structures",
    code: `var a = new HashSet<int> { 1, 2, 3, 4 };
var b = new HashSet<int> { 3, 4, 5, 6 };

// Modifying operations (mutate 'a')
var union  = new HashSet<int>(a); union.UnionWith(b);
var inter  = new HashSet<int>(a); inter.IntersectWith(b);
var diff   = new HashSet<int>(a); diff.ExceptWith(b);

Console.WriteLine(string.Join(",", union)); // 1,2,3,4,5,6
Console.WriteLine(string.Join(",", inter)); // 3,4
Console.WriteLine(string.Join(",", diff));  // 1,2`,
    explanation: "`HashSet<T>` supports set algebra: `UnionWith`, `IntersectWith`, `ExceptWith`, and `SymmetricExceptWith`. Operations are O(n) and mutate the receiver — clone first if you need non-destructive results.",
  },
  {
    id: "cs-caveat-ref-type-default",
    language: "csharp",
    title: "Reference type fields default to null",
    tag: "caveats",
    code: `class Config
{
    public string Name;      // null — not initialized!
    public List<int> Items;  // null
}

var c = new Config();
Console.WriteLine(c.Name == null);   // True
// c.Name.Length                      // NullReferenceException!

// Fix: initialize in field declaration or constructor
class SafeConfig
{
    public string Name = "";
    public List<int> Items = new();
}`,
    explanation: "Reference type fields are initialized to `null` by default. Any dereference before assignment causes `NullReferenceException`. Always initialize fields in the declaration or constructor.",
  },
  {
    id: "cs-types-covariance-iface",
    language: "csharp",
    title: "IEnumerable<T> is covariant (out T)",
    tag: "types",
    code: `IEnumerable<string> strings = new List<string> { "a", "b" };
IEnumerable<object> objects = strings;   // covariant — safe!

// Works because string IS an object, and we only read
foreach (var o in objects)
    Console.WriteLine(o);

// IList<T> is NOT covariant (it has Add<T>):
// IList<object> list = new List<string>();  // compile error`,
    explanation: "`IEnumerable<out T>` is covariant: `T` only appears in output position (you get items, never write them), so `IEnumerable<Derived>` can substitute for `IEnumerable<Base>`. Mutable collections like `IList<T>` are invariant.",
  },
  {
    id: "cs-families-string-builder",
    language: "csharp",
    title: "string vs StringBuilder for concatenation",
    tag: "families",
    code: `// BAD: O(n²) — string creates a new object each time
string result = "";
for (int i = 0; i < 1000; i++)
    result += i.ToString();

// GOOD: StringBuilder reuses buffer — O(n)
var sb = new System.Text.StringBuilder();
for (int i = 0; i < 1000; i++)
    sb.Append(i);
string final = sb.ToString();

// For a few concatenations, + is fine (compiler optimizes)`,
    explanation: "`string` is immutable: `+=` allocates a new string each time. `StringBuilder` uses an internal resizable buffer and only allocates the final string once, making it O(n) vs O(n²).",
  },
  {
    id: "cs-classes-sealed-override",
    language: "csharp",
    title: "sealed prevents further overriding",
    tag: "classes",
    code: `class Base
{
    public virtual void Greet() => Console.WriteLine("Base");
}

class Middle : Base
{
    public sealed override void Greet() => Console.WriteLine("Middle");
    // 'sealed' stops derived classes from overriding Greet again
}

class Child : Middle
{
    // public override void Greet() ...  // compile error
}

new Child().Greet();  // "Middle"`,
    explanation: "`sealed override` allows the current class to override a virtual method but prevents further overriding by subclasses. It also enables JIT devirtualization, which can improve performance.",
  },
  {
    id: "cs-target-typed-new",
    language: "csharp",
    title: "Target-typed new() omits the type name",
    tag: "snippet",
    code: `// When the type is known from context, use new() without the name
List<string> names = new();           // new List<string>()
Dictionary<int, string> map = new();  // new Dictionary<int, string>()

// In method arguments
void Process(List<int> items) { }
Process(new() { 1, 2, 3 });

// In object initializer
record Config(List<string> Tags);
Config cfg = new(new() { "a", "b" });`,
    explanation: "C# 9 target-typed `new()` infers the type from context (declaration, parameter, return type). It's especially helpful with long generic type names, eliminating redundancy.",
  },
  {
    id: "cs-understand-readonly-struct",
    language: "csharp",
    title: "readonly struct prevents defensive copies",
    tag: "understanding",
    code: `struct MutablePoint { public int X; public void Move() => X++; }
readonly struct ImmutablePoint { public readonly int X; }

// When you call a method on a non-readonly struct through a readonly context,
// the compiler makes a defensive copy:
readonly MutablePoint mp = new MutablePoint { X = 1 };
mp.Move();                    // mutates the COPY, not mp
Console.WriteLine(mp.X);     // still 1

// readonly struct: no defensive copy needed, compiler error on mutation
readonly ImmutablePoint ip = new ImmutablePoint { X = 1 };`,
    explanation: "The compiler creates defensive copies of non-readonly structs in readonly contexts (readonly fields, `in` parameters) to prevent mutation. `readonly struct` eliminates these copies and lets the compiler enforce immutability.",
  },
  {
    id: "cs-priorityqueue",
    language: "csharp",
    title: "PriorityQueue<TElement, TPriority>",
    tag: "structures",
    code: `var pq = new PriorityQueue<string, int>();
pq.Enqueue("low task",    10);
pq.Enqueue("high task",   1);
pq.Enqueue("medium task", 5);

while (pq.Count > 0)
{
    string item = pq.Dequeue();
    Console.WriteLine(item);
}
// high task
// medium task
// low task`,
    explanation: "`PriorityQueue<TElement, TPriority>` is a min-heap added in .NET 6: the element with the *smallest* priority value dequeues first. The element and its priority are separate, which avoids requiring `IComparable` on the element.",
  },
  {
    id: "cs-caveat-linq-multiple-enum",
    language: "csharp",
    title: "Enumerating a LINQ query twice evaluates it twice",
    tag: "caveats",
    code: `int calls = 0;
IEnumerable<int> query = Enumerable.Range(1, 5)
    .Select(n => { calls++; return n * 2; });

int count = query.Count();   // evaluates — calls = 5
int sum   = query.Sum();     // evaluates AGAIN — calls = 10

// Fix: materialize once
var list = query.ToList();   // evaluates once
int count2 = list.Count;
int sum2   = list.Sum();`,
    explanation: "LINQ queries are lazy: every enumeration re-runs the pipeline. If the source or intermediate steps are expensive, materialize with `.ToList()` or `.ToArray()` and work with the result.",
  },
  {
    id: "cs-types-dynamic",
    language: "csharp",
    title: "dynamic bypasses compile-time type checking",
    tag: "types",
    code: `dynamic d = 42;
Console.WriteLine(d.GetType());   // System.Int32
d = "hello";
Console.WriteLine(d.Length);      // 5 — resolved at runtime

dynamic obj = new { Name = "Alice" };
Console.WriteLine(obj.Name);      // "Alice"

// Runtime error (not compile-time):
// Console.WriteLine(obj.Missing);  // RuntimeBinderException`,
    explanation: "`dynamic` defers type checking and member resolution to runtime via the DLR. It's useful for COM interop, JSON, and plugin systems, but loses all IntelliSense and compile-time safety. Use sparingly.",
  },
  {
    id: "cs-families-memory-t",
    language: "csharp",
    title: "Span<T> vs Memory<T>",
    tag: "families",
    code: `// Span<T>: stack-only, cannot be stored in a class field
Span<int> span = stackalloc int[3] { 1, 2, 3 };
span[0] = 99;
Console.WriteLine(span[0]);  // 99

// Memory<T>: heap-compatible, can be stored and used across await
Memory<byte> mem = new byte[10];
await ProcessAsync(mem.Slice(0, 5));

async Task ProcessAsync(Memory<byte> m) { /* ... */ }`,
    explanation: "`Span<T>` is a ref struct — it lives only on the stack and cannot be stored in class fields or cross `await` boundaries. `Memory<T>` is a heap-compatible slice that can be stored and passed to async methods.",
  },
  {
    id: "cs-classes-abstract-generic",
    language: "csharp",
    title: "Abstract class with a generic method",
    tag: "classes",
    code: `abstract class Repository<T> where T : class
{
    protected abstract IQueryable<T> Query();

    public T? FindById(int id)
    {
        return Query().FirstOrDefault(e => EF.Property<int>(e, "Id") == id);
    }

    public List<T> GetAll() => Query().ToList();
}

class UserRepo : Repository<User>
{
    protected override IQueryable<User> Query() => _db.Users;
}`,
    explanation: "Abstract classes can have generic type parameters and leave only specific pieces abstract. Concrete subclasses implement the abstract members while inheriting all concrete behavior — a classic Template Method pattern.",
  },
  {
    id: "cs-with-expr-record",
    language: "csharp",
    title: "with expression creates a modified copy of a record",
    tag: "snippet",
    code: `record Person(string Name, int Age, string City);

var alice = new Person("Alice", 30, "NYC");
var older = alice with { Age = 31 };     // copy with Age changed
var moved = alice with { City = "LA" };  // copy with City changed

Console.WriteLine(alice);  // Person { Name = Alice, Age = 30, City = NYC }
Console.WriteLine(older);  // Person { Name = Alice, Age = 31, City = NYC }
Console.WriteLine(alice == older);  // False`,
    explanation: "`with` creates a shallow copy of a record with specified properties changed. The original is untouched — this is the idiomatic way to produce 'updated' immutable records.",
  },
  {
    id: "cs-understand-default-interface",
    language: "csharp",
    title: "Default interface method is not accessible via concrete type",
    tag: "understanding",
    code: `interface IShape
{
    double Area();
    string Describe() => \`Area = \${Area():F2}\`;  // default impl
}

class Circle : IShape
{
    public double Area() => Math.PI * 4;
    // Describe() NOT in Circle's member list
}

Circle c = new Circle();
// c.Describe();           // compile error — only on interface type
IShape s = c;
Console.WriteLine(s.Describe());  // "Area = 12.57"  ✓`,
    explanation: "Default interface methods are only accessible through the interface type, not through a variable declared as the concrete class. This preserves backward compatibility without polluting the class's public API.",
  },
  {
    id: "cs-concurrentdict-getadd",
    language: "csharp",
    title: "ConcurrentDictionary.GetOrAdd for thread-safe caching",
    tag: "structures",
    code: `using System.Collections.Concurrent;

var cache = new ConcurrentDictionary<string, int>();

// Atomic: get if present, otherwise compute and add
int val = cache.GetOrAdd("key", k =>
{
    Console.WriteLine(\`computing \${k}\`);
    return 42;
});
int val2 = cache.GetOrAdd("key", _ => 99);  // factory skipped
Console.WriteLine(val2);  // 42`,
    explanation: "`ConcurrentDictionary` provides thread-safe get/add operations without external locking. `GetOrAdd` atomically reads or inserts — note that the value factory may be called more than once under high concurrency; it should be side-effect-free.",
  },
  {
    id: "cs-caveat-captured-foreach",
    language: "csharp",
    title: "foreach variable is safe to capture (C# 5+)",
    tag: "caveats",
    code: `// C# 5+ foreach: each iteration has its own variable
var items = new[] { "a", "b", "c" };
var actions = items.Select(item => (Action)(() => Console.WriteLine(item)));
foreach (var a in actions)
    a();    // a b c  — correct in C# 5+

// BUT: for-loop still needs a copy (different semantics)
var actions2 = new List<Action>();
for (int i = 0; i < 3; i++)
{
    int copy = i;
    actions2.Add(() => Console.WriteLine(copy));
}`,
    explanation: "Since C# 5, each `foreach` iteration has a fresh copy of the loop variable, so lambdas that capture it see the right value. The old gotcha still applies to `for` loops — the index variable is shared.",
  },
  {
    id: "cs-types-pattern-type",
    language: "csharp",
    title: "Type pattern with is for safe casting",
    tag: "types",
    code: `object obj = "hello";

// Old style (two operations)
if (obj is string)
{
    string s = (string)obj;
    Console.WriteLine(s.Length);
}

// Modern: is with type pattern (one atomic check+cast)
if (obj is string s2)
    Console.WriteLine(s2.Length);  // 5

// Works in switch too:
string label = obj switch
{
    int n    => \`int: \${n}\`,
    string s => \`string: \${s}\`,
    _        => "other"
};`,
    explanation: "The `is` type pattern test-and-casts in one atomic operation, returning `false` if the object is `null` or a different type. It's the modern replacement for the cast-after-check idiom.",
  },
  {
    id: "cs-families-exception-types",
    language: "csharp",
    title: "Exception vs SystemException vs ApplicationException",
    tag: "families",
    code: `// Exception
//  ├── SystemException         (CLR/runtime errors)
//  │    ├── NullReferenceException
//  │    ├── InvalidCastException
//  │    ├── OverflowException
//  │    └── ...
//  └── ApplicationException   (intended for app errors — rarely used now)

// Best practice: derive directly from Exception
public class OrderNotFoundException : Exception
{
    public int OrderId { get; }
    public OrderNotFoundException(int id) : base(\`Order \${id} not found\`)
        => OrderId = id;
}`,
    explanation: "The `ApplicationException` distinction is obsolete — Microsoft now recommends deriving custom exceptions directly from `Exception`. Derive from `SystemException` only for infrastructure-level errors.",
  },
  {
    id: "cs-classes-record-with-inherit",
    language: "csharp",
    title: "record with expression preserves derived type",
    tag: "classes",
    code: `record Animal(string Name, string Sound);
record Dog(string Name, string Breed) : Animal(Name, "woof");

var d1 = new Dog("Rex", "Labrador");
var d2 = d1 with { Name = "Max" };

Console.WriteLine(d2.GetType().Name);  // Dog
Console.WriteLine(d2.Breed);           // Labrador (inherited)
Console.WriteLine(d2.Sound);           // woof`,
    explanation: "When using `with` on a derived record, the result preserves the derived type and carries over all properties, including those from base records. This is different from class inheritance where `with` would be on the base type.",
  },
  {
    id: "cs-string-contains-span",
    language: "csharp",
    title: "String methods that accept StringComparison",
    tag: "snippet",
    code: `string text = "Hello World";

// Case-insensitive search
bool found = text.Contains("world", StringComparison.OrdinalIgnoreCase);
Console.WriteLine(found);   // True

int idx = text.IndexOf("world", StringComparison.OrdinalIgnoreCase);
Console.WriteLine(idx);     // 6

bool starts = text.StartsWith("hello", StringComparison.OrdinalIgnoreCase);
Console.WriteLine(starts);  // True`,
    explanation: "Overloads that accept `StringComparison` control culture-sensitivity and case-sensitivity without `ToLower()`. `OrdinalIgnoreCase` is fastest and appropriate for most non-linguistic comparisons.",
  },
  {
    id: "cs-understand-event-multicast",
    language: "csharp",
    title: "Multicast delegate executes all subscribed handlers",
    tag: "understanding",
    code: `Action<string> log = Console.WriteLine;
log += s => Console.WriteLine(\`[LOG] \${s}\`);
log += s => Console.WriteLine(\`[AUDIT] \${s}\`);

log("event!");
// event!
// [LOG] event!
// [AUDIT] event!

// Return value of multicast: last handler's return
Func<int> all = () => 1;
all += () => 2;
Console.WriteLine(all());  // 2  — earlier return values discarded`,
    explanation: "Delegates are multicast by default: `+=` subscribes another handler, and invocation calls all of them in subscription order. When a return type is non-void, only the last handler's return value is captured.",
  },
  {
    id: "cs-immutablearray",
    language: "csharp",
    title: "ImmutableArray<T> vs List<T>",
    tag: "structures",
    code: `using System.Collections.Immutable;

var list  = ImmutableArray.Create(1, 2, 3);
var list2 = list.Add(4);        // returns NEW array; original unchanged
var list3 = list.SetItem(0, 99);

Console.WriteLine(string.Join(",", list));  // 1,2,3
Console.WriteLine(string.Join(",", list2)); // 1,2,3,4
Console.WriteLine(string.Join(",", list3)); // 99,2,3

// ImmutableArray<T> is a struct — no null, no boxing on iteration`,
    explanation: "`ImmutableArray<T>` is a struct wrapping an array; all mutation methods return a new array, leaving the original unchanged. It's cheaper than `ImmutableList<T>` for iteration and random access.",
  },
  {
    id: "cs-caveat-struct-interface",
    language: "csharp",
    title: "Struct boxing when assigned to interface type",
    tag: "caveats",
    code: `interface IArea { double Area(); }

struct Circle : IArea
{
    public double Radius;
    public double Area() => Math.PI * Radius * Radius;
}

Circle c = new Circle { Radius = 5 };
Console.WriteLine(c.Area());   // no boxing — direct call

IArea shape = c;               // ← BOXING: Circle copied to heap
shape.Radius = 10;             // compile error (interface has no Radius)
Console.WriteLine(shape.Area()); // uses boxed COPY with Radius = 5`,
    explanation: "Assigning a struct to an interface type boxes it onto the heap. Mutations to the original struct aren't reflected in the boxed copy and vice versa. Use `readonly struct` or avoid interface assignments for hot-path structs.",
  },
  {
    id: "cs-types-span-t",
    language: "csharp",
    title: "Span<T> for zero-copy array slices",
    tag: "types",
    code: `int[] data = { 10, 20, 30, 40, 50 };

// Span is a slice: no allocation, no copy
Span<int> span = data.AsSpan(1, 3);  // [20, 30, 40]
span[0] = 99;
Console.WriteLine(data[1]);           // 99 — modifies original

// Efficient string slicing
ReadOnlySpan<char> s = "hello world".AsSpan(6);
Console.WriteLine(s.ToString());      // "world"`,
    explanation: "`Span<T>` is a window into contiguous memory (array, stack, or native buffer) with no allocation. Slicing via `AsSpan` avoids copying and is faster than `Array.Copy` for sub-array processing.",
  },
  {
    id: "cs-families-comparer-equality",
    language: "csharp",
    title: "IComparer<T> vs IEqualityComparer<T>",
    tag: "families",
    code: `// IComparer<T>: used for ordering (sorting, SortedSet, etc.)
var byLength = Comparer<string>.Create((a, b) => a.Length - b.Length);
var names = new List<string> { "banana", "fig", "apple" };
names.Sort(byLength);
Console.WriteLine(string.Join(",", names));  // fig,apple,banana

// IEqualityComparer<T>: used for hashing/equality (HashSet, Dictionary, etc.)
var caseInsensitive = StringComparer.OrdinalIgnoreCase;
var set = new HashSet<string>(caseInsensitive);
set.Add("Hello"); set.Add("hello");
Console.WriteLine(set.Count);  // 1`,
    explanation: "`IComparer<T>` defines total order (returns negative/zero/positive); `IEqualityComparer<T>` defines equality and a hash code. They're used by different collection types and cannot substitute for each other.",
  },
  {
    id: "cs-classes-operator-overload",
    language: "csharp",
    title: "Operator overloading",
    tag: "classes",
    code: `struct Vector2
{
    public double X, Y;
    public Vector2(double x, double y) { X = x; Y = y; }

    public static Vector2 operator +(Vector2 a, Vector2 b)
        => new(a.X + b.X, a.Y + b.Y);

    public static Vector2 operator *(Vector2 v, double s)
        => new(v.X * s, v.Y * s);

    public override string ToString() => \`(\${X}, \${Y})\`;
}

var v = new Vector2(1, 2) + new Vector2(3, 4);
Console.WriteLine(v);        // (4, 6)
Console.WriteLine(v * 2.0);  // (8, 12)`,
    explanation: "Overloaded operators must be `public static` and must take at least one operand of the declaring type. Operator overloading makes mathematical types (vectors, matrices, money) use natural syntax.",
  },
  {
    id: "cs-is-pattern-and-or",
    language: "csharp",
    title: "Logical patterns: and, or, not in is expressions",
    tag: "snippet",
    code: `int n = 42;

// Relational + logical patterns
Console.WriteLine(n is > 0 and < 100);    // True
Console.WriteLine(n is < 0 or > 100);     // False
Console.WriteLine(n is not 0);            // True

// Type + logical
object o = "hello";
Console.WriteLine(o is string s and { Length: > 3 });  // True`,
    explanation: "C# 9 logical patterns (`and`, `or`, `not`) can be combined with relational patterns (`>`, `<`, `>=`, `<=`) directly in `is` expressions and switch arms, replacing verbose `&&`/`||` conditions.",
  },
  {
    id: "cs-understand-pattern-guards",
    language: "csharp",
    title: "when clause adds guards to switch cases",
    tag: "understanding",
    code: `int classify(int n) => n switch
{
    0               => 0,
    int x when x < 0 => -1,
    int x when x % 2 == 0 => 2,    // positive even
    _               => 1            // positive odd
};

Console.WriteLine(classify(-5));  // -1
Console.WriteLine(classify(4));   // 2
Console.WriteLine(classify(7));   // 1`,
    explanation: "`when` adds a Boolean guard to a switch arm. The arm only matches if both the pattern matches AND the guard evaluates to `true`. Arms are checked top-to-bottom; more specific arms should come first.",
  },
  {
    id: "cs-readonly-dict",
    language: "csharp",
    title: "ReadOnlyDictionary<K,V> as a public facade",
    tag: "structures",
    code: `using System.Collections.ObjectModel;

class Config
{
    private readonly Dictionary<string, string> _data = new()
    {
        ["host"] = "localhost",
        ["port"] = "5432"
    };

    // Expose read-only view — callers cannot modify _data
    public IReadOnlyDictionary<string, string> Settings
        => new ReadOnlyDictionary<string, string>(_data);
}

var cfg = new Config();
Console.WriteLine(cfg.Settings["host"]);   // "localhost"
// cfg.Settings["host"] = "x";            // compile error`,
    explanation: "`ReadOnlyDictionary<K,V>` wraps an existing dictionary and exposes it as `IReadOnlyDictionary<K,V>`, preventing external mutation without copying the data. Internal code still mutates through the original reference.",
  },
  {
    id: "cs-caveat-nullref-exception",
    language: "csharp",
    title: "Null check before chained member access",
    tag: "caveats",
    code: `class Order { public Customer? Customer { get; set; } }
class Customer { public string? Name { get; set; } }

Order order = new Order();

// BAD: can throw NullReferenceException
// string? name = order.Customer.Name;

// GOOD: null-conditional operator
string? name = order?.Customer?.Name;
Console.WriteLine(name ?? "unknown");   // "unknown"

// Also works with methods
int len = order?.Customer?.Name?.Length ?? 0;`,
    explanation: "The `?.` null-conditional operator short-circuits to `null` when any segment is `null`, avoiding `NullReferenceException`. Chain as many `?.` as needed, and use `??` to provide a fallback at the end.",
  },
  {
    id: "cs-types-required-init",
    language: "csharp",
    title: "required + init-only setters (C# 11/9)",
    tag: "types",
    code: `class User
{
    public required string Name { get; init; }   // must set, immutable after
    public required string Email { get; init; }
    public int Age { get; init; }                // optional, init-only
}

// Must provide required members in object initializer
var u = new User { Name = "Alice", Email = "alice@example.com" };
// var bad = new User { Name = "Alice" };  // compile error: Email required

// u.Name = "Bob";  // compile error: init-only`,
    explanation: "`required` ensures an `init`-only property is always set in an object initializer (enforced at compile time). After construction, `init` setters prevent modification — giving you validation without a custom constructor.",
  },
  {
    id: "cs-families-cancellation",
    language: "csharp",
    title: "CancellationToken cooperative cancellation",
    tag: "families",
    code: `async Task DownloadAsync(string url, CancellationToken ct)
{
    using var client = new HttpClient();
    // Pass ct to all async calls so they can cancel:
    var response = await client.GetAsync(url, ct);
    ct.ThrowIfCancellationRequested();   // explicit check
    return await response.Content.ReadAsStringAsync(ct);
}

var cts = new CancellationTokenSource(timeout: TimeSpan.FromSeconds(5));
try { await DownloadAsync("https://example.com", cts.Token); }
catch (OperationCanceledException) { Console.WriteLine("cancelled"); }`,
    explanation: "`CancellationTokenSource` creates a token that can be cancelled on timeout or manually. Pass the token through the call chain and use `ct.ThrowIfCancellationRequested()` at checkpoints for cooperative cancellation.",
  },
  {
    id: "cs-classes-explicit-impl",
    language: "csharp",
    title: "Explicit interface implementation hides members",
    tag: "classes",
    code: `interface IOutput { void Write(string s); }
interface ILogger { void Write(string s); }

class Service : IOutput, ILogger
{
    // Explicit: only accessible through the interface type
    void IOutput.Write(string s) => Console.WriteLine(\`[OUT] \${s}\`);
    void ILogger.Write(string s) => Console.WriteLine(\`[LOG] \${s}\`);
}

Service svc = new Service();
// svc.Write(...);               // compile error — ambiguous!
((IOutput)svc).Write("hi");     // [OUT] hi
((ILogger)svc).Write("hi");     // [LOG] hi`,
    explanation: "Explicit interface implementation resolves name collisions when two interfaces share a member name. The method is only accessible through the interface type, keeping the class's own API uncluttered.",
  },
  {
    id: "cs-lambda-natural-type",
    language: "csharp",
    title: "Lambda natural type and return type inference",
    tag: "snippet",
    code: `// Lambda has a natural type — inferred as Func<int, int>
var square = (int x) => x * x;
Console.WriteLine(square(5));   // 25

// Explicit return type annotation on lambda (C# 10)
var parse = (string s) => int.TryParse(s, out int n) ? n : (int?)null;
Console.WriteLine(parse("42"));   // 42
Console.WriteLine(parse("oops")); // (null)`,
    explanation: "C# 10 gives lambdas a 'natural type' — the compiler infers `Func<T,TResult>` or `Action<T>` so you can use `var`. You can also annotate the return type before the parameter list for precise control.",
  },
  {
    id: "cs-understand-throw-expr",
    language: "csharp",
    title: "throw as an expression (C# 7)",
    tag: "understanding",
    code: `class Config
{
    private readonly string _host;

    public Config(string? host)
    {
        // throw in null-coalescing expression
        _host = host ?? throw new ArgumentNullException(nameof(host));
    }

    public string Host => _host;
}

// In ternary
string GetEnv(string key)
    => Environment.GetEnvironmentVariable(key)
        ?? throw new InvalidOperationException(\`\${key} not set\`);`,
    explanation: "Since C# 7, `throw` is an expression that can appear in `??`, `? :`, `=>` expression bodies, and `&&`/`||` chains. This eliminates temporary variables just to throw on null/invalid conditions.",
  },
  {
    id: "cs-dict-tryadd",
    language: "csharp",
    title: "Dictionary TryGetValue and TryAdd",
    tag: "structures",
    code: `var scores = new Dictionary<string, int>
{
    ["Alice"] = 95, ["Bob"] = 87
};

// Avoid double-lookup with TryGetValue
if (scores.TryGetValue("Alice", out int score))
    Console.WriteLine(\`Score: \${score}\`);  // Score: 95

// TryAdd: no-op if key exists (safer than Add which throws)
bool added = scores.TryAdd("Alice", 100);
Console.WriteLine(added);                  // False
Console.WriteLine(scores["Alice"]);        // 95 (unchanged)`,
    explanation: "`TryGetValue` avoids the double-lookup pattern (`ContainsKey` + indexer) in a single call. `TryAdd` returns `false` when the key exists instead of throwing `ArgumentException` like `Add` does.",
  },
  {
    id: "cs-caveat-int-division",
    language: "csharp",
    title: "Integer division truncates toward zero",
    tag: "caveats",
    code: `Console.WriteLine(7 / 2);     // 3  (truncated, not rounded)
Console.WriteLine(-7 / 2);    // -3 (toward zero, not -4)
Console.WriteLine(7 % 2);     // 1

// To get a double result:
Console.WriteLine(7.0 / 2);   // 3.5
Console.WriteLine((double)7 / 2);  // 3.5

// Ceiling division trick:
int items = 7, pageSize = 2;
int pages = (items + pageSize - 1) / pageSize;  // 4`,
    explanation: "C# integer division truncates toward zero, discarding the fractional part. Mixing `int` and `double` promotes the result to `double`. The `(n + d - 1) / d` trick computes ceiling division without `Math.Ceiling`.",
  },
  {
    id: "cs-types-delegate-variance",
    language: "csharp",
    title: "Delegate covariance and contravariance",
    tag: "types",
    code: `// Covariance: Func<out TResult> — return type can be more derived
Func<string> getString = () => "hello";
Func<object> getObj   = getString;   // string IS object — covariant OK

// Contravariance: Action<in T> — parameter can be less derived
Action<object> handleObj = o => Console.WriteLine(o);
Action<string> handleStr = handleObj;  // accepts strings too — contravariant OK

handleStr("world");   // works!`,
    explanation: "Generic delegate variance follows the in/out rule: return types (`out`) allow covariance (Derived → Base assignment), parameter types (`in`) allow contravariance (Base → Derived assignment). This mirrors Liskov's substitution principle.",
  },
  {
    id: "cs-families-icollection",
    language: "csharp",
    title: "ICollection<T> members beyond IEnumerable<T>",
    tag: "families",
    code: `ICollection<int> coll = new List<int> { 1, 2, 3 };

Console.WriteLine(coll.Count);          // 3
coll.Add(4);
coll.Remove(1);
Console.WriteLine(coll.Contains(2));    // True
Console.WriteLine(coll.IsReadOnly);     // False

int[] arr = new int[4];
coll.CopyTo(arr, 0);                    // copy to array`,
    explanation: "`ICollection<T>` adds `Count`, `Add`, `Remove`, `Clear`, `Contains`, `CopyTo`, and `IsReadOnly` to the bare `IEnumerable<T>`. It's the minimum interface for a writable collection.",
  },
  {
    id: "cs-classes-static-class",
    language: "csharp",
    title: "static class for utility methods",
    tag: "classes",
    code: `public static class MathUtils
{
    public static int Clamp(int val, int min, int max)
        => Math.Max(min, Math.Min(max, val));

    public static bool IsEven(int n) => n % 2 == 0;

    public static IEnumerable<int> Range(int start, int end, int step = 1)
    {
        for (int i = start; i < end; i += step)
            yield return i;
    }
}

Console.WriteLine(MathUtils.Clamp(150, 0, 100));  // 100`,
    explanation: "A `static class` cannot be instantiated or inherited and can only contain static members. It's the idiomatic C# container for utility/helper functions that don't need object state.",
  },
  {
    id: "cs-string-raw-literal",
    language: "csharp",
    title: "Raw string literals (C# 11)",
    tag: "snippet",
    code: `// Triple-quote: no escaping needed for " or backslash
string json = """
    {
        "name": "Alice",
        "path": "C:\\\\Users\\\\Alice"
    }
    """;

// Interpolated raw string (number of $ = number of {{ needed to escape)
string name = "World";
string msg = $"""
    Hello, {name}!
    Use {{braces}} for literal braces.
    """;
Console.WriteLine(msg);`,
    explanation: "Raw string literals (`\"\"\"...\"\"\"`) need no escape sequences for `\"` or `\\`. The leading whitespace up to the closing `\"\"\"` is stripped. Combine with `$` for interpolation.",
  },
  {
    id: "cs-understand-coalesce-order",
    language: "csharp",
    title: "?? evaluates left-to-right and short-circuits",
    tag: "understanding",
    code: `string? a = null;
string? b = null;
string  c = "found";

string result = a ?? b ?? c;
Console.WriteLine(result);    // "found"

// Short-circuit: right side evaluated only if left is null
int calls = 0;
string? Compute() { calls++; return null; }

string? x = "present";
string y = x ?? Compute() ?? "default";
Console.WriteLine(calls);   // 0 — Compute() never called`,
    explanation: "`??` evaluates lazily left-to-right, stopping as soon as it finds a non-null value. The right side is only evaluated when the left is null, making it safe to chain with expensive computations.",
  },
  {
    id: "cs-arraypoolrent",
    language: "csharp",
    title: "ArrayPool<T> for reusable temporary buffers",
    tag: "structures",
    code: `using System.Buffers;

// Rent a buffer — may be larger than requested
byte[] buffer = ArrayPool<byte>.Shared.Rent(1024);
try
{
    // Use only the first 1024 bytes
    int read = stream.Read(buffer, 0, 1024);
    Process(buffer.AsSpan(0, read));
}
finally
{
    // Return to pool — do NOT use buffer after this
    ArrayPool<byte>.Shared.Return(buffer);
}`,
    explanation: "`ArrayPool<T>` reuses arrays across calls, cutting GC pressure in high-throughput code. `Rent` may return a larger array than requested — always track the actual size. Always `Return` in a `finally` block.",
  },
  {
    id: "cs-caveat-DateTime-kind",
    language: "csharp",
    title: "DateTime.Kind affects comparison and conversion",
    tag: "caveats",
    code: `var local = DateTime.Now;               // Kind = Local
var utc   = DateTime.UtcNow;             // Kind = Utc
var unspec = new DateTime(2024, 1, 1);   // Kind = Unspecified

// Comparing Local to Utc silently ignores Kind!
Console.WriteLine(local - utc);          // offset, not zero

// Safe: always use DateTimeOffset for unambiguous timestamps
DateTimeOffset dto = DateTimeOffset.UtcNow;
Console.WriteLine(dto.Offset);           // 00:00:00`,
    explanation: "`DateTime` carries a `Kind` flag (Local/Utc/Unspecified) but arithmetic and comparisons don't validate it — Local and Utc can be compared silently. `DateTimeOffset` stores the actual offset and is unambiguous.",
  },
  {
    id: "cs-types-generic-math",
    language: "csharp",
    title: "Generic math with static abstract interface members (C# 11)",
    tag: "types",
    code: `using System.Numerics;

// Works with int, double, float, decimal — any INumber<T>
T Sum<T>(IEnumerable<T> items) where T : INumber<T>
    => items.Aggregate(T.Zero, (acc, x) => acc + x);

Console.WriteLine(Sum(new[] { 1, 2, 3 }));          // 6   (int)
Console.WriteLine(Sum(new[] { 1.5, 2.5 }));         // 4   (double)
Console.WriteLine(Sum(new[] { 1m, 2m, 3m }));       // 6   (decimal)`,
    explanation: "C# 11 static abstract interface members let you express `T.Zero`, `T.One`, and operators (`+`, `*`) as constraints. `INumber<T>` from `System.Numerics` enables truly generic arithmetic over any numeric type.",
  },
  {
    id: "cs-families-iasyncenumerable",
    language: "csharp",
    title: "IAsyncEnumerable<T> for async streams",
    tag: "families",
    code: `async IAsyncEnumerable<int> GenerateAsync()
{
    for (int i = 0; i < 5; i++)
    {
        await Task.Delay(100);   // simulate async work
        yield return i;
    }
}

// Consume with await foreach
await foreach (int n in GenerateAsync())
    Console.WriteLine(n);    // 0 1 2 3 4  (one per 100ms)`,
    explanation: "`IAsyncEnumerable<T>` combines async/await with `yield return`, enabling lazy streaming of asynchronously produced data. Use `await foreach` to consume it — it replaces polling or batching patterns.",
  },
  {
    id: "cs-classes-finalizer-dispose",
    language: "csharp",
    title: "IDisposable + finalizer safety net",
    tag: "classes",
    code: `class Resource : IDisposable
{
    private bool _disposed = false;

    public void Dispose()
    {
        Dispose(true);
        GC.SuppressFinalize(this);  // no need for finalizer
    }

    ~Resource()                     // fallback if Dispose not called
    {
        Dispose(false);
    }

    private void Dispose(bool disposing)
    {
        if (_disposed) return;
        if (disposing) { /* free managed resources */ }
        /* free unmanaged resources */
        _disposed = true;
    }
}`,
    explanation: "The standard dispose pattern combines `IDisposable` (for deterministic cleanup via `using`) with a finalizer as a safety net for callers that forget to call `Dispose`. `GC.SuppressFinalize` skips the finalizer when `Dispose` was called.",
  },
  {
    id: "cs-nameof-expr",
    language: "csharp",
    title: "nameof() produces refactor-safe member names",
    tag: "snippet",
    code: `class Order
{
    public string CustomerName { get; set; } = "";

    public void Validate()
    {
        if (string.IsNullOrEmpty(CustomerName))
            throw new ArgumentException(
                "Required",
                paramName: nameof(CustomerName));  // "CustomerName"
    }
}

// Rename CustomerName and nameof updates automatically
// Compared to the fragile string literal: "CustomerName"`,
    explanation: "`nameof(x)` returns the unqualified name of a variable, property, or type as a compile-time string constant. It survives refactoring renames, unlike hand-written string literals.",
  },
  {
    id: "cs-understand-string-equality",
    language: "csharp",
    title: "string == vs ReferenceEquals",
    tag: "understanding",
    code: `string a = "hello";
string b = "hello";

Console.WriteLine(a == b);                    // True  (value equality)
Console.WriteLine(ReferenceEquals(a, b));     // True  (interned — same object)

string c = new string(new[] { 'h','e','l','l','o' });
Console.WriteLine(a == c);                   // True  (value equality)
Console.WriteLine(ReferenceEquals(a, c));    // False (different object)`,
    explanation: "For `string`, `==` compares content (value equality), not references. CPython-style string interning means compile-time string literals often share the same object, but dynamically created strings don't.",
  },
  {
    id: "cs-types-where-notnull",
    language: "csharp",
    title: "where T : notnull generic constraint",
    tag: "types",
    code: `#nullable enable

// T cannot be a nullable reference type or Nullable<T>
class Cache<T> where T : notnull
{
    private readonly Dictionary<string, T> _store = new();

    public T GetOrSet(string key, Func<T> factory)
        => _store.TryGetValue(key, out var val) ? val : _store[key] = factory();
}

Cache<string> c1 = new();    // OK
Cache<int>    c2 = new();    // OK
// Cache<string?> c3 = new(); // warning: string? violates notnull`,
    explanation: "`where T : notnull` prevents `T` from being a nullable reference type (`string?`) or `Nullable<T>` (`int?`). It's essential for containers that need to guarantee stored values aren't null.",
  },
  {
    id: "cs-families-attribute-types",
    language: "csharp",
    title: "Custom Attribute classes",
    tag: "families",
    code: `[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class)]
public class AuthorAttribute : Attribute
{
    public string Name { get; }
    public int Year { get; set; }

    public AuthorAttribute(string name) => Name = name;
}

[Author("Alice", Year = 2024)]
public void Process() { }

// Read at runtime
var attr = typeof(MyClass).GetCustomAttribute<AuthorAttribute>();
Console.WriteLine(attr?.Name);   // "Alice"`,
    explanation: "Custom attributes are classes that derive from `System.Attribute`. `AttributeUsage` controls where they can be applied. Use `GetCustomAttribute<T>` from reflection to read them at runtime.",
  },
  {
    id: "cs-classes-indexer",
    language: "csharp",
    title: "Indexer property for custom subscript syntax",
    tag: "classes",
    code: `class Matrix
{
    private readonly int[,] _data;
    public int Rows { get; }
    public int Cols { get; }

    public Matrix(int rows, int cols)
    {
        Rows = rows; Cols = cols;
        _data = new int[rows, cols];
    }

    public int this[int row, int col]
    {
        get => _data[row, col];
        set => _data[row, col] = value;
    }
}

var m = new Matrix(3, 3);
m[0, 0] = 1;
Console.WriteLine(m[0, 0]);  // 1`,
    explanation: "An indexer uses `this[...]` as the member name and supports `get`/`set` like a property. It lets instances of your class use the `[]` subscript syntax with any parameter types.",
  },
  {
    id: "cs-caveat-event-null",
    language: "csharp",
    title: "Invoking an event safely with null check",
    tag: "caveats",
    code: `class Button
{
    public event EventHandler? Clicked;

    public void Press()
    {
        // BAD: race condition — Clicked might become null after check
        // if (Clicked != null) Clicked(this, EventArgs.Empty);

        // GOOD: capture to local, then invoke
        Clicked?.Invoke(this, EventArgs.Empty);
    }
}`,
    explanation: "Storing the event in a local variable before invoking prevents a race condition where the last subscriber unsubscribes between the null check and the invocation. The `?.Invoke(...)` pattern is the idiomatic safe form.",
  },
  {
    id: "cs-types-nrt-flow",
    language: "csharp",
    title: "Nullable flow analysis narrows types",
    tag: "types",
    code: `#nullable enable

string? GetName() => null;

string? name = GetName();

if (name != null)
{
    // Compiler knows 'name' is non-null here
    Console.WriteLine(name.ToUpper());   // no warning
}

// Pattern matching also narrows
if (name is string s)
    Console.WriteLine(s.ToUpper());    // s is string (non-null)`,
    explanation: "With nullable reference types enabled, the compiler performs flow analysis: after a null check or pattern match that succeeds, the variable is narrowed to the non-nullable type within that branch.",
  },
  {
    id: "cs-families-delegate-types",
    language: "csharp",
    title: "delegate declaration vs Func/Action",
    tag: "families",
    code: `// Named delegate type — defines a distinct type
delegate int Transformer(int input);

// Func/Action — predefined generic delegates (no new type)
Func<int, int>    f1 = x => x * 2;
Transformer       t1 = x => x * 2;   // same lambda

// They are NOT interchangeable despite same signature!
// Transformer t2 = f1;   // compile error

// Use Func/Action for callbacks; named delegates for APIs
// that need a distinct overload or a clear semantic name`,
    explanation: "A named `delegate` type is structurally compatible with `Func<>` but is a distinct CLR type — they cannot be assigned to each other. Use `Func`/`Action` for generic callbacks; named delegates when you need a specific semantic identity.",
  },
  {
    id: "cs-classes-conversion-operator",
    language: "csharp",
    title: "Implicit and explicit conversion operators",
    tag: "classes",
    code: `readonly struct Celsius
{
    public double Value { get; }
    public Celsius(double v) => Value = v;

    // Implicit: safe, loss-free
    public static implicit operator double(Celsius c) => c.Value;

    // Explicit: may lose precision or throw
    public static explicit operator Celsius(double d) => new(d);

    public override string ToString() => \`\${Value}°C\`;
}

Celsius c = (Celsius)100.0;   // explicit cast needed
double d = c;                  // implicit conversion
Console.WriteLine(d);          // 100`,
    explanation: "Define `implicit` conversions when they're always safe and loss-free; define `explicit` conversions when information might be lost or an exception might be thrown — forcing the caller to acknowledge the risk with a cast.",
  },
  {
    id: "cs-classes-factory-method",
    language: "csharp",
    title: "Static factory method pattern",
    tag: "classes",
    code: `class Connection
{
    private Connection(string host, int port)
    {
        Host = host; Port = port;
    }

    public string Host { get; }
    public int Port { get; }

    public static Connection Create(string connectionString)
    {
        var parts = connectionString.Split(':');
        if (parts.Length != 2 || !int.TryParse(parts[1], out int port))
            throw new FormatException("Expected host:port");
        return new Connection(parts[0], port);
    }
}

var c = Connection.Create("localhost:5432");`,
    explanation: "A private constructor with a public static factory method lets you name the creation intent, validate input, and return null (or throw) before allocating — unlike constructors which always create or throw.",
  },
  {
    id: "cs-collection-spread",
    language: "csharp",
    title: "Spread operator in collection expressions (C# 12)",
    tag: "snippet",
    code: `int[] first = [1, 2, 3];
int[] second = [4, 5, 6];

// Spread with ..
int[] combined = [..first, ..second];
Console.WriteLine(string.Join(",", combined));  // 1,2,3,4,5,6

// Combine with literal elements
int[] expanded = [0, ..first, 10, ..second, 20];
Console.WriteLine(string.Join(",", expanded));  // 0,1,2,3,10,4,5,6,20`,
    explanation: "The `..` spread operator inside a collection expression inlines all elements from another collection. It works with any type that's enumerable and can be mixed freely with literal elements.",
  },
  {
    id: "cs-caveat-using-dispose",
    language: "csharp",
    title: "using statement guarantees Dispose even on exception",
    tag: "caveats",
    code: `// BAD: Dispose not called if an exception occurs before the try block
FileStream? fs = null;
try {
    fs = new FileStream("f.txt", FileMode.Open);
    // ... work ...
} finally {
    fs?.Dispose();
}

// GOOD: using compiles to exactly the above pattern
using var file = new FileStream("f.txt", FileMode.Open);
// Dispose called at end of scope, even if exception thrown`,
    explanation: "`using` compiles to a try/finally that calls `Dispose()` on exit — even when an exception is thrown. Prefer the `using var` declaration form (C# 8+) over the block form to reduce nesting.",
  },
  {
    id: "cs-types-open-generic",
    language: "csharp",
    title: "Open vs closed generic types at runtime",
    tag: "types",
    code: `Type open   = typeof(List<>);           // open generic: no type arg
Type closed = typeof(List<string>);      // closed generic: fully specified

Console.WriteLine(open.IsGenericTypeDefinition);   // True
Console.WriteLine(closed.IsGenericTypeDefinition); // False
Console.WriteLine(closed.GetGenericTypeDefinition() == open);  // True

// Construct a closed type from an open type at runtime
Type constructed = open.MakeGenericType(typeof(int));
var list = (System.Collections.IList)Activator.CreateInstance(constructed)!;`,
    explanation: "`typeof(List<>)` is an 'open' generic — no type argument supplied. `MakeGenericType` creates a closed type at runtime, enabling dynamic instantiation of generic types from configuration or reflection.",
  },
  {
    id: "cs-classes-params-modifier",
    language: "csharp",
    title: "params allows variable-length argument lists",
    tag: "classes",
    code: `int Sum(params int[] numbers)
    => numbers.Sum();

Console.WriteLine(Sum(1, 2, 3));        // 6
Console.WriteLine(Sum(1, 2, 3, 4, 5)); // 15
Console.WriteLine(Sum());               // 0

// C# 13: params can accept IEnumerable<T>, ReadOnlySpan<T>, etc.
void Print(params IEnumerable<string> items)
{
    foreach (var s in items) Console.Write(s + " ");
}`,
    explanation: "`params` allows a method to accept zero or more arguments of the specified type without the caller constructing an array. C# 13 extended `params` to work with `Span<T>`, `IEnumerable<T>`, and other collection types.",
  },
  {
    id: "cs-caveat-decimal-literal",
    language: "csharp",
    title: "Decimal literals require the M suffix",
    tag: "caveats",
    code: `decimal price = 9.99m;    // OK: 'm' or 'M' suffix
// decimal bad = 9.99;    // error: cannot implicitly convert double to decimal

double d = 9.99;          // no suffix = double by default
float  f = 9.99f;         // 'f' suffix = float
long   l = 100L;          // 'L' suffix = long

// Arithmetic with mixed types:
decimal total = price * 2m;     // OK
// decimal bad2 = price + d;    // error: no implicit decimal/double conversion`,
    explanation: "Numeric literals default to `double` (floating-point) or `int` (integer). Suffix `m`/`M` makes a literal `decimal`; `f`/`F` makes it `float`. Mixing `decimal` with `double` requires explicit casting.",
  },
];
