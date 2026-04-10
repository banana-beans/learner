"use client";

import { motion } from "framer-motion";

interface DueCounterProps {
  count: number;
  compact?: boolean;
}

function getCounterStyle(count: number): {
  bgClass: string;
  textClass: string;
  borderClass: string;
  pulseColor: string;
} {
  if (count === 0) {
    return {
      bgClass: "bg-green-500/10",
      textClass: "text-green-400",
      borderClass: "border-green-500/30",
      pulseColor: "",
    };
  }
  if (count <= 10) {
    return {
      bgClass: "bg-blue-500/10",
      textClass: "text-blue-400",
      borderClass: "border-blue-500/30",
      pulseColor: "var(--accent-blue)",
    };
  }
  if (count <= 30) {
    return {
      bgClass: "bg-orange-500/10",
      textClass: "text-orange-400",
      borderClass: "border-orange-500/30",
      pulseColor: "var(--accent-orange)",
    };
  }
  return {
    bgClass: "bg-red-500/10",
    textClass: "text-red-400",
    borderClass: "border-red-500/30",
    pulseColor: "#ef4444",
  };
}

export function DueCounter({ count, compact = false }: DueCounterProps) {
  const style = getCounterStyle(count);

  if (compact) {
    return (
      <span
        className={[
          "inline-flex items-center justify-center rounded-full font-bold tabular-nums",
          "min-w-[20px] h-5 px-1.5 text-[10px]",
          style.bgClass,
          style.textClass,
          `border ${style.borderClass}`,
        ].join(" ")}
      >
        {count}
      </span>
    );
  }

  return (
    <div className="relative inline-flex items-center">
      {/* Pulse ring when cards are due */}
      {count > 0 && (
        <motion.span
          className="absolute inset-0 rounded-full"
          style={{ background: style.pulseColor, opacity: 0.15 }}
          animate={{ scale: [1, 1.4, 1], opacity: [0.15, 0, 0.15] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
      <span
        className={[
          "relative inline-flex items-center gap-1.5 rounded-full font-semibold tabular-nums",
          "px-2.5 py-1 text-xs",
          style.bgClass,
          style.textClass,
          `border ${style.borderClass}`,
        ].join(" ")}
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <line x1="2" y1="10" x2="22" y2="10" />
        </svg>
        {count > 0 ? `${count} due` : "All clear"}
      </span>
    </div>
  );
}
