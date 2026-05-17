import type { Snippet } from "./types";

export const csharpSnippets20260517B2: Snippet[] = [
  // === snippet ===
  {
    id: "cs-b17-b2-linq-aggregate",
    language: "csharp",
    title: "LINQ Aggregate — custom fold/reduce",
    tag: "snippet",
    code: `using System.Linq;

int[] nums = [1, 2, 3, 4, 5];

// Sum via Aggregate:
int sum = nums.Aggregate(0, (acc, n) => acc + n);
Console.WriteLine(sum);   // 15

// Build a running product string:
string product = nums.Aggregate("", (acc, n) =>
    acc == "" ? \`\${n}\` : \`\${acc} * \${n}\`);
Console.WriteLine(product);  // 1 * 2 * 3 * 4 * 5`,
    explanation: "`Aggregate(seed, (acc, element) => newAcc)` is LINQ's general-purpose fold/reduce; the seed becomes the accumulator's initial value and each element updates it, enabling arbitrary reductions beyond sum/max.",
  },
  {
    id: "cs-b17-b2-linq-groupby",
    language: "csharp",
    title: "LINQ GroupBy — group elements by key",
    tag: "snippet",
    code: `using System.Linq;

var people = new[] {
    (Name: "Alice", Dept: "Eng"),
    (Name: "Bob",   Dept: "HR"),
    (Name: "Carol", Dept: "Eng"),
};

var byDept = people.GroupBy(p => p.Dept);

foreach (var group in byDept)
{
    Console.Write(\`\${group.Key}: \`);
    Console.WriteLine(string.Join(", ", group.Select(p => p.Name)));
}
// Eng: Alice, Carol
// HR: Bob`,
    explanation: "`GroupBy(keySelector)` returns `IEnumerable<IGrouping<K, T>>` where each group has a `Key` and exposes its elements as `IEnumerable<T>` — groups are computed lazily when enumerated.",
  },
  {
    id: "cs-b17-b2-linq-join",
    language: "csharp",
    title: "LINQ Join — equijoin two sequences",
    tag: "snippet",
    code: `using System.Linq;

var orders = new[] { (Id: 1, CustomerId: 10, Amount: 99.9m) };
var customers = new[] { (Id: 10, Name: "Alice") };

var result = orders.Join(
    customers,
    order    => order.CustomerId,   // outer key
    customer => customer.Id,        // inner key
    (order, customer) => new        // result selector
    {
        customer.Name,
        order.Amount
    });

foreach (var r in result)
    Console.WriteLine(\`\${r.Name}: \${r.Amount}\`);  // Alice: 99.9`,
    explanation: "`Join` performs an inner equijoin, matching elements from two sequences where the key selectors produce equal values — semantically identical to SQL INNER JOIN and evaluated lazily.",
  },
  {
    id: "cs-b17-b2-linq-selectmany",
    language: "csharp",
    title: "LINQ SelectMany — flatten nested sequences",
    tag: "snippet",
    code: `using System.Linq;

var departments = new[]
{
    new { Name = "Eng", Members = new[] { "Alice", "Bob" } },
    new { Name = "HR",  Members = new[] { "Carol" } },
};

// Flatten all members into one sequence:
IEnumerable<string> all = departments.SelectMany(d => d.Members);
Console.WriteLine(string.Join(", ", all));  // Alice, Bob, Carol

// SelectMany with result selector — include parent info:
var tagged = departments.SelectMany(
    d => d.Members,
    (d, m) => \`\${d.Name}:\${m}\`);
Console.WriteLine(string.Join(", ", tagged));  // Eng:Alice, Eng:Bob, HR:Carol`,
    explanation: "`SelectMany` projects each element to a sequence and flattens the results into one `IEnumerable<T>` — equivalent to a nested `Select` followed by `Concat`, or the `>>=` monad bind for sequences.",
  },
  {
    id: "cs-b17-b2-pattern-property",
    language: "csharp",
    title: "Property pattern matching in switch",
    tag: "snippet",
    code: `record Order(string Status, decimal Total);

string Classify(Order o) => o switch
{
    { Status: "cancelled" }               => "skip",
    { Status: "paid", Total: > 1000 }    => "vip",
    { Status: "paid" }                    => "normal",
    { Status: "pending", Total: var t }  => \`pending: \${t:C}\`,
    _                                     => "unknown",
};

Console.WriteLine(Classify(new Order("paid", 1500)));    // vip
Console.WriteLine(Classify(new Order("pending", 99)));   // pending: $99.00`,
    explanation: "Property patterns `{ Prop: pattern }` inside a `switch` expression match on the values of properties, and can nest arbitrarily — `var t` captures the value into a new variable for use in the arm's expression.",
  },
  {
    id: "cs-b17-b2-positional-pattern",
    language: "csharp",
    title: "Positional pattern matching with Deconstruct",
    tag: "snippet",
    code: `record Point(int X, int Y);

string Describe(Point p) => p switch
{
    (0, 0)        => "origin",
    (var x, 0)   => \`x-axis at \${x}\`,
    (0, var y)   => \`y-axis at \${y}\`,
    (var x, var y) when x == y => \`diagonal at \${x}\`,
    _             => \`point (\${p.X}, \${p.Y})\`,
};

Console.WriteLine(Describe(new Point(0, 0)));   // origin
Console.WriteLine(Describe(new Point(3, 3)));   // diagonal at 3`,
    explanation: "Positional patterns call the type's `Deconstruct` method and match on the deconstructed values — records auto-generate `Deconstruct` from their primary constructor parameters.",
  },
  {
    id: "cs-b17-b2-tuple-swap",
    language: "csharp",
    title: "Tuple swap without a temp variable",
    tag: "snippet",
    code: `int a = 1, b = 2;

// Classic:
// int temp = a; a = b; b = temp;

// Tuple deconstruction swap:
(a, b) = (b, a);
Console.WriteLine(\`a=\${a}, b=\${b}\`);  // a=2, b=1

// Works with any types:
string x = "hello", y = "world";
(x, y) = (y, x);
Console.WriteLine(\`x=\${x}, y=\${y}\`);  // x=world, y=hello`,
    explanation: "C# tuple assignment `(a, b) = (b, a)` performs the swap by constructing the right-hand `ValueTuple` first, then assigning — no temp variable needed and the intent is clear.",
  },
  {
    id: "cs-b17-b2-string-span-no-alloc",
    language: "csharp",
    title: "Parsing integers from ReadOnlySpan<char> without allocation",
    tag: "snippet",
    code: `ReadOnlySpan<char> data = "age=42".AsSpan();

// Find the '=' separator:
int eq = data.IndexOf('=');
ReadOnlySpan<char> numPart = data[(eq + 1)..];

// int.Parse accepts ReadOnlySpan<char> directly:
int age = int.Parse(numPart);
Console.WriteLine(age);   // 42

// Also works with TryParse:
bool ok = int.TryParse(numPart, out int age2);`,
    explanation: "Most BCL parse methods have `ReadOnlySpan<char>` overloads; combined with span slicing this eliminates all intermediate `Substring` allocations for number-parsing hot paths.",
  },
  {
    id: "cs-b17-b2-file-readlines",
    language: "csharp",
    title: "File.ReadAllLines vs File.ReadLines (lazy)",
    tag: "snippet",
    code: `using System.IO;

string path = "/etc/hostname";

// ReadAllLines: loads ALL lines into memory first
string[] all = File.ReadAllLines(path);

// ReadLines: lazy — one line at a time (better for large files)
foreach (string line in File.ReadLines(path))
    Console.WriteLine(line);

// ReadAllText / WriteAllText for full file:
string content = File.ReadAllText(path);
File.WriteAllText("/tmp/out.txt", content.ToUpper());`,
    explanation: "`File.ReadLines` is lazy and returns `IEnumerable<string>` — it doesn't load the whole file into memory, making it suitable for large files; `ReadAllLines` reads everything up front into a string array.",
  },
  {
    id: "cs-b17-b2-span-stackalloc-small",
    language: "csharp",
    title: "stackalloc with threshold for adaptive buffering",
    tag: "snippet",
    code: `using System.Buffers;

void ProcessData(int size)
{
    // Use stack for small buffers, heap for large:
    const int StackThreshold = 256;
    byte[]? rented = null;
    Span<byte> buffer = size <= StackThreshold
        ? stackalloc byte[size]
        : (rented = ArrayPool<byte>.Shared.Rent(size));

    try
    {
        buffer[..size].Fill(0);
        // use buffer...
    }
    finally
    {
        if (rented is not null)
            ArrayPool<byte>.Shared.Return(rented);
    }
}`,
    explanation: "The idiomatic high-performance pattern: stack-allocate for small buffers (no GC pressure) and rent from `ArrayPool<T>` for large ones; the `Span<byte>` type abstracts both sources uniformly.",
  },
  {
    id: "cs-b17-b2-math-biginteger",
    language: "csharp",
    title: "BigInteger for arbitrary-precision integers",
    tag: "snippet",
    code: `using System.Numerics;

BigInteger factorial = 1;
for (int i = 2; i <= 50; i++)
    factorial *= i;

Console.WriteLine(factorial);  // 30414093201713378043612608166979581188299763898377856000000000000

BigInteger a = BigInteger.Parse("99999999999999999999999999999");
BigInteger b = a * a;
Console.WriteLine(b.ToString().Length + " digits");  // 59 digits`,
    explanation: "`System.Numerics.BigInteger` is an arbitrary-precision integer that grows as needed — slower than `int`/`long` but handles factorial, cryptographic numbers, and other values that overflow native types.",
  },
  {
    id: "cs-b17-b2-environment-vars",
    language: "csharp",
    title: "Environment variable access patterns",
    tag: "snippet",
    code: `using System;

// Read — null if not set:
string? path = Environment.GetEnvironmentVariable("PATH");

// Read with default:
string dbHost = Environment.GetEnvironmentVariable("DB_HOST") ?? "localhost";

// Set (process-wide):
Environment.SetEnvironmentVariable("MY_VAR", "hello");

// GetFolderPath for known OS paths:
string desktop = Environment.GetFolderPath(Environment.SpecialFolder.Desktop);
Console.WriteLine(Environment.MachineName);
Console.WriteLine(Environment.ProcessorCount);`,
    explanation: "`Environment.GetEnvironmentVariable` returns `null` (not empty string) when the variable isn't set — always null-coalesce to a safe default for optional configuration values.",
  },
  {
    id: "cs-b17-b2-stopwatch",
    language: "csharp",
    title: "Stopwatch for high-resolution timing",
    tag: "snippet",
    code: `using System.Diagnostics;

var sw = Stopwatch.StartNew();

long total = 0;
for (int i = 0; i < 10_000_000; i++)
    total += i;

sw.Stop();
Console.WriteLine(total);                   // sum
Console.WriteLine(sw.Elapsed);             // 00:00:00.0123456
Console.WriteLine(sw.ElapsedMilliseconds); // e.g. 12
Console.WriteLine(sw.ElapsedTicks);        // raw ticks`,
    explanation: "`Stopwatch` uses the OS high-resolution counter (`QueryPerformanceCounter` on Windows); it's the correct tool for micro-benchmarking — `DateTime.Now` has ~15ms resolution and is too coarse.",
  },
  {
    id: "cs-b17-b2-guid-newguid",
    language: "csharp",
    title: "Guid.NewGuid and Guid parsing",
    tag: "snippet",
    code: `using System;

// Generate a v4 (random) GUID:
Guid id = Guid.NewGuid();
Console.WriteLine(id);   // e.g. a3b4c5d6-...

// Parse from string:
Guid parsed = Guid.Parse("550e8400-e29b-41d4-a716-446655440000");
bool ok = Guid.TryParse("invalid", out Guid g2);
Console.WriteLine(ok);  // False

// Compact format (no hyphens):
Console.WriteLine(id.ToString("N"));  // 32 hex chars
Console.WriteLine(Guid.Empty);        // 00000000-0000-0000-0000-000000000000`,
    explanation: "`Guid.NewGuid()` generates a cryptographically random UUID v4; format specifiers `\"D\"` (default with hyphens), `\"N\"` (no hyphens), `\"B\"` (with braces) control `ToString()` output.",
  },
  {
    id: "cs-b17-b2-string-format-composite",
    language: "csharp",
    title: "Composite string formatting with indexed placeholders",
    tag: "snippet",
    code: `// String.Format with indexed placeholders:
string result = string.Format("Hello, {0}! You have {1} messages.", "Alice", 5);
Console.WriteLine(result);

// With format spec:
string money = string.Format("{0:C2}", 1234.567);
Console.WriteLine(money);   // $1,234.57

// Reuse the same index:
string repeated = string.Format("{0} + {0} = {1}", 5, 10);
Console.WriteLine(repeated);  // 5 + 5 = 10`,
    explanation: "`String.Format` uses `{index:formatSpec}` placeholders; the same index can appear multiple times to reuse an argument — but for most new code, string interpolation `$\"...\"` is more readable.",
  },
  // === understanding ===
  {
    id: "cs-b17-b2-value-reference-semantics",
    language: "csharp",
    title: "Value type vs reference type assignment semantics",
    tag: "understanding",
    code: `// Value type: assignment copies the value
int a = 42;
int b = a;
b = 99;
Console.WriteLine(a);  // 42 — unchanged

// Reference type: assignment copies the reference
var list1 = new System.Collections.Generic.List<int> { 1, 2, 3 };
var list2 = list1;  // both point to the same list
list2.Add(4);
Console.WriteLine(list1.Count);  // 4 — list1 sees the change

// Use new List(list1) or list1.ToList() for a copy:
var list3 = new System.Collections.Generic.List<int>(list1);`,
    explanation: "Value types (struct, int, bool, enum) copy their data on assignment; reference types (class, interface, delegate) copy the pointer — so multiple variables can refer to the same object.",
  },
  {
    id: "cs-b17-b2-null-vs-empty-string",
    language: "csharp",
    title: "null string vs empty string — distinct values",
    tag: "understanding",
    code: `string? nullStr = null;
string emptyStr = "";
string space = " ";

Console.WriteLine(nullStr == null);    // True
Console.WriteLine(nullStr == "");      // False — null != ""
Console.WriteLine(emptyStr.Length);    // 0
// Console.WriteLine(nullStr.Length);  // NullReferenceException!

// Canonical null-and-empty check:
Console.WriteLine(string.IsNullOrEmpty(nullStr));    // True
Console.WriteLine(string.IsNullOrEmpty(emptyStr));   // True
Console.WriteLine(string.IsNullOrWhiteSpace(space)); // True`,
    explanation: "`null` means no string object exists; `\"\"` is an object of length zero — they're different; `string.IsNullOrEmpty` checks both, and `IsNullOrWhiteSpace` also returns true for strings containing only whitespace.",
  },
  {
    id: "cs-b17-b2-readonly-field-vs-const",
    language: "csharp",
    title: "const vs readonly: compile-time vs runtime constants",
    tag: "understanding",
    code: `class Config
{
    // const: compile-time, inlined at every use site — ONLY primitives/string
    public const int MaxRetries = 3;

    // readonly: runtime, evaluated once at construction — any type
    public readonly DateTime StartTime = DateTime.Now;
    public static readonly System.Text.RegularExpressions.Regex EmailPattern
        = new(@"^[^@]+@[^@]+\.[^@]+$");
}

// Changing MaxRetries in a library requires recompiling all callers!
// readonly is safer for library APIs that may change.`,
    explanation: "`const` values are inlined by the compiler wherever they're used — changing a `const` in a library doesn't take effect in callers without recompiling them; `readonly` is evaluated at runtime so callers always see the current value.",
  },
  {
    id: "cs-b17-b2-delegate-multicast",
    language: "csharp",
    title: "Multicast delegates call multiple methods in order",
    tag: "understanding",
    code: `Action<string> handlers = null!;
handlers += s => Console.WriteLine(\`First: \${s}\`);
handlers += s => Console.WriteLine(\`Second: \${s}\`);

handlers("hello");
// First: hello
// Second: hello

// Remove a handler:
Action<string> second = s => Console.WriteLine(\`Second: \${s}\`);
handlers -= second;   // removes by reference equality

// Return value of multicast: ONLY the last invocation's result
Func<int> fns = () => 1;
fns += () => 2;
Console.WriteLine(fns());  // 2  (only last result kept)`,
    explanation: "Delegates are multicast — `+=` chains handlers that are invoked in order; for `Func` delegates only the last return value is kept; use events to control who can add/remove handlers from outside the class.",
  },
  {
    id: "cs-b17-b2-covariance-array",
    language: "csharp",
    title: "Array covariance: a hidden runtime trap",
    tag: "understanding",
    code: `// C# arrays are covariant (a known design mistake):
string[] strings = ["a", "b", "c"];
object[] objects = strings;   // compiles — array covariance

// Reading is safe:
Console.WriteLine(objects[0]);   // a

// Writing throws at RUNTIME:
try
{
    objects[0] = 42;   // ArrayTypeMismatchException!
}
catch (ArrayTypeMismatchException e)
{
    Console.WriteLine(e.Message);
}

// Generic collections don't have this problem:
// List<object> list = new List<string>(); // compile error — correct!`,
    explanation: "Array covariance was added for pre-generics compatibility; assigning to an element through a widened reference throws `ArrayTypeMismatchException` at runtime — generic collections avoid this by being correctly invariant.",
  },
  {
    id: "cs-b17-b2-event-pattern",
    language: "csharp",
    title: "Event pattern: add/remove vs multicast delegate",
    tag: "understanding",
    code: `class Button
{
    // event: restricts external code to += / -= only (not direct invocation)
    public event EventHandler? Click;

    protected virtual void OnClick() => Click?.Invoke(this, EventArgs.Empty);

    public void SimulateClick() => OnClick();
}

var btn = new Button();
btn.Click += (s, e) => Console.WriteLine("handler 1");
btn.Click += (s, e) => Console.WriteLine("handler 2");

btn.SimulateClick();
// handler 1
// handler 2

// btn.Click("bad"); // compile error — cannot invoke event from outside`,
    explanation: "`event` is syntactic sugar that wraps a multicast delegate; external callers can only `+=`/`-=` handlers, not invoke the event or replace it with `=` — the class retains full control over when the event fires.",
  },
  {
    id: "cs-b17-b2-dispose-pattern-using",
    language: "csharp",
    title: "using statement guarantees Dispose on IDisposable",
    tag: "understanding",
    code: `using System.IO;

// using statement desugars to try/finally:
using (var stream = new FileStream("/etc/hostname", FileMode.Open))
{
    // stream.Dispose() called at end, even on exception
}

// Equivalent manual form:
FileStream? s2 = null;
try
{
    s2 = new FileStream("/etc/hostname", FileMode.Open);
}
finally
{
    s2?.Dispose();
}`,
    explanation: "The `using` statement is syntactic sugar for `try { ... } finally { resource.Dispose(); }` — it guarantees `Dispose` is called even when an exception is thrown, preventing resource leaks.",
  },
  {
    id: "cs-b17-b2-static-constructor",
    language: "csharp",
    title: "Static constructor initializes class-level state once",
    tag: "understanding",
    code: `class Registry
{
    public static readonly Dictionary<string, int> Map;

    // Called exactly once, before any static member is accessed:
    static Registry()
    {
        Console.WriteLine("static ctor called");
        Map = new Dictionary<string, int>
        {
            ["a"] = 1,
            ["b"] = 2,
        };
    }
}

Console.WriteLine(Registry.Map["a"]);  // static ctor called  \n 1
Console.WriteLine(Registry.Map["b"]);  // 2  (ctor NOT called again)`,
    explanation: "A static constructor (no access modifier, no parameters) runs once per type before any static member is first accessed — useful for expensive one-time initialization that can't be done inline.",
  },
  {
    id: "cs-b17-b2-nullable-reference-types",
    language: "csharp",
    title: "Nullable reference types: the # enable directive",
    tag: "understanding",
    code: `#nullable enable

string  nonNull  = "hello";   // cannot be null
string? maybeNull = null;      // explicitly nullable

// Compiler warns on potential null dereference:
// int len = maybeNull.Length;  // warning: dereference of null

// Safe access patterns:
int len1 = maybeNull?.Length ?? 0;          // null-conditional
int len2 = maybeNull is null ? 0 : maybeNull.Length;
string safe = maybeNull!;   // null-forgiving: tell compiler you know it's not null`,
    explanation: "With `#nullable enable`, the compiler distinguishes `string` (non-nullable) from `string?` (nullable) and warns when you dereference without a null check — opt into it to catch null-related bugs at compile time.",
  },
  {
    id: "cs-b17-b2-pattern-type-switch",
    language: "csharp",
    title: "Type pattern in switch: replaces if/else-if chains",
    tag: "understanding",
    code: `double Area(object shape) => shape switch
{
    Circle    c => Math.PI * c.Radius * c.Radius,
    Rectangle r => r.Width * r.Height,
    Triangle  t => 0.5 * t.Base * t.Height,
    null        => throw new ArgumentNullException(nameof(shape)),
    _           => throw new ArgumentException(\`Unknown shape: \${shape.GetType().Name}\`),
};

record Circle(double Radius);
record Rectangle(double Width, double Height);
record Triangle(double Base, double Height);

Console.WriteLine(Area(new Circle(5)));       // 78.539...
Console.WriteLine(Area(new Rectangle(4, 6))); // 24`,
    explanation: "Type patterns in `switch` expressions perform `is` type tests and bind the matched value in one step, replacing a chain of `if (shape is Circle c) ... else if (...)` blocks with exhaustive, compiler-checked arms.",
  },
  {
    id: "cs-b17-b2-generic-method-inference",
    language: "csharp",
    title: "Generic method type inference eliminates explicit type args",
    tag: "understanding",
    code: `T Identity<T>(T value) => value;

// Explicit:
int a = Identity<int>(42);

// Inferred — compiler deduces T from argument type:
int b = Identity(42);          // T = int
string s = Identity("hello");  // T = string

// Inference fails when T appears only in return type:
// var x = Allocate<int>();  // must be explicit — compiler can't infer T`,
    explanation: "The C# compiler infers type arguments from the types of method arguments, eliminating the need to write `<T>` explicitly at call sites when `T` is constrained by a parameter — but cannot infer from return type alone.",
  },
  {
    id: "cs-b17-b2-lock-statement",
    language: "csharp",
    title: "lock statement for mutual exclusion",
    tag: "understanding",
    code: `using System.Threading;

class SafeCounter
{
    private readonly object _lock = new();
    private int _count;

    public void Increment()
    {
        lock (_lock)           // acquires Monitor.Enter, releases in finally
        {
            _count++;
        }
    }

    public int Count => Interlocked.CompareExchange(ref _count, 0, 0);
}

var counter = new SafeCounter();
Parallel.For(0, 1000, _ => counter.Increment());
Console.WriteLine(counter.Count);  // 1000`,
    explanation: "`lock(obj)` acquires a mutual exclusion lock on `obj`, blocking other threads until it's released; use a private `readonly object` as the lock target — never lock on `this` or public objects.",
  },
  {
    id: "cs-b17-b2-string-intern",
    language: "csharp",
    title: "String.Intern and compile-time literal interning",
    tag: "understanding",
    code: `string a = "hello";
string b = "hello";

// Literals are interned at compile time:
Console.WriteLine(ReferenceEquals(a, b));   // True

// Runtime-constructed strings are NOT interned:
string c = new string("hello".ToCharArray());
Console.WriteLine(ReferenceEquals(a, c));   // False

// Manually intern:
string d = string.Intern(c);
Console.WriteLine(ReferenceEquals(a, d));   // True

// Use string.IsInterned to test without internaling:
Console.WriteLine(string.IsInterned("hello") is not null);  // True`,
    explanation: "The CLR interns string literals at compile time, making them share a reference; `string.Intern(s)` forces a runtime string into the intern pool and returns the canonical reference.",
  },
  {
    id: "cs-b17-b2-stackoverflowexception",
    language: "csharp",
    title: "StackOverflowException cannot be caught",
    tag: "understanding",
    code: `// This will crash the process — it cannot be caught:
// try { Infinite(); } catch (StackOverflowException) { }  // won't work!

// Unlike other exceptions, StackOverflowException terminates
// the CLR host because the stack is corrupted.

// Prevention: detect recursion depth
int Factorial(int n, int depth = 0)
{
    if (depth > 10_000)
        throw new InvalidOperationException("recursion too deep");
    return n <= 1 ? 1 : n * Factorial(n - 1, depth + 1);
}

// Or: use an explicit stack instead of recursion`,
    explanation: "`StackOverflowException` bypasses the normal exception handling mechanism — the CLR terminates the process immediately because continuing execution with a corrupt stack is unsafe; prevent it with depth guards or iterative algorithms.",
  },
  // === structures ===
  {
    id: "cs-b17-b2-dictionary-try-get",
    language: "csharp",
    title: "TryGetValue avoids double lookup in Dictionary",
    tag: "structures",
    code: `var dict = new Dictionary<string, int> { ["a"] = 1 };

// Double lookup (anti-pattern):
if (dict.ContainsKey("a"))
    Console.WriteLine(dict["a"]);   // two hash lookups

// TryGetValue: one lookup, safe:
if (dict.TryGetValue("a", out int val))
    Console.WriteLine(val);   // 1

// GetValueOrDefault (returns default if missing):
int v = dict.GetValueOrDefault("missing", -1);
Console.WriteLine(v);   // -1`,
    explanation: "`TryGetValue` performs a single hash lookup and returns both the success flag and the value; `ContainsKey` + `[]` is two lookups — and between them another thread could remove the key in concurrent code.",
  },
  {
    id: "cs-b17-b2-list-capacity",
    language: "csharp",
    title: "List<T> capacity vs count — pre-allocating",
    tag: "structures",
    code: `// Without capacity hint — reallocates ~log2(n) times:
var slow = new List<int>();
for (int i = 0; i < 10_000; i++) slow.Add(i);

// With capacity hint — one allocation:
var fast = new List<int>(capacity: 10_000);
for (int i = 0; i < 10_000; i++) fast.Add(i);

Console.WriteLine(slow.Count);     // 10000
Console.WriteLine(slow.Capacity);  // 16384 (next power of 2)
Console.WriteLine(fast.Capacity);  // 10000 (no reallocations)

// Trim excess:
slow.TrimExcess();`,
    explanation: "When you know the final size of a `List<T>`, pass it as the `capacity` constructor argument to avoid repeated backing-array reallocations — each reallocation copies all existing elements.",
  },
  {
    id: "cs-b17-b2-readonly-collection",
    language: "csharp",
    title: "ReadOnlyCollection<T> and AsReadOnly()",
    tag: "structures",
    code: `using System.Collections.Generic;
using System.Collections.ObjectModel;

var inner = new List<int> { 1, 2, 3 };

// Wrap — callers get a read-only view; inner list is still mutable
ReadOnlyCollection<int> ro = inner.AsReadOnly();

Console.WriteLine(ro[0]);   // 1
// ro.Add(4);               // compile error — no Add

inner.Add(4);               // modifies the underlying list
Console.WriteLine(ro.Count); // 4  — reflects change!`,
    explanation: "`ReadOnlyCollection<T>` is a wrapper, not a copy — it prevents callers from mutating through the wrapper but still reflects changes made to the underlying list; use `ImmutableList<T>` for true immutability.",
  },
  {
    id: "cs-b17-b2-stack-recursive-iterative",
    language: "csharp",
    title: "Using Stack<T> to convert recursion to iteration",
    tag: "structures",
    code: `using System.Collections.Generic;

// Iterative DFS using explicit Stack<T> (avoids call-stack overflow):
void DfsIterative(Dictionary<int, List<int>> graph, int start)
{
    var stack   = new Stack<int>();
    var visited = new HashSet<int>();

    stack.Push(start);
    while (stack.TryPop(out int node))
    {
        if (!visited.Add(node)) continue;
        Console.Write(node + " ");
        foreach (int neighbor in graph.GetValueOrDefault(node) ?? [])
            stack.Push(neighbor);
    }
}`,
    explanation: "Converting recursion to iteration with an explicit `Stack<T>` eliminates call-stack limits and gives finer control over traversal order — the stack mirrors what the call stack would have done implicitly.",
  },
  {
    id: "cs-b17-b2-sorted-list-vs-sorted-dict",
    language: "csharp",
    title: "SortedList<K,V> vs SortedDictionary<K,V>: internal structure",
    tag: "structures",
    code: `var sl = new SortedList<int, string>();
var sd = new SortedDictionary<int, string>();

// SortedList: two parallel arrays (keys + values)
//   - O(log n) lookup (binary search)
//   - O(n) insert/delete (array shift)
//   - Less memory than tree
//   - Supports index-based access: sl.Keys[0], sl.Values[1]
sl.Add(3, "c"); sl.Add(1, "a"); sl.Add(2, "b");
Console.WriteLine(sl.Keys[0]);   // 1  (index access)

// SortedDictionary: red-black tree
//   - O(log n) lookup, insert, delete
//   - No index access
sd.Add(3, "c"); sd.Add(1, "a"); sd.Add(2, "b");`,
    explanation: "`SortedList<K,V>` stores data in two parallel arrays (O(log n) search, O(n) insert) and supports index access; `SortedDictionary<K,V>` uses a red-black tree (O(log n) everywhere) — choose based on your insert vs. read ratio.",
  },
  {
    id: "cs-b17-b2-arraypool",
    language: "csharp",
    title: "ArrayPool<T> for reusable buffer renting",
    tag: "structures",
    code: `using System.Buffers;

// Rent a buffer — may be larger than requested:
byte[] buffer = ArrayPool<byte>.Shared.Rent(minimumLength: 1024);
Console.WriteLine(buffer.Length);   // >= 1024

try
{
    // Use buffer (first 1024 bytes are meaningful)
    buffer.AsSpan(0, 1024).Fill(0xFF);
}
finally
{
    // Return to pool — MUST always return, even on exception:
    ArrayPool<byte>.Shared.Return(buffer, clearArray: true);
}`,
    explanation: "`ArrayPool<T>.Shared.Rent(n)` retrieves a reusable array from a pool, avoiding GC pressure for temporary buffers — always return it in a `finally` block to prevent pool exhaustion.",
  },
  {
    id: "cs-b17-b2-linkedlist-node",
    language: "csharp",
    title: "LinkedList<T>: direct node manipulation",
    tag: "structures",
    code: `var ll = new LinkedList<int>(new[] { 1, 2, 3, 4, 5 });

// Find a node and insert before/after it — O(1) given the node:
LinkedListNode<int>? node3 = ll.Find(3);
if (node3 != null)
{
    ll.AddBefore(node3, 99);
    ll.AddAfter(node3, 100);
}

Console.WriteLine(string.Join(", ", ll));
// 1, 2, 99, 3, 100, 4, 5

// Remove by node — O(1):
ll.Remove(node3!);
Console.WriteLine(string.Join(", ", ll));
// 1, 2, 99, 100, 4, 5`,
    explanation: "`LinkedList<T>` returns `LinkedListNode<T>` objects from `Find`, `AddFirst`, `AddLast`, etc.; holding a node reference lets you insert or remove in O(1) without traversing the list again.",
  },
  {
    id: "cs-b17-b2-blocking-collection",
    language: "csharp",
    title: "BlockingCollection<T> for producer-consumer",
    tag: "structures",
    code: `using System.Collections.Concurrent;
using System.Threading;
using System.Threading.Tasks;

var bc = new BlockingCollection<int>(boundedCapacity: 5);

// Producer:
Task producer = Task.Run(() =>
{
    for (int i = 0; i < 10; i++) { bc.Add(i); }
    bc.CompleteAdding();
});

// Consumer:
Task consumer = Task.Run(() =>
{
    foreach (int item in bc.GetConsumingEnumerable())
        Console.Write(item + " ");
});

Task.WaitAll(producer, consumer);  // 0 1 2 3 4 5 6 7 8 9`,
    explanation: "`BlockingCollection<T>` is a thread-safe producer-consumer queue; `Add` blocks when the bounded capacity is full, `GetConsumingEnumerable()` blocks until an item is available and exits cleanly after `CompleteAdding()`.",
  },
  {
    id: "cs-b17-b2-concurrent-bag",
    language: "csharp",
    title: "ConcurrentBag<T> for unordered concurrent collection",
    tag: "structures",
    code: `using System.Collections.Concurrent;
using System.Threading.Tasks;

var bag = new ConcurrentBag<int>();

// Multiple threads adding concurrently:
Parallel.For(0, 100, i => bag.Add(i));

Console.WriteLine(bag.Count);  // 100

// Take removes an arbitrary element (optimized for same-thread reuse):
if (bag.TryTake(out int item))
    Console.WriteLine(\`took: \${item}\`);`,
    explanation: "`ConcurrentBag<T>` is a thread-safe, unordered collection optimized for scenarios where the same thread produces and consumes items (like object pooling) — it uses thread-local storage to reduce contention.",
  },
  {
    id: "cs-b17-b2-memory-pool",
    language: "csharp",
    title: "MemoryPool<T> for managed memory segments",
    tag: "structures",
    code: `using System.Buffers;

// Rent a managed memory segment:
using IMemoryOwner<byte> owner = MemoryPool<byte>.Shared.Rent(1024);
Memory<byte> mem = owner.Memory;

// Fill and use:
mem.Span.Fill(0xAB);
Console.WriteLine(mem.Span[0]);    // 171 (0xAB)

// Memory can be stored in fields (unlike Span) and passed across await:
await ProcessAsync(mem);

static async Task ProcessAsync(Memory<byte> data)
{
    await Task.Delay(1);
    Console.WriteLine(data.Length);
}`,
    explanation: "`MemoryPool<T>` is the heap equivalent of `ArrayPool<T>` — it returns an `IMemoryOwner<T>` that wraps a `Memory<T>`, making it safe to store in fields and pass across async method boundaries.",
  },
  {
    id: "cs-b17-b2-frozen-dictionary",
    language: "csharp",
    title: "FrozenDictionary<K,V> for read-only high-perf lookup",
    tag: "structures",
    code: `using System.Collections.Frozen;

var source = new Dictionary<string, int>
{
    ["one"] = 1, ["two"] = 2, ["three"] = 3
};

// Build once — FrozenDictionary optimizes its hash structure:
FrozenDictionary<string, int> frozen = source.ToFrozenDictionary();

// Lookups are faster than Dictionary for read-heavy workloads:
Console.WriteLine(frozen["two"]);   // 2
Console.WriteLine(frozen.ContainsKey("four")); // False

// Cannot be modified after creation:
// frozen["four"] = 4;  // compile error`,
    explanation: "`FrozenDictionary<K,V>` (.NET 8+) is built once from a source and then optimized for read-only lookup — it generates a perfect or near-perfect hash function, giving better lookup performance than `Dictionary` for static data.",
  },
  // === caveats ===
  {
    id: "cs-b17-b2-task-exception-unobserved",
    language: "csharp",
    title: "Unobserved Task exceptions may crash the process",
    tag: "caveats",
    code: `using System.Threading.Tasks;

// Fire-and-forget — exception is UNOBSERVED:
Task.Run(() => { throw new Exception("ignored?"); });
// In older .NET: crashes via UnobservedTaskException
// In .NET 4.5+: logged but swallowed by default (changed behaviour)

// Always await or handle:
try
{
    await Task.Run(() => { throw new Exception("observed"); });
}
catch (Exception e)
{
    Console.WriteLine(\`caught: \${e.Message}\`);  // caught: observed
}

// Register a last-resort handler:
TaskScheduler.UnobservedTaskException += (s, e) =>
{
    Console.WriteLine("unobserved: " + e.Exception.Message);
    e.SetObserved();
};`,
    explanation: "Exceptions from unawaited `Task.Run` are 'unobserved' and may trigger `UnobservedTaskException` during GC of the task object — always `await` tasks or attach a `.ContinueWith(..., TaskContinuationOptions.OnlyOnFaulted)` handler.",
  },
  {
    id: "cs-b17-b2-mutable-struct-in-readonly",
    language: "csharp",
    title: "Mutating a struct via a property returns a copy",
    tag: "caveats",
    code: `struct Counter { public int Value; }

class Box
{
    public Counter Counter { get; } = new Counter { Value = 0 };
}

var box = new Box();
// box.Counter is returned by VALUE (struct copy):
box.Counter.Value++;   // increments the COPY, not the stored Counter!
Console.WriteLine(box.Counter.Value);  // 0 — unchanged!

// Fix: expose the struct via a field (not property) or use a class`,
    explanation: "A property returns a struct by value — modifying a field on the returned copy doesn't affect the stored struct; this silent no-op is one reason to prefer classes for mutable data or to expose struct fields directly.",
  },
  {
    id: "cs-b17-b2-string-comparison",
    language: "csharp",
    title: "StringComparison ordinal vs culture-sensitive",
    tag: "caveats",
    code: `string a = "file.TXT";
string b = "file.txt";

// Culture-sensitive (default for == on string):
Console.WriteLine(a.Equals(b, StringComparison.CurrentCulture));        // False (case differs)
Console.WriteLine(a.Equals(b, StringComparison.CurrentCultureIgnoreCase)); // True

// Ordinal (byte-by-byte) — fastest, no culture surprises:
Console.WriteLine(a.Equals(b, StringComparison.Ordinal));               // False
Console.WriteLine(a.Equals(b, StringComparison.OrdinalIgnoreCase));     // True

// Use Ordinal for file paths, URLs, keys; CurrentCulture for user-visible text`,
    explanation: "Culture-sensitive comparisons can produce surprising results (e.g., Turkish 'I' problem, ligatures) for non-textual data like file names and dictionary keys — always use `StringComparison.Ordinal` for programmatic string comparison.",
  },
  {
    id: "cs-b17-b2-int-parse-vs-convert",
    language: "csharp",
    title: "int.Parse vs Convert.ToInt32 vs TryParse",
    tag: "caveats",
    code: `// int.Parse: throws FormatException / OverflowException
int a = int.Parse("42");
// int.Parse(null)  -> ArgumentNullException
// int.Parse("")    -> FormatException

// Convert.ToInt32: null becomes 0 (not an exception!)
int b = Convert.ToInt32(null);   // 0
int c = Convert.ToInt32("42");   // 42

// TryParse: safe, returns bool
bool ok = int.TryParse("99x", out int d);
Console.WriteLine(ok, d);   // False, 0`,
    explanation: "`Convert.ToInt32(null)` returns 0 instead of throwing — a subtle trap when null means 'missing' not 'zero'; prefer `int.TryParse` for user input where the string might be invalid, and `int.Parse` only when the string is trusted to be valid.",
  },
  {
    id: "cs-b17-b2-finalizer-thread",
    language: "csharp",
    title: "Finalizers run on a dedicated GC thread",
    tag: "caveats",
    code: `class NativeResource
{
    private readonly IntPtr _handle;
    public NativeResource() => _handle = AcquireHandle();

    ~NativeResource()    // finalizer — runs on GC finalizer thread
    {
        // WARNING: cannot access other managed objects here safely —
        // they may already be collected!
        ReleaseHandle(_handle);
    }

    static IntPtr AcquireHandle() => new IntPtr(42);
    static void ReleaseHandle(IntPtr h) => Console.WriteLine(\`released \${h}\`);
}`,
    explanation: "Finalizers are called by the GC finalizer thread in an unpredictable order — managed objects referenced from a finalizer may already have been collected; only access the specific native handle and avoid anything that could block.",
  },
  {
    id: "cs-b17-b2-volatile-keyword",
    language: "csharp",
    title: "volatile prevents caching of a field in a register",
    tag: "caveats",
    code: `using System.Threading;

class Worker
{
    private volatile bool _running = true;  // read from memory each time

    public void Stop() => _running = false;

    public void Run()
    {
        while (_running)   // without volatile, JIT may cache _running in register
        {
            // do work
        }
        Console.WriteLine("stopped");
    }
}

var w = new Worker();
Thread t = new Thread(w.Run);
t.Start();
Thread.Sleep(10);
w.Stop();
t.Join();`,
    explanation: "`volatile` prevents the JIT and CPU from caching a field value in a register across iterations — without it, a loop reading a bool that another thread sets to `false` might loop forever due to optimization.",
  },
  {
    id: "cs-b17-b2-decimal-suffix",
    language: "csharp",
    title: "Missing 'm' suffix turns decimal literal into double",
    tag: "caveats",
    code: `// Missing suffix: 0.1 is a double literal, loses precision:
decimal d1 = (decimal)0.1;   // 0.1000000000000000055511151231257827021181583404541015625M
Console.WriteLine(d1);

// With 'm' suffix: exact decimal literal:
decimal d2 = 0.1m;
Console.WriteLine(d2);       // 0.1

// Addition comparison:
Console.WriteLine(0.1m + 0.2m == 0.3m);     // True
Console.WriteLine((decimal)0.1 + (decimal)0.2 == 0.3m); // False`,
    explanation: "Without the `m` suffix, a decimal literal like `0.1` is parsed as a `double` and then converted to `decimal`, inheriting the float's rounding error — always use the `m` (or `M`) suffix for exact decimal literals.",
  },
  {
    id: "cs-b17-b2-foreach-modifying",
    language: "csharp",
    title: "Cannot modify collection inside foreach",
    tag: "caveats",
    code: `var list = new System.Collections.Generic.List<int> { 1, 2, 3, 4 };

// This throws InvalidOperationException: Collection was modified
try
{
    foreach (var item in list)
        if (item % 2 == 0) list.Remove(item);
}
catch (InvalidOperationException e)
{
    Console.WriteLine(e.Message);
}

// Fix: collect items to remove first, then remove:
var toRemove = list.Where(x => x % 2 == 0).ToList();
foreach (var item in toRemove) list.Remove(item);
Console.WriteLine(string.Join(", ", list));  // 1, 3`,
    explanation: "`foreach` holds an enumerator that tracks a version counter; any structural mutation (add, remove, clear) bumps the version and causes the enumerator's `MoveNext` to throw — collect changes first, apply after.",
  },
  // === types ===
  {
    id: "cs-b17-b2-generic-interface-constraint",
    language: "csharp",
    title: "Generic interface constraint enables member calls on T",
    tag: "types",
    code: `using System.Collections.Generic;

T Max<T>(IEnumerable<T> items) where T : IComparable<T>
{
    T max = default!;
    bool first = true;
    foreach (T item in items)
    {
        if (first || item.CompareTo(max) > 0)
        {
            max = item;
            first = false;
        }
    }
    return max;
}

Console.WriteLine(Max(new[] { 3, 1, 4, 1, 5 }));    // 5
Console.WriteLine(Max(new[] { "banana", "apple" })); // banana`,
    explanation: "Constraining `T : IComparable<T>` tells the compiler that `T` has a `CompareTo` method, allowing you to call it without casting — without the constraint the method body wouldn't compile.",
  },
  {
    id: "cs-b17-b2-interface-default-evolution",
    language: "csharp",
    title: "Interface default methods enable non-breaking evolution",
    tag: "types",
    code: `// Library v1:
interface ILogger { void Log(string msg); }

// Library v2 — adding a method WITHOUT breaking existing implementations:
interface ILogger2 : ILogger
{
    // Default implementation — existing classes inherit this for free:
    void LogWarning(string msg) => Log(\`[WARN] \${msg}\`);
}

class ConsoleLogger : ILogger2   // doesn't need to implement LogWarning
{
    public void Log(string msg) => Console.WriteLine(msg);
}

ILogger2 logger = new ConsoleLogger();
logger.Log("info");          // info
logger.LogWarning("watch");  // [WARN] watch`,
    explanation: "Interface default methods let library authors add new members without breaking existing implementors — the default provides a fallback behaviour that classes can override but don't have to.",
  },
  {
    id: "cs-b17-b2-ref-return",
    language: "csharp",
    title: "ref return lets you return a reference to a variable",
    tag: "types",
    code: `int[] data = [10, 20, 30, 40, 50];

ref int Find(int[] arr, int target)
{
    for (int i = 0; i < arr.Length; i++)
        if (arr[i] == target)
            return ref arr[i];   // return reference to element
    throw new InvalidOperationException("not found");
}

ref int slot = ref Find(data, 30);
slot = 999;   // modifies the original array element!
Console.WriteLine(data[2]);  // 999`,
    explanation: "`ref return` lets a method return a reference to a variable (array element, field) rather than a copy; the caller assigns to it via `ref var`, enabling safe in-place updates without indices or wrappers.",
  },
  {
    id: "cs-b17-b2-in-parameter",
    language: "csharp",
    title: "in parameter: pass by reference, read-only",
    tag: "types",
    code: `readonly struct LargeStruct { public double A, B, C, D; /* ... */ }

// in: pass by reference without copying, but cannot modify
double Process(in LargeStruct s)
{
    // s.A = 99;  // compile error — s is read-only
    return s.A + s.B;
}

var ls = new LargeStruct { A = 1, B = 2 };
double result = Process(in ls);   // 'in' keyword optional at call site`,
    explanation: "`in` passes a struct by reference to avoid copying, but the called method cannot modify it — useful for large read-only structs (> ~3 fields) where copying would be expensive.",
  },
  {
    id: "cs-b17-b2-checked-unchecked-context",
    language: "csharp",
    title: "Project-wide checked arithmetic with /checked compiler flag",
    tag: "types",
    code: `// Default: unchecked (silent wrap)
int max = int.MaxValue;
int wrapped = max + 1;            // -2147483648  — silent!

// Explicit checked expression:
int safe = checked(max + 1);      // OverflowException

// Checked block:
checked
{
    int a = int.MaxValue;
    int b = a + 1;                // OverflowException
}

// Explicitly unchecked in a checked project:
int forced = unchecked(max + 1); // -2147483648 even in checked context`,
    explanation: "The `checked` and `unchecked` keywords override the project-level arithmetic overflow behaviour for a specific expression or block — use `checked` defensively in security-sensitive numeric calculations.",
  },
  {
    id: "cs-b17-b2-generic-variance-ienumerable",
    language: "csharp",
    title: "IEnumerable<out T> covariance in practice",
    tag: "types",
    code: `IEnumerable<string> strings = new[] { "a", "b" };

// Covariance: IEnumerable<string> is assignable to IEnumerable<object>
// because IEnumerable<T> is declared with 'out T'
IEnumerable<object> objects = strings;   // OK at compile time

foreach (object o in objects)
    Console.WriteLine(o.GetType().Name);  // String

// Compare: List<T> is invariant — this fails:
// List<object> list = new List<string>();  // compile error`,
    explanation: "`IEnumerable<out T>` is covariant (can widen `T`); `IList<T>` is invariant (cannot), because `IList<T>` allows writing, which would break type safety if the list were widened.",
  },
  {
    id: "cs-b17-b2-optional-parameters",
    language: "csharp",
    title: "Optional parameters vs method overloads",
    tag: "types",
    code: `// Optional parameters — default values are baked into call sites:
void Connect(string host, int port = 8080, bool ssl = false)
    => Console.WriteLine(\`\${host}:\${port} ssl=\${ssl}\`);

Connect("localhost");              // localhost:8080 ssl=False
Connect("db.local", ssl: true);   // db.local:8080 ssl=True

// If you change the default from 8080 to 443, callers compiled against
// the OLD library STILL use 8080 until they recompile!
// Overloads don't have this problem — they call through to a common impl.`,
    explanation: "Optional parameter defaults are baked into the call site at compile time — changing a default in a library is a binary-breaking change unless callers recompile; overloads that delegate to a canonical implementation are safer for public APIs.",
  },
  {
    id: "cs-b17-b2-unmanaged-constraint",
    language: "csharp",
    title: "unmanaged generic constraint for interop",
    tag: "types",
    code: `using System.Runtime.InteropServices;

// unmanaged: T must be a value type with no managed references
unsafe T ReadStruct<T>(byte* ptr) where T : unmanaged
{
    return *(T*)ptr;
}

// unmanaged types: int, double, bool, struct with only unmanaged fields
// NOT: string, class, struct containing string

// Also enables Span/pointer operations:
Span<T> AsSpan<T>(T[] arr) where T : unmanaged
    => MemoryMarshal.Cast<byte, T>(arr.AsSpan().AsBytes());`,
    explanation: "The `unmanaged` constraint restricts `T` to value types that contain no managed references (no `string`, `object`, `class` fields), enabling unsafe pointer casts and P/Invoke interop patterns.",
  },
  {
    id: "cs-b17-b2-params-array",
    language: "csharp",
    title: "params array allows variable argument counts",
    tag: "types",
    code: `int Sum(params int[] nums)
{
    int total = 0;
    foreach (int n in nums) total += n;
    return total;
}

Console.WriteLine(Sum(1, 2, 3));         // 6
Console.WriteLine(Sum(1, 2, 3, 4, 5));  // 15
Console.WriteLine(Sum());                // 0

// Can also pass an array directly:
int[] arr = [10, 20, 30];
Console.WriteLine(Sum(arr));   // 60`,
    explanation: "`params T[]` lets callers pass zero or more arguments as a comma-separated list — the compiler packs them into an array; the caller can also explicitly pass an array without `params` syntax.",
  },
  {
    id: "cs-b17-b2-async-enumerable",
    language: "csharp",
    title: "IAsyncEnumerable<T> for async streaming sequences",
    tag: "types",
    code: `using System.Collections.Generic;
using System.Threading.Tasks;

async IAsyncEnumerable<int> StreamNumbers(int count)
{
    for (int i = 0; i < count; i++)
    {
        await Task.Delay(10);   // simulate async work
        yield return i;
    }
}

await foreach (int n in StreamNumbers(5))
    Console.Write(n + " ");   // 0 1 2 3 4`,
    explanation: "`IAsyncEnumerable<T>` combines generators with async: `yield return` inside an `async` method produces values asynchronously; consume with `await foreach` — ideal for streaming large datasets from databases or APIs.",
  },
  {
    id: "cs-b17-b2-enum-flags",
    language: "csharp",
    title: "Flags enum for bitwise combinations",
    tag: "types",
    code: `[Flags]
enum Permission
{
    None    = 0,
    Read    = 1,
    Write   = 2,
    Execute = 4,
    All     = Read | Write | Execute,
}

Permission user = Permission.Read | Permission.Write;
Console.WriteLine(user);                          // Read, Write
Console.WriteLine(user.HasFlag(Permission.Read)); // True
Console.WriteLine(user.HasFlag(Permission.Execute)); // False

user |= Permission.Execute;   // add execute
user &= ~Permission.Write;    // remove write
Console.WriteLine(user);      // Read, Execute`,
    explanation: "`[Flags]` enables bitwise composition of enum values; `HasFlag` tests membership, `|=` adds a flag, and `&= ~flag` removes one — the enum values must be powers of two for this to work correctly.",
  },
  // === families ===
  {
    id: "cs-b17-b2-task-whenall-whenany",
    language: "csharp",
    title: "Task.WhenAll vs Task.WhenAny",
    tag: "families",
    code: `using System.Threading.Tasks;
using System;

async Task<string> Fetch(string name, int delay)
{
    await Task.Delay(delay);
    return name;
}

// WhenAll: waits for ALL tasks to complete
string[] all = await Task.WhenAll(
    Fetch("A", 100), Fetch("B", 200), Fetch("C", 50));
Console.WriteLine(string.Join(", ", all));  // A, B, C (order preserved)

// WhenAny: returns the FIRST completed task
Task<string> winner = await Task.WhenAny(
    Fetch("slow", 500), Fetch("fast", 50));
Console.WriteLine(await winner);  // fast`,
    explanation: "`Task.WhenAll` runs all tasks concurrently and returns when the last one finishes; `Task.WhenAny` returns as soon as *any* task finishes (useful for timeouts — race a work task against `Task.Delay`).",
  },
  {
    id: "cs-b17-b2-channel-t",
    language: "csharp",
    title: "Channel<T> for async producer-consumer",
    tag: "families",
    code: `using System.Threading.Channels;
using System.Threading.Tasks;

// Unbounded channel (or use CreateBounded for backpressure):
Channel<int> ch = Channel.CreateUnbounded<int>();

Task producer = Task.Run(async () =>
{
    for (int i = 0; i < 5; i++)
        await ch.Writer.WriteAsync(i);
    ch.Writer.Complete();
});

Task consumer = Task.Run(async () =>
{
    await foreach (int item in ch.Reader.ReadAllAsync())
        Console.Write(item + " ");  // 0 1 2 3 4
});

await Task.WhenAll(producer, consumer);`,
    explanation: "`Channel<T>` is the modern async producer-consumer primitive — `Channel.CreateBounded(n)` adds backpressure; the reader supports `await foreach` via `ReadAllAsync()` which completes when the writer calls `Complete()`.",
  },
  {
    id: "cs-b17-b2-memory-vs-span",
    language: "csharp",
    title: "Span<T> vs Memory<T>: stack vs heap flexibility",
    tag: "families",
    code: `// Span<T>: stack-only — cannot be stored in class fields or cross await
Span<int> stackSpan = stackalloc int[4];
stackSpan.Fill(7);

// Memory<T>: heap-safe — can be stored and crossed await
Memory<int> heapMem = new int[4];
heapMem.Span.Fill(7);

// Converting between them:
ReadOnlySpan<int>   ros  = heapMem.Span;   // Memory -> Span (safe)
ReadOnlyMemory<int> rom  = heapMem;         // Memory -> ReadOnlyMemory

// Use Span for synchronous hot paths, Memory for async or stored views
async Task UseMemory(Memory<byte> m) { await Task.Delay(1); }`,
    explanation: "`Span<T>` is a ref struct limited to the stack, making it unsuitable for async or class fields but giving zero overhead access; `Memory<T>` is a normal struct that can go anywhere but incurs a small indirection.",
  },
  {
    id: "cs-b17-b2-options-pattern",
    language: "csharp",
    title: "IOptions<T> family for configuration injection",
    tag: "families",
    code: `using Microsoft.Extensions.Options;

class AppSettings { public string ApiUrl { get; set; } = ""; }

// IOptions<T>: singleton, value never changes after startup
void UseStatic(IOptions<AppSettings> opts)
    => Console.WriteLine(opts.Value.ApiUrl);

// IOptionsSnapshot<T>: scoped, re-reads per request
void UsePerRequest(IOptionsSnapshot<AppSettings> opts)
    => Console.WriteLine(opts.Value.ApiUrl);

// IOptionsMonitor<T>: singleton, watches for file changes
void UseMonitor(IOptionsMonitor<AppSettings> opts)
{
    Console.WriteLine(opts.CurrentValue.ApiUrl);
    opts.OnChange(s => Console.WriteLine("changed: " + s.ApiUrl));
}`,
    explanation: "`IOptions<T>` is a singleton (fixed at startup); `IOptionsSnapshot<T>` is scoped (re-reads per DI scope, useful for per-request config in ASP.NET Core); `IOptionsMonitor<T>` is a singleton that reacts to configuration file changes.",
  },
  {
    id: "cs-b17-b2-di-service-lifetimes",
    language: "csharp",
    title: "DI service lifetimes: Singleton, Scoped, Transient",
    tag: "families",
    code: `using Microsoft.Extensions.DependencyInjection;

var services = new ServiceCollection();

// Singleton: one instance for the application lifetime
services.AddSingleton<ILogger, ConsoleLogger>();

// Scoped: one instance per request/scope
services.AddScoped<IRepository, SqlRepository>();

// Transient: new instance every time it's injected
services.AddTransient<IEmailSender, SmtpEmailSender>();

// WARNING: never inject a Scoped service into a Singleton —
// the Scoped service becomes a de-facto singleton (captive dependency)`,
    explanation: "Singleton lives for the app lifetime; Scoped lives per request/scope; Transient is created fresh each injection — injecting a shorter-lived service into a longer-lived one makes it last as long as the container, a 'captive dependency' bug.",
  },
  {
    id: "cs-b17-b2-http-client-factory",
    language: "csharp",
    title: "IHttpClientFactory vs new HttpClient()",
    tag: "families",
    code: `// BAD: new HttpClient per request — socket exhaustion, DNS staleness
using var bad = new HttpClient();

// GOOD: use factory (manages connection pool lifecycle)
// In DI container:
// services.AddHttpClient();
// services.AddHttpClient("github", c => c.BaseAddress = new Uri("https://api.github.com"));

// In a service:
class MyService(IHttpClientFactory factory)
{
    async Task<string> GetAsync()
    {
        using HttpClient client = factory.CreateClient("github");
        return await client.GetStringAsync("/");
    }
}`,
    explanation: "`IHttpClientFactory` manages a pool of `HttpMessageHandler` objects with proper lifecycle — creating a new `HttpClient` per request keeps sockets alive past their timeout and doesn't respect DNS TTL updates.",
  },
  {
    id: "cs-b17-b2-result-pattern",
    language: "csharp",
    title: "Result<T, E> pattern: return errors as values",
    tag: "families",
    code: `readonly record struct Result<T, E>
{
    private readonly T? _value;
    private readonly E? _error;
    public bool IsSuccess { get; }

    private Result(T value) { _value = value; IsSuccess = true; _error = default; }
    private Result(E error) { _error = error; IsSuccess = false; _value = default; }

    public static Result<T, E> Ok(T v)  => new(v);
    public static Result<T, E> Err(E e) => new(e);

    public T Value => IsSuccess ? _value! : throw new InvalidOperationException();
    public E Error => !IsSuccess ? _error! : throw new InvalidOperationException();
}

Result<int, string> Parse(string s)
    => int.TryParse(s, out int n) ? Result<int, string>.Ok(n) : Result<int, string>.Err(\`'{s}' is not a number\`);

var r = Parse("42");
if (r.IsSuccess) Console.WriteLine(r.Value);`,
    explanation: "The Result pattern returns errors as values instead of throwing exceptions, making error paths explicit in the type system and enabling callers to handle errors without try/catch — popular in functional-style C# with libraries like LanguageExt or ErrorOr.",
  },
  // === classes ===
  {
    id: "cs-b17-b2-virtual-override-new",
    language: "csharp",
    title: "virtual/override vs new: polymorphism vs hiding",
    tag: "classes",
    code: `class Animal
{
    public virtual string Sound() => "...";
    public string Name() => "Animal";         // not virtual
}

class Dog : Animal
{
    public override string Sound() => "Woof";  // polymorphic
    public new string Name() => "Dog";          // hides, not overrides
}

Animal a = new Dog();
Console.WriteLine(a.Sound());  // Woof — virtual dispatch
Console.WriteLine(a.Name());   // Animal — 'new' doesn't affect base ref`,
    explanation: "`override` participates in virtual dispatch — the runtime calls the most-derived override regardless of the reference type; `new` hides the base method and is only reachable through a reference of the declaring class's type.",
  },
  {
    id: "cs-b17-b2-abstract-sealed-override",
    language: "csharp",
    title: "abstract + sealed override — force a single implementation",
    tag: "classes",
    code: `abstract class Base
{
    public abstract void M();
}

class Middle : Base
{
    public sealed override void M()   // sealed: no further override
    {
        Console.WriteLine("Middle.M");
    }
}

class Leaf : Middle
{
    // public override void M() { }  // compile error — sealed!
}

Base b = new Leaf();
b.M();   // Middle.M`,
    explanation: "`sealed override` locks a virtual method at a specific level of the hierarchy — the JIT can devirtualize calls through `Middle` references and subclasses can't accidentally break the invariant by overriding.",
  },
  {
    id: "cs-b17-b2-constructor-chaining",
    language: "csharp",
    title: "Constructor chaining with this() and base()",
    tag: "classes",
    code: `class Connection
{
    public string Host { get; }
    public int Port { get; }
    public bool Ssl { get; }

    public Connection(string host, int port, bool ssl)
    {
        Host = host; Port = port; Ssl = ssl;
    }

    // Chain to canonical ctor — avoids duplicating assignment logic:
    public Connection(string host) : this(host, 443, true) { }
    public Connection(string host, int port) : this(host, port, false) { }
}

class SecureConnection : Connection
{
    public SecureConnection(string host) : base(host, 443, true) { }
}`,
    explanation: "`this(...)` chains to another constructor in the same class before the body runs; `base(...)` chains to the base class constructor — both are idiomatic alternatives to `static Create(...)` factories for overloaded initialization.",
  },
  {
    id: "cs-b17-b2-object-initializer",
    language: "csharp",
    title: "Object initializer syntax and nested initialization",
    tag: "classes",
    code: `class Address { public string Street { get; set; } = ""; public string City { get; set; } = ""; }
class Person
{
    public string Name { get; set; } = "";
    public int Age { get; set; }
    public Address Home { get; set; } = new();
    public List<string> Tags { get; set; } = new();
}

var p = new Person
{
    Name = "Alice",
    Age  = 30,
    Home = { City = "NY", Street = "5th Ave" },  // nested — modifies existing object
    Tags = { "admin", "user" },                   // collection initializer
};

Console.WriteLine(p.Home.City);  // NY`,
    explanation: "Object initializers with a nested `{ }` (no `new` keyword) *modify* the existing object (set in the constructor) rather than replacing it; collection initializers call `Add` on the already-constructed collection.",
  },
  {
    id: "cs-b17-b2-protected-internal",
    language: "csharp",
    title: "Access modifiers: protected internal and private protected",
    tag: "classes",
    code: `class Base
{
    protected internal int A = 1;    // same assembly OR derived class anywhere
    private protected int B = 2;     // same assembly AND derived class only
    protected int C = 3;             // derived class only (any assembly)
    internal int D = 4;              // same assembly only
}

class Derived : Base
{
    void Demo()
    {
        _ = A;  // OK — derived class
        _ = B;  // OK — derived class in same assembly
        _ = C;  // OK — derived class
        _ = D;  // OK — same assembly
    }
}`,
    explanation: "`protected internal` is the union (OR) of protected and internal; `private protected` is the intersection (AND) — only accessible from derived classes within the same assembly, more restrictive than either alone.",
  },
  {
    id: "cs-b17-b2-indexer",
    language: "csharp",
    title: "Indexer: custom [] operator for a class",
    tag: "classes",
    code: `class SparseMatrix
{
    private readonly Dictionary<(int, int), double> _data = new();

    public double this[int row, int col]
    {
        get => _data.GetValueOrDefault((row, col), 0.0);
        set
        {
            if (value == 0.0) _data.Remove((row, col));
            else _data[(row, col)] = value;
        }
    }
}

var m = new SparseMatrix();
m[0, 0] = 1.5;
m[2, 3] = -4.0;
Console.WriteLine(m[0, 0]);   // 1.5
Console.WriteLine(m[1, 1]);   // 0   (default)`,
    explanation: "An indexer `this[params]` overloads the `[]` operator for a class, making it usable like an array — it can take any parameter types and count, enabling domain-specific subscript semantics.",
  },
  {
    id: "cs-b17-b2-partial-method",
    language: "csharp",
    title: "partial method: optional hook between generator and user code",
    tag: "classes",
    code: `// Generated file (e.g., by a code generator):
partial class MyModel
{
    partial void OnNameChanging(string value);   // hook declaration

    private string _name = "";
    public string Name
    {
        get => _name;
        set { OnNameChanging(value); _name = value; }
    }
}

// User-written file — only implement if you need the hook:
partial class MyModel
{
    partial void OnNameChanging(string value)
    {
        if (string.IsNullOrEmpty(value))
            throw new ArgumentException("name cannot be empty");
    }
}`,
    explanation: "A `partial void` method declaration in a generated file can be implemented (or not) in user code; if not implemented, the compiler removes the call entirely — zero overhead when unused.",
  },
  {
    id: "cs-b17-b2-record-equality",
    language: "csharp",
    title: "Record equality is value-based and auto-generated",
    tag: "classes",
    code: `record Point(int X, int Y);

var a = new Point(1, 2);
var b = new Point(1, 2);
var c = new Point(3, 4);

Console.WriteLine(a == b);   // True  — value equality
Console.WriteLine(a == c);   // False
Console.WriteLine(a.Equals(b)); // True

// GetHashCode is also value-based:
var dict = new Dictionary<Point, string>
{
    [new Point(1, 2)] = "found"
};
Console.WriteLine(dict[a]);  // found — a == new Point(1, 2)`,
    explanation: "Records auto-generate `Equals`, `GetHashCode`, and `==`/`!=` based on all positional parameters — so two different instances with the same field values are considered equal, unlike class instances which default to reference equality.",
  },
  {
    id: "cs-b17-b2-interface-readonly-property",
    language: "csharp",
    title: "Interface with get-only property vs init-only",
    tag: "classes",
    code: `interface IReadable
{
    string Name { get; }           // implementor chooses — can have a setter
}

interface IInitializable
{
    string Name { get; init; }     // only settable during initialization
}

class Widget : IReadable, IInitializable
{
    public string Name { get; init; } = "";  // satisfies both
}

var w = new Widget { Name = "button" };
// w.Name = "other";  // compile error — init-only after construction`,
    explanation: "A `get;`-only interface property can be satisfied by a class with `{ get; set; }` (the setter is just not exposed through the interface); `init;` in an interface restricts implementors to init-only setters.",
  },
];
