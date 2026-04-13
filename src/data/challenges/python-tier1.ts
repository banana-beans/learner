// ============================================================
// Learner Platform — Python Tier 1 Challenge Data
// 1-2 challenges per node, 14 total
// ============================================================

import type { Challenge } from "@/lib/types";

export const pythonTier1Challenges: Challenge[] = [
  // ── hello-world ──────────────────────────────────────────

  {
    id: "py-t1-hw-1",
    nodeId: "python:t1:hello-world",
    type: "write_from_scratch",
    title: "Greet the World",
    description:
      "Write a Python program that prints exactly: `Hello, World!`\n\nMake sure the capitalization, comma, and exclamation mark match exactly.",
    difficulty: 1,
    isBoss: false,
    starterCode: "# Write your code below\n",
    testCases: [
      {
        id: "py-t1-hw-1-tc1",
        input: "",
        expectedOutput: "Hello, World!",
        visible: true,
        category: "basic",
        description: "Output matches exactly",
      },
    ],
    hints: [
      {
        tier: "nudge",
        text: "Python has a built-in function for displaying text. It's the first function most Python learners ever use.",
        xpPenalty: 0.9,
      },
      {
        tier: "guide",
        text: "Use print() and pass the string as an argument: print(\"...\"). Make sure your capitalization matches exactly.",
        xpPenalty: 0.75,
      },
      {
        tier: "reveal",
        text: 'print("Hello, World!")',
        xpPenalty: 0.5,
      },
    ],
    baseXP: 100,
    tags: ["print", "strings", "output"],
  },

  {
    id: "py-t1-hw-2",
    nodeId: "python:t1:hello-world",
    type: "write_from_scratch",
    title: "Personal Introduction",
    description:
      "Write a program that prints your name on the first line and your age on the second line.\n\nExample output (with name Alice, age 20):\n```\nAlice\n20\n```",
    difficulty: 1,
    isBoss: false,
    starterCode: "# Print your name, then your age on separate lines\n",
    testCases: [
      {
        id: "py-t1-hw-2-tc1",
        input: "",
        expectedOutput: "Alice\n20",
        visible: true,
        category: "basic",
        description: "Two separate print calls",
      },
    ],
    hints: [
      {
        tier: "nudge",
        text: "Each call to print() automatically adds a newline at the end. Think about how many print() calls you need.",
        xpPenalty: 0.9,
      },
      {
        tier: "guide",
        text: 'Call print() twice — once for the name, once for the age. Numbers don\'t need quotes: print(20) not print("20").',
        xpPenalty: 0.75,
      },
      {
        tier: "reveal",
        text: 'print("Alice")\nprint(20)',
        xpPenalty: 0.5,
      },
    ],
    baseXP: 100,
    tags: ["print", "output", "multiple-lines"],
  },

  // ── variables ────────────────────────────────────────────

  {
    id: "py-t1-var-1",
    nodeId: "python:t1:variables",
    type: "fill_in_the_blank",
    title: "Swap Two Variables",
    description:
      "Complete the code to swap the values of `a` and `b` without using a third variable.\n\nAfter your code, `a` should be 20 and `b` should be 10.",
    difficulty: 1,
    isBoss: false,
    templateCode: "a = 10\nb = 20\n\n# Swap a and b\n__BLANK__\n\nprint(a)  # should print 20\nprint(b)  # should print 10",
    starterCode: "a = 10\nb = 20\n\n# Swap a and b\n# Your code here\n\nprint(a)  # should print 20\nprint(b)  # should print 10",
    testCases: [
      {
        id: "py-t1-var-1-tc1",
        input: "",
        expectedOutput: "20\n10",
        visible: true,
        category: "basic",
        description: "a is 20, b is 10 after swap",
      },
    ],
    hints: [
      {
        tier: "nudge",
        text: "Python allows you to assign multiple values at once in a single line. Think about tuple unpacking.",
        xpPenalty: 0.9,
      },
      {
        tier: "guide",
        text: "Python supports simultaneous assignment: a, b = b, a evaluates the right side first, then assigns.",
        xpPenalty: 0.75,
      },
      {
        tier: "reveal",
        text: "a, b = b, a",
        xpPenalty: 0.5,
      },
    ],
    baseXP: 100,
    tags: ["variables", "assignment", "swap"],
  },

  {
    id: "py-t1-var-2",
    nodeId: "python:t1:variables",
    type: "write_from_scratch",
    title: "Area of a Rectangle",
    description:
      "Create variables `width` and `height`, assign them 8 and 5 respectively, calculate the area, and print it.\n\nExpected output: `40`",
    difficulty: 1,
    isBoss: false,
    starterCode: "# Create width and height variables, compute area, print it\n",
    testCases: [
      {
        id: "py-t1-var-2-tc1",
        input: "",
        expectedOutput: "40",
        visible: true,
        category: "basic",
        description: "Correct area output",
      },
    ],
    hints: [
      {
        tier: "nudge",
        text: "Create two variables and multiply them to get the area.",
        xpPenalty: 0.9,
      },
      {
        tier: "guide",
        text: "width = 8, height = 5, area = width * height, then print(area).",
        xpPenalty: 0.75,
      },
      {
        tier: "reveal",
        text: "width = 8\nheight = 5\narea = width * height\nprint(area)",
        xpPenalty: 0.5,
      },
    ],
    baseXP: 100,
    tags: ["variables", "arithmetic", "expressions"],
  },

  // ── data-types ───────────────────────────────────────────

  {
    id: "py-t1-dt-1",
    nodeId: "python:t1:data-types",
    type: "predict_output",
    title: "Type Coercion Quiz",
    description:
      "What does this code print?\n\n```python\nprint(int(3.9))\nprint(bool(\"\"))\nprint(float(True))\n```\n\nEnter the three lines of output, one per line.",
    difficulty: 2,
    isBoss: false,
    starterCode: "# Enter the expected output below as a comment, then replicate it with print statements\nprint(int(3.9))\nprint(bool(\"\"))\nprint(float(True))",
    testCases: [
      {
        id: "py-t1-dt-1-tc1",
        input: "",
        expectedOutput: "3\nFalse\n1.0",
        visible: true,
        category: "basic",
        description: "Correct type coercion results",
      },
    ],
    hints: [
      {
        tier: "nudge",
        text: "int() truncates (doesn't round) floats toward zero. An empty string is falsy. True has an integer value.",
        xpPenalty: 0.9,
      },
      {
        tier: "guide",
        text: "int(3.9) truncates to 3. bool(\"\") is False (empty string is falsy). float(True) is 1.0 because True == 1.",
        xpPenalty: 0.75,
      },
      {
        tier: "reveal",
        text: "3\nFalse\n1.0",
        xpPenalty: 0.5,
      },
    ],
    baseXP: 150,
    tags: ["types", "coercion", "bool", "int", "float"],
  },

  {
    id: "py-t1-dt-2",
    nodeId: "python:t1:data-types",
    type: "bug_fix",
    title: "Fix the Temperature Converter",
    description:
      "This code should convert 100°C to Fahrenheit and print `212.0`, but it has a bug. Fix it.\n\n```python\ncelsius = input()\nfahrenheit = celsius * 9/5 + 32\nprint(fahrenheit)\n```",
    difficulty: 2,
    isBoss: true,
    starterCode: "celsius = 100\nfahrenheit = celsius * 9/5 + 32\nprint(fahrenheit)",
    testCases: [
      {
        id: "py-t1-dt-2-tc1",
        input: "",
        expectedOutput: "212.0",
        visible: true,
        category: "basic",
        description: "100°C = 212°F",
      },
      {
        id: "py-t1-dt-2-tc2",
        input: "",
        expectedOutput: "212.0",
        visible: false,
        category: "edge",
        description: "Correct formula applied",
      },
    ],
    hints: [
      {
        tier: "nudge",
        text: "The original code uses input() which returns a string. What happens when you multiply a string by a number in Python?",
        xpPenalty: 0.9,
      },
      {
        tier: "guide",
        text: "The problem is that celsius should be an integer, not a string from input(). In the fixed version, set celsius = 100 directly as a number.",
        xpPenalty: 0.75,
      },
      {
        tier: "reveal",
        text: "celsius = 100\nfahrenheit = celsius * 9/5 + 32\nprint(fahrenheit)",
        xpPenalty: 0.5,
      },
    ],
    baseXP: 150,
    tags: ["types", "bug-fix", "arithmetic"],
  },

  // ── strings ──────────────────────────────────────────────

  {
    id: "py-t1-str-1",
    nodeId: "python:t1:strings",
    type: "write_from_scratch",
    title: "Reverse a String",
    description:
      "Given the string `word = \"Python\"`, print it reversed using slicing.\n\nExpected output: `nohtyP`",
    difficulty: 2,
    isBoss: false,
    starterCode: "word = \"Python\"\n# Print the word reversed\n",
    testCases: [
      {
        id: "py-t1-str-1-tc1",
        input: "",
        expectedOutput: "nohtyP",
        visible: true,
        category: "basic",
        description: "Reversed string",
      },
    ],
    hints: [
      {
        tier: "nudge",
        text: "Python slices support a step value. What does a negative step do?",
        xpPenalty: 0.9,
      },
      {
        tier: "guide",
        text: "Use a slice with step -1: word[::-1] iterates backwards through the entire string.",
        xpPenalty: 0.75,
      },
      {
        tier: "reveal",
        text: 'word = "Python"\nprint(word[::-1])',
        xpPenalty: 0.5,
      },
    ],
    baseXP: 150,
    tags: ["strings", "slicing", "reverse"],
  },

  {
    id: "py-t1-str-2",
    nodeId: "python:t1:strings",
    type: "write_from_scratch",
    title: "Count Vowels",
    description:
      "Write code that counts the number of vowels (a, e, i, o, u — case-insensitive) in the string `sentence = \"Hello World\"` and prints the count.\n\nExpected output: `3`",
    difficulty: 2,
    isBoss: true,
    starterCode: "sentence = \"Hello World\"\n# Count and print the number of vowels\n",
    testCases: [
      {
        id: "py-t1-str-2-tc1",
        input: "",
        expectedOutput: "3",
        visible: true,
        category: "basic",
        description: "Hello World has 3 vowels: e, o, o",
      },
    ],
    hints: [
      {
        tier: "nudge",
        text: "You need to check each character. Consider converting to lowercase first so you only need to check 5 vowels, not 10.",
        xpPenalty: 0.9,
      },
      {
        tier: "guide",
        text: "Loop through each character, check if it's in the string 'aeiou', and keep a count. Or use sum() with a generator expression.",
        xpPenalty: 0.75,
      },
      {
        tier: "reveal",
        text: 'sentence = "Hello World"\ncount = sum(1 for c in sentence.lower() if c in "aeiou")\nprint(count)',
        xpPenalty: 0.5,
      },
    ],
    baseXP: 150,
    tags: ["strings", "loops", "counting"],
  },

  // ── operators ────────────────────────────────────────────

  {
    id: "py-t1-op-1",
    nodeId: "python:t1:operators",
    type: "write_from_scratch",
    title: "Even or Odd",
    description:
      "Given `n = 17`, print `Even` if n is even, or `Odd` if n is odd.\n\nExpected output: `Odd`",
    difficulty: 1,
    isBoss: false,
    starterCode: "n = 17\n# Print 'Even' or 'Odd'\n",
    testCases: [
      {
        id: "py-t1-op-1-tc1",
        input: "",
        expectedOutput: "Odd",
        visible: true,
        category: "basic",
        description: "17 is odd",
      },
    ],
    hints: [
      {
        tier: "nudge",
        text: "There's an operator that gives the remainder when dividing. If a number divides evenly by 2, what is the remainder?",
        xpPenalty: 0.9,
      },
      {
        tier: "guide",
        text: "Use the modulo operator %: n % 2 == 0 means even, n % 2 != 0 means odd. Use an if/else to print the right label.",
        xpPenalty: 0.75,
      },
      {
        tier: "reveal",
        text: 'n = 17\nif n % 2 == 0:\n    print("Even")\nelse:\n    print("Odd")',
        xpPenalty: 0.5,
      },
    ],
    baseXP: 100,
    tags: ["operators", "modulo", "conditionals"],
  },

  {
    id: "py-t1-op-2",
    nodeId: "python:t1:operators",
    type: "predict_output",
    title: "Operator Precedence",
    description:
      "What does this code print?\n\n```python\nresult = 2 + 3 * 4 - 10 // 3\nprint(result)\n```",
    difficulty: 2,
    isBoss: true,
    starterCode: "result = 2 + 3 * 4 - 10 // 3\nprint(result)",
    testCases: [
      {
        id: "py-t1-op-2-tc1",
        input: "",
        expectedOutput: "11",
        visible: true,
        category: "basic",
        description: "Correct operator precedence result",
      },
    ],
    hints: [
      {
        tier: "nudge",
        text: "Recall PEMDAS/BODMAS: multiplication and division (including //) happen before addition and subtraction.",
        xpPenalty: 0.9,
      },
      {
        tier: "guide",
        text: "Step by step: 3 * 4 = 12, then 10 // 3 = 3, then 2 + 12 - 3 = 11.",
        xpPenalty: 0.75,
      },
      {
        tier: "reveal",
        text: "11",
        xpPenalty: 0.5,
      },
    ],
    baseXP: 150,
    tags: ["operators", "precedence", "arithmetic"],
  },

  // ── input-output ─────────────────────────────────────────

  {
    id: "py-t1-io-1",
    nodeId: "python:t1:input-output",
    type: "write_from_scratch",
    title: "Greeting with Name",
    description:
      "Write a program that reads a name from input and prints a greeting.\n\nIf the input is `Alice`, output should be: `Hello, Alice!`",
    difficulty: 1,
    isBoss: false,
    starterCode: "# Read a name and print a greeting\n",
    testCases: [
      {
        id: "py-t1-io-1-tc1",
        input: "Alice",
        expectedOutput: "Hello, Alice!",
        visible: true,
        category: "basic",
        description: "Greeting with Alice",
      },
      {
        id: "py-t1-io-1-tc2",
        input: "Bob",
        expectedOutput: "Hello, Bob!",
        visible: false,
        category: "basic",
        description: "Greeting with Bob",
      },
    ],
    hints: [
      {
        tier: "nudge",
        text: "Use input() to read the name, then print a greeting. An f-string makes it easy to embed the name in the output.",
        xpPenalty: 0.9,
      },
      {
        tier: "guide",
        text: 'name = input() — no prompt needed for tests. Then print(f"Hello, {name}!") to format the output.',
        xpPenalty: 0.75,
      },
      {
        tier: "reveal",
        text: 'name = input()\nprint(f"Hello, {name}!")',
        xpPenalty: 0.5,
      },
    ],
    baseXP: 100,
    tags: ["input", "output", "f-strings"],
  },

  {
    id: "py-t1-io-2",
    nodeId: "python:t1:input-output",
    type: "write_from_scratch",
    title: "Sum Two Numbers",
    description:
      "Read two integers from separate lines of input and print their sum.\n\nExample: inputs `3` then `7`, output `10`.",
    difficulty: 2,
    isBoss: true,
    starterCode: "# Read two integers and print their sum\n",
    testCases: [
      {
        id: "py-t1-io-2-tc1",
        input: "3\n7",
        expectedOutput: "10",
        visible: true,
        category: "basic",
        description: "3 + 7 = 10",
      },
      {
        id: "py-t1-io-2-tc2",
        input: "100\n200",
        expectedOutput: "300",
        visible: false,
        category: "basic",
        description: "100 + 200 = 300",
      },
      {
        id: "py-t1-io-2-tc3",
        input: "-5\n5",
        expectedOutput: "0",
        visible: false,
        category: "edge",
        description: "Negative + positive = 0",
      },
    ],
    hints: [
      {
        tier: "nudge",
        text: "Call input() twice to read two separate lines. Remember: input() returns a string, not a number.",
        xpPenalty: 0.9,
      },
      {
        tier: "guide",
        text: "a = int(input()) and b = int(input()) — convert each to int before adding. Then print(a + b).",
        xpPenalty: 0.75,
      },
      {
        tier: "reveal",
        text: "a = int(input())\nb = int(input())\nprint(a + b)",
        xpPenalty: 0.5,
      },
    ],
    baseXP: 150,
    tags: ["input", "int conversion", "arithmetic"],
  },

  // ── comments ─────────────────────────────────────────────

  {
    id: "py-t1-cm-1",
    nodeId: "python:t1:comments",
    type: "bug_fix",
    title: "Fix the PEP 8 Violations",
    description:
      "This code works but violates PEP 8 style. Fix the naming and spacing issues so it follows Python conventions.\n\n```python\nfirstName='Alice'\nlastName='Smith'\nfullName=firstName+' '+lastName\nprint(fullName)\n```\n\nExpected output: `Alice Smith`",
    difficulty: 1,
    isBoss: false,
    starterCode: "firstName='Alice'\nlastName='Smith'\nfullName=firstName+' '+lastName\nprint(fullName)",
    testCases: [
      {
        id: "py-t1-cm-1-tc1",
        input: "",
        expectedOutput: "Alice Smith",
        visible: true,
        category: "basic",
        description: "Full name printed correctly",
      },
    ],
    hints: [
      {
        tier: "nudge",
        text: "PEP 8 requires snake_case for variable names and spaces around the = and + operators.",
        xpPenalty: 0.9,
      },
      {
        tier: "guide",
        text: "Rename camelCase variables to snake_case (firstName → first_name) and add spaces around operators.",
        xpPenalty: 0.75,
      },
      {
        tier: "reveal",
        text: "first_name = 'Alice'\nlast_name = 'Smith'\nfull_name = first_name + ' ' + last_name\nprint(full_name)",
        xpPenalty: 0.5,
      },
    ],
    baseXP: 100,
    tags: ["pep8", "style", "naming"],
  },

  {
    id: "py-t1-cm-2",
    nodeId: "python:t1:comments",
    type: "write_from_scratch",
    title: "Document a Function",
    description:
      "Write a function `add(a, b)` that returns `a + b`. Add a docstring that says: `Return the sum of a and b.`\n\nThen call `print(add(3, 4))` — expected output: `7`",
    difficulty: 2,
    isBoss: true,
    starterCode: "# Define add(a, b) with a docstring, then call print(add(3, 4))\n",
    testCases: [
      {
        id: "py-t1-cm-2-tc1",
        input: "",
        expectedOutput: "7",
        visible: true,
        category: "basic",
        description: "add(3, 4) returns 7",
      },
    ],
    hints: [
      {
        tier: "nudge",
        text: "A docstring is a triple-quoted string placed as the first statement inside a function body.",
        xpPenalty: 0.9,
      },
      {
        tier: "guide",
        text: 'Use def add(a, b): then """Return the sum of a and b.""" on the next line, then return a + b.',
        xpPenalty: 0.75,
      },
      {
        tier: "reveal",
        text: 'def add(a, b):\n    """Return the sum of a and b."""\n    return a + b\n\nprint(add(3, 4))',
        xpPenalty: 0.5,
      },
    ],
    baseXP: 150,
    tags: ["docstrings", "functions", "style"],
  },
];
