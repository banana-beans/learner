"use client";

import { useState } from "react";
import type { SkillNode, Challenge } from "@/lib/types";
import { Badge, XPBadge } from "@/components/common/Badge";
import { LessonContent } from "@/components/lesson/LessonContent";
import { ChallengeView } from "@/components/lesson/ChallengeView";

const TIER_LABEL: Record<number, string> = {
  1: "Tier 1",
  2: "Tier 2",
  3: "Tier 3",
  4: "Tier 4",
  5: "Tier 5",
  6: "Tier 6",
};

const TIER_VARIANT: Record<number, "blue" | "cyan" | "teal" | "green" | "purple" | "orange"> = {
  1: "blue",
  2: "cyan",
  3: "teal",
  4: "green",
  5: "purple",
  6: "orange",
};

type Tab = "lesson" | "challenge";

interface LearnPageClientProps {
  node: SkillNode;
  challenges: Challenge[];
}

export function LearnPageClient({ node, challenges }: LearnPageClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>("lesson");
  const [selectedChallengeIdx, setSelectedChallengeIdx] = useState(0);

  const tierLabel = TIER_LABEL[node.tier] ?? `Tier ${node.tier}`;
  const tierVariant = TIER_VARIANT[node.tier] ?? "blue";
  const challenge = challenges[selectedChallengeIdx] ?? null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      {/* Node header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={tierVariant} size="sm">
            {tierLabel}
          </Badge>
          <Badge variant="default" size="sm">
            {node.branchId}
          </Badge>
          <XPBadge amount={node.xpReward} />
          <span className="text-xs text-[var(--text-muted)]">
            ~{node.estimatedMinutes} min
          </span>
        </div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">
          {node.title}
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          {node.description}
        </p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 p-1 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] w-fit">
        {(["lesson", "challenge"] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={[
              "px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-150",
              activeTab === tab
                ? "bg-[var(--accent-blue)] text-white shadow-sm"
                : "text-[var(--text-secondary)] hover:text-[var(--foreground)]",
            ].join(" ")}
          >
            {tab === "lesson" ? "Lesson" : `Challenge${challenges.length > 1 ? "s" : ""}`}
            {tab === "challenge" && challenges.length > 0 && (
              <span
                className={[
                  "ml-1.5 text-[10px] rounded-full px-1.5 py-0.5 font-bold",
                  activeTab === "challenge"
                    ? "bg-white/20 text-white"
                    : "bg-[var(--surface-3)] text-[var(--text-muted)]",
                ].join(" ")}
              >
                {challenges.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "lesson" ? (
        <LessonContent nodeId={node.id} xpReward={node.xpReward} />
      ) : (
        <div className="space-y-5">
          {challenges.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)] py-8 text-center">
              No challenges available for this node yet.
            </p>
          ) : (
            <>
              {/* Challenge selector (if multiple) */}
              {challenges.length > 1 && (
                <div className="flex gap-2 flex-wrap">
                  {challenges.map((c, i) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedChallengeIdx(i)}
                      className={[
                        "px-3 py-1.5 rounded-lg text-sm border transition-all duration-150",
                        i === selectedChallengeIdx
                          ? "border-[var(--accent-blue)] bg-[var(--accent-blue)]/10 text-[var(--accent-blue)]"
                          : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent-blue)]/50",
                      ].join(" ")}
                    >
                      {c.title}
                    </button>
                  ))}
                </div>
              )}

              {/* Active challenge */}
              {challenge && (
                <div>
                  <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">
                    {challenge.title}
                  </h2>
                  <ChallengeView challenge={challenge} />
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
