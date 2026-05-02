// ============================================================
// Python Tier 5 — Object-Oriented Programming Lessons
// ============================================================

import type { LessonContent } from "./python-basics";

export const pythonOOPLessons: Record<string, LessonContent> = {
  "python:t5:classes-basics": {
    nodeId: "python:t5:classes-basics",
    title: "Classes & Objects",
    sections: [
      {
        heading: "Defining a Class",
        body: "class Name: defines a class. __init__(self, ...) is the initializer — called when you create an instance with Name(...). self refers to the instance and must be the first parameter on instance methods. Attributes are set with self.attr = value.",
      },
      {
        heading: "Methods",
        body: "Functions defined inside a class body become methods. They take self as the first arg automatically when called on an instance: obj.method(x) is sugar for ClassName.method(obj, x). Method calls dispatch on the instance's type.",
      },
      {
        heading: "When To Reach For A Class",
        body: "Use a class when you have data + behavior that operate on it together, or you'll have multiple instances each with their own state. For simple records, dataclasses or namedtuples are lighter. For pure functions, just use functions.",
      },
    ],
    codeExamples: [
      {
        title: "Basic class",
        code: `class Counter:
    def __init__(self, start=0):
        self.count = start

    def step(self):
        self.count += 1
        return self.count

c = Counter()
print(c.step())  # 1
print(c.step())  # 2
print(c.count)   # 2`,
        explanation: "__init__ runs on Counter(). Methods access state via self.attr.",
      },
      {
        title: "Multiple instances are independent",
        code: `class Bag:
    def __init__(self):
        self.items = []

a = Bag()
b = Bag()
a.items.append("x")
print(a.items, b.items)
# ['x'] []`,
        explanation: "Each instance has its own items list because we created it inside __init__.",
      },
      {
        title: "When NOT to use a class",
        code: `# Overkill — just use a function
class Adder:
    def add(self, a, b):
        return a + b

# Better
def add(a, b):
    return a + b

print(add(2, 3))  # 5`,
        explanation: "Classes earn their weight when you have shared state. Pure helpers stay functions.",
      },
    ],
    keyTakeaways: [
      "class Name: defines a class; Name(...) creates an instance",
      "__init__(self, ...) runs at construction",
      "self is the instance — always first parameter on methods",
      "Attributes set in __init__ are per-instance",
      "Don't reach for classes when functions or dataclasses suffice",
    ],
  },

  "python:t5:class-attributes": {
    nodeId: "python:t5:class-attributes",
    title: "Class vs Instance Attributes",
    sections: [
      {
        heading: "Two Kinds Of Attributes",
        body: "Class attributes belong to the class itself and are shared across instances. Instance attributes (set in __init__ or via self) are per-instance. Reading an attribute checks the instance first, then the class.",
      },
      {
        heading: "Mutable Class Attributes Are A Trap",
        body: "If a class attribute is mutable (a list or dict), all instances share the same object. Mutating it from one instance affects all of them. For per-instance state, always initialize in __init__ — never as a class-level mutable.",
      },
      {
        heading: "@classmethod and @staticmethod",
        body: "@classmethod takes cls (the class) instead of self — useful for alternative constructors. @staticmethod takes neither — it's a plain function that lives on the class for organization. Both can be called on the class or an instance.",
      },
    ],
    codeExamples: [
      {
        title: "Class vs instance",
        code: `class Dog:
    species = "Canis familiaris"   # class attribute

    def __init__(self, name):
        self.name = name           # instance attribute

a = Dog("Rex")
b = Dog("Buddy")
print(a.species, b.species)  # same: Canis familiaris
print(a.name, b.name)        # different: Rex Buddy`,
        explanation: "species is shared; name is per-instance.",
      },
      {
        title: "Mutable class attribute trap",
        code: `class BadBag:
    items = []   # WRONG — shared across instances!

a, b = BadBag(), BadBag()
a.items.append("x")
print(b.items)   # ['x'] — bug!

class GoodBag:
    def __init__(self):
        self.items = []   # per-instance

a, b = GoodBag(), GoodBag()
a.items.append("x")
print(b.items)   # []`,
        explanation: "Class-level lists/dicts persist between instances. Always init mutables in __init__.",
      },
      {
        title: "classmethod for alternative constructors",
        code: `class Date:
    def __init__(self, y, m, d):
        self.y, self.m, self.d = y, m, d

    @classmethod
    def from_string(cls, s):
        y, m, d = s.split("-")
        return cls(int(y), int(m), int(d))

    def __repr__(self):
        return f"Date({self.y}, {self.m}, {self.d})"

print(Date.from_string("2024-03-15"))
# Date(2024, 3, 15)`,
        explanation: "from_string is a factory that returns a new instance — use cls to support subclasses.",
      },
    ],
    keyTakeaways: [
      "Class attribute = shared across instances; instance attribute = per-instance",
      "Never use a mutable class attribute as default — init in __init__",
      "@classmethod gets cls, often for alternative constructors",
      "@staticmethod gets neither self nor cls — plain function on the class",
      "Lookup goes: instance → class → bases (MRO)",
    ],
  },

  "python:t5:properties": {
    nodeId: "python:t5:properties",
    title: "Properties",
    sections: [
      {
        heading: "Computed Attributes",
        body: "@property turns a method into a read-only attribute. Access it without parentheses: obj.area, not obj.area(). Useful when you want attribute syntax but the value should be computed (or validated) on every access.",
      },
      {
        heading: "Setters and Validation",
        body: "Define a setter with @attrname.setter. Use it to validate or normalize values before storing. Convention: store the actual value in self._attrname (single underscore = 'protected by convention').",
      },
      {
        heading: "When To Use Them",
        body: "Reach for @property when you need computed values or validation. Don't use them just to wrap plain attributes — that's pointless overhead. Resist the Java getter/setter habit; in Python, public attributes are fine until they aren't.",
      },
    ],
    codeExamples: [
      {
        title: "Read-only computed property",
        code: `class Circle:
    def __init__(self, r):
        self.r = r

    @property
    def area(self):
        return 3.14159 * self.r ** 2

c = Circle(5)
print(c.area)   # 78.53975 — no parens
# c.area = 100  # AttributeError: can't set attribute`,
        explanation: "area is computed on access. Without a setter, it's read-only.",
      },
      {
        title: "Setter with validation",
        code: `class Temperature:
    def __init__(self, celsius=0):
        self.celsius = celsius   # uses the setter

    @property
    def celsius(self):
        return self._celsius

    @celsius.setter
    def celsius(self, value):
        if value < -273.15:
            raise ValueError("below absolute zero")
        self._celsius = value

t = Temperature(20)
t.celsius = 100
print(t.celsius)  # 100
# t.celsius = -300  # ValueError`,
        explanation: "Setter validates before storing. The actual value lives in self._celsius.",
      },
      {
        title: "Don't over-use properties",
        code: `# Overkill
class Pointless:
    def __init__(self, x):
        self._x = x
    @property
    def x(self):
        return self._x
    @x.setter
    def x(self, v):
        self._x = v

# Better
class Point:
    def __init__(self, x):
        self.x = x  # public attribute, simple`,
        explanation: "Use plain attributes by default. Add @property only when you need computation or validation.",
      },
    ],
    keyTakeaways: [
      "@property turns a method into an attribute access",
      "Add @attr.setter for assignment with validation",
      "Convention: store backing value as self._attr",
      "Public attributes are fine — properties are for when you need more",
      "Read property without parens: obj.area, not obj.area()",
    ],
  },

  "python:t5:inheritance": {
    nodeId: "python:t5:inheritance",
    title: "Inheritance",
    sections: [
      {
        heading: "Subclasses Reuse and Specialize",
        body: "class Sub(Base): ... makes Sub inherit Base's methods and attributes. Override by redefining methods in the subclass. isinstance(obj, Base) returns True for instances of Sub too — use issubclass for class-to-class checks.",
      },
      {
        heading: "super() Calls",
        body: "super() returns a proxy that lets you call the parent's version of a method. Use it in __init__ to extend parent initialization, or in any overridden method when you want to add to parent behavior. Always prefer composition over deep inheritance hierarchies.",
      },
      {
        heading: "Method Resolution Order (MRO)",
        body: "With multiple inheritance, Python uses C3 linearization to determine which parent's method gets called. ClassName.__mro__ shows the lookup order. Multiple inheritance is powerful but easy to misuse — keep hierarchies shallow.",
      },
    ],
    codeExamples: [
      {
        title: "Override and extend",
        code: `class Animal:
    def __init__(self, name):
        self.name = name

    def speak(self):
        return f"{self.name} makes a sound"

class Dog(Animal):
    def speak(self):
        return f"{self.name} says woof"

print(Dog("Rex").speak())   # Rex says woof
print(isinstance(Dog("Rex"), Animal))  # True`,
        explanation: "Dog.speak shadows Animal.speak. The dog still has Animal's __init__.",
      },
      {
        title: "Extending with super()",
        code: `class Animal:
    def __init__(self, name):
        self.name = name

class Dog(Animal):
    def __init__(self, name, breed):
        super().__init__(name)
        self.breed = breed

d = Dog("Rex", "Lab")
print(d.name, d.breed)  # Rex Lab`,
        explanation: "super().__init__(name) runs Animal's init first, then Dog adds breed.",
      },
      {
        title: "MRO with multiple inheritance",
        code: `class A: pass
class B(A): pass
class C(A): pass
class D(B, C): pass

print([cls.__name__ for cls in D.__mro__])
# ['D', 'B', 'C', 'A', 'object']`,
        explanation: "C3 ensures each class appears before its parents and respects the bases-list order.",
      },
    ],
    keyTakeaways: [
      "class Sub(Base): ... inherits everything from Base",
      "Override by redefining a method in the subclass",
      "super() lets you call the parent's version",
      "Prefer composition; use inheritance for clear is-a relationships",
      "Multiple inheritance follows MRO (C3 linearization)",
    ],
  },

  "python:t5:dunder-methods": {
    nodeId: "python:t5:dunder-methods",
    title: "Dunder Methods",
    sections: [
      {
        heading: "Customizing Built-In Behavior",
        body: "Dunder ('double underscore') methods like __init__, __repr__, __eq__, __len__ hook your class into Python's syntax and built-ins. Implementing them lets your objects work with print, ==, len(), in, +, and more.",
      },
      {
        heading: "The Essentials",
        body: "__repr__ returns an unambiguous developer string (used by repr() and the REPL). __str__ is a friendly user string (used by str() and print). __eq__ defines equality. __hash__ makes instances hashable. If you override __eq__, also define __hash__ or set it to None.",
      },
      {
        heading: "Operator Overloading",
        body: "__add__ for +, __sub__ for -, __mul__ for *, __lt__ for <, etc. Return NotImplemented (capital N) when you don't support the operation — Python will try the reflected version on the other operand.",
      },
    ],
    codeExamples: [
      {
        title: "__repr__ and __str__",
        code: `class Point:
    def __init__(self, x, y):
        self.x, self.y = x, y

    def __repr__(self):
        return f"Point({self.x!r}, {self.y!r})"

    def __str__(self):
        return f"({self.x}, {self.y})"

p = Point(1, 2)
print(p)        # (1, 2)        — uses __str__
print(repr(p))  # Point(1, 2)   — uses __repr__`,
        explanation: "__repr__ is for developers; __str__ is for users. Always implement at least __repr__.",
      },
      {
        title: "Equality and hashing",
        code: `class Point:
    def __init__(self, x, y):
        self.x, self.y = x, y

    def __eq__(self, other):
        if not isinstance(other, Point):
            return NotImplemented
        return self.x == other.x and self.y == other.y

    def __hash__(self):
        return hash((self.x, self.y))

print(Point(1, 2) == Point(1, 2))  # True
print({Point(1, 2), Point(1, 2)})  # one element`,
        explanation: "If you override __eq__ you should also override __hash__ (or set it to None to forbid hashing).",
      },
      {
        title: "Operator overloading",
        code: `class Vec:
    def __init__(self, x, y):
        self.x, self.y = x, y

    def __add__(self, other):
        return Vec(self.x + other.x, self.y + other.y)

    def __repr__(self):
        return f"Vec({self.x}, {self.y})"

print(Vec(1, 2) + Vec(3, 4))  # Vec(4, 6)`,
        explanation: "__add__ powers +. Return a new Vec rather than mutating self.",
      },
    ],
    keyTakeaways: [
      "Dunders hook into Python syntax and built-ins",
      "Always implement __repr__ — it shows up in tracebacks and debuggers",
      "If you override __eq__, also override __hash__",
      "Return NotImplemented (not raise) when an op isn't supported",
      "Common ones: __init__, __repr__, __str__, __eq__, __hash__, __len__, __add__",
    ],
  },

  "python:t5:abstract-classes": {
    nodeId: "python:t5:abstract-classes",
    title: "Abstract Base Classes",
    sections: [
      {
        heading: "Defining a Contract",
        body: "An ABC declares methods that subclasses must implement. Inherit from ABC (from abc) and decorate methods with @abstractmethod. Trying to instantiate the ABC directly — or a subclass that didn't implement all abstract methods — raises TypeError.",
      },
      {
        heading: "Why Use Them",
        body: "Use ABCs when you want to enforce a shared interface across implementations. Common in plugin systems, strategy patterns, and frameworks. For typing-only contracts (no runtime enforcement), Protocol from typing is often cleaner.",
      },
      {
        heading: "ABC vs Protocol",
        body: "ABC = nominal subtyping (you must inherit). Protocol = structural subtyping (any class with the right methods qualifies, no inheritance needed). Use Protocol for duck typing with type hints; use ABC when you also want to share concrete code.",
      },
    ],
    codeExamples: [
      {
        title: "Basic ABC",
        code: `from abc import ABC, abstractmethod

class Shape(ABC):
    @abstractmethod
    def area(self):
        ...

class Square(Shape):
    def __init__(self, side):
        self.side = side
    def area(self):
        return self.side * self.side

# s = Shape()    # TypeError — abstract
print(Square(4).area())  # 16`,
        explanation: "Shape can't be instantiated. Square fulfills the contract by implementing area.",
      },
      {
        title: "Forgetting to implement",
        code: `from abc import ABC, abstractmethod

class Shape(ABC):
    @abstractmethod
    def area(self): ...

class BadShape(Shape):
    pass  # didn't implement area

try:
    BadShape()
except TypeError as e:
    print(e)
# Can't instantiate abstract class BadShape...`,
        explanation: "Python won't let you instantiate a subclass with unimplemented abstracts.",
      },
      {
        title: "Protocol alternative",
        code: `from typing import Protocol

class HasArea(Protocol):
    def area(self) -> float: ...

class Triangle:
    def area(self) -> float:
        return 0.5 * 3 * 4

def describe(s: HasArea) -> None:
    print(f"area = {s.area()}")

describe(Triangle())  # area = 6.0`,
        explanation: "Triangle doesn't inherit anything but matches HasArea structurally — duck typing with type checking.",
      },
    ],
    keyTakeaways: [
      "Inherit from ABC and use @abstractmethod to define a contract",
      "Subclasses must implement all abstract methods to be instantiable",
      "ABC = nominal (must inherit); Protocol = structural (just need the methods)",
      "Use ABCs when you also share concrete code in the base",
      "Use Protocol from typing for pure duck-typed interfaces",
    ],
  },

  "python:t5:dataclasses": {
    nodeId: "python:t5:dataclasses",
    title: "Dataclasses",
    sections: [
      {
        heading: "Boilerplate-Free Classes",
        body: "@dataclass auto-generates __init__, __repr__, and __eq__ from class-level type annotations. Great for simple data containers. Comes from the dataclasses module in the stdlib (3.7+).",
      },
      {
        heading: "Defaults, Factories, and Frozen",
        body: "Set defaults inline: name: str = 'unknown'. For mutable defaults, use field(default_factory=list). frozen=True makes instances immutable (and hashable). Add slots=True (3.10+) to use __slots__ for memory efficiency.",
      },
      {
        heading: "When To Use",
        body: "Reach for dataclasses for plain data + a few methods. Use NamedTuple for immutable records that act like tuples. Use a regular class when behavior dominates over data. Use Pydantic when you need runtime validation.",
      },
    ],
    codeExamples: [
      {
        title: "Basic dataclass",
        code: `from dataclasses import dataclass

@dataclass
class Point:
    x: int
    y: int

p = Point(3, 4)
print(p)            # Point(x=3, y=4)
print(p == Point(3, 4))  # True`,
        explanation: "__init__, __repr__, and __eq__ are generated from the annotations.",
      },
      {
        title: "Defaults and default_factory",
        code: `from dataclasses import dataclass, field

@dataclass
class User:
    name: str
    tags: list[str] = field(default_factory=list)
    role: str = "guest"

u = User("ada")
u.tags.append("admin")
print(u)
# User(name='ada', tags=['admin'], role='guest')`,
        explanation: "default_factory creates a fresh list per instance — avoids the mutable default trap.",
      },
      {
        title: "Frozen + slots",
        code: `from dataclasses import dataclass

@dataclass(frozen=True, slots=True)
class Coord:
    lat: float
    lng: float

c = Coord(40.7, -74.0)
print({c})  # works because frozen → hashable
# c.lat = 0  # FrozenInstanceError`,
        explanation: "frozen=True makes it immutable + hashable; slots=True saves memory by skipping __dict__.",
      },
    ],
    keyTakeaways: [
      "@dataclass generates __init__, __repr__, __eq__ from annotations",
      "Use field(default_factory=...) for mutable defaults",
      "frozen=True for immutable + hashable instances",
      "slots=True for memory savings (no per-instance __dict__)",
      "Picks: dataclass = data, NamedTuple = tuple-like, Pydantic = validation",
    ],
  },
};
