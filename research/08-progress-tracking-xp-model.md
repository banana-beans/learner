# 08 -- Progress Tracking & XP Model Design

> Research Document 08 of 12 | Learner App Research Phase
> Last updated: 2026-04-09

---

## Overview

This document specifies the complete XP and progress tracking system for Learner. It covers the philosophy behind every number, the exact formulas, streak mechanics, leveling curve, reward schedule, analytics tracking, visualization, anti-gaming protections, and data models. The goal is a system where XP reliably signals growing competence, where early progress feels fast and rewarding, where long-term mastery feels genuinely earned, and where no legitimate learning activity ever goes unrewarded.

Every design decision here traces back to the motivational research in documents 00 and 01 -- particularly Self-Determination Theory (competence signaling), Flow Theory (difficulty calibration), and the Overjustification Effect (avoiding reward systems that crowd out intrinsic motivation).

---

## 1. XP System Design Philosophy

### 1.1 XP Signals Competence, Not Compliance

The single most important principle: XP exists to make the user feel competent, not to control their behavior. This distinction comes directly from Deci & Ryan's Self-Determination Theory (see doc 01, Section 1.2). Feedback that signals growing ability enhances intrinsic motivation. Feedback perceived as controlling -- "do this to get points" -- undermines it.

Concretely, this means:

- XP messages should emphasize what the user demonstrated, not what they earned. "You solved a recursion challenge on your first try" matters more than "+150 XP."
- XP should never be the primary reason someone does an activity. If users start optimizing for XP instead of learning, the system has failed. The system should make gaming XP harder than actually learning (see Section 8).
- Every XP source should map to a genuine learning behavior. There is no XP for watching a video passively, sharing on social media, or inviting friends. Those are engagement metrics, not competence indicators.

### 1.2 Fast Start, Long Tail

The leveling curve (Section 4) is designed so that early levels come quickly -- within the first session or two -- while later levels require sustained effort over weeks or months. This is not arbitrary. The psychology is well-established:

- **Early wins build self-efficacy.** Bandura (1977) demonstrated that mastery experiences are the strongest source of self-efficacy beliefs. A user who levels up twice in their first session develops a belief that they can succeed in this system. That belief predicts persistence far more than the XP number itself.
- **Long-tail difficulty sustains Flow.** Csikszentmihalyi's Flow model (see doc 01, Section 2) requires that challenge scales with skill. If a user with 200 hours of practice levels up as easily as a user with 2 hours, the system has stopped signaling competence. The exponent in the leveling formula (1.8) was chosen to maintain this signal through at least a year of daily use.
- **Meaningful milestones prevent the "so what?" problem.** If reaching level 50 only takes a month, it does not feel meaningful. If it takes 6-8 months, it represents real dedication and skill. The user knows it, and anyone who sees the badge knows it too.

### 1.3 No Wasted Effort

Every learning activity in the app awards XP -- no exceptions. Getting a spaced repetition card wrong still earns 10 XP because the user showed up and attempted recall. Logging in earns 20 XP because consistency matters. Using hints reduces XP but never eliminates it, because learning with hints is still learning.

The psychological reasoning: learned helplessness (Seligman, 1967) develops when effort consistently produces no result. If a struggling user spends 15 minutes on a challenge, uses all three hint tiers, and finally solves it -- but gets 0 XP -- they learn that effort does not pay off. That user will disengage. Instead, they should get reduced but nonzero XP, with a message like "You solved it! Using hints reduced your XP, but the learning still counts."

### 1.4 Multipliers Reward the Right Behaviors

The multiplier system (streaks, first-attempt, speed, no-hint) is designed to reward three behaviors that research associates with deeper learning:

1. **Consistency (streak multiplier).** Distributed practice is one of the most robust findings in cognitive psychology (Cepeda et al., 2006 -- see doc 00). Daily engagement, even for 10 minutes, produces better retention than weekly cramming sessions. The streak multiplier makes daily practice progressively more rewarding.

2. **Mastery (first-attempt bonus).** Solving a problem on the first try signals genuine understanding rather than trial-and-error. The 50% bonus is substantial enough to feel rewarding but not so large that users become afraid to submit imperfect answers.

3. **Fluency (speed bonus).** Speed of accurate recall is a valid indicator of knowledge consolidation (Roediger & Karpicke, 2006). The speed bonus rewards fluency while guarding against premature submission (see anti-gaming, Section 8).

### 1.5 Hint Penalties Are Moderate

Hints exist to support learning. Penalizing them too heavily discourages their use, and a user who is stuck and refuses to use hints out of XP anxiety is not learning -- they are suffering. The penalty tiers (10%, 25%, 50%) are designed so that:

