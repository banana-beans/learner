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
// python:t3:lists  (4 cards)
// ────────────────────────────────────────────────────────────

const lists: ReviewCard[] = [
  makeCard({
    id: "card:python:t3:lists:1",
    nodeId: "python:t3:lists",
    branchId: "python",
    type: "code_output",
    front: "What does this code print?",
    code: 'nums = [1, 2, 3, 4, 5]\nnums.append(6)\nnums.insert(0, 0)\nprint(nums)\nprint(len(nums))',
    expectedOutput: "[0, 1, 2, 3, 4, 5, 6]\n7",
    back: "append(6) adds 6 to the end. insert(0, 0) inserts 0 at index 0 (the beginning). The resulting list has 7 elements. Both methods mutate the list in place.",
  }),
  makeCard({
    id: "card:python:t3:lists:2",
    nodeId: "python:t3:lists",
    branchId: "python",
    type: "bug_spot",
    front: "Find the bug in this code.",
    code: 'a = [1, 2, 3]\nb = a\nb.append(4)\nprint(a)  # Expected: [1, 2, 3]',
    back: "b = a does not create a copy — both a and b reference the same list object. Mutating b also mutates a. To make an independent copy, use b = a.copy(), b = a[:], or b = list(a). This is a common gotcha with mutable objects in Python.",
  }),
  makeCard({
    id: "card:python:t3:lists:3",
    nodeId: "python:t3:lists",
    branchId: "python",
    type: "code_output",
    front: "What does this code print?",
    code: 'items = [3, 1, 4, 1, 5]\nprint(items.pop())\nprint(items.count(1))\nitems.sort()\nprint(items)',
    expectedOutput: "5\n2\n[1, 1, 3, 4]",
    back: "pop() removes and returns the last element (5). count(1) returns how many times 1 appears (twice). sort() sorts the remaining list in place in ascending order.",
  }),
  makeCard({
    id: "card:python:t3:lists:4",
    nodeId: "python:t3:lists",
    branchId: "python",
    type: "concept",
    front: "What is the difference between list.sort() and sorted(list)?",
    back: "list.sort() sorts the list in place and returns None. sorted(list) returns a new sorted list, leaving the original unchanged. Use sort() when you no longer need the original order and want to save memory. Use sorted() when you need to keep the original list intact or when sorting any iterable (not just lists).",
  }),
];

// ────────────────────────────────────────────────────────────
// python:t3:list-comprehensions  (4 cards)
// ────────────────────────────────────────────────────────────

const listComprehensions: ReviewCard[] = [
  makeCard({
    id: "card:python:t3:list-comprehensions:1",
    nodeId: "python:t3:list-comprehensions",
    branchId: "python",
    type: "code_output",
    front: "What does this code print?",
    code: 'squares = [x ** 2 for x in range(5)]\nprint(squares)',
    expectedOutput: "[0, 1, 4, 9, 16]",
    back: "The list comprehension evaluates x ** 2 for each x in range(5) — that is, for x = 0, 1, 2, 3, 4. This produces the squares [0, 1, 4, 9, 16] in a single concise expression.",
  }),
  makeCard({
    id: "card:python:t3:list-comprehensions:2",
    nodeId: "python:t3:list-comprehensions",
    branchId: "python",
    type: "code_output",
    front: "What does this code print?",
    code: 'words = ["Hello", "WORLD", "Python"]\nresult = [w.lower() for w in words if len(w) > 5]\nprint(result)',
    expectedOutput: "['python']",
    back: "The comprehension filters words to only those with length > 5. 'Hello' (5) is excluded, 'WORLD' (5) is excluded, 'Python' (6) is included. Then .lower() is applied, yielding ['python'].",
  }),
  makeCard({
    id: "card:python:t3:list-comprehensions:3",
    nodeId: "python:t3:list-comprehensions",
    branchId: "python",
    type: "fill_blank",
    front: "Fill in the blanks to create a list of even numbers from 0 to 19.",
    code: 'evens = [x __BLANK__ x in range(20) __BLANK__ x % 2 == 0]\nprint(evens[:5])',
    blanks: ["for", "if"],
    back: "The syntax is [expression for variable in iterable if condition]. 'for' introduces the iteration and 'if' adds a filter. This produces [0, 2, 4, 6, 8, 10, 12, 14, 16, 18].",
  }),
  makeCard({
    id: "card:python:t3:list-comprehensions:4",
    nodeId: "python:t3:list-comprehensions",
    branchId: "python",
    type: "explain",
    front: "Explain when you should use a list comprehension versus a regular for loop.",
    back: "Use a list comprehension when you are transforming or filtering an iterable into a new list with a simple expression — it is more concise and often faster. Use a regular for loop when: the logic involves multiple statements, side effects (like printing), complex conditionals, or error handling. Also avoid comprehensions when they hurt readability — a comprehension spanning 3+ lines is usually clearer as a loop.",
  }),
];

