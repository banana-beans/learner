"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { snippets, type Snippet, type SnippetLanguage } from "@/data/snippets";
import { BRANCH_META } from "@/lib/constants";
import { useGraveyardStore } from "@/store/graveyard-store";
import type { BranchId } from "@/lib/types";

type Filter = "all" | SnippetLanguage;

// Short labels for the filter chips. Falls back to BRANCH_META.title for
// languages we don't have a special abbreviation for.
const LANG_LABEL: Partial<Record<SnippetLanguage, string>> = {
  python: "Python",
  typescript: "TS",
  csharp: "C#",
  react: "React",
  dsa: "DS&A",
  databases: "DB",
  "systems-design": "Systems",
  networking: "Net",
  security: "Sec",
  devops: "DevOps",
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

export default function ScrollPage() {
  const [filter, setFilter] = useState<Filter>("all");
  const [activeIdx, setActiveIdx] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const viewed = useGraveyardStore((s) => s.viewed);
  const markViewed = useGraveyardStore((s) => s.markViewed);
  const markManyViewed = useGraveyardStore((s) => s.markManyViewed);
  const resetGraveyard = useGraveyardStore((s) => s.reset);
  const resetMatching = useGraveyardStore((s) => s.resetMatching);

  // SSR safety: don't filter by viewed until after client hydration.
  useEffect(() => {
    setHydrated(true);
  }, []);

  // Stats for the current filter (total / seen / remaining).
  const stats = useMemo(() => {
    const all = poolFor(filter);
    const total = all.length;
    const seen = all.filter((s) => viewed[s.id]).length;
    return { total, seen, remaining: total - seen };
  }, [filter, viewed]);

  // The active feed: pool minus graveyard, shuffled. Snapshot per (filter, hydrate)
  // so marking-as-viewed during scroll doesn't reshuffle and yank cards out from
  // under the user mid-read.
  const feed = useMemo<Snippet[]>(() => {
    if (!hydrated) return [];
    const fresh = poolFor(filter).filter((s) => !viewed[s.id]);
    return shuffle(fresh);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, hydrated]);

  // When activeIdx advances past N, mark card N as viewed.
  // Tracks the highest-seen index; we mark everything up to (activeIdx - 1).
  const lastMarkedRef = useRef(-1);
  useEffect(() => {
    if (!hydrated) return;
    if (feed.length === 0) return;
    // Mark everything strictly BEFORE activeIdx — they've scrolled past it.
    for (let i = lastMarkedRef.current + 1; i < activeIdx && i < feed.length; i++) {
      markViewed(feed[i].id);
    }
    if (activeIdx > lastMarkedRef.current) lastMarkedRef.current = activeIdx;
  }, [activeIdx, feed, hydrated, markViewed]);

  // Reset the lastMarked tracker when feed changes (filter switch or reset).
  useEffect(() => {
    lastMarkedRef.current = -1;
    setActiveIdx(0);
    containerRef.current?.scrollTo({ top: 0 });
  }, [feed]);

  // IntersectionObserver tracks which card is currently most-visible.
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

  function handleFilterChange(next: Filter) {
    setFilter(next);
  }

  function handleResetAll() {
    // Mark the current feed up to activeIdx, then clear the graveyard so the
    // user can scroll fresh. Without the pre-mark, switching the feed mid-scroll
    // would surprise the user with cards they just saw.
    markManyViewed(feed.slice(0, activeIdx).map((s) => s.id));
    resetGraveyard();
  }

  function handleResetCurrent() {
    if (filter === "all") {
      handleResetAll();
      return;
    }
    // Reset only the IDs for the current language. We need a stable predicate;
    // language is encoded in the snippet (not the id), so build a Set of IDs.
    const idsInFilter = new Set(poolFor(filter).map((s) => s.id));
    resetMatching((id) => !idsInFilter.has(id)); // KEEP others as viewed
  }

  // Filter chip list — only show chips for languages that actually have snippets.
  const filters: Array<{ key: Filter; label: string; color?: string }> = useMemo(() => {
    const byLang: Record<string, number> = {};
    for (const s of snippets) byLang[s.language] = (byLang[s.language] ?? 0) + 1;
    const list: Array<{ key: Filter; label: string; color?: string }> = [
      { key: "all", label: "All" },
    ];
    for (const lang of Object.keys(byLang) as SnippetLanguage[]) {
      const meta = BRANCH_META[lang as BranchId];
      list.push({
        key: lang,
        label: LANG_LABEL[lang] ?? meta?.title ?? lang,
        color: meta?.colorHex,
      });
    }
    return list;
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 py-5 space-y-3">
      {/* Header */}
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Scroll</h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Microlearning. No XP — viewed snippets go to the graveyard.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="text-xs text-[var(--text-muted)] tabular-nums">
            {hydrated ? `${stats.seen}/${stats.total} seen` : ""}
          </span>
          <button
            onClick={handleResetCurrent}
            disabled={!hydrated || stats.seen === 0}
            className="text-xs text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors disabled:opacity-30"
          >
            Reset {filter === "all" ? "all" : LANG_LABEL[filter] ?? filter}
          </button>
        </div>
      </div>

      {/* Language filter — overflow-scroll for many chips on mobile */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
        {filters.map((f) => {
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => handleFilterChange(f.key)}
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

      {/* Feed OR exhausted state */}
      {hydrated && feed.length === 0 ? (
        <div
          className="
            flex flex-col items-center justify-center text-center gap-3
            h-[calc(100dvh-220px)] md:h-[calc(100dvh-180px)]
            rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-6
          "
        >
          <div className="text-4xl">📭</div>
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            You&apos;ve seen them all
          </h2>
          <p className="text-sm text-[var(--text-muted)] max-w-sm">
            {stats.total === 0
              ? "No snippets in this filter yet."
              : `You've reviewed all ${stats.total} ${
                  filter === "all" ? "snippets" : LANG_LABEL[filter] ?? filter
                }. Reset to scroll them again, or pick another filter.`}
          </p>
          {stats.total > 0 && (
            <button
              onClick={handleResetCurrent}
              className="text-sm px-4 py-2 rounded-lg bg-[var(--accent-blue)] text-white font-medium hover:brightness-110"
            >
              Reset graveyard
            </button>
          )}
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
          {feed.map((snip, i) => {
            const meta = BRANCH_META[snip.language as BranchId];
            const accent = meta?.colorHex ?? "#4f8ef7";
            const langLabel = LANG_LABEL[snip.language] ?? meta?.title ?? snip.language;
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
                    {langLabel}
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

                <pre
                  className="
                    flex-1 overflow-auto rounded-lg
                    bg-[var(--background)] border border-[var(--border-subtle)]
                    p-4 text-[13px] leading-relaxed text-[var(--foreground)]
                    font-mono whitespace-pre
                  "
                  style={{ WebkitOverflowScrolling: "touch" }}
                >
                  <code>{snip.code}</code>
                </pre>

                <p className="mt-3 text-sm text-[var(--text-secondary)] leading-relaxed">
                  {snip.explanation}
                </p>
              </article>
            );
          })}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
        <span className="tabular-nums">
          {feed.length === 0 ? "0" : `#${activeIdx + 1} of ${feed.length}`}
          <span className="opacity-70"> · {stats.remaining} fresh</span>
        </span>
        <span className="hidden sm:inline">Swipe / scroll for the next snippet</span>
      </div>
    </div>
  );
}
