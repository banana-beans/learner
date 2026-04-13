"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/common/Button";
import { Modal } from "@/components/common/Modal";

interface HintSystemProps {
  hints: string[];
  onHintRevealed: (hintIndex: number, penaltyXP: number) => void;
}

const HINT_PENALTIES = [10, 25, 50]; // XP deducted per hint tier
const HINT_LABELS = ["Nudge", "Guide", "Reveal"];

export function HintSystem({ hints, onHintRevealed }: HintSystemProps) {
  const [revealedCount, setRevealedCount] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);

  const maxHints = Math.min(hints.length, 3);

  function revealHint(index: number) {
    if (index >= maxHints) return;
    const penalty = HINT_PENALTIES[index];
    setRevealedCount(index + 1);
    onHintRevealed(index, penalty);
  }

  function handleHintClick(index: number) {
    if (index === 2) {
      setShowConfirm(true);
    } else {
      revealHint(index);
    }
  }

  function confirmReveal() {
    setShowConfirm(false);
    revealHint(2);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-yellow-400 shrink-0"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4M12 8h.01" />
        </svg>
        <span className="text-sm font-medium text-[var(--text-secondary)]">
          Hints
        </span>
      </div>

      {/* Revealed hints */}
      <div className="space-y-2">
        <AnimatePresence initial={false}>
          {hints.slice(0, revealedCount).map((hint, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, height: 0, y: -8 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-yellow-400/70">
                    Hint {i + 1} — {HINT_LABELS[i]}
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)]">
                    (-{HINT_PENALTIES[i]} XP)
                  </span>
                </div>
                <p className="text-sm text-[var(--foreground)]">{hint}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Next hint button */}
      {revealedCount < maxHints && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleHintClick(revealedCount)}
          leftIcon={
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4M12 8h.01" />
            </svg>
          }
        >
          Use Hint{" "}
          <span className="text-yellow-400 ml-1">
            (-{HINT_PENALTIES[revealedCount]} XP)
          </span>
        </Button>
      )}

      {revealedCount === maxHints && (
        <p className="text-xs text-[var(--text-muted)]">All hints revealed.</p>
      )}

      {/* Confirmation modal for reveal hint */}
      <Modal
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        title="Reveal Answer?"
        maxWidth="max-w-sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-[var(--text-secondary)]">
            The final hint reveals the solution. You&apos;ll lose{" "}
            <span className="text-red-400 font-semibold">50% of XP</span> for
            this challenge. Are you sure?
          </p>
          <div className="flex gap-2 justify-end">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={confirmReveal}
              data-testid="confirm-reveal"
            >
              Reveal (-50 XP)
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