- A Tier 1 "nudge" hint (a gentle push in the right direction) barely affects XP. Using it is almost free.
- A Tier 2 "guide" hint (step-by-step guidance) costs a noticeable but not devastating amount.
- A Tier 3 "reveal" hint (showing the solution) halves XP. This is significant but still leaves the user with half credit -- because reading and understanding a solution is a legitimate learning activity.

Penalties are applied to the base XP *before* bonuses. This is intentional: a user who uses a hint but has a strong streak should still benefit from their consistency multiplier. The penalty reduces what the activity is worth; the multiplier rewards how the user has been approaching learning overall.

---

## 2. XP Sources -- Complete Specification

### 2.1 Activity XP Table

| Activity | Base XP | Formula | Notes |
|----------|---------|---------|-------|
| Complete a lesson | 50-150 | `50 + (tier - 1) * 20` | Tier 1 = 50, Tier 6 = 150 |
| Pass a challenge | 100-500 | `difficulty_stars * 100` | 1-star = 100, 5-star = 500 |
| First-attempt bonus | +50% | `base * 1.5` | Only if passed on first submit |
| Speed bonus | +25% | `base * 1.25` | If completed in < 50% of estimated time |
| No-hint bonus | +10% | `base * 1.1` | If zero hints were used |
| Hint penalty (Tier 1) | -10% | `base * 0.9` | Nudge hint used |
| Hint penalty (Tier 2) | -25% | `base * 0.75` | Guide hint used |
| Hint penalty (Tier 3) | -50% | `base * 0.5` | Reveal hint used |
| Spaced rep card (correct) | 30 | flat | Per card reviewed correctly |
| Spaced rep card (incorrect) | 10 | flat | Still rewarded -- showed up and tried |
| Daily login | 20 | flat | Awarded once per day on first app open |
| Capstone project | 1000-2500 | per project | Set individually per project definition |
| Achievement XP | varies | per achievement | 50-500 depending on achievement rarity |

### 2.2 Bonus Stacking Rules

Bonuses stack **multiplicatively**. Penalties are applied **before** bonuses. The full formula:

```
hint_penalty = max penalty from hints used (only the worst tier counts, not cumulative)
adjusted_base = raw_base * (1 - hint_penalty)
final_xp = floor(adjusted_base * first_attempt * speed * no_hint * streak_multiplier)
```

**Important detail:** Only the highest hint penalty applies. If a user opens a Tier 1 hint and then a Tier 3 hint, the penalty is 50% (Tier 3), not 60% (Tier 1 + Tier 3). This avoids punishing users who escalate through hints progressively, which is actually the intended usage pattern.

### 2.3 Worked Examples

**Example 1: Perfect run on a 3-star challenge with a 7-day streak.**
- Raw base: 300 (3 stars * 100)
- No hints: adjusted_base = 300
- First attempt: 300 * 1.5 = 450
- Speed bonus: 450 * 1.25 = 562.5
- No-hint bonus: 562.5 * 1.1 = 618.75
- Streak (7 days = 1.5x): 618.75 * 1.5 = 928.125
- Final: **928 XP**

**Example 2: Struggled through a 2-star challenge, used Tier 2 hint, 3-day streak.**
- Raw base: 200
- Tier 2 hint: 200 * 0.75 = 150
- Not first attempt: no bonus (1.0x)
- Not fast: no bonus (1.0x)
- Hint used: no no-hint bonus (1.0x)
- Streak (3 days = 1.25x): 150 * 1.25 = 187.5
- Final: **187 XP**

**Example 3: Easy lesson, no streak, used reveal hint.**
- Raw base: 50 (Tier 1 lesson)
- Tier 3 hint: 50 * 0.5 = 25
- Streak broken (day 1 back = 0.8x): 25 * 0.8 = 20
- Final: **20 XP** (still nonzero -- effort counts)

---

## 3. Streak Multiplier System

### 3.1 Multiplier Tiers

| Streak Days | Multiplier | Visual | Color |
|-------------|-----------|--------|-------|
| 0 (broken) | 0.8x | No flame | -- |
| 1-2 | 1.0x | Small flame | Gray |
| 3-6 | 1.25x | Medium flame | Orange |
| 7-13 | 1.5x | Large flame | Orange |
| 14-29 | 2.0x | Large flame | Blue |
| 30-59 | 2.5x | Large flame | Purple |
| 60-99 | 3.0x | Large flame | Gold |
| 100+ | 3.5x | Legendary flame | Animated rainbow |

### 3.2 Streak Break & Recovery

