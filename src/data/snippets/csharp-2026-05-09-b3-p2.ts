import type { Snippet } from "./types";

export const csharpSnippets20260509B3P2: Snippet[] = [
  {
    id: "cs-snippet-array-pool",
    language: "csharp",
    title: "ArrayPool<T>.Shared rents and returns arrays without GC pressure",
    tag: "snippet",
    code: `using System.Buffers;

// Rent a buffer (may be larger than requested)
byte[] buffer = ArrayPool<byte>.Shared.Rent(1024);
try
{
    int bytesRead = 42;   // simulate reading
    // Use only buffer[0..bytesRead] -- the rest is uninitialized!
    Span<byte> used = buffer.AsSpan(0, bytesRead);
    Console.WriteLine($"used {used.Length} bytes");
}
finally
{
    // MUST return to pool -- don't hold references after returning
    ArrayPool<byte>.Shared.Return(buffer, clearArray: false);
}`,
    explanation: "ArrayPool<T>.Shared maintains a pool of reusable arrays, avoiding repeated heap allocations for temporary buffers. The rented array may be larger than requested; always track the actual used length. Pass clearArray: true if the buffer contained sensitive data.",
  },
  {
    id: "cs-snippet-valuetask",
    language: "csharp",
    title: "ValueTask avoids heap allocation for synchronous fast-paths",
    tag: "snippet",
    code: `using System.Threading.Tasks;

class Cache
{
    private readonly Dictionary<int, string> _cache = new();

    // ValueTask<T>: allocation-free when result is cached (sync path)
    public ValueTask<string> GetAsync(int id)
    {
        if (_cache.TryGetValue(id, out string? val))
            return ValueTask.FromResult(val);  // no heap allocation

        return new ValueTask<string>(FetchFromDbAsync(id));
    }

    private async Task<string> FetchFromDbAsync(int id)
    {
        await Task.Delay(10);   // simulate I/O
        string result = $"item-{id}";
        _cache[id] = result;
        return result;
    }
}

var cache = new Cache();
Console.WriteLine(await cache.GetAsync(1));   // fetched
Console.WriteLine(await cache.GetAsync(1));   // cached (no alloc)`,
    explanation: "ValueTask<T> is a value type that wraps either a completed result or a Task<T>; the synchronous path incurs no heap allocation. Use it for methods that frequently complete synchronously (cache hits, already-buffered data). Don't await a ValueTask more than once.",
  },
  {
    id: "cs-snippet-cancellation-token",
    language: "csharp",
    title: "CancellationToken enables cooperative task cancellation",
    tag: "snippet",
    code: `using System.Threading;

async Task DoWork(CancellationToken ct)
{
    for (int i = 0; i < 10; i++)
    {
        ct.ThrowIfCancellationRequested();   // check and throw OperationCanceledException
        await Task.Delay(100, ct);           // also cancellable
        Console.WriteLine($"step {i}");
    }
}

using var cts = new CancellationTokenSource();
cts.CancelAfter(350);   // cancel after 350ms

try
{
    await DoWork(cts.Token);
}
catch (OperationCanceledException)
{
    Console.WriteLine("cancelled");   // printed after ~350ms
}`,
    explanation: "Pass a CancellationToken through async call chains; callers cancel via CancellationTokenSource. ThrowIfCancellationRequested checks the token and throws OperationCanceledException if cancelled. Most async APIs accept a CancellationToken directly.",
  },
  {
    id: "cs-snippet-semaphore-slim",
    language: "csharp",
    title: "SemaphoreSlim limits concurrent access to a resource",
    tag: "snippet",
    code: `using System.Threading;

// Allow at most 3 concurrent operations
var sem = new SemaphoreSlim(initialCount: 3, maxCount: 3);

async Task Worker(int id)
{
    await sem.WaitAsync();   // async-friendly wait
    try
    {
        Console.WriteLine($"Worker {id} entered");
        await Task.Delay(100);
        Console.WriteLine($"Worker {id} done");
    }
    finally
    {
        sem.Release();   // ALWAYS release in finally
    }
}

var tasks = Enumerable.Range(1, 6).Select(Worker);
await Task.WhenAll(tasks);
// At most 3 workers run concurrently`,
    explanation: "SemaphoreSlim is an async-friendly counting semaphore; WaitAsync acquires a slot without blocking a thread. The initial count is the number of concurrent allowances; maxCount prevents releasing more than acquired. Always release in a finally block.",
  },
  {
    id: "cs-snippet-reader-writer-lock",
    language: "csharp",
    title: "ReaderWriterLockSlim allows concurrent reads but exclusive writes",
    tag: "snippet",
    code: `using System.Threading;

var rwl = new ReaderWriterLockSlim();
var data = new Dictionary<string, int>();

void Read(string key)
{
    rwl.EnterReadLock();
    try { Console.WriteLine(data.TryGetValue(key, out int v) ? v : -1); }
    finally { rwl.ExitReadLock(); }
}

void Write(string key, int value)
{
    rwl.EnterWriteLock();
    try { data[key] = value; }
    finally { rwl.ExitWriteLock(); }
}

Write("x", 42);
Read("x");   // 42
// Multiple threads can Read() concurrently; Write() is exclusive`,
    explanation: "ReaderWriterLockSlim allows unlimited concurrent readers but grants exclusive access for writers; this improves throughput for read-heavy scenarios compared to a plain lock. Always release in a finally block using the matching Exit method.",
  },
  {
    id: "cs-snippet-volatile-read",
    language: "csharp",
    title: "Volatile.Read/Write prevents caching of shared variables",
    tag: "snippet",
    code: `using System.Threading;

bool _stop = false;

// Without volatile: compiler/CPU may cache _stop in a register
// and the thread never sees the write from another thread

// With Volatile.Read: always reads from main memory
Thread worker = new Thread(() =>
{
    while (!Volatile.Read(ref _stop))
    {
        // do work
    }
    Console.WriteLine("stopped");
});
worker.Start();

Thread.Sleep(50);
Volatile.Write(ref _stop, true);   // guaranteed visible to worker
worker.Join();`,
    explanation: "Volatile.Read/Write inserts memory fences that prevent the CPU and compiler from reordering or caching accesses to the variable. Use for single shared flags in producer-consumer scenarios; for complex operations, use Interlocked or a lock instead.",
  },
  {
    id: "cs-understanding-async-valuetask",
    language: "csharp",
    title: "When to use Task vs ValueTask in async methods",
    tag: "understanding",
    code: `// Task<T>: always allocates a heap object
// Use when: method commonly suspends (I/O, delay, network)
async Task<int> IoHeavy() => await ReadFromNetworkAsync();

// ValueTask<T>: zero-alloc on sync path
// Use when: method OFTEN completes synchronously (cache, buffer)
async ValueTask<int> CacheFriendly(bool cached)
{
    if (cached) return 42;      // sync: no allocation
    return await IoHeavy();     // async: wraps a Task
}

// RULES:
// 1. Don't await a ValueTask twice
// 2. Don't store and reuse a ValueTask
// 3. Prefer Task for public APIs unless performance profiling shows benefit
// 4. IValueTaskSource enables pooling the underlying state machine`,
    explanation: "ValueTask<T> avoids the Task<T> allocation when a method returns synchronously; the trade-off is stricter usage rules (no double-await, no conversion to task multiple times). Profile before switching — the gain is usually only measurable in very hot loops.",
  },
  {
    id: "cs-understanding-continuation",
    language: "csharp",
    title: "Task continuations: ContinueWith and TaskContinuationOptions",
    tag: "understanding",
    code: `var task = Task.Run(() =>
{
    Console.WriteLine("main task");
    return 42;
});

// ContinueWith runs a callback when the antecedent finishes
task.ContinueWith(t =>
    Console.WriteLine($"result: {t.Result}"),
    TaskContinuationOptions.OnlyOnRanToCompletion);

task.ContinueWith(t =>
    Console.WriteLine($"failed: {t.Exception}"),
    TaskContinuationOptions.OnlyOnFaulted);

await task;   // or Task.WhenAll(...)

// Prefer 'await' over ContinueWith for clarity
// ContinueWith is useful for complex fan-out/fan-in patterns`,
    explanation: "ContinueWith schedules a callback after the antecedent task completes; TaskContinuationOptions filters by outcome (success, fault, cancelled). await is clearer for linear chains; ContinueWith is better for complex task graphs that don't fit sequential await chains.",
  },
  {
    id: "cs-understanding-thread-pool",
    language: "csharp",
    title: "The CLR ThreadPool manages a pool of reusable worker threads",
    tag: "understanding",
    code: `using System.Threading;

// QueueUserWorkItem offloads work to a pool thread
ThreadPool.QueueUserWorkItem(state =>
{
    Console.WriteLine($"pool thread: {Thread.CurrentThread.ManagedThreadId}");
});

// Task.Run uses the ThreadPool internally
await Task.Run(() =>
    Console.WriteLine($"task thread: {Thread.CurrentThread.ManagedThreadId}"));

// ThreadPool size
ThreadPool.GetMinThreads(out int minWorker, out int minIo);
ThreadPool.GetMaxThreads(out int maxWorker, out int maxIo);
Console.WriteLine($"min={minWorker} max={maxWorker}");

// Avoid blocking pool threads -- use async I/O instead`,
    explanation: "Task.Run and ThreadPool.QueueUserWorkItem submit work to the CLR thread pool; the pool manages thread creation and reuse. Blocking a pool thread (Thread.Sleep, .Result) starves other tasks. CPU-bound work belongs on pool threads; I/O should use async APIs.",
  },
  {
    id: "cs-understanding-yield-state",
    language: "csharp",
    title: "yield return compiles to a state machine class",
    tag: "understanding",
    code: `// This iterator method:
IEnumerable<int> Range(int n)
{
    for (int i = 0; i < n; i++)
        yield return i;
}

// Compiles to approximately:
// class RangeStateMachine : IEnumerator<int>, IEnumerable<int>
// {
//     int _state, _current, _n;
//     bool MoveNext() {
//         switch (_state) {
//             case 0: _state = 1; goto case 1;
//             case 1:
//                 if (_current < _n) {
//                     _value = _current++;
//                     return true;
//                 }
//                 return false;
//         }
//     }
// }

foreach (int v in Range(3)) Console.Write(v + " ");  // 0 1 2`,
    explanation: "yield return triggers the compiler to generate a hidden IEnumerator state machine class; each yield return stores the current position and local variables in the class fields. This is why iterator methods can't use unsafe or ref locals across a yield.",
  },
  {
    id: "cs-structures-concurrent-queue",
    language: "csharp",
    title: "ConcurrentQueue<T> provides thread-safe FIFO ordering",
    tag: "structures",
    code: `using System.Collections.Concurrent;

var cq = new ConcurrentQueue<string>();

// Multiple producers
var producers = Enumerable.Range(0, 5).Select(i =>
    Task.Run(() => cq.Enqueue($"item-{i}")));
await Task.WhenAll(producers);

Console.WriteLine(cq.Count);   // 5

// Consumer
while (cq.TryDequeue(out string? item))
    Console.Write(item + " ");

// Peek without removing
cq.Enqueue("peek-me");
cq.TryPeek(out string? head);
Console.WriteLine(head);   // peek-me`,
    explanation: "ConcurrentQueue<T> is a thread-safe FIFO; TryDequeue returns false instead of throwing when empty, making it safe for polling loops. It uses lock-free techniques internally for high throughput. For bounded capacity with blocking, use BlockingCollection<T> wrapping a ConcurrentQueue.",
  },
  {
    id: "cs-structures-lazy-dictionary",
    language: "csharp",
    title: "Lazy dictionary: compute values on first access",
    tag: "structures",
    code: `using System.Collections.Concurrent;

// ConcurrentDictionary.GetOrAdd is atomic for the factory call
var lazyDict = new ConcurrentDictionary<string, Lazy<int>>();

Func<string, int> expensiveCompute = key =>
{
    Console.WriteLine($"computing for {key}");
    return key.Length * 100;
};

// GetOrAdd with Lazy<T> ensures factory is called AT MOST ONCE per key
int Get(string key)
    => lazyDict.GetOrAdd(key, k => new Lazy<int>(() => expensiveCompute(k))).Value;

Console.WriteLine(Get("hello"));   // computing for hello → 500
Console.WriteLine(Get("hello"));   // cached → 500 (no recompute)`,
    explanation: "Combining ConcurrentDictionary with Lazy<T> ensures the value factory is called at most once per key even under concurrent access; GetOrAdd is atomic at the Lazy<T> level, and Lazy<T> handles the inner factory call's thread safety.",
  },
  {
    id: "cs-caveats-generic-variance",
    language: "csharp",
    title: "IEnumerable<T> is covariant; IList<T> is invariant",
    tag: "caveats",
    code: `// IEnumerable<out T> is covariant -- safe for reading
IEnumerable<string> strings = new List<string> { "a", "b" };
IEnumerable<object> objects = strings;  // OK: string -> object

// IList<T> is invariant -- unsafe to allow (could insert wrong type)
// IList<object> objs = new List<string>();  // CS0266: no implicit conversion

// WHY: if allowed, you could do:
// objs.Add(42);  // inserting an int into a List<string> -- corrupt!

// Arrays are covariant but UNSAFE at runtime
object[] arr = new string[3];  // compiles!
// arr[0] = 42;  // throws ArrayTypeMismatchException at runtime`,
    explanation: "Covariance on IEnumerable<out T> is safe because you can only read T values. IList<T> is invariant because both reads and writes are possible; allowing covariance would permit inserting wrong types. Array covariance is a legacy design mistake — it compiles but can throw at runtime.",
  },
  {
    id: "cs-caveats-equals-gethashcode",
    language: "csharp",
    title: "Overriding Equals requires overriding GetHashCode consistently",
    tag: "caveats",
    code: `class Point
{
    public int X, Y;

    public override bool Equals(object? obj)
        => obj is Point p && p.X == X && p.Y == Y;

    // MUST override if Equals is overridden!
    public override int GetHashCode()
        => HashCode.Combine(X, Y);   // .NET core helper

    // Without GetHashCode: equal Points hash to different buckets
    // and can't be found in HashSet/Dictionary
}

var set = new HashSet<Point>();
set.Add(new Point { X = 1, Y = 2 });
bool found = set.Contains(new Point { X = 1, Y = 2 });
Console.WriteLine(found);   // True (only if GetHashCode is correct)`,
    explanation: "The contract: if a.Equals(b), then a.GetHashCode() == b.GetHashCode(). Violating it causes equal objects to land in different hash buckets, breaking Dictionary and HashSet lookups. Use HashCode.Combine() to build a good hash from multiple fields.",
  },
  {
    id: "cs-types-span-generic",
    language: "csharp",
    title: "Span<T> cannot be used as a generic type argument (ref struct limitation)",
    tag: "types",
    code: `// Span<T> is a ref struct -- cannot appear in:
// 1. Generic type arguments
// 2. Class fields
// 3. Async methods
// 4. Lambda captures

// INVALID:
// List<Span<byte>> spans = new();       // CS8344
// async Task UseSpan(Span<byte> s) { }  // CS4012

// VALID: Memory<T> is a heap-compatible alternative
Memory<byte> mem = new byte[1024];
List<Memory<byte>> mems = new() { mem };  // OK

// For generic methods that accept contiguous data, overload:
void Process(Span<byte> span) => Console.WriteLine(span.Length);
void Process(Memory<byte> mem) => Process(mem.Span);`,
    explanation: "Span<T> being a ref struct means it cannot cross async boundaries, be stored on the heap, or be used as a type argument. Memory<T> and ReadOnlyMemory<T> are heap-safe alternatives; call .Span to get a Span<T> for synchronous processing.",
  },
  {
    id: "cs-types-where-unmanaged",
    language: "csharp",
    title: "where T : unmanaged allows unsafe pointer operations on generics",
    tag: "types",
    code: `using System.Runtime.InteropServices;

// unmanaged: struct with no reference-type fields (int, double, fixed structs)
unsafe T ReadFrom<T>(byte[] data, int offset) where T : unmanaged
{
    fixed (byte* ptr = data)
        return *(T*)(ptr + offset);
}

unsafe void WriteTo<T>(byte[] data, int offset, T value) where T : unmanaged
{
    fixed (byte* ptr = data)
        *(T*)(ptr + offset) = value;
}

byte[] buf = new byte[8];
unsafe { WriteTo(buf, 0, 42); }
unsafe { Console.WriteLine(ReadFrom<int>(buf, 0)); }  // 42

// Also used with sizeof(T) and stackalloc T[]
unsafe { Console.WriteLine(sizeof(double)); }  // 8`,
    explanation: "where T : unmanaged constrains T to blittable value types (no managed references); it enables sizeof(T), pointer arithmetic, and stackalloc T[]. Used by high-performance serialisation, binary I/O, and interop code.",
  },
  {
    id: "cs-families-channel",
    language: "csharp",
    title: "System.Threading.Channels for async producer-consumer pipelines",
    tag: "families",
    code: `using System.Threading.Channels;

// Bounded channel: blocks producers when full
var channel = Channel.CreateBounded<int>(capacity: 5);

// Producer
async Task Produce()
{
    for (int i = 0; i < 10; i++)
    {
        await channel.Writer.WriteAsync(i);
        Console.Write($"produced {i} ");
    }
    channel.Writer.Complete();
}

// Consumer
async Task Consume()
{
    await foreach (int item in channel.Reader.ReadAllAsync())
        Console.Write($"consumed {item} ");
}

await Task.WhenAll(Produce(), Consume());`,
    explanation: "System.Threading.Channels provides async-first producer-consumer queues; bounded channels apply backpressure (WriteAsync awaits when full), and ReadAllAsync enumerates items asynchronously until the writer completes. It's the recommended alternative to BlockingCollection in async code.",
  },
  {
    id: "cs-snippet-memory-marshal",
    language: "csharp",
    title: "MemoryMarshal.Cast reinterprets a Span as a different element type",
    tag: "snippet",
    code: `using System.Runtime.InteropServices;

byte[] bytes = { 0x01, 0x00, 0x00, 0x00,
                  0x02, 0x00, 0x00, 0x00 };

// Reinterpret byte span as int span (zero-copy)
Span<int> ints = MemoryMarshal.Cast<byte, int>(bytes);
Console.WriteLine(ints.Length);  // 2
Console.WriteLine(ints[0]);      // 1
Console.WriteLine(ints[1]);      // 2

// Write back through the reinterpreted span
ints[0] = 99;
Console.WriteLine(bytes[0]);    // 99

// Works only when element sizes are compatible (alignment-safe)`,
    explanation: "MemoryMarshal.Cast<TFrom,TTo> reinterprets a Span's element type without copying; the resulting span length adjusts for the size difference. It's useful for parsing binary protocols where you want to view the same bytes as integers, structs, or chars.",
  },
  {
    id: "cs-understanding-sync-context",
    language: "csharp",
    title: "SynchronizationContext controls where async continuations run",
    tag: "understanding",
    code: `// WinForms/WPF: SynchronizationContext posts to the UI thread
// ASP.NET (classic): posts to the request context
// ASP.NET Core / console: uses the thread pool (null context)

async Task LibraryCode()
{
    // ConfigureAwait(false): don't capture the sync context
    // Continuation runs on any thread pool thread
    await Task.Delay(10).ConfigureAwait(false);
    // Don't touch UI elements here -- might not be UI thread
}

async Task AppCode()
{
    // No ConfigureAwait: captures the current context
    await Task.Delay(10);  // resumes on UI thread in WinForms
    // Safe to update UI elements here
}

Console.WriteLine(
    SynchronizationContext.Current?.GetType().Name ?? "null"); // null in console`,
    explanation: "When await resumes, it posts the continuation to the captured SynchronizationContext (if any). UI frameworks use this to ensure callbacks run on the UI thread. Library code should always use ConfigureAwait(false) to avoid unnecessarily capturing a context.",
  },
  {
    id: "cs-structures-concurrent-stack",
    language: "csharp",
    title: "ConcurrentStack<T> provides thread-safe LIFO access",
    tag: "structures",
    code: `using System.Collections.Concurrent;

var stack = new ConcurrentStack<int>();

// Push single item or range
stack.Push(1);
stack.PushRange(new[] { 2, 3, 4, 5 });

Console.WriteLine(stack.Count);   // 5

// Pop single item
if (stack.TryPop(out int item))
    Console.WriteLine(item);   // 5 (LIFO)

// Pop multiple items atomically
int[] batch = new int[2];
int popped = stack.TryPopRange(batch);
Console.WriteLine($"popped {popped}: {string.Join(",", batch[..popped])}");
// popped 2: 4,3`,
    explanation: "ConcurrentStack<T> is a thread-safe LIFO collection; TryPopRange atomically removes multiple items, useful for batch processing. PushRange pushes multiple items atomically. Unlike Stack<T>, no locking is required for concurrent access.",
  },
  {
    id: "cs-caveats-string-format-injection",
    language: "csharp",
    title: "Avoid string.Format with user input as the format string",
    tag: "caveats",
    code: `// SAFE: format string is a literal, user data is an argument
string name = userInput;
string msg = string.Format("Hello, {0}!", name);

// DANGEROUS: user controls the format string
// string userFormat = userInput;  // e.g. "{0} {1} {2}" -- extra args cause exception
// string bad = string.Format(userFormat, data);  // FormatException or worse

// SAFE alternatives:
// 1. Interpolation with literal template
string safe1 = $"Hello, {name}!";

// 2. Concatenation
string safe2 = "Hello, " + name + "!";

// 3. Validate/sanitise before using in format
bool isValidFormat = name.All(char.IsLetterOrDigit);`,
    explanation: "Never pass user-supplied strings as the format argument to string.Format; malformed placeholders cause FormatException. Keep format strings as compile-time literals and pass user data as arguments, or use string interpolation with a literal template.",
  },
  {
    id: "cs-types-covariant-return",
    language: "csharp",
    title: "Covariant return types allow narrower return types in overrides",
    tag: "types",
    code: `class Animal
{
    public virtual Animal Create() => new Animal();
    public override string ToString() => "Animal";
}

class Dog : Animal
{
    // Return type is narrower (Dog, not Animal) -- covariant return (C# 9+)
    public override Dog Create() => new Dog();
    public override string ToString() => "Dog";
}

Animal a = new Dog();
Animal created = a.Create();
Console.WriteLine(created.GetType().Name);  // Dog

Dog d = new Dog();
Dog dogCreated = d.Create();  // returns Dog, no cast needed
Console.WriteLine(dogCreated);  // Dog`,
    explanation: "Covariant return types (C# 9+) allow an overriding method to declare a more derived return type than the base method; the compiler generates a bridge method for backward compatibility. This removes the need for explicit casts when the concrete type is known.",
  },
  {
    id: "cs-types-record-equality",
    language: "csharp",
    title: "Records use value-based equality by default",
    tag: "types",
    code: `record Point(int X, int Y);
record NamedPoint(int X, int Y, string Label) : Point(X, Y);

var p1 = new Point(1, 2);
var p2 = new Point(1, 2);
var p3 = new Point(3, 4);

Console.WriteLine(p1 == p2);      // True  (value equality)
Console.WriteLine(p1 == p3);      // False
Console.WriteLine(ReferenceEquals(p1, p2));  // False (different objects)

// Records generate: Equals, GetHashCode, ==, !=, ToString, Deconstruct
Console.WriteLine(p1);   // Point { X = 1, Y = 2 }

// With expression creates a modified copy
var p4 = p1 with { Y = 99 };
Console.WriteLine(p4);   // Point { X = 1, Y = 99 }`,
    explanation: "Records generate structural equality: two records are equal if all properties are equal. This makes records ideal for value objects, DTOs, and discriminated union cases. Equality is based on declared properties, not object identity.",
  },
];
