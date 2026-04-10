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
// Tier 3: Data Structures (6 nodes, ~21 cards)
// ────────────────────────────────────────────────────────────

export const tier3Cards: ReviewCard[] = [
  // ── python:t3:lists ────────────────────────────────────────
  makeCard({
    id: "card:python:t3:lists:1",
    nodeId: "python:t3:lists",
    branchId: "python",
    type: "code_output",
    front: "What does this code print?",
    code: 'a = [1, 2, 3]\nb = a\nb.append(4)\nprint(a)',
    expectedOutput: "[1, 2, 3, 4]",
    back: "b = a does not create a copy — both names refer to the same list object. Mutating b also mutates a. To create an independent copy, use b = a.copy(), b = a[:], or b = list(a).",
  }),
  makeCard({
    id: "card:python:t3:lists:2",
    nodeId: "python:t3:lists",
    branchId: "python",
    type: "code_output",
    front: "What does this code print?",
    code: "nums = [3, 1, 4, 1, 5]\nresult = nums.sort()\nprint(result)\nprint(nums)",
    expectedOutput: "None\n[1, 1, 3, 4, 5]",
    back: "list.sort() sorts the list in-place and returns None. This is a common gotcha — assigning the result gives None, not the sorted list. Use sorted(nums) if you need a new sorted list returned.",
  }),
  makeCard({
    id: "card:python:t3:lists:3",
    nodeId: "python:t3:lists",
    branchId: "python",
    type: "concept",
    front: "What is the time complexity of append, pop (end), pop(0), and accessing by index for a Python list?",
    back: "append() — O(1) amortized. pop() from end — O(1). pop(0) from front — O(n) because all remaining elements must shift. Index access (lst[i]) — O(1) because Python lists are backed by dynamic arrays, not linked lists. For efficient O(1) operations at both ends, use collections.deque.",
  }),
  makeCard({
    id: "card:python:t3:lists:4",
    nodeId: "python:t3:lists",
    branchId: "python",
    type: "bug_spot",
    front: "Find the bug in this code.",
    code: "nums = [1, 2, 3, 4, 5]\nfor i in range(len(nums)):\n    if nums[i] % 2 == 0:\n        nums.remove(nums[i])",
    back: "Removing elements from a list while iterating over it by index causes items to be skipped. After removing 2 (index 1), the element 3 shifts to index 1 and 4 shifts to index 2, so 4 is checked next — but 3 is skipped. The fix is to iterate over a copy (nums[:]) or build a new list with a list comprehension: nums = [x for x in nums if x % 2 != 0].",
  }),

  // ── python:t3:list-comprehensions ──────────────────────────
  makeCard({
    id: "card:python:t3:list-comprehensions:1",
    nodeId: "python:t3:list-comprehensions",
    branchId: "python",
    type: "code_output",
    front: "What does this code print?",
    code: "squares = [x**2 for x in range(5) if x % 2 == 1]\nprint(squares)",
    expectedOutput: "[1, 9]",
    back: "The comprehension iterates over 0..4, filters for odd numbers (1, 3), and squares them. 1**2 = 1, 3**2 = 9. Comprehensions with an if clause are equivalent to a for loop with a conditional append.",
  }),
  makeCard({
    id: "card:python:t3:list-comprehensions:2",
    nodeId: "python:t3:list-comprehensions",
    branchId: "python",
    type: "fill_blank",
    front: "Fill in the blanks to flatten a 2D list into a 1D list using a comprehension.",
    code: 'matrix = [[1, 2], [3, 4], [5, 6]]\nflat = [x __BLANK__ row in matrix __BLANK__ x in row]\nprint(flat)',
    blanks: ["for", "for"],
    back: "A nested comprehension reads left to right like nested for loops: for row in matrix, then for x in row. This produces [1, 2, 3, 4, 5, 6]. The outer loop comes first in the comprehension syntax.",
  }),
  makeCard({
    id: "card:python:t3:list-comprehensions:3",
    nodeId: "python:t3:list-comprehensions",
    branchId: "python",
    type: "explain",
    front: "Explain when you should use a list comprehension versus a regular for loop.",
    back: "Use a list comprehension when you are building a new list by transforming or filtering items from an iterable — it is more concise and often faster because the loop runs in optimized C code. Use a regular for loop when the body has side effects (printing, writing to a file), when the logic involves multiple statements or complex branching, or when readability would suffer from cramming too much into one expression.",
  }),
  makeCard({
    id: "card:python:t3:list-comprehensions:4",
    nodeId: "python:t3:list-comprehensions",
    branchId: "python",
    type: "code_output",
    front: "What does this code print?",
    code: "result = {x: x**2 for x in range(4)}\nprint(result)",
    expectedOutput: "{0: 0, 1: 1, 2: 4, 3: 9}",
    back: "This is a dictionary comprehension (note the curly braces and key: value syntax). It creates a dict mapping each number to its square. Python also supports set comprehensions: {x**2 for x in range(4)} produces {0, 1, 4, 9}.",
  }),

  // ── python:t3:tuples ───────────────────────────────────────
  makeCard({
    id: "card:python:t3:tuples:1",
    nodeId: "python:t3:tuples",
    branchId: "python",
    type: "concept",
    front: "How do tuples differ from lists, and why would you use one over the other?",
    back: "Tuples are immutable — once created, elements cannot be added, removed, or changed. Lists are mutable. Use tuples for fixed collections of heterogeneous data (like coordinates, RGB values, or database rows) where immutability provides safety. Tuples can be used as dictionary keys and set elements because they are hashable (if all their elements are hashable). Lists cannot.",
  }),
  makeCard({
    id: "card:python:t3:tuples:2",
    nodeId: "python:t3:tuples",
    branchId: "python",
    type: "code_output",
    front: "What does this code print?",
    code: "t = (1, 2, [3, 4])\nt[2].append(5)\nprint(t)",
    expectedOutput: "(1, 2, [3, 4, 5])",
    back: "The tuple itself is immutable — you cannot reassign t[2]. However, the list inside the tuple is still a mutable object. Appending to it is allowed because you are modifying the list, not the tuple reference. This is a subtle but important distinction between container immutability and element mutability.",
  }),
  makeCard({
    id: "card:python:t3:tuples:3",
    nodeId: "python:t3:tuples",
    branchId: "python",
    type: "code_output",
    front: "What does this code print?",
    code: "a, *b, c = (1, 2, 3, 4, 5)\nprint(a, b, c)",
    expectedOutput: "1 [2, 3, 4] 5",
    back: "The * operator in unpacking collects remaining values into a list. a gets the first value (1), c gets the last value (5), and *b gets everything in between as a list [2, 3, 4]. This is called extended iterable unpacking.",
  }),

  // ── python:t3:dictionaries ─────────────────────────────────
  makeCard({
    id: "card:python:t3:dictionaries:1",
    nodeId: "python:t3:dictionaries",
    branchId: "python",
    type: "code_output",
    front: "What does this code print?",
    code: 'd = {"a": 1, "b": 2}\nprint(d.get("c", 0))\nprint(d.get("a", 0))',
    expectedOutput: "0\n1",
    back: "dict.get(key, default) returns the value for key if it exists, otherwise returns the default. For 'c' (missing), it returns 0. For 'a' (present), it returns 1. Unlike d['c'] which raises KeyError, get() is safe for missing keys.",
  }),
  makeCard({
    id: "card:python:t3:dictionaries:2",
    nodeId: "python:t3:dictionaries",
    branchId: "python",
    type: "code_output",
    front: "What does this code print?",
    code: 'a = {"x": 1, "y": 2}\nb = {"y": 3, "z": 4}\nmerged = {**a, **b}\nprint(merged)',
    expectedOutput: "{'x': 1, 'y': 3, 'z': 4}",
    back: "The ** operator unpacks dictionary items. When keys overlap, the last one wins. 'y' appears in both, but b's value (3) overwrites a's value (2). In Python 3.9+, you can also use a | b for the same result.",
  }),
  makeCard({
    id: "card:python:t3:dictionaries:3",
    nodeId: "python:t3:dictionaries",
    branchId: "python",
    type: "fill_blank",
    front: "Fill in the blank to count the frequency of each character in a string.",
    code: 'text = "hello"\ncounts = {}\nfor ch in text:\n    counts[ch] = counts.__BLANK__(ch, 0) + 1\nprint(counts)',
    blanks: ["get"],
    back: "dict.get(key, default) returns the current count or 0 if the key is new, then adds 1. After processing 'hello', counts is {'h': 1, 'e': 1, 'l': 2, 'o': 1}. An alternative is to use collections.Counter(text).",
  }),
  makeCard({
    id: "card:python:t3:dictionaries:4",
    nodeId: "python:t3:dictionaries",
    branchId: "python",
    type: "concept",
    front: "What is the time complexity of dictionary lookup, insertion, and deletion in Python?",
    back: "All three operations are O(1) average case. Dictionaries use hash tables internally. In the worst case (many hash collisions), they degrade to O(n), but this is extremely rare with Python's hash randomization. Since Python 3.7, dicts also maintain insertion order as part of the language spec.",
  }),

  // ── python:t3:sets ─────────────────────────────────────────
  makeCard({
    id: "card:python:t3:sets:1",
    nodeId: "python:t3:sets",
    branchId: "python",
    type: "code_output",
    front: "What does this code print?",
    code: "a = {1, 2, 3, 4}\nb = {3, 4, 5, 6}\nprint(a & b)\nprint(a | b)\nprint(a - b)",
    expectedOutput: "{3, 4}\n{1, 2, 3, 4, 5, 6}\n{1, 2}",
    back: "& is intersection (elements in both). | is union (elements in either). - is difference (elements in a but not b). Sets also support ^ for symmetric difference (elements in one but not both). These operations are O(min(len(a), len(b))) for & and O(len(a) + len(b)) for |.",
  }),
  makeCard({
    id: "card:python:t3:sets:2",
    nodeId: "python:t3:sets",
    branchId: "python",
    type: "bug_spot",
    front: "Find the bug in this code.",
    code: "empty_set = {}\nprint(type(empty_set))",
    back: "This creates an empty dict, not an empty set. {} is the literal for an empty dictionary in Python. To create an empty set, use set(). This prints <class 'dict'>, which is usually not the intended behavior.",
  }),
  makeCard({
    id: "card:python:t3:sets:3",
    nodeId: "python:t3:sets",
    branchId: "python",
    type: "concept",
    front: "Why can sets only contain hashable elements? Give examples of what can and cannot be in a set.",
    back: "Sets use hash tables internally (like dicts), so each element must have a stable hash value. Hashable types: int, float, str, tuple (of hashables), frozenset. Unhashable types: list, dict, set. If you need a set of sets, use frozenset — the immutable counterpart of set.",
  }),

  // ── python:t3:nested-structures ────────────────────────────
  makeCard({
    id: "card:python:t3:nested-structures:1",
    nodeId: "python:t3:nested-structures",
    branchId: "python",
    type: "code_output",
    front: "What does this code print?",
    code: 'students = [\n    {"name": "Alice", "grades": [90, 85]},\n    {"name": "Bob", "grades": [70, 80]},\n]\nprint(students[1]["grades"][0])',
    expectedOutput: "70",
    back: "students[1] accesses the second dict (Bob). ['grades'] accesses Bob's grades list [70, 80]. [0] accesses the first grade (70). Chain indexing works left to right, each step narrowing into the nested structure.",
  }),
  makeCard({
    id: "card:python:t3:nested-structures:2",
    nodeId: "python:t3:nested-structures",
    branchId: "python",
    type: "code_output",
    front: "What does this code print?",
    code: "import copy\na = [[1, 2], [3, 4]]\nb = copy.copy(a)\nb[0].append(5)\nprint(a)\nprint(b)",
    expectedOutput: "[[1, 2, 5], [3, 4]]\n[[1, 2, 5], [3, 4]]",
    back: "copy.copy() creates a shallow copy — the outer list is new, but the inner lists are still shared references. Modifying b[0] also modifies a[0]. Use copy.deepcopy() to create fully independent nested structures.",
  }),
  makeCard({
    id: "card:python:t3:nested-structures:3",
    nodeId: "python:t3:nested-structures",
    branchId: "python",
    type: "explain",
    front: "Explain the difference between a shallow copy and a deep copy of a nested data structure.",
    back: "A shallow copy creates a new outer container but reuses references to the inner objects. Changes to inner mutable objects affect both the original and the copy. A deep copy recursively copies every nested object, creating a fully independent clone. Use copy.copy() for shallow and copy.deepcopy() for deep copies. Shallow copies are faster but only safe when inner objects will not be mutated.",
  }),
];
