"use client";

import { useMemo } from "react";
import { SkillTree } from "@/components/tree/SkillTree";
import { useProgressStore } from "@/store/progress-store";
import { useUserStore } from "@/store/user-store";
import curriculum from "@/data/curriculum";
import { Badge } from "@/components/common/Badge";
import type { UserProgress } from "@/lib/types";

export default function TreePage() {
  const {
    completedNodes,
    masteredNodes,
    inProgressNodes,
    unlockedNodes,
    lessonResults,
    challengeResults,
    earnedAchievements,
  } = useProgressStore();

  const { level, totalXP } = useUserStore();

  /** Build a plain UserProgress object for the engine */
  const progress: UserProgress = useMemo(
    () => ({
      completedNodes,
      masteredNodes,
      inProgressNodes,
      unlockedNodes,
      lessonResults,
      challengeResults,
      earnedAchievements,
    }),
    [completedNodes, masteredNodes, inProgressNodes, unlockedNodes, lessonResults, challengeResults, earnedAchievements]
  );

  const totalNodes = Object.keys(curriculum.nodeMap).length;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-bold text-[var(--foreground)]">
            Skill Tree
          </h1>
          <Badge variant="blue" size="sm">
            {curriculum.branches.length} branches
          </Badge>
        </div>
        <p className="text-sm text-[var(--text-muted)]">
          Navigate your learning path across all branches. Complete nodes to
          unlock new skills.
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-3">
        <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] p-3">
          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
            Completed
          </p>
          <p className="text-lg font-black text-[var(--accent-green)] tabular-nums mt-0.5">
            {completedNodes.length}
            <span className="text-xs font-normal text-[var(--text-muted)]">
              /{totalNodes}
            </span>
          </p>
        </div>
        <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] p-3">
          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
            Mastered
          </p>
          <p className="text-lg font-black text-[var(--xp-gold)] tabular-nums mt-0.5">
            {masteredNodes.length}
          </p>
        </div>
        <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] p-3">
          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
            In Progress
          </p>
          <p className="text-lg font-black text-[var(--accent-blue)] tabular-nums mt-0.5">
            {inProgressNodes.length}
          </p>
        </div>
        <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] p-3">
          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
            Level
          </p>
          <p className="text-lg font-black text-[var(--foreground)] tabular-nums mt-0.5">
            {level}
          </p>
        </div>
      </div>

      {/* Skill tree */}
      <SkillTree curriculum={curriculum} progress={progress} />
    </div>
  );
}
