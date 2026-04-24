import type { Challenge } from "@/lib/types";

/**
 * Tier 1: TypeScript Basics — 15 challenges across 5 nodes
 *
 * Nodes: intro, primitives, arrays-tuples, functions, objects-interfaces
 */
export const tsTier1Challenges: Challenge[] = [
  // ────────────────────────────────────────────────────────────
  // typescript:t1:intro  (3 challenges)
  // ────────────────────────────────────────────────────────────
  {
    id: "challenge:typescript:t1:intro:1",
    nodeId: "typescript:t1:intro",
    type: "multiple_choice",
    title: "What Is TypeScript?",
    description:
      "Which of the following best describes TypeScript's relationship to JavaScript?",
    difficulty: 1,
    isBoss: false,
    options: [
      {
        id: "a",
        text: "TypeScript is a strict superset of JavaScript that adds static type checking",
        isCorrect: true,
        explanation:
          "TypeScript extends JavaScript with a type system that is checked at compile time, and all valid JavaScript is also valid TypeScript.",
      },
      {
        id: "b",
        text: "TypeScript is a completely separate language that compiles to JavaScript",
        isCorrect: false,
        explanation:
          "TypeScript is not a separate language — it is a superset of JavaScript, so all JS is valid TS.",
      },
      {
        id: "c",
        text: "TypeScript replaces JavaScript at runtime in the browser",
        isCorrect: false,
        explanation:
          "Browsers run JavaScript. TypeScript is compiled (transpiled) to JavaScript before execution.",
      },
      {
        id: "d",
        text: "TypeScript is a runtime type-checking library for JavaScript",
        isCorrect: false,
        explanation:
          "TypeScript types are erased at compile time. It does not add runtime type checks.",
      },
    ],
    hints: [
      { tier: "nudge", text: "Think about what happens to TypeScript before the browser sees it.", xpPenalty: 0.9 },
      { tier: "guide", text: "TypeScript adds types on top of JavaScript and compiles down to plain JS.", xpPenalty: 0.75 },
      { tier: "reveal", text: "TypeScript is a strict superset of JavaScript with static type checking.", xpPenalty: 0.5 },
    ],
    baseXP: 100,
    tags: ["typescript", "introduction", "type-system"],
  },
  {
    id: "challenge:typescript:t1:intro:2",
    nodeId: "typescript:t1:intro",
    type: "fill_in_the_blank",
    title: "Your First Type Annotation",
    description:
      "Fill in the blank to add a type annotation declaring that `greeting` is a string.",
    difficulty: 1,
    isBoss: false,
    templateCode: 'const greeting: __BLANK__ = "Hello, TypeScript!";\nconsole.log(greeting);',
    testCases: [
      {
        id: "intro2-basic",
        input: "",
        expectedOutput: "Hello, TypeScript!",
        visible: true,
        category: "basic",
        description: "Should print the greeting string",
      },
    ],
    hints: [
      { tier: "nudge", text: "What TypeScript type represents text values?", xpPenalty: 0.9 },
      { tier: "guide", text: "TypeScript uses lowercase `string` for the primitive type.", xpPenalty: 0.75 },
      { tier: "reveal", text: "Fill in: string", xpPenalty: 0.5 },
    ],
    baseXP: 100,
    tags: ["type-annotation", "string", "basics"],
  },
  {
    id: "challenge:typescript:t1:intro:3",
    nodeId: "typescript:t1:intro",
    type: "bug_fix",
    title: "Type Mismatch",
    description:
      "This code has a type error. The variable is declared as a `number` but is assigned a string. Fix the code so it compiles and prints `42`.",
    difficulty: 2,
    isBoss: true,
    starterCode: 'const age: number = "42";\nconsole.log(age);\n',
    testCases: [
      {
        id: "intro3-basic",
        input: "",
        expectedOutput: "42",
        visible: true,
        category: "basic",
        description: "Should print 42 as a number",
      },
    ],
    hints: [
      { tier: "nudge", text: "The type annotation says number, but the value is a string. One of them must change.", xpPenalty: 0.9 },
      { tier: "guide", text: "Remove the quotes around 42 so the value is a number literal, matching the annotation.", xpPenalty: 0.75 },
      { tier: "reveal", text: "Change the assignment to: const age: number = 42;", xpPenalty: 0.5 },
    ],
    baseXP: 150,
    tags: ["type-annotation", "type-error", "debugging"],
  },

  // ────────────────────────────────────────────────────────────
  // typescript:t1:primitives  (3 challenges)
  // ────────────────────────────────────────────────────────────
  {
    id: "challenge:typescript:t1:primitives:1",
    nodeId: "typescript:t1:primitives",
    type: "multiple_choice",
    title: "Primitive Types",
    description:
      "Which of the following is NOT a primitive type in TypeScript?",
    difficulty: 1,
    isBoss: false,
    options: [
      {
        id: "a",
        text: "string",
        isCorrect: false,
        explanation: "string is a primitive type in TypeScript.",
      },
      {
        id: "b",
        text: "boolean",
        isCorrect: false,
        explanation: "boolean is a primitive type in TypeScript.",
      },
      {
        id: "c",
        text: "array",
        isCorrect: true,
        explanation:
          "array is not a primitive type. Arrays are objects. The primitives are string, number, boolean, null, undefined, symbol, and bigint.",
      },
      {
        id: "d",
        text: "number",
        isCorrect: false,
        explanation: "number is a primitive type in TypeScript.",
      },
    ],
    hints: [
      { tier: "nudge", text: "Think about which types hold single values vs. collections.", xpPenalty: 0.9 },
      { tier: "guide", text: "Primitives are the basic building blocks: string, number, boolean, null, undefined, symbol, bigint.", xpPenalty: 0.75 },
      { tier: "reveal", text: "array is not a primitive — it is an object type.", xpPenalty: 0.5 },
    ],
    baseXP: 100,
    tags: ["primitives", "types", "fundamentals"],
  },
  {
    id: "challenge:typescript:t1:primitives:2",
    nodeId: "typescript:t1:primitives",
    type: "predict_output",
    title: "Type Inference",
    description:
      'What does this code print?\n\n```typescript\nlet x = 10;\nlet y = "20";\nconsole.log(typeof x, typeof y);\n```',
    difficulty: 2,
    isBoss: false,
    testCases: [
      {
        id: "prim2-basic",
        input: "",
        expectedOutput: "number string",
        visible: true,
        category: "basic",
        description: "typeof 10 is number, typeof '20' is string",
      },
    ],
    hints: [
      { tier: "nudge", text: "The `typeof` operator returns a string describing the runtime type.", xpPenalty: 0.9 },
      { tier: "guide", text: "10 is a number literal and '20' (with quotes) is a string literal.", xpPenalty: 0.75 },
      { tier: "reveal", text: "Output is: number string", xpPenalty: 0.5 },
    ],
    baseXP: 100,
    tags: ["primitives", "typeof", "type-inference"],
  },
  {
    id: "challenge:typescript:t1:primitives:3",
    nodeId: "typescript:t1:primitives",
    type: "write_from_scratch",
    title: "Declare All Primitives",
    description:
      "Declare four variables with explicit type annotations:\n- `name` of type `string` set to `\"Alice\"`\n- `age` of type `number` set to `30`\n- `isStudent` of type `boolean` set to `true`\n- `nothing` of type `null` set to `null`\n\nPrint them all on separate lines using `console.log`.",
    difficulty: 2,
    isBoss: true,
    starterCode: "// Declare four variables with explicit types\n\n",
    testCases: [
      {
        id: "prim3-basic",
        input: "",
        expectedOutput: "Alice\n30\ntrue\nnull",
        visible: true,
        category: "basic",
        description: "Should print each value on its own line",
      },
    ],
    hints: [
      { tier: "nudge", text: "Use the syntax: const variableName: type = value;", xpPenalty: 0.9 },
      { tier: "guide", text: "For null, the type annotation is `null` — e.g., const nothing: null = null;", xpPenalty: 0.75 },
      { tier: "reveal", text: "const name: string = \"Alice\";\nconst age: number = 30;\nconst isStudent: boolean = true;\nconst nothing: null = null;\nconsole.log(name);\nconsole.log(age);\nconsole.log(isStudent);\nconsole.log(nothing);", xpPenalty: 0.5 },
    ],
    baseXP: 150,
    tags: ["primitives", "type-annotations", "declarations"],
  },

  // ────────────────────────────────────────────────────────────
  // typescript:t1:arrays-tuples  (3 challenges)
  // ────────────────────────────────────────────────────────────
  {
    id: "challenge:typescript:t1:arrays-tuples:1",
    nodeId: "typescript:t1:arrays-tuples",
    type: "fill_in_the_blank",
    title: "Typed Array Declaration",
    description:
      "Fill in the blank with the correct type annotation for an array of numbers.",
    difficulty: 1,
    isBoss: false,
    templateCode: 'const scores: __BLANK__ = [95, 87, 72, 100];\nconsole.log(scores.length);',
    testCases: [
      {
        id: "arr1-basic",
        input: "",
        expectedOutput: "4",
        visible: true,
        category: "basic",
        description: "Array has 4 elements",
      },
    ],
    hints: [
      { tier: "nudge", text: "TypeScript has two syntaxes for array types: Type[] and Array<Type>.", xpPenalty: 0.9 },
      { tier: "guide", text: "Since the array contains numbers, you need number[] or Array<number>.", xpPenalty: 0.75 },
      { tier: "reveal", text: "Fill in: number[]", xpPenalty: 0.5 },
    ],
    baseXP: 100,
    tags: ["arrays", "type-annotations", "generics"],
  },
  {
    id: "challenge:typescript:t1:arrays-tuples:2",
    nodeId: "typescript:t1:arrays-tuples",
    type: "predict_output",
    title: "Tuple Access",
    description:
      'What does this code print?\n\n```typescript\nconst pair: [string, number] = ["Alice", 30];\nconsole.log(pair[0]);\nconsole.log(pair[1] + 5);\n```',
    difficulty: 2,
    isBoss: false,
    testCases: [
      {
        id: "arr2-basic",
        input: "",
        expectedOutput: "Alice\n35",
        visible: true,
        category: "basic",
        description: "pair[0] is Alice, pair[1] + 5 is 35",
      },
    ],
    hints: [
      { tier: "nudge", text: "Tuples are accessed by index, just like arrays.", xpPenalty: 0.9 },
      { tier: "guide", text: "pair[0] is the string \"Alice\", pair[1] is the number 30. 30 + 5 = 35.", xpPenalty: 0.75 },
      { tier: "reveal", text: "Output is:\nAlice\n35", xpPenalty: 0.5 },
    ],
    baseXP: 100,
    tags: ["tuples", "indexing", "type-safety"],
  },
  {
    id: "challenge:typescript:t1:arrays-tuples:3",
    nodeId: "typescript:t1:arrays-tuples",
    type: "write_from_scratch",
    title: "Coordinate Tuple",
    description:
      "Create a function `formatCoord` that takes a tuple of type `[number, number]` and returns a string in the format `\"(x, y)\"`. For example, `formatCoord([3, 7])` should return `\"(3, 7)\"`.\n\nPrint the result of calling the function with `[10, 20]`.",
    difficulty: 3,
    isBoss: true,
    starterCode: "// Write the formatCoord function\n\n",
    testCases: [
      {
        id: "arr3-basic",
        input: "",
        expectedOutput: "(10, 20)",
        visible: true,
        category: "basic",
        description: "Should format the coordinate correctly",
      },
    ],
    hints: [
      { tier: "nudge", text: "The parameter type should be [number, number] and the return type should be string.", xpPenalty: 0.9 },
      { tier: "guide", text: "Use template literals to build the string: `(${coord[0]}, ${coord[1]})`", xpPenalty: 0.75 },
      { tier: "reveal", text: "function formatCoord(coord: [number, number]): string {\n  return `(${coord[0]}, ${coord[1]})`;\n}\nconsole.log(formatCoord([10, 20]));", xpPenalty: 0.5 },
    ],
    baseXP: 250,
    tags: ["tuples", "functions", "template-literals"],
  },

  // ────────────────────────────────────────────────────────────
  // typescript:t1:functions  (3 challenges)
  // ────────────────────────────────────────────────────────────
  {
    id: "challenge:typescript:t1:functions:1",
    nodeId: "typescript:t1:functions",
    type: "fill_in_the_blank",
    title: "Typed Function Parameters",
    description:
      "Fill in the blanks to type the function parameters and return type correctly. The function adds two numbers.",
    difficulty: 1,
    isBoss: false,
    templateCode: 'function add(a: __BLANK__, b: __BLANK__): __BLANK__ {\n  return a + b;\n}\nconsole.log(add(3, 7));',
    testCases: [
      {
        id: "fn1-basic",
        input: "",
        expectedOutput: "10",
        visible: true,
        category: "basic",
        description: "3 + 7 = 10",
      },
    ],
    hints: [
      { tier: "nudge", text: "Both parameters are numbers, and adding two numbers gives a number.", xpPenalty: 0.9 },
      { tier: "guide", text: "All three blanks should be the same primitive type.", xpPenalty: 0.75 },
      { tier: "reveal", text: "Fill all three blanks with: number", xpPenalty: 0.5 },
    ],
    baseXP: 100,
    tags: ["functions", "type-annotations", "parameters", "return-type"],
  },
  {
    id: "challenge:typescript:t1:functions:2",
    nodeId: "typescript:t1:functions",
    type: "write_from_scratch",
    title: "Optional Parameters",
    description:
      "Write a function `greet` that takes a required `name: string` and an optional `greeting: string` parameter. If `greeting` is not provided, default to `\"Hello\"`. Return the string `\"{greeting}, {name}!\"`.\n\nPrint the results of calling `greet(\"Alice\")` and `greet(\"Bob\", \"Hi\")`.",
    difficulty: 2,
    isBoss: false,
    starterCode: "// Write the greet function\n\n",
    testCases: [
      {
        id: "fn2-basic",
        input: "",
        expectedOutput: "Hello, Alice!\nHi, Bob!",
        visible: true,
        category: "basic",
        description: "Default greeting and custom greeting",
      },
    ],
    hints: [
      { tier: "nudge", text: "Optional parameters use a `?` after the name, or you can use a default value with `=`.", xpPenalty: 0.9 },
      { tier: "guide", text: "Use a default parameter: `greeting: string = \"Hello\"`.", xpPenalty: 0.75 },
      { tier: "reveal", text: "function greet(name: string, greeting: string = \"Hello\"): string {\n  return `${greeting}, ${name}!`;\n}\nconsole.log(greet(\"Alice\"));\nconsole.log(greet(\"Bob\", \"Hi\"));", xpPenalty: 0.5 },
    ],
    baseXP: 150,
    tags: ["functions", "optional-parameters", "default-values"],
  },
  {
    id: "challenge:typescript:t1:functions:3",
    nodeId: "typescript:t1:functions",
    type: "bug_fix",
    title: "Arrow Function Return Type",
    description:
      "This arrow function should return a boolean indicating whether a number is positive, but it has a type error. Fix it.",
    difficulty: 3,
    isBoss: true,
    starterCode: 'const isPositive = (n: number): string => {\n  return n > 0;\n};\nconsole.log(isPositive(5));\nconsole.log(isPositive(-3));\n',
    testCases: [
      {
        id: "fn3-basic",
        input: "",
        expectedOutput: "true\nfalse",
        visible: true,
        category: "basic",
        description: "5 is positive (true), -3 is not (false)",
      },
    ],
    hints: [
      { tier: "nudge", text: "Look at the return type annotation and what the function actually returns.", xpPenalty: 0.9 },
      { tier: "guide", text: "The expression `n > 0` returns a boolean, but the return type says string.", xpPenalty: 0.75 },
      { tier: "reveal", text: "Change the return type from `string` to `boolean`.", xpPenalty: 0.5 },
    ],
    baseXP: 250,
    tags: ["arrow-functions", "return-type", "boolean", "debugging"],
  },

  // ────────────────────────────────────────────────────────────
  // typescript:t1:objects-interfaces  (3 challenges)
  // ────────────────────────────────────────────────────────────
  {
    id: "challenge:typescript:t1:objects-interfaces:1",
    nodeId: "typescript:t1:objects-interfaces",
    type: "predict_output",
    title: "Interface Shape",
    description:
      'What does this code print?\n\n```typescript\ninterface User {\n  name: string;\n  age: number;\n}\n\nconst user: User = { name: "Eve", age: 25 };\nconsole.log(`${user.name} is ${user.age}`);\n```',
    difficulty: 1,
    isBoss: false,
    testCases: [
      {
        id: "obj1-basic",
        input: "",
        expectedOutput: "Eve is 25",
        visible: true,
        category: "basic",
        description: "Template literal with object properties",
      },
    ],
    hints: [
      { tier: "nudge", text: "Access interface properties using dot notation.", xpPenalty: 0.9 },
      { tier: "guide", text: "user.name is \"Eve\" and user.age is 25. The template literal combines them.", xpPenalty: 0.75 },
      { tier: "reveal", text: "Output: Eve is 25", xpPenalty: 0.5 },
    ],
    baseXP: 100,
    tags: ["interfaces", "objects", "template-literals"],
  },
  {
    id: "challenge:typescript:t1:objects-interfaces:2",
    nodeId: "typescript:t1:objects-interfaces",
    type: "write_from_scratch",
    title: "Define and Use an Interface",
    description:
      "Define an interface `Product` with properties `name: string`, `price: number`, and an optional `description?: string`.\n\nCreate a product object with name `\"Widget\"` and price `9.99` (no description). Write a function `formatProduct` that takes a `Product` and returns `\"{name}: ${price}\"`.\n\nPrint the result of calling `formatProduct` with your product.",
    difficulty: 2,
    isBoss: false,
    starterCode: "// Define the Product interface and formatProduct function\n\n",
    testCases: [
      {
        id: "obj2-basic",
        input: "",
        expectedOutput: "Widget: $9.99",
        visible: true,
        category: "basic",
        description: "Formatted product string",
      },
    ],
    hints: [
      { tier: "nudge", text: "Use the `interface` keyword and mark optional properties with `?`.", xpPenalty: 0.9 },
      { tier: "guide", text: "interface Product {\n  name: string;\n  price: number;\n  description?: string;\n}", xpPenalty: 0.75 },
      { tier: "reveal", text: "interface Product {\n  name: string;\n  price: number;\n  description?: string;\n}\nconst widget: Product = { name: \"Widget\", price: 9.99 };\nfunction formatProduct(p: Product): string {\n  return `${p.name}: $${p.price}`;\n}\nconsole.log(formatProduct(widget));", xpPenalty: 0.5 },
    ],
    baseXP: 150,
    tags: ["interfaces", "optional-properties", "functions"],
  },
  {
    id: "challenge:typescript:t1:objects-interfaces:3",
    nodeId: "typescript:t1:objects-interfaces",
    type: "bug_fix",
    title: "Missing Required Property",
    description:
      "This code defines a `Config` interface and tries to create a config object, but it's missing a required property. Fix the object so it satisfies the interface and prints all three values.",
    difficulty: 3,
    isBoss: true,
    starterCode: 'interface Config {\n  host: string;\n  port: number;\n  debug: boolean;\n}\n\nconst config: Config = {\n  host: "localhost",\n  port: 3000,\n};\n\nconsole.log(config.host);\nconsole.log(config.port);\nconsole.log(config.debug);\n',
    testCases: [
      {
        id: "obj3-basic",
        input: "",
        expectedOutput: "localhost\n3000\nfalse",
        visible: true,
        category: "basic",
        description: "All three properties should print",
      },
    ],
    hints: [
      { tier: "nudge", text: "Compare the interface definition with the object literal. Is anything missing?", xpPenalty: 0.9 },
      { tier: "guide", text: "The `debug` property is required by the interface but missing from the object.", xpPenalty: 0.75 },
      { tier: "reveal", text: "Add `debug: false` to the config object.", xpPenalty: 0.5 },
    ],
    baseXP: 250,
    tags: ["interfaces", "required-properties", "debugging", "objects"],
  },
];
