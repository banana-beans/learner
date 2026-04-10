"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence, type PanInfo } from "framer-motion";
import type { ReviewCard as ReviewCardType, Rating } from "@/lib/types";
import { ReviewCard } from "./ReviewCard";
import { ProgressBar } from "@/components/common/ProgressBar";
import { Button } from "@/components/common/Button";

interface CardFlipProps {
  cards: ReviewCardType[];
  onRate: (cardId: string, rating: Rating) => void;
  onComplete: () => void;
}

const SWIPE_THRESHOLD = 100;

const ratingButtons: Array<{
  rating: Rating;
  label: string;
  color: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
}> = [
  {
    rating: "again",
    label: "Again",
    color: "var(--accent-orange)",
    bgClass: "bg-red-500/15",
    borderClass: "border-red-500/30",
    textClass: "text-red-400",
  },
  {
    rating: "hard",
    label: "Hard",
    color: "var(--accent-orange)",
    bgClass: "bg-orange-500/15",
    borderClass: "border-orange-500/30",
    textClass: "text-orange-400",
  },
  {
    rating: "good",
    label: "Good",
    color: "var(--accent-green)",
    bgClass: "bg-green-500/15",
    borderClass: "border-green-500/30",
    textClass: "text-green-400",
  },
  {
    rating: "easy",
    label: "Easy",
    color: "var(--accent-blue)",
    bgClass: "bg-blue-500/15",
    borderClass: "border-blue-500/30",
    textClass: "text-blue-400",
  },
];

/** Celebration icon for empty state */
function PartyIcon() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--accent-green)"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5.8 11.3 2 22l10.7-3.79" />
      <path d="M4 3h.01" />
      <path d="M22 8h.01" />
      <path d="M15 2h.01" />
      <path d="M22 20h.01" />
      <path d="m22 2-2.24.75a2.9 2.9 0 0 0-1.96 3.12c.1.86-.57 1.63-1.45 1.63h-.38c-.86 0-1.6.6-1.76 1.44L14 10" />
      <path d="m22 13-.82-.33c-.86-.34-1.82.2-1.98 1.11c-.11.7-.72 1.22-1.43 1.22H17" />
      <path d="m11 2 .33.82c.34.86-.2 1.82-1.11 1.98C9.52 4.9 9 5.52 9 6.23V7" />
      <path d="M11 13c1.93 1.93 2.83 4.17 2 5-.83.83-3.07-.07-5-2-1.93-1.93-2.83-4.17-2-5 .83-.83 3.07.07 5 2Z" />
    </svg>
  );
}

export function CardFlip({ cards, onRate, onComplete }: CardFlipProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [direction, setDirection] = useState(0);
  const [swipeHint, setSwipeHint] = useState<"left" | "right" | null>(null);

  const currentCard = cards[currentIndex] as ReviewCardType | undefined;
  const progress = cards.length > 0 ? currentIndex / cards.length : 1;

  const handleFlip = useCallback(() => {
    setFlipped((prev) => !prev);
  }, []);

  const handleRate = useCallback(
    (rating: Rating) => {
      if (!currentCard) return;
      onRate(currentCard.id, rating);

      const nextIndex = currentIndex + 1;
      if (nextIndex >= cards.length) {
        onComplete();
        return;
      }

      setDirection(rating === "again" || rating === "hard" ? -1 : 1);
      setFlipped(false);
      setCurrentIndex(nextIndex);
    },
    [currentCard, currentIndex, cards.length, onRate, onComplete],
  );

  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      setSwipeHint(null);
      if (!flipped) return;

      if (info.offset.x < -SWIPE_THRESHOLD) {
        handleRate("again");
      } else if (info.offset.x > SWIPE_THRESHOLD) {
        handleRate("good");
      }
    },
    [flipped, handleRate],
  );

  const handleDrag = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (!flipped) return;
      if (info.offset.x < -50) {
        setSwipeHint("left");
      } else if (info.offset.x > 50) {
        setSwipeHint("right");
      } else {
        setSwipeHint(null);
      }
    },
    [flipped],
  );

  // Empty state
  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
        >
          <PartyIcon />
        </motion.div>
        <motion.h2
          className="text-xl font-bold text-[var(--foreground)] mt-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          All caught up!
        </motion.h2>
        <motion.p
          className="text-sm text-[var(--text-muted)] mt-1 text-center max-w-xs"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          No cards due right now. Come back later or explore new topics to generate more cards.
        </motion.p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Progress */}
      <div className="flex items-center gap-3">
        <ProgressBar
          value={progress}
          color="var(--accent-cyan)"
          height={4}
        />
        <span className="text-xs text-[var(--text-muted)] tabular-nums whitespace-nowrap">
          {currentIndex + 1} of {cards.length}
        </span>
      </div>

      {/* Card area */}
      <div className="relative w-full min-h-[320px]">
        {/* Swipe hints */}
        <AnimatePresence>
          {swipeHint === "left" && (
            <motion.div
              className="absolute top-4 left-4 z-20 px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-sm font-medium"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
            >
              Again
            </motion.div>
          )}
          {swipeHint === "right" && (
            <motion.div
              className="absolute top-4 right-4 z-20 px-3 py-1.5 rounded-lg bg-green-500/20 border border-green-500/30 text-green-400 text-sm font-medium"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
            >
              Good
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait" custom={direction}>
          {currentCard && (
            <motion.div
              key={currentCard.id}
              custom={direction}
              initial={{ opacity: 0, x: direction > 0 ? 200 : direction < 0 ? -200 : 0, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: direction > 0 ? -200 : 200, scale: 0.95 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              drag={flipped ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.3}
              onDragEnd={handleDragEnd}
              onDrag={handleDrag}
            >
              <ReviewCard
                card={currentCard}
                flipped={flipped}
                onFlip={handleFlip}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Rating buttons — only shown when flipped */}
      <AnimatePresence>
        {flipped && currentCard && (
          <motion.div
            className="grid grid-cols-4 gap-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
          >
            {ratingButtons.map((btn) => (
              <button
                key={btn.rating}
                onClick={(e) => {
                  e.stopPropagation();
                  handleRate(btn.rating);
                }}
                className={[
                  "flex flex-col items-center gap-0.5 py-2.5 px-2 rounded-xl border",
                  "transition-all duration-150 cursor-pointer",
                  "hover:brightness-125 active:scale-95",
                  btn.bgClass,
                  btn.borderClass,
                  btn.textClass,
                ].join(" ")}
              >
                <span className="text-sm font-semibold">{btn.label}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Swipe hint text */}
      {flipped && currentCard && (
        <p className="text-xs text-[var(--text-muted)] text-center">
          Swipe left for Again, right for Good
        </p>
      )}
    </div>
  );
}
