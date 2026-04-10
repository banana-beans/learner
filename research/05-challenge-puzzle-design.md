# 05 -- Challenge & Puzzle Design

> Research doc 5 of 12 | learner app | 2026-04-09
>
> Purpose: Define the taxonomy, structure, difficulty calibration, and
> progression mechanics for all coding challenges in the app. Every challenge
> a user encounters -- from a 1-star fill-in-the-blank to a 5-star design
> problem -- should trace its design back to this document.

---

## Table of Contents

1. Taxonomy of Coding Challenges
2. Difficulty Calibration
3. Challenge Structure (Data Model)
4. Test Case Design
5. Hint System Design
6. Submission Flow
7. Challenge Progression Within a Node
8. Challenge Generation & Variation
9. Mobile-Friendly Challenge UX
10. Examples: Python Challenges for Tier 1
11. Application: Challenge Mix, Difficulty Distribution, and XP Integration

---

## 1. Taxonomy of Coding Challenges

A single challenge type cannot serve all learning objectives. Bloom's Taxonomy
(see doc 02, Section 1.2) maps six cognitive levels to programming activities,
and different challenge formats target different levels. Learner uses eight
distinct challenge types, each with a clear pedagogical purpose.

### 1a. Write-from-Scratch

The user receives a problem description and writes the entire solution from an
empty (or near-empty) function body.

**Example:**
> "Write a function `fibonacci(n)` that returns the nth Fibonacci number
> (0-indexed). `fibonacci(0)` should return 0, `fibonacci(1)` should return 1."

**Best for:** Applying knowledge in a freeform context. This is Bloom's
"Create" level -- the learner must synthesize syntax, control flow, and domain
logic from memory without scaffolding. Write-from-scratch challenges are the
gold standard for proving competence, but they carry the highest cognitive load.
They should rarely be the first challenge in a node.

**Design notes:**
- Always provide a function signature in the starter code (name, parameters,
  return type hint). The challenge is writing the body, not guessing the API.
- Include 2-3 example calls in the description so the user understands the
  expected behavior before writing anything.
- Avoid ambiguous specs. "Sort the list" is underspecified -- stable sort?
  In-place or return new? Ascending or descending? Precision prevents
  frustration that has nothing to do with the concept being tested.

### 1b. Fill-in-the-Blank

The user receives a code template with one or more blanks (marked by `___` or
highlighted gaps) and fills in the missing parts.

**Example:**
> "Complete the list comprehension:"
> ```python
> result = [___ for x in numbers if ___]
> ```
> "The result should contain only even numbers, each multiplied by 2."

**Best for:** Syntax reinforcement, guided practice, and lowering cognitive
load for beginners. Fill-in-the-blank keeps the learner focused on the target
concept without the overhead of structuring an entire solution. It maps to
Bloom's "Apply" level with heavy scaffolding.

**Design notes:**
- Each blank should test exactly one concept. Two blanks testing two different
  concepts is fine; two blanks testing the same concept is redundant.
- The surrounding code must be correct and idiomatic. If the template itself
  looks wrong, the learner internalizes bad patterns.
- Blanks should not be so large that they become write-from-scratch in disguise.
  A good blank is 1-15 characters. If it is longer, switch to write-from-scratch.

### 1c. Bug-Fix

The user receives broken code that looks plausible and must find and fix the
error.

**Example:**
> "This function should reverse a string but returns `None`. Fix it."
> ```python
> def reverse_string(s):
>     s[::-1]
> ```

**Best for:** Debugging skills, code reading comprehension, and Bloom's
"Analyze" level. Bug-fix challenges force the learner to read someone else's
code carefully, build a mental model of its execution, and identify the
discrepancy between intention and behavior. This is a distinct and critical
skill -- many developers spend more time debugging than writing new code.

**Design notes:**
- The bug must be a realistic mistake, not a contrived typo. Missing `return`
  statements, off-by-one errors, wrong comparison operators (`=` vs `==`),
  mutable default arguments -- these are bugs real developers actually write.
- Include only one bug per challenge at low difficulty. Multi-bug challenges
  belong at star 4-5.
- The description should state the intended behavior clearly so the user
  knows what "correct" looks like.

### 1d. Refactor

The user receives working but poorly written code and must improve it without
changing its behavior.

**Example:**
> "Rewrite this nested loop using list comprehensions. The output must remain
> identical."
> ```python
> result = []
> for row in matrix:
>     for val in row:
>         if val > 0:
>             result.append(val * 2)
> ```

**Best for:** Code quality awareness, idiomatic patterns, and Bloom's
"Evaluate" level. Refactor challenges develop taste -- the ability to look at
working code and see how it could be better. They also build familiarity with
language-specific idioms (list comprehensions, ternary expressions, generator
patterns).

**Design notes:**
- The original code must actually work. Tests should pass for both the
  original and the refactored version.
- Define "better" explicitly. "Rewrite using list comprehensions" is clear.
  "Improve this code" is vague and will frustrate users.
- AI code review is especially valuable here -- it can assess whether the
  refactored version is genuinely better or just different.

### 1e. Predict-Output

The user reads a code snippet and predicts what it will output, without writing
or running any code.

**Example:**
> "What does the following code print?"
> ```python
> print([1, 2, 3][1:])
> ```
> a) `[1, 2]`  b) `[2, 3]`  c) `[1, 2, 3]`  d) `Error`

