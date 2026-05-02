"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { ProgressBar } from "@/components/common/ProgressBar";
import { useReviewStore, computeNextState } from "@/store/review-store";
import { useUserStore } from "@/store/user-store";
import { XP_BASE } from "@/lib/constants";
import type { Rating, ReviewCard } from "@/lib/types";

const RATINGS: { rating: Rating; label: string; hint: string; color: string; xp: number }[] = [
  { rating: "again", label: "Again", hint: "Forgot",       color: "var(--accent-red, #ef4444)",    xp: XP_BASE.REVIEW_AGAIN },
  { rating: "hard",  label: "Hard",  hint: "Recalled, slow", color: "var(--accent-orange)",        xp: XP_BASE.REVIEW_HARD  },
  { rating: "good",  label: "Good",  hint: "Recalled",      color: "var(--accent-blue)",           xp: XP_BASE.REVIEW_GOOD  },
  { rating: "easy",  label: "Easy",  hint: "Trivial",       color: "var(--accent-green)",          xp: XP_BASE.REVIEW_EASY  },
];

function formatInterval(days: number): string {
  if (days < 1) return "<1d";
  if (days < 30) return `${Math.round(days)}d`;
  if (days < 365) return `${Math.round(days / 30)}mo`;
  return `${(days / 365).toFixed(1)}y`;
}

