"use client";

import Link from "next/link";
import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/common/Button";
import { Badge } from "@/components/common/Badge";
import { ProgressBar } from "@/components/common/ProgressBar";
import { BRANCH_META } from "@/lib/constants";
import type { SkillNode, NodeState, Curriculum, UserProgress } from "@/lib/types";
import { getNodeState } from "@/engine/progression";

interface NodeDetailProps {
  node: SkillNode | null;
  state: NodeState | null;
  open: boolean;
  onClose: () => void;
  curriculum: Curriculum;
  progress: UserProgress;
}

/** Tier label mapping */
const TIER_LABELS: Record<number, string> = {
  1: "Fundamentals",
  2: "Intermediate",
  3: "Advanced",
  4: "Expert",
  5: "Mastery",
  6: "Capstone",
};

/** Badge variant for branch color */
function branchBadgeVariant(color: string) {
  const map: Record<string, "blue" | "cyan" | "teal" | "purple" | "orange" | "green" | "yellow" | "red" | "gold"> = {
    blue: "blue",
    cyan: "cyan",
    teal: "teal",
    purple: "purple",
    orange: "orange",
    green: "green",
    yellow: "yellow",
    red: "red",
    sky: "cyan",
    indigo: "purple",
  };
  return map[color] ?? "blue";
}

function ClockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function XPIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--xp-gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function CheckCircle({ completed }: { completed: boolean }) {
  if (completed) {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--accent-green)" stroke="none">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
    </svg>
  );
}

export function NodeDetail({
  node,
  state,
  open,
  onClose,
  curriculum,
  progress,
}: NodeDetailProps) {
  if (!node || !state) return null;

  // After the null check, bind to a non-nullable local for use in closures
  const currentNode = node;
  const currentState = state;
  const meta = BRANCH_META[currentNode.branchId];
  const variant = branchBadgeVariant(meta.color);

  const hardPrereqs = currentNode.hardPrereqs.map((id) => {
    const prereqNode = curriculum.nodeMap[id];
    const prereqState = prereqNode ? getNodeState(id, progress, curriculum) : "locked";
    const completed = prereqState === "completed" || prereqState === "mastered";
    return { id, title: prereqNode?.title ?? id, completed, required: true };
  });

  const softPrereqs = currentNode.softPrereqs.map((id) => {
    const prereqNode = curriculum.nodeMap[id];
    const prereqState = prereqNode ? getNodeState(id, progress, curriculum) : "locked";
    const completed = prereqState === "completed" || prereqState === "mastered";
    return { id, title: prereqNode?.title ?? id, completed, required: false };
  });

  const allPrereqs = [...hardPrereqs, ...softPrereqs];

  /** CTA configuration based on state */
  function getCTA(): { label: string; variant: "primary" | "secondary" | "ghost" | "success"; disabled: boolean; href?: string } {
    switch (currentState) {
      case "locked":
        return { label: "Prerequisites needed", variant: "ghost", disabled: true };
      case "available":
        return {
          label: "Start Learning",
          variant: "primary",
          disabled: false,
          href: `/learn/${currentNode.branchId}/${currentNode.id}`,
        };
      case "in_progress":
        return {
          label: "Continue Learning",
          variant: "primary",
          disabled: false,
          href: `/learn/${currentNode.branchId}/${currentNode.id}`,
        };
      case "completed":
        return {
          label: "Review",
          variant: "secondary",
          disabled: false,
          href: `/learn/${currentNode.branchId}/${currentNode.id}`,
        };
      case "mastered":
        return { label: "Mastered!", variant: "success", disabled: true };
      default:
        return { label: "Start", variant: "primary", disabled: true };
    }
  }

  const cta = getCTA();

  /** State label styling */
  function getStateBadge() {
    switch (currentState) {
      case "locked":
        return <Badge variant="default" size="sm">Locked</Badge>;
      case "available":
        return <Badge variant={variant} size="sm">Available</Badge>;
      case "in_progress":
        return <Badge variant={variant} size="sm" filled>In Progress</Badge>;
      case "completed":
        return <Badge variant="green" size="sm" filled>Completed</Badge>;
      case "mastered":
        return <Badge variant="gold" size="sm" filled>Mastered</Badge>;
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={currentNode.title} maxWidth="max-w-md">
      <div className="space-y-5">
        {/* Meta badges */}
        <div className="flex flex-wrap items-center gap-2">
          {getStateBadge()}
          <Badge variant={variant} size="sm">
            {meta.title}
          </Badge>
          <Badge variant="default" size="sm">
            Tier {currentNode.tier} - {TIER_LABELS[currentNode.tier] ?? `Tier ${currentNode.tier}`}
          </Badge>
        </div>

        {/* Description */}
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
          {currentNode.description}
        </p>

        {/* Stats row */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
            <ClockIcon />
            <span>{currentNode.estimatedMinutes} min</span>
          </div>
          <div className="flex items-center gap-1.5 text-[var(--xp-gold)]">
            <XPIcon />
            <span className="font-medium">+{currentNode.xpReward} XP</span>
          </div>
        </div>

        {/* Prerequisites */}
        {allPrereqs.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
              Prerequisites
            </h4>
            <ul className="space-y-1.5">
              {allPrereqs.map((prereq) => (
                <li key={prereq.id} className="flex items-center gap-2 text-sm">
                  <CheckCircle completed={prereq.completed} />
                  <span
                    className={
                      prereq.completed
                        ? "text-[var(--text-secondary)] line-through"
                        : "text-[var(--foreground)]"
                    }
                  >
                    {prereq.title}
                  </span>
                  {!prereq.required && (
                    <span className="text-[10px] text-[var(--text-muted)]">(recommended)</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Concepts */}
        {currentNode.concepts.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
              Concepts Covered
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {currentNode.concepts.map((concept) => (
                <Badge key={concept} variant="default" size="xs">
                  {concept}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-3 pt-2 border-t border-[var(--border)]">
          {cta.href && !cta.disabled ? (
            <Link href={cta.href} className="flex-1">
              <Button variant={cta.variant} size="md" className="w-full">
                {cta.label}
              </Button>
            </Link>
          ) : (
            <Button variant={cta.variant} size="md" disabled={cta.disabled} className="flex-1">
              {cta.label}
            </Button>
          )}

          {(currentState === "completed" || currentState === "in_progress" || currentState === "available") && (
            <Link href={`/challenges?node=${currentNode.id}`}>
              <Button variant="ghost" size="md">
                View Challenges
              </Button>
            </Link>
          )}
        </div>
      </div>
    </Modal>
  );
}
