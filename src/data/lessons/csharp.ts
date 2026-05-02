// ============================================================
// C# / .NET — All Tiers (T1–T4)
// ============================================================
// Code targets modern C# (11+) and .NET 8/9. Some features
// (file-scoped namespaces, top-level statements, required
// members, init-only) need C# 9+ / .NET 6+.
// ============================================================

import type { LessonContent } from "./python-basics";

export const csharpLessons: Record<string, LessonContent> = {
  // ── T1 ──
  "csharp:t1:syntax": {
    nodeId: "csharp:t1:syntax", title: "C# Syntax & Types",
    sections: [
      { heading: "Value vs Reference Types", body: "Value types (int, double, bool, struct, enum) are stored inline — assignment copies the value. Reference types (class, string, array, delegate) are stored on the heap — variables hold references; assignment copies the reference. Knowing which you have is fundamental to C# semantics." },
      { heading: "Nullability", body: "C# 8+ has nullable reference types (NRT). string? means 'might be null'; plain string is non-nullable (with a warning if you assign null). The compiler tracks nulls and warns on dereference. ?? is null-coalescing (returns right side if left is null), ?. is null-conditional (returns null instead of dereferencing null), ??= assigns if null." },
      { heading: "Type Inference And Tuples", body: "var infers the type from the right-hand side: var name = \"Ada\". The variable is still strongly typed; var is just a shortcut. Tuples: (int x, int y) for inline composite values without writing a struct. Useful for multiple returns and quick ad-hoc grouping." },
    ],
    codeExamples: [
      { title: "Value vs reference", code: `// Value type — copy semantics
int a = 5;
int b = a;
b = 10;
Console.WriteLine($"{a} {b}");  // 5 10 — independent

// Reference type — shared
int[] arr1 = { 1, 2 };
int[] arr2 = arr1;
arr2[0] = 99;
Console.WriteLine(arr1[0]);     // 99 — same array

// string is reference but immutable
string s1 = "hi";
string s2 = s1;
s2 += "!";              // creates a new string; s1 unchanged
Console.WriteLine($"{s1} {s2}"); // hi hi!`, explanation: "Value types copy; reference types share. string is reference but its immutability makes it feel value-like." },
      { title: "Nullable reference types", code: `// Project file: <Nullable>enable</Nullable>

string? maybeName = GetNameOrNull();
// Console.WriteLine(maybeName.Length); // warning: dereference of possibly null

if (maybeName is not null)
{
    Console.WriteLine(maybeName.Length); // ok — narrowed
}

// ?? = null-coalesce
string display = maybeName ?? "anonymous";

// ?. = null-conditional, returns null instead of throwing
int? len = maybeName?.Length;`, explanation: "NRT is compiler-tracked. Combined with ??, ?., the null story in modern C# is tight." },
      { title: "var, tuples, deconstruction", code: `var greeting = "Hello";        // string
var nums = new List<int> { 1, 2 };  // List<int>

(int min, int max) MinMax(IEnumerable<int> xs)
{
    int lo = int.MaxValue, hi = int.MinValue;
    foreach (var x in xs) { if (x < lo) lo = x; if (x > hi) hi = x; }
    return (lo, hi);
}

var (lo, hi) = MinMax(new[] { 3, 1, 4, 1, 5 });
Console.WriteLine($"{lo}..{hi}"); // 1..5`, explanation: "Tuples + deconstruction give multiple returns without writing a class." },
    ],
    keyTakeaways: ["Value types copy; reference types share", "string is reference but immutable — behaves value-ish", "string? = nullable; string = non-nullable (with NRT enabled)", "??, ?., ??= for null handling", "var infers types; tuples + deconstruction for multi-returns"],
  },
  "csharp:t1:control-flow": {
    nodeId: "csharp:t1:control-flow", title: "Control Flow",
    sections: [
      { heading: "Branches", body: "if/else, switch statement, switch expression (=> arrow form). Pattern matching in switch and is lets you destructure types and branch on shape. Pattern types: type pattern (x is string s), property pattern ({ Length: > 5 }), positional pattern (Point (0, 0)), relational pattern (>= 18), logical patterns (and, or, not)." },
      { heading: "Loops", body: "for, while, do-while as in C. foreach iterates IEnumerable. break / continue work as expected. yield return inside a method makes it an iterator that produces values lazily — IEnumerable<T> without manually implementing one. for and foreach are by far the most common; while for indeterminate loops." },
      { heading: "Switch Expression Wins", body: "Switch expressions return a value, support pattern matching deeply, and are exhaustive (compiler warns if you missed a case). They replace many ternary chains and old-style switch statements with cleaner code. Use switch statements only when each branch needs to do multiple statements." },
    ],
    codeExamples: [
      { title: "Switch expression with patterns", code: `string Describe(object value) => value switch
{
    null              => "null",
    int n when n < 0  => "negative int",
    int n             => $"int {n}",
    string { Length: 0 } => "empty string",
    string s          => $"string of length {s.Length}",
    int[] { Length: > 0 } arr => $"int[] starting with {arr[0]}",
    _                 => "something else"
};

Console.WriteLine(Describe(-5));      // negative int
Console.WriteLine(Describe("hi"));    // string of length 2
Console.WriteLine(Describe(new int[] { 7, 8, 9 })); // int[] starting with 7`, explanation: "Type, property, relational, and discard patterns in one switch. Compiler ensures each case is reachable." },
      { title: "is patterns", code: `object o = "hello";

if (o is string s && s.Length > 3)
{
    Console.WriteLine(s.ToUpper());
}

// Property pattern in is
if (o is string { Length: > 0 } nonEmpty)
{
    Console.WriteLine(nonEmpty[0]);
}

// Negated
if (o is not null)
{
    Console.WriteLine(o.GetType().Name);
}`, explanation: "is patterns destructure and bind in one shot. Cleaner than cast + null check + length check." },
      { title: "yield return = lazy iterator", code: `IEnumerable<int> EvensUpTo(int n)
{
    for (int i = 0; i <= n; i++)
    {
        if (i % 2 == 0)
            yield return i;        // pause; resume on next iteration
    }
}

foreach (var x in EvensUpTo(10))
{
    Console.WriteLine(x);          // 0 2 4 6 8 10 — produced lazily
}`, explanation: "yield turns the method into a state machine. No materialized list — values produced on demand." },
    ],
    keyTakeaways: ["Switch expression returns a value; statement doesn't", "Pattern matching: type, property, positional, relational, logical", "is patterns destructure and bind; is not for negation", "foreach iterates anything implementing IEnumerable", "yield return = lazy iterator without writing IEnumerable manually"],
  },
  "csharp:t1:console-io": {
    nodeId: "csharp:t1:console-io", title: "Console I/O",
    sections: [
      { heading: "Read And Write", body: "Console.WriteLine prints with a newline; Console.Write without. Console.ReadLine reads a line as a string (or null on EOF). Convert to numbers explicitly with int.Parse, double.TryParse, etc. TryParse is preferred — it returns a boolean instead of throwing on bad input." },
      { heading: "String Interpolation And Formatting", body: "$\"...\" interpolates {expr}. Format spec follows a colon: $\"{value:N2}\" (number, 2 decimals), $\"{date:yyyy-MM-dd}\". Verbatim strings (@\"...\") preserve backslashes and newlines literally; combine for $@\"...\". Raw string literals (C# 11+, triple quotes) handle multi-line text without escapes." },
      { heading: "Top-Level Statements", body: "Modern C# (9+) lets you write top-level code in Program.cs without a Main method. The file's statements run in order. Keeps small programs and demos minimal. For larger apps, the conventional shape (namespace + class + Main) is still common — both compile to the same thing." },
    ],
    codeExamples: [
      { title: "Read, parse, write", code: `Console.Write("Age: ");
string? line = Console.ReadLine();

if (int.TryParse(line, out int age))
{
    Console.WriteLine($"You are {age}, born ~{DateTime.Now.Year - age}.");
}
else
{
    Console.WriteLine("That doesn't look like a number.");
}`, explanation: "TryParse over Parse — no exception on bad input. The out variable can be declared inline." },
      { title: "Formatting", code: `double pi = 3.14159265;
Console.WriteLine($"{pi:F2}");        // 3.14
Console.WriteLine($"{1234567:N0}");   // 1,234,567
Console.WriteLine($"{0.842:P1}");     // 84.2 %
Console.WriteLine($"{DateTime.Now:yyyy-MM-dd HH:mm}");

// Verbatim + interpolated
string path = $@"C:\Users\{Environment.UserName}\file.txt";
Console.WriteLine(path);

// Raw string literal (C# 11+) — multi-line, no escapes
string json = """
    {
      "name": "Ada",
      "age": 36
    }
    """;`, explanation: "Format specs after the colon. Raw strings are gold for embedded JSON or SQL." },
      { title: "Top-level Program.cs", code: `// Program.cs (entire file)
using System;

Console.WriteLine("Hello!");

string greet(string name) => $"Hi, {name}";
Console.WriteLine(greet("Ada"));

// Equivalent to:
// using System;
// namespace MyApp {
//     class Program {
//         static void Main(string[] args) {
//             Console.WriteLine("Hello!");
//             ...
//         }
//     }
// }`, explanation: "Top-level statements compile to the same thing. Same access to args (the implicit args parameter)." },
    ],
    keyTakeaways: ["Console.WriteLine with newline; ReadLine returns string?", "TryParse over Parse to avoid exceptions on bad input", "$\"...\" interpolation; format spec after colon", "Raw string literals (\"\"\"...\"\"\") for multi-line text without escapes", "Top-level statements simplify small programs (.NET 6+)"],
  },
  "csharp:t1:methods": {
    nodeId: "csharp:t1:methods", title: "Methods",
    sections: [
      { heading: "Defining And Calling", body: "ReturnType Name(params) { body } inside a class. Static for class-level methods (no instance needed). Methods can be overloaded — same name, different signatures. Expression-bodied members (Name(x) => x * 2) compress one-liners." },
      { heading: "Parameter Modes", body: "Default: pass by value (a copy of the value, or a copy of the reference for reference types). ref: pass by reference; the variable must already be assigned. out: pass by reference, must be assigned in the method (used by TryParse, TryGetValue). in: read-only reference (less common; for large structs you don't want to copy)." },
      { heading: "Local Functions And Expression Bodies", body: "Local functions: methods declared inside other methods. Capture local variables (closures), can't be called from outside. Useful for recursive helpers without polluting the class. Expression-bodied members: => body for any one-expression method, property, or constructor — concise and very common in modern C#." },
    ],
    codeExamples: [
      { title: "Overloading + expression body", code: `int Area(int side) => side * side;
double Area(double w, double h) => w * h;
double Area(double radius, bool isCircle) =>
    isCircle ? Math.PI * radius * radius : 0;

Console.WriteLine(Area(5));            // 25
Console.WriteLine(Area(3.0, 4.0));     // 12
Console.WriteLine(Area(2.0, true));    // 12.566...`, explanation: "Same name, different signatures. Compiler picks based on argument types." },
      { title: "out and TryX pattern", code: `bool TryDivide(int a, int b, out int result)
{
    if (b == 0) { result = 0; return false; }
    result = a / b;
    return true;
}

if (TryDivide(10, 3, out int q))
{
    Console.WriteLine(q);   // 3
}

// out var inline declaration
if (int.TryParse("42", out var n))
{
    Console.WriteLine(n + 1); // 43
}`, explanation: "TryX pattern is the canonical 'maybe-fail' convention. out variables can be declared inline." },
      { title: "Local function for recursion", code: `int Sum(IEnumerable<int> nums)
{
    int total = 0;

    void Add(int x)         // local function; captures total
    {
        total += x;
    }

    foreach (var x in nums) Add(x);
    return total;
}

Console.WriteLine(Sum(new[] { 1, 2, 3, 4 })); // 10`, explanation: "Local functions are scoped to the enclosing method. Useful for recursion that doesn't pollute the class API." },
    ],
    keyTakeaways: ["Methods belong to classes; static for class-level", "Overloading: same name, different signatures", "ref / out / in for parameter passing modes; out for TryX patterns", "Expression-bodied members (=>) compress one-liners", "Local functions for helpers that shouldn't escape the method"],
  },

  // ── T2 ──
  "csharp:t2:classes": {
    nodeId: "csharp:t2:classes", title: "Classes & Records",
    sections: [
      { heading: "Classes And Properties", body: "class declares a reference type. Auto-properties: public string Name { get; set; }. Init-only setters (C# 9+): { get; init; } — settable in constructor or object initializer, then frozen. required (C# 11+) forces the caller to set the property at construction. Sealed prevents inheritance. Static classes are uninstantiable containers for static members." },
      { heading: "Records — Concise Data Carriers", body: "record (C# 9+) is a special class with value-based equality, compiler-generated ToString, and concise positional syntax: record Point(int X, int Y). Records are mutable by default; record (positional) defaults to init-only. record struct for value-type semantics. Use records for plain data + small immutable values; classes when behavior dominates." },
      { heading: "Constructors And Object Initializers", body: "Constructor parameters initialize fields; alternatively, object initializers set properties after construction: new User { Name = \"Ada\", Age = 36 }. Primary constructors (C# 12+) reduce ceremony for parameterized classes: class Point(int x, int y). Records have had primary constructors since C# 9." },
    ],
    codeExamples: [
      { title: "Class with init-only + required", code: `class User
{
    public required string Name { get; init; }
    public int Age { get; init; }
    public DateTime CreatedAt { get; } = DateTime.UtcNow;
}

var u = new User { Name = "Ada", Age = 36 };
Console.WriteLine(u.Name);
// u.Age = 37;          // error — init-only after construction
// new User { Age = 36 }; // error — required Name not set`, explanation: "required forces init-time setting. init-only freezes after construction. Together: 'set once, then immutable.'" },
      { title: "Record (positional)", code: `record Point(int X, int Y);

var p1 = new Point(1, 2);
var p2 = new Point(1, 2);
Console.WriteLine(p1 == p2);        // True — value-based equality
Console.WriteLine(p1);              // Point { X = 1, Y = 2 }

// 'with' expression — non-destructive update
var p3 = p1 with { Y = 99 };
Console.WriteLine(p3);              // Point { X = 1, Y = 99 }`, explanation: "Records are concise data carriers. with expressions create new instances with selected changes — no mutation." },
      { title: "Class vs record decision", code: `// Use record when:
//   - the type is a data carrier
//   - you want value equality
//   - immutability is fine or desired
record Coord(double Lat, double Lng);

// Use class when:
//   - identity matters (two of the same data are different objects)
//   - mutable state with methods that operate on it
//   - inheritance hierarchy
class BankAccount
{
    public string Owner { get; init; } = "";
    private decimal balance;
    public void Deposit(decimal amt) => balance += amt;
    public decimal Balance => balance;
}`, explanation: "record = data-first; class = behavior-first. Most domain objects are one or the other clearly." },
    ],
    keyTakeaways: ["class = reference type; record = value-equal data carrier", "Auto-properties: { get; set; }; init-only: { get; init; }", "required forces caller to set the property at construction", "with expressions copy-and-modify records non-destructively", "Pick record for plain data; class when behavior dominates"],
  },
  "csharp:t2:interfaces": {
    nodeId: "csharp:t2:interfaces", title: "Interfaces & Polymorphism",
    sections: [
      { heading: "Interfaces", body: "interface IShape declares a contract. Classes implement with class Square : IShape. Interfaces can have default implementations (C# 8+) — adds new methods to interfaces without breaking existing implementers. Multiple interface inheritance is allowed; only single class inheritance." },
      { heading: "Polymorphism", body: "Code against IShape; runtime dispatches the right method based on the concrete type. The textbook OOP pattern, and the foundation for dependency injection. Interfaces also enable testing: mock IShape in unit tests, real Square in production." },
      { heading: "Abstract Classes vs Interfaces", body: "Abstract class: shared base with some implementation + some abstract methods. Forces an inheritance relationship. Interface: pure contract. Modern C# default-interface-methods blur the line, but the rule of thumb stands: prefer interfaces; use abstract classes when you need shared concrete state or template-method-style implementation." },
    ],
    codeExamples: [
      { title: "Interface + multiple impls", code: `interface IShape
{
    double Area();
}

class Square : IShape
{
    public double Side { get; init; }
    public double Area() => Side * Side;
}

class Circle : IShape
{
    public double Radius { get; init; }
    public double Area() => Math.PI * Radius * Radius;
}

IShape s = new Square { Side = 5 };
Console.WriteLine(s.Area());   // 25
s = new Circle { Radius = 3 };
Console.WriteLine(s.Area());   // 28.27...`, explanation: "Variable typed as IShape; runtime dispatches to the concrete Area." },
      { title: "Multiple interfaces", code: `interface ILoggable { void Log(); }
interface IComparable<T> { int CompareTo(T other); }

class Item : ILoggable, IComparable<Item>
{
    public string Name { get; init; } = "";
    public int Priority { get; init; }

    public void Log() => Console.WriteLine($"{Name}({Priority})");
    public int CompareTo(Item? other) => Priority.CompareTo(other?.Priority ?? 0);
}`, explanation: "A class implements many interfaces; only one base class. C# uses IComparable<T> heavily in collections." },
      { title: "Default interface methods", code: `interface IGreeter
{
    string Hello(string name);

    // Default implementation
    string GoodbyeFor(string name) => $"Bye, {name}!";
}

class FriendlyGreeter : IGreeter
{
    public string Hello(string name) => $"Hi, {name}!";
    // GoodbyeFor not implemented — uses interface default
}

IGreeter g = new FriendlyGreeter();
Console.WriteLine(g.Hello("Ada"));     // Hi, Ada!
Console.WriteLine(g.GoodbyeFor("Ada")); // Bye, Ada! (from default)`, explanation: "Default methods let you extend interfaces without breaking existing implementers." },
    ],
    keyTakeaways: ["Interface = contract; class implements with : IName", "Polymorphism: code against interface, swap implementations", "Multiple interface inheritance; single class inheritance", "Default interface methods enable backwards-compatible additions", "Interface for contract; abstract class when shared state matters"],
  },
  "csharp:t2:generics": {
    nodeId: "csharp:t2:generics", title: "Generics",
    sections: [
      { heading: "Type Parameters", body: "List<T>, Dictionary<TKey, TValue>. Generic methods: T First<T>(IEnumerable<T> items). At compile time, T is replaced with the actual type — no boxing for value types, full type safety, IntelliSense everywhere. Generics in C# are reified (the runtime knows the type), unlike Java's erased generics." },
      { heading: "Constraints", body: "where T : new() requires a parameterless constructor. where T : class restricts to reference types. where T : struct to value types. where T : IComparable<T> requires the interface. where T : SomeBase requires inheritance. Multiple constraints: comma-separated. Constraints determine what operations you can use on T inside the method." },
      { heading: "Variance — In And Out", body: "Covariance (out T): IEnumerable<Cat> → IEnumerable<Animal>. Contravariance (in T): Action<Animal> → Action<Cat>. Most generics aren't variant by default; covariance/contravariance is opt-in via in/out keywords on interface type parameters. Useful for callbacks, comparers, and read-only sequences." },
    ],
    codeExamples: [
      { title: "Generic method with inference", code: `T First<T>(IEnumerable<T> items)
{
    foreach (var x in items) return x;
    throw new InvalidOperationException("empty");
}

int a = First(new[] { 1, 2, 3 });        // T inferred as int
string s = First(new[] { "a", "b" });    // T inferred as string
Console.WriteLine($"{a} {s}");           // 1 a`, explanation: "Type inferred from the argument. Same compiled code, different specialization per T." },
      { title: "Constrained generic", code: `T MaxOf<T>(IEnumerable<T> items) where T : IComparable<T>
{
    using var e = items.GetEnumerator();
    if (!e.MoveNext()) throw new InvalidOperationException();
    T best = e.Current;
    while (e.MoveNext())
    {
        if (e.Current.CompareTo(best) > 0) best = e.Current;
    }
    return best;
}

Console.WriteLine(MaxOf(new[] { 3, 1, 4, 1, 5, 9, 2, 6 })); // 9
Console.WriteLine(MaxOf(new[] { "ada", "linus", "grace" })); // linus`, explanation: "where T : IComparable<T> guarantees CompareTo is available. T flows through, preserving type info." },
      { title: "Variance with out", code: `// Covariant interface — T is only used as output
interface IProducer<out T>
{
    T Produce();
}

class CatProducer : IProducer<Cat>
{
    public Cat Produce() => new Cat();
}

class Animal { }
class Cat : Animal { }

IProducer<Animal> p = new CatProducer();   // ok thanks to covariance
Animal a = p.Produce();`, explanation: "out T means T flows out only — never appears as input. Then the type can be 'widened' safely." },
    ],
    keyTakeaways: ["Generics give type-safe reuse without boxing", "<T> declares a type parameter; inferred from arguments where possible", "where T : ... constrains capabilities", "Covariance (out T) and contravariance (in T) on interface params", "List<T>, Dictionary<K,V>, IEnumerable<T> — generics underpin the BCL"],
  },
  "csharp:t2:exceptions": {
    nodeId: "csharp:t2:exceptions", title: "Exceptions",
    sections: [
      { heading: "try / catch / finally", body: "Wrap risky code in try; handle in catch; cleanup in finally. Catch the most specific type first. Avoid catch (Exception) without re-throwing — it swallows everything including bugs you should see. using statement is sugar for try/finally with Dispose() — always use it for IDisposable resources." },
      { heading: "Custom Exceptions And Filters", body: "Subclass Exception (or a more specific base like ArgumentException, InvalidOperationException). Add constructors that call base. Exception filters with when (cond): catch (HttpRequestException ex) when (ex.StatusCode == 503) — only catches matching cases, leaving others to propagate naturally without unwinding the stack." },
      { heading: "When To Throw, When Not To", body: "Throw exceptions for exceptional conditions, not for control flow. ArgumentException for bad args, InvalidOperationException for bad state, NotSupportedException for 'this isn't implemented'. Don't throw to indicate 'not found' on lookups — return null or use TryX patterns. Exceptions are expensive; control flow gets ugly. Use Exception when the caller probably can't recover at this layer." },
    ],
    codeExamples: [
      { title: "try/catch/finally + using", code: `// Pre-using — verbose
StreamReader? reader = null;
try
{
    reader = new StreamReader("file.txt");
    Console.WriteLine(reader.ReadToEnd());
}
catch (FileNotFoundException)
{
    Console.WriteLine("not found");
}
finally
{
    reader?.Dispose();
}

// Modern — using statement
try
{
    using var reader = new StreamReader("file.txt");
    Console.WriteLine(reader.ReadToEnd());
}
catch (FileNotFoundException)
{
    Console.WriteLine("not found");
}
// reader.Dispose() called automatically at end of scope`, explanation: "using is the canonical pattern for IDisposable. No manual finally needed." },
      { title: "Custom exception", code: `public class ConfigException : Exception
{
    public string ConfigKey { get; }

    public ConfigException(string key, string message)
        : base(message)
    {
        ConfigKey = key;
    }

    public ConfigException(string key, string message, Exception inner)
        : base(message, inner)
    {
        ConfigKey = key;
    }
}

try
{
    throw new ConfigException("port", "missing port");
}
catch (ConfigException ex)
{
    Console.WriteLine($"config error [{ex.ConfigKey}]: {ex.Message}");
}`, explanation: "Subclass Exception, add domain context. Two constructors — one with an inner exception for chaining." },
      { title: "Exception filter", code: `try
{
    await SendRequestAsync();
}
catch (HttpRequestException ex) when (ex.StatusCode == HttpStatusCode.ServiceUnavailable)
{
    // Only catches 503s — others propagate
    await Task.Delay(1000);
    await SendRequestAsync();  // retry once
}
catch (HttpRequestException ex)
{
    Log.Error(ex, "request failed");
    throw;
}`, explanation: "when filters narrow the catch. Stack stays unwound only for matched cases — better diagnostics for un-matched ones." },
    ],
    keyTakeaways: ["Catch specific types; avoid bare catch (Exception)", "using statement for IDisposable — auto-cleanup", "Custom exceptions: subclass Exception, call base constructors", "when (cond) filters catches by condition", "Don't throw for control flow — use TryX or null instead"],
  },

  // ── T3 ──
  "csharp:t3:linq": {
    nodeId: "csharp:t3:linq", title: "LINQ",
    sections: [
      { heading: "Queries Over Collections", body: "LINQ adds Where, Select, OrderBy, GroupBy, Join, Aggregate as extension methods on IEnumerable. Method syntax (.Where(...).Select(...)) is most common. Query syntax (from x in xs where ... select ...) is sometimes more readable for joins. Both compile to the same thing." },
      { heading: "Deferred Execution", body: "Most LINQ operators don't run until you enumerate (foreach, ToList, Count, First, etc.). This means reusing a query re-runs it; modifying the underlying collection between query and enumeration changes the result. ToList / ToArray materialize once — use them when you need a stable snapshot or to enumerate multiple times." },
      { heading: "LINQ to Objects vs LINQ to SQL", body: "LINQ over IEnumerable runs in-process. LINQ over IQueryable (EF Core, LINQ to SQL) translates to SQL and runs on the database. The shapes look identical but the semantics differ — function-call expressions in IQueryable must be translatable to SQL. Stuff like custom methods and arbitrary code don't translate; you'll see runtime errors when EF can't translate them." },
    ],
    codeExamples: [
      { title: "Method syntax pipeline", code: `int[] nums = { 1, 2, 3, 4, 5, 6 };

var result = nums
    .Where(n => n % 2 == 0)        // 2, 4, 6
    .Select(n => n * n)            // 4, 16, 36
    .OrderByDescending(n => n)
    .ToList();                     // materialize

Console.WriteLine(string.Join(",", result)); // 36,16,4`, explanation: "Filter, project, sort, materialize. Each step returns a new IEnumerable until ToList." },
      { title: "GroupBy", code: `var people = new[]
{
    new { Name = "Ada",   Dept = "Eng" },
    new { Name = "Linus", Dept = "Eng" },
    new { Name = "Grace", Dept = "Ops" },
};

var byDept = people.GroupBy(p => p.Dept);

foreach (var g in byDept)
{
    var names = string.Join(", ", g.Select(p => p.Name));
    Console.WriteLine($"{g.Key}: {names}");
}
// Eng: Ada, Linus
// Ops: Grace`, explanation: "GroupBy yields IEnumerable<IGrouping<TKey, T>>. Each group has a Key and is itself an IEnumerable." },
      { title: "Deferred execution gotcha", code: `var nums = new List<int> { 1, 2, 3 };
var query = nums.Where(n => n > 1);     // not yet executed

nums.Add(4);                            // mutate source

Console.WriteLine(string.Join(",", query));  // 2,3,4 — sees the new 4

// Materialize to capture the snapshot
var snap = nums.Where(n => n > 1).ToList();
nums.Add(5);
Console.WriteLine(string.Join(",", snap));   // 2,3,4 — snapshot frozen`, explanation: "Deferred execution means the query is recomputed each time. Use ToList for a snapshot." },
    ],
    keyTakeaways: ["LINQ = Where, Select, OrderBy, GroupBy, Join over IEnumerable", "Deferred execution: queries don't run until enumerated", "ToList / ToArray / Count force execution", "LINQ over IQueryable (EF Core) translates to SQL — not all C# translates", "Pick method syntax usually; query syntax for big joins"],
  },
  "csharp:t3:collections": {
    nodeId: "csharp:t3:collections", title: "Collections",
    sections: [
      { heading: "The Core Generic Collections", body: "List<T> dynamic array. Dictionary<TKey, TValue> hash map. HashSet<T> hash set. Queue<T> / Stack<T> for FIFO/LIFO. SortedDictionary<TKey, TValue> for ordered maps. All in System.Collections.Generic. Avoid the non-generic versions in System.Collections (ArrayList, Hashtable) — boxing and no type safety." },
      { heading: "Read-Only And Immutable", body: "ReadOnlyCollection<T> wraps a list with read-only access. ImmutableList<T>, ImmutableDictionary<TKey, TValue> (System.Collections.Immutable) return new instances on mutation — useful for thread safety, undo histories, and reasoning about state. FrozenDictionary<TKey, TValue> (.NET 8+) is optimized for read-mostly lookup tables built once at startup." },
      { heading: "Concurrent Collections", body: "ConcurrentDictionary<TKey, TValue>, ConcurrentQueue<T>, ConcurrentBag<T>, BlockingCollection<T>. Built for thread-safe access without external locking. Useful for shared caches, work queues, and parallel pipelines. Performance varies by access pattern — ConcurrentDictionary is excellent for read-heavy with occasional writes." },
    ],
    codeExamples: [
      { title: "Dictionary + TryGetValue", code: `var prices = new Dictionary<string, decimal>
{
    ["apple"] = 1.0m,
    ["banana"] = 0.5m,
};

Console.WriteLine(prices["apple"]);           // 1.0

// Avoid KeyNotFoundException
if (prices.TryGetValue("cherry", out var p))
{
    Console.WriteLine(p);
}
else
{
    Console.WriteLine("missing");
}

// GetValueOrDefault for a default when missing
decimal cherry = prices.GetValueOrDefault("cherry", 0);`, explanation: "TryGetValue is the canonical pattern. GetValueOrDefault is even tidier when you have a sensible default." },
      { title: "HashSet ops", code: `var a = new HashSet<int> { 1, 2, 3, 4 };
var b = new HashSet<int> { 3, 4, 5, 6 };

// Mutating ops change the receiver
a.IntersectWith(b);    // a → {3, 4}
Console.WriteLine(string.Join(",", a));

// LINQ ops return a new sequence
var union = a.Union(b);
var diff = b.Except(a);`, explanation: "HashSet.X ops mutate; LINQ .X returns new. Pick by whether you want to keep the original." },
      { title: "ConcurrentDictionary", code: `var counts = new System.Collections.Concurrent.ConcurrentDictionary<string, int>();

// AddOrUpdate is atomic
foreach (var word in new[] { "a", "b", "a", "c", "b", "a" })
{
    counts.AddOrUpdate(word, 1, (key, existing) => existing + 1);
}

// GetOrAdd for "create if missing"
var bag = counts.GetOrAdd("d", _ => 0);

foreach (var (k, v) in counts) Console.WriteLine($"{k}: {v}");`, explanation: "AddOrUpdate / GetOrAdd are atomic by design — no need for external locks for these single-key updates." },
    ],
    keyTakeaways: ["List<T>, Dictionary<TKey,TValue>, HashSet<T>, Queue<T>, Stack<T>", "TryGetValue / GetValueOrDefault avoid exceptions on missing keys", "Set ops have mutating (XWith) and non-mutating (LINQ) variants", "Immutable* / Frozen* for thread-safe / build-once patterns", "Concurrent* for thread-safe shared state without external locking"],
  },
  "csharp:t3:delegates": {
    nodeId: "csharp:t3:delegates", title: "Delegates & Events",
    sections: [
      { heading: "Func, Action, Predicate", body: "Func<T1, ..., TResult> for delegates that return a value. Action<T1, ...> for void. Predicate<T> = Func<T, bool>. Lambdas (x => x * 2) implicitly convert to delegate types. These cover ~90% of delegate use; you rarely need to declare custom delegate types anymore." },
      { heading: "Events — Publishers And Subscribers", body: "event keyword wraps a multicast delegate field. Subscribers add handlers with +=; remove with -=. Only the declaring class can invoke the event (encapsulation). Use the EventHandler / EventHandler<TEventArgs> pattern for the conventional shape: (object? sender, TEventArgs e). Use ?.Invoke() to safely raise — it handles the no-subscribers case." },
      { heading: "Lambdas, Closures, Captures", body: "Lambdas capture variables from the enclosing scope. The capture is by reference — if you change the variable later, the lambda sees the new value. Common gotcha: capturing the loop variable (for (int i...) ... funcs.Add(() => i)) — every lambda sees the final i. Modern C# fixes this for foreach (where each iteration has a fresh variable) but for is still the old behavior." },
    ],
    codeExamples: [
      { title: "Func, Action, lambdas", code: `Func<int, int> sq = x => x * x;
Func<int, int, int> add = (a, b) => a + b;
Action<string> log = msg => Console.WriteLine($"[LOG] {msg}");
Predicate<int> isEven = n => n % 2 == 0;

Console.WriteLine(sq(5));         // 25
Console.WriteLine(add(2, 3));     // 5
log("hi");
Console.WriteLine(isEven(4));     // True`, explanation: "Lambdas convert to delegate types. Func returns; Action doesn't; Predicate is the named bool-returning version." },
      { title: "Events with EventHandler<T>", code: `public class TemperatureSensor
{
    public event EventHandler<TempChangedEventArgs>? TempChanged;

    private double temp;
    public double Temp
    {
        get => temp;
        set
        {
            if (temp == value) return;
            var old = temp;
            temp = value;
            TempChanged?.Invoke(this, new TempChangedEventArgs(old, value));
        }
    }
}

public class TempChangedEventArgs : EventArgs
{
    public double OldValue { get; }
    public double NewValue { get; }
    public TempChangedEventArgs(double o, double n) { OldValue = o; NewValue = n; }
}

// Usage
var sensor = new TemperatureSensor();
sensor.TempChanged += (s, e) => Console.WriteLine($"{e.OldValue} -> {e.NewValue}");
sensor.Temp = 21.5;`, explanation: "EventHandler<T> = (object? sender, T e). ?. Invoke handles no subscribers safely." },
      { title: "Closure capture", code: `// Loop variable capture (for) — caution
var actions = new List<Action>();
for (int i = 0; i < 3; i++)
{
    actions.Add(() => Console.WriteLine(i));
}
foreach (var a in actions) a();   // 3 3 3 — captured by reference

// Fix: copy into a fresh local each iteration
actions.Clear();
for (int i = 0; i < 3; i++)
{
    int captured = i;
    actions.Add(() => Console.WriteLine(captured));
}
foreach (var a in actions) a();   // 0 1 2

// foreach already gives a fresh variable each iteration — works correctly.`, explanation: "for-loop variable is one variable across iterations; the lambdas all see its final value. Copy into a local for safe capture." },
    ],
    keyTakeaways: ["Func<...> returns; Action<...> is void; Predicate<T> = Func<T, bool>", "Lambdas convert to delegates implicitly", "event += subscribe; -= unsubscribe", "EventHandler<T> with EventArgs subclass is the conventional pattern", "Closure capture is by reference — for-loop variable is the classic gotcha"],
  },
  "csharp:t3:extension-methods": {
    nodeId: "csharp:t3:extension-methods", title: "Extension Methods",
    sections: [
      { heading: "Adding Methods Without Inheritance", body: "Define a static method in a static class with this T as the first parameter. Now you can call it as if it's an instance method on T. LINQ is implemented this way over IEnumerable<T>. Extensions are just syntactic sugar — the compiler rewrites the call to the static form." },
      { heading: "Discovery And Usings", body: "Extensions are pulled in by importing the namespace they live in (using SomeNamespace). They don't override existing instance methods — instance methods always win in lookup. They can't access private members of the type. Discoverability via IntelliSense is excellent — the IDE shows extensions in the same list as instance methods." },
      { heading: "When To Use, When Not", body: "Use extensions for: helpers on types you don't own (string, IEnumerable, DateTime), fluent APIs (Builder.Configure().AddX().AddY()), domain-specific operations on stdlib types. Don't use them when: you control the type and could just add a method, or when you'd be hiding important behavior — extensions can mislead readers about where logic lives." },
    ],
    codeExamples: [
      { title: "String extension", code: `public static class StringExt
{
    public static bool IsNullOrBlank(this string? s) =>
        string.IsNullOrWhiteSpace(s);

    public static string Truncate(this string s, int max) =>
        s.Length <= max ? s : s.Substring(0, max) + "…";
}

string? a = "  ";
Console.WriteLine(a.IsNullOrBlank());          // True
Console.WriteLine("hello world".Truncate(5));  // hello…`, explanation: "Static class + static method + this T = extension. Reads like an instance call." },
      { title: "Extending IEnumerable<T>", code: `public static class EnumerableExt
{
    public static IEnumerable<T> Top<T>(this IEnumerable<T> source, int n) =>
        source.Take(n);

    public static IEnumerable<IEnumerable<T>> Chunk<T>(this IEnumerable<T> source, int size)
    {
        var batch = new List<T>(size);
        foreach (var item in source)
        {
            batch.Add(item);
            if (batch.Count == size) { yield return batch; batch = new List<T>(size); }
        }
        if (batch.Count > 0) yield return batch;
    }
}

// (.NET 6+ ships its own Chunk; this is for illustration.)
var batches = Enumerable.Range(1, 10).Chunk(3);
foreach (var b in batches) Console.WriteLine(string.Join(",", b));
// 1,2,3 / 4,5,6 / 7,8,9 / 10`, explanation: "Same shape LINQ uses. Extensions are how the BCL grows without breaking changes." },
      { title: "Fluent builder via extensions", code: `public class HttpRequestBuilder
{
    public Dictionary<string, string> Headers { get; } = new();
    public string Method { get; set; } = "GET";
    public string Url { get; set; } = "";
}

public static class HttpRequestBuilderExt
{
    public static HttpRequestBuilder WithHeader(this HttpRequestBuilder b, string k, string v)
    {
        b.Headers[k] = v;
        return b;
    }
    public static HttpRequestBuilder WithBearerToken(this HttpRequestBuilder b, string token) =>
        b.WithHeader("Authorization", $"Bearer {token}");
}

var req = new HttpRequestBuilder { Url = "https://api.example.com" }
    .WithHeader("Accept", "application/json")
    .WithBearerToken("xyz");`, explanation: "Builder + extensions = fluent API. Easy to extend later without modifying the builder class." },
    ],
    keyTakeaways: ["Static method, static class, this T first parameter", "LINQ is built entirely from extension methods", "Pulled in by importing the namespace", "Great for helpers on types you don't own + fluent APIs", "Don't use them to hide important domain behavior"],
  },

  // ── T4 ──
  "csharp:t4:async": {
    nodeId: "csharp:t4:async", title: "Async / Await (C#)",
    sections: [
      { heading: "Task, async, await", body: "async methods return Task or Task<T> (or ValueTask for hot-path optimization). await unwraps a Task — the method pauses, control returns to the caller, and resumes when the task completes. The compiler rewrites async methods into state machines under the hood. Don't .Result or .Wait() on async code in UI / classic ASP.NET — can deadlock; use await all the way." },
      { heading: "Cancellation", body: "Pass a CancellationToken through async chains. Long-running work checks token.ThrowIfCancellationRequested() periodically and propagates the OperationCanceledException. CancellationTokenSource owns the lifecycle; pass its Token down. Combining tokens (CancellationTokenSource.CreateLinkedTokenSource) is common when you want 'either timeout or user cancel.'" },
      { heading: "ConfigureAwait, Sync Context, ValueTask", body: "ConfigureAwait(false) skips capturing the synchronization context — used in libraries to avoid forcing callers onto the original thread. Less critical in modern ASP.NET Core (no sync context) but still good library hygiene. ValueTask avoids the Task allocation when the result is often available synchronously — used in hot paths like async stream readers." },
    ],
    codeExamples: [
      { title: "Async basics", code: `async Task<int> FetchAsync()
{
    await Task.Delay(10);
    return 42;
}

int n = await FetchAsync();
Console.WriteLine(n);   // 42

// Methods that don't return a value still return Task
async Task LogAsync(string msg)
{
    await Task.Delay(1);
    Console.WriteLine(msg);
}
await LogAsync("hi");`, explanation: "async methods return Task / Task<T>. await unwraps. Top-level code can await directly in modern C#." },
      { title: "Concurrent with WhenAll", code: `async Task<string> SlowAsync(string label, int ms)
{
    await Task.Delay(ms);
    return label;
}

// Run concurrently
string[] results = await Task.WhenAll(
    SlowAsync("a", 50),
    SlowAsync("b", 50),
    SlowAsync("c", 50));

Console.WriteLine(string.Join(",", results));   // a,b,c — total ~50ms`, explanation: "WhenAll runs concurrently; total = max, not sum. Independent calls should always run via WhenAll." },
      { title: "Cancellation", code: `async Task DoWorkAsync(CancellationToken ct)
{
    for (int i = 0; i < 100; i++)
    {
        ct.ThrowIfCancellationRequested();
        await Task.Delay(50, ct);
        // ... process step i ...
    }
}

using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(2));
try
{
    await DoWorkAsync(cts.Token);
}
catch (OperationCanceledException)
{
    Console.WriteLine("cancelled");
}`, explanation: "ThrowIfCancellationRequested checks at safe points. Task.Delay accepts a token too — wakes early on cancel." },
    ],
    keyTakeaways: ["async methods return Task / Task<T>", "await unwraps; method pauses and resumes when ready", "Use Task.WhenAll for concurrent waits — total time = max, not sum", "Pass CancellationToken through async chains; check periodically", "Never .Result or .Wait() on async code (deadlock risk in some contexts)"],
  },
  "csharp:t4:aspnet": {
    nodeId: "csharp:t4:aspnet", title: "ASP.NET Core",
    sections: [
      { heading: "Minimal APIs", body: "Modern ASP.NET Core ships with minimal APIs: build a WebApplication, register routes inline. Tiny boilerplate, great for microservices and simple APIs. Controllers (MVC pattern) are still available for big apps with conventions, model binding, and filters. Either compiles to the same underlying request pipeline." },
      { heading: "Middleware Pipeline", body: "Each request flows through a pipeline of middleware. app.Use(...) inserts middleware. Built-ins: routing, auth, CORS, exception handling, static files. Order matters: UseExceptionHandler outermost, UseAuthentication before UseAuthorization, UseRouting before endpoint mapping. Wrong order causes hard-to-debug failures (auth bypassed, exceptions unhandled)." },
      { heading: "Configuration And DI", body: "Configuration assembles from appsettings.json, environment vars, command-line, and user secrets — in that priority. IConfiguration is injected anywhere. DI container is built-in (no third-party needed for most apps) — register services with AddSingleton / AddScoped / AddTransient. Inject via constructor or [FromServices] on minimal API handlers." },
    ],
    codeExamples: [
      { title: "Minimal API skeleton", code: `var builder = WebApplication.CreateBuilder(args);

// Register services with DI
builder.Services.AddSingleton<IClock, SystemClock>();

var app = builder.Build();

app.MapGet("/", () => "Hello World!");

app.MapGet("/users/{id:int}", (int id, IClock clock) =>
    Results.Ok(new { id, name = $"user-{id}", at = clock.Now }));

app.MapPost("/users", async (UserRequest req) =>
{
    var u = await CreateUserAsync(req);
    return Results.Created($"/users/{u.Id}", u);
});

app.Run();`, explanation: "Routes return values are auto-serialized to JSON. Route constraints (:int) at the URL level. DI handles parameters." },
      { title: "Middleware order matters", code: `var app = builder.Build();

// Order is execution order — outermost first
app.UseExceptionHandler("/error");      // 1. catches everything below
app.UseHttpsRedirection();              // 2. force HTTPS
app.UseStaticFiles();                   // 3. before routing for / files
app.UseRouting();                       // 4. parse route
app.UseCors("MyPolicy");                // 5. after routing, before auth
app.UseAuthentication();                // 6. who are you?
app.UseAuthorization();                 // 7. what can you do?
app.MapControllers();                   // 8. dispatch

app.Run();

// Common bugs:
// - UseRouting AFTER UseAuthorization: auth never runs on routed endpoints
// - UseExceptionHandler last: exceptions skip handler
// - UseCors before UseRouting in some configurations: CORS preflight broken`, explanation: "Order is the order of execution. Documented carefully because many subtle bugs live here." },
      { title: "Configuration + DI", code: `// appsettings.json
// { "Stripe": { "ApiKey": "sk_..." } }

builder.Services.Configure<StripeOptions>(
    builder.Configuration.GetSection("Stripe"));

builder.Services.AddSingleton<IPaymentService, StripeService>();

// In a handler / controller — inject options
app.MapPost("/charge",
    async (ChargeRequest req,
           IOptions<StripeOptions> opts,
           IPaymentService payments) =>
{
    var apiKey = opts.Value.ApiKey;
    return await payments.ChargeAsync(req, apiKey);
});`, explanation: "Configure binds a section to a strongly-typed object. IOptions<T> injection. Apps almost never read raw IConfiguration directly." },
    ],
    keyTakeaways: ["Minimal APIs: app.MapGet/Post/etc. with inline handlers", "Middleware pipeline runs in registration order — UseExceptionHandler outermost", "Route constraints: {id:int}, {slug:alpha}", "Return values auto-serialize; use Results.* for explicit status + body", "Configure<T> + IOptions<T> is the canonical typed-config pattern"],
  },
  "csharp:t4:ef-core": {
    nodeId: "csharp:t4:ef-core", title: "Entity Framework Core",
    sections: [
      { heading: "DbContext + DbSet", body: "DbContext is your unit of work — represents a session with the database. DbSet<T> represents a table. Configure via Fluent API in OnModelCreating, or with attributes on the entity. EF Core tracks changes to entities you've loaded; SaveChanges() (or SaveChangesAsync) sends pending inserts/updates/deletes." },
      { heading: "Migrations", body: "dotnet ef migrations add <Name> generates a migration script from changes to your model. dotnet ef database update applies pending migrations. Always review the generated SQL before applying to production. Backwards-compatible patterns matter here too — if you rename or drop columns, the running app may break mid-deploy." },
      { heading: "Tracking, Eager Loading, And N+1", body: "By default, queries are tracked — EF Core remembers what it loaded. Use AsNoTracking() for read-only queries (faster, no change tracking overhead). Eager-load relationships with Include / ThenInclude to avoid N+1. Lazy loading is opt-in (proxies) and dangerous — easy to trigger N+1 by accident." },
    ],
    codeExamples: [
      { title: "Entity + DbContext", code: `public class User
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public List<Post> Posts { get; set; } = new();
}

public class Post
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public string Title { get; set; } = "";
}

public class AppDb : DbContext
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Post> Posts => Set<Post>();

    protected override void OnConfiguring(DbContextOptionsBuilder o) =>
        o.UseSqlite("Data Source=app.db");
}`, explanation: "DbSet<T> = table. Navigation properties (User.Posts) describe relationships; EF infers the FK." },
      { title: "Query + save", code: `using var db = new AppDb();

// Insert
db.Users.Add(new User { Name = "Ada" });
await db.SaveChangesAsync();

// Read with eager load — avoids N+1
var users = await db.Users
    .Include(u => u.Posts)
    .Where(u => u.Posts.Any())
    .AsNoTracking()             // read-only, faster
    .ToListAsync();

foreach (var u in users)
    foreach (var p in u.Posts)
        Console.WriteLine(p.Title);`, explanation: "Include eager-loads. AsNoTracking when you don't intend to update — measurable speed-up." },
      { title: "Migrations workflow", code: `# Add a migration after changing the model
$ dotnet ef migrations add AddBioToUser

# Generates Migrations/<timestamp>_AddBioToUser.cs with Up() and Down()
# Review before applying — the SQL is generated from model diffs

# Apply to the configured database
$ dotnet ef database update

# Generate idempotent SQL script for prod
$ dotnet ef migrations script --idempotent > migrate.sql
# Run by your deploy pipeline / DBA. Idempotent = safe to re-run.`, explanation: "Always review the generated migration. Generate idempotent SQL for production rollouts." },
    ],
    keyTakeaways: ["DbContext = unit of work; DbSet<T> = table", "SaveChanges / SaveChangesAsync flushes tracked changes", "AsNoTracking() for read-only queries; Include for eager loading", "Migrations: review SQL before applying to production", "Idempotent migration scripts for deploy pipelines"],
  },
  "csharp:t4:di": {
    nodeId: "csharp:t4:di", title: "Dependency Injection",
    sections: [
      { heading: "Built-In Container", body: "ASP.NET Core has DI built in. Register services in Program.cs: builder.Services.AddSingleton/AddScoped/AddTransient<TInterface, TImpl>(). Inject via constructor or [FromServices]. Most apps don't need a third-party container (Autofac, Lamar) — the built-in is plenty unless you need very specific features." },
      { heading: "Lifetimes", body: "Singleton: one instance per app. Scoped: one per request (the most common for web apps). Transient: a new instance every time. Pick by: mutability, shareability, and cost. DbContext is typically Scoped (per-request unit of work). Stateless helpers can be Singleton or Transient." },
      { heading: "Captive Dependency Pitfall", body: "A Singleton holding a reference to a Scoped or Transient service captures it for the app's lifetime — bad. EF DbContext (Scoped) inside a Singleton means you reuse one DbContext across requests. The container detects this in development; learn to recognize the pattern. Workaround: inject IServiceScopeFactory and create scopes manually." },
    ],
    codeExamples: [
      { title: "Register + inject", code: `// Define
public interface IGreeter
{
    string Hello(string name);
}

public class Greeter : IGreeter
{
    public string Hello(string name) => $"hi {name}";
}

// Register
builder.Services.AddSingleton<IGreeter, Greeter>();

// Inject (minimal API)
app.MapGet("/{name}", (string name, IGreeter g) => g.Hello(name));

// Inject (controller / class)
public class GreetController : ControllerBase
{
    private readonly IGreeter _greeter;
    public GreetController(IGreeter greeter) => _greeter = greeter;

    [HttpGet("/{name}")]
    public string Get(string name) => _greeter.Hello(name);
}`, explanation: "Container resolves IGreeter to Greeter. Constructor injection is the default." },
      { title: "Picking lifetimes", code: `// Singleton — one instance per app
//   - Pure helper / config holder / no per-request state
builder.Services.AddSingleton<IConfig>(...);

// Scoped — one instance per HTTP request
//   - DbContext, request-bound services
builder.Services.AddScoped<AppDb>();

// Transient — new instance every time
//   - Stateless small services
builder.Services.AddTransient<IClock, SystemClock>();`, explanation: "Match lifetime to whether the service holds state and how shared it is." },
      { title: "Captive dependency + workaround", code: `// PROBLEM
public class CachedService    // intended Singleton
{
    public CachedService(AppDb db) { /* captures Scoped DbContext */ }
}
// In dev, runtime throws when this Singleton is built — captured Scoped.

// FIX — inject scope factory; create a scope per use
public class CachedService
{
    private readonly IServiceScopeFactory _scopes;
    public CachedService(IServiceScopeFactory scopes) => _scopes = scopes;

    public async Task DoWorkAsync()
    {
        using var scope = _scopes.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDb>();
        // ... use db ...
    }
}`, explanation: "Singletons creating scopes on demand is the standard fix for this captured-dependency pattern." },
    ],
    keyTakeaways: ["AddSingleton / AddScoped / AddTransient — three lifetimes", "Inject via constructor (default) or [FromServices] / minimal API parameters", "DbContext is typically Scoped (per request)", "Singleton capturing Scoped/Transient = captive dependency", "Use IServiceScopeFactory in Singletons to create scopes on demand"],
  },
};