**Best for:** Mental model building, understanding evaluation order, and
Bloom's "Understand" level. Predict-output challenges reveal whether the
learner has a correct internal model of how the language works. They are fast
to complete (30 seconds to 2 minutes), making them ideal for warm-up or spaced
review sessions. Research on the testing effect (see doc 00, Section 3) shows
that retrieval-based formats like this produce stronger retention than
re-reading.

**Design notes:**
- The code should be short (1-5 lines). Predict-output is about
  understanding, not endurance.
- Include at least one distractor that reflects a common misconception. If the
  challenge tests slicing, include the off-by-one answer.
- Avoid "trick questions" that rely on obscure language behavior. The goal is
  to reinforce correct mental models, not to stump the user.

### 1f. Multiple-Choice Conceptual

A text-based question testing understanding of a concept, with no code to
write or analyze.

**Example:**
> "What is the average time complexity of dictionary key lookup in Python?"
> a) O(1)  b) O(n)  c) O(log n)  d) O(n log n)

**Best for:** Theory concepts, quick review, and Bloom's "Remember" / "Understand"
levels. Multiple-choice questions are the lowest-effort challenge type. They
are useful for testing conceptual knowledge that does not lend itself to code
(e.g., Big-O classifications, design pattern names, protocol differences).
They also work well in spaced review, where the goal is quick recall rather
than deep practice.

**Design notes:**
- Four options is the sweet spot. Fewer makes guessing too likely; more adds
  cognitive overhead without pedagogical benefit.
- Every distractor should represent a plausible misconception, not an obviously
  wrong filler. "O(n!)" as a distractor for dict lookup is useless -- no one
  believes that.
- Use these sparingly in main progression. They should comprise at most 10-15%
  of a node's challenges. Overuse creates a "quiz show" feel that undermines
  the active-coding identity of the app.

### 1g. Parsons Problems

The user receives a set of scrambled code lines and must arrange them in the
correct order to form a working program. No typing is required -- it is a
drag-and-drop interface.

**Example:**
> Arrange these lines to form a function that counts vowels in a string:
> ```
> return count
> count = 0
> def count_vowels(s):
>     if char in 'aeiou':
>     for char in s:
>         count += 1
> ```

**Best for:** Understanding program flow and structure while removing the
burden of syntax. Parsons problems were first described by Parsons and Haden
(2006) and have been extensively studied in CS education research. Ericson et
al. (2017) found that Parsons problems are as effective as write-from-scratch
problems for learning, while taking significantly less time and causing less
frustration. They are particularly effective for beginners who understand the
logic but struggle with syntax.

**Design notes:**
- Include 5-8 lines. Fewer is trivial; more becomes a frustrating combinatorial
  puzzle rather than a learning exercise.
- Indentation matters. In Python especially, the user must also set correct
  indentation -- this is part of the learning.
- Include 1-2 distractor lines at higher difficulty. These are lines that look
  plausible but should not be included in the solution.

### 1h. Design Challenges

Open-ended problems that require architectural thinking rather than algorithmic
implementation.

**Example:**
> "Design a class hierarchy for a library management system. Your design should
> handle books, members, checkouts, and fines. Write the class definitions with
> their attributes and method signatures (method bodies can be `pass`)."

**Best for:** Architecture thinking, object-oriented design, and Bloom's
"Create" level at the highest abstraction. Design challenges have no single
correct answer, which makes automated testing inadequate. They require AI
grading -- the submitted design is evaluated against criteria (appropriate
abstraction, separation of concerns, extensibility) rather than test cases.

**Design notes:**
- Provide clear constraints. "Design a system" is too open. "Design a system
  that handles X, Y, Z with these constraints" gives enough structure to be
  actionable.
- These belong only at star 4-5 and in Tier 2 or Elective nodes. Beginners
  cannot meaningfully design systems before they can implement functions.
- AI grading criteria should be explicit and consistent. Define a rubric:
  Does the design use inheritance appropriately? Are responsibilities clearly
  separated? Are naming conventions followed?

---

## 2. Difficulty Calibration

Difficulty calibration is the single most important factor in maintaining flow
(see doc 01, Section 2). A challenge that is too easy produces boredom; too
hard produces anxiety and learned helplessness. Learner uses a 5-star system
that maps to concrete, measurable properties.

### 2.1 The 5-Star System

**Star 1 -- Direct Application**
- Requires only knowledge from the current lesson, applied without modification.
- Challenge types: fill-in-blank, predict-output, multiple-choice.
- Concept count: 1. Step count: 1-2. Edge cases: 0.
- Time estimate: 1-3 minutes.
- Example: "Fill in the blank to print 'Hello, World!'"

**Star 2 -- Slight Twist**
- Requires lesson knowledge applied to a slightly different scenario.
- Challenge types: write-from-scratch (clear spec), fill-in-blank (harder),
  bug-fix (single bug).
- Concept count: 1-2. Step count: 2-3. Edge cases: 0-1.
- Time estimate: 3-7 minutes.
- Example: "Write a function that takes a name and returns a greeting string."

**Star 3 -- Concept Combination**
- Combines two or more concepts from the current node or recent prior nodes.
  Requires the user to decompose the problem into steps.
- Challenge types: write-from-scratch, bug-fix (multi-step), refactor.
- Concept count: 2-3. Step count: 3-5. Edge cases: 1-2.
- Time estimate: 7-15 minutes.
- Example: "Write a function that takes a list of strings and returns a
  dictionary mapping each string to its length, excluding strings shorter
  than 3 characters."

**Star 4 -- Non-Obvious Approach**
- The correct approach is not immediately apparent from the problem statement.
  Edge cases are critical. May require an insight or a less common technique.
