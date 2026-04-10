# 04 -- Skill Tree Design: Knowledge Graph Architecture

> Research doc 4 of 12 | learner app | 2026-04-09
>
> Purpose: Define the architecture of the skill tree -- the visual and
> structural backbone of learner. This document covers the game design
> heritage, graph theory, node granularity, branch architecture, state
> machines, visual design, unlock mechanics, progress visualization, and
> the TypeScript data model that ties it all together.

---

## Table of Contents

1. Skill Trees in Games and Learning
2. Graph Theory for Curriculum
3. Node Granularity
4. Branch Architecture
5. Node States and Progression
6. Visual Design Considerations
7. Unlock Mechanics
8. Progress Visualization
9. Data Model for the Skill Tree
10. Application: Recommended Architecture for Learner

---

## 1. Skill Trees in Games and Learning

### 1.1 The RPG Heritage

The concept of a skill tree originates in role-playing games, where character
progression is represented as a branching graph of abilities the player
unlocks over time. The mechanic works because it makes abstract growth --
"getting stronger" -- concrete and visible. Three games in particular
established patterns that directly inform learner's design.

**Diablo II (2000)** introduced the three-tab skill tree that became a genre
standard. Each character class had three branches (e.g., Sorceress: Fire,
Lightning, Cold), each branch had a linear chain of increasingly powerful
abilities, and each ability had a level requirement and a prerequisite
ability. The system was effective because it combined constraint (you cannot
skip ahead) with choice (you pick which branch to invest in). A critical
lesson from Diablo II: players feel ownership over their build. When a
player chooses to go deep into the Lightning tree instead of spreading
points across all three, they are making an identity-defining decision.
That sense of ownership drives engagement far beyond what a linear
curriculum can achieve.

**Path of Exile (2013)** took the opposite extreme. Its passive skill tree
contains over 1,300 nodes on a single massive web. Every character class
starts at a different position on the same graph and can theoretically
reach any node. The scale is intentionally overwhelming -- it signals
depth and creates a sense of awe. The tree uses clustering (groups of
related nodes form visible constellations), color coding (strength nodes
are red, dexterity nodes are green, intelligence nodes are blue), and
"keystone" nodes at critical junctions that fundamentally change how the
character plays. Lessons for learner: clustering prevents information
overload even at scale; keystones (our capstone projects) create
memorable milestone moments; and a single interconnected graph
communicates that knowledge is not siloed.

**Final Fantasy X's Sphere Grid (2001)** deserves mention for its physical
metaphor. The grid is literally a board -- the player moves a token across
it, activating nodes they pass through. It made progression feel tactile.
The grid also had "lock" nodes that required special items to pass, gating
access to powerful areas. This is analogous to our tier gates: you cannot
enter the next tier without completing the current one, and special
unlocks (capstones, cross-branch prerequisites) act as lock nodes.

### 1.2 Duolingo's Skill Tree

Duolingo is the most commercially successful learning app that uses a
skill tree. Their structure (as of the 2022 "path" redesign) is:

```
Course
  |-- Unit 1 (theme: greetings)
  |     |-- Section 1 (5-8 lessons)
  |     |-- Section 2 (5-8 lessons)
  |     |-- Section 3 (checkpoint quiz)
  |-- Unit 2 (theme: food)
  |     |-- Section 1
  |     ...
```

Units are linear -- you must complete Unit 1 before Unit 2. Within a unit,
sections are also linear. There is no branching, no choice, no
parallelism. This keeps the experience simple and eliminates decision
paralysis. But it also eliminates autonomy, which Self-Determination
Theory (see doc 01, Section 1.1) identifies as a core human need.
Duolingo compensates for this with other gamification mechanics (streaks,
hearts, leagues), but the lack of choice is a frequent user complaint,
especially among advanced learners.

**What Duolingo gets right:**
- Progress is always visible: you can see exactly where you are and how
  far you have to go.
- Each lesson is short (~5 minutes), reducing the barrier to starting.
- Spaced repetition is woven into the tree: completed sections
  periodically "crack" and need to be repaired (reviewed).

**What Duolingo gets wrong for developer learning:**
- Strictly linear progression does not suit a domain with genuinely
  parallel topics. A developer can learn databases and networking
  simultaneously without confusion.
- No branching means no specialization. A front-end developer and a
  DevOps engineer would follow the same path.

### 1.3 Khan Academy's Knowledge Map

Khan Academy (2012-era knowledge map, since replaced with a simpler tree)
presented its curriculum as a true graph: nodes were topics, edges were
prerequisites, and the learner could enter the graph at any point where
prerequisites were met. The map was mastery-based -- a node turned from
gray to blue to green as the learner demonstrated increasing proficiency
through exercises.

**What Khan Academy got right:**
- The graph structure honestly represents how knowledge is
  interconnected. "Fractions" feeds into "Ratios" which feeds into
  "Percentages" which feeds into "Statistics." This is not a tree -- it
  is a DAG.
- Mastery-based progression (not just completion-based) ensures the
  learner actually understood the material before moving on.
- Multiple entry points meant advanced learners could skip basics they
  already knew.

**What Khan Academy got wrong:**
- The knowledge map was eventually removed because it overwhelmed new
  users. Hundreds of nodes visible at once, many of them locked, created
  anxiety rather than motivation. (This is a direct lesson: we need zoom
  levels and progressive disclosure.)
- No gamification beyond the mastery meter. Points and badges existed but
  were disconnected from the graph. The graph felt academic, not playful.

### 1.4 The Key Insight

Skill trees work because they solve four problems simultaneously:

1. **Visibility**: The learner can see what they have done, where they are,
   and what comes next. This eliminates the "am I making progress?"
   anxiety that plagues self-taught developers.
2. **Structure**: Prerequisites are enforced, preventing the learner from
   attempting advanced topics before they have the foundations. This
   prevents frustration from premature complexity.
3. **Choice**: Branches allow the learner to specialize or explore based on
   interest. This satisfies the autonomy need from SDT.
4. **Satisfaction**: Each node completion is a micro-achievement. The visual
   transformation (locked -> available -> completed -> mastered) provides
   the dopamine hit that keeps learners returning. This connects to the
   variable ratio reinforcement patterns discussed in doc 01, Section 4.

