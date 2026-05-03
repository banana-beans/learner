import type { Snippet } from "./types";

export const typescriptSnippets: Snippet[] = [
  {
    id: "ts-narrow-typeof",
    language: "typescript",
    title: "Narrowing with typeof",
    tag: "types",
    code: `function format(value: string | number): string {
    // Inside this if, TS knows value is string.
    if (typeof value === "string") {
        return value.toUpperCase();
    }
    // ...and here it knows value is number.
    return value.toFixed(2);
}

format("hi");      // "HI"
format(3.14159);   // "3.14"`,
    explanation:
      "Control-flow narrowing: TS shrinks the type within branches based on typeof, instanceof, in, or your own predicates.",
  },
  {
    id: "ts-discriminated-union",
    language: "typescript",
    title: "Discriminated unions",
    tag: "types",
    code: `// Each variant has a literal 'kind' field — the discriminator.
type Shape =
  | { kind: "circle"; r: number }
  | { kind: "square"; side: number };

function area(s: Shape): number {
    switch (s.kind) {
        case "circle": return Math.PI * s.r ** 2;   // s narrowed to circle
        case "square": return s.side ** 2;          // s narrowed to square
    }
}

area({ kind: "circle", r: 3 });    // 28.27...`,
    explanation:
      "The cleanest pattern for state shapes. Add a 'never' default to make adding a new variant a compile error — exhaustiveness for free.",
  },
  {
    id: "ts-as-const",
    language: "typescript",
    title: "as const — literal types",
    tag: "types",
    code: `// Without 'as const' — wider types
const status1 = { kind: "loading" };
//    ^ { kind: string } — too wide

// With 'as const' — every property is its literal type
const status2 = { kind: "loading" } as const;
//    ^ { readonly kind: "loading" } — exact

// Useful for typed lookup tables / enums
const COLORS = {
    red:   "#ff0000",
    green: "#00ff00",
    blue:  "#0000ff",
} as const;

type Color = keyof typeof COLORS;   // "red" | "green" | "blue"`,
    explanation:
      "Locks values to their literal types. Combined with keyof typeof, gives you enum-like ergonomics without runtime overhead.",
  },
  {
    id: "ts-pick-omit",
    language: "typescript",
    title: "Pick + Omit utility types",
    tag: "types",
    code: `interface User {
    id: number;
    name: string;
    email: string;
    role: string;
}

// Pick<T, K> — keeps only the listed keys.
type UserSummary = Pick<User, "id" | "name">;
// { id: number; name: string }

// Omit<T, K> — keeps everything EXCEPT the listed keys.
type UserPublic = Omit<User, "email">;
// { id: number; name: string; role: string }

const s: UserSummary = { id: 1, name: "Ada" };`,
    explanation:
      "Build new types from existing ones without re-typing fields. Essential for shapes like 'public user' or 'partial update.'",
  },
  {
    id: "ts-partial",
    language: "typescript",
    title: "Partial<T> for updates",
    tag: "types",
    code: `interface User {
    id: number;
    name: string;
    email: string;
}

// Partial<T> makes EVERY property optional.
function updateUser(id: number, patch: Partial<Omit<User, "id">>) {
    // patch can be any subset of name + email — not id (omitted).
    // ...
}

updateUser(1, { name: "Linus" });             // ok
updateUser(1, { email: "x@y.com" });          // ok
updateUser(1, { name: "X", email: "y" });     // ok`,
    explanation:
      "Partial<T> is what PATCH-style update functions usually want. Combine with Omit to exclude immutable fields like id.",
  },
  {
    id: "ts-record",
    language: "typescript",
    title: "Record<K, V>",
    tag: "types",
    code: `// Record<Keys, Value> — typed map with KNOWN keys.
type Theme = Record<"light" | "dark", { bg: string; fg: string }>;

const themes: Theme = {
    light: { bg: "#fff", fg: "#000" },
    dark:  { bg: "#000", fg: "#fff" },
    // forgetting "light" or "dark" — compile error
};

// Record with arbitrary string keys:
const wordCount: Record<string, number> = {};
wordCount["apple"] = 1;
wordCount["banana"] = 2;`,
    explanation:
      "Record forces exhaustive coverage when keys are a union of literals. With string keys, it's just a typed dict.",
  },
  {
    id: "ts-readonly",
    language: "typescript",
    title: "readonly + ReadonlyArray",
    tag: "types",
    code: `interface Config {
    // readonly properties can't be reassigned after construction.
    readonly host: string;
    readonly port: number;
}

const c: Config = { host: "localhost", port: 8080 };
// c.port = 9000;   // compile error — readonly

// ReadonlyArray<T> = T[] without push/pop/splice.
function logAll(items: ReadonlyArray<string>) {
    for (const i of items) console.log(i);
    // items.push("oops");   // error
}`,
    explanation:
      "Compile-time immutability. Doesn't deep-freeze at runtime, but it stops accidental mutation in callers and self-documents intent.",
  },
  {
    id: "ts-generic-fn",
    language: "typescript",
    title: "Generic function",
    tag: "types",
    code: `// <T> declares a type variable. T is inferred from arguments at call time
// and flows through to the return type — no type erasure.
function first<T>(items: T[]): T | undefined {
    return items[0];
}

const a = first([1, 2, 3]);          // a: number | undefined
const b = first(["x", "y"]);         // b: string | undefined
const c = first<boolean>([true]);    // c: boolean | undefined  (explicit)`,
    explanation:
      "Generics preserve type info from input to output. T is inferred at the call site — explicit annotation is rarely needed.",
  },
  {
    id: "ts-keyof",
    language: "typescript",
    title: "keyof for safe property access",
    tag: "types",
    code: `// keyof T = union of T's property names as literal types.
function get<T, K extends keyof T>(obj: T, key: K): T[K] {
    return obj[key];
}

const user = { id: 1, name: "Ada", role: "admin" };

const id = get(user, "id");        // id: number
const name = get(user, "name");    // name: string
// get(user, "missing");           // error — not in keyof

// keyof T paired with T[K] gives type-safe property access.`,
    explanation:
      "keyof is how you write generic property accessors. T[K] reads T's value type at key K — neither is allowed to drift.",
  },
  {
    id: "ts-template-literal",
    language: "typescript",
    title: "Template literal types",
    tag: "types",
    code: `type Verb = "GET" | "POST";
type Path = "/users" | "/posts";

// Cross-product as a type — every combination is a literal.
type Endpoint = \`\${Verb} \${Path}\`;
// "GET /users" | "GET /posts" | "POST /users" | "POST /posts"

const e: Endpoint = "GET /users";
// const bad: Endpoint = "DELETE /users";    // compile error`,
    explanation:
      "Template literal types compose like template strings — at the type level. Great for typed routes, event names, CSS class lists.",
  },
  {
    id: "ts-conditional-type",
    language: "typescript",
    title: "Conditional types",
    tag: "types",
    code: `// T extends U ? X : Y — branches at the type level.
type IsString<T> = T extends string ? true : false;

type A = IsString<"hi">;     // true
type B = IsString<42>;       // false

// Combined with infer to extract types:
type ReturnTypeOf<F> = F extends (...args: any[]) => infer R ? R : never;

function getUser() {
    return { id: 1, name: "Ada" };
}
type U = ReturnTypeOf<typeof getUser>;   // { id: number; name: string }`,
    explanation:
      "Conditional types power most utility types. 'infer' captures part of a structural match — that's how ReturnType, Parameters, etc. are built.",
  },
  {
    id: "ts-satisfies",
    language: "typescript",
    title: "satisfies operator",
    tag: "types",
    code: `type Theme = Record<"light" | "dark", { bg: string; fg: string }>;

// satisfies CHECKS the value against the type without WIDENING it.
const themes = {
    light: { bg: "#fff", fg: "#000" },
    dark:  { bg: "#000", fg: "#fff" },
} satisfies Theme;

// Without 'satisfies' (using ': Theme'), themes.light would be widened
// to { bg: string; fg: string }. With satisfies, it stays as
// { bg: "#fff"; fg: "#000" } — narrow types preserved.
themes.light.bg.toUpperCase();   // ok, narrow string preserved`,
    explanation:
      "satisfies validates conformance without widening. Best of both worlds: type-checked AND narrow autocomplete.",
  },
  {
    id: "ts-optional-chaining",
    language: "typescript",
    title: "?. and ?? operators",
    tag: "syntax",
    code: `interface User {
    profile?: {
        bio?: string;
    };
}

const u: User = {};

// ?. short-circuits to undefined if anything in the chain is null/undefined.
const bio1 = u.profile?.bio;            // undefined  (no error)

// ?? falls back ONLY on null/undefined (not 0 or "" — different from ||).
const bio2 = u.profile?.bio ?? "n/a";   // "n/a"

const count: number | null = 0;
console.log(count || "fallback");        // "fallback"  — 0 is falsy
console.log(count ?? "fallback");        // 0           — only nullish triggers ??`,
    explanation:
      "?? is what people THINK || does. Use ?? for safer 'fall back when missing' — it keeps 0 / empty-string / false intact.",
  },
  {
    id: "ts-async-await",
    language: "typescript",
    title: "async / await + Promise.all",
    tag: "concurrency",
    code: `async function fetchUser(id: number) {
    const res = await fetch(\`/api/users/\${id}\`);
    return res.json() as Promise<{ id: number; name: string }>;
}

// Sequential — slow: total = sum of each request
const a = await fetchUser(1);
const b = await fetchUser(2);

// Parallel — fast: total = max of the requests
const [c, d] = await Promise.all([
    fetchUser(1),
    fetchUser(2),
]);
// Two concurrent requests; await unwraps both.`,
    explanation:
      "Sequential awaits add up. For independent calls, always reach for Promise.all — total time becomes max instead of sum.",
  },
  {
    id: "ts-destructure",
    language: "typescript",
    title: "Destructuring + defaults",
    tag: "syntax",
    code: `interface Config {
    host?: string;
    port?: number;
    secure?: boolean;
}

// Destructure with defaults — concise replacement for if-undefined boilerplate.
function connect({ host = "localhost", port = 8080, secure = true }: Config) {
    console.log({ host, port, secure });
}

connect({});                           // localhost:8080 secure
connect({ host: "api.x" });            // api.x:8080 secure
connect({ port: 443, secure: false }); // localhost:443 insecure`,
    explanation:
      "Default values trigger only on undefined (not null, not 0). Cleaner than option-bag spread + manual checks.",
  },
  {
    id: "ts-array-methods",
    language: "typescript",
    title: "map / filter / reduce",
    tag: "stdlib",
    code: `const nums = [1, 2, 3, 4, 5];

// map: transform each item, same length out
const doubled = nums.map(n => n * 2);            // [2, 4, 6, 8, 10]

// filter: keep matching items
const evens = nums.filter(n => n % 2 === 0);     // [2, 4]

// reduce: fold into a single value (acc starts at the second arg)
const total = nums.reduce((acc, n) => acc + n, 0);   // 15

// Chain them — each returns a new array, never mutates the original
const sumOfSquaredOdds = nums
    .filter(n => n % 2 === 1)        // [1, 3, 5]
    .map(n => n * n)                 // [1, 9, 25]
    .reduce((s, n) => s + n, 0);     // 35`,
    explanation:
      "Three workhorses. map and filter return new arrays; reduce folds into any shape (number, object, string, etc.). All non-mutating.",
  },
  {
    id: "ts-spread-rest",
    language: "typescript",
    title: "...spread vs ...rest",
    tag: "syntax",
    code: `// SPREAD — expand into a position
const a = [1, 2, 3];
const b = [...a, 4, 5];                // [1, 2, 3, 4, 5]
const obj = { ...{ x: 1 }, y: 2 };     // { x: 1, y: 2 }

// REST — collect into a position
function sum(...nums: number[]) {       // nums is number[]
    return nums.reduce((s, n) => s + n, 0);
}
sum(1, 2, 3, 4);                       // 10

// Object rest:
const { id, ...rest } = { id: 1, name: "Ada", role: "admin" };
// id: 1, rest: { name: "Ada", role: "admin" }`,
    explanation:
      "Same syntax (...), opposite directions. Spread expands into a structure; rest collects extras out of one. Common in config defaults and forwarding.",
  },
  {
    id: "ts-promise-allsettled",
    language: "typescript",
    title: "Promise.allSettled",
    tag: "concurrency",
    code: `// Promise.all rejects on FIRST failure — losing data from successes.
// Promise.allSettled never rejects — gives you outcome of EACH promise.
const results = await Promise.allSettled([
    fetch("/api/users"),
    fetch("/api/might-fail"),
    fetch("/api/posts"),
]);

for (const r of results) {
    if (r.status === "fulfilled") {
        console.log("ok", r.value.url);
    } else {
        console.log("failed", r.reason);
    }
}`,
    explanation:
      "Use allSettled when you want every result, success or failure. Use all when one failure should abort the whole batch.",
  },
  {
    id: "ts-type-guard",
    language: "typescript",
    title: "User-defined type guards",
    tag: "types",
    code: `interface Cat {
    meow(): void;
}

// Return type "x is Cat" tells TS: if this returns true, x is Cat.
function isCat(x: unknown): x is Cat {
    return (
        typeof x === "object" &&
        x !== null &&
        typeof (x as Cat).meow === "function"
    );
}

const a: unknown = { meow: () => console.log("meow") };
if (isCat(a)) {
    a.meow();    // a narrowed to Cat
}`,
    explanation:
      "Custom guards extend TS's narrowing system. Run a runtime check; the predicate return type tells the compiler what's true after.",
  },
  {
    id: "ts-never-exhaustive",
    language: "typescript",
    title: "never for exhaustive checks",
    tag: "types",
    code: `type Shape =
  | { kind: "circle"; r: number }
  | { kind: "square"; side: number };

function area(s: Shape): number {
    switch (s.kind) {
        case "circle": return Math.PI * s.r ** 2;
        case "square": return s.side ** 2;
        default: {
            // If a new kind is added to Shape but not handled, _ becomes
            // something other than 'never' — and this line stops compiling.
            const _exhaustive: never = s;
            return _exhaustive;
        }
    }
}`,
    explanation:
      "Compile-time exhaustiveness check. Add a new variant later — compiler points you at every switch that needs updating.",
  },
];
