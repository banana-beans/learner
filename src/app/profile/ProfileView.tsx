"use client";

import Link from "next/link";
import { Card, CardHeader } from "@/components/common/Card";
import { Badge } from "@/components/common/Badge";
import { ProgressBar } from "@/components/common/ProgressBar";
import { Button } from "@/components/common/Button";
import { useUserStore } from "@/store/user-store";
import { useProgressStore } from "@/store/progress-store";
import { useReviewStore } from "@/store/review-store";
import { BRANCH_META, LEVEL_XP_TABLE, RARITY_COLORS } from "@/lib/constants";
import { achievements as ACHIEVEMENTS } from "@/data/achievements";
import { getBranchProgress } from "@/engine/progression";
import curriculum from "@/data/curriculum";
import type { BranchId } from "@/lib/types";

const BRANCHES: BranchId[] = [
  "python",
  "typescript",
  "react",
  "csharp",
  "dsa",
  "databases",
  "systems-design",
  "networking",
  "security",
  "devops",
];

export function ProfileView() {
  const { profile, totalXP, level, streak, xpHistory } = useUserStore();
  const progress = useProgressStore();
  const cards = useReviewStore((s) => s.cards);

  const xpForNext = LEVEL_XP_TABLE[level + 1] ?? LEVEL_XP_TABLE[level] * 1.5;
  const xpAtLevel = LEVEL_XP_TABLE[level] ?? 0;
  const levelFraction = Math.min(
    1,
    (totalXP - xpAtLevel) / Math.max(1, xpForNext - xpAtLevel)
  );

  const earnedSet = new Set(progress.earnedAchievements);
  const earned = ACHIEVEMENTS.filter((a) => earnedSet.has(a.id));
  const totalCards = Object.keys(cards).length;
  const totalReviews = xpHistory.filter((e) => e.source === "review_card").length;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
      {/* Identity */}
      <Card padding="lg">
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black"
            style={{ background: "var(--accent-blue)", color: "white" }}
          >
            {(profile?.username ?? "L").slice(0, 1).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-[var(--foreground)]">
              {profile?.username ?? "Learner"}
            </h1>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              {profile?.activeTitle ?? "Newcomer"} · Level {level}
            </p>
            <div className="mt-2">
              <ProgressBar
                value={levelFraction}
                color="var(--xp-gold)"
                height={4}
              />
              <p className="text-[10px] text-[var(--text-muted)] mt-1 tabular-nums">
                {totalXP.toLocaleString()} / {Math.round(xpForNext).toLocaleString()} XP
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total XP", value: totalXP.toLocaleString(), color: "var(--xp-gold)" },
          { label: "Streak", value: `${streak.currentStreak}d`, color: "var(--accent-orange)" },
          { label: "Longest", value: `${streak.longestStreak}d`, color: "var(--accent-orange)" },
          { label: "Reviews", value: totalReviews, color: "var(--accent-cyan)" },
        ].map((s) => (
          <Card key={s.label} padding="sm">
            <p className="text-xs text-[var(--text-muted)]">{s.label}</p>
            <p className="text-xl font-black mt-0.5 tabular-nums" style={{ color: s.color }}>
              {s.value}
            </p>
          </Card>
        ))}
      </div>

      {/* Branch progress */}
      <Card>
        <CardHeader title="Branch Progress" subtitle="Across all 10 branches" />
        <div className="space-y-3">
          {BRANCHES.map((branchId) => {
            const meta = BRANCH_META[branchId];
            const bp = getBranchProgress(
              branchId,
              {
                completedNodes: progress.completedNodes,
                masteredNodes: progress.masteredNodes,
                inProgressNodes: progress.inProgressNodes,
                unlockedNodes: progress.unlockedNodes,
                lessonResults: progress.lessonResults,
                challengeResults: progress.challengeResults,
                earnedAchievements: progress.earnedAchievements,
              },
              curriculum
            );
            return (
              <div key={branchId}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: meta.colorHex }}
                    />
                    <span className="text-sm font-medium text-[var(--foreground)]">
                      {meta.title}
                    </span>
                  </div>
                  <span className="text-xs text-[var(--text-muted)] tabular-nums">
                    {bp.completedNodes}/{bp.totalNodes}
                  </span>
                </div>
                <ProgressBar value={bp.completionFraction} color={meta.colorHex} height={3} />
              </div>
            );
          })}
        </div>
      </Card>

      {/* Achievements */}
      <Card>
        <CardHeader
          title="Achievements"
          subtitle={`${earned.length} of ${ACHIEVEMENTS.length} earned`}
        />
        {earned.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)] text-center py-6">
            Complete lessons and challenges to earn achievements.
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {earned.slice(0, 12).map((a) => (
              <div
                key={a.id}
                className="p-3 rounded-lg border border-[var(--border)] bg-[var(--surface-2)]"
                style={{ borderLeftColor: RARITY_COLORS[a.rarity], borderLeftWidth: 3 }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-[var(--foreground)] truncate">
                    {a.title}
                  </span>
                  <Badge variant="default" size="sm">
                    {a.rarity}
                  </Badge>
                </div>
                <p className="text-[11px] text-[var(--text-muted)] line-clamp-2">
                  {a.description}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Card library */}
      <Card>
        <CardHeader
          title="Review Library"
          subtitle={`${totalCards} cards in your spaced-repetition queue`}
          right={
            <Link href="/review">
              <Button variant="ghost" size="sm">
                Review now
              </Button>
            </Link>
          }
        />
      </Card>
    </div>
  );
}