The challenge is balancing structure with freedom. Too much structure
(Duolingo) kills autonomy. Too much freedom (Khan Academy's original map)
creates paralysis. Learner's design must find the middle ground: strong
structure within each branch, freedom to choose between branches.

---

## 2. Graph Theory for Curriculum

### 2.1 Directed Acyclic Graph (DAG)

The skill tree is, formally, a Directed Acyclic Graph (DAG). Each node
represents one learnable concept. Each directed edge represents a
prerequisite relationship: if an edge points from node A to node B, then
A must be completed before B can be started. The "acyclic" constraint
means there are no circular dependencies -- you cannot have a situation
where A requires B and B requires A.

```
VALID DAG:
  Variables --> Expressions --> Conditionals --> Loops --> Functions
       \                                                    |
        +------> Built-in DS <-----------------------------+

INVALID (cyclic):
  Closures --> Higher-Order Functions --> Closures  (cycle!)
```

A cycle would create a deadlock: the learner could never start either
node because each one requires the other. In practice, cycles arise when
two concepts are taught together in traditional courses (e.g., closures
and higher-order functions are often introduced in the same lecture). The
solution is to decide which concept is truly foundational and make the
other depend on it, or to merge them into a single node.

### 2.2 Why Acyclicity Matters

Beyond the obvious deadlock problem, acyclicity guarantees two properties
that are essential for the app:

1. **Topological ordering exists.** A topological sort of the DAG produces
   at least one valid sequence in which every node appears after all of
   its prerequisites. This means the app can always suggest a "next step"
   that is guaranteed to be unlocked. Without acyclicity, no such
   guarantee is possible.

2. **Progress is monotonic.** Once a node is completed, it never becomes
   locked again (barring an explicit "reset" feature). The learner's
   completed set only grows. This is psychologically important -- it
   means the learner never feels like they are going backward.

### 2.3 Hard vs Soft Prerequisites

Not all prerequisite relationships have equal strength. We distinguish two
types:

**Hard prerequisites** (solid edges in the graph) are enforced by the
unlock system. The node is literally locked -- grayed out, unclickable --
until all hard prerequisites are complete. Hard prerequisites should be
used sparingly and only for genuine conceptual dependencies where
attempting the node without the prerequisite would be incoherent. Example:
"Binary Search Trees" hard-depends on "Binary Trees" because the learner
cannot understand BST insertion without knowing what a tree node is.

**Soft prerequisites** (dotted edges) are recommended but not enforced.
The node is available to start, but the UI displays a warning: "This
topic builds on [X]. You might want to complete [X] first." Soft
prerequisites are appropriate when the concepts are related but the
learner could plausibly succeed without the prereq, especially if they
have prior experience. Example: "REST API Design" soft-depends on
"HTTP/HTTPS" -- a learner who has built APIs before can start the REST
node without formally completing the HTTP node.

**Design rules from doc 02** (Section 1.4) that carry forward:
- Maximum 2-3 hard prerequisites per node.
- Cross-branch dependencies are soft by default.
- If a would-be hard prerequisite creates a cycle, demote it to soft.

### 2.4 Cross-Branch Edges

Cross-branch edges connect nodes in different branches. They are the
most important structural element for communicating that knowledge is
interconnected, not siloed. But they are also the most dangerous source
of visual clutter and user confusion.

Examples from doc 02's dependency graph:
- `B10 (Transactions)` --> `S13 (CAP Theorem)`: databases inform systems design.
- `B2 (SQL Basics)` --> `X4 (Injection)`: you need SQL to understand SQL injection.
- `N4 (HTTP/HTTPS)` --> `X5 (XSS & CSRF)`: networking informs security.

Cross-branch edges are always soft in learner (per doc 02, rule 4). This
preserves branch independence -- a learner deeply focused on databases
should never be blocked by a networking node they have not completed. But
the connection should be visible, so the learner understands why the
topics are related and can choose to fill the gap.

### 2.5 Topological Ordering

A topological sort of the DAG produces a linear sequence where every node
appears after all its hard prerequisites. For a DAG with N nodes and E
edges, Kahn's algorithm runs in O(N + E) time:

```
1. Compute in-degree (number of incoming hard edges) for every node.
2. Add all nodes with in-degree 0 to a queue.
3. While the queue is not empty:
   a. Dequeue a node, add it to the sorted output.
   b. For each outgoing edge, decrement the target's in-degree.
   c. If the target's in-degree reaches 0, add it to the queue.
4. If the output contains all N nodes, the graph is a valid DAG.
   If not, a cycle exists (error).
```

In practice, we run topological sort at build time (when the curriculum
is compiled) to validate that no cycles exist and to generate the
"recommended order" displayed to learners who want guidance. The runtime
app does not need to re-sort -- it simply checks whether a node's hard
prerequisites are all in the user's completed set.

---

## 3. Node Granularity

### 3.1 The Granularity Spectrum

Node granularity is one of the most consequential design decisions in the
skill tree. Too coarse and the nodes feel like entire courses -- completing
one takes hours, progress feels slow, and the learner cannot tell whether
they are improving within a node. Too fine and the tree explodes into
hundreds of trivial nodes -- completing one feels meaningless, the tree
view becomes unwieldy, and the learner gets the impression that they have
"learned a lot" when in fact they have only memorized isolated fragments.

```
TOO COARSE                    SWEET SPOT                    TOO FINE
"Learn Python"                "Dictionaries"                "The += operator"
  - 100+ hours                 - 20-30 minutes               - 2 minutes
  - No progress signal         - Clear lesson + challenges   - No standalone value
  - No prerequisite clarity    - Tests one concept            - Hundreds per branch
```

### 3.2 The 15-30 Minute Rule

Doc 02 (Section 5.1) established the rule: each node should be learnable
in 15-30 minutes. This is not arbitrary. It is derived from three
constraints:

1. **Session length research.** Dempster (1988) found that distributed
   practice sessions of 20-30 minutes produced better retention than
   longer sessions, supporting the finding from spaced repetition research
   (doc 00, Section 2). A node that can be completed in one focused
   session aligns with optimal study intervals.

2. **Mobile session data.** Duolingo reports that their average session
   length is 7-10 minutes. Khan Academy reports 15-20 minutes. For a
   coding-focused app (which requires more concentrated effort than
   vocabulary drills), 15-30 minutes is realistic for a single concept.

3. **Challenge time.** Each node includes 1-3 coding challenges. A
   well-scoped coding challenge takes 5-15 minutes to complete. With a
   10-minute lesson preceding it, the total lands in the 15-30 minute
   range.

### 3.3 Node Content Structure

Every node in the tree follows a consistent structure:

```
Node: "Dictionaries" (Python branch, Tier 1)
  |
  |-- Lesson (1 per node, 8-12 minutes)
  |     |-- Creation: dict literals, dict(), fromkeys()
  |     |-- Access: bracket notation, .get(), KeyError handling
  |     |-- Methods: .keys(), .values(), .items(), .update(), .pop()
  |     |-- Iteration: for key in dict, for k,v in dict.items()
  |     |-- Comprehensions: {k: v for k, v in iterable}
  |
  |-- Challenges (1-3 required, 0-2 bonus)
  |     |-- Required #1: Build a frequency counter
  |     |     (given a list of words, return a dict of counts)
  |     |-- Required #2: Merge two dicts with conflict resolution
  |     |     (given two dicts, merge them; on key collision, sum values)
  |     |-- Bonus #1: Nested dict access
  |     |     (given a deeply nested dict, write a safe-access function)
  |
  |-- Review Cards (2-5 per node)
        |-- Card 1: "What does dict.get(key, default) return if key is missing?"
        |-- Card 2: "Write a dict comprehension that inverts keys and values."
        |-- Card 3: "What is the time complexity of dict[key] lookup?"
```

**Lesson**: A focused explanation of the concept with inline code examples.
Not a textbook chapter -- concise, practical, and opinionated. Lessons
should take 8-12 minutes to read and understand. They include runnable
code snippets the learner can modify in an embedded editor.

**Challenges**: The primary assessment mechanism. Required challenges must
be passed to complete the node. Bonus challenges award extra XP and
contribute to the "Mastered" state but are not required for progression.
Challenge formats are defined in doc 02, Section 6.

**Review Cards**: Spaced repetition cards generated from the node's
content. These are fed into the SRS engine (doc 00, Section 2) and
resurface at calculated intervals. Cards test recall, not recognition --
they require the learner to produce an answer, not select from options.

### 3.4 Splitting Oversized Nodes

When a concept has more than 5 subtopics or the estimated learning time
exceeds 30 minutes, the node should be split. Doc 02 (Section 5.2) showed
this with the "Lists" example: Lists-Basics (creation, indexing, methods)
and Lists-Patterns (iteration, comprehensions). The split should follow
a complexity gradient: basics first, patterns second. The two resulting
nodes have a hard prerequisite edge between them (Basics -> Patterns).

Splitting guidelines:
- Prefer splitting by complexity (basics vs advanced) over splitting by
  arbitrary subtopic boundaries.
- The split must produce two nodes that each have standalone value. If
  one half is meaningless without the other, merge them back and accept
  a longer node.
- Each split node still gets its own challenges and review cards.

---

## 4. Branch Architecture

### 4.1 The Ten Branches

Learner's skill tree has 10 branches, as defined in doc 02. Each branch
corresponds to a domain of developer knowledge:

| Branch           | Code Prefix | Node Count | Focus                         |
|------------------|-------------|------------|-------------------------------|
| Python           | PY          | ~50        | Language + ecosystem          |
| TypeScript       | TS          | ~50        | Language + ecosystem          |
| React / Next.js  | RX          | ~35        | UI framework + SSR            |
| C#               | CS          | ~50        | Language + .NET ecosystem     |
| DS&A             | D           | 25         | Algorithms + data structures  |
| Databases        | B           | 16         | SQL, NoSQL, design            |
| Systems Design   | S           | 17         | Architecture + distributed    |
| Networking       | N           | 11         | Protocols + infrastructure    |
| Security         | X           | 12         | App security + crypto         |
| DevOps           | O           | 16         | CI/CD, containers, cloud      |
| **Total**        |             | **~282**   |                               |

### 4.2 Tiered Progression Within Branches

Each branch is organized into 3-6 tiers of increasing difficulty, mapping
to the ACM/IEEE tier structure from doc 02:

```
Tier 1 (Foundations)     -- Core concepts everyone needs.
                            Bloom's levels 1-3. Unlocked when branch is available.

Tier 2 (Intermediate)   -- Deeper mechanics, analysis, optimization.
                            Bloom's levels 3-5. Unlocked after completing all T1 nodes.

Tier 3 / Elective        -- Advanced, specialized, or niche topics.
(Advanced)                  Bloom's levels 4-6. Unlocked after completing all T2 nodes.
```

Within each tier, nodes follow a linear or near-linear sequence. Tier 1
of the Python branch, for example:

```
PY-T1-01: Variables & Types
  |
  v
PY-T1-02: Expressions & Operators
  |
  v
PY-T1-03: Conditionals
  |
  v
PY-T1-04: Loops
  |
  v
PY-T1-05: Functions
  |
  v
PY-T1-06: Built-in Data Structures (Lists)
  |
  v
PY-T1-07: Built-in Data Structures (Dicts, Sets, Tuples)
  |
  v
PY-T1-08: String Manipulation
  |
  v
PY-T1-09: Error Handling
  |
  v
PY-T1-10: [Tier 1 Capstone: Build a CLI tool]
```

The capstone at the end of each tier is a larger project that integrates
all concepts from that tier. It serves as both a gate (must pass to
unlock Tier 2) and a milestone celebration.

### 4.3 Parallel Branch Exploration

Tiers within a branch are linear, but branches themselves can be explored
in parallel. A learner who has completed Python Tier 1 can start
TypeScript Tier 1, DS&A Tier 1, and Databases Tier 1 simultaneously.
This is critical for two reasons:

1. **Autonomy**: The learner chooses what to study based on interest or
   career goals, not a rigid global sequence.
2. **Variety**: Switching between branches prevents burnout. If a learner
   is stuck on a DS&A problem, they can switch to a Databases lesson and
   come back refreshed.

The parallel model means the learner's "frontier" -- the set of available
nodes -- grows as they complete more Tier 1 content. Early on, only a
handful of nodes are available. After completing Programming Fundamentals
Tier 1, the frontier expands dramatically. This creates a natural sense
of the world "opening up," similar to how open-world games gate regions
behind story progression.

### 4.4 Branch Entry Prerequisites

Some branches require prerequisites from other branches before they can
be started. These are documented in doc 02 (Section 7.2):

```
Branch              | Entry Prerequisite
--------------------|----------------------------------------------------
Python              | None (available from day one)
TypeScript          | Programming Fundamentals T1 complete
C#                  | Programming Fundamentals T1 complete
React / Next.js     | TypeScript T1 complete + Programming Fundamentals T2
DS&A                | Programming Fundamentals T1 complete
Databases           | F7 (Built-in Data Structures) complete
Systems Design      | Programming Fundamentals T2 complete
Networking          | None (available from day one)
Security            | Programming Fundamentals T2 complete
DevOps              | O1-O2 available from day one; full branch after F1-F9
```

These entry prerequisites are the only hard cross-branch gates in the
system. Once a branch is unlocked, all progression within it is governed
by within-branch prerequisites only.

---

## 5. Node States and Progression

### 5.1 The Five States

Every node in the skill tree exists in exactly one of five states at any
given time. These states form a strict linear progression -- a node can
only move forward through the states, never backward (with one exception
noted below).

**Locked**: The node's hard prerequisites have not been met. Visually, the
node is grayed out, reduced in opacity (~40%), and displays a small lock
icon. The node's title is visible (so the learner can see what is coming)
but its content is inaccessible. Tapping a locked node shows a tooltip:
"Complete [prerequisite names] to unlock this topic."

**Available**: All hard prerequisites are met, but the learner has not
started this node. The node pulses with a subtle glow animation (1s
cycle, 10% opacity variation) to draw attention. The glow color matches
the branch color. This is the "call to action" state -- the tree is
saying "you can do this next." When multiple nodes are available, the
learner chooses which to start, exercising autonomy.

**In Progress**: The learner has opened the lesson or attempted at least
one challenge. The node displays a partially filled ring showing
completion percentage. The percentage is calculated as:

```
progress = (lessons_read + required_challenges_passed) /
           (total_lessons + total_required_challenges)
```

A node with 1 lesson and 2 required challenges has 3 completion units.
Reading the lesson fills the ring to 33%. Passing the first challenge
brings it to 67%. Passing the second challenge brings it to 100% and
transitions the node to Completed.

**Completed**: All lessons have been read and all required challenges have
been passed. The node displays a solid fill in the branch color with a
white checkmark overlay. This state unlocks downstream nodes -- any node
whose only remaining unmet hard prerequisite was this node will transition
from Locked to Available.

**Mastered**: All content has been consumed at the highest level. The
criteria are:
- All required challenges passed (already satisfied by Completed).
- All bonus challenges passed.
- Review card mastery: the node's review cards have a >90% success rate
  over the most recent 5 reviews per card. This means the learner has
  not merely completed the content but retained it.
- Capstone project passed (if the node is a tier-ending capstone).

The mastered state displays a gold border and a star icon. It is purely
aspirational -- mastery is never required for progression. It exists for
completionists and for learners who want proof of deep understanding.

### 5.2 State Transition Rules

```
  +--------+        +----------+        +-----------+        +-----------+        +----------+
  | Locked | -----> | Available | -----> | In        | -----> | Completed | -----> | Mastered |
  +--------+        +----------+        | Progress  |        +-----------+        +----------+
                                        +-----------+
```

**Locked -> Available**: Triggered automatically when all hard
prerequisites enter the Completed (or Mastered) state. The transition is
instantaneous and generates a notification: "New topic unlocked:
[node title]!" Multiple nodes can become available simultaneously if
they share the same prerequisite.

**Available -> In Progress**: Triggered when the learner opens the node's
lesson for the first time or attempts the first challenge. This is a
user-initiated transition -- no automation.

**In Progress -> Completed**: Triggered when the final required challenge
is passed. The app plays a completion animation (node fills with color,
checkmark appears, confetti particles if this is the first completion of
the session). XP is awarded at this moment (not incrementally per
challenge). If this node is a prerequisite for other nodes, those nodes
transition from Locked to Available.

**Completed -> Mastered**: Triggered when all mastery criteria are met.
Unlike the other transitions, this one often happens gradually -- the
learner might complete the bonus challenges on day one but not achieve
>90% review card mastery until weeks later, after sufficient spaced
repetition cycles. The transition is celebrated with a special animation
(gold border radiates outward, star icon appears with a gleam effect).

### 5.3 No Backward Transitions

Once a node is completed, it stays completed. We do not implement a
"decay" or "cracking" mechanic (unlike Duolingo's approach where
completed nodes degrade over time). The rationale:

- Decay mechanics create anxiety. Learners who take a break return to
  find their progress has "decayed," which feels punishing rather than
  motivating. This violates the Competence need from SDT.
- Spaced repetition handles retention separately. The review card system
  (doc 00) ensures the learner revisits material at optimal intervals.
  The skill tree's job is to show structural progress, not retention.
- The exception: if a learner explicitly resets their progress (e.g.,
  wants to redo a node from scratch to practice), they can manually
  transition a node back to Available. This is a deliberate user action,
  not an automatic decay.

---

## 6. Visual Design Considerations

### 6.1 The Display Problem: 282 Nodes

Displaying 282 nodes on a single screen is impossible without creating
visual noise that overwhelms the learner. Khan Academy learned this the
hard way -- their original knowledge map showed hundreds of nodes at once
and was eventually removed because new users found it intimidating. Path
of Exile's 1,300+ node tree works because its audience (hardcore RPG
players) expects and enjoys that complexity. Our audience -- developers
learning to code -- falls between these extremes.

