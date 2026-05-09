import type { Snippet } from "./types";

export const csharpSnippets20260509B3P4: Snippet[] = [
  {
    id: "cs-snippet-primary-constructor",
    language: "csharp",
    title: "Primary constructors (C# 12) inject parameters into the class body",
    tag: "snippet",
    code: `// Parameters are available throughout the class body
class Logger(string prefix, bool verbose)
{
    // No need to declare fields -- parameters are captured automatically
    public void Log(string msg)
    {
        if (verbose)
            Console.WriteLine($"[{prefix}] {msg}");
        else
            Console.WriteLine(msg);
    }
}

class EmailService(Logger log, string smtpHost)
{
    public void Send(string to, string body)
    {
        log.Log($"sending to {to} via {smtpHost}");
    }
}

var log = new Logger("APP", verbose: true);
var svc = new EmailService(log, "smtp.example.com");
svc.Send("alice@example.com", "Hello");`,
    explanation: "Primary constructors (C# 12) declare parameters in the class header; they're captured as private fields if referenced in instance methods. This eliminates boilerplate constructor+field patterns for DI and records-like immutable classes.",
  },
  {
    id: "cs-snippet-collection-builder",
    language: "csharp",
    title: "CollectionBuilder enables collection expression support for custom types",
    tag: "snippet",
    code: `using System.Runtime.CompilerServices;

[CollectionBuilder(typeof(ImmutableStack), nameof(ImmutableStack.Create))]
readonly struct ImmutableStack<T> : System.Collections.Generic.IEnumerable<T>
{
    private readonly T[] _items;
    private ImmutableStack(T[] items) => _items = items;

    public static ImmutableStack<T> Create(ReadOnlySpan<T> items)
        => new(items.ToArray());

    public System.Collections.Generic.IEnumerator<T> GetEnumerator()
        => ((System.Collections.Generic.IEnumerable<T>)_items).GetEnumerator();
    System.Collections.IEnumerator System.Collections.IEnumerable.GetEnumerator()
        => _items.GetEnumerator();
}

static class ImmutableStack
{
    public static ImmutableStack<T> Create<T>(ReadOnlySpan<T> items)
        => ImmutableStack<T>.Create(items);
}

// Now supports collection expressions!
ImmutableStack<int> stack = [1, 2, 3, 4, 5];
foreach (int v in stack) Console.Write(v + " ");`,
    explanation: "[CollectionBuilder] (C# 12) enables a custom type to support collection expression syntax ([]). The referenced static Create method receives a ReadOnlySpan<T> of the elements. This makes custom collection types first-class citizens in initialiser syntax.",
  },
  {
    id: "cs-snippet-inline-array",
    language: "csharp",
    title: "InlineArray creates a fixed-size array inside a struct (C# 12)",
    tag: "snippet",
    code: `using System.Runtime.CompilerServices;

// Inline array: fixed-size value type array, no heap allocation
[InlineArray(8)]
struct Buffer8<T>
{
    private T _element;  // single field declaration required by the pattern
}

Buffer8<int> buf = default;
for (int i = 0; i < 8; i++)
    buf[i] = i * i;

foreach (int v in buf)
    Console.Write(v + " ");   // 0 1 4 9 16 25 36 49

// Internally, Span<T> and ReadOnlySpan<T> use inline arrays for small buffers
// Span<char> of length 8 uses an inline array in some implementations`,
    explanation: "[InlineArray(N)] (C# 12) declares an inline-array struct with N elements of a single type; the elements live directly in the struct (no heap allocation). Indexing and foreach work naturally. Used internally by Span<T> and stackalloc alternatives.",
  },
  {
    id: "cs-snippet-ref-readonly",
    language: "csharp",
    title: "ref readonly locals avoid copying large structs on return",
    tag: "snippet",
    code: `readonly struct BigVector
{
    public readonly double X, Y, Z, W;
    public BigVector(double x, double y, double z, double w)
        => (X, Y, Z, W) = (x, y, z, w);
}

static BigVector[] _vectors = { new(1, 2, 3, 4), new(5, 6, 7, 8) };

// Returns a ref to the array element -- no copy
static ref readonly BigVector GetVector(int i) => ref _vectors[i];

// ref readonly local: alias without copying the struct
ref readonly BigVector v = ref GetVector(0);
Console.WriteLine(v.X);   // 1

// v = new BigVector(...);  // CS8331: cannot assign to ref readonly`,
    explanation: "ref readonly return values and locals provide a reference to a value without copying it, while preventing mutation. This is critical for performance when returning large structs from methods that access array elements or similar fixed-size buffers.",
  },
  {
    id: "cs-snippet-overload-resolution",
    language: "csharp",
    title: "Overload resolution prefers the most specific matching overload",
    tag: "snippet",
    code: `static void Print(object o)  => Console.WriteLine($"object: {o}");
static void Print(string s)  => Console.WriteLine($"string: {s}");
static void Print(int n)     => Console.WriteLine($"int: {n}");
static void Print(long n)    => Console.WriteLine($"long: {n}");

Print("hello");   // string: hello (most specific)
Print(42);        // int: 42     (most specific)
Print(42L);       // long: 42    (exact match)
Print(3.14);      // object: 3.14 (no double overload, boxed to object)

// Ambiguity example
// Print((short)1);  // ambiguous: both int and long are valid promotions

// Interface vs concrete: concrete wins
interface IBase {}
class Derived : IBase {}
static void Use(IBase b) => Console.WriteLine("IBase");
static void Use(Derived d) => Console.WriteLine("Derived");
Use(new Derived());   // Derived`,
    explanation: "Overload resolution picks the most specific applicable overload; exact type matches beat inheritance-based matches, and concrete types beat interface matches. Ambiguity (when two overloads are equally specific) is a compile error.",
  },
  {
    id: "cs-understanding-expression-trees",
    language: "csharp",
    title: "Expression<Func<T>> captures code as data for translation",
    tag: "understanding",
    code: `using System.Linq.Expressions;

// Lambda as a delegate -- executes code
Func<int, bool> func = n => n > 5;
Console.WriteLine(func(7));   // True

// Lambda as an expression tree -- stores code structure
Expression<Func<int, bool>> expr = n => n > 5;

// Inspect the tree
var binary = (BinaryExpression)expr.Body;
Console.WriteLine(binary.NodeType);   // GreaterThan
Console.WriteLine(binary.Right);      // 5

// Compile back to a delegate
Func<int, bool> compiled = expr.Compile();
Console.WriteLine(compiled(7));   // True

// EF Core translates expressions to SQL:
// db.Users.Where(u => u.Age > 18)  -- Where receives Expression<Func<User,bool>>`,
    explanation: "Expression<Func<T>> captures a lambda as an abstract syntax tree rather than compiled code. ORMs like EF Core receive these trees and translate them to SQL. Calling .Compile() converts them back to executable delegates.",
  },
  {
    id: "cs-understanding-dynamic-keyword",
    language: "csharp",
    title: "dynamic bypasses compile-time type checking (DLR dispatch)",
    tag: "understanding",
    code: `// dynamic defers member resolution to runtime (DLR)
dynamic obj = "hello";
Console.WriteLine(obj.Length);   // 5 -- resolves at runtime

obj = 42;
Console.WriteLine(obj + 8);     // 50

// Useful for COM interop and scripting scenarios
// DANGER: no IntelliSense, no compile-time errors
dynamic bad = "hello";
try
{
    bad.NonExistentMethod();    // RuntimeBinderException at runtime
}
catch (Microsoft.CSharp.RuntimeBinder.RuntimeBinderException e)
{
    Console.WriteLine(e.Message);
}

// ExpandoObject: dynamic property bag
dynamic expando = new System.Dynamic.ExpandoObject();
expando.Name = "Alice";
Console.WriteLine(expando.Name);   // Alice`,
    explanation: "dynamic defers member access to the Dynamic Language Runtime (DLR), resolving names at runtime. Use it sparingly for COM interop, scripting hosts, or working with dynamic JSON. It disables IntelliSense and compile-time error checking.",
  },
  {
    id: "cs-structures-immutable-stack",
    language: "csharp",
    title: "ImmutableStack<T> is a persistent functional stack",
    tag: "structures",
    code: `using System.Collections.Immutable;

var stack = ImmutableStack<int>.Empty;

// Push returns a NEW stack; original is unchanged
var s1 = stack.Push(1);
var s2 = s1.Push(2);
var s3 = s2.Push(3);

Console.WriteLine(stack.IsEmpty);   // True (original unchanged)
Console.WriteLine(s3.Peek());       // 3 (top)

// Pop returns the new stack and the popped value
var s4 = s3.Pop(out int top);
Console.WriteLine(top);             // 3
Console.WriteLine(s4.Peek());       // 2

// Iterate (top to bottom)
foreach (int item in s3)
    Console.Write(item + " ");   // 3 2 1`,
    explanation: "ImmutableStack<T> is a persistent (copy-on-write) stack implemented as a singly-linked list; Push and Pop return new stacks in O(1) without modifying the original. This makes it safe to share across threads and useful in recursive algorithms that need backtracking.",
  },
  {
    id: "cs-structures-read-only-memory",
    language: "csharp",
    title: "ReadOnlyMemory<T> is a heap-safe, read-only view of a buffer",
    tag: "structures",
    code: `byte[] data = System.Text.Encoding.UTF8.GetBytes("Hello, Memory!");

// ReadOnlyMemory<T>: heap-safe (can store in fields, pass across async)
ReadOnlyMemory<byte> rom = data;

// Slice without copying
ReadOnlyMemory<byte> slice = rom.Slice(7, 6);
Console.WriteLine(System.Text.Encoding.UTF8.GetString(slice.Span));  // Memory

// Pass to async methods
async Task ProcessAsync(ReadOnlyMemory<byte> buffer)
{
    await Task.Delay(1);   // can await with Memory<T>
    Console.WriteLine(buffer.Length);
}

await ProcessAsync(rom);

// Convert to Span for synchronous operations
ReadOnlySpan<byte> span = rom.Span;
Console.WriteLine(span[0]);   // 72 ('H')`,
    explanation: "ReadOnlyMemory<T> is the heap-compatible counterpart to ReadOnlySpan<T>; unlike Span, it can be stored in fields and used across async method boundaries. Slice it without copying and convert to Span for synchronous processing.",
  },
  {
    id: "cs-caveats-ref-return",
    language: "csharp",
    title: "ref return allows a method to return an alias to a variable",
    tag: "caveats",
    code: `int[] data = { 10, 20, 30, 40, 50 };

// Return a ref to an array element
ref int GetRef(int[] arr, int i) => ref arr[i];

ref int elem = ref GetRef(data, 2);
Console.WriteLine(elem);   // 30

elem = 99;   // modifies data[2] through the alias!
Console.WriteLine(data[2]);   // 99

// CAVEAT: never return ref to a local variable -- it's gone after return
// ref int Bad() { int local = 0; return ref local; }  // CS8168`,
    explanation: "ref return exposes an alias to a storage location (array element, field); assigning through the alias modifies the original. The critical rule: never return a ref to a local variable — the variable is destroyed when the method returns, leaving a dangling reference.",
  },
  {
    id: "cs-caveats-in-parameter-copy",
    language: "csharp",
    title: "in parameters on non-readonly structs incur a defensive copy",
    tag: "caveats",
    code: `struct Mutable
{
    public int Value;
    public void Increment() => Value++;  // mutating method
}

// 'in' passes by reference but prevents modification
static void Process(in Mutable m)
{
    // m.Increment();  // CS8332: cannot call mutating method on 'in' parameter
    // BUT: the compiler makes a DEFENSIVE COPY to call non-readonly methods!
    int v = m.Value;   // direct read -- no copy
}

// Solution: mark the struct readonly
readonly struct Immutable
{
    public int Value { get; }
    public void Read() { }  // allowed without copy: all methods are non-mutating
}

static void Process2(in Immutable m) => Console.WriteLine(m.Value);`,
    explanation: "The compiler makes a defensive copy before calling a non-readonly method on an 'in' parameter (to guarantee the method can't modify the original). Mark structs readonly to eliminate these hidden copies and allow the compiler to pass 'in' references without copying.",
  },
  {
    id: "cs-types-record-with-validation",
    language: "csharp",
    title: "Positional record with constructor validation",
    tag: "types",
    code: `record Temperature(double Celsius)
{
    // Compact constructor for validation
    public double Celsius { get; init; } = Celsius >= -273.15 ? Celsius
        : throw new ArgumentOutOfRangeException(nameof(Celsius));

    public double Fahrenheit => Celsius * 9 / 5 + 32;
}

var boiling  = new Temperature(100);
Console.WriteLine(boiling.Fahrenheit);   // 212

// with expression re-runs validation
var warm = boiling with { Celsius = 37 };
Console.WriteLine(warm.Fahrenheit);      // 98.6

// new Temperature(-500);  // throws ArgumentOutOfRangeException`,
    explanation: "A positional record's compact constructor intercepts property assignment; any expression that produces the value (including validation) is used. The 'with' expression creates a copy by calling the copy constructor, which also passes through the property setter and therefore the validation.",
  },
  {
    id: "cs-families-minimal-api",
    language: "csharp",
    title: "ASP.NET Core minimal API: routes defined with MapGet/MapPost",
    tag: "families",
    code: `using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddSingleton<IGreeter, Greeter>();

var app = builder.Build();

// MapGet: handle GET requests at the route
app.MapGet("/hello/{name}", (string name) => $"Hello, {name}!");

// Automatic DI injection from parameters
app.MapGet("/greet", (IGreeter greeter) => greeter.Greet("World"));

// POST with request body deserialization
app.MapPost("/echo", (EchoRequest req) => req);

// app.Run();  // start the server (commented out to keep snippet runnable)

record EchoRequest(string Message);
interface IGreeter { string Greet(string name); }
class Greeter : IGreeter { public string Greet(string n) => $"Greetings, {n}!"; }`,
    explanation: "ASP.NET Core minimal APIs define routes inline without controllers; parameters are bound from the route, query string, body, or DI container based on their type. Records are deserialized from JSON automatically. This replaces controller/action boilerplate for simple APIs.",
  },
  {
    id: "cs-snippet-source-generator-concept",
    language: "csharp",
    title: "Source generators produce code at compile time from attributes",
    tag: "snippet",
    code: `// Source generators inspect your code at compile time and emit new C# files.
// Example: System.Text.Json's JsonSerializerContext avoids reflection

using System.Text.Json.Serialization;

// Attribute triggers source generator to create serializer code
[JsonSerializable(typeof(User))]
[JsonSerializable(typeof(List<User>))]
partial class AppJsonContext : JsonSerializerContext { }

record User(string Name, int Age);

// Use the generated context (no reflection at runtime)
string json = System.Text.Json.JsonSerializer.Serialize(
    new User("Alice", 30),
    AppJsonContext.Default.User);

Console.WriteLine(json);   // {"Name":"Alice","Age":30}`,
    explanation: "Source generators run as part of compilation and add generated .cs files to the compilation; the generated code is type-safe and visible to IntelliSense. JsonSerializerContext uses this to replace reflection with ahead-of-time serialisation, reducing startup time and enabling AOT.",
  },
  {
    id: "cs-understanding-roslyn-symbol",
    language: "csharp",
    title: "Roslyn API: ISymbol represents a named element in source code",
    tag: "understanding",
    code: `// Roslyn (Microsoft.CodeAnalysis.CSharp NuGet) provides semantic analysis
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;

string src = "class Foo { int Bar; }";
SyntaxTree tree = CSharpSyntaxTree.ParseText(src);

var compilation = CSharpCompilation.Create("Demo",
    new[] { tree },
    new[] { MetadataReference.CreateFromFile(typeof(object).Assembly.Location) });

SemanticModel model = compilation.GetSemanticModel(tree);

// Walk syntax nodes to find fields
var root = tree.GetRoot();
// ...inspect IFieldSymbol, IMethodSymbol, etc.
// Each ISymbol has: Name, Kind, ContainingType, Locations, Accessibility
Console.WriteLine(compilation.AssemblyName);   // Demo`,
    explanation: "Roslyn's semantic layer models named program elements as ISymbol; IFieldSymbol, IMethodSymbol, INamedTypeSymbol etc. provide type information, accessibility, and declaring location. Source generators and analysers use ISymbol to inspect code and emit diagnostics or new source.",
  },
  {
    id: "cs-structures-immutable-queue",
    language: "csharp",
    title: "ImmutableQueue<T> is a persistent functional FIFO queue",
    tag: "structures",
    code: `using System.Collections.Immutable;

var queue = ImmutableQueue<string>.Empty;

var q1 = queue.Enqueue("first");
var q2 = q1.Enqueue("second");
var q3 = q2.Enqueue("third");

Console.WriteLine(queue.IsEmpty);   // True (original unchanged)
Console.WriteLine(q3.Peek());       // first (FIFO: head of queue)

// Dequeue returns new queue + removed element
var q4 = q3.Dequeue(out string head);
Console.WriteLine(head);            // first
Console.WriteLine(q4.Peek());       // second

// Convert from IEnumerable
var fromList = ImmutableQueue.Create(1, 2, 3);
foreach (int v in fromList) Console.Write(v + " ");  // 1 2 3`,
    explanation: "ImmutableQueue<T> is a persistent FIFO queue using a pair of immutable stacks; Enqueue and Dequeue return new queues in amortised O(1) without modifying the original. Use it in functional programming patterns, event sourcing, or whenever multiple threads need independent queue views.",
  },
  {
    id: "cs-caveats-abstract-sealed",
    language: "csharp",
    title: "abstract + sealed = static class equivalent for non-static scenarios",
    tag: "caveats",
    code: `// Normally abstract prevents instantiation and sealed prevents inheritance
// Together they prevent BOTH instantiation and subclassing

// Use case: static-like class that can implement interfaces (static classes can't)
// In C# 11+: abstract + sealed = effectively 'static' for interface members
abstract class MathHelpers
{
    // Before C# 11, you'd use protected MathHelpers() to prevent instantiation
    private MathHelpers() { }   // prevent instantiation

    public static int Square(int n) => n * n;
    public static int Cube(int n) => n * n * n;
}

Console.WriteLine(MathHelpers.Square(5));  // 25
// new MathHelpers()  -- private constructor prevents this
// class Sub : MathHelpers { }  -- private constructor prevents this too`,
    explanation: "Static classes can't implement interfaces; a class with a private constructor achieves a similar effect while remaining usable in interface contexts. C# 11's static abstract interface members are the recommended modern alternative for math-style utility types.",
  },
  {
    id: "cs-families-benchmark-micro",
    language: "csharp",
    title: "Micro-optimisation: prefer struct enumerators over class enumerators",
    tag: "families",
    code: `// List<T>.Enumerator is a value type (struct) -- no allocation
var list = new System.Collections.Generic.List<int>(Enumerable.Range(0, 1000));

// foreach on List<T> directly uses the struct enumerator (fast, no alloc)
int sum1 = 0;
foreach (int v in list) sum1 += v;

// foreach on IEnumerable<T> boxes the struct enumerator (allocation!)
System.Collections.Generic.IEnumerable<int> seq = list;
int sum2 = 0;
foreach (int v in seq) sum2 += v;  // boxes List<T>.Enumerator

Console.WriteLine(sum1 == sum2);  // True, but sum2 had extra allocation

// Span<T>.Enumerator is also a value type:
Span<int> span = System.Runtime.InteropServices.CollectionsMarshal.AsSpan(list);
int sum3 = 0;
foreach (int v in span) sum3 += v;  // struct enumerator, zero alloc`,
    explanation: "foreach on a concrete collection type (List<T>, array, Span<T>) uses the type's GetEnumerator method directly; if that returns a struct, no boxing occurs. Casting to IEnumerable<T> forces the compiler to call the interface method, which boxes the struct enumerator.",
  },
];
