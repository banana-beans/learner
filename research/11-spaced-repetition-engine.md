# 11 -- Spaced Repetition Engine: FSRS Algorithm & Coding-Specific Adaptations

> Research doc 11 of 12 | learner app | 2026-04-09
>
> Purpose: Specify the complete spaced repetition system for learner --
> algorithm selection, TypeScript implementation, five card types designed
> specifically for programming knowledge, review session UX, card generation
> pipeline, and integration with the XP system from doc 08.

---

## Table of Contents

1. Why Spaced Repetition for Programming
2. Algorithm History: SM-2 to SM-18 to FSRS
3. FSRS Implementation for Learner
4. Card Types for Programming
5. Review Session Design
6. Card Generation Pipeline
7. Forgetting Curve Visualization
8. Adaptive New Card Introduction
9. FSRS Parameter Optimization
10. Mobile Review UX
11. Integration with XP System
12. Application: Complete Spaced Repetition Specification

---

## 1. Why Spaced Repetition for Programming

### 1.1 The Dual Nature of Programming Knowledge

Programming knowledge is not a single thing. It has two distinct components that require fundamentally different study approaches:

**Declarative knowledge** -- facts, definitions, and conceptual relationships. "What is Big O notation?" "What data structure gives O(1) lookup?" "What is the difference between a stack and a queue?" This is textbook knowledge. You either know the answer or you do not, and the answer can be stated in a sentence or two. Traditional flashcards handle declarative knowledge extremely well. This is the domain Anki was built for, and decades of spaced repetition research validate it.

**Procedural knowledge** -- the ability to *do* something. "Implement a binary search." "Debug a race condition." "Refactor a nested callback into async/await." Procedural knowledge cannot be tested by flipping a card and reading an answer. It requires active production -- writing code, predicting output, spotting errors. A user who can perfectly recite the definition of recursion may still freeze when asked to write a recursive function. The declarative knowledge is necessary but not sufficient.

Most spaced repetition systems treat all knowledge as declarative. Anki's card model is fundamentally question-on-front, answer-on-back. This works brilliantly for medical students memorizing drug interactions or language learners memorizing vocabulary. It does not work for a developer who needs to internalize how list comprehensions behave, why off-by-one errors happen, or when to choose a dictionary over a list.

### 1.2 Extending Spaced Repetition Beyond Q&A

Learner's spaced repetition system extends the model to include five card types (detailed in Section 4), three of which involve active coding rather than passive recall. The scheduling algorithm -- FSRS -- does not care what the card contains. It only cares about the user's rating after each review (Again, Hard, Good, Easy). This means we can put a fill-in-the-blank code challenge on one card and a concept definition on another, and the same algorithm optimally schedules both.

The key insight: the scheduling layer and the presentation layer are independent. FSRS handles *when* to show a card. The card type determines *how* to show it and *how* to grade it. This separation lets us build a system that is simultaneously a flashcard app and a micro-challenge platform, with a single unified review queue.

### 1.3 Research Foundation

Karpicke and Roediger (2008) compared four study strategies in a controlled experiment: (1) standard study, (2) repeated study, (3) study with testing, and (4) study with spaced testing. Participants who used spaced retrieval practice recalled 80% of material after one week, compared to 36% for repeated study without testing. The effect was not small -- it was a 2.2x improvement.

Critically, participants in the spaced retrieval group *predicted* they would perform worst. The effort of retrieval feels harder than passive re-reading, which creates an illusion of poor learning. This is the "desirable difficulty" phenomenon (Bjork, 1994). Learner must acknowledge this: users will sometimes feel like review sessions are harder than lessons. That feeling is a feature, not a bug. The XP system (Section 11) rewards review participation partly to counteract this perception.

Roediger and Butler (2011) extended these findings to show that retrieval practice with feedback produces even larger effects than retrieval alone. This validates our design: every card review in learner includes feedback (showing the correct answer, explaining why code behaves a certain way). The review is not just a test -- it is itself a learning event.

---

## 2. Algorithm History: SM-2 to SM-18 to FSRS

### 2.1 SM-2: The Classic (1987)

SM-2, created by Piotr Wozniak for SuperMemo in 1987, is the algorithm that launched the modern spaced repetition movement. Nearly every flashcard app built between 1990 and 2020 -- including early Anki -- used SM-2 or a minor variant. Its strength is simplicity: the entire algorithm fits in twenty lines of pseudocode.

**Core parameters:**

- **Easiness Factor (EF):** A per-card number starting at 2.5. Represents how "easy" this card is for the user. Modified after each review.
- **Interval:** Days until next review. Starts at 1, then 6, then `previous_interval * EF`.
- **Repetitions:** Count of consecutive successful reviews.

**Rating scale:** 0-5, where 0-2 are failures and 3-5 are passes with varying quality.

