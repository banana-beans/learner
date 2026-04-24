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
// Tier 1: TypeScript Basics (5 nodes, 15 cards)
// ────────────────────────────────────────────────────────────

export const tsTier1Cards: ReviewCard[] = [
  // ── typescript:t1:intro ───────────────────────────────────
  makeCard({
    id: "card:typescript:t1:intro:1",
    nodeId: "typescript:t1:intro",
    branchId: "typescript",
    type: "concept",
    front: "What is TypeScript and how does it relate to JavaScript?",
    back: "TypeScript is a strict syntactical superset of JavaScript that adds optional static typing. Every valid JavaScript program is also a valid TypeScript program. TypeScript compiles (transpiles) to plain JavaScript, so it runs anywhere JavaScript runs — browsers, Node.js, Deno, etc. The type annotations are erased at compile time and produce no runtime overhead.",
  }),
  makeCard({
    id: "card:typescript:t1:intro:2",
    nodeId: "typescript:t1:intro",
    branchId: "typescript",
    type: "explain",
    front: "Explain what 'structural typing' means in TypeScript and how it differs from nominal typing.",
    back: "In structural typing (also called duck typing), two types are considered compatible if they have the same shape — i.e., the same properties and methods — regardless of their declared names. In nominal typing (used by Java, C#), two types are only compatible if they share the same declaration. TypeScript uses structural typing: if an object has all the required properties, it satisfies the type, even if it was never explicitly declared as that type.",
  }),
  makeCard({
    id: "card:typescript:t1:intro:3",
    nodeId: "typescript:t1:intro",
    branchId: "typescript",
    type: "fill_blank",
    front: "Fill in the blank to compile a TypeScript file and run the output.",
    code: '# Compile the file\n__BLANK__ hello.ts\n# Run the compiled JavaScript\nnode hello.js',
    blanks: ["tsc"],
    back: "'tsc' is the TypeScript Compiler command. Running 'tsc hello.ts' compiles the TypeScript source into hello.js, which can then be executed with Node.js. You can also use 'tsc --watch' for automatic recompilation on file changes.",
  }),

  // ── typescript:t1:primitives ──────────────────────────────
  makeCard({
    id: "card:typescript:t1:primitives:1",
    nodeId: "typescript:t1:primitives",
    branchId: "typescript",
    type: "concept",
    front: "What are the primitive types in TypeScript and what values does each hold?",
    back: "string — textual data ('hello'). number — all numeric values, both integers and floats (42, 3.14); there is no separate int type. boolean — true or false. null — intentional absence of a value. undefined — variable declared but not yet assigned. bigint — arbitrarily large integers (100n). symbol — unique, immutable identifiers (Symbol('id')).",
  }),
  makeCard({
    id: "card:typescript:t1:primitives:2",
    nodeId: "typescript:t1:primitives",
    branchId: "typescript",
    type: "bug_spot",
    front: "Find the bug in this TypeScript code.",
    code: 'let count: number = 5;\nlet label: string = "Items";\nlet total: string = label + count;\nconsole.log(total.toFixed(2));',
    back: "The variable 'total' is typed as string (and indeed 'label + count' produces the string 'Items5' via concatenation). Calling .toFixed(2) on a string is a type error — toFixed exists only on number. The fix depends on intent: if you want numeric addition, use 'let total: number = count' and format separately; if you want a string, remove the .toFixed(2) call.",
  }),
  makeCard({
    id: "card:typescript:t1:primitives:3",
    nodeId: "typescript:t1:primitives",
    branchId: "typescript",
    type: "code_output",
    front: "What does this code print?",
    code: 'let x: any = "hello";\nconsole.log(typeof x);\nx = 42;\nconsole.log(typeof x);',
    expectedOutput: "string\nnumber",
    back: "The 'any' type opts out of type checking. At runtime, 'typeof' reflects the actual JavaScript value. x starts as the string 'hello' (typeof → 'string'), then is reassigned to 42 (typeof → 'number'). Note: 'any' should be avoided in production code because it defeats the purpose of TypeScript.",
  }),

  // ── typescript:t1:arrays-tuples ───────────────────────────
  makeCard({
    id: "card:typescript:t1:arrays-tuples:1",
    nodeId: "typescript:t1:arrays-tuples",
    branchId: "typescript",
    type: "code_output",
    front: "What does this code print?",
    code: 'const pair: [string, number] = ["age", 30];\nconst [key, value] = pair;\nconsole.log(key, typeof value);',
    expectedOutput: "age number",
    back: "A tuple type [string, number] defines a fixed-length array where each position has a specific type. Destructuring extracts 'age' into key (string) and 30 into value (number). typeof value at runtime is 'number'.",
  }),
  makeCard({
    id: "card:typescript:t1:arrays-tuples:2",
    nodeId: "typescript:t1:arrays-tuples",
    branchId: "typescript",
    type: "concept",
    front: "What is the difference between 'number[]' and 'Array<number>' in TypeScript?",
    back: "They are identical — both declare an array of numbers. 'number[]' is shorthand syntax, and 'Array<number>' is generic syntax. The shorthand is more common and preferred by most style guides. The choice is purely stylistic; they compile to the same JavaScript and behave the same at the type level.",
  }),
  makeCard({
    id: "card:typescript:t1:arrays-tuples:3",
    nodeId: "typescript:t1:arrays-tuples",
    branchId: "typescript",
    type: "bug_spot",
    front: "Find the bug in this TypeScript code.",
    code: 'const coords: [number, number] = [10, 20];\ncoords.push(30);\nconsole.log(coords.length);',
    back: "Although TypeScript defines coords as a tuple of exactly two numbers, .push(30) is allowed at the type level because tuples extend Array. This is a known TypeScript unsoundness — the type system says coords has length 2, but at runtime it has length 3. To prevent this, use 'readonly [number, number]' which disallows push, pop, and other mutating methods.",
  }),

  // ── typescript:t1:functions ───────────────────────────────
  makeCard({
    id: "card:typescript:t1:functions:1",
    nodeId: "typescript:t1:functions",
    branchId: "typescript",
    type: "fill_blank",
    front: "Fill in the blanks to properly type this function that takes a name and optional greeting.",
    code: 'function greet(name__BLANK__, greeting__BLANK__): string {\n  return `${greeting ?? "Hello"}, ${name}!`;\n}',
    blanks: [": string", "?: string"],
    back: "Parameter types are annotated with ': type' after the parameter name. The '?' before the colon makes a parameter optional. Optional parameters must come after required ones. The ?? (nullish coalescing) operator provides a default when the value is null or undefined.",
  }),
  makeCard({
    id: "card:typescript:t1:functions:2",
    nodeId: "typescript:t1:functions",
    branchId: "typescript",
    type: "code_output",
    front: "What does this code print?",
    code: 'function add(a: number, b: number): number {\n  return a + b;\n}\nconst sum = add(3, 4);\nconsole.log(sum, typeof sum);',
    expectedOutput: "7 number",
    back: "The function add takes two number parameters and returns a number. add(3, 4) returns 7. At runtime, typeof sum is 'number'. The return type annotation ': number' is checked at compile time but erased in the emitted JavaScript.",
  }),
  makeCard({
    id: "card:typescript:t1:functions:3",
    nodeId: "typescript:t1:functions",
    branchId: "typescript",
    type: "explain",
    front: "Explain the difference between 'void' and 'never' as function return types in TypeScript.",
    back: "'void' means the function returns nothing useful — it may return undefined implicitly, but callers should not use the return value. Example: function log(msg: string): void { console.log(msg); }. 'never' means the function never returns at all — it either throws an error or loops infinitely. Example: function fail(msg: string): never { throw new Error(msg); }. 'never' is a bottom type (assignable to everything), while 'void' is not.",
  }),

  // ── typescript:t1:objects-interfaces ──────────────────────
  makeCard({
    id: "card:typescript:t1:objects-interfaces:1",
    nodeId: "typescript:t1:objects-interfaces",
    branchId: "typescript",
    type: "code_output",
    front: "What does this code print?",
    code: 'interface User {\n  name: string;\n  age: number;\n}\nconst u: User = { name: "Alice", age: 30 };\nconsole.log(u.name, u.age);',
    expectedOutput: "Alice 30",
    back: "An interface defines the shape of an object. The variable 'u' must have both 'name' (string) and 'age' (number) properties to satisfy the User interface. Accessing u.name and u.age returns 'Alice' and 30 respectively.",
  }),
  makeCard({
    id: "card:typescript:t1:objects-interfaces:2",
    nodeId: "typescript:t1:objects-interfaces",
    branchId: "typescript",
    type: "bug_spot",
    front: "Find the bug in this TypeScript code.",
    code: 'interface Config {\n  host: string;\n  port: number;\n}\nconst cfg: Config = {\n  host: "localhost",\n  port: "8080",\n};',
    back: "The property 'port' is declared as 'number' in the Config interface, but the value '8080' is a string (it has quotes around it). This is a type error. The fix is to remove the quotes: port: 8080. This is a common mistake when parsing configuration from environment variables, which are always strings.",
  }),
  makeCard({
    id: "card:typescript:t1:objects-interfaces:3",
    nodeId: "typescript:t1:objects-interfaces",
    branchId: "typescript",
    type: "fill_blank",
    front: "Fill in the blank to mark the 'email' property as optional in this interface.",
    code: 'interface Contact {\n  name: string;\n  phone: string;\n  email__BLANK__ string;\n}',
    blanks: ["?:"],
    back: "The '?' before the colon in a property declaration makes it optional. 'email?: string' means a Contact object may or may not include an email property. If present, it must be a string. The type of 'email' becomes 'string | undefined' when accessed.",
  }),
];
