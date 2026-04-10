# Learner — Gamified Developer Learning Platform

## Vision
A comprehensive, gamified app to teach software development from zero to advanced — covering Python, C#, React, TypeScript, data structures, systems design, databases, networking, security, and DevOps. Designed for **daily commute use** (NYC subway, ~30 min each way, no internet underground). Must work offline, feel polished, and be something you'd actually open every day.

---

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | Next.js 16 | App Router, RSC for lesson content, API routes for AI |
| UI | React 19 + Tailwind CSS 4 | Rapid mobile-first responsive design |
| State | Zustand 5 + persist middleware | localStorage for solo, upgradable to backend sync |
| Language | TypeScript 5 | Type safety for complex curriculum data model |
| Code Editor | Monaco Editor (`@monaco-editor/react`) | VS Code's editor in-browser, multi-language |
| Python Execution | Pyodide (WASM) | Runs offline, no server needed |
| JS/TS Execution | Sandpack | Live React/TS preview for frontend lessons |
| AI | Anthropic SDK (`@anthropic-ai/sdk`) | Claude API for tutoring, hints, code review |
| Content | MDX via `next-mdx-remote` | Rich interactive lessons |
| Animations | Framer Motion | Level-up, XP gain, transitions |
| Charts | Recharts | Progress analytics, skill tree |
| Offline Storage | IndexedDB via `idb` | Lessons, progress, cached AI responses |
| PWA | Service Worker | Full offline support, installable, push notifications |
| Port | 8700 | Convention: 8500=stonks, 8600=strucky, 3000=moosoo |

**Not needed yet:** Backend database (localStorage/IndexedDB is fine for solo), auth, Docker, CI/CD.

---

## Offline-First Architecture

The #1 technical priority. The app must feel native on the subway.

### Works offline
- All lesson content (MDX pre-rendered, cached in service worker)
- Code playground (Monaco + Pyodide WASM cached locally)
- Python execution (Pyodide is entirely client-side)
- Challenge submission (tests run via Pyodide, XP awarded immediately)
- Spaced repetition reviews (cards in IndexedDB, FSRS runs client-side)
- Progress tracking (Zustand + IndexedDB, syncs when online)
- Skill tree navigation (fully client-side rendered)

### Needs online (gracefully degraded)
- AI hints — pre-cache top 3 hints per challenge on last sync
- AI code review — queued offline, delivered when back online
- AI tutor chat — unavailable offline, suggests hint system instead
- Content updates — background sync on WiFi

### Sync strategy
- **Pre-cache on WiFi**: Detect WiFi, pre-download upcoming lessons + challenges + AI hints
- **Background sync**: When back online, push progress, pull new content
- **Conflict resolution**: Client wins (solo user), timestamp-based
- **Storage budget**: ~50MB Pyodide WASM + ~5MB lessons + ~2MB state

---

## Gamification Systems (5 active simultaneously)

### 1. XP & Levels

| Activity | Base XP | Notes |
|----------|---------|-------|
| Complete a lesson | 50–150 | Scaled by tier (1=50, 6=150) |
| Pass a challenge | 100–500 | Scaled by difficulty (1–5 stars) |
| Perfect challenge (no hints, first try) | +50% bonus | Stacks with streak |
| Speed bonus (<50% est. time) | +25% bonus | Encourages fluency |
| Spaced rep card (correct) | 30 | Per card |
| Spaced rep card (incorrect) | 10 | Still rewarded |
| Daily login | 20 | Just for opening |
| Capstone project | 1000–2500 | Major milestone |

**Streak multiplier:** 1.0x (days 1–2) → 1.25x (3–6) → 1.5x (7–13) → 2.0x (14–29) → 2.5x (30–59) → 3.0x (60–99) → 3.5x (100+)

**Level curve:** `total_xp = 100 × level^1.8`

| Level | XP | Title |
|-------|----|-------|
| 1 | 100 | Novice |
| 5 | 1,600 | Apprentice |
| 10 | 6,300 | Journeyman |
| 20 | 22,000 | Craftsman |
| 35 | 58,000 | Engineer |
| 50 | 110,000 | Architect |
| 75 | 225,000 | Master |
| 100 | 400,000 | Grandmaster |