**Interval formula:**
```
if rating >= 3:          # pass
    if repetitions == 0: interval = 1
    if repetitions == 1: interval = 6
    else:                interval = round(interval * EF)
    repetitions += 1
else:                    # fail
    repetitions = 0
    interval = 1

EF = EF + (0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02))
EF = max(EF, 1.3)       # floor to prevent collapse
```

**Why SM-2 works:** It captures the core insight -- intervals should grow exponentially for remembered items and reset for forgotten ones. The EF provides per-card adaptation: hard cards get shorter intervals, easy cards get longer ones.

**Why SM-2 is insufficient for learner:**

1. **Fixed initial intervals.** Every card starts at 1 day, then 6 days, regardless of the user or the material. A trivial concept card and a complex code challenge get the same initial schedule.
2. **EF drift.** The easiness factor adjusts slowly and can get stuck in bad states. A card that was hard when first learned but has since been mastered retains a low EF, leading to unnecessarily frequent reviews. Wozniak himself called this "the problem of old cards."
3. **No mathematical model of memory.** SM-2 is heuristic. It does not model the probability of recall -- it just provides a scheduling rule. This means it cannot answer "what is the chance the user remembers this card right now?" or optimize intervals based on predicted retention.
4. **Binary success/failure for intervals.** A "Hard" pass and an "Easy" pass both extend the interval by the same formula. The algorithm does not distinguish fluent recall from effortful recall.

### 2.2 SM-18: Complexity Without Accessibility (Current SuperMemo)

Wozniak continued developing the SM algorithm through 18 major versions. SM-18 (and its predecessor SM-17) introduced a proper memory model with concepts similar to FSRS -- stability, retrievability, and difficulty as separate tracked variables. However, SM-18 has over 20 parameters, relies on proprietary heuristics that are not fully documented in the public literature, and is tightly coupled to SuperMemo's desktop application. No independent implementation exists.

SM-18 is the right direction -- per-card memory modeling with mathematically grounded parameters -- but it is not a viable foundation for an open-source client-side implementation. We mention it here for completeness and because FSRS builds on many of the same ideas, but with full transparency.

### 2.3 FSRS: The Modern Standard (2022-2024)

FSRS (Free Spaced Repetition Scheduler) was created by Jarrett Ye in 2022 and has been iteratively refined through 2024. It was adopted by Anki as the default algorithm in version 23.10 (October 2023), replacing SM-2 after 17 years. It is open-source (MIT license), well-documented, research-backed, and has been validated against real review data from millions of Anki users.

**Three core variables tracked per card:**

1. **Stability (S):** The time (in days) after which the probability of recall drops to 90%. A stability of 10 means the user has a 90% chance of recalling the card 10 days after the last review. Higher stability = more durable memory.

2. **Difficulty (D):** A number from 0 to 10 representing how hard this card is for this specific user. Cards with high difficulty gain stability more slowly. Difficulty adapts over time -- if a user consistently rates a card as Easy, its difficulty drops.

3. **Retrievability (R):** The current probability that the user can recall the card right now. This is a function of stability and elapsed time. It is not stored -- it is calculated on demand.

**The forgetting curve formula:**

```
R = (1 + t / (9 * S))^(-1)
```

Where `t` is the number of days since the last review and `S` is the current stability. This is a power-law decay function. Unlike Ebbinghaus's exponential model (see doc 00, Section 1), FSRS uses a power law because empirical data from millions of Anki reviews shows that real-world forgetting follows a power-law shape more closely than an exponential -- memories decay quickly at first but have a longer tail than the exponential predicts.

**Interval calculation:**

Given a target retention rate (default 0.9, meaning we want to review before recall drops below 90%), the next interval is:

```
I = 9 * S * (1 / target - 1)
```

For target = 0.9: `I = 9 * S * (1/0.9 - 1) = 9 * S * 0.111 = S`. This is elegant: when the target is 90%, the interval in days equals the stability. Review a card one stability-period after the last review, and you have exactly a 90% chance of recalling it.

**Why FSRS over SM-2:**

| Dimension | SM-2 | FSRS |
|-----------|------|------|
| Per-card adaptation | EF only (one number) | Stability + Difficulty (two numbers modeling distinct aspects of memory) |
| Memory model | None (heuristic) | Power-law forgetting curve with mathematically derived intervals |
| Initial intervals | Fixed (1, 6) | Parameterized, adapts to user |
| Rating granularity | 0-5, but only 3-5 affect interval formula | 1-4, each rating has a distinct effect on stability and difficulty |
| Parameter optimization | Not possible | Can optimize 19 parameters from user review history |
| Research validation | Anecdotal (37 years of SuperMemo use) | Validated on 15,000+ Anki user collections with measurable accuracy improvement |
| License | Public domain (algorithm published) | MIT open source (full implementation available) |

---

## 3. FSRS Implementation for Learner

