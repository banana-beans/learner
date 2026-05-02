// ============================================================
// C# — All Tiers (T1–T4) — light format
// ============================================================

import type { LessonContent } from "./python-basics";

export const csharpLessons: Record<string, LessonContent> = {
  "csharp:t1:syntax": {
    nodeId: "csharp:t1:syntax", title: "C# Syntax & Types",
    sections: [
      { heading: "Value vs Reference Types", body: "Value types (int, struct, enum) live on the stack and copy by value. Reference types (class, string, array) live on the heap; variables hold references. string is special — reference type but immutable, so it behaves value-ish." },
      { heading: "Nullability", body: "C# 8+ has nullable reference types. string? means 'might be null'; plain string is non-nullable. The compiler tracks nulls and warns on dereferences. ?? is null-coalescing; ?. is null-conditional." },
    ],
    codeExamples: [
      { title: "Value vs reference", code: `int a = 5;
int b = a;
b = 10;
Console.WriteLine($"{a} {b}");  // 5 10

int[] arr1 = { 1, 2 };
int[] arr2 = arr1;
arr2[0] = 99;
Console.WriteLine(arr1[0]);     // 99 — same array`, explanation: "Value types copy; reference types share." },
      { title: "Nullable + ??", code: `string? name = null;
string display = name ?? "anonymous";
Console.WriteLine(display);  // anonymous`, explanation: "?? returns the right side when the left is null." },
    ],
    keyTakeaways: ["Value types copy; reference types share", "string is reference but immutable", "string? = nullable; string = non-nullable", "?? null-coalescing, ?. null-conditional"],
  },
  "csharp:t1:control-flow": {
    nodeId: "csharp:t1:control-flow", title: "Control Flow",
    sections: [
      { heading: "Branches", body: "if/else, switch statement, switch expression (=> arrow form). Pattern matching in switch (and is) lets you destructure types and branch on shape, not just value." },
      { heading: "Loops", body: "for / while / do-while like C. foreach iterates IEnumerables. break, continue work as expected. yield return in a method makes it an iterator." },
    ],
    codeExamples: [
      { title: "Switch expression", code: `string Describe(int code) => code switch {
    200 => "OK",
    404 => "Not Found",
    >= 500 => "Server Error",
    _ => "Other",
};
Console.WriteLine(Describe(404));  // Not Found`, explanation: "Switch expressions return a value; relational patterns (>=) are supported." },
      { title: "Pattern matching", code: `object o = "hello";
if (o is string s && s.Length > 3) {
    Console.WriteLine(s.ToUpper());
}`, explanation: "is patterns destructure and bind in one shot." },
    ],
    keyTakeaways: ["Switch expression returns a value; switch statement doesn't", "Pattern matching: is, switch with relational/typed patterns", "foreach iterates anything that implements IEnumerable", "yield return turns a method into an iterator"],
  },
  "csharp:t1:console-io": {
    nodeId: "csharp:t1:console-io", title: "Console I/O",
    sections: [
      { heading: "WriteLine and ReadLine", body: "Console.WriteLine prints with a newline. ReadLine reads a line as a string (or null on EOF). Convert to numbers explicitly: int.Parse, double.TryParse." },
      { heading: "String Interpolation", body: "$\"...\" interpolates {expr}. $@\"...\" is verbatim + interpolated (preserves backslashes and newlines)." },
    ],
    codeExamples: [
      { title: "Read + parse + write", code: `Console.Write("Age: ");
string? line = Console.ReadLine();
if (int.TryParse(line, out int age)) {
    Console.WriteLine($"You are {age} years old.");
}`, explanation: "TryParse avoids exceptions on bad input. Output via interpolation." },
      { title: "Verbatim strings", code: `string path = @"C:\\Users\\Public";
Console.WriteLine(path);  // C:\\Users\\Public — backslash literally
Console.WriteLine($@"Hi {Environment.UserName}");`, explanation: "@ disables escape processing; $@ adds interpolation on top." },
    ],
    keyTakeaways: ["Console.WriteLine writes with newline", "TryParse over Parse to avoid exceptions on bad input", "$\"...\" for interpolation; $@\"...\" for verbatim + interpolated", "Console.ReadLine returns string? (nullable on EOF)"],
  },
  "csharp:t1:methods": {
    nodeId: "csharp:t1:methods", title: "Methods",
    sections: [
      { heading: "Defining and Calling", body: "ReturnType Name(Params) { body }. Inside a class. Use static for class-level methods. Overloads share a name with different signatures." },
      { heading: "Parameter Modes", body: "Default: pass by value (copy of value or reference). ref: pass by reference. out: pass by reference, must be assigned in the method (used by TryParse)." },
    ],
    codeExamples: [
      { title: "Method with overload", code: `int Area(int side) => side * side;
double Area(double w, double h) => w * h;

Console.WriteLine(Area(5));        // 25
Console.WriteLine(Area(3.0, 4.0)); // 12`, explanation: "Same name; resolved by argument types." },
      { title: "out parameter", code: `bool TryDivide(int a, int b, out int result) {
    if (b == 0) { result = 0; return false; }
    result = a / b;
    return true;
}

if (TryDivide(10, 3, out int q)) {
    Console.WriteLine(q); // 3
}`, explanation: "Caller declares the variable inline; method must assign before returning true." },
    ],
    keyTakeaways: ["Methods belong to classes; static for class-level", "Overloading: same name, different signature", "ref passes by reference (must already be assigned)", "out passes by reference (must be assigned in method)"],
  },
  "csharp:t2:classes": {
    nodeId: "csharp:t2:classes", title: "Classes & Records",
    sections: [
      { heading: "Classes, Properties, Constructors", body: "class declares a reference type. Auto-properties: public string Name { get; set; }. init-only setters: { get; init; } — settable in constructor or object initializer, then frozen." },
      { heading: "Records", body: "record is a special class with value-based equality, generated ToString, and concise positional syntax: record Point(int X, int Y). Use records for data containers; classes when behavior dominates." },
    ],
    codeExamples: [
      { title: "Class with init-only", code: `class User {
    public required string Name { get; init; }
    public int Age { get; init; }
}

var u = new User { Name = "Ada", Age = 36 };
Console.WriteLine(u.Name);
// u.Age = 37; // error — init-only after construction`, explanation: "required forces the caller to set it. init-only freezes after construction." },
      { title: "Record", code: `record Point(int X, int Y);

var p1 = new Point(1, 2);
var p2 = new Point(1, 2);
Console.WriteLine(p1 == p2);  // True — value equality
Console.WriteLine(p1);        // Point { X = 1, Y = 2 }`, explanation: "Records are concise data carriers with value equality and built-in deconstruction." },
    ],
    keyTakeaways: ["class = reference type; record = value-equal data carrier", "Auto-properties: { get; set; }; init-only: { get; init; }", "required forces init at construction", "Pick record for plain data; class when behavior dominates"],
  },
  "csharp:t2:interfaces": {
    nodeId: "csharp:t2:interfaces", title: "Interfaces & Polymorphism",
    sections: [
      { heading: "Interfaces", body: "interface IShape declares a contract. Classes implement with class Square : IShape. Interfaces can have default implementations (C# 8+) — backwards-compatible API extensions." },
      { heading: "Polymorphism", body: "Code against IShape, swap implementations. The compiler dispatches the right method at runtime. The textbook example of OOP — and the basis of dependency inversion / DI." },
    ],
    codeExamples: [
      { title: "Interface + impl", code: `interface IShape {
    double Area();
}
class Square : IShape {
    public double Side { get; init; }
    public double Area() => Side * Side;
}

IShape s = new Square { Side = 5 };
Console.WriteLine(s.Area()); // 25`, explanation: "Variable typed as IShape; runtime dispatches to Square.Area." },
      { title: "Multiple interfaces", code: `interface ILoggable { void Log(); }
interface IEquatable<T> { bool EqualsTo(T other); }

class Item : ILoggable, IEquatable<Item> {
    public string Name { get; init; } = "";
    public void Log() => Console.WriteLine(Name);
    public bool EqualsTo(Item o) => Name == o.Name;
}

new Item { Name = "x" }.Log();`, explanation: "A class implements many interfaces; only one base class allowed." },
    ],
    keyTakeaways: ["Interface = contract; class implements with : IName", "Polymorphism: code against the interface, swap impls", "Multiple interface inheritance allowed; single class inheritance", "Default interface methods enable backwards-compatible additions"],
  },
  "csharp:t2:generics": {
    nodeId: "csharp:t2:generics", title: "Generics",
    sections: [
      { heading: "Type Parameters", body: "List<T>, Dictionary<TKey, TValue>. Generic methods: T First<T>(List<T> list). The T is replaced at compile time with the actual type, enabling type safety without boxing." },
      { heading: "Constraints", body: "where T : new() forces a parameterless constructor. where T : class restricts to reference types. where T : IComparable<T> requires the interface. Multiple constraints: comma-separated." },
    ],
    codeExamples: [
      { title: "Generic method", code: `T First<T>(List<T> list) where T : notnull {
    return list[0];
}

Console.WriteLine(First(new List<int> { 1, 2, 3 }));        // 1
Console.WriteLine(First(new List<string> { "a", "b" }));    // a`, explanation: "Type inferred from argument. Same compiled code, different specializations." },
      { title: "Generic class with constraint", code: `class MaxFinder<T> where T : IComparable<T> {
    public T MaxOf(IEnumerable<T> items) {
        T best = items.First();
        foreach (var x in items.Skip(1)) {
            if (x.CompareTo(best) > 0) best = x;
        }
        return best;
    }
}

var f = new MaxFinder<int>();
Console.WriteLine(f.MaxOf(new[] { 3, 1, 4, 1, 5 })); // 5`, explanation: "Constraint guarantees CompareTo is available on T." },
    ],
    keyTakeaways: ["Generics give type-safe reuse without boxing", "<T> declares a type parameter", "where T : ... constrains capabilities", "Generic methods infer T from arguments"],
  },
  "csharp:t2:exceptions": {
    nodeId: "csharp:t2:exceptions", title: "Exceptions",
    sections: [
      { heading: "try / catch / finally", body: "Wrap risky code in try, handle in catch, cleanup in finally. Catch the most specific type first. Don't catch Exception unless you re-throw or have a logging pattern." },
      { heading: "Custom Exceptions and Filters", body: "Subclass Exception (or a more specific base). Exception filters with when (cond) let you catch only when a condition holds: catch (IOException ex) when (ex.Message.Contains(\"locked\"))." },
    ],
    codeExamples: [
      { title: "try/catch + custom", code: `class ConfigException : Exception {
    public ConfigException(string msg) : base(msg) {}
}

try {
    throw new ConfigException("missing port");
} catch (ConfigException ex) {
    Console.WriteLine($"config error: {ex.Message}");
}`, explanation: "Define custom by subclassing Exception. Constructor calls base." },
      { title: "Exception filter", code: `try {
    throw new InvalidOperationException("transient");
} catch (InvalidOperationException ex) when (ex.Message.Contains("transient")) {
    Console.WriteLine("retrying...");
}`, explanation: "when clauses run before the stack unwinds — only catch matching." },
    ],
    keyTakeaways: ["Catch specific types; avoid bare catch (Exception)", "Custom: subclass Exception, call base constructor", "when (cond) filters let you catch conditionally", "finally runs in success and failure paths"],
  },
  "csharp:t3:linq": {
    nodeId: "csharp:t3:linq", title: "LINQ",
    sections: [
      { heading: "Queries Over Collections", body: "LINQ adds Where, Select, OrderBy, GroupBy, Join methods to IEnumerable. Two syntaxes: method (.Where(...).Select(...)) and query (from x in xs where ... select ...). Method syntax is more flexible; query syntax is sometimes more readable for joins." },
      { heading: "Deferred Execution", body: "Most LINQ operators don't run until you enumerate (foreach, ToList, Count). This means reusing a query re-runs it. ToList materializes once and caches." },
    ],
    codeExamples: [
      { title: "Method syntax", code: `int[] nums = { 1, 2, 3, 4, 5 };
var evenSquares = nums
    .Where(n => n % 2 == 0)
    .Select(n => n * n)
    .ToList();
Console.WriteLine(string.Join(",", evenSquares));  // 4,16`, explanation: "Filter, then project, then materialize." },
      { title: "GroupBy", code: `var people = new[] {
    new { Name = "Ada",   Dept = "Eng" },
    new { Name = "Linus", Dept = "Eng" },
    new { Name = "Grace", Dept = "Ops" },
};
var byDept = people.GroupBy(p => p.Dept);
foreach (var g in byDept) {
    Console.WriteLine($"{g.Key}: {string.Join(", ", g.Select(p => p.Name))}");
}`, explanation: "GroupBy returns IEnumerable<IGrouping<TKey, T>>." },
    ],
    keyTakeaways: ["LINQ = Where, Select, OrderBy, GroupBy, Join over IEnumerable", "Deferred execution: queries don't run until enumerated", "ToList / ToArray / Count force execution", "Two syntaxes — pick whichever's clearer"],
  },
  "csharp:t3:collections": {
    nodeId: "csharp:t3:collections", title: "Collections",
    sections: [
      { heading: "The Big Four", body: "List<T> dynamic array. Dictionary<K, V> hash map. HashSet<T> hash set. Queue<T> / Stack<T> for FIFO/LIFO. All in System.Collections.Generic." },
      { heading: "Read-Only and Immutable", body: "ReadOnlyCollection<T> wraps a list with read-only access. ImmutableList<T> (System.Collections.Immutable) returns new instances on mutation — useful for thread safety and undo." },
    ],
    codeExamples: [
      { title: "Dictionary", code: `var prices = new Dictionary<string, decimal> {
    ["apple"] = 1.0m,
    ["banana"] = 0.5m,
};
Console.WriteLine(prices["apple"]);
if (prices.TryGetValue("cherry", out var p)) {
    Console.WriteLine(p);
}`, explanation: "TryGetValue avoids KeyNotFoundException." },
      { title: "HashSet ops", code: `var a = new HashSet<int> { 1, 2, 3 };
var b = new HashSet<int> { 2, 3, 4 };
a.IntersectWith(b);  // mutates a → {2, 3}
Console.WriteLine(string.Join(",", a));`, explanation: "Set ops mutate in place (IntersectWith) or return new (Intersect)." },
    ],
    keyTakeaways: ["List<T>, Dictionary<K,V>, HashSet<T>, Queue<T>, Stack<T>", "TryGetValue to avoid exceptions on missing keys", "Set ops have mutating and non-mutating variants", "Immutable* for thread-safe / functional patterns"],
  },
  "csharp:t3:delegates": {
    nodeId: "csharp:t3:delegates", title: "Delegates & Events",
    sections: [
      { heading: "Func, Action, Predicate", body: "Func<T1, ..., TResult> for return-value delegates. Action<T1, ...> for void. Predicate<T> = Func<T, bool>. Lambdas (x => x * 2) implicitly convert to delegate types." },
      { heading: "Events", body: "event keyword wraps a multicast delegate field. Subscribers add handlers with +=; remove with -=. The pattern enforces 'invoke from inside the class only'." },
    ],
    codeExamples: [
      { title: "Func + lambda", code: `Func<int, int> sq = x => x * x;
Action<string> log = m => Console.WriteLine($"[LOG] {m}");
sq(5);     // 25
log("hi"); // [LOG] hi`, explanation: "Lambdas are first-class. Func returns; Action doesn't." },
      { title: "Event", code: `class Button {
    public event Action? Clicked;
    public void Click() => Clicked?.Invoke();
}

var b = new Button();
b.Clicked += () => Console.WriteLine("clicked!");
b.Click(); // clicked!`, explanation: "?.Invoke() handles the null case (no subscribers)." },
    ],
    keyTakeaways: ["Func<...> and Action<...> are pre-declared delegate types", "Lambdas convert to delegates implicitly", "event += subscribe; -= unsubscribe", "Use ?.Invoke() to safely call when there may be no subscribers"],
  },
  "csharp:t3:extension-methods": {
    nodeId: "csharp:t3:extension-methods", title: "Extension Methods",
    sections: [
      { heading: "Adding Methods Without Inheritance", body: "Define a static method in a static class with this T as first parameter. Now you can call it as if it's an instance method on T. LINQ is implemented this way over IEnumerable<T>." },
      { heading: "When To Use", body: "Adding helpers to types you don't own (string, IEnumerable). Building fluent APIs. Don't over-use — extension methods can hide real type structure and surprise readers." },
    ],
    codeExamples: [
      { title: "String extension", code: `static class StringExt {
    public static bool IsNullOrEmpty(this string? s) =>
        string.IsNullOrEmpty(s);
}

string? a = null;
Console.WriteLine(a.IsNullOrEmpty());  // True`, explanation: "this string makes the method callable on string instances." },
      { title: "Extending IEnumerable", code: `static class EnumerableExt {
    public static IEnumerable<T> Top<T>(this IEnumerable<T> source, int n) =>
        source.Take(n);
}

new[] { 1, 2, 3, 4, 5 }.Top(2).ToList().ForEach(Console.WriteLine);
// 1
// 2`, explanation: "Same shape LINQ uses. Add domain-specific helpers via extensions." },
    ],
    keyTakeaways: ["Static method, static class, this T first parameter", "LINQ is built entirely from extension methods", "Great for fluent APIs and helpers on types you don't own", "Don't over-use — they can hide real method dispatch"],
  },
  "csharp:t4:async": {
    nodeId: "csharp:t4:async", title: "Async / Await (C#)",
    sections: [
      { heading: "Task, async, await", body: "async methods return Task or Task<T>. await unwraps a Task. await Task.WhenAll(...) for parallel tasks. Don't .Result or .Wait() — they can deadlock in UI/ASP.NET classic contexts." },
      { heading: "Cancellation", body: "Pass a CancellationToken through async chains. Long-running work checks token.ThrowIfCancellationRequested() and propagates the OperationCanceledException." },
    ],
    codeExamples: [
      { title: "Async method", code: `async Task<int> FetchAsync() {
    await Task.Delay(10);
    return 42;
}

int n = await FetchAsync();
Console.WriteLine(n);`, explanation: "await suspends; control returns to the caller until the task completes." },
      { title: "WhenAll", code: `async Task<string> Slow(string label, int ms) {
    await Task.Delay(ms);
    return label;
}

string[] results = await Task.WhenAll(
    Slow("a", 50), Slow("b", 50), Slow("c", 50));
Console.WriteLine(string.Join(",", results));  // ~50ms total`, explanation: "WhenAll runs concurrently. Total time = max, not sum." },
    ],
    keyTakeaways: ["async methods return Task / Task<T>", "await suspends and resumes when ready", "WhenAll for concurrent waits", "Never block on async with .Result / .Wait()"],
  },
  "csharp:t4:aspnet": {
    nodeId: "csharp:t4:aspnet", title: "ASP.NET Core",
    sections: [
      { heading: "Minimal APIs", body: "Modern ASP.NET Core ships with minimal APIs: build a WebApplication, register routes inline. Tiny boilerplate, great for microservices and simple APIs. Controllers still available for big apps." },
      { heading: "Middleware", body: "Each request flows through a pipeline of middleware. app.Use(...) inserts a middleware. Built-ins: routing, auth, CORS, exception handling. Order matters — auth before authorization, etc." },
    ],
    codeExamples: [
      { title: "Minimal API", code: `var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

app.MapGet("/", () => "Hello World!");
app.MapGet("/users/{id:int}", (int id) =>
    new { id, name = $"user-{id}" });

app.Run();`, explanation: "Routes return values are auto-serialized to JSON. Route constraints like :int." },
      { title: "Middleware order", code: `app.UseExceptionHandler("/error");
app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();`, explanation: "Order is the order of execution. Auth before Authz; ExceptionHandler outermost." },
    ],
    keyTakeaways: ["Minimal APIs: app.MapGet/Post/etc. with inline handlers", "Middleware pipeline runs in registration order", "Route constraints: {id:int}, {slug:alpha}", "Return values auto-serialize to JSON"],
  },
  "csharp:t4:ef-core": {
    nodeId: "csharp:t4:ef-core", title: "Entity Framework Core",
    sections: [
      { heading: "DbContext + DbSet", body: "DbContext is your unit of work. DbSet<T> represents a table. Configure via Fluent API in OnModelCreating, or with attributes on the entity. EF tracks changes and persists on SaveChanges()." },
      { heading: "Migrations", body: "dotnet ef migrations add InitialCreate generates a migration script from your model. dotnet ef database update applies it. Always review generated migrations before applying to production." },
    ],
    codeExamples: [
      { title: "Context + entity", code: `class User {
    public int Id { get; set; }
    public string Name { get; set; } = "";
}

class AppDb : DbContext {
    public DbSet<User> Users => Set<User>();
    protected override void OnConfiguring(DbContextOptionsBuilder o) =>
        o.UseSqlite("Data Source=app.db");
}`, explanation: "DbSet<T> = table. Override OnConfiguring or inject options." },
      { title: "Query + save", code: `using var db = new AppDb();
db.Users.Add(new User { Name = "Ada" });
await db.SaveChangesAsync();

var ada = await db.Users.FirstOrDefaultAsync(u => u.Name == "Ada");`, explanation: "Add to DbSet; SaveChangesAsync flushes. LINQ queries translate to SQL." },
    ],
    keyTakeaways: ["DbContext = unit of work; DbSet<T> = table", "SaveChanges persists tracked changes", "dotnet ef migrations add / update for schema changes", "Always review generated migrations"],
  },
  "csharp:t4:di": {
    nodeId: "csharp:t4:di", title: "Dependency Injection",
    sections: [
      { heading: "Built-In Container", body: "ASP.NET Core has DI built in. Register services in Program.cs: builder.Services.AddSingleton/AddScoped/AddTransient. Inject via constructor or [FromServices] in handlers." },
      { heading: "Lifetimes", body: "Singleton: one per app. Scoped: one per request. Transient: a new instance every time. Pick by mutability and shareability — DbContext is typically Scoped." },
    ],
    codeExamples: [
      { title: "Register + inject", code: `interface IGreeter { string Hello(string name); }
class Greeter : IGreeter {
    public string Hello(string name) => $"hi {name}";
}

builder.Services.AddSingleton<IGreeter, Greeter>();

app.MapGet("/{name}", (string name, IGreeter g) => g.Hello(name));`, explanation: "Container resolves IGreeter to Greeter for the handler." },
      { title: "Picking lifetimes", code: `// One config object across the app — Singleton
builder.Services.AddSingleton<IConfig>(...);
// One DB context per request — Scoped
builder.Services.AddScoped<AppDb>();
// Stateless helper — Transient
builder.Services.AddTransient<IClock, SystemClock>();`, explanation: "Match lifetime to whether the service holds state and how shared it is." },
    ],
    keyTakeaways: ["AddSingleton/Scoped/Transient = lifetime choices", "Inject via constructor or [FromServices]", "DbContext is typically Scoped (per request)", "Don't capture Scoped/Transient in Singleton — captive dependency"],
  },
};
