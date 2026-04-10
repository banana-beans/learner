"use client";

import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import type { SkillNode, NodeState, Curriculum, UserProgress, Tier, BranchId } from "@/lib/types";
import { getNodeState, getBranchProgress } from "@/engine/progression";
import { BRANCH_META } from "@/lib/constants";
import { SkillNodeComponent } from "./SkillNode";
import { BranchLabel } from "./BranchLabel";
import { NodeDetail } from "./NodeDetail";

interface SkillTreeProps {
  curriculum: Curriculum;
  progress: UserProgress;
}

/** Tier label display */
const TIER_LABELS: Record<number, string> = {
  1: "Fundamentals",
  2: "Intermediate",
  3: "Advanced",
  4: "Expert",
  5: "Mastery",
  6: "Capstone",
};

/**
 * Draws SVG connection lines between prerequisite nodes within a branch.
 * Uses simple curved paths between node positions.
 */
function ConnectionLines({
  nodes,
  nodeStates,
  branchColor,
}: {
  nodes: SkillNode[];
  nodeStates: Record<string, NodeState>;
  branchColor: string;
}) {
  // Build a map of node id -> rough grid position
  // Group by tier, then index within tier
  const tierGroups: Record<number, SkillNode[]> = {};
  for (const node of nodes) {
    if (!tierGroups[node.tier]) tierGroups[node.tier] = [];
    tierGroups[node.tier].push(node);
  }

  const tiers = Object.keys(tierGroups)
    .map(Number)
    .sort();

  // Position each node: x based on index within tier, y based on tier
  const nodePositions: Record<string, { x: number; y: number }> = {};
  const NODE_SPACING_X = 120;
  const TIER_SPACING_Y = 120;

  for (const tier of tiers) {
    const tierNodes = tierGroups[tier];
    const tierIndex = tiers.indexOf(tier);
    const totalWidth = (tierNodes.length - 1) * NODE_SPACING_X;
    const startX = -totalWidth / 2;

    tierNodes.forEach((node, i) => {
      nodePositions[node.id] = {
        x: startX + i * NODE_SPACING_X + totalWidth / 2 + NODE_SPACING_X / 2,
        y: tierIndex * TIER_SPACING_Y + 50,
      };
    });
  }

  // Compute total dimensions
  const allX = Object.values(nodePositions).map((p) => p.x);
  const allY = Object.values(nodePositions).map((p) => p.y);
  if (allX.length === 0) return null;

  const minX = Math.min(...allX) - 60;
  const maxX = Math.max(...allX) + 60;
  const maxY = Math.max(...allY) + 20;
  const svgWidth = maxX - minX;
  const svgHeight = maxY + 10;

  // Only draw lines for prerequisites within this branch
  const lines: { from: { x: number; y: number }; to: { x: number; y: number }; active: boolean }[] = [];

  for (const node of nodes) {
    const toPos = nodePositions[node.id];
    if (!toPos) continue;

    for (const prereqId of node.hardPrereqs) {
      const fromPos = nodePositions[prereqId];
      if (!fromPos) continue;

      const prereqState = nodeStates[prereqId];
      const active = prereqState === "completed" || prereqState === "mastered";

      lines.push({
        from: { x: fromPos.x - minX, y: fromPos.y },
        to: { x: toPos.x - minX, y: toPos.y },
        active,
      });
    }
  }

  if (lines.length === 0) return null;

  return (
    <svg
      className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none"
      width={svgWidth}
      height={svgHeight}
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      fill="none"
    >
      {lines.map((line, i) => {
        const midY = (line.from.y + line.to.y) / 2;
        const d = `M ${line.from.x} ${line.from.y} C ${line.from.x} ${midY}, ${line.to.x} ${midY}, ${line.to.x} ${line.to.y}`;

        return (
          <path
            key={i}
            d={d}
            stroke={line.active ? branchColor : "var(--border)"}
            strokeWidth={line.active ? 2 : 1.5}
            strokeDasharray={line.active ? "none" : "4 4"}
            opacity={line.active ? 0.7 : 0.3}
          />
        );
      })}
    </svg>
  );
}

export function SkillTree({ curriculum, progress }: SkillTreeProps) {
  const [selectedNode, setSelectedNode] = useState<SkillNode | null>(null);
  const [selectedState, setSelectedState] = useState<NodeState | null>(null);

  /** Compute all node states */
  const nodeStates = useMemo(() => {
    const states: Record<string, NodeState> = {};
    for (const nodeId of Object.keys(curriculum.nodeMap)) {
      states[nodeId] = getNodeState(nodeId, progress, curriculum);
    }
    return states;
  }, [progress, curriculum]);

  const handleNodeClick = useCallback(
    (node: SkillNode) => {
      setSelectedNode(node);
      setSelectedState(nodeStates[node.id] ?? "locked");
    },
    [nodeStates]
  );

  const handleCloseDetail = useCallback(() => {
    setSelectedNode(null);
    setSelectedState(null);
  }, []);

  return (
    <div className="space-y-2">
      {curriculum.branches.map((branch, branchIndex) => {
        const meta = BRANCH_META[branch.id];
        const branchProg = getBranchProgress(branch.id, progress, curriculum);

        // Group nodes by tier
        const tierGroups: Record<number, SkillNode[]> = {};
        for (const node of branch.nodes) {
          if (!tierGroups[node.tier]) tierGroups[node.tier] = [];
          tierGroups[node.tier].push(node);
        }
        const tiers = Object.keys(tierGroups)
          .map(Number)
          .sort() as Tier[];

        return (
          <motion.div
            key={branch.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: branchIndex * 0.08 }}
          >
            <BranchLabel
              branchId={branch.id}
              progress={branchProg}
              defaultExpanded={branchProg.inProgressNodes > 0 || branchProg.availableNodes > 0}
            >
              {/* Tier sections with connection lines */}
              <div className="relative pl-4 pr-2">
                {/* SVG connection lines */}
                <ConnectionLines
                  nodes={branch.nodes}
                  nodeStates={nodeStates}
                  branchColor={meta.colorHex}
                />

                {tiers.map((tier, tierIndex) => {
                  const tierNodes = tierGroups[tier];
                  return (
                    <div key={tier} className="mb-5">
                      {/* Tier label */}
                      <div className="flex items-center gap-2 mb-3">
                        <div
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: meta.colorHex, opacity: 0.5 }}
                        />
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                          Tier {tier} - {TIER_LABELS[tier] ?? `Tier ${tier}`}
                        </span>
                      </div>

                      {/* Nodes in flowing layout */}
                      <div className="flex flex-wrap gap-4 justify-start">
                        {tierNodes.map((node, nodeIndex) => {
                          const nodeState = nodeStates[node.id] ?? "locked";
                          return (
                            <motion.div
                              key={node.id}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{
                                duration: 0.3,
                                delay: branchIndex * 0.08 + tierIndex * 0.05 + nodeIndex * 0.03,
                              }}
                            >
                              <SkillNodeComponent
                                node={node}
                                state={nodeState}
                                progress={
                                  nodeState === "in_progress" ? 0.5 : 0
                                }
                                onClick={handleNodeClick}
                              />
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </BranchLabel>
          </motion.div>
        );
      })}

      {/* Node detail modal */}
      <NodeDetail
        node={selectedNode}
        state={selectedState}
        open={selectedNode !== null}
        onClose={handleCloseDetail}
        curriculum={curriculum}
        progress={progress}
      />
    </div>
  );
}
