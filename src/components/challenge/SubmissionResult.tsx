"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ChallengeResult, Challenge, DifficultyStars } from "@/lib/types";
import { Button } from "@/components/common/Button";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface SubmissionResultProps {
  result: ChallengeResult;
  challenge: Challenge;
  onNext: () => void;
}

// ---------------------------------------------------------------------------
// Particle system for celebration
// ---------------------------------------------------------------------------

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  rotation: number;
  velocityX: number;
  velocityY: number;
  delay: number;
}

const CONFETTI_COLORS = [
  "#4f8ef7", // blue
  "#22d3ee", // cyan
  "#a855f7", // purple
  "#22c55e", // green
  "#f59e0b", // gold
  "#f97316", // orange
  "#ec4899", // pink
];

function generateParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: 50 + (Math.random() - 0.5) * 40,
    y: 50,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    size: 4 + Math.random() * 6,
    rotation: Math.random() * 360,
    velocityX: (Math.random() - 0.5) * 120,
    velocityY: -(40 + Math.random() * 80),
    delay: Math.random() * 0.3,
  }));
}

function ConfettiCelebration() {
  const particles = useRef(generateParticles(40)).current;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            rotate: 0,
            scale: 1,
            opacity: 1,
          }}
          animate={{
            left: `${p.x + p.velocityX}%`,
            top: `${p.y + p.velocityY}%`,
            rotate: p.rotation + 720,
            scale: 0,
            opacity: 0,
          }}
          transition={{
            duration: 1.4 + Math.random() * 0.6,
            delay: p.delay,
            ease: "easeOut",
          }}
          className="absolute"
          style={{
            width: p.size,
            height: p.size,
            borderRadius: Math.random() > 0.5 ? "50%" : "2px",
            background: p.color,
          }}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Animated XP counter
// ---------------------------------------------------------------------------

function AnimatedXP({ target }: { target: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const duration = 1200;
    const startTime = performance.now();

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * target));

      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    }

    requestAnimationFrame(tick);
  }, [target]);

  return (
    <span className="tabular-nums text-4xl font-bold text-[var(--xp-gold)]">
      +{display.toLocaleString()}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Difficulty stars
// ---------------------------------------------------------------------------

function DifficultyDisplay({ difficulty }: { difficulty: DifficultyStars }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill={i < difficulty ? "var(--xp-gold)" : "none"}
          stroke={i < difficulty ? "var(--xp-gold)" : "var(--text-muted)"}
          strokeWidth="2"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Multiplier breakdown
// ---------------------------------------------------------------------------

interface MultiplierItem {
  label: string;
  value: number;
  active: boolean;
}

function MultiplierBreakdown({ result }: { result: ChallengeResult }) {
  const items: MultiplierItem[] = [
    {
      label: "First Attempt",
      value: 1.5,
      active: result.firstAttempt,
    },
    {
      label: "No Hints",
      value: 1.1,
      active: result.hintsUsed === 0,
    },
    {
      label: "Speed Bonus",
      value: 1.25,
      active: result.timeTakenSeconds < 120, // placeholder heuristic
    },
    {
      label: "All Tests Passed",
      value: 1.0,
      active: result.testsPassed === result.testsTotal,
    },
  ];

  const activeItems = items.filter((m) => m.active);

  if (activeItems.length === 0) return null;

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
        Multipliers
      </p>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item, i) => (
          <motion.span
            key={item.label}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 + i * 0.1 }}
            className={[
              "text-xs px-2 py-1 rounded-md border",
              item.active
                ? "border-[var(--xp-gold)]/30 bg-[var(--xp-gold)]/10 text-[var(--xp-gold)]"
                : "border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-muted)] line-through",
            ].join(" ")}
          >
            {item.label}
            {item.active && item.value > 1.0 && (
              <span className="ml-1 font-semibold">x{item.value}</span>
            )}
          </motion.span>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SubmissionResult({
  result,
  challenge,
  onNext,
}: SubmissionResultProps) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative flex flex-col items-center gap-6 py-8 px-6"
      >
        {/* Confetti */}
        <ConfettiCelebration />

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="text-center"
        >
          <h2 className="text-2xl font-bold text-[var(--foreground)]">
            Challenge Complete!
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {challenge.title}
          </p>
        </motion.div>

        {/* XP display */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 200, damping: 15 }}
          className="flex flex-col items-center gap-1"
        >
          <AnimatedXP target={result.xpEarned} />
          <span className="text-xs text-[var(--text-muted)]">XP Earned</span>
        </motion.div>

        {/* Difficulty stars */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <DifficultyDisplay difficulty={challenge.difficulty} />
        </motion.div>

        {/* Test results summary */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="flex items-center gap-4 text-sm"
        >
          <div className="flex items-center gap-1.5">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--accent-green)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span className="text-[var(--text-secondary)]">
              {result.testsPassed}/{result.testsTotal} tests passed
            </span>
          </div>
          <div className="w-px h-4 bg-[var(--border)]" />
          <span className="text-[var(--text-secondary)]">
            {result.timeTakenSeconds < 60
              ? `${result.timeTakenSeconds}s`
              : `${Math.floor(result.timeTakenSeconds / 60)}m ${result.timeTakenSeconds % 60}s`}
          </span>
          {result.hintsUsed > 0 && (
            <>
              <div className="w-px h-4 bg-[var(--border)]" />
              <span className="text-[var(--accent-orange)]">
                {result.hintsUsed} hint{result.hintsUsed > 1 ? "s" : ""} used
              </span>
            </>
          )}
        </motion.div>

        {/* Multiplier breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <MultiplierBreakdown result={result} />
        </motion.div>

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="flex items-center gap-3 mt-2"
        >
          <Button
            variant="secondary"
            size="md"
            onClick={() => {
              if (typeof window !== "undefined") {
                window.history.back();
              }
            }}
          >
            Back to Tree
          </Button>
          <Button variant="primary" size="md" onClick={onNext}>
            Next Challenge
          </Button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
