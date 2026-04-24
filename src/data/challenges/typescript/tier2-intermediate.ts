import type { Challenge } from "@/lib/types";

/**
 * Tier 2: TypeScript Intermediate — 12 challenges across 4 nodes
 *
 * Nodes: union-literal, type-aliases, generics, enums-narrowing
 */
export const tsTier2Challenges: Challenge[] = [
  // ────────────────────────────────────────────────────────────
  // typescript:t2:union-literal  (3 challenges)
  // ────────────────────────────────────────────────────────────
  {
    id: "challenge:typescript:t2:union-literal:1",
    nodeId: "typescript:t2:union-literal",
    type: "multiple_choice",
    title: "Union Types",
    description:
      "Given the type `let value: string | number`, which of the following assignments would cause a type error?",
    difficulty: 1,
    isBoss: false,
    options: [
      {
        id: "a",
        text: 'value = "hello"',
        isCorrect: false,
        explanation: "A string is valid for `string | number`.",
      },
      {
        id: "b",
        text: "value = 42",
        isCorrect: false,
        explanation: "A number is valid for `string | number`.",
      },
      {
        id: "c",
        text: "value = true",
        isCorrect: true,
        explanation:
          "A boolean is neither string nor number, so this assignment is a type error.",
      },
      {
        id: "d",
        text: 'value = ""',
        isCorrect: false,
        explanation: "An empty string is still a string, which is valid.",
      },
    ],
    hints: [
      { tier: "nudge", text: "A union type accepts values of any of its member types, and only those types.", xpPenalty: 0.9 },
      { tier: "guide", text: "The union `string | number` does not include `boolean`.", xpPenalty: 0.75 },
      { tier: "reveal", text: "`true` is a boolean, which is not part of the union `string | number`.", xpPenalty: 0.5 },
    ],
    baseXP: 100,
    tags: ["union-types", "type-safety", "assignment"],
  },
  {
    id: "challenge:typescript:t2:union-literal:2",
    nodeId: "typescript:t2:union-literal",
    type: "write_from_scratch",
    title: "Literal Type Guard",
    description:
      "Write a function `describeDirection` that takes a parameter of type `\"north\" | \"south\" | \"east\" | \"west\"` and returns a description string:\n- `\"north\"` -> `\"Going up\"`\n- `\"south\"` -> `\"Going down\"`\n- `\"east\"` -> `\"Going right\"`\n- `\"west\"` -> `\"Going left\"`\n\nPrint the result for `\"east\"`.",
    difficulty: 2,
    isBoss: false,
    starterCode: "// Write the describeDirection function\n\n",
    testCases: [
      {
        id: "ul2-basic",
        input: "",
        expectedOutput: "Going right",
        visible: true,
        category: "basic",
        description: "east maps to Going right",
      },
    ],
    hints: [
      { tier: "nudge", text: "Use a switch statement or if/else chain to handle each literal.", xpPenalty: 0.9 },
      { tier: "guide", text: "The parameter type should be the union of four string literals: \"north\" | \"south\" | \"east\" | \"west\".", xpPenalty: 0.75 },
      { tier: "reveal", text: "function describeDirection(dir: \"north\" | \"south\" | \"east\" | \"west\"): string {\n  switch (dir) {\n    case \"north\": return \"Going up\";\n    case \"south\": return \"Going down\";\n    case \"east\": return \"Going right\";\n    case \"west\": return \"Going left\";\n  }\n}\nconsole.log(describeDirection(\"east\"));", xpPenalty: 0.5 },
    ],
    baseXP: 150,
    tags: ["literal-types", "union-types", "switch", "type-safety"],
  },
  {
    id: "challenge:typescript:t2:union-literal:3",
    nodeId: "typescript:t2:union-literal",
    type: "bug_fix",
    title: "Exhaustive Check",
    description:
      "This function handles a `Shape` union but the developer forgot one case. The code compiles but returns `undefined` for circles. Fix it so that all shapes are handled and calling with `\"circle\"` prints `\"round\"`.",
    difficulty: 3,
    isBoss: true,
    starterCode: 'type Shape = "circle" | "square" | "triangle";\n\nfunction describe(shape: Shape): string {\n  if (shape === "square") return "boxy";\n  if (shape === "triangle") return "pointy";\n  // missing case!\n  return "";\n}\n\nconsole.log(describe("circle"));\n',
    testCases: [
      {
        id: "ul3-basic",
        input: "",
        expectedOutput: "round",
        visible: true,
        category: "basic",
        description: "circle should return round",
      },
    ],
    hints: [
      { tier: "nudge", text: "There are three members in the union, but only two are handled.", xpPenalty: 0.9 },
      { tier: "guide", text: "Add a check for \"circle\" that returns \"round\".", xpPenalty: 0.75 },
      { tier: "reveal", text: "Add before the final return: if (shape === \"circle\") return \"round\";", xpPenalty: 0.5 },
    ],
    baseXP: 250,
    tags: ["union-types", "exhaustive-check", "debugging"],
  },

  // ────────────────────────────────────────────────────────────
  // typescript:t2:type-aliases  (3 challenges)
  // ────────────────────────────────────────────────────────────
  {
    id: "challenge:typescript:t2:type-aliases:1",
    nodeId: "typescript:t2:type-aliases",
    type: "fill_in_the_blank",
    title: "Define a Type Alias",
    description:
      "Fill in the blank to define a type alias `ID` that can be either a `string` or a `number`.",
    difficulty: 1,
    isBoss: false,
    templateCode: '__BLANK__ ID = string | number;\n\nconst userId: ID = 42;\nconst orderId: ID = "ABC-123";\nconsole.log(userId);\nconsole.log(orderId);',
    testCases: [
      {
        id: "ta1-basic",
        input: "",
        expectedOutput: "42\nABC-123",
        visible: true,
        category: "basic",
        description: "Both values should print",
      },
    ],
    hints: [
      { tier: "nudge", text: "TypeScript has a keyword for creating type aliases.", xpPenalty: 0.9 },
      { tier: "guide", text: "The keyword is `type` — used to create a new name for a type.", xpPenalty: 0.75 },
      { tier: "reveal", text: "Fill in: type", xpPenalty: 0.5 },
    ],
    baseXP: 100,
    tags: ["type-aliases", "union-types", "keyword"],
  },
  {
    id: "challenge:typescript:t2:type-aliases:2",
    nodeId: "typescript:t2:type-aliases",
    type: "write_from_scratch",
    title: "Intersection Types",
    description:
      "Define two type aliases:\n- `HasName` with a `name: string` property\n- `HasAge` with an `age: number` property\n\nThen define a type `Person` as the intersection of `HasName & HasAge`.\n\nCreate a `Person` object with name `\"Charlie\"` and age `28`, and print `\"{name} is {age}\"` using its properties.",
    difficulty: 2,
    isBoss: false,
    starterCode: "// Define HasName, HasAge, and Person types\n\n",
    testCases: [
      {
        id: "ta2-basic",
        input: "",
        expectedOutput: "Charlie is 28",
        visible: true,
        category: "basic",
        description: "Should print name and age",
      },
    ],
    hints: [
      { tier: "nudge", text: "Intersection types combine multiple types using the `&` operator.", xpPenalty: 0.9 },
      { tier: "guide", text: "type Person = HasName & HasAge; — the resulting type must have both `name` and `age`.", xpPenalty: 0.75 },
      { tier: "reveal", text: "type HasName = { name: string };\ntype HasAge = { age: number };\ntype Person = HasName & HasAge;\nconst p: Person = { name: \"Charlie\", age: 28 };\nconsole.log(`${p.name} is ${p.age}`);", xpPenalty: 0.5 },
    ],
    baseXP: 150,
    tags: ["type-aliases", "intersection-types", "object-types"],
  },
  {
    id: "challenge:typescript:t2:type-aliases:3",
    nodeId: "typescript:t2:type-aliases",
    type: "predict_output",
    title: "Recursive Type Alias",
    description:
      'What does this code print?\n\n```typescript\ntype Tree = {\n  value: number;\n  children: Tree[];\n};\n\nconst tree: Tree = {\n  value: 1,\n  children: [\n    { value: 2, children: [] },\n    { value: 3, children: [{ value: 4, children: [] }] },\n  ],\n};\n\nconsole.log(tree.children.length);\nconsole.log(tree.children[1].children[0].value);\n```',
    difficulty: 3,
    isBoss: true,
    testCases: [
      {
        id: "ta3-basic",
        input: "",
        expectedOutput: "2\n4",
        visible: true,
        category: "basic",
        description: "Root has 2 children; nested value is 4",
      },
    ],
    hints: [
      { tier: "nudge", text: "Count the elements in the root's `children` array, then trace the nested access.", xpPenalty: 0.9 },
      { tier: "guide", text: "tree.children has 2 elements. tree.children[1] is {value: 3, children: [{value: 4, ...}]}.", xpPenalty: 0.75 },
      { tier: "reveal", text: "Output:\n2\n4", xpPenalty: 0.5 },
    ],
    baseXP: 250,
    tags: ["type-aliases", "recursive-types", "nested-objects"],
  },

  // ────────────────────────────────────────────────────────────
  // typescript:t2:generics  (3 challenges)
  // ────────────────────────────────────────────────────────────
  {
    id: "challenge:typescript:t2:generics:1",
    nodeId: "typescript:t2:generics",
    type: "fill_in_the_blank",
    title: "Generic Identity Function",
    description:
      "Fill in the blanks to complete a generic identity function that returns its argument unchanged.",
    difficulty: 2,
    isBoss: false,
    templateCode: 'function identity<__BLANK__>(value: __BLANK__): __BLANK__ {\n  return value;\n}\n\nconsole.log(identity<string>("hello"));\nconsole.log(identity<number>(42));',
    testCases: [
      {
        id: "gen1-basic",
        input: "",
        expectedOutput: "hello\n42",
        visible: true,
        category: "basic",
        description: "Returns the same value for both types",
      },
    ],
    hints: [
      { tier: "nudge", text: "A generic type parameter is a placeholder — by convention a single uppercase letter.", xpPenalty: 0.9 },
      { tier: "guide", text: "All three blanks should be the same type parameter, like `T`.", xpPenalty: 0.75 },
      { tier: "reveal", text: "Fill all three blanks with: T", xpPenalty: 0.5 },
    ],
    baseXP: 150,
    tags: ["generics", "type-parameters", "identity-function"],
  },
  {
    id: "challenge:typescript:t2:generics:2",
    nodeId: "typescript:t2:generics",
    type: "write_from_scratch",
    title: "Generic Wrapper",
    description:
      "Write a generic function `wrapInArray<T>` that takes a single value of type `T` and returns an array `T[]` containing just that value.\n\nPrint the results of `wrapInArray(42)` and `wrapInArray(\"hello\")` using `JSON.stringify`.",
    difficulty: 3,
    isBoss: false,
    starterCode: "// Write the wrapInArray function\n\n",
    testCases: [
      {
        id: "gen2-basic",
        input: "",
        expectedOutput: "[42]\n[\"hello\"]",
        visible: true,
        category: "basic",
        description: "Each value wrapped in an array",
      },
    ],
    hints: [
      { tier: "nudge", text: "The function signature is: function wrapInArray<T>(value: T): T[]", xpPenalty: 0.9 },
      { tier: "guide", text: "Return [value] to wrap it in an array. Use JSON.stringify for output.", xpPenalty: 0.75 },
      { tier: "reveal", text: "function wrapInArray<T>(value: T): T[] {\n  return [value];\n}\nconsole.log(JSON.stringify(wrapInArray(42)));\nconsole.log(JSON.stringify(wrapInArray(\"hello\")));", xpPenalty: 0.5 },
    ],
    baseXP: 200,
    tags: ["generics", "arrays", "type-parameters"],
  },
  {
    id: "challenge:typescript:t2:generics:3",
    nodeId: "typescript:t2:generics",
    type: "bug_fix",
    title: "Generic Constraint",
    description:
      "This generic function tries to access `.length` on the value, but not all types have a `length` property. Add a constraint so the function only accepts values that have a `length: number` property.",
    difficulty: 4,
    isBoss: true,
    starterCode: 'function logLength<T>(value: T): void {\n  console.log(value.length);\n}\n\nlogLength("hello");\nlogLength([1, 2, 3]);\n',
    testCases: [
      {
        id: "gen3-basic",
        input: "",
        expectedOutput: "5\n3",
        visible: true,
        category: "basic",
        description: "String length 5, array length 3",
      },
    ],
    hints: [
      { tier: "nudge", text: "TypeScript generic constraints use the `extends` keyword.", xpPenalty: 0.9 },
      { tier: "guide", text: "Constrain T to types with a length property: T extends { length: number }.", xpPenalty: 0.75 },
      { tier: "reveal", text: "Change the signature to: function logLength<T extends { length: number }>(value: T): void", xpPenalty: 0.5 },
    ],
    baseXP: 300,
    tags: ["generics", "constraints", "extends", "debugging"],
  },

  // ────────────────────────────────────────────────────────────
  // typescript:t2:enums-narrowing  (3 challenges)
  // ────────────────────────────────────────────────────────────
  {
    id: "challenge:typescript:t2:enums-narrowing:1",
    nodeId: "typescript:t2:enums-narrowing",
    type: "predict_output",
    title: "Numeric Enum Values",
    description:
      'What does this code print?\n\n```typescript\nenum Direction {\n  Up,\n  Down,\n  Left,\n  Right,\n}\n\nconsole.log(Direction.Up);\nconsole.log(Direction.Right);\nconsole.log(Direction[1]);\n```',
    difficulty: 2,
    isBoss: false,
    testCases: [
      {
        id: "en1-basic",
        input: "",
        expectedOutput: "0\n3\nDown",
        visible: true,
        category: "basic",
        description: "Enum auto-increments from 0; reverse mapping works",
      },
    ],
    hints: [
      { tier: "nudge", text: "Numeric enums auto-increment starting from 0 and support reverse mapping.", xpPenalty: 0.9 },
      { tier: "guide", text: "Up=0, Down=1, Left=2, Right=3. Direction[1] gives the name for value 1.", xpPenalty: 0.75 },
      { tier: "reveal", text: "Output:\n0\n3\nDown", xpPenalty: 0.5 },
    ],
    baseXP: 150,
    tags: ["enums", "numeric-enums", "reverse-mapping"],
  },
  {
    id: "challenge:typescript:t2:enums-narrowing:2",
    nodeId: "typescript:t2:enums-narrowing",
    type: "write_from_scratch",
    title: "Type Narrowing with typeof",
    description:
      "Write a function `doubleOrRepeat` that takes `value: string | number`.\n- If `value` is a `number`, return `value * 2`.\n- If `value` is a `string`, return the string repeated twice (concatenated).\n\nUse `typeof` to narrow the type. Print the results for `doubleOrRepeat(5)` and `doubleOrRepeat(\"ha\")`.",
    difficulty: 3,
    isBoss: false,
    starterCode: "// Write the doubleOrRepeat function\n\n",
    testCases: [
      {
        id: "en2-basic",
        input: "",
        expectedOutput: "10\nhaha",
        visible: true,
        category: "basic",
        description: "5 doubled is 10, 'ha' repeated is 'haha'",
      },
    ],
    hints: [
      { tier: "nudge", text: "Use `typeof value === \"number\"` inside an if-statement to narrow.", xpPenalty: 0.9 },
      { tier: "guide", text: "After the typeof check, TypeScript knows the type in each branch. Use `value * 2` for number, `value + value` for string.", xpPenalty: 0.75 },
      { tier: "reveal", text: "function doubleOrRepeat(value: string | number): string | number {\n  if (typeof value === \"number\") return value * 2;\n  return value + value;\n}\nconsole.log(doubleOrRepeat(5));\nconsole.log(doubleOrRepeat(\"ha\"));", xpPenalty: 0.5 },
    ],
    baseXP: 200,
    tags: ["type-narrowing", "typeof", "union-types"],
  },
  {
    id: "challenge:typescript:t2:enums-narrowing:3",
    nodeId: "typescript:t2:enums-narrowing",
    type: "write_from_scratch",
    title: "Discriminated Union",
    description:
      "Define a discriminated union type `Result` with two variants:\n- `{ kind: \"ok\"; value: number }`\n- `{ kind: \"error\"; message: string }`\n\nWrite a function `handleResult` that takes a `Result` and:\n- If `kind` is `\"ok\"`, prints `\"Success: {value}\"`\n- If `kind` is `\"error\"`, prints `\"Error: {message}\"`\n\nCall it with `{ kind: \"ok\", value: 42 }` and `{ kind: \"error\", message: \"not found\" }`.",
    difficulty: 4,
    isBoss: true,
    starterCode: "// Define the Result type and handleResult function\n\n",
    testCases: [
      {
        id: "en3-basic",
        input: "",
        expectedOutput: "Success: 42\nError: not found",
        visible: true,
        category: "basic",
        description: "Both variants handled correctly",
      },
    ],
    hints: [
      { tier: "nudge", text: "A discriminated union uses a common literal property (like `kind`) to distinguish variants.", xpPenalty: 0.9 },
      { tier: "guide", text: "Check `result.kind` in an if/switch. TypeScript will narrow the type in each branch.", xpPenalty: 0.75 },
      { tier: "reveal", text: "type Result = { kind: \"ok\"; value: number } | { kind: \"error\"; message: string };\nfunction handleResult(r: Result): void {\n  if (r.kind === \"ok\") console.log(`Success: ${r.value}`);\n  else console.log(`Error: ${r.message}`);\n}\nhandleResult({ kind: \"ok\", value: 42 });\nhandleResult({ kind: \"error\", message: \"not found\" });", xpPenalty: 0.5 },
    ],
    baseXP: 300,
    tags: ["discriminated-unions", "type-narrowing", "pattern-matching"],
  },
];
