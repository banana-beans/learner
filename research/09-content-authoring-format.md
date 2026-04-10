# 09 -- Content Authoring Format: How Lessons Are Structured

> Research doc 9 of 12 | learner app | 2026-04-09
>
> Purpose: Define the lesson authoring format, interactive component library,
> content guidelines, and offline delivery pipeline. Every lesson in learner is
> an MDX file -- Markdown with embedded React components -- that gets
> pre-rendered and cached for offline use on the subway.

---

## Table of Contents

1. MDX as the Lesson Format
2. Lesson Template Structure
3. Interactive Components Available in MDX
4. Lesson Sections and Pacing
5. Lesson Content Guidelines (Style Guide)
6. Review Card Generation from Lessons
7. Content Organization and File Structure
8. Offline Content Delivery
9. Content Versioning and Updates
10. Example: Complete Lesson -- "Dictionaries"

---

## 1. MDX as the Lesson Format

### 1.1 What MDX Is

MDX is Markdown with JSX. It lets you write prose in standard Markdown
(headings, bold, lists, links) and embed React components directly inline.
A lesson author writes natural paragraphs just like a blog post, then drops in
an interactive code editor or quiz component wherever the student needs to do
something rather than just read.

A minimal example:

```mdx
## Variables in Python

A variable is a name that points to a value.

<CodeBlock language="python" title="Your first variable">
{`name = "Alice"
print(name)`}
</CodeBlock>

Now try it yourself:

<InteractiveExample
  language="python"
  starterCode="# Create a variable called age and set it to 25"
  solution="age = 25\nprint(age)"
/>
```

The Markdown renders as styled text. The `<CodeBlock>` renders as a
syntax-highlighted, copyable code snippet. The `<InteractiveExample>` renders
as an editable Monaco editor with a "Run" button. The lesson author never
touches React internals -- they just use the component like an HTML tag.

### 1.2 Why MDX Over Alternatives

We evaluated four approaches before settling on MDX.

**Pure Markdown:** Too static. You can show code blocks but the user cannot
edit or run them. No quizzes, no interactive exercises.

**JSON or YAML:** Machine-friendly but author-hostile. Writing 25 minutes of
lesson prose as nested JSON with escaped newlines is painful. No spell check,
no Markdown preview, no heading navigation.

**Custom format:** Inventing a DSL means building a parser, renderer, editor
tooling, and documentation. Maintenance burden is not justified when MDX
already solves the problem.

**MDX (our choice):** Markdown authoring ergonomics plus React interactivity.
The ecosystem is mature: `next-mdx-remote` handles server-side rendering in
Next.js App Router, VS Code has MDX syntax highlighting, and every frontend
developer already knows JSX. MDX is the standard for documentation sites
(Docusaurus, Nextra) and the natural fit for interactive educational content.

### 1.3 Rendering Pipeline

Learner uses `next-mdx-remote` to render MDX in Next.js App Router:

1. MDX files live in `src/content/{language}/{tier}/{slug}.mdx`
2. At build time, Next.js reads the MDX file
3. `next-mdx-remote` compiles it to a React component tree
4. Custom components are injected via a components map
5. The rendered HTML is cached by the service worker for offline access

The components map is defined once in `src/components/mdx/index.ts` and
includes all eight interactive components. Every MDX file has access to them
without import statements -- authors just use the tag name.

---

## 2. Lesson Template Structure

Every lesson MDX file follows a consistent template. This is not a suggestion
-- it is a structural requirement enforced by a linting script that runs on
every content PR.

```mdx
---
title: "Dictionaries"
nodeId: "python-t3-dictionaries"
tier: 3
branch: "python"
estimatedMinutes: 25
prerequisites: ["python-t3-lists", "python-t3-tuples"]
concepts: ["key-value pairs", "dict methods", "dict comprehensions", "hashing"]
---

## Introduction
Brief hook -- why this matters, real-world analogy

## Core Concept
Explanation with embedded code examples

<CodeBlock language="python" title="Creating a dictionary">
{`student = {"name": "Alice", "age": 25, "grade": "A"}`}
</CodeBlock>

## Interactive Example
<InteractiveExample language="python" starterCode="..." solution="...">
Try modifying the dictionary below to add a new key.
</InteractiveExample>

## Deep Dive
More detailed explanation, edge cases, gotchas

## Real-World Application
How this concept is used in actual projects

## Key Takeaways
- Bullet point summary
- Terms to remember (these become review cards)

## Next Steps
Preview of what's coming next
```

