"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Card, CardHeader } from "@/components/common/Card";
import { Badge, RarityBadge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { XPBar } from "@/components/layout/XPBar";
import { StreakCalendar } from "@/components/gamification/StreakCalendar";
import { useUserStore } from "@/store/user-store";
import { useProgressStore } from "@/store/progress-store";
import { achievements } from "@/data/achievements";
import { RARITY_COLORS } from "@/lib/constants";

/** Extract initials from a username */
function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/** Build recent activity data from XP history for the calendar */
function buildActivityData(
  xpHistory: Array<{ timestamp: string }>,
): Array<{ date: string; count: number }> {
  const countMap = new Map<string, number>();
  for (const event of xpHistory) {
    const date = event.timestamp.split("T")[0];
    countMap.set(date, (countMap.get(date) ?? 0) + 1);
  }
  return Array.from(countMap.entries()).map(([date, count]) => ({ date, count }));
}

export default function ProfilePage() {
  const { profile, totalXP, level, streak, xpHistory } = useUserStore();
  const { completedNodes, masteredNodes, earnedAchievements } = useProgressStore();

  const username = profile?.username ?? "Learner";
  const activeTitle = profile?.activeTitle ?? "Newcomer";
  const initials = getInitials(username);

  // Activity data for the streak calendar
  const activityData = useMemo(() => buildActivityData(xpHistory), [xpHistory]);

  // Streak start date (today minus currentStreak days)
  const streakStartDate = useMemo(() => {
    if (streak.currentStreak <= 0) return undefined;
    const d = new Date();
    d.setDate(d.getDate() - streak.currentStreak + 1);
    return d.toISOString().split("T")[0];
  }, [streak.currentStreak]);

  // Earned achievements with full data
  const earnedAchievementData = useMemo(() => {
    const earnedSet = new Set(earnedAchievements);
    return achievements.filter((a) => earnedSet.has(a.id));
  }, [earnedAchievements]);

  // First 6 for the showcase
  const showcaseAchievements = earnedAchievementData.slice(0, 6);

  const stats = [
    { label: "Total XP", value: totalXP.toLocaleString(), color: "var(--xp-gold)" },
    { label: "Level", value: level, color: "var(--xp-gold)" },
    {
      label: "Current Streak",
      value: `${streak.currentStreak}d`,
      color: streak.currentStreak > 0 ? "var(--accent-orange)" : "var(--text-muted)",
    },
    {
      label: "Longest Streak",
      value: `${streak.longestStreak}d`,
      color: "var(--accent-orange)",
    },
    {
      label: "Nodes Completed",
      value: completedNodes.length,
      color: "var(--accent-green)",
    },
    {
      label: "Achievements",
      value: earnedAchievements.length,
      color: "var(--accent-purple)",
    },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Profile</h1>
        <Link href="/settings">
          <Button variant="secondary" size="sm">
            Edit Profile
          </Button>
        </Link>
      </div>

      {/* User identity card */}
      <Card>
        <div className="flex items-center gap-4">
          {/* Avatar circle with initials */}
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--accent-blue)] to-[var(--accent-purple)] flex items-center justify-center shrink-0">
            <span className="text-xl font-bold text-white">{initials}</span>
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-[var(--foreground)] truncate">
              {username}
            </h2>
            <Badge variant="gold" size="sm">
              {activeTitle}
            </Badge>
          </div>
        </div>

        {/* Level progress */}
        <div className="mt-4">
          <XPBar />
        </div>
      </Card>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {stats.map((stat) => (
          <Card key={stat.label} padding="sm">
            <p className="text-xs text-[var(--text-muted)]">{stat.label}</p>
            <p
              className="text-xl font-black mt-0.5 tabular-nums"
              style={{ color: stat.color }}
            >
              {stat.value}
            </p>
          </Card>
        ))}
      </div>

      {/* Streak Calendar */}
      <Card>
        <CardHeader
          title="Activity"
          subtitle={`${streak.currentStreak} day streak`}
        />
        <StreakCalendar
          activityData={activityData}
          frozenDates={streak.frozenDates}
          streakStartDate={streakStartDate}
        />
      </Card>

      {/* Achievement Showcase */}
      <Card>
        <CardHeader
          title="Achievements"
          subtitle={`${earnedAchievements.length} earned`}
          right={
            earnedAchievementData.length > 6 ? (
              <Badge variant="default" size="sm">
                +{earnedAchievementData.length - 6} more
              </Badge>
            ) : undefined
          }
        />
        {showcaseAchievements.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)] text-center py-6">
            No achievements earned yet. Start learning to unlock your first!
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {showcaseAchievements.map((achievement) => {
              const rarityColor = RARITY_COLORS[achievement.rarity];
              return (
                <div
                  key={achievement.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border)]"
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-base shrink-0"
                    style={{ background: `${rarityColor}18` }}
                  >
                    {/* Simple emoji fallback for icon */}
                    {"\uD83C\uDFC6"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[var(--foreground)] truncate">
                      {achievement.title}
                    </p>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5 line-clamp-1">
                      {achievement.description}
                    </p>
                    <div className="mt-1.5">
                      <RarityBadge rarity={achievement.rarity} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
