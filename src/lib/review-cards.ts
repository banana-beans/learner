// ============================================================
// Review-card generation from lesson content
// ============================================================
// Called when a lesson is completed. Pushes one card per
// keyTakeaway and one per code example into the review queue.
// ============================================================

import type { ReviewCard, BranchId, CardType } from "@/lib/types";
import type { LessonContent } from "@/data/lessons/python-basics";
import { createCard } from "@/engine/spaced-repetition";

interface CardSeed {
  type: CardType;
  front: string;
  back: string;
  code?: string;
}

function seedsFor(lesson: LessonContent): CardSeed[] {
  const seeds: CardSeed[] = [];

  lesson.keyTakeaways.forEach((takeaway) => {
    seeds.push({
      type: "concept",
      front: `${lesson.title} — recall a key idea`,
      back: takeaway,
    });
  });

  lesson.codeExamples.forEach((example) => {
    seeds.push({
      type: "code_output",
      front: `What does this code do?\n\n(${lesson.title})`,
      back: `${example.title}\n\n${example.explanation}`,
      code: example.code,
    });
  });

  return seeds;
}

export function createCardsForLesson(
  lesson: LessonContent,
  branchId: BranchId
): ReviewCard[] {
  const seeds = seedsFor(lesson);
  return seeds.map((seed, i) =>
    createCard({
      id: `${lesson.nodeId}::card-${i}`,
      nodeId: lesson.nodeId,
      branchId,
      type: seed.type,
      front: seed.front,
      back: seed.back,
      code: seed.code,
    })
  );
}
