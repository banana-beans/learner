/**
 * Capstone Projects — barrel export
 *
 * Re-exports every capstone project definition and provides convenience
 * look-up structures (array + map).
 */

import { cliTaskManager } from "./python-cli-task-manager";
import { tradingAnalyzer } from "./python-trading-analyzer";

export type { CapstoneProject, Milestone, StarterFile } from "./python-cli-task-manager";

export const projects = [cliTaskManager, tradingAnalyzer];

export const projectMap: Record<string, typeof cliTaskManager> = Object.fromEntries(
  projects.map((p) => [p.id, p]),
);

export { cliTaskManager, tradingAnalyzer };