### 2.1 Frontmatter Fields

The YAML frontmatter at the top of each file serves as structured metadata
consumed by the skill tree, progress tracker, and search index.

| Field | Type | Purpose |
|---|---|---|
| `title` | string | Display name in the skill tree and lesson header |
| `nodeId` | string | Unique identifier matching the skill tree node ID |
| `tier` | number | Tier in the skill tree (1-5) |
| `branch` | string | Language or topic branch |
| `estimatedMinutes` | number | Estimated completion time (shown in UI) |
| `prerequisites` | string[] | nodeIds that must be completed before this lesson unlocks |
| `concepts` | string[] | Searchable concept tags, also used for review card generation |

The `nodeId` is the primary key connecting content to progress. Progress is
tracked by nodeId, not file path -- content can be reorganized or rewritten
without losing progress.

### 2.2 Required Sections

Every lesson must include, in order: **Introduction** (hook with analogy),
**Core Concept** (teach with CodeBlock), **Interactive Example** (student
writes code), **Deep Dive** (edge cases, gotchas), **Real-World Application**
(realistic project context), **Key Takeaways** (3-5 bullet points for review
cards), and **Next Steps** (preview next lesson).

---

## 3. Interactive Components Available in MDX

These are the eight components available to lesson authors. Each is designed
to serve a specific pedagogical purpose. Authors use them by tag name -- no
imports needed.

### 3.1 `<CodeBlock>` -- Static Code Display

A read-only, syntax-highlighted code block with a copy button.

**Props:**

| Prop | Type | Required | Description |
|---|---|---|---|
| `language` | string | yes | Syntax highlighting language (`python`, `typescript`, `csharp`, etc.) |
| `title` | string | no | Caption displayed above the code block |
| `highlightLines` | number[] | no | Line numbers to emphasize with a background highlight |

**Renders:** A styled code block with syntax highlighting (via Shiki), a
"Copy" button in the top-right corner, and optional highlighted lines.

**When to use:** For example code the student should read but not edit. Every
Core Concept section should have at least one CodeBlock.

### 3.2 `<InteractiveExample>` -- Editable, Runnable Code

An embedded Monaco editor where the student can write, edit, and run code.

**Props:**

| Prop | Type | Required | Description |
|---|---|---|---|
| `language` | string | yes | Language for syntax highlighting and runtime |
| `starterCode` | string | yes | Initial code shown in the editor |
| `solution` | string | yes | Reference solution (hidden until "Show Solution") |
| `description` | string | no | Brief instruction text above the editor |

**Renders:** A compact Monaco editor (10-15 lines) with starter code
pre-loaded, a "Run" button, a "Reset" button, and a "Show Solution" button
(disabled until the student attempts at least one run). Output panel below
shows stdout, stderr, or runtime errors.

**Runtime:** Python runs in Pyodide (WASM, fully offline). TypeScript runs in
a sandboxed eval. C# uses a WASM-compiled Mono runtime (console output only).

**When to use:** After every Core Concept section. Starter code should be
60-80% complete, requiring the student to write 2-5 lines.

### 3.3 `<ConceptHighlight>` -- Tappable Term Definition

An inline highlighted term that shows a definition on tap or hover.

**Props:**

| Prop | Type | Required | Description |
|---|---|---|---|
| `term` | string | yes | The term being defined |
| `definition` | string | yes | Fallback definition (used offline if no cached AI response) |

**Renders:** Underlined text with a subtle highlight. Tap (mobile) or hover
(desktop) shows a popover with the definition. If online, a "Tell me more"
button generates a contextual AI explanation, cached in IndexedDB for future
offline access.

**When to use:** Every time a new technical term appears for the first time.
Rule of thumb: if a student might need to Google the term, wrap it in a
ConceptHighlight.

### 3.4 `<Quiz>` -- Inline Knowledge Check

A multiple-choice or true/false question embedded directly in the lesson flow.

**Props:**

| Prop | Type | Required | Description |
|---|---|---|---|
| `question` | string | yes | The question text |
| `options` | string[] | yes | Array of answer options |
| `correctIndex` | number | yes | Zero-based index of the correct option |
| `explanation` | string | yes | Shown after answering (whether correct or not) |

