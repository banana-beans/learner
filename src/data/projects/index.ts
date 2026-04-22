import { csharpRestApi } from "./csharp-rest-api";
export type { CapstoneProject, Milestone, StarterFile } from "./csharp-rest-api";

export const projects = [csharpRestApi];
export const projectMap = Object.fromEntries(projects.map((p) => [p.id, p]));
export { csharpRestApi };
