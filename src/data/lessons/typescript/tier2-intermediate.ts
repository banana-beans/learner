import type { LessonContent } from "../python-basics";

export const tsTier2Lessons: Record<string, LessonContent> = {
  "typescript:t2:union-literal": {
    nodeId: "typescript:t2:union-literal",
    title: "Union & Literal Types",
    sections: [
      {
        heading: "Union Types",
        body: "A union type allows a value to be one of several types: 'let id: string | number'. Use the pipe | to combine types. Before using a union value, you must narrow it — TypeScript won't let you call string methods on something that might be a number. Common narrowing tools: typeof checks, equality checks, truthiness checks, and the 'in' operator.",
      },
      {
        heading: "Literal Types",
        body: "Literal types restrict a value to a specific constant: 'let direction: \"up\" | \"down\" | \"left\" | \"right\"'. Combined with unions, literal types create powerful 'enum-like' types without the enum keyword. They're particularly useful for function parameters that only accept certain strings or numbers.",
      },
      {
        heading: "Discriminated Unions",
        body: "A discriminated union is a union of object types that share a common property (the discriminant) with different literal values. Example: '{ type: \"circle\"; radius: number } | { type: \"rect\"; width: number; height: number }'. Switch on the discriminant to narrow the type. This pattern is the foundation of type-safe state management, API responses, and event handling.",
      },
    ],
    codeExamples: [
      {
        title: "Union types and narrowing",
        code: `function format(value: string | number): string {
  if (typeof value === "string") {
    return value.toUpperCase(); // narrowed to string
  }
  return value.toFixed(2);  // narrowed to number
}

console.log(format("hello")); // HELLO
console.log(format(3.14));    // 3.14`,
        explanation: "typeof narrows the union inside each branch. TypeScript knows exactly which type you're working with.",
      },
      {
        title: "Discriminated unions",
        code: `type Shape =
  | { kind: "circle"; radius: number }
  | { kind: "rect"; width: number; height: number };

function area(shape: Shape): number {
  switch (shape.kind) {
    case "circle": return Math.PI * shape.radius ** 2;
    case "rect":   return shape.width * shape.height;
  }
}`,
        explanation: "The 'kind' property is the discriminant. TypeScript narrows the full object type based on its value.",
      },
    ],
    keyTakeaways: [
      "Union types use |: string | number means 'either a string or a number'",
      "Narrow unions with typeof, in, equality checks, or truthiness",
      "Literal types restrict to specific values: \"success\" | \"error\"",
      "Discriminated unions combine literal types with object unions for type-safe branching",
      "Always handle all cases in a discriminated union — TypeScript warns about missing ones",
    ],
  },

  "typescript:t2:type-aliases": {
    nodeId: "typescript:t2:type-aliases",
    title: "Type Aliases & Assertions",
    sections: [
      {
        heading: "Type Aliases",
        body: "The 'type' keyword creates a named alias for any type: 'type UserId = string | number'. Unlike interfaces, type aliases can represent unions, tuples, primitives, and computed types — not just objects. Type aliases are evaluated once and don't support declaration merging (adding properties across files), while interfaces do.",
      },
      {
        heading: "Intersection Types",
        body: "Intersection types combine multiple types with &: 'type Admin = User & { role: string }'. The result must satisfy ALL types — it has all properties from each. Intersections are the 'and' operator for types, while unions are 'or'. Use intersections to compose types: combine a base type with additional capabilities.",
      },
      {
        heading: "Type Assertions",
        body: "Type assertions tell the compiler 'I know the type better than you': 'const input = document.getElementById(\"name\") as HTMLInputElement'. Use 'as' syntax (not angle brackets in JSX). Assertions don't change the runtime value — they only affect type checking. Use them sparingly: prefer narrowing with typeof or instanceof instead. Double assertions (as unknown as T) bypass safety checks entirely.",
      },
    ],
    codeExamples: [
      {
        title: "Type aliases and intersections",
        code: `type Point = { x: number; y: number };
type Labeled = { label: string };
type LabeledPoint = Point & Labeled;

const origin: LabeledPoint = { x: 0, y: 0, label: "Origin" };

type Result<T> = { success: true; data: T } | { success: false; error: string };

const ok: Result<number> = { success: true, data: 42 };`,
        explanation: "Type aliases name complex types. Intersections (&) merge types. Generic type aliases like Result<T> are reusable patterns.",
      },
      {
        title: "Type assertions",
        code: `// DOM element assertion
const input = document.getElementById("email") as HTMLInputElement;
console.log(input.value); // OK — typed as HTMLInputElement

// Prefer narrowing when possible:
const element = document.getElementById("email");
if (element instanceof HTMLInputElement) {
  console.log(element.value); // narrowed safely
}`,
        explanation: "'as' asserts a type without checking. instanceof actually checks at runtime — prefer it when you can.",
      },
    ],
    keyTakeaways: [
      "'type' creates aliases for any type: unions, tuples, primitives, objects",
      "Intersection (&) combines types — the result has ALL properties from each",
      "type vs interface: types handle unions/tuples; interfaces support merging/extending",
      "Type assertions ('as') override the compiler but don't check at runtime",
      "Prefer narrowing (typeof, instanceof) over assertions for safety",
    ],
  },

  "typescript:t2:generics": {
    nodeId: "typescript:t2:generics",
    title: "Generics",
    sections: [
      {
        heading: "Generic Functions",
        body: "Generics let you write functions that work with any type while preserving type information. Instead of using 'any' (which loses type info), declare a type parameter: 'function first<T>(arr: T[]): T | undefined'. When called, TypeScript infers T from the argument: first([1, 2, 3]) infers T = number, so the return type is number | undefined.",
      },
      {
        heading: "Constraints with extends",
        body: "Constrain generic types with 'extends': '<T extends { length: number }>' means T must have a length property. This lets you use length inside the function safely. You can also constrain with 'keyof': '<T, K extends keyof T>' means K must be a key of T. Constraints balance flexibility with type safety — accept any type that meets the minimum requirements.",
      },
      {
        heading: "Built-in Utility Types",
        body: "TypeScript includes powerful utility types: Partial<T> makes all properties optional, Required<T> makes all required, Readonly<T> prevents mutation, Pick<T, K> selects specific properties, Omit<T, K> removes properties, Record<K, V> creates a type with keys K and values V. These are built with mapped types and are used extensively in real-world TypeScript.",
      },
    ],
    codeExamples: [
      {
        title: "Generic function with constraint",
        code: `function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const user = { name: "Alice", age: 30 };
const name = getProperty(user, "name"); // type: string
const age = getProperty(user, "age");   // type: number
// getProperty(user, "email"); // Error: "email" is not a key of user`,
        explanation: "K extends keyof T ensures the key exists on the object. The return type T[K] is the specific property type, not just 'any'.",
      },
      {
        title: "Utility types",
        code: `interface User {
  id: number;
  name: string;
  email: string;
}

type UserUpdate = Partial<User>;           // all optional
type UserPreview = Pick<User, "id" | "name">; // only id, name
type UserInput = Omit<User, "id">;          // name, email (no id)
type UserMap = Record<string, User>;        // { [key]: User }`,
        explanation: "Utility types transform existing types. Partial makes everything optional (for updates), Pick selects fields, Omit removes fields.",
      },
    ],
    keyTakeaways: [
      "Generics preserve type information: function first<T>(arr: T[]): T",
      "TypeScript infers generic types from arguments — explicit <Type> is rarely needed",
      "'extends' constrains generics: <T extends HasLength> requires T to have length",
      "keyof T produces a union of T's property names as literal types",
      "Utility types: Partial, Required, Readonly, Pick, Omit, Record",
    ],
  },

  "typescript:t2:enums-narrowing": {
    nodeId: "typescript:t2:enums-narrowing",
    title: "Enums & Advanced Narrowing",
    sections: [
      {
        heading: "Enums in TypeScript",
        body: "Enums define a set of named constants. Numeric enums auto-increment from 0: 'enum Direction { Up, Down, Left, Right }' gives Up=0, Down=1, etc. String enums require explicit values: 'enum Status { Active = \"ACTIVE\", Inactive = \"INACTIVE\" }'. Modern TypeScript often prefers union literal types ('type Direction = \"up\" | \"down\"') over enums because they're simpler and tree-shake better.",
      },
      {
        heading: "Exhaustive Checks with never",
        body: "The 'never' type represents values that should never occur. In a switch statement over a union, assigning the default case to a 'never' variable forces a compile error if you miss a case. This is called an exhaustive check. If you add a new variant to the union, TypeScript immediately tells you every switch that needs updating.",
      },
      {
        heading: "Custom Type Predicates",
        body: "Type predicates let you create custom narrowing functions: 'function isString(x: unknown): x is string { return typeof x === \"string\"; }'. The 'x is string' return type tells TypeScript that if the function returns true, x is a string in the calling scope. This is powerful for complex narrowing logic that typeof and instanceof can't handle.",
      },
    ],
    codeExamples: [
      {
        title: "Exhaustive check with never",
        code: `type Shape = "circle" | "square" | "triangle";

function sides(shape: Shape): number {
  switch (shape) {
    case "circle": return 0;
    case "square": return 4;
    case "triangle": return 3;
    default:
      const _exhaustive: never = shape;
      return _exhaustive;
  }
}
// If you add "pentagon" to Shape, this errors until handled`,
        explanation: "Assigning to 'never' in the default case ensures all union members are handled. Adding a new member causes a compile error.",
      },
      {
        title: "Custom type predicate",
        code: `interface Cat { meow(): void; whiskers: number; }
interface Dog { bark(): void; breed: string; }
type Pet = Cat | Dog;

function isCat(pet: Pet): pet is Cat {
  return "meow" in pet;
}

function handlePet(pet: Pet) {
  if (isCat(pet)) {
    pet.meow();       // narrowed to Cat
  } else {
    pet.bark();       // narrowed to Dog
  }
}`,
        explanation: "'pet is Cat' is a type predicate. It tells TypeScript that a true return means the argument is a Cat, enabling narrowing in the caller.",
      },
    ],
    keyTakeaways: [
      "String enums: enum Status { Active = 'ACTIVE' }; numeric enums auto-increment from 0",
      "Prefer union literal types over enums in most cases: type Dir = 'up' | 'down'",
      "Exhaustive checks use 'never' in the default case to catch missing union members",
      "Type predicates ('x is Type') create custom narrowing functions",
      "'const enums' are inlined at compile time — no runtime object generated",
    ],
  },
};
