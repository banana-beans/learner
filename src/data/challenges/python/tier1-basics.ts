import type { Challenge } from "@/lib/types";

/**
 * Tier 1: Python Fundamentals — 25 challenges across 7 nodes
 *
 * Nodes: hello-world, variables, data-types, strings, operators,
 *        input-output, comments
 */
export const tier1Challenges: Challenge[] = [
  // ────────────────────────────────────────────────────────────
  // python:t1:hello-world  (4 challenges)
  // ────────────────────────────────────────────────────────────
  {
    id: "challenge:python:t1:hello-world:1",
    nodeId: "python:t1:hello-world",
    type: "write_from_scratch",
    title: "Say Hello",
    description:
      "Write a Python program that prints the text `Hello, World!` to the console.",
    difficulty: 1,
    isBoss: false,
    starterCode: "# Write your code below\n",
    testCases: [
      {
        id: "hw1-basic",
        input: "",
        expectedOutput: "Hello, World!",
        visible: true,
        category: "basic",
        description: "Should print exactly Hello, World!",
      },
    ],
    hints: [
      { tier: "nudge", text: "Python has a built-in function for displaying output.", xpPenalty: 0.9 },
      { tier: "guide", text: "Use the print() function with a string argument.", xpPenalty: 0.75 },
      { tier: "reveal", text: 'Write: print("Hello, World!")', xpPenalty: 0.5 },
    ],
    baseXP: 100,
    tags: ["print", "strings", "basics"],
  },
  {
    id: "challenge:python:t1:hello-world:2",
    nodeId: "python:t1:hello-world",
    type: "multiple_choice",
    title: "Understanding print()",
    description: "What does the `print()` function do in Python?",
    difficulty: 1,
    isBoss: false,
    options: [
      { id: "a", text: "Displays output to the console", isCorrect: true, explanation: "print() sends text to standard output (the console)." },
      { id: "b", text: "Saves text to a file", isCorrect: false, explanation: "print() outputs to the console by default, not to a file." },
      { id: "c", text: "Reads input from the user", isCorrect: false, explanation: "That is the job of input(), not print()." },
      { id: "d", text: "Creates a new variable", isCorrect: false, explanation: "Variables are created with assignment (=), not print()." },
    ],
    hints: [
      { tier: "nudge", text: "Think about where you see results when you run a Python script.", xpPenalty: 0.9 },
      { tier: "guide", text: "print() is an output function — it shows information.", xpPenalty: 0.75 },
      { tier: "reveal", text: "print() displays output to the console/terminal.", xpPenalty: 0.5 },
    ],
    baseXP: 100,
    tags: ["print", "basics"],
  },
  {
    id: "challenge:python:t1:hello-world:3",
    nodeId: "python:t1:hello-world",
    type: "parsons",
    title: "Multi-line Greeting",
    description:
      "Arrange the lines to print a three-line greeting: your name, your favorite language, and a farewell.",
    difficulty: 1,
    isBoss: false,
    parsonsBlocks: [
      { id: "p1", code: 'print("My name is Alex")', indentLevel: 0 },
      { id: "p2", code: 'print("I love Python")', indentLevel: 0 },
      { id: "p3", code: 'print("Goodbye!")', indentLevel: 0 },
    ],
    hints: [
      { tier: "nudge", text: "Think about the logical order of an introduction.", xpPenalty: 0.9 },
      { tier: "guide", text: "First introduce yourself, then state your interest, then say goodbye.", xpPenalty: 0.75 },
      { tier: "reveal", text: "Order: name first, then language, then farewell.", xpPenalty: 0.5 },
    ],
    baseXP: 100,
    tags: ["print", "sequencing", "basics"],
  },
  {
    id: "challenge:python:t1:hello-world:4",
    nodeId: "python:t1:hello-world",
    type: "bug_fix",
    title: "Fix the Greeting",
    description:
      "The program below should print `Hello, Python!` but contains a bug. Find and fix it.",
    difficulty: 2,
    isBoss: true,
    starterCode: 'Print("Hello, Python!")\n',
    testCases: [
      {
        id: "hw4-basic",
        input: "",
        expectedOutput: "Hello, Python!",
        visible: true,
        category: "basic",
        description: "Should print Hello, Python!",
      },
    ],
    hints: [
      { tier: "nudge", text: "Python is case-sensitive. Check the function name.", xpPenalty: 0.9 },
      { tier: "guide", text: "Built-in functions in Python are lowercase.", xpPenalty: 0.75 },
      { tier: "reveal", text: 'Change Print to print: print("Hello, Python!")', xpPenalty: 0.5 },
    ],
    baseXP: 150,
    tags: ["print", "debugging", "case-sensitivity"],
  },

  // ────────────────────────────────────────────────────────────
  // python:t1:variables  (4 challenges)
  // ────────────────────────────────────────────────────────────
  {
    id: "challenge:python:t1:variables:1",
    nodeId: "python:t1:variables",
    type: "fill_in_the_blank",
    title: "Assign and Print",
    description:
      "Fill in the blanks to assign the value `42` to a variable named `answer` and print it.",
    difficulty: 1,
    isBoss: false,
    templateCode: '__BLANK__ = 42\nprint(__BLANK__)',
    testCases: [
      {
        id: "var1-basic",
        input: "",
        expectedOutput: "42",
        visible: true,
        category: "basic",
        description: "Should print 42",
      },
    ],
    hints: [
      { tier: "nudge", text: "A variable name goes on the left side of the `=` sign.", xpPenalty: 0.9 },
      { tier: "guide", text: "Both blanks should contain the variable name `answer`.", xpPenalty: 0.75 },
      { tier: "reveal", text: "Fill both blanks with: answer", xpPenalty: 0.5 },
    ],
    baseXP: 100,
    tags: ["variables", "assignment", "print"],
  },
  {
    id: "challenge:python:t1:variables:2",
    nodeId: "python:t1:variables",
    type: "predict_output",
    title: "Reassignment",
    description:
      "What is the output of the following code?\n\n```python\nx = 10\nx = 20\nprint(x)\n```",
    difficulty: 1,
    isBoss: false,
    testCases: [
      {
        id: "var2-basic",
        input: "",
        expectedOutput: "20",
        visible: true,
        category: "basic",
        description: "x is reassigned to 20",
      },
    ],
    hints: [
      { tier: "nudge", text: "Variables can be reassigned — what value does x hold at the end?", xpPenalty: 0.9 },
      { tier: "guide", text: "The second assignment `x = 20` overwrites the first.", xpPenalty: 0.75 },
      { tier: "reveal", text: "Output is 20 because the last assignment wins.", xpPenalty: 0.5 },
    ],
    baseXP: 100,
    tags: ["variables", "reassignment"],
  },
  {
    id: "challenge:python:t1:variables:3",
    nodeId: "python:t1:variables",
    type: "write_from_scratch",
    title: "Swap Two Variables",
    description:
      "Given two variables `a` and `b`, swap their values so that `a` holds the value of `b` and vice versa. Print both values on separate lines (a first, then b).",
    difficulty: 2,
    isBoss: false,
    starterCode: "a = 5\nb = 10\n\n# Swap a and b\n\nprint(a)\nprint(b)\n",
    testCases: [
      {
        id: "var3-basic",
        input: "",
        expectedOutput: "10\n5",
        visible: true,
        category: "basic",
        description: "a should be 10, b should be 5",
      },
    ],
    hints: [
      { tier: "nudge", text: "Python supports a concise swap syntax without a temp variable.", xpPenalty: 0.9 },
      { tier: "guide", text: "Try tuple unpacking: a, b = b, a", xpPenalty: 0.75 },
      { tier: "reveal", text: "Add the line: a, b = b, a", xpPenalty: 0.5 },
    ],
    baseXP: 150,
    tags: ["variables", "swap", "tuple-unpacking"],
  },
  {
    id: "challenge:python:t1:variables:4",
    nodeId: "python:t1:variables",
    type: "multiple_choice",
    title: "Valid Variable Names",
    description: "Which of the following is a valid Python variable name?",
    difficulty: 2,
    isBoss: true,
    options: [
      { id: "a", text: "my_variable", isCorrect: true, explanation: "Underscores and lowercase letters are perfectly valid." },
      { id: "b", text: "2fast", isCorrect: false, explanation: "Variable names cannot start with a digit." },
      { id: "c", text: "my-var", isCorrect: false, explanation: "Hyphens are not allowed in variable names; use underscores instead." },
      { id: "d", text: "class", isCorrect: false, explanation: "`class` is a reserved keyword in Python." },
    ],
    hints: [
      { tier: "nudge", text: "Variable names can contain letters, digits, and underscores.", xpPenalty: 0.9 },
      { tier: "guide", text: "They cannot start with a digit or use reserved keywords.", xpPenalty: 0.75 },
      { tier: "reveal", text: "my_variable is the only valid choice — no leading digits, no hyphens, no keywords.", xpPenalty: 0.5 },
    ],
    baseXP: 150,
    tags: ["variables", "naming-rules", "keywords"],
  },

  // ────────────────────────────────────────────────────────────
  // python:t1:data-types  (4 challenges)
  // ────────────────────────────────────────────────────────────
  {
    id: "challenge:python:t1:data-types:1",
    nodeId: "python:t1:data-types",
    type: "multiple_choice",
    title: "Identify the Type",
    description: 'What is the type of the value `3.14` in Python?',
    difficulty: 1,
    isBoss: false,
    options: [
      { id: "a", text: "int", isCorrect: false, explanation: "int is for whole numbers without a decimal point." },
      { id: "b", text: "float", isCorrect: true, explanation: "Numbers with a decimal point are float in Python." },
      { id: "c", text: "str", isCorrect: false, explanation: "str is for text strings, not numbers." },
      { id: "d", text: "bool", isCorrect: false, explanation: "bool is for True/False values only." },
    ],
    hints: [
      { tier: "nudge", text: "Look at the decimal point in 3.14.", xpPenalty: 0.9 },
      { tier: "guide", text: "Numbers with decimals are floating-point numbers.", xpPenalty: 0.75 },
      { tier: "reveal", text: "3.14 is a float because it has a decimal point.", xpPenalty: 0.5 },
    ],
    baseXP: 100,
    tags: ["data-types", "float", "type-identification"],
  },
  {
    id: "challenge:python:t1:data-types:2",
    nodeId: "python:t1:data-types",
    type: "predict_output",
    title: "Type Coercion",
    description:
      "What is the output of this code?\n\n```python\nresult = 5 + 2.0\nprint(type(result).__name__)\n```",
    difficulty: 2,
    isBoss: false,
    testCases: [
      {
        id: "dt2-basic",
        input: "",
        expectedOutput: "float",
        visible: true,
        category: "basic",
        description: "int + float results in float",
      },
    ],
    hints: [
      { tier: "nudge", text: "What happens when you mix int and float in arithmetic?", xpPenalty: 0.9 },
      { tier: "guide", text: "Python promotes the int to a float for the operation.", xpPenalty: 0.75 },
      { tier: "reveal", text: "5 + 2.0 = 7.0, which is a float. Output: float", xpPenalty: 0.5 },
    ],
    baseXP: 150,
    tags: ["data-types", "coercion", "float", "int"],
  },
  {
    id: "challenge:python:t1:data-types:3",
    nodeId: "python:t1:data-types",
    type: "write_from_scratch",
    title: "Type Converter",
    description:
      'Write a program that converts the string `"42"` to an integer, adds 8 to it, and prints the result.',
    difficulty: 2,
    isBoss: false,
    starterCode: 'text = "42"\n\n# Convert and add 8, then print\n',
    testCases: [
      {
        id: "dt3-basic",
        input: "",
        expectedOutput: "50",
        visible: true,
        category: "basic",
        description: "42 + 8 = 50",
      },
    ],
    hints: [
      { tier: "nudge", text: "You need to convert the string to a number before adding.", xpPenalty: 0.9 },
      { tier: "guide", text: "Use the int() function to convert a string to an integer.", xpPenalty: 0.75 },
      { tier: "reveal", text: "print(int(text) + 8)", xpPenalty: 0.5 },
    ],
    baseXP: 150,
    tags: ["data-types", "type-conversion", "int", "str"],
  },
  {
    id: "challenge:python:t1:data-types:4",
    nodeId: "python:t1:data-types",
    type: "bug_fix",
    title: "Boolean Confusion",
    description:
      'This program should print `True` if the score is above 50. Fix the bug.\n\n```python\nscore = 75\npassed = score > 50\nprint(passed())\n```',
    difficulty: 3,
    isBoss: true,
    starterCode: 'score = 75\npassed = score > 50\nprint(passed())\n',
    testCases: [
      {
        id: "dt4-basic",
        input: "",
        expectedOutput: "True",
        visible: true,
        category: "basic",
        description: "75 > 50 is True",
      },
    ],
    hints: [
      { tier: "nudge", text: "`passed` is a bool, not a function. Should you call it?", xpPenalty: 0.9 },
      { tier: "guide", text: "Remove the parentheses — `passed` is a value, not callable.", xpPenalty: 0.75 },
      { tier: "reveal", text: "Change `print(passed())` to `print(passed)`.", xpPenalty: 0.5 },
    ],
    baseXP: 250,
    tags: ["data-types", "bool", "debugging", "callable"],
  },

  // ────────────────────────────────────────────────────────────
  // python:t1:strings  (4 challenges)
  // ────────────────────────────────────────────────────────────
  {
    id: "challenge:python:t1:strings:1",
    nodeId: "python:t1:strings",
    type: "fill_in_the_blank",
    title: "String Indexing",
    description:
      'Fill in the blank to print the first character of the string `"Python"`.',
    difficulty: 1,
    isBoss: false,
    templateCode: 'word = "Python"\nprint(word[__BLANK__])',
    testCases: [
      {
        id: "str1-basic",
        input: "",
        expectedOutput: "P",
        visible: true,
        category: "basic",
        description: "First character is P",
      },
    ],
    hints: [
      { tier: "nudge", text: "String indices start at a specific number.", xpPenalty: 0.9 },
      { tier: "guide", text: "Python uses zero-based indexing.", xpPenalty: 0.75 },
      { tier: "reveal", text: "Fill in: 0", xpPenalty: 0.5 },
    ],
    baseXP: 100,
    tags: ["strings", "indexing"],
  },
  {
    id: "challenge:python:t1:strings:2",
    nodeId: "python:t1:strings",
    type: "write_from_scratch",
    title: "Reverse a String",
    description:
      'Write a program that reverses the string `"Hello"` and prints the result.',
    difficulty: 2,
    isBoss: false,
    starterCode: 'text = "Hello"\n\n# Reverse and print\n',
    testCases: [
      {
        id: "str2-basic",
        input: "",
        expectedOutput: "olleH",
        visible: true,
        category: "basic",
        description: "Hello reversed is olleH",
      },
    ],
    hints: [
      { tier: "nudge", text: "Slicing can do more than extract substrings...", xpPenalty: 0.9 },
      { tier: "guide", text: "Use a slice with a negative step to reverse.", xpPenalty: 0.75 },
      { tier: "reveal", text: "print(text[::-1])", xpPenalty: 0.5 },
    ],
    baseXP: 150,
    tags: ["strings", "slicing", "reverse"],
  },
  {
    id: "challenge:python:t1:strings:3",
    nodeId: "python:t1:strings",
    type: "predict_output",
    title: "Slice Notation",
    description:
      'What does this code print?\n\n```python\ns = "abcdefgh"\nprint(s[2:6])\n```',
    difficulty: 2,
    isBoss: false,
    testCases: [
      {
        id: "str3-basic",
        input: "",
        expectedOutput: "cdef",
        visible: true,
        category: "basic",
        description: "s[2:6] gives characters at indices 2, 3, 4, 5",
      },
    ],
    hints: [
      { tier: "nudge", text: "The slice s[start:end] includes start but excludes end.", xpPenalty: 0.9 },
      { tier: "guide", text: "Index 2 is 'c' and we go up to but not including index 6.", xpPenalty: 0.75 },
      { tier: "reveal", text: "s[2:6] gives 'cdef' — indices 2, 3, 4, 5.", xpPenalty: 0.5 },
    ],
    baseXP: 150,
    tags: ["strings", "slicing"],
  },
  {
    id: "challenge:python:t1:strings:4",
    nodeId: "python:t1:strings",
    type: "write_from_scratch",
    title: "F-String Formatter",
    description:
      'Given variables `name = "Alice"` and `age = 30`, use an f-string to print:\n`Alice is 30 years old`',
    difficulty: 3,
    isBoss: true,
    starterCode: 'name = "Alice"\nage = 30\n\n# Use an f-string to print the message\n',
    testCases: [
      {
        id: "str4-basic",
        input: "",
        expectedOutput: "Alice is 30 years old",
        visible: true,
        category: "basic",
        description: "Formatted output with name and age",
      },
      {
        id: "str4-edge",
        input: "",
        expectedOutput: "Alice is 30 years old",
        visible: false,
        category: "edge",
        description: "Must use exact format",
      },
    ],
    hints: [
      { tier: "nudge", text: "F-strings start with `f` before the quote and use curly braces.", xpPenalty: 0.9 },
      { tier: "guide", text: "Put variable names inside {braces} within an f-string.", xpPenalty: 0.75 },
      { tier: "reveal", text: 'print(f"{name} is {age} years old")', xpPenalty: 0.5 },
    ],
    baseXP: 250,
    tags: ["strings", "f-strings", "formatting"],
  },

  // ────────────────────────────────────────────────────────────
  // python:t1:operators  (3 challenges)
  // ────────────────────────────────────────────────────────────
  {
    id: "challenge:python:t1:operators:1",
    nodeId: "python:t1:operators",
    type: "predict_output",
    title: "Floor Division & Modulo",
    description:
      "What does this code print?\n\n```python\nprint(17 // 5)\nprint(17 % 5)\n```",
    difficulty: 1,
    isBoss: false,
    testCases: [
      {
        id: "op1-basic",
        input: "",
        expectedOutput: "3\n2",
        visible: true,
        category: "basic",
        description: "17 // 5 = 3, 17 % 5 = 2",
      },
    ],
    hints: [
      { tier: "nudge", text: "`//` and `%` are related to division in different ways.", xpPenalty: 0.9 },
      { tier: "guide", text: "`//` is floor division (quotient), `%` is modulo (remainder).", xpPenalty: 0.75 },
      { tier: "reveal", text: "17 divided by 5 is 3 remainder 2. So 17//5 = 3, 17%5 = 2.", xpPenalty: 0.5 },
    ],
    baseXP: 100,
    tags: ["operators", "floor-division", "modulo"],
  },
  {
    id: "challenge:python:t1:operators:2",
    nodeId: "python:t1:operators",
    type: "write_from_scratch",
    title: "Even or Odd",
    description:
      "Given a variable `num`, print `Even` if it is even, or `Odd` if it is odd. Use the modulo operator.",
    difficulty: 2,
    isBoss: false,
    starterCode: "num = 7\n\n# Print Even or Odd\n",
    testCases: [
      {
        id: "op2-odd",
        input: "",
        expectedOutput: "Odd",
        visible: true,
        category: "basic",
        description: "7 is odd",
      },
    ],
    hints: [
      { tier: "nudge", text: "Think about what operator gives you the remainder after division.", xpPenalty: 0.9 },
      { tier: "guide", text: "Use `%` to check divisibility by 2. A remainder of 0 means even.", xpPenalty: 0.75 },
      { tier: "reveal", text: 'Use: if num % 2 == 0: print("Even") else: print("Odd")', xpPenalty: 0.5 },
    ],
    baseXP: 150,
    tags: ["operators", "modulo", "conditionals"],
  },
  {
    id: "challenge:python:t1:operators:3",
    nodeId: "python:t1:operators",
    type: "bug_fix",
    title: "Operator Precedence Trap",
    description:
      'This program should check if a number is between 1 and 10 (inclusive). Fix the bug.\n\n```python\nnum = 5\nresult = 1 <= num and num <= 10\nprint(result)\n```\n\nActual buggy code uses `or` instead of `and`:',
    difficulty: 3,
    isBoss: true,
    starterCode: 'num = 15\nresult = 1 <= num or num <= 10\nprint(result)\n',
    testCases: [
      {
        id: "op3-basic",
        input: "",
        expectedOutput: "False",
        visible: true,
        category: "basic",
        description: "15 is not between 1 and 10",
      },
    ],
    hints: [
      { tier: "nudge", text: "Think about whether both conditions need to be true, or just one.", xpPenalty: 0.9 },
      { tier: "guide", text: "For a range check, both conditions must hold — use `and`, not `or`.", xpPenalty: 0.75 },
      { tier: "reveal", text: "Change `or` to `and`: result = 1 <= num and num <= 10", xpPenalty: 0.5 },
    ],
    baseXP: 250,
    tags: ["operators", "logical-operators", "debugging", "range-check"],
  },

  // ────────────────────────────────────────────────────────────
  // python:t1:input-output  (3 challenges)
  // ────────────────────────────────────────────────────────────
  {
    id: "challenge:python:t1:input-output:1",
    nodeId: "python:t1:input-output",
    type: "fill_in_the_blank",
    title: "Read and Greet",
    description:
      "Fill in the blanks to read a user's name and print a greeting.",
    difficulty: 1,
    isBoss: false,
    templateCode: 'name = __BLANK__("Enter your name: ")\nprint(f"Hello, {name}!")',
    testCases: [
      {
        id: "io1-basic",
        input: "Alice",
        expectedOutput: "Hello, Alice!",
        visible: true,
        category: "basic",
        description: "Should greet the user by name",
      },
    ],
    hints: [
      { tier: "nudge", text: "Python has a built-in function for reading text from the user.", xpPenalty: 0.9 },
      { tier: "guide", text: "The input() function reads a line of text from stdin.", xpPenalty: 0.75 },
      { tier: "reveal", text: "Fill in: input", xpPenalty: 0.5 },
    ],
    baseXP: 100,
    tags: ["input", "output", "f-strings"],
  },
  {
    id: "challenge:python:t1:input-output:2",
    nodeId: "python:t1:input-output",
    type: "write_from_scratch",
    title: "Sum Two Inputs",
    description:
      "Read two numbers from the user (one per line), add them, and print the sum. Remember that `input()` returns a string!",
    difficulty: 2,
    isBoss: false,
    starterCode: "# Read two numbers and print their sum\n",
    testCases: [
      {
        id: "io2-basic",
        input: "3\n7",
        expectedOutput: "10",
        visible: true,
        category: "basic",
        description: "3 + 7 = 10",
      },
      {
        id: "io2-edge",
        input: "0\n0",
        expectedOutput: "0",
        visible: false,
        category: "edge",
        description: "0 + 0 = 0",
      },
    ],
    hints: [
      { tier: "nudge", text: "input() always returns a string — you need to convert.", xpPenalty: 0.9 },
      { tier: "guide", text: "Wrap input() with int() to convert: int(input())", xpPenalty: 0.75 },
      { tier: "reveal", text: 'a = int(input())\nb = int(input())\nprint(a + b)', xpPenalty: 0.5 },
    ],
    baseXP: 150,
    tags: ["input", "type-conversion", "arithmetic"],
  },
  {
    id: "challenge:python:t1:input-output:3",
    nodeId: "python:t1:input-output",
    type: "write_from_scratch",
    title: "Custom Separator",
    description:
      "Print the numbers 1, 2, and 3 on one line separated by dashes. Expected output: `1-2-3`\n\nUse print()'s `sep` parameter.",
    difficulty: 3,
    isBoss: true,
    starterCode: "# Print 1-2-3 using print's sep parameter\n",
    testCases: [
      {
        id: "io3-basic",
        input: "",
        expectedOutput: "1-2-3",
        visible: true,
        category: "basic",
        description: "Numbers separated by dashes",
      },
    ],
    hints: [
      { tier: "nudge", text: "print() can take multiple arguments and a separator.", xpPenalty: 0.9 },
      { tier: "guide", text: "The `sep` parameter controls what goes between arguments.", xpPenalty: 0.75 },
      { tier: "reveal", text: 'print(1, 2, 3, sep="-")', xpPenalty: 0.5 },
    ],
    baseXP: 250,
    tags: ["print", "sep-parameter", "formatting"],
  },

  // ────────────────────────────────────────────────────────────
  // python:t1:comments  (3 challenges)
  // ────────────────────────────────────────────────────────────
  {
    id: "challenge:python:t1:comments:1",
    nodeId: "python:t1:comments",
    type: "multiple_choice",
    title: "Comment Syntax",
    description: "Which of the following is a valid single-line comment in Python?",
    difficulty: 1,
    isBoss: false,
    options: [
      { id: "a", text: "# This is a comment", isCorrect: true, explanation: "The # symbol starts a single-line comment in Python." },
      { id: "b", text: "// This is a comment", isCorrect: false, explanation: "// is used in C, Java, and JavaScript, not Python." },
      { id: "c", text: "/* This is a comment */", isCorrect: false, explanation: "This is C-style block comment syntax, not valid in Python." },
      { id: "d", text: "-- This is a comment", isCorrect: false, explanation: "-- is used in SQL and Lua, not Python." },
    ],
    hints: [
      { tier: "nudge", text: "Python uses a special character to start comments.", xpPenalty: 0.9 },
      { tier: "guide", text: "Look for the hash/pound symbol.", xpPenalty: 0.75 },
      { tier: "reveal", text: "Python comments start with # (hash).", xpPenalty: 0.5 },
    ],
    baseXP: 100,
    tags: ["comments", "syntax"],
  },
  {
    id: "challenge:python:t1:comments:2",
    nodeId: "python:t1:comments",
    type: "multiple_choice",
    title: "PEP 8 Naming",
    description: "According to PEP 8, which naming convention should you use for regular variables and functions?",
    difficulty: 2,
    isBoss: false,
    options: [
      { id: "a", text: "snake_case", isCorrect: true, explanation: "PEP 8 recommends snake_case for variables and functions." },
      { id: "b", text: "camelCase", isCorrect: false, explanation: "camelCase is common in JavaScript/Java, not idiomatic Python." },
      { id: "c", text: "PascalCase", isCorrect: false, explanation: "PascalCase is reserved for class names in PEP 8." },
      { id: "d", text: "UPPER_CASE", isCorrect: false, explanation: "UPPER_CASE is used for constants in PEP 8." },
    ],
    hints: [
      { tier: "nudge", text: "Think about Python's style guide and what looks most Pythonic.", xpPenalty: 0.9 },
      { tier: "guide", text: "Python prefers lowercase words separated by underscores.", xpPenalty: 0.75 },
      { tier: "reveal", text: "PEP 8 says: use snake_case for variables and functions.", xpPenalty: 0.5 },
    ],
    baseXP: 150,
    tags: ["comments", "pep8", "naming-conventions"],
  },
  {
    id: "challenge:python:t1:comments:3",
    nodeId: "python:t1:comments",
    type: "refactor",
    title: "Add Docstring and Comments",
    description:
      "Refactor this function to include a proper docstring and inline comments. The function calculates the area of a rectangle.",
    difficulty: 2,
    isBoss: true,
    starterCode:
      'def f(w, h):\n    return w * h\n\nprint(f(5, 3))\n',
    testCases: [
      {
        id: "com3-basic",
        input: "",
        expectedOutput: "15",
        visible: true,
        category: "basic",
        description: "Function should still compute 5 * 3 = 15",
      },
    ],
    hints: [
      { tier: "nudge", text: "A docstring goes right after the def line, in triple quotes.", xpPenalty: 0.9 },
      { tier: "guide", text: 'Use """...""" to add a docstring describing the function purpose and parameters.', xpPenalty: 0.75 },
      { tier: "reveal", text: 'Add a docstring like: """Calculate the area of a rectangle.""" and rename f to area.', xpPenalty: 0.5 },
    ],
    baseXP: 150,
    tags: ["comments", "docstrings", "refactoring", "pep8"],
  },
];
