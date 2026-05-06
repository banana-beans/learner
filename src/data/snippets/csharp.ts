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
];

