// ============================================================
// Systems Design — Full Tiers (T1–T5)
// ============================================================
// Deeper than other "lighter" branches because this is what
// senior eng interviews and AI-infra work actually run on.
// ============================================================

import type { LessonContent } from "./python-basics";

export const systemsDesignLessons: Record<string, LessonContent> = {
  // ── T1: Foundations ────────────────────────────────────
  "systems-design:t1:client-server": {
    nodeId: "systems-design:t1:client-server", title: "Client-Server Model",
    sections: [
      { heading: "Request-Response At Heart", body: "Client sends a request; server processes it and returns a response. Synchronous (HTTP) or async (queues, websockets, server-sent events). The client owns presentation and short-lived state; the server owns durable state and shared logic. Everything else in distributed systems is variation on this." },
      { heading: "Statelessness And Why It Matters", body: "Stateless servers don't remember anything between requests. Any instance can handle any request, so you scale horizontally by adding boxes behind a load balancer. State has to live somewhere though — push it into cookies/JWT (signed, on the client), into a shared store (Redis, DB), or into a sticky-session layer (last resort)." },
      { heading: "Where State Lives", body: "Three locations: (1) in the request itself — JWT carries user identity. (2) in the database — durable, slowest. (3) in a fast cache — Redis sits between requests and the DB. The skill is choosing where each piece of state belongs based on access pattern, durability needs, and freshness tolerance." },
    ],
    codeExamples: [
      { title: "HTTP request shape", code: `// GET /api/users/1
// Authorization: Bearer eyJ...
// Accept: application/json

// Response
// HTTP/1.1 200 OK
// Content-Type: application/json
// Cache-Control: max-age=60
// {"id":1,"name":"Ada"}`, explanation: "Method + path + headers + body in both directions. The Cache-Control header alone shapes whether this trip happens at all next time." },
      { title: "Stateless via JWT", code: `// Login: POST /login {email, password}
//   → server validates, signs JWT with claims {sub, exp, role}
//   → returns token

// Subsequent requests:
// GET /api/orders
// Authorization: Bearer <jwt>
//   → server verifies HMAC signature
//   → reads claims directly — no DB lookup for session

// Trade-off: revocation is hard (use short TTLs + refresh tokens)`, explanation: "Token IS the session. Server stays stateless; horizontal scaling is trivial." },
      { title: "When stateless breaks", code: `// WebSocket connection — sticky to one server instance
// File upload in progress — request must hit the same box
// In-memory rate limit counter — invisible to other instances
//
// Solutions:
//   → Sticky load balancing (last resort)
//   → Move state to shared store (Redis for counters, S3 for uploads)
//   → Use connection-aware tooling (sidecars, service mesh)`, explanation: "Statelessness is an ideal. Real systems push state into shared resources rather than chase pure statelessness everywhere." },
    ],
    keyTakeaways: ["Client owns presentation; server owns durable shared state", "Stateless servers scale horizontally — any instance handles any request", "State lives in the request (JWT), the cache (Redis), or the DB", "Sticky sessions are a fallback — prefer pushing state to shared stores", "JWT trades easy revocation for trivial horizontal scaling"],
  },
  "systems-design:t1:rest-api": {
    nodeId: "systems-design:t1:rest-api", title: "REST APIs",
    sections: [
      { heading: "Resources, Verbs, And URLs", body: "REST treats things as resources at URIs. HTTP verbs map to actions: GET (read, idempotent), POST (create), PUT (replace, idempotent), PATCH (partial update), DELETE (remove, idempotent). Plural nouns: /users/123, not /getUser?id=123. Nested resources for relationships: /users/123/posts." },
      { heading: "Status Codes And Error Shape", body: "2xx success, 3xx redirect, 4xx client error, 5xx server error. 201 Created with a Location header on POST. 204 No Content on DELETE. 409 Conflict on duplicate or version mismatch. 422 Unprocessable Entity on validation failure. Return a consistent error JSON: {error: {code, message, details}} — clients parse it the same way every time." },
      { heading: "Pagination, Filtering, Versioning", body: "Cursor-based pagination beats offset at scale (offset gets slower as you go deep, and breaks under inserts). Use /resources?cursor=xyz&limit=20 with a next-cursor in the response. Versioning: /v1/users or Accept: application/vnd.example.v2+json. Pick one and stick with it; don't mix." },
    ],
    codeExamples: [
      { title: "REST endpoints for a blog", code: `GET    /users           # list (paginated)
GET    /users/123       # get one
POST   /users           # create   → 201 + Location: /users/124
PATCH  /users/123       # partial update
PUT    /users/123       # full replace
DELETE /users/123       # delete   → 204

GET    /users/123/posts # nested — Ada's posts
GET    /posts?author=123 # alternative — query param`, explanation: "Plural nouns. Both nested and query-param styles are valid; pick one per resource and stay consistent." },
      { title: "Status code cheat sheet", code: `200 OK             // success with body
201 Created        // POST that created a resource
204 No Content     // DELETE / PUT with no body to return
301 Moved Perm.    // permanent redirect (cacheable)
304 Not Modified   // conditional GET hit
400 Bad Request    // malformed (parse failed)
401 Unauthorized   // no/invalid auth
403 Forbidden      // authed but not allowed
404 Not Found
409 Conflict       // version mismatch / duplicate
422 Unprocessable  // validation failed
429 Too Many Req.  // rate limited
500 Server Error
503 Unavailable    // overloaded / maintenance`, explanation: "Pick the most specific. Clients act on the class (4xx = don't retry; 5xx + 503 = retry with backoff)." },
      { title: "Cursor pagination", code: `// Request
GET /posts?limit=20&cursor=eyJpZCI6OTk5OX0=

// Response
{
  "data": [ /* 20 posts */ ],
  "next_cursor": "eyJpZCI6OTk3OX0="  // base64-encoded { id: 9979 }
}

// vs offset (don't):
// page=50&limit=20 → server scans 1000 rows just to skip them
// And: a new insert shifts every page boundary`, explanation: "Encode 'where we left off' in the cursor. Stable under inserts, O(1) regardless of depth." },
    ],
    keyTakeaways: ["Resources at URIs; HTTP verbs for actions; plural nouns", "Idempotency: GET, PUT, DELETE safe to retry; POST and PATCH usually not", "201 + Location on POST; 204 on DELETE; 422 on validation", "Cursor pagination scales; offset doesn't", "Return consistent error JSON for predictable client handling"],
  },
  "systems-design:t1:design-process": {
    nodeId: "systems-design:t1:design-process", title: "Design Process",
    sections: [
      { heading: "From Requirements To Bottlenecks", body: "Senior interviews and real designs follow the same arc: (1) clarify requirements (functional and non-functional). (2) Back-of-envelope estimates (QPS, storage, bandwidth). (3) Define the API surface. (4) Sketch the data model. (5) Identify bottlenecks (read/write hot spots, big tables). (6) Address each bottleneck with cache, shard, queue, or async. Skip the math step and you're guessing." },
      { heading: "Functional vs Non-Functional Requirements", body: "Functional: what the system does. Non-functional: how well it does it — latency, availability, durability, security, cost. Most surprising design decisions come from non-functional. '99.99% uptime' or 'p99 < 100ms' or '11 nines durability' shapes the entire architecture more than the feature list." },
      { heading: "Identifying And Justifying Bottlenecks", body: "Bottlenecks come from three things: hot rows (one user accumulates 90% of writes), hot keys (one cache key gets 90% of reads), and big things (multi-TB tables, fan-outs of millions). For each one, name the problem and one mitigation. Articulating tradeoffs explicitly is what separates senior from staff in interviews." },
    ],
    codeExamples: [
      { title: "Twitter-scale back-of-envelope", code: `# Functional
# - Users post tweets, follow others, see a feed of followed tweets
#
# Non-functional
# - 100M DAU
# - p99 timeline read < 200ms
# - 99.95% read availability; 99.9% write
#
# Math
# - Writes: 100M × 3 posts/day = 300M/day = 3.5K avg / 35K peak QPS
# - Reads:  100M × 50 timeline checks = 5B/day = 60K avg / 600K peak QPS
# - Storage: 300 bytes/tweet × 300M/day ≈ 90 GB/day → ~33 TB/year
#
# Conclusion: 17:1 read/write skew → fan-out on write, cache reads`, explanation: "Numbers make the architecture concrete. Write them before drawing boxes." },
      { title: "Bottleneck table", code: `# | Component   | Issue                  | Mitigation                       |
# |-------------|------------------------|----------------------------------|
# | DB writes   | 35K peak               | Shard by user_id                 |
# | DB reads    | 600K peak (timelines)  | Pre-compute timelines (fan-out)  |
# | Storage     | 33 TB/year             | Tiered storage: hot SSD + cold S3|
# | Hot users   | celebrities (1M+ followers) | Fan-out on read for them    |
# | Media       | photos/video           | Object store + CDN               |
# | Feed gen    | 600K timeline reads    | Redis cache, TTL 1 min           |`, explanation: "Each bottleneck is named with a mitigation. Tradeoffs explicit." },
      { title: "Functional vs non-functional examples", code: `# Functional: 'Users can upload a profile picture'
#
# Non-functional implications:
# - Max size? (1 MB? 50 MB?)
# - Sync or async upload? (UX + scaling impact)
# - Where stored? (S3 + CDN, or DB? — durability and cost)
# - Image processing? (thumbnails sync vs async)
# - Moderation? (manual queue, ML scan, or none)
# - Privacy? (signed URLs, or public?)
#
# 6 design decisions hidden in 1 functional requirement.`, explanation: "Always pull on functional requirements until non-functionals fall out." },
    ],
    keyTakeaways: ["Clarify → estimate → API → data → bottlenecks → mitigations", "Non-functional requirements drive most architecture decisions", "Back-of-envelope math turns guesses into commitments", "Read/write ratio shapes caching and fan-out strategy", "Articulate bottlenecks explicitly with one mitigation each"],
  },

  // ── T2: Scaling Primitives ─────────────────────────────
  "systems-design:t2:caching": {
    nodeId: "systems-design:t2:caching", title: "Caching Strategies",
    sections: [
      { heading: "The Four Patterns", body: "Cache-aside (lazy loading): app reads cache; on miss, reads DB and populates. Read-through: cache fronts the DB transparently — app only talks to cache. Write-through: writes go to cache + DB simultaneously. Write-behind: writes go to cache; flushed to DB async. Cache-aside is the most common because it's the simplest mental model." },
      { heading: "Invalidation: The Hard Part", body: "Famously the second-hardest problem in CS. Three strategies: TTLs (eventual consistency, simple), explicit invalidation on writes (precise, app-coupled), write-through (always fresh, more expensive writes). Pick by tolerance for staleness — does showing 30-second-stale data hurt users, or not?" },
      { heading: "Stampedes And Hot Keys", body: "When a popular cache entry expires, every concurrent reader misses simultaneously and all hammer the DB — a stampede. Mitigations: probabilistic early expiration (refresh slightly before TTL with small probability), single-flight (only one coalesced fetch per key), or stale-while-revalidate (serve stale cache while refreshing in background). Hot keys (one user / object / IP getting 99% of traffic) need separate solutions: pre-warming, regional caching, or consistent hashing variants." },
    ],
    codeExamples: [
      { title: "Cache-aside read + write", code: `// Read
async function getUser(id) {
  const cached = await redis.get(\`user:\${id}\`);
  if (cached) return JSON.parse(cached);
  const user = await db.users.findOne({ id });
  await redis.set(\`user:\${id}\`, JSON.stringify(user), { ex: 300 });
  return user;
}

// Write
async function updateUser(id, patch) {
  await db.users.update({ id }, patch);
  await redis.del(\`user:\${id}\`);   // explicit invalidation
}`, explanation: "App owns the cache: populates on read miss, invalidates on write. Simple, predictable, what 80% of services do." },
      { title: "Stale-while-revalidate", code: `// Browser / CDN side
// Cache-Control: max-age=60, stale-while-revalidate=300
//
// 0–60s:    serve from cache (fresh)
// 60–360s:  serve stale immediately, refresh in background
// > 360s:   block on refresh
//
// Tradeoff: occasional staleness in exchange for zero p99 spikes`, explanation: "User never waits. The refresh happens out-of-band on the next request after expiry." },
      { title: "Probabilistic early expiration (XFetch)", code: `// Each get: with small probability tied to remaining TTL,
// treat the entry as expired and refresh, even though it's still valid.
const ttl = 300;        // seconds
const remaining = await redis.ttl(key);  // seconds left
const beta = 1.0;
const fetchTime = lastObservedFetchTime;
const eagerRefresh = -fetchTime * beta * Math.log(Math.random());
if (remaining < eagerRefresh) {
  // refresh now — likely still hot, but spread the load
}`, explanation: "Smears refresh load across many readers near expiry, instead of stampeding the DB at TTL=0." },
    ],
    keyTakeaways: ["Cache-aside is the default; the app owns the cache", "TTLs accept staleness for simplicity; explicit invalidation is precise but coupled", "Stampedes happen on hot-key expiry — mitigate with stale-while-revalidate or single-flight", "Hot keys need pre-warming / regional caches / consistent hashing", "Invalidation is the hardest part — design for staleness tolerance from day one"],
  },
  "systems-design:t2:load-balancing": {
    nodeId: "systems-design:t2:load-balancing", title: "Load Balancing",
    sections: [
      { heading: "Algorithms", body: "Round-robin: simple, ignores load. Least connections: send to instance with fewest active requests. Random: surprisingly competitive. Weighted variants account for instance size. Hashing (consistent hash on a header or IP) gives session affinity without sticky cookies." },
      { heading: "Layer 4 vs Layer 7", body: "L4 load balancers route on connections — fast, no inspection. L7 inspects HTTP — can route by URL/header, terminate TLS, do per-route health checks. L7 is what AWS ALB, Vercel, Cloudflare, and Nginx do for HTTP. L4 (NLB, HAProxy in TCP mode) is for non-HTTP or extreme throughput." },
      { heading: "Health Checks And Surge Behavior", body: "A good health check is fast, self-contained, and reflects readiness — not just liveness. Bad health checks cascade failures: if /health depends on the DB and the DB blips, every instance gets removed simultaneously and the LB has nothing to route to. Separate liveness (am I alive?) from readiness (am I ready to serve?) — Kubernetes formalized this; the same concept applies everywhere." },
    ],
    codeExamples: [
      { title: "Picking a strategy", code: `// Stateless web servers, similar request cost
//   → round-robin or random (boringly fine)
//
// Long-lived requests (uploads, websockets) or variable cost
//   → least connections (avoid overloading one instance)
//
// Need session affinity (rare with stateless apps; more common with WS)
//   → consistent hashing on user_id, or sticky cookies
//
// Mixed cost ALL the time (image resize + JSON API on same fleet)
//   → weighted, or just split into two fleets`, explanation: "Pick by request shape. Round-robin is the right answer 90% of the time." },
      { title: "Health endpoint discipline", code: `// /healthz — liveness — fast, self-contained, returns 200 if process alive
GET /healthz → 200 {"status":"alive"}

// /readyz — readiness — checks deps that, if down, mean we shouldn't serve
GET /readyz  → 200 {"status":"ready", "checks":{"db":"ok"}}
            or 503 {"status":"unready", "checks":{"db":"fail"}}

// /healthz NEVER touches the DB. Otherwise a DB blip = fleet evacuation`, explanation: "Two endpoints, two purposes. Conflating them causes outages." },
      { title: "Connection draining", code: `// Old way: instance shuts down → in-flight requests die → 502s
//
// Right way:
// 1. LB removes instance from rotation (no new requests)
// 2. Instance has, say, 30s to finish in-flight (drain period)
// 3. Instance receives SIGTERM, finishes, exits
// 4. Process supervisor reaps it
//
// In Kubernetes: preStop hook + terminationGracePeriodSeconds: 30`, explanation: "Without draining, every deploy causes p99 latency spikes." },
    ],
    keyTakeaways: ["Round-robin for stateless equal-cost; least-connections for variable", "L4 = connection routing; L7 = HTTP-aware routing", "Liveness ≠ readiness — they answer different questions", "Health checks must NOT depend on shared state (cascading failures)", "Connection draining matters — every deploy is an opportunity for 502s"],
  },
  "systems-design:t2:cdn": {
    nodeId: "systems-design:t2:cdn", title: "CDN & Edge",
    sections: [
      { heading: "Edge Caching", body: "A CDN caches your content at points-of-presence (PoPs) close to users. First request fetches from origin and caches. Subsequent requests in that PoP hit the edge — 10ms instead of 200ms cross-continent. CDNs also absorb traffic spikes and DDoS, freeing your origin to focus on dynamic work." },
      { heading: "Cache Headers Done Right", body: "Cache-Control: public, max-age=3600 — cache for an hour. immutable — never recheck. s-maxage=86400 — only for shared caches (CDN). ETag + If-None-Match — let the CDN/browser revalidate cheaply via 304. Vary specifies which request headers affect the response (e.g. Vary: Accept-Encoding for gzip)." },
      { heading: "Static, Dynamic, And Edge Compute", body: "Static assets (JS bundles, images) get year-long immutable caching with hashed filenames. Dynamic API responses get short TTLs or no cache. The middle ground — personalized but cacheable per-user — uses surrogate keys (Fastly) or cache tags (Vercel). Edge compute (Cloudflare Workers, Vercel Edge Functions) runs your code at the PoP — auth checks, A/B tests, geo-routing — without going back to origin." },
    ],
    codeExamples: [
      { title: "Static asset headers", code: `// Hashed filename: app.abc123.js
// Cache-Control: public, max-age=31536000, immutable
//
// max-age=31536000 → 1 year
// immutable → browsers never even revalidate
//
// Safe because: change the content → hash changes → new URL → cache miss
// → fresh fetch automatically.`, explanation: "Year-long cache + immutable + content-hashed filenames = ideal. Browsers and CDNs both cache; users never wait for a re-fetch unless something genuinely changed." },
      { title: "Different lifetimes for browser vs CDN", code: `// Cache-Control: public, max-age=60, s-maxage=600
// ETag: "v123"
//
// Browsers cache 60 seconds (max-age)
// CDN caches 10 minutes (s-maxage)
// Conditional GETs revalidate cheaply via ETag → 304 Not Modified
//
// Result: most of your traffic absorbed by the CDN; small percent
// hits origin to check freshness (304s, no body).`, explanation: "Public dynamic content — news headlines, popular product pages — is a great fit. CDN absorbs the load." },
      { title: "Cache tag invalidation", code: `// Vercel example
const res = NextResponse.json(post);
res.headers.set("Cache-Tag", \`post-\${post.id}\`);
return res;

// On update:
// revalidateTag(\`post-\${post.id}\`)
//   → CDN purges all responses tagged with that key,
//     across every PoP, in seconds.
//
// Same idea: Fastly surrogate keys, Cloudflare cache tags.`, explanation: "Tag-based purging beats path-based for fine-grained invalidation, especially when one logical entity appears at many URLs." },
    ],
    keyTakeaways: ["CDN caches near users — milliseconds, not cross-continent", "Cache-Control public + max-age + immutable for static assets", "s-maxage for CDN-only TTL; max-age for browser", "Cache tags / surrogate keys enable fine-grained purging", "Edge compute moves logic to the PoP — auth, A/B, geo-routing"],
  },

  // ── T3: Service Architecture ─────────────────────────
  "systems-design:t3:microservices": {
    nodeId: "systems-design:t3:microservices", title: "Microservices",
    sections: [
      { heading: "Service Boundaries", body: "Split by domain (bounded contexts), not by tech stack. A 'user service' owns user data; nobody else writes to its DB. Communication via APIs or events. Trade: independent deploys, scaling, and language choice — vs operational complexity, distributed-system failure modes, eventual consistency, and the hassle of cross-service queries. The hard part is finding the right boundaries; getting them wrong is worse than a monolith." },
      { heading: "Inter-Service Comms", body: "Synchronous (HTTP, gRPC): simple, tight coupling, cascading failures when downstream is slow. Asynchronous (queues, event streams, pub/sub): more resilient, eventually consistent, harder to reason about. Most real systems use both — sync for read paths, async for writes that fan out. Circuit breakers + timeouts + retries with exponential backoff prevent cascading collapse on the sync paths." },
      { heading: "Distributed Failure Modes", body: "The monolith fails as one unit. Microservices fail in N⁾ ways: partial failures (4 of 5 calls succeed, you have to decide what to do with that), retry storms (one slow service triggers retries that DOS its peers), idempotency gaps (the user clicked once, the system charged twice). The toolkit: timeouts everywhere, circuit breakers on dependencies, idempotency keys on writes, and observability that traces requests across services." },
    ],
    codeExamples: [
      { title: "Service boundary, by data ownership", code: `# User Service
# - Owns: users table (single writer)
# - Exposes: GET /users/:id, POST /users, ...
# - Subscribes to: nothing (it's the source of truth)
#
# Order Service
# - Owns: orders table
# - References: user_id (foreign concept, not foreign key in DB)
# - Calls User Service (sync) for hydration
#   OR subscribes to user.created events (async, denormalized cache)
#
# Notification Service
# - Owns: notifications table
# - Subscribes to: order.placed, payment.failed events
# - No sync calls — fully event-driven`, explanation: "One owner per data type. Other services either call sync or denormalize via events." },
      { title: "Circuit breaker pattern", code: `class CircuitBreaker:
    def __init__(self, threshold=5, reset_time=30):
        self.state = "closed"  # closed → open → half-open → closed
        self.failures = 0
        self.threshold = threshold
        self.opened_at = None

    def call(self, fn):
        if self.state == "open":
            if time.time() - self.opened_at > self.reset_time:
                self.state = "half-open"
            else:
                raise CircuitOpenError()
        try:
            result = fn()
            if self.state == "half-open":
                self.state = "closed"
                self.failures = 0
            return result
        except Exception:
            self.failures += 1
            if self.failures >= self.threshold:
                self.state = "open"
                self.opened_at = time.time()
            raise`, explanation: "Stop calling a failing dependency. Periodically test recovery. Saves the dependency from retry storms and the caller from hanging." },
      { title: "Idempotency keys", code: `// Client generates a unique key per logical operation
POST /payments
Idempotency-Key: ord_abc123_attempt_1
{ amount: 100, ... }

// Server stores the key + result on first success
// Subsequent retries with the same key return the cached result
// — no double-charge even if the network ate the original response`, explanation: "Distributed systems retry. Idempotency keys are how you make 'exactly once' practical from 'at least once' delivery." },
    ],
    keyTakeaways: ["Split by domain; one owner per data type", "Sync (HTTP/gRPC): simple, fragile under load", "Async (queues, events): resilient, eventually consistent", "Always: timeouts, circuit breakers, retries with backoff", "Idempotency keys turn at-least-once into practical exactly-once"],
  },
  "systems-design:t3:queues": {
    nodeId: "systems-design:t3:queues", title: "Message Queues",
    sections: [
      { heading: "Why Async Decoupling Wins", body: "Queue decouples producer from consumer. Producer enqueues a message, returns fast — the user doesn't wait. Worker pulls and processes at its own rate. Failures are isolated: if the worker crashes, messages stay in queue; if the producer is overloaded, the queue absorbs the spike. Backpressure is built in: a backed-up queue is a signal — alert and scale workers." },
      { heading: "Delivery Guarantees", body: "At-most-once: fast, may lose messages. At-least-once: may duplicate (need idempotent consumers). Exactly-once: rare and costly — usually achieved as at-least-once + idempotent consumers. Most modern queues default to at-least-once. Dead-letter queues catch poison messages — ones that fail repeatedly and would otherwise jam the queue forever." },
      { heading: "Queues vs Streams", body: "Queue (SQS, RabbitMQ): consumer pulls one message, acks, message gone. Multiple consumers compete for messages. Stream (Kafka, Kinesis): consumers read by offset, messages stay in the log, multiple consumers see the same stream independently. Use queues for work distribution; use streams for event sourcing, audit logs, and fan-out to many independent consumers." },
    ],
    codeExamples: [
      { title: "Producer + worker pattern", code: `# Web request — enqueue, respond fast
@app.post("/upload")
def upload(file):
    job_id = str(uuid4())
    queue.publish({
        "job_id": job_id,
        "file_url": file.url,
        "user_id": current_user().id,
    })
    return {"job_id": job_id}, 202   # accepted

# Worker — process async
def worker():
    while True:
        msg = queue.consume(timeout=30)
        if not msg: continue
        try:
            process(msg)
            queue.ack(msg)
        except RetryableError:
            queue.nack(msg, requeue=True)  # back to queue
        except Exception:
            queue.nack(msg, requeue=False) # → DLQ
            log_to_dlq(msg)`, explanation: "Web responds in milliseconds. Workers process at their own pace. Errors go to DLQ for human inspection." },
      { title: "Idempotent consumer", code: `def process(msg):
    # idempotency key on the message itself, or hash of payload
    if already_processed(msg.id):
        return  # safe to skip — already done
    do_the_work(msg)
    mark_processed(msg.id)

# already_processed and mark_processed live in a fast store —
# Redis with a long TTL, or a dedup table.
# At-least-once delivery + idempotent consumer = practical exactly-once.`, explanation: "The consumer is the deduplication boundary. Always assume at-least-once delivery." },
      { title: "Queue vs Stream choice", code: `# Process orders one-by-one, retry on failure → queue (SQS)
#   - One worker per message; ack-on-success
#   - Messages disappear after consumption
#
# Audit log of every order event, multiple consumers
# (analytics, fraud, fulfillment, search-index) → stream (Kafka)
#   - Messages stay in the log; each consumer tracks its own offset
#   - Replay is trivial; new consumers can read from start
#
# Rule of thumb: 'one worker handles each message' = queue
#                'many consumers see each message' = stream`, explanation: "Pick by ownership: one consumer per message vs many. Streams cost more but enable replay and independent consumers." },
    ],
    keyTakeaways: ["Queues decouple producer rate from consumer rate", "At-least-once + idempotent consumer = practical exactly-once", "DLQ catches poison messages — alert when it grows", "Streams (Kafka) keep messages around; queues (SQS) discard after ack", "Long queue = scale workers up (or back off producers)"],
  },

  // ── T4: Distributed Systems ──────────────────────────
  "systems-design:t4:cap": {
    nodeId: "systems-design:t4:cap", title: "CAP & Consistency Models",
    sections: [
      { heading: "CAP Theorem", body: "In a distributed system that must tolerate network partitions, you can have either Consistency or Availability — not both during a partition. Most real systems are CP (relational DBs with single primary) or AP (Dynamo, Cassandra). The 'pick 2' framing is misleading: partitions WILL happen, so what you're really choosing is how you respond when they do — refuse writes (CP) or accept potentially-conflicting writes (AP)." },
      { heading: "Beyond Strong vs Eventual", body: "Strong consistency: every read sees the most recent write. Eventual consistency: replicas converge given no new writes — but at any moment, reads may diverge. Between them: causal consistency (preserves cause-effect order), read-your-writes (a client's own writes are visible immediately), monotonic reads (you never see time go backward). Pick the weakest model that your UX tolerates — stronger costs more." },
      { heading: "Quorums Tune CAP", body: "Many AP systems are tunable. With N replicas, write quorum W and read quorum R: if W + R > N, every read sees the latest write (strong consistency). If W + R ≤ N, you may read stale (eventual). Cassandra, DynamoDB, Riak all expose this knob. Common settings: N=3, W=2, R=2 (strong, slower) or N=3, W=1, R=1 (fast, eventual)." },
    ],
    codeExamples: [
      { title: "AP (Cassandra-flavor)", code: `// Tunable quorum
// N = 3 replicas
// W = 1 (write to 1, ack immediately) → fast
// R = 1 (read from 1) → fast, may be stale
//
// Or:
// W = 3, R = 3 → strong consistency (W+R > N)
//   but: latency = slowest replica; availability suffers if any down
//
// Or compromise:
// W = 2, R = 2 → strong (W+R=4 > N=3) with one replica's worth
// of redundancy for read and write.`, explanation: "Per-call tuning. Most reads can be eventual; critical writes use stronger settings." },
      { title: "CP (relational, single-primary)", code: `// Single primary + N replicas
// All writes go to primary; replicas async-follow
// Reads from primary → strongly consistent
// Reads from replicas → eventually consistent (replication lag)
//
// On primary failure → failover (brief unavailability while electing new primary)
// On partition → minority side becomes read-only or refuses (CP choice)
//
// Postgres, MySQL, SQL Server work this way by default.`, explanation: "Strong consistency by routing all writes through the primary. Pay with availability under partition." },
      { title: "Why eventual is fine for most things", code: `// 'My profile photo changed' — eventual is fine
// 'My follower count' — eventual is fine
// 'My bank balance' — strong required
// 'My shopping cart contents' — eventual usually fine; strong at checkout
// 'My posted message ordering' — causal at minimum (don't show
//   my reply before the original)
//
// Map UX requirements to consistency tier per operation, not globally.`, explanation: "Most user-facing reads tolerate seconds of staleness. Save strong consistency for the few that don't." },
    ],
    keyTakeaways: ["CAP: under partition, choose Consistency OR Availability", "Most systems are CP or AP; partition tolerance is mandatory", "Eventual consistency: replicas converge over time", "Quorums (W + R > N) tune AP toward strong", "Pick the weakest model your UX tolerates — stronger is more expensive"],
  },
  "systems-design:t4:sharding": {
    nodeId: "systems-design:t4:sharding", title: "Sharding & Partitioning",
    sections: [
      { heading: "Strategies", body: "Range: split by sorted key range (good for range queries, bad for hot ranges). Hash: hash(key) % N — even distribution, kills range queries. Geographic: by region — good for data-residency laws and latency. Consistent hashing: minimizes data movement when adding/removing nodes; used by DynamoDB, Cassandra, memcached clusters." },
      { heading: "Picking A Shard Key", body: "The shard key is the most important decision. It must distribute writes evenly (or you get hot shards), enable common queries without scatter-gather (querying across all shards is O(shards)), and not need to change (rebalancing is an operation you avoid). Bad shard keys: low-cardinality (status, country), monotonic (timestamp). Good: user_id with high cardinality." },
      { heading: "Hot Shards And Resharding", body: "Hot shards from skewed distribution: 1% of users generate 90% of writes. Mitigations: sub-shard hot keys (shard by (user_id, bucket) where bucket spreads writes), pre-shard hot accounts, or surface hot users to a separate cluster. Resharding is a major operation: plan for it from day one — pick a strategy that allows future re-balancing. Consistent hashing makes adding nodes cheap; range/hash-mod sharding does not." },
    ],
    codeExamples: [
      { title: "Hash sharding", code: `def shard_for(user_id, num_shards=16):
    # Use a stable hash, not Python's built-in hash() (randomized per process)
    return zlib.crc32(user_id.encode()) % num_shards

# Pros: even distribution
# Cons: range queries become scatter-gather across all 16 shards
#       adding shards = re-hash everything (modulo bias)`, explanation: "Even distribution; bad for range queries; painful to rebalance." },
      { title: "Consistent hashing intuition", code: `# Map nodes and keys to a ring [0, 2^32)
# Each key goes to the next node clockwise on the ring.
# Adding a new node only steals keys from one neighbor.
# Removing a node redistributes its keys to the next clockwise node.
#
# Practical detail: virtual nodes — each physical node maps to many
# points on the ring. This evens out distribution and limits the
# blast radius of any one node going down.
#
# Used by: DynamoDB, Cassandra, memcached client libraries, Akka cluster.`, explanation: "Adding the (N+1)th node moves only ~1/N of keys, not all of them. The reason this scheme dominates production sharding." },
      { title: "Sub-sharding hot keys", code: `# Without sub-sharding:
# user_id = celebrity_001
# shard = hash(celebrity_001) % 16  → always shard 7
# 1M follower events / sec all hit shard 7 → meltdown
#
# With sub-sharding:
# shard_key = (user_id, bucket)
# bucket = random 0..15 per write
# shard = hash(shard_key) % 16  → distributed across all 16
#
# Read side: scatter-gather across 16 buckets and merge.
# Cost: reads slower, but writes parallelized. Worth it for hot users.`, explanation: "Trade read complexity for write parallelism on hot shards. Used by Twitter for celebrity timelines." },
    ],
    keyTakeaways: ["Range, hash, geographic, consistent — pick by access pattern", "Shard key choice is the highest-leverage decision in a sharded system", "Hot shards from skewed keys — sub-shard or surface to separate cluster", "Cross-shard queries are slow; design to avoid", "Consistent hashing minimizes data movement on resize"],
  },

  // ── T5: Design Case Studies ──────────────────────────
  "systems-design:t5:url-shortener": {
    nodeId: "systems-design:t5:url-shortener", title: "Design: URL Shortener",
    sections: [
      { heading: "Requirements", body: "Functional: shorten a URL to a 6–7 char code; redirect short → long; track clicks per short URL. Non-functional: 100M shortens/month (~40 writes/sec average), 10x reads vs writes, p99 redirect < 50ms, 99.99% availability for redirects. The system is read-heavy and the redirect path must be brutally fast." },
      { heading: "ID Generation", body: "Three options. (1) Hash the URL with truncation — collisions need to be detected. (2) Counter — auto-increment then base62-encode. Predictable but enumerable. (3) Random base62 codes generated up-front in a pool. Counter wins for most cases: simple, no collision check on write, distributable via ranges (each shard claims 100K IDs at a time)." },
      { heading: "Architecture", body: "Write path: API → DB write (long URL + short code). Read path: edge cache or CDN → app → DB. Most short URLs become hot (someone tweets it, viral) — Redis cache is critical. For analytics, log clicks asynchronously to a queue → stream → data warehouse; never block the redirect on analytics." },
    ],
    codeExamples: [
      { title: "Counter-based ID with base62", code: `BASE62 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"

def encode(n: int) -> str:
    if n == 0: return "0"
    out = []
    while n:
        out.append(BASE62[n % 62])
        n //= 62
    return "".join(reversed(out))

# decode is the inverse
# Counter at 1B → "1Mu1QM" (6 chars). 62^6 = 56B unique codes.`, explanation: "62^6 ≈ 56B codes in 6 chars. Plenty of headroom. Distribute the counter via ranges per shard." },
      { title: "Read path with cache", code: `async def redirect(short: str):
    cached = await redis.get(f"u:{short}")
    if cached:
        log_click_async(short)
        return Response(307, location=cached)

    long = await db.urls.find_one({"short": short})
    if not long:
        return Response(404)

    # populate cache; long TTL since URLs rarely change
    await redis.set(f"u:{short}", long.url, ex=86400)
    log_click_async(short)
    return Response(307, location=long.url)`, explanation: "Cache hit returns in ~1ms. log_click_async fires-and-forgets to a queue. Redirect path stays under 50ms even on cache miss." },
      { title: "Async click logging", code: `# Don't write to clicks table on every redirect — that's 400 writes/sec
# AND it kills the redirect's latency budget.
#
# Instead:
# 1. Redirect path: enqueue {short, ts, ip_hash} to Kafka
# 2. Stream consumer batches writes to clicks table (every 1s or 1000 events)
# 3. Periodic job aggregates per-day counts to a metrics table
# 4. UI reads aggregated numbers, not raw clicks
#
# Bonus: streaming click events to a data warehouse for analytics`, explanation: "Separation: hot path stays fast; analytics is best-effort. The user-facing redirect doesn't suffer from analytics infra." },
    ],
    keyTakeaways: ["Read-heavy: cache aggressively (Redis with long TTL)", "Counter + base62 beats hashing for ID generation in most cases", "Distribute the counter via ranges per shard (or via Snowflake-style IDs)", "Click analytics goes async — never block the redirect on it", "URL → short mapping rarely changes — cache TTL can be long (days)"],
  },
  "systems-design:t5:news-feed": {
    nodeId: "systems-design:t5:news-feed", title: "Design: News Feed",
    sections: [
      { heading: "Requirements", body: "Functional: users follow others; their feed shows recent posts from followed accounts; pull-to-refresh, infinite scroll. Non-functional: 100M DAU, fast feed loads (p99 < 200ms), 17:1 read/write ratio (60K reads/sec, 3.5K writes/sec). The hard part is the feed-generation strategy." },
      { heading: "Fan-Out On Write vs Read", body: "Fan-out on write (push): when a user posts, push the post into every follower's pre-computed feed (in Redis). Reads are O(1) — fetch the feed list. Costs: writes scale with follower count. A celebrity with 1M followers means 1M writes per post. Fan-out on read (pull): on feed load, query posts from all N followed accounts and merge. Reads scale with following count; writes are constant. Best is hybrid: fan-out on write for normal users; fan-out on read for celebrities (>10K followers)." },
      { heading: "Storage Layout", body: "Posts in a sharded table by user_id (writes parallel; user-history reads stay on one shard). Pre-computed feeds in Redis (sorted set per user, score = timestamp, member = post_id, capped at ~500 entries). Hydrate post bodies from posts table (cached in Redis with longer TTLs). The feed's just a list of IDs; bodies fetched on demand." },
    ],
    codeExamples: [
      { title: "Hybrid fan-out", code: `def post(user_id, content):
    post_id = create_post(user_id, content)

    if is_celebrity(user_id):
        # Don't fan out — followers will pull on read
        return post_id

    # Fan out to followers' feeds
    follower_ids = get_followers(user_id)  # bounded by celebrity threshold
    for follower in batches(follower_ids, 1000):
        # Add to Redis sorted set, capped at 500
        redis.pipeline_zadd(
            [(f"feed:{f}", time.time(), post_id) for f in follower]
        )
        redis.pipeline_zremrangebyrank(
            [(f"feed:{f}", 0, -501) for f in follower]
        )
    return post_id`, explanation: "Pre-compute feeds for normal users. Skip celebrities — their followers pull on read." },
      { title: "Feed read with hybrid hydration", code: `def get_feed(user_id, limit=20, before_ts=None):
    # 1. Pull pre-computed feed (regular users' posts)
    feed_post_ids = redis.zrevrangebyscore(
        f"feed:{user_id}",
        max=before_ts or "+inf", min="-inf",
        start=0, num=limit
    )

    # 2. Pull recent posts from celebrities you follow
    celebs = get_followed_celebrities(user_id)
    celeb_post_ids = []
    for c in celebs:
        celeb_post_ids.extend(get_recent_post_ids(c, before_ts, limit))

    # 3. Merge and sort by timestamp
    all_ids = sorted(
        feed_post_ids + celeb_post_ids,
        key=post_timestamp, reverse=True
    )[:limit]

    # 4. Hydrate post bodies from cache/DB
    return hydrate_posts(all_ids)`, explanation: "Hybrid load: pre-computed for normal users + on-the-fly for celebrities. Hydration done once at the edge." },
      { title: "Why this scales", code: `# Average follower count: 200
# Average following count: 200
# 1 post → 200 fan-out writes (cheap, async)
# 1 feed read → 1 Redis ZRANGE call → ~1ms
#
# Celebrity (1M followers) post: 0 fan-out writes (skipped)
# Their followers pull on read: get_recent(celeb_id) — also indexed
#
# Storage: 500 entries × 100M users × 8 bytes/id ≈ 400 GB Redis
# (split across many Redis nodes; sharded by user_id)`, explanation: "The math works because most users have <10K followers (no celebrity tax), and feeds are bounded (no unbounded growth)." },
    ],
    keyTakeaways: ["Pre-compute feeds (fan-out on write) for fast reads at user scale", "Skip fan-out for celebrities (>10K followers) — pull on read", "Cap feed length (~500) to bound Redis memory", "Hydrate post bodies separately, with their own cache", "Posts table sharded by user_id; feeds split across Redis nodes"],
  },
  "systems-design:t5:chat": {
    nodeId: "systems-design:t5:chat", title: "Design: Chat",
    sections: [
      { heading: "Requirements", body: "Functional: 1:1 and group chat; message delivery with read receipts; presence (online/offline); message history. Non-functional: <500ms delivery latency, message durability (no losses), high concurrency (millions of open connections). The defining constraints are persistent connections and ordered delivery within a conversation." },
      { heading: "Connection Architecture", body: "WebSocket connections persist for the life of the user's session — millions concurrent. Sticky load balancing isn't enough at this scale; use a connection-aware tier (WS gateways) that route by session, with a pub/sub backplane (Redis pub/sub or Kafka) connecting them. When user A sends to user B, A's gateway publishes to a topic; B's gateway is subscribed and pushes down its WebSocket. No direct gateway-to-gateway routing required." },
      { heading: "Message Storage And Ordering", body: "Conversations are append-only logs. Use a per-conversation ID space (sequence numbers within a conversation), not global. Storage: Cassandra or DynamoDB partitioned by conversation_id, sorted by sequence number. For each message: store, then push to recipients via the WS backplane. If a recipient is offline, queue for delivery on reconnect (or rely on read-on-history fetch)." },
    ],
    codeExamples: [
      { title: "Send path", code: `async def send_message(sender_id, conversation_id, body):
    # 1. Allocate sequence number for this conversation (atomic)
    seq = await db.incr(f"conv:{conversation_id}:seq")

    # 2. Persist
    msg = {
        "conversation_id": conversation_id,
        "seq": seq,
        "sender_id": sender_id,
        "body": body,
        "ts": time.time(),
    }
    await db.messages.insert(msg)

    # 3. Push to online recipients via pub/sub
    recipients = await db.conversations.members(conversation_id)
    for r in recipients:
        if r != sender_id:
            await redis.publish(f"user:{r}", msg)

    # 4. Mark for offline delivery (reads from history on reconnect)
    return msg`, explanation: "Persist first, then push. If push fails, recipient sees the message on reconnect via /history endpoint." },
      { title: "Connection routing", code: `# Gateway A holds WS connection for user_x
# Gateway B holds WS connection for user_y
#
# Send: x → "hi" → y
#
# 1. Gateway A receives the message over WS
# 2. Gateway A persists to message store (or hands off to message service)
# 3. Gateway A publishes to Redis: PUBLISH user:y { msg }
# 4. Gateway B is SUBSCRIBED to user:y (because user_y is connected to it)
# 5. Gateway B receives the publish, looks up y's WS, sends down
#
# Gateways don't need to know about each other — Redis pub/sub does the routing`, explanation: "Pub/sub is the connection-routing fabric. Adding gateways is trivial; they just subscribe to their connected users' topics." },
      { title: "Presence", code: `# On WS connect:
# SET user:x:online "1" EX 60
# Subscribe to user:x for incoming messages

# Heartbeat every 30s:
# EXPIRE user:x:online 60

# On disconnect:
# DEL user:x:online

# Querying presence:
# EXISTS user:x:online → 1 if online

# Pros: simple, naturally times out on dropped connections
# Cons: TTL imprecision (~60s window after a clean disconnect)
# For chat presence, that's fine.`, explanation: "TTL-based presence is imprecise but correct — and survives gateway crashes naturally." },
    ],
    keyTakeaways: ["WS gateways + pub/sub backplane (Redis or Kafka) routes connections", "Per-conversation sequence numbers — never global", "Persist before push; offline recipients fetch on reconnect", "Storage partitioned by conversation_id, sorted by seq", "Presence via TTL keys — imprecise but robust"],
  },
  "systems-design:t5:rate-limiter": {
    nodeId: "systems-design:t5:rate-limiter", title: "Design: Rate Limiter",
    sections: [
      { heading: "Algorithms", body: "Token bucket: bucket holds N tokens, refills at R per second; each request takes a token. Smooth, allows bursts up to N. Leaky bucket: queue with constant-rate drain. No bursts. Fixed window: count requests per minute, reset on the minute. Simple but bursty across boundaries. Sliding window log: timestamp every request, count those in the last 60s. Precise but memory-heavy. Sliding window counter: weighted blend of current and previous fixed window. Cheap and accurate enough." },
      { heading: "Where To Enforce", body: "Edge: cheapest — drop bad traffic before it hits your apps. CDN/WAF can rate limit per IP. App tier: per-user, per-API-key, per-endpoint. Most precise. Database: last-line defense. Combine layers: gross rate limit at edge (1K req/sec per IP), fine-grained at app (100 req/min per API key on /search)." },
      { heading: "Distributed State", body: "Per-instance counters undercount with N instances. Centralize state in Redis: INCR with EXPIRE. Or use sliding-window with sorted sets (ZADD timestamp; ZREMRANGEBYSCORE; ZCARD). Token bucket distributed via Lua scripts for atomicity. Trade-off: every check is a Redis round-trip — ~1ms. Most APIs can afford that." },
    ],
    codeExamples: [
      { title: "Token bucket in Redis", code: `LIMITER_LUA = """
local key = KEYS[1]
local now = tonumber(ARGV[1])
local rate = tonumber(ARGV[2])
local capacity = tonumber(ARGV[3])
local cost = tonumber(ARGV[4])

local data = redis.call('HMGET', key, 'tokens', 'ts')
local tokens = tonumber(data[1]) or capacity
local ts = tonumber(data[2]) or now

local elapsed = now - ts
tokens = math.min(capacity, tokens + elapsed * rate)

if tokens < cost then
  return 0  -- denied
end

tokens = tokens - cost
redis.call('HMSET', key, 'tokens', tokens, 'ts', now)
redis.call('EXPIRE', key, 3600)
return 1  -- allowed
"""

# Atomic: read tokens, refill, debit, write back — all in Redis`, explanation: "Lua makes the read-modify-write atomic, avoiding race conditions across hundreds of app instances." },
      { title: "Sliding window counter", code: `def allowed(user_id, limit_per_min=60, now=None):
    now = now or time.time()
    cur_window = int(now // 60)
    prev_window = cur_window - 1

    cur_count = redis.get(f"rl:{user_id}:{cur_window}") or 0
    prev_count = redis.get(f"rl:{user_id}:{prev_window}") or 0

    # weight previous window by remaining seconds in current window
    weight = (60 - (now - cur_window * 60)) / 60
    estimated = int(cur_count) + int(prev_count) * weight

    if estimated >= limit_per_min:
        return False

    pipe = redis.pipeline()
    pipe.incr(f"rl:{user_id}:{cur_window}")
    pipe.expire(f"rl:{user_id}:{cur_window}", 120)
    pipe.execute()
    return True`, explanation: "Two cheap counters approximate a true sliding window. Memory is O(2 * users) not O(requests)." },
      { title: "Layered rate limiting", code: `# Layer 1: WAF/CDN — drop obviously-bad traffic
#   - 1000 req/min per IP
#   - Block known bad ranges
#
# Layer 2: API gateway — coarse per-key
#   - 10K req/min per API key total
#   - Different limits per tier (free: 60/min, paid: 6000/min)
#
# Layer 3: App tier — fine per-endpoint
#   - 10/min per user on /search (expensive)
#   - 1000/min per user on /messages (cheap)
#
# Headers returned:
# X-RateLimit-Limit: 60
# X-RateLimit-Remaining: 12
# X-RateLimit-Reset: 1700000060
# Retry-After: 30 (on 429)`, explanation: "Layer in order of cost: WAF first (cheapest to drop), app last (most context). Always return rate-limit headers — clients depend on them." },
    ],
    keyTakeaways: ["Token bucket: smooth + bursty. Sliding window counter: cheap + accurate enough", "Centralize counters in Redis (Lua scripts for atomicity)", "Layer enforcement: edge → gateway → app", "Always return X-RateLimit-* headers and Retry-After on 429", "Per-user, per-key, per-endpoint — different limits for different costs"],
  },
  "systems-design:t5:distributed-counter": {
    nodeId: "systems-design:t5:distributed-counter", title: "Design: Distributed Counter",
    sections: [
      { heading: "The Problem", body: "Count something fast — likes on a post, views on a video, votes in real-time. Naive INSERT INTO counts ... INCR locks the row; with 100K writes/sec on a hot row you get a meltdown. The technique: shard the counter, write to random shards, read by summing." },
      { heading: "Shard Counters", body: "Replace one counter row with N shard rows (counts(post_id, shard_id, count)). Writes pick a random shard and increment. Reads sum across shards: SELECT SUM(count) WHERE post_id=X. Trade: write contention drops by N×; reads cost N×. Pick N to balance: N=10–100 is typical. Hot rows can have higher N; cold rows can have N=1." },
      { heading: "Eventual Consistency And Caching", body: "Display counts often don't need exact precision. Cache the summed count in Redis with short TTL (10s). Reads serve cached; writes increment a shard AND increment the cache (or invalidate, accept a stale read). For highest scale, batch writes: app instances buffer increments locally, flush every second. The user gets approximate counts that converge to exact within seconds — fine for UX." },
    ],
    codeExamples: [
      { title: "Shard-counter primitives", code: `# Schema
# counts (post_id, shard_id, count, primary key (post_id, shard_id))
#
# Write
def increment(post_id):
    shard = random.randint(0, NUM_SHARDS - 1)
    db.execute("""
        INSERT INTO counts (post_id, shard_id, count)
        VALUES (?, ?, 1)
        ON CONFLICT (post_id, shard_id)
        DO UPDATE SET count = counts.count + 1
    """, post_id, shard)
#
# Read
def get_count(post_id):
    rows = db.execute("SELECT count FROM counts WHERE post_id = ?", post_id)
    return sum(r.count for r in rows)`, explanation: "N shards = N× lower contention on writes; N× rows on read. Acceptable when read frequency << write frequency." },
      { title: "With Redis cache", code: `def get_count(post_id):
    cached = redis.get(f"count:{post_id}")
    if cached:
        return int(cached)
    actual = db_sum_shards(post_id)
    redis.set(f"count:{post_id}", actual, ex=10)
    return actual

def increment(post_id):
    db_increment_random_shard(post_id)
    # update cache eagerly (or just delete — next read repopulates)
    redis.incr(f"count:{post_id}")`, explanation: "Cache absorbs read traffic. INCR keeps cache in step with most writes; periodic re-read corrects drift." },
      { title: "Local batching for extreme scale", code: `# In-process buffer (per app instance)
class LocalCountBuffer:
    def __init__(self, flush_interval=1.0):
        self.buf = collections.defaultdict(int)
        threading.Timer(flush_interval, self.flush).start()

    def incr(self, post_id, n=1):
        self.buf[post_id] += n

    def flush(self):
        if not self.buf: return
        snapshot, self.buf = self.buf, collections.defaultdict(int)
        for post_id, count in snapshot.items():
            db_add_to_random_shard(post_id, count)
        threading.Timer(1.0, self.flush).start()

# Per-second flush. Each app instance does ~1 DB write per active post per second
# regardless of in-memory increment rate.`, explanation: "Trades: ~1s of count loss on app crash for orders-of-magnitude lower DB pressure. Acceptable for like/view counters." },
    ],
    keyTakeaways: ["One row + INCR doesn't scale — shard the counter", "N shards = N× lower write contention; reads sum across shards", "Cache the sum in Redis with short TTL — most reads never hit DB", "For extreme scale, batch increments per app instance (~1s flush)", "Eventual consistency on counters is fine for UX (likes, views)"],
  },
};
