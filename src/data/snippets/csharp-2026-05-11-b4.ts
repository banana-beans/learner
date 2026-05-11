import type { Snippet } from "./types";

export const csharpSnippets20260511B4: Snippet[] = [
  // ── snippet ──────────────────────────────────────────────────────────────
  {
    id: "cs-di-register-transient",
    language: "csharp",
    title: "AddTransient — new instance on every injection",
    tag: "snippet",
    code: `// Program.cs / Startup.cs
using Microsoft.Extensions.DependencyInjection;

var services = new ServiceCollection();

// A fresh Foo is created each time IFoo is requested
services.AddTransient<IFoo, Foo>();

// Verify:
var provider = services.BuildServiceProvider();
var a = provider.GetRequiredService<IFoo>();
var b = provider.GetRequiredService<IFoo>();
Console.WriteLine(ReferenceEquals(a, b));   // False`,
    explanation:
      "Transient lifetime means the container calls new Foo() on every single resolution; use it for lightweight, stateless services where sharing state would be a bug.",
  },
  {
    id: "cs-di-register-scoped",
    language: "csharp",
    title: "AddScoped — one instance per scope (request)",
    tag: "snippet",
    code: `using Microsoft.Extensions.DependencyInjection;

var services = new ServiceCollection();
services.AddScoped<IRepository, SqlRepository>();

var provider = services.BuildServiceProvider();

// Within the SAME scope, both resolutions share one instance:
using (var scope = provider.CreateScope())
{
    var r1 = scope.ServiceProvider.GetRequiredService<IRepository>();
    var r2 = scope.ServiceProvider.GetRequiredService<IRepository>();
    Console.WriteLine(ReferenceEquals(r1, r2));  // True
}

// A NEW scope gets a NEW instance:
using (var scope2 = provider.CreateScope())
{
    var r3 = scope2.ServiceProvider.GetRequiredService<IRepository>();
    // r3 != r1
}`,
    explanation:
      "In ASP.NET Core each HTTP request gets its own scope, so scoped services act as per-request singletons — perfect for DbContext, unit-of-work, and other request-specific state.",
  },
  {
    id: "cs-di-register-singleton",
    language: "csharp",
    title: "AddSingleton — one instance for the application lifetime",
    tag: "snippet",
    code: `using Microsoft.Extensions.DependencyInjection;

var services = new ServiceCollection();

// One ICache instance for the whole app lifetime
services.AddSingleton<ICache, MemoryCache>();

// Register a pre-created instance (factory already ran):
services.AddSingleton<ISettings>(new AppSettings { MaxItems = 100 });

var provider = services.BuildServiceProvider();
var c1 = provider.GetRequiredService<ICache>();
var c2 = provider.GetRequiredService<ICache>();
Console.WriteLine(ReferenceEquals(c1, c2));  // True`,
    explanation:
      "Singletons are created once and reused for every request; they must be thread-safe since multiple requests access the same instance concurrently.",
  },
  {
    id: "cs-di-factory",
    language: "csharp",
    title: "Factory delegate — construct services with resolved dependencies",
    tag: "snippet",
    code: `using Microsoft.Extensions.DependencyInjection;

var services = new ServiceCollection();
services.AddSingleton<IBar, Bar>();

// Factory delegate receives IServiceProvider — pull whatever you need:
services.AddTransient<IFoo>(sp =>
{
    var bar    = sp.GetRequiredService<IBar>();
    var config = sp.GetRequiredService<IConfiguration>();
    return new Foo(bar, config["Foo:ApiKey"]!);
});

// Useful when a type has constructor arguments that are not services
// (e.g. string, int) alongside injected dependencies.`,
    explanation:
      "Factory delegates give you full control over construction; the lambda is called each time for transient/scoped registrations, giving you access to the current scope's service provider.",
  },
  {
    id: "cs-di-named",
    language: "csharp",
    title: "Keyed services — AddKeyedSingleton (.NET 8+)",
    tag: "snippet",
    code: `using Microsoft.Extensions.DependencyInjection;

var services = new ServiceCollection();

// Register multiple implementations under different keys:
services.AddKeyedSingleton<IMessageSender, EmailSender>("email");
services.AddKeyedSingleton<IMessageSender, SmsSender>("sms");

var provider = services.BuildServiceProvider();

// Resolve by key:
var email = provider.GetRequiredKeyedService<IMessageSender>("email");
var sms   = provider.GetRequiredKeyedService<IMessageSender>("sms");

// Inject by key in a constructor (.NET 8+):
// public MyService([FromKeyedServices("email")] IMessageSender sender) { }`,
    explanation:
      "Keyed services (.NET 8) replace the common Scrutor / manual factory workarounds for named registrations; the FromKeyedServices attribute wires them up in constructor injection.",
  },
  {
    id: "cs-di-decorator",
    language: "csharp",
    title: "Decorator registration with Scrutor TryDecorate",
    tag: "snippet",
    code: `// NuGet: Scrutor
using Microsoft.Extensions.DependencyInjection;

var services = new ServiceCollection();
services.AddTransient<IOrderService, OrderService>();

// Wrap the registered IOrderService with a logging decorator:
services.Decorate<IOrderService, LoggingOrderService>();

// LoggingOrderService receives IOrderService (the inner) via DI:
// public class LoggingOrderService : IOrderService
// {
//     public LoggingOrderService(IOrderService inner, ILogger<...> log)
//     { _inner = inner; _log = log; }
//
//     public Order Place(Cart cart)
//     {
//         _log.LogInformation("placing order");
//         return _inner.Place(cart);
//     }
// }`,
    explanation:
      "Scrutor's Decorate wraps the existing registration transparently; the decorator receives the original service as a constructor parameter, enabling the chain-of-responsibility pattern without modifying the original class.",
  },
  {
    id: "cs-di-open-generic",
    language: "csharp",
    title: "Open-generic registration — IRepo<T> → Repo<T>",
    tag: "snippet",
    code: `using Microsoft.Extensions.DependencyInjection;

// One registration covers ALL closed generics IRepo<T>:
services.AddSingleton(typeof(IRepository<>), typeof(Repository<>));

// Resolve any closed variant:
var userRepo   = provider.GetRequiredService<IRepository<User>>();
var orderRepo  = provider.GetRequiredService<IRepository<Order>>();
var reportRepo = provider.GetRequiredService<IRepository<Report>>();

// The container constructs Repository<User>, Repository<Order>, etc.
// on first request and caches each closed type separately.`,
    explanation:
      "Open-generic registration maps the unbound generic IRepository<> to Repository<> so you never have to register each T individually; each closed type gets its own singleton/scoped/transient instance.",
  },
  {
    id: "cs-ihost-startup",
    language: "csharp",
    title: "Host.CreateApplicationBuilder — minimal host startup",
    tag: "snippet",
    code: `using Microsoft.Extensions.Hosting;

// .NET 7+ entry point (top-level statements)
var builder = Host.CreateApplicationBuilder(args);

// Register services
builder.Services.AddHostedService<MyWorker>();

// Build and run the host (blocks until shutdown signal)
var app = builder.Build();
await app.RunAsync();

// For console apps that exit after work is done:
// await app.StartAsync();
// await app.WaitForShutdownAsync();`,
    explanation:
      "CreateApplicationBuilder wires up default logging, configuration (appsettings + env vars + secrets), and DI; RunAsync blocks until Ctrl-C or IHostApplicationLifetime.StopApplication is called.",
  },
  {
    id: "cs-ihost-configure",
    language: "csharp",
    title: "builder.Services.Configure<T> — bind options from config",
    tag: "snippet",
    code: `using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

// appsettings.json:  { "Email": { "Host": "smtp.example.com", "Port": 587 } }

var builder = WebApplication.CreateBuilder(args);

// Bind the "Email" section to EmailOptions class:
builder.Services.Configure<EmailOptions>(
    builder.Configuration.GetSection("Email")
);

// Inject and use:
app.MapGet("/config", (IOptions<EmailOptions> opts) =>
    Results.Ok(opts.Value));

public class EmailOptions
{
    public string Host { get; set; } = "";
    public int    Port { get; set; } = 25;
}`,
    explanation:
      "Configure<T> binds a configuration section to a strongly-typed class; inject IOptions<T> in services to access the validated, snapshot values without ever touching raw IConfiguration strings.",
  },
  {
    id: "cs-middleware-pipeline",
    language: "csharp",
    title: "app.Use — inline middleware with next delegate",
    tag: "snippet",
    code: `var app = builder.Build();

// Inline middleware: call next(ctx) to continue the pipeline
app.Use(async (context, next) =>
{
    // Before the next middleware
    var sw = System.Diagnostics.Stopwatch.StartNew();

    await next(context);   // hand off to the rest of the pipeline

    // After the next middleware (response may have started)
    sw.Stop();
    context.Response.Headers["X-Duration-Ms"] = sw.ElapsedMilliseconds.ToString();
});

app.MapGet("/", () => "Hello");
app.Run();`,
    explanation:
      "Middleware wraps the rest of the pipeline; code before next() runs on the way in, code after runs on the way out; do not write response headers after next() if the response has already started.",
  },
  {
    id: "cs-middleware-short",
    language: "csharp",
    title: "Middleware ordering — UseRouting and UseAuthorization",
    tag: "snippet",
    code: `var app = builder.Build();

// Order matters — each line adds to the pipeline in sequence

app.UseExceptionHandler("/error");  // outermost: catches all errors
app.UseHsts();                       // HTTPS strict transport
app.UseHttpsRedirection();

app.UseStaticFiles();               // serve wwwroot before routing

app.UseRouting();                   // match endpoints (must precede auth)

app.UseAuthentication();            // identify the caller
app.UseAuthorization();             // check permissions

app.MapControllers();               // execute matched endpoints
app.Run();`,
    explanation:
      "Middleware runs in registration order; UseAuthentication must precede UseAuthorization, and both must come after UseRouting so the endpoint metadata is available for policy evaluation.",
  },
  {
    id: "cs-endpoint-filter",
    language: "csharp",
    title: "IEndpointFilter — cross-cutting logic on minimal API routes",
    tag: "snippet",
    code: `using Microsoft.AspNetCore.Http;

// Implement IEndpointFilter for reusable cross-cutting behaviour
public class ValidationFilter : IEndpointFilter
{
    public async ValueTask<object?> InvokeAsync(
        EndpointFilterInvocationContext ctx, EndpointFilterDelegate next)
    {
        // Validate every argument that implements IValidatable
        foreach (var arg in ctx.Arguments.OfType<IValidatable>())
            if (!arg.IsValid())
                return Results.ValidationProblem(arg.Errors);

        return await next(ctx);   // continue to the handler
    }
}

// Apply to a route:
app.MapPost("/orders", (OrderRequest req) => Results.Ok())
   .AddEndpointFilter<ValidationFilter>();`,
    explanation:
      "Endpoint filters are the minimal-API equivalent of action filters; they compose as a pipeline around the handler delegate and can short-circuit by returning a result without calling next.",
  },
  {
    id: "cs-minimal-api-group",
    language: "csharp",
    title: "MapGroup — group minimal API routes with shared prefix",
    tag: "snippet",
    code: `var app = builder.Build();

var api = app.MapGroup("/api/v1")
             .RequireAuthorization()              // applied to all routes in group
             .WithOpenApi();

var users = api.MapGroup("/users");
users.MapGet("/",        () => Results.Ok("list users"));
users.MapGet("/{id:int}", (int id) => Results.Ok(\`user \${id}\`));
users.MapPost("/",       (UserRequest r) => Results.Created(\`/api/v1/users/1\`, r));

var orders = api.MapGroup("/orders");
orders.MapGet("/", () => Results.Ok("list orders"));

app.Run();`,
    explanation:
      "MapGroup applies shared configuration (auth, rate limiting, OpenAPI, prefix) to a set of routes without repeating it on each MapGet/MapPost; groups can be nested for hierarchical URL structures.",
  },
  {
    id: "cs-minimal-api-auth",
    language: "csharp",
    title: ".RequireAuthorization() on a minimal API endpoint",
    tag: "snippet",
    code: `var builder = WebApplication.CreateBuilder(args);

builder.Services.AddAuthentication().AddJwtBearer();
builder.Services.AddAuthorization(opts =>
{
    opts.AddPolicy("AdminOnly", p => p.RequireRole("Admin"));
});

var app = builder.Build();
app.UseAuthentication();
app.UseAuthorization();

// Anonymous — no auth required
app.MapGet("/health", () => Results.Ok("healthy"));

// Authenticated user only
app.MapGet("/profile", (ClaimsPrincipal user) => Results.Ok(user.Identity!.Name))
   .RequireAuthorization();

// Named policy
app.MapDelete("/users/{id}", (int id) => Results.NoContent())
   .RequireAuthorization("AdminOnly");

app.Run();`,
    explanation:
      "RequireAuthorization() with no arguments requires any authenticated user; pass a policy name for fine-grained access control; AllowAnonymous() overrides group-level auth for specific routes.",
  },

  // ── understanding ─────────────────────────────────────────────────────────
  {
    id: "cs-di-lifetime-scope",
    language: "csharp",
    title: "Service lifetimes — transient, scoped, singleton hierarchy",
    tag: "understanding",
    code: `// Lifetime rules:
// Singleton  — can depend on Singleton only
// Scoped     — can depend on Singleton or Scoped
// Transient  — can depend on anything (but captures scope if held)

// PROBLEM: a Singleton capturing a Scoped is "captive dependency":
services.AddSingleton<MySingleton>();   // holds a reference to...
services.AddScoped<MyScoped>();         // ...which is per-request!

// Result: MySingleton always uses the Scoped from the FIRST scope,
// not the current request's scope — stale state, hard-to-find bugs.

// Safe pattern — inject IServiceScopeFactory into Singleton:
public class MySingleton
{
    private readonly IServiceScopeFactory _factory;
    public MySingleton(IServiceScopeFactory f) => _factory = f;
    public void DoWork()
    {
        using var scope = _factory.CreateScope();
        var scoped = scope.ServiceProvider.GetRequiredService<MyScoped>();
    }
}`,
    explanation:
      "A singleton must never hold a direct reference to a scoped service because the scoped service outlives its intended scope; use IServiceScopeFactory to create a short-lived scope on demand.",
  },
  {
    id: "cs-di-captive-dep",
    language: "csharp",
    title: "Captive dependency — singleton consuming a scoped service",
    tag: "understanding",
    code: `// ANTI-PATTERN — captures the first request's scoped service forever
public class SingletonService
{
    private readonly IScopedService _scoped;  // captive!

    public SingletonService(IScopedService scoped)
        => _scoped = scoped;   // injected from first scope; never released
}

// ASP.NET Core's built-in scope validation catches this at startup:
// builder.Host.UseDefaultServiceProvider(opts =>
//     opts.ValidateScopes = true);   // throws at startup in Development

// CORRECT — request a scope when needed:
public class SingletonService
{
    private readonly IServiceScopeFactory _factory;
    public SingletonService(IServiceScopeFactory f) => _factory = f;

    public void Handle()
    {
        using var scope = _factory.CreateScope();
        var svc = scope.ServiceProvider.GetRequiredService<IScopedService>();
        svc.DoWork();
    }   // scoped service disposed here
}`,
    explanation:
      "ValidateScopes=true (on by default in Development) detects captive dependencies at startup and throws; enable it in all environments to catch these bugs before they reach production.",
  },
  {
    id: "cs-singleton-disposable",
    language: "csharp",
    title: "Singleton IDisposable — disposed when the host shuts down",
    tag: "understanding",
    code: `// A singleton that holds unmanaged resources implements IDisposable
public class ConnectionPool : IDisposable
{
    private bool _disposed;

    public ConnectionPool()
    {
        Console.WriteLine("pool created");
    }

    public void Dispose()
    {
        if (_disposed) return;
        _disposed = true;
        Console.WriteLine("pool disposed — all connections closed");
    }
}

// Register:
services.AddSingleton<ConnectionPool>();

// The DI container owns the singleton and calls Dispose() when the
// IHost is stopped (Ctrl-C, IHostApplicationLifetime.StopApplication,
// or the host's using block ends).`,
    explanation:
      "The DI container tracks and disposes IDisposable singletons when the root provider is disposed — typically at host shutdown; scoped and transient IDisposables are disposed at the end of their scope.",
  },
  {
    id: "cs-scoped-in-singleton",
    language: "csharp",
    title: "Resolving scoped service from singleton throws at runtime",
    tag: "understanding",
    code: `var builder = WebApplication.CreateBuilder(args);
builder.Services.AddSingleton<MySingleton>();
builder.Services.AddScoped<IMyScoped, MyScoped>();

// Scope validation enabled by default in Development:
builder.Host.UseDefaultServiceProvider(opts =>
{
    opts.ValidateScopes = true;
    opts.ValidateOnBuild = true;  // validate at Build() time
});

var app = builder.Build();   // throws here if captive dep detected

// Error:
// InvalidOperationException: Cannot consume scoped service 'IMyScoped'
// from singleton 'MySingleton'.`,
    explanation:
      "ValidateOnBuild=true moves the captive-dependency check from first-request to Build(), giving you an immediate startup failure in CI rather than a runtime error in production.",
  },
  {
    id: "cs-aspnet-request-lifecycle",
    language: "csharp",
    title: "ASP.NET Core request lifecycle — middleware to response",
    tag: "understanding",
    code: `// Simplified lifecycle for a GET /orders/42 request:

// 1. Kestrel receives TCP bytes and creates HttpContext
// 2. Middleware pipeline runs (each app.Use* in registration order):
//    - ExceptionHandler
//    - HTTPS redirection
//    - Static files (no match, continues)
//    - Routing — matches route template "/orders/{id:int}"
//    - Authentication — reads JWT, populates ClaimsPrincipal
//    - Authorization — checks [Authorize] / RequireAuthorization()
// 3. Endpoint handler executes:
//    - Model binding resolves {id} = 42 from route
//    - Handler returns IResult / IActionResult
// 4. Response serialised (JSON, etc.) and written to stream
// 5. Middleware pipeline unwinds (post-next() code runs)
// 6. Kestrel flushes bytes to client`,
    explanation:
      "Understanding the lifecycle explains why UseAuthentication must precede UseAuthorization and why static files should come before routing — each middleware only sees the HttpContext up to the point it is added.",
  },
  {
    id: "cs-middleware-order",
    language: "csharp",
    title: "Middleware order is critical — auth must precede endpoint",
    tag: "understanding",
    code: `var app = builder.Build();

// WRONG — authorization runs before routing so it has no endpoint metadata:
// app.UseAuthorization();
// app.UseRouting();

// CORRECT ordering:
app.UseExceptionHandler("/error");   // 1st — catch all errors
app.UseHsts();
app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseRouting();                    // must precede auth middlewares
app.UseAuthentication();
app.UseAuthorization();              // reads endpoint metadata set by routing
app.MapControllers();
app.Run();

// UseRouting populates the endpoint feature on HttpContext;
// UseAuthorization reads that feature to find [Authorize] attributes.`,
    explanation:
      "UseRouting populates IEndpointFeature on the context; UseAuthorization reads it to find policy requirements; reversing this order causes auth to run without endpoint metadata, skipping attribute-based policies.",
  },
  {
    id: "cs-endpoint-routing",
    language: "csharp",
    title: "Endpoint routing — separates matching from execution",
    tag: "understanding",
    code: `// Endpoint routing splits the old single "route + execute" step into two:
//
// Phase 1: UseRouting() — MATCH
//   - Examines the path and selects the best endpoint
//   - Stores it in HttpContext.GetEndpoint()
//   - Does NOT execute the handler yet
//
// Phase 2: UseEndpoints / MapControllers() etc. — EXECUTE
//   - Actually runs the handler for the matched endpoint
//
// Middleware between the two phases can read the matched endpoint:
app.UseRouting();

app.Use(async (ctx, next) =>
{
    var endpoint = ctx.GetEndpoint();
    Console.WriteLine(\`Matched: \${endpoint?.DisplayName}\`);
    await next(ctx);
});

app.UseAuthorization();   // reads endpoint metadata here
app.MapControllers();`,
    explanation:
      "Separating matching from execution lets middleware inserted between UseRouting and the endpoint handler inspect or act on which endpoint was matched, enabling smart auth, logging, and rate-limiting decisions.",
  },
  {
    id: "cs-model-binding",
    language: "csharp",
    title: "Model binding — route, query string, body, header",
    tag: "understanding",
    code: `// ASP.NET Core resolves action/handler parameters from multiple sources:

// Minimal API — infers source from parameter type and name:
app.MapGet("/users/{id}", (
    int id,                          // [FromRoute] — path segment
    string? filter,                  // [FromQuery] — ?filter=...
    ILogger<Program> logger) =>      // [FromServices] — DI
{
    logger.LogInformation("get user {id}", id);
    return Results.Ok();
});

app.MapPost("/orders", (
    [FromBody]   OrderRequest body,  // JSON body
    [FromHeader(Name="X-Api-Key")] string apiKey,
    [FromForm]   IFormFile? file) => // multipart form
    Results.Created());

// MVC controllers use [ApiController] for automatic 400 on bad binding`,
    explanation:
      "Minimal API infers the binding source from position and type; explicit From* attributes override inference; [ApiController] on MVC controllers automatically validates ModelState and returns 400.",
  },
  {
    id: "cs-validation-pipeline",
    language: "csharp",
    title: "[ApiController] auto-validates ModelState before action",
    tag: "understanding",
    code: `using System.ComponentModel.DataAnnotations;

public class CreateUserRequest
{
    [Required]
    [StringLength(50, MinimumLength = 2)]
    public string Name  { get; set; } = "";

    [Required, EmailAddress]
    public string Email { get; set; } = "";

    [Range(0, 150)]
    public int Age { get; set; }
}

[ApiController]
[Route("[controller]")]
public class UsersController : ControllerBase
{
    [HttpPost]
    public IActionResult Create(CreateUserRequest req)
    {
        // ModelState is already valid here — [ApiController] returned
        // 400 ProblemDetails automatically if it was not.
        return Ok(req);
    }
}`,
    explanation:
      "[ApiController] injects an action filter that validates ModelState before the action method runs and short-circuits with a 400 ValidationProblemDetails response, removing repetitive if (!ModelState.IsValid) checks.",
  },
  {
    id: "cs-filter-pipeline",
    language: "csharp",
    title: "Filter pipeline order — Auth → Resource → Exception → Action → Result",
    tag: "understanding",
    code: `// MVC filter execution order (innermost to outermost on return):
//
// 1. Authorization filters  — IAuthorizationFilter
//    ↓
// 2. Resource filters       — IResourceFilter (before model binding)
//    ↓
// 3. Exception filters      — IExceptionFilter (wrap action + result)
//    ↓
// 4. Action filters         — IActionFilter (OnActionExecuting/Executed)
//    ↓
//    ACTION METHOD
//    ↑
// 5. Action filters         — OnActionExecuted
//    ↑
// 6. Result filters         — IResultFilter (OnResultExecuting/Executed)
//    ↑
//    RESULT EXECUTION (JSON serialisation, view rendering, etc.)
//    ↑
// 7. Resource filters       — OnResourceExecuted
//
// Short-circuit: set context.Result in any filter to skip the rest.`,
    explanation:
      "Authorization runs first and can reject the request before any model binding happens; resource filters wrap the entire inner pipeline and are useful for caching whole responses; result filters modify the response after the action.",
  },
  {
    id: "cs-exception-middleware",
    language: "csharp",
    title: "Exception middleware — catch-all wrapper for the pipeline",
    tag: "understanding",
    code: `// UseExceptionHandler provides a centralized error-handling middleware:
var app = builder.Build();

app.UseExceptionHandler(errApp =>
{
    errApp.Run(async context =>
    {
        var feature = context.Features.Get<IExceptionHandlerFeature>();
        var ex      = feature?.Error;

        context.Response.StatusCode  = 500;
        context.Response.ContentType = "application/problem+json";

        var problem = new ProblemDetails
        {
            Status = 500,
            Title  = "An unexpected error occurred.",
            Detail = app.Environment.IsDevelopment() ? ex?.Message : null,
        };
        await context.Response.WriteAsJsonAsync(problem);
    });
});

app.MapControllers();
app.Run();`,
    explanation:
      "UseExceptionHandler catches any unhandled exception thrown after it in the pipeline and re-executes the error sub-pipeline; it is the outermost safety net and should be registered first.",
  },
  {
    id: "cs-response-caching",
    language: "csharp",
    title: "[ResponseCache] — HTTP Cache-Control headers",
    tag: "understanding",
    code: `var builder = WebApplication.CreateBuilder(args);
builder.Services.AddResponseCaching();

var app = builder.Build();
app.UseResponseCaching();   // must come BEFORE routing

// Sets: Cache-Control: public,max-age=60
[HttpGet("/products")]
[ResponseCache(Duration = 60, Location = ResponseCacheLocation.Any)]
public IActionResult GetProducts() => Ok(products);

// Vary by query string parameter:
[HttpGet("/search")]
[ResponseCache(Duration = 30, VaryByQueryKeys = new[] { "q" })]
public IActionResult Search(string q) => Ok(Search(q));

// No-cache:
[ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
public IActionResult Sensitive() => Ok(secret);`,
    explanation:
      "[ResponseCache] sets HTTP Cache-Control headers that instruct browsers and CDNs to cache responses; the built-in UseResponseCaching middleware also caches responses in-process — be aware of the difference.",
  },
  {
    id: "cs-output-caching",
    language: "csharp",
    title: "Output caching middleware — store full responses (.NET 7+)",
    tag: "understanding",
    code: `var builder = WebApplication.CreateBuilder(args);
builder.Services.AddOutputCache(opts =>
{
    opts.AddBasePolicy(b => b.Expire(TimeSpan.FromSeconds(10)));
    opts.AddPolicy("ByUser", b =>
        b.Expire(TimeSpan.FromMinutes(5)).VaryByHeader("Authorization"));
});

var app = builder.Build();
app.UseOutputCache();   // before routing

app.MapGet("/products", () => Results.Ok(GetProducts()))
   .CacheOutput();   // uses base policy

app.MapGet("/profile", (ClaimsPrincipal user) => Results.Ok(user.Identity!.Name))
   .CacheOutput("ByUser");

// Evict cache programmatically:
app.MapPost("/products", async (IOutputCacheStore store, CancellationToken ct) =>
{
    await store.EvictByTagAsync("products", ct);
    return Results.Created();
});`,
    explanation:
      "Output caching stores the full serialised response in memory (or a distributed cache); unlike [ResponseCache] it is server-side, so it caches even for authenticated requests and supports programmatic eviction.",
  },
  {
    id: "cs-rate-limiting-aspnet",
    language: "csharp",
    title: "app.UseRateLimiter — fixed-window and sliding-window",
    tag: "understanding",
    code: `using Microsoft.AspNetCore.RateLimiting;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddRateLimiter(opts =>
{
    opts.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    // Fixed window: 10 requests per 1 minute per IP
    opts.AddFixedWindowLimiter("fixed", o =>
    {
        o.PermitLimit         = 10;
        o.Window              = TimeSpan.FromMinutes(1);
        o.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        o.QueueLimit          = 2;
    });
});

var app = builder.Build();
app.UseRateLimiter();

app.MapGet("/api/data", () => Results.Ok("data"))
   .RequireRateLimiting("fixed");`,
    explanation:
      "UseRateLimiter (.NET 7+) is built-in and supports fixed-window, sliding-window, token-bucket, and concurrency limiters; apply a limiter to a route with RequireRateLimiting or globally via OnRejected.",
  },

  // ── structures ────────────────────────────────────────────────────────────
  {
    id: "cs-options-monitor",
    language: "csharp",
    title: "IOptionsMonitor<T> — hot-reload with OnChange callback",
    tag: "structures",
    code: `public class FeatureFlagService
{
    private readonly IOptionsMonitor<FeatureFlags> _monitor;

    public FeatureFlagService(IOptionsMonitor<FeatureFlags> monitor)
    {
        _monitor = monitor;

        // Callback fires when appsettings reloads (reloadOnChange: true):
        _monitor.OnChange(flags =>
            Console.WriteLine(\`Flags reloaded: DarkMode=\${flags.DarkMode}\`));
    }

    public bool IsDarkModeEnabled =>
        _monitor.CurrentValue.DarkMode;   // always fresh
}

public class FeatureFlags
{
    public bool DarkMode  { get; set; }
    public bool BetaNav   { get; set; }
}`,
    explanation:
      "IOptionsMonitor.CurrentValue reflects the latest configuration without restarting the app; OnChange lets you react to config changes, e.g., to flush a cache or reconnect a client.",
  },
  {
    id: "cs-options-snapshot",
    language: "csharp",
    title: "IOptionsSnapshot<T> — recomputed per scope (per request)",
    tag: "structures",
    code: `// IOptionsSnapshot is scoped — a new snapshot is created per request.
// Use it when options may change between requests (reloadOnChange: true).

public class PricingController : ControllerBase
{
    private readonly PricingOptions _opts;

    public PricingController(IOptionsSnapshot<PricingOptions> snapshot)
    {
        _opts = snapshot.Value;   // snapshot for this request
    }

    [HttpGet("/price/{sku}")]
    public decimal GetPrice(string sku)
    {
        return LookupBasePrice(sku) * _opts.TaxRate;
    }
}

// IOptions<T>          — singleton, never reloads
// IOptionsSnapshot<T>  — scoped, reloads between requests
// IOptionsMonitor<T>   — singleton, notifies on change`,
    explanation:
      "IOptionsSnapshot recomputes once per scope so all services within a single request share the same snapshot; use it over IOptions when config might change and you want consistency within a request.",
  },
  {
    id: "cs-iconfig-section",
    language: "csharp",
    title: "config.GetSection().Get<T>() — typed section access",
    tag: "structures",
    code: `// appsettings.json:
// {
//   "Database": {
//     "Host": "db.example.com",
//     "Port": 5432,
//     "Credentials": { "User": "admin", "Password": "secret" }
//   }
// }

var config = builder.Configuration;

// Bind entire section to a class:
var dbOpts = config.GetSection("Database").Get<DatabaseOptions>();
Console.WriteLine(dbOpts?.Host);   // db.example.com

// Read a single nested value:
var port = config.GetValue<int>("Database:Port");
Console.WriteLine(port);           // 5432

public class DatabaseOptions
{
    public string Host    { get; set; } = "";
    public int    Port    { get; set; }
    public CredentialOptions Credentials { get; set; } = new();
}`,
    explanation:
      "GetSection returns a non-null IConfigurationSection even if the key doesn't exist; Get<T>() returns null in that case — always check for null or use Configure<T> to bind with validation.",
  },
  {
    id: "cs-iconfig-bind",
    language: "csharp",
    title: "config.Bind — populate an existing object from config",
    tag: "structures",
    code: `using Microsoft.Extensions.Configuration;

var config = new ConfigurationBuilder()
    .AddJsonFile("appsettings.json")
    .AddEnvironmentVariables()
    .Build();

// Populate an existing (possibly already partially set) object:
var opts = new AppOptions { Timeout = 30 };   // default
config.Bind("App", opts);                      // overwrite with config values
Console.WriteLine(opts.Timeout);               // value from config or 30

// Equivalent to:
// var opts = config.GetSection("App").Get<AppOptions>() ?? new AppOptions();

public class AppOptions
{
    public int    Timeout  { get; set; } = 30;
    public string BaseUrl  { get; set; } = "";
}`,
    explanation:
      "Bind is useful when you want to preserve default values for keys not present in config; Get<T>() creates a new instance and leaves unmatched properties at their type defaults.",
  },
  {
    id: "cs-env-config",
    language: "csharp",
    title: "Environment variables override JSON config",
    tag: "structures",
    code: `// appsettings.json:  { "Database": { "Host": "localhost" } }
// Environment var:   Database__Host=prod.db.example.com
//                    (double underscore = nesting separator)

var builder = WebApplication.CreateBuilder(args);
// CreateBuilder already adds env vars; they take priority over JSON.

var host = builder.Configuration["Database:Host"];
// In production: "prod.db.example.com" (env var wins)
// In development: "localhost" (JSON)

// Prefix to avoid collisions in shared environments:
builder.Configuration.AddEnvironmentVariables("MYAPP_");
// MYAPP_Database__Host=... maps to Database:Host`,
    explanation:
      "The default builder adds providers in order: JSON files, user secrets, environment variables, command-line; later providers win — double-underscores in env var names map to the colon separator used in config paths.",
  },
  {
    id: "cs-secrets-config",
    language: "csharp",
    title: "User Secrets — dev-time secrets outside source control",
    tag: "structures",
    code: `// 1. Enable in .csproj:
// <PropertyGroup>
//   <UserSecretsId>my-app-guid-here</UserSecretsId>
// </PropertyGroup>

// 2. Store a secret (stores in ~/.microsoft/usersecrets/<id>/secrets.json):
// $ dotnet user-secrets set "Database:Password" "s3cr3t"
// $ dotnet user-secrets set "Jwt:Key" "supersecretkey"

// 3. Secrets are auto-loaded in Development by CreateBuilder:
var connStr = builder.Configuration.GetConnectionString("Default");
// "Server=localhost;Password=s3cr3t"

// 4. In production use environment variables, Azure Key Vault, or AWS Secrets Manager.
// Never commit secrets.json or .env files to source control.`,
    explanation:
      "User secrets store sensitive config in your home directory (outside the repo); they are layered on top of appsettings.Development.json in Development only — invisible in other environments.",
  },
  {
    id: "cs-json-config",
    language: "csharp",
    title: "appsettings layering — base + environment-specific override",
    tag: "structures",
    code: `// File loading order (later files win):
// 1. appsettings.json              — base defaults
// 2. appsettings.{Environment}.json — environment overrides
// 3. User secrets (Development only)
// 4. Environment variables
// 5. Command-line arguments

// appsettings.json:
// { "Logging": { "LogLevel": { "Default": "Information" } }, "Timeout": 30 }

// appsettings.Production.json:
// { "Logging": { "LogLevel": { "Default": "Warning" } }, "Timeout": 10 }

// At runtime in Production: Logging.LogLevel.Default = "Warning", Timeout = 10

var env = builder.Environment.EnvironmentName;   // "Production"
// CreateBuilder automatically loads appsettings.Production.json`,
    explanation:
      "The environment-specific JSON file only needs to contain the keys it overrides — missing keys fall back to appsettings.json; ASPNETCORE_ENVIRONMENT controls which overlay is loaded.",
  },
  {
    id: "cs-config-reload",
    language: "csharp",
    title: "reloadOnChange — watch config files for changes",
    tag: "structures",
    code: `var builder = WebApplication.CreateBuilder(args);

// Both calls add reloadOnChange by default in CreateBuilder,
// but you can add additional sources explicitly:
builder.Configuration.AddJsonFile("custom.json",
    optional: true,
    reloadOnChange: true);   // watches the file for filesystem changes

// Verify that IOptionsMonitor picks up changes:
builder.Services.Configure<CustomOptions>(
    builder.Configuration.GetSection("Custom"));

// Use IOptionsMonitor<CustomOptions> in services — CurrentValue updates
// within seconds of the file changing on disk.

// Note: reloadOnChange uses a FileSystemWatcher, which has
// platform quirks (Docker volumes, network shares); test in your target env.`,
    explanation:
      "reloadOnChange fires a configuration reload when the JSON file is modified on disk; pair it with IOptionsMonitor to receive the updated values without restarting the process.",
  },
  {
    id: "cs-startup-filters",
    language: "csharp",
    title: "IStartupFilter — wrap the middleware pipeline",
    tag: "structures",
    code: `using Microsoft.AspNetCore.Hosting;

// IStartupFilter runs before Configure() and can prepend/append middleware
public class TimingStartupFilter : IStartupFilter
{
    public Action<IApplicationBuilder> Configure(Action<IApplicationBuilder> next)
    {
        return app =>
        {
            // Prepend middleware to the BEGINNING of the pipeline:
            app.Use(async (ctx, n) =>
            {
                var sw = System.Diagnostics.Stopwatch.StartNew();
                await n(ctx);
                Console.WriteLine(\`\${ctx.Request.Path} took \${sw.ElapsedMilliseconds}ms\`);
            });

            next(app);   // run the rest of Configure()
        };
    }
}

// Register:
services.AddTransient<IStartupFilter, TimingStartupFilter>();`,
    explanation:
      "IStartupFilter is invoked before the application's Configure method runs, enabling libraries and plugins to inject middleware at the outermost position without modifying Startup.cs.",
  },
  {
    id: "cs-app-parts",
    language: "csharp",
    title: "ApplicationPart — plugin-based controller discovery",
    tag: "structures",
    code: `using Microsoft.AspNetCore.Mvc.ApplicationParts;

var builder = WebApplication.CreateBuilder(args);
var mvcBuilder = builder.Services.AddControllers();

// Load controllers from an external assembly (plugin):
var pluginAssembly = Assembly.LoadFrom("MyPlugin.dll");
mvcBuilder.AddApplicationPart(pluginAssembly);

// Feature providers control what is discovered from application parts:
mvcBuilder.ConfigureApplicationPartManager(mgr =>
{
    // Remove the built-in controller feature provider and add a custom one:
    var existing = mgr.FeatureProviders.OfType<ControllerFeatureProvider>().First();
    mgr.FeatureProviders.Remove(existing);
    mgr.FeatureProviders.Add(new FilteredControllerProvider());
});

var app = builder.Build();
app.MapControllers();`,
    explanation:
      "Application parts let you split your API across multiple assemblies and load them at startup; this enables plugin architectures where controllers, views, and Razor pages ship as separate NuGet packages.",
  },
  {
    id: "cs-generic-host",
    language: "csharp",
    title: "Host.CreateDefaultBuilder — logging, config, DI",
    tag: "structures",
    code: `using Microsoft.Extensions.Hosting;

// CreateDefaultBuilder wires up:
// - Configuration: appsettings.json, appsettings.{env}.json, env vars, CLI args
// - Logging: Console, Debug, EventSource
// - DI: IServiceCollection with standard services
// - Host lifecycle: graceful shutdown on Ctrl-C

IHost host = Host.CreateDefaultBuilder(args)
    .ConfigureServices((ctx, services) =>
    {
        services.AddHostedService<MyBackgroundWorker>();
        services.Configure<WorkerOptions>(ctx.Configuration.GetSection("Worker"));
    })
    .Build();

await host.RunAsync();   // blocks until shutdown signal`,
    explanation:
      "CreateDefaultBuilder is the non-web generic host; use it for console apps, workers, and services that don't need HTTP; WebApplication.CreateBuilder adds the HTTP stack on top of this foundation.",
  },
  {
    id: "cs-web-host",
    language: "csharp",
    title: "WebApplication.CreateBuilder — adds HTTP to the generic host",
    tag: "structures",
    code: `using Microsoft.AspNetCore.Builder;

// WebApplication.CreateBuilder = generic host + HTTP server (Kestrel)
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

if (app.Environment.IsDevelopment())
    app.UseSwagger().UseSwaggerUI();

app.UseHttpsRedirection();
app.MapControllers();
await app.RunAsync();   // starts Kestrel and blocks`,
    explanation:
      "WebApplication wraps WebApplicationBuilder; builder.Services configures DI, builder.Configuration configures options, and the app variable builds and configures the middleware pipeline.",
  },
  {
    id: "cs-service-worker",
    language: "csharp",
    title: "BackgroundService — long-running hosted service",
    tag: "structures",
    code: `using Microsoft.Extensions.Hosting;

public class QueueWorker : BackgroundService
{
    private readonly ILogger<QueueWorker> _log;
    private readonly IMessageQueue        _queue;

    public QueueWorker(ILogger<QueueWorker> log, IMessageQueue queue)
    {
        _log   = log;
        _queue = queue;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _log.LogInformation("worker started");

        await foreach (var msg in _queue.ReadAllAsync(stoppingToken))
        {
            try   { await ProcessAsync(msg, stoppingToken); }
            catch (Exception ex) { _log.LogError(ex, "processing failed"); }
        }
    }
}

// Register:
builder.Services.AddHostedService<QueueWorker>();`,
    explanation:
      "BackgroundService implements IHostedService; override ExecuteAsync with your long-running loop; the stoppingToken is cancelled when the host receives a shutdown signal — always propagate it.",
  },
  {
    id: "cs-cronos-scheduler",
    language: "csharp",
    title: "Cronos + BackgroundService — cron-style scheduling",
    tag: "structures",
    code: `// NuGet: Cronos
using Cronos;

public class DailyReportJob : BackgroundService
{
    private readonly CronExpression _cron =
        CronExpression.Parse("0 8 * * *", CronFormat.Standard); // 08:00 daily

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            var now  = DateTime.UtcNow;
            var next = _cron.GetNextOccurrence(now, TimeZoneInfo.Utc);
            if (next is null) break;

            var delay = next.Value - now;
            await Task.Delay(delay, stoppingToken);

            if (!stoppingToken.IsCancellationRequested)
                await GenerateReportAsync(stoppingToken);
        }
    }

    private Task GenerateReportAsync(CancellationToken ct) =>
        Task.CompletedTask;   // real work here
}`,
    explanation:
      "Cronos parses standard cron expressions and computes the next occurrence; wrapping it in a BackgroundService loop with Task.Delay provides lightweight cron scheduling without a full job-scheduler library.",
  },

  // ── caveats ───────────────────────────────────────────────────────────────
  {
    id: "cs-di-circular-dep",
    language: "csharp",
    title: "Circular dependency — throws at first resolve",
    tag: "caveats",
    code: `// A depends on B, B depends on A — circular!
public class ServiceA
{
    public ServiceA(ServiceB b) { }
}

public class ServiceB
{
    public ServiceB(ServiceA a) { }
}

services.AddTransient<ServiceA>();
services.AddTransient<ServiceB>();

// Throws at GetRequiredService<ServiceA>():
// InvalidOperationException: A circular dependency was detected for
// the service of type 'ServiceA'.

// Fix: introduce an interface, use Lazy<T>, or restructure to remove the cycle:
public class ServiceA
{
    private readonly Lazy<ServiceB> _b;
    public ServiceA(Lazy<ServiceB> b) => _b = b;
}`,
    explanation:
      "The DI container detects circular dependencies at resolve time and throws immediately; fix by extracting a third service that both depend on, or using Lazy<T> to break the construction cycle.",
  },
  {
    id: "cs-singleton-state",
    language: "csharp",
    title: "Singleton state is shared — requires thread-safety",
    tag: "caveats",
    code: `// DANGEROUS — plain Dictionary is not thread-safe
public class CounterService
{
    private readonly Dictionary<string, int> _counts = new();

    public void Increment(string key)
        => _counts[key] = _counts.GetValueOrDefault(key) + 1;  // race condition!
}

// SAFE — ConcurrentDictionary for concurrent access
public class SafeCounterService
{
    private readonly ConcurrentDictionary<string, int> _counts = new();

    public void Increment(string key)
        => _counts.AddOrUpdate(key, 1, (_, old) => old + 1);

    public int Get(string key)
        => _counts.GetValueOrDefault(key, 0);
}

services.AddSingleton<SafeCounterService>();`,
    explanation:
      "Singletons handle requests concurrently; any mutable state must be protected with ConcurrentDictionary, Interlocked, lock, or a channel — a race in a singleton affects every user of the application.",
  },
  {
    id: "cs-scoped-dispose",
    language: "csharp",
    title: "Scoped services dispose at end of scope",
    tag: "caveats",
    code: `public class DbContext : IDisposable
{
    public DbContext() => Console.WriteLine("DbContext created");
    public void Dispose() => Console.WriteLine("DbContext disposed");
}

services.AddScoped<DbContext>();

// In a controller action the scope is the HTTP request:
// DbContext is created when first injected and Dispose() is called
// automatically when the request completes.

// Manual scope (background worker, console app):
using (var scope = provider.CreateScope())
{
    var ctx = scope.ServiceProvider.GetRequiredService<DbContext>();
    // DbContext created here
    ctx.SaveChanges();
}   // DbContext.Dispose() called here — even if an exception occurred`,
    explanation:
      "Scoped services are automatically disposed when the scope ends; forgetting to wrap background work in a scope leaks resources since the default scope (the root) lives for the app's lifetime.",
  },
  {
    id: "cs-hosted-service-error",
    language: "csharp",
    title: "Unhandled exception in ExecuteAsync stops the hosted service",
    tag: "caveats",
    code: `public class FragileWorker : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // An unhandled exception here terminates this service.
        // In .NET 6+ it propagates and by default stops the whole host!
        throw new InvalidOperationException("oops");
    }
}

// Opt into host-stopping behaviour (default in .NET 6+):
builder.Services.Configure<HostOptions>(opts =>
    opts.BackgroundServiceExceptionBehavior =
        BackgroundServiceExceptionBehavior.StopHost);   // default

// Opt into silently stopping just this service (legacy .NET 3-5 behaviour):
builder.Services.Configure<HostOptions>(opts =>
    opts.BackgroundServiceExceptionBehavior =
        BackgroundServiceExceptionBehavior.Ignore);`,
    explanation:
      "Since .NET 6 an unhandled exception in a BackgroundService propagates to the host and stops the application by default; always wrap your ExecuteAsync loop in try/catch and log or handle errors.",
  },
  {
    id: "cs-background-exception",
    language: "csharp",
    title: "Catch all exceptions in BackgroundService to prevent crash",
    tag: "caveats",
    code: `public class ResilientWorker : BackgroundService
{
    private readonly ILogger<ResilientWorker> _log;

    public ResilientWorker(ILogger<ResilientWorker> log) => _log = log;

    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        while (!ct.IsCancellationRequested)
        {
            try
            {
                await DoWorkAsync(ct);
            }
            catch (OperationCanceledException) when (ct.IsCancellationRequested)
            {
                break;   // normal shutdown — do not log as error
            }
            catch (Exception ex)
            {
                _log.LogError(ex, "work failed, retrying in 5s");
                await Task.Delay(TimeSpan.FromSeconds(5), ct);
            }
        }
    }
}`,
    explanation:
      "Always distinguish OperationCanceledException caused by the stopping token (normal shutdown) from other exceptions; catching and logging other exceptions keeps the worker alive after transient failures.",
  },
  {
    id: "cs-cancellation-host",
    language: "csharp",
    title: "stoppingToken — signals graceful shutdown in ExecuteAsync",
    tag: "caveats",
    code: `public class GracefulWorker : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // Pass stoppingToken to all async calls so they can cancel:
        while (!stoppingToken.IsCancellationRequested)
        {
            var batch = await _queue.DequeueBatchAsync(stoppingToken);
            await ProcessBatchAsync(batch, stoppingToken);
        }
        // On cancellation, do any cleanup AFTER the loop:
        await FlushPendingAsync(CancellationToken.None);  // don't pass stoppingToken here!
    }
}

// Host gives 5 seconds (default) for graceful shutdown before hard kill:
builder.Services.Configure<HostOptions>(opts =>
    opts.ShutdownTimeout = TimeSpan.FromSeconds(30));`,
    explanation:
      "Pass stoppingToken to every awaitable operation so they cancel promptly on shutdown; use CancellationToken.None only for cleanup code that must complete even after the signal fires.",
  },
  {
    id: "cs-middleware-exception",
    language: "csharp",
    title: "Exception after response starts — cannot change status code",
    tag: "caveats",
    code: `app.Use(async (context, next) =>
{
    try
    {
        await next(context);
    }
    catch (Exception ex)
    {
        if (context.Response.HasStarted)
        {
            // Headers already sent to client — cannot change status code!
            // The only option is to log and rethrow:
            Console.WriteLine(\`Error after response started: \${ex.Message}\`);
            throw;
        }

        context.Response.StatusCode = 500;
        await context.Response.WriteAsync("Internal Server Error");
    }
});`,
    explanation:
      "Once any bytes have been written to the response stream the status code and headers are on the wire; check HasStarted before writing error responses, and rethrow if you cannot modify the response.",
  },
  {
    id: "cs-response-already-started",
    language: "csharp",
    title: "HttpResponse.HasStarted — guard before writing headers",
    tag: "caveats",
    code: `public class HeaderInjectionMiddleware
{
    private readonly RequestDelegate _next;
    public HeaderInjectionMiddleware(RequestDelegate next) => _next = next;

    public async Task InvokeAsync(HttpContext context)
    {
        // Register a callback to run just before the first write:
        context.Response.OnStarting(state =>
        {
            var ctx = (HttpContext)state;
            // Safe here — called before first byte is written
            ctx.Response.Headers["X-Request-Id"] = Guid.NewGuid().ToString();
            return Task.CompletedTask;
        }, context);

        await _next(context);

        // TOO LATE — response may have started:
        if (!context.Response.HasStarted)
            context.Response.Headers["X-Timing"] = "late";
    }
}`,
    explanation:
      "OnStarting registers a callback that fires atomically before the first byte; it is the correct place to add headers when you do not control when the response body starts writing.",
  },
  {
    id: "cs-model-bind-null",
    language: "csharp",
    title: "Nullable reference types in model classes can be null from body",
    tag: "caveats",
    code: `// This model has nullable annotations but no [Required]:
public class OrderRequest
{
    public string? ProductId { get; set; }  // nullable — can be omitted in JSON
    public int     Quantity  { get; set; }  // int — defaults to 0 if omitted
}

// JSON: {} — ProductId is null, Quantity is 0 — both VALID for binding.
// Add [Required] to make null a validation error:
public class SafeOrderRequest
{
    [Required]
    public string ProductId { get; set; } = "";
    [Range(1, 1000)]
    public int Quantity { get; set; }
}

// With [ApiController], a missing [Required] field returns 400 automatically.`,
    explanation:
      "Nullable annotations are a compile-time concern; at runtime model binding can still produce null for reference types; always add [Required] for fields that must be present in the request body.",
  },
  {
    id: "cs-validation-cascade",
    language: "csharp",
    title: "Validation stops at first failed attribute per property",
    tag: "caveats",
    code: `public class RegisterRequest
{
    // Only the FIRST failing attribute is reported per property:
    [Required(ErrorMessage = "Email is required")]
    [EmailAddress(ErrorMessage = "Email is not valid")]
    [MaxLength(200, ErrorMessage = "Email too long")]
    public string Email { get; set; } = "";
}

// If Email is "" → only "Email is required" is returned.
// If Email is "bad-email" → only "Email is not valid" is returned.

// To collect ALL errors for a single property, use a custom ValidationAttribute
// or switch to FluentValidation:
// RuleFor(x => x.Email)
//     .NotEmpty()
//     .EmailAddress()
//     .MaximumLength(200);   // all three are always evaluated`,
    explanation:
      "DataAnnotations validates attributes in order and stops on the first failure per property, so users only see one error message at a time; FluentValidation evaluates all rules and returns them together.",
  },
  {
    id: "cs-filter-short-circuit",
    language: "csharp",
    title: "Resource filter short-circuit — skips model binding and action",
    tag: "caveats",
    code: `public class CacheFilter : Attribute, IResourceFilter
{
    public void OnResourceExecuting(ResourceExecutingContext context)
    {
        var key    = context.HttpContext.Request.Path.Value!;
        var cached = Cache.Get(key);

        if (cached is not null)
        {
            // Short-circuit: set Result to skip model binding AND the action:
            context.Result = new ContentResult
            {
                Content     = cached,
                ContentType = "application/json",
            };
            // OnResourceExecuted will still be called, but NOT the action.
        }
    }

    public void OnResourceExecuted(ResourceExecutedContext context) { }
}`,
    explanation:
      "Setting context.Result in OnResourceExecuting skips model binding, action filters, the action itself, and result filters; OnResourceExecuted still fires to allow cleanup — but exception filters are also bypassed.",
  },
  {
    id: "cs-di-missing-registration",
    language: "csharp",
    title: "GetRequiredService throws if T is not registered",
    tag: "caveats",
    code: `services.AddSingleton<IRegistered, MyService>();

var provider = services.BuildServiceProvider();

// Registered — returns instance:
var svc = provider.GetRequiredService<IRegistered>();

// Not registered — throws immediately:
try
{
    var missing = provider.GetRequiredService<INotRegistered>();
}
catch (InvalidOperationException ex)
{
    Console.WriteLine(ex.Message);
    // No service for type 'INotRegistered' has been registered.
}

// GetService<T>() returns null instead of throwing:
var maybe = provider.GetService<INotRegistered>();   // null
Console.WriteLine(maybe is null);   // True`,
    explanation:
      "GetRequiredService throws immediately on missing registrations; use it by default to catch wiring errors early; use GetService only when the service is genuinely optional and you handle null.",
  },
  {
    id: "cs-config-null-section",
    language: "csharp",
    title: "GetSection('Missing') returns a non-null empty section",
    tag: "caveats",
    code: `var config = new ConfigurationBuilder()
    .AddInMemoryCollection(new Dictionary<string, string?>
    {
        ["Foo:Bar"] = "value",
    })
    .Build();

// GetSection never returns null:
var section = config.GetSection("NonExistent");
Console.WriteLine(section is null);       // False
Console.WriteLine(section.Exists());      // False  — key not in config
Console.WriteLine(section.Value);         // null

// Get<T>() on a missing section returns null:
var opts = config.GetSection("NonExistent").Get<MyOptions>();
Console.WriteLine(opts is null);          // True

// GetValue<T> with fallback:
var port = config.GetValue<int>("NonExistent:Port", defaultValue: 8080);
Console.WriteLine(port);                  // 8080`,
    explanation:
      "Always call Exists() or use Get<T>() null-check rather than checking the section reference for null; returning a non-null empty section avoids NullReferenceException but can mask missing configuration.",
  },
  {
    id: "cs-env-var-override",
    language: "csharp",
    title: "ASPNETCORE_ENVIRONMENT overrides launchSettings.json",
    tag: "caveats",
    code: `// launchSettings.json sets ASPNETCORE_ENVIRONMENT for local dev only.
// In production, set the environment variable directly:

// Docker:
// ENV ASPNETCORE_ENVIRONMENT=Production

// Kubernetes:
// env:
//   - name: ASPNETCORE_ENVIRONMENT
//     value: Production

// The value controls which appsettings.{env}.json is loaded,
// and which IWebHostEnvironment.Is*() methods return true:

if (app.Environment.IsProduction())
    app.UseHsts();

if (app.Environment.IsDevelopment())
    app.UseDeveloperExceptionPage();

// Custom environments:
if (app.Environment.IsEnvironment("Staging"))
    app.UseSwagger();`,
    explanation:
      "launchSettings.json is a developer convenience only — it is never deployed; in staging and production, set ASPNETCORE_ENVIRONMENT via the hosting platform's environment variable mechanism.",
  },

  // ── types ─────────────────────────────────────────────────────────────────
  {
    id: "cs-iserviceprovider-type",
    language: "csharp",
    title: "IServiceProvider — the DI container root interface",
    tag: "types",
    code: `using Microsoft.Extensions.DependencyInjection;

// IServiceProvider is the core abstraction:
public interface IServiceProvider
{
    object? GetService(Type serviceType);
}

// Extension methods add generic convenience:
// T?   GetService<T>(this IServiceProvider sp)
// T    GetRequiredService<T>(this IServiceProvider sp)
// IEnumerable<T> GetServices<T>(...)

// IServiceScope wraps a child provider for scoped services:
using (var scope = provider.CreateScope())
{
    IServiceProvider scopedProvider = scope.ServiceProvider;
    var svc = scopedProvider.GetRequiredService<IMyScoped>();
}

// Avoid the service-locator anti-pattern — inject services in constructors,
// not IServiceProvider, unless you are writing infrastructure code.`,
    explanation:
      "IServiceProvider is the minimal interface for resolving services; IServiceScope wraps a child IServiceProvider for scoped lifetimes; inject IServiceProvider directly only in factories and middleware.",
  },
  {
    id: "cs-iservicescope-type",
    language: "csharp",
    title: "IServiceScope — child scope for scoped service resolution",
    tag: "types",
    code: `using Microsoft.Extensions.DependencyInjection;

// IServiceScope = child IServiceProvider + IDisposable
public interface IServiceScope : IDisposable
{
    IServiceProvider ServiceProvider { get; }
}

// Create a scope from a singleton or background service:
public class BackgroundWorker : BackgroundService
{
    private readonly IServiceScopeFactory _factory;

    public BackgroundWorker(IServiceScopeFactory factory)
        => _factory = factory;

    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        while (!ct.IsCancellationRequested)
        {
            // Each unit of work gets its own scope:
            await using var scope = _factory.CreateAsyncScope();
            var repo = scope.ServiceProvider.GetRequiredService<IOrderRepo>();
            await repo.ProcessPendingAsync(ct);
        }
    }
}`,
    explanation:
      "Always dispose IServiceScope (or use using) so scoped services are disposed; CreateAsyncScope disposes asynchronously if services implement IAsyncDisposable — prefer it over CreateScope.",
  },
  {
    id: "cs-ilogger-type",
    language: "csharp",
    title: "ILogger<T> — category is the full type name",
    tag: "types",
    code: `using Microsoft.Extensions.Logging;

public class OrderService
{
    // Category = "MyApp.Services.OrderService" (full type name)
    private readonly ILogger<OrderService> _logger;

    public OrderService(ILogger<OrderService> logger)
        => _logger = logger;

    public void Place(Order order)
    {
        // Structured logging — {} names become properties in structured sinks:
        _logger.LogInformation("placing order {OrderId} for {UserId}",
            order.Id, order.UserId);

        // Use LogError with exception as first argument:
        try { Save(order); }
        catch (Exception ex)
        {
            _logger.LogError(ex, "failed to save order {OrderId}", order.Id);
            throw;
        }
    }
}`,
    explanation:
      "The generic parameter T provides the category name; positional placeholders in the format string become structured properties in Serilog, Seq, and Application Insights — use descriptive names, not {0}.",
  },
  {
    id: "cs-ilogger-factory",
    language: "csharp",
    title: "ILoggerFactory — create loggers for non-generic contexts",
    tag: "types",
    code: `using Microsoft.Extensions.Logging;

// ILoggerFactory creates ILogger instances with arbitrary category names.
// Useful when the type name is not available (e.g. dynamic plugins).

public class PluginHost
{
    private readonly ILoggerFactory _factory;

    public PluginHost(ILoggerFactory factory) => _factory = factory;

    public void LoadPlugin(string pluginName)
    {
        // Create a logger named after the plugin, not the host class:
        var logger = _factory.CreateLogger(\`Plugin.\${pluginName}\`);
        logger.LogInformation("loading plugin {Name}", pluginName);
    }
}

// ILoggerFactory is registered as a singleton by AddLogging().
// Prefer ILogger<T> in most cases — ILoggerFactory only for dynamic categories.`,
    explanation:
      "ILoggerFactory lets you create loggers with arbitrary string categories; inject it when the category must be determined at runtime, but prefer ILogger<T> for compile-time-known types.",
  },
  {
    id: "cs-ihost-type",
    language: "csharp",
    title: "IHost / IHostedService / IHostLifetime interface hierarchy",
    tag: "types",
    code: `// IHostedService — a service the host starts and stops:
public interface IHostedService
{
    Task StartAsync(CancellationToken cancellationToken);
    Task StopAsync(CancellationToken cancellationToken);
}

// BackgroundService implements IHostedService with an ExecuteAsync pattern.

// IHostLifetime — pluggable lifetime management (Console, Windows Service, systemd):
// ConsoleLifetime (default) listens for Ctrl-C / SIGTERM.

// IHost — the top-level application:
public interface IHost : IDisposable
{
    IServiceProvider Services { get; }
    Task StartAsync(CancellationToken ct = default);
    Task StopAsync(CancellationToken ct = default);
}

// IHostApplicationLifetime — programmatic control:
// ApplicationStarted, ApplicationStopping, ApplicationStopped tokens
// StopApplication() — initiate graceful shutdown from code`,
    explanation:
      "IHost owns the lifetime of all IHostedServices and the DI container; IHostApplicationLifetime lets code trigger or observe shutdown events; inject it to perform orderly cleanup.",
  },
  {
    id: "cs-iapp-builder",
    language: "csharp",
    title: "IApplicationBuilder — build the middleware pipeline",
    tag: "types",
    code: `using Microsoft.AspNetCore.Builder;

// IApplicationBuilder accumulates middleware components in order
public interface IApplicationBuilder
{
    IServiceProvider ApplicationServices { get; }
    IApplicationBuilder Use(Func<RequestDelegate, RequestDelegate> middleware);
    RequestDelegate Build();  // creates the final pipeline delegate
    IApplicationBuilder New();
    // ... plus properties for features and environment
}

// Extension methods wrap Use():
// app.UseRouting()     → app.Use(next => new RoutingMiddleware(next).Invoke)
// app.UseStaticFiles() → app.Use(next => new StaticFileMiddleware(next, ...).Invoke)

// Build() produces a single RequestDelegate:
// context => middleware1(context, () => middleware2(context, () => ... last(context)))`,
    explanation:
      "IApplicationBuilder is a builder for a RequestDelegate chain; each Use call prepends a middleware factory; Build() composes them into a single function called for every request.",
  },
  {
    id: "cs-iendpoint-builder",
    language: "csharp",
    title: "IEndpointRouteBuilder — add routes in minimal API",
    tag: "types",
    code: `using Microsoft.AspNetCore.Routing;

// WebApplication implements IEndpointRouteBuilder
// MapGet / MapPost / MapGroup are extension methods on it:

var app = builder.Build();

// Direct on app (which is IEndpointRouteBuilder):
app.MapGet("/",  () => "root");
app.MapPost("/data", (DataRequest r) => Results.Created("/data/1", r));

// Extension method to extract route registration to a separate class:
public static class OrderEndpoints
{
    public static IEndpointRouteBuilder MapOrderEndpoints(
        this IEndpointRouteBuilder routes)
    {
        routes.MapGet("/orders",        () => Results.Ok());
        routes.MapPost("/orders",       (OrderReq r) => Results.Created());
        return routes;
    }
}

app.MapOrderEndpoints();`,
    explanation:
      "IEndpointRouteBuilder is the abstraction for adding route endpoints; extracting MapXxx calls to extension methods on IEndpointRouteBuilder keeps Program.cs lean and makes routes testable.",
  },
  {
    id: "cs-iroute-builder",
    language: "csharp",
    title: "Route constraints — {id:int}, {slug:regex}, {id:min(1)}",
    tag: "types",
    code: `// Route constraints validate and convert route segments:
app.MapGet("/users/{id:int}",          (int id)    => Results.Ok(id));
app.MapGet("/users/{id:guid}",         (Guid id)   => Results.Ok(id));
app.MapGet("/posts/{year:int:min(2000)}/{slug:minlength(3)}",
           (int year, string slug)     => Results.Ok());
app.MapGet("/files/{name:regex(^[a-z]+\\.txt\$)}",
           (string name)               => Results.Ok(name));

// Constraint list:
// alpha, bool, datetime, decimal, double, float, guid,
// int, long, max(n), min(n), maxlength(n), minlength(n),
// range(min,max), regex(expr), required

// Custom constraint — implement IRouteConstraint:
// builder.Services.Configure<RouteOptions>(opts =>
//     opts.ConstraintMap["even"] = typeof(EvenNumberConstraint));`,
    explanation:
      "Route constraints filter which requests match a route and parse the segment to the target type; combine multiple constraints with colons; mismatches result in a 404 (no match), not a 400.",
  },
  {
    id: "cs-iconfig-type",
    language: "csharp",
    title: "IConfiguration / IConfigurationRoot / IConfigurationSection",
    tag: "types",
    code: `using Microsoft.Extensions.Configuration;

// Hierarchy:
// IConfiguration         — read values, get sections
// IConfigurationRoot     — IConfiguration + Reload(), Providers
// IConfigurationSection  — IConfiguration + Key, Path, Value

IConfiguration     config  = builder.Configuration;
IConfigurationRoot root    = (IConfigurationRoot)config;

// Flat key access (case-insensitive, colon separator):
string? host = config["Database:Host"];

// Section access:
IConfigurationSection section = config.GetSection("Database");
Console.WriteLine(section.Key);    // Database
Console.WriteLine(section.Path);   // Database
Console.WriteLine(section["Host"]); // db.example.com

// Force a reload of file-based providers:
root.Reload();

// Inspect all providers (for debugging):
foreach (var p in root.Providers)
    Console.WriteLine(p.GetType().Name);`,
    explanation:
      "IConfiguration is the read-only abstraction; IConfigurationRoot adds Reload and provider inspection; IConfigurationSection is a sub-tree of the configuration with its own path — all three share the same colon-delimited key syntax.",
  },
  {
    id: "cs-ioptions-type",
    language: "csharp",
    title: "IOptions<T> vs IOptionsSnapshot<T> — singleton vs scoped",
    tag: "types",
    code: `// IOptions<T> — SINGLETON, values set once at startup, never reload
public interface IOptions<out TOptions> where TOptions : class
{
    TOptions Value { get; }
}

// IOptionsSnapshot<T> — SCOPED, recomputed once per scope
// Reflects config changes between requests when reloadOnChange=true
public interface IOptionsSnapshot<out TOptions> : IOptions<TOptions>
    where TOptions : class
{
    TOptions Get(string? name);   // supports named options
}

// IOptionsMonitor<T> — SINGLETON, notifies on change
// CurrentValue always returns the latest value

// Inject in services:
// IOptions<T>         → stable config in singleton services
// IOptionsSnapshot<T> → changeable config in scoped/transient services
// IOptionsMonitor<T>  → changeable config in singleton services`,
    explanation:
      "Use IOptions<T> when values never change during the app lifetime; IOptionsSnapshot in scoped services for per-request freshness; IOptionsMonitor in singletons when you need live updates.",
  },
  {
    id: "cs-ihttpclient-factory",
    language: "csharp",
    title: "IHttpClientFactory — manage HttpClient lifecycle and pooling",
    tag: "types",
    code: `// IHttpClientFactory solves two HttpClient problems:
// 1. DNS changes ignored by long-lived clients (socket exhaustion if creating new ones)
// 2. Handler pooling — sockets reused with configurable lifetime

builder.Services.AddHttpClient("github", client =>
{
    client.BaseAddress = new Uri("https://api.github.com/");
    client.DefaultRequestHeaders.Add("Accept", "application/vnd.github+json");
    client.Timeout = TimeSpan.FromSeconds(10);
});

// Typed client (preferred):
builder.Services.AddHttpClient<GitHubClient>();

// Inject and use a named client:
public class RepoService(IHttpClientFactory factory)
{
    public async Task<string> GetReposAsync()
    {
        var client = factory.CreateClient("github");
        return await client.GetStringAsync("/user/repos");
    }
}`,
    explanation:
      "IHttpClientFactory pools underlying HttpMessageHandler instances, rotating them after two minutes to pick up DNS changes; never new up HttpClient directly in services — always use the factory.",
  },
  {
    id: "cs-ihttpmessagehandler",
    language: "csharp",
    title: "DelegatingHandler — custom HTTP middleware for the client",
    tag: "types",
    code: `using System.Net.Http;

// DelegatingHandler wraps the inner handler like middleware:
public class RetryHandler : DelegatingHandler
{
    protected override async Task<HttpResponseMessage> SendAsync(
        HttpRequestMessage request, CancellationToken ct)
    {
        for (int attempt = 0; attempt < 3; attempt++)
        {
            var response = await base.SendAsync(request, ct);
            if (response.IsSuccessStatusCode) return response;
            await Task.Delay(200 * (attempt + 1), ct);
        }
        throw new HttpRequestException("all retries failed");
    }
}

// Register with AddHttpClient:
builder.Services.AddTransient<RetryHandler>();
builder.Services.AddHttpClient("resilient")
    .AddHttpMessageHandler<RetryHandler>();`,
    explanation:
      "DelegatingHandler composes as a pipeline around the innermost HttpClientHandler; stack multiple handlers for retry, logging, and auth — the factory wires them in registration order.",
  },
  {
    id: "cs-iaction-result",
    language: "csharp",
    title: "IActionResult (MVC) vs IResult (minimal API) return types",
    tag: "types",
    code: `// MVC Controllers — IActionResult / ActionResult<T>
[HttpGet("{id}")]
public ActionResult<ProductDto> Get(int id)
{
    if (id < 0) return BadRequest("id must be positive");   // 400
    var p = _repo.Find(id);
    if (p is null) return NotFound();                        // 404
    return Ok(_mapper.Map<ProductDto>(p));                   // 200
}

// Minimal API — IResult / Results static factory
app.MapGet("/products/{id}", (int id, IProductRepo repo) =>
{
    if (id < 0) return Results.BadRequest("id must be positive");
    var p = repo.Find(id);
    if (p is null) return Results.NotFound();
    return Results.Ok(p);
});

// TypedResults (minimal API .NET 7+) — preserves response type in OpenAPI:
app.MapGet("/v2/products/{id}", (int id) =>
    id < 0 ? TypedResults.BadRequest() : TypedResults.Ok(new Product()));`,
    explanation:
      "ActionResult<T> enables both typed and untyped returns in MVC; TypedResults in minimal API preserves the response type for OpenAPI generation — prefer it over Results when the type is known.",
  },
  {
    id: "cs-iproblem-details",
    language: "csharp",
    title: "ProblemDetails — RFC 7807 standard error response",
    tag: "types",
    code: `using Microsoft.AspNetCore.Mvc;

// RFC 7807 ProblemDetails structure:
var problem = new ProblemDetails
{
    Type     = "https://example.com/probs/out-of-stock",
    Title    = "Product out of stock",
    Status   = 400,
    Detail   = "Product SKU-123 has 0 units available.",
    Instance = "/orders/42",
};

// ValidationProblemDetails extends ProblemDetails with Errors dict:
var validation = new ValidationProblemDetails(ModelState)
{
    Status = 400,
};

// Configure ASP.NET Core to return ProblemDetails for all errors:
builder.Services.AddProblemDetails();   // .NET 7+

// Middleware that maps exceptions to problem details:
app.UseExceptionHandler();
app.UseStatusCodePages();`,
    explanation:
      "ProblemDetails standardises error responses so clients have a predictable structure to parse; ValidationProblemDetails adds a per-field Errors dictionary for form/API validation failures.",
  },

  // ── families ──────────────────────────────────────────────────────────────
  {
    id: "cs-di-vs-service-locator",
    language: "csharp",
    title: "DI vs service locator — injection vs pulling from container",
    tag: "families",
    code: `// Service locator — anti-pattern, hidden dependencies, hard to test:
public class OrderService
{
    public void Place(Cart cart)
    {
        var tax = ServiceLocator.Get<ITaxCalculator>();  // hidden dep!
        var email = ServiceLocator.Get<IEmailService>(); // hard to mock
    }
}

// Dependency injection — explicit dependencies, easy to test:
public class OrderService
{
    private readonly ITaxCalculator _tax;
    private readonly IEmailService  _email;

    public OrderService(ITaxCalculator tax, IEmailService email)
    {
        _tax   = tax;
        _email = email;
    }

    public void Place(Cart cart)
    {
        var taxAmt = _tax.Calculate(cart);
        _email.Send(cart.UserEmail, taxAmt);
    }
}`,
    explanation:
      "Constructor injection makes all dependencies visible in the signature, enabling the compiler to detect missing deps and allowing test code to inject fakes; service locator hides dependencies and makes tests brittle.",
  },
  {
    id: "cs-singleton-vs-static",
    language: "csharp",
    title: "DI singleton vs static class — testable vs hard-coded",
    tag: "families",
    code: `// Static class — no DI, impossible to swap implementation in tests:
public static class Logger
{
    public static void Log(string msg) => Console.WriteLine(msg);
}
// Usage: Logger.Log("msg");  — not mockable

// DI singleton — injectable, replaceable, testable:
public interface ILogger { void Log(string msg); }
public class ConsoleLogger : ILogger
{
    public void Log(string msg) => Console.WriteLine(msg);
}

services.AddSingleton<ILogger, ConsoleLogger>();

// In tests, inject a fake:
var fake = new Mock<ILogger>();
var sut  = new OrderService(fake.Object);
sut.Place(cart);
fake.Verify(l => l.Log(It.IsAny<string>()), Times.AtLeastOnce);`,
    explanation:
      "Static classes are global state; DI singletons are global instances but injected via interfaces — this makes it trivial to substitute fakes in unit tests without modifying production code.",
  },
  {
    id: "cs-ilogger-vs-serilog",
    language: "csharp",
    title: "ILogger (abstraction) vs Serilog (structured provider)",
    tag: "families",
    code: `// ILogger<T> — Microsoft's logging abstraction, always inject this
// ILogger does NOT know about Serilog — it's a neutral interface

// Serilog — plugs in as an ILoggerProvider, adds structured sinks

// NuGet: Serilog.AspNetCore, Serilog.Sinks.Console, Serilog.Sinks.Seq
using Serilog;

Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .WriteTo.Console(outputTemplate: "[{Timestamp:HH:mm:ss} {Level}] {Message:lj}{NewLine}{Exception}")
    .WriteTo.Seq("http://localhost:5341")
    .Enrich.FromLogContext()
    .CreateLogger();

builder.Host.UseSerilog();   // Serilog becomes the ILoggerProvider

// Your services still inject ILogger<T> — unchanged:
public class MyService(ILogger<MyService> logger) { }`,
    explanation:
      "Serilog replaces the built-in logging back-end while preserving the ILogger<T> abstraction; your services never import Serilog directly — swapping providers requires only changing the startup configuration.",
  },
  {
    id: "cs-minimal-api-vs-mvc",
    language: "csharp",
    title: "Minimal API vs MVC — ceremony vs features",
    tag: "families",
    code: `// Minimal API — less ceremony, lambda handlers, .NET 6+
app.MapGet("/products/{id}", async (int id, IProductRepo repo) =>
{
    var p = await repo.GetAsync(id);
    return p is null ? Results.NotFound() : Results.Ok(p);
});

// MVC Controller — conventions, filters, model binding, more features
[ApiController, Route("products")]
public class ProductsController : ControllerBase
{
    private readonly IProductRepo _repo;
    public ProductsController(IProductRepo repo) => _repo = repo;

    [HttpGet("{id:int}")]
    public async Task<ActionResult<Product>> Get(int id)
    {
        var p = await _repo.GetAsync(id);
        return p is null ? NotFound() : Ok(p);
    }
}

// Choose minimal API for: microservices, small APIs, performance
// Choose MVC for: complex apps, view rendering, extensive filter pipelines`,
    explanation:
      "Minimal API has lower overhead per route and less startup code; MVC provides conventions for large teams (filters, areas, model binding attributes) — both share the same routing, DI, and middleware infrastructure.",
  },
  {
    id: "cs-ihost-vs-webhost",
    language: "csharp",
    title: "IHost (generic) vs WebHost (HTTP-specific, legacy)",
    tag: "families",
    code: `// WebHost — legacy, .NET Core 1-2 pattern (still works):
WebHost.CreateDefaultBuilder(args)
    .UseStartup<Startup>()
    .Build()
    .Run();

// IHost (generic host) — .NET Core 3+ recommended, adds workers etc.:
Host.CreateDefaultBuilder(args)
    .ConfigureWebHostDefaults(web => web.UseStartup<Startup>())
    .Build()
    .Run();

// WebApplication — .NET 6+ minimal hosting, wraps generic host:
var builder = WebApplication.CreateBuilder(args);
builder.Services.AddControllers();
var app = builder.Build();
app.MapControllers();
app.Run();

// WebApplication is the current recommended approach for all new apps.`,
    explanation:
      "WebApplication is the current idiomatic entry point; generic host (IHost) is the foundation beneath it and supports non-HTTP scenarios like workers; WebHost.CreateDefaultBuilder is legacy but still supported.",
  },
  {
    id: "cs-options-vs-config",
    language: "csharp",
    title: "IOptions<T> (typed) vs IConfiguration (raw strings)",
    tag: "families",
    code: `// IConfiguration — raw key-value access, no typing, no validation
public class BadService(IConfiguration config)
{
    public string GetHost() => config["Database:Host"]!;   // nullable, no validation
    public int GetPort()    => int.Parse(config["Database:Port"]!);  // can throw!
}

// IOptions<T> — typed, validated, with DataAnnotations support
public class GoodService(IOptions<DatabaseOptions> opts)
{
    public string GetHost() => opts.Value.Host;   // string, non-nullable
    public int    GetPort() => opts.Value.Port;   // int, validated by [Range]
}

public class DatabaseOptions
{
    [Required] public string Host { get; set; } = "";
    [Range(1, 65535)] public int Port { get; set; } = 5432;
}

// Validate options at startup:
builder.Services.AddOptions<DatabaseOptions>()
    .BindConfiguration("Database")
    .ValidateDataAnnotations()
    .ValidateOnStart();`,
    explanation:
      "IConfiguration is the raw source; IOptions<T> provides type safety, default values, and startup validation; prefer IOptions in application code and reserve IConfiguration for framework/infrastructure code.",
  },
  {
    id: "cs-endpoint-vs-controller",
    language: "csharp",
    title: "Endpoint routing vs controller routing — same infrastructure",
    tag: "families",
    code: `// Both use the SAME endpoint routing infrastructure under the hood.

// MapControllers() registers controller actions as endpoints:
app.MapControllers();   // reads [Route], [HttpGet], etc. from attributes

// MapGet() etc. register lambda endpoints directly:
app.MapGet("/api/status", () => Results.Ok("ok"));

// Key difference: controllers route via attributes and conventions;
// minimal API routes are explicit in code.

// Both support:
// - Route constraints      {id:int}
// - Parameter binding      [FromRoute], [FromQuery], [FromBody]
// - Authorization          RequireAuthorization() / [Authorize]
// - Rate limiting          RequireRateLimiting()
// - Output caching         CacheOutput()
// - OpenAPI generation     WithOpenApi()`,
    explanation:
      "Endpoint routing is the single routing system for both MVC and minimal API; MapControllers discovers and registers controllers as endpoints, so filter and middleware configuration is identical for both.",
  },
  {
    id: "cs-middleware-vs-filter",
    language: "csharp",
    title: "Middleware vs filter — pipeline scope vs action scope",
    tag: "families",
    code: `// Middleware — entire request pipeline, runs for ALL requests
app.Use(async (ctx, next) =>
{
    Console.WriteLine(\`[MW] \${ctx.Request.Method} \${ctx.Request.Path}\`);
    await next(ctx);
});
// Sees: static files, health checks, 404s — everything

// Filter — MVC/minimal API action scope only
public class LogActionFilter : IActionFilter
{
    public void OnActionExecuting(ActionExecutingContext ctx)
        => Console.WriteLine(\`[Filter] \${ctx.ActionDescriptor.DisplayName}\`);

    public void OnActionExecuted(ActionExecutedContext ctx) { }
}
// Sees: only requests that matched an MVC route and ran an action

// Use middleware for: CORS, auth, exception handling, logging ALL requests
// Use filters for: model validation, per-action auth policies, response shaping`,
    explanation:
      "Middleware runs for every request regardless of routing outcome; filters only run when an MVC controller action or endpoint handler is invoked — choose based on the scope you need.",
  },
  {
    id: "cs-auth-vs-authz",
    language: "csharp",
    title: "Authentication vs authorization — identity vs permission",
    tag: "families",
    code: `// Authentication — WHO are you? (establish identity)
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opts =>
    {
        opts.Authority = "https://auth.example.com";
        opts.Audience  = "my-api";
    });

// Authorization — WHAT can you do? (check permissions)
builder.Services.AddAuthorization(opts =>
{
    opts.AddPolicy("AdminOnly",   p => p.RequireRole("Admin"));
    opts.AddPolicy("PremiumUser", p => p.RequireClaim("tier", "premium"));
    opts.AddPolicy("OverEighteen", p => p.AddRequirements(new AgeRequirement(18)));
});

app.UseAuthentication();   // must come first — populates User
app.UseAuthorization();    // reads User to enforce policies

app.MapGet("/admin", () => "admin area").RequireAuthorization("AdminOnly");`,
    explanation:
      "Authentication populates HttpContext.User from a token or cookie; authorization evaluates policies against that user; always call UseAuthentication before UseAuthorization so the identity is available for policy checks.",
  },
  {
    id: "cs-cookie-vs-jwt",
    language: "csharp",
    title: "Cookie auth vs JWT — server session vs stateless token",
    tag: "families",
    code: `// Cookie authentication — session stored server-side (or signed cookie)
builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(opts =>
    {
        opts.LoginPath  = "/login";
        opts.ExpireTimeSpan = TimeSpan.FromHours(1);
        opts.SlidingExpiration = true;
    });
// Pro: easy revocation (delete session), no CSRF risk with SameSite
// Con: sticky sessions or distributed session for multi-instance

// JWT Bearer — token is self-contained, stateless
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opts => opts.Authority = "https://auth.example.com");
// Pro: stateless, scales horizontally, works for APIs and mobile
// Con: tokens cannot be revoked until expiry (use short expiry + refresh)`,
    explanation:
      "Cookies suit traditional web apps with server-rendered pages; JWTs suit APIs consumed by SPAs and mobile clients; short-lived JWTs (15 min) with a refresh-token rotation minimise the revocation problem.",
  },
  {
    id: "cs-session-vs-distributed",
    language: "csharp",
    title: "In-memory session vs distributed cache session",
    tag: "families",
    code: `// In-memory session — stored in process, lost on restart
builder.Services.AddDistributedMemoryCache();   // in-process IDistributedCache
builder.Services.AddSession(opts =>
{
    opts.IdleTimeout    = TimeSpan.FromMinutes(20);
    opts.Cookie.HttpOnly = true;
    opts.Cookie.IsEssential = true;
});
// Works for single-instance; sessions lost on restart or deployment

// Distributed session — stored in Redis, survives restarts
// NuGet: Microsoft.Extensions.Caching.StackExchangeRedis
builder.Services.AddStackExchangeRedisCache(opts =>
    opts.Configuration = "localhost:6379");
builder.Services.AddSession();   // now backed by Redis

// ISession (same API for both):
app.MapGet("/session", (ISession session) =>
    session.GetString("key"));`,
    explanation:
      "In-memory session is simple but ties users to a single instance; Redis-backed distributed session survives restarts and works behind a load balancer — always use distributed storage in production.",
  },
  {
    id: "cs-memory-cache-vs-redis",
    language: "csharp",
    title: "IMemoryCache vs IDistributedCache with Redis",
    tag: "families",
    code: `// IMemoryCache — in-process, fast, single-instance only
builder.Services.AddMemoryCache();

// Inject and use:
public class ProductService(IMemoryCache cache, IProductRepo repo)
{
    public async Task<Product?> GetAsync(int id)
    {
        return await cache.GetOrCreateAsync(\`product:\${id}\`, async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(5);
            return await repo.GetAsync(id);
        });
    }
}

// IDistributedCache — shared across instances (Redis, SQL Server, etc.)
builder.Services.AddStackExchangeRedisCache(o => o.Configuration = "localhost");

// API is lower-level (bytes), use a helper or extension methods:
await cache.SetStringAsync("key", "value", new DistributedCacheEntryOptions
    { AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(5) });`,
    explanation:
      "IMemoryCache is O(1) in-process with object references; IDistributedCache requires serialisation and a network round-trip but is visible to all instances — use IMemoryCache for hot paths in single-instance services.",
  },
  {
    id: "cs-in-memory-vs-external",
    language: "csharp",
    title: "In-memory EF Core vs external DB — unit vs integration test",
    tag: "families",
    code: `// In-memory DB — fast, no infrastructure, for unit tests
builder.Services.AddDbContext<AppDbContext>(opts =>
    opts.UseInMemoryDatabase("TestDb"));
// Caveat: no transactions, no SQL, no constraints — not a real DB!

// SQLite in-memory — closer to real SQL, for integration tests
builder.Services.AddDbContext<AppDbContext>(opts =>
    opts.UseSqlite("DataSource=:memory:"));
// Must keep the connection open for the lifetime of the test

// Real Postgres (Testcontainers) — full fidelity integration test
// NuGet: Testcontainers.PostgreSql
var pg = new PostgreSqlBuilder().Build();
await pg.StartAsync();
builder.Services.AddDbContext<AppDbContext>(opts =>
    opts.UseNpgsql(pg.GetConnectionString()));`,
    explanation:
      "In-memory EF Core is fast but doesn't enforce foreign keys or run migrations; SQLite in-memory is closer to SQL but lacks Postgres extensions; Testcontainers spins up a real Postgres in Docker for full-fidelity tests.",
  },
  {
    id: "cs-transient-vs-pooled",
    language: "csharp",
    title: "Transient HttpClient vs IHttpClientFactory pooled",
    tag: "families",
    code: `// ANTI-PATTERN 1 — new HttpClient each call (socket exhaustion):
public class BadService
{
    public async Task<string> GetAsync(string url)
    {
        using var client = new HttpClient();   // opens a new socket
        return await client.GetStringAsync(url);
    }   // Dispose closes socket, but OS keeps it in TIME_WAIT for ~4 minutes
}

// ANTI-PATTERN 2 — static/singleton HttpClient (DNS stale):
private static readonly HttpClient _client = new();   // DNS never refreshes

// CORRECT — IHttpClientFactory rotates handlers every 2 minutes:
public class GoodService(IHttpClientFactory factory)
{
    public async Task<string> GetAsync(string url)
    {
        var client = factory.CreateClient();   // reuses pooled handler
        return await client.GetStringAsync(url);
    }
}

builder.Services.AddHttpClient();`,
    explanation:
      "HttpClient instances should be long-lived but handlers must rotate to pick up DNS changes; IHttpClientFactory manages a pool of handlers with a two-minute lifetime — the best of both worlds.",
  },

  // ── classes ───────────────────────────────────────────────────────────────
  {
    id: "cs-custom-middleware",
    language: "csharp",
    title: "Custom middleware class — InvokeAsync(HttpContext, RequestDelegate)",
    tag: "classes",
    code: `using Microsoft.AspNetCore.Http;

public class CorrelationIdMiddleware
{
    private readonly RequestDelegate _next;

    public CorrelationIdMiddleware(RequestDelegate next)
        => _next = next;

    public async Task InvokeAsync(
        HttpContext context,
        ILogger<CorrelationIdMiddleware> logger)   // DI injected per-call
    {
        var id = context.Request.Headers["X-Correlation-Id"]
                    .FirstOrDefault()
                 ?? Guid.NewGuid().ToString();

        context.Items["CorrelationId"] = id;
        context.Response.Headers["X-Correlation-Id"] = id;

        using (logger.BeginScope(new { CorrelationId = id }))
            await _next(context);
    }
}

// Register:
app.UseMiddleware<CorrelationIdMiddleware>();`,
    explanation:
      "Constructor parameters are resolved once from the singleton scope; InvokeAsync parameters are resolved per-request from the request scope — use InvokeAsync parameters for scoped/transient services.",
  },
  {
    id: "cs-action-filter",
    language: "csharp",
    title: "IActionFilter — OnActionExecuting and OnActionExecuted",
    tag: "classes",
    code: `using Microsoft.AspNetCore.Mvc.Filters;

public class TimingActionFilter : IActionFilter
{
    private Stopwatch? _sw;

    public void OnActionExecuting(ActionExecutingContext context)
    {
        _sw = Stopwatch.StartNew();
        // Can inspect/modify context.ActionArguments (bound parameters)
        // Set context.Result to short-circuit the action
    }

    public void OnActionExecuted(ActionExecutedContext context)
    {
        _sw?.Stop();
        // context.Result is the IActionResult the action returned
        // context.Exception contains any unhandled exception
        Console.WriteLine(\`action took \${_sw?.ElapsedMilliseconds}ms\`);
    }
}

// Register globally:
builder.Services.AddControllers(opts =>
    opts.Filters.Add<TimingActionFilter>());`,
    explanation:
      "Action filters run around the action method after model binding; OnActionExecuting can abort the request by setting context.Result; action filters are MVC-specific and do not run for minimal API endpoints.",
  },
  {
    id: "cs-exception-filter",
    language: "csharp",
    title: "IExceptionFilter — centralized exception handling",
    tag: "classes",
    code: `using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Mvc;

public class ApiExceptionFilter : IExceptionFilter
{
    private readonly ILogger<ApiExceptionFilter> _logger;

    public ApiExceptionFilter(ILogger<ApiExceptionFilter> logger)
        => _logger = logger;

    public void OnException(ExceptionContext context)
    {
        _logger.LogError(context.Exception, "Unhandled exception");

        context.Result = context.Exception switch
        {
            NotFoundException  => new NotFoundObjectResult(context.Exception.Message),
            UnauthorizedException => new UnauthorizedObjectResult(context.Exception.Message),
            _ => new ObjectResult(new ProblemDetails { Status = 500, Title = "Server error" })
                 { StatusCode = 500 }
        };
        context.ExceptionHandled = true;
    }
}

builder.Services.AddControllers(opts =>
    opts.Filters.Add<ApiExceptionFilter>());`,
    explanation:
      "Exception filters run after action filters when the action throws; they are scoped to MVC and do not catch middleware exceptions; set ExceptionHandled=true to suppress the exception from propagating further.",
  },
  {
    id: "cs-resource-filter",
    language: "csharp",
    title: "IResourceFilter — short-circuit before model binding",
    tag: "classes",
    code: `using Microsoft.AspNetCore.Mvc.Filters;

public class ETagCacheFilter : Attribute, IResourceFilter
{
    public void OnResourceExecuting(ResourceExecutingContext context)
    {
        var etag = ComputeETag(context.HttpContext.Request);
        var ifNoneMatch = context.HttpContext.Request.Headers.IfNoneMatch;

        if (ifNoneMatch == etag)
        {
            // Short-circuit — skip model binding and the action:
            context.Result = new StatusCodeResult(304);   // Not Modified
        }
    }

    public void OnResourceExecuted(ResourceExecutedContext context)
    {
        // Add ETag header to the response:
        var etag = ComputeETag(context.HttpContext.Request);
        context.HttpContext.Response.Headers.ETag = etag;
    }

    private static string ComputeETag(HttpRequest req)
        => \`"\${req.Path}{req.QueryString}"\`;
}`,
    explanation:
      "Resource filters wrap the inner MVC pipeline including model binding and are the right place for cache short-circuits; they run before action filters, so they avoid the overhead of model binding for cache hits.",
  },
  {
    id: "cs-result-filter",
    language: "csharp",
    title: "IResultFilter — modify the response after the action",
    tag: "classes",
    code: `using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Mvc;

// Wraps the IActionResult returned by the action
public class EnvelopeResultFilter : IResultFilter
{
    public void OnResultExecuting(ResultExecutingContext context)
    {
        // Wrap OkObjectResult in an envelope:
        if (context.Result is OkObjectResult ok)
        {
            context.Result = new OkObjectResult(new
            {
                success = true,
                data    = ok.Value,
                ts      = DateTime.UtcNow,
            });
        }
        // Set context.Cancel = true to skip result execution
    }

    public void OnResultExecuted(ResultExecutedContext context)
    {
        // Response serialisation is complete here
    }
}

builder.Services.AddControllers(opts =>
    opts.Filters.Add<EnvelopeResultFilter>());`,
    explanation:
      "Result filters run after the action but before the result is serialised; they are the right place to add response envelopes, pagination metadata, or response transformation.",
  },
  {
    id: "cs-auth-handler",
    language: "csharp",
    title: "AuthorizationHandler<TRequirement> — custom policy logic",
    tag: "classes",
    code: `using Microsoft.AspNetCore.Authorization;

// 1. Define a requirement (data class):
public class MinimumAgeRequirement : IAuthorizationRequirement
{
    public int MinimumAge { get; }
    public MinimumAgeRequirement(int age) => MinimumAge = age;
}

// 2. Implement the handler:
public class MinimumAgeHandler : AuthorizationHandler<MinimumAgeRequirement>
{
    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        MinimumAgeRequirement requirement)
    {
        var dob = context.User.FindFirst(c => c.Type == "dateofbirth");
        if (dob is not null)
        {
            var age = DateTime.Today.Year - DateTime.Parse(dob.Value).Year;
            if (age >= requirement.MinimumAge)
                context.Succeed(requirement);
        }
        return Task.CompletedTask;
    }
}

// 3. Register and use:
builder.Services.AddSingleton<IAuthorizationHandler, MinimumAgeHandler>();
builder.Services.AddAuthorization(opts =>
    opts.AddPolicy("Over18", p => p.AddRequirements(new MinimumAgeRequirement(18))));`,
    explanation:
      "Split the requirement (a parameter object) from the handler (the logic) so multiple handlers can fulfil the same requirement; context.Succeed marks it as satisfied, context.Fail explicitly denies even if other handlers succeed.",
  },
  {
    id: "cs-policy-provider",
    language: "csharp",
    title: "IAuthorizationPolicyProvider — dynamic policies from route data",
    tag: "classes",
    code: `using Microsoft.AspNetCore.Authorization;

public class PermissionPolicyProvider : DefaultAuthorizationPolicyProvider
{
    public PermissionPolicyProvider(IOptions<AuthorizationOptions> opts) : base(opts) { }

    public override async Task<AuthorizationPolicy?> GetPolicyAsync(string policyName)
    {
        // Delegate to the default for registered policies:
        var existing = await base.GetPolicyAsync(policyName);
        if (existing is not null) return existing;

        // Build a policy on the fly from a "Permission:" prefix:
        if (policyName.StartsWith("Permission:"))
        {
            var perm = policyName["Permission:".Length..];
            return new AuthorizationPolicyBuilder()
                .RequireClaim("permission", perm)
                .Build();
        }
        return null;
    }
}

builder.Services.AddSingleton<IAuthorizationPolicyProvider, PermissionPolicyProvider>();

// Use: [Authorize(Policy = "Permission:orders.read")]`,
    explanation:
      "IAuthorizationPolicyProvider lets you generate policies on demand from strings, enabling permission-based authorization without enumerating all permissions at startup.",
  },
  {
    id: "cs-model-binder",
    language: "csharp",
    title: "IModelBinder — custom binding logic for action parameters",
    tag: "classes",
    code: `using Microsoft.AspNetCore.Mvc.ModelBinding;

// Bind a comma-separated query string to an array without [FromQuery]:
public class CommaSeparatedArrayBinder : IModelBinder
{
    public Task BindModelAsync(ModelBindingContext bindingContext)
    {
        var value = bindingContext.ValueProvider
            .GetValue(bindingContext.ModelName).FirstValue;

        if (string.IsNullOrEmpty(value))
        {
            bindingContext.Result = ModelBindingResult.Success(Array.Empty<int>());
            return Task.CompletedTask;
        }

        var items = value.Split(',').Select(int.Parse).ToArray();
        bindingContext.Result = ModelBindingResult.Success(items);
        return Task.CompletedTask;
    }
}

// Register via attribute on parameter:
// [ModelBinder(typeof(CommaSeparatedArrayBinder))] int[] ids`,
    explanation:
      "Custom model binders handle parameter types that the default binders cannot process; decorate the parameter with [ModelBinder] or register globally via MvcOptions.ModelBinderProviders.",
  },
  {
    id: "cs-value-provider",
    language: "csharp",
    title: "IValueProvider — supply values to the model binder",
    tag: "classes",
    code: `using Microsoft.AspNetCore.Mvc.ModelBinding;

// IValueProvider answers "give me the raw string for key X"
// IModelBinder uses value providers to get data to bind

// Custom value provider — reads values from a custom header prefix:
public class HeaderValueProvider : IValueProvider
{
    private readonly IHeaderDictionary _headers;
    public HeaderValueProvider(IHeaderDictionary headers) => _headers = headers;

    public bool ContainsPrefix(string prefix) =>
        _headers.Keys.Any(k => k.Equals(\`X-Bind-\${prefix}\`, StringComparison.OrdinalIgnoreCase));

    public ValueProviderResult GetValue(string key)
    {
        var headerKey = \`X-Bind-\${key}\`;
        return _headers.TryGetValue(headerKey, out var val)
            ? new ValueProviderResult(val)
            : ValueProviderResult.None;
    }
}`,
    explanation:
      "IValueProvider is the data source layer below IModelBinder; built-in providers handle form, route, query string, and JSON body; write a custom one to pull binding values from novel sources like custom headers.",
  },
  {
    id: "cs-output-formatter",
    language: "csharp",
    title: "TextOutputFormatter — custom response media type",
    tag: "classes",
    code: `using Microsoft.AspNetCore.Mvc.Formatters;

public class CsvOutputFormatter : TextOutputFormatter
{
    public CsvOutputFormatter()
    {
        SupportedMediaTypes.Add("text/csv");
        SupportedEncodings.Add(System.Text.Encoding.UTF8);
    }

    protected override bool CanWriteType(Type? type)
        => type is not null && type.IsAssignableTo(typeof(IEnumerable<object>));

    public override async Task WriteResponseBodyAsync(
        OutputFormatterWriteContext context,
        System.Text.Encoding encoding)
    {
        var items = (IEnumerable<object>)context.Object!;
        await using var writer = context.WriterFactory(
            context.HttpContext.Response.Body, encoding);
        foreach (var item in items)
            await writer.WriteLineAsync(string.Join(",", item.GetType()
                .GetProperties().Select(p => p.GetValue(item))));
    }
}

builder.Services.AddControllers(opts =>
    opts.OutputFormatters.Insert(0, new CsvOutputFormatter()));`,
    explanation:
      "Output formatters serialise the action's return value to the response body; registering one with a custom media type lets callers request CSV or other formats via the Accept header.",
  },
  {
    id: "cs-input-formatter",
    language: "csharp",
    title: "TextInputFormatter — parse a custom request body format",
    tag: "classes",
    code: `using Microsoft.AspNetCore.Mvc.Formatters;

public class PlainTextInputFormatter : TextInputFormatter
{
    public PlainTextInputFormatter()
    {
        SupportedMediaTypes.Add("text/plain");
        SupportedEncodings.Add(System.Text.Encoding.UTF8);
    }

    protected override bool CanReadType(Type type) => type == typeof(string);

    public override async Task<InputFormatterResult> ReadRequestBodyAsync(
        InputFormatterContext context,
        System.Text.Encoding encoding)
    {
        using var reader = context.ReaderFactory(
            context.HttpContext.Request.Body, encoding);
        var body = await reader.ReadToEndAsync();
        return InputFormatterResult.Success(body);
    }
}

builder.Services.AddControllers(opts =>
    opts.InputFormatters.Insert(0, new PlainTextInputFormatter()));`,
    explanation:
      "Input formatters deserialise the request body into the action's parameter; register one for text/plain to accept raw string bodies in addition to the default JSON formatter.",
  },
  {
    id: "cs-cors-policy",
    language: "csharp",
    title: "AddCors + UseCors — CORS policy configuration",
    tag: "classes",
    code: `var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(opts =>
{
    opts.AddPolicy("AllowFrontend", policy =>
        policy.WithOrigins("https://app.example.com")
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials());

    opts.AddPolicy("PublicApi", policy =>
        policy.AllowAnyOrigin()
              .WithMethods("GET")
              .WithHeaders("Content-Type"));
});

var app = builder.Build();
app.UseRouting();
app.UseCors("AllowFrontend");   // apply default policy globally
app.UseAuthorization();

// Override per-endpoint:
app.MapGet("/public", () => Results.Ok())
   .RequireCors("PublicApi");`,
    explanation:
      "UseCors must come after UseRouting and before UseAuthorization; AllowCredentials requires explicit origin — you cannot use AllowAnyOrigin with AllowCredentials as that combination is rejected by browsers.",
  },
  {
    id: "cs-rate-limit-policy",
    language: "csharp",
    title: "Fixed-window rate limit policy with RateLimiterOptions",
    tag: "classes",
    code: `using Microsoft.AspNetCore.RateLimiting;
using System.Threading.RateLimiting;

builder.Services.AddRateLimiter(opts =>
{
    opts.RejectionStatusCode = 429;
    opts.OnRejected = async (ctx, ct) =>
    {
        ctx.HttpContext.Response.Headers.RetryAfter = "60";
        await ctx.HttpContext.Response.WriteAsync("rate limit exceeded", ct);
    };

    opts.AddFixedWindowLimiter("api", o =>
    {
        o.PermitLimit         = 100;
        o.Window              = TimeSpan.FromMinutes(1);
        o.QueueProcessingOrder = QueueProcessingOrder.NewestFirst;
        o.QueueLimit          = 0;   // no queuing — reject immediately
    });
});

var app = builder.Build();
app.UseRateLimiter();
app.MapControllers().RequireRateLimiting("api");`,
    explanation:
      "QueueLimit=0 means excess requests are rejected immediately rather than queued; OnRejected lets you customise the 429 response body and add Retry-After headers to inform clients when to retry.",
  },
  {
    id: "cs-response-writer",
    language: "csharp",
    title: "HttpResponse.WriteAsync — write directly to the response",
    tag: "classes",
    code: `app.MapGet("/stream", async (HttpResponse response, CancellationToken ct) =>
{
    response.ContentType = "text/event-stream";
    response.Headers.CacheControl = "no-cache";
    response.Headers.Connection   = "keep-alive";

    for (int i = 0; i < 10; i++)
    {
        if (ct.IsCancellationRequested) break;

        var data = \`data: event \${i}\\n\\n\`;   // SSE format
        await response.WriteAsync(data, ct);
        await response.Body.FlushAsync(ct);    // flush each event
        await Task.Delay(1000, ct);
    }
});`,
    explanation:
      "Writing directly to HttpResponse.Body enables streaming responses like Server-Sent Events; call FlushAsync after each chunk so data reaches the client incrementally rather than buffered until the end.",
  },
  {
    id: "cs-health-check-impl",
    language: "csharp",
    title: "IHealthCheck.CheckHealthAsync — /health endpoint",
    tag: "classes",
    code: `using Microsoft.Extensions.Diagnostics.HealthChecks;

public class DatabaseHealthCheck : IHealthCheck
{
    private readonly IDbConnection _db;
    public DatabaseHealthCheck(IDbConnection db) => _db = db;

    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken ct = default)
    {
        try
        {
            await _db.ExecuteScalarAsync("SELECT 1", ct);
            return HealthCheckResult.Healthy("database is reachable");
        }
        catch (Exception ex)
        {
            return HealthCheckResult.Unhealthy("database unreachable", ex);
        }
    }
}

builder.Services.AddHealthChecks()
    .AddCheck<DatabaseHealthCheck>("database", tags: ["db", "ready"]);

app.MapHealthChecks("/health");
app.MapHealthChecks("/health/ready", new() { Predicate = c => c.Tags.Contains("ready") });`,
    explanation:
      "IHealthCheck.CheckHealthAsync returns Healthy, Degraded, or Unhealthy; Degraded means the service works but is impaired; tag health checks to expose separate liveness and readiness endpoints for Kubernetes.",
  },
  {
    id: "cs-hosted-service-impl",
    language: "csharp",
    title: "BackgroundService.ExecuteAsync — retry loop with cancellation",
    tag: "classes",
    code: `public class ReliableWorker : BackgroundService
{
    private readonly ILogger<ReliableWorker> _log;
    private readonly IWorkQueue              _queue;

    public ReliableWorker(ILogger<ReliableWorker> log, IWorkQueue queue)
    {
        _log   = log;
        _queue = queue;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _log.LogInformation("worker started");
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var item = await _queue.DequeueAsync(stoppingToken);
                await ProcessAsync(item, stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _log.LogError(ex, "error processing item, pausing 5s");
                await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);
            }
        }
        _log.LogInformation("worker stopped");
    }

    private Task ProcessAsync(WorkItem item, CancellationToken ct) =>
        Task.CompletedTask;
}`,
    explanation:
      "The pattern: loop until stoppingToken is cancelled, catch and log transient errors with a back-off delay, and explicitly distinguish OperationCanceledException from stop-signal versus other cancellations.",
  },
];