- Challenge types: write-from-scratch, refactor, design.
- Concept count: 3-4. Step count: 5-8. Edge cases: 2-4.
- Time estimate: 15-25 minutes.
- Example: "Write a function that determines if a string of parentheses,
  brackets, and braces is balanced. Consider nested and interleaved cases."

**Star 5 -- Complex Multi-Step**
- Near interview-level difficulty. Multiple valid approaches exist. Requires
  careful consideration of performance, edge cases, and design trade-offs.
- Challenge types: write-from-scratch, design challenges.
- Concept count: 4+. Step count: 8+. Edge cases: 4+.
- Time estimate: 25-45 minutes.
- Example: "Implement an LRU cache with O(1) get and put operations. Include
  a max capacity and eviction logic."

### 2.2 Estimating Difficulty

Four factors determine a challenge's star rating:

1. **Concept count**: How many distinct concepts must the user understand and
   apply? A challenge requiring only list indexing is simpler than one
   requiring list indexing + dictionary construction + conditional filtering.

2. **Step count**: How many sequential operations must the user perform in
   their solution? Each step is a point where the user can get lost.

3. **Edge case count**: How many boundary conditions affect correctness? Empty
   lists, negative numbers, zero-length strings, duplicate values -- each
   edge case adds a dimension of difficulty.

4. **Abstraction level**: How far removed is the problem from concrete data
   manipulation? "Sum a list" is concrete. "Design a class hierarchy" is
   abstract. Higher abstraction requires more advanced cognitive skills.

### 2.3 Adaptive Difficulty

Static difficulty ratings are necessary but not sufficient. Different users
have different skill levels, and a star-3 challenge that is appropriate for
one user may be trivially easy or impossibly hard for another.

**Adaptive signals:**
- If a user fails a star-3 challenge twice and uses a Tier 2 hint, the system
  should suggest star-2 challenges from the same node or related nodes for
  reinforcement. This is not punishment -- it is scaffolding.
- If a user completes star-3 challenges on the first attempt with no hints
  and under the estimated time, the system should surface star-4 challenges
  and suggest the user attempt "boss" challenges.
- Hint usage, attempt count, and time-to-solve are the three inputs to the
  adaptive algorithm. Accuracy alone is insufficient because a user who takes
  45 minutes and three hints to solve a star-2 problem has a very different
  skill profile from one who solves it in 90 seconds.

**Implementation note:** Adaptive difficulty does not change the star rating
of challenges -- it changes which challenges are recommended. The ratings
remain stable so that users can trust the system ("star 3 means star 3").
Recommendations change, not labels.

---

## 3. Challenge Structure (Data Model)

Every challenge in Learner is stored as a structured object with the following
fields. This schema is the contract between content authors, the challenge
engine, and the front-end renderer.

```typescript
interface Challenge {
  id: string;                   // Unique identifier, e.g., "py-strings-002"
  title: string;                // Short display title, e.g., "Reverse Words"
  description: string;          // Full problem statement (Markdown supported)
  difficulty: 1 | 2 | 3 | 4 | 5; // Star rating
  type:
    | "write-from-scratch"
    | "fill-in-blank"
    | "bug-fix"
    | "refactor"
    | "predict-output"
    | "multiple-choice"
    | "parsons"
    | "design";
  language: "python" | "typescript" | "csharp";
  nodeId: string;               // Skill tree node this belongs to
  starterCode: string;          // Template code shown in editor
  solutionCode: string;         // Reference solution (never shown to user)
  testCases: TestCase[];        // Automated test cases (see Section 4)
  hints: HintSet;               // 3-tier hints (see Section 5)
  tags: string[];               // Concepts tested, e.g., ["loops", "dicts"]
  estimatedMinutes: number;     // Expected completion time (for speed bonus)
  xpReward: number;             // Base XP before multipliers
}

interface TestCase {
  id: string;
  input: any;                   // Function arguments
  expectedOutput: any;          // Expected return value
  isVisible: boolean;           // Shown to user before submission?
  description: string;          // Human-readable test name
  isPerformance: boolean;       // Tests efficiency, not just correctness
}

interface HintSet {
  nudge: string;                // Tier 1: points toward the right concept
  guide: string;                // Tier 2: step-by-step approach description
  reveal: string;               // Tier 3: pseudocode or near-solution
}
```

**Field-level notes:**

- `solutionCode` is never displayed to the user. It serves two purposes:
  (1) AI code review uses it as context for evaluating the user's submission,
  and (2) content authors use it to verify that all test cases pass.
- `starterCode` varies by type. For write-from-scratch, it is a function
  signature. For fill-in-blank, it contains `___` markers. For bug-fix, it
  contains the broken code. For predict-output and multiple-choice, it may
  be empty (the code is in the description).
- `tags` enable cross-referencing. If a user struggles with challenges tagged
  `["recursion"]`, the system can recommend review of recursion-related nodes
  regardless of which branch they are in.
- `xpReward` is the base value before multipliers (first-attempt bonus,
  no-hint bonus, speed bonus). The XP system is defined in doc 01 (Section 3.3)
  and doc 06 (progression). Base XP scales with difficulty: star 1 = 25 XP,
  star 2 = 50 XP, star 3 = 100 XP, star 4 = 175 XP, star 5 = 300 XP.

---

## 4. Test Case Design

Automated testing is the backbone of challenge validation. A challenge without
good test cases is a challenge that cannot meaningfully assess the user.

### 4.1 Test Case Count and Categories

Each challenge requires 5-10 test cases, distributed across three categories:

