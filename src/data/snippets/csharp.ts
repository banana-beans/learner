import type { Snippet } from "./types";

export const csharpSnippets: Snippet[] = [
  {
    id: "cs-var",
    language: "csharp",
    title: "var — implicit typing",
    tag: "syntax",
    code: `// 'var' tells the compiler to infer the type from the right side.
// The variable is still strongly typed — just less typing.
var count = 42;                       // int
var name = "Ada";                     // string
var items = new List<int> { 1, 2 };   // List<int>

// Use var when the type is obvious from the initializer.
// Fall back to explicit types when it makes intent clearer.`,
    explanation:
      "Reduces visual noise without sacrificing type safety. Conventional in modern C#; controversial only on 'should new types be obvious from the line.'",
  },
  {
    id: "cs-linq-where",
    language: "csharp",
    title: "LINQ Where + Select",
    tag: "stdlib",
    code: `int[] nums = { 1, 2, 3, 4, 5, 6 };

// Method-syntax LINQ pipeline — filter, then transform.
var evenSquares = nums
    .Where(n => n % 2 == 0)         // keep evens
    .Select(n => n * n)             // square them
    .ToList();                      // materialize

Console.WriteLine(string.Join(",", evenSquares));
// 4,16,36`,
    explanation:
      "LINQ over IEnumerable is lazy by default. Each step returns a new IEnumerable; .ToList() forces execution.",
  },
  {
    id: "cs-properties",
    language: "csharp",
    title: "Auto-properties",
    tag: "OOP",
    code: `class User
{
    // Auto-property — compiler generates the backing field for you.
    public string Name { get; set; } = "";

    // Init-only setter (C# 9+) — settable in constructor or
    // object initializer, then frozen for the lifetime of the instance.
    public int Age { get; init; }

    // Required (C# 11+) — caller MUST set it at construction.
    public required string Email { get; init; }
}

var u = new User { Name = "Ada", Age = 36, Email = "a@x.com" };`,
    explanation:
      "Init-only + required eliminate most uses of constructor parameter lists. Object initializers stay readable as the class grows.",
  },
  {
    id: "cs-async",
    language: "csharp",
    title: "async / await basics",
    tag: "concurrency",
    code: `// async methods return Task or Task<T>. await unwraps the Task —
// the method pauses, control returns to the caller, resumes when ready.
async Task<int> FetchAsync()
{
    await Task.Delay(50);    // yield for 50ms; doesn't block a thread
    return 42;
}

int result = await FetchAsync();
Console.WriteLine(result);   // 42`,
    explanation:
      "await suspends; method resumes when the awaited task completes. Don't block on async with .Result / .Wait() — deadlock risk in some contexts.",
  },
  {
    id: "cs-record",
    language: "csharp",
    title: "record — value-equal data",
    tag: "OOP",
    code: `// Records auto-generate Equals, GetHashCode, ToString,
// and a Deconstruct method. Positional records are immutable
// (init-only) by default.
record Point(int X, int Y);

var p1 = new Point(1, 2);
var p2 = new Point(1, 2);
Console.WriteLine(p1 == p2);    // True   — value equality
Console.WriteLine(p1);          // Point { X = 1, Y = 2 }

// 'with' creates a non-destructive copy with overrides.
var p3 = p1 with { Y = 99 };
Console.WriteLine(p3);          // Point { X = 1, Y = 99 }`,
    explanation:
      "Records are concise data carriers. Use them when identity doesn't matter — only the values do.",
  },
  {
    id: "cs-null-coalesce",
    language: "csharp",
    title: "?? and ?. operators",
    tag: "syntax",
    code: `string? maybeName = null;          // nullable reference type

// ?? — null-coalescing — returns right side ONLY if left is null.
string display = maybeName ?? "anonymous";
Console.WriteLine(display);        // anonymous

// ?. — null-conditional — returns null instead of dereferencing null.
int? length = maybeName?.Length;   // null, not NRE
Console.WriteLine(length);         // (empty / null)

// ??= — assign only if currently null.
string? log = null;
log ??= "default-log";
Console.WriteLine(log);            // default-log`,
    explanation:
      "Modern C# null handling. Together with the compiler's nullability tracking (string vs string?), you can shrink the surface area of NullReferenceException dramatically.",
  },
  {
    id: "cs-pattern-match",
    language: "csharp",
    title: "Pattern matching with switch",
    tag: "syntax",
    code: `// Switch EXPRESSION returns a value, supports patterns,
// and the compiler warns if you forget a case.
string Describe(object value) => value switch
{
    null            => "null",
    int n when n<0  => "negative int",
    int n           => $"int {n}",
    string s        => $"string of length {s.Length}",
    int[] { Length: > 0 } a => $"int[] starting with {a[0]}",
    _               => "other",
};

Console.WriteLine(Describe(-5));         // negative int
Console.WriteLine(Describe("hi"));       // string of length 2`,
    explanation:
      "Type, value, property, and relational patterns in one place. Clean replacement for chains of if + cast + null-check.",
  },
  {
    id: "cs-foreach",
    language: "csharp",
    title: "foreach iteration",
    tag: "syntax",
    code: `var fruits = new[] { "apple", "banana", "cherry" };

// foreach iterates anything implementing IEnumerable.
// No index needed (use .Select((x, i) => ...) when you do).
foreach (var fruit in fruits)
{
    Console.WriteLine(fruit.ToUpper());
}
// APPLE
// BANANA
// CHERRY`,
    explanation:
      "Default loop in modern C#. Behind the scenes it calls GetEnumerator() and disposes correctly. Only use 'for' with an explicit index when you actually need the index.",
  },
  {
    id: "cs-interpolation",
    language: "csharp",
    title: "String interpolation",
    tag: "syntax",
    code: `var name = "Ada";
var pi = 3.14159265;

// $"..." embeds expressions inside {curlies}.
// Format specs after a colon — same as .NET format strings.
Console.WriteLine($"Hello, {name}!");          // Hello, Ada!
Console.WriteLine($"{pi:F2}");                 // 3.14
Console.WriteLine($"{1234567:N0}");            // 1,234,567

// Verbatim + interpolated — escapes preserved literally:
var path = $@"C:\Users\{name}\file.txt";

// Raw string literal (C# 11+) — multi-line, no escaping needed:
string json = $$"""
    { "name": "{{name}}", "version": 1 }
    """;`,
    explanation:
      "$\" \" replaces String.Format. Raw strings ($\"\"\"...\"\"\") are gold for embedded JSON, SQL, regex.",
  },
  {
    id: "cs-tuple",
    language: "csharp",
    title: "Tuples + deconstruction",
    tag: "syntax",
    code: `// Inline tuple — no class needed for ad-hoc grouping.
(int min, int max) MinMax(IEnumerable<int> xs)
{
    int lo = int.MaxValue, hi = int.MinValue;
    foreach (var x in xs)
    {
        if (x < lo) lo = x;
        if (x > hi) hi = x;
    }
    return (lo, hi);            // implicit tuple construction
}

// Deconstruct on the receiving side — names from the return type.
var (lo, hi) = MinMax(new[] { 3, 1, 4, 1, 5, 9, 2, 6 });
Console.WriteLine($"{lo}..{hi}");    // 1..9`,
    explanation:
      "Multiple returns without ceremony. Records are the right answer when you need named types; tuples are perfect for one-off groupings.",
  },
  {
    id: "cs-linq-aggregate",
    language: "csharp",
    title: "GroupBy + aggregate",
    tag: "stdlib",
    code: `var people = new[]
{
    new { Name = "Ada",   Dept = "Eng" },
    new { Name = "Linus", Dept = "Eng" },
    new { Name = "Grace", Dept = "Ops" },
};

// GroupBy returns IGrouping<TKey, T> — each group is itself an IEnumerable.
foreach (var g in people.GroupBy(p => p.Dept))
{
    var names = string.Join(", ", g.Select(p => p.Name));
    Console.WriteLine($"{g.Key}: {names}");
}
// Eng: Ada, Linus
// Ops: Grace`,
    explanation:
      "LINQ GroupBy is lazy — no allocation until enumerated. For Dictionary<K, List<T>>-shaped output, follow with .ToDictionary(g => g.Key, g => g.ToList()).",
  },
  {
    id: "cs-lambda",
    language: "csharp",
    title: "Lambda expressions",
    tag: "syntax",
    code: `// Lambda — anonymous function. Convertible to delegate types
// (Func<...>, Action<...>) or expression trees.
Func<int, int> sq      = x => x * x;
Action<string> log     = msg => Console.WriteLine($"[LOG] {msg}");
Func<int, int, int> add = (a, b) => a + b;

Console.WriteLine(sq(5));           // 25
log("hi");                          // [LOG] hi
Console.WriteLine(add(2, 3));       // 5

// Multi-line bodies use braces and explicit return:
Func<int, string> describe = n => {
    if (n < 0) return "negative";
    return n == 0 ? "zero" : "positive";
};`,
    explanation:
      "Lambdas underpin LINQ, async callbacks, event handlers. Single-expression form is implicit return; braces force return statements.",
  },
  {
    id: "cs-expression-bodied",
    language: "csharp",
    title: "Expression-bodied members",
    tag: "syntax",
    code: `class Circle
{
    public double Radius { get; init; }

    // Single-expression methods, properties, ctors → => body
    public double Area      => Math.PI * Radius * Radius;
    public double Diameter  => Radius * 2;
    public override string ToString() => $"Circle(r={Radius})";
}

var c = new Circle { Radius = 5 };
Console.WriteLine(c.Area);          // 78.539...
Console.WriteLine(c);               // Circle(r=5)`,
    explanation:
      "Reduces ceremony for trivial members. Read => as 'evaluates to'. Don't overuse on multi-step logic — block bodies are clearer there.",
  },
  {
    id: "cs-collection-init",
    language: "csharp",
    title: "Collection initializers",
    tag: "syntax",
    code: `// Initialize collections inline at construction time.
var nums = new List<int> { 1, 2, 3, 4, 5 };

var prices = new Dictionary<string, decimal>
{
    ["apple"]  = 1.0m,
    ["banana"] = 0.5m,
    ["cherry"] = 3.0m,
};

// Collection expressions (C# 12+) — even more concise:
int[] evens = [2, 4, 6, 8];
List<string> names = ["ada", "linus", "grace"];

// Spread (C# 12+):
int[] more = [..nums, 6, 7];   // [1, 2, 3, 4, 5, 6, 7]`,
    explanation:
      "Collection expressions in C# 12+ work for any compatible target type. Cleaner than the older 'new int[] { ... }' shape.",
  },
  {
    id: "cs-using-disposable",
    language: "csharp",
    title: "using statement",
    tag: "syntax",
    code: `// 'using' guarantees Dispose() runs at scope exit, even on exception.
// Modern syntax (C# 8+): no extra braces — disposed at end of method.
using var reader = new StreamReader("notes.txt");
Console.WriteLine(reader.ReadToEnd());
// reader.Dispose() called here — automatic.

// Older pattern (still valid) — explicit scope:
using (var w = new StreamWriter("out.txt"))
{
    w.WriteLine("hello");
}`,
    explanation:
      "Anything implementing IDisposable should be in a using. Streams, DB connections, locks — all benefit from automatic cleanup.",
  },
  {
    id: "cs-nameof",
    language: "csharp",
    title: "nameof — refactor-safe strings",
    tag: "syntax",
    code: `class User
{
    public string Name { get; set; } = "";

    public void SetName(string name)
    {
        // nameof returns the IDENTIFIER name as a string.
        // If you rename the parameter, nameof updates with you —
        // unlike a hardcoded "name" literal.
        if (string.IsNullOrEmpty(name))
            throw new ArgumentException("required", nameof(name));

        Name = name;
    }
}`,
    explanation:
      "Use everywhere you'd otherwise hardcode a parameter or property name. Refactor-safe; the compiler catches typos.",
  },
];
