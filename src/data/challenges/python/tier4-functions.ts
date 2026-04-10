import type { Challenge } from "@/lib/types";

/**
 * Tier 4: Functions — 25 challenges across 7 nodes
 *
 * Nodes: defining-functions, arguments, scope, higher-order, lambda, closures, decorators
 */
export const tier4Challenges: Challenge[] = [
  // ────────────────────────────────────────────────────────────
  // python:t4:defining-functions  (4 challenges)
  // ────────────────────────────────────────────────────────────
  {
    id: "challenge:python:t4:defining-functions:1",
    nodeId: "python:t4:defining-functions",
    type: "write_from_scratch",
    title: "Greeting Function",
    description: "Write a function `greet(name)` that returns the string `Hello, <name>!`.",
    difficulty: 1,
    isBoss: false,
    starterCode: "def greet(name):\n    # Your code here\n    pass\n",
    testCases: [
      { id: "df1-1", input: 'print(greet("Alice"))', expectedOutput: "Hello, Alice!", visible: true, category: "basic", description: "Greet Alice" },
      { id: "df1-2", input: 'print(greet("World"))', expectedOutput: "Hello, World!", visible: false, category: "basic" },
      { id: "df1-3", input: 'print(greet(""))', expectedOutput: "Hello, !", visible: false, category: "edge", description: "Empty name" },
    ],
    hints: [
      { tier: "nudge", text: "Use an f-string to combine the name with the greeting.", xpPenalty: 0.9 },
      { tier: "guide", text: "Return an f-string: f\"Hello, {name}!\"", xpPenalty: 0.75 },
      { tier: "reveal", text: "def greet(name):\n    return f\"Hello, {name}!\"", xpPenalty: 0.5 },
    ],
    baseXP: 100,
    tags: ["functions", "def", "return", "f-strings"],
  },
  {
    id: "challenge:python:t4:defining-functions:2",
    nodeId: "python:t4:defining-functions",
    type: "fill_in_the_blank",
    title: "Return vs Print",
    description: "Fill in the blanks so the function returns the sum and the caller prints it.",
    difficulty: 1,
    isBoss: false,
    templateCode: "def add(a, b):\n    __BLANK__ a + b\n\nresult = __BLANK__(3, 5)\nprint(result)",
    testCases: [
      { id: "df2-1", input: "", expectedOutput: "8", visible: true, category: "basic" },
    ],
    hints: [
      { tier: "nudge", text: "Functions send values back with a keyword.", xpPenalty: 0.9 },
      { tier: "guide", text: "Use `return` inside the function and call `add` outside.", xpPenalty: 0.75 },
      { tier: "reveal", text: "Blanks: `return` and `add`", xpPenalty: 0.5 },
    ],
    baseXP: 100,
    tags: ["functions", "return"],
  },
  {
    id: "challenge:python:t4:defining-functions:3",
    nodeId: "python:t4:defining-functions",
    type: "predict_output",
    title: "Default Return Value",
    description: "What does this code print?",
    difficulty: 2,
    isBoss: false,
    starterCode: "def do_nothing():\n    x = 42\n\nresult = do_nothing()\nprint(result)",
    options: [
      { id: "a", text: "42", isCorrect: false, explanation: "The function assigns x locally but never returns it." },
      { id: "b", text: "None", isCorrect: true, explanation: "Functions without a return statement implicitly return None." },
      { id: "c", text: "Error", isCorrect: false, explanation: "This is valid Python — the function just returns None." },
      { id: "d", text: "0", isCorrect: false, explanation: "Python doesn't default to 0; it defaults to None." },
    ],
    hints: [
      { tier: "nudge", text: "What happens when a function has no return statement?", xpPenalty: 0.9 },
      { tier: "guide", text: "Python functions return None implicitly when there's no return.", xpPenalty: 0.75 },
      { tier: "reveal", text: "The answer is None. Functions without return yield None.", xpPenalty: 0.5 },
    ],
    baseXP: 150,
    tags: ["functions", "return", "None"],
  },
  {
    id: "challenge:python:t4:defining-functions:4",
    nodeId: "python:t4:defining-functions",
    type: "write_from_scratch",
    title: "Multi-Return Calculator",
    description: "Write a function `calc(a, b)` that returns a tuple of (sum, difference, product, quotient). If b is 0, quotient should be None.",
    difficulty: 3,
    isBoss: true,
    starterCode: "def calc(a, b):\n    # Return (sum, difference, product, quotient)\n    pass\n",
    testCases: [
      { id: "df4-1", input: "print(calc(10, 3))", expectedOutput: "(13, 7, 30, 3.3333333333333335)", visible: true, category: "basic" },
      { id: "df4-2", input: "print(calc(0, 5))", expectedOutput: "(5, -5, 0, 0.0)", visible: true, category: "basic" },
      { id: "df4-3", input: "print(calc(10, 0))", expectedOutput: "(10, 10, 0, None)", visible: false, category: "edge", description: "Division by zero" },
    ],
    hints: [
      { tier: "nudge", text: "Return multiple values as a tuple with parentheses.", xpPenalty: 0.9 },
      { tier: "guide", text: "Use a conditional for quotient: None if b == 0, else a / b.", xpPenalty: 0.75 },
      { tier: "reveal", text: "return (a + b, a - b, a * b, None if b == 0 else a / b)", xpPenalty: 0.5 },
    ],
    baseXP: 250,
    tags: ["functions", "tuples", "return", "conditionals"],
  },

  // ────────────────────────────────────────────────────────────
  // python:t4:arguments  (4 challenges)
  // ────────────────────────────────────────────────────────────
  {
    id: "challenge:python:t4:arguments:1",
    nodeId: "python:t4:arguments",
    type: "fill_in_the_blank",
    title: "Default Arguments",
    description: "Fill in the blanks to create a function with a default greeting.",
    difficulty: 1,
    isBoss: false,
    templateCode: "def greet(name, greeting__BLANK__\"Hi\"):\n    return f\"{greeting}, {name}!\"\n\nprint(greet(\"Alice\"))\nprint(greet(\"Bob\", __BLANK__=\"Hey\"))",
    testCases: [
      { id: "a1-1", input: "", expectedOutput: "Hi, Alice!\nHey, Bob!", visible: true, category: "basic" },
    ],
    hints: [
      { tier: "nudge", text: "Default values use = in the parameter list.", xpPenalty: 0.9 },
      { tier: "guide", text: "First blank: `=` to assign default. Second: `greeting` as keyword.", xpPenalty: 0.75 },
      { tier: "reveal", text: "Blanks: `=` and `greeting`", xpPenalty: 0.5 },
    ],
    baseXP: 100,
    tags: ["arguments", "default", "keyword"],
  },
  {
    id: "challenge:python:t4:arguments:2",
    nodeId: "python:t4:arguments",
    type: "write_from_scratch",
    title: "Flexible Sum",
    description: "Write a function `flex_sum(*args)` that returns the sum of all arguments. Return 0 if no arguments.",
    difficulty: 2,
    isBoss: false,
    starterCode: "def flex_sum(*args):\n    # Your code here\n    pass\n",
    testCases: [
      { id: "a2-1", input: "print(flex_sum(1, 2, 3))", expectedOutput: "6", visible: true, category: "basic" },
      { id: "a2-2", input: "print(flex_sum())", expectedOutput: "0", visible: true, category: "edge" },
      { id: "a2-3", input: "print(flex_sum(10, -5, 3, 7))", expectedOutput: "15", visible: false, category: "basic" },
    ],
    hints: [
      { tier: "nudge", text: "*args collects positional arguments into a tuple.", xpPenalty: 0.9 },
      { tier: "guide", text: "Use the built-in sum() on args.", xpPenalty: 0.75 },
      { tier: "reveal", text: "return sum(args)", xpPenalty: 0.5 },
    ],
    baseXP: 150,
    tags: ["*args", "variadic"],
  },
  {
    id: "challenge:python:t4:arguments:3",
    nodeId: "python:t4:arguments",
    type: "predict_output",
    title: "Mutable Default Trap",
    description: "What does this code print?",
    difficulty: 3,
    isBoss: false,
    starterCode: "def append_to(item, lst=[]):\n    lst.append(item)\n    return lst\n\nprint(append_to(1))\nprint(append_to(2))",
    options: [
      { id: "a", text: "[1]\n[2]", isCorrect: false, explanation: "The default list is shared between calls — it's not recreated." },
      { id: "b", text: "[1]\n[1, 2]", isCorrect: true, explanation: "Mutable default arguments persist across calls. The same list object is reused." },
      { id: "c", text: "[1, 2]\n[1, 2]", isCorrect: false, explanation: "The first call only adds 1." },
      { id: "d", text: "Error", isCorrect: false, explanation: "This is valid Python, just surprising behavior." },
    ],
    hints: [
      { tier: "nudge", text: "Default argument values are evaluated once at function definition.", xpPenalty: 0.9 },
      { tier: "guide", text: "Mutable defaults (like lists) are shared across all calls.", xpPenalty: 0.75 },
      { tier: "reveal", text: "The default list persists: first call → [1], second call → [1, 2].", xpPenalty: 0.5 },
    ],
    baseXP: 250,
    tags: ["arguments", "mutable-default", "gotcha"],
  },
  {
    id: "challenge:python:t4:arguments:4",
    nodeId: "python:t4:arguments",
    type: "write_from_scratch",
    title: "Config Builder",
    description: "Write `build_config(**kwargs)` that returns a dict with all kwargs, but with every key uppercased. E.g., `build_config(host=\"localhost\", port=8080)` → `{\"HOST\": \"localhost\", \"PORT\": 8080}`.",
    difficulty: 4,
    isBoss: true,
    starterCode: "def build_config(**kwargs):\n    # Your code here\n    pass\n",
    testCases: [
      { id: "a4-1", input: 'print(build_config(host="localhost", port=8080))', expectedOutput: "{'HOST': 'localhost', 'PORT': 8080}", visible: true, category: "basic" },
      { id: "a4-2", input: "print(build_config())", expectedOutput: "{}", visible: true, category: "edge" },
      { id: "a4-3", input: 'print(build_config(debug=True, verbose=False))', expectedOutput: "{'DEBUG': True, 'VERBOSE': False}", visible: false, category: "basic" },
    ],
    hints: [
      { tier: "nudge", text: "**kwargs gives you a dictionary of keyword arguments.", xpPenalty: 0.9 },
      { tier: "guide", text: "Use a dict comprehension: {k.upper(): v for k, v in kwargs.items()}", xpPenalty: 0.75 },
      { tier: "reveal", text: "return {k.upper(): v for k, v in kwargs.items()}", xpPenalty: 0.5 },
    ],
    baseXP: 350,
    tags: ["**kwargs", "dict-comprehension"],
  },

  // ────────────────────────────────────────────────────────────
  // python:t4:scope  (3 challenges)
  // ────────────────────────────────────────────────────────────
  {
    id: "challenge:python:t4:scope:1",
    nodeId: "python:t4:scope",
    type: "predict_output",
    title: "Local vs Global",
    description: "What does this code print?",
    difficulty: 2,
    isBoss: false,
    starterCode: "x = 10\n\ndef change():\n    x = 20\n    print(x)\n\nchange()\nprint(x)",
    options: [
      { id: "a", text: "20\n20", isCorrect: false, explanation: "The function creates a local x; the global x is unchanged." },
      { id: "b", text: "20\n10", isCorrect: true, explanation: "Inside the function, x = 20 creates a local variable. The global x remains 10." },
      { id: "c", text: "10\n10", isCorrect: false, explanation: "Inside the function, x is reassigned to 20 locally." },
      { id: "d", text: "Error", isCorrect: false, explanation: "This is valid — local and global scopes are separate." },
    ],
    hints: [
      { tier: "nudge", text: "Assignment inside a function creates a local variable.", xpPenalty: 0.9 },
      { tier: "guide", text: "The function's x = 20 is local; the outer x stays 10.", xpPenalty: 0.75 },
      { tier: "reveal", text: "Output: 20 (local), then 10 (global unchanged).", xpPenalty: 0.5 },
    ],
    baseXP: 150,
    tags: ["scope", "LEGB", "local", "global"],
  },
  {
    id: "challenge:python:t4:scope:2",
    nodeId: "python:t4:scope",
    type: "bug_fix",
    title: "Global Keyword",
    description: "This function should increment a global counter, but it crashes. Fix it.",
    difficulty: 2,
    isBoss: false,
    starterCode: "counter = 0\n\ndef increment():\n    counter += 1\n\nincrement()\nprint(counter)",
    testCases: [
      { id: "s2-1", input: "", expectedOutput: "1", visible: true, category: "basic", description: "Counter should be 1 after one increment" },
    ],
    hints: [
      { tier: "nudge", text: "Python sees `counter += 1` as a local assignment attempt.", xpPenalty: 0.9 },
      { tier: "guide", text: "Use the `global` keyword to tell Python you mean the outer variable.", xpPenalty: 0.75 },
      { tier: "reveal", text: "Add `global counter` as the first line in the function.", xpPenalty: 0.5 },
    ],
    baseXP: 150,
    tags: ["scope", "global", "UnboundLocalError"],
  },
  {
    id: "challenge:python:t4:scope:3",
    nodeId: "python:t4:scope",
    type: "write_from_scratch",
    title: "Nonlocal Counter",
    description: "Write a function `make_counter()` that returns an inner function. Each call to the inner function should return the next integer starting from 1. Use `nonlocal`.",
    difficulty: 4,
    isBoss: true,
    starterCode: "def make_counter():\n    # Your code here\n    pass\n",
    testCases: [
      { id: "s3-1", input: "c = make_counter()\nprint(c())\nprint(c())\nprint(c())", expectedOutput: "1\n2\n3", visible: true, category: "basic" },
      { id: "s3-2", input: "a = make_counter()\nb = make_counter()\nprint(a())\nprint(b())\nprint(a())", expectedOutput: "1\n1\n2", visible: false, category: "edge", description: "Independent counters" },
    ],
    hints: [
      { tier: "nudge", text: "The inner function needs to modify a variable from the enclosing scope.", xpPenalty: 0.9 },
      { tier: "guide", text: "Use `nonlocal count` inside the inner function to modify the enclosing variable.", xpPenalty: 0.75 },
      { tier: "reveal", text: "def make_counter():\n    count = 0\n    def inner():\n        nonlocal count\n        count += 1\n        return count\n    return inner", xpPenalty: 0.5 },
    ],
    baseXP: 350,
    tags: ["scope", "nonlocal", "closures"],
  },

  // ────────────────────────────────────────────────────────────
  // python:t4:higher-order  (3 challenges)
  // ────────────────────────────────────────────────────────────
  {
    id: "challenge:python:t4:higher-order:1",
    nodeId: "python:t4:higher-order",
    type: "write_from_scratch",
    title: "Apply Function",
    description: "Write `apply_to_all(func, items)` that returns a new list with `func` applied to each item.",
    difficulty: 2,
    isBoss: false,
    starterCode: "def apply_to_all(func, items):\n    # Your code here\n    pass\n",
    testCases: [
      { id: "ho1-1", input: "print(apply_to_all(str.upper, ['hello', 'world']))", expectedOutput: "['HELLO', 'WORLD']", visible: true, category: "basic" },
      { id: "ho1-2", input: "print(apply_to_all(lambda x: x * 2, [1, 2, 3]))", expectedOutput: "[2, 4, 6]", visible: true, category: "basic" },
      { id: "ho1-3", input: "print(apply_to_all(abs, [-1, 0, 3]))", expectedOutput: "[1, 0, 3]", visible: false, category: "basic" },
    ],
    hints: [
      { tier: "nudge", text: "Use a list comprehension calling func on each item.", xpPenalty: 0.9 },
      { tier: "guide", text: "return [func(item) for item in items]", xpPenalty: 0.75 },
      { tier: "reveal", text: "return [func(x) for x in items]", xpPenalty: 0.5 },
    ],
    baseXP: 150,
    tags: ["higher-order", "map", "list-comprehension"],
  },
  {
    id: "challenge:python:t4:higher-order:2",
    nodeId: "python:t4:higher-order",
    type: "write_from_scratch",
    title: "Custom Filter",
    description: "Write `keep_if(predicate, items)` that returns a list of items where `predicate(item)` is True.",
    difficulty: 2,
    isBoss: false,
    starterCode: "def keep_if(predicate, items):\n    # Your code here\n    pass\n",
    testCases: [
      { id: "ho2-1", input: "print(keep_if(lambda x: x > 0, [-2, -1, 0, 1, 2]))", expectedOutput: "[1, 2]", visible: true, category: "basic" },
      { id: "ho2-2", input: "print(keep_if(str.isupper, ['A', 'b', 'C']))", expectedOutput: "['A', 'C']", visible: false, category: "basic" },
    ],
    hints: [
      { tier: "nudge", text: "Iterate and include items where the predicate returns True.", xpPenalty: 0.9 },
      { tier: "guide", text: "Use a list comprehension with an if clause.", xpPenalty: 0.75 },
      { tier: "reveal", text: "return [x for x in items if predicate(x)]", xpPenalty: 0.5 },
    ],
    baseXP: 150,
    tags: ["higher-order", "filter", "predicate"],
  },
  {
    id: "challenge:python:t4:higher-order:3",
    nodeId: "python:t4:higher-order",
    type: "write_from_scratch",
    title: "Pipeline",
    description: "Write `pipeline(value, *funcs)` that passes value through each function in order. E.g., `pipeline(5, double, add_one)` → double(5)=10, add_one(10)=11.",
    difficulty: 4,
    isBoss: true,
    starterCode: "def pipeline(value, *funcs):\n    # Your code here\n    pass\n",
    testCases: [
      { id: "ho3-1", input: "print(pipeline(5, lambda x: x * 2, lambda x: x + 1))", expectedOutput: "11", visible: true, category: "basic" },
      { id: "ho3-2", input: "print(pipeline('hello', str.upper, lambda s: s + '!'))", expectedOutput: "HELLO!", visible: true, category: "basic" },
      { id: "ho3-3", input: "print(pipeline(42))", expectedOutput: "42", visible: false, category: "edge", description: "No functions" },
    ],
    hints: [
      { tier: "nudge", text: "Loop through the functions, passing the result of each to the next.", xpPenalty: 0.9 },
      { tier: "guide", text: "Use a for loop: for f in funcs: value = f(value)", xpPenalty: 0.75 },
      { tier: "reveal", text: "for f in funcs:\n    value = f(value)\nreturn value", xpPenalty: 0.5 },
    ],
    baseXP: 350,
    tags: ["higher-order", "pipeline", "composition"],
  },

  // ────────────────────────────────────────────────────────────
  // python:t4:lambda  (3 challenges)
  // ────────────────────────────────────────────────────────────
  {
    id: "challenge:python:t4:lambda:1",
    nodeId: "python:t4:lambda",
    type: "fill_in_the_blank",
    title: "Lambda Basics",
    description: "Fill in the blanks to sort a list of tuples by the second element using a lambda.",
    difficulty: 2,
    isBoss: false,
    templateCode: "pairs = [(1, 'b'), (3, 'a'), (2, 'c')]\nsorted_pairs = sorted(pairs, key=__BLANK__ x: x[__BLANK__])\nprint(sorted_pairs)",
    testCases: [
      { id: "l1-1", input: "", expectedOutput: "[(3, 'a'), (1, 'b'), (2, 'c')]", visible: true, category: "basic" },
    ],
    hints: [
      { tier: "nudge", text: "Lambdas start with the `lambda` keyword.", xpPenalty: 0.9 },
      { tier: "guide", text: "Use `lambda` and index `1` for the second element.", xpPenalty: 0.75 },
      { tier: "reveal", text: "Blanks: `lambda` and `1`", xpPenalty: 0.5 },
    ],
    baseXP: 150,
    tags: ["lambda", "sorted", "key"],
  },
  {
    id: "challenge:python:t4:lambda:2",
    nodeId: "python:t4:lambda",
    type: "write_from_scratch",
    title: "Lambda Map",
    description: "Use `map()` with a lambda to convert a list of Celsius temps to Fahrenheit. Formula: F = C * 9/5 + 32. Print the result as a list.",
    difficulty: 2,
    isBoss: false,
    starterCode: "celsius = [0, 20, 37, 100]\n\n# Use map with a lambda\n",
    testCases: [
      { id: "l2-1", input: "", expectedOutput: "[32.0, 68.0, 98.60000000000001, 212.0]", visible: true, category: "basic" },
    ],
    hints: [
      { tier: "nudge", text: "map() takes a function and an iterable.", xpPenalty: 0.9 },
      { tier: "guide", text: "list(map(lambda c: c * 9/5 + 32, celsius))", xpPenalty: 0.75 },
      { tier: "reveal", text: "print(list(map(lambda c: c * 9/5 + 32, celsius)))", xpPenalty: 0.5 },
    ],
    baseXP: 150,
    tags: ["lambda", "map"],
  },
  {
    id: "challenge:python:t4:lambda:3",
    nodeId: "python:t4:lambda",
    type: "write_from_scratch",
    title: "Sort by Multiple Keys",
    description: "Sort a list of student dicts by grade (descending), then by name (ascending). Use `sorted()` with a lambda key.",
    difficulty: 4,
    isBoss: true,
    starterCode: "students = [\n    {'name': 'Alice', 'grade': 90},\n    {'name': 'Charlie', 'grade': 85},\n    {'name': 'Bob', 'grade': 90},\n    {'name': 'Diana', 'grade': 85},\n]\n\n# Sort and print\n",
    testCases: [
      { id: "l3-1", input: "", expectedOutput: "[{'name': 'Alice', 'grade': 90}, {'name': 'Bob', 'grade': 90}, {'name': 'Charlie', 'grade': 85}, {'name': 'Diana', 'grade': 85}]", visible: true, category: "basic" },
    ],
    hints: [
      { tier: "nudge", text: "You can return a tuple from a lambda to sort by multiple keys.", xpPenalty: 0.9 },
      { tier: "guide", text: "Use (-grade, name) to sort grade descending and name ascending.", xpPenalty: 0.75 },
      { tier: "reveal", text: "print(sorted(students, key=lambda s: (-s['grade'], s['name'])))", xpPenalty: 0.5 },
    ],
    baseXP: 350,
    tags: ["lambda", "sorted", "multi-key"],
  },

  // ────────────────────────────────────────────────────────────
  // python:t4:closures  (3 challenges)
  // ────────────────────────────────────────────────────────────
  {
    id: "challenge:python:t4:closures:1",
    nodeId: "python:t4:closures",
    type: "predict_output",
    title: "Closure Capture",
    description: "What does this code print?",
    difficulty: 2,
    isBoss: false,
    starterCode: "def make_multiplier(n):\n    def multiply(x):\n        return x * n\n    return multiply\n\ndouble = make_multiplier(2)\ntriple = make_multiplier(3)\nprint(double(5))\nprint(triple(5))",
    options: [
      { id: "a", text: "10\n15", isCorrect: true, explanation: "Each closure captures its own `n` value. double captures 2, triple captures 3." },
      { id: "b", text: "15\n15", isCorrect: false, explanation: "Each call to make_multiplier creates a separate closure." },
      { id: "c", text: "10\n10", isCorrect: false, explanation: "triple captures n=3, not n=2." },
      { id: "d", text: "Error", isCorrect: false, explanation: "Closures are valid in Python." },
    ],
    hints: [
      { tier: "nudge", text: "Each call to make_multiplier creates a new closure with its own n.", xpPenalty: 0.9 },
      { tier: "guide", text: "double has n=2, triple has n=3 — they're independent.", xpPenalty: 0.75 },
      { tier: "reveal", text: "double(5) = 5*2 = 10, triple(5) = 5*3 = 15", xpPenalty: 0.5 },
    ],
    baseXP: 150,
    tags: ["closures", "capture"],
  },
  {
    id: "challenge:python:t4:closures:2",
    nodeId: "python:t4:closures",
    type: "write_from_scratch",
    title: "Accumulator",
    description: "Write `make_accumulator(initial)` that returns a function. Each call to the returned function adds its argument to a running total and returns the new total.",
    difficulty: 3,
    isBoss: false,
    starterCode: "def make_accumulator(initial):\n    # Your code here\n    pass\n",
    testCases: [
      { id: "c2-1", input: "acc = make_accumulator(10)\nprint(acc(5))\nprint(acc(3))\nprint(acc(-2))", expectedOutput: "15\n18\n16", visible: true, category: "basic" },
      { id: "c2-2", input: "a = make_accumulator(0)\nprint(a(0))", expectedOutput: "0", visible: false, category: "edge" },
    ],
    hints: [
      { tier: "nudge", text: "The inner function needs to modify the running total in the enclosing scope.", xpPenalty: 0.9 },
      { tier: "guide", text: "Use `nonlocal` to modify the `initial` (or a `total`) variable from the enclosing scope.", xpPenalty: 0.75 },
      { tier: "reveal", text: "def make_accumulator(initial):\n    total = initial\n    def add(n):\n        nonlocal total\n        total += n\n        return total\n    return add", xpPenalty: 0.5 },
    ],
    baseXP: 250,
    tags: ["closures", "nonlocal", "state"],
  },
  {
    id: "challenge:python:t4:closures:3",
    nodeId: "python:t4:closures",
    type: "write_from_scratch",
    title: "Logger Factory",
    description: "Write `make_logger(prefix)` that returns a function. The returned function takes a message and prints `[PREFIX] message`. The prefix should be uppercased.",
    difficulty: 3,
    isBoss: true,
    starterCode: "def make_logger(prefix):\n    # Your code here\n    pass\n",
    testCases: [
      { id: "c3-1", input: 'log = make_logger("info")\nlog("server started")', expectedOutput: "[INFO] server started", visible: true, category: "basic" },
      { id: "c3-2", input: 'err = make_logger("error")\nerr("not found")', expectedOutput: "[ERROR] not found", visible: true, category: "basic" },
    ],
    hints: [
      { tier: "nudge", text: "The inner function captures the prefix from the enclosing scope.", xpPenalty: 0.9 },
      { tier: "guide", text: "Uppercase the prefix with .upper() and use an f-string.", xpPenalty: 0.75 },
      { tier: "reveal", text: "def make_logger(prefix):\n    tag = prefix.upper()\n    def log(msg):\n        print(f\"[{tag}] {msg}\")\n    return log", xpPenalty: 0.5 },
    ],
    baseXP: 250,
    tags: ["closures", "factory"],
  },

  // ────────────────────────────────────────────────────────────
  // python:t4:decorators  (4 challenges)
  // ────────────────────────────────────────────────────────────
  {
    id: "challenge:python:t4:decorators:1",
    nodeId: "python:t4:decorators",
    type: "multiple_choice",
    title: "What Is a Decorator?",
    description: "Which statement best describes a Python decorator?",
    difficulty: 1,
    isBoss: false,
    options: [
      { id: "a", text: "A function that takes a function and returns a new function with added behavior", isCorrect: true, explanation: "Decorators wrap functions to extend their behavior without modifying the original code." },
      { id: "b", text: "A class that inherits from another class", isCorrect: false, explanation: "That's inheritance, not decoration." },
      { id: "c", text: "A special syntax for defining lambda functions", isCorrect: false, explanation: "Lambdas and decorators are unrelated concepts." },
      { id: "d", text: "A way to convert functions to generators", isCorrect: false, explanation: "Generators use yield, not decorators." },
    ],
    hints: [
      { tier: "nudge", text: "Think about the @decorator syntax above a function definition.", xpPenalty: 0.9 },
      { tier: "guide", text: "Decorators wrap functions to modify or extend their behavior.", xpPenalty: 0.75 },
      { tier: "reveal", text: "A decorator takes a function and returns a new function.", xpPenalty: 0.5 },
    ],
    baseXP: 100,
    tags: ["decorators"],
  },
  {
    id: "challenge:python:t4:decorators:2",
    nodeId: "python:t4:decorators",
    type: "fill_in_the_blank",
    title: "Timer Decorator",
    description: "Fill in the blanks to complete a timing decorator.",
    difficulty: 3,
    isBoss: false,
    templateCode: "import time\n\ndef timer(func):\n    def wrapper(*args, **kwargs):\n        start = time.time()\n        result = __BLANK__(*args, **kwargs)\n        elapsed = time.time() - start\n        print(f\"{func.__name__} took {elapsed:.4f}s\")\n        __BLANK__ result\n    return __BLANK__",
    testCases: [
      { id: "d2-1", input: "", expectedOutput: "", visible: true, category: "basic", description: "Decorator structure is correct" },
    ],
    hints: [
      { tier: "nudge", text: "The wrapper calls the original function and returns its result.", xpPenalty: 0.9 },
      { tier: "guide", text: "Call `func`, `return` the result, and return `wrapper` from timer.", xpPenalty: 0.75 },
      { tier: "reveal", text: "Blanks: `func`, `return`, `wrapper`", xpPenalty: 0.5 },
    ],
    baseXP: 250,
    tags: ["decorators", "timing"],
  },
  {
    id: "challenge:python:t4:decorators:3",
    nodeId: "python:t4:decorators",
    type: "write_from_scratch",
    title: "Retry Decorator",
    description: "Write a decorator `retry(max_attempts)` that retries a function up to `max_attempts` times if it raises an exception. Print 'Attempt N failed' on each failure. Re-raise the last exception if all attempts fail.",
    difficulty: 5,
    isBoss: true,
    starterCode: "def retry(max_attempts):\n    # Your code here\n    pass\n",
    testCases: [
      { id: "d3-1", input: "call_count = 0\n@retry(3)\ndef flaky():\n    global call_count\n    call_count += 1\n    if call_count < 3:\n        raise ValueError('fail')\n    return 'ok'\nprint(flaky())", expectedOutput: "Attempt 1 failed\nAttempt 2 failed\nok", visible: true, category: "basic" },
    ],
    hints: [
      { tier: "nudge", text: "You need three nested functions: retry → decorator → wrapper.", xpPenalty: 0.9 },
      { tier: "guide", text: "retry returns a decorator that returns a wrapper. The wrapper loops max_attempts times in a try/except.", xpPenalty: 0.75 },
      { tier: "reveal", text: "def retry(max_attempts):\n    def decorator(func):\n        def wrapper(*a, **kw):\n            for i in range(1, max_attempts + 1):\n                try:\n                    return func(*a, **kw)\n                except Exception:\n                    print(f'Attempt {i} failed')\n                    if i == max_attempts:\n                        raise\n        return wrapper\n    return decorator", xpPenalty: 0.5 },
    ],
    baseXP: 500,
    tags: ["decorators", "retry", "error-handling"],
  },
];
