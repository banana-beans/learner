import type { LessonContent } from "../python-basics";

export const csharpTier2Lessons: Record<string, LessonContent> = {
  "csharp:t2:classes-objects": {
    nodeId: "csharp:t2:classes-objects",
    title: "Classes & Objects",
    sections: [
      {
        heading: "Defining a Class",
        body: "A class is a blueprint for creating objects. In C#, you define a class with the 'class' keyword, containing fields (data), properties (controlled access to data), methods (behavior), and constructors (initialization logic). Unlike Python, C# requires explicit access modifiers: public (visible everywhere), private (visible only inside the class), protected (visible to subclasses), and internal (visible within the assembly).",
      },
      {
        heading: "Constructors and Properties",
        body: "A constructor is a special method called when you create an object with 'new'. It has the same name as the class and no return type. Properties in C# use get/set accessors to control read/write access. Auto-properties ('public string Name { get; set; }') are the most common shorthand — the compiler generates the backing field. You can make a property read-only by omitting the set accessor or using 'init' for initialization-only.",
      },
      {
        heading: "Creating and Using Objects",
        body: "Create an object with the 'new' keyword: 'var player = new Player(\"Alice\", 100);'. Access public members with the dot operator. C# objects are reference types — assigning one variable to another copies the reference, not the data. This means changes through one reference affect the other.",
      },
    ],
    codeExamples: [
      {
        title: "Defining a class with properties and constructor",
        code: `public class Player
{
    public string Name { get; set; }
    public int Health { get; private set; }
    public int Score { get; set; }

    public Player(string name, int health)
    {
        Name = name;
        Health = health;
        Score = 0;
    }

    public void TakeDamage(int amount)
    {
        Health = Math.Max(0, Health - amount);
    }

    public bool IsAlive => Health > 0;
}`,
        explanation:
          "Properties with { get; private set; } can be read externally but only modified inside the class. 'IsAlive' is an expression-bodied read-only property.",
      },
      {
        title: "Creating and using objects",
        code: `var player = new Player("Alice", 100);
Console.WriteLine(player.Name);     // Alice
Console.WriteLine(player.IsAlive);  // True

player.TakeDamage(30);
Console.WriteLine(player.Health);   // 70

player.Score = 500;
Console.WriteLine($"{player.Name}: {player.Score} pts");`,
        explanation:
          "'new' creates an instance. Access public members with dot notation. private set prevents 'player.Health = 999' from outside the class.",
      },
      {
        title: "Reference type behavior",
        code: `var a = new Player("Bob", 100);
var b = a;  // b references the SAME object

b.Score = 999;
Console.WriteLine(a.Score);  // 999 — same object!`,
        explanation:
          "Classes are reference types. 'b = a' copies the reference, not the object. Both variables point to the same Player instance.",
      },
    ],
    keyTakeaways: [
      "Classes are blueprints; objects are instances created with 'new'",
      "Access modifiers: public, private, protected, internal",
      "Auto-properties '{ get; set; }' generate a backing field automatically",
      "Constructors have the same name as the class and no return type",
      "Classes are reference types — assignment copies the reference, not the object",
    ],
  },

  "csharp:t2:inheritance": {
    nodeId: "csharp:t2:inheritance",
    title: "Inheritance & Polymorphism",
    sections: [
      {
        heading: "Base and Derived Classes",
        body: "Inheritance lets a class (derived/child) inherit members from another class (base/parent). Use a colon after the class name: 'class Dog : Animal'. C# supports single inheritance only — a class can have one base class but implement multiple interfaces. The derived class inherits all public and protected members and can add new ones or override existing behavior.",
      },
      {
        heading: "virtual, override, and abstract",
        body: "To allow a method to be overridden, mark it 'virtual' in the base class. Override it in the derived class with 'override'. An 'abstract' method has no body and forces derived classes to provide an implementation — the class itself must also be marked 'abstract' and cannot be instantiated. Use 'base.MethodName()' to call the parent's implementation from within an override.",
      },
      {
        heading: "Polymorphism in Action",
        body: "Polymorphism means you can treat a derived object as its base type. If you have a list of Animal references and each actual object is a Dog or Cat, calling Speak() invokes the correct override for each type. This is resolved at runtime (dynamic dispatch). The 'sealed' keyword prevents further inheritance of a class or further overriding of a method.",
      },
    ],
    codeExamples: [
      {
        title: "Basic inheritance",
        code: `public class Animal
{
    public string Name { get; set; }

    public Animal(string name) => Name = name;

    public virtual string Speak() => "...";
}

public class Dog : Animal
{
    public string Breed { get; set; }

    public Dog(string name, string breed) : base(name)
    {
        Breed = breed;
    }

    public override string Speak() => "Woof!";
}`,
        explanation:
          "Dog inherits from Animal using ':'. The constructor calls 'base(name)' to initialize the parent. 'override' replaces the virtual Speak() method.",
      },
      {
        title: "Polymorphism with a collection",
        code: `Animal[] animals = {
    new Dog("Rex", "Shepherd"),
    new Cat("Whiskers"),
    new Dog("Buddy", "Retriever"),
};

foreach (var animal in animals)
{
    Console.WriteLine($"{animal.Name}: {animal.Speak()}");
}
// Rex: Woof!
// Whiskers: Meow!
// Buddy: Woof!`,
        explanation:
          "Each Animal reference calls the correct Speak() override based on the actual object type. This is polymorphism — one interface, many behaviors.",
      },
      {
        title: "Abstract classes",
        code: `public abstract class Shape
{
    public abstract double Area();
    public abstract double Perimeter();

    public void PrintInfo()
    {
        Console.WriteLine($"Area: {Area():F2}, Perimeter: {Perimeter():F2}");
    }
}

public class Circle : Shape
{
    public double Radius { get; }
    public Circle(double radius) => Radius = radius;
    public override double Area() => Math.PI * Radius * Radius;
    public override double Perimeter() => 2 * Math.PI * Radius;
}`,
        explanation:
          "Abstract classes can't be instantiated. They define a contract (Area, Perimeter) that concrete classes must implement. Non-abstract methods like PrintInfo are inherited as-is.",
      },
    ],
    keyTakeaways: [
      "Use ':' for inheritance: 'class Dog : Animal'",
      "Mark methods 'virtual' to allow overriding; use 'override' in derived classes",
      "'abstract' classes can't be instantiated and can have abstract methods with no body",
      "'base.Method()' calls the parent implementation from an override",
      "'sealed' prevents further inheritance or overriding",
      "C# supports single class inheritance but multiple interface implementation",
    ],
  },

  "csharp:t2:interfaces": {
    nodeId: "csharp:t2:interfaces",
    title: "Interfaces & Contracts",
    sections: [
      {
        heading: "What Is an Interface?",
        body: "An interface defines a contract — a set of method signatures, properties, and events that implementing classes must provide. Interfaces use the 'interface' keyword and by convention start with 'I': IComparable, IDisposable. Unlike abstract classes, interfaces cannot have constructors or instance state (though C# 8+ allows default method implementations). A class can implement multiple interfaces.",
      },
      {
        heading: "Implementing Interfaces",
        body: "To implement an interface, list it after ':' in the class declaration (after any base class). The class must provide concrete implementations of all interface members. You can implement members explicitly using 'void IInterface.Method()' syntax — explicit implementations are only accessible through the interface type, not the class type. This resolves naming conflicts when implementing multiple interfaces.",
      },
      {
        heading: "IDisposable and the using Statement",
        body: "IDisposable is a critical interface for managing unmanaged resources (files, database connections, network streams). It requires a Dispose() method. The 'using' statement automatically calls Dispose() when the block ends, even if an exception occurs. This is C#'s version of Python's 'with' statement. Modern C# supports 'using declarations' that dispose at the end of the enclosing scope.",
      },
    ],
    codeExamples: [
      {
        title: "Defining and implementing interfaces",
        code: `public interface IMovable
{
    void Move(int x, int y);
    double Speed { get; }
}

public interface IDamageable
{
    void TakeDamage(int amount);
    int Health { get; }
}

public class Enemy : IDamageable, IMovable
{
    public int Health { get; private set; } = 100;
    public double Speed => 5.0;

    public void Move(int x, int y)
        => Console.WriteLine($"Moving to ({x}, {y})");

    public void TakeDamage(int amount)
        => Health = Math.Max(0, Health - amount);
}`,
        explanation:
          "Enemy implements both IDamageable and IMovable. Each interface member must have a public implementation. A class can implement as many interfaces as needed.",
      },
      {
        title: "Programming to an interface",
        code: `void ProcessTargets(IEnumerable<IDamageable> targets)
{
    foreach (var target in targets)
    {
        target.TakeDamage(10);
        Console.WriteLine($"Health: {target.Health}");
    }
}

// Works with any IDamageable: Enemy, Player, Breakable, etc.`,
        explanation:
          "By accepting IDamageable instead of a concrete class, this method works with any type that implements the interface. This is the core of dependency inversion.",
      },
      {
        title: "IDisposable and using statements",
        code: `// using declaration — disposes at end of scope
using var file = new StreamReader("data.txt");
string content = file.ReadToEnd();
Console.WriteLine(content);
// file.Dispose() called automatically here

// Traditional using block
using (var writer = new StreamWriter("output.txt"))
{
    writer.WriteLine("Hello, file!");
} // writer.Dispose() called here`,
        explanation:
          "'using' ensures Dispose() is called even if an exception occurs. The declaration form (no block) disposes at the end of the enclosing scope.",
      },
    ],
    keyTakeaways: [
      "Interfaces define contracts with method signatures and properties",
      "Convention: interface names start with 'I' (IComparable, IDisposable)",
      "A class can implement multiple interfaces but inherit only one class",
      "IDisposable + 'using' ensures resources are cleaned up reliably",
      "Program to interfaces, not implementations, for flexible and testable code",
    ],
  },

  "csharp:t2:generics": {
    nodeId: "csharp:t2:generics",
    title: "Generics",
    sections: [
      {
        heading: "Why Generics?",
        body: "Generics let you write type-safe, reusable code without repeating yourself for each type. Instead of writing separate IntList, StringList, PlayerList classes, you write List<T> once and specify the type when you use it: List<int>, List<string>, List<Player>. The compiler enforces type safety — List<int> will never contain a string. This is similar to TypeScript generics but enforced at compile time.",
      },
      {
        heading: "Generic Classes and Methods",
        body: "Declare a generic class with angle brackets: 'class Box<T> { public T Value { get; set; } }'. Use it as 'var box = new Box<int> { Value = 42 };'. Generic methods work similarly: 'T Max<T>(T a, T b) where T : IComparable<T>'. The type parameter T is a placeholder that becomes a concrete type at usage.",
      },
      {
        heading: "Constraints with where",
        body: "Constraints restrict which types can be used as generic arguments. Common constraints: 'where T : class' (reference type), 'where T : struct' (value type), 'where T : new()' (has parameterless constructor), 'where T : IComparable<T>' (implements an interface), 'where T : BaseClass' (inherits from a class). Multiple constraints can be combined with commas.",
      },
    ],
    codeExamples: [
      {
        title: "A generic class",
        code: `public class Result<T>
{
    public bool Success { get; }
    public T? Value { get; }
    public string? Error { get; }

    private Result(bool success, T? value, string? error)
    {
        Success = success;
        Value = value;
        Error = error;
    }

    public static Result<T> Ok(T value) => new(true, value, null);
    public static Result<T> Fail(string error) => new(false, default, error);
}

// Usage:
var result = Result<int>.Ok(42);
var error = Result<string>.Fail("Not found");`,
        explanation:
          "Result<T> wraps either a success value or an error message. The same class works for any type: Result<int>, Result<string>, Result<Player>, etc.",
      },
      {
        title: "Generic methods with constraints",
        code: `T FindMax<T>(T[] items) where T : IComparable<T>
{
    T max = items[0];
    foreach (var item in items)
    {
        if (item.CompareTo(max) > 0)
            max = item;
    }
    return max;
}

Console.WriteLine(FindMax(new[] { 3, 1, 4, 1, 5 }));  // 5
Console.WriteLine(FindMax(new[] { "c", "a", "b" }));   // c`,
        explanation:
          "The 'where T : IComparable<T>' constraint ensures T has a CompareTo method. Without this, the compiler wouldn't allow the comparison.",
      },
      {
        title: "Multiple type parameters",
        code: `public class Pair<TKey, TValue>
{
    public TKey Key { get; }
    public TValue Value { get; }

    public Pair(TKey key, TValue value)
    {
        Key = key;
        Value = value;
    }
}

var entry = new Pair<string, int>("score", 100);
Console.WriteLine($"{entry.Key}: {entry.Value}");`,
        explanation:
          "Classes can have multiple type parameters. Dictionary<TKey, TValue> is a built-in example. Name parameters descriptively (TKey, TValue, not just T, U).",
      },
    ],
    keyTakeaways: [
      "Generics provide type-safe reusable code: List<T>, Dictionary<TKey, TValue>",
      "Declare with angle brackets: class Box<T>, method T Find<T>()",
      "Constraints (where T : ...) restrict allowed types: class, struct, new(), interfaces",
      "The compiler enforces type safety — no runtime casting needed",
      "Prefer generic types over 'object' to avoid boxing and casting errors",
    ],
  },

  "csharp:t2:exceptions": {
    nodeId: "csharp:t2:exceptions",
    title: "Exception Handling",
    sections: [
      {
        heading: "try / catch / finally",
        body: "C# uses try/catch/finally for structured error handling. The 'try' block contains code that might throw. 'catch' blocks handle specific exception types — you can have multiple catch blocks for different exceptions. 'finally' runs regardless of whether an exception occurred, making it ideal for cleanup. This is similar to Python's try/except/finally but with different syntax.",
      },
      {
        heading: "Exception Types and Hierarchy",
        body: "All exceptions inherit from System.Exception. Common built-in exceptions: ArgumentException (bad argument), ArgumentNullException (null argument), InvalidOperationException (invalid state), NullReferenceException (accessing null), IndexOutOfRangeException, FileNotFoundException, and FormatException. Catch specific exceptions before general ones — catch blocks are evaluated top to bottom.",
      },
      {
        heading: "Custom Exceptions and Best Practices",
        body: "Create custom exceptions by extending Exception. Name them with an 'Exception' suffix: 'class InsufficientFundsException : Exception'. Best practices: throw specific exceptions, never swallow exceptions silently (empty catch blocks), use 'throw;' to rethrow preserving the stack trace (not 'throw ex;'), and use exception filters with 'when' for conditional catches.",
      },
    ],
    codeExamples: [
      {
        title: "try / catch / finally",
        code: `try
{
    Console.Write("Enter a number: ");
    int number = int.Parse(Console.ReadLine()!);
    Console.WriteLine($"Doubled: {number * 2}");
}
catch (FormatException)
{
    Console.WriteLine("That's not a valid number!");
}
catch (OverflowException)
{
    Console.WriteLine("Number too large!");
}
finally
{
    Console.WriteLine("Thanks for trying!");
}`,
        explanation:
          "Multiple catch blocks handle different exception types. 'finally' always executes — use it for cleanup like closing files or connections.",
      },
      {
        title: "Throwing and custom exceptions",
        code: `public class InsufficientFundsException : Exception
{
    public decimal Balance { get; }
    public decimal Amount { get; }

    public InsufficientFundsException(decimal balance, decimal amount)
        : base($"Cannot withdraw {amount:C} from balance of {balance:C}")
    {
        Balance = balance;
        Amount = amount;
    }
}

public void Withdraw(decimal amount)
{
    if (amount <= 0)
        throw new ArgumentException("Amount must be positive", nameof(amount));
    if (amount > Balance)
        throw new InsufficientFundsException(Balance, amount);
    Balance -= amount;
}`,
        explanation:
          "Custom exceptions carry domain-specific data. Use 'nameof()' for parameter names. Call 'base()' to set the message.",
      },
      {
        title: "Exception filters with when",
        code: `try
{
    var response = await httpClient.GetAsync(url);
    response.EnsureSuccessStatusCode();
}
catch (HttpRequestException ex) when (ex.StatusCode == HttpStatusCode.NotFound)
{
    Console.WriteLine("Resource not found");
}
catch (HttpRequestException ex) when (ex.StatusCode == HttpStatusCode.Unauthorized)
{
    Console.WriteLine("Authentication required");
}
catch (HttpRequestException ex)
{
    Console.WriteLine($"HTTP error: {ex.Message}");
}`,
        explanation:
          "'when' filters let you catch the same exception type with different conditions. The exception is only caught if the filter expression is true.",
      },
    ],
    keyTakeaways: [
      "try/catch/finally: catch specific exceptions before general ones",
      "'finally' always executes — perfect for cleanup code",
      "Use 'throw;' to rethrow (preserves stack trace), not 'throw ex;'",
      "Custom exceptions extend Exception and carry domain-specific data",
      "'when' filters enable conditional catch blocks on the same exception type",
      "Never swallow exceptions silently — at minimum, log them",
    ],
  },
};