When a streak breaks (user misses a day without a freeze), the consequences are designed to sting but not devastate:

- **Day of return (day 0 of new streak):** 0.8x multiplier. This is the only "penalty" -- a 20% reduction on the first day back. It makes breaking a streak feel costly enough to care about, but not so costly that the user thinks "I already lost my streak, why bother coming back?"
- **Day 1 of new streak:** Multiplier resets to 1.0x. From here, the user climbs the ladder again normally.

The 0.8x on the return day serves a specific psychological function: loss aversion (Kahneman & Tversky, 1979) means the pain of losing a streak is felt roughly twice as strongly as the pleasure of building one. A 0.8x penalty on one day is a gentle reminder, not a punishment. Harsher penalties (like zeroing out XP for a day or resetting level progress) would trigger disengagement rather than re-engagement.

### 3.3 Streak Freezes

Streak freezes protect against life getting in the way -- illness, travel, busy days at work.

- **Earning freezes:** 1 freeze is awarded automatically for every completed 7-day streak.
- **Banking:** Users can hold up to 5 freezes at a time.
- **Auto-use:** When a user misses a day, a freeze is consumed automatically if available. The streak counter pauses (does not increment) but does not break. The multiplier stays at its current tier.
- **Transparency:** The app should clearly show how many freezes the user has banked and when one was used. "Your streak was saved! (4 freezes remaining)"

The 5-freeze cap prevents infinite stockpiling. A user with a 100-day streak has earned roughly 14 freezes but can only hold 5. This means even dedicated users need to stay relatively consistent -- they cannot bank 3 months of freezes and then take a month off.

### 3.4 What Counts as a "Day"

A streak day requires completing at least one XP-earning activity (not counting the daily login bonus). Simply opening the app does not count. This prevents the degenerate case where a user opens the app every day for the login XP, maintains a huge streak multiplier, and then cashes it in on a single big challenge. The daily login XP (20 XP) is awarded regardless, but a streak day requires a lesson, challenge, or review session.

---

## 4. Level Curve Design

### 4.1 The Formula

```
total_xp_for_level(n) = floor(100 * n^1.8)
xp_to_next_level(n) = total_xp_for_level(n + 1) - total_xp_for_level(n)
```

### 4.2 Level Table

| Level | Total XP Required | XP to Next Level | Title | Est. Days at 200 XP/day |
|-------|-------------------|------------------|-------|--------------------------|
| 1 | 100 | 248 | Newcomer | 1 |
| 2 | 348 | 343 | Newcomer | 2 |
| 3 | 691 | 430 | Newcomer | 4 |
| 5 | 1,672 | 586 | Initiate | 9 |
| 10 | 6,310 | 1,035 | Apprentice | 32 |
| 15 | 12,743 | 1,449 | Apprentice | 64 |
| 20 | 20,893 | 1,838 | Journeyman | 105 |
| 25 | 30,674 | 2,208 | Journeyman | 154 |
| 30 | 41,987 | 2,564 | Craftsman | 210 |
| 40 | 68,836 | 3,244 | Craftsman | 345 |
| 50 | 100,000 | 3,884 | Specialist | 500 |
| 60 | 135,137 | 4,493 | Expert | 676 |
| 75 | 196,843 | 5,365 | Master | 985 |
| 100 | 398,107 | -- | Grandmaster | 1,991 |

*Note: All values computed from `floor(100 * n^1.8)`. XP-to-next is the delta to level n+1. Days are ceiling(total_xP / 200). Actual progression will be faster than shown because streak multipliers and skill improvements increase effective daily XP over time.*

### 4.3 Title Progression

| Level Range | Title |
|-------------|-------|
| 1-4 | Newcomer |
| 5-9 | Initiate |
| 10-19 | Apprentice |
| 20-29 | Journeyman |
| 30-49 | Craftsman |
| 50-59 | Specialist |
| 60-74 | Expert |
| 75-99 | Master |
| 100 | Grandmaster |

### 4.4 Why 1.8 as the Exponent

The exponent 1.8 was chosen after considering several alternatives:

**Linear (exponent 1.0):** Every level requires the same amount of XP. This produces no sense of acceleration early on and no sense of accomplishment later. Level 50 feels exactly like level 5 with more hours invested. Boring.

**Quadratic (exponent 2.0):** The classical choice. The problem is the mid-game: levels 20-50 become genuinely grindy. At 2.0, level 50 requires 250,000 XP (vs. 100,000 at 1.8). That is 1,250 days at 200 XP/day -- over 3 years. Most users will quit before reaching it, which means the title system above level 30 becomes decorative rather than motivational.

