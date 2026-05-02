import type { Challenge } from "@/lib/types";

const m = (
  partial: Omit<Challenge, "lang" | "type" | "isBoss" | "starterCode" | "tags"> & Partial<Pick<Challenge, "tags" | "isBoss" | "starterCode">>
): Challenge => ({ type: "write_from_scratch", isBoss: false, starterCode: "", tags: ["csharp"], lang: "manual", ...partial });

export const csharpChallenges: Challenge[] = [
  m({ id: "cs-syntax-1", nodeId: "csharp:t1:syntax", title: "Nullable greeting", description: "Print a greeting using ?? to default a nullable name.", difficulty: 1,
    hints: [
      { tier: "nudge", text: "string? + ?? = default value when null.", xpPenalty: 0.9 },
      { tier: "guide", text: "Use $\"Hello, {name}!\".", xpPenalty: 0.75 },
      { tier: "reveal", text: `string? raw = null;
string name = raw ?? "Anonymous";
Console.WriteLine($"Hello, {name}!");`, xpPenalty: 0.5 },
    ], baseXP: 100 }),
  m({ id: "cs-flow-1", nodeId: "csharp:t1:control-flow", title: "Switch expression", description: "Map status code to label using a switch expression.", difficulty: 2, isBoss: true,
    hints: [
      { tier: "nudge", text: "code => switch { ... }", xpPenalty: 0.9 },
      { tier: "guide", text: "Default branch with _ =>.", xpPenalty: 0.75 },
      { tier: "reveal", text: `string Describe(int code) => code switch {
    200 => "OK",
    404 => "Not Found",
    >= 500 => "Server Error",
    _ => "Other",
};`, xpPenalty: 0.5 },
    ], baseXP: 150 }),
  m({ id: "cs-io-1", nodeId: "csharp:t1:console-io", title: "Read + parse + greet", description: "Read a name, then read an int age via TryParse, then print 'Hi, NAME — AGE'.", difficulty: 1,
    hints: [
      { tier: "nudge", text: "TryParse avoids exceptions.", xpPenalty: 0.9 },
      { tier: "guide", text: "if (int.TryParse(line, out int age)) { ... }", xpPenalty: 0.75 },
      { tier: "reveal", text: `Console.Write("name: ");
string? name = Console.ReadLine();
Console.Write("age: ");
if (int.TryParse(Console.ReadLine(), out int age)) {
    Console.WriteLine($"Hi, {name} — {age}");
}`, xpPenalty: 0.5 },
    ], baseXP: 130 }),
  m({ id: "cs-method-1", nodeId: "csharp:t1:methods", title: "TryDivide", description: "Implement bool TryDivide(int a, int b, out int q) — returns false on b=0.", difficulty: 2,
    hints: [
      { tier: "nudge", text: "out parameter must be assigned in every code path.", xpPenalty: 0.9 },
      { tier: "guide", text: "Set result = 0 in the failure branch.", xpPenalty: 0.75 },
      { tier: "reveal", text: `bool TryDivide(int a, int b, out int q) {
    if (b == 0) { q = 0; return false; }
    q = a / b;
    return true;
}`, xpPenalty: 0.5 },
    ], baseXP: 150 }),
  m({ id: "cs-class-1", nodeId: "csharp:t2:classes", title: "Init-only User", description: "Define User with required Name and int Age, both init-only.", difficulty: 2,
    hints: [
      { tier: "nudge", text: "{ get; init; } makes a property init-only.", xpPenalty: 0.9 },
      { tier: "guide", text: "required forces the caller to set it.", xpPenalty: 0.75 },
      { tier: "reveal", text: `class User {
    public required string Name { get; init; }
    public int Age { get; init; }
}
var u = new User { Name = "Ada", Age = 36 };`, xpPenalty: 0.5 },
    ], baseXP: 150 }),
  m({ id: "cs-iface-1", nodeId: "csharp:t2:interfaces", title: "IShape with Square", description: "Define IShape.Area() and a Square implementing it.", difficulty: 2,
    hints: [
      { tier: "nudge", text: "interface IShape { double Area(); }", xpPenalty: 0.9 },
      { tier: "guide", text: "class Square : IShape { ... }", xpPenalty: 0.75 },
      { tier: "reveal", text: `interface IShape { double Area(); }
class Square : IShape {
    public double Side { get; init; }
    public double Area() => Side * Side;
}`, xpPenalty: 0.5 },
    ], baseXP: 150 }),
  m({ id: "cs-gen-1", nodeId: "csharp:t2:generics", title: "Generic First<T>", description: "Implement T First<T>(List<T> list).", difficulty: 2, isBoss: true,
    hints: [
      { tier: "nudge", text: "<T> goes between method name and parameter list.", xpPenalty: 0.9 },
      { tier: "guide", text: "Return list[0].", xpPenalty: 0.75 },
      { tier: "reveal", text: `T First<T>(List<T> list) where T : notnull => list[0];`, xpPenalty: 0.5 },
    ], baseXP: 200 }),
  m({ id: "cs-exc-1", nodeId: "csharp:t2:exceptions", title: "Custom ConfigException", description: "Subclass Exception, throw and catch it.", difficulty: 2,
    hints: [
      { tier: "nudge", text: "Inherit from Exception, call base(msg).", xpPenalty: 0.9 },
      { tier: "guide", text: "catch by your custom type.", xpPenalty: 0.75 },
      { tier: "reveal", text: `class ConfigException : Exception {
    public ConfigException(string m) : base(m) {}
}
try { throw new ConfigException("missing port"); }
catch (ConfigException ex) { Console.WriteLine(ex.Message); }`, xpPenalty: 0.5 },
    ], baseXP: 150 }),
  m({ id: "cs-linq-1", nodeId: "csharp:t3:linq", title: "Where + Select", description: "From int[] {1..6}, get squares of evens as a List.", difficulty: 2,
    hints: [
      { tier: "nudge", text: "Where filters; Select projects.", xpPenalty: 0.9 },
      { tier: "guide", text: ".ToList() materializes.", xpPenalty: 0.75 },
      { tier: "reveal", text: `var nums = new[] {1, 2, 3, 4, 5, 6};
var evenSq = nums.Where(n => n % 2 == 0).Select(n => n * n).ToList();`, xpPenalty: 0.5 },
    ], baseXP: 150 }),
  m({ id: "cs-coll-1", nodeId: "csharp:t3:collections", title: "Dictionary TryGetValue", description: "Lookup a key with TryGetValue and print the result or 'missing'.", difficulty: 1,
    hints: [
      { tier: "nudge", text: "TryGetValue out = inline declaration.", xpPenalty: 0.9 },
      { tier: "guide", text: "if (dict.TryGetValue(k, out var v)) { ... }", xpPenalty: 0.75 },
      { tier: "reveal", text: `var prices = new Dictionary<string, decimal> { ["apple"] = 1.0m };
if (prices.TryGetValue("cherry", out var p))
    Console.WriteLine(p);
else
    Console.WriteLine("missing");`, xpPenalty: 0.5 },
    ], baseXP: 130 }),
  m({ id: "cs-del-1", nodeId: "csharp:t3:delegates", title: "Func<int,int> sq", description: "Define sq via a lambda and call it.", difficulty: 1,
    hints: [
      { tier: "nudge", text: "Func<TArg, TResult>.", xpPenalty: 0.9 },
      { tier: "guide", text: "Func<int, int> sq = x => x * x;", xpPenalty: 0.75 },
      { tier: "reveal", text: `Func<int, int> sq = x => x * x;
Console.WriteLine(sq(7));`, xpPenalty: 0.5 },
    ], baseXP: 100 }),
  m({ id: "cs-ext-1", nodeId: "csharp:t3:extension-methods", title: "IsNullOrBlank extension", description: "Add IsNullOrBlank() to string?.", difficulty: 2,
    hints: [
      { tier: "nudge", text: "static class + this string?.", xpPenalty: 0.9 },
      { tier: "guide", text: "Use string.IsNullOrWhiteSpace(s).", xpPenalty: 0.75 },
      { tier: "reveal", text: `static class StrExt {
    public static bool IsNullOrBlank(this string? s) =>
        string.IsNullOrWhiteSpace(s);
}`, xpPenalty: 0.5 },
    ], baseXP: 150 }),
  m({ id: "cs-async-1", nodeId: "csharp:t4:async", title: "WhenAll", description: "Run three Task.Delay(50) concurrently with WhenAll.", difficulty: 3, isBoss: true,
    hints: [
      { tier: "nudge", text: "Pass tasks to Task.WhenAll.", xpPenalty: 0.9 },
      { tier: "guide", text: "await it for parallel waits.", xpPenalty: 0.75 },
      { tier: "reveal", text: `await Task.WhenAll(
    Task.Delay(50),
    Task.Delay(50),
    Task.Delay(50));
Console.WriteLine("done");`, xpPenalty: 0.5 },
    ], baseXP: 220 }),
  m({ id: "cs-aspnet-1", nodeId: "csharp:t4:aspnet", title: "Hello minimal API", description: "Map GET / to return 'Hello World!'.", difficulty: 1,
    hints: [
      { tier: "nudge", text: "WebApplication.CreateBuilder.", xpPenalty: 0.9 },
      { tier: "guide", text: "app.MapGet(\"/\", () => \"Hello World!\");", xpPenalty: 0.75 },
      { tier: "reveal", text: `var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();
app.MapGet("/", () => "Hello World!");
app.Run();`, xpPenalty: 0.5 },
    ], baseXP: 130 }),
  m({ id: "cs-ef-1", nodeId: "csharp:t4:ef-core", title: "DbSet<User> + add", description: "Define User entity, AppDb with DbSet<User>, add and save.", difficulty: 2,
    hints: [
      { tier: "nudge", text: "DbSet<T> via Set<T>().", xpPenalty: 0.9 },
      { tier: "guide", text: "SaveChangesAsync after Add.", xpPenalty: 0.75 },
      { tier: "reveal", text: `class User { public int Id { get; set; } public string Name { get; set; } = ""; }
class AppDb : DbContext { public DbSet<User> Users => Set<User>(); }

using var db = new AppDb();
db.Users.Add(new User { Name = "Ada" });
await db.SaveChangesAsync();`, xpPenalty: 0.5 },
    ], baseXP: 200 }),
  m({ id: "cs-di-1", nodeId: "csharp:t4:di", title: "Inject IGreeter", description: "Register IGreeter -> Greeter as Singleton; inject into a route handler.", difficulty: 2,
    hints: [
      { tier: "nudge", text: "AddSingleton<IGreeter, Greeter>().", xpPenalty: 0.9 },
      { tier: "guide", text: "Take IGreeter as a handler parameter — DI wires it.", xpPenalty: 0.75 },
      { tier: "reveal", text: `interface IGreeter { string Hello(string n); }
class Greeter : IGreeter { public string Hello(string n) => $"hi {n}"; }

builder.Services.AddSingleton<IGreeter, Greeter>();
app.MapGet("/{name}", (string name, IGreeter g) => g.Hello(name));`, xpPenalty: 0.5 },
    ], baseXP: 180 }),
];
