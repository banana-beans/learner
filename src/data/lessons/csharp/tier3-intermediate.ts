import type { LessonContent } from "../python-basics";

export const csharpTier3Lessons: Record<string, LessonContent> = {
  "csharp:t3:collections": {
    nodeId: "csharp:t3:collections",
    title: "Collections",
    sections: [
      {
        heading: "List<T> — The Workhorse Collection",
        body: "List<T> is a resizable array and the most commonly used collection in C#. Create one with 'var names = new List<string>();' or 'List<int> nums = [1, 2, 3];' (C# 12 collection expressions). Key methods: Add(), Remove(), Contains(), Count (property), IndexOf(), Sort(), and ForEach(). Lists provide O(1) index access and O(1) amortized Add, but O(n) insertion and removal at arbitrary positions.",
      },
      {
        heading: "Dictionary<TKey, TValue>",
        body: "Dictionary<TKey, TValue> maps keys to values with O(1) average lookup. Create with 'var scores = new Dictionary<string, int>();'. Add entries with indexer syntax: 'scores[\"Alice\"] = 95;'. Use ContainsKey() to check existence, or TryGetValue() which is more efficient as it avoids a double lookup. Keys must be unique; adding a duplicate key with Add() throws, but the indexer overwrites silently.",
      },
      {
        heading: "HashSet<T>, Queue<T>, and Stack<T>",
        body: "HashSet<T> stores unique elements with O(1) Contains/Add/Remove — perfect for membership testing. It supports set operations: UnionWith, IntersectWith, ExceptWith. Queue<T> is FIFO (First-In-First-Out): Enqueue to add, Dequeue to remove. Stack<T> is LIFO (Last-In-First-Out): Push to add, Pop to remove. Choose the right collection for the access pattern you need.",
      },
    ],
    codeExamples: [
      {
        title: "List<T> operations",
        code: `var fruits = new List<string> { "apple", "banana", "cherry" };

fruits.Add("date");
fruits.Remove("banana");
fruits.Insert(1, "blueberry");

Console.WriteLine(fruits.Count);        // 3
Console.WriteLine(fruits[0]);           // apple
Console.WriteLine(fruits.Contains("cherry")); // True

foreach (var fruit in fruits)
    Console.Write($"{fruit} ");
// apple blueberry cherry date`,
        explanation:
          "List<T> supports index access, adding, removing, inserting, and iteration. Count is a property, not a method.",
      },
      {
        title: "Dictionary<TKey, TValue>",
        code: `var inventory = new Dictionary<string, int>
{
    ["sword"] = 1,
    ["potion"] = 5,
    ["arrow"] = 20,
};

// Safe lookup with TryGetValue
if (inventory.TryGetValue("potion", out int count))
    Console.WriteLine($"Potions: {count}");  // Potions: 5

// Iterate key-value pairs
foreach (var (item, qty) in inventory)
    Console.WriteLine($"{item}: {qty}");`,
        explanation:
          "TryGetValue is the idiomatic way to look up values — it returns false instead of throwing if the key doesn't exist. Deconstruction (var (item, qty)) works in foreach.",
      },
      {
        title: "HashSet, Queue, Stack",
        code: `// HashSet — unique elements
var seen = new HashSet<int> { 1, 2, 3 };
seen.Add(2);  // ignored — already present
Console.WriteLine(seen.Count);  // 3

// Queue — FIFO
var queue = new Queue<string>();
queue.Enqueue("first");
queue.Enqueue("second");
Console.WriteLine(queue.Dequeue()); // first

// Stack — LIFO
var stack = new Stack<string>();
stack.Push("bottom");
stack.Push("top");
Console.WriteLine(stack.Pop());  // top`,
        explanation:
          "Each collection has its own API: HashSet uses Add, Queue uses Enqueue/Dequeue, Stack uses Push/Pop. Choose based on your access pattern.",
      },
    ],
    keyTakeaways: [
      "List<T>: resizable array with O(1) indexing and Add",
      "Dictionary<TKey, TValue>: O(1) key-value lookup; use TryGetValue for safe access",
      "HashSet<T>: unique elements with O(1) membership testing",
      "Queue<T>: FIFO — Enqueue/Dequeue; Stack<T>: LIFO — Push/Pop",
      "All generic collections are in the System.Collections.Generic namespace",
    ],
  },

  "csharp:t3:linq": {
    nodeId: "csharp:t3:linq",
    title: "LINQ",
    sections: [
      {
        heading: "What Is LINQ?",
        body: "LINQ (Language Integrated Query) lets you query collections using SQL-like syntax built into C#. Instead of writing loops to filter, sort, and transform data, you chain method calls: list.Where(x => x > 5).OrderBy(x => x).Select(x => x * 2). LINQ works with any IEnumerable<T> — arrays, lists, dictionaries, and even database queries. It's one of C#'s most powerful features.",
      },
      {
        heading: "Core LINQ Methods",
        body: "The essential methods: Where() filters elements (like Python's filter), Select() transforms each element (like Python's map), OrderBy()/OrderByDescending() sorts, GroupBy() groups elements, First()/FirstOrDefault() gets the first match, Any()/All() checks conditions, Count() counts, Sum()/Average()/Min()/Max() aggregate. These take lambda expressions as predicates.",
      },
      {
        heading: "Deferred Execution",
        body: "LINQ queries are lazy by default — they don't execute until you iterate the result or call a terminal method like ToList(), ToArray(), Count(), or First(). This is called deferred execution. It means you can build up complex queries without any work happening until the results are actually needed. Be careful: if the source data changes between defining the query and executing it, you'll get the updated data.",
      },
    ],
    codeExamples: [
      {
        title: "Filtering and transforming with LINQ",
        code: `int[] numbers = { 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 };

var evenDoubled = numbers
    .Where(n => n % 2 == 0)
    .Select(n => n * 2)
    .ToList();

Console.WriteLine(string.Join(", ", evenDoubled));
// 4, 8, 12, 16, 20

// Equivalent without LINQ:
// var result = new List<int>();
// foreach (var n in numbers)
//     if (n % 2 == 0)
//         result.Add(n * 2);`,
        explanation:
          "Where filters, Select transforms, ToList materializes the result. Each method returns a new IEnumerable — the original array is unchanged.",
      },
      {
        title: "Sorting, grouping, and aggregation",
        code: `var students = new[]
{
    new { Name = "Alice", Grade = 92 },
    new { Name = "Bob", Grade = 85 },
    new { Name = "Carol", Grade = 92 },
    new { Name = "Dave", Grade = 78 },
};

// Sort by grade descending, then by name
var ranked = students
    .OrderByDescending(s => s.Grade)
    .ThenBy(s => s.Name);

// Group by grade
var groups = students.GroupBy(s => s.Grade);
foreach (var g in groups)
    Console.WriteLine($"Grade {g.Key}: {g.Count()} students");

// Aggregation
Console.WriteLine($"Average: {students.Average(s => s.Grade):F1}");
Console.WriteLine($"Top: {students.Max(s => s.Grade)}");`,
        explanation:
          "OrderBy + ThenBy for multi-key sorting. GroupBy creates groups with a Key and the elements. Aggregate methods like Average and Max take a selector lambda.",
      },
      {
        title: "Deferred execution and materialization",
        code: `var numbers = new List<int> { 1, 2, 3 };

// Query defined — NOT executed yet
var query = numbers.Where(n => n > 1);

numbers.Add(4);  // modify source BEFORE execution

// Query executes NOW during iteration
Console.WriteLine(string.Join(", ", query));
// 2, 3, 4  — includes 4 because execution is deferred

// To capture a snapshot, materialize immediately:
var snapshot = numbers.Where(n => n > 1).ToList();
numbers.Add(5);
Console.WriteLine(string.Join(", ", snapshot));
// 2, 3, 4  — 5 is NOT included, snapshot was already materialized`,
        explanation:
          "The query is just a description until iterated. Adding 4 before iteration means it appears in results. ToList() forces immediate execution and captures a snapshot.",
      },
    ],
    keyTakeaways: [
      "LINQ chains methods: .Where().Select().OrderBy() on any IEnumerable<T>",
      "Where = filter, Select = map, OrderBy = sort, GroupBy = group",
      "Queries are deferred — they execute when iterated or materialized with ToList()/ToArray()",
      "FirstOrDefault() returns default(T) instead of throwing when no match is found",
      "LINQ replaces many manual loops with declarative, readable expressions",
    ],
  },

  "csharp:t3:delegates-events": {
    nodeId: "csharp:t3:delegates-events",
    title: "Delegates & Events",
    sections: [
      {
        heading: "Delegates: Type-Safe Function Pointers",
        body: "A delegate is a type that represents a method with a specific signature. Think of it as a variable that holds a reference to a function — similar to Python's first-class functions but with strict type checking. C# provides built-in delegate types: Action<T> for void methods, Func<T, TResult> for methods that return a value, and Predicate<T> for methods returning bool. You rarely need to define custom delegate types.",
      },
      {
        heading: "Lambda Expressions",
        body: "Lambdas are anonymous functions: '(x, y) => x + y'. The '=>' operator separates parameters from the body. If there's one parameter, parentheses are optional: 'x => x * 2'. For multi-line bodies, use curly braces: '(x) => { var result = x * 2; return result; }'. Lambdas are the primary way to pass inline logic to LINQ methods, event handlers, and any method accepting a delegate.",
      },
      {
        heading: "Events and the Publisher-Subscriber Pattern",
        body: "Events build on delegates to implement the observer pattern. A publisher class declares an event with 'event EventHandler<T> EventName'. Subscribers attach handlers with '+=' and detach with '-='. When the publisher raises the event, all subscribers are notified. Events are a controlled form of delegates — outside code can only subscribe/unsubscribe, not invoke the event directly or clear all subscribers.",
      },
    ],
    codeExamples: [
      {
        title: "Action, Func, and Predicate",
        code: `// Action — void, takes parameters
Action<string> greet = name => Console.WriteLine($"Hello, {name}!");
greet("Alice");  // Hello, Alice!

// Func — returns a value (last type parameter is return type)
Func<int, int, int> add = (a, b) => a + b;
Console.WriteLine(add(3, 4));  // 7

// Predicate — returns bool
Predicate<int> isEven = n => n % 2 == 0;
Console.WriteLine(isEven(4));  // True

// Pass to LINQ
int[] nums = { 1, 2, 3, 4, 5 };
var evens = Array.FindAll(nums, isEven);`,
        explanation:
          "Action<T> = void method, Func<T, TResult> = method with return value, Predicate<T> = method returning bool. All accept lambda expressions.",
      },
      {
        title: "Events in action",
        code: `public class Timer
{
    public event EventHandler<int>? Tick;

    public void Start(int seconds)
    {
        for (int i = seconds; i > 0; i--)
        {
            Tick?.Invoke(this, i);
            Thread.Sleep(1000);
        }
    }
}

// Subscribe to the event
var timer = new Timer();
timer.Tick += (sender, remaining) =>
    Console.WriteLine($"{remaining} seconds left");

timer.Start(3);
// 3 seconds left
// 2 seconds left
// 1 seconds left`,
        explanation:
          "'event' declares a publisher endpoint. '+=' subscribes a handler. '?.Invoke()' safely raises the event (null-check in case no subscribers). '-=' unsubscribes.",
      },
      {
        title: "Passing functions as arguments",
        code: `void ProcessList<T>(List<T> items, Action<T> action)
{
    foreach (var item in items)
        action(item);
}

var names = new List<string> { "alice", "bob", "carol" };

// Pass a lambda
ProcessList(names, name => Console.WriteLine(name.ToUpper()));

// Pass a method reference
ProcessList(names, Console.WriteLine);`,
        explanation:
          "Methods that accept delegates (like Action<T>) can receive lambdas or method group references. This is the foundation of higher-order programming in C#.",
      },
    ],
    keyTakeaways: [
      "Action<T> for void methods, Func<T,TResult> for returning methods, Predicate<T> for bool",
      "Lambdas: (params) => expression or (params) => { statements; }",
      "Events use 'event' keyword with '+=' to subscribe and '-=' to unsubscribe",
      "'?.Invoke()' safely raises events when there might be no subscribers",
      "Delegates enable higher-order programming — passing functions as data",
    ],
  },

  "csharp:t3:extension-methods": {
    nodeId: "csharp:t3:extension-methods",
    title: "Extension Methods & Records",
    sections: [
      {
        heading: "Extension Methods",
        body: "Extension methods let you add methods to existing types without modifying them. Define a static method in a static class, with the 'this' keyword before the first parameter: 'public static bool IsEven(this int n) => n % 2 == 0;'. Now you can call '42.IsEven()' as if int had that method. All LINQ methods are extension methods on IEnumerable<T>. This is how C# achieves open-ended extensibility.",
      },
      {
        heading: "Record Types",
        body: "Records (C# 9+) are reference types designed for immutable data. Declare with 'record Person(string Name, int Age);' — the compiler generates a constructor, properties, Equals/GetHashCode (value equality), ToString, and a Deconstruct method. Unlike classes, two records with the same data are considered equal. Use 'with' expressions to create modified copies: 'var older = person with { Age = 31 };'.",
      },
      {
        heading: "Record Structs",
        body: "Record structs (C# 10+) combine struct value semantics with record convenience. Declare with 'record struct Point(double X, double Y);'. They're allocated on the stack (no heap allocation), provide value equality, and support 'with' expressions. Use record structs for small, immutable data types like coordinates, colors, or money amounts.",
      },
    ],
    codeExamples: [
      {
        title: "Defining and using extension methods",
        code: `public static class StringExtensions
{
    public static string Truncate(this string text, int maxLength)
    {
        if (text.Length <= maxLength) return text;
        return text[..maxLength] + "...";
    }

    public static bool IsNullOrEmpty(this string? text)
        => string.IsNullOrEmpty(text);

    public static string Repeat(this string text, int count)
        => string.Concat(Enumerable.Repeat(text, count));
}

// Usage — looks like native string methods
Console.WriteLine("Hello, World!".Truncate(5));  // Hello...
Console.WriteLine("ha".Repeat(3));               // hahaha`,
        explanation:
          "The 'this' keyword before the first parameter makes it an extension method. Import the namespace containing the static class to use the extensions.",
      },
      {
        title: "Records with value equality and with-expressions",
        code: `record Person(string Name, int Age);

var alice = new Person("Alice", 30);
var clone = new Person("Alice", 30);

Console.WriteLine(alice == clone);    // True (value equality!)
Console.WriteLine(alice);            // Person { Name = Alice, Age = 30 }

// Create a modified copy
var olderAlice = alice with { Age = 31 };
Console.WriteLine(olderAlice);       // Person { Name = Alice, Age = 31 }

// Deconstruction
var (name, age) = alice;
Console.WriteLine($"{name} is {age}");`,
        explanation:
          "Records provide value equality (== compares data, not references), a nice ToString, 'with' for immutable updates, and deconstruction. Classes use reference equality by default.",
      },
      {
        title: "Record structs",
        code: `record struct Vector2(double X, double Y)
{
    public double Magnitude => Math.Sqrt(X * X + Y * Y);

    public static Vector2 operator +(Vector2 a, Vector2 b)
        => new(a.X + b.X, a.Y + b.Y);
}

var v1 = new Vector2(3, 4);
var v2 = new Vector2(1, 2);
var v3 = v1 + v2;

Console.WriteLine(v3);            // Vector2 { X = 4, Y = 6 }
Console.WriteLine(v1.Magnitude);  // 5`,
        explanation:
          "Record structs are value types (stack-allocated) with record features. Operator overloading lets you define +, -, *, etc. for custom types.",
      },
    ],
    keyTakeaways: [
      "Extension methods use 'this' on the first parameter of a static method in a static class",
      "All LINQ methods are extension methods on IEnumerable<T>",
      "Records provide value equality, 'with' expressions, and auto-generated ToString",
      "record struct combines struct value semantics with record convenience",
      "'with' creates a modified copy of a record, leaving the original unchanged",
    ],
  },
};