**Level-up rewards:** Every level = animation + sound. Every 5 = new theme. Every 10 = avatar frame. Every 25 = title badge.

### 2. Streaks
- Daily goal: configurable (Quick=1, Standard=3, Intense=5 activities)
- Streak freezes: earn 1 per 7-day streak, bank up to 5
- Milestones: 7, 14, 30, 60, 100, 200, 365 days (unique badge + XP burst)
- Recovery: "Welcome back" flow after 2+ missed days
- Weekend mode: optional (weekends don't break streak)
- Visual: fire icon in navbar, GitHub-style contribution calendar

### 3. Skill Tree
- Interactive canvas/SVG, pinch-to-zoom on mobile
- Branch colors: Python=blue, TS=cyan, React=teal, C#=purple, DS&A=orange, etc.
- Node states: Locked (gray) → Available (glowing pulse) → In Progress (partial ring) → Completed (solid + check) → Mastered (gold border + star)
- Tap node → title, description, lessons, challenges, XP, prerequisites
- Cross-branch prerequisite connections shown as dotted lines

### 4. Achievements (100+)
- **Completion**: First Steps, Scholar (25), Bookworm (100), Walking Encyclopedia (250)
- **Mastery**: Clean Code, No Training Wheels, Speed Demon, One-Shot
- **Streak**: Week Warrior, Month Machine, Centurion, Year of Code
- **Exploration**: Polyglot, Full Stack, T-Shaped, Renaissance Dev
- **Hidden**: Night Owl, Early Bird, Marathon, Subway Scholar, Weekend Warrior
- Rarity tiers: Common / Rare / Epic / Legendary
- Toast notifications + profile showcase

### 5. Capstone Projects

| Unlock | Project | XP |
|--------|---------|-----|
| Python T3 | CLI Task Manager | 1000 |
| Python T5 | Trading Signal Analyzer | 1500 |
| Python T6 | Web Scraper & Data Pipeline | 2000 |
| TS T3 | Type-Safe API Client | 1500 |
| React T3 | Weather Dashboard | 2000 |
| React T4 | Full-Stack Blog | 2500 |
| C# T4 | REST API with ASP.NET | 2000 |
| DS&A T4 | Pathfinding Visualizer | 2000 |
| Databases T4 | Social Platform Schema | 1500 |
| Systems T4 | Design Twitter | 2000 |

---

## Commute-Optimized Sessions

### Session modes
- **Quick** (10 min): 1 review queue + 1 lesson or 1 challenge
- **Standard** (20 min): Review queue + lesson + challenge
- **Deep** (45+ min): Full lesson path + multiple challenges + review
- **Review Only** (5 min): Just spaced repetition cards

### Smart session picker
- Suggests session on app open based on time of day, streak status, next curriculum item
- Shows estimated time, remembers commute patterns

### Commute-friendly UI
- Large touch targets, bottom navigation (5 tabs)
- Swipe gestures for lesson sections and challenges
- Dark theme default, adjustable font size
- Code editor: larger font, auto-bracket, smart suggestions

---

## Skill Tree — Full Curriculum (188 nodes, 10 branches)

### Python (6 tiers, 42 nodes)

**Tier 1: Basics (7 nodes)**
1. Hello World & the REPL
2. Variables & Assignment
3. Data Types (int, float, str, bool, None)
4. Strings (indexing, slicing, methods, f-strings)
5. Numbers & Math
6. Booleans & Comparisons
7. Input/Output & Comments

**Tier 2: Control Flow (5 nodes)**
8. Conditionals (if/elif/else)
9. While Loops
10. For Loops (range, enumerate, zip)
11. Loop Control (break, continue, pass)
12. Match/Case (3.10+)

**Tier 3: Data Structures (6 nodes)**
13. Lists & Slicing
14. List Comprehensions
15. Tuples
16. Dictionaries
17. Sets
18. Nested Structures

**Tier 4: Functions (7 nodes)**
19. Defining Functions
20. Arguments (*args, **kwargs)
21. Scope (LEGB rule)
22. Higher-Order Functions
23. Lambda Functions
24. Closures
25. Decorators

**Tier 5: OOP (7 nodes)**
26. Classes & Objects
27. Encapsulation
28. Inheritance
29. Polymorphism
30. Dunder Methods
31. Abstract Classes
32. Dataclasses

**Tier 6: Advanced (10 nodes)**
33. Error Handling
34. File I/O
35. Generators & Iterators
36. Context Managers
37. Type Hints
38. Modules & Packages
39. Async/Await
40. Testing (pytest)
41. Standard Library Deep Dive
42. Python Internals (GIL, descriptors, metaclasses)

### TypeScript (3 tiers, 18 nodes) — prereq: Python T2
- **T1** (7): JS Fundamentals (variables, arrays, objects, functions, promises, DOM, modules)
- **T2** (6): TS Core (annotations, interfaces, unions, enums, generics, utility types)
- **T3** (5): Advanced TS (conditional types, mapped types, template literals, type guards, patterns)

### React & Next.js (4 tiers, 20 nodes) — prereq: TS T2
- **T1**: JSX, components, props, children, composition
- **T2**: useState, useEffect, useRef, events, forms, conditional rendering
- **T3**: useContext, useReducer, custom hooks, memo, useMemo, useCallback
- **T4**: Next.js App Router, RSC, server actions, API routes, layouts, SSR/SSG

### C# (4 tiers, 18 nodes) — prereq: Python T4 OR TS T1
- **T1**: Syntax, types, namespaces, console I/O, control flow
- **T2**: Classes, OOP, interfaces, generics, exceptions
- **T3**: LINQ, collections, delegates, events, extension methods
- **T4**: Async/await, ASP.NET, Entity Framework, DI

### Data Structures & Algorithms (6 tiers, 24 nodes) — prereq: Python T4
- **T1**: Big O, time/space complexity
- **T2**: Arrays, linked lists, stacks, queues
- **T3**: Hash tables, binary trees, BSTs, heaps
- **T4**: Graphs (BFS, DFS, topological sort)
- **T5**: Sorting, binary search, two pointers
- **T6**: DP, greedy, backtracking, tries, segment trees

### Databases (5 tiers, 15 nodes) — prereq: Python T3
- **T1**: Relational model, SQL basics
- **T2**: Joins, subqueries, aggregation
- **T3**: Indexing, optimization, normalization
- **T4**: NoSQL (MongoDB, Redis)
- **T5**: ORMs, migrations, transactions

### Systems Design (4 tiers, 12 nodes) — prereq: DS&A T2 + DB T2
- **T1**: Client-server, HTTP, REST, API design
- **T2**: Caching, load balancing, CDN
- **T3**: Microservices, message queues, event-driven
- **T4**: Distributed systems (CAP, consensus, sharding)

### Networking (4 tiers, 12 nodes) — prereq: Python T2
- **T1**: OSI model, TCP/IP
- **T2**: DNS, HTTP/HTTPS
- **T3**: Sockets, WebSockets, protocols
- **T4**: TLS, firewalls, network security

### Security (4 tiers, 12 nodes) — prereq: Networking T2
- **T1**: CIA triad, threat modeling
- **T2**: Authentication, authorization
- **T3**: OWASP Top 10, secure coding
- **T4**: Cryptography fundamentals

### DevOps (5 tiers, 15 nodes) — prereq: Python T3 + Networking T1
- **T1**: Git deep dive
- **T2**: Linux/shell
- **T3**: Docker
- **T4**: CI/CD
- **T5**: Cloud, IaC, monitoring

---

## AI Integration

### Architecture
```
Client → fetch('/api/ai/...') → Next.js API Route → Anthropic SDK → Claude → cached in IndexedDB
```

### Features
1. **3-Tier Hints**: Nudge (-10% XP) → Guide (-25%) → Reveal (-50%). Pre-cached offline.
2. **AI Code Review**: Structured feedback on passing submissions. Queued offline.
3. **Concept Explainer**: Tap highlighted terms → contextual explanation at user's level.
4. **AI Tutor Chat**: Slide-up Socratic chat panel. Online only.
5. **Adaptive Difficulty**: Adjusts recommendations based on performance patterns.

### Cost Control
- Sonnet for hints/explanations, Opus for capstone reviews only
- Hash-based response caching in IndexedDB
- 30 AI calls/hour rate limit
- Pre-generate hints for upcoming challenges on WiFi
- ~$5–10/month at active daily use

---

## Spaced Repetition (FSRS)

### Card types
- **Concept**: "What is Big O of dict lookup?" → Answer
- **Code output**: "What does this print?" → Predict output
- **Fill-in-the-blank**: Complete the missing line
- **Bug spot**: Find the bug in 5 lines
- **Explain**: "Explain closures" (AI-graded)

### Algorithm
- FSRS (Free Spaced Repetition Scheduler) — modern Anki algorithm
- Per-card adaptive: stability, difficulty, retrievability
- Auto-generated: 2–5 cards per completed lesson
- Swipe-based review UI (correct/incorrect/hard/easy)

---

## Directory Structure

```
D:\repos\learner/
├── research/                          # Phase 0 research docs (12)
├── src/
│   ├── app/                           # Next.js App Router
│   │   ├── layout.tsx                 # Root layout, dark theme, PWA
│   │   ├── page.tsx                   # Dashboard
│   │   ├── globals.css
│   │   ├── learn/[topicSlug]/[lessonSlug]/page.tsx
│   │   ├── challenge/[challengeId]/page.tsx
│   │   ├── review/page.tsx
│   │   ├── tree/page.tsx
│   │   ├── projects/[projectId]/page.tsx
│   │   ├── profile/page.tsx
│   │   ├── settings/page.tsx
│   │   └── api/ai/{hint,review,explain,chat,generate}/route.ts
│   ├── components/
│   │   ├── layout/      # BottomNav, Sidebar, XPBar, StreakBadge, SessionPicker
│   │   ├── lesson/      # LessonRenderer, CodePlayground, ConceptHighlight, CodeBlock
│   │   ├── challenge/   # ChallengeWorkspace, TestRunner, HintPanel, SubmissionResult
│   │   ├── review/      # ReviewCard, CardFlip, ReviewStats, DueCounter
│   │   ├── tree/        # SkillTree, SkillNode, BranchLabel, NodeDetail
│   │   ├── gamification/# LevelUpModal, AchievementToast, XPGainAnimation, StreakCalendar
│   │   ├── ai/          # TutorChat, CodeReviewPanel, ExplainPopover
│   │   ├── project/     # ProjectWorkspace, MilestoneTracker, ProjectReview
│   │   └── common/      # Button, Card, Modal, Badge, ProgressBar, SwipeableCard
│   ├── data/
│   │   ├── curriculum/  # Skill tree definitions (index.ts + per-branch)
│   │   ├── challenges/  # Challenge definitions with test cases
│   │   ├── review-cards/# Spaced repetition card definitions
│   │   ├── projects/    # Capstone project definitions
│   │   └── achievements.ts
│   ├── content/         # MDX lesson files (per language/tier)
│   ├── engine/          # xp, progression, streak, achievement, spaced-rep, session, offline
│   ├── store/           # user-store, progress-store, review-store, cache-store
│   └── lib/             # types, constants, ai-client, pyodide, db, utils
├── public/
│   ├── icons/           # PWA icons
│   ├── pyodide/         # Cached WASM files
│   └── sounds/          # XP, level-up, streak sounds
├── ARCHITECTURE.md
├── CLAUDE.md
├── package.json         # "dev": "next dev -p 8700"
└── .env.local           # ANTHROPIC_API_KEY
```

---

## Build Phases

### Phase 0: Research (12 docs, no code)
Write thorough, citation-backed research docs covering learning science, gamification, curriculum design, AI tutoring, code execution, offline architecture, and spaced repetition.

### Phase 1: Foundation + Complete Python Path
All gamification systems, full Python branch (42 nodes, ~150 challenges, ~150 review cards, 2 capstone projects), AI integration, offline/PWA, polished mobile UI.

### Phase 2: TypeScript + React Branches
18 + 20 nodes, Sandpack for React execution, 3 capstone projects.

### Phase 3: CS Fundamentals
DS&A (24 nodes) + Databases (15 nodes), 2 capstone projects.

### Phase 4: Systems & Infrastructure
C# (18), Networking (12), Systems Design (12), Security (12), DevOps (15), 4 capstone projects.

### Phase 5: Multi-User
Supabase backend, auth, cloud sync, social features, leaderboards.
