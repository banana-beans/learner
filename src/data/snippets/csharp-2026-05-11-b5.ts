import type { Snippet } from "./types";

export const csharpSnippets20260511B5: Snippet[] = [
  // ── snippet ──────────────────────────────────────────────────────────────
  {
    id: "cs-ef-dbcontext",
    language: "csharp",
    title: "DbContext with DbSet<T> and SQLite configuration",
    tag: "snippet",
    code: `using Microsoft.EntityFrameworkCore;

public class Blog
{
    public int Id { get; set; }
    public string Title { get; set; } = "";
    public List<Post> Posts { get; set; } = [];
}

public class Post
{
    public int Id { get; set; }
    public string Body { get; set; } = "";
    public int BlogId { get; set; }
}

public class AppDbContext : DbContext
{
    public DbSet<Blog> Blogs { get; set; }
    public DbSet<Post> Posts { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder opts)
        => opts.UseSqlite("Data Source=app.db");
}`,
    explanation:
      "DbContext is the unit-of-work entry point; each DbSet<T> property maps to a database table and exposes LINQ query methods — OnConfiguring wires up the provider, here SQLite for local development.",
  },
  {
    id: "cs-ef-dbset",
    language: "csharp",
    title: "DbSet<T> — Add / Remove / Find operations",
    tag: "snippet",
    code: `using var db = new AppDbContext();
await db.Database.EnsureCreatedAsync();

// Add
var blog = new Blog { Title = "My Blog" };
db.Blogs.Add(blog);
await db.SaveChangesAsync();
Console.WriteLine(blog.Id);   // 1 (set by EF after insert)

// Find by primary key (checks tracker first, then DB)
var found = await db.Blogs.FindAsync(blog.Id);
Console.WriteLine(found?.Title);   // My Blog

// Remove
db.Blogs.Remove(found!);
await db.SaveChangesAsync();`,
    explanation:
      "Add() marks the entity as Added, Remove() marks it as Deleted, and FindAsync() is the fastest single-entity lookup because it checks the change tracker cache before hitting the database.",
  },
  {
    id: "cs-ef-query",
    language: "csharp",
    title: "LINQ query on DbSet<T> — Where / OrderBy / ToListAsync",
    tag: "snippet",
    code: `using var db = new AppDbContext();

List<Blog> results = await db.Blogs
    .Where(b => b.Title.Contains("tech"))
    .OrderBy(b => b.Title)
    .ToListAsync();

foreach (var b in results)
    Console.WriteLine(b.Title);

// EF translates the LINQ chain to:
// SELECT * FROM Blogs WHERE Title LIKE '%tech%' ORDER BY Title`,
    explanation:
      "LINQ query operators on a DbSet are translated lazily into a single SQL query; nothing is sent to the database until you materialise the results with ToListAsync(), FirstOrDefaultAsync(), or similar.",
  },
  {
    id: "cs-ef-include",
    language: "csharp",
    title: "Include() — eager loading of navigation properties",
    tag: "snippet",
    code: `using Microsoft.EntityFrameworkCore;
using var db = new AppDbContext();

// Without Include, blog.Posts would be null (or empty) in no-lazy context
var blogs = await db.Blogs
    .Include(b => b.Posts)          // JOIN Blogs + Posts
    .ThenInclude(p => p.Comments)   // if Post had a Comments nav
    .ToListAsync();

foreach (var blog in blogs)
    Console.WriteLine(\`\${blog.Title}: \${blog.Posts.Count} posts\`);`,
    explanation:
      "Include() tells EF Core to JOIN and populate the specified navigation property in the same query; ThenInclude() chains to a deeper level — without it you'd get null or an empty collection in non-lazy-loading setups.",
  },
  {
    id: "cs-ef-where-filter",
    language: "csharp",
    title: "Where() — translated to SQL WHERE clause",
    tag: "snippet",
    code: `using var db = new AppDbContext();

// Simple equality filter
var active = await db.Blogs
    .Where(b => b.Title.StartsWith("A"))
    .ToListAsync();
// SQL: SELECT * FROM Blogs WHERE Title LIKE 'A%'

// Multiple conditions
var recent = await db.Posts
    .Where(p => p.BlogId == 1 && p.Body.Length > 10)
    .ToListAsync();
// SQL: SELECT * FROM Posts WHERE BlogId = 1 AND LENGTH(Body) > 10`,
    explanation:
      "EF Core translates most LINQ predicates in Where() to their SQL equivalents — string methods like StartsWith become LIKE patterns, and boolean operators become AND/OR in the WHERE clause.",
  },
  {
    id: "cs-ef-orderby",
    language: "csharp",
    title: "OrderBy() / OrderByDescending() — translated to ORDER BY",
    tag: "snippet",
    code: `using var db = new AppDbContext();

// Single column ascending
var byTitle = await db.Blogs
    .OrderBy(b => b.Title)
    .ToListAsync();
// SQL: ORDER BY Title ASC

// Multi-column: primary + secondary sort
var byIdDesc = await db.Posts
    .OrderByDescending(p => p.BlogId)
    .ThenBy(p => p.Id)
    .ToListAsync();
// SQL: ORDER BY BlogId DESC, Id ASC`,
    explanation:
      "OrderBy() and OrderByDescending() on a DbSet build an ORDER BY clause in SQL; chain ThenBy() / ThenByDescending() for multi-column sorting — all evaluated server-side before results are returned.",
  },
  {
    id: "cs-ef-select-project",
    language: "csharp",
    title: "Select() — project to a DTO (SELECT columns)",
    tag: "snippet",
    code: `using var db = new AppDbContext();

var dtos = await db.Blogs
    .Where(b => b.Posts.Count > 0)
    .Select(b => new
    {
        b.Id,
        b.Title,
        PostCount = b.Posts.Count,   // translated to COUNT subquery
    })
    .ToListAsync();

foreach (var d in dtos)
    Console.WriteLine(\`\${d.Id} \${d.Title} (\${d.PostCount} posts)\`);
// SQL: SELECT Id, Title, (SELECT COUNT(*) FROM Posts WHERE BlogId=b.Id)`,
    explanation:
      "Select() projects to an anonymous type or DTO and EF Core translates it to a SELECT that fetches only the needed columns — far more efficient than loading full entities when you only need a few fields.",
  },
  {
    id: "cs-ef-insert",
    language: "csharp",
    title: "Insert — db.Add() then SaveChangesAsync()",
    tag: "snippet",
    code: `using var db = new AppDbContext();
await db.Database.EnsureCreatedAsync();

var blog = new Blog { Title = "Async Deep Dive" };
db.Blogs.Add(blog);               // EntityState.Added
await db.SaveChangesAsync();       // INSERT INTO Blogs (Title) VALUES (...)
Console.WriteLine(blog.Id);       // e.g. 1 — set by DB, reflected back

// Alternatively, using db.Add() (works with any entity type)
var post = new Post { BlogId = blog.Id, Body = "First post!" };
db.Add(post);
await db.SaveChangesAsync();`,
    explanation:
      "db.Add() marks the entity as Added in the change tracker; SaveChangesAsync() generates and executes the INSERT statement, and EF Core reflects the database-generated primary key back onto the entity object.",
  },
  {
    id: "cs-ef-update",
    language: "csharp",
    title: "Update — db.Update() marks all properties modified",
    tag: "snippet",
    code: `using var db = new AppDbContext();

// Tracked entity — just mutate, no explicit Update() needed
var blog = await db.Blogs.FindAsync(1);
blog!.Title = "Updated Title";
await db.SaveChangesAsync();   // UPDATE Blogs SET Title=... WHERE Id=1

// Detached entity (e.g. came from another scope)
var detached = new Blog { Id = 2, Title = "Re-attached" };
db.Blogs.Update(detached);     // marks ALL properties as Modified
await db.SaveChangesAsync();   // UPDATE Blogs SET Title=... WHERE Id=2`,
    explanation:
      "For tracked entities you just mutate the property and save — EF detects the change automatically; db.Update() is for detached entities, but it marks every property as dirty, generating a full-column UPDATE.",
  },
  {
    id: "cs-ef-delete",
    language: "csharp",
    title: "Delete — db.Remove() then SaveChangesAsync()",
    tag: "snippet",
    code: `using var db = new AppDbContext();

// Load then remove
var blog = await db.Blogs.FindAsync(1);
if (blog is not null)
{
    db.Blogs.Remove(blog);
    await db.SaveChangesAsync();   // DELETE FROM Blogs WHERE Id=1
}

// Delete without loading (EF 7+: ExecuteDeleteAsync)
await db.Blogs
    .Where(b => b.Title == "Draft")
    .ExecuteDeleteAsync();   // single DELETE statement, no tracking`,
    explanation:
      "The classic load-then-remove pattern requires a round-trip to fetch the entity; EF 7's ExecuteDeleteAsync() issues a single DELETE SQL statement matching your LINQ predicate — much faster for bulk deletes.",
  },
  {
    id: "cs-ef-transaction",
    language: "csharp",
    title: "Explicit transaction with BeginTransactionAsync()",
    tag: "snippet",
    code: `using var db = new AppDbContext();
await using var tx = await db.Database.BeginTransactionAsync();
try
{
    db.Blogs.Add(new Blog { Title = "TX Blog" });
    await db.SaveChangesAsync();

    db.Posts.Add(new Post { BlogId = 1, Body = "TX Post" });
    await db.SaveChangesAsync();

    await tx.CommitAsync();    // both inserts committed atomically
}
catch
{
    await tx.RollbackAsync();  // revert both on any error
    throw;
}`,
    explanation:
      "BeginTransactionAsync() gives you explicit control over transaction boundaries — multiple SaveChangesAsync() calls within the transaction are all committed or rolled back together, ensuring atomic multi-step operations.",
  },
  {
    id: "cs-ef-raw-sql",
    language: "csharp",
    title: "Raw SQL with FromSqlRaw() — parameterized query",
    tag: "snippet",
    code: `using var db = new AppDbContext();

// Safe parameterized raw SQL — parameter replaced with @p0
int targetId = 1;
var blogs = await db.Blogs
    .FromSqlRaw("SELECT * FROM Blogs WHERE Id = {0}", targetId)
    .ToListAsync();

// For non-entity results, use ExecuteSqlRawAsync
int rows = await db.Database.ExecuteSqlRawAsync(
    "UPDATE Blogs SET Title = {0} WHERE Id = {1}",
    "Patched", targetId);
Console.WriteLine(rows);   // 1`,
    explanation:
      "FromSqlRaw() lets you drop to raw SQL when LINQ can't express your query, and the {0} placeholders are always parameterized — never use string interpolation here or you'll create a SQL injection vulnerability.",
  },
  {
    id: "cs-ef-compiled-query",
    language: "csharp",
    title: "EF.CompileAsyncQuery() — pre-compiled query for hot paths",
    tag: "snippet",
    code: `using Microsoft.EntityFrameworkCore;

// Compiled once at startup — reused every call without re-parsing LINQ
private static readonly Func<AppDbContext, int, Task<Blog?>> GetBlogById =
    EF.CompileAsyncQuery((AppDbContext db, int id) =>
        db.Blogs.FirstOrDefault(b => b.Id == id));

// Usage:
using var db = new AppDbContext();
var blog = await GetBlogById(db, 1);
Console.WriteLine(blog?.Title);   // My Blog`,
    explanation:
      "EF.CompileAsyncQuery() translates the LINQ expression to SQL once and caches the result — on hot paths (called thousands of times per second) this eliminates repeated expression-tree parsing overhead.",
  },
  {
    id: "cs-ef-async-ops",
    language: "csharp",
    title: "Async EF operations — ToListAsync / FirstOrDefaultAsync / CountAsync",
    tag: "snippet",
    code: `using var db = new AppDbContext();

// Fetch all matching rows
List<Blog> all = await db.Blogs.ToListAsync();

// Fetch first match or null
Blog? first = await db.Blogs
    .FirstOrDefaultAsync(b => b.Title.Contains("tech"));

// Count without loading entities
int count = await db.Blogs.CountAsync();

// Check existence
bool any = await db.Blogs.AnyAsync(b => b.Title == "Draft");

Console.WriteLine(\`count=\${count} any=\${any}\`);`,
    explanation:
      "EF Core's async terminal operators (ToListAsync, FirstOrDefaultAsync, CountAsync, AnyAsync) execute the SQL query and return results without blocking the thread — always prefer these over their synchronous counterparts in async web code.",
  },
  // ── understanding ─────────────────────────────────────────────────────────
  {
    id: "cs-ef-tracking",
    language: "csharp",
    title: "Change tracking — EF detects mutations automatically",
    tag: "understanding",
    code: `using var db = new AppDbContext();

var blog = await db.Blogs.FirstAsync();          // EntityState.Unchanged
Console.WriteLine(db.Entry(blog).State);         // Unchanged

blog.Title = "Modified";
Console.WriteLine(db.Entry(blog).State);         // Modified

await db.SaveChangesAsync();
// EF generates: UPDATE Blogs SET Title=@p0 WHERE Id=@p1
// Only the changed columns are included in the UPDATE`,
    explanation:
      "EF Core snapshots entity state when you load it; when you mutate a property the change tracker detects the difference and marks the entity as Modified — SaveChangesAsync() then generates a precise UPDATE covering only the changed columns.",
  },
  {
    id: "cs-ef-no-tracking",
    language: "csharp",
    title: "AsNoTracking() — read-only queries, faster and lighter",
    tag: "understanding",
    code: `using var db = new AppDbContext();

// Tracked (default): EF stores a snapshot for change detection
var tracked = await db.Blogs.FirstAsync();
// 2× memory: entity + snapshot

// No-tracking: no snapshot stored; entity is a plain POCO
var readOnly = await db.Blogs
    .AsNoTracking()
    .FirstAsync();
// Faster query, no ChangeTracker overhead

// Modifying and trying to save a no-tracking entity needs explicit Update()
db.Blogs.Update(readOnly);   // re-attaches as Modified
await db.SaveChangesAsync();`,
    explanation:
      "AsNoTracking() skips the change-tracker snapshot, halving memory use and improving query performance for read-only operations — the trade-off is that EF won't auto-detect changes, so you must call Update() if you later want to save.",
  },
  {
    id: "cs-ef-change-tracker",
    language: "csharp",
    title: "ChangeTracker.Entries() — inspect all tracked entity states",
    tag: "understanding",
    code: `using Microsoft.EntityFrameworkCore;
using var db = new AppDbContext();

var blog = await db.Blogs.FindAsync(1);
blog!.Title = "Changed";
db.Blogs.Add(new Blog { Title = "New" });

foreach (var entry in db.ChangeTracker.Entries<Blog>())
{
    Console.WriteLine(\`\${entry.Entity.Title} → \${entry.State}\`);
}
// Changed  → Modified
// New      → Added`,
    explanation:
      "ChangeTracker.Entries<T>() exposes every tracked entity and its state (Added, Modified, Deleted, Unchanged, Detached) — useful for auditing, debugging, or building generic SaveChanges interceptors.",
  },
  {
    id: "cs-ef-migrations",
    language: "csharp",
    title: "EF migrations — Add-Migration / Update-Database workflow",
    tag: "understanding",
    code: `// 1. Make a model change (e.g. add a property)
// public string Slug { get; set; } = "";

// 2. In Package Manager Console or dotnet CLI:
// dotnet ef migrations add AddBlogSlug

// Generated file: Migrations/20260511_AddBlogSlug.cs
// Up():
//   migrationBuilder.AddColumn<string>(name: "Slug", table: "Blogs", ...);
// Down():
//   migrationBuilder.DropColumn(name: "Slug", table: "Blogs");

// 3. Apply to database:
// dotnet ef database update

// 4. At app startup (optional):
// await db.Database.MigrateAsync();  // applies pending migrations`,
    explanation:
      "EF migrations version-control your schema: each migration has an Up() that applies the change and a Down() that reverts it — the migration history table in the database tracks which migrations have been applied.",
  },
  {
    id: "cs-ef-concurrency",
    language: "csharp",
    title: "Optimistic concurrency with [ConcurrencyCheck] or row version",
    tag: "understanding",
    code: `using System.ComponentModel.DataAnnotations;

public class Product
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public decimal Price { get; set; }

    // EF adds this value to WHERE on UPDATE/DELETE
    [Timestamp]
    public byte[] RowVersion { get; set; } = [];
}

// On conflict, EF throws DbUpdateConcurrencyException
try
{
    await db.SaveChangesAsync();
}
catch (DbUpdateConcurrencyException ex)
{
    // Reload current values, merge, and retry
    await ex.Entries.Single().ReloadAsync();
}`,
    explanation:
      "Optimistic concurrency adds the RowVersion (or a [ConcurrencyCheck] column) to the UPDATE WHERE clause — if another user changed the row since you loaded it, the affected-rows count is zero and EF throws DbUpdateConcurrencyException.",
  },
  {
    id: "cs-ef-lazy-loading",
    language: "csharp",
    title: "Lazy loading via proxies — navigation loaded on first access",
    tag: "understanding",
    code: `// Enable: install Microsoft.EntityFrameworkCore.Proxies
// opts.UseLazyLoadingProxies().UseSqlite("...");

// Navigation properties MUST be virtual for lazy loading to work
public class Blog
{
    public int Id { get; set; }
    public virtual ICollection<Post> Posts { get; set; } = [];
}

using var db = new AppDbContext();
var blog = await db.Blogs.FirstAsync();
// Posts is NOT loaded yet — no JOIN in the initial query

int count = blog.Posts.Count;   // ← triggers SELECT * FROM Posts WHERE BlogId=?
Console.WriteLine(count);`,
    explanation:
      "Lazy loading proxies intercept access to virtual navigation properties and issue a separate SQL query on first touch — convenient but dangerous in loops because each access generates a new query (N+1 problem).",
  },
  {
    id: "cs-ef-explicit-loading",
    language: "csharp",
    title: "Explicit loading — db.Entry().Collection().LoadAsync()",
    tag: "understanding",
    code: `using var db = new AppDbContext();

var blog = await db.Blogs.FirstAsync();
// Posts not loaded yet

// Explicitly load the collection when you decide you need it
await db.Entry(blog)
    .Collection(b => b.Posts)
    .LoadAsync();
// SQL: SELECT * FROM Posts WHERE BlogId = @id

Console.WriteLine(blog.Posts.Count);   // populated now

// Also works for reference navigations:
// await db.Entry(post).Reference(p => p.Blog).LoadAsync();`,
    explanation:
      "Explicit loading gives you control over when a navigation is fetched — unlike lazy loading it's deliberate and visible in the code, and unlike Include() you can load it conditionally after the initial query.",
  },
  {
    id: "cs-ef-eager-loading",
    language: "csharp",
    title: "Include() vs ThenInclude() — depth of eager loading",
    tag: "understanding",
    code: `using Microsoft.EntityFrameworkCore;
using var db = new AppDbContext();

// Include one level
var blogs = await db.Blogs
    .Include(b => b.Posts)
    .ToListAsync();

// Include two levels deep: Blog → Posts → Comments
var deep = await db.Blogs
    .Include(b => b.Posts)
        .ThenInclude(p => p.Comments)
    .Include(b => b.Owner)    // separate root-level Include
    .ToListAsync();

// EF generates JOINs or split queries depending on settings`,
    explanation:
      "Include() loads a single navigation level; ThenInclude() continues from the previous Include into a deeper navigation — each separate root-level Include() starts a new chain and can target a different navigation property.",
  },
  {
    id: "cs-ef-shadow-props",
    language: "csharp",
    title: "Shadow properties — tracked by EF but not on the POCO",
    tag: "understanding",
    code: `using Microsoft.EntityFrameworkCore;

// In OnModelCreating:
modelBuilder.Entity<Blog>()
    .Property<DateTime>("CreatedAt")   // shadow property — no C# field
    .HasDefaultValueSql("GETUTCDATE()");

// Set via ChangeTracker:
using var db = new AppDbContext();
var blog = new Blog { Title = "Shadow Demo" };
db.Blogs.Add(blog);
db.Entry(blog).Property("CreatedAt").CurrentValue = DateTime.UtcNow;
await db.SaveChangesAsync();

// Query via EF.Property<T>:
var created = await db.Blogs
    .Select(b => EF.Property<DateTime>(b, "CreatedAt"))
    .FirstAsync();`,
    explanation:
      "Shadow properties live in the EF model but have no corresponding C# property on the entity class — useful for infrastructure columns like CreatedAt or TenantId that you don't want polluting your domain model.",
  },
  {
    id: "cs-ef-global-filter",
    language: "csharp",
    title: "HasQueryFilter() — automatic soft-delete filter",
    tag: "understanding",
    code: `// In OnModelCreating:
modelBuilder.Entity<Blog>()
    .HasQueryFilter(b => !b.IsDeleted);   // applied to every query

// Now all queries automatically exclude soft-deleted rows:
var blogs = await db.Blogs.ToListAsync();
// SQL: SELECT * FROM Blogs WHERE IsDeleted = 0

// Bypass the filter when needed:
var all = await db.Blogs.IgnoreQueryFilters().ToListAsync();
// SQL: SELECT * FROM Blogs  (no filter)`,
    explanation:
      "HasQueryFilter() registers a predicate that EF Core appends to every query on that entity type — the standard pattern for soft-delete and multi-tenancy so you never accidentally query deleted rows or wrong-tenant data.",
  },
  {
    id: "cs-ef-owned-type",
    language: "csharp",
    title: "OwnsOne — owned entity stored in the owner's table",
    tag: "understanding",
    code: `public class Address   // owned type — no separate table
{
    public string Street { get; set; } = "";
    public string City   { get; set; } = "";
}

public class Customer
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public Address ShippingAddress { get; set; } = new();
}

// In OnModelCreating:
modelBuilder.Entity<Customer>()
    .OwnsOne(c => c.ShippingAddress);
// Columns: Customers(Id, Name, ShippingAddress_Street, ShippingAddress_City)`,
    explanation:
      "OwnsOne maps an owned type's properties as columns in the owner table — the owned type has no identity of its own, acts like a value object, and is always loaded with its owner.",
  },
  {
    id: "cs-ef-table-splitting",
    language: "csharp",
    title: "Table splitting — two entities sharing one table",
    tag: "understanding",
    code: `public class BlogSummary
{
    public int Id { get; set; }
    public string Title { get; set; } = "";
    public BlogDetails Details { get; set; } = null!;
}

public class BlogDetails
{
    public int Id { get; set; }
    public string FullContent { get; set; } = "";
}

// In OnModelCreating:
modelBuilder.Entity<BlogSummary>().ToTable("Blogs");
modelBuilder.Entity<BlogDetails>().ToTable("Blogs");
modelBuilder.Entity<BlogSummary>()
    .HasOne(b => b.Details).WithOne()
    .HasForeignKey<BlogDetails>(d => d.Id);`,
    explanation:
      "Table splitting maps two entity types to the same table sharing a primary key — useful when one entity has large columns (BLOBs, long text) you want to load only on demand via a separate Include().",
  },
  {
    id: "cs-ef-value-conversion",
    language: "csharp",
    title: "HasConversion<>() — store enum as string in the database",
    tag: "understanding",
    code: `public enum Status { Draft, Published, Archived }

public class Article
{
    public int Id { get; set; }
    public Status Status { get; set; }
}

// In OnModelCreating:
modelBuilder.Entity<Article>()
    .Property(a => a.Status)
    .HasConversion<string>();   // stored as "Draft", "Published", etc.

// Query still works naturally:
var published = await db.Articles
    .Where(a => a.Status == Status.Published)
    .ToListAsync();
// SQL: WHERE Status = 'Published'`,
    explanation:
      "HasConversion<string>() tells EF to store the enum value as its name string in the database — far more readable in raw SQL and survives enum reordering, unlike the default integer storage.",
  },
  {
    id: "cs-ef-interceptors",
    language: "csharp",
    title: "DbCommandInterceptor — log or modify SQL commands",
    tag: "understanding",
    code: `using Microsoft.EntityFrameworkCore.Diagnostics;
using System.Data.Common;

public class LoggingInterceptor : DbCommandInterceptor
{
    public override ValueTask<DbDataReader> ReaderExecutedAsync(
        DbCommand command,
        CommandExecutedEventData eventData,
        DbDataReader result,
        CancellationToken ct = default)
    {
        Console.WriteLine(\`SQL (\${eventData.Duration.TotalMilliseconds:F1}ms): \${command.CommandText}\`);
        return new ValueTask<DbDataReader>(result);
    }
}

// Register:
opts.AddInterceptors(new LoggingInterceptor());`,
    explanation:
      "DbCommandInterceptor lets you tap into every SQL command EF executes — you can log slow queries, add query hints, or even rewrite CommandText before execution, all without changing application code.",
  },
  // ── structures ────────────────────────────────────────────────────────────
  {
    id: "cs-ef-repository",
    language: "csharp",
    title: "Generic repository wrapping DbSet<T>",
    tag: "structures",
    code: `public interface IRepository<T> where T : class
{
    Task<T?> FindAsync(int id);
    Task<List<T>> ListAsync();
    void Add(T entity);
    void Remove(T entity);
    Task SaveAsync();
}

public class EfRepository<T> : IRepository<T> where T : class
{
    private readonly AppDbContext _db;
    private readonly DbSet<T> _set;

    public EfRepository(AppDbContext db) { _db = db; _set = db.Set<T>(); }

    public Task<T?> FindAsync(int id) => _set.FindAsync(id).AsTask();
    public Task<List<T>> ListAsync() => _set.ToListAsync();
    public void Add(T entity) => _set.Add(entity);
    public void Remove(T entity) => _set.Remove(entity);
    public Task SaveAsync() => _db.SaveChangesAsync();
}`,
    explanation:
      "The generic repository wraps DbSet<T> behind an interface, making services testable with an in-memory fake and decoupling them from EF Core — though in simple CRUD apps using DbContext directly is often fine.",
  },
  {
    id: "cs-ef-specification",
    language: "csharp",
    title: "Specification pattern — reusable query expressions",
    tag: "structures",
    code: `using System.Linq.Expressions;

public interface ISpecification<T>
{
    Expression<Func<T, bool>> Criteria { get; }
}

public class PublishedBlogsSpec : ISpecification<Blog>
{
    public Expression<Func<Blog, bool>> Criteria =>
        b => !b.IsDeleted && b.Posts.Count > 0;
}

// Repository apply:
public static IQueryable<T> Apply<T>(
    this IQueryable<T> query, ISpecification<T> spec)
    => query.Where(spec.Criteria);

// Usage:
var blogs = await db.Blogs.Apply(new PublishedBlogsSpec()).ToListAsync();`,
    explanation:
      "The specification pattern encapsulates a query predicate as an object, making complex filters reusable, composable, and testable in isolation without touching repository or service code.",
  },
  {
    id: "cs-ef-unit-of-work",
    language: "csharp",
    title: "IUnitOfWork wrapping DbContext.SaveChangesAsync()",
    tag: "structures",
    code: `public interface IUnitOfWork
{
    IRepository<Blog> Blogs { get; }
    IRepository<Post> Posts { get; }
    Task<int> CommitAsync(CancellationToken ct = default);
}

public class EfUnitOfWork : IUnitOfWork
{
    private readonly AppDbContext _db;
    public IRepository<Blog> Blogs { get; }
    public IRepository<Post> Posts { get; }

    public EfUnitOfWork(AppDbContext db)
    {
        _db = db;
        Blogs = new EfRepository<Blog>(db);
        Posts = new EfRepository<Post>(db);
    }

    public Task<int> CommitAsync(CancellationToken ct = default)
        => _db.SaveChangesAsync(ct);
}`,
    explanation:
      "IUnitOfWork groups multiple repositories under one commit boundary — a single CommitAsync() call persists all pending changes across repositories atomically, mirroring the underlying DbContext SaveChangesAsync().",
  },
  {
    id: "cs-ef-cqrs",
    language: "csharp",
    title: "CQRS — separate read and write DbContext usage",
    tag: "structures",
    code: `// Read side — no tracking, optimised for queries
public class BlogReadService
{
    private readonly AppDbContext _db;
    public BlogReadService(AppDbContext db) => _db = db;

    public Task<List<BlogDto>> GetAllAsync() =>
        _db.Blogs.AsNoTracking()
           .Select(b => new BlogDto(b.Id, b.Title))
           .ToListAsync();
}

// Write side — full tracking for change detection
public class BlogWriteService
{
    private readonly AppDbContext _db;
    public BlogWriteService(AppDbContext db) => _db = db;

    public async Task UpdateTitleAsync(int id, string title)
    {
        var blog = await _db.Blogs.FindAsync(id);
        blog!.Title = title;
        await _db.SaveChangesAsync();
    }
}`,
    explanation:
      "CQRS separates read (query) and write (command) responsibilities — the read side uses AsNoTracking() and projects to DTOs for performance; the write side uses tracked entities and SaveChangesAsync() for correctness.",
  },
  {
    id: "cs-dapper-query",
    language: "csharp",
    title: "Dapper QueryAsync<T> — parameterized query",
    tag: "structures",
    code: `using Dapper;
using Microsoft.Data.Sqlite;

await using var conn = new SqliteConnection("Data Source=app.db");

int targetId = 1;
var blogs = await conn.QueryAsync<Blog>(
    "SELECT Id, Title FROM Blogs WHERE Id = @Id",
    new { Id = targetId }
);

foreach (var b in blogs)
    Console.WriteLine(\`\${b.Id}: \${b.Title}\`);`,
    explanation:
      "Dapper's QueryAsync<T> sends raw SQL with named @Parameter placeholders and maps result rows to your POCO by column name — minimal overhead, full SQL control, no LINQ translation layer.",
  },
  {
    id: "cs-dapper-param",
    language: "csharp",
    title: "Dapper parameterized queries — anonymous object params",
    tag: "structures",
    code: `using Dapper;
using Microsoft.Data.Sqlite;

await using var conn = new SqliteConnection("Data Source=app.db");

// Anonymous object: property names match @Parameter names
var result = await conn.QueryFirstOrDefaultAsync<Blog>(
    "SELECT * FROM Blogs WHERE Title = @Title AND Id > @MinId",
    new { Title = "My Blog", MinId = 0 }
);

Console.WriteLine(result?.Title ?? "not found");`,
    explanation:
      "Dapper maps anonymous object properties to @Named SQL parameters, keeping queries safe from injection and eliminating boilerplate DbParameter construction — the property names must match the parameter names exactly.",
  },
  {
    id: "cs-dapper-multi",
    language: "csharp",
    title: "Dapper QueryMultipleAsync — multi-result-set queries",
    tag: "structures",
    code: `using Dapper;
using Microsoft.Data.Sqlite;

await using var conn = new SqliteConnection("Data Source=app.db");

await using var multi = await conn.QueryMultipleAsync(@"
    SELECT * FROM Blogs;
    SELECT * FROM Posts;
");

var blogs = (await multi.ReadAsync<Blog>()).ToList();
var posts = (await multi.ReadAsync<Post>()).ToList();

Console.WriteLine(\`\${blogs.Count} blogs, \${posts.Count} posts\`);`,
    explanation:
      "QueryMultipleAsync executes a batch of SQL statements in a single round-trip and returns a GridReader; each ReadAsync<T>() call reads the next result set — perfect for dashboard queries that need multiple tables at once.",
  },
  {
    id: "cs-dapper-transaction",
    language: "csharp",
    title: "Dapper transaction — pass IDbTransaction to methods",
    tag: "structures",
    code: `using Dapper;
using System.Data;
using Microsoft.Data.Sqlite;

await using var conn = new SqliteConnection("Data Source=app.db");
await conn.OpenAsync();
await using var tx = await conn.BeginTransactionAsync();
try
{
    await conn.ExecuteAsync(
        "INSERT INTO Blogs (Title) VALUES (@Title)",
        new { Title = "TX Blog" }, transaction: tx);

    await conn.ExecuteAsync(
        "INSERT INTO Posts (BlogId, Body) VALUES (@BlogId, @Body)",
        new { BlogId = 1, Body = "TX post" }, transaction: tx);

    await tx.CommitAsync();
}
catch { await tx.RollbackAsync(); throw; }`,
    explanation:
      "Dapper doesn't manage transactions itself — you create one from the connection and pass it as the transaction parameter to every Execute/Query call in the unit of work, then commit or rollback manually.",
  },
  {
    id: "cs-dapper-dynamic",
    language: "csharp",
    title: "Dapper DynamicParameters — runtime-built parameter sets",
    tag: "structures",
    code: `using Dapper;
using Microsoft.Data.Sqlite;

await using var conn = new SqliteConnection("Data Source=app.db");

var dp = new DynamicParameters();
dp.Add("@Title", "My Blog");
dp.Add("@Limit", 10, System.Data.DbType.Int32);

var results = await conn.QueryAsync<Blog>(
    "SELECT * FROM Blogs WHERE Title = @Title LIMIT @Limit",
    dp
);
Console.WriteLine(results.Count());`,
    explanation:
      "DynamicParameters lets you build a parameter collection programmatically at runtime — useful when the set of filters is determined by user input or conditional business logic rather than a fixed query signature.",
  },
  {
    id: "cs-redis-string",
    language: "csharp",
    title: "StackExchange.Redis — StringGetAsync / StringSetAsync with expiry",
    tag: "structures",
    code: `using StackExchange.Redis;

var redis = await ConnectionMultiplexer.ConnectAsync("localhost:6379");
IDatabase db = redis.GetDatabase();

// Set with 5-minute TTL
await db.StringSetAsync("user:42:name", "Alice", TimeSpan.FromMinutes(5));

// Get (returns RedisValue — check IsNull before using)
RedisValue val = await db.StringGetAsync("user:42:name");
if (!val.IsNull)
    Console.WriteLine((string)val!);   // Alice`,
    explanation:
      "StringSetAsync sets a Redis string key with an optional TTL; StringGetAsync returns a RedisValue that is null-like when the key doesn't exist or has expired — always check IsNull before casting.",
  },
  {
    id: "cs-redis-hash",
    language: "csharp",
    title: "Redis hash — HashGetAsync / HashSetAsync for object fields",
    tag: "structures",
    code: `using StackExchange.Redis;

var redis = await ConnectionMultiplexer.ConnectAsync("localhost:6379");
IDatabase db = redis.GetDatabase();

// Store multiple fields in one hash key
await db.HashSetAsync("product:99", [
    new HashEntry("name",  "Widget"),
    new HashEntry("price", "9.99"),
    new HashEntry("stock", "100"),
]);

// Read individual field
var name = await db.HashGetAsync("product:99", "name");
Console.WriteLine((string)name!);   // Widget

// Read all fields
var all = await db.HashGetAllAsync("product:99");
foreach (var e in all)
    Console.WriteLine(\`\${e.Name}=\${e.Value}\`);`,
    explanation:
      "Redis hashes store a map of field→value under one key, ideal for objects — you can update individual fields without re-serializing the whole object, and HashGetAllAsync fetches everything in one round-trip.",
  },
  {
    id: "cs-redis-list",
    language: "csharp",
    title: "Redis list — ListLeftPushAsync / ListRightPopAsync queue",
    tag: "structures",
    code: `using StackExchange.Redis;

var redis = await ConnectionMultiplexer.ConnectAsync("localhost:6379");
IDatabase db = redis.GetDatabase();

// Producer: push to left (head)
await db.ListLeftPushAsync("jobs", "job-1");
await db.ListLeftPushAsync("jobs", "job-2");
await db.ListLeftPushAsync("jobs", "job-3");

long length = await db.ListLengthAsync("jobs");
Console.WriteLine(length);   // 3

// Consumer: pop from right (tail) — FIFO order
RedisValue job = await db.ListRightPopAsync("jobs");
Console.WriteLine((string)job!);   // job-1  (FIFO)`,
    explanation:
      "Combining ListLeftPush (enqueue at head) with ListRightPop (dequeue from tail) implements a FIFO queue in Redis — no locking needed because Redis operations are atomic at the server level.",
  },
  {
    id: "cs-redis-set",
    language: "csharp",
    title: "Redis set — SetAddAsync / SetMembersAsync for unique members",
    tag: "structures",
    code: `using StackExchange.Redis;

var redis = await ConnectionMultiplexer.ConnectAsync("localhost:6379");
IDatabase db = redis.GetDatabase();

await db.SetAddAsync("online:users", "alice");
await db.SetAddAsync("online:users", "bob");
await db.SetAddAsync("online:users", "alice");   // duplicate — ignored

long count = await db.SetLengthAsync("online:users");
Console.WriteLine(count);   // 2

var members = await db.SetMembersAsync("online:users");
foreach (var m in members)
    Console.Write((string)m! + " ");   // alice bob (order varies)`,
    explanation:
      "Redis sets store unique members with O(1) add/remove/membership-check — ideal for tracking online users, tags, or any group where duplicates should be silently discarded.",
  },
  {
    id: "cs-redis-sorted-set",
    language: "csharp",
    title: "Redis sorted set — leaderboard with SortedSetAddAsync",
    tag: "structures",
    code: `using StackExchange.Redis;

var redis = await ConnectionMultiplexer.ConnectAsync("localhost:6379");
IDatabase db = redis.GetDatabase();

await db.SortedSetAddAsync("leaderboard", "alice", 1500);
await db.SortedSetAddAsync("leaderboard", "bob",   2300);
await db.SortedSetAddAsync("leaderboard", "carol", 1900);

// Top 3 by score descending
var top = await db.SortedSetRangeByScoreAsync(
    "leaderboard", order: StackExchange.Redis.Order.Descending,
    take: 3);

foreach (var m in top)
    Console.WriteLine((string)m!);   // bob carol alice`,
    explanation:
      "Redis sorted sets associate each member with a floating-point score and maintain them in score order — SortedSetRangeByScore with Order.Descending gives you an instant leaderboard with O(log N) insert and range query.",
  },
  // ── caveats ───────────────────────────────────────────────────────────────
  {
    id: "cs-ef-n-plus-one",
    language: "csharp",
    title: "N+1 query — accessing navigation without Include",
    tag: "caveats",
    code: `// BAD: N+1 queries — 1 for blogs + 1 per blog for posts
using var db = new AppDbContext();
var blogs = await db.Blogs.ToListAsync();   // 1 query
foreach (var blog in blogs)
{
    // Each access triggers a separate SELECT (lazy loading must be on)
    Console.WriteLine(blog.Posts.Count);    // N queries
}

// GOOD: single JOIN query
var blogs2 = await db.Blogs
    .Include(b => b.Posts)   // 1 query with JOIN
    .ToListAsync();
foreach (var blog in blogs2)
    Console.WriteLine(blog.Posts.Count);    // no extra queries`,
    explanation:
      "The N+1 problem silently turns 1 query into N+1 as you loop through entities and access unloaded navigation properties — always use Include() (or explicit loading before the loop) to fetch related data in bulk.",
  },
  {
    id: "cs-ef-cartesian-explosion",
    language: "csharp",
    title: "Cartesian explosion — multiple collection Includes multiply rows",
    tag: "caveats",
    code: `// BAD: two collection Includes → cartesian product in SQL
var blogs = await db.Blogs
    .Include(b => b.Posts)      // 100 posts
    .Include(b => b.Tags)       // 50 tags
    .ToListAsync();
// Result: 100 × 50 = 5000 rows transferred for each blog!

// GOOD: split queries (EF 5+) — two separate SELECTs
var blogs2 = await db.Blogs
    .Include(b => b.Posts)
    .Include(b => b.Tags)
    .AsSplitQuery()             // separate SELECT per collection
    .ToListAsync();`,
    explanation:
      "Including two collection navigations on the same entity produces a SQL JOIN that multiplies rows — a blog with 100 posts and 50 tags returns 5000 rows; AsSplitQuery() avoids this by issuing separate queries.",
  },
  {
    id: "cs-ef-string-compare",
    language: "csharp",
    title: "String comparison — StringComparison overloads may not translate",
    tag: "caveats",
    code: `// This translates fine (case-sensitive in most providers)
var ok = await db.Blogs
    .Where(b => b.Title == "my blog")
    .ToListAsync();

// This does NOT translate — throws InvalidOperationException
// var bad = await db.Blogs
//     .Where(b => b.Title.Equals("my blog", StringComparison.OrdinalIgnoreCase))
//     .ToListAsync();

// Use EF.Functions for case-insensitive search instead:
var ci = await db.Blogs
    .Where(b => EF.Functions.Like(b.Title, "my blog"))
    .ToListAsync();`,
    explanation:
      "EF Core cannot translate the StringComparison-overload of Equals() to SQL and will throw at runtime — use the simple == operator (whose case sensitivity depends on the DB collation) or EF.Functions.Like() for explicit case-insensitive matching.",
  },
  {
    id: "cs-ef-client-eval",
    language: "csharp",
    title: "Client-side evaluation — untranslatable operations run in memory",
    tag: "caveats",
    code: `// In older EF versions, untranslatable predicates caused silent client eval.
// In EF Core 3+, they throw InvalidOperationException — safer behaviour.

// This will throw (custom method not translatable):
// var blogs = await db.Blogs
//     .Where(b => MyHelper.IsSpecial(b.Title))   // ← can't translate
//     .ToListAsync();

// Correct: fetch data first, then filter in memory
var all = await db.Blogs.ToListAsync();           // SQL: SELECT * FROM Blogs
var filtered = all.Where(b => MyHelper.IsSpecial(b.Title)).ToList(); // in-memory`,
    explanation:
      "EF Core 3+ throws when it can't translate a predicate to SQL rather than silently loading all rows and filtering in memory — this protects you from accidentally fetching entire tables, but means you must split the query manually.",
  },
  {
    id: "cs-ef-dbcontext-scope",
    language: "csharp",
    title: "DbContext lifetime — not thread-safe; one per scope",
    tag: "caveats",
    code: `// In ASP.NET Core, register as Scoped (default for AddDbContext):
// services.AddDbContext<AppDbContext>(opts => opts.UseSqlite("..."));
// → one instance per HTTP request, disposed at end of request

// WRONG: Singleton lifetime — shared across requests, not thread-safe
// services.AddDbContext<AppDbContext>(..., ServiceLifetime.Singleton);

// WRONG: re-using one instance across parallel tasks:
// await Task.WhenAll(
//     db.Blogs.ToListAsync(),  // same db instance — will corrupt state
//     db.Posts.ToListAsync());`,
    explanation:
      "DbContext is not thread-safe and should never be shared across threads or parallel operations — in ASP.NET Core register it as Scoped so each request gets its own instance that is automatically disposed when the request ends.",
  },
  {
    id: "cs-ef-concurrent-access",
    language: "csharp",
    title: "Concurrent SaveChangesAsync on same context — state corruption",
    tag: "caveats",
    code: `using var db = new AppDbContext();

// WRONG: two concurrent SaveChangesAsync calls on the same context
var t1 = db.SaveChangesAsync();   // race condition!
var t2 = db.SaveChangesAsync();   // may throw or corrupt change tracker
await Task.WhenAll(t1, t2);

// CORRECT: save sequentially, or use separate DbContext instances
await db.SaveChangesAsync();
await db.SaveChangesAsync();   // second call is a no-op (clean tracker)`,
    explanation:
      "DbContext has no internal locking — running two SaveChangesAsync() calls concurrently on the same instance causes race conditions in the change tracker, leading to exceptions or silent data corruption.",
  },
  {
    id: "cs-ef-detached-entity",
    language: "csharp",
    title: "Detached entity with wrong state — duplicate insert",
    tag: "caveats",
    code: `// Entity came from a different DbContext scope (e.g. API request body)
var incoming = new Blog { Id = 5, Title = "Updated" };

using var db = new AppDbContext();
// WRONG: Add() marks it as Added → duplicate INSERT will fail
// db.Blogs.Add(incoming);

// CORRECT: Attach then set state, or use Update()
db.Blogs.Attach(incoming);                   // EntityState.Unchanged
db.Entry(incoming).State = EntityState.Modified;
await db.SaveChangesAsync();   // UPDATE — not INSERT`,
    explanation:
      "An entity created outside a DbContext scope is detached — calling Add() on it marks it as Added and EF tries to INSERT it, likely hitting a primary-key conflict; use Attach() + set Modified state or db.Update() instead.",
  },
  {
    id: "cs-ef-tracking-bug",
    language: "csharp",
    title: "No-tracking entity + Update() — all columns marked dirty",
    tag: "caveats",
    code: `using var db = new AppDbContext();

// Read as no-tracking
var blog = await db.Blogs.AsNoTracking().FirstAsync();
blog.Title = "New Title";   // only this field changed

// This marks ALL properties as Modified — full UPDATE even for unchanged cols
db.Blogs.Update(blog);
await db.SaveChangesAsync();
// SQL: UPDATE Blogs SET Title=@p0 WHERE Id=@p1
// (only one column here, but in a wide table ALL cols get updated)`,
    explanation:
      "db.Update() on a no-tracking entity marks every property as Modified because EF has no original snapshot to diff against — this generates an UPDATE with every column, which is safe but wasteful and can overwrite concurrent changes.",
  },
  {
    id: "cs-ef-migration-conflict",
    language: "csharp",
    title: "Migration conflict — two devs add migrations simultaneously",
    tag: "caveats",
    code: `// Dev A runs: dotnet ef migrations add AddBlogSlug
// Dev B runs: dotnet ef migrations add AddPostViews
// Both migrations have the same PreviousMigration in their snapshot

// Result: migration chain is forked — EF can't apply both linearly

// Resolution:
// 1. One dev removes their migration: dotnet ef migrations remove
// 2. Pull the other dev's migration
// 3. Re-add their migration on top: dotnet ef migrations add AddPostViews

// Prevention: coordinate migrations, or use a single "batch" migration branch strategy`,
    explanation:
      "Each EF migration references the previous one by name — if two developers add migrations from the same base independently, the chain forks and dotnet ef database update will fail; always pull and merge the latest migrations before adding a new one.",
  },
  {
    id: "cs-ef-seed-data",
    language: "csharp",
    title: "HasData() seed — hard-coded IDs; changing them creates orphans",
    tag: "caveats",
    code: `// In OnModelCreating — seeded with hard-coded primary keys:
modelBuilder.Entity<Blog>().HasData(
    new Blog { Id = 1, Title = "Getting Started" },
    new Blog { Id = 2, Title = "Advanced Topics" }
);

// DANGER: changing an Id in HasData creates a new migration that
// DELETEs the old row and INSERTs a new one.
// Any Posts with BlogId=1 become orphaned if their FK is not updated.

// Safer alternative: use a separate seed service that runs conditionally:
// if (!await db.Blogs.AnyAsync()) { db.Blogs.AddRange(...); await db.SaveChangesAsync(); }`,
    explanation:
      "HasData() seed data is tied to hard-coded primary keys; any change to those keys generates a DELETE + INSERT migration that can orphan related rows — a conditional seed service is more flexible for production data.",
  },
  {
    id: "cs-dapper-injection",
    language: "csharp",
    title: "Dapper SQL injection — never interpolate user input",
    tag: "caveats",
    code: `using Dapper;
using Microsoft.Data.Sqlite;

await using var conn = new SqliteConnection("Data Source=app.db");
string userInput = "'; DROP TABLE Blogs; --";

// DANGEROUS: string interpolation → SQL injection
// var bad = await conn.QueryAsync(\`SELECT * FROM Blogs WHERE Title = '\${userInput}'\`);

// SAFE: named parameter — user input is never interpreted as SQL
var safe = await conn.QueryAsync<Blog>(
    "SELECT * FROM Blogs WHERE Title = @Title",
    new { Title = userInput }
);
Console.WriteLine(safe.Count());   // 0 — harmless`,
    explanation:
      "Dapper does not prevent SQL injection if you use string interpolation — always pass user-controlled values as named @Parameters in an anonymous object so Dapper sends them as parameterized values that the driver escapes properly.",
  },
  {
    id: "cs-connection-leak",
    language: "csharp",
    title: "Connection leak — forgetting await using on a connection",
    tag: "caveats",
    code: `using Microsoft.Data.Sqlite;

// WRONG: connection never disposed if an exception is thrown
var conn1 = new SqliteConnection("Data Source=app.db");
await conn1.OpenAsync();
// ... if an exception here, conn1 leaks from the pool

// CORRECT: await using ensures Dispose() is called even on exception
await using var conn2 = new SqliteConnection("Data Source=app.db");
await conn2.OpenAsync();
// conn2 is always returned to the pool when the scope exits`,
    explanation:
      "SqlConnection and similar types are IAsyncDisposable — forgetting await using means the connection is never returned to the pool on exceptions, eventually exhausting the pool and causing timeouts for all new requests.",
  },
  {
    id: "cs-transaction-isolation",
    language: "csharp",
    title: "Transaction isolation level — default varies by provider",
    tag: "caveats",
    code: `using System.Data;
using Microsoft.Data.SqlClient;

await using var conn = new SqlConnection("Server=...;Database=app;Trusted_Connection=True");
await conn.OpenAsync();

// Default is READ COMMITTED for SQL Server, SERIALIZABLE for SQLite
// Be explicit to avoid surprises across providers:
await using var tx = await conn.BeginTransactionAsync(
    IsolationLevel.ReadCommitted
);

// Now behaviour is predictable regardless of provider defaults
await tx.CommitAsync();`,
    explanation:
      "Different database providers default to different isolation levels — SQL Server defaults to READ COMMITTED while SQLite defaults to SERIALIZABLE; always specify the isolation level explicitly when it matters for correctness.",
  },
  {
    id: "cs-bulk-insert-perf",
    language: "csharp",
    title: "Bulk insert perf — EF AddRange vs BulkExtensions",
    tag: "caveats",
    code: `using var db = new AppDbContext();

// EF AddRange: tracks each entity individually — slow for large batches
var entities = Enumerable.Range(1, 10_000)
    .Select(i => new Blog { Title = \`Blog \${i}\` })
    .ToList();
db.Blogs.AddRange(entities);
await db.SaveChangesAsync();   // 10,000 individual INSERTs (or batched but tracked)

// Better: EFCore.BulkExtensions (or ExecuteInsertAsync EF 7)
// await db.BulkInsertAsync(entities);   // single BULK INSERT — 10-100× faster

// EF 7+: ExecuteInsertAsync (no tracking, no loading)
// await db.Blogs.ExecuteInsertAsync(...);`,
    explanation:
      "EF AddRange() tracks every entity in the change tracker before inserting — for tens of thousands of rows this becomes slow; EFCore.BulkExtensions or EF 7's ExecuteInsertAsync use bulk operations that skip tracking and run orders of magnitude faster.",
  },
  // ── types ─────────────────────────────────────────────────────────────────
  {
    id: "cs-ef-keytype",
    language: "csharp",
    title: "[Key] attribute and composite key configuration",
    tag: "types",
    code: `using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;

// Simple key — convention (Id or BlogId) works without attribute
public class Blog { public int Id { get; set; } }

// Non-conventional name — needs [Key]
public class Item { [Key] public int ItemPk { get; set; } }

// Composite key — must use Fluent API (no attribute for composite)
public class OrderLine { public int OrderId { get; set; }; public int ProductId { get; set; } }

// In OnModelCreating:
// modelBuilder.Entity<OrderLine>()
//     .HasKey(ol => new { ol.OrderId, ol.ProductId });`,
    explanation:
      "By convention EF Core recognises Id or TypeNameId as the primary key — use [Key] for differently-named single keys, and HasKey() in OnModelCreating for composite keys which can't be expressed with an attribute alone.",
  },
  {
    id: "cs-ef-owned-entity",
    language: "csharp",
    title: "Owned entity type — no identity, embedded in owner row",
    tag: "types",
    code: `public class Money
{
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "USD";
}

public class Order
{
    public int Id { get; set; }
    public Money Total { get; set; } = new();
}

// In OnModelCreating:
// modelBuilder.Entity<Order>().OwnsOne(o => o.Total);
// Table: Orders(Id, Total_Amount, Total_Currency)

using var db = new AppDbContext();
var order = await db.Set<Order>().FirstAsync();
Console.WriteLine(\`\${order.Total.Amount} \${order.Total.Currency}\`);`,
    explanation:
      "An owned entity has no DbSet or primary key of its own — EF maps its properties as columns in the owner's table with a prefix, making it the ideal representation for value objects like Money or Address.",
  },
  {
    id: "cs-ef-complex-type",
    language: "csharp",
    title: "Complex type (EF 8) — value object with no separate table",
    tag: "types",
    code: `using Microsoft.EntityFrameworkCore;

[ComplexType]
public class Dimensions
{
    public double Width  { get; set; }
    public double Height { get; set; }
    public double Depth  { get; set; }
}

public class Product
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public Dimensions Size { get; set; } = new();
}

// No OwnsOne() required in EF 8 — [ComplexType] is enough
// Table: Products(Id, Name, Size_Width, Size_Height, Size_Depth)`,
    explanation:
      "EF 8's [ComplexType] attribute is a simpler alternative to OwnsOne() for value objects — mark the class and EF automatically maps its properties inline into the owner table without any OnModelCreating configuration.",
  },
  {
    id: "cs-ef-table-type",
    language: "csharp",
    title: "Table-per-hierarchy (TPH) vs table-per-type (TPT) inheritance",
    tag: "types",
    code: `// TPH (default): all types in one table with a discriminator column
public abstract class Animal { public int Id { get; set; } }
public class Dog : Animal { public string Breed { get; set; } = ""; }
public class Cat : Animal { public bool Indoor { get; set; } }
// Table: Animals(Id, Discriminator, Breed, Indoor)

// TPT: each type has its own table
// In OnModelCreating:
// modelBuilder.Entity<Dog>().ToTable("Dogs");
// modelBuilder.Entity<Cat>().ToTable("Cats");
// Tables: Animals(Id), Dogs(Id,Breed), Cats(Id,Indoor)`,
    explanation:
      "TPH (default) stores all derived types in one table with nullable columns — fast for queries but sparse; TPT stores each type in its own table, keeping tables clean but requiring JOINs for polymorphic queries.",
  },
  {
    id: "cs-ef-view-type",
    language: "csharp",
    title: "ToView() — mapping a keyless entity to a database view",
    tag: "types",
    code: `// The POCO — no primary key for read-only views
public class BlogSummaryView
{
    public string Title    { get; set; } = "";
    public int    PostCount { get; set; }
}

// In OnModelCreating:
// modelBuilder.Entity<BlogSummaryView>(b =>
// {
//     b.HasNoKey();
//     b.ToView("vw_BlogSummaries");   // maps to database view
// });

using var db = new AppDbContext();
var summaries = await db.Set<BlogSummaryView>().ToListAsync();
// SQL: SELECT Title, PostCount FROM vw_BlogSummaries`,
    explanation:
      "ToView() maps a keyless entity to a database view — EF Core will never try to insert, update, or delete through it, making it safe for reporting entities that represent complex server-side aggregations.",
  },
  {
    id: "cs-ef-sproc-type",
    language: "csharp",
    title: "Stored procedure mapping with FromSqlRaw",
    tag: "types",
    code: `using var db = new AppDbContext();

// Exec stored proc returning rows mapped to an entity
var blogs = await db.Blogs
    .FromSqlRaw("EXEC usp_GetActiveBlogsForUser @UserId = {0}", 42)
    .ToListAsync();

// Exec proc with no result set (returns affected row count)
int affected = await db.Database.ExecuteSqlRawAsync(
    "EXEC usp_ArchiveOldPosts @DaysOld = {0}",
    90
);
Console.WriteLine(\`archived \${affected} posts\`);`,
    explanation:
      "FromSqlRaw() lets EF Core compose with a stored procedure result — you can still append LINQ operators after it (like Include) as long as the proc returns a compatible result set; ExecuteSqlRawAsync is for fire-and-forget procs.",
  },
  {
    id: "cs-dapper-dynamic-params",
    language: "csharp",
    title: "Dapper DynamicParameters — DbType and direction",
    tag: "types",
    code: `using Dapper;
using System.Data;
using Microsoft.Data.SqlClient;

await using var conn = new SqlConnection("...");
var dp = new DynamicParameters();
dp.Add("@UserId",    42,    DbType.Int32,  ParameterDirection.Input);
dp.Add("@UserName",  null,  DbType.String, ParameterDirection.Output, size: 100);

await conn.ExecuteAsync("usp_GetUserName", dp, commandType: CommandType.StoredProcedure);

string? name = dp.Get<string>("@UserName");
Console.WriteLine(name);   // Alice`,
    explanation:
      "DynamicParameters.Add() gives you full control over DbType, direction (Input/Output/InputOutput), and size — essential for calling stored procedures that return output parameters.",
  },
  {
    id: "cs-dapper-grid-reader",
    language: "csharp",
    title: "Dapper GridReader — ReadAsync<T> per result set",
    tag: "types",
    code: `using Dapper;
using Microsoft.Data.Sqlite;

await using var conn = new SqliteConnection("Data Source=app.db");
await using var grid = await conn.QueryMultipleAsync(@"
    SELECT Id, Title FROM Blogs LIMIT 5;
    SELECT Id, Body  FROM Posts  LIMIT 10;
");

var blogs = await grid.ReadAsync<Blog>();
var posts = await grid.ReadAsync<Post>();

Console.WriteLine(blogs.Count());   // ≤5
Console.WriteLine(posts.Count());   // ≤10`,
    explanation:
      "GridReader.ReadAsync<T>() advances through each result set in order — you must read them in the same order as the SQL statements; ReadFirstOrDefaultAsync<T>() is available for single-row result sets.",
  },
  {
    id: "cs-sqltype-mapping",
    language: "csharp",
    title: "SQL to C# type mapping — common conversions",
    tag: "types",
    code: `// Common SQL Server → C# mappings (EF Core defaults):
// NVARCHAR(n)   → string
// INT           → int
// BIGINT        → long
// BIT           → bool
// DECIMAL(p,s)  → decimal
// DATETIME2     → DateTime
// DATETIMEOFFSET→ DateTimeOffset
// UNIQUEIDENTIFIER → Guid
// VARBINARY(MAX)→ byte[]
// FLOAT         → double
// REAL          → float

// Override with HasColumnType in Fluent API:
// modelBuilder.Entity<Product>()
//     .Property(p => p.Price)
//     .HasColumnType("decimal(18,4)");`,
    explanation:
      "EF Core maps C# types to provider-specific SQL types by convention — knowing the defaults helps you spot mismatches (e.g. DateTime vs DateTimeOffset, float vs decimal) before they cause silent precision loss.",
  },
  {
    id: "cs-json-column-type",
    language: "csharp",
    title: "JSON column storage with EF 8 OwnsOne().ToJson()",
    tag: "types",
    code: `public class ContactInfo
{
    public string Email { get; set; } = "";
    public string Phone { get; set; } = "";
}

public class Customer
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public ContactInfo Contact { get; set; } = new();
}

// In OnModelCreating (EF 8+):
// modelBuilder.Entity<Customer>()
//     .OwnsOne(c => c.Contact, b => b.ToJson());
// Stored as: Contact JSON column → {"Email":"...","Phone":"..."}

// Can query into the JSON:
// db.Customers.Where(c => c.Contact.Email == "a@b.com")`,
    explanation:
      "EF 8's ToJson() stores an owned entity as a JSON document in a single database column — great for semi-structured data where you want type-safe C# access without the complexity of a separate table or manual serialization.",
  },
  {
    id: "cs-spatial-type",
    language: "csharp",
    title: "EF with NetTopologySuite — spatial types",
    tag: "types",
    code: `using NetTopologySuite.Geometries;
using Microsoft.EntityFrameworkCore;

public class Store
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public Point Location { get; set; } = null!;   // geometry column
}

// Setup: opts.UseNpgsql("...", o => o.UseNetTopologySuite());

using var db = new AppDbContext();
var origin = new Point(-73.985130, 40.758896) { SRID = 4326 };

// Find stores within 1 km
var nearby = await db.Set<Store>()
    .Where(s => s.Location.Distance(origin) < 1000)
    .OrderBy(s => s.Location.Distance(origin))
    .ToListAsync();`,
    explanation:
      "NetTopologySuite integrates with EF Core to provide first-class spatial types (Point, Polygon, LineString) — Distance(), Contains(), and other geometry operations are translated to provider-native SQL spatial functions.",
  },
  {
    id: "cs-temporal-table",
    language: "csharp",
    title: "EF 6+ temporal table — TemporalAll() / TemporalAsOf()",
    tag: "types",
    code: `using Microsoft.EntityFrameworkCore;

// In OnModelCreating (SQL Server):
// modelBuilder.Entity<Blog>().ToTable(b => b.IsTemporal());

using var db = new AppDbContext();

// Query the full history of all rows:
var history = await db.Blogs
    .TemporalAll()
    .Select(b => new { b.Id, b.Title, EF.Property<DateTime>(b, "PeriodStart") })
    .OrderBy(b => b.Id)
    .ToListAsync();

// Point-in-time snapshot:
var asOf = await db.Blogs
    .TemporalAsOf(new DateTime(2025, 1, 1))
    .ToListAsync();`,
    explanation:
      "EF Core 6+ supports SQL Server temporal tables natively — TemporalAll() queries the full change history across all periods, and TemporalAsOf() reconstructs the table state at any past point in time without custom audit logic.",
  },
  {
    id: "cs-ef-enum-conversion",
    language: "csharp",
    title: "Store enum as string — HasConversion<string>()",
    tag: "types",
    code: `public enum OrderStatus { Pending, Confirmed, Shipped, Delivered, Cancelled }

public class Order
{
    public int Id { get; set; }
    public OrderStatus Status { get; set; }
}

// In OnModelCreating:
modelBuilder.Entity<Order>()
    .Property(o => o.Status)
    .HasConversion<string>()        // "Pending", "Confirmed", ...
    .HasMaxLength(20);

// Still queries naturally:
// db.Orders.Where(o => o.Status == OrderStatus.Shipped)
// SQL: WHERE Status = 'Shipped'`,
    explanation:
      "HasConversion<string>() stores enum values as their names rather than integer indices — the database is self-documenting, reordering enum values doesn't corrupt existing data, and filtering in raw SQL is intuitive.",
  },
  {
    id: "cs-ef-value-object-type",
    language: "csharp",
    title: "Value object mapping with OwnsOne (no navigation property)",
    tag: "types",
    code: `// Value object — no identity, compared by value
public record EmailAddress(string Value)
{
    public static EmailAddress From(string v) => new(v.ToLowerInvariant().Trim());
}

public class AppUser
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public EmailAddress Email { get; set; } = null!;
}

// In OnModelCreating:
// modelBuilder.Entity<AppUser>().OwnsOne(u => u.Email, b =>
// {
//     b.Property(e => e.Value).HasColumnName("Email").HasMaxLength(200);
// });
// Table: AppUsers(Id, Name, Email)`,
    explanation:
      "OwnsOne with a custom column name mapping keeps the value object canonical in C# while storing it as a plain column in SQL — no extra table, no join, and the domain model remains clean without EF-specific attributes on the record.",
  },
  // ── families ──────────────────────────────────────────────────────────────
  {
    id: "cs-ef-vs-dapper",
    language: "csharp",
    title: "EF Core vs Dapper — full ORM vs micro-ORM",
    tag: "families",
    code: `// EF Core — migrations, change tracking, LINQ, relationships
using var db = new AppDbContext();
var blogs = await db.Blogs.Include(b => b.Posts).ToListAsync();
db.Blogs.Add(new Blog { Title = "New" });
await db.SaveChangesAsync();   // automatic INSERT

// Dapper — raw SQL, manual mapping, zero magic
using var conn = new SqliteConnection("Data Source=app.db");
var blogs2 = await conn.QueryAsync<Blog>("SELECT * FROM Blogs");
await conn.ExecuteAsync(
    "INSERT INTO Blogs (Title) VALUES (@Title)",
    new { Title = "New" });`,
    explanation:
      "EF Core gives you migrations, LINQ, change tracking, and lazy/eager loading at the cost of abstraction overhead; Dapper gives you raw SQL performance and full control at the cost of writing SQL and managing schema manually — choose based on team skill and performance requirements.",
  },
  {
    id: "cs-ef-micro-vs-macro",
    language: "csharp",
    title: "EF (developer productivity) vs Dapper (performance control)",
    tag: "families",
    code: `// EF Core strength: complex domain models, migrations, relationships
// Use when: domain is rich, schema changes often, team prefers LINQ

// Dapper strength: high-throughput read paths, stored procs, raw SQL control
// Use when: performance is critical, queries are complex, DBA writes SQL

// Hybrid approach — EF for writes, Dapper for reads (CQRS):
// Write: db.Orders.Add(order); await db.SaveChangesAsync();
// Read:  var dtos = await conn.QueryAsync<OrderDto>("SELECT ... FROM Orders JOIN ...");`,
    explanation:
      "EF Core and Dapper aren't mutually exclusive — many teams use EF for transactional writes (where change tracking and migrations shine) and Dapper for complex reporting reads (where hand-tuned SQL outperforms LINQ translation).",
  },
  {
    id: "cs-cqrs-vs-crud",
    language: "csharp",
    title: "CQRS vs CRUD — separate vs unified model",
    tag: "families",
    code: `// CRUD — one model for reads and writes
public class BlogService
{
    public Task<List<Blog>> GetAllAsync() => _db.Blogs.ToListAsync();
    public Task UpdateAsync(Blog blog) { _db.Update(blog); return _db.SaveChangesAsync(); }
}

// CQRS — separate read model (fast, denormalized) and write model (domain-rich)
public class BlogQueryService
{
    public Task<List<BlogDto>> GetAllAsync() =>
        _db.Blogs.AsNoTracking().Select(b => new BlogDto(b.Id, b.Title)).ToListAsync();
}

public class BlogCommandService
{
    public async Task UpdateTitleAsync(int id, string title)
    {
        var b = await _db.Blogs.FindAsync(id);
        b!.Title = title;
        await _db.SaveChangesAsync();
    }
}`,
    explanation:
      "CRUD is simpler and sufficient for most apps — use one model that handles both queries and commands; CQRS adds complexity but pays off when reads and writes have very different performance or scaling requirements.",
  },
  {
    id: "cs-event-sourcing-vs-crud",
    language: "csharp",
    title: "Event sourcing vs CRUD — full history vs current state",
    tag: "families",
    code: `// CRUD — stores current state only
// UPDATE Orders SET Status='Shipped' WHERE Id=1   ← history lost

// Event sourcing — appends immutable events; state rebuilt by replay
public record OrderPlaced(int OrderId, decimal Total, DateTime At);
public record OrderShipped(int OrderId, string Carrier, DateTime At);

// Events stored in event store (e.g. EventStoreDB or SQL table)
// Current state = replay all events for OrderId=1:
//   OrderPlaced  → status=Pending
//   OrderShipped → status=Shipped

// Benefits: full audit trail, temporal queries, event-driven projections
// Cost: higher complexity, eventual consistency between write/read sides`,
    explanation:
      "CRUD overwrites state and loses history; event sourcing persists every state change as an immutable event, enabling full audit trails and time-travel queries — adopt it when history, compliance, or event-driven projections justify the added complexity.",
  },
  {
    id: "cs-nosql-vs-sql",
    language: "csharp",
    title: "NoSQL vs SQL — flexible schema vs ACID and joins",
    tag: "families",
    code: `// SQL (EF Core + SQL Server) — ACID, foreign keys, strong schema
// Good for: financial data, relational data, complex queries with joins
var orders = await db.Orders
    .Include(o => o.Lines)
    .Where(o => o.Total > 100)
    .ToListAsync();

// NoSQL (Cosmos DB SDK) — flexible schema, horizontal scale, JSON docs
// Good for: catalogs, user profiles, high write throughput
// var item = await container.ReadItemAsync<Product>(id, new PartitionKey(category));

// Choose SQL when: consistency and joins matter
// Choose NoSQL when: schema evolves rapidly or global scale is required`,
    explanation:
      "SQL databases enforce referential integrity and ACID transactions but scale vertically and require predefined schemas; NoSQL stores flexible JSON documents and scales horizontally but trades ACID guarantees for availability and partition tolerance.",
  },
  {
    id: "cs-cache-aside-vs-read",
    language: "csharp",
    title: "Cache-aside vs read-through — who fills the cache",
    tag: "families",
    code: `// Cache-aside: application manages cache (most common in .NET)
public async Task<Blog?> GetBlogAsync(int id)
{
    if (_cache.TryGetValue(\`blog:\${id}\`, out Blog? cached))
        return cached;                          // cache hit
    var blog = await _db.Blogs.FindAsync(id);   // cache miss → DB
    if (blog is not null)
        _cache.Set(\`blog:\${id}\`, blog, TimeSpan.FromMinutes(5));
    return blog;
}

// Read-through: cache layer fetches from DB on miss (e.g. NCache, Hazelcast)
// Application always talks to cache; cache calls DB transparently on miss`,
    explanation:
      "Cache-aside puts the caching logic in your application — you control exactly when to populate and invalidate the cache; read-through abstracts this behind the cache client, which is simpler to code but requires a cache provider that supports it.",
  },
  {
    id: "cs-repository-vs-dbcontext",
    language: "csharp",
    title: "Repository abstraction vs DbContext directly",
    tag: "families",
    code: `// Using DbContext directly in a service — simple, pragmatic
public class BlogService
{
    private readonly AppDbContext _db;
    public BlogService(AppDbContext db) => _db = db;

    public Task<List<Blog>> GetAllAsync() => _db.Blogs.ToListAsync();
}

// Using a repository — adds testability, hides EF
public class BlogService2
{
    private readonly IRepository<Blog> _repo;
    public BlogService2(IRepository<Blog> repo) => _repo = repo;

    public Task<List<Blog>> GetAllAsync() => _repo.ListAsync();
    // Can be tested with a fake IRepository without a real DB
}`,
    explanation:
      "Using DbContext directly is simpler and leverages EF's built-in unit-of-work; a repository interface adds an indirection layer that makes unit testing without a database straightforward — choose based on how important isolation testing is to your team.",
  },
  {
    id: "cs-unit-of-work-vs-ef",
    language: "csharp",
    title: "Explicit IUnitOfWork vs EF implicit unit of work",
    tag: "families",
    code: `// EF Core is already a unit of work — DbContext batches changes
using var db = new AppDbContext();
db.Blogs.Add(new Blog { Title = "A" });
db.Posts.Add(new Post { BlogId = 1, Body = "B" });
await db.SaveChangesAsync();   // both in one transaction — no explicit UoW needed

// Explicit IUnitOfWork wraps DbContext for testability:
public interface IUnitOfWork { Task<int> CommitAsync(); }
// Useful when you want to inject and mock the commit step in unit tests`,
    explanation:
      "DbContext is already an implicit unit of work — SaveChangesAsync() commits all pending changes atomically; an explicit IUnitOfWork wrapper is only needed if you want to mock the commit boundary in unit tests or compose multiple repositories under one interface.",
  },
  {
    id: "cs-migration-vs-schema",
    language: "csharp",
    title: "EF migrations vs Flyway/Liquibase — code vs SQL versioning",
    tag: "families",
    code: `// EF Migrations — generated C# that EF applies via dotnet ef database update
// Pros: schema and model stay in sync, rollback via Down()
// Cons: migration files can diverge from manual DB changes

// Flyway/Liquibase — plain SQL or XML versioned migration scripts
// V1__create_blogs.sql:  CREATE TABLE Blogs (Id INT PK, Title NVARCHAR(200));
// V2__add_slug.sql:      ALTER TABLE Blogs ADD COLUMN Slug NVARCHAR(200);

// When to use Flyway/Liquibase:
// - DBA team writes raw SQL
// - Need fine-grained control over SQL (partitioning, indexes)
// - Mixing EF and non-EF tables in one schema`,
    explanation:
      "EF migrations are convenient when your team owns the schema through the ORM model; Flyway/Liquibase give DBAs or migration-heavy teams fine-grained SQL control with version-controlled scripts — both track applied migrations in a history table.",
  },
  {
    id: "cs-seeding-vs-migration",
    language: "csharp",
    title: "HasData() vs seed service — built-in vs conditional seeding",
    tag: "families",
    code: `// HasData() — seed baked into migration, hard-coded primary keys
// modelBuilder.Entity<Role>().HasData(new Role { Id = 1, Name = "Admin" });
// Generates a migration; IDs must be stable forever.

// Seed service — runs conditionally at startup, flexible
public static class DbSeeder
{
    public static async Task SeedAsync(AppDbContext db)
    {
        if (!await db.Roles.AnyAsync())
        {
            db.Roles.AddRange(new Role { Name = "Admin" }, new Role { Name = "User" });
            await db.SaveChangesAsync();
        }
    }
}
// Called in Program.cs: await DbSeeder.SeedAsync(db);`,
    explanation:
      "HasData() is simple for static reference data with stable IDs; a seed service is more flexible for production data that might vary per environment, change structure over time, or depend on runtime logic.",
  },
  {
    id: "cs-lazy-vs-eager-ef",
    language: "csharp",
    title: "Lazy vs eager loading — convenience vs control",
    tag: "families",
    code: `// Lazy loading — convenient; navigation loaded on first touch
// Requires: virtual properties + UseLazyLoadingProxies()
var blog = await db.Blogs.FirstAsync();
int count = blog.Posts.Count;   // SELECT * FROM Posts WHERE BlogId=? (here!)

// Eager loading — explicit; loaded in the initial query
var blog2 = await db.Blogs
    .Include(b => b.Posts)
    .FirstAsync();
int count2 = blog2.Posts.Count;  // already loaded — no extra query

// Rule of thumb: use eager loading by default; lazy only when you
// genuinely need conditional, rare access to navigations`,
    explanation:
      "Lazy loading is convenient because you never forget to load navigations, but it silently generates extra queries inside loops (N+1); eager loading is more verbose but transparent and performs better — prefer Include() and add lazy loading as an opt-in when the N+1 risk is managed.",
  },
  {
    id: "cs-tracking-vs-notracking",
    language: "csharp",
    title: "Tracking vs no-tracking — for updates vs for reads",
    tag: "families",
    code: `using var db = new AppDbContext();

// Tracking (default) — use when you'll modify and save
var blog = await db.Blogs.FirstAsync(b => b.Id == 1);
blog.Title = "Updated";
await db.SaveChangesAsync();   // EF detects the change automatically

// No-tracking — use for read-only data (faster, less memory)
var readOnly = await db.Blogs
    .AsNoTracking()
    .Where(b => b.Title.StartsWith("A"))
    .ToListAsync();
// Typical speed gain: 10-30% on wide tables with many rows`,
    explanation:
      "Tracked entities let EF auto-detect changes for free but carry memory overhead from snapshots; no-tracking queries skip the snapshot and are noticeably faster for read-heavy operations — always use AsNoTracking() in read paths.",
  },
  {
    id: "cs-sync-vs-async-ef",
    language: "csharp",
    title: "Async EF methods vs sync — always async in web apps",
    tag: "families",
    code: `using var db = new AppDbContext();

// SYNC — blocks the thread; starves the thread pool under load
var blogs = db.Blogs.ToList();                         // don't do this in web
var blog  = db.Blogs.FirstOrDefault(b => b.Id == 1);

// ASYNC — releases the thread while the DB is working
var blogs2 = await db.Blogs.ToListAsync();
var blog2  = await db.Blogs.FirstOrDefaultAsync(b => b.Id == 1);

// Under high concurrency, sync methods exhaust ASP.NET Core's thread pool;
// async methods use one fewer thread per request while waiting for the DB`,
    explanation:
      "In ASP.NET Core every blocked thread is one fewer request that can be handled concurrently — always use the Async EF methods (ToListAsync, SaveChangesAsync, etc.) so the thread is returned to the pool while waiting for database I/O.",
  },
  {
    id: "cs-bulk-ef-alternatives",
    language: "csharp",
    title: "Bulk operations — EFCore.BulkExtensions vs SqlBulkCopy",
    tag: "families",
    code: `// EFCore.BulkExtensions — LINQ-style, supports EF models
// await db.BulkInsertAsync(entities);         // fast INSERT
// await db.BulkUpdateAsync(entities);         // fast UPDATE
// await db.BulkDeleteAsync(entities);         // fast DELETE
// await db.BulkInsertOrUpdateAsync(entities); // UPSERT

// SqlBulkCopy — ADO.NET, fastest for INSERT-only from DataTable/IDataReader
using var bcp = new SqlBulkCopy(connectionString);
bcp.DestinationTableName = "Blogs";
// await bcp.WriteToServerAsync(dataTable);

// EF 7 ExecuteDeleteAsync / ExecuteUpdateAsync — no entity loading needed
// await db.Blogs.Where(b => b.IsDeleted).ExecuteDeleteAsync();`,
    explanation:
      "EFCore.BulkExtensions wraps provider-specific bulk APIs and supports all CRUD operations on EF entities; SqlBulkCopy is the lowest-level option and fastest for pure inserts; EF 7's ExecuteDeleteAsync/ExecuteUpdateAsync are great for set-based operations without loading entities.",
  },
  // ── classes ───────────────────────────────────────────────────────────────
  {
    id: "cs-ef-dbcontext-class",
    language: "csharp",
    title: "DbContext subclass — OnModelCreating and OnConfiguring",
    tag: "classes",
    code: `using Microsoft.EntityFrameworkCore;

public class AppDbContext : DbContext
{
    public DbSet<Blog> Blogs { get; set; }
    public DbSet<Post> Posts { get; set; }

    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options) { }

    protected override void OnModelCreating(ModelBuilder mb)
    {
        mb.Entity<Blog>().HasQueryFilter(b => !b.IsDeleted);
        mb.Entity<Post>().HasIndex(p => p.BlogId);
    }

    protected override void OnConfiguring(DbContextOptionsBuilder opts)
    {
        if (!opts.IsConfigured)
            opts.UseSqlite("Data Source=fallback.db");
    }
}`,
    explanation:
      "The DbContext constructor accepting DbContextOptions is the DI-friendly pattern; OnModelCreating is the place for fluent configuration that doesn't fit on the entity class, and OnConfiguring provides a fallback when no options are injected.",
  },
  {
    id: "cs-ef-entity-config",
    language: "csharp",
    title: "IEntityTypeConfiguration<T> — entity config in its own class",
    tag: "classes",
    code: `using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

public class BlogConfiguration : IEntityTypeConfiguration<Blog>
{
    public void Configure(EntityTypeBuilder<Blog> builder)
    {
        builder.ToTable("Blogs");
        builder.HasKey(b => b.Id);
        builder.Property(b => b.Title).HasMaxLength(200).IsRequired();
        builder.HasMany(b => b.Posts)
               .WithOne()
               .HasForeignKey(p => p.BlogId)
               .OnDelete(DeleteBehavior.Cascade);
    }
}

// Register in OnModelCreating:
// modelBuilder.ApplyConfiguration(new BlogConfiguration());
// or: modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);`,
    explanation:
      "IEntityTypeConfiguration<T> moves entity fluent configuration into its own class, keeping OnModelCreating clean and making it easy to find and modify configuration for a specific entity as the model grows.",
  },
  {
    id: "cs-ef-fluent-config",
    language: "csharp",
    title: "Fluent API — HasOne / WithMany / HasForeignKey",
    tag: "classes",
    code: `using Microsoft.EntityFrameworkCore;

// In OnModelCreating:
modelBuilder.Entity<Post>(b =>
{
    b.ToTable("Posts");
    b.Property(p => p.Body).HasMaxLength(4000).IsRequired();

    b.HasOne<Blog>()              // one Blog...
     .WithMany(blog => blog.Posts) // ...has many Posts
     .HasForeignKey(p => p.BlogId)
     .OnDelete(DeleteBehavior.Cascade);

    b.HasIndex(p => p.BlogId);    // add an index on the FK
});`,
    explanation:
      "The fluent API is more powerful than data annotations — HasOne/WithMany configures the relationship from either side, HasForeignKey names the FK property explicitly, and OnDelete controls cascade behaviour.",
  },
  {
    id: "cs-ef-model-builder",
    language: "csharp",
    title: "ModelBuilder extension methods — reusable configuration",
    tag: "classes",
    code: `using Microsoft.EntityFrameworkCore;

public static class ModelBuilderExtensions
{
    // Apply soft-delete filter to every entity that implements ISoftDelete
    public static ModelBuilder ApplySoftDeleteFilter(this ModelBuilder mb)
    {
        foreach (var mutableType in mb.Model.GetEntityTypes())
        {
            if (typeof(ISoftDelete).IsAssignableFrom(mutableType.ClrType))
            {
                var method = typeof(ModelBuilderExtensions)
                    .GetMethod(nameof(SetFilter))!
                    .MakeGenericMethod(mutableType.ClrType);
                method.Invoke(null, [mb]);
            }
        }
        return mb;
    }

    public static void SetFilter<T>(ModelBuilder mb) where T : class, ISoftDelete
        => mb.Entity<T>().HasQueryFilter(e => !e.IsDeleted);
}

public interface ISoftDelete { bool IsDeleted { get; } }`,
    explanation:
      "Extension methods on ModelBuilder let you apply cross-cutting configurations (soft-delete filters, audit columns, naming conventions) to all matching entity types in one place rather than repeating the code for each entity.",
  },
  {
    id: "cs-ef-migrations-class",
    language: "csharp",
    title: "Migration class — Up() and Down() methods",
    tag: "classes",
    code: `using Microsoft.EntityFrameworkCore.Migrations;

public partial class AddBlogSlug : Migration
{
    protected override void Up(MigrationBuilder mb)
    {
        mb.AddColumn<string>(
            name:      "Slug",
            table:     "Blogs",
            maxLength: 200,
            nullable:  false,
            defaultValue: "");

        mb.CreateIndex(
            name:    "IX_Blogs_Slug",
            table:   "Blogs",
            column:  "Slug",
            unique:  true);
    }

    protected override void Down(MigrationBuilder mb)
    {
        mb.DropIndex(name: "IX_Blogs_Slug", table: "Blogs");
        mb.DropColumn(name: "Slug", table: "Blogs");
    }
}`,
    explanation:
      "Each migration class has Up() (applies the change) and Down() (reverts it) — EF generates these automatically from model diffs but you can hand-edit them to add data migrations, seed data, or raw SQL that the scaffold can't express.",
  },
  {
    id: "cs-ef-seed-class",
    language: "csharp",
    title: "Static seed extension method on ModelBuilder",
    tag: "classes",
    code: `using Microsoft.EntityFrameworkCore;

public static class SeedData
{
    public static void Seed(this ModelBuilder mb)
    {
        mb.Entity<Blog>().HasData(
            new Blog { Id = 1, Title = "Getting Started",  IsDeleted = false },
            new Blog { Id = 2, Title = "Advanced Patterns", IsDeleted = false }
        );

        mb.Entity<Post>().HasData(
            new Post { Id = 1, BlogId = 1, Body = "Welcome!" },
            new Post { Id = 2, BlogId = 2, Body = "Deeper topics..." }
        );
    }
}

// In OnModelCreating:
// mb.Seed();`,
    explanation:
      "Extracting HasData() calls into a static extension method keeps OnModelCreating readable and groups seed data logically — the extension method is called once during model building and generates the seed migration automatically.",
  },
  {
    id: "cs-dapper-repo",
    language: "csharp",
    title: "Dapper repository — constructor takes IDbConnection",
    tag: "classes",
    code: `using Dapper;
using System.Data;

public interface IBlogRepository
{
    Task<IEnumerable<Blog>> GetAllAsync();
    Task<Blog?> GetByIdAsync(int id);
    Task<int> InsertAsync(Blog blog);
}

public class DapperBlogRepository : IBlogRepository
{
    private readonly IDbConnection _conn;
    public DapperBlogRepository(IDbConnection conn) => _conn = conn;

    public Task<IEnumerable<Blog>> GetAllAsync() =>
        _conn.QueryAsync<Blog>("SELECT Id, Title FROM Blogs");

    public Task<Blog?> GetByIdAsync(int id) =>
        _conn.QueryFirstOrDefaultAsync<Blog>(
            "SELECT * FROM Blogs WHERE Id = @Id", new { Id = id });

    public Task<int> InsertAsync(Blog blog) =>
        _conn.ExecuteAsync(
            "INSERT INTO Blogs (Title) VALUES (@Title)", blog);
}`,
    explanation:
      "Injecting IDbConnection (rather than a concrete type) makes the Dapper repository testable with a mock connection and provider-agnostic — register the connection as Scoped in DI so it's opened per-request.",
  },
  {
    id: "cs-cached-repo",
    language: "csharp",
    title: "Cached repository — decorator with IMemoryCache",
    tag: "classes",
    code: `using Microsoft.Extensions.Caching.Memory;

public class CachedBlogRepository : IBlogRepository
{
    private readonly IBlogRepository _inner;
    private readonly IMemoryCache    _cache;
    private static readonly TimeSpan Ttl = TimeSpan.FromMinutes(5);

    public CachedBlogRepository(IBlogRepository inner, IMemoryCache cache)
    {
        _inner = inner; _cache = cache;
    }

    public async Task<Blog?> GetByIdAsync(int id)
    {
        string key = \`blog:\${id}\`;
        if (_cache.TryGetValue(key, out Blog? hit))
            return hit;
        var blog = await _inner.GetByIdAsync(id);
        if (blog is not null)
            _cache.Set(key, blog, Ttl);
        return blog;
    }

    public Task<IEnumerable<Blog>> GetAllAsync() => _inner.GetAllAsync();
    public Task<int> InsertAsync(Blog blog) => _inner.InsertAsync(blog);
}`,
    explanation:
      "The decorator pattern wraps an existing repository with caching logic without modifying the original — register CachedBlogRepository as IBlogRepository in DI and inject the real repository into its constructor.",
  },
  {
    id: "cs-event-store",
    language: "csharp",
    title: "Event store — append events, replay to rebuild aggregate",
    tag: "classes",
    code: `using System.Text.Json;

public record DomainEvent(string Type, string Payload, DateTime OccurredAt);

public class EventStore
{
    private readonly List<DomainEvent> _events = [];   // use a DB table in prod

    public void Append(string type, object payload) =>
        _events.Add(new DomainEvent(type, JsonSerializer.Serialize(payload), DateTime.UtcNow));

    public IEnumerable<DomainEvent> LoadStream(string aggregateType) =>
        _events.Where(e => e.Type.StartsWith(aggregateType));
}

// Usage:
var store = new EventStore();
store.Append("Order.Placed",   new { OrderId = 1, Total = 99.99m });
store.Append("Order.Shipped",  new { OrderId = 1, Carrier = "FedEx" });
foreach (var e in store.LoadStream("Order"))
    Console.WriteLine(\`\${e.Type} at \${e.OccurredAt:HH:mm}\`);`,
    explanation:
      "An event store appends immutable events to a stream; to get the current state of an aggregate you replay its events in order — in production replace the in-memory list with an append-only database table or EventStoreDB.",
  },
  {
    id: "cs-projection-class",
    language: "csharp",
    title: "Projection — rebuild a read model from domain events",
    tag: "classes",
    code: `public record OrderPlaced(int OrderId, decimal Total);
public record OrderShipped(int OrderId, string Carrier);

public class OrderReadModel
{
    public int     OrderId { get; set; }
    public decimal Total   { get; set; }
    public string  Status  { get; set; } = "Unknown";
    public string? Carrier { get; set; }
}

public class OrderProjection
{
    private readonly Dictionary<int, OrderReadModel> _store = [];

    public void Apply(OrderPlaced e) =>
        _store[e.OrderId] = new OrderReadModel { OrderId = e.OrderId, Total = e.Total, Status = "Pending" };

    public void Apply(OrderShipped e)
    {
        if (_store.TryGetValue(e.OrderId, out var m))
        { m.Status = "Shipped"; m.Carrier = e.Carrier; }
    }

    public OrderReadModel? Get(int id) => _store.GetValueOrDefault(id);
}`,
    explanation:
      "A projection listens to events and updates a denormalized read model optimised for queries — each Apply() method handles one event type, and the read model is rebuilt by replaying events in sequence.",
  },
  {
    id: "cs-read-model-class",
    language: "csharp",
    title: "Read model — denormalized, query-optimized POCO",
    tag: "classes",
    code: `// Write model — normalized domain entity
public class Order
{
    public int Id { get; set; }
    public int CustomerId { get; set; }
    public List<OrderLine> Lines { get; set; } = [];
}

// Read model — flat DTO for a specific query, no joins needed
public class OrderSummaryDto
{
    public int     OrderId      { get; set; }
    public string  CustomerName { get; set; } = "";
    public int     LineCount    { get; set; }
    public decimal Total        { get; set; }
    public string  Status       { get; set; } = "";
}

// Query via Dapper or EF projection:
// SELECT o.Id, c.Name, COUNT(ol.Id), SUM(ol.Price), o.Status
// FROM Orders o JOIN Customers c ON ... JOIN OrderLines ol ON ...`,
    explanation:
      "A read model (or query DTO) is a flat, denormalized projection of data shaped for a specific screen or API response — it avoids N+1 joins at query time by pre-joining and pre-aggregating the data the UI actually needs.",
  },
  {
    id: "cs-outbox-pattern",
    language: "csharp",
    title: "Transactional outbox — save events in the same DB transaction",
    tag: "classes",
    code: `public class OutboxMessage
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string EventType { get; set; } = "";
    public string Payload   { get; set; } = "";
    public bool   Published { get; set; }
}

public class OrderService
{
    private readonly AppDbContext _db;
    public OrderService(AppDbContext db) => _db = db;

    public async Task PlaceOrderAsync(Order order)
    {
        _db.Orders.Add(order);
        // Outbox: persist event in SAME transaction as the order
        _db.OutboxMessages.Add(new OutboxMessage
        {
            EventType = "OrderPlaced",
            Payload   = System.Text.Json.JsonSerializer.Serialize(new { order.Id }),
        });
        await _db.SaveChangesAsync();   // atomic: both or neither
        // A background poller reads OutboxMessages and publishes to message bus
    }
}`,
    explanation:
      "The transactional outbox pattern stores domain events in the database within the same transaction as the state change — a background relay then publishes them to a message bus, guaranteeing at-least-once delivery without a distributed transaction.",
  },
  {
    id: "cs-saga-class",
    language: "csharp",
    title: "Saga — long-running process coordinated via events",
    tag: "classes",
    code: `public enum CheckoutState { Started, PaymentPending, Confirmed, Failed }

public class CheckoutSaga
{
    public Guid Id    { get; set; } = Guid.NewGuid();
    public CheckoutState State { get; set; } = CheckoutState.Started;
    public List<string> Log { get; set; } = [];

    public void Handle(string eventType)
    {
        (State, var action) = (State, eventType) switch
        {
            (CheckoutState.Started,         "PaymentInitiated") => (CheckoutState.PaymentPending, "await payment"),
            (CheckoutState.PaymentPending,  "PaymentSucceeded") => (CheckoutState.Confirmed,      "confirm order"),
            (CheckoutState.PaymentPending,  "PaymentFailed")    => (CheckoutState.Failed,         "notify customer"),
            _ => (State, "no-op"),
        };
        Log.Add(\`[\${State}] \${action}\`);
    }
}`,
    explanation:
      "A saga tracks the state of a long-running business process across multiple events and services — each event transitions the saga to a new state and may trigger compensating actions if a step fails.",
  },
  {
    id: "cs-compensating-txn",
    language: "csharp",
    title: "Compensating transaction — undo a step when a later step fails",
    tag: "classes",
    code: `public class OrderFulfillmentService
{
    public async Task FulfillAsync(int orderId)
    {
        bool inventoryReserved = false;
        bool paymentCharged    = false;
        try
        {
            await ReserveInventoryAsync(orderId);
            inventoryReserved = true;

            await ChargePaymentAsync(orderId);
            paymentCharged = true;

            await DispatchShipmentAsync(orderId);
        }
        catch
        {
            // Compensate in reverse order
            if (paymentCharged)    await RefundPaymentAsync(orderId);
            if (inventoryReserved) await ReleaseInventoryAsync(orderId);
            throw;
        }
    }

    private Task ReserveInventoryAsync(int id) => Task.CompletedTask;
    private Task ChargePaymentAsync(int id)    => Task.CompletedTask;
    private Task DispatchShipmentAsync(int id) => Task.CompletedTask;
    private Task RefundPaymentAsync(int id)    => Task.CompletedTask;
    private Task ReleaseInventoryAsync(int id) => Task.CompletedTask;
}`,
    explanation:
      "Compensating transactions undo already-committed steps in reverse order when a later step fails — used in distributed systems where a single ACID transaction spanning multiple services is impossible.",
  },
  {
    id: "cs-ef-interceptor-class",
    language: "csharp",
    title: "SaveChangesInterceptor — audit trail on every save",
    tag: "classes",
    code: `using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.EntityFrameworkCore;

public class AuditInterceptor : SaveChangesInterceptor
{
    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData data,
        InterceptionResult<int> result,
        CancellationToken ct = default)
    {
        var ctx = data.Context!;
        var now = DateTime.UtcNow;

        foreach (var entry in ctx.ChangeTracker.Entries())
        {
            if (entry.State == EntityState.Added)
                entry.Property("CreatedAt").CurrentValue = now;
            if (entry.State is EntityState.Added or EntityState.Modified)
                entry.Property("UpdatedAt").CurrentValue = now;
        }
        return base.SavingChangesAsync(data, result, ct);
    }
}

// Register: opts.AddInterceptors(new AuditInterceptor());`,
    explanation:
      "SaveChangesInterceptor lets you hook into every save operation — here we stamp CreatedAt/UpdatedAt shadow properties automatically before the SQL is generated, keeping audit logic in one place rather than scattered across services.",
  },
  {
    id: "cs-ef-extension-methods",
    language: "csharp",
    title: "IQueryable<T> extension methods — reusable query filters",
    tag: "classes",
    code: `using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;

public static class QueryExtensions
{
    public static IQueryable<T> Active<T>(this IQueryable<T> q)
        where T : class, ISoftDelete
        => q.Where(e => !e.IsDeleted);

    public static IQueryable<Blog> ByAuthor(
        this IQueryable<Blog> q, string author)
        => q.Where(b => b.Author == author);

    public static IQueryable<T> Page<T>(
        this IQueryable<T> q, int page, int size)
        => q.Skip((page - 1) * size).Take(size);
}

// Usage:
// var results = await db.Blogs
//     .Active()
//     .ByAuthor("alice")
//     .Page(1, 20)
//     .ToListAsync();`,
    explanation:
      "IQueryable<T> extension methods build reusable, composable query fragments that translate to SQL — they keep repository/service methods short and readable while keeping the actual query logic testable in one place.",
  },
];
