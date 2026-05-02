// ============================================================
// Systems Design Challenges — multi-step design walkthroughs
// All manual (read-and-confirm). Solutions reveal the full plan.
// ============================================================

import type { Challenge } from "@/lib/types";

const m = (
  partial: Omit<Challenge, "lang" | "type" | "isBoss" | "starterCode" | "tags"> & Partial<Pick<Challenge, "tags" | "isBoss" | "starterCode" | "type">>
): Challenge => ({ type: "design", isBoss: false, starterCode: "", tags: ["systems-design"], lang: "manual", ...partial });

export const systemsDesignChallenges: Challenge[] = [
  // ── T1 ──
  m({
    id: "sd-cs-1",
    nodeId: "systems-design:t1:client-server",
    title: "Where does this state live?",
    description: "Walk through where each piece of state belongs: (a) user identity for auth, (b) shopping cart contents, (c) per-IP rate-limit counter, (d) websocket connection.",
    difficulty: 2,
    hints: [
      { tier: "nudge", text: "Three places: in the request, in shared store, on a specific instance.", xpPenalty: 0.9 },
      { tier: "guide", text: "Identity travels with the request. Counters need to be visible to every instance.", xpPenalty: 0.75 },
      { tier: "reveal", text: `(a) User identity → JWT in the request. Stateless server-side.
(b) Cart → DB (durable) + Redis cache for hot cart reads. Survives multiple instances.
(c) Rate-limit counter → Redis. Per-instance counters undercount with N instances behind a LB.
(d) WebSocket → bound to a specific instance for the connection's life. State (subscriptions) lives in a shared pub/sub layer (Redis) so other instances can route messages.`, xpPenalty: 0.5 },
    ],
    baseXP: 150,
  }),
  m({
    id: "sd-rest-1",
    nodeId: "systems-design:t1:rest-api",
    title: "REST API surface for a blog",
    description: "Sketch the endpoints for: list users, get one user, get a user's posts, create post, update a post (partial), delete a post. Include status codes and pagination.",
    difficulty: 2,
    isBoss: true,
    hints: [
      { tier: "nudge", text: "Plural nouns + verbs. Nested resources for relationships.", xpPenalty: 0.9 },
      { tier: "guide", text: "Cursor-based pagination, not offset.", xpPenalty: 0.75 },
      { tier: "reveal", text: `GET    /users?limit=20&cursor=…   → 200 { data: [...], next_cursor: "..." }
GET    /users/:id                  → 200 user | 404
GET    /users/:id/posts?limit=20   → 200 { data: [...], next_cursor }
POST   /posts                      → 201 + Location: /posts/:id
PATCH  /posts/:id                  → 200 updated | 404 | 409 conflict
DELETE /posts/:id                  → 204 no content | 404

Error shape: { error: { code, message, details } }`, xpPenalty: 0.5 },
    ],
    baseXP: 200,
  }),
  m({
    id: "sd-proc-1",
    nodeId: "systems-design:t1:design-process",
    title: "Estimate Twitter writes + storage",
    description: "100M DAU, 3 posts/day average, 10x peak. Compute: writes/sec average, writes/sec peak, daily and yearly storage if posts average 300 bytes.",
    difficulty: 2,
    hints: [
      { tier: "nudge", text: "Total per day → divide by 86,400.", xpPenalty: 0.9 },
      { tier: "guide", text: "Storage = byte size × posts/day; multiply by 365.", xpPenalty: 0.75 },
      { tier: "reveal", text: `Writes/day: 100M × 3 = 300M
Writes/sec avg: 300M / 86,400 ≈ 3,500
Writes/sec peak: 3,500 × 10 = 35,000

Storage/day: 300 bytes × 300M = 90 GB
Storage/year: 90 GB × 365 ≈ 33 TB

These numbers shape downstream decisions: 33 TB/year says you need tiered storage; 35K peak writes say one DB box won't cut it.`, xpPenalty: 0.5 },
    ],
    baseXP: 180,
  }),

  // ── T2 ──
  m({
    id: "sd-cache-1",
    nodeId: "systems-design:t2:caching",
    title: "Cache strategy for product page",
    description: "Product page: 10M views/day, 1% are updates. p99 read < 50ms. Pick a strategy and explain invalidation.",
    difficulty: 2,
    isBoss: true,
    hints: [
      { tier: "nudge", text: "Read-heavy + tolerate brief staleness.", xpPenalty: 0.9 },
      { tier: "guide", text: "Cache-aside or stale-while-revalidate.", xpPenalty: 0.75 },
      { tier: "reveal", text: `Cache-aside in Redis with 60s TTL.
Read: redis GET → on miss, DB → populate cache → return.
Write: DB UPDATE → redis DEL key (explicit invalidation).

For extra robustness against stampedes (popular product trends → many concurrent misses):
• stale-while-revalidate at the CDN: max-age=60, stale-while-revalidate=300
• OR probabilistic early expiration in the app

Result: 99%+ requests served from cache; ~p99 stays under 50ms even on miss.`, xpPenalty: 0.5 },
    ],
    baseXP: 200,
  }),
  m({
    id: "sd-lb-1",
    nodeId: "systems-design:t2:load-balancing",
    title: "Healthcheck cascading-failure trap",
    description: "Engineer ships /healthz that pings the database. DB has a 5-second blip. What happens to the fleet, and how do you fix it?",
    difficulty: 3,
    hints: [
      { tier: "nudge", text: "Every instance fails health at the same time.", xpPenalty: 0.9 },
      { tier: "guide", text: "Liveness ≠ readiness.", xpPenalty: 0.75 },
      { tier: "reveal", text: `What happens: every instance's /healthz fails simultaneously. The LB removes them all from rotation. The fleet evacuates; clients see 503s; restarts may pile on retries when DB recovers.

Fix:
• Two endpoints: /healthz (liveness — process alive, no deps) and /readyz (readiness — DB pingable).
• LB removes from rotation on /readyz failure (don't send traffic).
• Process supervisor only kills on /healthz failure.

Result: DB blip → instances stop accepting new traffic, finish in-flight, come back when DB recovers. No restart storms.`, xpPenalty: 0.5 },
    ],
    baseXP: 250,
  }),
  m({
    id: "sd-cdn-1",
    nodeId: "systems-design:t2:cdn",
    title: "Headers for hashed JS bundle",
    description: "Build outputs app.abc123.js. What Cache-Control header maximizes performance?",
    difficulty: 1,
    hints: [
      { tier: "nudge", text: "Year-long cache, never recheck.", xpPenalty: 0.9 },
      { tier: "guide", text: "max-age=31536000 + immutable.", xpPenalty: 0.75 },
      { tier: "reveal", text: `Cache-Control: public, max-age=31536000, immutable

• max-age=31536000 → 1 year
• immutable → browser never even revalidates
• Safe because the filename hashes the content; any change makes a new filename`, xpPenalty: 0.5 },
    ],
    baseXP: 130,
  }),

  // ── T3 ──
  m({
    id: "sd-ms-1",
    nodeId: "systems-design:t3:microservices",
    title: "Boundary: order, user, notification",
    description: "Three services. Define ownership and how Order gets the user's email at order-placed time.",
    difficulty: 3,
    isBoss: true,
    hints: [
      { tier: "nudge", text: "One service owns each data type.", xpPenalty: 0.9 },
      { tier: "guide", text: "Two options for hydration: sync call vs event-driven denorm.", xpPenalty: 0.75 },
      { tier: "reveal", text: `Ownership:
• User Service owns users (only writer).
• Order Service owns orders.
• Notification Service owns notifications.

Getting user email at order-placed:
Option A — sync RPC: Order Service calls User Service GET /users/:id when sending an order-placed notification. Simple, but a User Service outage breaks order notifications.

Option B — event-driven denormalization: User Service publishes user.created / user.updated events. Order Service subscribes and keeps a local read-only mirror of (user_id → email). On order-placed, looks up locally.

For real-time order placement: option B is more resilient. For dashboards/analytics: either works.`, xpPenalty: 0.5 },
    ],
    baseXP: 250,
  }),
  m({
    id: "sd-q-1",
    nodeId: "systems-design:t3:queues",
    title: "Idempotent payment worker",
    description: "Payment events arrive at-least-once. Worker must charge each one exactly once. Sketch the logic.",
    difficulty: 3,
    hints: [
      { tier: "nudge", text: "Track processed message IDs in a fast store.", xpPenalty: 0.9 },
      { tier: "guide", text: "Check before doing the side effect.", xpPenalty: 0.75 },
      { tier: "reveal", text: `def process(msg):
    if redis.exists(f"processed:{msg.id}"):
        return  # already done — at-least-once dedup
    charge_card(msg.payment_id, msg.amount)
    redis.setex(f"processed:{msg.id}", 86400 * 7, "1")  # 7 days
    queue.ack(msg)

Two-step write race: charge then mark vs mark then charge. Charge first, mark on success — if mark fails, next retry charges again (BAD). Better: have charge_card itself be idempotent (Stripe accepts an Idempotency-Key header). Then duplicate calls return the same charge.

Result: at-least-once + idempotent op = practical exactly-once.`, xpPenalty: 0.5 },
    ],
    baseXP: 250,
  }),

  // ── T4 ──
  m({
    id: "sd-cap-1",
    nodeId: "systems-design:t4:cap",
    title: "Pick CP or AP per system",
    description: "Choose for: (a) bank balances, (b) shopping cart, (c) user-generated comments.",
    difficulty: 2,
    hints: [
      { tier: "nudge", text: "What's worse: stale read or temporary unavailability?", xpPenalty: 0.9 },
      { tier: "guide", text: "Bank: wrong is unacceptable. Cart: stale is fine.", xpPenalty: 0.75 },
      { tier: "reveal", text: `(a) Bank balances → CP. A wrong balance is far worse than a brief 'try again later'. Use a relational DB with single primary; reads from primary for strong consistency.

(b) Shopping cart → AP. Showing a 5-second-stale cart is fine. Use Dynamo-style with W=1, R=1 normally; W=2, R=2 at checkout for stronger guarantee on the totals.

(c) Comments → AP. Eventual consistency is fine; some readers see a comment 1s after others — no harm.`, xpPenalty: 0.5 },
    ],
    baseXP: 200,
  }),
  m({
    id: "sd-shard-1",
    nodeId: "systems-design:t4:sharding",
    title: "Hot user mitigation",
    description: "1% of users generate 90% of writes. Shard key is user_id with hash mod 16. Why does this fail, and how do you fix it?",
    difficulty: 4,
    isBoss: true,
    hints: [
      { tier: "nudge", text: "Hash(hot_user) lands on one shard.", xpPenalty: 0.9 },
      { tier: "guide", text: "Spread hot users' writes across multiple buckets.", xpPenalty: 0.75 },
      { tier: "reveal", text: `Why it fails: hash(celebrity_001) is deterministic — every write for that user goes to one shard. With 90% of writes on 1% of users, those few shards melt while others idle.

Fix — sub-shard hot users:
• Shard key = (user_id, bucket) where bucket = random 0..15 per write
• Now writes for the hot user spread across all 16 shards
• Reads scatter-gather across all 16 buckets and merge

Cost: reads slower (16 queries instead of 1, parallelized). Writes parallelize.

Real-world: Twitter does this for celebrity timelines. Maintain a 'hot user' set explicitly so you only pay scatter-gather cost where needed.`, xpPenalty: 0.5 },
    ],
    baseXP: 300,
  }),

  // ── T5 — Design Case Studies ──
  m({
    id: "sd-t5-url-1",
    nodeId: "systems-design:t5:url-shortener",
    title: "URL Shortener: walk through the design",
    description: "Walk through: ID generation strategy, read path with cache, click-tracking that doesn't slow redirects.",
    difficulty: 3,
    isBoss: true,
    hints: [
      { tier: "nudge", text: "Three concerns: ID gen, read latency, analytics.", xpPenalty: 0.9 },
      { tier: "guide", text: "Counter + base62 for IDs. Cache for reads. Async for analytics.", xpPenalty: 0.75 },
      { tier: "reveal", text: `ID generation: distributed counter (each shard claims 100K IDs at a time), base62-encode → 6 chars covers 56B URLs.

Read path:
1. Edge cache (CDN) for popular shorts.
2. App: Redis lookup. On hit (~1ms), return 307 redirect.
3. On miss: DB read, populate Redis with 1-day TTL, redirect.

Click tracking:
• Redirect path enqueues {short, ts, ip_hash} to Kafka (fire-and-forget).
• Stream consumer batches inserts to clicks table (every 1s).
• Aggregation job rolls up per-day counts for the dashboard.

Result: redirect p99 < 50ms even at 100K req/sec; analytics is best-effort but eventually correct.`, xpPenalty: 0.5 },
    ],
    baseXP: 350,
  }),
  m({
    id: "sd-t5-feed-1",
    nodeId: "systems-design:t5:news-feed",
    title: "News Feed: fan-out strategy",
    description: "100M users, 17:1 read/write ratio. Average user has ~200 followers; some have millions. Pick a fan-out strategy and explain the celebrity case.",
    difficulty: 4,
    isBoss: true,
    hints: [
      { tier: "nudge", text: "Pre-compute for the common case; pull on read for the outliers.", xpPenalty: 0.9 },
      { tier: "guide", text: "Hybrid — fan-out on write for normal users, fan-out on read for celebrities.", xpPenalty: 0.75 },
      { tier: "reveal", text: `Hybrid fan-out:

Normal users (followers < 10K):
• On post: write post, then push post_id into each follower's feed (Redis sorted set, score=ts), capped at 500. 200 small Redis writes per post.
• On read: ZREVRANGE the feed → list of post_ids → hydrate.

Celebrities (followers > 10K, e.g. 1M+):
• On post: write post, skip fan-out. (1M writes per post = unworkable.)
• On read: pull recent posts from each celebrity the user follows, merge with the pre-computed feed, sort by ts, hydrate.

Storage:
• Posts table sharded by user_id.
• Pre-computed feeds in Redis, sharded by user_id.
• Post bodies cached separately with their own TTLs.

Result: avg user feed read = 1 Redis call (~1ms). Celebrity follower's feed = 1 Redis call + N small queries for celebs they follow.`, xpPenalty: 0.5 },
    ],
    baseXP: 400,
  }),
  m({
    id: "sd-t5-chat-1",
    nodeId: "systems-design:t5:chat",
    title: "Chat: connection routing",
    description: "Millions of WebSocket connections, distributed across many gateway instances. User A sends to user B; how does the message find B's connection?",
    difficulty: 4,
    isBoss: true,
    hints: [
      { tier: "nudge", text: "Gateways shouldn't need to know about each other.", xpPenalty: 0.9 },
      { tier: "guide", text: "A pub/sub layer can do the routing.", xpPenalty: 0.75 },
      { tier: "reveal", text: `Pub/sub backplane (Redis pub/sub or Kafka):

When user_y connects to gateway B:
• Gateway B: SUBSCRIBE user:y on Redis pub/sub.

When user_x sends to user_y via gateway A:
1. Gateway A persists the message (per-conversation seq number for ordering).
2. Gateway A: PUBLISH user:y { msg } on Redis.
3. Gateway B is subscribed; receives the publish.
4. Gateway B looks up y's WS handle locally; pushes message down.

Gateways don't know about each other — Redis does the routing. Adding gateways = trivial.

For offline users: skip the publish; user fetches via /history?after_seq=… on reconnect.

Presence: SET user:x:online "1" EX 60 on connect; refresh on heartbeat. Imprecise (~60s window) but robust.`, xpPenalty: 0.5 },
    ],
    baseXP: 400,
  }),
  m({
    id: "sd-t5-rl-1",
    nodeId: "systems-design:t5:rate-limiter",
    title: "Rate Limiter: pick algorithm + topology",
    description: "API: 60 req/min/user, distributed across many app instances. Pick an algorithm and explain how to keep counters consistent.",
    difficulty: 3,
    isBoss: true,
    hints: [
      { tier: "nudge", text: "Counters in app memory don't see each other.", xpPenalty: 0.9 },
      { tier: "guide", text: "Centralize in Redis; pick an algorithm that's cheap to evaluate atomically.", xpPenalty: 0.75 },
      { tier: "reveal", text: `Algorithm: sliding window counter (cheap, accurate enough). Two cheap counters per user (current minute + previous), weighted blend.

allowed(user_id, limit=60, now):
  cur_window = floor(now / 60)
  prev_window = cur_window - 1
  cur = redis.get(rl:user:cur_window) or 0
  prev = redis.get(rl:user:prev_window) or 0
  weight = (60 - (now - cur_window*60)) / 60
  estimated = cur + prev * weight
  if estimated >= limit: return False
  redis.incr(rl:user:cur_window) + EXPIRE 120
  return True

Centralization in Redis means every app instance sees the same counter.

Layered enforcement:
• Edge (CDN/WAF): coarse per-IP. Drops bad traffic before it hits your apps.
• Gateway: per-API-key.
• App: per-user, per-endpoint, with the above algorithm.

Always return X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, and Retry-After on 429.`, xpPenalty: 0.5 },
    ],
    baseXP: 350,
  }),
  m({
    id: "sd-t5-cnt-1",
    nodeId: "systems-design:t5:distributed-counter",
    title: "Distributed Counter: viral post likes",
    description: "A post goes viral: 100K likes/sec. The naive counter (one row, INCR) melts. Sketch a scalable counter.",
    difficulty: 3,
    hints: [
      { tier: "nudge", text: "One row = one lock contention point.", xpPenalty: 0.9 },
      { tier: "guide", text: "Spread writes across N rows; reads sum.", xpPenalty: 0.75 },
      { tier: "reveal", text: `Shard the counter:
counts (post_id, shard_id, count, PRIMARY KEY (post_id, shard_id))

Write: pick random shard_id 0..N-1; UPSERT counts.count += 1.
Read: SELECT SUM(count) FROM counts WHERE post_id = X.

N=64 → contention drops 64×; reads sum 64 small rows (still fast).

Layer cache:
• Redis: count:post_id with 10s TTL. INCR on writes, GET on reads.
• Reads almost never hit DB.

For the 100K/sec viral case, also batch:
• Each app instance buffers increments locally, flushes every 1s.
• 10 app instances × 1 flush/sec = 10 DB writes/sec for that post (down from 100K).

Trade: ~1s of count loss on app crash. Acceptable for likes.`, xpPenalty: 0.5 },
    ],
    baseXP: 300,
  }),
];
