import type { Snippet } from "./types";

export const csharpSnippets20260517B1: Snippet[] = [
  // === snippet ===
  {
    id: "cs-b17-b1-linq-select-index",
    language: "csharp",
    title: "LINQ Select with element index",
    tag: "snippet",
    code: `using System.Linq;

string[] fruits = ["apple", "banana", "cherry"];

// Overload of Select that provides the index
var numbered = fruits.Select((fruit, i) => \`\${i + 1}. {fruit}\`);

foreach (var s in numbered)
    Console.WriteLine(s);
// 1. apple
// 2. banana
// 3. cherry`,
    explanation: "The two-argument overload of `Select((element, index) => ...)` lets you use the element's zero-based position without a separate counter variable.",
  },
  {
    id: "cs-b17-b1-string-interp-format",
    language: "csharp",
    title: "String interpolation with format specifiers",
    tag: "snippet",
    code: `double pi = Math.PI;
decimal price = 1234.5m;
DateTime now = DateTime.Now;

Console.WriteLine(\`\${pi:F4}\`);          // 3.1416
Console.WriteLine(\`\${price:C}\`);         // $1,234.50 (culture-dependent)
Console.WriteLine(\`\${price:N2}\`);        // 1,234.50
Console.WriteLine(\`\${now:yyyy-MM-dd}\`);  // 2026-05-17
Console.WriteLine(\`\${42,10}\`);           // right-align in width 10`,
    explanation: "Inside an interpolated string, a colon after the expression introduces a standard format string (same as `String.Format` specifiers) — alignment comes before the colon as `,width`.",
  },
  {
    id: "cs-b17-b1-switch-expression",
    language: "csharp",
    title: "switch expression for concise pattern dispatch",
    tag: "snippet",
    code: `string Describe(object obj) => obj switch
{
    int n when n < 0  => "negative int",
    int n             => \`positive int: \${n}\`,
    string s          => \`string of length \${s.Length}\`,
    null              => "null",
    _                 => \`other: \${obj.GetType().Name}\`,
};

Console.WriteLine(Describe(-5));     // negative int
Console.WriteLine(Describe("hi"));   // string of length 2
Console.WriteLine(Describe(3.14));   // other: Double`,
    explanation: "A switch expression evaluates to a value and is exhaustive (the compiler enforces a `_` arm or proves all cases are covered); each arm uses `=>` instead of `case:` / `break`.",
  },
  {
    id: "cs-b17-b1-target-typed-new",
    language: "csharp",
    title: "Target-typed new() omits the type name",
    tag: "snippet",
    code: `using System.Collections.Generic;

// Without target-typed new:
List<string> names1 = new List<string>();

// With target-typed new (type inferred from left side):
List<string> names2 = new();
Dictionary<string, int> scores = new();

// Works in field initializers and return statements too:
class Config
{
    public List<string> Tags { get; } = new();
}`,
    explanation: "Target-typed `new()` infers the type from the left-hand side of an assignment or a declared return type, eliminating type-name repetition while remaining explicit about the variable type.",
  },
  {
    id: "cs-b17-b1-with-expression-record",
    language: "csharp",
    title: "with expression creates a modified copy of a record",
    tag: "snippet",
    code: `record Point(double X, double Y);

var origin = new Point(0, 0);
var shifted = origin with { X = 3, Y = 4 };

Console.WriteLine(origin);   // Point { X = 0, Y = 0 }
Console.WriteLine(shifted);  // Point { X = 3, Y = 4 }
Console.WriteLine(ReferenceEquals(origin, shifted)); // False — new object`,
    explanation: "The `with` expression produces a *new* record instance that copies all properties from the original and then overwrites the listed ones — records remain immutable while mutation-like syntax stays readable.",
  },
  {
    id: "cs-b17-b1-collection-expression",
    language: "csharp",
    title: "Collection expressions (C# 12)",
    tag: "snippet",
    code: `// Bracket syntax for collection literals (C# 12):
int[] nums = [1, 2, 3, 4, 5];
List<string> words = ["hello", "world"];

// Spread operator .. merges collections:
int[] a = [1, 2, 3];
int[] b = [4, 5, 6];
int[] merged = [..a, ..b];           // [1, 2, 3, 4, 5, 6]
int[] extended = [0, ..a, 99];       // [0, 1, 2, 3, 99]`,
    explanation: "C# 12 collection expressions unify array/list initialization into a single `[...]` syntax and add a `..spread` operator for inline concatenation, similar to JavaScript's spread syntax.",
  },
  {
    id: "cs-b17-b1-using-declaration",
    language: "csharp",
    title: "using declaration disposes at end of scope",
    tag: "snippet",
    code: `using System.IO;

void ProcessFile(string path)
{
    using var reader = new StreamReader(path);  // disposed at }
    using var writer = new StreamWriter(path + ".out");

    string? line;
    while ((line = reader.ReadLine()) is not null)
        writer.WriteLine(line.ToUpper());
}   // both reader and writer disposed here automatically`,
    explanation: "A `using var` declaration disposes the resource when control leaves the enclosing scope, avoiding the extra nesting level of a `using (var x = ...) { }` statement.",
  },
  {
    id: "cs-b17-b1-index-from-end",
    language: "csharp",
    title: "^ index-from-end operator",
    tag: "snippet",
    code: `int[] arr = [10, 20, 30, 40, 50];

Console.WriteLine(arr[^1]);   // 50  (last element)
Console.WriteLine(arr[^2]);   // 40  (second to last)

// Combined with range:
Console.WriteLine(string.Join(", ", arr[^3..]));  // 30, 40, 50
Console.WriteLine(string.Join(", ", arr[1..^1])); // 20, 30, 40`,
    explanation: "The `^n` index counts from the end of the collection: `^1` is the last element, `^2` is second-to-last — combine with `..` to create ranges without computing `Length - n` manually.",
  },
  {
    id: "cs-b17-b1-range-operator",
    language: "csharp",
    title: "Range operator .. for slicing",
    tag: "snippet",
    code: `string s = "Hello, World!";

Console.WriteLine(s[0..5]);    // Hello
Console.WriteLine(s[7..]);     // World!
Console.WriteLine(s[..5]);     // Hello
Console.WriteLine(s[^6..^1]);  // World

// Works on arrays and Span<T> too:
int[] data = [1, 2, 3, 4, 5];
var slice = data[1..4];   // new array [2, 3, 4]`,
    explanation: "The `..` range operator creates a `Range` struct that arrays, strings, and `Span<T>` use for slicing — start is inclusive, end is exclusive, and either side is optional.",
  },
  {
    id: "cs-b17-b1-null-coalescing-assign",
    language: "csharp",
    title: "??= assigns only when the target is null",
    tag: "snippet",
    code: `string? name = null;

// Without ??=:
if (name is null) name = "default";

// With ??=:
name ??= "default";
Console.WriteLine(name);   // default

name ??= "other";          // name already has a value — no-op
Console.WriteLine(name);   // default

// Useful for lazy initialization:
List<int>? _cache;
List<int> Cache => _cache ??= new List<int>();`,
    explanation: "`??=` assigns the right-hand side to the variable only when the variable is currently `null`, enabling concise lazy initialization without an explicit null check.",
  },
  {
    id: "cs-b17-b1-nameof-operator",
    language: "csharp",
    title: "nameof() produces the compile-time name of a symbol",
    tag: "snippet",
    code: `class Person
{
    public string Name { get; set; } = "";

    public void Validate()
    {
        if (string.IsNullOrEmpty(Name))
            throw new ArgumentException(
                "Value cannot be empty",
                paramName: nameof(Name));   // refactor-safe: "Name"
    }
}

// nameof works on methods, types, parameters too:
Console.WriteLine(nameof(Console.WriteLine));  // WriteLine
Console.WriteLine(nameof(List<int>));          // List`,
    explanation: "`nameof(symbol)` is evaluated at compile time to a string containing the unqualified name, so it stays correct through refactoring — far safer than hard-coded string literals in argument names and logging.",
  },
  {
    id: "cs-b17-b1-is-not-null",
    language: "csharp",
    title: "is not null pattern for null checks",
    tag: "snippet",
    code: `string? GetName() => null;

string? name = GetName();

// Old style:
if (name != null) Console.WriteLine(name.Length);

// Pattern style — also works in complex conditions:
if (name is not null)
    Console.WriteLine(name.Length);

// Negation pattern with type:
object? obj = "hello";
if (obj is string s and not null)
    Console.WriteLine(s.ToUpper());`,
    explanation: "`is not null` is a pattern-matching null check that composes cleanly with other patterns using `and`/`or`; unlike `!= null`, it's immune to operator overloading of `!=`.",
  },
  {
    id: "cs-b17-b1-math-clamp",
    language: "csharp",
    title: "Math.Clamp constrains a value to a range",
    tag: "snippet",
    code: `int volume = 150;
int clamped = Math.Clamp(volume, 0, 100);
Console.WriteLine(clamped);   // 100

double t = -0.5;
double normalized = Math.Clamp(t, 0.0, 1.0);
Console.WriteLine(normalized);  // 0

// Generic overloads for any INumber<T> in .NET 7+:
short s = Math.Clamp((short)200, (short)0, (short)127);`,
    explanation: "`Math.Clamp(value, min, max)` returns `min` if value is below, `max` if above, or the value itself if in range — cleaner than `Math.Min(max, Math.Max(min, value))`.",
  },
  {
    id: "cs-b17-b1-enumerable-range",
    language: "csharp",
    title: "Enumerable.Range and Enumerable.Repeat",
    tag: "snippet",
    code: `using System.Linq;

// Range(start, count):
var squares = Enumerable.Range(1, 5).Select(n => n * n);
Console.WriteLine(string.Join(", ", squares));  // 1, 4, 9, 16, 25

// Repeat(element, count):
var zeros = Enumerable.Repeat(0, 4).ToList();
Console.WriteLine(string.Join(", ", zeros));    // 0, 0, 0, 0

// Empty<T>():
var empty = Enumerable.Empty<string>();
Console.WriteLine(empty.Count());  // 0`,
    explanation: "`Enumerable.Range` generates a lazy integer sequence; `Enumerable.Repeat` generates a lazy sequence of one repeated value — both avoid allocating an array up front.",
  },
  {
    id: "cs-b17-b1-string-create",
    language: "csharp",
    title: "string.Create for zero-copy string building",
    tag: "snippet",
    code: `// Build a fixed-length string without intermediate allocations:
int value = 42;
string hex = string.Create(4, value, (span, v) =>
{
    span[0] = '0';
    span[1] = 'x';
    v.ToString("X2").AsSpan().CopyTo(span[2..]);
});

Console.WriteLine(hex);  // 0x2A

// vs. $"0x{value:X2}" — same result but string.Create avoids boxing`,
    explanation: "`string.Create(length, state, action)` allocates the result string once and lets you fill it via a `Span<char>` callback, eliminating intermediate strings or `StringBuilder` for fixed-layout output.",
  },
  // === understanding ===
  {
    id: "cs-b17-b1-captured-loop-var",
    language: "csharp",
    title: "Loop variable captured by lambda — classic bug",
    tag: "understanding",
    code: `using System.Collections.Generic;

var actions = new List<Action>();
for (int i = 0; i < 3; i++)
    actions.Add(() => Console.Write(i + " "));   // captures variable i

foreach (var a in actions) a();
// 3 3 3  — all lambdas share the SAME i after loop ends

// Fix: copy into a local inside the loop
var actions2 = new List<Action>();
for (int i = 0; i < 3; i++)
{ int copy = i; actions2.Add(() => Console.Write(copy + " ")); }

foreach (var a in actions2) a();   // 0 1 2`,
    explanation: "C# lambdas close over the *variable*, not its value at capture time; when multiple lambdas share the same loop variable they all see its final value after the loop completes.",
  },
  {
    id: "cs-b17-b1-async-void-exception",
    language: "csharp",
    title: "async void swallows exceptions — use async Task",
    tag: "understanding",
    code: `// async void: exception crashes the process — NOT catchable here
async void BadHandler()
{
    await Task.Delay(10);
    throw new InvalidOperationException("kaboom");
}

// async Task: exception is stored and re-thrown on await
async Task GoodHandler()
{
    await Task.Delay(10);
    throw new InvalidOperationException("catchable");
}

// await GoodHandler() can be wrapped in try/catch
// BadHandler() cannot — the exception goes to the thread pool`,
    explanation: "`async void` was designed only for event handlers where a `Task` return is impossible; exceptions it throws are posted to `SynchronizationContext` and often terminate the process — always use `async Task` for anything awaitable.",
  },
  {
    id: "cs-b17-b1-struct-copy",
    language: "csharp",
    title: "Structs are copied on assignment — not aliased",
    tag: "understanding",
    code: `struct Point { public int X; public int Y; }

Point a = new Point { X = 1, Y = 2 };
Point b = a;   // copy — b is a separate value
b.X = 99;

Console.WriteLine(a.X);  // 1  — a is unchanged
Console.WriteLine(b.X);  // 99

// Compare with class (reference type):
class PointClass { public int X; public int Y; }
PointClass r = new() { X = 1, Y = 2 };
PointClass s = r;   // both point to same object
s.X = 99;
Console.WriteLine(r.X);  // 99  — r was changed through s`,
    explanation: "Structs have value semantics: assignment copies the entire struct value, so modifying one copy doesn't affect others — the opposite of class reference semantics where assignment copies the reference.",
  },
  {
    id: "cs-b17-b1-double-nan",
    language: "csharp",
    title: "double.NaN comparisons always return false",
    tag: "understanding",
    code: `double nan = double.NaN;

Console.WriteLine(nan == nan);   // False
Console.WriteLine(nan != nan);   // True
Console.WriteLine(nan < 1);      // False
Console.WriteLine(nan > 1);      // False

// Correct test:
Console.WriteLine(double.IsNaN(nan));   // True

// NaN breaks sorting:
double[] data = [3.0, double.NaN, 1.0];
Array.Sort(data);   // result is implementation-defined with NaN`,
    explanation: "IEEE 754 mandates that NaN is not equal to any value including itself; use `double.IsNaN()` for detection and sanitize NaN before sorting or comparison-based algorithms.",
  },
  {
    id: "cs-b17-b1-int-overflow-unchecked",
    language: "csharp",
    title: "Integer overflow wraps silently in unchecked context",
    tag: "understanding",
    code: `int max = int.MaxValue;   // 2147483647

// Default (unchecked) — wraps silently:
int wrapped = max + 1;
Console.WriteLine(wrapped);    // -2147483648  (int.MinValue)

// checked — throws OverflowException:
try
{
    int boom = checked(max + 1);
}
catch (OverflowException e)
{
    Console.WriteLine(e.Message);  // Arithmetic operation resulted in overflow
}`,
    explanation: "C# integer arithmetic silently wraps on overflow by default (like C); wrap expressions in `checked(...)` or a `checked { }` block to get an `OverflowException` instead — or use `long`/`ulong` for larger values.",
  },
  {
    id: "cs-b17-b1-char-arithmetic",
    language: "csharp",
    title: "char arithmetic: chars are ushort under the hood",
    tag: "understanding",
    code: `char c = 'A';
Console.WriteLine((int)c);         // 65
Console.WriteLine(c + 1);          // 66  — result is int, not char!
Console.WriteLine((char)(c + 1));  // B

// Convert digit char to int:
char digit = '7';
int value = digit - '0';           // 7

// Iterate the alphabet:
for (char ch = 'a'; ch <= 'z'; ch++)
    Console.Write(ch);  // abcdefghijklmnopqrstuvwxyz`,
    explanation: "`char` is an unsigned 16-bit integer in C#; arithmetic on chars widens to `int`, so you must cast back to `char` — but you can do direct arithmetic like `'A' + n` or `ch - 'a'` for index calculations.",
  },
  {
    id: "cs-b17-b1-ternary-null-type",
    language: "csharp",
    title: "Ternary type inference with null literal",
    tag: "understanding",
    code: `// Both branches must share a common type:
bool flag = true;

// OK — both are string or null (string?):
string? s = flag ? "yes" : null;

// OK — int? picks up null:
int? n = flag ? 42 : null;

// Error: int and string have no common type
// var x = flag ? 42 : "hello";  // CS0173

// null! surpresses nullable warning when you are sure:
string guaranteed = flag ? "yes" : null!;`,
    explanation: "The compiler infers the ternary result type as the best common type of both branches; `null` by itself has no type, so the other branch's type is used — which must be nullable.",
  },
  {
    id: "cs-b17-b1-delegate-null-invoke",
    language: "csharp",
    title: "Safe delegate invocation with ?. operator",
    tag: "understanding",
    code: `event Action? OnChanged;

// Old pattern — race condition possible:
if (OnChanged != null)
    OnChanged();    // another thread could set it to null here

// Safe pattern — captures a local copy:
OnChanged?.Invoke();

// Why ?.Invoke() is safe:
// 1. Copies the delegate reference to a local
// 2. Tests the local (not the field)
// 3. Invokes if non-null — no race`,
    explanation: "`handler?.Invoke()` captures the delegate reference atomically before null-checking it, eliminating the TOCTOU race that exists in the `if (handler != null) handler()` pattern.",
  },
  {
    id: "cs-b17-b1-ref-vs-out",
    language: "csharp",
    title: "ref vs out: pre-initialization requirements",
    tag: "understanding",
    code: `void DoubleRef(ref int x) { x *= 2; }   // must be initialized before call
void ParseOut(string s, out int result)  // caller doesn't need to init
{
    result = int.Parse(s);   // must assign before returning
}

int a = 5;
DoubleRef(ref a);
Console.WriteLine(a);   // 10

ParseOut("42", out int b);
Console.WriteLine(b);   // 42

// out is typically used for Try-parse patterns:
bool ok = int.TryParse("99", out int c);`,
    explanation: "`ref` requires the argument to be definitely assigned by the caller and the parameter can be read before written; `out` requires the callee to definitely assign the parameter before the method returns.",
  },
  {
    id: "cs-b17-b1-value-type-default",
    language: "csharp",
    title: "Value types default to zero; references default to null",
    tag: "understanding",
    code: `int i = default;        // 0
bool b = default;       // false
double d = default;     // 0.0
char c = default;       // '\\0'

// Reference type:
string? s = default;    // null

// Struct:
struct Point { public int X, Y; }
Point p = default;      // X=0, Y=0

// Generic default:
T GetDefault<T>() => default(T)!;
Console.WriteLine(GetDefault<int>());    // 0`,
    explanation: "The `default` literal (or `default(T)` expression) produces zero-bits for value types (zero, false, null char) and `null` for reference types — useful in generic code and field initialization.",
  },
  {
    id: "cs-b17-b1-string-ref-equals",
    language: "csharp",
    title: "string == uses value equality, not reference equality",
    tag: "understanding",
    code: `string a = "hello";
string b = "hello";
string c = new string("hello".ToCharArray());  // force new object

Console.WriteLine(a == b);                     // True  — value equal
Console.WriteLine(a == c);                     // True  — value equal
Console.WriteLine(ReferenceEquals(a, b));      // True  — interned
Console.WriteLine(ReferenceEquals(a, c));      // False — different object

// object.Equals falls back to reference for unknown types:
object oa = a;
object oc = c;
Console.WriteLine(oa == oc);  // True — string's == overrides`,
    explanation: "`string` overloads `==` and `!=` to compare content, so `==` is always a value comparison regardless of whether the strings are the same interned object.",
  },
  {
    id: "cs-b17-b1-checked-keyword",
    language: "csharp",
    title: "checked block enables overflow detection",
    tag: "understanding",
    code: `byte b = 255;

// unchecked (default) — wraps:
byte wrapped = (byte)(b + 1);
Console.WriteLine(wrapped);  // 0

// checked — throws:
try
{
    checked
    {
        byte boom = (byte)(b + 1);
    }
}
catch (OverflowException)
{
    Console.WriteLine("overflow detected");
}`,
    explanation: "The `checked` block (or `checked()` expression) switches the current scope to overflow-checking mode; use it around security-sensitive arithmetic where silent wrap-around would be a vulnerability.",
  },
  {
    id: "cs-b17-b1-stringbuilder-vs-concat",
    language: "csharp",
    title: "StringBuilder vs string concatenation in loops",
    tag: "understanding",
    code: `using System.Text;

// String concat in loop: O(n²) — new allocation each iteration
string bad = "";
for (int i = 0; i < 10_000; i++)
    bad += "x";   // each += creates a new string!

// StringBuilder: O(n) — amortized array growth
var sb = new StringBuilder();
for (int i = 0; i < 10_000; i++)
    sb.Append('x');
string good = sb.ToString();`,
    explanation: "Every string concatenation in a loop creates a new string object containing all previous characters plus the new ones; `StringBuilder` maintains a mutable char buffer and copies only at `ToString()`, giving O(n) vs O(n²) performance.",
  },
  {
    id: "cs-b17-b1-null-conditional-chain",
    language: "csharp",
    title: "?. null-conditional short-circuits the whole chain",
    tag: "understanding",
    code: `class Order { public Customer? Customer { get; set; } }
class Customer { public Address? Address { get; set; } }
class Address { public string City { get; set; } = ""; }

Order? order = null;

// Without ?. — NullReferenceException:
// string city = order.Customer.Address.City;

// With ?.  — entire chain returns null if any link is null:
string? city = order?.Customer?.Address?.City;
Console.WriteLine(city ?? "unknown");   // unknown`,
    explanation: "The `?.` operator short-circuits to `null` when the left operand is `null`, avoiding NullReferenceExceptions in deep property chains without nested null checks.",
  },
  // === structures ===
  {
    id: "cs-b17-b1-list-vs-linkedlist",
    language: "csharp",
    title: "List<T> vs LinkedList<T>: access patterns",
    tag: "structures",
    code: `using System.Collections.Generic;

// List<T>: array-backed, O(1) index, O(n) insert at front
var list = new List<int> { 1, 2, 3 };
list.Insert(0, 0);   // O(n) — shifts all elements

// LinkedList<T>: doubly-linked, O(1) insert/remove at known node
var ll = new LinkedList<int>(new[] { 1, 2, 3 });
var node = ll.First!;
ll.AddBefore(node, 0);   // O(1) given a LinkedListNode
Console.WriteLine(string.Join(", ", ll));  // 0, 1, 2, 3`,
    explanation: "`List<T>` gives O(1) random access and good cache locality; `LinkedList<T>` gives O(1) insertion/deletion when you hold a `LinkedListNode` but O(n) access by index — choose based on your dominant operation.",
  },
  {
    id: "cs-b17-b1-dict-vs-sorteddict",
    language: "csharp",
    title: "Dictionary vs SortedDictionary vs SortedList",
    tag: "structures",
    code: `var dict   = new Dictionary<string, int>();    // O(1) hash, unordered
var sorted = new SortedDictionary<string, int>(); // O(log n) tree, ordered
var sl     = new SortedList<string, int>();         // O(log n) array, ordered

dict["b"] = 2; dict["a"] = 1;
sorted["b"] = 2; sorted["a"] = 1;
sl["b"] = 2; sl["a"] = 1;

Console.WriteLine(string.Join(", ", dict.Keys));    // b, a  (unordered)
Console.WriteLine(string.Join(", ", sorted.Keys));  // a, b
Console.WriteLine(string.Join(", ", sl.Keys));      // a, b`,
    explanation: "`SortedDictionary` uses a red-black tree (better for frequent inserts/deletes); `SortedList` uses a sorted array (better for enumeration and index access, worse for inserts); `Dictionary` is fastest when order doesn't matter.",
  },
  {
    id: "cs-b17-b1-hashset-vs-sortedset",
    language: "csharp",
    title: "HashSet<T> vs SortedSet<T>",
    tag: "structures",
    code: `var hash   = new HashSet<int> { 3, 1, 4, 1, 5, 9 };
var sorted = new SortedSet<int> { 3, 1, 4, 1, 5, 9 };

Console.WriteLine(string.Join(", ", hash));    // 3, 1, 4, 5, 9  (order undefined)
Console.WriteLine(string.Join(", ", sorted));  // 1, 3, 4, 5, 9  (sorted)

// SortedSet supports range queries:
Console.WriteLine(string.Join(", ", sorted.GetViewBetween(3, 6)));  // 3, 4, 5`,
    explanation: "`HashSet<T>` offers O(1) add/remove/contains via hashing; `SortedSet<T>` uses a balanced BST for O(log n) operations but keeps elements sorted and supports `GetViewBetween` range queries.",
  },
  {
    id: "cs-b17-b1-queue-stack",
    language: "csharp",
    title: "Queue<T> (FIFO) vs Stack<T> (LIFO)",
    tag: "structures",
    code: `var queue = new Queue<string>();
queue.Enqueue("first");
queue.Enqueue("second");
Console.WriteLine(queue.Dequeue());  // first (FIFO)
Console.WriteLine(queue.Peek());     // second (doesn't remove)

var stack = new Stack<int>();
stack.Push(1); stack.Push(2); stack.Push(3);
Console.WriteLine(stack.Pop());   // 3 (LIFO)
Console.WriteLine(stack.Peek());  // 2`,
    explanation: "`Queue<T>` is a circular buffer that removes from the front (FIFO); `Stack<T>` is an array that removes from the back (LIFO) — both are O(1) for add/remove at their respective ends.",
  },
  {
    id: "cs-b17-b1-concurrent-dictionary",
    language: "csharp",
    title: "ConcurrentDictionary for thread-safe access",
    tag: "structures",
    code: `using System.Collections.Concurrent;

var counts = new ConcurrentDictionary<string, int>();

// AddOrUpdate is atomic:
Parallel.For(0, 1000, _ =>
{
    counts.AddOrUpdate("key", 1, (k, v) => v + 1);
});

Console.WriteLine(counts["key"]);  // 1000 (no lost updates)

// GetOrAdd — add only if key absent:
int val = counts.GetOrAdd("new", 42);`,
    explanation: "`ConcurrentDictionary` uses fine-grained locks per bucket for thread-safe reads and writes; `AddOrUpdate` and `GetOrAdd` are atomic operations that eliminate the check-then-act race of `Dictionary` + manual locks.",
  },
  {
    id: "cs-b17-b1-immutable-list",
    language: "csharp",
    title: "ImmutableList<T>: persistent data structure",
    tag: "structures",
    code: `using System.Collections.Immutable;

var list  = ImmutableList<int>.Empty;
var list2 = list.Add(1);
var list3 = list2.Add(2).Add(3);

Console.WriteLine(list.Count);   // 0  (unchanged)
Console.WriteLine(list3.Count);  // 3

// Remove returns a new list:
var list4 = list3.Remove(2);
Console.WriteLine(string.Join(", ", list4));  // 1, 3`,
    explanation: "`ImmutableList<T>` is a persistent (functional-style) data structure — every mutation returns a new instance sharing structure with the original, making it safe to share across threads without copying.",
  },
  {
    id: "cs-b17-b1-span-slicing",
    language: "csharp",
    title: "Span<T> slicing without allocations",
    tag: "structures",
    code: `int[] data = [1, 2, 3, 4, 5, 6, 7, 8];

Span<int> span = data;
Span<int> middle = span[2..6];   // [3, 4, 5, 6]

middle[0] = 99;                  // modifies original array!
Console.WriteLine(data[2]);      // 99

// Useful for parsing — no substring copies:
ReadOnlySpan<char> csv = "alice,bob,carol".AsSpan();
int comma = csv.IndexOf(',');
ReadOnlySpan<char> first = csv[..comma];   // "alice" — zero copy`,
    explanation: "`Span<T>` is a stack-allocated view over contiguous memory; slicing returns another `Span` pointing into the same buffer without copying, making it ideal for parsing and buffer manipulation.",
  },
  {
    id: "cs-b17-b1-memory-t",
    language: "csharp",
    title: "Memory<T>: heap-safe Span for async code",
    tag: "structures",
    code: `using System.IO;

async Task ReadChunksAsync(Stream stream)
{
    byte[] buffer = new byte[4096];
    Memory<byte> mem = buffer;

    // Memory<T> can be stored in fields and used across await:
    int bytesRead = await stream.ReadAsync(mem);

    // Span<T> cannot cross await — Memory<T> can
    ReadOnlyMemory<byte> chunk = mem[..bytesRead];
    Process(chunk.Span);
}

static void Process(ReadOnlySpan<byte> data)
{
    Console.WriteLine(data.Length);
}`,
    explanation: "`Memory<T>` is the heap-safe counterpart to `Span<T>` — it can be stored in fields and passed across `await` boundaries, while `Span<T>` is restricted to the stack and cannot survive suspension points.",
  },
  {
    id: "cs-b17-b1-stringbuilder-chain",
    language: "csharp",
    title: "StringBuilder method chaining and Append overloads",
    tag: "structures",
    code: `using System.Text;

var sb = new StringBuilder(capacity: 64);

string result = sb
    .Append("Hello")
    .Append(", ")
    .Append("World")
    .Append('!')
    .AppendLine()
    .Append("Line 2")
    .ToString();

Console.WriteLine(result);
// Hello, World!
// Line 2`,
    explanation: "`StringBuilder.Append` returns `this`, enabling fluent chaining; it has overloads for `char`, `string`, `int`, `ReadOnlySpan<char>`, and more, avoiding boxing and string allocations inside the build process.",
  },
  {
    id: "cs-b17-b1-priority-queue",
    language: "csharp",
    title: "PriorityQueue<TElement, TPriority>",
    tag: "structures",
    code: `using System.Collections.Generic;

var pq = new PriorityQueue<string, int>();
pq.Enqueue("low priority task", 10);
pq.Enqueue("urgent task", 1);
pq.Enqueue("normal task", 5);

while (pq.TryDequeue(out string? item, out int priority))
    Console.WriteLine(\`\${priority}: \${item}\`);
// 1: urgent task
// 5: normal task
// 10: low priority task`,
    explanation: "`PriorityQueue<TElement, TPriority>` is a min-heap — the element with the *smallest* priority value dequeues first; use `TryDequeue` to safely pop when the queue might be empty.",
  },
  {
    id: "cs-b17-b1-ilookup-tolookup",
    language: "csharp",
    title: "ILookup<K, V> groups elements like a multi-valued dict",
    tag: "structures",
    code: `using System.Linq;

var words = new[] { "apple", "ant", "banana", "bear", "cherry" };

ILookup<char, string> byLetter = words.ToLookup(w => w[0]);

foreach (string w in byLetter['a'])
    Console.WriteLine(w);   // apple  ant

Console.WriteLine(byLetter['z'].Count()); // 0  — no KeyNotFoundException`,
    explanation: "`ILookup<K, V>` is an immutable one-to-many dictionary built by `ToLookup`; accessing a missing key returns an empty sequence instead of throwing, making it safer than `Dictionary<K, List<V>>`.",
  },
  {
    id: "cs-b17-b1-array-segment",
    language: "csharp",
    title: "ArraySegment<T> as a window into an array",
    tag: "structures",
    code: `int[] source = [10, 20, 30, 40, 50];

// ArraySegment wraps a slice without copying:
var seg = new ArraySegment<int>(source, offset: 1, count: 3);

Console.WriteLine(seg.Count);   // 3
foreach (int n in seg) Console.Write(n + " ");  // 20 30 40

// Modifying the segment modifies the original:
seg[0] = 99;
Console.WriteLine(source[1]);   // 99`,
    explanation: "`ArraySegment<T>` is a struct that holds a reference to the backing array plus offset and count, providing a zero-copy window that supports `IList<T>` — a lighter alternative to `Span<T>` when you need to store it on the heap.",
  },
  {
    id: "cs-b17-b1-readonly-span-parse",
    language: "csharp",
    title: "ReadOnlySpan<char> for allocation-free string parsing",
    tag: "structures",
    code: `using System;

// Parse CSV line without creating substrings:
ReadOnlySpan<char> line = "alice,30,engineer".AsSpan();

int c1 = line.IndexOf(',');
ReadOnlySpan<char> name = line[..c1];

int c2 = line[(c1 + 1)..].IndexOf(',') + c1 + 1;
ReadOnlySpan<char> age  = line[(c1 + 1)..c2];

Console.WriteLine(name.ToString());  // alice
Console.WriteLine(int.Parse(age));   // 30`,
    explanation: "`ReadOnlySpan<char>` lets you slice a string into views without allocating substrings; `int.Parse` and many other APIs accept `ReadOnlySpan<char>` directly, keeping parsing completely allocation-free.",
  },
  {
    id: "cs-b17-b1-ordered-dict-net",
    language: "csharp",
    title: "Dictionary<T,V> insertion order preserved (.NET 5+)",
    tag: "structures",
    code: `var dict = new Dictionary<string, int>();
dict["banana"] = 2;
dict["apple"]  = 1;
dict["cherry"] = 3;

// .NET 5+ guarantees enumeration in insertion order
foreach (var kv in dict)
    Console.WriteLine(\`\${kv.Key}: \${kv.Value}\`);
// banana: 2
// apple: 1
// cherry: 3

// Removing and re-adding moves key to the end:
dict.Remove("banana");
dict["banana"] = 99;`,
    explanation: "Since .NET 5, `Dictionary<K,V>` preserves insertion order during enumeration (though this is an implementation detail, not a contract) — unlike `SortedDictionary` which always sorts by key.",
  },
  // === caveats ===
  {
    id: "cs-b17-b1-async-void-caveat",
    language: "csharp",
    title: "async void: exceptions crash the app silently",
    tag: "caveats",
    code: `// Avoid async void outside of event handlers:
async void FireAndForget()   // exception goes to AppDomain.UnhandledException
{
    await Task.Delay(100);
    throw new Exception("lost");  // cannot be caught by caller
}

// Prefer:
async Task SafeWork()        // caller can await and catch
{
    await Task.Delay(100);
    throw new Exception("catchable");
}

// If you MUST use async void (event handler), catch internally:
async void Button_Click(object s, EventArgs e)
{
    try { await SafeWork(); } catch (Exception ex) { Log(ex); }
}`,
    explanation: "`async void` methods can't be awaited so their exceptions bypass the normal `try/catch` hierarchy and go directly to the unhandled exception handler, often terminating the process — use `async Task` and await it.",
  },
  {
    id: "cs-b17-b1-interface-default-impl",
    language: "csharp",
    title: "Interface default methods don't flow to implementing classes",
    tag: "caveats",
    code: `interface IGreeter
{
    string Greet() => "Hello";   // default implementation
}

class MyGreeter : IGreeter { }   // doesn't override Greet

var g = new MyGreeter();
// g.Greet();  // compile error — MyGreeter has no Greet method!

IGreeter ig = g;
Console.WriteLine(ig.Greet());   // "Hello" — only via interface reference`,
    explanation: "Interface default methods are accessible only through an interface-typed reference; a class that inherits but doesn't override the default method can't call it via `this` — they exist for interface evolution, not class reuse.",
  },
  {
    id: "cs-b17-b1-exception-rethrow",
    language: "csharp",
    title: "throw vs throw ex: preserving the stack trace",
    tag: "caveats",
    code: `void Inner() => throw new InvalidOperationException("original");

void BadRethrow()
{
    try { Inner(); }
    catch (Exception ex)
    {
        throw ex;   // RESETS the stack trace — origin lost!
    }
}

void GoodRethrow()
{
    try { Inner(); }
    catch
    {
        throw;      // PRESERVES the original stack trace
    }
}`,
    explanation: "`throw ex` starts a new exception with a reset stack trace, hiding where the error originated; bare `throw` re-throws the current exception preserving its original stack trace — always prefer bare `throw` in catch blocks.",
  },
  {
    id: "cs-b17-b1-is-as-cast",
    language: "csharp",
    title: "is vs as vs direct cast: null vs exception",
    tag: "caveats",
    code: `object obj = "hello";

// Direct cast: throws InvalidCastException if wrong type
string s1 = (string)obj;   // works

// as: returns null if wrong type (only for reference/nullable types)
string? s2 = obj as string;  // "hello"
int? n = obj as int?;        // null — no exception

// is: test without assignment
if (obj is string s3)
    Console.WriteLine(s3.Length);  // 5

// is with wrong type:
Console.WriteLine(obj is int);   // False`,
    explanation: "`as` returns `null` on type mismatch (avoids exceptions) while a direct cast throws `InvalidCastException`; use `is T name` pattern matching when you need to both check and bind in one step.",
  },
  {
    id: "cs-b17-b1-string-empty-vs-quotes",
    language: "csharp",
    title: "string.Empty vs \"\" — they're identical at runtime",
    tag: "caveats",
    code: `string a = "";
string b = string.Empty;

Console.WriteLine(a == b);                    // True
Console.WriteLine(ReferenceEquals(a, b));     // True — same interned object!

// Both compile to the same IL — it's a style choice, not a performance one
// Prefer: string.IsNullOrEmpty(s) to check both null and empty

string? s = null;
Console.WriteLine(s == "");                   // False (null != empty)
Console.WriteLine(string.IsNullOrEmpty(s));   // True`,
    explanation: "`\"\"` and `string.Empty` are the same interned string object; choosing between them is a style decision — never use `s.Length == 0` without first checking for `null`.",
  },
  {
    id: "cs-b17-b1-linq-deferred",
    language: "csharp",
    title: "LINQ queries are deferred — evaluated on enumeration",
    tag: "caveats",
    code: `using System.Linq;

var data = new List<int> { 1, 2, 3 };

// Query is built but NOT executed yet:
var query = data.Where(x => x > 1).Select(x => x * 10);

data.Add(4);   // modifying source BEFORE enumeration

// Evaluated HERE — sees the modified list:
foreach (int n in query)
    Console.Write(n + " ");   // 20 30 40

// Force immediate execution with ToList/ToArray:
var snapshot = query.ToList();`,
    explanation: "LINQ operators return lazy `IEnumerable<T>` that re-execute against the live source each time they're enumerated; call `.ToList()` or `.ToArray()` to snapshot the results and avoid re-evaluation side effects.",
  },
  {
    id: "cs-b17-b1-double-equals-nan",
    language: "csharp",
    title: "double.Equals vs == with NaN and -0.0",
    tag: "caveats",
    code: `double nan = double.NaN;
double negZero = -0.0;
double posZero = 0.0;

// NaN:
Console.WriteLine(nan == nan);           // False  (IEEE 754)
Console.WriteLine(nan.Equals(nan));      // True   (object contract)

// Negative zero:
Console.WriteLine(negZero == posZero);   // True   (IEEE 754)
Console.WriteLine(negZero.Equals(posZero)); // False (bit representation)`,
    explanation: "`double.Equals(double)` uses bitwise comparison (NaN equals NaN, -0.0 doesn't equal +0.0) while `==` follows IEEE 754 (NaN != NaN, -0.0 == +0.0) — the two are inconsistent by design.",
  },
  {
    id: "cs-b17-b1-enum-underlying-type",
    language: "csharp",
    title: "Enum underlying type assumptions can bite",
    tag: "caveats",
    code: `enum Status { Active, Inactive, Pending }  // underlying: int

// Casting an out-of-range int doesn't throw:
Status s = (Status)99;
Console.WriteLine(s);          // 99  — not a defined name
Console.WriteLine(Enum.IsDefined(typeof(Status), s));  // False

// Always validate:
int raw = 99;
if (Enum.IsDefined(typeof(Status), raw))
{
    Status valid = (Status)raw;
}`,
    explanation: "Casting an integer to an enum in C# never throws, even if the value isn't a defined member — always use `Enum.IsDefined` or `Enum.TryParse` to validate external data before treating it as a valid enum value.",
  },
  {
    id: "cs-b17-b1-datetime-utc",
    language: "csharp",
    title: "DateTime.Now vs DateTime.UtcNow: Kind matters",
    tag: "caveats",
    code: `DateTime local = DateTime.Now;      // Kind = Local
DateTime utc   = DateTime.UtcNow;   // Kind = Utc

Console.WriteLine(local.Kind);  // Local
Console.WriteLine(utc.Kind);    // Utc

// Comparing Local and Utc can give wrong results:
// DateTime.Now and DateTime.UtcNow differ by offset hours

// Safe: always store/compare in UTC
DateTimeOffset safeLocal = DateTimeOffset.Now;
DateTimeOffset safeUtc   = DateTimeOffset.UtcNow;
Console.WriteLine(safeLocal == safeUtc);  // True — offset-aware comparison`,
    explanation: "Use `DateTime.UtcNow` for storage and calculations (offset-unambiguous); `DateTimeOffset` carries the UTC offset so comparisons work correctly across time zones — `DateTime.Now` plus arithmetic leads to daylight-saving bugs.",
  },
  {
    id: "cs-b17-b1-readonly-struct-mutability",
    language: "csharp",
    title: "readonly struct prevents defensive copies",
    tag: "caveats",
    code: `struct MutablePoint { public int X; }
readonly struct ImmutablePoint { public int X { get; } }

// Non-readonly struct method calls on readonly fields trigger a defensive copy:
class Holder
{
    private readonly MutablePoint _pt = new() { X = 1 };

    public void Show()
    {
        // Compiler copies _pt to call any method (even read-only ones!)
        Console.WriteLine(_pt.X);  // silent copy
    }
}

// readonly struct eliminates the copy — declare structs readonly when possible`,
    explanation: "When a non-`readonly` struct is stored in a `readonly` field or passed via `in`, the compiler creates a defensive copy before any method call to prevent mutations — declare your struct `readonly` to eliminate these hidden copies.",
  },
  {
    id: "cs-b17-b1-idisposable-pattern",
    language: "csharp",
    title: "IDisposable with finalizer safety net",
    tag: "caveats",
    code: `class ManagedResource : IDisposable
{
    private bool _disposed;

    public void Dispose()
    {
        Dispose(true);
        GC.SuppressFinalize(this);   // skip finalizer — already cleaned up
    }

    protected virtual void Dispose(bool disposing)
    {
        if (_disposed) return;
        if (disposing) { /* free managed resources */ }
        // free unmanaged resources here
        _disposed = true;
    }

    ~ManagedResource() => Dispose(false);  // finalizer fallback
}`,
    explanation: "The full `IDisposable` pattern separates managed cleanup (only when `disposing == true`) from unmanaged cleanup (always); `GC.SuppressFinalize` avoids a second cleanup when `Dispose` was already called explicitly.",
  },
  {
    id: "cs-b17-b1-ref-struct-limits",
    language: "csharp",
    title: "ref struct cannot be stored on the heap",
    tag: "caveats",
    code: `ref struct StackOnly
{
    public int Value;
}

// Cannot box or store in class fields:
// object boxed = new StackOnly();   // error
// StackOnly[] arr = new StackOnly[1]; // allowed — but Span<T> isn't

// Cannot be used with async or yield:
// async Task UseBad() { StackOnly s = default; await Task.Delay(1); }

// Valid uses — stack or inlined only:
void UseOnStack()
{
    StackOnly s = new() { Value = 42 };
    Console.WriteLine(s.Value);
}`,
    explanation: "`ref struct` types are guaranteed to live on the stack — they cannot be boxed, stored in class fields, captured by lambdas, or used across `await`/`yield` suspension points, making them safe for wrapping unmanaged memory.",
  },
  // === types ===
  {
    id: "cs-b17-b1-numeric-types",
    language: "csharp",
    title: "int vs long vs double vs decimal — when to use which",
    tag: "types",
    code: `int    i = 2_147_483_647;     // 32-bit, max ~2.1 billion
long   l = 9_223_372_036_854_775_807L;  // 64-bit
float  f = 3.14f;               // 32-bit, ~7 sig digits, fast
double d = 3.141592653589793;   // 64-bit, ~15 sig digits
decimal m = 9.99m;              // 128-bit base-10, exact for money

// Promotion rules:
var sum = i + l;    // long (int promotes to long)
var ratio = i / 3;  // int (no float in expression)
var ratio2 = i / 3.0; // double (3.0 promotes int)`,
    explanation: "Use `int`/`long` for integers, `double` for scientific math, `float` when memory matters and precision doesn't, and `decimal` for financial/currency calculations where base-10 exactness is required.",
  },
  {
    id: "cs-b17-b1-nullable-boxing",
    language: "csharp",
    title: "Nullable<T> boxing: null doesn't box to null object",
    tag: "types",
    code: `int? nullableInt = null;
int? hasValue   = 42;

// Boxing a null Nullable<T> produces a null reference:
object? boxedNull = nullableInt;
Console.WriteLine(boxedNull is null);   // True

// Boxing a non-null Nullable<T> produces a boxed T (not Nullable<T>!):
object boxedVal = hasValue;
Console.WriteLine(boxedVal.GetType());  // System.Int32  (not Nullable<Int32>)

// Unboxing back:
int? back = (int?)boxedNull;    // null
int? back2 = (int?)boxedVal;    // 42`,
    explanation: "When `Nullable<T>` with a value is boxed, the runtime boxes the inner `T` directly (not the `Nullable<T>` wrapper); a `null` `Nullable<T>` boxes to a null reference — both are important to know for reflection and interop.",
  },
  {
    id: "cs-b17-b1-boxing-unboxing",
    language: "csharp",
    title: "Boxing and unboxing: heap allocation for value types",
    tag: "types",
    code: `int value = 42;
object boxed = value;   // boxing: allocates a heap object wrapping 42

// Unboxing — must match exact type:
int unboxed = (int)boxed;   // OK
// long wrong = (long)boxed;  // InvalidCastException! (not long)

// Watch for hidden boxing in collections:
System.Collections.ArrayList old = new();
old.Add(42);            // boxes int
int v = (int)old[0]!;  // unboxes int

// Use generics to avoid boxing:
var list = new System.Collections.Generic.List<int>();
list.Add(42);           // no boxing`,
    explanation: "Boxing copies a value type to a new heap object; unboxing copies it back — each is an allocation/copy pair; generic collections avoid boxing entirely by preserving the value type through the type parameter.",
  },
  {
    id: "cs-b17-b1-generic-constraints",
    language: "csharp",
    title: "Generic constraints narrow what T can be",
    tag: "types",
    code: `// where T : struct  — value type, allows T? for Nullable<T>
T? MaybeValue<T>(bool flag) where T : struct => flag ? default(T) : null;

// where T : class   — reference type, allows null
T? MaybeRef<T>(bool flag) where T : class => flag ? default : null;

// where T : new()   — has parameterless constructor
T Create<T>() where T : new() => new T();

// Combined:
T CreateComparable<T>() where T : class, IComparable<T>, new() => new T();`,
    explanation: "Constraints restrict what types can satisfy a type parameter; `struct` and `class` affect nullability rules, `new()` enables `new T()`, and interface constraints unlock calling interface members on `T`.",
  },
  {
    id: "cs-b17-b1-covariance-contravariance",
    language: "csharp",
    title: "Covariance (out) and contravariance (in) on interfaces",
    tag: "types",
    code: `// IEnumerable<out T> is covariant — you can widen T:
IEnumerable<string> strings = new List<string> { "a" };
IEnumerable<object> objects = strings;  // OK — string IS-A object

// Action<in T> is contravariant — you can narrow T:
Action<object> printObj = obj => Console.WriteLine(obj);
Action<string> printStr = printObj;    // OK — Action<object> handles string

// Covariant: can only produce T (return)
// Contravariant: can only consume T (parameter)`,
    explanation: "Covariant (`out T`) interfaces allow assignment to a wider type parameter; contravariant (`in T`) interfaces allow assignment to a narrower type parameter — both enable polymorphic use of generic types without casting.",
  },
  {
    id: "cs-b17-b1-dynamic-type",
    language: "csharp",
    title: "dynamic defers type checking to runtime",
    tag: "types",
    code: `dynamic d = "hello";
Console.WriteLine(d.Length);    // 5 — resolved at runtime

d = 42;
Console.WriteLine(d + 1);       // 43

// RuntimeBinderException for invalid operations:
try { Console.WriteLine(d.Length); }   // int has no Length
catch (Microsoft.CSharp.RuntimeBinder.RuntimeBinderException e)
{ Console.WriteLine(e.Message); }

// Useful for COM interop and JSON deserialization:
dynamic json = Newtonsoft.Json.JsonConvert.DeserializeObject("{\"x\":1}");`,
    explanation: "`dynamic` bypasses compile-time type checking and resolves member access at runtime via the DLR; it's useful for COM/interop and duck-typed scenarios but sacrifices IntelliSense and compile-time safety.",
  },
  {
    id: "cs-b17-b1-var-inference",
    language: "csharp",
    title: "var infers type from the right-hand expression",
    tag: "types",
    code: `var i = 42;                // int
var s = "hello";           // string
var d = 3.14;              // double
var list = new List<int>(); // List<int>

// var is NOT dynamic — type is fixed at compile time:
// i = "text";  // error: cannot assign string to int

// Use var when the type is obvious from the right side:
var dict = new Dictionary<string, List<int>>();  // cleaner

// Don't use var when the type isn't clear:
var result = Compute();   // reader must look up Compute's return type`,
    explanation: "`var` is an implicit but statically-typed declaration — the compiler infers and locks in the exact type at compile time, so it's fully type-safe and not the same as `dynamic`.",
  },
  {
    id: "cs-b17-b1-tuple-deconstruct",
    language: "csharp",
    title: "Tuple deconstruction and named elements",
    tag: "types",
    code: `// Named tuple elements:
(string Name, int Age) person = ("Alice", 30);
Console.WriteLine(person.Name);  // Alice

// Deconstruction into variables:
(string name, int age) = person;
Console.WriteLine(age);   // 30

// Discard unwanted elements with _:
(_, int ageOnly) = person;

// Return multiple values from a method:
(int Min, int Max) GetRange(int[] arr) => (arr.Min(), arr.Max());
var (min, max) = GetRange([3, 1, 4, 1, 5]);`,
    explanation: "Value tuples support named elements for readability and deconstruction syntax for unpacking — they're value types (no heap allocation) and a clean alternative to `out` parameters or custom result classes.",
  },
  {
    id: "cs-b17-b1-record-vs-record-struct",
    language: "csharp",
    title: "record class vs record struct",
    tag: "types",
    code: `// record class — reference type, heap allocated
record class PersonClass(string Name, int Age);

// record struct — value type, stack/inline
record struct PersonStruct(string Name, int Age);

PersonClass rc1 = new("Alice", 30);
PersonClass rc2 = new("Alice", 30);
Console.WriteLine(rc1 == rc2);          // True — value equality
Console.WriteLine(ReferenceEquals(rc1, rc2));  // False — different objects

PersonStruct rs1 = new("Alice", 30);
PersonStruct rs2 = rs1;  // copy (value semantics)
rs2 = rs2 with { Age = 31 };
Console.WriteLine(rs1.Age);  // 30 — unchanged`,
    explanation: "`record class` provides value equality for reference types (still heap-allocated); `record struct` provides value equality for stack-allocated structs — both generate `ToString`, `==`, and `with` expressions.",
  },
  {
    id: "cs-b17-b1-nint-nuint",
    language: "csharp",
    title: "nint and nuint: native-width integers",
    tag: "types",
    code: `// nint is int on 32-bit, long on 64-bit:
nint ptr = 0;
nuint size = (nuint)Environment.SystemPageSize;

Console.WriteLine(sizeof(nint));   // 4 or 8 depending on platform
Console.WriteLine(nint.MaxValue);  // 2147483647 or 9223372036854775807

// Use cases: pointer arithmetic, P/Invoke, unsafe code
unsafe
{
    nint address = (nint)&ptr;
    Console.WriteLine(address);
}`,
    explanation: "`nint`/`nuint` are compiler aliases for `IntPtr`/`UIntPtr` with arithmetic operators; they match the platform's pointer size and are useful for pointer arithmetic, interop, and collections indexed by native handles.",
  },
  {
    id: "cs-b17-b1-implicit-explicit-operator",
    language: "csharp",
    title: "Implicit and explicit conversion operators",
    tag: "types",
    code: `readonly struct Celsius
{
    public double Value { get; }
    public Celsius(double v) => Value = v;

    // Implicit: safe, no data loss
    public static implicit operator Fahrenheit(Celsius c)
        => new((c.Value * 9 / 5) + 32);
}

readonly struct Fahrenheit
{
    public double Value { get; }
    public Fahrenheit(double v) => Value = v;

    // Explicit: may lose precision / truncate
    public static explicit operator Celsius(Fahrenheit f)
        => new((f.Value - 32) * 5 / 9);
}

Celsius c = new(100);
Fahrenheit f = c;          // implicit — no cast needed
Celsius back = (Celsius)f; // explicit — cast required`,
    explanation: "Define `implicit` conversions when the transformation is always safe and lossless; use `explicit` when the caller should acknowledge possible data loss or ambiguity by writing an explicit cast.",
  },
  {
    id: "cs-b17-b1-required-members",
    language: "csharp",
    title: "required members enforce initialization at construction",
    tag: "types",
    code: `class Config
{
    public required string ConnectionString { get; init; }
    public required int TimeoutSeconds { get; init; }
    public string? LogFile { get; init; }   // optional
}

// Object initializer MUST supply required members:
var cfg = new Config
{
    ConnectionString = "Server=localhost",
    TimeoutSeconds = 30
};
// Omitting ConnectionString or TimeoutSeconds is a compile error`,
    explanation: "`required` on a property forces every object initializer to supply a value; unlike constructor parameters, `required` works with object initializer syntax while still catching missing values at compile time.",
  },
  {
    id: "cs-b17-b1-readonlyspan-char",
    language: "csharp",
    title: "ReadOnlySpan<char> in switch/patterns (C# 11)",
    tag: "types",
    code: `void Dispatch(ReadOnlySpan<char> command)
{
    // C# 11: span patterns in switch
    if (command is "quit" or "exit")
    {
        Console.WriteLine("Bye!");
        return;
    }
    switch (command)
    {
        case "help": Console.WriteLine("showing help"); break;
        case "run":  Console.WriteLine("running");       break;
        default:     Console.WriteLine("unknown");       break;
    }
}

Dispatch("help".AsSpan());  // showing help`,
    explanation: "C# 11 lets `ReadOnlySpan<char>` participate in `is` and `switch` pattern matching against string literals, enabling allocation-free command parsing without converting the span to a `string` first.",
  },
  // === families ===
  {
    id: "cs-b17-b1-ienumerable-icollection-ilist",
    language: "csharp",
    title: "IEnumerable vs ICollection vs IList vs IReadOnlyList",
    tag: "families",
    code: `// IEnumerable<T>   — foreach only, no Count, no index, lazy
// ICollection<T>   — Count, Add, Remove, Contains; not indexed
// IList<T>         — indexed access, Insert, RemoveAt
// IReadOnlyList<T> — Count + indexed, no mutation

void PrintAll(IEnumerable<int> items) { foreach (var i in items) Console.Write(i); }
void AddItem(ICollection<int> items, int v) { items.Add(v); }
int  GetAt(IList<int> items, int i) => items[i];
int  CountRO(IReadOnlyList<int> items) => items.Count;

// Program to widest interface that satisfies your needs:
void AcceptAny(IEnumerable<int> items) { }   // most flexible
AcceptAny(new List<int>());
AcceptAny(new int[]{1,2});`,
    explanation: "Accept the widest interface (`IEnumerable<T>`) unless you specifically need `Count` or indexing — this keeps your method usable with arrays, lists, and lazy sequences, and signals what operations you actually use.",
  },
  {
    id: "cs-b17-b1-iqueryable-vs-ienumerable",
    language: "csharp",
    title: "IQueryable<T> vs IEnumerable<T> in LINQ",
    tag: "families",
    code: `// IEnumerable — pulls all data to memory, filters in C#:
IEnumerable<User> inMemory = db.Users.AsEnumerable()
    .Where(u => u.Age > 18);   // SQL: SELECT *; filter in C#

// IQueryable — translates predicate to SQL:
IQueryable<User> fromDb = db.Users
    .Where(u => u.Age > 18);  // SQL: SELECT * WHERE Age > 18

// Mixing: AsEnumerable() switches from IQueryable to IEnumerable
var result = db.Users
    .Where(u => u.Active)                          // SQL filter
    .AsEnumerable()
    .Where(u => CustomLogic(u));                   // C# filter`,
    explanation: "`IQueryable<T>` carries an expression tree that query providers (EF, LINQ-to-SQL) translate to SQL; `IEnumerable<T>` executes lambdas as compiled C# delegates in memory — call `AsEnumerable()` to switch intentionally.",
  },
  {
    id: "cs-b17-b1-action-func-predicate",
    language: "csharp",
    title: "Action vs Func vs Predicate delegate families",
    tag: "families",
    code: `// Action<T...>: returns void
Action<string> print = Console.WriteLine;
Action<int, int> addAndPrint = (a, b) => Console.WriteLine(a + b);

// Func<T..., TResult>: returns TResult
Func<int, int, int> add = (a, b) => a + b;
Func<string, int> length = s => s.Length;

// Predicate<T>: Func<T, bool> specialization
Predicate<string> notEmpty = s => !string.IsNullOrEmpty(s);
bool ok = notEmpty("hello");   // True

// All are delegate types — interchangeable:
Func<string, bool> notEmpty2 = s => !string.IsNullOrEmpty(s);`,
    explanation: "`Action` represents void-returning delegates, `Func` represents value-returning delegates, and `Predicate<T>` is a legacy shorthand for `Func<T, bool>` — APIs built before LINQ use `Predicate`, newer ones use `Func`.",
  },
  {
    id: "cs-b17-b1-task-vs-valuetask",
    language: "csharp",
    title: "Task vs ValueTask: allocation trade-off",
    tag: "families",
    code: `// Task: always allocates a heap object
async Task<int> GetValueTask()
{
    await Task.Delay(10);
    return 42;
}

// ValueTask: zero allocation when result is synchronous
async ValueTask<int> GetValueTaskFast(bool cached)
{
    if (cached) return 42;   // returns synchronously — no allocation!
    await Task.Delay(10);
    return 42;
}

// Only await ValueTask once and don't cache it:
int v = await GetValueTaskFast(true);`,
    explanation: "`ValueTask<T>` avoids the `Task<T>` heap allocation when the result is immediately available (common in cached/hot paths); use `Task<T>` for operations that are almost always truly async.",
  },
  {
    id: "cs-b17-b1-lazy-t",
    language: "csharp",
    title: "Lazy<T> for thread-safe deferred initialization",
    tag: "families",
    code: `using System;

// Initialized on first access, cached thereafter:
Lazy<ExpensiveService> lazy = new(() => new ExpensiveService());

Console.WriteLine(lazy.IsValueCreated);  // False
ExpensiveService svc = lazy.Value;        // initialized here
Console.WriteLine(lazy.IsValueCreated);  // True
ExpensiveService same = lazy.Value;       // returns cached instance

class ExpensiveService { public ExpensiveService() => Console.WriteLine("created"); }`,
    explanation: "`Lazy<T>` defers construction of the value until first access and caches the result; the default mode (`LazyThreadSafetyMode.ExecutionAndPublication`) is thread-safe using double-checked locking.",
  },
  {
    id: "cs-b17-b1-idisposable-iasync",
    language: "csharp",
    title: "IDisposable vs IAsyncDisposable",
    tag: "families",
    code: `using System;
using System.Threading.Tasks;

class AsyncResource : IAsyncDisposable
{
    public async ValueTask DisposeAsync()
    {
        await Task.Delay(10);   // async cleanup (e.g., flush buffer)
        Console.WriteLine("async disposed");
    }
}

// await using — calls DisposeAsync:
await using var res = new AsyncResource();

// Sync using calls Dispose (IDisposable):
class SyncResource : IDisposable
{
    public void Dispose() => Console.WriteLine("sync disposed");
}
using var sr = new SyncResource();`,
    explanation: "`IAsyncDisposable` enables `await using` which calls `DisposeAsync()` — use it for resources whose cleanup involves async I/O (like flushing a network buffer); `IDisposable` and `using` remain for purely synchronous cleanup.",
  },
  {
    id: "cs-b17-b1-icomparable-icomparer",
    language: "csharp",
    title: "IComparable<T> vs IComparer<T>",
    tag: "families",
    code: `class Temperature : IComparable<Temperature>
{
    public double Celsius { get; }
    public Temperature(double c) => Celsius = c;

    public int CompareTo(Temperature? other)
        => Celsius.CompareTo(other?.Celsius);
}

// IComparer<T> — external comparison strategy:
class TempDescending : IComparer<Temperature>
{
    public int Compare(Temperature? a, Temperature? b)
        => b!.Celsius.CompareTo(a!.Celsius);
}

var temps = new[] { new Temperature(20), new Temperature(5), new Temperature(37) };
Array.Sort(temps);                         // uses IComparable
Array.Sort(temps, new TempDescending());   // uses IComparer`,
    explanation: "`IComparable<T>` defines an object's *natural* ordering from within the class; `IComparer<T>` is an external strategy object for alternate orderings — pass it to Sort/OrderBy when natural order isn't what you want.",
  },
  {
    id: "cs-b17-b1-iequatable-iequalitycomparer",
    language: "csharp",
    title: "IEquatable<T> vs IEqualityComparer<T>",
    tag: "families",
    code: `record Point(int X, int Y) : IEquatable<Point>
{
    public bool Equals(Point? other) => other is not null && X == other.X && Y == other.Y;
    public override int GetHashCode() => HashCode.Combine(X, Y);
}

// External comparer for alternate equality (e.g., ignore Y):
class XOnlyComparer : IEqualityComparer<Point>
{
    public bool Equals(Point? a, Point? b) => a?.X == b?.X;
    public int GetHashCode(Point p) => p.X.GetHashCode();
}

var set = new HashSet<Point>(new XOnlyComparer());
set.Add(new Point(1, 2));
set.Add(new Point(1, 9));   // same X — treated as duplicate
Console.WriteLine(set.Count);  // 1`,
    explanation: "`IEquatable<T>` provides a type's default equality; `IEqualityComparer<T>` is an external strategy for alternate equality, passed to `HashSet`, `Dictionary`, or LINQ's `Distinct`/`GroupBy`.",
  },
  {
    id: "cs-b17-b1-cancellation-token",
    language: "csharp",
    title: "CancellationToken: cooperative cancellation",
    tag: "families",
    code: `using System.Threading;
using System.Threading.Tasks;

async Task DoWork(CancellationToken ct)
{
    for (int i = 0; i < 100; i++)
    {
        ct.ThrowIfCancellationRequested();   // cooperative check
        await Task.Delay(50, ct);            // also observes cancellation
        Console.WriteLine(\`step \${i}\`);
    }
}

using var cts = new CancellationTokenSource();
cts.CancelAfter(TimeSpan.FromMilliseconds(200));

try { await DoWork(cts.Token); }
catch (OperationCanceledException) { Console.WriteLine("cancelled"); }`,
    explanation: "`CancellationToken` implements cooperative cancellation — the worker periodically checks `ThrowIfCancellationRequested()` or passes the token to awaitable APIs; `CancellationTokenSource` is the controller that triggers cancellation.",
  },
  {
    id: "cs-b17-b1-asynclocal-threadlocal",
    language: "csharp",
    title: "AsyncLocal<T> vs ThreadLocal<T>",
    tag: "families",
    code: `using System.Threading;

var asyncLocal = new AsyncLocal<string>();
var threadLocal = new ThreadLocal<string>(() => "thread-default");

asyncLocal.Value = "parent";

await Task.Run(() =>
{
    // AsyncLocal: child inherits parent's value (copy-on-write)
    Console.WriteLine(asyncLocal.Value);   // parent
    asyncLocal.Value = "child";            // doesn't change parent's
});
Console.WriteLine(asyncLocal.Value);       // parent

// ThreadLocal: each OS thread has its own independent value
Console.WriteLine(threadLocal.Value);      // thread-default`,
    explanation: "`AsyncLocal<T>` flows with the async context (child tasks inherit the value but mutations don't propagate back); `ThreadLocal<T>` gives each OS thread its own independent slot regardless of async flow.",
  },
  {
    id: "cs-b17-b1-ireadonly-dict",
    language: "csharp",
    title: "IReadOnlyDictionary<K,V> vs IDictionary<K,V>",
    tag: "families",
    code: `using System.Collections.Generic;

var dict = new Dictionary<string, int> { ["a"] = 1, ["b"] = 2 };

// Expose as read-only — callers can't add/remove:
IReadOnlyDictionary<string, int> ro = dict;
Console.WriteLine(ro["a"]);      // 1
// ro["c"] = 3;                  // compile error — no setter

// IDictionary<K,V> — mutable interface
IDictionary<string, int> mutable = dict;
mutable["c"] = 3;`,
    explanation: "`IReadOnlyDictionary<K,V>` exposes `TryGetValue`, `ContainsKey`, `Keys`, `Values`, and indexer getter without any mutation operations — return it from public APIs when callers should not modify the collection.",
  },
  {
    id: "cs-b17-b1-iprogress-t",
    language: "csharp",
    title: "IProgress<T> for async progress reporting",
    tag: "families",
    code: `using System;
using System.Threading.Tasks;

async Task ComputeAsync(IProgress<int>? progress)
{
    for (int i = 1; i <= 10; i++)
    {
        await Task.Delay(50);
        progress?.Report(i * 10);   // percent complete
    }
}

// Progress<T> marshals back to the captured SynchronizationContext:
var progress = new Progress<int>(pct => Console.WriteLine(\`\${pct}%\`));
await ComputeAsync(progress);`,
    explanation: "`IProgress<T>.Report(T)` decouples the worker from how progress is displayed; `Progress<T>` captures the `SynchronizationContext` at construction and marshals callbacks back to the UI thread automatically.",
  },
  // === classes ===
  {
    id: "cs-b17-b1-abstract-vs-interface",
    language: "csharp",
    title: "abstract class vs interface: when to choose",
    tag: "classes",
    code: `// abstract class: shared implementation + common state
abstract class Animal
{
    public string Name { get; }
    protected Animal(string name) => Name = name;
    public abstract string Speak();           // must override
    public string Describe() => \`\${Name}: \${Speak()}\`;  // shared impl
}

// interface: contract without state (before C# 8 default methods)
interface ISwimmable { void Swim(); }
interface IFlyable   { void Fly();  }

// Class can inherit one abstract class but many interfaces:
class Duck : Animal, ISwimmable, IFlyable
{
    public Duck() : base("Duck") { }
    public override string Speak() => "Quack";
    public void Swim() => Console.WriteLine("splash");
    public void Fly()  => Console.WriteLine("flap");
}`,
    explanation: "Choose `abstract class` when subclasses share state or implementation; choose `interface` to define a contract that unrelated types can satisfy — a class can only extend one abstract class but implement many interfaces.",
  },
  {
    id: "cs-b17-b1-sealed-class",
    language: "csharp",
    title: "sealed class prevents inheritance and enables devirtualization",
    tag: "classes",
    code: `sealed class Configuration
{
    public string Host { get; }
    public int Port { get; }
    public Configuration(string host, int port)
        => (Host, Port) = (host, port);
}

// class Derived : Configuration { }  // compile error

// On sealed classes, virtual/override calls can be devirtualized
// by the JIT — slight performance benefit on hot paths

// sealed on a method prevents further override in a sub-hierarchy:
class Base    { public virtual void M() { } }
class Middle  : Base { public sealed override void M() { } }
// class Leaf : Middle { public override void M() { } }  // error`,
    explanation: "`sealed` on a class blocks inheritance; `sealed` on an override blocks further overriding — both are hints to the JIT that allow devirtualization and are also design intent signals to other developers.",
  },
  {
    id: "cs-b17-b1-partial-class",
    language: "csharp",
    title: "partial class splits a class across files",
    tag: "classes",
    code: `// File: Person.cs
partial class Person
{
    public string Name { get; set; } = "";
    public int Age { get; set; }
}

// File: Person.Validation.cs
partial class Person
{
    public bool IsAdult => Age >= 18;
    public bool IsValid() => !string.IsNullOrEmpty(Name) && Age >= 0;
}

// At compile time, all parts are merged into one class:
var p = new Person { Name = "Alice", Age = 30 };
Console.WriteLine(p.IsAdult);   // True`,
    explanation: "`partial class` lets you split a class definition across multiple files — commonly used by code generators (like EF model scaffolding) to keep auto-generated code separate from hand-written code.",
  },
  {
    id: "cs-b17-b1-record-class",
    language: "csharp",
    title: "record class: immutable data objects with value equality",
    tag: "classes",
    code: `record Person(string Name, int Age);

var alice1 = new Person("Alice", 30);
var alice2 = new Person("Alice", 30);

// Value equality (generated by compiler):
Console.WriteLine(alice1 == alice2);  // True
Console.WriteLine(alice1.Equals(alice2)); // True

// ToString (generated):
Console.WriteLine(alice1);  // Person { Name = Alice, Age = 30 }

// Non-destructive mutation:
var older = alice1 with { Age = 31 };
Console.WriteLine(older);   // Person { Name = Alice, Age = 31 }`,
    explanation: "Records auto-generate `Equals`, `GetHashCode`, `ToString`, and `with` based on their positional parameters, making them ideal for immutable data transfer objects without boilerplate.",
  },
  {
    id: "cs-b17-b1-init-only-setters",
    language: "csharp",
    title: "init-only setters: immutable after construction",
    tag: "classes",
    code: `class Point
{
    public double X { get; init; }
    public double Y { get; init; }
}

var p = new Point { X = 1.0, Y = 2.0 };   // set at construction
// p.X = 3.0;  // compile error — init-only!

// init setters are accessible in object initializers AND
// in the constructor:
class Point3D : Point
{
    public double Z { get; init; }
    public Point3D() { Z = 0; }   // also OK in ctor
}`,
    explanation: "`init` accessors can be set in object initializers and constructors but not afterward, giving you the convenience of object-initializer syntax with the safety of immutability after construction.",
  },
  {
    id: "cs-b17-b1-primary-constructors",
    language: "csharp",
    title: "Primary constructors (C# 12) for concise classes",
    tag: "classes",
    code: `// Primary constructor parameters are in scope throughout the class:
class Service(string host, int port)
{
    // Parameters captured as fields automatically only if referenced outside ctor:
    private readonly string _url = \`http://\${host}:\${port}\`;

    public string GetUrl() => _url;
    public void Connect() => Console.WriteLine(\`connecting to \${host}:\${port}\`);
}

var svc = new Service("localhost", 8080);
Console.WriteLine(svc.GetUrl());  // http://localhost:8080`,
    explanation: "C# 12 primary constructors put parameters in the class body scope, removing the need for a separate constructor + field assignments for simple dependency injection or configuration classes.",
  },
  {
    id: "cs-b17-b1-static-abstract-interface",
    language: "csharp",
    title: "Static abstract interface members for generic math",
    tag: "classes",
    code: `using System.Numerics;

// INumber<T> uses static abstract members to define numeric operations:
T Sum<T>(T[] values) where T : INumber<T>
{
    T result = T.Zero;           // static abstract property
    foreach (T v in values)
        result += v;             // static abstract + operator
    return result;
}

Console.WriteLine(Sum(new int[]    { 1, 2, 3 }));  // 6
Console.WriteLine(Sum(new double[] { 1.1, 2.2 })); // 3.3`,
    explanation: "Static abstract interface members (C# 11) let you constrain a type parameter to have specific static methods or operators, enabling generic math algorithms that work across `int`, `double`, `decimal`, etc.",
  },
  {
    id: "cs-b17-b1-explicit-interface-impl",
    language: "csharp",
    title: "Explicit interface implementation hides members",
    tag: "classes",
    code: `interface ILogger { void Log(string msg); }
interface IDebugLogger { void Log(string msg); }

class MultiLogger : ILogger, IDebugLogger
{
    // Explicit implementation — only accessible via interface type:
    void ILogger.Log(string msg)      => Console.WriteLine(\`[LOG] \${msg}\`);
    void IDebugLogger.Log(string msg) => Console.WriteLine(\`[DBG] \${msg}\`);
}

var ml = new MultiLogger();
// ml.Log("x");          // compile error — ambiguous

((ILogger)ml).Log("x");       // [LOG] x
((IDebugLogger)ml).Log("x");  // [DBG] x`,
    explanation: "Explicit interface implementation is required when two interfaces declare the same member; it also hides the member from the class's public surface, accessible only through an interface-typed reference.",
  },
  {
    id: "cs-b17-b1-operator-overloading",
    language: "csharp",
    title: "Operator overloading with + and ==",
    tag: "classes",
    code: `readonly struct Vector2
{
    public double X { get; }
    public double Y { get; }
    public Vector2(double x, double y) => (X, Y) = (x, y);

    public static Vector2 operator +(Vector2 a, Vector2 b)
        => new(a.X + b.X, a.Y + b.Y);

    public static bool operator ==(Vector2 a, Vector2 b)
        => a.X == b.X && a.Y == b.Y;
    public static bool operator !=(Vector2 a, Vector2 b) => !(a == b);

    public override string ToString() => \`(\${X}, \${Y})\`;
}

Console.WriteLine(new Vector2(1, 2) + new Vector2(3, 4));  // (4, 6)`,
    explanation: "Operator overloading lets user-defined types participate in arithmetic and comparison expressions; note that overloading `==` requires also overloading `!=`, and you should override `Equals`/`GetHashCode` for consistency.",
  },
  {
    id: "cs-b17-b1-extension-methods",
    language: "csharp",
    title: "Extension methods add methods to existing types",
    tag: "classes",
    code: `using System;
using System.Collections.Generic;

static class StringExtensions
{
    public static string Truncate(this string s, int maxLength)
        => s.Length <= maxLength ? s : s[..maxLength] + "...";

    public static bool IsNullOrWhiteSpace(this string? s)
        => string.IsNullOrWhiteSpace(s);
}

Console.WriteLine("Hello, World!".Truncate(7));   // Hello, ...
Console.WriteLine("  ".IsNullOrWhiteSpace());     // True

// Must be in a static class; first param is 'this T'`,
    explanation: "Extension methods let you add new instance-method syntax to any type (including sealed types and interfaces) without modifying or inheriting from them — they're syntactic sugar for a static method call.",
  },
  {
    id: "cs-b17-b1-pattern-matching-is",
    language: "csharp",
    title: "Pattern matching with is: type, property, list patterns",
    tag: "classes",
    code: `object obj = new List<int> { 1, 2, 3 };

// Type pattern with binding:
if (obj is List<int> list)
    Console.WriteLine(\`list with \${list.Count} items\`);

// Property pattern:
record Person(string Name, int Age);
object p = new Person("Alice", 30);
if (p is Person { Name: "Alice", Age: > 18 })
    Console.WriteLine("adult Alice");

// List pattern (C# 11):
int[] nums = [1, 2, 3, 4];
if (nums is [1, 2, ..])
    Console.WriteLine("starts with 1, 2");`,
    explanation: "C# pattern matching in `is` expressions can simultaneously test type, bind to a variable, destructure properties, and match list structure — all without casting or separate null checks.",
  },
  {
    id: "cs-b17-b1-iequatable-impl",
    language: "csharp",
    title: "Implementing IEquatable<T> correctly",
    tag: "classes",
    code: `class Money : IEquatable<Money>
{
    public decimal Amount { get; }
    public string Currency { get; }

    public Money(decimal amount, string currency)
        => (Amount, Currency) = (amount, currency);

    public bool Equals(Money? other)
        => other is not null && Amount == other.Amount && Currency == other.Currency;

    public override bool Equals(object? obj) => Equals(obj as Money);
    public override int GetHashCode() => HashCode.Combine(Amount, Currency);
    public static bool operator ==(Money? a, Money? b) => a?.Equals(b) ?? b is null;
    public static bool operator !=(Money? a, Money? b) => !(a == b);
}`,
    explanation: "A correct `IEquatable<T>` implementation requires overriding both `bool Equals(T?)` and `object Equals(object?)` plus `GetHashCode`, and optionally `==`/`!=` — all must be consistent with each other.",
  },
];
