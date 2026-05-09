import type { Snippet } from "./types";

export const csharpSnippets20260509B2P1: Snippet[] = [
  {
    id: "cs-snippet-linq-select-where",
    language: "csharp",
    title: "LINQ method chain: Select, Where, OrderBy",
    tag: "snippet",
    code: `var numbers = Enumerable.Range(1, 10);

var result = numbers
    .Where(n => n % 2 == 0)          // filter evens
    .Select(n => n * n)               // square them
    .OrderByDescending(n => n)        // sort descending
    .Take(3);                         // first 3

foreach (var n in result)
    Console.Write(n + " ");
// 100 64 36`,
    explanation: "LINQ methods chain via extension methods on IEnumerable<T>; each operator returns a new lazy sequence and evaluation is deferred until iteration. Where filters, Select transforms, OrderByDescending sorts.",
  },
  {
    id: "cs-snippet-linq-groupby",
    language: "csharp",
    title: "LINQ GroupBy groups elements by a key",
    tag: "snippet",
    code: `var words = new[] { "apple", "avocado", "banana", "cherry", "blueberry" };

var byLetter = words.GroupBy(w => w[0]);

foreach (var group in byLetter)
{
    Console.WriteLine($"{group.Key}: {string.Join(", ", group)}");
}
// a: apple, avocado
// b: banana, blueberry
// c: cherry`,
    explanation: "GroupBy returns IEnumerable<IGrouping<TKey,T>>; each IGrouping has a Key property and is itself an IEnumerable of matching elements. Useful for pivot-style aggregations.",
  },
  {
    id: "cs-snippet-linq-aggregate",
    language: "csharp",
    title: "LINQ Aggregate implements a custom fold",
    tag: "snippet",
    code: `int[] numbers = { 1, 2, 3, 4, 5 };

// Aggregate(seed, accumulator)
int product = numbers.Aggregate(1, (acc, n) => acc * n);
Console.WriteLine(product);   // 120

// With result selector
string csv = numbers.Aggregate(
    new System.Text.StringBuilder(),
    (sb, n) => { sb.Append(n).Append(','); return sb; },
    sb => sb.ToString().TrimEnd(',')
);
Console.WriteLine(csv);   // 1,2,3,4,5`,
    explanation: "Aggregate is the general fold operation; it applies an accumulator function to each element sequentially. The overload with a result selector transforms the final accumulated value.",
  },
  {
    id: "cs-snippet-collection-expressions",
    language: "csharp",
    title: "Collection expressions (C# 12) with spread operator",
    tag: "snippet",
    code: `// C# 12: unified syntax for collection literals
int[] arr = [1, 2, 3];
List<string> names = ["Alice", "Bob"];
Span<byte> span = [0x01, 0x02, 0x03];

// Spread operator .. concatenates collections
int[] a = [1, 2, 3];
int[] b = [4, 5, 6];
int[] combined = [..a, ..b, 7, 8];
Console.WriteLine(string.Join(",", combined));
// 1,2,3,4,5,6,7,8`,
    explanation: "Collection expressions (C# 12) provide a unified [] syntax for arrays, lists, and spans; the spread operator .. flattens an existing collection into the literal, replacing new[] { ... } and list initialiser syntax.",
  },
  {
    id: "cs-snippet-switch-when",
    language: "csharp",
    title: "switch with when guards adds per-arm conditions",
    tag: "snippet",
    code: `static string Classify(int n) => n switch
{
    0                  => "zero",
    int x when x < 0  => $"negative ({x})",
    int x when x < 10 => "small",
    int x when x < 100 => "medium",
    _                  => "large",
};

Console.WriteLine(Classify(0));    // zero
Console.WriteLine(Classify(-5));   // negative (-5)
Console.WriteLine(Classify(7));    // small
Console.WriteLine(Classify(999));  // large`,
    explanation: "when guards add an extra boolean condition to a switch arm; the first arm whose pattern and guard both match wins, so order matters. This replaces long if-else chains with readable tabular logic.",
  },
  {
    id: "cs-snippet-raw-string-literal",
    language: "csharp",
    title: "Raw string literals (C# 11) avoid escape sequences",
    tag: "snippet",
    code: `// Triple-quote: content between """ and """
string json = """
    {
        "name": "Alice",
        "age": 30
    }
    """;

// Interpolated raw string
string name = "World";
string msg = $"""Hello, {name}!""";
Console.WriteLine(msg);   // Hello, World!

// More quotes to allow """ inside
string q = """"He said """hi""".""";`,
    explanation: "Raw string literals (\"\"\"...\"\"\") contain content verbatim with no escape processing; the indentation of the closing \"\"\" is stripped. Add more opening quotes to allow that many quotes inside the content.",
  },
  {
    id: "cs-understanding-gc-generations",
    language: "csharp",
    title: "GC generational collection: Gen0, Gen1, Gen2",
    tag: "understanding",
    code: `// Allocations start in Gen0 (cheapest to collect)
// Objects that survive a Gen0 collection move to Gen1
// Objects that survive Gen1 move to Gen2 (most expensive)

Console.WriteLine(GC.MaxGeneration);  // 2

// Trigger a Gen0 collection (fast, ~0ms)
GC.Collect(0, GCCollectionMode.Forced);

// Gen2 collection is expensive -- avoid triggering manually
// Check collection counts per generation
int g0 = GC.CollectionCount(0);
int g1 = GC.CollectionCount(1);
int g2 = GC.CollectionCount(2);
Console.WriteLine($"Gen0:{g0} Gen1:{g1} Gen2:{g2}");`,
    explanation: "The GC uses three generations; short-lived objects are collected cheaply in Gen0. Long-lived objects promoted to Gen2 are collected infrequently but more expensively. Reducing allocations is more effective than tuning GC.",
  },
  {
    id: "cs-understanding-value-on-stack",
    language: "csharp",
    title: "Value types on the stack vs boxed on the heap",
    tag: "understanding",
    code: `// Stack-allocated: int, double, bool, struct
void Method()
{
    int x = 42;          // 4 bytes on stack
    double d = 3.14;     // 8 bytes on stack
    // Freed automatically when method returns
}

// Heap-allocated: class instances, boxed value types
void Heap()
{
    object boxed = 42;   // heap: boxing copies the int into an object
    string s = "hello";  // heap: string is a reference type
}

// Span<T> provides stack allocation for arrays
Span<int> buf = stackalloc int[10];
buf[0] = 99;`,
    explanation: "Local value types are allocated on the stack and freed on method exit with zero GC cost. Boxing copies a value type into a heap-allocated object; avoid boxing in hot paths by using generics instead of object.",
  },
  {
    id: "cs-understanding-virtual-dispatch",
    language: "csharp",
    title: "virtual methods use vtable dispatch; sealed avoids it",
    tag: "understanding",
    code: `class Animal
{
    public virtual string Speak() => "...";    // vtable slot
}

class Dog : Animal
{
    public override string Speak() => "Woof";  // overrides slot
}

class Cat : Animal
{
    public sealed override string Speak() => "Meow";  // devirtualised
}

Animal a = new Dog();
Console.WriteLine(a.Speak());   // Woof (virtual dispatch)

// sealed override: JIT can inline the call (no vtable lookup)
Cat c = new Cat();
Console.WriteLine(c.Speak());   // Meow (direct call)`,
    explanation: "Virtual calls use a vtable lookup at runtime; sealing an override allows the JIT to devirtualise the call (inline or direct call), which is faster. Declare leaf classes or methods sealed when no further overriding is intended.",
  },
  {
    id: "cs-understanding-ref-struct",
    language: "csharp",
    title: "ref struct is stack-only: cannot appear on the heap",
    tag: "understanding",
    code: `// Span<T> is a ref struct -- can't be stored in class fields
// or used in async methods or lambda captures

ref struct StackOnly
{
    public int Value;
}

void Example()
{
    StackOnly s = new() { Value = 42 };
    // Valid: local variable (stack)
    // INVALID: class field, array element, boxing, async/await
}

// Span<T> and ReadOnlySpan<T> are ref structs
// This is why you can't await while holding a Span`,
    explanation: "ref structs are guaranteed to live only on the stack; the compiler prevents storing them in heap-allocated locations. This allows safe zero-copy slicing without the risk of holding a dangling stack reference.",
  },
  {
    id: "cs-structures-readonly-struct",
    language: "csharp",
    title: "readonly struct prevents defensive copies",
    tag: "structures",
    code: `// Without readonly: compiler copies struct before calling methods
// to guarantee the original isn't mutated (expensive on large structs)

readonly struct Vector3
{
    public readonly float X, Y, Z;
    public Vector3(float x, float y, float z) => (X, Y, Z) = (x, y, z);

    public float Length() => MathF.Sqrt(X*X + Y*Y + Z*Z);
    public Vector3 Normalise() => new(X/Length(), Y/Length(), Z/Length());
}

var v = new Vector3(1, 2, 2);
Console.WriteLine(v.Length());       // 3
Console.WriteLine(v.Normalise().X);  // 0.333...`,
    explanation: "readonly struct guarantees all fields are readonly, letting the JIT and compiler skip the defensive copy made before calling instance methods -- critical for performance when structs are large or called frequently.",
  },
  {
    id: "cs-structures-immutable-array",
    language: "csharp",
    title: "ImmutableArray<T> is a struct: zero boxing overhead",
    tag: "structures",
    code: `using System.Collections.Immutable;

ImmutableArray<int> arr = ImmutableArray.Create(1, 2, 3, 4, 5);

// Add returns a new array; original unchanged
ImmutableArray<int> arr2 = arr.Add(6);

Console.WriteLine(arr.Length);    // 5
Console.WriteLine(arr2.Length);   // 6

// ImmutableArray is a struct wrapping T[], so:
// - No heap allocation for the wrapper (unlike ImmutableList)
// - But Add is O(n) (copies the array); use ImmutableList for frequent mutations`,
    explanation: "ImmutableArray<T> wraps a plain array in a struct, avoiding the boxing overhead of ImmutableList<T>; ideal for collections built once and read many times. Add/Remove are O(n) because they copy the underlying array.",
  },
  {
    id: "cs-structures-dictionary-capacity",
    language: "csharp",
    title: "Dictionary pre-allocating capacity avoids rehashing",
    tag: "structures",
    code: `// Without capacity: rehashes as count crosses load-factor threshold
var d1 = new Dictionary<string, int>();

// With capacity: avoids rehashing for known-size collections
var d2 = new Dictionary<string, int>(capacity: 1000);

// Check count and size
var d = new Dictionary<string, int>(4);
for (int i = 0; i < 10; i++) d[i.ToString()] = i;
Console.WriteLine(d.Count);   // 10 (expanded as needed)

// CollectionsMarshal can access the raw struct if needed
// System.Runtime.InteropServices.CollectionsMarshal.GetValueRefOrAddDefault(d, key, out bool exists)`,
    explanation: "Specifying initial capacity prevents Dictionary from rehashing (which copies all entries) as it grows; pass the expected final count to the constructor when it's known ahead of time.",
  },
  {
    id: "cs-structures-list-capacity",
    language: "csharp",
    title: "List<T> doubles its capacity on overflow",
    tag: "structures",
    code: `var list = new List<int>(capacity: 4);
Console.WriteLine(list.Capacity);   // 4

for (int i = 0; i < 5; i++) list.Add(i);
Console.WriteLine(list.Capacity);   // 8  (doubled)

for (int i = 0; i < 5; i++) list.Add(i);
Console.WriteLine(list.Capacity);   // 16

// Trim excess capacity after bulk load
list.TrimExcess();
Console.WriteLine(list.Capacity);   // 10 (== Count)

// Pre-allocate when count is known
var big = new List<int>(10_000);`,
    explanation: "List<T> uses a doubling strategy (amortised O(1) Add); pre-allocating with the known final count avoids all intermediate copies. TrimExcess releases unused capacity after bulk loading.",
  },
  {
    id: "cs-caveats-foreach-struct",
    language: "csharp",
    title: "foreach on a List<struct> copies each element",
    tag: "caveats",
    code: `struct Point { public int X, Y; }

var points = new List<Point>
{
    new Point { X = 1, Y = 2 },
    new Point { X = 3, Y = 4 },
};

foreach (var p in points)
{
    // p is a COPY of the struct -- mutations don't affect the list
    // p.X = 99;  // modifies the copy, not the list element
}

// Use index access to mutate
for (int i = 0; i < points.Count; i++)
{
    var p = points[i];
    p.X = 99;
    points[i] = p;   // write back
}`,
    explanation: "foreach on a collection of value types copies each element into the iteration variable; mutations to the copy don't affect the collection. Use indexed access and write-back to mutate structs in a list.",
  },
  {
    id: "cs-caveats-explicit-interface",
    language: "csharp",
    title: "Explicit interface implementation hides members from the class",
    tag: "caveats",
    code: `interface IPrintable { void Print(); }
interface ISerializable { void Print(); }  // same name, different contract

class Document : IPrintable, ISerializable
{
    // Explicit: only accessible via the interface reference
    void IPrintable.Print()    => Console.WriteLine("print");
    void ISerializable.Print() => Console.WriteLine("serialize");
}

var doc = new Document();
// doc.Print();  // CS0117: no 'Print' on Document

((IPrintable)doc).Print();     // print
((ISerializable)doc).Print();  // serialize`,
    explanation: "Explicit interface implementation is required when two interfaces declare the same member name; it also hides the member from the concrete type's public surface, useful for legacy interface compatibility.",
  },
  {
    id: "cs-caveats-configureawait",
    language: "csharp",
    title: "ConfigureAwait(false) avoids SynchronizationContext capture",
    tag: "caveats",
    code: `// In library code, use ConfigureAwait(false) to avoid
// accidentally resuming on the caller's SynchronizationContext
// (e.g., the UI thread or ASP.NET request context)

async Task<string> LibraryMethodAsync()
{
    // Without ConfigureAwait(false): resumes on captured context
    // With ConfigureAwait(false): resumes on any thread pool thread
    var data = await FetchDataAsync().ConfigureAwait(false);
    return data.ToUpper();  // don't need UI thread
}

// In application code (UI, ASP.NET controllers): omit ConfigureAwait
// to stay on the right context
async Task<string> FetchDataAsync() => await Task.FromResult("data");`,
    explanation: "ConfigureAwait(false) tells the task not to resume on the captured synchronisation context; library code should always use it to avoid deadlocks and unnecessary context switches in callers.",
  },
  {
    id: "cs-caveats-linq-double-enum",
    language: "csharp",
    title: "Iterating IEnumerable twice can run the query twice",
    tag: "caveats",
    code: `IEnumerable<int> query = Enumerable.Range(1, 5)
    .Select(n => { Console.Write($"eval {n} "); return n * 2; });

Console.WriteLine("First pass:");
int sum = query.Sum();    // evaluates: eval 1 2 3 4 5

Console.WriteLine("\nSecond pass:");
int count = query.Count(); // evaluates AGAIN: eval 1 2 3 4 5

// Fix: materialise with .ToList() or .ToArray()
var materialised = query.ToList();  // evaluates once
Console.WriteLine(materialised.Sum() + " " + materialised.Count);`,
    explanation: "LINQ sequences are re-evaluated each time they are iterated; for expensive queries (DB calls, HTTP requests) or queries with side effects, call .ToList() once and use the result repeatedly.",
  },
  {
    id: "cs-types-where-class-struct",
    language: "csharp",
    title: "where T : class vs where T : struct constraints",
    tag: "types",
    code: `// where T : class -- T is a reference type (can be null)
T? FindFirst<T>(IEnumerable<T> items, Func<T, bool> pred)
    where T : class
{
    foreach (var item in items)
        if (pred(item)) return item;
    return null;  // null is valid for reference types
}

// where T : struct -- T is a value type (non-nullable)
T Default<T>() where T : struct => default(T);

Console.WriteLine(Default<int>());      // 0
Console.WriteLine(Default<DateTime>()); // 01/01/0001`,
    explanation: "where T : class restricts to reference types and allows returning null; where T : struct restricts to value types (int, DateTime, custom structs) and enables safe use of default(T) as a meaningful empty value.",
  },
  {
    id: "cs-types-enum-underlying",
    language: "csharp",
    title: "Enum underlying type and explicit casting",
    tag: "types",
    code: `enum Status : byte   // underlying type is byte (default is int)
{
    Pending = 0,
    Active  = 1,
    Closed  = 2,
}

Status s = Status.Active;
byte raw = (byte)s;          // explicit cast to underlying type
Console.WriteLine(raw);      // 1

Status parsed = (Status)2;   // cast int to enum
Console.WriteLine(parsed);   // Closed

// Safe parse with bounds check
if (Enum.IsDefined(typeof(Status), (byte)5))
    Console.WriteLine("valid");
else
    Console.WriteLine("invalid value");  // this prints`,
    explanation: "Enums can use any integral underlying type (byte, short, int, long); specifying a smaller type saves memory in arrays. Casting is explicit and unsafe if the value is out of range; Enum.IsDefined validates.",
  },
  {
    id: "cs-types-delegate-keyword",
    language: "csharp",
    title: "Named delegate type vs Func/Action",
    tag: "types",
    code: `// Named delegate: custom type with a specific name
delegate int BinaryOp(int a, int b);
BinaryOp add = (a, b) => a + b;
Console.WriteLine(add(3, 4));   // 7

// Func<int,int,int>: generic anonymous delegate (equivalent)
Func<int, int, int> add2 = (a, b) => a + b;

// Named delegates are useful for:
// 1. Readability when the signature is complex
// 2. Allowing event patterns (event BinaryOp MyEvent)
// 3. Referencing from COM interop or reflection

// Prefer Func/Action for simple callbacks`,
    explanation: "Named delegates create a distinct type (useful for events and COM interop); Func/Action are generic built-in delegates that cover most callback scenarios without defining a new type.",
  },
  {
    id: "cs-types-nullable-int-ops",
    language: "csharp",
    title: "Nullable<T> arithmetic: null propagates through operators",
    tag: "types",
    code: `int? a = 5;
int? b = null;

Console.WriteLine(a + 10);    // 15
Console.WriteLine(b + 10);    // null (null propagates)
Console.WriteLine(a + b);     // null

// Lifted operators: if either operand is null, result is null
Console.WriteLine(a > b);     // null (comparison with null)
Console.WriteLine(a > 3);     // True

// GetValueOrDefault for safe extraction
Console.WriteLine(b.GetValueOrDefault(0));   // 0`,
    explanation: "Most operators are 'lifted' for nullable types: if either operand is null, the result is null. This mirrors SQL's three-valued logic and avoids explicit null checks for arithmetic expressions.",
  },
  {
    id: "cs-types-generic-covariant-out",
    language: "csharp",
    title: "Custom covariant interface with out T",
    tag: "types",
    code: `interface IProducer<out T>    // T only appears in output position
{
    T Produce();
}

class StringProducer : IProducer<string>
{
    public string Produce() => "hello";
}

// Covariance: IProducer<string> -> IProducer<object>
IProducer<object> p = new StringProducer();
Console.WriteLine(p.Produce());   // hello

// INVALID: can't use out T in input position
// interface IBad<out T> { void Consume(T item); }  // CS1961`,
    explanation: "Marking a type parameter out T makes the interface covariant; T can only appear as a return type (output). This allows assigning IProducer<string> to IProducer<object> safely.",
  },
  {
    id: "cs-types-required-init-combo",
    language: "csharp",
    title: "required + init enforces non-nullable construction",
    tag: "types",
    code: `#nullable enable
class ApiRequest
{
    public required string Endpoint { get; init; }
    public required HttpMethod Method { get; init; }
    public string? Body { get; init; }  // optional
}

// Compiler error if required properties missing:
// new ApiRequest { Endpoint = "/users" }  // CS9035: Method is required

var req = new ApiRequest
{
    Endpoint = "/users",
    Method   = HttpMethod.Get,
};
Console.WriteLine(req.Endpoint);  // /users`,
    explanation: "required (C# 11) + init gives you immutable properties that must be set at construction via object initialiser; this enforces completeness at compile time without a constructor parameter for every field.",
  },
  {
    id: "cs-families-async-enumerable",
    language: "csharp",
    title: "IAsyncEnumerable<T> for async streaming data",
    tag: "families",
    code: `async IAsyncEnumerable<int> GenerateAsync(int count)
{
    for (int i = 0; i < count; i++)
    {
        await Task.Delay(10);   // simulate async data arrival
        yield return i;
    }
}

async Task ConsumeAsync()
{
    await foreach (int item in GenerateAsync(5))
        Console.Write(item + " ");   // 0 1 2 3 4
}

await ConsumeAsync();`,
    explanation: "IAsyncEnumerable<T> enables pull-based async streaming; await foreach processes each item as it arrives, making it ideal for paginated APIs, database cursors, and live event streams.",
  },
];