1. **Basic cases (2-3 tests):** Straightforward inputs that match the examples
   in the description. These exist to confirm the user's solution works for
   the "happy path." Example: `fibonacci(5)` returns `5`.

2. **Edge cases (2-4 tests):** Boundary conditions, empty inputs, single-element
   inputs, negative numbers, very large values, duplicate values. These separate
   correct solutions from almost-correct solutions. Example: `fibonacci(0)`
   returns `0`, `fibonacci(1)` returns `1`.

3. **Performance cases (1-3 tests):** Inputs large enough to expose inefficient
   solutions (e.g., exponential-time recursion). These are optional for star
   1-2 challenges and important for star 3-5. Example: `fibonacci(35)` should
   return within the timeout -- a naive recursive implementation will not.

### 4.2 Visible vs. Hidden Tests

- **Visible tests (2-3):** Shown to the user in the problem description as
  examples. These help the user understand the expected behavior and serve as
  a sanity check during development. They must be basic cases -- never reveal
  edge cases, as this teaches the user to handle them proactively.

- **Hidden tests (3-7):** Not shown until after submission. These include edge
  cases and performance cases. Hidden tests prevent "hardcoding" -- a user who
  writes `if input == [1,2,3]: return [3,2,1]` will pass the visible tests
  but fail the hidden ones. After submission (pass or fail), all test results
  are shown so the user can learn from what they missed.

### 4.3 Test Output Format

When tests run, results are displayed as a list of pass/fail items:

```
Test 1: fibonacci(0) == 0           PASS
Test 2: fibonacci(1) == 1           PASS
Test 3: fibonacci(5) == 5           PASS
Test 4: fibonacci(10) == 55         FAIL
  Expected: 55
  Actual:   54
Test 5: fibonacci(0) == 0           PASS  (edge: zero input)
Test 6: fibonacci(35) == 9227465    TIMEOUT (>5s)
```

For complex outputs (lists, dicts, nested structures), a diff-style display
highlights the specific differences between expected and actual output. This
prevents the user from having to manually scan two walls of text to find the
discrepancy.

### 4.4 Execution Environment

User code executes via **Pyodide** (for Python), a CPython interpreter compiled
to WebAssembly. Execution happens entirely in the browser -- no server round-trip
is needed, which keeps latency under 1 second for most challenges and enables
offline use.

- **Timeout:** 5 seconds per test case. This is generous enough for any
  reasonable solution but catches infinite loops and exponential-time algorithms.
  If a test times out, the user sees "TIMEOUT" rather than a frozen browser.
- **Memory limit:** 256 MB per execution context. Prevents runaway memory
  allocation.
- **Security:** Pyodide runs in a sandboxed WebAssembly environment. User code
  cannot access the filesystem, network, or DOM. Imports are limited to the
  Python standard library.
- **TypeScript/C# support:** Future languages will use equivalent in-browser
  runtimes (e.g., TypeScript via the TypeScript compiler + eval, C# via
  Blazor/WASM). The test runner interface is language-agnostic.

---

## 5. Hint System Design

Hints are not a concession to difficulty -- they are a core learning tool. The
research on scaffolding (Wood, Bruner, & Ross, 1976; see doc 00, Section 5)
shows that learners in the zone of proximal development benefit from graduated
assistance. A well-designed hint system provides exactly the right amount of
scaffolding, then fades as the learner grows.

### 5.1 Three-Tier Progressive Hints

Every challenge has three pre-authored hints, each more explicit than the last:

**Tier 1 -- "Nudge" (XP penalty: -10%)**
Points the learner toward the right concept or approach without giving away
the solution. It answers the question "What should I be thinking about?"

> Example (for a string reversal challenge): "Python has a slicing syntax that
> can traverse a sequence in reverse. What happens when the step value is
> negative?"

**Tier 2 -- "Guide" (XP penalty: -25%)**
Describes the approach step-by-step, like a teacher walking the student through
the logic. It answers the question "How do I break this down?"

> Example: "Step 1: Use slice notation with a negative step to reverse the
> string. Step 2: Return the reversed string from the function. Remember --
> in Python, slicing creates a new string; it does not modify the original."

**Tier 3 -- "Reveal" (XP penalty: -50%)**
Provides pseudocode or near-solution code. It answers the question "What does
the answer look like?" The reveal stops short of being copy-pasteable -- it
uses pseudocode or describes the exact code without providing it verbatim.

> Example: "Your function body should be a single line: return the input string
> sliced with `[::-1]`. The slice `[start:stop:step]` with step `-1` reverses
> any sequence."

### 5.2 Why XP Penalty Instead of Blocking