The solution is **progressive disclosure through zoom levels**.

### 6.2 Three Zoom Levels

**Level 1: Branch Overview (zoomed out)**

The default view when the learner opens the skill tree. Shows 10 branches
radiating from a central hub. Each branch is represented as a single
colored arm with:
- Branch name and icon
- Progress bar (% of nodes completed)
- Node count: "12/25 nodes"
- Visual indicator of current tier (the arm extends further as tiers
  are unlocked)

No individual nodes are visible at this level. The view communicates
"these are the domains you can learn" and "here is how far along you are
in each one." Tapping a branch zooms into Level 2.

```
                    Networking
                       |
            Security   |   DevOps
               \       |       /
                \      |      /
     Systems --- [  LEARNER  ] --- DS&A
                /      |      \
               /       |       \
          React        |    Databases
                       |
                 Python   TypeScript
                    \   |   /
                     \  |  /
                      C#
```

**Level 2: Branch Detail (mid zoom)**

Shows all nodes within a single branch, organized by tier. Tiers are
displayed as horizontal bands or rows, with Tier 1 at the top (or left)
and higher tiers below (or to the right). Each node is a circle with:
- Title (truncated if long)
- State indicator (color fill, lock icon, checkmark, gold star)
- Connection lines to prerequisites within the branch

