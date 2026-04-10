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
// python:t1:hello-world  (4 cards)
// ────────────────────────────────────────────────────────────

const helloWorld: ReviewCard[] = [
  makeCard({
    id: "card:python:t1:hello-world:1",
    nodeId: "python:t1:hello-world",
    branchId: "python",
    type: "concept",
    front: "What does the print() function do in Python, and what happens if you call it with no arguments?",
    back: "print() writes its arguments to standard output as text. When called with no arguments, it outputs an empty line (a bare newline character). This is useful for adding vertical spacing in console output.",
  }),
  makeCard({
    id: "card:python:t1:hello-world:2",
    nodeId: "python:t1:hello-world",
    branchId: "python",
    type: "code_output",
    front: "What does this code print?",
    code: 'print("Hello")\nprint()\nprint("World")',
    expectedOutput: "Hello\n\nWorld",
    back: "Each print() call outputs on a new line. The middle print() with no arguments prints an empty line, creating a blank line between 'Hello' and 'World'.",
  }),
  makeCard({
    id: "card:python:t1:hello-world:3",
    nodeId: "python:t1:hello-world",
    branchId: "python",
    type: "fill_blank",
    front: "Fill in the blank to print a greeting.",
    code: '__BLANK__("Hello, World!")',
    blanks: ["print"],
    back: "print() is the built-in function used to display output to the console. It converts its arguments to strings and writes them to stdout.",
  }),
  makeCard({
    id: "card:python:t1:hello-world:4",
    nodeId: "python:t1:hello-world",
    branchId: "python",
    type: "explain",
    front: "Explain the difference between running Python code in the REPL vs running a .py script file.",
    back: "The REPL (Read-Eval-Print Loop) executes code interactively line by line and automatically displays the result of each expression. A .py script runs all code top-to-bottom without displaying expression results unless you explicitly use print(). The REPL is great for experimenting; scripts are for reusable programs.",
  }),
];

// ────────────────────────────────────────────────────────────
// python:t1:variables  (4 cards)
// ────────────────────────────────────────────────────────────

const variables: ReviewCard[] = [
  makeCard({
    id: "card:python:t1:variables:1",
    nodeId: "python:t1:variables",
    branchId: "python",
    type: "concept",
    front: "What does 'dynamically typed' mean in Python?",
    back: "In a dynamically typed language, you do not declare variable types explicitly. The type is attached to the value, not the variable name. A variable can be reassigned to a value of a different type at any time: x = 5 (int), then x = 'hello' (str) is perfectly valid.",
  }),
  makeCard({
    id: "card:python:t1:variables:2",
    nodeId: "python:t1:variables",
    branchId: "python",
    type: "code_output",
    front: "What does this code print?",
    code: 'x = 10\ny = x\nx = 20\nprint(y)',
    expectedOutput: "10",
    back: "y = x copies the value 10 to y. Reassigning x to 20 does not affect y because integers are immutable. y still holds the original value 10.",
  }),
  makeCard({
    id: "card:python:t1:variables:3",
    nodeId: "python:t1:variables",
    branchId: "python",
    type: "bug_spot",
    front: "Find the bug in this code.",
    code: 'my-variable = 42\nprint(my-variable)',
    back: "Hyphens are not allowed in Python variable names because Python interprets the - as the subtraction operator. Use underscores instead: my_variable = 42. Valid names contain letters, digits, and underscores, and cannot start with a digit.",
  }),
  makeCard({
    id: "card:python:t1:variables:4",
    nodeId: "python:t1:variables",
    branchId: "python",
    type: "code_output",
    front: "What does this code print?",
    code: 'a = 5\nb = 3\na, b = b, a\nprint(a, b)',
    expectedOutput: "3 5",
    back: "Python supports tuple unpacking for simultaneous assignment. a, b = b, a swaps the values in a single statement without needing a temporary variable.",
  }),
];

// ────────────────────────────────────────────────────────────
// python:t1:data-types  (4 cards)
// ────────────────────────────────────────────────────────────

