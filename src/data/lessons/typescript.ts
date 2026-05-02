// ============================================================
// TypeScript — All Tiers (T1–T3)
// ============================================================

import type { LessonContent } from "./python-basics";

export const typescriptLessons: Record<string, LessonContent> = {
  // ── T1: JS Fundamentals ─────────────────────────────────
  "typescript:t1:variables": {
    nodeId: "typescript:t1:variables",
    title: "Variables (let, const, var)",
    sections: [
      { heading: "let, const, var", body: "Use const by default — it prevents reassignment but doesn't freeze the value. Use let when you actually need to reassign. Avoid var: it's function-scoped and hoists in surprising ways. const and let are block-scoped." },
      { heading: "Primitive Types", body: "JavaScript has 7 primitives: string, number, boolean, null, undefined, bigint, symbol. Everything else is an object. number is always 64-bit float — there's no separate int." },
      { heading: "Equality", body: "Always use === and !==. Loose == triggers type coercion that catches everyone (e.g. 0 == '' is true). The strict comparators are also faster." },
    ],
    codeExamples: [
      { title: "const and let", code: `const name = "Ada";       // can't reassign
let count = 0;            // can reassign
count = count + 1;
console.log(name, count); // Ada 1`, explanation: "const blocks reassignment of the binding; the value itself can still be mutated for objects." },
      { title: "Block scope", code: `if (true) {
  let inner = "hi";
  console.log(inner); // hi
}
// console.log(inner); // ReferenceError`, explanation: "let is scoped to the nearest {}. var would have leaked to the function." },
      { title: "Strict equality", code: `console.log(0 == "");    // true (coerced)
console.log(0 === "");   // false (strict)
console.log(NaN === NaN); // false — use Number.isNaN()`, explanation: "Always reach for === / !==." },
    ],
    keyTakeaways: ["const by default; let when you must reassign; avoid var", "let/const are block-scoped; var is function-scoped", "All numbers are 64-bit floats", "Use === / !== — never == / !=", "NaN !== NaN (use Number.isNaN)"],
  },
  "typescript:t1:arrays": {
    nodeId: "typescript:t1:arrays",
    title: "Arrays & Methods",
    sections: [
      { heading: "Iteration Methods", body: "map transforms, filter selects, reduce folds. They return new arrays — none mutate. Chain them for declarative pipelines." },
      { heading: "Find / Some / Every", body: "find returns the first match (or undefined). some returns true if any match; every returns true only if all match. All short-circuit on the first decisive item." },
      { heading: "Mutation Methods", body: "push/pop/shift/unshift/splice mutate in place. sort mutates AND returns the same array. Use [...arr].sort() if you need a fresh sorted copy." },
    ],
    codeExamples: [
      { title: "map / filter / reduce", code: `const nums = [1, 2, 3, 4, 5];
const doubled = nums.map(n => n * 2);                  // [2, 4, 6, 8, 10]
const evens   = nums.filter(n => n % 2 === 0);         // [2, 4]
const total   = nums.reduce((acc, n) => acc + n, 0);   // 15
console.log(doubled, evens, total);`, explanation: "All immutable. reduce takes (accumulator, current) and an initial value." },
      { title: "find vs filter", code: `const users = [{ id: 1, name: "ada" }, { id: 2, name: "linus" }];
console.log(users.find(u => u.id === 2));   // { id: 2, name: "linus" }
console.log(users.filter(u => u.id === 2)); // [{ id: 2, name: "linus" }]`, explanation: "find returns the item; filter returns an array." },
      { title: "Don't mutate accidentally", code: `const arr = [3, 1, 2];
const sorted = [...arr].sort();
console.log(sorted, arr);  // [1, 2, 3] [3, 1, 2]`, explanation: "Spread creates a copy first; sort then mutates the copy, not the original." },
    ],
    keyTakeaways: ["map/filter/reduce return new arrays — they don't mutate", "find returns one item; filter returns an array", "sort mutates in place — copy first if you need to preserve", "reduce takes (accumulator, current) plus initial", "Chain methods for declarative pipelines"],
  },
  "typescript:t1:objects": {
    nodeId: "typescript:t1:objects",
    title: "Objects & Destructuring",
    sections: [
      { heading: "Property Access", body: "obj.prop or obj['prop']. Bracket form lets you use dynamic keys or property names with special chars. Adding a property: obj.newKey = value." },
      { heading: "Destructuring", body: "const { name, age } = user pulls out properties in one line. Rename with { name: userName }. Default values: { role = 'guest' }. Nested destructuring works too." },
      { heading: "Spread & Optional Chaining", body: "{ ...a, ...b } merges objects (later wins). a?.b?.c short-circuits to undefined if anything is null/undefined. a ?? b returns b only if a is null or undefined (different from ||)." },
    ],
    codeExamples: [
      { title: "Destructuring", code: `const user = { name: "Ada", age: 36, role: "admin" };
const { name, age } = user;
console.log(name, age); // Ada 36

// Rename + default
const { role: r, country = "US" } = user;
console.log(r, country); // admin US`, explanation: "Pull properties; rename with :; default with =." },
      { title: "Spread", code: `const base = { theme: "dark", lang: "en" };
const merged = { ...base, lang: "fr", color: "blue" };
console.log(merged);
// { theme: "dark", lang: "fr", color: "blue" }`, explanation: "Right wins. Spread is shallow — nested objects share references." },
      { title: "Optional chaining + nullish coalescing", code: `const u = { profile: null };
console.log(u.profile?.bio);            // undefined (no error)
console.log(u.profile?.bio ?? "n/a");   // n/a`, explanation: "?. stops at null/undefined; ?? falls back only on null/undefined (not 0 or '')." },
    ],
    keyTakeaways: ["{ a, b } = obj destructures by key", "{ ...a, ...b } merges objects (right wins, shallow)", "a?.b returns undefined if a is nullish", "a ?? b only falls back on null/undefined", "Use bracket access for dynamic or unusual keys"],
  },
  "typescript:t1:functions": {
    nodeId: "typescript:t1:functions",
    title: "Functions & Arrow Syntax",
    sections: [
      { heading: "Two Syntaxes", body: "function name() { } is a declaration — hoisted, has its own this. const name = () => {} is an arrow — not hoisted, lexical this. Modern code mostly uses arrow functions for callbacks." },
      { heading: "Default & Rest Params", body: "function f(x = 0) sets a default. function f(...nums) collects extras into an array. Same syntax in arrow functions: (x = 0) => and (...nums) => ..." },
      { heading: "Closures", body: "An inner function can read variables from its enclosing scope. The closure captures the variable, not the value at the time. Common gotcha: var inside a loop binds the same variable across iterations." },
    ],
    codeExamples: [
      { title: "Arrow vs declaration", code: `function add(a, b) { return a + b; }
const sub = (a, b) => a - b;
const square = n => n * n;          // single param, no parens
console.log(add(2, 3), sub(5, 2), square(4)); // 5 3 16`, explanation: "Concise arrow form for single-expression bodies — implicit return." },
      { title: "Defaults + rest", code: `function greet(name = "stranger", ...titles) {
  return [name, ...titles].join(" ");
}
console.log(greet("Ada", "PhD"));     // Ada PhD
console.log(greet());                 // stranger`, explanation: "Defaults trigger only on undefined, not null." },
      { title: "Closure", code: `function makeCounter() {
  let n = 0;
  return () => ++n;
}
const c = makeCounter();
console.log(c(), c(), c()); // 1 2 3`, explanation: "Inner arrow captures n. Each call mutates it." },
    ],
    keyTakeaways: ["Use arrow functions for callbacks; declarations for top-level", "Arrow functions inherit this from the enclosing scope", "(x = 0) for defaults; (...args) for rest", "Single-expression arrows: n => n * n (implicit return)", "Closures capture variables, not values"],
  },
  "typescript:t1:promises": {
    nodeId: "typescript:t1:promises",
    title: "Promises",
    sections: [
      { heading: "Promise Basics", body: "A promise represents a future value. It's either pending, fulfilled (with a value), or rejected (with a reason). .then(onFulfilled).catch(onRejected) handles results. Promises are eager — the work starts immediately on creation." },
      { heading: "Chaining", body: "Each .then returns a new promise. Returning a promise inside .then chains them. Returning a value wraps it in Promise.resolve. .finally runs no matter what." },
      { heading: "Combinators", body: "Promise.all([a, b]) waits for all and rejects on first failure. Promise.allSettled returns results for each (no early reject). Promise.race resolves with the first to settle. Promise.any resolves on the first fulfilled (skips rejections)." },
    ],
    codeExamples: [
      { title: "Simple promise", code: `const p = new Promise((resolve, reject) => {
  setTimeout(() => resolve(42), 10);
});
p.then(v => console.log("got", v));
// got 42`, explanation: "resolve and reject are how you settle the promise from inside the executor." },
      { title: "Chaining", code: `Promise.resolve(2)
  .then(n => n * 3)         // 6
  .then(n => Promise.resolve(n + 1)) // 7
  .then(console.log);                // 7`, explanation: "Returning from .then chains. Returning a promise unwraps it." },
      { title: "Promise.all + allSettled", code: `const a = Promise.resolve(1);
const b = Promise.reject("oops");
const c = Promise.resolve(3);

Promise.allSettled([a, b, c]).then(console.log);
// [ {status:'fulfilled', value:1},
//   {status:'rejected', reason:'oops'},
//   {status:'fulfilled', value:3} ]`, explanation: "allSettled never rejects — it tells you what happened to each." },
    ],
    keyTakeaways: ["Promises represent future values: pending → fulfilled or rejected", ".then chains; return a value or another promise", "Promise.all rejects on first failure; allSettled returns each outcome", ".finally runs in both success and failure paths", "Promises are eager — work starts on creation"],
  },
  "typescript:t1:async-await": {
    nodeId: "typescript:t1:async-await",
    title: "Async / Await",
    sections: [
      { heading: "Sync-Looking Async", body: "async functions return promises. Inside one, await pauses until a promise settles. Code reads top-to-bottom but runs cooperatively. Outside an async function, you can use top-level await in modern modules." },
      { heading: "Error Handling", body: "Wrap awaits in try/catch. Errors thrown inside an async function become rejected promises. Don't forget to await — calling an async function without await fires it but never sees the result or error." },
      { heading: "Concurrency Patterns", body: "Sequential awaits are slow. Use Promise.all for independent calls. Use a for-loop with await when you must process in order or care about backpressure." },
    ],
    codeExamples: [
      { title: "Async function", code: `async function load() {
  const a = await Promise.resolve(1);
  const b = await Promise.resolve(2);
  return a + b;
}
load().then(console.log); // 3`, explanation: "await unwraps the promise. Function returns a promise of the final value." },
      { title: "Sequential vs parallel", code: `const wait = ms => new Promise(r => setTimeout(r, ms));

async function sequential() {
  await wait(10);
  await wait(10);
  return "20ms total";
}
async function parallel() {
  await Promise.all([wait(10), wait(10)]);
  return "10ms total";
}
parallel().then(console.log);`, explanation: "Independent calls should run via Promise.all — sequential awaits add up." },
      { title: "try/catch", code: `async function fetchUser() {
  try {
    const res = await Promise.reject(new Error("boom"));
    return res;
  } catch (e) {
    console.log("caught:", e.message);
    return null;
  }
}
fetchUser().then(console.log);
// caught: boom / null`, explanation: "try/catch with await is the natural way to handle async errors." },
    ],
    keyTakeaways: ["async functions return promises", "await unwraps a promise inside an async function", "Use Promise.all for independent concurrent calls", "Wrap await in try/catch for errors", "Forgetting await silently fires-and-forgets"],
  },
  "typescript:t1:modules": {
    nodeId: "typescript:t1:modules",
    title: "Modules (import / export)",
    sections: [
      { heading: "ES Modules", body: "Each file is a module. export makes things visible; import pulls them in. There's exactly one default export per module (export default), and any number of named exports (export const x)." },
      { heading: "Import Syntax", body: "import { a, b } from './mod' for named. import x from './mod' for default. import * as m from './mod' for everything as a namespace. Combine: import x, { a } from './mod'." },
      { heading: "Side Effects", body: "import './mod' (no bindings) runs the module for its side effects only. Useful for polyfills and CSS imports. Tree-shaking generally drops unused imports — but only for pure named exports, not side-effectful imports." },
    ],
    codeExamples: [
      { title: "Named exports", code: `// math.ts
export const PI = 3.14159;
export function area(r: number) { return PI * r * r; }

// app.ts
import { PI, area } from "./math";
console.log(area(5));`, explanation: "Multiple named exports per file — the most common pattern." },
      { title: "Default export", code: `// logger.ts
export default function log(msg: string) {
  console.log("[LOG]", msg);
}

// app.ts
import log from "./logger";
log("hi");`, explanation: "One default per file. Imported name is up to the caller." },
      { title: "Mixed + namespace", code: `// utils.ts
export const VERSION = 1;
export default function help() {}

// app.ts
import help, { VERSION } from "./utils";
import * as utils from "./utils";
console.log(VERSION, utils.VERSION);`, explanation: "Default + named in one import. * gathers everything as a namespace." },
    ],
    keyTakeaways: ["Each file is a module — export to expose, import to use", "One default export per file; many named exports", "import { a } for named; import x for default; import * as m for namespace", "import './mod' runs the module for side effects only", "Tree-shaking drops unused named exports"],
  },

  // ── T2: TS Core ─────────────────────────────────────────
  "typescript:t2:annotations": {
    nodeId: "typescript:t2:annotations",
    title: "Type Annotations",
    sections: [
      { heading: "Basic Types", body: "string, number, boolean, null, undefined, bigint, symbol — same as JS primitives. Plus: any (escape hatch — avoid), unknown (safer alternative), never (impossible value), void (no return)." },
      { heading: "Where Annotations Go", body: "Variables: const x: number = 5. Function params: (x: number) => string. Return type: function f(): string. TypeScript infers most things — only annotate where inference fails or you want to enforce." },
      { heading: "any vs unknown", body: "any disables type checking — every operation is allowed. unknown forces you to narrow before use. Always prefer unknown for values you don't trust." },
    ],
    codeExamples: [
      { title: "Inferred and explicit", code: `const count = 42;             // inferred number
const name: string = "Ada";   // explicit
function add(a: number, b: number): number {
  return a + b;
}
console.log(add(2, 3));`, explanation: "Inference handles 90% of cases. Annotate function signatures for clarity." },
      { title: "any vs unknown", code: `let bad: any = "hello";
bad.toUpperCase();  // ok — and dangerous
bad.foo.bar();      // also ok — runtime crash

let safe: unknown = "hello";
// safe.toUpperCase();  // error — must narrow
if (typeof safe === "string") {
  console.log(safe.toUpperCase());  // ok
}`, explanation: "any means 'turn off TS'; unknown means 'I'll narrow it before using'." },
      { title: "void and never", code: `function log(msg: string): void {
  console.log(msg);
}
function fail(reason: string): never {
  throw new Error(reason);
}`, explanation: "void = no useful return. never = function never returns (throws or infinite loops)." },
    ],
    keyTakeaways: ["Let TS infer; annotate at boundaries (function signatures, exports)", "Avoid any — it disables all type checks", "Prefer unknown when you need a typed catch-all", "void = nothing useful returned; never = doesn't return at all", "Annotations don't run — they're erased at compile time"],
  },
  "typescript:t2:interfaces": {
    nodeId: "typescript:t2:interfaces",
    title: "Interfaces & Type Aliases",
    sections: [
      { heading: "Interface vs Type", body: "Both describe object shapes. interface User { } can be extended (extends) and re-declared (declaration merging). type User = { } is more flexible — supports unions, intersections, conditionals. Pick interface for public APIs, type for internals." },
      { heading: "Optional & Readonly", body: "Mark a property optional with ?: it may be undefined or absent. Mark readonly to forbid reassignment after creation. Both are compile-time only." },
      { heading: "Index Signatures", body: "{ [key: string]: number } describes 'any string key maps to a number'. Useful for record-like objects. Often Record<K, V> from utility types is cleaner." },
    ],
    codeExamples: [
      { title: "Interface", code: `interface User {
  id: number;
  name: string;
  email?: string;     // optional
  readonly createdAt: Date;
}
const u: User = { id: 1, name: "Ada", createdAt: new Date() };
console.log(u.name);
// u.createdAt = new Date();  // error — readonly`, explanation: "?: optional, readonly: can't reassign. Both compile-time." },
      { title: "Extending", code: `interface Animal { name: string; }
interface Dog extends Animal { breed: string; }
const d: Dog = { name: "Rex", breed: "Lab" };
console.log(d);`, explanation: "extends adds properties to a base interface. Multiple bases via comma." },
      { title: "Type alias with union", code: `type Status = "loading" | "ready" | "error";
type Result<T> = { ok: true; value: T } | { ok: false; error: string };

const r: Result<number> = { ok: true, value: 42 };`, explanation: "type aliases support unions, intersections, generics, and conditional types — interfaces don't." },
    ],
    keyTakeaways: ["interface for object shapes you'll extend; type alias for everything else", "?: optional property; readonly: can't reassign", "extends inherits one or more interfaces", "type supports unions, intersections, conditionals", "Both are erased at compile time — no runtime check"],
  },
  "typescript:t2:unions": {
    nodeId: "typescript:t2:unions",
    title: "Union & Intersection Types",
    sections: [
      { heading: "Union: A | B", body: "A union allows any of the listed types. The compiler only lets you do operations valid on every member of the union — narrow with typeof/instanceof/in to access type-specific bits." },
      { heading: "Intersection: A & B", body: "An intersection requires all listed types — typically used to combine object shapes. The result has the keys of all members; conflicts collapse to never." },
      { heading: "Discriminated Unions", body: "Add a literal field that distinguishes each variant: { kind: 'circle'; r: number } | { kind: 'square'; side: number }. Switch on kind and TS narrows automatically. The cleanest pattern for state machines and result types." },
    ],
    codeExamples: [
      { title: "Union narrowing", code: `function format(value: string | number): string {
  if (typeof value === "string") return value.toUpperCase();
  return value.toFixed(2);
}
console.log(format("hi"));     // HI
console.log(format(3.14159));  // 3.14`, explanation: "typeof narrows the union inside the if. Both branches see a single type." },
      { title: "Intersection", code: `interface A { x: number }
interface B { y: number }
type Point = A & B;
const p: Point = { x: 1, y: 2 };
console.log(p);`, explanation: "Point has x AND y. Useful for mixing concerns." },
      { title: "Discriminated union", code: `type Shape =
  | { kind: "circle"; r: number }
  | { kind: "square"; side: number };

function area(s: Shape): number {
  switch (s.kind) {
    case "circle": return Math.PI * s.r ** 2;
    case "square": return s.side ** 2;
  }
}
console.log(area({ kind: "square", side: 4 })); // 16`, explanation: "TS narrows on s.kind. The switch is exhaustive — adding a new kind triggers a compile error." },
    ],
    keyTakeaways: ["A | B allows any of the types; A & B requires all", "Narrow unions with typeof, instanceof, in, or a tag field", "Discriminated unions = the cleanest pattern for state shapes", "Add a literal 'kind' to every variant for clean switches", "Exhaustiveness via never makes new variants compile-error"],
  },
  "typescript:t2:enums-literals": {
    nodeId: "typescript:t2:enums-literals",
    title: "Literal & Enum Types",
    sections: [
      { heading: "Literal Types", body: "A literal type is a single specific value: 'success', 42, true. Combine with unions for fixed-set fields: 'GET' | 'POST' | 'PUT'. Often the right choice over enums in modern TS." },
      { heading: "as const", body: "{ kind: 'circle' } widens to { kind: string }. { kind: 'circle' } as const stays narrow. Use as const for config objects, action creators, lookup tables — anywhere you want literal types preserved." },
      { heading: "Enums", body: "enum gives you a runtime object plus a type. Numeric enums auto-increment. String enums are clearer in logs. Modern style increasingly avoids enums in favor of as-const objects + literal types — better tree-shaking and simpler runtime shape." },
    ],
    codeExamples: [
      { title: "Literal union", code: `type Direction = "up" | "down" | "left" | "right";

function move(d: Direction) {
  console.log("moving", d);
}
move("up");
// move("forward"); // error`, explanation: "Closed set of strings — TS will autocomplete and reject typos." },
      { title: "as const", code: `const STATUS = {
  loading: "loading",
  ready: "ready",
  error: "error",
} as const;

type Status = typeof STATUS[keyof typeof STATUS];
// "loading" | "ready" | "error"
const s: Status = STATUS.ready;
console.log(s);`, explanation: "as const + lookups give enum-like ergonomics with no runtime extra." },
      { title: "String enum", code: `enum LogLevel {
  Debug = "DEBUG",
  Info  = "INFO",
  Error = "ERROR",
}
function log(lvl: LogLevel, msg: string) {
  console.log(\`[\${lvl}] \${msg}\`);
}
log(LogLevel.Info, "hello");`, explanation: "String enums show their name at runtime — easier to debug than numeric enums." },
    ],
    keyTakeaways: ["A literal type is one specific value", "Union of literals = closed set (better than enum for many cases)", "as const preserves literal types in object/array literals", "Prefer string enums over numeric — readable in logs", "Modern TS often replaces enum with as-const objects"],
  },
  "typescript:t2:generics": {
    nodeId: "typescript:t2:generics",
    title: "Generics",
    sections: [
      { heading: "Generic Functions", body: "<T> introduces a type parameter that gets inferred or explicitly passed at call time. Generics let you write code once that works on many types while preserving type information." },
      { heading: "Constraints", body: "<T extends { length: number }> restricts T to types that have the structure. Inside the function you can use the constrained capabilities; at the call site, the actual type is preserved." },
      { heading: "Default Type Params", body: "<T = string> lets callers omit the type. Useful for option-bag types where most callers don't care. Same idea as default values for runtime args." },
    ],
    codeExamples: [
      { title: "Generic function", code: `function first<T>(items: T[]): T | undefined {
  return items[0];
}
const a = first([1, 2, 3]);   // a: number
const b = first(["a", "b"]);  // b: string
console.log(a, b);`, explanation: "T is inferred from the call. The return type tracks the input type." },
      { title: "Constraint", code: `function longest<T extends { length: number }>(a: T, b: T): T {
  return a.length >= b.length ? a : b;
}
console.log(longest("ada", "linus"));            // linus
console.log(longest([1, 2], [3, 4, 5]));         // [3, 4, 5]`, explanation: "Both args must have a length. T is preserved — return type matches input." },
      { title: "Generic class", code: `class Box<T> {
  constructor(public value: T) {}
  map<U>(fn: (v: T) => U): Box<U> {
    return new Box(fn(this.value));
  }
}
const n = new Box(5).map(x => x * 2).map(x => \`v=\${x}\`);
console.log(n.value); // v=10`, explanation: "Both class and method are generic. Each map can transform to a new type." },
    ],
    keyTakeaways: ["<T> declares a type variable inferred at call time", "<T extends Shape> constrains T to required structure", "Generics preserve type info — input type flows to output", "<T = Default> lets callers omit the type", "Use generics to avoid copy-paste typed code"],
  },
  "typescript:t2:utility-types": {
    nodeId: "typescript:t2:utility-types",
    title: "Utility Types",
    sections: [
      { heading: "The Common Six", body: "Partial<T> makes all properties optional. Required<T> makes them all required. Readonly<T> makes them immutable. Pick<T, K> selects a subset of keys. Omit<T, K> drops keys. Record<K, V> builds {[key in K]: V}." },
      { heading: "When To Use Each", body: "Partial: input shapes for updates (PATCH). Pick / Omit: derive a smaller shape from a base type. Record: typed maps with a known key set. Required: enforce 'fully filled' after a partial input." },
      { heading: "Composition", body: "These compose: Pick<Required<User>, 'id' | 'name'> picks two required fields. Don't be afraid to chain; it produces clearer derivations than rewriting object types." },
    ],
    codeExamples: [
      { title: "Partial / Pick / Omit", code: `interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}
type UserUpdate = Partial<User>;          // all optional
type UserSummary = Pick<User, "id" | "name">;
type UserPublic = Omit<User, "email">;

const upd: UserUpdate = { name: "new" };
const s: UserSummary = { id: 1, name: "Ada" };
console.log(upd, s);`, explanation: "Build new types from existing ones without re-typing fields." },
      { title: "Record", code: `type Theme = "light" | "dark";
type Palette = Record<Theme, string>;

const colors: Palette = {
  light: "#fff",
  dark: "#000",
};
console.log(colors);`, explanation: "Record<K, V> = { [k in K]: V }. Forces exhaustive coverage of K." },
      { title: "Composition", code: `interface Settings {
  theme?: string;
  fontSize?: number;
  notifications?: boolean;
}
type RequiredSettings = Required<Settings>;
const final: RequiredSettings = { theme: "dark", fontSize: 16, notifications: true };
console.log(final);`, explanation: "Required forces every property to be set. Useful after defaults are merged." },
    ],
    keyTakeaways: ["Partial / Required toggle optionality across all keys", "Pick / Omit subset and exclude by key", "Record<K, V> for typed maps with known keys", "These types compose cleanly — chain freely", "Stop hand-typing derived shapes — use utilities"],
  },

  // ── T3: Advanced ────────────────────────────────────────
  "typescript:t3:conditional-types": {
    nodeId: "typescript:t3:conditional-types",
    title: "Conditional Types",
    sections: [
      { heading: "T extends U ? X : Y", body: "Conditional types branch at the type level. Used inside utility types and to express 'if T is a function, give me its return type'." },
      { heading: "infer Keyword", body: "infer R extracts a piece of an inferred type. Combined with conditional types, it powers ReturnType, Parameters, Awaited, etc." },
      { heading: "Distributive Conditionals", body: "When the checked type is a naked type parameter and you pass it a union, the conditional distributes: T extends X ? A : B applied to A | B becomes (A extends X ? ... ) | (B extends X ? ...). Wrap in [T] to disable." },
    ],
    codeExamples: [
      { title: "Built-in pattern", code: `type IsString<T> = T extends string ? true : false;
type A = IsString<"hi">;   // true
type B = IsString<42>;     // false
const a: A = true;
const b: B = false;
console.log(a, b);`, explanation: "Type-level conditional. Checked at compile time; erased at runtime." },
      { title: "infer extracts", code: `type ReturnTypeOf<F> = F extends (...args: any[]) => infer R ? R : never;

function getUser() { return { id: 1, name: "Ada" }; }
type U = ReturnTypeOf<typeof getUser>;  // { id: number; name: string }
const u: U = { id: 1, name: "Ada" };
console.log(u);`, explanation: "infer R captures the return type. Same idea as the built-in ReturnType." },
      { title: "Distributive", code: `type ToArray<T> = T extends any ? T[] : never;
type S = ToArray<string | number>;   // string[] | number[]
const s: S = ["a", "b"];
console.log(s);`, explanation: "Naked T over a union → result is a union of arrays, not (string | number)[]." },
    ],
    keyTakeaways: ["T extends U ? X : Y branches at the type level", "infer captures part of a structural match", "Conditionals distribute over naked unions", "Wrap as [T] extends [U] to opt out of distribution", "Powers built-in utilities like ReturnType and Parameters"],
  },
  "typescript:t3:mapped-types": {
    nodeId: "typescript:t3:mapped-types",
    title: "Mapped Types",
    sections: [
      { heading: "[K in keyof T]", body: "Iterate over the keys of a type and produce a new shape. The basis of Partial, Required, Readonly, and Record." },
      { heading: "Modifiers", body: "Add or remove modifiers on the way: +readonly / -readonly, +? / -?. Required<T> uses -? to strip optionality." },
      { heading: "Key Remapping", body: "{ [K in keyof T as NewKey]: T[K] } renames keys. Use template literal types to systematically prefix/suffix keys, e.g. event handler types from a state shape." },
    ],
    codeExamples: [
      { title: "Manual Partial", code: `type MyPartial<T> = { [K in keyof T]?: T[K] };

interface User { id: number; name: string }
const u: MyPartial<User> = { name: "Ada" };
console.log(u);`, explanation: "Reproduce the built-in Partial. + / - control optionality." },
      { title: "Strip readonly", code: `type Mutable<T> = { -readonly [K in keyof T]: T[K] };

interface Config { readonly host: string; readonly port: number }
const c: Mutable<Config> = { host: "x", port: 1 };
c.port = 2;  // ok
console.log(c);`, explanation: "-readonly removes the readonly modifier per key." },
      { title: "Key remap", code: `type Getters<T> = {
  [K in keyof T as \`get\${Capitalize<string & K>}\`]: () => T[K]
};

interface User { id: number; name: string }
type UserGetters = Getters<User>;
// { getId: () => number; getName: () => string }
const x: UserGetters = { getId: () => 1, getName: () => "Ada" };
console.log(x.getId(), x.getName());`, explanation: "as remaps keys. Template literal types build the new names systematically." },
    ],
    keyTakeaways: ["{ [K in keyof T]: ... } iterates type keys", "+/- on readonly and ? add or remove modifiers", "as remaps keys (often paired with template literal types)", "All built-in utilities are mapped types under the hood", "Combine with conditional types for sophisticated transforms"],
  },
  "typescript:t3:template-literal-types": {
    nodeId: "typescript:t3:template-literal-types",
    title: "Template Literal Types",
    sections: [
      { heading: "String Templates At The Type Level", body: "`hello ${T}` where T is a string-like type produces a literal type. Combine with unions to enumerate possibilities. The result is a static set of strings — typos rejected at compile time." },
      { heading: "Built-In String Helpers", body: "Uppercase, Lowercase, Capitalize, Uncapitalize transform string literal types in place. Useful for systematically deriving prefixed/suffixed names." },
      { heading: "Practical Uses", body: "Route parameter typing, event-handler name generation, CSS class enumeration, ID branding (e.g. `user_${string}`). Wherever you use string formatting at runtime, you can often type it at compile time." },
    ],
    codeExamples: [
      { title: "Template literal type", code: `type Verb = "GET" | "POST";
type Path = "/users" | "/posts";
type Endpoint = \`\${Verb} \${Path}\`;
// "GET /users" | "GET /posts" | "POST /users" | "POST /posts"
const e: Endpoint = "GET /users";
console.log(e);`, explanation: "Cross product of unions inside a template literal." },
      { title: "Capitalize for handlers", code: `type EventName<T extends string> = \`on\${Capitalize<T>}\`;
type ClickHandler = EventName<"click">;   // "onClick"
type FocusHandler = EventName<"focus">;   // "onFocus"
const h: ClickHandler = "onClick";
console.log(h);`, explanation: "Type-level string transformation matching React's handler naming." },
      { title: "ID branding", code: `type UserId = \`user_\${string}\`;
const id: UserId = "user_123";
// const bad: UserId = "anon";  // error
console.log(id);`, explanation: "Branded ID types catch mismatches between user IDs and other strings." },
    ],
    keyTakeaways: ["Template literal types compose like template strings, but at the type level", "Cross-product over unions to enumerate combos", "Uppercase / Capitalize systematically transform names", "Brand IDs to prevent mixing different string IDs", "Handy for event handler names, route params, CSS class lists"],
  },
  "typescript:t3:type-guards": {
    nodeId: "typescript:t3:type-guards",
    title: "Type Guards & Predicates",
    sections: [
      { heading: "Built-In Guards", body: "typeof for primitives (string, number, boolean, undefined, function). instanceof for class instances. in to check property existence on an object. Each narrows the type in the conditional branch." },
      { heading: "User-Defined Guards", body: "function isFoo(x: unknown): x is Foo runs at runtime and tells TypeScript that, if it returns true, x is Foo. The is X return type is the magic. Used for ad-hoc shape checks and discriminated unions." },
      { heading: "Assertion Functions", body: "function assertFoo(x: unknown): asserts x is Foo throws if x isn't a Foo. After the call, TS treats x as Foo. Same family as guards, but for control-flow narrowing without an if." },
    ],
    codeExamples: [
      { title: "typeof + in", code: `function describe(value: unknown) {
  if (typeof value === "string") return value.length;
  if (typeof value === "object" && value !== null && "id" in value)
    return (value as { id: number }).id;
  return -1;
}
console.log(describe("hello"));     // 5
console.log(describe({ id: 7 }));   // 7`, explanation: "Combine typeof, null check, and in to narrow unknown safely." },
      { title: "User-defined guard", code: `interface Cat { meow: () => void }
function isCat(x: unknown): x is Cat {
  return typeof x === "object" && x !== null && typeof (x as any).meow === "function";
}
const c: unknown = { meow: () => console.log("meow") };
if (isCat(c)) c.meow();`, explanation: "x is Cat tells TS the predicate guarantees the type when true." },
      { title: "Assertion function", code: `function assertString(x: unknown): asserts x is string {
  if (typeof x !== "string") throw new Error("not string");
}

const v: unknown = "hi";
assertString(v);
console.log(v.toUpperCase());  // v is now string`, explanation: "After the call, TS treats v as a string for the rest of the scope." },
    ],
    keyTakeaways: ["typeof, instanceof, in are the built-in guards", "x is T return type defines a user guard", "asserts x is T narrows by throwing on the bad path", "Combine null check and in for safe object guards", "Guards are runtime — write them carefully"],
  },
  "typescript:t3:advanced-patterns": {
    nodeId: "typescript:t3:advanced-patterns",
    title: "Advanced Patterns",
    sections: [
      { heading: "Discriminated Unions + Exhaustiveness", body: "A discriminator field plus a switch lets TS verify you handled every case. Use the never trick: assigning the unhandled value to a never variable triggers a compile error if a new variant is added." },
      { heading: "Branded Types", body: "Branded types let two structurally identical types stay distinct. Common for IDs: type UserId = string & { readonly __brand: 'UserId' }. Forces explicit construction; prevents passing a Post ID where a User ID is expected." },
      { heading: "satisfies Operator", body: "Satisfies checks that an expression matches a type without widening it. Great for config objects: stays narrow for autocomplete while being constrained to a shape." },
    ],
    codeExamples: [
      { title: "Exhaustive switch", code: `type Shape = { kind: "circle"; r: number } | { kind: "square"; side: number };

function area(s: Shape): number {
  switch (s.kind) {
    case "circle": return Math.PI * s.r ** 2;
    case "square": return s.side ** 2;
    default: {
      const _exhaustive: never = s;  // compile error if a kind is added
      return _exhaustive;
    }
  }
}
console.log(area({ kind: "circle", r: 2 }));`, explanation: "The never branch makes new variants a compile error — the cheapest exhaustiveness check." },
      { title: "Branded ID", code: `type UserId = string & { readonly __brand: "UserId" };
type PostId = string & { readonly __brand: "PostId" };

function userId(s: string): UserId { return s as UserId; }
const u = userId("u_123");
function fetchUser(id: UserId) { return id; }
fetchUser(u);
// fetchUser("u_123"); // error — plain string isn't UserId
console.log(u);`, explanation: "Same string at runtime; distinct type at compile time. Constructor function gates entry." },
      { title: "satisfies", code: `type Theme = Record<"light" | "dark", { bg: string; fg: string }>;

const themes = {
  light: { bg: "#fff", fg: "#000" },
  dark:  { bg: "#000", fg: "#fff" },
} satisfies Theme;

themes.light.bg.toUpperCase();  // ok — narrow type preserved
console.log(themes);`, explanation: "satisfies validates against Theme without widening — autocomplete stays sharp." },
    ],
    keyTakeaways: ["Discriminated unions + exhaustive switch = type-checked state machines", "never default branch makes new variants compile errors", "Brand IDs to keep structurally identical types apart", "satisfies checks fit without widening — best of both worlds", "These patterns scale well in real codebases"],
  },
};
