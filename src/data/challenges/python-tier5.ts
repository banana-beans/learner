// ============================================================
// Python Tier 5 — OOP Challenges
// ============================================================

import type { Challenge } from "@/lib/types";

export const pythonTier5Challenges: Challenge[] = [
  {
    id: "py-t5-cls-1",
    nodeId: "python:t5:classes-basics",
    type: "write_from_scratch",
    title: "Bank account",
    description:
      "Define class Account with __init__(self, balance=0), deposit(amount), and withdraw(amount). withdraw should raise ValueError('insufficient') if amount > balance. Create Account(100), deposit(50), then print balance. Expected: 150",
    difficulty: 2,
    isBoss: true,
    starterCode: `# define Account, then exercise it
`,
    testCases: [{ id: "tc1", input: "", expectedOutput: "150", visible: true, category: "basic" }],
    hints: [
      { tier: "nudge", text: "Store balance as self.balance.", xpPenalty: 0.9 },
      { tier: "guide", text: "deposit increases self.balance; withdraw decreases.", xpPenalty: 0.75 },
      { tier: "reveal", text: `class Account:
    def __init__(self, balance=0):
        self.balance = balance
    def deposit(self, amount):
        self.balance += amount
    def withdraw(self, amount):
        if amount > self.balance:
            raise ValueError("insufficient")
        self.balance -= amount

a = Account(100)
a.deposit(50)
print(a.balance)`, xpPenalty: 0.5 },
    ],
    baseXP: 150,
    tags: ["class", "instance", "method"],
  },
  {
    id: "py-t5-attr-1",
    nodeId: "python:t5:class-attributes",
    type: "write_from_scratch",
    title: "Class counter",
    description:
      "Define class Widget with a class attribute count = 0 incremented in __init__. Create three Widget()s and print Widget.count. Expected: 3",
    difficulty: 2,
    isBoss: false,
    starterCode: `# class attribute that counts instances
`,
    testCases: [{ id: "tc1", input: "", expectedOutput: "3", visible: true, category: "basic" }],
    hints: [
      { tier: "nudge", text: "In __init__, increment Widget.count (not self.count).", xpPenalty: 0.9 },
      { tier: "guide", text: "Class attribute is set on the class itself, accessed as Widget.count.", xpPenalty: 0.75 },
      { tier: "reveal", text: `class Widget:
    count = 0
    def __init__(self):
        Widget.count += 1

Widget(); Widget(); Widget()
print(Widget.count)`, xpPenalty: 0.5 },
    ],
    baseXP: 150,
    tags: ["class-attribute"],
  },
  {
    id: "py-t5-prop-1",
    nodeId: "python:t5:properties",
    type: "write_from_scratch",
    title: "Validated temperature",
    description:
      "Define class Temp with a celsius property. Setter raises ValueError if value < -273.15. Construct Temp(20), set t.celsius = 100, print t.celsius. Expected: 100",
    difficulty: 3,
    isBoss: true,
    starterCode: `# property + setter with validation
`,
    testCases: [{ id: "tc1", input: "", expectedOutput: "100", visible: true, category: "basic" }],
    hints: [
      { tier: "nudge", text: "Use @property and @celsius.setter.", xpPenalty: 0.9 },
      { tier: "guide", text: "Store the actual value in self._celsius.", xpPenalty: 0.75 },
      { tier: "reveal", text: `class Temp:
    def __init__(self, celsius=0):
        self.celsius = celsius
    @property
    def celsius(self):
        return self._celsius
    @celsius.setter
    def celsius(self, value):
        if value < -273.15:
            raise ValueError("below absolute zero")
        self._celsius = value

t = Temp(20)
t.celsius = 100
print(t.celsius)`, xpPenalty: 0.5 },
    ],
    baseXP: 250,
    tags: ["property", "setter", "validation"],
  },
  {
    id: "py-t5-inh-1",
    nodeId: "python:t5:inheritance",
    type: "write_from_scratch",
    title: "Dog speaks",
    description:
      "Define Animal with speak() returning 'sound'. Define Dog(Animal) overriding speak() to return 'woof'. Print Dog().speak(). Expected: woof",
    difficulty: 1,
    isBoss: false,
    starterCode: `# Animal -> Dog override
`,
    testCases: [{ id: "tc1", input: "", expectedOutput: "woof", visible: true, category: "basic" }],
    hints: [
      { tier: "nudge", text: "class Dog(Animal): redefines speak.", xpPenalty: 0.9 },
      { tier: "guide", text: "Method dispatch picks the most-derived definition.", xpPenalty: 0.75 },
      { tier: "reveal", text: `class Animal:
    def speak(self):
        return "sound"

class Dog(Animal):
    def speak(self):
        return "woof"

print(Dog().speak())`, xpPenalty: 0.5 },
    ],
    baseXP: 100,
    tags: ["inheritance", "override"],
  },
  {
    id: "py-t5-dunder-1",
    nodeId: "python:t5:dunder-methods",
    type: "write_from_scratch",
    title: "Vec2 add",
    description:
      "Define Vec2 with x, y. Implement __add__ to return a new Vec2. Implement __repr__ as 'Vec2(x, y)'. Print Vec2(1, 2) + Vec2(3, 4). Expected: Vec2(4, 6)",
    difficulty: 3,
    isBoss: true,
    starterCode: `# Vec2 with __add__ and __repr__
`,
    testCases: [{ id: "tc1", input: "", expectedOutput: "Vec2(4, 6)", visible: true, category: "basic" }],
    hints: [
      { tier: "nudge", text: "__add__(self, other) returns a new Vec2.", xpPenalty: 0.9 },
      { tier: "guide", text: "__repr__ returns a string.", xpPenalty: 0.75 },
      { tier: "reveal", text: `class Vec2:
    def __init__(self, x, y):
        self.x, self.y = x, y
    def __add__(self, other):
        return Vec2(self.x + other.x, self.y + other.y)
    def __repr__(self):
        return f"Vec2({self.x}, {self.y})"

print(Vec2(1, 2) + Vec2(3, 4))`, xpPenalty: 0.5 },
    ],
    baseXP: 250,
    tags: ["dunder", "operator-overloading"],
  },
  {
    id: "py-t5-abc-1",
    nodeId: "python:t5:abstract-classes",
    type: "write_from_scratch",
    title: "Shape contract",
    description:
      "Define abstract Shape(ABC) with abstract method area(). Implement Square(side) returning side*side. Print Square(5).area(). Expected: 25",
    difficulty: 2,
    isBoss: false,
    starterCode: `from abc import ABC, abstractmethod
`,
    testCases: [{ id: "tc1", input: "", expectedOutput: "25", visible: true, category: "basic" }],
    hints: [
      { tier: "nudge", text: "@abstractmethod above the area() method.", xpPenalty: 0.9 },
      { tier: "guide", text: "Square inherits Shape and implements area.", xpPenalty: 0.75 },
      { tier: "reveal", text: `from abc import ABC, abstractmethod

class Shape(ABC):
    @abstractmethod
    def area(self):
        ...

class Square(Shape):
    def __init__(self, side):
        self.side = side
    def area(self):
        return self.side * self.side

print(Square(5).area())`, xpPenalty: 0.5 },
    ],
    baseXP: 150,
    tags: ["abc", "abstract"],
  },
  {
    id: "py-t5-dc-1",
    nodeId: "python:t5:dataclasses",
    type: "write_from_scratch",
    title: "Point dataclass",
    description:
      "Use @dataclass to define Point(x: int, y: int). Print Point(3, 4) — its repr should match Expected.",
    difficulty: 1,
    isBoss: false,
    starterCode: `from dataclasses import dataclass
`,
    testCases: [{ id: "tc1", input: "", expectedOutput: "Point(x=3, y=4)", visible: true, category: "basic" }],
    hints: [
      { tier: "nudge", text: "@dataclass above the class.", xpPenalty: 0.9 },
      { tier: "guide", text: "Annotations alone are enough — no __init__ needed.", xpPenalty: 0.75 },
      { tier: "reveal", text: `from dataclasses import dataclass

@dataclass
class Point:
    x: int
    y: int

print(Point(3, 4))`, xpPenalty: 0.5 },
    ],
    baseXP: 100,
    tags: ["dataclass"],
  },
];
