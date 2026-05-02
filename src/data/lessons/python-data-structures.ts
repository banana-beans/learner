// ============================================================
// Python Tier 3 — Data Structures Lessons
// ============================================================

import type { LessonContent } from "./python-basics";

export const pythonDataStructuresLessons: Record<string, LessonContent> = {
  "python:t3:lists": {
    nodeId: "python:t3:lists",
    title: "Lists & Slicing",
    sections: [
      {
        heading: "Mutable Ordered Sequences",
        body: "Lists are Python's go-to ordered, mutable container. Created with [] or list(). Index from 0; negative indices count from the end. Add with .append(), insert at a position with .insert(), remove with .pop() or .remove().",
      },
      {
        heading: "Slicing",
        body: "Slice with [start:stop:step]. Stop is exclusive. Negative steps reverse. Slicing always returns a new list — useful for copies (lst[:]) and reversal (lst[::-1]). Slice assignment can replace, insert, or delete chunks at once.",
      },
      {
        heading: "List Methods",
        body: ".sort() sorts in place; sorted(lst) returns a new sorted copy. .extend(iterable) appends each item. .index(x) finds the first match. Use in for membership. Lists are O(1) for index access, O(n) for in/insert at front.",
      },
    ],
    codeExamples: [
      {
        title: "Basic operations",
        code: `nums = [3, 1, 4, 1, 5]
nums.append(9)
print(nums)         # [3, 1, 4, 1, 5, 9]
print(nums[0])      # 3
print(nums[-1])     # 9
print(len(nums))    # 6`,
        explanation: "append mutates in place. Negative indices count from the end.",
      },
      {
        title: "Slicing",
        code: `s = [10, 20, 30, 40, 50]
print(s[1:4])     # [20, 30, 40]
print(s[:2])      # [10, 20]
print(s[-2:])     # [40, 50]
print(s[::2])     # [10, 30, 50]
print(s[::-1])    # [50, 40, 30, 20, 10]`,
        explanation: "Slices are independent copies. [::-1] is the reverse idiom.",
      },
      {
        title: "Sorting copy vs in-place",
        code: `a = [3, 1, 2]
b = sorted(a)     # new list
a.sort()          # mutates a
print(a, b)       # [1, 2, 3] [1, 2, 3]`,
        explanation: "sorted(x) returns a new list; x.sort() mutates and returns None.",
      },
    ],
    keyTakeaways: [
      "Lists are ordered, mutable, indexed from 0",
      "Slice [start:stop:step] always returns a new list",
      "[-1] is the last element; [::-1] reverses",
      "list.sort() mutates; sorted() returns a copy",
      "in is O(n) — use sets for fast membership tests",
    ],
  },

  "python:t3:list-comprehensions": {
    nodeId: "python:t3:list-comprehensions",
    title: "List Comprehensions",
    sections: [
      {
        heading: "Concise List Building",
        body: "A list comp is [expression for item in iterable if condition]. It's an expression, not a statement, so it returns the list directly. Compiles to faster bytecode than the equivalent for-loop with append.",
      },
      {
        heading: "Filtering and Transforming",
        body: "Combine for and if to filter and transform in one pass. The if comes after the for clause. Multiple for clauses give nested iteration — read them left-to-right like nested loops.",
      },
      {
        heading: "When NOT To Use Them",
        body: "Don't nest more than two for clauses. Don't use them for side effects (like print). If a comp gets long enough that you'd add a comment, use a real loop. Generator expressions (parentheses instead of brackets) are lazier — use them when you only iterate once.",
      },
    ],
    codeExamples: [
      {
        title: "Map and filter",
        code: `nums = [1, 2, 3, 4, 5]
squares = [n * n for n in nums]
evens = [n for n in nums if n % 2 == 0]
print(squares)  # [1, 4, 9, 16, 25]
print(evens)    # [2, 4]`,
        explanation: "Read as: collect (expr) for each item where condition.",
      },
      {
        title: "Combined map+filter",
        code: `words = ["apple", "fig", "banana", "ok"]
short_upper = [w.upper() for w in words if len(w) <= 3]
print(short_upper)  # ['FIG', 'OK']`,
        explanation: "Filter first by len, then transform with .upper(). Single pass.",
      },
      {
        title: "Generator expression alternative",
        code: `total = sum(n * n for n in range(1000))
print(total)  # 332833500`,
        explanation: "() instead of [] gives a lazy generator — no intermediate list allocated.",
      },
    ],
    keyTakeaways: [
      "[expr for x in seq if cond] returns a new list",
      "if filters, expr transforms — both optional",
      "Faster than for-loop + append because of bytecode optimizations",
      "Switch to a real for loop if it gets hard to read",
      "(...) instead of [...] gives a lazy generator expression",
    ],
  },

  "python:t3:tuples": {
    nodeId: "python:t3:tuples",
    title: "Tuples",
    sections: [
      {
        heading: "Immutable Ordered Sequences",
        body: "Tuples are like lists but immutable: (1, 2, 3). The parentheses are optional in many contexts — what makes a tuple is the comma. A single-element tuple needs the comma: (1,). They're hashable when their items are, so they work as dict keys and set members.",
      },
      {
        heading: "Packing and Unpacking",
        body: "x, y = 1, 2 packs and unpacks in one line — the right side is an implicit tuple. Use *rest to gather extras: a, *b = [1, 2, 3, 4] gives a=1, b=[2, 3, 4]. Unpacking is how Python returns multiple values from a function.",
      },
      {
        heading: "Named Tuples",
        body: "collections.namedtuple gives field names without writing a class. typing.NamedTuple is the typed version. Use these when a tuple's fields have meaning — Point(x=1, y=2) reads better than (1, 2).",
      },
    ],
    codeExamples: [
      {
        title: "Tuples are immutable",
        code: `point = (3, 4)
print(point[0])  # 3
# point[0] = 5  # TypeError: 'tuple' object does not support item assignment
print(len(point))  # 2`,
        explanation: "Once created, a tuple's items can't be reassigned. The tuple itself can still be replaced.",
      },
      {
        title: "Multiple return values",
        code: `def divmod_pair(a, b):
    return a // b, a % b   # implicit tuple

q, r = divmod_pair(17, 5)
print(q, r)  # 3 2`,
        explanation: "Returning a, b is really returning a tuple. Unpack on the receiving side.",
      },
      {
        title: "Star unpacking",
        code: `first, *middle, last = [1, 2, 3, 4, 5]
print(first, middle, last)  # 1 [2, 3, 4] 5`,
        explanation: "*name absorbs the leftover items into a list — exactly one allowed per pattern.",
      },
    ],
    keyTakeaways: [
      "Tuples are immutable: (a, b, c) — comma is what makes a tuple",
      "Single-element tuple needs the trailing comma: (1,)",
      "Multiple return = returning a tuple",
      "Use *rest in unpacking to gather extras",
      "namedtuple gives readable field names without a class",
    ],
  },

  "python:t3:dictionaries": {
    nodeId: "python:t3:dictionaries",
    title: "Dictionaries",
    sections: [
      {
        heading: "Key-Value Mapping",
        body: "Dicts map hashable keys to values: {'name': 'ada', 'age': 36}. O(1) average lookup, insert, and delete. Since 3.7, dicts preserve insertion order. Common keys: strings, ints, tuples.",
      },
      {
        heading: "Common Operations",
        body: "d[k] raises KeyError if missing; d.get(k, default) returns the default. d.setdefault(k, v) sets a default in place. del d[k] or d.pop(k) removes. Iterate with d.items(), d.keys(), d.values().",
      },
      {
        heading: "Merging and Updating",
        body: "d.update(other) merges in place. PEP 584 added | and |= operators: merged = d1 | d2. Dict comprehensions {k: v for ...} are great for inverting or remapping. defaultdict from collections handles missing keys via a factory.",
      },
    ],
    codeExamples: [
      {
        title: "Lookup with defaults",
        code: `prices = {"apple": 1.0, "banana": 0.5}
print(prices["apple"])         # 1.0
print(prices.get("cherry"))    # None (no KeyError)
print(prices.get("cherry", 0)) # 0`,
        explanation: ".get spares you from try/except KeyError when missing keys are expected.",
      },
      {
        title: "Iterating items",
        code: `prices = {"apple": 1.0, "banana": 0.5}
for fruit, price in prices.items():
    print(f"{fruit}: \${price:.2f}")
# apple: \$1.00 / banana: \$0.50`,
        explanation: ".items() yields (key, value) pairs. Unpack in the for header.",
      },
      {
        title: "Counting with setdefault",
        code: `words = ["a", "b", "a", "c", "b", "a"]
counts = {}
for w in words:
    counts[w] = counts.get(w, 0) + 1
print(counts)  # {'a': 3, 'b': 2, 'c': 1}`,
        explanation: "Idiomatic counting. Use collections.Counter for the canonical version.",
      },
    ],
    keyTakeaways: [
      "Dicts are O(1) hashable-key → value maps",
      "Insertion order is preserved (3.7+)",
      "d.get(k, default) avoids KeyError on misses",
      ".items() is the standard way to iterate pairs",
      "Use collections.Counter or defaultdict for the common patterns",
    ],
  },

  "python:t3:sets": {
    nodeId: "python:t3:sets",
    title: "Sets",
    sections: [
      {
        heading: "Unordered Unique Collections",
        body: "Sets hold unique hashable items: {1, 2, 3} or set([1, 2, 2, 3]). No order, no indexing. O(1) add/remove/membership. Empty set is set() — {} is an empty dict.",
      },
      {
        heading: "Set Algebra",
        body: "| union, & intersection, - difference, ^ symmetric difference. These return new sets. The in-place versions (|=, &=, etc.) mutate. Sets also support <= for subset and < for proper subset.",
      },
      {
        heading: "Frozen Sets",
        body: "frozenset is the immutable hashable cousin. Use frozenset when you need a set-of-sets (regular sets aren't hashable) or as a dict key. Otherwise prefer regular sets — they're more flexible.",
      },
    ],
    codeExamples: [
      {
        title: "Dedup a list",
        code: `nums = [1, 2, 2, 3, 1, 4]
unique = set(nums)
print(unique)         # {1, 2, 3, 4} (order not guaranteed)
print(list(unique))   # [1, 2, 3, 4]`,
        explanation: "Wrapping a list in set() removes duplicates. Convert back if you need a list.",
      },
      {
        title: "Set algebra",
        code: `a = {1, 2, 3, 4}
b = {3, 4, 5, 6}
print(a | b)   # {1, 2, 3, 4, 5, 6}
print(a & b)   # {3, 4}
print(a - b)   # {1, 2}
print(a ^ b)   # {1, 2, 5, 6}`,
        explanation: "Union, intersection, difference, symmetric difference. Read like math.",
      },
      {
        title: "Membership is O(1)",
        code: `seen = set()
items = [1, 2, 3, 2, 1]
new_items = []
for x in items:
    if x not in seen:
        seen.add(x)
        new_items.append(x)
print(new_items)  # [1, 2, 3]`,
        explanation: "Order-preserving dedup. Sets give fast in-checks compared to lists.",
      },
    ],
    keyTakeaways: [
      "Sets hold unique hashable items, unordered",
      "Empty set is set(), NOT {} (that's a dict)",
      "| & - ^ for union, intersection, difference, symmetric difference",
      "Membership and add are O(1)",
      "frozenset for hashable / immutable variants",
    ],
  },

  "python:t3:string-methods": {
    nodeId: "python:t3:string-methods",
    title: "String Methods",
    sections: [
      {
        heading: "Common Methods",
        body: "Strings are immutable — every method returns a new string. .upper(), .lower(), .title(), .strip() (and .lstrip()/.rstrip()), .replace(old, new), .startswith(), .endswith(). Chain them: s.strip().lower().",
      },
      {
        heading: "Splitting and Joining",
        body: ".split(sep) returns a list. .splitlines() splits on any line ending. The reverse is sep.join(iterable) — call .join on the separator, not the list. ' '.join(words) is idiomatic for joining tokens.",
      },
      {
        heading: "Searching and Formatting",
        body: ".find(sub) returns the index or -1; .index(sub) raises if not found. .count(sub) for occurrences. f-strings (f'{x:.2f}') are the modern way to format. format spec syntax: :width.precision[type].",
      },
    ],
    codeExamples: [
      {
        title: "Cleaning input",
        code: `raw = "  Hello, World!  "
clean = raw.strip().lower().replace(",", "")
print(clean)  # hello world!
print(len(clean))  # 12`,
        explanation: "Method chaining is fine for short pipelines. Each call returns a new string.",
      },
      {
        title: "Split / join",
        code: `csv = "ada,linus,grace"
names = csv.split(",")
print(names)  # ['ada', 'linus', 'grace']
print(" | ".join(names))  # ada | linus | grace`,
        explanation: ".join is called on the separator, with the iterable as argument.",
      },
      {
        title: "f-string formatting",
        code: `pi = 3.14159265
print(f"{pi:.2f}")        # 3.14
print(f"{1234567:,}")     # 1,234,567
print(f"{0.842:.1%}")     # 84.2%
print(f"{'x':*^10}")      # ****x*****`,
        explanation: "Format specs after the colon. ^ centers, * is the fill character.",
      },
    ],
    keyTakeaways: [
      "Strings are immutable — methods return new strings",
      "sep.join(iterable) — call join on the separator",
      ".find returns -1 for missing; .index raises",
      "f-strings: f\"{value:format_spec}\"",
      "Chain methods for short pipelines, but don't over-do it",
    ],
  },
};
