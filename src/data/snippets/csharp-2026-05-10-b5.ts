import type { Snippet } from "./types";

export const csharpSnippets20260510B5: Snippet[] = [
  // ── snippet ──────────────────────────────────────────────────────────────
  {
    id: "cs-resiliency-polly",
    language: "csharp",
    title: "Polly resilience pipeline — retry + circuit breaker",
    tag: "snippet",
    code: `using Polly;
using Polly.CircuitBreaker;

var pipeline = new ResiliencePipelineBuilder<HttpResponseMessage>()
    .AddRetry(new Polly.Retry.RetryStrategyOptions<HttpResponseMessage>
    {
        MaxRetryAttempts = 3,
        Delay            = TimeSpan.FromSeconds(1),
        BackoffType      = DelayBackoffType.Exponential,
        ShouldHandle     = new PredicateBuilder<HttpResponseMessage>()
            .Handle<HttpRequestException>()
    })
    .AddCircuitBreaker(new CircuitBreakerStrategyOptions<HttpResponseMessage>
    {
        FailureRatio      = 0.5,
        SamplingDuration  = TimeSpan.FromSeconds(10),
        MinimumThroughput = 5,
    })
    .Build();

var response = await pipeline.ExecuteAsync(
    ct => httpClient.GetAsync("/api/data", ct), CancellationToken.None);`,
    explanation:
      "Polly v8 uses a ResiliencePipelineBuilder that combines strategies; retry with exponential backoff retries transient failures; circuit breaker trips when the failure ratio exceeds the threshold within the sampling window.",
  },
  {
    id: "cs-mediator-pattern",
    language: "csharp",
    title: "Mediator with MediatR — request/response",
    tag: "snippet",
    code: `using MediatR;

record CreateOrderCommand(int CustomerId, decimal Total) : IRequest<int>;

class CreateOrderHandler : IRequestHandler<CreateOrderCommand, int>
{
    public async Task<int> Handle(
        CreateOrderCommand req, CancellationToken ct)
    {
        // persist order
        await Task.Delay(1, ct);
        return 42;  // new order id
    }
}

// Usage (via DI):
int orderId = await mediator.Send(new CreateOrderCommand(1, 99.99m));`,
    explanation:
      "MediatR decouples command senders from handlers; IRequest<TResponse> marks the command type; the handler is resolved from DI — no direct reference between caller and handler needed.",
  },
  {
    id: "cs-validation-fluent",
    language: "csharp",
    title: "FluentValidation — chainable validator classes",
    tag: "snippet",
    code: `using FluentValidation;

class CreateUserRequest
{
    public string Name  { get; set; } = "";
    public string Email { get; set; } = "";
    public int    Age   { get; set; }
}

class CreateUserValidator : AbstractValidator<CreateUserRequest>
{
    public CreateUserValidator()
    {
        RuleFor(r => r.Name).NotEmpty().MaximumLength(100);
        RuleFor(r => r.Email).NotEmpty().EmailAddress();
        RuleFor(r => r.Age).InclusiveBetween(18, 120);
    }
}

var result = new CreateUserValidator().Validate(new CreateUserRequest());
foreach (var e in result.Errors)
    Console.WriteLine(e.ErrorMessage);`,
    explanation:
      "FluentValidation separates validation rules from domain classes using method-chaining DSL; rules compose cleanly, support async validation, and integrate with ASP.NET Core ModelState automatically.",
  },
  {
    id: "cs-ef-core-query",
    language: "csharp",
    title: "Entity Framework Core — query and change tracking",
    tag: "snippet",
    code: `// DbContext:
class AppDb : DbContext
{
    public DbSet<User> Users => Set<User>();
}

// Query — tracked by default:
var users = await db.Users
    .Where(u => u.Age >= 18)
    .OrderBy(u => u.Name)
    .Take(20)
    .ToListAsync();

// No-tracking query (read-only, faster):
var readOnly = await db.Users
    .AsNoTracking()
    .FirstOrDefaultAsync(u => u.Id == id);

// Projection — select specific columns:
var names = await db.Users.Select(u => u.Name).ToListAsync();`,
    explanation:
      "AsNoTracking disables the identity map and change tracker, reducing memory and improving read-only query throughput by ~20-30%; always use it for queries that don't feed into SaveChangesAsync.",
  },
  {
    id: "cs-signalr-hub",
    language: "csharp",
    title: "SignalR Hub — real-time bidirectional communication",
    tag: "snippet",
    code: `using Microsoft.AspNetCore.SignalR;

class ChatHub : Hub
{
    public async Task SendMessage(string user, string message) =>
        await Clients.All.SendAsync("ReceiveMessage", user, message);

    public async Task JoinGroup(string group)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, group);
        await Clients.Group(group).SendAsync("Joined", Context.ConnectionId);
    }
}

// Client (JS):
// connection.on("ReceiveMessage", (user, msg) => console.log(user, msg));
// await connection.invoke("SendMessage", "Alice", "Hello!");`,
    explanation:
      "SignalR Hubs expose server methods clients can invoke; Clients.All, Clients.Caller, Clients.Group, and Clients.Others target different subsets; Groups manage named broadcast channels.",
  },
  {
    id: "cs-grpc-service",
    language: "csharp",
    title: "gRPC service implementation (.NET)",
    tag: "snippet",
    code: `// greeter.proto:
// service Greeter { rpc SayHello (HelloRequest) returns (HelloReply); }

using Grpc.Core;

class GreeterService : Greeter.GreeterBase
{
    public override Task<HelloReply> SayHello(
        HelloRequest request, ServerCallContext ctx) =>
        Task.FromResult(new HelloReply
        {
            Message = \$"Hello {request.Name}"
        });
}

// Registration in Program.cs:
// app.MapGrpcService<GreeterService>();`,
    explanation:
      "gRPC services inherit from the generated Base class; the proto contract is the single source of truth for request/response types; gRPC provides streaming, deadlines, and metadata out of the box.",
  },
  {
    id: "cs-health-check",
    language: "csharp",
    title: "Health checks — liveness and readiness probes",
    tag: "snippet",
    code: `builder.Services.AddHealthChecks()
    .AddCheck("self",   () => HealthCheckResult.Healthy())
    .AddSqlServer(connectionString, name: "database")
    .AddRedis(redisConnectionString, name: "cache");

app.MapHealthChecks("/health/live", new HealthCheckOptions
{
    Predicate = check => check.Name == "self"
});

app.MapHealthChecks("/health/ready", new HealthCheckOptions
{
    ResponseWriter = UIResponseWriter.WriteHealthCheckUIResponse
});`,
    explanation:
      "Liveness probes (/health/live) check if the process is alive; readiness probes (/health/ready) check all dependencies; Kubernetes uses both to route traffic and restart unhealthy pods.",
  },
  {
    id: "cs-opentelemetry",
    language: "csharp",
    title: "OpenTelemetry — traces, metrics, and logs",
    tag: "snippet",
    code: `using OpenTelemetry;
using OpenTelemetry.Trace;
using OpenTelemetry.Metrics;

builder.Services.AddOpenTelemetry()
    .WithTracing(tracing => tracing
        .AddAspNetCoreInstrumentation()
        .AddHttpClientInstrumentation()
        .AddOtlpExporter(o => o.Endpoint = new Uri("http://otel-collector:4317")))
    .WithMetrics(metrics => metrics
        .AddAspNetCoreInstrumentation()
        .AddRuntimeInstrumentation()
        .AddOtlpExporter());`,
    explanation:
      "OpenTelemetry SDK collects telemetry from ASP.NET Core and HttpClient automatically; OTLP exporter sends to collectors (Jaeger, Tempo, Prometheus) without vendor lock-in.",
  },
  {
    id: "cs-minimal-api-results",
    language: "csharp",
    title: "TypedResults in minimal APIs (NET 7+)",
    tag: "snippet",
    code: `app.MapGet("/users/{id:int}", async (int id, IUserRepo repo) =>
{
    var user = await repo.FindAsync(id);
    return user is null
        ? TypedResults.NotFound()
        : TypedResults.Ok(user);
})
.Produces<User>(200)
.ProducesProblem(404)
.WithName("GetUser")
.WithOpenApi();`,
    explanation:
      "TypedResults (vs Results) returns strongly-typed IResult implementations that generate accurate OpenAPI schemas; Produces<T> documents response types for Swagger/OpenAPI generation.",
  },
  {
    id: "cs-native-aot",
    language: "csharp",
    title: "PublishAot — Native AOT compilation",
    tag: "snippet",
    code: `<!-- In .csproj: -->
<!-- <PublishAot>true</PublishAot> -->
<!-- <InvariantGlobalization>true</InvariantGlobalization> -->

// AOT-incompatible patterns:
// - Dynamic code (Activator.CreateInstance with unknown types)
// - Unbound reflection (Type.GetMethod without trim annotations)
// - Non-source-generated System.Text.Json

// AOT-safe alternatives:
[JsonSerializable(typeof(MyModel))]
partial class JsonCtx : JsonSerializerContext { }

string json = JsonSerializer.Serialize(model, JsonCtx.Default.MyModel);`,
    explanation:
      "Native AOT compiles to a self-contained native binary with sub-millisecond startup; reflection and dynamic code must be replaced with source-generated or trimmed alternatives; use the PublishTrimmed analyser to find violations.",
  },

  // ── understanding ─────────────────────────────────────────────────────────
  {
    id: "cs-understand-middleware-pipeline",
    language: "csharp",
    title: "ASP.NET Core middleware pipeline — order matters",
    tag: "understanding",
    code: `var app = builder.Build();

// Middleware runs in registration order (and reverses on response):
app.UseExceptionHandler("/error");    // 1st — catches downstream exceptions
app.UseHttpsRedirection();            // 2nd
app.UseStaticFiles();                 // 3rd — short-circuits for static files
app.UseRouting();                     // 4th — matches route
app.UseAuthentication();              // 5th — sets ClaimsPrincipal
app.UseAuthorization();               // 6th — checks claims AFTER authn
app.MapControllers();                 // terminal — produces response

// Reversing UseAuthentication and UseAuthorization means authorization
// runs before identity is established — always an error.`,
    explanation:
      "Middleware executes in the order Use() calls appear; response writing reverses the order; UseAuthentication must precede UseAuthorization; ExceptionHandler must be first to catch all downstream exceptions.",
  },
  {
    id: "cs-understand-di-scopes",
    language: "csharp",
    title: "DI scope validation — captive dependency detection",
    tag: "understanding",
    code: `// Captive dependency: Singleton holds a reference to a Scoped service
// → Scoped service effectively becomes Singleton (never disposed per request)

services.AddSingleton<MySingleton>();  // captures...
services.AddScoped<MyScopedService>(); // ...this scoped service

// At startup (Development), .NET validates and throws:
// InvalidOperationException: Cannot consume scoped service 'MyScopedService'
// from singleton 'MySingleton'

// Fix: use IServiceScopeFactory to create scopes on demand:
class MySingleton(IServiceScopeFactory factory)
{
    void DoWork()
    {
        using var scope = factory.CreateScope();
        var svc = scope.ServiceProvider.GetRequiredService<MyScopedService>();
    }
}`,
    explanation:
      "A Singleton that directly injects a Scoped service prevents the Scoped service from being released per-request; IServiceScopeFactory lets the Singleton create short-lived scopes on demand.",
  },
  {
    id: "cs-understand-immutable-record",
    language: "csharp",
    title: "Records — copy semantics and equality",
    tag: "understanding",
    code: `record Person(string Name, int Age);

var alice = new Person("Alice", 30);
var copy  = alice with { Age = 31 };

// Structural equality:
var alice2 = new Person("Alice", 30);
Console.WriteLine(alice == alice2);         // True
Console.WriteLine(ReferenceEquals(alice, alice2));  // False

// Inheritance:
record Employee(string Name, int Age, string Dept) : Person(Name, Age);
var emp = new Employee("Bob", 25, "Eng");
Console.WriteLine((Person)emp == new Person("Bob", 25));  // False — different types`,
    explanation:
      "Record equality checks both type and all properties; with creates a new instance sharing property values; record inheritance is allowed but mixed-type equality returns false even with identical properties.",
  },
  {
    id: "cs-understand-string-intern",
    language: "csharp",
    title: "String interning — when reference equality misleads",
    tag: "understanding",
    code: `string a = "hello";
string b = "hello";
Console.WriteLine(ReferenceEquals(a, b));  // True — compile-time interned

string c = new string(new char[] { 'h', 'e', 'l', 'l', 'o' });
Console.WriteLine(ReferenceEquals(a, c));  // False — heap-allocated

string d = string.Intern(c);
Console.WriteLine(ReferenceEquals(a, d));  // True — now interned

// Always use == for string comparison, never ReferenceEquals:
Console.WriteLine(a == c);   // True — value equality`,
    explanation:
      "Compile-time string literals with the same value are interned to the same reference; heap-constructed strings are not; string.Intern adds a string to the pool — use == for value equality, never ReferenceEquals.",
  },
  {
    id: "cs-understand-expression-trees-query",
    language: "csharp",
    title: "Expression trees — how EF Core translates LINQ to SQL",
    tag: "understanding",
    code: `// When you write:
var results = db.Users.Where(u => u.Age > 18);

// EF Core receives an Expression<Func<User, bool>>, not a delegate.
// It inspects the AST:
// BinaryExpression: GreaterThan
//   Left:  MemberExpression: u.Age
//   Right: ConstantExpression: 18
// → Translates to: WHERE Age > 18

// Calling a C# method in the predicate breaks translation:
// db.Users.Where(u => u.Name == Encode(u.Name)); // NotSupportedException
// because EF can't translate Encode() to SQL`,
    explanation:
      "LINQ to Entities passes expression trees (not compiled delegates) to query providers; the provider translates the AST into SQL; calling arbitrary C# methods fails because they have no SQL equivalent.",
  },

  // ── structures ────────────────────────────────────────────────────────────
  {
    id: "cs-concurrent-queue",
    language: "csharp",
    title: "ConcurrentQueue<T> — lock-free FIFO queue",
    tag: "structures",
    code: `var queue = new ConcurrentQueue<int>();

// Multiple producers:
Parallel.For(0, 100, i => queue.Enqueue(i));

// Consumer:
int total = 0;
while (queue.TryDequeue(out int item))
    total += item;

Console.WriteLine(total);  // 4950

// Peek without removing:
if (queue.TryPeek(out int first))
    Console.WriteLine(first);`,
    explanation:
      "ConcurrentQueue uses a segmented linked list for lock-free concurrent enqueue/dequeue; TryDequeue returns false when empty rather than throwing; use Channel<T> for producer-consumer with backpressure.",
  },
  {
    id: "cs-dictionary-try-get",
    language: "csharp",
    title: "Dictionary patterns — TryGetValue vs GetValueOrDefault",
    tag: "structures",
    code: `var scores = new Dictionary<string, int>
{
    ["Alice"] = 95,
    ["Bob"]   = 87
};

// TryGetValue — most explicit, no allocation:
if (scores.TryGetValue("Alice", out int score))
    Console.WriteLine(score);  // 95

// GetValueOrDefault (.NET 5+) — concise, returns default on miss:
int carol = scores.GetValueOrDefault("Carol", -1);

// CollectionsMarshal.GetValueRefOrNullRef for in-place update:
using System.Runtime.InteropServices;
ref int bobScore = ref CollectionsMarshal.GetValueRefOrNullRef(scores, "Bob");
if (!System.Runtime.CompilerServices.Unsafe.IsNullRef(ref bobScore))
    bobScore += 5;  // in-place update, no second lookup`,
    explanation:
      "TryGetValue is O(1) and avoids the KeyNotFoundException of direct indexing; CollectionsMarshal.GetValueRefOrNullRef returns a ref to the value slot, enabling in-place updates without a second dictionary lookup.",
  },
  {
    id: "cs-bit-array",
    language: "csharp",
    title: "BitArray — compact bitfield operations",
    tag: "structures",
    code: `var permissions = new BitArray(8, false);
permissions[0] = true;   // READ
permissions[1] = true;   // WRITE
permissions[2] = false;  // EXECUTE

// Bitwise operations:
var all = new BitArray(8, true);
var diff = all.And(permissions.Not());  // bits NOT set in permissions

// Count set bits:
int count = 0;
foreach (bool b in permissions) if (b) count++;
Console.WriteLine(count);  // 2`,
    explanation:
      "BitArray stores bits as int32s internally (32x smaller than bool[]) and supports And, Or, Xor, Not in-place operations; useful for flag sets and sieve algorithms.",
  },
  {
    id: "cs-trie-csharp",
    language: "csharp",
    title: "Trie — prefix search in O(m)",
    tag: "structures",
    code: `class TrieNode
{
    public Dictionary<char, TrieNode> Children = new();
    public bool IsEnd;
}

class Trie
{
    private readonly TrieNode _root = new();

    public void Insert(string word)
    {
        var node = _root;
        foreach (char c in word)
        {
            if (!node.Children.TryGetValue(c, out var next))
                node.Children[c] = next = new TrieNode();
            node = next;
        }
        node.IsEnd = true;
    }

    public bool StartsWith(string prefix)
    {
        var node = _root;
        return prefix.All(c => node.Children.TryGetValue(c, out node!));
    }
}`,
    explanation:
      "Each Trie node holds a map of child characters; Insert is O(m) where m is word length; StartsWith walks the prefix path, returning false at the first missing character.",
  },

  // ── caveats ───────────────────────────────────────────────────────────────
  {
    id: "cs-caveat-span-in-async",
    language: "csharp",
    title: "Span<T> cannot cross await — use Memory<T>",
    tag: "caveats",
    code: `// ILLEGAL — Span<T> is ref struct, cannot survive across async suspension:
async Task Process(Span<byte> data)   // CS4012
{
    await Task.Delay(1);   // if Span were allowed, stack frame would be gone
}

// CORRECT — Memory<T> is a class-like wrapper, can cross await:
async Task Process(Memory<byte> data)
{
    await Task.Delay(1);
    data.Span[0] = 0xFF;   // access Span only during synchronous sections
}

byte[] buf = new byte[64];
await Process(buf.AsMemory());`,
    explanation:
      "Span<T> is a ref struct restricted to the stack; async methods can be suspended and resumed on different threads, invalidating stack frames — use Memory<T> to carry buffer references across await points.",
  },
  {
    id: "cs-caveat-record-deconstruct",
    language: "csharp",
    title: "Positional record Deconstruct and extra properties",
    tag: "caveats",
    code: `record Person(string Name, int Age)
{
    // Extra computed property — NOT part of Deconstruct
    public string Initial => Name[..1];
}

var p = new Person("Alice", 30);

// Deconstruct only covers positional parameters:
var (name, age) = p;        // OK
// var (name, age, init) = p;  // CS8132 — no 3-parameter Deconstruct

// For extra params, write your own Deconstruct overload:
// public void Deconstruct(out string n, out int a, out string init) => ...`,
    explanation:
      "Positional records generate Deconstruct with exactly the positional parameters; additional properties are not included — add a manual Deconstruct overload if you need them in tuple-assignment.",
  },
  {
    id: "cs-caveat-thread-pool-starvation",
    language: "csharp",
    title: "Thread pool starvation from blocking async",
    tag: "caveats",
    code: `// BAD — blocking thread pool threads waiting for async results
void ProcessRequests()
{
    for (int i = 0; i < 1000; i++)
    {
        // Task.Run uses thread pool; .Result blocks that thread:
        string result = Task.Run(() => FetchAsync()).Result;  // DO NOT
    }
}

// GOOD — async all the way up, thread pool threads stay available
async Task ProcessRequestsAsync()
{
    for (int i = 0; i < 1000; i++)
    {
        string result = await FetchAsync();
    }
}`,
    explanation:
      "Blocking on Task.Result inside a thread-pool thread consumes the thread while waiting, potentially starving the pool; async/await releases the thread during I/O so other work can run.",
  },
  {
    id: "cs-caveat-disposed-exception",
    language: "csharp",
    title: "ObjectDisposedException — using after Dispose",
    tag: "caveats",
    code: `HttpClient client;
using (client = new HttpClient())
{
    var data = await client.GetStringAsync("https://example.com");
}
// client is now disposed!

// This throws ObjectDisposedException:
var more = await client.GetStringAsync("https://example.com");

// Fix: declare inside the using block, or make it a long-lived singleton:
// services.AddSingleton<HttpClient>();  — share one client`,
    explanation:
      "Declaring the variable outside the using block is a common mistake that lets disposed objects escape their scope; prefer declaring variables inside using, or make shared clients singletons via DI.",
  },
  {
    id: "cs-caveat-implicit-conversion-precision",
    language: "csharp",
    title: "Implicit int → float loses precision",
    tag: "caveats",
    code: `int  big   = 16_777_217;    // 2^24 + 1
float f    = big;            // implicit conversion — loses precision!
Console.WriteLine(f);       // 1.6777216E+07 (last bit dropped)
Console.WriteLine((int)f);  // 16777216 — NOT 16777217

// Safe: use double (53-bit significand covers all 32-bit ints)
double d = big;
Console.WriteLine((int)d);  // 16777217 — correct

// Or use decimal for financial computations
decimal m = big;
Console.WriteLine(m == big); // True — exact`,
    explanation:
      "float has a 23-bit significand (only ~7 decimal digits of precision); integers larger than 2^24 cannot be represented exactly in float — use double (15-16 digits) or decimal for financial values.",
  },

  // ── types ─────────────────────────────────────────────────────────────────
  {
    id: "cs-type-readonly-ref",
    language: "csharp",
    title: "ref readonly — return a reference without copying",
    tag: "types",
    code: `struct LargeStruct
{
    public double A, B, C, D, E, F, G, H;  // 64 bytes
}

class Matrix
{
    private readonly LargeStruct[] _data = new LargeStruct[1000];

    // Return ref to avoid 64-byte copy on each call:
    public ref readonly LargeStruct GetRow(int i) => ref _data[i];
}

var m = new Matrix();
ref readonly LargeStruct row = ref m.GetRow(0);
Console.WriteLine(row.A);   // no copy
// row.A = 1.0;              // CS8332 — ref readonly, cannot assign`,
    explanation:
      "ref readonly returns a managed reference to the struct in-place; callers read it without a copy and cannot modify it; eliminates the performance cost of passing/returning large structs by value.",
  },
  {
    id: "cs-type-interface-static-abstract",
    language: "csharp",
    title: "Static abstract interface members (C# 11)",
    tag: "types",
    code: `interface IParseable<T>
{
    static abstract T Parse(string s);
    static abstract bool TryParse(string s, out T result);
}

struct Celsius : IParseable<Celsius>
{
    public double Value;
    public static Celsius Parse(string s) => new() { Value = double.Parse(s) };
    public static bool TryParse(string s, out Celsius r) {
        r = default;
        if (double.TryParse(s, out double v)) { r.Value = v; return true; }
        return false;
    }
}

static T ParseAnything<T>(string s) where T : IParseable<T> => T.Parse(s);`,
    explanation:
      "Static abstract members on interfaces allow generic algorithms that call static methods (Parse, Create, operators) without knowing the concrete type — the backbone of .NET 7+ generic math.",
  },
  {
    id: "cs-type-function-pointer",
    language: "csharp",
    title: "Function pointers — managed and unmanaged (C# 9)",
    tag: "types",
    code: `unsafe static int Add(int a, int b) => a + b;

unsafe static void Demo()
{
    // Managed function pointer — delegates without allocation:
    delegate*<int, int, int> fp = &Add;
    Console.WriteLine(fp(3, 4));  // 7

    // Unmanaged function pointer for P/Invoke calling conventions:
    delegate* unmanaged[Cdecl]<int, int, int> native = ...;
}`,
    explanation:
      "C# 9 function pointers are lower-level than delegates — no allocation, no object header, direct call; useful in performance-critical unsafe code and P/Invoke interop where delegate overhead matters.",
  },
  {
    id: "cs-type-raw-span",
    language: "csharp",
    title: "ReadOnlySpan<T> from inline data — no array allocation",
    tag: "types",
    code: `static ReadOnlySpan<byte> Signature => new byte[] { 0x89, 0x50, 0x4E, 0x47 };

// Better in .NET 6+: compiler places bytes in read-only data segment
static ReadOnlySpan<byte> PngMagic => [0x89, 0x50, 0x4E, 0x47];

bool IsPng(ReadOnlySpan<byte> data) =>
    data.Length >= 4 && data[..4].SequenceEqual(PngMagic);

// PngMagic is backed by a static data segment — no heap allocation`,
    explanation:
      "Using a collection expression [0x89, ...] for a ReadOnlySpan<byte> property lets the compiler embed the bytes directly in the PE's read-only data segment with no heap allocation on each access.",
  },

  // ── families ──────────────────────────────────────────────────────────────
  {
    id: "cs-family-logging-providers",
    language: "csharp",
    title: "Logging: ILogger vs Serilog vs NLog vs OpenTelemetry",
    tag: "families",
    code: `// Microsoft.Extensions.Logging (MEL) — abstraction layer:
ILogger<MyService> logger = ...;
logger.LogInformation("User {UserId} logged in", userId);

// Serilog — structured, pluggable sinks, MEL-compatible:
Log.Logger = new LoggerConfiguration()
    .WriteTo.Console(outputTemplate: "{Timestamp} {Level} {Message}{NewLine}{Exception}")
    .WriteTo.Seq("http://seq:5341")
    .CreateLogger();

// NLog — XML config, good for legacy apps

// OpenTelemetry Logs (NET 9+) — OTLP export, zero vendor lock-in`,
    explanation:
      "Always code against MEL (ILogger) so the logging sink can be swapped; use Serilog or NLog as the MEL provider for structured logs and rich sinks; prefer OpenTelemetry for new cloud-native apps.",
  },
  {
    id: "cs-family-validation",
    language: "csharp",
    title: "Validation approaches: DataAnnotations vs FluentValidation vs custom",
    tag: "families",
    code: `// DataAnnotations — declarative, built into ASP.NET Core, limited
[Required, StringLength(50)] public string Name { get; set; } = "";

// FluentValidation — expressive, composable, testable
RuleFor(r => r.Name).NotEmpty().MaximumLength(50)
    .Must(n => !n.Contains("admin")).WithMessage("Reserved word");

// Custom domain validation — rich error types, no dependency
sealed class ValidationError(string field, string message) { }
Result<Order, ValidationError[]> ValidateOrder(CreateOrderRequest req);`,
    explanation:
      "DataAnnotations suit simple attribute-level rules; FluentValidation for complex rules with conditional logic; custom validation in the domain layer when you need rich error types and no framework coupling.",
  },
  {
    id: "cs-family-hosting",
    language: "csharp",
    title: "Hosting models: Generic Host vs WebApplication vs Worker Service",
    tag: "families",
    code: `// Generic Host — base hosting model (console apps, services)
using var host = Host.CreateDefaultBuilder(args)
    .ConfigureServices(s => s.AddHostedService<MyWorker>())
    .Build();
await host.RunAsync();

// WebApplication — HTTP + generic host combined (minimal API / MVC)
var app = WebApplication.CreateBuilder(args).Build();
app.Run();

// Worker Service — long-running background processing
public class MyWorker : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken ct) { }
}`,
    explanation:
      "Generic Host provides DI, configuration, logging, and hosted services without HTTP; WebApplication adds Kestrel and the middleware pipeline; Worker Service is a project template built on Generic Host.",
  },
  {
    id: "cs-family-testing-patterns",
    language: "csharp",
    title: "Testing patterns: unit vs integration vs architecture tests",
    tag: "families",
    code: `// Unit test — isolated, fast, mock dependencies
[Fact]
public void Calculate_ReturnsCorrectSum()
{
    var sut = new Calculator();
    Assert.Equal(5, sut.Add(2, 3));
}

// Integration test — with WebApplicationFactory
[Fact]
public async Task GetUsers_Returns200()
{
    using var client = _factory.CreateClient();
    var response = await client.GetAsync("/users");
    response.EnsureSuccessStatusCode();
}

// Architecture test — enforce layering rules
[Fact]
public void DomainLayer_ShouldNotReferencePresentationLayer()
    => Types.InAssembly(DomainAssembly)
            .ShouldNot()
            .HaveDependencyOn("MyApp.Api")
            .GetResult().IsSuccessful.Should().BeTrue();`,
    explanation:
      "Unit tests verify logic in isolation; integration tests verify components working together (WebApplicationFactory spins up the real stack); architecture tests (NetArchTest, ArchUnitNET) enforce layering constraints.",
  },

  // ── classes ───────────────────────────────────────────────────────────────
  {
    id: "cs-class-repository-async",
    language: "csharp",
    title: "Async repository with cancellation and EF Core",
    tag: "classes",
    code: `interface IUserRepository
{
    Task<User?>          FindByIdAsync(int id, CancellationToken ct = default);
    Task<List<User>>     GetActiveAsync(CancellationToken ct = default);
    Task                 AddAsync(User user, CancellationToken ct = default);
    Task                 DeleteAsync(int id, CancellationToken ct = default);
}

class EfUserRepository(AppDb db) : IUserRepository
{
    public Task<User?> FindByIdAsync(int id, CancellationToken ct) =>
        db.Users.FindAsync([id], ct).AsTask();

    public Task<List<User>> GetActiveAsync(CancellationToken ct) =>
        db.Users.Where(u => u.IsActive).AsNoTracking().ToListAsync(ct);

    public async Task AddAsync(User user, CancellationToken ct)
    {
        db.Users.Add(user);
        await db.SaveChangesAsync(ct);
    }

    public async Task DeleteAsync(int id, CancellationToken ct)
    {
        await db.Users.Where(u => u.Id == id).ExecuteDeleteAsync(ct);
    }
}`,
    explanation:
      "ExecuteDeleteAsync (EF Core 7+) generates a single DELETE SQL without loading the entity; AsNoTracking() on reads avoids change-tracking overhead; CancellationToken threads through all async EF calls.",
  },
  {
    id: "cs-class-domain-service",
    language: "csharp",
    title: "Domain service — operations spanning multiple aggregates",
    tag: "classes",
    code: `class TransferService(
    IAccountRepository accounts,
    IDomainEventDispatcher events)
{
    public async Task TransferAsync(
        int fromId, int toId, decimal amount, CancellationToken ct)
    {
        var from = await accounts.GetAsync(fromId, ct)
            ?? throw new NotFoundException(fromId);
        var to   = await accounts.GetAsync(toId, ct)
            ?? throw new NotFoundException(toId);

        from.Debit(amount);    // raises MoneyDebited domain event
        to.Credit(amount);     // raises MoneyCredited domain event

        await accounts.SaveAsync(from, ct);
        await accounts.SaveAsync(to, ct);

        foreach (var ev in from.PopEvents().Concat(to.PopEvents()))
            await events.DispatchAsync(ev, ct);
    }
}`,
    explanation:
      "Domain services coordinate operations that don't belong to a single aggregate; they orchestrate aggregate methods, persist through repositories, and dispatch domain events after all changes are persisted.",
  },
  {
    id: "cs-class-query-handler",
    language: "csharp",
    title: "CQRS query handler — read-optimised projection",
    tag: "classes",
    code: `record GetOrderSummaryQuery(int OrderId) : IRequest<OrderSummaryDto?>;

record OrderSummaryDto(int Id, string CustomerName, decimal Total, string Status);

class GetOrderSummaryHandler(AppDb db)
    : IRequestHandler<GetOrderSummaryQuery, OrderSummaryDto?>
{
    public Task<OrderSummaryDto?> Handle(
        GetOrderSummaryQuery req, CancellationToken ct) =>
        db.Orders
            .Where(o => o.Id == req.OrderId)
            .Select(o => new OrderSummaryDto(
                o.Id, o.Customer.Name, o.Total, o.Status.ToString()))
            .AsNoTracking()
            .FirstOrDefaultAsync(ct);
}`,
    explanation:
      "Read-side CQRS handlers use AsNoTracking projections directly into DTOs; this avoids loading full aggregates and populating domain objects for queries that only need a summary.",
  },
  {
    id: "cs-class-saga-pattern",
    language: "csharp",
    title: "Saga orchestration — multi-step distributed transaction",
    tag: "classes",
    code: `class OrderSaga
{
    public enum State { Started, PaymentPending, ShipmentPending, Completed, Failed }

    private State _state = State.Started;

    public async Task RunAsync(Order order, CancellationToken ct)
    {
        _state = State.PaymentPending;
        try
        {
            await PaymentService.ChargeAsync(order.Total, ct);
            _state = State.ShipmentPending;
            await ShipmentService.CreateShipmentAsync(order, ct);
            _state = State.Completed;
        }
        catch when (_state == State.ShipmentPending)
        {
            await PaymentService.RefundAsync(order.Total, ct);  // compensating tx
            _state = State.Failed;
            throw;
        }
    }
}`,
    explanation:
      "Sagas manage multi-step distributed operations that span services; on failure, compensating transactions roll back completed steps; the state machine tracks progress for resumability and debugging.",
  },
  {
    id: "cs-class-pipeline-behavior",
    language: "csharp",
    title: "MediatR pipeline behavior — cross-cutting concerns",
    tag: "classes",
    code: `class ValidationBehavior<TRequest, TResponse>(
    IEnumerable<IValidator<TRequest>> validators)
    : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken ct)
    {
        var failures = validators
            .Select(v => v.Validate(request))
            .SelectMany(r => r.Errors)
            .Where(f => f != null)
            .ToList();

        if (failures.Any())
            throw new ValidationException(failures);

        return await next();
    }
}`,
    explanation:
      "Pipeline behaviors wrap all MediatR handlers with cross-cutting logic (validation, logging, caching); they compose in registration order and call next() to invoke the inner handler — similar to ASP.NET Core middleware.",
  },
  {
    id: "cs-class-health-check-custom",
    language: "csharp",
    title: "Custom health check — IHealthCheck implementation",
    tag: "classes",
    code: `class DatabaseHealthCheck(AppDb db) : IHealthCheck
{
    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken ct = default)
    {
        try
        {
            await db.Database.ExecuteSqlRawAsync("SELECT 1", ct);
            return HealthCheckResult.Healthy("Database reachable");
        }
        catch (Exception ex)
        {
            return HealthCheckResult.Unhealthy(
                "Database unreachable",
                ex,
                data: new Dictionary<string, object> { ["error"] = ex.Message });
        }
    }
}

// Registration:
builder.Services.AddHealthChecks()
    .AddCheck<DatabaseHealthCheck>("database");`,
    explanation:
      "Custom health checks allow arbitrary async probes; HealthCheckResult carries healthy/degraded/unhealthy states with optional data; the data dictionary appears in the health check response JSON.",
  },
  {
    id: "cs-class-specification-ef",
    language: "csharp",
    title: "Specification with EF Core expressions",
    tag: "classes",
    code: `class Specification<T>
{
    public Expression<Func<T, bool>> Criteria { get; }

    public Specification(Expression<Func<T, bool>> criteria)
        => Criteria = criteria;

    public Specification<T> And(Specification<T> other)
    {
        var param  = Expression.Parameter(typeof(T));
        var body   = Expression.AndAlso(
            Expression.Invoke(Criteria, param),
            Expression.Invoke(other.Criteria, param));
        return new(Expression.Lambda<Func<T, bool>>(body, param));
    }
}

// Usage:
var adult  = new Specification<User>(u => u.Age >= 18);
var active = new Specification<User>(u => u.IsActive);
var query  = adult.And(active);

var users = await db.Users.Where(query.Criteria).ToListAsync();`,
    explanation:
      "Combining specifications via Expression trees (not compiled delegates) keeps them translatable to SQL by EF Core; Expression.Invoke creates an expression-level call that EF's LINQ provider can traverse and translate.",
  },
];
