// ============================================================
// DevOps — All Tiers (T1–T4)
// ============================================================

import type { LessonContent } from "./python-basics";

export const devopsLessons: Record<string, LessonContent> = {
  // ── T1 ──
  "devops:t1:cicd": {
    nodeId: "devops:t1:cicd", title: "CI / CD",
    sections: [
      { heading: "Continuous Integration", body: "Every commit triggers a pipeline that builds, tests, and lints. Goal: integration bugs surface in minutes, not days. Fast pipelines (< 10 minutes end-to-end) get used; slow ones get bypassed (skip-ci comments, merging without checks). Optimize ruthlessly: parallel jobs, caching dependencies, only running tests affected by changes." },
      { heading: "Continuous Delivery / Deployment", body: "CD = always shippable. Some teams auto-deploy every passing build to production (continuous deployment); others gate behind manual approval (continuous delivery). Either way, deploys are routine, not events. Feature flags decouple deploy from release — code can ship dark and turn on later." },
      { heading: "Deploy Strategies", body: "Recreate: take old version down, bring new up — has downtime. Rolling: replace instances one by one — partial degradation possible. Blue/green: two parallel environments; flip traffic; keep old around for instant rollback — costs 2x resources during cutover. Canary: gradually shift small percentage to new version; watch metrics; ramp up — best blast-radius control. Pick by risk tolerance and cost." },
    ],
    codeExamples: [
      { title: "GitHub Actions CI", code: `# .github/workflows/ci.yml
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
          cache: npm           # speeds up subsequent runs

      - run: npm ci             # respects lock file
      - run: npm run lint
      - run: npm test -- --coverage

      - uses: codecov/codecov-action@v4
        with:
          files: ./coverage/coverage-final.json`, explanation: "Trigger on push + PR; install with cache; lint, test, upload coverage. Each step fails the pipeline on non-zero exit." },
      { title: "Deploy strategies compared", code: `# Recreate
# - All-or-nothing replacement; brief downtime
# - Simplest; fine for non-prod or scheduled maintenance
#
# Rolling
# - Replace pods/instances one by one (or N at a time)
# - Mixed-version traffic during the rollout
# - Default for Kubernetes Deployments
#
# Blue/Green
# - Spin up entire new stack alongside old
# - Switch traffic atomically (LB / DNS / weight)
# - Instant rollback by switching back
# - 2x resources during cutover
#
# Canary
# - Send 1% / 5% / 10% / 100% of traffic to new
# - Watch metrics at each step
# - Pause / rollback on regression
# - Best for high-risk changes
#
# Pick: routine deploys → rolling. High-risk → canary. Need clean
# rollback → blue/green.`, explanation: "Trade-offs: cost vs blast-radius vs operational complexity. Most teams use rolling for routine, canary for risky." },
      { title: "Feature flags", code: `// Behind a flag; deploy is decoupled from release
if (await flags.isEnabled("new_dashboard_v2", { userId })) {
    return <DashboardV2 />;
}
return <DashboardV1 />;

// In production:
// 1. Code merges to main behind the flag (off everywhere)
// 2. Toggle on for 1% of users via flag service
// 3. Watch metrics; expand to 5%, 25%, 100%
// 4. Once at 100% for a week, remove the flag and old code

// Flag services: LaunchDarkly, GrowthBook, Statsig, ConfigCat,
// or homegrown.`, explanation: "Deploy ≠ release. Decoupling them = ship continuously, release deliberately." },
    ],
    keyTakeaways: ["CI: every commit builds + tests; pipelines must be fast (< 10 min)", "CD: every passing build is deployable (or auto-deploys)", "Deploy strategies: recreate, rolling, blue/green, canary", "Feature flags decouple deploy from release", "Pick strategy by blast radius + cost"],
  },
  "devops:t1:git-flows": {
    nodeId: "devops:t1:git-flows", title: "Git Workflows",
    sections: [
      { heading: "Trunk-Based vs GitFlow", body: "Trunk-based: short-lived branches off main, merge daily. Feature flags hide work-in-progress. The modern preference for SaaS — minimizes merge pain, fastest path to prod. GitFlow: long-lived develop branch + release branches + hotfix branches. Designed for shrink-wrapped software with versioned releases — overkill and painful for continuous delivery." },
      { heading: "PR Hygiene", body: "Small PRs (under ~400 lines diff) get reviewed quickly; big ones languish. Aim for one logical change per PR. Use draft PRs early to share work in progress. Squash-merge for clean history (each PR = one commit on main). Don't review-by-committee — assign one reviewer; involve others only when their domain is touched." },
      { heading: "Common Operations", body: "Rebase your feature branch onto main before merging to keep history linear (or trust your PR system to squash-merge). Resolve conflicts in your branch, not in main. git pull --rebase by default to avoid merge commits on every pull. Force-push only your own feature branches; never main." },
    ],
    codeExamples: [
      { title: "Trunk-based daily loop", code: `# Start fresh from main
git checkout main
git pull --rebase

# Create short-lived feature branch
git checkout -b feat/short-name

# ... do work, commit ...
git add -p
git commit -m "Add X"

# Push, open PR
git push -u origin feat/short-name

# After review + approval:
# - squash-merge to main via UI (or rebase + merge)
# - main deploys automatically via CI/CD

# Branches live hours-to-days, not weeks.`, explanation: "Branch from main → small PR → review → squash-merge → deploy. Branches don't accumulate." },
      { title: "Feature flag hides WIP", code: `// Deploy daily; release when ready

// Behind a flag — currently off
if (flags.isOn("new_checkout_flow")) {
    return <CheckoutFlowV2 />;
}
return <CheckoutFlowV1 />;

// Code is merged to main and deployed to prod every day,
// but the new flow only shows when the flag turns on.
//
// You can:
// - Test in prod with the flag on for your account only
// - Gradually roll out to 1%, 10%, 100%
// - Roll back instantly by flipping the flag (no code deploy needed)`, explanation: "Decouple deploy from release. Code can ship dark for weeks." },
      { title: "Rebase vs merge", code: `# Rebase your branch onto main before opening PR (linear history)
git checkout feat/short-name
git fetch origin
git rebase origin/main
# Resolve conflicts; git rebase --continue
git push --force-with-lease   # safer than --force; refuses to push if upstream changed

# Or — let the merge tool handle it via squash-merge in the UI.
# Modern teams often DON'T rebase locally; they squash-merge in the PR.
# Pick a convention and stick with it.

# NEVER force-push main. Force-push only your own feature branches.`, explanation: "Two approaches; both fine. --force-with-lease is the safe variant of force-push." },
    ],
    keyTakeaways: ["Trunk-based + flags > GitFlow for SaaS", "Small PRs reviewed quickly; aim for < 400-line diffs", "Squash-merge for clean history (1 PR = 1 commit on main)", "Feature flags decouple deploy from release", "--force-with-lease for safe force-push; never force-push main"],
  },

  // ── T2 ──
  "devops:t2:docker": {
    nodeId: "devops:t2:docker", title: "Docker",
    sections: [
      { heading: "Images And Containers", body: "An image is a snapshot — a stack of layers (filesystems) plus metadata. A container is a running instance of an image. Layers cache: identical instructions reuse the same layer across builds. Order Dockerfile commands so cheap, often-changing steps come last. The most common Dockerfile mistake is COPY-ing the whole project before installing dependencies — busts the cache on every code change." },
      { heading: "Multi-Stage Builds", body: "Build in a heavy 'build' stage (compilers, dev deps), copy only the artifacts to a slim 'runtime' stage. Final image stays small (and contains no compilers / dev deps). Standard practice for compiled languages (Go, Rust, .NET) and node projects. Often shaves 80%+ off the final image size." },
      { heading: "Image Hygiene", body: "Pin tags (node:20-slim, not node:latest — latest moves under you). Use small base images (Alpine, distroless, slim variants). Run as non-root (USER directive) for defense in depth. Don't put secrets in images — they bake in forever, even if removed in later layers. Use BuildKit (default in modern Docker) for faster builds and secret mounts at build time." },
    ],
    codeExamples: [
      { title: "Multi-stage Node Dockerfile", code: `# Build stage — full toolchain
FROM node:20-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Runtime stage — minimal
FROM node:20-slim
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
USER node
EXPOSE 3000
CMD ["node", "dist/server.js"]

# Final image: only what's needed to run; no compilers, no source.`, explanation: "Two stages: heavy build, slim runtime. Final image only has artifacts." },
      { title: "Layer cache discipline", code: `# GOOD — package files first, then install, then code
FROM node:20-slim
WORKDIR /app
COPY package*.json ./           # changes rarely
RUN npm ci                      # cached unless package*.json changed
COPY . .                        # changes often (your code)
RUN npm run build

# BAD — code first, busts cache on every change
FROM node:20-slim
WORKDIR /app
COPY . .                        # any code change invalidates everything below
RUN npm ci
RUN npm run build`, explanation: "Layer cache means rebuilds are seconds when only your code changes. Order steps from least to most frequently changing." },
      { title: "Pinning + non-root + healthcheck", code: `FROM node:20.11-slim                    # specific minor version
WORKDIR /app
RUN groupadd -r app && useradd -r -g app app
USER app

COPY --chown=app:app package*.json ./
RUN npm ci --only=production
COPY --chown=app:app . .

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD node -e "fetch('http://localhost:3000/healthz').then(r => r.ok ? process.exit(0) : process.exit(1))"

CMD ["node", "dist/server.js"]`, explanation: "Pinned version, non-root user, healthcheck. The boring stuff that makes operations smooth." },
    ],
    keyTakeaways: ["Image = layered snapshot; container = running instance", "Layer order matters for cache — change-rarely first, change-often last", "Multi-stage: heavy build, slim runtime", "Pin tags (node:20.11), use slim/distroless, run as non-root", "Never bake secrets into images"],
  },
  "devops:t2:containers": {
    nodeId: "devops:t2:containers", title: "Containers in Practice",
    sections: [
      { heading: "12-Factor Highlights", body: "Config from environment variables. Logs as event streams to stdout/stderr (don't write log files). Stateless processes — durable state lives in attached resources (DB, object store, queue). Disposable: start fast, shut down gracefully on SIGTERM. Build, release, run as separate stages. The 12-factor manifesto from the early 2010s still holds." },
      { heading: "Healthchecks And Signals", body: "Liveness probe: am I alive? (Process running, not deadlocked.) Readiness probe: am I ready to serve? (Caches warm, DB reachable.) Different checks. Liveness failure = orchestrator restarts you. Readiness failure = LB stops sending traffic. Combine with graceful shutdown: handle SIGTERM, drain connections, exit. Otherwise the orchestrator force-kills (SIGKILL) mid-request." },
      { heading: "Resource Limits And Sidecars", body: "Set CPU and memory requests/limits — without them, one greedy container can starve neighbors. Requests = guaranteed; limits = ceiling. Memory limit hit = OOMKilled. CPU limit hit = throttled (slowed down, not killed). Sidecars (log shipper, service-mesh proxy) run alongside your container in the same pod, sharing network and filesystem mounts." },
    ],
    codeExamples: [
      { title: "Graceful shutdown (Node)", code: `const server = app.listen(3000);

function shutdown() {
    console.log("SIGTERM received, draining...");
    server.close(() => process.exit(0));

    // Hard cap — exit even if connections won't close
    setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

// Behavior:
// 1. Container receives SIGTERM
// 2. server.close stops accepting new connections, waits for existing
// 3. Process exits cleanly, or hard-caps after 10s
// 4. Orchestrator marks pod as terminated`, explanation: "Stop accepting new; finish in-flight; exit. Hard timeout as safety. Otherwise = force-killed mid-request." },
      { title: "Liveness vs readiness (HTTP)", code: `// Liveness — fast, no external deps. Just 'process alive?'
app.get("/healthz", (_, res) => res.status(200).send("ok"));

// Readiness — checks deps the app needs to serve
app.get("/readyz", async (_, res) => {
    try {
        await db.raw("SELECT 1");          // DB reachable?
        if (!cache.connected) throw new Error("cache");
        return res.status(200).send("ok");
    } catch (e) {
        return res.status(503).send("not ready");
    }
});

// /healthz NEVER touches the DB. A DB blip should NOT cause a
// pod restart loop — only a brief pull from rotation.`, explanation: "Two endpoints, two purposes. Conflating them causes outages on dependency blips." },
      { title: "Resource limits", code: `# Kubernetes pod spec
apiVersion: v1
kind: Pod
metadata:
  name: web
spec:
  containers:
    - name: web
      image: example/web:1.2.3
      resources:
        requests:                 # guaranteed
          cpu: "200m"             # 0.2 CPU core
          memory: "256Mi"
        limits:                   # ceiling
          cpu: "1000m"            # 1 CPU core
          memory: "512Mi"

# - Hit memory limit → OOMKilled (process killed)
# - Hit CPU limit → throttled (slowed)
# - No requests → scheduled anywhere; subject to noisy neighbors
# - No limits → can starve other workloads`, explanation: "Always set both requests and limits. Memory misses get you OOMKilled; CPU misses just get slow." },
    ],
    keyTakeaways: ["Config from env; logs to stdout (12-factor)", "Stateless containers; state in attached resources", "Liveness = alive? Readiness = ready? Different probes", "Handle SIGTERM gracefully — drain connections, exit clean", "Set CPU + memory requests AND limits"],
  },

  // ── T3 ──
  "devops:t3:kubernetes": {
    nodeId: "devops:t3:kubernetes", title: "Kubernetes Basics",
    sections: [
      { heading: "Core Objects", body: "Pod: smallest deployable unit (one or more containers sharing network + storage). Deployment: declares N replicas of a Pod template; manages rolling updates and rollbacks. Service: stable virtual IP / DNS name in front of a set of Pods (selected by labels). Ingress: HTTP entry point, routing by host/path, terminates TLS. ConfigMap / Secret: inject configuration and credentials." },
      { heading: "Declarative Reconciliation", body: "You describe desired state in YAML; the control loop reconciles actual to desired. kubectl apply / kubectl rollout. Don't kubectl edit production — version everything in git, apply via CI. The cluster's job is to make reality match your YAML; surprising changes mean someone bypassed the system." },
      { heading: "Labels, Selectors, Namespaces", body: "Labels are key-value tags on objects. Selectors find objects by labels (Service.spec.selector picks Pods to front). Namespaces partition objects within a cluster — usually one per environment (dev, staging) or per team. Resource quotas can be set per namespace. Network policies (when enabled) gate traffic between namespaces." },
    ],
    codeExamples: [
      { title: "Deployment + Service", code: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
  labels: { app: web }
spec:
  replicas: 3
  selector:
    matchLabels: { app: web }
  template:
    metadata:
      labels: { app: web }
    spec:
      containers:
        - name: web
          image: example/web:1.2.3
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
  selector: { app: web }
  ports:
    - port: 80
      targetPort: 3000`, explanation: "Three replicas of web:1.2.3; Service gives them a stable virtual IP / DNS." },
      { title: "Rollout and rollback", code: `# Watch the rollout
kubectl rollout status deploy/web

# Roll back to previous revision
kubectl rollout undo deploy/web

# Update image
kubectl set image deploy/web web=example/web:1.2.4

# Check history
kubectl rollout history deploy/web

# Pause/resume (e.g., during an investigation)
kubectl rollout pause deploy/web
kubectl rollout resume deploy/web`, explanation: "Built-in rolling updates with one-command rollback. Always available." },
      { title: "ConfigMap + Secret", code: `apiVersion: v1
kind: ConfigMap
metadata:
  name: web-config
data:
  LOG_LEVEL: "info"
  FEATURE_FLAG_NEW_UI: "true"
---
apiVersion: v1
kind: Secret
metadata:
  name: web-secrets
type: Opaque
stringData:                   # base64 happens automatically
  DATABASE_URL: "postgres://..."
---
# In the pod spec
spec:
  containers:
    - name: web
      envFrom:
        - configMapRef: { name: web-config }
        - secretRef:    { name: web-secrets }`, explanation: "Inject config and secrets as env vars. ConfigMap for non-sensitive; Secret for sensitive (and ideally backed by an external secret store via External Secrets Operator)." },
    ],
    keyTakeaways: ["Pod, Deployment, Service, Ingress, ConfigMap, Secret = the basics", "Declarative: describe desired state; control loop reconciles", "Liveness + readiness probes are essential for safe rollouts", "Rolling updates with one-command rollback (kubectl rollout undo)", "Version everything in git; apply via CI — don't kubectl edit prod"],
  },
  "devops:t3:iac": {
    nodeId: "devops:t3:iac", title: "Infrastructure as Code",
    sections: [
      { heading: "Declarative Infra", body: "Terraform, OpenTofu, Pulumi describe cloud resources as code. terraform plan diffs current state vs desired state; terraform apply applies the diff. State file tracks what exists. Always store state remotely with locking (S3 + DynamoDB lock, Terraform Cloud, etc.) — local state files are footguns the moment more than one person works on the infra." },
      { heading: "Drift And Imports", body: "Drift = reality diverges from code (someone clicked in the console, or another tool changed it). plan catches it; apply re-converges (which may not be what you want — sometimes the click was the right thing). Import existing resources into Terraform state with terraform import. Tools like Terraformer help bulk-import legacy infra; rarely clean output, often worth the manual cleanup." },
      { heading: "Modules And Workspaces", body: "Modules: encapsulate a piece of infra into a reusable unit (VPC module, RDS module, IAM role module). Pin module versions; don't track main. Workspaces / environments: keep dev / staging / prod state files separate to avoid catastrophic mistakes. Consider tools like Terragrunt or Atlantis for managing multiple environments and pull-request-driven applies." },
    ],
    codeExamples: [
      { title: "Terraform basics", code: `terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.0" }
  }
  backend "s3" {
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
  bucket = aws_s3_bucket.logs.id
  versioning_configuration { status = "Enabled" }
}`, explanation: "Remote state with locking; pinned provider; resources reference each other by ID." },
      { title: "Plan + apply workflow", code: `# Initialize backend + providers
terraform init

# Show what would change
terraform plan -out=plan.bin

# Review the plan output. Pay attention to:
# + create
# ~ in-place update
# -/+ destroy and replace (dangerous!)
# - destroy

# Apply the exact plan you reviewed
terraform apply plan.bin

# In CI: 'plan' on PRs (visible diff in PR comments via Atlantis or similar);
# 'apply' on merge to main with approval.`, explanation: "plan, review, apply. Never apply without seeing the plan first. Use the saved plan to ensure no drift between review and apply." },
      { title: "Reusable module", code: `# modules/s3-bucket/main.tf
variable "name"        { type = string }
variable "versioning"  { type = bool   default = true }

resource "aws_s3_bucket" "this" {
  bucket = var.name
}

resource "aws_s3_bucket_versioning" "this" {
  bucket = aws_s3_bucket.this.id
  versioning_configuration {
    status = var.versioning ? "Enabled" : "Disabled"
  }
}

output "bucket_name" {
  value = aws_s3_bucket.this.id
}

# Use in root module
module "logs" {
  source     = "./modules/s3-bucket"
  name       = "my-app-logs"
  versioning = true
}

module "uploads" {
  source     = "./modules/s3-bucket"
  name       = "my-app-uploads"
  versioning = false
}`, explanation: "Modules encapsulate. Use registry modules (terraform-aws-modules/...) for common cases; write your own for domain-specific patterns." },
    ],
    keyTakeaways: ["IaC: cloud resources as version-controlled code", "plan before apply — every time, in CI", "Store state remotely with locking (S3 + DynamoDB or Terraform Cloud)", "Modules for reuse — pin versions, don't track main", "Drift happens; plan catches it. Imports are tedious but often worth it"],
  },

  // ── T4 ──
  "devops:t4:monitoring": {
    nodeId: "devops:t4:monitoring", title: "Observability",
    sections: [
      { heading: "Three Pillars", body: "Logs: discrete events. Metrics: aggregated numbers (counters, gauges, histograms). Traces: request flow across services and components. Modern stacks unify them via OpenTelemetry — instrument once, send to multiple backends. Each tool answers a different question; they're complementary, not substitutes." },
      { heading: "SLI / SLO / SLA / Error Budgets", body: "SLI: a measured indicator (p99 latency, success rate, freshness). SLO: a target (99.9% of requests succeed in 200ms over 30 days). SLA: a customer-facing commitment with penalties (99.95% uptime). Error budget = 1 - SLO. When you've burned half the budget early in the period, slow down feature work and invest in reliability — that's the SRE way." },
      { heading: "Alerting Wisely", body: "Alert on symptoms users feel (SLO violations), not causes (high CPU, high disk usage). High CPU isn't a problem if requests are fast; low CPU is misleading if the service is broken. Alerts that page humans must require human action right now — everything else is a dashboard, a ticket, or a chatops notification. An on-call schedule full of unactionable alerts is a burnout factory." },
    ],
    codeExamples: [
      { title: "Structured logs", code: `// BAD — string concatenation
console.log("user " + userId + " did " + action);

// BETTER — structured JSON, machine-parseable
logger.info({ userId, action, requestId, durationMs: 42 }, "user action");

// In aggregation:
// { "level": "info", "msg": "user action", "userId": "u_1",
//   "action": "login", "requestId": "abc", "durationMs": 42, "ts": "..." }
//
// Now you can:
// - Filter by userId
// - Aggregate by action
// - Histogram of durationMs
// - Correlate with traces via requestId`, explanation: "Structured logs are searchable and aggregatable. Required at any non-trivial scale." },
      { title: "Metrics that matter (RED + USE)", code: `# RED — for request-driven services
# - Rate:    requests per second
# - Errors:  failed requests per second (or %)
# - Duration: p50, p95, p99 latency

# USE — for resources (CPU, disk, memory)
# - Utilization: % busy
# - Saturation: queue depth (waiting work)
# - Errors:    count of errors

# Combined: USE on the resources, RED on the user-facing services.
# Most useful dashboards have ~6-10 metrics, not 60.`, explanation: "Two frameworks (Brendan Gregg's USE, Tom Wilkie's RED) cover most observability needs. Memorize them." },
      { title: "SLO + error budget", code: `# Define
SLO: 99.9% of /api/* requests return non-5xx in 200ms over 30 days

# Error budget
1 - 0.999 = 0.001 = 0.1%
30 days × 24h × 60min = 43,200 minutes
0.1% × 43,200 ≈ 43 minutes/month allowed downtime

# Alert
'Burning error budget at 14x normal rate over 1h' — this is the
'multi-window, multi-burn-rate' alert from the Google SRE book.

# Decision rule
- Budget healthy → ship features fast
- Budget burning → invest in reliability (postmortems, fixes)
- Budget exhausted → freeze feature work until restored`, explanation: "Error budgets translate reliability targets into engineering tempo. Best framework I know for balancing speed and stability." },
    ],
    keyTakeaways: ["Logs (events), metrics (numbers), traces (request flow) = three pillars", "RED for services (Rate, Errors, Duration); USE for resources", "SLOs drive engineering priorities; SLAs commit to customers", "Alert on symptoms users feel, not on causes (CPU, disk)", "Error budgets guide tempo: when low, slow down"],
  },
  "devops:t4:incident-response": {
    nodeId: "devops:t4:incident-response", title: "Incident Response",
    sections: [
      { heading: "On-Call Rituals", body: "Page when humans must act now. Runbooks per known issue: symptom → diagnose → mitigate → escalate. Page rotations: usually weekly; compensate the time. The single biggest improvement most on-call schedules need is fewer alerts and better runbooks. Burnout is real and measurable; track pages-per-week as a health metric." },
      { heading: "Incident Command", body: "During an incident: someone is the IC (Incident Commander) — coordinates, decides, communicates. Others: Ops Lead (drives the technical work), Comms Lead (updates status page, internal stakeholders, customers). Roles can compress to one or two people on smaller teams; the names matter less than someone holding each function." },
      { heading: "Postmortems", body: "Blameless: focus on systems and conditions, not people. Sections: Summary, Impact, Timeline, Root cause, What went well, What went poorly, Action items (with owners and due dates). Share widely — your team's incident is everyone's lesson. Track action items to completion; they prevent the next incident or you'll see them again in next quarter's postmortem." },
    ],
    codeExamples: [
      { title: "Runbook entry shape", code: `## DB CPU > 80% sustained
#
# **Symptom:** alerts on db.cpu.5m_p95 > 0.8
#
# **Diagnose:**
#   1. Open Grafana 'DB Overview' dashboard
#   2. Check pg_stat_activity for long-running queries:
#      SELECT pid, now() - query_start AS dur, query
#      FROM pg_stat_activity
#      WHERE state = 'active' AND now() - query_start > interval '30s'
#      ORDER BY dur DESC LIMIT 10;
#   3. Check connection count vs max_connections
#
# **Mitigate (in order of preference):**
#   - Cancel obvious runaway query: SELECT pg_cancel_backend(<pid>)
#   - If user-facing, fail over to read replica: kubectl scale ...
#   - If sustained, scale primary up (manual change in Terraform)
#
# **Escalate:** @db-oncall after 15 min if not mitigated
#
# **Common causes:**
#   - Cron-driven analytics query running at peak hours
#   - ORM N+1 in newly deployed code
#   - Unexpected backfill / migration`, explanation: "Skim-able under stress. Concrete next steps. The point is shortest path to mitigation, not understanding the bug." },
      { title: "Postmortem template", code: `# 2025-01-15 — Login service outage
# Severity: SEV-2
# Status: resolved
# Lead: Ada (IC), Linus (Ops), Grace (Comms)
#
# ## Summary
# Login p99 latency exceeded 10s for 18 minutes; ~12k users affected.
#
# ## Impact
# - 12,400 users blocked or delayed
# - 8,200 unable to log in (req timed out)
# - $X estimated lost revenue
# - 1 customer raised an SLA claim
#
# ## Timeline (UTC)
# 14:02 — alert: login.p99 > 5s for 5m
# 14:08 — IC paged, identifies cache stampede on session keys
# 14:10 — Ops scales DB up; latency partially recovers
# 14:15 — Mitigation: jitter introduced into session TTLs
# 14:22 — Latency back to baseline. Resolved.
#
# ## Root cause
# Session TTLs were uniform across users (1h sliding). At peak hour,
# expirations clustered, causing simultaneous re-authn requests.
# Cache stampede on the auth service.
#
# ## What went well
# - Alert fired within 5 min
# - IC structure smooth; Comms updated status page in 7 min
#
# ## What went poorly
# - No runbook for cache stampede on auth
# - DB scale-up was manual (took 4 min)
#
# ## Action items
# - [x] Add jitter to session TTLs (Ada, 2025-01-22)
# - [ ] Create runbook for cache-stampede mitigation (Linus, 2025-01-30)
# - [ ] Automate DB scale-up via HPA on connection saturation (Grace, 2025-02-15)`, explanation: "Concrete. Action items have owners and dates. Reviewed in a meeting; not just filed." },
      { title: "Severity definitions", code: `# Pick a clear scale and stick to it. Example:
#
# SEV-1: Total outage of a critical user-facing service.
#        Active customer impact at scale. Page everyone.
#
# SEV-2: Major degradation. Significant customer impact.
#        Some users affected. Page on-call.
#
# SEV-3: Minor degradation or impact-limited issue.
#        Track in tickets; on-call notified but not paged.
#
# SEV-4: Cosmetic / internal-only issue. Track in tickets.
#
# Without a defined scale, every issue feels like SEV-1
# and people burn out.`, explanation: "Severity defines the response. Define the scale once; use it consistently." },
    ],
    keyTakeaways: ["Page humans only when humans must act", "Runbooks for known issues — short, skim-able, action-focused", "Incident command: IC, Ops, Comms (compressible on small teams)", "Postmortems are blameless; focus on systems and conditions", "Action items have owners + dates; track to completion or repeat"],
  },
  "devops:t4:cloud": {
    nodeId: "devops:t4:cloud", title: "Cloud Platforms",
    sections: [
      { heading: "The Building Blocks", body: "Compute: VMs (EC2, Compute Engine), serverless (Lambda, Cloud Functions, Vercel Functions), containers (ECS, GKE, Cloud Run). Storage: object (S3, GCS, R2, Vercel Blob), block (EBS), file (EFS). Networking: VPC, subnets, security groups, load balancers. IAM: roles, policies, service accounts. Every cloud provider has the same primitives under different names." },
      { heading: "IAM Mindset", body: "Least privilege: grant the smallest permission that works for the use case. Use roles for services (assumed automatically by EC2/Lambda/etc.), not long-lived access keys. AssumeRole / Workload Identity Federation eliminates long-lived credentials entirely. Audit IAM as carefully as code — overly broad policies are a top source of breaches." },
      { heading: "Cost And Networking Gotchas", body: "Egress (data leaving the cloud) costs money — sometimes a lot. NAT Gateways are surprisingly expensive at scale. Cross-AZ traffic costs in many providers. Free tier is generous for small projects but the cliff is steep. Watch for: idle resources, oversized instances, untouched EBS snapshots, cross-region replication you forgot about. Cost dashboards exist; check weekly." },
    ],
    codeExamples: [
      { title: "IAM least privilege (AWS)", code: `// BAD — disaster waiting
{
  "Effect": "Allow",
  "Action": "*",
  "Resource": "*"
}

// BETTER — specific actions, specific resource
{
  "Effect": "Allow",
  "Action": [
    "s3:GetObject",
    "s3:PutObject"
  ],
  "Resource": "arn:aws:s3:::my-bucket/uploads/*"
}

// EVEN BETTER — add conditions
{
  "Effect": "Allow",
  "Action": "s3:PutObject",
  "Resource": "arn:aws:s3:::my-bucket/uploads/*",
  "Condition": {
    "StringEquals": {
      "s3:x-amz-server-side-encryption": "AES256"
    }
  }
}`, explanation: "Specific actions on specific resources, with conditions. Star-star is what gets companies hacked." },
      { title: "Service identity (no long-lived creds)", code: `# Old way — long-lived access keys
# AWS_ACCESS_KEY_ID=AKIA...
# AWS_SECRET_ACCESS_KEY=...
# Anyone with the keys can call AWS as you, until rotated.

# New way (AWS): EC2/ECS/EKS pod assumes an IAM role
# - Role is attached to the resource at creation
# - SDKs auto-fetch short-lived credentials from instance metadata
# - Credentials rotate every few hours
# - You never see them, never store them

# Equivalent on other clouds:
# - GCP: Workload Identity (GKE), Workload Identity Federation (off-cloud)
# - Azure: Managed Identity
# - Kubernetes: Service Account tokens, projected to mounted file

# Always prefer service identity to access keys.`, explanation: "Eliminate the credential. Best secret is no secret." },
      { title: "Cost gotchas to watch", code: `# Egress
# - Data leaving the cloud: $$
# - Cross-region replication: $$
# - Cross-AZ traffic: $ (often forgotten)
# - Within same AZ same VPC: free (usually)
#
# NAT Gateway
# - Per-hour + per-GB processed
# - At scale, can dwarf compute costs
# - Alternatives: VPC endpoints (S3/DynamoDB), public subnets for
#   workloads that need internet, NAT instances (cheaper but you
#   manage them)
#
# Idle / forgotten resources
# - Unattached EBS volumes (continuing to charge)
# - Old snapshots
# - Stopped EC2 with attached EBS (storage still billed)
# - Test workloads in dev accounts that never get cleaned up
#
# Tools: AWS Cost Explorer, GCP Cost dashboards, third-party
# (Vantage, CloudZero) — check weekly, not yearly.`, explanation: "Cloud bills surprise teams that don't watch them. Egress and NAT are the most common culprits." },
    ],
    keyTakeaways: ["Same primitives across clouds: compute, storage, networking, IAM", "Least privilege IAM — specific actions on specific resources", "Use service identity (not access keys) for cloud-to-cloud", "Egress + NAT Gateway are the most common cost surprises", "Audit IAM as code; never grant *:*"],
  },
};
