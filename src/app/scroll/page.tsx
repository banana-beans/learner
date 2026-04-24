"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { snippets, type Snippet, type SnippetLanguage } from "@/data/snippets";
import { BRANCH_META } from "@/lib/constants";

type Filter = "all" | SnippetLanguage;

const LANG_LABEL: Record<SnippetLanguage, string> = {
  python: "Python",
  csharp: "C#",
};

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function poolFor(filter: Filter): Snippet[] {
  return filter === "all" ? snippets : snippets.filter((s) => s.language === filter);
}

interface FeedState {
  filter: Filter;
  pages: Snippet[][];
}

const initialState: FeedState = {
  filter: "all",
  pages: [shuffle(poolFor("all"))],
};

export default function ScrollPage() {
  const [state, setState] = useState<FeedState>(initialState);
  const [activeIdx, setActiveIdx] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const { filter, pages } = state;

  // Flat ordered list. ids are reused across pages, so prefix with page index for stable React keys.
  const feed = useMemo<Snippet[]>(
    () => pages.flatMap((p, pageIdx) => p.map((s) => ({ ...s, id: `${pageIdx}-${s.id}` }))),
    [pages]
  );

  function handleFilterChange(next: Filter) {
    setState({ filter: next, pages: [shuffle(poolFor(next))] });
    setActiveIdx(0);
    containerRef.current?.scrollTo({ top: 0 });
  }

  function handleShuffle() {
    setState((prev) => ({ ...prev, pages: [shuffle(poolFor(prev.filter))] }));
    setActiveIdx(0);
    containerRef.current?.scrollTo({ top: 0 });
  }

  // Track which card is most-visible AND extend the feed when nearing the end.
  // Done as a single observer callback (event-driven) to avoid setState-in-effect cascades.
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const cards = Array.from(root.querySelectorAll<HTMLElement>("[data-card]"));
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting || e.intersectionRatio < 0.6) continue;
          const idx = Number((e.target as HTMLElement).dataset.idx);
          setActiveIdx(idx);

          // If we're within 3 cards of the current end, append a fresh shuffle
          // so the feed feels infinite.
          setState((prev) => {
            const totalLen = prev.pages.reduce((sum, p) => sum + p.length, 0);
            if (idx < totalLen - 3) return prev;
            return { ...prev, pages: [...prev.pages, shuffle(poolFor(prev.filter))] };
          });
        }
      },
      { root, threshold: [0.6] }
    );
    cards.forEach((c) => obs.observe(c));
    return () => obs.disconnect();
  }, [feed]);

  const filters: Array<{ key: Filter; label: string; color?: string }> = [
    { key: "all", label: "All" },
    { key: "python", label: "Python", color: BRANCH_META.python.colorHex },
    { key: "csharp", label: "C#", color: BRANCH_META.csharp.colorHex },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-5 space-y-3">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Scroll</h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Microlearning. No XP — just pick something up.
          </p>
        </div>
        <button
          onClick={handleShuffle}
          className="text-xs text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors"
        >
          Shuffle
        </button>
      </div>

      {/* Language filter */}
      <div className="flex gap-1.5">
        {filters.map((f) => {
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => handleFilterChange(f.key)}
              className="text-xs px-3 py-1 rounded-full border transition-colors"
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
      <div
        ref={containerRef}
        className="
          relative overflow-y-scroll snap-y snap-mandatory
          h-[calc(100dvh-220px)] md:h-[calc(100dvh-180px)]
          rounded-2xl border border-[var(--border)] bg-[var(--surface)]
        "
      >
        {feed.map((snip, i) => {
          const accent = BRANCH_META[snip.language].colorHex;
          return (
            <article
              key={snip.id}
              data-card
              data-idx={i}
              className="snap-start snap-always h-full flex flex-col p-5 relative"
            >
              <div
                className="absolute top-0 left-0 right-0 h-0.5"
                style={{ background: accent }}
              />

              <div className="flex items-center gap-2 mb-3">
                <span
                  className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-semibold border"
                  style={{
                    color: accent,
                    background: `${accent}1a`,
                    borderColor: `${accent}55`,
                  }}
                >
                  {LANG_LABEL[snip.language]}
                </span>
                {snip.tag && (
                  <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                    {snip.tag}
                  </span>
                )}
              </div>

              <h2 className="text-base font-semibold text-[var(--foreground)] mb-3">
                {snip.title}
              </h2>

              <pre className="
                flex-1 overflow-auto rounded-lg
                bg-[var(--background)] border border-[var(--border-subtle)]
                p-4 text-[13px] leading-relaxed text-[var(--foreground)]
                font-mono whitespace-pre
              ">
                <code>{snip.code}</code>
              </pre>

              <p className="mt-3 text-sm text-[var(--text-secondary)] leading-relaxed">
                {snip.explanation}
              </p>
            </article>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
        <span className="tabular-nums">
          {feed.length === 0 ? "0" : `#${activeIdx + 1}`}
          <span className="opacity-70"> · keeps going</span>
        </span>
        <span className="hidden sm:inline">Scroll or swipe for the next snippet</span>
      </div>
    </div>
  );
}
