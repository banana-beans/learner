"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";

interface ActivityDay {
  date: string;
  count: number;
}

interface StreakCalendarProps {
  activityData: ActivityDay[];
  frozenDates: string[];
  streakStartDate?: string;
}

const DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];
const TOTAL_WEEKS = 12;
const TOTAL_DAYS = TOTAL_WEEKS * 7;

/** Returns intensity level 0-3 based on activity count */
function getIntensity(count: number): number {
  if (count <= 0) return 0;
  if (count <= 1) return 1;
  if (count <= 3) return 2;
  return 3;
}

/** Color per intensity level using accent-green */
const INTENSITY_COLORS: Record<number, string> = {
  0: "var(--surface-3)",
  1: "rgba(34, 197, 94, 0.25)",
  2: "rgba(34, 197, 94, 0.50)",
  3: "rgba(34, 197, 94, 0.85)",
};

const FROZEN_COLOR = "rgba(56, 189, 248, 0.35)";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function StreakCalendar({
  activityData,
  frozenDates,
  streakStartDate,
}: StreakCalendarProps) {
  const [tooltip, setTooltip] = useState<{
    date: string;
    count: number;
    x: number;
    y: number;
  } | null>(null);

  // Build date grid: last 84 days (12 weeks), ending today
  const grid = useMemo(() => {
    const activityMap = new Map(activityData.map((d) => [d.date, d.count]));
    const frozenSet = new Set(frozenDates);

    const today = new Date();
    // Go back to fill 12 complete weeks ending on today's day of week
    const endDate = new Date(today);
    const daysFromMonday = (today.getDay() + 6) % 7; // 0 = Mon
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - (TOTAL_DAYS - 1) - daysFromMonday + (6 - daysFromMonday));
    // Simpler: just go back TOTAL_DAYS from today, align to start of the week
    const gridStart = new Date(today);
    gridStart.setDate(gridStart.getDate() - TOTAL_DAYS + 1);
    // Align to previous Monday
    const dayOfWeek = (gridStart.getDay() + 6) % 7; // 0=Mon
    gridStart.setDate(gridStart.getDate() - dayOfWeek);

    const days: Array<{
      date: string;
      count: number;
      frozen: boolean;
      inStreak: boolean;
      isToday: boolean;
    }> = [];

    const todayStr = today.toISOString().split("T")[0];
    const current = new Date(gridStart);

    while (days.length < TOTAL_WEEKS * 7) {
      const dateStr = current.toISOString().split("T")[0];
      const count = activityMap.get(dateStr) ?? 0;
      const frozen = frozenSet.has(dateStr);
      const inStreak =
        streakStartDate != null ? dateStr >= streakStartDate && dateStr <= todayStr : false;

      days.push({
        date: dateStr,
        count,
        frozen,
        inStreak,
        isToday: dateStr === todayStr,
      });

      current.setDate(current.getDate() + 1);
    }

    return days;
  }, [activityData, frozenDates, streakStartDate]);

  // Extract month labels from the grid
  const monthLabels = useMemo(() => {
    const labels: Array<{ label: string; weekIndex: number }> = [];
    let lastMonth = -1;

    for (let week = 0; week < TOTAL_WEEKS; week++) {
      const dayIndex = week * 7; // first day (Monday) of the week
      if (dayIndex >= grid.length) break;
      const d = new Date(grid[dayIndex].date + "T00:00:00");
      const month = d.getMonth();
      if (month !== lastMonth) {
        labels.push({
          label: d.toLocaleDateString("en-US", { month: "short" }),
          weekIndex: week,
        });
        lastMonth = month;
      }
    }
    return labels;
  }, [grid]);

  return (
    <div className="relative">
      {/* Month labels */}
      <div className="flex ml-8 mb-1 text-[10px] text-[var(--text-muted)]">
        {monthLabels.map((m) => (
          <span
            key={`${m.label}-${m.weekIndex}`}
            className="absolute"
            style={{ left: `${32 + m.weekIndex * 16}px` }}
          >
            {m.label}
          </span>
        ))}
      </div>

      <div className="flex gap-0.5 mt-5">
        {/* Day labels (left side) */}
        <div className="flex flex-col gap-0.5 shrink-0 pr-1.5">
          {DAY_LABELS.map((label, i) => (
            <div
              key={i}
              className="h-[12px] w-6 text-[10px] text-[var(--text-muted)] flex items-center justify-end"
            >
              {label}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="flex gap-0.5">
          {Array.from({ length: TOTAL_WEEKS }, (_, weekIdx) => (
            <div key={weekIdx} className="flex flex-col gap-0.5">
              {Array.from({ length: 7 }, (_, dayIdx) => {
                const idx = weekIdx * 7 + dayIdx;
                const day = grid[idx];
                if (!day) return <div key={dayIdx} className="w-3 h-3" />;

                const intensity = getIntensity(day.count);
                const bgColor = day.frozen
                  ? FROZEN_COLOR
                  : INTENSITY_COLORS[intensity];

                return (
                  <motion.div
                    key={day.date}
                    className="w-3 h-3 rounded-[2px] cursor-pointer"
                    style={{
                      background: bgColor,
                      outline: day.isToday
                        ? "1.5px solid var(--foreground)"
                        : day.inStreak && intensity > 0
                          ? "1px solid var(--accent-green)"
                          : "none",
                      outlineOffset: day.isToday ? "1px" : "0px",
                    }}
                    whileHover={{ scale: 1.4 }}
                    transition={{ duration: 0.1 }}
                    onMouseEnter={(e) => {
                      const rect = (e.target as HTMLElement).getBoundingClientRect();
                      setTooltip({
                        date: day.date,
                        count: day.count,
                        x: rect.left + rect.width / 2,
                        y: rect.top,
                      });
                    }}
                    onMouseLeave={() => setTooltip(null)}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1.5 mt-3 ml-8 text-[10px] text-[var(--text-muted)]">
        <span>Less</span>
        {[0, 1, 2, 3].map((level) => (
          <div
            key={level}
            className="w-3 h-3 rounded-[2px]"
            style={{ background: INTENSITY_COLORS[level] }}
          />
        ))}
        <span>More</span>
        <span className="ml-3 flex items-center gap-1">
          <div
            className="w-3 h-3 rounded-[2px]"
            style={{ background: FROZEN_COLOR }}
          />
          Frozen
        </span>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 px-2.5 py-1.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] shadow-lg text-xs text-[var(--foreground)] pointer-events-none whitespace-nowrap"
          style={{
            left: tooltip.x,
            top: tooltip.y - 36,
            transform: "translateX(-50%)",
          }}
        >
          <span className="font-medium">{formatDate(tooltip.date)}</span>
          <span className="text-[var(--text-muted)] ml-1.5">
            {tooltip.count} activit{tooltip.count === 1 ? "y" : "ies"}
          </span>
        </div>
      )}
    </div>
  );
}