// ────────────────────────────────────────────────────────────
// python:t3:tuples  (3 cards)
// ────────────────────────────────────────────────────────────

const tuples: ReviewCard[] = [
  makeCard({
    id: "card:python:t3:tuples:1",
    nodeId: "python:t3:tuples",
    branchId: "python",
    type: "code_output",
    front: "What does this code print?",
    code: 't = (1, 2, 3)\nprint(t[1])\nprint(t + (4, 5))\nprint(len(t))',
    expectedOutput: "2\n(1, 2, 3, 4, 5)\n3",
    back: "Tuples support indexing (t[1] is 2) and concatenation with + (creating a new tuple). len() returns the number of elements. The original tuple t is unchanged because tuples are immutable.",
  }),
  makeCard({
    id: "card:python:t3:tuples:2",
    nodeId: "python:t3:tuples",
    branchId: "python",
    type: "concept",
    front: "Why would you use a tuple instead of a list?",
    back: "Tuples are immutable, which means: (1) They can be used as dictionary keys and set elements (lists cannot). (2) They signal intent — the data should not change. (3) They are slightly more memory-efficient and faster to create than lists. (4) They are ideal for fixed collections like coordinates (x, y), database rows, or function return values. Use lists when you need to add, remove, or modify elements.",
  }),
  makeCard({
    id: "card:python:t3:tuples:3",
    nodeId: "python:t3:tuples",
    branchId: "python",
    type: "code_output",
    front: "What does this code print?",
    code: 'a, *b, c = (1, 2, 3, 4, 5)\nprint(a)\nprint(b)\nprint(c)',
    expectedOutput: "1\n[2, 3, 4]\n5",
    back: "The * operator in unpacking collects the 'middle' elements into a list. a gets the first value (1), c gets the last value (5), and *b captures everything in between as a list [2, 3, 4]. This is called extended unpacking.",
  }),
];

// ────────────────────────────────────────────────────────────
// python:t3:dictionaries  (4 cards)
// ────────────────────────────────────────────────────────────

const dictionaries: ReviewCard[] = [
  makeCard({
    id: "card:python:t3:dictionaries:1",
    nodeId: "python:t3:dictionaries",
    branchId: "python",
    type: "code_output",
    front: "What does this code print?",
    code: 'd = {"a": 1, "b": 2, "c": 3}\nprint(d.get("b"))\nprint(d.get("z", 0))\nprint(list(d.keys()))',
    expectedOutput: "2\n0\n['a', 'b', 'c']",
    back: "d.get('b') returns 2 (the value for key 'b'). d.get('z', 0) returns the default 0 because 'z' is not in the dict (unlike d['z'] which would raise KeyError). d.keys() returns the keys as a view; wrapping in list() produces a list.",
  }),
  makeCard({
    id: "card:python:t3:dictionaries:2",
    nodeId: "python:t3:dictionaries",
    branchId: "python",
    type: "concept",
    front: "What is the time complexity of dictionary lookup in Python, and why?",
    back: "Dictionary lookup is O(1) average case because Python dictionaries are implemented as hash tables. Keys are hashed to compute an index into an internal array, allowing direct access without scanning. Worst case is O(n) due to hash collisions, but Python's hash table implementation keeps this extremely rare.",
  }),
  makeCard({
    id: "card:python:t3:dictionaries:3",
    nodeId: "python:t3:dictionaries",
    branchId: "python",
    type: "code_output",
    front: "What does this code print?",
    code: 'inventory = {"apples": 3, "bananas": 5}\ninventory["apples"] += 2\ninventory["cherries"] = 10\ndel inventory["bananas"]\nprint(inventory)',
    expectedOutput: "{'apples': 5, 'cherries': 10}",
    back: "Dictionaries are mutable: += updates the existing value, assigning to a new key adds it, and del removes a key-value pair. The final dict has apples (3+2=5) and cherries (10); bananas was deleted.",
  }),
  makeCard({
    id: "card:python:t3:dictionaries:4",
    nodeId: "python:t3:dictionaries",
    branchId: "python",
    type: "fill_blank",
    front: "Fill in the blank to iterate over both keys and values of a dictionary.",
    code: 'scores = {"Alice": 95, "Bob": 87}\nfor name, score in scores.__BLANK__():\n    print(f"{name}: {score}")',
    blanks: ["items"],
    back: "dict.items() returns key-value pairs as (key, value) tuples, allowing you to unpack both in the for loop. dict.keys() gives only keys, and dict.values() gives only values.",
  }),
];

