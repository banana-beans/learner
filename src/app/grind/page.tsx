"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { leetcodeProblems, type LeetCodeProblem, type Difficulty } from "@/data/leetcode";

type DifficultyFilter = "all" | Difficulty;

const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

const DIFFICULTY_COLOR: Record<Difficulty, string> = {
  easy: "#22c55e",
  medium: "#f59e0b",
  hard: "#ef4444",
};

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export default function GrindPage() {
  const [filter, setFilter] = useState<DifficultyFilter>("all");
  const [activeIdx, setActiveIdx] = useState(0);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [shuffleSeed, setShuffleSeed] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const pool = useMemo(() => {
    if (filter === "all") return leetcodeProblems;
    return leetcodeProblems.filter((p) => p.difficulty === filter);
  }, [filter]);

  const feed = useMemo<LeetCodeProblem[]>(() => {
    return shuffle(pool);
    // shuffleSeed forces a re-shuffle when the user clicks "Shuffle"
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pool, shuffleSeed]);

  useEffect(() => {
    setActiveIdx(0);
    containerRef.current?.scrollTo({ top: 0 });
  }, [feed]);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    if (feed.length === 0) return;
    const cards = Array.from(root.querySelectorAll<HTMLElement>("[data-card]"));
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting || e.intersectionRatio < 0.6) continue;
          const idx = Number((e.target as HTMLElement).dataset.idx);
          setActiveIdx(idx);
        }
      },
      { root, threshold: [0.6] }
    );
    cards.forEach((c) => obs.observe(c));
    return () => obs.disconnect();
  }, [feed]);

  function toggleReveal(id: string) {
    setRevealed((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  const filters: Array<{ key: DifficultyFilter; label: string; color?: string }> = [
    { key: "all", label: "All" },
    { key: "easy", label: "Easy", color: DIFFICULTY_COLOR.easy },
    { key: "medium", label: "Medium", color: DIFFICULTY_COLOR.medium },
    { key: "hard", label: "Hard", color: DIFFICULTY_COLOR.hard },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-5 space-y-3">
      {/* Header */}
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Grind</h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Interview reps. Try to solve, then tap to reveal.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="text-xs text-[var(--text-muted)] tabular-nums">
            {pool.length} problem{pool.length === 1 ? "" : "s"}
          </span>
          <button
            onClick={() => setShuffleSeed((s) => s + 1)}
            className="text-xs text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors"
          >
            Shuffle
          </button>
        </div>
      </div>

      {/* Difficulty filter */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
        {filters.map((f) => {
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className="text-xs px-3 py-1 rounded-full border transition-colors whitespace-nowrap shrink-0"
              style={
                active
                  ? {
                      color: f.color ?? "var(--accent-blue)",
                      background: `${f.color ?? "#4f8ef7"}1a`,
                      borderColor: `${f.color ?? "#4f8ef7"}55`,
                    }
                  : {
                      color: "var(--text-muted)",
                      borderColor: "var(--border)",
                    }
              }
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Feed */}
      {feed.length === 0 ? (
        <div
          className="
            flex flex-col items-center justify-center text-center gap-3
            h-[calc(100dvh-220px)] md:h-[calc(100dvh-180px)]
            rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-6
          "
        >
          <div className="text-4xl">🧠</div>
          <p className="text-sm text-[var(--text-muted)]">No problems in this filter yet.</p>
        </div>
      ) : (
        <div
          ref={containerRef}
          className="
            relative overflow-y-scroll snap-y snap-mandatory
            h-[calc(100dvh-220px)] md:h-[calc(100dvh-180px)]
            rounded-2xl border border-[var(--border)] bg-[var(--surface)]
          "
        >
          {feed.map((p, i) => {
            const isRevealed = !!revealed[p.id];
            const accent = DIFFICULTY_COLOR[p.difficulty];
            return (
              <article
                key={p.id}
                data-card
                data-idx={i}
                className="snap-start snap-always h-full flex flex-col p-5 relative overflow-y-auto"
                style={{ WebkitOverflowScrolling: "touch" }}
              >
                <div
                  className="absolute top-0 left-0 right-0 h-0.5"
                  style={{ background: accent }}
                />

                {/* Badges */}
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <span
                    className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-semibold border"
                    style={{
                      color: accent,
                      background: `${accent}1a`,
                      borderColor: `${accent}55`,
                    }}
                  >
                    {DIFFICULTY_LABEL[p.difficulty]}
                  </span>
                  {p.topics.slice(0, 3).map((t) => (
                    <span
                      key={t}
                      className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]"
                    >
                      {t}
                    </span>
                  ))}
                  {p.leetcodeNumber && (
                    <span className="text-[10px] text-[var(--text-muted)] ml-auto tabular-nums">
                      #{p.leetcodeNumber}
                    </span>
                  )}
                </div>

                {/* Title */}
                <h2 className="text-base font-semibold text-[var(--foreground)] mb-3">
                  {p.title}
                </h2>

                {/* Problem */}
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-3 whitespace-pre-wrap">
                  {p.problem}
                </p>

                {/* Examples */}
                {p.examples.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {p.examples.map((ex, idx) => (
                      <div
                        key={idx}
                        className="rounded-lg border border-[var(--border-subtle)] bg-[var(--background)] p-3 text-xs font-mono"
                      >
                        <div className="text-[var(--text-muted)]">Input:</div>
                        <div className="text-[var(--foreground)] whitespace-pre-wrap break-all">
                          {ex.input}
                        </div>
                        <div className="text-[var(--text-muted)] mt-1">Output:</div>
                        <div className="text-[var(--foreground)] whitespace-pre-wrap break-all">
                          {ex.output}
                        </div>
                        {ex.explanation && (
                          <div className="text-[var(--text-muted)] mt-1 italic">
                            {ex.explanation}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Constraints */}
                {p.constraints && p.constraints.length > 0 && (
                  <details className="mb-3 text-xs">
                    <summary className="cursor-pointer text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors">
                      Constraints
                    </summary>
                    <ul className="mt-1 ml-4 list-disc text-[var(--text-secondary)] space-y-0.5">
                      {p.constraints.map((c, idx) => (
                        <li key={idx}>{c}</li>
                      ))}
                    </ul>
                  </details>
                )}

                {/* Reveal / Hide */}
                <button
                  onClick={() => toggleReveal(p.id)}
                  className="text-sm px-4 py-2 rounded-lg font-medium transition-colors self-start"
                  style={{
                    background: isRevealed
                      ? "var(--surface-2)"
                      : "var(--accent-blue)",
                    color: isRevealed ? "var(--text-secondary)" : "white",
                  }}
                >
                  {isRevealed ? "Hide solution" : "Reveal solution"}
                </button>

                {/* Solution */}
                {isRevealed && (
                  <div className="mt-3 space-y-3">
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                      <span className="font-semibold text-[var(--foreground)]">Approach: </span>
                      {p.approach}
                    </p>
                    <pre
                      className="
                        overflow-auto rounded-lg
                        bg-[var(--background)] border border-[var(--border-subtle)]
                        p-4 text-[13px] leading-relaxed text-[var(--foreground)]
                        font-mono whitespace-pre
                      "
                      style={{ WebkitOverflowScrolling: "touch" }}
                    >
                      <code>{p.code}</code>
                    </pre>
                    <div className="flex gap-4 text-xs text-[var(--text-muted)] font-mono">
                      <span>
                        <span className="text-[var(--text-secondary)]">Time:</span> {p.complexity.time}
                      </span>
                      <span>
                        <span className="text-[var(--text-secondary)]">Space:</span> {p.complexity.space}
                      </span>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
        <span className="tabular-nums">
          {feed.length === 0 ? "0" : `#${activeIdx + 1} of ${feed.length}`}
        </span>
        <span className="hidden sm:inline">Swipe / scroll for the next problem</span>
      </div>
    </div>
  );
}
