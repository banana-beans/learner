# 00 — Learning Science Fundamentals

> Research document 00 of 12 for **Learner** — a gamified developer learning app.
> This document establishes the empirical foundation that every design decision in the app should trace back to.

---

## 1. The Ebbinghaus Forgetting Curve

In 1885, Hermann Ebbinghaus published *Über das Gedächtnis* ("On Memory"), the first rigorous experimental study of human memory. Using himself as the sole subject and nonsense syllables (e.g., "DAX," "BUP," "ZOL") to control for prior associations, he measured retention at various intervals after initial learning.

**Key findings:**

- **~56% of learned material is forgotten within 1 hour** of the learning session ending.
- **~66% is forgotten within 1 day.**
- **~75% is forgotten within 6 days.**
- The curve is exponential — the steepest drop happens immediately, then loss decelerates.

Ebbinghaus modeled the relationship as:

```
R = e^(-t/S)
```

Where `R` is retention, `t` is time, and `S` is the relative strength of the memory.

**Modern replication:** Murre and Dros (2015) replicated the Ebbinghaus experiment with a larger sample size (N=14,000+ via an online platform) and confirmed the original curve shape. Their data showed near-identical decay rates at short intervals and established that the forgetting curve holds across populations — it is not an artifact of Ebbinghaus's self-experimentation. They also confirmed that each successful retrieval flattens the curve for that item, making the memory more durable.

**Why this matters for Learner:** If a developer learns what a closure is on Monday, by Tuesday they have likely lost two-thirds of the details. Without strategic review, the concept is functionally gone within a week. The entire review system must be built around combating this curve.

---

## 2. Spaced Repetition

The **spacing effect** — the finding that distributed practice produces better long-term retention than massed practice ("cramming") — is one of the most robust results in all of cognitive psychology. It has been replicated hundreds of times across ages, material types, and experimental paradigms.

**Cepeda et al. (2006)** conducted a meta-analysis of 184 articles covering 317 experiments on the spacing effect. Key findings:

- Spacing practice across time consistently improved final test performance by 10–30% compared to massed (back-to-back) practice with the same total study time.
- **Optimal inter-study intervals depend on the retention interval** — how long you need to remember the material. For a 1-week retention target, optimal spacing is ~1 day. For a 1-year target, optimal spacing is ~3–4 weeks.
- The optimal gap/retention-interval ratio is approximately **10–20%** (i.e., if you need to remember something for 30 days, review it every 3–6 days).

### Algorithmic Implementations

**Leitner System (1972):** Physical flashcard system with numbered boxes. Correct answers move a card to the next box (longer interval). Incorrect answers send it back to box 1. Simple but effective — it approximates exponentially increasing intervals.

**SM-2 (SuperMemo, 1987):** Piotr Wozniak's algorithm that assigns each item an "easiness factor" (EF) and schedules reviews based on a multiplicative interval formula. The core equation:

```
I(n) = I(n-1) * EF
```

Where `I(n)` is the nth interval and EF starts at 2.5, adjusting based on response quality (0–5 scale). SM-2 became the backbone of Anki and dozens of other SRS tools.

**FSRS (Free Spaced Repetition Scheduler, 2022–present):** An open-source, machine-learning-based algorithm developed by Jarrett Ye. FSRS models memory with three parameters — stability (S), difficulty (D), and retrievability (R) — and uses gradient descent on real review data to optimize scheduling. Benchmarks show FSRS reduces review load by 20–30% compared to SM-2 while maintaining the same retention targets. Anki adopted FSRS as its default scheduler in 2024.

**Practical implications:**

- New items should be reviewed within 24 hours of first exposure.
- Successful recalls should push the next review further out (1d → 3d → 7d → 14d → 30d → ...).
- Failed recalls should reset or significantly shorten the interval.
- The system should be adaptive — learners who recall easily get longer intervals; learners who struggle get shorter ones.

---

## 3. Active Recall and the Testing Effect