Cross-branch prerequisite indicators appear as small icons at the edge
of the view, pointing toward other branches. Tapping a node opens
Level 3.

**Level 3: Node Detail (zoomed in)**

A bottom sheet (mobile) or side panel (desktop) showing full details for
a single node:
- Title and branch
- Bloom's level badge
- State and progress ring
- Learning objective
- Lesson content (or link to start lesson)
- Challenge list with completion status
- Review card count and mastery percentage
- Hard and soft prerequisites (with links to those nodes)
- "Related concepts" in other branches
- XP value and any achievement triggers

### 6.3 Color Coding

Each branch has a distinct color, used consistently across the tree view,
progress bars, lesson screens, and achievement badges. The palette must
work for color-blind users (verified against deuteranopia, protanopia,
and tritanopia simulations).

| Branch          | Color        | Hex       | Rationale                           |
|-----------------|--------------|-----------|-------------------------------------|
| Python          | Blue         | #3572A5   | GitHub's Python language color      |
| TypeScript      | Cyan         | #3178C6   | TypeScript's official brand color   |
| React / Next.js | Teal         | #20B2AA   | Close to React's brand cyan         |
| C#              | Purple       | #9B4DCA   | Visual Studio / .NET association    |
| DS&A            | Orange       | #E67E22   | Warm, stands out from cool tones    |
| Databases       | Green        | #27AE60   | Data / growth association           |
| Systems Design  | Red          | #E74C3C   | Architecture / structure            |
| Networking      | Indigo       | #5C6BC0   | Network / connectivity              |
| Security        | Dark Red     | #C0392B   | Warning / protection association    |
| DevOps          | Amber        | #F39C12   | Operations / tooling                |

