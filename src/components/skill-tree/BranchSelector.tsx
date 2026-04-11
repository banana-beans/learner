"use client";

import { motion } from "framer-motion";
import { branches } from "@/data/curriculum";
import { BRANCH_META } from "@/lib/constants";
import type { BranchId } from "@/lib/types";
import type { BranchProgress } from "@/engine/progression";

interface BranchSelectorProps {
  activeBranchId: BranchId;
  onSelect: (branchId: BranchId) => void;
  progressMap: Partial<Record<BranchId, BranchProgress>>;
}

export function BranchSelector({
  activeBranchId,
  onSelect,
  progressMap,
}: BranchSelectorProps) {
  return (
    <div className="overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
      <motion.div layout className="flex gap-2 px-4 py-3 min-w-max">
        {branches.map((branch) => {
          const meta = BRANCH_META[branch.id];
          const progress = progressMap[branch.id];
          const isActive = branch.id === activeBranchId;
          const completedCount = progress?.completedNodes ?? 0;
          const totalCount = branch.nodes.length;
          const progressPct =
            totalCount > 0
              ? Math.round((completedCount / totalCount) * 100)
              : 0;

          return (
            <motion.button
              key={branch.id}
              layout
              onClick={() => onSelect(branch.id)}
              aria-pressed={isActive}
              className={[
                "flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap",
                "transition-all duration-150 border focus-visible:outline-2 focus-visible:outline-offset-2",
                isActive
                  ? "border-current bg-[var(--surface-2)] text-[var(--foreground)] shadow-md"
                  : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:border-[var(--accent-blue)]/40 hover:text-[var(--foreground)]",
              ].join(" ")}
              style={isActive ? { color: meta.colorHex } : undefined}
            >
              {/* Color dot */}
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ background: meta.colorHex }}
                aria-hidden="true"
              />

              {/* Branch name */}
              <span>{meta.title}</span>

              {/* Progress % */}
              <span className="text-xs opacity-60">{progressPct}%</span>

              {/* Node count */}
              <span className="text-xs opacity-40">({totalCount})</span>
            </motion.button>
          );
        })}
      </motion.div>
    </div>
  );
}
