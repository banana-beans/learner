// ============================================================
// Learner Platform — Python Tier 1 Lesson Content
// Mapped by nodeId to structured lesson data
// ============================================================

export interface LessonSection {
  heading: string;
  body: string;
}

export interface CodeExample {
  title: string;
  code: string;
  explanation: string;
}

export interface LessonContent {
  nodeId: string;
  title: string;
  sections: LessonSection[];
  codeExamples: CodeExample[];
  keyTakeaways: string[];
}

export const pythonBasicsLessons: Record<string, LessonContent> = {
  "python:t1:hello-world": {
    nodeId: "python:t1:hello-world",
    title: "Hello, World!",
    sections: [
      {
        heading: "Your First Python Program",
        body: "Every programming journey begins with a simple greeting to the world. In Python, you can display text on the screen using the built-in print() function. Unlike many other languages, Python doesn't require semicolons, curly braces, or boilerplate code — just write what you mean.",
      },
      {
        heading: "Running Python Code",
        body: "You can run Python in two main ways: the REPL (Read-Eval-Print Loop) for interactive experimentation, or as a saved script file (.py). The REPL lets you type a line and see the result immediately — perfect for testing small ideas. Script files are used for complete programs you want to save and run again.",
      },
      {
        heading: "The print() Function",
        body: "print() is a built-in function that outputs text to the console. You pass it a string — text wrapped in single or double quotes — and it displays that text followed by a newline. You can print multiple values by separating them with commas, and Python will insert a space between them automatically.",
      },
    ],
    codeExamples: [
      {
        title: "Basic print statement",
        code: `print("Hello, World!")`,
        explanation: "The simplest Python program. The string 'Hello, World!' is passed to print(), which outputs it to the console.",
      },
      {
        title: "Printing multiple values",
        code: `print("Hello", "Python", "learner!")
print("Year:", 2024)`,
        explanation: "Commas between arguments insert a space. You can mix strings and numbers — Python handles the conversion.",
      },
      {
        title: "Using the REPL",
        code: `>>> 2 + 2
4
>>> print("I'm learning Python!")
I'm learning Python!`,
        explanation: "In the REPL, expressions auto-print their value. The >>> prompt means Python is ready for input.",
      },
    ],
    keyTakeaways: [
      "print() outputs text and values to the console",
      "Python strings use single or double quotes — both work",
      "The REPL lets you experiment interactively without saving a file",
      "No semicolons or braces required — Python uses indentation and newlines",
      "Commas in print() separate values with a space by default",
    ],
  },

  "python:t1:variables": {
    nodeId: "python:t1:variables",
    title: "Variables & Assignment",
    sections: [
      {
        heading: "What Is a Variable?",
        body: "A variable is a named container that stores a value in memory. Think of it as a label you stick on a piece of data. In Python, you create a variable simply by assigning a value to a name using the = operator. There's no need to declare the type first — Python figures it out automatically.",
      },
      {
        heading: "Dynamic Typing",
        body: "Python is dynamically typed, which means a variable's type is determined by the value you assign to it — not declared upfront. You can even reassign a variable to a completely different type later. This flexibility is powerful but requires care: always know what type you're working with.",
      },
      {
        heading: "Naming Rules and Conventions",
        body: "Variable names must start with a letter or underscore, can contain letters, digits, and underscores, and are case-sensitive (age and Age are different variables). By convention, Python uses snake_case for variable names (words separated by underscores). Avoid reserved keywords like if, for, while, class, etc.",
      },
    ],
    codeExamples: [
      {
        title: "Basic variable assignment",
        code: `name = "Alice"
age = 30
height = 5.7
is_student = True`,
        explanation: "Each line creates a variable and assigns a value. Python infers the type from the value.",
      },
      {
        title: "Checking types with type()",
        code: `score = 95
print(type(score))   # <class 'int'>

score = 95.5
print(type(score))   # <class 'float'>`,
        explanation: "type() returns the type of any value. Notice score changed type when reassigned — that's dynamic typing.",
      },
      {
        title: "Multiple assignment",
        code: `x = y = z = 0
a, b, c = 1, 2, 3
print(a, b, c)  # 1 2 3`,
        explanation: "Python supports assigning the same value to multiple variables at once, and unpacking multiple values in a single line.",
      },
    ],
    keyTakeaways: [
      "Variables are created with the = operator — no declaration needed",
      "Python is dynamically typed: the type is set by the value, not the name",
      "Use snake_case for variable names (e.g., user_name, total_score)",
      "Variable names are case-sensitive: count and Count are different",
      "type() tells you what type a variable currently holds",
    ],
  },

  "python:t1:data-types": {
    nodeId: "python:t1:data-types",
    title: "Primitive Data Types",
    sections: [
      {
        heading: "The Four Primitives",
        body: "Python has four primitive (built-in) data types you'll use constantly: int (whole numbers), float (decimal numbers), str (text), and bool (True or False). Everything in Python is an object, but these four are the foundation of almost all data.",
      },
      {
        heading: "Integers and Floats",
        body: "Integers (int) are whole numbers with no decimal point — positive, negative, or zero. Floats (float) have a decimal point and can represent fractional values. Be careful with float arithmetic: computers represent decimals in binary, which can cause tiny rounding errors like 0.1 + 0.2 equaling 0.30000000000000004.",
      },
      {
        heading: "Booleans",
        body: "A bool has exactly two values: True and False (capitalized). Booleans are the result of comparisons and logical operations. Interestingly, in Python, bool is a subclass of int — True equals 1 and False equals 0, which means you can do arithmetic with them (though you rarely should).",
      },
    ],
    codeExamples: [
      {
        title: "The four primitive types",
        code: `count = 42          # int
price = 19.99       # float
greeting = "Hi!"    # str
active = True       # bool

print(isinstance(count, int))   # True
print(isinstance(price, float)) # True`,
        explanation: "isinstance() checks if a value is an instance of a given type — more robust than type() for inheritance.",
      },
      {
        title: "Type coercion",
        code: `x = int("42")       # str -> int: 42
y = float(7)        # int -> float: 7.0
z = str(100)        # int -> str: "100"
b = bool(0)         # int -> bool: False
b2 = bool("hello")  # non-empty str -> True`,
        explanation: "You can convert between types using constructor functions. Empty strings, 0, and None all convert to False.",
      },
      {
        title: "Float precision quirk",
        code: `print(0.1 + 0.2)         # 0.30000000000000004
print(round(0.1 + 0.2, 2)) # 0.3`,
        explanation: "Floating-point representation in binary causes tiny errors. Use round() when you need exact decimal places.",
      },
    ],
    keyTakeaways: [
      "int for whole numbers, float for decimals, str for text, bool for True/False",
      "Use int(), float(), str(), bool() to convert between types",
      "isinstance(value, Type) checks the type safely, accounting for inheritance",
      "bool is a subclass of int: True == 1, False == 0",
      "Float arithmetic can have tiny precision errors — use round() when needed",
    ],
  },

  "python:t1:strings": {
    nodeId: "python:t1:strings",
    title: "String Fundamentals",
    sections: [
      {
        heading: "Strings as Sequences",
        body: "A string is an ordered sequence of characters. Because it's a sequence, you can access individual characters by their index (position), starting from 0. You can also access characters from the end using negative indices: -1 is the last character, -2 is second-to-last, and so on.",
      },
      {
        heading: "Slicing",
        body: "Slicing lets you extract a portion of a string using the syntax string[start:stop:step]. The start index is inclusive, stop is exclusive, and step defaults to 1. Omitting start defaults to 0 (beginning), omitting stop defaults to the end. Slices never raise an error even if indices are out of range.",
      },
      {
        heading: "Essential String Methods",
        body: "Python strings come with dozens of built-in methods. The most commonly used are: upper()/lower() for case, strip() to remove whitespace, split() to divide into a list, join() to combine a list into a string, replace() to swap substrings, and find()/index() to locate substrings. Strings are immutable — methods return new strings, they don't modify in place.",
      },
      {
        heading: "f-Strings (Formatted String Literals)",
        body: "Introduced in Python 3.6, f-strings are the modern way to embed expressions inside strings. Prefix the string with f and wrap any Python expression in curly braces {}. The expression is evaluated at runtime and converted to a string. F-strings are faster, more readable, and more powerful than older % or .format() approaches.",
      },
    ],
    codeExamples: [
      {
        title: "Indexing and slicing",
        code: `word = "Python"
print(word[0])      # P
print(word[-1])     # n
print(word[0:3])    # Pyt
print(word[::2])    # Pto (every 2nd char)
print(word[::-1])   # nohtyP (reversed)`,
        explanation: "String indices start at 0. Negative indices count from the end. [start:stop:step] is the full slice syntax.",
      },
      {
        title: "Common string methods",
        code: `s = "  Hello, World!  "
print(s.strip())            # "Hello, World!"
print(s.strip().lower())    # "hello, world!"
print(s.strip().split(", ")) # ["Hello", "World!"]

words = ["one", "two", "three"]
print(", ".join(words))     # "one, two, three"`,
        explanation: "Methods can be chained. strip() removes leading/trailing whitespace, split() breaks on a delimiter, join() is the inverse.",
      },
      {
        title: "f-strings",
        code: `name = "Alice"
score = 95
print(f"Player {name} scored {score} points!")
print(f"Score doubled: {score * 2}")
print(f"Pi ≈ {3.14159:.2f}")  # format to 2 decimal places`,
        explanation: "f-strings evaluate Python expressions inside {}. You can include format specs with a colon, like :.2f for two decimal places.",
      },
    ],
    keyTakeaways: [
      "Strings are zero-indexed sequences — word[0] is the first character",
      "Negative indices count from the end: word[-1] is the last character",
      "Slices use [start:stop:step] — start inclusive, stop exclusive",
      "Strings are immutable — methods return new strings, never modify in place",
      "f-strings (f\"...\") embed expressions directly — the modern formatting choice",
      "len() returns the number of characters in a string",
    ],
  },

  "python:t1:operators": {
    nodeId: "python:t1:operators",
    title: "Operators & Expressions",
    sections: [
      {
        heading: "Arithmetic Operators",
        body: "Python supports all standard arithmetic: + (add), - (subtract), * (multiply), / (divide — always returns float), // (floor division — rounds down to integer), % (modulo — remainder), and ** (exponentiation). Understanding the difference between / and // is crucial: 7/2 gives 3.5, while 7//2 gives 3.",
      },
      {
        heading: "Comparison Operators",
        body: "Comparison operators compare two values and return a boolean. They are: == (equal), != (not equal), < (less than), > (greater than), <= (less than or equal), >= (greater than or equal). Note: == tests equality, = is assignment. Mixing them up is one of the most common beginner errors.",
      },
      {
        heading: "Logical Operators",
        body: "Logical operators combine boolean expressions: and returns True only if both sides are True; or returns True if at least one side is True; not inverts a boolean. Python uses short-circuit evaluation: in and, if the left side is False, the right side is never evaluated; in or, if the left is True, the right is skipped.",
      },
    ],
    codeExamples: [
      {
        title: "Arithmetic operators",
        code: `print(10 / 3)    # 3.3333... (true division)
print(10 // 3)   # 3 (floor division)
print(10 % 3)    # 1 (remainder)
print(2 ** 8)    # 256 (2 to the power of 8)`,
        explanation: "/ always returns float. // rounds toward negative infinity. % gives the remainder. ** is exponentiation.",
      },
      {
        title: "Comparison operators",
        code: `x = 10
print(x == 10)   # True
print(x != 5)    # True
print(x > 5)     # True
print(x <= 10)   # True

# Chaining comparisons (Pythonic!)
print(1 < x < 20)  # True`,
        explanation: "Python allows chaining comparisons like 1 < x < 20, which reads naturally and is more concise than x > 1 and x < 20.",
      },
      {
        title: "Logical operators",
        code: `age = 25
has_id = True

if age >= 18 and has_id:
    print("Access granted")

print(not False)        # True
print(True or False)    # True`,
        explanation: "and/or/not combine boolean conditions. Short-circuit evaluation means unnecessary checks are skipped.",
      },
    ],
    keyTakeaways: [
      "/ always returns a float; use // for integer (floor) division",
      "% gives the remainder — useful for checking odd/even, cycling through values",
      "** is exponentiation: 2**10 is 1024",
      "== tests equality; = assigns a value — don't mix them up",
      "Python supports chained comparisons: 0 <= x < 100",
      "and/or use short-circuit evaluation for efficiency",
    ],
  },

  "python:t1:input-output": {
    nodeId: "python:t1:input-output",
    title: "Input & Output",
    sections: [
      {
        heading: "Reading Input with input()",
        body: "The input() function pauses program execution, displays an optional prompt string, waits for the user to type something and press Enter, then returns what they typed as a string. This is critical: input() always returns a string. If you want a number, you must convert it explicitly with int() or float().",
      },
      {
        heading: "Formatting Output with print()",
        body: "You've already used print() to show simple values. But it has powerful optional parameters: sep controls the separator between multiple arguments (default is a space), end controls what's printed at the end (default is a newline '\\n'). You can also use f-strings, .format(), or % formatting for richer output control.",
      },
      {
        heading: "Type Casting User Input",
        body: "Since input() returns a string, mixing it directly with numbers causes a TypeError. You must cast: int(input(...)) for whole numbers, float(input(...)) for decimals. It's good practice to wrap input conversion in a try/except block to handle invalid input gracefully, though we'll cover error handling in a later lesson.",
      },
    ],
    codeExamples: [
      {
        title: "Basic input and output",
        code: `name = input("What is your name? ")
print("Hello,", name + "!")`,
        explanation: "input() returns a string. Here we print it using comma (adds a space) and concatenation (+, no space).",
      },
      {
        title: "Type casting input",
        code: `age = int(input("Enter your age: "))
height = float(input("Enter height in meters: "))
print(f"In 10 years you'll be {age + 10}")
print(f"Height in cm: {height * 100:.1f}")`,
        explanation: "Wrap input() in int() or float() to convert immediately. Without this, age + 10 would fail with a TypeError.",
      },
      {
        title: "print() sep and end parameters",
        code: `print("one", "two", "three", sep="-")
# one-two-three

print("Loading", end="")
print("...", end="\\n")
# Loading...`,
        explanation: "sep changes the separator between arguments. end changes what's appended after all arguments (default newline).",
      },
    ],
    keyTakeaways: [
      "input() always returns a string — convert with int() or float() as needed",
      "input() takes an optional prompt string displayed before waiting for input",
      "print(a, b, sep='-') changes the separator between printed values",
      "print('text', end='') suppresses the trailing newline",
      "Never concatenate a string and a number directly — convert first",
    ],
  },

  "python:t1:comments": {
    nodeId: "python:t1:comments",
    title: "Comments & Code Style",
    sections: [
      {
        heading: "Why Comments Matter",
        body: "Comments are notes you write in your code for humans — Python ignores them entirely. Good comments explain why code does something, not what it does (the code itself shows what). Over-commenting obvious things adds noise; under-commenting complex logic leaves maintainers (including future you) confused.",
      },
      {
        heading: "Single-Line and Multi-Line Comments",
        body: "In Python, # starts a single-line comment — everything from # to the end of the line is ignored. Python has no dedicated multi-line comment syntax, but triple-quoted strings (\"\"\"...\"\"\") placed at the start of a function, class, or module serve as docstrings — both documentation and an implicit comment. Docstrings are accessible at runtime via the __doc__ attribute.",
      },
      {
        heading: "PEP 8: Python's Style Guide",
        body: "PEP 8 is Python's official style guide. Key rules: use 4 spaces for indentation (not tabs), keep lines under 79 characters, use snake_case for variables and functions, use PascalCase for class names, put two blank lines between top-level definitions, and one blank line between methods. Consistent style makes code readable by any Python developer.",
      },
    ],
    codeExamples: [
      {
        title: "Single-line comments",
        code: `# Calculate the area of a circle
radius = 5
area = 3.14159 * radius ** 2  # pi * r^2

# TODO: use math.pi for better precision`,
        explanation: "# comments explain why or flag things to do. Inline comments (after code) should be brief. Avoid restating the obvious.",
      },
      {
        title: "Docstrings",
        code: `def greet(name):
    """Return a personalized greeting string."""
    return f"Hello, {name}!"

# Access the docstring
print(greet.__doc__)  # Return a personalized greeting string.`,
        explanation: "Docstrings use triple quotes and document functions/classes. They're the Python standard for self-documenting code.",
      },
      {
        title: "PEP 8 style examples",
        code: `# Good: snake_case, spaces around operators
user_name = "Alice"
total_score = 95 + 5

# Good: 4-space indentation
def calculate_bmi(weight_kg, height_m):
    return weight_kg / height_m ** 2

# Avoid: camelCase, cramped code
userName="Alice"; totalScore=95+5`,
        explanation: "Consistent style matters as much as correct code. snake_case, 4 spaces, and spaces around operators are PEP 8 standards.",
      },
    ],
    keyTakeaways: [
      "# starts a single-line comment — Python ignores everything after it on that line",
      "Triple-quoted strings (\"\"\"...\"\"\") are docstrings for functions, classes, and modules",
      "Comment the why, not the what — the code shows what; comments explain reasoning",
      "PEP 8: 4-space indentation, snake_case names, lines under 79 chars",
      "Consistent style makes your code readable by any Python developer",
    ],
  },
};