### 6.4 Connection Lines

Visual connections between nodes communicate the prerequisite structure:

- **Within-branch prerequisites**: Solid lines in the branch color. These
  are the primary structural connections and should be visually
  prominent.
- **Cross-branch prerequisites (soft)**: Dotted lines in a neutral gray.
  These are secondary and should be visually subtle to avoid clutter.
  Only shown at Level 2 zoom, and capped at 3 visible connections per
  node (additional connections visible on hover/tap per doc 02,
  Section 7.5).
- **Tier boundaries**: A subtle horizontal divider or color gradient shift
  separates tiers within a branch. The divider includes a label ("Tier 2:
  Intermediate") and, if the tier is locked, a lock icon with the
  unlock condition.

### 6.5 Mobile Considerations

The skill tree must work on mobile screens (minimum 375px width). Key
interactions:

- **Pinch-to-zoom**: Smoothly transitions between the three zoom levels.
  The view centers on the pinch origin point.
- **Tap-to-select**: Tapping a node at Level 2 opens the Level 3 detail
  sheet. Tapping a branch at Level 1 zooms into Level 2.
- **Bottom sheet**: Node details appear in a draggable bottom sheet that
  covers the lower 60% of the screen. The tree view remains visible
  above, dimmed, providing spatial context.
- **Swipe between branches**: At Level 2, swiping left/right navigates to
  adjacent branches. The branch order follows a consistent sequence
  (e.g., alphabetical or by difficulty).

### 6.6 Design Inspiration

The visual design should take the best from two extremes:

From **Path of Exile's passive tree**: the sense of scale (you can see how
vast the knowledge domain is), the satisfaction of watching nodes fill in
across a large graph, and the clustering technique (related nodes form
visible groups). Avoid: the overwhelming density and the expectation of
prior expertise.

From **Duolingo's path**: the clarity of progression (always obvious what
to do next), the celebration of completion (confetti, level-up
animations), and the simplicity of visual encoding (just circles on a
path). Avoid: the lack of branching and the linear rigidity.

The result should feel like a clean, modern UI framework rendering an
RPG skill tree -- not a game asset, and not a dry academic graph.

---

## 7. Unlock Mechanics

### 7.1 Within-Branch Unlocks

The most common unlock is completing one node to unlock the next node in
the same branch. This is the backbone of progression and happens dozens
of times per branch. The unlock is immediate and visually animated:
- The newly available node transitions from gray to glowing.
- A brief notification appears: "Unlocked: [node title]"
- If the learner has notification sounds enabled, a soft chime plays.

### 7.2 Tier Gate Unlocks

Completing all Tier 1 nodes in a branch unlocks Tier 2. This is a
milestone moment and receives a larger celebration:
- A tier completion banner appears: "Python Tier 1 Complete!"
- The Tier 2 section of the branch visually "unfolds" or "reveals" with
  an animation.
- A capstone challenge (if present at the tier boundary) becomes
  available.
- XP bonus for tier completion (e.g., 500 XP on top of individual node
  XP).

### 7.3 Cross-Branch Unlocks

Completing prerequisites from one branch may make nodes available in
another branch. Because cross-branch prerequisites are soft by default,
these unlocks are informational rather than gating:
- A notification appears: "You completed [node A in Branch X]. This
  helps with [node B in Branch Y]."
