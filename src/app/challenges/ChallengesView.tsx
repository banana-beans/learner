"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Card, CardHeader } from "@/components/common/Card";
import { Badge } from "@/components/common/Badge";
import { allChallenges } from "@/data/challenges";
import { useProgressStore } from "@/store/progress-store";
import type { Challenge, DifficultyStars } from "@/lib/types";

const DIFFICULTY_LABELS = ["", "Beginner", "Easy", "Medium", "Hard", "Expert"];
const DIFFICULTY_VARIANTS = ["default", "green", "blue", "yellow", "orange", "red"] as const;

type Filter = "all" | "todo" | "done" | "boss";

export function ChallengesView() {
  const challengeResults = useProgressStore((s) => s.challengeResults);
  const [filter, setFilter] = useState<Filter>("all");

  const all: Challenge[] = allChallenges;

  const filtered = useMemo(() => {
    return all.filter((c) => {
      const done = !!challengeResults[c.id];
      if (filter === "todo") return !done;
      if (filter === "done") return done;
      if (filter === "boss") return c.isBoss;
      return true;
    });
  }, [all, challengeResults, filter]);

  const grouped = useMemo(() => {
    const map = new Map<string, Challenge[]>();
    for (const c of filtered) {
      const key = c.nodeId;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(c);
    }
    return Array.from(map.entries());
  }, [filtered]);

  const stats = useMemo(() => {
    const done = all.filter((c) => challengeResults[c.id]).length;
    return { done, total: all.length };
  }, [all, challengeResults]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Challenges</h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5 tabular-nums">
            {stats.done} / {stats.total} solved
          </p>
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {(["all", "todo", "done", "boss"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={[
              "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors capitalize whitespace-nowrap",
              filter === f
                ? "bg-[var(--accent-blue)] border-[var(--accent-blue)] text-white"
                : "border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)]",
            ].join(" ")}
          >
            {f === "todo" ? "To do" : f}
          </button>
        ))}
      </div>

      {/* Grouped list */}
      {grouped.length === 0 ? (
        <Card padding="lg">
          <p className="text-sm text-[var(--text-muted)] text-center">
            Nothing matches that filter.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {grouped.map(([nodeId, list]) => (
            <Card key={nodeId}>
              <CardHeader title={nodeIdToTitle(nodeId)} subtitle={`${list.length} challenge${list.length === 1 ? "" : "s"}`} />
              <ul className="space-y-2">
                {list.map((c) => {
                  const done = !!challengeResults[c.id];
                  return (
                    <li key={c.id}>
                      <Link
                        href={`/learn/${c.nodeId}?tab=challenge`}
                        className="flex items-center gap-3 p-3 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] hover:border-[var(--accent-blue)]/50 transition-colors"
                      >
                        <DifficultyDots stars={c.difficulty} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[var(--foreground)] truncate">
                            {c.title}
                          </p>
                          <p className="text-[11px] text-[var(--text-muted)] truncate">
                            {DIFFICULTY_LABELS[c.difficulty]} · {c.baseXP} XP
                            {c.isBoss && " · Boss"}
                          </p>
                        </div>
                        {done ? (
                          <Badge variant="green" size="sm">Done</Badge>
                        ) : (
                          <Badge variant={DIFFICULTY_VARIANTS[c.difficulty]} size="sm">
                            Try
                          </Badge>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function nodeIdToTitle(nodeId: string): string {
  const parts = nodeId.split(":");
  const slug = parts[parts.length - 1] ?? nodeId;
  return slug.replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

function DifficultyDots({ stars }: { stars: DifficultyStars }) {
  return (
    <div className="flex gap-0.5 shrink-0">
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className={[
            "w-1.5 h-1.5 rounded-full",
            n <= stars ? "bg-[var(--accent-yellow)]" : "bg-[var(--surface-3)]",
          ].join(" ")}
        />
      ))}
    </div>
  );
}