An alternative design would lock hints entirely ("no hints available -- try
harder"). This approach is common in competitive programming but destructive
in a learning context. Research on productive failure (Kapur, 2008) shows that
struggling is valuable up to a point, but past that point, frustration impedes
learning and drives attrition.

The XP penalty strikes a balance:
- It provides a small disincentive that encourages genuine effort first.
- It keeps learning flowing -- a stuck user is a user who might quit entirely.
- It preserves the learner's agency (autonomy from SDT -- see doc 01, Section 1.1).
  The user decides when the cost of struggling exceeds the cost of the XP
  penalty.
- 50% penalty at the maximum still leaves meaningful XP. The user is rewarded
  for completing the challenge even with full hints, because completing a
  challenge with hints is better than not completing it at all.

### 5.3 Post-Completion Hint Access

After a user completes a challenge (with or without hints), all three hint
tiers become viewable at no additional cost. This serves a learning purpose:
the user can review the intended approach and compare it to their own, which
is a form of elaborative interrogation (a highly effective learning strategy
per Dunlosky et al., 2013; see doc 00).

### 5.4 Hint Generation and Caching

Hints are pre-authored by content creators for every challenge and stored as
part of the challenge data model. They are not generated on-the-fly by AI.
This ensures:
- Consistent quality and tone across all challenges.
- Offline availability (no API call needed to show a hint).
- Editorial control over what is revealed at each tier.

Future enhancement: AI-generated supplementary hints that adapt to the user's
specific incorrect submission ("It looks like you forgot to handle the empty
list case -- what should your function return when the input is `[]`?"). These
would complement, not replace, the pre-authored tiers.

---

## 6. Submission Flow

The submission flow is the moment of truth -- where the user's effort meets
the system's assessment. Every millisecond of latency and every pixel of UI
in this flow affects motivation. The design must be fast, clear, and
encouraging.

### 6.1 Step-by-Step Flow

**Step 1: Write code.**
The user writes their solution in a Monaco editor instance (the same editor
engine that powers VS Code). The editor provides syntax highlighting,
auto-completion, bracket matching, and error underlining. The starter code is
pre-loaded.

**Step 2: Run (optional).**
The user clicks "Run" to execute their code via Pyodide and see the console
output. This is for debugging -- it runs the code with sample inputs and
shows `print()` output, but does not run the test suite. The user can iterate
on their solution as many times as they want before submitting. Run results
appear in under 2 seconds (flow requirement -- see doc 01, Section 2.3).

**Step 3: Submit.**
The user clicks "Submit" to run the full test suite against their code. All
test cases (visible and hidden) execute. Results appear as a pass/fail list
(see Section 4.3).

**Step 4a: All tests pass.**
- A celebration animation plays (confetti, checkmark, or similar -- brief,
  not disruptive).
- XP is awarded and displayed with a breakdown: base XP + first-attempt bonus
  + no-hint bonus + speed bonus (if applicable).
- An AI code review is queued. Within seconds, the user sees feedback on code
  quality, style, and alternative approaches. This review is informational --
  it does not affect the pass/fail status.
- The challenge is marked as "Completed" in the skill tree. If it is the last
  required challenge in the node, the node transitions to "Completed" status.

**Step 4b: Tests fail.**
- Failed tests are highlighted with expected vs. actual output.
- A brief message suggests reviewing the failing test cases and, if stuck,
  using a hint.
- No XP is deducted. No negative feedback beyond the factual test results.
  The goal is to inform, not to punish.
- The attempt count increments (tracked for analytics and adaptive difficulty,
  not shown prominently to the user).

### 6.2 Attempt Tracking

- **First-attempt bonus:** Solving a challenge on the first submission earns
  a 25% XP bonus. This rewards careful thinking before submitting, without
  punishing experimentation.
- **No penalty for multiple attempts.** The base XP is always available
  regardless of how many submissions it takes. Penalizing attempts would
  discourage experimentation, which is antithetical to how programming
  actually works. Real development involves running code, observing failures,
  and iterating. The app should reward this cycle, not punish it.
- **Attempt data feeds analytics:** The number of attempts, time between
  attempts, and hint usage patterns are tracked to calibrate difficulty
  ratings and identify challenges that are miscalibrated (e.g., a star-2
  challenge where 60% of users need 5+ attempts is probably misrated).

---

## 7. Challenge Progression Within a Node

Each skill tree node represents a topic (e.g., "Lists," "Recursion,"
"Dictionaries"). Within each node, challenges are sequenced to create a
natural learning arc from low-barrier entry to satisfying mastery.

### 7.1 Challenge Count and Ordering

Each node contains **3-5 challenges**, ordered by difficulty:

1. **First challenge: Low barrier (star 1-2).** Always a fill-in-blank,
   predict-output, or Parsons problem. The purpose is to get the user started
   with minimal friction. This is the "endowed progress" principle (Nunes &
   Dreze, 2006; see doc 01, Section 6) -- giving the user an easy first win
   creates momentum.

2. **Middle challenges: Core practice (star 2-3).** Write-from-scratch or
   bug-fix challenges that require applying the lesson content. These are
   where the main learning happens -- the user must retrieve knowledge from
   the lesson and apply it (testing effect -- see doc 00, Section 3).

3. **Final challenge: "Boss" challenge (star 3-4).** A harder challenge that
   combines the node's concepts with concepts from prerequisite nodes. This
   is the culminating assessment. It should feel like a satisfying capstone,
   not a punishing final exam.

### 7.2 Completion vs. Mastery

- **"Completed" status:** Requires passing the first 2 challenges in the node.
  This unlocks dependent nodes in the skill tree and awards the node's base
  XP. Completion is intentionally easy to achieve -- it ensures that the
  prerequisite system does not become a bottleneck.

- **"Mastered" status:** Requires passing all challenges in the node (including
  the boss challenge). Mastery is optional but visually distinguished in the
  skill tree (gold border vs. green checkmark) and awards a mastery XP bonus.
  Mastery is for learners who want to go deep -- the app respects their time
  by not requiring it for progression.

This two-tier system serves both the user who wants to move fast (complete and
move on) and the user who wants to be thorough (master everything). Both are
valid learning strategies (see doc 01, Section 1.1 on autonomy).

---

## 8. Challenge Generation & Variation

### 8.1 Manual Authoring

All challenges in Learner's progression system are manually authored by content
creators. This is a deliberate choice. Auto-generated challenges (e.g., random
parameter swaps, template-based problem generation) consistently produce lower
quality than hand-crafted problems. The difference is in the pedagogical
intention -- a human author designs a challenge to test a specific concept in
a specific way, calibrates the difficulty, and writes hints that address the
most likely points of confusion.

Quality standards for authored challenges:
- The problem statement is unambiguous.
- The test cases cover basic, edge, and (where appropriate) performance cases.
- The hints are genuinely helpful at each tier, not just progressively longer
  restatements of the problem.
- The reference solution is idiomatic and well-commented.
- The difficulty rating has been verified by at least one person other than the
  author.

### 8.2 Variants

Each challenge has **2-3 variants** -- challenges that test the same concept
at the same difficulty but with different parameters, scenarios, or context.

Example variants for a "reverse a string" challenge:
- Variant A: "Write a function that reverses a string."
- Variant B: "Write a function that reverses the words in a sentence (not the
  characters)."
- Variant C: "Write a function that reverses a string without using slicing or
  the `reversed()` built-in."

Variants serve two purposes:
1. **Retry protection:** If a user fails a challenge and retries, they may
   receive a different variant. This prevents memorizing the answer to a
   specific test case and ensures the retry tests the same concept genuinely.
2. **Spaced review:** When a concept comes up for spaced review (see doc 00,
   Section 2), the system can present a variant the user has not seen before,
   ensuring retrieval practice rather than recognition.

### 8.3 AI-Generated Practice (Future)

In a future iteration, AI-generated challenges can supplement the authored
content for users who want additional practice beyond the progression system.
These would be clearly labeled as "Practice" (not "Progression"), would not
award XP toward node completion, and would not gate any unlocks. The
distinction matters -- authored challenges are curated; practice challenges
are infinite but potentially lower quality.

---

## 9. Mobile-Friendly Challenge UX

Coding on a mobile device is inherently harder than on a desktop. The app must
acknowledge this constraint and optimize for it rather than pretending it does
not exist.

### 9.1 Editor Adaptations

- **Larger font size:** Minimum 16px for code on mobile (prevents iOS zoom
  on input focus).
- **Auto-indent:** The editor automatically handles indentation when the user
  presses Enter, reducing the number of taps needed.
- **Bracket/quote completion:** Typing `(` automatically inserts `)` and
  places the cursor between them. Same for `[`, `{`, `"`, and `'`.
- **Code toolbar:** A row of commonly-needed characters above the keyboard:
  `( ) [ ] { } : = _ " ' # .` This eliminates the need to switch keyboard
  layouts for characters that are buried on mobile keyboards.

### 9.2 Layout

- **Portrait mode (phones):** Split view with the problem description on top
  (scrollable, collapsible) and the editor on the bottom. The editor gets at
  least 50% of the screen height.
- **Landscape mode (tablets):** Side-by-side layout with description on the
  left and editor on the right, similar to desktop.
- **Very small screens (<375px width):** Tab interface -- the user switches
  between three tabs: Description, Editor, and Tests. Only one is visible at
  a time. This sacrifices context-switching efficiency for readability.

### 9.3 Interaction

- **Floating "Submit" button:** Always visible in the bottom-right corner,
  regardless of scroll position. The user should never have to scroll to
  find the submit button.
- **Test results as expandable cards:** Each test result is a card showing
  the test name and pass/fail status. Tapping a card expands it to show
  expected vs. actual output. This prevents a wall of text on small screens.
- **Swipe gestures:** Swipe left to switch from description to editor; swipe
  right to go back. Natural and discoverable.

### 9.4 Challenge Type Suitability on Mobile

Not all challenge types are equally comfortable on mobile:
- **Best on mobile:** Predict-output, multiple-choice, Parsons problems
  (drag-and-drop). These require minimal or no typing.
- **Acceptable on mobile:** Fill-in-blank (short typing), bug-fix (small edits).
- **Desktop-preferred:** Write-from-scratch (lots of typing), refactor (reading
  + rewriting), design (extensive typing). These are usable on mobile but the
  app should note "This challenge is easier on a larger screen" rather than
  blocking access.

---

## 10. Examples: Python Challenges for Tier 1

Three fully specified example challenges demonstrating the data model, test
cases, and hint system in practice.

### 10a. Node: "Variables & Types" -- Fill-in-the-Blank (1 Star)

```yaml
id: "py-vars-001"
title: "Type Conversion"
difficulty: 1
type: "fill-in-blank"
language: "python"
nodeId: "python-variables-types"
estimatedMinutes: 2
xpReward: 25
tags: ["variables", "types", "type-conversion"]
```

**Description:**
> Complete the code below so that the variable `age_str` is converted to an
> integer and stored in `age_int`, then the result of adding 10 to `age_int`
> is printed.

**Starter Code:**
```python
age_str = "25"
age_int = ___(age_str)
result = age_int + 10
print(___)
```

**Solution Code:**
```python
age_str = "25"
age_int = int(age_str)
result = age_int + 10
print(result)
```

**Test Cases:**

| # | Input | Expected Output | Visible | Description |
|---|-------|----------------|---------|-------------|
| 1 | (none -- code runs as-is) | `35` printed to stdout | Yes | Basic: default values |
| 2 | age_str = "0" | `10` | No | Edge: zero |
| 3 | age_str = "100" | `110` | No | Basic: larger number |
| 4 | age_str = "1" | `11` | No | Basic: single digit |
| 5 | age_str = "-5" | `5` | No | Edge: negative string |

**Hints:**

- **Nudge (-10% XP):** "Python has built-in functions that convert values from
  one type to another. What function converts a string to a whole number?"
- **Guide (-25% XP):** "The function `int()` converts a string to an integer.
  For the second blank, think about which variable holds the final answer
  you want to display."
- **Reveal (-50% XP):** "First blank: `int`. Second blank: `result`. The
  `int()` function parses the string `'25'` into the integer `25`, then
  adding 10 gives `35`, which is stored in `result`."

---

### 10b. Node: "Strings" -- Write-from-Scratch (2 Stars)

```yaml
id: "py-strings-002"
title: "Count Vowels"
difficulty: 2
type: "write-from-scratch"
language: "python"
nodeId: "python-strings"
estimatedMinutes: 5
xpReward: 50
tags: ["strings", "loops", "conditionals"]
```

**Description:**
> Write a function `count_vowels(text)` that returns the number of vowels
> (a, e, i, o, u) in the given string. The function should be case-insensitive
> -- both `'A'` and `'a'` count as vowels.
>
> Examples:
> - `count_vowels("hello")` returns `2`
> - `count_vowels("AEIOU")` returns `5`
> - `count_vowels("xyz")` returns `0`

**Starter Code:**
```python
def count_vowels(text):
    # Your code here
    pass
```

**Solution Code:**
```python
def count_vowels(text):
    count = 0
    for char in text.lower():
        if char in "aeiou":
            count += 1
    return count
```

**Test Cases:**

| # | Input | Expected Output | Visible | Description |
|---|-------|----------------|---------|-------------|
| 1 | `"hello"` | `2` | Yes | Basic: mixed |
| 2 | `"AEIOU"` | `5` | Yes | Basic: all vowels, uppercase |
| 3 | `"xyz"` | `0` | Yes | Basic: no vowels |
| 4 | `""` | `0` | No | Edge: empty string |
| 5 | `"aEiOu"` | `5` | No | Edge: mixed case |
| 6 | `"bcdfg"` | `0` | No | Edge: all consonants |
| 7 | `"aaa"` | `3` | No | Edge: repeated vowels |
| 8 | `"Hello, World!"` | `3` | No | Edge: punctuation and spaces |

**Hints:**

- **Nudge (-10% XP):** "You will need to check each character in the string
  one at a time. How do you iterate over the characters of a string in Python?
  Also, consider how to handle uppercase vs. lowercase."
- **Guide (-25% XP):** "Step 1: Initialize a counter variable to 0. Step 2:
  Loop through each character in the string (convert to lowercase first).
  Step 3: Check if the character is in the string `'aeiou'`. Step 4: If it
  is, increment the counter. Step 5: Return the counter after the loop."
- **Reveal (-50% XP):** "Use `text.lower()` to normalize case. Then use a
  `for` loop: `for char in text.lower():`. Inside the loop, check
  `if char in 'aeiou':` and increment a counter. Return the counter after
  the loop ends."

---

### 10c. Node: "Booleans" -- Bug-Fix (2 Stars)

```yaml
id: "py-bools-003"
title: "Leap Year Bug"
difficulty: 2
type: "bug-fix"
language: "python"
nodeId: "python-booleans"
estimatedMinutes: 5
xpReward: 50
tags: ["booleans", "conditionals", "logical-operators"]
```

**Description:**
> The function below is supposed to return `True` if a given year is a leap
> year and `False` otherwise. The rules for leap years are:
> - Divisible by 4: leap year
> - BUT divisible by 100: NOT a leap year
> - BUT divisible by 400: leap year
>
> The function has a bug. Find and fix it.
>
> Examples:
> - `is_leap_year(2024)` should return `True`
> - `is_leap_year(1900)` should return `False`
> - `is_leap_year(2000)` should return `True`

**Starter Code (buggy):**
```python
def is_leap_year(year):
    if year % 4 == 0:
        if year % 100 == 0:
            return False
        return True
    return False
```

The bug: the function does not handle the divisible-by-400 exception. Years
like 2000 (divisible by 400) should return `True`, but the buggy code returns
`False` because it hits the `year % 100 == 0` branch first.

**Solution Code:**
```python
def is_leap_year(year):
    if year % 4 == 0:
        if year % 100 == 0:
            if year % 400 == 0:
                return True
            return False
        return True
    return False
```

**Test Cases:**

| # | Input | Expected Output | Visible | Description |
|---|-------|----------------|---------|-------------|
| 1 | `2024` | `True` | Yes | Basic: divisible by 4 |
| 2 | `1900` | `False` | Yes | Basic: divisible by 100 |
| 3 | `2000` | `True` | Yes | The bug: divisible by 400 |
| 4 | `2023` | `False` | No | Basic: not divisible by 4 |
| 5 | `1600` | `True` | No | Edge: divisible by 400 |
| 6 | `1800` | `False` | No | Edge: divisible by 100 but not 400 |
| 7 | `4` | `True` | No | Edge: small number |
| 8 | `100` | `False` | No | Edge: exactly 100 |

**Hints:**

- **Nudge (-10% XP):** "The leap year rule has three conditions, not two. The
  buggy code only checks two of them. What is the third condition?"
- **Guide (-25% XP):** "The code correctly checks divisibility by 4 and by
  100, but it never checks divisibility by 400. When a year is divisible by
  both 100 and 400 (like 2000), it should be a leap year. Add a check for
  this case inside the `year % 100 == 0` branch."
- **Reveal (-50% XP):** "Inside the `if year % 100 == 0:` block, before
  returning `False`, add a check: `if year % 400 == 0: return True`. This
  handles the special case where century years that are divisible by 400
  are still leap years."

---

## 11. Application: Challenge Mix, Difficulty Distribution, and XP Integration

### 11.1 Recommended Challenge Mix per Node

Based on the taxonomy and the pedagogical goals of each challenge type, the
following mix is recommended for a standard 5-challenge node:

| Position | Type | Difficulty | Purpose |
|----------|------|-----------|---------|
| 1 | Fill-in-blank or Predict-output | Star 1 | Low-barrier entry, build confidence |
| 2 | Write-from-scratch | Star 2 | Core practice, apply lesson content |
| 3 | Bug-fix or Parsons | Star 2-3 | Build debugging/reading skills |
| 4 | Write-from-scratch | Star 3 | Combine concepts, problem decomposition |
| 5 | Write-from-scratch or Refactor | Star 3-4 | Boss challenge, capstone |

For 3-challenge nodes (simpler topics), use positions 1, 2, and 5.
For 4-challenge nodes, use positions 1, 2, 4, and 5.

Challenge type distribution across an entire branch (approximate targets):
- Write-from-scratch: 40-50% (the core of learning to code)
- Fill-in-blank: 15-20% (scaffolded practice, early nodes)
- Bug-fix: 10-15% (debugging skills, reading comprehension)
- Predict-output: 5-10% (mental model building)
- Parsons: 5-10% (flow and structure, beginner-friendly)
- Refactor: 5-10% (code quality, later nodes)
- Multiple-choice: 5% (theory concepts only)
- Design: 2-5% (Tier 2 and Elective nodes only)

### 11.2 Difficulty Distribution Across Tiers

The difficulty curve should escalate across tiers, not just within nodes:

**Tier 1 (Core Tier 1) nodes:**
- Star 1: 30% of challenges
- Star 2: 45% of challenges
- Star 3: 20% of challenges
- Star 4-5: 5% of challenges (boss challenges only)

**Tier 2 (Core Tier 2) nodes:**
- Star 1: 10% of challenges
- Star 2: 25% of challenges
- Star 3: 40% of challenges
- Star 4: 20% of challenges
- Star 5: 5% of challenges

**Elective nodes:**
- Star 1-2: 15% of challenges
- Star 3: 30% of challenges
- Star 4: 35% of challenges
- Star 5: 20% of challenges

This distribution ensures that beginners encounter mostly star 1-2 challenges
(building competence and confidence), while advanced users encounter star 3-5
challenges (maintaining flow through appropriate difficulty).

### 11.3 XP Integration

Challenges are the primary source of XP in Learner. The XP system (detailed
in doc 01, Section 3.3 and doc 06) uses challenges as its engine:

**Base XP by difficulty:**
- Star 1: 25 XP
- Star 2: 50 XP
- Star 3: 100 XP
- Star 4: 175 XP
- Star 5: 300 XP

**Multipliers (additive, applied to base):**
- First-attempt bonus: +25% (solved on first submission)
- No-hint bonus: +15% (solved without using any hints)
- Speed bonus: +10% (solved in under 50% of estimated time)
- Mastery bonus: +50% (for completing the boss challenge of a node, awarded
  once when all node challenges are passed)

**Example calculation:** A user solves a star-3 write-from-scratch challenge
on their first attempt, without hints, in 4 minutes (estimated: 10 minutes).
Base: 100 XP + first-attempt (25) + no-hint (15) + speed (10) = 150 XP.

XP penalties from hints are applied to the base before multipliers:
- Tier 1 hint used: base becomes 90 (100 - 10%)
- Tier 2 hint used: base becomes 75 (100 - 25%)
- Tier 3 hint used: base becomes 50 (100 - 50%)
- Multiple hints: penalties stack (Tier 1 + Tier 2 = -35%, base becomes 65).

### 11.4 Feeding Into Spaced Review

Completed challenges generate review items for the spaced repetition system
(see doc 00, Section 2). The review format depends on the challenge type:

- Write-from-scratch challenges generate review items as shorter, targeted
  recall questions (e.g., "Write a function that..." becomes "What approach
  would you use to...").
- Predict-output challenges are reused directly -- they are already in a
  review-friendly format.
- Bug-fix challenges may be reused with a different bug inserted into the
  same code.
- Multiple-choice questions are reused with shuffled option order.

The spaced review system tracks each concept (via tags) independently. A user
who demonstrates strong retention of `["loops"]` but weak retention of
`["recursion"]` will see more recursion-tagged review items, regardless of
which specific challenges they originally completed.

---

## References

- Dunlosky, J., Rawson, K. A., Marsh, E. J., Nathan, M. J., & Willingham, D. T. (2013). Improving students' learning with effective learning techniques: Promising directions from cognitive and educational psychology. Psychological Science in the Public Interest, 14(1), 4-58.
- Ericson, B. J., Margulieux, L. E., & Rick, J. (2017). Solving Parsons problems versus fixing and writing code. Proceedings of the 17th Koli Calling International Conference on Computing Education Research, 20-29.
- Kapur, M. (2008). Productive failure. Cognition and Instruction, 26(3), 379-424.
- Nunes, J. C., & Dreze, X. (2006). The endowed progress effect: How artificial advancement increases effort. Journal of Consumer Research, 32(4), 504-512.
- Parsons, D., & Haden, P. (2006). Parsons programming puzzles: A fun and effective learning tool for first programming courses. Proceedings of the 8th Australasian Conference on Computing Education, 157-163.
- Wood, D., Bruner, J. S., & Ross, G. (1976). The role of tutoring in problem solving. Journal of Child Psychology and Psychiatry, 17(2), 89-100.
