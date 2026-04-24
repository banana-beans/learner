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

export const csharpTier1Cards: ReviewCard[] = [
  // ── csharp:t1:hello-world ─────────────────────────────────────
  makeCard({
    id: "card:csharp:t1:hello-world:1",
    nodeId: "csharp:t1:hello-world",
    branchId: "csharp",
    type: "concept",
    front: "What is the difference between Console.Write() and Console.WriteLine()?",
    back: "Console.WriteLine() prints text followed by a newline character. Console.Write() prints text without a trailing newline, so subsequent output appears on the same line.",
  }),
  makeCard({
    id: "card:csharp:t1:hello-world:2",
    nodeId: "csharp:t1:hello-world",
    branchId: "csharp",
    type: "code_output",
    front: "What does this code print?",
    code: 'Console.Write("Hello, ");\nConsole.WriteLine("World!");\nConsole.WriteLine("Done.");',
    expectedOutput: "Hello, World!\nDone.",
    back: "Write prints without a newline, so 'World!' appears on the same line. WriteLine adds a newline, so 'Done.' starts on a new line.",
  }),
  makeCard({
    id: "card:csharp:t1:hello-world:3",
    nodeId: "csharp:t1:hello-world",
    branchId: "csharp",
    type: "concept",
    front: "What are top-level statements in C# 9+ and why are they useful?",
    back: "Top-level statements let you write executable code directly in Program.cs without a class or Main method. The compiler generates the boilerplate behind the scenes. They reduce ceremony for simple programs and scripts.",
  }),

  // ── csharp:t1:variables-types ────────────────────────────────
  makeCard({
    id: "card:csharp:t1:variables-types:1",
    nodeId: "csharp:t1:variables-types",
    branchId: "csharp",
    type: "concept",
    front: "How does C# differ from Python in terms of typing?",
    back: "C# is statically and strongly typed — every variable has a fixed type declared at compile time. Python is dynamically typed — types are determined at runtime and variables can be reassigned to different types. C# catches type errors at compile time; Python catches them at runtime.",
  }),
  makeCard({
    id: "card:csharp:t1:variables-types:2",
    nodeId: "csharp:t1:variables-types",
    branchId: "csharp",
    type: "code_output",
    front: "What does this code print?",
    code: 'var x = 42;\nConsole.WriteLine(x.GetType().Name);',
    expectedOutput: "Int32",
    back: "'var' infers the type from the value. 42 is an integer literal, so the type is System.Int32 (aka int). GetType().Name returns the runtime type name.",
  }),
  makeCard({
    id: "card:csharp:t1:variables-types:3",
    nodeId: "csharp:t1:variables-types",
    branchId: "csharp",
    type: "concept",
    front: "What suffix do you need for float and decimal literals in C#?",
    back: "float literals need an 'f' suffix: 3.14f. decimal literals need an 'm' suffix: 19.99m. Without a suffix, a number with a decimal point defaults to double. long uses 'L': 9000000000L.",
  }),

  // ── csharp:t1:operators-expressions ──────────────────────────
  makeCard({
    id: "card:csharp:t1:operators-expressions:1",
    nodeId: "csharp:t1:operators-expressions",
    branchId: "csharp",
    type: "code_output",
    front: "What does this code print?",
    code: "Console.WriteLine(7 / 2);\nConsole.WriteLine(7.0 / 2);",
    expectedOutput: "3\n3.5",
    back: "Integer division truncates in C#: 7 / 2 = 3. When at least one operand is a double, you get floating-point division: 7.0 / 2 = 3.5.",
  }),
  makeCard({
    id: "card:csharp:t1:operators-expressions:2",
    nodeId: "csharp:t1:operators-expressions",
    branchId: "csharp",
    type: "concept",
    front: "How do logical operators differ between C# and Python?",
    back: "C# uses symbols: && (and), || (or), ! (not). Python uses words: and, or, not. Both short-circuit: && stops at first false, || stops at first true. C# does NOT support chained comparisons like Python's 1 < x < 10.",
  }),
  makeCard({
    id: "card:csharp:t1:operators-expressions:3",
    nodeId: "csharp:t1:operators-expressions",
    branchId: "csharp",
    type: "concept",
    front: "What is the ternary operator in C# and how does it compare to Python?",
    back: "C#: condition ? trueValue : falseValue. Python: trueValue if condition else falseValue. Example: string label = age >= 18 ? \"adult\" : \"minor\"; Both are conditional expressions, but the syntax order differs.",
  }),

  // ── csharp:t1:control-flow ───────────────────────────────────
  makeCard({
    id: "card:csharp:t1:control-flow:1",
    nodeId: "csharp:t1:control-flow",
    branchId: "csharp",
    type: "concept",
    front: "How does C# define code blocks vs Python?",
    back: "C# uses curly braces {} to define blocks. Python uses indentation. In C#, parentheses around conditions are required: if (x > 5) { }. Python uses elif; C# uses 'else if' (two words).",
  }),
  makeCard({
    id: "card:csharp:t1:control-flow:2",
    nodeId: "csharp:t1:control-flow",
    branchId: "csharp",
    type: "code_output",
    front: "What does this code print?",
    code: 'int x = 3;\nstring result = x switch\n{\n    1 => "one",\n    2 => "two",\n    3 => "three",\n    _ => "other",\n};\nConsole.WriteLine(result);',
    expectedOutput: "three",
    back: "Switch expressions (C# 8+) pattern-match a value against cases. The _ is the discard pattern (default). x is 3, which matches the third arm, returning \"three\".",
  }),
  makeCard({
    id: "card:csharp:t1:control-flow:3",
    nodeId: "csharp:t1:control-flow",
    branchId: "csharp",
    type: "concept",
    front: "Name the four loop types in C# and when to use each.",
    back: "for (init; condition; step) — counter-based iteration. foreach (var item in collection) — iterating collections. while (condition) — check before each iteration. do { } while (condition) — check after each iteration (guarantees at least one run).",
  }),

  // ── csharp:t1:strings-io ────────────────────────────────────
  makeCard({
    id: "card:csharp:t1:strings-io:1",
    nodeId: "csharp:t1:strings-io",
    branchId: "csharp",
    type: "concept",
    front: "How does string interpolation work in C#?",
    back: "Prefix a string with $: $\"Hello, {name}!\". Expressions inside {} are evaluated and converted to strings. You can include format specifiers: $\"{price:C}\" for currency, $\"{pi:F2}\" for 2 decimal places. This is C#'s equivalent of Python f-strings.",
  }),
  makeCard({
    id: "card:csharp:t1:strings-io:2",
    nodeId: "csharp:t1:strings-io",
    branchId: "csharp",
    type: "concept",
    front: "What is the difference between int.Parse() and int.TryParse()?",
    back: "int.Parse(\"42\") converts a string to int but throws FormatException if the string is invalid. int.TryParse(\"42\", out int value) returns true/false and sets the out variable on success. TryParse is safer for user input.",
  }),
  makeCard({
    id: "card:csharp:t1:strings-io:3",
    nodeId: "csharp:t1:strings-io",
    branchId: "csharp",
    type: "code_output",
    front: "What does this code print?",
    code: 'string s = "Hello, World!";\nConsole.WriteLine(s.Length);\nConsole.WriteLine(s.ToUpper());\nConsole.WriteLine(s.Substring(7, 5));',
    expectedOutput: "13\nHELLO, WORLD!\nWorld",
    back: "Length is a property (13 characters). ToUpper converts to uppercase. Substring(7, 5) starts at index 7 and takes 5 characters: 'World'.",
  }),
];