The **testing effect** (also called the retrieval practice effect) is the finding that the act of retrieving information from memory strengthens that memory more than re-studying the same material.

**Roediger and Butler (2011)** synthesized decades of testing-effect research and identified several key principles:

- Taking a test on material produces **25–50% better retention** on a delayed final test compared to restudying the same material for the same amount of time.
- The benefit is greater when the initial test requires **free recall** (producing the answer from scratch) rather than recognition (selecting from options).
- Testing with feedback is better than testing without, but testing without feedback is still better than restudying.

**Karpicke and Blunt (2011)** compared retrieval practice against elaborative concept mapping. Students who practiced retrieval (closed-book recall) outperformed those who created detailed concept maps — even on assessments that required inference and concept application, not just rote recall. This challenged the assumption that "deeper" study strategies always win.

**Why retrieval beats re-reading:**

- Re-reading creates an **illusion of competence** — the material feels familiar, so learners overestimate their knowledge.
- Retrieval forces the brain to reconstruct knowledge, strengthening neural pathways.
- Each retrieval event updates and reconsolidates the memory trace.

**Implications for coding education:**

- Writing code from scratch (active recall) is vastly superior to reading code examples.
- "Fill in the blank" challenges where learners write a function body are more effective than multiple choice.
- Code tracing exercises (predicting output) force retrieval of language semantics.
- The traditional tutorial model (read explanation → copy-paste example → move on) is among the least effective approaches.

---

## 4. Interleaving

**Interleaving** is the practice of mixing different types of problems or topics within a single study session, as opposed to **blocking** (completing all problems of one type before moving to the next).

**Rohrer and Taylor (2007)** demonstrated this with mathematics: students who practiced interleaved problem sets (mixing different formula types) scored 43% higher on a delayed test than students who practiced blocked sets — despite the blocked group performing better during the practice itself. The interleaved group felt like they were learning less (the experience was harder and more confusing), but they actually learned more.

**Why interleaving works:**

- It forces learners to **discriminate between problem types** — "what kind of problem is this?" is itself a critical skill.
- Blocking allows learners to apply the same strategy mindlessly. Interleaving requires strategy selection.
- It mirrors real-world conditions. In actual programming, you don't encounter 20 array problems followed by 20 string problems — you encounter a mix.

**Taylor and Rohrer (2010)** extended these findings and showed the interleaving advantage persists even when total practice time and number of problems are equalized.

**Application to coding:**

- A challenge queue that mixes array manipulation, string processing, recursion, and algorithmic thinking will produce better transfer than completing all array challenges before moving to strings.
- Within a single concept (e.g., "loops"), mixing `for`, `while`, and `forEach` challenges is better than drilling one at a time.
- The difficulty is real — interleaving feels worse to learners. The app needs to communicate why the mix is intentional.

---

## 5. Desirable Difficulties

Robert Bjork (1994) introduced the concept of **desirable difficulties** — learning conditions that make initial acquisition harder but improve long-term retention and transfer. The key insight: **conditions that maximize performance during learning often do not maximize learning itself.**

**Examples of desirable difficulties:**

- **Spacing** (see section 2) — spacing practice feels less productive than cramming but produces better retention.
- **Interleaving** (see section 4) — mixing problem types feels confusing but improves discrimination.
- **Generation** — producing an answer from scratch (even incorrectly) before being shown the correct answer improves encoding compared to simply reading the answer. This is the "generation effect" (Slamecka & Graf, 1978).
- **Varying practice conditions** — practicing a skill in different contexts (e.g., different code editors, different problem framings) improves transfer.
- **Reducing feedback frequency** — constant immediate feedback can create dependency. Intermittent feedback forces learners to develop internal error-detection skills.

**The critical distinction:** A difficulty is "desirable" only if the learner has the prerequisite knowledge to engage with it productively. Giving a total beginner an expert-level problem is not a desirable difficulty — it is just frustrating. The difficulty must be calibrated to the learner's current level.

