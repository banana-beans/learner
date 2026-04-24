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
// Tier 3: TypeScript Advanced (4 nodes, 12 cards)
// ────────────────────────────────────────────────────────────

export const tsTier3Cards: ReviewCard[] = [
  // ── typescript:t3:mapped-types ────────────────────────────
  makeCard({
    id: "card:typescript:t3:mapped-types:1",
    nodeId: "typescript:t3:mapped-types",
    branchId: "typescript",
    type: "code_output",
    front: "What does this code print?",
    code: 'type User = { name: string; age: number; email: string };\ntype Optional = Partial<User>;\nconst u: Optional = { name: "Bob" };\nconsole.log(u.name, u.age);',
    expectedOutput: "Bob undefined",
    back: "Partial<T> is a built-in mapped type that makes all properties of T optional. So Optional has { name?: string; age?: number; email?: string }. Since only 'name' is provided, u.age is undefined. Mapped types transform each property in a type using the [K in keyof T] syntax.",
  }),
  makeCard({
    id: "card:typescript:t3:mapped-types:2",
    nodeId: "typescript:t3:mapped-types",
    branchId: "typescript",
    type: "fill_blank",
    front: "Fill in the blanks to create a mapped type that makes all properties of T readonly.",
    code: 'type MyReadonly<T> = {\n  __BLANK__[K in __BLANK__]: T[K];\n};',
    blanks: ["readonly ", "keyof T"],
    back: "A mapped type iterates over each key K in keyof T. Adding the 'readonly' modifier before the property name makes each property read-only. This is equivalent to the built-in Readonly<T> utility type. You can also use '-readonly' to remove the modifier.",
  }),
  makeCard({
    id: "card:typescript:t3:mapped-types:3",
    nodeId: "typescript:t3:mapped-types",
    branchId: "typescript",
    type: "explain",
    front: "Explain conditional types in TypeScript and provide a simple example.",
    back: "Conditional types follow the syntax: T extends U ? X : Y — if T is assignable to U, the type resolves to X, otherwise Y. Example: type IsString<T> = T extends string ? 'yes' : 'no'. IsString<string> is 'yes', IsString<number> is 'no'. When T is a union, the conditional distributes over each member: IsString<string | number> becomes 'yes' | 'no'. Conditional types are the foundation of many utility types like Extract, Exclude, and ReturnType.",
  }),

  // ── typescript:t3:classes ─────────────────────────────────
  makeCard({
    id: "card:typescript:t3:classes:1",
    nodeId: "typescript:t3:classes",
    branchId: "typescript",
    type: "code_output",
    front: "What does this code print?",
    code: 'class Animal {\n  constructor(public name: string, protected sound: string) {}\n  speak(): string {\n    return `${this.name} says ${this.sound}`;\n  }\n}\nclass Dog extends Animal {\n  constructor(name: string) {\n    super(name, "Woof");\n  }\n}\nconst d = new Dog("Rex");\nconsole.log(d.speak());',
    expectedOutput: "Rex says Woof",
    back: "The 'public' parameter property shorthand auto-creates and assigns this.name. 'protected' makes 'sound' accessible in subclasses but not from outside. Dog's constructor calls super() to pass values to Animal. The inherited speak() method uses both properties via template literal.",
  }),
  makeCard({
    id: "card:typescript:t3:classes:2",
    nodeId: "typescript:t3:classes",
    branchId: "typescript",
    type: "concept",
    front: "What are the three access modifiers in TypeScript classes and what does each allow?",
    back: "public — accessible from anywhere (the default if no modifier is specified). protected — accessible within the class and its subclasses, but not from outside instances. private — accessible only within the declaring class itself, not even from subclasses. TypeScript also supports ECMAScript private fields using the # prefix (e.g., #count), which are enforced at runtime unlike the 'private' keyword which is compile-time only.",
  }),
  makeCard({
    id: "card:typescript:t3:classes:3",
    nodeId: "typescript:t3:classes",
    branchId: "typescript",
    type: "bug_spot",
    front: "Find the bug in this TypeScript code.",
    code: 'abstract class Shape {\n  abstract area(): number;\n}\nconst s = new Shape();',
    back: "Abstract classes cannot be instantiated directly — 'new Shape()' is a compile error. Abstract classes are designed to be base classes that other classes extend. You must create a concrete subclass that implements all abstract methods: class Circle extends Shape { area() { return Math.PI * this.r ** 2; } }. Only the concrete subclass can be instantiated.",
  }),

  // ── typescript:t3:modules-declarations ────────────────────
  makeCard({
    id: "card:typescript:t3:modules-declarations:1",
    nodeId: "typescript:t3:modules-declarations",
    branchId: "typescript",
    type: "concept",
    front: "What is a '.d.ts' declaration file and when would you need one?",
    back: "A .d.ts file contains only type declarations (no runtime code). It describes the shape of a JavaScript module so TypeScript can type-check code that uses it. You need declaration files when: 1) using a JavaScript library that has no built-in types (install @types/libraryname from DefinitelyTyped), 2) writing a library for others to consume with type safety, or 3) declaring global variables or modules that exist at runtime but TypeScript does not know about.",
  }),
  makeCard({
    id: "card:typescript:t3:modules-declarations:2",
    nodeId: "typescript:t3:modules-declarations",
    branchId: "typescript",
    type: "fill_blank",
    front: "Fill in the blank to declare a module for a CSS file so TypeScript does not error on the import.",
    code: '__BLANK__ "*.css" {\n  const styles: Record<string, string>;\n  export default styles;\n}',
    blanks: ["declare module"],
    back: "'declare module' creates an ambient module declaration that tells TypeScript what shape an import has. Wildcard patterns like '*.css' match any import path ending in .css. This is commonly needed for CSS modules, images, SVGs, and other non-TypeScript assets. These declarations are typically placed in a global .d.ts file.",
  }),
  makeCard({
    id: "card:typescript:t3:modules-declarations:3",
    nodeId: "typescript:t3:modules-declarations",
    branchId: "typescript",
    type: "explain",
    front: "Explain the difference between 'import type' and a regular 'import' in TypeScript.",
    back: "'import type { Foo } from \"./mod\"' imports only the type information and is completely erased during compilation — no JavaScript import is generated. A regular 'import { Foo }' may import runtime values, and the import statement is preserved in the output. Using 'import type' makes it explicit that the import is types-only, prevents accidental runtime dependencies, can reduce bundle size, and avoids circular dependency issues. TypeScript 5.0+ also supports 'import { type Foo, bar }' for inline type-only imports.",
  }),

  // ── typescript:t3:async-types ─────────────────────────────
  makeCard({
    id: "card:typescript:t3:async-types:1",
    nodeId: "typescript:t3:async-types",
    branchId: "typescript",
    type: "code_output",
    front: "What does this code print?",
    code: 'async function fetchValue(): Promise<number> {\n  return 42;\n}\nfetchValue().then((val) => console.log(val, typeof val));',
    expectedOutput: "42 number",
    back: "An async function always returns a Promise. The return type Promise<number> means the promise resolves to a number. 'return 42' is equivalent to 'return Promise.resolve(42)'. The .then() callback receives the resolved value (42), and typeof confirms it is 'number' at runtime.",
  }),
  makeCard({
    id: "card:typescript:t3:async-types:2",
    nodeId: "typescript:t3:async-types",
    branchId: "typescript",
    type: "fill_blank",
    front: "Fill in the blank to extract the resolved type from a Promise type.",
    code: 'type Unwrap<T> = T extends Promise<__BLANK__> ? U : T;\n// Unwrap<Promise<string>> → string\n// Unwrap<number> → number',
    blanks: ["infer U"],
    back: "The 'infer' keyword in a conditional type introduces a type variable that TypeScript infers from the position it appears in. 'T extends Promise<infer U> ? U : T' checks if T is a Promise and, if so, extracts the inner type U. This is similar to the built-in Awaited<T> utility type. 'infer' only works inside the extends clause of a conditional type.",
  }),
  makeCard({
    id: "card:typescript:t3:async-types:3",
    nodeId: "typescript:t3:async-types",
    branchId: "typescript",
    type: "bug_spot",
    front: "Find the bug in this TypeScript code.",
    code: 'async function loadData(): Promise<string[]> {\n  const response = await fetch("/api/data");\n  const data = response.json();\n  return data;\n}',
    back: "The call to response.json() is missing 'await'. The .json() method returns a Promise<any>, not the parsed data directly. Without await, 'data' is a Promise object, not a string array, causing a type mismatch with the declared return type Promise<string[]>. The fix is: const data = await response.json();",
  }),
];