### 3.1 Card States

Every review card exists in one of four states:

- **New:** The card has been generated but never reviewed. It sits in the queue waiting to be introduced.
- **Learning:** The card has been seen but not yet "graduated" to a real interval. Short intervals (1 minute, 10 minutes) until the user demonstrates initial recall.
- **Review:** The card is on a real spaced repetition schedule. Intervals range from 1 day to months or years.
- **Relearning:** The card was in Review but the user pressed Again (forgot it). It drops back to short intervals until re-stabilized, then returns to Review with reduced stability.

### 3.2 Rating Scale

Learner uses a four-point scale, matching FSRS's design:

| Rating | Label | Meaning | When to use |
|--------|-------|---------|-------------|
| 1 | Again | Did not recall / got it wrong | Could not answer, answered incorrectly, or had to guess |
| 2 | Hard | Recalled with significant effort | Eventually remembered but took a long time or was uncertain |
| 3 | Good | Recalled with moderate effort | Normal successful recall -- the default correct answer |
| 4 | Easy | Recalled instantly, no effort | Knew the answer before finishing reading the question |

For auto-graded card types (Code Output, Fill-in-the-Blank), the system maps the result to a rating: wrong = Again, slow/close = Hard, correct = Good. Users can override to Easy if they felt it was trivial.

### 3.3 State Transitions

```
New + Again  → Learning    (interval: 1 min, then 10 min)
New + Hard   → Learning    (interval: 5 min, then 10 min)
New + Good   → Review      (first interval: 1-3 days, based on stability)
New + Easy   → Review      (first interval: 4-7 days, boosted stability)

Learning + Again → Learning (reset to 1 min)
Learning + Good  → Review   (graduate to first real interval)
Learning + Easy  → Review   (graduate with boosted stability)

Review + Again → Relearning (stability reduced, interval: 10 min)
Review + Hard  → Review     (next interval, stability grows slowly)
Review + Good  → Review     (next interval, normal stability growth)
Review + Easy  → Review     (next interval, stability grows faster)

Relearning + Again → Relearning (reset to 10 min)
Relearning + Good  → Review     (re-graduate with reduced stability)
Relearning + Easy  → Review     (re-graduate, stability partially restored)
```

### 3.4 TypeScript Types

```typescript
type CardState = 'new' | 'learning' | 'review' | 'relearning';
type Rating = 1 | 2 | 3 | 4; // Again, Hard, Good, Easy

type CardType =
  | 'concept'        // Q&A factual recall
  | 'code-output'    // predict what code prints
  | 'fill-blank'     // fill in missing code
  | 'bug-spot'       // find the bug
  | 'explain';       // explain in your own words

interface ReviewCard {
  id: string;
  nodeId: string;            // which skill tree node generated this card
  type: CardType;
  question: string;          // front of card (may contain code blocks)
  answer: string;            // back of card (may contain code + explanation)
  testCode?: string;         // for fill-blank: test harness to validate answer
  state: CardState;
  stability: number;         // FSRS S (days)
  difficulty: number;        // FSRS D (0-10)
  due: Date;                 // when this card is next due for review
  lastReview: Date | null;   // timestamp of most recent review
  reps: number;              // total successful reviews
  lapses: number;            // total times "Again" was pressed
  tags: string[];            // concept tags for analytics (e.g., ['loops', 'python'])
  createdAt: Date;           // when the card was generated
  sourceLesson: string;      // lesson ID that generated this card
}

interface ReviewLog {
  cardId: string;
  rating: Rating;
  state: CardState;          // state before this review
  stability: number;         // stability after this review
  difficulty: number;        // difficulty after this review
  interval: number;          // scheduled interval in days
  reviewedAt: Date;
  elapsedDays: number;       // days since last review
  thinkingTime: number;      // seconds between showing question and rating
}
```

The `ReviewLog` is stored separately from the card and is append-only. It serves two purposes: it powers the forgetting curve visualization (Section 7), and it provides the data needed for FSRS parameter optimization (Section 9).

### 3.5 Core FSRS Functions

```typescript
function calculateRetrievability(stability: number, elapsedDays: number): number {
  return Math.pow(1 + elapsedDays / (9 * stability), -1);
}

function calculateInterval(stability: number, targetRetention: number): number {
  return Math.round(9 * stability * (1 / targetRetention - 1));
}

function updateStability(
  prevStability: number,
  difficulty: number,
  rating: Rating,
  retrievability: number
): number {
  // Stability increases more when:
  //   - current stability is high (well-learned cards grow faster)
  //   - difficulty is low (easy cards consolidate faster)
  //   - rating is high (strong recall signals durable memory)
  //   - retrievability is low (recalling a nearly-forgotten card is more valuable)
  // Exact parameters from FSRS v4 defaults, optimizable per-user
  // ...implementation uses FSRS parameter weights w[0] through w[18]
}

function updateDifficulty(prevDifficulty: number, rating: Rating): number {
  // Difficulty moves toward a mean based on rating
  // Again → difficulty increases
  // Easy → difficulty decreases
  // Clamped to [0, 10]
  const delta = rating - 3; // Good = 0 change, Again = -2, Easy = +1
  const newD = prevDifficulty - delta * 0.5;
  return Math.min(10, Math.max(0, newD));
}
```

