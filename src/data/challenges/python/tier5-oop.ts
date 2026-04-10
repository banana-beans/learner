import type { Challenge } from "@/lib/types";

/**
 * Tier 5: Object-Oriented Programming — 25 challenges across 7 nodes
 *
 * Nodes: classes, encapsulation, inheritance, polymorphism,
 *        dunder-methods, abstract-classes, dataclasses
 */
export const tier5Challenges: Challenge[] = [
  // ────────────────────────────────────────────────────────────
  // python:t5:classes  (4 challenges)
  // ────────────────────────────────────────────────────────────
  {
    id: "challenge:python:t5:classes:1",
    nodeId: "python:t5:classes",
    type: "write_from_scratch",
    title: "Basic Class",
    description: "Create a `Dog` class with `__init__(self, name, breed)` that stores name and breed as attributes. Add a `bark()` method that returns `'<name> says Woof!'`.",
    difficulty: 1,
    isBoss: false,
    starterCode: "class Dog:\n    # Your code here\n    pass\n",
    testCases: [
      { id: "c1-1", input: 'd = Dog("Rex", "Lab")\nprint(d.name)\nprint(d.bark())', expectedOutput: "Rex\nRex says Woof!", visible: true, category: "basic" },
      { id: "c1-2", input: 'd = Dog("Buddy", "Poodle")\nprint(d.breed)', expectedOutput: "Poodle", visible: false, category: "basic" },
    ],
    hints: [
      { tier: "nudge", text: "Use __init__ to set self.name and self.breed.", xpPenalty: 0.9 },
      { tier: "guide", text: "Define __init__(self, name, breed) and bark(self) methods.", xpPenalty: 0.75 },
      { tier: "reveal", text: "def __init__(self, name, breed):\n    self.name = name\n    self.breed = breed\ndef bark(self):\n    return f'{self.name} says Woof!'", xpPenalty: 0.5 },
    ],
    baseXP: 100,
    tags: ["classes", "__init__", "methods"],
  },
  {
    id: "challenge:python:t5:classes:2",
    nodeId: "python:t5:classes",
    type: "predict_output",
    title: "Class vs Instance",
    description: "What does this code print?",
    difficulty: 2,
    isBoss: false,
    starterCode: "class Counter:\n    count = 0\n    def __init__(self):\n        Counter.count += 1\n\na = Counter()\nb = Counter()\nc = Counter()\nprint(Counter.count)\nprint(a.count)",
    options: [
      { id: "a", text: "3\n3", isCorrect: true, explanation: "count is a class attribute shared by all instances. It's incremented 3 times. a.count looks up the class attribute." },
      { id: "b", text: "3\n1", isCorrect: false, explanation: "a.count accesses the class attribute (3), not a separate instance count." },
      { id: "c", text: "1\n1", isCorrect: false, explanation: "The class attribute is shared and incremented each time __init__ runs." },
      { id: "d", text: "Error", isCorrect: false, explanation: "This is valid Python using class attributes." },
    ],
    hints: [
      { tier: "nudge", text: "Class attributes are shared across all instances.", xpPenalty: 0.9 },
      { tier: "guide", text: "Counter.count is incremented 3 times. Instance lookup falls through to class.", xpPenalty: 0.75 },
      { tier: "reveal", text: "Both print 3 because count is a class attribute, shared by all.", xpPenalty: 0.5 },
    ],
    baseXP: 150,
    tags: ["classes", "class-attribute", "instance"],
  },
  {
    id: "challenge:python:t5:classes:3",
    nodeId: "python:t5:classes",
    type: "write_from_scratch",
    title: "Bank Account",
    description: "Create a `BankAccount` class with `__init__(self, owner, balance=0)`. Add methods `deposit(amount)` and `withdraw(amount)`. Withdraw should return False and not change balance if insufficient funds. Both methods return the new balance on success.",
    difficulty: 3,
    isBoss: true,
    starterCode: "class BankAccount:\n    # Your code here\n    pass\n",
    testCases: [
      { id: "c3-1", input: 'a = BankAccount("Alice", 100)\nprint(a.deposit(50))\nprint(a.withdraw(30))\nprint(a.withdraw(200))', expectedOutput: "150\n120\nFalse", visible: true, category: "basic" },
      { id: "c3-2", input: 'b = BankAccount("Bob")\nprint(b.balance)\nprint(b.deposit(0))', expectedOutput: "0\n0", visible: false, category: "edge" },
    ],
    hints: [
      { tier: "nudge", text: "Store balance as self.balance and update it in deposit/withdraw.", xpPenalty: 0.9 },
      { tier: "guide", text: "In withdraw, check if amount > self.balance before subtracting.", xpPenalty: 0.75 },
      { tier: "reveal", text: "def withdraw(self, amount):\n    if amount > self.balance:\n        return False\n    self.balance -= amount\n    return self.balance", xpPenalty: 0.5 },
    ],
    baseXP: 250,
    tags: ["classes", "methods", "state"],
  },

  // ────────────────────────────────────────────────────────────
  // python:t5:encapsulation  (3 challenges)
  // ────────────────────────────────────────────────────────────
  {
    id: "challenge:python:t5:encapsulation:1",
    nodeId: "python:t5:encapsulation",
    type: "multiple_choice",
    title: "Name Mangling",
    description: "What happens when you prefix an attribute with double underscores (`__attr`) in Python?",
    difficulty: 2,
    isBoss: false,
    options: [
      { id: "a", text: "It becomes truly private and inaccessible from outside", isCorrect: false, explanation: "Python doesn't have true private — it uses name mangling (_ClassName__attr)." },
      { id: "b", text: "Python name-mangles it to _ClassName__attr, making it harder to access accidentally", isCorrect: true, explanation: "Double underscore triggers name mangling as a convention to signal 'internal use'." },
      { id: "c", text: "It becomes a read-only attribute", isCorrect: false, explanation: "Read-only requires @property. Double underscore is about name mangling." },
      { id: "d", text: "It creates a class attribute instead of an instance attribute", isCorrect: false, explanation: "Name mangling doesn't change where the attribute is stored." },
    ],
    hints: [
      { tier: "nudge", text: "Python uses a convention-based approach to privacy, not enforcement.", xpPenalty: 0.9 },
      { tier: "guide", text: "Double underscore triggers 'name mangling' — Python renames the attribute.", xpPenalty: 0.75 },
      { tier: "reveal", text: "__attr becomes _ClassName__attr — accessible but discouraged.", xpPenalty: 0.5 },
    ],
    baseXP: 150,
    tags: ["encapsulation", "name-mangling", "private"],
  },
  {
    id: "challenge:python:t5:encapsulation:2",
    nodeId: "python:t5:encapsulation",
    type: "write_from_scratch",
    title: "Temperature Property",
    description: "Create a `Temperature` class that stores Celsius internally. Use `@property` for `fahrenheit` that converts (F = C * 9/5 + 32). Add a `fahrenheit` setter that converts back (C = (F - 32) * 5/9).",
    difficulty: 3,
    isBoss: false,
    starterCode: "class Temperature:\n    def __init__(self, celsius):\n        self.celsius = celsius\n\n    # Add fahrenheit property and setter\n",
    testCases: [
      { id: "e2-1", input: "t = Temperature(100)\nprint(t.fahrenheit)", expectedOutput: "212.0", visible: true, category: "basic" },
      { id: "e2-2", input: "t = Temperature(0)\nt.fahrenheit = 98.6\nprint(round(t.celsius, 1))", expectedOutput: "37.0", visible: true, category: "basic" },
    ],
    hints: [
      { tier: "nudge", text: "Use @property to define a getter and @attr.setter for a setter.", xpPenalty: 0.9 },
      { tier: "guide", text: "@property\ndef fahrenheit(self): return self.celsius * 9/5 + 32", xpPenalty: 0.75 },
      { tier: "reveal", text: "@property\ndef fahrenheit(self):\n    return self.celsius * 9/5 + 32\n@fahrenheit.setter\ndef fahrenheit(self, f):\n    self.celsius = (f - 32) * 5/9", xpPenalty: 0.5 },
    ],
    baseXP: 250,
    tags: ["property", "getter", "setter", "encapsulation"],
  },
  {
    id: "challenge:python:t5:encapsulation:3",
    nodeId: "python:t5:encapsulation",
    type: "write_from_scratch",
    title: "Validated Attribute",
    description: "Create a `Person` class where `age` uses a property to validate that it's between 0 and 150. Raise `ValueError` with message 'Age must be 0-150' for invalid values. Set age in __init__.",
    difficulty: 4,
    isBoss: true,
    starterCode: "class Person:\n    def __init__(self, name, age):\n        self.name = name\n        self.age = age  # Should trigger validation\n\n    # Add age property\n",
    testCases: [
      { id: "e3-1", input: 'p = Person("Alice", 25)\nprint(p.age)', expectedOutput: "25", visible: true, category: "basic" },
      { id: "e3-2", input: 'try:\n    Person("Bob", -1)\nexcept ValueError as e:\n    print(e)', expectedOutput: "Age must be 0-150", visible: true, category: "edge" },
    ],
    hints: [
      { tier: "nudge", text: "Use @property and @age.setter with validation in the setter.", xpPenalty: 0.9 },
      { tier: "guide", text: "Store in self._age. The setter checks 0 <= value <= 150.", xpPenalty: 0.75 },
      { tier: "reveal", text: "@property\ndef age(self): return self._age\n@age.setter\ndef age(self, v):\n    if not 0 <= v <= 150: raise ValueError('Age must be 0-150')\n    self._age = v", xpPenalty: 0.5 },
    ],
    baseXP: 350,
    tags: ["property", "validation", "encapsulation"],
  },

  // ────────────────────────────────────────────────────────────
  // python:t5:inheritance  (4 challenges)
  // ────────────────────────────────────────────────────────────
  {
    id: "challenge:python:t5:inheritance:1",
    nodeId: "python:t5:inheritance",
    type: "write_from_scratch",
    title: "Simple Inheritance",
    description: "Create `Animal(name)` with a `speak()` that returns 'Some sound'. Then create `Cat(Animal)` that overrides `speak()` to return '<name> says Meow'.",
    difficulty: 2,
    isBoss: false,
    starterCode: "class Animal:\n    pass\n\nclass Cat(Animal):\n    pass\n",
    testCases: [
      { id: "i1-1", input: 'c = Cat("Whiskers")\nprint(c.speak())', expectedOutput: "Whiskers says Meow", visible: true, category: "basic" },
      { id: "i1-2", input: 'a = Animal("Critter")\nprint(a.speak())', expectedOutput: "Some sound", visible: true, category: "basic" },
    ],
    hints: [
      { tier: "nudge", text: "Cat inherits from Animal and overrides the speak() method.", xpPenalty: 0.9 },
      { tier: "guide", text: "Animal.__init__ stores self.name. Cat.speak returns f'{self.name} says Meow'.", xpPenalty: 0.75 },
      { tier: "reveal", text: "class Animal:\n    def __init__(self, name): self.name = name\n    def speak(self): return 'Some sound'\nclass Cat(Animal):\n    def speak(self): return f'{self.name} says Meow'", xpPenalty: 0.5 },
    ],
    baseXP: 150,
    tags: ["inheritance", "override"],
  },
  {
    id: "challenge:python:t5:inheritance:2",
    nodeId: "python:t5:inheritance",
    type: "fill_in_the_blank",
    title: "super() Call",
    description: "Fill in the blanks to use super() to call the parent __init__.",
    difficulty: 2,
    isBoss: false,
    templateCode: "class Shape:\n    def __init__(self, color):\n        self.color = color\n\nclass Circle(Shape):\n    def __init__(self, color, radius):\n        __BLANK__().__BLANK__(color)\n        self.radius = radius\n\nc = Circle('red', 5)\nprint(c.color, c.radius)",
    testCases: [
      { id: "i2-1", input: "", expectedOutput: "red 5", visible: true, category: "basic" },
    ],
    hints: [
      { tier: "nudge", text: "super() gives access to the parent class.", xpPenalty: 0.9 },
      { tier: "guide", text: "Call super().__init__(color) to invoke the parent constructor.", xpPenalty: 0.75 },
      { tier: "reveal", text: "Blanks: `super` and `__init__`", xpPenalty: 0.5 },
    ],
    baseXP: 150,
    tags: ["inheritance", "super"],
  },
  {
    id: "challenge:python:t5:inheritance:3",
    nodeId: "python:t5:inheritance",
    type: "write_from_scratch",
    title: "Employee Hierarchy",
    description: "Create `Employee(name, salary)` with a `pay()` method returning salary. Create `Manager(Employee)` that adds a `bonus` parameter and overrides `pay()` to return salary + bonus. Use super().__init__.",
    difficulty: 4,
    isBoss: true,
    starterCode: "class Employee:\n    pass\n\nclass Manager(Employee):\n    pass\n",
    testCases: [
      { id: "i3-1", input: 'e = Employee("Alice", 50000)\nprint(e.pay())', expectedOutput: "50000", visible: true, category: "basic" },
      { id: "i3-2", input: 'm = Manager("Bob", 60000, 10000)\nprint(m.pay())\nprint(m.name)', expectedOutput: "70000\nBob", visible: true, category: "basic" },
    ],
    hints: [
      { tier: "nudge", text: "Manager's __init__ should call super().__init__(name, salary) then set self.bonus.", xpPenalty: 0.9 },
      { tier: "guide", text: "Manager.pay() returns self.salary + self.bonus.", xpPenalty: 0.75 },
      { tier: "reveal", text: "class Manager(Employee):\n    def __init__(self, name, salary, bonus):\n        super().__init__(name, salary)\n        self.bonus = bonus\n    def pay(self): return self.salary + self.bonus", xpPenalty: 0.5 },
    ],
    baseXP: 350,
    tags: ["inheritance", "super", "override"],
  },

  // ────────────────────────────────────────────────────────────
  // python:t5:polymorphism  (3 challenges)
  // ────────────────────────────────────────────────────────────
  {
    id: "challenge:python:t5:polymorphism:1",
    nodeId: "python:t5:polymorphism",
    type: "write_from_scratch",
    title: "Shape Areas",
    description: "Create `Rectangle(w, h)` and `Circle(r)` classes, both with an `area()` method. Then write `total_area(shapes)` that returns the sum of all areas. Use math.pi for Circle.",
    difficulty: 3,
    isBoss: false,
    starterCode: "import math\n\nclass Rectangle:\n    pass\n\nclass Circle:\n    pass\n\ndef total_area(shapes):\n    pass\n",
    testCases: [
      { id: "p1-1", input: "shapes = [Rectangle(3, 4), Circle(5), Rectangle(2, 2)]\nprint(round(total_area(shapes), 2))", expectedOutput: "94.54", visible: true, category: "basic" },
    ],
    hints: [
      { tier: "nudge", text: "Each class implements area() differently — Rectangle uses w*h, Circle uses pi*r^2.", xpPenalty: 0.9 },
      { tier: "guide", text: "total_area calls .area() on each shape — polymorphism handles the rest.", xpPenalty: 0.75 },
      { tier: "reveal", text: "def total_area(shapes): return sum(s.area() for s in shapes)", xpPenalty: 0.5 },
    ],
    baseXP: 250,
    tags: ["polymorphism", "duck-typing"],
  },
  {
    id: "challenge:python:t5:polymorphism:2",
    nodeId: "python:t5:polymorphism",
    type: "multiple_choice",
    title: "Duck Typing",
    description: "What is 'duck typing' in Python?",
    difficulty: 2,
    isBoss: false,
    options: [
      { id: "a", text: "If an object has the right methods, it can be used regardless of its class", isCorrect: true, explanation: "'If it walks like a duck and quacks like a duck, it's a duck.' Python cares about behavior, not type." },
      { id: "b", text: "A special type annotation for dynamic values", isCorrect: false, explanation: "Duck typing is a runtime concept, not a type annotation." },
      { id: "c", text: "A class that inherits from Duck", isCorrect: false, explanation: "Duck typing is about behavior, not inheritance." },
      { id: "d", text: "Using isinstance() to check types before operations", isCorrect: false, explanation: "That's type checking — the opposite of duck typing." },
    ],
    hints: [
      { tier: "nudge", text: "Think about the saying: 'If it walks like a duck...'", xpPenalty: 0.9 },
      { tier: "guide", text: "Python checks if an object has the right methods, not its class.", xpPenalty: 0.75 },
      { tier: "reveal", text: "Duck typing: behavior over type. If it has the methods, it works.", xpPenalty: 0.5 },
    ],
    baseXP: 150,
    tags: ["polymorphism", "duck-typing"],
  },
  {
    id: "challenge:python:t5:polymorphism:3",
    nodeId: "python:t5:polymorphism",
    type: "write_from_scratch",
    title: "Serializer",
    description: "Create `JSONSerializer` and `CSVSerializer` classes, each with a `serialize(data)` method. JSON returns '{\"key\": value}' pairs. CSV returns 'key,value' lines. `data` is a dict. Then write `export(serializer, data)` that calls serialize.",
    difficulty: 4,
    isBoss: true,
    starterCode: "import json\n\nclass JSONSerializer:\n    pass\n\nclass CSVSerializer:\n    pass\n\ndef export(serializer, data):\n    pass\n",
    testCases: [
      { id: "p3-1", input: 'print(export(JSONSerializer(), {"a": 1, "b": 2}))', expectedOutput: '{"a": 1, "b": 2}', visible: true, category: "basic" },
      { id: "p3-2", input: 'print(export(CSVSerializer(), {"name": "Alice", "age": 30}))', expectedOutput: "name,Alice\nage,30", visible: true, category: "basic" },
    ],
    hints: [
      { tier: "nudge", text: "Both serializers implement serialize(data) — polymorphism lets export() call it.", xpPenalty: 0.9 },
      { tier: "guide", text: "JSON: use json.dumps(data). CSV: join key,value with newlines.", xpPenalty: 0.75 },
      { tier: "reveal", text: "class JSONSerializer:\n    def serialize(self, data): return json.dumps(data)\nclass CSVSerializer:\n    def serialize(self, data): return '\\n'.join(f'{k},{v}' for k,v in data.items())\ndef export(s, d): return s.serialize(d)", xpPenalty: 0.5 },
    ],
    baseXP: 350,
    tags: ["polymorphism", "serialization", "strategy-pattern"],
  },

  // ────────────────────────────────────────────────────────────
  // python:t5:dunder-methods  (4 challenges)
  // ────────────────────────────────────────────────────────────
  {
    id: "challenge:python:t5:dunder-methods:1",
    nodeId: "python:t5:dunder-methods",
    type: "write_from_scratch",
    title: "__str__ and __repr__",
    description: "Create a `Point(x, y)` class. `__repr__` returns `Point(x, y)` and `__str__` returns `(x, y)`.",
    difficulty: 2,
    isBoss: false,
    starterCode: "class Point:\n    pass\n",
    testCases: [
      { id: "dm1-1", input: "p = Point(3, 4)\nprint(str(p))\nprint(repr(p))", expectedOutput: "(3, 4)\nPoint(3, 4)", visible: true, category: "basic" },
    ],
    hints: [
      { tier: "nudge", text: "Define __str__ and __repr__ methods on the class.", xpPenalty: 0.9 },
      { tier: "guide", text: "__str__ returns f'({self.x}, {self.y})', __repr__ returns f'Point({self.x}, {self.y})'.", xpPenalty: 0.75 },
      { tier: "reveal", text: "def __str__(self): return f'({self.x}, {self.y})'\ndef __repr__(self): return f'Point({self.x}, {self.y})'", xpPenalty: 0.5 },
    ],
    baseXP: 150,
    tags: ["dunder", "__str__", "__repr__"],
  },
  {
    id: "challenge:python:t5:dunder-methods:2",
    nodeId: "python:t5:dunder-methods",
    type: "write_from_scratch",
    title: "Vector Addition",
    description: "Create a `Vector(x, y)` class with `__add__` that returns a new Vector, and `__str__` that returns `Vector(x, y)`.",
    difficulty: 3,
    isBoss: false,
    starterCode: "class Vector:\n    pass\n",
    testCases: [
      { id: "dm2-1", input: "v1 = Vector(1, 2)\nv2 = Vector(3, 4)\nprint(v1 + v2)", expectedOutput: "Vector(4, 6)", visible: true, category: "basic" },
      { id: "dm2-2", input: "v = Vector(0, 0) + Vector(-1, 5)\nprint(v)", expectedOutput: "Vector(-1, 5)", visible: false, category: "edge" },
    ],
    hints: [
      { tier: "nudge", text: "__add__ is called when you use + between two objects.", xpPenalty: 0.9 },
      { tier: "guide", text: "def __add__(self, other): return Vector(self.x + other.x, self.y + other.y)", xpPenalty: 0.75 },
      { tier: "reveal", text: "class Vector:\n    def __init__(self, x, y): self.x, self.y = x, y\n    def __add__(self, o): return Vector(self.x+o.x, self.y+o.y)\n    def __str__(self): return f'Vector({self.x}, {self.y})'", xpPenalty: 0.5 },
    ],
    baseXP: 250,
    tags: ["dunder", "__add__", "operator-overloading"],
  },
  {
    id: "challenge:python:t5:dunder-methods:3",
    nodeId: "python:t5:dunder-methods",
    type: "write_from_scratch",
    title: "Comparable Money",
    description: "Create a `Money(amount, currency)` class with `__eq__`, `__lt__`, `__le__` for same-currency comparison. Raise `ValueError` if currencies differ.",
    difficulty: 4,
    isBoss: true,
    starterCode: "class Money:\n    pass\n",
    testCases: [
      { id: "dm3-1", input: 'print(Money(10, "USD") == Money(10, "USD"))\nprint(Money(5, "USD") < Money(10, "USD"))', expectedOutput: "True\nTrue", visible: true, category: "basic" },
      { id: "dm3-2", input: 'try:\n    Money(10, "USD") < Money(5, "EUR")\nexcept ValueError as e:\n    print(e)', expectedOutput: "Cannot compare USD and EUR", visible: true, category: "edge" },
    ],
    hints: [
      { tier: "nudge", text: "Implement __eq__, __lt__, __le__ and check currencies match.", xpPenalty: 0.9 },
      { tier: "guide", text: "In each comparison, if self.currency != other.currency, raise ValueError.", xpPenalty: 0.75 },
      { tier: "reveal", text: "def __lt__(self, o):\n    if self.currency != o.currency: raise ValueError(f'Cannot compare {self.currency} and {o.currency}')\n    return self.amount < o.amount", xpPenalty: 0.5 },
    ],
    baseXP: 350,
    tags: ["dunder", "comparison", "__eq__", "__lt__"],
  },

  // ────────────────────────────────────────────────────────────
  // python:t5:abstract-classes  (3 challenges)
  // ────────────────────────────────────────────────────────────
  {
    id: "challenge:python:t5:abstract-classes:1",
    nodeId: "python:t5:abstract-classes",
    type: "fill_in_the_blank",
    title: "ABC Basics",
    description: "Fill in the blanks to create an abstract base class with an abstract method.",
    difficulty: 2,
    isBoss: false,
    templateCode: "from abc import __BLANK__, abstractmethod\n\nclass Shape(__BLANK__):\n    @__BLANK__\n    def area(self):\n        pass\n\nclass Square(Shape):\n    def __init__(self, side):\n        self.side = side\n    def area(self):\n        return self.side ** 2\n\nprint(Square(4).area())",
    testCases: [
      { id: "ab1-1", input: "", expectedOutput: "16", visible: true, category: "basic" },
    ],
    hints: [
      { tier: "nudge", text: "Python's abc module provides ABC and abstractmethod.", xpPenalty: 0.9 },
      { tier: "guide", text: "Import ABC, inherit from ABC, and use @abstractmethod.", xpPenalty: 0.75 },
      { tier: "reveal", text: "Blanks: `ABC`, `ABC`, `abstractmethod`", xpPenalty: 0.5 },
    ],
    baseXP: 150,
    tags: ["abc", "abstract", "interface"],
  },
  {
    id: "challenge:python:t5:abstract-classes:2",
    nodeId: "python:t5:abstract-classes",
    type: "write_from_scratch",
    title: "Payment Interface",
    description: "Create an abstract `PaymentProcessor` with abstract methods `charge(amount)` and `refund(amount)`. Create `StripeProcessor` that prints 'Stripe: charged $X' / 'Stripe: refunded $X' and returns True.",
    difficulty: 3,
    isBoss: true,
    starterCode: "from abc import ABC, abstractmethod\n\n# Your code here\n",
    testCases: [
      { id: "ab2-1", input: "s = StripeProcessor()\nprint(s.charge(50))\nprint(s.refund(10))", expectedOutput: "Stripe: charged $50\nTrue\nStripe: refunded $10\nTrue", visible: true, category: "basic" },
      { id: "ab2-2", input: "try:\n    PaymentProcessor()\nexcept TypeError:\n    print('Cannot instantiate')", expectedOutput: "Cannot instantiate", visible: true, category: "edge" },
    ],
    hints: [
      { tier: "nudge", text: "ABC subclasses with abstract methods can't be instantiated directly.", xpPenalty: 0.9 },
      { tier: "guide", text: "PaymentProcessor(ABC) with @abstractmethod on charge and refund. StripeProcessor implements both.", xpPenalty: 0.75 },
      { tier: "reveal", text: "class PaymentProcessor(ABC):\n    @abstractmethod\n    def charge(self, amount): ...\n    @abstractmethod\n    def refund(self, amount): ...\nclass StripeProcessor(PaymentProcessor):\n    def charge(self, amount): print(f'Stripe: charged ${amount}'); return True\n    def refund(self, amount): print(f'Stripe: refunded ${amount}'); return True", xpPenalty: 0.5 },
    ],
    baseXP: 250,
    tags: ["abc", "abstract", "interface", "design-pattern"],
  },

  // ────────────────────────────────────────────────────────────
  // python:t5:dataclasses  (3 challenges)
  // ────────────────────────────────────────────────────────────
  {
    id: "challenge:python:t5:dataclasses:1",
    nodeId: "python:t5:dataclasses",
    type: "write_from_scratch",
    title: "Basic Dataclass",
    description: "Create a `Product` dataclass with fields: name (str), price (float), in_stock (bool, default True). Print a product.",
    difficulty: 1,
    isBoss: false,
    starterCode: "from dataclasses import dataclass\n\n# Your code here\n",
    testCases: [
      { id: "dc1-1", input: 'p = Product("Widget", 9.99)\nprint(p)\nprint(p.in_stock)', expectedOutput: "Product(name='Widget', price=9.99, in_stock=True)\nTrue", visible: true, category: "basic" },
    ],
    hints: [
      { tier: "nudge", text: "Use @dataclass decorator and define fields with type annotations.", xpPenalty: 0.9 },
      { tier: "guide", text: "@dataclass\nclass Product:\n    name: str\n    price: float\n    in_stock: bool = True", xpPenalty: 0.75 },
      { tier: "reveal", text: "@dataclass\nclass Product:\n    name: str\n    price: float\n    in_stock: bool = True", xpPenalty: 0.5 },
    ],
    baseXP: 100,
    tags: ["dataclasses", "type-annotations"],
  },
  {
    id: "challenge:python:t5:dataclasses:2",
    nodeId: "python:t5:dataclasses",
    type: "write_from_scratch",
    title: "Frozen Dataclass",
    description: "Create a frozen `Coordinate` dataclass with x and y floats. Add a `distance_to(other)` method that returns the Euclidean distance. Frozen means instances are immutable.",
    difficulty: 3,
    isBoss: false,
    starterCode: "from dataclasses import dataclass\nimport math\n\n# Your code here\n",
    testCases: [
      { id: "dc2-1", input: "c1 = Coordinate(0, 0)\nc2 = Coordinate(3, 4)\nprint(c1.distance_to(c2))", expectedOutput: "5.0", visible: true, category: "basic" },
      { id: "dc2-2", input: "c = Coordinate(1, 2)\ntry:\n    c.x = 5\nexcept Exception:\n    print('Frozen')", expectedOutput: "Frozen", visible: true, category: "edge" },
    ],
    hints: [
      { tier: "nudge", text: "Use @dataclass(frozen=True) to make instances immutable.", xpPenalty: 0.9 },
      { tier: "guide", text: "distance = math.sqrt((self.x - other.x)**2 + (self.y - other.y)**2)", xpPenalty: 0.75 },
      { tier: "reveal", text: "@dataclass(frozen=True)\nclass Coordinate:\n    x: float\n    y: float\n    def distance_to(self, other):\n        return math.sqrt((self.x-other.x)**2 + (self.y-other.y)**2)", xpPenalty: 0.5 },
    ],
    baseXP: 250,
    tags: ["dataclasses", "frozen", "immutable"],
  },
  {
    id: "challenge:python:t5:dataclasses:3",
    nodeId: "python:t5:dataclasses",
    type: "write_from_scratch",
    title: "Inventory System",
    description: "Create `Item(name, price, quantity)` and `Inventory` dataclasses. Inventory has items: list[Item] (default empty). Add methods: `add_item(item)`, `total_value()` (sum of price*quantity), and `find(name)` returning the item or None.",
    difficulty: 4,
    isBoss: true,
    starterCode: "from dataclasses import dataclass, field\n\n# Your code here\n",
    testCases: [
      { id: "dc3-1", input: 'inv = Inventory()\ninv.add_item(Item("Apple", 1.50, 10))\ninv.add_item(Item("Banana", 0.75, 20))\nprint(inv.total_value())\nprint(inv.find("Apple").price)', expectedOutput: "30.0\n1.5", visible: true, category: "basic" },
      { id: "dc3-2", input: 'inv = Inventory()\nprint(inv.find("Nothing"))', expectedOutput: "None", visible: false, category: "edge" },
    ],
    hints: [
      { tier: "nudge", text: "Use field(default_factory=list) for mutable default values in dataclasses.", xpPenalty: 0.9 },
      { tier: "guide", text: "items: list[Item] = field(default_factory=list). Methods go inside the dataclass.", xpPenalty: 0.75 },
      { tier: "reveal", text: "@dataclass\nclass Inventory:\n    items: list = field(default_factory=list)\n    def add_item(self, item): self.items.append(item)\n    def total_value(self): return sum(i.price*i.quantity for i in self.items)\n    def find(self, name): return next((i for i in self.items if i.name == name), None)", xpPenalty: 0.5 },
    ],
    baseXP: 350,
    tags: ["dataclasses", "field", "default_factory"],
  },
];
