import type { Snippet } from "./types";

export const csharpSnippets20260518B1: Snippet[] = [
  {
    id: "cs-b18-b1-linq-any-predicate",
    language: "csharp",
    title: "LINQ .Any() with predicate for existence checks",
    tag: "snippet",
    code: `using System.Linq;

var scores = new[] { 42, 87, 61, 95, 33 };

bool hasExcellent = scores.Any(s => s >= 90);
bool allPassed    = scores.All(s => s >= 50);
bool anyFailed    = scores.Any(s => s < 50);

Console.WriteLine(hasExcellent);  // True
Console.WriteLine(allPassed);     // False
Console.WriteLine(anyFailed);     // True`,
    explanation: "`.Any(predicate)` short-circuits at the first match; `.All(predicate)` short-circuits at the first failure — both are O(n) worst case but O(1) average for early exits.",
  },
  {
    id: "cs-b18-b1-string-isnullorwhitespace",
    language: "csharp",
    title: "String.IsNullOrWhiteSpace for robust empty checks",
    tag: "snippet",
    code: `string? a = null;
string  b = "";
string  c = "   ";
string  d = "hello";

Console.WriteLine(string.IsNullOrEmpty(a));          // True
Console.WriteLine(string.IsNullOrEmpty(c));          // False (has spaces)
Console.WriteLine(string.IsNullOrWhiteSpace(a));     // True
Console.WriteLine(string.IsNullOrWhiteSpace(c));     // True
Console.WriteLine(string.IsNullOrWhiteSpace(d));     // False`,
    explanation: "`IsNullOrWhiteSpace` covers null, empty string, and whitespace-only strings — preferred over `IsNullOrEmpty` when user-facing text fields must not be blank.",
  },
  {
    id: "cs-b18-b1-dateonly-timeonly",
    language: "csharp",
    title: "DateOnly and TimeOnly for date/time without timezone",
    tag: "snippet",
    code: `var date = new DateOnly(2026, 5, 18);
var time = new TimeOnly(14, 30, 0);

Console.WriteLine(date);              // 05/18/2026
Console.WriteLine(time);              // 2:30 PM
Console.WriteLine(date.DayOfWeek);   // Monday

DateOnly today = DateOnly.FromDateTime(DateTime.Now);
TimeOnly now   = TimeOnly.FromDateTime(DateTime.Now);`,
    explanation: "`DateOnly` and `TimeOnly` (.NET 6+) are lightweight value types representing just a date or time without timezone info — cleaner than `DateTime` for birthdays, business hours, etc.",
  },
  {
    id: "cs-b18-b1-enumerable-chunk",
    language: "csharp",
    title: "Enumerable.Chunk() for batched processing",
    tag: "snippet",
    code: `using System.Linq;

int[] items = Enumerable.Range(1, 10).ToArray();

foreach (var batch in items.Chunk(3))
{
    Console.WriteLine(string.Join(", ", batch));
}
// 1, 2, 3
// 4, 5, 6
// 7, 8, 9
// 10`,
    explanation: "`Chunk(size)` (.NET 6+) splits a sequence into arrays of at most `size` elements — the last chunk may be smaller. Useful for paginating API calls or batching DB inserts.",
  },
  {
    id: "cs-b18-b1-array-fill",
    language: "csharp",
    title: "Array.Fill for bulk initialization",
    tag: "snippet",
    code: `int[] arr = new int[8];
Array.Fill(arr, -1);
Console.WriteLine(string.Join(" ", arr));  // -1 -1 -1 -1 -1 -1 -1 -1

// Fill a slice only:
Array.Fill(arr, 0, startIndex: 2, count: 3);
Console.WriteLine(string.Join(" ", arr));  // -1 -1 0 0 0 -1 -1 -1`,
    explanation: "`Array.Fill` fills all or a range of elements with a value in O(n) — equivalent to a loop but clearer in intent and eligible for JIT vectorisation.",
  },
  {
    id: "cs-b18-b1-random-shared",
    language: "csharp",
    title: "Random.Shared for thread-safe random numbers",
    tag: "snippet",
    code: `// Thread-safe, no need to create or lock instances
int roll   = Random.Shared.Next(1, 7);       // 1..6 inclusive
double pct = Random.Shared.NextDouble();      // [0.0, 1.0)
int[]  arr = { 1, 2, 3, 4, 5 };
Random.Shared.Shuffle(arr);                   // in-place (.NET 8+)

Console.WriteLine(roll);
Console.WriteLine(pct);
Console.WriteLine(string.Join(" ", arr));`,
    explanation: "`Random.Shared` (.NET 6+) is a thread-safe static instance using a faster algorithm than `new Random()` — no seed collisions when created concurrently.",
  },
  {
    id: "cs-b18-b1-dict-getoradd",
    language: "csharp",
    title: "Dictionary.GetValueOrDefault — null-safe lookup",
    tag: "snippet",
    code: `var scores = new Dictionary<string, int>
{
    ["Alice"] = 95,
    ["Bob"]   = 82,
};

int alice = scores.GetValueOrDefault("Alice", 0);  // 95
int carol = scores.GetValueOrDefault("Carol", 0);  // 0

// Equivalent verbose version:
int carol2 = scores.TryGetValue("Carol", out int v) ? v : 0;`,
    explanation: "`GetValueOrDefault(key, defaultValue)` returns the default if the key is absent — cleaner than a null check on `TryGetValue` when you just want a fallback value.",
  },
  {
    id: "cs-b18-b1-string-split-options",
    language: "csharp",
    title: "String.Split with StringSplitOptions",
    tag: "snippet",
    code: `string csv = "alpha,,beta, ,gamma";

// Default: keeps empty entries
string[] all = csv.Split(',');
Console.WriteLine(all.Length);  // 5

// Remove empty and trim:
string[] clean = csv.Split(',',
    StringSplitOptions.RemoveEmptyEntries |
    StringSplitOptions.TrimEntries);
Console.WriteLine(string.Join("|", clean));  // alpha|beta|gamma`,
    explanation: "`StringSplitOptions.RemoveEmptyEntries` drops zero-length segments; `TrimEntries` (.NET 5+) strips whitespace from each part — combine them with `|` for clean CSV parsing.",
  },
  {
    id: "cs-b18-b1-span-from-string",
    language: "csharp",
    title: "ReadOnlySpan<char> from string — zero-allocation slicing",
    tag: "snippet",
    code: `string line = "2026-05-18 INFO Server started";

ReadOnlySpan<char> span = line.AsSpan();
int spaceIdx = span.IndexOf(' ');

ReadOnlySpan<char> datePart    = span[..spaceIdx];
ReadOnlySpan<char> messagePart = span[(spaceIdx + 1)..];

Console.WriteLine(datePart.ToString());    // 2026-05-18
Console.WriteLine(messagePart.ToString()); // INFO Server started`,
    explanation: "`AsSpan()` creates a `ReadOnlySpan<char>` over the string's data without allocating — slicing with ranges is O(1) and avoids creating substring heap objects.",
  },
  {
    id: "cs-b18-b1-hashcode-combine",
    language: "csharp",
    title: "HashCode.Combine for multi-field hash codes",
    tag: "snippet",
    code: `record Point(int X, int Y);

// Manual hash for a class that doesn't use records:
public class Coord : IEquatable<Coord>
{
    public int X { get; init; }
    public int Y { get; init; }

    public override int GetHashCode() =>
        HashCode.Combine(X, Y);

    public bool Equals(Coord? other) =>
        other is not null && X == other.X && Y == other.Y;
}

var c = new Coord { X = 3, Y = 4 };
Console.WriteLine(c.GetHashCode());`,
    explanation: "`HashCode.Combine(a, b, ...)` produces a well-distributed hash from multiple values — much better than XOR or multiplication, matching what `record` generates automatically.",
  },
  {
    id: "cs-b18-b1-enumerable-repeat",
    language: "csharp",
    title: "Enumerable.Repeat to fill sequences",
    tag: "snippet",
    code: `using System.Linq;

// Five zeros:
int[] zeros = Enumerable.Repeat(0, 5).ToArray();
Console.WriteLine(string.Join(" ", zeros));  // 0 0 0 0 0

// Default objects (reference types — all point to the same instance):
var items = Enumerable.Repeat(new object(), 3).ToList();
Console.WriteLine(ReferenceEquals(items[0], items[1]));  // True`,
    explanation: "`Enumerable.Repeat(value, count)` generates a sequence of the same value; be careful with reference types — every element is the **same** object, not independent copies.",
  },
  {
    id: "cs-b18-b1-interlocked-increment",
    language: "csharp",
    title: "Interlocked.Increment for lock-free counter",
    tag: "snippet",
    code: `using System.Threading;

int counter = 0;

Parallel.For(0, 10_000, _ =>
{
    Interlocked.Increment(ref counter);
});

Console.WriteLine(counter);  // always 10000

// Without Interlocked, counter++ is a race:
// read → increment → write — another thread may interleave`,
    explanation: "`Interlocked.Increment` performs an atomic read-modify-write, safe for concurrent counters without a lock — significantly cheaper than `lock` for single-variable increments.",
  },
  {
    id: "cs-b18-b1-math-divrem",
    language: "csharp",
    title: "Math.DivRem — quotient and remainder in one call",
    tag: "snippet",
    code: `(int q1, int r1) = Math.DivRem(17, 5);
Console.WriteLine($"17 / 5 = {q1} remainder {r1}");  // 3 r 2

// C# 11+ generic overload also works with long, nint, etc.
(long q2, long r2) = Math.DivRem(100L, 7L);
Console.WriteLine($"100 / 7 = {q2} r {r2}");  // 14 r 2`,
    explanation: "`Math.DivRem` returns both the integer quotient and remainder in a single hardware operation (one `div` instruction on x86) — faster than computing them separately.",
  },
  {
    id: "cs-b18-b1-string-concat-join",
    language: "csharp",
    title: "String.Join vs String.Concat for combining strings",
    tag: "snippet",
    code: `string[] parts = { "one", "two", "three" };

// Concat: no separator
string all = string.Concat(parts);       // onetwothree

// Join: with separator
string csv = string.Join(", ", parts);   // one, two, three

// Join with LINQ projection:
var nums = new[] { 1, 2, 3 };
Console.WriteLine(string.Join(" + ", nums));  // 1 + 2 + 3`,
    explanation: "`string.Join(sep, items)` inserts a separator between elements; `string.Concat` appends without separator. Both pre-allocate the exact result size, unlike repeated `+` in a loop.",
  },
  {
    id: "cs-b18-b1-record-equality",
    language: "csharp",
    title: "Record equality is value-based, not reference-based",
    tag: "understanding",
    code: `record Person(string Name, int Age);

var p1 = new Person("Alice", 30);
var p2 = new Person("Alice", 30);
var p3 = p1;

Console.WriteLine(p1 == p2);                  // True  — value equality
Console.WriteLine(ReferenceEquals(p1, p2));   // False — different objects
Console.WriteLine(ReferenceEquals(p1, p3));   // True  — same reference
Console.WriteLine(p1.Equals(p2));             // True`,
    explanation: "Records auto-generate `Equals` and `==` based on all primary constructor properties — two separate instances with the same data are considered equal, unlike classes.",
  },
  {
    id: "cs-b18-b1-nullable-boxing",
    language: "csharp",
    title: "Nullable<T> boxes to null or T, not Nullable<T>",
    tag: "understanding",
    code: `int? a = 42;
int? b = null;

object boxedA = a;   // boxes to int (42), NOT Nullable<int>
object boxedB = b;   // boxes to null reference

Console.WriteLine(boxedA?.GetType());    // System.Int32
Console.WriteLine(boxedB is null);       // True
Console.WriteLine(boxedA is int);        // True
Console.WriteLine(boxedA is int?);       // True (both match)`,
    explanation: "When a non-null `Nullable<T>` is boxed, the runtime stores the underlying `T` value, not a `Nullable<T>`. A null `Nullable<T>` boxes to a null reference.",
  },
  {
    id: "cs-b18-b1-thread-sleep-vs-task-delay",
    language: "csharp",
    title: "Thread.Sleep blocks the thread; Task.Delay yields to the pool",
    tag: "understanding",
    code: `// Thread.Sleep: current thread is blocked — wastes a thread pool thread
async Task Bad()
{
    Thread.Sleep(1000);     // blocks the thread
    await DoWork();
}

// Task.Delay: coroutine suspends, thread is released
async Task Good()
{
    await Task.Delay(1000); // returns thread to pool during wait
    await DoWork();
}`,
    explanation: "`Thread.Sleep` suspends the OS thread, consuming a thread-pool thread for the entire duration; `await Task.Delay` suspends the async state machine without blocking any thread.",
  },
  {
    id: "cs-b18-b1-value-type-array-memory",
    language: "csharp",
    title: "Value type arrays store data inline; reference type arrays store pointers",
    tag: "understanding",
    code: `// int[] — 5 ints stored inline, one contiguous block
int[] ints = new int[5];   // 20 bytes of data + header

// object[] — 5 references (pointers) to heap objects
object[] objs = new object[5];   // pointers only, each element may be null

// struct array: all fields inline, cache-friendly:
struct Vec3 { public float X, Y, Z; }
Vec3[] vecs = new Vec3[100];  // 300 * sizeof(float) = 1200 bytes contiguous`,
    explanation: "Value-type arrays are contiguous blocks of data (great for cache); reference-type arrays hold pointers — iterating over a value-type array has better memory locality.",
  },
  {
    id: "cs-b18-b1-event-vs-delegate-field",
    language: "csharp",
    title: "event keyword restricts delegate access to += and -=",
    tag: "understanding",
    code: `class Button
{
    // delegate field: anyone can reassign or invoke directly
    public Action? Clicked;

    // event: outsiders can only += and -=, not invoke or reassign
    public event Action? Pressed;

    public void Simulate()
    {
        Clicked?.Invoke();
        Pressed?.Invoke();
    }
}

var btn = new Button();
btn.Clicked = () => Console.WriteLine("clicked");  // assignment OK
btn.Pressed += () => Console.WriteLine("pressed"); // only += / -=`,
    explanation: "`event` wraps a delegate field with an accessor pair, preventing external code from invoking or replacing the delegate — enforcing the publisher/subscriber contract.",
  },
  {
    id: "cs-b18-b1-using-var-lifetime",
    language: "csharp",
    title: "using var — IDisposable lifetime tied to enclosing scope",
    tag: "understanding",
    code: `// C# 8+ using declaration: disposes at end of enclosing block
void ProcessFile(string path)
{
    using var reader = new StreamReader(path);
    using var writer = new StreamWriter(path + ".out");

    string? line;
    while ((line = reader.ReadLine()) is not null)
        writer.WriteLine(line.ToUpper());
} // reader and writer disposed here, in reverse order`,
    explanation: "`using var` (C# 8+) disposes the object when the enclosing scope exits — same semantics as `using(var x = ...){}` but without the extra indentation level.",
  },
  {
    id: "cs-b18-b1-covariance-ienumerable",
    language: "csharp",
    title: "IEnumerable<T> is covariant — Derived usable as Base",
    tag: "understanding",
    code: `class Animal { }
class Dog : Animal { }

IEnumerable<Dog>    dogs    = new List<Dog> { new Dog() };
IEnumerable<Animal> animals = dogs;   // covariant assignment — OK

// List<Dog> is NOT covariant — would allow adding Animals:
// List<Animal> badList = new List<Dog>();  // compile error`,
    explanation: "`IEnumerable<out T>` is covariant (marked with `out`) because it only produces values; `IList<T>` is invariant because it also accepts values, which would break type safety.",
  },
  {
    id: "cs-b18-b1-static-field-init-order",
    language: "csharp",
    title: "Static field initializers run in textual order, before the static constructor",
    tag: "understanding",
    code: `class Ordering
{
    public static int A = Compute("A");  // runs first
    public static int B = Compute("B");  // runs second

    static Ordering()
    {
        Console.WriteLine("static ctor");  // runs last
    }

    static int Compute(string label)
    {
        Console.WriteLine(label);
        return 0;
    }
}

var _ = Ordering.A;
// Output: A  B  static ctor`,
    explanation: "Static field initializers run in declaration order before the static constructor; the static constructor then runs once, the first time the class is accessed.",
  },
  {
    id: "cs-b18-b1-referencequals-vs-equals",
    language: "csharp",
    title: "Object.ReferenceEquals vs == vs .Equals()",
    tag: "understanding",
    code: `string a = new string("hello".ToCharArray());
string b = new string("hello".ToCharArray());

Console.WriteLine(ReferenceEquals(a, b));  // False — different objects
Console.WriteLine(a == b);                 // True  — value equality (overloaded)
Console.WriteLine(a.Equals(b));            // True  — value equality

// For classes without == override, == falls back to reference equality:
object x = new object(), y = new object();
Console.WriteLine(x == y);                 // False`,
    explanation: "`ReferenceEquals` always checks object identity; `==` is overloaded for `string` and numeric types to compare values; `.Equals` follows the virtual dispatch defined by the type.",
  },
  {
    id: "cs-b18-b1-checked-overflow",
    language: "csharp",
    title: "checked block throws on integer overflow",
    tag: "understanding",
    code: `int max = int.MaxValue;  // 2,147,483,647

// Unchecked (default): wraps silently
int wrapped = max + 1;
Console.WriteLine(wrapped);  // -2,147,483,648

// checked: throws OverflowException
try
{
    checked
    {
        int overflow = max + 1;
    }
}
catch (OverflowException)
{
    Console.WriteLine("overflow caught!");
}`,
    explanation: "By default, integer arithmetic overflows silently in C#; wrapping code in a `checked` block (or enabling project-wide checking) makes it throw `OverflowException` instead.",
  },
  {
    id: "cs-b18-b1-foreach-ienumerable-reevaluated",
    language: "csharp",
    title: "foreach re-evaluates the enumerable each time",
    tag: "understanding",
    code: `using System.Linq;

int callCount = 0;
IEnumerable<int> lazy = Enumerable.Range(1, 3).Select(x =>
{
    callCount++;
    return x * 2;
});

// First iteration: calls the projection 3 times
foreach (var item in lazy) { }
Console.WriteLine(callCount);  // 3

// Second iteration: calls the projection 3 more times
foreach (var item in lazy) { }
Console.WriteLine(callCount);  // 6 — work done twice!`,
    explanation: "LINQ queries are deferred; each `foreach` restarts the pipeline from scratch. Call `.ToList()` once to materialise and cache the results if you iterate more than once.",
  },
  {
    id: "cs-b18-b1-struct-copy-semantics",
    language: "csharp",
    title: "Struct assignment copies the entire value",
    tag: "understanding",
    code: `struct Counter
{
    public int Value;
    public void Increment() => Value++;
}

Counter a = new Counter { Value = 0 };
Counter b = a;  // copy — b is independent

b.Increment();
Console.WriteLine(a.Value);  // 0 — a unchanged
Console.WriteLine(b.Value);  // 1

// Arrays: each slot holds its own copy
Counter[] arr = new Counter[2];
arr[0].Increment();   // modifies the slot in-place
Console.WriteLine(arr[0].Value);  // 1`,
    explanation: "Structs are value types — assignment copies all fields. Passing a struct to a method or assigning to another variable makes an independent copy, unlike classes.",
  },
  {
    id: "cs-b18-b1-immutablehashset",
    language: "csharp",
    title: "ImmutableHashSet for thread-safe read-only sets",
    tag: "structures",
    code: `using System.Collections.Immutable;

var set1 = ImmutableHashSet<string>.Empty
    .Add("apple")
    .Add("banana")
    .Add("cherry");

var set2 = set1.Add("date").Remove("apple");

Console.WriteLine(string.Join(", ", set1));  // apple, banana, cherry
Console.WriteLine(string.Join(", ", set2));  // banana, cherry, date

// set1 is unchanged — structural sharing under the hood
Console.WriteLine(set1.Count);  // 3`,
    explanation: "`ImmutableHashSet<T>` operations return a new set with the change applied; the original is unchanged. Structural sharing makes this efficient for most operations.",
  },
  {
    id: "cs-b18-b1-concurrentbag",
    language: "csharp",
    title: "ConcurrentBag<T> for unordered thread-safe collection",
    tag: "structures",
    code: `using System.Collections.Concurrent;

var bag = new ConcurrentBag<int>();

Parallel.For(0, 100, i => bag.Add(i));

Console.WriteLine(bag.Count);       // 100
Console.WriteLine(bag.TryTake(out int item));  // True

// No guaranteed order — bag is unordered
// Preferred over List<T> + lock for concurrent writes`,
    explanation: "`ConcurrentBag<T>` is thread-safe and uses per-thread local storage to reduce contention; it's unordered and best when order doesn't matter (e.g., collecting parallel results).",
  },
  {
    id: "cs-b18-b1-bitarray",
    language: "csharp",
    title: "BitArray for memory-efficient packed booleans",
    tag: "structures",
    code: `using System.Collections;

var bits = new BitArray(8, false);  // 8 bits, all false
bits[0] = true;
bits[3] = true;
bits[7] = true;

Console.WriteLine(bits.Count);  // 8

// Bitwise operations:
var other = new BitArray(8, true);
BitArray anded = (BitArray)bits.Clone();
anded.And(other);

for (int i = 0; i < anded.Count; i++)
    Console.Write(anded[i] ? "1" : "0");  // 10010001`,
    explanation: "`BitArray` packs 8 booleans per byte (vs 1 byte each in `bool[]`) and supports bitwise AND/OR/XOR/NOT — ideal for flag sets, Bloom filters, or bit masks.",
  },
  {
    id: "cs-b18-b1-sorteddict-vs-sortedlist",
    language: "csharp",
    title: "SortedDictionary vs SortedList — tree vs sorted array",
    tag: "structures",
    code: `using System.Collections.Generic;

// SortedDictionary: Red-Black tree — O(log n) for all ops
var sd = new SortedDictionary<int, string> { [3]="c", [1]="a", [2]="b" };
Console.WriteLine(string.Join(", ", sd.Keys));   // 1, 2, 3

// SortedList: sorted array — O(log n) lookup, O(n) insert
var sl = new SortedList<int, string>  { [3]="c", [1]="a", [2]="b" };
Console.WriteLine(sl.IndexOfKey(2));   // 1 — only SortedList has this`,
    explanation: "`SortedDictionary` uses a tree — good for frequent inserts/deletes; `SortedList` uses a sorted array — good for mostly-read scenarios with random access by position.",
  },
  {
    id: "cs-b18-b1-linkedlist-insert",
    language: "csharp",
    title: "LinkedList<T> for O(1) insertion next to a node",
    tag: "structures",
    code: `var list = new LinkedList<string>(new[] { "a", "b", "d" });
LinkedListNode<string>? bNode = list.Find("b");

// Insert "c" after "b" — O(1)
list.AddAfter(bNode!, "c");

Console.WriteLine(string.Join(" -> ", list));  // a -> b -> c -> d

// List<T> equivalent would be O(n) for insertion in the middle`,
    explanation: "`LinkedList<T>` supports O(1) insertion and removal when you hold a node reference; `List<T>` is O(n) for mid-list changes but O(1) for indexed access.",
  },
  {
    id: "cs-b18-b1-readonly-collection-wrapper",
    language: "csharp",
    title: "ReadOnlyCollection<T> wraps a list without copying",
    tag: "structures",
    code: `using System.Collections.ObjectModel;

var mutable = new List<int> { 1, 2, 3 };
ReadOnlyCollection<int> readOnly = mutable.AsReadOnly();

Console.WriteLine(readOnly[1]);     // 2
// readOnly.Add(4);                 // compile error — no Add method

mutable.Add(4);
Console.WriteLine(readOnly.Count);  // 4 — live view of the list`,
    explanation: "`AsReadOnly()` wraps the original `List<T>` without copying — it's a thin proxy that prevents mutation via the wrapper but does reflect changes to the underlying list.",
  },
  {
    id: "cs-b18-b1-observable-collection",
    language: "csharp",
    title: "ObservableCollection<T> raises events on mutation",
    tag: "structures",
    code: `using System.Collections.ObjectModel;
using System.Collections.Specialized;

var col = new ObservableCollection<string>();
col.CollectionChanged += (s, e) =>
{
    Console.WriteLine($"{e.Action}: {e.NewItems?[0]}");
};

col.Add("hello");    // Add: hello
col.Add("world");    // Add: world
col.Remove("hello"); // Remove: hello`,
    explanation: "`ObservableCollection<T>` raises `CollectionChanged` on every add, remove, or replace — designed for data-binding in WPF/MAUI so the UI updates automatically.",
  },
  {
    id: "cs-b18-b1-concurrentstack",
    language: "csharp",
    title: "ConcurrentStack<T> for lock-free concurrent LIFO",
    tag: "structures",
    code: `using System.Collections.Concurrent;

var stack = new ConcurrentStack<int>();

// Multiple threads can push/pop safely:
Parallel.For(0, 10, i => stack.Push(i));

int item;
while (stack.TryPop(out item))
    Console.Write(item + " ");  // unordered output
Console.WriteLine();

// TryPopRange for batched dequeue:
int[] buffer = new int[5];
int count = stack.TryPopRange(buffer);`,
    explanation: "`ConcurrentStack<T>` uses lock-free compare-and-swap for all operations; `TryPopRange` removes multiple items atomically, reducing CAS retry loops.",
  },
  {
    id: "cs-b18-b1-async-void-swallows",
    language: "csharp",
    title: "async void exceptions crash the process — use async Task",
    tag: "caveats",
    code: `// DANGEROUS: exception has nowhere to go
async void FireAndForget()
{
    await Task.Delay(100);
    throw new InvalidOperationException("oops");
    // This crashes the entire process — cannot be caught
}

// SAFE: return Task so callers can await and catch
async Task SafeOperation()
{
    await Task.Delay(100);
    throw new InvalidOperationException("oops");
}

// Caller can now handle it:
try { await SafeOperation(); }
catch (InvalidOperationException ex) { Console.WriteLine(ex.Message); }`,
    explanation: "`async void` methods post exceptions to `SynchronizationContext` (or crash the process); always return `Task` or `Task<T>` unless implementing an event handler.",
  },
  {
    id: "cs-b18-b1-enum-flags-attribute",
    language: "csharp",
    title: "[Flags] enum for bitfield permissions",
    tag: "caveats",
    code: `[Flags]
enum Permission
{
    None    = 0,
    Read    = 1,
    Write   = 2,
    Execute = 4,
    All     = Read | Write | Execute
}

var perms = Permission.Read | Permission.Write;
Console.WriteLine(perms);                          // Read, Write
Console.WriteLine(perms.HasFlag(Permission.Write)); // True
Console.WriteLine(perms.HasFlag(Permission.Execute)); // False

// Without [Flags], ToString() shows the numeric value`,
    explanation: "`[Flags]` makes `ToString()` print the combined member names and enables `HasFlag` — always assign powers-of-two values and add a `None = 0` member.",
  },
  {
    id: "cs-b18-b1-ienumerable-multiple-enumeration",
    language: "csharp",
    title: "Multiple enumeration of IEnumerable<T> repeats work",
    tag: "caveats",
    code: `using System.Linq;

IEnumerable<int> expensive = Enumerable.Range(1, 5)
    .Select(x => { Console.WriteLine($"computing {x}"); return x * x; });

int count = expensive.Count();  // executes 5 times
int sum   = expensive.Sum();    // executes 5 more times!
// Total: 10 evaluations

// Fix: materialise once
var list = expensive.ToList();  // 5 evaluations
int c2   = list.Count;          // 0 evaluations
int s2   = list.Sum();          // 0 evaluations`,
    explanation: "Deferred LINQ queries re-run the entire pipeline on every enumeration; calling `.ToList()` or `.ToArray()` once materialises the results and avoids redundant computation.",
  },
  {
    id: "cs-b18-b1-string-comparison-culture",
    language: "csharp",
    title: "String comparison is culture-sensitive by default",
    tag: "caveats",
    code: `string a = "resume";
string b = "résumé";

// Ordinal: byte-by-byte, predictable
bool ordinal = string.Equals(a, b, StringComparison.Ordinal);
Console.WriteLine(ordinal);   // False

// CurrentCulture: may consider accents as equal in some locales
bool culture = string.Compare(a, b, StringComparison.CurrentCultureIgnoreCase) == 0;
Console.WriteLine(culture);   // varies by locale

// For sorting user-visible text: CurrentCulture
// For IDs, keys, file paths: Ordinal`,
    explanation: "Always pass `StringComparison` explicitly; `Ordinal` is fast and consistent across platforms while `CurrentCulture` follows locale rules — mixing them silently causes bugs.",
  },
  {
    id: "cs-b18-b1-task-result-deadlock",
    language: "csharp",
    title: "Task.Result and .Wait() can deadlock on UI/ASP.NET threads",
    tag: "caveats",
    code: `// DANGEROUS in ASP.NET or WPF — deadlock if context captured
string content = FetchAsync().Result;  // blocks calling thread
//   FetchAsync tries to resume on the same captured context
//   but that context is blocked waiting for .Result → deadlock

// SAFE option 1: await all the way up
string content2 = await FetchAsync();

// SAFE option 2: disable context capture
string content3 = await FetchAsync().ConfigureAwait(false);

async Task<string> FetchAsync() => await Task.FromResult("data");`,
    explanation: "`.Result` blocks the calling thread; if that thread owns the `SynchronizationContext` the async continuation needs, the task can never complete — classic deadlock pattern in UI and classic ASP.NET.",
  },
  {
    id: "cs-b18-b1-static-constructor-throws",
    language: "csharp",
    title: "A throwing static constructor permanently disables the type",
    tag: "caveats",
    code: `class Broken
{
    static Broken()
    {
        throw new InvalidOperationException("init failed");
    }

    public static int Value = 42;
}

try { _ = Broken.Value; }
catch (TypeInitializationException e)
    { Console.WriteLine(e.InnerException?.Message); }

// Every subsequent access also throws TypeInitializationException:
try { _ = Broken.Value; }
catch (TypeInitializationException)
    { Console.WriteLine("still broken"); }`,
    explanation: "If a static constructor throws, the CLR marks the type as failed and every subsequent access wraps the original exception in `TypeInitializationException` — the type is permanently broken for the process.",
  },
  {
    id: "cs-b18-b1-dictionary-add-duplicate",
    language: "csharp",
    title: "Dictionary.Add throws on duplicate; indexer silently overwrites",
    tag: "caveats",
    code: `var d = new Dictionary<string, int>();

d.Add("x", 1);
// d.Add("x", 2);  // ArgumentException — key already exists

d["x"] = 2;  // OK — overwrites silently
Console.WriteLine(d["x"]);  // 2

// Use TryAdd for safe conditional insert:
bool added = d.TryAdd("y", 99);
Console.WriteLine(added);  // True
bool notAdded = d.TryAdd("x", 0);
Console.WriteLine(notAdded);  // False — existing key`,
    explanation: "`Dictionary.Add` enforces uniqueness; the indexer (`d[key] = value`) silently replaces existing entries. Use `TryAdd` to insert only when the key is absent.",
  },
  {
    id: "cs-b18-b1-captured-async-lambda",
    language: "csharp",
    title: "Captured variables in async lambdas share state",
    tag: "caveats",
    code: `var tasks = new List<Task>();
for (int i = 0; i < 5; i++)
{
    // BROKEN: all tasks capture the same 'i' variable
    tasks.Add(Task.Run(async () =>
    {
        await Task.Delay(10);
        Console.WriteLine(i);  // may print 5,5,5,5,5
    }));
}

// FIX: copy i into a local variable
for (int i = 0; i < 5; i++)
{
    int copy = i;
    tasks.Add(Task.Run(async () =>
    {
        await Task.Delay(10);
        Console.WriteLine(copy);  // 0,1,2,3,4
    }));
}`,
    explanation: "Async lambdas close over variables, not values; by the time the lambda runs, a loop variable may have advanced. Copy it to a local inside the loop to capture the current value.",
  },
  {
    id: "cs-b18-b1-generic-covariance",
    language: "csharp",
    title: "Covariant type parameters — IEnumerable<out T>",
    tag: "types",
    code: `IEnumerable<string>  strings  = new List<string> { "hello" };
IEnumerable<object>  objects  = strings;   // covariance — OK

// Why is this safe?  IEnumerable only PRODUCES T values,
// never consumes them, so assigning to a wider type is safe.

IReadOnlyList<string> rls = new List<string> { "hi" };
IReadOnlyList<object> rlo = rls;   // also covariant (out T)

// Mutable IList<T> is INVARIANT:
// IList<object> bad = new List<string>();  // compile error`,
    explanation: "A type parameter marked `out T` is covariant — interfaces that only produce `T` (like `IEnumerable<T>`) can be safely widened to `IEnumerable<Base>`.",
  },
  {
    id: "cs-b18-b1-contravariance-action",
    language: "csharp",
    title: "Contravariant type parameters — Action<in T>",
    tag: "types",
    code: `Action<object> handleObject = obj => Console.WriteLine(obj);

// Contravariance: Action<object> can be used as Action<string>
// because a handler that accepts any object also handles strings
Action<string> handleString = handleObject;

handleString("hello");  // prints: hello

// IComparer<T> is also contravariant:
IComparer<object> objCmp = Comparer<object>.Default;
IComparer<string> strCmp = objCmp;   // contra-covariant OK`,
    explanation: "A type parameter marked `in T` is contravariant — interfaces that only consume `T` (like `Action<T>`) can be narrowed: `Action<Base>` is usable as `Action<Derived>`.",
  },
  {
    id: "cs-b18-b1-global-using",
    language: "csharp",
    title: "global using directives remove per-file boilerplate",
    tag: "types",
    code: `// GlobalUsings.cs (one file in the project)
global using System;
global using System.Collections.Generic;
global using System.Linq;
global using System.Threading.Tasks;

// Now every other file can use these without an explicit using:
// Program.cs
var list = new List<int> { 1, 2, 3 };
Console.WriteLine(list.Sum());  // no 'using System.Linq' needed`,
    explanation: "`global using` (.NET 6+) applies a using directive project-wide; the SDK adds implicit global usings for common namespaces unless `ImplicitUsings` is disabled.",
  },
  {
    id: "cs-b18-b1-generic-math",
    language: "csharp",
    title: "Generic math with INumber<T> (.NET 7+)",
    tag: "types",
    code: `using System.Numerics;

T Sum<T>(IEnumerable<T> items) where T : INumber<T>
{
    T total = T.Zero;
    foreach (var item in items)
        total += item;
    return total;
}

Console.WriteLine(Sum(new[] { 1, 2, 3 }));         // 6
Console.WriteLine(Sum(new[] { 1.1, 2.2, 3.3 }));   // 6.6
Console.WriteLine(Sum(new[] { 1m, 2m, 3m }));       // 6`,
    explanation: "`INumber<T>` (.NET 7+) is a static abstract interface for numeric types; generic methods constrained to it can add, compare, and convert numbers without boxing.",
  },
  {
    id: "cs-b18-b1-primary-constructors",
    language: "csharp",
    title: "Primary constructors for classes (C# 12)",
    tag: "types",
    code: `// C# 12: primary constructor parameters are in scope everywhere in the class
class Logger(string prefix)
{
    // 'prefix' is captured as an implicit field
    public void Log(string msg) => Console.WriteLine($"[{prefix}] {msg}");
}

class Service(Logger logger, string name)
{
    public void Run() => logger.Log($"{name} running");
}

var svc = new Service(new Logger("INFO"), "Worker");
svc.Run();  // [INFO] Worker running`,
    explanation: "C# 12 primary constructors (not just for records) capture parameters in scope throughout the class body — less boilerplate than explicit fields and assignments.",
  },
  {
    id: "cs-b18-b1-nullable-ref-annotations",
    language: "csharp",
    title: "Nullable reference type annotations and flow analysis",
    tag: "types",
    code: `#nullable enable

string  nonNull = "hello";     // cannot be null
string? canBeNull = null;      // explicitly nullable

// Compiler warns on:
// string s = canBeNull;       // warn: dereference without null check
// int len = canBeNull.Length; // warn: possible null dereference

if (canBeNull is not null)
{
    int len = canBeNull.Length; // safe — flow analysis narrows the type
}

// Null-forgiving operator (!) suppresses the warning:
int len2 = canBeNull!.Length;  // you assert it's not null`,
    explanation: "With `#nullable enable`, the compiler tracks null-state through flow analysis and warns on potential `NullReferenceException`; the `!` operator overrides the warning when you have out-of-band knowledge.",
  },
  {
    id: "cs-b18-b1-raw-string-literals",
    language: "csharp",
    title: "Raw string literals avoid backslash escaping (C# 11)",
    tag: "types",
    code: `// Triple-quoted raw string — no escape sequences needed
string json = """
    {
        "name": "Alice",
        "path": "C:\\Users\\Alice"
    }
    """;

Console.WriteLine(json);

// Leading whitespace is stripped to the level of the closing """
// Use more quotes to embed triple-quotes inside:
string odd = """"  contains """ inside  """";`,
    explanation: "Raw string literals (`\"\"\"...\"\"\"`), introduced in C# 11, allow any character including backslashes and quotes without escaping — ideal for JSON, XML, or regex patterns.",
  },
  {
    id: "cs-b18-b1-list-pattern",
    language: "csharp",
    title: "List patterns for matching sequence structure (C# 11)",
    tag: "types",
    code: `int[] arr = { 1, 2, 3, 4, 5 };

string result = arr switch
{
    []                      => "empty",
    [var single]            => $"one: {single}",
    [var first, .., var last] => $"first={first} last={last}",
};

Console.WriteLine(result);  // first=1 last=5

// Also works in conditions:
if (arr is [1, 2, ..])
    Console.WriteLine("starts with 1, 2");`,
    explanation: "List patterns match the structure of arrays and lists; `..` is a slice pattern (matches any number of elements), and `var x` captures individual elements.",
  },
  {
    id: "cs-b18-b1-required-members",
    language: "csharp",
    title: "required property enforces object initializer assignment (C# 11)",
    tag: "types",
    code: `class Config
{
    public required string Host { get; init; }
    public required int    Port { get; init; }
    public string          Path { get; init; } = "/";
}

// Must set required members or get a compile error:
var cfg = new Config { Host = "localhost", Port = 8080 };
Console.WriteLine(cfg.Host);   // localhost
Console.WriteLine(cfg.Path);   // /

// var bad = new Config();  // error: required members not set`,
    explanation: "`required` (.NET 7) forces callers to provide the property via object initializer syntax — stronger than nullable warnings because it's a compile error, not a warning.",
  },
  {
    id: "cs-b18-b1-type-alias",
    language: "csharp",
    title: "Type aliases with using for complex type names",
    tag: "types",
    code: `// C# 12 allows aliasing any type, including tuples and arrays
using Point     = (double X, double Y);
using Matrix3x3 = double[,];
using Callback  = System.Func<string, System.Threading.Tasks.Task>;

Point origin = (0.0, 0.0);
Console.WriteLine(origin.X);  // 0

// Pre-C# 12, only non-generic types could be aliased this way`,
    explanation: "C# 12 expands `using T = ...` to cover tuples, arrays, and other constructed types — reducing noise in signatures that repeatedly use complex generic types.",
  },
  {
    id: "cs-b18-b1-ienumerable-vs-iqueryable",
    language: "csharp",
    title: "IEnumerable<T> vs IQueryable<T> — in-memory vs translated queries",
    tag: "families",
    code: `using System.Linq;

// IEnumerable: runs in .NET process
IEnumerable<int> local = new[] { 1, 2, 3, 4, 5 };
var evens = local.Where(x => x % 2 == 0);   // lambda runs in C#

// IQueryable: expression tree translated to SQL (via EF Core etc.)
// IQueryable<Product> dbProducts = db.Products;
// var cheap = dbProducts.Where(p => p.Price < 10);
// This generates: SELECT * FROM Products WHERE Price < 10`,
    explanation: "`IEnumerable` executes predicates in-process; `IQueryable` translates the expression tree to a query language (SQL, OData, etc.) — confusing them leads to client-side filtering of entire tables.",
  },
  {
    id: "cs-b18-b1-task-vs-valuetask",
    language: "csharp",
    title: "Task<T> vs ValueTask<T> — when to use each",
    tag: "families",
    code: `// Task<T>: heap-allocated, always safe to await multiple times
async Task<int> GetCount() => 42;

// ValueTask<T>: avoids allocation when result is often synchronous
async ValueTask<int> FastGet(bool cached, int value)
{
    if (cached) return value;      // no heap allocation for this path
    await Task.Delay(10);
    return value * 2;
}

// Rules: return ValueTask only from hot-path methods;
// never await a ValueTask more than once`,
    explanation: "`ValueTask<T>` avoids the `Task` allocation when a method commonly returns synchronously (cache hit); use `Task<T>` otherwise — `ValueTask` can only be awaited once.",
  },
  {
    id: "cs-b18-b1-thread-vs-task",
    language: "csharp",
    title: "Thread vs Task vs ThreadPool — which to use",
    tag: "families",
    code: `// Thread: explicit OS thread — use only for long-lived background work
var thread = new Thread(() => Console.WriteLine("thread")) { IsBackground = true };
thread.Start();

// ThreadPool.QueueUserWorkItem: fire-and-forget work item
ThreadPool.QueueUserWorkItem(_ => Console.WriteLine("pooled"));

// Task.Run: preferred for CPU-bound work — wraps ThreadPool
await Task.Run(() => Console.WriteLine("task"));

// async/await: for I/O-bound work — no thread consumed while waiting`,
    explanation: "Prefer `Task.Run` for CPU-bound parallelism and `async/await` for I/O; create explicit `Thread`s only when you need affinity, priority, or a guaranteed dedicated OS thread.",
  },
  {
    id: "cs-b18-b1-mutex-semaphore-monitor",
    language: "csharp",
    title: "Monitor vs SemaphoreSlim vs Mutex — synchronization primitives",
    tag: "families",
    code: `// Monitor (lock): reentrant, fast, single-thread only
lock (_sync)
{
    // critical section
}

// SemaphoreSlim: async-compatible, N concurrent callers
var slim = new SemaphoreSlim(1, 1);
await slim.WaitAsync();
try { /* work */ } finally { slim.Release(); }

// Mutex: kernel object — cross-process locking
using var mutex = new Mutex(false, "Global\\MyApp");
mutex.WaitOne();
try { /* work */ } finally { mutex.ReleaseMutex(); }`,
    explanation: "`lock`/`Monitor` is the fastest but purely in-process; `SemaphoreSlim` supports `async` and counts; `Mutex` is for cross-process synchronization (much slower).",
  },
  {
    id: "cs-b18-b1-stringbuilder-vs-interpolation",
    language: "csharp",
    title: "StringBuilder vs string interpolation in loops",
    tag: "families",
    code: `using System.Text;

// BAD: creates O(n) intermediate strings
string s = "";
for (int i = 0; i < 1000; i++)
    s += i.ToString();  // 1000 allocations

// GOOD: StringBuilder amortises allocations
var sb = new StringBuilder();
for (int i = 0; i < 1000; i++)
    sb.Append(i);
string result = sb.ToString();  // one final allocation

// OK for small, fixed concatenations:
string name = $"Hello, {firstName} {lastName}!";`,
    explanation: "`string += x` allocates a new string every iteration; `StringBuilder` uses an internal buffer that doubles when full — O(n) total vs O(n²) for repeated concatenation.",
  },
  {
    id: "cs-b18-b1-streamreader-vs-readalllines",
    language: "csharp",
    title: "StreamReader vs File.ReadAll* — streaming vs loading all",
    tag: "families",
    code: `// File.ReadAllLines: loads entire file into string[]
string[] lines = File.ReadAllLines("data.txt");
foreach (var line in lines) { /* process */ }

// StreamReader: line by line, constant memory use
using var reader = new StreamReader("data.txt");
string? line;
while ((line = reader.ReadLine()) is not null)
{
    /* process line */
}

// File.ReadLinesAsync: async lazy streaming (.NET 7+)
await foreach (var l in File.ReadLinesAsync("data.txt"))
    Console.WriteLine(l);`,
    explanation: "`File.ReadAllLines` loads everything at once — fine for small files; `StreamReader.ReadLine` or `ReadLinesAsync` stream line-by-line, keeping memory constant for large files.",
  },
  {
    id: "cs-b18-b1-action-func-predicate",
    language: "csharp",
    title: "Action vs Func vs Predicate — delegate family",
    tag: "families",
    code: `// Action: void return, 0–16 parameters
Action<string>        log     = msg => Console.WriteLine(msg);
Action<string, int>   log2    = (msg, n) => Console.WriteLine($"{n}: {msg}");

// Func: non-void return, last type param is return type
Func<int, int, int>   add     = (a, b) => a + b;
Func<string, int>     len     = s => s.Length;

// Predicate<T>: Func<T, bool> shorthand
Predicate<string>     isEmpty = s => s.Length == 0;

Console.WriteLine(add(3, 4));        // 7
Console.WriteLine(isEmpty(""));      // True`,
    explanation: "`Action` is a void delegate; `Func<..., TResult>` has a return type; `Predicate<T>` is exactly `Func<T, bool>` — they're all syntactic sugar for different delegate signatures.",
  },
  {
    id: "cs-b18-b1-list-vs-array-vs-ireadonly",
    language: "csharp",
    title: "List<T> vs T[] vs IReadOnlyList<T> — which to expose",
    tag: "families",
    code: `// T[]: fixed size, fast indexing, stack-allocatable
int[] arr = { 1, 2, 3 };

// List<T>: dynamic size, good general purpose
var list = new List<int> { 1, 2, 3 };

// IReadOnlyList<T>: expose as read-only to callers
IReadOnlyList<int> exposed = list;

// Return types: expose the narrowest useful interface
// Params: accept the widest interface (IEnumerable<T>)`,
    explanation: "Expose `IReadOnlyList<T>` or `IReadOnlyCollection<T>` from APIs to prevent mutation; accept `IEnumerable<T>` in parameters for maximum caller flexibility.",
  },
  {
    id: "cs-b18-b1-datetime-offset-only",
    language: "csharp",
    title: "DateTime vs DateTimeOffset vs DateOnly — choosing the right type",
    tag: "families",
    code: `// DateTime: date+time, optional Kind (Utc/Local/Unspecified) — ambiguous
DateTime dt = DateTime.UtcNow;

// DateTimeOffset: date+time + UTC offset — unambiguous, prefer for storage
DateTimeOffset dto = DateTimeOffset.UtcNow;

// DateOnly: no time component — for birthdays, holidays, schedules
DateOnly date = DateOnly.FromDateTime(DateTime.Today);

// Conversions:
DateTimeOffset from = new DateTimeOffset(dt, TimeSpan.Zero);`,
    explanation: "`DateTimeOffset` stores the UTC offset explicitly — use it for logs, APIs, and DB storage; `DateOnly` is for calendar-only values; avoid `DateTime` with `Kind = Unspecified`.",
  },
  {
    id: "cs-b18-b1-httpclient-factory",
    language: "csharp",
    title: "IHttpClientFactory vs new HttpClient — lifecycle management",
    tag: "families",
    code: `// WRONG: HttpClient is IDisposable but NOT per-request
// Disposing too early: socket exhaustion
// Keeping one forever: DNS changes ignored

// CORRECT with IHttpClientFactory (DI):
// services.AddHttpClient("myApi", c => c.BaseAddress = ...);

// In controller/service:
// var client = _factory.CreateClient("myApi");
// var response = await client.GetAsync("/api/data");

// Each factory call gets a properly-managed HttpClient
// with handler pool rotation to respect DNS TTL`,
    explanation: "`IHttpClientFactory` manages `HttpMessageHandler` pools and rotates them to respect DNS TTL — avoids both socket exhaustion (from disposing too often) and stale DNS (from never rotating).",
  },
  {
    id: "cs-b18-b1-sealed-performance",
    language: "csharp",
    title: "sealed class enables devirtualisation by the JIT",
    tag: "classes",
    code: `// JIT can inline virtual calls when target type is sealed
sealed class FastCalculator
{
    public int Add(int a, int b) => a + b;  // devirtualised
}

// Non-sealed: JIT must emit an indirect call (vtable lookup)
class SlowCalculator
{
    public virtual int Add(int a, int b) => a + b;
}

// Sealed records also benefit:
sealed record Point(int X, int Y);`,
    explanation: "`sealed` prevents inheritance, letting the JIT skip the vtable dispatch and inline virtual calls — a free performance win for types that should not be extended.",
  },
  {
    id: "cs-b18-b1-abstract-template-method",
    language: "csharp",
    title: "Template method pattern with abstract class",
    tag: "classes",
    code: `abstract class Report
{
    // Template method — defines the algorithm skeleton
    public string Generate()
    {
        var header  = BuildHeader();
        var body    = BuildBody();
        var footer  = BuildFooter();
        return $"{header}\\n{body}\\n{footer}";
    }

    protected abstract string BuildHeader();
    protected abstract string BuildBody();
    protected virtual  string BuildFooter() => "--- end ---";
}

class HtmlReport : Report
{
    protected override string BuildHeader() => "<h1>Report</h1>";
    protected override string BuildBody()   => "<p>Content</p>";
}`,
    explanation: "The template method pattern defines a fixed algorithm in a base method and delegates the variable parts to abstract (required) or virtual (optional) overrides in subclasses.",
  },
  {
    id: "cs-b18-b1-interface-abstract-layering",
    language: "csharp",
    title: "Interface + abstract class for partial implementation",
    tag: "classes",
    code: `interface ISerializer
{
    string Serialize(object obj);
    T Deserialize<T>(string data);
}

abstract class JsonSerializerBase : ISerializer
{
    // Shared implementation
    public string Serialize(object obj) =>
        System.Text.Json.JsonSerializer.Serialize(obj);

    // Still abstract — subclasses must provide deserialization
    public abstract T Deserialize<T>(string data);
}

class StrictJsonSerializer : JsonSerializerBase
{
    public override T Deserialize<T>(string data) =>
        System.Text.Json.JsonSerializer.Deserialize<T>(data)!;
}`,
    explanation: "Layering an abstract class over an interface lets you share common implementations while still forcing subclasses to provide the remaining parts — a bridge between total flexibility and total reuse.",
  },
  {
    id: "cs-b18-b1-init-only-immutable",
    language: "csharp",
    title: "init-only setters for post-construction immutability",
    tag: "classes",
    code: `class Order
{
    public int    Id       { get; init; }
    public string Customer { get; init; } = "";
    public decimal Total   { get; init; }
}

// Set during object initializer:
var order = new Order { Id = 1, Customer = "Alice", Total = 99.99m };

// Read-only after construction:
Console.WriteLine(order.Id);        // 1
// order.Id = 2;                    // compile error

// But with-expression still works for records, not plain classes:
// var updated = order with { Total = 150m };  // only for records`,
    explanation: "`init` setters allow assignment only in object initializers or the constructor; outside of those contexts the property is effectively read-only without being `readonly`.",
  },
  {
    id: "cs-b18-b1-nested-class-private-access",
    language: "csharp",
    title: "Nested class can access outer class private members",
    tag: "classes",
    code: `class Outer
{
    private int _secret = 42;

    class Inner
    {
        // Inner can access Outer's private members via an instance
        public int GetSecret(Outer outer) => outer._secret;
    }

    public static int ReadSecret()
    {
        var o = new Outer();
        return new Inner().GetSecret(o);
    }
}

Console.WriteLine(Outer.ReadSecret());  // 42`,
    explanation: "A nested class is a full member of the enclosing class and can access its private fields and methods — useful for iterators, builders, and implementation details that shouldn't be public.",
  },
  {
    id: "cs-b18-b1-explicit-interface-impl",
    language: "csharp",
    title: "Explicit interface implementation hides members from direct access",
    tag: "classes",
    code: `interface ILogger { void Log(string msg); }
interface IAuditor { void Log(string entry); }

class Service : ILogger, IAuditor
{
    // Explicit impl — only visible through the interface type
    void ILogger.Log(string msg)   => Console.WriteLine($"LOG: {msg}");
    void IAuditor.Log(string entry) => Console.WriteLine($"AUDIT: {entry}");
}

var svc = new Service();
// svc.Log("x");             // compile error — ambiguous
((ILogger)svc).Log("x");    // LOG: x
((IAuditor)svc).Log("x");   // AUDIT: x`,
    explanation: "Explicit interface implementations resolve ambiguity when two interfaces declare the same method name, and hide the method from direct object access — forcing callers to use the interface type.",
  },
  {
    id: "cs-b18-b1-operator-overload-custom",
    language: "csharp",
    title: "Operator overloading for custom value types",
    tag: "classes",
    code: `readonly struct Money(decimal Amount, string Currency)
{
    public static Money operator +(Money a, Money b)
    {
        if (a.Currency != b.Currency)
            throw new InvalidOperationException("Currency mismatch");
        return new Money(a.Amount + b.Amount, a.Currency);
    }

    public static bool operator >(Money a, Money b)  => a.Amount > b.Amount;
    public static bool operator <(Money a, Money b)  => a.Amount < b.Amount;

    public override string ToString() => $"{Amount:F2} {Currency}";
}

var total = new Money(10m, "USD") + new Money(5m, "USD");
Console.WriteLine(total);  // 15.00 USD`,
    explanation: "Operator overloading makes domain types like `Money`, `Vector`, or `Matrix` behave naturally in arithmetic expressions — if and only if the semantics are clear and intuitive.",
  },
  {
    id: "cs-b18-b1-implicit-explicit-operator",
    language: "csharp",
    title: "implicit vs explicit conversion operators",
    tag: "classes",
    code: `readonly struct Celsius(double Value)
{
    // implicit: safe widening — no data loss
    public static implicit operator double(Celsius c) => c.Value;

    // explicit: lossy or surprising — require a cast
    public static explicit operator Fahrenheit(Celsius c) =>
        new Fahrenheit(c.Value * 9 / 5 + 32);
}

readonly struct Fahrenheit(double Value);

Celsius  c = new Celsius(100);
double   d = c;                     // implicit — no cast needed
Fahrenheit f = (Fahrenheit)c;       // explicit cast required
Console.WriteLine(d);   // 100`,
    explanation: "Use `implicit` for conversions that are always safe (no precision loss, no exceptions); use `explicit` for conversions that can lose information or might surprise the caller.",
  },
  {
    id: "cs-b18-b1-property-validation",
    language: "csharp",
    title: "Property setters for validation on assignment",
    tag: "classes",
    code: `class Temperature
{
    private double _celsius;

    public double Celsius
    {
        get => _celsius;
        set
        {
            if (value < -273.15)
                throw new ArgumentOutOfRangeException(nameof(value),
                    "Temperature below absolute zero");
            _celsius = value;
        }
    }

    public double Fahrenheit => Celsius * 9 / 5 + 32;
}

var t = new Temperature { Celsius = 100 };
Console.WriteLine(t.Fahrenheit);  // 212`,
    explanation: "Property setters validate on every assignment — unlike constructor-only validation, they protect against invalid mutations after construction. The getter can expose derived values.",
  },
  {
    id: "cs-b18-b1-factory-method",
    language: "csharp",
    title: "Factory method pattern for controlled object creation",
    tag: "classes",
    code: `abstract class Connection
{
    protected Connection() { }

    // Factory method
    public static Connection Create(string type) => type switch
    {
        "sql"    => new SqlConnection(),
        "mongo"  => new MongoConnection(),
        _ => throw new ArgumentException($"Unknown type: {type}")
    };

    public abstract void Open();
}

class SqlConnection   : Connection { public override void Open() => Console.WriteLine("SQL open"); }
class MongoConnection : Connection { public override void Open() => Console.WriteLine("Mongo open"); }

Connection.Create("sql").Open();   // SQL open`,
    explanation: "A factory method centralises creation logic, decoupling callers from concrete types — callers ask for a `Connection`, not a `SqlConnection`, making it easy to swap implementations.",
  },
  {
    id: "cs-b18-b1-record-deconstruct-custom",
    language: "csharp",
    title: "Custom Deconstruct method for non-record classes",
    tag: "classes",
    code: `class Rectangle
{
    public double Width { get; }
    public double Height { get; }
    public Rectangle(double w, double h) { Width = w; Height = h; }

    // Custom deconstruct — enables positional pattern and tuple assignment
    public void Deconstruct(out double width, out double height)
    {
        width  = Width;
        height = Height;
    }
}

var rect = new Rectangle(3, 4);
var (w, h) = rect;                   // deconstruction
Console.WriteLine(w * h);            // 12

if (rect is (> 2, > 3))
    Console.WriteLine("big enough");`,
    explanation: "Adding a `Deconstruct(out T1, out T2, ...)` method enables tuple-style destructuring and positional patterns on non-record classes — useful for domain objects like `Rectangle`, `Color`, etc.",
  },
  {
    id: "cs-b18-b1-linq-groupby-projection",
    language: "csharp",
    title: "LINQ GroupBy with projection and aggregation",
    tag: "snippet",
    code: `using System.Linq;

var orders = new[]
{
    (Product: "apple", Qty: 3),
    (Product: "banana", Qty: 2),
    (Product: "apple", Qty: 5),
    (Product: "banana", Qty: 1),
};

var totals = orders
    .GroupBy(o => o.Product)
    .Select(g => new { Product = g.Key, Total = g.Sum(o => o.Qty) })
    .OrderBy(x => x.Product);

foreach (var t in totals)
    Console.WriteLine($"{t.Product}: {t.Total}");
// apple: 8   banana: 3`,
    explanation: "`GroupBy(key)` returns `IGrouping<TKey, T>` objects; chain `.Select` to project each group into an aggregate — the whole expression runs deferred until enumerated.",
  },
  {
    id: "cs-b18-b1-linq-order-multiple",
    language: "csharp",
    title: "LINQ multi-column ordering with ThenBy",
    tag: "snippet",
    code: `using System.Linq;

var staff = new[]
{
    (Name: "Alice", Dept: "eng",  Salary: 95_000),
    (Name: "Bob",   Dept: "eng",  Salary: 80_000),
    (Name: "Carol", Dept: "hr",   Salary: 85_000),
};

var sorted = staff
    .OrderBy(s => s.Dept)
    .ThenByDescending(s => s.Salary);

foreach (var s in sorted)
    Console.WriteLine($"{s.Dept} {s.Name} {s.Salary}");
// eng Alice 95000
// eng Bob   80000
// hr  Carol 85000`,
    explanation: "`ThenBy` and `ThenByDescending` add secondary sort keys; unlike repeated `OrderBy`, they compose correctly within the stable sort without discarding prior ordering.",
  },
  {
    id: "cs-b18-b1-pattern-property-matching",
    language: "csharp",
    title: "Property pattern matching in switch expressions",
    tag: "snippet",
    code: `record Shape(string Kind, double Size);

double Area(Shape s) => s switch
{
    { Kind: "circle" } => Math.PI * s.Size * s.Size,
    { Kind: "square" } => s.Size * s.Size,
    { Kind: "triangle", Size: > 0 } => 0.5 * s.Size * s.Size,
    _ => throw new ArgumentException("unknown shape")
};

Console.WriteLine(Area(new Shape("circle", 5)));   // ~78.5
Console.WriteLine(Area(new Shape("square", 4)));   // 16`,
    explanation: "Property patterns `{ Prop: value }` match against object properties in switch arms, allowing concise dispatch without `if/else if` chains or type casts.",
  },
  {
    id: "cs-b18-b1-target-typed-new-contexts",
    language: "csharp",
    title: "Target-typed new() reduces type repetition (C# 9)",
    tag: "snippet",
    code: `// Without target-typed new:
Dictionary<string, List<int>> old = new Dictionary<string, List<int>>();

// With target-typed new: type is inferred from the variable type
Dictionary<string, List<int>> modern = new();

// Also works in return statements and parameter passing:
List<int> GetList() => new();
void Process(List<int> items) { }
Process(new());`,
    explanation: "`new()` infers the type from the declaration context — DRY for long generic type names and useful in expressions where the type is already apparent.",
  },
  {
    id: "cs-b18-b1-index-from-end",
    language: "csharp",
    title: "^n index counts from the end of a sequence",
    tag: "snippet",
    code: `int[] arr = { 0, 1, 2, 3, 4 };

Console.WriteLine(arr[^1]);     // 4  — last element
Console.WriteLine(arr[^2]);     // 3  — second to last

// Range with ^ :
Console.WriteLine(string.Join(",", arr[^3..]));   // 2,3,4
Console.WriteLine(string.Join(",", arr[1..^1]));  // 1,2,3  (trim ends)`,
    explanation: "`^n` is an `Index` value equivalent to `length - n`; combining it with ranges (`..`) gives clean slice expressions without arithmetic on `Length`.",
  },
  {
    id: "cs-b18-b1-span-stackalloc",
    language: "csharp",
    title: "stackalloc with Span<T> for stack-allocated buffers",
    tag: "snippet",
    code: `void ProcessSmallInput(int size)
{
    // Stack-allocate if small; heap otherwise:
    Span<byte> buffer = size <= 256
        ? stackalloc byte[size]
        : new byte[size];

    buffer.Fill(0xFF);
    Console.WriteLine(buffer.Length);   // size
    // buffer is automatically freed (stack or GC)
}

ProcessSmallInput(128);   // stack
ProcessSmallInput(1024);  // heap`,
    explanation: "`stackalloc` allocates on the stack without GC pressure; assigning to `Span<T>` (not a raw pointer) keeps the code safe — conditionally combining with heap allocation is the standard pattern.",
  },
  {
    id: "cs-b18-b1-throw-expression",
    language: "csharp",
    title: "Throw expressions in arrow members and null-coalescing",
    tag: "snippet",
    code: `class Service(string name)
{
    // Throw in arrow expression body
    public string Name => !string.IsNullOrEmpty(name)
        ? name
        : throw new ArgumentException("name required");

    // Throw in null-coalescing:
    private readonly string _host =
        Environment.GetEnvironmentVariable("HOST")
        ?? throw new InvalidOperationException("HOST not set");
}`,
    explanation: "`throw` is an expression in C# 7+, usable in arrow members, ternary operators, and null-coalescing — consolidates validation into the initializer without an extra `if` block.",
  },
  {
    id: "cs-b18-b1-local-function",
    language: "csharp",
    title: "Local functions for helper methods that don't leak",
    tag: "snippet",
    code: `public int[] ParseIds(string input)
{
    var parts = input.Split(',');
    return Array.ConvertAll(parts, ParseSingle);

    // Local function — only visible in ParseIds
    int ParseSingle(string s)
    {
        s = s.Trim();
        if (!int.TryParse(s, out int result))
            throw new FormatException($"Invalid id: '{s}'");
        return result;
    }
}`,
    explanation: "Local functions are defined inside another method and are invisible outside it — unlike lambdas they can be recursive, use `ref`/`out`, and the JIT can inline them more aggressively.",
  },
  {
    id: "cs-b18-b1-conditional-access-chain",
    language: "csharp",
    title: "?. and ?[] null-conditional operators in chains",
    tag: "snippet",
    code: `class Address { public string? City { get; init; } }
class Customer { public Address? Address { get; init; } }
class Order    { public Customer? Customer { get; init; } }

Order? order = GetOrder();

// Safe chain — returns null at the first null link:
string? city = order?.Customer?.Address?.City;
int?   len   = order?.Customer?.Address?.City?.Length;

// With null-coalescing:
string display = order?.Customer?.Address?.City ?? "Unknown";`,
    explanation: "`?.` short-circuits to `null` on the first null link, eliminating deeply nested null checks; the result type becomes nullable, safely propagating through the chain.",
  },
  {
    id: "cs-b18-b1-pattern-or-and",
    language: "csharp",
    title: "Pattern combinators: or, and, not",
    tag: "snippet",
    code: `static string Classify(int n) => n switch
{
    < 0                       => "negative",
    0                         => "zero",
    > 0 and < 10              => "small",
    >= 10 and <= 100          => "medium",
    not (>= 0 and <= 100)     => "large or negative",
    _                         => "large"
};

Console.WriteLine(Classify(-5));   // negative
Console.WriteLine(Classify(7));    // small
Console.WriteLine(Classify(200));  // large or negative`,
    explanation: "Pattern combinators `and`, `or`, `not` compose relational and type patterns in switch expressions — replacing multiple `if` conditions with readable declarative arms.",
  },
  {
    id: "cs-b18-b1-expression-bodied",
    language: "csharp",
    title: "Expression-bodied members for concise properties and methods",
    tag: "snippet",
    code: `class Circle(double radius)
{
    public double Radius    => radius;
    public double Diameter  => radius * 2;
    public double Area      => Math.PI * radius * radius;
    public double Perimeter => 2 * Math.PI * radius;

    public override string ToString() =>
        $"Circle(r={radius:F2})";

    public Circle Scale(double factor) => new Circle(radius * factor);
}

var c = new Circle(5);
Console.WriteLine(c.Area);      // 78.54
Console.WriteLine(c.Scale(2));  // Circle(r=10.00)`,
    explanation: "Expression-bodied members (`=> expr`) eliminate braces and `return` for single-expression properties and methods, keeping simple classes concise and readable.",
  },
  {
    id: "cs-b18-b1-file-scoped-namespace",
    language: "csharp",
    title: "File-scoped namespace removes one indentation level (C# 10)",
    tag: "snippet",
    code: `// Traditional block-scoped namespace:
namespace MyApp.Domain
{
    class Product { }
}

// File-scoped (C# 10): applies to the entire file
namespace MyApp.Domain;

class Product   // no extra indentation
{
    public string Name { get; init; } = "";
}`,
    explanation: "File-scoped `namespace X;` applies to the entire file and saves one level of indentation — equivalent to wrapping everything in a block namespace, just more concise.",
  },
  {
    id: "cs-b18-b1-iasyncenumerable",
    language: "csharp",
    title: "IAsyncEnumerable<T> for async streams",
    tag: "families",
    code: `async IAsyncEnumerable<int> StreamItems(int count)
{
    for (int i = 0; i < count; i++)
    {
        await Task.Delay(10);  // simulate async work per item
        yield return i;
    }
}

await foreach (int item in StreamItems(5))
{
    Console.WriteLine(item);
}
// 0  1  2  3  4  (each after ~10ms)`,
    explanation: "`IAsyncEnumerable<T>` enables async iteration with `await foreach` — each item can be produced asynchronously, unlike `IEnumerable<T>` which must be synchronous.",
  },
  {
    id: "cs-b18-b1-cancellationtokensource",
    language: "csharp",
    title: "CancellationTokenSource and CancellationToken",
    tag: "families",
    code: `using var cts = new CancellationTokenSource();
CancellationToken token = cts.Token;

var task = Task.Run(async () =>
{
    while (!token.IsCancellationRequested)
    {
        Console.WriteLine("working...");
        await Task.Delay(100, token);
    }
}, token);

await Task.Delay(350);
cts.Cancel();   // signals cancellation
try { await task; }
catch (OperationCanceledException) { Console.WriteLine("cancelled"); }`,
    explanation: "`CancellationTokenSource` issues the cancellation signal; the `CancellationToken` is passed to operations that honour it — a cooperative cancel pattern avoiding thread abort.",
  },
  {
    id: "cs-b18-b1-imemorycache",
    language: "csharp",
    title: "IMemoryCache for process-local in-memory caching",
    tag: "families",
    code: `using Microsoft.Extensions.Caching.Memory;

var cache = new MemoryCache(new MemoryCacheOptions());

string key = "user:42";
if (!cache.TryGetValue(key, out string? user))
{
    user = "Alice";  // simulate DB fetch
    cache.Set(key, user, TimeSpan.FromMinutes(5));
}

Console.WriteLine(user);   // Alice

// GetOrCreate is more concise:
string val = cache.GetOrCreate(key, entry =>
{
    entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(5);
    return "Bob";
})!;`,
    explanation: "`IMemoryCache` stores items in the process's heap with expiration policies — use `GetOrCreate` to atomically fetch-or-set; prefer `IDistributedCache` for multi-instance deployments.",
  },
  {
    id: "cs-b18-b1-regex-span",
    language: "csharp",
    title: "Regex vs Span-based parsing — allocations matter",
    tag: "families",
    code: `using System.Text.RegularExpressions;

string line = "2026-05-18 ERROR disk full";

// Regex: powerful but allocates Match, Group objects
var match = Regex.Match(line, @"(\\d{4}-\\d{2}-\\d{2}) (\\w+) (.+)");
if (match.Success)
    Console.WriteLine(match.Groups[2].Value);  // ERROR

// Span: zero-allocation parsing for simple formats
ReadOnlySpan<char> span = line.AsSpan();
int i1 = span.IndexOf(' ');
int i2 = span[(i1 + 1)..].IndexOf(' ') + i1 + 1;
Console.WriteLine(span[(i1 + 1)..i2].ToString());  // ERROR`,
    explanation: "Regex is concise for complex patterns; span-based parsing avoids all allocations for simple structured text — profile before choosing; Regex with `Compiled` option amortises reflection cost.",
  },
  {
    id: "cs-b18-b1-objectpool-vs-arraypool",
    language: "csharp",
    title: "ObjectPool<T> vs ArrayPool<T> — reusing objects vs buffers",
    tag: "families",
    code: `using Microsoft.Extensions.ObjectPool;
using System.Buffers;

// ArrayPool: thread-safe pool for byte/int arrays
byte[] buf = ArrayPool<byte>.Shared.Rent(1024);
try
{
    buf.AsSpan().Fill(0);
    // use buf
}
finally { ArrayPool<byte>.Shared.Return(buf); }

// ObjectPool: for costly-to-create objects (parsers, builders)
// var pool = ObjectPool.Create<StringBuilder>();
// var sb = pool.Get();
// try { sb.Append("hello"); } finally { pool.Return(sb); }`,
    explanation: "`ArrayPool<T>` recycles fixed-size buffers (rent/return); `ObjectPool<T>` recycles arbitrary objects, resetting them via a policy before returning — both reduce GC pressure in hot paths.",
  },
  {
    id: "cs-b18-b1-partial-method",
    language: "csharp",
    title: "partial method for source-generator hooks",
    tag: "classes",
    code: `// Generated half of a partial class (e.g., by a source generator):
partial class OrderProcessor
{
    partial void OnOrderProcessed(int orderId);

    public void Process(int id)
    {
        Console.WriteLine($"Processing {id}");
        OnOrderProcessed(id);   // call-site is removed if no impl
    }
}

// Developer-provided half:
partial class OrderProcessor
{
    partial void OnOrderProcessed(int orderId)
    {
        Console.WriteLine($"Audit: order {orderId} done");
    }
}`,
    explanation: "If a `partial void` method has no implementation, the compiler removes the call site entirely — zero overhead. Implementations can be added later without modifying the generated code.",
  },
  {
    id: "cs-b18-b1-sealed-record",
    language: "csharp",
    title: "sealed record prevents inheritance and improves equality performance",
    tag: "classes",
    code: `sealed record UserId(int Value)
{
    // Sealed: no subclassing, no vtable equality dispatch needed
    public override string ToString() => $"UserId({Value})";
}

var a = new UserId(1);
var b = new UserId(1);
Console.WriteLine(a == b);    // True — value equality
Console.WriteLine(a != b);    // False

// UserId is a named primitive — wrapping int prevents ID mix-ups:
void ProcessOrder(UserId uid, int orderId) { }`,
    explanation: "`sealed record` combines value equality with the sealed-class JIT optimisation; it's the idiomatic C# strongly-typed ID pattern — prevents accidentally passing the wrong int to a method.",
  },
];
