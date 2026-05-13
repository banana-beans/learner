import type { Snippet } from "./types";
export const csharpSnippets20260513B1: Snippet[] = [
  {
    id: "cs-linq-take-count",
    language: "csharp",
    title: "LINQ Take and Count",
    tag: "snippet",
    code: `int[] numbers = { 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 };

// Take returns the first N elements
var firstFive = numbers.Take(5);
Console.WriteLine(string.Join(", ", firstFive)); // 1, 2, 3, 4, 5

// Count with predicate counts matching elements
int evenCount = numbers.Count(n => n % 2 == 0);
Console.WriteLine(evenCount); // 5`,
    explanation: "Take(n) returns at most n elements from the start of a sequence, while Count(predicate) efficiently counts elements satisfying a condition without materializing a filtered collection.",
  },
  {
    id: "cs-understand-struct-default",
    language: "csharp",
    title: "Struct default value behavior",
    tag: "understanding",
    code: `struct Point
{
    public int X;
    public int Y;
}

Point p = default; // all fields zero-initialized
Console.WriteLine(p.X); // 0
Console.WriteLine(p.Y); // 0

Point[] pts = new Point[3]; // all elements are default Points
Console.WriteLine(pts[1].X); // 0`,
    explanation: "Value types always have a default zero-initialized state; you cannot define a parameterless constructor that changes this behavior, so every field starts at its zero value.",
  },
  {
    id: "cs-sorteddict-vs-sortedlist",
    language: "csharp",
    title: "SortedDictionary vs SortedList",
    tag: "structures",
    code: `var sd = new SortedDictionary<string, int>();
sd["banana"] = 2; sd["apple"] = 5; sd["cherry"] = 1;

var sl = new SortedList<string, int>();
sl["banana"] = 2; sl["apple"] = 5; sl["cherry"] = 1;

// Both iterate in key order
foreach (var kv in sd) Console.WriteLine(kv.Key); // apple, banana, cherry

// SortedList allows index access
Console.WriteLine(sl.Keys[0]);   // apple
Console.WriteLine(sl.Values[0]); // 5`,
    explanation: "SortedDictionary uses a red-black tree giving O(log n) inserts/deletes, while SortedList uses a sorted array that is slower to insert but supports index-based access and uses less memory.",
  },
  {
    id: "cs-linq-takewhile",
    language: "csharp",
    title: "LINQ TakeWhile — stop at first non-match",
    tag: "snippet",
    code: `int[] nums = { 2, 4, 6, 7, 8, 10 };

// TakeWhile stops as soon as predicate is false
var evens = nums.TakeWhile(n => n % 2 == 0);
Console.WriteLine(string.Join(", ", evens)); // 2, 4, 6

// SkipWhile skips while predicate holds, then takes rest
var afterOdd = nums.SkipWhile(n => n % 2 == 0);
Console.WriteLine(string.Join(", ", afterOdd)); // 7, 8, 10`,
    explanation: "TakeWhile and SkipWhile are order-sensitive: they stop/start at the first element where the predicate flips, unlike Where which tests every element independently.",
  },
  {
    id: "cs-caveat-struct-mutable-prop",
    language: "csharp",
    title: "Caveat: mutating struct properties via interface",
    tag: "caveats",
    code: `struct Counter
{
    public int Value { get; private set; }
    public void Increment() => Value++;
}

Counter c = new Counter();
c.Increment();
Console.WriteLine(c.Value); // 1

// Assigning to an interface boxes the struct — mutations are lost
IComparable<int> boxed = c; // boxing occurs here
// (no Increment available on interface, but illustrates boxing)
Console.WriteLine(c.Value); // 1 — original unchanged`,
    explanation: "When a struct is boxed (e.g., assigned to an interface variable), mutations on the boxed copy do not affect the original, leading to subtle bugs if callers expect in-place modification.",
  },
  {
    id: "cs-type-generic-covar-contravar",
    language: "csharp",
    title: "Generic covariance and contravariance",
    tag: "types",
    code: `IEnumerable<string> strings = new List<string> { "a", "b" };
IEnumerable<object> objects = strings; // covariance: out T

Action<object> actObj = o => Console.WriteLine(o);
Action<string> actStr = actObj; // contravariance: in T

actStr("hello"); // hello

// IEnumerable<T> is covariant (out T)
// Action<T> is contravariant (in T)`,
    explanation: "Covariance (out T) allows using a more-derived type where a base is expected; contravariance (in T) allows using a less-derived type, both declared on interfaces and delegates in C#.",
  },
  {
    id: "cs-families-ilist-icollection-ienumerable",
    language: "csharp",
    title: "IEnumerable / ICollection / IList hierarchy",
    tag: "families",
    code: `IEnumerable<int> seq = new List<int> { 1, 2, 3 };
// Only forward iteration
foreach (var x in seq) Console.Write(x + " "); // 1 2 3
Console.WriteLine();

ICollection<int> col = new List<int> { 4, 5, 6 };
Console.WriteLine(col.Count); // 3

IList<int> list = new List<int> { 7, 8, 9 };
Console.WriteLine(list[1]); // 8 — index access
list.Insert(0, 6);
Console.WriteLine(list[0]); // 6`,
    explanation: "IEnumerable<T> provides only iteration; ICollection<T> adds Count and Add/Remove; IList<T> further adds indexed access and Insert — each level adds cost and capability.",
  },
  {
    id: "cs-class-abstract-sealed-record",
    language: "csharp",
    title: "Abstract, sealed, and record class combinations",
    tag: "classes",
    code: `abstract record Shape(double Area);

record Circle(double Radius) : Shape(Math.PI * Radius * Radius);

sealed record Square(double Side) : Shape(Side * Side);

Shape s = new Circle(3);
Console.WriteLine(s.Area.ToString("F2")); // 28.27

Shape sq = new Square(4);
Console.WriteLine(sq.Area); // 16`,
    explanation: "Records can be abstract or sealed just like classes; abstract records enforce a contract across a hierarchy while sealed records prevent further derivation, combining OOP rules with record value semantics.",
  },
  {
    id: "cs-linq-skipwhile",
    language: "csharp",
    title: "LINQ SkipWhile — skip until condition breaks",
    tag: "snippet",
    code: `int[] data = { 1, 3, 5, 6, 7, 9, 11 };

// Skip odd numbers from the start, then yield everything
var result = data.SkipWhile(n => n % 2 != 0);
Console.WriteLine(string.Join(", ", result)); // 6, 7, 9, 11

// Contrast with Where — Where inspects every element
var oddOnly = data.Where(n => n % 2 != 0);
Console.WriteLine(string.Join(", ", oddOnly)); // 1, 3, 5, 7, 9, 11`,
    explanation: "SkipWhile discards elements from the front only until the predicate first returns false, after which all remaining elements are returned regardless of the predicate.",
  },
  {
    id: "cs-understand-value-vs-ref-copy",
    language: "csharp",
    title: "Value type copy vs reference type alias",
    tag: "understanding",
    code: `int a = 10;
int b = a; // copy
b = 20;
Console.WriteLine(a); // 10 — unaffected

var list1 = new List<int> { 1, 2 };
var list2 = list1; // alias
list2.Add(3);
Console.WriteLine(list1.Count); // 3 — same object`,
    explanation: "Assigning a value type copies all data, so changes to the copy are isolated; assigning a reference type copies only the reference, so both variables point to the same heap object.",
  },
  {
    id: "cs-linkedlist-insertafter",
    language: "csharp",
    title: "LinkedList InsertAfter operations",
    tag: "structures",
    code: `var ll = new LinkedList<int>();
ll.AddLast(1);
ll.AddLast(3);
ll.AddLast(5);

// Insert 2 after the node with value 1
var node1 = ll.Find(1)!;
ll.AddAfter(node1, 2);

// Insert 4 after node with value 3
var node3 = ll.Find(3)!;
ll.AddAfter(node3, 4);

Console.WriteLine(string.Join(", ", ll)); // 1, 2, 3, 4, 5`,
    explanation: "LinkedList<T> supports O(1) insertion before or after any known node, making it efficient for frequent mid-sequence insertions compared to List<T> which requires shifting elements.",
  },
  {
    id: "cs-pattern-negated-not",
    language: "csharp",
    title: "Negated pattern with 'not'",
    tag: "snippet",
    code: `object? obj = "hello";

if (obj is not null)
    Console.WriteLine("not null: " + obj); // not null: hello

int n = 42;
if (n is not (< 0 or > 100))
    Console.WriteLine("in range [0,100]"); // in range [0,100]

string? s = null;
Console.WriteLine(s is not string); // True`,
    explanation: "The 'not' pattern negates any other pattern, enabling expressive null checks and range guards without verbose boolean operators.",
  },
  {
    id: "cs-caveat-string-format-null",
    language: "csharp",
    title: "Caveat: string.Format with null arguments",
    tag: "caveats",
    code: `string? name = null;

// string.Format treats null as empty string — no exception
string result = string.Format("Hello, {0}!", name);
Console.WriteLine(result); // Hello, !

// But calling ToString() on null throws NullReferenceException
try
{
    string bad = name!.ToString();
}
catch (NullReferenceException)
{
    Console.WriteLine("NullReferenceException caught");
}`,
    explanation: "string.Format silently converts null arguments to empty strings, which can mask missing data; always validate inputs if an empty placeholder would be an error.",
  },
  {
    id: "cs-type-nullable-struct-ops",
    language: "csharp",
    title: "Nullable struct operations",
    tag: "types",
    code: `int? a = 5;
int? b = null;

// Lifted operators return null when either operand is null
int? sum = a + b;
Console.WriteLine(sum.HasValue); // False

// Null-coalescing provides a fallback
int result = b ?? -1;
Console.WriteLine(result); // -1

// GetValueOrDefault is safe
Console.WriteLine(b.GetValueOrDefault(0)); // 0`,
    explanation: "Nullable<T> lifts arithmetic and comparison operators so that any operation involving null propagates null, and provides GetValueOrDefault and the ?? operator for safe fallback access.",
  },
  {
    id: "cs-record-abstract-class",
    language: "csharp",
    title: "Abstract record class with derived records",
    tag: "snippet",
    code: `abstract record Animal(string Name)
{
    public abstract string Sound();
}

record Dog(string Name) : Animal(Name)
{
    public override string Sound() => "Woof";
}

record Cat(string Name) : Animal(Name)
{
    public override string Sound() => "Meow";
}

Animal a = new Dog("Rex");
Console.WriteLine($"{a.Name} says {a.Sound()}"); // Rex says Woof`,
    explanation: "Abstract records combine record value semantics (equality, deconstruction, with-expressions) with classic OOP polymorphism through abstract members.",
  },
  {
    id: "cs-stack-peek-pop",
    language: "csharp",
    title: "Stack Peek and Pop operations",
    tag: "structures",
    code: `var stack = new Stack<string>();
stack.Push("first");
stack.Push("second");
stack.Push("third");

Console.WriteLine(stack.Peek()); // third — does not remove
Console.WriteLine(stack.Count);  // 3

Console.WriteLine(stack.Pop());  // third — removes
Console.WriteLine(stack.Count);  // 2

// TryPop is safe when stack might be empty
if (stack.TryPop(out string? val))
    Console.WriteLine(val); // second`,
    explanation: "Stack<T> implements LIFO semantics; Peek reads without removing, Pop reads and removes, and TryPop avoids exceptions on empty stacks.",
  },
  {
    id: "cs-understand-record-mutable",
    language: "csharp",
    title: "Record mutability with init vs set",
    tag: "understanding",
    code: `record Person
{
    public string Name { get; init; } = "";
    public int Age { get; set; } // mutable!
}

var p = new Person { Name = "Alice", Age = 30 };
p.Age = 31; // OK — set accessor
// p.Name = "Bob"; // compile error — init only

var p2 = p with { Name = "Bob" }; // creates new record
Console.WriteLine(p.Name);  // Alice
Console.WriteLine(p2.Name); // Bob`,
    explanation: "Records are not inherently immutable; properties with set accessors can be mutated, while init-only properties can only be set during object initialization or via with-expressions.",
  },
  {
    id: "cs-class-partial-method",
    language: "csharp",
    title: "Partial methods for optional logic hooks",
    tag: "classes",
    code: `partial class Order
{
    public int Id { get; set; }
    partial void OnCreated(int id);

    public void Create(int id)
    {
        Id = id;
        OnCreated(id); // call is removed if no implementation
    }
}

partial class Order
{
    partial void OnCreated(int id) =>
        Console.WriteLine($"Order {id} created");
}

new Order().Create(42); // Order 42 created`,
    explanation: "Partial methods let one part of a partial class declare a hook while another part optionally implements it; if unimplemented, all calls are silently removed by the compiler.",
  },
  {
    id: "cs-linq-selectmany-flat",
    language: "csharp",
    title: "LINQ SelectMany — flatten nested sequences",
    tag: "snippet",
    code: `var orders = new[]
{
    new { Id = 1, Items = new[] { "a", "b" } },
    new { Id = 2, Items = new[] { "c", "d", "e" } },
};

// SelectMany flattens one level of nesting
var allItems = orders.SelectMany(o => o.Items);
Console.WriteLine(string.Join(", ", allItems)); // a, b, c, d, e

// With result selector: pair each item with its order id
var pairs = orders.SelectMany(o => o.Items, (o, item) => $"{o.Id}:{item}");
Console.WriteLine(string.Join(", ", pairs)); // 1:a, 1:b, 2:c, 2:d, 2:e`,
    explanation: "SelectMany projects each element to a sequence and then flattens all resulting sequences into one, effectively performing a one-level collection join.",
  },
  {
    id: "cs-caveat-linq-count-vs-any",
    language: "csharp",
    title: "Caveat: Count() == 0 vs Any() for emptiness check",
    tag: "caveats",
    code: `IEnumerable<int> Infinite()
{
    int i = 0;
    while (true) yield return i++;
}

var seq = Infinite().Where(n => n > 5);

// Any() short-circuits — returns immediately
Console.WriteLine(seq.Any()); // True (fast)

// Count() would iterate forever on infinite sequences
// Never call Count() on lazy/infinite sequences just to check emptiness
// Instead always use Any() or Any(predicate)
Console.WriteLine("Use Any(), not Count() == 0");`,
    explanation: "Any() short-circuits after finding the first matching element, making it O(1) for non-empty sequences, while Count() always enumerates everything — never use Count() == 0 for emptiness checks.",
  },
  {
    id: "cs-hashset-set-ops",
    language: "csharp",
    title: "HashSet set operations",
    tag: "structures",
    code: `var a = new HashSet<int> { 1, 2, 3, 4 };
var b = new HashSet<int> { 3, 4, 5, 6 };

var union = new HashSet<int>(a);
union.UnionWith(b);
Console.WriteLine(string.Join(", ", union)); // 1, 2, 3, 4, 5, 6

var inter = new HashSet<int>(a);
inter.IntersectWith(b);
Console.WriteLine(string.Join(", ", inter)); // 3, 4

var diff = new HashSet<int>(a);
diff.ExceptWith(b);
Console.WriteLine(string.Join(", ", diff)); // 1, 2`,
    explanation: "HashSet<T> provides built-in set algebra operations (Union, Intersect, Except, SymmetricExcept) that mutate the receiver in place or can be applied non-destructively by copying first.",
  },
  {
    id: "cs-pattern-and-or",
    language: "csharp",
    title: "Combining patterns with 'and' / 'or'",
    tag: "snippet",
    code: `int Classify(int n) => n switch
{
    < 0 => -1,                   // negative
    0 => 0,                      // zero
    > 0 and <= 10 => 1,          // small positive
    > 10 and <= 100 => 2,        // medium
    _ => 3                       // large
};

Console.WriteLine(Classify(-5));  // -1
Console.WriteLine(Classify(0));   // 0
Console.WriteLine(Classify(7));   // 1
Console.WriteLine(Classify(50));  // 2
Console.WriteLine(Classify(200)); // 3`,
    explanation: "The 'and' and 'or' combinators let you express compound range conditions inline within switch expressions and if-statement patterns without nested boolean expressions.",
  },
  {
    id: "cs-understand-interface-explicit",
    language: "csharp",
    title: "Explicit interface implementation",
    tag: "understanding",
    code: `interface IFoo { void Method(); }
interface IBar { void Method(); }

class MyClass : IFoo, IBar
{
    void IFoo.Method() => Console.WriteLine("IFoo.Method");
    void IBar.Method() => Console.WriteLine("IBar.Method");
    public void Method() => Console.WriteLine("MyClass.Method");
}

var obj = new MyClass();
obj.Method();                   // MyClass.Method
((IFoo)obj).Method();           // IFoo.Method
((IBar)obj).Method();           // IBar.Method`,
    explanation: "Explicit interface implementation resolves naming conflicts when two interfaces share a member name; the implementation is only accessible through the interface reference, not the class reference.",
  },
  {
    id: "cs-type-implicit-cast-chain",
    language: "csharp",
    title: "Implicit numeric conversion chain",
    tag: "types",
    code: `byte b = 200;
short s = b;   // byte -> short (implicit)
int i = s;     // short -> int (implicit)
long l = i;    // int -> long (implicit)
float f = l;   // long -> float (implicit)
double d = f;  // float -> double (implicit)

Console.WriteLine(d); // 200

// Going the other way requires explicit casts
int back = (int)d;
Console.WriteLine(back); // 200`,
    explanation: "C# defines a widening implicit conversion chain for numeric types; no information is lost going up the chain, but narrowing conversions require explicit casts and may truncate data.",
  },
  {
    id: "cs-class-partial-class-gen",
    language: "csharp",
    title: "Partial class with source-generator pattern",
    tag: "classes",
    code: `// File 1: hand-written
partial class Config
{
    public string AppName { get; set; } = "MyApp";
    partial void Validate();

    public void Load()
    {
        Validate();
        Console.WriteLine($"Loaded: {AppName}");
    }
}

// File 2: could be generated
partial class Config
{
    partial void Validate()
    {
        if (string.IsNullOrEmpty(AppName))
            throw new InvalidOperationException("AppName required");
    }
}

new Config().Load(); // Loaded: MyApp`,
    explanation: "Partial classes split a type across files, enabling source generators to emit code in a separate file while user code remains in another — a cornerstone of modern C# code-generation patterns.",
  },
  {
    id: "cs-linq-reverse",
    language: "csharp",
    title: "LINQ Reverse — invert sequence order",
    tag: "snippet",
    code: `int[] arr = { 1, 2, 3, 4, 5 };
var reversed = arr.Reverse();
Console.WriteLine(string.Join(", ", reversed)); // 5, 4, 3, 2, 1

// Reverse on strings enumerates characters
string word = "hello";
var chars = word.Reverse();
Console.WriteLine(new string(chars.ToArray())); // olleh

// Note: Array.Reverse mutates in place; LINQ Reverse does not
Array.Reverse(arr);
Console.WriteLine(arr[0]); // 5`,
    explanation: "LINQ Reverse() buffers the entire sequence and returns elements in reverse order without modifying the source, while Array.Reverse() is an in-place mutation.",
  },
  {
    id: "cs-caveat-value-task-await-twice",
    language: "csharp",
    title: "Caveat: awaiting ValueTask more than once",
    tag: "caveats",
    code: `using System.Threading.Tasks;

ValueTask<int> vt = new ValueTask<int>(42);

int first = await vt;
Console.WriteLine(first); // 42

// Awaiting the same ValueTask a second time is UNDEFINED behavior
// It may work for synchronously-completed tasks but is not guaranteed
// Always convert to Task if you need to await multiple times:
// Task<int> t = SomeMethod().AsTask();
// int r1 = await t;
// int r2 = await t; // safe for Task

Console.WriteLine("Never await a ValueTask twice");`,
    explanation: "ValueTask is a performance optimization for operations that often complete synchronously; unlike Task, it must not be awaited more than once — convert with AsTask() if multiple awaits are needed.",
  },
  {
    id: "cs-queue-dequeue-peek",
    language: "csharp",
    title: "Queue Dequeue and Peek",
    tag: "structures",
    code: `var queue = new Queue<string>();
queue.Enqueue("first");
queue.Enqueue("second");
queue.Enqueue("third");

Console.WriteLine(queue.Peek());     // first — stays in queue
Console.WriteLine(queue.Count);     // 3

Console.WriteLine(queue.Dequeue()); // first — removed
Console.WriteLine(queue.Count);     // 2

if (queue.TryDequeue(out string? item))
    Console.WriteLine(item); // second`,
    explanation: "Queue<T> implements FIFO semantics; Peek reads the front without removal, Dequeue reads and removes it, and TryDequeue avoids InvalidOperationException on an empty queue.",
  },
  {
    id: "cs-record-sealed-class",
    language: "csharp",
    title: "Sealed record to prevent further inheritance",
    tag: "snippet",
    code: `record Point(int X, int Y);

sealed record ColorPoint(int X, int Y, string Color) : Point(X, Y);

// Cannot derive from sealed record:
// record SpecialPoint(int X, int Y, string Color, int Z)
//     : ColorPoint(X, Y, Color); // compile error

var cp = new ColorPoint(1, 2, "red");
Console.WriteLine(cp); // ColorPoint { X = 1, Y = 2, Color = red }
var cp2 = cp with { Color = "blue" };
Console.WriteLine(cp2.Color); // blue`,
    explanation: "Sealing a record closes the inheritance chain while retaining all record features (equality, deconstruction, with-expressions), and also enables compiler optimizations around equality checks.",
  },
  {
    id: "cs-understand-base-override",
    language: "csharp",
    title: "base calls in overriding methods",
    tag: "understanding",
    code: `class Animal
{
    public virtual string Speak() => "...";
}

class Dog : Animal
{
    public override string Speak() => base.Speak() + " Woof!";
}

class Puppy : Dog
{
    public override string Speak() => base.Speak() + " Yip!";
}

Animal p = new Puppy();
Console.WriteLine(p.Speak()); // ... Woof! Yip!`,
    explanation: "base.Method() calls the immediate parent's implementation, not the root; each override in the chain can augment behavior, and the full chain executes through dynamic dispatch.",
  },
  {
    id: "cs-families-task-thread-process",
    language: "csharp",
    title: "Task vs Thread vs Process",
    tag: "families",
    code: `using System.Diagnostics;
using System.Threading;
using System.Threading.Tasks;

// Thread — OS thread, heavy, manual management
var thread = new Thread(() => Console.WriteLine("Thread"));
thread.Start();

// Task — logical unit of work on thread pool, lightweight
var task = Task.Run(() => Console.WriteLine("Task"));

// Process — separate OS process with own memory space
// var proc = Process.Start("dotnet", "--version");

thread.Join();
await task;
Console.WriteLine("Done");`,
    explanation: "Thread maps to an OS thread and is expensive to create; Task runs on the thread pool and is the preferred async abstraction; Process creates a fully isolated OS process with its own memory.",
  },
  {
    id: "cs-class-explicit-interface-conflict",
    language: "csharp",
    title: "Resolving conflicting interface members explicitly",
    tag: "classes",
    code: `interface IReader { string Read(); }
interface IWriter { string Read(); } // same name, different semantics

class Stream : IReader, IWriter
{
    string IReader.Read() => "reading data";
    string IWriter.Read() => "writing data";
}

var s = new Stream();
Console.WriteLine(((IReader)s).Read()); // reading data
Console.WriteLine(((IWriter)s).Read()); // writing data`,
    explanation: "When two interfaces define a method with the same signature, explicit implementation allows a class to provide distinct logic for each interface without ambiguity.",
  },
  {
    id: "cs-linq-cast-oftype",
    language: "csharp",
    title: "LINQ Cast and OfType for type filtering",
    tag: "snippet",
    code: `var mixed = new object[] { 1, "hello", 2, "world", 3.14 };

// OfType filters and casts — skips non-matching elements
var strings = mixed.OfType<string>();
Console.WriteLine(string.Join(", ", strings)); // hello, world

var ints = mixed.OfType<int>();
Console.WriteLine(string.Join(", ", ints)); // 1, 2

// Cast throws InvalidCastException if any element is wrong type
// mixed.Cast<int>() would throw because "hello" is not int`,
    explanation: "OfType<T>() safely filters elements by type, while Cast<T>() assumes all elements are the target type and throws on mismatch — use OfType when the sequence is heterogeneous.",
  },
  {
    id: "cs-caveat-iasync-cancel",
    language: "csharp",
    title: "Caveat: ignoring CancellationToken in async methods",
    tag: "caveats",
    code: `using System.Threading;
using System.Threading.Tasks;

async Task DoWorkAsync(CancellationToken ct)
{
    for (int i = 0; i < 10; i++)
    {
        ct.ThrowIfCancellationRequested(); // cooperative cancellation
        await Task.Delay(100, ct);
        Console.WriteLine($"Step {i}");
    }
}

using var cts = new CancellationTokenSource(TimeSpan.FromMilliseconds(250));
try { await DoWorkAsync(cts.Token); }
catch (OperationCanceledException) { Console.WriteLine("Cancelled"); }`,
    explanation: "Async methods that ignore their CancellationToken cannot be cancelled mid-flight; always pass the token to inner awaitable calls and call ThrowIfCancellationRequested at loop boundaries.",
  },
  {
    id: "cs-sortedset-view-range",
    language: "csharp",
    title: "SortedSet range views with GetViewBetween",
    tag: "structures",
    code: `var ss = new SortedSet<int> { 5, 2, 8, 1, 9, 3, 7 };
Console.WriteLine(string.Join(", ", ss)); // 1, 2, 3, 5, 7, 8, 9

// GetViewBetween returns a live view — changes reflect back
var view = ss.GetViewBetween(3, 8);
Console.WriteLine(string.Join(", ", view)); // 3, 5, 7, 8

ss.Add(4);
Console.WriteLine(string.Join(", ", view)); // 3, 4, 5, 7, 8

Console.WriteLine(ss.Min); // 1
Console.WriteLine(ss.Max); // 9`,
    explanation: "SortedSet<T> maintains elements in sorted order and provides GetViewBetween for a live range view; Min and Max are O(log n) due to the underlying red-black tree.",
  },
  {
    id: "cs-type-dynamic-late-bind",
    language: "csharp",
    title: "Dynamic late binding",
    tag: "types",
    code: `dynamic obj = "hello";
Console.WriteLine(obj.Length); // 5 — resolved at runtime

obj = 42;
Console.WriteLine(obj + 8); // 50 — int addition

// Dynamic bypasses compile-time checks
dynamic list = new System.Collections.Generic.List<int> { 1, 2, 3 };
list.Add(4);
Console.WriteLine(list.Count); // 4`,
    explanation: "The dynamic type defers member resolution to runtime via the DLR, enabling interop with COM, dynamic languages, and reflection-heavy code, at the cost of no compile-time safety or IntelliSense.",
  },
  {
    id: "cs-record-primary-ctor-body",
    language: "csharp",
    title: "Record with primary constructor body validation",
    tag: "snippet",
    code: `record Temperature(double Celsius)
{
    // Primary constructor body for validation
    public double Celsius { get; } = Celsius < -273.15
        ? throw new ArgumentOutOfRangeException(nameof(Celsius))
        : Celsius;

    public double Fahrenheit => Celsius * 9 / 5 + 32;
}

var t = new Temperature(100);
Console.WriteLine(t.Fahrenheit); // 212

try { new Temperature(-300); }
catch (ArgumentOutOfRangeException) { Console.WriteLine("Too cold!"); }`,
    explanation: "Records support property body overrides within the record body to add validation; assigning to the auto-property with a conditional expression is the idiomatic way to guard primary constructor parameters.",
  },
  {
    id: "cs-understand-new-keyword-hiding",
    language: "csharp",
    title: "Method hiding with 'new' keyword",
    tag: "understanding",
    code: `class Base
{
    public virtual void Show() => Console.WriteLine("Base.Show");
    public void Print() => Console.WriteLine("Base.Print");
}

class Derived : Base
{
    public override void Show() => Console.WriteLine("Derived.Show");
    public new void Print() => Console.WriteLine("Derived.Print");
}

Base b = new Derived();
b.Show();  // Derived.Show — virtual dispatch
b.Print(); // Base.Print  — hiding is NOT polymorphic

Derived d = new Derived();
d.Print(); // Derived.Print`,
    explanation: "override participates in polymorphic dispatch, so the derived method is called through a base reference; new hides the base member but is NOT polymorphic — the base version runs through a base reference.",
  },
  {
    id: "cs-class-operator-comparison",
    language: "csharp",
    title: "Operator overloading for comparison",
    tag: "classes",
    code: `class Length : IComparable<Length>
{
    public double Meters { get; }
    public Length(double m) => Meters = m;

    public static bool operator <(Length a, Length b)  => a.Meters <  b.Meters;
    public static bool operator >(Length a, Length b)  => a.Meters >  b.Meters;
    public static bool operator <=(Length a, Length b) => a.Meters <= b.Meters;
    public static bool operator >=(Length a, Length b) => a.Meters >= b.Meters;

    public int CompareTo(Length? other) => Meters.CompareTo(other?.Meters);
}

var a = new Length(1.5);
var b = new Length(2.0);
Console.WriteLine(a < b);  // True
Console.WriteLine(a >= b); // False`,
    explanation: "Comparison operators must be overloaded in pairs (</>and <=/>=); implementing IComparable<T> alongside them enables use with sorting and ordered collections.",
  },
  {
    id: "cs-linq-range-repeat",
    language: "csharp",
    title: "LINQ Range and Repeat generators",
    tag: "snippet",
    code: `// Enumerable.Range generates a sequence of integers
var range = Enumerable.Range(1, 5);
Console.WriteLine(string.Join(", ", range)); // 1, 2, 3, 4, 5

// Enumerable.Repeat generates N copies of a value
var repeated = Enumerable.Repeat("hi", 3);
Console.WriteLine(string.Join(", ", repeated)); // hi, hi, hi

// Combine: squares of 1-5
var squares = Enumerable.Range(1, 5).Select(n => n * n);
Console.WriteLine(string.Join(", ", squares)); // 1, 4, 9, 16, 25`,
    explanation: "Enumerable.Range and Enumerable.Repeat are lazy generator factories that produce sequences without allocating an array, useful as starting points for LINQ pipelines.",
  },
  {
    id: "cs-caveat-lock-dispose",
    language: "csharp",
    title: "Caveat: disposing inside a lock",
    tag: "caveats",
    code: `using System.Threading;

object _lock = new object();
bool _disposed = false;

void Dispose()
{
    lock (_lock)
    {
        if (_disposed) return;
        _disposed = true;
        // Avoid calling external code while holding a lock (deadlock risk)
        Console.WriteLine("Disposed safely");
    }
}

Dispose();
Dispose(); // idempotent — second call is a no-op`,
    explanation: "Calling Dispose while holding a lock is safe if the lock protects only internal state; calling back into external or user code inside a lock risks deadlocks because lock order is unpredictable.",
  },
  {
    id: "cs-readonlydict-wrap",
    language: "csharp",
    title: "ReadOnlyDictionary wrapper",
    tag: "structures",
    code: `using System.Collections.ObjectModel;

var inner = new Dictionary<string, int>
{
    ["one"] = 1,
    ["two"] = 2,
    ["three"] = 3,
};

// Wrap — mutations to inner are visible through wrapper
IReadOnlyDictionary<string, int> ro = new ReadOnlyDictionary<string, int>(inner);

Console.WriteLine(ro["two"]); // 2
Console.WriteLine(ro.ContainsKey("three")); // True

inner["four"] = 4;
Console.WriteLine(ro.Count); // 4 — live view`,
    explanation: "ReadOnlyDictionary<K,V> wraps an existing dictionary and blocks mutation calls through the wrapper, but it is a live view — changes to the underlying dictionary are still visible.",
  },
  {
    id: "cs-pattern-positional",
    language: "csharp",
    title: "Positional patterns with Deconstruct",
    tag: "snippet",
    code: `record Point(int X, int Y);

string Describe(Point p) => p switch
{
    (0, 0) => "origin",
    (0, _) => "on Y-axis",
    (_, 0) => "on X-axis",
    (> 0, > 0) => "first quadrant",
    _ => "other"
};

Console.WriteLine(Describe(new Point(0, 0)));   // origin
Console.WriteLine(Describe(new Point(0, 5)));   // on Y-axis
Console.WriteLine(Describe(new Point(3, 4)));   // first quadrant
Console.WriteLine(Describe(new Point(-1, 2)));  // other`,
    explanation: "Positional patterns use the Deconstruct method (auto-generated for records) to match individual components, enabling concise coordinate and tuple matching in switch expressions.",
  },
  {
    id: "cs-understand-generic-constraint-multi",
    language: "csharp",
    title: "Multiple generic constraints",
    tag: "understanding",
    code: `interface ILogger { void Log(string msg); }

class Repository<T> where T : class, IComparable<T>, new()
{
    private readonly List<T> _items = new();

    public void Add(T item) => _items.Add(item);

    public T? FindFirst(Func<T, bool> pred) =>
        _items.FirstOrDefault(pred);
}

// T must be: a reference type, implement IComparable<T>, and have parameterless ctor
var repo = new Repository<string>();
repo.Add("banana");
repo.Add("apple");
Console.WriteLine(repo.FindFirst(s => s.StartsWith('a'))); // apple`,
    explanation: "Multiple where clauses constrain a type parameter from multiple angles simultaneously; the constraints are all AND-combined, and 'new()' enables calling new T() inside the generic type.",
  },
  {
    id: "cs-type-anonymous-equality",
    language: "csharp",
    title: "Anonymous type equality",
    tag: "types",
    code: `var a = new { Name = "Alice", Age = 30 };
var b = new { Name = "Alice", Age = 30 };
var c = new { Name = "Bob",   Age = 25 };

// Anonymous types override Equals and GetHashCode
Console.WriteLine(a.Equals(b)); // True — structural equality
Console.WriteLine(a.Equals(c)); // False
Console.WriteLine(a == b);      // False — == uses reference equality
Console.WriteLine(ReferenceEquals(a, b)); // False`,
    explanation: "Anonymous types generate Equals and GetHashCode based on all property values, so two anonymous objects with the same shape and values are logically equal, but == still uses reference equality.",
  },
  {
    id: "cs-record-with-nested",
    language: "csharp",
    title: "Record with-expression on nested records",
    tag: "snippet",
    code: `record Address(string Street, string City);
record Person(string Name, Address Home);

var alice = new Person("Alice", new Address("1 Main St", "Springfield"));

// with-expression creates shallow copy with modifications
var bob = alice with { Name = "Bob" };
Console.WriteLine(bob.Name);        // Bob
Console.WriteLine(bob.Home.City);   // Springfield

// Nested mutation requires explicit nesting
var alice2 = alice with { Home = alice.Home with { City = "Shelbyville" } };
Console.WriteLine(alice2.Home.City); // Shelbyville`,
    explanation: "With-expressions create a new record with some properties changed, but they are shallow; to change nested records you must nest with-expressions, replacing the entire nested record.",
  },
  {
    id: "cs-caveat-thread-exception-swallow",
    language: "csharp",
    title: "Caveat: exceptions swallowed in unobserved tasks",
    tag: "caveats",
    code: `using System.Threading.Tasks;

// Fire-and-forget: exception is unobserved
Task.Run(() => throw new Exception("oops"));

// In .NET 4.5+ unobserved exceptions do NOT crash the app by default
// But they ARE lost — you'll never know something went wrong

// Always observe tasks:
var t = Task.Run(() => throw new Exception("oops2"));
try { await t; }
catch (Exception ex) { Console.WriteLine($"Caught: {ex.Message}"); }`,
    explanation: "Fire-and-forget tasks whose exceptions are never observed are silently swallowed in modern .NET; always await tasks or attach a continuation to ensure errors are logged or handled.",
  },
  {
    id: "cs-immutable-hashset",
    language: "csharp",
    title: "ImmutableHashSet operations",
    tag: "structures",
    code: `using System.Collections.Immutable;

var set = ImmutableHashSet<int>.Empty;
set = set.Add(1).Add(2).Add(3);

// Each operation returns a new set
var set2 = set.Add(4);
Console.WriteLine(set.Count);  // 3 — original unchanged
Console.WriteLine(set2.Count); // 4

var set3 = set2.Remove(2);
Console.WriteLine(set3.Contains(2)); // False
Console.WriteLine(set2.Contains(2)); // True — set2 unchanged`,
    explanation: "ImmutableHashSet<T> returns a new collection from every mutation, sharing structure with the original; all originals remain intact, making these collections safe for concurrent and functional use.",
  },
  {
    id: "cs-pattern-combined",
    language: "csharp",
    title: "Combined type and property patterns",
    tag: "snippet",
    code: `abstract class Shape { }
class Circle { public double Radius { get; init; } }
class Rect   { public double Width { get; init; } public double Height { get; init; } }

double Area(object s) => s switch
{
    Circle { Radius: var r }            => Math.PI * r * r,
    Rect { Width: var w, Height: var h} => w * h,
    _                                   => throw new ArgumentException("unknown")
};

Console.WriteLine(Area(new Circle { Radius = 3 }).ToString("F2")); // 28.27
Console.WriteLine(Area(new Rect { Width = 4, Height = 5 }));       // 20`,
    explanation: "Combined patterns first test the runtime type, then destructure properties in the same arm, eliminating the need for a cast after the type check.",
  },
  {
    id: "cs-understand-nullable-value-boxing",
    language: "csharp",
    title: "Nullable value type boxing behavior",
    tag: "understanding",
    code: `int? hasValue = 42;
int? noValue  = null;

// Boxing a non-null Nullable<T> boxes the underlying T
object boxed = hasValue;
Console.WriteLine(boxed.GetType()); // System.Int32 (not Nullable<int>)
Console.WriteLine(boxed); // 42

// Boxing a null Nullable<T> produces a null reference
object? nullBoxed = noValue;
Console.WriteLine(nullBoxed is null); // True`,
    explanation: "When a Nullable<T> with a value is boxed, the box contains a plain T (not a Nullable<T>); when it has no value, boxing produces a null reference — there is no 'boxed nullable' object.",
  },
  {
    id: "cs-class-operator-arithmetic",
    language: "csharp",
    title: "Arithmetic operator overloading",
    tag: "classes",
    code: `record Vector2(double X, double Y)
{
    public static Vector2 operator +(Vector2 a, Vector2 b) =>
        new(a.X + b.X, a.Y + b.Y);
    public static Vector2 operator -(Vector2 a, Vector2 b) =>
        new(a.X - b.X, a.Y - b.Y);
    public static Vector2 operator *(Vector2 v, double s) =>
        new(v.X * s, v.Y * s);
    public override string ToString() => $"({X}, {Y})";
}

var v1 = new Vector2(1, 2);
var v2 = new Vector2(3, 4);
Console.WriteLine(v1 + v2);  // (4, 6)
Console.WriteLine(v2 * 2);   // (6, 8)`,
    explanation: "Overloading arithmetic operators on a record or class allows natural mathematical syntax; the methods must be static and the compiler does not automatically generate the reverse (e.g., double * Vector2 needs its own overload).",
  },
  {
    id: "cs-linq-defaultifempty",
    language: "csharp",
    title: "LINQ DefaultIfEmpty for null-safe aggregation",
    tag: "snippet",
    code: `int[] empty = Array.Empty<int>();

// Without DefaultIfEmpty, Min/Max/Average throw on empty sequences
var safe = empty.DefaultIfEmpty(0);
Console.WriteLine(safe.Min()); // 0

int[] data = { 3, 1, 4, 1, 5 };
// DefaultIfEmpty has no effect on non-empty sequences
var same = data.DefaultIfEmpty(0);
Console.WriteLine(same.Min()); // 1`,
    explanation: "DefaultIfEmpty returns a sequence with one default element when the source is empty, preventing InvalidOperationException from aggregate operators like Min, Max, and Average.",
  },
  {
    id: "cs-caveat-generic-static-shared",
    language: "csharp",
    title: "Caveat: generic static fields are per closed type",
    tag: "caveats",
    code: `class Cache<T>
{
    // Each closed type gets its OWN static field
    public static int Count = 0;
    public static void Add() => Count++;
}

Cache<int>.Add();
Cache<int>.Add();
Cache<string>.Add();

Console.WriteLine(Cache<int>.Count);    // 2
Console.WriteLine(Cache<string>.Count); // 1
Console.WriteLine(Cache<double>.Count); // 0`,
    explanation: "Static fields in a generic class are not shared across closed generic types; Cache<int>.Count and Cache<string>.Count are completely independent fields, which can be a surprise or a useful per-type registry.",
  },
  {
    id: "cs-readonlycollection-wrap",
    language: "csharp",
    title: "ReadOnlyCollection wrapper over a list",
    tag: "structures",
    code: `using System.Collections.ObjectModel;

var list = new List<string> { "a", "b", "c" };
var ro = new ReadOnlyCollection<string>(list);

Console.WriteLine(ro[1]);   // b
Console.WriteLine(ro.Count); // 3

// Mutation via the wrapper is blocked at compile time
// ro.Add("d"); // compile error

// But mutations to the underlying list are visible
list.Add("d");
Console.WriteLine(ro.Count); // 4`,
    explanation: "ReadOnlyCollection<T> is a thin wrapper that exposes no mutation API, but because it holds a reference to the original list, any mutations to the source are reflected in the wrapper.",
  },
  {
    id: "cs-linq-sequenceequal",
    language: "csharp",
    title: "LINQ SequenceEqual for element-wise comparison",
    tag: "snippet",
    code: `int[] a = { 1, 2, 3 };
int[] b = { 1, 2, 3 };
int[] c = { 1, 2, 4 };

Console.WriteLine(a.SequenceEqual(b)); // True
Console.WriteLine(a.SequenceEqual(c)); // False
Console.WriteLine(a == b);             // False — reference equality

// Works with custom comparer
string[] s1 = { "A", "B" };
string[] s2 = { "a", "b" };
Console.WriteLine(s1.SequenceEqual(s2, StringComparer.OrdinalIgnoreCase)); // True`,
    explanation: "SequenceEqual compares two sequences element by element using the default or provided equality comparer, returning true only if both sequences have the same length and every pair matches.",
  },
  {
    id: "cs-understand-delegate-equality",
    language: "csharp",
    title: "Delegate equality and multicast",
    tag: "understanding",
    code: `Action a = () => Console.Write("A");
Action b = () => Console.Write("B");
Action c = a + b; // multicast delegate

c(); // AB
Console.WriteLine();

// Delegate equality compares invocation lists
Action x = () => Console.Write("X");
Action y = x;
Console.WriteLine(x == y); // True

Action z = () => Console.Write("X");
Console.WriteLine(x == z); // False — different method objects`,
    explanation: "Combining delegates with + creates a multicast delegate that invokes all entries in order; equality compares the invocation list entries, so two lambdas with identical bodies are not equal (different objects).",
  },
  {
    id: "cs-type-tuple-naming",
    language: "csharp",
    title: "Named tuple elements",
    tag: "types",
    code: `(string Name, int Age) person = ("Alice", 30);
Console.WriteLine(person.Name); // Alice
Console.WriteLine(person.Age);  // 30

// Tuple can be deconstructed
var (name, age) = person;
Console.WriteLine(name); // Alice

// Returned from method
static (double Min, double Max) MinMax(int[] arr) =>
    (arr.Min(), arr.Max());

var (min, max) = MinMax(new[] { 3, 1, 4, 1, 5 });
Console.WriteLine($"Min={min} Max={max}"); // Min=1 Max=5`,
    explanation: "Named tuple elements provide readable member access instead of Item1/Item2; names are a compile-time feature embedded in metadata and do not affect the underlying ValueTuple<T1,T2> runtime type.",
  },
  {
    id: "cs-record-nested",
    language: "csharp",
    title: "Nested record definitions",
    tag: "snippet",
    code: `record Order(int Id, Order.LineItem[] Items)
{
    public record LineItem(string Sku, int Quantity, decimal Price)
    {
        public decimal Total => Quantity * Price;
    }
}

var order = new Order(1, new[]
{
    new Order.LineItem("ABC", 2, 9.99m),
    new Order.LineItem("XYZ", 1, 4.50m),
});

decimal total = order.Items.Sum(i => i.Total);
Console.WriteLine(total); // 24.48`,
    explanation: "Records can be nested inside other records to group related value types hierarchically; nested records are accessed through the outer type name and inherit all record features.",
  },
  {
    id: "cs-caveat-covariance-array-writes",
    language: "csharp",
    title: "Caveat: array covariance and ArrayTypeMismatchException",
    tag: "caveats",
    code: `string[] strings = { "a", "b", "c" };
object[] objs = strings; // array covariance — compiles fine

try
{
    objs[0] = 42; // runtime check: 42 is not string
}
catch (ArrayTypeMismatchException)
{
    Console.WriteLine("ArrayTypeMismatchException caught");
}

objs[0] = "safe"; // OK — string is assignable
Console.WriteLine(strings[0]); // safe`,
    explanation: "Array covariance lets you assign a string[] to object[], but the runtime enforces the actual element type on writes, throwing ArrayTypeMismatchException — use IReadOnlyList<T> or IEnumerable<T> covariance instead.",
  },
  {
    id: "cs-immutable-queue",
    language: "csharp",
    title: "ImmutableQueue enqueue and dequeue",
    tag: "structures",
    code: `using System.Collections.Immutable;

var q = ImmutableQueue<string>.Empty;
q = q.Enqueue("first").Enqueue("second").Enqueue("third");

Console.WriteLine(q.Peek()); // first

var q2 = q.Dequeue(out string item);
Console.WriteLine(item);     // first
Console.WriteLine(q.Peek()); // first — q unchanged
Console.WriteLine(q2.Peek()); // second`,
    explanation: "ImmutableQueue<T> provides persistent FIFO semantics; Dequeue returns both the dequeued item and a new queue without that item, leaving the original queue intact.",
  },
  {
    id: "cs-pattern-extended-prop",
    language: "csharp",
    title: "Extended property patterns for deep matching",
    tag: "snippet",
    code: `record City(string Name, Country Country);
record Country(string Code);

string Greet(City city) => city switch
{
    { Country.Code: "US" } => "Howdy!",
    { Country.Code: "FR" } => "Bonjour!",
    { Name: "Tokyo" }      => "Konnichiwa!",
    _                      => "Hello!"
};

Console.WriteLine(Greet(new City("NYC",   new Country("US")))); // Howdy!
Console.WriteLine(Greet(new City("Paris", new Country("FR")))); // Bonjour!
Console.WriteLine(Greet(new City("Tokyo", new Country("JP")))); // Konnichiwa!`,
    explanation: "Extended property patterns (C# 10+) use dot-separated paths like { Country.Code: \"US\" } to match nested properties without intermediate variable declarations.",
  },
  {
    id: "cs-understand-event-vs-delegate",
    language: "csharp",
    title: "Event vs raw delegate field",
    tag: "understanding",
    code: `class Button
{
    // Event: subscribers can only add/remove, not invoke or replace
    public event Action? Clicked;

    public void SimulateClick() => Clicked?.Invoke();
}

var btn = new Button();
btn.Clicked += () => Console.WriteLine("Handler 1");
btn.Clicked += () => Console.WriteLine("Handler 2");

// btn.Clicked = null; // compile error — external code cannot reassign
btn.SimulateClick(); // Handler 1 \n// Handler 2`,
    explanation: "The event keyword restricts external access to += and -= only; raw delegate fields allow external code to replace all subscribers with = or invoke directly, which breaks encapsulation.",
  },
  {
    id: "cs-class-implicit-explicit-cast",
    language: "csharp",
    title: "Implicit and explicit user-defined conversions",
    tag: "classes",
    code: `class Celsius
{
    public double Value { get; }
    public Celsius(double v) => Value = v;

    // Implicit: safe, no data loss
    public static implicit operator Fahrenheit(Celsius c) =>
        new(c.Value * 9.0 / 5 + 32);
}

class Fahrenheit
{
    public double Value { get; }
    public Fahrenheit(double v) => Value = v;

    // Explicit: may lose precision
    public static explicit operator Celsius(Fahrenheit f) =>
        new((f.Value - 32) * 5.0 / 9);
}

Celsius c = new Celsius(100);
Fahrenheit f = c;               // implicit
Console.WriteLine(f.Value);     // 212
Celsius back = (Celsius)f;      // explicit cast required
Console.WriteLine(back.Value);  // 100`,
    explanation: "Implicit conversions should be lossless and non-throwing so they can occur automatically; explicit conversions signal to callers that precision or data loss may occur and require a cast syntax.",
  },
  {
    id: "cs-linq-zip-three",
    language: "csharp",
    title: "LINQ Zip with two and three sequences",
    tag: "snippet",
    code: `int[] ids    = { 1, 2, 3 };
string[] names = { "Alice", "Bob", "Carol" };
int[] scores   = { 90, 85, 95 };

// Two-sequence Zip
var idNames = ids.Zip(names, (id, name) => $"{id}:{name}");
Console.WriteLine(string.Join(", ", idNames)); // 1:Alice, 2:Bob, 3:Carol

// Three-sequence Zip (C# 9+)
var all = ids.Zip(names).Zip(scores, (pair, score) =>
    $"{pair.First} {pair.Second}={score}");
Console.WriteLine(string.Join(" | ", all)); // 1 Alice=90 | 2 Bob=85 | 3 Carol=95`,
    explanation: "Zip merges two sequences element-by-element; for three sequences in older runtimes, chain two Zip calls; C# 9 added a three-argument overload that produces ValueTuple triples.",
  },
  {
    id: "cs-type-object-vs-dynamic",
    language: "csharp",
    title: "object vs dynamic — compile-time vs runtime binding",
    tag: "types",
    code: `object o = "hello";
// o.Length; // compile error — object has no Length

// Cast required for object
Console.WriteLine(((string)o).Length); // 5

dynamic d = "hello";
Console.WriteLine(d.Length); // 5 — no cast needed

// dynamic shifts all type checking to runtime
d = 100;
Console.WriteLine(d + 1); // 101 — works because int supports +`,
    explanation: "object requires explicit casts and gives compile-time safety; dynamic skips compile-time checking entirely and resolves members at runtime via the DLR, trading safety for flexibility.",
  },
  {
    id: "cs-primary-ctor-interface",
    language: "csharp",
    title: "Primary constructor implementing an interface",
    tag: "snippet",
    code: `interface IGreeter { string Greet(string name); }

class FormalGreeter(string salutation) : IGreeter
{
    public string Greet(string name) =>
        $"{salutation}, {name}.";
}

IGreeter g = new FormalGreeter("Good morning");
Console.WriteLine(g.Greet("Alice")); // Good morning, Alice.
Console.WriteLine(g.Greet("Bob"));   // Good morning, Bob.`,
    explanation: "Primary constructors (C# 12) allow capturing constructor parameters as class-scoped fields without writing explicit field declarations or assignment statements, while still implementing interfaces normally.",
  },
  {
    id: "cs-caveat-interface-default-struct",
    language: "csharp",
    title: "Caveat: default interface methods and structs",
    tag: "caveats",
    code: `interface IDescribable
{
    string Name { get; }
    // Default interface method (C# 8+)
    string Describe() => $"I am {Name}";
}

struct Point : IDescribable
{
    public string Name => $"({X},{Y})";
    public int X, Y;
}

Point p = new Point { X = 1, Y = 2 };
// p.Describe(); // compile error — default method not on struct directly

IDescribable d = p; // boxing occurs here!
Console.WriteLine(d.Describe()); // I am (1,2)`,
    explanation: "Default interface methods on structs require calling through the interface type, which causes boxing; if the method mutates state, changes are lost because the box holds a copy.",
  },
  {
    id: "cs-concurrent-queue-ops",
    language: "csharp",
    title: "ConcurrentQueue thread-safe operations",
    tag: "structures",
    code: `using System.Collections.Concurrent;

var cq = new ConcurrentQueue<int>();

// Enqueue is thread-safe
Parallel.For(0, 5, i => cq.Enqueue(i));

Console.WriteLine(cq.Count); // 5

// TryDequeue returns false when empty instead of throwing
while (cq.TryDequeue(out int item))
    Console.Write(item + " ");
Console.WriteLine();

Console.WriteLine(cq.IsEmpty); // True`,
    explanation: "ConcurrentQueue<T> provides lock-free, thread-safe FIFO operations; TryDequeue replaces Dequeue to handle the race between checking Count and dequeueing in concurrent scenarios.",
  },
  {
    id: "cs-switch-expr-complete",
    language: "csharp",
    title: "Exhaustive switch expression",
    tag: "snippet",
    code: `enum Season { Spring, Summer, Autumn, Winter }

string Describe(Season s) => s switch
{
    Season.Spring => "Flowers bloom",
    Season.Summer => "Sun shines",
    Season.Autumn => "Leaves fall",
    Season.Winter => "Snow falls",
    // Compiler warns if any enum value is missing
};

Console.WriteLine(Describe(Season.Spring)); // Flowers bloom
Console.WriteLine(Describe(Season.Winter)); // Snow falls`,
    explanation: "Switch expressions require exhaustiveness; the compiler emits a warning (or error in some analyzers) if a case is missing, and a MatchFailedException is thrown at runtime if an unmatched value reaches the switch.",
  },
  {
    id: "cs-understand-linq-deferred-exec",
    language: "csharp",
    title: "LINQ deferred execution",
    tag: "understanding",
    code: `var list = new List<int> { 1, 2, 3 };

// Query is defined but NOT yet executed
var query = list.Where(n => n > 1);

list.Add(4); // modify source BEFORE iterating

// Iteration happens here — sees the added 4
foreach (var n in query)
    Console.Write(n + " "); // 2 3 4
Console.WriteLine();

// Force immediate execution with ToList/ToArray
var snapshot = list.Where(n => n > 1).ToList();
list.Add(5);
Console.WriteLine(snapshot.Count); // 3 — snapshot is fixed`,
    explanation: "LINQ queries using IEnumerable<T> are deferred — the lambda is not evaluated until the query is iterated; use ToList() or ToArray() to execute immediately and capture a snapshot.",
  },
  {
    id: "cs-linq-leftjoin",
    language: "csharp",
    title: "LINQ left outer join with DefaultIfEmpty",
    tag: "snippet",
    code: `var employees = new[] {
    new { Id = 1, Name = "Alice", DeptId = 10 },
    new { Id = 2, Name = "Bob",   DeptId = 99 }, // no matching dept
};
var depts = new[] {
    new { Id = 10, Name = "Engineering" },
};

var result = from e in employees
             join d in depts on e.DeptId equals d.Id into gj
             from d in gj.DefaultIfEmpty()
             select new { e.Name, Dept = d?.Name ?? "None" };

foreach (var r in result)
    Console.WriteLine($"{r.Name}: {r.Dept}");
// Alice: Engineering
// Bob: None`,
    explanation: "A left outer join in LINQ uses 'join...into' followed by DefaultIfEmpty so that unmatched left-side elements still appear in the result with null for the right side.",
  },
  {
    id: "cs-caveat-expression-tree-closure",
    language: "csharp",
    title: "Caveat: closures in expression trees are limited",
    tag: "caveats",
    code: `using System.Linq.Expressions;

int threshold = 5;

// Compiled lambda — closure works normally
Func<int, bool> compiled = x => x > threshold;
Console.WriteLine(compiled(6)); // True

threshold = 10;
Console.WriteLine(compiled(6)); // False — captured variable changed

// Expression tree captures the VALUE at build time via ConstantExpression
Expression<Func<int, bool>> expr = x => x > threshold;
// expr cannot reference mutable local state directly in EF/LINQ providers
Console.WriteLine(expr); // x => (x > 10)`,
    explanation: "Regular lambdas close over variables by reference, so changes to captured variables are visible; expression trees capture the current value as a ConstantExpression, limiting dynamic behavior but enabling translation to SQL.",
  },
  {
    id: "cs-type-var-target-typed",
    language: "csharp",
    title: "var and target-typed new expressions",
    tag: "types",
    code: `// var infers type from right-hand side
var list = new List<int> { 1, 2, 3 };

// Target-typed new infers type from left-hand side (C# 9)
List<int> list2 = new() { 4, 5, 6 };

// Useful in object initializers and return statements
Dictionary<string, List<int>> map = new();
map["a"] = new() { 1, 2 };

Console.WriteLine(list.Count);   // 3
Console.WriteLine(list2.Count);  // 3
Console.WriteLine(map["a"][0]);  // 1`,
    explanation: "var infers the type from the initializer expression; target-typed new() infers it from the declared type on the left, reducing repetition especially for long generic type names.",
  },
  {
    id: "cs-linq-groupjoin",
    language: "csharp",
    title: "LINQ GroupJoin for hierarchical results",
    tag: "snippet",
    code: `var customers = new[] { new { Id = 1, Name = "Alice" }, new { Id = 2, Name = "Bob" } };
var orders    = new[]
{
    new { CustomerId = 1, Product = "Book" },
    new { CustomerId = 1, Product = "Pen"  },
    new { CustomerId = 2, Product = "Desk" },
};

var result = customers.GroupJoin(
    orders,
    c => c.Id,
    o => o.CustomerId,
    (c, os) => new { c.Name, Orders = os.ToList() }
);

foreach (var r in result)
    Console.WriteLine($"{r.Name}: {string.Join(", ", r.Orders.Select(o => o.Product))}");
// Alice: Book, Pen
// Bob: Desk`,
    explanation: "GroupJoin performs a left outer join that groups matching right-side elements under each left-side element, producing a hierarchical result suitable for master-detail scenarios.",
  },
  {
    id: "cs-caveat-reflection-perf",
    language: "csharp",
    title: "Caveat: reflection performance and caching",
    tag: "caveats",
    code: `using System.Reflection;

var type = typeof(string);

// Slow: MemberInfo lookup every call
for (int i = 0; i < 3; i++)
{
    var mi = type.GetMethod("ToUpper", Type.EmptyTypes)!;
    Console.WriteLine(mi.Invoke("hello", null)); // HELLO
}

// Better: cache MethodInfo outside the loop
var cached = type.GetMethod("ToUpper", Type.EmptyTypes)!;
for (int i = 0; i < 3; i++)
    Console.WriteLine(cached.Invoke("world", null)); // WORLD`,
    explanation: "Reflection method lookup is expensive due to type-system traversal; always cache MethodInfo, PropertyInfo, and ConstructorInfo objects outside loops, or prefer source generators and compiled expressions for hot paths.",
  },
  {
    id: "cs-immutable-stack-push-pop",
    language: "csharp",
    title: "ImmutableStack push and pop",
    tag: "structures",
    code: `using System.Collections.Immutable;

var stack = ImmutableStack<int>.Empty;
stack = stack.Push(1).Push(2).Push(3);

Console.WriteLine(stack.Peek()); // 3

var stack2 = stack.Pop(out int top);
Console.WriteLine(top);          // 3
Console.WriteLine(stack.Peek()); // 3 — original unchanged
Console.WriteLine(stack2.Peek()); // 2`,
    explanation: "ImmutableStack<T> is a persistent LIFO structure; every push and pop returns a new stack sharing structure with the old one, making all versions of the stack available simultaneously.",
  },
  {
    id: "cs-switch-expr-tuple",
    language: "csharp",
    title: "Switch expression with tuple patterns",
    tag: "snippet",
    code: `string RockPaperScissors(string p1, string p2) => (p1, p2) switch
{
    ("Rock",     "Scissors") => "P1 wins",
    ("Scissors", "Paper")    => "P1 wins",
    ("Paper",    "Rock")     => "P1 wins",
    var (a, b) when a == b   => "Draw",
    _                        => "P2 wins",
};

Console.WriteLine(RockPaperScissors("Rock",  "Scissors")); // P1 wins
Console.WriteLine(RockPaperScissors("Paper", "Paper"));    // Draw
Console.WriteLine(RockPaperScissors("Rock",  "Paper"));    // P2 wins`,
    explanation: "Tuple patterns in switch expressions match against multiple values simultaneously, enabling concise decision tables for multi-dimensional logic without nested if-else chains.",
  },
  {
    id: "cs-understand-string-equality",
    language: "csharp",
    title: "String equality: == vs ReferenceEquals vs Equals",
    tag: "understanding",
    code: `string a = "hello";
string b = "hel" + "lo"; // compile-time interned
string c = new string(new char[]{'h','e','l','l','o'}); // not interned

Console.WriteLine(a == b);                       // True — value equality
Console.WriteLine(a == c);                       // True — value equality
Console.WriteLine(ReferenceEquals(a, b));        // True — same interned ref
Console.WriteLine(ReferenceEquals(a, c));        // False — different objects
Console.WriteLine(a.Equals(c));                  // True
Console.WriteLine(string.IsInterned(c) != null); // may be True or False`,
    explanation: "The == operator on strings is overloaded for value equality; ReferenceEquals tests object identity, which only matches for interned strings; Equals also does value equality but is virtual and handles null differently.",
  },
  {
    id: "cs-primary-ctor-dependency",
    language: "csharp",
    title: "Primary constructor for dependency injection",
    tag: "snippet",
    code: `interface ILogger { void Log(string msg); }

class ConsoleLogger : ILogger
{
    public void Log(string msg) => Console.WriteLine($"[LOG] {msg}");
}

class OrderService(ILogger logger)
{
    public void PlaceOrder(string item)
    {
        logger.Log($"Placing order for {item}");
        // ... order logic
        logger.Log($"Order placed: {item}");
    }
}

var svc = new OrderService(new ConsoleLogger());
svc.PlaceOrder("Widget");`,
    explanation: "Primary constructors (C# 12) make dependency injection more concise by capturing parameters directly into the class scope, eliminating boilerplate field declarations and manual assignments.",
  },
  {
    id: "cs-caveat-params-new-overload",
    language: "csharp",
    title: "Caveat: params and overload resolution surprise",
    tag: "caveats",
    code: `void Print(string s) => Console.WriteLine($"string: {s}");
void Print(params string[] arr) => Console.WriteLine($"array: {arr.Length}");
void Print(object o) => Console.WriteLine($"object: {o}");

Print("hello");        // string: hello  (exact match wins)
Print("a", "b");       // array: 2
Print(42);             // object: 42

// One-element array: does it pick string or params?
string[] one = { "x" };
Print(one);            // array: 1  (no implicit array unwrap)`,
    explanation: "Overload resolution prefers the most specific match; a single string argument matches the exact string overload, not params; when an array is passed, the params overload receives it directly without wrapping.",
  },
  {
    id: "cs-type-new-expr-target",
    language: "csharp",
    title: "Target-typed new in various positions",
    tag: "types",
    code: `// In variable declaration
StringBuilder sb = new();

// In method argument
void Process(List<int> items) => Console.WriteLine(items.Count);
Process(new() { 1, 2, 3 }); // 3

// In conditional expression
bool flag = true;
List<int> result = flag ? new() { 1 } : new() { 2, 3 };
Console.WriteLine(result.Count); // 1

// In object initializer
var wrapper = new { Items = new List<string>() };
Console.WriteLine(wrapper.Items.Count); // 0`,
    explanation: "Target-typed new() works wherever the type is already known from context: declarations, method arguments, conditional expressions, and field initializers — reducing verbosity for long generic names.",
  },
  {
    id: "cs-concurrent-stack-ops",
    language: "csharp",
    title: "ConcurrentStack thread-safe operations",
    tag: "structures",
    code: `using System.Collections.Concurrent;

var cs = new ConcurrentStack<int>();
cs.Push(1); cs.Push(2); cs.Push(3);

// PushRange for atomic bulk push
cs.PushRange(new[] { 4, 5, 6 });

Console.WriteLine(cs.Count); // 6

// TryPop is safe under concurrency
while (cs.TryPop(out int val))
    Console.Write(val + " "); // 6 5 4 3 2 1 (LIFO order)
Console.WriteLine();`,
    explanation: "ConcurrentStack<T> provides thread-safe LIFO operations with TryPop and TryPeek replacing throw-on-empty methods; PushRange atomically pushes multiple items, useful for batch producers.",
  },
  {
    id: "cs-primary-ctor-validation",
    language: "csharp",
    title: "Primary constructor with guard validation",
    tag: "snippet",
    code: `class Email(string address)
{
    public string Address { get; } = IsValid(address)
        ? address
        : throw new ArgumentException($"Invalid email: {address}");

    private static bool IsValid(string s) =>
        s.Contains('@') && s.Contains('.');
}

var e1 = new Email("user@example.com");
Console.WriteLine(e1.Address); // user@example.com

try { new Email("notanemail"); }
catch (ArgumentException ex) { Console.WriteLine(ex.Message); }`,
    explanation: "Primary constructor parameters can be validated by assigning to a property with a conditional expression that throws on invalid input, providing constructor-level guard validation without a separate constructor body.",
  },
  {
    id: "cs-caveat-delegate-target",
    language: "csharp",
    title: "Caveat: delegate Target keeps object alive",
    tag: "caveats",
    code: `class Sensor
{
    public string Name;
    public Sensor(string n) => Name = n;
    public void OnData(int v) => Console.WriteLine($"{Name}: {v}");
}

// Delegate holds a reference to the Sensor instance
var sensor = new Sensor("Temp");
Action<int> handler = sensor.OnData;

sensor = null!; // "release" the reference

// But the delegate still keeps Sensor alive via handler.Target!
GC.Collect(); GC.WaitForPendingFinalizers();
handler(42); // still works: Temp: 42`,
    explanation: "Instance method delegates store a reference to their target object in the Target property; as long as the delegate is alive, the target object cannot be garbage collected, which can cause memory leaks in event subscriptions.",
  },
  {
    id: "cs-priority-queue-update",
    language: "csharp",
    title: "PriorityQueue enqueue and dequeue by priority",
    tag: "structures",
    code: `var pq = new PriorityQueue<string, int>();
pq.Enqueue("low",    10);
pq.Enqueue("high",    1);
pq.Enqueue("medium",  5);

// Dequeues in ascending priority order (lowest number = highest priority)
while (pq.Count > 0)
{
    pq.TryDequeue(out string? item, out int priority);
    Console.WriteLine($"{priority}: {item}");
}
// 1: high
// 5: medium
// 10: low`,
    explanation: "PriorityQueue<TElement, TPriority> (introduced in .NET 6) is a min-heap; elements with the smallest priority value are dequeued first, avoiding the need for third-party priority queue implementations.",
  },
  {
    id: "cs-inline-array-usage",
    language: "csharp",
    title: "Inline arrays for fixed-size stack buffers",
    tag: "snippet",
    code: `using System.Runtime.CompilerServices;

[InlineArray(8)]
struct Buffer8
{
    private int _element0;
}

Buffer8 buf = default;
for (int i = 0; i < 8; i++)
    buf[i] = i * i;

for (int i = 0; i < 8; i++)
    Console.Write(buf[i] + " "); // 0 1 4 9 16 25 36 49
Console.WriteLine();`,
    explanation: "Inline arrays (C# 12) declare a fixed-size struct buffer allocated entirely on the stack or inline in a containing struct, providing safe indexed access without unsafe code or stackalloc.",
  },
  {
    id: "cs-caveat-record-deconstruct-pat",
    language: "csharp",
    title: "Caveat: record deconstruction order in patterns",
    tag: "caveats",
    code: `record Range(int Min, int Max);

// Positional pattern uses primary constructor ORDER
var r = new Range(1, 10);

// (Min, Max) positional match
if (r is (var lo, var hi))
    Console.WriteLine($"lo={lo} hi={hi}"); // lo=1 hi=10

// Easy to swap accidentally if record reordered
record SwappedRange(int Max, int Min); // different order!

var sr = new SwappedRange(10, 1);
if (sr is (var first, var second))
    Console.WriteLine($"{first} {second}"); // 10 1 — Max comes first!`,
    explanation: "Positional patterns use the Deconstruct method parameter order, which mirrors the primary constructor order; if a record's parameter order changes, all positional pattern matches silently use the new order.",
  },
  {
    id: "cs-dictionary-collision",
    language: "csharp",
    title: "Dictionary with custom equality comparer",
    tag: "structures",
    code: `// Case-insensitive dictionary using custom comparer
var dict = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
dict["Apple"] = 1;
dict["BANANA"] = 2;

Console.WriteLine(dict["apple"]);  // 1
Console.WriteLine(dict["banana"]); // 2
Console.WriteLine(dict.ContainsKey("APPLE")); // True

// Without comparer, keys are case-sensitive
var caseSensitive = new Dictionary<string, int>();
caseSensitive["Apple"] = 1;
Console.WriteLine(caseSensitive.ContainsKey("apple")); // False`,
    explanation: "Dictionary<K,V> accepts an IEqualityComparer<K> to control how keys are compared and hashed; providing StringComparer.OrdinalIgnoreCase makes string keys case-insensitive without manual normalization.",
  },
  {
    id: "cs-collection-expr-concat",
    language: "csharp",
    title: "Collection expressions with concatenation",
    tag: "snippet",
    code: `// Collection expressions (C# 12)
int[] a = [1, 2, 3];
int[] b = [4, 5, 6];

// Spread operator .. concatenates inline
int[] combined = [..a, ..b];
Console.WriteLine(string.Join(", ", combined)); // 1, 2, 3, 4, 5, 6

// Works with any collection type
List<string> words = ["hello", "world"];
Span<string> span = ["foo", "bar"];
Console.WriteLine(words.Count); // 2`,
    explanation: "Collection expressions (C# 12) provide a unified literal syntax [e1, e2] for all collection types and the spread operator .. to inline another collection's elements without explicit AddRange or Concat.",
  },
  {
    id: "cs-understand-params-overload",
    language: "csharp",
    title: "params array vs explicit array argument",
    tag: "understanding",
    code: `int Sum(params int[] nums)
{
    int total = 0;
    foreach (var n in nums) total += n;
    return total;
}

// Compiler wraps individual args in an array automatically
Console.WriteLine(Sum(1, 2, 3));       // 6
Console.WriteLine(Sum(1, 2, 3, 4, 5)); // 15

// Passing an existing array directly — no extra allocation
int[] arr = { 10, 20, 30 };
Console.WriteLine(Sum(arr)); // 60

// Zero args: empty array is allocated
Console.WriteLine(Sum()); // 0`,
    explanation: "params causes the compiler to collect individual arguments into an array; passing an existing array is passed directly without rewrapping, and zero arguments produce an empty (not null) array.",
  },
  {
    id: "cs-class-idisposable-using-decl",
    language: "csharp",
    title: "IDisposable with using declaration (C# 8+)",
    tag: "classes",
    code: `class Resource : IDisposable
{
    public string Name { get; }
    public Resource(string name)
    {
        Name = name;
        Console.WriteLine($"Acquired: {name}");
    }
    public void Dispose() => Console.WriteLine($"Released: {Name}");
}

void Demo()
{
    using var r1 = new Resource("File");
    using var r2 = new Resource("Connection");
    Console.WriteLine("Working...");
} // r2 disposed first, then r1

Demo();`,
    explanation: "The 'using var' declaration (C# 8+) disposes the resource when the enclosing scope exits, in reverse order of declaration, without the extra nesting of a using block.",
  },
  {
    id: "cs-type-collection-init",
    language: "csharp",
    title: "Collection initializer syntax internals",
    tag: "types",
    code: `// Collection initializers call Add for each element
var dict = new Dictionary<string, int>
{
    { "one",   1 },
    { "two",   2 },
    { "three", 3 },
};
Console.WriteLine(dict["two"]); // 2

// Index initializer (alternative syntax for IDictionary)
var dict2 = new Dictionary<string, int>
{
    ["a"] = 10,
    ["b"] = 20,
};
Console.WriteLine(dict2["a"]); // 10`,
    explanation: "Collection initializers are syntactic sugar for repeated Add calls; for IDictionary, the index initializer syntax (key = value) calls the indexer setter instead, which is cleaner for dictionary literals.",
  },
  {
    id: "cs-collection-expr-spread-op",
    language: "csharp",
    title: "Spread operator in collection expressions",
    tag: "snippet",
    code: `int[] base1 = [1, 2, 3];
int[] extra = [10, 20];

// Spread in the middle or at the ends
int[] result = [0, ..base1, 4, 5, ..extra];
Console.WriteLine(string.Join(", ", result));
// 0, 1, 2, 3, 4, 5, 10, 20

// Works with any IEnumerable
IEnumerable<int> seq = [100, 200];
int[] merged = [..result, ..seq];
Console.WriteLine(merged.Length); // 10`,
    explanation: "The spread operator .. inside a collection expression inlines every element from the source collection at that position; the compiler may optimize this to avoid intermediate allocations.",
  },
  {
    id: "cs-understand-optional-vs-nullable",
    language: "csharp",
    title: "Optional parameters vs nullable parameters",
    tag: "understanding",
    code: `// Optional parameter: caller may omit it entirely
void Greet(string name, string greeting = "Hello")
    => Console.WriteLine($"{greeting}, {name}!");

Greet("Alice");          // Hello, Alice!
Greet("Bob", "Hi");      // Hi, Bob!

// Nullable parameter: caller must pass but can pass null
void Display(string? label)
    => Console.WriteLine(label ?? "(none)");

Display(null);           // (none)
Display("Info");         // Info`,
    explanation: "Optional parameters have compile-time default values embedded at call sites; nullable parameters require the caller to explicitly pass a value, which can be null — they serve different design intents.",
  },
  {
    id: "cs-families-exception-hierarchy",
    language: "csharp",
    title: "Exception class hierarchy",
    tag: "families",
    code: `try
{
    int[] arr = new int[3];
    arr[5] = 1; // IndexOutOfRangeException : SystemException : Exception
}
catch (IndexOutOfRangeException ex)
{
    Console.WriteLine($"IndexOutOfRange: {ex.Message}");
}

try
{
    throw new InvalidOperationException("bad state",
        new ArgumentNullException("param"));
}
catch (Exception ex)
{
    Console.WriteLine(ex.GetType().Name);      // InvalidOperationException
    Console.WriteLine(ex.InnerException?.GetType().Name); // ArgumentNullException
}`,
    explanation: "All exceptions derive from System.Exception; SystemException covers runtime errors (IndexOutOfRange, NullReference), ApplicationException is the base for app-defined exceptions, and InnerException chains causes.",
  },
  {
    id: "cs-class-icomparable-impl",
    language: "csharp",
    title: "IComparable<T> implementation for sorting",
    tag: "classes",
    code: `class Product : IComparable<Product>
{
    public string Name { get; init; } = "";
    public decimal Price { get; init; }

    public int CompareTo(Product? other)
    {
        if (other is null) return 1;
        return Price.CompareTo(other.Price);
    }
}

var products = new List<Product>
{
    new() { Name = "C", Price = 9.99m },
    new() { Name = "A", Price = 4.99m },
    new() { Name = "B", Price = 14.99m },
};

products.Sort();
foreach (var p in products)
    Console.WriteLine($"{p.Name}: {p.Price}");`,
    explanation: "Implementing IComparable<T>.CompareTo enables objects to be sorted by List.Sort, Array.Sort, and ordered collections without a separate comparer; returning 1 for null by convention places nulls at the start.",
  },
  {
    id: "cs-understand-tuple-equality",
    language: "csharp",
    title: "Tuple structural equality",
    tag: "understanding",
    code: `// ValueTuple (C# 7+) — structural equality
var t1 = (1, "hello");
var t2 = (1, "hello");
var t3 = (2, "world");

Console.WriteLine(t1 == t2); // True
Console.WriteLine(t1 == t3); // False
Console.WriteLine(t1.Equals(t2)); // True

// System.Tuple (older) — reference equality
var old1 = Tuple.Create(1, "hello");
var old2 = Tuple.Create(1, "hello");
Console.WriteLine(old1 == old2);     // False — reference
Console.WriteLine(old1.Equals(old2)); // True — Equals overridden`,
    explanation: "ValueTuple uses structural == equality comparing each element; the older System.Tuple class overrides Equals for structural comparison but == remains reference equality, making them behave differently in comparisons.",
  },
  {
    id: "cs-families-string-operations",
    language: "csharp",
    title: "String operation family overview",
    tag: "families",
    code: `string s = "  Hello, World!  ";

Console.WriteLine(s.Trim());                  // "Hello, World!"
Console.WriteLine(s.ToUpper());               // "  HELLO, WORLD!  "
Console.WriteLine(s.Replace("World", "C#"));  // "  Hello, C#!  "
Console.WriteLine(s.Contains("World"));       // True
Console.WriteLine(s.IndexOf("World"));        // 9
Console.WriteLine(s.Substring(8, 5));         // "o, Wo"
Console.WriteLine(string.Join("-", s.Trim().Split(", "))); // "Hello-World!"`,
    explanation: "String is immutable; all operations return new strings. Key operations include Trim/Pad for whitespace, Replace/Split for content modification, and IndexOf/Contains/StartsWith for search.",
  },
  {
    id: "cs-class-iequatable-impl",
    language: "csharp",
    title: "IEquatable<T> for value equality",
    tag: "classes",
    code: `class Money : IEquatable<Money>
{
    public decimal Amount { get; }
    public string Currency { get; }

    public Money(decimal amount, string currency)
        => (Amount, Currency) = (amount, currency);

    public bool Equals(Money? other) =>
        other is not null && Amount == other.Amount && Currency == other.Currency;

    public override bool Equals(object? obj) => Equals(obj as Money);
    public override int GetHashCode() => HashCode.Combine(Amount, Currency);
}

var a = new Money(10, "USD");
var b = new Money(10, "USD");
Console.WriteLine(a.Equals(b)); // True
Console.WriteLine(a == b);      // False — == not overloaded`,
    explanation: "IEquatable<T> provides a strongly-typed Equals avoiding boxing; always also override object.Equals and GetHashCode for consistency, and use HashCode.Combine to compose hash codes correctly.",
  },
  {
    id: "cs-families-numeric-types",
    language: "csharp",
    title: "Numeric type family: integer, floating-point, decimal",
    tag: "families",
    code: `// Integer types: byte, sbyte, short, ushort, int, uint, long, ulong
long big = long.MaxValue;
Console.WriteLine(big); // 9223372036854775807

// Floating-point: float (32-bit), double (64-bit)
double d = 0.1 + 0.2;
Console.WriteLine(d == 0.3); // False — binary floating point
Console.WriteLine(Math.Abs(d - 0.3) < 1e-9); // True — use epsilon

// Decimal: 128-bit, base-10, exact for currency
decimal money = 0.1m + 0.2m;
Console.WriteLine(money == 0.3m); // True`,
    explanation: "Integer types differ in range and sign; floating-point types use binary representation and suffer rounding errors; decimal uses base-10 and is exact for financial calculations at the cost of performance.",
  },
];
