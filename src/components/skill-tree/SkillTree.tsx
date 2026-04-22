"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import type { Branch, UserProgress, Curriculum } from "@/lib/types";
import { getNodeState } from "@/engine/progression";
import { BRANCH_META } from "@/lib/constants";
import { SkillNode } from "./SkillNode";

interface SkillTreeProps {
  branch: Branch;
  progress: UserProgress;
  curriculum: Curriculum;
}

interface Connection {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  unlocked: boolean;
}

export function SkillTree({ branch, progress, curriculum }: SkillTreeProps) {
  const meta = BRANCH_META[branch.id];
  const containerRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [connections, setConnections] = useState<Connection[]>([]);
  const [svgSize, setSvgSize] = useState({ width: 0, height: 0 });

  // Group nodes by tier
  const tierGroups = branch.tiers.reduce<Record<number, typeof branch.nodes>>(
    (acc, tier) => {
      acc[tier] = branch.nodes.filter((n) => n.tier === tier);
      return acc;
    },
    {}
  );

  const calculateConnections = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    if (containerRect.width === 0) return;

    const newConnections: Connection[] = [];
    const branchNodeIds = new Set(branch.nodes.map((n) => n.id));

    for (const node of branch.nodes) {
      for (const prereqId of node.hardPrereqs) {
        // Only draw connections within this branch
        if (!branchNodeIds.has(prereqId)) continue;

        const parentEl = nodeRefs.current[prereqId];
        const childEl = nodeRefs.current[node.id];
        if (!parentEl || !childEl) continue;

        const parentRect = parentEl.getBoundingClientRect();
        const childRect = childEl.getBoundingClientRect();

        const x1 =
          parentRect.left + parentRect.width / 2 - containerRect.left;
        const y1 = parentRect.bottom - containerRect.top;
        const x2 =
          childRect.left + childRect.width / 2 - containerRect.left;
        const y2 = childRect.top - containerRect.top;

        const nodeState = getNodeState(node.id, progress, curriculum);
        const unlocked = nodeState !== "locked";

        newConnections.push({ x1, y1, x2, y2, unlocked });
      }
    }

    setConnections(newConnections);
    setSvgSize({
      width: containerRect.width,
      height: containerRect.height,
    });
  }, [branch, progress, curriculum]);

  useEffect(() => {
    calculateConnections();

    const observer = new ResizeObserver(calculateConnections);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [calculateConnections]);

  return (
    <div
      ref={containerRef}
      className="relative overflow-x-auto overflow-y-auto"
      style={{ minHeight: "200px" }}
    >
      {/* SVG connection lines */}
      {connections.length > 0 && (
        <svg
          className="absolute inset-0 pointer-events-none"
          width={svgSize.width}
          height={svgSize.height}
          aria-hidden="true"
        >
          {connections.map((conn, i) => (
            <line
              key={i}
              x1={conn.x1}
              y1={conn.y1}
              x2={conn.x2}
              y2={conn.y2}
              stroke={
                conn.unlocked ? `${meta.colorHex}99` : "#374151"
              }
              strokeWidth="2"
              strokeDasharray={conn.unlocked ? undefined : "5 4"}
            />
          ))}
        </svg>
      )}

      {/* Tier rows */}
      <div className="flex flex-col gap-6 py-6">
        {branch.tiers.map((tier) => {
          const tierNodes = tierGroups[tier] ?? [];
          return (
            <div key={tier} className="flex flex-col gap-2">
              {/* Tier label */}
              <div className="px-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Tier {tier}
              </div>
              {/* Node row — horizontally scrollable on mobile */}
              <div className="flex gap-4 px-4 flex-wrap">
                {tierNodes.map((node) => {
                  const state = getNodeState(node.id, progress, curriculum);
                  return (
                    <div
                      key={node.id}
                      ref={(el) => {
                        nodeRefs.current[node.id] = el;
                      }}
                    >
                      <SkillNode
                        node={node}
                        state={state}
                        branchColor={meta.colorHex}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
