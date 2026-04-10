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

const pythonNodes: SkillNode[] = [
  ...tier1Basics,
  ...tier2ControlFlow,
  ...tier3DataStructures,
  ...tier4Functions,
  ...tier5OOP,
  ...tier6Advanced,
];

// ────────────────────────────────────────────────────────────
// Branch Stubs (other 9 branches — nodes TBD in Phase 2)
// Each branch has at least one entry node so the tree renders.
// ────────────────────────────────────────────────────────────

const typescriptNodes: SkillNode[] = [
  {
    id: "typescript:t1:intro",
    branchId: "typescript",
    tier: 1,
    title: "TypeScript Intro",
    description: "Type annotations, compilation, tsconfig basics.",
    hardPrereqs: [],
    softPrereqs: [],
    estimatedMinutes: 20,
    xpReward: 100,
    concepts: ["type annotations", "tsc", "tsconfig.json", "primitive types"],
  },
];

const reactNodes: SkillNode[] = [
  {
    id: "react:t1:intro",
    branchId: "react",
    tier: 1,
    title: "React Fundamentals",
    description: "JSX, components, props, and the virtual DOM.",
    hardPrereqs: [],
    softPrereqs: ["typescript:t1:intro"],
    estimatedMinutes: 25,
    xpReward: 100,
    concepts: ["JSX", "components", "props", "virtual DOM", "rendering"],
  },
];

const csharpNodes: SkillNode[] = [
  {
    id: "csharp:t1:intro",
    branchId: "csharp",
    tier: 1,
    title: "C# Fundamentals",
    description: "C# syntax, types, and .NET CLI basics.",
    hardPrereqs: [],
    softPrereqs: [],
    estimatedMinutes: 25,
    xpReward: 100,
    concepts: ["C# syntax", "strong typing", "dotnet CLI", "namespaces"],
  },
];

const dsaNodes: SkillNode[] = [
  {
    id: "dsa:t1:complexity",
    branchId: "dsa",
    tier: 1,
    title: "Big-O Complexity",
    description: "Time and space complexity analysis, common complexities.",
    hardPrereqs: [],
    softPrereqs: [],
    estimatedMinutes: 30,
    xpReward: 125,
    concepts: ["Big-O", "time complexity", "space complexity", "O(1)", "O(n)", "O(n²)", "O(log n)"],
  },
];

const databasesNodes: SkillNode[] = [
  {
    id: "databases:t1:intro",
    branchId: "databases",
    tier: 1,
    title: "Database Fundamentals",
    description: "Relational vs NoSQL, tables, rows, keys, CRUD basics.",
    hardPrereqs: [],
    softPrereqs: [],
    estimatedMinutes: 20,
    xpReward: 100,
    concepts: ["relational", "NoSQL", "tables", "primary key", "CRUD"],
  },
];

const systemsDesignNodes: SkillNode[] = [
  {
    id: "systems-design:t1:intro",
    branchId: "systems-design",
    tier: 1,
    title: "Systems Design Intro",
    description: "Client-server model, scalability concepts, and design trade-offs.",
    hardPrereqs: [],
    softPrereqs: [],
    estimatedMinutes: 25,
    xpReward: 100,
    concepts: ["client-server", "scalability", "availability", "latency", "trade-offs"],
  },
];

const networkingNodes: SkillNode[] = [
  {
    id: "networking:t1:intro",
    branchId: "networking",
    tier: 1,
    title: "Networking Fundamentals",
    description: "OSI model, TCP/IP, DNS, HTTP basics.",
    hardPrereqs: [],
    softPrereqs: [],
    estimatedMinutes: 30,
    xpReward: 100,
    concepts: ["OSI model", "TCP/IP", "DNS", "HTTP", "IP addresses", "ports"],
  },
];

const securityNodes: SkillNode[] = [
  {
    id: "security:t1:intro",
    branchId: "security",
    tier: 1,
    title: "Security Fundamentals",
    description: "CIA triad, common threats, OWASP Top 10 overview.",
    hardPrereqs: [],
    softPrereqs: [],
    estimatedMinutes: 25,
    xpReward: 100,
    concepts: ["CIA triad", "OWASP", "authentication", "authorization", "threat modeling"],
  },
];

const devopsNodes: SkillNode[] = [
  {
    id: "devops:t1:intro",
    branchId: "devops",
    tier: 1,
    title: "DevOps Fundamentals",
    description: "CI/CD concepts, pipelines, and the DevOps culture.",
    hardPrereqs: [],
    softPrereqs: [],
    estimatedMinutes: 20,
    xpReward: 100,
    concepts: ["CI/CD", "pipeline", "automation", "DevOps culture", "feedback loops"],
  },
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
