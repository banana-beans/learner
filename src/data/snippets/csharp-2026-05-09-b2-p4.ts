import type { Snippet } from "./types";

export const csharpSnippets20260509B2P4: Snippet[] = [
  {
    id: "cs-snippet-global-using",
    language: "csharp",
    title: "global using removes per-file repetition",
    tag: "snippet",
    code: `// GlobalUsings.cs -- applied to every file in the project
global using System;
global using System.Collections.Generic;
global using System.Linq;
global using System.Threading.Tasks;

// With global usings, other files need no using directives for these:

// Program.cs
var nums = new List<int> { 1, 2, 3 };
var evens = nums.Where(n => n % 2 == 0).ToList();
Console.WriteLine(string.Join(",", evens));   // 2

// SDK-style projects (.NET 6+) add common global usings automatically
// via <ImplicitUsings>enable</ImplicitUsings> in .csproj`,
    explanation: "global using (C# 10) applies a using directive to all files in the compilation unit, eliminating boilerplate at the top of every file. Create a dedicated GlobalUsings.cs for organisation.",
  },
  {
    id: "cs-snippet-interpolated-handler",
    language: "csharp",
    title: "Custom interpolated string handler for efficient logging",
    tag: "snippet",
    code: `using System.Runtime.CompilerServices;

// Logger that skips interpolation when log level is off
class Logger
{
    private readonly bool _debug = true;

    public void Log([InterpolatedStringHandlerArgument("")] LogHandler handler)
    {
        if (_debug) Console.WriteLine(handler.GetResult());
    }

    [InterpolatedStringHandler]
    public ref struct LogHandler(int literalLen, int formattedCount, Logger logger)
    {
        private System.Text.StringBuilder? _sb;
        public bool IsEnabled { get; } = logger._debug;

        public void AppendLiteral(string s)  => (_sb ??= new()).Append(s);
        public void AppendFormatted<T>(T v)  => (_sb ??= new()).Append(v);
        public string GetResult() => _sb?.ToString() ?? "";
    }
}`,
    explanation: "Custom interpolated string handlers (C# 10) receive individual literal and formatted segments before the string is built; if the log level is off, the handler can short-circuit and avoid all allocations.",
  },
  {
    id: "cs-caveats-null-propagation-assign",
    language: "csharp",
    title: "Null-conditional ?. cannot appear on the left side of assignment",
    tag: "caveats",
    code: `class Node { public Node? Next; public int Value; }

var n = new Node { Value = 1, Next = new Node { Value = 2 } };

// OK: read through null-conditional
int? v = n?.Next?.Value;
Console.WriteLine(v);   // 2

// NOT valid: can't assign through ?.
// n?.Next?.Value = 99;  // CS0131: left-hand side is not a variable

// Fix: null check then assign
if (n.Next != null)
    n.Next.Value = 99;

Console.WriteLine(n.Next?.Value);   // 99`,
    explanation: "The null-conditional operator produces a temporary value, not a storage location; assignment requires an lvalue. Use an explicit null check to guard the assignment.",
  },
  {
    id: "cs-understanding-pinvoke",
    language: "csharp",
    title: "P/Invoke calls native library functions",
    tag: "understanding",
    code: `using System.Runtime.InteropServices;

// Import a function from a native shared library
[DllImport("libc", EntryPoint = "getpid")]
static extern int GetPid();

// On Windows: kernel32.dll
[DllImport("kernel32.dll", SetLastError = true)]
static extern uint GetCurrentThreadId();

Console.WriteLine(GetPid());            // process ID (Unix)
// Console.WriteLine(GetCurrentThreadId()); // thread ID (Windows)

// Struct marshalling
[StructLayout(LayoutKind.Sequential)]
struct Point { public int X; public int Y; }`,
    explanation: "P/Invoke ([DllImport]) declares a managed stub that calls a native function; the runtime marshals parameters between managed and unmanaged conventions. SetLastError=true preserves the native error code for Marshal.GetLastWin32Error().",
  },
  {
    id: "cs-understanding-unsafe-fixed",
    language: "csharp",
    title: "unsafe and fixed: direct memory access",
    tag: "understanding",
    code: `// Compile with: <AllowUnsafeBlocks>true</AllowUnsafeBlocks>
unsafe void ProcessArray(int[] data)
{
    // fixed: pin the array so GC doesn't move it
    fixed (int* ptr = data)
    {
        for (int i = 0; i < data.Length; i++)
            ptr[i] *= 2;
    }
}

int[] arr = { 1, 2, 3, 4, 5 };
unsafe { ProcessArray(arr); }
Console.WriteLine(string.Join(",", arr));   // 2,4,6,8,10

// Prefer Span<T> for most cases -- no unsafe needed`,
    explanation: "unsafe code allows pointer arithmetic; fixed pins a managed object in memory so the GC can't relocate it during native operations. This is rarely needed; prefer Span<T>/Memory<T> for most zero-copy scenarios.",
  },
  {
    id: "cs-structures-pipeline",
    language: "csharp",
    title: "System.IO.Pipelines for high-throughput I/O",
    tag: "structures",
    code: `using System.IO.Pipelines;
using System.Text;

async Task WriteToPipe(PipeWriter writer)
{
    var bytes = Encoding.UTF8.GetBytes("hello pipeline");
    await writer.WriteAsync(bytes);
    await writer.CompleteAsync();
}

async Task ReadFromPipe(PipeReader reader)
{
    while (true)
    {
        var result = await reader.ReadAsync();
        var buf = result.Buffer;
        Console.WriteLine(Encoding.UTF8.GetString(buf));
        reader.AdvanceTo(buf.End);
        if (result.IsCompleted) break;
    }
}

var pipe = new Pipe();
await Task.WhenAll(WriteToPipe(pipe.Writer), ReadFromPipe(pipe.Reader));`,
    explanation: "System.IO.Pipelines provides backpressure-aware, zero-copy I/O between a producer and consumer; the PipeWriter allocates buffer segments from a pool and PipeReader processes them without intermediate copies.",
  },
  {
    id: "cs-structures-memory-mapped",
    language: "csharp",
    title: "MemoryMappedFile for large file access",
    tag: "structures",
    code: `using System.IO.MemoryMappedFiles;
using System.Text;

// Write a memory-mapped file
using (var mmf = MemoryMappedFile.CreateNew("mymap", 1024))
using (var accessor = mmf.CreateViewAccessor())
{
    byte[] data = Encoding.UTF8.GetBytes("Hello, Memory!");
    accessor.WriteArray(0, data, 0, data.Length);
}

// Read back
using (var mmf = MemoryMappedFile.OpenExisting("mymap"))
using (var accessor = mmf.CreateViewAccessor())
{
    byte[] buf = new byte[14];
    accessor.ReadArray(0, buf, 0, 14);
    Console.WriteLine(Encoding.UTF8.GetString(buf));  // Hello, Memory!
}`,
    explanation: "Memory-mapped files let the OS page file content into memory on demand; multiple processes can share the same mapping (IPC) and large files can be accessed without reading them entirely into RAM.",
  },
  {
    id: "cs-caveats-closure-foreach",
    language: "csharp",
    title: "In C# 5+ foreach variable is captured per-iteration",
    tag: "caveats",
    code: `// C# 4 and earlier: foreach captured the loop variable (shared!)
// var actions = new List<Action>();
// foreach (var i in new[] {0,1,2})
//     actions.Add(() => Console.Write(i));   // printed "2 2 2"

// C# 5+: foreach captures a fresh copy per iteration
var actions = new List<Action>();
foreach (var i in new[] { 0, 1, 2 })
    actions.Add(() => Console.Write(i + " "));   // 0 1 2

actions.ForEach(a => a());   // 0 1 2  (correct in C# 5+)

// for loop still has the old behaviour:
var acts2 = new List<Action>();
for (int j = 0; j < 3; j++)
    acts2.Add(() => Console.Write(j + " "));   // still 3 3 3!
acts2.ForEach(a => a());`,
    explanation: "C# 5 changed foreach to introduce a new variable per iteration, fixing the classic closure bug. A regular for loop still uses a single shared variable; introduce a local copy inside the body if needed.",
  },
  {
    id: "cs-types-open-generic",
    language: "csharp",
    title: "Open generic types: typeof(List<>) at runtime",
    tag: "types",
    code: `// Closed generic: specific type argument supplied
Type closed = typeof(List<int>);
Console.WriteLine(closed.IsGenericType);           // True
Console.WriteLine(closed.IsGenericTypeDefinition); // False

// Open generic: no type argument
Type open = typeof(List<>);
Console.WriteLine(open.IsGenericTypeDefinition);   // True

// Close an open generic at runtime
Type closedAtRuntime = open.MakeGenericType(typeof(string));
var list = (System.Collections.IList)Activator.CreateInstance(closedAtRuntime)!;
list.Add("hello");
Console.WriteLine(list[0]);   // hello`,
    explanation: "An open generic type (typeof(List<>)) has no type arguments; MakeGenericType closes it at runtime. This enables generic DI containers and serialisers that must work with arbitrary type arguments.",
  },
  {
    id: "cs-types-contravariant-in",
    language: "csharp",
    title: "Custom contravariant interface with in T",
    tag: "types",
    code: `interface IConsumer<in T>   // T only appears in input position
{
    void Consume(T item);
}

class ObjectConsumer : IConsumer<object>
{
    public void Consume(object item) => Console.WriteLine(item);
}

// Contravariance: IConsumer<object> -> IConsumer<string>
IConsumer<string> c = new ObjectConsumer();  // safe: can handle any object
c.Consume("hello");   // hello

// INVALID: can't use in T in output position
// interface IBad<in T> { T Produce(); }  // CS1965`,
    explanation: "in T makes an interface contravariant; T can only appear as a method parameter (input). This lets you assign IConsumer<object> to IConsumer<string> because a consumer of any object can surely consume a string.",
  },
  {
    id: "cs-classes-template-override",
    language: "csharp",
    title: "Template method: base class skeleton, subclass steps",
    tag: "classes",
    code: `abstract class ReportGenerator
{
    // Template method: defines the algorithm
    public void Generate()
    {
        FetchData();
        Transform();
        Format();
        Deliver();
    }

    protected abstract void FetchData();
    protected abstract void Transform();
    protected virtual  void Format()  => Console.WriteLine("Default format");
    protected virtual  void Deliver() => Console.WriteLine("Console delivery");
}

class PdfReport : ReportGenerator
{
    protected override void FetchData()  => Console.WriteLine("DB query");
    protected override void Transform()  => Console.WriteLine("Aggregate");
    protected override void Format()     => Console.WriteLine("PDF render");
    protected override void Deliver()    => Console.WriteLine("Email PDF");
}

new PdfReport().Generate();`,
    explanation: "The Template Method defines the algorithm skeleton in the base class; abstract steps must be implemented, virtual steps can be overridden. It enforces the overall flow while allowing subclasses to vary the details.",
  },
  {
    id: "cs-structures-native-memory",
    language: "csharp",
    title: "NativeMemory.Alloc for unmanaged heap allocation",
    tag: "structures",
    code: `using System.Runtime.InteropServices;

// Allocate unmanaged memory (outside GC heap)
unsafe
{
    int count = 1024;
    int* buf = (int*)NativeMemory.Alloc((nuint)(count * sizeof(int)));
    try
    {
        for (int i = 0; i < count; i++) buf[i] = i;
        Console.WriteLine(buf[0] + " " + buf[count-1]);  // 0 1023
    }
    finally
    {
        NativeMemory.Free(buf);   // MUST free -- not GC-managed
    }
}`,
    explanation: "NativeMemory.Alloc (.NET 6+) allocates from the native heap bypassing the GC; it's faster than new for large buffers that must not move. Always free in a finally block to avoid memory leaks.",
  },
  {
    id: "cs-families-di-registration",
    language: "csharp",
    title: "DI lifetimes: Transient, Scoped, Singleton",
    tag: "families",
    code: `using Microsoft.Extensions.DependencyInjection;

var services = new ServiceCollection();

// Transient: new instance every resolve
services.AddTransient<IEmailService, SmtpService>();

// Scoped: one instance per scope (one per HTTP request in ASP.NET)
services.AddScoped<IUserRepository, SqlUserRepository>();

// Singleton: one instance for the application lifetime
services.AddSingleton<ICache, MemoryCache>();

var provider = services.BuildServiceProvider();
var svc = provider.GetRequiredService<IEmailService>();

interface IEmailService { }
class SmtpService : IEmailService { }
interface IUserRepository { }
class SqlUserRepository : IUserRepository { }
interface ICache { }
class MemoryCache : ICache { }`,
    explanation: "Transient is safe for stateless services; Scoped ties lifetime to a request or operation scope (never inject Scoped into Singleton); Singleton is reused throughout the app and must be thread-safe.",
  },
  {
    id: "cs-families-configuration-bind",
    language: "csharp",
    title: "IConfiguration.Bind maps appsettings.json to a class",
    tag: "families",
    code: `using Microsoft.Extensions.Configuration;

// appsettings.json:
// { "Database": { "Host": "localhost", "Port": 5432 } }

var config = new ConfigurationBuilder()
    .AddJsonFile("appsettings.json")
    .AddEnvironmentVariables()
    .Build();

class DbOptions { public string Host { get; set; } = ""; public int Port { get; set; } }

var opts = new DbOptions();
config.GetSection("Database").Bind(opts);
Console.WriteLine($"{opts.Host}:{opts.Port}");   // localhost:5432

// Or with Get<T>:
var opts2 = config.GetSection("Database").Get<DbOptions>();`,
    explanation: "IConfiguration.Bind populates a POCO from a configuration section; Get<T> is a shorthand. Environment variables with double-underscore separators override JSON file values, following the convention SECTION__KEY.",
  },
  {
    id: "cs-understanding-interlocked",
    language: "csharp",
    title: "Interlocked provides atomic operations without locks",
    tag: "understanding",
    code: `using System.Threading;

int counter = 0;

// Atomic increment: no lock needed, no lost updates
var tasks = Enumerable.Range(0, 100)
    .Select(_ => Task.Run(() =>
    {
        for (int i = 0; i < 1000; i++)
            Interlocked.Increment(ref counter);
    }));

await Task.WhenAll(tasks);
Console.WriteLine(counter);   // always 100000

// Other atomic ops
long total = Interlocked.Add(ref counter, 5);      // add and return new value
int prev   = Interlocked.Exchange(ref counter, 0); // set and return old value
int old    = Interlocked.CompareExchange(ref counter, 10, 0); // CAS`,
    explanation: "Interlocked methods use CPU atomic instructions (lock xadd, cmpxchg) for thread-safe operations on primitives without acquiring a lock; faster than lock for simple counters and flags.",
  },
  {
    id: "cs-caveats-idisposable-using",
    language: "csharp",
    title: "Always use using or try/finally for IDisposable",
    tag: "caveats",
    code: `// BAD: if an exception occurs before Close(), resource leaks
System.IO.FileStream fs = System.IO.File.OpenRead("data.bin");
// ... exception here -> fs never closed!
fs.Close();

// GOOD: using statement guarantees disposal
using (var fs2 = System.IO.File.OpenRead("data.bin"))
{
    // fs2.Dispose() called even if exception thrown
}

// GOOD: using declaration (C# 8+, scoped to enclosing block)
using var fs3 = System.IO.File.OpenRead("data.bin");
// disposed at end of method`,
    explanation: "Failing to dispose IDisposable objects (streams, connections, handles) leaks OS resources; the using statement/declaration guarantees Dispose is called via a compiler-generated try/finally block.",
  },
  {
    id: "cs-types-record-with-validation",
    language: "csharp",
    title: "record with custom constructor validation",
    tag: "types",
    code: `record EmailAddress
{
    public string Value { get; init; }

    public EmailAddress(string value)
    {
        if (!value.Contains('@'))
            throw new ArgumentException("Invalid email", nameof(value));
        Value = value;
    }
}

var email = new EmailAddress("user@example.com");
Console.WriteLine(email.Value);   // user@example.com

// with copies with re-validation
var copy = email with { Value = "other@example.com" };
Console.WriteLine(copy.Value);

// new EmailAddress("notanemail");  // throws ArgumentException`,
    explanation: "A record with an explicit constructor can validate inputs before assignment; the with expression calls the copy constructor, so changing a property through with also runs the validation.",
  },
  {
    id: "cs-classes-generic-constraint-new",
    language: "csharp",
    title: "where T : new() enables default instantiation in generics",
    tag: "classes",
    code: `class Factory<T> where T : new()
{
    public T Create() => new T();
    public List<T> CreateMany(int count)
        => Enumerable.Range(0, count).Select(_ => new T()).ToList();
}

class Config
{
    public string Host { get; set; } = "localhost";
}

var factory = new Factory<Config>();
var configs  = factory.CreateMany(3);
Console.WriteLine(configs.Count);          // 3
Console.WriteLine(configs[0].Host);        // localhost`,
    explanation: "where T : new() constrains T to have a parameterless constructor; this lets the generic code call new T() without reflection. Combine with interface or base-class constraints for richer generic utilities.",
  },
  {
    id: "cs-families-dapper-query",
    language: "csharp",
    title: "Dapper: micro-ORM for typed SQL queries",
    tag: "families",
    code: `using Dapper;
using System.Data.SqlClient;

class User { public int Id { get; set; } public string Name { get; set; } = ""; }

async Task DapperDemo(string connectionString)
{
    using var conn = new SqlConnection(connectionString);

    // Query maps result to IEnumerable<User>
    var users = await conn.QueryAsync<User>(
        "SELECT Id, Name FROM Users WHERE Age > @Age",
        new { Age = 18 });

    // Execute for INSERT/UPDATE
    int rows = await conn.ExecuteAsync(
        "INSERT INTO Users (Name) VALUES (@Name)",
        new { Name = "Alice" });

    Console.WriteLine(rows);  // 1
}`,
    explanation: "Dapper extends IDbConnection with QueryAsync<T> (maps rows to POCOs) and ExecuteAsync (runs non-query SQL); it's faster than full ORMs for read-heavy workloads with no change tracking overhead.",
  },
  {
    id: "cs-snippet-switch-expr-tuple",
    language: "csharp",
    title: "Switch expression with tuple pattern",
    tag: "snippet",
    code: `static string Direction(int dx, int dy) => (dx, dy) switch
{
    (0,  0) => "stationary",
    (1,  0) => "right",
    (-1, 0) => "left",
    (0,  1) => "up",
    (0, -1) => "down",
    ( > 0, > 0) => "up-right",
    ( < 0, > 0) => "up-left",
    _           => "other",
};

Console.WriteLine(Direction(1, 0));    // right
Console.WriteLine(Direction(2, 3));    // up-right
Console.WriteLine(Direction(-1, -1));  // other`,
    explanation: "Tuple patterns in switch expressions match multiple values simultaneously; relational patterns (> 0, < 0) work inside tuples, enabling concise multi-dimensional dispatch without nested if-else.",
  },
];
