// ============================================================
// Scroll Mode — bite-sized code snippets for microlearning
// ============================================================
// Pure-content data. No XP / progress / streak coupling — the
// scroll feed is a learning surface, not a graded activity.
// ============================================================

import type { BranchId } from "@/lib/types";

export type SnippetLanguage = Extract<BranchId, "python" | "csharp">;

export interface Snippet {
  id: string;
  language: SnippetLanguage;
  title: string;
  /** Optional very short tag (e.g., "syntax", "stdlib", "OOP") for filtering later */
  tag?: string;
  /** Source code, displayed in a monospace block. Inline `# ...` / `// ...` comments are fine. */
  code: string;
  /** 1–2 sentence explanation. Conversational, not API docs. */
  explanation: string;
}

export const snippets: Snippet[] = [
  // ────────────── Python ──────────────
  {
    id: "py-list-comp",
    language: "python",
    title: "List comprehension",
    tag: "syntax",
    code: `squares = [n * n for n in range(10)]
# [0, 1, 4, 9, 16, 25, 36, 49, 64, 81]`,
    explanation:
      "Build a list in one expression: value first, then the loop. Same as a for-loop with append, but compiled to faster bytecode.",
  },
  {
    id: "py-dict-comp",
    language: "python",
    title: "Dict comprehension",
    tag: "syntax",
    code: `users = ["ada", "linus", "grace"]
ids = {name: i for i, name in enumerate(users)}
# {'ada': 0, 'linus': 1, 'grace': 2}`,
    explanation:
      "Same shape as a list comp, but uses key:value pairs. Great for inverting lists or remapping dicts in a single line.",
  },
  {
    id: "py-fstring",
    language: "python",
    title: "f-string formatting",
    tag: "syntax",
    code: `pct = 0.8472
print(f"grip: {pct:.1%}")
# grip: 84.7%`,
    explanation:
      'Inline expressions inside f"...". After the colon, format specs like .1% (percent, 1 decimal) or :,.2f (thousands + 2 decimals).',
  },
  {
    id: "py-walrus",
    language: "python",
    title: "Walrus operator",
    tag: "syntax",
    code: `while (line := input()) != "quit":
    print(f"got: {line}")`,
    explanation:
      ":= assigns AND returns in one step. Useful inside while/if conditions to avoid repeating the call.",
  },
  {
    id: "py-enumerate",
    language: "python",
    title: "enumerate over a list",
    tag: "stdlib",
    code: `for i, name in enumerate(["ada", "linus"], start=1):
    print(i, name)
# 1 ada
# 2 linus`,
    explanation:
      "Use enumerate instead of `for i in range(len(xs))`. `start=` lets you offset the counter (e.g., 1 for human-readable).",
  },
  {
    id: "py-zip",
    language: "python",
    title: "zip parallel iteration",
    tag: "stdlib",
    code: `names = ["ada", "linus"]
ages = [36, 54]
for n, a in zip(names, ages):
    print(n, a)`,
    explanation:
      "zip pairs items from multiple iterables. Stops at the shortest. Use itertools.zip_longest if you need padding.",
  },
  {
    id: "py-dataclass",
    language: "python",
    title: "Dataclass for data holders",
    tag: "OOP",
    code: `from dataclasses import dataclass

@dataclass
class Climber:
    name: str
    grade: str
    weight_kg: float = 70.0`,
    explanation:
      "@dataclass auto-generates __init__, __repr__, and __eq__ from the field annotations. Defaults work like normal kwargs.",
  },
  {
    id: "py-context-mgr",
    language: "python",
    title: "with statement",
    tag: "syntax",
    code: `with open("log.txt") as f:
    data = f.read()
# file is auto-closed here, even on errors`,
    explanation:
      "with calls __enter__ on entry and __exit__ on exit (even when an exception escapes). The standard way to manage files, locks, db connections.",
  },
  {
    id: "py-generator",
    language: "python",
    title: "Generator function",
    tag: "advanced",
    code: `def fibs():
    a, b = 0, 1
    while True:
        yield a
        a, b = b, a + b

from itertools import islice
list(islice(fibs(), 6))
# [0, 1, 1, 2, 3, 5]`,
    explanation:
      "yield turns a function into a lazy iterator — values are produced one at a time, on demand. islice trims an infinite stream.",
  },
  {
    id: "py-args-kwargs",
    language: "python",
    title: "*args and **kwargs",
    tag: "functions",
    code: `def log(level, *args, **kwargs):
    print(level, args, kwargs)

log("info", 1, 2, user="ada")
# info (1, 2) {'user': 'ada'}`,
    explanation:
      "*args collects extra positional args as a tuple; **kwargs collects extra keyword args as a dict. Pass them through with log(*args, **kwargs).",
  },
  {
    id: "py-slicing",
    language: "python",
    title: "Slicing with step",
    tag: "syntax",
    code: `xs = [0, 1, 2, 3, 4, 5]
xs[::2]    # [0, 2, 4]   every 2nd
xs[::-1]   # [5, 4, 3, 2, 1, 0]   reversed
xs[1:4]    # [1, 2, 3]`,
    explanation:
      "Slice syntax is [start:stop:step]. Negative step walks backwards — `[::-1]` is the canonical reverse trick.",
  },
  {
    id: "py-ternary",
    language: "python",
    title: "Ternary expression",
    tag: "syntax",
    code: `status = "ok" if score >= 70 else "fail"`,
    explanation:
      "value_if_true if condition else value_if_false. Reads left-to-right unlike most languages' ?:. Good for one-liners; use full if/else for anything complex.",
  },
  {
    id: "py-decorator",
    language: "python",
    title: "Function decorator",
    tag: "functions",
    code: `def timed(fn):
    def wrap(*a, **kw):
        import time; t = time.time()
        out = fn(*a, **kw)
        print(f"{fn.__name__} took {time.time()-t:.3f}s")
        return out
    return wrap

@timed
def slow():
    sum(range(10_000_000))`,
    explanation:
      "@timed is sugar for `slow = timed(slow)`. The decorator wraps the original and returns a replacement — common for logging, caching, auth.",
  },
  {
    id: "py-defaultdict",
    language: "python",
    title: "defaultdict for grouping",
    tag: "stdlib",
    code: `from collections import defaultdict
groups = defaultdict(list)
for word in ["ant", "ape", "bee", "bat"]:
    groups[word[0]].append(word)
# {'a': ['ant','ape'], 'b': ['bee','bat']}`,
    explanation:
      "defaultdict creates a default value for missing keys (here: an empty list). Saves the `if key not in d: d[key] = []` boilerplate.",
  },
  {
    id: "py-any-all",
    language: "python",
    title: "any() and all()",
    tag: "stdlib",
    code: `nums = [2, 4, 6, 8]
all(n % 2 == 0 for n in nums)  # True
any(n > 5 for n in nums)       # True`,
    explanation:
      "any/all take an iterable of bools (often a generator expression). Both short-circuit — they stop scanning as soon as the answer is known.",
  },

  // ────────────── C# ──────────────
  {
    id: "cs-var",
    language: "csharp",
    title: "var inferred typing",
    tag: "syntax",
    code: `var name = "Ada";        // string
var count = 42;          // int
var users = new List<string>();`,
    explanation:
      "var asks the compiler to infer the type from the right side. Fully static — same as writing the type explicitly. Doesn't work without an initializer.",
  },
  {
    id: "cs-linq-where",
    language: "csharp",
    title: "LINQ Where + Select",
    tag: "LINQ",
    code: `var names = new[] { "ada", "linus", "grace" };
var upper = names
    .Where(n => n.Length > 3)
    .Select(n => n.ToUpper())
    .ToList();
// ["LINUS", "GRACE"]`,
    explanation:
      "LINQ chains lazy operations on any IEnumerable. Where filters; Select maps. ToList() forces execution — without it, nothing runs.",
  },
  {
    id: "cs-properties",
    language: "csharp",
    title: "Auto-properties",
    tag: "OOP",
    code: `public class Climber
{
    public string Name { get; init; }
    public int Grade { get; set; } = 5;
}`,
    explanation:
      "{ get; set; } generates a hidden backing field. `init` lets you set it only inside an object initializer — handy for immutable-ish records.",
  },
  {
    id: "cs-async",
    language: "csharp",
    title: "async / await",
    tag: "advanced",
    code: `public async Task<string> FetchAsync(string url)
{
    using var http = new HttpClient();
    var body = await http.GetStringAsync(url);
    return body.Trim();
}`,
    explanation:
      "async marks a method as awaitable; await suspends until the Task completes without blocking the thread. The method's return type wraps in Task<T>.",
  },
  {
    id: "cs-record",
    language: "csharp",
    title: "Record types",
    tag: "OOP",
    code: `public record Climber(string Name, int Grade);

var a = new Climber("Ada", 7);
var b = a with { Grade = 8 };
Console.WriteLine(a == new Climber("Ada", 7)); // True`,
    explanation:
      "Records get value-based equality and a `with` expression for non-destructive updates. Great for DTOs and immutable models.",
  },
  {
    id: "cs-null-coalesce",
    language: "csharp",
    title: "Null-coalescing operators",
    tag: "syntax",
    code: `string? input = null;
var name = input ?? "anonymous";

User? u = GetUser();
var grade = u?.Climber?.Grade ?? 0;`,
    explanation:
      "?? returns the right side if the left is null. ?. short-circuits to null if any link is null — chain them to safely walk through optional references.",
  },
  {
    id: "cs-pattern-match",
    language: "csharp",
    title: "Pattern matching switch",
    tag: "syntax",
    code: `string Describe(object o) => o switch
{
    int n when n < 0 => "negative",
    int 0           => "zero",
    int            => "positive int",
    string s        => $"string: {s}",
    null           => "null",
    _              => "other",
};`,
    explanation:
      "switch expression returns a value. Patterns can match types, constants, and add `when` guards. `_` is the catch-all.",
  },
  {
    id: "cs-foreach",
    language: "csharp",
    title: "foreach loop",
    tag: "syntax",
    code: `var grades = new[] { "5.10a", "5.11b", "5.12c" };
foreach (var g in grades)
{
    Console.WriteLine(g);
}`,
    explanation:
      "foreach iterates anything that implements IEnumerable. Simpler and less error-prone than `for (int i = 0; ...)` when you just need each item.",
  },
  {
    id: "cs-interpolation",
    language: "csharp",
    title: "String interpolation",
    tag: "syntax",
    code: `var name = "Ada";
var pct = 0.847;
Console.WriteLine($"{name}: {pct:P1}");
// Ada: 84.7%`,
    explanation:
      '$"..." embeds expressions in {}. After the colon: format specifiers like P1 (percent, 1 decimal) or N0 (number, no decimals).',
  },
  {
    id: "cs-tuple",
    language: "csharp",
    title: "Value tuples",
    tag: "syntax",
    code: `(string Name, int Grade) GetTop() => ("Ada", 9);

var (name, grade) = GetTop();
Console.WriteLine($"{name} V{grade}");`,
    explanation:
      "Return multiple values without a class. Names are optional but help at the call site. Deconstruct directly into local variables.",
  },
  {
    id: "cs-linq-aggregate",
    language: "csharp",
    title: "LINQ aggregations",
    tag: "LINQ",
    code: `var scores = new[] { 4, 7, 9, 3, 6 };
scores.Sum();        // 29
scores.Average();    // 5.8
scores.Max();        // 9
scores.Count(s => s > 5); // 3`,
    explanation:
      "Sum/Average/Min/Max/Count run in a single pass over the sequence. Count(predicate) combines filter and count.",
  },
  {
    id: "cs-lambda",
    language: "csharp",
    title: "Lambda expressions",
    tag: "functions",
    code: `Func<int, int, int> add = (a, b) => a + b;
Action<string> log = msg => Console.WriteLine(msg);

add(2, 3);    // 5
log("hi");`,
    explanation:
      "Func<...,TResult> is a callable that returns a value; Action<...> returns void. Lambdas (=>) are inline anonymous functions.",
  },
  {
    id: "cs-expression-bodied",
    language: "csharp",
    title: "Expression-bodied members",
    tag: "syntax",
    code: `public class Climber
{
    public string Name { get; init; }
    public string Tag => $"@{Name.ToLower()}";
    public bool IsStrong(int grade) => grade >= 8;
}`,
    explanation:
      "=> as a method body when it's a single expression. Common for read-only properties and tiny helpers — less ceremony than { return ... }.",
  },
  {
    id: "cs-collection-init",
    language: "csharp",
    title: "Collection initializers",
    tag: "syntax",
    code: `var grades = new Dictionary<string, int>
{
    ["Ada"] = 7,
    ["Linus"] = 9,
};

int[] nums = [1, 2, 3, 4]; // C# 12 collection expression`,
    explanation:
      "Initialize a Dictionary inline with [key] = value. C# 12 added the [..] collection expression that infers the right collection type.",
  },
  {
    id: "cs-using-disposable",
    language: "csharp",
    title: "using declaration",
    tag: "syntax",
    code: `void Read(string path)
{
    using var stream = File.OpenRead(path);
    // ... use stream ...
} // Dispose() called here automatically`,
    explanation:
      "using ensures Dispose() runs when the variable leaves scope — like Python's `with`. The newer form (no braces) scopes to the enclosing block.",
  },
  {
    id: "cs-nameof",
    language: "csharp",
    title: "nameof for safe strings",
    tag: "syntax",
    code: `void Save(Climber c)
{
    if (c is null)
        throw new ArgumentNullException(nameof(c));
}`,
    explanation:
      'nameof returns the identifier as a string at compile time. Survives renames (the IDE updates it), unlike a hard-coded "c".',
  },
];
