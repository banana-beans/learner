import type { Snippet } from "./types";

export const csharpSnippets20260509P2: Snippet[] = [
  {
    id: "cs-caveats-task-result",
    language: "csharp",
    title: ".Result and .Wait() can deadlock on UI/ASP.NET threads",
    tag: "caveats",
    code: `// In ASP.NET classic or WinForms, this DEADLOCKS:
// var result = GetDataAsync().Result;
// Because: Task continues on captured SynchronizationContext,
// but that context is blocked waiting for .Result

// Safe alternatives:
async Task<int> SafeAsync()
{
    return await GetDataAsync();  // releases the thread
}

// ConfigureAwait(false) for library code
async Task<int> LibraryMethod()
{
    return await GetDataAsync().ConfigureAwait(false);
}
async Task<int> GetDataAsync() => await Task.FromResult(42);`,
    explanation: ".Result and .Wait() block the calling thread; if that thread holds a SynchronizationContext that the awaited task needs to resume on, the result is a deadlock. Always await instead.",
  },
  {
    id: "cs-types-tuple",
    language: "csharp",
    title: "ValueTuple vs Tuple: prefer ValueTuple",
    tag: "types",
    code: `// Old Tuple: heap-allocated, members named Item1/Item2
Tuple<int, string> old = Tuple.Create(1, "Alice");
Console.WriteLine(old.Item1);  // 1

// Modern ValueTuple: stack-allocated, named members
(int Id, string Name) person = (42, "Alice");
Console.WriteLine(person.Id);    // 42
Console.WriteLine(person.Name);  // Alice

// Deconstruction
var (id, name) = person;
Console.WriteLine($"{id}: {name}");  // 42: Alice`,
    explanation: "ValueTuple (C# 7+) provides named members, deconstruction, and stack allocation; the legacy Tuple class creates heap objects and forces Item1/Item2 names. Use ValueTuple in all new code.",
  },
  {
    id: "cs-families-hashset-sortedset",
    language: "csharp",
    title: "HashSet vs SortedSet: O(1) vs O(log n) membership",
    tag: "families",
    code: `var hs = new HashSet<int>  { 3, 1, 4, 1, 5 };
var ss = new SortedSet<int> { 3, 1, 4, 1, 5 };

Console.WriteLine(hs.Count);  // 4 (dups removed)
Console.WriteLine(ss.Count);  // 4

// HashSet: O(1) average, unordered
Console.WriteLine(string.Join(",", hs));   // any order

// SortedSet: O(log n), always sorted
Console.WriteLine(string.Join(",", ss));   // 1,3,4,5

Console.WriteLine(ss.Min);  // 1
Console.WriteLine(ss.Max);  // 5`,
    explanation: "HashSet provides O(1) average Add/Remove/Contains via hashing with no ordering; SortedSet uses a red-black tree for O(log n) operations with guaranteed sorted enumeration and Min/Max properties.",
  },
  {
    id: "cs-classes-extension-method",
    language: "csharp",
    title: "Extension methods add behaviour without modifying the class",
    tag: "classes",
    code: `public static class StringExtensions
{
    public static string Truncate(this string s, int maxLen, string suffix = "...")
    {
        if (s.Length <= maxLen) return s;
        return s[..(maxLen - suffix.Length)] + suffix;
    }

    public static bool IsNullOrEmpty(this string? s) => string.IsNullOrEmpty(s);
}

string title = "The Quick Brown Fox Jumped Over The Lazy Dog";
Console.WriteLine(title.Truncate(20));   // The Quick Brown F...
Console.WriteLine("".IsNullOrEmpty());   // True`,
    explanation: "Extension methods are static methods with a 'this' first parameter; they appear as instance methods on the target type, allowing you to add functionality to types you don't own (including sealed classes).",
  },
  {
    id: "cs-snippet-with-expression",
    language: "csharp",
    title: "with expression non-destructively copies a record",
    tag: "snippet",
    code: `record Address(string Street, string City, string PostCode);

var home = new Address("1 Main St", "Springfield", "SP1 1AA");
var work = home with { Street = "42 Office Blvd", City = "Shelbyville" };

Console.WriteLine(home.City);  // Springfield (unchanged)
Console.WriteLine(work);
// Address { Street = 42 Office Blvd, City = Shelbyville, PostCode = SP1 1AA }`,
    explanation: "The with expression creates a copy of the record with specified properties changed and all others carried over unchanged; it's immutable because it produces a new object rather than mutating the original.",
  },
  {
    id: "cs-understanding-string-intern",
    language: "csharp",
    title: "String interning and == vs object.ReferenceEquals",
    tag: "understanding",
    code: `string a = "hello";
string b = "hello";         // likely interned: same reference
string c = new string("hello".ToCharArray());  // definitely new object

Console.WriteLine(a == b);                    // True (value equality)
Console.WriteLine(object.ReferenceEquals(a, b)); // True (interned)
Console.WriteLine(a == c);                    // True (value equality)
Console.WriteLine(object.ReferenceEquals(a, c)); // False (different object)`,
    explanation: "The C# == on strings compares by value (calls Equals); string literals are interned by the runtime so identical literals share one object. Use string.Intern to explicitly intern runtime strings.",
  },
  {
    id: "cs-structures-readonly-span",
    language: "csharp",
    title: "ReadOnlySpan<char> avoids allocation for string slicing",
    tag: "structures",
    code: `static int CountCommas(ReadOnlySpan<char> s)
{
    int count = 0;
    foreach (char c in s)
        if (c == ',') count++;
    return count;
}

string csv = "a,b,c,d,e";
Console.WriteLine(CountCommas(csv));        // 4

// Slice without allocation
ReadOnlySpan<char> middle = csv.AsSpan()[2..6];
Console.WriteLine(middle.ToString());       // b,c,`,
    explanation: "Passing ReadOnlySpan<char> to methods instead of string avoids creating substring allocations; the JIT can also analyse spans at compile time when used with string literals.",
  },
  {
    id: "cs-caveats-checked-overflow",
    language: "csharp",
    title: "Integer overflow is silent by default; use checked to catch it",
    tag: "caveats",
    code: `int max = int.MaxValue;   // 2,147,483,647
int overflowed = max + 1;
Console.WriteLine(overflowed);   // -2,147,483,648 (silent wrap!)

// checked block throws OverflowException
try
{
    int safe = checked(max + 1);
}
catch (OverflowException e)
{
    Console.WriteLine(e.Message);   // Arithmetic operation resulted in an overflow
}`,
    explanation: "C# integer arithmetic wraps silently by default (like C/C++); the checked keyword or compiler option makes overflow throw OverflowException. Use checked in financial or safety-critical calculations.",
  },
  {
    id: "cs-types-func-action",
    language: "csharp",
    title: "Func<> vs Action<> vs Predicate<>",
    tag: "types",
    code: `// Func<TArg1, ..., TResult>: returns a value
Func<int, int, int> add = (a, b) => a + b;
Console.WriteLine(add(3, 4));   // 7

// Action<TArg1, ...>: void return (side effect)
Action<string> log = msg => Console.WriteLine($"[LOG] {msg}");
log("hello");   // [LOG] hello

// Predicate<T>: Func<T, bool> specialisation
Predicate<int> isEven = n => n % 2 == 0;
Console.WriteLine(isEven(4));   // True

var evens = new List<int> { 1, 2, 3, 4 };
evens.RemoveAll(n => n % 2 != 0);`,
    explanation: "Func is the generic delegate for value-returning functions; Action is for void-returning side effects; Predicate<T> is a Func<T,bool> synonym used in methods like List.FindAll and RemoveAll.",
  },
  {
    id: "cs-families-stream-types",
    language: "csharp",
    title: "MemoryStream vs FileStream vs NetworkStream",
    tag: "families",
    code: `using System.IO;

// MemoryStream: backed by a byte[] in RAM
using var ms = new MemoryStream();
ms.Write(new byte[] { 1, 2, 3 });
Console.WriteLine(ms.Length);    // 3

// FileStream: backed by a file on disk
// using var fs = File.OpenRead("data.bin");

// NetworkStream: backed by a TCP socket
// var ns = tcpClient.GetStream();

// All derive from Stream -- use Stream in method signatures
static void Process(Stream s) { /* read/write regardless of source */ }`,
    explanation: "All stream types inherit from the abstract Stream class; programming to Stream rather than a concrete type lets you swap implementations in tests (MemoryStream) without changing the consuming code.",
  },
  {
    id: "cs-classes-operator-overload",
    language: "csharp",
    title: "Operator overloading with static operator methods",
    tag: "classes",
    code: `record struct Money(decimal Amount, string Currency)
{
    public static Money operator +(Money a, Money b)
    {
        if (a.Currency != b.Currency)
            throw new InvalidOperationException("Currency mismatch");
        return a with { Amount = a.Amount + b.Amount };
    }
    public static Money operator *(Money m, decimal factor)
        => m with { Amount = m.Amount * factor };
    public override string ToString() => $"{Amount:F2} {Currency}";
}

var a = new Money(10.50m, "GBP");
var b = new Money(5.25m, "GBP");
Console.WriteLine(a + b);       // 15.75 GBP
Console.WriteLine(a * 2m);      // 21.00 GBP`,
    explanation: "Operator overloads are static methods with the operator keyword; they enable natural arithmetic syntax on domain types while keeping the logic centralised. Always pair + with - and * with /.",
  },
  {
    id: "cs-snippet-throw-expression",
    language: "csharp",
    title: "throw as an expression (C# 7+)",
    tag: "snippet",
    code: `class Service(string name)
{
    private readonly string _name = name ?? throw new ArgumentNullException(nameof(name));

    public string GetName() => _name.Length > 0
        ? _name
        : throw new InvalidOperationException("Name is empty");
}

var svc = new Service("auth");
Console.WriteLine(svc.GetName());   // auth
// new Service(null);  // throws ArgumentNullException`,
    explanation: "throw can appear as an expression (C# 7+) on the right of ??, in a ternary, or in an expression-bodied member -- enabling guard clauses and null checks without a separate statement.",
  },
  {
    id: "cs-understanding-interface-default",
    language: "csharp",
    title: "Default interface methods add behaviour without breaking implementors",
    tag: "understanding",
    code: `interface ILogger
{
    void Log(string message);
    // Default methods: existing implementors get these for free
    void LogError(string message) => Log($"ERROR: {message}");
    void LogInfo(string message)  => Log($"INFO: {message}");
}

class ConsoleLogger : ILogger
{
    public void Log(string message) => Console.WriteLine(message);
    // LogError and LogInfo come from the interface default
}

ILogger log = new ConsoleLogger();
log.LogInfo("started");   // INFO: started
log.LogError("oops");     // ERROR: oops`,
    explanation: "Default interface methods (C# 8) let library authors add new members to an interface without forcing every implementor to update; the default is only accessible through an interface reference.",
  },
  {
    id: "cs-structures-linked-list",
    language: "csharp",
    title: "LinkedList<T> for O(1) insertion at arbitrary positions",
    tag: "structures",
    code: `var ll = new LinkedList<int>(new[] { 1, 2, 4, 5 });
var node3 = ll.Find(4);            // find a node

// Insert 3 before 4 in O(1)
ll.AddBefore(node3!, 3);
Console.WriteLine(string.Join("->", ll));  // 1->2->3->4->5

// Remove first/last in O(1)
ll.RemoveFirst();
ll.RemoveLast();
Console.WriteLine(string.Join("->", ll));  // 2->3->4`,
    explanation: "LinkedList<T> provides O(1) insertion and removal at any position when you already hold the LinkedListNode; random index access is O(n), unlike List<T>.",
  },
  {
    id: "cs-caveats-nullable-ref",
    language: "csharp",
    title: "Nullable reference types: annotations vs runtime enforcement",
    tag: "caveats",
    code: `#nullable enable
string? maybeNull = null;

// Compiler warns about potential null dereference
// maybeNull.Length;  // CS8602 warning

// Null-forgiving operator ! suppresses the warning
int len = maybeNull!.Length;  // NullReferenceException at runtime!

// Nullable annotations are compile-time only
// null can still flow through unannotated code from other assemblies`,
    explanation: "Nullable reference types (#nullable enable) are a static analysis feature only -- they don't prevent null at runtime. The ! null-forgiving operator tells the compiler 'trust me', shifting the responsibility to you.",
  },
  {
    id: "cs-types-pattern-matching",
    language: "csharp",
    title: "Pattern matching: type, property, relational, and list patterns",
    tag: "types",
    code: `object obj = new List<int> { 1, 2, 3 };

// Type pattern
if (obj is List<int> list)
    Console.WriteLine(list.Count);  // 3

// Property pattern
record Product(string Name, double Price);
var p = new Product("Widget", 9.99);
if (p is { Name: "Widget", Price: < 10.0 })
    Console.WriteLine("cheap widget");  // cheap widget

// List pattern (C# 11)
int[] nums = { 1, 2, 3 };
if (nums is [1, .. var rest])
    Console.WriteLine(rest.Length);  // 2`,
    explanation: "C# patterns have grown across versions: type patterns narrow the type, property patterns destructure and check fields, and list patterns (C# 11) match array structure.",
  },
  {
    id: "cs-families-regex-compiled",
    language: "csharp",
    title: "Regex: interpreted vs compiled vs source-generated",
    tag: "families",
    code: `using System.Text.RegularExpressions;

string text = "Order #12345 placed on 2026-05-09";

// Interpreted (slow startup, small footprint)
var r1 = new Regex(@"\d{4}-\d{2}-\d{2}");

// Compiled: one-time JIT, faster repeated matching
var r2 = new Regex(@"\d{4}-\d{2}-\d{2}", RegexOptions.Compiled);

// Source-generated (C# 11): best performance, zero overhead
// [GeneratedRegex(@"\d{4}-\d{2}-\d{2}")]
// private static partial Regex DateRegex();

Console.WriteLine(r2.Match(text).Value);   // 2026-05-09`,
    explanation: "Interpreted regex is fine for one-off matches; Compiled creates a JIT delegate for repeated use; source-generated (GeneratedRegex) produces the matching code at compile time, giving the best throughput with no startup cost.",
  },
  {
    id: "cs-classes-implicit-explicit",
    language: "csharp",
    title: "implicit and explicit conversion operators",
    tag: "classes",
    code: `record struct Celsius(double Value)
{
    public static implicit operator Fahrenheit(Celsius c)
        => new((c.Value * 9.0 / 5.0) + 32.0);

    public static explicit operator double(Celsius c)
        => c.Value;
}
record struct Fahrenheit(double Value);

Celsius boiling = new(100.0);
Fahrenheit f = boiling;           // implicit: no cast needed
Console.WriteLine(f.Value);       // 212
double raw = (double)boiling;     // explicit: cast required
Console.WriteLine(raw);           // 100`,
    explanation: "Use implicit conversions when the operation is lossless and always safe; use explicit (requiring a cast) when there's a risk of precision loss or the conversion isn't obvious to the reader.",
  },
  {
    id: "cs-snippet-local-function",
    language: "csharp",
    title: "Local functions scope helpers inside their parent method",
    tag: "snippet",
    code: `int Fibonacci(int n)
{
    if (n < 0) throw new ArgumentOutOfRangeException(nameof(n));
    return Fib(n);   // delegate to the local function

    // Local function: only visible inside Fibonacci
    static int Fib(int x) => x <= 1 ? x : Fib(x - 1) + Fib(x - 2);
}

Console.WriteLine(Fibonacci(10));   // 55
// Fib(5);  // CS0103: name 'Fib' does not exist here`,
    explanation: "Local functions are full methods defined inside another method; marking them static prevents accidental closure over outer variables. They're preferred over lambdas for recursive helpers because they avoid delegate allocation.",
  },
  {
    id: "cs-understanding-static-ctor",
    language: "csharp",
    title: "Static constructor runs once, before first use of the type",
    tag: "understanding",
    code: `class Registry
{
    public static readonly Dictionary<string, string> Entries;

    static Registry()
    {
        Console.WriteLine("static ctor running");
        Entries = new() { ["env"] = "production" };
    }
}

Console.WriteLine("before first access");
Console.WriteLine(Registry.Entries["env"]);
// Output:
// before first access
// static ctor running
// production`,
    explanation: "The static constructor runs exactly once per AppDomain, triggered by the first access to a static member or instantiation; it's the guaranteed-safe place for expensive one-time class initialisation.",
  },
  {
    id: "cs-structures-stack-queue",
    language: "csharp",
    title: "Stack<T> vs Queue<T>: LIFO vs FIFO",
    tag: "structures",
    code: `// Stack<T>: Last In First Out
var stack = new Stack<int>();
stack.Push(1); stack.Push(2); stack.Push(3);
Console.WriteLine(stack.Pop());    // 3 (last in, first out)
Console.WriteLine(stack.Peek());   // 2 (look without removing)

// Queue<T>: First In First Out
var queue = new Queue<int>();
queue.Enqueue(1); queue.Enqueue(2); queue.Enqueue(3);
Console.WriteLine(queue.Dequeue()); // 1 (first in, first out)
Console.WriteLine(queue.Peek());    // 2`,
    explanation: "Stack is backed by an array growing from the top, ideal for DFS, undo stacks, and call simulation. Queue is backed by a circular buffer, ideal for BFS and producer-consumer patterns.",
  },
  {
    id: "cs-caveats-event-null",
    language: "csharp",
    title: "Events must be checked for null before invocation",
    tag: "caveats",
    code: `class Button
{
    public event Action<string>? Clicked;

    public void Click(string label)
    {
        // WRONG: Clicked(label); -- NullReferenceException if no subscribers
        Clicked?.Invoke(label);   // thread-safe null check + invoke
    }
}

var btn = new Button();
btn.Click("submit");           // no-op (no subscribers)

btn.Clicked += l => Console.WriteLine($"Clicked: {l}");
btn.Click("submit");           // Clicked: submit`,
    explanation: "An event with no subscribers is null; always use ?.Invoke() instead of direct invocation. The ?. operator captures a local copy of the delegate first, making it race-condition safe.",
  },
  {
    id: "cs-types-variance",
    language: "csharp",
    title: "Covariant out T and contravariant in T on interfaces",
    tag: "types",
    code: `// IEnumerable<out T> is covariant: T only appears in output position
IEnumerable<string> strings = new List<string> { "a", "b" };
IEnumerable<object> objects = strings;   // safe: string IS-A object

// IComparer<in T> is contravariant: T only appears in input position
IComparer<object> objComparer = Comparer<object>.Default;
IComparer<string> strComparer = objComparer;  // safe: wider type can compare narrower

// Action<in T> is contravariant
Action<object> logObj = o => Console.WriteLine(o);
Action<string> logStr = logObj;   // OK`,
    explanation: "Covariance (out T) lets you use IEnumerable<Derived> where IEnumerable<Base> is expected; contravariance (in T) lets you use Action<Base> where Action<Derived> is expected -- both preserve type safety.",
  },
  {
    id: "cs-families-expression-func",
    language: "csharp",
    title: "Expression<Func<T>> vs Func<T>: code as data",
    tag: "families",
    code: `using System.Linq.Expressions;

// Func<T>: compiled delegate -- just runs
Func<int, bool> fn = x => x > 5;
Console.WriteLine(fn(7));   // True

// Expression<Func<T>>: AST representation -- can be inspected
Expression<Func<int, bool>> expr = x => x > 5;
Console.WriteLine(expr.Body);           // (x > 5)
Console.WriteLine(expr.Body.NodeType);  // GreaterThan

// EF Core translates Expression trees to SQL
// IQueryable.Where(expr)  -- translates to WHERE x > 5
// IEnumerable.Where(fn)  -- filters in memory`,
    explanation: "Expression<Func<T>> is a compile-time representation of the lambda as a syntax tree; LINQ providers (EF Core, LINQ to XML) inspect it to translate the predicate into SQL or XPath. Func is just a callable delegate.",
  },
  {
    id: "cs-classes-interface-segregation",
    language: "csharp",
    title: "Interface Segregation Principle: narrow interfaces",
    tag: "classes",
    code: `// Bad: fat interface forces implementors to provide everything
interface IBadStorage
{
    void Save(string key, byte[] data);
    byte[] Load(string key);
    void Delete(string key);
    IEnumerable<string> List();
}

// Good: narrow, composable interfaces
interface IReadable  { byte[] Load(string key); }
interface IWritable  { void Save(string key, byte[] data); }

class InMemoryStore : IReadable, IWritable
{
    private readonly Dictionary<string, byte[]> _store = new();
    public byte[] Load(string key) => _store[key];
    public void Save(string key, byte[] data) => _store[key] = data;
}`,
    explanation: "Narrow interfaces mean classes only implement methods they actually use; callers can depend on just IReadable for read-only access. This reduces coupling and makes testing easier.",
  }
];
