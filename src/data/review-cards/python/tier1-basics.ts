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

// ────────────────────────────────────────────────────────────
// Tier 1: Python Basics (7 nodes, ~25 cards)
// ────────────────────────────────────────────────────────────

export const tier1Cards: ReviewCard[] = [
  // ── python:t1:hello-world ──────────────────────────────────
  makeCard({
    id: "card:python:t1:hello-world:1",
    nodeId: "python:t1:hello-world",
    branchId: "python",
    type: "concept",
    front: "What does the print() function do in Python, and what happens if you call it with no arguments?",
    back: "print() writes text to standard output (the console). When called with no arguments, it outputs an empty line — equivalent to printing an empty string followed by a newline character.",
  }),
  makeCard({
    id: "card:python:t1:hello-world:2",
    nodeId: "python:t1:hello-world",
    branchId: "python",
    type: "code_output",
    front: "What does this code print?",
    code: 'print("Hello")\nprint()\nprint("World")',
    expectedOutput: "Hello\n\nWorld",
    back: "The first print outputs 'Hello', the second print() with no arguments outputs a blank line, and the third outputs 'World'. Each print() adds a newline by default.",
  }),
  makeCard({
    id: "card:python:t1:hello-world:3",
    nodeId: "python:t1:hello-world",
    branchId: "python",
    type: "bug_spot",
    front: "Find the bug in this code.",
    code: 'Print("Hello, World!")',
    back: "Python is case-sensitive. 'Print' should be 'print' (lowercase). Built-in functions in Python are always lowercase. This raises a NameError because 'Print' is not defined.",
  }),
  makeCard({
    id: "card:python:t1:hello-world:4",
    nodeId: "python:t1:hello-world",
    branchId: "python",
    type: "explain",
    front: "Explain what the Python REPL is and why it is useful for beginners.",
    back: "The REPL (Read-Eval-Print Loop) is an interactive Python shell that reads an expression, evaluates it, prints the result, and loops back. It is useful for quickly testing small snippets of code, exploring functions, and getting immediate feedback without creating a file.",
  }),

  // ── python:t1:variables ────────────────────────────────────
  makeCard({
    id: "card:python:t1:variables:1",
    nodeId: "python:t1:variables",
    branchId: "python",
    type: "concept",
    front: "What does 'dynamically typed' mean in Python?",
    back: "In a dynamically typed language, variables do not have a fixed type. A variable is simply a name that refers to an object, and you can reassign it to a value of a different type at any time. For example, x can be an int and later become a str — Python determines the type at runtime, not at compile time.",
  }),
  makeCard({
    id: "card:python:t1:variables:2",
    nodeId: "python:t1:variables",
    branchId: "python",
    type: "code_output",
    front: "What does this code print?",
    code: 'x = 10\nx = "hello"\nprint(type(x).__name__)',
    expectedOutput: "str",
    back: "x is first assigned the integer 10, then reassigned to the string 'hello'. Because Python is dynamically typed, this is allowed. type(x).__name__ returns the name of the current type, which is 'str'.",
  }),
  makeCard({
    id: "card:python:t1:variables:3",
    nodeId: "python:t1:variables",
    branchId: "python",
    type: "bug_spot",
    front: "Find the bug in this code.",
    code: '2nd_place = "Silver"\nprint(2nd_place)',
    back: "Variable names in Python cannot start with a digit. '2nd_place' is an invalid identifier and causes a SyntaxError. A valid alternative would be 'second_place' or 'place_2nd'.",
  }),
  makeCard({
    id: "card:python:t1:variables:4",
    nodeId: "python:t1:variables",
    branchId: "python",
    type: "fill_blank",
    front: "Fill in the blanks to swap the values of a and b without a temporary variable.",
    code: 'a = 5\nb = 10\na, b = __BLANK__, __BLANK__\nprint(a, b)',
    blanks: ["b", "a"],
    back: "Python supports tuple unpacking, so 'a, b = b, a' swaps the values in a single statement. After the swap, a is 10 and b is 5.",
  }),

  // ── python:t1:data-types ───────────────────────────────────
  makeCard({
    id: "card:python:t1:data-types:1",
    nodeId: "python:t1:data-types",
    branchId: "python",
    type: "concept",
    front: "What are the four primitive (scalar) data types in Python and what kind of values does each hold?",
    back: "int — whole numbers (42, -7). float — decimal numbers (3.14, -0.5). str — text strings ('hello'). bool — Boolean values (True, False). bool is actually a subclass of int in Python, where True == 1 and False == 0.",
  }),
  makeCard({
    id: "card:python:t1:data-types:2",
    nodeId: "python:t1:data-types",
    branchId: "python",
    type: "code_output",
    front: "What does this code print?",
    code: "print(type(True).__name__)\nprint(isinstance(True, int))\nprint(True + True)",
    expectedOutput: "bool\nTrue\n2",
    back: "bool is a subclass of int in Python. type(True).__name__ is 'bool', isinstance(True, int) is True because of the subclass relationship, and True + True evaluates to 2 because True equals 1 in numeric contexts.",
  }),
  makeCard({
    id: "card:python:t1:data-types:3",
    nodeId: "python:t1:data-types",
    branchId: "python",
    type: "code_output",
    front: "What does this code print?",
    code: 'x = 7 / 2\ny = 7 // 2\nprint(x, type(x).__name__)\nprint(y, type(y).__name__)',
    expectedOutput: "3.5 float\n3 int",
    back: "The / operator always returns a float (even for exact divisions like 4/2 = 2.0). The // operator performs floor division and returns an int when both operands are ints. 7 // 2 = 3.",
  }),
  makeCard({
    id: "card:python:t1:data-types:4",
    nodeId: "python:t1:data-types",
    branchId: "python",
    type: "explain",
    front: "Explain the difference between implicit and explicit type conversion in Python.",
    back: "Implicit conversion (coercion) happens automatically — for example, adding an int to a float promotes the int to float (2 + 3.0 = 5.0). Explicit conversion (casting) requires calling a function like int(), float(), str(), or bool() — for example, int('42') converts the string '42' to the integer 42. Explicit conversion can raise a ValueError if the value cannot be converted.",
  }),

  // ── python:t1:strings ─────────────────────────────────────
  makeCard({
    id: "card:python:t1:strings:1",
    nodeId: "python:t1:strings",
    branchId: "python",
    type: "code_output",
    front: "What does this code print?",
    code: 's = "Python"\nprint(s[0], s[-1])\nprint(s[1:4])',
    expectedOutput: "P n\nyth",
    back: "s[0] is 'P' (first character), s[-1] is 'n' (last character). s[1:4] slices from index 1 up to but not including index 4, giving 'yth'.",
  }),
  makeCard({
    id: "card:python:t1:strings:2",
    nodeId: "python:t1:strings",
    branchId: "python",
    type: "fill_blank",
    front: "Fill in the blank to create a formatted string that says 'Hello, Alice! You are 30 years old.'",
    code: 'name = "Alice"\nage = 30\nresult = __BLANK__"Hello, {name}! You are {age} years old."\nprint(result)',
    blanks: ["f"],
    back: "The f prefix before a string literal creates an f-string (formatted string literal). Expressions inside {} are evaluated at runtime and inserted into the string. f-strings were introduced in Python 3.6.",
  }),
  makeCard({
    id: "card:python:t1:strings:3",
    nodeId: "python:t1:strings",
    branchId: "python",
    type: "concept",
    front: "Are strings mutable or immutable in Python? What happens if you try to change a character?",
    back: "Strings are immutable in Python. You cannot change individual characters — s[0] = 'x' raises a TypeError. To modify a string, you must create a new one, for example using concatenation, slicing, or the replace() method.",
  }),
  makeCard({
    id: "card:python:t1:strings:4",
    nodeId: "python:t1:strings",
    branchId: "python",
    type: "code_output",
    front: "What does this code print?",
    code: 'msg = "  hello world  "\nprint(msg.strip().title())',
    expectedOutput: "Hello World",
    back: "strip() removes leading and trailing whitespace, giving 'hello world'. title() capitalizes the first letter of each word, producing 'Hello World'. String methods are chained left to right.",
  }),

  // ── python:t1:operators ────────────────────────────────────
  makeCard({
    id: "card:python:t1:operators:1",
    nodeId: "python:t1:operators",
    branchId: "python",
    type: "code_output",
    front: "What does this code print?",
    code: "print(17 % 5)\nprint(2 ** 10)\nprint(17 // 5)",
    expectedOutput: "2\n1024\n3",
    back: "% is modulo (17 mod 5 = 2, the remainder). ** is exponentiation (2^10 = 1024). // is floor division (17 divided by 5 = 3.4, floored to 3).",
  }),
  makeCard({
    id: "card:python:t1:operators:2",
    nodeId: "python:t1:operators",
    branchId: "python",
    type: "concept",
    front: "What is short-circuit evaluation and how do 'and' and 'or' use it in Python?",
    back: "'and' returns the first falsy value or the last value if all are truthy — it stops as soon as it finds a falsy value. 'or' returns the first truthy value or the last value if all are falsy — it stops as soon as it finds a truthy value. This avoids unnecessary evaluation. For example, 'x and y' will not evaluate y if x is falsy.",
  }),
  makeCard({
    id: "card:python:t1:operators:3",
    nodeId: "python:t1:operators",
    branchId: "python",
    type: "code_output",
    front: "What does this code print?",
    code: 'print(0 or "" or [] or "found" or "extra")\nprint(1 and 2 and 3)\nprint(1 and 0 and 3)',
    expectedOutput: "found\n3\n0",
    back: "'or' returns the first truthy value: 0, '', and [] are all falsy, so it returns 'found'. 'and' returns the last value if all are truthy (3), or the first falsy value (0). This is short-circuit evaluation in action.",
  }),

  // ── python:t1:input-output ─────────────────────────────────
  makeCard({
    id: "card:python:t1:input-output:1",
    nodeId: "python:t1:input-output",
    branchId: "python",
    type: "concept",
    front: "What type does input() always return in Python, and why does this matter?",
    back: "input() always returns a str, even if the user types a number. This matters because operations like addition will concatenate strings instead of adding numbers. You must explicitly cast the result — for example, int(input()) or float(input()) — to do arithmetic.",
  }),
  makeCard({
    id: "card:python:t1:input-output:2",
    nodeId: "python:t1:input-output",
    branchId: "python",
    type: "code_output",
    front: "What does this code print?",
    code: 'print("A", "B", "C", sep="-")\nprint("Hello", end=" ")\nprint("World")',
    expectedOutput: "A-B-C\nHello World",
    back: "The sep parameter changes the separator between arguments (default is a space). The end parameter changes what is printed after the last argument (default is a newline). Setting end=' ' causes the next print to continue on the same line.",
  }),
  makeCard({
    id: "card:python:t1:input-output:3",
    nodeId: "python:t1:input-output",
    branchId: "python",
    type: "bug_spot",
    front: "Find the bug in this code.",
    code: 'age = input("Enter age: ")\nnext_year = age + 1\nprint(f"Next year you will be {next_year}")',
    back: "input() returns a string, so 'age + 1' tries to add an int to a str, raising a TypeError. The fix is to cast the input: age = int(input('Enter age: ')). This is one of the most common beginner mistakes in Python.",
  }),

  // ── python:t1:comments ─────────────────────────────────────
  makeCard({
    id: "card:python:t1:comments:1",
    nodeId: "python:t1:comments",
    branchId: "python",
    type: "concept",
    front: "What is the difference between a comment (#) and a docstring (triple quotes) in Python?",
    back: "Comments (# ...) are ignored by the interpreter and are for human readers only. Docstrings (\"\"\"...\"\"\") are string literals placed as the first statement in a module, class, or function. Unlike comments, docstrings are stored as the __doc__ attribute and can be accessed at runtime via help() or .__doc__.",
  }),
  makeCard({
    id: "card:python:t1:comments:2",
    nodeId: "python:t1:comments",
    branchId: "python",
    type: "fill_blank",
    front: "Fill in the blank to write a proper docstring for this function.",
    code: 'def add(a, b):\n    __BLANK__\n    return a + b',
    blanks: ['"""Return the sum of a and b."""'],
    back: 'A docstring is a triple-quoted string on the first line of a function body. It describes what the function does. PEP 257 recommends a one-line docstring for simple functions: """Return the sum of a and b."""',
  }),
  makeCard({
    id: "card:python:t1:comments:3",
    nodeId: "python:t1:comments",
    branchId: "python",
    type: "explain",
    front: "Explain two key rules from PEP 8 that improve code readability.",
    back: "1. Use 4 spaces per indentation level (never tabs mixed with spaces). This ensures consistent visual structure across all Python code. 2. Limit lines to 79 characters (or 99 in some style guides). Long lines are hard to read, especially in side-by-side diffs. Other important PEP 8 rules include using snake_case for variables and functions, and adding blank lines between top-level definitions.",
  }),
];
