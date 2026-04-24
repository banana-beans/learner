import type { LessonContent } from "../python-basics";

export const tsTier1Lessons: Record<string, LessonContent> = {
  "typescript:t1:intro": {
    nodeId: "typescript:t1:intro",
    title: "TypeScript Intro",
    sections: [
      {
        heading: "What Is TypeScript?",
        body: "TypeScript is a superset of JavaScript that adds static type checking. Every valid JavaScript file is also valid TypeScript, but TypeScript lets you add type annotations that catch errors before your code runs. The TypeScript compiler (tsc) checks types and then emits plain JavaScript — browsers and Node.js never see the types. Think of it as JavaScript with a safety net.",
      },
      {
        heading: "Type Annotations",
        body: "You add types with a colon after a variable name: 'let name: string = \"Alice\";'. The compiler ensures you don't accidentally assign a number to a string variable. If you omit the annotation, TypeScript infers the type from the value — 'let count = 42' is automatically typed as number. Explicit annotations are most useful for function parameters and return types.",
      },
      {
        heading: "Setting Up: tsconfig.json",
        body: "Every TypeScript project has a tsconfig.json that configures the compiler. Key settings: 'strict: true' enables all strict checks (always use this), 'target' sets which JavaScript version to emit, and 'outDir' controls where compiled .js files go. Run 'tsc --init' to generate a default config, then 'tsc' to compile, or use 'tsc --watch' for auto-recompilation.",
      },
    ],
    codeExamples: [
      {
        title: "Basic type annotations",
        code: `let name: string = "Alice";
let age: number = 30;
let active: boolean = true;

// Type error caught at compile time:
// age = "thirty"; // Error: Type 'string' is not assignable to type 'number'

// Type inference — no annotation needed
let score = 100;  // TypeScript knows this is 'number'`,
        explanation: "Annotations use colon syntax. The compiler catches type mismatches before your code runs. Inference works when the type is obvious from the value.",
      },
      {
        title: "Compiling TypeScript",
        code: `// greeting.ts
function greet(name: string): string {
  return \`Hello, \${name}!\`;
}
console.log(greet("World"));

// Terminal:
// $ tsc greeting.ts
// Creates greeting.js with types stripped out`,
        explanation: "tsc compiles .ts to .js, removing all type annotations. The output is standard JavaScript that runs anywhere.",
      },
    ],
    keyTakeaways: [
      "TypeScript adds static types to JavaScript — errors are caught at compile time, not runtime",
      "Type annotations use colon syntax: let x: number = 42",
      "TypeScript infers types when you initialize with a value — you don't need to annotate everything",
      "tsc compiles TypeScript to plain JavaScript, stripping all type information",
      "Always use 'strict: true' in tsconfig.json for maximum safety",
    ],
  },

  "typescript:t1:primitives": {
    nodeId: "typescript:t1:primitives",
    title: "Primitive Types",
    sections: [
      {
        heading: "The Core Primitives",
        body: "TypeScript has seven primitive types: string (text), number (all numbers — no separate int/float), boolean (true/false), null, undefined, bigint (arbitrary precision integers), and symbol (unique identifiers). Unlike C# or Java, JavaScript/TypeScript has a single 'number' type for both integers and decimals. null and undefined are distinct types with distinct meanings.",
      },
      {
        heading: "any vs unknown vs never",
        body: "Three special types: 'any' disables type checking entirely — avoid it. 'unknown' is the type-safe version of any: you can assign anything to it, but you must narrow it before using it. 'never' represents values that never occur — it's the return type of functions that always throw or have infinite loops. Prefer 'unknown' over 'any' when you don't know the type in advance.",
      },
      {
        heading: "Type Narrowing",
        body: "Narrowing means refining a broad type to a more specific one. Use 'typeof' checks: 'if (typeof x === \"string\") { x.toUpperCase(); }'. Inside the if block, TypeScript knows x is a string. Other narrowing tools: truthiness checks, equality checks, 'in' operator, and 'instanceof'. Narrowing is how you safely work with union types.",
      },
    ],
    codeExamples: [
      {
        title: "Primitive types",
        code: `let name: string = "Alice";
let age: number = 30;         // no int/float distinction
let pi: number = 3.14159;     // same 'number' type
let active: boolean = true;
let nothing: null = null;
let missing: undefined = undefined;`,
        explanation: "All numbers (integers, floats, NaN, Infinity) are 'number'. null and undefined are their own types.",
      },
      {
        title: "unknown vs any",
        code: `let risky: any = "hello";
risky.nonExistent();  // No error! (but crashes at runtime)

let safe: unknown = "hello";
// safe.toUpperCase();  // Error! Must narrow first

if (typeof safe === "string") {
  safe.toUpperCase();  // OK — narrowed to string
}`,
        explanation: "'any' skips all checks (dangerous). 'unknown' requires you to check the type before using it (safe). Always prefer unknown.",
      },
    ],
    keyTakeaways: [
      "number covers all numbers — integers and decimals alike",
      "null means 'intentionally empty'; undefined means 'not yet assigned'",
      "Avoid 'any' — use 'unknown' when the type is truly unknown, then narrow it",
      "'typeof' narrows types in conditional blocks: if (typeof x === 'string')",
      "'never' is the type of values that can't exist — useful for exhaustive checks",
    ],
  },

  "typescript:t1:arrays-tuples": {
    nodeId: "typescript:t1:arrays-tuples",
    title: "Arrays & Tuples",
    sections: [
      {
        heading: "Typed Arrays",
        body: "TypeScript arrays are typed: 'let nums: number[] = [1, 2, 3];' or equivalently 'let nums: Array<number> = [1, 2, 3];'. Both syntaxes are identical. The compiler ensures you can only add elements of the correct type. An empty array without annotation is typed as 'any[]', so always annotate empty arrays.",
      },
      {
        heading: "Tuples",
        body: "Tuples are fixed-length arrays where each position has a specific type. Declare with square brackets: 'let pair: [string, number] = [\"Alice\", 30];'. Unlike regular arrays, tuples enforce both the types and the length. Access elements by index: pair[0] is string, pair[1] is number. Tuples are great for returning multiple values from a function.",
      },
      {
        heading: "Readonly Arrays",
        body: "Use 'readonly' to prevent mutations: 'let ids: readonly number[] = [1, 2, 3];'. This prevents push, pop, splice, and direct index assignment. ReadonlyArray<T> is the generic form. Readonly arrays are useful for function parameters — they signal that the function won't modify the input. You can also use 'as const' to make an array literal completely immutable with literal types.",
      },
    ],
    codeExamples: [
      {
        title: "Arrays and tuples",
        code: `// Typed arrays
let scores: number[] = [95, 87, 92];
scores.push(100);  // OK
// scores.push("A");  // Error: string is not number

// Tuple: fixed types per position
let user: [string, number, boolean] = ["Alice", 30, true];
let name = user[0];  // type is string
let age = user[1];   // type is number

// Tuple destructuring
let [n, a, active] = user;`,
        explanation: "Arrays hold any number of elements of one type. Tuples have fixed length with specific types per position.",
      },
      {
        title: "Readonly arrays and as const",
        code: `// Readonly array
const ids: readonly number[] = [1, 2, 3];
// ids.push(4);  // Error: push does not exist on readonly number[]

// as const — deepest immutability with literal types
const colors = ["red", "green", "blue"] as const;
// type is readonly ["red", "green", "blue"]
// colors[0] is type "red", not string`,
        explanation: "'readonly' prevents mutations. 'as const' goes further: element types become literals ('red' instead of string) and the array becomes a readonly tuple.",
      },
    ],
    keyTakeaways: [
      "number[] and Array<number> are identical — use whichever you prefer",
      "Always annotate empty arrays to avoid any[] inference",
      "Tuples are fixed-length arrays with per-position types: [string, number]",
      "'readonly' arrays prevent push, pop, and mutation",
      "'as const' creates deeply immutable values with literal types",
    ],
  },

  "typescript:t1:functions": {
    nodeId: "typescript:t1:functions",
    title: "Typed Functions",
    sections: [
      {
        heading: "Parameter and Return Types",
        body: "Annotate function parameters and return types: 'function add(a: number, b: number): number { return a + b; }'. TypeScript can usually infer the return type, but explicit annotations serve as documentation and catch bugs if the implementation doesn't match the declared return. Arrow functions work the same way: 'const add = (a: number, b: number): number => a + b;'.",
      },
      {
        heading: "Optional, Default, and Rest Parameters",
        body: "Optional parameters use '?': 'function greet(name: string, title?: string)'. Optional params must come after required ones and have type T | undefined. Default parameters work like JavaScript: 'function greet(name: string, greeting = \"Hello\")'. Rest parameters use spread: 'function sum(...nums: number[]): number'. TypeScript types the rest parameter as an array.",
      },
      {
        heading: "void and Function Types",
        body: "Functions that return nothing use 'void': 'function log(msg: string): void'. void is different from undefined — it signals intent to ignore the return value. Function types describe the shape of a function: 'type Callback = (data: string) => void;'. This lets you pass functions as arguments with full type safety.",
      },
    ],
    codeExamples: [
      {
        title: "Function type annotations",
        code: `function multiply(a: number, b: number): number {
  return a * b;
}

// Arrow function
const divide = (a: number, b: number): number => a / b;

// Optional and default parameters
function greet(name: string, greeting: string = "Hello"): string {
  return \`\${greeting}, \${name}!\`;
}

greet("Alice");          // "Hello, Alice!"
greet("Bob", "Hi");      // "Hi, Bob!"`,
        explanation: "Parameters are typed after a colon. Return types go after the parameter list. Default values provide a fallback.",
      },
      {
        title: "Function types and callbacks",
        code: `type MathOp = (a: number, b: number) => number;

function apply(op: MathOp, x: number, y: number): number {
  return op(x, y);
}

const add: MathOp = (a, b) => a + b;
console.log(apply(add, 3, 4));  // 7
console.log(apply((a, b) => a * b, 3, 4));  // 12`,
        explanation: "Function types describe the signature: parameter types and return type. Passing a lambda that matches the type is fully type-safe.",
      },
    ],
    keyTakeaways: [
      "Annotate parameters (required) and return types (recommended): function f(x: number): string",
      "Optional parameters use '?' and must come after required parameters",
      "Default parameters provide a fallback value: (name: string = 'World')",
      "Rest parameters use spread and are typed as arrays: (...nums: number[])",
      "void means 'no return value' — different from undefined",
      "Function types: (params) => returnType — used for callbacks and higher-order functions",
    ],
  },

  "typescript:t1:objects-interfaces": {
    nodeId: "typescript:t1:objects-interfaces",
    title: "Objects & Interfaces",
    sections: [
      {
        heading: "Object Type Annotations",
        body: "You can type objects inline: 'let user: { name: string; age: number } = { name: \"Alice\", age: 30 };'. But inline types get repetitive. Interfaces are the standard way to name and reuse object shapes. TypeScript uses structural typing — if an object has the right properties, it matches the type, regardless of explicit 'implements' declarations.",
      },
      {
        heading: "Interfaces",
        body: "An interface declares the shape of an object: 'interface User { name: string; age: number; }'. Properties can be optional ('email?: string'), readonly ('readonly id: number'), or computed. Interfaces can extend other interfaces: 'interface Admin extends User { role: string; }'. Unlike type aliases, interfaces are open — you can declare the same interface twice and TypeScript merges them.",
      },
      {
        heading: "Index Signatures and Extending",
        body: "Index signatures let you type objects with dynamic keys: 'interface Dict { [key: string]: number; }'. This means any string key maps to a number value. Use this for dictionaries, config objects, and maps. Extending interfaces with 'extends' creates a new interface that includes all parent properties plus new ones. A class can implement an interface to guarantee it has the required properties.",
      },
    ],
    codeExamples: [
      {
        title: "Defining and using interfaces",
        code: `interface User {
  readonly id: number;
  name: string;
  email?: string;  // optional
}

const alice: User = { id: 1, name: "Alice" };
const bob: User = { id: 2, name: "Bob", email: "bob@test.com" };

// alice.id = 99;  // Error: readonly
alice.name = "Alicia";  // OK: not readonly`,
        explanation: "'readonly' prevents reassignment. '?' makes a property optional. Objects must have all required properties to match the interface.",
      },
      {
        title: "Extending interfaces",
        code: `interface Animal {
  name: string;
  sound(): string;
}

interface Pet extends Animal {
  owner: string;
}

const dog: Pet = {
  name: "Rex",
  owner: "Alice",
  sound() { return "Woof!"; },
};

// Index signature
interface Scores {
  [student: string]: number;
}
const grades: Scores = { Alice: 95, Bob: 87 };`,
        explanation: "Pet extends Animal — it inherits name and sound, then adds owner. Index signatures allow dynamic keys.",
      },
    ],
    keyTakeaways: [
      "Interfaces define the shape of objects: interface User { name: string; age: number; }",
      "Optional properties use '?': email?: string",
      "readonly prevents reassignment after creation",
      "Interfaces can extend other interfaces with 'extends'",
      "TypeScript uses structural typing — matching shape is enough, no explicit 'implements' needed",
      "Index signatures type objects with dynamic keys: { [key: string]: ValueType }",
    ],
  },
};
