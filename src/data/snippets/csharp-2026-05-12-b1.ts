import type { Snippet } from "./types";

export const csharpSnippets20260512B1: Snippet[] = [
  {
    id: "cs-utf8jsonwriter",
    language: "csharp",
    title: "Utf8JsonWriter — zero-allocation JSON serialisation",
    tag: "snippet",
    code: `using System.Buffers;
using System.Text.Json;

var buffer = new ArrayBufferWriter<byte>();
using var writer = new Utf8JsonWriter(buffer, new JsonWriterOptions { Indented = true });

writer.WriteStartObject();
writer.WriteString("name", "Alice");
writer.WriteNumber("age", 30);
writer.WriteBoolean("active", true);
writer.WriteEndObject();
writer.Flush();

Console.WriteLine(System.Text.Encoding.UTF8.GetString(buffer.WrittenSpan));`,
    explanation:
      "Utf8JsonWriter writes directly to a buffer as UTF-8 bytes without building intermediate strings or allocating objects — it is the fastest way to produce JSON in hot paths or serialisation libraries.",
  },
  {
    id: "cs-jsondocument-parse",
    language: "csharp",
    title: "JsonDocument.Parse — read-only DOM for JSON inspection",
    tag: "snippet",
    code: `using System.Text.Json;

string json = """{"name":"Bob","scores":[10,20,30]}""";

using JsonDocument doc = JsonDocument.Parse(json);
JsonElement root = doc.RootElement;

string name = root.GetProperty("name").GetString()!;
int first = root.GetProperty("scores")[0].GetInt32();

Console.WriteLine(name);   // Bob
Console.WriteLine(first);  // 10

// doc is rented from a pool — Dispose() returns it`,
    explanation:
      "JsonDocument provides a read-only DOM backed by a pooled buffer — it is ideal for extracting a few values from large JSON without deserialising the whole document into objects.",
  },
  {
    id: "cs-jsonnode-mutate",
    language: "csharp",
    title: "JsonNode — mutable JSON DOM for reading and writing",
    tag: "snippet",
    code: `using System.Text.Json.Nodes;

var node = JsonNode.Parse("""{"x":1,"arr":[1,2,3]}""")!;

// Mutate
node["x"] = 99;
node["arr"]!.AsArray().Add(4);
node["newKey"] = "hello";

Console.WriteLine(node.ToJsonString());
// {"x":99,"arr":[1,2,3,4],"newKey":"hello"}`,
    explanation:
      "JsonNode is the mutable counterpart to JsonDocument — use it when you need to read and modify JSON in-place; it is less performant than Utf8JsonWriter for pure output but much more convenient for patching operations.",
  },
  {
    id: "cs-jsonserializercontext",
    language: "csharp",
    title: "JsonSerializerContext — source-generated, AOT-safe serialisation",
    tag: "types",
    code: `using System.Text.Json;
using System.Text.Json.Serialization;

public record Person(string Name, int Age);

[JsonSerializable(typeof(Person))]
[JsonSerializable(typeof(List<Person>))]
public partial class AppJsonContext : JsonSerializerContext { }

// Serialise without reflection:
var p = new Person("Alice", 30);
string json = JsonSerializer.Serialize(p, AppJsonContext.Default.Person);
Console.WriteLine(json);   // {"Name":"Alice","Age":30}

Person back = JsonSerializer.Deserialize(json, AppJsonContext.Default.Person)!;
Console.WriteLine(back.Name);   // Alice`,
    explanation:
      "JsonSerializerContext generates serialisation metadata at compile time, enabling reflection-free JSON that is compatible with Native AOT and trimming — declare the types you need in [JsonSerializable] attributes.",
  },
  {
    id: "cs-memorymarshal-cast",
    language: "csharp",
    title: "MemoryMarshal.Cast — reinterpret a Span as another type",
    tag: "types",
    code: `using System.Runtime.InteropServices;

byte[] bytes = { 0x01, 0x00, 0x00, 0x00,
                 0x02, 0x00, 0x00, 0x00 };

Span<byte> byteSpan = bytes;
Span<int> intSpan = MemoryMarshal.Cast<byte, int>(byteSpan);

Console.WriteLine(intSpan.Length);   // 2
Console.WriteLine(intSpan[0]);       // 1 (little-endian)
Console.WriteLine(intSpan[1]);       // 2`,
    explanation:
      "MemoryMarshal.Cast<TFrom, TTo> reinterprets a Span's memory as a different element type without copying — the same bytes are viewed as ints, floats, or any unmanaged struct, essential for binary protocol parsing.",
  },
  {
    id: "cs-gchandle-pinned",
    language: "csharp",
    title: "GCHandle.Alloc(Pinned) — pin managed memory for unsafe code",
    tag: "caveats",
    code: `using System.Runtime.InteropServices;

byte[] buffer = new byte[] { 1, 2, 3, 4 };

// Pin so the GC cannot move it during native interop
GCHandle handle = GCHandle.Alloc(buffer, GCHandleType.Pinned);
try
{
    IntPtr ptr = handle.AddrOfPinnedObject();
    Console.WriteLine(\$"Pinned at: 0x{ptr:X}");
    // pass ptr to P/Invoke or unsafe code...
}
finally
{
    handle.Free();  // MUST free or the object is never collected
}`,
    explanation:
      "GCHandle.Alloc with Pinned prevents the garbage collector from moving the object in memory — critical when passing a pointer to native code — but you must call Free() in a finally block to avoid a permanent memory leak.",
  },
  {
    id: "cs-conditionalweaktable",
    language: "csharp",
    title: "ConditionalWeakTable — attach metadata to objects without preventing GC",
    tag: "structures",
    code: `using System.Runtime.CompilerServices;

var table = new ConditionalWeakTable<object, string>();

object key = new object();
table.Add(key, "metadata for this object");

table.TryGetValue(key, out string? val);
Console.WriteLine(val);   // metadata for this object

key = null!;
GC.Collect();
// After GC, the entry is automatically removed — key was the only reference`,
    explanation:
      "ConditionalWeakTable associates data with an object using weak references — when the object is collected, the entry is automatically removed; ideal for attaching extension data without causing memory leaks.",
  },
  {
    id: "cs-threadpool-queue-work",
    language: "csharp",
    title: "ThreadPool.QueueUserWorkItem — fire-and-forget background work",
    tag: "snippet",
    code: `using System.Threading;

var done = new ManualResetEventSlim(false);

ThreadPool.QueueUserWorkItem(state =>
{
    int n = (int)state!;
    Console.WriteLine(\$"Working on {n} from thread {Environment.CurrentManagedThreadId}");
    done.Set();
}, 42);

done.Wait();   // wait for completion in this example`,
    explanation:
      "ThreadPool.QueueUserWorkItem schedules a delegate on the thread pool without allocating a new Thread — prefer Task.Run for async-friendly work, but QueueUserWorkItem is useful when you need the WaitCallback signature or a state object without a closure.",
  },
  {
    id: "cs-console-readkey",
    language: "csharp",
    title: "Console.ReadKey — single keypress detection",
    tag: "snippet",
    code: `Console.Write("Press any key (q to quit): ");
ConsoleKeyInfo key = Console.ReadKey(intercept: true);  // intercept=true: don't echo
Console.WriteLine();

if (key.Key == ConsoleKey.Q)
    Console.WriteLine("Quitting...");
else
    Console.WriteLine(\$"You pressed: {key.KeyChar}  modifiers: {key.Modifiers}");`,
    explanation:
      "Console.ReadKey() reads a single keypress without requiring Enter — the intercept parameter controls whether the key is echoed to the console, and ConsoleKeyInfo exposes both the character and any modifier keys.",
  },
  {
    id: "cs-stringbuilder-capacity",
    language: "csharp",
    title: "StringBuilder capacity — avoid reallocation in hot loops",
    tag: "caveats",
    code: `using System.Text;

// Without capacity: grows by doubling (log n reallocations)
var sb1 = new StringBuilder();
for (int i = 0; i < 10_000; i++) sb1.Append("x");

// With capacity: zero reallocations if estimate is accurate
var sb2 = new StringBuilder(capacity: 10_000);
for (int i = 0; i < 10_000; i++) sb2.Append("x");

Console.WriteLine(sb1.Length);   // 10000
Console.WriteLine(sb2.Length);   // 10000
// sb2 performs fewer memory allocations`,
    explanation:
      "StringBuilder doubles its internal buffer each time it overflows — passing an initial capacity avoids all reallocations if you can estimate the final string length, significantly reducing GC pressure in tight loops.",
  },
  {
    id: "cs-stringbuilder-append-chain",
    language: "csharp",
    title: "StringBuilder fluent chaining — every method returns this",
    tag: "snippet",
    code: `using System.Text;

string result = new StringBuilder(64)
    .Append("Hello")
    .Append(", ")
    .Append("World")
    .AppendLine("!")
    .AppendFormat("Count: {0}", 42)
    .Insert(0, ">> ")
    .ToString();

Console.WriteLine(result);
// >> Hello, World!
// Count: 42`,
    explanation:
      "Every StringBuilder mutating method returns the same StringBuilder instance, enabling fluent method chaining — this is idiomatic for building complex strings without repeatedly calling Append in separate statements.",
  },
  {
    id: "cs-datetime-kind-utc",
    language: "csharp",
    title: "DateTime.Kind — Utc vs Local vs Unspecified pitfall",
    tag: "caveats",
    code: `DateTime utc = DateTime.UtcNow;                        // Kind = Utc
DateTime local = DateTime.Now;                          // Kind = Local
DateTime unknown = new DateTime(2024, 1, 1, 12, 0, 0); // Kind = Unspecified

Console.WriteLine(utc.Kind);     // Utc
Console.WriteLine(local.Kind);   // Local
Console.WriteLine(unknown.Kind); // Unspecified

// Dangerous: ToUniversalTime on Unspecified assumes local timezone
DateTime danger = unknown.ToUniversalTime();
Console.WriteLine(danger.Kind);  // Utc, but value may be wrong

// Prefer DateTimeOffset to carry timezone offset explicitly`,
    explanation:
      "DateTime.Kind tracks whether a value is UTC, Local, or Unspecified — comparing or converting Unspecified datetimes silently assumes the local timezone, which is a common source of subtle bugs in distributed systems.",
  },
  {
    id: "cs-datetimeoffset-zone",
    language: "csharp",
    title: "DateTimeOffset — datetime with explicit UTC offset",
    tag: "types",
    code: `DateTimeOffset now = DateTimeOffset.UtcNow;
Console.WriteLine(now);               // e.g. 2026-05-12T10:00:00+00:00

// With explicit offset
var berlin = new DateTimeOffset(2026, 5, 12, 12, 0, 0, TimeSpan.FromHours(2));
var ny     = new DateTimeOffset(2026, 5, 12,  6, 0, 0, TimeSpan.FromHours(-4));

Console.WriteLine(berlin == ny);     // True — same instant, different offsets
Console.WriteLine(berlin.UtcDateTime == ny.UtcDateTime);  // True`,
    explanation:
      "DateTimeOffset stores both the calendar value and the UTC offset, enabling correct equality comparison between the same moment in different time zones — use it instead of DateTime when timezone matters.",
  },
  {
    id: "cs-timezoneinfo-convert",
    language: "csharp",
    title: "TimeZoneInfo.ConvertTime — convert between time zones",
    tag: "snippet",
    code: `var utc = new DateTimeOffset(2026, 7, 15, 14, 0, 0, TimeSpan.Zero);

var eastern = TimeZoneInfo.FindSystemTimeZoneById("Eastern Standard Time");
var tokyo   = TimeZoneInfo.FindSystemTimeZoneById("Tokyo Standard Time");

var inEastern = TimeZoneInfo.ConvertTime(utc, eastern);
var inTokyo   = TimeZoneInfo.ConvertTime(utc, tokyo);

Console.WriteLine(inEastern);  // 2026-07-15 10:00:00 -04:00 (EDT)
Console.WriteLine(inTokyo);    // 2026-07-15 23:00:00 +09:00`,
    explanation:
      "TimeZoneInfo.ConvertTime handles DST transitions automatically — pass a DateTimeOffset (preferred) or specify the source timezone explicitly to avoid ambiguity about the source offset.",
  },
  {
    id: "cs-date-only-today",
    language: "csharp",
    title: "DateOnly — calendar date without time component",
    tag: "snippet",
    code: `DateOnly today = DateOnly.FromDateTime(DateTime.UtcNow);
var birthday = new DateOnly(1990, 6, 15);

int age = today.Year - birthday.Year;
if (today < birthday.AddYears(age)) age--;

Console.WriteLine(today);          // e.g. 2026-05-12
Console.WriteLine(birthday);       // 1990-06-15
Console.WriteLine(\$"Age: {age}");

// Parse from string
DateOnly parsed = DateOnly.Parse("2024-12-31");
Console.WriteLine(parsed.DayOfWeek);  // Tuesday`,
    explanation:
      "DateOnly (added in .NET 6) represents a date without any time or timezone, eliminating the ambiguity of DateTime midnight — use it for birthdates, deadlines, or any concept where time-of-day is meaningless.",
  },
  {
    id: "cs-time-only-now",
    language: "csharp",
    title: "TimeOnly — time of day without date component",
    tag: "snippet",
    code: `TimeOnly open  = new TimeOnly(9, 0);    // 09:00
TimeOnly close = new TimeOnly(17, 30);  // 17:30
TimeOnly now   = TimeOnly.FromDateTime(DateTime.Now);

bool isOpen = now >= open && now <= close;
Console.WriteLine(\$"Is open: {isOpen}");

// Duration between times on the same day
var duration = close - open;
Console.WriteLine(duration);  // 08:30:00

// Wraps correctly around midnight
var midnight = new TimeOnly(23, 0);
Console.WriteLine(midnight.AddHours(2));  // 01:00 AM`,
    explanation:
      "TimeOnly (added in .NET 6) represents a time of day that wraps around midnight, making business-hours checks and schedule comparisons natural without the overhead or confusion of DateTime.",
  },
  {
    id: "cs-reflection-type-info",
    language: "csharp",
    title: "Type.GetType and typeof — obtaining Type objects",
    tag: "snippet",
    code: `using System.Reflection;

// Preferred: typeof at compile time (type-safe, no string)
Type t1 = typeof(List<int>);
Console.WriteLine(t1.FullName);
// System.Collections.Generic.List\`1[[System.Int32...]]

// Dynamic: by name (assembly-qualified for cross-assembly types)
Type? t2 = Type.GetType("System.String");
Console.WriteLine(t2?.Name);   // String

// Inspect members
foreach (MethodInfo m in typeof(string).GetMethods(
    BindingFlags.Public | BindingFlags.Instance | BindingFlags.DeclaredOnly))
{
    Console.WriteLine(m.Name);
    break;  // just show first
}`,
    explanation:
      "typeof() resolves the type at compile time and is safe under trimming; Type.GetType(string) resolves at runtime and may return null if the type is trimmed — prefer typeof() whenever the type is statically known.",
  },
  {
    id: "cs-reflection-method-invoke",
    language: "csharp",
    title: "MethodInfo.Invoke — call a method dynamically via reflection",
    tag: "snippet",
    code: `using System.Reflection;

class Calculator
{
    public int Add(int a, int b) => a + b;
}

var calc = new Calculator();
MethodInfo? method = typeof(Calculator).GetMethod("Add");

object? result = method!.Invoke(calc, new object[] { 10, 20 });
Console.WriteLine(result);  // 30

// For static methods, pass null as first argument:
MethodInfo? parse = typeof(int).GetMethod("Parse", new[] { typeof(string) });
Console.WriteLine(parse!.Invoke(null, new object[] { "42" }));  // 42`,
    explanation:
      "MethodInfo.Invoke accepts the target instance (null for static) and an object array of arguments, returning the result as object — reflection invocation is convenient for plugins and generic frameworks but roughly 10–100× slower than a direct call.",
  },
  {
    id: "cs-reflection-prop-set",
    language: "csharp",
    title: "PropertyInfo.GetValue / SetValue — read and write properties dynamically",
    tag: "snippet",
    code: `using System.Reflection;

class Person { public string Name { get; set; } = ""; public int Age { get; set; } }

var p = new Person { Name = "Alice", Age = 30 };

PropertyInfo? nameProp = typeof(Person).GetProperty("Name");
string? current = (string?)nameProp!.GetValue(p);
Console.WriteLine(current);   // Alice

nameProp.SetValue(p, "Bob");
Console.WriteLine(p.Name);    // Bob`,
    explanation:
      "PropertyInfo.GetValue and SetValue let you read and write properties by name at runtime — useful for generic mappers, data binders, and ORM tools, but costly compared to compiled expressions or source generators.",
  },
  {
    id: "cs-valuetask-completed",
    language: "csharp",
    title: "ValueTask — avoid allocation when result is often synchronous",
    tag: "types",
    code: `using System.Threading.Tasks;

class Cache
{
    private readonly Dictionary<int, string> _store = new() { [1] = "one" };

    public ValueTask<string> GetAsync(int id)
    {
        if (_store.TryGetValue(id, out var v))
            return new ValueTask<string>(v);   // no heap allocation for cached hit

        return new ValueTask<string>(FetchFromDbAsync(id));
    }

    private async Task<string> FetchFromDbAsync(int id)
    {
        await Task.Delay(10);  // simulate I/O
        return \$"fetched-{id}";
    }
}

var cache = new Cache();
Console.WriteLine(await cache.GetAsync(1));   // one (sync path — no allocation)
Console.WriteLine(await cache.GetAsync(2));   // fetched-2 (async path)`,
    explanation:
      "ValueTask avoids heap allocating a Task object on the fast synchronous path — only use it when profiling shows allocation from Task is measurable; otherwise Task is simpler and safer.",
  },
  {
    id: "cs-valuetask-fromresult",
    language: "csharp",
    title: "ValueTask.FromResult and ValueTask.CompletedTask",
    tag: "types",
    code: `using System.Threading.Tasks;

// Pre-completed ValueTask — no allocation for common values
ValueTask<int> vt = ValueTask.FromResult(42);
int result = await vt;
Console.WriteLine(result);   // 42

// ValueTask (void) equivalent of Task.CompletedTask
ValueTask done = ValueTask.CompletedTask;
await done;   // no-op

// For Task: cache Task<bool> results for true/false to avoid allocs
static readonly Task<bool> TrueTask = Task.FromResult(true);`,
    explanation:
      "ValueTask.FromResult and ValueTask.CompletedTask are zero-allocation completions for interfaces that return ValueTask — they are equivalent to returning a literal value but satisfy the async contract.",
  },
  {
    id: "cs-unsafe-addressof",
    language: "csharp",
    title: "Unsafe.AsRef and System.Runtime.CompilerServices.Unsafe",
    tag: "snippet",
    code: `using System.Runtime.CompilerServices;

int value = 42;
ref int r = ref Unsafe.AsRef(in value);  // cast away readonly-ness (dangerous!)
r = 99;
Console.WriteLine(value);   // 99

// Unsafe.Add — pointer arithmetic on managed references
int[] arr = { 10, 20, 30 };
ref int first = ref arr[0];
ref int third = ref Unsafe.Add(ref first, 2);
Console.WriteLine(third);  // 30`,
    explanation:
      "System.Runtime.CompilerServices.Unsafe provides unsafe operations — pointer-like arithmetic on managed references — without the unsafe keyword, enabling zero-copy code in libraries that must run in constrained trust environments.",
  },
  {
    id: "cs-lock-new-statement",
    language: "csharp",
    title: "new lock keyword — C# 13 dedicated lock object",
    tag: "snippet",
    code: `using System.Threading;

var locker = new Lock();   // System.Threading.Lock — C# 13
int count = 0;

var threads = Enumerable.Range(0, 10)
    .Select(_ => new Thread(() =>
    {
        using (locker.EnterScope())  // scope-based, no Monitor.Exit needed
        {
            count++;
        }
    }))
    .ToList();

threads.ForEach(t => t.Start());
threads.ForEach(t => t.Join());
Console.WriteLine(count);  // 10`,
    explanation:
      "C# 13 introduces System.Threading.Lock with EnterScope() that returns a ref struct disposable — the lock statement itself uses Lock when available, producing leaner IL than Monitor.Enter/Exit on earlier types.",
  },
  {
    id: "cs-params-collection-new",
    language: "csharp",
    title: "params collections — C# 13 extends params beyond arrays",
    tag: "snippet",
    code: `// C# 13: params works with any collection type, not just arrays
void PrintAll(params ReadOnlySpan<string> items)
{
    foreach (var item in items)
        Console.WriteLine(item);
}

void SumAll(params IEnumerable<int> nums)
{
    Console.WriteLine(nums.Sum());
}

PrintAll("one", "two", "three");   // one / two / three
SumAll(1, 2, 3, 4);               // 10`,
    explanation:
      "Before C# 13, params required a T[] array and always caused a heap allocation — C# 13 allows params ReadOnlySpan<T>, params Span<T>, params IEnumerable<T>, etc., enabling stack-allocated params calls for hot paths.",
  },
  {
    id: "cs-ziparchive-read",
    language: "csharp",
    title: "ZipArchive — read and create ZIP files",
    tag: "snippet",
    code: `using System.IO.Compression;
using System.IO;

// Create in-memory ZIP
using var ms = new MemoryStream();
using (var zip = new ZipArchive(ms, ZipArchiveMode.Create, leaveOpen: true))
{
    var entry = zip.CreateEntry("hello.txt");
    using var w = new StreamWriter(entry.Open());
    w.Write("Hello ZIP!");
}

// Read it back
ms.Seek(0, SeekOrigin.Begin);
using var reader = new ZipArchive(ms, ZipArchiveMode.Read);
foreach (var entry in reader.Entries)
{
    using var s = new StreamReader(entry.Open());
    Console.WriteLine(\$"{entry.Name}: {s.ReadToEnd()}");
}`,
    explanation:
      "ZipArchive operates on any Stream (file, memory, network) and lets you enumerate, read, and create ZIP entries in-memory — use leaveOpen: true when you need the underlying stream after the ZipArchive is disposed.",
  },
  {
    id: "cs-pipe-reader",
    language: "csharp",
    title: "PipeReader — high-throughput stream reading with zero-copy buffers",
    tag: "snippet",
    code: `using System.IO.Pipelines;
using System.Text;

var pipe = new Pipe();

// Writer task
async Task WriteAsync()
{
    var writer = pipe.Writer;
    Memory<byte> buffer = writer.GetMemory(32);
    int bytes = Encoding.UTF8.GetBytes("Hello, Pipeline!", buffer.Span);
    writer.Advance(bytes);
    await writer.FlushAsync();
    await writer.CompleteAsync();
}

// Reader task
async Task ReadAsync()
{
    var reader = pipe.Reader;
    ReadResult result = await reader.ReadAsync();
    Console.WriteLine(Encoding.UTF8.GetString(result.Buffer.FirstSpan));
    reader.AdvanceTo(result.Buffer.End);
    await reader.CompleteAsync();
}

await Task.WhenAll(WriteAsync(), ReadAsync());`,
    explanation:
      "System.IO.Pipelines coordinates producer and consumer with zero-copy buffer handoff — the writer requests a buffer segment, fills it, and advances, then the reader inspects exactly those bytes and advances its own position.",
  },
  {
    id: "cs-utf8jsonreader",
    language: "csharp",
    title: "Utf8JsonReader — low-level streaming JSON token reader",
    tag: "snippet",
    code: `using System.Text.Json;

byte[] json = System.Text.Encoding.UTF8.GetBytes(
    """{"name":"Alice","age":30}""");

var reader = new Utf8JsonReader(json);
while (reader.Read())
{
    if (reader.TokenType == JsonTokenType.PropertyName)
        Console.Write(reader.GetString() + ": ");
    else if (reader.TokenType != JsonTokenType.StartObject
          && reader.TokenType != JsonTokenType.EndObject)
        Console.WriteLine(reader.GetString() ?? reader.GetInt32().ToString());
}`,
    explanation:
      "Utf8JsonReader is a forward-only, stack-only token reader that operates directly on UTF-8 bytes without allocating — it is the building block used by JsonSerializer, ideal for parsing huge JSON streams with minimal memory.",
  },
  {
    id: "cs-regex-nobacktrack",
    language: "csharp",
    title: "RegexOptions.NonBacktracking — linear-time regex matching",
    tag: "snippet",
    code: `using System.Text.RegularExpressions;

// NonBacktracking guarantees O(n) matching — no catastrophic backtracking
var pattern = new Regex(
    @"\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z]{2,}\\b",
    RegexOptions.IgnoreCase | RegexOptions.NonBacktracking);

bool valid = pattern.IsMatch("user@example.com");
Console.WriteLine(valid);   // True

// Note: NonBacktracking does not support backreferences or lookaheads`,
    explanation:
      "RegexOptions.NonBacktracking uses a DFA/NFA engine that runs in O(input length) time with no exponential blowup — safe for parsing untrusted inputs where a malicious string could cause catastrophic backtracking in a standard engine.",
  },
  {
    id: "cs-gcgen-collect",
    language: "csharp",
    title: "GC.Collect(generation) — force generation-specific collection",
    tag: "caveats",
    code: `// Generation 0: short-lived objects (most allocations start here)
// Generation 1: survived Gen0, may still be temporary
// Generation 2: long-lived objects, full heap scan

GC.Collect(0);   // collect Gen0 only — fast
GC.Collect(1);   // collect Gen0 + Gen1
GC.Collect(2, GCCollectionMode.Forced, blocking: true, compacting: true);

Console.WriteLine(\$"Gen0 count: {GC.CollectionCount(0)}");
Console.WriteLine(\$"Gen1 count: {GC.CollectionCount(1)}");
Console.WriteLine(\$"Gen2 count: {GC.CollectionCount(2)}");

// Only call GC.Collect in benchmarks or after bulk data release;
// never call it in normal application code`,
    explanation:
      "The .NET GC is generational — Gen0 is cheapest and most frequent, Gen2 is expensive and scans the full heap; call GC.Collect(2) only after releasing a large data structure to help memory return to the OS promptly.",
  },
  {
    id: "cs-array-pool-rent",
    language: "csharp",
    title: "ArrayPool<T>.Shared — rent and return arrays to avoid GC pressure",
    tag: "structures",
    code: `using System.Buffers;

// Rent an array — may be larger than requested
byte[] buffer = ArrayPool<byte>.Shared.Rent(4096);
Console.WriteLine(buffer.Length);  // >= 4096 (may be 4096 or a power-of-2 multiple)
try
{
    // Use buffer[0..4096] — the pool may hand you a larger one
    buffer[0] = 42;
}
finally
{
    ArrayPool<byte>.Shared.Return(buffer, clearArray: false);  // return to pool
}`,
    explanation:
      "ArrayPool<T>.Shared avoids allocating new arrays in hot paths by recycling previously rented arrays — always Return in a finally block, and note the pool may give you a larger array than requested.",
  },
  {
    id: "cs-memory-owner",
    language: "csharp",
    title: "IMemoryOwner<T> — ownership pattern for pooled memory",
    tag: "structures",
    code: `using System.Buffers;

// MemoryPool wraps ArrayPool with lifetime management via IDisposable
IMemoryOwner<byte> owner = MemoryPool<byte>.Shared.Rent(minBufferSize: 256);
try
{
    Memory<byte> memory = owner.Memory;
    memory.Span.Fill(0xFF);
    Console.WriteLine(memory.Length);  // >= 256
}
finally
{
    owner.Dispose();  // returns buffer to pool
}`,
    explanation:
      "IMemoryOwner<T> adds ownership semantics to a Memory<T> — the owner is responsible for Disposing the memory, which returns the buffer to the pool; this pattern prevents double-free and ensures a clear lifetime contract.",
  },
  {
    id: "cs-nativeint-nuint",
    language: "csharp",
    title: "nint / nuint — native-sized integers for interop and pointer math",
    tag: "types",
    code: `// nint / nuint are 32-bit on 32-bit platforms, 64-bit on 64-bit
nint a = 100;
nuint b = 200;

Console.WriteLine(sizeof(nint));   // 8 on 64-bit
Console.WriteLine(a + (nint)b);   // 300

// Common in P/Invoke and unsafe code as alternative to IntPtr:
unsafe
{
    nint* ptr = (nint*)System.Runtime.InteropServices.Marshal.AllocHGlobal(8);
    *ptr = 42;
    Console.WriteLine(*ptr);   // 42
    System.Runtime.InteropServices.Marshal.FreeHGlobal((IntPtr)ptr);
}`,
    explanation:
      "nint and nuint are aliases for IntPtr/UIntPtr but support arithmetic operators natively — they are the preferred types for pointer-sized values in modern P/Invoke signatures and unsafe arithmetic.",
  },
  {
    id: "cs-checked-overflow",
    language: "csharp",
    title: "checked / unchecked — integer overflow behavior",
    tag: "caveats",
    code: `int max = int.MaxValue;

// Default (unchecked): wraps silently
int wrapped = max + 1;
Console.WriteLine(wrapped);   // -2147483648

// checked: throws OverflowException
try
{
    int overflow = checked(max + 1);
}
catch (OverflowException ex)
{
    Console.WriteLine(ex.Message);   // Arithmetic operation resulted in an overflow
}

// checked block:
checked
{
    byte b = 255;
    b++;   // throws OverflowException
}`,
    explanation:
      "C# integer arithmetic silently wraps by default (unchecked semantics) — use the checked keyword or block when you need overflow detection; use unchecked explicitly to document intentional wrapping (e.g., hash functions).",
  },
  {
    id: "cs-bitwise-enum-flags",
    language: "csharp",
    title: "[Flags] enum — bitwise combination of enum values",
    tag: "snippet",
    code: `[Flags]
enum Permission
{
    None    = 0,
    Read    = 1 << 0,   // 1
    Write   = 1 << 1,   // 2
    Execute = 1 << 2,   // 4
    All     = Read | Write | Execute
}

Permission p = Permission.Read | Permission.Execute;
Console.WriteLine(p);              // Read, Execute
Console.WriteLine(p.HasFlag(Permission.Write));   // False
Console.WriteLine(p.HasFlag(Permission.Read));    // True

p |= Permission.Write;             // grant Write
p &= ~Permission.Execute;         // revoke Execute
Console.WriteLine(p);              // Read, Write`,
    explanation:
      "[Flags] tells the formatter to display a combination as multiple names and enables HasFlag() — without [Flags], a bitwise-combined value just shows its numeric form since the enum has no name for it.",
  },
  {
    id: "cs-enum-tryparse-generic",
    language: "csharp",
    title: "Enum.TryParse<T> — safe string-to-enum conversion",
    tag: "snippet",
    code: `enum Color { Red, Green, Blue }

if (Enum.TryParse<Color>("Green", ignoreCase: true, out Color c))
    Console.WriteLine(c);          // Green
else
    Console.WriteLine("unknown color");

// Parse fails for out-of-range numbers too — always validate
if (Enum.TryParse<Color>("99", out Color bad))
    Console.WriteLine(Enum.IsDefined(bad) ? bad : "undefined value");`,
    explanation:
      "Enum.TryParse returns false for unknown names but true for any integer string (even if no named member exists) — always follow with Enum.IsDefined when you need to reject undefined numeric values.",
  },
  {
    id: "cs-enum-getvalues-generic",
    language: "csharp",
    title: "Enum.GetValues<T> — iterate all enum members",
    tag: "snippet",
    code: `enum Season { Spring, Summer, Autumn, Winter }

foreach (Season s in Enum.GetValues<Season>())
    Console.WriteLine(\$"{(int)s}: {s}");
// 0: Spring
// 1: Summer
// 2: Autumn
// 3: Winter

// Useful for dropdowns, validation, or population loops
string[] names = Enum.GetNames<Season>();
Console.WriteLine(string.Join(", ", names));  // Spring, Summer, Autumn, Winter`,
    explanation:
      "Enum.GetValues<T>() is the non-allocating generic form added in .NET 5 — it returns a ReadOnlySpan<T> backed by the enum metadata, avoiding the object[] allocation of the older Enum.GetValues(typeof(T)) overload.",
  },
  {
    id: "cs-attribute-inherit",
    language: "csharp",
    title: "AttributeUsage — control inheritance and allowed targets",
    tag: "classes",
    code: `using System;

[AttributeUsage(
    AttributeTargets.Class | AttributeTargets.Method,
    AllowMultiple = false,
    Inherited = true)]    // subclasses inherit this attribute
class OwnerAttribute(string team) : Attribute
{
    public string Team { get; } = team;
}

[Owner("platform-team")]
class BaseService { }

class DerivedService : BaseService { }   // inherits [Owner] because Inherited=true

var attr = (OwnerAttribute?)Attribute.GetCustomAttribute(
    typeof(DerivedService), typeof(OwnerAttribute), inherit: true);
Console.WriteLine(attr?.Team);   // platform-team`,
    explanation:
      "AttributeUsage.Inherited = true (the default) makes a custom attribute visible on derived classes when you call GetCustomAttribute with inherit: true — set it to false to prevent inheritance, e.g. for attributes that must be explicitly re-applied in each subclass.",
  },
  {
    id: "cs-attribute-target",
    language: "csharp",
    title: "Attribute target specifier — disambiguate where an attribute applies",
    tag: "snippet",
    code: `using System;

// When a property has a backing field, specify the target explicitly:
class Model
{
    [field: NonSerialized]   // attribute applies to the backing field, not the property
    public int Id { get; set; }
}

// Auto-property can be attributed at method or return level too:
class Handler
{
    [return: Obsolete("use NewMethod")]
    public int OldMethod() => 0;
}`,
    explanation:
      "C# attributes can target different elements of a declaration — field:, property:, method:, return:, param:, etc. — the target specifier resolves ambiguity when a single line of code represents multiple elements.",
  },
  {
    id: "cs-reflection-ctor",
    language: "csharp",
    title: "ConstructorInfo.Invoke — dynamically instantiate a type",
    tag: "snippet",
    code: `using System.Reflection;

class Point
{
    public double X { get; }
    public double Y { get; }
    public Point(double x, double y) { X = x; Y = y; }
}

Type type = typeof(Point);
ConstructorInfo? ctor = type.GetConstructor(new[] { typeof(double), typeof(double) });

object instance = ctor!.Invoke(new object[] { 3.0, 4.0 });
Console.WriteLine(((Point)instance).X);   // 3`,
    explanation:
      "ConstructorInfo.Invoke creates an instance dynamically by finding the matching constructor overload — use Activator.CreateInstance for simpler cases, but ConstructorInfo gives you control over which overload to call.",
  },
  {
    id: "cs-activator-generic",
    language: "csharp",
    title: "Activator.CreateInstance<T>() — generic no-arg construction",
    tag: "snippet",
    code: `using System;

class Config
{
    public string Host { get; set; } = "localhost";
}

// Generic form — type-safe, no casting required
Config c = Activator.CreateInstance<Config>();
Console.WriteLine(c.Host);   // localhost

// Generic constraint equivalent:
T New<T>() where T : new() => Activator.CreateInstance<T>();
var c2 = New<Config>();
Console.WriteLine(c2.Host);   // localhost`,
    explanation:
      "Activator.CreateInstance<T>() is the generic, type-safe way to create an instance using the parameterless constructor — prefer the new() generic constraint for compile-time safety, but Activator is useful when T is only known at runtime.",
  },
  {
    id: "cs-type-gettype-string",
    language: "csharp",
    title: "Type.GetType by name — trimming and assembly pitfalls",
    tag: "caveats",
    code: `// Simple name works only for mscorlib/System types
Type? t = Type.GetType("System.Int32");
Console.WriteLine(t?.FullName);   // System.Int32

// Other assemblies require assembly-qualified name
Type? list = Type.GetType("System.Collections.Generic.List\`1, System.Private.CoreLib");
Console.WriteLine(list?.Name);    // List\`1

// In trimmed/AOT apps, Type.GetType may return null if the type was removed
// — prefer typeof() and generics where possible`,
    explanation:
      "Type.GetType(string) returns null for types not in the calling assembly or mscorlib unless you supply the assembly-qualified name — in AOT/trimmed apps it also returns null for types that the linker removed, making typeof() always preferable.",
  },
  {
    id: "cs-expression-compile-lambda",
    language: "csharp",
    title: "Expression.Lambda.Compile() — turn an expression tree into a delegate",
    tag: "snippet",
    code: `using System.Linq.Expressions;

// Build (x, y) => x + y dynamically
ParameterExpression x = Expression.Parameter(typeof(int), "x");
ParameterExpression y = Expression.Parameter(typeof(int), "y");
BinaryExpression body = Expression.Add(x, y);
var lambda = Expression.Lambda<Func<int, int, int>>(body, x, y);

Func<int, int, int> add = lambda.Compile();   // compiled to IL at runtime
Console.WriteLine(add(3, 4));   // 7`,
    explanation:
      "Expression.Lambda.Compile() JIT-compiles the expression tree into native code, producing a delegate that runs at full speed — caching the delegate is critical because Compile() itself is expensive.",
  },
  {
    id: "cs-expression-member-access",
    language: "csharp",
    title: "MemberExpression — extract property names from lambdas",
    tag: "snippet",
    code: `using System.Linq.Expressions;

// Extract property name from a strongly-typed lambda — safe from rename refactoring
static string GetPropertyName<T>(Expression<Func<T, object?>> expr)
{
    MemberExpression member = expr.Body is UnaryExpression u
        ? (MemberExpression)u.Operand
        : (MemberExpression)expr.Body;
    return member.Member.Name;
}

class Person { public string Name { get; set; } = ""; public int Age { get; set; } }

Console.WriteLine(GetPropertyName<Person>(p => p.Name));  // Name
Console.WriteLine(GetPropertyName<Person>(p => p.Age));   // Age`,
    explanation:
      "Extracting property names from lambda expressions via MemberExpression is a common technique in notification frameworks (INotifyPropertyChanged), ORMs, and validators — it is refactor-safe unlike hard-coded strings.",
  },
  {
    id: "cs-covariance-generic",
    language: "csharp",
    title: "out T covariance — IEnumerable<Derived> is IEnumerable<Base>",
    tag: "types",
    code: `// IEnumerable<T> is covariant: IEnumerable<out T>
IEnumerable<string> strings = new[] { "a", "b", "c" };
IEnumerable<object> objects = strings;  // valid because string : object

Console.WriteLine(objects.First());   // a

// Only works for interfaces/delegates with 'out' variance
// List<string> is NOT assignable to List<object> — List<T> is invariant`,
    explanation:
      "Covariance (out T) means a generic type with a more-derived type argument is assignable to the same type with a less-derived argument — safe only for read-only output positions, which is why IEnumerable<out T> works but IList<T> does not.",
  },
  {
    id: "cs-contravariance-generic",
    language: "csharp",
    title: "in T contravariance — Action<Base> is Action<Derived>",
    tag: "types",
    code: `// Action<T> is contravariant: Action<in T>
Action<object> printObj = obj => Console.WriteLine(obj);
Action<string> printStr = printObj;   // valid: Action<object> → Action<string>

printStr("hello");   // hello

// IComparer<T> is also contravariant
IComparer<object> objCmp = Comparer<object>.Default;
IComparer<string> strCmp = objCmp;   // valid
Console.WriteLine(strCmp.Compare("a", "b"));  // -1`,
    explanation:
      "Contravariance (in T) means a consumer of a base type can be used where a consumer of a derived type is expected — the delegate accepts more objects than required, so it is safe to substitute.",
  },
  {
    id: "cs-generic-unmanaged",
    language: "csharp",
    title: "unmanaged constraint — restrict T to blittable value types",
    tag: "types",
    code: `using System.Runtime.InteropServices;

// T must be an unmanaged type (no managed references)
static unsafe void PrintBytes<T>(T value) where T : unmanaged
{
    int size = sizeof(T);   // sizeof only works with unmanaged types
    byte* ptr = (byte*)&value;
    for (int i = 0; i < size; i++)
        Console.Write(\$"{ptr[i]:X2} ");
    Console.WriteLine();
}

PrintBytes(42);          // ints bytes in little-endian hex
PrintBytes(3.14f);       // float bytes`,
    explanation:
      "The unmanaged constraint restricts T to types that can be directly blitted to memory (int, float, structs of blittable types) — it enables sizeof(T), pointer operations, and P/Invoke-safe buffer operations.",
  },
  {
    id: "cs-generic-allows-ref",
    language: "csharp",
    title: "allows ref struct — C# 13 generic constraint for ref structs",
    tag: "types",
    code: `// C# 13: allows ref struct in type parameters
static void ProcessSpan<T>(T span)
    where T : allows ref struct
{
    // Can now accept Span<byte>, ReadOnlySpan<char>, etc.
    Console.WriteLine("processed");
}

ProcessSpan(new Span<byte>(new byte[4]));   // OK in C# 13
ProcessSpan("hello".AsSpan());              // ReadOnlySpan<char> — also OK`,
    explanation:
      "Before C# 13, ref structs like Span<T> could not be used as generic type arguments because the CLR cannot store them on the heap — allows ref struct relaxes this restriction for stack-only generic methods.",
  },
  {
    id: "cs-interface-static-abstract",
    language: "csharp",
    title: "static abstract interface members — operator-generic algorithms",
    tag: "classes",
    code: `using System.Numerics;

// INumber<T> uses static abstract members
static T Sum<T>(IEnumerable<T> values) where T : INumber<T>
{
    T total = T.Zero;                // static abstract property
    foreach (var v in values)
        total += v;                  // + operator via static abstract
    return total;
}

Console.WriteLine(Sum(new[] { 1, 2, 3, 4 }));     // 10  (int)
Console.WriteLine(Sum(new[] { 1.5, 2.5, 3.0 }));  // 7   (double)`,
    explanation:
      "Static abstract interface members (added in C# 11) enable generic math — you can write algorithms that work with any numeric type without boxing or reflection, because the operator is resolved at JIT time per instantiation.",
  },
  {
    id: "cs-virtual-override-new",
    language: "csharp",
    title: "virtual / override / new — polymorphism vs hiding",
    tag: "understanding",
    code: `class Animal
{
    public virtual string Sound() => "...";
    public string Name() => "Animal";     // not virtual
}

class Dog : Animal
{
    public override string Sound() => "Woof";  // polymorphic
    public new string Name() => "Dog";          // hiding, not overriding
}

Animal a = new Dog();
Console.WriteLine(a.Sound());   // Woof  — virtual dispatch
Console.WriteLine(a.Name());    // Animal — non-virtual, static dispatch`,
    explanation:
      "override participates in virtual dispatch — the runtime type determines which method runs; new hides the base method and uses static dispatch based on the declared type of the variable, not the runtime type.",
  },
  {
    id: "cs-object-equals-hashcode",
    language: "csharp",
    title: "Equals and GetHashCode contract — objects used in hash sets",
    tag: "caveats",
    code: `class Point
{
    public int X { get; }
    public int Y { get; }
    public Point(int x, int y) { X = x; Y = y; }

    public override bool Equals(object? obj)
        => obj is Point p && p.X == X && p.Y == Y;

    // MUST override GetHashCode when overriding Equals
    public override int GetHashCode() => HashCode.Combine(X, Y);
}

var set = new HashSet<Point> { new Point(1, 2) };
Console.WriteLine(set.Contains(new Point(1, 2)));  // True
// Without GetHashCode override, this would be False`,
    explanation:
      "The contract: objects that are equal must have the same hash code — violating this makes HashSet and Dictionary silently fail to find equal objects, because they bucket by hash code before calling Equals.",
  },
  {
    id: "cs-record-struct-perf",
    language: "csharp",
    title: "record struct vs record class — stack allocation and copying",
    tag: "families",
    code: `// record class: heap allocated, reference semantics, Equals by value
record class PersonC(string Name, int Age);

// record struct: stack allocated, value semantics, Equals by value
record struct PersonS(string Name, int Age);

var rc = new PersonC("Alice", 30);
var rs = new PersonS("Alice", 30);

Console.WriteLine(rc == new PersonC("Alice", 30));   // True (value equality)
Console.WriteLine(rs == new PersonS("Alice", 30));   // True (value equality)

// Passing rs to a method copies all fields (struct semantics)
void Mutate(PersonS p) { p = p with { Age = 99 }; }
Mutate(rs);
Console.WriteLine(rs.Age);   // still 30 — copy was mutated`,
    explanation:
      "record struct gives value equality semantics without heap allocation, but every assignment and method argument copies all fields — use record struct for small, immutable data points and record class for larger objects or when reference identity matters.",
  },
  {
    id: "cs-with-nested",
    language: "csharp",
    title: "Nested with expressions — deep immutable update of records",
    tag: "snippet",
    code: `record Address(string Street, string City);
record Person(string Name, Address Home);

var original = new Person("Alice", new Address("123 Main St", "Springfield"));

// with expression on the nested record — must update the inner record separately
var updated = original with
{
    Home = original.Home with { City = "Shelbyville" }
};

Console.WriteLine(original.Home.City);  // Springfield
Console.WriteLine(updated.Home.City);   // Shelbyville`,
    explanation:
      "The with expression creates a shallow copy with specified property overrides — for nested records you must chain with expressions explicitly, as there is no deep-update shorthand in C#.",
  },
  {
    id: "cs-primary-ctor-field",
    language: "csharp",
    title: "Primary constructor parameters — captured or not?",
    tag: "understanding",
    code: `// Primary ctor parameters are NOT fields — they are captured by lambdas/closures
class Service(string connectionString)
{
    // connectionString is available throughout the class body
    private readonly string _conn = connectionString;   // explicitly store it

    public string GetConn() => connectionString;        // also accessible here
}

// But outside lambdas, the parameter may be optimised away if not captured
var svc = new Service("Server=localhost");
Console.WriteLine(svc.GetConn());   // Server=localhost`,
    explanation:
      "Primary constructor parameters exist for the lifetime of the class instance only when captured — if you reference the parameter in a method body the compiler emits a hidden field; if only used in field initialisers the compiler may not retain it at all.",
  },
  {
    id: "cs-required-init-combo",
    language: "csharp",
    title: "required + init — enforce object initialiser properties",
    tag: "snippet",
    code: `class Config
{
    public required string Host { get; init; }    // must be set in object initialiser
    public int Port { get; init; } = 5432;        // optional with default
    public required string Database { get; init; }
}

var cfg = new Config
{
    Host = "localhost",
    Database = "mydb"
    // Port is optional — defaults to 5432
};

Console.WriteLine(cfg.Host);      // localhost
Console.WriteLine(cfg.Port);      // 5432
// Omitting Host or Database → CS9035 compile error`,
    explanation:
      "required init properties must be set in the object initialiser and cannot be changed afterwards — they combine the enforcement of required with the immutability of init, replacing many constructor overloads.",
  },
  {
    id: "cs-file-type-modifier",
    language: "csharp",
    title: "file modifier — file-local type visibility (C# 11)",
    tag: "snippet",
    code: `// In MyService.cs — 'file' types are invisible outside this file
file class InternalHelper
{
    public static string Format(int n) => \$"#{n:000}";
}

public class MyService
{
    public string Process(int id) => InternalHelper.Format(id);
}

// In OtherFile.cs:
// InternalHelper is not accessible — compile error if referenced there`,
    explanation:
      "The file access modifier (C# 11) scopes a type to the single source file where it is declared — ideal for helper types that are implementation details of a class and should not be visible even to other types in the same assembly.",
  },
  {
    id: "cs-pattern-list",
    language: "csharp",
    title: "List pattern — match array/list structure in switch",
    tag: "snippet",
    code: `static string Describe(int[] arr) => arr switch
{
    []          => "empty",
    [var x]     => \$"single: {x}",
    [var x, var y] => \$"pair: {x}, {y}",
    [1, 2, ..]  => "starts with 1, 2",
    [.., 99]    => "ends with 99",
    _           => \$"other ({arr.Length} elements)"
};

Console.WriteLine(Describe(Array.Empty<int>()));   // empty
Console.WriteLine(Describe(new[] { 7 }));          // single: 7
Console.WriteLine(Describe(new[] { 1, 2, 3 }));   // starts with 1, 2`,
    explanation:
      "List patterns match against the structure of an array or span — [] for empty, [x] for exactly one element, and .. for any number of middle elements, enabling exhaustive structural decomposition without index arithmetic.",
  },
  {
    id: "cs-pattern-slice",
    language: "csharp",
    title: "Slice pattern — capture the middle of a list with ..",
    tag: "snippet",
    code: `static (int first, int[] middle, int last) Split(int[] arr) => arr switch
{
    [var f, .. var m, var l] => (f, m, l),
    _ => throw new ArgumentException("need at least 2 elements")
};

var (first, middle, last) = Split(new[] { 1, 2, 3, 4, 5 });
Console.WriteLine(first);               // 1
Console.WriteLine(string.Join(",", middle)); // 2,3,4
Console.WriteLine(last);                // 5`,
    explanation:
      "The .. slice pattern can be accompanied by a variable to capture the elements it matches — the captured middle is a new array containing those elements, not a reference to the original.",
  },
  {
    id: "cs-pattern-property-nested",
    language: "csharp",
    title: "Nested property pattern — destructure object graphs in switch",
    tag: "snippet",
    code: `record Address(string City, string Country);
record Person(string Name, Address Home);

static string Route(Person p) => p switch
{
    { Home: { Country: "US", City: "NYC" } }  => "NY office",
    { Home: { Country: "US" } }               => "US office",
    { Home: { Country: "GB" } }               => "London office",
    _                                          => "remote"
};

Console.WriteLine(Route(new Person("A", new Address("NYC", "US"))));   // NY office
Console.WriteLine(Route(new Person("B", new Address("LA",  "US"))));   // US office`,
    explanation:
      "Nested property patterns use nested braces to match against properties of properties — they are purely declarative and exhaustiveness is checked by the compiler when the switch covers all cases.",
  },
  {
    id: "cs-switch-type-pattern",
    language: "csharp",
    title: "Type patterns in switch — safe downcasting without is/cast",
    tag: "snippet",
    code: `abstract class Shape { }
record Circle(double Radius) : Shape;
record Rectangle(double W, double H) : Shape;
record Triangle(double Base, double Height) : Shape;

static double Area(Shape s) => s switch
{
    Circle c        => Math.PI * c.Radius * c.Radius,
    Rectangle r     => r.W * r.H,
    Triangle t      => 0.5 * t.Base * t.Height,
    _               => throw new ArgumentOutOfRangeException(nameof(s))
};

Console.WriteLine(Area(new Circle(5)));            // ~78.54
Console.WriteLine(Area(new Rectangle(3, 4)));      // 12`,
    explanation:
      "Type patterns in switch expressions combine type-testing and variable binding in one step — the compiler also warns about unreachable arms and (for sealed hierarchies) missing cases.",
  },
  {
    id: "cs-deconstruct-tuple",
    language: "csharp",
    title: "Tuple deconstruction — destructure return values cleanly",
    tag: "snippet",
    code: `static (int min, int max, double avg) Stats(int[] arr)
    => (arr.Min(), arr.Max(), arr.Average());

var (min, max, avg) = Stats(new[] { 3, 1, 4, 1, 5, 9, 2, 6 });
Console.WriteLine(\$"min={min} max={max} avg={avg:F2}");
// min=1 max=9 avg=3.88

// Discard unwanted elements with _
var (_, highScore, _) = Stats(new[] { 10, 20, 30 });
Console.WriteLine(highScore);   // 30`,
    explanation:
      "Tuple deconstruction unpacks multiple return values directly into named variables — use _ to discard elements you don't need, keeping the remaining variables clearly named without introducing placeholder variables.",
  },
  {
    id: "cs-range-operator",
    language: "csharp",
    title: "Range operator (..) — slice arrays and strings",
    tag: "snippet",
    code: `int[] arr = { 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 };

int[] first3 = arr[..3];       // [0, 1, 2]        — exclusive end
int[] last3  = arr[^3..];      // [7, 8, 9]        — ^ = from end
int[] mid    = arr[2..5];      // [2, 3, 4]
int[] copy   = arr[..];        // full copy

Console.WriteLine(string.Join(",", mid));   // 2,3,4

// Works on strings too
string s = "Hello, World!";
Console.WriteLine(s[7..12]);   // World`,
    explanation:
      "The .. range operator creates a System.Range value that can index into any type implementing a Slice method or an indexer — arrays, Span<T>, string, and any type with the right signature all support it.",
  },
  {
    id: "cs-string-span-slice",
    language: "csharp",
    title: "string.AsSpan() — zero-copy string slicing",
    tag: "snippet",
    code: `string sentence = "The quick brown fox";

// AsSpan avoids allocating a substring
ReadOnlySpan<char> word = sentence.AsSpan(4, 5);   // "quick"
Console.WriteLine(word.ToString());                 // quick

// Span<char> operations without allocations
int idx = sentence.AsSpan().IndexOf("fox");
Console.WriteLine(idx);   // 16

// Compare without substring allocation
bool eq = sentence.AsSpan(4, 5).SequenceEqual("quick");
Console.WriteLine(eq);    // True`,
    explanation:
      "string.AsSpan() returns a ReadOnlySpan<char> over the original string's memory — slice it and search within it without allocating any new strings, critical in hot paths that process many substrings.",
  },
  {
    id: "cs-memory-slice",
    language: "csharp",
    title: "Memory<T>.Slice — asynchronous-safe span-like windowing",
    tag: "snippet",
    code: `byte[] data = Enumerable.Range(0, 16).Select(i => (byte)i).ToArray();
Memory<byte> memory = data.AsMemory();

Memory<byte> chunk = memory.Slice(4, 8);   // bytes 4..11
Span<byte> span = chunk.Span;

Console.WriteLine(span[0]);   // 4
Console.WriteLine(span[7]);   // 11

// Memory<T> can be stored in fields and passed to async methods
// Span<T> cannot (stack-only) — use Memory<T> across await points`,
    explanation:
      "Memory<T> is the heap-storable sibling of Span<T> — it can be stored in class fields and passed through async methods, while Span<T> is stack-only; Slice creates a window without copying the underlying array.",
  },
  {
    id: "cs-iasync-enumerable",
    language: "csharp",
    title: "IAsyncEnumerable<T> — async streaming with yield return",
    tag: "snippet",
    code: `using System.Threading;

async IAsyncEnumerable<int> CountSlowly(
    int n, [System.Runtime.CompilerServices.EnumeratorCancellation] CancellationToken ct = default)
{
    for (int i = 0; i < n; i++)
    {
        await Task.Delay(10, ct);
        yield return i;
    }
}

await foreach (int value in CountSlowly(5))
    Console.Write(value + " ");   // 0 1 2 3 4`,
    explanation:
      "IAsyncEnumerable<T> enables streaming sequences where each element is produced asynchronously — the consumer pulls with await foreach, and the [EnumeratorCancellation] attribute wires up the CancellationToken passed to WithCancellation().",
  },
  {
    id: "cs-async-disposable",
    language: "csharp",
    title: "IAsyncDisposable and await using — async resource cleanup",
    tag: "snippet",
    code: `class AsyncResource : IAsyncDisposable
{
    public async ValueTask DisposeAsync()
    {
        await Task.Delay(10);   // simulate async cleanup
        Console.WriteLine("cleaned up asynchronously");
    }
}

await using var resource = new AsyncResource();
Console.WriteLine("working with resource");
// DisposeAsync is awaited when the block exits`,
    explanation:
      "IAsyncDisposable.DisposeAsync lets you await cleanup work (flushing buffers, closing network connections) without blocking — await using is the async equivalent of using and calls DisposeAsync at scope exit.",
  },
  {
    id: "cs-configure-await",
    language: "csharp",
    title: "ConfigureAwait(false) — avoid SynchronizationContext deadlocks",
    tag: "caveats",
    code: `// Library code — use ConfigureAwait(false) to avoid capturing context
async Task<string> LibraryMethodAsync()
{
    // Does NOT resume on the calling SynchronizationContext
    string data = await FetchAsync().ConfigureAwait(false);
    return data.ToUpper();
}

// Application code (ASP.NET, UI) — context capturing is fine
async Task AppMethodAsync()
{
    // Resumes on the UI/request context — safe to update UI or HttpContext
    string result = await LibraryMethodAsync();
    Console.WriteLine(result);
}

static Task<string> FetchAsync() => Task.FromResult("hello");`,
    explanation:
      "ConfigureAwait(false) prevents the continuation from being posted back to the captured SynchronizationContext — library code should always use it to avoid deadlocks in callers that block with .Result or .Wait().",
  },
  {
    id: "cs-task-whenall-exception",
    language: "csharp",
    title: "Task.WhenAll — all exceptions in AggregateException",
    tag: "caveats",
    code: `async Task Fail(string name)
{
    await Task.Delay(10);
    throw new InvalidOperationException(name);
}

try
{
    await Task.WhenAll(Fail("A"), Fail("B"), Fail("C"));
}
catch (Exception ex)
{
    // await unwraps AggregateException to first inner exception
    Console.WriteLine(ex.Message);   // A (or B or C, non-deterministic)
}

// To see ALL exceptions, inspect the Task directly:
Task t = Task.WhenAll(Fail("A"), Fail("B"));
await t.ContinueWith(_ => { });
Console.WriteLine(t.Exception?.InnerExceptions.Count);  // 2`,
    explanation:
      "When you await Task.WhenAll and any task throws, the await only re-throws the first exception — to capture all failures, hold a reference to the WhenAll task and inspect its Exception.InnerExceptions after completion.",
  },
  {
    id: "cs-task-whenany-cancel",
    language: "csharp",
    title: "Task.WhenAny — implement timeout and first-result patterns",
    tag: "snippet",
    code: `async Task<string> SlowOp()
{
    await Task.Delay(500);
    return "slow result";
}

using var cts = new CancellationTokenSource();
Task<string> operation = SlowOp();
Task timeout = Task.Delay(200);

Task winner = await Task.WhenAny(operation, timeout);
if (winner == timeout)
{
    cts.Cancel();
    Console.WriteLine("timed out");
}
else
{
    Console.WriteLine(await operation);
}`,
    explanation:
      "Task.WhenAny returns the first completed task — combined with a Task.Delay, it implements a timeout without CancellationToken; you still need to cancel the original operation to prevent it from running unnecessarily.",
  },
  {
    id: "cs-valuetask-caveat",
    language: "csharp",
    title: "ValueTask reuse caveat — awaiting multiple times is unsafe",
    tag: "caveats",
    code: `async ValueTask<int> GetOnce()
{
    await Task.Delay(1);
    return 42;
}

ValueTask<int> vt = GetOnce();

int r1 = await vt;       // OK — first await
// int r2 = await vt;   // UNDEFINED BEHAVIOUR — may use pooled object that was returned

// Safe pattern: call AsTask() to convert to a reusable Task
Task<int> task = GetOnce().AsTask();
int a = await task;
int b = await task;   // safe — Task can be awaited multiple times`,
    explanation:
      "A ValueTask must be awaited exactly once — awaiting it multiple times can corrupt the internal IValueTaskSource pool, because the completion source may have already been returned to the pool after the first await.",
  },
  {
    id: "cs-semaphore-slim-2",
    language: "csharp",
    title: "SemaphoreSlim — limit concurrent async operations",
    tag: "snippet",
    code: `using System.Threading;

var semaphore = new SemaphoreSlim(initialCount: 3, maxCount: 3);
var tasks = Enumerable.Range(1, 8).Select(async i =>
{
    await semaphore.WaitAsync();
    try
    {
        Console.WriteLine(\$"Task {i} running ({DateTime.Now:ss.fff})");
        await Task.Delay(100);
    }
    finally
    {
        semaphore.Release();
    }
});

await Task.WhenAll(tasks);`,
    explanation:
      "SemaphoreSlim.WaitAsync() limits the number of concurrently executing async operations — prefer it over lock/Semaphore because it does not block a thread while waiting, keeping the thread pool free for other work.",
  },
  {
    id: "cs-manual-reset-slim",
    language: "csharp",
    title: "ManualResetEventSlim — signal multiple waiters simultaneously",
    tag: "snippet",
    code: `using System.Threading;

var ready = new ManualResetEventSlim(initialState: false);

var waiter1 = Task.Run(() => { ready.Wait(); Console.WriteLine("waiter 1 released"); });
var waiter2 = Task.Run(() => { ready.Wait(); Console.WriteLine("waiter 2 released"); });

Thread.Sleep(50);
ready.Set();   // releases ALL waiters at once

await Task.WhenAll(waiter1, waiter2);`,
    explanation:
      "ManualResetEventSlim stays signalled after Set() — all current and future waiters are released immediately; call Reset() to close the gate again; unlike AutoResetEvent it does not auto-reset after releasing one waiter.",
  },
  {
    id: "cs-cancellation-linked-source",
    language: "csharp",
    title: "CancellationTokenSource.CreateLinkedTokenSource — combine tokens",
    tag: "snippet",
    code: `using System.Threading;

var userCts = new CancellationTokenSource();       // user-initiated cancel
var timeoutCts = new CancellationTokenSource(TimeSpan.FromSeconds(5));  // auto-timeout

// Merged token is cancelled if EITHER source is cancelled
using var linked = CancellationTokenSource.CreateLinkedTokenSource(
    userCts.Token, timeoutCts.Token);

try
{
    await Task.Delay(Timeout.Infinite, linked.Token);
}
catch (OperationCanceledException)
{
    Console.WriteLine(\$"Cancelled — user: {userCts.Token.IsCancellationRequested}");
}

// Simulate user cancel after 100ms
userCts.CancelAfter(100);
await Task.Delay(200);`,
    explanation:
      "CreateLinkedTokenSource combines multiple CancellationTokens into one — the linked token is cancelled when any source token is cancelled, making it easy to merge user-initiated and timeout-based cancellation.",
  },
  {
    id: "cs-threadlocal-value",
    language: "csharp",
    title: "ThreadLocal<T> — per-thread values with factory initialisation",
    tag: "snippet",
    code: `using System.Threading;

var counter = new ThreadLocal<int[]>(
    () => new int[1],      // factory: each thread gets its own array
    trackAllValues: true); // enables Values collection

Parallel.For(0, 100, i =>
{
    counter.Value![0]++;   // no lock needed — each thread has own value
});

Console.WriteLine(counter.Values!.Sum(a => a[0]));   // 100`,
    explanation:
      "ThreadLocal<T> provides each thread with its own independent value, eliminating thread contention for accumulator-style variables in parallel loops — trackAllValues: true lets you aggregate all thread-local results after the loop.",
  },
  {
    id: "cs-interlocked-compare",
    language: "csharp",
    title: "Interlocked.CompareExchange — lock-free compare-and-swap",
    tag: "snippet",
    code: `using System.Threading;

int value = 0;

// Atomically: if value == 0, set it to 42; return old value
int old = Interlocked.CompareExchange(ref value, 42, 0);
Console.WriteLine(old);    // 0   (the value before swap)
Console.WriteLine(value);  // 42  (swap succeeded)

// Second call: value is now 42, so 0 != 42 — swap does NOT happen
old = Interlocked.CompareExchange(ref value, 99, 0);
Console.WriteLine(old);    // 42  (value unchanged)
Console.WriteLine(value);  // 42`,
    explanation:
      "CompareExchange atomically compares a location with a comparand and, if equal, replaces it — it is the building block of lock-free data structures like CAS loops and lazy initialisation patterns.",
  },
  {
    id: "cs-lazy-thread-safety-mode",
    language: "csharp",
    title: "LazyThreadSafetyMode — choose the right Lazy<T> initialisation strategy",
    tag: "families",
    code: `using System.Threading;

// ExecutionAndPublication: only one factory runs; all threads see same instance
var safe = new Lazy<int>(() => { Console.Write("init-safe "); return 42; },
    LazyThreadSafetyMode.ExecutionAndPublication);

// PublicationOnly: multiple factories may run; first winner's value published
var race = new Lazy<int>(() => { Console.Write("init-race "); return 99; },
    LazyThreadSafetyMode.PublicationOnly);

// None: no thread safety; use only on single-threaded paths
var fast = new Lazy<int>(() => 7, LazyThreadSafetyMode.None);

Console.WriteLine(safe.Value + race.Value + fast.Value);`,
    explanation:
      "ExecutionAndPublication (default) uses a lock to guarantee a single factory run; PublicationOnly allows speculative parallel initialisation and picks the first result; None has no overhead but is unsafe for shared instances.",
  },
  {
    id: "cs-concurrent-dict-getadd",
    language: "csharp",
    title: "ConcurrentDictionary.GetOrAdd — atomic read-or-insert",
    tag: "snippet",
    code: `using System.Collections.Concurrent;

var cache = new ConcurrentDictionary<string, int>();

// Atomic: if key absent, compute and add; else return existing
int v1 = cache.GetOrAdd("key", k => { Console.WriteLine("computing"); return 42; });
int v2 = cache.GetOrAdd("key", k => { Console.WriteLine("won't run"); return 99; });

Console.WriteLine(v1);  // 42
Console.WriteLine(v2);  // 42   (computing was not called again)

// AddOrUpdate: always invokes one of the delegates
cache.AddOrUpdate("key", 1, (k, old) => old + 1);
Console.WriteLine(cache["key"]);  // 43`,
    explanation:
      "GetOrAdd is an atomic dictionary read-or-insert — but note the factory delegate can be called multiple times under contention (races may compute multiple values; only one is stored); use AddOrUpdate when the update logic must also be atomic.",
  },
  {
    id: "cs-blocking-collection-bound",
    language: "csharp",
    title: "BlockingCollection<T> — bounded producer/consumer queue",
    tag: "snippet",
    code: `using System.Collections.Concurrent;
using System.Threading;

var bc = new BlockingCollection<int>(boundedCapacity: 3);

// Producer
var producer = Task.Run(() =>
{
    for (int i = 0; i < 6; i++)
    {
        bc.Add(i);   // blocks when capacity is full
        Console.WriteLine(\$"Produced {i}");
    }
    bc.CompleteAdding();
});

// Consumer
var consumer = Task.Run(() =>
{
    foreach (int item in bc.GetConsumingEnumerable())
        Console.WriteLine(\$"  Consumed {item}");
});

await Task.WhenAll(producer, consumer);`,
    explanation:
      "BlockingCollection with a bounded capacity applies back-pressure — the producer blocks when the queue is full, naturally throttling production to match consumption speed without any explicit synchronisation code.",
  },
  {
    id: "cs-channel-bounded-backpressure",
    language: "csharp",
    title: "Bounded Channel — back-pressure strategies in async pipelines",
    tag: "understanding",
    code: `using System.Threading.Channels;
using System.Threading;

// BoundedChannelFullMode controls what happens when channel is full:
var options = new BoundedChannelOptions(capacity: 4)
{
    FullMode = BoundedChannelFullMode.Wait,      // writer awaits space
    // FullMode = BoundedChannelFullMode.DropOldest, // drop head
    // FullMode = BoundedChannelFullMode.DropNewest, // drop written item
};
var channel = Channel.CreateBounded<int>(options);

// Fast producer
async Task Produce()
{
    for (int i = 0; i < 8; i++)
    {
        await channel.Writer.WriteAsync(i);      // waits if full (Wait mode)
        Console.WriteLine(\$"wrote {i}");
    }
    channel.Writer.Complete();
}

await Task.WhenAll(Produce(), Task.Delay(500));`,
    explanation:
      "BoundedChannelFullMode.Wait (the safest default) makes WriteAsync await until a slot is available; DropOldest and DropNewest discard data instead of blocking — choose the strategy based on whether data loss is acceptable.",
  },
  {
    id: "cs-linq-zip-with",
    language: "csharp",
    title: "LINQ Zip — pair elements from two sequences",
    tag: "snippet",
    code: `var names = new[] { "Alice", "Bob", "Carol" };
var scores = new[] { 95, 87, 92 };

// Zip with result selector (stops at shorter sequence)
var results = names.Zip(scores, (name, score) => \$"{name}: {score}");
foreach (var r in results)
    Console.WriteLine(r);

// Three-sequence overload (.NET 6+)
var ids = new[] { 1, 2, 3 };
var triples = names.Zip(scores, ids);
foreach (var (name, score, id) in triples)
    Console.WriteLine(\$"{id}. {name} = {score}");`,
    explanation:
      "LINQ Zip pairs elements by position from two (or three) sequences, stopping at the shorter one — it avoids manual indexing and makes the intent to combine sequences explicit.",
  },
  {
    id: "cs-linq-maxby",
    language: "csharp",
    title: "LINQ MaxBy / MinBy — find element with max/min key (.NET 6+)",
    tag: "snippet",
    code: `record Product(string Name, decimal Price, int Stock);

var products = new[]
{
    new Product("A", 29.99m, 100),
    new Product("B", 99.99m,  10),
    new Product("C",  9.99m, 500),
};

Product? priciest = products.MaxBy(p => p.Price);
Product? cheapest = products.MinBy(p => p.Price);

Console.WriteLine(priciest?.Name);   // B
Console.WriteLine(cheapest?.Name);   // C`,
    explanation:
      "MaxBy and MinBy return the element with the maximum/minimum key rather than the key itself, saving the OrderByDescending(...).First() ceremony and avoiding unnecessary sorting of the whole sequence.",
  },
  {
    id: "cs-linq-distinctby",
    language: "csharp",
    title: "LINQ DistinctBy — remove duplicates by key (.NET 6+)",
    tag: "snippet",
    code: `record User(int Id, string Name, string Dept);

var users = new[]
{
    new User(1, "Alice", "Eng"),
    new User(2, "Bob",   "HR"),
    new User(3, "Carol", "Eng"),
    new User(4, "Dave",  "HR"),
};

// One representative per department (first occurrence wins)
var byDept = users.DistinctBy(u => u.Dept).ToList();
Console.WriteLine(string.Join(", ", byDept.Select(u => u.Name)));
// Alice, Bob`,
    explanation:
      "DistinctBy deduplicates a sequence by a key projection, preserving the first occurrence of each distinct key — it is cleaner and more efficient than GroupBy(...).Select(g => g.First()).",
  },
  {
    id: "cs-linq-group-join",
    language: "csharp",
    title: "LINQ GroupJoin — left outer join with correlated sub-collections",
    tag: "snippet",
    code: `var depts = new[] { new { Id = 1, Name = "Eng" }, new { Id = 2, Name = "HR" } };
var employees = new[]
{
    new { Name = "Alice", DeptId = 1 },
    new { Name = "Bob",   DeptId = 1 },
    new { Name = "Carol", DeptId = 2 },
};

var query = depts.GroupJoin(
    employees,
    d => d.Id,
    e => e.DeptId,
    (dept, emps) => new { dept.Name, Members = emps.ToList() }
);

foreach (var g in query)
    Console.WriteLine(\$"{g.Name}: {string.Join(", ", g.Members.Select(e => e.Name))}");
// Eng: Alice, Bob
// HR: Carol`,
    explanation:
      "GroupJoin is LINQ's equivalent of a SQL LEFT OUTER JOIN — for each element in the outer sequence it yields a group of matching inner elements, which may be empty (unlike Join which drops non-matching outer rows).",
  },
  {
    id: "cs-linq-except-intersect",
    language: "csharp",
    title: "LINQ Except and Intersect — set difference and intersection",
    tag: "structures",
    code: `var a = new[] { 1, 2, 3, 4, 5 };
var b = new[] { 3, 4, 5, 6, 7 };

int[] onlyInA  = a.Except(b).ToArray();      // set difference
int[] inBoth   = a.Intersect(b).ToArray();   // set intersection
int[] inEither = a.Union(b).ToArray();       // set union

Console.WriteLine(string.Join(",", onlyInA));   // 1,2
Console.WriteLine(string.Join(",", inBoth));    // 3,4,5
Console.WriteLine(string.Join(",", inEither));  // 1,2,3,4,5,6,7`,
    explanation:
      "Except, Intersect, and Union perform mathematical set operations on sequences using the default equality comparer — they automatically deduplicate results and accept a custom IEqualityComparer<T> for key-based comparisons.",
  },
  {
    id: "cs-linq-order",
    language: "csharp",
    title: "LINQ Order() / OrderDescending() — sort without a key (.NET 7+)",
    tag: "snippet",
    code: `int[] nums = { 5, 3, 8, 1, 4 };

int[] ascending  = nums.Order().ToArray();
int[] descending = nums.OrderDescending().ToArray();

Console.WriteLine(string.Join(",", ascending));   // 1,3,4,5,8
Console.WriteLine(string.Join(",", descending));  // 8,5,4,3,1

// Combine for stable secondary sort:
string[] words = { "banana", "apple", "cherry", "apricot" };
var sorted = words.Order().OrderBy(w => w.Length).ToArray();
Console.WriteLine(string.Join(",", sorted));  // apple,banana,cherry,apricot`,
    explanation:
      "Order() and OrderDescending() sort using the natural comparison of T without needing a key selector — they are cleaner than OrderBy(x => x) when sorting primitive sequences or types that already implement IComparable<T>.",
  },
  {
    id: "cs-deconstruct-custom",
    language: "csharp",
    title: "Custom Deconstruct — enable tuple-like destructuring on any type",
    tag: "classes",
    code: `class Rectangle
{
    public double Width  { get; }
    public double Height { get; }
    public Rectangle(double w, double h) { Width = w; Height = h; }

    // Deconstruct enables: var (w, h) = rect;
    public void Deconstruct(out double width, out double height)
    {
        width  = Width;
        height = Height;
    }
}

var rect = new Rectangle(4, 3);
var (w, h) = rect;              // calls Deconstruct
Console.WriteLine(\$"{w} x {h}");   // 4 x 3
Console.WriteLine(\$"Area: {w * h}"); // Area: 12`,
    explanation:
      "Any type with a Deconstruct method (or extension method) participates in positional deconstruction — the pattern is also used in switch arms to destructure custom types without records.",
  },
  {
    id: "cs-span-stackalloc-slice",
    language: "csharp",
    title: "stackalloc + Span<T> — stack-based buffer without unsafe pointer",
    tag: "snippet",
    code: `// Safe stackalloc via Span<T> — no unsafe keyword required
Span<int> buf = stackalloc int[8];
for (int i = 0; i < buf.Length; i++)
    buf[i] = i * i;

int sum = 0;
foreach (int v in buf) sum += v;
Console.WriteLine(sum);   // 0+1+4+9+16+25+36+49 = 140

// Span slicing — still on the stack
Span<int> middle = buf[2..6];
Console.WriteLine(middle[0]);  // 4`,
    explanation:
      "stackalloc with Span<T> allocates on the stack without requiring the unsafe keyword — the Span wrapper enforces bounds checking and prevents the pointer from escaping the method, making it safe for high-performance temporary buffers.",
  },
  {
    id: "cs-index-from-end",
    language: "csharp",
    title: "Index (^n) — index from the end of a collection",
    tag: "snippet",
    code: `int[] arr = { 10, 20, 30, 40, 50 };

Console.WriteLine(arr[^1]);   // 50  — last element
Console.WriteLine(arr[^2]);   // 40  — second to last
Console.WriteLine(arr[^arr.Length]);  // 10  — first element

// Range with ^ from end
int[] last3 = arr[^3..];
Console.WriteLine(string.Join(",", last3));   // 30,40,50

// Works on any type that implements the right indexer
string s = "Hello";
Console.WriteLine(s[^1]);   // o`,
    explanation:
      "The ^ operator creates a System.Index that counts from the end — ^1 is the last element, ^2 second-to-last, etc.; combined with .. you can express all standard slicing patterns without manual length arithmetic.",
  },
];
