import type { LessonContent } from "../python-basics";

export const csharpTier1Lessons: Record<string, LessonContent> = {
  "csharp:t1:hello-world": {
    nodeId: "csharp:t1:hello-world",
    title: "Hello, C#!",
    sections: [
      {
        heading: "Your First C# Program",
        body: "C# is a modern, strongly typed language created by Microsoft that runs on the .NET platform. Unlike Python, C# requires you to compile your code before running it. The simplest program uses Console.WriteLine() to print text to the terminal. In modern C# (top-level statements), you can write executable code directly without wrapping it in a class and Main method.",
      },
      {
        heading: "The .NET CLI",
        body: "The .NET SDK includes a command-line tool called dotnet. To create a new console project, run 'dotnet new console -n MyApp'. To run your project, use 'dotnet run'. The CLI handles compilation, package management, and project scaffolding. Every C# project has a .csproj file that defines its settings and dependencies.",
      },
      {
        heading: "Namespaces and Using Directives",
        body: "C# organizes code into namespaces to avoid naming collisions. The 'using' directive at the top of a file imports a namespace so you can use its types without full qualification. For example, 'using System;' lets you write Console.WriteLine instead of System.Console.WriteLine. Modern .NET projects have implicit usings enabled by default, so common namespaces are imported automatically.",
      },
    ],
    codeExamples: [
      {
        title: "Hello World with top-level statements",
        code: `// Program.cs — no class or Main needed in modern C#
Console.WriteLine("Hello, World!");`,
        explanation:
          "Top-level statements (C# 9+) let you write code directly. The compiler generates the Main method for you behind the scenes.",
      },
      {
        title: "Traditional Hello World with Main method",
        code: `namespace MyApp;

class Program
{
    static void Main(string[] args)
    {
        Console.WriteLine("Hello, World!");
        Console.WriteLine("Arguments: " + args.Length);
    }
}`,
        explanation:
          "The traditional structure: a namespace, a class, and a static Main method as the entry point. You'll see this in older codebases and tutorials.",
      },
      {
        title: "Creating and running a project",
        code: `$ dotnet new console -n HelloApp
$ cd HelloApp
$ dotnet run
Hello, World!`,
        explanation:
          "The dotnet CLI scaffolds a new project with a Program.cs file. 'dotnet run' compiles and executes in one step.",
      },
    ],
    keyTakeaways: [
      "Console.WriteLine() prints text followed by a newline; Console.Write() prints without a newline",
      "Top-level statements (C# 9+) let you skip the class and Main boilerplate",
      "'dotnet new console' creates a project; 'dotnet run' compiles and runs it",
      "'using' directives import namespaces; modern .NET has implicit usings",
      "Every statement in C# ends with a semicolon (;)",
    ],
  },

  "csharp:t1:variables-types": {
    nodeId: "csharp:t1:variables-types",
    title: "Variables & Types",
    sections: [
      {
        heading: "Strong Typing in C#",
        body: "C# is statically and strongly typed. Every variable has a type declared at creation time, and that type cannot change. This is the opposite of Python's dynamic typing. The compiler catches type mismatches before your code runs, which prevents many bugs. You declare a variable with its type followed by its name: 'int age = 25;'.",
      },
      {
        heading: "Common Value Types",
        body: "C# has several built-in value types: int (32-bit integer), long (64-bit integer), double (64-bit floating point), float (32-bit floating point, requires 'f' suffix), decimal (128-bit for financial calculations), bool (true/false), and char (a single Unicode character in single quotes). Value types are stored directly on the stack and are copied when assigned.",
      },
      {
        heading: "Type Inference with var",
        body: "The 'var' keyword tells the compiler to infer the type from the right-hand side of the assignment. 'var name = \"Alice\";' is identical to 'string name = \"Alice\";' — the type is still string, it's just determined automatically. var is not dynamic typing — once inferred, the type is fixed. Use var when the type is obvious from the initializer; use explicit types when clarity matters.",
      },
      {
        heading: "Constants",
        body: "Use 'const' for values that never change and are known at compile time, like 'const double Pi = 3.14159;'. Constants are implicitly static and must be initialized with a literal or constant expression. For values set once at runtime, use 'readonly' on fields instead.",
      },
    ],
    codeExamples: [
      {
        title: "Declaring variables with explicit types",
        code: `int age = 25;
double height = 5.9;
string name = "Alice";
bool isStudent = true;
char grade = 'A';

Console.WriteLine($"{name} is {age} years old");`,
        explanation:
          "Each variable is declared with its type. The $ before the string enables string interpolation (similar to Python f-strings).",
      },
      {
        title: "Using var for type inference",
        code: `var count = 42;          // int
var price = 19.99;       // double
var message = "Hello";   // string
var active = true;       // bool

// This would NOT compile:
// count = "text";  // Error: cannot convert string to int`,
        explanation:
          "var infers the type at compile time. Once set, the type is locked — reassigning to a different type is a compile error.",
      },
      {
        title: "Numeric type differences",
        code: `int whole = 42;
double precise = 42.0;
float less = 42.0f;     // 'f' suffix required
decimal money = 42.00m; // 'm' suffix for decimal
long big = 9_000_000_000L; // underscores for readability

Console.WriteLine(typeof(int));     // System.Int32
Console.WriteLine(sizeof(double));  // 8 (bytes)`,
        explanation:
          "float needs 'f', decimal needs 'm', long needs 'L'. Underscores in numeric literals are purely visual separators.",
      },
    ],
    keyTakeaways: [
      "C# is statically typed — every variable's type is fixed at compile time",
      "Common types: int, double, float (f suffix), decimal (m suffix), string, bool, char",
      "'var' infers the type from the initializer but the type is still fixed",
      "'const' creates compile-time constants; 'readonly' is for runtime constants",
      "Value types (int, double, bool, char) are copied on assignment; string is a reference type but immutable",
    ],
  },

  "csharp:t1:operators-expressions": {
    nodeId: "csharp:t1:operators-expressions",
    title: "Operators & Expressions",
    sections: [
      {
        heading: "Arithmetic Operators",
        body: "C# supports standard arithmetic: + (add), - (subtract), * (multiply), / (divide), % (modulo). Unlike Python, integer division in C# truncates toward zero by default — 7 / 2 gives 3, not 3.5. To get a decimal result, at least one operand must be a floating-point type. C# also has increment (++) and decrement (--) operators, which Python lacks.",
      },
      {
        heading: "Comparison and Logical Operators",
        body: "Comparison operators are the same as Python: ==, !=, <, >, <=, >=. Logical operators use symbols instead of words: && (and), || (or), ! (not). These also short-circuit: && stops at the first false, || stops at the first true. C# does not support Python-style chaining like '1 < x < 10'.",
      },
      {
        heading: "The Ternary Operator",
        body: "C# has a ternary conditional operator: condition ? valueIfTrue : valueIfFalse. This is a compact if/else expression. For example, 'string label = age >= 18 ? \"adult\" : \"minor\";'. Python's equivalent is 'label = \"adult\" if age >= 18 else \"minor\"'. The ternary operator is best for simple choices — nested ternaries become unreadable.",
      },
    ],
    codeExamples: [
      {
        title: "Arithmetic operators",
        code: `Console.WriteLine(7 / 2);       // 3  (integer division)
Console.WriteLine(7.0 / 2);     // 3.5 (floating-point)
Console.WriteLine(7 % 2);       // 1  (remainder)

int x = 5;
x++;                            // x is now 6
Console.WriteLine(x);           // 6`,
        explanation:
          "Integer / integer gives an integer in C#. Use 7.0 / 2 or (double)7 / 2 to get a decimal result.",
      },
      {
        title: "Comparison and logical operators",
        code: `int age = 25;
bool hasId = true;

bool canEnter = age >= 18 && hasId;  // true
bool isTeen = age >= 13 && age <= 19; // false (25 is not 13-19)
bool isMinor = !canEnter;             // false

Console.WriteLine(canEnter);  // True`,
        explanation:
          "&& means 'and', || means 'or', ! means 'not'. Note: C# prints True/False with capital letters, unlike Python's True/False.",
      },
      {
        title: "Ternary operator",
        code: `int score = 85;
string result = score >= 60 ? "Pass" : "Fail";
Console.WriteLine(result);  // Pass

// Equivalent if/else:
// string result;
// if (score >= 60) result = "Pass";
// else result = "Fail";`,
        explanation:
          "The ternary operator is concise for simple conditional assignments. Use if/else for anything more complex.",
      },
    ],
    keyTakeaways: [
      "Integer division truncates in C#: 7 / 2 = 3. Cast to double for decimal results",
      "++ and -- increment/decrement by 1 (prefix or postfix)",
      "Use && (and), || (or), ! (not) instead of Python's words",
      "The ternary operator: condition ? trueValue : falseValue",
      "C# does NOT support chained comparisons like Python's 1 < x < 10",
    ],
  },

  "csharp:t1:control-flow": {
    nodeId: "csharp:t1:control-flow",
    title: "Control Flow",
    sections: [
      {
        heading: "if / else if / else",
        body: "C# uses curly braces {} to define blocks, not indentation like Python. The if statement evaluates a boolean condition. Unlike Python's 'elif', C# uses 'else if'. Parentheses around the condition are required. Single-statement bodies can omit braces, but always using them is recommended to prevent bugs.",
      },
      {
        heading: "switch Expressions",
        body: "C# has a powerful switch expression (C# 8+) that replaces verbose switch statements. The syntax is: 'result = value switch { pattern => result, ... }'. Each arm uses '=>' to map a pattern to a result. The '_' discard pattern acts as the default case. Switch expressions must be exhaustive — the compiler warns if you miss a case.",
      },
      {
        heading: "Loops: for, foreach, while, do-while",
        body: "C# has four loop types. 'for' is the classic counter loop: for (int i = 0; i < 10; i++). 'foreach' iterates over collections: foreach (var item in list). 'while' checks the condition before each iteration. 'do-while' checks after each iteration, guaranteeing at least one execution. Use 'break' to exit a loop early and 'continue' to skip to the next iteration.",
      },
    ],
    codeExamples: [
      {
        title: "if / else if / else",
        code: `int score = 85;

if (score >= 90)
{
    Console.WriteLine("A");
}
else if (score >= 80)
{
    Console.WriteLine("B");
}
else
{
    Console.WriteLine("C or below");
}
// Output: B`,
        explanation:
          "Conditions use parentheses. Blocks use curly braces. 'else if' is two words (not 'elif').",
      },
      {
        title: "switch expression",
        code: `int dayOfWeek = 3;

string dayName = dayOfWeek switch
{
    1 => "Monday",
    2 => "Tuesday",
    3 => "Wednesday",
    4 => "Thursday",
    5 => "Friday",
    _ => "Weekend",
};

Console.WriteLine(dayName);  // Wednesday`,
        explanation:
          "Switch expressions are concise pattern-matching. The '_' is the discard pattern (default case). The result is assigned directly.",
      },
      {
        title: "for, foreach, while loops",
        code: `// Classic for loop
for (int i = 0; i < 5; i++)
{
    Console.Write(i + " ");  // 0 1 2 3 4
}
Console.WriteLine();

// foreach over an array
string[] fruits = { "apple", "banana", "cherry" };
foreach (var fruit in fruits)
{
    Console.WriteLine(fruit);
}

// while loop
int count = 3;
while (count > 0)
{
    Console.WriteLine(count);
    count--;
}`,
        explanation:
          "for uses (init; condition; increment). foreach iterates collections without index management. while checks before each iteration.",
      },
    ],
    keyTakeaways: [
      "C# uses {} for blocks, not indentation; parentheses around conditions are required",
      "'else if' instead of Python's 'elif'",
      "switch expressions (C# 8+) use '=>' and '_' for pattern matching",
      "for (init; condition; step) is the classic counter loop",
      "foreach iterates collections; while and do-while are condition-based loops",
      "break exits a loop; continue skips to the next iteration",
    ],
  },

  "csharp:t1:strings-io": {
    nodeId: "csharp:t1:strings-io",
    title: "Strings & Console I/O",
    sections: [
      {
        heading: "String Interpolation",
        body: "C# string interpolation uses the $ prefix (like Python's f-strings). Write $\"Hello, {name}!\" to embed expressions inside a string. You can include any valid C# expression inside the braces, including method calls and formatting. For multi-line strings, use the @ prefix (verbatim strings) which preserves whitespace and ignores escape sequences. Combine them as $@\"...\" for interpolated verbatim strings.",
      },
      {
        heading: "Common String Methods",
        body: "Strings in C# are immutable, just like Python. Key methods: ToUpper()/ToLower() for case, Trim() to remove whitespace, Split() to break into an array, string.Join() to combine, Replace() for substitution, Contains()/StartsWith()/EndsWith() for searching, and Substring() for extracting portions. Length is a property (no parentheses), not a method.",
      },
      {
        heading: "Console Input",
        body: "Console.ReadLine() reads a line of text from the user, returning a string (or null if input is redirected). To convert to a number, use int.Parse() for a direct conversion that throws on invalid input, or int.TryParse() which returns a bool indicating success. TryParse is the safer choice — it uses an 'out' parameter to return the parsed value.",
      },
    ],
    codeExamples: [
      {
        title: "String interpolation and verbatim strings",
        code: `string name = "Alice";
int age = 30;

// Interpolation (like Python f-strings)
Console.WriteLine($"{name} is {age} years old");
Console.WriteLine($"Next year: {age + 1}");
Console.WriteLine($"Pi: {Math.PI:F2}");  // 3.14 (2 decimals)

// Verbatim string (preserves newlines, no escapes)
string path = @"C:\\Users\\Alice\\file.txt";
Console.WriteLine(path);  // C:\\Users\\Alice\\file.txt`,
        explanation:
          "$ enables interpolation. @ disables escape sequences. :F2 formats a number to 2 decimal places.",
      },
      {
        title: "String methods",
        code: `string input = "  Hello, World!  ";

Console.WriteLine(input.Trim());            // "Hello, World!"
Console.WriteLine(input.Trim().ToUpper());  // "HELLO, WORLD!"
Console.WriteLine(input.Trim().Length);      // 13

string[] words = "one,two,three".Split(',');
Console.WriteLine(words.Length);             // 3
Console.WriteLine(string.Join(" | ", words)); // "one | two | three"

Console.WriteLine("Hello".Contains("ell")); // True
Console.WriteLine("Hello".Replace("l", "L")); // HeLLo`,
        explanation:
          "Methods can be chained. Length is a property (no parentheses). string.Join is a static method.",
      },
      {
        title: "Reading and parsing console input",
        code: `Console.Write("Enter your name: ");
string? name = Console.ReadLine();

Console.Write("Enter your age: ");
string? ageText = Console.ReadLine();

if (int.TryParse(ageText, out int age))
{
    Console.WriteLine($"Hello {name}, you are {age}!");
}
else
{
    Console.WriteLine("That's not a valid number.");
}`,
        explanation:
          "TryParse returns true/false and sets the 'out' variable on success. This is safer than Parse which throws an exception on invalid input.",
      },
    ],
    keyTakeaways: [
      "$\"...\" enables string interpolation — C#'s equivalent of Python f-strings",
      "@\"...\" is a verbatim string that ignores escape sequences",
      "Strings are immutable — methods return new strings",
      "Use int.TryParse() for safe conversion; int.Parse() throws on invalid input",
      "Console.ReadLine() returns string? (nullable) — always check for null in production code",
      "Length is a property (no parentheses), not a method",
    ],
  },
};