**Renders:** Question text followed by clickable option buttons. Selected
answer turns green (correct) or red (incorrect), then the explanation appears.
Correct answers award 10 XP.

**When to use:** At the end of a section to verify understanding. Test
comprehension ("what happens when...") rather than memorization ("what is the
syntax for...").

### 3.5 `<PredictOutput>` -- "What Does This Print?"

A code block with a text input where the student predicts what the code will
output before running it.

**Props:**

| Prop | Type | Required | Description |
|---|---|---|---|
| `code` | string | yes | The code to display |
| `answer` | string | yes | The expected output (for comparison) |
| `explanation` | string | yes | Shown after the student checks their prediction |

**Renders:** A read-only code block, a text input labeled "What does this
print?", and a "Check" button. After checking, the student sees whether their
prediction matched, plus the explanation.

**When to use:** In the Deep Dive section, especially for edge cases or
surprising behavior. Prediction exercises force active mental tracing rather
than passive reading.

### 3.6 `<Callout>` -- Highlighted Info Box

A colored box for tips, warnings, and common mistakes.

**Props:**

| Prop | Type | Required | Description |
|---|---|---|---|
| `type` | string | yes | One of: `"info"`, `"warning"`, `"tip"`, `"gotcha"` |

**Renders:** A colored box with an icon: `info` (blue), `warning` (yellow),
`tip` (green), `gotcha` (red).

**When to use:** Sparingly -- no more than 2-3 per lesson. The `gotcha` type
is the most valuable; every Deep Dive section should have at least one.

### 3.7 `<CompareLanguages>` -- Side-by-Side Code Comparison

Shows the same concept implemented in multiple languages.

**Props:**

| Prop | Type | Required | Description |
|---|---|---|---|
| `languages` | string[] | yes | Array of language names |
| `code` | string[] | yes | Array of code strings (same order as languages) |

**Renders:** Tabbed interface (mobile) or side-by-side panels (desktop).

**When to use:** When teaching cross-language concepts (loops, classes, error
handling). Valuable for students learning a second or third language.

### 3.8 `<DiagramBlock>` -- Visual Diagram

A block for data structure visualizations, architecture diagrams, or flowcharts.

**Props:**

| Prop | Type | Required | Description |
|---|---|---|---|
| `alt` | string | yes | Accessibility description for screen readers |
| `caption` | string | no | Caption displayed below the diagram |

**Content:** Children can be inline SVG or ASCII art in a `<pre>` tag. All
diagrams must be self-contained -- no external URLs (offline requirement).

**When to use:** Data structure visualizations, algorithm flowcharts, or
architecture diagrams.

---

## 4. Lesson Sections and Pacing

### 4.1 Section Count and Length

Each lesson contains 5-7 sections, each taking 3-5 minutes, targeting a total
of 20-30 minutes. Progress dots at the top show which section the student is
on and how many remain.

### 4.2 Interactive Density

Interactive elements must appear every 2-3 paragraphs. The rhythm is: read a
little, do a little. Minimum per lesson: 2 CodeBlocks, 1 InteractiveExample,
1 Quiz or PredictOutput, 1 Callout. A typical 25-minute lesson has 3-4
CodeBlocks, 2 InteractiveExamples, 2 Quizzes, and 2-3 Callouts.

### 4.3 The Concrete-Abstract-Concrete Pattern

Every section follows the CAC pattern (from Kolb's experiential learning):

1. **Concrete first:** Show real code the student can immediately understand
2. **Abstract second:** Explain the underlying principle
3. **Concrete again:** Let the student apply the principle via InteractiveExample

Do not start sections with definitions. Start with a tangible example that
creates a mental hook, then introduce the abstraction.

---

## 5. Lesson Content Guidelines (Style Guide)

### 5.1 Reading Level and Voice

Write at a 10th-grade reading level -- clear, not dumbed down. Use short
sentences. When a technical term is necessary, define it with ConceptHighlight.

Use second person ("you") throughout. Tone: patient tutor, not textbook.

- Good: "You've already seen lists. Dictionaries solve a different problem..."
- Avoid: third person, passive voice, academic hedging

### 5.2 Code Example Guidelines

- 5-15 lines, focused on one concept
- Meaningful variable names (not `x`, `foo`, `bar`)
- Realistic data (student names, product prices, sensor readings)
- Every example must be syntactically valid and runnable

### 5.3 Analogies

Use real-world analogies. The primary user is a structural engineer, so
building analogies land naturally: a dictionary is like a blueprint index,
a class is like a structural template. Do not force analogies -- a bad one
is worse than none.

### 5.4 Gotchas and Section Endings

Every lesson should anticipate 1-3 common beginner mistakes, surfaced in
`<Callout type="gotcha">`. Every section (except Introduction and Next Steps)
should end with a Quiz or PredictOutput for immediate feedback and adaptive
difficulty data.

---

## 6. Review Card Generation from Lessons

### 6.1 How Cards Are Created

Each lesson generates 2-5 review cards for spaced repetition (doc 01). Cards
are defined in a companion file (e.g., `08-conditionals.cards.json`) alongside
the MDX file, containing an array of card objects with `type`, `front`, `back`,
and `sourceLesson` fields.

### 6.2 Card Types

**Concept cards** derive from Key Takeaways -- each bullet becomes a
question/answer pair. **Code output cards** derive from PredictOutput and
CodeBlock examples -- front shows code, back shows output. **Fill-in-blank
cards** derive from InteractiveExample solutions with a key part blanked out.

### 6.3 Linking Cards to Lessons

Every card includes a `sourceLesson` nodeId. When a student fails a card 2+
times, the app offers a "Review this lesson" link. When a lesson is completed,
its cards are automatically added to the spaced repetition queue.

---

## 7. Content Organization and File Structure

### 7.1 Directory Layout

```
src/content/
  python/
    basics/
      01-hello-world.mdx
      01-hello-world.cards.json
      02-variables.mdx
      02-variables.cards.json
      03-data-types.mdx
      03-data-types.cards.json
    control-flow/
      08-conditionals.mdx
      08-conditionals.cards.json
      09-loops.mdx
      09-loops.cards.json
    data-structures/
      15-lists.mdx
      16-tuples.mdx
      17-dictionaries.mdx
      18-sets.mdx
    functions/
    oop/
    advanced/
  typescript/
    basics/
    types/
    generics/
  react/
    fundamentals/
    hooks/
    patterns/
  csharp/
    basics/
    oop/
    linq/
  dsa/
    arrays/
    trees/
    graphs/
  databases/
  systems/
  networking/
  security/
  devops/
```

### 7.2 Naming Conventions

- **Numbered prefix** (`01-`, `02-`): determines display order
- **Slug** matches nodeId suffix (e.g., `17-dictionaries.mdx` maps to
  `python-t3-dictionaries`)
- **One file per node:** no multi-lesson nodes, no multi-node lessons
- **Subdirectories** (`basics/`, `data-structures/`) are human-readable
  groupings; the `tier` frontmatter field is authoritative

### 7.3 Content Index

A build script (`scripts/build-content-index.ts`) scans all MDX frontmatter
and generates `content-index.json` -- a manifest consumed by the skill tree,
search, and prerequisite checker. Regenerated on every build.

---

## 8. Offline Content Delivery

Learner is designed for the subway -- no internet, no compromise. Every piece
of lesson content must work fully offline after the student has visited the
app at least once.

### 8.1 Pre-rendering Strategy

MDX files are pre-rendered at build time using Next.js static site generation
(SSG). Each lesson route (`/learn/{branch}/{slug}`) produces a fully rendered
HTML page with all content inlined. There are no client-side data fetches
required to display lesson content.

### 8.2 Service Worker Caching

A service worker (using Workbox) pre-caches all lesson pages after first visit:

1. **Install:** Cache the app shell (layout, navigation, JS bundles)
2. **Background sync:** Fetch all lesson pages in the background (~15-20 MB
   for ~200 lessons)
3. **Cache-first serving:** Serve from cache, fall back to network only on
   cache miss

### 8.3 Interactive Runtime Offline

Pyodide (~12 MB WASM Python runtime) is cached by the service worker. All
Python InteractiveExamples run in-browser with zero network calls. TypeScript
uses an in-browser eval sandbox requiring no external runtime.

### 8.4 Media and Content Constraints

All images must be inline SVG or base64 -- external URLs are forbidden. A
linting rule fails any MDX file containing `http://` or `https://` in image
tags. ConceptHighlight components always include a static `definition` prop
as offline fallback; cached AI explanations (from IndexedDB) are shown when
available.

---

## 9. Content Versioning and Updates

### 9.1 Git-Tracked Content

All lesson content is tracked in the same git repository as the app code.
Content changes go through the same PR review process as code changes. Content
and component changes are reviewed together, history is auditable via git log,
and branching/staging work naturally.

### 9.2 Update Detection

When deployed, the service worker detects stale assets, downloads updated
pages in the background, and shows a "New content available" banner. Updates
are incremental -- only changed pages are re-fetched.

### 9.3 Progress Stability

Progress is keyed by `nodeId`, not file content or path. Lessons can be
rewritten, files renamed, sections added -- all without affecting completion
status. The only breaking change is deleting or renaming a nodeId (requires a
migration entry).

### 9.4 Future: Community Contributions

MDX with typed frontmatter makes community contributions practical via GitHub
PRs. CI validates structure, required sections, and interactive element
minimums before maintainer review.

---

## 10. Example: Complete Lesson -- "Dictionaries"

Below is a complete lesson demonstrating all components and conventions
described in this document.

```mdx
---
title: "Dictionaries"
nodeId: "python-t3-dictionaries"
tier: 3
branch: "python"
estimatedMinutes: 25
prerequisites: ["python-t3-lists", "python-t3-tuples"]
concepts: ["key-value pairs", "dict methods", "dict comprehensions", "hashing"]
---

## Introduction

You already know how to store a collection of items in a list. But what if you
need to look something up by name instead of by position? Imagine a building's
room directory in the lobby -- you don't look up "room number 7," you look up
"Conference Room B" and the directory tells you it's on floor 3. That lookup-
by-name behavior is exactly what a Python dictionary gives you.

## Core Concept

A dictionary stores <ConceptHighlight term="key-value pair" definition="A
pairing of a unique key (the lookup name) with a value (the data you want to
retrieve). In Python, written as key: value inside curly braces.">key-value
pairs</ConceptHighlight>. You provide a key, and the dictionary instantly
returns the associated value.

<CodeBlock language="python" title="Creating a dictionary">
{`room_directory = {
    "Conference Room B": 3,
    "Main Office": 1,
    "Server Room": 2,
    "Break Room": 1,
}

# Look up which floor Conference Room B is on
floor = room_directory["Conference Room B"]
print(f"Conference Room B is on floor {floor}")  # floor 3`}
</CodeBlock>

The keys are the room names (strings). The values are the floor numbers
(integers). You look up a key with square bracket notation, just like
accessing a list by index -- except instead of a number, you use the key.

## Interactive Example

<InteractiveExample
  language="python"
  starterCode={`# Create a dictionary mapping tool names to their weights (in lbs)
# Add at least 3 tools, then print the weight of "hammer"
tools = {}

# Your code here

print(tools["hammer"])`}
  solution={`tools = {
    "hammer": 2,
    "wrench": 3,
    "screwdriver": 1,
}
print(tools["hammer"])`}
  description="Create a dictionary of tool names and their weights."
/>

## Deep Dive

### Why Are Dictionaries Fast?

Under the hood, Python dictionaries use a <ConceptHighlight term="hash table"
definition="A data structure that converts keys into array indices using a
hash function, enabling O(1) average-case lookups regardless of how many
items are stored.">hash table</ConceptHighlight>. When you add a key like
`"hammer"`, Python runs a hash function on it to compute a numeric index,
then stores the value at that index. When you look up `"hammer"` later, it
runs the same hash function, goes directly to that index, and returns the
value. No scanning through every item -- it jumps straight to the answer.

This is why dictionary lookups are O(1) on average, while list lookups by
value are O(n). For 10 items, the difference is negligible. For 10 million
items, it's the difference between instant and slow.

<Callout type="gotcha">
Dictionary keys must be immutable (hashable). Strings, numbers, and tuples
work as keys. Lists do NOT work as keys because they're mutable -- if you
changed the list after using it as a key, the hash would be wrong and the
dictionary would break. If you try `d = {[1, 2]: "value"}`, Python raises
a `TypeError: unhashable type: 'list'`.
</Callout>

### Useful Dictionary Methods

<CodeBlock language="python" title="Common dict methods" highlightLines={[2, 5, 8]}>
{`scores = {"alice": 95, "bob": 82, "carol": 91}
# .get() returns None (or a default) instead of raising KeyError
dave_score = scores.get("dave", 0)  # 0

# .keys(), .values(), .items()
for name, score in scores.items():
    print(f"{name}: {score}")

# Check if a key exists
if "alice" in scores:
    print("Alice has a score")`}
</CodeBlock>

<Callout type="tip">
Use `.get(key, default)` instead of `[key]` when the key might not exist.
It's safer and avoids wrapping everything in try/except blocks.
</Callout>

<PredictOutput
  code={`d = {"a": 1, "b": 2}
d["c"] = 3
d["a"] = 99
print(len(d))
print(d["a"])`}
  answer="3\n99"
  explanation="Adding 'c' brings the count to 3. Reassigning 'a' changes its
  value to 99 but doesn't add a new key -- 'a' already exists. So len(d) is 3,
  and d['a'] is 99."
/>

## Real-World Application

Dictionaries are everywhere in real Python code. Here's one common pattern --
counting occurrences:

<CodeBlock language="python" title="Word frequency counter">
{`def count_words(text):
    counts = {}
    for word in text.lower().split():
        counts[word] = counts.get(word, 0) + 1
    return counts

report = "beam load beam stress load beam"
print(count_words(report))
# {'beam': 3, 'load': 2, 'stress': 1}`}
</CodeBlock>

APIs return JSON data, and JSON objects become Python dictionaries. If you've
ever called a weather API or a stock price API, you've worked with
dictionaries.

## Key Takeaways

- Dictionaries store **key-value pairs** and let you look up values by key
- Keys must be **immutable** (strings, numbers, tuples) -- no lists as keys
- Lookups are **O(1)** on average thanks to hash tables
- Use `.get(key, default)` for safe lookups that won't raise KeyError
- Use `.items()` to loop over both keys and values
- Dictionaries are the Python equivalent of JSON objects

<Quiz
  question="Which of the following can NOT be used as a dictionary key in Python?"
  options={[
    "A string like 'hello'",
    "An integer like 42",
    "A list like [1, 2, 3]",
    "A tuple like (1, 2)"
  ]}
  correctIndex={2}
  explanation="Lists are mutable, so they are not hashable and cannot be used as
  dictionary keys. Strings, integers, and tuples are all immutable and work fine
  as keys."
/>

## Next Steps

Now that you can store and retrieve data by key, the next lesson covers
**sets** -- collections of unique values that use the same hash table
technology as dictionaries but store only keys, no values.
```

---

## Application: Content Pipeline for Learner

The content authoring format described above feeds the following pipeline:

**Authoring:** Lesson authors write MDX files following the template and style
guide. They use the eight interactive components by tag name. They create a
companion `.cards.json` file for spaced repetition cards.

**Validation:** A CI script (`scripts/validate-content.ts`) runs on every PR
that touches `src/content/`. It checks: frontmatter has all required fields,
all required sections exist, interactive element minimums are met, no external
image URLs, nodeId matches the file path convention, and prerequisites
reference valid nodeIds.

**Build:** `next-mdx-remote` compiles each MDX file into a React component
tree. The components map injects the interactive components. Static site
generation produces a fully rendered HTML page for each lesson route.

**Index:** `scripts/build-content-index.ts` scans all MDX frontmatter and
produces `content-index.json`, consumed by the skill tree, search, and
prerequisite checker.

**Caching:** The service worker pre-caches all rendered lesson pages plus the
Pyodide runtime. After first visit, every lesson works fully offline.

**Delivery:** Students navigate the skill tree, open a lesson, and interact
with it entirely in the browser. Code runs in Pyodide. Quizzes award XP.
Concept highlights show cached definitions. Everything works on the subway.

**Updates:** Content changes are deployed as app updates. The service worker
detects stale caches and refreshes in the background. Progress is keyed by
nodeId and survives content rewrites.

This pipeline means that adding a new lesson to learner is a single PR: one
MDX file, one cards.json file, and a nodeId registered in the skill tree. No
database migrations, no API changes, no deployment configuration. Content is
code.
