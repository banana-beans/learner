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
];
