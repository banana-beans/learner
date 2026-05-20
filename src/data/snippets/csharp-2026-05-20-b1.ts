import type { Snippet } from "./types";

export const csharpSnippets20260520B1: Snippet[] = [
  {
    id: "cs-0520-b1-linq-select-transform",
    language: "csharp",
    title: "LINQ Select for projection",
    tag: "snippet",
    code: `var names = new[] { "alice", "bob", "carol" };

// Project to a new shape
var titled = names.Select(n => char.ToUpper(n[0]) + n[1..])
                  .ToList();
// ["Alice", "Bob", "Carol"]

// Project to anonymous type
var scores = new[] { ("Alice", 92), ("Bob", 85) };
var report = scores.Select((t, i) => new {
    Rank  = i + 1,
    Name  = t.Item1,
    Score = t.Item2
}).ToList();
Console.WriteLine(report[0]);  // { Rank = 1, Name = Alice, Score = 92 }`,
    explanation: "`Select` maps each element to a new shape — the two-argument overload passes the index as well, letting you rank items inline without a separate counter variable.",
  },
  {
    id: "cs-0520-b1-value-vs-reference",
    language: "csharp",
    title: "value types vs reference types in assignments",
    tag: "understanding",
    code: `// Value types: copy on assignment
int a = 10;
int b = a;
b = 20;
Console.WriteLine(a); // 10 — unaffected

// Reference types: share the same object
int[] arr1 = { 1, 2, 3 };
int[] arr2 = arr1;
arr2[0] = 99;
Console.WriteLine(arr1[0]); // 99 — both point to same array

// struct vs class follows the same rule
record struct Point(int X, int Y);  // value semantics
var p1 = new Point(1, 2);
var p2 = p1;
p2 = p2 with { X = 99 };
Console.WriteLine(p1.X); // 1 — p1 unaffected`,
    explanation: "Value types (struct, int, bool, etc.) are copied on assignment; reference types (class, array, delegate) share the underlying heap object — mutations through one alias affect all aliases.",
  },
  {
    id: "cs-0520-b1-list-linkedlist",
    language: "csharp",
    title: "List<T> vs LinkedList<T>",
    tag: "structures",
    code: `using System.Collections.Generic;

var list = new List<int> { 1, 2, 3, 4 };
list.Insert(0, 0);       // O(n) — shifts all elements

var linked = new LinkedList<int>(new[] { 1, 2, 3, 4 });
var node = linked.Find(2)!;
linked.AddBefore(node, 99);  // O(1) once node is found
// [1, 99, 2, 3, 4]

// List<T>: O(1) random access, O(n) insert/remove at arbitrary position
// LinkedList<T>: O(n) lookup, O(1) insert/remove given a node`,
    explanation: "`List<T>` is backed by an array — fast random access and cache-friendly iteration, but O(n) insertions; `LinkedList<T>` gives O(1) insertions given a node, but node-based storage is pointer-heavy and cache-unfriendly.",
  },
  {
    id: "cs-0520-b1-async-void-caveat",
    language: "csharp",
    title: "async void swallows exceptions",
    tag: "caveats",
    code: `// async void: exceptions are unobservable — crash the process
async void FireAndForget()
{
    await Task.Delay(10);
    throw new Exception("lost!");  // crashes the whole app
}

// async Task: caller can observe exceptions
async Task SafeOperation()
{
    await Task.Delay(10);
    throw new Exception("catchable");
}

// Event handlers are the only legitimate use of async void
button.Click += async (s, e) =>
{
    await DoWorkAsync();   // still risky if DoWorkAsync throws
};`,
    explanation: "`async void` methods cannot be awaited, so their exceptions are raised on the thread pool and crash the process — only use it for event handlers (where the delegate signature forces `void`), and wrap the body in a try/catch.",
  },
  {
    id: "cs-0520-b1-int-long-nint",
    language: "csharp",
    title: "int vs long vs nint",
    tag: "types",
    code: `int    i = int.MaxValue;       // 2,147,483,647  (32-bit signed)
long   l = long.MaxValue;      // 9,223,372,036,854,775,807  (64-bit signed)
nint   n = nint.MaxValue;      // platform-sized (32 or 64 bit)
nuint  u = nuint.MaxValue;     // platform-sized unsigned

// Overflow: checked vs unchecked
checked
{
    try { int x = i + 1; }
    catch (OverflowException) { Console.WriteLine("overflow"); }
}

// unchecked (default): wraps silently
int wrapped = unchecked(i + 1);
Console.WriteLine(wrapped);  // -2147483648`,
    explanation: "`nint`/`nuint` are pointer-sized integers that match `IntPtr`/`UIntPtr` at runtime — useful for P/Invoke and unsafe pointer arithmetic; `checked` contexts convert silent integer overflow into a runtime exception.",
  },
  {
    id: "cs-0520-b1-ienumerable-ilist-ireadonly",
    language: "csharp",
    title: "IEnumerable<T> vs IList<T> vs IReadOnlyList<T>",
    tag: "families",
    code: `using System.Collections.Generic;

IEnumerable<int> e = new[] { 1, 2, 3 };  // read, iterate; deferred OK
IList<int>       l = new List<int> { 1, 2, 3 }; // indexed read+write
IReadOnlyList<int> r = new[] { 1, 2, 3 };        // indexed read, no mutation

// IEnumerable: widest contract, most callers should accept this
// IReadOnlyList: expose collections safely without allowing mutation
// IList: only when callers need to mutate by index

void PrintAll(IEnumerable<int> items)    // accept broadest type
{
    foreach (var x in items) Console.Write(x + " ");
}`,
    explanation: "Program to the narrowest interface callers need: accept `IEnumerable<T>` when you only iterate, expose `IReadOnlyList<T>` from properties to prevent external mutation, and use `IList<T>` only when indexed writes are required.",
  },
  {
    id: "cs-0520-b1-abstract-vs-interface",
    language: "csharp",
    title: "abstract class vs interface — when to use each",
    tag: "classes",
    code: `// Abstract class: shared state + partial implementation
abstract class Animal
{
    public string Name { get; }
    protected Animal(string name) => Name = name;
    public abstract string Speak();          // must override
    public virtual string Describe() => $"I am {Name}";  // may override
}

// Interface: pure contract, multiple inheritance, no state
interface IMovable { void Move(int dx, int dy); }
interface IResizable { void Resize(double factor); }

class Dog : Animal, IMovable
{
    public Dog(string name) : base(name) { }
    public override string Speak() => "Woof";
    public void Move(int dx, int dy) => Console.WriteLine($"Dog moved by {dx},{dy}");
}`,
    explanation: "Use an abstract class when you have shared state or a partial implementation to distribute; use an interface for a pure behavioral contract, especially when a class needs to satisfy multiple contracts — C# supports only single class inheritance but multiple interface implementation.",
  },
  {
    id: "cs-0520-b1-linq-groupby",
    language: "csharp",
    title: "LINQ GroupBy for categorized collections",
    tag: "snippet",
    code: `var words = new[] { "apple", "ant", "banana", "avocado", "blueberry", "cherry" };

var byFirstLetter = words
    .GroupBy(w => w[0])
    .OrderBy(g => g.Key)
    .Select(g => new { Letter = g.Key, Words = g.ToList() });

foreach (var group in byFirstLetter)
    Console.WriteLine($"{group.Letter}: {string.Join(", ", group.Words)}");
// a: apple, ant, avocado
// b: banana, blueberry
// c: cherry`,
    explanation: "`GroupBy` returns `IEnumerable<IGrouping<TKey, TElement>>` where each group exposes its `Key` and acts as an `IEnumerable<TElement>` — projection with `Select` converts the groups to whatever shape you need.",
  },
  {
    id: "cs-0520-b1-boxing-unboxing",
    language: "csharp",
    title: "boxing and unboxing overhead",
    tag: "understanding",
    code: `int val = 42;
object boxed = val;           // boxing: allocates heap object, copies int
int unboxed = (int)boxed;     // unboxing: copies int back out

// Hidden boxing in non-generic collections
System.Collections.ArrayList list = new();
list.Add(val);               // boxes val
int x = (int)list[0];       // unboxes

// Generic collections avoid boxing entirely
var genericList = new List<int>();
genericList.Add(val);        // no allocation
int y = genericList[0];      // no cast, no allocation

// Check: does interface call on struct box?
interface IFoo { void Do(); }
struct MyStruct : IFoo { public void Do() { } }
IFoo foo = new MyStruct();   // YES — boxes the struct`,
    explanation: "Every value-type-to-`object` (or interface) conversion allocates a heap object and copies the value — avoid boxing in hot paths by using generic collections, generic constraints, or `where T : struct` specializations.",
  },
  {
    id: "cs-0520-b1-dict-sorteddict-sortedlist",
    language: "csharp",
    title: "Dictionary vs SortedDictionary vs SortedList",
    tag: "structures",
    code: `using System.Collections.Generic;

// Dictionary<K,V>: O(1) avg lookup, no order guarantee
var dict = new Dictionary<string, int> { ["b"] = 2, ["a"] = 1 };

// SortedDictionary<K,V>: O(log n) lookup/insert, backed by red-black tree
var sortedDict = new SortedDictionary<string, int>(dict);
Console.WriteLine(string.Join(", ", sortedDict.Keys)); // a, b

// SortedList<K,V>: O(log n) lookup, O(n) insert, backed by two arrays
// — less memory, faster iteration, slower insertion than SortedDictionary
var sortedList = new SortedList<string, int>(dict);
Console.WriteLine(sortedList.IndexOfKey("a")); // 0 (positional access)`,
    explanation: "Use `Dictionary` when order doesn't matter and speed is paramount; `SortedDictionary` when you need sorted keys with frequent insertions/deletions; `SortedList` when the collection is built once and then iterated or accessed by position.",
  },
  {
    id: "cs-0520-b1-configure-await",
    language: "csharp",
    title: "ConfigureAwait(false) in library code",
    tag: "caveats",
    code: `// Library code: don't capture the sync context
public async Task<string> FetchDataAsync(string url)
{
    using var client = new HttpClient();
    // ConfigureAwait(false): resume on any thread, not the original context
    var response = await client.GetAsync(url).ConfigureAwait(false);
    var content  = await response.Content.ReadAsStringAsync().ConfigureAwait(false);
    return content;
}

// Application code (UI, ASP.NET): usually OK to omit
// because the context is already managed by the framework
public async Task OnButtonClick()
{
    var data = await FetchDataAsync("https://example.com");
    label.Text = data;  // must be on UI thread — sync context matters here
}`,
    explanation: "Without `ConfigureAwait(false)`, a library's `await` captures the caller's synchronization context and tries to resume on it — in UI apps this can deadlock if the UI thread is blocked waiting for the task; library code should always use `false`.",
  },
  {
    id: "cs-0520-b1-decimal-vs-double",
    language: "csharp",
    title: "decimal vs double — precision and range",
    tag: "types",
    code: `double d1 = 0.1 + 0.2;
Console.WriteLine(d1);          // 0.30000000000000004
Console.WriteLine(d1 == 0.3);   // False

decimal m1 = 0.1m + 0.2m;
Console.WriteLine(m1);          // 0.3
Console.WriteLine(m1 == 0.3m);  // True

// Range: double >> decimal; precision: decimal wins for base-10
Console.WriteLine(double.MaxValue);   // ~1.8E+308
Console.WriteLine(decimal.MaxValue);  // 79,228,162,514,264,337,593,543,950,335
Console.WriteLine(decimal.MaxValue.GetType()); // System.Decimal`,
    explanation: "`decimal` uses base-10 representation with 28–29 significant digits — exact for money and base-10 fractions; `double` is base-2 and faster but cannot represent 0.1 exactly, making it unsuitable for financial calculations.",
  },
  {
    id: "cs-0520-b1-task-valuetask",
    language: "csharp",
    title: "Task<T> vs ValueTask<T>",
    tag: "families",
    code: `// Task<T>: always allocates a heap object
async Task<int> SlowAsync() { await Task.Delay(100); return 42; }

// ValueTask<T>: zero-allocation when result is synchronously available
async ValueTask<int> FastAsync(bool cached)
{
    if (cached) return 42;           // no allocation
    await Task.Delay(100);
    return 42;                       // allocates Task internally
}

// Rules:
// - Await ValueTask only once, and only directly
// - Don't store it in a variable and await it later
// - Convert to Task first if you need to share it
var vt = FastAsync(cached: true);
int result = await vt;  // OK`,
    explanation: "`ValueTask<T>` avoids heap allocation when the result is already known (common in caching layers) — but it's a struct that can only be awaited once; use `Task<T>` when the result is always asynchronous or when you need to share the task.",
  },
  {
    id: "cs-0520-b1-sealed-override",
    language: "csharp",
    title: "sealed override prevents further overriding",
    tag: "classes",
    code: `abstract class Shape
{
    public abstract double Area { get; }
    public virtual string Label => "Shape";
}

class Circle : Shape
{
    public double Radius { get; }
    public Circle(double r) => Radius = r;
    public override double Area => Math.PI * Radius * Radius;
    public sealed override string Label => "Circle";  // no further overrides
}

// class BigCircle : Circle
// {
//     public override string Label => "Big Circle";  // compile error!
// }`,
    explanation: "`sealed override` stops the inheritance chain at that point — it's a performance hint to the JIT (allows devirtualization) and an API contract that tells subclass authors the method won't be extensible.",
  },
  {
    id: "cs-0520-b1-switch-expression",
    language: "csharp",
    title: "switch expression with pattern matching",
    tag: "snippet",
    code: `record Point(double X, double Y);

static string Classify(object shape) => shape switch
{
    Point { X: 0, Y: 0 }   => "origin",
    Point { X: var x, Y: 0 } when x > 0 => "positive x-axis",
    Point p                 => $"point ({p.X}, {p.Y})",
    int n when n < 0        => "negative int",
    string s                => $"string: {s}",
    null                    => "null",
    _                       => "unknown"
};

Console.WriteLine(Classify(new Point(0, 0)));   // origin
Console.WriteLine(Classify(new Point(3, 0)));   // positive x-axis
Console.WriteLine(Classify(-5));                // negative int`,
    explanation: "Switch expressions return a value and must be exhaustive; pattern matching arms can combine property patterns, tuple patterns, type patterns, and `when` guards — the compiler checks for unreachable arms and missing cases.",
  },
  {
    id: "cs-0520-b1-deferred-execution",
    language: "csharp",
    title: "LINQ deferred execution surprise",
    tag: "understanding",
    code: `var source = new List<int> { 1, 2, 3 };

var query = source.Where(x => x > 1);  // nothing runs yet

source.Add(4);  // mutate source AFTER defining query

foreach (var x in query)
    Console.Write(x + " ");   // 2 3 4  — includes 4!

// Materialize to snapshot the result:
var snapshot = source.Where(x => x > 1).ToList();
source.Add(5);
Console.WriteLine(snapshot.Count);  // 3  — not 4`,
    explanation: "LINQ operators like `Where` and `Select` build a query description, not a result — execution happens at enumeration time; mutations to the source between query definition and enumeration are visible, which surprises many developers.",
  },
  {
    id: "cs-0520-b1-hashset-sortedset",
    language: "csharp",
    title: "HashSet<T> vs SortedSet<T>",
    tag: "structures",
    code: `var hs = new HashSet<int> { 5, 3, 1, 4, 2 };
Console.WriteLine(string.Join(", ", hs));   // order undefined

var ss = new SortedSet<int> { 5, 3, 1, 4, 2 };
Console.WriteLine(string.Join(", ", ss));   // 1, 2, 3, 4, 5

// Set operations (both types)
var a = new HashSet<int> { 1, 2, 3 };
var b = new HashSet<int> { 2, 3, 4 };
a.IntersectWith(b);
Console.WriteLine(string.Join(", ", a));    // 2, 3

// SortedSet extras: range query
var range = ss.GetViewBetween(2, 4);
Console.WriteLine(string.Join(", ", range)); // 2, 3, 4`,
    explanation: "`HashSet<T>` gives O(1) average add/remove/contains; `SortedSet<T>` uses a red-black tree for O(log n) operations but keeps elements sorted and supports range views — choose sorted when you need ordered traversal or `GetViewBetween`.",
  },
  {
    id: "cs-0520-b1-captured-lambda-loop",
    language: "csharp",
    title: "captured loop variable in lambdas",
    tag: "caveats",
    code: `// Classic C# gotcha (pre-C# 5 foreach, still true for for-loops)
var actions = new List<Action>();
for (int i = 0; i < 3; i++)
{
    actions.Add(() => Console.Write(i + " "));  // captures 'i' by reference
}
actions.ForEach(a => a());  // 3 3 3 — all see final value of i

// Fix: capture a local copy
actions.Clear();
for (int i = 0; i < 3; i++)
{
    int captured = i;
    actions.Add(() => Console.Write(captured + " "));
}
actions.ForEach(a => a());  // 0 1 2`,
    explanation: "Loop variables in `for` loops are a single variable shared across iterations — lambdas capture the variable itself, not its current value, so all lambdas see the final value; create a local copy inside the loop to snapshot each iteration's value.",
  },
  {
    id: "cs-0520-b1-nullable-value-type",
    language: "csharp",
    title: "Nullable<T> and T? for value types",
    tag: "types",
    code: `int? maybeInt = null;           // Nullable<int>
Console.WriteLine(maybeInt.HasValue);   // False
Console.WriteLine(maybeInt ?? -1);      // -1  (null-coalescing)

maybeInt = 42;
Console.WriteLine(maybeInt.Value);      // 42
Console.WriteLine(maybeInt.GetValueOrDefault(0));  // 42

// Lifted operators: arithmetic propagates null
int? a = 5, b = null;
Console.WriteLine(a + b);   // null  (not 5)
Console.WriteLine(a + 3);   // 8

// Null check patterns
if (maybeInt is int actual)
    Console.WriteLine(actual);  // 42`,
    explanation: "`Nullable<T>` (sugar: `T?`) wraps a value type with a `HasValue` flag — arithmetic is 'lifted', meaning any operation involving `null` returns `null`; pattern matching with `is int actual` is the modern way to safely extract the value.",
  },
  {
    id: "cs-0520-b1-delegate-func-action",
    language: "csharp",
    title: "delegate vs Func vs Action vs Predicate",
    tag: "families",
    code: `// Named delegate type
delegate int Transform(int x);

// Generic Func<TResult>, Func<T, TResult>, ...
Func<int, int>       double_  = x => x * 2;
Func<int, int, int>  add      = (a, b) => a + b;

// Action<T>: returns void
Action<string> print = s => Console.WriteLine(s);

// Predicate<T>: returns bool
Predicate<int> isEven = n => n % 2 == 0;

// They're all delegates under the hood
Transform t = double_;   // compatible signature
Console.WriteLine(t(5));   // 10
Console.WriteLine(isEven(4));  // True`,
    explanation: "`Func<..., TResult>` and `Action<...>` cover most cases without defining a custom delegate type; `Predicate<T>` is a legacy alias for `Func<T, bool>` found in older APIs; prefer `Func`/`Action` in new code for consistency.",
  },
  {
    id: "cs-0520-b1-record-class-vs-class",
    language: "csharp",
    title: "record class vs regular class",
    tag: "classes",
    code: `// record class: value equality, non-destructive mutation, init-only
record class Person(string Name, int Age);

var p1 = new Person("Alice", 30);
var p2 = new Person("Alice", 30);
Console.WriteLine(p1 == p2);   // True  (value equality, not reference)
Console.WriteLine(p1.Equals(p2));   // True

var p3 = p1 with { Age = 31 };   // non-destructive copy
Console.WriteLine(p3);   // Person { Name = Alice, Age = 31 }

// Regular class: reference equality by default
class PersonClass { public string Name; public int Age; }
var c1 = new PersonClass { Name = "Alice", Age = 30 };
var c2 = new PersonClass { Name = "Alice", Age = 30 };
Console.WriteLine(c1 == c2);   // False`,
    explanation: "`record class` auto-generates `Equals`, `GetHashCode`, `==`, and `ToString` based on all positional properties — use it for immutable data transfer objects; use `class` when you need reference identity semantics or mutable state.",
  },
  {
    id: "cs-0520-b1-null-coalescing-assign",
    language: "csharp",
    title: "null-coalescing assignment ??=",
    tag: "snippet",
    code: `string? cache = null;

// Without ??=
if (cache == null)
    cache = "default";

// With ??=: assigns only if left side is null
cache = null;
cache ??= "default";
Console.WriteLine(cache);  // default

cache ??= "other";          // cache is already non-null
Console.WriteLine(cache);  // default  (unchanged)

// Useful for lazy initialization
class Config
{
    private List<string>? _items;
    public List<string> Items => _items ??= new List<string>();
}`,
    explanation: "`??=` (null-coalescing assignment) only evaluates and assigns the right-hand side when the left-hand side is `null`, making it the idiomatic one-liner for lazy initialization and null-safe default patterns.",
  },
  {
    id: "cs-0520-b1-async-state-machine",
    language: "csharp",
    title: "async/await generates a state machine",
    tag: "understanding",
    code: `// This simple method...
async Task<int> ComputeAsync()
{
    int a = await Task.FromResult(1);
    int b = await Task.FromResult(2);
    return a + b;
}

// ...compiles to roughly a struct state machine with states:
// State 0: start, call first await
// State 1: resume, capture a, call second await
// State 2: resume, capture b, return a+b
// The MoveNext() method handles each state transition

// Practical consequence: local variables become fields on the struct
// Avoid large stack-allocated buffers across await points`,
    explanation: "The compiler transforms every `async` method into a state machine struct — each `await` point is a state boundary and local variables that span awaits become fields; this is why awaiting in a loop creates minimal overhead compared to manual callbacks.",
  },
  {
    id: "cs-0520-b1-stack-queue",
    language: "csharp",
    title: "Stack<T> vs Queue<T> vs LinkedList as deque",
    tag: "structures",
    code: `var stack = new Stack<int>();
stack.Push(1); stack.Push(2); stack.Push(3);
Console.WriteLine(stack.Pop());    // 3  (LIFO)
Console.WriteLine(stack.Peek());   // 2  (no remove)

var queue = new Queue<int>();
queue.Enqueue(1); queue.Enqueue(2); queue.Enqueue(3);
Console.WriteLine(queue.Dequeue()); // 1  (FIFO)

// Deque pattern with LinkedList
var deque = new LinkedList<int>();
deque.AddFirst(0);    // prepend
deque.AddLast(1);     // append
deque.RemoveFirst();  // O(1)
deque.RemoveLast();   // O(1)`,
    explanation: "`Stack<T>` and `Queue<T>` are thin wrappers over arrays with O(1) amortized push/pop; use `LinkedList<T>` when you need O(1) operations on both ends (deque), but accept that it's not cache-friendly compared to array-backed structures.",
  },
  {
    id: "cs-0520-b1-struct-interface-boxing",
    language: "csharp",
    title: "struct assignment to interface causes boxing",
    tag: "caveats",
    code: `interface ICounter { void Increment(); int Value { get; } }

struct Counter : ICounter
{
    public int Value { get; private set; }
    public void Increment() => Value++;
}

Counter c = new Counter();
c.Increment();
Console.WriteLine(c.Value);  // 1

// Assign to interface: boxes a COPY
ICounter ic = c;
ic.Increment();              // increments the boxed copy
Console.WriteLine(c.Value);  // still 1 — original struct unaffected
Console.WriteLine(ic.Value); // 2`,
    explanation: "Assigning a struct to an interface variable boxes a copy of the struct — mutations through the interface affect only the box, not the original; this silent copy is the main reason mutable structs implementing interfaces are discouraged.",
  },
  {
    id: "cs-0520-b1-var-dynamic-object",
    language: "csharp",
    title: "var vs dynamic vs object",
    tag: "types",
    code: `// var: statically typed, type inferred at compile time
var x = 42;       // int — compiler knows the type
x = "hello";      // compile error: cannot assign string to int

// object: base type of everything, needs cast to use
object o = 42;
int v = (int)o;   // runtime cast, can throw InvalidCastException

// dynamic: bypass static typing, resolved at runtime
dynamic d = 42;
d = "hello";      // OK — type can change
Console.WriteLine(d.Length);  // 5 — resolved at runtime
d = 99;
// Console.WriteLine(d.Length); // RuntimeBinderException at runtime`,
    explanation: "`var` is still statically typed — the compiler infers the type, so you get full IntelliSense and compile-time safety; `dynamic` defers all type checks to runtime and is essentially `object` with late binding — use it only for interop with COM or dynamic languages.",
  },
  {
    id: "cs-0520-b1-ienumerable-iqueryable",
    language: "csharp",
    title: "IEnumerable<T> vs IQueryable<T>",
    tag: "families",
    code: `// IEnumerable: in-memory, LINQ to Objects, executes in C#
var inMemory = new[] { 1, 2, 3, 4, 5 }.AsEnumerable();
var filtered = inMemory.Where(x => x > 2);  // runs C# lambda

// IQueryable: translatable query, LINQ to SQL/EF, builds expression tree
// IQueryable<User> users = dbContext.Users;
// var adults = users.Where(u => u.Age >= 18); // translates to SQL WHERE
// var sql = adults.ToQueryString(); // SELECT ... WHERE Age >= 18

// Key: AsEnumerable() forces execution in memory from that point
// var partial = users.Where(u => u.Age >= 18)  // SQL filter
//                    .AsEnumerable()
//                    .Where(u => SomeLocalMethod(u));  // C# filter`,
    explanation: "`IQueryable<T>` builds an expression tree that providers like Entity Framework translate to SQL — use it as long as possible to push filters to the database; `AsEnumerable()` forces materialization, so everything after it runs in C#.",
  },
  {
    id: "cs-0520-b1-partial-class",
    language: "csharp",
    title: "partial class for generated code",
    tag: "classes",
    code: `// File: Form1.designer.cs (generated by WinForms designer)
partial class Form1
{
    private System.Windows.Forms.Button btnSubmit;
    private void InitializeComponent() { /* ... */ }
}

// File: Form1.cs (your code)
partial class Form1 : System.Windows.Forms.Form
{
    public Form1() => InitializeComponent();

    private void btnSubmit_Click(object sender, EventArgs e)
    {
        Console.WriteLine("Submitted!");
    }
}

// Also used with source generators:
partial class MyClass
{
    // Source generator adds methods to this class in a separate file
}`,
    explanation: "`partial class` splits one class across multiple files, letting code generators (WinForms designer, Roslyn source generators) own one file while you own another — neither file needs to know about the other's methods.",
  },
  {
    id: "cs-0520-b1-init-property",
    language: "csharp",
    title: "init-only properties and object initializers",
    tag: "snippet",
    code: `class Order
{
    public int Id      { get; init; }     // settable only during init
    public string Item { get; init; } = string.Empty;
    public int Quantity { get; init; } = 1;
}

var order = new Order { Id = 1, Item = "Widget", Quantity = 5 };
Console.WriteLine(order.Item);   // Widget

// order.Id = 2;  // compile error: init-only property

// Works with record syntax too
record Product(string Name, decimal Price);
var p = new Product("Bolt", 0.99m);
var cheaper = p with { Price = 0.75m };  // records use init internally`,
    explanation: "`init` accessors allow setting during object initializer syntax (`new Foo { X = 1 }`) but are read-only after construction — giving immutability without forcing you to pass everything through the constructor.",
  },
  {
    id: "cs-0520-b1-struct-copy",
    language: "csharp",
    title: "struct copy semantics in method calls",
    tag: "understanding",
    code: `struct Vector
{
    public double X, Y;
    public void Scale(double factor) { X *= factor; Y *= factor; }
}

Vector v = new Vector { X = 1, Y = 2 };

// Method on struct: receives a COPY — mutation lost
void BadScale(Vector vec)  // vec is a copy
{
    vec.Scale(2);
}
BadScale(v);
Console.WriteLine(v.X);  // 1 — unchanged

// Fix: ref parameter
void GoodScale(ref Vector vec)
{
    vec.Scale(2);
}
GoodScale(ref v);
Console.WriteLine(v.X);  // 2`,
    explanation: "Structs are passed by value — every method call, assignment, and collection storage makes a copy; use `ref` parameters or `ref` locals to operate on the original, and prefer immutable structs to avoid the confusion of mutable-but-copied semantics.",
  },
  {
    id: "cs-0520-b1-concurrent-dict",
    language: "csharp",
    title: "ConcurrentDictionary for thread-safe maps",
    tag: "structures",
    code: `using System.Collections.Concurrent;

var counts = new ConcurrentDictionary<string, int>();

// GetOrAdd: atomic — creates only if absent
counts.GetOrAdd("apple", 0);

// AddOrUpdate: atomic read-modify-write
Parallel.ForEach(new[] { "apple", "apple", "banana" }, word =>
{
    counts.AddOrUpdate(word, 1, (key, old) => old + 1);
});

Console.WriteLine(counts["apple"]);   // 2
Console.WriteLine(counts["banana"]);  // 1

// TryGetValue is safe without locking
if (counts.TryGetValue("cherry", out var n))
    Console.WriteLine(n);`,
    explanation: "`ConcurrentDictionary` uses fine-grained locking (one lock per bucket stripe) — `GetOrAdd` and `AddOrUpdate` are atomic, but the factory delegate can be called multiple times under contention; prefer `AddOrUpdate` over a read-then-write pattern.",
  },
  {
    id: "cs-0520-b1-integer-overflow",
    language: "csharp",
    title: "integer overflow: checked vs unchecked",
    tag: "caveats",
    code: `int max = int.MaxValue;  // 2,147,483,647

// unchecked (default): wraps silently
int wrapped = max + 1;
Console.WriteLine(wrapped);  // -2147483648 — silent data corruption

// checked: throws OverflowException
try
{
    checked { int boom = max + 1; }
}
catch (OverflowException e)
{
    Console.WriteLine(e.Message);  // Arithmetic operation resulted in an overflow
}

// Project-wide: <CheckForOverflowUnderflow>true</CheckForOverflowUnderflow>
// Opt out locally:
int fast = unchecked(max + 1);  // explicit unchecked block`,
    explanation: "C# defaults to unchecked arithmetic, silently wrapping on overflow — in security or financial contexts, enable `<CheckForOverflowUnderflow>true</CheckForOverflowUnderflow>` in the project file or use `checked {}` blocks around sensitive calculations.",
  },
  {
    id: "cs-0520-b1-record-struct-vs-struct",
    language: "csharp",
    title: "record struct vs plain struct",
    tag: "types",
    code: `// Plain struct: no auto-generated equality, ToString is type name
struct PlainPoint { public int X, Y; }
var pp1 = new PlainPoint { X = 1, Y = 2 };
var pp2 = new PlainPoint { X = 1, Y = 2 };
Console.WriteLine(pp1 == pp2);  // True (struct default == compares fields)

// record struct: auto-generated Equals, GetHashCode, ToString, with expression
record struct RecordPoint(int X, int Y);
var rp1 = new RecordPoint(1, 2);
var rp2 = rp1 with { Y = 99 };    // non-destructive copy
Console.WriteLine(rp1);           // RecordPoint { X = 1, Y = 2 }
Console.WriteLine(rp1 == rp2);    // False`,
    explanation: "`record struct` generates value equality, a `ToString` with property names, and `with` expression support — all as a value type; plain `struct` has field-wise `==` by default but no `ToString` override or `with`.",
  },
  {
    id: "cs-0520-b1-cancellation-token",
    language: "csharp",
    title: "CancellationToken cooperative cancellation",
    tag: "families",
    code: `using var cts = new CancellationTokenSource();
cts.CancelAfter(TimeSpan.FromSeconds(2));  // auto-cancel after 2s

async Task DoWorkAsync(CancellationToken ct)
{
    for (int i = 0; i < 100; i++)
    {
        ct.ThrowIfCancellationRequested();   // check manually
        await Task.Delay(100, ct);           // or pass to awaitable
        Console.Write(i + " ");
    }
}

try
{
    await DoWorkAsync(cts.Token);
}
catch (OperationCanceledException)
{
    Console.WriteLine("\\nCancelled!");
}`,
    explanation: "`CancellationToken` is passed through the call stack and checked cooperatively — `ThrowIfCancellationRequested()` or passing the token to awaitable methods like `Task.Delay` allows clean, structured cancellation without polling a shared flag.",
  },
  {
    id: "cs-0520-b1-explicit-interface",
    language: "csharp",
    title: "explicit interface implementation",
    tag: "classes",
    code: `interface ILogger { void Log(string message); }
interface IAuditLogger { void Log(string message); }  // same method name

class DualLogger : ILogger, IAuditLogger
{
    void ILogger.Log(string msg)
        => Console.WriteLine($"[LOG] {msg}");

    void IAuditLogger.Log(string msg)
        => Console.WriteLine($"[AUDIT] {msg}");
}

var logger = new DualLogger();
// logger.Log("hi");  // compile error: ambiguous

((ILogger)logger).Log("hi");       // [LOG] hi
((IAuditLogger)logger).Log("hi");  // [AUDIT] hi`,
    explanation: "Explicit interface implementation resolves naming conflicts when two interfaces share a member name; the method is only accessible through the interface type, not through the concrete type — this also hides implementation details from users of the concrete class.",
  },
  {
    id: "cs-0520-b1-with-expression",
    language: "csharp",
    title: "with expression for non-destructive mutation",
    tag: "snippet",
    code: `record class Config(
    string Host = "localhost",
    int Port = 8080,
    bool TLS = false);

var dev  = new Config();
var prod = dev with { Host = "api.example.com", Port = 443, TLS = true };

Console.WriteLine(dev);   // Config { Host = localhost, Port = 8080, TLS = False }
Console.WriteLine(prod);  // Config { Host = api.example.com, Port = 443, TLS = True }

// with works on record structs and any type with a copy constructor
record struct Vec3(float X, float Y, float Z);
var v  = new Vec3(1, 2, 3);
var v2 = v with { Z = 99 };`,
    explanation: "`with` creates a shallow copy of the record with specified properties changed — it doesn't mutate the original, making it the idiomatic way to derive a modified version of an immutable record without writing a full copy constructor.",
  },
  {
    id: "cs-0520-b1-nullable-ref-types",
    language: "csharp",
    title: "nullable reference types (NRTs)",
    tag: "understanding",
    code: `#nullable enable

string  name    = null;   // warning: cannot assign null to non-nullable
string? maybeName = null; // OK

// Null-forgiving operator (!) suppresses the warning — use carefully
string forced = maybeName!;   // runtime NullReferenceException if null

// Pattern: use ? and ?? to propagate/default
void Greet(string? name)
{
    string greeting = $"Hello, {name ?? "stranger"}!";
    Console.WriteLine(greeting);
}

// The MemberNullWhen attribute for analysis flow
using System.Diagnostics.CodeAnalysis;

bool TryGetName([NotNullWhen(true)] out string? result)
{
    result = "Alice";
    return true;
}`,
    explanation: "Nullable reference types (enabled via `#nullable enable` or project-wide) make the compiler warn about potential `NullReferenceException` at analysis time — `string` means never null, `string?` means nullable, and the `!` operator suppresses warnings when you know better than the analyser.",
  },
  {
    id: "cs-0520-b1-immutable-list",
    language: "csharp",
    title: "ImmutableList<T> and builder pattern",
    tag: "structures",
    code: `using System.Collections.Immutable;

var list = ImmutableList.Create(1, 2, 3);
var list2 = list.Add(4);        // returns new list, original unchanged
Console.WriteLine(list.Count);  // 3
Console.WriteLine(list2.Count); // 4

// Bulk construction with builder (avoid O(n) per-Add)
var builder = ImmutableList.CreateBuilder<int>();
for (int i = 0; i < 5; i++) builder.Add(i);
var immutable = builder.ToImmutable();
Console.WriteLine(string.Join(", ", immutable));  // 0, 1, 2, 3, 4`,
    explanation: "`ImmutableList<T>` operations like `Add` return a new list sharing structure with the original (persistent data structure) — safe for sharing across threads but O(log n) for indexed access; use the builder when constructing in a loop to avoid O(n²) allocations.",
  },
  {
    id: "cs-0520-b1-datetime-vs-offset",
    language: "csharp",
    title: "DateTime vs DateTimeOffset",
    tag: "caveats",
    code: `// DateTime: no timezone info (Kind: Local, Utc, Unspecified)
var local  = DateTime.Now;   // local machine time
var utc    = DateTime.UtcNow;
Console.WriteLine(local.Kind);  // Local

// DateTimeOffset: timestamp + offset — unambiguous
var dto    = DateTimeOffset.Now;
Console.WriteLine(dto.Offset);   // e.g., +02:00

// Danger: comparing DateTime across zones
// local.ToString() shows local time; serialised differently per machine

// Prefer DateTimeOffset for storage and APIs
DateTimeOffset meeting = DateTimeOffset.Parse("2026-05-20T14:00:00+05:30");
Console.WriteLine(meeting.UtcDateTime);  // converts to UTC correctly`,
    explanation: "`DateTime` without an explicit UTC kind is ambiguous — two `DateTime.Local` values on machines in different time zones will compare incorrectly; `DateTimeOffset` stores the UTC offset alongside the time, making comparisons and serialization unambiguous.",
  },
  {
    id: "cs-0520-b1-covariance-contravariance",
    language: "csharp",
    title: "generic covariance and contravariance",
    tag: "types",
    code: `// Covariant (out): can use derived where base expected
IEnumerable<string> strings = new List<string> { "a", "b" };
IEnumerable<object> objects = strings;  // OK — IEnumerable<out T>

// Contravariant (in): can use base where derived expected
Action<object> printObj = o => Console.WriteLine(o);
Action<string> printStr = printObj;  // OK — Action<in T>

// Invariant: List<T> is NOT covariant
// List<object> list = new List<string>();  // compile error

// interface IProducer<out T> { T Get(); }
// interface IConsumer<in T> { void Accept(T value); }`,
    explanation: "A type parameter is covariant (`out`) when it only appears in return positions — you can assign `IEnumerable<Derived>` to `IEnumerable<Base>`; it's contravariant (`in`) when only in input positions, allowing `Action<Base>` where `Action<Derived>` is expected.",
  },
  {
    id: "cs-0520-b1-array-list-memory",
    language: "csharp",
    title: "Array vs List<T> memory layout",
    tag: "families",
    code: `// Array: fixed size, contiguous, directly on heap or stack
int[] arr = new int[5];   // exactly 5 ints, no overhead
arr[2] = 42;

// List<T>: dynamic, doubles capacity on resize
var list = new List<int>(5);   // initial capacity hint
list.Add(1); list.Add(2);

// Check backing array size
Console.WriteLine(list.Capacity);  // 5 (or more after growth)
list.TrimExcess();                  // shrink to fit
Console.WriteLine(list.Capacity);  // 2

// Array is faster for fixed-size sequential access
// List<T> is easier to use when size is unknown upfront
Span<int> s = arr;  // zero-copy span over array`,
    explanation: "Arrays have zero overhead per element and interop directly with `Span<T>` and unsafe code; `List<T>` wraps an array and doubles capacity on overflow — always pass an initial capacity hint if you know the approximate size to avoid reallocations.",
  },
  {
    id: "cs-0520-b1-extension-methods",
    language: "csharp",
    title: "extension methods for fluent APIs",
    tag: "classes",
    code: `public static class StringExtensions
{
    public static string Truncate(this string s, int maxLength, string suffix = "...")
    {
        if (s.Length <= maxLength) return s;
        return s[..(maxLength - suffix.Length)] + suffix;
    }

    public static bool IsNullOrEmpty(this string? s)
        => string.IsNullOrEmpty(s);
}

string text = "Hello, World!";
Console.WriteLine(text.Truncate(8));        // Hello...
Console.WriteLine(((string?)null).IsNullOrEmpty());  // True`,
    explanation: "Extension methods add methods to existing types without modifying them — `this` on the first parameter makes the method appear as an instance method on that type; they're discovered via `using` the namespace they're declared in.",
  },
  {
    id: "cs-0520-b1-range-index",
    language: "csharp",
    title: "range and index operators (^, ..)",
    tag: "snippet",
    code: `var arr = new[] { 10, 20, 30, 40, 50 };

// ^ counts from the end
Console.WriteLine(arr[^1]);     // 50  (last element)
Console.WriteLine(arr[^2]);     // 40  (second from end)

// .. is the range operator
Console.WriteLine(string.Join(", ", arr[1..3]));   // 20, 30  (index 1 to 2)
Console.WriteLine(string.Join(", ", arr[..2]));    // 10, 20  (first two)
Console.WriteLine(string.Join(", ", arr[3..]));    // 40, 50  (last two)
Console.WriteLine(string.Join(", ", arr[..]));     // all

// Indices are first-class values
Index last = ^1;
Range middle = 1..^1;`,
    explanation: "`^n` is an index from the end (equivalent to `length - n`); `a..b` is a range that can be used with arrays, `Span<T>`, and `string` — both are value types (`Index` and `Range`) that can be stored and passed as arguments.",
  },
  {
    id: "cs-0520-b1-string-interning",
    language: "csharp",
    title: "string interning and ReferenceEquals",
    tag: "understanding",
    code: `string a = "hello";
string b = "hello";
Console.WriteLine(object.ReferenceEquals(a, b));  // True  (interned literal)

string c = new string(new char[] { 'h','e','l','l','o' });
Console.WriteLine(object.ReferenceEquals(a, c));  // False (separate allocation)
Console.WriteLine(a == c);                        // True  (value equality)

// Force interning of dynamic strings
string d = string.Intern(c);
Console.WriteLine(object.ReferenceEquals(a, d));  // True  (now interned)`,
    explanation: "C# interns string literals at compile time — identical literals share one heap object; dynamically created strings are not interned by default; `string.Intern` forces sharing but keep the string alive for the process lifetime, so use it carefully.",
  },
  {
    id: "cs-0520-b1-priority-queue",
    language: "csharp",
    title: "PriorityQueue<TElement, TPriority>",
    tag: "structures",
    code: `// Available in .NET 6+
var pq = new PriorityQueue<string, int>();

pq.Enqueue("low priority",    10);
pq.Enqueue("high priority",   1);
pq.Enqueue("medium priority", 5);

while (pq.Count > 0)
{
    var item = pq.Dequeue();
    Console.WriteLine(item);
}
// high priority
// medium priority
// low priority

// Peek without removing
pq.Enqueue("first", 1);
Console.WriteLine(pq.Peek());  // first`,
    explanation: "`PriorityQueue<TElement, TPriority>` is a min-heap — smaller priority values are dequeued first; element and priority are separate, letting you reprioritize or use a different comparison type without wrapping both in a tuple.",
  },
  {
    id: "cs-0520-b1-yield-try-catch",
    language: "csharp",
    title: "yield return cannot be inside catch",
    tag: "caveats",
    code: `// This does NOT compile:
// IEnumerable<int> Bad()
// {
//     try { yield return 1; }
//     catch { yield return -1; }  // CS1626: Cannot yield in body of catch clause
// }

// Workaround: yield outside the try/catch
IEnumerable<int> Safe(int[] data)
{
    foreach (var item in data)
    {
        int result;
        try { result = Transform(item); }
        catch { result = -1; }
        yield return result;   // outside catch — OK
    }
}

static int Transform(int x) => x > 0 ? x * 2 : throw new Exception();`,
    explanation: "`yield return` is illegal inside a `catch` clause (and in `finally` with a preceding `yield return`) because the compiler's state machine cannot safely resume from exception-handling frames — restructure by computing the value inside the try/catch and yielding outside it.",
  },
  {
    id: "cs-0520-b1-func-action-predicate",
    language: "csharp",
    title: "Func, Action, Predicate in LINQ and callbacks",
    tag: "types",
    code: `var nums = new[] { 1, 2, 3, 4, 5, 6 };

Predicate<int> isEven = n => n % 2 == 0;
Func<int, bool> isEvenFunc = n => n % 2 == 0;  // same signature

// Array.FindAll uses Predicate<T>
int[] evens = Array.FindAll(nums, isEven);

// LINQ uses Func<T, bool>
var evenLinq = nums.Where(isEvenFunc).ToArray();

// Implicit conversion between compatible delegates
Func<int, bool> fromPredicate = isEven.Invoke;  // wrap manually
// or just use a lambda directly:
var r = nums.Where(n => isEven(n));`,
    explanation: "`Predicate<T>` and `Func<T, bool>` have identical signatures but are different delegate types — they don't convert implicitly, so wrapping or using a lambda bridge is needed when an API requires one form and you have the other.",
  },
  {
    id: "cs-0520-b1-string-stringbuilder-span",
    language: "csharp",
    title: "string vs StringBuilder vs Span<char>",
    tag: "families",
    code: `// string: immutable, every concat allocates
string s = "";
for (int i = 0; i < 5; i++) s += i;  // 5 allocations

// StringBuilder: mutable buffer, single allocation
var sb = new System.Text.StringBuilder();
for (int i = 0; i < 5; i++) sb.Append(i);
string result = sb.ToString();   // one allocation

// Span<char>: stack-allocated slice, no GC pressure
Span<char> buf = stackalloc char[32];
int n = 0;
for (int i = 0; i < 5; i++) buf[n++] = (char)('0' + i);
var str = new string(buf[..n]);  // one alloc for final string`,
    explanation: "Use `string +` for a few concatenations, `StringBuilder` for loops or many pieces, and `Span<char>` / `stackalloc` in high-performance paths where you want zero heap allocation — `Span` can't outlive the stack frame it's created on.",
  },
  {
    id: "cs-0520-b1-operator-overload",
    language: "csharp",
    title: "operator overloading",
    tag: "classes",
    code: `readonly struct Money
{
    public decimal Amount { get; }
    public string  Currency { get; }
    public Money(decimal amount, string currency) => (Amount, Currency) = (amount, currency);

    public static Money operator +(Money a, Money b)
    {
        if (a.Currency != b.Currency) throw new InvalidOperationException("Currency mismatch");
        return new Money(a.Amount + b.Amount, a.Currency);
    }

    public static bool operator ==(Money a, Money b)
        => a.Amount == b.Amount && a.Currency == b.Currency;

    public static bool operator !=(Money a, Money b) => !(a == b);

    public override string ToString() => \`\${Amount:F2} {Currency}\`;
}

var total = new Money(10m, "USD") + new Money(5m, "USD");
Console.WriteLine(total);  // 15.00 USD`,
    explanation: "Operator overloading makes domain types feel natural to use — overloading `==` requires also overloading `!=`, and you should override `Equals`/`GetHashCode` to keep them consistent; prefer it for value-like types (Money, Vector, Date) not for arbitrary classes.",
  },
  {
    id: "cs-0520-b1-where-notnull",
    language: "csharp",
    title: "where T : notnull generic constraint",
    tag: "types",
    code: `// notnull: T cannot be a nullable reference or value type
class Cache<T> where T : notnull
{
    private readonly Dictionary<string, T> _store = new();

    public void Set(string key, T value) => _store[key] = value;
    public T? Get(string key)
        => _store.TryGetValue(key, out var v) ? v : default;
}

var cache = new Cache<string>();
cache.Set("name", "Alice");

// Cache<string?> would be a compile-time warning with 'notnull'`,
    explanation: "`where T : notnull` tells the compiler and nullable analyser that `T` is a non-nullable type — useful for collections and caches where storing null would be a logic error that you want caught at call sites rather than at runtime.",
  },
  {
    id: "cs-0520-b1-idisposable-iasync",
    language: "csharp",
    title: "IDisposable vs IAsyncDisposable",
    tag: "families",
    code: `// Synchronous: for I/O handles, unmanaged resources
class FileWrapper : IDisposable
{
    private readonly FileStream _fs;
    public FileWrapper(string path) => _fs = File.OpenRead(path);
    public void Dispose() => _fs.Dispose();
}

using var fw = new FileWrapper("data.txt");  // auto-disposed

// Asynchronous: when cleanup itself is async (network, DB)
class AsyncConnection : IAsyncDisposable
{
    public async ValueTask DisposeAsync()
    {
        await Task.Delay(1);  // simulate async teardown
        Console.WriteLine("disconnected");
    }
}

await using var conn = new AsyncConnection();  // await using`,
    explanation: "`IDisposable` with `using` works for synchronous cleanup; `IAsyncDisposable` with `await using` lets you flush async I/O or gracefully close network connections without blocking a thread — prefer it for database connections and HTTP clients.",
  },
  {
    id: "cs-0520-b1-pattern-is-type",
    language: "csharp",
    title: "is type pattern with declaration",
    tag: "snippet",
    code: `object[] items = { 42, "hello", 3.14, null, true };

foreach (var item in items)
{
    if (item is int n)
        Console.WriteLine($"int: {n}");
    else if (item is string { Length: > 3 } s)   // property pattern
        Console.WriteLine($"long string: {s}");
    else if (item is double d)
        Console.WriteLine($"double: {d}");
    else if (item is null)
        Console.WriteLine("null");
    else
        Console.WriteLine($"other: {item}");
}`,
    explanation: "`is T variable` combines a type check and declaration in one expression — the variable is scoped to the `if` branch; adding a property pattern like `{ Length: > 3 }` narrows further without a second `if`.",
  },
  {
    id: "cs-0520-b1-double-nan",
    language: "csharp",
    title: "double.NaN comparisons",
    tag: "caveats",
    code: `double nan = double.NaN;

Console.WriteLine(nan == nan);           // False
Console.WriteLine(nan != nan);           // True
Console.WriteLine(nan < 0);             // False
Console.WriteLine(nan > 0);             // False

// Correct check
Console.WriteLine(double.IsNaN(nan));   // True

// NaN propagates through arithmetic
Console.WriteLine(nan + 1);             // NaN
Console.WriteLine(nan * 0);             // NaN  (not 0!)

// Sorting: NaN goes to the end in Array.Sort, behaves oddly in LINQ
double[] data = { 1.0, double.NaN, 2.0 };
Array.Sort(data);
Console.WriteLine(string.Join(", ", data));  // 1, NaN, 2 (implementation-defined)`,
    explanation: "IEEE 754 NaN is unordered and not equal to anything including itself — `==` always returns `false`, so always use `double.IsNaN()` to check for it; NaN propagates through arithmetic, making it a silent killer in aggregation code.",
  },
  {
    id: "cs-0520-b1-unmanaged-constraint",
    language: "csharp",
    title: "where T : unmanaged for unsafe generic code",
    tag: "types",
    code: `// unmanaged: T is a value type with no reference fields
// (int, float, structs containing only unmanaged fields, etc.)
unsafe static int SizeOf<T>() where T : unmanaged
    => sizeof(T);   // sizeof requires unmanaged constraint

Console.WriteLine(SizeOf<int>());    // 4
Console.WriteLine(SizeOf<double>());  // 8

// Useful for Span/Marshal interop
static void Fill<T>(Span<T> span, T value) where T : unmanaged
{
    span.Fill(value);
}

Span<int> buf = stackalloc int[10];
Fill(buf, 42);`,
    explanation: "`where T : unmanaged` guarantees the type contains no managed references, enabling `sizeof(T)`, pointer operations, and safe `Marshal` interop — it implies `where T : struct` and also disallows `Nullable<T>`.",
  },
  {
    id: "cs-0520-b1-thread-task-parallel",
    language: "csharp",
    title: "Thread vs Task vs Parallel",
    tag: "families",
    code: `// Thread: OS-level, explicit lifecycle, expensive
var t = new System.Threading.Thread(() => Console.WriteLine("Thread"));
t.Start();
t.Join();

// Task: logical unit of async work, thread pool backed
var task = Task.Run(() => Console.WriteLine("Task"));
await task;

// Task.WhenAll: run multiple concurrently
await Task.WhenAll(
    Task.Run(() => Console.WriteLine("A")),
    Task.Run(() => Console.WriteLine("B")));

// Parallel: data parallelism, uses thread pool, blocking
Parallel.ForEach(new[] { 1, 2, 3 }, x => Console.Write(x * 2 + " "));`,
    explanation: "Use `Thread` only when you need precise control over thread lifecycle or need a background thread with specific priority; `Task` for async work and concurrency; `Parallel.ForEach` for CPU-bound data parallelism where blocking is acceptable.",
  },
  {
    id: "cs-0520-b1-iequatable-impl",
    language: "csharp",
    title: "IEquatable<T> for allocation-free equality",
    tag: "classes",
    code: `struct Color : IEquatable<Color>
{
    public byte R, G, B;
    public Color(byte r, byte g, byte b) => (R, G, B) = (r, g, b);

    public bool Equals(Color other)   // no boxing — called directly
        => R == other.R && G == other.G && B == other.B;

    public override bool Equals(object? obj)  // called when boxed
        => obj is Color c && Equals(c);

    public override int GetHashCode()
        => HashCode.Combine(R, G, B);

    public static bool operator ==(Color a, Color b) => a.Equals(b);
    public static bool operator !=(Color a, Color b) => !a.Equals(b);
}

var red = new Color(255, 0, 0);
Console.WriteLine(red == new Color(255, 0, 0));  // True`,
    explanation: "`IEquatable<T>.Equals(T)` takes the concrete type directly, avoiding boxing when comparing structs in collections like `HashSet<T>` or `Dictionary<T, V>` — always implement it alongside `GetHashCode` and `operator ==`.",
  },
  {
    id: "cs-0520-b1-string-interpolation-format",
    language: "csharp",
    title: "string interpolation with format specifiers",
    tag: "snippet",
    code: `decimal price = 1234567.89m;
DateTime now   = DateTime.UtcNow;
double  pi     = Math.PI;

Console.WriteLine(\`\${price:C}\`);          // $1,234,567.89  (currency)
Console.WriteLine(\`\${price:N2}\`);         // 1,234,567.89  (number, 2dp)
Console.WriteLine(\`\${now:yyyy-MM-dd}\`);   // 2026-05-20
Console.WriteLine(\`\${pi:F4}\`);            // 3.1416
Console.WriteLine(\`\${42:X4}\`);            // 002A  (hex, 4 wide)
Console.WriteLine(\`\${0.75:P0}\`);          // 75%`,
    explanation: "Interpolated string holes accept standard format specifiers after a colon — `:C` for currency, `:F2` for fixed 2dp, `:X` for hex, `:P` for percent — the same specifiers used in `string.Format` and `ToString`.",
  },
  {
    id: "cs-0520-b1-params-array",
    language: "csharp",
    title: "params array and the allocation it hides",
    tag: "understanding",
    code: `void Log(string template, params object[] args)
    => Console.WriteLine(string.Format(template, args));

Log("Hello, {0}!", "World");   // array allocated: new object[] { "World" }
Log("x={0} y={1}", 1, 2);      // array allocated: new object[] { 1, 2 }

// .NET 8+: params IEnumerable<T> / params ReadOnlySpan<T> reduce allocations
// void Better(params ReadOnlySpan<int> values) { ... }
// Better(1, 2, 3);  // stack-allocated, no heap allocation

// Passing an array directly avoids a second allocation:
var prebuilt = new object[] { "World" };
Log("Hello, {0}!", prebuilt);  // no extra array created`,
    explanation: "`params` hides an array allocation on every call site — in hot paths this matters; passing a pre-built array avoids the extra allocation, and .NET 8's `params ReadOnlySpan<T>` overloads enable truly allocation-free variadic methods.",
  },
  {
    id: "cs-0520-b1-arraypool",
    language: "csharp",
    title: "ArrayPool<T> for reusable large buffers",
    tag: "structures",
    code: `using System.Buffers;

byte[] buffer = ArrayPool<byte>.Shared.Rent(4096); // may be larger than 4096
try
{
    // Fill and use buffer
    Array.Fill(buffer, (byte)0, 0, 4096);
    Console.WriteLine(buffer.Length);  // ≥ 4096
}
finally
{
    ArrayPool<byte>.Shared.Return(buffer, clearArray: true);
}

// MemoryPool<T> alternative for Span/Memory APIs
using IMemoryOwner<byte> owner = MemoryPool<byte>.Shared.Rent(1024);
Memory<byte> mem = owner.Memory;`,
    explanation: "`ArrayPool<T>.Shared.Rent` returns a pooled array (possibly larger than requested) that you return after use — this avoids repeated large allocations in I/O loops; always `Return` in a `finally` block and consider `clearArray: true` for sensitive data.",
  },
  {
    id: "cs-0520-b1-string-split-options",
    language: "csharp",
    title: "StringSplitOptions for clean splitting",
    tag: "snippet",
    code: `string csv = "  alice , , bob ,  carol  , ";

// Default: includes empty strings
var raw = csv.Split(',');
Console.WriteLine(raw.Length);  // 6

// Remove empty entries
var noEmpty = csv.Split(',', StringSplitOptions.RemoveEmptyEntries);
Console.WriteLine(noEmpty.Length);  // 4  (still has whitespace)

// Remove + trim (combine flags)
var clean = csv.Split(',',
    StringSplitOptions.RemoveEmptyEntries |
    StringSplitOptions.TrimEntries);  // .NET 5+
Console.WriteLine(string.Join("|", clean));  // alice|bob|carol`,
    explanation: "`StringSplitOptions.TrimEntries` (added in .NET 5) trims each resulting substring in one pass, eliminating the pattern of splitting then calling `Select(s => s.Trim())` — combine it with `RemoveEmptyEntries` to skip whitespace-only tokens.",
  },
  {
    id: "cs-0520-b1-static-constructor",
    language: "csharp",
    title: "static constructor runs once, lazily",
    tag: "understanding",
    code: `class Registry
{
    public static readonly Dictionary<string, string> Codes;

    static Registry()   // runs once before first use of the class
    {
        Console.WriteLine("Initializing Registry...");
        Codes = new Dictionary<string, string>
        {
            ["US"] = "United States",
            ["GB"] = "Great Britain",
        };
    }
}

Console.WriteLine("Before first use");
Console.WriteLine(Registry.Codes["US"]);  // triggers static constructor
Console.WriteLine(Registry.Codes["GB"]);  // static constructor NOT called again`,
    explanation: "The static constructor runs once per type, the first time the type is accessed — it's guaranteed by the CLR to be thread-safe; heavy initialization (loading files, caching reflection) belongs here rather than in a static field initializer for error handling.",
  },
  {
    id: "cs-0520-b1-readonly-span",
    language: "csharp",
    title: "ReadOnlySpan<T> for zero-copy substring",
    tag: "structures",
    code: `string text = "Hello, World!";

// No allocation: ReadOnlySpan is a view into the string's memory
ReadOnlySpan<char> span = text.AsSpan();
ReadOnlySpan<char> world = span[7..12];

Console.WriteLine(world.ToString());        // World
Console.WriteLine(world.SequenceEqual("World")); // True

// Parse numbers from a span without allocating a substring
ReadOnlySpan<char> digits = "  42  ".AsSpan().Trim();
int n = int.Parse(digits);
Console.WriteLine(n);  // 42`,
    explanation: "`ReadOnlySpan<char>` is a stack-only slice into existing memory — using it instead of `Substring` avoids heap allocation for parsing and scanning, which matters in high-throughput text processing or hot deserialization paths.",
  },
  {
    id: "cs-0520-b1-delegate-multicast",
    language: "csharp",
    title: "multicast delegates and exception behaviour",
    tag: "caveats",
    code: `Action handler = () => Console.WriteLine("First");
handler += () => Console.WriteLine("Second");
handler += () => { throw new Exception("boom"); };
handler += () => Console.WriteLine("Fourth");

// All invocations run; exception from third stops the chain
try { handler(); }
catch (Exception e) { Console.WriteLine(e.Message); }
// First
// Second
// boom   — Fourth never runs!

// Safe invocation: call each subscriber independently
foreach (Action? del in handler.GetInvocationList().Cast<Action>())
{
    try { del(); }
    catch (Exception ex) { Console.WriteLine($"Subscriber failed: {ex.Message}"); }
}`,
    explanation: "Multicast delegates invoke subscribers in order, but an exception in one subscriber cancels the rest — if you need all subscribers notified despite failures, iterate `GetInvocationList()` and wrap each call in a try/catch.",
  },
  {
    id: "cs-0520-b1-ref-readonly",
    language: "csharp",
    title: "ref readonly for zero-copy struct returns",
    tag: "types",
    code: `readonly struct LargeStruct
{
    public readonly double A, B, C, D, E, F;
    // ... many more fields
    public LargeStruct(double v) => A = B = C = D = E = F = v;
}

class Store
{
    private LargeStruct _data = new LargeStruct(3.14);

    // Returns a reference — no copy of the 48-byte struct
    public ref readonly LargeStruct Data => ref _data;
}

var store = new Store();
ref readonly LargeStruct view = ref store.Data;
Console.WriteLine(view.A);  // 3.14  (no copy)`,
    explanation: "`ref readonly` returns a reference to the struct (no copy) while preventing callers from modifying it — essential for large `readonly struct` values in performance-sensitive code where copying on every access would be expensive.",
  },
  {
    id: "cs-0520-b1-exception-hierarchy",
    language: "csharp",
    title: ".NET exception hierarchy",
    tag: "families",
    code: `// Exception
//   ├── SystemException              (BCL exceptions)
//   │   ├── ArgumentException
//   │   │   └── ArgumentNullException
//   │   │   └── ArgumentOutOfRangeException
//   │   ├── InvalidOperationException
//   │   ├── NullReferenceException
//   │   ├── OverflowException
//   │   └── IndexOutOfRangeException
//   └── ApplicationException        (user exceptions; rarely used)

// Best practice: catch the most specific type
try { int.Parse("x"); }
catch (FormatException e)    { Console.WriteLine("format: " + e.Message); }
catch (OverflowException e)  { Console.WriteLine("overflow: " + e.Message); }
catch (Exception e)          { Console.WriteLine("other: " + e.Message); }`,
    explanation: "Catch the most specific exception first — the CLR tries handlers top-to-bottom; catching `Exception` first would swallow everything; derive custom exceptions from `Exception` directly (not `ApplicationException`, which is considered legacy).",
  },
  {
    id: "cs-0520-b1-using-var",
    language: "csharp",
    title: "using var — scoped disposal without nesting",
    tag: "snippet",
    code: `// Traditional: disposal at } of using block
using (var conn = new System.Data.SqlClient.SqlConnection("..."))
{
    conn.Open();
    // use conn
}  // conn.Dispose() called here

// Modern (C# 8+): disposal at end of enclosing scope
using var conn2 = new System.Data.SqlClient.SqlConnection("...");
conn2.Open();
// use conn2
// conn2.Dispose() called when the method returns or throws`,
    explanation: "`using var` (declaration using statement) disposes at the end of the enclosing block — it reduces indentation and works well when the resource should live until the method returns, rather than a specific sub-scope.",
  },
  {
    id: "cs-0520-b1-conditional-operator",
    language: "csharp",
    title: "?: ternary vs null-conditional (?.) vs null-coalescing (??)",
    tag: "understanding",
    code: `string? text = null;

// ?: standard ternary
string a = text != null ? text.ToUpper() : "EMPTY";

// ?. null-conditional: returns null instead of throwing
int? len = text?.Length;    // null if text is null
string? upper = text?.ToUpper()?.Trim();  // short-circuits on null

// ?? null-coalescing: default when null
string b = text ?? "default";
int    c = text?.Length ?? 0;   // combine for safe fallback

// ??= null-coalescing assignment
text ??= "initialized";
Console.WriteLine(text);  // initialized`,
    explanation: "`?.` short-circuits the chain and returns null instead of throwing `NullReferenceException`; `??` provides a fallback value; combining them as `obj?.Property ?? fallback` is the idiomatic null-safe property access pattern in modern C#.",
  },
  {
    id: "cs-0520-b1-memory-t",
    language: "csharp",
    title: "Memory<T> — heap-safe version of Span<T>",
    tag: "structures",
    code: `// Span<T> is stack-only; Memory<T> can be stored in fields, lists, etc.
Memory<byte> mem = new byte[256];

// Slice without allocation
Memory<byte> chunk = mem[10..50];

// Get a Span for synchronous operations
Span<byte> span = chunk.Span;
span.Fill(0xFF);

// Pass to async methods (Span cannot cross await points)
async Task WriteAsync(Memory<byte> buffer)
{
    // await some stream.WriteAsync(buffer, cancellationToken);
    Console.WriteLine(buffer.Length);
}

await WriteAsync(chunk);`,
    explanation: "`Memory<T>` is the async-compatible counterpart to `Span<T>` — it can be stored in class fields, passed across `await` points, and converted to `Span<T>` via `.Span` when synchronous access is needed.",
  },
  {
    id: "cs-0520-b1-finalize-dispose",
    language: "csharp",
    title: "finalizer vs Dispose — the full dispose pattern",
    tag: "caveats",
    code: `class Resource : IDisposable
{
    private IntPtr _handle;
    private bool   _disposed;

    public Resource() => _handle = /* acquire */ IntPtr.Zero;

    // Called by GC — non-deterministic, runs on finalizer thread
    ~Resource() => Dispose(false);

    public void Dispose()
    {
        Dispose(true);
        GC.SuppressFinalize(this);  // tell GC: skip finalizer
    }

    protected virtual void Dispose(bool disposing)
    {
        if (_disposed) return;
        if (disposing)
        {
            // Free managed resources (IDisposable fields)
        }
        // Free unmanaged resources (handles, memory)
        _handle = IntPtr.Zero;
        _disposed = true;
    }
}`,
    explanation: "The dispose pattern separates managed cleanup (only when `disposing == true`) from unmanaged cleanup (always) — `GC.SuppressFinalize` prevents the finalizer from running after explicit `Dispose`, which would waste a GC cycle.",
  },
  {
    id: "cs-0520-b1-required-modifier",
    language: "csharp",
    title: "required modifier for mandatory init properties",
    tag: "types",
    code: `// C# 11+: required forces callers to set the property
class User
{
    public required string Name  { get; init; }
    public required string Email { get; init; }
    public int Age { get; init; }           // optional
}

// Compile error if Name or Email is not set:
// var u = new User { Age = 30 };  // CS9035

var user = new User { Name = "Alice", Email = "alice@example.com" };

// Works with [SetsRequiredMembers] to bypass in a constructor
class Config
{
    public required string ConnectionString { get; set; }
    [System.Diagnostics.CodeAnalysis.SetsRequiredMembers]
    public Config(string cs) => ConnectionString = cs;
}`,
    explanation: "`required` makes a property or field mandatory in object initializers — the compiler guarantees it's set at construction time; `[SetsRequiredMembers]` on a constructor exempts callers from the requirement when using that constructor.",
  },
  {
    id: "cs-0520-b1-deconstruct-tuple",
    language: "csharp",
    title: "deconstruction with tuples and custom Deconstruct",
    tag: "snippet",
    code: `// Tuple deconstruction
var pair = (Name: "Alice", Score: 95);
var (name, score) = pair;
Console.WriteLine($"{name}: {score}");  // Alice: 95

// Custom Deconstruct method
class Point3D
{
    public double X, Y, Z;
    public void Deconstruct(out double x, out double y, out double z)
        => (x, y, z) = (X, Y, Z);
}

var p = new Point3D { X = 1, Y = 2, Z = 3 };
var (x, y, z) = p;
Console.WriteLine($"{x}, {y}, {z}");  // 1, 2, 3

// Discard with _
var (first, _) = (10, 20);  // ignore second element`,
    explanation: "Any type can support `var (a, b) = obj` by providing a `Deconstruct` method with `out` parameters — the compiler binds positionally; `_` discards elements you don't need without binding a variable.",
  },
  {
    id: "cs-0520-b1-params-overload",
    language: "csharp",
    title: "params overload resolution edge case",
    tag: "caveats",
    code: `void Print(string s) => Console.WriteLine("single: " + s);
void Print(params string[] args) => Console.WriteLine("params: " + args.Length);

Print("hello");         // single: hello  (exact match wins)
Print("a", "b");        // params: 2
Print(new string[]{"a","b"});  // params: 2

// Ambiguity with null:
// Print(null);  // could be string or string[] → ambiguous, picks single

// With a params overload and an IEnumerable overload:
void Write(IEnumerable<int> items) => Console.WriteLine("IEnumerable");
void Write(params int[] items) => Console.WriteLine("params");
Write(1, 2, 3);         // params  (array satisfies both; params preferred)`,
    explanation: "The compiler prefers a non-params overload when the arguments match exactly — passing `null` can cause ambiguity; when both a `params` and an `IEnumerable` overload exist, the compiler prefers the `params` version for direct element arguments.",
  },
  {
    id: "cs-0520-b1-generic-math",
    language: "csharp",
    title: "generic math with INumber<T> (.NET 7+)",
    tag: "types",
    code: `using System.Numerics;

// T must implement INumber<T> — works for int, double, decimal, etc.
T Sum<T>(IEnumerable<T> values) where T : INumber<T>
    => values.Aggregate(T.Zero, (acc, x) => acc + x);

Console.WriteLine(Sum(new[] { 1, 2, 3 }));           // 6  (int)
Console.WriteLine(Sum(new[] { 1.5, 2.5, 3.0 }));     // 7  (double)
Console.WriteLine(Sum(new[] { 1m, 2m, 3m }));        // 6  (decimal)

// Numeric static interface members:
// T.Zero, T.One, T.MaxValue, T.MinValue, T.Abs(x), T.Sqrt(x) ...`,
    explanation: "`INumber<T>` (part of .NET 7 generic math) lets you write arithmetic algorithms once that work over any numeric type — it uses static interface members (`T.Zero`, `T.One`, operators) that the JIT specializes per concrete type.",
  },
  {
    id: "cs-0520-b1-icomparable-impl",
    language: "csharp",
    title: "IComparable<T> for sorting",
    tag: "classes",
    code: `struct Version : IComparable<Version>
{
    public int Major, Minor, Patch;

    public int CompareTo(Version other)
    {
        int cmp = Major.CompareTo(other.Major);
        if (cmp != 0) return cmp;
        cmp = Minor.CompareTo(other.Minor);
        if (cmp != 0) return cmp;
        return Patch.CompareTo(other.Patch);
    }

    public override string ToString() => \`\${Major}.\${Minor}.\${Patch}\`;
}

var versions = new[] {
    new Version { Major=1, Minor=2, Patch=0 },
    new Version { Major=1, Minor=0, Patch=5 },
    new Version { Major=2, Minor=0, Patch=0 },
};
Array.Sort(versions);
foreach (var v in versions) Console.WriteLine(v);
// 1.0.5  1.2.0  2.0.0`,
    explanation: "`IComparable<T>.CompareTo` must return negative/zero/positive for less/equal/greater — implementing it enables `Array.Sort`, `List.Sort`, `SortedSet`, and LINQ `OrderBy` to work with your type without extra comparers.",
  },
  {
    id: "cs-0520-b1-stream-types",
    language: "csharp",
    title: "Stream hierarchy — choosing the right stream",
    tag: "families",
    code: `// Abstract base: System.IO.Stream
// FileStream:    disk I/O
// MemoryStream:  in-memory buffer (like BytesIO in Python)
// NetworkStream: TCP socket
// GZipStream:    decorator — compresses/decompresses another stream
// BufferedStream: decorator — adds read/write buffering

using var mem  = new System.IO.MemoryStream();
using var gzip = new System.IO.Compression.GZipStream(
    mem, System.IO.Compression.CompressionMode.Compress);

byte[] data = System.Text.Encoding.UTF8.GetBytes("Hello, World!");
gzip.Write(data, 0, data.Length);
gzip.Flush();
Console.WriteLine($"Compressed: {mem.Length} bytes");`,
    explanation: "The decorator pattern around `Stream` lets you stack behaviours: wrap a `FileStream` in a `BufferedStream` for batching, then in a `GZipStream` for compression — each layer adds a capability without changing the underlying storage.",
  },
  {
    id: "cs-0520-b1-static-field-init-order",
    language: "csharp",
    title: "static field initializer order gotcha",
    tag: "caveats",
    code: `class Config
{
    // Initializers run top-to-bottom before the static constructor
    public static readonly int Timeout = GetTimeout();
    public static readonly string Host  = "localhost";  // not yet set when GetTimeout runs!

    private static int GetTimeout()
    {
        Console.WriteLine(Host ?? "null");  // null! Host not yet initialized
        return 30;
    }
}

_ = Config.Timeout;
// Prints: null
// (Timeout is initialized first, calls GetTimeout, Host isn't set yet)`,
    explanation: "Static field initializers run in textual order, top-to-bottom — if a later initializer is referenced by an earlier one's expression, it will be `null` or `default`; use a static constructor to control order explicitly.",
  },
  {
    id: "cs-0520-b1-nint-nuint",
    language: "csharp",
    title: "nint and nuint — native-sized integers",
    tag: "types",
    code: `// nint / nuint are pointer-sized: 32-bit on x86, 64-bit on x64
nint  a = nint.MaxValue;
nuint b = nuint.MaxValue;

Console.WriteLine(IntPtr.Size);     // 4 or 8 (bytes)
Console.WriteLine(sizeof(nint));    // same as IntPtr.Size

// Useful in unsafe/Span/Marshal code
unsafe
{
    int[] arr = { 1, 2, 3 };
    fixed (int* ptr = arr)
    {
        nint address = (nint)ptr;
        Console.WriteLine(address.ToString("X"));
    }
}`,
    explanation: "`nint`/`nuint` alias `IntPtr`/`UIntPtr` but support arithmetic operators like `+`, `-`, and comparisons without explicit casting — they make platform-neutral pointer arithmetic cleaner in unsafe code and P/Invoke scenarios.",
  },
  {
    id: "cs-0520-b1-attribute-vs-annotation",
    language: "csharp",
    title: "custom attributes for metadata",
    tag: "families",
    code: `[AttributeUsage(AttributeTargets.Method, AllowMultiple = false)]
class RetryAttribute : Attribute
{
    public int MaxAttempts { get; }
    public RetryAttribute(int maxAttempts = 3) => MaxAttempts = maxAttempts;
}

class Service
{
    [Retry(maxAttempts: 5)]
    public void CallApi() { /* ... */ }
}

// Read at runtime via reflection
var method = typeof(Service).GetMethod(nameof(Service.CallApi))!;
var attr   = method.GetCustomAttribute<RetryAttribute>();
Console.WriteLine(attr?.MaxAttempts);  // 5`,
    explanation: "Custom attributes attach metadata to types, methods, and parameters that tools, ORMs, and frameworks read at runtime or compile time via reflection or source generators — `[AttributeUsage]` controls where the attribute is valid and whether it can be applied multiple times.",
  },
  {
    id: "cs-0520-b1-indexer-property",
    language: "csharp",
    title: "indexer property for collection-like access",
    tag: "classes",
    code: `class FixedMatrix
{
    private readonly double[,] _data;
    public int Rows { get; }
    public int Cols { get; }

    public FixedMatrix(int rows, int cols)
    {
        Rows = rows; Cols = cols;
        _data = new double[rows, cols];
    }

    // Indexer: obj[i, j]
    public double this[int row, int col]
    {
        get => _data[row, col];
        set
        {
            if (row < 0 || row >= Rows || col < 0 || col >= Cols)
                throw new IndexOutOfRangeException();
            _data[row, col] = value;
        }
    }
}

var m = new FixedMatrix(3, 3);
m[1, 2] = 42.0;
Console.WriteLine(m[1, 2]);  // 42`,
    explanation: "An indexer is defined with `this[...]` and lets your class support `obj[key]` syntax — it can have any number and types of parameters, making it natural for matrices, grids, or any collection-like abstraction.",
  },
  {
    id: "cs-0520-b1-lookup-t",
    language: "csharp",
    title: "ILookup<TKey, TElement> from GroupBy",
    tag: "structures",
    code: `var words = new[] { "apple", "ant", "banana", "avocado", "blueberry" };

// ToLookup: like a Dictionary<K, IEnumerable<V>>, immutable
var lookup = words.ToLookup(w => w[0]);

Console.WriteLine(string.Join(", ", lookup['a']));  // apple, ant, avocado
Console.WriteLine(string.Join(", ", lookup['b']));  // banana, blueberry
Console.WriteLine(lookup['z'].Count());             // 0  — no KeyNotFoundException

// Unlike Dictionary, missing key returns empty sequence
foreach (var group in lookup)
    Console.WriteLine($"{group.Key}: {group.Count()} items");`,
    explanation: "`ToLookup` builds an `ILookup<TKey, TElement>` — a read-only multimap where each key maps to a collection of elements; unlike `Dictionary`, accessing a missing key returns an empty sequence rather than throwing.",
  },
  {
    id: "cs-0520-b1-covariant-return",
    language: "csharp",
    title: "covariant return types (C# 9+)",
    tag: "classes",
    code: `class Animal
{
    public virtual Animal Clone() => new Animal();
}

class Dog : Animal
{
    public string Name { get; init; } = "";

    // Return type is more specific than the base — C# 9+ covariant return
    public override Dog Clone() => new Dog { Name = this.Name };
}

Animal a = new Dog { Name = "Rex" };
Dog d = (Dog)a.Clone();          // cast needed via Animal reference

Dog rex = new Dog { Name = "Rex" };
Dog clone = rex.Clone();         // no cast needed — static type is Dog`,
    explanation: "Covariant return types let an override declare a more specific return type than the virtual base — at the call site, the static type determines whether a cast is needed; at runtime the `Dog.Clone` override always returns a `Dog`.",
  },
  {
    id: "cs-0520-b1-init-only-setter",
    language: "csharp",
    title: "init-only setter vs readonly field",
    tag: "classes",
    code: `class Config1
{
    // readonly field: set only in constructor or field initializer
    public readonly string Host;
    public Config1(string host) => Host = host;
    // obj.Host = "x";  // always compile error
}

class Config2
{
    // init-only property: set in object initializer OR constructor
    public string Host { get; init; } = "localhost";
}

var c2 = new Config2 { Host = "prod.example.com" };  // OK
// c2.Host = "other";   // compile error after construction`,
    explanation: "`readonly` fields are set only in constructors; `init` properties allow the object initializer syntax (`new Foo { X = 1 }`) in addition to constructors — use `init` when you want the flexibility of object initializers while still preventing post-construction mutation.",
  },
  {
    id: "cs-0520-b1-equality-comparer-types",
    language: "csharp",
    title: "EqualityComparer<T> and custom comparers",
    tag: "families",
    code: `// Default: uses T.Equals / T.GetHashCode
var defaultCmp = EqualityComparer<string>.Default;
Console.WriteLine(defaultCmp.Equals("abc", "ABC"));  // False

// Custom: case-insensitive strings in a Dictionary
var dict = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
dict["Hello"] = 1;
Console.WriteLine(dict["hello"]);  // 1 — found!

// Implement IEqualityComparer<T> for your own types
class PersonByName : IEqualityComparer<(string First, string Last)>
{
    public bool Equals((string, string) a, (string, string) b)
        => string.Equals(a.First, b.First, StringComparison.OrdinalIgnoreCase);
    public int GetHashCode((string, string) t)
        => t.First.ToLowerInvariant().GetHashCode();
}`,
    explanation: "Passing an `IEqualityComparer<T>` to a `Dictionary`, `HashSet`, or `GroupBy` controls how equality and hashing work — use `StringComparer.OrdinalIgnoreCase` for case-insensitive string keys, or implement a custom comparer for multi-field partial equality.",
  },
  {
    id: "cs-0520-b1-static-class",
    language: "csharp",
    title: "static class for utility methods",
    tag: "classes",
    code: `// static class: cannot be instantiated or inherited; all members must be static
public static class MathUtils
{
    public static double Clamp(double value, double min, double max)
        => Math.Max(min, Math.Min(max, value));

    public static bool IsPrime(int n)
    {
        if (n < 2) return false;
        for (int i = 2; i * i <= n; i++)
            if (n % i == 0) return false;
        return true;
    }
}

Console.WriteLine(MathUtils.Clamp(150, 0, 100));  // 100
Console.WriteLine(MathUtils.IsPrime(17));          // True`,
    explanation: "A `static class` is a compile-time guarantee that no instance of it can be created — use it for pure utility functions and extension method containers; the compiler ensures you don't accidentally add instance members.",
  },
  {
    id: "cs-0520-b1-scoped-keyword",
    language: "csharp",
    title: "scoped modifier for ref struct lifetime",
    tag: "types",
    code: `// scoped: prevents a ref struct from escaping its declaring scope
ref struct Buffer
{
    public Span<int> Data;
}

// Without scoped, this could return a dangling reference:
static void Process(scoped ref Buffer buf)
{
    // buf cannot be assigned to a field or returned
    buf.Data[0] = 99;
}

// Practical: lambda / local function parameters
Span<int> arr = stackalloc int[4];
var sum = 0;
// scoped ensures stackalloc span doesn't escape the loop
foreach (ref int item in arr)
{
    item = sum++;
}`,
    explanation: "`scoped` on a `ref` or `ref struct` parameter tells the compiler the reference cannot escape the method — it enables the compiler to allow `stackalloc` in more contexts and is automatically applied to `foreach` iteration variables in C# 11.",
  },
  {
    id: "cs-0520-b1-frozen-dictionary",
    language: "csharp",
    title: "FrozenDictionary for read-only lookup tables",
    tag: "structures",
    code: `using System.Collections.Frozen;

// Build the frozen dictionary once at startup
var lookup = new Dictionary<string, int>
{
    ["one"] = 1, ["two"] = 2, ["three"] = 3, ["four"] = 4,
}.ToFrozenDictionary();

// FrozenDictionary: optimised for repeated lookups, no mutation
Console.WriteLine(lookup["two"]);             // 2
Console.WriteLine(lookup.ContainsKey("five")); // False

// Also available:
// FrozenSet<T> for immutable set lookups

// Comparison: ImmutableDictionary is persistent (structural sharing)
// FrozenDictionary is a read-optimised snapshot (no structural sharing)`,
    explanation: "`FrozenDictionary<TKey, TValue>` (.NET 8) is tuned for repeated read-only lookups — it uses perfect hashing or linear probing customized to the key set, making `TryGetValue` faster than a regular `Dictionary` for stable, frequently-queried data.",
  },
  {
    id: "cs-0520-b1-json-serializer-options",
    language: "csharp",
    title: "System.Text.Json serialization options",
    tag: "families",
    code: `using System.Text.Json;
using System.Text.Json.Serialization;

class Product
{
    public string Name      { get; set; } = "";
    [JsonPropertyName("unit_price")]
    public decimal Price    { get; set; }
    [JsonIgnore]
    public string InternalId { get; set; } = "";
}

var options = new JsonSerializerOptions
{
    WriteIndented         = true,
    PropertyNamingPolicy  = JsonNamingPolicy.CamelCase,
    DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
};

var p = new Product { Name = "Widget", Price = 9.99m };
string json = JsonSerializer.Serialize(p, options);
Console.WriteLine(json);
// {"name":"Widget","unit_price":9.99}`,
    explanation: "`JsonSerializerOptions` centralizes serialization behaviour — always create a single shared instance rather than per-call to avoid re-building the internal metadata cache; `[JsonPropertyName]` and `[JsonIgnore]` attributes let you override naming per property.",
  },
  {
    id: "cs-0520-b1-nested-class",
    language: "csharp",
    title: "nested class for implementation hiding",
    tag: "classes",
    code: `class LinkedList<T>
{
    // Node is an implementation detail — hidden from external users
    private sealed class Node
    {
        public T       Value;
        public Node?   Next;
        public Node(T value) => Value = value;
    }

    private Node? _head;
    public int Count { get; private set; }

    public void Push(T value)
    {
        _head = new Node(value) { Next = _head };
        Count++;
    }

    public T Pop()
    {
        if (_head is null) throw new InvalidOperationException("Empty");
        var val = _head.Value;
        _head = _head.Next;
        Count--;
        return val;
    }
}`,
    explanation: "A `private` nested class is invisible to users of the outer class — it's the right place for helper types that are tightly coupled to the outer type's implementation, keeping the public API surface small and the internal detail encapsulated.",
  },
  {
    id: "cs-0520-b1-blocking-collection",
    language: "csharp",
    title: "BlockingCollection<T> for producer-consumer",
    tag: "structures",
    code: `using System.Collections.Concurrent;

var bc = new BlockingCollection<int>(boundedCapacity: 5);

// Producer
var producer = Task.Run(() =>
{
    for (int i = 0; i < 10; i++)
    {
        bc.Add(i);          // blocks if capacity is full
        Console.Write($"P{i} ");
    }
    bc.CompleteAdding();    // signal no more items
});

// Consumer
var consumer = Task.Run(() =>
{
    foreach (var item in bc.GetConsumingEnumerable())
        Console.Write($"C{item} ");
});

await Task.WhenAll(producer, consumer);`,
    explanation: "`BlockingCollection<T>` wraps `ConcurrentQueue<T>` (or any `IProducerConsumerCollection<T>`) with blocking `Add`/`Take` semantics and an optional bounded capacity — `GetConsumingEnumerable()` blocks the consumer until items are available or `CompleteAdding()` is called.",
  },
  {
    id: "cs-0520-b1-primary-constructor",
    language: "csharp",
    title: "primary constructors on class (C# 12)",
    tag: "classes",
    code: `// C# 12: primary constructor parameters are in scope for the whole class
class Logger(string name, int level = 1)
{
    // Parameters are captured automatically — no need for backing fields
    // unless you store them explicitly
    private readonly string _prefix = $"[{name.ToUpper()}]";

    public void Log(string msg)
    {
        if (level > 0)
            Console.WriteLine($"{_prefix} {msg}");
    }
}

var log = new Logger("app", level: 2);
log.Log("started");  // [APP] started

// Records had primary constructors earlier; classes get them in C# 12
record Point(double X, double Y);  // record primary constructor`,
    explanation: "Primary constructor parameters on a `class` (C# 12) are in scope throughout the class body — useful for dependency injection patterns and removing boilerplate constructor field assignments, though the parameters are not automatically stored as properties (unlike records).",
  },
  {
    id: "cs-0520-b1-collection-expressions",
    language: "csharp",
    title: "collection expressions (C# 12)",
    tag: "snippet",
    code: `// C# 12: unified syntax for any collection type
int[] arr      = [1, 2, 3];
List<int> list = [4, 5, 6];
Span<int> span = [7, 8, 9];

// Spread operator ..
int[] combined = [..arr, ..list];   // [1, 2, 3, 4, 5, 6]

// Works with ImmutableArray, HashSet, etc.
System.Collections.Immutable.ImmutableArray<int> ia = [1, 2, 3];

// Empty collection
List<string> empty = [];

Console.WriteLine(string.Join(", ", combined));  // 1, 2, 3, 4, 5, 6`,
    explanation: "Collection expressions (`[...]`) are a unified literal syntax for creating any collection type, with the spread operator `..` for inlining other collections — the compiler picks the most efficient construction strategy for the target type.",
  },
  {
    id: "cs-0520-b1-interface-static-abstract",
    language: "csharp",
    title: "static abstract interface members",
    tag: "types",
    code: `// C# 11 / .NET 7: static abstract members in interfaces
interface IFactory<T> where T : IFactory<T>
{
    static abstract T Create(string name);
}

class Widget : IFactory<Widget>
{
    public string Name { get; }
    private Widget(string name) => Name = name;

    public static Widget Create(string name) => new Widget(name);
}

// Use the interface constraint to call static method generically
T Make<T>(string name) where T : IFactory<T>
    => T.Create(name);

var w = Make<Widget>("Bolt");
Console.WriteLine(w.Name);  // Bolt`,
    explanation: "Static abstract interface members let you express factory patterns, operator contracts, and numeric algorithms that work across types — the generic constraint `where T : IFactory<T>` allows calling `T.Create(...)` without knowing the concrete type.",
  },
];
