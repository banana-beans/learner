"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface XPRewardToastProps {
  xpAmount: number;
  activity: string;
  multiplier?: number;
  onDismiss: () => void;
  /** Duration in ms before auto-dismiss. Defaults to 3000. */
  duration?: number;
}

export function XPRewardToast({
  xpAmount,
  activity,
  multiplier,
  onDismiss,
  duration = 3000,
}: XPRewardToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, duration);
    return () => clearTimeout(timer);
  }, [onDismiss, duration]);

  const showMultiplier = multiplier !== undefined && multiplier > 1.0;

  return (
    <motion.div
      initial={{ opacity: 0, x: 80, y: -10 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      exit={{ opacity: 0, x: 80, y: -10 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="pointer-events-auto flex items-center gap-3 rounded-xl border border-[var(--xp-gold)]/30 bg-[var(--surface)] px-4 py-3 shadow-xl shadow-black/30"
      role="status"
      aria-live="polite"
    >
      {/* XP coin icon */}
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--xp-gold)]/15 ring-1 ring-[var(--xp-gold)]/30">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-[var(--xp-gold)]"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
      </div>

      {/* Text */}
      <div className="min-w-0">
        <p className="text-sm font-semibold text-[var(--foreground)]">
          +{xpAmount.toLocaleString()} XP
        </p>
        <p className="text-xs text-[var(--text-muted)] truncate">{activity}</p>
      </div>

      {/* Multiplier badge */}
      {showMultiplier && (
        <div className="ml-auto shrink-0 flex items-center gap-1 rounded-full bg-orange-500/15 px-2 py-0.5 ring-1 ring-orange-500/30">
          <svg
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="text-orange-400"
          >
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
          <span className="text-[11px] font-bold text-orange-400">
            {multiplier.toFixed(1)}x
          </span>
        </div>
      )}
    </motion.div>
  );
}

/** Wrapper that positions toasts in the top-right corner */
export function XPRewardToastContainer({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence mode="sync">{children}</AnimatePresence>
    </div>
  );
}