**Square root-ish (exponent 1.5):** Too fast at high levels. Level 100 would require only ~31,623 XP, reachable in about 5 months at a moderate pace. The title "Grandmaster" loses its weight when it is achievable in half a year.

**Exponential (e.g., `100 * 2^(n/10)`):** Catastrophically punishing. Level 50 would require over 3 million XP. Nobody would ever reach it. The system collapses into irrelevance.

**Fibonacci-based:** Produces uneven jumps between levels that feel arbitrary. Some levels would take twice as long as the previous one, while others would take only 50% longer. The inconsistency is disorienting.

**The 1.8 sweet spot** produces these properties:
- First 5 levels in roughly 1-2 weeks of casual use (fast start, early wins).
- Level 10 (Apprentice) in about a month of regular use (first meaningful milestone).
- Level 25 (Journeyman) in about 5 months -- represents real commitment.
- Level 50 (Specialist) in about 16-17 months with regular use -- a genuine achievement.
- Level 100 (Grandmaster) takes about 5.5 years at 200 XP/day -- this is intentionally aspirational. With streak multipliers boosting effective XP, a dedicated user could realistically reach it in 2-3 years. That feels right: Grandmaster should be rare.

---

## 5. Level-Up Rewards

### 5.1 Reward Schedule

| Milestone | Reward Type | Description |
|-----------|------------|-------------|
| Every level | Animation + sound | Full-screen celebration with particle effects. "+1 Level" banner with new level number. Satisfying audio chime. Lasts 2-3 seconds, then dismissible. |
| Every 5 levels | Theme unlock | New app color theme. At least 10 themes available (e.g., Midnight, Solarized, Forest, Ocean, Sakura, Amber, Neon, Arctic, Sunset, Obsidian). User can switch between unlocked themes in settings. |
| Every 10 levels | Avatar frame | Profile picture border style. Progressively more elaborate: simple circle at level 10, geometric patterns at 20-30, animated glow at 40+, particle effects at 70+. |
| Every 25 levels | Title badge | Displayable title that appears next to the user's name. Level 25 = "Journeyman," Level 50 = "Specialist," Level 75 = "Master." These are shown in any future social/leaderboard features. |
| Level 50 | Special badge | "Halfway There" legendary achievement badge. Unique animated icon. This milestone is highlighted because psychologically it is the point where a user has demonstrated sustained commitment. |
| Level 100 | Trophy | "Grandmaster" completion badge. The app's ultimate achievement. Unique animated profile frame, exclusive theme, and permanent recognition in any leaderboard or social feature. |

### 5.2 Design Principles for Rewards

- **No pay-to-unlock.** Every reward is earned through learning. This is non-negotiable. The moment rewards become purchasable, XP stops signaling competence and starts signaling spending.
- **Cosmetic only.** Rewards never grant gameplay advantages (e.g., extra hints, easier challenges). They are trophies, not tools. This prevents a scenario where high-level users have an easier time than low-level users, which would undermine the competence signal.
- **Visible to the user, visible to others (eventually).** Themes and frames are immediately useful (the user sees them every time they open the app). Title badges become useful when social features are added. Designing them now ensures they are ready when needed.
- **Progressive elaboration.** Early rewards are simple (a color theme). Later rewards are more visually impressive (animated frames, particle effects). This mirrors the increasing effort required to earn them and makes higher-level rewards feel proportionally more special.

---

## 6. Session Analytics & Daily Goals

### 6.1 Per-Session Tracking

Every time a user opens the app and engages in learning, the following data is captured:

- **Session duration:** Start time to last activity time (not app close time -- idle time beyond 5 minutes is excluded).
- **Lessons completed:** Count of lessons finished in this session.
- **Challenges attempted / passed:** Both numbers matter. Attempts without passes indicate struggle points. Passes without many attempts indicate mastery.
- **Review cards reviewed:** Total cards seen in spaced repetition sessions.
- **XP earned:** Broken down by source (lesson XP, challenge XP, review XP, bonus XP from multipliers). This breakdown allows the user to see where their XP is coming from and helps identify engagement patterns.
- **Streak status:** Whether this session maintained the streak, and the current streak length.

### 6.2 Per-Day Tracking

