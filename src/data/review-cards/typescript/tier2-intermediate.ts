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
// Tier 2: TypeScript Intermediate (4 nodes, 12 cards)
// ────────────────────────────────────────────────────────────

export const tsTier2Cards: ReviewCard[] = [
  // ── typescript:t2:union-literal ───────────────────────────
  makeCard({
    id: "card:typescript:t2:union-literal:1",
    nodeId: "typescript:t2:union-literal",
    branchId: "typescript",
    type: "code_output",
    front: "What does this code print?",
    code: 'type Direction = "north" | "south" | "east" | "west";\nfunction move(dir: Direction): string {\n  return `Moving ${dir}`;\n}\nconsole.log(move("north"));',
    expectedOutput: "Moving north",
    back: "A literal type restricts a value to exact string (or number) literals. The union 'Direction' only allows the four compass strings. Passing 'north' is valid and the template literal produces 'Moving north'. Passing any other string like 'up' would be a compile-time error.",
  }),
  makeCard({
    id: "card:typescript:t2:union-literal:2",
    nodeId: "typescript:t2:union-literal",
    branchId: "typescript",
    type: "concept",
    front: "What is a discriminated union in TypeScript and why is it useful?",
    back: "A discriminated union is a union of object types that share a common literal property (the discriminant). For example: type Shape = { kind: 'circle'; radius: number } | { kind: 'square'; side: number }. TypeScript can narrow the type by checking the discriminant in a switch or if statement. This is useful because it provides exhaustive type-safe handling of each variant without type assertions.",
  }),
  makeCard({
    id: "card:typescript:t2:union-literal:3",
    nodeId: "typescript:t2:union-literal",
    branchId: "typescript",
    type: "bug_spot",
    front: "Find the bug in this TypeScript code.",
    code: 'function format(value: string | number): string {\n  return value.toFixed(2);\n}',
    back: "The parameter 'value' is typed as 'string | number', but .toFixed() is only available on number. If value is a string, this will fail. TypeScript will report an error because 'toFixed' does not exist on type 'string'. The fix is to narrow the type first: if (typeof value === 'number') { return value.toFixed(2); } else { return value; }.",
  }),

  // ── typescript:t2:type-aliases ────────────────────────────
  makeCard({
    id: "card:typescript:t2:type-aliases:1",
    nodeId: "typescript:t2:type-aliases",
    branchId: "typescript",
    type: "explain",
    front: "Explain the key differences between 'type' aliases and 'interface' declarations in TypeScript.",
    back: "Both can describe object shapes, but they differ in important ways. Interfaces can be extended with 'extends' and can be merged via declaration merging (adding properties across multiple declarations). Type aliases use intersections (&) to combine, support union types, mapped types, conditional types, and can alias primitives — none of which interfaces can do. Use interface for object shapes that may be extended; use type for unions, intersections, utility types, and complex type expressions.",
  }),
  makeCard({
    id: "card:typescript:t2:type-aliases:2",
    nodeId: "typescript:t2:type-aliases",
    branchId: "typescript",
    type: "code_output",
    front: "What does this code print?",
    code: 'type Point = { x: number; y: number };\ntype Labeled = Point & { label: string };\nconst p: Labeled = { x: 1, y: 2, label: "origin" };\nconsole.log(p.x, p.y, p.label);',
    expectedOutput: "1 2 origin",
    back: "The intersection type '&' combines Point and { label: string } into a single type that has all three properties: x, y, and label. The variable p must satisfy both types. This is how type aliases compose object shapes, in contrast to interface extends.",
  }),
  makeCard({
    id: "card:typescript:t2:type-aliases:3",
    nodeId: "typescript:t2:type-aliases",
    branchId: "typescript",
    type: "fill_blank",
    front: "Fill in the blank to create a type alias for a function that takes a string and returns a number.",
    code: 'type Parser = __BLANK__;\nconst parse: Parser = (input) => parseInt(input, 10);\nconsole.log(parse("42"));',
    blanks: ["(input: string) => number"],
    back: "A function type alias uses arrow syntax: (param: Type) => ReturnType. The type 'Parser' describes any function that accepts a string and returns a number. The variable 'parse' satisfies this type by calling parseInt, which returns a number.",
  }),

  // ── typescript:t2:generics ────────────────────────────────
  makeCard({
    id: "card:typescript:t2:generics:1",
    nodeId: "typescript:t2:generics",
    branchId: "typescript",
    type: "code_output",
    front: "What does this code print?",
    code: 'function identity<T>(value: T): T {\n  return value;\n}\nconsole.log(identity<string>("hello"));\nconsole.log(identity(42));',
    expectedOutput: "hello\n42",
    back: "A generic function uses a type parameter <T> that is determined at each call site. The first call explicitly sets T to string. The second call infers T as number from the argument 42 (type argument inference). In both cases, the function returns its argument unchanged. Generics let you write reusable, type-safe code without using 'any'.",
  }),
  makeCard({
    id: "card:typescript:t2:generics:2",
    nodeId: "typescript:t2:generics",
    branchId: "typescript",
    type: "fill_blank",
    front: "Fill in the blanks to write a generic function that returns the first element of an array.",
    code: 'function first__BLANK__(arr: __BLANK__[]): T | undefined {\n  return arr[0];\n}',
    blanks: ["<T>", "T"],
    back: "The type parameter <T> is declared after the function name. The parameter type is T[] (an array of T), and the return type is T | undefined (since the array might be empty). When called, T is inferred from the array's element type: first([1,2,3]) infers T as number.",
  }),
  makeCard({
    id: "card:typescript:t2:generics:3",
    nodeId: "typescript:t2:generics",
    branchId: "typescript",
    type: "concept",
    front: "What are generic constraints in TypeScript and how do you apply them?",
    back: "Generic constraints restrict the types that can be used for a type parameter. You apply them with the 'extends' keyword: <T extends SomeType>. For example, <T extends { length: number }> ensures T has a length property. Without the constraint, accessing .length on T would be a type error. Constraints let you write generic code that safely accesses specific properties or methods while remaining flexible about the exact type.",
  }),

  // ── typescript:t2:enums-narrowing ─────────────────────────
  makeCard({
    id: "card:typescript:t2:enums-narrowing:1",
    nodeId: "typescript:t2:enums-narrowing",
    branchId: "typescript",
    type: "code_output",
    front: "What does this code print?",
    code: "enum Color {\n  Red,\n  Green,\n  Blue,\n}\nconsole.log(Color.Red, Color.Green, Color.Blue);\nconsole.log(Color[1]);",
    expectedOutput: "0 1 2\nGreen",
    back: "Numeric enums auto-increment from 0 by default. Color.Red is 0, Green is 1, Blue is 2. Numeric enums also support reverse mapping: Color[1] returns the string 'Green'. String enums do not have reverse mappings.",
  }),
  makeCard({
    id: "card:typescript:t2:enums-narrowing:2",
    nodeId: "typescript:t2:enums-narrowing",
    branchId: "typescript",
    type: "explain",
    front: "Explain the different type narrowing techniques available in TypeScript.",
    back: "TypeScript narrows types using: 1) typeof guards — 'typeof x === \"string\"' narrows to string. 2) instanceof guards — 'x instanceof Date' narrows to Date. 3) Truthiness checks — 'if (x)' eliminates null/undefined. 4) Equality checks — '===' against a literal narrows to that literal. 5) The 'in' operator — '\"name\" in x' narrows to types with a name property. 6) Discriminated unions — checking a shared literal property. 7) Custom type predicates — 'function isString(x: unknown): x is string'.",
  }),
  makeCard({
    id: "card:typescript:t2:enums-narrowing:3",
    nodeId: "typescript:t2:enums-narrowing",
    branchId: "typescript",
    type: "bug_spot",
    front: "Find the bug in this TypeScript code.",
    code: 'function process(value: string | number | null) {\n  if (typeof value === "object") {\n    console.log(value.toUpperCase());\n  }\n}',
    back: "In JavaScript, typeof null === 'object'. So the typeof check narrows value to 'null' (not string or number), and calling .toUpperCase() on null will crash at runtime. TypeScript correctly flags this: 'value' is possibly 'null'. The fix is to check for null explicitly: if (value !== null && typeof value === 'string').",
  }),
];
