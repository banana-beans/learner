# 03 -- Curriculum Structure: Per-Language Learning Paths

> Research doc 3 of 12 | learner app | 2026-04-09
>
> Purpose: Define the learning paths for each language (Python, TypeScript,
> C#) and React/Next.js, establish which concepts transfer across languages,
> and design language-specific challenge strategies. This document builds on
> doc 02's CS foundation nodes and adds the language-specific layers.

---

## Table of Contents

1. Language-Agnostic vs Language-Specific Concepts
2. Python Learning Path
3. TypeScript/JavaScript Learning Path
4. React & Next.js Learning Path
5. C# Learning Path
6. Cross-Language Concept Mapping Table
7. Syntax-First vs Concept-First Teaching
8. Language-Specific Challenge Design
9. Application: Mapping to Learner's Skill Tree

---

## 1. Language-Agnostic vs Language-Specific Concepts

### 1.1 The Transfer Principle

Programming concepts fall on a spectrum from fully universal to deeply
language-specific. Understanding this spectrum is essential for curriculum
design because it determines how much new material a learner faces when
picking up a second or third language.

The core insight, supported by decades of CS education research, is the
**"teach once, transfer" principle**: once a learner truly understands a
concept (not just its syntax), they can apply it in any language that
supports that concept. The remaining work is learning the syntax and
idiomatic usage, which is dramatically less effort than learning the
concept from scratch.

Perkins and Salomon (1992) distinguished between "low-road transfer"
(automatic, triggered by surface similarity) and "high-road transfer"
(deliberate abstraction). For programming concepts, we want high-road
transfer -- the learner should think "I need a loop here" before thinking
"I need a `for` loop with this exact syntax." The curriculum should
explicitly teach this abstraction skill by showing the same concept
across languages.

### 1.2 Concept Categories

**Tier 1 -- Fully Universal Concepts (teach once, transfer always)**

These concepts exist in essentially every general-purpose language. Once
learned in Python, the learner needs only syntax adaptation for TS or C#:

- Variables and assignment
- Data types (integers, floats, strings, booleans)
- Control flow (if/else, loops, switch/match)
- Functions (parameters, return values, scope)
- Collections (lists/arrays, dictionaries/maps, sets)
- Error handling (try/catch/except)
- File I/O
- Basic OOP (classes, instances, methods, inheritance)
- Recursion
- Basic async concepts (callbacks, promises/futures, async/await)

**Tier 2 -- Shared but Different (teach concept, then teach each flavor)**

These concepts exist across languages but with meaningful differences in
implementation, mental model, or idiom. The learner needs to understand
both the shared concept and each language's specific approach:

| Concept            | Python               | TypeScript            | C#                      |
|--------------------|----------------------|-----------------------|-------------------------|
| Type system        | Dynamic, duck typing | Structural, static    | Nominal, static         |
| Iterators          | `__iter__`/`__next__`| `Symbol.iterator`     | `IEnumerable<T>`        |
| Module system      | Packages + `import`  | ES modules + `import` | Namespaces + `using`    |
| String formatting  | f-strings            | Template literals     | String interpolation    |
| Null handling      | `None`               | `null`/`undefined`    | `null` + nullable types |
| Lambda syntax      | `lambda x: x+1`     | `(x) => x+1`         | `x => x+1`             |
| Package management | pip/uv/poetry        | npm/yarn/pnpm         | NuGet                   |
| Testing            | pytest               | Jest/Vitest           | xUnit/NUnit             |

**Tier 3 -- Language-Specific Concepts (teach fresh per language)**

These concepts are unique to one language or have no meaningful equivalent
elsewhere. They must be taught from the ground up:

Python-specific:
- List/dict/set comprehensions
- Generators and `yield`
- Decorators and `@` syntax
- The GIL (Global Interpreter Lock)
- Context managers (`with` statement)
- Multiple inheritance and MRO
- Metaclasses and descriptors
- The walrus operator (`:=`)
- Unpacking (`*args`, `**kwargs`, star expressions)

TypeScript-specific:
- Union and intersection types
- Type narrowing and type guards
- Generics with constraints
- Conditional types and `infer`
- Mapped types and utility types (`Partial`, `Pick`, `Omit`)
- Template literal types
- Declaration merging
- Module augmentation
- `const` assertions and `satisfies`

C#-specific:
- Properties (get/set) vs fields
- Delegates and events
- LINQ (Language Integrated Query)
- Extension methods
- Pattern matching (C# 7+)
- Records and `with` expressions (C# 9+)
- `ref`/`out`/`in` parameters
- Nullable reference types (C# 8+)
- `async`/`await` with `Task<T>` (conceptually shared, but C#'s
  implementation with `Task`, `ValueTask`, `ConfigureAwait` is unique)
- Source generators and attributes

### 1.3 Concept Transfer Matrix

This matrix shows how a learner who has completed the Python path can
transfer knowledge to TS or C#. The percentages estimate how much of
the learning is "transfer" vs "new material":

| Python Concept        | TS Transfer | C# Transfer | Notes                          |
|-----------------------|-------------|-------------|--------------------------------|
| Variables             | 90%         | 80%         | TS: const/let; C#: typed decl  |
| If/else               | 95%         | 95%         | Syntax only                    |
| For loops             | 70%         | 70%         | Different iteration models     |
| Functions             | 85%         | 75%         | C#: methods + overloading      |
| Lists/arrays          | 80%         | 70%         | C#: typed generics `List<T>`   |
| Dictionaries          | 80%         | 65%         | C#: `Dictionary<K,V>` verbose  |
| Classes               | 85%         | 90%         | C# is more classically OOP     |
| Inheritance           | 80%         | 85%         | C#: single inheritance + iface |
| Exception handling    | 90%         | 90%         | try/except vs try/catch        |
| File I/O              | 70%         | 60%         | Different APIs entirely        |
| Async/await           | 75%         | 70%         | Same keywords, different models|
| Comprehensions        | 0%          | 20%         | LINQ is conceptually adjacent  |
| Decorators            | 30%         | 10%         | TS: experimental decorators    |
| Generators            | 60%         | 50%         | JS: yes; C#: `yield return`   |

**Implication for learner**: A second language path should take roughly
40-50% fewer hours than the first, because universal concepts transfer.
The curriculum should detect which concepts the learner already knows and
skip or fast-track the review, presenting only the language-specific
syntax and idioms.

---

## 2. Python Learning Path

### 2.1 Why Python First

Python is the recommended first language in learner for several reasons:

1. **Minimal syntax overhead.** Python reads close to pseudocode. A
   beginner can write `print("hello")` without understanding imports,
   classes, static types, or compilation. This lets them focus on
   *concepts* rather than *ceremony*.

2. **Immediate feedback.** Python's REPL (Read-Eval-Print Loop) allows
   instant experimentation. The learner can type an expression, see the
   result, and iterate. This rapid feedback loop aligns with the spacing
   and testing effects discussed in doc 00 -- the learner retrieves and
   tests knowledge within seconds of learning it.

3. **Vast ecosystem.** Python's libraries span web development (Django,
   Flask), data science (pandas, NumPy), automation (scripting), and AI/ML.
   This means the learner can immediately apply concepts to projects they
   care about, regardless of their career direction.

4. **Industry validation.** Python is the #1 most-used language in the
   2024 and 2025 Stack Overflow Developer Surveys, the primary language
   for AI/ML, and the default teaching language at most universities
   following the ACM curriculum guidelines.

5. **Error messages.** Python 3.10+ introduced significantly improved
   error messages (PEP 657 -- fine-grained error locations). A beginner
   seeing `SyntaxError: expected ':'` with an arrow pointing to the exact
   character is far more likely to self-correct than one seeing a cryptic
   compiler dump.

### 2.2 Progression

The Python path follows six stages. Each stage maps to a tier in the
skill tree and builds directly on the previous one.

**Stage 1 -- Basics (Nodes P1-P5, ~5 hours)**

| Node | Topic                    | Key Concepts                                |
|------|--------------------------|---------------------------------------------|
| P1   | Hello World & REPL       | `print()`, running scripts, REPL usage       |
| P2   | Variables & Types        | `int`, `float`, `str`, `bool`, dynamic typing|
| P3   | Operators & Expressions  | Arithmetic, comparison, logical, precedence  |
| P4   | String Operations        | Indexing, slicing, methods, f-strings         |
| P5   | Input & Type Conversion  | `input()`, `int()`, `str()`, type errors     |

**Stage 2 -- Control Flow (Nodes P6-P10, ~6 hours)**

| Node | Topic                    | Key Concepts                                |
|------|--------------------------|---------------------------------------------|
| P6   | Conditionals             | `if`, `elif`, `else`, truthiness, ternary   |
| P7   | While Loops              | `while`, `break`, `continue`, infinite loops|
| P8   | For Loops & Range        | `for...in`, `range()`, nested loops          |
| P9   | Loop Patterns            | Accumulator, counter, search, early exit     |
| P10  | Match Statement          | `match`/`case` (Python 3.10+), patterns     |

**Stage 3 -- Data Structures (Nodes P11-P16, ~8 hours)**

| Node | Topic                    | Key Concepts                                |
|------|--------------------------|---------------------------------------------|
| P11  | Lists -- Basics          | Creation, indexing, slicing, mutability       |
| P12  | Lists -- Patterns        | Iteration, enumerate, zip, comprehensions    |
| P13  | Tuples & Unpacking       | Immutability, packing/unpacking, `*` syntax  |
| P14  | Dictionaries             | Key-value pairs, methods, dict comprehensions|
| P15  | Sets                     | Uniqueness, set operations, frozenset         |
| P16  | Nested Structures        | Lists of dicts, dicts of lists, JSON-like data|

**Stage 4 -- Functions (Nodes P17-P22, ~8 hours)**

| Node | Topic                    | Key Concepts                                |
|------|--------------------------|---------------------------------------------|
| P17  | Defining Functions       | `def`, parameters, return values, docstrings|
| P18  | Scope & Closures         | Local/global/enclosing scope, LEGB rule      |
| P19  | *args and **kwargs       | Unpacking, flexible signatures               |
| P20  | Lambda & Higher-Order    | `lambda`, `map()`, `filter()`, `sorted(key=)`|
| P21  | Decorators               | `@decorator` syntax, wrapping functions      |
| P22  | Type Hints               | Annotations, `typing` module, mypy basics    |

**Stage 5 -- OOP (Nodes P23-P28, ~8 hours)**

| Node | Topic                    | Key Concepts                                |
|------|--------------------------|---------------------------------------------|
| P23  | Classes & Objects        | `class`, `__init__`, `self`, instance vars   |
| P24  | Methods & Properties     | Instance/class/static methods, `@property`  |
| P25  | Inheritance              | Single inheritance, `super()`, method override|
| P26  | Dunder Methods           | `__str__`, `__repr__`, `__eq__`, `__len__`  |
| P27  | Abstract Classes         | `ABC`, `@abstractmethod`, interface patterns|
| P28  | Composition vs Inherit.  | Has-a vs is-a, dependency injection basics   |

**Stage 6 -- Advanced (Nodes P29-P35, ~10 hours)**

| Node | Topic                    | Key Concepts                                |
|------|--------------------------|---------------------------------------------|
| P29  | Generators               | `yield`, lazy evaluation, `itertools`        |
| P30  | Context Managers         | `with`, `__enter__`/`__exit__`, `contextlib` |
| P31  | Error Handling Deep Dive | Custom exceptions, exception chaining, EAFP |
| P32  | Async/Await              | `asyncio`, coroutines, event loop, `aiohttp` |
| P33  | Modules & Packages      | `__init__.py`, relative imports, `setup.py`  |
| P34  | Testing                  | `pytest`, fixtures, parametrize, mocking     |
| P35  | Pythonic Patterns        | EAFP vs LBYL, walrus operator, dataclasses   |

**Total: 35 nodes, ~45 hours**

### 2.3 Common Python Pitfalls

Self-taught Python learners consistently stumble on the same set of
gotchas. The curriculum should explicitly teach these as "pitfall nodes"
-- short lessons that name the trap, show the broken code, and teach the
fix. Research from Kohn (2019) on student misconceptions in Python
confirms these as the most frequent:

1. **Mutable default arguments.** `def add(item, lst=[])` shares the
   same list across all calls. Fix: use `None` sentinel. This trips up
   even experienced devs and should be taught right after Stage 4.

2. **Shallow vs deep copy.** `b = a` for a list creates a reference, not
   a copy. `b = a[:]` creates a shallow copy. `copy.deepcopy()` for
   nested structures. Teach in Stage 3 alongside lists.

3. **Scope confusion with closures.** The classic late-binding closure
   bug: `[lambda: i for i in range(5)]` returns `[4,4,4,4,4]`. Teach in
   P18 (Scope & Closures) with the `i=i` default-argument fix.

4. **Modifying a list while iterating.** `for item in lst: lst.remove(item)`
   skips elements. Teach iteration over a copy or list comprehension filter.

5. **`is` vs `==`.** `is` checks identity, `==` checks equality. Python
   interns small integers (-5 to 256) and some strings, making `is`
   appear to work for small numbers but fail for large ones. Teach in P2.

6. **Integer division.** In Python 3, `/` returns float, `//` returns
   integer. Former Python 2 users and learners from C/Java expect `/` to
   do integer division. Teach in P3.

7. **Indentation as syntax.** Python's significant whitespace trips up
   learners from other languages. For first-time programmers, it is
   actually easier (no braces to match), but mixing tabs and spaces
   causes invisible errors. Teach immediately in P1.

### 2.4 What "Advanced Python" Means

Many learners reach a plateau after learning OOP and wonder what
"advanced Python" consists of. The Stage 6 path defines it concretely:

- **Generators and iterators** -- understanding lazy evaluation, writing
  memory-efficient pipelines, using `itertools` for combinatorial problems.
- **Async programming** -- not just `async`/`await` syntax but understanding
  the event loop, when async is beneficial (I/O-bound tasks) vs harmful
  (CPU-bound), and common patterns like `asyncio.gather()`.
- **Metaclasses and descriptors** -- these are elective nodes. Most
  Python developers never need metaclasses, but understanding descriptors
  explains how `@property`, `@classmethod`, and `@staticmethod` work
  under the hood. This is Bloom's level 4-5 material.
- **Type hints as documentation and tooling** -- modern Python uses type
  hints extensively. Teaching learners to write typed Python with mypy
  checking bridges the gap to statically typed languages like TS and C#.

---

## 3. TypeScript/JavaScript Learning Path

### 3.1 JS First, Then Layer TypeScript

The TypeScript path begins with JavaScript fundamentals. This is a
deliberate pedagogical choice: TypeScript is a superset of JavaScript,
and understanding what TypeScript compiles *to* (plain JS) is essential
for debugging, understanding runtime behavior, and working with the
broader ecosystem (most libraries, docs, and Stack Overflow answers use
JS examples).

The layering strategy: teach JS concepts for 2-3 stages, then introduce
TypeScript's type system as an *enhancement*, not a replacement. This
mirrors how TypeScript is actually adopted in industry -- teams add types
to existing JS codebases gradually.

### 3.2 The Prototype Chain vs Class Syntax

JavaScript has two ways to create objects with shared behavior: the
prototype chain (ES5 and earlier) and class syntax (ES6+). There is a
long-running debate in JS education about which to teach first.

**Our approach: class-first, prototype-later.** Rationale:

1. Class syntax is what learners will use in practice. All modern
   frameworks (React, Angular, Node.js) use classes or functions.
2. Class syntax maps directly to concepts learned in Python (Stage 5)
   and will map to C# later. Teaching prototype-first breaks the
   transfer benefit.
3. Prototypes are still taught (Node T13) because understanding them
   explains `this` binding, `Object.create()`, and why `instanceof`
   works the way it does. But the learner approaches them as "how classes
   work under the hood" rather than "the primary way to create objects."

### 3.3 TypeScript's Type System as a Learning Accelerator

TypeScript's static type system is not just a safety net -- it is an
active teaching tool. When a learner writes `const x: number = "hello"`,
the immediate red squiggle teaches them about type mismatches *before*
they run the code. This tight feedback loop (error before execution)
accelerates learning in the same way that Ebbinghaus's testing effect
accelerates retention (doc 00, section 3).

Key benefits of teaching TypeScript early:

- **Forces explicit thinking about data shapes.** Defining an interface
  like `interface User { name: string; age: number }` teaches data
  modeling naturally.
- **Catches entire classes of bugs.** `null`/`undefined` errors, wrong
  argument counts, property typos -- TypeScript catches these at write
  time.
- **Prepares for C#.** TypeScript's structural type system is a stepping
  stone to C#'s nominal type system. The mental model of "declare types
  before using them" transfers directly.
- **IDE integration.** TypeScript powers autocomplete, inline docs, and
  refactoring tools. Learners who use types get better tooling, which
  makes them more productive, which keeps them motivated (self-
  determination theory, doc 01).

### 3.4 Progression

**Stage 1 -- JavaScript Basics (Nodes T1-T6, ~7 hours)**

| Node | Topic                    | Key Concepts                                |
|------|--------------------------|---------------------------------------------|
| T1   | Hello World & Console    | `console.log()`, Node.js vs browser, scripts|
| T2   | Variables & Types        | `let`, `const`, `var` (and why not), types   |
| T3   | Operators & Coercion     | Type coercion, `==` vs `===`, truthy/falsy  |
| T4   | Strings & Template Lits  | Template literals, methods, tagged templates|
| T5   | Arrays                   | Creation, methods, destructuring, spread     |
| T6   | Objects                  | Literals, dot/bracket access, destructuring  |

**Stage 2 -- Control Flow & Functions (Nodes T7-T12, ~7 hours)**

| Node | Topic                    | Key Concepts                                |
|------|--------------------------|---------------------------------------------|
| T7   | Conditionals             | `if`/`else`, ternary, `switch`, nullish `??`|
| T8   | Loops                    | `for`, `for...of`, `for...in`, `while`       |
| T9   | Functions                | Declaration, expression, arrow, default params|
| T10  | Scope & Closures         | Lexical scope, closure, IIFE (historical)    |
| T11  | Higher-Order Functions   | `map`, `filter`, `reduce`, callbacks         |
| T12  | Error Handling           | `try`/`catch`/`finally`, custom errors       |

**Stage 3 -- JS Deep Dive (Nodes T13-T17, ~7 hours)**

| Node | Topic                    | Key Concepts                                |
|------|--------------------------|---------------------------------------------|
| T13  | Prototypes & Classes     | Prototype chain, ES6 `class`, `extends`      |
| T14  | `this` Binding           | Call context, `bind`, `call`, `apply`, arrow |
| T15  | Promises                 | `new Promise()`, `.then()`, `.catch()`, chain|
| T16  | Async/Await              | `async`/`await`, error handling, parallelism |
| T17  | Modules                  | ES modules, `import`/`export`, dynamic import|

**Stage 4 -- TypeScript Foundations (Nodes T18-T24, ~9 hours)**

| Node | Topic                    | Key Concepts                                |
|------|--------------------------|---------------------------------------------|
| T18  | TS Setup & Basic Types   | `tsconfig.json`, `string`, `number`, `boolean`|
| T19  | Interfaces & Type Aliases| `interface`, `type`, optional properties     |
| T20  | Union & Intersection     | `\|`, `&`, discriminated unions, narrowing    |
| T21  | Enums & Literals         | `enum`, literal types, `const` assertions    |
| T22  | Functions in TS          | Typed params/return, overloads, void          |
| T23  | Type Narrowing           | `typeof`, `instanceof`, `in`, custom guards  |
| T24  | Arrays & Tuples          | Typed arrays, tuple types, readonly           |

**Stage 5 -- TypeScript Advanced (Nodes T25-T31, ~10 hours)**

| Node | Topic                    | Key Concepts                                |
|------|--------------------------|---------------------------------------------|
| T25  | Generics Basics          | `<T>`, constraints, generic functions        |
| T26  | Generics Advanced        | Generic classes, default types, inference    |
| T27  | Utility Types            | `Partial`, `Required`, `Pick`, `Omit`, `Record`|
| T28  | Conditional Types        | `extends`, `infer`, distributive conditionals|
| T29  | Mapped Types             | `[K in keyof T]`, modifiers, key remapping   |
| T30  | Template Literal Types   | String manipulation at type level            |
| T31  | Declaration Files        | `.d.ts`, `declare`, DefinitelyTyped          |

**Total: 31 nodes, ~40 hours**

### 3.5 Key TypeScript Difficulty Ranking

TypeScript concepts vary enormously in difficulty. This ranking informs
the pacing and tier placement in the skill tree:

| Difficulty | Concepts                                         | Tier    |
|------------|--------------------------------------------------|---------|
| Easy       | Basic annotations, `interface`, `type` alias     | Tier 1  |
| Medium     | Union/intersection, narrowing, enums              | Tier 1  |
| Hard       | Generics, utility types, overloads                | Tier 2  |
| Very Hard  | Conditional types, mapped types, `infer`          | Tier 2  |
| Expert     | Template literal types, declaration merging       | Elective|

Most working TypeScript developers operate comfortably at the "Hard"
level and rarely need "Very Hard" or "Expert" level features. The
curriculum teaches them because (a) they appear in library code and type
definitions, and (b) understanding them builds a complete mental model of
the type system.

### 3.6 Common JS/TS Pitfalls

1. **`this` binding.** In regular functions, `this` depends on *how* the
   function is called, not *where* it is defined. Arrow functions capture
   `this` from the enclosing scope. This is the single most confusing
   concept in JavaScript. Teach in T14 with concrete examples:
   `obj.method()` vs `const fn = obj.method; fn()`.

2. **Closure gotchas.** The classic `var` loop closure bug:
   `for (var i = 0; i < 5; i++) { setTimeout(() => console.log(i), 100) }`
   prints `5` five times. Fix: use `let` (block scope). Teach in T10.

3. **`==` vs `===`.** JavaScript's loose equality performs type coercion:
   `"1" == 1` is `true`, `null == undefined` is `true`. Always use `===`
   in practice. Teach in T3 with a coercion table.

4. **Async pitfalls.** Forgetting to `await` a promise (function appears
   to return immediately with `Promise {<pending>}`). Unhandled promise
   rejections silently swallowed. Sequential vs parallel `await` patterns.
   Teach in T16.

5. **`null` vs `undefined`.** JavaScript has two "nothing" values.
   `undefined` is the default for uninitialized variables, missing
   properties, and missing function arguments. `null` is an explicit
   "no value." TypeScript's strict null checks help catch issues. Teach
   in T2 and revisit in T18.

6. **TypeScript `any` escape hatch.** Beginners overuse `any` to silence
   errors, defeating the purpose of TypeScript. The curriculum should
   penalize `any` in challenges (deducted points) and teach `unknown` as
   the safe alternative. Teach in T18 and T23.

---

## 4. React & Next.js Learning Path

### 4.1 Prerequisites

React requires solid TypeScript understanding (through Stage 4, node
T24). This is a hard prerequisite in the skill tree -- the React branch
does not unlock until the learner completes TypeScript Foundations.
Attempting React without understanding types, interfaces, and basic
generics leads to frustration and cargo-cult programming.

### 4.2 The React Mental Model

React's core mental model can be stated in three principles:

1. **Components are functions.** A component takes props (input) and
   returns JSX (output). It is a pure function of its props and state.
   Side effects are handled separately via hooks.

2. **State is data.** When state changes, React re-renders the component.
   The learner should think of state as "the data that, when it changes,
   should update the UI." This is a declarative model -- describe *what*
   the UI should look like for a given state, not *how* to update the DOM.

3. **Effects are side effects.** Anything that reaches outside the
   component (API calls, subscriptions, DOM manipulation, timers) goes in
   `useEffect`. Effects are not part of the render -- they run *after* it.

Teaching this mental model explicitly, before diving into syntax, reduces
the "React is magic" feeling that leads to buggy code and frustration.

### 4.3 Progression

**Stage 1 -- React Foundations (Nodes R1-R7, ~8 hours)**

| Node | Topic                    | Key Concepts                                |
|------|--------------------------|---------------------------------------------|
| R1   | JSX & Components         | JSX syntax, function components, props       |
| R2   | Rendering & Lists        | Conditional rendering, `map()`, `key` prop   |
| R3   | Events & State Intro     | Event handlers, `useState` basics            |
| R4   | useState Deep Dive       | State updates, batching, functional updates  |
| R5   | useEffect Basics         | Effect timing, dependency arrays, cleanup    |
| R6   | Forms & Controlled Input | Controlled vs uncontrolled, form submission  |
| R7   | Component Composition    | Children, props drilling, component patterns |

**Stage 2 -- React Intermediate (Nodes R8-R14, ~9 hours)**

| Node | Topic                    | Key Concepts                                |
|------|--------------------------|---------------------------------------------|
| R8   | useRef & DOM Access      | Refs, `forwardRef`, DOM manipulation         |
| R9   | useContext               | Context creation, providers, consumers       |
| R10  | useReducer               | Reducer pattern, dispatch, complex state     |
| R11  | Custom Hooks             | Extracting logic, composition, rules of hooks|
| R12  | Performance Basics       | `React.memo`, `useMemo`, `useCallback`       |
| R13  | Error Boundaries         | Class-based error boundaries, fallback UI    |
| R14  | React Patterns           | Compound components, render props, HOCs      |

**Stage 3 -- Next.js App Router (Nodes R15-R22, ~10 hours)**

| Node | Topic                    | Key Concepts                                |
|------|--------------------------|---------------------------------------------|
| R15  | Next.js Setup & Routing  | File-based routing, layouts, `page.tsx`      |
| R16  | Server Components        | RSC model, server vs client, `'use client'`  |
| R17  | Data Fetching            | `fetch` in server components, caching        |
| R18  | Server Actions           | `'use server'`, form handling, mutations      |
| R19  | Loading & Error UI       | `loading.tsx`, `error.tsx`, Suspense          |
| R20  | Metadata & SEO           | `generateMetadata`, Open Graph, sitemap      |
| R21  | Middleware & Auth        | `middleware.ts`, route protection, sessions   |
| R22  | Deployment               | Vercel, self-hosting, environment variables   |

**Stage 4 -- Advanced React (Nodes R23-R28, ~8 hours)**

| Node | Topic                    | Key Concepts                                |
|------|--------------------------|---------------------------------------------|
| R23  | State Management         | Zustand, Jotai, when to use what             |
| R24  | Data Fetching Libraries  | TanStack Query, SWR, cache invalidation      |
| R25  | Testing React            | React Testing Library, user-event, mocking   |
| R26  | Accessibility            | ARIA, keyboard nav, screen reader testing    |
| R27  | Animation                | Framer Motion, CSS transitions, layout anim  |
| R28  | Full-Stack Patterns      | tRPC, server/client boundary, optimistic UI  |

**Total: 28 nodes, ~35 hours**

### 4.4 Hook-by-Hook Progression Rationale

The hooks are taught in a specific order designed to build incrementally:

1. **`useState`** (R3-R4): The simplest hook. One concept: "this value
   persists across renders and triggers re-render when changed."
2. **`useEffect`** (R5): Introduces the side-effect model. Depends on
   understanding state and re-renders from `useState`.
3. **`useRef`** (R8): A value that persists across renders but does *not*
   trigger re-render. Contrasts with `useState` to deepen understanding.
4. **`useContext`** (R9): Solves props drilling. Requires understanding
   component trees and props (from R1-R7).
5. **`useReducer`** (R10): An alternative to `useState` for complex
   state. Requires understanding functions, objects, and the reducer
   pattern.
6. **Custom hooks** (R11): Composition of all previous hooks into
   reusable abstractions. This is Bloom's level 5-6 material.

### 4.5 Common React Pitfalls

1. **Stale closures in effects.** An `useEffect` that captures a state
   variable in its closure but does not list it in the dependency array
   will use the stale value. This is the #1 React bug for beginners.

2. **Unnecessary re-renders.** Passing a new object/array literal as a
   prop on every render (`style={{color: 'red'}}`) causes child components
   to re-render even when nothing changed. Teach `useMemo` in R12.

3. **Effect dependency arrays.** Missing dependencies cause stale data.
   Extra dependencies cause infinite loops. The ESLint exhaustive-deps
   rule is the learner's best friend.

4. **Mutating state directly.** `state.push(item)` does not trigger a
   re-render. Must use `setState([...state, item])`. This violates
   Python intuition where mutation is normal.

5. **Server vs client component confusion.** In Next.js App Router,
   components are server components by default. Adding `onClick`,
   `useState`, or `useEffect` requires `'use client'`. The error message
   when you forget is confusing.

---

## 5. C# Learning Path

### 5.1 How C# Compares

C# occupies a middle ground between Python's flexibility and Java's
rigidity. For learners coming from Python:

- **More structured.** Explicit types, access modifiers (`public`,
  `private`), namespaces, and compilation errors catch problems earlier
  but require more upfront code.
- **More verbose.** A Python one-liner may take 3-5 lines in C#. But
  C#'s features (LINQ, pattern matching, records) can be extremely
  concise once mastered.
- **Stronger OOP.** C# was designed as an OOP-first language. Interfaces,
  abstract classes, and polymorphism are not afterthoughts -- they are
  the primary design patterns.
- **Familiar async model.** C#'s `async`/`await` predates Python's and
  JavaScript's. The keywords are identical; the runtime model differs
  (`Task<T>` vs coroutines vs promises).

### 5.2 The .NET Ecosystem Simply Explained

.NET can be confusing for beginners because of its long history (.NET
Framework vs .NET Core vs .NET 5+). The curriculum simplifies this:

- **.NET** is the runtime (like Python's interpreter or Node.js).
- **C#** is the language (like Python the language or TypeScript).
- **NuGet** is the package manager (like pip or npm).
- **ASP.NET Core** is the web framework (like Django or Express).
- **Entity Framework** is the ORM (like SQLAlchemy or Prisma).
- **dotnet CLI** is the command-line tool (like `uv` or `npm`).

The learner only needs to know: "Install .NET SDK, run `dotnet new`,
write C# code, run `dotnet run`." Everything else is taught when
relevant.

### 5.3 Progression

**Stage 1 -- C# Basics (Nodes C1-C6, ~7 hours)**

| Node | Topic                    | Key Concepts                                |
|------|--------------------------|---------------------------------------------|
| C1   | Hello World & dotnet CLI | `Console.WriteLine()`, project structure     |
| C2   | Variables & Types        | Value types, reference types, `var`, `const` |
| C3   | Operators & Expressions  | Arithmetic, comparison, null-coalescing `??` |
| C4   | Strings                  | Interpolation, verbatim, `StringBuilder`     |
| C5   | Arrays & Collections     | Arrays, `List<T>`, `Dictionary<K,V>`         |
| C6   | Type Conversions         | Casting, `Convert`, `Parse`, `TryParse`      |

**Stage 2 -- Control Flow & Methods (Nodes C7-C12, ~7 hours)**

| Node | Topic                    | Key Concepts                                |
|------|--------------------------|---------------------------------------------|
| C7   | Conditionals             | `if`/`else`, `switch` expression, patterns   |
| C8   | Loops                    | `for`, `foreach`, `while`, `do-while`        |
| C9   | Methods                  | Parameters, return types, overloading        |
| C10  | Ref/Out/In Parameters    | `ref`, `out`, `in`, pass-by-reference        |
| C11  | Exception Handling       | `try`/`catch`/`finally`, custom exceptions   |
| C12  | Enums & Structs          | `enum`, `struct`, value type semantics       |

**Stage 3 -- OOP (Nodes C13-C19, ~9 hours)**

| Node | Topic                    | Key Concepts                                |
|------|--------------------------|---------------------------------------------|
| C13  | Classes & Objects        | Fields, constructors, `this`, access modifiers|
| C14  | Properties               | `get`/`set`, auto-properties, computed props |
| C15  | Inheritance              | `:`, `base`, `virtual`/`override`, `sealed`  |
| C16  | Interfaces               | `interface`, multiple implementation, default|
| C17  | Abstract Classes         | `abstract`, template method pattern          |
| C18  | Polymorphism             | Upcasting, downcasting, `is`/`as`            |
| C19  | Records & Init           | `record`, `with`, `init`-only setters        |

**Stage 4 -- LINQ & Collections (Nodes C20-C25, ~8 hours)**

| Node | Topic                    | Key Concepts                                |
|------|--------------------------|---------------------------------------------|
| C20  | Delegates                | `Action`, `Func`, `Predicate`, multicast     |
| C21  | Lambda Expressions       | `=>`, closures, expression-bodied members    |
| C22  | Events                   | `event`, publisher/subscriber, EventHandler  |
| C23  | LINQ Query Syntax        | `from`, `where`, `select`, `orderby`         |
| C24  | LINQ Method Syntax       | `.Where()`, `.Select()`, `.GroupBy()`, chains|
| C25  | Advanced Collections     | `IEnumerable<T>`, `yield return`, custom iter|

**Stage 5 -- Async & Advanced (Nodes C26-C32, ~10 hours)**

| Node | Topic                    | Key Concepts                                |
|------|--------------------------|---------------------------------------------|
| C26  | Async/Await              | `Task`, `Task<T>`, `async`/`await` patterns |
| C27  | File I/O                 | `File`, `StreamReader`, async I/O            |
| C28  | Generics                 | `<T>`, constraints, generic classes/methods  |
| C29  | Extension Methods        | `this` parameter, extending existing types   |
| C30  | Pattern Matching         | `switch` expressions, `is`, property patterns|
| C31  | Nullable Reference Types | `?`, `!`, null state analysis, annotations   |
| C32  | Testing with xUnit       | `[Fact]`, `[Theory]`, assertions, mocking    |

**Total: 32 nodes, ~41 hours**

### 5.4 Unique C# Concepts Worth Highlighting

Several C# features have no direct equivalent in Python or TypeScript
and deserve focused teaching:

- **Properties** (C14): Python uses `@property` decorators, but C# has
  properties as a first-class language feature with `get`/`set` syntax.
  This is cleaner and more discoverable. The curriculum frames it as
  "fields with superpowers."

- **Delegates and events** (C20-C22): Python passes functions as
  first-class objects, and JS uses callbacks. C#'s delegate system is
  more formal -- it defines a type signature for callable objects and
  enables the event pattern. This is the foundation for all of C#'s
  event-driven programming.

- **LINQ** (C23-C24): The closest Python equivalent is chained
  comprehensions and `itertools`. The closest TS equivalent is chained
  `.map().filter().reduce()`. LINQ unifies both into a single, SQL-like
  syntax that works on any `IEnumerable<T>`. It is arguably C#'s most
  powerful feature for day-to-day programming.

- **Extension methods** (C29): The ability to add methods to existing
  types without modifying their source code. Python can do this via
  monkey-patching (discouraged), and TypeScript can via declaration
  merging (limited). C#'s approach is type-safe and discoverable via IDE.

- **Pattern matching** (C30): C#'s pattern matching has evolved rapidly
  (C# 7 through 11). It now supports property patterns, relational
  patterns, list patterns, and nested patterns. It is more powerful than
  Python's `match` statement and has no TS equivalent.

### 5.5 Leveraging Prior Knowledge

A learner arriving at C# after completing Python and/or TypeScript
should find ~60% of the material familiar in concept. The curriculum
exploits this by:

1. **"You already know this" callouts.** When introducing C# classes,
   the node says: "This works like Python classes -- `__init__` becomes
   the constructor, `self` becomes `this`, and you declare types
   explicitly."

2. **Comparison snippets.** Side-by-side code showing the same operation
   in Python, TS, and C#. These are not standalone lessons but inline
   references within C# nodes.

3. **Skip-test option.** For Tier 1 concepts (variables, control flow,
   functions), the learner can take a "placement test" -- a short
   challenge that, if passed, marks the node complete and awards XP.
   This prevents boredom from re-learning `if/else` for the third time.

---

## 6. Cross-Language Concept Mapping Table

This comprehensive table serves as a reference for both curriculum design
and the "concept transfer" feature in the app. When a learner completes
a concept in one language, the app can show them how it maps to other
languages.

### 6.1 Variables & Types

| Concept             | Python                   | TypeScript                  | C#                           |
|---------------------|--------------------------|-----------------------------|------------------------------|
| Variable declaration| `x = 10`                 | `let x = 10`               | `int x = 10;` or `var x = 10;`|
| Constant            | `X = 10` (convention)    | `const x = 10`              | `const int X = 10;`          |
| String              | `str`                    | `string`                    | `string`                      |
| Integer             | `int` (arbitrary size)   | `number`                    | `int`, `long`, `short`        |
| Float               | `float`                  | `number`                    | `float`, `double`, `decimal`  |
| Boolean             | `bool` (`True`/`False`)  | `boolean` (`true`/`false`)  | `bool` (`true`/`false`)       |
| Null/None           | `None`                   | `null`, `undefined`         | `null`                        |
| Type annotation     | `x: int = 10`            | `let x: number = 10`       | `int x = 10;`                 |
| Any/dynamic         | Default (duck typing)    | `any` / `unknown`           | `dynamic` / `object`          |

### 6.2 Collections

| Concept             | Python                   | TypeScript                  | C#                           |
|---------------------|--------------------------|-----------------------------|------------------------------|
| Ordered list        | `list` / `[1, 2, 3]`    | `Array` / `[1, 2, 3]`      | `List<int>` / `new List<int>{1,2,3}`|
| Fixed-size array    | `tuple` (immutable)      | `readonly [1, 2, 3]`       | `int[]` / `new int[]{1,2,3}` |
| Key-value map       | `dict` / `{"a": 1}`     | `Map` or object literal     | `Dictionary<string, int>`     |
| Set                 | `set` / `{1, 2, 3}`     | `Set` / `new Set([1,2,3])` | `HashSet<int>`                |
| Queue               | `collections.deque`      | No built-in (array-based)  | `Queue<T>`                    |
| Stack               | `list` (use append/pop)  | No built-in (array-based)  | `Stack<T>`                    |
| Tuple               | `(1, "a", True)`         | `[1, "a", true]` (typed)   | `(1, "a", true)` (ValueTuple) |

### 6.3 Functions & Methods

| Concept             | Python                   | TypeScript                  | C#                           |
|---------------------|--------------------------|-----------------------------|------------------------------|
| Function def        | `def greet(name):`       | `function greet(name: string)` | `void Greet(string name)`  |
| Lambda / arrow      | `lambda x: x + 1`       | `(x) => x + 1`             | `x => x + 1`                 |
| Default params      | `def f(x=10):`           | `function f(x = 10)`       | `void F(int x = 10)`         |
| Variadic args       | `*args`, `**kwargs`      | `...args: number[]`        | `params int[] args`           |
| Return type         | `-> int` (annotation)    | `: number` (enforced)       | `int Method()` (enforced)    |
| Overloading         | Not supported            | Overload signatures         | Native support                |
| Async function      | `async def f():`         | `async function f()`       | `async Task F()`             |

### 6.4 Classes & OOP

| Concept             | Python                   | TypeScript                  | C#                           |
|---------------------|--------------------------|-----------------------------|------------------------------|
| Class definition    | `class Dog:`             | `class Dog {}`              | `class Dog {}`                |
| Constructor         | `def __init__(self):`    | `constructor() {}`          | `Dog() {}`                    |
| Instance variable   | `self.name = name`       | `this.name = name`          | `this.Name = name;`           |
| Inheritance         | `class Pug(Dog):`        | `class Pug extends Dog {}`  | `class Pug : Dog {}`          |
| Interface           | `ABC` (abstract class)   | `interface IDog {}`         | `interface IDog {}`           |
| Access modifiers    | `_` convention           | `public`/`private`/`protected`| `public`/`private`/`protected`|
| Abstract class      | `ABC` + `@abstractmethod`| `abstract class {}`         | `abstract class {}`           |
| Static method       | `@staticmethod`          | `static method() {}`       | `static void Method() {}`    |
| Property            | `@property`              | `get name() {}` accessor   | `public string Name { get; set; }` |

### 6.5 Error Handling

| Concept             | Python                   | TypeScript                  | C#                           |
|---------------------|--------------------------|-----------------------------|------------------------------|
| Try block           | `try:`                   | `try {}`                    | `try {}`                      |
| Catch               | `except Exception as e:` | `catch (e) {}`              | `catch (Exception e) {}`     |
| Finally             | `finally:`               | `finally {}`                | `finally {}`                  |
| Throw/raise         | `raise ValueError("msg")`| `throw new Error("msg")`   | `throw new Exception("msg");`|
| Custom exception    | `class MyError(Exception)`| `class MyError extends Error`| `class MyError : Exception` |

### 6.6 Async Patterns

| Concept             | Python                   | TypeScript                  | C#                           |
|---------------------|--------------------------|-----------------------------|------------------------------|
| Async function      | `async def fetch():`     | `async function fetch()`   | `async Task<string> Fetch()` |
| Await               | `await response`         | `await response`            | `await response`              |
| Promise/Future      | `asyncio.Future`         | `Promise<T>`                | `Task<T>`                     |
| Parallel execution  | `asyncio.gather()`       | `Promise.all([])`           | `Task.WhenAll()`              |
| Race                | `asyncio.wait(FIRST_COMPLETED)` | `Promise.race([])`  | `Task.WhenAny()`              |

### 6.7 Package Management & Tooling

| Concept             | Python                   | TypeScript                  | C#                           |
|---------------------|--------------------------|-----------------------------|------------------------------|
| Package manager     | pip / uv / poetry        | npm / yarn / pnpm           | NuGet (dotnet CLI)            |
| Lock file           | `uv.lock`, `poetry.lock` | `package-lock.json`         | `packages.lock.json`          |
| Project config      | `pyproject.toml`         | `package.json`              | `.csproj`                     |
| Dependency install  | `uv sync` / `pip install`| `npm install`               | `dotnet restore`              |
| Run script          | `uv run script.py`      | `npx ts-node script.ts`    | `dotnet run`                  |
| Test runner         | pytest                   | Jest / Vitest               | xUnit / NUnit                 |
| Linter              | ruff / flake8            | ESLint                      | dotnet analyzers / StyleCop   |
| Formatter           | ruff format / black      | Prettier                    | dotnet format / CSharpier     |

---

## 7. Syntax-First vs Concept-First Teaching

### 7.1 The Debate

There are two dominant approaches to teaching programming languages:

**Syntax-first**: Start with the specific syntax of the language. "Here
is how you write a `for` loop in Python. Memorize this pattern. Now
practice it 10 times." This approach is common in coding bootcamps and
tutorial videos. It produces fast initial results but poor transfer --
the learner knows Python loops but does not understand *iteration* as a
concept.

**Concept-first**: Start with the underlying concept. "Iteration means
doing something repeatedly for each item in a collection. Every
programming language supports this. Let's see how Python does it." This
approach is common in university CS courses. It is slower initially but
produces durable, transferable knowledge.

### 7.2 The Learner Approach: Concept-First with Immediate Practice

Our approach synthesizes both. The research from doc 00 supports this:

1. **Present the concept** (2-3 minutes of explanation). Use the
   language-agnostic framing. "You need to repeat an action for each
   item in a collection. This is called iteration."

2. **Show the syntax** (1-2 minutes). "In Python, iteration looks like
   this: `for item in collection:`"

3. **Immediate practice** (5-10 minutes). The learner writes code using
   the syntax they just saw. This activates the testing effect (Roediger
   & Karpicke, 2006) and provides retrieval practice within minutes of
   initial encoding.

4. **Compare** (optional, if learner has completed another language). "In
   TypeScript, the same concept looks like this: `for (const item of
   collection) {}`". This reinforces the concept-syntax distinction and
   builds transfer skills.

### 7.3 Example: Teaching "Iteration"

**Concept node** (in CS Foundations branch, node F8):
- What is iteration? Why do we need it?
- Definite vs indefinite iteration (for vs while)
- Iterator protocol (abstract concept: something that gives you the next item)
- Iteration patterns: accumulator, search, transform, filter

**Python syntax node** (P8):
- `for item in collection:` syntax
- `range()` for numeric iteration
- `enumerate()` for index + value
- `zip()` for parallel iteration
- Nested loops

**TypeScript syntax node** (T8):
- `for (const item of collection) {}` -- iterates values
- `for (const key in object) {}` -- iterates keys (and why to avoid it)
- `for (let i = 0; i < n; i++) {}` -- classic C-style loop
- `.forEach()` method
- `.map()`, `.filter()` as iteration alternatives

**C# syntax node** (C8):
- `foreach (var item in collection) {}` -- the primary pattern
- `for (int i = 0; i < n; i++) {}` -- C-style loop
- `while` and `do-while`
- LINQ as declarative iteration (foreshadowing C23-C24)

The concept node is a prerequisite for all three syntax nodes. A learner
who completes the concept node and the Python syntax node can be offered
a "fast-track" option for the TS and C# syntax nodes -- a condensed
version that shows only the syntax differences and skips the conceptual
explanation.

### 7.4 Mapping to the Skill Tree

In the skill tree, concept nodes appear in the CS Foundations branch
(doc 02). Language-specific syntax nodes appear in the language branches.
The visual representation shows arrows from concept nodes to their
language-specific implementations:

```
CS Foundations Branch          Python Branch       TS Branch        C# Branch
+-------------------+
| F8: Iteration     |---------> P8: For Loops  --> T8: Loops   --> C8: Loops
| (concept)         |          (Python syntax)   (TS syntax)    (C# syntax)
+-------------------+
| F11: OOP          |---------> P23: Classes   --> T13: Classes --> C13: Classes
| (concept)         |          (Python syntax)   (TS syntax)    (C# syntax)
+-------------------+
```

This structure means:
- A learner doing Python-only completes F8 then P8 -- full understanding.
- A learner adding TS later completes only T8 (concept already learned).
- A learner doing all three gets three syntax nodes but one concept node,
  reinforcing the concept through spaced repetition across languages.

---

## 8. Language-Specific Challenge Design

### 8.1 Python Challenges: Pythonic Code

Python challenges should not just test whether the code works -- they
should test whether the code is *Pythonic*. This means the grading
system evaluates:

- **Idiom usage.** A challenge that asks "filter a list of numbers to
  keep only even ones" should grade higher for `[x for x in nums if x % 2 == 0]`
  than for a manual loop with append. Both work, but the comprehension
  is idiomatic Python.

- **Built-in awareness.** Using `sum()`, `max()`, `min()`, `any()`,
  `all()` instead of manual accumulation loops. Using `enumerate()`
  instead of `range(len())`.

- **EAFP over LBYL.** "Easier to Ask Forgiveness than Permission" --
  using `try/except` instead of checking conditions before acting. This
  is a Python cultural convention that beginners from other languages
  often miss.

- **Anti-pattern detection.** Deduct points (with explanation) for common
  anti-patterns: `if x == True:` (should be `if x:`), `for i in range(len(lst)):
  lst[i]` (should use `for item in lst:`), mutable default arguments.

### 8.2 TypeScript Challenges: Type Correctness

TypeScript challenges have a unique dimension: **type correctness is
part of the passing criteria**, not just runtime behavior.

- **No `any` allowed.** Challenges should fail if the learner uses `any`
  (except in designated "escape hatch" exercises that teach `unknown`).

- **Type inference awareness.** Some challenges should test whether the
  learner can predict what TypeScript infers. "What is the type of `x`
  after this assignment?" This builds the mental model of how inference
  works.

- **Generic challenges.** Write a generic function `map<T, U>(arr: T[],
  fn: (item: T) => U): U[]`. The challenge tests both runtime behavior
  (does it map correctly?) and type behavior (does it preserve types?).

- **Type-level challenges.** Advanced challenges ask the learner to write
  a type, not a function. "Write a type `DeepReadonly<T>` that makes all
  nested properties readonly." These are Bloom's level 5-6 and appear in
  the Elective tier.

### 8.3 C# Challenges: Idiomatic Feature Usage

C# challenges should reward proper use of language features:

- **LINQ over manual loops.** A challenge that asks "find all employees
  over 30 sorted by name" should grade higher for
  `employees.Where(e => e.Age > 30).OrderBy(e => e.Name)` than for a
  manual foreach with List.Sort.

- **Properties over public fields.** If a challenge involves defining a
  class with data, using `public string Name { get; set; }` should be
  expected, not `public string name;`.

- **Pattern matching.** Where appropriate, challenges should encourage
  `switch` expressions with pattern matching over chains of `if/else`.

- **Async correctness.** Async challenges should verify proper `await`
  usage, no `Task.Result` blocking, and correct `Task` return types.

- **Record types.** For data-only classes, using `record` should be
  encouraged over manual `class` with `Equals`/`GetHashCode` overrides.

### 8.4 React Challenges: Component Design

React challenges test component architecture, not just "does it render":

- **Component decomposition.** Given a complex UI mockup, the challenge
  is to identify how to split it into components. Grading evaluates
  whether components have single responsibilities and clean interfaces.

- **State placement.** "Given this component tree, where should this
  state live?" Tests understanding of lifting state up, colocation, and
  when to use context.

- **Hook usage.** Challenges that require specific hooks test
  understanding of the React lifecycle. "This component needs to fetch
  data on mount and clean up a subscription on unmount. Write the hooks."

- **Performance awareness.** Advanced challenges present a component
  with unnecessary re-renders and ask the learner to optimize it using
  `React.memo`, `useMemo`, or `useCallback`.

- **Server vs client components.** Next.js challenges ask: "Which of
  these components should be server components and which need `'use
  client'`?" Tests understanding of the rendering model.

---

## 9. Application: Mapping to Learner's Skill Tree

### 9.1 Branch Architecture

The skill tree has three language branches (Python, TypeScript, C#) plus
one framework branch (React/Next.js). Each language branch shares the
same CS Foundations prerequisite nodes (doc 02, F-nodes) but has its own
language-specific nodes:

```
CS Foundations (F1-F20)
  |
  +--- Python (P1-P35)         35 nodes, ~45 hours
  |
  +--- TypeScript (T1-T31)     31 nodes, ~40 hours
  |      |
  |      +--- React (R1-R28)   28 nodes, ~35 hours
  |
  +--- C# (C1-C32)             32 nodes, ~41 hours
```

Total language-specific nodes: 126
Total language hours (all paths): ~161 hours

### 9.2 Unlock Logic

**Day one**: The learner picks one language. Only that language branch
and the CS Foundations branch are available. The other language branches
are visible but locked, with a "complete Foundations Tier 1 to unlock"
message.

**After F1-F9** (Foundations Tier 1, ~7 hours): All three language
branches unlock. The learner can start a second language. Previously
completed concept nodes display a "transfer" badge, and language-specific
nodes offer a fast-track test option.

**After TypeScript T24** (TS Stage 4 complete): The React/Next.js branch
unlocks. This is a hard gate -- React without TypeScript foundations
causes too much friction.

**Second language discount**: When a learner starts their second language,
nodes whose underlying concept was already mastered in the first language
are marked with a "review" indicator. These nodes:
- Show a condensed lesson (syntax comparison only, no concept explanation)
- Offer a single challenge instead of the full 3-challenge progression
- Award 50% XP (the concept XP was already earned)
- Can be completed in ~40% of the normal time

**Third language discount**: Even steeper -- "fast-track" nodes can be
completed via a single placement test. If the learner passes, the node
is marked complete with 25% XP. If they fail, the full lesson is shown.

### 9.3 Concept Transfer Benefits in Gamification

The concept transfer system creates several gamification opportunities:

1. **"Polyglot" achievement**: Awarded when a learner completes the same
   concept in all three languages. Each Polyglot achievement earns a
   badge displayed on the profile.

2. **Transfer XP bonus**: When a learner starts a second language and
   passes a fast-track test on the first try, they earn a "Transfer
   Bonus" of 50 XP. This rewards genuine understanding over rote
   memorization.

3. **Language streak**: Practicing in two or more languages on the same
   day earns a "Bilingual Day" bonus. This encourages breadth.

4. **Comparison challenges**: Special cross-language challenges that show
   code in one language and ask the learner to rewrite it in another.
   These are high-value (300 XP) and appear in the Elective tier.

### 9.4 Language-Specific Teaching Strategies

| Strategy                  | Python           | TypeScript         | C#                 |
|---------------------------|------------------|--------------------|---------------------|
| Primary feedback tool     | REPL             | TS Playground      | dotnet watch run    |
| Error discovery method    | Runtime errors   | IDE red squiggles  | Compiler errors     |
| Idiom enforcement         | Pythonic grading | Type-correct grading| LINQ/pattern grading|
| Concept-first anchor      | Readability      | Type safety        | Structure/patterns  |
| Motivation hook           | "It just works"  | "Editor helps you" | "Enterprise-ready"  |
| Challenge emphasis        | Clean, minimal   | Correct types      | Feature-rich        |
| Advanced ceiling          | Metaprogramming  | Type-level code    | Async + architecture|

### 9.5 Estimated Path Durations with Transfer

| Path Scenario                        | Nodes | Est. Hours | Notes                    |
|--------------------------------------|-------|------------|--------------------------|
| Python only                          | 35    | 45         | First language, full pace|
| TypeScript only                      | 31    | 40         | First language, full pace|
| C# only                              | 32    | 41         | First language, full pace|
| Python then TypeScript               | 31    | 26         | ~35% transfer savings    |
| Python then C#                       | 32    | 28         | ~32% transfer savings    |
| Python then TS then React            | 59    | 54         | TS + React bundle        |
| Python then TS then C#               | 63    | 50         | Third lang = 40% savings |
| All languages + React                | 126   | 120        | Massive transfer benefit |

Without transfer, all languages + React would take ~161 hours. With
transfer, the estimate drops to ~120 hours -- a 25% reduction driven
entirely by the concept-first curriculum architecture.

---

## References

- Perkins, D.N. & Salomon, G. (1992). Transfer of Learning. International
  Encyclopedia of Education, 2nd ed. Foundational work on near vs far
  transfer, low-road vs high-road transfer.
- Kohn, T. (2019). The Error Behind the Error: A Study of Misconceptions
  in Python Programming. ACM SIGCSE. Data on common Python learner
  mistakes.
- Roediger, H.L. & Karpicke, J.D. (2006). Test-Enhanced Learning. APS.
  Supports immediate practice after concept introduction.
- ACM/IEEE CS2013. Computer Science Curricula 2013. Referenced for
  concept tiering and knowledge area structure.
- Stack Overflow Developer Survey 2024/2025. Language popularity and
  usage data.
- Python Enhancement Proposals: PEP 657 (fine-grained error locations),
  PEP 634 (structural pattern matching), PEP 572 (walrus operator).
- TypeScript Documentation: Handbook, Release Notes (for type system
  feature progression).
- Microsoft C# Documentation: Language reference, what's new in C# 7-12.

---

*Next document: 04 -- Gamification & Progression System (XP, levels,
streaks, rewards, skill tree unlock mechanics)*
