"use client";

import { useState, Suspense } from "react";
import { BranchSelector } from "@/components/skill-tree/BranchSelector";
import { SkillTree } from "@/components/skill-tree/SkillTree";
import { useProgressStore } from "@/store/progress-store";
import { getBranchProgress } from "@/engine/progression";
import { curriculum, branches } from "@/data/curriculum";
import { BRANCH_META } from "@/lib/constants";
import type { BranchId } from "@/lib/types";

function SkillTreeSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-4 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex flex-col gap-3">
          <div className="h-3 w-12 rounded bg-[var(--surface-2)]" />
          <div className="flex gap-4">
            {[1, 2, 3, 4].map((j) => (
              <div
                key={j}
                className="h-20 w-36 rounded-xl bg-[var(--surface-2)]"
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function SkillTreePage() {
  const [activeBranchId, setActiveBranchId] = useState<BranchId>("python");
  const progress = useProgressStore();

  const progressMap = Object.fromEntries(
    branches.map((b) => [b.id, getBranchProgress(b.id, progress, curriculum)])
  ) as Record<BranchId, ReturnType<typeof getBranchProgress>>;

  const activeBranch = curriculum.branches.find(
    (b) => b.id === activeBranchId
  )!;
  const branchProgress = progressMap[activeBranchId];
  const branchMeta = BRANCH_META[activeBranchId];

  return (
    <div className="min-h-full flex flex-col">
      {/* Page header */}
      <header className="px-4 py-4 border-b border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-sm sticky top-0 z-10">
        <h1 className="text-xl font-bold text-[var(--foreground)]">
          Skill Tree
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-0.5">
          <span style={{ color: branchMeta.colorHex }}>{branchMeta.title}</span>
          {" · "}
          {branchProgress.completedNodes}/{activeBranch.nodes.length} nodes
          completed
        </p>
      </header>

      {/* Branch selector */}
      <BranchSelector
        activeBranchId={activeBranchId}
        onSelect={setActiveBranchId}
        progressMap={progressMap}
      />

      {/* Skill tree — Suspense handles initial client bundle load */}
      <div className="flex-1">
        <Suspense fallback={<SkillTreeSkeleton />}>
          <SkillTree
            branch={activeBranch}
            progress={progress}
            curriculum={curriculum}
          />
        </Suspense>
      </div>
    </div>
  );
}
