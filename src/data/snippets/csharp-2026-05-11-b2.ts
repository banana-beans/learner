import type { Snippet } from "./types";

export const csharpSnippets20260511B2: Snippet[] = [
  // ── tag: snippet ────────────────────────────────────────────────────────────
  {
    id: "cs-string-format-composite",
    language: "csharp",
    title: "Composite formatting with string.Format",
    tag: "snippet",
    code: `string s = string.Format("Hello, {0}! You are {1} years old.", "Alice", 30);
// "Hello, Alice! You are 30 years old."

// Format specifiers
string pi  = string.Format("{0:F4}", Math.PI);  // "3.1416"
string hex = string.Format("{0:X}", 255);        // "FF"

// Repeated placeholder
string both = string.Format("{0} and {0}", "echo");  // "echo and echo"`,
    explanation:
      "string.Format uses indexed placeholders {0}, {1}, … with optional format specifiers after a colon; it predates interpolated strings but is still useful when the format string is determined at runtime.",
  },
  {
    id: "cs-string-padleft-right",
    language: "csharp",
    title: "PadLeft() and PadRight() for text alignment",
    tag: "snippet",
    code: `string s = "42";
Console.WriteLine(s.PadLeft(6));        // "    42"  — right-aligned
Console.WriteLine(s.PadRight(6));       // "42    "  — left-aligned
Console.WriteLine(s.PadLeft(6, '0'));   // "000042"  — zero-padded

// Handy for columns
foreach (string item in new[] { "Item", "LongItem", "X" })
    Console.WriteLine(item.PadRight(12) + "|");
// "Item        |"
// "LongItem    |"
// "X           |"`,
    explanation:
      "PadLeft and PadRight extend a string to a minimum width by prepending or appending a fill character (space by default), making it easy to align text in fixed-width columns without string.Format width specifiers.",
  },
  {
    id: "cs-string-contains-any",
    language: "csharp",
    title: "Contains / StartsWith / EndsWith on strings",
    tag: "snippet",
    code: `string url = "https://example.com/path";

Console.WriteLine(url.Contains("example"));         // True
Console.WriteLine(url.StartsWith("https://"));      // True
Console.WriteLine(url.EndsWith(".com/path"));        // True

// Case-insensitive overload
Console.WriteLine(url.Contains("EXAMPLE",
    StringComparison.OrdinalIgnoreCase));            // True

// Contains(char) — faster than Contains(string) for a single character
Console.WriteLine(url.Contains('/'));                // True`,
    explanation:
      "All three methods accept an optional StringComparison parameter for culture-aware or case-insensitive checks; prefer the char overload of Contains when you're looking for a single character as it avoids allocating a string.",
  },
  {
    id: "cs-string-replace-span",
    language: "csharp",
    title: "string.Replace() and span-based replacement",
    tag: "snippet",
    code: `string s = "foo bar foo";
string replaced = s.Replace("foo", "baz");
Console.WriteLine(replaced);   // "baz bar baz"

// Case-insensitive replace (no built-in; use Regex or this helper)
string ci = s.Replace("FOO", "baz",
    StringComparison.OrdinalIgnoreCase);
Console.WriteLine(ci);   // "baz bar baz"

// Span-based: MemoryExtensions.Replace for in-place mutation (no alloc)
char[] chars = "hello world".ToCharArray();
System.MemoryExtensions.Replace(chars.AsSpan(), 'o', '0');
Console.WriteLine(new string(chars));   // "hell0 w0rld"`,
    explanation:
      "string.Replace returns a new string (strings are immutable); for allocation-free character substitution on a buffer you already own, MemoryExtensions.Replace operates on a Span<char> in place.",
  },
  {
    id: "cs-string-split-options",
    language: "csharp",
    title: "Split() with StringSplitOptions",
    tag: "snippet",
    code: `string csv = "one,,two, ,three";

// Default — keeps empty entries
string[] basic = csv.Split(',');
Console.WriteLine(basic.Length);   // 5  (includes empty strings)

// Remove empty entries
string[] noEmpty = csv.Split(',',
    StringSplitOptions.RemoveEmptyEntries);
Console.WriteLine(noEmpty.Length); // 4  ("one","two"," ","three")

// Remove empty + trim whitespace (.NET 5+)
string[] clean = csv.Split(',',
    StringSplitOptions.RemoveEmptyEntries |
    StringSplitOptions.TrimEntries);
Console.WriteLine(string.Join("|", clean)); // "one|two|three"`,
    explanation:
      "StringSplitOptions.RemoveEmptyEntries drops zero-length tokens; TrimEntries (added in .NET 5) also strips whitespace from each token — combining both handles messy CSV-like input without a post-processing LINQ step.",
  },
  {
    id: "cs-string-join-linq",
    language: "csharp",
    title: "string.Join() and LINQ Aggregate for concatenation",
    tag: "snippet",
    code: `string[] words = ["apple", "banana", "cherry"];

// string.Join — simplest and fastest
string joined = string.Join(", ", words);
Console.WriteLine(joined);   // "apple, banana, cherry"

// Join with IEnumerable<int>
string nums = string.Join("-", Enumerable.Range(1, 5));
Console.WriteLine(nums);     // "1-2-3-4-5"

// LINQ Aggregate — more flexible but slower; avoid for simple joins
string agg = words.Aggregate((a, b) => \`\${a}, \${b}\`);
Console.WriteLine(agg);      // "apple, banana, cherry"`,
    explanation:
      "string.Join is the idiomatic, allocation-efficient way to concatenate a sequence with a separator; Aggregate is more flexible for custom folding logic but allocates an intermediate string at each step.",
  },
  {
    id: "cs-string-empty-check",
    language: "csharp",
    title: "IsNullOrEmpty vs IsNullOrWhiteSpace",
    tag: "snippet",
    code: `string? a = null;
string  b = "";
string  c = "   ";
string  d = "hello";

Console.WriteLine(string.IsNullOrEmpty(a));       // True
Console.WriteLine(string.IsNullOrEmpty(b));       // True
Console.WriteLine(string.IsNullOrEmpty(c));       // False  — spaces!
Console.WriteLine(string.IsNullOrEmpty(d));       // False

Console.WriteLine(string.IsNullOrWhiteSpace(c));  // True  — all whitespace
Console.WriteLine(string.IsNullOrWhiteSpace(d));  // False`,
    explanation:
      "IsNullOrEmpty only catches null and zero-length strings; IsNullOrWhiteSpace also catches strings that contain only spaces, tabs, or newlines — use the latter for user input validation where a blank entry should be rejected.",
  },
  {
    id: "cs-verbatim-string",
    language: "csharp",
    title: "Verbatim string literal @\"...\"",
    tag: "snippet",
    code: `// Regular string — backslashes must be escaped
string path1 = "C:\\\\Users\\\\Alice\\\\file.txt";

// Verbatim string — backslashes are literal
string path2 = @"C:\Users\Alice\file.txt";
Console.WriteLine(path1 == path2);   // True

// Verbatim strings can span multiple lines
string multi = @"Line one
Line two
Line three";

// The only escape in verbatim: "" represents one double-quote
string quote = @"She said ""hello"".";
Console.WriteLine(quote);   // She said "hello".`,
    explanation:
      "Prefixing a string literal with @ disables all backslash escapes, making file paths and regex patterns far more readable; embed a literal double-quote by doubling it (\"\").",
  },
  {
    id: "cs-string-escape",
    language: "csharp",
    title: "Common escape sequences in regular strings",
    tag: "snippet",
    code: `Console.WriteLine("Tab:\\there");     // Tab:	here
Console.WriteLine("New\\nline");       // New
                                       // line
Console.WriteLine("Quote: \\"hi\\""); // Quote: "hi"
Console.WriteLine("Backslash: \\\\"); // Backslash: \\

// Unicode escape
Console.WriteLine("\\u00A9 2024");    // © 2024

// Null char (be careful with string APIs)
string withNull = "a\\0b";
Console.WriteLine(withNull.Length);   // 3  — null char counts`,
    explanation:
      "C# uses the same backslash escape sequences as C and Java; \\u{XXXX} inserts a Unicode code point — be aware that the null character \\0 is a valid string character but can confuse interop code that expects C-style null termination.",
  },
  {
    id: "cs-const-string-concat",
    language: "csharp",
    title: "const string concatenation is done at compile time",
    tag: "snippet",
    code: `const string Prefix  = "Hello, ";
const string Suffix  = " World!";
const string Greeting = Prefix + Suffix;   // compile-time constant
// Greeting == "Hello,  World!"

// Interned at compile time — same reference as the literal
Console.WriteLine(object.ReferenceEquals(Greeting, "Hello,  World!"));  // True

// This is NOT a compile-time const — runtime concatenation
string name = "Alice";
// const string bad = Prefix + name;   // error: not constant`,
    explanation:
      "Concatenating const strings with + is evaluated by the compiler, producing a single interned string literal with zero runtime cost; this is guaranteed by the C# spec, unlike runtime string + which allocates.",
  },
  {
    id: "cs-format-number",
    language: "csharp",
    title: "Numeric format specifiers: N2, C, P",
    tag: "snippet",
    code: `double price = 1234567.891;
double tax   = 0.0875;

Console.WriteLine(\`\${price:N2}\`);    // "1,234,567.89"  — number with 2 decimals
Console.WriteLine(\`\${price:C}\`);     // "$1,234,567.89" — currency (locale-aware)
Console.WriteLine(\`\${tax:P1}\`);      // "8.8%"          — percent, 1 decimal
Console.WriteLine(\`\${price:E2}\`);    // "1.23E+006"     — scientific
Console.WriteLine(\`\${255:X}\`);       // "FF"            — hex (uppercase)
Console.WriteLine(\`\${255:x4}\`);      // "00ff"          — hex lowercase, 4 wide`,
    explanation:
      "Standard numeric format strings are single-letter codes followed by an optional precision digit; N/C/P are locale-sensitive (they use the current culture's thousands separator and currency symbol), while X is always hex.",
  },
  {
    id: "cs-format-date",
    language: "csharp",
    title: "DateTime format specifiers",
    tag: "snippet",
    code: `DateTime dt = new DateTime(2026, 5, 11, 14, 30, 0);

Console.WriteLine(\`\${dt:yyyy-MM-dd}\`);          // "2026-05-11"
Console.WriteLine(\`\${dt:HH:mm:ss}\`);            // "14:30:00"
Console.WriteLine(\`\${dt:yyyy-MM-ddTHH:mm:ss}\`); // "2026-05-11T14:30:00"
Console.WriteLine(\`\${dt:ddd, dd MMM yyyy}\`);    // "Mon, 11 May 2026"
Console.WriteLine(dt.ToString("o"));              // round-trip ISO 8601
Console.WriteLine(dt.ToString("R"));              // RFC 1123 for HTTP headers`,
    explanation:
      "DateTime custom format strings use case-sensitive tokens (M = month, m = minutes; HH = 24-hr, hh = 12-hr); the 'o' round-trip specifier is the safest choice for serialization as it preserves the Kind (Local/Utc/Unspecified).",
  },
  {
    id: "cs-interpolated-multiline",
    language: "csharp",
    title: "Multiline interpolated string with raw string literals",
    tag: "snippet",
    code: `string name  = "Alice";
int    score = 95;

// Raw string literal (C# 11+): at least three quotes on each end
string report = \$"""
    Name:  {name}
    Score: {score}
    Grade: {(score >= 90 ? "A" : "B")}
    """;

Console.WriteLine(report);
// Name:  Alice
// Score: 95
// Grade: A

// The closing """ sets the indentation baseline — leading spaces are stripped`,
    explanation:
      "Raw string literals (\"\"\") never need backslash escapes and the indentation of the closing delimiter determines how much leading whitespace is stripped from each line, making multiline templates clean and readable.",
  },
  {
    id: "cs-string-builder-pool",
    language: "csharp",
    title: "StringBuilderPool pattern to reuse StringBuilder instances",
    tag: "snippet",
    code: `using System.Text;

// Microsoft.Extensions.ObjectPool provides StringBuilderPooledObjectPolicy
// For a lightweight in-house pool:
static class StringBuilderPool
{
    [ThreadStatic] static StringBuilder? _cached;

    public static StringBuilder Rent()
    {
        var sb = _cached ?? new StringBuilder();
        _cached = null;
        sb.Clear();
        return sb;
    }

    public static string ReturnAndGet(StringBuilder sb)
    {
        string result = sb.ToString();
        if (sb.Capacity <= 4096) _cached = sb;
        return result;
    }
}

var sb = StringBuilderPool.Rent();
sb.Append("Hello").Append(", ").Append("World!");
Console.WriteLine(StringBuilderPool.ReturnAndGet(sb));   // "Hello, World!"`,
    explanation:
      "Renting a StringBuilder from a thread-local pool avoids repeated allocation in hot paths; the pool returns the instance after converting to string, capping retained capacity to prevent large buffers from lingering in memory.",
  },

  // ── tag: understanding ───────────────────────────────────────────────────────
  {
    id: "cs-closures-loop-fixed",
    language: "csharp",
    title: "Fix loop variable capture with a local copy",
    tag: "understanding",
    code: `// BUG: all lambdas capture the same variable i
var actions = new List<Action>();
for (int i = 0; i < 3; i++)
    actions.Add(() => Console.WriteLine(i));   // captures reference to i

actions.ForEach(a => a());   // prints 3 3 3  (not 0 1 2)

// FIX: capture a fresh copy per iteration
var fixed_actions = new List<Action>();
for (int i = 0; i < 3; i++)
{
    int copy = i;                              // new variable each iteration
    fixed_actions.Add(() => Console.WriteLine(copy));
}
fixed_actions.ForEach(a => a());   // 0  1  2`,
    explanation:
      "A lambda closes over the variable, not its value; if the variable changes after the lambda is created (like a loop counter) all lambdas see the final value — capturing a local copy per iteration fixes this.",
  },
  {
    id: "cs-delegate-invocation",
    language: "csharp",
    title: "Multicast delegate invocation list and exception handling",
    tag: "understanding",
    code: `Action greet = () => Console.WriteLine("Hello");
greet += () => throw new Exception("oops");
greet += () => Console.WriteLine("Bye");

// Invoking a multicast delegate calls subscribers in order
// An exception in one subscriber stops subsequent ones
try { greet(); }
catch (Exception e) { Console.WriteLine(e.Message); }
// Hello
// oops   ← "Bye" never printed

// To continue after an error, invoke individually:
foreach (Action d in greet.GetInvocationList().Cast<Action>())
{
    try { d(); } catch (Exception e) { Console.WriteLine(\`skip: \${e.Message}\`); }
}`,
    explanation:
      "A multicast delegate calls each subscriber in registration order; if one throws, the rest are skipped — iterate GetInvocationList() with individual try-catch blocks to ensure all handlers run even on partial failure.",
  },
  {
    id: "cs-event-subscribe",
    language: "csharp",
    title: "Event subscribe with += and unsubscribe with -=",
    tag: "understanding",
    code: `class Button
{
    public event Action? Clicked;
    public void Click() => Clicked?.Invoke();
}

var btn = new Button();

void Handler() => Console.WriteLine("clicked!");
btn.Clicked += Handler;   // subscribe

btn.Click();              // "clicked!"

btn.Clicked -= Handler;   // unsubscribe
btn.Click();              // (nothing — no handlers)

// Unsubscribing a handler that was never subscribed is a no-op
btn.Clicked -= Handler;   // no exception`,
    explanation:
      "The -= operator removes the first matching delegate from the invocation list; if the delegate was never added the operation silently succeeds — always balance subscriptions or you risk memory leaks from long-lived publishers holding references.",
  },
  {
    id: "cs-static-ctor-timing",
    language: "csharp",
    title: "Static constructor runs once before first use",
    tag: "understanding",
    code: `class Config
{
    public static readonly string Version;

    static Config()   // called automatically, once, before any member is accessed
    {
        Console.WriteLine("static ctor");
        Version = "1.0.0";
    }
}

Console.WriteLine("before access");
Console.WriteLine(Config.Version);   // triggers static ctor
Console.WriteLine(Config.Version);   // no second call
// before access
// static ctor
// 1.0.0
// 1.0.0`,
    explanation:
      "The static constructor (type initializer) runs at most once per AppDomain, guaranteed to complete before any instance is created or any static member is accessed — ideal for one-time expensive initialisation.",
  },
  {
    id: "cs-field-init-order",
    language: "csharp",
    title: "Instance fields initialize top-to-bottom before the constructor body",
    tag: "understanding",
    code: `class Demo
{
    int a = 1;                     // 1st field initializer
    int b = a + 1;                 // 2nd — can reference earlier fields
    int c = Compute();             // method call in initializer
    static int Compute() { Console.WriteLine("compute"); return 10; }

    public Demo()
    {
        Console.WriteLine(\`a=\${a} b=\${b} c=\${c}\`);   // a=1 b=2 c=10
    }
}

new Demo();
// compute
// a=1 b=2 c=10`,
    explanation:
      "Field initializers run in source order before the constructor body executes; they cannot reference instance members defined later in the same class, but can call static methods — useful for setting sensible defaults without overloading the constructor.",
  },
  {
    id: "cs-prop-init-order",
    language: "csharp",
    title: "Property initializers run after base constructors",
    tag: "understanding",
    code: `class Base
{
    public Base() => Console.WriteLine("Base ctor");
}

class Child : Base
{
    public string Tag { get; } = Greet();   // runs AFTER Base ctor

    static string Greet()
    {
        Console.WriteLine("property init");
        return "child";
    }

    public Child() => Console.WriteLine("Child ctor");
}

new Child();
// Base ctor
// property init
// Child ctor`,
    explanation:
      "In a derived class, field and property initializers run after the base constructor completes but before the derived constructor body — so they can safely rely on any state set by the base constructor.",
  },
  {
    id: "cs-base-ctor-order",
    language: "csharp",
    title: "Base constructor runs before derived constructor body",
    tag: "understanding",
    code: `class Animal
{
    public string Name { get; }
    public Animal(string name)
    {
        Name = name;
        Console.WriteLine(\`Animal(\${name})\`);
    }
}

class Dog : Animal
{
    public string Breed { get; }
    public Dog(string name, string breed) : base(name)   // base runs first
    {
        Breed = breed;
        Console.WriteLine(\`Dog(\${breed})\`);
    }
}

new Dog("Rex", "Husky");
// Animal(Rex)
// Dog(Husky)`,
    explanation:
      "The : base(...) initializer invokes the parent constructor before any statement in the derived constructor body, ensuring the base object is fully initialised before the derived class adds its own state.",
  },
  {
    id: "cs-virtual-in-ctor",
    language: "csharp",
    title: "Calling a virtual method in a constructor uses the derived override",
    tag: "understanding",
    code: `class Base
{
    public Base() => Init();   // virtual call during construction!

    protected virtual void Init() =>
        Console.WriteLine("Base.Init");
}

class Derived : Base
{
    private int _value = 42;

    protected override void Init() =>
        // WARNING: _value may be 0 here (field not yet initialised)
        Console.WriteLine(\`Derived.Init, value=\${_value}\`);
}

new Derived();
// Derived.Init, value=0   ← _value not yet initialised!`,
    explanation:
      "Virtual dispatch is active during construction: if a base constructor calls a virtual method the derived override runs, but derived fields haven't been initialised yet — this is a well-known C# (and Java) trap; keep constructors simple and avoid virtual calls.",
  },
  {
    id: "cs-interface-dispatch",
    language: "csharp",
    title: "Interface dispatch is an indirect call via vtable slot",
    tag: "understanding",
    code: `interface IGreeter { string Greet(string name); }

class FastGreeter : IGreeter
{
    public string Greet(string name) => \`Hello, \${name}!\`;
}

var obj    = new FastGreeter();
IGreeter i = obj;

// Direct call — compiler knows exact type, can inline
string r1 = obj.Greet("Alice");

// Interface call — goes through the interface dispatch table (slower)
string r2 = i.Greet("Alice");

// For hot paths use the concrete type; for flexibility use the interface
// Devirtualization: JIT may still inline if it can prove the type`,
    explanation:
      "An interface call requires an indirect jump through the interface method table, costing a few extra nanoseconds vs a direct virtual call; in tight loops holding the concrete type avoids this, but the JIT often devirtualizes it anyway.",
  },
  {
    id: "cs-type-coercion",
    language: "csharp",
    title: "Implicit numeric promotion: int + long → long",
    tag: "understanding",
    code: `int    a = 1_000_000;
long   b = 3_000_000_000L;
double c = 1.5;

long   r1 = a + b;   // int promoted to long automatically
double r2 = a + c;   // int promoted to double automatically
// long r3 = a + c;  // error: cannot implicitly convert double to long

// Widening promotions that are always safe (no data loss):
// byte → short → int → long → float → double
// int → float may lose precision for large ints (float has 23-bit mantissa)
float f = int.MaxValue;
Console.WriteLine(f == int.MaxValue);   // False — precision lost`,
    explanation:
      "C# promotes narrower integer/float types to wider ones in mixed expressions without a cast; be aware that int→float is widening but can lose precision because float only has 23 mantissa bits.",
  },
  {
    id: "cs-implicit-conversion",
    language: "csharp",
    title: "User-defined implicit operator for seamless conversion",
    tag: "understanding",
    code: `readonly struct Celsius
{
    public double Value { get; }
    public Celsius(double v) => Value = v;

    // Allow: Fahrenheit f = new Celsius(100);
    public static implicit operator Fahrenheit(Celsius c) =>
        new Fahrenheit(c.Value * 9.0 / 5.0 + 32.0);

    public override string ToString() => \`\${Value}°C\`;
}

readonly struct Fahrenheit
{
    public double Value { get; }
    public Fahrenheit(double v) => Value = v;
    public override string ToString() => \`\${Value}°F\`;
}

Celsius   c = new(100);
Fahrenheit f = c;   // implicit — no cast needed
Console.WriteLine(f);   // 212°F`,
    explanation:
      "An implicit conversion operator lets the compiler insert conversions automatically; use it only when the conversion is always lossless and semantically obvious, otherwise a reader can't tell where the conversion happens.",
  },
  {
    id: "cs-explicit-conversion",
    language: "csharp",
    title: "User-defined explicit operator requires a cast",
    tag: "understanding",
    code: `readonly struct Meters
{
    public double Value { get; }
    public Meters(double v) => Value = v;

    // Explicit because precision may be lost (double → int)
    public static explicit operator int(Meters m) => (int)m.Value;
    public override string ToString() => \`\${Value}m\`;
}

Meters distance = new(3.75);
// int i = distance;          // error: no implicit conversion
int   i = (int)distance;      // explicit cast required
Console.WriteLine(i);         // 3  — fractional part truncated`,
    explanation:
      "Explicit conversion operators require the caller to write an explicit cast, signalling that the operation may lose information or fail; this makes potential precision loss or truncation visible at the call site.",
  },
  {
    id: "cs-as-null-trace",
    language: "csharp",
    title: "as returns null on failure instead of throwing",
    tag: "understanding",
    code: `object obj = "hello";

string?  s = obj as string;   // succeeds — s == "hello"
int?     n = obj as int?;     // fails   — n == null (no exception)

Console.WriteLine(s);         // "hello"
Console.WriteLine(n == null); // True

// Compare with a direct cast:
// int bad = (int)obj;        // InvalidCastException at runtime

// Always null-check before use
if (s is not null)
    Console.WriteLine(s.ToUpper());   // "HELLO"`,
    explanation:
      "as performs a checked cast that returns null instead of throwing InvalidCastException when the object is not the target type; pair it with a null-check or use pattern matching (is string s) for a combined cast-and-bind.",
  },
  {
    id: "cs-is-type-cast",
    language: "csharp",
    title: "is pattern: test type and bind variable in one step",
    tag: "understanding",
    code: `object[] items = [42, "hello", 3.14, true, null!];

foreach (object obj in items)
{
    if (obj is int n)
        Console.WriteLine(\`int: \${n * 2}\`);   // int: 84
    else if (obj is string s)
        Console.WriteLine(\`str: \${s.ToUpper()}\`);   // str: HELLO
    else if (obj is double d)
        Console.WriteLine(\`dbl: \${d:F1}\`);   // dbl: 3.1
    // null doesn't match any typed pattern
}`,
    explanation:
      "The is type pattern simultaneously tests the type, casts, and binds the result to a new local variable — eliminating the separate as + null-check pattern and preventing the double-cast smell.",
  },

  // ── tag: structures ──────────────────────────────────────────────────────────
  {
    id: "cs-dictionary-concurrent",
    language: "csharp",
    title: "ConcurrentDictionary<K,V> for thread-safe access",
    tag: "structures",
    code: `using System.Collections.Concurrent;

var scores = new ConcurrentDictionary<string, int>();

scores["Alice"] = 10;
scores.TryAdd("Bob", 5);          // returns false if key exists

// Atomic update — thread-safe without external lock
scores.AddOrUpdate("Alice",
    addValue: 1,
    updateValueFactory: (key, old) => old + 1);   // 11

// GetOrAdd returns existing or inserts new
int val = scores.GetOrAdd("Charlie", 0);
Console.WriteLine(val);   // 0

scores.TryRemove("Bob", out int removed);
Console.WriteLine(removed);   // 5`,
    explanation:
      "ConcurrentDictionary uses fine-grained locking (one lock per bucket) for add/remove and lock-free reads, making it dramatically faster than a Dictionary protected by a single lock under read-heavy workloads.",
  },
  {
    id: "cs-concurrent-queue",
    language: "csharp",
    title: "ConcurrentQueue<T>: lock-free thread-safe FIFO",
    tag: "structures",
    code: `using System.Collections.Concurrent;

var queue = new ConcurrentQueue<string>();

// Producer
queue.Enqueue("first");
queue.Enqueue("second");
queue.Enqueue("third");

// Consumer
while (queue.TryDequeue(out string? item))
    Console.WriteLine(item);
// first
// second
// third

Console.WriteLine(queue.IsEmpty);   // True
Console.WriteLine(queue.Count);     // 0`,
    explanation:
      "ConcurrentQueue is implemented with a lock-free linked list of segments, making Enqueue and TryDequeue safe to call from multiple threads simultaneously without external synchronization.",
  },
  {
    id: "cs-concurrent-stack",
    language: "csharp",
    title: "ConcurrentStack<T>: lock-free thread-safe LIFO",
    tag: "structures",
    code: `using System.Collections.Concurrent;

var stack = new ConcurrentStack<int>();

stack.Push(1);
stack.Push(2);
stack.Push(3);

// TryPop returns false if empty
stack.TryPop(out int top);
Console.WriteLine(top);    // 3  — last in, first out

// Batch operations
stack.PushRange([10, 20, 30]);

int[] popped = new int[2];
int count = stack.TryPopRange(popped);
Console.WriteLine(\`popped \${count}: \${string.Join(", ", popped)}\`);   // 30, 20`,
    explanation:
      "ConcurrentStack uses a compare-and-swap (CAS) loop on its internal linked list head, giving true lock-free semantics; PushRange/TryPopRange batch multiple operations in a single CAS for higher throughput.",
  },
  {
    id: "cs-concurrent-bag",
    language: "csharp",
    title: "ConcurrentBag<T>: unordered thread-safe collection",
    tag: "structures",
    code: `using System.Collections.Concurrent;

var bag = new ConcurrentBag<int>();

// Each thread maintains its own local queue to minimise contention
Parallel.For(0, 10, i => bag.Add(i));

Console.WriteLine(bag.Count);   // 10  (order not guaranteed)

while (bag.TryTake(out int item))
    Console.Write(item + " ");   // any order

// Peek without removing
bag.Add(99);
bag.TryPeek(out int peeked);
Console.WriteLine(peeked);   // 99  (approximately)`,
    explanation:
      "ConcurrentBag is optimized for scenarios where the same thread frequently both adds and removes items (like object pooling); it uses thread-local queues to minimize cross-thread contention, trading ordering guarantees for throughput.",
  },
  {
    id: "cs-blocking-collection",
    language: "csharp",
    title: "BlockingCollection<T> as a bounded producer–consumer queue",
    tag: "structures",
    code: `using System.Collections.Concurrent;

var buffer = new BlockingCollection<int>(boundedCapacity: 3);

// Producer thread
var producer = Task.Run(() => {
    for (int i = 0; i < 6; i++) {
        buffer.Add(i);            // blocks if full
        Console.WriteLine(\`added \${i}\`);
    }
    buffer.CompleteAdding();      // signal no more items
});

// Consumer thread
var consumer = Task.Run(() => {
    foreach (int item in buffer.GetConsumingEnumerable())
        Console.WriteLine(\`consumed \${item}\`);
});

Task.WaitAll(producer, consumer);`,
    explanation:
      "BlockingCollection wraps any IProducerConsumerCollection (ConcurrentQueue by default) and adds bounded capacity that blocks producers when the buffer is full, making it ideal for classic producer–consumer pipelines.",
  },
  {
    id: "cs-channel-bounded",
    language: "csharp",
    title: "Channel.CreateBounded<T> with backpressure",
    tag: "structures",
    code: `using System.Threading.Channels;

var ch = Channel.CreateBounded<int>(new BoundedChannelOptions(capacity: 3)
{
    FullMode = BoundedChannelFullMode.Wait   // writer awaits when full
});

// Async producer
async Task Produce()
{
    for (int i = 0; i < 6; i++)
    {
        await ch.Writer.WriteAsync(i);   // backpressure: waits if full
        Console.WriteLine(\`wrote \${i}\`);
    }
    ch.Writer.Complete();
}

// Async consumer
async Task Consume()
{
    await foreach (int item in ch.Reader.ReadAllAsync())
        Console.WriteLine(\`read \${item}\`);
}

await Task.WhenAll(Produce(), Consume());`,
    explanation:
      "A bounded Channel applies backpressure by making WriteAsync await until a reader frees space; FullMode can also be set to DropOldest or DropWrite for fire-and-forget scenarios where losing items is acceptable.",
  },
  {
    id: "cs-channel-unbounded",
    language: "csharp",
    title: "Channel.CreateUnbounded<T> for unlimited async throughput",
    tag: "structures",
    code: `using System.Threading.Channels;

var ch = Channel.CreateUnbounded<string>(
    new UnboundedChannelOptions { SingleReader = true });

// Writer never blocks — queue grows as needed
ch.Writer.TryWrite("msg1");
ch.Writer.TryWrite("msg2");
ch.Writer.TryWrite("msg3");
ch.Writer.Complete();

// Reader drains asynchronously
await foreach (string msg in ch.Reader.ReadAllAsync())
    Console.WriteLine(msg);
// msg1  msg2  msg3`,
    explanation:
      "An unbounded Channel never blocks the writer but can grow without limit; setting SingleReader/SingleWriter hints to true allows the runtime to use a more efficient lock-free implementation.",
  },
  {
    id: "cs-immutable-array",
    language: "csharp",
    title: "ImmutableArray<T>: zero-overhead read-only array",
    tag: "structures",
    code: `using System.Collections.Immutable;

ImmutableArray<int> arr = [1, 2, 3, 4, 5];

Console.WriteLine(arr[2]);    // 3
Console.WriteLine(arr.Length); // 5

// "Mutation" returns a new array; original unchanged
ImmutableArray<int> bigger = arr.Add(6);
Console.WriteLine(arr.Length);    // 5   — unchanged
Console.WriteLine(bigger.Length); // 6

// Structural equality
var same = ImmutableArray.Create(1, 2, 3, 4, 5);
Console.WriteLine(arr.SequenceEqual(same));   // True`,
    explanation:
      "ImmutableArray<T> is a struct wrapping a plain array, so it has no extra heap allocation and its read performance matches a regular array; use it when you want compile-time proof that no caller can mutate the collection.",
  },
  {
    id: "cs-immutable-list",
    language: "csharp",
    title: "ImmutableList<T> vs ImmutableArray<T>: structural sharing",
    tag: "structures",
    code: `using System.Collections.Immutable;

// ImmutableList — balanced binary tree; O(log n) index, O(log n) add
var list = ImmutableList.Create(1, 2, 3);
var list2 = list.Add(4);         // shares most nodes with list
Console.WriteLine(list.Count);   // 3
Console.WriteLine(list2.Count);  // 4

// ImmutableArray — flat array; O(1) index, O(n) add (full copy)
var arr = ImmutableArray.Create(1, 2, 3);
var arr2 = arr.Add(4);           // full array copy
Console.WriteLine(arr2[3]);      // 4`,
    explanation:
      "Prefer ImmutableArray when the collection is built once and read many times (O(1) indexing, zero allocation overhead); prefer ImmutableList when you need frequent updates, since its tree structure shares nodes across versions.",
  },
  {
    id: "cs-immutable-dict",
    language: "csharp",
    title: "ImmutableDictionary<K,V>: Add and Remove return new instances",
    tag: "structures",
    code: `using System.Collections.Immutable;

var d = ImmutableDictionary<string, int>.Empty
    .Add("a", 1)
    .Add("b", 2)
    .Add("c", 3);

Console.WriteLine(d["b"]);   // 2

var d2 = d.Remove("b");
Console.WriteLine(d.ContainsKey("b"));    // True   — original unchanged
Console.WriteLine(d2.ContainsKey("b"));   // False  — new instance

// SetItem replaces or adds
var d3 = d.SetItem("a", 99);
Console.WriteLine(d["a"]);    // 1
Console.WriteLine(d3["a"]);   // 99`,
    explanation:
      "Every mutating operation on ImmutableDictionary returns a new dictionary that shares as much internal structure as possible with the original; the original variable always points to the unchanged version.",
  },
  {
    id: "cs-frozen-dict",
    language: "csharp",
    title: "FrozenDictionary<K,V> (.NET 8) for read-heavy workloads",
    tag: "structures",
    code: `using System.Collections.Frozen;

// Build once, freeze, then read millions of times
var source = new Dictionary<string, int>
{
    ["apple"]  = 1,
    ["banana"] = 2,
    ["cherry"] = 3,
};

FrozenDictionary<string, int> frozen = source.ToFrozenDictionary();

Console.WriteLine(frozen["banana"]);   // 2
Console.WriteLine(frozen.ContainsKey("apple"));   // True

// FrozenDictionary cannot be modified after creation
// frozen["date"] = 4;   // no such method — it is read-only`,
    explanation:
      "FrozenDictionary performs one-time analysis of the key set during construction to generate a minimal perfect hash, giving lookup times consistently faster than Dictionary for read-only usage patterns.",
  },
  {
    id: "cs-frozen-set",
    language: "csharp",
    title: "FrozenSet<T> (.NET 8) immutable set with fast lookup",
    tag: "structures",
    code: `using System.Collections.Frozen;

FrozenSet<string> validCommands = new[] { "start", "stop", "pause" }
    .ToFrozenSet(StringComparer.OrdinalIgnoreCase);

Console.WriteLine(validCommands.Contains("START")); // True
Console.WriteLine(validCommands.Contains("quit"));  // False
Console.WriteLine(validCommands.Count);             // 3

// Use for hot-path membership tests (keyword tables, allowed values, etc.)
string input = "Stop";
if (validCommands.Contains(input))
    Console.WriteLine("valid command");   // valid command`,
    explanation:
      "FrozenSet uses a perfect hash computed at construction time for O(1) membership tests with lower constant factors than HashSet; ideal for config-driven allow/deny lists that are built once at startup and queried in every request.",
  },
  {
    id: "cs-priority-queue",
    language: "csharp",
    title: "PriorityQueue<TElement,TPriority>: min-heap (.NET 6+)",
    tag: "structures",
    code: `var pq = new PriorityQueue<string, int>();

pq.Enqueue("low",    10);
pq.Enqueue("high",    1);
pq.Enqueue("medium",  5);

while (pq.Count > 0)
{
    string item = pq.Dequeue();   // smallest priority first
    Console.WriteLine(item);
}
// high
// medium
// low

// Peek without removing
pq.Enqueue("urgent", 0);
Console.WriteLine(pq.Peek());    // "urgent"`,
    explanation:
      "PriorityQueue separates element and priority type parameters, so you can use any IComparable as the priority without wrapping your element in a tuple; it is a binary min-heap, so the smallest priority value is dequeued first.",
  },
  {
    id: "cs-ordered-dict",
    language: "csharp",
    title: "OrderedDictionary<TKey,TValue> (.NET 9) preserves insertion order",
    tag: "structures",
    code: `// .NET 9+ — generic insertion-ordered dictionary
var d = new System.Collections.Generic.OrderedDictionary<string, int>();

d.Add("banana", 2);
d.Add("apple",  1);
d.Add("cherry", 3);

foreach (var (key, val) in d)
    Console.WriteLine(\`\${key}: \${val}\`);
// banana: 2    ← insertion order preserved
// apple:  1
// cherry: 3

// Index-based access
(string k, int v) = d.GetAt(0);
Console.WriteLine(k);   // "banana"`,
    explanation:
      "The generic OrderedDictionary (added in .NET 9) maintains insertion order like Python's dict while providing O(1) keyed lookup; before .NET 9 the non-generic System.Collections.Specialized.OrderedDictionary existed but required boxing.",
  },

  // ── tag: caveats ─────────────────────────────────────────────────────────────
  {
    id: "cs-struct-interface-boxing",
    language: "csharp",
    title: "Using a struct through an interface causes boxing",
    tag: "caveats",
    code: `struct Point : IComparable<Point>
{
    public int X, Y;
    public int CompareTo(Point other) => X.CompareTo(other.X);
}

Point p = new Point { X = 1, Y = 2 };

// Direct use — no boxing, lives on stack
Point p2 = p;

// Assigned to interface — boxed onto heap!
IComparable<Point> boxed = p;   // allocates a heap wrapper

// Also boxes: passing to a method that accepts an interface
void Accept(IComparable<Point> c) { }
Accept(p);   // boxing here

// Avoid: use generics to keep the struct on the stack
void AcceptGeneric<T>(T c) where T : IComparable<T> { }
AcceptGeneric(p);   // no boxing`,
    explanation:
      "Assigning a value type to an interface variable wraps it in a heap-allocated box, negating the stack-allocation benefit of structs; use generic constraints (where T : IInterface) to call interface methods without boxing.",
  },
  {
    id: "cs-foreach-readonly",
    language: "csharp",
    title: "foreach loop variable is read-only",
    tag: "caveats",
    code: `int[] nums = [1, 2, 3];

// WRONG — compile error
// foreach (int n in nums)
//     n = n * 2;   // CS1656: cannot assign to 'n'

// FIX 1: use a regular for loop
for (int i = 0; i < nums.Length; i++)
    nums[i] *= 2;

// FIX 2: use LINQ to project into a new collection
int[] doubled = nums.Select(n => n * 2).ToArray();

// FIX 3: for structs — foreach gives a copy; mutations are lost silently
List<(int X, int Y)> points = [(1, 2), (3, 4)];
// foreach (var p in points) p.X = 99;  // silently does nothing`,
    explanation:
      "The foreach iteration variable is read-only by design; for value types it's also a copy, so mutating its fields silently does nothing to the collection — use a for loop with index access when you need to modify elements in place.",
  },
  {
    id: "cs-yield-return-lazy",
    language: "csharp",
    title: "yield return is lazy: body runs only on enumeration",
    tag: "caveats",
    code: `IEnumerable<int> GetNums()
{
    Console.WriteLine("start");   // not called until iterated
    yield return 1;
    Console.WriteLine("after 1");
    yield return 2;
    Console.WriteLine("after 2");
}

var seq = GetNums();         // body not entered yet
Console.WriteLine("got seq");

foreach (int n in seq)       // body runs here
    Console.WriteLine(n);

// got seq
// start
// 1
// after 1
// 2
// after 2`,
    explanation:
      "A yield return iterator is lazy: the method body is not entered when you call it but when the first MoveNext() is called, and execution pauses at each yield — parameter validation inside such methods is deferred too, so validate eagerly before the first yield if needed.",
  },
  {
    id: "cs-deferred-linq",
    language: "csharp",
    title: "LINQ query executes only when enumerated (deferred execution)",
    tag: "caveats",
    code: `var numbers = new List<int> { 1, 2, 3, 4, 5 };
var query = numbers.Where(n => n > 2);   // query not executed yet

numbers.Add(6);   // modify source BEFORE enumeration

foreach (int n in query)   // execution happens here
    Console.Write(n + " ");   // 3 4 5 6  — sees the added 6!

// Force immediate execution with ToList() / ToArray()
var snapshot = numbers.Where(n => n > 2).ToList();   // executed now
numbers.Add(99);
Console.WriteLine(snapshot.Contains(99));   // False — captured before add`,
    explanation:
      "LINQ operators return lazy enumerables that re-evaluate the source each time they're enumerated; call ToList()/ToArray() to snapshot the results immediately, preventing surprise from source mutations or expensive re-execution.",
  },
  {
    id: "cs-closure-this-capture",
    language: "csharp",
    title: "Instance method lambda captures this, which can prevent GC",
    tag: "caveats",
    code: `class DataProcessor
{
    private readonly byte[] _largeBuffer = new byte[10 * 1024 * 1024]; // 10 MB

    public Action GetLambda()
    {
        // This lambda captures 'this' — keeps DataProcessor alive as long as the lambda lives
        return () => Console.WriteLine(_largeBuffer.Length);
    }

    public static Action GetStaticLambda()
    {
        // Capture only what you need to avoid rooting the whole object
        int length = 10 * 1024 * 1024;
        return () => Console.WriteLine(length);   // only int captured
    }
}

var leaked = new DataProcessor().GetLambda();
// The DataProcessor (and its 10 MB buffer) is kept alive by 'leaked'`,
    explanation:
      "Any lambda that references an instance member implicitly captures this, preventing the entire object from being garbage-collected as long as the delegate is reachable — extract only the needed values into local variables to avoid rooting large objects.",
  },
  {
    id: "cs-event-memory-leak",
    language: "csharp",
    title: "Subscribing to a long-lived event without unsubscribing leaks memory",
    tag: "caveats",
    code: `class Publisher
{
    public static event Action? OnTick;
    public static void Tick() => OnTick?.Invoke();
}

class Subscriber
{
    public void Subscribe() => Publisher.OnTick += Handle;
    // Missing: public void Unsubscribe() => Publisher.OnTick -= Handle;
    private void Handle() => Console.WriteLine("tick");
}

var sub = new Subscriber();
sub.Subscribe();

// sub goes out of scope, but OnTick still holds a reference
// → Subscriber is never collected → memory leak

// Fix: implement IDisposable and -= in Dispose()`,
    explanation:
      "A static or long-lived publisher holds a reference to every subscriber delegate; if the subscriber never unsubscribes, neither it nor anything it references can be collected — implement IDisposable and unsubscribe in Dispose().",
  },
  {
    id: "cs-dispose-not-called",
    language: "csharp",
    title: "Forgetting using or Dispose() on IDisposable leaks resources",
    tag: "caveats",
    code: `// WRONG — stream is never closed; file handle leaked
var stream = new FileStream("data.txt", FileMode.Open);
// ... use stream ...
// if an exception is thrown, Dispose never runs!

// CORRECT — using statement calls Dispose() even on exception
using var stream2 = new FileStream("data.txt", FileMode.Open);
// stream2.Dispose() is called at end of enclosing scope

// Equivalent explicit form:
using (var stream3 = new FileStream("data.txt", FileMode.Open))
{
    // use stream3
}  // Dispose() guaranteed here`,
    explanation:
      "IDisposable types (streams, database connections, HTTP clients) hold unmanaged resources that the GC won't reclaim on its schedule; always use the using statement or declaration to guarantee Dispose is called even when exceptions occur.",
  },
  {
    id: "cs-finalizer-suppress",
    language: "csharp",
    title: "Call GC.SuppressFinalize(this) in Dispose() to skip the finalizer",
    tag: "caveats",
    code: `class SafeResource : IDisposable
{
    private bool _disposed;

    public void Dispose()
    {
        if (_disposed) return;
        _disposed = true;
        // Release managed and unmanaged resources here
        GC.SuppressFinalize(this);   // tell GC: no need to call ~SafeResource()
    }

    ~SafeResource()   // finalizer — only called if Dispose wasn't
    {
        // Release ONLY unmanaged resources here (managed may already be gone)
        Console.WriteLine("finalizer ran — Dispose was forgotten!");
    }
}`,
    explanation:
      "Calling GC.SuppressFinalize(this) inside Dispose removes the object from the finalizer queue, avoiding a second GC cycle (finalization happens in a separate pass); without it, every Disposed object still pays the finalization cost.",
  },
  {
    id: "cs-weak-ref-collect",
    language: "csharp",
    title: "WeakReference<T> target may be collected; always use TryGetTarget",
    tag: "caveats",
    code: `class Expensive { public int Value = 42; }

var weak = new WeakReference<Expensive>(new Expensive());

// Force a GC — the Expensive instance may now be collected
GC.Collect();
GC.WaitForPendingFinalizers();

if (weak.TryGetTarget(out Expensive? target))
    Console.WriteLine(\`alive: \${target.Value}\`);
else
    Console.WriteLine("object was collected");   // likely this branch

// NEVER use .Target directly without a null check:
// var t = weak.Target;   // always use TryGetTarget instead`,
    explanation:
      "A WeakReference<T> does not prevent garbage collection; between checking and using the target, a GC cycle can collect it — TryGetTarget atomically checks and retrieves the reference, giving you a strong reference for the duration of the block.",
  },
  {
    id: "cs-thread-abort-removed",
    language: "csharp",
    title: "Thread.Abort() is removed in .NET 5+; use CancellationToken",
    tag: "caveats",
    code: `using System.Threading;

// WRONG — Thread.Abort() throws PlatformNotSupportedException on .NET 5+
// thread.Abort();

// CORRECT — cooperative cancellation via CancellationToken
var cts = new CancellationTokenSource();

var thread = new Thread(() =>
{
    while (!cts.Token.IsCancellationRequested)
    {
        Console.WriteLine("working...");
        Thread.Sleep(100);
    }
    Console.WriteLine("cancelled cleanly");
});

thread.Start();
Thread.Sleep(250);
cts.Cancel();   // signal the thread to stop
thread.Join();`,
    explanation:
      "Thread.Abort injected a ThreadAbortException at a random point, making it impossible to reason about state; CancellationToken is the correct model — it lets the worker check for cancellation at safe points and clean up properly.",
  },
  {
    id: "cs-cancellation-ignore",
    language: "csharp",
    title: "Ignoring CancellationToken makes cancellation a no-op",
    tag: "caveats",
    code: `// BAD — token accepted but never checked
async Task DoWork(CancellationToken ct)
{
    for (int i = 0; i < 1000; i++)
    {
        await Task.Delay(10);   // does NOT use ct!
        Console.WriteLine(i);
    }
}

// GOOD — pass token to awaitables and check periodically
async Task DoWorkFixed(CancellationToken ct)
{
    for (int i = 0; i < 1000; i++)
    {
        ct.ThrowIfCancellationRequested();    // cooperative check
        await Task.Delay(10, ct);             // also cancels the delay
        Console.WriteLine(i);
    }
}`,
    explanation:
      "A CancellationToken only works if you use it; pass it to every awaitable and call ct.ThrowIfCancellationRequested() at loop boundaries so cancellation takes effect promptly rather than after the full operation completes.",
  },
  {
    id: "cs-exception-filter",
    language: "csharp",
    title: "when clause runs before the stack unwinds",
    tag: "caveats",
    code: `// Exception filter: when (condition)
try
{
    throw new HttpRequestException("503 Service Unavailable");
}
catch (HttpRequestException ex) when (ex.Message.Contains("503"))
{
    Console.WriteLine("retryable error: " + ex.Message);
}
catch (HttpRequestException ex)
{
    Console.WriteLine("non-retryable: " + ex.Message);
}

// Key property: the filter runs BEFORE stack unwinding
// So debuggers see the full original call stack when the filter fires`,
    explanation:
      "Exception filters (when) are evaluated while the stack is still intact, so a debugger or logging framework can see the original throw site; a catch that re-throws destroys that information — filters are the superior choice for conditional handling.",
  },
  {
    id: "cs-stack-overflow",
    language: "csharp",
    title: "StackOverflowException cannot be caught and terminates the process",
    tag: "caveats",
    code: `// StackOverflowException CANNOT be caught with try/catch
// The CLR terminates the process immediately

// Bad: unbounded recursion
// int Factorial(int n) => n <= 1 ? 1 : n * Factorial(n - 1);
// Factorial(100_000);   // StackOverflowException → process dies

// Fix 1: add a depth guard
int Factorial(int n, int depth = 0)
{
    if (depth > 10_000) throw new InvalidOperationException("too deep");
    return n <= 1 ? 1 : n * Factorial(n - 1, depth + 1);
}

// Fix 2: use iteration
long FactIter(int n) { long r = 1; for (int i = 2; i <= n; i++) r *= i; return r; }`,
    explanation:
      "StackOverflowException bypasses all exception handlers and terminates the process — the only defenses are guarding recursion depth, converting deep recursion to iteration, or using trampolining for algorithms that require deep stacks.",
  },
  {
    id: "cs-out-of-memory",
    language: "csharp",
    title: "Large array allocation failure throws OutOfMemoryException",
    tag: "caveats",
    code: `try
{
    // Allocate 4 GB — likely to fail on 32-bit or low-memory systems
    byte[] huge = new byte[4L * 1024 * 1024 * 1024];
}
catch (OutOfMemoryException)
{
    Console.WriteLine("allocation failed");
}

// Prefer streaming / chunked allocation for large data
using var fs = new FileStream("big.bin", FileMode.Open);
byte[] chunk = new byte[64 * 1024];
int read;
while ((read = fs.Read(chunk)) > 0)
    Process(chunk, read);   // process in 64 KB chunks`,
    explanation:
      "OutOfMemoryException can be caught (unlike StackOverflowException) but indicates the GC already tried to collect; preventing it by streaming data in fixed-size chunks is far better than trying to recover after the fact.",
  },

  // ── tag: types ───────────────────────────────────────────────────────────────
  {
    id: "cs-nint-platform",
    language: "csharp",
    title: "nint/nuint: native-sized integers",
    tag: "types",
    code: `// nint = IntPtr size: 32-bit on 32-bit OS, 64-bit on 64-bit OS
nint  a = 42;
nuint b = 100;

Console.WriteLine(nint.Size);   // 8  (on 64-bit)
Console.WriteLine(nint.MaxValue); // 9223372036854775807  (on 64-bit)

// Useful for interop and pointer arithmetic
unsafe
{
    int[] arr = [1, 2, 3];
    fixed (int* ptr = arr)
    {
        nint offset = 1;
        Console.WriteLine(*(ptr + offset));   // 2
    }
}`,
    explanation:
      "nint and nuint are compiler aliases for IntPtr/UIntPtr that support arithmetic operators, making low-level interop and pointer math look like regular integer code while adapting to the platform's pointer size.",
  },
  {
    id: "cs-half-type",
    language: "csharp",
    title: "Half: 16-bit float for ML/GPU interop",
    tag: "types",
    code: `Half h = (Half)3.14f;
Console.WriteLine(h);            // 3.14   (approx — only ~3 significant digits)
Console.WriteLine(Half.MaxValue); // 65504
Console.WriteLine(Half.MinValue); // -65504
Console.WriteLine(Half.Epsilon);  // 5.96E-08

// Convert between Half and float without loss of precision
float f = (float)h;
Half  h2 = (Half)1.0f;
Console.WriteLine(h2 == Half.One);   // True

// Typical use: ML weight arrays, GPU buffers
Half[] weights = new Half[1024];   // half the memory of float[]`,
    explanation:
      "Half (System.Half, added in .NET 5) is a 16-bit IEEE 754 float with 5 exponent and 10 mantissa bits; it has low precision and a limited range (~6.1e-5 to 65504) but halves memory footprint for ML inference weight buffers.",
  },
  {
    id: "cs-biginteger-type",
    language: "csharp",
    title: "BigInteger for arbitrary-precision integers",
    tag: "types",
    code: `using System.Numerics;

BigInteger factorial = 1;
for (int i = 2; i <= 50; i++)
    factorial *= i;
Console.WriteLine(factorial);
// 30414093201713378043612608166979581188299763898377856300

BigInteger a = BigInteger.Pow(2, 1000);
Console.WriteLine(a.ToString().Length);   // 302 digits

// Parse from string
BigInteger parsed = BigInteger.Parse("123456789012345678901234567890");
Console.WriteLine(parsed % 7);   // 0`,
    explanation:
      "BigInteger from System.Numerics handles integers of any size, limited only by available memory; it is slower than fixed-size integer types but essential for cryptography, combinatorics, and any computation where overflow is not acceptable.",
  },
  {
    id: "cs-complex-type",
    language: "csharp",
    title: "System.Numerics.Complex for complex numbers",
    tag: "types",
    code: `using System.Numerics;

Complex a = new Complex(3, 4);   // 3 + 4i
Complex b = new Complex(1, -2);  // 1 - 2i

Console.WriteLine(a + b);                 // (4, 2)   → 4 + 2i
Console.WriteLine(a * b);                 // (11, -2) → 11 - 2i
Console.WriteLine(Complex.Abs(a));        // 5        — magnitude
Console.WriteLine(a.Phase);               // 0.9272... radians — angle
Console.WriteLine(Complex.Conjugate(a));  // (3, -4)

// Euler's formula: e^(i*pi) = -1
Complex euler = Complex.Exp(new Complex(0, Math.PI));
Console.WriteLine(euler.Real);    // ~-1`,
    explanation:
      "Complex supports all standard arithmetic operators and provides Abs (magnitude), Phase (angle), Conjugate, Exp, Log, Pow, and trig functions, making it a complete complex-number arithmetic library without external dependencies.",
  },
  {
    id: "cs-bitwise-ops",
    language: "csharp",
    title: "Bitwise operators & | ^ ~ << >>",
    tag: "types",
    code: `int a = 0b_1010;   // 10
int b = 0b_1100;   // 12

Console.WriteLine(a & b);    // 8   = 0b_1000  AND
Console.WriteLine(a | b);    // 14  = 0b_1110  OR
Console.WriteLine(a ^ b);    // 6   = 0b_0110  XOR
Console.WriteLine(~a);       // -11 (two's complement)
Console.WriteLine(a << 1);   // 20  = 0b_10100
Console.WriteLine(a >> 1);   // 5   = 0b_0101

// Common trick: test bit N
bool bit2Set = (a & (1 << 2)) != 0;
Console.WriteLine(bit2Set);  // True (bit 2 of 10 = 1)`,
    explanation:
      "Bitwise operators work on the binary representation of integers; the shift operators << and >> multiply and divide by powers of two, while & / | / ^ are used for flag manipulation, masking, and XOR-based hashing.",
  },
  {
    id: "cs-shift-ops",
    language: "csharp",
    title: ">>> unsigned right shift (C# 11+) vs >> signed shift",
    tag: "types",
    code: `int signed   = -1;                        // all 1 bits
uint unsigned = uint.MaxValue;            // all 1 bits

// >> on int is signed: sign bit is extended
Console.WriteLine(signed >> 1);          // -1  — still all 1s

// >>> is unsigned: zero is shifted in from the left (C# 11+)
Console.WriteLine(signed >>> 1);         // 2147483647  — top bit cleared

// For uint >> and >>> are identical (uint has no sign bit)
Console.WriteLine(unsigned >> 1);        // 2147483647
Console.WriteLine(unsigned >>> 1);       // 2147483647`,
    explanation:
      "The new >>> operator (C# 11) performs a logical right shift that always fills the vacated bits with zeros, regardless of sign — previously you had to cast to uint or use & masks to achieve this for negative int values.",
  },
  {
    id: "cs-unchecked-arith",
    language: "csharp",
    title: "unchecked context allows wrapping arithmetic",
    tag: "types",
    code: `int max = int.MaxValue;   // 2147483647

// Default (unchecked by default in C#) — silently wraps
int wrapped = max + 1;
Console.WriteLine(wrapped);   // -2147483648  — overflow wraps

// checked block — throws OverflowException instead
try
{
    checked { int bad = max + 1; }
}
catch (OverflowException)
{
    Console.WriteLine("overflow detected");
}

// unchecked is explicit (useful inside a checked context)
int hash = unchecked(max * 31 + 17);   // intentional wrap for hashing`,
    explanation:
      "C# arithmetic is unchecked by default for performance; wrap sensitive calculations in a checked block or method to get OverflowException; use unchecked explicitly inside a checked context when overflow is intentional (e.g., hash combining).",
  },
  {
    id: "cs-generic-math-interface",
    language: "csharp",
    title: "INumber<T> for generic math (C# 11 / .NET 7)",
    tag: "types",
    code: `using System.Numerics;

// Works with int, double, float, decimal, Half, BigInteger, etc.
T Sum<T>(IEnumerable<T> values) where T : INumber<T>
{
    T total = T.Zero;
    foreach (T v in values) total += v;
    return total;
}

Console.WriteLine(Sum(new[] { 1, 2, 3 }));            // 6
Console.WriteLine(Sum(new[] { 1.5, 2.5, 3.0 }));      // 7
Console.WriteLine(Sum(new[] { (Half)1, (Half)2 }));   // 3`,
    explanation:
      "INumber<T> (from System.Numerics, .NET 7+) is a static abstract interface that exposes Zero, One, and arithmetic operators for all numeric built-in types, enabling truly generic numeric algorithms without reflection or boxing.",
  },
  {
    id: "cs-numeric-interface",
    language: "csharp",
    title: "IComparable<T> and IEquatable<T> on numeric types",
    tag: "types",
    code: `// int implements IComparable<int> and IEquatable<int>
int a = 3, b = 5;

IComparable<int> ca = a;
Console.WriteLine(ca.CompareTo(b));     // -1  (a < b)
Console.WriteLine(ca.CompareTo(3));     //  0  (equal)
Console.WriteLine(ca.CompareTo(1));     //  1  (a > 1)

IEquatable<int> eq = a;
Console.WriteLine(eq.Equals(3));        // True
Console.WriteLine(eq.Equals(4));        // False

// Generic utility using both interfaces
T Clamp<T>(T val, T min, T max)
    where T : IComparable<T>
    => val.CompareTo(min) < 0 ? min : val.CompareTo(max) > 0 ? max : val;

Console.WriteLine(Clamp(10, 1, 5));   // 5`,
    explanation:
      "All numeric types implement IComparable<T> (for ordering) and IEquatable<T> (for value equality without boxing); constraining generic methods with these interfaces lets you write ordering/equality logic that works across all numerics.",
  },
  {
    id: "cs-comparable-generic",
    language: "csharp",
    title: "IComparable<T> (generic) vs IComparable (legacy)",
    tag: "types",
    code: `// Legacy IComparable — takes object, requires boxing for value types
int a = 5;
IComparable legacy = a;
Console.WriteLine(legacy.CompareTo(3));    // 1  (but boxed!)
// legacy.CompareTo("x") compiles — runtime exception

// Generic IComparable<T> — type-safe, no boxing
IComparable<int> generic = a;
Console.WriteLine(generic.CompareTo(3));   // 1  — no boxing
// generic.CompareTo("x")  // CS1503 compile-time error

// Array.Sort / List<T>.Sort use IComparable<T> when available
var list = new List<int> { 3, 1, 2 };
list.Sort();
Console.WriteLine(string.Join(", ", list));   // 1, 2, 3`,
    explanation:
      "IComparable<T> is the preferred form: it is type-safe, avoids boxing for value types, and produces a compile-time error when compared to the wrong type; IComparable (non-generic) is kept for backward compatibility.",
  },
  {
    id: "cs-equatable-generic",
    language: "csharp",
    title: "IEquatable<T> avoids boxing in equality checks",
    tag: "types",
    code: `struct Point : IEquatable<Point>
{
    public int X, Y;
    public bool Equals(Point other) => X == other.X && Y == other.Y;  // no boxing
    public override bool Equals(object? obj) => obj is Point p && Equals(p);
    public override int GetHashCode() => HashCode.Combine(X, Y);
}

Point p1 = new() { X = 1, Y = 2 };
Point p2 = new() { X = 1, Y = 2 };

Console.WriteLine(p1.Equals(p2));          // True — IEquatable<Point> path
Console.WriteLine(p1.Equals((object)p2));  // True — virtual object path (boxes!)
Console.WriteLine(EqualityComparer<Point>.Default.Equals(p1, p2));  // True, no box`,
    explanation:
      "Implementing IEquatable<T> on a struct provides a strongly-typed Equals(T) overload that the generic collections and EqualityComparer<T>.Default use — avoiding the object boxing that the virtual Equals(object) overload incurs.",
  },
  {
    id: "cs-formattable-type",
    language: "csharp",
    title: "IFormattable for custom format string support",
    tag: "types",
    code: `struct Temperature : IFormattable
{
    private readonly double _celsius;
    public Temperature(double c) => _celsius = c;

    public string ToString(string? format, IFormatProvider? provider) =>
        (format?.ToUpperInvariant()) switch
        {
            "F" => \`\${_celsius * 9 / 5 + 32:F1}°F\`,
            "K" => \`\${_celsius + 273.15:F2}K\`,
            _   => \`\${_celsius:F1}°C\`,
        };

    public override string ToString() => ToString(null, null);
}

var t = new Temperature(100);
Console.WriteLine(\`{t}\`);      // 100.0°C
Console.WriteLine(\`{t:F}\`);    // 212.0°F
Console.WriteLine(\`{t:K}\`);    // 373.15K`,
    explanation:
      "Implementing IFormattable lets your type respond to format strings in interpolated strings and string.Format, just like DateTime and numeric types do — the format string is passed to your ToString(format, provider) method.",
  },
  {
    id: "cs-span-vs-array",
    language: "csharp",
    title: "Span<T> is stack-only and cannot be stored on the heap",
    tag: "types",
    code: `// Span<T> is a ref struct — lives only on the stack
Span<int> span = stackalloc int[4] { 1, 2, 3, 4 };
span[0] = 10;
Console.WriteLine(span[0]);   // 10

// Slice without allocation
Span<int> middle = span.Slice(1, 2);
Console.WriteLine(middle.Length);   // 2

// CANNOT store Span<T> in a class field or capture in a lambda
// class Holder { Span<int> Data; }   // CS8345: field cannot be of Span type
// Action act = () => Console.WriteLine(span[0]);  // CS8175: lambda capture`,
    explanation:
      "Span<T> is a ref struct restricted to the stack to guarantee it never outlives the buffer it points to; for heap-storable slices use Memory<T>, which can be stored in fields and passed across async boundaries.",
  },
  {
    id: "cs-memory-vs-array",
    language: "csharp",
    title: "Memory<T> is a heap-safe slice storable in class fields",
    tag: "types",
    code: `class Buffer
{
    private readonly Memory<byte> _data;   // OK — Memory<T> can be a field

    public Buffer(byte[] array, int offset, int length)
        => _data = array.AsMemory(offset, length);

    public void Process()
    {
        Span<byte> span = _data.Span;   // borrow as Span for synchronous work
        span.Fill(0);                   // zero the buffer
    }

    public async Task SendAsync(Stream stream)
    {
        await stream.WriteAsync(_data);  // Memory<T> works with async APIs
    }
}

byte[] raw = new byte[1024];
var buf = new Buffer(raw, 0, 512);
buf.Process();`,
    explanation:
      "Memory<T> wraps an array, ArraySegment, or MemoryManager with heap-safe slice semantics; convert to Span<T> with .Span for synchronous work, and pass Memory<T> directly to async methods that accept it.",
  },

  // ── tag: families ────────────────────────────────────────────────────────────
  {
    id: "cs-ienumerable-iasyncenumerable",
    language: "csharp",
    title: "IEnumerable<T> (sync) vs IAsyncEnumerable<T> (async streaming)",
    tag: "families",
    code: `// Sync — blocks the thread while fetching each item
IEnumerable<int> SyncSeq()
{
    for (int i = 0; i < 3; i++) { Thread.Sleep(10); yield return i; }
}

foreach (int n in SyncSeq()) Console.WriteLine(n);

// Async — yields without blocking; great for DB/HTTP streaming
async IAsyncEnumerable<int> AsyncSeq()
{
    for (int i = 0; i < 3; i++) { await Task.Delay(10); yield return i; }
}

await foreach (int n in AsyncSeq()) Console.WriteLine(n);`,
    explanation:
      "IAsyncEnumerable<T> lets an iterator yield values asynchronously with await between yields; use it when each item requires I/O (database cursor, HTTP chunked response) so the thread is free while waiting.",
  },
  {
    id: "cs-task-thread-process",
    language: "csharp",
    title: "Task vs Thread vs Process",
    tag: "families",
    code: `// Task — unit of async work; backed by ThreadPool; cheapest
Task t = Task.Run(() => Console.WriteLine("task"));
await t;

// Thread — OS thread; heavier (1 MB stack); use for long CPU-bound work
var thread = new Thread(() => Console.WriteLine("thread"));
thread.Start(); thread.Join();

// Process — fully isolated OS process; separate memory space
var proc = System.Diagnostics.Process.Start("echo", "hello");
proc?.WaitForExit();

// Rule of thumb:
// I/O-bound → async/await + Task
// CPU-bound → Task.Run (ThreadPool) or dedicated Thread
// Isolation  → Process`,
    explanation:
      "Task is the lightest unit (reuses pool threads, async-friendly); Thread gives a dedicated OS thread useful for long-running CPU work; Process provides full OS isolation at the cost of startup time and IPC overhead.",
  },
  {
    id: "cs-mutex-monitor-lock",
    language: "csharp",
    title: "Mutex (cross-process) vs Monitor/lock (in-process)",
    tag: "families",
    code: `// lock — syntactic sugar over Monitor.Enter/Exit; in-process only
object _lock = new object();
lock (_lock) { Console.WriteLine("inside lock"); }

// Monitor — same semantics; allows timeout and TryEnter
bool acquired = Monitor.TryEnter(_lock, TimeSpan.FromMilliseconds(100));
if (acquired) { Monitor.Exit(_lock); }

// Mutex — kernel object; works across processes; slower
using var mutex = new Mutex(false, "Global\\\\MyAppMutex");
if (mutex.WaitOne(TimeSpan.Zero))
{
    Console.WriteLine("acquired cross-process mutex");
    mutex.ReleaseMutex();
}`,
    explanation:
      "lock/Monitor operate entirely in user space and are the fastest in-process synchronization primitives; Mutex is a kernel object that works across process boundaries for system-wide mutual exclusion but has orders-of-magnitude higher overhead.",
  },
  {
    id: "cs-semaphore-countdown",
    language: "csharp",
    title: "SemaphoreSlim (async) vs CountdownEvent (barrier-like)",
    tag: "families",
    code: `// SemaphoreSlim — throttle concurrency; async WaitAsync available
var sem = new SemaphoreSlim(initialCount: 3);   // 3 concurrent slots

async Task Worker(int id)
{
    await sem.WaitAsync();
    try { Console.WriteLine(\`\${id} running\`); await Task.Delay(50); }
    finally { sem.Release(); }
}

await Task.WhenAll(Enumerable.Range(0, 6).Select(Worker));

// CountdownEvent — wait until N tasks signal completion
var cde = new CountdownEvent(3);
for (int i = 0; i < 3; i++)
    Task.Run(() => { Thread.Sleep(10); cde.Signal(); });
cde.Wait();   // blocks until all 3 have signalled
Console.WriteLine("all done");`,
    explanation:
      "SemaphoreSlim limits how many tasks run at once (rate limiting, connection pools) and has async WaitAsync; CountdownEvent blocks until a known number of tasks have all signalled completion — more like a join barrier.",
  },
  {
    id: "cs-barrier-spinwait",
    language: "csharp",
    title: "Barrier for phased parallel work vs SpinWait for busy-wait",
    tag: "families",
    code: `// Barrier — synchronize N threads at phase boundaries
int N = 3;
var barrier = new Barrier(N, b =>
    Console.WriteLine(\`--- phase \${b.CurrentPhaseNumber} done ---\`));

for (int i = 0; i < N; i++)
{
    int id = i;
    Task.Run(() => {
        Console.WriteLine(\`\${id}: phase 0\`);
        barrier.SignalAndWait();   // everyone waits here
        Console.WriteLine(\`\${id}: phase 1\`);
        barrier.SignalAndWait();
    });
}

// SpinWait — busy-wait for very short waits to avoid context switch
var sw = new SpinWait();
bool ready = false;
Task.Run(() => { Thread.Sleep(1); ready = true; });
while (!ready) sw.SpinOnce();   // spins, then yields after threshold`,
    explanation:
      "Barrier coordinates multiple threads through phases, calling an optional action between phases; SpinWait is a hint to the JIT/OS to use CPU-friendly spinning before yielding, reducing context-switch overhead for sub-millisecond waits.",
  },
  {
    id: "cs-volatile-interlocked",
    language: "csharp",
    title: "volatile (visibility) vs Interlocked (atomic operations)",
    tag: "families",
    code: `// volatile — guarantees all threads see the latest write; no reordering
volatile bool _stop = false;
var reader = Task.Run(() => { while (!_stop) Thread.SpinWait(1); });
Thread.Sleep(10);
_stop = true;          // visible to reader without cache tricks
await reader;

// Interlocked — atomic read-modify-write; no lock needed
int counter = 0;
Parallel.For(0, 100_000, _ => Interlocked.Increment(ref counter));
Console.WriteLine(counter);   // exactly 100000

// Interlocked.CompareExchange — optimistic locking
int expected = 0;
int result = Interlocked.CompareExchange(ref counter, 1, expected);
Console.WriteLine(result);   // previous value`,
    explanation:
      "volatile prevents compiler/CPU caching of a field and ensures visibility across threads but does not make compound operations atomic; Interlocked provides truly atomic operations (increment, add, exchange, compareExchange) without a lock.",
  },
  {
    id: "cs-rwlock-monitor",
    language: "csharp",
    title: "ReaderWriterLockSlim: multiple readers, single writer",
    tag: "families",
    code: `var rwl = new ReaderWriterLockSlim();
var cache = new Dictionary<string, string>();

void Read(string key)
{
    rwl.EnterReadLock();
    try { Console.WriteLine(cache.TryGetValue(key, out var v) ? v : "miss"); }
    finally { rwl.ExitReadLock(); }
}

void Write(string key, string value)
{
    rwl.EnterWriteLock();
    try { cache[key] = value; }
    finally { rwl.ExitWriteLock(); }
}

Write("x", "hello");
Read("x");    // "hello"
Read("x");    // "hello" — two readers can run concurrently`,
    explanation:
      "ReaderWriterLockSlim allows unlimited concurrent readers but requires an exclusive write lock; for read-heavy, write-rare caches it outperforms a plain lock by allowing all reads to proceed in parallel.",
  },
  {
    id: "cs-lazy-evaluated",
    language: "csharp",
    title: "Lazy<T> (deferred creation) vs Func<T> (repeated computation)",
    tag: "families",
    code: `// Lazy<T> — creates the value once, then caches it; thread-safe by default
var lazyCfg = new Lazy<string>(() => {
    Console.WriteLine("loading...");
    return "config-value";
});

Console.WriteLine(lazyCfg.Value);   // "loading..." then "config-value"
Console.WriteLine(lazyCfg.Value);   // "config-value" only — no reload

// Func<T> — recomputes every time it is invoked
Func<string> recompute = () => {
    Console.WriteLine("computing...");
    return DateTime.UtcNow.ToString("o");
};

Console.WriteLine(recompute());   // computes
Console.WriteLine(recompute());   // computes again`,
    explanation:
      "Lazy<T> is a one-time initializer that caches the result and is thread-safe by default (LazyThreadSafetyMode.ExecutionAndPublication); Func<T> is a plain delegate that recomputes on every call — choose Lazy when the value is expensive and stable.",
  },
  {
    id: "cs-concurrent-vs-synchronized",
    language: "csharp",
    title: "ConcurrentDictionary vs lock+Dictionary: performance",
    tag: "families",
    code: `// lock + Dictionary — simple, one lock for everything
var dict = new Dictionary<string, int>();
var lck  = new object();

void LockedUpdate(string key)
{
    lock (lck) { dict[key] = dict.GetValueOrDefault(key) + 1; }
}

// ConcurrentDictionary — fine-grained per-bucket locking
var cd = new System.Collections.Concurrent.ConcurrentDictionary<string, int>();

void ConcurrentUpdate(string key)
{
    cd.AddOrUpdate(key, 1, (_, old) => old + 1);
}

// ConcurrentDictionary wins under high read concurrency
// lock+Dictionary wins when contention is low (simpler, less overhead)`,
    explanation:
      "ConcurrentDictionary outperforms a single-lock Dictionary as reader concurrency grows because its per-bucket locks allow parallel reads; for low-contention or write-heavy workloads, a plain lock is simpler and has less overhead.",
  },
  {
    id: "cs-channel-vs-queue",
    language: "csharp",
    title: "Channel<T> (async-friendly) vs BlockingCollection<T> (blocking)",
    tag: "families",
    code: `// Channel<T> — designed for async/await; no thread blocking
using System.Threading.Channels;
var ch = Channel.CreateUnbounded<int>();
await ch.Writer.WriteAsync(1);
int v = await ch.Reader.ReadAsync();

// BlockingCollection<T> — designed for threads; blocks the thread
using System.Collections.Concurrent;
var bc = new BlockingCollection<int>(3);
bc.Add(1);                          // blocks if full (synchronous)
int val = bc.Take();                 // blocks if empty (synchronous)
// GetConsumingEnumerable() is the idiomatic consumer loop`,
    explanation:
      "Channel<T> integrates natively with async/await and the thread pool, making it the right choice for async pipelines; BlockingCollection is the thread-based equivalent that blocks the calling thread, fitting classic producer–consumer Thread code.",
  },
  {
    id: "cs-pipe-stream",
    language: "csharp",
    title: "System.IO.Pipelines.Pipe for high-throughput I/O",
    tag: "families",
    code: `using System.IO.Pipelines;

var pipe = new Pipe();

async Task ProduceAsync(PipeWriter writer)
{
    byte[] data = System.Text.Encoding.UTF8.GetBytes("Hello, Pipe!");
    await writer.WriteAsync(data);
    await writer.CompleteAsync();
}

async Task ConsumeAsync(PipeReader reader)
{
    while (true)
    {
        var result = await reader.ReadAsync();
        var buffer = result.Buffer;
        Console.WriteLine(System.Text.Encoding.UTF8.GetString(buffer));
        reader.AdvanceTo(buffer.End);
        if (result.IsCompleted) break;
    }
}

await Task.WhenAll(ProduceAsync(pipe.Writer), ConsumeAsync(pipe.Reader));`,
    explanation:
      "System.IO.Pipelines provides a high-performance backpressure-aware pipeline with pooled buffer management; it is the foundation of ASP.NET Core's I/O stack and avoids the double-copy overhead of Stream-based producer–consumer patterns.",
  },
  {
    id: "cs-memory-stream",
    language: "csharp",
    title: "MemoryStream vs ArraySegment<byte> vs Memory<byte>",
    tag: "families",
    code: `byte[] buf = new byte[1024];

// MemoryStream — Stream API over a byte array; allocates internally
using var ms = new MemoryStream();
ms.Write(buf, 0, 100);
byte[] all = ms.ToArray();   // copy out

// ArraySegment<byte> — offset+length view; legacy, mutable
var seg = new ArraySegment<byte>(buf, 0, 100);
Console.WriteLine(seg.Count);   // 100

// Memory<byte> — modern, Span/async compatible, struct (no heap alloc)
Memory<byte> mem = buf.AsMemory(0, 100);
Span<byte> span = mem.Span;    // sync access
// await stream.WriteAsync(mem);  // async write without copy`,
    explanation:
      "MemoryStream is convenient for Stream-based APIs but copies on ToArray(); ArraySegment is a legacy struct for slicing; Memory<byte> is the modern choice that works with both async APIs and Span for zero-copy synchronous processing.",
  },
  {
    id: "cs-span-memory-cmp",
    language: "csharp",
    title: "Span<T> (stack) vs Memory<T> (heap-safe) vs ArraySegment<T> (legacy)",
    tag: "families",
    code: `byte[] array = new byte[256];

// Span<T> — ref struct; stack only; fastest
Span<byte> span = array.AsSpan(0, 64);

// Memory<T> — can be stored in fields, awaited; slight overhead
Memory<byte> mem = array.AsMemory(0, 64);

// ArraySegment<T> — oldest; works with older APIs; implements IList<T>
var seg = new ArraySegment<byte>(array, 0, 64);

// Conversion paths
Span<byte>   fromMem = mem.Span;         // Memory → Span (sync only)
Memory<byte> fromSeg = seg;              // implicit: ArraySegment → Memory
// Memory<byte> fromSpan = span;         // NOT possible — Span is stack-only`,
    explanation:
      "The three types form a hierarchy: Span<T> is fastest (stack-only, no heap alloc); Memory<T> is the heap-safe wrapper for async and field storage; ArraySegment<T> is the legacy form still required by some older APIs.",
  },
  {
    id: "cs-ref-value-inout",
    language: "csharp",
    title: "ref (bidirectional) vs in (read-only ref) vs out (write-only ref)",
    tag: "families",
    code: `void Increment(ref int x) => x++;        // ref: read and write
void Display(in DateTime dt)             // in: read-only; avoids copy of large struct
    => Console.WriteLine(dt.Year);
void Parse(string s, out int result)     // out: must assign before return
    => result = int.Parse(s);

int counter = 5;
Increment(ref counter);
Console.WriteLine(counter);   // 6

Display(in DateTime.UtcNow);  // no copy of DateTime struct

Parse("42", out int parsed);
Console.WriteLine(parsed);    // 42`,
    explanation:
      "ref passes by reference for two-way sharing; in passes a read-only reference (prevents mutation and copies) ideal for large structs; out is like ref but the callee must write before returning — the compiler enforces this.",
  },

  // ── tag: classes ─────────────────────────────────────────────────────────────
  {
    id: "cs-abstract-template",
    language: "csharp",
    title: "Abstract class implementing Template Method pattern",
    tag: "classes",
    code: `abstract class DataExporter
{
    // Template method — defines the algorithm skeleton
    public void Export(string path)
    {
        var data = FetchData();
        var formatted = Format(data);
        Write(path, formatted);
    }

    protected abstract IEnumerable<string> FetchData();
    protected abstract string Format(IEnumerable<string> data);

    protected virtual void Write(string path, string content)
        => File.WriteAllText(path, content);   // default: write to file
}

class CsvExporter : DataExporter
{
    protected override IEnumerable<string> FetchData() => ["a,1", "b,2"];
    protected override string Format(IEnumerable<string> d) => string.Join("\n", d);
}`,
    explanation:
      "Template Method defines the overall algorithm in the base class with abstract steps that subclasses override; the base class controls the structure while subclasses fill in the variable parts — preventing subclasses from changing the order of steps.",
  },
  {
    id: "cs-abstract-factory",
    language: "csharp",
    title: "Abstract Factory with dependency injection",
    tag: "classes",
    code: `interface IButton  { void Render(); }
interface ICheckbox { void Render(); }

interface IUiFactory
{
    IButton  CreateButton();
    ICheckbox CreateCheckbox();
}

class DarkButton : IButton   { public void Render() => Console.WriteLine("Dark button"); }
class DarkCheckbox : ICheckbox { public void Render() => Console.WriteLine("Dark checkbox"); }

class DarkThemeFactory : IUiFactory
{
    public IButton   CreateButton()   => new DarkButton();
    public ICheckbox CreateCheckbox() => new DarkCheckbox();
}

class App
{
    private readonly IUiFactory _factory;
    public App(IUiFactory factory) => _factory = factory;  // DI
    public void Render() { _factory.CreateButton().Render(); _factory.CreateCheckbox().Render(); }
}

new App(new DarkThemeFactory()).Render();`,
    explanation:
      "Abstract Factory groups related object creation behind an interface; injecting the factory via constructor dependency injection lets you swap entire product families (dark/light theme, mock/real DB) without touching the consuming code.",
  },
  {
    id: "cs-builder-fluent",
    language: "csharp",
    title: "Builder pattern with fluent method chaining",
    tag: "classes",
    code: `class QueryBuilder
{
    private string _table = "";
    private readonly List<string> _conditions = [];
    private int _limit = 100;

    public QueryBuilder From(string table) { _table = table; return this; }
    public QueryBuilder Where(string cond) { _conditions.Add(cond); return this; }
    public QueryBuilder Limit(int n)       { _limit = n; return this; }

    public string Build()
    {
        string where = _conditions.Count > 0
            ? " WHERE " + string.Join(" AND ", _conditions)
            : "";
        return \`SELECT * FROM \${_table}\${where} LIMIT \${_limit}\`;
    }
}

string sql = new QueryBuilder()
    .From("orders")
    .Where("status = 'open'")
    .Where("amount > 100")
    .Limit(50)
    .Build();

Console.WriteLine(sql);`,
    explanation:
      "The Builder pattern separates complex object construction from its representation; each method sets one aspect and returns this for chaining, allowing readable declarative construction without a massive constructor.",
  },
  {
    id: "cs-fluent-interface",
    language: "csharp",
    title: "Fluent interface returning this for chainability",
    tag: "classes",
    code: `class EmailBuilder
{
    private string _to = "", _subject = "", _body = "";

    public EmailBuilder To(string address)    { _to      = address; return this; }
    public EmailBuilder Subject(string sub)   { _subject = sub;     return this; }
    public EmailBuilder Body(string text)     { _body    = text;    return this; }

    public void Send() =>
        Console.WriteLine(\`To: \${_to}\\nSubject: \${_subject}\\n\${_body}\`);
}

new EmailBuilder()
    .To("alice@example.com")
    .Subject("Hello")
    .Body("World!")
    .Send();`,
    explanation:
      "A fluent interface makes every setter return this (the same instance), enabling method chaining that reads like a natural language sentence and eliminates temporary variables — common in test frameworks, query builders, and configuration APIs.",
  },
  {
    id: "cs-observer-delegate",
    language: "csharp",
    title: "Observer pattern using delegates and events",
    tag: "classes",
    code: `class Stock
{
    public string Symbol { get; }
    private decimal _price;
    public event Action<string, decimal>? PriceChanged;

    public Stock(string symbol, decimal price)
    { Symbol = symbol; _price = price; }

    public decimal Price
    {
        get => _price;
        set
        {
            if (value != _price)
            {
                _price = value;
                PriceChanged?.Invoke(Symbol, _price);
            }
        }
    }
}

var aapl = new Stock("AAPL", 170m);
aapl.PriceChanged += (sym, price) => Console.WriteLine(\`\${sym}: \${price:C}\`);
aapl.Price = 175m;   // AAPL: $175.00`,
    explanation:
      "C# events are multicast delegates with publisher-side encapsulation; += subscribes and -= unsubscribes, giving you the Observer pattern with built-in support for multiple listeners and thread-safe null-conditional invocation via ?.Invoke().",
  },
  {
    id: "cs-command-interface",
    language: "csharp",
    title: "Command pattern with Execute and Undo",
    tag: "classes",
    code: `interface ICommand { void Execute(); void Undo(); }

class TextEditor
{
    private string _text = "";
    public string Text => _text;
    public void Insert(string s) => _text += s;
    public void Delete(int count) => _text = _text[..^count];
}

class InsertCommand : ICommand
{
    private readonly TextEditor _ed;
    private readonly string _text;
    public InsertCommand(TextEditor ed, string text) { _ed = ed; _text = text; }
    public void Execute() => _ed.Insert(_text);
    public void Undo()    => _ed.Delete(_text.Length);
}

var ed  = new TextEditor();
var cmd = new InsertCommand(ed, "Hello");
cmd.Execute(); Console.WriteLine(ed.Text);   // "Hello"
cmd.Undo();    Console.WriteLine(ed.Text);   // ""`,
    explanation:
      "The Command pattern encapsulates an operation as an object with Execute and Undo methods; storing a stack of commands lets you implement undo/redo histories, macros, and transactional operations.",
  },
  {
    id: "cs-strategy-func",
    language: "csharp",
    title: "Strategy pattern using Func<T,TResult> delegates",
    tag: "classes",
    code: `class Sorter<T>
{
    private readonly Func<IEnumerable<T>, IEnumerable<T>> _strategy;
    public Sorter(Func<IEnumerable<T>, IEnumerable<T>> strategy)
        => _strategy = strategy;
    public IEnumerable<T> Sort(IEnumerable<T> items) => _strategy(items);
}

var nums = new[] { 3, 1, 4, 1, 5, 9 };

var asc  = new Sorter<int>(items => items.OrderBy(x => x));
var desc = new Sorter<int>(items => items.OrderByDescending(x => x));

Console.WriteLine(string.Join(", ", asc.Sort(nums)));    // 1, 1, 3, 4, 5, 9
Console.WriteLine(string.Join(", ", desc.Sort(nums)));   // 9, 5, 4, 3, 1, 1`,
    explanation:
      "Using Func<T,TResult> as the strategy eliminates the need to define an interface and concrete classes for simple algorithmic variations; for complex strategies with multiple methods an interface remains clearer.",
  },
  {
    id: "cs-chain-handlers",
    language: "csharp",
    title: "Chain of Responsibility with linked handlers",
    tag: "classes",
    code: `abstract class Handler
{
    protected Handler? Next;
    public Handler SetNext(Handler next) { Next = next; return next; }
    public abstract string? Handle(int request);
}

class SmallHandler : Handler
{
    public override string? Handle(int r) =>
        r < 10 ? \`Small handled \${r}\` : Next?.Handle(r);
}
class MediumHandler : Handler
{
    public override string? Handle(int r) =>
        r < 100 ? \`Medium handled \${r}\` : Next?.Handle(r);
}
class FallbackHandler : Handler
{
    public override string? Handle(int r) => \`Fallback: \${r}\`;
}

var chain = new SmallHandler();
chain.SetNext(new MediumHandler()).SetNext(new FallbackHandler());

Console.WriteLine(chain.Handle(5));    // Small handled 5
Console.WriteLine(chain.Handle(50));   // Medium handled 50
Console.WriteLine(chain.Handle(999));  // Fallback: 999`,
    explanation:
      "Chain of Responsibility passes a request down a linked list of handlers until one handles it; each handler decides whether to process or forward the request, keeping handlers decoupled from each other.",
  },
  {
    id: "cs-composite-recursive",
    language: "csharp",
    title: "Composite pattern: leaf and composite share an interface",
    tag: "classes",
    code: `interface IComponent { int Price(); }

class Leaf : IComponent
{
    private readonly int _price;
    public Leaf(int price) => _price = price;
    public int Price() => _price;
}

class Composite : IComponent
{
    private readonly List<IComponent> _children = [];
    public void Add(IComponent c) => _children.Add(c);
    public int Price() => _children.Sum(c => c.Price());   // recursive
}

var root = new Composite();
root.Add(new Leaf(10));
var sub = new Composite();
sub.Add(new Leaf(5)); sub.Add(new Leaf(3));
root.Add(sub);

Console.WriteLine(root.Price());   // 18  (10 + 5 + 3)`,
    explanation:
      "Composite lets clients treat individual objects and groups of objects uniformly through a shared interface; Price() works the same whether called on a leaf or a tree of composites — recursive summation happens automatically.",
  },
  {
    id: "cs-decorator-class",
    language: "csharp",
    title: "Decorator pattern: wraps and extends a class",
    tag: "classes",
    code: `interface ILogger { void Log(string msg); }

class ConsoleLogger : ILogger
{
    public void Log(string msg) => Console.WriteLine(msg);
}

class TimestampDecorator : ILogger
{
    private readonly ILogger _inner;
    public TimestampDecorator(ILogger inner) => _inner = inner;
    public void Log(string msg) =>
        _inner.Log(\`[\${DateTime.UtcNow:HH:mm:ss}] \${msg}\`);
}

class PrefixDecorator : ILogger
{
    private readonly ILogger _inner;
    private readonly string _prefix;
    public PrefixDecorator(ILogger inner, string prefix)
    { _inner = inner; _prefix = prefix; }
    public void Log(string msg) => _inner.Log(\`[\${_prefix}] \${msg}\`);
}

ILogger logger = new TimestampDecorator(
                     new PrefixDecorator(new ConsoleLogger(), "INFO"));
logger.Log("server started");   // [14:32:01] [INFO] server started`,
    explanation:
      "Decorator wraps an object to add behavior transparently through the same interface; stacking decorators composes features (timestamps, prefixes, filtering) without subclassing, keeping each concern in its own class.",
  },
  {
    id: "cs-proxy-wrapper",
    language: "csharp",
    title: "Proxy pattern: lazy initialization",
    tag: "classes",
    code: `interface IReport { string Generate(); }

class HeavyReport : IReport
{
    public HeavyReport() => Console.WriteLine("HeavyReport created (expensive!)");
    public string Generate() => "report data";
}

class LazyReportProxy : IReport
{
    private IReport? _real;
    public string Generate()
    {
        _real ??= new HeavyReport();   // created only on first call
        return _real.Generate();
    }
}

IReport report = new LazyReportProxy();
Console.WriteLine("proxy created — no heavy init yet");
Console.WriteLine(report.Generate());   // HeavyReport created here
Console.WriteLine(report.Generate());   // reuses existing instance`,
    explanation:
      "A proxy implements the same interface as the real object and defers creation until first use; this lazy-initialization proxy avoids paying the construction cost until the object is actually needed.",
  },
  {
    id: "cs-facade-class",
    language: "csharp",
    title: "Facade: single entry point to a subsystem",
    tag: "classes",
    code: `// Complex subsystem classes
class AuthService    { public bool Validate(string token) => token == "secret"; }
class DatabaseService{ public string Query(string sql)    => "row1,row2"; }
class CacheService   { public void  Set(string key, string v){} public string? Get(string k) => null; }

// Facade — hides subsystem complexity
class ApiGateway
{
    private readonly AuthService    _auth  = new();
    private readonly DatabaseService _db   = new();
    private readonly CacheService   _cache = new();

    public string? GetData(string token, string sql)
    {
        if (!_auth.Validate(token)) return null;
        string? cached = _cache.Get(sql);
        if (cached is not null) return cached;
        string data = _db.Query(sql);
        _cache.Set(sql, data);
        return data;
    }
}

Console.WriteLine(new ApiGateway().GetData("secret", "SELECT *"));   // "row1,row2"`,
    explanation:
      "Facade provides a simplified interface to a set of subsystem classes, reducing coupling between clients and the internals; it doesn't prevent direct subsystem access but provides a convenient default path.",
  },
  {
    id: "cs-flyweight-cache",
    language: "csharp",
    title: "Flyweight: share instances via a factory cache",
    tag: "classes",
    code: `class Glyph
{
    public char Character { get; }
    public Glyph(char c) { Character = c; Console.WriteLine(\`created '\${c}'\`); }
}

static class GlyphFactory
{
    private static readonly Dictionary<char, Glyph> _cache = [];

    public static Glyph Get(char c)
    {
        if (!_cache.TryGetValue(c, out var glyph))
            _cache[c] = glyph = new Glyph(c);
        return glyph;
    }
}

// Render "hello" — 'l' is created only once
foreach (char ch in "hello")
    Console.Write(GlyphFactory.Get(ch).Character);
// created 'h' / created 'e' / created 'l' / created 'o'
// hello`,
    explanation:
      "Flyweight shares identical objects instead of creating new ones each time; the factory checks an internal cache keyed by the intrinsic state, dramatically reducing memory when the same value appears millions of times (font glyphs, game tiles, etc.).",
  },
  {
    id: "cs-state-machine",
    language: "csharp",
    title: "State pattern: behavior changes with state",
    tag: "classes",
    code: `interface IState { void Handle(TrafficLight light); }

class RedState : IState
{
    public void Handle(TrafficLight l)
    { Console.WriteLine("Red → Green"); l.State = new GreenState(); }
}
class GreenState : IState
{
    public void Handle(TrafficLight l)
    { Console.WriteLine("Green → Yellow"); l.State = new YellowState(); }
}
class YellowState : IState
{
    public void Handle(TrafficLight l)
    { Console.WriteLine("Yellow → Red"); l.State = new RedState(); }
}

class TrafficLight
{
    public IState State = new RedState();
    public void Next() => State.Handle(this);
}

var light = new TrafficLight();
light.Next();   // Red → Green
light.Next();   // Green → Yellow
light.Next();   // Yellow → Red`,
    explanation:
      "The State pattern externalizes state-specific behavior into separate classes; the context delegates to the current state object, which transitions to the next state — eliminating large switch/if-else blocks and making adding new states easy.",
  },
  {
    id: "cs-mediator-class",
    language: "csharp",
    title: "Mediator: decouple objects through a central hub",
    tag: "classes",
    code: `interface IMediator { void Send(string msg, string from); }

class ChatRoom : IMediator
{
    private readonly Dictionary<string, User> _users = [];
    public void Register(User u) => _users[u.Name] = u;
    public void Send(string msg, string from)
    {
        foreach (var (name, user) in _users)
            if (name != from) user.Receive(\`\${from}: \${msg}\`);
    }
}

class User
{
    public string Name { get; }
    private readonly IMediator _room;
    public User(string name, IMediator room) { Name = name; _room = room; }
    public void Say(string msg) => _room.Send(msg, Name);
    public void Receive(string msg) => Console.WriteLine(\`[\${Name}] \${msg}\`);
}

var room = new ChatRoom();
var alice = new User("Alice", room);
var bob   = new User("Bob",   room);
room.Register(alice); room.Register(bob);
alice.Say("Hi!");   // [Bob] Alice: Hi!`,
    explanation:
      "Mediator centralises communication between objects so they don't reference each other directly; adding a new participant (User) requires only registering with the mediator, not updating every other participant.",
  },
  {
    id: "cs-iterator-yield",
    language: "csharp",
    title: "Custom iterator with yield return implementing IEnumerable<T>",
    tag: "classes",
    code: `class NumberRange : IEnumerable<int>
{
    private readonly int _start, _end, _step;
    public NumberRange(int start, int end, int step = 1)
    { _start = start; _end = end; _step = step; }

    public IEnumerator<int> GetEnumerator()
    {
        for (int i = _start; i <= _end; i += _step)
            yield return i;
    }

    System.Collections.IEnumerator System.Collections.IEnumerable.GetEnumerator()
        => GetEnumerator();
}

foreach (int n in new NumberRange(1, 10, 2))
    Console.Write(n + " ");   // 1 3 5 7 9

// Works with LINQ
var sum = new NumberRange(1, 100).Sum();
Console.WriteLine(sum);   // 5050`,
    explanation:
      "Implementing IEnumerable<T> with a yield return iterator lets your class participate in foreach loops and all LINQ operators without the boilerplate of a hand-written enumerator class — the compiler generates the state machine.",
  },
];
