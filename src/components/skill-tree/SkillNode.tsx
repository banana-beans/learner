"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import type { SkillNode as SkillNodeType, NodeState } from "@/lib/types";
import { Badge, XPBadge } from "@/components/common/Badge";

interface SkillNodeProps {
  node: SkillNodeType;
  state: NodeState;
  branchColor: string;
}

export function SkillNode({ node, state, branchColor }: SkillNodeProps) {
  const router = useRouter();

  const handleClick = () => {
    if (state !== "locked") {
      router.push(`/learn/${node.id}`);
    }
  };

  const isInteractive = state !== "locked";

  const containerClass = [
    "relative w-36 rounded-xl border p-3 select-none transition-all duration-200",
    "bg-[var(--surface)]",
    state === "locked"
      ? "border-[var(--border)] opacity-60 cursor-not-allowed"
      : "cursor-pointer",
    state === "completed" ? "border-green-500/60" : "",
    state === "mastered" ? "border-yellow-400 shadow-lg" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const borderStyle =
    state === "available" || state === "in_progress"
      ? { borderColor: branchColor, borderWidth: "2px" }
      : state === "mastered"
      ? { boxShadow: "0 0 16px #facc1540" }
      : state === "available"
      ? { boxShadow: `0 0 14px ${branchColor}40` }
      : undefined;

  return (
    <motion.div
      data-testid="skill-node"
      data-state={state}
      whileHover={isInteractive ? { scale: 1.05 } : undefined}
      onClick={handleClick}
      className={containerClass}
      style={borderStyle}
    >
      {/* Glow pulse ring for available nodes */}
      {state === "available" && (
        <motion.span
          data-testid="state-available"
          className="absolute inset-0 rounded-xl pointer-events-none"
          style={{ boxShadow: `0 0 0 2px ${branchColor}60` }}
          animate={{ opacity: [1, 0.4, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          aria-hidden="true"
        />
      )}

      {/* Pulsing ring for in_progress */}
      {state === "in_progress" && (
        <motion.span
          data-testid="state-in_progress"
          className="absolute inset-0 rounded-xl border-2 pointer-events-none"
          style={{ borderColor: branchColor }}
          animate={{ opacity: [1, 0.2, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          aria-hidden="true"
        />
      )}

      {/* State icon: top-right corner */}
      <span className="absolute top-2 right-2" aria-hidden="true">
        {state === "locked" && (
          <span data-testid="state-locked" className="text-[var(--text-muted)]">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
          </span>
        )}
        {state === "completed" && (
          <span data-testid="state-completed" className="text-green-400">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
        )}
        {state === "mastered" && (
          <span data-testid="state-mastered" className="text-yellow-400">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </span>
        )}
      </span>

      {/* Title */}
      <h3 className="text-xs font-semibold text-[var(--foreground)] leading-tight mt-1 pr-5 line-clamp-2">
        {node.title}
      </h3>

      {/* Tier badge + XP */}
      <div className="flex items-center gap-1 mt-2 flex-wrap">
        <Badge variant="default" size="xs">
          T{node.tier}
        </Badge>
        <XPBadge amount={node.xpReward} />
      </div>
    </motion.div>
  );
}
