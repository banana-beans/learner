"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";

interface XPGainAnimationProps {
  amount: number;
  onComplete?: () => void;
}

export function XPGainAnimation({ amount, onComplete }: XPGainAnimationProps) {
  // Auto-remove after animation completes (1 second)
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete?.();
    }, 1000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      className="pointer-events-none select-none font-black text-lg tabular-nums text-[var(--xp-gold)] drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]"
      initial={{ y: 0, opacity: 1, scale: 1 }}
      animate={{ y: -60, opacity: 0, scale: 1.2 }}
      transition={{ duration: 1, ease: "easeOut" }}
    >
      +{amount} XP
    </motion.div>
  );
}
