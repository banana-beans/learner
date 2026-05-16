import type { Snippet } from "./types";

export const csharpSnippets20260516B4: Snippet[] = [
  {
    id: "cs-b16-b4-reflection-getmethods",
    language: "csharp",
    title: "Reflection Type.GetMethods inspection",
    tag: "snippet",
    code: `using System;
using System.Reflection;

class Calculator {
    public int Add(int a, int b) => a + b;
    public double Multiply(double a, double b) => a * b;
    private void Reset() { }
}

var type = typeof(Calculator);
var methods = type.GetMethods(BindingFlags.Public | BindingFlags.Instance
                              | BindingFlags.DeclaredOnly);
foreach (var m in methods) {
    var parms = string.Join(", ", Array.ConvertAll(
        m.GetParameters(), p => \`\${p.ParameterType.Name} \${p.Name}\`));
    Console.WriteLine(\`\${m.ReturnType.Name} \${m.Name}(\${parms})\`);
}`,
    explanation: "`BindingFlags.DeclaredOnly` filters out inherited members like `ToString`; without it `GetMethods` also returns methods from `object`, which is rarely what you want when inspecting a specific type."
  },
  {
    id: "cs-b16-b4-propertyinfo-getset",
    language: "csharp",
    title: "PropertyInfo.GetValue and SetValue at runtime",
    tag: "snippet",
    code: `using System;
using System.Reflection;

class Person {
    public string Name { get; set; } = "";
    public int Age { get; set; }
}

var obj = new Person { Name = "Alice", Age = 30 };
var type = typeof(Person);

// Read all properties dynamically
foreach (var prop in type.GetProperties()) {
    Console.WriteLine(\`\${prop.Name} = \${prop.GetValue(obj)}\`);
}

// Write a property by name
var ageProp = type.GetProperty("Age")!;
ageProp.SetValue(obj, 31);
Console.WriteLine(\`Updated Age: \${obj.Age}\`);`,
    explanation: "`GetValue`/`SetValue` let you read and write any property by name at runtime — the backbone of ORMs, serialisers, and configuration mappers that work with arbitrary types."
  },
  {
    id: "cs-b16-b4-activator-generic",
    language: "csharp",
    title: "Activator.CreateInstance generic factory",
    tag: "snippet",
    code: `using System;

class Repository<T> where T : new() {
    public T Create() => Activator.CreateInstance<T>();
}

class Order {
    public int Id { get; set; }
    public Order() { Id = new Random().Next(1, 1000); }
}

// Generic version — preserves type safety
var repo = new Repository<Order>();
var order = repo.Create();
Console.WriteLine(\`Order Id: \${order.Id}\`);

// Non-generic version for truly dynamic scenarios
Type t = typeof(Order);
object? dynamicOrder = Activator.CreateInstance(t);
Console.WriteLine(dynamicOrder?.GetType().Name);`,
    explanation: "`Activator.CreateInstance<T>()` requires `new()` constraint and returns a typed `T`; the non-generic overload accepts a `Type` object and returns `object?`, trading type safety for runtime flexibility."
  },
  {
    id: "cs-b16-b4-reflection-performance",
    language: "csharp",
    title: "Reflection performance: cache MethodInfo",
    tag: "caveats",
    code: `using System;
using System.Reflection;
using System.Collections.Concurrent;

class MethodCache {
    // Cache MethodInfo objects — reflection lookup is expensive
    private static readonly ConcurrentDictionary<(Type, string), MethodInfo?>
        _cache = new();

    public static MethodInfo? Get(Type type, string name) =>
        _cache.GetOrAdd((type, name),
            key => key.Item1.GetMethod(key.Item2,
                BindingFlags.Public | BindingFlags.Instance));
}

class Greeter {
    public string Hello(string name) => \`Hello, \${name}!\`;
}

// First call: lookup + cache
var mi = MethodCache.Get(typeof(Greeter), "Hello")!;
var g = new Greeter();
Console.WriteLine(mi.Invoke(g, new object[] { "world" }));

// Subsequent calls: from cache (much faster)
var mi2 = MethodCache.Get(typeof(Greeter), "Hello")!;
Console.WriteLine(ReferenceEquals(mi, mi2));  // True`,
    explanation: "Calling `GetMethod` on every request is the most common reflection performance mistake — cache the `MethodInfo` instance in a static dictionary so the lookup cost is paid only once per method."
  },
  {
    id: "cs-b16-b4-activator-with-args",
    language: "csharp",
    title: "Activator.CreateInstance with constructor args",
    tag: "snippet",
    code: `using System;

class Connection {
    public string Host { get; }
    public int Port { get; }

    public Connection(string host, int port) {
        Host = host;
        Port = port;
    }

    public override string ToString() => \`\${Host}:\${Port}\`;
}

// Pass constructor arguments as object array
Type type = typeof(Connection);
object[] args = { "localhost", 5432 };
var conn = (Connection)Activator.CreateInstance(type, args)!;
Console.WriteLine(conn);  // localhost:5432

// With null args — calls parameterless ctor
// Activator.CreateInstance(type);`,
    explanation: "`Activator.CreateInstance(type, args)` matches constructor by parameter types at runtime — it is slower than `new` but essential when the type is only known at runtime from configuration or plugins."
  },
  {
    id: "cs-b16-b4-expression-tree-basics",
    language: "csharp",
    title: "Expression<Func<T>> vs Func<T> distinction",
    tag: "understanding",
    code: `using System;
using System.Linq.Expressions;

// Func<T>: compiled delegate — runs immediately
Func<int, bool> isEven = x => x % 2 == 0;
Console.WriteLine(isEven(4));  // True

// Expression<Func<T>>: data structure — inspectable
Expression<Func<int, bool>> isEvenExpr = x => x % 2 == 0;

// Inspect the expression tree
var body = (BinaryExpression)isEvenExpr.Body;
Console.WriteLine(\`NodeType: \${body.NodeType}\`);      // Equal
Console.WriteLine(\`Left: \${body.Left}\`);              // (x % 2)
Console.WriteLine(\`Right: \${body.Right}\`);            // 0

// Compile to a delegate when you actually need to run it
var compiled = isEvenExpr.Compile();
Console.WriteLine(compiled(6));  // True`,
    explanation: "A `Func<T>` is an opaque delegate you can only invoke; an `Expression<Func<T>>` is an AST you can inspect, transform, and translate (e.g., to SQL) before optionally compiling it."
  },
  {
    id: "cs-b16-b4-typeof-vs-gettype",
    language: "csharp",
    title: "typeof vs GetType() vs object.GetType()",
    tag: "snippet",
    code: `using System;

class Animal { }
class Dog : Animal { }

Dog dog = new Dog();
Animal animal = dog;  // reference typed as Animal

// typeof: compile-time, works on type names
Type t1 = typeof(Dog);
Console.WriteLine(t1.Name);          // Dog

// GetType(): runtime, returns actual type of instance
Type t2 = dog.GetType();
Type t3 = animal.GetType();          // Dog — not Animal!
Console.WriteLine(t2.Name);          // Dog
Console.WriteLine(t3.Name);          // Dog
Console.WriteLine(t2 == t3);         // True

// typeof for compile-time equality check
Console.WriteLine(typeof(Dog) == animal.GetType());  // True`,
    explanation: "`typeof` resolves at compile time and is free of cost; `GetType()` queries the actual runtime type of the object — always `GetType()` when you need to handle polymorphism correctly."
  },
  {
    id: "cs-b16-b4-iquery-vs-ienumerable",
    language: "csharp",
    title: "IQueryable<T> vs IEnumerable<T> deferred execution",
    tag: "structures",
    code: `using System;
using System.Collections.Generic;
using System.Linq;

var numbers = new List<int> { 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 };

// IEnumerable: filter runs in C# memory
IEnumerable<int> memQuery = numbers
    .Where(x => x > 5)       // C# lambda
    .Select(x => x * 2);

// IQueryable: expression tree, translatable to SQL/etc
IQueryable<int> qryQuery = numbers.AsQueryable()
    .Where(x => x > 5)       // becomes Expression tree
    .Select(x => x * 2);

Console.WriteLine(memQuery.GetType().Name);  // WhereSelectListIterator
Console.WriteLine(qryQuery.GetType().Name);  // EnumerableQuery<int>

// With EF: IQueryable sends SQL; converting to IEnumerable loads all rows first
foreach (var n in memQuery) Console.Write(n + " ");`,
    explanation: "`IEnumerable` runs LINQ in .NET process memory; `IQueryable` carries the query as an expression tree that a provider (EF, LINQ to SQL) translates to a native query — silently switching between them causes N+1 or full table scans."
  },
  {
    id: "cs-b16-b4-is-pattern-declaration",
    language: "csharp",
    title: "is pattern with declaration (pattern matching)",
    tag: "snippet",
    code: `using System;

object[] shapes = { 3.14, "hello", 42, true, new int[] { 1, 2, 3 } };

foreach (var item in shapes) {
    var desc = item switch {
        double d      => \`double: \${d:F2}\`,
        string s      => \`string of length \${s.Length}\`,
        int n when n > 0 => \`positive int: \${n}\`,
        int n         => \`non-positive int: \${n}\`,
        bool b        => \`bool: \${b}\`,
        int[] arr     => \`int[] with \${arr.Length} elements\`,
        _             => "unknown"
    };
    Console.WriteLine(desc);
}`,
    explanation: "The `switch` expression with type patterns is far more concise than if/else chains; the `when` guard adds a condition to a pattern, and `_` is the discard/default arm."
  },
  {
    id: "cs-b16-b4-expression-visitor",
    language: "csharp",
    title: "ExpressionVisitor for query rewriting",
    tag: "structures",
    code: `using System;
using System.Linq.Expressions;

// Visitor that replaces one parameter expression with a constant
class ParameterReplacer : ExpressionVisitor {
    private readonly ParameterExpression _param;
    private readonly Expression _replacement;

    public ParameterReplacer(ParameterExpression param, Expression replacement) {
        _param = param;
        _replacement = replacement;
    }

    protected override Expression VisitParameter(ParameterExpression node) =>
        node == _param ? _replacement : base.VisitParameter(node);
}

Expression<Func<int, int>> addThree = x => x + 3;
var param = addThree.Parameters[0];
var constant = Expression.Constant(10);
var replacer = new ParameterReplacer(param, constant);
var rewritten = (Expression<Func<int, int>>)replacer.Visit(addThree);
var result = rewritten.Compile()();
Console.WriteLine(result);  // 13  (10 + 3)`,
    explanation: "`ExpressionVisitor` uses the Visitor pattern on expression trees — override only the node types you care about and call `base.Visit*` for the rest to handle deep nesting automatically."
  },
  {
    id: "cs-b16-b4-nameof-operator",
    language: "csharp",
    title: "nameof operator for refactor-safe names",
    tag: "snippet",
    code: `using System;
using System.ComponentModel;

class Person : INotifyPropertyChanged {
    public event PropertyChangedEventHandler? PropertyChanged;

    private string _name = "";
    public string Name {
        get => _name;
        set {
            if (_name == value) return;
            _name = value;
            // nameof resolves at compile time — rename refactors update it
            PropertyChanged?.Invoke(this,
                new PropertyChangedEventArgs(nameof(Name)));
        }
    }
}

var p = new Person();
p.PropertyChanged += (s, e) =>
    Console.WriteLine(\`Property changed: \${e.PropertyName}\`);
p.Name = "Alice";  // Prints: Property changed: Name`,
    explanation: "`nameof` resolves a symbol to its string name at compile time, so renaming `Name` in a refactor automatically updates the string — eliminating magic strings that silently break at runtime."
  },
  {
    id: "cs-b16-b4-expression-tree-compile",
    language: "csharp",
    title: "Expression tree compilation and caching",
    tag: "understanding",
    code: `using System;
using System.Collections.Generic;
using System.Linq.Expressions;

// Cache compiled delegates — compiling is expensive
class ExpressionCache {
    private static readonly Dictionary<string, Func<int, int>> _cache = new();

    public static Func<int, int> GetMultiplier(int factor) {
        var key = \`multiply_\${factor}\`;
        if (!_cache.TryGetValue(key, out var fn)) {
            // Build: x => x * factor
            var param = Expression.Parameter(typeof(int), "x");
            var body = Expression.Multiply(param,
                Expression.Constant(factor));
            var lambda = Expression.Lambda<Func<int, int>>(body, param);
            fn = lambda.Compile();
            _cache[key] = fn;
        }
        return fn;
    }
}

var triple = ExpressionCache.GetMultiplier(3);
var double_ = ExpressionCache.GetMultiplier(2);
Console.WriteLine(triple(7));   // 21
Console.WriteLine(double_(5));  // 10`,
    explanation: "`Expression.Lambda<T>().Compile()` performs JIT compilation and is about as slow as emitting IL — always cache the resulting delegate; re-compiling on every call destroys performance."
  },
  {
    id: "cs-b16-b4-as-vs-cast",
    language: "csharp",
    title: "as operator vs direct cast",
    tag: "snippet",
    code: `using System;

object[] items = { "hello", 42, 3.14, null! };

foreach (var item in items) {
    // as: returns null on failure — safe, no exception
    string? s = item as string;
    Console.WriteLine(s != null ? \`string: \${s}\` : "not a string");
}

// Direct cast: throws InvalidCastException on failure
try {
    string forced = (string)items[1];  // int 42 -> exception
} catch (InvalidCastException ex) {
    Console.WriteLine(\`Cast failed: \${ex.Message}\`);
}

// Best practice: use 'is' for check+cast in one step
if (items[0] is string str) {
    Console.WriteLine(\`Is string: \${str.ToUpper()}\`);
}`,
    explanation: "`as` returns `null` for reference types on failure (prefer it when failure is expected); a direct cast throws `InvalidCastException` (prefer it when failure is a bug); `is var x` does both in one step."
  },
  {
    id: "cs-b16-b4-caller-member-name",
    language: "csharp",
    title: "CallerMemberName attribute for logging",
    tag: "snippet",
    code: `using System;
using System.Runtime.CompilerServices;

class Logger {
    public void Log(string message,
        [CallerMemberName] string memberName = "",
        [CallerFilePath]  string filePath   = "",
        [CallerLineNumber] int lineNumber   = 0) {
        Console.WriteLine(
            \`[\${System.IO.Path.GetFileName(filePath)}:\${lineNumber}] \${memberName}: \${message}\`);
    }
}

class Service {
    private readonly Logger _log = new();

    public void Process(string data) {
        _log.Log("starting");   // compiler fills: memberName="Process"
        _log.Log(\`data=\${data}\`);
    }
}

new Service().Process("payload");`,
    explanation: "`[CallerMemberName]` (and its siblings) are filled by the compiler at the call site — no reflection needed, zero runtime cost, and the information is always accurate even after refactoring."
  },
  {
    id: "cs-b16-b4-obsolete-attribute",
    language: "csharp",
    title: "ObsoleteAttribute with custom message",
    tag: "snippet",
    code: `using System;

class MathHelper {
    // warning: tells callers to migrate, build still succeeds
    [Obsolete("Use ComputeSquareRoot(double) instead. Will be removed in v3.0.")]
    public static double Sqrt(double x) => Math.Sqrt(x);

    // error: makes the build fail — for breaking removals
    [Obsolete("This method is insecure. Use HashPasswordV2().", error: true)]
    public static string HashPassword(string pw) => pw;

    public static double ComputeSquareRoot(double x) => Math.Sqrt(x);
}

// This triggers a CS0618 warning at compile time:
// double r = MathHelper.Sqrt(9.0);

// This triggers a CS0619 error at compile time:
// string h = MathHelper.HashPassword("pw");

Console.WriteLine(MathHelper.ComputeSquareRoot(9.0));  // 3`,
    explanation: "`[Obsolete]` without `error: true` emits a compiler warning (CS0618); with `error: true` it emits an error (CS0619) that breaks the build — use the latter for security-critical removals."
  },
  {
    id: "cs-b16-b4-dynamic-method",
    language: "csharp",
    title: "DynamicMethod creation with IL emit",
    tag: "understanding",
    code: `using System;
using System.Reflection;
using System.Reflection.Emit;

// Build a method that adds two integers — at runtime
var dynMethod = new DynamicMethod(
    name:       "Add",
    returnType: typeof(int),
    parameterTypes: new[] { typeof(int), typeof(int) });

ILGenerator il = dynMethod.GetILGenerator();
il.Emit(OpCodes.Ldarg_0);  // push first arg
il.Emit(OpCodes.Ldarg_1);  // push second arg
il.Emit(OpCodes.Add);      // add them
il.Emit(OpCodes.Ret);      // return result

// Create a typed delegate
var add = (Func<int, int, int>)dynMethod.CreateDelegate(
    typeof(Func<int, int, int>));

Console.WriteLine(add(3, 4));   // 7
Console.WriteLine(add(10, 20)); // 30`,
    explanation: "`DynamicMethod` emits raw IL at runtime and compiles directly to machine code — it is faster than reflection for hot paths and is the foundation of expression tree compilation and serialiser code generation."
  },
  {
    id: "cs-b16-b4-expando-object",
    language: "csharp",
    title: "ExpandoObject dynamic property bag",
    tag: "understanding",
    code: `using System;
using System.Dynamic;
using System.Collections.Generic;

dynamic config = new ExpandoObject();
config.Host = "localhost";
config.Port  = 5432;
config.Debug = true;

Console.WriteLine(\`\${config.Host}:\${config.Port}\`);

// ExpandoObject implements IDictionary<string,object?>
var dict = (IDictionary<string, object?>)config;
dict["Timeout"] = 30;
Console.WriteLine(config.Timeout);   // 30

// Iterate all properties
foreach (var (key, value) in dict) {
    Console.WriteLine(\`  \${key} = \${value}\`);
}

// WARNING: not serialisable by default with System.Text.Json
// Use JsonSerializer.Serialize(dict) — not the dynamic object`,
    explanation: "`ExpandoObject` is backed by a `Dictionary<string, object?>` and uses the DLR to resolve property accesses — handy for dynamic JSON-like objects, but serialise via the dictionary interface, not the dynamic reference."
  },
  {
    id: "cs-b16-b4-iobservable-pattern",
    language: "csharp",
    title: "IObservable<T>/IObserver<T> manual pattern",
    tag: "structures",
    code: `using System;
using System.Collections.Generic;

class EventBus<T> : IObservable<T> {
    private readonly List<IObserver<T>> _observers = new();

    public IDisposable Subscribe(IObserver<T> observer) {
        _observers.Add(observer);
        return new Subscription(() => _observers.Remove(observer));
    }

    public void Publish(T value) {
        foreach (var o in _observers) o.OnNext(value);
    }

    record Subscription(Action Dispose_) : IDisposable {
        public void Dispose() => Dispose_();
    }
}

class Printer<T> : IObserver<T> {
    public void OnNext(T value) => Console.WriteLine(\`Got: \${value}\`);
    public void OnError(Exception ex) => Console.WriteLine(\`Error: \${ex.Message}\`);
    public void OnCompleted() => Console.WriteLine("Done");
}

var bus = new EventBus<string>();
using var sub = bus.Subscribe(new Printer<string>());
bus.Publish("hello");
bus.Publish("world");`,
    explanation: "`IObservable<T>` / `IObserver<T>` are the BCL push-notification contracts; implementing them manually clarifies how Rx.NET and other reactive libraries work under the hood."
  },
  {
    id: "cs-b16-b4-debugger-display",
    language: "csharp",
    title: "DebuggerDisplay attribute for IDE tooltips",
    tag: "snippet",
    code: `using System;
using System.Diagnostics;

[DebuggerDisplay("{Name,nq} (Age={Age})")]
class Person {
    public string Name { get; init; } = "";
    public int Age { get; init; }

    // nq = no quotes — shows: Alice (Age=30)
    // without nq it would be: "Alice" (Age=30)
}

[DebuggerDisplay("Count={Count}")]
class PersonList {
    private readonly List<Person> _list = new();
    public int Count => _list.Count;
    public void Add(Person p) => _list.Add(p);
}

var people = new PersonList();
people.Add(new Person { Name = "Alice", Age = 30 });
people.Add(new Person { Name = "Bob",   Age = 25 });

// In the debugger, hovering over 'people' shows: Count=2
// Hovering over a Person shows: Alice (Age=30)
Console.WriteLine("Set breakpoint here and inspect 'people'");`,
    explanation: "`[DebuggerDisplay]` controls what the Visual Studio / Rider debugger shows in the watch window and tooltips — a huge quality-of-life improvement for complex types with many irrelevant fields."
  },
  {
    id: "cs-b16-b4-expression-tree-no-await",
    language: "csharp",
    title: "Expression trees cannot contain await",
    tag: "caveats",
    code: `using System;
using System.Linq.Expressions;
using System.Threading.Tasks;

// This does NOT compile:
// Expression<Func<Task<int>>> asyncExpr = async () => await Task.FromResult(1);
// Error CS1989: Async lambda expressions cannot be converted to expression trees.

// Workaround 1: compile to Func and wrap
Func<Task<int>> asyncDelegate = async () => await Task.FromResult(42);
Console.WriteLine(await asyncDelegate());  // 42

// Workaround 2: build synchronous expression, run async logic outside
Expression<Func<int>> syncExpr = () => 42;
var syncResult = syncExpr.Compile()();
int asyncResult = await Task.FromResult(syncResult);
Console.WriteLine(asyncResult);  // 42`,
    explanation: "Expression trees represent pure, serialisable data structures and cannot capture the state machine that `async`/`await` requires — use `Func<Task<T>>` delegates instead and build expression trees around synchronous operations."
  },
  {
    id: "cs-b16-b4-attribute-usage",
    language: "csharp",
    title: "AttributeUsage targets and AllowMultiple",
    tag: "snippet",
    code: `using System;

[AttributeUsage(
    AttributeTargets.Class | AttributeTargets.Method,
    AllowMultiple = true,
    Inherited = false)]
class TagAttribute : Attribute {
    public string Value { get; }
    public TagAttribute(string value) => Value = value;
}

[Tag("service")]
[Tag("v2")]
class UserService {
    [Tag("critical")]
    public void DeleteUser(int id) { }
}

var type = typeof(UserService);
var classTags = type.GetCustomAttributes<TagAttribute>();
foreach (var tag in classTags)
    Console.WriteLine(\`Class tag: \${tag.Value}\`);

var methodTags = type.GetMethod("DeleteUser")!
                     .GetCustomAttributes<TagAttribute>();
foreach (var tag in methodTags)
    Console.WriteLine(\`Method tag: \${tag.Value}\`);`,
    explanation: "`AllowMultiple = true` permits the same attribute to appear multiple times on one target; `Inherited = false` means subclasses don't automatically receive the parent's attributes during reflection."
  },
  {
    id: "cs-b16-b4-specification-pattern",
    language: "csharp",
    title: "Specification pattern with Expression<Func<T,bool>>",
    tag: "structures",
    code: `using System;
using System.Linq;
using System.Linq.Expressions;
using System.Collections.Generic;

class Spec<T> {
    public Expression<Func<T, bool>> Expr { get; }
    public Spec(Expression<Func<T, bool>> expr) => Expr = expr;

    public Spec<T> And(Spec<T> other) {
        var param = Expression.Parameter(typeof(T));
        var body = Expression.AndAlso(
            Expression.Invoke(Expr, param),
            Expression.Invoke(other.Expr, param));
        return new Spec<T>(Expression.Lambda<Func<T, bool>>(body, param));
    }
}

record Product(string Name, decimal Price, bool InStock);

var data = new List<Product> {
    new("Widget", 9.99m, true),
    new("Gadget", 49.99m, false),
    new("Doohickey", 4.99m, true),
};

var cheap    = new Spec<Product>(p => p.Price < 10m);
var inStock  = new Spec<Product>(p => p.InStock);
var combined = cheap.And(inStock);

var results = data.AsQueryable().Where(combined.Expr).ToList();
results.ForEach(p => Console.WriteLine(p.Name));`,
    explanation: "The Specification pattern wraps an `Expression<Func<T, bool>>` so you can compose predicates with `And`/`Or` — the expression tree stays intact for IQueryable providers to translate to SQL."
  },
  {
    id: "cs-b16-b4-conditional-attribute",
    language: "csharp",
    title: "ConditionalAttribute skips calls at compile time",
    tag: "snippet",
    code: `using System;
using System.Diagnostics;

class Diagnostics {
    [Conditional("DEBUG")]
    public static void Assert(bool condition, string message) {
        if (!condition)
            throw new Exception(\`Assertion failed: \${message}\`);
    }

    [Conditional("TRACE")]
    public static void TraceMessage(string msg) {
        Console.WriteLine(\`TRACE: \${msg}\`);
    }
}

// In DEBUG builds: Assert is called normally
// In RELEASE builds: the call site is removed by compiler — zero overhead
Diagnostics.Assert(1 + 1 == 2, "math is broken");
Diagnostics.TraceMessage("entering method");

Console.WriteLine("Done");`,
    explanation: "`[Conditional(\"SYMBOL\")]` instructs the compiler to *omit the call site* (not just the body) when the symbol is undefined — achieving zero overhead in production builds without `#if DEBUG` everywhere."
  },
  {
    id: "cs-b16-b4-dynamic-object",
    language: "csharp",
    title: "DynamicObject method and property interception",
    tag: "understanding",
    code: `using System;
using System.Dynamic;

class RecordingProxy : DynamicObject {
    private readonly System.Collections.Generic.Dictionary<string, object?> _store = new();

    public override bool TryGetMember(GetMemberBinder binder, out object? result) =>
        _store.TryGetValue(binder.Name, out result);

    public override bool TrySetMember(SetMemberBinder binder, object? value) {
        Console.WriteLine(\`Setting \${binder.Name} = \${value}\`);
        _store[binder.Name] = value;
        return true;
    }

    public override bool TryInvokeMember(InvokeMemberBinder binder,
        object?[]? args, out object? result) {
        Console.WriteLine(\`Calling \${binder.Name}(\${string.Join(", ", args ?? Array.Empty<object?>())})\`);
        result = null;
        return true;
    }
}

dynamic proxy = new RecordingProxy();
proxy.Name = "Alice";
Console.WriteLine(proxy.Name);
proxy.Save("database");`,
    explanation: "`DynamicObject` gives you fine-grained control over get, set, invoke, and index operations via override hooks — unlike `ExpandoObject` it lets you intercept operations rather than just store values."
  },
  {
    id: "cs-b16-b4-repository-iqueryable",
    language: "csharp",
    title: "Repository pattern with IQueryable",
    tag: "classes",
    code: `using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;

interface IRepository<T> {
    IQueryable<T> Query();
    T? FindById(int id);
    void Add(T entity);
}

class InMemoryRepository<T> : IRepository<T> where T : class {
    private readonly List<T> _store = new();

    public IQueryable<T> Query() => _store.AsQueryable();
    public T? FindById(int id) => _store.ElementAtOrDefault(id - 1);
    public void Add(T entity) => _store.Add(entity);
}

record Customer(int Id, string Name, decimal Balance);

var repo = new InMemoryRepository<Customer>();
repo.Add(new Customer(1, "Alice", 500m));
repo.Add(new Customer(2, "Bob",   1500m));

var rich = repo.Query()
               .Where(c => c.Balance > 1000m)
               .Select(c => c.Name)
               .ToList();

rich.ForEach(Console.WriteLine);  // Bob`,
    explanation: "Exposing `IQueryable<T>` from the repository keeps filter/sort/page logic in the service layer while allowing EF Core to translate the entire chain to a single SQL query."
  },
  {
    id: "cs-b16-b4-custom-attribute-reflection",
    language: "csharp",
    title: "Custom attribute reflection at runtime",
    tag: "snippet",
    code: `using System;
using System.Reflection;

[AttributeUsage(AttributeTargets.Property)]
class ValidationAttribute : Attribute {
    public int MinLength { get; init; }
    public int MaxLength { get; init; } = int.MaxValue;
}

class UserDto {
    [Validation(MinLength = 2, MaxLength = 50)]
    public string Name { get; set; } = "";

    [Validation(MinLength = 8)]
    public string Password { get; set; } = "";
}

// Validate at runtime via reflection
bool Validate(object obj) {
    foreach (var prop in obj.GetType().GetProperties()) {
        var attr = prop.GetCustomAttribute<ValidationAttribute>();
        if (attr == null) continue;
        var val = prop.GetValue(obj) as string ?? "";
        if (val.Length < attr.MinLength || val.Length > attr.MaxLength)
            return false;
    }
    return true;
}

var dto = new UserDto { Name = "A", Password = "secret99" };
Console.WriteLine(Validate(dto));  // False (Name too short)`,
    explanation: "Combining custom attributes with `GetCustomAttribute<T>` creates a lightweight validation framework — the attribute carries metadata, reflection discovers it at runtime, keeping validation rules co-located with the model."
  },
  {
    id: "cs-b16-b4-expression-binary",
    language: "csharp",
    title: "BinaryExpression and ConstantExpression nodes",
    tag: "types",
    code: `using System;
using System.Linq.Expressions;

// Build: x > 10 && x < 100
var x = Expression.Parameter(typeof(int), "x");
var lower = Expression.GreaterThan(x, Expression.Constant(10));
var upper = Expression.LessThan(x, Expression.Constant(100));
var both  = Expression.AndAlso(lower, upper);

var lambda = Expression.Lambda<Func<int, bool>>(both, x);
Console.WriteLine(lambda);            // x => ((x > 10) AndAlso (x < 100))

var fn = lambda.Compile();
Console.WriteLine(fn(5));    // False
Console.WriteLine(fn(50));   // True
Console.WriteLine(fn(150));  // False

// Inspect node types
Console.WriteLine(lower.NodeType);   // GreaterThan
Console.WriteLine(both.NodeType);    // AndAlso`,
    explanation: "`BinaryExpression` represents any two-operand operation (arithmetic, comparison, logical); `ConstantExpression` wraps a literal value — together they are the most common building blocks in hand-constructed expression trees."
  },
  {
    id: "cs-b16-b4-decorator-pattern",
    language: "csharp",
    title: "Decorator pattern with interfaces",
    tag: "classes",
    code: `using System;

interface IOrderService {
    decimal GetTotal(int orderId);
}

class OrderService : IOrderService {
    public decimal GetTotal(int orderId) {
        Console.WriteLine(\`DB query for order \${orderId}\`);
        return 99.99m;
    }
}

class CachingDecorator : IOrderService {
    private readonly IOrderService _inner;
    private readonly System.Collections.Generic.Dictionary<int, decimal> _cache = new();

    public CachingDecorator(IOrderService inner) => _inner = inner;

    public decimal GetTotal(int orderId) {
        if (!_cache.TryGetValue(orderId, out var total)) {
            total = _inner.GetTotal(orderId);
            _cache[orderId] = total;
        }
        return total;
    }
}

IOrderService svc = new CachingDecorator(new OrderService());
Console.WriteLine(svc.GetTotal(1));  // DB query + 99.99
Console.WriteLine(svc.GetTotal(1));  // 99.99 from cache (no query)`,
    explanation: "The Decorator pattern wraps a dependency behind the same interface and adds cross-cutting behaviour (caching, logging, retry) without modifying the original class — perfect for DI container composition."
  },
  {
    id: "cs-b16-b4-member-expression",
    language: "csharp",
    title: "MemberExpression for property access trees",
    tag: "types",
    code: `using System;
using System.Linq.Expressions;
using System.Reflection;

record Person(string Name, int Age);

// Build: p => p.Age > 25
var param  = Expression.Parameter(typeof(Person), "p");
var ageProp = typeof(Person).GetProperty(nameof(Person.Age))!;
var member = Expression.Property(param, ageProp);  // p.Age
var body   = Expression.GreaterThan(member, Expression.Constant(25));
var lambda = Expression.Lambda<Func<Person, bool>>(body, param);

Console.WriteLine(lambda);  // p => (p.Age > 25)
var fn = lambda.Compile();

var people = new[] {
    new Person("Alice", 30),
    new Person("Bob", 20),
};
foreach (var p in people)
    Console.WriteLine(\`\${p.Name}: \${fn(p)}\`);`,
    explanation: "`MemberExpression` captures a property or field access as a node in the tree; using `nameof` to get the `PropertyInfo` ensures the tree stays in sync with the type when you rename the property."
  },
  {
    id: "cs-b16-b4-strategy-pattern-func",
    language: "csharp",
    title: "Strategy pattern with Func<T, T>",
    tag: "classes",
    code: `using System;
using System.Collections.Generic;

class TextProcessor {
    private readonly List<Func<string, string>> _strategies = new();

    public TextProcessor Add(Func<string, string> strategy) {
        _strategies.Add(strategy);
        return this;  // fluent API
    }

    public string Process(string input) =>
        _strategies.Aggregate(input, (text, fn) => fn(text));
}

var processor = new TextProcessor()
    .Add(s => s.Trim())
    .Add(s => s.ToLower())
    .Add(s => s.Replace(" ", "-"))
    .Add(s => s.Length > 50 ? s[..50] : s);

Console.WriteLine(processor.Process("  Hello World  "));   // hello-world
Console.WriteLine(processor.Process("  UPPER CASE  "));   // upper-case`,
    explanation: "Using `Func<T, T>` instead of an `IStrategy` interface eliminates ceremony for simple transformations — lambda capture handles state, and the fluent API composes strategies into a readable pipeline."
  },
  {
    id: "cs-b16-b4-make-generic-type",
    language: "csharp",
    title: "MakeGenericType wrong arity caveat",
    tag: "caveats",
    code: `using System;

// Open generic types carry their arity in the name
Type listType = typeof(List<>);              // arity 1
Type dictType = typeof(Dictionary<,>);       // arity 2
Console.WriteLine(listType.Name);            // List\`1
Console.WriteLine(listType.IsGenericTypeDefinition); // True

// Correct: supply exactly the right number of type arguments
Type closedList = listType.MakeGenericType(typeof(string));
var instance = (System.Collections.IList)Activator.CreateInstance(closedList)!;
instance.Add("hello");
Console.WriteLine(instance[0]);  // hello

// Wrong arity: ArgumentException at runtime
try {
    listType.MakeGenericType(typeof(string), typeof(int));
} catch (ArgumentException ex) {
    Console.WriteLine(\`Caught: \${ex.Message[..60]}\`);
}`,
    explanation: "`MakeGenericType` throws `ArgumentException` at runtime if you pass the wrong number of type arguments — always check `GetGenericArguments().Length` (or use `List<>` = 1, `Dictionary<,>` = 2) before calling it."
  },
  {
    id: "cs-b16-b4-observer-manual",
    language: "csharp",
    title: "Observer pattern manual implementation",
    tag: "classes",
    code: `using System;
using System.Collections.Generic;

interface IEventHandler<T> {
    void Handle(T evt);
}

class EventAggregator {
    private readonly Dictionary<Type, List<object>> _handlers = new();

    public void Subscribe<T>(IEventHandler<T> handler) {
        var key = typeof(T);
        if (!_handlers.TryGetValue(key, out var list))
            _handlers[key] = list = new List<object>();
        list.Add(handler);
    }

    public void Publish<T>(T evt) {
        if (_handlers.TryGetValue(typeof(T), out var handlers))
            foreach (IEventHandler<T> h in handlers)
                h.Handle(evt);
    }
}

record OrderPlaced(int OrderId, decimal Total);

class EmailNotifier : IEventHandler<OrderPlaced> {
    public void Handle(OrderPlaced e) =>
        Console.WriteLine(\`Email: Order \${e.OrderId} for \${e.Total:C}\`);
}

var agg = new EventAggregator();
agg.Subscribe(new EmailNotifier());
agg.Publish(new OrderPlaced(42, 99.99m));`,
    explanation: "An `EventAggregator` decouples publishers from subscribers using a type-keyed dictionary — each event type has its own handler list, making it trivial to add subscribers without touching publishers."
  },
  {
    id: "cs-b16-b4-parameter-expression",
    language: "csharp",
    title: "ParameterExpression in lambda construction",
    tag: "types",
    code: `using System;
using System.Linq.Expressions;

// ParameterExpression represents a named input to a lambda
var x = Expression.Parameter(typeof(double), "x");
var y = Expression.Parameter(typeof(double), "y");

// Build: (x, y) => Math.Sqrt(x*x + y*y)  (Euclidean distance from origin)
var xx       = Expression.Multiply(x, x);
var yy       = Expression.Multiply(y, y);
var sum      = Expression.Add(xx, yy);
var sqrtMi   = typeof(Math).GetMethod(nameof(Math.Sqrt), new[] { typeof(double) })!;
var sqrt     = Expression.Call(null, sqrtMi, sum);
var lambda   = Expression.Lambda<Func<double, double, double>>(sqrt, x, y);

Console.WriteLine(lambda);  // (x, y) => Sqrt(((x * x) + (y * y)))

var fn = lambda.Compile();
Console.WriteLine(fn(3, 4));   // 5
Console.WriteLine(fn(5, 12));  // 13`,
    explanation: "`ParameterExpression` objects must be created once and reused throughout the tree — creating two separate `Expression.Parameter(typeof(int), \"x\")` instances produces two *different* parameters even with the same name."
  },
  {
    id: "cs-b16-b4-chain-of-responsibility",
    language: "csharp",
    title: "Chain of Responsibility with Func<>",
    tag: "classes",
    code: `using System;
using System.Collections.Generic;

class Pipeline<T> {
    private readonly List<Func<T, Func<T, T>, T>> _middleware = new();

    public Pipeline<T> Use(Func<T, Func<T, T>, T> middleware) {
        _middleware.Add(middleware);
        return this;
    }

    public T Run(T input) {
        int index = 0;

        T Next(T current) {
            if (index >= _middleware.Count) return current;
            var mw = _middleware[index++];
            return mw(current, Next);
        }

        return Next(input);
    }
}

var pipe = new Pipeline<string>()
    .Use((s, next) => { Console.WriteLine(\`Before trim: '\${s}'\`); return next(s.Trim()); })
    .Use((s, next) => next(s.ToUpper()))
    .Use((s, next) => { var r = next(s); Console.WriteLine(\`After: '\${r}'\`); return r; });

Console.WriteLine(pipe.Run("  hello  "));`,
    explanation: "Expressing middleware as `Func<T, Func<T, T>, T>` (value, next) allows composing ordered transformations without interface boilerplate — each handler can short-circuit by not calling `next`."
  },
  {
    id: "cs-b16-b4-iqueryable-vs-ienumerable-switch",
    language: "csharp",
    title: "IQueryable vs IEnumerable silent switch caveat",
    tag: "caveats",
    code: `using System;
using System.Collections.Generic;
using System.Linq;

var data = new List<int> { 1, 2, 3, 4, 5 }.AsQueryable();

// GOOD: filter before materialisation — stays IQueryable (SQL-translatable)
var goodQuery = data.Where(x => x > 3);          // IQueryable
Console.WriteLine(goodQuery.GetType().Name);      // EnumerableQuery<int>

// BAD: AsEnumerable() loads everything to memory, THEN filters in C#
var badQuery = data
    .AsEnumerable()          // silently switches to LINQ-to-objects
    .Where(x => x > 3);     // C# lambda, can't go back to SQL
Console.WriteLine(badQuery.GetType().Name);  // WhereEnumerableIterator<int>

// With EF: .AsEnumerable() before .Where() means SELECT * then filter in memory
foreach (var n in goodQuery) Console.Write(n + " ");  // 4 5`,
    explanation: "Calling `.AsEnumerable()` or `.ToList()` mid-query breaks the `IQueryable` chain and forces all subsequent operations into memory — always materialise *after* filtering, sorting, and projecting."
  },
  {
    id: "cs-b16-b4-unary-expression",
    language: "csharp",
    title: "UnaryExpression for negation and conversion",
    tag: "types",
    code: `using System;
using System.Linq.Expressions;

var x = Expression.Parameter(typeof(int), "x");

// Negate: -x
var negated = Expression.Negate(x);
var negFn = Expression.Lambda<Func<int, int>>(negated, x).Compile();
Console.WriteLine(negFn(5));   // -5
Console.WriteLine(negFn(-3));  // 3

// Not: !b
var b = Expression.Parameter(typeof(bool), "b");
var notB = Expression.Not(b);
var notFn = Expression.Lambda<Func<bool, bool>>(notB, b).Compile();
Console.WriteLine(notFn(true));   // False

// Convert: (double)x
var toDouble = Expression.Convert(x, typeof(double));
var convFn = Expression.Lambda<Func<int, double>>(toDouble, x).Compile();
Console.WriteLine(convFn(7));   // 7  (as double)`,
    explanation: "`UnaryExpression` covers single-operand operations: arithmetic negation (`Negate`), logical inversion (`Not`), and type conversion (`Convert`) — the `Convert` node generates the same IL as a C# explicit cast."
  },
  {
    id: "cs-b16-b4-get-method-ambiguous",
    language: "csharp",
    title: "GetMethod ambiguous overload caveat",
    tag: "caveats",
    code: `using System;
using System.Reflection;

class MathHelper {
    public static double Abs(double x) => Math.Abs(x);
    public static int    Abs(int x)    => Math.Abs(x);
}

// GetMethod with just a name throws AmbiguousMatchException for overloads
try {
    typeof(MathHelper).GetMethod("Abs");  // ambiguous!
} catch (AmbiguousMatchException ex) {
    Console.WriteLine(\`Caught: \${ex.Message}\`);
}

// Fix: specify parameter types to disambiguate
var doubleAbs = typeof(MathHelper)
    .GetMethod("Abs", new[] { typeof(double) })!;
var intAbs = typeof(MathHelper)
    .GetMethod("Abs", new[] { typeof(int) })!;

Console.WriteLine(doubleAbs.Invoke(null, new object[] { -3.14 }));  // 3.14
Console.WriteLine(intAbs.Invoke(null, new object[] { -42 }));        // 42`,
    explanation: "`GetMethod(name)` throws `AmbiguousMatchException` when multiple overloads exist; always pass the parameter type array to pinpoint the exact overload — or use `GetMethods().Where(...)` for more complex filtering."
  },
  {
    id: "cs-b16-b4-method-call-expression",
    language: "csharp",
    title: "MethodCallExpression for method invocation trees",
    tag: "types",
    code: `using System;
using System.Linq.Expressions;
using System.Reflection;

// Build: s => s.ToUpper()
var param  = Expression.Parameter(typeof(string), "s");
var toUpper = typeof(string).GetMethod(nameof(string.ToUpper),
                                       Type.EmptyTypes)!;
var call   = Expression.Call(param, toUpper);
var lambda = Expression.Lambda<Func<string, string>>(call, param);

Console.WriteLine(lambda);          // s => s.ToUpper()
var fn = lambda.Compile();
Console.WriteLine(fn("hello"));     // HELLO

// Static method call: Math.Abs(x)
var x = Expression.Parameter(typeof(double), "x");
var absMethod = typeof(Math).GetMethod(nameof(Math.Abs), new[] { typeof(double) })!;
var absExpr   = Expression.Lambda<Func<double, double>>(
    Expression.Call(null, absMethod, x), x).Compile();
Console.WriteLine(absExpr(-7.5));   // 7.5`,
    explanation: "`MethodCallExpression` represents any method call — instance (pass the instance expression as first arg to `Expression.Call`) or static (pass `null`); the method must be resolved to a `MethodInfo` at tree-build time."
  },
  {
    id: "cs-b16-b4-pipeline-builder",
    language: "csharp",
    title: "Pipeline builder with fluent API",
    tag: "classes",
    code: `using System;
using System.Collections.Generic;
using System.Linq;

class TransformPipeline<TIn, TOut> {
    public static Builder<TIn> Create() => new();

    public class Builder<T> {
        private readonly List<Func<object, object>> _steps = new();

        public Builder<TNext> Then<TNext>(Func<T, TNext> step) {
            var next = new Builder<TNext>();
            next._steps.AddRange(_steps);
            next._steps.Add(x => step((T)x)!);
            return next;
        }

        public Func<TIn, T> Build() {
            var steps = _steps.ToList();
            return input => (T)steps.Aggregate((object)input!, (v, fn) => fn(v));
        }
    }
}

var pipeline = TransformPipeline<string, int>.Create()
    .Then(s => s.Trim())
    .Then(s => s.ToUpper())
    .Then(s => s.Length)
    .Build();

Console.WriteLine(pipeline("  hello  "));   // 5
Console.WriteLine(pipeline("  world  "));   // 5`,
    explanation: "A fluent pipeline builder accumulates typed transform steps and composes them into a single delegate at `Build()` — the generic parameter progression (`Builder<T>` → `Builder<TNext>`) ensures compile-time type safety at each stage."
  },
  {
    id: "cs-b16-b4-dynamic-dispatch-boxing",
    language: "csharp",
    title: "dynamic dispatch on value types boxes",
    tag: "caveats",
    code: `using System;

struct Point {
    public int X, Y;
    public Point(int x, int y) { X = x; Y = y; }
    public void Move(int dx, int dy) { X += dx; Y += dy; }
    public override string ToString() => \`(\${X}, \${Y})\`;
}

// Static dispatch — no boxing, mutates the struct in place
Point p1 = new Point(0, 0);
p1.Move(3, 4);
Console.WriteLine(p1);  // (3, 4)

// dynamic — boxes the struct, mutation is on the copy!
dynamic p2 = new Point(0, 0);
p2.Move(3, 4);
// p2 is still (0,0) because Move ran on a boxed COPY
Console.WriteLine(p2);  // (0, 0) ← NOT (3, 4)

// Workaround: unbox explicitly before calling mutable methods
Point p3 = (Point)p2;
p3.Move(3, 4);
Console.WriteLine(p3);  // (3, 4)`,
    explanation: "Using `dynamic` with value types silently boxes them to `object` — any mutations inside called methods operate on a heap copy, leaving the original unchanged in a hard-to-debug way."
  },
  {
    id: "cs-b16-b4-visitor-pattern-matching",
    language: "csharp",
    title: "Visitor pattern with pattern matching",
    tag: "classes",
    code: `using System;

abstract record Shape;
record Circle(double Radius) : Shape;
record Rectangle(double Width, double Height) : Shape;
record Triangle(double Base, double Height) : Shape;

static class ShapeVisitor {
    public static double Area(Shape shape) => shape switch {
        Circle c    => Math.PI * c.Radius * c.Radius,
        Rectangle r => r.Width * r.Height,
        Triangle t  => 0.5 * t.Base * t.Height,
        _           => throw new NotSupportedException(shape.GetType().Name)
    };

    public static string Describe(Shape shape) => shape switch {
        Circle c    => \`Circle r=\${c.Radius:F1}\`,
        Rectangle r => \`Rect \${r.Width:F1}x\${r.Height:F1}\`,
        Triangle t  => \`Triangle b=\${t.Base:F1} h=\${t.Height:F1}\`,
        _           => "Unknown"
    };
}

Shape[] shapes = { new Circle(5), new Rectangle(4, 6), new Triangle(3, 8) };
foreach (var s in shapes)
    Console.WriteLine(\`\${ShapeVisitor.Describe(s)}: area=\${ShapeVisitor.Area(s):F2}\`);`,
    explanation: "C# pattern matching in a `switch` expression cleanly replaces the classic Visitor double-dispatch boilerplate — sealed record hierarchies with `switch` give exhaustiveness warnings when a new subtype is added."
  },
  {
    id: "cs-b16-b4-method-impl-inlining",
    language: "csharp",
    title: "MethodImpl AggressiveInlining and NoInlining",
    tag: "understanding",
    code: `using System;
using System.Runtime.CompilerServices;

class MathOps {
    // Hint to JIT: always inline this — eliminates call overhead
    [MethodImpl(MethodImplOptions.AggressiveInlining)]
    public static int Square(int x) => x * x;

    // Prevent inlining — useful for accurate stack traces in logging
    [MethodImpl(MethodImplOptions.NoInlining)]
    public static void LogError(string message) {
        Console.WriteLine(\`ERROR: \${message}\`);
        // Stack trace will always show this frame
    }

    // AggressiveOptimization: let JIT spend more time optimising
    [MethodImpl(MethodImplOptions.AggressiveInlining |
                MethodImplOptions.AggressiveOptimization)]
    public static double HotPath(double x) => x * x + 2 * x + 1;
}

Console.WriteLine(MathOps.Square(5));      // 25
Console.WriteLine(MathOps.HotPath(3.0));  // 16`,
    explanation: "`AggressiveInlining` is a hint (not a command) for tiny hot methods; `NoInlining` guarantees the method appears in stack traces — essential for structured logging libraries that inspect the call stack."
  },
  {
    id: "cs-b16-b4-new-expression",
    language: "csharp",
    title: "NewExpression for constructor invocation trees",
    tag: "types",
    code: `using System;
using System.Linq.Expressions;
using System.Reflection;

class Point {
    public int X { get; }
    public int Y { get; }
    public Point(int x, int y) { X = x; Y = y; }
    public override string ToString() => \`(\${X}, \${Y})\`;
}

// Build: (x, y) => new Point(x, y)
var xParam = Expression.Parameter(typeof(int), "x");
var yParam = Expression.Parameter(typeof(int), "y");

ConstructorInfo ctor = typeof(Point)
    .GetConstructor(new[] { typeof(int), typeof(int) })!;
var newExpr = Expression.New(ctor, xParam, yParam);
var lambda  = Expression.Lambda<Func<int, int, Point>>(newExpr, xParam, yParam);

Console.WriteLine(lambda);   // (x, y) => new Point(x, y)

var factory = lambda.Compile();
Console.WriteLine(factory(3, 4));   // (3, 4)
Console.WriteLine(factory(0, 0));   // (0, 0)`,
    explanation: "`NewExpression` captures a constructor call as a tree node — used by ORMs and mappers to generate efficient compiled factories instead of repeated `Activator.CreateInstance` calls."
  },
  {
    id: "cs-b16-b4-iasync-enumerable-vs-iobservable",
    language: "csharp",
    title: "IObservable vs IAsyncEnumerable vs Channel",
    tag: "families",
    code: `using System;
using System.Collections.Generic;
using System.Runtime.CompilerServices;
using System.Threading;
using System.Threading.Channels;
using System.Threading.Tasks;

// 1. IAsyncEnumerable<T> — pull model, caller controls iteration
async IAsyncEnumerable<int> CountAsync(
        [EnumeratorCancellation] CancellationToken ct = default) {
    for (int i = 0; i < 3; i++) {
        await Task.Delay(10, ct);
        yield return i;
    }
}

async Task Demo() {
    // IAsyncEnumerable: await foreach
    await foreach (var n in CountAsync())
        Console.Write(\`IAsyncEnum:\${n} \`);

    // Channel: producer/consumer with backpressure
    var ch = Channel.CreateBounded<int>(capacity: 5);
    await ch.Writer.WriteAsync(42);
    ch.Writer.Complete();
    Console.Write(\`Channel:\${await ch.Reader.ReadAsync()} \`);
    Console.WriteLine();
}

await Demo();`,
    explanation: "`IAsyncEnumerable<T>` suits pull-based async streams (the consumer controls pace); `Channel<T>` adds backpressure and buffering; `IObservable<T>` is push-based and best for reactive/event streams."
  },
  {
    id: "cs-b16-b4-expression-func-benchmark",
    language: "csharp",
    title: "Expression<Func> vs compiled Func benchmark note",
    tag: "families",
    code: `using System;
using System.Linq.Expressions;
using System.Diagnostics;

// Compile once
Expression<Func<int, int>> expr = x => x * x + 2 * x + 1;
Func<int, int> compiled = expr.Compile();

// Native delegate — same performance as hand-written code
Func<int, int> native = x => x * x + 2 * x + 1;

int N = 1_000_000;

var sw = Stopwatch.StartNew();
int sum1 = 0;
for (int i = 0; i < N; i++) sum1 += compiled(i);
sw.Stop();
Console.WriteLine(\`compiled: \${sw.ElapsedMilliseconds}ms sum=\${sum1}\`);

sw.Restart();
int sum2 = 0;
for (int i = 0; i < N; i++) sum2 += native(i);
sw.Stop();
Console.WriteLine(\`native:   \${sw.ElapsedMilliseconds}ms sum=\${sum2}\`);

// After compilation, perf is essentially identical — compile cost is one-time`,
    explanation: "After `.Compile()`, an expression tree delegate performs identically to a hand-written `Func<T>` — the performance cost is in compilation itself, which is why caching compiled delegates is critical."
  },
  {
    id: "cs-b16-b4-runtime-method-handle",
    language: "csharp",
    title: "RuntimeMethodHandle and TypeHandle introspection",
    tag: "understanding",
    code: `using System;
using System.Reflection;

class Calculator {
    public int Add(int a, int b) => a + b;
}

var mi = typeof(Calculator).GetMethod("Add")!;

// RuntimeMethodHandle: opaque token for the JIT-compiled method
RuntimeMethodHandle rmh = mi.MethodHandle;
Console.WriteLine(\`Method Handle: \${rmh.Value}\`);

// Reconstruct MethodInfo from handle (useful in low-level scenarios)
MethodBase? reconstructed = MethodBase.GetMethodFromHandle(rmh);
Console.WriteLine(reconstructed?.Name);   // Add

// RuntimeTypeHandle: token for the type
RuntimeTypeHandle rth = typeof(Calculator).TypeHandle;
Type? reconstructedType = Type.GetTypeFromHandle(rth);
Console.WriteLine(reconstructedType?.Name);  // Calculator`,
    explanation: "`RuntimeMethodHandle` and `RuntimeTypeHandle` are compact, GC-safe tokens that can be stored in value types or passed across API boundaries — useful for low-overhead caching without holding full `MethodInfo` / `Type` references."
  },
  {
    id: "cs-b16-b4-delegate-vs-interface",
    language: "csharp",
    title: "Delegate vs single-method interface comparison",
    tag: "families",
    code: `using System;

// Single-method interface — verbose, enables polymorphism
interface ITransform {
    string Apply(string input);
}

class UpperCaseTransform : ITransform {
    public string Apply(string input) => input.ToUpper();
}

// Delegate — concise, anonymous, composable with Linq
Func<string, string> upper = s => s.ToUpper();
Func<string, string> trim  = s => s.Trim();

// Compose delegates
Func<string, string> combined = s => upper(trim(s));

ITransform iface = new UpperCaseTransform();
Console.WriteLine(iface.Apply("  hello  "));    // "  HELLO  " — no trim
Console.WriteLine(combined("  hello  "));        // "HELLO"    — trim + upper

// Use interface when: multiple methods, DI, mocking, versioning
// Use delegate when: single operation, lambdas, functional composition`,
    explanation: "Prefer delegates/`Func<T>` for single-operation abstractions and functional pipelines; prefer interfaces when the abstraction has multiple related methods, needs DI registration, or requires mocking in tests."
  },
  {
    id: "cs-b16-b4-lambda-vs-expression",
    language: "csharp",
    title: "LambdaExpression vs Expression<TDelegate>",
    tag: "types",
    code: `using System;
using System.Linq.Expressions;

// Expression<TDelegate>: strongly typed, known delegate type at compile time
Expression<Func<int, int>> typed = x => x * 2;
Console.WriteLine(typed.ReturnType);         // System.Int32
Console.WriteLine(typed.Parameters[0].Type); // System.Int32

Func<int, int> typedFn = typed.Compile();
Console.WriteLine(typedFn(5));               // 10

// LambdaExpression: weakly typed base class, delegate type discovered at runtime
LambdaExpression untyped = typed;  // implicit upcast
Console.WriteLine(untyped.Type);   // Func<int, int>

Delegate untypedDelegate = untyped.Compile();
Console.WriteLine(untypedDelegate.DynamicInvoke(5));  // 10

// Use LambdaExpression when the delegate type is only known at runtime
Console.WriteLine(typed is LambdaExpression);  // True`,
    explanation: "`Expression<TDelegate>` is the compile-time-typed subclass of `LambdaExpression` — use the former when the delegate type is known statically and the latter in APIs that accept expressions of varying types."
  },
  {
    id: "cs-b16-b4-dyn-method-skip-visibility",
    language: "csharp",
    title: "DynamicMethod requires SkipVisibility for private",
    tag: "caveats",
    code: `using System;
using System.Reflection;
using System.Reflection.Emit;

class Secret {
    private static string _value = "hidden";
    private static string GetSecret() => _value;
}

// Without skipVisibility: accessing private members throws VerificationException
var dynMethod = new DynamicMethod(
    name:       "ReadSecret",
    returnType: typeof(string),
    parameterTypes: Type.EmptyTypes,
    // skipVisibility = true: bypasses CLR visibility checks
    owner:      typeof(Secret),
    skipVisibility: true);

ILGenerator il = dynMethod.GetILGenerator();
var field = typeof(Secret).GetField("_value",
    BindingFlags.NonPublic | BindingFlags.Static)!;
il.Emit(OpCodes.Ldsfld, field);
il.Emit(OpCodes.Ret);

var fn = (Func<string>)dynMethod.CreateDelegate(typeof(Func<string>));
Console.WriteLine(fn());  // hidden`,
    explanation: "`skipVisibility: true` on `DynamicMethod` allows emitted IL to access `private` and `protected` members — it requires `ReflectionPermission` in partial-trust environments but is unrestricted in full-trust/.NET 5+ apps."
  },
  {
    id: "cs-b16-b4-source-gen-vs-reflection",
    language: "csharp",
    title: "Reflection vs source generators performance",
    tag: "understanding",
    code: `// Conceptual comparison — actual source generator requires Roslyn SDK

using System;
using System.Reflection;
using System.Text.Json;

record Person(string Name, int Age);

// Reflection-based serialisation: slow path (runtime type discovery)
var p = new Person("Alice", 30);
var propsReflection = typeof(Person).GetProperties();
foreach (var prop in propsReflection)
    Console.WriteLine(\`\${prop.Name}: \${prop.GetValue(p)}\`);

// System.Text.Json source generator: compile-time code generation
// No reflection at runtime — startup faster, AOT compatible
// Usage: [JsonSerializable(typeof(Person))] + JsonSerializerContext
var json = JsonSerializer.Serialize(p);  // may use source gen if configured
Console.WriteLine(json);

// Key differences:
// Reflection: flexible, works on any type, slow first call
// Source generators: fast, AOT-safe, requires known types at compile time`,
    explanation: "Source generators emit serialisation/mapping code at compile time, eliminating startup reflection costs and enabling Native AOT; reflection is more flexible but incompatible with trimming and slower on first use."
  },
  {
    id: "cs-b16-b4-attr-vs-source-gen",
    language: "csharp",
    title: "Attribute vs SourceGenerator vs AOP comparison",
    tag: "families",
    code: `// This file shows CONCEPTS — full source gen requires Roslyn SDK project

using System;

// 1. Attribute + Runtime Reflection: flexible, zero compile-time cost
[AttributeUsage(AttributeTargets.Method)]
class LogAttribute : Attribute {
    public string Level { get; init; } = "Info";
}

class OrderService {
    [Log(Level = "Debug")]
    public void Process(int id) => Console.WriteLine(\`Processing \${id}\`);
}

// To intercept: use a proxy (Castle DynamicProxy / DispatchProxy)
var mi = typeof(OrderService).GetMethod("Process")!;
var attr = mi.GetCustomAttribute<LogAttribute>();
Console.WriteLine(\`Log level: \${attr?.Level}\`);  // Debug

// 2. Source Generator: compile-time code gen, AOT-safe (Roslyn ISourceGenerator)
// 3. PostSharp/AOP: IL weaving post-compile — requires commercial tooling

// Choose:
// Attribute + reflection: quick, no tooling, runtime cost
// Source generator:       zero runtime cost, AOT, needs generator project
// PostSharp:              transparent interception, commercial license`,
    explanation: "Attributes + reflection work anywhere but pay a runtime cost; source generators pay at build time and produce first-class C# code that is trimmer- and AOT-safe; IL weavers like PostSharp are most transparent but require tooling setup."
  },
  {
    id: "cs-b16-b4-composite-disposable",
    language: "csharp",
    title: "CompositeDisposable pattern for cleanup",
    tag: "structures",
    code: `using System;
using System.Collections.Generic;

class CompositeDisposable : IDisposable {
    private readonly List<IDisposable> _disposables = new();
    private bool _disposed;

    public void Add(IDisposable d) => _disposables.Add(d);

    public void Dispose() {
        if (_disposed) return;
        _disposed = true;
        // Dispose in reverse order (LIFO — like a stack)
        for (int i = _disposables.Count - 1; i >= 0; i--)
            _disposables[i].Dispose();
    }
}

class Resource : IDisposable {
    private readonly string _name;
    public Resource(string name) { _name = name; Console.WriteLine(\`Open \${_name}\`); }
    public void Dispose() => Console.WriteLine(\`Close \${_name}\`);
}

using var cleanup = new CompositeDisposable();
cleanup.Add(new Resource("connection"));
cleanup.Add(new Resource("transaction"));
cleanup.Add(new Resource("command"));
Console.WriteLine("Using resources...");
// Dispose: command -> transaction -> connection`,
    explanation: "Disposing in reverse order respects resource dependencies (inner resources depend on outer ones) — the LIFO pattern mirrors stack unwinding and matches how most resource chains are structured."
  },
  {
    id: "cs-b16-b4-iqueryable-provider-pattern",
    language: "csharp",
    title: "LINQ provider IQueryable<T> pattern",
    tag: "structures",
    code: `using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;

// Minimal IQueryable implementation (real providers translate to SQL/Mongo)
class LoggingQuery<T> : IQueryable<T> {
    private readonly IQueryable<T> _inner;

    public LoggingQuery(IQueryable<T> inner) => _inner = inner;

    public Type ElementType => _inner.ElementType;
    public Expression Expression => _inner.Expression;
    public IQueryProvider Provider => new LoggingProvider(_inner.Provider);

    public IEnumerator<T> GetEnumerator() {
        Console.WriteLine("Executing query...");
        return _inner.GetEnumerator();
    }
    IEnumerator IEnumerable.GetEnumerator() => GetEnumerator();

    class LoggingProvider : IQueryProvider {
        private readonly IQueryProvider _inner;
        public LoggingProvider(IQueryProvider inner) => _inner = inner;
        public IQueryable CreateQuery(Expression e) => _inner.CreateQuery(e);
        public IQueryable<TElement> CreateQuery<TElement>(Expression e) =>
            new LoggingQuery<TElement>(_inner.CreateQuery<TElement>(e));
        public object? Execute(Expression e) => _inner.Execute(e);
        public TResult Execute<TResult>(Expression e) => _inner.Execute<TResult>(e);
    }
}

var source = new LoggingQuery<int>(new[] { 1, 2, 3, 4, 5 }.AsQueryable());
var result = source.Where(x => x > 2).ToList();
Console.WriteLine(string.Join(", ", result));`,
    explanation: "An `IQueryable<T>` provider intercepts every LINQ operator by wrapping `Expression` trees through `IQueryProvider.CreateQuery<T>` — real providers translate the tree to SQL, Mongo queries, or other DSLs."
  },
  {
    id: "cs-b16-b4-expression-trees-roslyn-emit",
    language: "csharp",
    title: "Expression trees vs Roslyn vs Reflection.Emit",
    tag: "families",
    code: `// Conceptual comparison of three code-generation approaches

using System;
using System.Linq.Expressions;

// 1. Expression Trees: safe, readable, limited to expression-level constructs
//    No statements (loops, try/catch), no async. Compile() → fast delegate.
Expression<Func<int, int>> expr = x => x * x;
var fn = expr.Compile();
Console.WriteLine(fn(5));   // 25

// 2. Reflection.Emit / DynamicMethod: full IL control, complex, powerful
//    Handles loops, try/catch, generics. Harder to debug.
//    (See DynamicMethod snippet for example)

// 3. Roslyn (Microsoft.CodeAnalysis): full C# compiler pipeline
//    Emit entire assemblies, use any C# feature including async.
//    Slowest to set up; best for full source generation scenarios.

// Decision guide:
// Expression trees → simple predicates, ORM queries, compiled mappers
// Reflection.Emit  → performance-critical runtime code, serialisers
// Roslyn           → full assembly generation, plugins, source generators`,
    explanation: "Expression trees cover the common 80% (predicates, projections); `Reflection.Emit` handles loops and complex IL; Roslyn is the full C# compiler and is appropriate when you need to generate entire classes or assemblies."
  },
  {
    id: "cs-b16-b4-dynamic-object-vs-expando",
    language: "csharp",
    title: "DynamicObject vs ExpandoObject vs Dictionary",
    tag: "families",
    code: `using System;
using System.Dynamic;
using System.Collections.Generic;

// 1. Dictionary<string, object?> — explicit, type-safe key access
var dict = new Dictionary<string, object?> { ["x"] = 1, ["y"] = 2 };
Console.WriteLine(dict["x"]);  // must use ["key"] syntax

// 2. ExpandoObject — dynamic property access over a hidden dictionary
dynamic expando = new ExpandoObject();
expando.x = 1;
expando.y = 2;
Console.WriteLine(expando.x);  // attribute-style access

// 3. DynamicObject — intercept arbitrary operations with custom logic
class Multiplier : DynamicObject {
    public override bool TryGetMember(GetMemberBinder b, out object? result) {
        result = b.Name.Length;  // return the name's length
        return true;
    }
}
dynamic mult = new Multiplier();
Console.WriteLine(mult.Hello);     // 5  (length of "Hello")
Console.WriteLine(mult.Hi);        // 2

// Choose: Dictionary for APIs, ExpandoObject for JSON-like bags,
//         DynamicObject for proxy/interception`,
    explanation: "Use `Dictionary<string,object?>` when serialisation compatibility matters; `ExpandoObject` for quick property bags (it is a dictionary at heart); `DynamicObject` when you need to intercept and transform property access with custom logic."
  },
  {
    id: "cs-b16-b4-no-inlining-tail-call",
    language: "csharp",
    title: "MethodImpl NoInlining prevents tail-call optimisation",
    tag: "caveats",
    code: `using System;
using System.Runtime.CompilerServices;

class RecursionDemo {
    // Without NoInlining: JIT may inline/optimise, changing stack depth
    [MethodImpl(MethodImplOptions.NoInlining)]
    public static long SumDown(long n, long acc = 0) {
        if (n <= 0) return acc;
        return SumDown(n - 1, acc + n);  // tail-recursive form
    }

    // C# JIT does NOT perform tail-call elimination by default.
    // For large n this will StackOverflow.
    // NoInlining also prevents inlining, so stack trace is accurate.
}

try {
    Console.WriteLine(RecursionDemo.SumDown(1000));   // 500500 — ok
    // RecursionDemo.SumDown(1_000_000); // StackOverflowException
} catch (StackOverflowException) {
    Console.WriteLine("Stack overflow!");
}`,
    explanation: "`[MethodImpl(MethodImplOptions.NoInlining)]` prevents the JIT from eliminating the stack frame, making deep recursion *more* likely to overflow — C# does not reliably perform tail-call optimisation, so deeply recursive algorithms need an iterative rewrite."
  },
  {
    id: "cs-b16-b4-reactive-select-where",
    language: "csharp",
    title: "IObservable Select/Where with manual subscription",
    tag: "structures",
    code: `using System;
using System.Collections.Generic;

// Minimal Rx-like extension methods without importing Rx.NET
static class ObservableExt {
    public static IObservable<TOut> Select<TIn, TOut>(
            this IObservable<TIn> src, Func<TIn, TOut> fn) =>
        new SelectObservable<TIn, TOut>(src, fn);

    class SelectObservable<TIn, TOut>(IObservable<TIn> src, Func<TIn, TOut> fn)
            : IObservable<TOut> {
        public IDisposable Subscribe(IObserver<TOut> obs) =>
            src.Subscribe(new SelectObserver(obs, fn));

        class SelectObserver(IObserver<TOut> obs, Func<TIn, TOut> fn)
                : IObserver<TIn> {
            public void OnNext(TIn v) => obs.OnNext(fn(v));
            public void OnError(Exception e) => obs.OnError(e);
            public void OnCompleted() => obs.OnCompleted();
        }
    }
}

class SimpleSubject<T> : IObservable<T>, IObserver<T> {
    private readonly List<IObserver<T>> _obs = new();
    public IDisposable Subscribe(IObserver<T> o) { _obs.Add(o); return new Unsub(() => _obs.Remove(o)); }
    public void OnNext(T v) { foreach (var o in _obs) o.OnNext(v); }
    public void OnError(Exception e) { }
    public void OnCompleted() { }
    record Unsub(Action A) : IDisposable { public void Dispose() => A(); }
}

class Printer<T> : IObserver<T> {
    public void OnNext(T v) => Console.WriteLine(v);
    public void OnError(Exception e) { }
    public void OnCompleted() { }
}

var subject = new SimpleSubject<int>();
subject.Select(x => x * 2).Subscribe(new Printer<int>());
subject.OnNext(3);   // 6
subject.OnNext(10);  // 20`,
    explanation: "Each Rx operator (`Select`, `Where`) wraps the upstream `IObservable` in a new observable that subscribes and transforms — understanding this push-chain pattern explains why Rx pipelines are lazy until subscribed."
  },
  {
    id: "cs-b16-b4-expando-not-serialisable",
    language: "csharp",
    title: "ExpandoObject not serialisable by default",
    tag: "caveats",
    code: `using System;
using System.Dynamic;
using System.Text.Json;
using System.Collections.Generic;

dynamic expando = new ExpandoObject();
expando.Name = "Alice";
expando.Age  = 30;

// WRONG: JsonSerializer sees ExpandoObject, not the properties
string wrong = JsonSerializer.Serialize(expando);
Console.WriteLine(wrong);  // {} — empty! properties not visible

// CORRECT: cast to IDictionary first — the underlying implementation
var dict = (IDictionary<string, object?>)expando;
string correct = JsonSerializer.Serialize(dict);
Console.WriteLine(correct);  // {"Name":"Alice","Age":30}

// Or use Newtonsoft.Json which handles ExpandoObject natively
// JsonConvert.SerializeObject(expando)  -- works out of the box`,
    explanation: "`System.Text.Json` reflects on declared properties, but `ExpandoObject` stores them in a dictionary — always serialise the `IDictionary<string, object?>` cast; Newtonsoft.Json handles this automatically."
  },
];
