"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Hint, HintTier } from "@/lib/types";
import { Button } from "@/components/common/Button";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface HintPanelProps {
  hints: Hint[];
  onReveal: (tier: HintTier) => void;
  revealedTiers: HintTier[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TIER_ORDER: HintTier[] = ["nudge", "guide", "reveal"];

const TIER_META: Record<HintTier, { label: string; icon: string; penaltyLabel: string; color: string }> = {
  nudge: {
    label: "Nudge",
    icon: "?",
    penaltyLabel: "-10% XP",
    color: "var(--accent-orange)",
  },
  guide: {
    label: "Guide",
    icon: "!",
    penaltyLabel: "-25% XP",
    color: "#f97316",
  },
  reveal: {
    label: "Reveal",
    icon: "!!",
    penaltyLabel: "-50% XP",
    color: "#ef4444",
  },
};

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function LightbulbIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 18h6" />
      <path d="M10 22h4" />
      <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function HintPanel({ hints, onReveal, revealedTiers }: HintPanelProps) {
  const [confirmingTier, setConfirmingTier] = useState<HintTier | null>(null);

  function getHintForTier(tier: HintTier): Hint | undefined {
    return hints.find((h) => h.tier === tier);
  }

  function isTierRevealed(tier: HintTier): boolean {
    return revealedTiers.includes(tier);
  }

  function isTierLocked(tier: HintTier): boolean {
    const idx = TIER_ORDER.indexOf(tier);
    if (idx === 0) return false;
    // Previous tier must be revealed to unlock this one
    return !isTierRevealed(TIER_ORDER[idx - 1]);
  }

  function handleRevealClick(tier: HintTier) {
    if (isTierRevealed(tier) || isTierLocked(tier)) return;
    setConfirmingTier(tier);
  }

  function handleConfirm(tier: HintTier) {
    onReveal(tier);
    setConfirmingTier(null);
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="text-[var(--accent-orange)]">
          <LightbulbIcon />
        </span>
        <h3 className="text-sm font-semibold text-[var(--foreground)]">
          Hints
        </h3>
        <span className="text-xs text-[var(--text-muted)]">
          ({revealedTiers.length}/{hints.length} used)
        </span>
      </div>

      {/* Hint tiers */}
      <div className="flex flex-col gap-2">
        {TIER_ORDER.map((tier) => {
          const hint = getHintForTier(tier);
          if (!hint) return null;

          const meta = TIER_META[tier];
          const revealed = isTierRevealed(tier);
          const locked = isTierLocked(tier);

          return (
            <div key={tier} className="relative">
              {/* Hint card */}
              <div
                className={[
                  "rounded-lg border px-3 py-2.5 transition-all duration-200",
                  revealed
                    ? "border-[var(--border)] bg-[var(--surface-2)]"
                    : locked
                      ? "border-[var(--border)] bg-[var(--surface)] opacity-50"
                      : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent-orange)]/40 cursor-pointer",
                ].join(" ")}
                onClick={() => !revealed && !locked && handleRevealClick(tier)}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {locked && (
                      <span className="text-[var(--text-muted)]">
                        <LockIcon />
                      </span>
                    )}
                    <span
                      className="text-xs font-semibold px-1.5 py-0.5 rounded"
                      style={{
                        color: meta.color,
                        background: `${meta.color}18`,
                      }}
                    >
                      {meta.label}
                    </span>
                  </div>

                  {!revealed && (
                    <span
                      className="text-xs font-medium"
                      style={{ color: meta.color }}
                    >
                      {meta.penaltyLabel}
                    </span>
                  )}
                </div>

                {/* Revealed content */}
                <AnimatePresence>
                  {revealed && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                      className="overflow-hidden"
                    >
                      <p className="text-sm text-[var(--text-secondary)] mt-2 leading-relaxed">
                        {hint.text}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Locked message */}
                {locked && !revealed && (
                  <p className="text-xs text-[var(--text-muted)] mt-1.5 italic">
                    Reveal the previous hint first
                  </p>
                )}
              </div>

              {/* Confirmation overlay */}
              <AnimatePresence>
                {confirmingTier === tier && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-[var(--surface)]/95 border border-[var(--accent-orange)]/30 backdrop-blur-sm"
                  >
                    <div className="flex flex-col items-center gap-2 p-3 text-center">
                      <p className="text-sm text-[var(--foreground)]">
                        Using this hint reduces XP by{" "}
                        <span style={{ color: meta.color }} className="font-semibold">
                          {Math.round((1 - hint.xpPenalty) * 100)}%
                        </span>
                        . Continue?
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmingTier(null);
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleConfirm(tier);
                          }}
                        >
                          Reveal Hint
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
