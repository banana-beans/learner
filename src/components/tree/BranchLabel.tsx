"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ProgressBar } from "@/components/common/ProgressBar";
import { Badge } from "@/components/common/Badge";
import type { BranchProgress } from "@/engine/progression";
import type { BranchId } from "@/lib/types";
import { BRANCH_META } from "@/lib/constants";

interface BranchLabelProps {
  branchId: BranchId;
  progress: BranchProgress;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <motion.svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      animate={{ rotate: expanded ? 180 : 0 }}
      transition={{ duration: 0.2 }}
    >
      <polyline points="6 9 12 15 18 9" />
    </motion.svg>
  );
}

export function BranchLabel({
  branchId,
  progress,
  children,
  defaultExpanded = true,
}: BranchLabelProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const meta = BRANCH_META[branchId];

  /** Map branch color string to a valid Badge variant */
  const colorToBadgeVariant: Record<string, "blue" | "cyan" | "teal" | "purple" | "orange" | "green" | "yellow" | "red" | "gold"> = {
    blue: "blue",
    cyan: "cyan",
    teal: "teal",
    purple: "purple",
    orange: "orange",
    green: "green",
    yellow: "yellow",
    red: "red",
    gold: "gold",
    sky: "cyan",
    indigo: "purple",
  };
  const badgeVariant = colorToBadgeVariant[meta.color] ?? "blue";

  return (
    <div className="mb-6">
      {/* Header (clickable to toggle) */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--surface-3)] transition-colors cursor-pointer group"
      >
        {/* Color dot */}
        <div
          className="w-3 h-3 rounded-full shrink-0"
          style={{ background: meta.colorHex }}
        />

        {/* Branch info */}
        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-2 mb-0.5">
            <h2 className="text-base font-bold text-[var(--foreground)]">
              {meta.title}
            </h2>
            {progress.isCompleted && (
              <Badge variant={badgeVariant} size="xs" filled>
                {progress.isMastered ? "Mastered" : "Complete"}
              </Badge>
            )}
          </div>
          <p className="text-xs text-[var(--text-muted)] truncate">
            {meta.description}
          </p>
        </div>

        {/* Stats */}
        <div className="hidden sm:flex items-center gap-3 shrink-0">
          <span className="text-xs text-[var(--text-secondary)] tabular-nums">
            {progress.completedNodes}/{progress.totalNodes} nodes
          </span>
        </div>

        {/* Chevron */}
        <span className="text-[var(--text-muted)] group-hover:text-[var(--foreground)] transition-colors shrink-0">
          <ChevronIcon expanded={expanded} />
        </span>
      </button>

      {/* Progress bar beneath header */}
      <div className="mt-2 px-4">
        <ProgressBar
          value={progress.completionFraction}
          color={meta.colorHex}
          height={3}
        />
        <div className="flex items-center justify-between mt-1">
          <span className="text-[10px] text-[var(--text-muted)] tabular-nums">
            {Math.round(progress.completionFraction * 100)}% complete
          </span>
          <span className="text-[10px] text-[var(--text-muted)] tabular-nums sm:hidden">
            {progress.completedNodes}/{progress.totalNodes}
          </span>
        </div>
      </div>

      {/* Collapsible tier content */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="mt-3">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
