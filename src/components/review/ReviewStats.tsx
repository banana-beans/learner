"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Card } from "@/components/common/Card";
import { Button } from "@/components/common/Button";

interface ReviewStatsProps {
  stats: {
    reviewed: number;
    correct: number;
    xpEarned: number;
    perfectSession: boolean;
  };
}

/** Animated counter that counts from 0 to target */
function AnimatedCounter({
  target,
  duration = 1,
  prefix = "",
  suffix = "",
  color,
}: {
  target: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  color?: string;
}) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (target === 0) return;
    let start = 0;
    const increment = target / (duration * 60);
    let frame: number;

    function step() {
      start += increment;
      if (start >= target) {
        setValue(target);
        return;
      }
      setValue(Math.floor(start));
      frame = requestAnimationFrame(step);
    }

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return (
    <span className="tabular-nums font-black text-3xl" style={{ color }}>
      {prefix}
      {value}
      {suffix}
    </span>
  );
}

/** Trophy icon for perfect session */
function TrophyIcon() {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--xp-gold)"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}

/** Star icon for celebration */
function StarIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="var(--xp-gold)"
      stroke="none"
    >
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

export function ReviewStats({ stats }: ReviewStatsProps) {
  const accuracy =
    stats.reviewed > 0 ? Math.round((stats.correct / stats.reviewed) * 100) : 0;

  return (
    <motion.div
      className="flex flex-col items-center gap-6 py-6 px-4 w-full max-w-md mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Perfect session celebration */}
      {stats.perfectSession && (
        <motion.div
          className="flex flex-col items-center gap-2"
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.2 }}
        >
          <TrophyIcon />
          <div className="flex items-center gap-1.5">
            <StarIcon />
            <span className="text-sm font-bold text-[var(--xp-gold)]">
              Perfect Session!
            </span>
            <StarIcon />
          </div>
        </motion.div>
      )}

      <h2 className="text-xl font-bold text-[var(--foreground)]">
        Session Complete
      </h2>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 w-full">
        <Card padding="sm">
          <div className="flex flex-col items-center py-2">
            <p className="text-xs text-[var(--text-muted)] mb-1">Reviewed</p>
            <AnimatedCounter
              target={stats.reviewed}
              color="var(--foreground)"
            />
          </div>
        </Card>

        <Card padding="sm">
          <div className="flex flex-col items-center py-2">
            <p className="text-xs text-[var(--text-muted)] mb-1">Accuracy</p>
            <AnimatedCounter
              target={accuracy}
              suffix="%"
              color={
                accuracy >= 80
                  ? "var(--accent-green)"
                  : accuracy >= 50
                    ? "var(--accent-orange)"
                    : "var(--accent-orange)"
              }
            />
          </div>
        </Card>

        <Card padding="sm">
          <div className="flex flex-col items-center py-2">
            <p className="text-xs text-[var(--text-muted)] mb-1">Correct</p>
            <AnimatedCounter
              target={stats.correct}
              color="var(--accent-green)"
            />
          </div>
        </Card>

        <Card padding="sm">
          <div className="flex flex-col items-center py-2">
            <p className="text-xs text-[var(--text-muted)] mb-1">XP Earned</p>
            <AnimatedCounter
              target={stats.xpEarned}
              prefix="+"
              color="var(--xp-gold)"
            />
          </div>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 w-full mt-2">
        <Link href="/" className="flex-1">
          <Button variant="secondary" size="md" className="w-full">
            Back to Dashboard
          </Button>
        </Link>
        <Link href="/review" className="flex-1">
          <Button variant="primary" size="md" className="w-full">
            Review More
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}
