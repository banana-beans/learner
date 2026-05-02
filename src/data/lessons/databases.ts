// ============================================================
// Databases — All Tiers (T1–T5)
// ============================================================
// SQL examples target Postgres; differences with MySQL noted.
// ============================================================

import type { LessonContent } from "./python-basics";

export const databasesLessons: Record<string, LessonContent> = {
  // ── T1 ──
  "databases:t1:relational": {
    nodeId: "databases:t1:relational", title: "Relational Model",
    sections: [
      { heading: "Tables, Rows, Keys", body: "A relational database organizes data into tables (relations). Each row is a record; each column has a type. The primary key uniquely identifies a row — usually a synthetic id (SERIAL, UUID). Foreign keys reference primary keys in other tables — that's how relationships are expressed structurally rather than just by convention." },
      { heading: "Schema First, And Why", body: "You define columns, types, and constraints before inserting data. Constraints (NOT NULL, UNIQUE, CHECK, FOREIGN KEY) are enforced by the database, not the app. Trust the database to keep your data clean — every constraint you don't enforce becomes the bug you ship to production." },
      { heading: "Postgres vs MySQL Quick Notes", body: "Both are mature relational DBs. Postgres has stricter type safety, better JSON support (JSONB), CTEs, and richer indexing options (partial, expression, GIN). MySQL has historically been faster on simple workloads but has caught up on features. For new projects without a strong reason: Postgres is usually the better default. SQLite for embedded / single-process apps." },
    ],
    codeExamples: [
      { title: "Tables and FKs (Postgres)", code: `CREATE TABLE users (
  id          SERIAL PRIMARY KEY,
  email       TEXT UNIQUE NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE posts (
  id        SERIAL PRIMARY KEY,
  user_id   INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title     TEXT NOT NULL,
  body      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ON DELETE CASCADE: deleting a user deletes their posts.
-- Alternatives: RESTRICT (block delete), SET NULL.`, explanation: "users.id is the PK; posts.user_id is a FK. ON DELETE policies make referential integrity automatic." },
      { title: "Constraints enforce business rules", code: `CREATE TABLE orders (
  id      SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id),
  total   NUMERIC(12,2) NOT NULL CHECK (total >= 0),
  status  TEXT NOT NULL CHECK (status IN ('pending','paid','shipped','cancelled')),
  paid_at TIMESTAMPTZ,
  CHECK ( (status = 'paid') = (paid_at IS NOT NULL) )
);

-- A "paid" order must have paid_at set, and vice versa.
-- The DB will reject any row that violates this — even from
-- a buggy app deploy.`, explanation: "CHECK constraints catch business-rule violations at the storage layer. Belt and suspenders." },
      { title: "Postgres-specific niceties", code: `-- JSONB column for flexible attrs
CREATE TABLE products (
  id    SERIAL PRIMARY KEY,
  name  TEXT NOT NULL,
  attrs JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Index a JSONB key path
CREATE INDEX idx_products_brand ON products ((attrs->>'brand'));

-- Partial index: only index rows that match
CREATE INDEX idx_active_users ON users(email) WHERE deleted_at IS NULL;

-- Generated column
ALTER TABLE users
ADD COLUMN email_lower TEXT GENERATED ALWAYS AS (LOWER(email)) STORED;`, explanation: "JSONB, partial indexes, and generated columns are common reasons people pick Postgres over MySQL." },
    ],
    keyTakeaways: ["Tables = relations; rows = records", "Primary key uniquely identifies a row; foreign keys reference others", "Constraints enforce rules at the DB — trust them", "Postgres = stricter, more features; MySQL = simpler, fast", "ON DELETE CASCADE / RESTRICT / SET NULL controls cleanup behavior"],
  },
  "databases:t1:sql-basics": {
    nodeId: "databases:t1:sql-basics", title: "SQL Basics",
    sections: [
      { heading: "SELECT / FROM / WHERE", body: "SELECT lists columns; FROM names tables; WHERE filters rows. Add ORDER BY (ASC default, DESC explicit) for sort, LIMIT N OFFSET M for pagination. Logical evaluation order isn't lexical — FROM/WHERE happens first, then GROUP BY, HAVING, SELECT, ORDER BY, LIMIT. That's why you can't use a SELECT alias in a WHERE clause." },
      { heading: "Comparison And NULL", body: "= != < > <= >= for ordinary comparisons. Strings: LIKE for pattern (% wildcard, _ single char), ILIKE for case-insensitive (Postgres). Membership: IN (...). NULL is special — never use = NULL or != NULL; use IS NULL / IS NOT NULL. Logical operators on NULL produce NULL, which is treated as false in WHERE." },
      { heading: "DISTINCT, BETWEEN, COALESCE", body: "DISTINCT removes duplicate rows. BETWEEN a AND b is shorthand for a <= x AND x <= b (inclusive). COALESCE(a, b, c) returns the first non-null. CASE WHEN ... THEN ... END for conditional values. These small features clean up real queries — learn them once, use them everywhere." },
    ],
    codeExamples: [
      { title: "Filter, sort, paginate", code: `SELECT id, email, created_at
FROM users
WHERE created_at >= '2024-01-01'
  AND email ILIKE '%@example.com'
ORDER BY created_at DESC
LIMIT 20 OFFSET 40;

-- ILIKE = case-insensitive LIKE (Postgres-only).
-- MySQL uses LIKE with COLLATE, or LOWER() on both sides.

-- OFFSET pagination is fine for small offsets; gets slow at deep pages.
-- For huge tables, prefer cursor pagination (WHERE id < ?).`, explanation: "Standard pattern. Watch out for OFFSET on large tables — it scans and discards." },
      { title: "NULL handling done right", code: `-- NEVER do this
SELECT * FROM users WHERE last_login = NULL;     -- always returns 0 rows!
SELECT * FROM users WHERE last_login != NULL;    -- same problem

-- DO this
SELECT * FROM users WHERE last_login IS NULL;
SELECT * FROM users WHERE last_login IS NOT NULL;

-- Counting: COUNT(*) counts rows; COUNT(col) counts non-NULL values
SELECT
  COUNT(*) AS total_users,
  COUNT(last_login) AS logged_in_users,
  COUNT(*) - COUNT(last_login) AS never_logged_in
FROM users;`, explanation: "NULL is a tri-valued logic. = NULL always evaluates to NULL (treated as false). Burnt every developer at least once." },
      { title: "COALESCE + CASE", code: `-- COALESCE: first non-null
SELECT
  id,
  COALESCE(display_name, email, 'Anonymous') AS shown_name
FROM users;

-- CASE: conditional expression
SELECT
  id,
  total,
  CASE
    WHEN total < 50  THEN 'small'
    WHEN total < 500 THEN 'medium'
    ELSE 'large'
  END AS size_bucket
FROM orders;`, explanation: "COALESCE for fallback; CASE for derived columns. Both work in WHERE, GROUP BY, ORDER BY too." },
    ],
    keyTakeaways: ["SELECT ... FROM ... WHERE ... ORDER BY ... LIMIT", "NULL: use IS NULL / IS NOT NULL; never = NULL", "LIKE '%x%' for pattern; ILIKE in Postgres for case-insensitive", "OFFSET pagination scales poorly — prefer cursor pagination", "COALESCE for fallback; CASE for conditional expressions"],
  },
  "databases:t1:crud": {
    nodeId: "databases:t1:crud", title: "CRUD Operations",
    sections: [
      { heading: "INSERT, UPDATE, DELETE", body: "INSERT INTO t(cols) VALUES (...) — always specify columns explicitly. UPDATE t SET col=val WHERE ... — never UPDATE without WHERE unless you really mean every row. DELETE FROM t WHERE ... — same warning. Forgetting WHERE on UPDATE/DELETE is famously how outages happen; some teams require transactions just to enforce 'roll back on surprise.'" },
      { heading: "RETURNING And Upsert", body: "Postgres lets INSERT/UPDATE/DELETE return rows: ... RETURNING id, created_at. Saves a follow-up SELECT. Upsert (insert or update on conflict): INSERT ... ON CONFLICT (col) DO UPDATE SET .... MySQL has INSERT ... ON DUPLICATE KEY UPDATE. Use this for idempotent inserts where you don't know if the row exists." },
      { heading: "Bulk Operations", body: "Inserting 10,000 rows one at a time is slow. Use multi-row inserts: INSERT INTO t VALUES (...), (...), (...). For huge loads, COPY FROM (Postgres) or LOAD DATA INFILE (MySQL) — orders of magnitude faster than INSERTs. Run bulk operations in transactions to avoid partial failures and to enable rollback." },
    ],
    codeExamples: [
      { title: "INSERT with RETURNING (Postgres)", code: `INSERT INTO users (email)
VALUES ('ada@example.com')
RETURNING id, created_at;

-- One round-trip — get the auto-generated ID and timestamp without
-- a follow-up SELECT.
-- MySQL alternative: INSERT then SELECT LAST_INSERT_ID().`, explanation: "RETURNING is a Postgres feature that saves a query. Useful in app code that needs the new ID immediately." },
      { title: "Upsert (Postgres)", code: `INSERT INTO user_settings (user_id, key, value)
VALUES (1, 'theme', 'dark')
ON CONFLICT (user_id, key)
DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- ON CONFLICT names the unique constraint that triggers the update.
-- EXCLUDED refers to the proposed-but-rejected row.

-- MySQL equivalent
-- INSERT INTO user_settings (...) VALUES (...)
-- ON DUPLICATE KEY UPDATE value = VALUES(value), updated_at = NOW();`, explanation: "Upsert is idempotent: 'set this row to this value, regardless of whether it exists.' Common for caching tables, settings, counters." },
      { title: "Safe UPDATE / DELETE", code: `-- ALWAYS include a WHERE
UPDATE posts SET title = 'Hello' WHERE id = 42;
DELETE FROM posts WHERE id = 42;

-- Safety net: wrap risky changes in a transaction
BEGIN;
DELETE FROM posts WHERE author_id = 999;
SELECT COUNT(*) FROM posts WHERE author_id = 999;  -- verify
-- ROLLBACK; if surprised
COMMIT;

-- Some DBs / clients let you require WHERE — e.g. MySQL Workbench
-- 'safe updates' mode rejects UPDATE/DELETE without WHERE.`, explanation: "Forgetting WHERE on UPDATE/DELETE is the canonical 'how did production break' moment." },
    ],
    keyTakeaways: ["INSERT INTO t(cols) VALUES (...) — list columns explicitly", "UPDATE/DELETE always need WHERE (almost always)", "RETURNING (Postgres) gets generated values without an extra query", "Upsert: ON CONFLICT (Postgres) / ON DUPLICATE KEY (MySQL)", "Wrap risky changes in transactions for verify-before-commit"],
  },

  // ── T2 ──
  "databases:t2:joins": {
    nodeId: "databases:t2:joins", title: "JOINs",
    sections: [
      { heading: "INNER, LEFT, RIGHT, FULL", body: "INNER JOIN keeps only rows with a match in both sides. LEFT JOIN keeps every row from the left, with NULLs for unmatched right side. RIGHT JOIN is the mirror (rarely used; rewrite as LEFT). FULL OUTER JOIN keeps unmatched on both sides. CROSS JOIN gives the Cartesian product — every left row paired with every right." },
      { heading: "ON vs WHERE", body: "ON spells out the join condition. WHERE filters the result. With INNER JOINs they're often interchangeable; with LEFT JOINs they're not. WHERE on the right table effectively turns a LEFT JOIN into an INNER JOIN — because NULLs don't match the WHERE clause. To filter the right side while keeping the LEFT semantics, put the filter in the ON clause." },
      { heading: "Self-Join And Anti-Join", body: "Self-join: join a table to itself. Useful for hierarchies (employee → manager) and same-row comparisons. Anti-join: LEFT JOIN + WHERE right.col IS NULL — find rows in left that have no match in right. Common pattern: 'users without orders', 'tags not used by any post'." },
    ],
    codeExamples: [
      { title: "INNER vs LEFT", code: `-- Users + posts; only users WITH posts
SELECT u.email, p.title
FROM users u
INNER JOIN posts p ON p.user_id = u.id
ORDER BY u.email;

-- Users + posts; ALL users, even with no posts
SELECT u.email, p.title
FROM users u
LEFT JOIN posts p ON p.user_id = u.id;
-- Users with no posts get one row with title = NULL.`, explanation: "INNER drops unmatched; LEFT keeps the left side." },
      { title: "Anti-join: users without posts", code: `SELECT u.id, u.email
FROM users u
LEFT JOIN posts p ON p.user_id = u.id
WHERE p.id IS NULL;

-- Equivalent with NOT EXISTS (often the preferred form)
SELECT u.id, u.email
FROM users u
WHERE NOT EXISTS (
  SELECT 1 FROM posts p WHERE p.user_id = u.id
);`, explanation: "Both work; NOT EXISTS is sometimes clearer and lets the planner short-circuit." },
      { title: "ON vs WHERE pitfall", code: `-- WRONG — turns LEFT JOIN into INNER JOIN
SELECT u.email, p.title
FROM users u
LEFT JOIN posts p ON p.user_id = u.id
WHERE p.created_at > '2024-01-01';
-- Users with no posts have p.created_at = NULL → fails the WHERE
-- → those users dropped from result. Surprising.

-- RIGHT — filter belongs in the ON clause
SELECT u.email, p.title
FROM users u
LEFT JOIN posts p
  ON p.user_id = u.id AND p.created_at > '2024-01-01';
-- Now users with no recent posts still appear, with NULL title.`, explanation: "On vs Where matters with outer joins. Burns nearly everyone once." },
    ],
    keyTakeaways: ["INNER: only matched; LEFT: keeps all from left", "ON spells the match; WHERE filters the result", "WHERE on the right side of LEFT JOIN turns it into INNER JOIN", "Anti-join: LEFT JOIN + WHERE right.col IS NULL (or NOT EXISTS)", "Self-joins solve hierarchies and same-row comparisons"],
  },
  "databases:t2:aggregation": {
    nodeId: "databases:t2:aggregation", title: "GROUP BY & Aggregates",
    sections: [
      { heading: "Aggregate Functions", body: "COUNT, SUM, AVG, MIN, MAX over groups of rows. GROUP BY turns rows into groups; aggregates apply per group. Every column in the SELECT must be either aggregated or in the GROUP BY — otherwise the meaning is ambiguous (Postgres rejects it; MySQL historically returned arbitrary values, fixed in modern versions)." },
      { heading: "WHERE vs HAVING", body: "WHERE filters rows before grouping; HAVING filters groups after aggregation. WHERE total > 100 picks rows with total > 100; HAVING SUM(total) > 100 picks groups whose summed total exceeds 100. Don't use HAVING for row-level filters that don't depend on aggregates — it's slower and confusing." },
      { heading: "Window Functions", body: "Aggregates without collapsing rows. ROW_NUMBER() OVER (PARTITION BY x ORDER BY y) numbers rows within partitions. SUM() OVER (...) gives running totals. LAG / LEAD reach into adjacent rows. Window functions express things that used to require self-joins or correlated subqueries — much faster and clearer." },
    ],
    codeExamples: [
      { title: "GROUP BY + HAVING", code: `-- Top 10 most-active authors in 2024
SELECT user_id, COUNT(*) AS post_count
FROM posts
WHERE created_at >= '2024-01-01'
GROUP BY user_id
HAVING COUNT(*) > 5
ORDER BY post_count DESC
LIMIT 10;`, explanation: "WHERE narrows to 2024 rows. GROUP BY collects per user. HAVING narrows to active groups. ORDER BY + LIMIT picks top." },
      { title: "Window functions: rank within group", code: `-- Top 3 most-read posts per user
SELECT user_id, id, title, views
FROM (
  SELECT
    user_id, id, title, views,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY views DESC) AS rn
  FROM posts
) ranked
WHERE rn <= 3;`, explanation: "PARTITION BY = group; ORDER BY inside the OVER ranks within each group. Filter on the outer query." },
      { title: "Running total", code: `SELECT
  date,
  daily_revenue,
  SUM(daily_revenue) OVER (ORDER BY date) AS running_total
FROM daily_revenue
ORDER BY date;

-- Window covers all rows up to the current; SUM() gives running total.
-- LAG(daily_revenue, 1) OVER (ORDER BY date) → previous day's value
-- → useful for change-over-time computations.`, explanation: "Window functions handle running totals, deltas, ranks, percentiles. The tool that lets you do analytics in SQL without ugly self-joins." },
    ],
    keyTakeaways: ["GROUP BY plus aggregates collapse rows into groups", "Every SELECT column must be in GROUP BY or aggregated", "WHERE filters rows; HAVING filters groups", "Window functions: aggregates without collapsing rows", "ROW_NUMBER, RANK, LAG/LEAD, SUM() OVER are the bread-and-butter"],
  },
  "databases:t2:subqueries": {
    nodeId: "databases:t2:subqueries", title: "Subqueries & CTEs",
    sections: [
      { heading: "Subquery Forms", body: "Scalar subquery (returns one value): SELECT (SELECT MAX(x) FROM t) .... IN-list: WHERE id IN (SELECT id FROM ...). EXISTS: WHERE EXISTS (SELECT 1 FROM ... WHERE ...). Correlated subquery: references the outer query, runs once per outer row — sometimes the planner can rewrite, sometimes you must do it manually." },
      { heading: "CTEs (WITH Clauses)", body: "WITH name AS (SELECT ...) lets you name a subquery and reuse it in the main query. Reads top-to-bottom — easier to follow than nested subqueries. Most modern DBs treat CTEs as inlinable hints (Postgres 12+; MySQL 8+). Older Postgres (<= 11) materialized them as fences, which sometimes hurt performance." },
      { heading: "Recursive CTEs", body: "WITH RECURSIVE traverses hierarchical or graph-like data. Anchor query (base case) plus recursive step joined back to the CTE. Common uses: org charts, file trees, dependency graphs, finding paths. Always include a termination condition or you can spin forever." },
    ],
    codeExamples: [
      { title: "CTE for readability", code: `WITH active_users AS (
  SELECT id
  FROM users
  WHERE last_login >= NOW() - INTERVAL '30 days'
),
active_posts AS (
  SELECT p.*
  FROM posts p
  JOIN active_users a ON a.id = p.user_id
)
SELECT user_id, COUNT(*) AS post_count
FROM active_posts
GROUP BY user_id
ORDER BY post_count DESC
LIMIT 10;`, explanation: "Two CTEs make the intent obvious. Same query as a nested subquery would be much harder to read." },
      { title: "Recursive CTE: org chart", code: `WITH RECURSIVE chain AS (
  -- Anchor: start from CEO (no manager)
  SELECT id, manager_id, name, 1 AS depth
  FROM employees
  WHERE manager_id IS NULL

  UNION ALL

  -- Recursive: people whose manager is in the chain so far
  SELECT e.id, e.manager_id, e.name, c.depth + 1
  FROM employees e
  JOIN chain c ON e.manager_id = c.id
)
SELECT id, name, depth FROM chain ORDER BY depth, id;`, explanation: "Anchor + UNION ALL + recursive step. Termination = no more rows match the recursive case." },
      { title: "EXISTS vs IN", code: `-- EXISTS: stops at the first match per outer row
SELECT u.*
FROM users u
WHERE EXISTS (
  SELECT 1 FROM posts p WHERE p.user_id = u.id
);

-- IN with subquery: equivalent for non-NULL keys
SELECT u.*
FROM users u
WHERE u.id IN (SELECT user_id FROM posts);

-- For NULL-safety and large lists, EXISTS is generally preferred.
-- For NOT IN with possible NULLs in subquery — never.
-- (NULL in the IN list returns NULL → no rows match.)`, explanation: "EXISTS short-circuits and is NULL-safe. NOT IN with NULLs is a famous footgun." },
    ],
    keyTakeaways: ["Subqueries: scalar, IN, EXISTS, correlated", "CTEs name subqueries; read top-to-bottom", "Recursive CTEs traverse hierarchies — always include termination", "EXISTS is generally preferred over IN for subqueries", "NOT IN with possibly-NULL subquery results = nothing matches (footgun)"],
  },

  // ── T3 ──
  "databases:t3:indexing": {
    nodeId: "databases:t3:indexing", title: "Indexing",
    sections: [
      { heading: "What Indexes Do", body: "Without an index, the DB does a full table scan: O(n). A B-tree index turns equality and range lookups into O(log n). Hash indexes are O(1) for equality but useless for ranges. Most indexes you create are B-tree (the default). Specialty types: GIN (full-text, JSONB), BRIN (huge sorted tables), GiST (geometric)." },
      { heading: "Trade-offs", body: "Indexes speed reads but slow writes (every INSERT/UPDATE updates all indexes on the table). They take disk space (often as much as the data itself for indexed columns). Each index is a wager: 'I'll spend write time and disk to save read time.' Profile with EXPLAIN ANALYZE before adding more." },
      { heading: "Composite Indexes And Order Matters", body: "An index on (a, b) supports queries on a alone, on (a, b), but NOT on b alone. Order matters: put the most-filtering / equality column first, range column last. Covering indexes (Postgres INCLUDE clause) add columns that are stored in the index but not part of the key — lets the DB answer the query entirely from the index without touching the table." },
    ],
    codeExamples: [
      { title: "Create + verify with EXPLAIN", code: `CREATE INDEX users_email_idx ON users(email);

EXPLAIN ANALYZE
SELECT * FROM users WHERE email = 'ada@example.com';

-- Look for: "Index Scan using users_email_idx"
-- vs (without the index): "Seq Scan on users"
-- The actual times confirm the win.`, explanation: "EXPLAIN ANALYZE shows the actual plan and timing. Always confirm the index is being used." },
      { title: "Composite index leading column", code: `CREATE INDEX posts_user_created_idx
ON posts(user_id, created_at DESC);

-- This index supports:
SELECT * FROM posts WHERE user_id = 5 ORDER BY created_at DESC LIMIT 10;
-- ✅ uses the index (leading column matches; sort order matches)

SELECT * FROM posts WHERE user_id = 5 AND created_at > NOW() - INTERVAL '7 days';
-- ✅ uses the index (range on second column after equality on first)

SELECT * FROM posts WHERE created_at > NOW() - INTERVAL '7 days';
-- ❌ does NOT use the index (no leading user_id filter)`, explanation: "Composite index is left-prefix matching. Plan accordingly." },
      { title: "Covering index (Postgres)", code: `-- Index that includes payload columns to avoid table reads
CREATE INDEX users_email_covering
ON users(email) INCLUDE (id, created_at);

EXPLAIN ANALYZE
SELECT id, email, created_at
FROM users WHERE email = 'ada@example.com';
-- Look for "Index Only Scan" — the index has everything needed.

-- Trade-off: bigger index, slower writes — but reads avoid the table.`, explanation: "INCLUDE adds columns to the index without making them part of the key. 'Index Only Scan' = no table touched." },
    ],
    keyTakeaways: ["Indexes turn O(n) scans into O(log n) lookups", "B-tree default; specialty types (GIN, BRIN, GiST) for specific workloads", "Composite indexes match leading columns — order matters", "Trade: faster reads vs slower writes vs disk space", "Use EXPLAIN ANALYZE to verify the plan; don't guess"],
  },
  "databases:t3:normalization": {
    nodeId: "databases:t3:normalization", title: "Normalization",
    sections: [
      { heading: "Normal Forms (Practical Read)", body: "1NF: atomic columns (no comma-separated lists, no repeating groups). 2NF: every non-key column depends on the WHOLE primary key (matters mainly for composite PKs). 3NF: no transitive dependencies (non-key column depending on another non-key column). For OLTP, you typically aim for 3NF / Boyce-Codd Normal Form (BCNF). Higher forms (4NF, 5NF) rarely matter in practice." },
      { heading: "Why Normalize", body: "Avoid update anomalies (change in one place, forget to update other copies). Avoid storage waste from duplicated data. Make queries cleaner — joins reflect the real entity relationships. Most application data fits naturally into a normalized schema; it's denormalization that requires deliberate justification." },
      { heading: "Denormalization Strategies", body: "Read-heavy workloads sometimes pay too much in joins; deliberately denormalize for read speed. Common patterns: cached counts (post.comment_count instead of COUNT(*)), denormalized search columns (search_text concatenated from elsewhere), snapshot tables (precomputed dashboards). Cost: keeping copies in sync. Use triggers, application-level updates, or scheduled jobs." },
    ],
    codeExamples: [
      { title: "Bad: repeating groups (anti-1NF)", code: `-- Anti-pattern: tag1, tag2, tag3 columns
CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  title TEXT,
  tag1 TEXT, tag2 TEXT, tag3 TEXT
);

-- Querying 'all posts with tag X' requires checking 3 columns.
-- Adding a 4th tag = schema change.
-- Counting tags across posts = ugly.`, explanation: "Repeating columns lock in arbitrary limits and make queries painful." },
      { title: "Good: many-to-many (3NF)", code: `CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  title TEXT
);
CREATE TABLE tags (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE
);
CREATE TABLE post_tags (
  post_id INT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  tag_id  INT NOT NULL REFERENCES tags(id),
  PRIMARY KEY (post_id, tag_id)
);

-- 'Posts with tag X':
SELECT p.* FROM posts p
JOIN post_tags pt ON pt.post_id = p.id
JOIN tags t ON t.id = pt.tag_id
WHERE t.name = 'python';`, explanation: "Two side tables + a join table. Query any tag, any number per post, no schema changes for new tags." },
      { title: "Cached count (deliberate denorm)", code: `-- Adding a comment_count column to avoid repeated COUNT(*) on hot pages
ALTER TABLE posts ADD COLUMN comment_count INT NOT NULL DEFAULT 0;

-- Keep in sync with a trigger
CREATE OR REPLACE FUNCTION update_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET comment_count = comment_count + 1
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET comment_count = comment_count - 1
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER comments_count_trigger
AFTER INSERT OR DELETE ON comments
FOR EACH ROW EXECUTE FUNCTION update_post_comment_count();`, explanation: "Denormalize when read frequency dominates. The trigger keeps it consistent; you trade write complexity for read speed." },
    ],
    keyTakeaways: ["1NF atomic, 2NF whole-key dep, 3NF no transitive deps", "OLTP: aim for 3NF / BCNF by default", "Many-to-many = side tables + join table with composite PK", "Denormalize deliberately for reads — pay with sync overhead", "Triggers, app-level updates, or scheduled jobs keep denorms fresh"],
  },

  // ── T4 ──
  "databases:t4:nosql": {
    nodeId: "databases:t4:nosql", title: "NoSQL Models",
    sections: [
      { heading: "The Four Families", body: "Document (MongoDB, Firestore, DynamoDB document API): JSON-like records. Key-value (Redis, DynamoDB, etcd): O(1) map by key. Wide column (Cassandra, HBase, ScyllaDB): rows with sparse columns, optimized for huge scale. Graph (Neo4j, Neptune): nodes + edges, relationship traversal. Each fits different workloads — picking by family is a bigger decision than picking within." },
      { heading: "Trade-offs With Relational", body: "NoSQL trades flexibility (schema-on-read, denormalized) for joins (often awkward or absent) and consistency (often eventual). Most NoSQL systems are great at one access pattern but bad at others — the schema is the access pattern. Choose by query: heavy joins, ad-hoc reporting → relational. Key-driven access at huge scale → NoSQL. Graph traversals → graph DB." },
      { heading: "Modeling For Access Patterns", body: "Relational: model the entities, query later. NoSQL: figure out queries first, then design the schema to make them fast. Document stores embed related data when read together (one round-trip, denormalized). Wide columns shape rows by their primary access pattern. Graph DBs let you traverse relationships in constant time per hop." },
    ],
    codeExamples: [
      { title: "Document store: embed for read pattern", code: `// MongoDB: a user document with embedded recent activity
{
  "_id": "u_1",
  "email": "ada@example.com",
  "profile": {
    "name": "Ada",
    "bio": "engineer"
  },
  "recent_posts": [
    { "id": "p_99", "title": "Hello", "created_at": "2024-..." },
    { "id": "p_98", "title": "More",  "created_at": "2024-..." }
  ]
}

// One read returns the whole user view. No joins.
// Trade: 'all posts by user' lives elsewhere; updating a post's
// title means updating the embed too.`, explanation: "Embed when you always read together. Reference (separate document) when you don't, or when the embed grows unbounded." },
      { title: "Key-value: Redis patterns", code: `# Simple key-value
SET user:1:email "ada@example.com"
GET user:1:email

# Counter
INCR user:1:visits
INCRBY user:1:score 10

# Set / sorted set / hash / list — Redis is more than KV
HSET user:1 name "Ada" age 36         # hash
HGETALL user:1
SADD post:99:tags python redis db    # set
ZADD leaderboard 200 "alice"         # sorted set with score
ZREVRANGE leaderboard 0 9            # top 10`, explanation: "Redis's data structures cover many caching and counting patterns. Not just KV." },
      { title: "Wide column: Cassandra access pattern", code: `-- Modeled by query: 'show last N posts in a forum, paginated'
CREATE TABLE forum_posts (
  forum_id     UUID,
  created_at   TIMESTAMP,
  post_id      UUID,
  author_id    UUID,
  body         TEXT,
  PRIMARY KEY ((forum_id), created_at, post_id)
) WITH CLUSTERING ORDER BY (created_at DESC, post_id ASC);

-- (forum_id) = partition key (all rows for one forum live on one node)
-- created_at, post_id = clustering columns (sorted within partition)
-- Query: SELECT * FROM forum_posts WHERE forum_id = ? LIMIT 50;
-- → reads one partition, returns the most recent 50 — instant.`, explanation: "Cassandra: partition + clustering keys ARE the access pattern. Other queries (across forums, by author) need different tables." },
    ],
    keyTakeaways: ["Document, key-value, wide column, graph — four families", "NoSQL schemas reflect access patterns, not entities", "Embed in documents when always read together", "Wide column: partition key = where; clustering = order", "Use the right family per workload — don't force one tool everywhere"],
  },
  "databases:t4:redis": {
    nodeId: "databases:t4:redis", title: "Redis Patterns",
    sections: [
      { heading: "Caching", body: "Cache-aside: app reads cache; on miss, reads DB and populates. Set TTLs (EXPIRE, or SET with EX) to bound staleness. INCR makes hot counters trivial — no row contention. Redis is in-memory: fast (sub-millisecond) but RAM-bounded. With persistence (RDB snapshots, AOF) you survive restarts; without, the cache is ephemeral." },
      { heading: "Beyond Caching", body: "Sorted sets (ZADD/ZRANGE) for leaderboards, time-series, rate limiters. Streams (XADD/XREAD) for log-style event processing. Pub/sub for real-time fan-out (lossy, no persistence). Locks via SET key val NX EX for short-lived coordination — the classic Redlock algorithm exists for distributed locking but has limitations; for serious mutual exclusion, use a real consensus system like Zookeeper or etcd." },
      { heading: "When Not To Use Redis", body: "Long-lived durable storage (it's a cache, mostly). Anything where data loss is unacceptable without proper persistence + replication setup. Massive datasets that don't fit in RAM. Complex queries that aren't key-driven (no SQL). Often the right answer: Redis for hot data, durable DB for the rest." },
    ],
    codeExamples: [
      { title: "Cache-aside in Python", code: `import json
import redis as redis_lib
redis = redis_lib.Redis()

def get_user(id):
    cached = redis.get(f"user:{id}")
    if cached:
        return json.loads(cached)
    user = db.users.find_one({"id": id})
    redis.set(f"user:{id}", json.dumps(user), ex=300)  # 5 min TTL
    return user

def update_user(id, patch):
    db.users.update({"id": id}, patch)
    redis.delete(f"user:{id}")  # invalidate`, explanation: "Read-through cache + invalidate-on-write. The most common pattern." },
      { title: "Sorted set leaderboard", code: `# Add scores
ZADD leaderboard 100 "alice"
ZADD leaderboard 200 "bob"
ZADD leaderboard 150 "carol"

# Top 10 (highest first)
ZREVRANGE leaderboard 0 9 WITHSCORES
# bob 200, carol 150, alice 100

# alice's rank (0-indexed, lowest first by default)
ZREVRANK leaderboard "alice"   # → 2 (third place)

# Update by delta
ZINCRBY leaderboard 50 "alice"`, explanation: "Sorted sets are the right tool for ranks, time-windowed counts, and 'top N' patterns." },
      { title: "Distributed lock (use sparingly)", code: `# Acquire
ok = redis.set("lock:resource", "<unique_id>", nx=True, ex=10)
if ok:
    try:
        # do work
        ...
    finally:
        # Release ONLY if we still own the lock
        # (simplified — real implementations use Lua)
        if redis.get("lock:resource") == b"<unique_id>":
            redis.delete("lock:resource")

# Limitation: a slow client whose work exceeds 10s loses the lock.
# Another worker could acquire it and both run concurrently.
# For serious mutual exclusion: use Zookeeper / etcd / Postgres advisory locks.`, explanation: "Redis locks are good for short-lived coordination. For correctness-critical exclusion, use stronger primitives." },
    ],
    keyTakeaways: ["Cache-aside is the default Redis pattern", "Always set TTLs on cache entries", "Sorted sets for leaderboards, time-series, rate limiters", "Streams for event-style processing; pub/sub for lossy fan-out", "Don't use Redis as durable storage without proper persistence + replication"],
  },

  // ── T5 ──
  "databases:t5:transactions": {
    nodeId: "databases:t5:transactions", title: "Transactions & ACID",
    sections: [
      { heading: "ACID", body: "Atomicity: all-or-nothing — either all changes commit or none do. Consistency: invariants (constraints, triggers) preserved across the transaction. Isolation: concurrent transactions don't see each other's intermediate state. Durability: committed data survives crashes (subject to fsync settings; some configurations relax this for speed). The 'A' is what app code relies on most directly." },
      { heading: "Isolation Levels", body: "From weakest to strongest: Read Uncommitted (rare), Read Committed (Postgres default), Repeatable Read (MySQL InnoDB default), Serializable. Higher = safer = more contention. Each level prevents specific anomalies: dirty reads, non-repeatable reads, phantom reads. Postgres SERIALIZABLE uses serializable snapshot isolation (SSI); on conflict it aborts one transaction with a serialization failure that you must retry." },
      { heading: "Locking And Deadlocks", body: "SELECT ... FOR UPDATE locks rows for the rest of the transaction. SELECT ... FOR SHARE locks for read but allows others to also read. Deadlocks happen when two transactions hold locks the other wants — DBs detect and abort one with a deadlock error. Mitigations: always lock in a consistent order, keep transactions short, avoid client-side wait inside a transaction." },
    ],
    codeExamples: [
      { title: "Atomic transfer", code: `BEGIN;

UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;

-- If both succeed:
COMMIT;
-- If anything fails, the app should:
-- ROLLBACK;
-- → both rows back to original state.`, explanation: "All-or-nothing. Without a transaction, a crash between the two UPDATEs destroys money." },
      { title: "Avoiding lost updates", code: `BEGIN;

-- Lock the row for the rest of the transaction
SELECT count FROM stats WHERE id = 1 FOR UPDATE;

-- Now compute and write — no other transaction can touch this row
-- until we commit.
UPDATE stats SET count = count + 1 WHERE id = 1;

COMMIT;

-- Without FOR UPDATE, two transactions reading the same value and
-- both writing back +1 would result in a single +1 instead of +2.`, explanation: "Concurrent counter increments need either FOR UPDATE locking or relying on the DB to serialize via UPDATE x = x + 1 (which Postgres handles correctly under default isolation)." },
      { title: "Serializable + retry pattern", code: `# In Postgres SERIALIZABLE, a transaction may abort on commit with
# a serialization failure. The app must retry.

import psycopg2
from psycopg2 import errors

def transfer(from_id, to_id, amount, retries=3):
    for attempt in range(retries):
        try:
            with conn:  # transaction
                with conn.cursor() as cur:
                    cur.execute("SET TRANSACTION ISOLATION LEVEL SERIALIZABLE")
                    cur.execute("UPDATE accounts SET balance = balance - %s WHERE id = %s",
                                (amount, from_id))
                    cur.execute("UPDATE accounts SET balance = balance + %s WHERE id = %s",
                                (amount, to_id))
            return  # success
        except errors.SerializationFailure:
            if attempt == retries - 1: raise
            time.sleep(0.01 * (2 ** attempt))  # backoff`, explanation: "SERIALIZABLE = strongest correctness guarantee, but app must retry on conflict. Standard pattern: retry with exponential backoff." },
    ],
    keyTakeaways: ["ACID: Atomicity, Consistency, Isolation, Durability", "Default isolation: Read Committed (Postgres), Repeatable Read (MySQL InnoDB)", "Higher isolation = fewer anomalies, more contention", "FOR UPDATE / row locks prevent lost updates", "SERIALIZABLE may abort on conflict — app must retry"],
  },
  "databases:t5:orm": {
    nodeId: "databases:t5:orm", title: "ORMs & Migrations",
    sections: [
      { heading: "What ORMs Buy You", body: "ORM (Object-Relational Mapper) maps DB rows to language objects. SQLAlchemy (Python), Prisma (TypeScript), Entity Framework Core (.NET), ActiveRecord (Rails). Wins: type safety, refactor-friendly queries, automatic relationships, parameterized queries by default. Costs: an abstraction layer; the last 20% of queries need raw SQL or careful tuning." },
      { heading: "The N+1 Problem", body: "The most common ORM performance bug. Load 100 users, then access each user's posts in a loop = 1 + 100 queries. Fix with eager loading: SQLAlchemy's selectinload or joinedload, Prisma's include, EF Core's Include. Always think about access patterns: if you'll touch related data, load it together." },
      { heading: "Migrations", body: "Version-controlled schema changes. Tools: Alembic (SQLAlchemy), Prisma Migrate, EF Core migrations, Flyway, Liquibase. Each migration is a script — applied in order, recorded in a metadata table. ALWAYS review the generated SQL before running on production. Backwards-compatible deploys: add columns as nullable, deploy code that writes to both old and new, backfill, then make NOT NULL — never break the running app on deploy." },
    ],
    codeExamples: [
      { title: "ORM-flavored query (SQLAlchemy)", code: `from sqlalchemy import select
from sqlalchemy.orm import selectinload

# Eager load posts to avoid N+1
stmt = (
    select(User)
    .options(selectinload(User.posts))
    .where(User.active == True)
    .limit(10)
)
users = session.scalars(stmt).all()

for u in users:
    for p in u.posts:        # already loaded — no per-user query
        print(p.title)`, explanation: "selectinload triggers ONE additional query for all the posts in a single IN-list — instead of 100 individual queries." },
      { title: "Avoiding N+1 — three load strategies", code: `# selectinload — one extra query, IN-list of IDs (best default)
from sqlalchemy.orm import selectinload
session.scalars(select(User).options(selectinload(User.posts)))

# joinedload — one query with LEFT OUTER JOIN
from sqlalchemy.orm import joinedload
session.scalars(select(User).options(joinedload(User.posts)))
# Good for one-to-one or small one-to-many; can explode rows for big collections.

# subqueryload — one query with a correlated subquery
from sqlalchemy.orm import subqueryload
session.scalars(select(User).options(subqueryload(User.posts)))

# WRONG (N+1) — no eager loading
users = session.scalars(select(User)).all()
for u in users:
    for p in u.posts:        # lazy load triggers a query per user!
        ...`, explanation: "Pick by relationship cardinality. selectinload is the safe default; joinedload risks row explosion on collections." },
      { title: "Backwards-compatible migration", code: `# Goal: rename users.fullname → users.full_name without downtime.
#
# Step 1 (deploy 1): ADD COLUMN full_name; copy values to it via trigger.
ALTER TABLE users ADD COLUMN full_name TEXT;
UPDATE users SET full_name = fullname;
CREATE TRIGGER sync_user_name
BEFORE INSERT OR UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION sync_full_name();   -- copies fullname → full_name

# App code: read full_name, fall back to fullname; write to both.
#
# Step 2 (deploy 2): app reads/writes full_name only. Drop trigger.
#
# Step 3 (deploy 3): drop fullname column.
ALTER TABLE users DROP COLUMN fullname;

# Three deploys; no downtime; rollback-safe at each step.`, explanation: "Schema changes are slow when done correctly. Don't rename columns in one shot on a live system." },
    ],
    keyTakeaways: ["ORMs map rows to objects — convenience + safety, with overhead", "N+1 is the most common ORM perf bug — eager-load relationships", "selectinload (IN-list) is the safe default; joinedload for small one-to-one", "Migrations: review SQL before running; always backwards-compatible", "Big schema changes = multiple deploys, never one-shot on a live system"],
  },
};