export function ReviewSession() {
  // Snapshot the queue at session start so re-rating doesn't reshuffle.
  const cardsMap = useReviewStore((s) => s.cards);
  const reviewCard = useReviewStore((s) => s.reviewCard);
  const addXP = useUserStore((s) => s.addXP);

  const [queue, setQueue] = useState<ReviewCard[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [stats, setStats] = useState({ correct: 0, total: 0, xp: 0 });
  const [done, setDone] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Build queue once on mount: due review cards + capped new cards.
  useEffect(() => {
    const now = new Date();
    const all = Object.values(cardsMap);
    const due = all
      .filter(
        (c) =>
          c.state !== "suspended" &&
          c.state !== "buried" &&
          c.fsrs.state !== "new" &&
          new Date(c.dueDate) <= now
      )
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    const fresh = all.filter((c) => c.fsrs.state === "new" && c.state !== "suspended").slice(0, 10);
    setQueue([...due, ...fresh]);
    setHydrated(true);
    // Snapshot once on mount; ignore subsequent cardsMap changes (per-rating mutations).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const current = queue[index];

  const previews = useMemo(() => {
    if (!current) return null;
    const now = new Date();
    return RATINGS.map((r) => {
      const next = computeNextState(current, r.rating, now);
      return { ...r, days: next.scheduledDays };
    });
  }, [current]);

  function handleRate(rating: Rating, xp: number) {
    if (!current) return;
    reviewCard(current.id, rating);
    if (xp > 0) {
      addXP({
        amount: xp,
        source: "review_card",
        referenceId: current.id,
        multipliers: {},
      });
    }
    setStats((s) => ({
      correct: rating === "again" ? s.correct : s.correct + 1,
      total: s.total + 1,
      xp: s.xp + xp,
    }));
    if (index + 1 >= queue.length) {
      // Perfect-session bonus: all good/easy
      const willBePerfect =
        rating !== "again" && rating !== "hard" &&
        stats.total === stats.correct;
      if (willBePerfect && queue.length >= 3) {
        addXP({
          amount: XP_BASE.REVIEW_PERFECT_SESSION,
          source: "review_card",
          multipliers: {},
        });
        setStats((s) => ({ ...s, xp: s.xp + XP_BASE.REVIEW_PERFECT_SESSION }));
      }
      setDone(true);
    } else {
      setIndex((i) => i + 1);
      setFlipped(false);
    }
  }

  if (!hydrated) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12 text-center text-[var(--text-muted)]">
        Loading…
      </div>
    );
  }

  if (queue.length === 0) {
    return <EmptyState />;
  }

  if (done) {
    return <DoneState stats={stats} />;
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--foreground)]">Review</h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Card {index + 1} of {queue.length}
          </p>
        </div>
        <Link href="/" className="text-xs text-[var(--text-muted)] hover:text-[var(--foreground)]">
          Exit
        </Link>
      </div>

      <ProgressBar
        value={index / queue.length}
        color="var(--accent-cyan)"
        height={3}
      />

      {/* Card stack */}
      <div className="relative" style={{ minHeight: 360 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.18 }}
          >
            <FlashCard card={current} flipped={flipped} onFlip={() => setFlipped((f) => !f)} />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Rating buttons or Show Answer */}
      {!flipped ? (
        <Button
          variant="primary"
          size="lg"
          onClick={() => setFlipped(true)}
          className="w-full"
        >
          Show answer
        </Button>
      ) : (
        <div className="grid grid-cols-4 gap-2">
          {previews?.map((p) => (
            <button
              key={p.rating}
              onClick={() => handleRate(p.rating, p.xp)}
              className="flex flex-col items-center gap-1 px-2 py-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-2)] transition-colors active:scale-[0.98]"
              style={{ borderTopColor: p.color, borderTopWidth: 3 }}
            >
              <span className="text-sm font-semibold" style={{ color: p.color }}>
                {p.label}
              </span>
              <span className="text-[10px] text-[var(--text-muted)] tabular-nums">
                {formatInterval(p.days)}
              </span>
              {p.xp > 0 && (
                <span className="text-[10px] text-[var(--xp-gold)] tabular-nums">
                  +{p.xp} XP
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      <p className="text-center text-[10px] text-[var(--text-muted)]">
        Be honest — the algorithm tunes to your real recall.
      </p>
    </div>
  );
}

function FlashCard({
  card,
  flipped,
  onFlip,
}: {
  card: ReviewCard;
  flipped: boolean;
  onFlip: () => void;
}) {
  return (
    <button
      onClick={onFlip}
      className="w-full text-left"
      aria-label={flipped ? "Hide answer" : "Show answer"}
    >
      <Card padding="lg" className="min-h-[300px] flex flex-col">
        <div className="flex-1 space-y-4">
          <div className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
            {flipped ? "Answer" : "Prompt"}
          </div>
          <p className="text-base text-[var(--foreground)] whitespace-pre-line leading-relaxed">
            {flipped ? card.back : card.front}
          </p>
          {card.code && (
            <pre className="text-xs font-mono bg-[var(--surface-3)] p-3 rounded-lg overflow-x-auto whitespace-pre">
              <code>{card.code}</code>
            </pre>
          )}
        </div>
        {!flipped && (
          <p className="text-[10px] text-[var(--text-muted)] mt-4 text-center">
            Tap card or press button to reveal
          </p>
        )}
      </Card>
    </button>
  );
}

function EmptyState() {
  return (
    <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
      <div className="text-5xl">📭</div>
      <h1 className="text-2xl font-bold text-[var(--foreground)]">No cards due</h1>
      <p className="text-sm text-[var(--text-muted)] max-w-sm mx-auto">
        Cards are seeded when you complete a lesson. Knock out a lesson and the
        spaced-repetition queue will start filling up.
      </p>
      <div className="flex gap-2 justify-center pt-2">
        <Link href="/skill-tree">
          <Button variant="primary">Go to skill tree</Button>
        </Link>
        <Link href="/scroll">
          <Button variant="ghost">Browse snippets</Button>
        </Link>
      </div>
    </div>
  );
}

function DoneState({ stats }: { stats: { correct: number; total: number; xp: number } }) {
  const accuracy = stats.total === 0 ? 0 : Math.round((stats.correct / stats.total) * 100);
  return (
    <div className="max-w-xl mx-auto px-4 py-12 space-y-6 text-center">
      <div className="text-5xl">🎯</div>
      <h1 className="text-2xl font-bold text-[var(--foreground)]">Session complete</h1>
      <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto">
        <Card padding="sm">
          <p className="text-xs text-[var(--text-muted)]">Reviewed</p>
          <p className="text-xl font-black tabular-nums">{stats.total}</p>
        </Card>
        <Card padding="sm">
          <p className="text-xs text-[var(--text-muted)]">Accuracy</p>
          <p className="text-xl font-black tabular-nums">{accuracy}%</p>
        </Card>
        <Card padding="sm">
          <p className="text-xs text-[var(--text-muted)]">XP</p>
          <p className="text-xl font-black tabular-nums" style={{ color: "var(--xp-gold)" }}>
            +{stats.xp}
          </p>
        </Card>
      </div>
      <div className="flex gap-2 justify-center">
        <Link href="/">
          <Button variant="primary">Done</Button>
        </Link>
        <Link href="/skill-tree">
          <Button variant="ghost">Keep learning</Button>
        </Link>
      </div>
    </div>
  );
}
