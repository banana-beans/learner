"use client";

import { motion } from "framer-motion";

interface ProgressBarProps {
  /** 0–1 fraction */
  value: number;
  /** Color override (CSS color string) */
  color?: string;
  /** Height in pixels */
  height?: number;
  /** Show percentage label */
  showLabel?: boolean;
  /** Animate on mount */
  animate?: boolean;
  className?: string;
  /** Rounded full or squared ends */
  rounded?: boolean;
}

export function ProgressBar({
  value,
  color,
  height = 6,
  showLabel = false,
  animate = true,
  className = "",
  rounded = true,
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(1, value));
  const percent = Math.round(clamped * 100);

  return (
    <div className={`flex items-center gap-2 w-full ${className}`}>
      <div
        className={`flex-1 bg-[var(--surface-3)] overflow-hidden ${rounded ? "rounded-full" : "rounded"}`}
        style={{ height }}
      >
        <motion.div
          className={`h-full ${rounded ? "rounded-full" : "rounded"}`}
          style={{
            background: color ?? "var(--accent-blue)",
          }}
          initial={animate ? { width: 0 } : { width: `${percent}%` }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-[var(--text-muted)] tabular-nums w-8 text-right">
          {percent}%
        </span>
      )}
    </div>
  );
}

/** Multi-segment progress bar (e.g. completed + mastered) */
interface SegmentedBarProps {
  segments: Array<{ value: number; color: string; label?: string }>;
  height?: number;
  className?: string;
}

export function SegmentedProgressBar({
  segments,
  height = 6,
  className = "",
}: SegmentedBarProps) {
  return (
    <div
      className={`flex w-full bg-[var(--surface-3)] rounded-full overflow-hidden ${className}`}
      style={{ height }}
    >
      {segments.map((seg, i) => {
        const pct = Math.max(0, Math.min(100, seg.value * 100));
        return (
          <motion.div
            key={i}
            style={{ background: seg.color }}
            className="h-full"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.6, delay: i * 0.1, ease: "easeOut" }}
            title={seg.label}
          />
        );
      })}
    </div>
  );
}
