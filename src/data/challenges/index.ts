// ============================================================
// Master challenge registry
// ============================================================

import type { Challenge } from "@/lib/types";
import { pythonTier1Challenges } from "./python-tier1";
import { pythonTier2Challenges } from "./python-tier2";
import { pythonTier3Challenges } from "./python-tier3";
import { pythonTier4Challenges } from "./python-tier4";
import { pythonTier5Challenges } from "./python-tier5";
import { pythonTier6Challenges } from "./python-tier6";
import { typescriptChallenges } from "./typescript";
import { reactChallenges } from "./react";
import { dsaChallenges } from "./dsa";
import { csharpChallenges } from "./csharp";
import { databasesChallenges } from "./databases";
import { systemsDesignChallenges } from "./systems-design";
import { networkingChallenges } from "./networking";
import { securityChallenges } from "./security";
import { devopsChallenges } from "./devops";

export const allChallenges: Challenge[] = [
  ...pythonTier1Challenges,
  ...pythonTier2Challenges,
  ...pythonTier3Challenges,
  ...pythonTier4Challenges,
  ...pythonTier5Challenges,
  ...pythonTier6Challenges,
  ...typescriptChallenges,
  ...reactChallenges,
  ...dsaChallenges,
  ...csharpChallenges,
  ...databasesChallenges,
  ...systemsDesignChallenges,
  ...networkingChallenges,
  ...securityChallenges,
  ...devopsChallenges,
];

export function getChallengesForNode(nodeId: string): Challenge[] {
  return allChallenges.filter((c) => c.nodeId === nodeId);
}