The full FSRS v4 implementation involves 19 parameters (weights `w[0]` through `w[18]`) that control how stability and difficulty evolve. For MVP, we use the default parameters derived from aggregate Anki user data. Section 9 covers per-user optimization.

---

## 4. Card Types for Programming

### 4.1 Concept Card (Declarative Recall)

**Format:** Question on front, answer on back. The classic flashcard.

**Example:**
- Front: "What is the average-case time complexity of a Python dictionary lookup?"
- Back: "O(1) amortized. Python dicts use hash tables internally. Worst case is O(n) due to hash collisions, but this is extremely rare with Python's hash randomization (introduced in 3.3)."

**Grading:** User self-rates after seeing the answer. Did they know it before flipping? Again / Hard / Good / Easy.

**Auto-generation source:** Each lesson's "Key Takeaways" section contains concept summaries. The card generator extracts these and formats them as question-answer pairs. Example: a takeaway stating "Dictionary lookups are O(1) average case" becomes the question "What is the time complexity of a dictionary lookup?" with the original text as the answer.

**Best for:** Terminology, complexity facts, language rules, API signatures, design pattern names.

### 4.2 Code Output Card (Predict Behavior)

**Format:** Show a code snippet, ask "What does this print?" The user types their prediction, then the system reveals the actual output.

**Example:**
```python
nums = [1, 2, 3, 4, 5]
print(nums[1:4])
```
- User types: `[2, 3, 4]`
- Actual output: `[2, 3, 4]`
- Result: Match -- auto-rated Good.

**Grading logic:**
- Exact match (after whitespace normalization): auto-rated Good.
- Close match (correct values, wrong format -- e.g., `2, 3, 4` without brackets): auto-rated Hard.
- Wrong answer: auto-rated Again.
- User can override any auto-rating.

**Auto-generation source:** Lesson `CodeBlock` components that contain `print()` statements. The generator extracts the code, runs it in the sandbox to capture output, and creates a card with the code as the question and the output as the answer.

**Best for:** Slice behavior, operator precedence, type coercion, loop mechanics, string formatting, truthiness rules -- any concept where developers frequently mispredict behavior.

### 4.3 Fill-in-the-Blank Card (Procedural Recall)

**Format:** A code snippet with one or more blanks (marked with `___`). The user fills in the missing code. The completed code is run against a test case to check correctness.

**Example:**
```python
# Filter even numbers from a list using a list comprehension
result = [x for x in range(10) if ___]
```
- User types: `x % 2 == 0`
- Test: `assert result == [0, 2, 4, 6, 8]`
- Result: Pass -- auto-rated Good.

**Grading logic:**
- Code passes test case: auto-rated Good.
- Code has correct logic but syntax error: auto-rated Hard (with error message shown).
- Code fails test case: auto-rated Again (correct answer shown with explanation).

**Auto-generation source:** Lesson `InteractiveExample` components. The generator identifies the "key learning" line in the example, blanks it out, and uses the example's test assertions as the grading test. This requires lesson authors to tag the critical line(s) in their interactive examples.

**Best for:** Syntax recall, API usage, algorithm implementation steps, conditional logic, comprehension patterns. This is the most important card type for procedural knowledge.

### 4.4 Bug Spot Card (Debugging)

**Format:** Show code that contains a bug. The user identifies and explains the bug. After thinking, they reveal the explanation and self-rate.

**Example:**
```python
def calculate_average(numbers):
    total = 0
    for num in numbers:
        total += num
    return total / len(numbers)

result = calculate_average([])
```
- Question: "What goes wrong when this code runs?"
- Answer: "ZeroDivisionError -- `len(numbers)` is 0 when the list is empty. Fix: check for empty list before dividing."

**Grading:** Self-rated. The user reads the explanation and honestly assesses whether they spotted the bug and understood why it occurs.

**Auto-generation source:** Bug spot cards are difficult to auto-generate reliably because they require intentionally introducing plausible bugs into working code. For MVP, these are manually authored by lesson creators. A future AI enhancement could generate them by taking working code from lessons and introducing common bug patterns (off-by-one, missing edge case, wrong operator, mutation of shared state).

**Best for:** Defensive programming instincts, edge case awareness, common pitfalls per language, error types. These cards develop the debugging muscle that separates competent developers from beginners.

### 4.5 Explain Card (Deep Understanding, AI-Graded)

