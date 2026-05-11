import type { Snippet } from "./types";

export const csharpSnippets20260511B1: Snippet[] = [
  {
    id: "cs-collection-initializer",
    language: "csharp",
    title: "Collection and object initializer syntax",
    tag: "snippet",
    code: `// Object initializer — no explicit constructor call needed
var p = new Person { Name = "Alice", Age = 30 };

// Collection initializer — calls Add() for each element
var nums = new List<int> { 1, 2, 3, 4, 5 };

// Dictionary initializer (index initializer syntax)
var map = new Dictionary<string, int>
{
    ["alpha"] = 1,
    ["beta"]  = 2,
    ["gamma"] = 3,
};

// Nested: object inside collection initializer
var people = new List<Person>
{
    new Person { Name = "Bob",   Age = 25 },
    new Person { Name = "Carol", Age = 32 },
};`,
    explanation:
      "Object and collection initializers let you set properties and populate collections in a single expression at construction time, reducing boilerplate and making the intent clear at a glance.",
  },
  {
    id: "cs-object-initializer",
    language: "csharp",
    title: "Object initializer with required and optional properties",
    tag: "snippet",
    code: `public class Config
{
    public required string Host { get; init; }  // must be set
    public int Port { get; init; } = 8080;       // optional, has default
    public bool Secure { get; init; }
}

// required forces the property to appear in the initializer
var cfg = new Config
{
    Host   = "localhost",   // required
    Secure = true,          // optional — Port uses its default
};

Console.WriteLine(cfg.Host);    // localhost
Console.WriteLine(cfg.Port);    // 8080  (default)
Console.WriteLine(cfg.Secure);  // True`,
    explanation:
      "The 'required' keyword (C# 11) forces callers to set a property in an object initializer, providing compile-time enforcement of mandatory fields without a matching constructor overload.",
  },
  {
    id: "cs-index-range",
    language: "csharp",
    title: "^ from-end index and .. range operator",
    tag: "snippet",
    code: `int[] arr = { 10, 20, 30, 40, 50 };

// ^ means "from end": ^1 is the last element
Console.WriteLine(arr[^1]);   // 50
Console.WriteLine(arr[^2]);   // 40

// .. creates a Range; end index is exclusive
int[] middle = arr[1..4];   // elements at index 1, 2, 3
Console.WriteLine(string.Join(", ", middle));  // 20, 30, 40

// Combine ^ and ..
int[] lastTwo = arr[^2..];   // from second-to-last to end
Console.WriteLine(string.Join(", ", lastTwo)); // 40, 50

int[] allButFirst = arr[1..];   // skip first
int[] allButLast  = arr[..^1];  // skip last`,
    explanation:
      "The ^ (from-end) index and .. (range) operators introduced in C# 8 give you Python-style slice notation for arrays, strings, Span<T>, and any type that defines GetIndexer and Slice methods.",
  },
  {
    id: "cs-string-interp-spans",
    language: "csharp",
    title: "Interpolated strings compiled to DefaultInterpolatedStringHandler",
    tag: "snippet",
    code: `string name = "Alice";
int    age  = 30;

// Familiar interpolation syntax
string msg = \`Hello, \${name}! You are \${age} years old.\`;
Console.WriteLine(msg);

// C# 10+: compiler lowers this to DefaultInterpolatedStringHandler
// which avoids intermediate string allocations in many cases.
// The handler writes directly to a pooled buffer, then calls ToString().

// In hot paths, use string.Create() or interpolated string handlers
// for zero-allocation formatting:
var result = string.Create(
    System.Globalization.CultureInfo.InvariantCulture,
    \`Pi is approximately \${Math.PI:F4}\`);
Console.WriteLine(result);   // Pi is approximately 3.1416`,
    explanation:
      "Since C# 10, the compiler lowers interpolated strings to a DefaultInterpolatedStringHandler that writes into a stack-allocated or pooled buffer, significantly reducing heap allocations compared to simple string.Format().",
  },
  {
    id: "cs-switch-expression",
    language: "csharp",
    title: "Switch expression (arrow syntax) vs switch statement",
    tag: "snippet",
    code: `// Switch STATEMENT (older style — uses break, falls through if missing)
string GetDayType_Old(DayOfWeek d)
{
    switch (d)
    {
        case DayOfWeek.Saturday:
        case DayOfWeek.Sunday: return "Weekend";
        default:               return "Weekday";
    }
}

// Switch EXPRESSION (C# 8): concise, returns a value
string GetDayType(DayOfWeek d) => d switch
{
    DayOfWeek.Saturday or
    DayOfWeek.Sunday   => "Weekend",
    _                  => "Weekday",   // _ is the discard/default
};

Console.WriteLine(GetDayType(DayOfWeek.Monday));    // Weekday
Console.WriteLine(GetDayType(DayOfWeek.Saturday));  // Weekend`,
    explanation:
      "The switch expression (C# 8) is an expression that returns a value — it's more concise than a switch statement, prevents fall-through bugs, and works naturally with pattern matching arms.",
  },
  {
    id: "cs-throw-expression",
    language: "csharp",
    title: "`throw` as an expression (inside ??, ternary, arrow bodies)",
    tag: "snippet",
    code: `// throw as an expression — usable anywhere an expression is expected

// Null-coalescing assignment with throw
string GetName(string? name) =>
    name ?? throw new ArgumentNullException(nameof(name));

// Ternary with throw
int Divide(int a, int b) =>
    b != 0 ? a / b : throw new DivideByZeroException("b must be non-zero");

// Expression-bodied method: throw works as the body
void MustOverride() => throw new NotImplementedException();

Console.WriteLine(GetName("Alice"));   // Alice
try { GetName(null); }
catch (ArgumentNullException e) { Console.WriteLine(e.Message); }`,
    explanation:
      "C# 7 made 'throw' an expression, allowing it to appear in ternary operators, null-coalescing expressions, and expression-bodied members — eliminating verbose helper methods just to throw in those positions.",
  },
  {
    id: "cs-is-pattern",
    language: "csharp",
    title: "`is` pattern for type and null check",
    tag: "snippet",
    code: `object? obj = "Hello, world!";

// Type pattern: checks type AND introduces a typed variable
if (obj is string s)
{
    Console.WriteLine(s.Length);   // 13 — s is string here
}

// Null check
string? name = null;
if (name is null)
    Console.WriteLine("name is null");

if (name is not null)
    Console.WriteLine(name.ToUpper());

// Combined: type + property pattern
object? val = 42;
if (val is int n and > 0)
    Console.WriteLine(\`Positive int: \${n}\`);   // Positive int: 42`,
    explanation:
      "The 'is' pattern expression tests type and optionally introduces a scoped variable in a single step — it also supports property patterns, negation (is not), and logical combinations with 'and'/'or'.",
  },
  {
    id: "cs-as-nullable",
    language: "csharp",
    title: "`as` cast returns null on failure (vs hard cast exception)",
    tag: "snippet",
    code: `object obj1 = "hello";
object obj2 = 42;

// 'as' returns null if cast fails — no exception
string? s1 = obj1 as string;
string? s2 = obj2 as string;

Console.WriteLine(s1);         // hello
Console.WriteLine(s2 is null); // True — int can't be cast to string

// 'as' only works with reference types and Nullable<T>
// int? n = obj1 as int?;   // works (nullable value type)

// Hard cast: throws InvalidCastException on failure
try
{
    string s3 = (string)obj2;   // throws!
}
catch (InvalidCastException e)
{
    Console.WriteLine(e.Message);
}`,
    explanation:
      "The 'as' operator attempts a cast and returns null on failure instead of throwing — prefer it when failure is expected and you'll check for null; prefer a hard cast when failure indicates a programming error.",
  },
  {
    id: "cs-checked-unchecked",
    language: "csharp",
    title: "`checked`/`unchecked` blocks for overflow control",
    tag: "snippet",
    code: `int max = int.MaxValue;  // 2,147,483,647

// unchecked (default in C#): silently wraps on overflow
unchecked
{
    int wrapped = max + 1;
    Console.WriteLine(wrapped);   // -2147483648  (wraps around)
}

// checked: throws OverflowException
try
{
    checked
    {
        int overflow = max + 1;   // throws OverflowException
    }
}
catch (OverflowException)
{
    Console.WriteLine("Overflow detected!");
}

// checked/unchecked also work as expressions:
int safe = checked(max - 1);   // fine
Console.WriteLine(safe);       // 2147483646`,
    explanation:
      "C# arithmetic is unchecked by default for performance — wrap critical sections in 'checked' to throw OverflowException on integer overflow, or compile with /checked to make it the default for the whole project.",
  },
  {
    id: "cs-default-param",
    language: "csharp",
    title: "Default parameter values in methods",
    tag: "snippet",
    code: `// Parameters with defaults must appear after required ones
void Connect(string host, int port = 443, bool secure = true)
{
    Console.WriteLine(\`Connecting to \${host}:\${port} (secure=\${secure})\`);
}

Connect("example.com");              // host only — uses both defaults
Connect("example.com", 8080);        // overrides port
Connect("example.com", 80, false);   // overrides both

// Default values must be compile-time constants or default(T)
void Log(string msg, DateTime? timestamp = null)
{
    timestamp ??= DateTime.UtcNow;   // runtime default via ??=
    Console.WriteLine(\`[\${timestamp:HH:mm:ss}] \${msg}\`);
}`,
    explanation:
      "Default parameter values are baked into the call site at compile time — callers that don't update their code after a default changes will keep using the old value, so use overloads for public API stability.",
  },
  {
    id: "cs-named-args",
    language: "csharp",
    title: "Named arguments improve readability",
    tag: "snippet",
    code: `void CreateUser(string firstName, string lastName,
                int age, bool isAdmin = false)
{
    Console.WriteLine(\`\${firstName} \${lastName}, age \${age}, admin: \${isAdmin}\`);
}

// Without named args: positional — easy to mix up
CreateUser("Alice", "Smith", 30, true);

// With named args: self-documenting
CreateUser(firstName: "Bob", lastName: "Jones",
           age: 25, isAdmin: false);

// Named args can be in any order
CreateUser(age: 40, isAdmin: true, lastName: "Lee", firstName: "Carol");

// Combine positional and named (positional must come first)
CreateUser("Dave", "Brown", age: 35);`,
    explanation:
      "Named arguments let you specify parameters by name rather than position — they're especially valuable for methods with many parameters of the same type, where positional confusion is a real bug source.",
  },
  {
    id: "cs-params-keyword",
    language: "csharp",
    title: "`params` keyword for variable-length argument lists",
    tag: "snippet",
    code: `// params must be the last parameter; creates an array from the args
int Sum(params int[] numbers)
{
    int total = 0;
    foreach (int n in numbers) total += n;
    return total;
}

Console.WriteLine(Sum(1, 2, 3));           // 6
Console.WriteLine(Sum(10, 20, 30, 40));    // 100
Console.WriteLine(Sum());                  // 0  — empty array

// Can also pass an existing array
int[] arr = { 5, 10, 15 };
Console.WriteLine(Sum(arr));               // 30

// C# 13: params can be IEnumerable<T>, Span<T>, etc. (not just arrays)
// But the classic 'params T[]' allocates a new array on every call`,
    explanation:
      "The 'params' keyword lets callers pass any number of arguments without manually creating an array — the compiler wraps them into an array, though this allocation can matter in tight loops.",
  },
  {
    id: "cs-out-keyword",
    language: "csharp",
    title: "`out` parameter for multiple return values",
    tag: "snippet",
    code: `// out: caller doesn't need to initialise; method MUST assign before returning
bool TryParsePair(string input, out int x, out int y)
{
    string[] parts = input.Split(',');
    if (parts.Length == 2
        && int.TryParse(parts[0].Trim(), out x)
        && int.TryParse(parts[1].Trim(), out y))
        return true;
    x = y = 0;   // must assign even on failure path
    return false;
}

if (TryParsePair("3, 7", out int a, out int b))
    Console.WriteLine(\`x=\${a}, y=\${b}\`);   // x=3, y=7

// Discard with _ when you don't need an out value
if (int.TryParse("42", out _))
    Console.WriteLine("parsed OK");`,
    explanation:
      "out parameters let a method return multiple values without a tuple or struct — the canonical pattern is TryXxx(input, out T result) which separates success/failure from the result value.",
  },
  {
    id: "cs-ref-keyword",
    language: "csharp",
    title: "`ref` parameter passes by reference",
    tag: "snippet",
    code: `// ref: caller must initialise; method can read AND write
void Swap(ref int a, ref int b)
{
    int tmp = a;
    a = b;
    b = tmp;
}

int x = 1, y = 2;
Swap(ref x, ref y);
Console.WriteLine(\`x=\${x}, y=\${y}\`);   // x=2, y=1

// ref on a value type avoids copying a large struct
void Normalise(ref double value, double max)
{
    value = value / max;
}

double v = 75.0;
Normalise(ref v, 100.0);
Console.WriteLine(v);   // 0.75

// Note: 'ref' and 'out' can't be used with async methods`,
    explanation:
      "ref passes a variable by reference so the method can both read and modify it — unlike out, the caller must initialise the variable first; both are useful for avoiding struct copies and multiple return values.",
  },
  {
    id: "cs-boxing-unboxing",
    language: "csharp",
    title: "Boxing int to object allocates on heap; unboxing copies back",
    tag: "understanding",
    code: `// Boxing: value type → object (heap allocation)
int  val    = 42;
object boxed = val;   // box: new object on heap containing 42

Console.WriteLine(boxed);              // 42
Console.WriteLine(val == (int)boxed);  // True

// Unboxing: object → value type (type must match exactly)
int unboxed = (int)boxed;   // copies the int out of the box
unboxed = 99;
Console.WriteLine(boxed);   // 42  — box is unaffected (it's a copy)

// Hidden boxing: storing int in ArrayList or non-generic collection
var list = new System.Collections.ArrayList();
list.Add(1);  // boxing
list.Add(2);  // boxing
// Use List<int> instead to avoid boxing`,
    explanation:
      "Boxing wraps a value type in a heap-allocated object — it's implicit when you assign a struct to an object or interface variable, and it costs an allocation plus a GC pressure hit in tight loops.",
  },
  {
    id: "cs-struct-copy",
    language: "csharp",
    title: "Struct assignment copies all fields (value semantics)",
    tag: "understanding",
    code: `struct Point
{
    public int X, Y;
    public Point(int x, int y) { X = x; Y = y; }
    public override string ToString() => \`(\${X}, \${Y})\`;
}

Point a = new Point(1, 2);
Point b = a;   // full copy of all fields

b.X = 99;
Console.WriteLine(a);   // (1, 2)  — a is unaffected
Console.WriteLine(b);   // (99, 2)

// This is value semantics: every assignment, parameter pass, return
// creates an independent copy — no aliasing
Point[] arr = { a };
arr[0].X = 0;            // modifies the copy in the array
Console.WriteLine(a.X);  // 1  — original still 1`,
    explanation:
      "Structs have value semantics — every assignment and method parameter creates a full copy, so there's no aliasing between two struct variables, unlike class references which share the same object.",
  },
  {
    id: "cs-delegate-multicast",
    language: "csharp",
    title: "Multicast delegate invokes all subscribers in order",
    tag: "understanding",
    code: `Action<string> handlers = null!;

// Combine delegates with + or +=
handlers += msg => Console.WriteLine(\`Handler 1: \${msg}\`);
handlers += msg => Console.WriteLine(\`Handler 2: \${msg}\`);
handlers += msg => Console.WriteLine(\`Handler 3: \${msg}\`);

handlers("Hello");
// Handler 1: Hello
// Handler 2: Hello
// Handler 3: Hello

// Remove a delegate with -=
Action<string> third = msg => { };
handlers -= third;   // only removes if reference matches

// Return value: only the LAST delegate's return value is kept
Func<int> funcs = () => 1;
funcs += () => 2;
funcs += () => 3;
Console.WriteLine(funcs());   // 3  — last one wins`,
    explanation:
      "A multicast delegate maintains an invocation list — += appends to it and -= removes a matching entry; when invoked, all handlers run in order and only the last return value is observable.",
  },
  {
    id: "cs-event-fire",
    language: "csharp",
    title: "Events can only be invoked from within the declaring class",
    tag: "understanding",
    code: `public class Button
{
    // event restricts who can invoke — only this class
    public event EventHandler? Clicked;

    public void SimulateClick()
    {
        Clicked?.Invoke(this, EventArgs.Empty);  // OK — inside the class
    }
}

var btn = new Button();
btn.Clicked += (s, e) => Console.WriteLine("Handler 1 fired");
btn.Clicked += (s, e) => Console.WriteLine("Handler 2 fired");

btn.SimulateClick();
// Handler 1 fired
// Handler 2 fired

// btn.Clicked(btn, EventArgs.Empty);  // compile error from outside`,
    explanation:
      "The 'event' keyword wraps a delegate field so that external code can only += (subscribe) and -= (unsubscribe) — only the declaring class can invoke or assign the event directly.",
  },
  {
    id: "cs-captured-loop-var",
    language: "csharp",
    title: "for loop variable capture: the classic closure bug",
    tag: "understanding",
    code: `// BROKEN: all lambdas capture the same 'i' variable
var actions = new List<Action>();
for (int i = 0; i < 5; i++)
    actions.Add(() => Console.Write(i + " "));

actions.ForEach(a => a());
// 5 5 5 5 5  — i is 5 after the loop

Console.WriteLine();

// FIX: capture a copy per iteration with a local variable
var fixed_actions = new List<Action>();
for (int i = 0; i < 5; i++)
{
    int captured = i;                         // new variable per iteration
    fixed_actions.Add(() => Console.Write(captured + " "));
}
fixed_actions.ForEach(a => a());
// 0 1 2 3 4`,
    explanation:
      "All lambdas in a loop share the same closure variable by default — by the time they run, the loop has finished and the variable holds its final value; capture a per-iteration copy to fix this.",
  },
  {
    id: "cs-string-equality",
    language: "csharp",
    title: "== compares by value for string; ReferenceEquals for identity",
    tag: "understanding",
    code: `string a = "hello";
string b = "hello";
string c = new string("hello".ToCharArray());   // forces new object

// == on string compares content (value equality)
Console.WriteLine(a == b);   // True
Console.WriteLine(a == c);   // True  — same content

// ReferenceEquals checks object identity (pointer equality)
Console.WriteLine(ReferenceEquals(a, b));   // True  (interned literals)
Console.WriteLine(ReferenceEquals(a, c));   // False (c is a new object)

// Object.Equals uses == for strings (value semantics)
Console.WriteLine(object.Equals(a, c));   // True

// Case-insensitive comparison
Console.WriteLine(string.Equals("Hello", "hello",
    StringComparison.OrdinalIgnoreCase));   // True`,
    explanation:
      "C# overloads == on string to compare content, not references — this is a deliberate design choice making string behave like a value type; use ReferenceEquals when you need identity comparison.",
  },
  {
    id: "cs-enum-underlying-type",
    language: "csharp",
    title: "Enum values are int by default; cast freely",
    tag: "understanding",
    code: `enum Direction { North, South, East, West }   // 0, 1, 2, 3

// Cast to/from int
int n = (int)Direction.East;
Console.WriteLine(n);              // 2

Direction d = (Direction)3;
Console.WriteLine(d);              // West

// Change underlying type (e.g., byte saves memory for small enums)
enum Status : byte { Active = 1, Inactive = 2, Deleted = 255 }

// [Flags] enum: combine with bitwise OR
[System.Flags]
enum Perms { None = 0, Read = 1, Write = 2, Execute = 4 }
Perms p = Perms.Read | Perms.Write;
Console.WriteLine(p);              // Read, Write
Console.WriteLine((int)p);         // 3`,
    explanation:
      "Enums are thin wrappers around an integer type (int by default) — you can cast freely between the enum and its underlying type, and [Flags] enums use bit-field conventions for combining values.",
  },
  {
    id: "cs-nullable-value-hasvalue",
    language: "csharp",
    title: "Nullable<T>: .HasValue / .Value / ??",
    tag: "understanding",
    code: `int? a = 42;
int? b = null;

// .HasValue — safe check
Console.WriteLine(a.HasValue);   // True
Console.WriteLine(b.HasValue);   // False

// .Value — throws InvalidOperationException if HasValue is false
Console.WriteLine(a.Value);      // 42
// Console.WriteLine(b.Value);   // InvalidOperationException!

// ?? — null-coalescing: return default if null
Console.WriteLine(a ?? 0);       // 42
Console.WriteLine(b ?? 0);       // 0

// GetValueOrDefault() — returns default(T) if null (no exception)
Console.WriteLine(b.GetValueOrDefault());    // 0
Console.WriteLine(b.GetValueOrDefault(99));  // 99`,
    explanation:
      "Nullable<T> (written T?) wraps a value type with a HasValue flag — always check HasValue before accessing .Value, or use the ?? operator to supply a fallback, to avoid a runtime exception.",
  },
  {
    id: "cs-null-coalescing-chain",
    language: "csharp",
    title: "?? chaining and ??= null-coalescing assignment",
    tag: "understanding",
    code: `string? a = null;
string? b = null;
string  c = "found it";

// ?? chains: returns first non-null value
string result = a ?? b ?? c;
Console.WriteLine(result);   // found it

// ??= assigns only if the left side is currently null
string? cache = null;
cache ??= "default value";   // assigns because cache is null
Console.WriteLine(cache);    // default value

cache ??= "other value";     // does NOT assign — cache is not null
Console.WriteLine(cache);    // default value

// Practical: lazy initialisation
List<string>? _list = null;
List<string> GetList() => _list ??= new List<string>();`,
    explanation:
      "The ?? operator returns its left operand if non-null, otherwise the right — chains of ?? let you specify fallback priorities; ??= is a shorthand for 'assign this default if currently null'.",
  },
  {
    id: "cs-conditional-access",
    language: "csharp",
    title: "?. null-conditional operator short-circuits",
    tag: "understanding",
    code: `class Order { public Customer? Customer { get; set; } }
class Customer { public Address? Address { get; set; } }
class Address { public string City { get; set; } = ""; }

Order? order = new Order();   // Customer is null

// Without ?. — nested null checks required:
// if (order != null && order.Customer != null && ...)

// With ?.: entire chain short-circuits to null if any step is null
string? city = order?.Customer?.Address?.City;
Console.WriteLine(city is null);   // True — short-circuited

// ?[] for null-conditional indexing
List<int>? nums = null;
int? first = nums?[0];
Console.WriteLine(first is null);  // True

// Works with methods too
int? len = order?.Customer?.Address?.City?.Length;`,
    explanation:
      "The ?. operator short-circuits the entire chain to null when it encounters a null value — it replaces deeply nested null checks and is especially valuable when navigating object graphs.",
  },
  {
    id: "cs-ternary-null",
    language: "csharp",
    title: "Ternary with null: type inference pitfalls",
    tag: "understanding",
    code: `// Simple ternary — type inferred from both branches
bool flag = true;
int result = flag ? 1 : 0;   // int

// null in ternary: compiler needs to infer a nullable type
string? s = flag ? "hello" : null;   // string? — OK

// Pitfall: incompatible types cause compile error
// var x = flag ? 1 : "string";  // CS0173: type cannot be determined

// null-coalescing as ternary alternative
string? name = null;
string display = name != null ? name : "default";
// cleaner:
string display2 = name ?? "default";

// Null-forgiving operator: suppress nullable warning (use carefully)
string definitely = name!;   // tells compiler "trust me, not null"`,
    explanation:
      "The compiler infers the type of a ternary expression from both branches — when one branch is null, the result type becomes nullable (T?); if both branches have incompatible non-null types, it's a compile error.",
  },
  {
    id: "cs-string-interp-trace",
    language: "csharp",
    title: "Interpolation expressions are evaluated eagerly at the call site",
    tag: "understanding",
    code: `int x = 10;

// The expression inside {} is evaluated immediately when the string is formed
string s = \`value is \${x * 2}\`;   // 20 computed right here
x = 99;
Console.WriteLine(s);   // value is 20  — x=99 has no effect

// Gotcha: avoid expensive calls directly in interpolations
// string log = \`result: \${ComputeExpensively()}\`; // always runs!

// For conditional logging, use a method:
bool verbose = false;
if (verbose)
    Console.WriteLine(\`Debug: \${string.Join(",", Enumerable.Range(0,1000))}\`);
// The Join only runs if verbose is true — unlike always-evaluated args`,
    explanation:
      "Interpolated string expressions are evaluated immediately when the string is constructed, not lazily — this matters for performance when the interpolation involves expensive operations or logging that might be discarded.",
  },
  {
    id: "cs-var-type-inference",
    language: "csharp",
    title: "`var` is inferred at compile time; not dynamic",
    tag: "understanding",
    code: `// var is just syntactic sugar — type is fixed at compile time
var x = 42;          // x is int
var s = "hello";     // s is string
var d = 3.14;        // d is double

// x = "text";      // compile error: can't assign string to int

// Useful for long generic types
var dict = new Dictionary<string, List<int>>();

// var in foreach
var numbers = new[] { 1, 2, 3 };
foreach (var n in numbers)  // n is inferred as int
    Console.Write(n);

// var is NOT valid without an initialiser
// var y;            // compile error

// Compare: dynamic is late-bound at runtime
dynamic dyn = 42;
dyn = "now a string";   // no error — but no compile-time safety`,
    explanation:
      "'var' is a compile-time shorthand for the inferred type — the variable is statically typed and you get full IDE support; it's not the same as 'dynamic', which defers type resolution to runtime.",
  },
  {
    id: "cs-anonymous-scope",
    language: "csharp",
    title: "Anonymous methods capture outer variables by reference",
    tag: "understanding",
    code: `int counter = 0;

// Lambda captures 'counter' by reference to the outer variable
Action increment = () => counter++;
Action reset     = () => counter = 0;

increment(); increment(); increment();
Console.WriteLine(counter);   // 3

reset();
Console.WriteLine(counter);   // 0  — same variable

// Multiple lambdas sharing a captured variable
Func<int> getCount = () => counter;
increment();
Console.WriteLine(getCount());   // 1  — all see the same counter

// Captured variable lifetimes are extended — the closure keeps
// the variable alive as long as the lambda is reachable`,
    explanation:
      "Lambdas and anonymous methods capture outer variables by reference, not by value — all closures in the same scope share the same variable, and the variable's lifetime is extended to match the closure's lifetime.",
  },
  {
    id: "cs-list-capacity",
    language: "csharp",
    title: "List<T> capacity vs count; pre-allocating avoids resizing",
    tag: "structures",
    code: `// Default List<T> starts with capacity 0; doubles when full
var list = new List<int>();
Console.WriteLine(list.Count);    // 0
Console.WriteLine(list.Capacity); // 0

list.Add(1);
Console.WriteLine(list.Capacity); // 4  (first doubling)

for (int i = 0; i < 10; i++) list.Add(i);
Console.WriteLine(list.Capacity); // 16 (doubled again)

// Pre-allocate when size is known — avoids repeated array copies
var pre = new List<int>(1000);
Console.WriteLine(pre.Capacity);  // 1000  — no resizes needed

// TrimExcess after building a large list you won't grow further
list.TrimExcess();
Console.WriteLine(list.Capacity); // matches list.Count`,
    explanation:
      "List<T> doubles its internal array when it runs out of space — if you know the approximate size upfront, passing it to the constructor avoids the O(n log n) cumulative copies from repeated doublings.",
  },
  {
    id: "cs-dictionary-trygetvalue",
    language: "csharp",
    title: "TryGetValue avoids double lookup vs indexer",
    tag: "structures",
    code: `var scores = new Dictionary<string, int>
{
    ["Alice"] = 95,
    ["Bob"]   = 82,
};

// BAD: two lookups — ContainsKey + indexer
if (scores.ContainsKey("Alice"))
    Console.WriteLine(scores["Alice"]);   // 2 hash lookups

// GOOD: single lookup with TryGetValue
if (scores.TryGetValue("Alice", out int score))
    Console.WriteLine(score);   // 95 — 1 hash lookup

if (!scores.TryGetValue("Carol", out int missing))
    Console.WriteLine("Carol not found");   // Carol not found

// C# 8+: GetValueOrDefault returns a default without exception
int carolScore = scores.GetValueOrDefault("Carol", 0);
Console.WriteLine(carolScore);   // 0`,
    explanation:
      "TryGetValue performs a single hash lookup and returns both the success flag and the value — the ContainsKey + indexer pattern is a common performance anti-pattern that does the same lookup twice.",
  },
  {
    id: "cs-hashset-operations",
    language: "csharp",
    title: "HashSet<T> union, intersect, and except operations",
    tag: "structures",
    code: `var a = new HashSet<int> { 1, 2, 3, 4 };
var b = new HashSet<int> { 3, 4, 5, 6 };

// These methods MUTATE a in place (use a copy if you need originals)
var copy = new HashSet<int>(a);

copy.UnionWith(b);
Console.WriteLine(string.Join(",", copy));  // 1,2,3,4,5,6

copy = new HashSet<int>(a);
copy.IntersectWith(b);
Console.WriteLine(string.Join(",", copy));  // 3,4

copy = new HashSet<int>(a);
copy.ExceptWith(b);
Console.WriteLine(string.Join(",", copy));  // 1,2

// Read-only predicates (don't mutate)
Console.WriteLine(a.IsSubsetOf(b));    // False
Console.WriteLine(a.Overlaps(b));      // True`,
    explanation:
      "HashSet<T> supports set-algebra operations like UnionWith, IntersectWith, and ExceptWith — note that these mutate the set in place, so pass a copy if you need to preserve the original.",
  },
  {
    id: "cs-sortedlist-usage",
    language: "csharp",
    title: "SortedList<K,V> keeps keys sorted on insert",
    tag: "structures",
    code: `var prices = new SortedList<string, decimal>
{
    ["banana"] = 0.59m,
    ["apple"]  = 1.29m,
    ["cherry"] = 2.99m,
};

// Keys are always in sorted order
foreach (var kv in prices)
    Console.WriteLine(\`\${kv.Key}: \${kv.Value:C}\`);
// apple: $1.29
// banana: $0.59
// cherry: $2.99

// Keys/Values are indexed — O(log n) lookup by key, O(1) by index
Console.WriteLine(prices.Keys[0]);     // apple  (index access)
Console.WriteLine(prices.Values[0]);   // 1.29

// IndexOfKey for binary search
Console.WriteLine(prices.IndexOfKey("banana"));  // 1`,
    explanation:
      "SortedList<K,V> maintains keys in sorted order and allows both key-based (O(log n)) and index-based (O(1)) access — it uses less memory than SortedDictionary but has O(n) insert/delete cost.",
  },
  {
    id: "cs-sortedset-usage",
    language: "csharp",
    title: "SortedSet<T> ordered unique set with range queries",
    tag: "structures",
    code: `var temps = new SortedSet<int> { 15, 30, 5, 22, 8, 17 };

// Always in sorted order
Console.WriteLine(string.Join(", ", temps));
// 5, 8, 15, 17, 22, 30

Console.WriteLine(temps.Min);   // 5
Console.WriteLine(temps.Max);   // 30

// GetViewBetween: O(log n) range query (returns a view)
var warm = temps.GetViewBetween(15, 25);
Console.WriteLine(string.Join(", ", warm));   // 15, 17, 22

// Unique: duplicates silently ignored
temps.Add(15);
Console.WriteLine(temps.Count);   // 6  (unchanged)`,
    explanation:
      "SortedSet<T> uses a red-black tree to keep elements sorted and unique — GetViewBetween provides an efficient range query that returns a live view without copying elements.",
  },
  {
    id: "cs-stack-usage",
    language: "csharp",
    title: "Stack<T> LIFO with Push/Pop/Peek",
    tag: "structures",
    code: `var stack = new Stack<string>();

// Push adds to the top
stack.Push("first");
stack.Push("second");
stack.Push("third");

// Peek: look at top without removing
Console.WriteLine(stack.Peek());   // third

// Pop: remove and return top
Console.WriteLine(stack.Pop());    // third
Console.WriteLine(stack.Pop());    // second
Console.WriteLine(stack.Count);    // 1

// TryPop / TryPeek (safe, no exception on empty)
if (stack.TryPop(out string? val))
    Console.WriteLine(val);        // first

Console.WriteLine(stack.TryPop(out _));  // False — empty`,
    explanation:
      "Stack<T> is a last-in-first-out collection backed by an array — Push and Pop are O(1) amortized; use TryPop/TryPeek in concurrent or uncertain scenarios to avoid exceptions on empty stacks.",
  },
  {
    id: "cs-queue-usage",
    language: "csharp",
    title: "Queue<T> FIFO with Enqueue/Dequeue/Peek",
    tag: "structures",
    code: `var queue = new Queue<string>();

// Enqueue adds to the back
queue.Enqueue("task-1");
queue.Enqueue("task-2");
queue.Enqueue("task-3");

// Peek: see front without removing
Console.WriteLine(queue.Peek());       // task-1

// Dequeue: remove and return front (FIFO)
Console.WriteLine(queue.Dequeue());    // task-1
Console.WriteLine(queue.Dequeue());    // task-2
Console.WriteLine(queue.Count);        // 1

// TryDequeue: safe version (no exception when empty)
while (queue.TryDequeue(out string? task))
    Console.WriteLine(\`Processing: \${task}\`);
// Processing: task-3`,
    explanation:
      "Queue<T> is a first-in-first-out collection backed by a circular array — Enqueue and Dequeue are O(1); use TryDequeue for exception-safe removal, common in work-queue processing loops.",
  },
  {
    id: "cs-linkedlist-usage",
    language: "csharp",
    title: "LinkedList<T> O(1) insert and remove at a known node",
    tag: "structures",
    code: `var list = new LinkedList<int>();
list.AddLast(1);
list.AddLast(3);
list.AddLast(4);

// Find a node, then insert before/after it — O(1) once you have the node
LinkedListNode<int>? node3 = list.Find(3);
list.AddBefore(node3!, 2);   // insert 2 before 3

Console.WriteLine(string.Join(" -> ", list));  // 1 -> 2 -> 3 -> 4

// Remove a node — O(1) with the node reference
list.Remove(node3!);
Console.WriteLine(string.Join(" -> ", list));  // 1 -> 2 -> 4

// Navigate
Console.WriteLine(list.First!.Value);  // 1
Console.WriteLine(list.Last!.Value);   // 4`,
    explanation:
      "LinkedList<T> is a doubly-linked list — inserting or removing at a known node is O(1), making it useful for algorithms that need frequent mid-list modifications; finding a node is still O(n).",
  },
  {
    id: "cs-arraylist-legacy",
    language: "csharp",
    title: "ArrayList (legacy) vs List<T>: boxing and type safety",
    tag: "structures",
    code: `// ArrayList (legacy, non-generic): stores object — causes boxing
var old = new System.Collections.ArrayList();
old.Add(1);         // boxing: int → object (heap allocation)
old.Add("hello");   // no compile error — unsafe!
old.Add(3.14);

int first = (int)old[0];   // unboxing + explicit cast required
// int bad = (int)old[1];  // InvalidCastException at runtime!

// List<T> (generic, preferred): no boxing, compile-time safety
var modern = new List<int>();
modern.Add(1);
// modern.Add("hello");  // compile error — type safe!
int val = modern[0];      // no cast needed

Console.WriteLine(\`Legacy: \${old.Count}, Modern: \${modern.Count}\`);`,
    explanation:
      "ArrayList stores everything as object, causing boxing/unboxing for value types and requiring unsafe casts that blow up at runtime — always use List<T> which is type-safe and avoids boxing entirely.",
  },
  {
    id: "cs-readonlycollection",
    language: "csharp",
    title: "ReadOnlyCollection<T> wraps a list without copying",
    tag: "structures",
    code: `using System.Collections.ObjectModel;

var mutable = new List<string> { "alpha", "beta", "gamma" };

// ReadOnlyCollection wraps without copying the list
var readOnly = new ReadOnlyCollection<string>(mutable);

Console.WriteLine(readOnly[0]);   // alpha
Console.WriteLine(readOnly.Count);  // 3
// readOnly.Add("delta");  // compile error — no Add method

// The wrapper reflects mutations to the original list
mutable.Add("delta");
Console.WriteLine(readOnly.Count);   // 4  — live view!

// Use AsReadOnly() shorthand on List<T>
var ro2 = mutable.AsReadOnly();
Console.WriteLine(ro2.Count);    // 4`,
    explanation:
      "ReadOnlyCollection<T> is a thin wrapper that hides mutating methods — it doesn't copy the data, so it's O(1) to create, but changes to the underlying list are visible through the wrapper.",
  },
  {
    id: "cs-array-sort-compare",
    language: "csharp",
    title: "Array.Sort with custom IComparer<T> or Comparison<T>",
    tag: "structures",
    code: `string[] names = { "Charlie", "alice", "Bob" };

// Default sort: case-sensitive, 'B' < 'a' (uppercase < lowercase in ASCII)
Array.Sort(names);
Console.WriteLine(string.Join(", ", names));  // Bob, Charlie, alice

// Custom Comparison<T> delegate — sort case-insensitively
Array.Sort(names, (a, b) =>
    string.Compare(a, b, StringComparison.OrdinalIgnoreCase));
Console.WriteLine(string.Join(", ", names));  // alice, Bob, Charlie

// Sort by length then alphabetically
Array.Sort(names, (a, b) =>
    a.Length != b.Length ? a.Length - b.Length
                         : string.Compare(a, b, StringComparison.Ordinal));
Console.WriteLine(string.Join(", ", names));  // Bob, alice, Charlie`,
    explanation:
      "Array.Sort accepts a Comparison<T> delegate or an IComparer<T> for custom ordering — the delegate form is more concise for inline comparisons while IComparer<T> is better for reusable or complex logic.",
  },
  {
    id: "cs-span-array-slice",
    language: "csharp",
    title: "Span<T> slice of array without allocation",
    tag: "structures",
    code: `int[] data = { 1, 2, 3, 4, 5, 6, 7, 8 };

// Span<T> is a stack-only ref struct — zero allocation
Span<int> all    = data;           // span over entire array
Span<int> middle = data[2..6];     // or: data.AsSpan(2, 4)

Console.WriteLine(middle[0]);   // 3
Console.WriteLine(middle.Length); // 4

// Mutations through the span affect the original array
middle[0] = 99;
Console.WriteLine(data[2]);    // 99

// Span<char> for zero-copy string processing
string text = "Hello, World!";
ReadOnlySpan<char> greeting = text.AsSpan(0, 5);
Console.WriteLine(greeting.ToString());   // Hello`,
    explanation:
      "Span<T> is a stack-allocated view over a contiguous memory region — slicing an array via Span creates no heap allocation and mutations through the span affect the underlying data directly.",
  },
  {
    id: "cs-memory-segment",
    language: "csharp",
    title: "Memory<T> for async-compatible slicing",
    tag: "structures",
    code: `// Span<T> is stack-only — can't be stored in a class field or used in async
// Memory<T> is the heap-safe, async-compatible alternative

byte[] buffer = new byte[1024];

// Slice without copying — returns a Memory<T> segment
Memory<byte> segment = buffer.AsMemory(0, 256);

Console.WriteLine(segment.Length);  // 256

// Pass to async methods that accept Memory<T>
async Task ProcessAsync(Memory<byte> mem)
{
    // Span is available inside sync sections:
    Span<byte> span = mem.Span;
    span[0] = 0xFF;
    await Task.Delay(1);   // async is fine with Memory<T>
}

await ProcessAsync(segment);
Console.WriteLine(buffer[0]);   // 255 (0xFF)`,
    explanation:
      "Memory<T> is the async-safe counterpart to Span<T> — unlike Span, it can be stored in fields and used across await points; call .Span to get a Span<T> for synchronous processing within a single method.",
  },
  {
    id: "cs-bitarray-usage",
    language: "csharp",
    title: "BitArray compact bit manipulation",
    tag: "structures",
    code: `using System.Collections;

// BitArray stores one bit per slot — much more compact than bool[]
var bits = new BitArray(8, false);   // 8 bits, all false

bits[0] = true;
bits[3] = true;
bits[7] = true;

Console.WriteLine(bits[3]);   // True

// Bitwise operations (operate in place)
var mask = new BitArray(new[] { true, false, true, false,
                                true, false, true, false });
bits.And(mask);   // AND in place

for (int i = 0; i < bits.Length; i++)
    Console.Write(bits[i] ? "1" : "0");
// 10001010 → after AND with 10101010 → 10001010... check bit 0 & 0 etc.`,
    explanation:
      "BitArray stores each flag as a single bit (vs 1 byte for bool[]), making it 8× more memory-efficient for large flag arrays — it also supports bitwise AND, OR, XOR, and NOT operations directly.",
  },
  {
    id: "cs-async-void-caveat2",
    language: "csharp",
    title: "async void exceptions cannot be caught by the caller",
    tag: "caveats",
    code: `// async void: exceptions escape to SynchronizationContext — not catchable here
async void BadHandler()
{
    await Task.Delay(10);
    throw new Exception("Lost exception!");   // crashes the app!
}

// The caller cannot catch this:
try
{
    BadHandler();   // not awaited — returns immediately
}
catch (Exception)
{
    // Never reached — exception fires later on another context
}

// Fix: use async Task so the exception propagates to the awaiter
async Task GoodHandler()
{
    await Task.Delay(10);
    throw new Exception("Catchable!");
}

try { await GoodHandler(); }
catch (Exception e) { Console.WriteLine(e.Message); }  // Catchable!`,
    explanation:
      "async void swallows exceptions into the SynchronizationContext and is nearly impossible to observe — only use async void for event handlers; everywhere else, return async Task so exceptions propagate correctly.",
  },
  {
    id: "cs-task-result-deadlock",
    language: "csharp",
    title: ".Result/.Wait() can deadlock in sync context",
    tag: "caveats",
    code: `// In ASP.NET or WinForms (single SynchronizationContext), this deadlocks:
// var result = GetDataAsync().Result;
// Reason: GetDataAsync() awaits and tries to resume on the captured context,
// but .Result is blocking that same context thread — deadlock!

// Safe alternatives:

// 1. Make the calling method async (best approach)
async Task<string> SafeAsync() => await GetDataAsync();

// 2. Use ConfigureAwait(false) in the library method to avoid capturing context
async Task<string> GetDataAsync()
{
    await Task.Delay(100).ConfigureAwait(false);  // won't try to resume on original context
    return "data";
}

// 3. Run on a thread-pool thread (last resort)
string data = Task.Run(() => GetDataAsync()).Result;
Console.WriteLine(data);   // data`,
    explanation:
      "Blocking on an async task with .Result or .Wait() in a context that has a SynchronizationContext (ASP.NET classic, WinForms) causes a classic deadlock — the blocked thread holds the context the task needs to resume on.",
  },
  {
    id: "cs-closure-loop-capture",
    language: "csharp",
    title: "for loop: declare variable inside to capture per-iteration",
    tag: "caveats",
    code: `// Classic closure-over-loop-variable bug
var fns = new List<Func<int>>();
for (int i = 0; i < 5; i++)
    fns.Add(() => i);   // captures the 'i' variable, not its value

Console.WriteLine(string.Join(" ", fns.ConvertAll(f => f())));
// 5 5 5 5 5  — all see i=5 after loop ends

// Fix: copy i into a new variable inside the loop
fns.Clear();
for (int i = 0; i < 5; i++)
{
    int local = i;         // new variable per iteration
    fns.Add(() => local);  // each lambda captures its own 'local'
}
Console.WriteLine(string.Join(" ", fns.ConvertAll(f => f())));
// 0 1 2 3 4`,
    explanation:
      "A lambda captures the variable itself (by reference to the closure slot), not its current value — create a fresh local variable inside the loop body so each lambda gets its own independent copy.",
  },
  {
    id: "cs-struct-default",
    language: "csharp",
    title: "default(T) for struct: all fields zeroed or null",
    tag: "caveats",
    code: `struct Point { public int X; public int Y; }

Point p = default;          // or default(Point)
Console.WriteLine(p.X);     // 0
Console.WriteLine(p.Y);     // 0

// default for reference types returns null
string? s = default;
Console.WriteLine(s is null);   // True

// default for bool is false, for int is 0, for enum is 0-th value
Console.WriteLine(default(bool));       // False
Console.WriteLine(default(DayOfWeek));  // Sunday (value 0)

// Gotcha: a struct is always default-constructible — no way to prevent it
// If X=0, Y=0 is an invalid Point in your domain, document or validate`,
    explanation:
      "Every struct in C# has an implicit zero-argument constructor that sets all fields to their default (0/null/false) — you cannot prevent default construction, so design structs that treat the zero state as valid.",
  },
  {
    id: "cs-interface-explicit",
    language: "csharp",
    title: "Explicit interface implementation hides the member",
    tag: "caveats",
    code: `interface ILogger
{
    void Log(string msg);
}

class Service : ILogger
{
    // Explicit implementation — only visible through the interface
    void ILogger.Log(string msg)
        => Console.WriteLine(\`[LOG] \${msg}\`);

    // Public method on the class itself
    public void DoWork()
    {
        ((ILogger)this).Log("working...");  // must cast to call
        Console.WriteLine("Done");
    }
}

var svc = new Service();
// svc.Log("hi");           // compile error — not accessible directly
((ILogger)svc).Log("hi");  // [LOG] hi
svc.DoWork();               // [LOG] working... / Done`,
    explanation:
      "Explicit interface implementation hides the member from the class's public surface — callers must cast to the interface to access it, useful when two interfaces have conflicting method signatures.",
  },
  {
    id: "cs-string-is-immutable",
    language: "csharp",
    title: "String mutation creates a new object; use StringBuilder",
    tag: "caveats",
    code: `// Each operation allocates a new string — O(n) per concatenation
string s = "";
for (int i = 0; i < 5; i++)
    s += i.ToString();   // creates a new string each time
Console.WriteLine(s);   // 01234

// For many concatenations, use StringBuilder — O(1) amortized per Append
var sb = new System.Text.StringBuilder();
for (int i = 0; i < 5; i++)
    sb.Append(i);

string result = sb.ToString();
Console.WriteLine(result);   // 01234

// StringBuilder also supports Insert, Replace, Remove
sb.Insert(0, "result: ");
sb.Replace("01", "X");
Console.WriteLine(sb);   // result: X234`,
    explanation:
      "Strings in C# are immutable — every + or += allocates a new object and copies all characters, leading to O(n²) work in a loop; StringBuilder maintains a mutable buffer with O(1) amortized appends.",
  },
  {
    id: "cs-int-overflow-checked",
    language: "csharp",
    title: "Integer overflow silently wraps in unchecked context",
    tag: "caveats",
    code: `// Unchecked (default): overflow wraps silently
int max = int.MaxValue;   // 2,147,483,647
int wrapped = max + 1;    // silently wraps to -2,147,483,648
Console.WriteLine(wrapped);  // -2147483648  — no exception!

// Checked: throws OverflowException
try
{
    int safe = checked(max + 1);
}
catch (OverflowException)
{
    Console.WriteLine("Caught overflow");
}

// Use long or BigInteger for large values
long big = (long)max + 1;
Console.WriteLine(big);   // 2147483648  — correct

// Or System.Numerics.BigInteger for unlimited size
var bi = System.Numerics.BigInteger.Pow(2, 100);
Console.WriteLine(bi);    // 1267650600228229401496703205376`,
    explanation:
      "C# integer arithmetic is unchecked by default for performance — silent wrap-around is a security and correctness risk; use checked{} blocks for safety-critical code, or switch to long/BigInteger when the range matters.",
  },
  {
    id: "cs-double-equality",
    language: "csharp",
    title: "0.1 + 0.2 != 0.3 due to IEEE 754 (same as every language)",
    tag: "caveats",
    code: `Console.WriteLine(0.1 + 0.2);           // 0.30000000000000004
Console.WriteLine(0.1 + 0.2 == 0.3);   // False!

// Fix 1: compare within a tolerance (epsilon)
double a = 0.1 + 0.2;
double b = 0.3;
bool approxEqual = Math.Abs(a - b) < 1e-10;
Console.WriteLine(approxEqual);   // True

// Fix 2: use decimal for exact base-10 arithmetic
decimal da = 0.1m + 0.2m;
Console.WriteLine(da);            // 0.3
Console.WriteLine(da == 0.3m);    // True

// Rule of thumb: double for science/engineering, decimal for money
decimal price = 19.99m;
decimal tax   = 0.08m;
Console.WriteLine(price * (1 + tax));  // 21.5892  (exact)`,
    explanation:
      "IEEE 754 binary floating-point can't represent most decimal fractions exactly — use decimal for financial calculations where exactness matters, and epsilon-based comparison instead of == for doubles.",
  },
  {
    id: "cs-nullable-boxing",
    language: "csharp",
    title: "Boxing a null Nullable<T> produces a null reference",
    tag: "caveats",
    code: `int? nullableInt = null;
int? someInt = 42;

// Boxing a null Nullable<T> produces a null object reference
object? boxedNull = nullableInt;
Console.WriteLine(boxedNull is null);   // True  — not a boxed Nullable!

// Boxing a non-null Nullable<T> boxes the underlying value type
object? boxedSome = someInt;
Console.WriteLine(boxedSome);           // 42
Console.WriteLine(boxedSome is int);    // True  — it's an int, not int?

// Unboxing: must cast to the correct type
int unboxed = (int)boxedSome!;
Console.WriteLine(unboxed);   // 42

// int? x = (int?)boxedSome;  also works`,
    explanation:
      "When you box a null Nullable<T>, the result is a null reference (not a boxed Nullable struct) — this asymmetry means that 'boxedValue is int?' returns false for what was originally an int?.",
  },
  {
    id: "cs-params-allocation",
    language: "csharp",
    title: "`params` allocates a new array on every call",
    tag: "caveats",
    code: `void Log(string category, params object[] args)
{
    Console.WriteLine(\`[\${category}] args count: \${args.Length}\`);
}

// Each call allocates a new object[] array on the heap
Log("INFO", "user", 42, true);    // allocates array of 3
Log("INFO", "single");            // allocates array of 1
Log("INFO");                      // allocates empty array!

// In hot paths, provide overloads to avoid allocations:
void Log(string category) { /* no array */ }
void Log(string category, object arg1) { /* no array */ }
void Log(string category, object arg1, object arg2) { /* no array */ }

// C# 13: params ReadOnlySpan<T> avoids heap allocation for small lists
// void Log(string cat, params ReadOnlySpan<object> args) { ... }`,
    explanation:
      "Every call to a 'params' method allocates a new array, even for zero or one argument — in performance-sensitive code, add overloads for the most common argument counts to avoid this allocation.",
  },
  {
    id: "cs-lazy-thread-safety",
    language: "csharp",
    title: "Lazy<T> mode: None vs PublicationOnly vs ExecutionAndPublication",
    tag: "caveats",
    code: `// LazyThreadSafetyMode.None — no locking (single-threaded only)
var unsafeHeavy = new Lazy<string>(
    () => "computed",
    System.Threading.LazyThreadSafetyMode.None);

// LazyThreadSafetyMode.PublicationOnly — factory may run multiple times
// but only the first published value is used (race, but safe result)
var raceOk = new Lazy<string>(
    () => "computed",
    System.Threading.LazyThreadSafetyMode.PublicationOnly);

// ExecutionAndPublication (default): lock ensures factory runs exactly once
var safeHeavy = new Lazy<string>(() =>
{
    // expensive initialisation here
    return "computed once";
});   // thread-safe by default

Console.WriteLine(safeHeavy.Value);   // computed once
Console.WriteLine(safeHeavy.IsValueCreated);  // True`,
    explanation:
      "Lazy<T>'s thread safety mode controls whether the factory can run multiple times under concurrency — the default (ExecutionAndPublication) guarantees single execution but pays a lock cost; None is fastest but unsafe for multi-threaded use.",
  },
  {
    id: "cs-events-null-check",
    language: "csharp",
    title: "Event invocation requires null check or ?.Invoke()",
    tag: "caveats",
    code: `public class Sensor
{
    public event EventHandler<int>? ValueChanged;

    private int _value;
    public int Value
    {
        get => _value;
        set
        {
            _value = value;
            // WRONG (can throw NullReferenceException if no subscribers):
            // ValueChanged(this, value);

            // CORRECT 1: null check (not thread-safe — event may unsubscribe between check and invoke)
            // if (ValueChanged != null) ValueChanged(this, value);

            // CORRECT 2: ?. is thread-safe — captures the delegate reference atomically
            ValueChanged?.Invoke(this, value);
        }
    }
}

var s = new Sensor();
s.ValueChanged += (_, v) => Console.WriteLine(\`Changed: \${v}\`);
s.Value = 42;   // Changed: 42`,
    explanation:
      "Invoking an event directly throws NullReferenceException when there are no subscribers — ?.Invoke() atomically reads and invokes the delegate, which is also safe against race conditions where a subscriber unsubscribes concurrently.",
  },
  {
    id: "cs-dispose-twice",
    language: "csharp",
    title: "Calling Dispose() twice should be safe (IDisposable contract)",
    tag: "caveats",
    code: `class ManagedResource : IDisposable
{
    private bool _disposed = false;

    public void DoWork()
    {
        if (_disposed) throw new ObjectDisposedException(nameof(ManagedResource));
        Console.WriteLine("working");
    }

    public void Dispose()
    {
        if (_disposed) return;   // safe to call twice — idempotent
        _disposed = true;
        // release unmanaged resources here
        Console.WriteLine("disposed");
        GC.SuppressFinalize(this);
    }
}

var r = new ManagedResource();
r.DoWork();   // working
r.Dispose();  // disposed
r.Dispose();  // no exception — second call is a no-op`,
    explanation:
      "The IDisposable contract requires that calling Dispose() multiple times is safe and idempotent — always guard with a _disposed flag; ObjectDisposedException should be thrown on subsequent method calls, not on Dispose() itself.",
  },
  {
    id: "cs-finalizer-order",
    language: "csharp",
    title: "Finalizer execution order is non-deterministic; never rely on it",
    tag: "caveats",
    code: `class Heavy
{
    private readonly string _name;
    public Heavy(string name) { _name = name; }

    // Finalizer (~ClassName) is called by the GC — order is undefined
    ~Heavy()
    {
        Console.WriteLine(\`~Heavy(\${_name}) finalizing\`);
        // DANGER: don't access other finalizable objects here —
        // they may have already been finalized!
    }
}

// Create objects and let them go out of scope
{
    var a = new Heavy("A");
    var b = new Heavy("B");
}

GC.Collect();
GC.WaitForPendingFinalizers();
// Output order of A and B is undefined by the spec
// Use IDisposable + 'using' for deterministic cleanup instead`,
    explanation:
      "The GC decides when and in what order finalizers run — never depend on a specific ordering or assume other objects are still alive in a finalizer; always use IDisposable with 'using' for deterministic resource cleanup.",
  },
  {
    id: "cs-value-vs-ref-semantics",
    language: "csharp",
    title: "Value types (struct) vs reference types (class): copy vs share",
    tag: "types",
    code: `struct ValuePoint { public int X, Y; }
class  RefPoint   { public int X, Y; }

ValuePoint vp1 = new ValuePoint { X = 1, Y = 2 };
ValuePoint vp2 = vp1;   // full copy — independent
vp2.X = 99;
Console.WriteLine(vp1.X);  // 1  — unaffected

RefPoint rp1 = new RefPoint { X = 1, Y = 2 };
RefPoint rp2 = rp1;   // same object — shared reference
rp2.X = 99;
Console.WriteLine(rp1.X);  // 99  — rp1 sees the change!

// Method parameters: structs are copied, classes pass the reference
void Mutate(ValuePoint p) { p.X = 0; }   // mutates the local copy
void Mutate(RefPoint p)   { p.X = 0; }   // mutates the shared object`,
    explanation:
      "Value types are copied on assignment and parameter passing — each variable owns its data; reference types share the same heap object through references, so assignment creates an alias, not a copy.",
  },
  {
    id: "cs-struct-vs-class-memory",
    language: "csharp",
    title: "Struct lives on stack (usually); class always on heap",
    tag: "types",
    code: `// Struct as a local variable: on the stack — no GC pressure
struct Vector3 { public float X, Y, Z; }

void Compute()
{
    Vector3 v = new Vector3 { X = 1, Y = 2, Z = 3 };  // stack allocation
    // v is freed automatically when Compute() returns — no GC
}

// Class: always on the managed heap — GC must collect it
class BigData { public byte[] Buffer = new byte[1024]; }

void UseHeap()
{
    var bd = new BigData();   // allocated on heap
}   // bd is eligible for GC after this

// Struct inside a class: lives on the heap as part of the class object
class Container { public Vector3 Position; }   // Position is inline on heap
// No separate heap allocation for Position — it's embedded`,
    explanation:
      "Struct instances as local variables are allocated on the stack and freed when the method returns — no GC involvement; structs inside a class or array still live on the heap but are embedded, not separately allocated.",
  },
  {
    id: "cs-decimal-vs-double",
    language: "csharp",
    title: "decimal for money (exact base-10); double for science (fast)",
    tag: "types",
    code: `// double: 64-bit IEEE 754, ~15-16 significant digits, fast
double d = 0.1 + 0.2;
Console.WriteLine(d);             // 0.30000000000000004  — rounding error
Console.WriteLine(d == 0.3);      // False

// decimal: 128-bit base-10, ~28-29 significant digits, slower
decimal m = 0.1m + 0.2m;
Console.WriteLine(m);             // 0.3  — exact
Console.WriteLine(m == 0.3m);     // True

// Money: always decimal
decimal price    = 29.99m;
decimal discount = 0.10m;
decimal total    = price * (1 - discount);
Console.WriteLine(total);   // 26.991  (exact)

// Scientific: double is fine and fast
double pi = Math.PI;
double area = pi * 5.0 * 5.0;
Console.WriteLine(area);    // 78.53981633974483`,
    explanation:
      "decimal uses base-10 arithmetic so decimal fractions like 0.1 are exact — at the cost of ~2-3× slower arithmetic and larger size; double is the right choice for physics, graphics, and statistics where speed matters.",
  },
  {
    id: "cs-long-vs-int",
    language: "csharp",
    title: "int is 32-bit; long is 64-bit; check range before casting",
    tag: "types",
    code: `int  maxInt  = int.MaxValue;   // 2,147,483,647  (~2.1 billion)
long maxLong = long.MaxValue;  // 9,223,372,036,854,775,807  (~9.2 quintillion)

Console.WriteLine(maxInt);   // 2147483647
Console.WriteLine(maxLong);  // 9223372036854775807

// Silent overflow when multiplying two ints before widening
int a = 100_000, b = 100_000;
int  bad  = a * b;               // overflows! -1794967296
long good = (long)a * b;         // widen first, then multiply

Console.WriteLine(bad);          // -1794967296  (wraps)
Console.WriteLine(good);         // 10000000000  (correct)

// Use 'L' suffix for long literals
long bigLiteral = 10_000_000_000L;`,
    explanation:
      "int overflow is a common bug when multiplying values that individually fit in int but whose product doesn't — cast at least one operand to long before the multiplication to ensure correct widening.",
  },
  {
    id: "cs-sbyte-byte-range",
    language: "csharp",
    title: "byte 0–255; sbyte -128–127",
    tag: "types",
    code: `byte  ub = 255;    // unsigned byte: 0 to 255
sbyte sb = -128;   // signed byte: -128 to 127

Console.WriteLine(byte.MinValue,  byte.MaxValue);   // 0   255
Console.WriteLine(sbyte.MinValue, sbyte.MaxValue);  // -128  127

// Overflow: byte wraps silently in unchecked context
unchecked
{
    byte wrapped = (byte)(255 + 1);
    Console.WriteLine(wrapped);   // 0  — wraps around
}

// Common use: raw binary data and protocol fields
byte[] ipBytes = { 192, 168, 1, 1 };
string ip = string.Join(".", ipBytes);
Console.WriteLine(ip);   // 192.168.1.1`,
    explanation:
      "byte (0–255) is the standard type for raw binary data and protocol fields; sbyte (-128–127) is rarely used in practice — most code uses byte and casts to int when arithmetic might overflow.",
  },
  {
    id: "cs-float-vs-double",
    language: "csharp",
    title: "float is 32-bit (~7 digits); double is 64-bit (~15-16 digits)",
    tag: "types",
    code: `float  f = 1.234567890123456789f;
double d = 1.234567890123456789;

Console.WriteLine(f);   // 1.2345679  — only ~7 significant digits
Console.WriteLine(d);   // 1.2345678901234568  — ~15-16 digits

// float uses an 'f' or 'F' suffix; double is the default
float  area  = 3.14f * 5f * 5f;   // float arithmetic
double area2 = Math.PI * 5.0 * 5.0;  // double arithmetic (more precise)

// float halves memory vs double — useful for GPU / ML / large arrays
float[]  fArr = new float[1_000_000];   // ~4 MB
double[] dArr = new double[1_000_000];  // ~8 MB

Console.WriteLine($"float size: {sizeof(float)}, double size: {sizeof(double)}");
// float size: 4, double size: 8`,
    explanation:
      "float (32-bit) stores ~7 significant decimal digits and uses half the memory of double (64-bit, ~15-16 digits) — use float in graphics, audio, and ML tensors where memory bandwidth matters; use double for most other calculations.",
  },
  {
    id: "cs-char-unicode",
    language: "csharp",
    title: "char is a UTF-16 code unit, not always a full Unicode code point",
    tag: "types",
    code: `// char is a single UTF-16 code unit (16 bits, U+0000 to U+FFFF)
char a = 'A';
Console.WriteLine((int)a);   // 65

// Characters outside the BMP need two chars (a surrogate pair)
string emoji = "😀";   // U+1F600 — requires a surrogate pair
Console.WriteLine(emoji.Length);   // 2  — two char values, not one!

// StringInfo gives correct grapheme/code-point counts
var info = new System.Globalization.StringInfo(emoji);
Console.WriteLine(info.LengthInTextElements);   // 1

// Iterating chars can split surrogates
foreach (char c in emoji)
    Console.Write((int)c + " ");   // 55357 56832 (surrogate pair)

// Use string.EnumerateRunes() for correct code-point iteration
foreach (System.Text.Rune r in emoji.EnumerateRunes())
    Console.WriteLine(r.Value);   // 128512 (0x1F600)`,
    explanation:
      "C#'s char is a UTF-16 code unit — characters above U+FFFF (emoji, some CJK extensions) need two chars as a surrogate pair, so string.Length and indexing can surprise you; use Rune for correct Unicode code-point handling.",
  },
  {
    id: "cs-string-as-ienumerable",
    language: "csharp",
    title: "string implements IEnumerable<char>",
    tag: "types",
    code: `string text = "Hello";

// string is IEnumerable<char> — usable in foreach
foreach (char c in text)
    Console.Write(c + " ");   // H e l l o
Console.WriteLine();

// LINQ works directly on strings
int vowelCount = text.Count(c => "aeiouAEIOU".Contains(c));
Console.WriteLine(vowelCount);   // 2  (e, o)

string upper = new string(text.Select(c => char.ToUpper(c)).ToArray());
Console.WriteLine(upper);   // HELLO

// Reverse a string using LINQ
string reversed = new string(text.Reverse().ToArray());
Console.WriteLine(reversed);   // olleH`,
    explanation:
      "string implements IEnumerable<char>, so you can use foreach and all LINQ operators directly on it — just remember each element is a char (UTF-16 code unit), not a Unicode code point.",
  },
  {
    id: "cs-nullable-value-type",
    language: "csharp",
    title: "Nullable<T> / T? wraps value types; boxed as T or null",
    tag: "types",
    code: `// T? is syntactic sugar for Nullable<T>
int? a = null;
int? b = 42;

Console.WriteLine(a.HasValue);   // False
Console.WriteLine(b.HasValue);   // True
Console.WriteLine(b.Value);      // 42
Console.WriteLine(b ?? 0);       // 42
Console.WriteLine(a ?? 0);       // 0  (fallback)

// Nullable<T> in structs has a memory footprint of T + 1 byte (bool)
Console.WriteLine(System.Runtime.InteropServices.Marshal.SizeOf<int?>());   // 8 (padded)

// Boxing: null Nullable<T> → null object; non-null Nullable<T> → boxed T
object? boxedNull = a;      // null reference
object? boxedVal  = b;      // boxed int (42), NOT boxed int?
Console.WriteLine(boxedVal is int);   // True`,
    explanation:
      "Nullable<T> adds a HasValue bool to any value type so it can represent 'no value' — when boxed, a non-null Nullable<T> becomes a boxed T (not a boxed Nullable<T>), which surprises people using 'is int?' checks.",
  },
  {
    id: "cs-nullable-ref-type",
    language: "csharp",
    title: "Nullable reference types (string?) are a compile-time annotation",
    tag: "types",
    code: `#nullable enable   // or set in .csproj: <Nullable>enable</Nullable>

// string? means "this reference might be null" — compile-time only
string? maybeNull = null;   // OK
string  notNull   = "hi";   // non-nullable — compiler warns if null is assigned

// Without null check, the compiler warns about potential null dereference
int? len = maybeNull?.Length;   // safe: ?. handles null

// Dereference after check: no warning
if (maybeNull is not null)
    Console.WriteLine(maybeNull.Length);  // safe — narrowed to non-null

// Null-forgiving operator: suppress warning (use sparingly)
Console.WriteLine(maybeNull!.Length);  // tell compiler "I know it's not null"`,
    explanation:
      "Nullable reference types (enabled with #nullable enable) are purely a static analysis feature — at runtime string? and string are identical; the compiler uses the annotation to warn about potential null dereferences.",
  },
  {
    id: "cs-dynamic-type",
    language: "csharp",
    title: "`dynamic` bypasses static type checking; resolved at runtime",
    tag: "types",
    code: `// dynamic: compiler defers ALL type checking to runtime (DLR)
dynamic obj = "Hello";
Console.WriteLine(obj.Length);   // 5  — resolved at runtime

obj = 42;                        // no compile error — type changes
Console.WriteLine(obj + 1);      // 43

// Calling a non-existent member throws RuntimeBinderException
try
{
    Console.WriteLine(obj.NonExistentMethod());
}
catch (Microsoft.CSharp.RuntimeBinder.RuntimeBinderException e)
{
    Console.WriteLine(e.Message);
}

// Use case: interop with COM, JSON, Python.NET, reflection-heavy code
// Avoid in normal code — you lose IntelliSense, type safety, and performance`,
    explanation:
      "'dynamic' defers all member resolution to runtime via the Dynamic Language Runtime — useful for COM interop and scripting integration, but you lose compile-time safety, IDE support, and pay a performance cost on every operation.",
  },
  {
    id: "cs-object-type",
    language: "csharp",
    title: "`object` is the root of all C# types; object vs dynamic",
    tag: "types",
    code: `// Every type in C# inherits from object (System.Object)
object o = 42;        // boxing: int stored as object
object s = "hello";
object b = true;

Console.WriteLine(o.GetType());   // System.Int32
Console.WriteLine(s.GetType());   // System.String

// object has a fixed interface: GetType, ToString, Equals, GetHashCode
// Calling other members requires a cast
string text = (string)s;
Console.WriteLine(text.Length);   // 5

// Key difference from dynamic:
// object: compile-time checked (need cast to access members)
// dynamic: runtime-checked (no cast needed, but no safety)
dynamic d = "hello";
Console.WriteLine(d.Length);   // works at runtime, no cast needed`,
    explanation:
      "Every C# type derives from object, so object can hold any value — but you must cast to access type-specific members, and the compiler verifies the cast is syntactically valid; dynamic goes further by deferring all checks to runtime.",
  },
  {
    id: "cs-implicit-explicit-conv",
    language: "csharp",
    title: "Implicit vs explicit conversion operators",
    tag: "types",
    code: `struct Celsius
{
    public double Value;
    public Celsius(double v) { Value = v; }

    // Implicit: no cast syntax needed — safe, lossless
    public static implicit operator Fahrenheit(Celsius c)
        => new Fahrenheit(c.Value * 9 / 5 + 32);
}

struct Fahrenheit
{
    public double Value;
    public Fahrenheit(double v) { Value = v; }

    // Explicit: requires cast syntax — signals possible data loss
    public static explicit operator Celsius(Fahrenheit f)
        => new Celsius((f.Value - 32) * 5 / 9);
}

Celsius  c = new Celsius(100);
Fahrenheit f = c;                // implicit — no cast needed
Console.WriteLine(f.Value);      // 212

Celsius back = (Celsius)f;       // explicit cast required
Console.WriteLine(back.Value);   // 100`,
    explanation:
      "Implicit conversions are for safe, lossless transformations that the compiler performs automatically; explicit conversions signal that data might be lost or a runtime check is needed, requiring the caller to write an explicit cast.",
  },
  {
    id: "cs-type-alias-using",
    language: "csharp",
    title: "`using Alias = SomeLongType;` for readability",
    tag: "types",
    code: `// File-level or namespace-level type alias
using StringMap  = System.Collections.Generic.Dictionary<string, string>;
using IntMatrix  = System.Collections.Generic.List<System.Collections.Generic.List<int>>;

// C# 12: global using alias (put in a GlobalUsings.cs file)
// global using StringMap = Dictionary<string, string>;

var headers = new StringMap
{
    ["Content-Type"]  = "application/json",
    ["Authorization"] = "Bearer token123",
};

Console.WriteLine(headers["Content-Type"]);  // application/json

// C# 12: using alias for any type (including tuples, arrays)
using Point = (int X, int Y);
Point p = (3, 4);
Console.WriteLine(p.X);   // 3`,
    explanation:
      "using aliases rename complex generic types locally in a file, reducing noise in signatures and keeping long generic types like Dictionary<string, List<Tuple<int,string>>> manageable — C# 12 extended this to any type including tuples.",
  },
  {
    id: "cs-ienumerable-vs-ilist",
    language: "csharp",
    title: "IEnumerable<T> (lazy) vs IList<T> (indexed, in-memory)",
    tag: "families",
    code: `using System.Collections.Generic;

// IEnumerable<T>: minimal contract — just forward iteration
IEnumerable<int> lazy = GetNumbers();   // could be a file, DB query, etc.
foreach (int n in lazy)
    Console.Write(n + " ");
Console.WriteLine();

// IList<T>: indexed access, Count, Add, Remove, Insert
IList<int> list = new List<int> { 1, 2, 3 };
Console.WriteLine(list[1]);    // 2  — O(1) index access
Console.WriteLine(list.Count); // 3
list[0] = 99;                  // O(1) set

// Best practice: accept IEnumerable<T> in APIs to stay flexible
void Print(IEnumerable<int> items) => Console.WriteLine(string.Join(",", items));

static IEnumerable<int> GetNumbers() { yield return 1; yield return 2; yield return 3; }`,
    explanation:
      "IEnumerable<T> is the minimal read-only, forward-only contract that works with lazy sequences — accept it in method parameters to stay flexible; return IList<T> when callers need random access, count, or mutation.",
  },
  {
    id: "cs-list-vs-array",
    language: "csharp",
    title: "List<T> (resizable) vs T[] (fixed-size, slightly faster)",
    tag: "families",
    code: `// Array: fixed size, contiguous memory, slightly faster iteration
int[] arr = new int[5];
arr[0] = 1; arr[1] = 2;
// arr[5] = 99;  // IndexOutOfRangeException — can't grow

// List<T>: dynamic size, wraps an array internally, O(1) amortized Add
var list = new List<int> { 1, 2, 3 };
list.Add(4);   // grows automatically
list.RemoveAt(0);
Console.WriteLine(string.Join(", ", list));   // 2, 3, 4

// Array is preferred when: size is fixed, performance-critical, interop
// List is preferred when: size is unknown or changes frequently

// Convert between them
int[] fromList = list.ToArray();   // creates a copy
List<int> fromArr = new List<int>(arr);

// Both support LINQ, foreach, and Span/Memory slicing`,
    explanation:
      "Arrays are slightly faster for random access and iteration due to fixed-size bounds checks being eliminated by the JIT — use arrays for fixed-size performance-critical data and List<T> when the size is dynamic.",
  },
  {
    id: "cs-icollection-vs-ilist",
    language: "csharp",
    title: "ICollection<T> adds Count/Add/Remove to IEnumerable<T>",
    tag: "families",
    code: `// Interface hierarchy: IEnumerable<T> ← ICollection<T> ← IList<T>

// IEnumerable<T>: foreach only
IEnumerable<int> e = new[] { 1, 2, 3 };

// ICollection<T>: adds Count, Add, Remove, Contains, IsReadOnly
ICollection<int> col = new List<int> { 1, 2, 3 };
col.Add(4);
Console.WriteLine(col.Count);      // 4
Console.WriteLine(col.Contains(2));  // True
col.Remove(2);
Console.WriteLine(col.Count);      // 3

// IList<T>: adds indexer and InsertAt/RemoveAt
IList<int> lst = new List<int> { 1, 2, 3 };
Console.WriteLine(lst[1]);   // 2
lst.Insert(0, 99);
Console.WriteLine(lst[0]);   // 99`,
    explanation:
      "ICollection<T> sits between IEnumerable<T> and IList<T> — use it in APIs when you need to know the count and add/remove items but don't need indexed access, keeping the contract as narrow as possible.",
  },
  {
    id: "cs-ireadonly-vs-readonly",
    language: "csharp",
    title: "IReadOnlyList<T> vs ReadOnlyCollection<T>",
    tag: "families",
    code: `using System.Collections.ObjectModel;

var source = new List<string> { "a", "b", "c" };

// IReadOnlyList<T>: interface — index + count, no Add/Remove methods
IReadOnlyList<string> roInterface = source;
Console.WriteLine(roInterface[0]);    // a
Console.WriteLine(roInterface.Count); // 3
// roInterface.Add("d");              // no Add — interface doesn't expose it

// ReadOnlyCollection<T>: concrete wrapper class
var roWrapper = new ReadOnlyCollection<string>(source);
// roWrapper.Add("d");  // compile error

// Key difference: IReadOnlyList is just an interface —
// the underlying list is STILL mutable if you hold a reference
source.Add("d");
Console.WriteLine(roInterface.Count);  // 4  — it changed!
Console.WriteLine(roWrapper.Count);    // 4  — same underlying list`,
    explanation:
      "IReadOnlyList<T> is an interface that hides mutation — callers using only that reference can't mutate it, but the list can change if someone holds the original mutable reference; ReadOnlyCollection<T> is a concrete wrapper that provides the same guarantee.",
  },
  {
    id: "cs-dictionary-vs-hashtable",
    language: "csharp",
    title: "Dictionary<K,V> (generic) vs Hashtable (legacy, boxing)",
    tag: "families",
    code: `// Hashtable (legacy): non-generic, stores object — causes boxing, unsafe
var ht = new System.Collections.Hashtable();
ht["key"] = 42;                  // boxing: int → object
int val = (int)ht["key"];        // explicit cast + unboxing required
ht["oops"] = "not an int";       // no type safety — compiles fine

// Dictionary<K,V> (preferred): generic, type-safe, no boxing
var dict = new Dictionary<string, int>();
dict["key"] = 42;                // no boxing
int val2 = dict["key"];          // no cast needed
// dict["oops"] = "text";        // compile error — type safe!

// Performance: Dictionary<K,V> is faster and allocates less
// Hashtable is synchronized by default; Dictionary is NOT (use ConcurrentDictionary)
Console.WriteLine(\`Dict count: \${dict.Count}\`);  // Dict count: 1`,
    explanation:
      "Hashtable is a pre-generics legacy type that boxes value types and loses type safety — always use Dictionary<K,V> in new code; if thread-safety is needed, use ConcurrentDictionary<K,V> instead.",
  },
  {
    id: "cs-hashset-vs-sortedset",
    language: "csharp",
    title: "HashSet<T> O(1) lookup vs SortedSet<T> O(log n) ordered",
    tag: "families",
    code: `var hashSet   = new HashSet<int>   { 5, 1, 3, 2, 4 };
var sortedSet = new SortedSet<int> { 5, 1, 3, 2, 4 };

// HashSet: O(1) Contains, Add, Remove — but unordered
Console.WriteLine(hashSet.Contains(3));  // True — O(1)
Console.WriteLine(string.Join(", ", hashSet));  // unordered output

// SortedSet: O(log n) for Contains/Add/Remove — always sorted
Console.WriteLine(sortedSet.Contains(3));  // True — O(log n)
Console.WriteLine(string.Join(", ", sortedSet));  // 1, 2, 3, 4, 5

// SortedSet bonus: range queries
var between = sortedSet.GetViewBetween(2, 4);
Console.WriteLine(string.Join(", ", between));   // 2, 3, 4

// Rule: HashSet for pure membership tests; SortedSet for ordered + range`,
    explanation:
      "HashSet<T> offers O(1) operations at the cost of no ordering — SortedSet<T> uses a tree to maintain sorted order with O(log n) operations and enables efficient range queries via GetViewBetween.",
  },
  {
    id: "cs-task-vs-valuetask",
    language: "csharp",
    title: "Task<T> vs ValueTask<T>: heap vs stack for hot paths",
    tag: "families",
    code: `// Task<T>: always allocates on the heap — fine for most cases
async Task<int> GetDataAsync()
{
    await Task.Delay(10);
    return 42;
}

// ValueTask<T>: avoids heap allocation when result is synchronous
// (e.g., cache hit path returns immediately without awaiting)
async ValueTask<int> GetCachedAsync(bool cached)
{
    if (cached) return 42;           // synchronous — no heap allocation!
    await Task.Delay(10);
    return 99;
}

int a = await GetDataAsync();
int b = await GetCachedAsync(true);   // no allocation on cache hit
int c = await GetCachedAsync(false);  // allocates (async path)
Console.WriteLine(a, b, c);   // 42 42 99`,
    explanation:
      "ValueTask<T> avoids a heap allocation on the fast/synchronous path — use it in high-frequency APIs where a cache hit means the result is available immediately; Task<T> is simpler and right for most other cases.",
  },
  {
    id: "cs-thread-vs-task",
    language: "csharp",
    title: "Thread vs Task: OS thread vs thread-pool abstraction",
    tag: "families",
    code: `using System.Threading;
using System.Threading.Tasks;

// Thread: explicit OS thread — heavy (1MB stack by default)
var thread = new Thread(() =>
{
    Console.WriteLine(\`Thread id: \${Thread.CurrentThread.ManagedThreadId}\`);
});
thread.Start();
thread.Join();   // wait for completion

// Task: runs on the thread pool — lightweight, composable
var task = Task.Run(() =>
{
    Console.WriteLine(\`Task thread id: \${Thread.CurrentThread.ManagedThreadId}\`);
    return 42;
});
int result = await task;
Console.WriteLine(\`Result: \${result}\`);   // Result: 42

// Prefer Task for CPU-bound work, async/await for I/O-bound work
// Use Thread when you need explicit control (priority, foreground/background)`,
    explanation:
      "Thread maps to a real OS thread with significant overhead (~1MB stack, kernel object) — Task runs on the thread pool and supports composition, cancellation, and async/await; prefer Task for almost everything.",
  },
  {
    id: "cs-action-vs-func",
    language: "csharp",
    title: "Action<T> (void) vs Func<T,R> (returns) vs Predicate<T> (bool)",
    tag: "families",
    code: `// Action: delegate that returns void
Action<string> print = msg => Console.WriteLine(msg);
print("Hello");   // Hello

// Action<T1,T2,...> for multiple parameters, up to 16
Action<int, int> add = (a, b) => Console.WriteLine(a + b);
add(3, 4);   // 7

// Func<T,TResult>: delegate that returns a value
Func<int, int> square = x => x * x;
Console.WriteLine(square(5));   // 25

// Func<T1,T2,TResult>: last type param is the return type
Func<int, int, string> describe = (a, b) => \`\${a} + \${b} = \${a + b}\`;

// Predicate<T>: shorthand for Func<T, bool>
Predicate<int> isEven = n => n % 2 == 0;
Console.WriteLine(isEven(4));   // True

// They're interchangeable: Predicate<T> ≈ Func<T,bool>
Func<int, bool> alsoEven = n => n % 2 == 0;`,
    explanation:
      "Action<T> is a void delegate, Func<T,TResult> returns a value, and Predicate<T> is a shorthand for Func<T,bool> — use the most specific type to signal intent; Predicate is recognised by FindAll/Find methods on List<T>.",
  },
  {
    id: "cs-delegate-vs-event",
    language: "csharp",
    title: "Delegate field (callable anywhere) vs event (encapsulated)",
    tag: "families",
    code: `class WithDelegate
{
    // Public delegate field: anyone can invoke, assign, or clear it
    public Action<string>? OnMessage;
}

class WithEvent
{
    // Event: external code can only += and -= ; invoke is class-only
    public event Action<string>? OnMessage;

    public void Trigger(string msg) => OnMessage?.Invoke(msg);
}

var wd = new WithDelegate();
wd.OnMessage += m => Console.WriteLine("Sub 1: " + m);
wd.OnMessage = null;          // external code can wipe all subscribers!
wd.OnMessage?.Invoke("test"); // (nothing — cleared)

var we = new WithEvent();
we.OnMessage += m => Console.WriteLine("Sub 1: " + m);
// we.OnMessage = null;        // compile error — protected
// we.OnMessage.Invoke("x");   // compile error — invoke from outside
we.Trigger("hello");           // Sub 1: hello`,
    explanation:
      "A public delegate field exposes too much — external code can reassign or invoke it directly; 'event' restricts external access to subscribe/unsubscribe only, keeping the invocation control inside the class.",
  },
  {
    id: "cs-abstract-vs-interface",
    language: "csharp",
    title: "Abstract class (shared state + behavior) vs interface (contract)",
    tag: "families",
    code: `// Abstract class: can have fields, constructors, and implemented methods
abstract class Animal
{
    public string Name { get; }                // shared state
    protected Animal(string name) { Name = name; }

    public abstract string Speak();           // subclasses must implement
    public string Greet() => \`Hi, I'm \${Name} and I say \${Speak()}\`;  // shared behaviour
}

class Dog : Animal
{
    public Dog(string name) : base(name) { }
    public override string Speak() => "Woof";
}

// Interface: pure contract, no state, supports multiple implementation
interface ISwimmable { void Swim(); }
interface IRunnable  { void Run(); }

class Labrador : Animal, ISwimmable, IRunnable
{
    public Labrador(string name) : base(name) { }
    public override string Speak() => "Woof!";
    public void Swim() => Console.WriteLine(\`\${Name} swims\`);
    public void Run()  => Console.WriteLine(\`\${Name} runs\`);
}`,
    explanation:
      "Use an abstract class when you want to share code and state among related types via inheritance; use an interface to define a contract that unrelated classes can implement — C# supports multiple interface implementation but single class inheritance.",
  },
  {
    id: "cs-record-vs-struct",
    language: "csharp",
    title: "record (reference type, value equality) vs struct (value type)",
    tag: "families",
    code: `// record: reference type with compiler-generated value equality
record Point(double X, double Y);

var p1 = new Point(1, 2);
var p2 = new Point(1, 2);
Console.WriteLine(p1 == p2);           // True — value equality
Console.WriteLine(ReferenceEquals(p1, p2));  // False — different objects

// with-expression creates a modified copy
var p3 = p1 with { X = 99 };
Console.WriteLine(p3);   // Point { X = 99, Y = 2 }

// struct: value type, value semantics, stack allocation
struct SPoint { public double X, Y; }
var sp1 = new SPoint { X = 1, Y = 2 };
var sp2 = sp1;   // copy
sp2.X = 99;
Console.WriteLine(sp1.X);   // 1 — independent copy`,
    explanation:
      "record is a class with compiler-generated equality based on property values and a with-expression for non-destructive mutation — struct is a value type with copy semantics but no with-expression or built-in value equality.",
  },
  {
    id: "cs-record-vs-class",
    language: "csharp",
    title: "record vs class: value equality, with-expressions, immutability",
    tag: "families",
    code: `// class: reference equality by default, mutable
class PersonClass
{
    public string Name { get; set; } = "";
    public int Age { get; set; }
}
var c1 = new PersonClass { Name = "Alice", Age = 30 };
var c2 = new PersonClass { Name = "Alice", Age = 30 };
Console.WriteLine(c1 == c2);   // False — same content, different refs

// record: value equality, init-only by default, with-expression
record PersonRecord(string Name, int Age);

var r1 = new PersonRecord("Alice", 30);
var r2 = new PersonRecord("Alice", 30);
Console.WriteLine(r1 == r2);   // True — structural equality

var r3 = r1 with { Age = 31 };
Console.WriteLine(r3);   // PersonRecord { Name = Alice, Age = 31 }`,
    explanation:
      "record generates Equals, ==, GetHashCode, ToString, and with-expression support automatically — use records for immutable data transfer objects and DTOs where value equality is natural.",
  },
  {
    id: "cs-struct-vs-record-struct",
    language: "csharp",
    title: "struct vs record struct: equality and with-expression",
    tag: "families",
    code: `// Plain struct: field-by-field equality, but generated by reflection (slow)
struct Point2D { public int X, Y; }
var a = new Point2D { X = 1, Y = 2 };
var b = new Point2D { X = 1, Y = 2 };
Console.WriteLine(a.Equals(b));  // True — but ValueType.Equals uses reflection

// record struct (C# 10): compiler-generated fast value equality + with-expression
record struct Point3D(int X, int Y, int Z);

var p1 = new Point3D(1, 2, 3);
var p2 = new Point3D(1, 2, 3);
Console.WriteLine(p1 == p2);    // True — compiler-generated, no reflection

var p3 = p1 with { Z = 99 };    // with-expression — creates new struct
Console.WriteLine(p3);          // Point3D { X = 1, Y = 2, Z = 99 }`,
    explanation:
      "record struct combines struct's stack allocation and value semantics with record's compiler-generated fast equality, GetHashCode, ToString, and with-expressions — prefer it over plain struct when you want value equality without boxing.",
  },
  {
    id: "cs-inheritance-chain",
    language: "csharp",
    title: "Calling base.Method() in an overriding method",
    tag: "classes",
    code: `class Vehicle
{
    public virtual string Describe() => "I am a vehicle";
}

class Car : Vehicle
{
    public override string Describe()
    {
        string base_desc = base.Describe();   // calls Vehicle.Describe()
        return \`\${base_desc}, specifically a car\`;
    }
}

class ElectricCar : Car
{
    public override string Describe()
    {
        string car_desc = base.Describe();    // calls Car.Describe()
        return \`\${car_desc}, and I'm electric\`;
    }
}

var ev = new ElectricCar();
Console.WriteLine(ev.Describe());
// I am a vehicle, specifically a car, and I'm electric`,
    explanation:
      "base.Method() calls the nearest ancestor's implementation — each level in the chain can augment the base behaviour, making it natural to build up functionality layer by layer.",
  },
  {
    id: "cs-virtual-override",
    language: "csharp",
    title: "virtual/override vs new (hiding)",
    tag: "classes",
    code: `class Base
{
    public virtual void Show()  => Console.WriteLine("Base.Show");
    public         void Hidden() => Console.WriteLine("Base.Hidden");
}

class Derived : Base
{
    // override: polymorphic — called even through a Base reference
    public override void Show()   => Console.WriteLine("Derived.Show");

    // new: hides Base.Hidden — NOT polymorphic
    public new void Hidden() => Console.WriteLine("Derived.Hidden");
}

Base b = new Derived();
b.Show();     // Derived.Show  — virtual dispatch works
b.Hidden();   // Base.Hidden   — 'new' hiding does NOT override dispatch

Derived d = new Derived();
d.Show();     // Derived.Show
d.Hidden();   // Derived.Hidden`,
    explanation:
      "override participates in virtual dispatch — the most-derived implementation is called regardless of the reference type; 'new' just hides the base member for that specific reference type, which is rarely what you want.",
  },
  {
    id: "cs-sealed-class",
    language: "csharp",
    title: "`sealed` prevents inheritance; JIT can devirtualize calls",
    tag: "classes",
    code: `// sealed class cannot be inherited
sealed class Singleton
{
    private static readonly Singleton _instance = new();
    private Singleton() { }
    public static Singleton Instance => _instance;

    public void DoWork() => Console.WriteLine("Working");
}

// class Sub : Singleton { }   // compile error: cannot derive from sealed type

// sealed override: seal a specific virtual method in a subclass
class Base    { public virtual  void Run() => Console.WriteLine("Base"); }
class Mid : Base { public sealed override void Run() => Console.WriteLine("Mid"); }
// class Child : Mid { public override void Run() { } }  // compile error

var s = Singleton.Instance;
s.DoWork();   // Working`,
    explanation:
      "Sealing a class prevents subclassing, which lets the JIT devirtualize calls (direct call instead of vtable lookup) — it's also used to prevent override chains from going further in class hierarchies.",
  },
  {
    id: "cs-partial-class",
    language: "csharp",
    title: "`partial class` splits a class definition across files",
    tag: "classes",
    code: `// File: Person.Core.cs
partial class Person
{
    public string Name { get; init; } = "";
    public int    Age  { get; init; }

    public string Greet() => \`Hello, I'm \${Name}\`;
}

// File: Person.Validation.cs
partial class Person
{
    public bool IsAdult => Age >= 18;

    public void Validate()
    {
        if (string.IsNullOrWhiteSpace(Name))
            throw new ArgumentException("Name required");
        if (Age < 0 || Age > 150)
            throw new ArgumentOutOfRangeException(nameof(Age));
    }
}

// Both parts are compiled into a single Person class
var p = new Person { Name = "Alice", Age = 30 };
Console.WriteLine(p.Greet());    // Hello, I'm Alice
Console.WriteLine(p.IsAdult);    // True`,
    explanation:
      "partial class splits one class across multiple files — the compiler merges them at compile time; this is essential for code generators (WinForms designer, EF Core scaffolding) that write one partial file while you maintain another.",
  },
  {
    id: "cs-partial-method",
    language: "csharp",
    title: "partial method: declaration and optional implementation",
    tag: "classes",
    code: `partial class Order
{
    public int Id { get; set; }
    public decimal Total { get; set; }

    // Declaration only — if no implementation exists, call sites are removed by the compiler
    partial void OnTotalChanged(decimal newTotal);

    public void SetTotal(decimal value)
    {
        Total = value;
        OnTotalChanged(value);   // call site compiled away if not implemented
    }
}

// Separate file: provide the implementation
partial class Order
{
    partial void OnTotalChanged(decimal newTotal)
    {
        Console.WriteLine(\`Total changed to \${newTotal:C}\`);
    }
}

var o = new Order { Id = 1 };
o.SetTotal(99.99m);   // Total changed to $99.99`,
    explanation:
      "A partial method declares a hook that may or may not have an implementation — if no implementation is provided, the compiler removes the declaration and all call sites entirely, leaving zero overhead.",
  },
  {
    id: "cs-extension-method",
    language: "csharp",
    title: "Extension method with `this` first parameter",
    tag: "classes",
    code: `// Extension methods must be in a static class
public static class StringExtensions
{
    // 'this string s' makes it callable as s.Truncate(n)
    public static string Truncate(this string s, int maxLength)
    {
        if (s.Length <= maxLength) return s;
        return s[..maxLength] + "...";
    }

    public static bool IsNullOrEmpty(this string? s)
        => string.IsNullOrEmpty(s);
}

string text = "Hello, World!";
Console.WriteLine(text.Truncate(8));         // Hello, W...
Console.WriteLine(text.Truncate(100));       // Hello, World!

string? empty = null;
Console.WriteLine(empty.IsNullOrEmpty());    // True  (no NullReferenceException)`,
    explanation:
      "Extension methods let you add methods to existing types without modifying them — they're compiled as static calls but appear as instance methods in IntelliSense; LINQ is built entirely from extension methods on IEnumerable<T>.",
  },
  {
    id: "cs-operator-overload",
    language: "csharp",
    title: "Operator overloading for custom value types",
    tag: "classes",
    code: `struct Money
{
    public decimal Amount { get; }
    public string  Currency { get; }

    public Money(decimal amount, string currency)
    {
        Amount = amount; Currency = currency;
    }

    public static Money operator +(Money a, Money b)
    {
        if (a.Currency != b.Currency)
            throw new InvalidOperationException("Currency mismatch");
        return new Money(a.Amount + b.Amount, a.Currency);
    }

    public static bool operator ==(Money a, Money b)
        => a.Amount == b.Amount && a.Currency == b.Currency;
    public static bool operator !=(Money a, Money b) => !(a == b);

    public override string ToString() => \`\${Amount:F2} \${Currency}\`;
}

var a = new Money(10m, "USD");
var b = new Money(5m, "USD");
Console.WriteLine(a + b);  // 15.00 USD`,
    explanation:
      "Operator overloading lets custom types use familiar arithmetic and comparison syntax — use it sparingly and only when the operator semantics are obvious (vectors, money, complex numbers); always implement == and != together.",
  },
  {
    id: "cs-indexer-property",
    language: "csharp",
    title: "Indexer: `this[int i]` property",
    tag: "classes",
    code: `class Matrix
{
    private readonly double[,] _data;
    public int Rows { get; }
    public int Cols { get; }

    public Matrix(int rows, int cols)
    {
        Rows = rows; Cols = cols;
        _data = new double[rows, cols];
    }

    // Indexer: allows matrix[row, col] syntax
    public double this[int row, int col]
    {
        get => _data[row, col];
        set => _data[row, col] = value;
    }
}

var m = new Matrix(3, 3);
m[0, 0] = 1.0;
m[1, 1] = 2.0;
m[2, 2] = 3.0;
Console.WriteLine(m[1, 1]);   // 2`,
    explanation:
      "An indexer is a special property named 'this' that lets your class use bracket notation for element access — it can accept any number of parameters of any type, not just integers.",
  },
  {
    id: "cs-property-expression",
    language: "csharp",
    title: "Expression-bodied property => expr",
    tag: "classes",
    code: `class Circle
{
    public double Radius { get; set; }

    // Expression-bodied read-only property (get only, no setter)
    public double Diameter    => Radius * 2;
    public double Area        => Math.PI * Radius * Radius;
    public double Circumference => 2 * Math.PI * Radius;

    // Expression-bodied with getter and setter
    private double _radiusInCm;
    public double RadiusInCm
    {
        get => _radiusInCm;
        set => _radiusInCm = value > 0 ? value : throw new ArgumentException();
    }

    public override string ToString() =>
        \`Circle(r=\${Radius:F2}, area=\${Area:F2})\`;
}

var c = new Circle { Radius = 5 };
Console.WriteLine(c.Area);          // 78.5398...
Console.WriteLine(c);               // Circle(r=5.00, area=78.54)`,
    explanation:
      "Expression-bodied properties use => to define a single-expression getter without the get { return ...; } boilerplate — they also work for methods, constructors, finalizers, and operators.",
  },
  {
    id: "cs-auto-property",
    language: "csharp",
    title: "Auto-property with `init` accessor (C# 9)",
    tag: "classes",
    code: `class Person
{
    // init: settable only during object construction/initializer
    public string Name { get; init; } = "";
    public int    Age  { get; init; }

    // Regular auto-property: mutable
    public string? Email { get; set; }
}

var p = new Person { Name = "Alice", Age = 30 };
// p.Name = "Bob";  // compile error — init-only after construction

p.Email = "alice@example.com";  // OK — set accessor allows mutation
Console.WriteLine(p.Name);      // Alice
Console.WriteLine(p.Email);     // alice@example.com

// init works in constructors and with-expressions (records)
record Product(string Sku, decimal Price);
var item  = new Product("ABC-1", 9.99m);
var item2 = item with { Price = 14.99m };
Console.WriteLine(item2.Price);  // 14.99`,
    explanation:
      "The 'init' accessor makes a property settable during construction or in an object initializer but read-only afterward — giving you the ergonomics of mutable initialisation with the safety of immutability after construction.",
  },
  {
    id: "cs-backing-field",
    language: "csharp",
    title: "Backing field for a computed property",
    tag: "classes",
    code: `class Temperature
{
    // Backing field — private, stores the data
    private double _celsius;

    // Property validates on set and computes on get
    public double Celsius
    {
        get => _celsius;
        set
        {
            if (value < -273.15)
                throw new ArgumentOutOfRangeException(nameof(value),
                    "Temperature cannot be below absolute zero");
            _celsius = value;
        }
    }

    // Derived property — no backing field needed
    public double Fahrenheit => _celsius * 9 / 5 + 32;
    public double Kelvin     => _celsius + 273.15;
}

var t = new Temperature { Celsius = 100 };
Console.WriteLine(t.Fahrenheit);  // 212
Console.WriteLine(t.Kelvin);      // 373.15`,
    explanation:
      "A backing field stores the actual data while the property provides a controlled interface for getting and setting it — validation, lazy initialisation, and derived values all belong in the property, not in the field.",
  },
  {
    id: "cs-interface-default-impl",
    language: "csharp",
    title: "Default interface implementation (C# 8)",
    tag: "classes",
    code: `interface ILogger
{
    void Log(string msg);

    // Default implementation — classes don't need to provide this
    void LogInfo(string msg)  => Log(\`[INFO]  \${msg}\`);
    void LogError(string msg) => Log(\`[ERROR] \${msg}\`);
}

class ConsoleLogger : ILogger
{
    // Only required to implement Log; gets LogInfo/LogError for free
    public void Log(string msg) => Console.WriteLine(msg);
}

ILogger logger = new ConsoleLogger();
logger.Log("raw message");          // raw message
logger.LogInfo("server started");   // [INFO]  server started
logger.LogError("disk full");       // [ERROR] disk full

// Note: access default implementations through the interface reference, not class reference
// ((ConsoleLogger)logger).LogInfo(...)  would fail if not overridden`,
    explanation:
      "Default interface implementations (C# 8) let you add new methods to an interface without breaking existing implementors — accessed only through an interface reference, they act as an opt-in mixin.",
  },
  {
    id: "cs-generic-constraint",
    language: "csharp",
    title: "Generic type constraints: where T : class, IDisposable, new()",
    tag: "classes",
    code: `// Constrain T to: reference type, implement IDisposable, have parameterless ctor
T CreateAndUse<T>() where T : class, IDisposable, new()
{
    T instance = new T();   // new() constraint enables this
    // instance.Dispose() available via IDisposable constraint
    return instance;
}

// Struct constraint
T Clamp<T>(T value, T min, T max) where T : struct, IComparable<T>
    => value.CompareTo(min) < 0 ? min
     : value.CompareTo(max) > 0 ? max
     : value;

Console.WriteLine(Clamp(15, 0, 10));     // 10
Console.WriteLine(Clamp(5,  0, 10));     // 5
Console.WriteLine(Clamp(-3, 0, 10));     // 0

// Multiple constraints: separate with comma; multiple type params use separate where
T Max<T>(T a, T b) where T : IComparable<T>
    => a.CompareTo(b) >= 0 ? a : b;`,
    explanation:
      "Generic constraints restrict the types that can substitute for T — they unlock capabilities (new(), interface methods) and provide compile-time safety that unconstrained generics can't offer.",
  },
  {
    id: "cs-generic-covariance",
    language: "csharp",
    title: "IEnumerable<out T> covariance: IEnumerable<Dog> as IEnumerable<Animal>",
    tag: "classes",
    code: `class Animal { public string Name { get; init; } = ""; }
class Dog : Animal { public void Bark() => Console.WriteLine("Woof"); }

// IEnumerable<T> is covariant (out T) — can assign derived to base
IEnumerable<Dog> dogs = new[] { new Dog { Name = "Rex" }, new Dog { Name = "Buddy" } };
IEnumerable<Animal> animals = dogs;   // OK — covariance allows this

foreach (Animal a in animals)
    Console.WriteLine(a.Name);   // Rex  Buddy

// List<T> is NOT covariant — this won't compile:
// List<Animal> animalList = new List<Dog>();  // compile error

// Covariance works only for interfaces/delegates, not concrete types
// 'out T' means T appears only in output positions (return/read)`,
    explanation:
      "Covariance (out T) allows assigning IEnumerable<Dog> to IEnumerable<Animal> because T is only produced (read), never consumed — List<T> can't be covariant because you could write an Animal into it, breaking type safety.",
  },
  {
    id: "cs-generic-contravariance",
    language: "csharp",
    title: "IComparer<in T> contravariance: IComparer<Animal> as IComparer<Dog>",
    tag: "classes",
    code: `class Animal { public string Name { get; init; } = ""; }
class Dog : Animal { }

// IComparer<T> is contravariant (in T) — can assign base to derived
IComparer<Animal> animalComparer = Comparer<Animal>.Create(
    (a, b) => string.Compare(a.Name, b.Name, StringComparison.Ordinal));

// Works as IComparer<Dog> because Dog IS-A Animal
IComparer<Dog> dogComparer = animalComparer;   // OK — contravariance

var dogs = new[] { new Dog { Name = "Rex" }, new Dog { Name = "Ace" } };
Array.Sort(dogs, dogComparer);
foreach (var d in dogs) Console.WriteLine(d.Name);   // Ace  Rex

// 'in T' means T appears only in input positions (parameters/write)`,
    explanation:
      "Contravariance (in T) allows assigning IComparer<Animal> to IComparer<Dog> because the comparer only consumes T — anything that works for an Animal also works for a Dog, so the substitution is safe.",
  },
  {
    id: "cs-iterator-yield",
    language: "csharp",
    title: "Iterator method with yield return and yield break",
    tag: "classes",
    code: `// Iterator method: returns IEnumerable<T>, uses yield
IEnumerable<int> Fibonacci()
{
    int a = 0, b = 1;
    while (true)
    {
        yield return a;     // suspends here, resumes on next MoveNext()
        (a, b) = (b, a + b);
    }
}

// Take the first 8 Fibonacci numbers
foreach (int n in Fibonacci().Take(8))
    Console.Write(n + " ");   // 0 1 1 2 3 5 8 13
Console.WriteLine();

// yield break exits the iterator early
IEnumerable<int> Until(IEnumerable<int> source, int limit)
{
    foreach (int n in source)
    {
        if (n > limit) yield break;
        yield return n;
    }
}

Console.WriteLine(string.Join(", ", Until(Fibonacci(), 10)));
// 0, 1, 1, 2, 3, 5, 8`,
    explanation:
      "An iterator method uses yield return to produce values one at a time and yield break to stop — the compiler transforms it into a state machine that implements IEnumerator<T>, making lazy sequence generation straightforward.",
  },
];
