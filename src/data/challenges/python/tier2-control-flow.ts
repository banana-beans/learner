import type { Challenge } from "@/lib/types";

/**
 * Tier 2: Control Flow — 18 challenges across 5 nodes
 *
 * Nodes: conditionals, while-loops, for-loops, error-handling, match-statement
 */
export const tier2Challenges: Challenge[] = [
  // ────────────────────────────────────────────────────────────
  // python:t2:conditionals  (4 challenges)
  // ────────────────────────────────────────────────────────────
  {
    id: "challenge:python:t2:conditionals:1",
    nodeId: "python:t2:conditionals",
    type: "fill_in_the_blank",
    title: "Grade Checker",
    description:
      'Fill in the blanks to print "Pass" if score is 60 or above, otherwise "Fail".',
    difficulty: 1,
    isBoss: false,
    templateCode:
      'score = 75\n__BLANK__ score >= 60:\n    print("Pass")\n__BLANK__:\n    print("Fail")',
    testCases: [
      {
        id: "cond1-pass",
        input: "",
        expectedOutput: "Pass",
        visible: true,
        category: "basic",
        description: "75 >= 60 means Pass",
      },
    ],
    hints: [
      { tier: "nudge", text: "Python uses specific keywords for branching logic.", xpPenalty: 0.9 },
      { tier: "guide", text: "The first blank is `if`, the second is `else`.", xpPenalty: 0.75 },
      { tier: "reveal", text: "Fill in: `if` and `else`", xpPenalty: 0.5 },
    ],
    baseXP: 100,
    tags: ["conditionals", "if-else", "comparison"],
  },
  {
    id: "challenge:python:t2:conditionals:2",
    nodeId: "python:t2:conditionals",
    type: "write_from_scratch",
    title: "Letter Grade",
    description:
      "Given a variable `score` (0-100), print the letter grade:\n- 90+: A\n- 80-89: B\n- 70-79: C\n- 60-69: D\n- Below 60: F",
    difficulty: 2,
    isBoss: false,
    starterCode: "score = 85\n\n# Print the letter grade\n",
    testCases: [
      {
        id: "cond2-b",
        input: "",
        expectedOutput: "B",
        visible: true,
        category: "basic",
        description: "85 is a B",
      },
    ],
    hints: [
      { tier: "nudge", text: "You need multiple branches — check from highest grade down.", xpPenalty: 0.9 },
      { tier: "guide", text: "Use if/elif/else chain: if score >= 90, elif score >= 80, etc.", xpPenalty: 0.75 },
      { tier: "reveal", text: 'if score >= 90: print("A") elif score >= 80: print("B") ...', xpPenalty: 0.5 },
    ],
    baseXP: 150,
    tags: ["conditionals", "elif", "ranges"],
  },
  {
    id: "challenge:python:t2:conditionals:3",
    nodeId: "python:t2:conditionals",
    type: "predict_output",
    title: "Truthy and Falsy",
    description:
      'What does this code print?\n\n```python\nvalues = [0, "", "hello", None, 42, [], [1]]\nfor v in values:\n    if v:\n        print("T", end="")\n    else:\n        print("F", end="")\n```',
    difficulty: 2,
    isBoss: false,
    testCases: [
      {
        id: "cond3-basic",
        input: "",
        expectedOutput: "FFTFTFT",
        visible: true,
        category: "basic",
        description: "0=F, ''=F, 'hello'=T, None=F, 42=T, []=F, [1]=T",
      },
    ],
    hints: [
      { tier: "nudge", text: "Some values in Python are considered falsy in boolean context.", xpPenalty: 0.9 },
      { tier: "guide", text: "Falsy values include: 0, '', None, [], {}, set(). Everything else is truthy.", xpPenalty: 0.75 },
      { tier: "reveal", text: "0=F, ''=F, 'hello'=T, None=F, 42=T, []=F, [1]=T => FFTFTFT", xpPenalty: 0.5 },
    ],
    baseXP: 150,
    tags: ["conditionals", "truthy", "falsy", "bool"],
  },
  {
    id: "challenge:python:t2:conditionals:4",
    nodeId: "python:t2:conditionals",
    type: "write_from_scratch",
    title: "Leap Year Checker",
    description:
      "Given a variable `year`, print `Leap` if it's a leap year, `Not leap` otherwise.\n\nRules: A year is a leap year if divisible by 4, except centuries, which must be divisible by 400.",
    difficulty: 3,
    isBoss: true,
    starterCode: "year = 2000\n\n# Print Leap or Not leap\n",
    testCases: [
      {
        id: "cond4-2000",
        input: "",
        expectedOutput: "Leap",
        visible: true,
        category: "basic",
        description: "2000 is divisible by 400",
      },
      {
        id: "cond4-1900",
        input: "",
        expectedOutput: "Not leap",
        visible: false,
        category: "edge",
        description: "1900 is divisible by 100 but not 400",
      },
    ],
    hints: [
      { tier: "nudge", text: "The rules have three conditions — order matters.", xpPenalty: 0.9 },
      { tier: "guide", text: "Check %400 first, then %100, then %4.", xpPenalty: 0.75 },
      { tier: "reveal", text: "if year % 400 == 0: Leap, elif year % 100 == 0: Not leap, elif year % 4 == 0: Leap, else: Not leap", xpPenalty: 0.5 },
    ],
    baseXP: 250,
    tags: ["conditionals", "modulo", "nested-logic"],
  },

  // ────────────────────────────────────────────────────────────
  // python:t2:while-loops  (4 challenges)
  // ────────────────────────────────────────────────────────────
  {
    id: "challenge:python:t2:while-loops:1",
    nodeId: "python:t2:while-loops",
    type: "fill_in_the_blank",
    title: "Countdown",
    description: "Fill in the blanks to create a countdown from 5 to 1.",
    difficulty: 1,
    isBoss: false,
    templateCode:
      "n = 5\n__BLANK__ n > 0:\n    print(n)\n    n __BLANK__ 1",
    testCases: [
      {
        id: "wl1-basic",
        input: "",
        expectedOutput: "5\n4\n3\n2\n1",
        visible: true,
        category: "basic",
        description: "Counts down from 5 to 1",
      },
    ],
    hints: [
      { tier: "nudge", text: "You need a loop keyword and a decrement operator.", xpPenalty: 0.9 },
      { tier: "guide", text: "First blank is `while`, second blank is `-=`.", xpPenalty: 0.75 },
      { tier: "reveal", text: "Fill in: `while` and `-=`", xpPenalty: 0.5 },
    ],
    baseXP: 100,
    tags: ["while-loop", "counter", "decrement"],
  },
  {
    id: "challenge:python:t2:while-loops:2",
    nodeId: "python:t2:while-loops",
    type: "write_from_scratch",
    title: "Sum Until Zero",
    description:
      "Read integers from input (one per line) and print their running total. Stop when the user enters 0. Print the final sum.",
    difficulty: 2,
    isBoss: false,
    starterCode: "# Read numbers until 0, print the sum\n",
    testCases: [
      {
        id: "wl2-basic",
        input: "5\n3\n-2\n0",
        expectedOutput: "6",
        visible: true,
        category: "basic",
        description: "5 + 3 + (-2) = 6",
      },
      {
        id: "wl2-zero",
        input: "0",
        expectedOutput: "0",
        visible: false,
        category: "edge",
        description: "Immediate zero gives 0",
      },
    ],
    hints: [
      { tier: "nudge", text: "Use a while loop that keeps running until the input is 0.", xpPenalty: 0.9 },
      { tier: "guide", text: "Read inside the loop, accumulate into a total variable, break on 0.", xpPenalty: 0.75 },
      { tier: "reveal", text: "total = 0; while True: n = int(input()); if n == 0: break; total += n; print(total)", xpPenalty: 0.5 },
    ],
    baseXP: 150,
    tags: ["while-loop", "accumulator", "break", "input"],
  },
  {
    id: "challenge:python:t2:while-loops:3",
    nodeId: "python:t2:while-loops",
    type: "bug_fix",
    title: "Infinite Loop Fix",
    description:
      "This loop should print numbers 1 through 5, but it runs forever. Fix it.",
    difficulty: 2,
    isBoss: false,
    starterCode: "i = 1\nwhile i <= 5:\n    print(i)\n",
    testCases: [
      {
        id: "wl3-basic",
        input: "",
        expectedOutput: "1\n2\n3\n4\n5",
        visible: true,
        category: "basic",
        description: "Prints 1 through 5",
      },
    ],
    hints: [
      { tier: "nudge", text: "The loop condition depends on `i`, but `i` never changes.", xpPenalty: 0.9 },
      { tier: "guide", text: "You need to increment `i` inside the loop body.", xpPenalty: 0.75 },
      { tier: "reveal", text: "Add `i += 1` at the end of the loop body.", xpPenalty: 0.5 },
    ],
    baseXP: 150,
    tags: ["while-loop", "infinite-loop", "debugging"],
  },
  {
    id: "challenge:python:t2:while-loops:4",
    nodeId: "python:t2:while-loops",
    type: "write_from_scratch",
    title: "Collatz Sequence",
    description:
      "Given a positive integer `n`, print the Collatz sequence starting from `n` until it reaches 1.\n\nRules: if n is even, next = n // 2; if n is odd, next = 3n + 1. Print each value on a separate line, including the starting value and the final 1.",
    difficulty: 3,
    isBoss: true,
    starterCode: "n = 6\n\n# Print the Collatz sequence\n",
    testCases: [
      {
        id: "wl4-basic",
        input: "",
        expectedOutput: "6\n3\n10\n5\n16\n8\n4\n2\n1",
        visible: true,
        category: "basic",
        description: "Collatz sequence starting from 6",
      },
    ],
    hints: [
      { tier: "nudge", text: "Use a while loop that continues until n equals 1.", xpPenalty: 0.9 },
      { tier: "guide", text: "Print n, then update: if n % 2 == 0 then n //= 2, else n = 3*n + 1. Don't forget to print 1.", xpPenalty: 0.75 },
      { tier: "reveal", text: "while n != 1: print(n); n = n // 2 if n % 2 == 0 else 3 * n + 1; print(1)", xpPenalty: 0.5 },
    ],
    baseXP: 250,
    tags: ["while-loop", "conditionals", "collatz", "math"],
  },

  // ────────────────────────────────────────────────────────────
  // python:t2:for-loops  (4 challenges)
  // ────────────────────────────────────────────────────────────
  {
    id: "challenge:python:t2:for-loops:1",
    nodeId: "python:t2:for-loops",
    type: "fill_in_the_blank",
    title: "Range Basics",
    description: "Fill in the blank to print numbers 0 through 4.",
    difficulty: 1,
    isBoss: false,
    templateCode: "for i in __BLANK__:\n    print(i)",
    testCases: [
      {
        id: "fl1-basic",
        input: "",
        expectedOutput: "0\n1\n2\n3\n4",
        visible: true,
        category: "basic",
        description: "Prints 0, 1, 2, 3, 4",
      },
    ],
    hints: [
      { tier: "nudge", text: "Python has a built-in that generates a sequence of numbers.", xpPenalty: 0.9 },
      { tier: "guide", text: "range(n) generates 0, 1, 2, ..., n-1.", xpPenalty: 0.75 },
      { tier: "reveal", text: "Fill in: range(5)", xpPenalty: 0.5 },
    ],
    baseXP: 100,
    tags: ["for-loop", "range"],
  },
  {
    id: "challenge:python:t2:for-loops:2",
    nodeId: "python:t2:for-loops",
    type: "write_from_scratch",
    title: "Sum of a List",
    description:
      "Given a list `numbers = [4, 8, 15, 16, 23, 42]`, use a for loop to compute and print the sum. Do NOT use the built-in sum() function.",
    difficulty: 2,
    isBoss: false,
    starterCode: "numbers = [4, 8, 15, 16, 23, 42]\n\n# Calculate the sum with a for loop\n",
    testCases: [
      {
        id: "fl2-basic",
        input: "",
        expectedOutput: "108",
        visible: true,
        category: "basic",
        description: "4+8+15+16+23+42 = 108",
      },
    ],
    hints: [
      { tier: "nudge", text: "Create an accumulator variable before the loop.", xpPenalty: 0.9 },
      { tier: "guide", text: "Set total = 0, then for each number add it to total.", xpPenalty: 0.75 },
      { tier: "reveal", text: "total = 0\nfor n in numbers:\n    total += n\nprint(total)", xpPenalty: 0.5 },
    ],
    baseXP: 150,
    tags: ["for-loop", "accumulator", "lists"],
  },
  {
    id: "challenge:python:t2:for-loops:3",
    nodeId: "python:t2:for-loops",
    type: "write_from_scratch",
    title: "Enumerate Index",
    description:
      'Given a list `fruits = ["apple", "banana", "cherry"]`, use `enumerate()` to print each fruit with its index:\n```\n0: apple\n1: banana\n2: cherry\n```',
    difficulty: 2,
    isBoss: false,
    starterCode: 'fruits = ["apple", "banana", "cherry"]\n\n# Print index: fruit\n',
    testCases: [
      {
        id: "fl3-basic",
        input: "",
        expectedOutput: "0: apple\n1: banana\n2: cherry",
        visible: true,
        category: "basic",
        description: "Each fruit with its index",
      },
    ],
    hints: [
      { tier: "nudge", text: "enumerate() gives you both the index and the value.", xpPenalty: 0.9 },
      { tier: "guide", text: "Use: for i, fruit in enumerate(fruits):", xpPenalty: 0.75 },
      { tier: "reveal", text: 'for i, fruit in enumerate(fruits):\n    print(f"{i}: {fruit}")', xpPenalty: 0.5 },
    ],
    baseXP: 150,
    tags: ["for-loop", "enumerate", "lists"],
  },
  {
    id: "challenge:python:t2:for-loops:4",
    nodeId: "python:t2:for-loops",
    type: "write_from_scratch",
    title: "Multiplication Table",
    description:
      "Print a multiplication table for numbers 1-3 using nested loops. Format:\n```\n1 2 3\n2 4 6\n3 6 9\n```\nNumbers on each row separated by spaces.",
    difficulty: 3,
    isBoss: true,
    starterCode: "# Print a 3x3 multiplication table\n",
    testCases: [
      {
        id: "fl4-basic",
        input: "",
        expectedOutput: "1 2 3\n2 4 6\n3 6 9",
        visible: true,
        category: "basic",
        description: "3x3 multiplication table",
      },
    ],
    hints: [
      { tier: "nudge", text: "You'll need a loop inside a loop — one for rows, one for columns.", xpPenalty: 0.9 },
      { tier: "guide", text: "Outer loop for rows (i), inner loop builds the row. Use join() or print with end.", xpPenalty: 0.75 },
      { tier: "reveal", text: 'for i in range(1, 4):\n    print(" ".join(str(i * j) for j in range(1, 4)))', xpPenalty: 0.5 },
    ],
    baseXP: 250,
    tags: ["for-loop", "nested-loops", "range", "formatting"],
  },

  // ────────────────────────────────────────────────────────────
  // python:t2:error-handling  (3 challenges)
  // ────────────────────────────────────────────────────────────
  {
    id: "challenge:python:t2:error-handling:1",
    nodeId: "python:t2:error-handling",
    type: "fill_in_the_blank",
    title: "Safe Division",
    description:
      "Fill in the blanks to handle a ZeroDivisionError when dividing.",
    difficulty: 1,
    isBoss: false,
    templateCode:
      '__BLANK__:\n    result = 10 / 0\n    print(result)\n__BLANK__ ZeroDivisionError:\n    print("Cannot divide by zero")',
    testCases: [
      {
        id: "eh1-basic",
        input: "",
        expectedOutput: "Cannot divide by zero",
        visible: true,
        category: "basic",
        description: "Catches the division error",
      },
    ],
    hints: [
      { tier: "nudge", text: "Python has a mechanism for catching errors before they crash your program.", xpPenalty: 0.9 },
      { tier: "guide", text: "The first blank is `try`, the second is `except`.", xpPenalty: 0.75 },
      { tier: "reveal", text: "Fill in: `try` and `except`", xpPenalty: 0.5 },
    ],
    baseXP: 100,
    tags: ["error-handling", "try-except", "ZeroDivisionError"],
  },
  {
    id: "challenge:python:t2:error-handling:2",
    nodeId: "python:t2:error-handling",
    type: "write_from_scratch",
    title: "Input Validator",
    description:
      'Read user input and try to convert it to an integer. If successful, print the number. If the user enters non-numeric input, print "Invalid input".\n\nUse try/except to handle ValueError.',
    difficulty: 2,
    isBoss: false,
    starterCode: "# Read input and handle invalid numbers\n",
    testCases: [
      {
        id: "eh2-valid",
        input: "42",
        expectedOutput: "42",
        visible: true,
        category: "basic",
        description: "Valid integer input",
      },
      {
        id: "eh2-invalid",
        input: "hello",
        expectedOutput: "Invalid input",
        visible: true,
        category: "edge",
        description: "Non-numeric input",
      },
    ],
    hints: [
      { tier: "nudge", text: "Wrap the conversion in a try block and catch the specific error.", xpPenalty: 0.9 },
      { tier: "guide", text: "int() raises ValueError for non-numeric strings.", xpPenalty: 0.75 },
      { tier: "reveal", text: 'try:\n    num = int(input())\n    print(num)\nexcept ValueError:\n    print("Invalid input")', xpPenalty: 0.5 },
    ],
    baseXP: 150,
    tags: ["error-handling", "try-except", "ValueError", "input"],
  },
  {
    id: "challenge:python:t2:error-handling:3",
    nodeId: "python:t2:error-handling",
    type: "write_from_scratch",
    title: "Multi-Exception Handler",
    description:
      'Write a function `safe_access(data, index)` that:\n- Returns `data[index]` if successful\n- Returns `"Index out of range"` for IndexError\n- Returns `"Invalid index type"` for TypeError\n- Always prints `"Attempted access"` regardless of success/failure (use finally)\n\nTest it by calling and printing the result of `safe_access([1, 2, 3], 5)`.',
    difficulty: 3,
    isBoss: true,
    starterCode:
      "def safe_access(data, index):\n    # Handle multiple exceptions\n    pass\n\nprint(safe_access([1, 2, 3], 5))\n",
    testCases: [
      {
        id: "eh3-index",
        input: "",
        expectedOutput: "Attempted access\nIndex out of range",
        visible: true,
        category: "basic",
        description: "Index 5 is out of range for 3-element list",
      },
    ],
    hints: [
      { tier: "nudge", text: "You can have multiple except blocks and a finally block.", xpPenalty: 0.9 },
      { tier: "guide", text: "try/except IndexError/except TypeError/finally — return the error message strings.", xpPenalty: 0.75 },
      { tier: "reveal", text: 'try: return data[index] except IndexError: return "Index out of range" except TypeError: return "Invalid index type" finally: print("Attempted access")', xpPenalty: 0.5 },
    ],
    baseXP: 250,
    tags: ["error-handling", "try-except", "finally", "multiple-exceptions"],
  },

  // ────────────────────────────────────────────────────────────
  // python:t2:match-statement  (3 challenges)
  // ────────────────────────────────────────────────────────────
  {
    id: "challenge:python:t2:match-statement:1",
    nodeId: "python:t2:match-statement",
    type: "fill_in_the_blank",
    title: "Basic Match",
    description:
      'Fill in the blanks to use pattern matching to print the day type.',
    difficulty: 1,
    isBoss: false,
    templateCode:
      'day = "Monday"\n__BLANK__ day:\n    __BLANK__ "Saturday" | "Sunday":\n        print("Weekend")\n    case _:\n        print("Weekday")',
    testCases: [
      {
        id: "ms1-basic",
        input: "",
        expectedOutput: "Weekday",
        visible: true,
        category: "basic",
        description: "Monday is a weekday",
      },
    ],
    hints: [
      { tier: "nudge", text: "Python 3.10+ introduced structural pattern matching.", xpPenalty: 0.9 },
      { tier: "guide", text: "The first blank is `match`, the second is `case`.", xpPenalty: 0.75 },
      { tier: "reveal", text: "Fill in: `match` and `case`", xpPenalty: 0.5 },
    ],
    baseXP: 100,
    tags: ["match-case", "pattern-matching"],
  },
  {
    id: "challenge:python:t2:match-statement:2",
    nodeId: "python:t2:match-statement",
    type: "write_from_scratch",
    title: "HTTP Status Matcher",
    description:
      'Given a variable `status_code` (integer), use a match/case statement to print:\n- 200: "OK"\n- 301: "Moved"\n- 404: "Not Found"\n- 500: "Server Error"\n- Anything else: "Unknown"',
    difficulty: 2,
    isBoss: false,
    starterCode: "status_code = 404\n\n# Use match/case\n",
    testCases: [
      {
        id: "ms2-404",
        input: "",
        expectedOutput: "Not Found",
        visible: true,
        category: "basic",
        description: "404 maps to Not Found",
      },
    ],
    hints: [
      { tier: "nudge", text: "match the status_code variable and provide a case for each code.", xpPenalty: 0.9 },
      { tier: "guide", text: "Use `case 200:`, `case 301:`, etc. Use `case _:` for the default.", xpPenalty: 0.75 },
      { tier: "reveal", text: 'match status_code:\n    case 200: print("OK")\n    case 404: print("Not Found")\n    case _: print("Unknown")', xpPenalty: 0.5 },
    ],
    baseXP: 150,
    tags: ["match-case", "pattern-matching"],
  },
  {
    id: "challenge:python:t2:match-statement:3",
    nodeId: "python:t2:match-statement",
    type: "write_from_scratch",
    title: "Command Parser",
    description:
      'Parse a command tuple and print the action.\n\nGiven `command = ("move", "north", 5)`, use match/case with structural patterns:\n- ("move", direction, distance): print `"Moving {direction} by {distance}"`\n- ("attack", target): print `"Attacking {target}"`\n- ("heal", amount): print `"Healing by {amount}"`\n- _: print `"Unknown command"`',
    difficulty: 3,
    isBoss: true,
    starterCode: 'command = ("move", "north", 5)\n\n# Use match/case with structural patterns\n',
    testCases: [
      {
        id: "ms3-move",
        input: "",
        expectedOutput: "Moving north by 5",
        visible: true,
        category: "basic",
        description: "Destructures move command",
      },
    ],
    hints: [
      { tier: "nudge", text: "Match/case can destructure tuples and bind variables.", xpPenalty: 0.9 },
      { tier: "guide", text: 'Use case ("move", direction, distance): to capture the tuple elements.', xpPenalty: 0.75 },
      { tier: "reveal", text: 'match command:\n    case ("move", direction, distance):\n        print(f"Moving {direction} by {distance}")', xpPenalty: 0.5 },
    ],
    baseXP: 250,
    tags: ["match-case", "destructuring", "pattern-matching", "tuples"],
  },
];