const dataTypes: ReviewCard[] = [
  makeCard({
    id: "card:python:t1:data-types:1",
    nodeId: "python:t1:data-types",
    branchId: "python",
    type: "concept",
    front: "What are the four primitive data types in Python and what kind of values does each hold?",
    back: "int — whole numbers (42, -7). float — decimal numbers (3.14, -0.001). str — text sequences ('hello'). bool — logical values (True, False). Python also treats bool as a subclass of int, so True == 1 and False == 0.",
  }),
  makeCard({
    id: "card:python:t1:data-types:2",
    nodeId: "python:t1:data-types",
    branchId: "python",
    type: "code_output",
    front: "What does this code print?",
    code: 'print(type(3.0) == type(3))\nprint(isinstance(True, int))',
    expectedOutput: "False\nTrue",
    back: "type(3.0) is <class 'float'> and type(3) is <class 'int'>, so they are not equal. However, bool is a subclass of int in Python, so isinstance(True, int) returns True.",
  }),
  makeCard({
    id: "card:python:t1:data-types:3",
    nodeId: "python:t1:data-types",
    branchId: "python",
    type: "fill_blank",
    front: "Fill in the blank to convert a string to an integer.",
    code: 'age_str = "25"\nage = __BLANK__(age_str)\nprint(age + 1)',
    blanks: ["int"],
    back: "int() converts a string containing a valid integer literal into an int. Without this conversion, age_str + 1 would raise a TypeError because you cannot add a string and an integer.",
  }),
  makeCard({
    id: "card:python:t1:data-types:4",
    nodeId: "python:t1:data-types",
    branchId: "python",
    type: "code_output",
    front: "What does this code print?",
    code: 'print(int(3.9))\nprint(int("10"))\nprint(float(7))',
    expectedOutput: "3\n10\n7.0",
    back: "int() truncates a float toward zero (does not round). int() parses a string as a whole number. float() converts an integer to its floating-point equivalent, displayed with a decimal point.",
  }),
];

// ────────────────────────────────────────────────────────────
// python:t1:strings  (4 cards)
// ────────────────────────────────────────────────────────────

const strings: ReviewCard[] = [
  makeCard({
    id: "card:python:t1:strings:1",
    nodeId: "python:t1:strings",
    branchId: "python",
    type: "code_output",
    front: "What does this code print?",
    code: 's = "Python"\nprint(s[0], s[-1], s[1:4])',
    expectedOutput: "P n yth",
    back: "s[0] is the first character 'P'. s[-1] is the last character 'n'. s[1:4] slices from index 1 up to (not including) 4, giving 'yth'. print() separates arguments with spaces by default.",
  }),
  makeCard({
    id: "card:python:t1:strings:2",
    nodeId: "python:t1:strings",
    branchId: "python",
    type: "fill_blank",
    front: "Fill in the blank to create a formatted string.",
    code: 'name = "Alice"\nage = 30\ngreeting = __BLANK__"Hello, {name}! You are {age}."\nprint(greeting)',
    blanks: ["f"],
    back: "The f prefix creates an f-string (formatted string literal), introduced in Python 3.6. Expressions inside curly braces {} are evaluated at runtime and inserted into the string.",
  }),
  makeCard({
    id: "card:python:t1:strings:3",
    nodeId: "python:t1:strings",
    branchId: "python",
    type: "bug_spot",
    front: "Find the bug in this code.",
    code: 'message = "Hello"\nmessage[0] = "h"\nprint(message)',
    back: "Strings in Python are immutable — you cannot change individual characters via index assignment. This raises a TypeError. To get 'hello', create a new string: message = 'h' + message[1:] or message = message.replace('H', 'h').",
  }),
  makeCard({
    id: "card:python:t1:strings:4",
    nodeId: "python:t1:strings",
    branchId: "python",
    type: "code_output",
    front: "What does this code print?",
    code: 'words = "  hello world  "\nprint(words.strip().split())\nprint("_".join(["a", "b", "c"]))',
    expectedOutput: "['hello', 'world']\na_b_c",
    back: "strip() removes leading and trailing whitespace. split() with no arguments splits on any whitespace and removes empty strings. join() concatenates list elements using the string as a separator.",
  }),
];

// ────────────────────────────────────────────────────────────
// python:t1:operators  (3 cards)
// ────────────────────────────────────────────────────────────

