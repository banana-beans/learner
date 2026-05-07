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
  {
    id: "cs-range-index",
    language: "csharp",
    title: "Ranges and indices (C# 8)",
    tag: "snippet",
    code: `int[] nums = { 10, 20, 30, 40, 50 };

// ^n counts from the end: ^1 = last, ^2 = second-to-last.
Console.WriteLine(nums[^1]);      // 50
Console.WriteLine(nums[^2]);      // 40

// a..b is a Range: inclusive start, exclusive end.
int[] slice = nums[1..3];         // [20, 30]
int[] tail  = nums[^2..];         // [40, 50]
int[] head  = nums[..2];          // [10, 20]
int[] copy  = nums[..];           // full copy`,
    explanation: "Index (^) and Range (..) make slice-like operations on arrays, strings, and Spans readable without manual index arithmetic.",
  },
  {
    id: "cs-null-forgiving",
    language: "csharp",
    title: "Null-forgiving operator !",
    tag: "snippet",
    code: `// '!' suppresses the nullable warning when you know the value isn't null.
// It does NOT add a runtime null check — it's a compiler hint only.
string? name = GetName();

// You're certain it won't be null here:
string upper = name!.ToUpper();   // no nullable warning

// Prefer null checks, ??, or ?. over '!'.
// Overusing '!' defeats nullable reference types.
string GetName() => "Ada";`,
    explanation: "The null-forgiving operator is an escape hatch, not a solution. Reserve it for initialisation patterns and test assertions where you truly know better than the analyser.",
  },
  {
    id: "cs-ternary",
    language: "csharp",
    title: "Ternary and null-coalescing shorthand",
    tag: "snippet",
    code: `int x = 7;

// Ternary: condition ? valueIfTrue : valueIfFalse
string label = x % 2 == 0 ? "even" : "odd";
Console.WriteLine(label);   // odd

// Null-coalescing: returns right side if left is null.
string? input = null;
string display = input ?? "default";
Console.WriteLine(display);   // default

// Null-coalescing assignment: assign only if currently null.
input ??= "assigned";
Console.WriteLine(input);     // assigned`,
    explanation: "These three operators (?:, ??, ??=) cover most conditional-assignment patterns in one readable expression each.",
  },
  {
    id: "cs-string-comparison",
    language: "csharp",
    title: "String comparison with StringComparison",
    tag: "snippet",
    code: `string a = "Hello";
string b = "hello";

// == uses ordinal comparison — fast, culture-independent.
Console.WriteLine(a == b);   // False

// Case-insensitive comparison:
Console.WriteLine(string.Equals(a, b, StringComparison.OrdinalIgnoreCase));   // True
Console.WriteLine(a.StartsWith("HE", StringComparison.OrdinalIgnoreCase));    // True

// For user-visible sorting use StringComparison.CurrentCulture.`,
    explanation: "Never use .ToLower() == for comparisons — it allocates. Pass StringComparison.OrdinalIgnoreCase for culture-insensitive matching without allocation.",
  },
  {
    id: "cs-is-not-null",
    language: "csharp",
    title: "is not null pattern",
    tag: "snippet",
    code: `object? value = "hello";

// Pattern matching null checks — works correctly even with operator overloads.
if (value is not null)
    Console.WriteLine("has value");

// Combine type and null check in one step:
if (value is string s && s.Length > 0)
    Console.WriteLine($"non-empty string: {s}");

// is null vs == null: prefer 'is null' — immune to overloaded == operator.`,
    explanation: "'is not null' and 'is null' are more robust than != null — they can't be fooled by a class that overloads the != operator.",
  },
  {
    id: "cs-throw-expression",
    language: "csharp",
    title: "throw as an expression (C# 7)",
    tag: "snippet",
    code: `class Config
{
    private readonly string _key;

    public Config(string? key)
    {
        // Null-coalescing throw in one line.
        _key = key ?? throw new ArgumentNullException(nameof(key));
    }

    // Expression-bodied method with conditional throw:
    public string Get() =>
        _key.Length > 0
            ? _key
            : throw new InvalidOperationException("empty key");
}`,
    explanation: "Throw expressions eliminate the 'if (x == null) throw ...' setup in constructors and expression-bodied members, keeping the happy-path readable.",
  },
  {
    id: "cs-checked-unchecked",
    language: "csharp",
    title: "checked / unchecked arithmetic",
    tag: "caveats",
    code: `// By default, integer overflow wraps silently (unchecked context).
int max = int.MaxValue;
Console.WriteLine(max + 1);            // -2147483648 — wraps!

// 'checked' throws OverflowException on overflow.
try
{
    int result = checked(max + 1);
}
catch (OverflowException)
{
    Console.WriteLine("overflow caught");
}

// unchecked{} makes the wrapping intent explicit.
int wrapped = unchecked(max + 1);
Console.WriteLine(wrapped);   // -2147483648`,
    explanation: "C# defaults to unchecked for performance. Use checked blocks in safety-critical code or enable /checked globally for debug builds.",
  },
  {
    id: "cs-const-vs-readonly",
    language: "csharp",
    title: "const vs readonly",
    tag: "types",
    code: `class Config
{
    // const: compile-time — value inlined at every call site.
    // Only primitives, strings, and null are allowed.
    public const int MaxRetries = 3;

    // readonly: runtime — set in constructor or inline, then immutable.
    // Any type works; not inlined (callers don't need recompile on change).
    public readonly DateTime StartedAt = DateTime.UtcNow;

    public readonly List<string> AllowedHosts;

    public Config(List<string> hosts)
    {
        AllowedHosts = hosts;  // set in constructor — OK
    }
}`,
    explanation: "Use const for true compile-time literals. Use readonly when the value requires a constructor, is complex, or you want to avoid cross-assembly version brittleness.",
  },
  {
    id: "cs-value-ref-types",
    language: "csharp",
    title: "Value types vs reference types",
    tag: "understanding",
    code: `// Value type (struct, int, bool, enum): copied on assignment.
int a = 5;
int b = a;
b = 10;
Console.WriteLine(a);   // 5 — unaffected

// Reference type (class, array): assignment copies the reference.
int[] arr1 = { 1, 2, 3 };
int[] arr2 = arr1;      // both point to the same array
arr2[0] = 99;
Console.WriteLine(arr1[0]);   // 99 — arr1 sees the change`,
    explanation: "This distinction drives assignment semantics, parameter passing, and equality. Value types live on the stack (usually); reference types on the heap.",
  },
  {
    id: "cs-boxing",
    language: "csharp",
    title: "Boxing and unboxing cost",
    tag: "caveats",
    code: `// Boxing wraps a value type in a heap object. Unboxing extracts it.
int n = 42;
object boxed = n;         // boxing — heap allocation
int back = (int)boxed;    // unboxing — cast required

// Boxing happens silently in non-generic APIs:
var list = new System.Collections.ArrayList();
list.Add(1);   // int gets boxed to object!

// Use generic collections to avoid boxing:
var typedList = new List<int>();
typedList.Add(1);   // no boxing`,
    explanation: "Each boxing operation allocates a new heap object. In tight loops or large collections this adds up. Modern C# avoids boxing via generics and Span<T>.",
  },
  {
    id: "cs-closure-capture",
    language: "csharp",
    title: "Closure variable capture",
    tag: "caveats",
    code: `// Lambdas capture variables by reference, not value.
var actions = new List<Action>();
for (int i = 0; i < 3; i++)
    actions.Add(() => Console.WriteLine(i));  // all capture the same 'i'

actions.ForEach(a => a());   // 3 3 3 (i = 3 after loop)

// Fix: introduce a local copy inside the loop.
var fixed_ = new List<Action>();
for (int i = 0; i < 3; i++)
{
    int copy = i;
    fixed_.Add(() => Console.WriteLine(copy));
}
fixed_.ForEach(a => a());   // 0 1 2`,
    explanation: "The loop variable is a single variable; all closures share the same reference. Introduce a local copy to capture the value at each iteration.",
  },
  {
    id: "cs-string-immutable",
    language: "csharp",
    title: "Strings are immutable in C#",
    tag: "understanding",
    code: `string s = "hello";
string t = s;

// Replace returns a NEW string — s is unchanged.
string u = s.Replace("hello", "world");
Console.WriteLine(s);   // hello
Console.WriteLine(u);   // world

// s and t still point to the same object:
Console.WriteLine(object.ReferenceEquals(s, t));   // True

// Building strings in a loop: use StringBuilder.
var sb = new System.Text.StringBuilder();
for (int i = 0; i < 5; i++) sb.Append(i);
Console.WriteLine(sb.ToString());   // 01234`,
    explanation: "String immutability means every 'modification' allocates. The compiler optimises simple concatenations; StringBuilder is needed for loops.",
  },
  {
    id: "cs-list-vs-array",
    language: "csharp",
    title: "List<T> vs T[]",
    tag: "structures",
    code: `// T[]: fixed size, contiguous, slightly faster for random access.
int[] arr = new int[5];
arr[2] = 42;
Console.WriteLine(arr.Length);   // 5

// List<T>: dynamic resizing backed by an internal array.
var list = new List<int> { 1, 2, 3 };
list.Add(4);
list.Remove(2);
Console.WriteLine(list.Count);   // 3

// Convert between them:
int[] fromList = list.ToArray();
List<int> fromArr = [..arr];

// Prefer T[] for fixed-size; List<T> when size changes.`,
    explanation: "List<T> doubles its capacity when full — amortised O(1) Add. Pass List<T>.Capacity to avoid repeated reallocations when you know the final size.",
  },
  {
    id: "cs-dictionary-usage",
    language: "csharp",
    title: "Dictionary<K,V> safe lookup",
    tag: "structures",
    code: `var scores = new Dictionary<string, int>
{
    ["Ada"]   = 95,
    ["Linus"] = 88,
};

// TryGetValue: returns bool, no exception on miss.
if (scores.TryGetValue("Ada", out int score))
    Console.WriteLine($"Ada: {score}");   // Ada: 95

// GetValueOrDefault: returns fallback without throwing.
int gScore = scores.GetValueOrDefault("Grace", 0);

// Iterate pairs:
foreach (var (name, s) in scores)
    Console.WriteLine($"{name}: {s}");`,
    explanation: "Always use TryGetValue (not the indexer []) for lookups that might miss. The indexer throws KeyNotFoundException on a miss.",
  },
  {
    id: "cs-hashset-usage",
    language: "csharp",
    title: "HashSet<T> for membership and dedup",
    tag: "structures",
    code: `var seen = new HashSet<string>();

Console.WriteLine(seen.Add("ada"));    // True  — added
Console.WriteLine(seen.Add("linus"));  // True
Console.WriteLine(seen.Add("ada"));    // False — already present

// O(1) Contains:
Console.WriteLine(seen.Contains("ada"));   // True

// Set algebra:
var a = new HashSet<int> { 1, 2, 3, 4 };
var b = new HashSet<int> { 3, 4, 5, 6 };
a.IntersectWith(b);
Console.WriteLine(string.Join(",", a));  // 3,4`,
    explanation: "HashSet<T> gives O(1) Add/Contains/Remove with automatic deduplication. Use it instead of List when membership testing is your primary operation.",
  },
  {
    id: "cs-stack-queue",
    language: "csharp",
    title: "Stack<T> and Queue<T>",
    tag: "structures",
    code: `// Stack<T>: LIFO
var stack = new Stack<int>();
stack.Push(1); stack.Push(2); stack.Push(3);
Console.WriteLine(stack.Pop());    // 3  — removes top
Console.WriteLine(stack.Peek());   // 2  — doesn't remove

// Queue<T>: FIFO
var queue = new Queue<string>();
queue.Enqueue("first");
queue.Enqueue("second");
Console.WriteLine(queue.Dequeue());  // first
Console.WriteLine(queue.Count);      // 1

// Both have TryPop/TryDequeue — bool return, no exception when empty.`,
    explanation: "Use Queue for BFS and producer-consumer; Stack for DFS, undo-redo, and expression evaluation. Both are backed by arrays with O(1) operations.",
  },
  {
    id: "cs-async-void",
    language: "csharp",
    title: "async void is dangerous",
    tag: "caveats",
    code: `// async void exceptions are unobserved and crash the process.
// BAD:
async void LoadDataBad()
{
    await Task.Delay(10);
    throw new Exception("process crash!");  // unobservable
}

// GOOD: return Task — callers can await and catch.
async Task LoadDataGood()
{
    await Task.Delay(10);
    throw new Exception("can be caught");
}

// The only legitimate use: event handlers (must be void).
async void OnButton_Click(object s, EventArgs e)
{
    await LoadDataGood();
}`,
    explanation: "async void is fire-and-forget; exceptions vanish or crash the process. Always return Task or Task<T> unless you're writing an event handler.",
  },
  {
    id: "cs-captured-loop",
    language: "csharp",
    title: "Captured loop variable in lambda",
    tag: "caveats",
    code: `var funcs = new List<Func<int>>();
for (int i = 0; i < 3; i++)
    funcs.Add(() => i);   // all capture the same 'i' variable

funcs.ForEach(f => Console.Write(f() + " "));  // 3 3 3

// Fix: copy to a local inside the loop.
var fixed_ = new List<Func<int>>();
for (int i = 0; i < 3; i++)
{
    int copy = i;
    fixed_.Add(() => copy);
}
fixed_.ForEach(f => Console.Write(f() + " "));  // 0 1 2`,
    explanation: "foreach over a collection doesn't have this problem in C# 5+ (each iteration has its own variable). for loops share a single variable across all iterations.",
  },
  {
    id: "cs-struct-copy",
    language: "csharp",
    title: "Struct copy semantics",
    tag: "caveats",
    code: `struct Point { public int X; public int Y; }

Point a = new Point { X = 1, Y = 2 };
Point b = a;    // value type — full copy
b.X = 99;
Console.WriteLine(a.X);   // 1 — a is unaffected

// Pitfall: indexing a struct array returns a copy.
var arr = new[] { new Point { X = 1, Y = 2 } };
// arr[0].X = 99;  // CS1612: modifies a temporary copy!

// Fix: read, modify, write back.
var tmp = arr[0]; tmp.X = 99; arr[0] = tmp;`,
    explanation: "Structs copy on every assignment and indexing. Mutable structs in collections are a common footgun — modifications to the temporary copy are silently discarded.",
  },
  {
    id: "cs-int-types",
    language: "csharp",
    title: "Integer type ranges",
    tag: "types",
    code: `Console.WriteLine($"byte:  0..{byte.MaxValue}");            // 0..255
Console.WriteLine($"short: {short.MinValue}..{short.MaxValue}");  // ±32k
Console.WriteLine($"int:   {int.MinValue}..{int.MaxValue}");      // ±2.1B
Console.WriteLine($"long:  {long.MinValue}..{long.MaxValue}");    // ±9.2e18

// Use 'L' suffix for long literals; 'U' for unsigned.
long big  = 10_000_000_000L;
uint port = 8080U;

// Prefer int unless the value exceeds its range.
// byte/short save memory in arrays — not in local variables (promoted to int).`,
    explanation: "int is the default integer type in .NET; long is needed for values beyond ~2 billion. Digit separators (1_000) improve readability for large literals.",
  },
  {
    id: "cs-decimal-precision",
    language: "csharp",
    title: "decimal for financial calculations",
    tag: "types",
    code: `// double is IEEE 754 binary — can't represent 0.1 exactly.
Console.WriteLine(0.1 + 0.2);               // 0.30000000000000004
Console.WriteLine(0.1 + 0.2 == 0.3);        // False

// decimal is 128-bit base-10 — exact for decimal fractions.
decimal d = 0.1m + 0.2m;
Console.WriteLine(d);                        // 0.3
Console.WriteLine(d == 0.3m);               // True

// 'm' suffix creates a decimal literal.
decimal price = 9.99m;`,
    explanation: "Use decimal (not double or float) for money, prices, and any calculation where '0.1 + 0.2 == 0.3' must be true.",
  },
  {
    id: "cs-nullable-value",
    language: "csharp",
    title: "Nullable<T> value types",
    tag: "types",
    code: `// int? is Nullable<int> — a value type that can also be null.
int? age = null;
Console.WriteLine(age.HasValue);    // False
Console.WriteLine(age ?? -1);       // -1

age = 25;
Console.WriteLine(age.Value);       // 25
Console.WriteLine(age.GetValueOrDefault());  // 25

// Null propagates through arithmetic:
int? a = 5, b = null;
Console.WriteLine(a + b);   // null`,
    explanation: "Nullable<T> adds a 'has value' flag to any struct. Use it when absence is semantically distinct from a default value (e.g. 'age unknown' vs 'age 0').",
  },
  {
    id: "cs-ienumerable-ilist",
    language: "csharp",
    title: "IEnumerable vs ICollection vs IList",
    tag: "families",
    code: `// IEnumerable<T>: read-only, forward-only — the minimal contract.
// ICollection<T>: adds Count, Add, Remove, Contains.
// IList<T>: adds indexed access ([i]) and Insert.

// Accept the weakest interface your method actually needs.
void PrintAll(IEnumerable<int> items)
{
    foreach (var x in items) Console.Write(x + " ");
}

PrintAll(new[] { 1, 2, 3 });           // array
PrintAll(new List<int> { 1, 2, 3 });   // List<T>
// PrintAll(Enumerable.Range(1, 3));   // lazy query — works too`,
    explanation: "Accepting IEnumerable<T> makes your API the most flexible. Only widen to IList<T> or ICollection<T> when you genuinely need indexing or mutation.",
  },
  {
    id: "cs-action-func-predicate",
    language: "csharp",
    title: "Action vs Func vs Predicate",
    tag: "families",
    code: `// Action<T>: no return value (void) — use for side effects.
Action<string> log = msg => Console.WriteLine($"[LOG] {msg}");
log("started");   // [LOG] started

// Func<T, TResult>: returns TResult. Last type arg is the return type.
Func<int, int, int> add = (a, b) => a + b;
Console.WriteLine(add(3, 4));   // 7

// Predicate<T> = Func<T, bool>. Used in Find, FindAll, RemoveAll.
Predicate<int> isEven = n => n % 2 == 0;
var evens = Array.FindAll(new[] { 1, 2, 3, 4 }, isEven);`,
    explanation: "All three are delegate types. Predicate<T> communicates intent in filtering contexts. Func and Action accept up to 16 type parameters.",
  },
  {
    id: "cs-abstract-sealed",
    language: "csharp",
    title: "abstract vs sealed classes",
    tag: "classes",
    code: `// abstract: cannot be instantiated; forces subclasses to override abstract members.
abstract class Shape
{
    public abstract double Area();
    public string Describe() => $"area = {Area():F2}";
}

// sealed: cannot be subclassed — the JIT can devirtualise calls.
sealed class Circle : Shape
{
    public double Radius { get; init; }
    public override double Area() => Math.PI * Radius * Radius;
}

var c = new Circle { Radius = 5 };
Console.WriteLine(c.Describe());   // area = 78.54`,
    explanation: "abstract enforces the contract on subclasses; sealed closes the hierarchy. Seal leaf classes for performance and to prevent fragile-base-class problems.",
  },
  {
    id: "cs-mutex-semaphore",
    language: "csharp",
    title: "Mutex vs SemaphoreSlim",
    tag: "families",
    code: `using System.Threading;
using System.Threading.Tasks;

// SemaphoreSlim: lightweight, supports async, no OS kernel crossing.
// Best for limiting concurrency within a single process.
var slim = new SemaphoreSlim(initialCount: 2, maxCount: 2);

async Task AccessResource(int id)
{
    await slim.WaitAsync();
    try { Console.WriteLine($"{id} running"); await Task.Delay(50); }
    finally { slim.Release(); }
}

// Mutex: OS-level, cross-process, released by the same thread that acquired it.
// Use when you need cross-process mutual exclusion.
// using var mutex = new Mutex(false, "Global\\MyAppMutex");`,
    explanation: "SemaphoreSlim (async-compatible) for in-process concurrency limits; Mutex for cross-process synchronisation. SemaphoreSlim(1,1) is the modern async lock.",
  },
  {
    id: "cs-periodic-timer",
    language: "csharp",
    title: "PeriodicTimer — precise interval timer",
    tag: "families",
    code: `using System.Threading;
using System.Threading.Tasks;

// PeriodicTimer: async-friendly, accurate interval, cancellable.
async Task RunEverySecond(CancellationToken ct)
{
    using var timer = new PeriodicTimer(TimeSpan.FromSeconds(1));
    int tick = 0;
    while (await timer.WaitForNextTickAsync(ct))
    {
        Console.WriteLine($"tick {++tick}");
        if (tick >= 3) break;
    }
}

// vs System.Timers.Timer: event-based, harder to use with async.
// vs Task.Delay loop: drifts over time (delay starts AFTER work).`,
    explanation: "PeriodicTimer (NET 6+) is the modern choice for periodic work in async code. It fires at exact intervals regardless of how long the work takes.",
  },
  {
    id: "cs-httpclient-usage",
    language: "csharp",
    title: "HttpClient best practices",
    tag: "families",
    code: `using System.Net.Http;
using System.Net.Http.Json;

// Do NOT create a new HttpClient per request — socket exhaustion.
// Register as singleton or use IHttpClientFactory.
static readonly HttpClient _client = new();

async Task<User?> GetUser(int id)
{
    // GetFromJsonAsync: fetches + deserialises JSON in one call.
    return await _client.GetFromJsonAsync<User>($"https://api.example.com/users/{id}");
}

record User(int Id, string Name);

// In ASP.NET: use IHttpClientFactory to manage lifetime and DNS refresh.`,
    explanation: "HttpClient is meant to be long-lived and reused. Creating one per request causes port exhaustion. Use static instance or IHttpClientFactory in .NET DI.",
  },
  {
    id: "cs-records-positional",
    language: "csharp",
    title: "Records with positional parameters",
    tag: "classes",
    code: `// Positional record: compact syntax, generates constructor, Deconstruct, equality.
record Point(double X, double Y);

// You can mix positional and additional properties:
record Circle(double X, double Y, double Radius) : Point(X, Y)
{
    public double Area => Math.PI * Radius * Radius;
}

var c = new Circle(0, 0, 5);
Console.WriteLine(c.Area.ToString("F2"));   // 78.54

// Deconstruct into tuple:
var (x, y, r) = c;
Console.WriteLine($"{x}, {y}, r={r}");`,
    explanation: "Positional records auto-generate a constructor matching the parameter list and a Deconstruct method. Inheritance between positional records extends the parameter list.",
  },
  {
    id: "cs-record-interface",
    language: "csharp",
    title: "Record implementing interface",
    tag: "classes",
    code: `interface IShape { double Area(); }

record Circle(double Radius) : IShape
{
    public double Area() => Math.PI * Radius * Radius;
}

record Rectangle(double Width, double Height) : IShape
{
    public double Area() => Width * Height;
}

IShape[] shapes = { new Circle(5), new Rectangle(4, 6) };
double totalArea = shapes.Sum(s => s.Area());
Console.WriteLine(totalArea.ToString("F2"));   // 102.54`,
    explanation: "Records can implement interfaces — they're still reference types (record class). The auto-generated equality and with-expression work alongside interface dispatch.",
  },
  {
    id: "cs-abstract-record",
    language: "csharp",
    title: "Abstract record",
    tag: "classes",
    code: `// Abstract records can't be instantiated directly.
abstract record Shape(string Color)
{
    public abstract double Area();
    public string Describe() => $"{Color} shape, area={Area():F2}";
}

record Circle(string Color, double Radius) : Shape(Color)
{
    public override double Area() => Math.PI * Radius * Radius;
}

record Rectangle(string Color, double W, double H) : Shape(Color)
{
    public override double Area() => W * H;
}

Shape[] shapes = { new Circle("red", 3), new Rectangle("blue", 4, 5) };
foreach (var s in shapes) Console.WriteLine(s.Describe());`,
    explanation: "Abstract records combine the benefits of abstract classes (polymorphism, shared state) with records (value equality, with-expressions). Concrete subrecords inherit all record features.",
  },
  {
    id: "cs-nested-class",
    language: "csharp",
    title: "Nested types",
    tag: "classes",
    code: `class LinkedList<T>
{
    // Private nested type — implementation detail hidden from callers.
    private sealed class Node
    {
        public T Value { get; }
        public Node? Next { get; set; }
        public Node(T value) { Value = value; }
    }

    private Node? _head;

    public void Add(T value) => _head = new Node(value) { Next = _head };

    // Nested types can access private members of the outer class.
    public class Enumerator
    {
        internal Node? Current;
    }
}`,
    explanation: "Nested private types are an encapsulation tool — they're invisible to callers and can access all members of the outer class. Common for helper nodes, enumerators, and builders.",
  },
  {
    id: "cs-method-group",
    language: "csharp",
    title: "Method groups as delegates",
    tag: "classes",
    code: `// A method group can be converted to a compatible delegate without a lambda.
static int Double(int x) => x * 2;
static bool IsEven(int x) => x % 2 == 0;

int[] nums = { 1, 2, 3, 4, 5 };

// Method group — no lambda needed:
var doubled = nums.Select(Double);
var evens   = nums.Where(IsEven);

Console.WriteLine(string.Join(",", doubled));  // 2,4,6,8,10
Console.WriteLine(string.Join(",", evens));    // 2,4

// Event handler:
Action<string> log = Console.WriteLine;
log("method group");`,
    explanation: "Method groups are more performant than lambdas (no closure allocation) and often more readable when the method name explains the intent. Prefer them when the method already exists.",
  },
  {
    id: "cs-generic-interface",
    language: "csharp",
    title: "Generic interface",
    tag: "classes",
    code: `// A generic interface parameterises the contract.
interface IRepository<T, TId>
{
    T? GetById(TId id);
    IEnumerable<T> GetAll();
    void Save(T entity);
    void Delete(TId id);
}

class InMemoryUserRepo : IRepository<User, int>
{
    private readonly Dictionary<int, User> _store = new();
    public User? GetById(int id) => _store.GetValueOrDefault(id);
    public IEnumerable<User> GetAll() => _store.Values;
    public void Save(User u) => _store[u.Id] = u;
    public void Delete(int id) => _store.Remove(id);
}

record User(int Id, string Name);`,
    explanation: "Generic interfaces let you define patterns (repository, cache, factory) once and implement them for any type. Type constraints enforce what T can be.",
  },
  {
    id: "cs-covariant-return",
    language: "csharp",
    title: "Covariant return types (C# 9)",
    tag: "classes",
    code: `class Animal
{
    public virtual Animal Create() => new Animal();
    public string Kind => "Animal";
}

class Dog : Animal
{
    // C# 9+: override may return a MORE DERIVED type than the base.
    public override Dog Create() => new Dog();
    public new string Kind => "Dog";
}

Dog d = new Dog();
Dog pup = d.Create();   // Create() returns Dog without casting
Console.WriteLine(pup.Kind);   // Dog`,
    explanation: "Covariant return types let overrides return a more derived type. Before C# 9 you had to return Animal and cast. This reduces boilerplate in factory-method patterns.",
  },
  {
    id: "cs-interface-inherit",
    language: "csharp",
    title: "Interface inheritance",
    tag: "classes",
    code: `interface IReader
{
    string Read();
}

interface IWriter
{
    void Write(string value);
}

// IReadWriter combines both — useful for capabilities.
interface IReadWriter : IReader, IWriter
{
    void CopyTo(IWriter target) => target.Write(Read());   // default impl
}

class Buffer : IReadWriter
{
    private string _data = "";
    public string Read() => _data;
    public void Write(string value) => _data = value;
}`,
    explanation: "Interfaces can inherit from multiple interfaces. An implementing class must satisfy all members of the entire interface hierarchy.",
  },
  {
    id: "cs-base-call",
    language: "csharp",
    title: "base constructor and method calls",
    tag: "classes",
    code: `class Vehicle
{
    public string Brand { get; }
    public int Year { get; }

    public Vehicle(string brand, int year)
    {
        Brand = brand;
        Year  = year;
    }

    public virtual string Describe() => $"{Year} {Brand}";
}

class Car : Vehicle
{
    public int Doors { get; }

    // Call base constructor explicitly.
    public Car(string brand, int year, int doors) : base(brand, year)
    {
        Doors = doors;
    }

    public override string Describe() => $"{base.Describe()}, {Doors} doors";
}

Console.WriteLine(new Car("Tesla", 2024, 4).Describe());`,
    explanation: "Use : base(...) to call the parent constructor. Use base.Method() to call the overridden parent implementation from within an override.",
  },
  {
    id: "cs-virtual-chain",
    language: "csharp",
    title: "Virtual override chain",
    tag: "classes",
    code: `class A
{
    public virtual void Hello() => Console.WriteLine("A");
}

class B : A
{
    public override void Hello()
    {
        base.Hello();   // calls A.Hello()
        Console.WriteLine("B");
    }
}

class C : B
{
    public override void Hello()
    {
        base.Hello();   // calls B.Hello() — which calls A.Hello()
        Console.WriteLine("C");
    }
}

new C().Hello();   // A B C`,
    explanation: "Calling base.Hello() in each override creates a chain. Each link calls the next — useful for template method patterns where base behaviour runs before/after extension.",
  },
  {
    id: "cs-parallel-linq",
    language: "csharp",
    title: "PLINQ — parallel LINQ",
    tag: "families",
    code: `using System.Linq;

int[] data = Enumerable.Range(1, 1_000_000).ToArray();

// AsParallel() distributes work across CPU cores.
long sumOfSquares = data
    .AsParallel()
    .Where(n => n % 2 == 0)
    .Select(n => (long)(n * n))
    .Sum();

Console.WriteLine(sumOfSquares);

// Preserve order (slower):
var sorted = data.AsParallel().AsOrdered().Where(n => n % 7 == 0).ToArray();`,
    explanation: "PLINQ adds .AsParallel() to LINQ — partition the data across threads transparently. Best for CPU-bound operations on large collections. Not suitable for I/O-bound work.",
  },
  {
    id: "cs-linq-aggregate",
    language: "csharp",
    title: "LINQ Aggregate with seed",
    tag: "families",
    code: `string[] words = { "Hello", "world", "from", "LINQ" };

// Aggregate(seed, func): left fold starting from seed.
string sentence = words.Aggregate(
    seed: "",
    (acc, w) => acc.Length == 0 ? w : acc + " " + w);
Console.WriteLine(sentence);   // Hello world from LINQ

// With result selector:
int longestLen = words.Aggregate(0, (max, w) => Math.Max(max, w.Length));
Console.WriteLine(longestLen);   // 5`,
    explanation: "Aggregate is the general-purpose fold. For common aggregations (sum, max, concat), the dedicated LINQ methods are clearer. Use Aggregate when you need a custom accumulation step.",
  },
  {
    id: "cs-linq-join",
    language: "csharp",
    title: "LINQ Join",
    tag: "families",
    code: `var users = new[] {
    new { Id = 1, Name = "Ada" },
    new { Id = 2, Name = "Linus" },
};
var orders = new[] {
    new { UserId = 1, Item = "book" },
    new { UserId = 1, Item = "pen" },
    new { UserId = 2, Item = "keyboard" },
};

// Join: inner join on matching keys.
var result = users.Join(
    orders,
    u => u.Id,
    o => o.UserId,
    (u, o) => $"{u.Name} ordered {o.Item}");

foreach (var s in result) Console.WriteLine(s);`,
    explanation: "LINQ Join performs an inner join — only matched rows appear. For left joins use GroupJoin then SelectMany with DefaultIfEmpty. EF Core translates both to SQL.",
  },
  {
    id: "cs-stackalloc",
    language: "csharp",
    title: "stackalloc — stack-allocated arrays",
    tag: "types",
    code: `// stackalloc allocates an array on the STACK — zero GC overhead.
// Must be used with Span<T> or in unsafe context.
int size = 128;

// Safe version with Span<T>:
Span<int> buffer = stackalloc int[size];
for (int i = 0; i < size; i++) buffer[i] = i * i;
Console.WriteLine(buffer[10]);   // 100

// Only for small, fixed-size buffers — stack space is limited (~1MB).
// For large or variable-size data, use ArrayPool<T>.Shared.Rent() instead.`,
    explanation: "stackalloc avoids heap allocation entirely — the memory lives on the stack and is freed when the scope exits. Combine with Span<T> for safe access without unsafe code.",
  },
  {
    id: "cs-pinvoke-basics",
    language: "csharp",
    title: "P/Invoke basics",
    tag: "types",
    code: `using System.Runtime.InteropServices;

// [DllImport] maps a C# method to a native function.
class NativeMethods
{
    [DllImport("kernel32.dll", SetLastError = true)]
    static extern uint GetCurrentProcessId();

    // Modern alternative (C# 9+): LibraryImport (source-generated, AOT-safe)
    [LibraryImport("libc")]
    static partial int getpid();
}

// Always specify CharSet or use explicit string marshalling to avoid issues.
// Use SafeHandle for resource management in native interop.`,
    explanation: "[DllImport] calls functions in native DLLs/SOs. LibraryImport (C# 9+) is source-generated — safer for AOT compilation and no reflection. Always handle SetLastError for error reporting.",
  },
  {
    id: "cs-record-custom-ctor",
    language: "csharp",
    title: "Record with custom constructor and validation",
    tag: "classes",
    code: `record Email
{
    public string Value { get; }

    // Custom constructor — not the positional one.
    public Email(string value)
    {
        if (string.IsNullOrWhiteSpace(value) || !value.Contains('@'))
            throw new ArgumentException("invalid email", nameof(value));
        Value = value.ToLowerInvariant();
    }
}

var e = new Email("Ada@Example.COM");
Console.WriteLine(e.Value);   // ada@example.com
// new Email("not-an-email");   // ArgumentException`,
    explanation: "Records can have custom constructors for validation. The auto-generated primary constructor is skipped — you write your own body. Properties with init or get-only remain immutable.",
  },
  {
    id: "cs-interface-default-pitfall",
    language: "csharp",
    title: "Interface default method pitfall",
    tag: "caveats",
    code: `interface ILogger
{
    void Log(string msg);
    void LogError(string msg) => Log($"ERROR: {msg}");   // default impl
}

class MyLogger : ILogger
{
    public void Log(string msg) => Console.WriteLine(msg);
    // LogError is NOT overridden — uses the interface default.
}

MyLogger ml = new MyLogger();
// ml.LogError("oops");   // CS1061: MyLogger doesn't have LogError!
// Must use interface reference:
ILogger il = ml;
il.LogError("oops");   // ERROR: oops`,
    explanation: "Default interface methods are only accessible through an interface reference, not through the concrete type. This surprises people expecting inheritance-style access.",
  },
  {
    id: "cs-string-interning",
    language: "csharp",
    title: "String.Intern for memory savings",
    tag: "understanding",
    code: `// Literals are interned automatically.
string a = "hello";
string b = "hello";
Console.WriteLine(ReferenceEquals(a, b));   // True

// Dynamically created strings are NOT interned:
string c = new string("hello".ToCharArray());
Console.WriteLine(ReferenceEquals(a, c));   // False

// Force interning:
string d = string.Intern(c);
Console.WriteLine(ReferenceEquals(a, d));   // True

// string.IsInterned(s) returns the interned instance if it exists, or null.`,
    explanation: "String interning trades CPU (hash table lookup) for memory (de-duplication). Only worth it when you have many duplicate strings from runtime sources (e.g., parsed identifiers).",
  },
  {
    id: "cs-using-alias",
    language: "csharp",
    title: "using type alias (C# 12)",
    tag: "types",
    code: `// C# 12: 'using' aliases can refer to any type, including generics and tuples.
using Point       = (double X, double Y);
using IntMatrix   = int[][];
using StringDict  = System.Collections.Generic.Dictionary<string, string>;

Point p = (3.0, 4.0);
Console.WriteLine(p.X + p.Y);   // 7

var dict = new StringDict { ["key"] = "value" };
Console.WriteLine(dict["key"]);   // value

// Earlier C#: only 'using Foo = Some.Namespace.Type' — no generics or tuples.`,
    explanation: "Generic type aliases (C# 12) dramatically reduce verbosity for long generic types like Dictionary<string, List<int>>. They're file-scoped and don't create new types.",
  },
  {
    id: "cs-nullable-context",
    language: "csharp",
    title: "Nullable annotation context",
    tag: "types",
    code: `// Enable per-file:
#nullable enable

string  definite = "hello";   // non-nullable
string? maybe    = null;      // nullable

// Compiler warns if you dereference 'maybe' without null check:
// Console.WriteLine(maybe.Length);  // CS8602: dereference of possibly null

// Null-forgiving for cases you know are safe:
Console.WriteLine(maybe!.Length);   // suppresses warning, no runtime check

// Disable for a block:
#nullable disable
string legacy = null;   // no warning`,
    explanation: "#nullable enable / disable controls the nullable annotation context per file. In new projects, enable it globally in .csproj with <Nullable>enable</Nullable>.",
  },
  {
    id: "cs-factory-method",
    language: "csharp",
    title: "Factory method pattern",
    tag: "families",
    code: `abstract class Logger
{
    // Factory method — returns the right subtype.
    public static Logger Create(string type) => type switch
    {
        "console" => new ConsoleLogger(),
        "file"    => new FileLogger("/tmp/app.log"),
        _         => throw new ArgumentException($"unknown logger: {type}"),
    };

    public abstract void Log(string message);
}

class ConsoleLogger : Logger
{
    public override void Log(string msg) => Console.WriteLine(msg);
}

class FileLogger(string path) : Logger
{
    public override void Log(string msg) => System.IO.File.AppendAllText(path, msg + "\n");
}

Logger.Create("console").Log("hi");`,
    explanation: "Factory methods decouple creation from usage. Callers ask for a Logger by name and get the right implementation without depending on concrete types.",
  },
  {
    id: "cs-task-run-vs-async",
    language: "csharp",
    title: "Task.Run vs async method",
    tag: "families",
    code: `// Task.Run: offloads CPU-bound work to the thread pool.
async Task<int> CpuBoundAsync()
{
    return await Task.Run(() =>
    {
        int sum = 0;
        for (int i = 0; i < 1_000_000; i++) sum += i;
        return sum;
    });
}

// async method without Task.Run: right for I/O-bound work.
async Task<string> IoBoundAsync()
{
    await Task.Delay(100);   // I/O wait — no thread blocked
    return "done";
}

// Rule: use Task.Run for CPU-bound; don't use it for I/O-bound async methods.`,
    explanation: "Task.Run is necessary for CPU-bound work to avoid blocking the UI/request thread. I/O-bound async code naturally yields — no Task.Run needed, and adding it wastes a thread.",
  },
  {
    id: "cs-interface-segregation",
    language: "csharp",
    title: "Interface segregation principle",
    tag: "families",
    code: `// Fat interface: forces implementers to implement things they don't need.
// interface IBigWorker { void Read(); void Write(); void Delete(); void Admin(); }

// Segregated: each interface has one responsibility.
interface IReader  { string Read(); }
interface IWriter  { void Write(string data); }
interface IDeleter { void Delete(); }

// A read-only consumer only depends on what it needs.
class Viewer
{
    private readonly IReader _r;
    public Viewer(IReader r) { _r = r; }
    public void Show() => Console.WriteLine(_r.Read());
}

// An implementer can choose which interfaces to satisfy.
class ReadOnlyBuffer : IReader
{
    public string Read() => "buffer contents";
}`,
    explanation: "Interface segregation keeps contracts minimal. Clients depend only on methods they use — smaller interfaces are easier to implement, mock, and reason about.",
  },
  {
    id: "cs-blockingcollection",
    language: "csharp",
    title: "BlockingCollection<T>",
    tag: "structures",
    code: `using System.Collections.Concurrent;
using System.Threading.Tasks;

// BlockingCollection wraps a concurrent collection with blocking Add/Take.
var bc = new BlockingCollection<int>(boundedCapacity: 5);

// Producer:
Task.Run(() => {
    for (int i = 0; i < 10; i++) { bc.Add(i); }
    bc.CompleteAdding();   // signal that no more items will be added
});

// Consumer (blocks when empty, exits when completed and empty):
foreach (int item in bc.GetConsumingEnumerable())
    Console.Write(item + " ");`,
    explanation: "BlockingCollection provides bounded producer-consumer with blocking semantics. Prefer System.Threading.Channels for new async code — it has better performance and async support.",
  },
  {
    id: "cs-immutablearray",
    language: "csharp",
    title: "ImmutableArray<T>",
    tag: "structures",
    code: `using System.Collections.Immutable;

// ImmutableArray<T>: value-type wrapper around an immutable array.
// More efficient than ImmutableList<T> for random access.
var arr = ImmutableArray.Create(1, 2, 3, 4, 5);

// All operations return new instances:
var arr2 = arr.Add(6);
var arr3 = arr.SetItem(0, 99);

Console.WriteLine(string.Join(",", arr));    // 1,2,3,4,5
Console.WriteLine(string.Join(",", arr2));   // 1,2,3,4,5,6
Console.WriteLine(string.Join(",", arr3));   // 99,2,3,4,5`,
    explanation: "ImmutableArray<T> is a struct — no heap allocation for the wrapper itself. It's the best immutable collection for fixed data sets read many times across threads.",
  },
  {
    id: "cs-default-keyword",
    language: "csharp",
    title: "default literal and expression",
    tag: "understanding",
    code: `// 'default' returns the zero value for any type.
int     defaultInt  = default;    // 0
bool    defaultBool = default;    // false
string? defaultStr  = default;    // null

// Useful in generics:
T CreateDefault<T>() => default!;

// default(T) expression — explicit:
Console.WriteLine(default(int));      // 0
Console.WriteLine(default(DateTime)); // 01/01/0001 00:00:00`,
    explanation: "default returns 0 for numeric types, false for bool, null for reference types and nullable value types, and a zeroed struct for struct types. Essential in generic code.",
  },
  {
    id: "cs-expression-lambda",
    language: "csharp",
    title: "Statement lambda vs expression lambda",
    tag: "classes",
    code: `// Expression lambda: single expression — implicit return.
Func<int, int> square = x => x * x;

// Statement lambda: block body — explicit return needed.
Func<int, int> absValue = x =>
{
    if (x < 0) return -x;
    return x;
};

// Expression lambdas can be converted to Expression<Func<...>> (expression trees).
// Statement lambdas cannot — they can't be analysed as data.
System.Linq.Expressions.Expression<Func<int, int>> expr = x => x * x;   // OK
// System.Linq.Expressions.Expression<Func<int, int>> expr2 = x => { return x; }; // ERROR`,
    explanation: "Expression lambdas are preferred for LINQ and expression trees. Statement lambdas are needed for multi-line logic. Only expression lambdas can be used as expression trees.",
  },
  {
    id: "cs-value-task-when",
    language: "csharp",
    title: "When to use ValueTask",
    tag: "families",
    code: `// ValueTask avoids allocation when result is already known synchronously.
// Profile first — don't use it by default.

class Cache
{
    private readonly Dictionary<int, string> _data = new() { [1] = "cached" };

    // Often returns synchronously — ValueTask is a win.
    public ValueTask<string?> GetAsync(int id)
    {
        if (_data.TryGetValue(id, out var v))
            return ValueTask.FromResult<string?>(v);   // no allocation

        return new ValueTask<string?>(FetchFromDbAsync(id));
    }

    private Task<string?> FetchFromDbAsync(int id) => Task.FromResult<string?>(null);
}`,
    explanation: "ValueTask shines when the hot path is synchronous (cache hit). Only await a ValueTask once — it's not reusable like Task. Benchmark before switching.",
  },
  {
    id: "cs-record-sealed",
    language: "csharp",
    title: "sealed record",
    tag: "classes",
    code: `// Sealing a record prevents further inheritance.
record Point(double X, double Y);

sealed record NamedPoint(string Name, double X, double Y) : Point(X, Y);

// Sealing also affects equality: in unsealed records, equality is virtual —
// NamedPoint(Name=A, X=1, Y=2) != Point(1, 2) even though X and Y match.
// Sealing removes the virtual dispatch from generated Equals.

var p1 = new NamedPoint("origin", 0, 0);
var p2 = new NamedPoint("origin", 0, 0);
Console.WriteLine(p1 == p2);   // True`,
    explanation: "Sealing a record prevents subclassing and removes virtual dispatch from Equals/GetHashCode, giving a small performance benefit. Recommended for leaf record types.",
  },
  {
    id: "cs-scope-lifetime",
    language: "csharp",
    title: "DI lifetimes: Singleton vs Scoped vs Transient",
    tag: "families",
    code: `// ASP.NET Core DI lifetimes:
// Singleton: one instance for the entire application lifetime.
// Scoped: one instance per HTTP request.
// Transient: new instance every time it's resolved.

// builder.Services.AddSingleton<IEmailService, SmtpEmailService>();
// builder.Services.AddScoped<IDbContext, AppDbContext>();
// builder.Services.AddTransient<IValidator, OrderValidator>();

// Captive dependency bug: Singleton depending on Scoped is incorrect.
// The Singleton will hold a stale Scoped reference after the scope ends.`,
    explanation: "Choosing the right lifetime avoids bugs and memory leaks. Scoped suits request-level state (DbContext). Transient for stateless utilities. Never inject Scoped into Singleton.",
  },
  {
    id: "cs-semaphore-slim-async",
    language: "csharp",
    title: "SemaphoreSlim as async lock",
    tag: "structures",
    code: `using System.Threading;
using System.Threading.Tasks;

// lock() doesn't support async — use SemaphoreSlim(1,1) as an async mutex.
class DataStore
{
    private readonly SemaphoreSlim _lock = new(1, 1);
    private int _value = 0;

    public async Task<int> IncrementAsync()
    {
        await _lock.WaitAsync();
        try
        {
            _value++;
            await Task.Delay(1);   // simulate async work while holding lock
            return _value;
        }
        finally
        {
            _lock.Release();
        }
    }
}`,
    explanation: "lock() blocks the thread — never use it in async code. SemaphoreSlim(1,1) with await WaitAsync() is the async-safe mutex pattern.",
  },
  {
    id: "cs-discriminated-union",
    language: "csharp",
    title: "Simulating discriminated unions",
    tag: "types",
    code: `// C# doesn't have native DUs, but abstract records + switch exhaustively pattern-match.
abstract record Shape;
record Circle(double Radius)    : Shape;
record Rectangle(double W, double H) : Shape;
record Triangle(double Base, double H) : Shape;

double Area(Shape s) => s switch
{
    Circle   c => Math.PI * c.Radius * c.Radius,
    Rectangle r => r.W * r.H,
    Triangle  t => 0.5 * t.Base * t.H,
    _ => throw new NotImplementedException(),
};

Console.WriteLine(Area(new Circle(5)).ToString("F2"));     // 78.54
Console.WriteLine(Area(new Rectangle(4, 6)).ToString());   // 24`,
    explanation: "Abstract records with sealed subrecords behave like discriminated unions. The switch expression with exhaustive cases provides type-safe pattern matching without a separate library.",
  },
  {
    id: "cs-params-keyword",
    language: "csharp",
    title: "params — variable argument count",
    tag: "understanding",
    code: `// params lets a method accept any number of arguments as an array.
int Sum(params int[] numbers)
{
    int total = 0;
    foreach (var n in numbers) total += n;
    return total;
}

Console.WriteLine(Sum(1, 2, 3));         // 6
Console.WriteLine(Sum(10, 20));          // 30
Console.WriteLine(Sum());                // 0

// Can also pass an array directly:
int[] arr = { 5, 10, 15 };
Console.WriteLine(Sum(arr));             // 30`,
    explanation: "params must be the last parameter. Callers can pass any number of arguments without creating an array manually.",
  },
  {
    id: "cs-implicit-explicit-ops",
    language: "csharp",
    title: "implicit vs explicit conversion operators",
    tag: "types",
    code: `struct Celsius
{
    public double Value { get; init; }

    // Implicit: safe — no data loss, no need for a cast.
    public static implicit operator double(Celsius c) => c.Value;

    // Explicit: potentially lossy — caller must write a cast.
    public static explicit operator int(Celsius c) => (int)c.Value;
}

Celsius temp = new() { Value = 36.6 };
double d = temp;           // implicit — no cast needed
int i    = (int)temp;      // explicit — cast required
Console.WriteLine(d);      // 36.6
Console.WriteLine(i);      // 36`,
    explanation: "Use implicit for lossless widening conversions; explicit when truncation or precision loss is possible. Unexpected implicit conversions surprise callers.",
  },
  {
    id: "cs-static-ctor",
    language: "csharp",
    title: "Static constructor",
    tag: "classes",
    code: `class Config
{
    public static readonly string AppName;
    public static readonly int MaxConnections;

    // Static constructor: runs once, automatically, before first use.
    // No access modifier or parameters allowed.
    static Config()
    {
        AppName        = System.Reflection.Assembly.GetExecutingAssembly().GetName().Name ?? "App";
        MaxConnections = int.Parse(Environment.GetEnvironmentVariable("MAX_CONN") ?? "10");
        Console.WriteLine("Config initialised");
    }
}

// Access triggers the static constructor once:
Console.WriteLine(Config.AppName);`,
    explanation: "Static constructors initialise class-level state once before any instance is created or static member accessed. Exceptions in static ctors make the type permanently unusable.",
  },
  {
    id: "cs-yield-return",
    language: "csharp",
    title: "yield return — lazy sequences",
    tag: "classes",
    code: `// An iterator method: returns IEnumerable<T> but uses yield.
// Values are produced lazily — only when the caller requests them.
IEnumerable<int> EvenNumbers(int max)
{
    for (int i = 0; i <= max; i += 2)
    {
        Console.Write($"yielding {i} ");
        yield return i;
    }
}

// Nothing executes until we start consuming:
foreach (var n in EvenNumbers(6).Take(3))
    Console.Write($"got {n} | ");
// yielding 0 got 0 | yielding 2 got 2 | yielding 4 got 4 |`,
    explanation: "yield return pauses the method and resumes on the next iteration. The caller controls how many elements are consumed — perfect for pipelines and infinite sequences.",
  },
  {
    id: "cs-lazy-init",
    language: "csharp",
    title: "Lazy<T> — defer expensive initialisation",
    tag: "structures",
    code: `// Lazy<T> defers creation until first .Value access.
// Thread-safe by default (LazyThreadSafetyMode.ExecutionAndPublication).
var expensiveService = new Lazy<string>(() =>
{
    Console.WriteLine("initialising...");
    return "ServiceReady";
});

Console.WriteLine("before access");
Console.WriteLine(expensiveService.Value);   // initialising... ServiceReady
Console.WriteLine(expensiveService.Value);   // ServiceReady — cached, no re-init
Console.WriteLine(expensiveService.IsValueCreated);  // True`,
    explanation: "Lazy<T> is the canonical pattern for expensive singletons or startup-cost resources. The factory runs at most once; subsequent accesses return the cached value.",
  },
  {
    id: "cs-sortedset",
    language: "csharp",
    title: "SortedSet<T> — ordered unique values",
    tag: "structures",
    code: `var scores = new SortedSet<int> { 75, 50, 90, 60, 85 };

// Elements are always kept in sorted order.
Console.WriteLine(string.Join(",", scores));   // 50,60,75,85,90
Console.WriteLine(scores.Min);                 // 50
Console.WriteLine(scores.Max);                 // 90

// Subset range view:
var high = scores.GetViewBetween(80, 100);
Console.WriteLine(string.Join(",", high));     // 85,90

// O(log n) Add, Remove, Contains — backed by a red-black tree.`,
    explanation: "SortedSet<T> gives you sorted unique elements with O(log n) operations and range queries. Use it when you need ordering on top of set semantics.",
  },
  {
    id: "cs-concurrent-dict",
    language: "csharp",
    title: "ConcurrentDictionary<K,V>",
    tag: "structures",
    code: `using System.Collections.Concurrent;

var cache = new ConcurrentDictionary<string, int>();

// GetOrAdd: atomic read-or-create — no lock needed.
int v = cache.GetOrAdd("visits", _ => 0);

// AddOrUpdate: atomic update.
cache.AddOrUpdate("visits",
    addValue: 1,
    updateValueFactory: (key, old) => old + 1);

Console.WriteLine(cache["visits"]);   // 1

// TryGetValue, TryAdd, TryRemove — all thread-safe.`,
    explanation: "ConcurrentDictionary is safe for concurrent readers and writers. GetOrAdd and AddOrUpdate provide atomic patterns that replace lock+read+write boilerplate.",
  },
  {
    id: "cs-priority-queue",
    language: "csharp",
    title: "PriorityQueue<T,P> (C# 10)",
    tag: "structures",
    code: `// PriorityQueue<TElement, TPriority> — min-heap by default.
var pq = new PriorityQueue<string, int>();

pq.Enqueue("low",    10);
pq.Enqueue("urgent",  1);
pq.Enqueue("medium",  5);

// Dequeue always gives the item with the LOWEST priority number.
while (pq.Count > 0)
    Console.Write(pq.Dequeue() + " ");
// urgent medium low`,
    explanation: "PriorityQueue<TElement, TPriority> was added in .NET 6. It's a min-heap — lower priority values come out first. Pass a custom IComparer for max-heap behaviour.",
  },
  {
    id: "cs-readonly-list",
    language: "csharp",
    title: "IReadOnlyList and IReadOnlyCollection",
    tag: "families",
    code: `// IReadOnlyList<T>: indexed access without Add/Remove exposure.
// Expose internal lists as read-only to callers.
class Library
{
    private readonly List<string> _books = new() { "Dune", "1984" };

    // Callers can read and index but cannot mutate.
    public IReadOnlyList<string> Books => _books;
}

var lib = new Library();
Console.WriteLine(lib.Books[0]);     // Dune
Console.WriteLine(lib.Books.Count);  // 2
// lib.Books.Add("Foundation");      // compiler error — no Add on IReadOnlyList`,
    explanation: "Returning IReadOnlyList<T> prevents callers from mutating internal state without the cost of copying. The backing List<T> is still mutable internally.",
  },
  {
    id: "cs-event-delegate",
    language: "csharp",
    title: "Events and delegates",
    tag: "classes",
    code: `// Delegate: a type-safe function pointer.
// Event: a delegate field that can only be += / -= from outside the class.
class Button
{
    public event EventHandler? Clicked;

    public void Click()
    {
        Clicked?.Invoke(this, EventArgs.Empty);  // null-conditional invoke
    }
}

var btn = new Button();
btn.Clicked += (s, e) => Console.WriteLine("button clicked");
btn.Click();   // button clicked`,
    explanation: "Events enforce the publisher/subscriber pattern — external code can subscribe (+= ) and unsubscribe (-=) but can't clear all handlers or invoke directly.",
  },
  {
    id: "cs-extension-methods",
    language: "csharp",
    title: "Extension methods",
    tag: "classes",
    code: `// Extension methods add new methods to an existing type without subclassing.
// Must be in a static class; 'this' prefix marks the extended type.
public static class StringExtensions
{
    public static bool IsPalindrome(this string s)
    {
        string rev = new string(s.Reverse().ToArray());
        return s.Equals(rev, StringComparison.OrdinalIgnoreCase);
    }

    public static string Truncate(this string s, int max) =>
        s.Length <= max ? s : s[..max] + "...";
}

Console.WriteLine("racecar".IsPalindrome());   // True
Console.WriteLine("hello world".Truncate(5)); // hello...`,
    explanation: "Extension methods are syntactic sugar — they're static method calls. LINQ itself is built entirely from extension methods on IEnumerable<T>.",
  },
  {
    id: "cs-operator-overload",
    language: "csharp",
    title: "Operator overloading",
    tag: "classes",
    code: `readonly struct Money
{
    public decimal Amount { get; init; }
    public string  Currency { get; init; }

    // Overload + for natural arithmetic.
    public static Money operator +(Money a, Money b)
    {
        if (a.Currency != b.Currency) throw new InvalidOperationException("currency mismatch");
        return new Money { Amount = a.Amount + b.Amount, Currency = a.Currency };
    }

    public override string ToString() => $"{Amount} {Currency}";
}

var a = new Money { Amount = 10.50m, Currency = "USD" };
var b = new Money { Amount =  5.00m, Currency = "USD" };
Console.WriteLine(a + b);   // 15.50 USD`,
    explanation: "Operator overloading makes value-type domain models expressive. Keep operators intuitive — only overload when the semantics are obvious.",
  },
  {
    id: "cs-ctor-chaining",
    language: "csharp",
    title: "Constructor chaining with this()",
    tag: "classes",
    code: `class Connection
{
    public string Host { get; }
    public int    Port { get; }
    public bool   UseTls { get; }

    // Delegate to the most-specific constructor via 'this(...)'.
    public Connection(string host) : this(host, 5432) { }

    public Connection(string host, int port) : this(host, port, true) { }

    public Connection(string host, int port, bool useTls)
    {
        Host   = host;
        Port   = port;
        UseTls = useTls;
    }
}

var c = new Connection("db.example.com");
Console.WriteLine($"{c.Host}:{c.Port} tls={c.UseTls}");`,
    explanation: "Chaining constructors with this() avoids duplication. Always chain toward the most-specific constructor where the real initialisation logic lives.",
  },
  {
    id: "cs-interface-impl",
    language: "csharp",
    title: "Explicit interface implementation",
    tag: "classes",
    code: `interface IArea { double Area(); }
interface IPerimeter { double Perimeter(); }

class Square : IArea, IPerimeter
{
    public double Side { get; init; }

    // Explicit: only accessible through the interface type.
    double IArea.Area()           => Side * Side;
    double IPerimeter.Perimeter() => Side * 4;
}

var sq = new Square { Side = 5 };
// sq.Area()   — compiler error; not on the class surface
IArea ia = sq;
Console.WriteLine(ia.Area());   // 25`,
    explanation: "Explicit implementation hides the method from the class's public surface — useful for resolving name conflicts or keeping an interface's methods from cluttering the API.",
  },
  {
    id: "cs-partial-class",
    language: "csharp",
    title: "partial class",
    tag: "classes",
    code: `// A partial class splits the definition across multiple files.
// The compiler merges them at build time.

// File: User.cs
partial class User
{
    public string Name { get; set; } = "";
    public int    Age  { get; set; }
}

// File: User.Validation.cs
partial class User
{
    public bool IsValid() => !string.IsNullOrEmpty(Name) && Age is > 0 and < 150;
}

var u = new User { Name = "Ada", Age = 36 };
Console.WriteLine(u.IsValid());   // True`,
    explanation: "Partial classes are used by code generators (EF, WinForms, source generators) to keep generated code separate from hand-written code. Don't split by hand without a good reason.",
  },
  {
    id: "cs-indexer",
    language: "csharp",
    title: "Indexer property",
    tag: "classes",
    code: `// An indexer lets you use [] notation on a custom class.
class Matrix
{
    private readonly double[,] _data;
    public int Rows { get; }
    public int Cols { get; }

    public Matrix(int rows, int cols)
    {
        Rows = rows; Cols = cols;
        _data = new double[rows, cols];
    }

    public double this[int r, int c]
    {
        get => _data[r, c];
        set => _data[r, c] = value;
    }
}

var m = new Matrix(2, 2);
m[0, 0] = 1.0;
Console.WriteLine(m[0, 0]);   // 1`,
    explanation: "Indexers give custom types array-like access syntax. They can take any number and type of parameters — not just integers.",
  },
  {
    id: "cs-generic-constraints",
    language: "csharp",
    title: "Generic constraints (where T)",
    tag: "types",
    code: `// Constraints restrict what T can be, unlocking members of T.
T Max<T>(T a, T b) where T : IComparable<T>
    => a.CompareTo(b) >= 0 ? a : b;

Console.WriteLine(Max(3, 7));         // 7
Console.WriteLine(Max("apple", "z")); // z

// Common constraints:
// where T : class        — reference type only
// where T : struct       — value type only
// where T : new()        — has parameterless constructor
// where T : SomeBase     — inherits SomeBase
// where T : ISomeInterface`,
    explanation: "Constraints let you call interface methods on T without casting. Without constraints, T only exposes object's members.",
  },
  {
    id: "cs-nullable-ref",
    language: "csharp",
    title: "Nullable reference types (C# 8)",
    tag: "types",
    code: `// Enable with <Nullable>enable</Nullable> in .csproj.
// Now 'string' is non-nullable; 'string?' allows null.

string  definite = "hello";   // compiler ensures no null here
string? maybe    = null;      // nullable — must check before use

// The compiler warns if you dereference 'maybe' without a check.
if (maybe is not null)
    Console.WriteLine(maybe.Length);   // safe

Console.WriteLine(maybe?.Length);      // null-conditional — also safe
Console.WriteLine(maybe ?? "default"); // null-coalescing`,
    explanation: "Nullable reference types shift null-safety errors from runtime to compile time. Enable them in new projects; migrate old code file by file with #nullable enable.",
  },
  {
    id: "cs-enum-flags",
    language: "csharp",
    title: "[Flags] enum for bit masks",
    tag: "types",
    code: `[Flags]
enum Permission
{
    None  = 0,
    Read  = 1 << 0,   // 1
    Write = 1 << 1,   // 2
    Exec  = 1 << 2,   // 4
    All   = Read | Write | Exec,
}

Permission perm = Permission.Read | Permission.Write;

// HasFlag checks a single bit — more readable than & != 0.
Console.WriteLine(perm.HasFlag(Permission.Read));   // True
Console.WriteLine(perm.HasFlag(Permission.Exec));   // False
Console.WriteLine(perm);   // Read, Write — ToString formats nicely`,
    explanation: "[Flags] makes bitwise-combined enums behave correctly in ToString() and HasFlag(). Use powers of two for individual values.",
  },
  {
    id: "cs-value-tuple",
    language: "csharp",
    title: "ValueTuple vs Tuple",
    tag: "types",
    code: `// Tuple<T1, T2>: reference type, fields named Item1/Item2 — old API.
Tuple<int, string> old = Tuple.Create(1, "Ada");
Console.WriteLine(old.Item1);   // 1

// (T1, T2) ValueTuple: value type, named elements, cleaner syntax.
(int Id, string Name) person = (1, "Ada");
Console.WriteLine(person.Id);   // 1
Console.WriteLine(person.Name); // Ada

// Deconstruction:
var (id, name) = person;
Console.WriteLine($"{id}: {name}");   // 1: Ada`,
    explanation: "Always prefer ValueTuple — it's a struct (no heap allocation), supports element names, and has the clean tuple syntax. Tuple is the legacy type.",
  },
  {
    id: "cs-record-struct",
    language: "csharp",
    title: "record struct (C# 10)",
    tag: "types",
    code: `// record struct: value type with auto-generated Equals, GetHashCode, ToString.
record struct Point(double X, double Y);

var p1 = new Point(1.0, 2.0);
var p2 = new Point(1.0, 2.0);

Console.WriteLine(p1 == p2);     // True — value equality
Console.WriteLine(p1);           // Point { X = 1, Y = 2 }

// 'with' creates a copy with overrides (non-destructive mutation).
var p3 = p1 with { Y = 99.0 };
Console.WriteLine(p3);           // Point { X = 1, Y = 99 }

// Unlike record class: stored by value, no heap allocation.`,
    explanation: "record struct gets all the convenience of record (equality, ToString, with) with value-type semantics — no heap allocation, ideal for small coordinate-like types.",
  },
  {
    id: "cs-task-thread-parallel",
    language: "csharp",
    title: "Task vs Thread vs Parallel",
    tag: "families",
    code: `// Thread: OS-level thread — expensive, manual lifecycle.
var t = new System.Threading.Thread(() => Console.WriteLine("thread"));
t.Start(); t.Join();

// Task: logical unit of work on the thread pool — preferred for async.
await Task.Run(() => Console.WriteLine("task"));

// Parallel.For/ForEach: data parallelism over a collection.
Parallel.For(0, 4, i => Console.Write($"{i} "));  // 0 1 2 3 (any order)

// Rule: use Task for async I/O; Parallel for CPU-bound loops;
// Thread only when you need precise thread control.`,
    explanation: "Thread is raw OS threads; Task abstracts over the thread pool. Parallel.For auto-partitions work across cores — great for CPU-bound batch operations.",
  },
  {
    id: "cs-abstract-interface",
    language: "csharp",
    title: "abstract class vs interface",
    tag: "families",
    code: `// Interface: pure contract — no state, multiple implementations allowed.
interface IDrawable { void Draw(); }

// Abstract class: partial implementation — state, constructors, one base allowed.
abstract class Widget
{
    public string Id { get; } = Guid.NewGuid().ToString()[..8];
    protected abstract void Render();      // subclass must override
    public void Show() { Console.WriteLine($"Showing {Id}"); Render(); }
}

// A class can implement many interfaces but inherit only one abstract class.
class Button : Widget, IDrawable
{
    protected override void Render() => Console.WriteLine("rendering button");
    public void Draw() => Console.WriteLine("drawing button");
}`,
    explanation: "Use interfaces for contracts that multiple unrelated types should satisfy. Use abstract classes when you have shared implementation or state to provide.",
  },
  {
    id: "cs-struct-vs-class",
    language: "csharp",
    title: "struct vs class",
    tag: "families",
    code: `// struct (value type): copied on assignment, stack-allocated (usually).
// class (reference type): referenced, heap-allocated.

// struct: good for small, immutable data with no identity.
readonly struct Vector2 { public float X { get; init; } public float Y { get; init; } }

// class: good for objects with identity, lifecycle, or large state.
class Player { public string Name { get; set; } = ""; public int Score { get; set; } }

Vector2 a = new() { X = 1, Y = 2 };
Vector2 b = a;    // copy — independent
b = b with { X = 99 };
Console.WriteLine(a.X);   // 1 — unchanged`,
    explanation: "Small, immutable, frequently copied data benefits from struct semantics. If in doubt, use class — structs have subtle gotchas with mutability and boxing.",
  },
  {
    id: "cs-stringbuilder",
    language: "csharp",
    title: "StringBuilder vs string concat",
    tag: "families",
    code: `// String concat in a loop: O(n^2) — every + allocates a new string.
string s = "";
for (int i = 0; i < 5; i++) s += i;   // 5 allocations
Console.WriteLine(s);   // 01234

// StringBuilder: O(n) — amortised, single allocation at ToString().
var sb = new System.Text.StringBuilder();
for (int i = 0; i < 5; i++) sb.Append(i);
Console.WriteLine(sb.ToString());   // 01234

// For fewer than ~4 concatenations, simple + is fine.
// Use string.Concat / string.Join for array/list joining.`,
    explanation: "StringBuilder is a mutable char buffer that only allocates the final string. For loops of unknown length, always use it.",
  },
  {
    id: "cs-linq-first-single",
    language: "csharp",
    title: "First vs Single vs Find",
    tag: "families",
    code: `int[] nums = { 3, 1, 4, 1, 5, 9 };

// First: returns the first match — throws if none found.
Console.WriteLine(nums.First(n => n > 4));              // 5

// FirstOrDefault: returns default(T) (0 for int) if none found.
Console.WriteLine(nums.FirstOrDefault(n => n > 100));   // 0

// Single: throws if zero OR more than one match.
// SingleOrDefault: returns default if none; throws on multiple.

// List.Find: same as FirstOrDefault but on List<T>.
var list = new List<int>(nums);
Console.WriteLine(list.Find(n => n > 4));               // 5`,
    explanation: "First throws on empty sequences; FirstOrDefault returns default. Single asserts exactly one match — use it when more than one result would be a bug.",
  },
  {
    id: "cs-cancellationtoken",
    language: "csharp",
    title: "CancellationToken",
    tag: "classes",
    code: `async Task DoWorkAsync(CancellationToken ct)
{
    for (int i = 0; i < 10; i++)
    {
        ct.ThrowIfCancellationRequested();   // cooperative check point
        await Task.Delay(100, ct);           // also cancellable
        Console.Write($"{i} ");
    }
}

using var cts = new CancellationTokenSource();
cts.CancelAfter(250);   // cancel after 250ms

try { await DoWorkAsync(cts.Token); }
catch (OperationCanceledException) { Console.WriteLine("\ncancelled"); }`,
    explanation: "Cancellation is cooperative — you must check the token. Pass CancellationToken through your entire async call chain so cancellation propagates correctly.",
  },
  {
    id: "cs-lock-vs-monitor",
    language: "csharp",
    title: "lock vs Monitor",
    tag: "families",
    code: `// 'lock' is syntactic sugar for Monitor.Enter/Exit.
private readonly object _sync = new();

void SafeIncrement()
{
    lock (_sync)           // Monitor.Enter + try/finally Monitor.Exit
    {
        _count++;
    }
}

// Monitor gives more control:
bool acquired = System.Threading.Monitor.TryEnter(_sync, TimeSpan.FromMilliseconds(50));
if (acquired)
{
    try { _count++; }
    finally { System.Threading.Monitor.Exit(_sync); }
}`,
    explanation: "lock is almost always the right choice — it's safe, readable, and handles exceptions. Use Monitor directly only when you need timeout-based TryEnter.",
  },
  {
    id: "cs-span-usage",
    language: "csharp",
    title: "Span<T> — zero-copy slices",
    tag: "structures",
    code: `// Span<T> is a ref struct that wraps a contiguous memory region — no allocation.
int[] data = { 1, 2, 3, 4, 5 };

// Slice without allocating a new array:
Span<int> span = data.AsSpan(1, 3);   // wraps data[1..4]
span[0] = 99;                          // modifies the original array

Console.WriteLine(data[1]);            // 99

// Span works on arrays, stack memory, and unmanaged buffers.
// Cannot be stored in fields or heap — it's stack-only.`,
    explanation: "Span<T> is the modern way to slice arrays without allocation. It's key to high-performance parsing and buffer operations in .NET 5+.",
  },
  {
    id: "cs-arraypool",
    language: "csharp",
    title: "ArrayPool<T> — reuse buffers",
    tag: "structures",
    code: `using System.Buffers;

// Rent a buffer from the pool — avoids allocating a new array.
byte[] buffer = ArrayPool<byte>.Shared.Rent(1024);
try
{
    // buffer may be larger than requested — use the length you need.
    int bytesRead = FillBuffer(buffer, 1024);
    Process(buffer.AsSpan(0, bytesRead));
}
finally
{
    // Always return — clear: true scrubs sensitive data.
    ArrayPool<byte>.Shared.Return(buffer, clearArray: false);
}
static int FillBuffer(byte[] b, int n) { for (int i = 0; i < n; i++) b[i] = (byte)i; return n; }
static void Process(Span<byte> s) { }`,
    explanation: "ArrayPool<T> reduces GC pressure in high-throughput scenarios by reusing large arrays. Always return in a finally block; never use the buffer after returning.",
  },
  {
    id: "cs-linkedlist",
    language: "csharp",
    title: "LinkedList<T>",
    tag: "structures",
    code: `var list = new LinkedList<string>();
var node = list.AddFirst("middle");
list.AddBefore(node, "first");
list.AddAfter(node, "last");

// Traverse forward:
for (var n = list.First; n != null; n = n.Next)
    Console.Write(n.Value + " ");   // first middle last

// O(1) add/remove anywhere given a node reference.
list.Remove(node);

Console.WriteLine(list.Count);   // 2`,
    explanation: "LinkedList<T> gives O(1) insert/remove given a node. Unlike List<T>, no shifting. But random access is O(n) and cache performance is poor — use sparingly.",
  },
  {
    id: "cs-sorteddict",
    language: "csharp",
    title: "SortedDictionary<K,V>",
    tag: "structures",
    code: `// SortedDictionary: keys always in sorted order. O(log n) operations.
var freq = new SortedDictionary<char, int>();

foreach (char c in "banana")
    freq[c] = freq.GetValueOrDefault(c, 0) + 1;

// Iterates in key order:
foreach (var (ch, count) in freq)
    Console.WriteLine($"'{ch}': {count}");
// 'a': 3
// 'b': 1
// 'n': 2

// SortedDictionary: tree-backed, O(log n). vs Dictionary: hash-backed, O(1).`,
    explanation: "SortedDictionary is backed by a red-black tree — always sorted but O(log n) ops. Use when you need to iterate keys in order alongside dictionary semantics.",
  },
  {
    id: "cs-immutable-collections",
    language: "csharp",
    title: "ImmutableList<T>",
    tag: "structures",
    code: `using System.Collections.Immutable;

var original = ImmutableList.Create(1, 2, 3);

// All operations return a NEW list; original is unchanged.
var added   = original.Add(4);
var removed = original.Remove(2);

Console.WriteLine(string.Join(",", original));   // 1,2,3
Console.WriteLine(string.Join(",", added));      // 1,2,3,4
Console.WriteLine(string.Join(",", removed));    // 1,3

// Thread-safe reads without locks. Builder pattern for bulk mutations.`,
    explanation: "Immutable collections are safe to share across threads without locks. All mutations return new collections — structural sharing keeps it efficient.",
  },
  {
    id: "cs-object-pattern",
    language: "csharp",
    title: "Property patterns",
    tag: "snippet",
    code: `record Point(double X, double Y);

static string Classify(Point p) => p switch
{
    { X: 0, Y: 0 }      => "origin",
    { X: 0 }            => "on Y axis",
    { Y: 0 }            => "on X axis",
    { X: > 0, Y: > 0 }  => "quadrant I",
    { X: < 0, Y: > 0 }  => "quadrant II",
    _                   => "other",
};

Console.WriteLine(Classify(new Point(0, 0)));     // origin
Console.WriteLine(Classify(new Point(3, 4)));     // quadrant I
Console.WriteLine(Classify(new Point(-1, 2)));    // quadrant II`,
    explanation: "Property patterns match specific property values inside a switch expression. Combine with relational patterns (>, <, >=) for range conditions.",
  },
  {
    id: "cs-list-patterns",
    language: "csharp",
    title: "List patterns (C# 11)",
    tag: "snippet",
    code: `int[] Classify(int[] arr) => arr switch
{
    []             => throw new ArgumentException("empty"),
    [var x]        => [x * 2],               // single element
    [var h, ..var rest] => [h, ..rest, -1],   // head + rest
};

Console.WriteLine(string.Join(",", Classify([5])));        // 10
Console.WriteLine(string.Join(",", Classify([1, 2, 3])));  // 1,2,3,-1

// Match exact length and values:
bool IsPair(int[] a) => a is [_, _];   // exactly 2 elements`,
    explanation: "List patterns match on array/list structure: length, head, tail, and element values. Combined with slices (..) they handle parse-tree and argument-list scenarios cleanly.",
  },
  {
    id: "cs-raw-string",
    language: "csharp",
    title: "Raw string literals (C# 11)",
    tag: "snippet",
    code: `// At least three quotes on each side — no escape sequences needed.
string json = """
    {
        "name": "Ada",
        "age": 36
    }
    """;

Console.WriteLine(json);

// Interpolated raw string — double {{ for literal brace:
string name = "Linus";
string msg = $"""Hello, {name}! Use "" for quotes.""";
Console.WriteLine(msg);   // Hello, Linus! Use "" for quotes.`,
    explanation: "Raw strings eliminate backslash hell for embedded JSON, SQL, and regex. The indentation of the closing quotes sets the baseline — content to the right of it is kept.",
  },
  {
    id: "cs-file-scoped-ns",
    language: "csharp",
    title: "File-scoped namespace (C# 10)",
    tag: "snippet",
    code: `// Traditional namespace — adds one level of indentation.
// namespace MyApp.Models
// {
//     class User { }
// }

// File-scoped namespace (C# 10+): applies to the whole file, no braces.
namespace MyApp.Models;

class User
{
    public string Name { get; set; } = "";
}

// Saves horizontal space for the entire file.
// Only one file-scoped namespace per file is allowed.`,
    explanation: "File-scoped namespaces reduce indentation by one level across the entire file. Enabled by default in .NET 6+ templates.",
  },
  {
    id: "cs-top-level",
    language: "csharp",
    title: "Top-level statements (C# 9)",
    tag: "snippet",
    code: `// No class or Main method needed — the compiler generates them.
// Only one file per project may have top-level statements.

using System;

Console.WriteLine("Hello, World!");

string Greet(string name) => $"Hello, {name}!";
Console.WriteLine(Greet("Ada"));

// await works at top level too:
// await Task.Delay(10);`,
    explanation: "Top-level statements reduce ceremony for scripts, tools, and microservices. The entry-point class and Main() are generated by the compiler.",
  },
  {
    id: "cs-override-new",
    language: "csharp",
    title: "override vs new (method hiding)",
    tag: "caveats",
    code: `class Base
{
    public virtual  void VirtualMethod() => Console.WriteLine("Base.Virtual");
    public          void NonVirtual()    => Console.WriteLine("Base.NonVirtual");
}

class Derived : Base
{
    public override void VirtualMethod() => Console.WriteLine("Derived.Virtual");
    public new      void NonVirtual()    => Console.WriteLine("Derived.NonVirtual");
}

Base b = new Derived();
b.VirtualMethod();   // Derived.Virtual — runtime dispatch
b.NonVirtual();      // Base.NonVirtual — compile-time dispatch (hiding!)`,
    explanation: "'override' participates in polymorphism — the derived method is called through a base reference. 'new' hides the method — which version runs depends on the reference type.",
  },
  {
    id: "cs-covariance-array",
    language: "csharp",
    title: "Array covariance is unsafe",
    tag: "caveats",
    code: `// C# allows assigning a Derived[] to a Base[] — array covariance.
// This compiles but can throw at runtime!
string[] strings = { "hello", "world" };
object[] objects = strings;   // legal — covariant

try
{
    objects[0] = 42;   // ArrayTypeMismatchException at runtime!
}
catch (ArrayTypeMismatchException e)
{
    Console.WriteLine(e.Message);
}

// Use IReadOnlyList<object> or covariant generics (IEnumerable<out T>) instead.`,
    explanation: "Array covariance is a design mistake in early .NET — it looks safe but can throw at runtime. Prefer generic covariant interfaces which are checked by the compiler.",
  },
  {
    id: "cs-dispose-twice",
    language: "csharp",
    title: "Guard against double-dispose",
    tag: "caveats",
    code: `class ManagedResource : IDisposable
{
    private bool _disposed;

    public void Use()
    {
        ObjectDisposedException.ThrowIf(_disposed, this);
        Console.WriteLine("using resource");
    }

    public void Dispose()
    {
        if (_disposed) return;   // idempotent — safe to call twice
        _disposed = true;
        Console.WriteLine("resource disposed");
        GC.SuppressFinalize(this);
    }
}

var r = new ManagedResource();
r.Use();
r.Dispose();
r.Dispose();   // safe — no double-free`,
    explanation: "IDisposable.Dispose() should be idempotent — calling it multiple times must not throw. Set a _disposed flag and guard all public methods.",
  },
  {
    id: "cs-thread-sleep-delay",
    language: "csharp",
    title: "Thread.Sleep vs Task.Delay",
    tag: "caveats",
    code: `// Thread.Sleep BLOCKS the thread — the OS cannot reuse it.
// Avoid in async methods; it defeats the purpose of async.
// Thread.Sleep(500);   // wastes a thread for 500ms

// Task.Delay releases the thread back to the pool during the wait.
await Task.Delay(500);   // thread is free while waiting

// In a UI app, Thread.Sleep on the UI thread freezes the UI.
// await Task.Delay(500) keeps the UI responsive.`,
    explanation: "Thread.Sleep is a blocking call that holds a thread. Task.Delay is non-blocking — the thread returns to the pool and resumes when the delay elapses.",
  },
  {
    id: "cs-configureawait",
    language: "csharp",
    title: "ConfigureAwait(false)",
    tag: "caveats",
    code: `// By default, 'await' resumes on the original synchronisation context (e.g., UI thread).
// In library code, you usually don't need the original context.
// ConfigureAwait(false) tells the runtime: resume on any thread pool thread.

async Task<string> LibraryMethodAsync()
{
    // Avoids deadlocks in apps that have a SynchronizationContext.
    string data = await FetchAsync().ConfigureAwait(false);
    return data.ToUpper();
}

// App code (WPF, ASP.NET sync): ConfigureAwait(true) is default — keeps context.
static Task<string> FetchAsync() => Task.FromResult("hello");`,
    explanation: "Library code should use ConfigureAwait(false) to avoid deadlocks and improve performance. Application code typically wants the original context — leave it as default.",
  },
  {
    id: "cs-static-field-init",
    language: "csharp",
    title: "Static field initialisation order",
    tag: "caveats",
    code: `class Constants
{
    // Fields initialise top-to-bottom within the class.
    public static int A = 10;
    public static int B = A * 2;   // B = 20 — A is already initialised

    // Cross-type ordering is NOT guaranteed.
    // If TypeX depends on TypeY, and TypeY depends on TypeX, you get 0s.
}

Console.WriteLine(Constants.A);   // 10
Console.WriteLine(Constants.B);   // 20`,
    explanation: "Static fields initialise in declaration order within a class. Cross-class static dependencies are a source of subtle bugs — use lazy initialisation (Lazy<T>) for cross-class dependencies.",
  },
  {
    id: "cs-enum-cast",
    language: "csharp",
    title: "Unsafe enum casting",
    tag: "caveats",
    code: `enum Status { Active = 1, Inactive = 2 }

// C# allows casting any int to an enum — even invalid values.
Status s = (Status)99;
Console.WriteLine(s);               // 99 — not in the enum!
Console.WriteLine(s == (Status)99); // True

// Safe check with Enum.IsDefined:
int raw = 99;
bool valid = Enum.IsDefined(typeof(Status), raw);
Console.WriteLine(valid);   // False

// Or use Enum.TryParse for string input.`,
    explanation: "C# doesn't validate enum casts at runtime — you can hold an invalid value with no exception. Always validate external data with Enum.IsDefined or Enum.TryParse.",
  },
  {
    id: "cs-string-equals-methods",
    language: "csharp",
    title: "String equality methods compared",
    tag: "caveats",
    code: `string a = "Hello";
string b = new string("Hello".ToCharArray());   // different object, same value

// == for strings: calls string.Equals (value-based).
Console.WriteLine(a == b);                                    // True

// object.ReferenceEquals: identity — almost never what you want for strings.
Console.WriteLine(object.ReferenceEquals(a, b));             // False (may vary)

// .Equals with StringComparison: explicit culture/case control.
Console.WriteLine(a.Equals("hello", StringComparison.OrdinalIgnoreCase));  // True`,
    explanation: "String == in C# is value equality (unlike Java). Use StringComparison overloads for explicit culture/case control. Never rely on ReferenceEquals for string equality.",
  },
  {
    id: "cs-float-nan",
    language: "csharp",
    title: "NaN comparisons in C#",
    tag: "caveats",
    code: `double nan = double.NaN;

// NaN is never equal to anything, including itself.
Console.WriteLine(nan == nan);       // False
Console.WriteLine(nan != nan);       // True
Console.WriteLine(nan < 0);         // False
Console.WriteLine(nan > 0);         // False

// Correct check:
Console.WriteLine(double.IsNaN(nan));  // True

// float and double both have NaN; decimal does not.`,
    explanation: "NaN propagates silently through arithmetic. double.IsNaN() is the only reliable way to detect it. Avoid using NaN as a sentinel — use Nullable<double> instead.",
  },
  {
    id: "cs-int-overflow",
    language: "csharp",
    title: "Integer overflow wraps by default",
    tag: "caveats",
    code: `int max = int.MaxValue;   // 2147483647

// Unchecked (default): overflow wraps silently.
Console.WriteLine(max + 1);            // -2147483648

// Checked: throws OverflowException.
try
{
    Console.WriteLine(checked(max + 1));
}
catch (OverflowException)
{
    Console.WriteLine("overflow!");
}

// For big numbers, use long, BigInteger, or decimal.
var big = System.Numerics.BigInteger.Parse("99999999999999999999999");`,
    explanation: "C# defaults to unchecked arithmetic for speed. Enable /checked for debug builds or use checked{} blocks around safety-critical calculations.",
  },
  {
    id: "cs-ref-param",
    language: "csharp",
    title: "ref vs out vs in parameters",
    tag: "types",
    code: `// ref: two-way — must be initialised before passing.
void Double(ref int x) { x *= 2; }
int n = 5;
Double(ref n);
Console.WriteLine(n);   // 10

// out: output only — caller doesn't need to initialise; callee must assign.
bool TryParse(string s, out int result)
{
    result = 0;
    return int.TryParse(s, out result);
}
TryParse("42", out int val);
Console.WriteLine(val);   // 42

// in: read-only ref — avoids copying large structs, callee can't modify.
void Print(in Vector v) { Console.WriteLine(v.X); }`,
    explanation: "ref and out enable multiple return values without tuples. in avoids copying large structs without allowing mutation — the safest performance optimisation.",
  },
  {
    id: "cs-dynamic-type",
    language: "csharp",
    title: "dynamic — late binding",
    tag: "types",
    code: `// dynamic bypasses compile-time type checking. Resolved at runtime.
dynamic value = 42;
Console.WriteLine(value + 1);    // 43 — works

value = "hello";
Console.WriteLine(value.Length); // 5 — resolved at runtime

// Invalid member — throws RuntimeBinderException at runtime, not compile time.
try { Console.WriteLine(value.Nonexistent); }
catch (Microsoft.CSharp.RuntimeBinder.RuntimeBinderException e)
{
    Console.WriteLine($"runtime error: {e.Message}");
}`,
    explanation: "dynamic is useful for COM interop, scripting hosts, and consuming JSON without a model. Avoid it in general code — you lose compiler safety and IntelliSense.",
  },
  {
    id: "cs-primary-ctor",
    language: "csharp",
    title: "Primary constructors (C# 12)",
    tag: "snippet",
    code: `// Primary constructors put parameters directly in the class/struct header.
// Parameters are in scope throughout the class body.
class Point(double x, double y)
{
    public double X => x;
    public double Y => y;
    public double Distance => Math.Sqrt(x * x + y * y);
    public override string ToString() => $"({x}, {y})";
}

var p = new Point(3, 4);
Console.WriteLine(p.Distance);    // 5
Console.WriteLine(p);             // (3, 4)`,
    explanation: "Primary constructors reduce constructor boilerplate. The parameters are captured as fields automatically when used in member bodies. Available on both class and struct.",
  },
  {
    id: "cs-required-props",
    language: "csharp",
    title: "required properties (C# 11)",
    tag: "snippet",
    code: `class User
{
    // 'required' forces the caller to set this property in the object initializer.
    public required string Name  { get; init; }
    public required string Email { get; init; }
    public int Age { get; init; }   // optional
}

// Must set all required properties — compiler error otherwise.
var u = new User { Name = "Ada", Email = "ada@example.com" };
Console.WriteLine(u.Name);   // Ada

// new User() — CS9035: required member 'Name' not set`,
    explanation: "required forces callers to provide values via object initializers. It's the modern replacement for constructor parameters when you want named initialization syntax.",
  },
  {
    id: "cs-with-expression",
    language: "csharp",
    title: "'with' non-destructive copy",
    tag: "snippet",
    code: `record Point(int X, int Y);

var p1 = new Point(1, 2);

// 'with' creates a copy with specified fields overridden.
var p2 = p1 with { Y = 99 };
var p3 = p1 with { X = 10, Y = 10 };

Console.WriteLine(p1);   // Point { X = 1, Y = 2 }
Console.WriteLine(p2);   // Point { X = 1, Y = 99 }
Console.WriteLine(p3);   // Point { X = 10, Y = 10 }

// 'with' works on both records and structs (C# 10+).`,
    explanation: "The 'with' expression is how you 'update' an immutable record. It generates a clone with selected fields overridden — the original is untouched.",
  },
  {
    id: "cs-using-declaration",
    language: "csharp",
    title: "using declaration (C# 8)",
    tag: "snippet",
    code: `// Traditional: explicit scope with braces.
// using (var r = new StreamReader("file.txt")) { ... }

// Modern: 'using var' — disposed at end of the enclosing scope.
using var reader = new System.IO.StreamReader("/etc/hostname");
string content = reader.ReadToEnd();
Console.WriteLine(content.Trim());
// reader.Dispose() called here — at end of method/block`,
    explanation: "The brace-free using declaration is cleaner for the common case where you want the resource alive for the rest of the method. No extra nesting level needed.",
  },
  {
    id: "cs-discard",
    language: "csharp",
    title: "Discards with _",
    tag: "snippet",
    code: `// '_' (discard) signals you intentionally ignore a value.

// Ignore one element of a tuple:
var (x, _, z) = (1, 2, 3);
Console.WriteLine(x + z);   // 4

// Ignore out parameters you don't need:
int.TryParse("42", out _);

// Ignore return value explicitly (for readers):
_ = int.TryParse("42", out int parsed);

// Ignore the entire tuple:
(_, _) = (1, 2);`,
    explanation: "_ as a discard is syntactic intent documentation — 'I know there's a value here and I'm consciously ignoring it.' Better than unnamed variables or warnings.",
  },
  {
    id: "cs-is-var-pattern",
    language: "csharp",
    title: "var pattern matching",
    tag: "snippet",
    code: `// 'is var x' always matches and binds the value — like 'as' but works for value types.
object? value = GetValue();

if (value is var v)   // always true — v = value
    Console.WriteLine(v?.GetType().Name ?? "null");

// Useful in switch expressions to capture and guard:
string Describe(object? o) => o switch
{
    null    => "null",
    var x when x.GetType().IsPrimitive => $"primitive: {x}",
    var x   => $"object: {x.GetType().Name}",
};

static object? GetValue() => 42;
Console.WriteLine(Describe(42));     // primitive: 42
Console.WriteLine(Describe("hi"));   // object: String`,
    explanation: "The 'var' pattern always succeeds and binds the value to a new variable. It's mainly useful in switch expressions when you need a guard ('when') on an untyped value.",
  },
  {
    id: "cs-collection-spread",
    language: "csharp",
    title: "Collection expressions and spread (C# 12)",
    tag: "snippet",
    code: `// Collection expressions work for arrays, List<T>, Span<T>, and more.
int[]        arr  = [1, 2, 3, 4, 5];
List<string> list = ["hello", "world"];

// Spread operator '..' merges collections inline.
int[] first  = [1, 2, 3];
int[] second = [4, 5, 6];
int[] merged = [..first, ..second, 7, 8];

Console.WriteLine(string.Join(",", merged));   // 1,2,3,4,5,6,7,8`,
    explanation: "Collection expressions unify array/list literal syntax. The spread operator (..) replaces AddRange calls and Concat() for combining collections at construction time.",
  },
  {
    id: "cs-caller-attributes",
    language: "csharp",
    title: "[CallerMemberName] and friends",
    tag: "snippet",
    code: `using System.Runtime.CompilerServices;

void Log(string message,
    [CallerMemberName] string member = "",
    [CallerLineNumber] int    line   = 0,
    [CallerFilePath]   string file   = "")
{
    Console.WriteLine($"[{file}:{line} {member}] {message}");
}

void ProcessData()
{
    Log("starting");   // [Program.cs:12 ProcessData] starting
}

ProcessData();`,
    explanation: "CallerMemberName, CallerLineNumber, and CallerFilePath inject compile-time metadata. Used for logging, INotifyPropertyChanged, and diagnostics without manual string literals.",
  },
  {
    id: "cs-observable-pattern",
    language: "csharp",
    title: "INotifyPropertyChanged",
    tag: "classes",
    code: `using System.ComponentModel;
using System.Runtime.CompilerServices;

class ViewModel : INotifyPropertyChanged
{
    public event PropertyChangedEventHandler? PropertyChanged;

    private string _name = "";
    public string Name
    {
        get => _name;
        set
        {
            if (_name == value) return;
            _name = value;
            OnPropertyChanged();   // CallerMemberName fills in "Name"
        }
    }

    protected void OnPropertyChanged([CallerMemberName] string? name = null)
        => PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(name));
}`,
    explanation: "INotifyPropertyChanged is the standard data-binding contract in WPF, MAUI, and Blazor. CallerMemberName avoids hardcoding the property name string.",
  },
  {
    id: "cs-task-vs-valuetask",
    language: "csharp",
    title: "Task vs ValueTask",
    tag: "families",
    code: `// Task: always allocates a heap object. Fine for most I/O code.
async Task<int> FetchAsync() => await Task.FromResult(42);

// ValueTask: zero-allocation for synchronous fast paths.
// Useful when the method often returns a cached result.
private int _cached = 42;

async ValueTask<int> GetCachedAsync()
{
    if (_cached != 0) return _cached;   // synchronous — no allocation
    _cached = await FetchAsync();
    return _cached;
}

// Rule: return Task by default. Use ValueTask only after profiling shows allocation pressure.`,
    explanation: "ValueTask avoids a heap allocation when the method completes synchronously. The saving matters in cache-hot code paths called millions of times per second.",
  },
  {
    id: "cs-task-result-deadlock",
    language: "csharp",
    title: ".Result / .Wait() deadlock pattern",
    tag: "caveats",
    code: `// Calling .Result or .Wait() on a Task from a sync method with a SynchronizationContext
// can deadlock: the await inside needs to resume on the captured context,
// but the context is blocked waiting for the result.

// DEADLOCK in WPF / ASP.NET classic:
// string result = SomeAsyncMethod().Result;

// Safe options:
// 1. Make the caller async too (preferred)
// 2. Use ConfigureAwait(false) in the async method
// 3. Task.Run(() => SomeAsyncMethod()).Result — offload to thread pool

// Modern ASP.NET Core has no SynchronizationContext — less risk but still bad practice.`,
    explanation: ".Result blocks the current thread. In UI frameworks or classic ASP.NET the synchronisation context deadlocks. Propagate async upward or use GetAwaiter().GetResult() as last resort.",
  },
  {
    id: "cs-linq-select-many",
    language: "csharp",
    title: "LINQ SelectMany — flatten",
    tag: "families",
    code: `var departments = new[]
{
    new { Name = "Eng", Members = new[] { "Ada", "Linus" } },
    new { Name = "Ops", Members = new[] { "Grace", "Alan" } },
};

// SelectMany flattens one level: sequence of sequences → sequence.
var allMembers = departments.SelectMany(d => d.Members);
Console.WriteLine(string.Join(", ", allMembers));
// Ada, Linus, Grace, Alan

// Projection variant: access the outer element too.
var pairs = departments.SelectMany(d => d.Members, (d, m) => $"{m}/{d.Name}");
Console.WriteLine(string.Join(", ", pairs));
// Ada/Eng, Linus/Eng, Grace/Ops, Alan/Ops`,
    explanation: "SelectMany is the flatMap of C# — it transforms each element to a sequence then concatenates all sequences. Essential for one-to-many relationships.",
  },
  {
    id: "cs-await-foreach",
    language: "csharp",
    title: "await foreach — IAsyncEnumerable",
    tag: "classes",
    code: `using System.Collections.Generic;
using System.Threading.Tasks;

async IAsyncEnumerable<int> GenerateAsync()
{
    for (int i = 0; i < 5; i++)
    {
        await Task.Delay(10);   // simulate async data source
        yield return i;
    }
}

async Task Main()
{
    // await foreach consumes an IAsyncEnumerable asynchronously.
    await foreach (int n in GenerateAsync())
    {
        Console.Write(n + " ");   // 0 1 2 3 4
    }
}`,
    explanation: "IAsyncEnumerable<T> with await foreach is the async equivalent of IEnumerable with foreach. Used for streaming data from databases, files, and APIs.",
  },
  {
    id: "cs-channel",
    language: "csharp",
    title: "System.Threading.Channels",
    tag: "structures",
    code: `using System.Threading.Channels;
using System.Threading.Tasks;

// Channel: a thread-safe async producer-consumer queue.
var ch = Channel.CreateUnbounded<string>();

// Producer:
var producer = Task.Run(async () => {
    for (int i = 0; i < 3; i++) {
        await ch.Writer.WriteAsync($"msg-{i}");
    }
    ch.Writer.Complete();
});

// Consumer:
var consumer = Task.Run(async () => {
    await foreach (var msg in ch.Reader.ReadAllAsync())
        Console.WriteLine(msg);
});

await Task.WhenAll(producer, consumer);`,
    explanation: "Channels are the modern async equivalent of BlockingCollection. Use bounded channels (Channel.CreateBounded) for backpressure. The Writer/Reader separation enforces the producer/consumer contract.",
  },
  {
    id: "cs-memory-span",
    language: "csharp",
    title: "Memory<T> vs Span<T>",
    tag: "families",
    code: `// Span<T>: stack-only ref struct — fast, cannot be stored in fields or async methods.
// Memory<T>: heap-compatible wrapper — storable in fields and across await.

// Span<T> in synchronous code:
void ProcessSync(Span<int> data)
{
    data[0] = 99;  // modifies original
}

// Memory<T> for async:
async Task ProcessAsync(Memory<int> data)
{
    await Task.Delay(1);
    data.Span[0] = 99;   // access Span here
}

int[] arr = { 1, 2, 3 };
ProcessSync(arr.AsSpan());
await ProcessAsync(arr.AsMemory());
Console.WriteLine(arr[0]);   // 99`,
    explanation: "Span<T> can't be stored across await boundaries (stack-only). Memory<T> wraps the same data but is heap-compatible — use it when you need to pass buffer references into async methods.",
  },
  {
    id: "cs-sorted-list",
    language: "csharp",
    title: "SortedList<K,V> — sorted by key, indexed",
    tag: "structures",
    code: `// SortedList<K,V>: dictionary that maintains key order.
// Backed by parallel arrays — O(log n) search, O(n) insert for random keys.
var prices = new SortedList<string, decimal>
{
    ["banana"] = 0.5m,
    ["apple"]  = 1.0m,
    ["cherry"] = 3.0m,
};

// Iterates in key order:
foreach (var (name, price) in prices)
    Console.WriteLine($"{name}: {price:C}");

// Indexed access by position:
Console.WriteLine(prices.Keys[0]);       // apple — alphabetical first
Console.WriteLine(prices.Values[0]);     // 1.0`,
    explanation: "SortedList<K,V> provides both key lookup and positional access by index. Prefer SortedDictionary when you do many inserts/deletes; SortedList when you mostly read.",
  },
  {
    id: "cs-bitarray",
    language: "csharp",
    title: "BitArray — compact boolean flags",
    tag: "structures",
    code: `using System.Collections;

// BitArray stores booleans as packed bits — ~32x more memory-efficient than bool[].
var bits = new BitArray(8, false);   // 8 bits, all false
bits[0] = true;
bits[3] = true;
bits[7] = true;

// Bitwise operations on whole arrays:
var mask = new BitArray(8, false);
mask[0] = true;
mask[3] = true;

bits.And(mask);   // bits = bits AND mask

for (int i = 0; i < bits.Count; i++)
    Console.Write(bits[i] ? "1" : "0");   // 10010000 → 10000000`,
    explanation: "BitArray is the right tool when you need thousands of boolean flags and memory matters. Supports And, Or, Xor, Not operations on entire arrays at once.",
  },
  {
    id: "cs-objectpool",
    language: "csharp",
    title: "ObjectPool<T> for expensive objects",
    tag: "structures",
    code: `using Microsoft.Extensions.ObjectPool;

// ObjectPool reuses expensive objects instead of allocating new ones.
// Example: pool of StringBuilder instances.
var policy = new StringBuilderPooledObjectPolicy();
var pool   = new DefaultObjectPool<System.Text.StringBuilder>(policy, maximumRetained: 10);

for (int i = 0; i < 3; i++)
{
    var sb = pool.Get();       // borrow from pool
    try
    {
        sb.Append($"item-{i}");
        Console.WriteLine(sb.ToString());
    }
    finally
    {
        pool.Return(sb);       // return — clears and recycles
    }
}`,
    explanation: "ObjectPool reduces GC pressure for expensive-to-create objects. The pool resets each object before returning it. Incorrect use (returning objects that escape) causes subtle bugs.",
  },
  {
    id: "cs-reflection-basics",
    language: "csharp",
    title: "Reflection for type metadata",
    tag: "classes",
    code: `using System.Reflection;

class MyService
{
    public string Name { get; } = "service";
    public void DoWork(int count) { }
    private int _state = 0;
}

Type t = typeof(MyService);
Console.WriteLine(t.Name);   // MyService

// List public methods:
foreach (var m in t.GetMethods(BindingFlags.Public | BindingFlags.Instance | BindingFlags.DeclaredOnly))
    Console.WriteLine(m.Name);

// Read private field:
var instance = new MyService();
var field = t.GetField("_state", BindingFlags.NonPublic | BindingFlags.Instance);
Console.WriteLine(field?.GetValue(instance));   // 0`,
    explanation: "Reflection lets you inspect and invoke type members at runtime. BindingFlags control visibility — always narrow to the flags you need. Slow compared to direct calls; use source generators where possible.",
  },
  {
    id: "cs-typeof-vs-gettype",
    language: "csharp",
    title: "typeof vs GetType()",
    tag: "classes",
    code: `class Animal { }
class Dog : Animal { }

Animal a = new Dog();   // reference of type Animal, object of type Dog

// typeof: compile-time — the declared type.
Console.WriteLine(typeof(Animal));   // Animal

// GetType(): runtime — the actual object type.
Console.WriteLine(a.GetType());      // Dog

// Pattern matching for runtime type checks:
if (a is Dog d)
    Console.WriteLine($"it's a dog: {d}");

// Type equality:
Console.WriteLine(a.GetType() == typeof(Dog));      // True
Console.WriteLine(a.GetType() == typeof(Animal));   // False`,
    explanation: "typeof is evaluated at compile time; GetType() at runtime. For inheritance hierarchies, GetType() gives the concrete type. Use 'is' patterns for safe conditional downcasts.",
  },
  {
    id: "cs-custom-attribute",
    language: "csharp",
    title: "Custom attributes",
    tag: "classes",
    code: `[AttributeUsage(AttributeTargets.Method, AllowMultiple = false)]
class RetryAttribute : Attribute
{
    public int MaxAttempts { get; }
    public RetryAttribute(int maxAttempts = 3) { MaxAttempts = maxAttempts; }
}

class ApiClient
{
    [Retry(maxAttempts: 5)]
    public void FetchData() { /* ... */ }
}

// Read the attribute at runtime:
var method = typeof(ApiClient).GetMethod("FetchData")!;
var retry  = method.GetCustomAttribute<RetryAttribute>();
Console.WriteLine(retry?.MaxAttempts);   // 5`,
    explanation: "Custom attributes are metadata annotations read via reflection. They power test frameworks, serialisers, ORMs, and AOP proxies. [AttributeUsage] constrains where yours can appear.",
  },
  {
    id: "cs-obsolete-attr",
    language: "csharp",
    title: "[Obsolete] for deprecation",
    tag: "classes",
    code: `class Calculator
{
    // Warn callers at compile time.
    [Obsolete("Use AddNumbers(int a, int b) instead.")]
    public int Add(int a, int b) => a + b;

    // error: true makes using this a compile error, not just a warning.
    [Obsolete("This method is removed in v3.", error: true)]
    public int Subtract(int a, int b) => a - b;

    public int AddNumbers(int a, int b) => a + b;
}

var c = new Calculator();
// c.Add(1, 2);      // CS0618: warning
// c.Subtract(1, 2); // CS0619: error`,
    explanation: "[Obsolete] is the standard way to deprecate APIs. The error:true form is useful when you want a hard break to force migration before a major release.",
  },
  {
    id: "cs-expression-trees",
    language: "csharp",
    title: "Expression trees",
    tag: "understanding",
    code: `using System.Linq.Expressions;

// An Expression tree represents code as data — inspectable at runtime.
// LINQ providers (EF Core) translate expression trees to SQL.
Expression<Func<int, bool>> expr = x => x > 5;

// Inspect the tree:
var binary = (BinaryExpression)expr.Body;
Console.WriteLine(binary.NodeType);   // GreaterThan
Console.WriteLine(binary.Right);      // 5

// Compile and execute:
Func<int, bool> func = expr.Compile();
Console.WriteLine(func(10));   // True`,
    explanation: "Lambda expressions assigned to Expression<Func<...>> are expression trees — not compiled to IL but stored as data. LINQ providers traverse these trees to generate queries.",
  },
  {
    id: "cs-linq-deferred",
    language: "csharp",
    title: "LINQ deferred vs immediate execution",
    tag: "understanding",
    code: `var nums = new List<int> { 1, 2, 3, 4, 5 };

// Deferred: no execution yet — query is a description.
var query = nums.Where(n => { Console.Write($"f{n} "); return n % 2 == 0; });

Console.WriteLine("before iteration");
// f1 f2 f3 f4 f5 — printed during iteration, not before
foreach (var n in query) Console.Write($"got {n} | ");

// Immediate (forces execution now):
var list = query.ToList();    // ToList, ToArray, Count, First, etc.`,
    explanation: "LINQ queries are lazy descriptions. Execution happens when you enumerate — each time. Force immediate execution with ToList()/ToArray() when you want a snapshot or need to iterate multiple times.",
  },
  {
    id: "cs-async-state-machine",
    language: "csharp",
    title: "How async/await compiles",
    tag: "understanding",
    code: `// 'async' transforms the method into a state machine at compile time.
// Each 'await' point is a state transition.

async Task<string> FetchAsync(string url)
{
    // State 0: runs synchronously until here
    string result = await DownloadAsync(url);    // state 1
    // Resumes here after awaited task completes
    return result.ToUpper();                     // state 2: final
}

// The compiler generates roughly:
// class FetchAsync_StateMachine : IAsyncStateMachine { int _state; ... }
// No thread is blocked between state transitions.
static Task<string> DownloadAsync(string u) => Task.FromResult("data");`,
    explanation: "async/await is syntactic sugar for a state machine. No new thread is created — the method is split at await points and resumes when the awaited task completes.",
  },
  {
    id: "cs-value-type-interface",
    language: "csharp",
    title: "Value type boxing through interface",
    tag: "caveats",
    code: `interface ICounter { void Increment(); int Value { get; } }

struct Counter : ICounter
{
    public int Value { get; private set; }
    public void Increment() { Value++; }
}

ICounter c = new Counter();   // boxing! Counter copied to heap
c.Increment();
Console.WriteLine(c.Value);   // 1

Counter direct = new Counter();
direct.Increment();
Console.WriteLine(direct.Value);   // 1

// Mutating a struct through an interface modifies the BOXED copy on the heap,
// not the original stack variable (if there is one).`,
    explanation: "Assigning a struct to an interface boxes it — a copy goes to the heap. Mutations through the interface modify the boxed copy, not any local variable holding the original.",
  },
  {
    id: "cs-abstract-ctor-call",
    language: "csharp",
    title: "Don't call virtual members in constructors",
    tag: "caveats",
    code: `class Base
{
    public Base()
    {
        // BAD: virtual method called before Derived's ctor runs.
        // Derived's fields are at their default values (0, null).
        Init();
    }
    protected virtual void Init() => Console.WriteLine("Base.Init");
}

class Derived : Base
{
    private readonly string _name = "derived";
    protected override void Init() => Console.WriteLine($"Derived.Init: {_name}");
}

// new Derived() prints "Derived.Init: " — _name is null at that point!`,
    explanation: "Virtual method dispatch is active even in constructors. Overridden methods in derived classes run before the derived constructor, when derived fields are still at their defaults.",
  },
  {
    id: "cs-closure-this",
    language: "csharp",
    title: "Lambda capturing 'this'",
    tag: "caveats",
    code: `class Service
{
    private string _name = "my-service";

    public Func<string> GetNameGetter()
    {
        // This lambda captures 'this' implicitly.
        // If the Service is GC'd, the lambda keeps it alive.
        return () => _name;
    }

    public Func<string> GetNameGetterSafe()
    {
        string name = _name;       // copy the value, not 'this'
        return () => name;         // no 'this' captured
    }
}`,
    explanation: "Lambdas that access instance members capture 'this' — keeping the whole object alive as long as the lambda exists. Copy needed values to locals when the lambda's lifetime exceeds the object's.",
  },
  {
    id: "cs-generic-math",
    language: "csharp",
    title: "Generic math with INumber (C# 11)",
    tag: "types",
    code: `using System.Numerics;

// Generic math lets you write numeric algorithms that work on any numeric type.
T Sum<T>(IEnumerable<T> items) where T : INumber<T>
{
    T total = T.Zero;
    foreach (var item in items)
        total += item;
    return total;
}

Console.WriteLine(Sum(new int[]     { 1, 2, 3, 4 }));   // 10
Console.WriteLine(Sum(new double[]  { 1.5, 2.5 }));      // 4.0
Console.WriteLine(Sum(new decimal[] { 1.1m, 2.2m }));    // 3.3`,
    explanation: "INumber<T> (C# 11 / .NET 7) abstracts arithmetic operators. You can write one generic Sum, Average, or Lerp that works for int, double, float, decimal, etc.",
  },
  {
    id: "cs-static-abstract-interface",
    language: "csharp",
    title: "Static abstract interface members",
    tag: "types",
    code: `// Static abstract members let interfaces define static requirements.
// Used heavily by INumber<T> for operators.
interface IShape<TSelf> where TSelf : IShape<TSelf>
{
    static abstract TSelf Create(double size);
    double Area();
}

struct Circle : IShape<Circle>
{
    private double _r;
    public static Circle Create(double r) => new() { _r = r };
    public double Area() => Math.PI * _r * _r;
}

T MakeShape<T>(double size) where T : IShape<T> => T.Create(size);

var c = MakeShape<Circle>(5);
Console.WriteLine(c.Area().ToString("F1"));   // 78.5`,
    explanation: "Static abstract members (C# 11) allow generic code to call static methods and operators on type parameters. This is the mechanism behind INumber<T>'s + operator.",
  },
  {
    id: "cs-span-char",
    language: "csharp",
    title: "ReadOnlySpan<char> for string slicing",
    tag: "types",
    code: `// string is backed by char[] — AsSpan() creates a zero-copy view.
string text = "Hello, World!";

ReadOnlySpan<char> hello = text.AsSpan(0, 5);
Console.WriteLine(hello.ToString());   // Hello

// MemoryExtensions provides Span-compatible versions of string methods:
if (hello.Equals("hello", StringComparison.OrdinalIgnoreCase))
    Console.WriteLine("case-insensitive match");

// Splitting without allocating substrings:
foreach (var segment in text.AsSpan().Split(','))
    Console.WriteLine(segment.ToString().Trim());`,
    explanation: "ReadOnlySpan<char> lets you slice and search strings without allocating substrings. Used in parsers and hot paths where every allocation matters.",
  },
  {
    id: "cs-function-pointers",
    language: "csharp",
    title: "Function pointers (unsafe C# 9)",
    tag: "types",
    code: `// Function pointers are like delegates but stored as raw pointers — no object allocation.
// Require 'unsafe' context.
unsafe
{
    delegate*<int, int, int> add = &Add;
    Console.WriteLine(add(3, 4));   // 7

    delegate*<string, void> print = &Console.WriteLine;
    print("hello via function pointer");
}

static int Add(int a, int b) => a + b;`,
    explanation: "Function pointers are for high-performance P/Invoke and callback scenarios. They skip the delegate object allocation — useful in tight loops in unsafe code. Most code should use delegates.",
  },
  {
    id: "cs-covariant-generic",
    language: "csharp",
    title: "Generic covariance with out",
    tag: "types",
    code: `// IEnumerable<out T> is covariant: you can use IEnumerable<Derived>
// where IEnumerable<Base> is expected.
IEnumerable<string> strings = new[] { "hello", "world" };
IEnumerable<object> objects = strings;   // legal — covariant

foreach (var s in objects) Console.WriteLine(s);

// 'out' on a type parameter means it only appears in output position.
// You can read strings as objects — safe. Writing is not allowed.
// IList<string> → IList<object> is ILLEGAL — IList is invariant.`,
    explanation: "Covariance (out) allows safe upcasting of generic sequences. It works because you can only read — you can't accidentally write a non-string into what's actually a string list.",
  },
  {
    id: "cs-object-root",
    language: "csharp",
    title: "object is the root type",
    tag: "types",
    code: `// Every type in C# ultimately inherits from object (System.Object).
// object provides: Equals, GetHashCode, ToString, GetType.

int n = 42;
Console.WriteLine(n.GetType());          // System.Int32
Console.WriteLine(n.GetType().BaseType); // System.ValueType
Console.WriteLine(typeof(int).BaseType?.BaseType?.Name);  // Object

// ToString is overridable — always override in your own types.
// GetHashCode and Equals: if you override one, override both.`,
    explanation: "All types derive from object. This is why you can put any value in object? parameters and why ToString/Equals/GetHashCode exist on every type.",
  },
  {
    id: "cs-readonly-struct",
    language: "csharp",
    title: "readonly struct",
    tag: "types",
    code: `// readonly struct guarantees immutability — the compiler enforces it.
// Also enables copy-elision: callers can pass by ref to avoid copying.
readonly struct Vector2
{
    public float X { get; init; }
    public float Y { get; init; }

    public float Length => MathF.Sqrt(X * X + Y * Y);

    public Vector2 Normalise()
    {
        float len = Length;
        return new Vector2 { X = X / len, Y = Y / len };
    }
}

var v = new Vector2 { X = 3, Y = 4 };
Console.WriteLine(v.Length);   // 5`,
    explanation: "readonly struct is safer and faster than a mutable struct — the compiler prevents accidental mutation and can pass defensive copies by reference instead of by value.",
  },
  {
    id: "cs-nint-type",
    language: "csharp",
    title: "nint and nuint — native-size integers",
    tag: "types",
    code: `// nint/nuint are pointer-sized integers: 32-bit on 32-bit OS, 64-bit on 64-bit.
// Use for interop, offsets, and low-level pointer arithmetic.
nint  offset = 100;
nuint size   = (nuint)sizeof(int);

Console.WriteLine($"pointer size: {sizeof(nint)} bytes");
// 8 on 64-bit; 4 on 32-bit

// nint can hold an IntPtr value:
nint ptr = nint.Zero;`,
    explanation: "nint/nuint (C# 9) replace IntPtr/UIntPtr for most interop scenarios with cleaner arithmetic. The compiler maps them to the platform's native integer type.",
  },
  {
    id: "cs-generic-class",
    language: "csharp",
    title: "Generic class",
    tag: "classes",
    code: `// A generic class parameterises over one or more types.
class Stack<T>
{
    private readonly List<T> _items = new();

    public void Push(T item) => _items.Add(item);

    public T Pop()
    {
        if (_items.Count == 0) throw new InvalidOperationException("empty");
        var item = _items[^1];
        _items.RemoveAt(_items.Count - 1);
        return item;
    }

    public int Count => _items.Count;
}

var s = new Stack<string>();
s.Push("hello"); s.Push("world");
Console.WriteLine(s.Pop());   // world`,
    explanation: "Generic classes let you write type-safe data structures once and use them with any type. The type argument is checked at compile time — no casting needed.",
  },
  {
    id: "cs-generic-method",
    language: "csharp",
    title: "Generic method",
    tag: "classes",
    code: `// Generic methods can infer T from the argument — no need to specify explicitly.
T[] Repeat<T>(T value, int count)
{
    var arr = new T[count];
    Array.Fill(arr, value);
    return arr;
}

int[]    fives  = Repeat(5, 4);          // T inferred as int
string[] greets = Repeat("hi", 3);      // T inferred as string

Console.WriteLine(string.Join(",", fives));    // 5,5,5,5
Console.WriteLine(string.Join(",", greets));   // hi,hi,hi`,
    explanation: "Generic methods allow type-safe utility functions that work on any type. Type inference means callers rarely need to spell out the type argument.",
  },
  {
    id: "cs-disposable-pattern",
    language: "csharp",
    title: "Full IDisposable pattern",
    tag: "classes",
    code: `class ManagedResource : IDisposable
{
    private bool _disposed;
    private readonly System.IO.Stream _stream;

    public ManagedResource(string path)
        => _stream = System.IO.File.OpenRead(path);

    public void Use() { ObjectDisposedException.ThrowIf(_disposed, this); }

    // Called by 'using' or explicit Dispose().
    public void Dispose()
    {
        Dispose(disposing: true);
        GC.SuppressFinalize(this);  // prevent finaliser from running
    }

    protected virtual void Dispose(bool disposing)
    {
        if (_disposed) return;
        if (disposing) _stream.Dispose();   // free managed resources
        _disposed = true;
    }
}`,
    explanation: "The full pattern distinguishes managed and unmanaged resources. GC.SuppressFinalize avoids the finaliser queue penalty when Dispose has already cleaned up.",
  },
  {
    id: "cs-fluent-builder",
    language: "csharp",
    title: "Fluent builder pattern",
    tag: "classes",
    code: `class QueryBuilder
{
    private string _table = "";
    private readonly List<string> _conditions = new();
    private int _limit = 100;

    public QueryBuilder From(string table)    { _table = table; return this; }
    public QueryBuilder Where(string cond)    { _conditions.Add(cond); return this; }
    public QueryBuilder Limit(int n)          { _limit = n; return this; }

    public string Build()
    {
        var where = _conditions.Count > 0 ? $" WHERE {string.Join(" AND ", _conditions)}" : "";
        return $"SELECT * FROM {_table}{where} LIMIT {_limit}";
    }
}

string sql = new QueryBuilder()
    .From("users")
    .Where("age > 18")
    .Where("active = 1")
    .Limit(10)
    .Build();
Console.WriteLine(sql);`,
    explanation: "Each builder method returns 'this', enabling method chaining. Fluent builders are readable for complex object construction — especially DSLs and query builders.",
  },
  {
    id: "cs-static-class",
    language: "csharp",
    title: "static class",
    tag: "classes",
    code: `// A static class cannot be instantiated and contains only static members.
// Use for utility/helper functions and extension methods.
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

Console.WriteLine(MathUtils.Clamp(150, 0, 100));   // 100
Console.WriteLine(MathUtils.IsPrime(17));           // True`,
    explanation: "Static classes can't be subclassed or instantiated — the compiler enforces this. They're the right home for stateless utility functions and extension methods.",
  },
  {
    id: "cs-iterator-class",
    language: "csharp",
    title: "Implementing IEnumerable with yield",
    tag: "classes",
    code: `class NumberRange : IEnumerable<int>
{
    private readonly int _start, _end, _step;

    public NumberRange(int start, int end, int step = 1)
    {
        _start = start; _end = end; _step = step;
    }

    public IEnumerator<int> GetEnumerator()
    {
        for (int i = _start; i <= _end; i += _step)
            yield return i;
    }

    System.Collections.IEnumerator System.Collections.IEnumerable.GetEnumerator()
        => GetEnumerator();
}

foreach (var n in new NumberRange(0, 10, 2))
    Console.Write(n + " ");   // 0 2 4 6 8 10`,
    explanation: "Implementing IEnumerable<T> with yield return makes any class work with foreach, LINQ, and spread operators without manually writing an enumerator class.",
  },
  {
    id: "cs-dict-vs-lookup",
    language: "csharp",
    title: "Dictionary vs ILookup",
    tag: "families",
    code: `using System.Linq;

var people = new[] {
    new { Name = "Ada",   Dept = "Eng" },
    new { Name = "Linus", Dept = "Eng" },
    new { Name = "Grace", Dept = "Ops" },
};

// ILookup<K,V>: read-only multi-value map. Missing key returns empty sequence.
ILookup<string, string> byDept = people.ToLookup(p => p.Dept, p => p.Name);

foreach (var name in byDept["Eng"])
    Console.WriteLine(name);   // Ada, Linus
Console.WriteLine(byDept["Missing"].Count());   // 0 — no exception`,
    explanation: "ILookup is the immutable, multi-value version of Dictionary. Missing keys return empty sequences rather than throwing — much safer for unknown grouping keys.",
  },
  {
    id: "cs-record-vs-class",
    language: "csharp",
    title: "record vs class",
    tag: "families",
    code: `// class: reference equality (same object), mutable by default.
class PointClass { public int X { get; set; } public int Y { get; set; } }

// record: value equality (same fields), with-expression, immutable init.
record PointRecord(int X, int Y);

var c1 = new PointClass { X = 1, Y = 2 };
var c2 = new PointClass { X = 1, Y = 2 };
Console.WriteLine(c1 == c2);   // False — reference equality

var r1 = new PointRecord(1, 2);
var r2 = new PointRecord(1, 2);
Console.WriteLine(r1 == r2);   // True — value equality`,
    explanation: "Records are designed for immutable data — value equality, with-expressions, and readable ToString are generated automatically. Use records for DTOs, events, and config objects.",
  },
  {
    id: "cs-exception-types",
    language: "csharp",
    title: "Exception class hierarchy",
    tag: "families",
    code: `// BaseException → Exception → SystemException → (specific types)
//                         └─ ApplicationException (avoid — legacy)

// Catch the most specific type first.
try
{
    int.Parse("not a number");
}
catch (FormatException fe)
{
    Console.WriteLine($"Format: {fe.Message}");
}
catch (OverflowException oe)
{
    Console.WriteLine($"Overflow: {oe.Message}");
}
catch (Exception e)   // catchall — last resort
{
    Console.WriteLine($"Unexpected: {e.GetType().Name}");
}`,
    explanation: "Catch specific exceptions before generic ones. Never swallow Exception without logging. ApplicationException was meant for user exceptions but the convention never caught on.",
  },
  {
    id: "cs-stream-types",
    language: "csharp",
    title: "Stream hierarchy",
    tag: "families",
    code: `// Stream: abstract base — Read, Write, Seek.
// FileStream: reads/writes a file on disk.
// MemoryStream: in-memory buffer — useful for testing.
// NetworkStream: TCP socket I/O.
// GZipStream: compresses/decompresses another stream (decorator).

using var ms = new System.IO.MemoryStream();
using var writer = new System.IO.StreamWriter(ms);
writer.Write("hello");
writer.Flush();

ms.Position = 0;
using var reader = new System.IO.StreamReader(ms);
Console.WriteLine(reader.ReadToEnd());   // hello`,
    explanation: "Streams compose via the decorator pattern — wrap a FileStream in a GZipStream in a StreamReader to read gzip-compressed text files line by line.",
  },
  {
    id: "cs-array-vs-span",
    language: "csharp",
    title: "Array vs Span<T> for slicing",
    tag: "families",
    code: `int[] data = Enumerable.Range(0, 100).ToArray();

// Slice with array: allocates a new array.
int[] slice1 = data[10..20];   // new allocation

// Slice with Span: zero-copy — wraps the original.
Span<int> span = data.AsSpan(10, 10);

// Both allow indexing and mutation.
span[0] = 99;
Console.WriteLine(data[10]);   // 99 — span writes to original

// Span can't be stored on the heap — stack-only ref struct.`,
    explanation: "Span<T> slicing is allocation-free — ideal for parsing and processing sub-ranges of large buffers. Array slicing always allocates a copy.",
  },
  {
    id: "cs-default-interface",
    language: "csharp",
    title: "Default interface methods (C# 8)",
    tag: "classes",
    code: `interface ILogger
{
    void Log(string message);

    // Default implementation — classes get this for free.
    void LogError(string message) => Log($"[ERROR] {message}");
    void LogInfo(string message)  => Log($"[INFO]  {message}");
}

class ConsoleLogger : ILogger
{
    public void Log(string message) => Console.WriteLine(message);
    // LogError and LogInfo are inherited for free.
}

ILogger log = new ConsoleLogger();
log.LogError("something failed");   // [ERROR] something failed
log.LogInfo("app started");         // [INFO]  app started`,
    explanation: "Default interface methods let you add methods to an interface without breaking existing implementations. Useful for evolving library interfaces backwards-compatibly.",
  },
  {
    id: "cs-generic-covariance",
    language: "csharp",
    title: "IEnumerable<T> covariance",
    tag: "understanding",
    code: `// IEnumerable<out T> is declared covariant — T only appears in output.
// So IEnumerable<string> is assignable to IEnumerable<object>.
IEnumerable<string> names = new[] { "Ada", "Linus" };
IEnumerable<object> items = names;   // covariant assignment

foreach (object o in items)
    Console.WriteLine(o);

// IList<T> is NOT covariant — T appears in both input (Add) and output.
// IList<string> → IList<object> is a compile error.`,
    explanation: "Covariance requires the type parameter to appear only in output positions (return types). Output-only guarantees you can't write an incompatible type into the sequence.",
  },
  {
    id: "cs-boxing-perf",
    language: "csharp",
    title: "Boxing cost in benchmarks",
    tag: "understanding",
    code: `// Every boxing operation allocates a new heap object — triggers GC.
// In a tight loop this is measurable.

// BAD: List<object> boxes every int.
var boxed = new System.Collections.ArrayList();
for (int i = 0; i < 1_000_000; i++) boxed.Add(i);   // 1M allocations

// GOOD: List<int> — no boxing.
var typed = new List<int>(1_000_000);
for (int i = 0; i < 1_000_000; i++) typed.Add(i);   // no boxing`,
    explanation: "Non-generic collections box every value type. Modern .NET code should use generic collections exclusively. boxing-aware patterns matter in hot paths.",
  },
  {
    id: "cs-string-pool",
    language: "csharp",
    title: "String interning",
    tag: "understanding",
    code: `// The runtime maintains a string pool. Literals are interned automatically.
string a = "hello";
string b = "hello";
Console.WriteLine(object.ReferenceEquals(a, b));   // True — same pooled object

// Dynamically constructed strings are NOT interned by default.
string c = new string("hello".ToCharArray());
Console.WriteLine(object.ReferenceEquals(a, c));   // False

// Force interning with string.Intern:
string d = string.Intern(c);
Console.WriteLine(object.ReferenceEquals(a, d));   // True`,
    explanation: "String interning means two equal literal strings are the same object in memory. Use string.Intern() only when you have many duplicate strings and memory pressure matters.",
  },
  {
    id: "cs-yield-lazy",
    language: "csharp",
    title: "yield return is truly lazy",
    tag: "understanding",
    code: `IEnumerable<int> Produce()
{
    Console.WriteLine("before first yield");
    yield return 1;
    Console.WriteLine("between yields");
    yield return 2;
    Console.WriteLine("after last yield");
}

// Nothing runs until enumeration starts:
var seq = Produce();
Console.WriteLine("created");

// Each MoveNext() runs until the next yield:
foreach (var x in seq.Take(1))
    Console.Write(x + " ");
// created, before first yield, 1`,
    explanation: "Iterator methods run only as far as the next yield return on each MoveNext() call. Code after the last yield runs only if the caller requests that final element.",
  },
  {
    id: "cs-interface-diamond",
    language: "csharp",
    title: "Diamond problem with interfaces",
    tag: "understanding",
    code: `interface IShape { string Name(); }
interface ICircle : IShape { new string Name() => "circle"; }   // default impl
interface IColorful : IShape { new string Name() => "colorful"; }

// Both ICircle and IColorful have a Name() default — ambiguous!
// C# requires explicit resolution.
class ColoredCircle : ICircle, IColorful
{
    // Must override to resolve the ambiguity:
    public string Name() => "colored circle";
}

IShape s = new ColoredCircle();
Console.WriteLine(s.Name());   // colored circle`,
    explanation: "Default interface methods can create diamond ambiguity. C# requires the implementing class to override and resolve conflicting defaults explicitly.",
  },
  {
    id: "cs-pattern-decons",
    language: "csharp",
    title: "Deconstruct in pattern matching",
    tag: "snippet",
    code: `record Point(double X, double Y);

string Classify(Point p) => p switch
{
    (0, 0)          => "origin",
    (var x, 0)      => $"on x-axis at {x}",
    (0, var y)      => $"on y-axis at {y}",
    (var x, var y) when x == y => $"on diagonal at {x}",
    _               => "general position",
};

Console.WriteLine(Classify(new Point(0, 0)));     // origin
Console.WriteLine(Classify(new Point(3, 0)));     // on x-axis at 3
Console.WriteLine(Classify(new Point(5, 5)));     // on diagonal at 5`,
    explanation: "Positional patterns use the Deconstruct method (auto-generated for records) to match on tuple-shaped decomposition of an object.",
  },
  {
    id: "cs-span-readonlyspan",
    language: "csharp",
    title: "Span<T> vs ReadOnlySpan<T>",
    tag: "types",
    code: `// Span<T> — slice of contiguous memory, stack-only, no GC pressure.
int[] arr = [1, 2, 3, 4, 5];
Span<int> span = arr.AsSpan(1, 3);   // [2, 3, 4]
span[0] = 99;                         // mutates original arr
Console.WriteLine(arr[1]);            // 99

// ReadOnlySpan<T> — same but immutable.
ReadOnlySpan<char> text = "Hello World".AsSpan();
ReadOnlySpan<char> word = text[..5];  // "Hello"
Console.WriteLine(word.ToString());   // Hello`,
    explanation: "Span<T> is a ref struct that represents a contiguous slice of memory (array, stack, or native). It is zero-allocation and stack-only — cannot be stored on the heap or in async methods.",
  },
  {
    id: "cs-memory-t",
    language: "csharp",
    title: "Memory<T> — heap-friendly Span",
    tag: "types",
    code: `// Memory<T> can be stored in fields and used across async boundaries.
async Task ProcessAsync(Memory<byte> buffer)
{
    await Task.Delay(1);               // legal — Memory lives on heap
    var span = buffer.Span;            // get the Span when needed
    span.Fill(0);                      // zero-fill the buffer
}

byte[] data = new byte[1024];
await ProcessAsync(data.AsMemory(0, 512));`,
    explanation: "Memory<T> wraps the same contiguous memory as Span<T> but can be stored in fields and passed across await points. Call .Span only when you need the raw slice.",
  },
  {
    id: "cs-arraypool",
    language: "csharp",
    title: "ArrayPool<T> — rent and return arrays",
    tag: "snippet",
    code: `using System.Buffers;

// Rent a buffer from the shared pool — avoids GC allocation.
byte[] buffer = ArrayPool<byte>.Shared.Rent(4096);
try
{
    // buffer.Length may be > 4096 — pool rounds up.
    int actual = ReadSomeData(buffer);
    Process(buffer.AsSpan(0, actual));
}
finally
{
    ArrayPool<byte>.Shared.Return(buffer, clearArray: true);
}`,
    explanation: "ArrayPool<T> recycles large arrays instead of allocating new ones on each call, dramatically reducing Gen2 GC pressure in high-throughput I/O pipelines.",
  },
  {
    id: "cs-ref-returns",
    language: "csharp",
    title: "ref returns — return a reference to a variable",
    tag: "snippet",
    code: `int[] data = [10, 20, 30, 40];

// Return a reference to a specific element.
ref int Element(int[] arr, int index) => ref arr[index];

ref int elem = ref Element(data, 2);
elem = 99;                   // modifies data[2] in place
Console.WriteLine(data[2]);  // 99`,
    explanation: "ref returns pass back a managed reference rather than a copy — useful for high-performance math libraries that need to mutate elements of large arrays without copying.",
  },
  {
    id: "cs-in-parameter",
    language: "csharp",
    title: "in parameter modifier — pass-by-readonly-ref",
    tag: "snippet",
    code: `readonly struct BigStruct
{
    public double X, Y, Z, W;
}

// 'in' passes by reference but prevents modification — avoids 32-byte copy.
static double Sum(in BigStruct s) => s.X + s.Y + s.Z + s.W;

BigStruct v = new() { X = 1, Y = 2, Z = 3, W = 4 };
Console.WriteLine(Sum(in v));  // 10`,
    explanation: "The in modifier passes a value type by readonly reference. For large structs this avoids a defensive copy while guaranteeing the callee cannot modify the caller's data.",
  },
  {
    id: "cs-collection-expressions",
    language: "csharp",
    title: "Collection expressions (C# 12)",
    tag: "snippet",
    code: `// Uniform syntax for creating any collection type.
int[] arr   = [1, 2, 3];
List<int>  list  = [4, 5, 6];
Span<int>  span  = [7, 8, 9];

// Spread operator merges collections.
int[] combined = [..arr, ..list, 0];
Console.WriteLine(string.Join(", ", combined));
// 1, 2, 3, 4, 5, 6, 0

// Works with ImmutableArray too.
System.Collections.Immutable.ImmutableArray<int> ia = [10, 11];`,
    explanation: "Collection expressions (C# 12) provide a single literal syntax for arrays, lists, spans, and immutable collections. The spread operator (..) flattens nested collections inline.",
  },
  {
    id: "cs-primary-constructor-field",
    language: "csharp",
    title: "Primary constructor parameter capture",
    tag: "caveats",
    code: `// Primary constructor parameters are captured as fields implicitly
// when referenced in instance members.
class Counter(int initial)
{
    private int _count = initial;      // captured into _count
    public void Increment() => _count++;
    public int Value => _count;
}

// WARNING: referencing 'initial' directly in a method creates
// a hidden field — it's not a local variable.
class Logger(string prefix)
{
    // 'prefix' is kept alive as a hidden field here:
    public void Log(string msg) => Console.WriteLine($"{prefix}: {msg}");
}`,
    explanation: "Primary constructor parameters accessed in instance methods are silently promoted to private fields. Avoid storing heavy objects (DbContext, streams) as primary constructor parameters to prevent unintended lifetime extension.",
  },
  {
    id: "cs-required-members",
    language: "csharp",
    title: "required members (C# 11)",
    tag: "snippet",
    code: `class User
{
    public required string Name  { get; init; }
    public required string Email { get; init; }
    public int Age { get; init; }          // optional
}

// Compiler enforces that Name and Email are set.
var u = new User { Name = "Ada", Email = "ada@example.com" };

// Omitting a required member is a compile-time error:
// var bad = new User { Name = "X" };     // CS9035`,
    explanation: "required members (C# 11) ensure specific properties are set in every object initializer, replacing constructor overloads or runtime null checks with a compile-time guarantee.",
  },
  {
    id: "cs-rawstring-multiline",
    language: "csharp",
    title: "Raw string literals — multiline and interpolated",
    tag: "snippet",
    code: `// Raw string — no escape sequences needed.
string json = """
    {
        "name": "Ada",
        "scores": [1, 2, 3]
    }
    """;

// Raw interpolated string — $$ to use {{}} for placeholders.
string name = "Linus";
string greeting = $$"""
    Hello, {{name}}!
    Your path: C:\\Users\\{{name}}
    """;
Console.WriteLine(greeting);`,
    explanation: "Raw string literals (C# 11) start/end with at least three quotes. Indentation matching the closing quotes is stripped automatically. Use $$ for interpolation to avoid escaping braces.",
  },
  {
    id: "cs-list-pattern",
    language: "csharp",
    title: "List patterns (C# 11)",
    tag: "snippet",
    code: `void Describe(int[] arr)
{
    switch (arr)
    {
        case []:               Console.WriteLine("empty"); break;
        case [var x]:          Console.WriteLine($"one: {x}"); break;
        case [var x, var y]:   Console.WriteLine($"two: {x},{y}"); break;
        case [1, 2, ..]:       Console.WriteLine("starts with 1,2"); break;
        case [.., 99]:         Console.WriteLine("ends with 99"); break;
        default:               Console.WriteLine("other"); break;
    }
}

Describe([]);           // empty
Describe([42]);         // one: 42
Describe([1, 2, 3]);    // starts with 1,2`,
    explanation: "List patterns match the length and elements of any type that implements IList<T> or has a Count property and an indexer. The .. discard matches any number of remaining elements.",
  },
  {
    id: "cs-extended-property-pattern",
    language: "csharp",
    title: "Extended property patterns (C# 10)",
    tag: "snippet",
    code: `record Address(string City, string Country);
record Person(string Name, Address Address);

string Describe(Person p) => p switch
{
    { Address.Country: "UK", Address.City: var city }
        => $"UK resident in {city}",
    { Address.Country: "US" }
        => "US resident",
    _ => "other",
};

var ada = new Person("Ada", new Address("London", "UK"));
Console.WriteLine(Describe(ada));  // UK resident in London`,
    explanation: "Extended property patterns (C# 10) allow dot-separated navigation into nested properties directly in the pattern, without requiring intermediate captures.",
  },
  {
    id: "cs-global-using",
    language: "csharp",
    title: "global using — project-wide imports",
    tag: "snippet",
    code: `// GlobalUsings.cs — by convention a single file at project root.
global using System;
global using System.Collections.Generic;
global using System.Linq;
global using System.Threading.Tasks;

// Now every file in the project has these namespaces without
// individual using statements.

// SDK-style projects auto-generate these for common BCL types
// when <ImplicitUsings>enable</ImplicitUsings> is set in the csproj.`,
    explanation: "global using (C# 10) applies a using directive to every file in the compilation unit. Centralizing common imports in GlobalUsings.cs reduces boilerplate without sacrificing explicitness.",
  },
  {
    id: "cs-file-scoped-namespace",
    language: "csharp",
    title: "File-scoped namespace (C# 10)",
    tag: "snippet",
    code: `// Before C# 10 — block-scoped namespace adds one indent level.
namespace MyApp.Services
{
    public class OldService { }
}

// C# 10 — file-scoped namespace removes extra indentation.
namespace MyApp.Services;

public class NewService
{
    public void Do() { }
}`,
    explanation: "File-scoped namespaces (C# 10) apply to the entire file with a single trailing semicolon, eliminating one level of braces and indentation — the predominant style in modern C# codebases.",
  },
  {
    id: "cs-record-struct",
    language: "csharp",
    title: "record struct (C# 10)",
    tag: "snippet",
    code: `// record struct — value semantics + generated equality + ToString.
record struct Point(double X, double Y);

var p1 = new Point(1, 2);
var p2 = new Point(1, 2);
Console.WriteLine(p1 == p2);    // True — structural equality
Console.WriteLine(p1);          // Point { X = 1, Y = 2 }

// Mutable by default (unlike class records).
p1.X = 99;

// readonly record struct — immutable + hashable.
readonly record struct ImmPoint(double X, double Y);`,
    explanation: "record struct combines the stack allocation of structs with the auto-generated equality, ToString, and deconstruction of records. Use readonly record struct when you also want immutability.",
  },
  {
    id: "cs-switch-expression",
    language: "csharp",
    title: "Switch expression",
    tag: "snippet",
    code: `string DayType(DayOfWeek day) => day switch
{
    DayOfWeek.Saturday or DayOfWeek.Sunday => "weekend",
    DayOfWeek.Monday                       => "start of week",
    DayOfWeek.Friday                       => "end of week",
    _                                      => "weekday",
};

Console.WriteLine(DayType(DayOfWeek.Saturday));  // weekend
Console.WriteLine(DayType(DayOfWeek.Wednesday)); // weekday`,
    explanation: "Switch expressions return a value directly and must be exhaustive (compiler error if not). They are expressions, not statements — usable inside interpolated strings, ternary, etc.",
  },
  {
    id: "cs-is-pattern",
    language: "csharp",
    title: "is pattern matching",
    tag: "snippet",
    code: `object obj = "Hello World";

// Type pattern with capture.
if (obj is string s && s.Length > 5)
    Console.WriteLine($"Long string: {s}");

// Negation pattern.
if (obj is not null)
    Console.WriteLine("not null");

// Combined patterns.
object n = 42;
if (n is int i and > 0 and < 100)
    Console.WriteLine($"Small positive int: {i}");`,
    explanation: "The is operator supports patterns including type check + capture, not, and, or, relational (<, >, <=, >=), constant, and null checks — composable inline in if and while conditions.",
  },
  {
    id: "cs-and-or-not-pattern",
    language: "csharp",
    title: "and / or / not patterns",
    tag: "snippet",
    code: `bool IsWeekend(DayOfWeek day) =>
    day is DayOfWeek.Saturday or DayOfWeek.Sunday;

bool IsWorkHour(int hour) =>
    hour is >= 9 and <= 17;

bool IsNotNull<T>(T? obj) where T : class =>
    obj is not null;

string Classify(int n) => n switch
{
    < 0             => "negative",
    0               => "zero",
    > 0 and <= 100  => "small positive",
    _               => "large",
};`,
    explanation: "Pattern combinators (and, or, not) compose patterns inline without nesting parentheses. They are pattern-level operators, not boolean operators — or/and here are keywords, not || &&.",
  },
  {
    id: "cs-with-expression-record",
    language: "csharp",
    title: "with expression — non-destructive mutation",
    tag: "snippet",
    code: `record Person(string Name, int Age, string City);

var ada = new Person("Ada", 36, "London");

// Create a modified copy — original unchanged.
var older = ada with { Age = 37 };
var moved = ada with { City = "Cambridge" };

Console.WriteLine(ada);    // Person { Name = Ada, Age = 36, City = London }
Console.WriteLine(older);  // Person { Name = Ada, Age = 37, City = London }
Console.WriteLine(moved);  // Person { Name = Ada, Age = 36, City = Cambridge }`,
    explanation: "The with expression creates a shallow copy of a record (or struct) with specified properties changed. It's the idiomatic way to 'update' immutable data in C# without mutating the original.",
  },
  {
    id: "cs-init-only",
    language: "csharp",
    title: "init-only setters",
    tag: "snippet",
    code: `class Config
{
    public string Host { get; init; } = "localhost";
    public int    Port { get; init; } = 8080;
}

// Set during object initializer — OK.
var cfg = new Config { Host = "example.com", Port = 443 };

// cfg.Host = "other";  // CS8852 — init-only property

// Works with 'with' on records, and with constructors.
Console.WriteLine(cfg.Host);  // example.com`,
    explanation: "init-only properties (C# 9) are settable in object initializers and with expressions but immutable thereafter — giving you the flexibility of initializers with the safety of readonly fields.",
  },
  {
    id: "cs-index-range",
    language: "csharp",
    title: "Index and Range — ^ and ..",
    tag: "snippet",
    code: `int[] nums = [0, 1, 2, 3, 4, 5];

Console.WriteLine(nums[^1]);       // 5  — last element
Console.WriteLine(nums[^2]);       // 4  — second to last

int[] last3 = nums[3..];          // [3, 4, 5]
int[] first2 = nums[..2];         // [0, 1]
int[] middle = nums[1..^1];       // [1, 2, 3, 4]
int[] copy   = nums[..];          // full copy

// Works on strings, Span<T>, Memory<T> too.
string s = "Hello World";
Console.WriteLine(s[6..]);        // World`,
    explanation: "Index (^n counts from the end) and Range (start..end) work on any type that provides an indexer taking Index or a Slice method. They compile to Length-based index arithmetic.",
  },
  {
    id: "cs-dictionary-trygetvalue",
    language: "csharp",
    title: "TryGetValue — safe dictionary lookup",
    tag: "snippet",
    code: `var scores = new Dictionary<string, int>
{
    ["Alice"] = 95,
    ["Bob"]   = 87,
};

// Avoid double-lookup with ContainsKey + indexer.
if (scores.TryGetValue("Alice", out int score))
    Console.WriteLine($"Alice: {score}");

// GetValueOrDefault for a fallback without exception.
int charlie = scores.GetValueOrDefault("Charlie", 0);
Console.WriteLine(charlie);  // 0`,
    explanation: "TryGetValue performs a single hash lookup instead of two (ContainsKey + indexer). For read-heavy paths, prefer GetValueOrDefault which also avoids a branch.",
  },
  {
    id: "cs-hashset-operations",
    language: "csharp",
    title: "HashSet<T> set operations",
    tag: "snippet",
    code: `var a = new HashSet<int> { 1, 2, 3, 4 };
var b = new HashSet<int> { 3, 4, 5, 6 };

// These mutate the target in place.
var union  = new HashSet<int>(a); union.UnionWith(b);
var inter  = new HashSet<int>(a); inter.IntersectWith(b);
var diff   = new HashSet<int>(a); diff.ExceptWith(b);
var sym    = new HashSet<int>(a); sym.SymmetricExceptWith(b);

Console.WriteLine(string.Join(",", union));  // 1,2,3,4,5,6
Console.WriteLine(string.Join(",", inter));  // 3,4
Console.WriteLine(string.Join(",", diff));   // 1,2
Console.WriteLine(string.Join(",", sym));    // 1,2,5,6`,
    explanation: "HashSet<T> provides O(1) Add/Remove/Contains and efficient set algebra methods. The algebra methods mutate the set in place — copy first if you need to preserve the original.",
  },
  {
    id: "cs-priority-queue",
    language: "csharp",
    title: "PriorityQueue<TElement, TPriority>",
    tag: "snippet",
    code: `var pq = new PriorityQueue<string, int>();
pq.Enqueue("low task",    10);
pq.Enqueue("high task",    1);
pq.Enqueue("medium task",  5);

// Dequeues in ascending priority order (lowest number first).
while (pq.TryDequeue(out string? task, out int priority))
    Console.WriteLine($"[{priority}] {task}");
// [1] high task
// [5] medium task
// [10] low task`,
    explanation: "PriorityQueue<TElement, TPriority> (.NET 6+) is a min-heap: smallest priority value dequeues first. For a max-heap, negate your priorities or implement a custom comparer.",
  },
  {
    id: "cs-concurrent-dict",
    language: "csharp",
    title: "ConcurrentDictionary — thread-safe updates",
    tag: "snippet",
    code: `using System.Collections.Concurrent;

var counts = new ConcurrentDictionary<string, int>();

// GetOrAdd — atomic fetch-or-insert.
counts.GetOrAdd("apple", 0);

// AddOrUpdate — atomic read-modify-write.
Parallel.For(0, 1000, _ =>
{
    counts.AddOrUpdate("apple",
        addValue: 1,
        updateValueFactory: (_, old) => old + 1);
});

Console.WriteLine(counts["apple"]);  // 1000`,
    explanation: "ConcurrentDictionary is safe for concurrent reads and writes. AddOrUpdate and GetOrAdd are atomic, avoiding TOCTOU races. The updateValueFactory may be called multiple times on contention — keep it side-effect-free.",
  },
  {
    id: "cs-channel-t",
    language: "csharp",
    title: "Channel<T> — async producer/consumer",
    tag: "snippet",
    code: `using System.Threading.Channels;

var channel = Channel.CreateBounded<int>(capacity: 10);

// Producer.
var producer = Task.Run(async () =>
{
    for (int i = 0; i < 5; i++)
    {
        await channel.Writer.WriteAsync(i);
    }
    channel.Writer.Complete();
});

// Consumer.
var consumer = Task.Run(async () =>
{
    await foreach (int item in channel.Reader.ReadAllAsync())
        Console.WriteLine(item);
});

await Task.WhenAll(producer, consumer);`,
    explanation: "Channel<T> is the modern async-native producer/consumer queue. Bounded channels apply backpressure; unbounded channels never block. Use ReadAllAsync() for a clean consumer loop.",
  },
  {
    id: "cs-cancellation-token",
    language: "csharp",
    title: "CancellationToken — cooperative cancellation",
    tag: "snippet",
    code: `async Task LongRunning(CancellationToken ct)
{
    for (int i = 0; i < 100; i++)
    {
        ct.ThrowIfCancellationRequested();   // check point
        await Task.Delay(100, ct);           // also cancellable
        Console.Write('.');
    }
}

using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(1));
try
{
    await LongRunning(cts.Token);
}
catch (OperationCanceledException)
{
    Console.WriteLine("\nCancelled.");
}`,
    explanation: "CancellationToken is the standard cooperative cancellation mechanism. Pass it through every async and long-running method. ThrowIfCancellationRequested() is the cheapest check point.",
  },
  {
    id: "cs-task-when-all",
    language: "csharp",
    title: "Task.WhenAll — await multiple tasks",
    tag: "snippet",
    code: `async Task<int> Fetch(int id)
{
    await Task.Delay(id * 100);
    return id * id;
}

// Run concurrently — total time is max delay, not sum.
int[] results = await Task.WhenAll(Fetch(1), Fetch(2), Fetch(3));
Console.WriteLine(string.Join(", ", results));  // 1, 4, 9`,
    explanation: "Task.WhenAll starts all tasks immediately and awaits all of them. Unlike sequential awaits, total elapsed time is the maximum individual time, not the sum.",
  },
  {
    id: "cs-configureawait",
    language: "csharp",
    title: "ConfigureAwait(false) — avoid context capture",
    tag: "caveats",
    code: `// In library code, avoid capturing the synchronization context.
async Task<string> LibraryMethodAsync()
{
    // ConfigureAwait(false) means: resume on a thread-pool thread.
    string data = await FetchDataAsync().ConfigureAwait(false);
    return data.ToUpper();
}

// In application code (UI, ASP.NET), omit ConfigureAwait(false)
// so continuations run back on the correct context.`,
    explanation: "ConfigureAwait(false) prevents deadlocks in libraries consumed by code that calls .Result or .Wait() on top of a synchronization context (WinForms, WPF, old ASP.NET).",
  },
  {
    id: "cs-async-enumerable",
    language: "csharp",
    title: "IAsyncEnumerable<T> — async streams",
    tag: "snippet",
    code: `async IAsyncEnumerable<int> GenerateAsync(int count)
{
    for (int i = 0; i < count; i++)
    {
        await Task.Delay(50);   // simulate async work
        yield return i;
    }
}

await foreach (int value in GenerateAsync(5))
    Console.WriteLine(value);   // 0 1 2 3 4`,
    explanation: "IAsyncEnumerable<T> enables lazy async sequences: each element is produced on demand and awaited. Use it for paginated APIs, file streaming, and database cursors where materializing all at once is expensive.",
  },
  {
    id: "cs-dispose-async",
    language: "csharp",
    title: "IAsyncDisposable and await using",
    tag: "snippet",
    code: `class AsyncResource : IAsyncDisposable
{
    public async ValueTask DisposeAsync()
    {
        await Task.Delay(10);   // async cleanup (flush, close connection)
        Console.WriteLine("Disposed asynchronously");
    }
}

// await using calls DisposeAsync() on scope exit.
await using var res = new AsyncResource();
Console.WriteLine("Using resource...");
// Disposed asynchronously — printed after the using block`,
    explanation: "IAsyncDisposable is the async counterpart to IDisposable. Use it for resources whose cleanup involves I/O (network connections, file flush). await using is the async version of using.",
  },
  {
    id: "cs-interlocked",
    language: "csharp",
    title: "Interlocked — atomic operations",
    tag: "snippet",
    code: `int counter = 0;

Parallel.For(0, 1000, _ =>
{
    Interlocked.Increment(ref counter);  // atomic ++
});

Console.WriteLine(counter);  // reliably 1000

// Other operations.
int old  = Interlocked.Exchange(ref counter, 0);         // swap
int prev = Interlocked.CompareExchange(ref counter, 42, 0); // CAS`,
    explanation: "Interlocked provides lock-free atomic read-modify-write operations. Much faster than lock() for simple counters and flags but only works on single variables — use lock for multi-variable invariants.",
  },
  {
    id: "cs-readerwriter-lock",
    language: "csharp",
    title: "ReaderWriterLockSlim — many readers, one writer",
    tag: "snippet",
    code: `var cache = new Dictionary<string, string>();
var rwl   = new ReaderWriterLockSlim();

void Read(string key)
{
    rwl.EnterReadLock();
    try   { Console.WriteLine(cache.GetValueOrDefault(key)); }
    finally { rwl.ExitReadLock(); }
}

void Write(string key, string val)
{
    rwl.EnterWriteLock();
    try   { cache[key] = val; }
    finally { rwl.ExitWriteLock(); }
}`,
    explanation: "ReaderWriterLockSlim allows concurrent reads but exclusive writes. Suitable for caches where reads vastly outnumber writes. Always release in finally to avoid deadlocks on exceptions.",
  },
  {
    id: "cs-object-pool",
    language: "csharp",
    title: "ObjectPool<T> — reuse expensive objects",
    tag: "snippet",
    code: `using Microsoft.Extensions.ObjectPool;

var policy  = new DefaultPooledObjectPolicy<StringBuilder>();
var pool    = new DefaultObjectPool<StringBuilder>(policy, maximumRetained: 8);

// Rent and use.
var sb = pool.Get();
try
{
    sb.Append("Hello").Append(" World");
    Console.WriteLine(sb.ToString());
}
finally
{
    sb.Clear();      // reset state before returning
    pool.Return(sb);
}`,
    explanation: "ObjectPool<T> amortizes allocation cost for heavyweight objects (StringBuilder, MemoryStream, regex matchers). Always clear state before returning — pool objects are reused, not re-initialized.",
  },
  {
    id: "cs-weak-reference",
    language: "csharp",
    title: "WeakReference<T> — allow GC to collect",
    tag: "snippet",
    code: `class CachedData { public byte[] Buffer = new byte[1024]; }

var weak = new WeakReference<CachedData>(new CachedData());

if (weak.TryGetTarget(out CachedData? data))
    Console.WriteLine($"Data size: {data.Buffer.Length}");

// Simulate memory pressure.
GC.Collect();
GC.WaitForPendingFinalizers();

bool alive = weak.TryGetTarget(out _);
Console.WriteLine($"Still alive: {alive}");   // may be False`,
    explanation: "WeakReference<T> lets the GC collect the target when memory pressure demands it. TryGetTarget returns false if collected. Use it for memory-sensitive caches that should yield to GC.",
  },
  {
    id: "cs-flags-enum",
    language: "csharp",
    title: "[Flags] enum — bitmask combinations",
    tag: "snippet",
    code: `[Flags]
enum Permission
{
    None    = 0,
    Read    = 1 << 0,   // 1
    Write   = 1 << 1,   // 2
    Execute = 1 << 2,   // 4
    All     = Read | Write | Execute,
}

var perms = Permission.Read | Permission.Write;
Console.WriteLine(perms);                           // Read, Write
Console.WriteLine(perms.HasFlag(Permission.Read));  // True
perms &= ~Permission.Write;                         // remove Write
Console.WriteLine(perms);                           // Read`,
    explanation: "[Flags] tells ToString() and Enum.Parse() to treat the enum as a bitmask. Always define values as powers of two and combine with |. HasFlag is the idiomatic membership test.",
  },
  {
    id: "cs-nullable-value-type",
    language: "csharp",
    title: "Nullable<T> — value types that can be null",
    tag: "types",
    code: `int? a = null;
int? b = 42;

// Pattern matching.
if (b is int val)
    Console.WriteLine($"Has value: {val}");

// Null-coalescing.
int result = a ?? -1;
Console.WriteLine(result);   // -1

// GetValueOrDefault.
Console.WriteLine(a.GetValueOrDefault(0));   // 0
Console.WriteLine(b.GetValueOrDefault(0));   // 42

// Nullable arithmetic — null propagates.
Console.WriteLine(a + b);   // null`,
    explanation: "Nullable<T> (spelled T?) boxes a value type with a boolean HasValue flag. Arithmetic on null propagates null. The ? operator and null-coalescing ?? are essential companions.",
  },
  {
    id: "cs-null-coalescing-assign",
    language: "csharp",
    title: "??= null-coalescing assignment",
    tag: "snippet",
    code: `string? name = null;

// With ??= — assign only when null.
name ??= "default";
Console.WriteLine(name);   // default

// Works for lazy initialization.
List<int>? list = null;
list ??= new List<int>();
list.Add(1);
Console.WriteLine(list.Count);   // 1`,
    explanation: "??= assigns the right-hand side only when the left-hand side is null. It's the standard pattern for lazy initialization of nullable fields in properties and methods.",
  },
  {
    id: "cs-deconstruct-custom",
    language: "csharp",
    title: "Custom Deconstruct method",
    tag: "snippet",
    code: `class Rectangle
{
    public double Width  { get; init; }
    public double Height { get; init; }

    // Any class can support deconstruction with this signature.
    public void Deconstruct(out double width, out double height)
    {
        width  = Width;
        height = Height;
    }
}

var rect = new Rectangle { Width = 3, Height = 4 };
var (w, h) = rect;
Console.WriteLine($"{w} x {h}");  // 3 x 4

// Also usable in patterns:
if (rect is (> 2, > 3)) Console.WriteLine("big");`,
    explanation: "Any class or struct with a Deconstruct method can be used in tuple-like deconstruction and positional patterns. You can add multiple overloads for different numbers of components.",
  },
  {
    id: "cs-generic-math",
    language: "csharp",
    title: "Generic math with static abstract members (C# 11)",
    tag: "snippet",
    code: `using System.Numerics;

// INumber<T> lets you write generic numeric algorithms.
T Sum<T>(IEnumerable<T> values) where T : INumber<T>
{
    T total = T.Zero;
    foreach (var v in values)
        total += v;
    return total;
}

Console.WriteLine(Sum(new[] { 1, 2, 3 }));          // 6
Console.WriteLine(Sum(new[] { 1.1, 2.2, 3.3 }));    // 6.6
Console.WriteLine(Sum(new[] { 1m, 2m, 3m }));       // 6`,
    explanation: "Static abstract members (C# 11) allow interfaces to declare static methods and operators. INumber<T> in System.Numerics leverages this to enable truly generic arithmetic without boxing.",
  },
  {
    id: "cs-caller-argument",
    language: "csharp",
    title: "CallerArgumentExpression (C# 10)",
    tag: "snippet",
    code: `using System.Runtime.CompilerServices;

static void Require(bool condition,
    [CallerArgumentExpression(nameof(condition))]
    string? expr = null)
{
    if (!condition)
        throw new ArgumentException($"Assertion failed: {expr}");
}

int x = -1;
Require(x > 0);
// ArgumentException: Assertion failed: x > 0`,
    explanation: "CallerArgumentExpression captures the source text of the argument expression at compile time — enabling assertion helpers that show the failing condition without manual message strings.",
  },
  {
    id: "cs-utf8-literals",
    language: "csharp",
    title: "UTF-8 string literals (C# 11)",
    tag: "snippet",
    code: `// u8 suffix creates a ReadOnlySpan<byte> — no allocation.
ReadOnlySpan<byte> hello = "Hello"u8;
ReadOnlySpan<byte> nl    = "\n"u8;

Console.WriteLine(hello.Length);  // 5
Console.WriteLine(hello[0]);      // 72  (ASCII 'H')

// Ideal for HTTP headers, protocol constants.
static ReadOnlySpan<byte> ContentType => "application/json"u8;`,
    explanation: "The u8 suffix encodes a string literal as UTF-8 bytes at compile time, stored as a ReadOnlySpan<byte>. Zero allocation, zero runtime encoding — ideal for protocol and serialization hot paths.",
  },
  {
    id: "cs-lambda-attributes",
    language: "csharp",
    title: "Lambda attributes and explicit return types (C# 10)",
    tag: "snippet",
    code: `// Explicit return type on lambda (C# 10).
var parse = int (string s) => int.Parse(s);
Console.WriteLine(parse("42"));  // 42

// Natural types — the compiler infers the delegate type.
var add = (int a, int b) => a + b;   // Func<int,int,int>

// Attributes on lambdas.
Func<int, int> fn = [System.Diagnostics.DebuggerStepThrough]
    (x) => x * 2;`,
    explanation: "C# 10 allows attributes on lambda parameters and return positions, and lets you write the return type explicitly before the parameter list — aiding attributes, nullability annotations, and overload resolution.",
  },
  {
    id: "cs-conditional-attribute",
    language: "csharp",
    title: "[Conditional] attribute — debug-only methods",
    tag: "snippet",
    code: `using System.Diagnostics;

class Logger
{
    [Conditional("DEBUG")]
    public static void Trace(string msg) =>
        Console.WriteLine($"[TRACE] {msg}");
}

// Call is compiled away in Release builds — zero overhead.
Logger.Trace("entering method");`,
    explanation: "[Conditional(\"DEBUG\")] causes the compiler to emit call sites only when the named symbol is defined. Unlike #if, the method itself always exists so other assemblies compiled in Debug mode can still call it.",
  },
  {
    id: "cs-obsolete-attribute",
    language: "csharp",
    title: "[Obsolete] — deprecation warnings",
    tag: "snippet",
    code: `class Api
{
    [Obsolete("Use NewMethod() instead", error: false)]
    public void OldMethod() { }

    // error: true turns the warning into a compile error.
    [Obsolete("Removed — use NewMethod()", error: true)]
    public void RemovedMethod() { }

    public void NewMethod() { }
}

new Api().OldMethod();        // CS0618 warning
// new Api().RemovedMethod(); // CS0619 error`,
    explanation: "[Obsolete] attaches deprecation metadata that the compiler surfaces as warnings or errors. Use error: false during a migration period; switch to error: true once adoption is complete.",
  },
  {
    id: "cs-enum-parse",
    language: "csharp",
    title: "Enum.Parse and Enum.TryParse",
    tag: "snippet",
    code: `enum Status { Active, Inactive, Pending }

// Parse — throws if value is not found.
Status s1 = Enum.Parse<Status>("Active");
Console.WriteLine(s1);  // Active

// TryParse — safe; case-insensitive option.
if (Enum.TryParse<Status>("pending", ignoreCase: true, out Status s2))
    Console.WriteLine(s2);  // Pending

// Parse from integer.
Status s3 = (Status)1;
Console.WriteLine(s3);   // Inactive

// IsDefined — validate before casting.
Console.WriteLine(Enum.IsDefined(typeof(Status), 99));  // False`,
    explanation: "Prefer Enum.TryParse over Enum.Parse when the input comes from user data. Always validate numeric inputs with Enum.IsDefined — casting an out-of-range int succeeds without error.",
  },
  {
    id: "cs-tuple-pattern",
    language: "csharp",
    title: "Tuple patterns in switch",
    tag: "snippet",
    code: `string TrafficLight(bool isRed, bool isGreen) =>
    (isRed, isGreen) switch
    {
        (true,  false) => "Stop",
        (false, true)  => "Go",
        (false, false) => "Wait",
        (true,  true)  => throw new InvalidOperationException("Both on?"),
    };

Console.WriteLine(TrafficLight(true,  false));  // Stop
Console.WriteLine(TrafficLight(false, true));   // Go`,
    explanation: "Tuple patterns let you match on multiple values simultaneously in a switch expression. The compiler warns if the switch is not exhaustive, and the tuple is synthesized on the stack — no heap allocation.",
  },
  {
    id: "cs-relational-pattern",
    language: "csharp",
    title: "Relational patterns (<, >, <=, >=)",
    tag: "snippet",
    code: `string Grade(int score) => score switch
{
    >= 90           => "A",
    >= 80 and < 90  => "B",
    >= 70 and < 80  => "C",
    >= 60 and < 70  => "D",
    _               => "F",
};

Console.WriteLine(Grade(95));   // A
Console.WriteLine(Grade(82));   // B
Console.WriteLine(Grade(55));   // F`,
    explanation: "Relational patterns compare a value against a constant using <, >, <=, >=. Combined with and/or they replace complex if-else chains with a readable, exhaustive switch expression.",
  },
  {
    id: "cs-object-initializer",
    language: "csharp",
    title: "Object and collection initializers",
    tag: "snippet",
    code: `class Point { public int X; public int Y; }

// Object initializer — shorthand for property assignment.
var p = new Point { X = 1, Y = 2 };

// Collection initializer — calls Add() behind the scenes.
var dict = new Dictionary<string, int>
{
    ["a"] = 1,
    ["b"] = 2,
};

// Nested.
record Config(string Host = "localhost")
{
    public List<int> Ports { get; init; } = [];
}
var cfg = new Config() { Ports = [80, 443] };`,
    explanation: "Object initializers call the parameterless constructor then assign properties in one expression. Collection initializers call Add() for each element. Both compose with the with expression for records.",
  },
  {
    id: "cs-sortedlist-vs-dict",
    language: "csharp",
    title: "SortedList vs SortedDictionary",
    tag: "understanding",
    code: `// SortedList<K,V> — backed by two parallel arrays; O(log n) lookup.
// Lower memory, faster iteration; O(n) insert/remove in the middle.
var sl = new SortedList<int, string> { [3] = "c", [1] = "a", [2] = "b" };

// SortedDictionary<K,V> — backed by a red-black tree; O(log n) for all ops.
// Better for frequent insert/delete.
var sd = new SortedDictionary<int, string> { [3] = "c", [1] = "a", [2] = "b" };

foreach (var kv in sl) Console.Write($"{kv.Key}:{kv.Value} ");
// 1:a 2:b 3:c — sorted order`,
    explanation: "SortedList is memory-efficient and faster for iteration; SortedDictionary is better when insertions and deletions are frequent. Both provide O(log n) key lookup via binary search/tree traversal.",
  },
  {
    id: "cs-switch-when",
    language: "csharp",
    title: "switch with when guard",
    tag: "snippet",
    code: `string Classify(object obj) => obj switch
{
    int n when n < 0    => "negative int",
    int n when n == 0   => "zero",
    int n               => $"positive int: {n}",
    string s when s.Length == 0 => "empty string",
    string s            => $"string of length {s.Length}",
    null                => "null",
    _                   => "other",
};

Console.WriteLine(Classify(-5));     // negative int
Console.WriteLine(Classify("hi"));   // string of length 2`,
    explanation: "The when guard adds a boolean condition to a switch arm. Arms are evaluated top to bottom — place more specific (guarded) cases before the general case for the same type.",
  },
  {
    id: "cs-string-range",
    language: "csharp",
    title: "String slicing with Range",
    tag: "snippet",
    code: `string s = "Hello, World!";

Console.WriteLine(s[7..]);     // World!
Console.WriteLine(s[..5]);     // Hello
Console.WriteLine(s[7..12]);   // World
Console.WriteLine(s[^6..]);    // World!

// Parsing fixed-format text.
string date  = "2024-05-06";
string year  = date[..4];    // 2024
string month = date[5..7];   // 05
string day   = date[8..];    // 06`,
    explanation: "String indexers accept Index and Range values, enabling clean slicing without Substring(). Ranges are half-open: start is inclusive, end is exclusive. ^ counts from the end.",
  },
  {
    id: "cs-linked-cancellation",
    language: "csharp",
    title: "Linked CancellationTokenSources",
    tag: "snippet",
    code: `using var globalCts  = new CancellationTokenSource();
using var timeoutCts = new CancellationTokenSource(TimeSpan.FromSeconds(5));

// Create a token cancelled when EITHER source fires.
using var linked = CancellationTokenSource.CreateLinkedTokenSource(
    globalCts.Token, timeoutCts.Token);

CancellationToken token = linked.Token;

try
{
    await Task.Delay(Timeout.Infinite, token);
}
catch (OperationCanceledException)
{
    Console.WriteLine("Cancelled.");
}`,
    explanation: "CreateLinkedTokenSource combines multiple cancellation tokens so any one of them cancelling triggers the linked token. Useful for applying a per-request timeout on top of an application-wide shutdown token.",
  },
  {
    id: "cs-gc-collect-gen",
    language: "csharp",
    title: "GC.Collect with generation",
    tag: "caveats",
    code: `// Force collection of a specific generation.
GC.Collect(0);   // Gen0 only — fast
GC.Collect(1);   // Gen0 + Gen1
GC.Collect(2);   // Full GC — expensive

// Check memory pressure.
long before = GC.GetTotalMemory(forceCollection: false);
// ... allocate ...
long after  = GC.GetTotalMemory(forceCollection: false);
Console.WriteLine($"Delta: {after - before} bytes");`,
    explanation: "Explicit GC.Collect() is almost always wrong in production — the GC is better at scheduling. It exists for benchmarking baselines and finalizer testing. Never call it to 'fix' a memory issue.",
  },
  {
    id: "cs-inline-arrays",
    language: "csharp",
    title: "Inline arrays (C# 12)",
    tag: "snippet",
    code: `using System.Runtime.CompilerServices;

[InlineArray(4)]
struct Vec4
{
    private float _e0;   // placeholder element
}

Vec4 v = default;
v[0] = 1.0f; v[1] = 2.0f; v[2] = 3.0f; v[3] = 4.0f;

// Spans work directly — no copy.
Span<float> sp = v;
sp.Fill(0);
Console.WriteLine(v[0]);  // 0`,
    explanation: "Inline arrays (C# 12) embed a fixed-size contiguous block inside a struct, accessible by index. The runtime uses them internally for stackalloc-like performance without unsafe code.",
  },
  {
    id: "cs-volatile-keyword",
    language: "csharp",
    title: "volatile — prevent caching of shared variable",
    tag: "caveats",
    code: `class StopFlag
{
    // volatile ensures reads/writes are not cached in a register.
    private volatile bool _stop = false;

    public void Run()
    {
        while (!_stop) { /* do work */ }
    }

    public void Stop() => _stop = true;
}`,
    explanation: "volatile prevents the compiler and CPU from caching a variable in a register across threads. It provides visibility guarantees but not atomicity — for compound operations, use Interlocked or lock.",
  },
  {
    id: "cs-progress-t",
    language: "csharp",
    title: "IProgress<T> — report async progress",
    tag: "snippet",
    code: `async Task DoWorkAsync(IProgress<int>? progress = null)
{
    for (int i = 1; i <= 10; i++)
    {
        await Task.Delay(100);
        progress?.Report(i * 10);  // percent complete
    }
}

// Progress<T> marshals the callback to the context where it was created.
var progressReporter = new Progress<int>(pct =>
    Console.WriteLine($"Progress: {pct}%"));

await DoWorkAsync(progressReporter);`,
    explanation: "IProgress<T> decouples producers from progress UI. Progress<T> captures the synchronization context at construction, so the callback automatically runs on the UI thread — no manual Invoke needed.",
  },
  {
    id: "cs-monitor-usage",
    language: "csharp",
    title: "Monitor.Enter / Exit — explicit locking",
    tag: "snippet",
    code: `object _lock = new();
int _counter = 0;

void Increment()
{
    bool acquired = false;
    try
    {
        Monitor.Enter(_lock, ref acquired);
        _counter++;
    }
    finally
    {
        if (acquired) Monitor.Exit(_lock);
    }
}

// The above is what the 'lock' statement compiles to.
// Prefer 'lock' unless you need TryEnter or Pulse.`,
    explanation: "Monitor.Enter/Exit is the underlying mechanism behind the lock statement. Use it directly only when you need Monitor.TryEnter (non-blocking attempt) or Monitor.Pulse/Wait for condition signaling.",
  },
  {
    id: "cs-thread-pool",
    language: "csharp",
    title: "ThreadPool.QueueUserWorkItem",
    tag: "snippet",
    code: `// Low-level thread-pool dispatch — prefer Task.Run in modern code.
ThreadPool.QueueUserWorkItem(state =>
{
    Console.WriteLine($"Running on thread {Environment.CurrentManagedThreadId}");
}, state: null);

// With typed state (avoids boxing).
ThreadPool.QueueUserWorkItem(static (data) =>
{
    Console.WriteLine($"Value: {data}");
}, state: 42, preferLocal: false);`,
    explanation: "ThreadPool.QueueUserWorkItem schedules work on the managed thread pool. Task.Run is the modern wrapper and adds exception propagation, continuations, and cancellation — prefer it unless integrating with legacy code.",
  },
  {
    id: "cs-conditional-weak-table",
    language: "csharp",
    title: "ConditionalWeakTable — attach data to objects",
    tag: "snippet",
    code: `using System.Runtime.CompilerServices;

var table = new ConditionalWeakTable<object, string>();

object key = new();
table.Add(key, "associated metadata");

if (table.TryGetValue(key, out string? val))
    Console.WriteLine(val);   // associated metadata

// When 'key' is GC'd, the entry is automatically removed.
key = null!;
GC.Collect();
// Entry is gone — no memory leak.`,
    explanation: "ConditionalWeakTable lets you attach extra data to any object without modifying its class and without preventing GC. The entry lives only as long as the key object is reachable.",
  },
  {
    id: "cs-record-custom-equality",
    language: "csharp",
    title: "Customizing record equality",
    tag: "understanding",
    code: `// By default, records compare all properties.
record Person(string Name, int Age);
Console.WriteLine(new Person("Ada", 36) == new Person("Ada", 36));  // True

// Override equality to compare by a subset of properties.
record PersonByName(string Name, int Age)
{
    public virtual bool Equals(PersonByName? other) =>
        other is not null && Name == other.Name;

    public override int GetHashCode() => HashCode.Combine(Name);
}

Console.WriteLine(new PersonByName("Ada", 36) == new PersonByName("Ada", 99));  // True`,
    explanation: "Records generate structural equality by default, but you can override Equals and GetHashCode like any class. The virtual bool Equals(T?) override is the record-specific equality hook.",
  },
  {
    id: "cs-source-generators-concept",
    language: "csharp",
    title: "Source generators — compile-time code synthesis",
    tag: "understanding",
    code: `// Source generators run during compilation and emit new source files.
// Common examples in the BCL/ecosystem:
// - System.Text.Json — JsonSerializerContext for AOT serialization
// - System.Text.RegularExpressions — [GeneratedRegex] for compiled regex
// - Microsoft.Extensions.Logging — LoggerMessage.Define wrappers

using System.Text.RegularExpressions;

partial class Parser
{
    // Generates a compiled Regex at build time — zero startup cost.
    [GeneratedRegex(@"\d{4}-\d{2}-\d{2}")]
    private static partial Regex DatePattern();
}`,
    explanation: "Source generators run as part of the C# compiler and produce additional source files that are compiled into the assembly. They enable zero-overhead reflection-free serialization, logging, and regex compilation.",
  },
  {
    id: "cs-large-object-heap",
    language: "csharp",
    title: "Large Object Heap — objects >= 85 KB",
    tag: "understanding",
    code: `// Arrays >= 85,000 bytes go straight to the LOH.
// LOH is collected only during Gen2 GC — infrequent but expensive.

// Avoid LOH fragmentation:
// 1. Reuse large arrays (ArrayPool<byte>).
// 2. Avoid resizing: allocate full size up front.
// 3. Use GCSettings.LargeObjectHeapCompactionMode for explicit compaction.

System.Runtime.GCSettings.LargeObjectHeapCompactionMode =
    System.Runtime.GCLargeObjectHeapCompactionMode.CompactOnce;
GC.Collect();   // compacts LOH this one time`,
    explanation: "Objects >= 85 KB bypass Gen0/Gen1 and live on the Large Object Heap. LOH fragmentation causes increasing Gen2 GC pauses. Use ArrayPool and avoid unnecessary large temporary allocations.",
  },
  {
    id: "cs-checked-operators",
    language: "csharp",
    title: "checked / unchecked — overflow behavior",
    tag: "caveats",
    code: `int max = int.MaxValue;

// unchecked (default) — wraps around silently.
unchecked
{
    Console.WriteLine(max + 1);  // -2147483648
}

// checked — throws OverflowException.
try
{
    checked { Console.WriteLine(max + 1); }
}
catch (OverflowException e)
{
    Console.WriteLine(e.Message);
}

// Alternatively: use checked keyword on expression.
int safe = checked(max - 1);`,
    explanation: "C# arithmetic is unchecked by default for performance — integer overflow wraps silently. Use checked blocks or the checked() expression when overflow should be an error, e.g. financial calculations.",
  },
  {
    id: "cs-istaticinterface",
    language: "csharp",
    title: "Static abstract members in interfaces",
    tag: "snippet",
    code: `interface IFactory<TSelf> where TSelf : IFactory<TSelf>
{
    static abstract TSelf Create(string config);
}

class Service : IFactory<Service>
{
    public string Config { get; }
    private Service(string c) { Config = c; }

    public static Service Create(string config) => new(config);
}

// Call without knowing the concrete type.
T Build<T>(string cfg) where T : IFactory<T> => T.Create(cfg);
var svc = Build<Service>("prod");`,
    explanation: "Static abstract members (C# 11) allow interfaces to define contracts for static methods and operators. The pattern where T : TSelf (CRTP) is common for factory, parsing, and arithmetic interfaces.",
  },
  {
    id: "cs-observable-pattern",
    language: "csharp",
    title: "IObservable<T> basics",
    tag: "snippet",
    code: `// IObservable<T> is the push-based async sequence interface.
// The System.Reactive (Rx.NET) NuGet package provides rich operators.

// Create a simple observable manually.
IObservable<int> source = System.Reactive.Linq.Observable
    .Range(1, 5);

source.Subscribe(
    onNext:      i => Console.WriteLine($"Item: {i}"),
    onError:     e => Console.WriteLine($"Error: {e.Message}"),
    onCompleted: () => Console.WriteLine("Done")
);`,
    explanation: "IObservable<T> is the push-based dual of IEnumerable<T>. Rx (Reactive Extensions) builds a full LINQ-style operator library on top of it — ideal for event streams, real-time data, and UI bindings.",
  },
  {
    id: "cs-spin-lock",
    language: "csharp",
    title: "SpinLock — low-latency short critical sections",
    tag: "snippet",
    code: `SpinLock sl = new SpinLock(enableThreadOwnerTracking: false);
int counter = 0;

void Increment()
{
    bool taken = false;
    try
    {
        sl.Enter(ref taken);
        counter++;
    }
    finally
    {
        if (taken) sl.Exit();
    }
}

Parallel.For(0, 1000, _ => Increment());
Console.WriteLine(counter);  // 1000`,
    explanation: "SpinLock busy-waits instead of yielding to the OS — extremely fast for critical sections measured in nanoseconds. For longer sections, a regular lock is better: spinning wastes CPU cycles under contention.",
  },
  {
    id: "cs-file-scoped-types",
    language: "csharp",
    title: "file-scoped types (C# 11)",
    tag: "snippet",
    code: `// MyService.cs
namespace MyApp;

public class MyService
{
    private readonly Helper _helper = new();
    public void Run() => _helper.Execute();
}

// Only visible within this file — never leaks to other files.
file class Helper
{
    public void Execute() => Console.WriteLine("running");
}`,
    explanation: "The file access modifier (C# 11) restricts a type to the file it's defined in. It's ideal for source-generator helper types and implementation details that should never be referenced externally.",
  },
  {
    id: "cs-generic-covariance-interface",
    language: "csharp",
    title: "Interface covariance and contravariance",
    tag: "understanding",
    code: `// IEnumerable<T> is covariant (out T) — T only in output position.
IEnumerable<string> strings = new List<string> { "a", "b" };
IEnumerable<object> objects = strings;   // OK — string is-a object

// IComparer<T> is contravariant (in T) — T only in input position.
IComparer<object> objComparer = Comparer<object>.Default;
IComparer<string> strComparer = objComparer;   // OK — contravariant

// Action<T> is contravariant; Func<T> return is covariant.
Action<object> act = o => Console.WriteLine(o);
Action<string> actStr = act;   // OK`,
    explanation: "Covariance (out) allows a more derived type to be used where a base type is expected. Contravariance (in) allows a more general type where a specific one is expected. Both are only possible on interface/delegate type parameters.",
  },
  {
    id: "cs-top-level-args",
    language: "csharp",
    title: "Top-level statements and args",
    tag: "snippet",
    code: `// Program.cs — no class or Main method needed.
// 'args' is the implicit string[] parameter.

if (args.Length == 0)
{
    Console.WriteLine("No arguments provided.");
    return 1;   // exit code
}

foreach (string arg in args)
    Console.WriteLine($"Arg: {arg}");

return 0;`,
    explanation: "Top-level statements (C# 9) make the entire file implicitly the entry point. The args variable is automatically in scope. return sets the process exit code. Only one file per compilation may use top-level statements.",
  },
  {
    id: "cs-nuint-arithmetic",
    language: "csharp",
    title: "nint / nuint — native-sized integers",
    tag: "types",
    code: `// nint is IntPtr; nuint is UIntPtr — size matches pointer width.
nint  a = 100;
nuint b = 200u;

Console.WriteLine(IntPtr.Size);   // 8 on 64-bit, 4 on 32-bit

// Arithmetic operators work like built-in int/uint.
nint sum = a + (nint)b;
Console.WriteLine(sum);   // 300`,
    explanation: "nint and nuint (C# 9) are aliases for IntPtr and UIntPtr with native arithmetic operators. They are 4 bytes on 32-bit runtimes and 8 bytes on 64-bit — useful for interop and pointer math without casts.",
  },
  {
    id: "cs-concurrent-bag",
    language: "csharp",
    title: "ConcurrentBag<T> — unordered thread-safe collection",
    tag: "snippet",
    code: `using System.Collections.Concurrent;

var bag = new ConcurrentBag<int>();

Parallel.For(0, 100, i => bag.Add(i));

Console.WriteLine($"Count: {bag.Count}");   // 100

// TryTake removes an arbitrary item — order is not guaranteed.
if (bag.TryTake(out int item))
    Console.WriteLine($"Took: {item}");

// TryPeek reads without removing.
bag.TryPeek(out int peeked);`,
    explanation: "ConcurrentBag<T> is thread-safe but unordered. It uses thread-local storage to minimize contention — ideal for producer-consumer patterns where each thread mostly consumes its own items.",
  },
  {
    id: "cs-nullable-warnings",
    language: "csharp",
    title: "Nullable reference warnings — common patterns",
    tag: "caveats",
    code: `#nullable enable

string? name = GetName();    // may be null

// CS8602 — Dereference of possibly null reference.
// Console.WriteLine(name.Length);  // warning

// Null check before use.
if (name is not null)
    Console.WriteLine(name.Length);  // OK — narrowed

// Null-forgiving operator — suppress warning (use sparingly).
Console.WriteLine(name!.Length);   // crashes at runtime if null

string GetName() => null!;`,
    explanation: "Enabling nullable reference types (#nullable enable) makes the compiler track nullability flow. The null-forgiving operator ! silences warnings but shifts the burden of correctness to you — crashes at runtime if wrong.",
  },
  {
    id: "cs-using-alias-type",
    language: "csharp",
    title: "using type alias (C# 12)",
    tag: "snippet",
    code: `// C# 12 allows aliasing any type, including generics and tuples.
using Point = (double X, double Y);
using StringMap = System.Collections.Generic.Dictionary<string, string>;

Point origin = (0, 0);
Console.WriteLine(origin.X);   // 0

StringMap config = new() { ["env"] = "prod" };
Console.WriteLine(config["env"]);  // prod`,
    explanation: "C# 12 extends using aliases to any type — tuples, arrays, generics. This eliminates verbose generic signatures in frequently-used type positions and improves domain readability.",
  },
  {
    id: "cs-dispose-pattern",
    language: "csharp",
    title: "IDisposable full dispose pattern",
    tag: "snippet",
    code: `class SafeHandle : IDisposable
{
    private bool _disposed = false;
    private IntPtr _handle = AllocHandle();

    public void Dispose()
    {
        Dispose(disposing: true);
        GC.SuppressFinalize(this);
    }

    protected virtual void Dispose(bool disposing)
    {
        if (_disposed) return;
        if (disposing) { /* free managed resources */ }
        FreeHandle(_handle);   // always free unmanaged
        _disposed = true;
    }

    ~SafeHandle() => Dispose(disposing: false);

    private static IntPtr AllocHandle() => IntPtr.Zero;
    private static void FreeHandle(IntPtr h) { }
}`,
    explanation: "The full dispose pattern separates managed cleanup (only in Dispose(true)) from unmanaged cleanup (both paths). GC.SuppressFinalize avoids running the finalizer when Dispose was already called.",
  },
  {
    id: "cs-task-run-cancel",
    language: "csharp",
    title: "Task.Run with CancellationToken",
    tag: "snippet",
    code: `using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(2));
CancellationToken ct = cts.Token;

var task = Task.Run(() =>
{
    for (int i = 0; i < 100; i++)
    {
        ct.ThrowIfCancellationRequested();
        Thread.Sleep(100);   // simulate CPU work
        Console.Write('.');
    }
}, ct);

try   { await task; }
catch (OperationCanceledException) { Console.WriteLine("\nCancelled."); }`,
    explanation: "Pass the CancellationToken to both Task.Run and inside the delegate. The token in Task.Run allows the runtime to avoid scheduling the task at all if already cancelled before it starts.",
  },
  {
    id: "cs-lazy-t",
    language: "csharp",
    title: "Lazy<T> — thread-safe lazy initialization",
    tag: "snippet",
    code: `// Thread-safe by default (LazyThreadSafetyMode.ExecutionAndPublication).
var lazy = new Lazy<List<string>>(() =>
{
    Console.WriteLine("Initializing...");
    return new List<string> { "a", "b" };
});

Console.WriteLine(lazy.IsValueCreated);  // False
Console.WriteLine(lazy.Value.Count);     // Initializing... then 2
Console.WriteLine(lazy.IsValueCreated);  // True
// Second access does NOT re-run the factory.
Console.WriteLine(lazy.Value.Count);     // 2`,
    explanation: "Lazy<T> defers construction until first access and guarantees the factory runs exactly once across all threads (with default thread safety mode). Use it for expensive objects that may not always be needed.",
  },
  {
    id: "cs-span-stackalloc",
    language: "csharp",
    title: "stackalloc with Span<T>",
    tag: "snippet",
    code: `// stackalloc allocates on the stack — zero GC pressure, freed on return.
Span<int> buffer = stackalloc int[64];
for (int i = 0; i < buffer.Length; i++)
    buffer[i] = i * i;

Console.WriteLine(buffer[7]);   // 49

// Safe: Span<T> ensures no out-of-bounds access without unsafe.
// stackalloc > 1KB should be avoided — risk of stack overflow.`,
    explanation: "stackalloc with Span<T> gives C-like stack allocation without unsafe pointers. The Span wrapper bounds-checks every access. Keep stackalloc buffers small (< 1 KB) to avoid stack overflow.",
  },
  {
    id: "cs-marshal-class",
    language: "csharp",
    title: "Marshal — interop memory operations",
    tag: "snippet",
    code: `using System.Runtime.InteropServices;

// Read a struct from unmanaged memory.
[StructLayout(LayoutKind.Sequential)]
struct Point { public int X; public int Y; }

IntPtr ptr = Marshal.AllocHGlobal(Marshal.SizeOf<Point>());
try
{
    Marshal.StructureToPtr(new Point { X = 1, Y = 2 }, ptr, false);
    Point result = Marshal.PtrToStructure<Point>(ptr);
    Console.WriteLine($"{result.X}, {result.Y}");   // 1, 2
}
finally
{
    Marshal.FreeHGlobal(ptr);
}`,
    explanation: "Marshal provides the bridge between managed and unmanaged memory. Always free AllocHGlobal in finally. For routine interop, prefer SafeHandle subclasses over raw IntPtr to prevent handle leaks.",
  },
  {
    id: "cs-pinvoke-advanced",
    language: "csharp",
    title: "P/Invoke with string marshalling",
    tag: "snippet",
    code: `using System.Runtime.InteropServices;

class NativeLib
{
    // char* GetVersion() — returns null-terminated UTF-8 string.
    [DllImport("mynativelib", CharSet = CharSet.Ansi)]
    private static extern IntPtr GetVersion();

    public static string Version =>
        Marshal.PtrToStringAnsi(GetVersion()) ?? "";

    // Pass a managed string to native code.
    [DllImport("mynativelib")]
    public static extern int ProcessData(
        [MarshalAs(UnmanagedType.LPStr)] string data,
        int length);
}`,
    explanation: "P/Invoke handles managed-to-native transitions. Use CharSet.Ansi/Unicode to control string encoding. MarshalAs attributes fine-tune marshalling per parameter. Never free the pointer returned by extern functions unless the contract says so.",
  },
  {
    id: "cs-delegate-multicast",
    language: "csharp",
    title: "Multicast delegates",
    tag: "snippet",
    code: `Action<string> log = msg => Console.WriteLine($"[LOG] {msg}");
Action<string> audit = msg => Console.WriteLine($"[AUDIT] {msg}");

// Combine into a multicast delegate.
Action<string> all = log + audit;
all("user logged in");
// [LOG] user logged in
// [AUDIT] user logged in

// Remove a subscriber.
all -= audit;
all("user logged out");
// [LOG] user logged out`,
    explanation: "Every delegate in C# is a multicast delegate — it maintains a list of method references. += adds, -= removes. If an invocation target throws, subsequent targets are not called and the exception propagates.",
  },
  {
    id: "cs-event-pattern",
    language: "csharp",
    title: "Event pattern with EventHandler<T>",
    tag: "snippet",
    code: `class Button
{
    // Declare the event.
    public event EventHandler<string>? Clicked;

    public void Click() =>
        Clicked?.Invoke(this, "left button");
}

var btn = new Button();

// Subscribe.
btn.Clicked += (sender, data) =>
    Console.WriteLine($"Clicked: {data}");

btn.Click();   // Clicked: left button`,
    explanation: "Events restrict delegate access: external code can only subscribe (+=) or unsubscribe (-=), not invoke directly or reassign. EventHandler<TEventArgs> is the standard signature for events in .NET.",
  },
  {
    id: "cs-func-action-predicate",
    language: "csharp",
    title: "Func, Action, and Predicate delegates",
    tag: "types",
    code: `// Action — no return value.
Action<string> print = Console.WriteLine;
print("hello");

// Func — has return value; last type parameter is return type.
Func<int, int, int> add = (a, b) => a + b;
Console.WriteLine(add(2, 3));   // 5

// Predicate<T> — same as Func<T, bool>.
Predicate<int> isEven = n => n % 2 == 0;
Console.WriteLine(isEven(4));   // True

// Compose.
Func<int, bool> isPositive = n => n > 0;
var positiveEvens = Enumerable.Range(-5, 11)
    .Where(n => isEven(n) && isPositive(n));
Console.WriteLine(string.Join(",", positiveEvens));   // 2,4`,
    explanation: "Func<T1,...,TResult> and Action<T1,...> are the standard generic delegate types. Predicate<T> is an alias for Func<T, bool>. Prefer these over custom delegate types unless you need event semantics.",
  },
  {
    id: "cs-expression-trees",
    language: "csharp",
    title: "Expression trees — code as data",
    tag: "understanding",
    code: `using System.Linq.Expressions;

// Capture a lambda as a data structure, not compiled code.
Expression<Func<int, bool>> expr = x => x > 5;

// Inspect the tree.
var body = (BinaryExpression)expr.Body;
Console.WriteLine(body.NodeType);    // GreaterThan
Console.WriteLine(body.Left);        // x
Console.WriteLine(body.Right);       // 5

// Compile and invoke.
Func<int, bool> fn = expr.Compile();
Console.WriteLine(fn(10));   // True`,
    explanation: "Expression trees represent code as inspectable/modifiable data. LINQ providers (EF Core, remote LINQ) use them to translate lambda predicates into SQL or other query languages at runtime.",
  },
  {
    id: "cs-linq-deferred-execution",
    language: "csharp",
    title: "LINQ deferred vs immediate execution",
    tag: "understanding",
    code: `var list = new List<int> { 1, 2, 3 };

// Deferred — query is not executed yet.
var query = list.Where(x => x > 1).Select(x => x * 10);

list.Add(4);   // mutate the source

// Execution happens NOW — includes 4.
foreach (int n in query)
    Console.Write(n + " ");
// 20 30 40

// Immediate — ToList() executes right away.
var snapshot = list.Where(x => x > 1).Select(x => x * 10).ToList();
list.Add(5);   // snapshot does NOT include 5`,
    explanation: "Most LINQ operators are lazy — they build a pipeline but don't iterate until you enumerate. ToList(), ToArray(), Count(), and First() are eager and execute immediately. Deferred execution can surprise when the source mutates.",
  },
  {
    id: "cs-linq-groupby",
    language: "csharp",
    title: "LINQ GroupBy",
    tag: "snippet",
    code: `record Employee(string Name, string Dept, decimal Salary);

var employees = new[]
{
    new Employee("Ada",   "Eng",  120_000m),
    new Employee("Linus", "Eng",   95_000m),
    new Employee("Grace", "Mgmt", 140_000m),
    new Employee("Ken",   "Mgmt", 130_000m),
};

var byDept = employees
    .GroupBy(e => e.Dept)
    .Select(g => new
    {
        Dept    = g.Key,
        Count   = g.Count(),
        AvgPay  = g.Average(e => e.Salary),
    });

foreach (var d in byDept)
    Console.WriteLine($"{d.Dept}: {d.Count} people, avg {d.AvgPay:C0}");`,
    explanation: "GroupBy returns an IEnumerable<IGrouping<TKey,TElement>>. Each group has a Key and is itself enumerable. Chain Select to project each group into a summary object.",
  },
  {
    id: "cs-linq-let",
    language: "csharp",
    title: "LINQ let — intermediate variable in query syntax",
    tag: "snippet",
    code: `int[] numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

var result =
    from n in numbers
    let squared = n * n           // compute once, use twice
    where squared > 10
    select new { n, squared };

foreach (var r in result)
    Console.WriteLine($"{r.n}^2 = {r.squared}");
// 4^2 = 16  5^2 = 25 ... 10^2 = 100`,
    explanation: "The let clause introduces a named intermediate value in query syntax, avoiding repeated computation. It's equivalent to a chained .Select() that adds a new field to an anonymous type.",
  },
  {
    id: "cs-linq-zip",
    language: "csharp",
    title: "LINQ Zip — merge two sequences",
    tag: "snippet",
    code: `int[]    nums  = [1, 2, 3, 4];
string[] words = ["one", "two", "three", "four"];

// Zip pairs corresponding elements.
var pairs = nums.Zip(words, (n, w) => $"{n}={w}");
Console.WriteLine(string.Join(", ", pairs));
// 1=one, 2=two, 3=three, 4=four

// Stops at the shorter sequence.
int[] a = [1, 2, 3];
int[] b = [10, 20];
var sums = a.Zip(b, (x, y) => x + y);
Console.WriteLine(string.Join(", ", sums));   // 11, 22`,
    explanation: "Zip combines two sequences element by element using a result selector. It is lazy and stops at the shorter sequence. Without a selector, it returns tuples (the 2-arg overload added in .NET 5).",
  },
  {
    id: "cs-linq-except-intersect",
    language: "csharp",
    title: "LINQ set operations — Except, Intersect, Union",
    tag: "snippet",
    code: `int[] a = [1, 2, 3, 4, 5];
int[] b = [3, 4, 5, 6, 7];

Console.WriteLine(string.Join(",", a.Union(b)));      // 1,2,3,4,5,6,7
Console.WriteLine(string.Join(",", a.Intersect(b)));  // 3,4,5
Console.WriteLine(string.Join(",", a.Except(b)));     // 1,2

// With a custom comparer.
var comparer = StringComparer.OrdinalIgnoreCase;
var s1 = new[] { "Apple", "Banana" };
var s2 = new[] { "apple", "Cherry" };
Console.WriteLine(string.Join(",", s1.Intersect(s2, comparer)));  // Apple`,
    explanation: "LINQ set operations use the element's Equals/GetHashCode by default. For reference types or case-insensitive matching, pass an IEqualityComparer<T> as the second argument.",
  },
  {
    id: "cs-linq-selectmany",
    language: "csharp",
    title: "LINQ SelectMany — flatten one level",
    tag: "snippet",
    code: `var orders = new[]
{
    new { Id = 1, Items = new[] { "apple", "banana" } },
    new { Id = 2, Items = new[] { "cherry" } },
    new { Id = 3, Items = new[] { "date", "elderberry" } },
};

// Flatten: one item per element of each Items array.
var allItems = orders.SelectMany(o => o.Items);
Console.WriteLine(string.Join(", ", allItems));
// apple, banana, cherry, date, elderberry

// With index.
var withId = orders.SelectMany(
    o => o.Items,
    (o, item) => $"[{o.Id}] {item}");`,
    explanation: "SelectMany is the LINQ equivalent of a nested loop — it flattens a sequence of sequences into one. The two-argument overload provides both the outer element and the inner element to the result selector.",
  },
  {
    id: "cs-linq-aggregate",
    language: "csharp",
    title: "LINQ Aggregate — general fold",
    tag: "snippet",
    code: `int[] nums = [1, 2, 3, 4, 5];

// Simple: sum without a seed.
int product = nums.Aggregate((acc, x) => acc * x);
Console.WriteLine(product);  // 120

// With seed and result selector.
string csv = nums.Aggregate(
    seed: new System.Text.StringBuilder(),
    func: (sb, n) => sb.Append(n).Append(','),
    resultSelector: sb => sb.ToString().TrimEnd(',')
);
Console.WriteLine(csv);  // 1,2,3,4,5`,
    explanation: "Aggregate is the general-purpose fold. Without a seed it uses the first element; with a seed you control the accumulator type. The result selector transforms the final accumulator into the output type.",
  },
  {
    id: "cs-string-builder-patterns",
    language: "csharp",
    title: "StringBuilder — efficient string building",
    tag: "snippet",
    code: `var sb = new System.Text.StringBuilder();
sb.Append("Hello");
sb.Append(", ");
sb.AppendLine("World!");    // adds + newline
sb.AppendFormat("Count: {0}", 42);
sb.Insert(0, ">>> ");       // insert at position

Console.WriteLine(sb.ToString());
// >>> Hello, World!
// Count: 42

// Chaining (each method returns 'this').
string result = new System.Text.StringBuilder()
    .Append("a").Append("b").Append("c").ToString();`,
    explanation: "String concatenation with + in a loop is O(n²) — each + creates a new string. StringBuilder maintains a resizable char array, making repeated Append O(1) amortized. Use it whenever you build a string incrementally.",
  },
  {
    id: "cs-string-format-composite",
    language: "csharp",
    title: "String.Format composite formatting",
    tag: "snippet",
    code: `// Positional placeholders.
string s = string.Format("{0} + {1} = {2}", 1, 2, 3);
Console.WriteLine(s);   // 1 + 2 = 3

// Format specifiers.
double pi = Math.PI;
Console.WriteLine(string.Format("{0:F2}", pi));    // 3.14
Console.WriteLine(string.Format("{0:C}",  1234.5)); // $1,234.50 (locale)
Console.WriteLine(string.Format("{0:X}",  255));    // FF

// Named arguments with FormattableString (C# 6+).
int x = 10;
FormattableString fs = $"x = {x:D3}";
Console.WriteLine(fs.ToString());  // x = 010`,
    explanation: "String.Format uses composite format strings with {index:formatSpec} placeholders. Standard format specifiers (D, F, X, C, N, P) handle digits, fixed-point, hex, currency, number, and percent.",
  },
  {
    id: "cs-span-string-operations",
    language: "csharp",
    title: "Span<char> for allocation-free string parsing",
    tag: "snippet",
    code: `ReadOnlySpan<char> line = "2024-05-06T12:30:00";

// Slice without allocating a new string.
ReadOnlySpan<char> datePart = line[..10];   // "2024-05-06"
ReadOnlySpan<char> timePart = line[11..];   // "12:30:00"

// Parse int without ToString() first.
int year = int.Parse(datePart[..4]);
Console.WriteLine(year);  // 2024

// Split without allocating a string[].
foreach (System.Range range in datePart.Split('-'))
    Console.Write(datePart[range].ToString() + " ");
// 2024 05 06`,
    explanation: "ReadOnlySpan<char> methods like Split, IndexOf, and StartsWith work directly on the span without allocating strings. This is the key technique for high-performance text parsing pipelines.",
  },
  {
    id: "cs-pattern-matching-advanced",
    language: "csharp",
    title: "Pattern matching with nested types",
    tag: "snippet",
    code: `abstract record Shape;
record Circle(double Radius) : Shape;
record Rectangle(double W, double H) : Shape;
record Triangle(double Base, double Height) : Shape;

double Area(Shape shape) => shape switch
{
    Circle { Radius: var r }        => Math.PI * r * r,
    Rectangle { W: var w, H: var h } => w * h,
    Triangle { Base: var b, Height: var h } => 0.5 * b * h,
    _ => throw new ArgumentException("unknown shape"),
};

Console.WriteLine(Area(new Circle(5)));         // 78.54
Console.WriteLine(Area(new Rectangle(4, 6)));   // 24`,
    explanation: "Property patterns match against the properties of a type captured in a type pattern. Combining type pattern + property pattern + variable capture gives you exhaustive, readable shape dispatch.",
  },
  {
    id: "cs-interface-default-impl",
    language: "csharp",
    title: "Interface default implementation (C# 8)",
    tag: "snippet",
    code: `interface ILogger
{
    void Log(string message);

    // Default implementation — new virtual members without breaking implementors.
    void LogWarning(string message) => Log($"[WARN] {message}");
    void LogError(string message)   => Log($"[ERR] {message}");
}

class ConsoleLogger : ILogger
{
    public void Log(string message) => Console.WriteLine(message);
    // LogWarning and LogError are inherited from the interface.
}

ILogger logger = new ConsoleLogger();
logger.LogWarning("disk almost full");  // [WARN] disk almost full`,
    explanation: "Default interface implementations allow adding new methods to an interface without breaking existing implementors. They are accessible only through the interface type — not through the concrete class variable.",
  },
  {
    id: "cs-covariant-return-types",
    language: "csharp",
    title: "Covariant return types (C# 9)",
    tag: "snippet",
    code: `class Animal
{
    public virtual Animal Clone() => new Animal();
}

class Dog : Animal
{
    // Return type is more derived — covariant return.
    public override Dog Clone() => new Dog();
}

Dog d = new Dog();
Dog clone = d.Clone();   // no cast needed
Console.WriteLine(clone.GetType().Name);  // Dog`,
    explanation: "Covariant return types (C# 9) allow overrides to declare a more derived return type than the base method. The override is still virtual — callers through the base type still see the base return type.",
  },
  {
    id: "cs-records-advanced",
    language: "csharp",
    title: "Records — advanced features",
    tag: "snippet",
    code: `// Records can have additional members.
record Person(string Name, int Age)
{
    // Computed property (not a record parameter).
    public bool IsAdult => Age >= 18;

    // Custom validation in the auto-generated ctor.
    public Person
    {
        if (Age < 0) throw new ArgumentException("Age must be >= 0");
    }
}

var p = new Person("Ada", 36);
Console.WriteLine(p.IsAdult);   // True
Console.WriteLine(p);           // Person { Name = Ada, Age = 36 }`,
    explanation: "Records support additional properties, methods, and a compact constructor syntax (no parameter list in braces) for validation. The compact constructor runs before the auto-generated property assignments.",
  },
  {
    id: "cs-iequatable",
    language: "csharp",
    title: "IEquatable<T> — typed equality",
    tag: "snippet",
    code: `class Point : IEquatable<Point>
{
    public int X, Y;

    public bool Equals(Point? other) =>
        other is not null && X == other.X && Y == other.Y;

    // Also override object.Equals and GetHashCode for consistency.
    public override bool Equals(object? obj) => Equals(obj as Point);
    public override int GetHashCode() => HashCode.Combine(X, Y);

    public static bool operator ==(Point? a, Point? b) =>
        a?.Equals(b) ?? b is null;
    public static bool operator !=(Point? a, Point? b) => !(a == b);
}

Console.WriteLine(new Point { X=1, Y=2 } == new Point { X=1, Y=2 });  // True`,
    explanation: "IEquatable<T> provides a typed Equals(T) avoiding the boxing and cast overhead of object.Equals. Always also override GetHashCode so the object can be used in hash-based collections consistently.",
  },
  {
    id: "cs-icomparable",
    language: "csharp",
    title: "IComparable<T> — ordering support",
    tag: "snippet",
    code: `class Version : IComparable<Version>
{
    public int Major, Minor, Patch;

    public int CompareTo(Version? other)
    {
        if (other is null) return 1;
        int c = Major.CompareTo(other.Major); if (c != 0) return c;
            c = Minor.CompareTo(other.Minor); if (c != 0) return c;
        return Patch.CompareTo(other.Patch);
    }
}

var versions = new[]
{
    new Version { Major=1, Minor=2, Patch=3 },
    new Version { Major=1, Minor=0, Patch=9 },
    new Version { Major=2, Minor=0, Patch=0 },
};
Array.Sort(versions);
Console.WriteLine(versions[0].Major);  // 1 (smallest)`,
    explanation: "IComparable<T> enables objects to be sorted by Array.Sort, List.Sort, and LINQ OrderBy without a separate Comparer. Return negative, zero, or positive to indicate less than, equal, or greater than.",
  },
  {
    id: "cs-dependency-injection",
    language: "csharp",
    title: "Dependency injection — constructor injection",
    tag: "snippet",
    code: `interface IEmailSender
{
    Task SendAsync(string to, string subject, string body);
}

class OrderService
{
    private readonly IEmailSender _email;

    // Dependency injected through constructor.
    public OrderService(IEmailSender email) => _email = email;

    public async Task PlaceOrder(string userId)
    {
        // ... order logic ...
        await _email.SendAsync(userId, "Order placed", "Your order is confirmed.");
    }
}

// Registration (Microsoft.Extensions.DependencyInjection):
// services.AddScoped<IEmailSender, SmtpEmailSender>();
// services.AddScoped<OrderService>();`,
    explanation: "Constructor injection is the preferred DI pattern: dependencies are explicit, the class is testable (swap IEmailSender with a fake), and the container validates that all dependencies are registered at startup.",
  },
  {
    id: "cs-options-pattern",
    language: "csharp",
    title: "Options pattern — strongly typed configuration",
    tag: "snippet",
    code: `// appsettings.json: { "Email": { "From": "no-reply@app.com", "Port": 587 } }

class EmailOptions
{
    public string From { get; set; } = "";
    public int    Port { get; set; } = 25;
}

// Registration:
// builder.Services.Configure<EmailOptions>(
//     builder.Configuration.GetSection("Email"));

// Consumption:
class Mailer(IOptions<EmailOptions> opts)
{
    private readonly EmailOptions _cfg = opts.Value;

    public void Send() => Console.WriteLine($"From: {_cfg.From}:{_cfg.Port}");
}`,
    explanation: "The Options pattern binds configuration sections to strongly typed classes. IOptions<T> is singleton-lifetime; IOptionsSnapshot<T> re-reads per-request; IOptionsMonitor<T> supports live reload.",
  },
  {
    id: "cs-middleware-pipeline",
    language: "csharp",
    title: "Middleware pipeline concept",
    tag: "understanding",
    code: `// ASP.NET Core middleware: each component calls next() to pass control.
app.Use(async (context, next) =>
{
    Console.WriteLine("Before");
    await next(context);         // call next middleware
    Console.WriteLine("After");
});

app.Use(async (context, next) =>
{
    Console.WriteLine("Inner Before");
    await next(context);
    Console.WriteLine("Inner After");
});

app.Run(async context =>
    await context.Response.WriteAsync("Hello!"));

// Output order:
// Before → Inner Before → Inner After → After`,
    explanation: "ASP.NET Core middleware is a pipeline of Request→Response delegates. Each middleware receives a next delegate and calls it to pass control forward. The response is processed as the call stack unwinds.",
  },
  {
    id: "cs-minimal-api",
    language: "csharp",
    title: "Minimal API — concise HTTP endpoints",
    tag: "snippet",
    code: `var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

// GET /greet?name=Ada
app.MapGet("/greet", (string name = "World") =>
    Results.Ok($"Hello, {name}!"));

// POST /items with JSON body
app.MapPost("/items", (Item item) =>
    Results.Created($"/items/{item.Id}", item));

app.Run();

record Item(int Id, string Name);`,
    explanation: "Minimal APIs (ASP.NET Core 6+) replace Controller/Action plumbing with MapGet/MapPost/etc. Parameters are bound from route, query string, or JSON body automatically. Results.Ok/Created produce typed HTTP responses.",
  },
  {
    id: "cs-ef-core-basics",
    language: "csharp",
    title: "EF Core — basic CRUD",
    tag: "snippet",
    code: `class AppDb : DbContext
{
    public DbSet<User> Users => Set<User>();
    protected override void OnConfiguring(DbContextOptionsBuilder o)
        => o.UseSqlite("Data Source=app.db");
}

class User { public int Id { get; set; } public string Name { get; set; } = ""; }

using var db = new AppDb();
db.Database.EnsureCreated();

// Create.
db.Users.Add(new User { Name = "Ada" });
await db.SaveChangesAsync();

// Read.
var user = await db.Users.FirstAsync(u => u.Name == "Ada");

// Update.
user.Name = "Ada Lovelace";
await db.SaveChangesAsync();

// Delete.
db.Users.Remove(user);
await db.SaveChangesAsync();`,
    explanation: "EF Core wraps change tracking around DbSets. SaveChangesAsync translates pending Add/Modify/Delete operations into SQL. Use AsNoTracking() for read-only queries to skip change tracking overhead.",
  },
  {
    id: "cs-record-json",
    language: "csharp",
    title: "System.Text.Json with records",
    tag: "snippet",
    code: `using System.Text.Json;
using System.Text.Json.Serialization;

record Product(
    [property: JsonPropertyName("product_name")] string Name,
    decimal Price,
    [property: JsonIgnore] string InternalCode = ""
);

var p = new Product("Widget", 9.99m, "INTERNAL");
string json = JsonSerializer.Serialize(p);
Console.WriteLine(json);
// {"product_name":"Widget","Price":9.99}

var p2 = JsonSerializer.Deserialize<Product>(json);
Console.WriteLine(p2?.Name);  // Widget`,
    explanation: "System.Text.Json serializes records using their constructor parameters (immutable by default). JsonPropertyName renames keys; JsonIgnore excludes members. Use JsonSerializerOptions for global settings.",
  },
  {
    id: "cs-span-parse",
    language: "csharp",
    title: "Parsing from Span<char> — zero allocation",
    tag: "snippet",
    code: `ReadOnlySpan<char> input = "42 3.14 true";

// Split and parse without creating intermediate strings.
int    i = int.Parse(input[..2]);
double d = double.Parse(input[3..7]);
bool   b = bool.Parse(input[8..]);

Console.WriteLine(i);  // 42
Console.WriteLine(d);  // 3.14
Console.WriteLine(b);  // True

// Most primitive types support TryParse(ReadOnlySpan<char>).
ReadOnlySpan<char> num = "12345";
bool ok = int.TryParse(num, out int result);`,
    explanation: "Most .NET primitive parse methods have overloads that accept ReadOnlySpan<char>, enabling zero-allocation parsing from slices of larger strings or memory-mapped files.",
  },
  {
    id: "cs-valuetask",
    language: "csharp",
    title: "ValueTask<T> — avoid allocation for hot paths",
    tag: "snippet",
    code: `class Cache
{
    private readonly Dictionary<string, int> _store = new();

    // Returns ValueTask — synchronous path (cache hit) allocates nothing.
    public ValueTask<int> GetAsync(string key)
    {
        if (_store.TryGetValue(key, out int val))
            return ValueTask.FromResult(val);   // no allocation

        return new ValueTask<int>(FetchFromDb(key));
    }

    private async Task<int> FetchFromDb(string key)
    {
        await Task.Delay(10);   // simulate async DB call
        return _store[key] = 42;
    }
}`,
    explanation: "ValueTask<T> is a struct that wraps either a synchronous result or an actual Task<T>. On the synchronous path it avoids a heap allocation. Use it for methods that are often synchronous (cache hits, buffered reads).",
  },
  {
    id: "cs-iasyncenumerable-cancel",
    language: "csharp",
    title: "IAsyncEnumerable with CancellationToken",
    tag: "snippet",
    code: `async IAsyncEnumerable<int> GenerateAsync(
    int count,
    [System.Runtime.CompilerServices.EnumeratorCancellation]
    CancellationToken ct = default)
{
    for (int i = 0; i < count; i++)
    {
        ct.ThrowIfCancellationRequested();
        await Task.Delay(50, ct);
        yield return i;
    }
}

using var cts = new CancellationTokenSource(TimeSpan.FromMilliseconds(200));
await foreach (int v in GenerateAsync(100).WithCancellation(cts.Token))
    Console.Write(v + " ");`,
    explanation: "[EnumeratorCancellation] marks the parameter that WithCancellation() injects the token into. This allows callers to cancel enumeration via WithCancellation without requiring a separate overload.",
  },
  {
    id: "cs-record-with-collection",
    language: "csharp",
    title: "Immutable records with collection properties",
    tag: "caveats",
    code: `using System.Collections.Immutable;

record Team(string Name, ImmutableList<string> Members);

var team = new Team("Alpha", ImmutableList.Create("Ada", "Linus"));

// 'with' copies the reference, not the list contents.
var teamV2 = team with { Members = team.Members.Add("Grace") };

Console.WriteLine(team.Members.Count);    // 2 — original unchanged
Console.WriteLine(teamV2.Members.Count);  // 3`,
    explanation: "Record with expressions perform shallow copies. If a property is a mutable collection (List<T>), both the old and new record share the same list. Use ImmutableList<T> or ToImmutableList() to maintain true immutability.",
  },
  {
    id: "cs-source-generated-regex",
    language: "csharp",
    title: "Source-generated Regex (C# 12)",
    tag: "snippet",
    code: `using System.Text.RegularExpressions;

partial class Parser
{
    // Compiled at build time — zero startup cost, AOT-friendly.
    [GeneratedRegex(@"(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})")]
    private static partial Regex DateRegex();

    public static (string y, string m, string d)? ParseDate(string input)
    {
        var m = DateRegex().Match(input);
        if (!m.Success) return null;
        return (m.Groups["year"].Value,
                m.Groups["month"].Value,
                m.Groups["day"].Value);
    }
}`,
    explanation: "[GeneratedRegex] emits the compiled DFA state machine as C# source at build time. It is faster than new Regex() at startup, works with Native AOT, and avoids allocating a Regex object per call.",
  },
  {
    id: "cs-struct-interface",
    language: "csharp",
    title: "Struct implementing an interface — boxing pitfall",
    tag: "caveats",
    code: `interface ICounter { void Increment(); int Value { get; } }

struct Counter : ICounter
{
    public int Value { get; private set; }
    public void Increment() => Value++;
}

Counter c = new Counter();
c.Increment();
Console.WriteLine(c.Value);   // 1 — struct mutation OK here

ICounter ic = c;              // BOXES c — copies to heap
ic.Increment();               // mutates the BOXED copy
Console.WriteLine(c.Value);   // still 1 — original unchanged
Console.WriteLine(ic.Value);  // 2 — boxed copy has 2`,
    explanation: "Assigning a struct to an interface variable boxes it — creates a heap copy. Mutating through the interface mutates the copy, not the original. Design mutable value types with care, or use classes instead.",
  },
  {
    id: "cs-pattern-matching-null",
    language: "csharp",
    title: "Pattern matching null checks",
    tag: "snippet",
    code: `string? name = null;

// All equivalent null checks — pattern matching forms are preferred.
bool isNull1 = name == null;
bool isNull2 = name is null;          // doesn't call operator==
bool isNull3 = name is not null;      // not null

// In switch expression.
string result = name switch
{
    null          => "nothing",
    { Length: 0 } => "empty string",
    var s         => $"has value: {s}",
};
Console.WriteLine(result);   // nothing`,
    explanation: "is null is preferred over == null because it cannot be overloaded — it always checks for true null, even if the type overrides operator==. The compiler also knows to flow-narrow the type after is not null.",
  },
  {
    id: "cs-memory-diagnostics",
    language: "csharp",
    title: "Measuring allocations with GC.GetAllocatedBytesForCurrentThread",
    tag: "snippet",
    code: `long before = GC.GetAllocatedBytesForCurrentThread();

// Code under test.
var list = new List<int>(Enumerable.Range(0, 1000));

long after = GC.GetAllocatedBytesForCurrentThread();
Console.WriteLine($"Allocated: {after - before:N0} bytes");

// For micro-benchmarks, use BenchmarkDotNet [MemoryDiagnoser].`,
    explanation: "GC.GetAllocatedBytesForCurrentThread() returns monotonically increasing bytes allocated on the current thread — useful for quick allocation budgeting without a full profiler. Does not include cross-thread allocations.",
  },
  {
    id: "cs-string-comparison-ordinal",
    language: "csharp",
    title: "String comparison — Ordinal vs Culture",
    tag: "caveats",
    code: `string a = "Straße";
string b = "Strasse";

// Culture-aware (German): ß == ss
Console.WriteLine(string.Compare(a, b, StringComparison.CurrentCulture));  // 0 (in de-DE)

// Ordinal: byte-by-byte
Console.WriteLine(string.Compare(a, b, StringComparison.Ordinal));  // non-zero

// Guidelines:
// - File paths, URLs, keys, identifiers  → OrdinalIgnoreCase
// - User-facing text display             → CurrentCulture / InvariantCulture
// - Dictionary keys (string)             → OrdinalIgnoreCase`,
    explanation: "StringComparison.Ordinal is fast and culture-invariant — the correct choice for identifiers, file paths, and dictionary keys. Culture-aware comparison handles human-language sorting but is slower and locale-dependent.",
  },
  {
    id: "cs-tuple-swap",
    language: "csharp",
    title: "Tuple deconstruction patterns",
    tag: "snippet",
    code: `// Named tuple fields.
var point = (X: 3, Y: 4);
Console.WriteLine(point.X + point.Y);  // 7

// Deconstruction into variables.
var (x, y) = point;
Console.WriteLine(x);  // 3

// Swap without temp variable.
(x, y) = (y, x);
Console.WriteLine($"{x}, {y}");  // 4, 3

// Return multiple values.
static (string First, string Last) SplitName(string full)
{
    var parts = full.Split(' ', 2);
    return (parts[0], parts.Length > 1 ? parts[1] : "");
}
var (first, last) = SplitName("Ada Lovelace");`,
    explanation: "Value tuples support named fields (X, Y), deconstruction into local variables, and swapping without a temporary. They are value types — no heap allocation — unlike Tuple<T1,T2> from .NET 4.",
  },
  {
    id: "cs-span-copy",
    language: "csharp",
    title: "Span<T> CopyTo and slicing",
    tag: "snippet",
    code: `int[] src = [1, 2, 3, 4, 5];
int[] dst = new int[5];

// CopyTo — equivalent to Array.Copy but works on any Span.
src.AsSpan().CopyTo(dst);

// TryCopyTo — returns false if destination too small.
bool ok = src.AsSpan().TryCopyTo(dst.AsSpan(0, 3));
Console.WriteLine(ok);  // False — dst slice has 3 elements

// SequenceEqual — element-wise comparison.
bool equal = src.AsSpan().SequenceEqual(dst);
Console.WriteLine(equal);  // True (after full copy)`,
    explanation: "Span<T>.CopyTo is the zero-overhead equivalent of Array.Copy. TryCopyTo is safe when the destination might be smaller. SequenceEqual compares element by element without LINQ overhead.",
  },
  {
    id: "cs-native-aot",
    language: "csharp",
    title: "Native AOT — publish as self-contained native binary",
    tag: "understanding",
    code: `<!-- csproj settings for Native AOT (.NET 8+) -->
<!--
<PropertyGroup>
  <PublishAot>true</PublishAot>
  <AllowUnsafeBlocks>true</AllowUnsafeBlocks>
</PropertyGroup>
-->

// AOT restrictions:
// - No runtime code generation (Reflection.Emit, dynamic)
// - No unbound generic instantiation via reflection
// - JsonSerializerContext required instead of reflection-based JSON
// - [GeneratedRegex] instead of new Regex(pattern) in hot paths

// Trimming-friendly pattern:
[System.Text.Json.Serialization.JsonSerializable(typeof(MyDto))]
partial class MyContext : System.Text.Json.Serialization.JsonSerializerContext { }`,
    explanation: "Native AOT compiles .NET to a standalone native binary with no JIT at runtime — sub-millisecond startup, lower memory use. Trade-off: no runtime reflection, restricted dynamic code, longer build times.",
  },
  {
    id: "cs-hot-reload",
    language: "csharp",
    title: "Hot Reload — edit-and-continue in .NET 6+",
    tag: "understanding",
    code: `// Hot Reload allows modifying method bodies while the app is running.
// Triggered automatically in 'dotnet watch' or via IDE 'Apply Code Changes'.

// Supported changes:
// - Method body edits
// - Adding new methods or properties
// - Adding fields (with caveats)

// Not supported:
// - Changing base types or interfaces
// - Adding attributes
// - Struct layout changes

// In code, hook into MetadataUpdateHandler to react to reloads:
// [System.Reflection.Metadata.MetadataUpdateHandler]
// static class MyHandler { static void UpdateApplication(Type[]? types) { ... } }`,
    explanation: "Hot Reload (dotnet watch / Visual Studio) applies method body changes to the running process without restart. Unsupported edits fall back to a full restart. Use MetadataUpdateHandler to clear caches on reload.",
  },
  {
    id: "cs-records-inheritance",
    language: "csharp",
    title: "Record inheritance",
    tag: "snippet",
    code: `record Animal(string Name, int Age);
record Dog(string Name, int Age, string Breed) : Animal(Name, Age);

var fido = new Dog("Fido", 3, "Labrador");
Console.WriteLine(fido);
// Dog { Name = Fido, Age = 3, Breed = Labrador }

// with works across inheritance.
var olderFido = fido with { Age = 4 };
Console.WriteLine(olderFido is Dog);   // True — type is preserved

// Equality respects the full derived type.
Console.WriteLine(new Animal("Fido", 3) == fido);   // False`,
    explanation: "Records support inheritance: the derived record includes all base parameters in its generated constructor and ToString. The with expression returns the correct derived type. Equality requires the same runtime type.",
  },
  {
    id: "cs-diagnostics-stopwatch",
    language: "csharp",
    title: "Stopwatch — high-resolution timing",
    tag: "snippet",
    code: `using System.Diagnostics;

var sw = Stopwatch.StartNew();

// Code to measure.
long sum = 0;
for (long i = 0; i < 10_000_000; i++) sum += i;

sw.Stop();

Console.WriteLine($"Elapsed: {sw.Elapsed.TotalMilliseconds:F2} ms");
Console.WriteLine($"Ticks:   {sw.ElapsedTicks}");
Console.WriteLine($"Freq:    {Stopwatch.Frequency} ticks/sec");`,
    explanation: "Stopwatch uses the highest-resolution timer available (QueryPerformanceCounter on Windows). ElapsedMilliseconds is a long; Elapsed is a TimeSpan. Prefer Stopwatch over DateTime.Now for elapsed time measurement.",
  },
  {
    id: "cs-process-start",
    language: "csharp",
    title: "Process.Start — launch external processes",
    tag: "snippet",
    code: `using System.Diagnostics;

var psi = new ProcessStartInfo
{
    FileName               = "git",
    Arguments              = "status",
    RedirectStandardOutput = true,
    RedirectStandardError  = true,
    UseShellExecute        = false,
};

using var process = Process.Start(psi)!;
string output = await process.StandardOutput.ReadToEndAsync();
await process.WaitForExitAsync();

Console.WriteLine($"Exit code: {process.ExitCode}");
Console.WriteLine(output);`,
    explanation: "Process.Start with RedirectStandardOutput captures the process output. UseShellExecute must be false to enable redirection. Always await WaitForExitAsync to avoid zombie processes and ensure all output is flushed.",
  },
  {
    id: "cs-environment-class",
    language: "csharp",
    title: "Environment — runtime and OS information",
    tag: "snippet",
    code: `Console.WriteLine(Environment.MachineName);
Console.WriteLine(Environment.OSVersion);
Console.WriteLine(Environment.ProcessorCount);
Console.WriteLine(Environment.Is64BitProcess);
Console.WriteLine(Environment.Version);  // .NET runtime version

// Environment variables.
string? path = Environment.GetEnvironmentVariable("PATH");
Environment.SetEnvironmentVariable("MY_VAR", "value");

// Exit code.
// Environment.Exit(1);  // immediate process termination`,
    explanation: "The Environment class provides runtime metadata — OS version, processor count, environment variables, and the working directory. Prefer Environment.Exit over Process.GetCurrentProcess().Kill() for clean shutdown.",
  },
  {
    id: "cs-path-combine",
    language: "csharp",
    title: "Path — file system path utilities",
    tag: "snippet",
    code: `string dir  = @"C:\Users\Ada";
string file = "report.txt";

// Combine handles separators correctly.
string full = Path.Combine(dir, file);
Console.WriteLine(full);  // C:\Users\Ada\report.txt

Console.WriteLine(Path.GetExtension(full));   // .txt
Console.WriteLine(Path.GetFileName(full));    // report.txt
Console.WriteLine(Path.GetFileNameWithoutExtension(full));  // report
Console.WriteLine(Path.GetDirectoryName(full));             // C:\Users\Ada

// Temp files.
string tmp = Path.GetTempFileName();`,
    explanation: "Path.Combine is the only safe way to build file paths — it handles duplicate/missing separators and is cross-platform. Never use string concatenation with / or \\ for paths.",
  },
  {
    id: "cs-file-readalltext",
    language: "csharp",
    title: "File and Directory — convenience APIs",
    tag: "snippet",
    code: `// Write and read text.
File.WriteAllText("data.txt", "Hello, World!");
string text = File.ReadAllText("data.txt");

// Append without overwriting.
File.AppendAllText("log.txt", "entry\n");

// Lines.
string[] lines = File.ReadAllLines("data.txt");

// Async versions.
await File.WriteAllTextAsync("async.txt", "async write");

// Directory operations.
Directory.CreateDirectory("output/logs");
string[] files = Directory.GetFiles(".", "*.cs", SearchOption.AllDirectories);`,
    explanation: "File and Directory provide simple convenience methods for common file operations. For large files, prefer streaming APIs (FileStream, StreamReader) to avoid loading everything into memory at once.",
  },
  {
    id: "cs-streamreader-writer",
    language: "csharp",
    title: "StreamReader and StreamWriter — buffered I/O",
    tag: "snippet",
    code: `// Write with auto-flush and encoding.
await using var writer = new StreamWriter("output.txt", append: false,
    encoding: System.Text.Encoding.UTF8, bufferSize: 4096);
await writer.WriteLineAsync("Line 1");
await writer.WriteLineAsync("Line 2");

// Read line by line — memory-efficient for large files.
using var reader = new StreamReader("output.txt");
while (!reader.EndOfStream)
{
    string? line = await reader.ReadLineAsync();
    Console.WriteLine(line);
}`,
    explanation: "StreamReader/StreamWriter buffer reads and writes, reducing system call overhead. The 4096-byte default buffer is a good default; increase for high-throughput sequential I/O. Always specify encoding explicitly.",
  },
  {
    id: "cs-json-options",
    language: "csharp",
    title: "JsonSerializerOptions — configuration",
    tag: "snippet",
    code: `using System.Text.Json;
using System.Text.Json.Serialization;

var options = new JsonSerializerOptions
{
    PropertyNamingPolicy         = JsonNamingPolicy.CamelCase,
    WriteIndented                = true,
    DefaultIgnoreCondition       = JsonIgnoreCondition.WhenWritingNull,
    NumberHandling               = JsonNumberHandling.AllowReadingFromString,
    Converters                   = { new JsonStringEnumConverter() },
};

record User(string Name, int? Age = null);

string json = JsonSerializer.Serialize(new User("Ada"), options);
Console.WriteLine(json);
// {"name":"Ada"}  — age omitted (null), camelCase`,
    explanation: "JsonSerializerOptions is reusable and thread-safe — create it once as a static field. CamelCase naming is standard for JSON APIs. JsonStringEnumConverter serializes enums as strings instead of integers.",
  },
  {
    id: "cs-httpclient-factory",
    language: "csharp",
    title: "IHttpClientFactory — managed HttpClient",
    tag: "snippet",
    code: `// Registration (Program.cs):
builder.Services.AddHttpClient("github", client =>
{
    client.BaseAddress = new Uri("https://api.github.com/");
    client.DefaultRequestHeaders.Add("User-Agent", "MyApp/1.0");
});

// Usage in a service:
class GitHubService(IHttpClientFactory factory)
{
    public async Task<string> GetUserAsync(string user)
    {
        using var client = factory.CreateClient("github");
        return await client.GetStringAsync($"users/{user}");
    }
}`,
    explanation: "IHttpClientFactory manages HttpClient lifetime, avoiding socket exhaustion from frequent new HttpClient() calls. Named clients pre-configure base address and headers; typed clients wrap the HttpClient in a dedicated service class.",
  },
  {
    id: "cs-polly-retry",
    language: "csharp",
    title: "Polly — resilience and retry policies",
    tag: "snippet",
    code: `using Polly;
using Polly.Retry;

// Build a retry pipeline: 3 retries with exponential backoff.
ResiliencePipeline pipeline = new ResiliencePipelineBuilder()
    .AddRetry(new RetryStrategyOptions
    {
        MaxRetryAttempts = 3,
        Delay            = TimeSpan.FromSeconds(1),
        BackoffType      = DelayBackoffType.Exponential,
        ShouldHandle     = new PredicateBuilder().Handle<HttpRequestException>(),
        OnRetry          = args =>
        {
            Console.WriteLine($"Retry {args.AttemptNumber}");
            return ValueTask.CompletedTask;
        },
    })
    .Build();

await pipeline.ExecuteAsync(async ct => await CallApi(ct));`,
    explanation: "Polly v8 uses a pipeline model to compose resilience strategies (retry, circuit breaker, timeout, bulkhead). Integrate it with IHttpClientFactory via AddResilienceHandler for automatic HTTP client resilience.",
  },
  {
    id: "cs-benchmark-dotnet",
    language: "csharp",
    title: "BenchmarkDotNet — micro-benchmarking",
    tag: "snippet",
    code: `using BenchmarkDotNet.Attributes;
using BenchmarkDotNet.Running;

[MemoryDiagnoser]
public class StringBenchmarks
{
    private const string Data = "Hello World Hello World";

    [Benchmark(Baseline = true)]
    public int UsingContains() => Data.Contains("World") ? 1 : 0;

    [Benchmark]
    public int UsingIndexOf() => Data.IndexOf("World") >= 0 ? 1 : 0;
}

// Program.cs
BenchmarkRunner.Run<StringBenchmarks>();`,
    explanation: "BenchmarkDotNet handles warmup, multiple iterations, statistical analysis, and allocation tracking — far more reliable than Stopwatch microbenchmarks. [MemoryDiagnoser] shows heap allocations per operation.",
  },
  {
    id: "cs-unsafe-basics",
    language: "csharp",
    title: "unsafe code — raw pointers",
    tag: "snippet",
    code: `unsafe static void Fill(int* arr, int count, int value)
{
    for (int i = 0; i < count; i++)
        arr[i] = value;
}

unsafe
{
    int[] nums = new int[5];
    fixed (int* p = nums)
    {
        Fill(p, nums.Length, 99);
    }
    Console.WriteLine(nums[0]);  // 99
}`,
    explanation: "unsafe allows raw pointer arithmetic, bypassing GC safety. fixed pins a managed array so the GC doesn't move it during the pointer operation. Reserve unsafe for P/Invoke interop and SIMD-level performance code.",
  },
  {
    id: "cs-number-formatting",
    language: "csharp",
    title: "Number formatting — standard and custom",
    tag: "snippet",
    code: `double pi = 3.14159265;
long   n  = 1_234_567;
int    hex = 0xDEAD;

Console.WriteLine(pi.ToString("F2"));     // 3.14
Console.WriteLine(pi.ToString("E3"));     // 3.142E+000
Console.WriteLine(n.ToString("N0"));      // 1,234,567
Console.WriteLine(n.ToString("C2"));      // $1,234,567.00 (locale)
Console.WriteLine(hex.ToString("X8"));    // 0000DEAD

// Custom format.
Console.WriteLine(n.ToString("#,##0.00")); // 1,234,567.00
Console.WriteLine(0.0567.ToString("P1"));  // 5.7%`,
    explanation: "Standard format specifiers (F, E, N, C, X, P, D) cover the most common cases. Custom format strings (#, 0, .) provide fine-grained control. Pass a CultureInfo for locale-independent formatting.",
  },
  {
    id: "cs-date-time-offset",
    language: "csharp",
    title: "DateTimeOffset — timezone-aware dates",
    tag: "snippet",
    code: `// DateTime is ambiguous — local, UTC, or unspecified?
// DateTimeOffset includes the UTC offset, making it unambiguous.

DateTimeOffset now   = DateTimeOffset.UtcNow;
DateTimeOffset local = DateTimeOffset.Now;     // includes local offset

Console.WriteLine(now.ToString("O"));   // 2024-05-06T12:30:00.0000000+00:00

// Parse from ISO 8601.
DateTimeOffset parsed = DateTimeOffset.Parse("2024-05-06T10:00:00+02:00");
Console.WriteLine(parsed.ToUniversalTime());  // convert to UTC

// TimeOnly / DateOnly (.NET 6+).
DateOnly date = DateOnly.FromDateTime(DateTime.Today);
TimeOnly time = TimeOnly.FromDateTime(DateTime.Now);`,
    explanation: "DateTimeOffset stores a DateTime plus its UTC offset — the right choice for timestamps that must survive serialization and timezone conversions. DateOnly and TimeOnly (.NET 6) represent date-only and time-only values.",
  },
  {
    id: "cs-timespan-arithmetic",
    language: "csharp",
    title: "TimeSpan — duration arithmetic",
    tag: "snippet",
    code: `TimeSpan t1 = TimeSpan.FromHours(1.5);
TimeSpan t2 = TimeSpan.FromMinutes(30);

Console.WriteLine(t1 + t2);              // 02:00:00
Console.WriteLine((t1 - t2).TotalMinutes);  // 60

// Create from components.
var ts = new TimeSpan(days: 1, hours: 2, minutes: 30, seconds: 0);
Console.WriteLine(ts.TotalHours);   // 26.5

// Parse.
var ts2 = TimeSpan.Parse("1:30:00");
Console.WriteLine(ts2.TotalSeconds);  // 5400`,
    explanation: "TimeSpan represents a duration (not a point in time). Use TotalHours/TotalMinutes for fractional values; Hours/Minutes for integer components. Add TimeSpan to DateTime/DateTimeOffset to compute a future point.",
  },
  {
    id: "cs-guid",
    language: "csharp",
    title: "Guid — globally unique identifiers",
    tag: "snippet",
    code: `// Generate a new random GUID (version 4).
Guid g1 = Guid.NewGuid();
Console.WriteLine(g1);          // e.g. 3f2504e0-4f89-11d3-9a0c-0305e82c3301

// Parse.
Guid g2 = Guid.Parse("3f2504e0-4f89-11d3-9a0c-0305e82c3301");

// Formats.
Console.WriteLine(g1.ToString("N"));  // no dashes
Console.WriteLine(g1.ToString("B"));  // {braces}

// Empty/default.
Console.WriteLine(Guid.Empty);        // 00000000-0000-0000-0000-000000000000

// .NET 9+: Guid.CreateVersion7() — time-ordered UUID.
// Guid v7 = Guid.CreateVersion7();`,
    explanation: "Guid.NewGuid() generates a cryptographically random version 4 UUID. The different format strings (N, D, B, P, X) control separators and wrapping. .NET 9 adds CreateVersion7() for time-sortable UUIDs.",
  },
  {
    id: "cs-memory-mapped-file",
    language: "csharp",
    title: "MemoryMappedFile — map a file into memory",
    tag: "snippet",
    code: `using System.IO.MemoryMappedFiles;

// Map an entire file for random access.
using var mmf = MemoryMappedFile.CreateFromFile("data.bin",
    FileMode.Open, mapName: null, capacity: 0);

using var accessor = mmf.CreateViewAccessor();

// Read/write at any offset without seeking.
int value = accessor.ReadInt32(offset: 0);
accessor.Write(offset: 4, value: 42);`,
    explanation: "Memory-mapped files let the OS page file data in/out on demand, enabling random access to large files without loading them entirely into RAM. They also enable shared memory between processes using the same map name.",
  },
  {
    id: "cs-bits-operations",
    language: "csharp",
    title: "System.Numerics.BitOperations",
    tag: "snippet",
    code: `using System.Numerics;

uint n = 0b_1010_1100;

Console.WriteLine(BitOperations.PopCount(n));       // 4 — set bits
Console.WriteLine(BitOperations.LeadingZeroCount(n)); // 24
Console.WriteLine(BitOperations.TrailingZeroCount(n)); // 2
Console.WriteLine(BitOperations.Log2(n));            // 7

// Rotate.
uint rotated = BitOperations.RotateLeft(n, 2);
Console.WriteLine(Convert.ToString(rotated, 2));

// Round up to next power of two.
Console.WriteLine(BitOperations.RoundUpToPowerOf2(5));  // 8`,
    explanation: "BitOperations wraps hardware CPU instructions (BSF/BSR/POPCNT/LZCNT) for zero-overhead bit manipulation. Used heavily in hash tables, compression, and SIMD code.",
  },
  {
    id: "cs-simd-vector",
    language: "csharp",
    title: "System.Numerics.Vector<T> — SIMD parallelism",
    tag: "snippet",
    code: `using System.Numerics;

float[] a = [1, 2, 3, 4, 5, 6, 7, 8];
float[] b = [8, 7, 6, 5, 4, 3, 2, 1];
float[] c = new float[8];

int len = Vector<float>.Count;   // 4 or 8 depending on CPU
int i = 0;
for (; i <= a.Length - len; i += len)
{
    var va = new Vector<float>(a, i);
    var vb = new Vector<float>(b, i);
    (va + vb).CopyTo(c, i);      // vectorized addition
}
Console.WriteLine(string.Join(",", c));   // 9,9,9,9,9,9,9,9`,
    explanation: "Vector<T> maps to SIMD registers (SSE, AVX) and processes multiple elements in one CPU instruction. Vector<float>.Count tells you the hardware's lane width. For advanced SIMD, use System.Runtime.Intrinsics.",
  },
  {
    id: "cs-span-reverse",
    language: "csharp",
    title: "Span<T> operations — Reverse, Fill, Clear",
    tag: "snippet",
    code: `int[] arr = [1, 2, 3, 4, 5];

// Reverse in place — no allocation.
arr.AsSpan().Reverse();
Console.WriteLine(string.Join(",", arr));   // 5,4,3,2,1

// Fill all elements with a value.
arr.AsSpan().Fill(0);
Console.WriteLine(string.Join(",", arr));   // 0,0,0,0,0

// Clear (fill with default).
arr.AsSpan().Clear();

// Sort a slice without allocating a new array.
int[] data = [5, 3, 1, 4, 2];
data.AsSpan(1, 3).Sort();   // sort [3,1,4] in place
Console.WriteLine(string.Join(",", data));  // 5,1,3,4,2`,
    explanation: "Span<T> provides in-place operations (Reverse, Fill, Clear, Sort) that modify the underlying array without allocations. These are safe alternatives to manually indexed loops.",
  },
  {
    id: "cs-collections-immutable",
    language: "csharp",
    title: "ImmutableList and ImmutableDictionary",
    tag: "structures",
    code: `using System.Collections.Immutable;

// Immutable operations return a new collection — original unchanged.
var list = ImmutableList.Create(1, 2, 3);
var list2 = list.Add(4);          // list2 = [1,2,3,4]
var list3 = list2.RemoveAt(0);    // list3 = [2,3,4]

Console.WriteLine(list.Count);   // 3 — unchanged

// Builder for efficient bulk construction.
var builder = ImmutableList.CreateBuilder<int>();
for (int i = 0; i < 1000; i++) builder.Add(i);
var frozen = builder.ToImmutable();`,
    explanation: "Immutable collections from System.Collections.Immutable use structural sharing — add/remove return a new root that shares unchanged subtrees with the original. Use the Builder for bulk construction to avoid O(n²) intermediate collections.",
  },
  {
    id: "cs-frozen-collections",
    language: "csharp",
    title: "FrozenDictionary and FrozenSet (.NET 8)",
    tag: "structures",
    code: `using System.Collections.Frozen;

// Build once — optimized for frequent read-only lookups.
var dict = new Dictionary<string, int>
{
    ["apple"] = 1, ["banana"] = 2, ["cherry"] = 3
};

FrozenDictionary<string, int> frozen = dict.ToFrozenDictionary();
FrozenSet<string>             fset   = dict.Keys.ToFrozenSet();

Console.WriteLine(frozen["apple"]);          // 1
Console.WriteLine(fset.Contains("banana"));  // True`,
    explanation: "FrozenDictionary and FrozenSet (.NET 8) trade slow construction for extremely fast reads. They are perfect for static lookup tables built at startup (command tables, feature flags, config maps).",
  },
  {
    id: "cs-source-gen-logging",
    language: "csharp",
    title: "Source-generated logging (ILogger)",
    tag: "snippet",
    code: `using Microsoft.Extensions.Logging;

partial class MyService
{
    private readonly ILogger _logger;

    public MyService(ILogger<MyService> logger) => _logger = logger;

    // Source generator emits zero-allocation logging method.
    [LoggerMessage(Level = LogLevel.Information,
                   Message = "Processing {ItemId} for user {UserId}")]
    private partial void LogProcessing(int itemId, string userId);

    public void Process(int id, string user)
    {
        LogProcessing(id, user);
        // ...
    }
}`,
    explanation: "Source-generated logging with [LoggerMessage] pre-parses the message template at compile time, avoiding string allocation on every log call. It's 2–4× faster than ILogger.LogInformation() with interpolated strings.",
  },
  {
    id: "cs-configuration-binding",
    language: "csharp",
    title: "IConfiguration binding — strongly typed sections",
    tag: "snippet",
    code: `// appsettings.json:
// { "Database": { "Host": "localhost", "Port": 5432, "Name": "appdb" } }

class DatabaseOptions
{
    public string Host { get; set; } = "localhost";
    public int    Port { get; set; } = 5432;
    public string Name { get; set; } = "";
}

// Bind section to options class.
var dbOptions = new DatabaseOptions();
configuration.GetSection("Database").Bind(dbOptions);

// Or use Get<T> for a fresh instance.
var opts = configuration.GetSection("Database").Get<DatabaseOptions>();
Console.WriteLine(opts?.Host);`,
    explanation: "IConfiguration.Bind or Get<T> maps configuration keys to strongly typed object properties by name. Prefer the Options pattern (services.Configure<T>) for DI-integrated configuration with validation.",
  },
  {
    id: "cs-aspnet-filters",
    language: "csharp",
    title: "ASP.NET Core action filters",
    tag: "snippet",
    code: `using Microsoft.AspNetCore.Mvc.Filters;

class TimingFilter : IActionFilter
{
    private System.Diagnostics.Stopwatch? _sw;

    public void OnActionExecuting(ActionExecutingContext context)
    {
        _sw = System.Diagnostics.Stopwatch.StartNew();
    }

    public void OnActionExecuted(ActionExecutedContext context)
    {
        _sw?.Stop();
        Console.WriteLine($"Action took {_sw?.ElapsedMilliseconds} ms");
    }
}

// Registration:
// services.AddControllers(o => o.Filters.Add<TimingFilter>());`,
    explanation: "Filters are the correct place for cross-cutting concerns (auth, timing, logging, exception handling) in MVC/API controllers. They run in a well-defined pipeline: authorization → resource → action → result → exception.",
  },
  {
    id: "cs-signalr-hub",
    language: "csharp",
    title: "SignalR Hub — real-time messaging",
    tag: "snippet",
    code: `using Microsoft.AspNetCore.SignalR;

// Server-side Hub.
class ChatHub : Hub
{
    public async Task SendMessage(string user, string message) =>
        await Clients.All.SendAsync("ReceiveMessage", user, message);

    public override async Task OnConnectedAsync()
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, "General");
        await base.OnConnectedAsync();
    }
}

// Registration:
// app.MapHub<ChatHub>("/chathub");`,
    explanation: "SignalR Hubs manage WebSocket (with SSE/long-poll fallback) connections. Clients.All broadcasts to all connections; Clients.Caller targets the sender; Clients.Group targets a named group.",
  },
  {
    id: "cs-host-builder",
    language: "csharp",
    title: "Generic Host — background services",
    tag: "snippet",
    code: `using Microsoft.Extensions.Hosting;

var host = Host.CreateDefaultBuilder(args)
    .ConfigureServices(services =>
    {
        services.AddHostedService<WorkerService>();
    })
    .Build();

await host.RunAsync();

class WorkerService : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        while (!ct.IsCancellationRequested)
        {
            Console.WriteLine("Working...");
            await Task.Delay(1000, ct);
        }
    }
}`,
    explanation: "BackgroundService implements IHostedService and provides a single ExecuteAsync method. The CancellationToken is cancelled on graceful shutdown, giving services time to finish. Use it for polling workers, message consumers, and timers.",
  },
  {
    id: "cs-distributed-cache",
    language: "csharp",
    title: "IDistributedCache — Redis/SQL distributed caching",
    tag: "snippet",
    code: `using Microsoft.Extensions.Caching.Distributed;
using System.Text.Json;

class ProductCache(IDistributedCache cache)
{
    private static readonly DistributedCacheEntryOptions Opts = new()
    {
        AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(10),
    };

    public async Task<Product?> GetAsync(int id)
    {
        byte[]? bytes = await cache.GetAsync($"product:{id}");
        return bytes is null ? null : JsonSerializer.Deserialize<Product>(bytes);
    }

    public async Task SetAsync(Product p)
    {
        byte[] bytes = JsonSerializer.SerializeToUtf8Bytes(p);
        await cache.SetAsync($"product:{p.Id}", bytes, Opts);
    }
}`,
    explanation: "IDistributedCache abstracts Redis, SQL Server, and in-memory caching behind a byte[]-based API. AbsoluteExpirationRelativeToNow is the most common eviction policy. Use SlidingExpiration for session-like data.",
  },
  {
    id: "cs-string-intern",
    language: "csharp",
    title: "String.Intern — string interning",
    tag: "caveats",
    code: `// The CLR interns string literals automatically.
string a = "hello";
string b = "hello";
Console.WriteLine(ReferenceEquals(a, b));  // True — same interned instance

// Runtime strings are NOT automatically interned.
string c = new string(new[] {'h','e','l','l','o'});
Console.WriteLine(ReferenceEquals(a, c));  // False

// Explicitly intern.
string d = string.Intern(c);
Console.WriteLine(ReferenceEquals(a, d));  // True

// IsInterned returns null if not in the pool.
Console.WriteLine(string.IsInterned("hello") is not null);  // True`,
    explanation: "String literals sharing the same content are interned by the CLR into a single instance. At runtime, string.Intern adds a string to the pool — use it only for strings that will be compared with ReferenceEquals repeatedly (e.g., large symbol tables).",
  },
  {
    id: "cs-string-create",
    language: "csharp",
    title: "String.Create — allocation-free string building",
    tag: "snippet",
    code: `// String.Create writes into the string's buffer directly — one allocation.
static string FormatPoint(double x, double y)
{
    return string.Create(32, (x, y), static (span, state) =>
    {
        var (x, y) = state;
        span[0] = '(';
        bool ok = x.TryFormat(span[1..], out int n1);
        span[1 + n1] = ',';
        bool ok2 = y.TryFormat(span[2 + n1..], out int n2);
        span[2 + n1 + n2] = ')';
    });
}

Console.WriteLine(FormatPoint(1.5, 2.5));  // (1.5,2.5)`,
    explanation: "String.Create provides a writable Span<char> into the new string's backing storage before it is sealed immutable. It eliminates the intermediate StringBuilder or char[] allocation for custom string construction.",
  },
  {
    id: "cs-memory-pool",
    language: "csharp",
    title: "MemoryPool<T> — rent Memory<T>",
    tag: "snippet",
    code: `using System.Buffers;

// Rent a Memory<T> block from the pool.
using IMemoryOwner<byte> owner = MemoryPool<byte>.Shared.Rent(4096);
Memory<byte> buffer = owner.Memory;

// Write into it.
buffer.Span.Fill(0xAA);
Console.WriteLine(buffer.Span[0].ToString("X2"));   // AA

// Ownership is returned via IMemoryOwner.Dispose() — using handles this.`,
    explanation: "MemoryPool<T> is the Memory<T> counterpart of ArrayPool<T>. The IMemoryOwner<T> returned owns the buffer's lifetime — Dispose returns it to the pool. Use it in async pipelines where you need Memory<T> rather than Span<T>.",
  },
  {
    id: "cs-sequence-reader",
    language: "csharp",
    title: "SequenceReader<T> — parse ReadOnlySequence",
    tag: "snippet",
    code: `using System.Buffers;

// ReadOnlySequence represents potentially discontiguous memory (pipe segments).
byte[] data = System.Text.Encoding.ASCII.GetBytes("Hello\nWorld\n");
ReadOnlySequence<byte> seq = new(data);
var reader = new SequenceReader<byte>(seq);

while (!reader.End)
{
    if (reader.TryReadTo(out ReadOnlySpan<byte> line, (byte)'\n'))
        Console.WriteLine(System.Text.Encoding.ASCII.GetString(line));
    else
        break;
}
// Hello
// World`,
    explanation: "SequenceReader<T> navigates a ReadOnlySequence<T> — the buffer type returned by System.IO.Pipelines. TryReadTo finds a delimiter and advances the position, enabling zero-allocation protocol parsing.",
  },
  {
    id: "cs-pipelines",
    language: "csharp",
    title: "System.IO.Pipelines — high-performance I/O",
    tag: "snippet",
    code: `using System.IO.Pipelines;

var pipe = new Pipe();

// Writer fills the pipe buffer.
async Task WriterAsync()
{
    PipeWriter writer = pipe.Writer;
    Memory<byte> mem = writer.GetMemory(256);
    int written = System.Text.Encoding.UTF8.GetBytes("Hello!", mem.Span);
    writer.Advance(written);
    await writer.FlushAsync();
    await writer.CompleteAsync();
}

// Reader consumes from the other end.
async Task ReaderAsync()
{
    PipeReader reader = pipe.Reader;
    ReadResult result = await reader.ReadAsync();
    Console.WriteLine(result.Buffer.Length);  // 6
    reader.AdvanceTo(result.Buffer.End);
    await reader.CompleteAsync();
}

await Task.WhenAll(WriterAsync(), ReaderAsync());`,
    explanation: "System.IO.Pipelines provides a high-performance backpressure-aware I/O abstraction. GetMemory/Advance avoids copying; AdvanceTo tells the reader which data has been consumed. ASP.NET Core Kestrel is built on Pipelines.",
  },
  {
    id: "cs-unsafe-fixed",
    language: "csharp",
    title: "fixed statement — pin managed memory",
    tag: "snippet",
    code: `unsafe static int SumBytes(byte[] data)
{
    int sum = 0;
    // Pin 'data' so the GC can't move it during the pointer operation.
    fixed (byte* p = data)
    {
        for (int i = 0; i < data.Length; i++)
            sum += p[i];
    }
    return sum;
}

byte[] bytes = [1, 2, 3, 4, 5];
Console.WriteLine(SumBytes(bytes));  // 15`,
    explanation: "The fixed statement pins a managed array or string, preventing the GC from relocating it during pointer operations. The pin is released when the fixed block exits. Avoid long-running fixed blocks — they fragment the heap.",
  },
  {
    id: "cs-delegate-contravariance",
    language: "csharp",
    title: "Delegate variance",
    tag: "understanding",
    code: `// Func<T, TResult> is covariant in TResult, contravariant in T.

Func<string, object> f1 = s => s.ToUpper();   // returns string (object subtype) — OK

// Contravariance: accept a more general argument type.
Func<object, string> f2 = o => o.ToString()!;
Func<string, string> f3 = f2;  // string is-a object — OK (covariance won't help here
                                 // but the assignment is safe: f3 gets strings, f2 accepts objects)

// EventHandler contravariance.
EventHandler<string> handler = (o, s) => Console.WriteLine(s);
EventHandler<object> baseHandler = handler;  // covariant—EventHandler<out T>`,
    explanation: "Delegate covariance means you can assign a delegate with a more derived return type; contravariance means you can assign one with a more general parameter type. These follow the same rules as interface variance.",
  },
  {
    id: "cs-dynamic-type",
    language: "csharp",
    title: "dynamic — runtime dispatch",
    tag: "caveats",
    code: `dynamic obj = "Hello";
Console.WriteLine(obj.Length);    // 5 — resolved at runtime

obj = 42;
Console.WriteLine(obj + 8);       // 50

// Useful for interop with COM, ExpandoObject, DLR-based libraries.
dynamic expando = new System.Dynamic.ExpandoObject();
expando.Name = "Ada";
expando.Age  = 36;
Console.WriteLine(expando.Name);  // Ada

// Pitfall: no compile-time checking — errors at runtime.
// Console.WriteLine(obj.NonExistent); // RuntimeBinderException`,
    explanation: "dynamic defers member resolution to runtime via the Dynamic Language Runtime. Use it for COM interop, ExpandoObject, and deserialized data of unknown shape. Avoid it elsewhere — it kills IntelliSense and compile-time safety.",
  },
  {
    id: "cs-reflection-basics",
    language: "csharp",
    title: "Reflection — inspect types at runtime",
    tag: "snippet",
    code: `using System.Reflection;

Type t = typeof(string);

// List public methods.
foreach (MethodInfo m in t.GetMethods(BindingFlags.Public | BindingFlags.Instance))
    Console.WriteLine(m.Name);

// Read a property value.
object? value = t.GetProperty("Length")?.GetValue("Hello");
Console.WriteLine(value);   // 5

// Instantiate by type name.
Type listType = typeof(List<>).MakeGenericType(typeof(int));
object? list = Activator.CreateInstance(listType);
Console.WriteLine(list?.GetType().Name);  // List\`1`,
    explanation: "Reflection enables runtime inspection and invocation of types, methods, and properties. It's powerful but slow — cache MethodInfo/PropertyInfo objects, or better, use source generators for performance-critical paths.",
  },
  {
    id: "cs-activator-create",
    language: "csharp",
    title: "Activator.CreateInstance — dynamic object creation",
    tag: "snippet",
    code: `// Create an instance of a type known only at runtime.
Type t = Type.GetType("System.Text.StringBuilder")!;
object? sb = Activator.CreateInstance(t);
Console.WriteLine(sb?.GetType().Name);  // StringBuilder

// With constructor arguments.
object? list = Activator.CreateInstance(typeof(List<int>),
    new object[] { 10 });    // capacity = 10
Console.WriteLine(list?.GetType().Name);  // List\`1

// Generic helper — avoids boxing.
T Create<T>() where T : new() => Activator.CreateInstance<T>();`,
    explanation: "Activator.CreateInstance creates an instance of a type using its parameterless constructor (or a specified constructor). It's used in DI containers, ORMs, and deserializers. Cache the resulting instances or use compiled Expressions for hot paths.",
  },
  {
    id: "cs-attribute-reading",
    language: "csharp",
    title: "Reading custom attributes via reflection",
    tag: "snippet",
    code: `[AttributeUsage(AttributeTargets.Method)]
class RouteAttribute(string path) : Attribute
{
    public string Path { get; } = path;
}

class Api
{
    [Route("/users")]
    public void GetUsers() { }

    [Route("/products")]
    public void GetProducts() { }
}

foreach (var method in typeof(Api).GetMethods())
{
    var attr = method.GetCustomAttribute<RouteAttribute>();
    if (attr is not null)
        Console.WriteLine($"{method.Name} -> {attr.Path}");
}`,
    explanation: "GetCustomAttribute<T>() reads attributes from members at runtime. This is how frameworks (ASP.NET, xUnit, Swagger) discover routes, tests, and schema metadata. Cache results per type to avoid repeated reflection overhead.",
  },
  {
    id: "cs-expression-compile",
    language: "csharp",
    title: "Compile expressions for fast property access",
    tag: "snippet",
    code: `using System.Linq.Expressions;
using System.Reflection;

// Build a compiled getter — 100× faster than PropertyInfo.GetValue.
static Func<T, TProp> BuildGetter<T, TProp>(string propName)
{
    var param = Expression.Parameter(typeof(T), "obj");
    var prop  = Expression.Property(param, propName);
    return Expression.Lambda<Func<T, TProp>>(prop, param).Compile();
}

record Person(string Name, int Age);

var getName = BuildGetter<Person, string>("Name");
var getAge  = BuildGetter<Person, int>("Age");

var p = new Person("Ada", 36);
Console.WriteLine(getName(p));  // Ada
Console.WriteLine(getAge(p));   // 36`,
    explanation: "Compiling a lambda expression via Expression.Lambda.Compile() produces a delegate with near-native performance. Build and cache the delegate once — this pattern replaces reflection in hot serialization and mapping code.",
  },
  {
    id: "cs-idisposable-using",
    language: "csharp",
    title: "IDisposable and using patterns",
    tag: "snippet",
    code: `// Standard using statement — calls Dispose() on exit.
using (var conn = new System.Data.SqlClient.SqlConnection("..."))
{
    // use conn
}

// C# 8+ using declaration — scope ends at end of enclosing block.
using var sw = new System.IO.StreamWriter("log.txt");
sw.WriteLine("entry");
// Dispose called here when method returns.

// Multiple resources.
using var f1 = System.IO.File.OpenRead("a.txt");
using var f2 = System.IO.File.OpenRead("b.txt");
// Both disposed when method exits, in reverse order.`,
    explanation: "The using statement guarantees Dispose() is called even if an exception is thrown — equivalent to a try/finally. The using declaration form (C# 8) is cleaner for multiple resources but makes the lifetime implicit.",
  },
  {
    id: "cs-generic-constraints",
    language: "csharp",
    title: "Generic constraints",
    tag: "snippet",
    code: `// class — must be a reference type.
void Nullify<T>(ref T? obj) where T : class => obj = null;

// struct — must be a value type (enables Nullable<T>).
T? Maybe<T>(bool give) where T : struct => give ? default(T) : null;

// new() — must have parameterless constructor.
T Create<T>() where T : new() => new T();

// Multiple constraints.
void Log<T>(T item)
    where T : class, IFormattable, new()
{
    Console.WriteLine(item.ToString("G", null));
}

// notnull — non-nullable reference or value type.
void Store<T>(T value) where T : notnull { }`,
    explanation: "Generic constraints restrict type parameters to types with specific capabilities. They enable calling constructors (new()), interface methods, and null handling. Multiple constraints are combined with commas.",
  },
  {
    id: "cs-generic-variance-class",
    language: "csharp",
    title: "Generic variance on interfaces and delegates",
    tag: "understanding",
    code: `// Covariant interface (out) — read-only producer.
interface IProducer<out T> { T Produce(); }

class StringProducer : IProducer<string>
{
    public string Produce() => "hello";
}

IProducer<string> strProd = new StringProducer();
IProducer<object> objProd = strProd;   // OK — covariant

// Contravariant interface (in) — write-only consumer.
interface IConsumer<in T> { void Consume(T item); }

class ObjectConsumer : IConsumer<object>
{
    public void Consume(object item) => Console.WriteLine(item);
}

IConsumer<object> objCons = new ObjectConsumer();
IConsumer<string> strCons = objCons;   // OK — contravariant`,
    explanation: "out variance (covariant) is for producers: if Dog is-a Animal, IProducer<Dog> is-a IProducer<Animal>. in variance (contravariant) is for consumers: IConsumer<Animal> is-a IConsumer<Dog>. Variance is only valid on interface/delegate type parameters.",
  },
  {
    id: "cs-iterator-yield",
    language: "csharp",
    title: "yield return — lazy sequences",
    tag: "snippet",
    code: `IEnumerable<int> Fibonacci()
{
    int a = 0, b = 1;
    while (true)
    {
        yield return a;        // suspend and return a value
        (a, b) = (b, a + b);   // resume here on next MoveNext()
    }
}

// Take first 10 Fibonacci numbers.
foreach (int f in Fibonacci().Take(10))
    Console.Write(f + " ");
// 0 1 1 2 3 5 8 13 21 34`,
    explanation: "yield return makes a method into a state machine that produces values lazily. The body is suspended at each yield and resumed on the next MoveNext() call. The compiler generates an IEnumerator<T> class automatically.",
  },
  {
    id: "cs-yield-break",
    language: "csharp",
    title: "yield break — early termination",
    tag: "snippet",
    code: `IEnumerable<int> TakeWhilePositive(IEnumerable<int> source)
{
    foreach (int n in source)
    {
        if (n <= 0) yield break;   // stop iteration
        yield return n;
    }
}

var data = new[] { 5, 3, 1, -2, 4, 6 };
Console.WriteLine(string.Join(", ",
    TakeWhilePositive(data)));   // 5, 3, 1`,
    explanation: "yield break terminates the iterator — the caller's foreach loop ends. It's the equivalent of a return statement inside an iterator method. Uncaught exceptions inside an iterator also end the sequence.",
  },
  {
    id: "cs-async-void-caveat",
    language: "csharp",
    title: "async void — fire-and-forget pitfall",
    tag: "caveats",
    code: `// async void: exceptions are unobservable — can crash the process.
async void DangerousFireAndForget()
{
    await Task.Delay(100);
    throw new InvalidOperationException("unhandled!");
    // This exception is NOT propagated to the caller —
    // it is raised on the SynchronizationContext and may kill the app.
}

// Correct: use async Task and await (or discard with care).
async Task SafeTask() { await Task.Delay(100); }

// If you truly need fire-and-forget, at least log exceptions.
_ = Task.Run(async () =>
{
    try { await SafeTask(); }
    catch (Exception ex) { Console.WriteLine(ex); }
});`,
    explanation: "async void is only for event handlers. In all other contexts, use async Task — then the caller can await and observe exceptions. async void exceptions route to the SynchronizationContext and can crash the process silently.",
  },
  {
    id: "cs-task-exception-handling",
    language: "csharp",
    title: "Task exception handling — AggregateException",
    tag: "caveats",
    code: `// WhenAll re-throws the first exception when awaited.
// The rest are swallowed unless you inspect the Task.Exception.

Task t1 = Task.FromException(new ArgumentException("arg"));
Task t2 = Task.FromException(new InvalidOperationException("io"));
Task combined = Task.WhenAll(t1, t2);

try
{
    await combined;
}
catch (Exception ex)
{
    // Only first exception re-thrown here.
    Console.WriteLine(ex.Message);  // arg

    // Access all exceptions via the Task.
    AggregateException agg = combined.Exception!;
    foreach (var inner in agg.InnerExceptions)
        Console.WriteLine(inner.Message);
}`,
    explanation: "await re-throws the first exception from an AggregateException. To inspect all failures, access task.Exception after it faults. WhenAll and WhenAny both wrap exceptions in AggregateException.",
  },
  {
    id: "cs-cancellation-register",
    language: "csharp",
    title: "CancellationToken.Register — callback on cancel",
    tag: "snippet",
    code: `using var cts = new CancellationTokenSource();
CancellationToken token = cts.Token;

// Register a callback invoked when the token is cancelled.
using var reg = token.Register(() =>
    Console.WriteLine("Token cancelled — running cleanup"));

Console.WriteLine("Working...");
await Task.Delay(500);

cts.Cancel();
// Token cancelled — running cleanup

// Always dispose the registration to prevent memory leaks.`,
    explanation: "CancellationToken.Register executes a callback synchronously when cancellation is requested, on the thread that calls Cancel. Dispose the CancellationTokenRegistration when no longer needed to avoid keeping the delegate alive.",
  },
  {
    id: "cs-timer-periodic",
    language: "csharp",
    title: "PeriodicTimer — await-based periodic work",
    tag: "snippet",
    code: `using var timer = new PeriodicTimer(TimeSpan.FromSeconds(1));

// PeriodicTimer.WaitForNextTickAsync() is the async-friendly alternative
// to System.Timers.Timer — no overlapping callbacks.
int count = 0;
while (await timer.WaitForNextTickAsync())
{
    Console.WriteLine($"Tick {++count}");
    if (count >= 3) break;
}
// Tick 1  (after 1s)
// Tick 2  (after 2s)
// Tick 3  (after 3s)`,
    explanation: "PeriodicTimer (.NET 6+) replaces System.Timers.Timer for async code. WaitForNextTickAsync returns false when the timer is disposed. Because it is await-based, callbacks never overlap even if the work takes longer than the period.",
  },
  {
    id: "cs-concurrent-queue",
    language: "csharp",
    title: "ConcurrentQueue<T> — lock-free FIFO",
    tag: "snippet",
    code: `using System.Collections.Concurrent;

var queue = new ConcurrentQueue<int>();

// Producers.
Parallel.For(0, 100, i => queue.Enqueue(i));

// Consumer.
int sum = 0;
while (queue.TryDequeue(out int item))
    sum += item;

Console.WriteLine(sum);   // 4950 (0+1+...+99)

// TryPeek — read without removing.
queue.Enqueue(42);
queue.TryPeek(out int peeked);
Console.WriteLine(peeked);  // 42`,
    explanation: "ConcurrentQueue<T> is a lock-free thread-safe FIFO queue. TryDequeue returns false when empty instead of throwing. Use it when thread safety is needed for a queue — otherwise the regular Queue<T> is faster.",
  },
  {
    id: "cs-span-sort-custom",
    language: "csharp",
    title: "Span<T> Sort with comparison",
    tag: "snippet",
    code: `int[] data = [5, 3, 1, 4, 2];

// Sort in place with a custom comparison.
data.AsSpan().Sort((a, b) => b.CompareTo(a));  // descending
Console.WriteLine(string.Join(",", data));   // 5,4,3,2,1

// Sort parallel arrays together (key + value).
int[]    keys   = [3, 1, 2];
string[] values = ["c", "a", "b"];
keys.AsSpan().Sort(values.AsSpan());   // sort both by keys
Console.WriteLine(string.Join(",", values));  // a,b,c`,
    explanation: "Span<T>.Sort with a Comparison<T> sorts in place without allocating. The two-span overload sorts two arrays simultaneously — key changes are reflected in the value span. Useful for parallel-array data layouts.",
  },
  {
    id: "cs-string-methods-modern",
    language: "csharp",
    title: "Modern string methods (.NET 6+)",
    tag: "snippet",
    code: `string s = "  Hello, World!  ";

// Trim variants.
Console.WriteLine(s.Trim());         // Hello, World!
Console.WriteLine(s.TrimStart());    // Hello, World!  (leading only)

// Contains with comparison.
Console.WriteLine(s.Contains("hello", StringComparison.OrdinalIgnoreCase));  // True

// Replace with comparison.
string result = s.Replace("world", "C#", StringComparison.OrdinalIgnoreCase);

// .NET 6+ new methods.
Console.WriteLine("hello".AsSpan().IndexOfAnyExcept("aeiou"));   // 0 (h)
Console.WriteLine(string.Join(',', ["a", "b", "c"]));  // a,b,c`,
    explanation: "Modern .NET string APIs accept StringComparison for case-insensitive operations without culture surprises. AsSpan() opens up Span<char> methods for zero-allocation search. string.Join has a span-based overload in .NET 6+.",
  },
  {
    id: "cs-math-functions",
    language: "csharp",
    title: "Math and MathF — common math functions",
    tag: "snippet",
    code: `Console.WriteLine(Math.Abs(-5));           // 5
Console.WriteLine(Math.Sqrt(16));          // 4
Console.WriteLine(Math.Pow(2, 10));        // 1024
Console.WriteLine(Math.Log(Math.E));       // 1
Console.WriteLine(Math.Log10(1000));       // 3
Console.WriteLine(Math.Floor(3.9));        // 3
Console.WriteLine(Math.Ceiling(3.1));      // 4
Console.WriteLine(Math.Round(2.5, MidpointRounding.AwayFromZero)); // 3
Console.WriteLine(Math.Clamp(150, 0, 100));  // 100

// MathF is the float version — avoids double→float conversion.
float area = MathF.PI * MathF.Pow(5f, 2f);
Console.WriteLine(area);   // 78.53982`,
    explanation: "MidpointRounding.AwayFromZero gives the 'school' rounding (2.5→3). The default (ToEven, banker's rounding) rounds 2.5→2 to minimize cumulative bias. MathF operates entirely in float precision — faster on 32-bit hardware.",
  },
  {
    id: "cs-random-shared",
    language: "csharp",
    title: "Random.Shared — thread-safe random",
    tag: "snippet",
    code: `// .NET 6+: Random.Shared — thread-safe shared instance.
int n = Random.Shared.Next(1, 101);       // 1–100 inclusive
double d = Random.Shared.NextDouble();    // [0.0, 1.0)
Random.Shared.NextBytes(new byte[16]);    // fill with random bytes

// Shuffle a list in place.
var list = new List<int> { 1, 2, 3, 4, 5 };
Random.Shared.Shuffle(list.ToArray());

// For security-sensitive values, use RandomNumberGenerator.
byte[] key = System.Security.Cryptography.RandomNumberGenerator.GetBytes(32);`,
    explanation: "Random.Shared (.NET 6+) is a thread-safe instance usable from any thread without locking. Use it instead of creating new Random() per-thread. For cryptographic randomness, use RandomNumberGenerator — never Random.",
  },
  {
    id: "cs-linq-chunk",
    language: "csharp",
    title: "LINQ Chunk — split into fixed-size batches",
    tag: "snippet",
    code: `int[] items = Enumerable.Range(1, 10).ToArray();

// Split into groups of 3.
foreach (int[] chunk in items.Chunk(3))
    Console.WriteLine(string.Join(",", chunk));
// 1,2,3
// 4,5,6
// 7,8,9
// 10      ← last chunk is smaller`,
    explanation: "Chunk (.NET 6+) splits a sequence into arrays of at most N elements. The last chunk may be smaller. It is eager — each chunk is materialized before yielding. For lazy chunking, use a custom iterator or MoreLINQ.",
  },
  {
    id: "cs-linq-order",
    language: "csharp",
    title: "LINQ Order / OrderDescending (.NET 7+)",
    tag: "snippet",
    code: `int[] nums = [5, 3, 1, 4, 2];

// .NET 7+ — concise ordering without a key selector.
int[] asc  = nums.Order().ToArray();
int[] desc = nums.OrderDescending().ToArray();

Console.WriteLine(string.Join(",", asc));   // 1,2,3,4,5
Console.WriteLine(string.Join(",", desc));  // 5,4,3,2,1

// Compare to older syntax:
// nums.OrderBy(x => x)
// nums.OrderByDescending(x => x)`,
    explanation: "Order() and OrderDescending() (.NET 7+) replace the verbose OrderBy(x => x) for types that implement IComparable<T>. They are equivalent but more readable when no transformation is needed.",
  },
  {
    id: "cs-linq-min-max-by",
    language: "csharp",
    title: "LINQ MinBy / MaxBy (.NET 6+)",
    tag: "snippet",
    code: `record Product(string Name, decimal Price);

var products = new[]
{
    new Product("Apple", 0.99m),
    new Product("Laptop", 999m),
    new Product("Pen",   1.99m),
};

// MinBy/MaxBy return the element, not the key value.
Product? cheapest  = products.MinBy(p => p.Price);
Product? expensive = products.MaxBy(p => p.Price);

Console.WriteLine(cheapest?.Name);   // Apple
Console.WriteLine(expensive?.Name);  // Laptop`,
    explanation: "MinBy and MaxBy (.NET 6+) return the entire element whose key is minimum or maximum, instead of just the key value. They handle empty sequences by returning null (for nullable return) rather than throwing.",
  },
  {
    id: "cs-linq-distinct-by",
    language: "csharp",
    title: "LINQ DistinctBy (.NET 6+)",
    tag: "snippet",
    code: `record Person(string Name, string City);

var people = new[]
{
    new Person("Ada",   "London"),
    new Person("Linus", "Portland"),
    new Person("Grace", "London"),
    new Person("Ken",   "Portland"),
};

// One person per city — first seen wins.
var oncePerCity = people.DistinctBy(p => p.City);
foreach (var p in oncePerCity)
    Console.WriteLine(p.Name);
// Ada, Linus`,
    explanation: "DistinctBy (.NET 6+) deduplicates by a key selector, keeping the first occurrence. It replaces the GroupBy().Select(g => g.First()) pattern with a single, readable operator.",
  },
  {
    id: "cs-linq-index",
    language: "csharp",
    title: "LINQ Index (.NET 9+)",
    tag: "snippet",
    code: `string[] words = ["alpha", "beta", "gamma"];

// Index() pairs each element with its position — like Python's enumerate().
foreach ((int i, string word) in words.Index())
    Console.WriteLine($"{i}: {word}");
// 0: alpha
// 1: beta
// 2: gamma`,
    explanation: "Index() (.NET 9+) is the LINQ equivalent of Python's enumerate() — it pairs each element with its zero-based index. Before .NET 9, use Select((item, i) => (i, item)) to achieve the same effect.",
  },
  {
    id: "cs-linq-first-or-default",
    language: "csharp",
    title: "FirstOrDefault with default value (.NET 6+)",
    tag: "snippet",
    code: `int[] nums = [3, 1, 4, 1, 5];

// .NET 6+: pass an explicit default value.
int first = nums.FirstOrDefault(n => n > 10, defaultValue: -1);
Console.WriteLine(first);   // -1 — no element > 10

// Older pattern required null-coalescing:
int old = nums.FirstOrDefault(n => n > 10) != 0 ? nums.First(n => n > 10) : -1;

// SingleOrDefault throws if more than one match.
int single = nums.SingleOrDefault(n => n == 99, defaultValue: 0);
Console.WriteLine(single);  // 0`,
    explanation: "The defaultValue overload of FirstOrDefault/LastOrDefault/SingleOrDefault (.NET 6+) removes the need for a null-coalescing ?? after the call, and works correctly when the natural default (0, false, null) is a valid result.",
  },
  {
    id: "cs-interpolated-handler",
    language: "csharp",
    title: "Interpolated string handlers (C# 10)",
    tag: "understanding",
    code: `// Interpolated string handlers allow conditional construction —
// the compiler generates calls to AppendFormatted only if needed.

using Microsoft.Extensions.Logging;

// LogInformation with an interpolated string in C# 10+ avoids
// allocating the string if the log level is disabled.
ILogger logger = LoggerFactory.Create(b => b.AddConsole()).CreateLogger("app");

// WRONG (always allocates string):
// logger.LogInformation($"Processing item {itemId}");

// CORRECT (conditional, zero-alloc if Debug level disabled):
logger.LogInformation("Processing item {ItemId}", 42);

// Or use [LoggerMessage] source generator for best perf.`,
    explanation: "Interpolated string handlers (C# 10) allow library authors to write types that the compiler uses instead of building the string eagerly. ILogger leverages this to avoid formatting strings for disabled log levels.",
  },
  {
    id: "cs-init-only-record",
    language: "csharp",
    title: "Init-only properties in non-record classes",
    tag: "snippet",
    code: `class Request
{
    public required string Url    { get; init; }
    public string Method          { get; init; } = "GET";
    public int    TimeoutSeconds  { get; init; } = 30;
}

// Object initializer — the only time init properties can be set.
var req = new Request
{
    Url    = "https://api.example.com",
    Method = "POST",
};

// req.Url = "other";  // CS8852 — cannot modify after construction

// Use with in test builders.
var copy = req with { Method = "GET" };   // only works on records
// Use dataclasses.replace equivalent via a constructor for classes.`,
    explanation: "init-only properties aren't just for records — any class can use them. They enforce immutability after construction while still allowing convenient object initializer syntax, useful for immutable data transfer objects.",
  },
  {
    id: "cs-interface-static-factory",
    language: "csharp",
    title: "Static interface methods as factories",
    tag: "snippet",
    code: `interface IParsable<TSelf> where TSelf : IParsable<TSelf>
{
    static abstract TSelf Parse(string input);
}

class Temperature : IParsable<Temperature>
{
    public double Celsius { get; }
    private Temperature(double c) { Celsius = c; }

    public static Temperature Parse(string input)
    {
        double val = double.Parse(input.TrimEnd('C', 'c'));
        return new Temperature(val);
    }
}

Temperature t = Temperature.Parse("36.6C");
Console.WriteLine(t.Celsius);  // 36.6`,
    explanation: "Static abstract members on interfaces enable generic algorithms that require factory or parsing methods on type parameters. The .NET BCL's IParsable<T> and ISpanParsable<T> use exactly this pattern.",
  },
  {
    id: "cs-required-init-ctor",
    language: "csharp",
    title: "SetsRequiredMembers — bypass required in ctor",
    tag: "snippet",
    code: `using System.Diagnostics.CodeAnalysis;

class Config
{
    public required string Host  { get; init; }
    public required int    Port  { get; init; }

    // SetsRequiredMembers suppresses the required check
    // when using this constructor.
    [SetsRequiredMembers]
    public Config(string host, int port)
    {
        Host = host;
        Port = port;
    }
}

// Both forms work.
var c1 = new Config("localhost", 8080);
var c2 = new Config { Host = "prod", Port = 443 };`,
    explanation: "[SetsRequiredMembers] tells the compiler that a constructor initializes all required members, suppressing the requirement for callers to use object initializer syntax. Useful for providing a traditional constructor alongside the initializer form.",
  },
  {
    id: "cs-enum-class-pattern",
    language: "csharp",
    title: "Discriminated union with abstract record",
    tag: "snippet",
    code: `abstract record Shape
{
    record Circle(double Radius)     : Shape;
    record Rectangle(double W, double H) : Shape;
    record Triangle(double Base, double H) : Shape;

    // Computed on the abstract type using switch expression.
    public double Area => this switch
    {
        Circle { Radius: var r }       => Math.PI * r * r,
        Rectangle { W: var w, H: var h } => w * h,
        Triangle { Base: var b, H: var h } => 0.5 * b * h,
        _ => throw new NotImplementedException(),
    };
}

Console.WriteLine(new Shape.Circle(5).Area);       // 78.54
Console.WriteLine(new Shape.Rectangle(4, 6).Area); // 24`,
    explanation: "Nesting record subtypes inside an abstract record creates a closed discriminated union — only types within the file can subclass the abstract record. The switch expression over the sealed hierarchy is exhaustive-checkable.",
  },
  {
    id: "cs-result-pattern",
    language: "csharp",
    title: "Result<T> pattern — error as value",
    tag: "snippet",
    code: `readonly record struct Result<T>
{
    public T? Value { get; }
    public string? Error { get; }
    public bool IsSuccess => Error is null;

    private Result(T value)  { Value = value; Error = null; }
    private Result(string e) { Value = default; Error = e; }

    public static Result<T> Ok(T value)    => new(value);
    public static Result<T> Fail(string e) => new(e);
}

Result<int> Parse(string s) =>
    int.TryParse(s, out int n)
        ? Result<int>.Ok(n)
        : Result<int>.Fail($"Cannot parse '{s}'");

var r = Parse("42");
if (r.IsSuccess) Console.WriteLine(r.Value);`,
    explanation: "The Result<T> pattern represents success or failure as a value rather than an exception — no throw/catch overhead for expected failures. Libraries like LanguageExt and ErrorOr provide more complete implementations.",
  },
  {
    id: "cs-option-pattern",
    language: "csharp",
    title: "Option<T> pattern — explicit optionality",
    tag: "snippet",
    code: `readonly record struct Option<T>
{
    private readonly T? _value;
    public bool HasValue { get; }

    private Option(T value) { _value = value; HasValue = true; }

    public static Option<T> Some(T value) => new(value);
    public static Option<T> None { get; } = default;

    public T GetOr(T fallback) => HasValue ? _value! : fallback;
    public Option<TOut> Map<TOut>(Func<T, TOut> f) =>
        HasValue ? Option<TOut>.Some(f(_value!)) : Option<TOut>.None;
}

var opt = Option<int>.Some(42);
Console.WriteLine(opt.Map(x => x * 2).GetOr(0));  // 84`,
    explanation: "Option<T> makes the presence or absence of a value explicit in the type system — a typed alternative to null references. Map transforms the value if present; GetOr provides a fallback. The LanguageExt library provides a full implementation.",
  },
  {
    id: "cs-mediatr-pattern",
    language: "csharp",
    title: "Mediator pattern concept",
    tag: "understanding",
    code: `// MediatR (NuGet) implements the mediator pattern.
// Requests flow through a single dispatch point.

interface IRequest<TResponse> { }
interface IRequestHandler<TRequest, TResponse>
    where TRequest : IRequest<TResponse>
{
    Task<TResponse> Handle(TRequest request, CancellationToken ct);
}

// Command.
record CreateUserCommand(string Name) : IRequest<int>;

// Handler.
class CreateUserHandler : IRequestHandler<CreateUserCommand, int>
{
    public Task<int> Handle(CreateUserCommand req, CancellationToken ct)
    {
        Console.WriteLine($"Creating user: {req.Name}");
        return Task.FromResult(42);   // simulated new user ID
    }
}`,
    explanation: "The Mediator pattern routes requests through a single dispatcher (IMediator), decoupling senders from handlers. MediatR adds pipeline behaviors (logging, validation, transactions) via IRequestBehavior without modifying handlers.",
  },
  {
    id: "cs-observer-pattern",
    language: "csharp",
    title: "Observer pattern with events",
    tag: "snippet",
    code: `class Stock
{
    private decimal _price;

    public event Action<decimal>? PriceChanged;

    public decimal Price
    {
        get => _price;
        set
        {
            if (_price == value) return;
            _price = value;
            PriceChanged?.Invoke(value);
        }
    }
}

var stock = new Stock();
stock.PriceChanged += p => Console.WriteLine($"New price: {p:C}");
stock.PriceChanged += p => { if (p < 10m) Console.WriteLine("Buy!"); };

stock.Price = 9.50m;
// New price: $9.50
// Buy!`,
    explanation: "C# events are the idiomatic observer pattern. The event keyword restricts subscribers to += and -= — no subscriber can invoke or clear the event list. Multicast delegates call all subscribers in registration order.",
  },
  {
    id: "cs-specification-pattern",
    language: "csharp",
    title: "Specification pattern",
    tag: "snippet",
    code: `interface ISpecification<T>
{
    bool IsSatisfiedBy(T candidate);
    ISpecification<T> And(ISpecification<T> other);
}

abstract class Specification<T> : ISpecification<T>
{
    public abstract bool IsSatisfiedBy(T candidate);
    public ISpecification<T> And(ISpecification<T> other) =>
        new AndSpecification<T>(this, other);
}

class AndSpecification<T>(ISpecification<T> left, ISpecification<T> right)
    : Specification<T>
{
    public override bool IsSatisfiedBy(T candidate) =>
        left.IsSatisfiedBy(candidate) && right.IsSatisfiedBy(candidate);
}`,
    explanation: "The Specification pattern encapsulates a boolean rule as an object, enabling composition (And, Or, Not) and reuse across different execution contexts (in-memory filtering, LINQ-to-SQL, etc.).",
  },
  {
    id: "cs-type-switch",
    language: "csharp",
    title: "Type-switching without pattern matching (legacy)",
    tag: "understanding",
    code: `// Pre-C#7 approach (still common in older codebases).
object obj = 3.14;

if (obj is int i)         Console.WriteLine($"int: {i}");
else if (obj is double d) Console.WriteLine($"double: {d}");
else if (obj is string s) Console.WriteLine($"string: {s}");

// C#7+ switch — preferred modern form.
string result = obj switch
{
    int    n => $"int: {n}",
    double d => $"double: {d}",
    string s => $"string: {s}",
    _        => "other",
};
Console.WriteLine(result);  // double: 3.14`,
    explanation: "Before C# 7, type dispatch required a chain of is + cast. C# 7+ switch expressions with type patterns are exhaustive, eliminate double-evaluation, and are more readable. The old form still appears in older codebases.",
  },
  {
    id: "cs-concurrent-stack",
    language: "csharp",
    title: "ConcurrentStack<T> — thread-safe LIFO",
    tag: "snippet",
    code: `using System.Collections.Concurrent;

var stack = new ConcurrentStack<int>();

// Push single or multiple.
stack.Push(1);
stack.PushRange(new[] { 2, 3, 4 });

Console.WriteLine(stack.Count);   // 4

// TryPop — thread-safe pop.
if (stack.TryPop(out int top))
    Console.WriteLine(top);   // 4 (LIFO)

// TryPopRange — batch dequeue.
int[] batch = new int[2];
int count = stack.TryPopRange(batch);
Console.WriteLine(count);    // 2`,
    explanation: "ConcurrentStack<T> is a lock-free thread-safe LIFO stack. TryPopRange atomically removes multiple items, reducing contention in high-throughput scenarios. Use it for work-stealing schedulers and undo stacks.",
  },
  {
    id: "cs-string-encoding",
    language: "csharp",
    title: "Encoding — convert between string and bytes",
    tag: "snippet",
    code: `using System.Text;

string text = "Hello, 世界";

// Encode to bytes.
byte[] utf8  = Encoding.UTF8.GetBytes(text);
byte[] utf16 = Encoding.Unicode.GetBytes(text);   // UTF-16 LE
byte[] ascii = Encoding.ASCII.GetBytes("Hello");

Console.WriteLine(utf8.Length);    // 12 (ASCII + 6 for CJK)
Console.WriteLine(utf16.Length);   // 18 (2 bytes per char)

// Decode.
string back = Encoding.UTF8.GetString(utf8);
Console.WriteLine(back);   // Hello, 世界

// Span-based zero-alloc encoding.
Span<byte> buf = stackalloc byte[64];
int written = Encoding.UTF8.GetBytes(text, buf);`,
    explanation: "Encoding.GetBytes converts strings to byte arrays; GetString reverses it. Always specify the encoding explicitly — never rely on Encoding.Default, which is system-locale-dependent. The span overloads are allocation-free.",
  },
  {
    id: "cs-convert-class",
    language: "csharp",
    title: "Convert — type conversion utilities",
    tag: "snippet",
    code: `// Convert.ToXxx methods handle null and DBNull.
object? dbValue = null;
int n = Convert.ToInt32(dbValue);   // 0 — no NullReferenceException

// Base64 encoding.
byte[] data = [1, 2, 3, 255];
string b64 = Convert.ToBase64String(data);
Console.WriteLine(b64);   // AQID/w==

byte[] back = Convert.FromBase64String(b64);

// Numeric base conversion.
Console.WriteLine(Convert.ToString(255, 16));   // ff
Console.WriteLine(Convert.ToInt32("ff", 16));   // 255
Console.WriteLine(Convert.ToString(255, 2));    // 11111111`,
    explanation: "Convert provides null-safe type conversions (unlike casts), base64 encoding, and numeric base conversion (binary, octal, hex). For high-performance base64, prefer Convert.TryFromBase64String or System.Buffers.Text.Base64.",
  },
  {
    id: "cs-bit-array",
    language: "csharp",
    title: "BitArray — compact boolean storage",
    tag: "structures",
    code: `using System.Collections;

var bits = new BitArray(8);   // 8 bits, all false
bits[0] = true;
bits[3] = true;
bits[7] = true;

// Iterate.
for (int i = 0; i < bits.Count; i++)
    Console.Write(bits[i] ? "1" : "0");
// 10010001

// Bitwise operations.
var other = new BitArray(8, true);  // all true
var result = bits.And(other);       // mutates bits in place
Console.WriteLine(result.Cast<bool>().Count(b => b));   // 3`,
    explanation: "BitArray stores booleans as bits — 8× more memory-efficient than bool[]. It supports And, Or, Not, Xor in place and works with any length. Use it for flag sets, bloom filters, and compressed boolean sequences.",
  },
  {
    id: "cs-stack-generic",
    language: "csharp",
    title: "Stack<T> and Queue<T> — non-concurrent",
    tag: "structures",
    code: `// Stack<T> — LIFO.
var stack = new Stack<string>();
stack.Push("first");
stack.Push("second");
stack.Push("third");
Console.WriteLine(stack.Pop());    // third
Console.WriteLine(stack.Peek());   // second — no removal
Console.WriteLine(stack.Count);    // 2

// Queue<T> — FIFO.
var queue = new Queue<string>();
queue.Enqueue("a"); queue.Enqueue("b"); queue.Enqueue("c");
Console.WriteLine(queue.Dequeue());  // a
Console.WriteLine(queue.Peek());     // b`,
    explanation: "Stack<T> and Queue<T> are the non-thread-safe LIFO and FIFO collections. They are backed by arrays with amortized O(1) operations. For thread safety, use ConcurrentStack<T> and ConcurrentQueue<T>.",
  },
  {
    id: "cs-sorted-set",
    language: "csharp",
    title: "SortedSet<T> — ordered set",
    tag: "structures",
    code: `var set = new SortedSet<int> { 5, 3, 1, 4, 2 };

// Always iterates in sorted order.
Console.WriteLine(string.Join(",", set));   // 1,2,3,4,5

// Range operations.
SortedSet<int> sub = set.GetViewBetween(2, 4);
Console.WriteLine(string.Join(",", sub));   // 2,3,4

// Min/Max — O(log n).
Console.WriteLine(set.Min);  // 1
Console.WriteLine(set.Max);  // 5

set.Add(6);
set.Remove(1);`,
    explanation: "SortedSet<T> is a red-black tree — it maintains sorted order with O(log n) add/remove/contains and O(log n) Min/Max. GetViewBetween returns a live view (changes to the view reflect in the set).",
  },
  {
    id: "cs-lookup-class",
    language: "csharp",
    title: "ILookup<TKey,TElement> — grouped results",
    tag: "structures",
    code: `var words = new[] { "apple", "ant", "banana", "cherry", "avocado" };

// ToLookup is like GroupBy but immediately materialized.
ILookup<char, string> byLetter = words.ToLookup(w => w[0]);

// O(1) access per key — no KeyNotFoundException.
foreach (string word in byLetter['a'])
    Console.WriteLine(word);   // apple, ant, avocado

// Missing key returns empty sequence (not null or exception).
int count = byLetter['z'].Count();
Console.WriteLine(count);   // 0`,
    explanation: "ILookup<TKey,TElement> is an immutable multi-value dictionary. Missing keys return an empty IEnumerable instead of throwing — unlike Dictionary<TKey,List<TValue>>. Use it when you need a one-time grouping of a sequence.",
  },
  {
    id: "cs-record-to-string",
    language: "csharp",
    title: "Customizing record ToString",
    tag: "snippet",
    code: `record Temperature(double Celsius)
{
    // Override the generated ToString.
    public override string ToString() =>
        $"{Celsius:F1}°C ({Celsius * 9/5 + 32:F1}°F)";
}

var t = new Temperature(100);
Console.WriteLine(t);   // 100.0°C (212.0°F)

// The generated PrintMembers is called by the generated ToString.
// Override PrintMembers for partial control:
record Point(double X, double Y)
{
    protected virtual bool PrintMembers(System.Text.StringBuilder sb)
    {
        sb.Append($"X={X:F2}, Y={Y:F2}");
        return true;
    }
}
Console.WriteLine(new Point(1.0, 2.0));  // Point { X=1.00, Y=2.00 }`,
    explanation: "Records auto-generate ToString that calls PrintMembers. Override ToString for full control; override PrintMembers to customize only the member list inside the braces. Both approaches coexist with the with expression.",
  },
  {
    id: "cs-span-binary-primitives",
    language: "csharp",
    title: "BinaryPrimitives — read/write from Span<byte>",
    tag: "snippet",
    code: `using System.Buffers.Binary;

byte[] buffer = new byte[8];
Span<byte> span = buffer;

// Write a big-endian uint32 at offset 0.
BinaryPrimitives.WriteUInt32BigEndian(span, 0xDEADBEEF);
Console.WriteLine(Convert.ToHexString(buffer[..4]));   // DEADBEEF

// Read it back.
uint value = BinaryPrimitives.ReadUInt32BigEndian(span);
Console.WriteLine(value.ToString("X8"));  // DEADBEEF

// Little-endian for x86 native format.
BinaryPrimitives.WriteInt64LittleEndian(span, long.MaxValue);`,
    explanation: "BinaryPrimitives provides explicit endian-aware read/write operations on Span<byte> — essential for binary protocol parsing where byte order is specified. All methods are JIT-intrinsified on x64 to single instructions.",
  },
  {
    id: "cs-abstract-class-vs-interface",
    language: "csharp",
    title: "Abstract class vs interface — when to choose",
    tag: "understanding",
    code: `// Abstract class: use when sharing implementation or state.
abstract class Logger
{
    private readonly string _prefix;  // shared state
    protected Logger(string prefix) => _prefix = prefix;

    protected abstract void WriteCore(string msg);  // must implement

    public void Log(string msg) =>      // shared behavior
        WriteCore($"[{_prefix}] {msg}");
}

// Interface: use for contracts (capability) with no shared state.
interface ILogger
{
    void Log(string message);
    void LogError(string msg) => Log($"ERROR: {msg}");  // default impl
}

// A class can implement many interfaces but only one abstract class.
class ConsoleLogger : Logger, ILogger
{
    public ConsoleLogger() : base("Console") { }
    protected override void WriteCore(string msg) => Console.WriteLine(msg);
    public void Log(string msg) => WriteCore(msg);
}`,
    explanation: "Choose an abstract class when sharing state or substantial implementation across a family of types. Choose an interface for capability contracts, multiple-implementation scenarios, and public API surfaces where breaking changes must be minimized.",
  },
  {
    id: "cs-pattern-recursive",
    language: "csharp",
    title: "Recursive patterns — nested property matching",
    tag: "snippet",
    code: `record City(string Name, string Country);
record Address(City City, string Street);
record Customer(string Name, Address Address, decimal Balance);

string Categorize(Customer c) => c switch
{
    { Balance: > 10_000, Address.City.Country: "UK" }
        => "Premium UK customer",
    { Balance: > 5_000 }
        => "Premium customer",
    { Address.City.Name: "London" }
        => "London customer",
    _ => "Standard customer",
};`,
    explanation: "Property patterns can navigate arbitrarily deep into nested objects (Address.City.Country). Combined with relational patterns and guards, this replaces complex chains of null checks and property comparisons.",
  },
  {
    id: "cs-source-gen-di",
    language: "csharp",
    title: "Source-generated DI registration",
    tag: "understanding",
    code: `// Jab (NuGet) generates DI container code at build time — no reflection.
// Registration via attributes:

[ServiceProvider]
[Singleton(typeof(IConfiguration), typeof(Configuration))]
[Scoped(typeof(IOrderService), typeof(OrderService))]
[Transient(typeof(IEmailSender), typeof(SmtpEmailSender))]
partial class AppContainer { }

// Usage:
// var container = new AppContainer();
// var service = container.GetService<IOrderService>();

// Benefits:
// - Zero-startup reflection
// - Native AOT compatible
// - Compile-time validation of registrations`,
    explanation: "Source-generated DI containers (Jab, StrongInject) emit the container class at compile time as plain C# code — no reflection or expression trees at runtime. This enables AOT compatibility and faster startup than Microsoft.Extensions.DependencyInjection.",
  },
  {
    id: "cs-nativeaot-trim",
    language: "csharp",
    title: "Trim-safe reflection with DynamicallyAccessedMembers",
    tag: "caveats",
    code: `using System.Diagnostics.CodeAnalysis;

// Tell the trimmer which members to preserve.
void Serialize<[DynamicallyAccessedMembers(
    DynamicallyAccessedMemberTypes.PublicProperties)] T>(T obj)
{
    foreach (var prop in typeof(T).GetProperties())
        Console.WriteLine($"{prop.Name} = {prop.GetValue(obj)}");
}

// Without this attribute, the trimmer may remove properties
// and the reflection call fails at runtime with a Native AOT build.`,
    explanation: "[DynamicallyAccessedMembers] annotates which reflection operations a method performs, allowing the ILLink trimmer and Native AOT compiler to preserve those members. Without it, reflection on trimmed types causes MissingMemberException.",
  },
  {
    id: "cs-global-exception-handler",
    language: "csharp",
    title: "Global exception handling in .NET",
    tag: "snippet",
    code: `// Catch unhandled exceptions in the current AppDomain.
AppDomain.CurrentDomain.UnhandledException += (_, e) =>
{
    Console.Error.WriteLine($"FATAL: {e.ExceptionObject}");
    // Log, flush, then let the process terminate.
};

// For Tasks: observe unhandled task exceptions.
TaskScheduler.UnobservedTaskException += (_, e) =>
{
    Console.Error.WriteLine($"Unobserved task exception: {e.Exception}");
    e.SetObserved();   // prevent process termination
};

// In ASP.NET Core: use app.UseExceptionHandler() middleware.`,
    explanation: "UnhandledException fires for exceptions that escape all catch blocks. UnobservedTaskException fires when a faulted Task is GC'd without its exception being observed. In production, log these events and alert — they indicate bugs.",
  },
  {
    id: "cs-valuetuple-names",
    language: "csharp",
    title: "Value tuple element names — decompile behavior",
    tag: "caveats",
    code: `// Named tuple element names exist only at compile time (attributes).
(int Id, string Name) GetUser() => (1, "Ada");

var user = GetUser();
Console.WriteLine(user.Id);    // 1
Console.WriteLine(user.Name);  // Ada

// At runtime, names are encoded in [TupleElementNames] attributes.
// Decompiled IL sees Item1, Item2.
(int, string) same = user;     // discard names — still works
Console.WriteLine(same.Item1); // 1

// Tuple names do NOT survive dynamic, object, or reflection.`,
    explanation: "Tuple element names are metadata annotations — they exist in [TupleElementNames] attributes and are erased to Item1, Item2, ... at runtime. Reflection and dynamic dispatch cannot see named elements.",
  },
  {
    id: "cs-string-pool-intern",
    language: "csharp",
    title: "String deduplication with a HashSet pool",
    tag: "snippet",
    code: `// When parsing large files with repeated string values,
// interning via a HashSet avoids redundant allocations.
class StringPool
{
    private readonly HashSet<string> _pool = new(StringComparer.Ordinal);

    public string Intern(string s)
    {
        if (_pool.TryGetValue(s, out string? existing))
            return existing;   // return the already-stored reference
        _pool.Add(s);
        return s;
    }
}

var pool = new StringPool();
string a = pool.Intern("status");
string b = pool.Intern(new string(new[] {'s','t','a','t','u','s'}));
Console.WriteLine(ReferenceEquals(a, b));  // True`,
    explanation: "A HashSet<string> pool deduplicates equal strings so memory is shared across a large parse, just like String.Intern but without polluting the global intern table and with controlled lifetime.",
  },
  {
    id: "cs-csharp-history",
    language: "csharp",
    title: "C# version feature timeline",
    tag: "understanding",
    code: `// C# 6  (2015): string interpolation, null-conditional ?., nameof
// C# 7  (2017): tuples, pattern matching, out variables, local functions
// C# 8  (2019): nullable ref types, async streams, switch expressions, ranges
// C# 9  (2020): records, init-only, top-level statements, pattern improvements
// C# 10 (2021): global using, file-scoped namespace, extended property patterns
// C# 11 (2022): required members, raw strings, list patterns, generic math
// C# 12 (2023): primary constructors, collection expressions, inline arrays
// C# 13 (2024): params Span, field keyword, lock type, extension members (preview)

// Check the language version in .csproj:
// <LangVersion>latest</LangVersion>
// <LangVersion>12</LangVersion>`,
    explanation: "Each C# version requires a matching Roslyn compiler but targets any .NET runtime — new language features are purely compile-time transformations. Set <LangVersion> in the csproj to control which features are available.",
  },
  {
    id: "cs-async-local",
    language: "csharp",
    title: "AsyncLocal<T> — per-async-context storage",
    tag: "snippet",
    code: `AsyncLocal<string> requestId = new();

async Task HandleRequest(string id)
{
    requestId.Value = id;
    await Task.Delay(10);   // async boundary
    Console.WriteLine($"RequestId: {requestId.Value}");   // still set
    await Task.WhenAll(LogAsync(), LogAsync());
}

async Task LogAsync()
{
    await Task.Delay(5);
    Console.WriteLine($"  Log sees: {requestId.Value}");
}

await Task.WhenAll(HandleRequest("req-1"), HandleRequest("req-2"));
// Each request sees its own requestId, even across awaits`,
    explanation: "AsyncLocal<T> provides per-execution-context storage that flows across awaits and into child tasks (which inherit a copy). Changes in a child task don't propagate back to the parent — similar to ContextVar in Python.",
  },
  {
    id: "cs-managed-thread-id",
    language: "csharp",
    title: "Thread identity and ThreadLocal<T>",
    tag: "snippet",
    code: `using System.Threading;

// ThreadLocal<T> stores a separate value per thread.
var counter = new ThreadLocal<int>(() => 0);

var threads = Enumerable.Range(0, 4).Select(_ => new Thread(() =>
{
    int id = Environment.CurrentManagedThreadId;
    counter.Value++;
    Console.WriteLine($"Thread {id}: counter = {counter.Value}");
})).ToList();

threads.ForEach(t => t.Start());
threads.ForEach(t => t.Join());
// Each thread sees counter = 1 — isolated values`,
    explanation: "ThreadLocal<T> initializes a fresh value per thread via the factory function. Unlike AsyncLocal<T>, it doesn't flow across task continuations — continuations may run on different threads. Dispose ThreadLocal when done to release thread-local storage.",
  },
  {
    id: "cs-pattern-matching-switch-exhaustive",
    language: "csharp",
    title: "Exhaustive switch with compiler warning",
    tag: "snippet",
    code: `enum Direction { North, South, East, West }

string Describe(Direction d) => d switch
{
    Direction.North => "up",
    Direction.South => "down",
    Direction.East  => "right",
    Direction.West  => "left",
    // No default needed — compiler verifies all enum members are covered.
    // Adding a new Direction member causes CS8509 warning.
};

Console.WriteLine(Describe(Direction.North));  // up`,
    explanation: "When every enum member is explicitly covered in a switch expression, the compiler omits the 'not all code paths return a value' error and (with CS8509) warns if a new member is added without updating the switch — enforcing exhaustiveness at compile time.",
  },
  {
    id: "cs-init-accessor-validation",
    language: "csharp",
    title: "Validation in init accessors",
    tag: "snippet",
    code: `class Port
{
    private int _number;

    public int Number
    {
        get => _number;
        init
        {
            if (value is < 1 or > 65535)
                throw new ArgumentOutOfRangeException(
                    nameof(value), "Port must be 1–65535");
            _number = value;
        }
    }
}

var p = new Port { Number = 8080 };
Console.WriteLine(p.Number);  // 8080

try { var bad = new Port { Number = 0 }; }
catch (ArgumentOutOfRangeException e) { Console.WriteLine(e.Message); }`,
    explanation: "init accessors can contain validation logic just like set accessors. The validation runs once at object initializer time — after that the property is immutable. This gives you both correctness guarantees and convenient syntax.",
  },
  {
    id: "cs-array-creation-expressions",
    language: "csharp",
    title: "Array creation and initializer syntax",
    tag: "snippet",
    code: `// Implicit type.
var arr1 = new[] { 1, 2, 3 };

// Explicit type.
int[] arr2 = new int[5];            // zeroed
int[] arr3 = new int[] { 1, 2, 3 };

// C# 12 collection expression.
int[] arr4 = [1, 2, 3];

// Multi-dimensional.
int[,] matrix = new int[3, 3];
matrix[0, 0] = 1;

// Jagged (array of arrays).
int[][] jagged = new int[3][];
jagged[0] = new int[] { 1, 2 };
jagged[1] = new int[] { 3, 4, 5 };

// Array.Fill.
int[] filled = new int[5];
Array.Fill(filled, 7);
Console.WriteLine(string.Join(",", filled));  // 7,7,7,7,7`,
    explanation: "C# has four array variants: single-dimensional (fastest), multi-dimensional (rectangular), jagged (array of arrays), and implicitly-typed (new[]). Collection expressions [1,2,3] (C# 12) are the modern unified syntax.",
  },
  {
    id: "cs-linq-to-hashset",
    language: "csharp",
    title: "LINQ ToHashSet and ToFrozenSet",
    tag: "snippet",
    code: `string[] words = ["apple", "Banana", "cherry", "Apple"];

// ToHashSet with a comparer — deduplication included.
HashSet<string> unique = words.ToHashSet(StringComparer.OrdinalIgnoreCase);
Console.WriteLine(unique.Count);   // 3 — Apple/apple deduplicated

// Check membership in O(1).
Console.WriteLine(unique.Contains("APPLE"));  // True

// FrozenSet for read-only, optimized lookups.
System.Collections.Frozen.FrozenSet<string> frozen =
    unique.ToFrozenSet(StringComparer.OrdinalIgnoreCase);
Console.WriteLine(frozen.Contains("BANANA"));  // True`,
    explanation: "ToHashSet materializes a sequence into a set, removing duplicates. Passing a custom IEqualityComparer enables case-insensitive or culture-aware deduplication. ToFrozenSet (.NET 8) produces a read-optimized immutable set.",
  },
  {
    id: "cs-environment-newline",
    language: "csharp",
    title: "Cross-platform newline handling",
    tag: "caveats",
    code: `// Environment.NewLine is \r\n on Windows, \n on Unix.
Console.WriteLine($"Newline bytes: {
    System.Text.Encoding.ASCII.GetBytes(Environment.NewLine).Length
}");
// 2 on Windows, 1 on Unix/Mac

// Always use \n for data you control (files, network).
// Use Environment.NewLine only for user-facing terminal output.
string csv = "a,b\nc,d\n";   // always LF — cross-platform safe

// StreamWriter default: Environment.NewLine.
// Override with NewLine property:
var sw = new System.IO.StringWriter();
sw.NewLine = "\n";   // force LF regardless of OS
sw.WriteLine("line");`,
    explanation: "Environment.NewLine adapts to the OS but produces Windows CRLF in files that other tools may not expect. Hardcode \\n for data interchange; use Environment.NewLine only for text displayed in terminals or dialogs.",
  },
  {
    id: "cs-bitwise-operators",
    language: "csharp",
    title: "Bitwise and shift operators",
    tag: "snippet",
    code: `int a = 0b1100;   // 12
int b = 0b1010;   // 10

Console.WriteLine((a & b).ToString("b4"));   // 1000 — AND
Console.WriteLine((a | b).ToString("b4"));   // 1110 — OR
Console.WriteLine((a ^ b).ToString("b4"));   // 0110 — XOR
Console.WriteLine((~a).ToString());          // -13  — NOT (two's complement)

// Shift operators.
Console.WriteLine(1 << 4);   // 16  — left shift (multiply by 2^4)
Console.WriteLine(16 >> 2);  // 4   — right shift (divide by 2^2)

// Unsigned right shift (C# 11+).
int neg = -1;
Console.WriteLine((neg >>> 1).ToString("X8"));  // 7FFFFFFF`,
    explanation: "Bitwise operators work on individual bits. >>> (C# 11+) shifts right without sign extension, useful when treating int as an unsigned bit pattern. Left shift by n is equivalent to multiplying by 2^n for non-overflowing values.",
  },
  {
    id: "cs-params-array",
    language: "csharp",
    title: "params — variable-length arguments",
    tag: "snippet",
    code: `static int Sum(params int[] numbers)
{
    int total = 0;
    foreach (int n in numbers) total += n;
    return total;
}

// Call with any number of arguments.
Console.WriteLine(Sum(1, 2, 3));           // 6
Console.WriteLine(Sum(1, 2, 3, 4, 5));     // 15
Console.WriteLine(Sum());                  // 0

// Or pass an existing array.
int[] arr = [10, 20, 30];
Console.WriteLine(Sum(arr));               // 60

// C# 13: params Span<T> — no array allocation.
// static int SpanSum(params Span<int> numbers) { ... }`,
    explanation: "params allows a method to accept a variable number of arguments, which the compiler packages into an array. C# 13 adds params Span<T> and params ReadOnlySpan<T> that avoid the array allocation entirely.",
  },
  // === CSHARP BATCH 1 ===
  {
    id: "cs-enumerable-range",
    language: "csharp",
    title: "Enumerable.Range — generate a sequence of ints",
    tag: "snippet",
    code: `// Enumerable.Range(start, count) generates [start, start+count).
var nums = Enumerable.Range(1, 5).ToList();
Console.WriteLine(string.Join(", ", nums));  // 1, 2, 3, 4, 5

// Build a multiplication table column.
var col = Enumerable.Range(1, 9).Select(i => i * 7).ToList();
Console.WriteLine(string.Join(", ", col));  // 7,14,21,28,35,42,49,56,63

// Generate indices for an array.
string[] words = ["alpha", "beta", "gamma"];
var indexed = Enumerable.Range(0, words.Length)
    .Select(i => (i, words[i]))
    .ToList();`,
    explanation: "Enumerable.Range is the LINQ equivalent of Python's range() — use it with Select to create projection sequences without a for loop.",
  },
  {
    id: "cs-enumerable-repeat",
    language: "csharp",
    title: "Enumerable.Repeat — repeat a value n times",
    tag: "snippet",
    code: `// Enumerable.Repeat(element, count) yields the same value count times.
var zeros = Enumerable.Repeat(0, 5).ToList();
Console.WriteLine(string.Join(", ", zeros));  // 0, 0, 0, 0, 0

// Initialise a 2D jagged array with equal rows.
var grid = Enumerable.Repeat(new int[3], 4).ToArray();
// Warning: all rows share ONE array — use Select(x => new int[3]) instead.

var safeGrid = Enumerable.Range(0, 4)
    .Select(_ => new int[3])
    .ToArray();
safeGrid[0][1] = 9;
Console.WriteLine(safeGrid[1][1]);  // 0 — independent row`,
    explanation: "Enumerable.Repeat shares the same reference for objects; use .Select(_ => new T()) to create independent instances per slot.",
  },
  {
    id: "cs-linq-aggregate-seed",
    language: "csharp",
    title: "LINQ Aggregate with seed value",
    tag: "snippet",
    code: `int[] nums = [1, 2, 3, 4, 5];

// Aggregate(seed, func) folds left: seed op e1 op e2 ...
int product = nums.Aggregate(1, (acc, n) => acc * n);
Console.WriteLine(product);   // 120

// Build a string from words.
string[] words = ["Hello", "World", "LINQ"];
string sentence = words.Aggregate((a, b) => a + " " + b);
Console.WriteLine(sentence);  // Hello World LINQ

// With result selector (third parameter):
string csv = nums.Aggregate("", (a, n) => a + n + ",",
    s => s.TrimEnd(','));
Console.WriteLine(csv);  // 1,2,3,4,5`,
    explanation: "Aggregate is the general-purpose fold/reduce; seed provides the initial accumulator. The three-argument overload adds a final projection step.",
  },
  {
    id: "cs-linq-takewhile-skipwhile",
    language: "csharp",
    title: "TakeWhile / SkipWhile — predicate-based slicing",
    tag: "snippet",
    code: `int[] sorted = [1, 2, 3, 4, 5, 6];

// TakeWhile yields elements as long as predicate is true.
var small = sorted.TakeWhile(n => n < 4).ToList();
Console.WriteLine(string.Join(", ", small));   // 1, 2, 3

// SkipWhile skips as long as predicate is true, then yields the rest.
var rest = sorted.SkipWhile(n => n < 4).ToList();
Console.WriteLine(string.Join(", ", rest));    // 4, 5, 6

// Once the predicate fails, TakeWhile/SkipWhile stops checking.
int[] data = [1, 3, 2, 5, 4];
var head = data.TakeWhile(n => n % 2 != 0).ToList();
Console.WriteLine(string.Join(", ", head));    // 1, 3  (stops at 2)`,
    explanation: "TakeWhile/SkipWhile stop checking the predicate after the first failure — they're not Where() equivalents. Useful for processing sorted or run-length-encoded data.",
  },
  {
    id: "cs-enumerable-empty",
    language: "csharp",
    title: "Enumerable.Empty<T>() — canonical empty sequence",
    tag: "snippet",
    code: `// Returns a cached empty IEnumerable<T> — no allocation.
IEnumerable<int> empty = Enumerable.Empty<int>();
Console.WriteLine(empty.Count());   // 0
Console.WriteLine(empty.Any());     // False

// Useful as a safe default return value.
IEnumerable<string> GetNames(bool condition) =>
    condition
        ? new[] { "alice", "bob" }
        : Enumerable.Empty<string>();

// Concatenation idiom: build up from empty.
var combined = Enumerable.Empty<int>()
    .Concat(new[] { 1, 2 })
    .Concat(new[] { 3, 4 });
Console.WriteLine(string.Join(", ", combined));  // 1, 2, 3, 4`,
    explanation: "Enumerable.Empty<T>() returns a singleton empty sequence without allocating a new object each time — prefer it over new T[0] or new List<T>() as an empty return value.",
  },
  {
    id: "cs-dict-getvalueordefault",
    language: "csharp",
    title: "Dictionary.GetValueOrDefault",
    tag: "snippet",
    code: `var scores = new Dictionary<string, int>
{
    ["alice"] = 90,
    ["bob"]   = 85,
};

// GetValueOrDefault returns default(TValue) when key absent.
int aliceScore = scores.GetValueOrDefault("alice");   // 90
int zoeScore   = scores.GetValueOrDefault("zoe");     // 0

// Provide a custom default.
int carolScore = scores.GetValueOrDefault("carol", -1);  // -1

// TryGetValue is equivalent but more explicit.
if (scores.TryGetValue("alice", out int val))
    Console.WriteLine(val);  // 90`,
    explanation: "GetValueOrDefault avoids a KeyNotFoundException on missing keys without requiring a ContainsKey guard — use it when absence is normal and a default makes semantic sense.",
  },
  {
    id: "cs-string-isnullorwhitespace",
    language: "csharp",
    title: "string.IsNullOrWhiteSpace vs IsNullOrEmpty",
    tag: "snippet",
    code: `string? a = null;
string  b = "";
string  c = "   ";
string  d = "hello";

// IsNullOrEmpty: null or length == 0.
Console.WriteLine(string.IsNullOrEmpty(a));   // True
Console.WriteLine(string.IsNullOrEmpty(b));   // True
Console.WriteLine(string.IsNullOrEmpty(c));   // False  ← spaces!

// IsNullOrWhiteSpace: null, empty, or all whitespace.
Console.WriteLine(string.IsNullOrWhiteSpace(a));  // True
Console.WriteLine(string.IsNullOrWhiteSpace(b));  // True
Console.WriteLine(string.IsNullOrWhiteSpace(c));  // True  ← catches spaces
Console.WriteLine(string.IsNullOrWhiteSpace(d));  // False`,
    explanation: "Prefer IsNullOrWhiteSpace for user-input validation — a string of spaces is usually 'empty' in user intent. IsNullOrEmpty is for when spaces are significant.",
  },
  {
    id: "cs-math-clamp",
    language: "csharp",
    title: "Math.Clamp — constrain a value to a range",
    tag: "snippet",
    code: `// Math.Clamp(value, min, max) clamps value within [min, max].
Console.WriteLine(Math.Clamp(5,   1, 10));  // 5   (within range)
Console.WriteLine(Math.Clamp(-3,  1, 10));  // 1   (below min)
Console.WriteLine(Math.Clamp(15,  1, 10));  // 10  (above max)

// Works for any IComparable (int, double, float, etc.).
double brightness = Math.Clamp(inputValue, 0.0, 1.0);

// Before .NET Core 2.0 you'd write:
// Math.Max(min, Math.Min(max, value))`,
    explanation: "Math.Clamp replaces the common Math.Max(min, Math.Min(max, v)) pattern with a single readable call.",
  },
  {
    id: "cs-int-tryparse",
    language: "csharp",
    title: "int.TryParse — safe string-to-int conversion",
    tag: "snippet",
    code: `string input = "42";

// TryParse returns bool and sets 'out' parameter.
if (int.TryParse(input, out int value))
    Console.WriteLine($"Parsed: {value}");   // Parsed: 42
else
    Console.WriteLine("Not a valid integer");

// int.Parse throws FormatException on failure.
try
{
    int bad = int.Parse("abc");
}
catch (FormatException)
{
    Console.WriteLine("Parse threw");   // Parse threw
}

// NumberStyles + CultureInfo for locale-aware parsing:
// int.TryParse("1,234", NumberStyles.AllowThousands, null, out int n)`,
    explanation: "TryParse is the idiomatic 'attempt conversion without exception' pattern — always prefer it over Parse + catch when user input might be invalid.",
  },
  {
    id: "cs-stopwatch-usage",
    language: "csharp",
    title: "Stopwatch for high-resolution timing",
    tag: "snippet",
    code: `using System.Diagnostics;

var sw = Stopwatch.StartNew();

// Code to measure.
int sum = 0;
for (int i = 0; i < 1_000_000; i++) sum += i;

sw.Stop();
Console.WriteLine($"Elapsed: {sw.ElapsedMilliseconds} ms");
Console.WriteLine($"Ticks:   {sw.ElapsedTicks}");

// Stopwatch.GetTimestamp() / Stopwatch.Frequency gives raw ticks.
// Precision is platform-dependent but usually microsecond range.`,
    explanation: "Stopwatch uses QueryPerformanceCounter on Windows and CLOCK_MONOTONIC elsewhere, giving sub-millisecond timing — far more precise than DateTime.Now subtraction.",
  },
  {
    id: "cs-environment-var",
    language: "csharp",
    title: "Environment.GetEnvironmentVariable",
    tag: "snippet",
    code: `// Returns null if the variable doesn't exist.
string? dbUrl = Environment.GetEnvironmentVariable("DATABASE_URL");
Console.WriteLine(dbUrl ?? "(not set)");

// Set a variable (process-scoped by default).
Environment.SetEnvironmentVariable("MY_VAR", "hello");
Console.WriteLine(Environment.GetEnvironmentVariable("MY_VAR"));  // hello

// EnvironmentVariableTarget: Process (default), User, Machine.
string? path = Environment.GetEnvironmentVariable(
    "PATH", EnvironmentVariableTarget.Machine);`,
    explanation: "GetEnvironmentVariable returns null rather than throwing when the variable is absent — always null-check or use the ?? operator to provide a fallback.",
  },
  {
    id: "cs-string-join-2",
    language: "csharp",
    title: "string.Join — concatenate with separator",
    tag: "snippet",
    code: `string[] names = ["alice", "bob", "carol"];

// string.Join(separator, values).
Console.WriteLine(string.Join(", ", names));    // alice, bob, carol
Console.WriteLine(string.Join(" | ", names));   // alice | bob | carol
Console.WriteLine(string.Join("", names));      // alicebobcarol

// Works on any IEnumerable<T> — calls ToString() on each element.
int[] nums = [1, 2, 3, 4, 5];
Console.WriteLine(string.Join("+", nums));      // 1+2+3+4+5

// Better than a StringBuilder loop for simple cases.`,
    explanation: "string.Join is the idiomatic way to build a delimited string from a sequence. For performance with very large sequences, a StringBuilder loop is faster.",
  },
  {
    id: "cs-linq-any-optimization",
    language: "csharp",
    title: "Any() vs Count() > 0 — short-circuit vs full scan",
    tag: "snippet",
    code: `var items = Enumerable.Range(1, 1_000_000);

// Any() short-circuits at the first matching element.
bool hasEven = items.Any(n => n % 2 == 0);   // stops at 2

// Count() > 0 scans the ENTIRE sequence even if done early.
bool hasEven2 = items.Count(n => n % 2 == 0) > 0;   // scans all!

// For existence checks, always prefer Any().
bool hasAny = items.Any();   // no predicate — checks non-empty

// Count() is fine when you actually need the number.
int evens = items.Count(n => n % 2 == 0);`,
    explanation: "Any() short-circuits and returns as soon as a match is found; Count() must scan everything to get an accurate count — use Any() for existence checks.",
  },
  {
    id: "cs-string-format-args",
    language: "csharp",
    title: "string.Format with composite formatting",
    tag: "snippet",
    code: `// Composite format: {index[,alignment][:formatSpec]}
string name = "alice";
int    score = 92;

Console.WriteLine(string.Format("Name: {0}, Score: {1}", name, score));
// Name: alice, Score: 92

// Alignment: positive = right-pad, negative = left-pad.
Console.WriteLine(string.Format("{0,-10} {1,5}", name, score));
// alice          92

// Format specs.
Console.WriteLine(string.Format("{0:C}", 1234.5));   // $1,234.50
Console.WriteLine(string.Format("{0:D6}", 42));       // 000042
Console.WriteLine(string.Format("{0:P1}", 0.8547));   // 85.5%`,
    explanation: "Composite format strings predate interpolated strings and are still useful for localisation (IFormatProvider) and when format strings are loaded from resources at runtime.",
  },
  // --- understanding ---
  {
    id: "cs-value-copy",
    language: "csharp",
    title: "Value types are copied on assignment",
    tag: "understanding",
    code: `// int, double, struct — copies the bits.
int a = 5;
int b = a;    // b is a separate copy
b = 99;
Console.WriteLine(a);   // 5  — unchanged

struct Point { public int X, Y; }
Point p1 = new Point { X = 1, Y = 2 };
Point p2 = p1;    // copy
p2.X = 99;
Console.WriteLine(p1.X);   // 1  — unchanged

// Reference types copy the reference, not the object.
int[] arr1 = [1, 2, 3];
int[] arr2 = arr1;    // same array
arr2[0] = 99;
Console.WriteLine(arr1[0]);   // 99  — shared!`,
    explanation: "Value types (int, struct) copy the data on assignment; reference types (class, array, string) copy only the pointer. Passing a struct to a method also copies it.",
  },
  {
    id: "cs-ref-aliasing",
    language: "csharp",
    title: "Reference types create aliases, not copies",
    tag: "understanding",
    code: `class Box { public int Value; }

Box a = new Box { Value = 1 };
Box b = a;          // b is an alias — points to the same object

b.Value = 99;
Console.WriteLine(a.Value);   // 99 — same object

// Passing to a method: reference is copied, object is shared.
static void Mutate(Box box) { box.Value = 42; }
Mutate(a);
Console.WriteLine(a.Value);   // 42

// To pass by reference (rebindable), use 'ref'.
static void Rebind(ref Box box) { box = new Box { Value = 0 }; }`,
    explanation: "Assigning a reference type copies the reference (pointer), not the object — both variables point to the same heap object. Use ref/in/out to pass the variable itself.",
  },
  {
    id: "cs-yield-defer",
    language: "csharp",
    title: "yield return defers execution",
    tag: "understanding",
    code: `IEnumerable<int> Slow()
{
    Console.WriteLine("start");
    yield return 1;
    Console.WriteLine("after 1");
    yield return 2;
    Console.WriteLine("after 2");
}

// No output yet — the method body hasn't started.
IEnumerable<int> seq = Slow();

// Body runs lazily as we iterate.
foreach (int n in seq)
    Console.WriteLine($"got {n}");
// start
// got 1
// after 1
// got 2
// after 2`,
    explanation: "A method with yield return is a state machine — the body doesn't execute until the first MoveNext() call, and pauses at each yield. Code before the first yield runs only on first iteration.",
  },
  {
    id: "cs-await-unwraps",
    language: "csharp",
    title: "await unwraps Task<T> to T",
    tag: "understanding",
    code: `using System.Threading.Tasks;

async Task<int> GetValue() => 42;

// Task<int> is the wrapper; await unwraps to int.
Task<int> task   = GetValue();   // Task<int> — future value
int       result = await task;   // int — the actual value
Console.WriteLine(result);       // 42

// In an async method, returning T implicitly wraps in Task<T>.
async Task Demo()
{
    // These are equivalent:
    int v1 = await GetValue();     // await the task
    int v2 = GetValue().Result;    // sync wait — blocks thread!
    // Never use .Result in async code — it can deadlock.
}`,
    explanation: "await extracts the T from Task<T> and continues on a continuation; .Result blocks the thread synchronously and can deadlock in ASP.NET contexts.",
  },
  {
    id: "cs-using-order",
    language: "csharp",
    title: "using statement disposes in reverse order",
    tag: "understanding",
    code: `// Nested using blocks: inner disposes first.
using (var outer = new Resource("outer"))
using (var inner = new Resource("inner"))
{
    Console.WriteLine("using both");
}
// Dispose(inner), then Dispose(outer) — LIFO order.

// C# 8+ using declaration: disposed at end of enclosing scope.
{
    using var file = new Resource("file");
    Console.WriteLine("using file");
}  // Dispose(file) here

class Resource : IDisposable
{
    private string _name;
    public Resource(string n) { _name = n; Console.WriteLine($"Create {n}"); }
    public void Dispose() => Console.WriteLine($"Dispose {_name}");
}`,
    explanation: "Nested using blocks dispose in reverse (LIFO) order, matching the stack discipline. The C# 8 using declaration disposes at the end of its containing scope.",
  },
  {
    id: "cs-interface-default-dispatch",
    language: "csharp",
    title: "Interface default method dispatch requires interface reference",
    tag: "understanding",
    code: `interface IGreeter
{
    void Greet();
    void GreetLoud() => Console.WriteLine(ToString()?.ToUpper());  // default
}

class Person : IGreeter
{
    public string Name;
    public Person(string n) { Name = n; }
    public void Greet() => Console.WriteLine($"Hi, I'm {Name}");
    public override string ToString() => Name;
    // GreetLoud is NOT overridden — the default runs on IGreeter reference.
}

Person p = new Person("alice");
p.Greet();                       // Hi, I'm alice
// p.GreetLoud();                // Error — Person doesn't expose it

((IGreeter)p).GreetLoud();       // ALICE  — via interface reference`,
    explanation: "Default interface methods are only accessible through an interface reference, not a concrete class reference — this prevents unintended method exposure on the implementing class.",
  },
  {
    id: "cs-dynamic-dispatch",
    language: "csharp",
    title: "dynamic skips compile-time binding",
    tag: "understanding",
    code: `object obj = "hello world";

// object: compile-time binding — only object methods available.
// obj.Split(' ');  // Compile error

// dynamic: runtime binding — any method can be called.
dynamic dyn = "hello world";
var parts = dyn.Split(' ');   // resolved at runtime
Console.WriteLine(parts.Length);   // 2

// Dynamic catches errors at runtime, not compile time.
dynamic bad = 42;
try
{
    bad.NonExistent();
}
catch (Microsoft.CSharp.RuntimeBinder.RuntimeBinderException ex)
{
    Console.WriteLine(ex.Message);
}`,
    explanation: "dynamic bypasses compile-time type checking — method resolution happens via the DLR at runtime. Use sparingly; it gives up type safety and IntelliSense.",
  },
  {
    id: "cs-checked-overflow-behavior",
    language: "csharp",
    title: "checked and unchecked arithmetic overflow",
    tag: "understanding",
    code: `// Default (unchecked): overflow wraps silently.
int max = int.MaxValue;
int wrapped = max + 1;
Console.WriteLine(wrapped);   // -2147483648  (wrapped!)

// checked: throws OverflowException on overflow.
try
{
    int bad = checked(max + 1);
}
catch (OverflowException)
{
    Console.WriteLine("overflow caught");
}

// checked block for multiple statements.
checked
{
    int result = max + 1;  // throws here
}`,
    explanation: "C# arithmetic is unchecked by default for performance — overflow wraps silently. Use 'checked' in financial or safety-critical code to catch overflow at the cost of a branch per operation.",
  },
  {
    id: "cs-delegate-multicast-ret",
    language: "csharp",
    title: "Multicast delegate returns only the last invoked value",
    tag: "understanding",
    code: `Func<int> f1 = () => 1;
Func<int> f2 = () => 2;
Func<int> f3 = () => 3;

Func<int> multi = f1 + f2 + f3;

// Invokes all three but returns only the LAST value.
int result = multi();
Console.WriteLine(result);   // 3  — f1 and f2 return values discarded

// To collect all results, use GetInvocationList().
foreach (Func<int> d in multi.GetInvocationList())
    Console.WriteLine(d());   // 1, 2, 3`,
    explanation: "When a multicast delegate has a non-void return type, only the final invocation's result is returned — all intermediate results are silently discarded.",
  },
  {
    id: "cs-nullable-ref-static",
    language: "csharp",
    title: "Nullable reference types are static analysis — not runtime",
    tag: "understanding",
    code: `#nullable enable

string  nonNull = "hello";    // must not be null
string? nullable = null;       // may be null

// Compiler warns if you dereference nullable without a null check.
// nullable.Length;            // CS8602 warning
int len = nullable?.Length ?? 0;   // safe

// At RUNTIME the annotations are erased — no exception for null.
string? s = null;
string  t = s!;   // null-forgiving operator — suppresses warning
Console.WriteLine(t?.Length ?? -1);   // -1  (t is still null at runtime)`,
    explanation: "Nullable reference types add compile-time warnings only; they're completely erased at runtime. The ! (null-forgiving) operator is a static analysis hint, not a null check.",
  },
  {
    id: "cs-string-equality-2",
    language: "csharp",
    title: "String equality: value semantics via == operator override",
    tag: "understanding",
    code: `// string overloads == to do value equality, not reference equality.
string a = "hello";
string b = "hello";

Console.WriteLine(a == b);             // True  (value comparison)
Console.WriteLine(object.ReferenceEquals(a, b));  // True (interned literals)

string c = new string("hello".ToCharArray());
Console.WriteLine(a == c);             // True  (value comparison)
Console.WriteLine(object.ReferenceEquals(a, c));  // False (different objects)

// Ordinal vs culture-sensitive:
Console.WriteLine(string.Compare("A", "a", StringComparison.Ordinal));  // -32`,
    explanation: "string == does value comparison (unlike other reference types), but only because == is overloaded. Use StringComparison.Ordinal explicitly for culture-independent comparisons.",
  },
  {
    id: "cs-datetime-utcnow",
    language: "csharp",
    title: "DateTime.Now vs DateTime.UtcNow",
    tag: "understanding",
    code: `// DateTime.Now: local time with Kind=Local — depends on machine timezone.
DateTime local = DateTime.Now;
Console.WriteLine($"{local.Kind}: {local}");   // Local: 2026-...

// DateTime.UtcNow: UTC time with Kind=Utc — machine-independent.
DateTime utc = DateTime.UtcNow;
Console.WriteLine($"{utc.Kind}: {utc}");       // Utc: 2026-...

// DateTimeOffset preserves the offset — best for storage/comparison.
DateTimeOffset dto = DateTimeOffset.Now;
Console.WriteLine(dto.Offset);  // e.g. -05:00

// Rule: store UTC, display local. Use DateTimeOffset for storage.`,
    explanation: "DateTime.Now depends on the machine timezone — two machines may return different values for the 'same moment'. Use UtcNow or DateTimeOffset to avoid timezone-dependent bugs.",
  },
  {
    id: "cs-foreach-readonly",
    language: "csharp",
    title: "foreach iteration variable is read-only",
    tag: "understanding",
    code: `int[] nums = [1, 2, 3, 4, 5];

// Compile error: cannot assign to 'n' because it is a 'foreach iteration variable'.
// foreach (int n in nums) { n *= 2; }  // CS1656

// Use for with index to mutate.
for (int i = 0; i < nums.Length; i++)
    nums[i] *= 2;

Console.WriteLine(string.Join(", ", nums));  // 2, 4, 6, 8, 10

// Also: don't add/remove from a collection while iterating it.
var list = new List<int>(nums);
// foreach (int n in list) { list.Remove(n); }  // InvalidOperationException`,
    explanation: "foreach treats the iteration variable as read-only and enforces this at compile time for value types. You can't add/remove from the collection during iteration or you'll get an InvalidOperationException at runtime.",
  },
  {
    id: "cs-linq-deferred-2",
    language: "csharp",
    title: "LINQ operators are deferred — ToList/ToArray forces execution",
    tag: "understanding",
    code: `int callCount = 0;

IEnumerable<int> query = Enumerable.Range(1, 5)
    .Select(n => { callCount++; return n * 2; });

Console.WriteLine(callCount);   // 0  — not executed yet!

// Materialise with ToList.
var list = query.ToList();
Console.WriteLine(callCount);   // 5

// Iterating again re-executes the query.
var list2 = query.ToList();
Console.WriteLine(callCount);   // 10

// Use ToList()/ToArray() to materialise once for multiple iterations.`,
    explanation: "LINQ queries are lazy pipelines — they re-execute every time you iterate. Call ToList() or ToArray() to materialise and cache results when you need to iterate more than once.",
  },
  // --- structures ---
  {
    id: "cs-stack-queue-choice",
    language: "csharp",
    title: "Stack<T> (LIFO) vs Queue<T> (FIFO)",
    tag: "structures",
    code: `// Stack<T>: LIFO (Last-In, First-Out).
var stack = new Stack<string>();
stack.Push("first");
stack.Push("second");
stack.Push("third");
Console.WriteLine(stack.Pop());   // third
Console.WriteLine(stack.Peek());  // second (without removing)

// Queue<T>: FIFO (First-In, First-Out).
var queue = new Queue<string>();
queue.Enqueue("first");
queue.Enqueue("second");
queue.Enqueue("third");
Console.WriteLine(queue.Dequeue());  // first
Console.WriteLine(queue.Peek());     // second`,
    explanation: "Stack is for DFS, undo history, or call-frame simulations. Queue is for BFS, task scheduling, or producer-consumer buffers. Both are O(1) amortised for their main operations.",
  },
  {
    id: "cs-linkedlist-ops",
    language: "csharp",
    title: "LinkedList<T> — O(1) insert/remove at nodes",
    tag: "structures",
    code: `var list = new LinkedList<int>([1, 2, 3, 4, 5]);

// AddBefore / AddAfter with a node reference — O(1).
var node3 = list.Find(3)!;
list.AddBefore(node3, 99);
Console.WriteLine(string.Join(", ", list));  // 1, 2, 99, 3, 4, 5

list.Remove(node3);   // O(1) with the node reference
Console.WriteLine(string.Join(", ", list));  // 1, 2, 99, 4, 5

Console.WriteLine(list.First!.Value);  // 1
Console.WriteLine(list.Last!.Value);   // 5`,
    explanation: "LinkedList<T> gives O(1) insert/remove anywhere when you have a node reference, but O(n) for index-based access. Use it for LRU cache internals or when you need arbitrary insertion.",
  },
  {
    id: "cs-sorted-dict-2",
    language: "csharp",
    title: "SortedDictionary<K,V> vs SortedList<K,V>",
    tag: "structures",
    code: `// SortedDictionary: red-black tree — O(log n) inserts.
var sd = new SortedDictionary<string, int>
{
    ["banana"] = 2,
    ["apple"]  = 1,
    ["cherry"] = 3,
};
Console.WriteLine(string.Join(", ", sd.Keys));  // apple, banana, cherry

// SortedList: sorted array — O(n) inserts, O(log n) lookups.
// Less memory, better cache locality, slower inserts.
var sl = new SortedList<string, int>(sd);
Console.WriteLine(sl.IndexOfKey("banana"));   // 1  — array index access`,
    explanation: "SortedDictionary uses a BST (faster inserts on unsorted data); SortedList uses a sorted array (more memory-efficient, faster lookups, but O(n) inserts). Choose based on insert vs read ratio.",
  },
  {
    id: "cs-priority-queue-ops",
    language: "csharp",
    title: "PriorityQueue<TElement, TPriority>",
    tag: "structures",
    code: `// PriorityQueue dequeues the element with the SMALLEST priority first.
var pq = new PriorityQueue<string, int>();

pq.Enqueue("low",    10);
pq.Enqueue("medium",  5);
pq.Enqueue("high",    1);

while (pq.Count > 0)
{
    pq.TryDequeue(out string? item, out int priority);
    Console.WriteLine($"{priority}: {item}");
}
// 1: high
// 5: medium
// 10: low`,
    explanation: "PriorityQueue<TElement,TPriority> is a min-heap by default — smallest priority dequeues first. To simulate a max-heap, negate the priority value.",
  },
  {
    id: "cs-immutable-array-2",
    language: "csharp",
    title: "ImmutableArray<T> vs ImmutableList<T>",
    tag: "structures",
    code: `using System.Collections.Immutable;

// ImmutableArray<T>: contiguous memory — fast reads, allocation on mutation.
ImmutableArray<int> arr = [1, 2, 3];
ImmutableArray<int> arr2 = arr.Add(4);   // new array with 4 appended
Console.WriteLine(arr.Length);   // 3  — original unchanged

// ImmutableList<T>: AVL tree — O(log n) operations, structural sharing.
ImmutableList<int> list  = ImmutableList.Create(1, 2, 3);
ImmutableList<int> list2 = list.Add(4);
Console.WriteLine(list.Count);   // 3

// ImmutableArray: cache-friendly, good for read-heavy data.
// ImmutableList: better for many small mutations (structural sharing).`,
    explanation: "ImmutableArray uses a flat array with faster reads and better cache locality; ImmutableList uses an AVL tree for O(log n) persistent mutations with structural sharing.",
  },
  {
    id: "cs-concurrent-dict-2",
    language: "csharp",
    title: "ConcurrentDictionary thread-safe operations",
    tag: "structures",
    code: `using System.Collections.Concurrent;

var cd = new ConcurrentDictionary<string, int>();

// GetOrAdd: atomic read-or-insert.
int v1 = cd.GetOrAdd("key", 0);    // inserts 0, returns 0
int v2 = cd.GetOrAdd("key", 99);   // key exists, returns 0

// AddOrUpdate: atomic read-modify-write.
cd.AddOrUpdate("counter", 1, (key, old) => old + 1);
cd.AddOrUpdate("counter", 1, (key, old) => old + 1);
Console.WriteLine(cd["counter"]);   // 2

// TryUpdate: conditional update (CAS-like).
cd.TryUpdate("counter", 10, 2);    // sets to 10 only if current == 2
Console.WriteLine(cd["counter"]);   // 10`,
    explanation: "ConcurrentDictionary provides atomic compound operations (GetOrAdd, AddOrUpdate) that are safe from races without external locking. The value factory may be called multiple times under contention.",
  },
  {
    id: "cs-arraypool-usage",
    language: "csharp",
    title: "ArrayPool<T> — rent and return to avoid allocations",
    tag: "structures",
    code: `using System.Buffers;

// Rent a buffer from the shared pool — avoids GC pressure.
int[] buffer = ArrayPool<int>.Shared.Rent(1024);
try
{
    // buffer.Length may be >= 1024 (rounded up to next bucket).
    Console.WriteLine($"Got {buffer.Length} elements");

    // Use the buffer.
    for (int i = 0; i < 100; i++) buffer[i] = i;
    int sum = buffer[..100].Sum();
}
finally
{
    // MUST return the buffer — and zero it if it contains sensitive data.
    ArrayPool<int>.Shared.Return(buffer, clearArray: false);
}`,
    explanation: "ArrayPool<T>.Shared reuses large arrays instead of allocating new ones each call, dramatically reducing GC pressure in hot loops that process buffers.",
  },
  {
    id: "cs-span-memory-choice",
    language: "csharp",
    title: "Span<T> vs Memory<T> — stack vs heap context",
    tag: "structures",
    code: `// Span<T>: stack-only, synchronous, zero-copy slicing.
Span<int> span = stackalloc int[] { 1, 2, 3, 4, 5 };
Span<int> slice = span[1..4];   // [2, 3, 4] — no allocation
slice[0] = 99;
Console.WriteLine(span[1]);   // 99

// Memory<T>: heap-allocated wrapper, can cross async boundaries.
Memory<int> mem = new int[] { 1, 2, 3, 4, 5 };
Memory<int> memSlice = mem[1..4];
// Can be passed into async methods and stored as fields.

// Span can be sliced FROM Memory:
Span<int> spanFromMem = memSlice.Span;`,
    explanation: "Span<T> is the fast option for synchronous, stack-confined work. Use Memory<T> when you need to pass a buffer to an async method or store it as a field.",
  },
  {
    id: "cs-readonly-span-2",
    language: "csharp",
    title: "ReadOnlySpan<T> — zero-copy read-only view",
    tag: "structures",
    code: `// ReadOnlySpan<T> over a string — no copy.
ReadOnlySpan<char> text = "Hello, World!";
ReadOnlySpan<char> hello = text[..5];
Console.WriteLine(hello.ToString());   // Hello

// Parse without allocating.
ReadOnlySpan<char> numStr = "42";
int n = int.Parse(numStr);
Console.WriteLine(n);   // 42

// Can slice arrays without copying.
int[] data = [10, 20, 30, 40, 50];
ReadOnlySpan<int> mid = data.AsSpan(1, 3);
Console.WriteLine(string.Join(", ", mid.ToArray()));  // 20, 30, 40`,
    explanation: "ReadOnlySpan<T> provides a zero-copy view into strings, arrays, or stack memory. APIs that accept ReadOnlySpan<char> can parse strings without substring allocation.",
  },
  {
    id: "cs-bitarray-usage",
    language: "csharp",
    title: "BitArray — packed boolean flags",
    tag: "structures",
    code: `using System.Collections;

// BitArray stores bits compactly — 1 bit per boolean (vs 1 byte for bool[]).
var bits = new BitArray(8, false);
bits[0] = true;
bits[3] = true;
bits[7] = true;

Console.WriteLine(bits[3]);      // True
Console.WriteLine(bits.Count);   // 8

// Bitwise operations.
var a = new BitArray(new bool[] { true,  false, true,  false });
var b = new BitArray(new bool[] { false, false, true,  true  });
a.And(b);
// Result: false, false, true, false
foreach (bool bit in a) Console.Write(bit ? "1" : "0");  // 0010`,
    explanation: "BitArray stores booleans as single bits, using 32× less memory than a bool[]. It supports bitwise And/Or/Xor/Not in-place.",
  },
  {
    id: "cs-stringbuilder-2",
    language: "csharp",
    title: "StringBuilder vs string concatenation in loops",
    tag: "structures",
    code: `using System.Text;

// string + string creates a NEW string each time — O(n²) total.
string bad = "";
for (int i = 0; i < 10000; i++) bad += "x";   // 10000 allocations

// StringBuilder appends in-place — O(n) total.
var sb = new StringBuilder();
for (int i = 0; i < 10000; i++) sb.Append('x');
string good = sb.ToString();

// StringBuilder API.
sb.Clear();
sb.Append("Hello")
  .Append(", ")
  .AppendLine("World!")
  .Insert(0, "[");
Console.WriteLine(sb);   // [Hello, World!`,
    explanation: "String concatenation in a loop is O(n²) because each + creates a new string. StringBuilder pre-allocates a buffer and resizes geometrically, giving O(n) amortised appends.",
  },
  {
    id: "cs-list-array-choice",
    language: "csharp",
    title: "List<T> vs T[] — dynamic vs fixed",
    tag: "structures",
    code: `// T[]: fixed size, cache-friendly, lowest overhead.
int[] array = new int[5];
array[0] = 1;
// array.Add(6);  // Compile error — no Add on arrays

// List<T>: dynamic, wraps T[] internally, doubles capacity on resize.
var list = new List<int> { 1, 2, 3 };
list.Add(4);
list.Insert(0, 0);
Console.WriteLine(list.Count);      // 5
Console.WriteLine(list.Capacity);   // 6 or 8 (implementation detail)

// Convert.
int[] fromList = list.ToArray();
List<int> fromArray = new(array);`,
    explanation: "Use T[] for fixed-size, performance-critical buffers. Use List<T> when you need dynamic sizing. Internally List<T> is a T[] that doubles when full, so random access is O(1).",
  },
  {
    id: "cs-hashset-ops-2",
    language: "csharp",
    title: "HashSet<T> set operations",
    tag: "structures",
    code: `var a = new HashSet<int> { 1, 2, 3, 4 };
var b = new HashSet<int> { 3, 4, 5, 6 };

// Non-mutating queries.
Console.WriteLine(a.IsSubsetOf(new[] { 1, 2, 3, 4, 5 }));  // True
Console.WriteLine(a.Overlaps(b));                            // True

// Mutating set algebra.
a.IntersectWith(b);
Console.WriteLine(string.Join(", ", a));   // 3, 4

a = new HashSet<int> { 1, 2, 3, 4 };
a.UnionWith(b);
Console.WriteLine(string.Join(", ", a));   // 1, 2, 3, 4, 5, 6

a.ExceptWith(b);
Console.WriteLine(string.Join(", ", a));   // 1, 2`,
    explanation: "HashSet<T> exposes LINQ-free set operations (UnionWith, IntersectWith, ExceptWith, SymmetricExceptWith) that mutate in-place. Use them over LINQ for performance on large sets.",
  },
  {
    id: "cs-queue-peek-dequeue",
    language: "csharp",
    title: "Queue<T>: Peek vs Dequeue vs TryDequeue",
    tag: "structures",
    code: `var q = new Queue<string>(["a", "b", "c"]);

// Peek: look at head without removing. Throws if empty.
Console.WriteLine(q.Peek());     // a

// Dequeue: remove and return head. Throws if empty.
Console.WriteLine(q.Dequeue());  // a
Console.WriteLine(q.Count);      // 2

// TryDequeue: safe version — returns false if empty.
while (q.TryDequeue(out string? item))
    Console.WriteLine(item);   // b, c

// TryPeek: non-throwing peek.
Console.WriteLine(q.TryPeek(out _));   // False — empty`,
    explanation: "The Try* variants (TryDequeue, TryPeek) are the modern safe API — they return false instead of throwing on empty queues, eliminating the need for a Count check before dequeuing.",
  },
  // --- caveats ---
  {
    id: "cs-struct-boxing-2",
    language: "csharp",
    title: "Struct boxing via interface causes allocations",
    tag: "caveats",
    code: `interface ICounter { int Count { get; } }

struct Counter : ICounter
{
    public int Count { get; private set; }
    public void Increment() { Count++; }
}

Counter c = new Counter();
c.Increment();
Console.WriteLine(c.Count);   // 1

// Assigning to ICounter boxes the struct — creates a heap copy!
ICounter boxed = c;
Console.WriteLine(boxed.Count);   // 1 (copy of original state)

// Calling Increment on Counter after boxing doesn't affect boxed.
c.Increment();
Console.WriteLine(c.Count);      // 2
Console.WriteLine(boxed.Count);  // 1  (stale copy)`,
    explanation: "Storing a struct via an interface reference boxes it — a heap copy is created. Mutations to the original and the boxed copy are independent, which is a common source of confusion.",
  },
  {
    id: "cs-closure-loop-2",
    language: "csharp",
    title: "Closure over loop variable captures the variable, not the value",
    tag: "caveats",
    code: `var actions = new List<Action>();

for (int i = 0; i < 3; i++)
    actions.Add(() => Console.WriteLine(i));   // captures 'i' by reference

// All lambdas execute AFTER the loop, when i == 3.
foreach (var a in actions) a();   // 3, 3, 3

// Fix: capture the current value with a local copy.
var fixed_actions = new List<Action>();
for (int i = 0; i < 3; i++)
{
    int captured = i;             // new variable per iteration
    fixed_actions.Add(() => Console.WriteLine(captured));
}
foreach (var a in fixed_actions) a();   // 0, 1, 2`,
    explanation: "Lambdas close over the variable binding, not its value. In C# 5+ foreach captures correctly, but a regular for loop shares the loop variable — copy it to fix.",
  },
  {
    id: "cs-async-void-2",
    language: "csharp",
    title: "async void exceptions are unobservable",
    tag: "caveats",
    code: `// async void: fire-and-forget — exception crashes the process!
async void BadHandler()
{
    await Task.Delay(10);
    throw new InvalidOperationException("unhandled!");
    // This exception cannot be caught by the caller.
}

// async Task: caller can await and observe the exception.
async Task GoodHandler()
{
    await Task.Delay(10);
    throw new InvalidOperationException("caught by awaiter");
}

// try { BadHandler(); } catch { }  // Does NOT catch async void exceptions!
// await GoodHandler();             // This DOES propagate the exception.`,
    explanation: "async void methods have no Task to attach an exception to — the exception is re-thrown on the SynchronizationContext and typically crashes the process. Only use async void for event handlers.",
  },
  {
    id: "cs-configureawait-lib",
    language: "csharp",
    title: "ConfigureAwait(false) matters in library code",
    tag: "caveats",
    code: `// In a library, use ConfigureAwait(false) to avoid capturing context.
// Without it, continuation resumes on the original SynchronizationContext
// (UI thread, ASP.NET request context) — can deadlock or reduce throughput.

async Task<string> LibraryMethod()
{
    // ConfigureAwait(false): continue on any thread pool thread.
    await Task.Delay(100).ConfigureAwait(false);

    // If we hadn't used ConfigureAwait(false) and the caller
    // did .Result here, it would deadlock in ASP.NET classic.
    return "done";
}

// Application code can omit ConfigureAwait(false) since UI
// apps often NEED to resume on the UI thread after await.`,
    explanation: "Without ConfigureAwait(false), every await in a library tries to marshal back to the caller's SynchronizationContext — unnecessary overhead, and a deadlock risk if the caller blocks with .Result.",
  },
  {
    id: "cs-event-leak",
    language: "csharp",
    title: "Event subscriptions cause memory leaks if not unsubscribed",
    tag: "caveats",
    code: `class Publisher
{
    public event EventHandler? Changed;
    public void Fire() => Changed?.Invoke(this, EventArgs.Empty);
}

class Subscriber
{
    public Subscriber(Publisher pub)
    {
        // The publisher holds a reference to this subscriber via the event.
        pub.Changed += OnChanged;   // Subscriber is now GC-rooted via pub!
    }
    void OnChanged(object? s, EventArgs e) => Console.WriteLine("changed");
}

// Fix: unsubscribe in Dispose.
// pub.Changed -= OnChanged;
// Or use WeakReference-based event patterns.`,
    explanation: "An event subscription is a strong reference from publisher to subscriber. If the publisher outlives the subscriber, the subscriber is kept alive by the event delegate — a classic memory leak.",
  },
  {
    id: "cs-null-coalesce-laziness",
    language: "csharp",
    title: "?? evaluates the right side lazily",
    tag: "caveats",
    code: `string? cached = null;
int callCount = 0;

string Expensive()
{
    callCount++;
    return "computed";
}

// ?? evaluates right-hand side only when left side is null.
string result1 = cached ?? Expensive();
Console.WriteLine(callCount);   // 1  (called)

cached = "value";
string result2 = cached ?? Expensive();
Console.WriteLine(callCount);   // 1  (NOT called — lazy)

// ??= assigns only if the variable is null.
string? name = null;
name ??= "default";
Console.WriteLine(name);   // default`,
    explanation: "?? and ??= are short-circuit operators — the right-hand expression evaluates only when the left side is null. Useful for lazy initialisation without an explicit null check.",
  },
  {
    id: "cs-is-null-generics",
    language: "csharp",
    title: "is null vs == null for generic types",
    tag: "caveats",
    code: `// For generic T, == null may call a user-defined operator.
// 'is null' always does reference comparison, ignoring ==.

class Tricky
{
    public static bool operator ==(Tricky? a, Tricky? b) => false;  // always false!
    public static bool operator !=(Tricky? a, Tricky? b) => true;
    public override bool Equals(object? obj) => false;
    public override int GetHashCode() => 0;
}

Tricky? t = null;

Console.WriteLine(t == null);   // False  (user-defined operator!)
Console.WriteLine(t is null);   // True   (null pattern — no operator call)

// In generic code, always use 'is null' to check for null safely.`,
    explanation: "'is null' uses the null pattern which never calls user-defined == operators — always prefer it for null checks in generic code and when == might be overloaded.",
  },
  {
    id: "cs-string-ordinal",
    language: "csharp",
    title: "String comparison: Ordinal vs culture-sensitive",
    tag: "caveats",
    code: `// Default string comparison is culture-sensitive.
string a = "strasse";
string b = "straße";   // German ß

// OrdinalIgnoreCase: raw Unicode code point comparison.
Console.WriteLine(string.Compare(a, b, StringComparison.OrdinalIgnoreCase));
// non-zero — 'ss' != 'ß' in ordinal mode

Console.WriteLine(string.Compare(a, b, StringComparison.CurrentCultureIgnoreCase));
// 0 on German locale — ß == ss culturally

// Rule: use Ordinal for identifiers, paths, keys.
//       use CurrentCulture for display-facing string comparisons.
bool eq = "FILE.TXT".Equals("file.txt", StringComparison.OrdinalIgnoreCase);
Console.WriteLine(eq);  // True`,
    explanation: "Culture-sensitive comparison can give unexpected results across locales (the 'Turkish I' problem). Use Ordinal or OrdinalIgnoreCase for file paths, IDs, and protocol strings.",
  },
  {
    id: "cs-checked-wrap-2",
    language: "csharp",
    title: "Integer overflow wraps silently in unchecked context",
    tag: "caveats",
    code: `byte b = 255;
b++;   // unchecked by default — wraps to 0
Console.WriteLine(b);   // 0  (not 256!)

int big = int.MaxValue;
Console.WriteLine(big + 1);   // -2147483648  (wraps!)

// Use checked to detect overflow.
try
{
    checked { int overflow = big + 1; }
}
catch (OverflowException)
{
    Console.WriteLine("Overflow caught");
}

// In crypto, hashing, or protocol code, unexpected wrapping is a bug.`,
    explanation: "C# arithmetic wraps on overflow by default for performance. Use 'checked' blocks or the /checked compiler flag in code where overflow is always a logic error.",
  },
  {
    id: "cs-using-order-2",
    language: "csharp",
    title: "Multiple using declarations dispose in reverse order",
    tag: "caveats",
    code: `class Res : IDisposable
{
    private string _name;
    public Res(string name) { _name = name; Console.WriteLine($"Open  {name}"); }
    public void Dispose()   => Console.WriteLine($"Close {name}");
    private string name => _name;
}

{
    using var a = new Res("A");  // C# 8 declaration syntax
    using var b = new Res("B");
    using var c = new Res("C");
    Console.WriteLine("Using A, B, C");
}
// Open  A
// Open  B
// Open  C
// Using A, B, C
// Close C   ← LIFO
// Close B
// Close A`,
    explanation: "C# 8 using declarations dispose at end-of-scope in reverse declaration order (LIFO), which ensures inner/later resources are cleaned up before outer/earlier ones.",
  },
  {
    id: "cs-double-nan-2",
    language: "csharp",
    title: "NaN comparisons are always false",
    tag: "caveats",
    code: `double nan = double.NaN;

// ALL comparisons with NaN return false — even equality with itself.
Console.WriteLine(nan == nan);    // False
Console.WriteLine(nan != nan);    // True  (!!)
Console.WriteLine(nan < 1.0);    // False
Console.WriteLine(nan > 1.0);    // False

// Use double.IsNaN() to test for NaN.
Console.WriteLine(double.IsNaN(nan));   // True

// Common source of bugs in floating-point accumulations.
double result = 0.0 / 0.0;
Console.WriteLine(double.IsNaN(result));   // True`,
    explanation: "IEEE 754 mandates that NaN is unordered with everything including itself — nan != nan is True. Always use double.IsNaN() rather than == comparison to detect NaN.",
  },
  {
    id: "cs-ref-struct-boxing",
    language: "csharp",
    title: "ref struct cannot be boxed or stored on the heap",
    tag: "caveats",
    code: `// ref struct (like Span<T>) is always on the stack.
Span<int> span = [1, 2, 3];

// Cannot box a ref struct to object.
// object o = span;           // CS0029 compile error

// Cannot use as generic type argument.
// var list = new List<Span<int>>();  // CS0306 compile error

// Cannot be a field of a regular class or struct.
// class Bad { Span<int> _span; }    // CS8345 compile error

// CAN be a field of another ref struct.
ref struct Wrapper { public Span<int> Data; }`,
    explanation: "ref struct is stack-only by design — this allows zero-copy Span<T> slices, but prevents boxing, async usage, and storage in heap-allocated containers.",
  },
  {
    id: "cs-delegate-exception",
    language: "csharp",
    title: "Exception in multicast delegate stops remaining invocations",
    tag: "caveats",
    code: `Action chain = () => Console.WriteLine("handler 1");
chain += () => throw new InvalidOperationException("handler 2 fails");
chain += () => Console.WriteLine("handler 3");

try
{
    chain();
}
catch (InvalidOperationException e)
{
    Console.WriteLine($"Caught: {e.Message}");
}
// handler 1
// Caught: handler 2 fails   ← handler 3 never runs!

// To invoke all: use GetInvocationList() + try/catch per delegate.`,
    explanation: "A multicast delegate stops at the first exception — subsequent handlers never fire. Use GetInvocationList() with per-invocation exception handling when all handlers must run.",
  },
  {
    id: "cs-finalizer-order",
    language: "csharp",
    title: "Finalizers run non-deterministically",
    tag: "caveats",
    code: `class Resource
{
    public Resource()  => Console.WriteLine("Created");

    // Finalizer (destructor syntax): called by GC, not by user code.
    ~Resource()        => Console.WriteLine("Finalized");

    public void Dispose() => GC.SuppressFinalize(this);
}

// Finalization is:
// - Non-deterministic: GC decides WHEN it runs.
// - Not guaranteed: may not run if process exits abruptly.
// - On a separate finalizer thread.

// Fix: implement IDisposable and call Dispose() explicitly.
// Use the finalizer ONLY as a safety net, and call SuppressFinalize
// in Dispose() so well-behaved code doesn't pay the finalizer cost.`,
    explanation: "Never rely on finalizers for timely resource cleanup — the GC may delay them arbitrarily. Implement IDisposable, call SuppressFinalize in Dispose, and use a 'using' block.",
  },
  // --- types ---
  {
    id: "cs-integer-ranges",
    language: "csharp",
    title: "Integer type sizes and ranges",
    tag: "types",
    code: `// Signed integers.
Console.WriteLine($"sbyte:  {sbyte.MinValue} to {sbyte.MaxValue}");    // -128 to 127
Console.WriteLine($"short:  {short.MinValue} to {short.MaxValue}");    // -32768 to 32767
Console.WriteLine($"int:    {int.MinValue} to {int.MaxValue}");        // ±2.1 billion
Console.WriteLine($"long:   {long.MinValue} to {long.MaxValue}");      // ±9.2 × 10¹⁸

// Unsigned integers.
Console.WriteLine($"byte:   0 to {byte.MaxValue}");      // 0 to 255
Console.WriteLine($"ushort: 0 to {ushort.MaxValue}");    // 0 to 65535
Console.WriteLine($"uint:   0 to {uint.MaxValue}");      // 0 to 4.3 billion
Console.WriteLine($"ulong:  0 to {ulong.MaxValue}");     // 0 to 18.4 × 10¹⁸`,
    explanation: "C# has 8 integer types (4 signed, 4 unsigned) ranging from 8-bit byte/sbyte to 64-bit long/ulong. Always pick the smallest type that fits to save memory in arrays.",
  },
  {
    id: "cs-float-double-precision",
    language: "csharp",
    title: "float vs double vs decimal precision",
    tag: "types",
    code: `// float:   32-bit IEEE 754 — ~7 significant digits.
float f = 1.23456789f;
Console.WriteLine(f);           // 1.2345679 (rounded)

// double:  64-bit IEEE 754 — ~15-17 significant digits.
double d = 1.23456789012345678;
Console.WriteLine(d);           // 1.2345678901234568 (rounded)

// decimal: 128-bit fixed-point — 28-29 significant digits, no rounding.
decimal m = 0.1m + 0.2m;
Console.WriteLine(m);           // 0.3  (exact)
Console.WriteLine(0.1 + 0.2);  // 0.30000000000000004 (double)`,
    explanation: "float and double are binary floating-point (fast but imprecise for base-10). decimal is base-10 fixed-point — exact for monetary arithmetic but ~20× slower than double.",
  },
  {
    id: "cs-nint-nuint-2",
    language: "csharp",
    title: "nint / nuint — native-size integers",
    tag: "types",
    code: `// nint (native int) is 32-bit on 32-bit OS, 64-bit on 64-bit OS.
nint a = 42;
Console.WriteLine($"nint size: {IntPtr.Size} bytes");  // 8 on 64-bit OS

// Same as IntPtr / UIntPtr but with arithmetic operators.
nint b = a + 10;
Console.WriteLine(b);   // 52

// Useful for interop code (P/Invoke handles, pointer arithmetic).
nint ptr = (nint)0x00FF_FFFF;

// nuint is the unsigned variant.
nuint u = uint.MaxValue;
u++;
Console.WriteLine(u);   // 4294967296 on 64-bit (no overflow)`,
    explanation: "nint/nuint are the idiomatic replacement for IntPtr/UIntPtr in arithmetic — they support +,-,*,/ operators and scale to the platform's pointer size.",
  },
  {
    id: "cs-char-vs-string-2",
    language: "csharp",
    title: "char is a single UTF-16 code unit, string is a sequence",
    tag: "types",
    code: `char   c = 'A';              // single UTF-16 code unit (2 bytes)
string s = "Hello";          // immutable sequence of chars

Console.WriteLine(c == 65);  // True (char is numeric)
Console.WriteLine((int)c);   // 65

// char arithmetic.
char next = (char)(c + 1);
Console.WriteLine(next);     // B

// string is not char[] but exposes indexer.
char first = s[0];           // 'H'
// s[0] = 'h';               // Compile error — immutable

// Emoji / surrogate pairs need two chars.
string emoji = "😀";
Console.WriteLine(emoji.Length);  // 2  (surrogate pair!)`,
    explanation: "char is a 16-bit UTF-16 code unit, not a full Unicode codepoint. Emoji and characters outside the BMP use two chars (surrogate pairs). Use StringInfo for correct grapheme counting.",
  },
  {
    id: "cs-dynamic-vs-object-2",
    language: "csharp",
    title: "dynamic vs object — DLR dispatch vs casting",
    tag: "types",
    code: `object obj = "hello";

// object: must cast to access string methods.
string upper = ((string)obj).ToUpper();   // explicit cast
Console.WriteLine(upper);   // HELLO

// dynamic: method resolved at runtime by the DLR.
dynamic dyn = "hello";
string upper2 = dyn.ToUpper();   // no cast — runtime dispatch
Console.WriteLine(upper2);  // HELLO

// Key differences:
// object: compile-time error if wrong method; cast at compile time.
// dynamic: runtime error if wrong method; no IntelliSense; slower.

// Use dynamic for COM interop, JSON deserialization, scripting.`,
    explanation: "dynamic bypasses compile-time type checking; object requires explicit casts. dynamic enables flexible interop but sacrifices type safety and IDE support.",
  },
  {
    id: "cs-nullable-struct-2",
    language: "csharp",
    title: "Nullable<T> — value type with null semantics",
    tag: "types",
    code: `// T? is syntactic sugar for Nullable<T>.
int?  n1 = 42;
int?  n2 = null;

// HasValue / Value.
Console.WriteLine(n1.HasValue);   // True
Console.WriteLine(n2.HasValue);   // False

try { _ = n2.Value; }             // InvalidOperationException!
catch { Console.WriteLine("null value!"); }

// GetValueOrDefault is safe.
Console.WriteLine(n2.GetValueOrDefault(0));   // 0

// Nullable lifting: arithmetic propagates null.
int? result = n1 + n2;
Console.WriteLine(result.HasValue);   // False`,
    explanation: "Nullable<T> is a struct with a HasValue flag — it adds 4-8 bytes overhead compared to T. Arithmetic is 'lifted' so any null operand yields null, similar to SQL.",
  },
  {
    id: "cs-enum-cast-2",
    language: "csharp",
    title: "Enum underlying type and casting",
    tag: "types",
    code: `enum Color : byte  { Red = 1, Green = 2, Blue = 4 }
enum Status       { Active = 0, Inactive = 1, Pending = 2 }

// Cast to underlying type.
byte b = (byte)Color.Green;
Console.WriteLine(b);   // 2

// Cast from int — valid even for undefined values!
Color c = (Color)99;
Console.WriteLine(c);   // 99  (no exception)

// Safe check: IsDefined.
Console.WriteLine(Enum.IsDefined(typeof(Color), (byte)2));   // True
Console.WriteLine(Enum.IsDefined(typeof(Color), (byte)99));  // False

// Default underlying type is int; enum.GetUnderlyingType() reveals it.`,
    explanation: "Casting an out-of-range int to an enum doesn't throw — always use Enum.IsDefined or a flag-check if you accept untrusted enum values.",
  },
  {
    id: "cs-typeof-gettype-3",
    language: "csharp",
    title: "typeof vs GetType() — compile-time vs runtime",
    tag: "types",
    code: `class Animal { }
class Dog : Animal { }

Animal a = new Dog();

// typeof: compile-time type token — works on type names, not instances.
Type animalType = typeof(Animal);
Console.WriteLine(animalType.Name);   // Animal

// GetType(): runtime type of the actual object.
Type runtimeType = a.GetType();
Console.WriteLine(runtimeType.Name);  // Dog  (polymorphic!)

// typeof vs GetType for type checks.
Console.WriteLine(a.GetType() == typeof(Dog));     // True  (exact)
Console.WriteLine(a.GetType() == typeof(Animal));  // False
Console.WriteLine(a is Animal);                    // True  (hierarchy)`,
    explanation: "typeof(T) is a compile-time operator; GetType() is a virtual method that returns the actual runtime type. Use GetType() for polymorphic type dispatch, typeof for static metadata.",
  },
  {
    id: "cs-hashcode-equals-2",
    language: "csharp",
    title: "GetHashCode and Equals must be consistent",
    tag: "types",
    code: `// Equal objects MUST have equal hash codes.
// The reverse is not required (hash collisions are allowed).

record struct Point(int X, int Y);

var p1 = new Point(1, 2);
var p2 = new Point(1, 2);

Console.WriteLine(p1 == p2);             // True (record equality)
Console.WriteLine(p1.GetHashCode() == p2.GetHashCode()); // True

// Storing in a HashSet relies on both.
var set = new HashSet<Point> { p1 };
Console.WriteLine(set.Contains(p2));    // True

// Broken class: same hash, inconsistent Equals → unpredictable dict behaviour.`,
    explanation: "If two objects are equal via Equals(), their GetHashCode() MUST return the same value. Violating this contract silently breaks HashSet, Dictionary, and LINQ Distinct.",
  },
  {
    id: "cs-string-intern-3",
    language: "csharp",
    title: "string.Intern and string.IsInterned",
    tag: "types",
    code: `// String literals are automatically interned at compile time.
string a = "hello";
string b = "hello";
Console.WriteLine(object.ReferenceEquals(a, b));  // True (interned)

// Dynamically created strings are NOT automatically interned.
string c = new string("hello".ToCharArray());
Console.WriteLine(object.ReferenceEquals(a, c));  // False

// Explicitly intern a dynamic string.
string d = string.Intern(c);
Console.WriteLine(object.ReferenceEquals(a, d));  // True

// string.IsInterned returns the interned version or null.
Console.WriteLine(string.IsInterned("hello") != null);  // True`,
    explanation: "String interning makes reference equality work for commonly reused strings, saving memory in tables. Use string.Intern() for strings that appear thousands of times in long-running apps.",
  },
  {
    id: "cs-half-float",
    language: "csharp",
    title: "Half — 16-bit floating-point type (C# 11)",
    tag: "types",
    code: `// System.Half: 16-bit IEEE 754 float — ~3 significant digits.
Half h = (Half)3.14f;
Console.WriteLine(h);           // 3.14  (approximate)
Console.WriteLine(Half.Epsilon);  // very small number ~6e-5
Console.WriteLine(Half.MaxValue); // 65504

// Useful for ML model weights and GPU interop (HLSL, Metal, CUDA).
Half[] weights = new Half[1000];   // 2KB vs 4KB for float[]

// Arithmetic promotes to float/double.
float result = (float)h * 2f;
Console.WriteLine(result);   // 6.28...`,
    explanation: "Half is a 16-bit float with reduced range and precision, primarily used for machine learning weight storage and GPU memory — it halves the bandwidth of float arrays.",
  },
  {
    id: "cs-int128",
    language: "csharp",
    title: "Int128 / UInt128 — 128-bit integers (C# 11)",
    tag: "types",
    code: `// Int128 / UInt128: 128-bit integer types (no overflow for huge numbers).
Int128 big = Int128.MaxValue;
Console.WriteLine(big);
// 170141183460469231731687303715884105727

UInt128 ubig = UInt128.MaxValue;
Console.WriteLine(ubig);
// 340282366920938463463374607431768211455

// Arithmetic works normally.
Int128 product = (Int128)long.MaxValue * 1000;
Console.WriteLine(product);  // 9223372036854775807000

// Useful for cryptography, large identifier spaces, fixed-point math.`,
    explanation: "Int128/UInt128 provide 128-bit integer arithmetic without BigInteger's heap allocation — useful when long would overflow but full arbitrary-precision isn't needed.",
  },
  {
    id: "cs-var-dynamic-2",
    language: "csharp",
    title: "var is compile-time type inference — not dynamic",
    tag: "types",
    code: `// 'var' infers the type at COMPILE TIME from the initialiser.
var x = 42;            // int   — fully type-safe
var s = "hello";       // string
var list = new List<int>();  // List<int>

// x is an int — you can't assign a string to it.
// x = "oops";  // CS0029 compile error

// 'dynamic' defers ALL binding to RUNTIME.
dynamic d = 42;
d = "now a string";   // allowed — type changes at runtime!

// IntelliSense for var: full support (knows the type).
// IntelliSense for dynamic: none (type unknown at edit time).`,
    explanation: "var is purely a compile-time shorthand — the type is fixed at declaration. dynamic is a runtime type that bypasses compile-time binding entirely.",
  },
  {
    id: "cs-decimal-precision-2",
    language: "csharp",
    title: "decimal: 28-29 significant digits, base-10",
    tag: "types",
    code: `// decimal is stored as [coefficient × 10^exponent] — exact for base-10.
decimal a = 0.1m;
decimal b = 0.2m;
Console.WriteLine(a + b);          // 0.3   (exact!)
Console.WriteLine(0.1 + 0.2);     // 0.30000000000000004 (double)

// 28-29 significant digits.
decimal precise = 1.2345678901234567890123456789m;
Console.WriteLine(precise);
// 1.2345678901234567890123456789

// Range: ±7.9 × 10²⁸ — smaller than double's ±1.8 × 10³⁰⁸.

// Performance: ~20× slower than double for arithmetic.`,
    explanation: "decimal is base-10 and exact for monetary arithmetic — 0.1m + 0.2m == 0.3m. The trade-off is a narrower range and slower operations compared to double.",
  },
  // --- families ---
  {
    id: "cs-task-valuetask-2",
    language: "csharp",
    title: "Task vs ValueTask — when the synchronous path is common",
    tag: "families",
    code: `// Task: always allocates a heap object.
async Task<int> AlwaysAsync() { await Task.Delay(1); return 42; }

// ValueTask: avoids allocation when result is already available.
async ValueTask<int> MaybeSync(bool fast)
{
    if (fast) return 42;              // synchronous path — no allocation
    await Task.Delay(1);
    return 42;
}

// ValueTask can only be awaited ONCE.
var vt = MaybeSync(false);
await vt;
// await vt;  // Wrong — do not await twice!

// Use ValueTask for hot paths where sync completion is common.`,
    explanation: "ValueTask avoids the Task heap allocation when the method returns synchronously — valuable in high-throughput APIs like caches. Only await a ValueTask once; use AsTask() if you need to await multiple times.",
  },
  {
    id: "cs-ienumerable-iqueryable",
    language: "csharp",
    title: "IEnumerable<T> vs IQueryable<T>",
    tag: "families",
    code: `// IEnumerable<T>: in-memory, delegates executed as C# lambdas.
int[] nums = [1, 2, 3, 4, 5, 6];
IEnumerable<int> evenEnum = nums.Where(n => n % 2 == 0);  // LINQ-to-Objects

// IQueryable<T>: translates expression trees to a query (e.g. SQL).
// IQueryable<User> query = dbContext.Users.Where(u => u.Active);
// → translated to: SELECT * FROM Users WHERE Active = 1

// Key difference: AsQueryable defers to provider.
var list = new List<int> { 1, 2, 3, 4, 5 };
IQueryable<int> q = list.AsQueryable().Where(n => n > 2);
// Still runs in-memory here, but IQueryable interface is provider-agnostic.`,
    explanation: "IEnumerable runs queries in-process on materialised data; IQueryable converts expression trees to a query language (SQL, MongoDB) and executes on the server. Always use IQueryable for ORM filters.",
  },
  {
    id: "cs-action-func-predicate-2",
    language: "csharp",
    title: "Action vs Func vs Predicate",
    tag: "families",
    code: `// Action<T...>: void return, 0-16 parameters.
Action<string>   log    = msg => Console.WriteLine(msg);
Action           noop   = () => {};

// Func<T..., TResult>: non-void return, last type is return type.
Func<int, int>    square = n => n * n;
Func<int, int, int> add  = (a, b) => a + b;

// Predicate<T>: exactly Func<T, bool> — one arg, bool return.
Predicate<int>  isEven = n => n % 2 == 0;

log("hello");
Console.WriteLine(square(5));    // 25
Console.WriteLine(isEven(4));    // True

// Predicate<T> and Func<T, bool> are different delegate types
// even though they represent the same function signature.`,
    explanation: "Action, Func, and Predicate cover the common delegate shapes without defining custom types. Predicate<T> exists for historical List<T>/Array APIs that predate LINQ.",
  },
  {
    id: "cs-idisposable-async-2",
    language: "csharp",
    title: "IDisposable vs IAsyncDisposable",
    tag: "families",
    code: `// IDisposable: synchronous cleanup — 'using' statement.
class SyncResource : IDisposable
{
    public void Dispose() => Console.WriteLine("sync disposed");
}

// IAsyncDisposable: async cleanup — 'await using' statement.
class AsyncResource : IAsyncDisposable
{
    public async ValueTask DisposeAsync()
    {
        await Task.Delay(10);   // e.g. flush a network buffer
        Console.WriteLine("async disposed");
    }
}

using  var s = new SyncResource();   // calls Dispose() at scope end
await using var a = new AsyncResource();  // calls DisposeAsync() at scope end`,
    explanation: "Use IAsyncDisposable for resources that need async I/O on cleanup (flushing to a file, closing a connection). 'await using' is the async equivalent of 'using'.",
  },
  {
    id: "cs-memory-span-2",
    language: "csharp",
    title: "Memory<T> vs Span<T> — what can go async",
    tag: "families",
    code: `// Span<T>: stack-only (ref struct), high-performance, sync only.
void ProcessSync(Span<byte> data)
{
    data[0] = 0xFF;   // direct buffer manipulation
}

// Memory<T>: heap-compatible, can cross async boundaries.
async Task ProcessAsync(Memory<byte> data)
{
    // Can be stored as a field, passed to async methods.
    await Task.Delay(1);
    data.Span[0] = 0xFF;  // Span property for synchronous access
}

// Both are zero-copy views into arrays, strings, or pooled buffers.
byte[] arr = new byte[100];
ProcessSync(arr);
await ProcessAsync(arr);`,
    explanation: "Span<T> is the fast stack-only option for synchronous buffer work. Use Memory<T> when the buffer needs to survive an await boundary or be stored as a class field.",
  },
  {
    id: "cs-list-interfaces",
    language: "csharp",
    title: "List<T> vs IList<T> vs IReadOnlyList<T>",
    tag: "families",
    code: `// IReadOnlyList<T>: Count + indexed read — cannot add/remove.
IReadOnlyList<int> ro = new[] { 1, 2, 3 };
Console.WriteLine(ro[0]);    // 1
// ro.Add(4);                // Compile error

// IList<T>: extends ICollection<T> — add, remove, indexed read/write.
IList<int> mutable = new List<int> { 1, 2, 3 };
mutable.Add(4);
mutable[0] = 99;

// List<T>: full concrete type with Sort, FindAll, Capacity, etc.
List<int> full = new List<int> { 1, 2, 3 };
full.Sort();

// API design rule: accept the narrowest interface, return the narrowest.
static IReadOnlyList<int> GetItems() => new[] { 1, 2 };`,
    explanation: "Accept IReadOnlyList<T> in method parameters when you only read — callers can pass arrays or lists. Return IReadOnlyList<T> to hide the mutable implementation. Use List<T> internally.",
  },
  {
    id: "cs-cancellation-source",
    language: "csharp",
    title: "CancellationTokenSource vs CancellationToken",
    tag: "families",
    code: `using System.Threading;

// CancellationTokenSource: the producer — triggers cancellation.
var cts = new CancellationTokenSource();

// CancellationToken: the consumer — passed to methods being cancelled.
CancellationToken token = cts.Token;

// Cancel after 500ms.
cts.CancelAfter(TimeSpan.FromMilliseconds(500));

try
{
    await Task.Delay(2000, token);   // will be cancelled
}
catch (OperationCanceledException)
{
    Console.WriteLine("Cancelled!");
}
finally { cts.Dispose(); }`,
    explanation: "Keep CancellationTokenSource private (you own cancellation); pass only CancellationToken to external APIs (they can check but not cancel). Dispose the source when done.",
  },
  {
    id: "cs-semaphore-mutex-2",
    language: "csharp",
    title: "SemaphoreSlim vs Mutex vs Monitor",
    tag: "families",
    code: `// Monitor / lock: fast, thread-affine, in-process only.
object _lock = new();
lock (_lock) { /* critical section */ }

// SemaphoreSlim: allows N concurrent entries, supports async.
var sem = new SemaphoreSlim(initialCount: 3);
await sem.WaitAsync();   // async-friendly acquire
try { /* up to 3 threads here */ }
finally { sem.Release(); }

// Mutex: cross-process named synchronisation (heavier).
using var mutex = new Mutex(false, "MyApp_GlobalMutex");
mutex.WaitOne();
try { /* single process owns this */ }
finally { mutex.ReleaseMutex(); }`,
    explanation: "lock/Monitor for simple in-process mutual exclusion. SemaphoreSlim for rate-limiting and async-compatible gates. Mutex for cross-process synchronisation.",
  },
  {
    id: "cs-lazy-func-2",
    language: "csharp",
    title: "Lazy<T> vs Func<T> — deferred initialisation",
    tag: "families",
    code: `// Func<T>: factory called every time you invoke it.
Func<string> factory = () => { Console.WriteLine("Computing"); return "result"; };
_ = factory();  // Computing
_ = factory();  // Computing  (computed twice)

// Lazy<T>: factory called ONCE on first access, result cached.
Lazy<string> lazy = new(() => { Console.WriteLine("Computing"); return "result"; });
_ = lazy.Value;  // Computing
_ = lazy.Value;  // (no output — cached)

// Lazy<T>(LazyThreadSafetyMode.ExecutionAndPublication)
// guarantees thread-safe single initialisation.`,
    explanation: "Lazy<T> is the canonical deferred singleton — the factory runs at most once (thread-safely by default), caches the result, and exposes it via .Value.",
  },
  {
    id: "cs-weak-reference-2",
    language: "csharp",
    title: "WeakReference<T> — observe without preventing GC",
    tag: "families",
    code: `class Cache
{
    private WeakReference<byte[]> _buffer = new(null!);

    public byte[] GetOrCreate()
    {
        if (!_buffer.TryGetTarget(out byte[]? buf))
        {
            buf = new byte[1024 * 1024];   // 1 MB
            _buffer.SetTarget(buf);
            Console.WriteLine("Allocated");
        }
        else Console.WriteLine("Reused");
        return buf;
    }
}

var cache = new Cache();
var b1 = cache.GetOrCreate();  // Allocated
var b2 = cache.GetOrCreate();  // Reused (b1 still in scope)`,
    explanation: "WeakReference<T> lets you cache an object without preventing GC collection — TryGetTarget returns false when the object has been collected. Useful for memory-sensitive caches.",
  },
  {
    id: "cs-string-comparer-2",
    language: "csharp",
    title: "StringComparer choices for collections",
    tag: "families",
    code: `// Use StringComparer to specify comparison semantics for collections.

// Case-insensitive dictionary.
var dict = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
dict["KEY"] = 1;
Console.WriteLine(dict["key"]);   // 1 — case-insensitive lookup

// Case-insensitive HashSet.
var set = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
set.Add("Alice");
Console.WriteLine(set.Contains("alice"));   // True

// Available comparers:
// Ordinal, OrdinalIgnoreCase — byte-by-byte, culture-agnostic
// CurrentCulture, InvariantCulture (+ IgnoreCase variants)`,
    explanation: "Pass a StringComparer to Dictionary and HashSet constructors to control case sensitivity. Ordinal is fastest and culture-agnostic — preferred for identifiers, keys, and paths.",
  },
  {
    id: "cs-record-vs-struct",
    language: "csharp",
    title: "record (class) vs record struct — heap vs stack",
    tag: "families",
    code: `// record (class): heap-allocated, reference semantics for identity,
//                  value semantics for equality.
record Point(int X, int Y);

Point p1 = new(1, 2);
Point p2 = new(1, 2);
Console.WriteLine(p1 == p2);        // True (value equality)
Console.WriteLine(object.ReferenceEquals(p1, p2));  // False (different refs)

// record struct: stack-allocated, fully value-semantic.
record struct PointS(int X, int Y);

PointS s1 = new(1, 2);
PointS s2 = s1;          // copy — independent
s2 = s2 with { X = 99 };
Console.WriteLine(s1.X); // 1 — unchanged`,
    explanation: "record (class) gives value equality with reference-type allocation. record struct gives the same equality semantics on the stack — use for small, frequently copied immutable values.",
  },
  {
    id: "cs-exception-types-2",
    language: "csharp",
    title: "Exception hierarchy — what to catch when",
    tag: "families",
    code: `// Exception (base): most errors your code handles.
//   SystemException: runtime errors (NullReferenceException, IndexOutOfRange...)
//   ApplicationException: app-defined (avoid — use Exception directly)
//   IOException: I/O failures
//   TaskCanceledException: cancelled task (derives from OperationCanceledException)

try
{
    int[] arr = new int[3];
    int x = arr[10];             // IndexOutOfRangeException
}
catch (IndexOutOfRangeException ex)
{
    Console.WriteLine($"index: {ex.Message}");
}
catch (Exception ex)             // catch-all fallback
{
    Console.WriteLine($"other: {ex.GetType().Name}");
}`,
    explanation: "Catch the most specific exception first; catch Exception last as a fallback. Never catch Exception just to re-throw — let it propagate. Avoid catching SystemException directly.",
  },
  {
    id: "cs-timer-types",
    language: "csharp",
    title: "System.Timers.Timer vs PeriodicTimer vs Task.Delay loop",
    tag: "families",
    code: `using System.Timers;

// System.Timers.Timer: thread-pool callback, can overlap.
var timer = new System.Timers.Timer(100);
timer.Elapsed += (s, e) => Console.WriteLine("tick");
timer.Start();
await Task.Delay(350);
timer.Stop();

// PeriodicTimer (.NET 6+): async, no overlap, cooperative cancellation.
using var pt = new PeriodicTimer(TimeSpan.FromMilliseconds(100));
for (int i = 0; i < 3; i++)
{
    await pt.WaitForNextTickAsync();
    Console.WriteLine("periodic tick");
}
// No overlap possible — WaitForNextTickAsync won't return until current handling done.`,
    explanation: "PeriodicTimer is the modern choice for async periodic work — it prevents tick overlap by design and supports clean cancellation via CancellationToken. System.Timers.Timer callbacks can overlap on the thread pool.",
  },
  // --- classes ---
  {
    id: "cs-abstract-ctor-2",
    language: "csharp",
    title: "Abstract class can have a constructor",
    tag: "classes",
    code: `abstract class Shape
{
    public string Color { get; }

    // Abstract classes can have constructors — called via base().
    protected Shape(string color)
    {
        Color = color;
    }

    public abstract double Area();
}

class Circle : Shape
{
    public double Radius { get; }

    public Circle(string color, double radius) : base(color)
    {
        Radius = radius;
    }

    public override double Area() => Math.PI * Radius * Radius;
}

var c = new Circle("red", 5);
Console.WriteLine($"{c.Color} circle, area={c.Area():F2}");`,
    explanation: "Abstract classes can have constructors to initialise shared state; they're called through base() in the derived class constructor. The abstract class itself still can't be instantiated directly.",
  },
  {
    id: "cs-sealed-jit",
    language: "csharp",
    title: "sealed class enables JIT devirtualisation",
    tag: "classes",
    code: `// sealed prevents inheritance — no subclass can override methods.
sealed class FastCalc
{
    // Because the class is sealed, the JIT can devirtualise virtual calls
    // and inline them — no virtual dispatch overhead.
    public virtual double Compute(double x) => x * x;
}

sealed class Point
{
    public int X { get; init; }
    public int Y { get; init; }
}

// sealed record: record semantics + sealed optimisation.
sealed record Coordinate(double Lat, double Lon);

// sealing also prevents unintended extension of security-sensitive types.`,
    explanation: "sealed removes the virtual dispatch overhead — the JIT knows exactly which method will be called and can inline it. Sealing also prevents misuse of types where inheritance would be dangerous.",
  },
  {
    id: "cs-partial-class-2",
    language: "csharp",
    title: "partial class — splitting across files",
    tag: "classes",
    code: `// File: Person.cs
public partial class Person
{
    public string Name { get; set; } = "";
    public int Age  { get; set; }
}

// File: Person.Methods.cs
public partial class Person
{
    public string Greet() => $"Hi, I'm {Name}, age {Age}";
    public bool IsAdult() => Age >= 18;
}

// Both parts merge at compile time — same class.
var p = new Person { Name = "alice", Age = 20 };
Console.WriteLine(p.Greet());     // Hi, I'm alice, age 20
Console.WriteLine(p.IsAdult());   // True

// Primary use: separating designer-generated code from hand-written code.`,
    explanation: "partial class lets you split a type across files — the most common use is keeping IDE/code-generator output separate from hand-written logic so regeneration doesn't overwrite your code.",
  },
  {
    id: "cs-static-class-3",
    language: "csharp",
    title: "static class — utility class constraints",
    tag: "classes",
    code: `// A static class:
// - cannot be instantiated
// - cannot be inherited from
// - all members must be static
static class MathUtils
{
    public static double Hypotenuse(double a, double b) =>
        Math.Sqrt(a * a + b * b);

    public static bool IsPrime(int n)
    {
        if (n < 2) return false;
        for (int i = 2; i * i <= n; i++)
            if (n % i == 0) return false;
        return true;
    }
}

Console.WriteLine(MathUtils.Hypotenuse(3, 4));  // 5
Console.WriteLine(MathUtils.IsPrime(17));        // True`,
    explanation: "static classes prevent instantiation and inheritance at compile time — they're the right home for stateless utility methods that don't belong to a particular object.",
  },
  {
    id: "cs-primary-ctor-2",
    language: "csharp",
    title: "Primary constructors in C# 12",
    tag: "classes",
    code: `// C# 12: primary constructor parameters become class-scoped.
class Point(int x, int y)
{
    // x and y are in scope throughout the class body.
    public int X => x;
    public int Y => y;

    public double DistanceTo(Point other)
    {
        double dx = x - other.x;
        double dy = y - other.y;
        return Math.Sqrt(dx * dx + dy * dy);
    }

    public override string ToString() => $"({x}, {y})";
}

var p = new Point(3, 4);
Console.WriteLine(p);                     // (3, 4)
Console.WriteLine(p.DistanceTo(new(0,0)));  // 5`,
    explanation: "Primary constructor parameters are captured as private fields automatically — no need to write boilerplate 'this._x = x'. They're in scope in all instance members.",
  },
  {
    id: "cs-record-custom-tostring",
    language: "csharp",
    title: "Overriding ToString on a record",
    tag: "classes",
    code: `// Record auto-generates ToString like: Person { Name = alice, Age = 30 }
record Person(string Name, int Age);

Console.WriteLine(new Person("alice", 30));
// Person { Name = alice, Age = 30 }

// Override ToString to customise.
record Employee(string Name, string Dept) : Person(Name, 0)
{
    public override string ToString() => $"[{Dept}] {Name}";
}

Console.WriteLine(new Employee("bob", "Engineering"));
// [Engineering] bob

// 'sealed' on ToString prevents further overriding.
// PrintMembers controls the auto-generated format.`,
    explanation: "Records auto-generate a ToString that lists all properties; override it for display-friendly output. The PrintMembers virtual method lets you customise the property list while keeping the Type { } frame.",
  },
  {
    id: "cs-required-members-3",
    language: "csharp",
    title: "required members enforce initialisation (C# 11)",
    tag: "classes",
    code: `class Config
{
    public required string Host { get; init; }
    public required int    Port { get; init; }
    public string Protocol { get; init; } = "https";
}

// Compile error if required members are missing from initialiser.
// var bad = new Config();                    // CS9035

var cfg = new Config { Host = "db.local", Port = 5432 };
Console.WriteLine($"{cfg.Protocol}://{cfg.Host}:{cfg.Port}");
// https://db.local:5432

// [SetsRequiredMembers] on a constructor lets it satisfy requirements.`,
    explanation: "required members catch missing initialisation at compile time — they're the init-only equivalent of constructor parameter enforcement, without mandating a specific constructor.",
  },
  {
    id: "cs-init-only-3",
    language: "csharp",
    title: "init accessor — set during construction, then immutable",
    tag: "classes",
    code: `class ImmutablePoint
{
    public int X { get; init; }  // settable in initialiser only
    public int Y { get; init; }

    public override string ToString() => $"({X}, {Y})";
}

// Set in object initialiser.
var p = new ImmutablePoint { X = 1, Y = 2 };
Console.WriteLine(p);   // (1, 2)

// Cannot mutate after construction.
// p.X = 99;   // CS8852 compile error

// 'with' expression creates a modified copy.
var moved = p with { X = 10 };
Console.WriteLine(moved);  // (10, 2)
Console.WriteLine(p);      // (1, 2)  unchanged`,
    explanation: "init-only setters allow object initialisers without mutable setters — the type is immutable after construction while still supporting the familiar { } initialiser syntax.",
  },
  {
    id: "cs-interface-static-abstract-2",
    language: "csharp",
    title: "Static abstract interface members (C# 11)",
    tag: "classes",
    code: `// Static abstract members enable generic math.
interface IAddable<T> where T : IAddable<T>
{
    static abstract T Zero { get; }
    static abstract T operator +(T left, T right);
}

struct Meters : IAddable<Meters>
{
    public double Value { get; }
    public Meters(double v) { Value = v; }

    public static Meters Zero => new(0);
    public static Meters operator +(Meters a, Meters b) => new(a.Value + b.Value);
}

static T Sum<T>(IEnumerable<T> items) where T : IAddable<T>
    => items.Aggregate(T.Zero, (a, b) => a + b);

Console.WriteLine(Sum(new[] { new Meters(1), new Meters(2), new Meters(3) }).Value);  // 6`,
    explanation: "Static abstract interface members (C# 11) enable generic algorithms over numeric types — the Generic Math feature. T.Zero and T.operator+ are resolved at JIT time with zero overhead.",
  },
  {
    id: "cs-generic-constraints-2",
    language: "csharp",
    title: "Multiple generic constraints combined",
    tag: "classes",
    code: `using System.Collections.Generic;

// Multiple constraints: 'where T : constraint1, constraint2, ...'
class Repository<T>
    where T : class,        // reference type
              new(),        // has parameterless constructor
              IComparable<T>  // comparable to itself
{
    private List<T> _items = new();

    public void Add(T item) => _items.Add(item);

    public T? Min() => _items.Count == 0 ? null
        : _items.Aggregate((a, b) => a.CompareTo(b) < 0 ? a : b);
}

// Constraints narrow the type parameter to what you need.
// struct constraint ensures value type; notnull disallows null annotations.`,
    explanation: "Combine constraints with commas: 'class' and 'struct' must come first, then interface constraints, then 'new()'. Constraints let the compiler allow more operations on T.",
  },
  {
    id: "cs-nested-class-2",
    language: "csharp",
    title: "Nested class has access to outer class privates",
    tag: "classes",
    code: `class LinkedList<T>
{
    private Node? _head;
    private int _count;

    // Nested class — private to LinkedList implementation.
    private class Node
    {
        public T Value;
        public Node? Next;
        public Node(T value) { Value = value; }
    }

    public void AddFirst(T value)
    {
        _head = new Node(value) { Next = _head };
        _count++;
    }

    public int Count => _count;
}

var list = new LinkedList<int>();
list.AddFirst(1);
list.AddFirst(2);
Console.WriteLine(list.Count);  // 2`,
    explanation: "A nested private class is an implementation detail invisible to the outside world. Inner classes can access all members (including private) of the enclosing class.",
  },
  {
    id: "cs-operator-overload-3",
    language: "csharp",
    title: "Operator overloading — natural domain arithmetic",
    tag: "classes",
    code: `readonly struct Money(decimal amount, string currency)
{
    public decimal Amount   => amount;
    public string  Currency => currency;

    public static Money operator +(Money a, Money b)
    {
        if (a.Currency != b.Currency) throw new InvalidOperationException();
        return new Money(a.Amount + b.Amount, a.Currency);
    }

    public static Money operator *(Money m, decimal factor) =>
        new Money(m.Amount * factor, m.Currency);

    public override string ToString() => $"{Amount:F2} {Currency}";
}

var a = new Money(10.50m, "USD");
var b = new Money(5.25m, "USD");
Console.WriteLine(a + b);        // 15.75 USD
Console.WriteLine(a * 1.1m);    // 11.55 USD`,
    explanation: "Operator overloading lets domain types (Money, Vector, Duration) use natural arithmetic syntax. Overload == with care and always pair with Equals/GetHashCode.",
  },
  {
    id: "cs-implicit-conversion",
    language: "csharp",
    title: "Implicit and explicit conversion operators",
    tag: "classes",
    code: `readonly struct Celsius(double degrees)
{
    public double Degrees => degrees;

    // Implicit: auto-converts without cast (safe widening).
    public static implicit operator Fahrenheit(Celsius c) =>
        new Fahrenheit(c.Degrees * 9 / 5 + 32);

    public override string ToString() => $"{Degrees}°C";
}

readonly struct Fahrenheit(double degrees)
{
    public double Degrees => degrees;

    // Explicit: requires a cast (potential precision loss).
    public static explicit operator Celsius(Fahrenheit f) =>
        new Celsius((f.Degrees - 32) * 5 / 9);

    public override string ToString() => $"{Degrees}°F";
}

Celsius c  = new Celsius(100);
Fahrenheit f = c;             // implicit — no cast needed
Celsius back = (Celsius)f;    // explicit — cast required`,
    explanation: "Implicit conversion should only be used when it's always safe and lossless. Explicit conversion signals that precision or range might be lost, requiring the programmer to acknowledge it with a cast.",
  },
  {
    id: "cs-extension-interface-2",
    language: "csharp",
    title: "Extension methods on interfaces",
    tag: "classes",
    code: `public interface IAnimal
{
    string Name { get; }
    string Sound();
}

// Extension methods on an interface add behaviour without modifying it.
public static class AnimalExtensions
{
    public static string Introduce(this IAnimal animal) =>
        $"I am {animal.Name} and I say {animal.Sound()}!";

    public static string RepeatSound(this IAnimal animal, int times) =>
        string.Join(" ", Enumerable.Repeat(animal.Sound(), times));
}

class Dog : IAnimal
{
    public string Name => "Rex";
    public string Sound() => "woof";
}

var d = new Dog();
Console.WriteLine(d.Introduce());          // I am Rex and I say woof!
Console.WriteLine(d.RepeatSound(3));       // woof woof woof`,
    explanation: "Extension methods on interfaces let you add utility methods to every implementer without modifying the interface — LINQ is built entirely on IEnumerable<T> extensions.",
  },
  {
    id: "cs-covariant-return-3",
    language: "csharp",
    title: "Covariant return types (C# 9)",
    tag: "classes",
    code: `class Animal
{
    public string Name { get; init; } = "";
    // Returns the base type Animal.
    public virtual Animal Clone() => new Animal { Name = Name };
}

class Dog : Animal
{
    public string Breed { get; init; } = "";

    // C# 9+: override can return a MORE DERIVED type.
    public override Dog Clone() => new Dog { Name = Name, Breed = Breed };
}

Dog d1 = new Dog { Name = "Rex", Breed = "Husky" };
Dog d2 = d1.Clone();   // returns Dog, not Animal — no cast needed!
Console.WriteLine(d2.Breed);  // Husky`,
    explanation: "Covariant return types let an override return a more derived type than declared in the base class, removing the need for explicit casts after virtual factory calls.",
  },
  {
    id: "cs-fluent-interface",
    language: "csharp",
    title: "Fluent builder — method chaining via return this",
    tag: "classes",
    code: `class QueryBuilder
{
    private string _table = "";
    private string _where = "";
    private int?   _limit;

    public QueryBuilder From(string table)  { _table = table; return this; }
    public QueryBuilder Where(string cond)  { _where = cond;  return this; }
    public QueryBuilder Limit(int n)        { _limit = n;     return this; }

    public string Build()
    {
        string sql = $"SELECT * FROM {_table}";
        if (!string.IsNullOrEmpty(_where)) sql += $" WHERE {_where}";
        if (_limit.HasValue)               sql += $" LIMIT {_limit}";
        return sql;
    }
}

string q = new QueryBuilder()
    .From("users")
    .Where("active = 1")
    .Limit(10)
    .Build();
Console.WriteLine(q);
// SELECT * FROM users WHERE active = 1 LIMIT 10`,
    explanation: "Fluent builders return 'this' from each setter, enabling method chains that read like a sentence. Each call narrows or configures the object; a terminal method (Build, Execute) materialises the result.",
  },
// === CSHARP BATCH 2 ===
  {
    id: "cs-collection-literal",
    language: "csharp",
    title: "Collection expressions (C# 12)",
    tag: "snippet",
    code: `// C# 12: collection expressions with [ ] syntax.
int[]        array   = [1, 2, 3, 4, 5];
List<int>    list    = [1, 2, 3];
Span<int>    span    = [1, 2, 3];
HashSet<int> set     = [1, 2, 3];

// Spread operator .. merges collections.
int[] first  = [1, 2, 3];
int[] second = [4, 5, 6];
int[] combined = [..first, ..second, 7, 8];
Console.WriteLine(string.Join(", ", combined));  // 1,2,3,4,5,6,7,8`,
    explanation: "Collection expressions provide a unified [ ] literal syntax for arrays, List<T>, Span<T>, and other collection types. The spread operator (..) merges collections inline.",
  },
  {
    id: "cs-pattern-list",
    language: "csharp",
    title: "List patterns in switch expressions (C# 11)",
    tag: "snippet",
    code: `int[] Describe(int[] arr) => arr switch
{
    []              => throw new ArgumentException("empty"),
    [int x]         => [x * 2],
    [int x, int y]  => [y, x],              // swap two elements
    [int first, .., int last] => [first, last],  // first and last
    _               => arr[..3],             // take first 3
};

Console.WriteLine(string.Join(",", Describe([5])));          // 10
Console.WriteLine(string.Join(",", Describe([3, 7])));       // 7,3
Console.WriteLine(string.Join(",", Describe([1,2,3,4,5]))); // 1,5`,
    explanation: "List patterns match the shape and content of arrays or lists in switch expressions. The slice pattern (..) matches zero or more elements and can bind the matched range.",
  },
  {
    id: "cs-linq-order-by",
    language: "csharp",
    title: "LINQ OrderBy / ThenBy",
    tag: "snippet",
    code: `var students = new[]
{
    (Name: "alice",  Score: 90, Grade: "A"),
    (Name: "bob",    Score: 90, Grade: "B"),
    (Name: "carol",  Score: 85, Grade: "A"),
};

// OrderBy + ThenBy: primary then secondary sort.
var sorted = students
    .OrderByDescending(s => s.Score)
    .ThenBy(s => s.Name)
    .ToList();

foreach (var s in sorted)
    Console.WriteLine($"{s.Name}: {s.Score}");
// alice: 90
// bob:   90
// carol: 85`,
    explanation: "OrderBy creates an IOrderedEnumerable; ThenBy adds a secondary key without re-sorting. OrderByDescending and ThenByDescending flip individual columns.",
  },
  {
    id: "cs-string-span-parse",
    language: "csharp",
    title: "Parsing numbers from ReadOnlySpan<char>",
    tag: "snippet",
    code: `// int.Parse and TryParse accept ReadOnlySpan<char> — no substring needed.
string line = "key=42;value=99";

// Without Span: creates intermediate string.
int v1 = int.Parse(line.Substring(4, 2));

// With Span: zero-allocation parse.
ReadOnlySpan<char> span  = line.AsSpan();
int                value = int.Parse(span.Slice(4, 2));
Console.WriteLine(value);   // 42

// TryParse variant.
bool ok = int.TryParse(span.Slice(11, 2), out int n);
Console.WriteLine(ok ? n : -1);  // 99`,
    explanation: "int.Parse and most numeric parsers accept ReadOnlySpan<char> in modern .NET — use AsSpan().Slice() instead of Substring() to parse sub-strings without allocation.",
  },
  {
    id: "cs-string-split-span",
    language: "csharp",
    title: "string.Split vs MemoryExtensions.Split",
    tag: "snippet",
    code: `string csv = "alice,bob,carol,dave";

// Classic Split: allocates string[] and individual strings.
string[] classic = csv.Split(',');
Console.WriteLine(classic.Length);   // 4

// .NET 8+: MemoryExtensions.Split avoids allocation.
Span<Range> ranges = stackalloc Range[10];
int count = csv.AsSpan().Split(ranges, ',');

for (int i = 0; i < count; i++)
{
    ReadOnlySpan<char> field = csv.AsSpan(ranges[i]);
    Console.WriteLine(field.ToString());  // alice, bob, carol, dave
}`,
    explanation: "MemoryExtensions.Split into a stackalloc Range[] avoids all heap allocation — critical for CSV/log parsing in high-throughput code. Requires .NET 8+.",
  },
  {
    id: "cs-utf8-string-literal",
    language: "csharp",
    title: "UTF-8 string literals (C# 11)",
    tag: "snippet",
    code: `// Suffix 'u8' creates a ReadOnlySpan<byte> (UTF-8 bytes) at compile time.
ReadOnlySpan<byte> greeting = "Hello, World!"u8;
Console.WriteLine(greeting.Length);   // 13 bytes

// No runtime encoding — bytes are baked into the assembly.
// Ideal for fixed protocol strings, JSON keys, HTTP headers.

byte[] buffer = new byte[100];
int written = System.Text.Encoding.UTF8.GetBytes("compare"u8, buffer);

// u8 literals can be compared without decoding.
ReadOnlySpan<byte> header = "Content-Type"u8;
Console.WriteLine(header.SequenceEqual("Content-Type"u8));  // True`,
    explanation: "UTF-8 string literals (C# 11) produce compile-time byte sequences as ReadOnlySpan<byte>, eliminating runtime encoding/decoding for static protocol strings.",
  },
  {
    id: "cs-record-with-2",
    language: "csharp",
    title: "with expression creates a modified record copy",
    tag: "snippet",
    code: `record Address(string Street, string City, string Zip);
record Person(string Name, int Age, Address Home);

var person = new Person("Alice", 30,
    new Address("123 Main", "Springfield", "62701"));

// 'with' creates a shallow copy with specified properties changed.
var moved = person with
{
    Home = person.Home with { City = "Shelbyville", Zip = "62702" }
};

Console.WriteLine(person.Home.City);  // Springfield
Console.WriteLine(moved.Home.City);   // Shelbyville
Console.WriteLine(moved.Name);        // Alice  (copied)`,
    explanation: "The 'with' expression non-destructively modifies records by creating a new instance with the changed fields copied and the rest left the same. Nest 'with' for deep changes.",
  },
  {
    id: "cs-switch-expression",
    language: "csharp",
    title: "Switch expression — exhaustive pattern match",
    tag: "snippet",
    code: `enum Season { Spring, Summer, Autumn, Winter }

// Switch expression: returns a value, comma-separated arms.
string Describe(Season s) => s switch
{
    Season.Spring => "flowers blooming",
    Season.Summer => "hot and sunny",
    Season.Autumn => "leaves falling",
    Season.Winter => "cold and dark",
    // No default needed — compiler verifies exhaustiveness for enums.
};

// With tuple patterns.
string Move(int dx, int dy) => (dx, dy) switch
{
    (0,  1) => "up",    (0, -1) => "down",
    (1,  0) => "right", (-1, 0) => "left",
    _       => "diagonal"
};`,
    explanation: "Switch expressions are exhaustiveness-checked — the compiler warns if an enum value is unhandled. Tuple patterns let you match on multiple values simultaneously.",
  },
  {
    id: "cs-record-equality",
    language: "csharp",
    title: "Record equality is value-based",
    tag: "snippet",
    code: `record Point(int X, int Y);

var p1 = new Point(1, 2);
var p2 = new Point(1, 2);
var p3 = new Point(3, 4);

// Structural (value) equality.
Console.WriteLine(p1 == p2);        // True
Console.WriteLine(p1.Equals(p2));   // True

// Reference equality is different.
Console.WriteLine(object.ReferenceEquals(p1, p2));  // False

// Can be used as dictionary key or HashSet element.
var set = new HashSet<Point> { p1, p2 };
Console.WriteLine(set.Count);   // 1  (p1 and p2 are equal)`,
    explanation: "Records auto-generate value-based Equals, GetHashCode, and == — two records with the same property values are equal. Unlike classes, where == is reference equality by default.",
  },
  {
    id: "cs-async-stream",
    language: "csharp",
    title: "IAsyncEnumerable<T> — async stream",
    tag: "snippet",
    code: `using System.Collections.Generic;

async IAsyncEnumerable<int> GetDataAsync()
{
    for (int i = 0; i < 5; i++)
    {
        await Task.Delay(10);   // simulate async I/O
        yield return i;
    }
}

// Consume with 'await foreach'.
await foreach (int item in GetDataAsync())
{
    Console.WriteLine(item);   // 0, 1, 2, 3, 4
}

// With cancellation:
// await foreach (var item in GetDataAsync().WithCancellation(ct))`,
    explanation: "IAsyncEnumerable<T> is the async equivalent of IEnumerable<T>. Use 'await foreach' to consume items one at a time as they arrive — ideal for paginated APIs or streaming database results.",
  },
  {
    id: "cs-object-pool-2",
    language: "csharp",
    title: "Microsoft.Extensions.ObjectPool",
    tag: "snippet",
    code: `using Microsoft.Extensions.ObjectPool;

// ObjectPool reuses expensive objects instead of allocating new ones.
var policy  = new DefaultPooledObjectPolicy<StringBuilder>();
var pool    = new DefaultObjectPool<StringBuilder>(policy, maximumRetained: 10);

// Rent from pool.
StringBuilder sb = pool.Get();
try
{
    sb.Clear();   // pool may return a dirty object!
    sb.Append("Hello").Append(", ").Append("World");
    Console.WriteLine(sb);   // Hello, World
}
finally
{
    pool.Return(sb);   // MUST return — or leak
}`,
    explanation: "ObjectPool<T> reduces GC pressure for expensive objects like StringBuilder or HttpClient instances. Always clear state before use and always return to the pool — the policy controls initialisation.",
  },
  {
    id: "cs-span-stackalloc",
    language: "csharp",
    title: "stackalloc with Span<T>",
    tag: "snippet",
    code: `// stackalloc allocates memory on the stack — no GC pressure.
// Wrap in Span<T> for a safe, managed view.
Span<int> buffer = stackalloc int[16];
buffer.Fill(0);

for (int i = 0; i < 16; i++)
    buffer[i] = i * i;

Console.WriteLine(string.Join(", ", buffer[..5].ToArray()));
// 0, 1, 4, 9, 16

// stackalloc with initialiser.
Span<byte> magic = stackalloc byte[] { 0xDE, 0xAD, 0xBE, 0xEF };
Console.WriteLine(magic[0].ToString("X2"));  // DE`,
    explanation: "stackalloc Span<T> avoids heap allocation for small temporary buffers. The stack frame owns the memory, so it's automatically freed when the method returns — no GC involvement.",
  },
  {
    id: "cs-span-over-array",
    language: "csharp",
    title: "Span<T> over an array — zero-copy sub-range",
    tag: "snippet",
    code: `int[] data = [10, 20, 30, 40, 50, 60, 70, 80];

// Span over a slice — no array copy.
Span<int> middle = data.AsSpan(2, 4);
Console.WriteLine(string.Join(", ", middle.ToArray()));  // 30,40,50,60

// Mutation through Span affects the original array.
middle[0] = 99;
Console.WriteLine(data[2]);   // 99

// Range syntax works with AsSpan.
Span<int> end = data.AsSpan()[5..];
Console.WriteLine(end[0]);    // 60`,
    explanation: "AsSpan() creates a Span<T> that is a window into the existing array — mutations through the span write directly to the array. Use it to pass sub-arrays to methods without copying.",
  },
  {
    id: "cs-memory-marshal",
    language: "csharp",
    title: "MemoryMarshal for reinterpreting memory",
    tag: "snippet",
    code: `using System.Runtime.InteropServices;

// Reinterpret a byte span as int span — zero copy.
byte[] bytes = [0x01, 0x00, 0x00, 0x00, 0x02, 0x00, 0x00, 0x00];
ReadOnlySpan<int> ints = MemoryMarshal.Cast<byte, int>(bytes);
Console.WriteLine(ints[0]);   // 1 (little-endian)
Console.WriteLine(ints[1]);   // 2

// MemoryMarshal.GetArrayDataReference: unsafe but fastest array access.
ref int first = ref MemoryMarshal.GetArrayDataReference(new int[] { 10, 20 });
Console.WriteLine(first);  // 10`,
    explanation: "MemoryMarshal.Cast reinterprets a memory span as a different type — like C's type-punning but bounds-checked. Use it for parsing binary formats at zero cost.",
  },
  // --- understanding ---
  {
    id: "cs-value-type-stack",
    language: "csharp",
    title: "Value types live on the stack — unless boxed or in a class",
    tag: "understanding",
    code: `// Common misconception: value types always live on the stack.
// Reality: value types live ON THE STACK only as local variables.

int localInt = 42;   // lives on the stack

// Value type inside a class: lives on the HEAP (part of the class object).
class Container { public int Value; }
var c = new Container();  // c.Value is on the heap

// Value type in an array: lives on the heap (array is a reference type).
int[] arr = [1, 2, 3];   // ints are in the heap array

// Box: explicitly moved to heap as object.
object boxed = localInt;   // boxing

// Rule: value types are allocated wherever their container lives.`,
    explanation: "Value types live on the stack only when they're local variables or parameters. As fields of a class, elements of an array, or boxed objects, they live on the heap.",
  },
  {
    id: "cs-dispose-not-gc",
    language: "csharp",
    title: "Dispose is not called by GC — you must call it",
    tag: "understanding",
    code: `class FileProcessor : IDisposable
{
    private StreamReader? _reader;

    public FileProcessor(string path)
    {
        _reader = new StreamReader(path);
    }

    // GC does NOT call Dispose — only the finalizer (~) is GC-triggered.
    // Dispose must be called explicitly or via 'using'.
    public void Dispose()
    {
        _reader?.Dispose();
        _reader = null;
        GC.SuppressFinalize(this);   // don't run finalizer if Dispose was called
    }
}

// CORRECT: using ensures Dispose is called.
using (var fp = new FileProcessor("/dev/null")) { }`,
    explanation: "Dispose() is not automatic — you must call it explicitly or use a 'using' statement. The finalizer (~Destructor) is GC-driven but non-deterministic. The IDisposable pattern combines both.",
  },
  {
    id: "cs-interface-covariance",
    language: "csharp",
    title: "Interface covariance with out type parameter",
    tag: "understanding",
    code: `// IEnumerable<out T> is covariant — T only appears in output position.
IEnumerable<string>  strings = new List<string> { "hello", "world" };
IEnumerable<object>  objects = strings;   // valid! string is-a object

Console.WriteLine(objects.First());   // hello

// IReadOnlyList<out T> is also covariant.
IReadOnlyList<string>  strList = new[] { "a", "b" };
IReadOnlyList<object>  objList = strList;  // valid

// IList<T> is NOT covariant — T appears in both input and output.
// IList<object> badList = new List<string>();  // Compile error`,
    explanation: "A generic interface is covariant in T when T only appears as a return type (out). This allows IEnumerable<string> to be assigned to IEnumerable<object> — a string IS an object.",
  },
  {
    id: "cs-contravariant-generic",
    language: "csharp",
    title: "Contravariance with in type parameter",
    tag: "understanding",
    code: `// IComparer<in T> is contravariant — T only in input position.
IComparer<object>  objCmp = Comparer<object>.Default;

// A comparer of objects can compare strings (strings are objects).
IComparer<string> strCmp = objCmp;   // valid — contravariance!

Console.WriteLine(strCmp.Compare("a", "b"));  // negative (a < b)

// Action<in T> is also contravariant.
Action<object>  objAction = o => Console.WriteLine(o);
Action<string>  strAction = objAction;  // valid
strAction("hello");  // hello`,
    explanation: "A generic type is contravariant in T when T only appears in input positions (in). A comparer of objects can compare strings — string is a more specific type than what was required.",
  },
  {
    id: "cs-exception-filter",
    language: "csharp",
    title: "Exception filters with when clause",
    tag: "understanding",
    code: `int attempt = 0;

bool ShouldRetry(Exception ex) => ex is TimeoutException && attempt < 3;

// Exception filter: catch only when condition is true.
// The stack is NOT unwound if the filter returns false (unlike re-throw).
for (int i = 0; i < 5; i++)
{
    try
    {
        attempt = i;
        if (i < 3) throw new TimeoutException();
        Console.WriteLine("success on attempt " + i);
        break;
    }
    catch (TimeoutException ex) when (ShouldRetry(ex))
    {
        Console.WriteLine($"retry {i}");
    }
}`,
    explanation: "when clauses filter exceptions without unwinding the stack — useful for retry loops and conditional logging. The filter runs while still in the throwing frame, preserving the original stack.",
  },
  {
    id: "cs-lock-object",
    language: "csharp",
    title: "lock keyword — Monitor-based mutual exclusion",
    tag: "understanding",
    code: `class Counter
{
    private int _count;
    private readonly object _sync = new();   // dedicated lock object

    public void Increment()
    {
        lock (_sync)   // equivalent to Monitor.Enter/Exit + try/finally
        {
            _count++;
        }
    }

    public int Value => _count;
}

// Common mistake: locking on 'this' or a public field — anyone can lock on it.
// Always use a private readonly object for your lock.

// C# 13: Lock type (System.Threading.Lock) is more efficient than object.`,
    explanation: "lock is syntactic sugar for Monitor.Enter/Exit in a try/finally. Always lock on a private readonly object — locking on 'this' or a public type exposes the lock to external code.",
  },
  {
    id: "cs-lazy-initialization",
    language: "csharp",
    title: "Lazy<T> thread-safe initialisation modes",
    tag: "understanding",
    code: `using System.Threading;

// ExecutionAndPublication: default — single initialisation, thread-safe.
Lazy<string> safe = new(
    () => { Console.WriteLine("init"); return "value"; },
    LazyThreadSafetyMode.ExecutionAndPublication);

// Multiple threads all get the same instance.
Parallel.For(0, 4, _ => Console.WriteLine(safe.Value));
// init (printed once)
// value value value value

// None: no thread safety — only use when you own the thread access.
Lazy<string> unsafe_ = new(() => "value", LazyThreadSafetyMode.None);`,
    explanation: "Lazy<T> with ExecutionAndPublication ensures the factory runs at most once across all threads. PublicationOnly runs the factory on every thread but only one 'wins' — useful when initialisation has side effects.",
  },
  {
    id: "cs-async-cancellation",
    language: "csharp",
    title: "Cooperative cancellation via CancellationToken",
    tag: "understanding",
    code: `async Task LongOperation(CancellationToken ct)
{
    for (int i = 0; i < 100; i++)
    {
        // Check cancellation explicitly.
        ct.ThrowIfCancellationRequested();   // throws OperationCanceledException

        await Task.Delay(50, ct);   // or pass token to async APIs
        Console.WriteLine($"step {i}");
    }
}

using var cts = new CancellationTokenSource();
cts.CancelAfter(200);   // cancel after 200ms

try
{
    await LongOperation(cts.Token);
}
catch (OperationCanceledException)
{
    Console.WriteLine("Cancelled!");
}`,
    explanation: "Cancellation in .NET is cooperative — the callee must check the token. ThrowIfCancellationRequested() and passing the token to async APIs are the two common patterns.",
  },
  {
    id: "cs-task-when-any",
    language: "csharp",
    title: "Task.WhenAny — first completed wins",
    tag: "understanding",
    code: `async Task<string> Slow() { await Task.Delay(200); return "slow"; }
async Task<string> Fast() { await Task.Delay(50);  return "fast"; }

// WhenAny completes when the first task finishes.
Task<string> winner = await Task.WhenAny(Slow(), Fast());
Console.WriteLine(await winner);   // fast

// Pattern: race a task against a timeout.
using var cts = new CancellationTokenSource(100);
try
{
    var result = await Task.WhenAny(
        Slow(),
        Task.Delay(Timeout.Infinite, cts.Token)
    );
    // determine which completed first...
}
catch (OperationCanceledException) { Console.WriteLine("timeout"); }`,
    explanation: "Task.WhenAny is the 'first wins' counterpart to Task.WhenAll. Unfinished tasks continue running — cancel them explicitly if you no longer need their results.",
  },
  {
    id: "cs-ref-readonly",
    language: "csharp",
    title: "ref readonly — read-only reference to avoid copies",
    tag: "understanding",
    code: `readonly struct LargeStruct
{
    public readonly double X, Y, Z, W;
    public LargeStruct(double x, double y, double z, double w)
    { X=x; Y=y; Z=z; W=w; }
}

static ref readonly LargeStruct GetRef(LargeStruct[] arr, int i)
    => ref arr[i];   // returns a reference, not a copy

LargeStruct[] data = [new(1,2,3,4), new(5,6,7,8)];

// ref readonly: access the struct in-place — no 32-byte copy.
ref readonly LargeStruct s = ref GetRef(data, 0);
Console.WriteLine(s.X);   // 1  — read only via reference
// s.X = 99;  // Compile error — ref readonly`,
    explanation: "ref readonly parameters and returns let you access large structs by reference without copying, while the readonly constraint prevents accidental mutation.",
  },
  {
    id: "cs-generic-math-2",
    language: "csharp",
    title: "Generic math with INumber<T>",
    tag: "understanding",
    code: `using System.Numerics;

// INumber<T> is the base interface for all numeric types in .NET 7+.
static T Sum<T>(IEnumerable<T> items) where T : INumber<T>
    => items.Aggregate(T.Zero, (a, b) => a + b);

Console.WriteLine(Sum(new int[]    { 1, 2, 3, 4, 5 }));    // 15
Console.WriteLine(Sum(new double[] { 1.5, 2.5, 3.0 }));    // 7
Console.WriteLine(Sum(new decimal[]{ 10m, 20m, 30m }));    // 60

// Works with any type implementing INumber<T>: int, long, float, double, decimal...
// T.Zero, T.One, T.MaxValue, +, -, *, / are all available.`,
    explanation: "INumber<T> (System.Numerics, .NET 7+) lets you write generic algorithms over any numeric type. T.Zero and arithmetic operators are defined as static abstract interface members.",
  },
  {
    id: "cs-source-gen-concept",
    language: "csharp",
    title: "Source generators run at compile time",
    tag: "understanding",
    code: `// Source generators (Roslyn) analyse your code and emit new C# files.
// Common uses:
// - [GeneratedRegex]: compiles regex at build time.
// - JsonSerializerContext: AOT-safe JSON serialisation.
// - Logging source generator: structured log methods.

using System.Text.RegularExpressions;

partial class Parser
{
    // GeneratedRegex runs at compile time — no runtime compilation overhead.
    [GeneratedRegex(@"^\d{4}-\d{2}-\d{2}$")]
    private static partial Regex DatePattern();

    public bool IsDate(string s) => DatePattern().IsMatch(s);
}

// var p = new Parser();
// Console.WriteLine(p.IsDate("2026-05-07"));  // True`,
    explanation: "Source generators run during compilation and inject new code. [GeneratedRegex] is the most visible example — it turns a regex literal into a compiled state machine at build time.",
  },
  // --- structures ---
  {
    id: "cs-channel-producer",
    language: "csharp",
    title: "System.Threading.Channels — producer/consumer",
    tag: "structures",
    code: `using System.Threading.Channels;

var channel = Channel.CreateUnbounded<int>();

// Producer: writes to channel.
async Task Produce()
{
    for (int i = 0; i < 5; i++)
    {
        await channel.Writer.WriteAsync(i);
        await Task.Delay(10);
    }
    channel.Writer.Complete();   // signal done
}

// Consumer: reads from channel.
async Task Consume()
{
    await foreach (int item in channel.Reader.ReadAllAsync())
        Console.WriteLine($"received {item}");
}

await Task.WhenAll(Produce(), Consume());`,
    explanation: "System.Threading.Channels provides a high-performance, lock-free producer/consumer pipe. CreateBounded<T>(n) adds backpressure when the buffer fills.",
  },
  {
    id: "cs-frozen-dict",
    language: "csharp",
    title: "FrozenDictionary — read-only, optimised at creation",
    tag: "structures",
    code: `using System.Collections.Frozen;

// Build the mutable dict, then freeze it for read-only use.
var lookup = new Dictionary<string, int>
{
    ["one"]   = 1,
    ["two"]   = 2,
    ["three"] = 3,
}.ToFrozenDictionary();

// FrozenDictionary uses a perfect hash — faster lookups than Dictionary.
Console.WriteLine(lookup["two"]);   // 2
Console.WriteLine(lookup.ContainsKey("four"));   // False

// Frozen collections are immutable — no Add/Remove.
// Best for static lookup tables initialised at startup.`,
    explanation: "FrozenDictionary (.NET 8+) is built once and optimised for read-heavy workloads — it uses a minimal perfect hash for O(1) lookups faster than regular Dictionary.",
  },
  {
    id: "cs-sorted-set-2",
    language: "csharp",
    title: "SortedSet<T> — always-sorted unique collection",
    tag: "structures",
    code: `var set = new SortedSet<int> { 5, 2, 8, 1, 9, 3 };

// Elements are always in sorted order.
Console.WriteLine(string.Join(", ", set));   // 1, 2, 3, 5, 8, 9

// GetViewBetween: efficient range view.
SortedSet<int> range = set.GetViewBetween(3, 8);
Console.WriteLine(string.Join(", ", range));  // 3, 5, 8

// Min and Max are O(log n).
Console.WriteLine(set.Min);   // 1
Console.WriteLine(set.Max);   // 9

// Reverse iterate.
foreach (int n in set.Reverse())
    Console.Write(n + " ");  // 9 8 5 3 2 1`,
    explanation: "SortedSet<T> maintains elements in sorted order (red-black tree). GetViewBetween returns a live view of elements in a range — efficient for sliding-window queries.",
  },
  {
    id: "cs-concurrent-queue",
    language: "csharp",
    title: "ConcurrentQueue<T> — lock-free FIFO",
    tag: "structures",
    code: `using System.Collections.Concurrent;

var q = new ConcurrentQueue<string>();

// Enqueue is thread-safe.
Parallel.For(0, 5, i => q.Enqueue($"item-{i}"));

// TryDequeue: safe dequeue — returns false if empty.
while (q.TryDequeue(out string? item))
    Console.WriteLine(item);

// TryPeek: look without removing.
q.Enqueue("peek-me");
if (q.TryPeek(out string? first))
    Console.WriteLine($"peeked: {first}");  // peek-me`,
    explanation: "ConcurrentQueue<T> is a lock-free thread-safe FIFO. TryDequeue and TryPeek are the safe APIs — never use Count > 0 before TryDequeue in multi-threaded code.",
  },
  {
    id: "cs-memory-pool-2",
    language: "csharp",
    title: "MemoryPool<T> for heap buffers",
    tag: "structures",
    code: `using System.Buffers;

// MemoryPool rents a Memory<T> (heap-based) unlike ArrayPool.
using IMemoryOwner<byte> owner = MemoryPool<byte>.Shared.Rent(256);
Memory<byte> buffer = owner.Memory;

// Write to the buffer.
for (int i = 0; i < 10; i++)
    buffer.Span[i] = (byte)i;

// Read back.
Console.WriteLine(buffer.Span[5]);   // 5

// IMemoryOwner implements IDisposable — return to pool via using.
// After Dispose, the Memory<byte> must not be used.`,
    explanation: "MemoryPool<T> provides heap-resident buffers — unlike ArrayPool which is array-centric. The IMemoryOwner wraps the buffer and returns it to the pool on Dispose.",
  },
  {
    id: "cs-immutable-collections-2",
    language: "csharp",
    title: "ImmutableStack / ImmutableQueue",
    tag: "structures",
    code: `using System.Collections.Immutable;

// ImmutableStack: persistent LIFO.
var stack = ImmutableStack<int>.Empty;
var s1 = stack.Push(1).Push(2).Push(3);   // new stacks
Console.WriteLine(s1.Peek());   // 3

var s2 = s1.Pop(out int popped);  // s2 has 1,2; popped = 3
Console.WriteLine(popped);        // 3
Console.WriteLine(s1.Peek());     // 3  — s1 unchanged

// ImmutableQueue: persistent FIFO.
var q = ImmutableQueue<string>.Empty;
var q1 = q.Enqueue("a").Enqueue("b");
var q2 = q1.Dequeue(out string? head);
Console.WriteLine(head);   // a`,
    explanation: "Immutable stack/queue use structural sharing — each Push/Enqueue creates a new version that shares nodes with the old version. Old versions are preserved — perfect for undo history.",
  },
  {
    id: "cs-sparse-array",
    language: "csharp",
    title: "Dictionary<int, T> as a sparse array",
    tag: "structures",
    code: `// For large index ranges with sparse data, use a dict instead of an array.
var sparse = new Dictionary<int, string>();

// Only occupied indices use memory.
sparse[0]     = "first";
sparse[999]   = "near end";
sparse[99999] = "far end";

// Access like a sparse array.
string? val = sparse.GetValueOrDefault(500);   // null
Console.WriteLine(val ?? "not set");   // not set

// Iterate only occupied entries.
foreach (var (idx, v) in sparse)
    Console.WriteLine($"[{idx}] = {v}");`,
    explanation: "Dictionary<int, T> is a natural sparse array — only store occupied entries, and GetValueOrDefault handles missing indices cleanly without IndexOutOfRange.",
  },
  {
    id: "cs-regex-compiled",
    language: "csharp",
    title: "Compiled Regex vs interpreted Regex",
    tag: "structures",
    code: `using System.Text.RegularExpressions;

string text = "born 1990-05-15, graduated 2012-06-01";

// Interpreted (default): compiled on first use, stored in cache.
var r1 = new Regex(@"\d{4}-\d{2}-\d{2}");

// Compiled: compiled to IL at creation — faster repeated matching.
var r2 = new Regex(@"\d{4}-\d{2}-\d{2}", RegexOptions.Compiled);

// [GeneratedRegex] (C# 11): compiled at BUILD TIME — fastest.
// Prefer GeneratedRegex for hot paths.

foreach (Match m in r2.Matches(text))
    Console.WriteLine(m.Value);
// 1990-05-15
// 2012-06-01`,
    explanation: "RegexOptions.Compiled compiles the regex to IL at runtime for faster matching at the cost of longer creation time. [GeneratedRegex] is better — zero runtime cost.",
  },
  {
    id: "cs-environment-2",
    language: "csharp",
    title: "Environment class utilities",
    tag: "structures",
    code: `// Environment provides system info and process utilities.
Console.WriteLine(Environment.MachineName);         // host name
Console.WriteLine(Environment.ProcessorCount);      // CPU core count
Console.WriteLine(Environment.OSVersion);           // OS info
Console.WriteLine(Environment.Is64BitProcess);      // True on 64-bit
Console.WriteLine(Environment.WorkingSet);          // memory in bytes
Console.WriteLine(Environment.TickCount64);         // ms since boot

// Special folders.
string desktop = Environment.GetFolderPath(
    Environment.SpecialFolder.Desktop);
Console.WriteLine(desktop);

// Exit gracefully.
// Environment.Exit(0);   // exits entire process immediately`,
    explanation: "The Environment class provides cross-platform access to machine info, process properties, and special folder paths — no P/Invoke needed for common system queries.",
  },
  // --- caveats ---
  {
    id: "cs-string-boxing",
    language: "csharp",
    title: "String concatenation with + boxes value types",
    tag: "caveats",
    code: `int x = 42;

// "text" + x: x is boxed to object, then ToString() is called.
string s1 = "value: " + x;          // boxes x

// Interpolation avoids boxing — compiler calls x.ToString() directly.
string s2 = $"value: {x}";          // no boxing

// Explicit ToString also avoids boxing.
string s3 = "value: " + x.ToString();

// For high-frequency code (game loops, hot paths), prefer interpolation
// or string.Create / StringBuilder to avoid boxing allocations.
Console.WriteLine(s1 == s2);  // True`,
    explanation: "The + operator between string and a value type triggers boxing; interpolated strings call ToString() directly on the struct, avoiding the boxing allocation.",
  },
  {
    id: "cs-foreach-value-type",
    language: "csharp",
    title: "foreach over a custom struct enumerator avoids boxing",
    tag: "caveats",
    code: `// List<T>.Enumerator is a struct — foreach doesn't box it.
var list = new List<int> { 1, 2, 3 };
foreach (int n in list)  // uses List<int>.Enumerator (struct, no boxing)
    Console.WriteLine(n);

// But assigning to IEnumerator<T> boxes the struct enumerator.
IEnumerator<int> boxed = list.GetEnumerator();  // boxed!

// Lesson: foreach is smart — it calls GetEnumerator() on the concrete type
// and uses the struct enumerator directly, avoiding boxing.`,
    explanation: "C#'s foreach uses a duck-typing pattern: it calls GetEnumerator() on the actual type (not via interface), which lets List<T>'s struct enumerator work without boxing.",
  },
  {
    id: "cs-mutable-struct",
    language: "csharp",
    title: "Mutable struct in a readonly context gets copied",
    tag: "caveats",
    code: `struct Counter
{
    private int _value;
    public int Value => _value;
    public void Increment() { _value++; }
}

// Readonly field: struct is copied before calling Increment.
class Holder
{
    public readonly Counter C = new Counter();
    public void Try() { C.Increment(); }  // increments a COPY!
}

var h = new Holder();
h.Try(); h.Try(); h.Try();
Console.WriteLine(h.C.Value);   // 0  — never changed!

// Fix: use a non-readonly field, or use a class, or mark the method readonly.`,
    explanation: "Calling a mutating method on a readonly struct field causes the compiler to make a defensive copy — the mutation happens on the copy, not the original. Use 'readonly' on pure struct methods to suppress this.",
  },
  {
    id: "cs-interface-default-pitfall-2",
    language: "csharp",
    title: "Overriding an interface default method requires interface reference",
    tag: "caveats",
    code: `interface ILogger
{
    void Log(string msg) => Console.WriteLine($"[default] {msg}");
}

class FileLogger : ILogger
{
    // This 'Log' is a new method on FileLogger — it does NOT override ILogger.Log.
    public void Log(string msg) => Console.WriteLine($"[file] {msg}");
}

FileLogger fl = new FileLogger();
fl.Log("test");              // [file] test

ILogger il = fl;
il.Log("test");              // [file] test — because FileLogger has Log()

// If FileLogger only had the class method (not interface explicit impl),
// and it didn't implement Log at all, the default would be used via interface.`,
    explanation: "To actually override a default interface method, the class method signature must match exactly and it's found via the virtual dispatch. Without explicit override semantics, both methods coexist.",
  },
  {
    id: "cs-generic-constraint-new",
    language: "csharp",
    title: "new() constraint requires parameterless constructor",
    tag: "caveats",
    code: `// new() constraint: T must have a public parameterless constructor.
T CreateAndInit<T>() where T : new()
{
    return new T();   // allowed because of new() constraint
}

class Simple { }
class Configured
{
    public Configured(int n) { }    // only parameterised ctor
}

var s = CreateAndInit<Simple>();     // OK
// var c = CreateAndInit<Configured>(); // Compile error!

// new() prevents factory use with types that need parameters.
// Alternative: Func<T> factory parameter instead.
T Create<T>(Func<T> factory) => factory();`,
    explanation: "The new() constraint is often seen as a limitation — it only works for default-constructible types. Accepting a Func<T> factory is more flexible.",
  },
  {
    id: "cs-task-result-deadlock-2",
    language: "csharp",
    title: ".Result and .Wait() can deadlock",
    tag: "caveats",
    code: `// In a context with a SynchronizationContext (ASP.NET classic, WinForms):
//
// async Task<string> GetData() {
//     await Task.Delay(100);   // continuation scheduled on SyncContext
//     return "data";
// }
//
// string data = GetData().Result;  // blocks the SyncContext thread
// The await can never resume because the thread is blocked!
// → DEADLOCK

// Safe alternatives:
// 1. Make the entire call chain async.
// 2. Use Task.Run to escape the context: Task.Run(GetData).Result
// 3. Use ConfigureAwait(false) inside GetData.

// In .NET 6+ minimal APIs (no SyncContext), .Result is usually safe.`,
    explanation: ".Result blocks the calling thread while waiting for the Task. If the Task's continuation needs to resume on the same thread (SynchronizationContext), it deadlocks. Always await instead.",
  },
  {
    id: "cs-covariance-pitfall",
    language: "csharp",
    title: "Array covariance is unsafe — throws at runtime",
    tag: "caveats",
    code: `// Arrays are covariant in C# — string[] is-a object[].
// But this is UNSOUND — the runtime checks assignments!
string[] strings = ["hello", "world"];
object[] objects = strings;   // valid at compile time

try
{
    objects[0] = 42;   // throws ArrayTypeMismatchException at runtime!
}
catch (ArrayTypeMismatchException ex)
{
    Console.WriteLine(ex.Message);
}

// IReadOnlyList<T> covariance is SAFE because you can't write to it.
IReadOnlyList<string> roStrings = strings;
IReadOnlyList<object> roObjects = roStrings;  // safe`,
    explanation: "Array covariance is a C# design flaw — object[0] = 42 compiles fine but fails at runtime with ArrayTypeMismatchException. Generic collection covariance (IEnumerable<out T>) is safe because it's read-only.",
  },
  {
    id: "cs-struct-default",
    language: "csharp",
    title: "Struct default value is all-zero — may be invalid",
    tag: "caveats",
    code: `struct Temperature
{
    public double Celsius { get; init; }
    public bool   IsValid { get; init; }
}

// default(Temperature) gives all-zero fields.
Temperature t = default;
Console.WriteLine(t.Celsius);   // 0
Console.WriteLine(t.IsValid);   // False  ← zero means false!

// Common gotcha: a struct in an array is default-initialised.
Temperature[] readings = new Temperature[3];
// All readings have Celsius=0, IsValid=false — is that a valid state?

// Design advice: ensure the all-zero state is a valid, sensible default.`,
    explanation: "Structs always have a default value of all-zero bits. Design your structs so that default(T) represents a valid, 'empty' state — otherwise every consumer must check validity.",
  },
  // --- types ---
  {
    id: "cs-span-string",
    language: "csharp",
    title: "string.AsSpan() for zero-copy string access",
    tag: "types",
    code: `string text = "Hello, World! 42";

// AsSpan() wraps the string in ReadOnlySpan<char> — no copy.
ReadOnlySpan<char> span = text.AsSpan();

// Slice without allocating.
ReadOnlySpan<char> hello = span[..5];
Console.WriteLine(hello.ToString());   // Hello

// Parse a number from within a string.
ReadOnlySpan<char> numPart = span[15..];  // "42"
int n = int.Parse(numPart);
Console.WriteLine(n);   // 42

// Equality without allocation.
Console.WriteLine(span[7..12].Equals("World", StringComparison.Ordinal));  // True`,
    explanation: "string.AsSpan() provides zero-copy access to string contents. Combining with Slice/ranges and span-aware parse methods eliminates substring allocations in hot paths.",
  },
  {
    id: "cs-value-tuple-2",
    language: "csharp",
    title: "ValueTuple vs Tuple — stack vs heap",
    tag: "types",
    code: `// Tuple<T1, T2>: reference type — heap-allocated.
Tuple<int, string> heapTuple = Tuple.Create(1, "hello");
Console.WriteLine(heapTuple.Item1);   // 1

// (T1, T2) ValueTuple: value type — stack-allocated.
(int id, string name) stackTuple = (1, "hello");
Console.WriteLine(stackTuple.id);     // 1  ← named access

// ValueTuple syntax sugar.
(int x, int y) Point = (3, 4);
Console.WriteLine(Point.x + Point.y);  // 7

// Deconstruction.
var (first, second) = ("a", "b");
Console.WriteLine(first);   // a`,
    explanation: "ValueTuple (C# 7+) is a struct with named fields, allocated on the stack. Prefer it over Tuple (reference type) for lightweight multi-value returns.",
  },
  {
    id: "cs-object-identity",
    language: "csharp",
    title: "Reference equality with ReferenceEquals",
    tag: "types",
    code: `// == on classes calls the overloaded operator (may do value comparison).
// object.ReferenceEquals always checks pointer identity.

string a = "hello";
string b = "hello";
string c = new string("hello".ToCharArray());

Console.WriteLine(a == b);                       // True (value via overload)
Console.WriteLine(object.ReferenceEquals(a, b)); // True (string literal interning)
Console.WriteLine(object.ReferenceEquals(a, c)); // False (different objects)

// Custom class with == override.
record Point(int X, int Y);
var p1 = new Point(1, 2);
var p2 = new Point(1, 2);
Console.WriteLine(p1 == p2);                           // True (record value eq)
Console.WriteLine(object.ReferenceEquals(p1, p2));     // False`,
    explanation: "Use object.ReferenceEquals when you specifically need pointer identity, regardless of any == overloads. Useful in debugging and identity-map caches.",
  },
  {
    id: "cs-runtime-type",
    language: "csharp",
    title: "RuntimeTypeHandle and Type identity",
    tag: "types",
    code: `// Type objects are singletons per AppDomain — same type == same object.
Type intType1 = typeof(int);
Type intType2 = 42.GetType();

Console.WriteLine(object.ReferenceEquals(intType1, intType2));  // True
Console.WriteLine(intType1 == intType2);  // True

// Type name and metadata.
Console.WriteLine(intType1.Name);          // Int32
Console.WriteLine(intType1.FullName);      // System.Int32
Console.WriteLine(intType1.IsValueType);   // True
Console.WriteLine(intType1.IsGenericType); // False

// Generic type information.
Type listType = typeof(List<int>);
Console.WriteLine(listType.GetGenericArguments()[0].Name);  // Int32`,
    explanation: "Type objects are unique per type per AppDomain — you can safely use == or ReferenceEquals to compare them. typeof(T) is evaluated at compile time; GetType() at runtime.",
  },
  {
    id: "cs-tuple-deconstruct",
    language: "csharp",
    title: "Deconstruction — tuples and custom types",
    tag: "types",
    code: `// ValueTuple deconstruction.
var point = (x: 3, y: 4);
var (px, py) = point;
Console.WriteLine($"x={px} y={py}");   // x=3 y=4

// Discard with _.
var (first, _, third) = (1, 2, 3);

// Custom type deconstruction via Deconstruct method.
class Rectangle
{
    public int Width, Height;
    public void Deconstruct(out int w, out int h) { w=Width; h=Height; }
}
var rect = new Rectangle { Width=10, Height=5 };
var (w, h) = rect;
Console.WriteLine($"{w}x{h}");   // 10x5

// In foreach.
var pairs = new[] { (1, "a"), (2, "b") };
foreach (var (n, s) in pairs) Console.WriteLine($"{n}={s}");`,
    explanation: "Deconstruction works for ValueTuples, record types, and any type with a Deconstruct method. _ discards individual fields you don't need.",
  },
  {
    id: "cs-dynamic-expando",
    language: "csharp",
    title: "ExpandoObject — dynamic property bag",
    tag: "types",
    code: `using System.Dynamic;

dynamic obj = new ExpandoObject();

// Add properties dynamically at runtime.
obj.Name = "alice";
obj.Age  = 30;
obj.Greet = (Action)(() => Console.WriteLine($"Hi, {obj.Name}!"));

Console.WriteLine(obj.Name);   // alice
obj.Greet();                   // Hi, alice!

// Iterate as a dictionary.
var dict = (IDictionary<string, object?>)obj;
foreach (var kv in dict)
    Console.WriteLine($"{kv.Key}: {kv.Value}");`,
    explanation: "ExpandoObject is a dynamic property bag — useful for building flexible DTOs or JSON-like structures at runtime. Access it as IDictionary<string,object?> for iteration.",
  },
  {
    id: "cs-boxing-interface-2",
    language: "csharp",
    title: "Unboxing requires the exact type",
    tag: "types",
    code: `int n = 42;
object boxed = n;   // box int to object

// Unbox: must cast to the EXACT type.
int unboxed = (int)boxed;         // OK
Console.WriteLine(unboxed);       // 42

// Casting to a compatible but different type throws.
try
{
    long bad = (long)boxed;        // InvalidCastException!
}
catch (InvalidCastException ex)
{
    Console.WriteLine(ex.Message);
}

// Correct: unbox first, then convert.
long correct = (long)(int)boxed;
Console.WriteLine(correct);   // 42`,
    explanation: "Unboxing requires casting to the exact type that was boxed — you can't unbox an int as a long even though int is implicitly convertible to long. Unbox first, then convert.",
  },
  // --- families ---
  {
    id: "cs-iequatable-fam",
    language: "csharp",
    title: "IEquatable<T> vs Equals(object) — when to implement both",
    tag: "families",
    code: `struct Point : IEquatable<Point>
{
    public int X, Y;

    // IEquatable<T>: avoids boxing for structs.
    public bool Equals(Point other) => X == other.X && Y == other.Y;

    // Equals(object): required for compatibility with collections.
    public override bool Equals(object? obj) =>
        obj is Point other && Equals(other);

    public override int GetHashCode() => HashCode.Combine(X, Y);

    public static bool operator ==(Point a, Point b) => a.Equals(b);
    public static bool operator !=(Point a, Point b) => !a.Equals(b);
}

// HashSet<Point> uses IEquatable<Point>.Equals — no boxing.
var set = new HashSet<Point> { new Point { X=1, Y=2 } };
Console.WriteLine(set.Contains(new Point { X=1, Y=2 }));  // True`,
    explanation: "IEquatable<T>.Equals avoids boxing for value types — HashSet and Dictionary use it when available. Always pair it with override Equals(object) and GetHashCode() for consistency.",
  },
  {
    id: "cs-icomparable-fam",
    language: "csharp",
    title: "IComparable<T> for sorting and ordering",
    tag: "families",
    code: `class Version : IComparable<Version>
{
    public int Major, Minor, Patch;

    public int CompareTo(Version? other)
    {
        if (other is null) return 1;    // null sorts before any version
        int c = Major.CompareTo(other.Major); if (c != 0) return c;
        c = Minor.CompareTo(other.Minor);     if (c != 0) return c;
        return Patch.CompareTo(other.Patch);
    }

    public override string ToString() => $"{Major}.{Minor}.{Patch}";
}

var versions = new[] { new Version{Major=2,Minor=1,Patch=0},
                       new Version{Major=1,Minor=10,Patch=3} };
Array.Sort(versions);
Console.WriteLine(versions[0]);   // 1.10.3`,
    explanation: "Implement IComparable<T> to define the natural ordering — Array.Sort, List.Sort, and SortedSet use it. Return negative/zero/positive for less/equal/greater.",
  },
  {
    id: "cs-httphandler-fam",
    language: "csharp",
    title: "HttpClient vs IHttpClientFactory",
    tag: "families",
    code: `// HttpClient: reuse ONE instance per base address — don't new() per request.
// Creating a new HttpClient each request exhausts sockets (TIME_WAIT).
static readonly HttpClient _client = new();

async Task<string> Fetch(string url) =>
    await _client.GetStringAsync(url);

// IHttpClientFactory (preferred in DI apps): manages lifetime, rotation.
// builder.Services.AddHttpClient<MyService>();
// class MyService { MyService(HttpClient c) { ... } }

// Named client for per-host configuration.
// builder.Services.AddHttpClient("github", c => {
//     c.BaseAddress = new Uri("https://api.github.com");
//     c.DefaultRequestHeaders.Add("User-Agent", "MyApp");
// });`,
    explanation: "Share one HttpClient per base address (or use IHttpClientFactory in DI) — creating one per request exhausts sockets. IHttpClientFactory also handles DNS change rotation.",
  },
  {
    id: "cs-cancellation-linked",
    language: "csharp",
    title: "Linked cancellation tokens",
    tag: "families",
    code: `using System.Threading;

// Create a composite token: cancel if EITHER source fires.
var userCts    = new CancellationTokenSource();
var timeoutCts = new CancellationTokenSource(TimeSpan.FromSeconds(5));

using var linked = CancellationTokenSource.CreateLinkedTokenSource(
    userCts.Token, timeoutCts.Token);

CancellationToken combined = linked.Token;

// combined is cancelled when user cancels OR timeout fires.
try
{
    await Task.Delay(10_000, combined);
}
catch (OperationCanceledException)
{
    Console.WriteLine($"Cancelled. User={userCts.IsCancellationRequested} " +
                      $"Timeout={timeoutCts.IsCancellationRequested}");
}

userCts.Dispose(); timeoutCts.Dispose();`,
    explanation: "CreateLinkedTokenSource combines multiple tokens — the result fires when any source is cancelled. Use it to apply both a timeout and a user-cancel to the same operation.",
  },
  {
    id: "cs-dependency-injection-2",
    language: "csharp",
    title: "DI service lifetimes — Singleton, Scoped, Transient",
    tag: "families",
    code: `// Transient: new instance per injection — stateless services.
// builder.Services.AddTransient<IEmailService, EmailService>();

// Scoped: one per HTTP request — per-user state, DbContext.
// builder.Services.AddScoped<IUserContext, UserContext>();

// Singleton: one per process — config, caches, shared state.
// builder.Services.AddSingleton<ICache, MemoryCache>();

// Captive dependency bug: NEVER inject Scoped into Singleton!
// The Singleton captures a single request's Scoped instance forever.

// Safe hierarchy: Singleton can depend on Singleton.
//                 Scoped can depend on Scoped or Singleton.
//                 Transient can depend on anything.`,
    explanation: "Service lifetimes control how long an instance lives. Injecting a Scoped service into a Singleton creates a 'captive dependency' — the Singleton holds a stale per-request object forever.",
  },
  {
    id: "cs-options-pattern-2",
    language: "csharp",
    title: "IOptions<T> vs IOptionsSnapshot<T> vs IOptionsMonitor<T>",
    tag: "families",
    code: `// All three read configuration; they differ in update behaviour.

// IOptions<T>: singleton — reads config ONCE at startup. Doesn't refresh.
// IOptionsSnapshot<T>: scoped — reloads per HTTP request.
// IOptionsMonitor<T>: singleton — refreshes when config changes (OnChange event).

// Usage:
// class MyService(IOptionsMonitor<AppSettings> opts)
// {
//     public void DoWork() {
//         var settings = opts.CurrentValue;  // always fresh
//     }
// }

// Registration:
// builder.Services.Configure<AppSettings>(
//     builder.Configuration.GetSection("App"));`,
    explanation: "Use IOptions<T> for values that never change; IOptionsSnapshot<T> for per-request freshness; IOptionsMonitor<T> for live-reload without restarting the process.",
  },
  {
    id: "cs-expression-tree-2",
    language: "csharp",
    title: "Expression trees — code as data",
    tag: "families",
    code: `using System.Linq.Expressions;

// A lambda can be captured as an Expression tree (not just a delegate).
Expression<Func<int, int>> squared = n => n * n;

// Inspect the tree.
Console.WriteLine(squared.Body);             // (n * n)
Console.WriteLine(squared.Body.NodeType);    // Multiply

// Compile to a delegate when needed.
Func<int, int> fn = squared.Compile();
Console.WriteLine(fn(5));   // 25

// EF Core translates Expression<Func<T,bool>> to SQL:
// dbContext.Users.Where(u => u.Age > 18)
// → WHERE Age > 18`,
    explanation: "When you assign a lambda to Expression<Func<T>>, the C# compiler emits a tree of objects representing the code — not executable IL. LINQ-to-SQL providers walk the tree to generate queries.",
  },
  {
    id: "cs-string-pool-fam",
    language: "csharp",
    title: "String.Intern vs StringPool vs FrozenSet for lookup",
    tag: "families",
    code: `// string.Intern: CLR intern table — saves memory for many identical strings.
string a = string.Intern("shared");
string b = string.Intern("shared");
Console.WriteLine(object.ReferenceEquals(a, b));  // True

// For fast set membership, FrozenSet is better than HashSet for immutable data.
using System.Collections.Frozen;
FrozenSet<string> keywords = FrozenSet.Create("if","else","for","while");
Console.WriteLine(keywords.Contains("for"));   // True

// For high-frequency string-keyed caches, Microsoft.Extensions.Caching.Memory
// or a custom ConcurrentDictionary is more appropriate than Intern.`,
    explanation: "string.Intern is for deduplication of high-volume strings in memory. FrozenSet is better for static lookup tables. Avoid over-using Intern — the intern table is never garbage-collected.",
  },
  // --- classes ---
  {
    id: "cs-pattern-visitor",
    language: "csharp",
    title: "Visitor-like dispatch with switch expression",
    tag: "classes",
    code: `abstract record Shape;
record Circle(double Radius) : Shape;
record Rectangle(double W, double H) : Shape;
record Triangle(double Base, double Height) : Shape;

// Switch expression as a type-dispatched visitor.
static double Area(Shape s) => s switch
{
    Circle    c => Math.PI * c.Radius * c.Radius,
    Rectangle r => r.W * r.H,
    Triangle  t => 0.5 * t.Base * t.Height,
    _ => throw new ArgumentException($"Unknown shape: {s}")
};

Console.WriteLine(Area(new Circle(5)));          // 78.53...
Console.WriteLine(Area(new Rectangle(3, 4)));    // 12`,
    explanation: "Using record types + switch expression replaces the Visitor pattern boilerplate. The compiler warns if a new Shape subtype is added but not handled in the switch.",
  },
  {
    id: "cs-abstract-factory",
    language: "csharp",
    title: "Abstract factory via interface",
    tag: "classes",
    code: `interface IButton  { void Click();  }
interface IFactory { IButton CreateButton(); }

class DarkButton : IButton  { public void Click() => Console.WriteLine("dark click"); }
class LightButton : IButton { public void Click() => Console.WriteLine("light click"); }

class DarkFactory  : IFactory { public IButton CreateButton() => new DarkButton();  }
class LightFactory : IFactory { public IButton CreateButton() => new LightButton(); }

// Client uses only the interface — theme is injected.
static void UseButton(IFactory factory)
{
    var btn = factory.CreateButton();
    btn.Click();
}

UseButton(new DarkFactory());   // dark click
UseButton(new LightFactory());  // light click`,
    explanation: "The abstract factory pattern creates families of related objects. Injecting the factory (not the product) lets you switch entire families at once — useful for theming and platform abstraction.",
  },
  {
    id: "cs-builder-pattern",
    language: "csharp",
    title: "Builder pattern with validation",
    tag: "classes",
    code: `class Email
{
    private Email() { }
    public string To { get; private set; } = "";
    public string Subject { get; private set; } = "";
    public string Body    { get; private set; } = "";

    public class Builder
    {
        private readonly Email _email = new();
        public Builder To(string addr)      { _email.To = addr;      return this; }
        public Builder Subject(string subj) { _email.Subject = subj; return this; }
        public Builder Body(string body)    { _email.Body = body;     return this; }
        public Email Build()
        {
            if (string.IsNullOrEmpty(_email.To)) throw new InvalidOperationException();
            return _email;
        }
    }
}

var email = new Email.Builder()
    .To("alice@example.com")
    .Subject("Hello")
    .Body("Hi there!")
    .Build();`,
    explanation: "The builder pattern creates complex objects step-by-step with validation in Build(). The private Email constructor prevents direct instantiation — only the inner Builder can create one.",
  },
  {
    id: "cs-strategy-pattern",
    language: "csharp",
    title: "Strategy pattern with Func delegates",
    tag: "classes",
    code: `class Sorter<T>
{
    private readonly Comparison<T> _strategy;

    public Sorter(Comparison<T> strategy) => _strategy = strategy;

    public void Sort(List<T> items)
    {
        items.Sort(_strategy);
    }
}

var items = new List<string> { "banana", "apple", "cherry" };

// Strategy 1: alphabetical.
new Sorter<string>(string.Compare).Sort(items);
Console.WriteLine(string.Join(", ", items));   // apple, banana, cherry

// Strategy 2: by length.
new Sorter<string>((a, b) => a.Length - b.Length).Sort(items);
Console.WriteLine(string.Join(", ", items));   // apple, banana, cherry`,
    explanation: "Using a delegate (Comparison<T> or Func<T,T,int>) as a strategy parameter is idiomatic in C# — no need for a Strategy interface and concrete classes for simple algorithms.",
  },
  {
    id: "cs-event-covariant",
    language: "csharp",
    title: "Event declaration with EventHandler<T>",
    tag: "classes",
    code: `class FileWatcher
{
    public event EventHandler<FileChangedEventArgs>? FileChanged;

    protected virtual void OnFileChanged(string path)
    {
        FileChanged?.Invoke(this, new FileChangedEventArgs(path));
    }

    public void SimulateChange(string path) => OnFileChanged(path);
}

class FileChangedEventArgs : EventArgs
{
    public string Path { get; }
    public FileChangedEventArgs(string path) { Path = path; }
}

var watcher = new FileWatcher();
watcher.FileChanged += (sender, e) => Console.WriteLine($"Changed: {e.Path}");
watcher.SimulateChange("/tmp/data.csv");  // Changed: /tmp/data.csv`,
    explanation: "Use EventHandler<TEventArgs> instead of raw delegates for events — it standardises the (sender, args) signature and integrates with the .NET event model and tooling.",
  },
  {
    id: "cs-template-method",
    language: "csharp",
    title: "Template Method pattern via abstract class",
    tag: "classes",
    code: `abstract class DataProcessor
{
    // Template method: defines the algorithm skeleton.
    public void Process()
    {
        ReadData();
        ValidateData();
        TransformData();
        WriteData();
    }

    protected abstract void ReadData();
    protected abstract void WriteData();

    protected virtual void ValidateData()
    {
        Console.WriteLine("Default validation");
    }

    protected virtual void TransformData() { }
}

class CsvProcessor : DataProcessor
{
    protected override void ReadData()  => Console.WriteLine("Read CSV");
    protected override void WriteData() => Console.WriteLine("Write CSV");
}

new CsvProcessor().Process();`,
    explanation: "The template method defines the algorithm in the base class with abstract hooks for varying steps. Subclasses override only what differs — the orchestration stays in the base.",
  },
  {
    id: "cs-decorator-pattern",
    language: "csharp",
    title: "Decorator pattern with interface wrapping",
    tag: "classes",
    code: `interface ICache { string? Get(string key); void Set(string key, string val); }

class MemoryCache : ICache
{
    private readonly Dictionary<string, string> _store = new();
    public string? Get(string key) => _store.GetValueOrDefault(key);
    public void Set(string key, string val) => _store[key] = val;
}

class LoggingCache : ICache
{
    private readonly ICache _inner;
    public LoggingCache(ICache inner) => _inner = inner;
    public string? Get(string key) {
        var val = _inner.Get(key);
        Console.WriteLine($"GET {key} = {val ?? "(miss)"}");
        return val;
    }
    public void Set(string key, string val) {
        Console.WriteLine($"SET {key} = {val}");
        _inner.Set(key, val);
    }
}

ICache cache = new LoggingCache(new MemoryCache());
cache.Set("x", "42");
cache.Get("x");`,
    explanation: "The decorator wraps a component in another that adds behaviour (logging, caching, metrics) while preserving the interface. Stack decorators by wrapping them in each other.",
  },
  {
    id: "cs-composite-pattern",
    language: "csharp",
    title: "Composite pattern — tree of uniform components",
    tag: "classes",
    code: `interface IFileSystem { long Size(); void Print(string indent = ""); }

class File : IFileSystem
{
    public string Name; public long Bytes;
    public File(string n, long b) { Name=n; Bytes=b; }
    public long   Size()                 => Bytes;
    public void   Print(string indent)   => Console.WriteLine($"{indent}{Name} ({Bytes}B)");
}

class Folder : IFileSystem
{
    public string Name; private List<IFileSystem> _children = new();
    public Folder(string n) { Name = n; }
    public void Add(IFileSystem item) => _children.Add(item);
    public long Size() => _children.Sum(c => c.Size());
    public void Print(string indent)
    {
        Console.WriteLine($"{indent}{Name}/");
        _children.ForEach(c => c.Print(indent + "  "));
    }
}

var root = new Folder("root");
root.Add(new File("a.txt", 100)); root.Add(new File("b.txt", 200));
var sub = new Folder("sub"); sub.Add(new File("c.txt", 50)); root.Add(sub);
root.Print();
Console.WriteLine($"Total: {root.Size()}B");`,
    explanation: "The composite pattern treats individual items and containers identically via a common interface. Here, both File and Folder implement IFileSystem — clients don't need to distinguish them.",
  },
  {
    id: "cs-null-object-pattern",
    language: "csharp",
    title: "Null Object pattern — eliminate null checks",
    tag: "classes",
    code: `interface ILogger { void Log(string msg); }

class ConsoleLogger : ILogger
{
    public void Log(string msg) => Console.WriteLine($"LOG: {msg}");
}

// NullLogger: does nothing — safe to call without null checks.
class NullLogger : ILogger
{
    public static readonly ILogger Instance = new NullLogger();
    public void Log(string msg) { }   // no-op
}

class Service
{
    private readonly ILogger _log;
    public Service(ILogger? log = null) => _log = log ?? NullLogger.Instance;
    public void DoWork() { _log.Log("working"); }
}

new Service().DoWork();                        // silent
new Service(new ConsoleLogger()).DoWork();     // LOG: working`,
    explanation: "The Null Object provides a do-nothing default implementation, eliminating null checks everywhere the service is used. Prefer it over null-conditional ?. chaining on injected dependencies.",
  },
  {
    id: "cs-primary-constructor",
    language: "csharp",
    title: "Primary constructors (C# 12)",
    tag: "snippet",
    code: `// Primary constructors for classes and structs (C# 12).
class Point(double x, double y)
{
    public double X { get; } = x;
    public double Y { get; } = y;
    public double Distance => Math.Sqrt(X * X + Y * Y);
}

// Also works on structs:
struct Color(byte r, byte g, byte b)
{
    public byte R = r, G = g, B = b;
}

var p = new Point(3, 4);
Console.WriteLine(p.Distance); // 5`,
    explanation: "Primary constructors bring constructor parameters into class/struct scope for initializers. Reduces boilerplate; parameters are in scope for all instance members during initialization.",
  },
  {
    id: "cs-default-interface-method",
    language: "csharp",
    title: "Default interface methods",
    tag: "snippet",
    code: `interface ILogger
{
    void Log(string message);
    // Default implementation — no need to override
    void LogError(string msg) => Log($"ERROR: {msg}");
    void LogInfo(string msg)  => Log($"INFO:  {msg}");
}

class ConsoleLogger : ILogger
{
    public void Log(string message) => Console.WriteLine(message);
    // LogError and LogInfo are inherited from the interface
}

ILogger log = new ConsoleLogger();
log.LogError("Oops");   // ERROR: Oops
log.LogInfo("Ready");   // INFO:  Ready`,
    explanation: "Default interface methods let you add new members to interfaces without breaking existing implementations. Often used for convenience overloads that delegate to the one required member.",
  },
  {
    id: "cs-pattern-matching-not",
    language: "csharp",
    title: "Negation and conjunctive patterns",
    tag: "snippet",
    code: `object? val = 42;

// 'not' pattern
if (val is not null)
    Console.WriteLine("has a value");

// 'and' / 'or' combined
int n = 15;
bool inRange = n is >= 10 and <= 20;   // true
bool outside  = n is < 0 or > 100;     // false

// Combine with type tests
static string Describe(object o) => o switch
{
    int i and > 0     => $"positive int {i}",
    int i and < 0     => $"negative int {i}",
    int                => "zero",
    string s and not "" => $"non-empty string '{s}'",
    _                  => "other",
};`,
    explanation: "C# 9+ logical patterns (`not`, `and`, `or`) compose checks without nested if-statements. They work in both `is` expressions and `switch` arms, keeping guard logic close to the pattern.",
  },
  {
    id: "cs-span-string-slice",
    language: "csharp",
    title: "Slicing strings with Span<char>",
    tag: "snippet",
    code: `string path = "/usr/local/bin/dotnet";

// Zero-allocation slice — no heap string created
ReadOnlySpan<char> filename = path.AsSpan(path.LastIndexOf('/') + 1);
Console.WriteLine(filename.ToString());   // dotnet

// Useful in hot paths: parse without allocating substrings
ReadOnlySpan<char> csv = "10,20,30";
int comma = csv.IndexOf(',');
int first  = int.Parse(csv[..comma]);    // 10
int rest   = int.Parse(csv[(comma + 1)..]);  // "20,30" — would parse 20`,
    explanation: "AsSpan() gives a Span<char> view into an existing string. Combined with slicing (range indexers), you can parse substrings without allocating new string objects on the heap.",
  },
  {
    id: "cs-required-member",
    language: "csharp",
    title: "required members (C# 11)",
    tag: "snippet",
    code: `// 'required' enforces that object-initializer sets the property.
class User
{
    public required string Name  { get; init; }
    public required string Email { get; init; }
    public int Age { get; init; } = 0;  // optional
}

// Compile error: Name and Email must be supplied.
// var u = new User();

var user = new User { Name = "Alice", Email = "a@b.com" };
Console.WriteLine(user.Name);`,
    explanation: "`required` on a property forces callers using object-initializer syntax to provide a value. Unlike constructor parameters, it works cleanly with object initializers and records.",
  },
  {
    id: "cs-checked-unchecked",
    language: "csharp",
    title: "Overflow: checked vs unchecked",
    tag: "understanding",
    code: `int max = int.MaxValue;  // 2,147,483,647

// checked: throws OverflowException on overflow
try
{
    int result = checked(max + 1);
}
catch (OverflowException)
{
    Console.WriteLine("Overflow caught!");
}

// unchecked (default): wraps silently
int wrapped = unchecked(max + 1);   // -2,147,483,648
Console.WriteLine(wrapped);

// Blocks of checked/unchecked code:
checked
{
    int a = max;
    int b = a + 1;  // throws
}`,
    explanation: "By default C# arithmetic is unchecked — overflow wraps silently. Wrap with `checked` to throw on overflow, which is essential for financial or safety-critical calculations.",
  },
  {
    id: "cs-covariant-return",
    language: "csharp",
    title: "Covariant return types (C# 9)",
    tag: "understanding",
    code: `abstract class Animal
{
    public abstract Animal Create();
}

class Dog : Animal
{
    // C# 9+: return type can be a more derived type
    public override Dog Create() => new Dog();
}

Animal a = new Dog();
Animal result = a.Create();   // runtime type is Dog
Dog    d      = new Dog().Create();  // no cast needed`,
    explanation: "Covariant returns allow overrides to return a more derived type than the base declaration. This avoids unnecessary casts and communicates richer static type information to callers.",
  },
  {
    id: "cs-nullability-annotations",
    language: "csharp",
    title: "Nullable reference types annotations",
    tag: "understanding",
    code: `#nullable enable

string  nonNull = "hello";    // cannot be null
string? nullable = null;      // explicitly nullable

// Compiler warns if you dereference without null check:
// int len = nullable.Length;   // warning CS8602

int len = nullable?.Length ?? 0;   // safe

// Bang operator (!) suppresses the warning when you are sure:
string forced = nullable!;   // you assume it's non-null here

// Annotate return values:
string? FindUser(int id) => id > 0 ? "Alice" : null;`,
    explanation: "Nullable reference type annotations (#nullable enable) let the compiler flow-analyse null safety. Use `?` to declare intent, `?.` for safe access, `??` for defaults, and `!` sparingly.",
  },
  {
    id: "cs-using-declarations",
    language: "csharp",
    title: "using declarations (C# 8)",
    tag: "snippet",
    code: `// Classic using statement (scope ends at '}'  brace)
using (var fs1 = File.OpenRead("a.txt"))
{
    // use fs1
}   // disposed here

// C# 8 using declaration — scope ends at end of enclosing block
using var fs2 = File.OpenRead("b.txt");
// ... use fs2 ...
// disposed when the method / block exits

static string ReadAll(string path)
{
    using var reader = new StreamReader(path);
    return reader.ReadToEnd();
}   // reader disposed here`,
    explanation: "The `using var` declaration (C# 8) disposes the object at the end of the enclosing scope without an extra nesting level, keeping code flatter and reducing indentation.",
  },
  {
    id: "cs-init-only-setter",
    language: "csharp",
    title: "init-only property setters",
    tag: "snippet",
    code: `class Coordinate
{
    public double Lat  { get; init; }
    public double Long { get; init; }
}

// Set once via object initializer
var c = new Coordinate { Lat = 51.5, Long = -0.1 };

// Immutable after construction — compile error:
// c.Lat = 52.0;

// Works naturally with records (init is the default)
record Point(double X, double Y);
var p  = new Point(1, 2);
var p2 = p with { X = 5 };   // non-destructive mutation`,
    explanation: "`init` setters allow a property to be set only during object construction (including object initializers and `with` expressions). The value is immutable afterwards, giving value-object semantics.",
  },
  {
    id: "cs-interpolated-verbatim",
    language: "csharp",
    title: "Verbatim interpolated strings",
    tag: "snippet",
    code: `string dir   = @"C:\\Users\\alice";
string file  = "report.pdf";

// Combine @ and $ for interpolated verbatim strings
string path1 = $@"{dir}\\{file}";        // C# 6
string path2 = @$"{dir}\\{file}";        // C# 8+ (either order)
Console.WriteLine(path1);   // C:\\Users\\alice\\report.pdf

// Multi-line interpolated verbatim
string sql = $@"
    SELECT *
    FROM   users
    WHERE  name = '{file}'";`,
    explanation: "Combining `$` and `@` gives you interpolated verbatim strings: backslashes need no escaping, and you can embed expressions with `{}`. Both `$@` and `@$` are valid in C# 8+.",
  },
  {
    id: "cs-stackalloc-span",
    language: "csharp",
    title: "stackalloc with Span<T>",
    tag: "structures",
    code: `// Pre-C# 7.2: stackalloc only in unsafe context
// C# 7.2+: stackalloc can be assigned to Span<T> in safe code
Span<int> buffer = stackalloc int[8];

for (int i = 0; i < buffer.Length; i++)
    buffer[i] = i * i;

int sum = 0;
foreach (int v in buffer)
    sum += v;
Console.WriteLine(sum);   // 0+1+4+9+16+25+36+49 = 140

// Safe because Span keeps the lifetime to the current stack frame
// Never return a stackalloc Span from a method`,
    explanation: "`stackalloc` allocates memory on the stack — no GC pressure. With `Span<T>` you can use it in safe code. Limit size (< a few KB) to avoid stack overflow; never escape the span.",
  },
  {
    id: "cs-named-tuple-return",
    language: "csharp",
    title: "Named tuple return values",
    tag: "structures",
    code: `// Method returns a named tuple — clearer than out params
static (double Min, double Max, double Avg) Stats(int[] data)
{
    double min = data.Min(), max = data.Max();
    return (min, max, data.Average());
}

var (min, max, avg) = Stats([2, 7, 1, 9, 4]);
Console.WriteLine($"min={min} max={max} avg={avg:F1}");
// min=1 max=9 avg=4.6

// Access by name without deconstruction:
var s = Stats([2, 7, 1, 9, 4]);
Console.WriteLine(s.Max);`,
    explanation: "Named tuples document the semantic meaning of each element without defining a full struct. They combine with deconstruction for clean call-site patterns and are value-typed (no heap allocation).",
  },
  {
    id: "cs-dictionary-trygetvalue",
    language: "csharp",
    title: "TryGetValue vs indexer lookup",
    tag: "structures",
    code: `var scores = new Dictionary<string, int>
{
    ["Alice"] = 95,
    ["Bob"]   = 87,
};

// Indexer throws KeyNotFoundException if key is absent:
// int x = scores["Eve"];  // throws

// TryGetValue: safe lookup, no throw, no double-hash
if (scores.TryGetValue("Alice", out int score))
    Console.WriteLine($"Alice: {score}");   // Alice: 95

// GetValueOrDefault (C# 8): returns 0 / default if missing
int eve = scores.GetValueOrDefault("Eve");  // 0
int eveOr = scores.GetValueOrDefault("Eve", -1);  // -1`,
    explanation: "`TryGetValue` performs a single hash lookup and returns false if the key is absent — always prefer it over the indexer when the key might be missing. `GetValueOrDefault` is an even terser alternative for read-only lookups.",
  },
  {
    id: "cs-array-segment",
    language: "csharp",
    title: "ArraySegment<T> as a slice",
    tag: "structures",
    code: `int[] data = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

// Zero-copy slice into the original array
var seg = new ArraySegment<int>(data, offset: 3, count: 4);
// seg contains data[3..7] = {3,4,5,6}

foreach (int v in seg)
    Console.Write(v + " ");   // 3 4 5 6
Console.WriteLine();

// Modifications through the segment affect the original array
seg[0] = 99;
Console.WriteLine(data[3]);   // 99

// Convert to Span (zero-copy, no allocation)
Span<int> span = seg;`,
    explanation: "`ArraySegment<T>` is a lightweight struct that wraps an array with an offset and count. It avoids copying but does allocate a new struct. For performance-critical code, prefer `Span<T>` which has better language support.",
  },
  {
    id: "cs-iasyncenumerable",
    language: "csharp",
    title: "IAsyncEnumerable<T> async streams",
    tag: "structures",
    code: `using System.Runtime.CompilerServices;

// Produce values asynchronously
static async IAsyncEnumerable<int> CountUpAsync(
    int from, int to,
    [EnumeratorCancellation] CancellationToken ct = default)
{
    for (int i = from; i <= to; i++)
    {
        await Task.Delay(10, ct);
        yield return i;
    }
}

// Consume with await foreach
await foreach (int n in CountUpAsync(1, 5))
    Console.Write(n + " ");
// 1 2 3 4 5`,
    explanation: "`IAsyncEnumerable<T>` with `yield return` inside an `async` method creates an async stream. Callers use `await foreach`. The `[EnumeratorCancellation]` attribute wires cancellation into the loop automatically.",
  },
  {
    id: "cs-boxing-value-type",
    language: "csharp",
    title: "Boxing and unboxing mechanics",
    tag: "caveats",
    code: `int x = 42;

// Boxing: copies value type to heap-allocated object
object boxed = x;           // allocation

// Unboxing: copies back, must match exact type
int y = (int)boxed;         // OK
// long z = (long)boxed;    // InvalidCastException — must use (int) first

// Hidden boxing in older APIs
ArrayList list = new ArrayList();
list.Add(42);   // boxes every int
int n = (int)list[0];  // unboxes

// Modern generics avoid boxing:
List<int> typed = new List<int>();
typed.Add(42);  // no boxing`,
    explanation: "Boxing wraps a value type in a heap object; unboxing copies it back. It's a hidden allocation in generic-free or interface-based APIs. Generics and `Span<T>` are the primary ways to avoid boxing in modern C#.",
  },
  {
    id: "cs-closure-loop-variable",
    language: "csharp",
    title: "Closure captures loop variable",
    tag: "caveats",
    code: `// Classic trap: all lambdas capture the same variable
var actions = new List<Action>();
for (int i = 0; i < 3; i++)
    actions.Add(() => Console.Write(i + " "));

actions.ForEach(a => a());   // prints: 3 3 3  (not 0 1 2!)

// Fix: capture a local copy
var correct = new List<Action>();
for (int i = 0; i < 3; i++)
{
    int copy = i;   // new variable per iteration
    correct.Add(() => Console.Write(copy + " "));
}
correct.ForEach(a => a());   // prints: 0 1 2

// foreach in C# 5+ captures per-iteration, so no trap there`,
    explanation: "A lambda captures the variable itself, not the value at capture time. In a `for` loop all closures share one variable (i), which is 3 by the time they run. Creating a local copy per iteration fixes it.",
  },
  {
    id: "cs-equals-vs-referenceequals",
    language: "csharp",
    title: "Equals vs ReferenceEquals",
    tag: "caveats",
    code: `string a = "hello";
string b = "hello";
string c = new string("hello".ToCharArray()); // avoids interning

// Equals: value equality (overridden by string)
Console.WriteLine(a.Equals(b));              // True
Console.WriteLine(a.Equals(c));              // True

// ReferenceEquals: identity (same heap object?)
Console.WriteLine(ReferenceEquals(a, b));    // True  (interned)
Console.WriteLine(ReferenceEquals(a, c));    // False (new object)

// == on strings uses value equality (Equals)
Console.WriteLine(a == c);     // True

// For objects without Equals override, == is ReferenceEquals:
var x = new object();
var y = new object();
Console.WriteLine(x == y);     // False`,
    explanation: "`Equals` tests semantic equality (overridden by value-types and strings). `ReferenceEquals` tests object identity. For strings, `==` calls `Equals`; for most objects, `==` is identity. Know which you need.",
  },
  {
    id: "cs-yield-state-machine",
    language: "csharp",
    title: "yield return state machine internals",
    tag: "understanding",
    code: `// Iterator methods compile to a hidden state-machine class.
// Each 'yield return' resumes at the next state.
static IEnumerable<int> Squares(int n)
{
    for (int i = 1; i <= n; i++)
    {
        Console.Write($"[{i}] ");  // only runs on demand
        yield return i * i;
    }
}

// Execution is lazy — nothing runs until enumerated
var seq = Squares(3);
Console.WriteLine("created");       // prints first
foreach (int v in seq)
    Console.Write(v + " ");
// created  [1] 1  [2] 4  [3] 9`,
    explanation: "The compiler transforms an iterator method into a state-machine class that implements `IEnumerator<T>`. Execution is suspended at each `yield return` and resumed on the next `MoveNext()` call — making iterators truly lazy.",
  },
  {
    id: "cs-expression-bodied-members",
    language: "csharp",
    title: "Expression-bodied members",
    tag: "snippet",
    code: `class Circle(double radius)
{
    // Expression-bodied property
    public double Radius => radius;
    public double Area   => Math.PI * radius * radius;

    // Expression-bodied method
    public double Scale(double factor) => new Circle(radius * factor).Area;

    // Expression-bodied constructor and finalizer (C# 7)
    ~Circle() => Console.WriteLine("Circle destroyed");

    // Expression-bodied operator
    public static Circle operator *(Circle c, double f) => new(c.Radius * f);
}

var c = new Circle(5);
Console.WriteLine(c.Area);   // 78.53...`,
    explanation: "Expression-bodied members use `=>` to replace single-expression method/property/operator bodies. They reduce noise for trivial members while remaining fully type-checked.",
  },
  {
    id: "cs-deconstruct-custom",
    language: "csharp",
    title: "Custom Deconstruct method",
    tag: "snippet",
    code: `class Rectangle
{
    public double Width  { get; }
    public double Height { get; }
    public Rectangle(double w, double h) { Width = w; Height = h; }

    // Provide deconstruction by adding a Deconstruct method
    public void Deconstruct(out double width, out double height)
    {
        width  = Width;
        height = Height;
    }
}

var rect = new Rectangle(3, 4);
var (w, h) = rect;   // calls Deconstruct
Console.WriteLine($"{w} x {h}");   // 3 x 4

// Works in switch patterns too:
if (rect is (3, var ht))
    Console.WriteLine($"Width is 3, height={ht}");`,
    explanation: "Any type with a `Deconstruct(out T1 ..., out TN ...)` method supports tuple-like deconstruction syntax. Extension methods work too, letting you add deconstruction to types you don't own.",
  },
  {
    id: "cs-string-create",
    language: "csharp",
    title: "String.Create for zero-copy construction",
    tag: "snippet",
    code: `using System.Buffers;

// String.Create writes directly into the string's buffer — no intermediate allocation
string result = string.Create(10, 65, static (span, startChar) =>
{
    for (int i = 0; i < span.Length; i++)
        span[i] = (char)(startChar + i);
});
Console.WriteLine(result);   // ABCDEFGHIJ

// Compare with StringBuilder (allocates a char[] internally)
var sb = new System.Text.StringBuilder();
for (int i = 0; i < 10; i++)
    sb.Append((char)(65 + i));
string s2 = sb.ToString();`,
    explanation: "`String.Create` eliminates the intermediate buffer that `StringBuilder` or `string(char[])` would allocate. The state parameter avoids capturing a variable in the lambda, preventing a closure allocation.",
  },
  {
    id: "cs-record-struct",
    language: "csharp",
    title: "record struct (C# 10)",
    tag: "types",
    code: `// record struct: value semantics + value-type storage (no heap)
record struct Point(double X, double Y);

var a = new Point(1, 2);
var b = new Point(1, 2);
Console.WriteLine(a == b);   // True  (structural equality)
Console.WriteLine(a);        // Point { X = 1, Y = 2 }

// Mutable by default (unlike record class)
a.X = 99;
Console.WriteLine(a.X);

// readonly record struct for immutable value type
readonly record struct Vector(double Dx, double Dy)
{
    public double Length => Math.Sqrt(Dx*Dx + Dy*Dy);
}`,
    explanation: "`record struct` gives value-type semantics (stack allocation, copy-by-value) with auto-generated equality and `ToString`. `readonly record struct` additionally prevents mutation — the sweet spot for small immutable data.",
  },
  {
    id: "cs-delegate-func-action",
    language: "csharp",
    title: "Func<>, Action<>, Predicate<>",
    tag: "types",
    code: `// Func<T, TResult>: takes T, returns TResult
Func<int, int, int> add  = (a, b) => a + b;
Func<string, int>   len  = s => s.Length;
Console.WriteLine(add(3, 4));   // 7

// Action<T>: takes T, returns void
Action<string> print = Console.WriteLine;
print("hello");

// Predicate<T>: special case of Func<T, bool>
Predicate<int> isEven = n => n % 2 == 0;
Console.WriteLine(isEven(4));   // True

// Compose with LINQ:
var nums = Enumerable.Range(1, 10)
    .Where(isEven)
    .Select(n => add(n, 1));
Console.WriteLine(string.Join(",", nums));  // 3,5,7,9,11`,
    explanation: "`Func<>`, `Action<>`, and `Predicate<>` are built-in generic delegate types. Use `Func` for functions that return a value, `Action` for void functions, and `Predicate` for single-argument boolean tests.",
  },
  {
    id: "cs-enum-flags",
    language: "csharp",
    title: "Flags enums with bitwise operations",
    tag: "types",
    code: `[Flags]
enum Permissions
{
    None    = 0,
    Read    = 1 << 0,   // 1
    Write   = 1 << 1,   // 2
    Execute = 1 << 2,   // 4
    All     = Read | Write | Execute,
}

Permissions p = Permissions.Read | Permissions.Write;
Console.WriteLine(p);                        // Read, Write
Console.WriteLine(p.HasFlag(Permissions.Read));   // True
Console.WriteLine(p.HasFlag(Permissions.Execute)); // False

// Add a permission
p |= Permissions.Execute;
// Remove a permission
p &= ~Permissions.Write;
Console.WriteLine(p);   // Read, Execute`,
    explanation: "`[Flags]` enum uses power-of-two values so multiple flags can be ORed together. `HasFlag` tests membership. Combine with bitwise `|=` (add) and `&= ~flag` (remove). Always include a zero `None` value.",
  },
  {
    id: "cs-observer-event",
    language: "csharp",
    title: "Observer pattern via events",
    tag: "families",
    code: `class Stock
{
    private decimal _price;
    public event EventHandler<decimal>? PriceChanged;

    public decimal Price
    {
        get => _price;
        set
        {
            _price = value;
            PriceChanged?.Invoke(this, value);   // notify subscribers
        }
    }
}

var stock = new Stock();
stock.PriceChanged += (s, p) => Console.WriteLine($"Price: {p:C}");
stock.PriceChanged += (s, p) => { if (p > 100) Console.WriteLine("High!"); };

stock.Price = 95m;    // Price: $95.00
stock.Price = 110m;   // Price: $110.00  High!`,
    explanation: "C# events are multicast delegates with subscribe (`+=`) and unsubscribe (`-=`). The `?.Invoke` null-conditional safely fires with no subscribers. Use `EventHandler<TEventArgs>` as the standard signature.",
  },
  {
    id: "cs-mediator-pattern",
    language: "csharp",
    title: "Mediator pattern",
    tag: "families",
    code: `interface IMediator { void Notify(string sender, string ev); }

class Button { public IMediator? Mediator; public void Click() => Mediator?.Notify("Button", "click"); }
class TextBox { public IMediator? Mediator; public void Input() => Mediator?.Notify("TextBox", "input"); }

class UIMediator : IMediator
{
    private readonly Button _btn;
    private readonly TextBox _tb;
    public UIMediator(Button b, TextBox t) { _btn = b; _btn.Mediator = this; _tb = t; _tb.Mediator = this; }

    public void Notify(string sender, string ev)
    {
        if (sender == "Button" && ev == "click")
            Console.WriteLine("Mediator: button clicked, clearing textbox");
        else if (sender == "TextBox" && ev == "input")
            Console.WriteLine("Mediator: text changed, enabling button");
    }
}

var btn = new Button(); var tb = new TextBox();
var med = new UIMediator(btn, tb);
btn.Click(); tb.Input();`,
    explanation: "The Mediator centralises cross-component communication, reducing direct coupling between components. Each component only knows the mediator interface, not its peers — particularly useful for complex UI or workflow orchestration.",
  },
  {
    id: "cs-chain-of-responsibility",
    language: "csharp",
    title: "Chain of responsibility",
    tag: "families",
    code: `abstract class Handler
{
    protected Handler? Next;
    public Handler SetNext(Handler h) { Next = h; return h; }
    public abstract void Handle(int request);
}

class LowHandler : Handler
{
    public override void Handle(int r)
    {
        if (r < 10) Console.WriteLine($"Low handles {r}");
        else Next?.Handle(r);
    }
}

class MidHandler : Handler
{
    public override void Handle(int r)
    {
        if (r < 100) Console.WriteLine($"Mid handles {r}");
        else Next?.Handle(r);
    }
}

var low = new LowHandler();
low.SetNext(new MidHandler());

low.Handle(5);   // Low handles 5
low.Handle(50);  // Mid handles 50`,
    explanation: "Chain of Responsibility passes a request along a chain of handlers until one processes it. Each handler decides to handle or forward. Use it for middleware pipelines, validation chains, and event bubbling.",
  },
  {
    id: "cs-abstract-base-template",
    language: "csharp",
    title: "Template method in abstract base",
    tag: "classes",
    code: `abstract class Report
{
    // Template method: defines the skeleton
    public void Generate()
    {
        GatherData();
        FormatData();
        Output();
    }

    protected abstract void GatherData();
    protected abstract void FormatData();

    protected virtual void Output() =>
        Console.WriteLine("Writing to stdout");
}

class CsvReport : Report
{
    protected override void GatherData()   => Console.WriteLine("Querying DB...");
    protected override void FormatData()   => Console.WriteLine("Formatting CSV...");
}

new CsvReport().Generate();
// Querying DB... → Formatting CSV... → Writing to stdout`,
    explanation: "The Template Method pattern defines the algorithm skeleton in a base class and defers specific steps to subclasses. `protected abstract` forces overrides; `virtual` provides a default that subclasses can override optionally.",
  },
  {
    id: "cs-sealed-class",
    language: "csharp",
    title: "sealed classes and override",
    tag: "classes",
    code: `class Base
{
    public virtual void Hello() => Console.WriteLine("Base");
}

class Derived : Base
{
    // sealed override: cannot be overridden further
    public sealed override void Hello() => Console.WriteLine("Derived");
}

// Compile error: cannot override a sealed member
// class Further : Derived { public override void Hello() {} }

// sealed class: cannot be inherited at all
sealed class Singleton
{
    public static readonly Singleton Instance = new();
    private Singleton() {}
}`,
    explanation: "`sealed` on a class prevents inheritance. `sealed override` prevents a virtual method from being overridden in further derived classes. Sealing enables JIT devirtualisation, which can improve performance in hot paths.",
  },
  {
    id: "cs-interface-segregation",
    language: "csharp",
    title: "Interface segregation principle",
    tag: "classes",
    code: `// Fat interface (violation):
interface IWorker { void Work(); void Eat(); void Sleep(); }

// Segregated (ISP-compliant):
interface IWorkable  { void Work(); }
interface IFeedable  { void Eat(); }
interface ISleepable { void Sleep(); }

class HumanWorker : IWorkable, IFeedable, ISleepable
{
    public void Work()  => Console.WriteLine("Working");
    public void Eat()   => Console.WriteLine("Eating");
    public void Sleep() => Console.WriteLine("Sleeping");
}

// Robot only needs IWorkable — no forced stubs for Eat/Sleep
class Robot : IWorkable
{
    public void Work() => Console.WriteLine("Beep boop working");
}`,
    explanation: "ISP: clients should not depend on interfaces they don't use. Split large interfaces into small, role-specific ones. This makes implementations cleaner and reduces coupling between unrelated consumers.",
  },
  {
    id: "cs-extension-method-fluent",
    language: "csharp",
    title: "Extension methods for fluent APIs",
    tag: "classes",
    code: `static class StringExtensions
{
    public static string Truncate(this string s, int maxLen)
        => s.Length <= maxLen ? s : s[..maxLen] + "...";

    public static string TitleCase(this string s)
        => System.Globalization.CultureInfo.CurrentCulture
              .TextInfo.ToTitleCase(s.ToLower());

    public static bool IsEmail(this string s)
        => s.Contains('@') && s.Contains('.');
}

string input = "hello world from csharp, a long string";

string result = input
    .TitleCase()          // Hello World From Csharp, A Long String
    .Truncate(20);        // Hello World From Cs...

Console.WriteLine(result);
Console.WriteLine("alice@example.com".IsEmail());   // True`,
    explanation: "Extension methods on `string` (or any type) enable fluent chaining without modifying the original class. They are syntactic sugar — the compiler rewrites `s.Truncate(20)` to `StringExtensions.Truncate(s, 20)`.",
  },

];
