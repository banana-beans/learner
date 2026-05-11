import type { Snippet } from "./types";

export const csharpSnippets20260511B3: Snippet[] = [
  // ── snippet ──────────────────────────────────────────────────────────────
  {
    id: "cs-linq-select-project",
    language: "csharp",
    title: "Select() — project each element to a new form",
    tag: "snippet",
    code: `var numbers = new[] { 1, 2, 3, 4, 5 };

// Project to squared values
var squares = numbers.Select(n => n * n);
Console.WriteLine(string.Join(", ", squares));  // 1, 4, 9, 16, 25

// Project to anonymous type
var people = new[] { ("Alice", 30), ("Bob", 25) };
var result = people.Select(p => new { Name = p.Item1, Age = p.Item2 });

// Project with index overload
var indexed = numbers.Select((n, i) => \`\${i}:{n}\`);
Console.WriteLine(string.Join(", ", indexed));  // 0:1, 1:2, 2:3, 3:4, 4:5`,
    explanation:
      "Select is a one-to-one transformation — every input element produces exactly one output element; use the index overload when you need the element's position in the sequence.",
  },
  {
    id: "cs-linq-where-filter",
    language: "csharp",
    title: "Where() — filter elements by predicate",
    tag: "snippet",
    code: `var numbers = Enumerable.Range(1, 10);

// Keep only even numbers
var evens = numbers.Where(n => n % 2 == 0);
Console.WriteLine(string.Join(", ", evens));  // 2, 4, 6, 8, 10

// Chain multiple filters
var result = numbers
    .Where(n => n % 2 == 0)
    .Where(n => n > 4);
Console.WriteLine(string.Join(", ", result));  // 6, 8, 10

// Where with index overload
var oddPositions = numbers.Where((n, i) => i % 2 != 0);`,
    explanation:
      "Where is lazy — nothing is evaluated until the sequence is enumerated; chaining Where calls is equivalent to combining predicates with && but can be easier to read when each condition is complex.",
  },
  {
    id: "cs-linq-orderby",
    language: "csharp",
    title: "OrderBy / OrderByDescending / ThenBy",
    tag: "snippet",
    code: `var people = new[]
{
    new { Name = "Charlie", Age = 30, City = "Boston" },
    new { Name = "Alice",   Age = 25, City = "Austin" },
    new { Name = "Bob",     Age = 30, City = "Austin" },
};

var sorted = people
    .OrderBy(p => p.Age)
    .ThenByDescending(p => p.Name);

foreach (var p in sorted)
    Console.WriteLine(\`\${p.Name} \${p.Age}\`);
// Alice 25
// Charlie 30
// Bob 30`,
    explanation:
      "OrderBy starts the sort and returns IOrderedEnumerable<T>; ThenBy adds a secondary key without re-sorting the primary key — never chain two OrderBy calls, as the second discards the first.",
  },
  {
    id: "cs-linq-groupby",
    language: "csharp",
    title: "GroupBy() — group elements; access key and elements",
    tag: "snippet",
    code: `var words = new[] { "apple", "banana", "avocado", "blueberry", "cherry" };

var groups = words.GroupBy(w => w[0]);

foreach (var g in groups)
{
    Console.WriteLine(\`\${g.Key}: \${string.Join(", ", g)}\`);
}
// a: apple, avocado
// b: banana, blueberry
// c: cherry

// Project groups to a summary
var summary = words
    .GroupBy(w => w[0])
    .Select(g => new { Letter = g.Key, Count = g.Count() });`,
    explanation:
      "GroupBy returns IEnumerable<IGrouping<K,V>>; each IGrouping has a Key and is itself an IEnumerable<V> of elements in that group — you must enumerate it before the source is exhausted.",
  },
  {
    id: "cs-linq-join",
    language: "csharp",
    title: "Join() — inner join on two sequences",
    tag: "snippet",
    code: `var orders = new[]
{
    new { OrderId = 1, CustomerId = 10, Total = 99.0 },
    new { OrderId = 2, CustomerId = 20, Total = 45.0 },
};
var customers = new[]
{
    new { Id = 10, Name = "Alice" },
    new { Id = 20, Name = "Bob"   },
};

var result = orders.Join(
    customers,
    o => o.CustomerId,   // outer key
    c => c.Id,           // inner key
    (o, c) => new { c.Name, o.Total });

foreach (var r in result)
    Console.WriteLine(\`\${r.Name}: \${r.Total}\`);
// Alice: 99  / Bob: 45`,
    explanation:
      "Join performs a hash-join internally; the result selector receives matched pairs from both sequences; elements with no match in the inner sequence are silently dropped (inner join semantics).",
  },
  {
    id: "cs-linq-selectmany",
    language: "csharp",
    title: "SelectMany() — flatten nested sequences",
    tag: "snippet",
    code: `var departments = new[]
{
    new { Name = "Eng",  Employees = new[] { "Alice", "Bob" } },
    new { Name = "Sales", Employees = new[] { "Carol", "Dave" } },
};

// Flatten all employees into a single sequence
var allEmployees = departments.SelectMany(d => d.Employees);
Console.WriteLine(string.Join(", ", allEmployees));
// Alice, Bob, Carol, Dave

// Project with parent context
var withDept = departments.SelectMany(
    d => d.Employees,
    (d, e) => new { d.Name, Employee = e });`,
    explanation:
      "SelectMany is a one-to-many projection followed by flattening — it is the LINQ equivalent of nested foreach loops; the two-argument overload gives access to the outer element alongside each inner element.",
  },
  {
    id: "cs-linq-take-skip",
    language: "csharp",
    title: "Take(n) / Skip(n) — pagination",
    tag: "snippet",
    code: `var items = Enumerable.Range(1, 100);

// Page 1: items 1-10
var page1 = items.Skip(0 * 10).Take(10);

// Page 3: items 21-30
int pageSize = 10, pageNumber = 3;
var page3 = items.Skip((pageNumber - 1) * pageSize).Take(pageSize);

Console.WriteLine(string.Join(", ", page3));  // 21, 22, ..., 30

// TakeLast / SkipLast (.NET Core 2.0+)
var lastFive = items.TakeLast(5);   // 96, 97, 98, 99, 100`,
    explanation:
      "Skip and Take compose naturally for pagination; applying Skip before Take on a database-backed IQueryable translates to OFFSET/FETCH SQL, avoiding loading the full dataset into memory.",
  },
  {
    id: "cs-linq-first-single",
    language: "csharp",
    title: "First vs FirstOrDefault vs Single vs SingleOrDefault",
    tag: "snippet",
    code: `var nums = new[] { 3, 1, 4, 1, 5 };
var empty = Array.Empty<int>();

Console.WriteLine(nums.First());               // 3
Console.WriteLine(nums.First(n => n > 3));     // 4
Console.WriteLine(empty.FirstOrDefault());     // 0  (default int)
Console.WriteLine(empty.FirstOrDefault(-1));   // -1 (custom default .NET 6)

// Single asserts exactly one match:
// nums.Single(n => n == 1);  // InvalidOperationException — two 1s
Console.WriteLine(nums.SingleOrDefault(n => n == 5));  // 5
Console.WriteLine(nums.SingleOrDefault(n => n > 99));  // 0`,
    explanation:
      "First returns the first match or throws; Single throws for both 0 and 2+ matches; the OrDefault variants return default(T) instead of throwing on empty — use Single when exactly-one is a business rule.",
  },
  {
    id: "cs-linq-any-all",
    language: "csharp",
    title: "Any() short-circuits; All() checks every element",
    tag: "snippet",
    code: `var scores = new[] { 85, 92, 78, 95, 60 };

// Any — true if at least one matches
bool hasFailing = scores.Any(s => s < 70);
Console.WriteLine(hasFailing);   // true

// Any without predicate — true if sequence is non-empty
bool hasItems = scores.Any();
Console.WriteLine(hasItems);     // true

// All — true only if every element matches
bool allPassing = scores.All(s => s >= 60);
Console.WriteLine(allPassing);   // true

bool allExcellent = scores.All(s => s >= 90);
Console.WriteLine(allExcellent); // false`,
    explanation:
      "Any stops as soon as one matching element is found; All stops as soon as one failing element is found — both short-circuit, making them efficient even on large sequences when the answer is near the start.",
  },
  {
    id: "cs-linq-count-sum",
    language: "csharp",
    title: "Count() / Sum() / Average() — aggregations",
    tag: "snippet",
    code: `var prices = new[] { 10.0, 25.5, 8.0, 42.75, 3.0 };

Console.WriteLine(prices.Count());                   // 5
Console.WriteLine(prices.Count(p => p > 10));        // 2
Console.WriteLine(prices.Sum());                     // 89.25
Console.WriteLine(prices.Sum(p => p * 1.1));         // 98.175 (with tax)
Console.WriteLine(prices.Average());                 // 17.85
Console.WriteLine(Math.Round(prices.Average(), 2));  // 17.85`,
    explanation:
      "Count, Sum, and Average are terminal (eager) operators that enumerate the sequence immediately; passing a selector to Sum/Average avoids a separate Select call and is more efficient.",
  },
  {
    id: "cs-linq-max-min",
    language: "csharp",
    title: "Max() / Min() / MaxBy() / MinBy()",
    tag: "snippet",
    code: `var people = new[]
{
    new { Name = "Alice", Age = 30 },
    new { Name = "Bob",   Age = 22 },
    new { Name = "Carol", Age = 35 },
};

Console.WriteLine(people.Max(p => p.Age));    // 35
Console.WriteLine(people.Min(p => p.Age));    // 22

// MaxBy / MinBy (.NET 6) — return the element, not the key value
var oldest  = people.MaxBy(p => p.Age);
var youngest = people.MinBy(p => p.Age);
Console.WriteLine(oldest?.Name);   // Carol
Console.WriteLine(youngest?.Name); // Bob`,
    explanation:
      "Max(selector) returns the maximum projected value (an int/double); MaxBy(keySelector) returns the original element with the maximum key — use MaxBy when you need the whole object, not just the key.",
  },
  {
    id: "cs-linq-distinct",
    language: "csharp",
    title: "Distinct() / DistinctBy() — unique elements",
    tag: "snippet",
    code: `var nums = new[] { 1, 2, 2, 3, 3, 3, 4 };

var unique = nums.Distinct();
Console.WriteLine(string.Join(", ", unique));  // 1, 2, 3, 4

// DistinctBy (.NET 6) — distinct by a key selector
var people = new[]
{
    new { Name = "Alice", Dept = "Eng"  },
    new { Name = "Bob",   Dept = "Eng"  },
    new { Name = "Carol", Dept = "Sales"},
};

var oncePerDept = people.DistinctBy(p => p.Dept);
// { Alice, Eng }, { Carol, Sales }`,
    explanation:
      "Distinct uses default equality; DistinctBy (NET 6) keeps the first element per distinct key value, which is far cleaner than the GroupBy().Select(g => g.First()) workaround used in older code.",
  },
  {
    id: "cs-linq-union-intersect",
    language: "csharp",
    title: "Union() / Intersect() / Except() — set operations",
    tag: "snippet",
    code: `var a = new[] { 1, 2, 3, 4, 5 };
var b = new[] { 3, 4, 5, 6, 7 };

var union     = a.Union(b);
var intersect = a.Intersect(b);
var diff      = a.Except(b);

Console.WriteLine(string.Join(",", union));     // 1,2,3,4,5,6,7
Console.WriteLine(string.Join(",", intersect)); // 3,4,5
Console.WriteLine(string.Join(",", diff));      // 1,2`,
    explanation:
      "Union, Intersect, and Except perform set operations with deduplication using default equality; all three are lazy and return sequences in the order elements are first encountered.",
  },
  {
    id: "cs-linq-except",
    language: "csharp",
    title: "Except() — remove elements present in second sequence",
    tag: "snippet",
    code: `var allUsers = new[] { "alice", "bob", "carol", "dave" };
var bannedUsers = new[] { "bob", "dave" };

// Remove banned users from the active list
var activeUsers = allUsers.Except(bannedUsers);
Console.WriteLine(string.Join(", ", activeUsers));  // alice, carol

// ExceptBy (.NET 6) — exclude by key
var products = new[] { new { Id = 1, Name = "A" }, new { Id = 2, Name = "B" } };
var deletedIds = new[] { 1 };
var remaining = products.ExceptBy(deletedIds, p => p.Id);`,
    explanation:
      "Except builds a HashSet of the second sequence, then streams the first sequence emitting only elements not in that set — it is O(n+m) and lazy; ExceptBy (NET 6) applies the same logic with a key projection.",
  },

  // ── understanding ─────────────────────────────────────────────────────────
  {
    id: "cs-deferred-exec",
    language: "csharp",
    title: "LINQ query builds expression; execution on enumeration",
    tag: "understanding",
    code: `var source = new[] { 1, 2, 3, 4, 5 };

// This line does NOT iterate — just defines the query
var query = source.Where(n =>
{
    Console.Write("?");   // nothing printed yet
    return n % 2 == 0;
});

Console.WriteLine("Query defined");  // printed first

// Iteration happens here:
foreach (var n in query)
    Console.Write(n + " ");
// Output: Query defined ?2 ?4 ?`,
    explanation:
      "LINQ methods return IEnumerable<T> objects that represent a pending computation; the work runs only when the sequence is iterated (foreach, ToList, Count, etc.) — this is deferred (lazy) execution.",
  },
  {
    id: "cs-immediate-exec",
    language: "csharp",
    title: "ToList() / ToArray() force immediate execution",
    tag: "understanding",
    code: `var source = new[] { 1, 2, 3, 4, 5 };

// Force execution and materialise to a List:
List<int> evens = source.Where(n => n % 2 == 0).ToList();
// Source is fully iterated here ↑

// ToArray() — slightly less memory overhead than ToList
int[] squares = source.Select(n => n * n).ToArray();

// ToDictionary — useful for O(1) lookup after materialisation
var lookup = source.ToDictionary(n => n, n => n * n);
Console.WriteLine(lookup[3]);  // 9`,
    explanation:
      "ToList and ToArray materialise the query immediately and store results in memory; use them when you need to iterate more than once, share results, or break dependency on the source changing.",
  },
  {
    id: "cs-query-vs-method",
    language: "csharp",
    title: "Query syntax vs method syntax — same compiled IL",
    tag: "understanding",
    code: `var numbers = new[] { 1, 2, 3, 4, 5, 6 };

// Query syntax (SQL-like):
var querySyntax =
    from n in numbers
    where n % 2 == 0
    select n * n;

// Method syntax (lambda-based):
var methodSyntax = numbers
    .Where(n => n % 2 == 0)
    .Select(n => n * n);

// Both compile to identical IL — same performance
Console.WriteLine(string.Join(",", querySyntax));   // 4,16,36
Console.WriteLine(string.Join(",", methodSyntax));  // 4,16,36`,
    explanation:
      "The C# compiler translates query syntax to method call chains; they produce identical IL — prefer method syntax for simple one-liners and query syntax for complex joins and groupings where the SQL-like form is clearer.",
  },
  {
    id: "cs-linq-multiple-enum",
    language: "csharp",
    title: "Enumerating a LINQ query twice hits the source twice",
    tag: "understanding",
    code: `int callCount = 0;

IEnumerable<int> query = Enumerable.Range(1, 5)
    .Select(n => { callCount++; return n * 2; });

// First enumeration:
int sum1 = query.Sum();   // callCount = 5

// Second enumeration — re-runs the whole pipeline:
int sum2 = query.Sum();   // callCount = 10

Console.WriteLine(callCount);  // 10

// Fix — materialise once:
var cached = query.ToList();   // callCount = 15 (one more pass)
int s1 = cached.Sum();         // no additional calls`,
    explanation:
      "Every IEnumerable<T> enumeration replays the entire pipeline from the source; if the source is a file, database query, or has side effects, double enumeration causes double I/O or double writes.",
  },
  {
    id: "cs-linq-side-effects",
    language: "csharp",
    title: "LINQ lambdas should be pure — side effects in Select can surprise",
    tag: "understanding",
    code: `var log = new List<string>();

var items = new[] { "a", "b", "c" };

// Side effect inside Select — runs once per enumeration
var query = items.Select(x => { log.Add(x); return x.ToUpper(); });

_ = query.ToList();           // log: ["a","b","c"]
_ = query.ToList();           // log: ["a","b","c","a","b","c"]

// Correct: move the side effect outside the query
var results = items.Select(x => x.ToUpper()).ToList();
foreach (var r in results)
    log.Add(r);  // side effect runs once, separated from transform`,
    explanation:
      "LINQ queries are designed to be pure transformations; placing side effects inside Select (logging, counting, mutating external state) produces surprising results when the query is enumerated more than once.",
  },
  {
    id: "cs-group-key-type",
    language: "csharp",
    title: "GroupBy key type must implement Equals/GetHashCode",
    tag: "understanding",
    code: `// Value types (int, string, record) work correctly out of the box
var grouped = new[] { 1, 1, 2, 3 }.GroupBy(n => n);
foreach (var g in grouped) Console.WriteLine(\`\${g.Key}: \${g.Count()}\`);

// Custom class as key — must override Equals + GetHashCode:
class Point
{
    public int X, Y;
    public override bool Equals(object? obj) =>
        obj is Point p && p.X == X && p.Y == Y;
    public override int GetHashCode() => HashCode.Combine(X, Y);
}

// Without overrides, GroupBy uses reference equality (wrong for classes)`,
    explanation:
      "GroupBy uses a dictionary internally; dictionary keys require correct Equals and GetHashCode — for custom classes the defaults use reference identity, causing every instance to become its own group.",
  },
  {
    id: "cs-join-equality",
    language: "csharp",
    title: "Join uses equality by default; IEqualityComparer<T> for custom",
    tag: "understanding",
    code: `// Case-insensitive join on string keys:
var orders  = new[] { new { Id = "A001", Amt = 100 } };
var invoices = new[] { new { Ref = "a001", Due = 30 } };

var result = orders.Join(
    invoices,
    o => o.Id,
    i => i.Ref,
    (o, i) => new { o.Id, o.Amt, i.Due },
    StringComparer.OrdinalIgnoreCase);   // custom comparer

foreach (var r in result)
    Console.WriteLine(\`\${r.Id} \${r.Amt} \${r.Due}\`);
// A001 100 30`,
    explanation:
      "Join's fifth overload accepts an IEqualityComparer<T> for the key type; this is essential for case-insensitive string joins or custom value-type equality — without it, 'A001' and 'a001' would not match.",
  },
  {
    id: "cs-let-clause",
    language: "csharp",
    title: "let — intermediate range variable in query syntax",
    tag: "understanding",
    code: `var words = new[] { "hello", "world", "linq", "is", "powerful" };

// 'let' introduces a new named value in the query
var result =
    from w in words
    let upper = w.ToUpper()
    let length = w.Length
    where length > 3
    orderby length descending
    select \`\${upper} (\${length})\`;

foreach (var r in result)
    Console.WriteLine(r);
// POWERFUL (8) / HELLO (5) / WORLD (5) / LINQ (4)`,
    explanation:
      "let saves the result of an expression so it can be used in multiple places in the query without recomputing; in method syntax the equivalent is chaining Select to project to a tuple containing both values.",
  },
  {
    id: "cs-into-continuation",
    language: "csharp",
    title: "into — continue a query after group or select",
    tag: "understanding",
    code: `var words = new[] { "apple", "banana", "avocado", "blueberry", "cherry" };

// 'into' continues the query with the group results
var result =
    from w in words
    group w by w[0] into g
    where g.Count() > 1          // filter groups with 2+ words
    select new { Letter = g.Key, Words = g.ToList() };

foreach (var r in result)
    Console.WriteLine(\`\${r.Letter}: \${string.Join(", ", r.Words)}\`);
// a: apple, avocado
// b: banana, blueberry`,
    explanation:
      "into re-scopes the query so that group or select results become the new range variable; without it, you cannot filter on grouped results within the same query expression.",
  },
  {
    id: "cs-orderby-stability",
    language: "csharp",
    title: "LINQ OrderBy is a stable sort",
    tag: "understanding",
    code: `var items = new[]
{
    new { Name = "Banana", Order = 2 },
    new { Name = "Apple",  Order = 1 },
    new { Name = "Cherry", Order = 2 },
};

// OrderBy is stable — equal-key elements keep their original relative order
var sorted = items.OrderBy(i => i.Order);

foreach (var i in sorted)
    Console.WriteLine(\`\${i.Name} \${i.Order}\`);
// Apple 1
// Banana 2  ← Banana before Cherry (original order preserved)
// Cherry 2`,
    explanation:
      "Stable sort guarantees that elements with equal keys appear in the same relative order as in the input; this matters when secondary ordering has semantic meaning and you cannot use ThenBy.",
  },
  {
    id: "cs-cast-oftype",
    language: "csharp",
    title: "Cast<T> throws on wrong type; OfType<T> filters silently",
    tag: "understanding",
    code: `object[] mixed = { 1, "hello", 3, "world", 5 };

// OfType<T> — silently skips elements that are not T
var strings = mixed.OfType<string>();
Console.WriteLine(string.Join(", ", strings));  // hello, world

var ints = mixed.OfType<int>();
Console.WriteLine(string.Join(", ", ints));  // 1, 3, 5

// Cast<T> — throws InvalidCastException on first wrong element
try { mixed.Cast<int>().ToList(); }
catch (InvalidCastException e) { Console.WriteLine(e.Message); }`,
    explanation:
      "Use Cast<T> when you are certain all elements are of type T (e.g., upgrading from non-generic collections); use OfType<T> when the sequence is heterogeneous and you want only matching elements.",
  },
  {
    id: "cs-tolist-toarray",
    language: "csharp",
    title: "ToList() allows mutation; ToArray() is slightly more compact",
    tag: "understanding",
    code: `var query = Enumerable.Range(1, 5).Select(n => n * 2);

// ToList — mutable, O(1) Add, Count is free
List<int> list = query.ToList();
list.Add(12);              // OK — mutable
Console.WriteLine(list.Count);  // 6

// ToArray — fixed size, slightly less overhead
int[] arr = query.ToArray();
// arr.Add(12);            // compile error — no Add on array
Console.WriteLine(arr.Length);  // 5

// Use ToArray when size is known and no mutation needed`,
    explanation:
      "Both materialise the query; ToList uses a resizable backing array and supports Add/Remove; ToArray allocates exactly the right size — prefer ToArray for read-only results, ToList when you may need to modify later.",
  },
  {
    id: "cs-elementat-bounds",
    language: "csharp",
    title: "ElementAt throws out of range; ElementAtOrDefault returns default",
    tag: "understanding",
    code: `var items = new[] { "alpha", "beta", "gamma" };

Console.WriteLine(items.ElementAt(1));            // beta
Console.WriteLine(items.ElementAtOrDefault(5));   // null (default string)
Console.WriteLine(items.ElementAtOrDefault(5) ?? "not found");  // not found

try
{
    items.ElementAt(99);
}
catch (ArgumentOutOfRangeException)
{
    Console.WriteLine("Index out of range");
}

// ElementAt on IEnumerable<T>: O(n) scan unless IList<T>`,
    explanation:
      "ElementAt and ElementAtOrDefault handle arbitrary IEnumerable<T>; they skip n elements to reach the index — they are O(n) unless the underlying type is IList<T>, which they check for at runtime.",
  },
  {
    id: "cs-first-default",
    language: "csharp",
    title: "FirstOrDefault returns default(T) (null/0) when empty",
    tag: "understanding",
    code: `var names = new[] { "Alice", "Bob" };
var empty  = Array.Empty<string>();

Console.WriteLine(names.FirstOrDefault());              // Alice
Console.WriteLine(empty.FirstOrDefault());              // null
Console.WriteLine(empty.FirstOrDefault("unknown"));     // unknown (.NET 6)

// For value types, default is 0/false:
var nums = Array.Empty<int>();
Console.WriteLine(nums.FirstOrDefault());    // 0
Console.WriteLine(nums.FirstOrDefault(-1));  // -1 (.NET 6)`,
    explanation:
      "FirstOrDefault returning null for an empty sequence is a common source of NullReferenceException; the .NET 6 overload accepting a default value lets you specify a sentinel instead of null.",
  },

  // ── structures ────────────────────────────────────────────────────────────
  {
    id: "cs-lookup-type",
    language: "csharp",
    title: "ILookup<K,V> from ToLookup() — immutable multi-value dict",
    tag: "structures",
    code: `var orders = new[]
{
    new { Customer = "Alice", Amount = 100 },
    new { Customer = "Bob",   Amount =  50 },
    new { Customer = "Alice", Amount = 200 },
};

ILookup<string, int> lookup = orders.ToLookup(o => o.Customer, o => o.Amount);

foreach (int amt in lookup["Alice"])
    Console.WriteLine(amt);   // 100 / 200

// Missing key returns empty (no KeyNotFoundException):
int count = lookup["Unknown"].Count();   // 0`,
    explanation:
      "ILookup is an immutable multi-value dictionary built in one pass; accessing a missing key returns an empty sequence rather than throwing, making it safe for aggregation by category without prior existence checks.",
  },
  {
    id: "cs-grouping-type",
    language: "csharp",
    title: "IGrouping<K,V> is an IEnumerable<V> with a Key",
    tag: "structures",
    code: `var words = new[] { "ant", "bee", "arc", "bat" };

IEnumerable<IGrouping<char, string>> groups = words.GroupBy(w => w[0]);

foreach (IGrouping<char, string> g in groups)
{
    char key     = g.Key;            // 'a', 'b'
    List<string> items = g.ToList(); // ['ant', 'arc'], ['bee', 'bat']
    Console.WriteLine(\`\${key}: \${string.Join(",", items)}\`);
}`,
    explanation:
      "IGrouping<K,V> is simply an IEnumerable<V> with an extra Key property; you can pass a grouping directly to any method that accepts IEnumerable<V> — the Key is just metadata attached to the sequence.",
  },
  {
    id: "cs-ordered-enumerable",
    language: "csharp",
    title: "IOrderedEnumerable<T> supports ThenBy() chaining",
    tag: "structures",
    code: `var items = new[]
{
    new { Name = "Banana", Weight = 2, Color = "Yellow" },
    new { Name = "Apple",  Weight = 2, Color = "Red"    },
    new { Name = "Cherry", Weight = 1, Color = "Red"    },
};

// OrderBy returns IOrderedEnumerable<T>, enabling ThenBy:
IOrderedEnumerable<dynamic> sorted = items
    .OrderBy(i => i.Weight)
    .ThenBy(i => i.Color)
    .ThenByDescending(i => i.Name);

foreach (var i in sorted)
    Console.WriteLine(\`\${i.Name} \${i.Weight} \${i.Color}\`);`,
    explanation:
      "IOrderedEnumerable<T> is a specialised interface returned only by OrderBy/OrderByDescending; ThenBy is defined on this interface, preventing accidental use on non-ordered sequences.",
  },
  {
    id: "cs-expr-tree-linq",
    language: "csharp",
    title: "IQueryable<T> passes expression trees to the provider",
    tag: "structures",
    code: `// IQueryable<T> stores the query as an expression tree, not a delegate
using System.Linq.Expressions;

IQueryable<int> queryable = new[] { 1, 2, 3, 4, 5 }.AsQueryable();

// The Where lambda is stored as an Expression, not a Func:
IQueryable<int> filtered = queryable.Where(n => n > 2);

Expression tree = filtered.Expression;
Console.WriteLine(tree);
// {value(int[]).Where(n => (n > 2))}

// Providers (EF Core) inspect this tree and translate to SQL`,
    explanation:
      "IQueryable captures the query as an expression tree; database providers walk the tree at execution time and generate SQL, enabling true server-side filtering instead of loading all rows into memory.",
  },
  {
    id: "cs-iqueryable-vs-ienumerable",
    language: "csharp",
    title: "IQueryable (translated to SQL) vs IEnumerable (in-memory)",
    tag: "structures",
    code: `// Assuming an EF Core DbContext:
// IQueryable — filtering happens in the database (SQL WHERE)
IQueryable<User> dbQuery = context.Users.Where(u => u.Age > 18);

// IEnumerable — ALL rows loaded, then filtered in C#
IEnumerable<User> inMemory = context.Users.AsEnumerable()
                                          .Where(u => u.Age > 18);

// Common bug: calling AsEnumerable() too early:
var wrong = context.Users
    .AsEnumerable()          // loads all users first!
    .Where(u => u.Age > 18);`,
    explanation:
      "Calling AsEnumerable() switches from IQueryable to IEnumerable, pulling all rows into memory before the predicate runs; always keep filters on IQueryable until you need in-memory operations unavailable in SQL.",
  },
  {
    id: "cs-ef-vs-linq-to-objects",
    language: "csharp",
    title: "EF translates LINQ to SQL; objects version runs in CLR",
    tag: "structures",
    code: `// EF Core (IQueryable) — translated to SQL:
var users = await context.Users
    .Where(u => u.Name.StartsWith("A"))   // SQL: WHERE Name LIKE 'A%'
    .OrderBy(u => u.Name)
    .Take(10)
    .ToListAsync();

// LINQ to Objects (IEnumerable) — runs in CLR:
var local = users.Where(u => u.Name.Contains("li"));  // in-memory

// Not all C# expressions translate to SQL:
// context.Users.Where(u => MyCustomMethod(u.Name))  // may throw`,
    explanation:
      "EF Core's expression tree translator only knows a subset of .NET methods; calling unsupported methods on IQueryable throws a NotSupportedException at runtime — materialise first with ToList, then apply unsupported predicates.",
  },
  {
    id: "cs-parallel-linq",
    language: "csharp",
    title: "PLINQ — AsParallel() for data-parallel LINQ queries",
    tag: "structures",
    code: `int[] numbers = Enumerable.Range(1, 1_000_000).ToArray();

// Sequential LINQ:
long sumSeq = numbers.Where(n => n % 2 == 0).Sum(n => (long)n);

// Parallel LINQ — same syntax, uses thread pool:
long sumPar = numbers
    .AsParallel()
    .Where(n => n % 2 == 0)
    .Sum(n => (long)n);

Console.WriteLine(sumSeq == sumPar);  // true`,
    explanation:
      "AsParallel partitions the source across thread-pool threads; it is most beneficial for CPU-bound work on large data sets; I/O-bound work and small sequences may actually be slower due to overhead.",
  },
  {
    id: "cs-plinq-degree",
    language: "csharp",
    title: ".WithDegreeOfParallelism(n) limits PLINQ threads",
    tag: "structures",
    code: `var result = Enumerable.Range(1, 100)
    .AsParallel()
    .WithDegreeOfParallelism(4)   // cap at 4 threads
    .WithExecutionMode(ParallelExecutionMode.ForceParallelism)
    .Select(n =>
    {
        // Simulate CPU work
        return n * n;
    })
    .ToList();

Console.WriteLine(result.Count);  // 100`,
    explanation:
      "WithDegreeOfParallelism caps the number of threads used; without it PLINQ uses all cores — limiting threads is useful when the work involves shared resources like network connections or database connections.",
  },
  {
    id: "cs-aggregate-seed",
    language: "csharp",
    title: "Aggregate(seed, (acc, x) => ...) — custom fold",
    tag: "structures",
    code: `var words = new[] { "hello", "world", "linq" };

// Concatenate with separator using Aggregate:
string sentence = words.Aggregate((acc, w) => acc + " " + w);
Console.WriteLine(sentence);  // hello world linq

// With seed — build a running product:
double product = new[] { 1.0, 2.0, 3.0, 4.0 }
    .Aggregate(1.0, (acc, n) => acc * n);
Console.WriteLine(product);   // 24

// Three-argument form with result selector:
string csv = new[] { 1, 2, 3 }
    .Aggregate("Values:", (acc, n) => acc + n, acc => acc + "!");
Console.WriteLine(csv);  // Values:123!`,
    explanation:
      "Aggregate is the general fold operator; the seed form is safer than the seedless form because it handles empty sequences by returning the seed rather than throwing InvalidOperationException.",
  },
  {
    id: "cs-scan-operator",
    language: "csharp",
    title: "Scan (prefix scan) with Aggregate + yielding intermediates",
    tag: "structures",
    code: `// LINQ has no built-in Scan, but it's easy to implement:
static IEnumerable<TAccumulate> Scan<T, TAccumulate>(
    IEnumerable<T> source,
    TAccumulate seed,
    Func<TAccumulate, T, TAccumulate> func)
{
    var acc = seed;
    foreach (var item in source)
    {
        acc = func(acc, item);
        yield return acc;
    }
}

var runningSum = Scan(new[] { 1, 2, 3, 4, 5 }, 0, (a, n) => a + n);
Console.WriteLine(string.Join(",", runningSum));  // 1,3,6,10,15`,
    explanation:
      "Scan produces a running aggregate (prefix sum, prefix product) — it is like Aggregate but emits each intermediate accumulator value rather than just the final result.",
  },
  {
    id: "cs-window-aggregate",
    language: "csharp",
    title: "Sliding window sum with Zip / Skip",
    tag: "structures",
    code: `static IEnumerable<double> SlidingAverage(IEnumerable<int> source, int window)
{
    // Requires materialised list for random access
    var list = source.ToList();
    for (int i = 0; i <= list.Count - window; i++)
        yield return list.Skip(i).Take(window).Average();
}

var data = new[] { 1, 3, 5, 7, 9, 2, 4 };
var ma3  = SlidingAverage(data, 3).ToList();
Console.WriteLine(string.Join(", ", ma3.Select(x => \`\${x:F1}\`)));
// 3.0, 5.0, 7.0, 6.0, 5.0`,
    explanation:
      "Sliding window aggregates in LINQ require either materialisation (for random access) or an O(n*w) approach; for performance-critical code prefer a circular buffer approach with Span<T> instead.",
  },
  {
    id: "cs-batch-chunk-linq",
    language: "csharp",
    title: "Chunk(n) (.NET 6) splits sequence into batches",
    tag: "structures",
    code: `var items = Enumerable.Range(1, 10);

// Chunk splits into arrays of at most n elements:
foreach (int[] batch in items.Chunk(3))
    Console.WriteLine(\`[\${string.Join(",", batch)}]\`);
// [1,2,3]
// [4,5,6]
// [7,8,9]
// [10]

// Useful for bulk database inserts, rate-limited API calls:
var records = Enumerable.Range(1, 1000);
foreach (var batch in records.Chunk(100))
    await InsertBatchAsync(batch);`,
    explanation:
      "Chunk (NET 6) produces arrays rather than IEnumerable<T> for each batch, so the batch can be passed to APIs expecting arrays or spans; the last chunk may be smaller than n.",
  },
  {
    id: "cs-partition-linq",
    language: "csharp",
    title: "Partition pattern — split into two lists by predicate",
    tag: "structures",
    code: `// LINQ has no built-in Partition, but it's easy to write:
static (List<T> Matching, List<T> NonMatching) Partition<T>(
    IEnumerable<T> source, Func<T, bool> predicate)
{
    var matching    = new List<T>();
    var nonMatching = new List<T>();
    foreach (var item in source)
        (predicate(item) ? matching : nonMatching).Add(item);
    return (matching, nonMatching);
}

var nums = Enumerable.Range(1, 10);
var (evens, odds) = Partition(nums, n => n % 2 == 0);
Console.WriteLine(\`Evens: \${string.Join(",", evens)}\`);
Console.WriteLine(\`Odds:  \${string.Join(",", odds)}\`);`,
    explanation:
      "Partition iterates the source exactly once and places elements into two lists — more efficient than two separate Where calls, which each traverse the source independently.",
  },
  {
    id: "cs-paginate-linq",
    language: "csharp",
    title: "Pagination helper — Skip((page-1)*size).Take(size)",
    tag: "structures",
    code: `record Page<T>(IReadOnlyList<T> Items, int TotalCount, int PageNumber, int PageSize)
{
    public int TotalPages => (TotalCount + PageSize - 1) / PageSize;
    public bool HasNext => PageNumber < TotalPages;
}

static async Task<Page<T>> PaginateAsync<T>(
    IQueryable<T> query, int page, int size)
{
    int total = await query.CountAsync();
    var items = await query.Skip((page - 1) * size).Take(size).ToListAsync();
    return new Page<T>(items, total, page, size);
}`,
    explanation:
      "On IQueryable, Count generates a COUNT SQL query and Skip/Take generate OFFSET/FETCH, so both round-trips are efficient; the total count enables the caller to render page-number navigation.",
  },

  // ── caveats ───────────────────────────────────────────────────────────────
  {
    id: "cs-linq-null-ref",
    language: "csharp",
    title: "null input to LINQ throws ArgumentNullException immediately",
    tag: "caveats",
    code: `List<int>? items = null;

// ArgumentNullException thrown when the LINQ method is called,
// NOT when the result is enumerated:
try
{
    // This line throws immediately:
    IEnumerable<int> query = items!.Where(n => n > 0);
}
catch (ArgumentNullException e)
{
    Console.WriteLine(e.Message);
}

// Safe guard:
IEnumerable<int> safe = (items ?? Enumerable.Empty<int>()).Where(n => n > 0);`,
    explanation:
      "LINQ extension methods validate the source argument eagerly and throw ArgumentNullException immediately rather than on first enumeration; use the null-coalescing operator to provide an empty fallback.",
  },
  {
    id: "cs-empty-sequence-first",
    language: "csharp",
    title: "First() on empty sequence throws — use FirstOrDefault",
    tag: "caveats",
    code: `var empty = Array.Empty<string>();

try
{
    string first = empty.First();  // InvalidOperationException!
}
catch (InvalidOperationException e)
{
    Console.WriteLine(e.Message);  // Sequence contains no elements
}

// Always use FirstOrDefault when empty is possible:
string? safe = empty.FirstOrDefault();
Console.WriteLine(safe ?? "none");  // none

// Or check Any() first (two enumerations — prefer FirstOrDefault):
if (empty.Any()) Console.WriteLine(empty.First());`,
    explanation:
      "First throws when the sequence is empty — this is intentional when emptiness is a bug, but you should use FirstOrDefault when an empty result is a valid outcome to avoid exception handling.",
  },
  {
    id: "cs-multiple-enumeration",
    language: "csharp",
    title: "Enumerated IEnumerable that hits I/O twice causes double reads",
    tag: "caveats",
    code: `// Imagine this reads from a file or database:
IEnumerable<string> lines = File.ReadLines("data.txt");

int count = lines.Count();         // reads file once
string first = lines.First();      // reads file again!

// Materialise once:
List<string> cached = lines.ToList();   // one read
int c2 = cached.Count;
string f2 = cached[0];

// Resharper/Rider warns about "Possible multiple enumeration of IEnumerable"`,
    explanation:
      "IEnumerable<T> promises only forward iteration — calling Count then First may read the source twice; if the source is a file, stream, or database cursor, this causes double I/O or fails on the second pass.",
  },
  {
    id: "cs-select-vs-foreach",
    language: "csharp",
    title: "Select transforms; never use it for side effects",
    tag: "caveats",
    code: `var names = new[] { "Alice", "Bob", "Carol" };

// WRONG — Select for side effects is only executed when enumerated:
var ignored = names.Select(n => { Console.WriteLine(n); return n; });
// Nothing printed yet — deferred! Dangerous if side effects must happen.

// CORRECT — foreach for side effects:
foreach (var name in names)
    Console.WriteLine(name);

// CORRECT — if you need a transformed result AND a side effect, separate them:
var upper = names.Select(n => n.ToUpper()).ToList();  // transform
foreach (var u in upper) Console.WriteLine(u);        // side effect`,
    explanation:
      "Using Select purely for its side effects (logging, mutation) creates a latent bug: if the result is never enumerated, the side effects never run; always use foreach for intentional side effects.",
  },
  {
    id: "cs-where-index-caveat",
    language: "csharp",
    title: "Where resets element index — use Select((x,i)=>...) for index",
    tag: "caveats",
    code: `var items = new[] { "a", "b", "c", "d", "e" };

// Where does not have an index overload that reflects original positions:
// The index in Where's overload is the position in the incoming sequence,
// NOT the original sequence after filtering.

// To preserve original indices, project first:
var withIndex = items
    .Select((item, i) => (item, i))
    .Where(t => t.item != "b" && t.item != "d");

foreach (var (item, idx) in withIndex)
    Console.WriteLine(\`\${idx}: {item}\`);
// 0: a / 2: c / 4: e`,
    explanation:
      "The index in Where(predicate, index) counts the position in the source before filtering; to get the original position alongside filtered results, project with Select first to pair each element with its index.",
  },
  {
    id: "cs-orderby-then",
    language: "csharp",
    title: "Chaining OrderBy().OrderBy() gives wrong results — use ThenBy()",
    tag: "caveats",
    code: `var items = new[]
{
    new { Name = "Charlie", Age = 30 },
    new { Name = "Alice",   Age = 25 },
    new { Name = "Bob",     Age = 30 },
};

// WRONG — second OrderBy replaces first:
var wrong = items.OrderBy(p => p.Age).OrderBy(p => p.Name);
// Result: sorted only by Name, Age sort is lost!

// CORRECT — use ThenBy for secondary key:
var correct = items.OrderBy(p => p.Age).ThenBy(p => p.Name);
foreach (var p in correct)
    Console.WriteLine(\`\${p.Name} \${p.Age}\`);
// Alice 25 / Bob 30 / Charlie 30`,
    explanation:
      "Each OrderBy starts a completely new sort, discarding previous ordering; ThenBy is only available on IOrderedEnumerable and applies the secondary sort within equal-key groups from the primary sort.",
  },
  {
    id: "cs-group-key-null",
    language: "csharp",
    title: "GroupBy with null key creates a group with key null",
    tag: "caveats",
    code: `var items = new[]
{
    new { Name = "Alice", Dept = "Eng"   },
    new { Name = "Bob",   Dept = (string?)null },
    new { Name = "Carol", Dept = "Sales" },
    new { Name = "Dave",  Dept = (string?)null },
};

var groups = items.GroupBy(i => i.Dept);
foreach (var g in groups)
{
    string key = g.Key ?? "<null>";
    Console.WriteLine(\`\${key}: \${g.Count()} member(s)\`);
}
// Eng: 1 / <null>: 2 / Sales: 1`,
    explanation:
      "GroupBy accepts null as a valid group key; you will get a group where Key == null — always handle this case when displaying results or the null key may cause NullReferenceException.",
  },
  {
    id: "cs-join-null-keys",
    language: "csharp",
    title: "Join silently drops elements with null keys",
    tag: "caveats",
    code: `var orders = new[]
{
    new { Id = 1, CustId = (int?)10   },
    new { Id = 2, CustId = (int?)null },  // will be dropped!
    new { Id = 3, CustId = (int?)20   },
};
var customers = new[]
{
    new { Id = 10, Name = "Alice" },
    new { Id = 20, Name = "Bob"   },
};

var result = orders.Join(customers, o => o.CustId, c => (int?)c.Id,
    (o, c) => new { o.Id, c.Name });

foreach (var r in result)
    Console.WriteLine(r);
// { Id = 1, Name = Alice } / { Id = 3, Name = Bob }  — Id=2 silently dropped`,
    explanation:
      "Join drops elements from the outer sequence when the key is null (like a SQL inner join with NULL = NULL being false); audit for null keys or use a left-join pattern with GroupJoin to retain null-keyed elements.",
  },
  {
    id: "cs-union-equality",
    language: "csharp",
    title: "Union() uses default equality — struct fields must implement Equals",
    tag: "caveats",
    code: `// For record types, equality is structural (value-based):
record Point(int X, int Y);

var a = new[] { new Point(1, 2), new Point(3, 4) };
var b = new[] { new Point(1, 2), new Point(5, 6) };

var union = a.Union(b);
foreach (var p in union) Console.WriteLine(p);
// Point { X = 1, Y = 2 }, Point { X = 3, Y = 4 }, Point { X = 5, Y = 6 }

// Plain class without Equals — uses reference equality (all are unique!):
// class PointBad { public int X, Y; }  // would give 4 results`,
    explanation:
      "Union deduplicates using GetHashCode + Equals; records and value types provide structural equality automatically; plain classes use reference identity, making every instance unique unless you override Equals and GetHashCode.",
  },
  {
    id: "cs-distinct-override",
    language: "csharp",
    title: "Distinct() on custom types needs Equals + GetHashCode",
    tag: "caveats",
    code: `// Bad — class without Equals/GetHashCode uses reference equality:
class Tag { public string Name { get; init; } = ""; }

var tags = new[]
{
    new Tag { Name = "csharp" },
    new Tag { Name = "linq"   },
    new Tag { Name = "csharp" },  // won't be de-duped — different reference
};

Console.WriteLine(tags.Distinct().Count());  // 3 (wrong!)

// Fix — use record (value equality built-in):
record TagRecord(string Name);
var tagRecords = new[] { new TagRecord("csharp"), new TagRecord("linq"), new TagRecord("csharp") };
Console.WriteLine(tagRecords.Distinct().Count());  // 2`,
    explanation:
      "Distinct() works correctly only when the type provides value equality; the easiest fix is to use record instead of class, which auto-generates Equals and GetHashCode based on all properties.",
  },
  {
    id: "cs-take-while-order",
    language: "csharp",
    title: "TakeWhile is order-dependent",
    tag: "caveats",
    code: `var nums = new[] { 2, 4, 6, 1, 8, 10 };

// TakeWhile stops at the first element that fails the predicate:
var result = nums.TakeWhile(n => n % 2 == 0);
Console.WriteLine(string.Join(",", result));  // 2,4,6  (stops at 1)

// Even though 8 and 10 are even, they come after the odd 1 — not taken
// This is intentional: TakeWhile is about a prefix, not a filter

// If order is not guaranteed, use Where instead:
var allEvens = nums.Where(n => n % 2 == 0);
Console.WriteLine(string.Join(",", allEvens));  // 2,4,6,8,10`,
    explanation:
      "TakeWhile takes a prefix of elements up to (but not including) the first one that fails the predicate; it is not the same as Where — elements after the first failure are discarded even if they would pass.",
  },
  {
    id: "cs-skip-while-order",
    language: "csharp",
    title: "SkipWhile stops skipping on first false; remaining are taken",
    tag: "caveats",
    code: `var nums = new[] { 1, 3, 5, 2, 7, 9 };

// SkipWhile skips the initial odd numbers, then takes everything after:
var result = nums.SkipWhile(n => n % 2 != 0);
Console.WriteLine(string.Join(",", result));  // 2,7,9

// 7 and 9 are odd but still included because SkipWhile already stopped skipping
// after it saw 2 (first even number)`,
    explanation:
      "SkipWhile discards a leading run of matching elements and then returns all subsequent elements unconditionally — once the predicate fails once, it never evaluates again for the rest of the sequence.",
  },
  {
    id: "cs-aggregate-overflow",
    language: "csharp",
    title: "Sum() on large int sequence can overflow — use long or check",
    tag: "caveats",
    code: `int[] largePrices = Enumerable.Repeat(int.MaxValue / 2, 10).ToArray();

// int Sum can silently overflow (no exception in unchecked context):
int overflow = largePrices.Sum();   // wrong — overflowed value
Console.WriteLine(overflow);        // unpredictable negative number

// Safe: project to long before summing
long safe = largePrices.Sum(p => (long)p);
Console.WriteLine(safe);  // 10737418230 (correct)

// Or use decimal for financial values:
decimal[] amounts = { 1.99m, 2.50m, 100_000_000m };
decimal total = amounts.Sum();`,
    explanation:
      "LINQ's Sum<int> uses unchecked arithmetic, so overflow wraps silently; cast to long before summing when values could exceed int.MaxValue, or use decimal for financial calculations.",
  },
  {
    id: "cs-plinq-ordering",
    language: "csharp",
    title: "PLINQ results may be unordered — use AsOrdered() to preserve order",
    tag: "caveats",
    code: `var nums = Enumerable.Range(1, 20).ToArray();

// Unordered — output may be in any order:
var unordered = nums.AsParallel().Select(n => n * 2).ToList();

// Ordered — preserves input order, slight overhead:
var ordered = nums.AsParallel().AsOrdered().Select(n => n * 2).ToList();
Console.WriteLine(ordered.SequenceEqual(nums.Select(n => n * 2)));  // true

// AsOrdered can be removed for aggregation where order doesn't matter:
long sum = nums.AsParallel().Sum(n => (long)n);  // order irrelevant`,
    explanation:
      "PLINQ divides the sequence into partitions processed on separate threads; results arrive in completion order unless AsOrdered() is used to buffer and reorder them — apply AsOrdered only when output order is required.",
  },

  // ── types ─────────────────────────────────────────────────────────────────
  {
    id: "cs-expression-func",
    language: "csharp",
    title: "Expression<Func<T,R>> vs Func<T,R> — tree vs delegate",
    tag: "types",
    code: `using System.Linq.Expressions;

// Func<T,R> — compiled delegate, executes directly
Func<int, bool> fn = n => n > 5;
Console.WriteLine(fn(7));  // true

// Expression<Func<T,R>> — expression tree, inspectable
Expression<Func<int, bool>> expr = n => n > 5;
Console.WriteLine(expr);   // n => (n > 5)

// EF Core accepts Expression so it can translate to SQL:
// context.Users.Where(u => u.Age > 18)  — Expression<Func<User,bool>>

// Calling Compile() turns expression into a delegate:
Func<int, bool> compiled = expr.Compile();
Console.WriteLine(compiled(7));  // true`,
    explanation:
      "Func<T,R> is a compiled delegate that executes at call time; Expression<Func<T,R>> stores the lambda as an inspectable tree — database providers traverse this tree to generate SQL instead of running C# code.",
  },
  {
    id: "cs-expression-compile",
    language: "csharp",
    title: ".Compile() — turn an expression tree into a runnable delegate",
    tag: "types",
    code: `using System.Linq.Expressions;

Expression<Func<int, int, int>> add = (a, b) => a + b;
Func<int, int, int> addFn = add.Compile();

Console.WriteLine(addFn(3, 4));   // 7

// Compiled delegates are JIT-compiled — fast after first call
// Cache compiled delegates; recompiling the same expression is expensive:
static readonly Func<int, int, int> CachedAdd =
    ((Expression<Func<int, int, int>>)((a, b) => a + b)).Compile();`,
    explanation:
      "Compile JIT-compiles the expression tree to native code; the resulting delegate runs at full speed; calling Compile repeatedly on the same expression is expensive — always cache the result.",
  },
  {
    id: "cs-expression-body",
    language: "csharp",
    title: "Expression.Lambda<Func<int,bool>>(body, param)",
    tag: "types",
    code: `using System.Linq.Expressions;

// Build: n => n > 5  programmatically
ParameterExpression param = Expression.Parameter(typeof(int), "n");
ConstantExpression  five  = Expression.Constant(5);
BinaryExpression    body  = Expression.GreaterThan(param, five);

Expression<Func<int, bool>> lambda =
    Expression.Lambda<Func<int, bool>>(body, param);

Console.WriteLine(lambda);             // n => (n > 5)
Func<int, bool> fn = lambda.Compile();
Console.WriteLine(fn(7));              // true
Console.WriteLine(fn(3));              // false`,
    explanation:
      "Building expressions programmatically enables generating queries dynamically at runtime; the lambda's type parameter must match the parameter list and body return type exactly.",
  },
  {
    id: "cs-expression-parameter",
    language: "csharp",
    title: "Expression.Parameter(typeof(int), \"x\")",
    tag: "types",
    code: `using System.Linq.Expressions;

// Parameters are typed leaf nodes in the tree
ParameterExpression p1 = Expression.Parameter(typeof(int),    "x");
ParameterExpression p2 = Expression.Parameter(typeof(string), "name");

// Same parameter instance must be used in both body and lambda:
var body = Expression.NotEqual(p2, Expression.Constant(null, typeof(string)));
var lambda = Expression.Lambda<Func<string, bool>>(body, p2);

Func<string, bool> isNotNull = lambda.Compile();
Console.WriteLine(isNotNull("hello"));  // true
Console.WriteLine(isNotNull(null!));    // false`,
    explanation:
      "ParameterExpression is a named placeholder; the same instance must appear in both the body tree and the parameters list passed to Expression.Lambda — passing a different instance causes an InvalidOperationException.",
  },
  {
    id: "cs-expression-const",
    language: "csharp",
    title: "Expression.Constant(42) — literal nodes",
    tag: "types",
    code: `using System.Linq.Expressions;

// Simple constant:
var intConst    = Expression.Constant(42);
var strConst    = Expression.Constant("hello");
var nullConst   = Expression.Constant(null, typeof(string));  // typed null

Console.WriteLine(intConst.Value);    // 42
Console.WriteLine(intConst.Type);     // System.Int32
Console.WriteLine(nullConst.Value);   // null
Console.WriteLine(nullConst.Type);    // System.String

// Used in comparisons:
var param = Expression.Parameter(typeof(int), "n");
var gt42  = Expression.GreaterThan(param, intConst);
Console.WriteLine(gt42);  // (n > 42)`,
    explanation:
      "Expression.Constant wraps a CLR value as a leaf node; for null you must explicitly provide the type argument because the value itself carries no type information at the expression-tree level.",
  },
  {
    id: "cs-expression-member",
    language: "csharp",
    title: "Expression.Property(param, \"Name\") — member access",
    tag: "types",
    code: `using System.Linq.Expressions;

class User { public string Name { get; set; } = ""; public int Age { get; set; } }

ParameterExpression param = Expression.Parameter(typeof(User), "u");

// Access u.Name:
MemberExpression nameProp = Expression.Property(param, "Name");

// Build: u => u.Age > 18
MemberExpression ageProp = Expression.Property(param, "Age");
BinaryExpression body    = Expression.GreaterThan(ageProp, Expression.Constant(18));
var lambda = Expression.Lambda<Func<User, bool>>(body, param);

Console.WriteLine(lambda);  // u => (u.Age > 18)`,
    explanation:
      "Expression.Property creates a property access node by name (string) or by MemberInfo; using the string overload means typos are caught at runtime rather than compile time — prefer the MemberInfo overload in production code.",
  },
  {
    id: "cs-expression-binary",
    language: "csharp",
    title: "Expression.Add / GreaterThan / AndAlso — binary nodes",
    tag: "types",
    code: `using System.Linq.Expressions;

var x = Expression.Parameter(typeof(int), "x");
var y = Expression.Parameter(typeof(int), "y");

var add  = Expression.Add(x, y);           // x + y
var gt   = Expression.GreaterThan(x, y);   // x > y
var and  = Expression.AndAlso(                // x > 0 && y > 0
    Expression.GreaterThan(x, Expression.Constant(0)),
    Expression.GreaterThan(y, Expression.Constant(0)));

var fn = Expression.Lambda<Func<int, int, bool>>(and, x, y).Compile();
Console.WriteLine(fn(3, 4));   // true
Console.WriteLine(fn(-1, 4));  // false`,
    explanation:
      "AndAlso and OrElse generate short-circuit && and || nodes respectively; Add, Subtract, Multiply, Divide map to arithmetic operators; all return BinaryExpression, which can be composed further.",
  },
  {
    id: "cs-expression-method-call",
    language: "csharp",
    title: "Expression.Call — method call nodes",
    tag: "types",
    code: `using System.Linq.Expressions;

ParameterExpression param = Expression.Parameter(typeof(string), "s");

// Build: s => s.ToUpper()
var toUpper = typeof(string).GetMethod("ToUpper", Type.EmptyTypes)!;
MethodCallExpression body = Expression.Call(param, toUpper);

var lambda = Expression.Lambda<Func<string, string>>(body, param);
Func<string, string> fn = lambda.Compile();
Console.WriteLine(fn("hello"));  // HELLO`,
    explanation:
      "Expression.Call builds a method invocation node; use typeof(T).GetMethod to look up the MethodInfo — include parameter types in the GetMethod call when overloads exist to select the correct one.",
  },
  {
    id: "cs-expression-new",
    language: "csharp",
    title: "Expression.New(ctor, args) — constructor calls",
    tag: "types",
    code: `using System.Linq.Expressions;

record Point(int X, int Y);

// Build: () => new Point(3, 4)
var ctor    = typeof(Point).GetConstructor(new[] { typeof(int), typeof(int) })!;
var newExpr = Expression.New(ctor, Expression.Constant(3), Expression.Constant(4));

var factory = Expression.Lambda<Func<Point>>(newExpr).Compile();
Point p = factory();
Console.WriteLine(p);  // Point { X = 3, Y = 4 }

// With parameter binding:
var xParam = Expression.Parameter(typeof(int), "x");
var ctor2   = Expression.Lambda<Func<int, Point>>(
    Expression.New(ctor, xParam, Expression.Constant(0)), xParam).Compile();`,
    explanation:
      "Expression.New generates a constructor invocation; the ConstructorInfo must match the argument types exactly — it is commonly used in expression-based ORM materializers to create entity instances.",
  },
  {
    id: "cs-expression-tree-visitor",
    language: "csharp",
    title: "ExpressionVisitor — inspect or rewrite a tree",
    tag: "types",
    code: `using System.Linq.Expressions;

class ParameterRenamer(string newName) : ExpressionVisitor
{
    protected override Expression VisitParameter(ParameterExpression node)
        => Expression.Parameter(node.Type, newName);
}

Expression<Func<int, bool>> original = n => n > 5;
Console.WriteLine(original);  // n => (n > 5)

var renamed = (Expression<Func<int, bool>>)
    new ParameterRenamer("value").Visit(original);
Console.WriteLine(renamed);   // value => (value > 5)`,
    explanation:
      "ExpressionVisitor uses the Visitor pattern to walk the tree; override the VisitX methods to inspect or replace nodes — returning a different node replaces it, returning the same node preserves it.",
  },
  {
    id: "cs-expression-modify",
    language: "csharp",
    title: "Modifying an expression tree by rebuilding nodes",
    tag: "types",
    code: `using System.Linq.Expressions;

// Replace all constants in the tree with their doubled value:
class DoubleConstants : ExpressionVisitor
{
    protected override Expression VisitConstant(ConstantExpression node) =>
        node.Value is int n
            ? Expression.Constant(n * 2)
            : base.VisitConstant(node);
}

Expression<Func<int, bool>> expr = x => x > 5;
var modified = (Expression<Func<int, bool>>)new DoubleConstants().Visit(expr);
Console.WriteLine(modified);                  // x => (x > 10)
Console.WriteLine(modified.Compile()(11));    // true`,
    explanation:
      "Expression trees are immutable; to 'modify' one you rebuild the relevant nodes and let ExpressionVisitor reconstruct parent nodes automatically via Update methods called internally.",
  },
  {
    id: "cs-expression-compare",
    language: "csharp",
    title: "Comparing two expression trees — no built-in equality",
    tag: "types",
    code: `using System.Linq.Expressions;

Expression<Func<int, bool>> a = x => x > 5;
Expression<Func<int, bool>> b = x => x > 5;

// Reference equality — always false for separately compiled lambdas:
Console.WriteLine(a == b);    // false

// ToString comparison — fragile but sometimes useful:
Console.WriteLine(a.ToString() == b.ToString());  // true

// For reliable structural equality, walk both trees manually
// or use a library like ExpressionEqualityComparer from Microsoft.`,
    explanation:
      "There is no built-in structural equality for expression trees; ToString gives a textual approximation that works for simple trees but breaks on closures and complex nodes — implement a proper visitor-based comparer for production use.",
  },
  {
    id: "cs-queryable-provider",
    language: "csharp",
    title: "IQueryProvider — bridge between LINQ and a backend",
    tag: "types",
    code: `// IQueryable<T> has a Provider property of type IQueryProvider.
// EF Core provides EntityQueryProvider which translates trees to SQL.

// Simplified view of what happens when you query EF Core:
IQueryable<User> query = context.Users.Where(u => u.Age > 18);

// 1. Where stores an expression tree — no SQL executed yet.
// 2. Calling ToList() invokes Provider.Execute(expression):
//    Provider translates the tree to: SELECT * FROM Users WHERE Age > 18
// 3. Results are materialised as User objects.

// IQueryProvider interface:
// IQueryable<T> CreateQuery<T>(Expression expression);
// TResult Execute<TResult>(Expression expression);`,
    explanation:
      "IQueryProvider is the extension point that allows LINQ to talk to databases, REST APIs, or any queryable backend; implementing it is how you build a custom LINQ provider.",
  },
  {
    id: "cs-expression-debug",
    language: "csharp",
    title: "expression.ToString() — readable debug output",
    tag: "types",
    code: `using System.Linq.Expressions;

Expression<Func<int, int, bool>> expr = (a, b) => a + b > 10 && a != b;
Console.WriteLine(expr.ToString());
// (a, b) => ((a + b) > 10 AndAlso (a != b))

// More complex:
Expression<Func<string, bool>> contains = s => s.Contains("hello");
Console.WriteLine(contains.ToString());
// s => s.Contains("hello")

// Useful in logging and debugging LINQ providers:
var param = Expression.Parameter(typeof(int), "n");
var body  = Expression.Multiply(param, Expression.Constant(2));
Console.WriteLine(Expression.Lambda(body, param));  // n => (n * 2)`,
    explanation:
      "ToString on an expression tree produces a human-readable infix representation of the tree; it is invaluable when debugging a custom LINQ provider to see exactly what expression was generated.",
  },

  // ── families ──────────────────────────────────────────────────────────────
  {
    id: "cs-list-ienumerable-query",
    language: "csharp",
    title: "List<T> (concrete) vs IEnumerable<T> (lazy) in method signatures",
    tag: "families",
    code: `// IEnumerable<T> — accept any sequence, don't force materialisation
IEnumerable<int> Filter(IEnumerable<int> source, int min)
    => source.Where(n => n >= min);  // lazy — no work done yet

// IReadOnlyList<T> — when callers need indexing and Count
IReadOnlyList<string> GetNames(IEnumerable<Person> people)
    => people.Select(p => p.Name).ToList();  // materialise once

// List<T> in return type — caller can Add/Remove (usually too permissive)
// Prefer IReadOnlyList or IEnumerable unless mutation is intentional`,
    explanation:
      "Return the narrowest interface that satisfies callers; accepting IEnumerable<T> maximises compatibility; returning IEnumerable delays materialisation; IReadOnlyList signals 'here are the results, count them and index them'.",
  },
  {
    id: "cs-array-list-performance",
    language: "csharp",
    title: "Array random access O(1); List<T> Add is amortized O(1)",
    tag: "families",
    code: `// Array — fixed size, O(1) random access
int[] arr = new int[100_000];
arr[50_000] = 42;   // O(1)

// List<T> — dynamic, doubles capacity on overflow
var list = new List<int>(capacity: 16);  // pre-allocate to avoid resizing
for (int i = 0; i < 100_000; i++) list.Add(i);  // amortized O(1)
Console.WriteLine(list[50_000]);  // O(1)

// List.Insert(0, x) is O(n) — shifts all elements
// Array.Copy is faster than manual loops for bulk moves`,
    explanation:
      "Array provides contiguous memory with O(1) access and is cache-friendly; List<T> trades a small indirection overhead for dynamic sizing — specify initial capacity when the approximate size is known to avoid reallocations.",
  },
  {
    id: "cs-lazy-vs-cached",
    language: "csharp",
    title: "Lazy<T> (one-time) vs a cached field (manual control)",
    tag: "families",
    code: `class ExpensiveService
{
    // Lazy<T> — thread-safe initialisation on first access, then cached
    private readonly Lazy<string> _config =
        new(() => File.ReadAllText("config.json"));

    public string Config => _config.Value;

    // Manual cache — you control invalidation
    private string? _cached;
    public string Manual => _cached ??= File.ReadAllText("config.json");

    public void Invalidate() => _cached = null;  // manual invalidation not possible with Lazy<T>
}`,
    explanation:
      "Lazy<T> is thread-safe by default and provides guaranteed single initialisation; a nullable cached field gives you explicit invalidation at the cost of managing thread safety yourself.",
  },
  {
    id: "cs-memoize-pattern",
    language: "csharp",
    title: "Memoization with ConcurrentDictionary as cache",
    tag: "families",
    code: `using System.Collections.Concurrent;

class Memoizer<TKey, TValue> where TKey : notnull
{
    private readonly ConcurrentDictionary<TKey, TValue> _cache = new();
    private readonly Func<TKey, TValue> _factory;

    public Memoizer(Func<TKey, TValue> factory) => _factory = factory;

    public TValue Get(TKey key) =>
        _cache.GetOrAdd(key, _factory);
}

var fib = new Memoizer<int, long>(n =>
    n < 2 ? n : fib.Get(n - 1) + fib.Get(n - 2));  // recursive

Console.WriteLine(fib.Get(40));  // 102334155`,
    explanation:
      "ConcurrentDictionary.GetOrAdd is thread-safe but may invoke the factory more than once under contention — this is acceptable for pure functions (same key always produces same value).",
  },
  {
    id: "cs-foreach-vs-for",
    language: "csharp",
    title: "foreach vs for on arrays — performance and semantics",
    tag: "families",
    code: `int[] arr = Enumerable.Range(1, 1_000_000).ToArray();

// for — index-based, O(1) random access, can go backwards
long sum1 = 0;
for (int i = 0; i < arr.Length; i++) sum1 += arr[i];

// foreach — cleaner, JIT optimises array iteration to same speed as for
long sum2 = 0;
foreach (int n in arr) sum2 += n;

Console.WriteLine(sum1 == sum2);  // true

// foreach cannot mutate elements (value types are copies)
// for allows mutation: arr[i] = newValue;`,
    explanation:
      "The JIT eliminates bounds checks in foreach over arrays (array length is trusted), so modern foreach is as fast as for; use for when you need the index, backwards iteration, or element mutation.",
  },
  {
    id: "cs-yield-vs-list",
    language: "csharp",
    title: "yield return (lazy) vs building and returning a List<T>",
    tag: "families",
    code: `// Lazy — computes elements on demand, O(1) memory
IEnumerable<int> FibLazy()
{
    int a = 0, b = 1;
    while (true)
    {
        yield return a;
        (a, b) = (b, a + b);
    }
}

// Eager — all elements in memory at once
List<int> FibList(int count)
{
    var result = new List<int>(count);
    int a = 0, b = 1;
    for (int i = 0; i < count; i++) { result.Add(a); (a, b) = (b, a + b); }
    return result;
}

var first10 = FibLazy().Take(10).ToList();`,
    explanation:
      "yield return enables infinite sequences and saves memory when callers only need a prefix; a List is better when callers need random access, Count without iterating, or when the source cannot be replayed.",
  },
  {
    id: "cs-query-syntax-vs-method",
    language: "csharp",
    title: "Query syntax and method syntax compile to the same IL",
    tag: "families",
    code: `var students = new[] { new { Name = "Alice", Score = 90 },
                            new { Name = "Bob",   Score = 75 } };

// Query syntax — preferred for multi-source joins
var q1 = (from s in students
          where s.Score >= 80
          orderby s.Name
          select s.Name).ToList();

// Method syntax — preferred for simple pipelines
var q2 = students
    .Where(s => s.Score >= 80)
    .OrderBy(s => s.Name)
    .Select(s => s.Name)
    .ToList();

Console.WriteLine(q1.SequenceEqual(q2));  // true`,
    explanation:
      "Both syntaxes compile to identical IL; choose query syntax for readability when joins involve multiple from clauses and let variables, and method syntax for simple single-source pipelines.",
  },
  {
    id: "cs-anon-type-vs-tuple",
    language: "csharp",
    title: "Anonymous type vs (int X, string Y) value tuple",
    tag: "families",
    code: `// Anonymous type — immutable, reference type, names in metadata only
var anon = new { X = 3, Name = "Alice" };
Console.WriteLine(anon.X);     // 3

// Value tuple — mutable, stack-allocated, names in metadata only
(int X, string Name) vt = (3, "Alice");
Console.WriteLine(vt.X);       // 3
vt.X = 99;                     // OK — value tuples are mutable

// Value tuples cross method boundaries; anonymous types cannot:
(int, string) GetPair() => (3, "Alice");  // OK
// object GetAnon() => new { X = 3 };     // loses type info`,
    explanation:
      "Anonymous types are compiler-generated immutable classes good only for local projection results; value tuples are value types that can be returned from methods and carry named fields with almost zero overhead.",
  },
  {
    id: "cs-tuple-vs-valuetuple",
    language: "csharp",
    title: "Tuple<> (reference type) vs ValueTuple<> (value type)",
    tag: "families",
    code: `// Old Tuple<> — reference type, heap allocation, .Item1/.Item2
var old = Tuple.Create(1, "Alice");
Console.WriteLine(old.Item1);   // 1

// Modern ValueTuple — stack allocation, named elements
(int Id, string Name) vt = (1, "Alice");
Console.WriteLine(vt.Id);       // 1
Console.WriteLine(vt.Name);     // Alice

// Return from method — ValueTuple is idiomatic:
(int Min, int Max) MinMax(int[] arr) => (arr.Min(), arr.Max());

// Deconstruct:
var (min, max) = MinMax(new[] { 3, 1, 4, 1, 5 });`,
    explanation:
      "Tuple<> predates C# 7 and allocates on the heap; ValueTuple is a struct, so small tuples live on the stack — use ValueTuple for all new code; Tuple only appears in older APIs.",
  },
  {
    id: "cs-named-tuple-fields",
    language: "csharp",
    title: "Named tuple fields vs positional .Item1",
    tag: "families",
    code: `// Positional — works but unclear intent
(int, string) pair = (42, "hello");
Console.WriteLine(pair.Item1);  // 42
Console.WriteLine(pair.Item2);  // hello

// Named — self-documenting
(int Age, string Greeting) named = (42, "hello");
Console.WriteLine(named.Age);       // 42
Console.WriteLine(named.Greeting);  // hello

// Names are syntactic sugar — stripped at runtime (Item1/Item2 still work)
Console.WriteLine(named.Item1);  // 42

// Deconstruction works with both:
var (age, greet) = named;`,
    explanation:
      "Tuple element names exist only in the C# compiler and IDE tooling; at runtime the fields are still Item1, Item2, etc. — names improve readability dramatically without any runtime overhead.",
  },
  {
    id: "cs-anonymous-vs-named",
    language: "csharp",
    title: "Anonymous type (local use) vs named type (cross-boundary)",
    tag: "families",
    code: `// Anonymous — fine within a method; cannot be returned
void LocalOnly()
{
    var result = new { Name = "Alice", Score = 95 };
    Console.WriteLine(result.Name);
}

// Named record — returnable, serialisable, testable
record PersonScore(string Name, int Score);

PersonScore GetTopScorer(IEnumerable<PersonScore> scores)
    => scores.MaxBy(s => s.Score)!;

// Rule of thumb: if data leaves the method, use a named type`,
    explanation:
      "Anonymous types are compiler-generated with no accessible name, so they cannot cross method boundaries via return types, out parameters, or public APIs — use records or classes when the type escapes the declaring method.",
  },
  {
    id: "cs-let-vs-intermediate",
    language: "csharp",
    title: "let in query syntax vs intermediate Select in method syntax",
    tag: "families",
    code: `var words = new[] { "hello", "world", "linq" };

// Query syntax with let:
var q1 = from w in words
         let upper = w.ToUpper()
         let len   = w.Length
         where len > 4
         select \`\${upper}[\${len}]\`;

// Method syntax equivalent — project to tuple, then filter:
var q2 = words
    .Select(w => (upper: w.ToUpper(), len: w.Length, orig: w))
    .Where(t => t.len > 4)
    .Select(t => \`\${t.upper}[\${t.len}]\`);

Console.WriteLine(string.Join(",", q1));
Console.WriteLine(string.Join(",", q2));`,
    explanation:
      "let in query syntax compiles to a Select projection to an anonymous type holding both the original variable and the let binding; in method syntax an explicit Select to a tuple achieves the same result.",
  },
  {
    id: "cs-into-vs-subquery",
    language: "csharp",
    title: "into continuation vs nested from subquery",
    tag: "families",
    code: `var words = new[] { "apple", "ant", "banana", "bat" };

// into — continues the query with grouped/projected results as new range variable
var grouped =
    from w in words
    group w by w[0] into g
    select new { g.Key, Count = g.Count() };

// Nested from — cross join / SelectMany equivalent
var matrix =
    from x in new[] { 1, 2 }
    from y in new[] { "a", "b" }
    select \`\${x}\${y}\`;   // 1a, 1b, 2a, 2b

foreach (var r in grouped) Console.WriteLine(\`\${r.Key}: \${r.Count}\`);`,
    explanation:
      "into re-scopes the query variable after group or select; nested from adds an additional range variable, compiling to SelectMany — they solve different problems and cannot substitute for each other.",
  },
  {
    id: "cs-compiled-vs-interpreted",
    language: "csharp",
    title: "Compiled expression tree vs interpreted LINQ for performance",
    tag: "families",
    code: `using System.Linq.Expressions;

Expression<Func<int, int>> squareExpr = x => x * x;

// Interpreted — slower, no JIT compilation
int r1 = squareExpr.Compile(preferInterpretation: true)(5);

// Compiled (default) — JIT-compiled native code
Func<int, int> squareFn = squareExpr.Compile();
int r2 = squareFn(5);

Console.WriteLine(r1, r2);  // 25, 25

// Cache the compiled delegate — recompiling is expensive:
// BAD: foreach (var item in list) expr.Compile()(item)
// GOOD: var fn = expr.Compile(); foreach (var item in list) fn(item)`,
    explanation:
      "Compile() JIT-compiles the expression to native code — fast for repeated invocations but slow to build; preferInterpretation:true uses a tree-walking interpreter — useful when the expression is used only once.",
  },

  // ── classes ───────────────────────────────────────────────────────────────
  {
    id: "cs-generic-repository",
    language: "csharp",
    title: "IRepository<T> — generic data access contract",
    tag: "classes",
    code: `interface IRepository<T> where T : class
{
    Task<T?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<IReadOnlyList<T>> GetAllAsync(CancellationToken ct = default);
    Task AddAsync(T entity, CancellationToken ct = default);
    Task RemoveAsync(T entity, CancellationToken ct = default);
    Task SaveChangesAsync(CancellationToken ct = default);
}

class UserRepository(AppDbContext db) : IRepository<User>
{
    public async Task<User?> GetByIdAsync(int id, CancellationToken ct = default)
        => await db.Users.FindAsync(new object[] { id }, ct);

    public async Task<IReadOnlyList<User>> GetAllAsync(CancellationToken ct = default)
        => await db.Users.ToListAsync(ct);

    public async Task AddAsync(User u, CancellationToken ct = default)
        => await db.Users.AddAsync(u, ct);

    public Task RemoveAsync(User u, CancellationToken ct = default)
        { db.Users.Remove(u); return Task.CompletedTask; }

    public Task SaveChangesAsync(CancellationToken ct = default)
        => db.SaveChangesAsync(ct);
}`,
    explanation:
      "The generic repository abstracts data access behind an interface, enabling unit tests with in-memory fakes; keep it thin — complex queries should live in dedicated query methods, not forced into a generic API.",
  },
  {
    id: "cs-unit-of-work",
    language: "csharp",
    title: "IUnitOfWork — ties repositories to one transaction",
    tag: "classes",
    code: `interface IUnitOfWork : IAsyncDisposable
{
    IRepository<Order>   Orders   { get; }
    IRepository<Invoice> Invoices { get; }
    Task<int> CommitAsync(CancellationToken ct = default);
}

class EfUnitOfWork(AppDbContext db) : IUnitOfWork
{
    public IRepository<Order>   Orders   { get; } = new OrderRepo(db);
    public IRepository<Invoice> Invoices { get; } = new InvoiceRepo(db);
    public Task<int> CommitAsync(CancellationToken ct) => db.SaveChangesAsync(ct);
    public ValueTask DisposeAsync() => db.DisposeAsync();
}

// Usage:
await using var uow = new EfUnitOfWork(db);
await uow.Orders.AddAsync(order);
await uow.Invoices.AddAsync(invoice);
await uow.CommitAsync();  // single transaction`,
    explanation:
      "UnitOfWork groups related repositories under one transaction boundary; CommitAsync flushes all pending changes atomically — either everything saves or nothing does.",
  },
  {
    id: "cs-specification-pattern",
    language: "csharp",
    title: "ISpecification<T> — composable query criteria",
    tag: "classes",
    code: `using System.Linq.Expressions;

interface ISpecification<T>
{
    Expression<Func<T, bool>> Criteria { get; }
}

class ActiveUserSpec : ISpecification<User>
{
    public Expression<Func<User, bool>> Criteria => u => u.IsActive;
}

class AdultUserSpec : ISpecification<User>
{
    public Expression<Func<User, bool>> Criteria => u => u.Age >= 18;
}

static IQueryable<T> Apply<T>(IQueryable<T> query, ISpecification<T> spec)
    => query.Where(spec.Criteria);

var results = await Apply(Apply(context.Users, new ActiveUserSpec()), new AdultUserSpec())
    .ToListAsync();`,
    explanation:
      "Specification objects encapsulate query predicates as expression trees; they compose, are named (self-documenting), and pass as IQueryable<T> filters that translate to SQL — no raw WHERE strings needed.",
  },
  {
    id: "cs-query-handler",
    language: "csharp",
    title: "CQRS query handler — separate read model from commands",
    tag: "classes",
    code: `record GetUserByIdQuery(int UserId);

record UserDto(int Id, string Name, string Email);

interface IQueryHandler<TQuery, TResult>
{
    Task<TResult> HandleAsync(TQuery query, CancellationToken ct = default);
}

class GetUserByIdHandler(AppDbContext db)
    : IQueryHandler<GetUserByIdQuery, UserDto?>
{
    public async Task<UserDto?> HandleAsync(
        GetUserByIdQuery q, CancellationToken ct = default)
    {
        return await db.Users
            .Where(u => u.Id == q.UserId)
            .Select(u => new UserDto(u.Id, u.Name, u.Email))
            .FirstOrDefaultAsync(ct);
    }
}`,
    explanation:
      "CQRS query handlers project directly to DTOs rather than loading domain entities, avoiding unnecessary object mapping and keeping the read path fast and decoupled from the write model.",
  },
  {
    id: "cs-read-model",
    language: "csharp",
    title: "Read model — denormalised DTO for fast queries",
    tag: "classes",
    code: `// Denormalised DTO — everything a view needs in one flat object
record OrderSummaryDto(
    int     OrderId,
    string  CustomerName,
    string  CustomerEmail,
    decimal Total,
    int     ItemCount,
    string  StatusLabel);

// Query handler projects directly to the DTO — no entity loading:
var summaries = await db.Orders
    .Select(o => new OrderSummaryDto(
        o.Id,
        o.Customer.Name,
        o.Customer.Email,
        o.Items.Sum(i => i.Price),
        o.Items.Count,
        o.Status.ToString()))
    .ToListAsync();`,
    explanation:
      "Read models project flat DTOs directly from the database in a single query; avoiding loading full entity graphs and then mapping them prevents N+1 queries and unnecessary eager loading.",
  },
  {
    id: "cs-event-sourcing",
    language: "csharp",
    title: "Event sourcing — state rebuilt by replaying events",
    tag: "classes",
    code: `abstract record DomainEvent(DateTimeOffset OccurredAt);
record FundsDeposited(decimal Amount, DateTimeOffset OccurredAt) : DomainEvent(OccurredAt);
record FundsWithdrawn(decimal Amount, DateTimeOffset OccurredAt) : DomainEvent(OccurredAt);

class Account
{
    public decimal Balance { get; private set; }

    public void Apply(DomainEvent e)
    {
        Balance += e switch
        {
            FundsDeposited d => d.Amount,
            FundsWithdrawn w => -w.Amount,
            _ => 0
        };
    }

    public static Account Rehydrate(IEnumerable<DomainEvent> history)
    {
        var acct = new Account();
        foreach (var e in history) acct.Apply(e);
        return acct;
    }
}`,
    explanation:
      "Event sourcing stores the sequence of state changes rather than the current state; the aggregate is rehydrated by replaying events — this gives a full audit log and the ability to reconstruct state at any point in time.",
  },
  {
    id: "cs-aggregate-root",
    language: "csharp",
    title: "Aggregate root — enforces invariants for a cluster of entities",
    tag: "classes",
    code: `class Order
{
    private readonly List<OrderItem> _items = new();
    public IReadOnlyList<OrderItem> Items => _items;
    public OrderStatus Status { get; private set; } = OrderStatus.Draft;

    public void AddItem(Product product, int qty)
    {
        if (Status != OrderStatus.Draft)
            throw new InvalidOperationException("Cannot modify a confirmed order");
        _items.Add(new OrderItem(product, qty));
    }

    public void Confirm()
    {
        if (_items.Count == 0)
            throw new InvalidOperationException("Cannot confirm empty order");
        Status = OrderStatus.Confirmed;
    }
}`,
    explanation:
      "The aggregate root is the only entry point for all modifications to the cluster; all business rules are enforced here, ensuring the aggregate is always in a valid state regardless of who calls which method.",
  },
  {
    id: "cs-value-object",
    language: "csharp",
    title: "Value object — equality by content, no identity",
    tag: "classes",
    code: `// C# record is perfect for value objects:
record Money(decimal Amount, string Currency)
{
    public Money Add(Money other)
    {
        if (Currency != other.Currency)
            throw new InvalidOperationException("Cannot add different currencies");
        return new Money(Amount + other.Amount, Currency);
    }

    public override string ToString() => \`\${Amount:F2} \${Currency}\`;
}

var a = new Money(10.00m, "USD");
var b = new Money(15.00m, "USD");
Console.WriteLine(a.Add(b));        // 25.00 USD
Console.WriteLine(a == new Money(10.00m, "USD"));  // true (value equality)`,
    explanation:
      "Value objects have no identity — two instances with identical content are equal; records provide structural equality automatically and immutability by default, making them the ideal C# representation for domain value objects.",
  },
  {
    id: "cs-domain-service",
    language: "csharp",
    title: "Domain service — logic that doesn't belong to a single entity",
    tag: "classes",
    code: `// Domain service: logic involving multiple aggregates / coordination
class TransferService
{
    public void Transfer(Account from, Account to, Money amount)
    {
        // Neither Account alone 'knows' about the transfer rules
        if (from.Balance < amount.Amount)
            throw new InsufficientFundsException();

        from.Debit(amount);
        to.Credit(amount);
    }
}

// Usage in application layer:
class TransferCommandHandler(IRepository<Account> repo, TransferService svc)
{
    public async Task HandleAsync(TransferCommand cmd)
    {
        var from = await repo.GetByIdAsync(cmd.FromId);
        var to   = await repo.GetByIdAsync(cmd.ToId);
        svc.Transfer(from!, to!, new Money(cmd.Amount, cmd.Currency));
        await repo.SaveChangesAsync();
    }
}`,
    explanation:
      "Domain services host logic that coordinates multiple aggregates or requires cross-aggregate business rules; they are stateless, belong in the domain layer, and are distinct from application services which handle infrastructure concerns.",
  },
  {
    id: "cs-factory-method",
    language: "csharp",
    title: "Factory Method — subclass decides which product to create",
    tag: "classes",
    code: `abstract class Notification
{
    public abstract string Deliver(string message);
}

class EmailNotification : Notification
{
    public override string Deliver(string message) => \`Email: \${message}\`;
}

class SmsNotification : Notification
{
    public override string Deliver(string message) => \`SMS: \${message}\`;
}

abstract class NotificationFactory
{
    protected abstract Notification Create();
    public string Notify(string msg) => Create().Deliver(msg);
}

class EmailFactory : NotificationFactory
{
    protected override Notification Create() => new EmailNotification();
}

Console.WriteLine(new EmailFactory().Notify("Hello"));  // Email: Hello`,
    explanation:
      "Factory Method delegates instantiation to subclasses; the base class defines the algorithm and calls Create() without knowing the concrete product type — adding a new notification channel requires only a new pair of subclasses.",
  },
  {
    id: "cs-abstract-command",
    language: "csharp",
    title: "Abstract Command with Execute() and Undo()",
    tag: "classes",
    code: `abstract class Command
{
    public abstract void Execute();
    public abstract void Undo();
}

class InsertTextCommand(StringBuilder doc, int pos, string text) : Command
{
    public override void Execute() => doc.Insert(pos, text);
    public override void Undo()    => doc.Remove(pos, text.Length);
}

var doc = new StringBuilder("Hello!");
var cmd = new InsertTextCommand(doc, 5, " World");
cmd.Execute();
Console.WriteLine(doc);  // Hello World!
cmd.Undo();
Console.WriteLine(doc);  // Hello!`,
    explanation:
      "The abstract Command base enforces that all commands support both Execute and Undo; a command stack (List<Command>) enables unlimited undo by calling Undo in reverse order.",
  },
  {
    id: "cs-pipeline-behavior",
    language: "csharp",
    title: "MediatR pipeline behavior — cross-cutting concerns",
    tag: "classes",
    code: `using MediatR;
using Microsoft.Extensions.Logging;

class LoggingBehavior<TRequest, TResponse>(ILogger<LoggingBehavior<TRequest, TResponse>> log)
    : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken ct)
    {
        log.LogInformation("Handling {Type}", typeof(TRequest).Name);
        var response = await next();
        log.LogInformation("Handled {Type}", typeof(TRequest).Name);
        return response;
    }
}

// Registration:
// builder.Services.AddTransient(typeof(IPipelineBehavior<,>), typeof(LoggingBehavior<,>));`,
    explanation:
      "Pipeline behaviors wrap every request/response flowing through MediatR, making them ideal for cross-cutting concerns (logging, validation, caching, transactions) without modifying individual handlers.",
  },
  {
    id: "cs-decorator-handler",
    language: "csharp",
    title: "Decorator handler — wrapping another handler",
    tag: "classes",
    code: `interface IOrderHandler
{
    Task HandleAsync(Order order, CancellationToken ct = default);
}

class BaseOrderHandler : IOrderHandler
{
    public Task HandleAsync(Order order, CancellationToken ct = default)
    {
        Console.WriteLine(\`Processing order \${order.Id}\`);
        return Task.CompletedTask;
    }
}

class TimingDecorator(IOrderHandler inner) : IOrderHandler
{
    public async Task HandleAsync(Order order, CancellationToken ct = default)
    {
        var sw = System.Diagnostics.Stopwatch.StartNew();
        await inner.HandleAsync(order, ct);
        Console.WriteLine(\`Completed in \${sw.ElapsedMilliseconds}ms\`);
    }
}`,
    explanation:
      "The Decorator wraps the same interface, adding behaviour before/after delegation; decorators compose via constructor injection — the DI container builds the chain automatically with Scrutor or manual registration.",
  },
  {
    id: "cs-composite-validator",
    language: "csharp",
    title: "Composite validator — run multiple validators in sequence",
    tag: "classes",
    code: `interface IValidator<T>
{
    IEnumerable<string> Validate(T value);
}

class NotNullValidator<T> : IValidator<T?> where T : class
{
    public IEnumerable<string> Validate(T? value)
    {
        if (value is null) yield return "Value must not be null";
    }
}

class CompositeValidator<T>(IEnumerable<IValidator<T>> validators) : IValidator<T>
{
    public IEnumerable<string> Validate(T value)
        => validators.SelectMany(v => v.Validate(value));
}

var composite = new CompositeValidator<string>(new IValidator<string>[]
{
    new NotNullValidator<string>(),
    // add more validators here
});
foreach (var err in composite.Validate(null!))
    Console.WriteLine(err);`,
    explanation:
      "CompositeValidator collects errors from all registered validators; using IEnumerable<string> for errors allows lazy evaluation and returning all failures rather than stopping at the first one.",
  },
  {
    id: "cs-notification-handler",
    language: "csharp",
    title: "Notification handler — publish to multiple subscribers",
    tag: "classes",
    code: `using MediatR;

record OrderPlaced(int OrderId, decimal Total) : INotification;

class SendConfirmationEmail : INotificationHandler<OrderPlaced>
{
    public Task Handle(OrderPlaced n, CancellationToken ct)
    {
        Console.WriteLine(\`Sending confirmation email for order \${n.OrderId}\`);
        return Task.CompletedTask;
    }
}

class UpdateInventory : INotificationHandler<OrderPlaced>
{
    public Task Handle(OrderPlaced n, CancellationToken ct)
    {
        Console.WriteLine(\`Updating inventory for order \${n.OrderId}\`);
        return Task.CompletedTask;
    }
}

// Publisher:
// await mediator.Publish(new OrderPlaced(42, 99.99m));
// Both handlers run automatically.`,
    explanation:
      "MediatR notifications fan out to all registered INotificationHandler<T> implementations; handlers run in registration order by default and are decoupled from the publisher and from each other.",
  },
  {
    id: "cs-event-handler",
    language: "csharp",
    title: "Domain event handler decoupled via mediator",
    tag: "classes",
    code: `using MediatR;

// Domain event:
record UserRegistered(int UserId, string Email) : INotification;

// Handler lives in the application layer, not the domain:
class SendWelcomeEmailOnUserRegistered(IEmailService email)
    : INotificationHandler<UserRegistered>
{
    public async Task Handle(UserRegistered evt, CancellationToken ct)
    {
        await email.SendAsync(
            evt.Email,
            "Welcome!",
            "Thanks for registering.",
            ct);
    }
}

// The domain only raises the event; it doesn't know about emails.`,
    explanation:
      "Decoupling domain events from their handlers via a mediator keeps the domain model free of infrastructure concerns; adding a new reaction to UserRegistered only requires a new handler class.",
  },
];
