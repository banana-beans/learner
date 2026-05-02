import type { Challenge } from "@/lib/types";

const m = (
  partial: Omit<Challenge, "lang" | "type" | "isBoss" | "starterCode" | "tags"> & Partial<Pick<Challenge, "tags" | "isBoss" | "starterCode">>
): Challenge => ({ type: "design", isBoss: false, starterCode: "", tags: ["systems-design"], lang: "manual", ...partial });

export const systemsDesignChallenges: Challenge[] = [
  m({ id: "sd-cs-1", nodeId: "systems-design:t1:client-server", title: "Stateless API design", description: "Sketch how a stateless API authenticates with JWT.", difficulty: 1,
    hints: [
      { tier: "nudge", text: "Token holds the identity claim.", xpPenalty: 0.9 },
      { tier: "guide", text: "Server verifies signature on each request.", xpPenalty: 0.75 },
      { tier: "reveal", text: `Login → server signs JWT → client stores it
Each request: Authorization: Bearer <jwt>
Server verifies signature, reads claims, no session lookup
Trade-off: harder revocation (use short TTLs + refresh tokens)`, xpPenalty: 0.5 },
    ], baseXP: 100 }),
  m({ id: "sd-rest-1", nodeId: "systems-design:t1:rest-api", title: "REST endpoints for blog", description: "Design endpoints for users, posts, and a user's posts.", difficulty: 2, isBoss: true,
    hints: [
      { tier: "nudge", text: "Plural nouns + verbs.", xpPenalty: 0.9 },
      { tier: "guide", text: "Nested resources for relationships.", xpPenalty: 0.75 },
      { tier: "reveal", text: `GET    /users
GET    /users/:id
POST   /users
PATCH  /users/:id
DELETE /users/:id

GET    /posts
GET    /posts/:id
POST   /posts
GET    /users/:id/posts`, xpPenalty: 0.5 },
    ], baseXP: 180 }),
  m({ id: "sd-proc-1", nodeId: "systems-design:t1:design-process", title: "Estimate Twitter writes", description: "Back-of-envelope: 100M DAU posting 3x/day, 10x peak. QPS?", difficulty: 2,
    hints: [
      { tier: "nudge", text: "Total/day → per second.", xpPenalty: 0.9 },
      { tier: "guide", text: "300M/day ÷ 86400 ≈ 3,500/sec.", xpPenalty: 0.75 },
      { tier: "reveal", text: `100M × 3 = 300M posts/day
300M / 86,400s ≈ 3,500 writes/sec average
× 10 peak ≈ 35,000 writes/sec`, xpPenalty: 0.5 },
    ], baseXP: 150 }),
  m({ id: "sd-cache-1", nodeId: "systems-design:t2:caching", title: "Cache-aside read+write", description: "Pseudocode: read populates, write invalidates.", difficulty: 2,
    hints: [
      { tier: "nudge", text: "Read: check cache, fall back to DB, populate.", xpPenalty: 0.9 },
      { tier: "guide", text: "Write: write DB, then DEL the cache key.", xpPenalty: 0.75 },
      { tier: "reveal", text: `read(id):
  v = cache.get(id)
  if v: return v
  v = db.fetch(id)
  cache.set(id, v, ttl=300)
  return v

write(id, patch):
  db.update(id, patch)
  cache.del(id)`, xpPenalty: 0.5 },
    ], baseXP: 150 }),
  m({ id: "sd-lb-1", nodeId: "systems-design:t2:load-balancing", title: "Pick LB strategy", description: "Variable-cost requests with long tails — which strategy?", difficulty: 2,
    hints: [
      { tier: "nudge", text: "Round-robin treats every request as equal.", xpPenalty: 0.9 },
      { tier: "guide", text: "Pick the algorithm that considers active load.", xpPenalty: 0.75 },
      { tier: "reveal", text: `Least-connections — sends new requests to the instance with fewest active.
Avoids one box getting stuck with all the long-running requests.`, xpPenalty: 0.5 },
    ], baseXP: 150 }),
  m({ id: "sd-cdn-1", nodeId: "systems-design:t2:cdn", title: "Static asset headers", description: "Cache-Control for hashed JS bundles.", difficulty: 1,
    hints: [
      { tier: "nudge", text: "Maximum cache + immutable.", xpPenalty: 0.9 },
      { tier: "guide", text: "max-age=31536000.", xpPenalty: 0.75 },
      { tier: "reveal", text: `Cache-Control: public, max-age=31536000, immutable

Hashed filenames (app.abc123.js) ensure correctness on changes.`, xpPenalty: 0.5 },
    ], baseXP: 120 }),
  m({ id: "sd-ms-1", nodeId: "systems-design:t3:microservices", title: "Boundary for orders", description: "Order service vs user service: what does each own?", difficulty: 2, isBoss: true,
    hints: [
      { tier: "nudge", text: "Each service owns its data.", xpPenalty: 0.9 },
      { tier: "guide", text: "Orders reference users by ID; never write users.", xpPenalty: 0.75 },
      { tier: "reveal", text: `User Service: owns users table; exposes /users/:id; nobody else writes it.
Order Service: owns orders table; references user_id; calls user service for hydration OR consumes user.created events to denormalize.`, xpPenalty: 0.5 },
    ], baseXP: 180 }),
  m({ id: "sd-q-1", nodeId: "systems-design:t3:queues", title: "Idempotent worker", description: "Worker pseudocode that handles at-least-once delivery.", difficulty: 2,
    hints: [
      { tier: "nudge", text: "Track processed message IDs.", xpPenalty: 0.9 },
      { tier: "guide", text: "Skip if already processed.", xpPenalty: 0.75 },
      { tier: "reveal", text: `def process(msg):
    if already_processed(msg.id): return
    do_the_work(msg)
    mark_processed(msg.id)`, xpPenalty: 0.5 },
    ], baseXP: 180 }),
  m({ id: "sd-cap-1", nodeId: "systems-design:t4:cap", title: "Pick CP or AP", description: "Bank balance system — which side of CAP?", difficulty: 2,
    hints: [
      { tier: "nudge", text: "Bank balances cannot diverge.", xpPenalty: 0.9 },
      { tier: "guide", text: "Better unavailable than wrong.", xpPenalty: 0.75 },
      { tier: "reveal", text: `CP — Consistency over Availability.
A wrong balance is much worse than 'try again later'.
A relational DB with single primary fits.`, xpPenalty: 0.5 },
    ], baseXP: 150 }),
  m({ id: "sd-shard-1", nodeId: "systems-design:t4:sharding", title: "Hot user mitigation", description: "10% of users generate 90% of writes — what now?", difficulty: 3, isBoss: true,
    hints: [
      { tier: "nudge", text: "Hash sharding by user_id won't help — they're each on one shard.", xpPenalty: 0.9 },
      { tier: "guide", text: "Split hot users across multiple keys.", xpPenalty: 0.75 },
      { tier: "reveal", text: `Sub-shard hot users: shard key = (user_id, bucket) where bucket spreads writes across multiple shards. Reads scatter-gather but writes parallelize. Track hot users explicitly and route them differently.`, xpPenalty: 0.5 },
    ], baseXP: 250 }),
];
