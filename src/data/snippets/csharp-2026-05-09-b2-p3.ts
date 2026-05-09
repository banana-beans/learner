import type { Snippet } from "./types";

export const csharpSnippets20260509B2P3: Snippet[] = [
  {
    id: "cs-families-reflection-basics",
    language: "csharp",
    title: "Reflection: inspect and invoke members at runtime",
    tag: "families",
    code: `using System.Reflection;

class Calculator
{
    public int Add(int a, int b) => a + b;
    private string _name = "calc";
}

Type t = typeof(Calculator);
var methods = t.GetMethods(BindingFlags.Public | BindingFlags.Instance);
Console.WriteLine(string.Join(", ", methods.Select(m => m.Name)));

// Invoke a method dynamically
var calc = new Calculator();
var result = t.GetMethod("Add")!.Invoke(calc, new object[] { 3, 4 });
Console.WriteLine(result);   // 7

// Access private field
var field = t.GetField("_name", BindingFlags.NonPublic | BindingFlags.Instance);
Console.WriteLine(field!.GetValue(calc));   // calc`,
    explanation: "Reflection accesses types, members, and values at runtime; it's useful for plugin systems, serialisers, and ORMs. GetMethod/GetField require BindingFlags to access non-public or static members.",
  },
  {
    id: "cs-families-options-pattern",
    language: "csharp",
    title: "IOptions<T> pattern for typed configuration",
    tag: "families",
    code: `using Microsoft.Extensions.Options;

class DatabaseOptions
{
    public string Host    { get; set; } = "localhost";
    public int    Port    { get; set; } = 5432;
    public string DbName  { get; set; } = "";
}

class DbService(IOptions<DatabaseOptions> opts)
{
    private readonly DatabaseOptions _cfg = opts.Value;

    public string ConnectionString
        => $"Host={_cfg.Host};Port={_cfg.Port};Database={_cfg.DbName}";
}

// Registration (in Program.cs / Startup.cs):
// builder.Services.Configure<DatabaseOptions>(
//     builder.Configuration.GetSection("Database"));
Console.WriteLine("IOptions pattern: inject, don't read config directly");`,
    explanation: "IOptions<T> injects strongly-typed configuration into services; it's injected rather than read directly from IConfiguration, enabling validation, snapshot (IOptionsSnapshot<T>), and monitor (IOptionsMonitor<T>) variants.",
  },
  {
    id: "cs-classes-decorator-pattern",
    language: "csharp",
    title: "Decorator pattern wraps a class to add behaviour",
    tag: "classes",
    code: `interface IMessageSender
{
    Task SendAsync(string message);
}

class SmtpSender : IMessageSender
{
    public Task SendAsync(string message)
    {
        Console.WriteLine($"SMTP: {message}");
        return Task.CompletedTask;
    }
}

class LoggingDecorator(IMessageSender inner) : IMessageSender
{
    public async Task SendAsync(string message)
    {
        Console.WriteLine($"[LOG] sending: {message}");
        await inner.SendAsync(message);
        Console.WriteLine($"[LOG] sent");
    }
}

IMessageSender sender = new LoggingDecorator(new SmtpSender());
await sender.SendAsync("Hello!");`,
    explanation: "The Decorator wraps an interface implementation to add cross-cutting concerns (logging, caching, retries) without modifying the original class. DI containers can stack multiple decorators automatically.",
  },
  {
    id: "cs-classes-factory-method",
    language: "csharp",
    title: "Factory Method pattern defers instantiation to subclasses",
    tag: "classes",
    code: `abstract class Notification
{
    // Factory method
    protected abstract INotificationChannel CreateChannel();

    public void Send(string message)
    {
        var channel = CreateChannel();
        channel.Deliver(message);
    }
}

interface INotificationChannel { void Deliver(string msg); }

class EmailNotification : Notification
{
    protected override INotificationChannel CreateChannel()
        => new EmailChannel();
}

class EmailChannel : INotificationChannel
{
    public void Deliver(string msg) => Console.WriteLine($"Email: {msg}");
}

Notification n = new EmailNotification();
n.Send("Hello!");   // Email: Hello!`,
    explanation: "The Factory Method defines an interface for creating objects but lets subclasses decide which class to instantiate; the base class works with the interface, remaining decoupled from concrete types.",
  },
  {
    id: "cs-classes-command-pattern",
    language: "csharp",
    title: "Command pattern encapsulates an operation as an object",
    tag: "classes",
    code: `interface ICommand { void Execute(); void Undo(); }

class TextEditor
{
    private string _text = "";
    private readonly Stack<ICommand> _history = new();

    public void Do(ICommand cmd) { cmd.Execute(); _history.Push(cmd); }
    public void Undo() { if (_history.TryPop(out var cmd)) cmd.Undo(); }
    public string Text => _text;

    public class AppendCommand(TextEditor ed, string txt) : ICommand
    {
        public void Execute() => ed._text += txt;
        public void Undo()    => ed._text = ed._text[..^txt.Length];
    }
}

var ed = new TextEditor();
ed.Do(new TextEditor.AppendCommand(ed, "Hello"));
ed.Do(new TextEditor.AppendCommand(ed, " World"));
Console.WriteLine(ed.Text);   // Hello World
ed.Undo();
Console.WriteLine(ed.Text);   // Hello`,
    explanation: "The Command pattern wraps an operation and its inverse in an object; storing commands in a history stack enables unlimited undo/redo. It decouples the invoker from the receiver.",
  },
  {
    id: "cs-snippet-string-span-split",
    language: "csharp",
    title: "StringSplitOptions removes empty entries or whitespace",
    tag: "snippet",
    code: `string csv = "alice,,bob,  ,carol";

// Default: keeps empty entries
var raw = csv.Split(',');
Console.WriteLine(raw.Length);   // 5

// RemoveEmptyEntries drops empty strings
var clean = csv.Split(',', StringSplitOptions.RemoveEmptyEntries);
Console.WriteLine(clean.Length);  // 4 (still includes "  ")

// TrimEntries + RemoveEmptyEntries (C# 8+)
var trimmed = csv.Split(',',
    StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
Console.WriteLine(trimmed.Length);          // 3
Console.WriteLine(string.Join("|", trimmed)); // alice|bob|carol`,
    explanation: "StringSplitOptions.RemoveEmptyEntries discards zero-length entries; TrimEntries (C# 8+) whitespace-trims each piece before the empty check. Combine them with | to get clean, compact split results.",
  },
  {
    id: "cs-understanding-async-state",
    language: "csharp",
    title: "async/await compiles to a state machine",
    tag: "understanding",
    code: `// This async method:
async Task<int> ComputeAsync()
{
    int a = await Task.FromResult(1);
    int b = await Task.FromResult(2);
    return a + b;
}

// Compiles to roughly:
// class ComputeAsync_StateMachine : IAsyncStateMachine
// {
//     int _state, _a, _b;
//     void MoveNext() {
//         switch (_state) {
//             case 0: await Task 1, _state = 1; return;
//             case 1: _a = result; await Task 2, _state = 2; return;
//             case 2: _b = result; _builder.SetResult(_a + _b); break;
//         }
//     }
// }

Console.WriteLine(await ComputeAsync());  // 3`,
    explanation: "The C# compiler transforms async methods into a state machine class; each await becomes a state transition. Understanding this explains why async has allocation overhead and why async void is problematic.",
  },
  {
    id: "cs-structures-object-pool",
    language: "csharp",
    title: "ObjectPool<T> reuses expensive objects to reduce allocations",
    tag: "structures",
    code: `using Microsoft.Extensions.ObjectPool;

// ObjectPool from Microsoft.Extensions.ObjectPool NuGet
var policy = new DefaultPooledObjectPolicy<System.Text.StringBuilder>();
var pool   = new DefaultObjectPool<System.Text.StringBuilder>(policy);

// Rent from pool (creates new if none available)
var sb = pool.Get();
try
{
    sb.Append("Hello");
    sb.Append(", World!");
    Console.WriteLine(sb.ToString());
}
finally
{
    // Return to pool (Clear() is called by policy)
    pool.Return(sb);
}`,
    explanation: "Object pooling amortises the cost of expensive allocations (StringBuilder, MemoryStream, large byte arrays) by reusing instances; always return in a finally block and never use a returned object.",
  },
  {
    id: "cs-structures-array-segment",
    language: "csharp",
    title: "ArraySegment<T> is a slice view of an array",
    tag: "structures",
    code: `int[] data = { 0, 1, 2, 3, 4, 5, 6, 7 };

// ArraySegment: zero-allocation view into a portion of the array
var seg = new ArraySegment<int>(data, offset: 2, count: 4);

Console.WriteLine(seg.Count);       // 4
Console.WriteLine(seg[0]);          // 2 (relative to offset)
Console.WriteLine(seg.Array![2]);   // 2 (absolute index)

// Slicing preserves the reference
var sub = seg.Slice(1, 2);          // [3, 4]
Console.WriteLine(sub[0]);          // 3

// Prefer Span<T> for new code; ArraySegment is older API`,
    explanation: "ArraySegment<T> wraps an array with an offset and count, providing a windowed view without copying; it's the older API used by some socket and stream methods. Prefer Span<T> for new code.",
  },
  {
    id: "cs-caveats-async-constructor",
    language: "csharp",
    title: "Constructors can't be async -- use a static factory instead",
    tag: "caveats",
    code: `// INVALID: constructors can't be async
// class Service
// {
//     public Service()
//     {
//         await InitAsync();  // CS4032: can't await here
//     }
// }

// SOLUTION: async static factory method
class Service
{
    private Service() { }

    public static async Task<Service> CreateAsync()
    {
        var svc = new Service();
        await svc.InitAsync();
        return svc;
    }

    private Task InitAsync() => Task.CompletedTask;
}

var svc = await Service.CreateAsync();`,
    explanation: "Constructors are synchronous by language design; the fix is a private constructor plus an async static factory method. This pattern also makes it obvious at the call site that construction involves I/O.",
  },
  {
    id: "cs-caveats-ref-out-semantics",
    language: "csharp",
    title: "ref vs out vs in parameter modifiers",
    tag: "caveats",
    code: `// ref: caller initialises, method may read and write
void Increment(ref int x) => x++;
int a = 5; Increment(ref a); Console.WriteLine(a);  // 6

// out: method must assign before returning; caller need not initialise
bool TryParse(string s, out int result)
{
    result = 0;
    return int.TryParse(s, out result);
}
TryParse("42", out int v); Console.WriteLine(v);   // 42

// in: read-only reference (avoids copy for large structs)
static double Length(in System.Numerics.Vector3 v)
    => Math.Sqrt(v.X*v.X + v.Y*v.Y + v.Z*v.Z);`,
    explanation: "ref passes by reference (must be initialised); out is write-only on entry (method must set it); in passes a read-only reference, avoiding the copy cost for large structs while preventing mutation.",
  },
  {
    id: "cs-caveats-overflow-unchecked",
    language: "csharp",
    title: "unchecked context suppresses overflow exceptions",
    tag: "caveats",
    code: `// Default (unchecked): wraps silently
int maxInt = int.MaxValue;
int wrapped = maxInt + 1;
Console.WriteLine(wrapped);   // -2147483648

// checked block: throws OverflowException
try
{
    int safe = checked(maxInt + 1);
}
catch (OverflowException) { Console.WriteLine("overflow caught"); }

// unchecked block: explicit opt-in to wrapping
int hash = unchecked(maxInt * 2 + 17);   // intentional wrap for hashing
Console.WriteLine(hash);`,
    explanation: "C# defaults to unchecked arithmetic (silent wrap); use checked for safety-critical calculations and explicit unchecked when wrapping is intentional (hash functions, bit manipulation).",
  },
  {
    id: "cs-types-abstract-record",
    language: "csharp",
    title: "Abstract record simulates a discriminated union",
    tag: "types",
    code: `abstract record Shape;
record Circle(double Radius) : Shape;
record Rectangle(double W, double H) : Shape;
record Triangle(double Base, double Height) : Shape;

static double Area(Shape s) => s switch
{
    Circle c      => Math.PI * c.Radius * c.Radius,
    Rectangle r   => r.W * r.H,
    Triangle t    => 0.5 * t.Base * t.Height,
    _             => throw new NotImplementedException()
};

Console.WriteLine(Area(new Circle(5)));          // 78.54
Console.WriteLine(Area(new Rectangle(3, 4)));    // 12
Console.WriteLine(Area(new Triangle(6, 4)));     // 12`,
    explanation: "An abstract record base with concrete record subclasses models a discriminated union; switch expressions with positional patterns provide exhaustive matching, and the compiler warns if a case is missing.",
  },
  {
    id: "cs-types-json-attributes",
    language: "csharp",
    title: "System.Text.Json attributes control serialisation",
    tag: "types",
    code: `using System.Text.Json;
using System.Text.Json.Serialization;

class User
{
    [JsonPropertyName("user_name")]
    public string Name { get; set; } = "";

    [JsonIgnore]
    public string Password { get; set; } = "";

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public UserRole Role { get; set; }
}

enum UserRole { Admin, Member }

var user = new User { Name = "Alice", Password = "secret", Role = UserRole.Admin };
var json = JsonSerializer.Serialize(user);
Console.WriteLine(json);
// {"user_name":"Alice","Role":"Admin"}  -- Password excluded`,
    explanation: "[JsonPropertyName] overrides the JSON key; [JsonIgnore] excludes a property; [JsonConverter] customises value serialisation. These attributes are evaluated at runtime and have no allocation overhead when used with source generation.",
  },
  {
    id: "cs-types-generic-math",
    language: "csharp",
    title: "IAdditionOperators<T,T,T> in generic math (.NET 7+)",
    tag: "types",
    code: `using System.Numerics;

// Write numeric algorithms that work for int, double, decimal, etc.
static T Sum<T>(IEnumerable<T> items) where T : INumber<T>
    => items.Aggregate(T.Zero, (acc, x) => acc + x);

static T Average<T>(IEnumerable<T> items) where T : INumber<T>
{
    var list = items.ToList();
    return Sum(list) / T.CreateChecked(list.Count);
}

Console.WriteLine(Sum(new[] { 1, 2, 3, 4, 5 }));       // 15
Console.WriteLine(Average(new[] { 1.0, 2.0, 3.0 }));   // 2`,
    explanation: "INumber<T> and related interfaces (IAdditionOperators, IComparisonOperators) allow writing numeric algorithms once that work for all numeric types; the JIT specialises them per type with no boxing.",
  },
  {
    id: "cs-families-xunit-patterns",
    language: "csharp",
    title: "xUnit: [Fact], [Theory], and [InlineData]",
    tag: "families",
    code: `using Xunit;

public class MathTests
{
    [Fact]
    public void Add_TwoPositives_ReturnsSum()
    {
        Assert.Equal(5, 2 + 3);
    }

    [Theory]
    [InlineData(2, 3, 5)]
    [InlineData(0, 0, 0)]
    [InlineData(-1, 1, 0)]
    public void Add_Parametrised(int a, int b, int expected)
    {
        Assert.Equal(expected, a + b);
    }

    [Fact]
    public void Throws_OnDivideByZero()
    {
        Assert.Throws<DivideByZeroException>(() => _ = 1 / 0);
    }
}`,
    explanation: "[Fact] is a single test; [Theory] with [InlineData] runs the same test logic with multiple input sets. Assert.Throws<T> verifies that a specific exception is raised.",
  },
  {
    id: "cs-families-moq-mocking",
    language: "csharp",
    title: "Moq: mock interfaces for unit testing",
    tag: "families",
    code: `using Moq;
using Xunit;

interface IEmailService { Task SendAsync(string to, string subject); }

class UserRegistration(IEmailService emailSvc)
{
    public async Task Register(string email)
    {
        // ... save user ...
        await emailSvc.SendAsync(email, "Welcome!");
    }
}

public class RegistrationTests
{
    [Fact]
    public async Task Register_SendsWelcomeEmail()
    {
        var mock = new Mock<IEmailService>();
        mock.Setup(s => s.SendAsync(It.IsAny<string>(), It.IsAny<string>()))
            .Returns(Task.CompletedTask);

        await new UserRegistration(mock.Object).Register("a@b.com");

        mock.Verify(s => s.SendAsync("a@b.com", "Welcome!"), Times.Once);
    }
}`,
    explanation: "Moq creates in-memory implementations of interfaces; Setup configures return values, Verify asserts call expectations. This isolates the class under test from real I/O dependencies.",
  },
  {
    id: "cs-families-benchmark-dotnet",
    language: "csharp",
    title: "BenchmarkDotNet measures code performance accurately",
    tag: "families",
    code: `using BenchmarkDotNet.Attributes;
using BenchmarkDotNet.Running;

[MemoryDiagnoser]
public class StringBenchmark
{
    private const int N = 1000;

    [Benchmark]
    public string Concat()
    {
        string s = "";
        for (int i = 0; i < N; i++) s += i;
        return s;
    }

    [Benchmark]
    public string StringBuilder()
    {
        var sb = new System.Text.StringBuilder();
        for (int i = 0; i < N; i++) sb.Append(i);
        return sb.ToString();
    }
}

// BenchmarkRunner.Run<StringBenchmark>();
// Produces: mean time, allocations, GC count`,
    explanation: "BenchmarkDotNet runs each [Benchmark] method thousands of times with warmup, provides statistically sound mean/median, and with [MemoryDiagnoser] measures allocation per operation. Never benchmark in Debug mode.",
  },
  {
    id: "cs-classes-generic-repository",
    language: "csharp",
    title: "Generic repository pattern with EF Core",
    tag: "classes",
    code: `using Microsoft.EntityFrameworkCore;

interface IRepository<T> where T : class
{
    Task<T?> GetByIdAsync(int id);
    Task AddAsync(T entity);
    Task SaveChangesAsync();
}

class EfRepository<T>(DbContext ctx) : IRepository<T> where T : class
{
    private readonly DbSet<T> _set = ctx.Set<T>();

    public Task<T?> GetByIdAsync(int id)    => _set.FindAsync(id).AsTask();
    public Task     AddAsync(T entity)       => _set.AddAsync(entity).AsTask();
    public Task     SaveChangesAsync()       => ctx.SaveChangesAsync();
}

// Usage:
// IRepository<User> repo = new EfRepository<User>(dbContext);
// await repo.AddAsync(new User { Name = "Alice" });
// await repo.SaveChangesAsync();`,
    explanation: "A generic repository wraps EF Core's DbSet<T> behind an interface, enabling unit testing with mocked repositories and abstracting the persistence technology from domain logic.",
  },
  {
    id: "cs-snippet-index-range-types",
    language: "csharp",
    title: "Index and Range as first-class types",
    tag: "snippet",
    code: `int[] arr = { 0, 1, 2, 3, 4, 5 };

// Index type
Index last  = ^1;
Index third = 2;
Console.WriteLine(arr[last]);    // 5
Console.WriteLine(arr[third]);   // 2

// Range type
Range middle = 1..4;
Console.WriteLine(string.Join(",", arr[middle]));   // 1,2,3

// Ranges in methods
ReadOnlySpan<int> span = arr.AsSpan(1..4);
Console.WriteLine(span[0]);   // 1`,
    explanation: "Index and Range are first-class types that can be stored in variables and passed to methods; ^ is syntactic sugar for new Index(n, fromEnd: true) and a..b for new Range(a, b).",
  },
  {
    id: "cs-understanding-threadlocal",
    language: "csharp",
    title: "ThreadLocal<T> gives each thread its own value",
    tag: "understanding",
    code: `using System.Threading;

var counter = new ThreadLocal<int>(() => 0);

var threads = Enumerable.Range(0, 5).Select(id =>
    new Thread(() =>
    {
        for (int i = 0; i < 1000; i++) counter.Value++;
        Console.WriteLine($"Thread {id}: {counter.Value}");
    })
).ToList();

threads.ForEach(t => t.Start());
threads.ForEach(t => t.Join());
// Each thread prints 1000 -- values are completely independent`,
    explanation: "ThreadLocal<T> initialises a separate value per thread; reads and writes are not shared across threads. Use it to avoid locking on per-thread accumulators like counters, StringBuilder, or random number generators.",
  },
];
