"use client";

import { useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/common/Button";

interface LevelUpModalProps {
  level: number;
  title: string;
  open: boolean;
  onClose: () => void;
}

/** Generates an array of particle configs for the celebration effect */
function generateParticles(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 300 - 150,
    y: Math.random() * -250 - 50,
    rotation: Math.random() * 720 - 360,
    scale: Math.random() * 0.6 + 0.4,
    delay: Math.random() * 0.4,
    duration: Math.random() * 0.8 + 0.8,
    size: Math.random() * 8 + 4,
    color:
      i % 4 === 0
        ? "var(--xp-gold)"
        : i % 4 === 1
          ? "#fbbf24"
          : i % 4 === 2
            ? "#fde68a"
            : "#f59e0b",
  }));
}

const particles = generateParticles(24);

export function LevelUpModal({ level, title, open, onClose }: LevelUpModalProps) {
  // Auto-dismiss after 5 seconds
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [open, onClose]);

  // Escape key dismissal
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, handleKeyDown]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Full-screen backdrop */}
          <motion.div
            key="level-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Centered celebration content */}
          <motion.div
            key="level-panel"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          >
            <div className="relative flex flex-col items-center pointer-events-auto">
              {/* Particle effects */}
              {particles.map((p) => (
                <motion.div
                  key={p.id}
                  className="absolute rounded-full"
                  style={{
                    width: p.size,
                    height: p.size,
                    background: p.color,
                  }}
                  initial={{ opacity: 1, x: 0, y: 0, scale: 0, rotate: 0 }}
                  animate={{
                    opacity: [1, 1, 0],
                    x: p.x,
                    y: p.y,
                    scale: p.scale,
                    rotate: p.rotation,
                  }}
                  transition={{
                    duration: p.duration,
                    delay: p.delay,
                    ease: "easeOut",
                  }}
                />
              ))}

              {/* Sparkle ring */}
              <motion.div
                className="absolute w-48 h-48 rounded-full border-2 border-[var(--xp-gold)]/30"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: [0.5, 1.5, 1.8], opacity: [0, 0.6, 0] }}
                transition={{ duration: 1.2, ease: "easeOut" }}
              />
              <motion.div
                className="absolute w-32 h-32 rounded-full border border-[var(--xp-gold)]/20"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: [0.5, 1.8, 2.2], opacity: [0, 0.4, 0] }}
                transition={{ duration: 1.4, delay: 0.15, ease: "easeOut" }}
              />

              {/* "LEVEL UP" label */}
              <motion.p
                className="text-sm font-bold tracking-[0.3em] uppercase text-[var(--xp-gold)]"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                Level Up!
              </motion.p>

              {/* Level number — large animated scale-up */}
              <motion.div
                className="mt-3 text-8xl font-black tabular-nums text-[var(--xp-gold)] drop-shadow-[0_0_24px_rgba(245,158,11,0.5)]"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0, 1.2, 1], opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.6, ease: "easeOut" }}
              >
                {level}
              </motion.div>

              {/* Title */}
              <motion.p
                className="mt-2 text-xl font-semibold text-[var(--foreground)]"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                {title}
              </motion.p>

              {/* Glow line */}
              <motion.div
                className="mt-4 h-px w-40 bg-gradient-to-r from-transparent via-[var(--xp-gold)] to-transparent"
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.4 }}
              />

              {/* Continue button */}
              <motion.div
                className="mt-6"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Button variant="primary" size="lg" onClick={onClose}>
                  Continue
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