- The recommended-next algorithm (Section 7.5) boosts the priority of
  nodes whose soft prerequisites are now met.

The exception is branch entry prerequisites (Section 4.4), which are hard
gates. Completing Programming Fundamentals T1 unlocks the DS&A, Databases,
and other branches. This unlock is a major milestone:
- Multiple new branches appear on the Level 1 view.
- An achievement is triggered (e.g., "Explorer: Unlocked 3 new branches").
- The visual expansion of the tree communicates growing competence.

### 7.4 Special Unlocks

**Capstone projects** are unlocked at tier milestones and at the end of
branches. They are larger projects (1-3 hours) that integrate multiple
concepts. Completing a capstone awards a significant XP bonus and a
unique achievement badge.

**Achievement unlocks** are triggered by tree-wide progress milestones:

| Achievement       | Condition                                              | Reward     |
|-------------------|--------------------------------------------------------|------------|
| First Steps       | Complete first node in any branch                      | 100 XP     |
| Polyglot          | Complete T1 in Python + TypeScript + C#                | 500 XP     |
| Full Stack        | Complete T1 in React + Databases + DevOps              | 500 XP     |
| Algorithm Master  | Master all T2 nodes in DS&A                            | 750 XP     |
| Security Champion | Master all nodes in Security                           | 1000 XP    |
| Completionist     | Complete all 282 nodes                                 | 5000 XP    |
| True Mastery      | Master all 282 nodes                                   | 10000 XP   |

### 7.5 The "Recommended Next" Algorithm

When the learner finishes a node and returns to the tree view, the app
highlights 1-3 nodes as "recommended next." The algorithm considers:

1. **Hard prerequisites met**: Only recommend available nodes (never
   locked ones).
2. **Soft prerequisites met**: Prefer nodes where all soft prerequisites
   are also complete. This maximizes the chance the learner will succeed.
3. **Continuation preference**: If the learner just completed a node in
   Branch X, prefer the next node in Branch X (momentum).
4. **Adaptive difficulty**: If the learner has been struggling (low
   challenge pass rate), prefer easier nodes (lower Bloom's level, same
   or lower tier). If the learner has been breezing through, prefer
   harder nodes or suggest branching out.
5. **Branch diversity**: If the learner has been in one branch for 5+
   consecutive nodes, gently suggest a different branch: "You've been
   doing great in Python. Want to try some DS&A?"
6. **Time-based**: If the learner has completed nodes that were covered a
   while ago (7+ days) and review cards for those nodes are due, suggest
   a review session rather than a new node.

The recommendation is a suggestion, not a requirement. The learner can
always ignore it and choose any available node.

---

## 8. Progress Visualization

### 8.1 Branch Progress Bars

Each branch displays a progress bar on the Level 1 tree view. The bar
shows percentage of nodes completed (not mastered -- mastery is a
separate indicator). The bar is segmented by tier:

```
Python: [████████████░░░░░░░░░░░░░░░░░░] 40%
         T1 (complete)  T2 (in progress)  T3 (locked)
```

The segmentation communicates not just overall progress but where the
learner is within the branch's difficulty curve.

### 8.2 Overall Completion

A single number on the main tree view: "87 / 282 nodes completed (31%)."
This is the most straightforward progress metric. A circular progress
ring around the central "Learner" hub on the Level 1 view fills as the
percentage increases.

### 8.3 Time Investment Tracking

The session engine (to be detailed in a future research doc) tracks time
spent per branch. This is displayed on the branch detail view:

```
Python: 42 hours invested | 38 nodes completed | 1.1 hrs/node avg
DS&A:   28 hours invested | 18 nodes completed | 1.6 hrs/node avg
```

This data serves two purposes: it validates the learner's effort (you have
put in real time) and it helps the learner calibrate expectations (DS&A
takes longer per node than Python).

### 8.4 Activity Heatmap

A GitHub-contribution-style heatmap shows daily activity over the past
52 weeks. Each cell represents one day, and the color intensity represents
the amount of activity (nodes completed, challenges attempted, review
cards practiced). The heatmap is accessible from the learner's profile
page.

The heatmap serves a different purpose than streaks (doc 01). Streaks
measure consistency (did you show up today?). The heatmap measures
volume over time (how much did you do each day?). Both are valuable:
- Streaks motivate daily engagement.
- The heatmap rewards high-effort days and provides a long-term view of
  commitment.

### 8.5 Strengths and Weaknesses

The app analyzes challenge performance across branches to identify the
learner's strongest and weakest areas:

```
Strongest: Python (94% challenge pass rate, 12 nodes mastered)
Weakest:   DS&A (67% challenge pass rate, 2 nodes mastered)
```

This is displayed on the profile page and optionally factored into the
recommended-next algorithm (Section 7.5). The learner can choose to
lean into strengths or shore up weaknesses -- both are valid strategies,
and the app should support both without judgment.

The strength/weakness calculation uses:
- Challenge pass rate (primary signal)
- Average attempts per challenge (more attempts = more struggle)
- Review card retention rate (from SRS data)
- Time per node relative to branch average

---

## 9. Data Model for the Skill Tree

### 9.1 Core Types

The skill tree data model is defined in TypeScript. These types are the
source of truth for the curriculum, the rendering engine, and the
persistence layer.

