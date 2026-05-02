/**
 * Master Curriculum Index
 *
 * Assembles all branches into a unified Curriculum object.
 * The nodeMap provides O(1) lookup by nodeId.
 */

import type { Curriculum, Branch, SkillNode } from "@/lib/types";
import { BRANCH_META } from "@/lib/constants";

// Python branch nodes
import { tier1Basics } from "./python/tier1-basics";
import { tier2ControlFlow } from "./python/tier2-control-flow";
import { tier3DataStructures } from "./python/tier3-data-structures";
import { tier4Functions } from "./python/tier4-functions";
import { tier5OOP } from "./python/tier5-oop";
import { tier6Advanced } from "./python/tier6-advanced";

// Other branches — full node lists
import { typescriptNodes } from "./typescript";
import { reactNodes } from "./react";
import { dsaNodes } from "./dsa";
import {
  csharpNodes,
  databasesNodes,
  systemsDesignNodes,
  networkingNodes,
  securityNodes,
  devopsNodes,
} from "./others";

const pythonNodes: SkillNode[] = [
  ...tier1Basics,
  ...tier2ControlFlow,
  ...tier3DataStructures,
  ...tier4Functions,
  ...tier5OOP,
  ...tier6Advanced,
];

// ────────────────────────────────────────────────────────────
// Branch Assembly
// ────────────────────────────────────────────────────────────

function makeBranch(
  id: keyof typeof BRANCH_META,
  nodes: SkillNode[]
): Branch {
  const meta = BRANCH_META[id];
  const tiers = [...new Set(nodes.map((n) => n.tier))].sort() as Branch["tiers"];
  return {
    id,
    title: meta.title,
    description: meta.description,
    color: meta.color,
    iconSlug: meta.iconSlug,
    tiers,
    nodes,
  };
}

export const branches: Branch[] = [
  makeBranch("python", pythonNodes),
  makeBranch("typescript", typescriptNodes),
  makeBranch("react", reactNodes),
  makeBranch("csharp", csharpNodes),
  makeBranch("dsa", dsaNodes),
  makeBranch("databases", databasesNodes),
  makeBranch("systems-design", systemsDesignNodes),
  makeBranch("networking", networkingNodes),
  makeBranch("security", securityNodes),
  makeBranch("devops", devopsNodes),
];

// Build flat nodeMap for O(1) lookup
const nodeMap: Record<string, SkillNode> = {};
for (const branch of branches) {
  for (const node of branch.nodes) {
    nodeMap[node.id] = node;
  }
}

export const curriculum: Curriculum = { branches, nodeMap };

export default curriculum;
