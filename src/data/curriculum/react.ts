import type { SkillNode } from "@/lib/types";

const node = (
  partial: Omit<SkillNode, "branchId">
): SkillNode => ({ branchId: "react", ...partial });

export const reactNodes: SkillNode[] = [
  // T1 — JSX & Components
  node({ id: "react:t1:jsx", tier: 1, title: "JSX Basics", description: "JSX syntax, expressions, attributes, fragments.", hardPrereqs: [], softPrereqs: ["typescript:t1:variables"], estimatedMinutes: 15, xpReward: 100, concepts: ["JSX", "expression", "fragment", "className"] }),
  node({ id: "react:t1:components", tier: 1, title: "Components", description: "Function components, naming, returning JSX.", hardPrereqs: ["react:t1:jsx"], softPrereqs: [], estimatedMinutes: 15, xpReward: 110, concepts: ["function component", "default export", "PascalCase"] }),
  node({ id: "react:t1:props", tier: 1, title: "Props", description: "Passing data into components, prop types, destructuring.", hardPrereqs: ["react:t1:components"], softPrereqs: [], estimatedMinutes: 15, xpReward: 110, concepts: ["props", "destructuring", "interface Props"] }),
  node({ id: "react:t1:children", tier: 1, title: "Children & Composition", description: "Wrapping content with children prop; slot patterns.", hardPrereqs: ["react:t1:props"], softPrereqs: [], estimatedMinutes: 15, xpReward: 120, concepts: ["children", "ReactNode", "slot"] }),
  node({ id: "react:t1:composition", tier: 1, title: "Component Composition", description: "Building UIs from small composable pieces.", hardPrereqs: ["react:t1:children"], softPrereqs: [], estimatedMinutes: 15, xpReward: 120, concepts: ["composition over inheritance", "small components"] }),

  // T2 — Hooks Basics
  node({ id: "react:t2:useState", tier: 2, title: "useState", description: "State variables, updater functions, lazy init.", hardPrereqs: ["react:t1:composition"], softPrereqs: [], estimatedMinutes: 18, xpReward: 140, concepts: ["useState", "updater", "lazy initialization"] }),
  node({ id: "react:t2:useEffect", tier: 2, title: "useEffect", description: "Side effects, dependency arrays, cleanup.", hardPrereqs: ["react:t2:useState"], softPrereqs: [], estimatedMinutes: 22, xpReward: 160, concepts: ["useEffect", "dependency array", "cleanup"] }),
  node({ id: "react:t2:useRef", tier: 2, title: "useRef", description: "Mutable refs, accessing DOM nodes.", hardPrereqs: ["react:t2:useEffect"], softPrereqs: [], estimatedMinutes: 15, xpReward: 130, concepts: ["useRef", "DOM ref", "mutable values"] }),
  node({ id: "react:t2:events-forms", tier: 2, title: "Events & Forms", description: "onClick, onChange, controlled inputs.", hardPrereqs: ["react:t2:useState"], softPrereqs: [], estimatedMinutes: 18, xpReward: 140, concepts: ["onChange", "controlled input", "event object"] }),
  node({ id: "react:t2:conditional-lists", tier: 2, title: "Conditional Rendering & Lists", description: "Ternaries, &&, .map with key.", hardPrereqs: ["react:t1:components"], softPrereqs: [], estimatedMinutes: 15, xpReward: 130, concepts: ["conditional render", "keys", "list rendering"] }),

  // T3 — Advanced Hooks
  node({ id: "react:t3:useContext", tier: 3, title: "useContext", description: "Avoiding prop drilling with context.", hardPrereqs: ["react:t2:useState"], softPrereqs: [], estimatedMinutes: 18, xpReward: 160, concepts: ["createContext", "Provider", "useContext"] }),
  node({ id: "react:t3:useReducer", tier: 3, title: "useReducer", description: "Reducer pattern for complex state.", hardPrereqs: ["react:t2:useState"], softPrereqs: [], estimatedMinutes: 22, xpReward: 180, concepts: ["reducer", "action", "dispatch"] }),
  node({ id: "react:t3:custom-hooks", tier: 3, title: "Custom Hooks", description: "Extracting reusable stateful logic.", hardPrereqs: ["react:t2:useEffect"], softPrereqs: [], estimatedMinutes: 22, xpReward: 180, concepts: ["custom hook", "use prefix", "hook composition"] }),
  node({ id: "react:t3:memo-perf", tier: 3, title: "Memoization & Perf", description: "memo, useMemo, useCallback — and when not to.", hardPrereqs: ["react:t3:custom-hooks"], softPrereqs: [], estimatedMinutes: 22, xpReward: 200, concepts: ["memo", "useMemo", "useCallback", "render cost"] }),
  node({ id: "react:t3:portals-suspense", tier: 3, title: "Portals & Suspense", description: "Render outside the tree; suspense boundaries.", hardPrereqs: ["react:t3:custom-hooks"], softPrereqs: [], estimatedMinutes: 18, xpReward: 180, concepts: ["createPortal", "Suspense", "fallback"] }),

  // T4 — Next.js
  node({ id: "react:t4:app-router", tier: 4, title: "Next.js App Router", description: "File-based routing, layouts, route groups.", hardPrereqs: ["react:t3:useContext"], softPrereqs: [], estimatedMinutes: 22, xpReward: 200, concepts: ["app router", "layout.tsx", "page.tsx"] }),
  node({ id: "react:t4:rsc", tier: 4, title: "Server Components (RSC)", description: "Server vs client components; 'use client' boundary.", hardPrereqs: ["react:t4:app-router"], softPrereqs: [], estimatedMinutes: 25, xpReward: 220, concepts: ["RSC", "use client", "server-only data"] }),
  node({ id: "react:t4:server-actions", tier: 4, title: "Server Actions", description: "Mutations with server functions; 'use server'.", hardPrereqs: ["react:t4:rsc"], softPrereqs: [], estimatedMinutes: 22, xpReward: 220, concepts: ["server action", "use server", "form actions"] }),
  node({ id: "react:t4:layouts", tier: 4, title: "Layouts & Templates", description: "Nested layouts, parallel & intercepting routes.", hardPrereqs: ["react:t4:app-router"], softPrereqs: [], estimatedMinutes: 18, xpReward: 180, concepts: ["nested layout", "parallel routes", "intercepting routes"] }),
  node({ id: "react:t4:rendering-strategies", tier: 4, title: "Rendering Strategies", description: "SSR, SSG, ISR, streaming.", hardPrereqs: ["react:t4:rsc"], softPrereqs: [], estimatedMinutes: 22, xpReward: 200, concepts: ["SSR", "SSG", "ISR", "streaming"] }),
];