**Implications for app design:**

- Don't reveal answers immediately — require an attempt first.
- Hints should cost something (XP penalty, reduced score) to preserve the generation effect.
- Multiple-choice questions are easy but weak. Free-response (write the code) is harder but produces deeper learning.
- Varying how concepts are presented (different variable names, different contexts, different problem framings) is better than repeating the same template.

---

## 6. Cognitive Load Theory

John Sweller (1988) proposed **Cognitive Load Theory (CLT)**, which models working memory as a limited-capacity system that can be overwhelmed by poorly designed instruction.

**Three types of cognitive load:**

- **Intrinsic load:** The inherent difficulty of the material. Determined by the number of interacting elements a learner must process simultaneously. A `for` loop has lower intrinsic load than a recursive algorithm with memoization, because the latter has more interacting elements.
- **Extraneous load:** Load imposed by poor instructional design. Irrelevant information, confusing layouts, split-attention effects (e.g., code on one page and the explanation on another), and unnecessary complexity. This should be minimized ruthlessly.
- **Germane load:** The cognitive effort dedicated to constructing and automating schemas (mental models). This is the "good" load — the actual learning. Instructional design should maximize germane load by freeing up capacity currently wasted on extraneous load.

**The worked-example effect:** For novices, studying worked examples (step-by-step solutions) is more effective than problem-solving. This is because novices lack schemas and must use general problem-solving strategies (means-ends analysis) that consume working memory, leaving no capacity for schema construction. As expertise develops, the advantage reverses — this is the **expertise reversal effect** (Kalyuga et al., 2003). Worked examples become redundant and can actually impair learning for advanced learners.

**Split-attention effect:** When learners must mentally integrate multiple sources of information (e.g., a code snippet and a separate explanation), extraneous load increases. Physically integrating the sources (e.g., inline comments, annotations directly on the code) eliminates this.

**Practical implications:**

- Beginners need worked examples with annotations. Advanced learners need open-ended problems.
- Each learning node should teach **one concept**. Don't introduce closures while also introducing async.
- Explanations should be embedded in the code, not in a separate panel that forces split attention.
- Visual complexity (cluttered UI, too many game elements on screen) adds extraneous load.

---

## 7. Zone of Proximal Development (ZPD)

Lev Vygotsky (1978) defined the **Zone of Proximal Development** as the gap between what a learner can do independently and what they can do with guidance. Learning is most effective when challenges fall within this zone.

**Three zones:**

- **Below ZPD:** The learner can already do this independently. Practice here builds fluency but not new knowledge. Feels easy and (eventually) boring.
- **Within ZPD:** The learner cannot do this alone but can succeed with appropriate support (scaffolding). This is where learning happens. Feels challenging but achievable.
- **Above ZPD:** The learner cannot do this even with support. Attempting it produces frustration and no learning. Feels impossible.

**Scaffolding** is the temporary support provided to keep a learner within their ZPD. As competence develops, scaffolding is gradually removed ("fading"). Examples in a coding context:

- Providing function signatures and asking the learner to fill in the body.
- Offering a hint that narrows the problem ("think about what data structure would let you look up values in O(1)").
- Showing the first line of a solution and asking the learner to continue.
- Providing test cases that make the expected behavior explicit.

**Wood, Bruner, and Ross (1976)** formalized the scaffolding concept, identifying six functions: recruiting interest, reducing degrees of freedom, maintaining direction, marking critical features, frustration control, and demonstrating solutions.

**Application:** The hint system is a direct implementation of scaffolding. An adaptive difficulty system that tracks mastery and selects challenges within the learner's ZPD is an implementation of Vygotsky's core insight. The system must be able to estimate where each learner's ZPD boundaries are — this requires ongoing assessment data.

---

## 8. Elaborative Interrogation and Self-Explanation

Dunlosky et al. (2013) published a landmark review of 10 learning techniques, rating each by utility. Two techniques rated as "moderate utility" (and highly applicable to our context) are:

