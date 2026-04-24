import type { Challenge } from "@/lib/types";

/**
 * Tier 3: TypeScript Advanced — 12 challenges across 4 nodes
 *
 * Nodes: mapped-types, classes, modules-declarations, async-types
 */
export const tsTier3Challenges: Challenge[] = [
  // ────────────────────────────────────────────────────────────
  // typescript:t3:mapped-types  (3 challenges)
  // ────────────────────────────────────────────────────────────
  {
    id: "challenge:typescript:t3:mapped-types:1",
    nodeId: "typescript:t3:mapped-types",
    type: "multiple_choice",
    title: "Understanding Partial<T>",
    description:
      'Given:\n\n```typescript\ninterface User {\n  name: string;\n  age: number;\n  email: string;\n}\n\nconst update: Partial<User> = { age: 31 };\n```\n\nWhy does this compile without errors?',
    difficulty: 2,
    isBoss: false,
    options: [
      {
        id: "a",
        text: "Partial<User> makes all properties optional, so only providing `age` is valid",
        isCorrect: true,
        explanation:
          "Partial<T> maps every property of T to be optional (adds `?`), so you can provide any subset of properties.",
      },
      {
        id: "b",
        text: "Partial<User> removes all type checks from User",
        isCorrect: false,
        explanation:
          "Partial still enforces that provided properties match their original types. It only makes them optional.",
      },
      {
        id: "c",
        text: "Partial<User> converts User to the `any` type",
        isCorrect: false,
        explanation:
          "Partial preserves the property types; it just adds `?` to each one.",
      },
      {
        id: "d",
        text: "TypeScript ignores missing properties on all object types",
        isCorrect: false,
        explanation:
          "TypeScript enforces required properties by default. Partial specifically opts out of that.",
      },
    ],
    hints: [
      { tier: "nudge", text: "Think about what the name \"Partial\" implies about the properties.", xpPenalty: 0.9 },
      { tier: "guide", text: "Partial<T> is a mapped type that applies `?` to every property of T.", xpPenalty: 0.75 },
      { tier: "reveal", text: "Partial<User> is equivalent to { name?: string; age?: number; email?: string }.", xpPenalty: 0.5 },
    ],
    baseXP: 150,
    tags: ["mapped-types", "partial", "utility-types"],
  },
  {
    id: "challenge:typescript:t3:mapped-types:2",
    nodeId: "typescript:t3:mapped-types",
    type: "write_from_scratch",
    title: "Build a Readonly Mapped Type",
    description:
      "Without using the built-in `Readonly<T>`, define your own mapped type `MyReadonly<T>` that makes all properties of `T` readonly.\n\nThen demonstrate it by creating:\n```\ninterface Todo { title: string; done: boolean; }\n```\n\nCreate a `MyReadonly<Todo>` object and print its `title` and `done` values.",
    difficulty: 3,
    isBoss: false,
    starterCode: "// Define MyReadonly<T> and demonstrate it\n\n",
    testCases: [
      {
        id: "mt2-basic",
        input: "",
        expectedOutput: "Learn TypeScript\nfalse",
        visible: true,
        category: "basic",
        description: "Should print title and done values",
      },
    ],
    hints: [
      { tier: "nudge", text: "Mapped types iterate over keys with `[K in keyof T]`.", xpPenalty: 0.9 },
      { tier: "guide", text: "Add the `readonly` modifier before the property in the mapped type: `readonly [K in keyof T]: T[K]`.", xpPenalty: 0.75 },
      { tier: "reveal", text: "type MyReadonly<T> = { readonly [K in keyof T]: T[K] };\ninterface Todo { title: string; done: boolean; }\nconst todo: MyReadonly<Todo> = { title: \"Learn TypeScript\", done: false };\nconsole.log(todo.title);\nconsole.log(todo.done);", xpPenalty: 0.5 },
    ],
    baseXP: 250,
    tags: ["mapped-types", "readonly", "keyof", "generics"],
  },
  {
    id: "challenge:typescript:t3:mapped-types:3",
    nodeId: "typescript:t3:mapped-types",
    type: "write_from_scratch",
    title: "Pick and Record",
    description:
      "Using the built-in utility types:\n\n1. Define an interface `User` with `name: string`, `age: number`, `email: string`, and `role: string`.\n2. Create a type `UserPreview` using `Pick<User, \"name\" | \"role\">`.\n3. Create a type `UserMap` using `Record<string, UserPreview>`.\n4. Create a `UserMap` object with two entries:\n   - Key `\"u1\"`: `{ name: \"Alice\", role: \"admin\" }`\n   - Key `\"u2\"`: `{ name: \"Bob\", role: \"viewer\" }`\n5. Print `users[\"u1\"].name` and `users[\"u2\"].role`.",
    difficulty: 4,
    isBoss: true,
    starterCode: "// Define User, UserPreview, UserMap and demonstrate\n\n",
    testCases: [
      {
        id: "mt3-basic",
        input: "",
        expectedOutput: "Alice\nviewer",
        visible: true,
        category: "basic",
        description: "Alice's name and Bob's role",
      },
    ],
    hints: [
      { tier: "nudge", text: "Pick<T, Keys> creates a type with only the selected properties. Record<K, V> creates a map type.", xpPenalty: 0.9 },
      { tier: "guide", text: "type UserPreview = Pick<User, \"name\" | \"role\">;\ntype UserMap = Record<string, UserPreview>;", xpPenalty: 0.75 },
      { tier: "reveal", text: "interface User { name: string; age: number; email: string; role: string; }\ntype UserPreview = Pick<User, \"name\" | \"role\">;\ntype UserMap = Record<string, UserPreview>;\nconst users: UserMap = {\n  u1: { name: \"Alice\", role: \"admin\" },\n  u2: { name: \"Bob\", role: \"viewer\" },\n};\nconsole.log(users[\"u1\"].name);\nconsole.log(users[\"u2\"].role);", xpPenalty: 0.5 },
    ],
    baseXP: 350,
    tags: ["mapped-types", "pick", "record", "utility-types"],
  },

  // ────────────────────────────────────────────────────────────
  // typescript:t3:classes  (3 challenges)
  // ────────────────────────────────────────────────────────────
  {
    id: "challenge:typescript:t3:classes:1",
    nodeId: "typescript:t3:classes",
    type: "fill_in_the_blank",
    title: "Class Access Modifiers",
    description:
      "Fill in the blanks with the correct access modifier so that `name` is accessible outside the class but `id` is only accessible within the class.",
    difficulty: 2,
    isBoss: false,
    templateCode: 'class Employee {\n  __BLANK__ name: string;\n  __BLANK__ id: number;\n\n  constructor(name: string, id: number) {\n    this.name = name;\n    this.id = id;\n  }\n\n  describe(): string {\n    return `${this.name} (#${this.id})`;\n  }\n}\n\nconst emp = new Employee("Alice", 1234);\nconsole.log(emp.name);\nconsole.log(emp.describe());',
    testCases: [
      {
        id: "cls1-basic",
        input: "",
        expectedOutput: "Alice\nAlice (#1234)",
        visible: true,
        category: "basic",
        description: "Name accessible directly, describe() uses both",
      },
    ],
    hints: [
      { tier: "nudge", text: "TypeScript has three access modifiers: public, private, and protected.", xpPenalty: 0.9 },
      { tier: "guide", text: "Use `public` for externally accessible and `private` for internal-only.", xpPenalty: 0.75 },
      { tier: "reveal", text: "First blank: public\nSecond blank: private", xpPenalty: 0.5 },
    ],
    baseXP: 150,
    tags: ["classes", "access-modifiers", "encapsulation"],
  },
  {
    id: "challenge:typescript:t3:classes:2",
    nodeId: "typescript:t3:classes",
    type: "write_from_scratch",
    title: "Implement an Interface",
    description:
      "Define an interface `Printable` with a method `print(): string`.\n\nCreate a class `Document` that implements `Printable`. It should:\n- Accept `title: string` and `content: string` in the constructor\n- Implement `print()` to return `\"{title}: {content}\"`\n\nCreate a Document with title `\"README\"` and content `\"Hello world\"` and print the result of calling `.print()`.",
    difficulty: 3,
    isBoss: false,
    starterCode: "// Define Printable interface and Document class\n\n",
    testCases: [
      {
        id: "cls2-basic",
        input: "",
        expectedOutput: "README: Hello world",
        visible: true,
        category: "basic",
        description: "Document prints title and content",
      },
    ],
    hints: [
      { tier: "nudge", text: "Use `class Document implements Printable` to enforce the contract.", xpPenalty: 0.9 },
      { tier: "guide", text: "The class must provide a `print()` method that returns a string matching the interface.", xpPenalty: 0.75 },
      { tier: "reveal", text: "interface Printable { print(): string; }\nclass Document implements Printable {\n  constructor(private title: string, private content: string) {}\n  print(): string { return `${this.title}: ${this.content}`; }\n}\nconst doc = new Document(\"README\", \"Hello world\");\nconsole.log(doc.print());", xpPenalty: 0.5 },
    ],
    baseXP: 250,
    tags: ["classes", "interfaces", "implements", "oop"],
  },
  {
    id: "challenge:typescript:t3:classes:3",
    nodeId: "typescript:t3:classes",
    type: "bug_fix",
    title: "Abstract Class Fix",
    description:
      "This code defines an abstract class `Shape` and a concrete class `Circle`, but there are two errors:\n1. The abstract method is missing the `abstract` keyword.\n2. The `Circle` class does not implement the required method.\n\nFix both issues so the code compiles and prints the area of a circle with radius 5 (use `Math.PI * r * r`, rounded with `toFixed(2)`).",
    difficulty: 4,
    isBoss: true,
    starterCode: 'class Shape {\n  name: string;\n  constructor(name: string) {\n    this.name = name;\n  }\n  area(): number {\n    return 0;\n  }\n}\n\nclass Circle extends Shape {\n  radius: number;\n  constructor(radius: number) {\n    super("Circle");\n    this.radius = radius;\n  }\n}\n\nconst c = new Circle(5);\nconsole.log(c.area().toFixed(2));\n',
    testCases: [
      {
        id: "cls3-basic",
        input: "",
        expectedOutput: "78.54",
        visible: true,
        category: "basic",
        description: "Area of circle with radius 5",
      },
    ],
    hints: [
      { tier: "nudge", text: "An abstract class cannot be instantiated directly and can have abstract methods that subclasses must implement.", xpPenalty: 0.9 },
      { tier: "guide", text: "Make Shape abstract, mark area() as abstract (remove the body), and implement area() in Circle.", xpPenalty: 0.75 },
      { tier: "reveal", text: "abstract class Shape {\n  name: string;\n  constructor(name: string) { this.name = name; }\n  abstract area(): number;\n}\nclass Circle extends Shape {\n  radius: number;\n  constructor(radius: number) { super(\"Circle\"); this.radius = radius; }\n  area(): number { return Math.PI * this.radius * this.radius; }\n}", xpPenalty: 0.5 },
    ],
    baseXP: 350,
    tags: ["classes", "abstract", "inheritance", "debugging"],
  },

  // ────────────────────────────────────────────────────────────
  // typescript:t3:modules-declarations  (3 challenges)
  // ────────────────────────────────────────────────────────────
  {
    id: "challenge:typescript:t3:modules-declarations:1",
    nodeId: "typescript:t3:modules-declarations",
    type: "multiple_choice",
    title: "Module Exports",
    description:
      "Which statement correctly re-exports all named exports from a module called `\"./utils\"`?",
    difficulty: 2,
    isBoss: false,
    options: [
      {
        id: "a",
        text: 'export * from "./utils";',
        isCorrect: true,
        explanation:
          "The `export * from` syntax re-exports all named exports from the specified module.",
      },
      {
        id: "b",
        text: 'export default from "./utils";',
        isCorrect: false,
        explanation:
          "This is not valid syntax. You cannot re-export a default export this way.",
      },
      {
        id: "c",
        text: 'module.exports = require("./utils");',
        isCorrect: false,
        explanation:
          "This is CommonJS syntax, not ES module syntax used in TypeScript.",
      },
      {
        id: "d",
        text: 'import * as utils from "./utils"; export utils;',
        isCorrect: false,
        explanation:
          "You cannot export a namespace binding with bare `export`. Use `export { utils }` or `export * from`.",
      },
    ],
    hints: [
      { tier: "nudge", text: "TypeScript uses ES module syntax for imports and exports.", xpPenalty: 0.9 },
      { tier: "guide", text: "The wildcard re-export syntax uses `export *` combined with `from`.", xpPenalty: 0.75 },
      { tier: "reveal", text: "The correct syntax is: export * from \"./utils\";", xpPenalty: 0.5 },
    ],
    baseXP: 150,
    tags: ["modules", "export", "re-export", "es-modules"],
  },
  {
    id: "challenge:typescript:t3:modules-declarations:2",
    nodeId: "typescript:t3:modules-declarations",
    type: "fill_in_the_blank",
    title: "Declaration Files",
    description:
      "Fill in the blank to declare a module for a JavaScript library that has no types. The module name is `\"legacy-lib\"` and it exports a function `doStuff` that takes a `string` and returns `void`.",
    difficulty: 3,
    isBoss: false,
    templateCode: '__BLANK__ module "legacy-lib" {\n  export function doStuff(input: string): void;\n}',
    testCases: [
      {
        id: "mod2-basic",
        input: "",
        expectedOutput: "",
        visible: true,
        category: "basic",
        description: "Declaration compiles without errors",
      },
    ],
    hints: [
      { tier: "nudge", text: "Ambient declarations use a special keyword that tells TypeScript something exists without providing an implementation.", xpPenalty: 0.9 },
      { tier: "guide", text: "The keyword `declare` is used for ambient declarations — things that exist at runtime but are defined elsewhere.", xpPenalty: 0.75 },
      { tier: "reveal", text: "Fill in: declare", xpPenalty: 0.5 },
    ],
    baseXP: 200,
    tags: ["declarations", "declare", "ambient-modules", "d-ts"],
  },
  {
    id: "challenge:typescript:t3:modules-declarations:3",
    nodeId: "typescript:t3:modules-declarations",
    type: "write_from_scratch",
    title: "Namespace and Module Pattern",
    description:
      "Create a namespace `MathUtils` that exports two functions:\n- `add(a: number, b: number): number` — returns the sum\n- `multiply(a: number, b: number): number` — returns the product\n\nPrint the results of `MathUtils.add(3, 4)` and `MathUtils.multiply(5, 6)`.",
    difficulty: 3,
    isBoss: true,
    starterCode: "// Create the MathUtils namespace\n\n",
    testCases: [
      {
        id: "mod3-basic",
        input: "",
        expectedOutput: "7\n30",
        visible: true,
        category: "basic",
        description: "3+4=7, 5*6=30",
      },
    ],
    hints: [
      { tier: "nudge", text: "Use the `namespace` keyword and `export` functions within it.", xpPenalty: 0.9 },
      { tier: "guide", text: "namespace MathUtils { export function add(...) { ... } }", xpPenalty: 0.75 },
      { tier: "reveal", text: "namespace MathUtils {\n  export function add(a: number, b: number): number { return a + b; }\n  export function multiply(a: number, b: number): number { return a * b; }\n}\nconsole.log(MathUtils.add(3, 4));\nconsole.log(MathUtils.multiply(5, 6));", xpPenalty: 0.5 },
    ],
    baseXP: 300,
    tags: ["namespaces", "modules", "organization"],
  },

  // ────────────────────────────────────────────────────────────
  // typescript:t3:async-types  (3 challenges)
  // ────────────────────────────────────────────────────────────
  {
    id: "challenge:typescript:t3:async-types:1",
    nodeId: "typescript:t3:async-types",
    type: "predict_output",
    title: "Promise Return Type",
    description:
      'What does this code print?\n\n```typescript\nasync function fetchName(): Promise<string> {\n  return "Alice";\n}\n\nfetchName().then((name) => {\n  console.log(typeof name);\n  console.log(name.toUpperCase());\n});\n```',
    difficulty: 2,
    isBoss: false,
    testCases: [
      {
        id: "async1-basic",
        input: "",
        expectedOutput: "string\nALICE",
        visible: true,
        category: "basic",
        description: "typeof is string, toUpperCase gives ALICE",
      },
    ],
    hints: [
      { tier: "nudge", text: "An async function wraps its return value in a Promise. `.then()` unwraps it.", xpPenalty: 0.9 },
      { tier: "guide", text: "Inside the `.then()` callback, `name` is the resolved value — a plain string.", xpPenalty: 0.75 },
      { tier: "reveal", text: "Output:\nstring\nALICE", xpPenalty: 0.5 },
    ],
    baseXP: 150,
    tags: ["async", "promises", "return-types"],
  },
  {
    id: "challenge:typescript:t3:async-types:2",
    nodeId: "typescript:t3:async-types",
    type: "write_from_scratch",
    title: "Typed Async Pipeline",
    description:
      "Write two async functions:\n1. `fetchId(): Promise<number>` — returns `42` after a simulated delay (use `Promise.resolve(42)`).\n2. `fetchUser(id: number): Promise<string>` — returns `\"User-{id}\"` (use `Promise.resolve`).\n\nChain them: fetch the ID, then fetch the user, then print the result.",
    difficulty: 3,
    isBoss: false,
    starterCode: "// Write fetchId and fetchUser, then chain them\n\n",
    testCases: [
      {
        id: "async2-basic",
        input: "",
        expectedOutput: "User-42",
        visible: true,
        category: "basic",
        description: "Pipeline resolves to User-42",
      },
    ],
    hints: [
      { tier: "nudge", text: "Use `async/await` or `.then()` chaining to sequence the two calls.", xpPenalty: 0.9 },
      { tier: "guide", text: "const id = await fetchId(); const user = await fetchUser(id); console.log(user);", xpPenalty: 0.75 },
      { tier: "reveal", text: "async function fetchId(): Promise<number> {\n  return Promise.resolve(42);\n}\nasync function fetchUser(id: number): Promise<string> {\n  return Promise.resolve(`User-${id}`);\n}\nasync function main() {\n  const id = await fetchId();\n  const user = await fetchUser(id);\n  console.log(user);\n}\nmain();", xpPenalty: 0.5 },
    ],
    baseXP: 250,
    tags: ["async", "await", "promise-chaining", "typing"],
  },
  {
    id: "challenge:typescript:t3:async-types:3",
    nodeId: "typescript:t3:async-types",
    type: "bug_fix",
    title: "Promise.all Typing",
    description:
      "This code uses `Promise.all` to fetch data in parallel, but there is a type error in how the results are destructured. Fix the destructuring so it matches the resolved tuple type and prints the correct output.",
    difficulty: 4,
    isBoss: true,
    starterCode: 'async function getName(): Promise<string> {\n  return "Alice";\n}\n\nasync function getAge(): Promise<number> {\n  return 30;\n}\n\nasync function getActive(): Promise<boolean> {\n  return true;\n}\n\nasync function main() {\n  const [age, name, active] = await Promise.all([\n    getName(),\n    getAge(),\n    getActive(),\n  ]);\n  console.log(`${name} is ${age}, active: ${active}`);\n}\n\nmain();\n',
    testCases: [
      {
        id: "async3-basic",
        input: "",
        expectedOutput: "Alice is 30, active: true",
        visible: true,
        category: "basic",
        description: "Correctly destructured parallel results",
      },
    ],
    hints: [
      { tier: "nudge", text: "The destructured variable names must match the order of promises in the array.", xpPenalty: 0.9 },
      { tier: "guide", text: "Promise.all resolves in the same order as the input array: getName() first, getAge() second, getActive() third.", xpPenalty: 0.75 },
      { tier: "reveal", text: "Change the destructuring to: const [name, age, active] = await Promise.all([getName(), getAge(), getActive()]);", xpPenalty: 0.5 },
    ],
    baseXP: 350,
    tags: ["async", "promise-all", "destructuring", "debugging"],
  },
];
