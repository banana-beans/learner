import type { Snippet } from "./types";

export const systemsDesignSnippets: Snippet[] = [
  {
    id: "sd-cache-aside",
    language: "systems-design",
    title: "Cache-aside pattern",
    tag: "caching",
    code: `// Read: app checks cache first, falls back to DB, populates cache.
async function getUser(id) {
  const cached = await redis.get(\`user:\${id}\`);
  if (cached) return JSON.parse(cached);

  const user = await db.users.findOne({ id });
  await redis.set(\`user:\${id}\`, JSON.stringify(user), { ex: 300 });  // 5 min TTL
  return user;
}

// Write: update DB, then invalidate the cache.
async function updateUser(id, patch) {
  await db.users.update({ id }, patch);
  await redis.del(\`user:\${id}\`);     // next read repopulates with fresh data
}`,
    explanation:
      "App owns the cache. Read fills on miss; write invalidates. Most read-heavy services follow this exact pattern.",
  },
  {
    id: "sd-fan-out-write",
    language: "systems-design",
    title: "Fan-out on write (timelines)",
    tag: "feed",
    code: `// On post: push the post_id into every follower's pre-computed feed (Redis sorted set).
function onPost(userId, postId) {
  for (const followerId of getFollowers(userId)) {
    redis.zadd(\`feed:\${followerId}\`, Date.now(), postId);
    redis.zremrangebyrank(\`feed:\${followerId}\`, 0, -501);   // cap at 500 entries
  }
}

// On feed read: ZREVRANGE the pre-computed list — O(1) Redis call.
function getFeed(userId) {
  return redis.zrevrange(\`feed:\${userId}\`, 0, 19);
}

// Trade: cheap reads, expensive writes (1M followers = 1M writes per post).`,
    explanation:
      "Pre-compute feeds on write. Reads become trivial. Hits a wall at celebrity scale — that's where hybrid (fan-out on read for celebs) comes in.",
  },
  {
    id: "sd-circuit-breaker",
    language: "systems-design",
    title: "Circuit breaker pattern",
    tag: "resilience",
    code: `class CircuitBreaker:
    def __init__(self, threshold=5, reset_secs=30):
        self.state = "closed"   # closed -> open -> half-open -> closed
        self.failures = 0
        self.opened_at = None

    def call(self, fn):
        if self.state == "open":
            if time.time() - self.opened_at > self.reset_secs:
                self.state = "half-open"          # try one probe call
            else:
                raise CircuitOpenError("downstream is sick")

        try:
            result = fn()
            self.state = "closed"; self.failures = 0
            return result
        except Exception:
            self.failures += 1
            if self.failures >= self.threshold:
                self.state = "open"; self.opened_at = time.time()
            raise`,
    explanation:
      "Stop hammering a failing dependency. Saves the dependency from retry storms and the caller from hanging. Pair with timeouts and bounded retries.",
  },
  {
    id: "sd-idempotency-key",
    language: "systems-design",
    title: "Idempotency keys",
    tag: "api",
    code: `// Client generates a unique key per logical operation.
POST /payments
Idempotency-Key: ord_abc123_attempt_1
{ "amount": 100, ... }

// Server stores (key -> result) on first success.
// On any retry with the same key:
//   - returns the cached response, doesn't re-process
//   - ensures "exactly once" effect even with at-least-once delivery

// TTL the keys (e.g. 24h) — long enough for retries, short enough to be cheap.`,
    explanation:
      "Networks retry. Idempotency keys turn at-least-once delivery into practical exactly-once. Standard for payment, ordering, mutating APIs.",
  },
  {
    id: "sd-rate-limit-token",
    language: "systems-design",
    title: "Token bucket rate limiter",
    tag: "rate-limit",
    code: `# Bucket holds N tokens, refills at R per second. Each request takes one.
def allowed(user_id, capacity=60, refill_per_sec=1):
    now = time.time()
    state = redis.hgetall(f"rl:{user_id}") or {}
    tokens = float(state.get("tokens", capacity))
    last   = float(state.get("ts", now))

    # Refill: add (elapsed * rate) tokens, cap at capacity.
    tokens = min(capacity, tokens + (now - last) * refill_per_sec)

    if tokens < 1:
        return False           # not enough tokens
    tokens -= 1                # consume one
    redis.hset(f"rl:{user_id}", mapping={"tokens": tokens, "ts": now})
    redis.expire(f"rl:{user_id}", 3600)
    return True`,
    explanation:
      "Smooth + bursty: a user idle for a while can spike up to N requests, then settles to R/sec. For atomicity across servers, do it in a Lua script.",
  },
  {
    id: "sd-cap-tradeoffs",
    language: "systems-design",
    title: "CAP — pick C or A under partition",
    tag: "theory",
    code: `// CAP theorem: under a network partition, you can have either
// Consistency or Availability. Partition tolerance is non-negotiable
// in real distributed systems.
//
// CP systems (relational DBs with single primary):
//   - Refuse writes during partition to keep state consistent.
//   - Brief unavailability > inconsistent data.
//   - Use case: bank balances, inventory.
//
// AP systems (Cassandra, Dynamo-flavored):
//   - Accept writes on either side; converge later.
//   - Available even when partitioned; may read stale.
//   - Use case: shopping carts, social feeds, comments.
//
// "Eventual consistency" usually means AP with bounded lag.`,
    explanation:
      "Pick by what's worse: showing stale data, or refusing the write. Most systems are CP or AP; the 'pick 2' framing is misleading.",
  },
  {
    id: "sd-consistent-hash",
    language: "systems-design",
    title: "Consistent hashing",
    tag: "sharding",
    code: `# Map both nodes and keys to a ring [0, 2^32).
# Each key goes to the next node clockwise on the ring.
# Adding/removing a node only moves keys between adjacent nodes —
# not all of them like simple hash-mod sharding.

# Visual:
#
#         node A
#        /
#   [ 0 ]----[ 2^31 ]----[ 2^32 ]
#                           \\
#                            node B
#
# In practice: use VIRTUAL nodes (each physical node = many ring points)
# to even out distribution and limit blast radius of any one node failure.

# Used by: DynamoDB, Cassandra, memcached client libraries.`,
    explanation:
      "Adding the (N+1)th node moves only ~1/N of keys. The standard sharding strategy when you'll add/remove nodes over time.",
  },
  {
    id: "sd-bloom-filter",
    language: "systems-design",
    title: "Bloom filter — probabilistic membership",
    tag: "data",
    code: `# A Bloom filter is a tiny bitmap + several hash functions.
# Every "add" sets bits at hash positions; every "check" reads them.
#
# - False positives possible (filter says yes, reality is no)
# - False negatives IMPOSSIBLE (filter says no, definitely no)
#
# Saves you from expensive lookups when most queries miss.
#
# Example use: before reading from a DB or large index, check the filter.
# Bloom says no -> skip the lookup entirely.

from pybloom_live import BloomFilter
bf = BloomFilter(capacity=1_000_000, error_rate=0.01)
bf.add("user:123")
print("user:123" in bf)        # True
print("user:999" in bf)        # almost always False`,
    explanation:
      "Tiny memory, fast checks, one-sided error. Gates expensive lookups in CDN cache, DB existence checks, malicious URL lists.",
  },
  {
    id: "sd-dlq",
    language: "systems-design",
    title: "Dead-letter queue (DLQ)",
    tag: "queues",
    code: `# Worker pseudocode handling poison messages.
def worker():
    while True:
        msg = queue.consume(timeout=30)
        if not msg: continue
        try:
            process(msg)
            queue.ack(msg)
        except RetryableError:
            queue.nack(msg, requeue=True)        # back to main queue
        except Exception:
            # Permanent failure — don't loop forever.
            queue.publish_to(DLQ, msg)
            queue.ack(msg)                       # remove from main queue
            log.error(f"poison message: {msg.id}")

# Operators inspect DLQ depth and contents to find systemic bugs.`,
    explanation:
      "Without a DLQ, bad messages re-poll forever and starve good ones. With one: poison messages get quarantined and surface as alerts.",
  },
  {
    id: "sd-singleflight",
    language: "systems-design",
    title: "Single-flight — collapse duplicate work",
    tag: "caching",
    code: `# Many readers concurrently miss cache for the same key -> all hit DB at once.
# "Single-flight" coalesces them: ONE goes to DB; the rest wait for the result.

# Pseudocode using a per-key lock or in-flight map.
in_flight = {}     # key -> Future

async def get(key):
    cached = cache.get(key)
    if cached is not None:
        return cached

    if key in in_flight:
        return await in_flight[key]      # wait for the first call

    future = asyncio.Future()
    in_flight[key] = future
    try:
        value = await load_from_db(key)
        cache.set(key, value, ttl=300)
        future.set_result(value)
        return value
    finally:
        del in_flight[key]`,
    explanation:
      "Mitigates cache stampedes on hot keys. Combined with stale-while-revalidate, your DB never gets hammered by simultaneous misses.",
  },
  {
    id: "sd-l4-vs-l7",
    language: "systems-design",
    title: "L4 vs L7 load balancing",
    tag: "lb",
    code: `// Layer 4 (Transport): routes connections by IP + port.
//   - Fast, no payload inspection.
//   - Can't make decisions based on URL or headers.
//   - Examples: AWS NLB, HAProxy in TCP mode.
//
// Layer 7 (Application/HTTP): inspects HTTP requests.
//   - Routes by host, path, header, cookie, JWT claim.
//   - Terminates TLS centrally.
//   - Per-route health checks, request rewriting.
//   - Examples: AWS ALB, nginx, Vercel, Cloudflare, Envoy.
//
// Most modern web traffic uses L7.
// L4 for non-HTTP (databases, custom protocols, extreme throughput).`,
    explanation:
      "L4 is fast and protocol-agnostic. L7 is HTTP-aware — needed for path-based routing, TLS termination, and per-route policies.",
  },
  {
    id: "sd-blue-green",
    language: "systems-design",
    title: "Blue/green deploy",
    tag: "deploy",
    code: `# Two parallel environments — only one serves prod traffic at a time.
#
# Step 1: BLUE serves all traffic. GREEN is idle / staging.
#   ┌──────────┐
#   │   LB     │ -> 100% BLUE
#   └──────────┘
#
# Step 2: Deploy new version to GREEN. Smoke-test it.
#
# Step 3: Atomically flip LB to GREEN.
#   ┌──────────┐
#   │   LB     │ -> 100% GREEN
#   └──────────┘
#
# Step 4: BLUE stays running for instant rollback. Eventually retire it.
#
# Trade: 2x resources during cutover; near-instant rollback in exchange.`,
    explanation:
      "Best blast-radius control for risky deploys. Pair with smoke tests on green before flipping. Canary is the per-percentage variant.",
  },
  {
    id: "sd-redis-lock",
    language: "systems-design",
    title: "Redis distributed lock (with caveats)",
    tag: "concurrency",
    code: `# Acquire a short-lived lock with a unique owner token.
# NX = only set if key doesn't exist; EX = expire after N seconds.
ok = redis.set("lock:resource", owner_token, nx=True, ex=10)
if ok:
    try:
        # do work
        ...
    finally:
        # Release ONLY if we still own it (avoid releasing someone else's lock).
        # Atomic with a Lua script:
        # if redis.call("get", KEYS[1]) == ARGV[1] then redis.call("del", KEYS[1]) end
        ...

# Limitations:
# - A slow client whose work exceeds 10s loses the lock.
# - Another worker may run concurrently → race condition.
# - For correctness-critical mutex: use Zookeeper / etcd / Postgres advisory locks.`,
    explanation:
      "Fine for short, best-effort coordination (e.g. 'send the welcome email once'). For correctness-critical exclusion, use stronger primitives.",
  },
  {
    id: "sd-saga",
    language: "systems-design",
    title: "Saga — distributed transactions",
    tag: "transactions",
    code: `# Two-phase commit doesn't work across services. Saga = compensating actions.
#
# Sequence (book trip):
#   1. ReserveFlight  -> on fail: stop
#   2. ReserveHotel   -> on fail: CancelFlight
#   3. ChargeCard     -> on fail: CancelHotel + CancelFlight
#
# Each step is a local transaction. On failure, we run COMPENSATING
# transactions for the previous successful steps — undoing the effect.
#
# Two flavors:
#   - Choreography: services react to each other's events (loose coupling).
#   - Orchestration: a central coordinator drives the sequence (clearer).
#
# Tooling: Temporal, AWS Step Functions, Camunda.`,
    explanation:
      "How distributed systems do 'all or nothing' without 2PC. Compensation is messy but tractable — every step needs a defined undo.",
  },
  {
    id: "sd-cache-stampede",
    language: "systems-design",
    title: "Cache stampede protection",
    tag: "caching",
    code: `# When a hot key expires, every concurrent reader misses simultaneously
# and all hit the DB at once. Three mitigations:

# 1. Probabilistic early expiration (XFetch).
#    Each get: with small probability tied to remaining TTL, refresh proactively.

# 2. Single-flight: only one process refreshes; others wait.

# 3. Stale-while-revalidate (HTTP):
#    Cache-Control: max-age=60, stale-while-revalidate=300
#    -> Serves stale data immediately while refreshing in background.

# All three keep the DB load smooth instead of spiky.`,
    explanation:
      "Without protection, a hot key's expiry causes a thundering herd. SWR is the simplest at the HTTP layer; XFetch + single-flight at the app layer.",
  },
];