**Elaborative Interrogation:** Generating explanations for *why* a stated fact or concept is true. Instead of passively reading "JavaScript hoists `var` declarations," the learner is prompted: "Why would a language designer implement hoisting?" The act of generating an explanation forces deeper processing and creates richer associations in memory.

- Dunlosky et al. found elaborative interrogation improved fact retention by 20–40% compared to reading alone.
- It is most effective when learners have some prior knowledge to draw on (they need material to elaborate with).

**Self-Explanation:** Explaining material to oneself during learning. Chi et al. (1989) found that students who self-explained while studying worked examples learned significantly more than those who did not — even when total study time was controlled. The effect was particularly strong for learners who generated inferences beyond what was stated ("this step works because..." rather than paraphrasing).

**How AI tutoring can leverage these:**

- After a learner solves a challenge, prompt: "Explain in your own words why you used a hash map here instead of an array."
- When showing a concept, ask: "Why do you think this approach is more efficient?" before revealing the explanation.
- Use Socratic questioning: rather than explaining directly, ask a sequence of leading questions that guide the learner to construct the explanation themselves.
- "Rubber duck" prompts: "Explain this code to me as if I'm a beginner" forces self-explanation.

---

## 9. Concrete-Abstract-Concrete Pattern

This pedagogical pattern, well-established in mathematics and science education and articulated in various forms by Bruner (1966) and others, follows three stages:

1. **Concrete:** Start with a specific, tangible example. "Here's a function that filters even numbers from a list."
2. **Abstract:** Extract the general principle. "Filtering is the pattern of iterating over a collection and keeping items that satisfy a predicate."
3. **Concrete (new):** Apply the principle to a novel situation. "Now write a filter that keeps users who are over 18 and have verified emails."

**Why this works:**

- Concrete examples provide an anchor — they give the abstract concept meaning and context.
- Abstraction without prior concrete experience is meaningless ("what's a predicate?" is unanswerable without examples).
- The second concrete phase tests transfer — can the learner apply the abstracted principle to a new situation?
- This mirrors how expert programmers actually think: they accumulate concrete experiences, notice patterns, and then apply those patterns to new situations.

**Contrast with "abstract-first" teaching:** Many CS textbooks define `map`, `filter`, and `reduce` abstractly before showing any examples. This works for learners who already have concrete experience, but it fails for novices who lack the experiential base. Starting abstract forces novices to memorize definitions they don't understand.

**Application to Learner:** Each concept node should follow this sequence:

1. Show a concrete code example with annotations.
2. Highlight the general pattern or principle.
3. Present a challenge that requires applying the principle in a new context.

---

## 10. Sleep and Memory Consolidation

Matthew Walker's research (synthesized in *Why We Sleep*, 2017, and numerous papers) and the broader sleep science literature establish that sleep plays a critical role in memory consolidation.

**Key findings:**

- **Declarative memory** (facts, concepts) is consolidated during slow-wave sleep (deep NREM sleep), primarily in the first half of the night. The hippocampus "replays" the day's learning, transferring information to the neocortex for long-term storage.
- **Procedural memory** (skills, motor patterns, how-to knowledge) is consolidated during REM sleep and stage 2 NREM sleep, primarily in the second half of the night. This is directly relevant to coding, which is a procedural skill.
- **Sleep deprivation degrades learning capacity.** Walker and colleagues showed that even one night of sleep deprivation reduces the ability to form new memories by ~40% the following day.
- Stickgold and Walker (2013) demonstrated that sleep doesn't just passively protect memories — it actively reorganizes them, finding patterns and connections that were not apparent during waking study. Learners sometimes "solve" problems in their sleep that they could not solve while awake.

**Napping:** A 20–90 minute nap after a learning session can partially substitute for nighttime consolidation (Mednick et al., 2003). Even a 6-minute nap showed memory benefits in some studies.

**Timing implications:**

