"use client";

import { motion } from "framer-motion";
import type { SkillNode as SkillNodeType, NodeState } from "@/lib/types";
import { ProgressRing } from "@/components/common/ProgressRing";
import { BRANCH_META } from "@/lib/constants";

interface SkillNodeProps {
  node: SkillNodeType;
  state: NodeState;
  /** 0-1 progress fraction for in_progress state */
  progress?: number;
  onClick: (node: SkillNodeType) => void;
}

/** Icon: checkmark for completed state */
function CheckIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

/** Icon: star for mastered state */
function StarIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

/** Icon: lock for locked state */
function LockIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

export function SkillNodeComponent({ node, state, progress = 0.5, onClick }: SkillNodeProps) {
  const meta = BRANCH_META[node.branchId];
  const colorHex = meta.colorHex;

  const isLocked = state === "locked";
  const isAvailable = state === "available";
  const isInProgress = state === "in_progress";
  const isCompleted = state === "completed";
  const isMastered = state === "mastered";

  /** Build the node circle's classes based on state */
  function getCircleStyle(): React.CSSProperties {
    if (isCompleted) {
      return {
        background: colorHex,
        borderColor: colorHex,
      };
    }
    if (isMastered) {
      return {
        background: `linear-gradient(135deg, ${colorHex}, var(--xp-gold))`,
        borderColor: "var(--xp-gold)",
      };
    }
    if (isAvailable) {
      return {
        background: "var(--surface-2)",
        borderColor: colorHex,
        boxShadow: `0 0 16px ${colorHex}40, 0 0 4px ${colorHex}60`,
      };
    }
    if (isInProgress) {
      return {
        background: "var(--surface-2)",
        borderColor: `${colorHex}80`,
      };
    }
    // locked
    return {
      background: "var(--surface-2)",
      borderColor: "var(--border)",
    };
  }

  return (
    <motion.button
      onClick={() => !isLocked && onClick(node)}
      className={[
        "flex flex-col items-center gap-1.5 w-[100px] group outline-none",
        isLocked ? "opacity-40 grayscale pointer-events-none" : "cursor-pointer",
      ].join(" ")}
      whileHover={isLocked ? {} : { scale: 1.08 }}
      whileTap={isLocked ? {} : { scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
    >
      {/* Circle */}
      <div className="relative">
        {/* Pulse glow for available */}
        {isAvailable && (
          <div
            className="absolute inset-0 rounded-full animate-ping"
            style={{
              background: colorHex,
              opacity: 0.15,
            }}
          />
        )}

        {/* Mastered shimmer overlay */}
        {isMastered && (
          <div
            className="absolute -inset-1 rounded-full animate-spin"
            style={{
              background: `conic-gradient(from 0deg, transparent, var(--xp-gold), transparent)`,
              opacity: 0.3,
              animationDuration: "4s",
            }}
          />
        )}

        {/* Progress ring wrapper for in_progress */}
        {isInProgress ? (
          <ProgressRing
            value={progress}
            size={80}
            strokeWidth={4}
            color={colorHex}
          >
            <div
              className="w-[68px] h-[68px] rounded-full flex items-center justify-center border-2"
              style={getCircleStyle()}
            >
              <span className="text-[var(--foreground)] text-xs font-bold tabular-nums">
                {Math.round(progress * 100)}%
              </span>
            </div>
          </ProgressRing>
        ) : (
          <div
            className="relative z-10 w-20 h-20 rounded-full flex items-center justify-center border-2 transition-colors duration-200"
            style={getCircleStyle()}
          >
            {isLocked && (
              <span className="text-[var(--text-muted)]">
                <LockIcon />
              </span>
            )}
            {isAvailable && (
              <span className="text-[var(--foreground)] text-lg font-bold">
                T{node.tier}
              </span>
            )}
            {isCompleted && (
              <span className="text-white">
                <CheckIcon />
              </span>
            )}
            {isMastered && (
              <span className="text-white">
                <StarIcon />
              </span>
            )}
          </div>
        )}

        {/* Gold border ring for mastered */}
        {isMastered && (
          <div
            className="absolute -inset-0.5 rounded-full border-2 z-0"
            style={{ borderColor: "var(--xp-gold)" }}
          />
        )}
      </div>

      {/* Label */}
      <div className="text-center max-w-full">
        <p className="text-xs font-medium text-[var(--foreground)] leading-tight truncate px-1">
          {node.title}
        </p>
        <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
          +{node.xpReward} XP
        </p>
      </div>
    </motion.button>
  );
}
