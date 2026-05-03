import type { Snippet } from "./types";

export const databasesSnippets: Snippet[] = [
  {
    id: "db-select-where",
    language: "databases",
    title: "SELECT, WHERE, ORDER BY, LIMIT",
    tag: "sql",
    code: `-- Pull recent active users, newest first, top 20.
SELECT id, email, created_at
FROM users
WHERE created_at >= '2024-01-01'      -- range filter
  AND email LIKE '%@example.com'      -- pattern (% = any chars)
ORDER BY created_at DESC               -- most recent first
LIMIT 20;                              -- cap the result set`,
    explanation:
      "Reads top-to-bottom: pick columns, narrow rows, sort, then cap. Logical execution order is FROM/WHERE → SELECT → ORDER BY → LIMIT.",
  },
  {
    id: "db-null-handling",
    language: "databases",
    title: "NULL is special — IS NULL only",
    tag: "sql",
    code: `-- NEVER do this — = NULL always returns "unknown" (treated as false).
SELECT * FROM users WHERE last_login = NULL;       -- always 0 rows!

-- DO this — IS NULL / IS NOT NULL.
SELECT * FROM users WHERE last_login IS NULL;
SELECT * FROM users WHERE last_login IS NOT NULL;

-- COUNT(col) skips NULLs; COUNT(*) doesn't.
SELECT
  COUNT(*)               AS total_users,
  COUNT(last_login)      AS users_who_logged_in,
  COUNT(*) - COUNT(last_login) AS never_logged_in
FROM users;`,
    explanation:
      "NULL is tri-valued logic: TRUE / FALSE / UNKNOWN. = NULL always evaluates to UNKNOWN. Burns every developer at least once.",
  },
  {
    id: "db-inner-join",
    language: "databases",
    title: "INNER JOIN",
    tag: "sql",
    code: `-- Match users with their posts.
SELECT u.email, p.title
FROM users u
INNER JOIN posts p
  ON p.user_id = u.id        -- the join condition
ORDER BY u.email, p.created_at DESC;

-- INNER JOIN drops users with no posts AND posts with no user.
-- Only rows that match on both sides survive.`,
    explanation:
      "INNER is the default. ON spells out how rows match — usually FK = PK. Aliases (u, p) make the query readable.",
  },
  {
    id: "db-left-join",
    language: "databases",
    title: "LEFT JOIN — keep all from left",
    tag: "sql",
    code: `-- Get every user, with their post count (0 for users with none).
SELECT
  u.id,
  u.email,
  COUNT(p.id) AS post_count       -- counts non-NULL p.id values
FROM users u
LEFT JOIN posts p
  ON p.user_id = u.id
GROUP BY u.id, u.email;

-- LEFT JOIN keeps every user; users with no posts have NULL for p.id,
-- which COUNT(p.id) ignores -> 0.`,
    explanation:
      "LEFT JOIN preserves the left side. Combined with COUNT on the right, you get a per-row aggregate including zeros.",
  },
  {
    id: "db-anti-join",
    language: "databases",
    title: "Anti-join — find non-matches",
    tag: "sql",
    code: `-- Users who have NEVER posted.
SELECT u.id, u.email
FROM users u
LEFT JOIN posts p ON p.user_id = u.id
WHERE p.id IS NULL;            -- only rows where the join missed

-- Equivalent (often clearer):
SELECT u.id, u.email
FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM posts p WHERE p.user_id = u.id
);`,
    explanation:
      "LEFT JOIN + WHERE right.col IS NULL = the canonical 'find rows on the left without a partner on the right'. NOT EXISTS is sometimes clearer.",
  },
  {
    id: "db-group-by",
    language: "databases",
    title: "GROUP BY + HAVING",
    tag: "sql",
    code: `-- Top 10 most-active authors in 2024.
SELECT user_id, COUNT(*) AS post_count
FROM posts
WHERE created_at >= '2024-01-01'    -- WHERE filters rows
GROUP BY user_id                     -- group by author
HAVING COUNT(*) > 5                  -- HAVING filters groups
ORDER BY post_count DESC
LIMIT 10;

-- WHERE narrows BEFORE grouping; HAVING narrows AFTER aggregation.`,
    explanation:
      "Every SELECT column must be grouped or aggregated. Use WHERE for row-level filters; HAVING for filters that depend on aggregates.",
  },
  {
    id: "db-window-fn",
    language: "databases",
    title: "Window functions",
    tag: "sql",
    code: `-- Rank posts by views WITHIN each user — without collapsing rows.
SELECT
  user_id,
  id,
  title,
  views,
  ROW_NUMBER() OVER (
    PARTITION BY user_id              -- group (but don't collapse)
    ORDER BY views DESC               -- order within group
  ) AS rank_in_user
FROM posts;

-- Top 3 posts per user via the outer query:
-- WITH ranked AS (...)
-- SELECT * FROM ranked WHERE rank_in_user <= 3;`,
    explanation:
      "Window functions are aggregates that DON'T collapse rows. ROW_NUMBER, RANK, LAG/LEAD, SUM() OVER are the bread-and-butter.",
  },
  {
    id: "db-cte",
    language: "databases",
    title: "WITH (CTE) for readability",
    tag: "sql",
    code: `-- Name a subquery; reuse it in the main query.
WITH active_users AS (
    SELECT id
    FROM users
    WHERE last_login >= NOW() - INTERVAL '30 days'
),
recent_posts AS (
    SELECT p.*
    FROM posts p
    JOIN active_users a ON a.id = p.user_id
    WHERE p.created_at >= NOW() - INTERVAL '7 days'
)
SELECT user_id, COUNT(*) AS recent
FROM recent_posts
GROUP BY user_id
ORDER BY recent DESC
LIMIT 10;`,
    explanation:
      "CTEs (Common Table Expressions) read top-to-bottom — much clearer than nested subqueries. Postgres 12+ inlines them by default.",
  },
  {
    id: "db-upsert",
    language: "databases",
    title: "Upsert (Postgres ON CONFLICT)",
    tag: "sql",
    code: `-- Insert a row, OR update the existing one if it conflicts on (user_id, key).
INSERT INTO user_settings (user_id, key, value)
VALUES (1, 'theme', 'dark')
ON CONFLICT (user_id, key)
DO UPDATE
  SET value = EXCLUDED.value,        -- EXCLUDED = the proposed row
      updated_at = NOW();

-- MySQL alternative:
-- INSERT INTO ... VALUES (...)
-- ON DUPLICATE KEY UPDATE value = VALUES(value);`,
    explanation:
      "Upsert = idempotent write. Same call works for first insert and subsequent updates. Critical for cache tables, settings, counters.",
  },
  {
    id: "db-returning",
    language: "databases",
    title: "RETURNING (Postgres)",
    tag: "sql",
    code: `-- Get the new row's auto-generated id WITHOUT a follow-up SELECT.
INSERT INTO users (email)
VALUES ('ada@example.com')
RETURNING id, created_at;

-- Works on UPDATE and DELETE too:
UPDATE posts SET title = 'Hello' WHERE id = 42 RETURNING title, updated_at;
DELETE FROM posts WHERE id = 42 RETURNING id;`,
    explanation:
      "Saves a round-trip when you need the auto-generated id. SQL Server has the OUTPUT clause for the same idea.",
  },
  {
    id: "db-index-explain",
    language: "databases",
    title: "Index + EXPLAIN",
    tag: "perf",
    code: `-- Without an index: full table scan = O(n).
EXPLAIN ANALYZE
SELECT * FROM users WHERE email = 'ada@example.com';
-- Plan: "Seq Scan on users  cost=0..." — scans every row.

-- Add an index:
CREATE INDEX users_email_idx ON users(email);

-- Now:
EXPLAIN ANALYZE
SELECT * FROM users WHERE email = 'ada@example.com';
-- Plan: "Index Scan using users_email_idx" — O(log n) lookup.`,
    explanation:
      "Indexes turn O(n) scans into O(log n) lookups — but cost write speed and disk space. EXPLAIN ANALYZE shows the actual plan and timings.",
  },
  {
    id: "db-composite-index",
    language: "databases",
    title: "Composite index — order matters",
    tag: "perf",
    code: `-- Match the access pattern: posts WHERE user_id=? ORDER BY created_at DESC LIMIT N
CREATE INDEX posts_user_created_idx
ON posts(user_id, created_at DESC);

-- ✅ Uses the index (leading column user_id matches; sort matches).
SELECT * FROM posts
WHERE user_id = 5
ORDER BY created_at DESC
LIMIT 10;

-- ✅ Uses the index (range on second column after equality on first).
SELECT * FROM posts
WHERE user_id = 5 AND created_at > NOW() - INTERVAL '7 days';

-- ❌ Does NOT use the index — no leading user_id filter.
SELECT * FROM posts
WHERE created_at > NOW() - INTERVAL '7 days';`,
    explanation:
      "Composite indexes match left-to-right. Put the most-equality-filtered column first, range column last. Verify with EXPLAIN.",
  },
  {
    id: "db-tx-basics",
    language: "databases",
    title: "Transaction basics",
    tag: "tx",
    code: `-- Atomic: both updates succeed or neither does.
BEGIN;

UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;

COMMIT;     -- persist changes

-- Or, on error in the application:
-- ROLLBACK;     -- both rows back to original state

-- Without a transaction, a crash between the two UPDATEs destroys money.`,
    explanation:
      "Transactions give you atomicity — all-or-nothing. Always wrap multi-step writes that need to stay consistent.",
  },
  {
    id: "db-for-update",
    language: "databases",
    title: "SELECT ... FOR UPDATE — row lock",
    tag: "tx",
    code: `BEGIN;

-- Lock the row for the rest of the transaction.
-- Other transactions trying to UPDATE this row will WAIT.
SELECT count FROM stats WHERE id = 1 FOR UPDATE;

-- ... compute new value ...
UPDATE stats SET count = count + 1 WHERE id = 1;

COMMIT;

-- Without FOR UPDATE, two transactions reading the same value
-- and both writing back +1 would result in a single +1 instead of +2.`,
    explanation:
      "Row-level pessimistic locking. Use it for read-modify-write patterns where you can't use UPDATE x = x + 1 directly.",
  },
  {
    id: "db-isolation-level",
    language: "databases",
    title: "Isolation levels",
    tag: "tx",
    code: `-- Postgres / SQL standard, weakest -> strongest:
-- READ UNCOMMITTED    (rare; Postgres treats as Read Committed)
-- READ COMMITTED      (Postgres default)
-- REPEATABLE READ     (MySQL InnoDB default)
-- SERIALIZABLE        (strongest; may abort on conflict)

BEGIN;
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;

-- ... your reads + writes ...

COMMIT;
-- May fail with "could not serialize access" — app must retry.`,
    explanation:
      "Higher isolation = fewer anomalies (dirty reads, non-repeatable reads, phantoms) but more contention. Pick the weakest level your correctness needs.",
  },
  {
    id: "db-redis-cache-aside",
    language: "databases",
    title: "Redis cache-aside",
    tag: "redis",
    code: `# Read path
def get_user(id):
    cached = redis.get(f"user:{id}")
    if cached:
        return json.loads(cached)
    user = db.users.find_one({"id": id})
    redis.set(f"user:{id}", json.dumps(user), ex=300)   # 5 min TTL
    return user

# Write path — invalidate so next read picks up fresh
def update_user(id, patch):
    db.users.update({"id": id}, patch)
    redis.delete(f"user:{id}")`,
    explanation:
      "Cache-aside is the canonical pattern. App owns the cache: populates on miss, invalidates on write. Most read-heavy services use this.",
  },
  {
    id: "db-redis-zset",
    language: "databases",
    title: "Redis sorted set — leaderboard",
    tag: "redis",
    code: `# ZADD: add member with score (score = your sort key, e.g. points)
ZADD leaderboard 100 "alice"
ZADD leaderboard 200 "bob"
ZADD leaderboard 150 "carol"

# Top 10 (highest first)
ZREVRANGE leaderboard 0 9 WITHSCORES
# bob 200, carol 150, alice 100

# Increment a player's score (atomic)
ZINCRBY leaderboard 50 "alice"

# Their rank (0-indexed, lowest first by default; ZREVRANK for highest first)
ZREVRANK leaderboard "alice"`,
    explanation:
      "Sorted sets give you O(log n) insert + range queries by score. Used for leaderboards, time-series buckets, and rate limiters.",
  },
  {
    id: "db-pagination-cursor",
    language: "databases",
    title: "Cursor pagination beats offset",
    tag: "perf",
    code: `-- ❌ OFFSET pagination — gets slower the deeper you go,
-- and breaks if rows are inserted/deleted between pages.
SELECT * FROM posts ORDER BY id DESC LIMIT 20 OFFSET 10000;
-- Postgres scans 10020 rows, throws away 10000.

-- ✅ Cursor (keyset) pagination — O(1) regardless of depth.
SELECT * FROM posts
WHERE id < $last_seen_id      -- the cursor
ORDER BY id DESC
LIMIT 20;
-- Index on (id) makes this an instant range scan.`,
    explanation:
      "OFFSET is fine for small offsets; gets miserable at scale. Cursor pagination encodes 'where we left off' in the request — fast and stable.",
  },
  {
    id: "db-orm-n-plus-1",
    language: "databases",
    title: "Avoid N+1 queries",
    tag: "orm",
    code: `# ❌ N+1 — 1 query for users, then 1 per user for their posts = 101 queries
users = session.query(User).all()
for u in users:
    print(u.posts)               # lazy load triggers a query each time!

# ✅ Eager load — 2 queries total (one for users, one for all posts via IN-list)
from sqlalchemy.orm import selectinload
users = (
    session.query(User)
    .options(selectinload(User.posts))
    .all()
)
for u in users:
    print(u.posts)               # already loaded, no extra query`,
    explanation:
      "The most common ORM perf bug. Whenever you'll iterate a relationship, eager-load it. selectinload is the safe default.",
  },
];