const operators: ReviewCard[] = [
  makeCard({
    id: "card:python:t1:operators:1",
    nodeId: "python:t1:operators",
    branchId: "python",
    type: "concept",
    front: "What is the difference between / and // in Python?",
    back: "/ is true division — it always returns a float (e.g., 7 / 2 = 3.5). // is floor division — it rounds down to the nearest integer toward negative infinity (e.g., 7 // 2 = 3, -7 // 2 = -4). When used with floats, // still rounds down but returns a float (7.0 // 2 = 3.0).",
  }),
  makeCard({
    id: "card:python:t1:operators:2",
    nodeId: "python:t1:operators",
    branchId: "python",
    type: "code_output",
    front: "What does this code print?",
    code: 'print(2 ** 3)\nprint(17 % 5)\nprint(-7 // 2)',
    expectedOutput: "8\n2\n-4",
    back: "** is exponentiation: 2^3 = 8. % is modulo (remainder): 17 = 5*3 + 2. // is floor division that rounds toward negative infinity: -7/2 = -3.5, floored to -4.",
  }),
  makeCard({
    id: "card:python:t1:operators:3",
    nodeId: "python:t1:operators",
    branchId: "python",
    type: "code_output",
    front: "What does this code print?",
    code: 'x = 5\nprint(x > 3 and x < 10)\nprint(not (x == 5))\nprint(x != 5 or x > 4)',
    expectedOutput: "True\nFalse\nTrue",
    back: "x > 3 and x < 10: both conditions are True, so result is True. not (x == 5): x is 5, so x == 5 is True, negated to False. x != 5 or x > 4: first is False, but second is True, so or yields True.",
  }),
];

// ────────────────────────────────────────────────────────────
// python:t1:input-output  (3 cards)
// ────────────────────────────────────────────────────────────

const inputOutput: ReviewCard[] = [
  makeCard({
    id: "card:python:t1:input-output:1",
    nodeId: "python:t1:input-output",
    branchId: "python",
    type: "concept",
    front: "What type does input() always return, and why does this matter?",
    back: "input() always returns a str (string), even if the user types a number. This matters because attempting arithmetic on the result without converting it will either fail (str + int raises TypeError) or produce unexpected results (str + str concatenates). Always cast with int() or float() when you need a number.",
  }),
  makeCard({
    id: "card:python:t1:input-output:2",
    nodeId: "python:t1:input-output",
    branchId: "python",
    type: "code_output",
    front: "What does this code print?",
    code: 'print("A", "B", "C", sep="-")\nprint("Hello", end=" ")\nprint("World")',
    expectedOutput: "A-B-C\nHello World",
    back: "The sep parameter changes the separator between arguments (default is a space). The end parameter changes what is printed after all arguments (default is a newline). Setting end=' ' means the next print continues on the same line.",
  }),
  makeCard({
    id: "card:python:t1:input-output:3",
    nodeId: "python:t1:input-output",
    branchId: "python",
    type: "fill_blank",
    front: "Fill in the blanks to read a number from the user and print its double.",
    code: 'num = __BLANK__(__BLANK__("Enter a number: "))\nprint(num * 2)',
    blanks: ["int", "input"],
    back: "input() reads a string from the user, and int() converts it to an integer. The nesting int(input(...)) is a common pattern for reading numeric input in Python.",
  }),
];

// ────────────────────────────────────────────────────────────
// python:t1:comments  (3 cards)
// ────────────────────────────────────────────────────────────

const comments: ReviewCard[] = [
  makeCard({
    id: "card:python:t1:comments:1",
    nodeId: "python:t1:comments",
    branchId: "python",
    type: "concept",
    front: "What is the difference between a # comment and a triple-quoted docstring in Python?",
    back: "A # comment is ignored by the interpreter entirely — it is for humans reading the source code. A triple-quoted string (\"\"\"...\"\"\") placed as the first statement in a module, class, or function becomes a docstring — it is stored as the __doc__ attribute and can be accessed at runtime via help(). Docstrings serve as documentation that tools and users can inspect programmatically.",
  }),
  makeCard({
    id: "card:python:t1:comments:2",
    nodeId: "python:t1:comments",
    branchId: "python",
    type: "bug_spot",
    front: "Find the style issue in this code (PEP 8).",
    code: 'x=10 #set x to ten\ny = x+5\nMyVariable = "hello"',
    back: "Multiple PEP 8 issues: (1) Missing spaces around = and + operators: use x = 10 and y = x + 5. (2) Missing space after #: use # set x to ten. (3) Variable names should be snake_case, not PascalCase: my_variable instead of MyVariable. PEP 8 conventions keep code readable and consistent.",
  }),
  makeCard({
    id: "card:python:t1:comments:3",
    nodeId: "python:t1:comments",
    branchId: "python",
    type: "explain",
    front: "Explain when you should and should not write comments in your code.",
    back: "Write comments to explain WHY something is done, not WHAT. Good code is self-documenting through clear variable names and small functions. Comments are valuable for: non-obvious business logic, workarounds for known bugs, performance choices, and TODO notes. Avoid comments that restate the code (e.g., # increment x by 1 above x += 1) — they add noise and can become outdated.",
  }),
];

export const tier1Cards: ReviewCard[] = [
  ...helloWorld,
  ...variables,
  ...dataTypes,
  ...strings,
  ...operators,
  ...inputOutput,
  ...comments,
];
