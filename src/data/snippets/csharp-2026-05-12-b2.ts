import type { Snippet } from "./types";

export const csharpSnippets20260512B2: Snippet[] = [
  {
    id: "cs-string-compare-ordinal",
    language: "csharp",
    title: "StringComparison.Ordinal — fast, culture-invariant string compare",
    tag: "caveats",
    code: `string a = "file.TXT";
string b = "file.txt";

// Culture-sensitive (default): may differ by locale
Console.WriteLine(string.Compare(a, b, StringComparison.CurrentCulture));

// Ordinal: byte-by-byte, fastest, locale-independent
Console.WriteLine(string.Equals(a, b, StringComparison.OrdinalIgnoreCase)); // True
Console.WriteLine(a.StartsWith("file", StringComparison.Ordinal));           // True

// Always specify StringComparison in library code
int idx = "Hello World".IndexOf("world", StringComparison.OrdinalIgnoreCase); // 6`,
    explanation:
      "Always specify StringComparison in library code — CurrentCulture comparison can give different results depending on the user's locale; Ordinal is deterministic and fastest for identifiers, file paths, and protocol strings.",
  },
  {
    id: "cs-string-format-composite",
    language: "csharp",
    title: "string.Format and composite formatting",
    tag: "snippet",
    code: `// Positional placeholders
string s1 = string.Format("Hello, {0}! You have {1} messages.", "Alice", 5);
Console.WriteLine(s1);   // Hello, Alice! You have 5 messages.

// Format specifiers inside placeholders
string s2 = string.Format("Price: {0:C2}  Pi: {1:F4}", 9.99m, Math.PI);
Console.WriteLine(s2);   // Price: $9.99  Pi: 3.1416

// Alignment (positive = right, negative = left)
string s3 = string.Format("{0,-10} {1,10}", "left", "right");
Console.WriteLine(s3);   // left           right`,
    explanation:
      "Composite formatting uses {index[,alignment][:format]} syntax — interpolated strings ($\"\") are usually clearer for simple cases, but string.Format is still useful when format strings are determined at runtime.",
  },
  {
    id: "cs-string-split-options",
    language: "csharp",
    title: "string.Split with StringSplitOptions — remove empty entries",
    tag: "snippet",
    code: `string csv = "one,,two,  ,three,";

// Without options: empty entries preserved
string[] raw = csv.Split(',');
Console.WriteLine(raw.Length);   // 6 (includes two empty strings)

// RemoveEmptyEntries drops zero-length tokens
string[] clean = csv.Split(',', StringSplitOptions.RemoveEmptyEntries);
Console.WriteLine(clean.Length); // 4 (includes "  ")

// TrimEntries + RemoveEmptyEntries (NET 5+)
string[] trimmed = csv.Split(',',
    StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
Console.WriteLine(trimmed.Length);  // 3`,
    explanation:
      "StringSplitOptions.TrimEntries (added in .NET 5) trims whitespace from each token after splitting — combine it with RemoveEmptyEntries to cleanly tokenise CSV-like input without a second pass.",
  },
  {
    id: "cs-string-join-separator",
    language: "csharp",
    title: "string.Join — concatenate a collection with a separator",
    tag: "snippet",
    code: `string[] words = { "apple", "banana", "cherry" };

string csv    = string.Join(", ", words);
string piped  = string.Join(" | ", words);
string bullet = string.Join(Environment.NewLine + "  - ", words);

Console.WriteLine(csv);    // apple, banana, cherry
Console.WriteLine(piped);  // apple | banana | cherry

// Works on any IEnumerable<T>
string nums = string.Join("+", Enumerable.Range(1, 5));
Console.WriteLine(nums);   // 1+2+3+4+5`,
    explanation:
      "string.Join is the idiomatic way to concatenate an IEnumerable with a separator — it is far more efficient than a loop with string concatenation and handles empty collections by returning an empty string.",
  },
  {
    id: "cs-linq-single-first",
    language: "csharp",
    title: "LINQ Single vs First — cardinality assertions",
    tag: "caveats",
    code: `int[] nums = { 3, 1, 4, 1, 5, 9 };

// First: returns first match (OK if 0 → throws)
Console.WriteLine(nums.First(n => n > 4));         // 5
Console.WriteLine(nums.FirstOrDefault(n => n > 100)); // 0 (default)

// Single: asserts exactly one match exists
try
{
    Console.WriteLine(nums.Single(n => n == 1));   // throws — two matches
}
catch (InvalidOperationException ex)
{
    Console.WriteLine(ex.Message);  // Sequence contains more than one matching element
}

Console.WriteLine(nums.SingleOrDefault(n => n == 9));  // 9`,
    explanation:
      "Use Single when business logic demands exactly one result and you want the code to fail loudly if the constraint is violated; use First when you expect multiple matches and just want the first.",
  },
  {
    id: "cs-linq-element-at",
    language: "csharp",
    title: "LINQ ElementAt and ElementAtOrDefault — positional access",
    tag: "snippet",
    code: `IEnumerable<string> seq = new[] { "a", "b", "c", "d" };

Console.WriteLine(seq.ElementAt(2));                  // c
Console.WriteLine(seq.ElementAt(^1));                 // d  (from end, NET 6+)
Console.WriteLine(seq.ElementAtOrDefault(99));        // null (out of range)
Console.WriteLine(seq.ElementAtOrDefault(^2));        // c   (from end)

// Index from end works on IEnumerable without materialising the whole sequence`,
    explanation:
      "ElementAt(Index) supports the ^ from-end syntax on .NET 6+, counting backwards without materialising the full sequence — ElementAtOrDefault returns the default value rather than throwing for out-of-range indices.",
  },
  {
    id: "cs-linq-append-prepend",
    language: "csharp",
    title: "LINQ Append and Prepend — add single elements without concat",
    tag: "snippet",
    code: `int[] nums = { 2, 3, 4 };

IEnumerable<int> withHead = nums.Prepend(1);    // 1, 2, 3, 4
IEnumerable<int> withTail = nums.Append(5);     // 2, 3, 4, 5

Console.WriteLine(string.Join(",", withHead));  // 1,2,3,4
Console.WriteLine(string.Join(",", withTail));  // 2,3,4,5

// Chain them
var full = nums.Prepend(1).Append(5).Append(6);
Console.WriteLine(string.Join(",", full));      // 1,2,3,4,5,6`,
    explanation:
      "Append and Prepend add a single element at either end without allocating a new array — they return lazy sequences, so chaining many calls is still one deferred iteration.",
  },
  {
    id: "cs-linq-then-by",
    language: "csharp",
    title: "LINQ ThenBy — multi-key stable sort",
    tag: "snippet",
    code: `record Employee(string Dept, string Name, int Level);

var staff = new[]
{
    new Employee("Eng",  "Charlie", 2),
    new Employee("HR",   "Alice",   3),
    new Employee("Eng",  "Alice",   1),
    new Employee("HR",   "Bob",     2),
};

var sorted = staff
    .OrderBy(e => e.Dept)
    .ThenBy(e => e.Name)
    .ThenByDescending(e => e.Level);

foreach (var e in sorted)
    Console.WriteLine($"{e.Dept} {e.Name} L{e.Level}");
// Eng Alice L1
// Eng Charlie L2
// HR  Alice L3
// HR  Bob   L2`,
    explanation:
      "ThenBy applies a secondary sort key on elements that compare equal under the primary key — the sort is stable, so elements with equal keys preserve their original relative order.",
  },
  {
    id: "cs-linq-select-many",
    language: "csharp",
    title: "LINQ SelectMany — flatten nested collections",
    tag: "snippet",
    code: `var departments = new[]
{
    new { Name = "Eng", Members = new[] { "Alice", "Bob" } },
    new { Name = "HR",  Members = new[] { "Carol" } },
};

// Flatten: one item per member
IEnumerable<string> allNames = departments.SelectMany(d => d.Members);
Console.WriteLine(string.Join(", ", allNames));  // Alice, Bob, Carol

// With result selector: access parent element too
var pairs = departments.SelectMany(
    d => d.Members,
    (dept, name) => $"{dept.Name}/{name}");
Console.WriteLine(string.Join(", ", pairs));  // Eng/Alice, Eng/Bob, HR/Carol`,
    explanation:
      "SelectMany projects each element to a sequence and flattens the results into one sequence — it is the LINQ equivalent of a nested foreach, useful for denormalising hierarchical data.",
  },
  {
    id: "cs-linq-to-lookup",
    language: "csharp",
    title: "LINQ ToLookup — multi-value grouping dictionary",
    tag: "structures",
    code: `var orders = new[]
{
    new { Id = 1, Customer = "Alice" },
    new { Id = 2, Customer = "Bob"   },
    new { Id = 3, Customer = "Alice" },
};

ILookup<string, int> byCustomer = orders.ToLookup(o => o.Customer, o => o.Id);

Console.WriteLine(string.Join(",", byCustomer["Alice"]));  // 1,3
Console.WriteLine(string.Join(",", byCustomer["Bob"]));    // 2
Console.WriteLine(byCustomer["Unknown"].Any());            // False (no throw)`,
    explanation:
      "ToLookup is like a Dictionary<TKey, IEnumerable<TValue>> but reading a missing key returns an empty sequence instead of throwing — ideal for grouping and repeated random-access lookups on the same dataset.",
  },
  {
    id: "cs-linq-of-type",
    language: "csharp",
    title: "LINQ OfType<T> — filter by type and cast",
    tag: "snippet",
    code: `object[] mixed = { 1, "hello", 3.14, 42, "world", true };

IEnumerable<int> ints    = mixed.OfType<int>();
IEnumerable<string> strs = mixed.OfType<string>();

Console.WriteLine(string.Join(",", ints));   // 1,42
Console.WriteLine(string.Join(",", strs));   // hello,world

// Equivalent to: mixed.Where(x => x is int).Cast<int>()
// but OfType<T> is cleaner and skips non-matching items silently`,
    explanation:
      "OfType<T> filters a sequence to elements of type T and returns them already cast — unlike Cast<T> which throws if any element is not castable, OfType silently skips non-matching elements.",
  },
  {
    id: "cs-linq-aggregate",
    language: "csharp",
    title: "LINQ Aggregate — custom fold / reduce",
    tag: "snippet",
    code: `int[] nums = { 1, 2, 3, 4, 5 };

// Overload 1: no seed — throws on empty sequence
int product = nums.Aggregate((acc, n) => acc * n);
Console.WriteLine(product);  // 120

// Overload 2: with seed
int sumSquares = nums.Aggregate(0, (acc, n) => acc + n * n);
Console.WriteLine(sumSquares);  // 55

// Overload 3: with result selector
string sentence = nums.Aggregate("Numbers:", (acc, n) => acc + " " + n);
Console.WriteLine(sentence);  // Numbers: 1 2 3 4 5`,
    explanation:
      "Aggregate is LINQ's general fold — the two-arg overload has no seed (uses first element) and throws on empty sequences; the seed overload is safer and the result-selector overload transforms the accumulator to a different output type.",
  },
  {
    id: "cs-linq-skip-take",
    language: "csharp",
    title: "LINQ Skip, Take, SkipLast, TakeLast — windowing",
    tag: "snippet",
    code: `int[] arr = { 1, 2, 3, 4, 5, 6, 7, 8 };

Console.WriteLine(string.Join(",", arr.Skip(2)));           // 3,4,5,6,7,8
Console.WriteLine(string.Join(",", arr.Take(3)));           // 1,2,3
Console.WriteLine(string.Join(",", arr.Skip(2).Take(3)));   // 3,4,5
Console.WriteLine(string.Join(",", arr.TakeLast(3)));       // 6,7,8
Console.WriteLine(string.Join(",", arr.SkipLast(3)));       // 1,2,3,4,5

// Pagination pattern
int page = 1, pageSize = 3;
var paged = arr.Skip(page * pageSize).Take(pageSize);
Console.WriteLine(string.Join(",", paged));  // 4,5,6`,
    explanation:
      "Skip and Take are the basic pagination primitives; TakeLast and SkipLast operate from the end of the sequence — SkipLast must buffer the sequence to know where the end is, so avoid it on large infinite-like sequences.",
  },
  {
    id: "cs-linq-chunk",
    language: "csharp",
    title: "LINQ Chunk — split sequence into fixed-size batches (.NET 6+)",
    tag: "snippet",
    code: `int[] nums = Enumerable.Range(1, 10).ToArray();

foreach (int[] batch in nums.Chunk(3))
    Console.WriteLine(string.Join(",", batch));
// 1,2,3
// 4,5,6
// 7,8,9
// 10       ← last batch may be smaller

// Useful for batched API calls
var allItems = Enumerable.Range(1, 100);
foreach (var batch in allItems.Chunk(10))
    Console.WriteLine($"Processing {batch.Length} items");`,
    explanation:
      "Chunk splits a sequence into arrays of a given size, with the final chunk potentially smaller if the sequence length is not a multiple of the chunk size — each chunk is materialised as a T[] array.",
  },
  {
    id: "cs-list-foreach",
    language: "csharp",
    title: "List<T>.ForEach — in-place iteration with side effects",
    tag: "snippet",
    code: `var names = new List<string> { "alice", "bob", "charlie" };

// ForEach takes an Action<T>
names.ForEach(n => Console.Write(n.ToUpper() + " "));
Console.WriteLine();  // ALICE BOB CHARLIE

// Equivalent to foreach loop, but do NOT modify the list inside ForEach
// — throws InvalidOperationException (collection modified during iteration)

// ConvertAll is ForEach that returns a new list
List<string> upper = names.ConvertAll(n => n.ToUpper());`,
    explanation:
      "List<T>.ForEach is a convenience method for side-effect loops — prefer a regular foreach for clarity; never add or remove items from the list inside ForEach, as that throws an InvalidOperationException.",
  },
  {
    id: "cs-list-find-methods",
    language: "csharp",
    title: "List<T>.Find, FindAll, FindIndex — predicate-based search",
    tag: "snippet",
    code: `var numbers = new List<int> { 5, 3, 8, 1, 9, 2 };

int first = numbers.Find(n => n > 7);           // 8  (first match or default)
List<int> all = numbers.FindAll(n => n > 4);    // [5, 8, 9]
int idx = numbers.FindIndex(n => n > 7);        // 2  (index of first match)
int lastIdx = numbers.FindLastIndex(n => n < 5); // 5 (index of last match)

Console.WriteLine(first);
Console.WriteLine(string.Join(",", all));
Console.WriteLine(idx);`,
    explanation:
      "Find returns the first matching element (or the default), FindAll returns a new List<T> of all matches, and FindIndex returns the position — these are list-specific methods and not available on plain IEnumerable.",
  },
  {
    id: "cs-list-remove-all",
    language: "csharp",
    title: "List<T>.RemoveAll — remove elements matching a predicate",
    tag: "snippet",
    code: `var items = new List<int> { 1, 2, 3, 4, 5, 6, 7, 8 };

int removed = items.RemoveAll(n => n % 2 == 0);  // remove evens in-place
Console.WriteLine(removed);                       // 4  (count removed)
Console.WriteLine(string.Join(",", items));       // 1,3,5,7

// Much faster than LINQ Where + ToList for in-place mutation:
// items = items.Where(n => n % 2 != 0).ToList(); // allocates a new list`,
    explanation:
      "RemoveAll modifies the list in-place and returns the count of removed elements — it is O(n) and avoids allocating a new list, making it more efficient than reassigning to a filtered LINQ query.",
  },
  {
    id: "cs-list-add-range",
    language: "csharp",
    title: "List<T>.AddRange, InsertRange, RemoveRange — bulk operations",
    tag: "snippet",
    code: `var list = new List<int> { 1, 2, 3 };

list.AddRange(new[] { 4, 5, 6 });         // append bulk
Console.WriteLine(string.Join(",", list)); // 1,2,3,4,5,6

list.InsertRange(2, new[] { 10, 11 });    // insert at index 2
Console.WriteLine(string.Join(",", list)); // 1,2,10,11,3,4,5,6

list.RemoveRange(2, 2);                   // remove 2 items starting at index 2
Console.WriteLine(string.Join(",", list)); // 1,2,3,4,5,6`,
    explanation:
      "AddRange, InsertRange, and RemoveRange are bulk mutations that resize the internal array only once per call, making them significantly faster than calling Add/Insert/RemoveAt in a loop.",
  },
  {
    id: "cs-list-as-readonly",
    language: "csharp",
    title: "List<T>.AsReadOnly — expose list as IReadOnlyList<T>",
    tag: "snippet",
    code: `var mutable = new List<int> { 1, 2, 3 };

// Wrap in a read-only view — no copy made
IReadOnlyList<int> readOnly = mutable.AsReadOnly();
Console.WriteLine(readOnly[1]);   // 2
Console.WriteLine(readOnly.Count); // 3

// readOnly.Add(4);   // compile error — IReadOnlyList has no Add

// Changes to the underlying list are reflected
mutable.Add(4);
Console.WriteLine(readOnly.Count); // 4  — live view, not a snapshot`,
    explanation:
      "AsReadOnly returns a ReadOnlyCollection<T> wrapper that exposes IReadOnlyList<T> without copying — it is a live view, so mutations to the underlying list are visible through it; use it to prevent callers from mutating your internal list.",
  },
  {
    id: "cs-array-fill",
    language: "csharp",
    title: "Array.Fill — initialise all or part of an array",
    tag: "snippet",
    code: `int[] arr = new int[8];

Array.Fill(arr, 42);
Console.WriteLine(string.Join(",", arr));  // 42,42,42,42,42,42,42,42

// Fill a slice (index, count)
Array.Fill(arr, 0, 2, 4);   // fill indices 2..5 with 0
Console.WriteLine(string.Join(",", arr));  // 42,42,0,0,0,0,42,42

// Works on Span<T> too:
Span<char> buf = stackalloc char[5];
buf.Fill('x');
Console.WriteLine(new string(buf));  // xxxxx`,
    explanation:
      "Array.Fill sets all (or a range of) array elements to a value — it is much faster than a manual loop because the JIT can emit a vectorised fill; Span<T>.Fill works identically for stack and memory buffers.",
  },
  {
    id: "cs-array-copy-to",
    language: "csharp",
    title: "Array.Copy and CopyTo — fast array duplication",
    tag: "snippet",
    code: `int[] src  = { 1, 2, 3, 4, 5 };
int[] dest = new int[5];

Array.Copy(src, dest, src.Length);              // full copy
Console.WriteLine(string.Join(",", dest));      // 1,2,3,4,5

Array.Copy(src, 1, dest, 0, 3);               // src[1..3] → dest[0..2]
Console.WriteLine(string.Join(",", dest));      // 2,3,4,4,5

// CopyTo: instance method, always copies to index 0 of dest
src.CopyTo(dest, 0);
Console.WriteLine(string.Join(",", dest));      // 1,2,3,4,5`,
    explanation:
      "Array.Copy supports arbitrary source and destination offsets; CopyTo is a convenience method that copies the entire array starting at a given destination index — both handle overlapping regions correctly.",
  },
  {
    id: "cs-array-sort-comparison",
    language: "csharp",
    title: "Array.Sort with Comparison<T> delegate",
    tag: "snippet",
    code: `string[] names = { "banana", "Apple", "cherry", "Date" };

// Default sort: ordinal case-sensitive
Array.Sort(names);
Console.WriteLine(string.Join(",", names));  // Apple,Date,banana,cherry

// Custom comparison (case-insensitive)
Array.Sort(names, (a, b) => string.Compare(a, b, StringComparison.OrdinalIgnoreCase));
Console.WriteLine(string.Join(",", names));  // Apple,banana,cherry,Date

// Sort a subrange: Array.Sort(array, index, length, comparer)
int[] nums = { 5, 3, 8, 1, 7 };
Array.Sort(nums, 1, 3);  // sort only indices 1..3
Console.WriteLine(string.Join(",", nums));  // 5,1,3,8,7`,
    explanation:
      "Array.Sort with a Comparison<T> delegate avoids creating a full IComparer object for simple cases — the delegate is called for each comparison pair and can close over context, unlike a static IComparer.",
  },
  {
    id: "cs-array-binary-search",
    language: "csharp",
    title: "Array.BinarySearch — O(log n) search on sorted arrays",
    tag: "snippet",
    code: `int[] sorted = { 1, 3, 5, 7, 9, 11, 13 };

int idx = Array.BinarySearch(sorted, 7);
Console.WriteLine(idx);   // 3  (found at index 3)

int missing = Array.BinarySearch(sorted, 6);
Console.WriteLine(missing);  // -4  (negative: ~missing is insert position)
Console.WriteLine(~missing); // 3   (6 would be inserted at index 3)

// Works on subrange too
int sub = Array.BinarySearch(sorted, 2, 3, 9);  // search indices 2..4
Console.WriteLine(sub);   // 4`,
    explanation:
      "Array.BinarySearch returns the index if found, or a negative bitwise complement of the insertion point if not found — use ~result to get the position where the value would be inserted to keep the array sorted.",
  },
  {
    id: "cs-dict-get-value-default",
    language: "csharp",
    title: "Dictionary.GetValueOrDefault — safe key access without exceptions",
    tag: "snippet",
    code: `var counts = new Dictionary<string, int>
{
    ["apple"]  = 3,
    ["banana"] = 7,
};

// No KeyNotFoundException — returns default(TValue) for missing keys
int appleCount  = counts.GetValueOrDefault("apple");   // 3
int grapeCount  = counts.GetValueOrDefault("grape");   // 0
int grapeCustom = counts.GetValueOrDefault("grape", -1); // -1

Console.WriteLine(appleCount);   // 3
Console.WriteLine(grapeCount);   // 0
Console.WriteLine(grapeCustom);  // -1`,
    explanation:
      "GetValueOrDefault is the cleanest way to read from a dictionary when a missing key is a valid scenario — it avoids the TryGetValue boilerplate and the KeyNotFoundException risk of the indexer.",
  },
  {
    id: "cs-dict-tryadd",
    language: "csharp",
    title: "Dictionary.TryAdd — insert only if key is absent",
    tag: "snippet",
    code: `var registry = new Dictionary<string, int>();

bool added1 = registry.TryAdd("x", 10);  // true — key is new
bool added2 = registry.TryAdd("x", 99);  // false — key exists, value unchanged

Console.WriteLine(added1);          // True
Console.WriteLine(added2);          // False
Console.WriteLine(registry["x"]);   // 10

// Equivalent to: if (!dict.ContainsKey(key)) dict[key] = value;
// but TryAdd is atomic for ConcurrentDictionary`,
    explanation:
      "TryAdd returns true if the key was inserted and false if it already existed — it is cleaner than the ContainsKey+indexer pattern and, on ConcurrentDictionary, is a single atomic operation.",
  },
  {
    id: "cs-dict-keys-views",
    language: "csharp",
    title: "Dictionary.Keys and Values — live collection views",
    tag: "caveats",
    code: `var dict = new Dictionary<string, int> { ["a"] = 1, ["b"] = 2 };

Dictionary<string, int>.KeyCollection keys = dict.Keys;
Console.WriteLine(keys.Count);    // 2

dict["c"] = 3;
Console.WriteLine(keys.Count);    // 3  — live view reflects the addition

// Iterate safely over a snapshot if you need to modify the dict:
foreach (string key in dict.Keys.ToList())  // ToList() materialises a snapshot
{
    if (key == "b") dict.Remove(key);
}
Console.WriteLine(dict.Count);    // 2`,
    explanation:
      "Dictionary.Keys and Values return live views that reflect subsequent modifications — iterating while modifying the dictionary throws InvalidOperationException; take a .ToList() snapshot first if you need to modify during iteration.",
  },
  {
    id: "cs-hashset-overlaps",
    language: "csharp",
    title: "HashSet.Overlaps, IsSubsetOf, IsSupersetOf — set relationship tests",
    tag: "structures",
    code: `var a = new HashSet<int> { 1, 2, 3, 4 };
var b = new HashSet<int> { 3, 4, 5 };
var c = new HashSet<int> { 2, 3 };

Console.WriteLine(a.Overlaps(b));      // True  — share at least one element
Console.WriteLine(a.Overlaps(new[] { 99 }));  // False

Console.WriteLine(c.IsSubsetOf(a));    // True  — c ⊆ a
Console.WriteLine(a.IsSupersetOf(c));  // True  — a ⊇ c
Console.WriteLine(a.IsSubsetOf(b));    // False`,
    explanation:
      "HashSet set-relationship methods (Overlaps, IsSubsetOf, IsSupersetOf, IsProperSubsetOf, SetEquals) all accept any IEnumerable<T> and run in O(n) — they are more expressive and often faster than equivalent LINQ queries.",
  },
  {
    id: "cs-hashset-symdiff",
    language: "csharp",
    title: "HashSet.SymmetricExceptWith — in-place symmetric difference",
    tag: "structures",
    code: `var a = new HashSet<int> { 1, 2, 3, 4 };
var b = new HashSet<int> { 3, 4, 5, 6 };

// a becomes elements in exactly one of (a, b) — modifies a in place
a.SymmetricExceptWith(b);
Console.WriteLine(string.Join(",", a.OrderBy(x => x)));  // 1,2,5,6

// Other in-place set operations:
// a.IntersectWith(b);      — keep only elements in both
// a.UnionWith(b);          — add all elements from b
// a.ExceptWith(b);         — remove elements in b`,
    explanation:
      "HashSet in-place mutation methods (SymmetricExceptWith, IntersectWith, UnionWith, ExceptWith) modify the set directly without creating a new collection — use them when you do not need to preserve the original set.",
  },
  {
    id: "cs-priority-queue",
    language: "csharp",
    title: "PriorityQueue<TElement,TPriority> — min-heap (.NET 6+)",
    tag: "structures",
    code: `var pq = new PriorityQueue<string, int>();

pq.Enqueue("low",    10);
pq.Enqueue("high",    1);
pq.Enqueue("medium",  5);

// Dequeues in priority order (lowest priority value first)
while (pq.Count > 0)
{
    string item = pq.Dequeue();   // throws if empty
    Console.WriteLine(item);
}
// high
// medium
// low

// TryDequeue for safe dequeue:
if (pq.TryDequeue(out string? val, out int pri))
    Console.WriteLine($"{val} at priority {pri}");`,
    explanation:
      "PriorityQueue is a min-heap: the element with the lowest priority value is dequeued first — use negative priorities or reverse the comparison if you need a max-heap behaviour.",
  },
  {
    id: "cs-span-contains",
    language: "csharp",
    title: "Span<T>.Contains and IndexOf — search without allocating",
    tag: "snippet",
    code: `ReadOnlySpan<int> data = new[] { 10, 20, 30, 40, 50 };

Console.WriteLine(data.Contains(30));        // True
Console.WriteLine(data.IndexOf(30));         // 2
Console.WriteLine(data.LastIndexOf(20));     // 1
Console.WriteLine(data.IndexOf(99));         // -1

// For strings — operates on chars without allocating
ReadOnlySpan<char> text = "Hello, World!".AsSpan();
Console.WriteLine(text.Contains(','));       // True
Console.WriteLine(text.IndexOf("World"));   // 7`,
    explanation:
      "Span<T> search methods operate directly on the underlying memory without any heap allocation — use them in hot paths where you process many substrings or byte sequences and allocation overhead matters.",
  },
  {
    id: "cs-readonly-span-split",
    language: "csharp",
    title: "MemoryExtensions.Split — split a span without allocating",
    tag: "snippet",
    code: `ReadOnlySpan<char> line = "one,two,three".AsSpan();

// SpanSplitEnumerator — yields ReadOnlySpan<char> ranges (.NET 8+)
foreach (Range range in line.Split(','))
{
    Console.WriteLine(line[range].ToString());
}
// one
// two
// three

// Count tokens without allocation:
int count = 0;
foreach (var _ in line.Split(',')) count++;
Console.WriteLine(count);  // 3`,
    explanation:
      "MemoryExtensions.Split on ReadOnlySpan<char> returns a ref struct enumerator that produces Range values — each token is accessed as a sub-span, making tokenisation completely allocation-free.",
  },
  {
    id: "cs-bit-operations",
    language: "csharp",
    title: "System.Numerics.BitOperations — hardware-accelerated bit tricks",
    tag: "snippet",
    code: `using System.Numerics;

uint n = 0b_1011_0100_u;  // 180

Console.WriteLine(BitOperations.PopCount(n));           // 4  — set bits
Console.WriteLine(BitOperations.LeadingZeroCount(n));   // 24 — leading zeros in 32-bit
Console.WriteLine(BitOperations.TrailingZeroCount(n));  // 2  — trailing zeros
Console.WriteLine(BitOperations.Log2(n));               // 7  — floor(log2(180))
Console.WriteLine(BitOperations.IsPow2(64));            // True
Console.WriteLine(BitOperations.RoundUpToPowerOf2(100)); // 128`,
    explanation:
      "BitOperations maps directly to CPU instructions (POPCNT, LZCNT, BSF) on supported hardware — use it instead of manual bit-twiddling loops for counting, rounding, and inspecting integer bit patterns.",
  },
  {
    id: "cs-math-divrem",
    language: "csharp",
    title: "Math.DivRem — quotient and remainder in one call",
    tag: "snippet",
    code: `// Single call computes both quotient and remainder
(int quotient, int remainder) = Math.DivRem(17, 5);
Console.WriteLine($"q={quotient}, r={remainder}");  // q=3, r=2

// Also available for long and other integer types
(long q, long r) = Math.DivRem(1_000_000_000_000L, 7L);
Console.WriteLine($"q={q}, r={r}");

// Useful for base-conversion or time decomposition:
(int hours, int minutes) = Math.DivRem(137, 60);
Console.WriteLine($"{hours}h {minutes}m");  // 2h 17m`,
    explanation:
      "Math.DivRem computes integer division and modulo in one operation — on modern CPUs the hardware performs both in a single DIV instruction, so DivRem can be faster than computing / and % separately.",
  },
  {
    id: "cs-math-round-midpoint",
    language: "csharp",
    title: "Math.Round MidpointRounding — banker's vs school rounding",
    tag: "caveats",
    code: `double a = 2.5;
double b = 3.5;

// Default (AwayFromZero): school rounding
Console.WriteLine(Math.Round(a));   // 3
Console.WriteLine(Math.Round(b));   // 4

// ToEven (banker's rounding): rounds to nearest even
Console.WriteLine(Math.Round(a, MidpointRounding.ToEven));   // 2
Console.WriteLine(Math.Round(b, MidpointRounding.ToEven));   // 4

// With decimal places
Console.WriteLine(Math.Round(2.345, 2, MidpointRounding.AwayFromZero)); // 2.35
Console.WriteLine(Math.Round(2.345, 2, MidpointRounding.ToEven));       // 2.34`,
    explanation:
      "C# Math.Round defaults to AwayFromZero (school rounding), unlike Python's round() which uses banker's rounding — specify MidpointRounding.ToEven explicitly when statistical bias from rounding must be minimised.",
  },
  {
    id: "cs-math-clamp",
    language: "csharp",
    title: "Math.Clamp — constrain a value to a range",
    tag: "snippet",
    code: `int score = 150;
int clamped = Math.Clamp(score, 0, 100);
Console.WriteLine(clamped);   // 100

double temp = -5.0;
Console.WriteLine(Math.Clamp(temp, 0.0, 100.0));  // 0.0

// Generic version works on any IComparable<T> (.NET 6+):
// Math.Clamp<T>(T value, T min, T max)

// Equivalent to: value < min ? min : value > max ? max : value
// Math.Clamp is more readable and compiler-optimised`,
    explanation:
      "Math.Clamp restricts a value to [min, max] — a single call is cleaner and often faster than nested Math.Min/Max, and the generic overload works on any type that implements IComparable<T>.",
  },
  {
    id: "cs-random-getitems",
    language: "csharp",
    title: "Random.GetItems and Shuffle — .NET 8 collection randomisation",
    tag: "snippet",
    code: `var rng = Random.Shared;

string[] suits = { "Hearts", "Diamonds", "Clubs", "Spades" };

// GetItems: pick N items with replacement (may repeat)
string[] hand = rng.GetItems(suits, 5);
Console.WriteLine(string.Join(", ", hand));

// Shuffle: Fisher-Yates in-place shuffle
int[] deck = Enumerable.Range(1, 52).ToArray();
rng.Shuffle(deck);
Console.WriteLine(string.Join(",", deck[..5]));  // first 5 of shuffled deck`,
    explanation:
      "Random.GetItems and Random.Shuffle were added in .NET 8 — GetItems samples with replacement (can repeat), while Shuffle performs a cryptographically unbiased Fisher-Yates shuffle in-place.",
  },
  {
    id: "cs-stopwatch-elapsed",
    language: "csharp",
    title: "Stopwatch — high-resolution timing",
    tag: "snippet",
    code: `using System.Diagnostics;

var sw = Stopwatch.StartNew();

// ... work to measure ...
Thread.Sleep(42);

sw.Stop();
Console.WriteLine($"Elapsed: {sw.ElapsedMilliseconds} ms");
Console.WriteLine($"Elapsed: {sw.Elapsed.TotalMilliseconds:F2} ms (precise)");
Console.WriteLine($"Ticks: {sw.ElapsedTicks}");

// Restart without new allocation:
sw.Restart();

// Static frequency for converting ticks to seconds manually:
Console.WriteLine($"Frequency: {Stopwatch.Frequency} ticks/second");`,
    explanation:
      "Stopwatch uses the system's high-resolution performance counter — prefer sw.Elapsed.TotalMilliseconds over ElapsedMilliseconds for sub-millisecond precision; use Restart() rather than Stop+Start to avoid allocating a new instance.",
  },
  {
    id: "cs-process-start",
    language: "csharp",
    title: "Process.Start — launch external processes and capture output",
    tag: "snippet",
    code: `using System.Diagnostics;

var psi = new ProcessStartInfo("git", "status")
{
    RedirectStandardOutput = true,
    RedirectStandardError  = true,
    UseShellExecute        = false,   // required for redirection
    CreateNoWindow         = true,
};

using var proc = Process.Start(psi)!;
string output = await proc.StandardOutput.ReadToEndAsync();
await proc.WaitForExitAsync();

Console.WriteLine($"Exit: {proc.ExitCode}");
Console.WriteLine(output[..Math.Min(100, output.Length)]);`,
    explanation:
      "Set UseShellExecute = false to enable stream redirection — always read stdout before calling WaitForExit to avoid deadlocking when the child process's output buffer fills up waiting for the parent to read it.",
  },
  {
    id: "cs-file-readalltext",
    language: "csharp",
    title: "File.ReadAllText / WriteAllText — simple file I/O",
    tag: "snippet",
    code: `string path = Path.GetTempFileName();

// Write
File.WriteAllText(path, "Hello, file!\nLine 2.");

// Read entire file as string
string content = File.ReadAllText(path);
Console.WriteLine(content);

// Read as lines
string[] lines = File.ReadAllLines(path);
Console.WriteLine($"Lines: {lines.Length}");

// Async variants for UI/server code
await File.WriteAllTextAsync(path, "async write");
string asyncContent = await File.ReadAllTextAsync(path);

File.Delete(path);`,
    explanation:
      "File.ReadAllText and WriteAllText are fine for small files — for large files prefer StreamReader/StreamWriter to avoid loading the entire content into memory; always use the async variants in async contexts.",
  },
  {
    id: "cs-directory-enumerate",
    language: "csharp",
    title: "Directory.EnumerateFiles — lazy file-system traversal",
    tag: "snippet",
    code: `string tempDir = Path.GetTempPath();

// EnumerateFiles is lazy — doesn't load all names at once
foreach (string file in Directory.EnumerateFiles(tempDir, "*.tmp"))
{
    Console.WriteLine(Path.GetFileName(file));
    break;  // stop after first match — lazy iteration
}

// Recursive with pattern
IEnumerable<string> csFiles = Directory.EnumerateFiles(
    ".", "*.cs", SearchOption.AllDirectories);

Console.WriteLine(csFiles.Count());`,
    explanation:
      "Directory.EnumerateFiles returns an IEnumerable that yields paths lazily — prefer it over GetFiles when you only need a subset of results, because GetFiles materialises all paths into a string[] first.",
  },
  {
    id: "cs-path-combine-ext",
    language: "csharp",
    title: "Path.Combine, GetExtension, ChangeExtension — cross-platform paths",
    tag: "snippet",
    code: `string full = Path.Combine("src", "data", "file.json");
Console.WriteLine(full);   // src/data/file.json (or src\\data\\file.json on Windows)

Console.WriteLine(Path.GetFileName(full));           // file.json
Console.WriteLine(Path.GetFileNameWithoutExtension(full)); // file
Console.WriteLine(Path.GetExtension(full));          // .json
Console.WriteLine(Path.GetDirectoryName(full));      // src/data

string changed = Path.ChangeExtension(full, ".yaml");
Console.WriteLine(changed);  // src/data/file.yaml`,
    explanation:
      "Always use Path.Combine instead of string concatenation for file paths — it handles OS-specific separators automatically, and the other Path methods are safer than manual string slicing for extracting path components.",
  },
  {
    id: "cs-streamreader-readline",
    language: "csharp",
    title: "StreamReader — line-by-line file reading without loading all",
    tag: "snippet",
    code: `string path = Path.GetTempFileName();
File.WriteAllText(path, "line1\nline2\nline3");

// Line-by-line — only one line in memory at a time
using var reader = new StreamReader(path);
string? line;
int lineNum = 0;
while ((line = reader.ReadLine()) != null)
{
    Console.WriteLine($"{++lineNum}: {line}");
}

// Async variant for server/UI code:
using var asyncReader = new StreamReader(path);
while ((line = await asyncReader.ReadLineAsync()) != null)
    Console.WriteLine(line);

File.Delete(path);`,
    explanation:
      "StreamReader.ReadLine buffers internally and streams the file without loading it all into memory — essential for log files, large CSVs, or any text larger than available RAM.",
  },
  {
    id: "cs-streamwriter-buffered",
    language: "csharp",
    title: "StreamWriter — buffered text output with AutoFlush",
    tag: "snippet",
    code: `string path = Path.GetTempFileName();

using var writer = new StreamWriter(path, append: false)
{
    AutoFlush = false   // default: buffer for better performance
};

for (int i = 0; i < 1000; i++)
    writer.WriteLine($"line {i}");

// writer.Flush() is called automatically by Dispose (using block exit)
// or call writer.Flush() manually to write buffered data

Console.WriteLine(new FileInfo(path).Length);  // should be > 0

File.Delete(path);`,
    explanation:
      "StreamWriter buffers output by default — AutoFlush = true writes after every call (safer for logs/diagnostics) at the cost of more I/O syscalls; the buffer is always flushed on Dispose (end of using block).",
  },
  {
    id: "cs-memorystream-toarray",
    language: "csharp",
    title: "MemoryStream — in-memory stream for binary data",
    tag: "snippet",
    code: `using var ms = new MemoryStream();
using var writer = new BinaryWriter(ms, System.Text.Encoding.UTF8, leaveOpen: true);

writer.Write(42);         // int
writer.Write(3.14f);      // float
writer.Write("hello");    // length-prefixed string
writer.Flush();

// Read the raw bytes
byte[] bytes = ms.ToArray();
Console.WriteLine(bytes.Length);   // 4 + 4 + 6 = 14 (approx)

// Reset and read back
ms.Seek(0, SeekOrigin.Begin);
using var reader = new BinaryReader(ms, System.Text.Encoding.UTF8, leaveOpen: true);
Console.WriteLine(reader.ReadInt32());    // 42
Console.WriteLine(reader.ReadSingle());   // 3.14`,
    explanation:
      "MemoryStream provides a Stream interface over a byte array — use leaveOpen: true with BinaryReader/Writer to prevent them from closing the MemoryStream on disposal, allowing further access to the buffer.",
  },
  {
    id: "cs-httpclient-getstring",
    language: "csharp",
    title: "HttpClient — GET request and response handling",
    tag: "snippet",
    code: `using var client = new HttpClient();
client.DefaultRequestHeaders.Add("User-Agent", "MyApp/1.0");
client.Timeout = TimeSpan.FromSeconds(10);

// Simple GET
string body = await client.GetStringAsync("https://httpbin.org/get");
Console.WriteLine(body[..100]);

// With status code check
HttpResponseMessage response = await client.GetAsync("https://httpbin.org/status/200");
response.EnsureSuccessStatusCode();   // throws HttpRequestException if not 2xx
Console.WriteLine(response.StatusCode);  // OK`,
    explanation:
      "HttpClient should be reused (shared per application or via IHttpClientFactory) — creating a new instance per request exhausts socket connections; EnsureSuccessStatusCode throws a descriptive exception on HTTP errors.",
  },
  {
    id: "cs-httpclient-sendasync",
    language: "csharp",
    title: "HttpClient SendAsync — full request/response control",
    tag: "snippet",
    code: `using var client = new HttpClient();

var request = new HttpRequestMessage(HttpMethod.Post, "https://httpbin.org/post")
{
    Content = new StringContent(
        """{"key":"value"}""",
        System.Text.Encoding.UTF8,
        "application/json")
};
request.Headers.Add("X-Custom", "header-value");

HttpResponseMessage resp = await client.SendAsync(request);
resp.EnsureSuccessStatusCode();

string json = await resp.Content.ReadAsStringAsync();
Console.WriteLine(json[..100]);`,
    explanation:
      "HttpRequestMessage gives full control over method, headers, and body — use it for POST/PUT/PATCH requests or when you need to set custom headers; StringContent with mediaType avoids having to set Content-Type manually.",
  },
  {
    id: "cs-json-property-name",
    language: "csharp",
    title: "[JsonPropertyName] — map C# property to a JSON key",
    tag: "snippet",
    code: `using System.Text.Json;
using System.Text.Json.Serialization;

class ApiResponse
{
    [JsonPropertyName("user_name")]   // JSON: user_name → C#: UserName
    public string UserName { get; set; } = "";

    [JsonPropertyName("access_token")]
    public string AccessToken { get; set; } = "";
}

string json = """{"user_name":"alice","access_token":"tok-123"}""";
ApiResponse obj = JsonSerializer.Deserialize<ApiResponse>(json)!;
Console.WriteLine(obj.UserName);      // alice
Console.WriteLine(obj.AccessToken);   // tok-123`,
    explanation:
      "[JsonPropertyName] maps a JSON key name to a differently-named C# property — essential when the API uses snake_case or kebab-case but your C# follows PascalCase conventions.",
  },
  {
    id: "cs-json-ignore",
    language: "csharp",
    title: "[JsonIgnore] — exclude properties from JSON serialisation",
    tag: "snippet",
    code: `using System.Text.Json;
using System.Text.Json.Serialization;

class User
{
    public string Name { get; set; } = "";

    [JsonIgnore]
    public string PasswordHash { get; set; } = "secret";

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? OptionalField { get; set; }
}

string json = JsonSerializer.Serialize(new User { Name = "Bob", PasswordHash = "h" });
Console.WriteLine(json);  // {"Name":"Bob"}  — PasswordHash omitted`,
    explanation:
      "[JsonIgnore] excludes a property entirely; [JsonIgnore(Condition = WhenWritingNull)] omits null values on write but still reads them — useful for optional fields in APIs that use sparse JSON representations.",
  },
  {
    id: "cs-json-number-handling",
    language: "csharp",
    title: "[JsonNumberHandling] — allow numbers as strings in JSON",
    tag: "snippet",
    code: `using System.Text.Json;
using System.Text.Json.Serialization;

class Measurement
{
    [JsonNumberHandling(JsonNumberHandling.AllowReadingFromString)]
    public double Value { get; set; }

    [JsonNumberHandling(JsonNumberHandling.WriteAsString)]
    public long Id { get; set; }
}

string json = """{"Value":"3.14","Id":12345}""";
Measurement m = JsonSerializer.Deserialize<Measurement>(json)!;
Console.WriteLine(m.Value);   // 3.14

string serialised = JsonSerializer.Serialize(new Measurement { Id = 99L });
Console.WriteLine(serialised);  // {"Value":0,"Id":"99"}`,
    explanation:
      "[JsonNumberHandling] lets you handle JSON APIs that quote numbers as strings — AllowReadingFromString accepts both quoted and unquoted, WriteAsString always serialises as a quoted string.",
  },
  {
    id: "cs-json-polymorphic",
    language: "csharp",
    title: "[JsonPolymorphic] — serialise derived types with type discriminators",
    tag: "types",
    code: `using System.Text.Json;
using System.Text.Json.Serialization;

[JsonPolymorphic(TypeDiscriminatorPropertyName = "$type")]
[JsonDerivedType(typeof(Cat),  typeDiscriminator: "cat")]
[JsonDerivedType(typeof(Dog),  typeDiscriminator: "dog")]
abstract class Animal { public string Name { get; set; } = ""; }

class Cat : Animal { public bool Indoor { get; set; } }
class Dog : Animal { public string Breed { get; set; } = ""; }

Animal[] animals = { new Cat { Name = "Whiskers", Indoor = true },
                     new Dog { Name = "Rex", Breed = "Lab" } };

string json = JsonSerializer.Serialize<IEnumerable<Animal>>(animals);
Console.WriteLine(json);
// [{"$type":"cat","Indoor":true,"Name":"Whiskers"},{"$type":"dog","Breed":"Lab","Name":"Rex"}]`,
    explanation:
      "[JsonPolymorphic] enables round-trip serialisation of polymorphic hierarchies by embedding a type discriminator — the deserialiser reads the discriminator to construct the correct derived type.",
  },
  {
    id: "cs-nullable-annotations",
    language: "csharp",
    title: "Nullable reference type annotations — ? and ! operators",
    tag: "types",
    code: `#nullable enable

string? nullableStr = null;       // explicitly nullable
string nonNullStr   = "hello";    // compiler warns if assigned null

// Null-coalescing
string result = nullableStr ?? "default";
Console.WriteLine(result);   // default

// Null-conditional access
int? length = nullableStr?.Length;
Console.WriteLine(length);   // (null)

// Null-forgiving operator — tells compiler "I know this is not null"
string forced = nullableStr!;  // suppresses CS8600 warning (use carefully)
Console.WriteLine(forced?.Length);  // null (still null at runtime!)`,
    explanation:
      "The nullable reference type system is a compile-time static analysis tool — ? declares intent (nullable), ! suppresses warnings (dangerous if wrong), and the runtime behaviour is unchanged; null dereferences still throw NullReferenceException.",
  },
  {
    id: "cs-nullable-value-type",
    language: "csharp",
    title: "Nullable<T> value types — HasValue, Value, GetValueOrDefault",
    tag: "types",
    code: `int? a = 42;
int? b = null;

// HasValue and Value
Console.WriteLine(a.HasValue);   // True
Console.WriteLine(a.Value);      // 42
// b.Value;                       // throws InvalidOperationException

// GetValueOrDefault
Console.WriteLine(b.GetValueOrDefault());    // 0
Console.WriteLine(b.GetValueOrDefault(-1));  // -1

// Lifted operators — null propagates
int? sum = a + b;
Console.WriteLine(sum);   // (null)

// Null-coalescing
int safe = b ?? 99;
Console.WriteLine(safe);  // 99`,
    explanation:
      "Nullable<T> (int?, bool?, etc.) wraps a value type to allow null — lifted operators propagate null through arithmetic, and GetValueOrDefault is safer than .Value which throws on null.",
  },
  {
    id: "cs-pattern-not-and-or",
    language: "csharp",
    title: "not / and / or patterns — logical pattern combinators (C# 9)",
    tag: "snippet",
    code: `static string Classify(int n) => n switch
{
    < 0           => "negative",
    0             => "zero",
    > 0 and <= 10 => "small positive",
    > 10 and < 100 => "medium positive",
    >= 100        => "large"
};

Console.WriteLine(Classify(-5));  // negative
Console.WriteLine(Classify(7));   // small positive
Console.WriteLine(Classify(42));  // medium positive

// Not pattern
object? obj = "hello";
if (obj is not null and string s)
    Console.WriteLine(s.ToUpper());  // HELLO`,
    explanation:
      "The logical pattern operators not, and, or compose sub-patterns without parentheses ambiguity (and binds tighter than or) — they work in switch arms, is expressions, and when guards for concise range and type checks.",
  },
  {
    id: "cs-pattern-relational",
    language: "csharp",
    title: "Relational patterns — <, <=, >, >= in switch and is",
    tag: "snippet",
    code: `double score = 85.0;

string grade = score switch
{
    >= 90 => "A",
    >= 80 => "B",
    >= 70 => "C",
    >= 60 => "D",
    _     => "F"
};
Console.WriteLine(grade);  // B

// Relational patterns in is expression
bool isAdult = 20 is >= 18;
Console.WriteLine(isAdult);  // True

// Combined with type pattern
static bool InRange(object o) => o is int i and >= 0 and <= 100;`,
    explanation:
      "Relational patterns (>=, <=, >, <) can appear in switch arms and is expressions — the switch arms are checked top-to-bottom, so ordering from most to least specific matters.",
  },
  {
    id: "cs-top-level-statements",
    language: "csharp",
    title: "Top-level statements — minimal program entry point (C# 9)",
    tag: "understanding",
    code: `// Program.cs — no class or Main method needed
using System;

Console.WriteLine("Hello from top-level statements!");

// await is allowed at top level (requires async context)
await Task.Delay(1);

// Args are available as a built-in 'args' variable
foreach (string arg in args)
    Console.WriteLine($"Arg: {arg}");

// Return exit code:
// return 1;`,
    explanation:
      "Top-level statements allow a minimal entry point without the Main method boilerplate — the compiler synthesises a class and async Main wrapper; only one file per project may use top-level statements.",
  },
  {
    id: "cs-record-equality",
    language: "csharp",
    title: "Record equality — value-based == and Equals",
    tag: "understanding",
    code: `record Point(double X, double Y);

var a = new Point(1.0, 2.0);
var b = new Point(1.0, 2.0);
var c = new Point(3.0, 4.0);

Console.WriteLine(a == b);   // True  — value equality
Console.WriteLine(a == c);   // False
Console.WriteLine(ReferenceEquals(a, b)); // False — different objects

// Derived records compare using their own type + all properties
record Point3D(double X, double Y, double Z) : Point(X, Y);

var p2d = new Point(1, 2);
var p3d = new Point3D(1, 2, 0);
Console.WriteLine(p2d == p3d);  // False — different runtime types`,
    explanation:
      "Records override == and Equals to compare all properties by value — two records of different derived types are never equal even if their shared properties match, because the synthesised Equals checks EqualityContract (the runtime type).",
  },
  {
    id: "cs-record-tostring",
    language: "csharp",
    title: "Record ToString — automatic pretty-print",
    tag: "snippet",
    code: `record Address(string Street, string City, string Country);
record Person(string Name, int Age, Address Home);

var p = new Person("Alice", 30, new Address("123 Main", "NYC", "US"));
Console.WriteLine(p);
// Person { Name = Alice, Age = 30, Home = Address { Street = 123 Main, City = NYC, Country = US } }

// Nested records are recursively printed
// You can override ToString() for custom output:
record Temperature(double Celsius)
{
    public override string ToString() => $"{Celsius}°C ({Celsius * 9 / 5 + 32}°F)";
}
Console.WriteLine(new Temperature(100));  // 100°C (212°F)`,
    explanation:
      "Records generate a ToString() that prints all property values in a {Name = Value} format — nested records are recursively expanded; override ToString() when you need a domain-specific representation.",
  },
  {
    id: "cs-struct-with",
    language: "csharp",
    title: "struct with expression — non-destructive mutation of value types (C# 10)",
    tag: "snippet",
    code: `struct Colour
{
    public byte R { get; init; }
    public byte G { get; init; }
    public byte B { get; init; }
}

var red  = new Colour { R = 255, G = 0,   B = 0   };
var pink = red with { G = 100, B = 100 };  // copy red, change G and B

Console.WriteLine($"Red:  ({red.R}, {red.G}, {red.B})");   // (255, 0, 0)
Console.WriteLine($"Pink: ({pink.R}, {pink.G}, {pink.B})"); // (255, 100, 100)`,
    explanation:
      "The with expression was extended to structs in C# 10 — it creates a copy of the value type with specified properties replaced; like records, the source is not mutated; init-only properties allow this without setters.",
  },
  {
    id: "cs-interface-covariant-return",
    language: "csharp",
    title: "Covariant return types — override with a more-derived type (C# 9)",
    tag: "types",
    code: `class Animal
{
    public virtual Animal Clone() => new Animal();
}

class Dog : Animal
{
    // Return type is Dog, not Animal — covariant override
    public override Dog Clone() => new Dog();
}

Animal a = new Dog();
Animal clone = a.Clone();   // calls Dog.Clone() via virtual dispatch
Console.WriteLine(clone.GetType().Name);  // Dog — correct derived type`,
    explanation:
      "Covariant return types allow a method override to return a more-derived type than the base declaration — callers using the base type still compile, but callers with the derived type receive the more specific return type without casting.",
  },
  {
    id: "cs-implicit-explicit-cast",
    language: "csharp",
    title: "implicit / explicit cast operators — type conversion overloading",
    tag: "classes",
    code: `struct Celsius
{
    public double Value { get; }
    public Celsius(double v) => Value = v;

    // Implicit: no-cast conversion (safe, no data loss)
    public static implicit operator Fahrenheit(Celsius c)
        => new Fahrenheit(c.Value * 9 / 5 + 32);

    public override string ToString() => $"{Value}°C";
}

struct Fahrenheit
{
    public double Value { get; }
    public Fahrenheit(double v) => Value = v;
    // Explicit: requires cast (potential precision concerns)
    public static explicit operator Celsius(Fahrenheit f)
        => new Celsius((f.Value - 32) * 5 / 9);
}

Celsius boiling = new Celsius(100);
Fahrenheit f = boiling;              // implicit — no cast needed
Celsius back = (Celsius)f;           // explicit — cast required
Console.WriteLine(back);             // 100°C`,
    explanation:
      "Use implicit conversion when the operation is safe and lossless (like int to long); use explicit when information may be lost or precision reduced (like double to int) — this guides callers on when to expect surprises.",
  },
  {
    id: "cs-finalizer-vs-dispose",
    language: "csharp",
    title: "Finaliser vs Dispose — deterministic vs non-deterministic cleanup",
    tag: "understanding",
    code: `class ResourceHolder : IDisposable
{
    private bool _disposed = false;

    // Dispose: deterministic, called via 'using' or explicit Dispose()
    public void Dispose()
    {
        Dispose(disposing: true);
        GC.SuppressFinalize(this);  // prevent finaliser from running
    }

    // Finaliser: non-deterministic, called by GC if Dispose wasn't called
    ~ResourceHolder()
    {
        Dispose(disposing: false);
    }

    protected virtual void Dispose(bool disposing)
    {
        if (_disposed) return;
        if (disposing) { /* free managed resources */ }
        /* free unmanaged resources always */
        _disposed = true;
    }
}`,
    explanation:
      "The standard dispose pattern uses GC.SuppressFinalize to skip the finaliser when Dispose is called properly — the finaliser is only a safety net for callers who forget to Dispose, and it runs on the finaliser thread.",
  },
  {
    id: "cs-using-statement-pattern",
    language: "csharp",
    title: "using declarations — inline scoped disposal (C# 8)",
    tag: "snippet",
    code: `// Traditional using block
using (var conn1 = new System.IO.MemoryStream())
{
    conn1.WriteByte(1);
}   // conn1.Dispose() called here

// C# 8 using declaration — disposed at end of enclosing scope
{
    using var conn2 = new System.IO.MemoryStream();
    conn2.WriteByte(2);
    Console.WriteLine(conn2.Length);  // 1
}   // conn2.Dispose() called here — same as block end

// Useful for reducing nesting
static async Task<string> ReadFileAsync(string path)
{
    using var reader = new System.IO.StreamReader(path);
    return await reader.ReadToEndAsync();
}   // reader disposed when method returns`,
    explanation:
      "C# 8 using declarations dispose the object at the end of the enclosing block (method, if, or local block) rather than at an explicit closing brace — they reduce indentation when you do not need a finer-grained disposal scope.",
  },
  {
    id: "cs-extension-on-null",
    language: "csharp",
    title: "Extension methods on null — they can receive null this",
    tag: "caveats",
    code: `static class StringExtensions
{
    // Extension methods may be called on null — check explicitly
    public static bool IsNullOrEmpty(this string? s)
        => string.IsNullOrEmpty(s);

    public static string OrDefault(this string? s, string fallback)
        => s ?? fallback;
}

string? name = null;

// No NullReferenceException — extension is a static call in disguise
Console.WriteLine(name.IsNullOrEmpty());       // True
Console.WriteLine(name.OrDefault("unknown"));  // unknown`,
    explanation:
      "Extension methods are syntactic sugar for static method calls — unlike instance method calls, a null receiver does not throw automatically, so the extension method itself must check for null if necessary.",
  },
  {
    id: "cs-string-interpolation-raw",
    language: "csharp",
    title: "Raw string literals — multi-line strings without escapes (C# 11)",
    tag: "snippet",
    code: `// At least three quotes to open/close; indent is stripped from content
string json = """
    {
        "name": "Alice",
        "scores": [1, 2, 3]
    }
    """;

Console.WriteLine(json);

// Interpolated raw strings: use extra $ for each brace level
string name = "Bob";
string msg = $"""
    Hello, {name}!
    Your score is {42 * 2}.
    """;
Console.WriteLine(msg);`,
    explanation:
      "Raw string literals (\"\"\"...\"\"\") allow backslashes, quotes, and newlines without escaping — the leading whitespace up to the closing \"\"\" is stripped as indentation, making embedded JSON/HTML/SQL legible.",
  },
  {
    id: "cs-collection-expressions",
    language: "csharp",
    title: "Collection expressions — unified syntax for all collection types (C# 12)",
    tag: "snippet",
    code: `// [..] syntax works for arrays, List<T>, Span<T>, and IEnumerable<T>
int[] arr = [1, 2, 3];
List<int> list = [4, 5, 6];
Span<int> span = [7, 8, 9];

// Spread operator .. flattens nested collections
int[] merged = [..arr, ..list, 99];
Console.WriteLine(string.Join(",", merged));  // 1,2,3,4,5,6,99

// Empty collection
string[] empty = [];
Console.WriteLine(empty.Length);  // 0`,
    explanation:
      "Collection expressions (C# 12) provide a uniform literal syntax for arrays, List<T>, Span<T>, HashSet<T>, and any type with a [CollectionBuilder] attribute — the spread operator .. inlines another collection's elements.",
  },
  {
    id: "cs-primary-constructor-struct",
    language: "csharp",
    title: "Primary constructors on structs — compact struct initialisation (C# 12)",
    tag: "snippet",
    code: `// C# 12: primary constructors work on struct (not just record/class)
struct Vector2(float X, float Y)
{
    public float Length => MathF.Sqrt(X * X + Y * Y);

    public static Vector2 operator +(Vector2 a, Vector2 b)
        => new(a.X + b.X, a.Y + b.Y);
}

var v1 = new Vector2(3, 4);
var v2 = new Vector2(1, 0);
var v3 = v1 + v2;

Console.WriteLine($"Length of v1: {v1.Length}");  // 5
Console.WriteLine($"v3: ({v3.X}, {v3.Y})");        // (4, 4)`,
    explanation:
      "Primary constructors on structs (C# 12) reduce boilerplate by declaring parameters in the struct header — the parameters are in scope throughout the struct body for field initialisers and method bodies.",
  },
  {
    id: "cs-default-interface-impl",
    language: "csharp",
    title: "Default interface implementations — add methods without breaking consumers",
    tag: "classes",
    code: `interface ILogger
{
    void Log(string message);

    // Default implementation — implementing classes don't need to override
    void LogError(string message) => Log($"[ERROR] {message}");
    void LogInfo(string message)  => Log($"[INFO] {message}");
}

class ConsoleLogger : ILogger
{
    public void Log(string message) => Console.WriteLine(message);
    // LogError and LogInfo are inherited with default implementations
}

ILogger logger = new ConsoleLogger();
logger.LogError("Something went wrong");   // [ERROR] Something went wrong
logger.LogInfo("Started");                 // [INFO] Started`,
    explanation:
      "Default interface implementations let you add new methods to an interface without breaking existing implementors — the default is only accessible through the interface type, not through a concrete class variable.",
  },
  {
    id: "cs-pattern-deconstruct",
    language: "csharp",
    title: "Positional patterns with Deconstruct — match by decomposed values",
    tag: "snippet",
    code: `record Point(int X, int Y);

static string Quadrant(Point p) => p switch
{
    (> 0, > 0) => "Q1",
    (< 0, > 0) => "Q2",
    (< 0, < 0) => "Q3",
    (> 0, < 0) => "Q4",
    (0, _) or (_, 0) => "axis",
    _ => "origin"
};

Console.WriteLine(Quadrant(new Point(1, 2)));    // Q1
Console.WriteLine(Quadrant(new Point(-3, 5)));   // Q2
Console.WriteLine(Quadrant(new Point(0, 7)));    // axis`,
    explanation:
      "Positional patterns deconstruct the object using its Deconstruct method and match component values by position — records generate Deconstruct automatically; custom classes can provide it as a public void Deconstruct(...) method.",
  },
  {
    id: "cs-generic-math-number",
    language: "csharp",
    title: "Generic math with INumber<T> — type-safe numeric algorithms",
    tag: "types",
    code: `using System.Numerics;

static T Average<T>(IEnumerable<T> values) where T : INumber<T>
{
    T sum   = T.Zero;
    int count = 0;
    foreach (var v in values) { sum += v; count++; }
    return sum / T.CreateChecked(count);
}

Console.WriteLine(Average(new[] { 1, 2, 3, 4, 5 }));       // 3
Console.WriteLine(Average(new[] { 1.5, 2.5, 3.5 }));        // 2.5
Console.WriteLine(Average(new[] { 1m, 2m, 3m }));           // 2`,
    explanation:
      "INumber<T> (from System.Numerics) exposes arithmetic operators as static abstract members, enabling you to write one generic implementation that works correctly for int, double, decimal, and any other numeric type.",
  },
  {
    id: "cs-source-generator-concept",
    language: "csharp",
    title: "Source generators — compile-time code generation overview",
    tag: "understanding",
    code: `// Source generators run at compile time and add to the compilation.
// Common built-in examples:

// 1. System.Text.Json source gen (JsonSerializerContext — reflection-free)
// 2. LoggerMessage.Define — zero-alloc structured logging
// 3. Regex.GeneratedRegex — compile-time compiled regex

using System.Text.RegularExpressions;

partial class Parser
{
    // Source-generated regex: compiled to state machine at build time
    [GeneratedRegex(@"\b\d{3}-\d{4}\b", RegexOptions.NonBacktracking)]
    private static partial Regex PhonePattern();
}

Console.WriteLine(Parser.PhonePattern().IsMatch("555-1234"));  // True`,
    explanation:
      "[GeneratedRegex] is a source generator that emits a compiled state machine for the regex at build time — it is faster at startup than new Regex(pattern, Compiled) because compilation happens ahead of time.",
  },
  {
    id: "cs-span-string-create",
    language: "csharp",
    title: "string.Create — build strings without intermediate allocation",
    tag: "snippet",
    code: `// string.Create writes characters via a Span<char> callback
int year = 2026; int month = 5; int day = 12;

string date = string.Create(10, (year, month, day), (span, state) =>
{
    var (y, m, d) = state;
    span[0] = (char)('0' + y / 1000); span[1] = (char)('0' + y / 100 % 10);
    span[2] = (char)('0' + y / 10 % 10); span[3] = (char)('0' + y % 10);
    span[4] = '-';
    span[5] = (char)('0' + m / 10); span[6] = (char)('0' + m % 10);
    span[7] = '-';
    span[8] = (char)('0' + d / 10); span[9] = (char)('0' + d % 10);
});
Console.WriteLine(date);  // 2026-05-12`,
    explanation:
      "string.Create allocates the string once and fills it via a Span<char> callback — there is no intermediate StringBuilder or string allocation, making it the fastest way to construct non-trivial strings in hot paths.",
  },
  {
    id: "cs-index-type",
    language: "csharp",
    title: "System.Index — store ^n expressions as values",
    tag: "snippet",
    code: `int[] arr = { 10, 20, 30, 40, 50 };

// System.Index can store either a from-start or from-end index
Index last    = ^1;
Index fromEnd = new Index(2, fromEnd: true);  // ^2

Console.WriteLine(arr[last]);     // 50
Console.WriteLine(arr[fromEnd]);  // 40

// Useful when you want to parameterise which index to access
static T GetAt<T>(T[] a, Index idx) => a[idx];
Console.WriteLine(GetAt(arr, ^3));   // 30`,
    explanation:
      "System.Index is the type that ^ expressions produce — it stores both the offset and the from-end flag, allowing you to pass flexible index expressions as method parameters without converting to an absolute integer first.",
  },
  {
    id: "cs-range-type",
    language: "csharp",
    title: "System.Range — store .. slice expressions as values",
    tag: "snippet",
    code: `int[] arr = { 10, 20, 30, 40, 50 };

Range middle = 1..^1;   // indices 1 to second-from-end (exclusive)
int[] slice  = arr[middle];
Console.WriteLine(string.Join(",", slice));  // 20,30,40

// Construct programmatically
Range r = new Range(Index.FromStart(0), Index.FromEnd(2));
Console.WriteLine(string.Join(",", arr[r]));  // 10,20,30

// Useful for passing slice specifications as parameters
static int[] Slice(int[] a, Range r) => a[r];
Console.WriteLine(string.Join(",", Slice(arr, 2..)));  // 30,40,50`,
    explanation:
      "System.Range stores both endpoints as System.Index values — it can represent any combination of from-start and from-end indices and is accepted by any type that exposes a Slice(int, int) method.",
  },
  {
    id: "cs-caller-info-attributes",
    language: "csharp",
    title: "[CallerMemberName], [CallerFilePath], [CallerLineNumber] — auto-filled args",
    tag: "snippet",
    code: `using System.Runtime.CompilerServices;

static void Log(
    string message,
    [CallerMemberName] string member = "",
    [CallerFilePath]   string file   = "",
    [CallerLineNumber] int    line   = 0)
{
    string fileName = System.IO.Path.GetFileName(file);
    Console.WriteLine($"[{fileName}:{line} {member}] {message}");
}

// Caller info is injected by the compiler at call sites:
Log("something happened");
// [Program.cs:25 <Main>$] something happened`,
    explanation:
      "Caller info attributes are filled in by the compiler at call sites with the enclosing member name, file path, and line number — ideal for logging, assertions, and INotifyPropertyChanged implementations without string literals.",
  },
  {
    id: "cs-conditional-attribute",
    language: "csharp",
    title: "[Conditional] — include method calls only for specific build configs",
    tag: "snippet",
    code: `using System.Diagnostics;

class Validator
{
    // This method is only called when DEBUG is defined
    [Conditional("DEBUG")]
    public static void Assert(bool condition, string message)
    {
        if (!condition)
            Console.WriteLine($"ASSERTION FAILED: {message}");
    }
}

Validator.Assert(1 + 1 == 2, "basic math");  // runs in DEBUG
Validator.Assert(1 + 1 == 3, "wrong");       // would print in DEBUG, skipped in Release

// [Conditional] elides call sites at compile time — no runtime overhead in Release`,
    explanation:
      "[Conditional] makes the compiler omit all call sites to the method when the specified preprocessor symbol is not defined — the method itself still exists but calls to it are completely removed, giving zero overhead in release builds.",
  },
  {
    id: "cs-obsolete-attribute",
    language: "csharp",
    title: "[Obsolete] — deprecate APIs with compiler warnings or errors",
    tag: "snippet",
    code: `class Service
{
    // Warning: still compiles but warns
    [Obsolete("Use NewMethod() instead.")]
    public void OldMethod() => Console.WriteLine("old");

    // Error: callers must be updated before the code compiles
    [Obsolete("Use ProcessAsync() instead.", error: true)]
    public void LegacyProcess() => Console.WriteLine("legacy");

    public void NewMethod()  => Console.WriteLine("new");
    public Task ProcessAsync() => Task.CompletedTask;
}

var s = new Service();
s.OldMethod();    // CS0618 warning
// s.LegacyProcess(); // CS0619 error — would not compile`,
    explanation:
      "[Obsolete] with error: false produces a warning at all call sites; error: true produces a compile error, forcing callers to update before the code compiles — use error: true after a suitable deprecation period.",
  },
  {
    id: "cs-init-accessor",
    language: "csharp",
    title: "init accessor — immutable property set only during construction",
    tag: "snippet",
    code: `class Order
{
    public int Id { get; init; }
    public string Product { get; init; } = "";
    public decimal Price { get; init; }
}

// Set via object initialiser
var order = new Order { Id = 1, Product = "Widget", Price = 9.99m };
Console.WriteLine(order.Id);       // 1
Console.WriteLine(order.Product);  // Widget

// order.Id = 2;   // CS8852: Init-only property can only be assigned
//                 // in an object initialiser, constructor, or 'init' accessor`,
    explanation:
      "init properties behave like set during object initialisation (constructor and object initialiser) and like readonly afterwards — they are the building block for immutable DTOs without requiring a constructor for every property combination.",
  },
  {
    id: "cs-record-clone",
    language: "csharp",
    title: "Record clone method — underlying mechanism of 'with'",
    tag: "understanding",
    code: `record Person(string Name, int Age);

var alice = new Person("Alice", 30);

// 'with' internally calls the compiler-generated Clone() and then sets properties
var bob = alice with { Name = "Bob" };

// You can call Clone() directly (returns object, requires cast)
// but 'with' is always preferred

Console.WriteLine(alice);  // Person { Name = Alice, Age = 30 }
Console.WriteLine(bob);    // Person { Name = Bob, Age = 30 }
Console.WriteLine(ReferenceEquals(alice, bob));  // False`,
    explanation:
      "The with expression calls the compiler-generated protected virtual <Clone>$() method (a copy constructor) then sets the specified init properties on the clone — you can override it in a derived record to control cloning behaviour.",
  },
  {
    id: "cs-iequatable-generic",
    language: "csharp",
    title: "IEquatable<T> — type-safe equality without boxing",
    tag: "classes",
    code: `struct Color : IEquatable<Color>
{
    public byte R { get; }
    public byte G { get; }
    public byte B { get; }

    public Color(byte r, byte g, byte b) { R = r; G = g; B = b; }

    // Typed Equals: no boxing, no null check needed (structs can't be null)
    public bool Equals(Color other) => R == other.R && G == other.G && B == other.B;

    public override bool Equals(object? obj) => obj is Color c && Equals(c);
    public override int GetHashCode() => HashCode.Combine(R, G, B);
    public static bool operator ==(Color a, Color b) => a.Equals(b);
    public static bool operator !=(Color a, Color b) => !a.Equals(b);
}

var red1 = new Color(255, 0, 0);
var red2 = new Color(255, 0, 0);
Console.WriteLine(red1 == red2);   // True`,
    explanation:
      "IEquatable<T> provides a typed Equals(T) overload that avoids boxing for value types — the generic collections (HashSet<T>, Dictionary<TKey,TValue>) use it preferentially over the object Equals overload for better performance.",
  },
  {
    id: "cs-icomparable-generic",
    language: "csharp",
    title: "IComparable<T> — enable sorting of custom types",
    tag: "classes",
    code: `struct Version : IComparable<Version>
{
    public int Major { get; }
    public int Minor { get; }

    public Version(int major, int minor) { Major = major; Minor = minor; }

    public int CompareTo(Version other)
    {
        int cmp = Major.CompareTo(other.Major);
        return cmp != 0 ? cmp : Minor.CompareTo(other.Minor);
    }

    public override string ToString() => $"{Major}.{Minor}";
}

var versions = new[] { new Version(2, 0), new Version(1, 9), new Version(2, 1) };
Array.Sort(versions);
Console.WriteLine(string.Join(", ", versions.Select(v => v.ToString())));
// 1.9, 2.0, 2.1`,
    explanation:
      "IComparable<T>.CompareTo returns negative if less than, zero if equal, and positive if greater — implementing it enables Array.Sort, List.Sort, and LINQ OrderBy to work on your custom type without an explicit comparer.",
  },
  {
    id: "cs-comparer-create",
    language: "csharp",
    title: "Comparer.Create — inline IComparer<T> from a delegate",
    tag: "snippet",
    code: `var words = new[] { "banana", "Apple", "cherry", "Date" };

// Create an IComparer<T> from a lambda — no class needed
IComparer<string> ignoreCase = Comparer<string>.Create(
    (a, b) => string.Compare(a, b, StringComparison.OrdinalIgnoreCase));

Array.Sort(words, ignoreCase);
Console.WriteLine(string.Join(", ", words));
// Apple, banana, cherry, Date

// SortedSet / SortedDictionary accept IComparer<T> in constructor
var sorted = new SortedSet<string>(ignoreCase);
sorted.UnionWith(words);
Console.WriteLine(string.Join(", ", sorted));`,
    explanation:
      "Comparer.Create wraps a lambda as an IComparer<T> — it avoids the boilerplate of writing a full class for one-off custom sorts in Array.Sort, SortedSet, or LINQ methods that accept a comparer.",
  },
  {
    id: "cs-lazy-init",
    language: "csharp",
    title: "Lazy<T> — thread-safe deferred initialisation",
    tag: "snippet",
    code: `using System.Threading;

var expensiveObj = new Lazy<List<int>>(() =>
{
    Console.WriteLine("Initialising...");
    return Enumerable.Range(1, 1_000_000).ToList();
});

Console.WriteLine("Before first access");
Console.WriteLine(expensiveObj.IsValueCreated);  // False

var list = expensiveObj.Value;   // initialised here
Console.WriteLine(expensiveObj.IsValueCreated);  // True
Console.WriteLine(list.Count);                   // 1000000

// Second access reuses the cached value
var same = expensiveObj.Value;
Console.WriteLine(ReferenceEquals(list, same));  // True`,
    explanation:
      "Lazy<T> defers object construction until the first access to .Value — by default it uses LazyThreadSafetyMode.ExecutionAndPublication which locks to ensure only one factory call happens across threads.",
  },
  {
    id: "cs-weakreference-cache",
    language: "csharp",
    title: "WeakReference<T> — hold object without preventing GC",
    tag: "structures",
    code: `class Image { public string Name { get; init; } = ""; }

var image = new Image { Name = "photo.jpg" };
var weak = new WeakReference<Image>(image);

// TryGetTarget: returns true and the object if still alive
if (weak.TryGetTarget(out Image? img))
    Console.WriteLine(img.Name);  // photo.jpg

// Allow GC to collect it
image = null!;
GC.Collect();

bool alive = weak.TryGetTarget(out _);
Console.WriteLine($"Still alive: {alive}");  // False (likely, GC is non-deterministic)`,
    explanation:
      "WeakReference<T> holds a reference that the GC can reclaim — use it for caches where you want to reuse objects if they happen to still be in memory but do not prevent collection when memory is tight.",
  },
  {
    id: "cs-environment-exits",
    language: "csharp",
    title: "Environment.Exit and AppContext — process lifetime control",
    tag: "snippet",
    code: `// Exit the process immediately with an exit code
// Environment.Exit(0);   // success
// Environment.Exit(1);   // failure

// Check for specific runtime features
bool isNetCore = AppContext.TryGetSwitch("AppContext.SetSwitch_test", out bool val);

// Set runtime switches for libraries
AppContext.SetSwitch("System.Net.Http.UseSocketsHttpHandler", true);

// Base directory of the app
Console.WriteLine(AppContext.BaseDirectory);

// System info
Console.WriteLine(Environment.MachineName);
Console.WriteLine(Environment.ProcessorCount);
Console.WriteLine(Environment.Version);`,
    explanation:
      "AppContext.SetSwitch configures runtime behaviour of BCL components (like which HTTP handler to use) without recompiling — Environment.Exit immediately terminates the process and is appropriate when recovery is impossible.",
  },
  {
    id: "cs-string-pool-intern",
    language: "csharp",
    title: "string.Intern — reuse identical string instances",
    tag: "caveats",
    code: `string a = new string(new[] { 'h', 'e', 'l', 'l', 'o' });  // new object
string b = new string(new[] { 'h', 'e', 'l', 'l', 'o' });  // new object

Console.WriteLine(ReferenceEquals(a, b));  // False — different objects

// Intern adds to (or retrieves from) the intern pool
string ia = string.Intern(a);
string ib = string.Intern(b);
Console.WriteLine(ReferenceEquals(ia, ib));  // True — same interned object

// String literals are interned automatically
string lit = "hello";
Console.WriteLine(ReferenceEquals(ia, lit));  // True`,
    explanation:
      "string.Intern deduplicates strings by content — useful when you have many equal strings from parsing (e.g. repeated field names), but interned strings are held in memory for the process lifetime and should not be used indiscriminately.",
  },
  {
    id: "cs-formattable-string",
    language: "csharp",
    title: "FormattableString — culture-aware interpolated strings",
    tag: "types",
    code: `using System.Globalization;

// FormattableString captures the format and arguments before formatting
FormattableString fs = $"Pi is {Math.PI:F3} and today is {DateTime.Now:d}";

// Format with a specific culture
string us = fs.ToString(CultureInfo.GetCultureInfo("en-US"));
string de = fs.ToString(CultureInfo.GetCultureInfo("de-DE"));

Console.WriteLine(us);  // Pi is 3.142 and today is 5/12/2026
Console.WriteLine(de);  // Pi is 3,142 and today is 12.05.2026

// Useful for logging, SQL parameters, or locale-specific output`,
    explanation:
      "Assigning an interpolated string to FormattableString instead of string captures the format template and argument values before formatting — you can then choose the culture at rendering time, enabling locale-aware string output.",
  },
  {
    id: "cs-object-pool",
    language: "csharp",
    title: "ObjectPool<T> — reuse expensive objects (Microsoft.Extensions)",
    tag: "structures",
    code: `using Microsoft.Extensions.ObjectPool;

// Policy defines how to create and reset objects
var policy = new DefaultPooledObjectPolicy<System.Text.StringBuilder>();
var pool   = new DefaultObjectPool<System.Text.StringBuilder>(policy, maximumRetained: 4);

// Get from pool (creates new if empty)
var sb = pool.Get();
sb.Append("Hello, pooled StringBuilder!");
string result = sb.ToString();
Console.WriteLine(result);

// Return to pool — the policy calls sb.Clear() via Reset()
pool.Return(sb);

// Next Get may reuse the same StringBuilder object`,
    explanation:
      "ObjectPool<T> recycles expensive-to-create objects (StringBuilder, byte[], custom classes) — the pooled objects must be returned and reset to a clean state to avoid state leakage between uses.",
  },
  {
    id: "cs-options-pattern",
    language: "csharp",
    title: "IOptions<T> pattern — strongly-typed configuration injection",
    tag: "structures",
    code: `using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

class DbSettings { public string ConnectionString { get; set; } = ""; }

var services = new ServiceCollection();
services.Configure<DbSettings>(opts =>
{
    opts.ConnectionString = "Server=localhost;Database=mydb";
});
services.AddSingleton<IOptions<DbSettings>>(sp =>
    sp.GetRequiredService<IOptions<DbSettings>>());

// In a service, inject IOptions<DbSettings>
services.AddTransient<MyService>();

// Retrieve and use
var provider = services.BuildServiceProvider();
var opts = provider.GetRequiredService<IOptions<DbSettings>>();
Console.WriteLine(opts.Value.ConnectionString);`,
    explanation:
      "The Options pattern binds configuration to strongly-typed classes and injects them via IOptions<T>, IOptionsSnapshot<T> (per-request reload), or IOptionsMonitor<T> (live change notifications) — it is the standard DI-friendly configuration approach in .NET.",
  },
  {
    id: "cs-span-indexof-any",
    language: "csharp",
    title: "Span.IndexOfAny and SearchValues<T> — multi-character search (.NET 8)",
    tag: "snippet",
    code: `using System.Buffers;

ReadOnlySpan<char> text = "Hello, World! How are you?";

// IndexOfAny: find first occurrence of any of several chars
int idx = text.IndexOfAny(',', '!', '?');
Console.WriteLine(idx);   // 5  (comma at index 5)

// SearchValues<T>: pre-computed set for repeated searches (.NET 8+)
SearchValues<char> punctuation = SearchValues.Create(",.!?;:");
int first = text.IndexOfAny(punctuation);
Console.WriteLine(first);  // 5`,
    explanation:
      "SearchValues<char> precomputes a lookup structure for a set of characters, making repeated IndexOfAny calls faster than passing an array each time — valuable in parsers that scan thousands of strings for the same delimiter set.",
  },
  {
    id: "cs-task-parallel-foreach",
    language: "csharp",
    title: "Parallel.ForEach — data parallelism on collections",
    tag: "snippet",
    code: `using System.Threading.Tasks;

int[] data = Enumerable.Range(1, 20).ToArray();
int sum = 0;

// Parallel iteration — use thread-safe accumulation
var localSums = new System.Collections.Concurrent.ConcurrentBag<int>();

Parallel.ForEach(data, item =>
{
    localSums.Add(item * item);
});

sum = localSums.Sum();
Console.WriteLine($"Sum of squares: {sum}");  // 2870

// With options
var options = new ParallelOptions { MaxDegreeOfParallelism = 4 };
Parallel.ForEach(data, options, item => { /* ... */ });`,
    explanation:
      "Parallel.ForEach partitions the collection across threads — never use shared mutable state without synchronisation; ConcurrentBag, Interlocked operations, or thread-local accumulators are the safe patterns.",
  },
  {
    id: "cs-async-parallel",
    language: "csharp",
    title: "Parallel.ForEachAsync — async data parallelism (.NET 6+)",
    tag: "snippet",
    code: `using System.Threading.Tasks;

string[] urls = { "https://httpbin.org/get", "https://httpbin.org/ip" };

await Parallel.ForEachAsync(
    urls,
    new ParallelOptions { MaxDegreeOfParallelism = 4 },
    async (url, ct) =>
    {
        using var client = new System.Net.Http.HttpClient();
        string content = await client.GetStringAsync(url, ct);
        Console.WriteLine($"{url}: {content.Length} bytes");
    });`,
    explanation:
      "Parallel.ForEachAsync (added in .NET 6) combines data parallelism with async/await — unlike Parallel.ForEach with async lambdas (which does not await them properly), this overload correctly awaits each async body.",
  },
  {
    id: "cs-channels-pipeline",
    language: "csharp",
    title: "System.Threading.Channels — async producer/consumer pipeline",
    tag: "structures",
    code: `using System.Threading.Channels;

var channel = Channel.CreateUnbounded<int>();

// Producer
async Task Produce()
{
    for (int i = 0; i < 5; i++)
    {
        await channel.Writer.WriteAsync(i);
        Console.WriteLine($"Produced {i}");
    }
    channel.Writer.Complete();
}

// Consumer
async Task Consume()
{
    await foreach (int item in channel.Reader.ReadAllAsync())
        Console.WriteLine($"Consumed {item}");
}

await Task.WhenAll(Produce(), Consume());`,
    explanation:
      "System.Threading.Channels provides async producer/consumer communication — ReadAllAsync() returns an IAsyncEnumerable that completes when Writer.Complete() is called, making the pipeline termination condition clean and explicit.",
  },
  {
    id: "cs-marshal-struct",
    language: "csharp",
    title: "Marshal.SizeOf and StructLayout — interop struct layout control",
    tag: "snippet",
    code: `using System.Runtime.InteropServices;

[StructLayout(LayoutKind.Sequential, Pack = 1)]  // no padding
struct PacketHeader
{
    public byte Version;
    public byte Flags;
    public ushort Length;
    public uint Checksum;
}

Console.WriteLine(Marshal.SizeOf<PacketHeader>());  // 8 (1+1+2+4, no padding)

[StructLayout(LayoutKind.Explicit)]  // manual field offsets
struct Union
{
    [FieldOffset(0)] public int IntValue;
    [FieldOffset(0)] public float FloatValue;  // overlaps with IntValue
}

var u = new Union { IntValue = 0x3F800000 };
Console.WriteLine(u.FloatValue);  // 1.0 (IEEE 754 representation of 0x3F800000)`,
    explanation:
      "StructLayout controls how the CLR lays out struct fields in memory — Sequential with Pack=1 removes alignment padding for packed protocols; Explicit allows C-style unions where fields overlap at the same memory offset.",
  },
  {
    id: "cs-native-memory",
    language: "csharp",
    title: "NativeMemory.Alloc — unmanaged heap allocation (NET 6+)",
    tag: "snippet",
    code: `using System.Runtime.InteropServices;

// Allocate unmanaged memory — not tracked by GC
void* ptr = NativeMemory.Alloc(256);
try
{
    // Zero the memory
    NativeMemory.Clear(ptr, 256);

    // Use as a Span<byte>
    Span<byte> span = new Span<byte>(ptr, 256);
    span[0] = 42;
    Console.WriteLine(span[0]);  // 42
}
finally
{
    NativeMemory.Free(ptr);  // MUST free or memory is leaked
}`,
    explanation:
      "NativeMemory.Alloc (added in .NET 6) allocates unmanaged memory outside the GC heap — use it for large, long-lived buffers that should not be seen by the garbage collector, and always Free in a finally block.",
  },
  {
    id: "cs-freeze-readonly-list",
    language: "csharp",
    title: "FrozenDictionary and FrozenSet — optimised read-only collections (.NET 8)",
    tag: "structures",
    code: `using System.Collections.Frozen;

// Build once, read many times — FrozenDictionary optimises lookup
var dict = new Dictionary<string, int>
{
    ["apple"] = 1, ["banana"] = 2, ["cherry"] = 3
}.ToFrozenDictionary();

Console.WriteLine(dict["banana"]);            // 2
Console.WriteLine(dict.ContainsKey("grape")); // False

// FrozenSet for fast membership testing
FrozenSet<string> reserved = new HashSet<string>
    { "class", "var", "int", "void" }.ToFrozenSet();

Console.WriteLine(reserved.Contains("var"));   // True
Console.WriteLine(reserved.Contains("hello")); // False`,
    explanation:
      "FrozenDictionary and FrozenSet (added in .NET 8) are created once and optimised at construction time for read-heavy workloads — they use a hash-code distribution analysis to produce faster lookups than regular Dictionary/HashSet.",
  },
  {
    id: "cs-guid-newguid",
    language: "csharp",
    title: "Guid — generate and parse globally unique identifiers",
    tag: "snippet",
    code: `Guid id = Guid.NewGuid();
Console.WriteLine(id);                        // e.g. a1b2c3d4-...
Console.WriteLine(id.ToString("N"));          // no dashes
Console.WriteLine(id.ToString("B"));          // {braces}
Console.WriteLine(id.ToByteArray().Length);   // 16

// Parse from string
Guid parsed = Guid.Parse("550e8400-e29b-41d4-a716-446655440000");
Console.WriteLine(parsed == Guid.Empty);      // False
Console.WriteLine(Guid.TryParse("not-a-guid", out _));  // False

// Empty GUID
Console.WriteLine(Guid.Empty);  // 00000000-0000-0000-0000-000000000000`,
    explanation:
      "Guid.NewGuid() generates a Version 4 (random) GUID — use the format specifier \"N\" for compact hex strings (e.g. as tokens), \"B\" for brace-wrapped forms; always use TryParse when parsing user input.",
  },
  {
    id: "cs-timer-periodic",
    language: "csharp",
    title: "PeriodicTimer — async-friendly periodic timer (.NET 6+)",
    tag: "snippet",
    code: `using var timer = new System.Threading.PeriodicTimer(TimeSpan.FromMilliseconds(100));
int ticks = 0;

// WaitForNextTickAsync awaits the next period without blocking
while (await timer.WaitForNextTickAsync() && ticks < 3)
{
    ticks++;
    Console.WriteLine($"Tick {ticks} at {DateTime.Now:HH:mm:ss.fff}");
}

// Disposing the timer cancels the awaited WaitForNextTickAsync`,
    explanation:
      "PeriodicTimer (added in .NET 6) replaces Timer callbacks with a clean async/await loop — WaitForNextTickAsync returns false when the timer is disposed, providing a natural loop-exit condition without race conditions.",
  },
  {
    id: "cs-taskcompletionsource",
    language: "csharp",
    title: "TaskCompletionSource<T> — bridge callbacks to async/await",
    tag: "snippet",
    code: `// Bridge a callback-based API into an awaitable Task
static Task<int> SimulateCallbackApi(Action<int> callback)
{
    var tcs = new TaskCompletionSource<int>();
    // Simulate an async callback arriving later
    Task.Delay(50).ContinueWith(_ => callback(42));
    return tcs.Task;
}

// Usage
var tcs = new TaskCompletionSource<int>();
Task.Delay(50).ContinueWith(_ => tcs.SetResult(42));  // complete externally

int result = await tcs.Task;
Console.WriteLine(result);  // 42

// tcs.SetException(ex);   — complete with exception
// tcs.SetCanceled();       — complete with cancellation`,
    explanation:
      "TaskCompletionSource<T> allows you to manually control when a Task completes — it is the standard pattern for wrapping callback-based or event-based APIs in an awaitable Task.",
  },
  {
    id: "cs-pattern-guard-when",
    language: "csharp",
    title: "when guard clause — add conditions to switch arms",
    tag: "snippet",
    code: `record Order(string Status, decimal Total);

static string Process(Order o) => o switch
{
    { Status: "pending" }  when o.Total > 1000 => "high-value review",
    { Status: "pending" }                      => "standard processing",
    { Status: "paid"    }  when o.Total > 5000 => "flag for audit",
    { Status: "paid"    }                      => "complete",
    _                                          => "unknown"
};

Console.WriteLine(Process(new Order("pending", 1500)));  // high-value review
Console.WriteLine(Process(new Order("pending", 50)));    // standard processing
Console.WriteLine(Process(new Order("paid", 9000)));     // flag for audit`,
    explanation:
      "The when guard adds a boolean condition to a switch arm that is only evaluated after the pattern matches — if the guard is false, the arm is skipped and matching continues to the next arm.",
  },
  {
    id: "cs-span-memmove",
    language: "csharp",
    title: "Span.CopyTo and Buffer.MemoryCopy — fast memory moves",
    tag: "snippet",
    code: `int[] src  = { 1, 2, 3, 4, 5 };
int[] dest = new int[5];

// Span.CopyTo: handles overlapping spans correctly
src.AsSpan().CopyTo(dest.AsSpan());
Console.WriteLine(string.Join(",", dest));  // 1,2,3,4,5

// Overlapping copy (shift left by 1) — safe with CopyTo
src.AsSpan(1).CopyTo(src.AsSpan(0));
Console.WriteLine(string.Join(",", src));   // 2,3,4,5,5

// Buffer.MemoryCopy for raw byte copies (unsafe but very fast):
// Buffer.MemoryCopy(pSrc, pDest, destBytes, srcBytes);`,
    explanation:
      "Span.CopyTo correctly handles overlapping source and destination regions (like memmove) — for non-overlapping copies at the byte level, Buffer.MemoryCopy is faster but requires unsafe code.",
  },
  {
    id: "cs-simd-vector",
    language: "csharp",
    title: "System.Numerics.Vector<T> — SIMD intrinsics via generic API",
    tag: "snippet",
    code: `using System.Numerics;

int[] a = { 1, 2, 3, 4, 5, 6, 7, 8 };
int[] b = { 8, 7, 6, 5, 4, 3, 2, 1 };
int[] result = new int[8];

int vectorSize = Vector<int>.Count;   // 4 or 8 depending on CPU
int i = 0;

for (; i <= a.Length - vectorSize; i += vectorSize)
{
    var va = new Vector<int>(a, i);
    var vb = new Vector<int>(b, i);
    (va + vb).CopyTo(result, i);
}
// Handle remainder...
Console.WriteLine(string.Join(",", result));  // 9,9,9,9,9,9,9,9`,
    explanation:
      "Vector<T> maps to SIMD registers and performs operations on multiple elements simultaneously — the JIT selects AVX, SSE, or scalar instructions depending on the CPU, providing auto-vectorisation for numerically intensive loops.",
  },
];