**Format:** "Explain {concept} in your own words." The user types a free-text explanation. When online, AI evaluates the explanation for accuracy and completeness. When offline, the card shows a reference explanation and the user self-rates.

**Example:**
- Prompt: "Explain what a closure is in JavaScript and give an example of when you'd use one."
- User types: "A closure is when a function remembers variables from its outer scope even after the outer function has returned. You'd use it for data privacy, like making a counter function that keeps its count variable hidden."
- AI evaluation: "Strong understanding of the core concept. You correctly identified that closures capture variables from the enclosing scope and persist them. Your example of a counter is a classic use case. You could strengthen your answer by mentioning that closures capture the variable binding, not the value -- so mutations to the outer variable are reflected. Rating: Good."

**Grading logic:**
- AI maps its assessment to a 0-4 score: 0 (no understanding) = Again, 1 (partial, significant errors) = Again, 2 (partial, minor gaps) = Hard, 3 (solid understanding) = Good, 4 (excellent, includes nuance) = Easy.
- Offline fallback: show the reference explanation, user self-rates.
- "Skip" button available when offline (card is not penalized, just deferred).

**Auto-generation source:** Lesson core concept sections. Each lesson defines 1-2 "big ideas" that are candidates for explain cards. The generator creates the prompt from the concept name and the reference explanation from the lesson content.

**Best for:** Deep conceptual understanding, ability to articulate ideas (critical for interviews and code reviews), connecting concepts to practical use cases. This is the highest-cognitive-load card type and should be used sparingly -- at most 1 explain card per lesson.

---

## 5. Review Session Design

### 5.1 Session Entry

When the user opens learner, the app calculates how many cards are due (retrievability has dropped below the target retention threshold). This count appears as a badge on the Review tab: "12 cards due." If zero cards are due, the badge says "All caught up" with a checkmark.

The user taps the Review tab and sees a summary: "12 cards due (3 overdue, 9 due today). Estimated time: 6 minutes." They choose a session length:
- **Quick (5 min):** Best for a short subway ride. Prioritizes overdue cards.
- **Standard (10 min):** The default. Covers all due cards plus some new cards.
- **Deep (15 min):** All due cards plus maximum new card introduction.
- **All due:** Review every due card regardless of time. For completionists.

### 5.2 Session Flow

1. **Show card.** The question side appears. For code cards, syntax highlighting is applied. The thinking timer starts (invisible to the user but logged).
2. **User engages.** For concept and bug spot cards, the user thinks silently. For code output cards, they type a prediction. For fill-blank cards, they type code. For explain cards, they type a paragraph.
3. **Reveal answer.** The user taps "Show Answer" (or submits their typed response). A flip animation reveals the answer side. For auto-graded types, the system shows the verdict (correct/incorrect) before the rating buttons appear.
4. **Rate.** Four buttons appear: Again (red), Hard (orange), Good (green), Easy (blue). Each button shows the next interval preview: "Again (10m) | Hard (2d) | Good (5d) | Easy (12d)." This preview helps users calibrate their self-assessment.
5. **FSRS update.** The algorithm updates the card's stability, difficulty, and due date. The review log entry is appended.
6. **Next card.** The session advances to the next card, or shows the session complete screen.

### 5.3 Card Ordering

The queue is ordered by priority:

1. **Overdue cards** (due date in the past), sorted by most overdue first. These represent knowledge that is actively decaying.
2. **Due today cards**, sorted by lowest retrievability first. A card at 85% recall is more urgent than one at 92%.
3. **Learning/relearning cards** with short intervals that have elapsed (e.g., the 10-minute interval from a previous "Again" has passed).
4. **New cards** (up to the daily limit). New cards are interleaved with review cards -- not shown in a batch at the end. The interleaving ratio is approximately 1 new card for every 3-4 review cards.

Interleaving cards from different topics is intentional. Research on interleaved practice (Rohrer & Taylor, 2007) shows that mixing problem types during study produces better discrimination and transfer than blocking by topic. A user who reviews a Python slice card, then a Big O card, then a closure card develops better contextual recall than one who reviews all Python cards in a row.

### 5.4 Session Summary

When the session ends (time limit reached or all due cards reviewed), the user sees:

- **Cards reviewed:** e.g., "15 cards reviewed"
- **Accuracy:** percentage rated Good or Easy (e.g., "87% correct")
- **Streak:** current review streak in days (e.g., "5-day streak")
- **XP earned:** total XP from this session with breakdown
- **Retention trend:** a small sparkline showing 7-day rolling retention rate
- **Next session preview:** "Next cards due: 8 cards tomorrow at ~9:00 AM"

---

## 6. Card Generation Pipeline

### 6.1 Trigger

Card generation is triggered when a user completes a lesson -- specifically, when they reach the lesson completion screen and the system records the lesson as finished in the skill tree. Each lesson generates 2-5 review cards depending on the lesson's content density and the card templates defined by the lesson author.

