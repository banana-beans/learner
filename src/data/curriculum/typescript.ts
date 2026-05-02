import type { SkillNode } from "@/lib/types";

const node = (
  partial: Omit<SkillNode, "branchId">
): SkillNode => ({ branchId: "typescript", ...partial });

export const typescriptNodes: SkillNode[] = [
  // T1 — JS Fundamentals
  node({ id: "typescript:t1:variables", tier: 1, title: "Variables (let, const, var)", description: "Block scope, reassignment, primitive types.", hardPrereqs: [], softPrereqs: [], estimatedMinutes: 12, xpReward: 80, concepts: ["let", "const", "var", "block scope", "hoisting"] }),
  node({ id: "typescript:t1:arrays", tier: 1, title: "Arrays & Methods", description: "map, filter, reduce, find, every, some.", hardPrereqs: ["typescript:t1:variables"], softPrereqs: [], estimatedMinutes: 18, xpReward: 90, concepts: ["array", "map", "filter", "reduce", "find"] }),
  node({ id: "typescript:t1:objects", tier: 1, title: "Objects & Destructuring", description: "Property shorthand, spread, destructuring, optional chaining.", hardPrereqs: ["typescript:t1:variables"], softPrereqs: [], estimatedMinutes: 15, xpReward: 90, concepts: ["object", "destructuring", "spread", "optional chaining"] }),
  node({ id: "typescript:t1:functions", tier: 1, title: "Functions & Arrow Syntax", description: "Function declarations, arrow functions, default + rest params, closures.", hardPrereqs: ["typescript:t1:variables"], softPrereqs: [], estimatedMinutes: 18, xpReward: 100, concepts: ["function", "arrow", "rest", "default param", "closure"] }),
  node({ id: "typescript:t1:promises", tier: 1, title: "Promises", description: "Then/catch chains, Promise.all, Promise.race.", hardPrereqs: ["typescript:t1:functions"], softPrereqs: [], estimatedMinutes: 18, xpReward: 110, concepts: ["promise", "then", "catch", "Promise.all"] }),
  node({ id: "typescript:t1:async-await", tier: 1, title: "Async / Await", description: "Async functions, awaiting promises, error handling.", hardPrereqs: ["typescript:t1:promises"], softPrereqs: [], estimatedMinutes: 18, xpReward: 120, concepts: ["async", "await", "try/catch async"] }),
  node({ id: "typescript:t1:modules", tier: 1, title: "Modules (import / export)", description: "ES modules, default vs named exports.", hardPrereqs: ["typescript:t1:functions"], softPrereqs: [], estimatedMinutes: 12, xpReward: 90, concepts: ["import", "export", "default export", "ES modules"] }),

  // T2 — TS Core
  node({ id: "typescript:t2:annotations", tier: 2, title: "Type Annotations", description: "Primitives, arrays, functions, return types.", hardPrereqs: ["typescript:t1:variables"], softPrereqs: [], estimatedMinutes: 15, xpReward: 110, concepts: ["string", "number", "boolean", "any", "unknown", "void"] }),
  node({ id: "typescript:t2:interfaces", tier: 2, title: "Interfaces & Type Aliases", description: "Object shapes, optional properties, readonly.", hardPrereqs: ["typescript:t2:annotations"], softPrereqs: [], estimatedMinutes: 18, xpReward: 130, concepts: ["interface", "type alias", "optional", "readonly"] }),
  node({ id: "typescript:t2:unions", tier: 2, title: "Union & Intersection Types", description: "A | B and A & B; narrowing.", hardPrereqs: ["typescript:t2:interfaces"], softPrereqs: [], estimatedMinutes: 18, xpReward: 130, concepts: ["union", "intersection", "narrowing"] }),
  node({ id: "typescript:t2:enums-literals", tier: 2, title: "Literals & Enums", description: "String literal types, const assertions, enums.", hardPrereqs: ["typescript:t2:unions"], softPrereqs: [], estimatedMinutes: 15, xpReward: 130, concepts: ["literal type", "as const", "enum"] }),
  node({ id: "typescript:t2:generics", tier: 2, title: "Generics", description: "Generic functions, classes, constraints.", hardPrereqs: ["typescript:t2:interfaces"], softPrereqs: [], estimatedMinutes: 22, xpReward: 160, concepts: ["generic", "extends constraint", "default type parameter"] }),
  node({ id: "typescript:t2:utility-types", tier: 2, title: "Utility Types", description: "Partial, Required, Pick, Omit, Record, Readonly.", hardPrereqs: ["typescript:t2:generics"], softPrereqs: [], estimatedMinutes: 18, xpReward: 150, concepts: ["Partial", "Pick", "Omit", "Record", "Readonly"] }),

  // T3 — Advanced
  node({ id: "typescript:t3:conditional-types", tier: 3, title: "Conditional Types", description: "T extends U ? X : Y; distributive types; infer.", hardPrereqs: ["typescript:t2:generics"], softPrereqs: [], estimatedMinutes: 25, xpReward: 200, concepts: ["conditional type", "infer", "distributive"] }),
  node({ id: "typescript:t3:mapped-types", tier: 3, title: "Mapped Types", description: "[K in keyof T], modifiers, key remapping.", hardPrereqs: ["typescript:t3:conditional-types"], softPrereqs: [], estimatedMinutes: 25, xpReward: 200, concepts: ["mapped type", "keyof", "as remap"] }),
  node({ id: "typescript:t3:template-literal-types", tier: 3, title: "Template Literal Types", description: "Build types from string templates.", hardPrereqs: ["typescript:t3:mapped-types"], softPrereqs: [], estimatedMinutes: 18, xpReward: 180, concepts: ["template literal type", "Uppercase", "Capitalize"] }),
  node({ id: "typescript:t3:type-guards", tier: 3, title: "Type Guards & Predicates", description: "typeof, instanceof, custom is-predicates.", hardPrereqs: ["typescript:t2:unions"], softPrereqs: [], estimatedMinutes: 18, xpReward: 170, concepts: ["type guard", "is predicate", "in operator"] }),
  node({ id: "typescript:t3:advanced-patterns", tier: 3, title: "Advanced Patterns", description: "Discriminated unions, branded types, exhaustive checks.", hardPrereqs: ["typescript:t3:type-guards"], softPrereqs: [], estimatedMinutes: 22, xpReward: 200, concepts: ["discriminated union", "exhaustiveness", "branded type"] }),
];
