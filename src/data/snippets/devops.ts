import type { Snippet } from "./types";

export const devopsSnippets: Snippet[] = [
  {
    id: "do-dockerfile-multi-stage",
    language: "devops",
    title: "Multi-stage Dockerfile",
    tag: "docker",
    code: `# Build stage — full toolchain
FROM node:20-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci                       # respects lockfile, deterministic
COPY . .
RUN npm run build

# Runtime stage — minimal, no compilers
FROM node:20-slim
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
USER node                        # don't run as root
EXPOSE 3000
CMD ["node", "dist/server.js"]

# Final image: only what's needed to run; build tools left behind.`,
    explanation:
      "Multi-stage builds keep production images tiny by leaving compilers and dev deps in the build stage. Standard for Node, Go, Rust, .NET.",
  },
  {
    id: "do-dockerfile-cache",
    language: "devops",
    title: "Docker layer cache discipline",
    tag: "docker",
    code: `# ✅ GOOD — package files first, code last.
FROM node:20-slim
WORKDIR /app
COPY package*.json ./            # changes rarely
RUN npm ci                       # cached unless package*.json changed
COPY . .                         # changes often (your code)
RUN npm run build

# ❌ BAD — busts cache on EVERY code change.
FROM node:20-slim
WORKDIR /app
COPY . .                         # any change invalidates everything below
RUN npm ci                       # has to re-run every time
RUN npm run build`,
    explanation:
      "Layer order matters. Put change-rarely instructions first, change-often last. Cached rebuilds drop from minutes to seconds.",
  },
  {
    id: "do-graceful-shutdown",
    language: "devops",
    title: "Graceful shutdown on SIGTERM",
    tag: "containers",
    code: `// Without graceful shutdown, every deploy = in-flight requests die mid-handle.

const server = app.listen(3000);

function shutdown() {
  console.log("SIGTERM — draining...");
  server.close(() => process.exit(0));   // stop accepting new; finish in-flight

  // Hard cap — exit even if connections refuse to close.
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

// In Kubernetes:
//   1. Pod gets removed from Service endpoints.
//   2. Container receives SIGTERM.
//   3. Has terminationGracePeriodSeconds (default 30) to finish.
//   4. SIGKILL — force-killed if still alive.`,
    explanation:
      "Stop accepting new requests; let in-flight finish; exit cleanly. Hard timeout as safety. Without this, every deploy spikes p99.",
  },
  {
    id: "do-liveness-readiness",
    language: "devops",
    title: "Liveness vs readiness probes",
    tag: "kubernetes",
    code: `// Two endpoints, two distinct purposes.

// Liveness — am I alive? Fast, no external dependencies.
// Failure -> orchestrator RESTARTS the container.
app.get("/healthz", (_, res) => res.status(200).send("ok"));

// Readiness — am I ready to serve? Checks deps the app needs.
// Failure -> LB STOPS sending traffic (no restart).
app.get("/readyz", async (_, res) => {
    try {
        await db.raw("SELECT 1");
        if (!cache.connected) throw new Error("cache");
        return res.status(200).send("ok");
    } catch (e) {
        return res.status(503).send("not ready");
    }
});

// /healthz NEVER touches the DB. A DB blip should NOT cause a fleet
// of restarts — only a brief withdrawal from rotation.`,
    explanation:
      "Conflating these is a top cause of cascading outages. Liveness restarts; readiness gates traffic. They answer different questions.",
  },
  {
    id: "do-k8s-deployment",
    language: "devops",
    title: "Kubernetes Deployment + Service",
    tag: "kubernetes",
    code: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
spec:
  replicas: 3                          # scale horizontally
  selector:
    matchLabels: { app: web }
  template:
    metadata:
      labels: { app: web }
    spec:
      containers:
        - name: web
          image: example/web:1.2.3     # pin a real version
          ports: [{ containerPort: 3000 }]
          resources:
            requests: { cpu: "100m", memory: "128Mi" }
            limits:   { cpu: "500m", memory: "256Mi" }
          readinessProbe:
            httpGet: { path: /readyz, port: 3000 }
          livenessProbe:
            httpGet: { path: /healthz, port: 3000 }
---
apiVersion: v1
kind: Service
metadata:
  name: web
spec:
  selector: { app: web }              # labels select the Pods
  ports:
    - port: 80
      targetPort: 3000`,
    explanation:
      "Deployment manages N replicas + rolling updates. Service gives them a stable virtual IP / DNS name. The two-step is the K8s basics.",
  },
  {
    id: "do-k8s-rollout",
    language: "devops",
    title: "Rolling update + rollback",
    tag: "kubernetes",
    code: `# Watch a rollout
kubectl rollout status deploy/web

# Update the image — triggers rolling update
kubectl set image deploy/web web=example/web:1.2.4

# Roll back to previous revision (one command)
kubectl rollout undo deploy/web

# Roll back to a specific revision
kubectl rollout undo deploy/web --to-revision=3

# Show history
kubectl rollout history deploy/web

# Pause / resume — useful during incident investigation
kubectl rollout pause deploy/web
kubectl rollout resume deploy/web`,
    explanation:
      "Built-in rolling updates with one-command rollback. Pair with health checks and you've got safe deploys for free.",
  },
  {
    id: "do-resource-limits",
    language: "devops",
    title: "Resource requests and limits",
    tag: "kubernetes",
    code: `# requests = guaranteed; limits = ceiling
resources:
  requests:                          # scheduler uses these to place pods
    cpu: "200m"                      # 0.2 CPU core
    memory: "256Mi"
  limits:                            # kernel/runtime enforces these
    cpu: "1000m"                     # 1 CPU core
    memory: "512Mi"

# Behavior on hitting limits:
#   memory limit  -> OOMKilled (process killed)
#   CPU    limit  -> throttled (slowed down, NOT killed)
#
# Without requests: scheduled anywhere; subject to noisy neighbors.
# Without limits:   one greedy pod can starve everything else on the node.
#
# Always set BOTH.`,
    explanation:
      "Memory is hard-killed on overage; CPU is just throttled. Always set requests + limits — without them, the cluster makes guesses.",
  },
  {
    id: "do-terraform-basics",
    language: "devops",
    title: "Terraform basics",
    tag: "iac",
    code: `terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.0" }
  }
  backend "s3" {                     # remote state with locking
    bucket         = "my-tf-state"
    key            = "prod/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "tf-locks"
    encrypt        = true
  }
}

provider "aws" {
  region = "us-east-1"
}

resource "aws_s3_bucket" "logs" {
  bucket = "my-app-logs"
}

resource "aws_s3_bucket_versioning" "logs" {
  bucket = aws_s3_bucket.logs.id     # references resource by ID
  versioning_configuration { status = "Enabled" }
}`,
    explanation:
      "Pin provider versions. Always use remote state with locking — local state is a footgun the moment more than one person works on the infra.",
  },
  {
    id: "do-terraform-flow",
    language: "devops",
    title: "Terraform plan / apply workflow",
    tag: "iac",
    code: `# Initialize backend + providers (run once per checkout / version change)
terraform init

# See what WOULD change. Save the plan to a file.
terraform plan -out=plan.bin

# Plan output codes:
#   +    create
#   ~    in-place update
#   -/+  destroy and replace (DANGEROUS — read carefully)
#   -    destroy

# Apply the EXACT plan you reviewed
terraform apply plan.bin

# In CI:
#   - 'plan' on PRs (Atlantis posts the diff as a PR comment)
#   - 'apply' on merge to main, with approval gate

# Always plan before apply. Always.`,
    explanation:
      "Plan first, every time. Saved-plan apply ensures no drift between review and action. Atlantis or Spacelift automate this for teams.",
  },
  {
    id: "do-cicd-actions",
    language: "devops",
    title: "GitHub Actions CI",
    tag: "ci",
    code: `# .github/workflows/ci.yml
name: CI
on:
  push:
    branches: [main]
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm           # caches ~/.npm across runs (faster)

      - run: npm ci             # respects lockfile
      - run: npm run lint
      - run: npm test -- --coverage

      - uses: codecov/codecov-action@v4
        with:
          files: ./coverage/coverage-final.json

# Pipelines must be FAST (<10 min) or developers bypass them.`,
    explanation:
      "Trigger on push + PR; install with cache; lint, test, upload coverage. Each step fails the pipeline on non-zero exit.",
  },
  {
    id: "do-deploy-strategies",
    language: "devops",
    title: "Deploy strategies compared",
    tag: "deploy",
    code: `# Recreate
#   Take old down, bring new up. DOWNTIME during cutover.
#   Fine for non-prod or scheduled maintenance.

# Rolling
#   Replace pods one (or N) at a time. Mixed versions during rollout.
#   Default for K8s Deployments.

# Blue/Green
#   Spin up entire NEW stack alongside old. Atomically flip traffic.
#   Instant rollback by flipping back. Costs 2x resources during cutover.

# Canary
#   Send 1% / 5% / 25% / 100% of traffic to new, watching metrics.
#   Best blast-radius control for risky changes. Complex tooling.

# Pick by:
#   - Risk of the change
#   - Resource budget
#   - How long rollback can take`,
    explanation:
      "Most teams use rolling for routine, canary for risky, blue/green when atomic flip + instant rollback matter most.",
  },
  {
    id: "do-feature-flags",
    language: "devops",
    title: "Feature flags decouple deploy from release",
    tag: "deploy",
    code: `// Behind a flag — deploy is decoupled from release.
if (await flags.isEnabled("new_dashboard_v2", { userId })) {
    return <DashboardV2 />;
}
return <DashboardV1 />;

// In production:
//   1. Code merges to main behind the flag (off everywhere).
//   2. Toggle on for 1% of users via flag service.
//   3. Watch metrics. Expand to 5%, 25%, 100% over hours/days.
//   4. Once at 100% for a week, REMOVE the flag and old code.

// Flag services: LaunchDarkly, GrowthBook, Statsig, ConfigCat,
// or homegrown (typically backed by Postgres or Redis).
// Most have SDKs that cache locally + stream updates.`,
    explanation:
      "Deploy != release. Decoupling them lets you ship continuously, release deliberately, and roll back instantly without a deploy.",
  },
  {
    id: "do-iam-least-privilege",
    language: "devops",
    title: "IAM least privilege",
    tag: "cloud",
    code: `// ❌ Disaster waiting
{
  "Effect": "Allow",
  "Action": "*",
  "Resource": "*"
}

// ❌ Slightly less bad
{
  "Effect": "Allow",
  "Action": "s3:*",
  "Resource": "*"
}

// ✅ Specific actions on specific resources
{
  "Effect": "Allow",
  "Action": ["s3:GetObject", "s3:PutObject"],
  "Resource": "arn:aws:s3:::my-bucket/uploads/*"
}

// ✅ Add conditions where it makes sense
{
  "Effect": "Allow",
  "Action": "s3:PutObject",
  "Resource": "arn:aws:s3:::my-bucket/uploads/*",
  "Condition": {
    "StringEquals": {
      "s3:x-amz-server-side-encryption": "AES256"
    }
  }
}`,
    explanation:
      "Specific actions on specific resources, with conditions. Star-star is what gets companies in the news. Audit IAM as carefully as code.",
  },
  {
    id: "do-service-identity",
    language: "devops",
    title: "Service identity (no long-lived creds)",
    tag: "cloud",
    code: `# OLD WAY — long-lived access keys
# AWS_ACCESS_KEY_ID=AKIA...
# AWS_SECRET_ACCESS_KEY=...
# Sits in env vars / .env / CI secrets. Anyone with them = you, until rotated.
#
# NEW WAY (AWS) — IAM roles + workload identity:
#   - Role attached to the EC2/ECS/EKS resource.
#   - SDK auto-fetches short-lived credentials from instance metadata.
#   - Credentials rotate every few hours. You never see them.
#
# GCP equivalents:
#   - Workload Identity (GKE)
#   - Workload Identity Federation (off-cloud / GitHub Actions)
#
# Azure: Managed Identity
# Kubernetes: ServiceAccount tokens projected into pods (OIDC-based).
#
# Always prefer service identity over access keys. Best secret = no secret.`,
    explanation:
      "Eliminate long-lived credentials. Service identities are short-lived, scoped, automatic — leak surface drops dramatically.",
  },
  {
    id: "do-observability-three",
    language: "devops",
    title: "Three pillars of observability",
    tag: "monitoring",
    code: `# Logs — discrete events. "What happened?"
#   Structured JSON, machine-parseable.
#   Tools: Loki, Splunk, Datadog Logs, OpenSearch.
logger.info({ userId, action, requestId, durationMs: 42 }, "user action")

# Metrics — aggregated numbers over time. "How is the system doing?"
#   Counters, gauges, histograms.
#   Tools: Prometheus, Datadog, CloudWatch.
counter.inc({ method: "POST", route: "/login", status: "200" })
histogram.observe({ method: "POST" }, durationMs)

# Traces — request flow across services. "Where did this request go?"
#   Spans linked by trace_id; show the call graph.
#   Tools: Jaeger, Tempo, Datadog APM, Honeycomb.
with tracer.start_as_current_span("login"):
    ...

# Modern stacks: instrument once with OpenTelemetry, export to multiple backends.`,
    explanation:
      "Three complementary views. Logs answer 'what'; metrics answer 'how often / how much'; traces answer 'where'. OpenTelemetry unifies the instrumentation.",
  },
  {
    id: "do-slo-error-budget",
    language: "devops",
    title: "SLO + error budget",
    tag: "monitoring",
    code: `# SLI: a measured indicator (success rate, latency p99, freshness).
# SLO: a target on that SLI (99.9% requests succeed in 200ms over 30 days).
# SLA: customer-facing commitment with penalties (often a subset of internal SLOs).
#
# Error budget = 1 - SLO
# 99.9% target -> 0.1% budget
# 30 days * 1440 min = 43,200 minutes
# 0.1% * 43,200 = 43 minutes/month allowable downtime
#
# Multi-window, multi-burn-rate alert (Google SRE book):
#   "burning error budget at 14x normal rate over 1h" -> page
#
# Decision rule:
#   Budget healthy   -> ship features fast
#   Budget burning   -> invest in reliability
#   Budget exhausted -> freeze features until restored
#
# Forces a real conversation about reliability vs velocity.`,
    explanation:
      "Error budgets translate reliability targets into engineering tempo. The single best framework for balancing speed and stability.",
  },
];