```typescript
// Branch identity
type BranchId =
  | 'python' | 'typescript' | 'react' | 'csharp'
  | 'dsa' | 'databases' | 'systems' | 'networking'
  | 'security' | 'devops';

// Tier within a branch
type Tier = 1 | 2 | 3;

// Bloom's taxonomy level
type BloomLevel = 1 | 2 | 3 | 4 | 5 | 6;

// Node state (user-specific, stored in user profile)
type NodeState = 'locked' | 'available' | 'in_progress' | 'completed' | 'mastered';

// Prerequisite edge
interface Prerequisite {
  nodeId: string;       // ID of the prerequisite node
  type: 'hard' | 'soft';
}

// A single node in the skill tree
interface SkillNode {
  id: string;                    // e.g., "PY-T1-07" or "D-T2-09"
  title: string;                 // e.g., "Dictionaries"
  branch: BranchId;
  tier: Tier;
  bloomLevel: BloomLevel;
  learningObjective: string;     // Bloom's-verb sentence
  estimatedMinutes: number;      // 15-30 typically
  xpValue: number;               // T1=100, T2=200, T3=300
  prerequisites: Prerequisite[];
  lessonId: string;              // Reference to lesson content
  challengeIds: string[];        // References to challenge definitions
  reviewCardIds: string[];       // References to SRS card definitions
  relatedNodes: string[];        // Cross-branch "see also" connections
  isCapstone: boolean;           // True for tier-ending capstone projects
  position: { x: number; y: number }; // Visual position on the tree
}

// Branch metadata
interface Branch {
  id: BranchId;
  name: string;                  // Display name: "Data Structures & Algorithms"
  shortName: string;             // "DS&A"
  color: string;                 // Hex color: "#E67E22"
  icon: string;                  // Icon identifier
  description: string;
  nodeIds: string[];             // Ordered list of all node IDs in this branch
  tierBoundaries: {              // Which node indices mark tier transitions
    tier1End: number;
    tier2End: number;
  };
  entryPrerequisites: Prerequisite[];  // Branch-level unlock conditions
}
```

### 9.2 User Progress Types

```typescript
// Per-node progress (stored per user)
interface NodeProgress {
  nodeId: string;
  state: NodeState;
  lessonRead: boolean;
  challengeResults: {
    challengeId: string;
    passed: boolean;
    attempts: number;
    bestScore: number;          // 0-100
    lastAttemptAt: string;     // ISO timestamp
  }[];
  reviewCardMastery: number;   // 0-100, rolling average
  startedAt: string | null;    // ISO timestamp
  completedAt: string | null;
  masteredAt: string | null;
  timeSpentMinutes: number;    // Cumulative
}

// Branch-level aggregation (computed, not stored)
interface BranchProgress {
  branchId: BranchId;
  nodesCompleted: number;
  nodesMastered: number;
  totalNodes: number;
  currentTier: Tier;
  tierUnlocked: Tier;          // Highest tier unlocked
  challengePassRate: number;   // 0-100
  totalTimeMinutes: number;
  completionPercent: number;   // 0-100
}

// Overall progress (computed, not stored)
interface OverallProgress {
  totalNodesCompleted: number;
  totalNodesMastered: number;
  totalNodes: number;
  branchesUnlocked: number;
  totalBranches: number;
  totalXpEarned: number;
  totalTimeMinutes: number;
  strongestBranch: BranchId;
  weakestBranch: BranchId;
  currentStreak: number;       // Days
  longestStreak: number;
}
```

### 9.3 The Curriculum Index

The curriculum is defined in a master index file that the app loads at
startup. This file is the single source of truth for the skill tree
structure.

```typescript
// curriculum/index.ts

import { SkillNode, Branch } from './types';

export const branches: Branch[] = [
  {
    id: 'python',
    name: 'Python',
    shortName: 'PY',
    color: '#3572A5',
    icon: 'python',
    description: 'Python language fundamentals and ecosystem',
    nodeIds: ['PY-T1-01', 'PY-T1-02', /* ... */ 'PY-T3-05'],
    tierBoundaries: { tier1End: 9, tier2End: 22 },
    entryPrerequisites: [],  // Available from day one
  },
  {
    id: 'react',
    name: 'React / Next.js',
    shortName: 'RX',
    color: '#20B2AA',
    icon: 'react',
    description: 'UI framework, component architecture, and server-side rendering',
    nodeIds: ['RX-T1-01', 'RX-T1-02', /* ... */ 'RX-T3-08'],
    tierBoundaries: { tier1End: 11, tier2End: 25 },
    entryPrerequisites: [
      { nodeId: 'TS-T1-10', type: 'hard' },  // TypeScript T1 complete
      { nodeId: 'F-T2-06', type: 'hard' },    // Prog Fundamentals T2
    ],
  },
  // ... remaining branches
];

export const nodes: SkillNode[] = [
  {
    id: 'PY-T1-01',
    title: 'Variables & Types',
    branch: 'python',
    tier: 1,
    bloomLevel: 2,
    learningObjective: 'Explain Python variable assignment, primitive types, and type coercion',
    estimatedMinutes: 20,
    xpValue: 100,
    prerequisites: [],
    lessonId: 'lesson-py-variables',
    challengeIds: ['ch-py-vars-01', 'ch-py-vars-02'],
    reviewCardIds: ['rc-py-vars-01', 'rc-py-vars-02', 'rc-py-vars-03'],
    relatedNodes: ['TS-T1-01', 'CS-T1-01'],  // Same concept in other languages
    isCapstone: false,
    position: { x: 0, y: 0 },
  },
  // ... remaining 281 nodes
];

// Build adjacency list for efficient traversal
export const adjacencyList: Map<string, string[]> = new Map();
for (const node of nodes) {
  for (const prereq of node.prerequisites) {
    const existing = adjacencyList.get(prereq.nodeId) ?? [];
    existing.push(node.id);
    adjacencyList.set(prereq.nodeId, existing);
  }
}
```

### 9.4 State Computation

Node states are computed from the user's progress data and the
curriculum's prerequisite graph. The computation is deterministic: given
a user's set of completed nodes and node progress records, the state of
every node can be derived.

```typescript
function computeNodeState(
  nodeId: string,
  curriculum: SkillNode[],
  userProgress: Map<string, NodeProgress>
): NodeState {
  const node = curriculum.find(n => n.id === nodeId);
  if (!node) throw new Error(`Unknown node: ${nodeId}`);

  const progress = userProgress.get(nodeId);

  // Check mastery
  if (progress?.state === 'completed') {
    const allBonusPassed = node.challengeIds.every(cId => {
      const result = progress.challengeResults.find(r => r.challengeId === cId);
      return result?.passed;
    });
    if (allBonusPassed && progress.reviewCardMastery >= 90) {
      return 'mastered';
    }
    return 'completed';
  }

  // Check in-progress
  if (progress?.lessonRead || (progress?.challengeResults.length ?? 0) > 0) {
    return 'in_progress';
  }

  // Check if prerequisites are met
  const hardPrereqs = node.prerequisites.filter(p => p.type === 'hard');
  const allMet = hardPrereqs.every(p => {
    const prereqProgress = userProgress.get(p.nodeId);
    return prereqProgress?.state === 'completed'
        || prereqProgress?.state === 'mastered';
  });

  return allMet ? 'available' : 'locked';
}
```