// ────────────────────────────────────────────────────────────
// python:t3:sets  (3 cards)
// ────────────────────────────────────────────────────────────

const sets: ReviewCard[] = [
  makeCard({
    id: "card:python:t3:sets:1",
    nodeId: "python:t3:sets",
    branchId: "python",
    type: "code_output",
    front: "What does this code print?",
    code: 'a = {1, 2, 3, 4}\nb = {3, 4, 5, 6}\nprint(a & b)\nprint(a | b)\nprint(a - b)',
    expectedOutput: "{3, 4}\n{1, 2, 3, 4, 5, 6}\n{1, 2}",
    back: "& is intersection (elements in both sets). | is union (elements in either set). - is difference (elements in a but not in b). Sets automatically handle uniqueness.",
  }),
  makeCard({
    id: "card:python:t3:sets:2",
    nodeId: "python:t3:sets",
    branchId: "python",
    type: "concept",
    front: "Why can't you use a list as a set element or dictionary key?",
    back: "Sets and dictionary keys require their elements to be hashable — they must have a stable hash value that never changes. Lists are mutable (you can append, remove, etc.), which means their content can change after insertion, breaking the hash table invariant. Use tuples instead — they are immutable and therefore hashable (as long as all their elements are also hashable).",
  }),
  makeCard({
    id: "card:python:t3:sets:3",
    nodeId: "python:t3:sets",
    branchId: "python",
    type: "code_output",
    front: "What does this code print?",
    code: 'nums = [1, 2, 2, 3, 3, 3]\nunique = list(set(nums))\nunique.sort()\nprint(unique)\nprint(len(set(nums)))',
    expectedOutput: "[1, 2, 3]\n3",
    back: "Converting a list to a set removes duplicates. Converting back to a list and sorting gives [1, 2, 3]. len(set(nums)) counts unique elements: 3. Note: set() does not preserve order, so sorting is needed for a predictable result.",
  }),
];

// ────────────────────────────────────────────────────────────
// python:t3:nested-structures  (3 cards)
// ────────────────────────────────────────────────────────────

const nestedStructures: ReviewCard[] = [
  makeCard({
    id: "card:python:t3:nested-structures:1",
    nodeId: "python:t3:nested-structures",
    branchId: "python",
    type: "code_output",
    front: "What does this code print?",
    code: 'data = {"users": [{"name": "Alice", "age": 30}, {"name": "Bob", "age": 25}]}\nprint(data["users"][1]["name"])\nprint(data["users"][0]["age"])',
    expectedOutput: "Bob\n30",
    back: 'data["users"] is a list of dicts. Index [1] is the second dict {"name": "Bob", "age": 25}. Then ["name"] retrieves "Bob". Similarly, [0]["age"] gets 30 from Alice\'s dict.',
  }),
  makeCard({
    id: "card:python:t3:nested-structures:2",
    nodeId: "python:t3:nested-structures",
    branchId: "python",
    type: "code_output",
    front: "What does this code print?",
    code: 'matrix = [[1, 2], [3, 4], [5, 6]]\nflat = [n for row in matrix for n in row]\nprint(flat)',
    expectedOutput: "[1, 2, 3, 4, 5, 6]",
    back: "Nested list comprehensions read left to right: 'for row in matrix' is the outer loop, 'for n in row' is the inner loop. This flattens a 2D list into a 1D list by iterating over each row then each element in the row.",
  }),
  makeCard({
    id: "card:python:t3:nested-structures:3",
    nodeId: "python:t3:nested-structures",
    branchId: "python",
    type: "bug_spot",
    front: "Find the bug in this code.",
    code: 'grid = [[0] * 3] * 3\ngrid[0][0] = 1\nprint(grid)',
    back: "Output is [[1, 0, 0], [1, 0, 0], [1, 0, 0]] — not the expected [[1, 0, 0], [0, 0, 0], [0, 0, 0]]. The outer * 3 creates three references to the same inner list, so modifying one row modifies all. Fix: grid = [[0] * 3 for _ in range(3)], which creates independent lists.",
  }),
];

export const tier3Cards: ReviewCard[] = [
  ...lists,
  ...listComprehensions,
  ...tuples,
  ...dictionaries,
  ...sets,
  ...nestedStructures,
];
