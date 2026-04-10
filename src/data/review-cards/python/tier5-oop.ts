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

// ────────────────────────────────────────────────────────────
// Tier 5: Object-Oriented Programming (7 nodes, ~25 cards)
// ────────────────────────────────────────────────────────────

export const tier5Cards: ReviewCard[] = [
  // ── python:t5:classes ──────────────────────────────────────
  makeCard({
    id: "card:python:t5:classes:1",
    nodeId: "python:t5:classes",
    branchId: "python",
    type: "concept",
    front: "What is the purpose of __init__ in a Python class and what does 'self' refer to?",
    back: "__init__ is the initializer method called automatically when a new instance is created. It sets up the instance's attributes. 'self' is a reference to the specific instance being created — it is passed automatically as the first argument. By convention it is always named 'self', though Python does not enforce the name.",
  }),
  makeCard({
    id: "card:python:t5:classes:2",
    nodeId: "python:t5:classes",
    branchId: "python",
    type: "code_output",
    front: "What does this code print?",
    code: "class Dog:\n    species = \"Canine\"\n\n    def __init__(self, name):\n        self.name = name\n\na = Dog(\"Rex\")\nb = Dog(\"Max\")\nDog.species = \"Lupus\"\nprint(a.species, b.species)",
    expectedOutput: "Lupus Lupus",
    back: "species is a class attribute shared by all instances. Changing Dog.species changes it for every instance that hasn't overridden it. Both a.species and b.species look up the class attribute and find 'Lupus'. If you did a.species = 'X', only a's instance attribute would change.",
  }),
  makeCard({
    id: "card:python:t5:classes:3",
    nodeId: "python:t5:classes",
    branchId: "python",
    type: "fill_blank",
    front: "Fill in the blanks to define a class with an instance method and a class method.",
    code: "class Counter:\n    total = 0\n\n    def __init__(self):\n        self.count = 0\n\n    def increment(self):\n        self.count += 1\n        Counter.total += 1\n\n    @__BLANK__\n    def get_total(__BLANK__):\n        return cls.total",
    blanks: ["classmethod", "cls"],
    back: "@classmethod makes a method that receives the class (cls) as its first argument instead of an instance (self). Class methods can access and modify class-level state. They are commonly used as alternative constructors or to operate on shared class data.",
  }),
  makeCard({
    id: "card:python:t5:classes:4",
    nodeId: "python:t5:classes",
    branchId: "python",
    type: "bug_spot",
    front: "Find the bug in this code.",
    code: "class Circle:\n    def __init__(self, radius):\n        self.radius = radius\n\n    def area():\n        return 3.14159 * self.radius ** 2\n\nc = Circle(5)\nprint(c.area())",
    back: "The area method is missing 'self' as its first parameter. It should be 'def area(self):'. Without it, Python passes the instance as the first positional argument, which causes a TypeError because area() takes 0 arguments but 1 was given.",
  }),

  // ── python:t5:encapsulation ────────────────────────────────
  makeCard({
    id: "card:python:t5:encapsulation:1",
    nodeId: "python:t5:encapsulation",
    branchId: "python",
    type: "concept",
    front: "How does Python handle private attributes? What is name mangling?",
    back: "Python has no true private attributes. A single underscore prefix (_attr) is a convention meaning 'internal, use at your own risk'. A double underscore prefix (__attr) triggers name mangling: Python renames it to _ClassName__attr to avoid accidental access in subclasses. It can still be accessed externally via the mangled name. This is 'we are all consenting adults' — privacy is by convention, not enforcement.",
  }),
  makeCard({
    id: "card:python:t5:encapsulation:2",
    nodeId: "python:t5:encapsulation",
    branchId: "python",
    type: "code_output",
    front: "What does this code print?",
    code: "class Vault:\n    def __init__(self):\n        self.__secret = 42\n\nv = Vault()\nprint(v._Vault__secret)\nprint(hasattr(v, \"__secret\"))",
    expectedOutput: "42\nFalse",
    back: "Name mangling transforms __secret into _Vault__secret. The mangled name works (42), but hasattr(v, '__secret') returns False because the attribute literally does not exist under that name. This shows that double-underscore 'privacy' is just name mangling, not true access control.",
  }),
  makeCard({
    id: "card:python:t5:encapsulation:3",
    nodeId: "python:t5:encapsulation",
    branchId: "python",
    type: "code_output",
    front: "What does this code print?",
    code: "class Temperature:\n    def __init__(self, celsius):\n        self._celsius = celsius\n\n    @property\n    def fahrenheit(self):\n        return self._celsius * 9/5 + 32\n\nt = Temperature(100)\nprint(t.fahrenheit)",
    expectedOutput: "212.0",
    back: "@property turns a method into a read-only attribute — you access it as t.fahrenheit (no parentheses), but it runs the method behind the scenes. 100 * 9/5 + 32 = 212.0. Properties are the Pythonic way to add getters/setters without changing the public API.",
  }),
  makeCard({
    id: "card:python:t5:encapsulation:4",
    nodeId: "python:t5:encapsulation",
    branchId: "python",
    type: "explain",
    front: "Explain the @property decorator and how to create a setter with it.",
    back: "@property defines a getter — a method accessed like an attribute. To add a setter, use @attr_name.setter. Example: @property def x(self): return self._x, then @x.setter def x(self, value): self._x = value. This lets you add validation or computation to attribute access while keeping the clean attribute syntax. You can also add @x.deleter for del obj.x behavior.",
  }),

  // ── python:t5:inheritance ──────────────────────────────────
  makeCard({
    id: "card:python:t5:inheritance:1",
    nodeId: "python:t5:inheritance",
    branchId: "python",
    type: "code_output",
    front: "What does this code print?",
    code: "class Animal:\n    def speak(self):\n        return \"...\"\n\nclass Dog(Animal):\n    def speak(self):\n        return \"Woof!\"\n\nclass Puppy(Dog):\n    pass\n\nprint(Puppy().speak())\nprint(isinstance(Puppy(), Animal))",
    expectedOutput: "Woof!\nTrue",
    back: "Puppy inherits from Dog, which inherits from Animal. Since Puppy has no speak() method, Python searches up the MRO: it finds Dog.speak() and returns 'Woof!'. isinstance checks the entire inheritance chain, so a Puppy is an Animal (True).",
  }),
  makeCard({
    id: "card:python:t5:inheritance:2",
    nodeId: "python:t5:inheritance",
    branchId: "python",
    type: "code_output",
    front: "What does this code print?",
    code: "class Base:\n    def __init__(self):\n        print(\"Base\")\n\nclass Child(Base):\n    def __init__(self):\n        super().__init__()\n        print(\"Child\")\n\nc = Child()",
    expectedOutput: "Base\nChild",
    back: "super().__init__() calls the parent class's __init__. The Base __init__ prints 'Base' first, then execution returns to Child's __init__ which prints 'Child'. Without the super() call, Base.__init__ would not run and any setup it does would be skipped.",
  }),
  makeCard({
    id: "card:python:t5:inheritance:3",
    nodeId: "python:t5:inheritance",
    branchId: "python",
    type: "concept",
    front: "What is the Method Resolution Order (MRO) and how can you view it?",
    back: "The MRO defines the order in which Python searches for methods in a class hierarchy, especially with multiple inheritance. Python uses the C3 linearization algorithm. You can view it with ClassName.__mro__ or ClassName.mro(). For single inheritance, the order is straightforward (child -> parent -> grandparent). For multiple inheritance, C3 ensures a consistent, predictable order.",
  }),

  // ── python:t5:polymorphism ─────────────────────────────────
  makeCard({
    id: "card:python:t5:polymorphism:1",
    nodeId: "python:t5:polymorphism",
    branchId: "python",
    type: "concept",
    front: "What is duck typing in Python and how does it relate to polymorphism?",
    back: "'If it walks like a duck and quacks like a duck, it is a duck.' In Python, polymorphism does not require inheritance — any object that has the required methods/attributes can be used. A function that calls obj.read() works with files, StringIO, BytesIO, or any custom class with a read() method. This is called duck typing: the type is determined by behavior, not by class hierarchy.",
  }),
  makeCard({
    id: "card:python:t5:polymorphism:2",
    nodeId: "python:t5:polymorphism",
    branchId: "python",
    type: "code_output",
    front: "What does this code print?",
    code: "class Cat:\n    def sound(self): return \"Meow\"\n\nclass Duck:\n    def sound(self): return \"Quack\"\n\ndef make_noise(animal):\n    print(animal.sound())\n\nfor a in [Cat(), Duck(), Cat()]:\n    make_noise(a)",
    expectedOutput: "Meow\nQuack\nMeow",
    back: "make_noise works with any object that has a sound() method — it does not care about the class hierarchy. Cat and Duck are unrelated classes, but both implement sound(). This is polymorphism via duck typing: the interface is implicit, not enforced by inheritance.",
  }),
  makeCard({
    id: "card:python:t5:polymorphism:3",
    nodeId: "python:t5:polymorphism",
    branchId: "python",
    type: "explain",
    front: "Explain the difference between isinstance() checks and duck typing. When would you prefer each?",
    back: "isinstance() checks explicit class identity — it verifies an object belongs to a specific class or its subclasses. Duck typing checks nothing — it just calls the method and lets an AttributeError occur if it is missing. Prefer duck typing for flexible, decoupled code (most Python code). Use isinstance() when you need type safety (e.g., validating user input, serialization, or when different types require fundamentally different handling, not just different method implementations).",
  }),

  // ── python:t5:dunder-methods ───────────────────────────────
  makeCard({
    id: "card:python:t5:dunder-methods:1",
    nodeId: "python:t5:dunder-methods",
    branchId: "python",
    type: "code_output",
    front: "What does this code print?",
    code: "class Vec:\n    def __init__(self, x, y):\n        self.x, self.y = x, y\n\n    def __add__(self, other):\n        return Vec(self.x + other.x, self.y + other.y)\n\n    def __repr__(self):\n        return f\"Vec({self.x}, {self.y})\"\n\nprint(Vec(1, 2) + Vec(3, 4))",
    expectedOutput: "Vec(4, 6)",
    back: "__add__ is called when using the + operator. It receives the right operand as 'other'. A new Vec is created with (1+3, 2+4) = (4, 6). __repr__ defines how the object is displayed when printed, returning 'Vec(4, 6)'.",
  }),
  makeCard({
    id: "card:python:t5:dunder-methods:2",
    nodeId: "python:t5:dunder-methods",
    branchId: "python",
    type: "concept",
    front: "What is the difference between __str__ and __repr__?",
    back: "__repr__ should return an unambiguous string, ideally valid Python that could recreate the object. It is used by repr() and the REPL. __str__ should return a human-readable string, used by str() and print(). If only one is defined, __repr__ is the fallback. Best practice: always define __repr__; add __str__ only if you need a different user-facing display.",
  }),
  makeCard({
    id: "card:python:t5:dunder-methods:3",
    nodeId: "python:t5:dunder-methods",
    branchId: "python",
    type: "code_output",
    front: "What does this code print?",
    code: "class Bag:\n    def __init__(self, items):\n        self.items = list(items)\n\n    def __len__(self):\n        return len(self.items)\n\n    def __contains__(self, item):\n        return item in self.items\n\nb = Bag([1, 2, 3])\nprint(len(b))\nprint(2 in b)\nprint(bool(b))",
    expectedOutput: "3\nTrue\nTrue",
    back: "len(b) calls __len__ -> 3. '2 in b' calls __contains__ -> True. bool(b) checks __bool__ first; since it is not defined, it falls back to __len__. A non-zero length means truthy, so bool(b) is True. If __len__ returned 0, bool(b) would be False.",
  }),
  makeCard({
    id: "card:python:t5:dunder-methods:4",
    nodeId: "python:t5:dunder-methods",
    branchId: "python",
    type: "fill_blank",
    front: "Fill in the blanks to make a class that supports iteration.",
    code: "class Countdown:\n    def __init__(self, start):\n        self.start = start\n\n    def __BLANK__(self):\n        self.n = self.start\n        return self\n\n    def __BLANK__(self):\n        if self.n <= 0:\n            raise StopIteration\n        self.n -= 1\n        return self.n + 1",
    blanks: ["__iter__", "__next__"],
    back: "__iter__ returns the iterator object (usually self) and is called when you start a for loop. __next__ returns the next value and raises StopIteration when exhausted. Together, they make the class iterable: for x in Countdown(3) yields 3, 2, 1.",
  }),

  // ── python:t5:abstract-classes ─────────────────────────────
  makeCard({
    id: "card:python:t5:abstract-classes:1",
    nodeId: "python:t5:abstract-classes",
    branchId: "python",
    type: "concept",
    front: "What is an abstract base class (ABC) and why would you use one?",
    back: "An ABC is a class that cannot be instantiated directly — it defines an interface that subclasses must implement. Use the abc module: inherit from ABC and decorate methods with @abstractmethod. If a subclass does not implement all abstract methods, instantiation raises TypeError. ABCs enforce contracts: they guarantee that any subclass provides certain methods, making code more predictable than relying on duck typing alone.",
  }),
  makeCard({
    id: "card:python:t5:abstract-classes:2",
    nodeId: "python:t5:abstract-classes",
    branchId: "python",
    type: "code_output",
    front: "What does this code print?",
    code: "from abc import ABC, abstractmethod\n\nclass Shape(ABC):\n    @abstractmethod\n    def area(self): ...\n\nclass Square(Shape):\n    def __init__(self, s):\n        self.s = s\n    def area(self):\n        return self.s ** 2\n\nprint(Square(4).area())\nprint(isinstance(Square(4), Shape))",
    expectedOutput: "16\nTrue",
    back: "Square implements the abstract area() method, so it can be instantiated. 4**2 = 16. Square is a subclass of Shape, so isinstance returns True. If area() were not implemented, Square(4) would raise TypeError: 'Can't instantiate abstract class Square with abstract method area'.",
  }),
  makeCard({
    id: "card:python:t5:abstract-classes:3",
    nodeId: "python:t5:abstract-classes",
    branchId: "python",
    type: "bug_spot",
    front: "Find the bug in this code.",
    code: "from abc import ABC, abstractmethod\n\nclass Logger(ABC):\n    @abstractmethod\n    def log(self, msg): ...\n\nclass FileLogger(Logger):\n    def write(self, msg):\n        print(f\"FILE: {msg}\")\n\nfl = FileLogger()\nfl.write(\"test\")",
    back: "FileLogger does not implement the abstract method log() — it defines write() instead. Attempting to instantiate FileLogger() raises TypeError. The fix is to rename write to log, or add a log method that delegates to write. ABCs enforce that all abstract methods are implemented.",
  }),

  // ── python:t5:dataclasses ──────────────────────────────────
  makeCard({
    id: "card:python:t5:dataclasses:1",
    nodeId: "python:t5:dataclasses",
    branchId: "python",
    type: "concept",
    front: "What does the @dataclass decorator do and what methods does it automatically generate?",
    back: "@dataclass (from the dataclasses module) automatically generates __init__, __repr__, and __eq__ based on class-level annotated fields. It reduces boilerplate for classes that primarily store data. Optional features include ordering (order=True generates __lt__, __le__, etc.), immutability (frozen=True), and hashing (unsafe_hash=True).",
  }),
  makeCard({
    id: "card:python:t5:dataclasses:2",
    nodeId: "python:t5:dataclasses",
    branchId: "python",
    type: "code_output",
    front: "What does this code print?",
    code: "from dataclasses import dataclass\n\n@dataclass\nclass Point:\n    x: float\n    y: float\n    z: float = 0.0\n\np1 = Point(1.0, 2.0)\np2 = Point(1.0, 2.0)\nprint(p1)\nprint(p1 == p2)",
    expectedOutput: "Point(x=1.0, y=2.0, z=0.0)\nTrue",
    back: "The auto-generated __repr__ produces Point(x=1.0, y=2.0, z=0.0). The auto-generated __eq__ compares all fields, so p1 == p2 is True because all values match. z defaults to 0.0 because a default was provided in the field definition.",
  }),
  makeCard({
    id: "card:python:t5:dataclasses:3",
    nodeId: "python:t5:dataclasses",
    branchId: "python",
    type: "code_output",
    front: "What does this code print?",
    code: "from dataclasses import dataclass, field\n\n@dataclass\nclass Config:\n    name: str\n    tags: list = field(default_factory=list)\n\na = Config(\"A\")\nb = Config(\"B\")\na.tags.append(\"x\")\nprint(a.tags, b.tags)",
    expectedOutput: "['x'] []",
    back: "field(default_factory=list) creates a new empty list for each instance, avoiding the mutable default argument problem. Without it, all instances would share the same list (and @dataclass raises an error if you use a bare mutable default). a and b have independent tag lists.",
  }),
  makeCard({
    id: "card:python:t5:dataclasses:4",
    nodeId: "python:t5:dataclasses",
    branchId: "python",
    type: "fill_blank",
    front: "Fill in the blank to make a frozen (immutable) dataclass.",
    code: "from dataclasses import dataclass\n\n@dataclass(__BLANK__=True)\nclass Color:\n    r: int\n    g: int\n    b: int\n\nc = Color(255, 0, 0)\nprint(c)",
    blanks: ["frozen"],
    back: "frozen=True makes instances immutable — attempting to set any attribute after creation raises FrozenInstanceError. Frozen dataclasses are hashable by default, so they can be used as dictionary keys or set elements. This is useful for value objects that should not change.",
  }),
];
