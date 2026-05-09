import type { Snippet } from "./types";

export const csharpSnippets20260509P4: Snippet[] = [
  {
    id: "cs-snippet-null-conditional-chain",
    language: "csharp",
    title: "Null-conditional and null-coalescing operators",
    tag: "snippet",
    code: `string? name = null;

// ?. null-conditional: returns null instead of throwing
int? len = name?.Length;
Console.WriteLine(len);    // (blank)

// ?? null-coalescing: provides a fallback
string display = name ?? "Anonymous";
Console.WriteLine(display);   // Anonymous

// Chain them
string upper = name?.ToUpper() ?? "N/A";
Console.WriteLine(upper);   // N/A`,
    explanation: "The ?. operator short-circuits and returns null if the left side is null; ?? provides a fallback for null values. Chaining them produces readable null-safe navigation without nested if-null checks.",
  },
  {
    id: "cs-understanding-covariance-generic",
    language: "csharp",
    title: "IEnumerable<out T> is covariant: use base type freely",
    tag: "understanding",
    code: `class Animal { public string Name { get; init; } = ""; }
class Dog : Animal { }

List<Dog> dogs = new() { new Dog { Name = "Rex" }, new Dog { Name = "Fido" } };

// IEnumerable<Dog> -> IEnumerable<Animal> works (covariance)
IEnumerable<Animal> animals = dogs;
foreach (var a in animals)
    Console.WriteLine(a.Name);  // Rex, Fido

// List<Dog> -> List<Animal> would NOT compile (List is invariant)
// List<Animal> list = dogs;  // CS0029`,
    explanation: "IEnumerable<T> is declared as IEnumerable<out T>, making it covariant; you can assign IEnumerable<Derived> to IEnumerable<Base>. List<T> is invariant because it allows both reading and writing.",
  },
  {
    id: "cs-structures-span-parse",
    language: "csharp",
    title: "TryParse with ReadOnlySpan<char> avoids substring allocation",
    tag: "structures",
    code: `string line = "42,3.14,true";
var span = line.AsSpan();

int comma1 = span.IndexOf(',');
int comma2 = span[(comma1+1)..].IndexOf(',') + comma1 + 1;

int.TryParse(span[..comma1], out int intVal);
double.TryParse(span[(comma1+1)..comma2], out double dblVal);
bool.TryParse(span[(comma2+1)..], out bool boolVal);

Console.WriteLine($"{intVal} {dblVal} {boolVal}");  // 42 3.14 True`,
    explanation: "All numeric TryParse overloads accept ReadOnlySpan<char> alongside string; parsing from a span avoids allocating intermediate substring objects, which matters in hot paths like CSV or binary protocol parsing.",
  },
  {
    id: "cs-caveats-struct-boxing-interface",
    language: "csharp",
    title: "Calling an interface method on a struct boxes it",
    tag: "caveats",
    code: `interface IGreet { string Hello(); }

struct Greeter : IGreet
{
    public string Name;
    public string Hello() => $"Hello, {Name}";
}

var g = new Greeter { Name = "Alice" };

// Direct call: no boxing, uses constrained callvirt
Console.WriteLine(g.Hello());       // Hello, Alice

// Through interface: BOXES the struct (heap allocation)
IGreet greet = g;
Console.WriteLine(greet.Hello());   // Hello, Alice

// The boxed copy is separate from g`,
    explanation: "Assigning a struct to an interface variable boxes it onto the heap; the interface reference then points to the box. This is a hidden allocation and the boxed copy is independent of the original struct.",
  },
  {
    id: "cs-types-generic-where-notnull",
    language: "csharp",
    title: "where T : notnull constrains away nullability",
    tag: "types",
    code: `#nullable enable

class Cache<TKey, TValue>
    where TKey : notnull
{
    private readonly Dictionary<TKey, TValue?> _store = new();

    public void Set(TKey key, TValue value) => _store[key] = value;
    public TValue? Get(TKey key) => _store.GetValueOrDefault(key);
}

var cache = new Cache<string, int>();
cache.Set("x", 42);
Console.WriteLine(cache.Get("x"));   // 42
// cache.Set(null, 1);  // CS8714: null is not allowed for TKey`,
    explanation: "The notnull constraint (C# 8 with nullable enabled) prevents using a nullable type argument as TKey; it's essential for Dictionary keys and any generic type that requires a non-null value for correctness.",
  },
  {
    id: "cs-families-json-serializer",
    language: "csharp",
    title: "System.Text.Json vs Newtonsoft.Json",
    tag: "families",
    code: `using System.Text.Json;

record Person(string Name, int Age);

// System.Text.Json (built-in, .NET Core 3+, fast, AOT-friendly)
var json = JsonSerializer.Serialize(new Person("Alice", 30));
Console.WriteLine(json);   // {"Name":"Alice","Age":30}
var person = JsonSerializer.Deserialize<Person>(json);
Console.WriteLine(person);  // Person { Name = Alice, Age = 30 }

// Newtonsoft: more features, older ecosystem, slower
// string j2 = JsonConvert.SerializeObject(new Person("Alice", 30));`,
    explanation: "System.Text.Json is built-in and optimised for throughput and AOT; Newtonsoft.Json has richer features (polymorphism, complex converters) but requires a NuGet dependency. Prefer System.Text.Json for new projects.",
  },
  {
    id: "cs-classes-generic-singleton",
    language: "csharp",
    title: "Generic Singleton<T> using Lazy<T> for thread safety",
    tag: "classes",
    code: `class Singleton<T> where T : class, new()
{
    private static readonly Lazy<T> _instance =
        new Lazy<T>(() => new T(), isThreadSafe: true);

    public static T Instance => _instance.Value;
}

class AppConfig
{
    public string Env { get; set; } = "production";
}

var cfg = Singleton<AppConfig>.Instance;
Console.WriteLine(cfg.Env);   // production
Console.WriteLine(ReferenceEquals(cfg, Singleton<AppConfig>.Instance)); // True`,
    explanation: "Lazy<T> with isThreadSafe:true uses double-checked locking internally; combining it with a generic wrapper gives you thread-safe lazy initialisation for any type without writing locking code yourself.",
  },
];
