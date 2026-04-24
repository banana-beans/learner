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

export const csharpTier2Cards: ReviewCard[] = [
  // ── csharp:t2:classes-objects ─────────────────────────────────
  makeCard({
    id: "card:csharp:t2:classes-objects:1",
    nodeId: "csharp:t2:classes-objects",
    branchId: "csharp",
    type: "concept",
    front: "What are the four main access modifiers in C# and what does each allow?",
    back: "public — accessible from anywhere. private — only within the same class. protected — within the class and its subclasses. internal — within the same assembly (project). Default for class members is private; default for top-level types is internal.",
  }),
  makeCard({
    id: "card:csharp:t2:classes-objects:2",
    nodeId: "csharp:t2:classes-objects",
    branchId: "csharp",
    type: "concept",
    front: "What is the difference between a field and a property in C#?",
    back: "A field is a raw variable: 'private int _age;'. A property uses get/set accessors to control access: 'public int Age { get; set; }'. Properties can validate data, be read-only, trigger events, etc. Auto-properties generate a hidden backing field automatically.",
  }),
  makeCard({
    id: "card:csharp:t2:classes-objects:3",
    nodeId: "csharp:t2:classes-objects",
    branchId: "csharp",
    type: "code_output",
    front: "What does this code print?",
    code: 'var a = new List<int> { 1, 2, 3 };\nvar b = a;\nb.Add(4);\nConsole.WriteLine(a.Count);',
    expectedOutput: "4",
    back: "Lists are reference types. 'b = a' copies the reference, not the data. Both variables point to the same list, so Add(4) through b also affects a. a.Count is 4.",
  }),

  // ── csharp:t2:inheritance ────────────────────────────────────
  makeCard({
    id: "card:csharp:t2:inheritance:1",
    nodeId: "csharp:t2:inheritance",
    branchId: "csharp",
    type: "concept",
    front: "Explain the virtual/override pattern in C#.",
    back: "Mark a base class method 'virtual' to allow overriding. In the derived class, use 'override' to provide a new implementation. Call 'base.Method()' from the override to invoke the parent's version. Without 'virtual', derived classes cannot override (only hide with 'new', which is different).",
  }),
  makeCard({
    id: "card:csharp:t2:inheritance:2",
    nodeId: "csharp:t2:inheritance",
    branchId: "csharp",
    type: "concept",
    front: "What is the difference between abstract and virtual methods?",
    back: "Abstract methods have no body and MUST be overridden — the containing class must be abstract and cannot be instantiated. Virtual methods have a default body and MAY be overridden. Abstract defines a contract; virtual provides a default with opt-in override.",
  }),
  makeCard({
    id: "card:csharp:t2:inheritance:3",
    nodeId: "csharp:t2:inheritance",
    branchId: "csharp",
    type: "explain",
    front: "Explain polymorphism with a concrete example.",
    back: "Polymorphism means treating different types through a common interface. Example: Animal[] animals = { new Dog(), new Cat() }; Calling animal.Speak() on each invokes Dog.Speak() → 'Woof' or Cat.Speak() → 'Meow'. The correct override is selected at runtime based on the actual type, not the declared type.",
  }),

  // ── csharp:t2:interfaces ────────────────────────────────────
  makeCard({
    id: "card:csharp:t2:interfaces:1",
    nodeId: "csharp:t2:interfaces",
    branchId: "csharp",
    type: "concept",
    front: "How do interfaces differ from abstract classes in C#?",
    back: "Interfaces define a contract with no state (pre-C# 8). A class can implement multiple interfaces but inherit only one class. Abstract classes can have fields, constructors, and both abstract and concrete methods. Use interfaces for 'can-do' relationships (IDisposable) and abstract classes for 'is-a' relationships with shared state.",
  }),
  makeCard({
    id: "card:csharp:t2:interfaces:2",
    nodeId: "csharp:t2:interfaces",
    branchId: "csharp",
    type: "concept",
    front: "What is IDisposable and the 'using' statement?",
    back: "IDisposable is an interface with a Dispose() method for cleaning up unmanaged resources (files, connections, streams). The 'using' statement ensures Dispose() is called when the scope ends, even if an exception occurs. It's C#'s equivalent of Python's 'with' statement. Syntax: using var file = new StreamReader(path);",
  }),
  makeCard({
    id: "card:csharp:t2:interfaces:3",
    nodeId: "csharp:t2:interfaces",
    branchId: "csharp",
    type: "concept",
    front: "What does 'programming to an interface' mean?",
    back: "It means declaring variables and parameters as interface types instead of concrete classes. Example: IList<int> instead of List<int>. This decouples code from specific implementations, making it easier to swap, test, and extend. Methods that accept IEnumerable<T> work with arrays, lists, hashsets, and any collection.",
  }),

  // ── csharp:t2:generics ──────────────────────────────────────
  makeCard({
    id: "card:csharp:t2:generics:1",
    nodeId: "csharp:t2:generics",
    branchId: "csharp",
    type: "concept",
    front: "What are generics and why use them instead of 'object'?",
    back: "Generics let you write type-safe reusable code parameterized by type: List<T>, Dictionary<TKey, TValue>. Using 'object' loses type safety (requires casting), causes boxing for value types (performance hit), and errors only surface at runtime. Generics catch type errors at compile time and avoid boxing.",
  }),
  makeCard({
    id: "card:csharp:t2:generics:2",
    nodeId: "csharp:t2:generics",
    branchId: "csharp",
    type: "concept",
    front: "Name four common generic constraints and what each enforces.",
    back: "where T : class — T must be a reference type. where T : struct — T must be a value type. where T : new() — T must have a parameterless constructor. where T : IComparable<T> — T must implement the specified interface. Constraints can be combined: where T : class, IComparable<T>, new().",
  }),
  makeCard({
    id: "card:csharp:t2:generics:3",
    nodeId: "csharp:t2:generics",
    branchId: "csharp",
    type: "code_output",
    front: "What does this code print?",
    code: 'var dict = new Dictionary<string, int>\n{\n    ["a"] = 1,\n    ["b"] = 2,\n};\ndict["a"] = 10;\nConsole.WriteLine(dict["a"]);\nConsole.WriteLine(dict.Count);',
    expectedOutput: "10\n2",
    back: "The indexer dict[\"a\"] = 10 overwrites the existing value (1 → 10). Count remains 2 because no new key was added. Dictionary<TKey, TValue> is a generic collection with O(1) lookup.",
  }),

  // ── csharp:t2:exceptions ────────────────────────────────────
  makeCard({
    id: "card:csharp:t2:exceptions:1",
    nodeId: "csharp:t2:exceptions",
    branchId: "csharp",
    type: "concept",
    front: "Why should you use 'throw;' instead of 'throw ex;' when rethrowing?",
    back: "'throw;' preserves the original stack trace, showing where the exception actually originated. 'throw ex;' resets the stack trace to the current catch block, hiding the true source. Always use 'throw;' for rethrowing to preserve debugging information.",
  }),
  makeCard({
    id: "card:csharp:t2:exceptions:2",
    nodeId: "csharp:t2:exceptions",
    branchId: "csharp",
    type: "concept",
    front: "What are exception filters (when clause) and why use them?",
    back: "Exception filters add a condition to catch blocks: catch (HttpRequestException ex) when (ex.StatusCode == 404). The exception is only caught if the condition is true. Without filters, you'd need to catch, check, and rethrow — losing the stack trace. Filters don't unwind the stack, so they're more debuggable.",
  }),
  makeCard({
    id: "card:csharp:t2:exceptions:3",
    nodeId: "csharp:t2:exceptions",
    branchId: "csharp",
    type: "bug_spot",
    front: "Find the bug in this code.",
    code: 'try\n{\n    int.Parse("abc");\n}\ncatch (Exception)\n{\n    // silently ignore\n}',
    back: "Empty catch blocks silently swallow exceptions, hiding bugs. At minimum, log the error or rethrow. Catching the broad Exception type also masks unexpected errors. Prefer catching specific exceptions like FormatException.",
  }),
];
