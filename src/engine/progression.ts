/**
 * Skill Tree Progression Engine
 *
 * Manages node unlocking, state computation, and branch progress based on the
 * DAG-based prerequisite system described in research/04-skill-tree-design.md.
 *
 * Nodes unlock when ALL hard prerequisites are completed.
 * Soft prerequisites are shown as recommendations only.
 */

import type { NodeState, SkillNode, BranchId, UserProgress, Curriculum } from "@/lib/types";

/**
 * Determines whether a node is unlocked for a learner.
 * A node is unlocked when every hard prerequisite is in completedNodes.
 *
 * @param nodeId - The node to check
 * @param completedNodes - Set of completed node IDs
 * @param curriculum - Full curriculum for prerequisite lookup
 * @returns true if the node's hard prerequisites are satisfied
 */
export function isNodeUnlocked(
  nodeId: string,
  completedNodes: string[],
  curriculum: Curriculum
): boolean {
  const node = curriculum.nodeMap[nodeId];
  if (!node) return false;
  if (node.hardPrereqs.length === 0) return true;
  return node.hardPrereqs.every((prereqId) => completedNodes.includes(prereqId));
}

/**
 * Returns all nodes that are currently available (unlocked but not yet completed).
 * Excludes locked, in-progress, and completed nodes.
 *
 * @param completedNodes - Already completed nodes
 * @param inProgressNodes - Nodes currently being worked on
 * @param curriculum - Full curriculum data
 * @returns Array of available SkillNodes
 */
export function getAvailableNodes(
  completedNodes: string[],
  inProgressNodes: string[],
  curriculum: Curriculum
): SkillNode[] {
  const completedSet = new Set(completedNodes);
  const inProgressSet = new Set(inProgressNodes);

  return Object.values(curriculum.nodeMap).filter((node) => {
    if (completedSet.has(node.id)) return false;
    if (inProgressSet.has(node.id)) return false;
    return isNodeUnlocked(node.id, completedNodes, curriculum);
  });
}

/**
 * Computes the display state for a given node.
 * State machine: locked → available → in_progress → completed → mastered
 *
 * @param nodeId - Node to evaluate
 * @param progress - Full user progress object
 * @param curriculum - Curriculum for prerequisite resolution
 * @returns Current NodeState
 */
export function getNodeState(
  nodeId: string,
  progress: UserProgress,
  curriculum: Curriculum
): NodeState {
  if (progress.masteredNodes.includes(nodeId)) return "mastered";
  if (progress.completedNodes.includes(nodeId)) return "completed";
  if (progress.inProgressNodes.includes(nodeId)) return "in_progress";
  if (isNodeUnlocked(nodeId, progress.completedNodes, curriculum)) return "available";
  return "locked";
}

export interface BranchProgress {
  branchId: BranchId;
  totalNodes: number;
  completedNodes: number;
  masteredNodes: number;
  inProgressNodes: number;
  availableNodes: number;
  lockedNodes: number;
  /** Completion fraction 0–1 */
  completionFraction: number;
  /** Mastery fraction 0–1 */
  masteryFraction: number;
  isCompleted: boolean;
  isMastered: boolean;
}

/**
 * Computes aggregated progress stats for an entire branch.
 *
 * @param branchId - Target branch
 * @param progress - User progress
 * @param curriculum - Curriculum data
 * @returns BranchProgress summary
 */
export function getBranchProgress(
  branchId: BranchId,
  progress: UserProgress,
  curriculum: Curriculum
): BranchProgress {
  const branch = curriculum.branches.find((b) => b.id === branchId);
  if (!branch) {
    return {
      branchId,
      totalNodes: 0,
      completedNodes: 0,
      masteredNodes: 0,
      inProgressNodes: 0,
      availableNodes: 0,
      lockedNodes: 0,
      completionFraction: 0,
      masteryFraction: 0,
      isCompleted: false,
      isMastered: false,
    };
  }

  const stats = {
    totalNodes: branch.nodes.length,
    completedNodes: 0,
    masteredNodes: 0,
    inProgressNodes: 0,
    availableNodes: 0,
    lockedNodes: 0,
  };

  for (const node of branch.nodes) {
    const state = getNodeState(node.id, progress, curriculum);
    switch (state) {
      case "mastered":
        stats.masteredNodes++;
        stats.completedNodes++;
        break;
      case "completed":
        stats.completedNodes++;
        break;
      case "in_progress":
        stats.inProgressNodes++;
        break;
      case "available":
        stats.availableNodes++;
        break;
      case "locked":
        stats.lockedNodes++;
        break;
    }
  }

  const completionFraction = stats.totalNodes > 0 ? stats.completedNodes / stats.totalNodes : 0;
  const masteryFraction = stats.totalNodes > 0 ? stats.masteredNodes / stats.totalNodes : 0;

  return {
    branchId,
    ...stats,
    completionFraction,
    masteryFraction,
    isCompleted: stats.completedNodes === stats.totalNodes && stats.totalNodes > 0,
    isMastered: stats.masteredNodes === stats.totalNodes && stats.totalNodes > 0,
  };
}

/**
 * Returns nodes that become unlocked by completing a given node.
 * Useful for showing "you unlocked N new nodes!" feedback.
 *
 * @param completedNodeId - The node that was just completed
 * @param previousCompleted - Previously completed nodes (before this completion)
 * @param curriculum - Curriculum data
 * @returns Newly unlocked nodes
 */
export function getNewlyUnlockedNodes(
  completedNodeId: string,
  previousCompleted: string[],
  curriculum: Curriculum
): SkillNode[] {
  const newCompleted = [...previousCompleted, completedNodeId];
  return Object.values(curriculum.nodeMap).filter((node) => {
    if (previousCompleted.includes(node.id)) return false;
    if (!node.hardPrereqs.includes(completedNodeId)) return false;
    return isNodeUnlocked(node.id, newCompleted, curriculum);
  });
}