### 6.2 Template System

Each lesson includes card templates in its companion data file (separate from the MDX content). Templates specify:

```typescript
interface CardTemplate {
  type: CardType;
  question: string;           // supports {{variable}} interpolation
  answer: string;
  testCode?: string;          // for fill-blank cards
  tags: string[];
  difficulty_hint: number;    // 1-10, author's estimate of card difficulty
}
```

Lesson authors write card templates as part of the lesson creation process. This is not an afterthought -- the cards are integral to the lesson design. A lesson about list comprehensions should generate cards that test comprehension syntax, predict output of nested comprehensions, and fill in filter conditions.

### 6.3 Auto-Generation Rules

- **Concept cards:** 1-2 per lesson, drawn from Key Takeaways.
- **Code output cards:** 1-2 per lesson if the lesson contains code examples with observable output.
- **Fill-blank cards:** 1 per lesson if the lesson contains an interactive example.
- **Bug spot cards:** 0-1 per lesson (only if manually authored by the lesson creator).
- **Explain cards:** 0-1 per lesson (only for lessons introducing major new concepts).

Total target: 3 cards per lesson on average. With a curriculum of ~200 lessons, this produces ~600 review cards over the full learning path. At a review pace of 10-15 cards per day, this is manageable without overwhelming the user.

### 6.4 Storage

Cards and review logs are stored in IndexedDB via the same persistence layer described in doc 07 (offline-first architecture). The card store has two object stores:

- `review_cards`: All generated cards, indexed by `id`, `nodeId`, `state`, and `due`.
- `review_logs`: Append-only log of every review event, indexed by `cardId` and `reviewedAt`.

Both stores are included in the cross-device sync payload when the user is online. Conflict resolution for cards uses last-write-wins on the `due`, `stability`, and `difficulty` fields. Review logs are append-only and never conflict -- both sides' logs are merged by timestamp.

### 6.5 Future: AI-Generated Cards

A planned enhancement is AI-generated cards from lesson content. The AI reads the full lesson MDX and generates additional cards beyond the author-written templates. This would allow the system to produce cards for concepts the author did not explicitly template, and to generate variations (e.g., multiple code output cards with different inputs to the same function).

This feature requires online connectivity (for the AI API call) and is not part of MVP. When implemented, AI-generated cards would be marked with a `source: 'ai'` flag so users can report low-quality cards and the generation prompt can be iteratively improved.

---

## 7. Forgetting Curve Visualization

### 7.1 Purpose

The forgetting curve visualization serves two functions: it makes the invisible process of memory decay visible and tangible, and it motivates timely review by showing the user exactly what they are losing.

### 7.2 Per-Topic Retention Display

The Review tab includes a "Memory Status" panel showing estimated retention by topic:

```
Python Basics       ████████████████████░   95%  Solid
Data Structures     ██████████████████░░░   88%  Good
Algorithms          ██████████████░░░░░░░   72%  Fading ⚠
Closures & Scope    ████████░░░░░░░░░░░░░   45%  Review now!
```

Each bar represents the average retrievability of all Review-state cards tagged with that topic. The retrievability is calculated in real time using the FSRS formula: `R = (1 + t / (9 * S))^(-1)` for each card, then averaged across the topic.

Color coding:
- Green (90-100%): Solid retention, no action needed.
- Yellow (70-89%): Fading, cards coming due soon.
- Orange (50-69%): Significant decay, review recommended.
- Red (below 50%): Knowledge likely lost, urgent review needed.

### 7.3 Individual Card Curves

Tapping a topic expands to show individual cards with mini forgetting curves. Each curve shows:
- X-axis: days since last review (0 to next due date and beyond).
- Y-axis: estimated recall probability (0% to 100%).
- A dot at the current position (today).
- A dashed line at the 90% target threshold.

This visualization concretely demonstrates the spaced repetition concept. Users can see that a card reviewed yesterday is at 95% but will drop to 90% in three days -- and that is exactly when it is scheduled for review.

### 7.4 Motivational Messaging

The visualization is paired with contextual messages:
- "Your Python dict knowledge is at 95% retention -- your last review really stuck."
- "Your closure knowledge is dropping to 45% -- a quick review session would bring it back."
- "You have maintained 90%+ retention on Data Structures for 3 weeks straight."

These messages connect the abstract numbers to the user's learning identity. Per Self-Determination Theory (doc 01), competence feedback that highlights mastery -- not just performance -- enhances intrinsic motivation.

---

## 8. Adaptive New Card Introduction

### 8.1 The Overwhelm Problem

The biggest failure mode in spaced repetition systems is review debt -- when the number of due cards grows faster than the user can review them. This happens when too many new cards are introduced while existing cards are still in the learning phase. The user opens the app, sees "87 cards due," feels overwhelmed, and abandons the system entirely. This is the number one reason people quit Anki.

