import type { LessonContent } from "../python-basics";

export const tsTier3Lessons: Record<string, LessonContent> = {
  "typescript:t3:mapped-types": {
    nodeId: "typescript:t3:mapped-types",
    title: "Mapped & Conditional Types",
    sections: [
      {
        heading: "Mapped Types",
        body: "Mapped types create new types by transforming each property of an existing type. The syntax is: 'type ReadonlyUser = { readonly [K in keyof User]: User[K] }'. This iterates over every key K in User and creates a new type with readonly versions. All utility types like Partial<T>, Readonly<T>, and Required<T> are built with mapped types. You can add or remove modifiers with + and -.",
      },
      {
        heading: "Conditional Types",
        body: "Conditional types choose between two types based on a condition: 'T extends U ? X : Y'. If T is assignable to U, the result is X; otherwise Y. Combined with generics, this enables powerful type-level logic. The 'infer' keyword extracts types within conditions: 'type ReturnOf<T> = T extends (...args: any) => infer R ? R : never' extracts the return type of a function.",
      },
      {
        heading: "Template Literal Types",
        body: "Template literal types apply string interpolation to types: 'type Greeting = `Hello, ${string}`' matches any string starting with 'Hello, '. Combined with unions, they generate permutations: 'type Color = \"red\" | \"blue\"; type BgColor = `bg-${Color}` // 'bg-red' | 'bg-blue'. This is used extensively in CSS-in-JS libraries and typed API route builders.",
      },
    ],
    codeExamples: [
      {
        title: "Mapped type: make all properties optional and nullable",
        code: `type NullablePartial<T> = {
  [K in keyof T]?: T[K] | null;
};

interface User {
  name: string;
  age: number;
}

type UserDraft = NullablePartial<User>;
// { name?: string | null; age?: number | null }

const draft: UserDraft = { name: "Alice" }; // age omitted — OK`,
        explanation: "The mapped type iterates over User's keys, makes each optional (?), and adds null to the type. This is a common pattern for form state.",
      },
      {
        title: "Conditional type with infer",
        code: `type Awaited<T> = T extends Promise<infer U> ? Awaited<U> : T;

type A = Awaited<Promise<string>>;          // string
type B = Awaited<Promise<Promise<number>>>; // number (recursive!)

type ArrayItem<T> = T extends (infer U)[] ? U : T;
type C = ArrayItem<string[]>;  // string
type D = ArrayItem<number>;    // number (not an array)`,
        explanation: "'infer U' captures the inner type. Awaited recursively unwraps nested Promises. ArrayItem extracts the element type from arrays.",
      },
    ],
    keyTakeaways: [
      "Mapped types: { [K in keyof T]: ... } transforms every property of T",
      "Add/remove modifiers: +readonly, -?, etc.",
      "Conditional types: T extends U ? X : Y for type-level if/else",
      "'infer' extracts types within conditional type checks",
      "Template literal types: `prefix-${Union}` generates string unions",
    ],
  },

  "typescript:t3:classes": {
    nodeId: "typescript:t3:classes",
    title: "Classes in TypeScript",
    sections: [
      {
        heading: "TypeScript Class Features",
        body: "TypeScript adds access modifiers and type annotations to JavaScript classes. Use 'public' (default), 'private' (class only), 'protected' (class + subclasses), and 'readonly'. Constructor parameter properties (public name: string in the constructor) automatically create and assign properties. TypeScript validates that abstract methods are implemented and that interfaces are satisfied.",
      },
      {
        heading: "Abstract Classes and implements",
        body: "Abstract classes cannot be instantiated and can have abstract methods (no body). Use 'abstract class Shape { abstract area(): number; }'. Concrete subclasses must implement all abstract methods. The 'implements' keyword ensures a class satisfies an interface: 'class Dog implements Animal { }'. Unlike 'extends' (inheritance), 'implements' only checks shape — it doesn't inherit any code.",
      },
    ],
    codeExamples: [
      {
        title: "Class with access modifiers",
        code: `class BankAccount {
  constructor(
    public readonly id: string,
    private balance: number,
    protected owner: string,
  ) {}

  deposit(amount: number): void {
    if (amount <= 0) throw new Error("Amount must be positive");
    this.balance += amount;
  }

  getBalance(): number {
    return this.balance;
  }
}

const acct = new BankAccount("A1", 100, "Alice");
acct.deposit(50);
// acct.balance;  // Error: private
console.log(acct.getBalance());  // 150`,
        explanation: "Constructor parameter properties (public/private/protected before the name) auto-create and assign class fields. private prevents external access.",
      },
      {
        title: "Abstract class and implements",
        code: `abstract class Shape {
  abstract area(): number;

  describe(): string {
    return \`Shape with area \${this.area().toFixed(2)}\`;
  }
}

interface Printable {
  print(): void;
}

class Circle extends Shape implements Printable {
  constructor(private radius: number) { super(); }

  area(): number { return Math.PI * this.radius ** 2; }

  print(): void { console.log(this.describe()); }
}

new Circle(5).print(); // "Shape with area 78.54"`,
        explanation: "Circle extends Shape (inherits describe, must implement area) and implements Printable (must have print). Both contracts are enforced.",
      },
    ],
    keyTakeaways: [
      "Access modifiers: public (default), private (class only), protected (class + subclasses), readonly",
      "Constructor parameter properties auto-create fields: constructor(public name: string)",
      "Abstract classes can't be instantiated; abstract methods must be implemented by subclasses",
      "'implements' checks interface conformance; 'extends' inherits behavior",
      "TypeScript enforces all contracts at compile time",
    ],
  },

  "typescript:t3:modules-declarations": {
    nodeId: "typescript:t3:modules-declarations",
    title: "Modules & Declaration Files",
    sections: [
      {
        heading: "ES Modules in TypeScript",
        body: "TypeScript uses standard ES module syntax: 'import { User } from \"./types\";' and 'export interface User { }'. Types can be imported/exported just like values. Use 'import type { User }' to explicitly mark a type-only import — this ensures the import is erased in the JavaScript output. TypeScript resolves module paths and checks that imported names actually exist in the target module.",
      },
      {
        heading: "Declaration Files (.d.ts)",
        body: "Declaration files describe the types for JavaScript libraries that don't have TypeScript source. They contain only type information — no runtime code. The 'declare' keyword announces types without implementation: 'declare function $(selector: string): Element;'. Most popular libraries have community-maintained type definitions on DefinitelyTyped, installable via '@types/libraryname'.",
      },
    ],
    codeExamples: [
      {
        title: "Type-only imports and exports",
        code: `// types.ts
export interface User { name: string; age: number; }
export type Role = "admin" | "user" | "guest";

// app.ts
import type { User, Role } from "./types";
import { fetchUsers } from "./api";

const users: User[] = await fetchUsers();`,
        explanation: "'import type' is erased completely in the output. Regular imports become require() calls. Use type imports when you only need the type.",
      },
      {
        title: "Using @types packages",
        code: `// Install types for a JS library:
// npm install --save-dev @types/lodash

// Now TypeScript knows lodash's types:
import _ from "lodash";
const result = _.chunk([1, 2, 3, 4], 2);
// result type: number[][]

// For libraries with built-in types (like axios), no @types needed`,
        explanation: "@types packages provide .d.ts files for JavaScript libraries. Install them as devDependencies. TypeScript finds them automatically.",
      },
    ],
    keyTakeaways: [
      "TypeScript uses standard ES module syntax for imports and exports",
      "'import type' marks type-only imports that are erased in output",
      "Declaration files (.d.ts) describe types for JavaScript libraries",
      "'declare' announces types without implementation",
      "Install @types/package for community type definitions from DefinitelyTyped",
    ],
  },

  "typescript:t3:async-types": {
    nodeId: "typescript:t3:async-types",
    title: "Async TypeScript",
    sections: [
      {
        heading: "Promise Types",
        body: "Async functions return Promise<T>: 'async function fetchUser(): Promise<User>'. TypeScript infers the Promise wrapper from 'async', so the return statement just returns a User, not a Promise<User>. When you await a Promise<T>, the result is T. Awaited<T> is a utility type that recursively unwraps Promise types.",
      },
      {
        heading: "Error Handling Patterns",
        body: "TypeScript's catch clause types the error as 'unknown' (since TypeScript 4.4). You must narrow it before using it: 'if (e instanceof Error) { console.log(e.message); }'. A popular pattern is the Result type: 'type Result<T> = { ok: true; data: T } | { ok: false; error: string }'. This makes error handling explicit in the type system rather than relying on try/catch.",
      },
    ],
    codeExamples: [
      {
        title: "Typed async functions",
        code: `interface User { id: number; name: string; }

async function fetchUser(id: number): Promise<User> {
  const res = await fetch(\`/api/users/\${id}\`);
  if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
  return res.json() as Promise<User>;
}

// TypeScript knows user is User
const user = await fetchUser(1);
console.log(user.name);`,
        explanation: "The return type Promise<User> documents the async contract. After await, the type is User (unwrapped). res.json() returns Promise<any>, so we assert the type.",
      },
      {
        title: "Result type for explicit error handling",
        code: `type Result<T, E = string> =
  | { ok: true; data: T }
  | { ok: false; error: E };

async function safeFetch(url: string): Promise<Result<string>> {
  try {
    const res = await fetch(url);
    if (!res.ok) return { ok: false, error: \`HTTP \${res.status}\` };
    return { ok: true, data: await res.text() };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown" };
  }
}

const result = await safeFetch("/api/data");
if (result.ok) {
  console.log(result.data);  // narrowed: data exists
} else {
  console.log(result.error); // narrowed: error exists
}`,
        explanation: "The Result type forces callers to check for errors — no silent failures. The discriminated union narrows data vs error based on the 'ok' flag.",
      },
    ],
    keyTakeaways: [
      "Async functions return Promise<T> — TypeScript infers the wrapper",
      "await unwraps Promise<T> to T",
      "Catch clause errors are 'unknown' — narrow with instanceof Error",
      "The Result<T> pattern makes error handling explicit in the type system",
      "Awaited<T> utility type recursively unwraps nested Promise types",
    ],
  },
};
