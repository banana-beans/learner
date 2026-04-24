import type { ReviewCard } from "@/lib/types";

function makeCard(
  partial: Omit<ReviewCard, "fsrs" | "state" | "dueDate" | "createdAt">
): ReviewCard {
  return {
    ...partial,
    fsrs: {
      stability: 1.0,
      difficulty: 5.0,
      elapsedDays: 0,
      scheduledDays: 0,
      reps: 0,
      lapses: 0,
      state: "new",
    },
    state: "new",
    dueDate: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
}

export const csharpTier4Cards: ReviewCard[] = [
  // ── csharp:t4:async-await ────────────────────────────────────
  makeCard({
    id: "card:csharp:t4:async-await:1",
    nodeId: "csharp:t4:async-await",
    branchId: "csharp",
    type: "concept",
    front: "What does async/await do and why is it important for scalability?",
    back: "async/await lets a method yield its thread during I/O waits (network, disk, database) and resume when the result arrives. Without it, a web server thread sits idle waiting for each I/O operation. With async, that thread can serve other requests. This dramatically improves throughput without manual threading.",
  }),
  makeCard({
    id: "card:csharp:t4:async-await:2",
    nodeId: "csharp:t4:async-await",
    branchId: "csharp",
    type: "concept",
    front: "Why should you avoid 'async void' and what should you use instead?",
    back: "async void methods cannot be awaited, so exceptions are thrown on the SynchronizationContext (crashing the app in many cases). They also can't be tested properly. Always use 'async Task' or 'async Task<T>'. The only exception: event handlers require async void because the event signature demands void.",
  }),
  makeCard({
    id: "card:csharp:t4:async-await:3",
    nodeId: "csharp:t4:async-await",
    branchId: "csharp",
    type: "concept",
    front: "How does Task.WhenAll differ from awaiting tasks sequentially?",
    back: "Sequential: await t1; await t2; await t3; — total time = t1 + t2 + t3. Task.WhenAll: await Task.WhenAll(t1, t2, t3); — total time = max(t1, t2, t3). WhenAll starts all tasks immediately and waits for all to complete. Use it when tasks are independent to maximize concurrency.",
  }),

  // ── csharp:t4:aspnet-basics ─────────────────────────────────
  makeCard({
    id: "card:csharp:t4:aspnet-basics:1",
    nodeId: "csharp:t4:aspnet-basics",
    branchId: "csharp",
    type: "concept",
    front: "What are Minimal APIs in ASP.NET Core?",
    back: "Minimal APIs (introduced in .NET 6) define HTTP endpoints directly in Program.cs using app.MapGet(), MapPost(), MapPut(), MapDelete(). They eliminate the need for controller classes, making simple APIs concise. Parameters bind automatically from routes ({id}), query strings (?q=), and JSON request bodies.",
  }),
  makeCard({
    id: "card:csharp:t4:aspnet-basics:2",
    nodeId: "csharp:t4:aspnet-basics",
    branchId: "csharp",
    type: "concept",
    front: "What is the ASP.NET Core middleware pipeline?",
    back: "Middleware components process HTTP requests in a pipeline. Each can inspect/modify the request, pass it to the next middleware with 'next()', and inspect/modify the response on the way back. Order matters: UseAuthentication() must come before UseAuthorization(). The pipeline is like nested Russian dolls — request flows in, response flows back out.",
  }),
  makeCard({
    id: "card:csharp:t4:aspnet-basics:3",
    nodeId: "csharp:t4:aspnet-basics",
    branchId: "csharp",
    type: "concept",
    front: "What are Results.Ok(), Results.NotFound(), and Results.Created() in Minimal APIs?",
    back: "These are typed result helpers that return appropriate HTTP status codes. Results.Ok(data) → 200 with data. Results.NotFound() → 404. Results.Created(uri, data) → 201 with Location header. Results.NoContent() → 204. Results.BadRequest(error) → 400. They make endpoint return types explicit and correct.",
  }),

  // ── csharp:t4:entity-framework ──────────────────────────────
  makeCard({
    id: "card:csharp:t4:entity-framework:1",
    nodeId: "csharp:t4:entity-framework",
    branchId: "csharp",
    type: "concept",
    front: "What are DbContext and DbSet<T> in EF Core?",
    back: "DbContext is the main class for database interaction — it manages connections, change tracking, and transactions. DbSet<T> properties represent database tables. You query with LINQ on DbSet<T>, add entities with DbSet.Add(), and persist changes with SaveChangesAsync(). EF Core translates LINQ to SQL automatically.",
  }),
  makeCard({
    id: "card:csharp:t4:entity-framework:2",
    nodeId: "csharp:t4:entity-framework",
    branchId: "csharp",
    type: "concept",
    front: "What is the N+1 query problem and how does Include() solve it?",
    back: "N+1 happens when loading N related entities triggers N additional queries (one per parent). Example: loading 100 orders and accessing order.Customer for each = 1 query for orders + 100 queries for customers. Include(o => o.Customer) generates a single JOIN query, loading all data in one round-trip.",
  }),
  makeCard({
    id: "card:csharp:t4:entity-framework:3",
    nodeId: "csharp:t4:entity-framework",
    branchId: "csharp",
    type: "concept",
    front: "What are EF Core migrations and how do you use them?",
    back: "Migrations manage database schema changes as code. When you change your entity classes, run 'dotnet ef migrations add MigrationName' to generate a migration (C# code that alters tables). Then 'dotnet ef database update' applies pending migrations to the database. This keeps your schema versioned and reproducible across environments.",
  }),

  // ── csharp:t4:dependency-injection ──────────────────────────
  makeCard({
    id: "card:csharp:t4:dependency-injection:1",
    nodeId: "csharp:t4:dependency-injection",
    branchId: "csharp",
    type: "concept",
    front: "Explain the three DI service lifetimes: Transient, Scoped, Singleton.",
    back: "Transient: new instance every time requested. Best for lightweight, stateless services. Scoped: one instance per HTTP request (scope). Best for DbContext and request-specific state. Singleton: one instance for the app's lifetime. Best for caches, config, and stateless helpers. Rule: never inject Scoped into Singleton.",
  }),
  makeCard({
    id: "card:csharp:t4:dependency-injection:2",
    nodeId: "csharp:t4:dependency-injection",
    branchId: "csharp",
    type: "concept",
    front: "What is constructor injection and why is it preferred?",
    back: "Constructor injection means declaring dependencies as constructor parameters: public OrderService(IOrderRepo repo, IEmailService email). The DI container creates the service and provides the dependencies automatically. It's preferred because: dependencies are explicit, required dependencies are enforced (no null), and services are easily testable with mock implementations.",
  }),
  makeCard({
    id: "card:csharp:t4:dependency-injection:3",
    nodeId: "csharp:t4:dependency-injection",
    branchId: "csharp",
    type: "concept",
    front: "What is IOptions<T> and how does it work with DI?",
    back: "IOptions<T> injects strongly-typed configuration from appsettings.json. Register with builder.Services.Configure<EmailSettings>(builder.Configuration.GetSection(\"Email\")). Inject via constructor: IOptions<EmailSettings> options. Access values with options.Value. This binds JSON config to C# objects, with type safety and IntelliSense.",
  }),
];
