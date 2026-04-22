export interface CapstoneProject {
  id: string;
  title: string;
  description: string;
  branchId: "csharp";
  unlockNodeId: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  estimatedHours: number;
  baseXP: number;
  milestones: Milestone[];
  starterFiles: StarterFile[];
  tags: string[];
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  xpReward: number;
}

export interface StarterFile {
  path: string;
  content: string;
}

export const csharpRestApi: CapstoneProject = {
  id: "capstone:csharp:rest-api",
  title: "REST API with ASP.NET Core",
  description:
    "Build a fully functional REST API for a task management system using ASP.NET Core minimal APIs, Entity Framework Core with SQLite, and dependency injection. The API supports CRUD operations, filtering, pagination, and proper error handling.",
  branchId: "csharp",
  unlockNodeId: "csharp:t4:dependency-injection",
  difficulty: 4,
  estimatedHours: 6,
  baseXP: 2000,
  milestones: [
    {
      id: "cs-rest-m1",
      title: "Project Scaffold",
      description:
        "Create a new ASP.NET Core minimal API project with a health-check endpoint. Configure the project to use SQLite and add the EF Core NuGet packages.",
      xpReward: 250,
    },
    {
      id: "cs-rest-m2",
      title: "Data Model & EF Core",
      description:
        "Define TaskItem and Category entities with proper relationships. Create a DbContext, configure the model with Fluent API, and run the initial migration.",
      xpReward: 350,
    },
    {
      id: "cs-rest-m3",
      title: "CRUD Endpoints",
      description:
        "Implement GET (list + by-id), POST, PUT, and DELETE endpoints for TaskItems. Use DTOs to separate the API contract from the database model. Return appropriate status codes.",
      xpReward: 400,
    },
    {
      id: "cs-rest-m4",
      title: "Filtering & Pagination",
      description:
        "Add query parameters for filtering tasks by status and category. Implement cursor-based or offset pagination. Add sorting by due date and priority.",
      xpReward: 400,
    },
    {
      id: "cs-rest-m5",
      title: "Service Layer & DI",
      description:
        "Extract business logic into an ITaskService / TaskService. Register it with DI as scoped. Add input validation, global error handling middleware, and structured logging.",
      xpReward: 600,
    },
  ],
  starterFiles: [
    {
      path: "Program.cs",
      content: `// ASP.NET Core Minimal API — Task Management REST API
// Milestone 1: Set up the project scaffold

var builder = WebApplication.CreateBuilder(args);

// TODO (Milestone 2): Register DbContext with SQLite
// builder.Services.AddDbContext<AppDbContext>(options =>
//     options.UseSqlite("Data Source=tasks.db"));

// TODO (Milestone 5): Register services
// builder.Services.AddScoped<ITaskService, TaskService>();

var app = builder.Build();

// Health check
app.MapGet("/health", () => Results.Ok(new { status = "healthy", timestamp = DateTime.UtcNow }));

// TODO (Milestone 3): Add CRUD endpoints
// app.MapGet("/api/tasks", async (ITaskService service) => { ... });
// app.MapGet("/api/tasks/{id}", async (int id, ITaskService service) => { ... });
// app.MapPost("/api/tasks", async (CreateTaskDto dto, ITaskService service) => { ... });
// app.MapPut("/api/tasks/{id}", async (int id, UpdateTaskDto dto, ITaskService service) => { ... });
// app.MapDelete("/api/tasks/{id}", async (int id, ITaskService service) => { ... });

app.Run();
`,
    },
    {
      path: "Models/TaskItem.cs",
      content: `namespace TaskApi.Models;

// TODO (Milestone 2): Define the TaskItem entity
// Think about: Id, Title, Description, IsCompleted, Priority, DueDate, CategoryId

public class TaskItem
{
    public int Id { get; set; }
    public required string Title { get; set; }
    public string? Description { get; set; }
    public bool IsCompleted { get; set; }
    public int Priority { get; set; } = 0; // 0=Low, 1=Medium, 2=High
    public DateTime? DueDate { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // TODO: Add Category relationship
    // public int? CategoryId { get; set; }
    // public Category? Category { get; set; }
}
`,
    },
    {
      path: "Models/Category.cs",
      content: `namespace TaskApi.Models;

// TODO (Milestone 2): Define the Category entity

public class Category
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public string Color { get; set; } = "#6366f1";

    // Navigation property
    public List<TaskItem> Tasks { get; set; } = [];
}
`,
    },
    {
      path: "DTOs/TaskDtos.cs",
      content: `namespace TaskApi.DTOs;

// TODO (Milestone 3): Define DTOs for API requests/responses
// Keeping DTOs separate from entities is a best practice —
// it decouples your API contract from your database schema.

public record CreateTaskDto(
    string Title,
    string? Description = null,
    int Priority = 0,
    DateTime? DueDate = null,
    int? CategoryId = null
);

public record UpdateTaskDto(
    string? Title = null,
    string? Description = null,
    bool? IsCompleted = null,
    int? Priority = null,
    DateTime? DueDate = null,
    int? CategoryId = null
);

public record TaskResponseDto(
    int Id,
    string Title,
    string? Description,
    bool IsCompleted,
    int Priority,
    DateTime? DueDate,
    DateTime CreatedAt,
    string? CategoryName
);
`,
    },
  ],
  tags: [
    "ASP.NET Core",
    "minimal API",
    "Entity Framework Core",
    "SQLite",
    "REST",
    "dependency injection",
    "CRUD",
    "DTOs",
    "middleware",
  ],
};
