import type { LessonContent } from "../python-basics";

export const csharpTier4Lessons: Record<string, LessonContent> = {
  "csharp:t4:async-await": {
    nodeId: "csharp:t4:async-await",
    title: "Async / Await",
    sections: [
      {
        heading: "Why Async?",
        body: "Synchronous code blocks the calling thread while waiting for I/O operations like network requests, file reads, or database queries. In a web server, this means one blocked request ties up a thread that could serve other users. Async/await lets your code yield the thread during the wait and resume when the result arrives, dramatically improving scalability without the complexity of manual threading.",
      },
      {
        heading: "Task and Task<T>",
        body: "Task represents an asynchronous operation that returns no value (like void). Task<T> represents one that returns a value of type T. An async method's return type is always Task, Task<T>, or ValueTask<T>. When you await a Task<T>, you get the T value. Behind the scenes, the compiler transforms async methods into state machines that suspend and resume at each await point.",
      },
      {
        heading: "async/await Patterns",
        body: "Mark a method 'async' and use 'await' before any async call. The method name should end with 'Async' by convention. Use Task.WhenAll() to run multiple tasks concurrently and wait for all to complete. CancellationToken allows callers to cancel long-running operations. Avoid async void (except for event handlers) — it swallows exceptions. Always prefer Task over void for async methods.",
      },
    ],
    codeExamples: [
      {
        title: "Basic async/await",
        code: `async Task<string> FetchDataAsync(string url)
{
    using var client = new HttpClient();
    string content = await client.GetStringAsync(url);
    return content;
}

// Calling an async method
string data = await FetchDataAsync("https://api.example.com/data");
Console.WriteLine(data.Length);`,
        explanation:
          "'async' marks the method as asynchronous. 'await' suspends execution until the task completes, then returns the result. The thread is freed during the wait.",
      },
      {
        title: "Running tasks concurrently with Task.WhenAll",
        code: `async Task<int[]> FetchAllScoresAsync(string[] userIds)
{
    var tasks = userIds.Select(id => FetchScoreAsync(id));
    int[] scores = await Task.WhenAll(tasks);
    return scores;
}

// All 3 requests run concurrently, not sequentially
var scores = await FetchAllScoresAsync(new[] { "u1", "u2", "u3" });
Console.WriteLine($"Total: {scores.Sum()}");`,
        explanation:
          "Task.WhenAll starts all tasks and waits until every one completes. This is much faster than awaiting each one sequentially. If any task fails, WhenAll throws the first exception.",
      },
      {
        title: "CancellationToken for timeouts",
        code: `async Task<string> SearchAsync(string query, CancellationToken ct)
{
    ct.ThrowIfCancellationRequested();

    using var client = new HttpClient();
    var response = await client.GetAsync($"/search?q={query}", ct);
    return await response.Content.ReadAsStringAsync(ct);
}

// Usage with timeout
using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(5));
try
{
    string result = await SearchAsync("C# async", cts.Token);
}
catch (OperationCanceledException)
{
    Console.WriteLine("Search timed out!");
}`,
        explanation:
          "CancellationToken flows through async methods. The caller controls cancellation via CancellationTokenSource. Pass the token to HttpClient and other async APIs for cooperative cancellation.",
      },
    ],
    keyTakeaways: [
      "async/await frees the thread during I/O waits, improving scalability",
      "Async methods return Task (void) or Task<T> (with a value), not plain types",
      "Task.WhenAll runs multiple tasks concurrently — much faster than sequential awaits",
      "CancellationToken enables cooperative cancellation and timeouts",
      "Avoid async void — use async Task instead. Name async methods with 'Async' suffix",
      "Never block on async code with .Result or .Wait() — it can deadlock",
    ],
  },

  "csharp:t4:aspnet-basics": {
    nodeId: "csharp:t4:aspnet-basics",
    title: "ASP.NET Core Basics",
    sections: [
      {
        heading: "Minimal APIs",
        body: "ASP.NET Core is Microsoft's web framework for building APIs and web apps. Minimal APIs (introduced in .NET 6) let you define endpoints with a few lines of code in Program.cs — no controllers or startup classes needed. Use builder.Build() to create the app, then map routes with app.MapGet(), app.MapPost(), etc. The app runs with app.Run().",
      },
      {
        heading: "Routing and Parameters",
        body: "Routes map URL patterns to handler methods. Use curly braces for route parameters: '/users/{id}'. Parameters are automatically bound from the route, query string, or request body. MapGet(\"/users/{id}\", (int id) => ...) binds the id from the URL. Query parameters bind when the parameter name matches: '/search?q=test' binds to 'string q'. Use [FromBody] for JSON request bodies.",
      },
      {
        heading: "The Middleware Pipeline",
        body: "ASP.NET Core processes requests through a middleware pipeline. Each middleware component can inspect/modify the request, pass it to the next middleware, and inspect/modify the response. Common middleware: UseRouting, UseAuthentication, UseAuthorization, UseCors, UseStaticFiles. Order matters — authentication must come before authorization. Middleware is added with app.Use() or specialized methods.",
      },
    ],
    codeExamples: [
      {
        title: "A complete minimal API",
        code: `var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

var todos = new List<Todo>();
int nextId = 1;

app.MapGet("/todos", () => todos);

app.MapGet("/todos/{id}", (int id) =>
    todos.FirstOrDefault(t => t.Id == id) is Todo todo
        ? Results.Ok(todo)
        : Results.NotFound());

app.MapPost("/todos", (TodoCreate input) =>
{
    var todo = new Todo(nextId++, input.Title, false);
    todos.Add(todo);
    return Results.Created($"/todos/{todo.Id}", todo);
});

app.MapDelete("/todos/{id}", (int id) =>
{
    var todo = todos.FirstOrDefault(t => t.Id == id);
    if (todo is null) return Results.NotFound();
    todos.Remove(todo);
    return Results.NoContent();
});

app.Run();

record Todo(int Id, string Title, bool IsComplete);
record TodoCreate(string Title);`,
        explanation:
          "A full CRUD API in one file. MapGet/MapPost/MapDelete define endpoints. Results.Ok/NotFound/Created return appropriate status codes. Records define the data shapes.",
      },
      {
        title: "Route parameters and query strings",
        code: `// Route parameter
app.MapGet("/users/{id}", (int id) =>
    $"User {id}");

// Query string parameter
app.MapGet("/search", (string q, int page = 1) =>
    $"Searching '{q}', page {page}");

// Request body (JSON)
app.MapPost("/users", (CreateUserRequest body) =>
    Results.Created($"/users/{body.Name}", body));

record CreateUserRequest(string Name, string Email);`,
        explanation:
          "Parameters are bound automatically: {id} from the route, 'q' and 'page' from the query string, and the request body is deserialized from JSON. Default values make parameters optional.",
      },
      {
        title: "Middleware pipeline",
        code: `var app = builder.Build();

// Request logging middleware
app.Use(async (context, next) =>
{
    Console.WriteLine($"--> {context.Request.Method} {context.Request.Path}");
    await next(context);
    Console.WriteLine($"<-- {context.Response.StatusCode}");
});

app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/", () => "Hello!");
app.Run();`,
        explanation:
          "Custom middleware uses app.Use() with a delegate that calls 'next' to pass to the next middleware. Each request flows through all middleware in order, and responses flow back in reverse.",
      },
    ],
    keyTakeaways: [
      "Minimal APIs use MapGet/MapPost/MapPut/MapDelete for route-to-handler mapping",
      "Parameters bind automatically from routes ({id}), query strings (?q=), and JSON bodies",
      "Results.Ok(), Results.NotFound(), Results.Created() return typed HTTP responses",
      "Middleware processes requests in pipeline order — order matters",
      "WebApplication.CreateBuilder(args) + app.Run() is the minimal startup pattern",
    ],
  },

  "csharp:t4:entity-framework": {
    nodeId: "csharp:t4:entity-framework",
    title: "Entity Framework Core",
    sections: [
      {
        heading: "What Is EF Core?",
        body: "Entity Framework Core is an ORM (Object-Relational Mapper) that lets you work with databases using C# objects instead of SQL. You define entity classes (like Product, Order) and a DbContext that maps them to database tables. EF Core translates your LINQ queries into SQL, tracks changes to your objects, and generates database migrations. It supports SQL Server, PostgreSQL, SQLite, and more.",
      },
      {
        heading: "DbContext and DbSet<T>",
        body: "DbContext is the main class for interacting with the database. It contains DbSet<T> properties representing tables. You query with LINQ on DbSet<T>, add entities with DbSet.Add(), and save all changes with SaveChangesAsync(). EF Core tracks changes automatically — modify a property on a tracked entity and call SaveChanges, and it generates an UPDATE statement. Configure the database connection in the constructor or via dependency injection.",
      },
      {
        heading: "Migrations and Relationships",
        body: "Migrations manage database schema changes over time. Run 'dotnet ef migrations add InitialCreate' to generate a migration, then 'dotnet ef database update' to apply it. EF Core supports relationships through navigation properties: one-to-many (a Blog has many Posts), many-to-many (Students and Courses), and one-to-one. Use 'Include()' for eager loading of related entities.",
      },
    ],
    codeExamples: [
      {
        title: "Defining entities and DbContext",
        code: `public class Product
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public decimal Price { get; set; }
    public int CategoryId { get; set; }
    public Category Category { get; set; } = null!;
}

public class Category
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public List<Product> Products { get; set; } = [];
}

public class AppDbContext : DbContext
{
    public DbSet<Product> Products => Set<Product>();
    public DbSet<Category> Categories => Set<Category>();

    protected override void OnConfiguring(DbContextOptionsBuilder options)
        => options.UseSqlite("Data Source=app.db");
}`,
        explanation:
          "Entity classes map to tables. Navigation properties (Category, Products) define relationships. DbContext manages the connection and change tracking.",
      },
      {
        title: "CRUD operations with EF Core",
        code: `await using var db = new AppDbContext();

// Create
var category = new Category { Name = "Electronics" };
db.Categories.Add(category);
await db.SaveChangesAsync();

// Read with LINQ
var expensive = await db.Products
    .Where(p => p.Price > 100)
    .OrderBy(p => p.Name)
    .ToListAsync();

// Update — change tracking handles it
var product = await db.Products.FindAsync(1);
if (product is not null)
{
    product.Price = 29.99m;
    await db.SaveChangesAsync();
}

// Delete
if (product is not null)
{
    db.Products.Remove(product);
    await db.SaveChangesAsync();
}`,
        explanation:
          "LINQ queries on DbSet<T> are translated to SQL. Change tracking detects modifications. FindAsync uses the primary key for fast lookup.",
      },
      {
        title: "Eager loading with Include",
        code: `// Load categories WITH their products (eager loading)
var categories = await db.Categories
    .Include(c => c.Products)
    .ToListAsync();

foreach (var cat in categories)
{
    Console.WriteLine($"{cat.Name}: {cat.Products.Count} products");
}

// Without Include, Products would be empty (lazy loading is off by default)`,
        explanation:
          "Include() generates a JOIN query to load related entities in one round-trip. Without it, navigation properties are null/empty. This prevents the N+1 query problem.",
      },
    ],
    keyTakeaways: [
      "EF Core maps C# classes to database tables via DbContext and DbSet<T>",
      "LINQ queries on DbSet are translated to SQL automatically",
      "Change tracking detects modifications — SaveChangesAsync() persists them",
      "Migrations manage schema evolution: 'dotnet ef migrations add' + 'dotnet ef database update'",
      "Include() eagerly loads related entities to prevent N+1 queries",
    ],
  },

  "csharp:t4:dependency-injection": {
    nodeId: "csharp:t4:dependency-injection",
    title: "Dependency Injection",
    sections: [
      {
        heading: "What Is Dependency Injection?",
        body: "Dependency Injection (DI) is a design pattern where objects receive their dependencies from the outside rather than creating them internally. Instead of 'new EmailService()' inside your controller, the DI container creates and passes it automatically. This makes code testable (you can inject mocks), flexible (swap implementations via configuration), and follows the Dependency Inversion Principle.",
      },
      {
        heading: "Service Lifetimes",
        body: "ASP.NET Core's built-in DI container supports three lifetimes. Transient: a new instance every time it's requested — good for lightweight, stateless services. Scoped: one instance per HTTP request — ideal for database contexts (DbContext). Singleton: one instance for the entire application lifetime — good for configuration, caches, and stateless helpers. Choosing the wrong lifetime causes bugs: a Singleton holding a Scoped service keeps it alive too long.",
      },
      {
        heading: "Registering and Resolving Services",
        body: "Register services in Program.cs with builder.Services.AddTransient<IService, Implementation>(), AddScoped<>(), or AddSingleton<>(). Services are resolved via constructor injection — add the interface as a constructor parameter and the DI container provides it. Use IOptions<T> to inject configuration settings. The container creates the entire dependency graph automatically.",
      },
    ],
    codeExamples: [
      {
        title: "Registering services",
        code: `var builder = WebApplication.CreateBuilder(args);

// Register services with different lifetimes
builder.Services.AddTransient<IEmailService, SmtpEmailService>();
builder.Services.AddScoped<IOrderRepository, SqlOrderRepository>();
builder.Services.AddSingleton<ICacheService, MemoryCacheService>();

// Register DbContext as Scoped (default)
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite("Data Source=app.db"));

var app = builder.Build();`,
        explanation:
          "Services are registered before building the app. AddTransient creates a new instance per request. AddScoped creates one per HTTP request. AddSingleton creates one for the app's lifetime.",
      },
      {
        title: "Constructor injection",
        code: `public class OrderService
{
    private readonly IOrderRepository _repo;
    private readonly IEmailService _email;
    private readonly ILogger<OrderService> _logger;

    public OrderService(
        IOrderRepository repo,
        IEmailService email,
        ILogger<OrderService> logger)
    {
        _repo = repo;
        _email = email;
        _logger = logger;
    }

    public async Task PlaceOrderAsync(Order order)
    {
        await _repo.SaveAsync(order);
        await _email.SendConfirmationAsync(order.Email);
        _logger.LogInformation("Order {Id} placed", order.Id);
    }
}`,
        explanation:
          "Dependencies are declared as constructor parameters. The DI container provides the correct implementations. This makes OrderService testable — inject mock implementations in tests.",
      },
      {
        title: "Using DI in minimal API endpoints",
        code: `// Services are injected as endpoint parameters
app.MapGet("/orders", async (IOrderRepository repo) =>
    await repo.GetAllAsync());

app.MapPost("/orders", async (
    CreateOrderRequest request,
    OrderService orderService) =>
{
    var order = new Order(request.ProductId, request.Quantity);
    await orderService.PlaceOrderAsync(order);
    return Results.Created($"/orders/{order.Id}", order);
});

// IOptions<T> for configuration
builder.Services.Configure<EmailSettings>(
    builder.Configuration.GetSection("Email"));

public class SmtpEmailService : IEmailService
{
    private readonly EmailSettings _settings;
    public SmtpEmailService(IOptions<EmailSettings> options)
        => _settings = options.Value;
}`,
        explanation:
          "Minimal API endpoints receive services as parameters. IOptions<T> binds configuration sections to strongly-typed objects. The DI container resolves the entire dependency chain.",
      },
    ],
    keyTakeaways: [
      "DI: objects receive dependencies from outside instead of creating them",
      "Three lifetimes: Transient (new each time), Scoped (per request), Singleton (per app)",
      "Register with builder.Services.Add*<Interface, Implementation>()",
      "Resolve via constructor injection — declare the interface as a parameter",
      "IOptions<T> injects strongly-typed configuration from appsettings.json",
      "Never inject Scoped into Singleton — it captures the scoped instance permanently",
    ],
  },
};
