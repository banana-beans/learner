"use client";

import { motion } from "framer-motion";
import type { ReviewCard as ReviewCardType } from "@/lib/types";
import { Badge } from "@/components/common/Badge";
import { BRANCH_META } from "@/lib/constants";

interface ReviewCardProps {
  card: ReviewCardType;
  flipped: boolean;
  onFlip: () => void;
}

const cardTypeBadgeVariant: Record<ReviewCardType["type"], "blue" | "cyan" | "purple" | "orange" | "green"> = {
  concept: "blue",
  code_output: "cyan",
  fill_blank: "purple",
  bug_spot: "orange",
  explain: "green",
};

const cardTypeLabel: Record<ReviewCardType["type"], string> = {
  concept: "Concept",
  code_output: "Code Output",
  fill_blank: "Fill in the Blank",
  bug_spot: "Bug Spot",
  explain: "Explain",
};

function CodeBlock({ code }: { code: string }) {
  return (
    <pre className="bg-[var(--surface)] rounded-lg p-3 text-sm font-mono text-[var(--foreground)] overflow-x-auto border border-[var(--border)] whitespace-pre-wrap break-words">
      <code>{code}</code>
    </pre>
  );
}

function CardFront({ card }: { card: ReviewCardType }) {
  switch (card.type) {
    case "code_output":
      return (
        <div className="space-y-3">
          {card.code && <CodeBlock code={card.code} />}
          <p className="text-sm text-[var(--text-secondary)] font-medium">
            What does this print?
          </p>
        </div>
      );

    case "fill_blank":
      return (
        <div className="space-y-3">
          {card.code && <CodeBlock code={card.code} />}
          {card.blanks && card.blanks.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {card.blanks.map((blank, i) => (
                <span
                  key={i}
                  className="inline-flex items-center px-2.5 py-1 rounded bg-[var(--accent-purple)]/10 border border-[var(--accent-purple)]/30 text-sm text-purple-400 font-mono"
                >
                  _{i + 1}_
                </span>
              ))}
            </div>
          )}
          <p className="text-sm text-[var(--text-secondary)]">{card.front}</p>
        </div>
      );

    case "bug_spot":
      return (
        <div className="space-y-3">
          {card.code && <CodeBlock code={card.code} />}
          <p className="text-sm text-[var(--text-secondary)] font-medium">
            Find the bug in this code.
          </p>
        </div>
      );

    case "explain":
      return (
        <div className="space-y-3">
          <p className="text-base text-[var(--foreground)] font-medium">
            {card.front}
          </p>
          <p className="text-sm text-[var(--text-muted)]">
            Explain this concept in your own words.
          </p>
        </div>
      );

    case "concept":
    default:
      return (
        <div className="space-y-3">
          <p className="text-base text-[var(--foreground)]">{card.front}</p>
          {card.code && <CodeBlock code={card.code} />}
        </div>
      );
  }
}

function CardBack({ card }: { card: ReviewCardType }) {
  return (
    <div className="space-y-3">
      <p className="text-base text-[var(--foreground)]">{card.back}</p>
      {card.expectedOutput && (
        <div className="space-y-1">
          <p className="text-xs text-[var(--text-muted)] font-medium uppercase tracking-wide">
            Output
          </p>
          <CodeBlock code={card.expectedOutput} />
        </div>
      )}
      {card.blanks && card.blanks.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-[var(--text-muted)] font-medium uppercase tracking-wide">
            Answers
          </p>
          <div className="flex flex-wrap gap-2">
            {card.blanks.map((blank, i) => (
              <span
                key={i}
                className="inline-flex items-center px-2.5 py-1 rounded bg-[var(--accent-green)]/10 border border-[var(--accent-green)]/30 text-sm text-green-400 font-mono"
              >
                {blank}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function ReviewCard({ card, flipped, onFlip }: ReviewCardProps) {
  const branchMeta = BRANCH_META[card.branchId];

  return (
    <div
      className="w-full cursor-pointer select-none"
      style={{ perspective: 1200 }}
      onClick={onFlip}
    >
      <motion.div
        className="relative w-full"
        style={{ transformStyle: "preserve-3d" }}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Front face */}
        <div
          className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-5 min-h-[280px] flex flex-col"
          style={{ backfaceVisibility: "hidden" }}
        >
          {/* Top bar */}
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <Badge variant={cardTypeBadgeVariant[card.type]} size="xs">
                {cardTypeLabel[card.type]}
              </Badge>
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: branchMeta.colorHex }}
              />
              <span className="text-xs text-[var(--text-muted)]">
                {branchMeta.title}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1">
            <CardFront card={card} />
          </div>

          {/* Tap hint */}
          <p className="text-xs text-[var(--text-muted)] text-center mt-4">
            Tap to reveal answer
          </p>
        </div>

        {/* Back face */}
        <div
          className="absolute inset-0 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-5 min-h-[280px] flex flex-col"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          {/* Top bar */}
          <div className="flex items-center justify-between gap-2 mb-4">
            <Badge variant="green" size="xs">
              Answer
            </Badge>
            <div className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: branchMeta.colorHex }}
              />
              <span className="text-xs text-[var(--text-muted)]">
                {branchMeta.title}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1">
            <CardBack card={card} />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