- Learning sessions spread across multiple days (with sleep between them) are superior to marathon single-day sessions, even with the same total time.
- Evening study sessions benefit from overnight consolidation — material studied before sleep is better retained than material studied in the morning (assuming equivalent time-to-test).
- Cramming is not just suboptimal; it actively undermines the consolidation process by reducing sleep.

**Application:** The app should not incentivize marathon sessions. Daily streak mechanics should reward consistency (showing up each day) rather than volume (spending 4 hours in one session). Session length recommendations and "time to rest" nudges are aligned with the science.

---

## Design Implications for Learner

Each principle maps to concrete features:

### Forgetting Curve + Spaced Repetition → FSRS Review System

- Implement FSRS as the core scheduling algorithm for review challenges.
- Each concept and challenge has a stability score, difficulty parameter, and next-review date.
- New items are scheduled for review within 24 hours, with intervals expanding on successful recall.
- Failed reviews reset or shorten the interval based on FSRS's memory model.
- Surface a "reviews due" count on the home screen. Reviews always take priority over new material.

### Active Recall → Challenges Over Passive Lessons

- The primary learning activity is writing code, not reading explanations.
- Every concept node ends with a challenge (not a summary).
- Favor free-response (write the function) over multiple choice.
- Code tracing ("what does this output?") engages retrieval of language semantics.
- Explanations exist to support challenges, not the other way around.

### Interleaving → Mixed Challenge Queues

- Review sessions draw from multiple topics, not just the most recently studied one.
- The challenge queue algorithm mixes concept areas (arrays + recursion + strings rather than 10 array problems in a row).
- Clearly communicate to learners why the mix exists — "this feels harder, but research shows you'll learn 40% more."

### Desirable Difficulties → Hint Penalties and Attempt-First Design

