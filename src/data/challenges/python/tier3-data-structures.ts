import type { Challenge } from "@/lib/types";

/**
 * Tier 3: Data Structures — 22 challenges across 6 nodes
 *
 * Nodes: lists, tuples, dictionaries, sets, list-comprehensions, string-methods
 */
export const tier3Challenges: Challenge[] = [
  // ────────────────────────────────────────────────────────────
  // python:t3:lists  (4 challenges)
  // ────────────────────────────────────────────────────────────
  {
    id: "challenge:python:t3:lists:1",
    nodeId: "python:t3:lists",
    type: "fill_in_the_blank",
    title: "List Basics",
    description:
      "Fill in the blanks to create a list, append an item, and print the length.",
    difficulty: 1,
    isBoss: false,
    templateCode:
      'fruits = ["apple", "banana"]\nfruits.__BLANK__("cherry")\nprint(__BLANK__(fruits))',
    testCases: [
      {
        id: "l1-basic",
        input: "",
        expectedOutput: "3",
        visible: true,
        category: "basic",
        description: "List has 3 items after append",
      },
    ],
    hints: [
      { tier: "nudge", text: "Lists have a method to add items to the end.", xpPenalty: 0.9 },
      { tier: "guide", text: "Use `append` to add and `len` to get the length.", xpPenalty: 0.75 },
      { tier: "reveal", text: "Fill in: `append` and `len`", xpPenalty: 0.5 },
    ],
    baseXP: 100,
    tags: ["lists", "append", "len"],
  },
  {
    id: "challenge:python:t3:lists:2",
    nodeId: "python:t3:lists",
    type: "write_from_scratch",
    title: "List Slicer",
    description:
      "Given `nums = [10, 20, 30, 40, 50, 60, 70, 80]`, print three slices on separate lines:\n1. First 3 elements\n2. Last 3 elements\n3. Every other element (step of 2)",
    difficulty: 2,
    isBoss: false,
    starterCode: "nums = [10, 20, 30, 40, 50, 60, 70, 80]\n\n# Print three slices\n",
    testCases: [
      {
        id: "l2-basic",
        input: "",
        expectedOutput: "[10, 20, 30]\n[60, 70, 80]\n[10, 30, 50, 70]",
        visible: true,
        category: "basic",
        description: "Three different slices",
      },
    ],
    hints: [
      { tier: "nudge", text: "Slicing uses [start:stop:step] notation.", xpPenalty: 0.9 },
      { tier: "guide", text: "First 3: nums[:3], last 3: nums[-3:], every other: nums[::2].", xpPenalty: 0.75 },
      { tier: "reveal", text: "print(nums[:3])\nprint(nums[-3:])\nprint(nums[::2])", xpPenalty: 0.5 },
    ],
    baseXP: 150,
    tags: ["lists", "slicing"],
  },
  {
    id: "challenge:python:t3:lists:3",
    nodeId: "python:t3:lists",
    type: "predict_output",
    title: "List Mutation",
    description:
      "What does this code print?\n\n```python\na = [1, 2, 3]\nb = a\nb.append(4)\nprint(a)\nprint(a is b)\n```",
    difficulty: 2,
    isBoss: false,
    testCases: [
      {
        id: "l3-basic",
        input: "",
        expectedOutput: "[1, 2, 3, 4]\nTrue",
        visible: true,
        category: "basic",
        description: "Both variables reference the same list",
      },
    ],
    hints: [
      { tier: "nudge", text: "Assignment with `=` does not copy a list — think about references.", xpPenalty: 0.9 },
      { tier: "guide", text: "b = a makes b point to the same list object as a.", xpPenalty: 0.75 },
      { tier: "reveal", text: "Both a and b refer to the same list. Appending via b affects a too. Output: [1, 2, 3, 4] then True.", xpPenalty: 0.5 },
    ],
    baseXP: 150,
    tags: ["lists", "references", "mutation", "identity"],
  },
  {
    id: "challenge:python:t3:lists:4",
    nodeId: "python:t3:lists",
    type: "write_from_scratch",
    title: "Remove Duplicates (Preserve Order)",
    description:
      "Write a function `remove_dupes(items)` that returns a new list with duplicates removed, preserving the original order of first appearance.\n\nPrint the result of `remove_dupes([3, 1, 4, 1, 5, 9, 2, 6, 5, 3])`.",
    difficulty: 3,
    isBoss: true,
    starterCode:
      "def remove_dupes(items):\n    # Return list with duplicates removed, preserving order\n    pass\n\nprint(remove_dupes([3, 1, 4, 1, 5, 9, 2, 6, 5, 3]))\n",
    testCases: [
      {
        id: "l4-basic",
        input: "",
        expectedOutput: "[3, 1, 4, 5, 9, 2, 6]",
        visible: true,
        category: "basic",
        description: "Duplicates removed, order preserved",
      },
      {
        id: "l4-empty",
        input: "",
        expectedOutput: "[]",
        visible: false,
        category: "edge",
        description: "Empty list returns empty list",
      },
    ],
    hints: [
      { tier: "nudge", text: "You need to track which items you have already seen.", xpPenalty: 0.9 },
      { tier: "guide", text: "Use a set to track seen items and a list to build the result.", xpPenalty: 0.75 },
      { tier: "reveal", text: "seen = set(); result = []; for x in items: if x not in seen: seen.add(x); result.append(x); return result", xpPenalty: 0.5 },
    ],
    baseXP: 250,
    tags: ["lists", "sets", "deduplication", "order"],
  },

  // ────────────────────────────────────────────────────────────
  // python:t3:tuples  (3 challenges)
  // ────────────────────────────────────────────────────────────
  {
    id: "challenge:python:t3:tuples:1",
    nodeId: "python:t3:tuples",
    type: "multiple_choice",
    title: "Tuple Immutability",
    description:
      "What happens when you run this code?\n\n```python\nt = (1, 2, 3)\nt[0] = 10\n```",
    difficulty: 1,
    isBoss: false,
    options: [
      { id: "a", text: "TypeError: 'tuple' object does not support item assignment", isCorrect: true, explanation: "Tuples are immutable — you cannot change their elements after creation." },
      { id: "b", text: "The tuple becomes (10, 2, 3)", isCorrect: false, explanation: "Tuples are immutable and do not allow item assignment." },
      { id: "c", text: "A new tuple (10, 2, 3) is created", isCorrect: false, explanation: "No new tuple is created; the assignment itself raises an error." },
      { id: "d", text: "IndexError: tuple index out of range", isCorrect: false, explanation: "Index 0 is valid. The error is about mutability, not indexing." },
    ],
    hints: [
      { tier: "nudge", text: "Tuples and lists differ in one fundamental property.", xpPenalty: 0.9 },
      { tier: "guide", text: "Tuples are immutable — they cannot be changed after creation.", xpPenalty: 0.75 },
      { tier: "reveal", text: "Assigning to a tuple index raises TypeError because tuples are immutable.", xpPenalty: 0.5 },
    ],
    baseXP: 100,
    tags: ["tuples", "immutability", "TypeError"],
  },
  {
    id: "challenge:python:t3:tuples:2",
    nodeId: "python:t3:tuples",
    type: "write_from_scratch",
    title: "Tuple Unpacking",
    description:
      'Given a list of tuples representing (name, age) pairs:\n```python\npeople = [("Alice", 30), ("Bob", 25), ("Charlie", 35)]\n```\nUse tuple unpacking in a for loop to print each person\'s info in the format: `Alice is 30 years old`',
    difficulty: 2,
    isBoss: false,
    starterCode:
      'people = [("Alice", 30), ("Bob", 25), ("Charlie", 35)]\n\n# Unpack and print\n',
    testCases: [
      {
        id: "tp2-basic",
        input: "",
        expectedOutput: "Alice is 30 years old\nBob is 25 years old\nCharlie is 35 years old",
        visible: true,
        category: "basic",
        description: "All three people printed",
      },
    ],
    hints: [
      { tier: "nudge", text: "You can unpack tuple elements directly in the for loop header.", xpPenalty: 0.9 },
      { tier: "guide", text: "Use: for name, age in people:", xpPenalty: 0.75 },
      { tier: "reveal", text: 'for name, age in people:\n    print(f"{name} is {age} years old")', xpPenalty: 0.5 },
    ],
    baseXP: 150,
    tags: ["tuples", "unpacking", "for-loop", "f-strings"],
  },
  {
    id: "challenge:python:t3:tuples:3",
    nodeId: "python:t3:tuples",
    type: "write_from_scratch",
    title: "Named Tuple Record",
    description:
      'Create a named tuple `Point` with fields `x` and `y`. Create a point at (3, 4), compute the distance from the origin using the Pythagorean theorem, and print the result rounded to 2 decimal places.',
    difficulty: 3,
    isBoss: true,
    starterCode:
      "from collections import namedtuple\n\n# Create Point namedtuple, instantiate, compute distance\n",
    testCases: [
      {
        id: "tp3-basic",
        input: "",
        expectedOutput: "5.0",
        visible: true,
        category: "basic",
        description: "Distance of (3,4) from origin is 5.0",
      },
    ],
    hints: [
      { tier: "nudge", text: "namedtuple() takes a name string and a list of field names.", xpPenalty: 0.9 },
      { tier: "guide", text: 'Point = namedtuple("Point", ["x", "y"]). Distance = sqrt(x**2 + y**2).', xpPenalty: 0.75 },
      { tier: "reveal", text: 'Point = namedtuple("Point", ["x", "y"])\np = Point(3, 4)\nprint(round((p.x**2 + p.y**2)**0.5, 2))', xpPenalty: 0.5 },
    ],
    baseXP: 250,
    tags: ["tuples", "namedtuple", "math", "collections"],
  },

  // ────────────────────────────────────────────────────────────
  // python:t3:dictionaries  (4 challenges)
  // ────────────────────────────────────────────────────────────
  {
    id: "challenge:python:t3:dictionaries:1",
    nodeId: "python:t3:dictionaries",
    type: "fill_in_the_blank",
    title: "Dict Access",
    description:
      "Fill in the blanks to safely access a dictionary key with a default value.",
    difficulty: 1,
    isBoss: false,
    templateCode:
      'scores = {"Alice": 95, "Bob": 87}\ncharlie_score = scores.__BLANK__("Charlie", 0)\nprint(charlie_score)',
    testCases: [
      {
        id: "d1-basic",
        input: "",
        expectedOutput: "0",
        visible: true,
        category: "basic",
        description: "Charlie not in dict, returns default 0",
      },
    ],
    hints: [
      { tier: "nudge", text: "There is a dict method that returns a default if the key is missing.", xpPenalty: 0.9 },
      { tier: "guide", text: "The .get() method accepts a key and a default value.", xpPenalty: 0.75 },
      { tier: "reveal", text: "Fill in: get", xpPenalty: 0.5 },
    ],
    baseXP: 100,
    tags: ["dictionaries", "get", "default-value"],
  },
  {
    id: "challenge:python:t3:dictionaries:2",
    nodeId: "python:t3:dictionaries",
    type: "write_from_scratch",
    title: "Word Counter",
    description:
      'Given a string `text = "the cat sat on the mat the cat"`, build a dictionary that counts the frequency of each word and print it.\n\nExpected output (dict print order): `{\'the\': 3, \'cat\': 2, \'sat\': 1, \'on\': 1, \'mat\': 1}`',
    difficulty: 2,
    isBoss: false,
    starterCode:
      'text = "the cat sat on the mat the cat"\n\n# Count word frequencies\n',
    testCases: [
      {
        id: "d2-basic",
        input: "",
        expectedOutput: "{'the': 3, 'cat': 2, 'sat': 1, 'on': 1, 'mat': 1}",
        visible: true,
        category: "basic",
        description: "Word frequencies counted correctly",
      },
    ],
    hints: [
      { tier: "nudge", text: "Split the string into words, then count each one.", xpPenalty: 0.9 },
      { tier: "guide", text: "Use a dict and increment counts: counts[word] = counts.get(word, 0) + 1", xpPenalty: 0.75 },
      { tier: "reveal", text: "counts = {}\nfor word in text.split():\n    counts[word] = counts.get(word, 0) + 1\nprint(counts)", xpPenalty: 0.5 },
    ],
    baseXP: 150,
    tags: ["dictionaries", "word-count", "strings", "iteration"],
  },
  {
    id: "challenge:python:t3:dictionaries:3",
    nodeId: "python:t3:dictionaries",
    type: "predict_output",
    title: "Dict Iteration",
    description:
      'What does this code print?\n\n```python\nd = {"a": 1, "b": 2, "c": 3}\nfor k, v in d.items():\n    if v > 1:\n        print(f"{k}={v}")\n```',
    difficulty: 2,
    isBoss: false,
    testCases: [
      {
        id: "d3-basic",
        input: "",
        expectedOutput: "b=2\nc=3",
        visible: true,
        category: "basic",
        description: "Only values > 1 are printed",
      },
    ],
    hints: [
      { tier: "nudge", text: ".items() gives you key-value pairs to iterate over.", xpPenalty: 0.9 },
      { tier: "guide", text: "The filter v > 1 excludes 'a'=1. Only 'b'=2 and 'c'=3 pass.", xpPenalty: 0.75 },
      { tier: "reveal", text: "Output: b=2 then c=3 (on separate lines).", xpPenalty: 0.5 },
    ],
    baseXP: 150,
    tags: ["dictionaries", "items", "iteration", "filtering"],
  },
  {
    id: "challenge:python:t3:dictionaries:4",
    nodeId: "python:t3:dictionaries",
    type: "write_from_scratch",
    title: "Invert a Dictionary",
    description:
      'Write a function `invert_dict(d)` that swaps keys and values. If multiple keys share the same value, collect them in a list.\n\nTest: `print(invert_dict({"a": 1, "b": 2, "c": 1}))`\n\nExpected: `{1: [\'a\', \'c\'], 2: [\'b\']}`',
    difficulty: 3,
    isBoss: true,
    starterCode:
      "def invert_dict(d):\n    # Swap keys and values, grouping duplicate values\n    pass\n\nprint(invert_dict({\"a\": 1, \"b\": 2, \"c\": 1}))\n",
    testCases: [
      {
        id: "d4-basic",
        input: "",
        expectedOutput: "{1: ['a', 'c'], 2: ['b']}",
        visible: true,
        category: "basic",
        description: "Values become keys, original keys grouped in lists",
      },
      {
        id: "d4-empty",
        input: "",
        expectedOutput: "{}",
        visible: false,
        category: "edge",
        description: "Empty dict returns empty dict",
      },
    ],
    hints: [
      { tier: "nudge", text: "Build a new dict where old values become keys and old keys become list values.", xpPenalty: 0.9 },
      { tier: "guide", text: "Use setdefault() or defaultdict to create lists for each value.", xpPenalty: 0.75 },
      { tier: "reveal", text: "result = {}\nfor k, v in d.items():\n    result.setdefault(v, []).append(k)\nreturn result", xpPenalty: 0.5 },
    ],
    baseXP: 250,
    tags: ["dictionaries", "inversion", "setdefault", "grouping"],
  },

  // ────────────────────────────────────────────────────────────
  // python:t3:sets  (4 challenges)
  // ────────────────────────────────────────────────────────────
  {
    id: "challenge:python:t3:sets:1",
    nodeId: "python:t3:sets",
    type: "multiple_choice",
    title: "Set Properties",
    description: "Which statement about Python sets is true?",
    difficulty: 1,
    isBoss: false,
    options: [
      { id: "a", text: "Sets contain only unique elements and are unordered", isCorrect: true, explanation: "Sets automatically deduplicate and have no guaranteed order." },
      { id: "b", text: "Sets maintain insertion order like lists", isCorrect: false, explanation: "Sets are unordered; insertion order is not preserved." },
      { id: "c", text: "Sets can contain mutable elements like lists", isCorrect: false, explanation: "Set elements must be hashable (immutable)." },
      { id: "d", text: "Sets allow duplicate elements", isCorrect: false, explanation: "Duplicates are automatically removed in a set." },
    ],
    hints: [
      { tier: "nudge", text: "Sets are similar to mathematical sets.", xpPenalty: 0.9 },
      { tier: "guide", text: "Think about uniqueness and ordering.", xpPenalty: 0.75 },
      { tier: "reveal", text: "Sets contain only unique elements and are unordered.", xpPenalty: 0.5 },
    ],
    baseXP: 100,
    tags: ["sets", "properties", "uniqueness"],
  },
  {
    id: "challenge:python:t3:sets:2",
    nodeId: "python:t3:sets",
    type: "write_from_scratch",
    title: "Set Operations",
    description:
      'Given two sets:\n```python\na = {1, 2, 3, 4, 5}\nb = {4, 5, 6, 7, 8}\n```\nPrint on separate lines:\n1. The intersection (common elements, sorted)\n2. The union (all elements, sorted)\n3. Elements in `a` but not in `b` (sorted)',
    difficulty: 2,
    isBoss: false,
    starterCode: "a = {1, 2, 3, 4, 5}\nb = {4, 5, 6, 7, 8}\n\n# Print set operations\n",
    testCases: [
      {
        id: "s2-basic",
        input: "",
        expectedOutput: "[4, 5]\n[1, 2, 3, 4, 5, 6, 7, 8]\n[1, 2, 3]",
        visible: true,
        category: "basic",
        description: "Intersection, union, and difference",
      },
    ],
    hints: [
      { tier: "nudge", text: "Sets have operators and methods for mathematical set operations.", xpPenalty: 0.9 },
      { tier: "guide", text: "Use & for intersection, | for union, - for difference. sorted() to sort.", xpPenalty: 0.75 },
      { tier: "reveal", text: "print(sorted(a & b))\nprint(sorted(a | b))\nprint(sorted(a - b))", xpPenalty: 0.5 },
    ],
    baseXP: 150,
    tags: ["sets", "intersection", "union", "difference"],
  },
  {
    id: "challenge:python:t3:sets:3",
    nodeId: "python:t3:sets",
    type: "predict_output",
    title: "Set Deduplication",
    description:
      "What does this code print?\n\n```python\nwords = [\"hello\", \"world\", \"hello\", \"python\", \"world\"]\nunique = set(words)\nprint(len(unique))\nprint(sorted(unique))\n```",
    difficulty: 2,
    isBoss: false,
    testCases: [
      {
        id: "s3-basic",
        input: "",
        expectedOutput: "3\n['hello', 'python', 'world']",
        visible: true,
        category: "basic",
        description: "3 unique words, sorted alphabetically",
      },
    ],
    hints: [
      { tier: "nudge", text: "Converting a list to a set removes duplicates.", xpPenalty: 0.9 },
      { tier: "guide", text: "The set will have 3 elements. sorted() returns them in alphabetical order.", xpPenalty: 0.75 },
      { tier: "reveal", text: "3 unique words: hello, python, world. Sorted: ['hello', 'python', 'world']", xpPenalty: 0.5 },
    ],
    baseXP: 150,
    tags: ["sets", "deduplication", "sorted"],
  },
  {
    id: "challenge:python:t3:sets:4",
    nodeId: "python:t3:sets",
    type: "write_from_scratch",
    title: "Common Elements Finder",
    description:
      "Write a function `find_common(*lists)` that accepts any number of lists and returns a sorted list of elements common to ALL of them.\n\nTest: `print(find_common([1,2,3,4], [2,3,4,5], [3,4,5,6]))`\nExpected: `[3, 4]`",
    difficulty: 3,
    isBoss: true,
    starterCode:
      "def find_common(*lists):\n    # Find elements common to all lists\n    pass\n\nprint(find_common([1,2,3,4], [2,3,4,5], [3,4,5,6]))\n",
    testCases: [
      {
        id: "s4-basic",
        input: "",
        expectedOutput: "[3, 4]",
        visible: true,
        category: "basic",
        description: "3 and 4 are in all three lists",
      },
      {
        id: "s4-none",
        input: "",
        expectedOutput: "[]",
        visible: false,
        category: "edge",
        description: "No common elements returns empty list",
      },
    ],
    hints: [
      { tier: "nudge", text: "Convert each list to a set and find what they all share.", xpPenalty: 0.9 },
      { tier: "guide", text: "Use set.intersection() across all sets, then sort.", xpPenalty: 0.75 },
      { tier: "reveal", text: "result = set(lists[0])\nfor lst in lists[1:]:\n    result &= set(lst)\nreturn sorted(result)", xpPenalty: 0.5 },
    ],
    baseXP: 250,
    tags: ["sets", "intersection", "variadic", "sorted"],
  },

  // ────────────────────────────────────────────────────────────
  // python:t3:list-comprehensions  (4 challenges)
  // ────────────────────────────────────────────────────────────
  {
    id: "challenge:python:t3:list-comprehensions:1",
    nodeId: "python:t3:list-comprehensions",
    type: "fill_in_the_blank",
    title: "Basic Comprehension",
    description: "Fill in the blank to create a list of squares from 1 to 5.",
    difficulty: 1,
    isBoss: false,
    templateCode: "squares = [__BLANK__ for x in range(1, 6)]\nprint(squares)",
    testCases: [
      {
        id: "lc1-basic",
        input: "",
        expectedOutput: "[1, 4, 9, 16, 25]",
        visible: true,
        category: "basic",
        description: "Squares of 1 through 5",
      },
    ],
    hints: [
      { tier: "nudge", text: "The expression before `for` determines what goes into the list.", xpPenalty: 0.9 },
      { tier: "guide", text: "Use the exponentiation operator to square x.", xpPenalty: 0.75 },
      { tier: "reveal", text: "Fill in: x ** 2", xpPenalty: 0.5 },
    ],
    baseXP: 100,
    tags: ["list-comprehensions", "range", "math"],
  },
  {
    id: "challenge:python:t3:list-comprehensions:2",
    nodeId: "python:t3:list-comprehensions",
    type: "write_from_scratch",
    title: "Filtered Comprehension",
    description:
      "Using a list comprehension, create a list of even numbers from 1 to 20 and print it.",
    difficulty: 2,
    isBoss: false,
    starterCode: "# Create list of even numbers 1-20 using a comprehension\n",
    testCases: [
      {
        id: "lc2-basic",
        input: "",
        expectedOutput: "[2, 4, 6, 8, 10, 12, 14, 16, 18, 20]",
        visible: true,
        category: "basic",
        description: "Even numbers from 1 to 20",
      },
    ],
    hints: [
      { tier: "nudge", text: "Comprehensions can have an `if` clause for filtering.", xpPenalty: 0.9 },
      { tier: "guide", text: "Add `if x % 2 == 0` after the range to filter evens.", xpPenalty: 0.75 },
      { tier: "reveal", text: "print([x for x in range(1, 21) if x % 2 == 0])", xpPenalty: 0.5 },
    ],
    baseXP: 150,
    tags: ["list-comprehensions", "filtering", "modulo"],
  },
  {
    id: "challenge:python:t3:list-comprehensions:3",
    nodeId: "python:t3:list-comprehensions",
    type: "write_from_scratch",
    title: "Dict Comprehension",
    description:
      'Given a list of words, create a dictionary mapping each word to its length using a dict comprehension.\n\n```python\nwords = ["hello", "world", "python", "code"]\n```\nPrint the resulting dictionary.',
    difficulty: 2,
    isBoss: false,
    starterCode:
      'words = ["hello", "world", "python", "code"]\n\n# Create {word: length} dict using comprehension\n',
    testCases: [
      {
        id: "lc3-basic",
        input: "",
        expectedOutput: "{'hello': 5, 'world': 5, 'python': 6, 'code': 4}",
        visible: true,
        category: "basic",
        description: "Each word mapped to its length",
      },
    ],
    hints: [
      { tier: "nudge", text: "Dict comprehensions use {key: value for item in iterable} syntax.", xpPenalty: 0.9 },
      { tier: "guide", text: "Use word as the key and len(word) as the value.", xpPenalty: 0.75 },
      { tier: "reveal", text: "print({word: len(word) for word in words})", xpPenalty: 0.5 },
    ],
    baseXP: 150,
    tags: ["dict-comprehension", "len", "mapping"],
  },
  {
    id: "challenge:python:t3:list-comprehensions:4",
    nodeId: "python:t3:list-comprehensions",
    type: "write_from_scratch",
    title: "Flatten Nested List",
    description:
      "Using a nested list comprehension, flatten `matrix = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]` into a single list and print it.",
    difficulty: 3,
    isBoss: true,
    starterCode:
      "matrix = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]\n\n# Flatten with a nested comprehension\n",
    testCases: [
      {
        id: "lc4-basic",
        input: "",
        expectedOutput: "[1, 2, 3, 4, 5, 6, 7, 8, 9]",
        visible: true,
        category: "basic",
        description: "Flattened matrix",
      },
    ],
    hints: [
      { tier: "nudge", text: "Nested comprehensions have two `for` clauses.", xpPenalty: 0.9 },
      { tier: "guide", text: "The outer for iterates rows, the inner for iterates elements: [elem for row in matrix for elem in row].", xpPenalty: 0.75 },
      { tier: "reveal", text: "print([elem for row in matrix for elem in row])", xpPenalty: 0.5 },
    ],
    baseXP: 250,
    tags: ["list-comprehensions", "nested", "flatten", "matrix"],
  },

  // ────────────────────────────────────────────────────────────
  // python:t3:string-methods  (3 challenges)
  // ────────────────────────────────────────────────────────────
  {
    id: "challenge:python:t3:string-methods:1",
    nodeId: "python:t3:string-methods",
    type: "fill_in_the_blank",
    title: "Join Strings",
    description:
      'Fill in the blank to join a list of words with a comma and space.',
    difficulty: 1,
    isBoss: false,
    templateCode:
      'words = ["apple", "banana", "cherry"]\nresult = __BLANK__.join(words)\nprint(result)',
    testCases: [
      {
        id: "sm1-basic",
        input: "",
        expectedOutput: "apple, banana, cherry",
        visible: true,
        category: "basic",
        description: "Words joined by comma-space",
      },
    ],
    hints: [
      { tier: "nudge", text: "The separator string calls .join() on the list.", xpPenalty: 0.9 },
      { tier: "guide", text: "The separator goes before .join(): separator.join(list)", xpPenalty: 0.75 },
      { tier: "reveal", text: 'Fill in: ", "', xpPenalty: 0.5 },
    ],
    baseXP: 100,
    tags: ["strings", "join", "lists"],
  },
  {
    id: "challenge:python:t3:string-methods:2",
    nodeId: "python:t3:string-methods",
    type: "write_from_scratch",
    title: "Title Case Converter",
    description:
      'Write a function `to_title_case(s)` that converts a string to title case where each word is capitalized. Do NOT use the built-in .title() method — handle it manually with split() and join().\n\nTest: `print(to_title_case("hello beautiful world"))`\nExpected: `Hello Beautiful World`',
    difficulty: 2,
    isBoss: false,
    starterCode:
      'def to_title_case(s):\n    # Convert to title case without .title()\n    pass\n\nprint(to_title_case("hello beautiful world"))\n',
    testCases: [
      {
        id: "sm2-basic",
        input: "",
        expectedOutput: "Hello Beautiful World",
        visible: true,
        category: "basic",
        description: "Each word capitalized",
      },
      {
        id: "sm2-single",
        input: "",
        expectedOutput: "Python",
        visible: false,
        category: "edge",
        description: "Single word",
      },
    ],
    hints: [
      { tier: "nudge", text: "Split into words, capitalize each, then join back.", xpPenalty: 0.9 },
      { tier: "guide", text: "Use .capitalize() on each word after splitting.", xpPenalty: 0.75 },
      { tier: "reveal", text: 'return " ".join(word.capitalize() for word in s.split())', xpPenalty: 0.5 },
    ],
    baseXP: 150,
    tags: ["strings", "split", "join", "capitalize"],
  },
  {
    id: "challenge:python:t3:string-methods:3",
    nodeId: "python:t3:string-methods",
    type: "write_from_scratch",
    title: "CSV Line Parser",
    description:
      'Write a function `parse_csv_line(line)` that splits a CSV line by commas, strips whitespace from each field, and returns a list of non-empty fields.\n\nTest: `print(parse_csv_line("  Alice , 30 ,  , Engineer "))`\nExpected: `[\'Alice\', \'30\', \'Engineer\']`',
    difficulty: 3,
    isBoss: true,
    starterCode:
      'def parse_csv_line(line):\n    # Parse CSV line: split, strip, filter empty\n    pass\n\nprint(parse_csv_line("  Alice , 30 ,  , Engineer "))\n',
    testCases: [
      {
        id: "sm3-basic",
        input: "",
        expectedOutput: "['Alice', '30', 'Engineer']",
        visible: true,
        category: "basic",
        description: "Parsed and cleaned CSV fields",
      },
      {
        id: "sm3-empty",
        input: "",
        expectedOutput: "[]",
        visible: false,
        category: "edge",
        description: "Empty string returns empty list",
      },
    ],
    hints: [
      { tier: "nudge", text: "Chain split, strip, and filter in sequence.", xpPenalty: 0.9 },
      { tier: "guide", text: "Split by comma, strip each field, filter out empty strings.", xpPenalty: 0.75 },
      { tier: "reveal", text: 'return [field.strip() for field in line.split(",") if field.strip()]', xpPenalty: 0.5 },
    ],
    baseXP: 250,
    tags: ["strings", "split", "strip", "comprehensions", "csv"],
  },
];