This function runs on every tree render. With 282 nodes, the computation
completes in <1ms -- there is no performance concern.

---

## 10. Application: Recommended Architecture for Learner

### 10.1 Summary of Design Decisions

| Decision                    | Choice                                              | Rationale                                          |
|-----------------------------|-----------------------------------------------------|----------------------------------------------------|
| Graph type                  | DAG with hard + soft edges                          | Enforces ordering without over-constraining        |
| Node granularity            | 15-30 minutes per node                              | Matches session length research, mobile sessions   |
| Node content                | 1 lesson + 1-3 challenges + 2-5 review cards        | Tests understanding, builds retention              |
| Branch count                | 10 branches, ~282 total nodes                       | Comprehensive CS coverage at practical depth       |
| Tier structure              | 3 tiers per branch (T1/T2/T3)                       | Maps to ACM/IEEE and Bloom's levels                |
| Within-branch progression   | Linear within tiers                                 | Clear path, no decision paralysis                  |
| Between-branch progression  | Parallel exploration allowed                        | Autonomy, variety, prevents burnout                |
| Cross-branch deps           | Soft by default                                     | Preserves branch independence                      |
| Node states                 | 5 states: locked/available/in_progress/completed/mastered | Clear, non-reversible progression          |
| Visual layout               | Radial tree with 3 zoom levels                      | Progressive disclosure prevents overwhelm          |
| State persistence           | Progress stored per-user; states computed from data | Deterministic, no stale state                      |

### 10.2 Data Flow

```
curriculum/index.ts          (static, compiled into app)
       |
       v
computeNodeState()           (runs on each render)
       |
       +-- reads: user progress from local storage / API
       +-- reads: prerequisite graph from curriculum
       |
       v
TreeView component           (renders based on computed states)
       |
       +-- Level 1: BranchOverview (10 branches, progress bars)
       +-- Level 2: BranchDetail (nodes, connections, states)
       +-- Level 3: NodeDetail (lesson, challenges, reviews)
```

### 10.3 Connection to XP / Progression Systems

The skill tree is the structural backbone, but XP and progression systems
provide the motivational layer on top. The connections:

- **Node completion awards XP**: T1 = 100 XP, T2 = 200 XP, T3 = 300 XP.
  Mastery awards a 50% bonus.
- **Tier completion awards bonus XP**: 500 XP per tier milestone.
- **XP feeds into the global level system**: The learner's level is
  derived from total XP earned. Levels unlock cosmetic rewards (tree
  themes, profile badges) but never gate content -- content gating is
  exclusively handled by the skill tree's prerequisite system.
- **Achievements are triggered by tree events**: completing a node,
  mastering a branch, unlocking all branches. These are defined in the
  achievement system (doc 03) and read the tree state to determine
  eligibility.
- **Streaks interact with the tree**: the daily streak counter
  increments when the learner completes at least one lesson, challenge,
  or review session. The streak is maintained independently of tree
  progression but is displayed alongside it.

### 10.4 Validation at Build Time

The curriculum index must pass validation before the app is built:

1. **DAG validation**: Run topological sort on all hard-prerequisite
   edges. If a cycle is detected, the build fails with a clear error
   message identifying the cycle.
2. **Reference integrity**: Every `lessonId`, `challengeId`, and
   `reviewCardId` in a node must correspond to an existing content file.
   Missing references fail the build.
3. **Prerequisite existence**: Every `nodeId` referenced in a
   `prerequisites` array must exist in the nodes list.
4. **Node count consistency**: The sum of all branch `nodeIds` arrays
   must equal the total nodes array length. No orphan nodes.
5. **Tier boundary validation**: `tierBoundaries` indices must be valid
   and nodes at those indices must be capstones (if applicable).

These validations run as a CI check, catching curriculum errors before
they reach users.

### 10.5 Future Considerations

Several features are deferred to future research docs but should be
compatible with this architecture:

- **Adaptive difficulty**: Adjusting challenge difficulty based on
  performance history. The data model already captures attempts and
  scores per challenge, providing the input signal.
- **Custom paths**: Allowing learners to create and share custom
  sequences through the tree. The DAG structure supports any valid
  topological ordering.
- **Content versioning**: When lessons or challenges are updated, the
  learner's progress should be preserved. Node IDs are stable;
  lesson/challenge content can be versioned independently.
- **Multiplayer features**: Shared tree views (see a friend's progress),
  collaborative capstones, and competitive leaderboards per branch.

---

## References

- Diablo II (Blizzard North, 2000): Three-branch skill tree with level
  requirements and prerequisite abilities. Established the modern RPG
  skill tree pattern.
- Path of Exile (Grinding Gear Games, 2013): 1,300+ node passive skill
  tree. Demonstrated that massive graphs can be navigable through
  clustering and color coding.
- Final Fantasy X (Square, 2001): Sphere Grid system. Physical movement
  metaphor for character progression.
- Duolingo skill tree (2012-2023, redesigned as "path" in 2022): Linear
  skill tree with units and sections. Most commercially successful
  gamified learning tree.
- Khan Academy knowledge map (2012-2016): DAG-based curriculum map with
  mastery-based node states. Removed due to user overwhelm.
- Cormen, T.H. et al. (2009). Introduction to Algorithms (3rd ed.).
  Topological sort (Kahn's algorithm), DAG properties.
- Dempster, F.N. (1988). "The spacing effect: A case study in the
  failure to apply the results of psychological research." American
  Psychologist, 43(8), 627-634. Optimal study session duration.
- ACM/IEEE CS2013: Tier structure and knowledge area organization that
  informed branch and tier design.

---

*Next document: 05 -- Challenge Engine (coding challenges, auto-grading,
difficulty calibration, test case design)*
