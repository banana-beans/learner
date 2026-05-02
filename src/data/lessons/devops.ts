import type { LessonContent } from "./python-basics";

export const devopsLessons: Record<string, LessonContent> = {
  "devops:t1:cicd": {
    nodeId: "devops:t1:cicd", title: "CI / CD",
    sections: [
      { heading: "Continuous Integration", body: "Every commit triggers a pipeline that builds, tests, and lints. Goal: integration bugs surface in minutes, not days. Fast pipelines (< 10 min) are usable; slow ones get bypassed." },
      { heading: "Continuous Delivery / Deployment", body: "CD = always shippable. Some teams auto-deploy every passing build to prod (continuous deployment); others gate behind approval (continuous delivery). Either way, deploys are routine, not events." },
    ],
    codeExamples: [
      { title: "GitHub Actions skeleton", code: `# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm test`, explanation: "Trigger on push/PR; install, test, fail loud." },
      { title: "Deploy strategies", code: `# Blue/Green: spin up new version, swap traffic, keep old around
# Canary: send 5% of traffic to new, watch metrics, ramp up
# Rolling: replace instances one by one
# Recreate: take old down, bring new up (downtime)
#
# Vercel uses something like canary by default for previews.`, explanation: "Trade rollback ease vs resource cost vs blast radius." },
    ],
    keyTakeaways: ["CI: every commit builds + tests", "CD: every passing build is deployable (or auto-deploys)", "Pipelines must be fast (< 10 min) or get bypassed", "Blue/green and canary minimize blast radius"],
  },
  "devops:t1:git-flows": {
    nodeId: "devops:t1:git-flows", title: "Git Workflows",
    sections: [
      { heading: "Trunk-Based vs GitFlow", body: "Trunk-based: short-lived branches off main, merge daily. Feature flags hide WIP. Modern preference. GitFlow: long develop branch + release branches; great for shrink-wrapped software, painful for SaaS." },
      { heading: "PR Hygiene", body: "Small PRs (< 400 lines) reviewed in < 24h. Squash-merge for clean history. Use draft PRs early to share work in progress. Don't review-by-committee — assign one reviewer." },
    ],
    codeExamples: [
      { title: "Trunk-based loop", code: `git checkout main
git pull
git checkout -b feat/short-name
# ...code...
git push -u origin feat/short-name
# open PR; reviewer approves; squash-merge to main
# main deploys automatically`, explanation: "Branches live for hours-to-days, not weeks." },
      { title: "Feature flags hide WIP", code: `// Behind a flag
if (flags.NEW_DASHBOARD_V2) {
  return <DashboardV2 />;
}
return <DashboardV1 />;

// Toggle in prod via flag service (LaunchDarkly, GrowthBook, GB, etc.)
// Code merges before the feature is "done"`, explanation: "Decouple deploy from release." },
    ],
    keyTakeaways: ["Trunk-based + flags > GitFlow for SaaS", "Small PRs reviewed quickly", "Squash-merge for clean history", "Feature flags decouple deploy from release"],
  },
  "devops:t2:docker": {
    nodeId: "devops:t2:docker", title: "Docker",
    sections: [
      { heading: "Images and Containers", body: "An image is a snapshot — layers stacked. A container is a running instance of an image. Layers cache: same instructions = reuse the layer. Order Dockerfile commands so cheap, often-changing steps come last." },
      { heading: "Multi-Stage Builds", body: "Build in a heavy 'build' stage, copy only the artifacts to a slim 'runtime' stage. Final image stays small (and contains no compilers / dev deps). Standard practice for compiled languages and node modules." },
    ],
    codeExamples: [
      { title: "Multi-stage Dockerfile", code: `FROM node:20-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-slim
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
EXPOSE 3000
CMD ["node", "dist/server.js"]`, explanation: "Two stages: heavy build, slim runtime. Final image only has the artifacts it needs." },
      { title: "Layer cache discipline", code: `# Good — package files first, code last
COPY package*.json ./
RUN npm ci
COPY . .

# Bad — code first, busts cache on every change
COPY . .
RUN npm ci`, explanation: "Layer cache means rebuilds are seconds when only your code changes." },
    ],
    keyTakeaways: ["Image = layered snapshot; container = running instance", "Layer order matters for cache", "Multi-stage builds: heavy build, slim runtime", "Pin tags (node:20-slim, not node:latest)"],
  },
  "devops:t2:containers": {
    nodeId: "devops:t2:containers", title: "Containers in Practice",
    sections: [
      { heading: "12-Factor Highlights", body: "Config from env. Logs as event streams (stdout/stderr). Stateless processes — durable state lives in attached resources. Disposable: start fast, shut down gracefully on SIGTERM." },
      { heading: "Healthchecks and Signals", body: "Liveness probe: am I alive? Readiness probe: am I ready to serve? Different checks. Handle SIGTERM: stop accepting new requests, finish in-flight ones, exit. Otherwise the orchestrator force-kills you (SIGKILL) mid-request." },
    ],
    codeExamples: [
      { title: "Graceful shutdown (Node)", code: `const server = app.listen(3000);

function shutdown() {
  console.log("SIGTERM received, draining...");
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10_000);  // hard cap
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);`, explanation: "Stop accepting connections; finish what's open; exit. Hard timeout as a fallback." },
      { title: "Health endpoints", code: `// Liveness — is the process alive?
app.get("/healthz", (_, res) => res.send("ok"));

// Readiness — am I ready to serve?
app.get("/readyz", async (_, res) => {
  const dbOk = await db.ping();
  if (!dbOk) return res.status(503).send("db down");
  res.send("ok");
});`, explanation: "Liveness restarts the container if dead. Readiness gates traffic." },
    ],
    keyTakeaways: ["Config from env; logs to stdout", "Stateless containers; state in attached resources", "Liveness vs readiness — different probes", "Handle SIGTERM gracefully or get SIGKILLed"],
  },
  "devops:t3:kubernetes": {
    nodeId: "devops:t3:kubernetes", title: "Kubernetes Basics",
    sections: [
      { heading: "Core Objects", body: "Pod: smallest deployable unit (1+ containers). Deployment: declares N replicas of a Pod template; manages rollouts. Service: stable virtual IP / DNS for a set of Pods. Ingress: HTTP entry point, routing by host/path." },
      { heading: "Declarative Operation", body: "You describe desired state in YAML; the control loop reconciles. kubectl apply / kubectl rollout. Don't kubectl edit in production — version everything in git." },
    ],
    codeExamples: [
      { title: "Deployment + Service", code: `apiVersion: apps/v1
kind: Deployment
metadata: { name: web }
spec:
  replicas: 3
  selector: { matchLabels: { app: web } }
  template:
    metadata: { labels: { app: web } }
    spec:
      containers:
        - name: web
          image: example/web:1.2.3
          ports: [{ containerPort: 3000 }]
---
apiVersion: v1
kind: Service
metadata: { name: web }
spec:
  selector: { app: web }
  ports:
    - port: 80
      targetPort: 3000`, explanation: "Three replicas of web:1.2.3; Service gives them a stable virtual IP." },
      { title: "Rollout and rollback", code: `kubectl rollout status deploy/web
kubectl rollout undo deploy/web
kubectl set image deploy/web web=example/web:1.2.4`, explanation: "Built-in rolling updates with one-command rollback." },
    ],
    keyTakeaways: ["Pod, Deployment, Service, Ingress — the basics", "Declarative: describe desired state, control loop reconciles", "Version YAML in git; don't kubectl edit prod", "Rolling updates with one-command rollback"],
  },
  "devops:t3:iac": {
    nodeId: "devops:t3:iac", title: "Infrastructure as Code",
    sections: [
      { heading: "Declarative Infra", body: "Terraform / Pulumi / OpenTofu describe cloud resources as code. terraform plan diffs current vs desired; terraform apply applies the diff. State file tracks what exists. Always store state remotely (S3 + DynamoDB lock, Terraform Cloud, etc.)." },
      { heading: "Drift And Modules", body: "Drift = reality diverges from code (someone clicked in the console). plan catches it. Modules: encapsulate a piece of infra into a reusable unit — VPC module, RDS module. Don't go too DRY too soon." },
    ],
    codeExamples: [
      { title: "Terraform basics", code: `terraform {
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.0" }
  }
}

resource "aws_s3_bucket" "logs" {
  bucket = "my-app-logs"
}

resource "aws_s3_bucket_versioning" "logs" {
  bucket = aws_s3_bucket.logs.id
  versioning_configuration { status = "Enabled" }
}`, explanation: "Declare resources; references thread them together." },
      { title: "Plan + apply", code: `terraform init       # download providers
terraform plan       # show diff
terraform apply      # apply diff
terraform destroy    # tear down (rare in prod!)`, explanation: "plan first, every time." },
    ],
    keyTakeaways: ["IaC: cloud resources as version-controlled code", "plan before apply — every time", "Store state remotely with locking", "Modules for reuse — but don't over-abstract"],
  },
  "devops:t4:monitoring": {
    nodeId: "devops:t4:monitoring", title: "Observability",
    sections: [
      { heading: "Three Pillars", body: "Logs: discrete events. Metrics: aggregated numbers (counters, gauges, histograms). Traces: request flow across services. Modern stacks unify them via OpenTelemetry. Each tool answers a different question." },
      { heading: "SLI / SLO / SLA", body: "SLI: a measured indicator (p99 latency, success rate). SLO: a target (99.9% requests succeed). SLA: a commitment to customers. Set SLOs internally to drive engineering work; SLAs are the customer-facing subset." },
    ],
    codeExamples: [
      { title: "Structured logs", code: `// Bad — string concat
console.log("user " + userId + " did " + action);

// Better — JSON, machine-parsable
logger.info({ userId, action, requestId }, "user action");`, explanation: "Structured logs let you filter and aggregate. Required at scale." },
      { title: "Metrics + alerts", code: `# 99% of requests under 200ms over 5 minutes
# alert: latency_p99_5m > 0.2 for 10 minutes
#
# Error budget: 99.9% target → 43min/month allowable downtime
# When you've burned half in a week, slow down feature work.`, explanation: "Alert on SLO violations, not symptoms. Error budget guides decisions." },
    ],
    keyTakeaways: ["Logs, metrics, traces — three complementary views", "SLOs drive engineering priorities; SLAs commit to customers", "Structured logs (JSON) are searchable at scale", "Error budgets guide tempo: when low, slow down"],
  },
  "devops:t4:incident-response": {
    nodeId: "devops:t4:incident-response", title: "Incident Response",
    sections: [
      { heading: "On-Call Rituals", body: "Page when humans must act now. Runbooks per known issue: symptom → diagnose → mitigate. Page rotations: weekly is common. Compensate the time. Burnout is real and avoidable." },
      { heading: "Postmortems", body: "Blameless: focus on systems, not people. Timeline + root cause + lessons + action items. Share widely — your team's incident is everyone's lesson. Track action items to completion." },
    ],
    codeExamples: [
      { title: "Runbook entry shape", code: `# DB CPU > 80%
#
# Symptom: alerts on db.cpu p95
# Diagnose:
#   1. SELECT * FROM pg_stat_activity WHERE state = 'active'
#   2. Look for long-running queries
# Mitigate:
#   - Cancel runaway queries with pg_cancel_backend(pid)
#   - Failover to replica if user-facing
# Escalate to: @db-oncall after 15 min`, explanation: "Skim-able under stress. The point is shortest path to mitigation." },
      { title: "Postmortem template", code: `# 2024-08-15 - Login outage
# Status: resolved
# Severity: SEV-2
# Timeline:
#   14:02 - alert fires (login p99 > 5s)
#   14:08 - oncall paged, identifies cache stampede
#   14:15 - mitigation: scale up DB
#   14:22 - resolved
# Root cause: TTLs aligned across all sessions; cache stampeded.
# Action items:
#   - [ ] Add jitter to session TTLs (owner: foo)
#   - [ ] Cache stampede playbook (owner: bar)`, explanation: "Concrete. Action items have owners. Reviewed in a meeting; not just filed." },
    ],
    keyTakeaways: ["Page humans only when humans must act", "Runbooks for known issues — short and skim-able", "Postmortems are blameless; focus on systems", "Action items have owners and get done"],
  },
  "devops:t4:cloud": {
    nodeId: "devops:t4:cloud", title: "Cloud Platforms",
    sections: [
      { heading: "The Building Blocks", body: "Compute (EC2/GCE/VMs/serverless), Storage (S3/GCS/Blob), Networking (VPC/subnets/security groups), IAM (roles/policies). Every provider has the same pieces under different names." },
      { heading: "IAM Mindset", body: "Least privilege: grant the smallest permission that works. Use roles for services, not access keys. AssumeRole / Workload Identity Federation eliminates long-lived credentials. Audit IAM as carefully as code." },
    ],
    codeExamples: [
      { title: "IAM least privilege (AWS)", code: `# Bad
{
  "Effect": "Allow",
  "Action": "*",
  "Resource": "*"
}

# Better
{
  "Effect": "Allow",
  "Action": ["s3:GetObject", "s3:PutObject"],
  "Resource": "arn:aws:s3:::my-bucket/uploads/*"
}`, explanation: "Specific actions, specific resources. Star-star is what gets companies hacked." },
      { title: "Service identity", code: `# Old way — long-lived access keys in env vars
# New way — workload identity / IRSA / GKE workload identity
#   - Pod assumes a role automatically
#   - Short-lived tokens
#   - No keys to leak
#
# Always prefer service identity to access keys.`, explanation: "Eliminate long-lived secrets where possible." },
    ],
    keyTakeaways: ["Same building blocks across clouds: compute, storage, network, IAM", "Least privilege IAM — specific actions on specific resources", "Use service identity (not access keys) for cloud-to-cloud", "Audit IAM as code; never grant *:*"],
  },
};
