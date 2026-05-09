import type { Snippet } from "./types";

export const csharpSnippets20260509B3P1: Snippet[] = [
  {
    id: "cs-snippet-span-stackalloc",
    language: "csharp",
    title: "Span<T> with stackalloc for zero-allocation temporary buffers",
    tag: "snippet",
    code: `// stackalloc allocates on the stack -- no GC pressure
Span<int> buffer = stackalloc int[8];
for (int i = 0; i < buffer.Length; i++)
    buffer[i] = i * i;

int sum = 0;
foreach (int v in buffer)
    sum += v;
Console.WriteLine(sum);   // 140

// Safe: Span<T> prevents the pointer from escaping the stack frame
// Limit: don't use for large buffers (stack overflow risk)
// Rule of thumb: <= 1 KB on stack, larger on heap

Span<byte> chars = stackalloc byte[16];
"hello".AsSpan().CopyTo(System.Runtime.InteropServices.MemoryMarshal.Cast<byte, char>(chars));`,
    explanation: "stackalloc allocates a fixed array on the stack with no GC involvement; wrapping it in Span<T> provides safe bounds checking and prevents the pointer from escaping. Use it for small temporary buffers in tight loops to eliminate heap allocations.",
  },
  {
    id: "cs-snippet-string-create",
    language: "csharp",
    title: "string.Create builds a string with a writer delegate",
    tag: "snippet",
    code: `// Allocates the string once and writes into it with a Span<char>
string result = string.Create(11, (prefix: "Hello", suffix: "World"),
    (span, state) =>
    {
        state.prefix.AsSpan().CopyTo(span);
        span[5] = ',';
        span[6] = ' ';
        state.suffix.AsSpan().CopyTo(span[7..]);
    });

Console.WriteLine(result);   // Hello, World

// Compare to StringBuilder which allocates an intermediate buffer:
// var sb = new StringBuilder("Hello"); sb.Append(", World");
// string r = sb.ToString();  // two allocations

Console.WriteLine(result.Length);   // 11`,
    explanation: "string.Create allocates the string once and provides a Span<char> writer delegate; there are no intermediate string or StringBuilder allocations. The state parameter avoids closures. Use it in hot paths that construct strings from components.",
  },
  {
    id: "cs-snippet-enumerable-chunk",
    language: "csharp",
    title: "Chunk() splits a sequence into fixed-size batches",
    tag: "snippet",
    code: `int[] data = Enumerable.Range(1, 10).ToArray();

// Chunk(n) yields arrays of at most n elements
foreach (int[] batch in data.Chunk(3))
    Console.WriteLine($"[{string.Join(",", batch)}]");
// [1,2,3]
// [4,5,6]
// [7,8,9]
// [10]    -- last batch may be smaller

// Useful for batch processing
var ids = Enumerable.Range(1, 100);
foreach (var batch in ids.Chunk(10))
{
    // Process 10 IDs at a time
    Console.Write($"batch of {batch.Length} ");
}`,
    explanation: "Chunk(n) (.NET 6+) splits an IEnumerable<T> into arrays of at most n elements; the last batch may be smaller. It's the idiomatic replacement for hand-written batching loops when processing large sequences in groups.",
  },
  {
    id: "cs-snippet-linq-zip",
    language: "csharp",
    title: "Zip combines two sequences element-by-element",
    tag: "snippet",
    code: `var names  = new[] { "Alice", "Bob", "Carol" };
var scores = new[] { 90, 85, 92 };

// Two-sequence Zip with result selector
var ranked = names.Zip(scores, (n, s) => $"{n}: {s}");
foreach (var r in ranked)
    Console.WriteLine(r);
// Alice: 90 / Bob: 85 / Carol: 92

// Three-sequence Zip (.NET 6+) returns tuples
var grades = new[] { 'A', 'B', 'A' };
foreach (var (name, score, grade) in names.Zip(scores, grades))
    Console.WriteLine($"{name} {score} {grade}");`,
    explanation: "Zip pairs elements from multiple sequences at the same index; stops at the shortest sequence. The two-argument overload takes a result selector; the three-argument overload (.NET 6+) returns value tuples for easy destructuring.",
  },
  {
    id: "cs-snippet-linq-except-intersect",
    language: "csharp",
    title: "Except and Intersect perform set difference and intersection",
    tag: "snippet",
    code: `int[] all   = { 1, 2, 3, 4, 5, 6 };
int[] evens = { 2, 4, 6, 8, 10 };

// Except: elements in all that are NOT in evens
var odds = all.Except(evens);
Console.WriteLine(string.Join(",", odds));   // 1,3,5

// Intersect: elements in both
var shared = all.Intersect(evens);
Console.WriteLine(string.Join(",", shared)); // 2,4,6

// Union: all unique elements from both
var union = all.Union(evens);
Console.WriteLine(string.Join(",", union)); // 1,2,3,4,5,6,8,10

// Custom equality via IEqualityComparer<T> overload
var words = new[] { "Apple", "apple", "Banana" };
var unique = words.Distinct(StringComparer.OrdinalIgnoreCase);`,
    explanation: "Except, Intersect, and Union implement set operations on sequences; duplicates are removed and equality is compared via GetHashCode/Equals (or a custom IEqualityComparer). Results are deferred and evaluated at iteration time.",
  },
  {
    id: "cs-snippet-pattern-list",
    language: "csharp",
    title: "List patterns match arrays and lists by element position",
    tag: "snippet",
    code: `static string Describe(int[] arr) => arr switch
{
    []          => "empty",
    [var x]     => $"single: {x}",
    [var x, var y] => $"pair: {x},{y}",
    [1, 2, ..]  => "starts with 1,2",
    [.., 99]    => "ends with 99",
    [var h, .. var mid, var t]
                => $"head={h} tail={t} middle={mid.Length}",
};

Console.WriteLine(Describe([]));            // empty
Console.WriteLine(Describe([42]));          // single: 42
Console.WriteLine(Describe([1, 2, 3]));     // starts with 1,2
Console.WriteLine(Describe([5, 6, 7, 99]));// ends with 99`,
    explanation: "List patterns (C# 11) match sequences by element count and position; .. is the slice pattern that matches zero or more elements (optionally captured). Combined with var, they extract sub-arrays or individual elements without indexing.",
  },
  {
    id: "cs-snippet-pattern-property",
    language: "csharp",
    title: "Property patterns match object properties inside switch",
    tag: "snippet",
    code: `record Person(string Name, int Age, string Country);

static string Categorise(Person p) => p switch
{
    { Age: < 18 }                       => "minor",
    { Country: "US", Age: >= 65 }       => "US senior",
    { Name.Length: > 10 }               => "long name",
    { Age: >= 18, Country: var c }      => $"adult in {c}",
    _                                   => "other",
};

Console.WriteLine(Categorise(new("Alice",  30, "UK")));   // adult in UK
Console.WriteLine(Categorise(new("Bob",    15, "US")));   // minor
Console.WriteLine(Categorise(new("Al",     70, "US")));   // US senior`,
    explanation: "Property patterns match by the values of named properties; nested { } access nested properties, and var captures matched values. They compose with relational patterns (<, >=) and logical patterns (and, or, not) for rich structural conditions.",
  },
  {
    id: "cs-snippet-nullable-disable",
    language: "csharp",
    title: "#nullable enable/disable controls nullable reference warnings per file",
    tag: "snippet",
    code: `#nullable enable
// All reference types are non-nullable unless marked with ?
string name = null!;      // null-forgiving operator: suppress warning
string? maybeNull = null; // explicitly nullable

void Greet(string who)    // 'who' is non-nullable
{
    Console.WriteLine($"Hello, {who.ToUpper()}");
}

// Greet(null);  // CS8625: Cannot convert null literal to non-nullable

#nullable disable
string legacy = null;     // no warning in disabled context
#nullable restore         // restore to project default`,
    explanation: "#nullable enable makes reference types non-nullable by default, surfacing potential NullReferenceException sites at compile time. The null-forgiving operator (!) suppresses warnings when you know a value is non-null. Use #nullable restore to follow the project-level setting.",
  },
  {
    id: "cs-understanding-stackalloc-unsafe",
    language: "csharp",
    title: "stackalloc outside unsafe: Span<T> wraps it safely",
    tag: "understanding",
    code: `// Without 'unsafe', stackalloc can only assign to Span<T>
// The compiler ensures the Span can't outlive the stack frame

void SafeStackAlloc()
{
    Span<int> buf = stackalloc int[64];  // no 'unsafe' needed
    buf.Fill(0);
    for (int i = 0; i < buf.Length; i++) buf[i] = i;
    int total = 0;
    foreach (int v in buf) total += v;
    Console.WriteLine(total);  // 2016
}
SafeStackAlloc();

// UNSAFE (old style): raw pointer, can escape scope
unsafe void UnsafeAlloc()
{
    int* p = stackalloc int[10];  // raw pointer, dangerous
    p[0] = 42;
}`,
    explanation: "Span<T> wrapping of stackalloc is safe without 'unsafe' because the compiler tracks lifetimes and prevents the Span from escaping the allocating method. The raw pointer form still requires 'unsafe' and provides no safety guarantees.",
  },
  {
    id: "cs-understanding-finalizer-order",
    language: "csharp",
    title: "Finalizer execution order is non-deterministic",
    tag: "understanding",
    code: `class Heavy
{
    private readonly string _name;
    public Heavy(string name) { _name = name; }

    ~Heavy()
    {
        // Runs on finalizer thread -- order is NOT guaranteed
        Console.WriteLine($"Finalizing {_name}");
        // Do NOT access other finalizable objects here -- they may be gone
        // Do NOT throw exceptions from finalizers
    }
}

void Run()
{
    var a = new Heavy("A");
    var b = new Heavy("B");
}

Run();
GC.Collect();
GC.WaitForPendingFinalizers();
// A and B finalizers run, but order is undefined`,
    explanation: "Finalizers run on a dedicated thread after GC marks objects unreachable; their execution order relative to each other is undefined. Never access other finalizable objects in a finalizer — they may already be finalized. Prefer IDisposable over finalizers.",
  },
  {
    id: "cs-understanding-lazy-init",
    language: "csharp",
    title: "Lazy<T> defers expensive initialisation until first access",
    tag: "understanding",
    code: `class ExpensiveService
{
    public ExpensiveService() { Console.WriteLine("created"); }
    public string Process(string s) => s.ToUpper();
}

// LazyThreadSafetyMode.ExecutionAndPublication: default, thread-safe
var service = new Lazy<ExpensiveService>(() => new ExpensiveService());

Console.WriteLine("Before access");  // created not printed yet
string result = service.Value.Process("hello"); // created here
Console.WriteLine(result);           // HELLO

// Check without forcing creation
Console.WriteLine(service.IsValueCreated);  // True`,
    explanation: "Lazy<T> delays construction until .Value is first accessed; subsequent accesses return the cached instance. The default thread-safety mode uses double-checked locking; ExecutionAndPublication is safe but uses a lock; None is fastest for single-threaded scenarios.",
  },
  {
    id: "cs-understanding-task-result",
    language: "csharp",
    title: "Task.Result blocks the calling thread — can cause deadlocks",
    tag: "understanding",
    code: `using System.Threading.Tasks;

async Task<int> ComputeAsync() => await Task.FromResult(42);

// BAD in async contexts: .Result blocks the thread
// In a synchronisation context (ASP.NET, WinForms) this can deadlock:
// int value = ComputeAsync().Result;  // blocks thread!

// GOOD: await properly
async Task Good()
{
    int value = await ComputeAsync();  // no blocking
    Console.WriteLine(value);
}

// If you MUST block (e.g., in Main before async support):
int v = Task.Run(() => ComputeAsync()).GetAwaiter().GetResult();
Console.WriteLine(v);   // 42

await Good();`,
    explanation: ".Result synchronously blocks the calling thread waiting for the task; in an async context with a SynchronisationContext, this can deadlock because the continuation needs the same thread that's blocked. Always await instead of calling .Result.",
  },
  {
    id: "cs-structures-priority-queue",
    language: "csharp",
    title: "PriorityQueue<TElement,TPriority> dequeues lowest priority first",
    tag: "structures",
    code: `var pq = new PriorityQueue<string, int>();

pq.Enqueue("low",    10);
pq.Enqueue("high",    1);
pq.Enqueue("medium",  5);

// Dequeues lowest priority value first (min-heap)
while (pq.TryDequeue(out string? item, out int priority))
    Console.WriteLine($"priority={priority} item={item}");
// priority=1  item=high
// priority=5  item=medium
// priority=10 item=low

// Peek without removing
pq.Enqueue("first", 1);
pq.Enqueue("next",  2);
Console.WriteLine(pq.Peek());  // first`,
    explanation: "PriorityQueue<TElement,TPriority> (.NET 6+) dequeues the element with the lowest TPriority value first (min-heap); elements with equal priority are dequeued in unspecified order. TryDequeue returns false when empty instead of throwing.",
  },
  {
    id: "cs-structures-frozen-dict",
    language: "csharp",
    title: "FrozenDictionary<K,V> optimises for read-heavy workloads",
    tag: "structures",
    code: `using System.Collections.Frozen;

// Build once, freeze (O(n) one-time cost)
var lookup = new Dictionary<string, int>
{
    ["apple"]  = 1,
    ["banana"] = 2,
    ["cherry"] = 3,
}.ToFrozenDictionary();

// Lookups are faster than regular Dictionary (hash tuned at freeze time)
Console.WriteLine(lookup["banana"]);    // 2
Console.WriteLine(lookup.Count);        // 3
Console.WriteLine(lookup.ContainsKey("apple"));  // True

// Immutable: no Add/Remove after creation
// lookup["date"] = 4;  // NotSupportedException`,
    explanation: "FrozenDictionary<K,V> (.NET 8+) is an immutable dictionary whose hash function is optimised for the specific set of keys at creation time; repeated lookups are measurably faster than a regular Dictionary in benchmarks. Trade: O(n) creation cost.",
  },
  {
    id: "cs-structures-linked-list",
    language: "csharp",
    title: "LinkedList<T> allows O(1) insertion and removal at any node",
    tag: "structures",
    code: `var list = new LinkedList<int>();

// Add nodes
list.AddLast(1);
list.AddLast(2);
list.AddLast(3);
var node = list.AddFirst(0);   // add at head

// O(1) removal of a known node (unlike List<T> which is O(n))
list.Remove(node);   // remove the '0' node

Console.WriteLine(string.Join(",", list));  // 1,2,3

// Navigate
LinkedListNode<int>? n = list.First;
while (n != null)
{
    Console.Write(n.Value + " ");
    n = n.Next;
}`,
    explanation: "LinkedList<T> is a doubly-linked list; insertion and removal at a known node are O(1), unlike List<T> which shifts elements. The trade-off is O(n) indexed access and higher memory per element (two pointers). Use it when you frequently splice or remove mid-list.",
  },
  {
    id: "cs-structures-stack-queue",
    language: "csharp",
    title: "Stack<T> (LIFO) and Queue<T> (FIFO) generic collections",
    tag: "structures",
    code: `// Stack<T>: Last-In First-Out
var stack = new Stack<int>();
stack.Push(1); stack.Push(2); stack.Push(3);
Console.WriteLine(stack.Pop());    // 3 (last in)
Console.WriteLine(stack.Peek());   // 2 (no removal)
Console.WriteLine(stack.Count);    // 2

// Queue<T>: First-In First-Out
var queue = new Queue<string>();
queue.Enqueue("first");
queue.Enqueue("second");
queue.Enqueue("third");
Console.WriteLine(queue.Dequeue());   // first (first in)
Console.WriteLine(queue.Peek());      // second

// TryPop/TryDequeue: no exception on empty
stack.TryPop(out int v);`,
    explanation: "Stack<T> pushes/pops from one end (LIFO); Queue<T> enqueues at the tail and dequeues from the head (FIFO). Both grow dynamically. For thread-safe variants use ConcurrentStack<T> and ConcurrentQueue<T>.",
  },
  {
    id: "cs-caveats-static-ctor-order",
    language: "csharp",
    title: "Static constructor ordering is only guaranteed within a single class",
    tag: "caveats",
    code: `class A
{
    public static readonly int Value = B.Value + 1;
    static A() => Console.WriteLine($"A: {Value}");
}

class B
{
    public static readonly int Value = 10;
    static B() => Console.WriteLine($"B: {Value}");
}

// Accessing A.Value triggers A's static constructor first
// A's field initialiser references B.Value, triggering B's static ctor
Console.WriteLine(A.Value);
// Output order depends on which class is accessed first:
// B: 10
// A: 11
// 11`,
    explanation: "Static constructors run exactly once before the first access to the type; if A's initialiser references B, B's static ctor runs first. Circular static constructor dependencies can cause one type to see the other's fields at their default values.",
  },
  {
    id: "cs-caveats-event-memory-leak",
    language: "csharp",
    title: "Event subscriptions keep subscribers alive as long as the publisher lives",
    tag: "caveats",
    code: `class Publisher
{
    public event Action? Updated;
    public void Fire() => Updated?.Invoke();
}

class Subscriber
{
    public Subscriber(Publisher pub)
    {
        pub.Updated += OnUpdate;   // pub holds a reference to this
    }
    private void OnUpdate() { /* ... */ }
}

var pub = new Publisher();
var sub = new Subscriber(pub);

// sub won't be GC'd while pub is alive because pub.Updated holds a delegate
// referencing sub's method (and therefore sub itself)!

// Fix: unsubscribe when done
// pub.Updated -= sub.OnUpdate;
// Or: use WeakReference<Subscriber> in the delegate`,
    explanation: "Event subscriptions create a reference from publisher to subscriber; if the publisher outlives the subscriber, the subscriber leaks. Always unsubscribe in Dispose or use weak event patterns (WeakReference delegates) for long-lived publishers with short-lived subscribers.",
  },
  {
    id: "cs-caveats-task-when-all-exception",
    language: "csharp",
    title: "Task.WhenAll aggregates all exceptions into AggregateException",
    tag: "caveats",
    code: `async Task Failing(int id)
{
    await Task.Delay(10);
    throw new InvalidOperationException($"task {id} failed");
}

// WhenAll waits for ALL tasks even if some fail
var tasks = new[] { Failing(1), Failing(2), Failing(3) };
try
{
    await Task.WhenAll(tasks);
}
catch (Exception e)
{
    // await unwraps ONE exception from AggregateException
    Console.WriteLine(e.Message);   // "task 1 failed" (or 2 or 3)

    // To see ALL exceptions:
    foreach (var t in tasks.Where(t => t.IsFaulted))
        Console.WriteLine(t.Exception!.InnerException!.Message);
}`,
    explanation: "WhenAll waits for all tasks and collects all exceptions into an AggregateException; awaiting it unwraps only the first exception. Inspect each task's .Exception property to handle all failures when partial success/failure matters.",
  },
  {
    id: "cs-types-delegate-multicast",
    language: "csharp",
    title: "Delegates are multicast: multiple methods can be invoked at once",
    tag: "types",
    code: `Action<string> log = Console.WriteLine;
log += s => Console.Error.WriteLine($"[ERR] {s}");
log += s => System.IO.File.AppendAllText("/tmp/log.txt", s + "\n");

// All three methods are called
log("Hello");
// Console: Hello
// Console.Error: [ERR] Hello
// File: Hello appended

// Remove a method
Action<string> consoleOnly = Console.WriteLine;
log -= consoleOnly;

// Inspect the invocation list
Console.WriteLine(log.GetInvocationList().Length);  // 2`,
    explanation: "Delegates in C# are multicast: += adds a method to the invocation list, -= removes it, and invoking the delegate calls all methods in order. If any method throws, the remaining methods are not called; use GetInvocationList() to call each individually and catch exceptions.",
  },
  {
    id: "cs-types-func-action-predicate",
    language: "csharp",
    title: "Func<T,R>, Action<T>, and Predicate<T> are built-in delegate types",
    tag: "types",
    code: `// Func<in T, out TResult> -- takes T, returns TResult
Func<int, int>    square = x => x * x;
Func<int, int, int> add  = (a, b) => a + b;
Console.WriteLine(square(5));     // 25
Console.WriteLine(add(3, 4));     // 7

// Action<T> -- takes T, returns void
Action<string> log = Console.WriteLine;
log("hello");

// Predicate<T> -- takes T, returns bool (== Func<T,bool>)
Predicate<int> isEven = n => n % 2 == 0;
Console.WriteLine(isEven(4));    // True
Console.WriteLine(isEven(3));    // False

var nums = new List<int> { 1, 2, 3, 4, 5 };
Console.WriteLine(nums.FindAll(isEven));`,
    explanation: "Func<> and Action<> are generic built-in delegate types covering all common callback shapes (up to 16 parameters). Predicate<T> is a specialisation of Func<T,bool> used by List<T>.FindAll and similar APIs. Prefer Func/Action over custom delegate types unless you need a named type for events.",
  },
  {
    id: "cs-families-memory-extensions",
    language: "csharp",
    title: "MemoryExtensions provides LINQ-like operations on Span<T>",
    tag: "families",
    code: `using System;

ReadOnlySpan<char> text = "Hello, World!".AsSpan();

// IndexOf / Contains without allocation
int idx = text.IndexOf(',');
Console.WriteLine(idx);   // 5

Console.WriteLine(text.Contains('W'));  // True

// Split without allocating substrings
foreach (Range range in text.Split(','))
{
    ReadOnlySpan<char> part = text[range];
    Console.WriteLine(part.Trim().ToString());
}
// Hello
// World!

// StartsWith / EndsWith
Console.WriteLine(text.StartsWith("Hello".AsSpan()));  // True`,
    explanation: "MemoryExtensions provides Span/Memory-aware versions of string operations; they work on ReadOnlySpan<char> without allocating new strings. Use AsSpan() to avoid string copies when you only need to read a portion of a larger string.",
  },
];