At the end of each calendar day (midnight in the user's local timezone):

- **Total XP:** Sum of all XP events for the day.
- **Activities completed:** Count by type (lessons, challenges, reviews, login).
- **Time spent:** Sum of session durations.
- **Streak maintained?:** Boolean. Did the user complete at least one qualifying activity?

### 6.3 Per-Week and Per-Month Aggregations

These are computed on demand (not stored separately) from the daily data:

- **XP trend:** Line or bar chart showing daily XP over the period. Users can see whether they are accelerating, maintaining, or declining.
- **Completion rate:** Challenges passed divided by challenges attempted. A declining completion rate might indicate the user is taking on too-difficult material. A very high rate (>95%) might indicate they are staying in the comfort zone.
- **Strongest branch:** The skill branch (e.g., "JavaScript Fundamentals," "Data Structures") where the user has earned the most XP this period. Highlights current focus.
- **Weakest area:** The branch with the lowest challenge pass rate. This is where the user might need to review or slow down.
- **Consistency score:** Days active divided by total days in the period. A consistency score of 5/7 (71%) is "Regular." 7/7 (100%) is "Perfect." Below 3/7 (43%) triggers a gentle nudge.

### 6.4 Daily Goals

The app offers a daily XP goal system with three preset tiers:

| Goal Tier | Daily XP Target | Time Estimate | Persona |
|-----------|----------------|---------------|---------|
| Casual | 100 XP | ~10 minutes | Busy professional, checking in on the train |
| Regular | 200 XP | ~20 minutes | Daily commuter, steady learner |
| Dedicated | 500 XP | ~45 minutes | Focused learner, building skills actively |

Users select their goal tier in onboarding and can change it anytime. The daily goal circle (see Section 7) fills as the user earns XP. Reaching the goal triggers a small celebration animation and ensures the streak is maintained.

The goal is a **target**, not a cap. Users can always earn more XP than their daily goal. There is no UI that says "You've reached your goal, come back tomorrow." The goal exists to set expectations and provide a sense of completion for the session.

---

## 7. Progress Visualization

### 7.1 XP Bar (Persistent)

Always visible in the navigation bar. Shows:
- Current level number
- Current XP within the level (e.g., "340 / 1,035 XP")
- Progress bar filling from left to right
- On XP gain: the bar animates smoothly, numbers tick up, and a small "+N XP" floats up from the bar

This is the most frequently seen progress indicator. It must be satisfying to watch. The animation should be smooth (CSS transition, 300-500ms) and the color should shift subtly as it fills (e.g., from blue to bright blue to gold as it nears full).

### 7.2 Streak Calendar

A GitHub-style contribution graph visible on the user's profile/stats page. Each day is a small square:
- **Green:** Active day (at least one qualifying activity completed).
- **Light green:** Active day where daily goal was partially met (e.g., < 50% of goal).
- **Bright green:** Active day where daily goal was met or exceeded.
- **Gray:** Inactive day.
- **Blue border:** Day where a streak freeze was used.

The calendar shows the past 12 weeks (84 days) by default, with the option to expand to full year. Hovering/tapping a day shows that day's XP total and activity summary.

### 7.3 Branch Progress

Each skill branch (e.g., "JavaScript Fundamentals") shows:
- Percentage of nodes completed (lessons + challenges finished)
- Percentage of nodes mastered (all challenges passed with first-attempt bonus, all review cards at "mastered" interval)
- Visual: a horizontal bar with two colors -- one for completion, one for mastery. The mastery bar overlays the completion bar.

This dual-bar approach is important: a user can complete 100% of a branch but only master 60% of it. This gives them a reason to revisit material without feeling like they are "redoing" completed content.

### 7.4 Weekly XP Chart

A bar chart (built with Recharts or similar) showing daily XP for the current week compared to the previous week. Each day has two bars: this week (filled color) and last week (outline or lighter color). This comparison view immediately communicates trend direction without requiring the user to read numbers.

Below the chart: a simple summary line like "This week: 1,240 XP (+18% vs last week)" or "This week: 680 XP (-12% vs last week)."

### 7.5 Achievement Showcase

A grid of achievement badges. Earned badges are shown in full color with the date earned. Unearned badges are shown as dark silhouettes with a "?" label -- the user can tap to see the name and requirements, or the requirements can be hidden for "secret" achievements (discovered through natural play).

Categories of achievements:
- **Milestone:** Level-based (reach level 10, 25, 50, etc.)
- **Streak:** Consistency-based (7-day streak, 30-day streak, 100-day streak)
- **Mastery:** Skill-based (master a branch, pass a 5-star challenge, achieve 90%+ review accuracy)
- **Exploration:** Breadth-based (start 5 different branches, complete lessons in 3 languages)
- **Special:** One-time events (first challenge completed, first perfect day, midnight coder -- activity between midnight and 4 AM)

### 7.6 Learning Stats Summary

A stats card on the profile page showing lifetime numbers:
- Total lessons completed
- Total challenges passed (with pass rate)
- Total review cards reviewed (with accuracy)
- Total learning hours
- Current streak / longest streak
- Current level + total XP
- Member since date

---

## 8. Anti-Gaming Measures

The XP system must reward genuine learning, not optimization of the XP system itself. The following measures prevent common gaming strategies while minimizing friction for legitimate users.

### 8.1 Diminishing Returns on Repetition

Re-completing a previously completed lesson or challenge awards only **10% of the original XP**. This prevents a user from grinding a single easy lesson or challenge repeatedly to farm XP.

The 10% is not zero because re-reading a lesson or re-solving a challenge has some review value -- it reinforces memory. But it is low enough that it is never the optimal strategy compared to doing new content.

If a user re-attempts a previously failed challenge and passes it, they earn **full XP** for the first pass. The diminishing return only applies to content already passed.

### 8.2 First-Pass-Only Challenge XP

Challenge XP (100-500 base) is only awarded on the first successful completion. If a user fails a challenge 5 times and then passes on attempt 6, they earn full XP for the pass but no bonuses for first-attempt or speed. If they then re-pass the same challenge, they earn 10% XP.

This prevents the strategy of intentionally failing challenges to learn the expected output, then "passing" on the next attempt with memorized answers.

### 8.3 Speed Bonus Minimum Time

The speed bonus (+25% for completing in under 50% of estimated time) has a floor: the user must have spent at least **30 seconds** on the challenge (for 1-star) up to **2 minutes** (for 5-star) to qualify for the speed bonus. This prevents submitting pre-written code or copy-pasting solutions.

The minimum times by difficulty:
| Stars | Minimum Time for Speed Bonus |
|-------|------------------------------|
| 1 | 30 seconds |
| 2 | 45 seconds |
| 3 | 60 seconds |
| 4 | 90 seconds |
| 5 | 120 seconds |

### 8.4 Daily Diminishing Returns (Not a Cap)

There is **no hard daily XP cap**. Punishing a user who wants to spend 3 hours learning is wrong. However, after 500 XP earned in a single day, subsequent XP earnings are scaled:

| Daily XP Earned So Far | Scaling on Additional XP |
|------------------------|--------------------------|
| 0-500 | 100% (full) |
| 501-1000 | 90% |
| 1001-1500 | 80% |
| 1501-2000 | 70% |
| 2000+ | 60% |

This produces soft diminishing returns. A user who earns 1,000 XP in a day gets the first 500 at full value and the next 500 at 90%, for an effective total of 950 XP. The signal to the user is: "You're doing great, but the XP system values consistency over marathon sessions." Since the streak multiplier rewards daily return, the optimal strategy remains daily engagement -- which is also the optimal learning strategy (spaced practice).

### 8.5 Review Card Integrity

Spaced repetition card XP (30 for correct, 10 for incorrect) is capped at **50 cards per day**. Beyond 50 cards, no additional XP is earned (though the user can still review -- the learning value remains). This prevents farming the review system for easy XP.

50 cards at 30 XP each = 1,500 XP maximum from reviews per day, but in practice most users will review 10-20 cards. The cap exists to prevent automated or mindless clicking.

---

## 9. Data Model

### 9.1 Core Types

```typescript
type XPSource = 'lesson' | 'challenge' | 'review' | 'login' | 'project' | 'achievement';

type XPEvent = {
  id: string;                // UUID
  userId: string;            // Reference to user
  timestamp: Date;           // When XP was awarded
  source: XPSource;          // What type of activity
  sourceId: string;          // ID of the specific lesson/challenge/card/etc.
  baseXP: number;            // Raw XP before multipliers and penalties
  hintPenalty: number;       // 0.0 to 0.5 (0 = no penalty, 0.5 = Tier 3 reveal)
  adjustedBase: number;      // baseXP * (1 - hintPenalty)
  multipliers: {
    streak: number;          // 0.8x to 3.5x
    firstAttempt: number;    // 1.0 or 1.5
    speed: number;           // 1.0 or 1.25
    noHint: number;          // 1.0 or 1.1
  };
  dailyScaling: number;      // 0.6 to 1.0 (diminishing returns)
  finalXP: number;           // The actual XP credited to the user
};

type StreakData = {
  currentStreak: number;     // Days in current streak
  longestStreak: number;     // All-time record
  lastActiveDate: string;    // ISO date string (YYYY-MM-DD)
  freezesAvailable: number;  // 0-5
  freezeUsedDates: string[]; // Dates where freezes were auto-consumed
  multiplier: number;        // Current streak multiplier (computed from currentStreak)
};

type UserStats = {
  userId: string;
  totalXP: number;
  level: number;             // Computed from totalXP via the leveling formula
  xpInCurrentLevel: number;  // totalXP - total_xp_for_level(level)
  xpToNextLevel: number;     // total_xp_for_level(level + 1) - totalXP
  streak: StreakData;
  sessionsCompleted: number;
  totalLearningMinutes: number;
  challengeStats: {
    attempted: number;
    passed: number;
    perfectScore: number;    // Passed on first attempt
  };
  reviewStats: {
    reviewed: number;        // Total cards reviewed
    correct: number;         // Total correct
    currentAccuracy: number; // Rolling 7-day accuracy percentage
  };
  memberSince: Date;
};

type DailyLog = {
  userId: string;
  date: string;              // ISO date (YYYY-MM-DD)
  totalXP: number;
  xpBySource: Record<XPSource, number>;
  lessonsCompleted: number;
  challengesAttempted: number;
  challengesPassed: number;
  cardsReviewed: number;
  minutesActive: number;
  streakMaintained: boolean;
  dailyGoalMet: boolean;
};

type SessionLog = {
  id: string;
  userId: string;
  startTime: Date;
  endTime: Date;
  durationMinutes: number;   // Excludes idle time > 5 minutes
  xpEarned: number;
  activities: {
    type: XPSource;
    sourceId: string;
    xpEarned: number;
    timestamp: Date;
  }[];
};
```

### 9.2 Level Computation

The level is always computed from `totalXP`, never stored independently. This prevents desync issues and means the leveling formula can be adjusted without migrating stored levels.

```typescript
function computeLevel(totalXP: number): number {
  // Inverse of: totalXP = floor(100 * level^1.8)
  // level = (totalXP / 100) ^ (1/1.8)
  let level = Math.floor(Math.pow(totalXP / 100, 1 / 1.8));
  // Verify and adjust (floating point edge cases)
  while (Math.floor(100 * Math.pow(level + 1, 1.8)) <= totalXP) {
    level++;
  }
  return Math.max(level, 1);
}

function xpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.8));
}

function xpToNextLevel(totalXP: number): number {
  const currentLevel = computeLevel(totalXP);
  return xpForLevel(currentLevel + 1) - totalXP;
}
```

### 9.3 Streak Multiplier Computation

```typescript
function getStreakMultiplier(streakDays: number, isBrokenReturn: boolean): number {
  if (isBrokenReturn) return 0.8;  // First day back after a break
  if (streakDays >= 100) return 3.5;
  if (streakDays >= 60) return 3.0;
  if (streakDays >= 30) return 2.5;
  if (streakDays >= 14) return 2.0;
  if (streakDays >= 7) return 1.5;
  if (streakDays >= 3) return 1.25;
  return 1.0;  // streakDays 1-2
}
```

---

## 10. Simulation & Balancing

### 10.1 Typical Week Models

Three user personas, modeled over their first month:

**Casual User (10 min/day):**
- Typical session: 1 lesson (50 XP) + 5 review cards (5 * 30 = 150 XP) + login (20 XP) = ~100 XP base
- With building streak (avg 1.15x over the month): ~115 XP/day effective
- Month 1 total: ~3,450 XP
- Level reached: Level 5 (Initiate). XP for level 5 is 1,672; XP for level 6 is 2,258.
- The casual user has made visible progress, earned the "Initiate" title, and unlocked a theme.

**Regular User (20 min/day commute):**
- Typical session: 1 lesson (70 XP avg) + 1 challenge (200 XP avg) + 10 review cards (10 * 25 avg = 250 XP) + login (20 XP) = ~250 XP base
- With streak (avg 1.3x over the month): ~325 XP/day effective (accounting for ramp-up)
- With occasional first-attempt and no-hint bonuses: ~200-250 XP/day net average
- Month 1 total: ~7,500 XP
- Level reached: Level 10-11 (Apprentice). First avatar frame unlocked at level 10.
- The regular user feels genuine progress. They are past the "newcomer" phase and into substantive content.

**Dedicated User (45+ min/day):**
- Typical session: 2 lessons (140 XP) + 2-3 challenges (600 XP avg) + 15 review cards (15 * 25 = 375 XP) + login (20 XP) = ~500 XP base
- With strong streak (avg 1.6x): ~800 XP/day
- Diminishing returns reduce effective daily average to ~650 XP/day
- Month 1 total: ~19,500 XP
- Level reached: Level 17-18 (Apprentice, approaching Journeyman). Multiple themes, avatar frame at level 10.
- The dedicated user is rewarded for their investment but has not "beaten" the system. Level 100 is still years away.

### 10.2 One-Year Stress Test

**Regular user, 200 XP/day effective average, 365 days:**

- Total XP: 73,000
- Level reached: approximately level 42-43 (Craftsman)
- This is in the "Craftsman" title range, which feels right. One year of daily practice should produce a "Craftsman" -- someone who knows their tools well but is not yet a specialist or expert.
- At this pace, the user would have completed approximately 2-3 full skill branches (assuming each branch is ~50-80 nodes and each node averages ~100 XP including challenges and reviews).
- The user would have earned 52+ streak freezes (one per 7-day streak) but can only hold 5 at a time.
- Their streak multiplier, if maintained, would be at 3.5x (100+ day streak), effectively tripling their XP rate. This acceleration means the actual level reached would be higher than the raw 200 XP/day estimate -- probably level 45-50 with sustained streaks.

**Does it feel right?** Yes. One year of daily practice reaching "Specialist" (level 50) aligns with the popular "1,000 hours" concept for meaningful skill development (though the actual science is more nuanced -- see Ericsson, 1993). It is a real achievement that reflects genuine commitment.

### 10.3 Edge Cases

**Speed runner (maximum daily XP, every day):** A user who completes 5 lessons (750 XP), 5 challenges (1,500 XP), 50 review cards (1,500 XP), login (20 XP), and achievements (variable) could theoretically earn 3,770+ base XP per day. With a 3.5x streak multiplier and diminishing returns, effective daily XP might reach ~5,000-6,000. At 5,000 XP/day sustained, level 100 would take about 80 days. This is extreme but acceptable -- someone who genuinely spends 3+ hours daily for 80 days has done ~240 hours of focused learning. They have earned Grandmaster.

**Minimal engagement (login only):** 20 XP/day, no streak (fails to meet the qualifying activity requirement). At 20 XP/day, reaching level 2 (348 XP) takes 18 days. The system correctly signals that logging in without doing anything does not produce meaningful progress.

**Streak recovery after a long break:** A user with a 60-day streak (3.0x) misses a day (no freeze available). On their return: 0.8x for day one, then 1.0x, climbing back. Reaching 3.0x again takes another 60 days. This is intentionally steep -- the streak multiplier rewards sustained consistency, and rebuilding it after a break requires re-demonstrating that consistency.

---

## Application to Learner

### Final XP Specification Summary

The system described above is the complete XP model for Learner v1. The key formulas and constants are:

**XP Calculation:**
```
final_xp = floor(adjusted_base * first_attempt * speed * no_hint * streak * daily_scaling)
adjusted_base = raw_base * (1 - hint_penalty)
```

**Leveling:**
```
total_xp_for_level(n) = floor(100 * n^1.8)
```

**Streak Multiplier:** Tiered from 0.8x (broken return) to 3.5x (100+ days), with freeze protection (earn 1 per 7-day streak, bank up to 5).

### Implementation Priorities

**Phase 1 (MVP):**
- XP events table and basic XP calculation (base + hint penalty)
- Level computation from total XP
- XP bar in navbar with animation
- Basic streak tracking (current streak, multiplier)
- Per-session XP breakdown on completion

**Phase 2 (Post-Launch):**
- Streak freezes (earn, bank, auto-use)
- Full multiplier stack (first-attempt, speed, no-hint)
- Daily goals with the three-tier system
- Streak calendar visualization
- Daily and weekly analytics

**Phase 3 (Growth):**
- Achievement system with badges
- Level-up rewards (themes, frames, titles)
- Weekly/monthly trend charts
- Branch progress bars with mastery tracking
- Anti-gaming measures (diminishing returns, daily scaling, review card cap)

### Design Constraints

1. **Level is always computed, never stored.** If the formula changes, all users' levels update automatically.
2. **XP is append-only.** XP events are immutable records. Total XP is the sum of all `finalXP` values. This creates a complete audit trail and prevents the need for complex rollback logic.
3. **All times are UTC internally.** Streak days and daily logs use the user's local timezone for display but UTC for storage. Timezone is set once during onboarding and can be updated in settings.
4. **No XP removal.** XP is never taken away from a user (except through the hint penalty reducing what they earn on a given activity). There is no "XP fine" for inactivity, failed challenges, or any other reason. Removal triggers loss aversion and disengagement.
5. **Streak multiplier is transparent.** The user should always be able to see their current multiplier, how many days until the next tier, and how many freezes they have. No hidden mechanics.

---

*Next document: [09 -- Spaced Repetition Engine](./09-spaced-repetition-engine.md)*
