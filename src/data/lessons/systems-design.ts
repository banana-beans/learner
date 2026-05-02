import type { LessonContent } from "./python-basics";

export const systemsDesignLessons: Record<string, LessonContent> = {
  "systems-design:t1:client-server": {
    nodeId: "systems-design:t1:client-server", title: "Client-Server Model",
    sections: [
      { heading: "Request-Response", body: "Client sends a request; server processes it and returns a response. Synchronous (HTTP) or async (queues). The client owns presentation and short-lived state; the server owns durable state and shared logic." },
      { heading: "Statelessness", body: "Stateless servers don't remember anything between requests. Easier to scale: any server instance can handle any request. Session state lives in cookies/JWT (signed) or in a shared store (Redis, DB)." },
    ],
    codeExamples: [
      { title: "HTTP request shape", code: `// GET /api/users/1
// Authorization: Bearer ...
// Accept: application/json

// Response
// HTTP/1.1 200 OK
// Content-Type: application/json
// {"id":1,"name":"Ada"}`, explanation: "Method + path + headers + (optional) body. Response status + headers + body." },
      { title: "Stateless via JWT", code: `// Client gets JWT after login
// Client includes Authorization: Bearer <jwt> on every request
// Server verifies signature, reads claims — no server-side session lookup`, explanation: "Token holds the identity. Server stays stateless. Trade-off: revocation is harder." },
    ],
    keyTakeaways: ["Client = presentation; server = durable state + shared logic", "Stateless servers scale horizontally", "Session state: cookies/JWT or shared store (Redis)", "HTTP is the dominant protocol — request/response with headers"],
  },
  "systems-design:t1:rest-api": {
    nodeId: "systems-design:t1:rest-api", title: "REST APIs",
    sections: [
      { heading: "Resources and Verbs", body: "REST treats things as resources at URIs. Verbs map to actions: GET (read), POST (create), PUT (replace), PATCH (partial update), DELETE. Use plural nouns: /users/123, not /getUser?id=123." },
      { heading: "Status Codes and Pagination", body: "2xx success, 3xx redirect, 4xx client error, 5xx server error. 201 Created with Location header on POST. 204 No Content on DELETE. Paginate with limit + cursor (next page token) or limit + offset (worse at scale)." },
    ],
    codeExamples: [
      { title: "REST endpoints", code: `GET    /users           # list
GET    /users/123       # get one
POST   /users           # create
PATCH  /users/123       # partial update
DELETE /users/123       # delete

GET    /users/123/posts # nested resource`, explanation: "Plural nouns; nested resources expose relationships." },
      { title: "Status codes", code: `200 OK            // success
201 Created       // POST that created a resource
204 No Content    // success, no body (DELETE)
400 Bad Request   // client sent garbage
401 Unauthorized  // no/invalid auth
403 Forbidden     // authed but not allowed
404 Not Found
409 Conflict      // version conflict, duplicate
422 Unprocessable // validation failed
500 Server Error`, explanation: "Pick the most specific code; clients act on the class (4xx vs 5xx)." },
    ],
    keyTakeaways: ["Resources at URIs; HTTP verbs for actions", "Plural nouns: /users/123, not /getUser?id=", "201 + Location header on POST", "Cursor-based pagination beats offset at scale"],
  },
  "systems-design:t1:design-process": {
    nodeId: "systems-design:t1:design-process", title: "Design Process",
    sections: [
      { heading: "From Requirements To Bottlenecks", body: "(1) Clarify requirements (what + scale). (2) Back-of-envelope estimates (QPS, storage). (3) API surface. (4) Data model. (5) Identify bottlenecks (read/write hot spots, big tables). (6) Address them: cache, shard, queue, async." },
      { heading: "Functional vs Non-Functional", body: "Functional: what the system does. Non-functional: how well it does it (latency, availability, durability, security). Most surprising design decisions come from non-functional requirements — '99.99% uptime' or '< 100ms p99' shapes the architecture." },
    ],
    codeExamples: [
      { title: "Back-of-envelope", code: `# Tweet-like service:
# 100M DAU × 3 posts/day = 300M posts/day
# = ~3,500 writes/sec average; ~10x peak = 35,000 writes/sec
# 100M DAU × 100 reads/day = 10B reads/day
# = ~115,000 reads/sec average

# Storage per post: 300 bytes × 300M = ~90 GB/day = ~33 TB/year
# Conclusion: read-heavy + lots of storage`, explanation: "Numbers make trade-offs concrete. Write before designing." },
      { title: "Bottleneck table", code: `# | Component | Issue                | Mitigation                      |
# | DB writes | 35K/sec peak         | Sharding by user_id            |
# | DB reads  | 115K/sec             | Read replicas + cache           |
# | Storage   | 33 TB/year           | Tiered storage, archival        |
# | Hot users | celebrities          | Fan-out on write vs on read     |`, explanation: "Articulate each bottleneck and your plan. Interviewer-friendly format." },
    ],
    keyTakeaways: ["Clarify requirements + scale before drawing boxes", "Estimate QPS and storage with back-of-envelope math", "Non-functional requirements drive architecture", "Identify bottlenecks; have a mitigation per one"],
  },
  "systems-design:t2:caching": {
    nodeId: "systems-design:t2:caching", title: "Caching Strategies",
    sections: [
      { heading: "Patterns", body: "Cache-aside: app reads cache; on miss, reads DB and populates. Write-through: writes go to cache + DB simultaneously. Write-behind: writes go to cache; flushed to DB async. Read-through: cache fronts DB transparently. Cache-aside is most common." },
      { heading: "Invalidation", body: "Famously hard. Approaches: TTLs (eventual consistency), explicit invalidation on writes (precise but app-burdensome), write-through (always fresh but pricey). Cache stampedes: many clients miss simultaneously and stampede the DB. Mitigate with locks or staggered TTL." },
    ],
    codeExamples: [
      { title: "Cache-aside", code: `// Read
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
  await redis.del(\`user:\${id}\`);   // invalidate
}`, explanation: "App owns the cache: populates on read miss, invalidates on write." },
      { title: "Stampede protection", code: `// Probabilistic early expiration: with small probability, treat
// near-expiry entries as expired so one client refreshes
// while others still serve the cached value.
const ttl = 300;
const beta = 1.0;
const remaining = await redis.ttl(key);
const delta = Math.random() * Math.log(Math.random()) * beta * fetchTimeMs;
if (remaining * 1000 - delta <= 0) {
  // refresh
}`, explanation: "Spreads refresh load instead of stampeding the DB on TTL expiry." },
    ],
    keyTakeaways: ["Cache-aside is the default — app owns it", "TTLs accept staleness for simplicity", "Invalidation on write is precise but adds coupling", "Watch for stampedes; spread refresh load"],
  },
  "systems-design:t2:load-balancing": {
    nodeId: "systems-design:t2:load-balancing", title: "Load Balancing",
    sections: [
      { heading: "Algorithms", body: "Round-robin: simple, ignores load. Least connections: send to instance with fewest active requests. Hashing: consistent routing (same client → same instance). Random: surprisingly competitive." },
      { heading: "Layer 4 vs Layer 7", body: "L4 (TCP) load balancers route on connections — fast, no inspection. L7 (HTTP) inspects requests — can route by URL/header, terminate TLS, do health checks. AWS ALB and Vercel are L7." },
    ],
    codeExamples: [
      { title: "Picking a strategy", code: `// Stateless web servers, similar requests
//   → round-robin (simplest, fine)

// Long-lived requests (uploads, websockets), variable cost
//   → least connections (avoid overloading one instance)

// Need session affinity (rare with stateless apps)
//   → consistent hashing on user ID, or sticky cookies`, explanation: "Pick by request shape. Most APIs are happy with round-robin." },
      { title: "Health checks", code: `# A good /health endpoint
# - Returns quickly (no slow DB/network calls)
# - Reports its own readiness, not external dependencies
# - 200 with body for human eyes; 503 if temporarily unhealthy

GET /health → 200 {"status":"ok"}`, explanation: "Health endpoint = is-this-instance-ready. Different from is-the-system-ok." },
    ],
    keyTakeaways: ["Round-robin works for most stateless services", "Least-connections for variable-cost requests", "L4 = connection routing; L7 = HTTP-aware", "Health checks should be fast and self-contained"],
  },
  "systems-design:t2:cdn": {
    nodeId: "systems-design:t2:cdn", title: "CDN & Edge",
    sections: [
      { heading: "Edge Caching", body: "A CDN caches your content at points-of-presence (PoPs) close to users. First request fetches from origin and caches. Subsequent requests in that PoP hit the edge — milliseconds instead of cross-continent." },
      { heading: "Cache Headers", body: "Cache-Control: public, max-age=3600 — cache for an hour. immutable — never recheck. s-maxage=86400 — only for shared caches (CDN). ETag + If-None-Match — let the CDN revalidate cheaply." },
    ],
    codeExamples: [
      { title: "Static asset headers", code: `Cache-Control: public, max-age=31536000, immutable

// Hashed filenames (app.abc123.js) make this safe — change content,
// change filename, get a fresh URL.`, explanation: "Year-long cache + immutable + content-hashed filenames = ideal." },
      { title: "Dynamic but cached", code: `Cache-Control: public, max-age=60, s-maxage=600
ETag: "v123"

// Browsers cache 60s; CDN caches 10min; conditional GETs revalidate cheaply`, explanation: "Different lifetimes for browser vs CDN; ETag enables 304 Not Modified responses." },
    ],
    keyTakeaways: ["CDN caches near users — milliseconds vs cross-continent", "Cache-Control public + max-age + immutable for static", "s-maxage for CDN-only TTL", "Hashed filenames make immutable safe"],
  },
  "systems-design:t3:microservices": {
    nodeId: "systems-design:t3:microservices", title: "Microservices",
    sections: [
      { heading: "Boundaries", body: "Split by domain (bounded contexts), not by tech stack. A 'user service' owns user data; nobody else writes to its DB. Communication via APIs or events. Trade: independent deploys + scaling vs operational complexity." },
      { heading: "Inter-Service Comms", body: "Sync (HTTP, gRPC): simple, but cascading failures. Async (queues, event streams): more resilient, eventually consistent. Circuit breakers + retries with backoff prevent cascading collapse." },
    ],
    codeExamples: [
      { title: "Service boundary", code: `# User Service
# - Owns: users table
# - Exposes: GET /users/:id, POST /users, ...
# - Subscribes to: nothing (it's the source of truth)

# Order Service
# - Owns: orders table
# - Calls: User Service (sync) for user info OR
# - Subscribes to: user.created events (async, denormalized)`, explanation: "Each service owns its data. Decide sync vs async per call." },
      { title: "Circuit breaker pattern", code: `# Pseudocode
class CircuitBreaker:
    state = "closed"  # closed → open → half-open → closed
    failures = 0

    def call(self, fn):
        if self.state == "open":
            raise CircuitOpenError()
        try:
            result = fn()
            self.failures = 0
            return result
        except Exception:
            self.failures += 1
            if self.failures > 5:
                self.state = "open"
            raise`, explanation: "Stop calling a failing dependency to give it room to recover." },
    ],
    keyTakeaways: ["Split by bounded context; each service owns its data", "Sync (HTTP/gRPC): simple, fragile under load", "Async (queues, events): resilient, eventually consistent", "Circuit breakers stop cascade failures"],
  },
  "systems-design:t3:queues": {
    nodeId: "systems-design:t3:queues", title: "Message Queues",
    sections: [
      { heading: "Async Processing", body: "Queue decouples producers from consumers. Producer enqueues a message, returns fast. Worker pulls and processes. Backpressure: a backed-up queue is a signal — alert and scale workers up." },
      { heading: "Delivery Guarantees", body: "At-most-once: fast, may lose. At-least-once: may duplicate (need idempotency). Exactly-once: rare and costly — usually achieved via at-least-once + idempotent consumers. Dead-letter queues catch poison messages." },
    ],
    codeExamples: [
      { title: "Producer + worker", code: `# Web request — enqueue, respond fast
@app.post("/upload")
def upload(file):
    job_id = str(uuid4())
    queue.publish({"job_id": job_id, "file": file.url})
    return {"job_id": job_id}

# Worker — process async
def worker():
    while True:
        msg = queue.consume()
        try:
            process(msg)
            queue.ack(msg)
        except Exception:
            queue.nack(msg)  # → retry / DLQ`, explanation: "Web responds in milliseconds; the heavy work happens out of band." },
      { title: "Idempotent consumer", code: `def process(msg):
    if already_processed(msg.id):
        return
    do_the_work(msg)
    mark_processed(msg.id)`, explanation: "At-least-once delivery means dedup at the consumer." },
    ],
    keyTakeaways: ["Queues decouple producer from consumer", "At-least-once + idempotent consumer = practical exactly-once", "DLQ for poison messages — alert when it grows", "Long queue = scale workers (or back off producers)"],
  },
  "systems-design:t4:cap": {
    nodeId: "systems-design:t4:cap", title: "CAP & Consistency Models",
    sections: [
      { heading: "CAP Theorem", body: "In a partitioned distributed system, you can have Consistency or Availability, not both. Most systems are CP (relational DBs) or AP (Dynamo, Cassandra). 'Pick 2' framing is misleading — partitions happen; you choose how to react." },
      { heading: "Beyond CAP", body: "Real systems are nuanced. Eventual consistency: replicas converge given no new writes. Strong consistency: every read sees the latest write. Linearizability is the strongest; serializability concerns transactions, not single ops." },
    ],
    codeExamples: [
      { title: "AP (Cassandra-like)", code: `// Write to N=3 replicas, ACK on W=1
// Read from R=1
// Fast, available, may read stale data.
//
// Tunable: W=3, R=3 → strong consistency at cost of latency / availability`, explanation: "Tunable consistency: choose W and R per call." },
      { title: "CP (relational)", code: `// Single primary + replicas
// All writes go to primary
// On primary failure → failover (brief unavailability)
// Reads from primary are strongly consistent;
// reads from replicas are eventually consistent`, explanation: "Strong consistency by routing all writes through the primary." },
    ],
    keyTakeaways: ["CAP: under partition, choose Consistency or Availability", "Most systems are CP or AP; partition tolerance is mandatory", "Eventual consistency: replicas converge", "Strong consistency: every read sees the latest write"],
  },
  "systems-design:t4:sharding": {
    nodeId: "systems-design:t4:sharding", title: "Sharding & Partitioning",
    sections: [
      { heading: "Strategies", body: "Range: split by sorted key range. Hash: hash(key) % N. Geographic: by region. Consistent hashing minimizes data movement when adding/removing nodes — used by DynamoDB, Cassandra." },
      { heading: "Pitfalls", body: "Hot shards from skewed key distribution. Cross-shard queries become joins-over-network — slow and complex. Resharding is a major operation; plan for it before you need it." },
    ],
    codeExamples: [
      { title: "Hash sharding", code: `def shard_for(user_id, num_shards=16):
    return hash(user_id) % num_shards

# Pros: even distribution
# Cons: range scans (last 24h of data) are scatter-gather`, explanation: "Even distribution; bad for range queries." },
      { title: "Consistent hashing intuition", code: `# Map nodes and keys to a ring [0, 2^32)
# Each key goes to the next node clockwise on the ring
# Adding/removing a node only moves keys near it
#
# In practice: virtual nodes (each node maps to many points)
# to avoid lopsided data distribution.`, explanation: "Adding the (N+1)th node moves only ~1/N of keys, not all of them." },
    ],
    keyTakeaways: ["Range, hash, geographic, consistent hash — pick by access pattern", "Hot shards from skewed keys — pre-shard hot accounts", "Cross-shard queries are slow — design to avoid", "Consistent hashing minimizes data movement on resize"],
  },
};
