"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Card, CardHeader } from "@/components/common/Card";
import { Badge, XPBadge } from "@/components/common/Badge";
import { ProgressBar } from "@/components/common/ProgressBar";
import { XPBar } from "@/components/layout/XPBar";
import { StreakBadge } from "@/components/layout/StreakBadge";
import { Button } from "@/components/common/Button";
import { useUserStore } from "@/store/user-store";
import { useProgressStore } from "@/store/progress-store";
import { useReviewStore } from "@/store/review-store";
import { suggestSession } from "@/engine/session";
import { getBranchProgress } from "@/engine/progression";
import { BRANCH_META } from "@/lib/constants";
import curriculum from "@/data/curriculum";
import type { BranchId } from "@/lib/types";

const SESSION_MODE_LABELS: Record<string, string> = {
  quick: "Quick Session",
  standard: "Standard Session",
  deep: "Deep Dive",
  review: "Review Session",
};

const SESSION_MODE_BADGE_VARIANT = {
  quick: "green",
  standard: "blue",
  deep: "purple",
  review: "cyan",
} as const;

const SESSION_MODE_COLORS: Record<string, string> = {
  quick: "var(--accent-green)",
  standard: "var(--accent-blue)",
  deep: "var(--accent-purple)",
  review: "var(--accent-cyan)",
};

const FEATURED_BRANCHES: BranchId[] = ["python", "typescript", "react"];

export default function DashboardPage() {
  const { streak, totalXP, level, updateStreak } = useUserStore();
  const progress = useProgressStore();
  const { cards } = useReviewStore();

  // Mark today as active on mount
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    updateStreak(today);
  }, [updateStreak]);

  const allCards = Object.values(cards);
  const session = suggestSession(
    {
      completedNodes: progress.completedNodes,
      masteredNodes: progress.masteredNodes,
      inProgressNodes: progress.inProgressNodes,
      unlockedNodes: progress.unlockedNodes,
      lessonResults: progress.lessonResults,
      challengeResults: progress.challengeResults,
      earnedAchievements: progress.earnedAchievements,
    },
    streak,
    allCards,
    curriculum
  );

  const dueCardCount = allCards.filter(
    (c) =>
      c.fsrs.state !== "new" &&
      c.state !== "suspended" &&
      c.state !== "buried" &&
      new Date(c.dueDate) <= new Date()
  ).length;

  const sessionXP = session.activities.reduce((s, a) => s + a.xpEstimate, 0);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Dashboard</h1>
        <p className="text-sm text-[var(--text-muted)] mt-0.5">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Level", value: level, color: "var(--xp-gold)" },
          { label: "Total XP", value: totalXP.toLocaleString(), color: "var(--foreground)" },
          {
            label: "Streak",
            value: `${streak.currentStreak}d`,
            color: streak.currentStreak > 0 ? "var(--accent-orange)" : "var(--text-muted)",
          },
          {
            label: "Due Cards",
            value: dueCardCount,
            color: dueCardCount > 0 ? "var(--accent-cyan)" : "var(--text-muted)",
          },
        ].map((stat) => (
          <Card key={stat.label} padding="sm">
            <p className="text-xs text-[var(--text-muted)]">{stat.label}</p>
            <p className="text-xl font-black mt-0.5 tabular-nums" style={{ color: stat.color }}>
              {stat.value}
            </p>
          </Card>
        ))}
      </div>

      {/* Level progress */}
      <Card>
        <CardHeader title="Level Progress" />
        <XPBar />
      </Card>

      {/* Streak */}
      <Card accent="var(--accent-orange)">
        <CardHeader title="Learning Streak" />
        <StreakBadge />
      </Card>

      {/* Suggested session */}
      <Card accent={SESSION_MODE_COLORS[session.mode]}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <Badge variant={SESSION_MODE_BADGE_VARIANT[session.mode]}>
                {SESSION_MODE_LABELS[session.mode]}
              </Badge>
              <span className="text-xs text-[var(--text-muted)]">
                ~{session.estimatedMinutes} min
              </span>
            </div>
            <h3 className="font-semibold text-[var(--foreground)] mb-1">{session.reason}</h3>
            <p className="text-sm text-[var(--text-muted)]">
              {session.activities.length} activities ·{" "}
              <span className="text-[var(--xp-gold)]">~{sessionXP} XP</span>
            </p>
          </div>
          <Link href={session.mode === "review" ? "/review" : "/tree"}>
            <Button variant="primary" size="sm">
              Start
            </Button>
          </Link>
        </div>

        {session.activities.length > 0 && (
          <ul className="mt-4 space-y-2 border-t border-[var(--border)] pt-4">
            {session.activities.slice(0, 4).map((activity, i) => (
              <li
                key={i}
                className="flex items-center gap-2.5 text-sm text-[var(--text-secondary)]"
              >
                <span className="w-5 h-5 rounded bg-[var(--surface-3)] flex items-center justify-center text-[10px] font-bold text-[var(--text-muted)] shrink-0">
                  {i + 1}
                </span>
                <span className="flex-1 truncate">{activity.label}</span>
                <XPBadge amount={activity.xpEstimate} />
              </li>
            ))}
            {session.activities.length > 4 && (
              <li className="text-xs text-[var(--text-muted)] pl-8">
                +{session.activities.length - 4} more
              </li>
            )}
          </ul>
        )}
      </Card>

      {/* Branch progress */}
      <Card>
        <CardHeader
          title="Branch Progress"
          subtitle="Your journey across the learning branches"
          right={
            <Link href="/tree">
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </Link>
          }
        />
        <div className="space-y-3.5">
          {FEATURED_BRANCHES.map((branchId) => {
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
                <ProgressBar
                  value={bp.completionFraction}
                  color={meta.colorHex}
                  height={4}
                />
              </div>
            );
          })}
        </div>
      </Card>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/review" className="block">
          <Card interactive accent="var(--accent-cyan)" className="h-full">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--accent-cyan)]/10 flex items-center justify-center shrink-0">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--accent-cyan)"
                  strokeWidth="2"
                >
                  <rect x="2" y="5" width="20" height="14" rx="2" />
                  <line x1="2" y1="10" x2="22" y2="10" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-sm text-[var(--foreground)]">Review</p>
                <p className="text-xs text-[var(--text-muted)]">
                  {dueCardCount > 0 ? `${dueCardCount} cards due` : "Queue empty"}
                </p>
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/tree" className="block">
          <Card interactive accent="var(--accent-blue)" className="h-full">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--accent-blue)]/10 flex items-center justify-center shrink-0">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--accent-blue)"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="5" r="3" />
                  <circle cx="5" cy="19" r="3" />
                  <circle cx="19" cy="19" r="3" />
                  <line x1="12" y1="8" x2="12" y2="14" />
                  <line x1="12" y1="14" x2="5" y2="16" />
                  <line x1="12" y1="14" x2="19" y2="16" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-sm text-[var(--foreground)]">Skill Tree</p>
                <p className="text-xs text-[var(--text-muted)]">
                  {progress.completedNodes.length} completed
                </p>
              </div>
            </div>
          </Card>
        </Link>
      </div>
    </div>
  );
}