### 8.2 Adaptive Limits

Learner uses an adaptive system to prevent review debt:

| Due review cards | Max new cards per day |
|------------------|-----------------------|
| 0-10             | 10 (default max)      |
| 11-20            | 7                     |
| 21-30            | 5                     |
| 31-50            | 3                     |
| 50+              | 0 (clear backlog first) |

When the review backlog exceeds 50 cards, no new cards are introduced at all. The system shows a message: "You have 52 cards waiting for review. Let's catch up before adding new material. Review sessions this week will be slightly longer, but you'll be caught up by Thursday." The projected catch-up date is calculated from the user's average review pace.

### 8.3 Priority Queue for New Cards

When new cards are introduced, they are prioritized:

1. **Most recently completed lessons first.** The lesson content is freshest, so initial card learning aligns with the material still in short-term memory.
2. **Within a lesson, concept cards before procedural cards.** The user should recall the declarative knowledge before being tested on procedural application.
3. **Lower-difficulty cards before higher-difficulty cards.** Early success builds confidence for harder cards.

### 8.4 User Control

The user can adjust the maximum new cards per day via a slider in Settings (range: 5-30, default 10). Power users who want aggressive introduction can increase it. Users feeling overwhelmed can decrease it. The adaptive reduction described above always applies on top of the user's setting -- if the user sets 20 but has 35 due review cards, the effective limit is still 3.

---

## 9. FSRS Parameter Optimization

### 9.1 Default Parameters

FSRS v4 has 19 parameters (weights `w[0]` through `w[18]`) that control stability initialization, stability growth after successful recall, stability decay after lapse, and difficulty adjustment rates. The default values were derived from aggregating review data across 15,000+ Anki users and represent the "average" learner.

For most users, the defaults work well. Research by Ye et al. (2024) showed that default FSRS parameters achieve an RMSE (root mean squared error) of ~0.05 on predicting recall probability -- meaning its predictions are off by about 5 percentage points on average. This is more than adequate for scheduling purposes.

### 9.2 Per-User Optimization

After a user accumulates 100+ reviews, their review history contains enough data to optimize parameters specifically for them. The optimization minimizes the log-loss between predicted and actual recall across all reviews:

```
loss = -sum(actual * log(predicted) + (1 - actual) * log(1 - predicted))
```

Where `actual` is 1 if the user recalled the card (rated Good or Easy) and 0 if they forgot (rated Again), and `predicted` is the retrievability calculated from the card's stability and elapsed time.

### 9.3 Implementation Plan

- **MVP:** Use FSRS default parameters for all users. No optimization.
- **V2 (after 100+ reviews per user):** Run optimization client-side using the review log stored in IndexedDB. The optimization is a bounded optimization problem (19 variables, all bounded) solvable with L-BFGS-B or a simpler gradient-free method like Nelder-Mead.
- **Frequency:** Re-optimize every 30 days or every 200 reviews, whichever comes first.
- **Fallback:** If optimization produces parameters that are clearly pathological (e.g., stability growth < 1.0, meaning memories get weaker with successful review), discard and keep previous parameters.

The optimization runs entirely client-side in a Web Worker to avoid blocking the UI. On a modern phone, optimizing 19 parameters against 500 review data points takes under 2 seconds.

---

## 10. Mobile Review UX

### 10.1 Design Constraints

Review sessions happen on NYC subway commutes. This means: one hand free, a 5.5-6.7 inch screen, no internet, intermittent attention (stopping, doors opening, people moving), and potentially standing. Every interaction must be achievable with a single thumb.

### 10.2 Gesture Controls

- **Tap anywhere on card:** Flip to reveal answer.
- **Swipe right:** Rate as Good (the most common rating, made the easiest gesture).
- **Swipe left:** Rate as Again.
- **Tap "Hard" button:** For the less-common Hard rating.
- **Tap "Easy" button:** For the less-common Easy rating.

The swipe threshold is generous (40px minimum) to prevent accidental ratings. A subtle haptic pulse confirms each action: a short buzz on flip, a double-buzz on rating.

### 10.3 Visual Design

- **Large text.** Card content uses a minimum of 18px body text, 22px for code. Readable at arm's length in a crowded train.
- **High contrast.** Dark mode by default (matching subway lighting conditions), with WCAG AAA contrast ratios.
- **Syntax highlighting.** Code blocks use a high-contrast theme optimized for small screens. Line numbers are hidden on cards (they add clutter without value in this context).
- **Progress bar.** A thin bar at the very top of the screen shows progress: `cards reviewed / total due`. It fills left to right in the accent color. No numbers -- just a visual sense of progress.

### 10.4 Session Complete

When all due cards are reviewed (or the time limit is reached), a celebration screen appears:

