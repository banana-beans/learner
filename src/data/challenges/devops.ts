import type { Challenge } from "@/lib/types";

const m = (
  partial: Omit<Challenge, "lang" | "type" | "isBoss" | "starterCode" | "tags"> & Partial<Pick<Challenge, "tags" | "isBoss" | "starterCode">>
): Challenge => ({ type: "design", isBoss: false, starterCode: "", tags: ["devops"], lang: "manual", ...partial });

export const devopsChallenges: Challenge[] = [
  m({ id: "do-cicd-1", nodeId: "devops:t1:cicd", title: "Pick a deploy strategy", description: "Need fast rollback + minimal blast radius — which strategy?", difficulty: 2,
    hints: [
      { tier: "nudge", text: "Run new alongside old.", xpPenalty: 0.9 },
      { tier: "guide", text: "Swap traffic to keep old around.", xpPenalty: 0.75 },
      { tier: "reveal", text: `Blue/green — old stays running until new is verified, then swap. Rollback = swap back. Costs 2x resources during the cutover.`, xpPenalty: 0.5 },
    ], baseXP: 150 }),
  m({ id: "do-git-1", nodeId: "devops:t1:git-flows", title: "Trunk-based loop", description: "What's the daily branch lifecycle?", difficulty: 1,
    hints: [
      { tier: "nudge", text: "Branches live hours, not weeks.", xpPenalty: 0.9 },
      { tier: "guide", text: "Squash to main; flag-gate WIP.", xpPenalty: 0.75 },
      { tier: "reveal", text: `Branch from main → small PR → review → squash-merge to main → main auto-deploys. Feature flags hide WIP.`, xpPenalty: 0.5 },
    ], baseXP: 130 }),
  m({ id: "do-docker-1", nodeId: "devops:t2:docker", title: "Cache-friendly Dockerfile", description: "What's the order to maximize layer cache for a Node app?", difficulty: 2, isBoss: true,
    hints: [
      { tier: "nudge", text: "Things that change rarely first.", xpPenalty: 0.9 },
      { tier: "guide", text: "Source code last.", xpPenalty: 0.75 },
      { tier: "reveal", text: `COPY package*.json ./
RUN npm ci
COPY . .

Package files change less often than your source — install layer caches across builds.`, xpPenalty: 0.5 },
    ], baseXP: 180 }),
  m({ id: "do-cont-1", nodeId: "devops:t2:containers", title: "Liveness vs readiness", description: "Database is briefly unreachable — which probe should fail?", difficulty: 2,
    hints: [
      { tier: "nudge", text: "Restart vs gate traffic.", xpPenalty: 0.9 },
      { tier: "guide", text: "You don't want a restart loop.", xpPenalty: 0.75 },
      { tier: "reveal", text: `Readiness should fail (gate traffic). Liveness should pass (the process itself is fine — restarting won't help).`, xpPenalty: 0.5 },
    ], baseXP: 150 }),
  m({ id: "do-k8s-1", nodeId: "devops:t3:kubernetes", title: "Deployment vs Service", description: "Which K8s object provides a stable IP for Pods?", difficulty: 1,
    hints: [
      { tier: "nudge", text: "Pods come and go.", xpPenalty: 0.9 },
      { tier: "guide", text: "The abstraction in front of them.", xpPenalty: 0.75 },
      { tier: "reveal", text: `Service. Stable virtual IP / DNS name in front of a set of Pods (selected by labels).`, xpPenalty: 0.5 },
    ], baseXP: 130 }),
  m({ id: "do-iac-1", nodeId: "devops:t3:iac", title: "plan before apply", description: "Why always run terraform plan before apply?", difficulty: 1,
    hints: [
      { tier: "nudge", text: "Diff is what you're about to do.", xpPenalty: 0.9 },
      { tier: "guide", text: "Drift catches surprises.", xpPenalty: 0.75 },
      { tier: "reveal", text: `plan shows the diff between desired (code) and current (state). Catches drift, surprises, and accidental destructive changes before you apply them.`, xpPenalty: 0.5 },
    ], baseXP: 120 }),
  m({ id: "do-mon-1", nodeId: "devops:t4:monitoring", title: "Three pillars", description: "Discrete events, aggregated numbers, request flow — match each to a pillar.", difficulty: 1,
    hints: [
      { tier: "nudge", text: "Logs, metrics, traces.", xpPenalty: 0.9 },
      { tier: "guide", text: "One per pillar.", xpPenalty: 0.75 },
      { tier: "reveal", text: `Discrete events → logs
Aggregated numbers → metrics
Request flow across services → traces`, xpPenalty: 0.5 },
    ], baseXP: 100 }),
  m({ id: "do-incident-1", nodeId: "devops:t4:incident-response", title: "Postmortem essentials", description: "What four sections does every postmortem need?", difficulty: 2, isBoss: true,
    hints: [
      { tier: "nudge", text: "Timeline first.", xpPenalty: 0.9 },
      { tier: "guide", text: "Plus the cause and what you'll do about it.", xpPenalty: 0.75 },
      { tier: "reveal", text: `Timeline, root cause, lessons learned, action items (with owners).
Blameless tone. Action items tracked to completion.`, xpPenalty: 0.5 },
    ], baseXP: 180 }),
  m({ id: "do-cloud-1", nodeId: "devops:t4:cloud", title: "Least-privilege IAM", description: "Service writes objects to one S3 bucket — what should the policy look like?", difficulty: 2,
    hints: [
      { tier: "nudge", text: "Specific actions only.", xpPenalty: 0.9 },
      { tier: "guide", text: "Specific resource ARN.", xpPenalty: 0.75 },
      { tier: "reveal", text: `{
  "Effect": "Allow",
  "Action": ["s3:PutObject"],
  "Resource": "arn:aws:s3:::my-bucket/uploads/*"
}`, xpPenalty: 0.5 },
    ], baseXP: 180 }),
];
