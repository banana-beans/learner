"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { CardFlip } from "@/components/review/CardFlip";
import { ReviewStats } from "@/components/review/ReviewStats";
import { DueCounter } from "@/components/review/DueCounter";
import { Button } from "@/components/common/Button";
import { useReviewStore } from "@/store/review-store";
import { useUserStore } from "@/store/user-store";
import { XP_BASE } from "@/lib/constants";
import type { Rating, ReviewCard } from "@/lib/types";

const XP_FOR_RATING: Record<Rating, number> = {
  again: XP_BASE.REVIEW_AGAIN,
  hard: XP_BASE.REVIEW_HARD,
  good: XP_BASE.REVIEW_GOOD,
  easy: XP_BASE.REVIEW_EASY,
};

/** Format seconds into MM:SS */
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** Arrow-left icon for back button */
function ArrowLeftIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

/** Clock icon for timer */
function ClockIcon() {
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
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

export default function ReviewPage() {
  const getDueCards = useReviewStore((s) => s.getDueCards);
  const getNewCards = useReviewStore((s) => s.getNewCards);
  const reviewCard = useReviewStore((s) => s.reviewCard);
  const addXP = useUserStore((s) => s.addXP);

  const [sessionComplete, setSessionComplete] = useState(false);
  const [sessionRatings, setSessionRatings] = useState<Rating[]>([]);
  const [totalXPEarned, setTotalXPEarned] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  // Build the review queue once at mount
  const queue = useMemo<ReviewCard[]>(() => {
    const due = getDueCards();
    const newCards = getNewCards();
    return [...due, ...newCards];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Current due count (live, for the header badge)
  const liveDueCount = useMemo(() => getDueCards().length, [getDueCards]);

  // Session timer
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleRate = useCallback(
    (cardId: string, rating: Rating) => {
      reviewCard(cardId, rating);

      const xp = XP_FOR_RATING[rating];
      if (xp > 0) {
        addXP({
          amount: xp,
          source: "review_card",
          referenceId: cardId,
          multipliers: {},
        });
      }

      setSessionRatings((prev) => [...prev, rating]);
      setTotalXPEarned((prev) => prev + xp);
    },
    [reviewCard, addXP],
  );

  const handleComplete = useCallback(() => {
    // Stop timer
    if (timerRef.current) clearInterval(timerRef.current);

    // Check for perfect session bonus
    const allRatings = [...sessionRatings];
    // The last rating hasn't been added via setSessionRatings yet since
    // handleRate and handleComplete are called in the same tick in CardFlip.
    // But CardFlip calls onRate *before* onComplete, so sessionRatings
    // will include all ratings by now (via the batched state update).
    const isPerfect =
      allRatings.length > 0 &&
      allRatings.every((r) => r === "good" || r === "easy");

    if (isPerfect) {
      addXP({
        amount: XP_BASE.REVIEW_PERFECT_SESSION,
        source: "review_card",
        multipliers: {},
      });
      setTotalXPEarned((prev) => prev + XP_BASE.REVIEW_PERFECT_SESSION);
    }

    setSessionComplete(true);
  }, [sessionRatings, addXP]);

  const correctCount = sessionRatings.filter(
    (r) => r === "good" || r === "easy",
  ).length;

  const isPerfect =
    sessionRatings.length > 0 &&
    sessionRatings.every((r) => r === "good" || r === "easy");

  if (sessionComplete) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6">
        <ReviewStats
          stats={{
            reviewed: sessionRatings.length,
            correct: correctCount,
            xpEarned: totalXPEarned,
            perfectSession: isPerfect,
          }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <Link href="/">
          <Button variant="ghost" size="sm">
            <ArrowLeftIcon />
          </Button>
        </Link>

        <h1 className="text-lg font-bold text-[var(--foreground)] flex-1 text-center">
          Review
        </h1>

        <div className="flex items-center gap-3">
          {/* Timer */}
          <motion.span
            className="flex items-center gap-1 text-xs text-[var(--text-muted)] tabular-nums"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <ClockIcon />
            {formatTime(elapsed)}
          </motion.span>

          {/* Due counter */}
          <DueCounter count={liveDueCount} compact />
        </div>
      </div>

      {/* Card session */}
      <CardFlip cards={queue} onRate={handleRate} onComplete={handleComplete} />
    </div>
  );
}