- A confetti animation (subtle, 1 second).
- "Session complete! 15 cards reviewed."
- Accuracy and XP summary.
- A large "Done" button that returns to the main app.

The celebration is brief and genuine. Per doc 01's analysis of the Overjustification Effect, excessive celebration of routine activities can feel patronizing and reduce intrinsic motivation. A quick confetti burst and a clear summary respects the user's time.

---

## 11. Integration with XP System

### 11.1 XP Awards Per Review

The XP values for spaced repetition reviews are defined in doc 08 (Section 2.1). For completeness and to show how they integrate:

| Rating | XP | Rationale |
|--------|----|-----------|
| Again (1) | 10 | The user showed up and attempted recall. Effort is never worthless. |
| Hard (2) | 20 | The user recalled successfully but with difficulty. Effortful recall is valuable learning. |
| Good (3) | 30 | Standard successful recall. The baseline review reward. |
| Easy (4) | 30 | Same as Good. Easy cards are not rewarded more because we do not want to incentivize dishonest Easy ratings to earn more XP. |

Note that Easy awards the same XP as Good. This is a deliberate anti-gaming measure. If Easy gave more XP, users would be tempted to rate cards as Easy even when they struggled, which would cause FSRS to schedule overly long intervals, leading to genuine forgetting. The incentive structure must never conflict with honest self-assessment.

### 11.2 Session Bonuses

- **Perfect session (all Good or Easy):** +50% bonus on total session XP. A session with 10 Good ratings earns 300 base + 150 bonus = 450 XP.
- **Review streak (7+ consecutive days with at least one review session):** Unlocks the "Memory Master" achievement tier. At 30 days, upgrades to "Memory Legend." These feed into the streak system from doc 08, Section 5.

### 11.3 XP Calculation Example

A user completes a 10-card review session:
- 7 cards rated Good: 7 * 30 = 210 XP
- 2 cards rated Hard: 2 * 20 = 40 XP
- 1 card rated Again: 1 * 10 = 10 XP
- Base session XP: 260 XP
- Not a perfect session (had Again and Hard ratings), so no perfect bonus.
- User has a 5-day review streak (streak multiplier from doc 08 applies).
- Total: 260 * streak_multiplier.

The exact streak multiplier values are defined in doc 08, Section 5. The spaced repetition system does not define its own multipliers -- it uses the global multiplier system to avoid complexity and inconsistency.

---

## 12. Application: Complete Spaced Repetition Specification for Learner

This section summarizes the decisions made in this document into a buildable specification.

**Algorithm:** FSRS v4 with default parameters, implemented entirely in TypeScript, running client-side in the browser. No server dependency for scheduling. Card state, review history, and scheduling data stored in IndexedDB.

**Card types:** Five types spanning the declarative-to-procedural spectrum. Concept cards for facts, code output cards for behavior prediction, fill-blank cards for syntax and implementation, bug spot cards for debugging instincts, and explain cards for deep understanding. Auto-grading for code output and fill-blank types. AI grading for explain cards (online only). Self-rating for concept and bug spot cards.

**Card generation:** 2-5 cards auto-generated per completed lesson from author-defined templates. Card templates are part of the lesson format, not an afterthought. Total card pool grows to ~600 cards across the full curriculum.

**Review sessions:** Configurable length (5/10/15 min or all due). Cards ordered by urgency (overdue first, then due today, then new). Interleaved across topics. Session summary shows accuracy, XP, and streak.

**Adaptive limits:** Maximum 10 new cards per day (user-adjustable 5-30), automatically reduced when review backlog grows. At 50+ due cards, new card introduction pauses entirely.

**Forgetting curve visualization:** Per-topic retention bars with color coding. Individual card decay curves available on drill-down. Motivational messaging tied to retention status.

**Mobile UX:** Swipe right for Good, swipe left for Again, tap to flip. Large text, high contrast, one-thumb operation. Optimized for subway commuting -- offline-first, quick sessions, no scrolling.

**XP integration:** 10-30 XP per card review depending on rating. Perfect session bonus of 50%. Review streaks feed into the global streak system. Easy and Good award equal XP to prevent dishonest rating inflation.

**Parameter optimization:** Default FSRS parameters for MVP. After 100+ reviews, client-side optimization using review history. Runs in a Web Worker every 30 days. Fully offline.

**Data model:** `ReviewCard` and `ReviewLog` types in IndexedDB. Cards are mutable (state, stability, difficulty, due date update with each review). Logs are append-only (complete review history for analytics and optimization). Both sync across devices when online with last-write-wins for cards and merge-by-timestamp for logs.

This system gives learner a spaced repetition engine that goes beyond traditional flashcards. By scheduling code challenges alongside concept cards, grading them through execution rather than self-report, and running the entire algorithm offline in the browser, it addresses the specific needs of a developer learning app used during subway commutes -- where every minute of study time must count and no internet connection can be assumed.
