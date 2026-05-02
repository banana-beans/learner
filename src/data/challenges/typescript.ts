// ============================================================
// TypeScript — All Tiers Challenges
// ============================================================
// All challenges run via the in-browser JS runner (lang inferred
// from "typescript:" prefix). TS-only syntax is stripped on the
// fly so simple type annotations don't break the runner.
// ============================================================

import type { Challenge } from "@/lib/types";

export const typescriptChallenges: Challenge[] = [
  // T1
  {
    id: "ts-t1-vars-1",
    nodeId: "typescript:t1:variables",
    type: "write_from_scratch",
    title: "const + let",
    description: "Declare const PI = 3.14, let r = 5, then console.log(PI * r * r). Expected: 78.5",
    difficulty: 1, isBoss: false,
    starterCode: "// const PI ... let r ... console.log(...)\n",
    testCases: [{ id: "tc1", input: "", expectedOutput: "78.5", visible: true, category: "basic" }],
    hints: [
      { tier: "nudge", text: "PI doesn't change — use const. r might — use let.", xpPenalty: 0.9 },
      { tier: "guide", text: "Multiply with *. console.log to print.", xpPenalty: 0.75 },
      { tier: "reveal", text: `const PI = 3.14;
let r = 5;
console.log(PI * r * r);`, xpPenalty: 0.5 },
    ],
    baseXP: 100, tags: ["const", "let"],
  },
  {
    id: "ts-t1-arrays-1",
    nodeId: "typescript:t1:arrays",
    type: "write_from_scratch",
    title: "map + filter pipeline",
    description: "Given const nums = [1,2,3,4,5,6], log a list of doubled even numbers. Expected: [4,8,12]",
    difficulty: 2, isBoss: true,
    starterCode: "const nums = [1,2,3,4,5,6];\n",
    testCases: [{ id: "tc1", input: "", expectedOutput: "[4,8,12]", visible: true, category: "basic" }],
    hints: [
      { tier: "nudge", text: "Filter for evens, then map to doubles.", xpPenalty: 0.9 },
      { tier: "guide", text: ".filter(n => n % 2 === 0).map(n => n * 2)", xpPenalty: 0.75 },
      { tier: "reveal", text: `const nums = [1,2,3,4,5,6];
console.log(nums.filter(n => n % 2 === 0).map(n => n * 2));`, xpPenalty: 0.5 },
    ],
    baseXP: 150, tags: ["map", "filter"],
  },
  {
    id: "ts-t1-objects-1",
    nodeId: "typescript:t1:objects",
    type: "write_from_scratch",
    title: "Destructure with default",
    description: "Given const user = { name: 'Ada' }, destructure name and role with role default 'guest'. Log `${name} is ${role}`. Expected: Ada is guest",
    difficulty: 2, isBoss: false,
    starterCode: "const user = { name: 'Ada' };\n",
    testCases: [{ id: "tc1", input: "", expectedOutput: "Ada is guest", visible: true, category: "basic" }],
    hints: [
      { tier: "nudge", text: "{ name, role = 'guest' } = user", xpPenalty: 0.9 },
      { tier: "guide", text: "Use a template literal: `${name} is ${role}`", xpPenalty: 0.75 },
      { tier: "reveal", text: `const user = { name: 'Ada' };
const { name, role = 'guest' } = user;
console.log(\`\${name} is \${role}\`);`, xpPenalty: 0.5 },
    ],
    baseXP: 150, tags: ["destructuring"],
  },
  {
    id: "ts-t1-fn-1",
    nodeId: "typescript:t1:functions",
    type: "write_from_scratch",
    title: "Arrow function",
    description: "Define const sq = (n: number) => n * n. Log sq(7). Expected: 49",
    difficulty: 1, isBoss: false,
    starterCode: "// const sq ... console.log(sq(7))\n",
    testCases: [{ id: "tc1", input: "", expectedOutput: "49", visible: true, category: "basic" }],
    hints: [
      { tier: "nudge", text: "(n) => n * n is the arrow form.", xpPenalty: 0.9 },
      { tier: "guide", text: "Single expression — no braces needed.", xpPenalty: 0.75 },
      { tier: "reveal", text: `const sq = (n: number) => n * n;
console.log(sq(7));`, xpPenalty: 0.5 },
    ],
    baseXP: 100, tags: ["arrow"],
  },
  {
    id: "ts-t1-promise-1",
    nodeId: "typescript:t1:promises",
    type: "write_from_scratch",
    title: "Promise.resolve chain",
    description: "Promise.resolve(2).then(n => n*5).then(console.log). Expected: 10",
    difficulty: 2, isBoss: false,
    starterCode: "// chain promises\n",
    testCases: [{ id: "tc1", input: "", expectedOutput: "10", visible: true, category: "basic" }],
    hints: [
      { tier: "nudge", text: "Promise.resolve(value) creates a fulfilled promise.", xpPenalty: 0.9 },
      { tier: "guide", text: "Chain .then to transform.", xpPenalty: 0.75 },
      { tier: "reveal", text: `Promise.resolve(2).then(n => n * 5).then(console.log);`, xpPenalty: 0.5 },
    ],
    baseXP: 150, tags: ["promise"],
  },
  {
    id: "ts-t1-async-1",
    nodeId: "typescript:t1:async-await",
    type: "write_from_scratch",
    title: "async/await sum",
    description: "Define async function sum() that awaits Promise.resolve(3) and Promise.resolve(4) sequentially, returns the total. Log the result. Expected: 7",
    difficulty: 2, isBoss: true,
    starterCode: "// async function sum ...\n",
    testCases: [{ id: "tc1", input: "", expectedOutput: "7", visible: true, category: "basic" }],
    hints: [
      { tier: "nudge", text: "async function returns a promise — call .then on it.", xpPenalty: 0.9 },
      { tier: "guide", text: "Or use top-level await if your runner supports it.", xpPenalty: 0.75 },
      { tier: "reveal", text: `async function sum() {
  const a = await Promise.resolve(3);
  const b = await Promise.resolve(4);
  return a + b;
}
sum().then(console.log);`, xpPenalty: 0.5 },
    ],
    baseXP: 200, tags: ["async", "await"],
  },
  {
    id: "ts-t1-mod-1",
    nodeId: "typescript:t1:modules",
    type: "predict_output",
    title: "Default vs named",
    description: "Run: const NAMED = 'a'; const DEFAULT = 'b'; console.log(NAMED, DEFAULT). Expected: a b",
    difficulty: 1, isBoss: false,
    starterCode: "const NAMED = 'a';\nconst DEFAULT = 'b';\n",
    testCases: [{ id: "tc1", input: "", expectedOutput: "a b", visible: true, category: "basic" }],
    hints: [
      { tier: "nudge", text: "Just print both.", xpPenalty: 0.9 },
      { tier: "guide", text: "console.log accepts multiple args, separated by spaces.", xpPenalty: 0.75 },
      { tier: "reveal", text: `const NAMED = 'a';
const DEFAULT = 'b';
console.log(NAMED, DEFAULT);`, xpPenalty: 0.5 },
    ],
    baseXP: 80, tags: ["module"],
  },

  // T2
  {
    id: "ts-t2-ann-1",
    nodeId: "typescript:t2:annotations",
    type: "write_from_scratch",
    title: "Annotated function",
    description: "Define add(a: number, b: number): number that returns a+b. Log add(3, 4). Expected: 7",
    difficulty: 1, isBoss: false,
    starterCode: "// typed function\n",
    testCases: [{ id: "tc1", input: "", expectedOutput: "7", visible: true, category: "basic" }],
    hints: [
      { tier: "nudge", text: "Annotate params with : type and return with : type after parens.", xpPenalty: 0.9 },
      { tier: "guide", text: "function add(a: number, b: number): number { return a + b }", xpPenalty: 0.75 },
      { tier: "reveal", text: `function add(a: number, b: number): number {
  return a + b;
}
console.log(add(3, 4));`, xpPenalty: 0.5 },
    ],
    baseXP: 100, tags: ["annotation"],
  },
  {
    id: "ts-t2-iface-1",
    nodeId: "typescript:t2:interfaces",
    type: "write_from_scratch",
    title: "User interface",
    description: "Define interface User { id: number; name: string }. Log a User { id:1, name: 'Ada' }. Expected: {id:1,name:\"Ada\"}",
    difficulty: 2, isBoss: false,
    starterCode: "// interface User { ... }\n",
    testCases: [{ id: "tc1", input: "", expectedOutput: "{\"id\":1,\"name\":\"Ada\"}", visible: true, category: "basic" }],
    hints: [
      { tier: "nudge", text: "interface goes outside; const u: User = ...", xpPenalty: 0.9 },
      { tier: "guide", text: "console.log auto-stringifies objects.", xpPenalty: 0.75 },
      { tier: "reveal", text: `interface User { id: number; name: string }
const u: User = { id: 1, name: "Ada" };
console.log(u);`, xpPenalty: 0.5 },
    ],
    baseXP: 130, tags: ["interface"],
  },
  {
    id: "ts-t2-union-1",
    nodeId: "typescript:t2:unions",
    type: "write_from_scratch",
    title: "Narrow string | number",
    description: "Define format(v: string | number): string that returns v.toUpperCase() if string, else v.toFixed(2). Log format(3.14159). Expected: 3.14",
    difficulty: 2, isBoss: true,
    starterCode: "// union narrowing\n",
    testCases: [{ id: "tc1", input: "", expectedOutput: "3.14", visible: true, category: "basic" }],
    hints: [
      { tier: "nudge", text: "typeof v === 'string' narrows the union.", xpPenalty: 0.9 },
      { tier: "guide", text: "If string, return upper; else, toFixed(2).", xpPenalty: 0.75 },
      { tier: "reveal", text: `function format(v: string | number): string {
  if (typeof v === 'string') return v.toUpperCase();
  return v.toFixed(2);
}
console.log(format(3.14159));`, xpPenalty: 0.5 },
    ],
    baseXP: 180, tags: ["union", "narrowing"],
  },
  {
    id: "ts-t2-lit-1",
    nodeId: "typescript:t2:enums-literals",
    type: "write_from_scratch",
    title: "Literal status",
    description: "Define type Status = 'ok' | 'fail'. Const s: Status = 'ok'. Log s. Expected: ok",
    difficulty: 1, isBoss: false,
    starterCode: "// literal status\n",
    testCases: [{ id: "tc1", input: "", expectedOutput: "ok", visible: true, category: "basic" }],
    hints: [
      { tier: "nudge", text: "type alias with a union of string literals.", xpPenalty: 0.9 },
      { tier: "guide", text: "type Status = 'ok' | 'fail';", xpPenalty: 0.75 },
      { tier: "reveal", text: `type Status = 'ok' | 'fail';
const s: Status = 'ok';
console.log(s);`, xpPenalty: 0.5 },
    ],
    baseXP: 120, tags: ["literal"],
  },
  {
    id: "ts-t2-gen-1",
    nodeId: "typescript:t2:generics",
    type: "write_from_scratch",
    title: "Generic identity",
    description: "Define identity<T>(x: T): T returning x. Log identity('hello').toUpperCase(). Expected: HELLO",
    difficulty: 2, isBoss: true,
    starterCode: "// identity<T>\n",
    testCases: [{ id: "tc1", input: "", expectedOutput: "HELLO", visible: true, category: "basic" }],
    hints: [
      { tier: "nudge", text: "<T> goes between function name and parens.", xpPenalty: 0.9 },
      { tier: "guide", text: "function identity<T>(x: T): T { return x }", xpPenalty: 0.75 },
      { tier: "reveal", text: `function identity<T>(x: T): T { return x; }
console.log(identity('hello').toUpperCase());`, xpPenalty: 0.5 },
    ],
    baseXP: 180, tags: ["generic"],
  },
  {
    id: "ts-t2-util-1",
    nodeId: "typescript:t2:utility-types",
    type: "write_from_scratch",
    title: "Pick a subset",
    description: "Given interface User { id: number; name: string; email: string }, define type S = Pick<User, 'id'|'name'>. Construct s and log it. Expected: {\"id\":1,\"name\":\"Ada\"}",
    difficulty: 2, isBoss: false,
    starterCode: "// Pick<User, 'id'|'name'>\n",
    testCases: [{ id: "tc1", input: "", expectedOutput: "{\"id\":1,\"name\":\"Ada\"}", visible: true, category: "basic" }],
    hints: [
      { tier: "nudge", text: "Pick<T, K> selects keys K from T.", xpPenalty: 0.9 },
      { tier: "guide", text: "type S = Pick<User, 'id' | 'name'>", xpPenalty: 0.75 },
      { tier: "reveal", text: `interface User { id: number; name: string; email: string }
type S = Pick<User, 'id' | 'name'>;
const s: S = { id: 1, name: "Ada" };
console.log(s);`, xpPenalty: 0.5 },
    ],
    baseXP: 150, tags: ["Pick"],
  },

  // T3 — manual since these are largely type-level
  {
    id: "ts-t3-cond-1",
    nodeId: "typescript:t3:conditional-types",
    type: "write_from_scratch",
    title: "ReturnType inference",
    description: "Read the solution and confirm you understand. (No code execution required — type-level concept.)",
    difficulty: 3, isBoss: true, lang: "manual",
    starterCode: "",
    hints: [
      { tier: "nudge", text: "infer R captures the return type when the input is a function.", xpPenalty: 0.9 },
      { tier: "guide", text: "T extends (...a:any[]) => infer R ? R : never", xpPenalty: 0.75 },
      { tier: "reveal", text: `type ReturnTypeOf<F> = F extends (...args: any[]) => infer R ? R : never;
function getUser() { return { id: 1, name: "Ada" }; }
type U = ReturnTypeOf<typeof getUser>;
// U = { id: number; name: string }`, xpPenalty: 0.5 },
    ],
    baseXP: 200, tags: ["conditional", "infer"],
  },
  {
    id: "ts-t3-mapped-1",
    nodeId: "typescript:t3:mapped-types",
    type: "write_from_scratch",
    title: "Mutable<T>",
    description: "Read the solution and confirm you understand. (No code execution required.)",
    difficulty: 3, isBoss: false, lang: "manual",
    starterCode: "",
    hints: [
      { tier: "nudge", text: "-readonly removes the modifier.", xpPenalty: 0.9 },
      { tier: "guide", text: "{ -readonly [K in keyof T]: T[K] }", xpPenalty: 0.75 },
      { tier: "reveal", text: `type Mutable<T> = { -readonly [K in keyof T]: T[K] };`, xpPenalty: 0.5 },
    ],
    baseXP: 180, tags: ["mapped", "modifier"],
  },
  {
    id: "ts-t3-tlit-1",
    nodeId: "typescript:t3:template-literal-types",
    type: "write_from_scratch",
    title: "Endpoint cross product",
    description: "Read the solution and confirm you understand the cross product behavior.",
    difficulty: 3, isBoss: false, lang: "manual",
    starterCode: "",
    hints: [
      { tier: "nudge", text: "Template literal type with two unions.", xpPenalty: 0.9 },
      { tier: "guide", text: "`${Verb} ${Path}` over Verb and Path unions.", xpPenalty: 0.75 },
      { tier: "reveal", text: `type Verb = "GET" | "POST";
type Path = "/users" | "/posts";
type Endpoint = \`\${Verb} \${Path}\`;
// "GET /users" | "GET /posts" | "POST /users" | "POST /posts"`, xpPenalty: 0.5 },
    ],
    baseXP: 180, tags: ["template-literal-type"],
  },
  {
    id: "ts-t3-guard-1",
    nodeId: "typescript:t3:type-guards",
    type: "write_from_scratch",
    title: "User-defined guard",
    description: "Define isString(x: unknown): x is string. Then test it on 'hi' and 42 — log [isString('hi'), isString(42)]. Expected: [true,false]",
    difficulty: 3, isBoss: true,
    starterCode: "// guard with x is string\n",
    testCases: [{ id: "tc1", input: "", expectedOutput: "[true,false]", visible: true, category: "basic" }],
    hints: [
      { tier: "nudge", text: "Return type uses the `x is T` syntax.", xpPenalty: 0.9 },
      { tier: "guide", text: "function isString(x: unknown): x is string { return typeof x === 'string' }", xpPenalty: 0.75 },
      { tier: "reveal", text: `function isString(x: unknown): x is string {
  return typeof x === "string";
}
console.log([isString("hi"), isString(42)]);`, xpPenalty: 0.5 },
    ],
    baseXP: 200, tags: ["guard", "predicate"],
  },
  {
    id: "ts-t3-adv-1",
    nodeId: "typescript:t3:advanced-patterns",
    type: "write_from_scratch",
    title: "Exhaustive switch",
    description: "Read the solution and confirm — adding a new variant turns the never branch into a compile error.",
    difficulty: 4, isBoss: true, lang: "manual",
    starterCode: "",
    hints: [
      { tier: "nudge", text: "Assign the unhandled case to a never variable.", xpPenalty: 0.9 },
      { tier: "guide", text: "default: { const _x: never = s; return _x }", xpPenalty: 0.75 },
      { tier: "reveal", text: `type Shape = { kind: "circle"; r: number } | { kind: "square"; side: number };
function area(s: Shape): number {
  switch (s.kind) {
    case "circle": return Math.PI * s.r ** 2;
    case "square": return s.side ** 2;
    default: { const _exhaustive: never = s; return _exhaustive; }
  }
}`, xpPenalty: 0.5 },
    ],
    baseXP: 250, tags: ["discriminated-union", "exhaustive"],
  },
];
