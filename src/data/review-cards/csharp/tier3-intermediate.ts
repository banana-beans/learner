import type { ReviewCard } from "@/lib/types";

function makeCard(
  partial: Omit<ReviewCard, "fsrs" | "state" | "dueDate" | "createdAt">
): ReviewCard {
  return {
    ...partial,
    fsrs: {
      stability: 1.0,
      difficulty: 5.0,
      elapsedDays: 0,
      scheduledDays: 0,
      reps: 0,
      lapses: 0,
      state: "new",
    },
    state: "new",
    dueDate: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
}

export const csharpTier3Cards: ReviewCard[] = [
  // ── csharp:t3:collections ────────────────────────────────────
  makeCard({
    id: "card:csharp:t3:collections:1",
    nodeId: "csharp:t3:collections",
    branchId: "csharp",
    type: "concept",
    front: "When should you use Dictionary vs HashSet vs List in C#?",
    back: "List<T> — ordered collection with index access, allows duplicates. Dictionary<TKey, TValue> — key-value lookup with O(1) access by key. HashSet<T> — unique elements with O(1) Contains/Add. Use List for ordered data, Dictionary for mapping, HashSet for membership testing.",
  }),
  makeCard({
    id: "card:csharp:t3:collections:2",
    nodeId: "csharp:t3:collections",
    branchId: "csharp",
    type: "concept",
    front: "What is the difference between TryGetValue and the indexer [] on Dictionary?",
    back: "dict[key] throws KeyNotFoundException if the key doesn't exist. TryGetValue(key, out value) returns false if missing, avoiding exceptions. TryGetValue is also more efficient than checking ContainsKey then using the indexer (one lookup vs two).",
  }),
  makeCard({
    id: "card:csharp:t3:collections:3",
    nodeId: "csharp:t3:collections",
    branchId: "csharp",
    type: "concept",
    front: "Explain Queue (FIFO) vs Stack (LIFO) with an example.",
    back: "Queue: first in, first out. Like a line at a store — Enqueue adds to back, Dequeue removes from front. Stack: last in, first out. Like a stack of plates — Push adds to top, Pop removes from top. Use Queue for task scheduling; Stack for undo functionality or parsing.",
  }),

  // ── csharp:t3:linq ──────────────────────────────────────────
  makeCard({
    id: "card:csharp:t3:linq:1",
    nodeId: "csharp:t3:linq",
    branchId: "csharp",
    type: "concept",
    front: "What is LINQ and why is it powerful?",
    back: "LINQ (Language Integrated Query) lets you query any IEnumerable<T> with chainable methods: Where (filter), Select (transform), OrderBy (sort), GroupBy (group), etc. It replaces manual loops with declarative expressions. LINQ works on arrays, lists, dictionaries, XML, and even database queries (via EF Core).",
  }),
  makeCard({
    id: "card:csharp:t3:linq:2",
    nodeId: "csharp:t3:linq",
    branchId: "csharp",
    type: "code_output",
    front: "What does this code print?",
    code: 'int[] nums = { 1, 2, 3, 4, 5 };\nvar result = nums.Where(n => n > 2).Select(n => n * 10);\nConsole.WriteLine(string.Join(", ", result));',
    expectedOutput: "30, 40, 50",
    back: "Where filters to {3, 4, 5}. Select transforms each to {30, 40, 50}. string.Join combines them with commas. LINQ is deferred — it executes when iterated by Join.",
  }),
  makeCard({
    id: "card:csharp:t3:linq:3",
    nodeId: "csharp:t3:linq",
    branchId: "csharp",
    type: "concept",
    front: "What is deferred execution in LINQ and why does it matter?",
    back: "LINQ queries don't execute when defined — they execute when iterated (foreach, ToList, Count, etc.). This means if the source data changes between definition and execution, you get updated results. To capture a snapshot, materialize with .ToList() or .ToArray() immediately.",
  }),

  // ── csharp:t3:delegates-events ──────────────────────────────
  makeCard({
    id: "card:csharp:t3:delegates-events:1",
    nodeId: "csharp:t3:delegates-events",
    branchId: "csharp",
    type: "concept",
    front: "Explain Action<T>, Func<T, TResult>, and Predicate<T>.",
    back: "Action<T> — delegate for void methods. Action<string> takes a string, returns nothing. Func<T, TResult> — delegate with return value. Func<int, bool> takes int, returns bool. Predicate<T> — shorthand for Func<T, bool>. These are the built-in delegates — you rarely need custom delegate types.",
  }),
  makeCard({
    id: "card:csharp:t3:delegates-events:2",
    nodeId: "csharp:t3:delegates-events",
    branchId: "csharp",
    type: "concept",
    front: "What is a lambda expression and what is the syntax?",
    back: "A lambda is an anonymous function: (parameters) => expression. Examples: x => x * 2 (single param, no parens needed). (a, b) => a + b (two params). (x) => { var y = x * 2; return y; } (multi-statement body needs braces and return). Lambdas are the primary way to pass inline logic to LINQ, events, and delegate parameters.",
  }),
  makeCard({
    id: "card:csharp:t3:delegates-events:3",
    nodeId: "csharp:t3:delegates-events",
    branchId: "csharp",
    type: "concept",
    front: "How do events work in C# and what is the publisher-subscriber pattern?",
    back: "A publisher declares an event: 'public event EventHandler<T>? MyEvent;'. Subscribers attach handlers with +=: 'obj.MyEvent += handler;'. The publisher raises the event: 'MyEvent?.Invoke(this, args);'. Events are a restricted form of delegates — external code can only subscribe (+= ) or unsubscribe (-=), not invoke or clear.",
  }),

  // ── csharp:t3:extension-methods ─────────────────────────────
  makeCard({
    id: "card:csharp:t3:extension-methods:1",
    nodeId: "csharp:t3:extension-methods",
    branchId: "csharp",
    type: "concept",
    front: "How do you create an extension method in C#?",
    back: "Define a static method in a static class with 'this' before the first parameter: public static bool IsEven(this int n) => n % 2 == 0; Now call it like an instance method: 42.IsEven(). All LINQ methods (Where, Select, etc.) are extension methods on IEnumerable<T>.",
  }),
  makeCard({
    id: "card:csharp:t3:extension-methods:2",
    nodeId: "csharp:t3:extension-methods",
    branchId: "csharp",
    type: "concept",
    front: "What are records in C# and how do they differ from classes?",
    back: "Records (C# 9+) are reference types designed for immutable data. They provide: value equality (two records with same data are ==), auto-generated ToString, 'with' expressions for creating modified copies, and deconstruction. Classes use reference equality by default. Use records for DTOs, value objects, and immutable data.",
  }),
  makeCard({
    id: "card:csharp:t3:extension-methods:3",
    nodeId: "csharp:t3:extension-methods",
    branchId: "csharp",
    type: "code_output",
    front: "What does this code print?",
    code: 'record Person(string Name, int Age);\n\nvar p1 = new Person("Alice", 30);\nvar p2 = p1 with { Age = 31 };\nConsole.WriteLine(p1);\nConsole.WriteLine(p2);\nConsole.WriteLine(p1 == p2);',
    expectedOutput: "Person { Name = Alice, Age = 30 }\nPerson { Name = Alice, Age = 31 }\nFalse",
    back: "'with' creates a modified copy — p1 is unchanged. Records auto-generate a nice ToString. Value equality compares all properties: different Age makes them not equal.",
  }),
];