- Hints are available but cost XP (e.g., -25% of the challenge's XP value per hint).
- Answers are never revealed without at least one genuine attempt.
- Progressive hints: first hint narrows the approach, second hint gives a structural clue, third hint provides most of the solution. Each costs more.
- Challenge contexts vary — same concept presented with different variable names, different problem domains, different framings.

### Cognitive Load → Progressive Complexity, One Concept Per Node

- Each node in the skill tree teaches exactly one concept.
- Beginners see worked examples with inline annotations before attempting challenges.
- Advanced learners get open-ended problems (expertise reversal effect).
- UI is clean and minimal — no split attention between code, instructions, and game UI.
- Explanations are embedded in the code (inline comments, highlighted lines), not in a separate panel.

### Zone of Proximal Development → Adaptive Difficulty + AI Hints

- The system estimates each learner's current ability per concept area based on challenge history.
- Challenge selection targets the ZPD — not too easy (boring), not too hard (frustrating).
- The AI hint system is scaffolding: it reduces degrees of freedom without giving the answer.
- Scaffold fading: as a learner demonstrates mastery, hints become less specific and eventually unavailable.
- If a learner fails 3+ times, the system offers a simpler version of the challenge rather than repeating the same one.

### Elaborative Interrogation → AI Tutor "Explain" Prompts

- After solving a challenge, the AI occasionally asks: "Can you explain why you chose this approach?"
- Before revealing a concept's explanation, prompt: "What do you think will happen when this code runs?"
- "Explain this code to a beginner" mode — the learner types an explanation, and the AI evaluates it for accuracy and completeness.
- Socratic mode for struggling learners: rather than explaining, the AI asks a sequence of guiding questions.

### Sleep and Consolidation → Session Scheduling and Streak Design

- Daily streaks reward showing up each day, not total time spent in a single session.
- After 45–60 minutes of active learning, suggest a break: "Your brain needs time to consolidate. Come back tomorrow for better retention."
- No mechanics that incentivize sleep-depriving marathons (no "study for 4 hours straight" achievements).
- Ideal session: 20–40 minutes of new material + reviews. Short, focused, and daily.
- Optional "evening review" reminder — studying before sleep improves overnight consolidation.

### Concrete-Abstract-Concrete → Lesson Structure

- Every concept node follows: concrete example → abstract principle → new concrete challenge.
- The initial example is annotated and runnable.
- The abstract principle is stated concisely (1–3 sentences, not a textbook paragraph).
- The challenge is a genuinely new scenario, not a trivial variation of the example.

---

## References

- Bjork, R. A. (1994). Memory and metamemory considerations in the training of human beings. In J. Metcalfe & A. Shimamura (Eds.), *Metacognition: Knowing about knowing* (pp. 185–205). MIT Press.
- Bruner, J. S. (1966). *Toward a Theory of Instruction*. Harvard University Press.
- Cepeda, N. J., Pashler, H., Vul, E., Wixted, J. T., & Rohrer, D. (2006). Distributed practice in verbal recall tasks: A review and quantitative synthesis. *Psychological Bulletin*, 132(3), 354–380.
- Chi, M. T. H., Bassok, M., Lewis, M. W., Reimann, P., & Glaser, R. (1989). Self-explanations: How students study and use examples in learning to solve problems. *Cognitive Science*, 13(2), 145–182.
- Dunlosky, J., Rawson, K. A., Marsh, E. J., Nathan, M. J., & Willingham, D. T. (2013). Improving students' learning with effective learning techniques: Promising directions from cognitive and educational psychology. *Psychological Science in the Public Interest*, 14(1), 4–58.
- Ebbinghaus, H. (1885). *Über das Gedächtnis: Untersuchungen zur experimentellen Psychologie*. Duncker & Humblot.
- Kalyuga, S., Ayres, P., Chandler, P., & Sweller, J. (2003). The expertise reversal effect. *Educational Psychologist*, 38(1), 23–31.
- Karpicke, J. D., & Blunt, J. R. (2011). Retrieval practice produces more learning than elaborative studying with concept mapping. *Science*, 331(6018), 772–775.
- Mednick, S., Nakayama, K., & Stickgold, R. (2003). Sleep-dependent learning: A nap is as good as a night. *Nature Neuroscience*, 6(7), 697–698.
- Murre, J. M. J., & Dros, J. (2015). Replication and analysis of Ebbinghaus' forgetting curve. *PLOS ONE*, 10(7), e0120644.
- Roediger, H. L., III, & Butler, A. C. (2011). The critical role of retrieval practice in long-term retention. *Trends in Cognitive Sciences*, 15(1), 20–27.
- Rohrer, D., & Taylor, K. (2007). The shuffling of mathematics problems improves learning. *Instructional Science*, 35(6), 481–498.
- Slamecka, N. J., & Graf, P. (1978). The generation effect: Delineation of a phenomenon. *Journal of Experimental Psychology: Human Learning and Memory*, 4(6), 592–604.
- Stickgold, R., & Walker, M. P. (2013). Sleep-dependent memory triage: Evolving generalization through selective processing. *Nature Neuroscience*, 16(2), 139–145.
- Sweller, J. (1988). Cognitive load during problem solving: Effects on learning. *Cognitive Science*, 12(2), 257–285.
- Taylor, K., & Rohrer, D. (2010). The effects of interleaved practice. *Applied Cognitive Psychology*, 24(6), 837–848.
- Vygotsky, L. S. (1978). *Mind in Society: The Development of Higher Psychological Processes*. Harvard University Press.
- Walker, M. P. (2017). *Why We Sleep: Unlocking the Power of Sleep and Dreams*. Scribner.
- Wood, D., Bruner, J. S., & Ross, G. (1976). The role of tutoring in problem solving. *Journal of Child Psychology and Psychiatry*, 17(2), 89–100.
- Wozniak, P. A. (1990). *Optimization of learning: Application of a computer-based model of memory*. University of Technology in Poznan.
- Ye, J. (2023). A stochastic shortest path algorithm for optimizing spaced repetition scheduling. *Proceedings of the 28th ACM SIGKDD Conference on Knowledge Discovery and Data Mining*.
