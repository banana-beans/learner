import type { LessonContent } from "./python-basics";

export const databasesLessons: Record<string, LessonContent> = {
  "databases:t1:relational": {
    nodeId: "databases:t1:relational", title: "Relational Model",
    sections: [
      { heading: "Tables, Rows, Keys", body: "A relational database organizes data into tables (relations). Each row is a record; each column has a type. The primary key uniquely identifies a row. Foreign keys reference primary keys in other tables — that's how relations between tables are expressed." },
      { heading: "Schema First", body: "You define the schema (column types, constraints, keys) before inserting data. Constraints — NOT NULL, UNIQUE, CHECK, FOREIGN KEY — are enforced by the database, not the app. Trust the database to keep your data clean." },
    ],
    codeExamples: [
      { title: "Tables and FKs", code: `CREATE TABLE users (
  id        SERIAL PRIMARY KEY,
  email     TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE posts (
  id      SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id),
  title   TEXT NOT NULL
);`, explanation: "users.id is the PK; posts.user_id is a FK referencing it." },
      { title: "Constraints", code: `CREATE TABLE orders (
  id         SERIAL PRIMARY KEY,
  total      NUMERIC CHECK (total >= 0),
  status     TEXT CHECK (status IN ('pending', 'paid', 'shipped'))
);`, explanation: "CHECK constraints enforce business rules at the DB level." },
    ],
    keyTakeaways: ["Tables = relations; rows = records", "Primary key uniquely identifies a row", "Foreign key references another table's primary key", "Constraints enforce data quality at the DB"],
  },
  "databases:t1:sql-basics": {
    nodeId: "databases:t1:sql-basics", title: "SQL Basics",
    sections: [
      { heading: "SELECT / FROM / WHERE", body: "SELECT lists columns, FROM names the table, WHERE filters rows. ORDER BY sorts (ASC default, DESC for descending). LIMIT N caps rows; OFFSET skips. Pagination: ORDER BY id LIMIT 10 OFFSET 20." },
      { heading: "Comparison and Logic", body: "= != < > <= >= for numeric/string. IS NULL / IS NOT NULL — never = NULL. Combine with AND, OR, NOT. LIKE for pattern matching ('%' wildcard). IN (...) for membership." },
    ],
    codeExamples: [
      { title: "Filter and order", code: `SELECT id, email, created_at
FROM users
WHERE created_at >= '2024-01-01'
  AND email LIKE '%@example.com'
ORDER BY created_at DESC
LIMIT 20;`, explanation: "Read top-to-bottom: select cols, filter rows, sort, limit." },
      { title: "NULL handling", code: `SELECT id, last_login
FROM users
WHERE last_login IS NULL;     -- never use = NULL`, explanation: "NULL is its own thing — comparisons with it return UNKNOWN, not true/false." },
    ],
    keyTakeaways: ["SELECT ... FROM ... WHERE ... ORDER BY ... LIMIT", "NULL: use IS NULL / IS NOT NULL", "LIKE '%foo%' for substring; '_' for single char", "AND > OR — use parentheses to be explicit"],
  },
  "databases:t1:crud": {
    nodeId: "databases:t1:crud", title: "CRUD Operations",
    sections: [
      { heading: "INSERT, UPDATE, DELETE", body: "INSERT INTO t(cols) VALUES (...) — always specify columns. UPDATE t SET col=val WHERE ... — never UPDATE without WHERE unless you really mean every row. DELETE FROM t WHERE ... — same warning." },
      { heading: "RETURNING", body: "Postgres lets INSERT/UPDATE/DELETE return rows: ... RETURNING id, created_at. Saves a roundtrip when you need the auto-generated ID. SQL Server uses OUTPUT for similar effect." },
    ],
    codeExamples: [
      { title: "Insert with returning", code: `INSERT INTO users (email)
VALUES ('ada@example.com')
RETURNING id, created_at;`, explanation: "One round-trip — get the ID and timestamp without a follow-up SELECT." },
      { title: "Safe UPDATE", code: `-- Always include a WHERE!
UPDATE posts
SET title = 'Hello'
WHERE id = 42;`, explanation: "Forgetting WHERE updates every row in the table. Famous outage cause." },
    ],
    keyTakeaways: ["INSERT INTO t(cols) VALUES (...) — list columns explicitly", "UPDATE/DELETE always need WHERE (almost always)", "RETURNING (Postgres) gets generated values without an extra query", "Use transactions for multi-step writes"],
  },
  "databases:t2:joins": {
    nodeId: "databases:t2:joins", title: "JOINs",
    sections: [
      { heading: "INNER vs LEFT", body: "INNER JOIN keeps only rows with a match in both sides. LEFT JOIN keeps every row from the left, with NULLs for unmatched right side. RIGHT JOIN is the mirror; FULL JOIN keeps unmatched on both sides." },
      { heading: "Join Conditions", body: "ON spells out how rows match. Joining on FK == PK is the typical case. You can join on multiple conditions — but be careful of accidental Cartesian explosions when the condition is wrong." },
    ],
    codeExamples: [
      { title: "Users + posts", code: `SELECT u.email, p.title
FROM users u
INNER JOIN posts p ON p.user_id = u.id
ORDER BY u.email;`, explanation: "Inner join — users without posts are excluded." },
      { title: "Find users without posts", code: `SELECT u.email
FROM users u
LEFT JOIN posts p ON p.user_id = u.id
WHERE p.id IS NULL;`, explanation: "Classic 'anti-join' — LEFT JOIN + NULL filter on the right side." },
    ],
    keyTakeaways: ["INNER: only matched rows; LEFT: keeps all from left", "ON spells out the match; bad ON = Cartesian product", "LEFT JOIN + WHERE right.col IS NULL = anti-join", "Self-joins join a table to itself for hierarchical queries"],
  },
  "databases:t2:aggregation": {
    nodeId: "databases:t2:aggregation", title: "GROUP BY & Aggregates",
    sections: [
      { heading: "Aggregate Functions", body: "COUNT, SUM, AVG, MIN, MAX. GROUP BY turns rows into groups, applying aggregates per group. Every column in SELECT must be either aggregated or in GROUP BY." },
      { heading: "WHERE vs HAVING", body: "WHERE filters rows before grouping; HAVING filters groups after aggregation. WHERE total > 100 → only big rows; HAVING SUM(total) > 100 → only big groups." },
    ],
    codeExamples: [
      { title: "Posts per user", code: `SELECT user_id, COUNT(*) AS post_count
FROM posts
GROUP BY user_id
ORDER BY post_count DESC
LIMIT 10;`, explanation: "Group by the user, count rows per group, order by the aggregate." },
      { title: "WHERE vs HAVING", code: `SELECT user_id, COUNT(*) AS post_count
FROM posts
WHERE created_at >= '2024-01-01'
GROUP BY user_id
HAVING COUNT(*) > 5;`, explanation: "WHERE narrows rows; HAVING narrows groups." },
    ],
    keyTakeaways: ["GROUP BY plus aggregates collapse rows into groups", "Every SELECT column must be in GROUP BY or aggregated", "WHERE filters rows; HAVING filters groups", "COUNT(*) counts rows; COUNT(col) counts non-null values"],
  },
  "databases:t2:subqueries": {
    nodeId: "databases:t2:subqueries", title: "Subqueries & CTEs",
    sections: [
      { heading: "Subquery Forms", body: "Scalar (returns one value): WHERE col > (SELECT AVG(col) FROM t). IN-list: WHERE id IN (SELECT id FROM ...). Correlated: references the outer query — runs per outer row, often slower." },
      { heading: "CTEs", body: "WITH name AS (SELECT ...) lets you name a subquery and reuse it. Reads top-to-bottom. Recursive CTEs (WITH RECURSIVE) traverse hierarchies — org charts, graphs, paths." },
    ],
    codeExamples: [
      { title: "CTE", code: `WITH active_users AS (
  SELECT id FROM users WHERE last_login >= NOW() - INTERVAL '30 days'
)
SELECT p.*
FROM posts p
JOIN active_users a ON a.id = p.user_id;`, explanation: "Name the active_users subquery, then join to it." },
      { title: "Recursive CTE — chain", code: `WITH RECURSIVE chain AS (
  SELECT id, manager_id, name FROM employees WHERE id = 1
  UNION ALL
  SELECT e.id, e.manager_id, e.name
  FROM employees e
  JOIN chain c ON e.manager_id = c.id
)
SELECT * FROM chain;`, explanation: "Anchor + recursive case + UNION ALL = traverse the hierarchy." },
    ],
    keyTakeaways: ["Subqueries: scalar, IN-list, correlated", "CTEs name subqueries — read top-to-bottom", "Recursive CTEs traverse hierarchies", "Correlated subqueries can be slow — consider rewriting"],
  },
  "databases:t3:indexing": {
    nodeId: "databases:t3:indexing", title: "Indexing",
    sections: [
      { heading: "Why Indexes", body: "Without an index, the DB does a full table scan: O(n). A B-tree index turns lookups into O(log n). Hash indexes are O(1) for equality but useless for ranges. Most indexes you'll create are B-tree (the default in Postgres/MySQL)." },
      { heading: "Trade-offs", body: "Indexes speed reads but slow writes (every INSERT/UPDATE updates the index). They take disk space. Index columns that appear often in WHERE, JOIN, or ORDER BY. Don't index everything — measure with EXPLAIN ANALYZE." },
    ],
    codeExamples: [
      { title: "Create + use an index", code: `CREATE INDEX users_email_idx ON users(email);

EXPLAIN ANALYZE
SELECT * FROM users WHERE email = 'ada@example.com';
-- Should now show "Index Scan using users_email_idx"`, explanation: "EXPLAIN ANALYZE shows the actual plan and timing." },
      { title: "Composite index", code: `CREATE INDEX posts_user_created_idx
ON posts(user_id, created_at DESC);

-- Used by:
SELECT * FROM posts
WHERE user_id = 5
ORDER BY created_at DESC
LIMIT 10;`, explanation: "Composite indexes match leading-column queries. Order matters." },
    ],
    keyTakeaways: ["Indexes turn O(n) scans into O(log n) lookups", "B-tree default; hash for equality only", "Cost: write speed + disk space", "Use EXPLAIN ANALYZE to verify the plan", "Composite indexes match leading columns"],
  },
  "databases:t3:normalization": {
    nodeId: "databases:t3:normalization", title: "Normalization",
    sections: [
      { heading: "1NF / 2NF / 3NF", body: "1NF: atomic columns (no lists). 2NF: every non-key column depends on the WHOLE primary key. 3NF: no transitive dependencies (non-key → non-key). Usually you target 3NF for OLTP." },
      { heading: "Denormalization", body: "Sometimes you duplicate data deliberately for read speed: cached counts, search-friendly columns, snapshot tables. The cost is keeping copies in sync. Denormalize at the boundary, not by default." },
    ],
    codeExamples: [
      { title: "Bad: repeating tags", code: `-- Anti-pattern: tag1, tag2, tag3 columns
CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  title TEXT,
  tag1 TEXT, tag2 TEXT, tag3 TEXT
);`, explanation: "Hard to query, hard to extend. Should be a separate tags table + join table." },
      { title: "Better: normalized", code: `CREATE TABLE posts (id SERIAL PRIMARY KEY, title TEXT);
CREATE TABLE tags  (id SERIAL PRIMARY KEY, name TEXT UNIQUE);
CREATE TABLE post_tags (
  post_id INT REFERENCES posts(id),
  tag_id  INT REFERENCES tags(id),
  PRIMARY KEY (post_id, tag_id)
);`, explanation: "Many-to-many through a join table. Query any tag, any number of tags per post." },
    ],
    keyTakeaways: ["1NF atomic, 2NF whole-key dep, 3NF no transitive deps", "Many-to-many = join table with composite PK", "Denormalize for reads — pay with sync overhead", "OLTP = normalized; OLAP = often denormalized"],
  },
  "databases:t4:nosql": {
    nodeId: "databases:t4:nosql", title: "NoSQL Models",
    sections: [
      { heading: "The Four Families", body: "Document (MongoDB, Firestore): JSON-like records. Key-value (Redis, DynamoDB): map by key. Wide column (Cassandra, HBase): rows with sparse columns. Graph (Neo4j): nodes + edges. Each fits different workloads." },
      { heading: "Trade-offs With Relational", body: "NoSQL trades flexibility (schema-on-read, denormalized) for joins (often awkward) and consistency (often eventual). Choose by access pattern: heavy joins → relational; key-driven access at scale → NoSQL; graph traversals → graph DB." },
    ],
    codeExamples: [
      { title: "Document store (MongoDB-ish)", code: `{
  "_id": "u_1",
  "email": "ada@example.com",
  "posts": [
    { "id": "p_1", "title": "Hi" },
    { "id": "p_2", "title": "More" }
  ]
}`, explanation: "Embed posts in the user. No JOIN needed for the common access path." },
      { title: "Key-value (Redis)", code: `SET user:1:email "ada@example.com"
GET user:1:email
INCR user:1:visits
EXPIRE session:abc123 3600`, explanation: "Simple commands; values are strings (or hashes/lists/sets/zsets in Redis)." },
    ],
    keyTakeaways: ["Document, key-value, wide column, graph", "Document: JSON-like, embed access patterns", "Key-value: O(1) lookup, no joins", "Graph: traversals; relational: joins; pick by workload"],
  },
  "databases:t4:redis": {
    nodeId: "databases:t4:redis", title: "Redis Patterns",
    sections: [
      { heading: "Caching", body: "Cache-aside: app reads cache; on miss, read DB, populate cache, return. Set TTLs (EXPIRE) to bound staleness. INCR makes hot counters trivial. Redis is in-memory — fast but limited by RAM." },
      { heading: "Beyond Caching", body: "Pub/sub for real-time fan-out. Sorted sets (ZADD/ZRANGE) for leaderboards and time-series. Streams for log-style event processing. Locks (SET key val NX EX) for short-lived coordination." },
    ],
    codeExamples: [
      { title: "Cache-aside", code: `# Pseudocode
val = redis.get(f"user:{id}:profile")
if val is None:
    val = db.fetch_user(id)
    redis.set(f"user:{id}:profile", json.dumps(val), ex=300)
return val`, explanation: "Read-through cache with a 5-minute TTL." },
      { title: "Sorted set leaderboard", code: `ZADD leaderboard 100 "alice"
ZADD leaderboard 200 "bob"
ZADD leaderboard 150 "carol"

ZREVRANGE leaderboard 0 2 WITHSCORES
-- bob 200, carol 150, alice 100`, explanation: "Members ordered by score; ZREVRANGE for top-N." },
    ],
    keyTakeaways: ["Cache-aside is the canonical pattern", "Always set TTL on cache entries", "Sorted sets for leaderboards / time-series", "SET key val NX EX = poor-man's distributed lock", "In-memory: fast, RAM-bounded"],
  },
  "databases:t5:transactions": {
    nodeId: "databases:t5:transactions", title: "Transactions & ACID",
    sections: [
      { heading: "ACID", body: "Atomicity: all-or-nothing. Consistency: invariants preserved. Isolation: concurrent transactions don't see each other's intermediate state. Durability: committed data survives crash. The 'A' is the most often relied on by app code." },
      { heading: "Isolation Levels", body: "Read uncommitted (rare), Read committed (default), Repeatable read, Serializable. Higher = safer = slower. Phantoms, dirty reads, non-repeatable reads — each level prevents specific anomalies." },
    ],
    codeExamples: [
      { title: "Transaction", code: `BEGIN;
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT;
-- ROLLBACK; if anything goes wrong`, explanation: "Both updates succeed or neither does." },
      { title: "Avoiding lost updates", code: `BEGIN;
SELECT count FROM stats WHERE id = 1 FOR UPDATE;
-- ... compute new value ...
UPDATE stats SET count = ... WHERE id = 1;
COMMIT;`, explanation: "FOR UPDATE locks the row until COMMIT — prevents two transactions from overwriting each other." },
    ],
    keyTakeaways: ["ACID: Atomicity, Consistency, Isolation, Durability", "Default isolation is usually Read Committed", "Higher isolation = fewer anomalies, more contention", "FOR UPDATE / row locks prevent lost updates", "Always set a transaction timeout"],
  },
  "databases:t5:orm": {
    nodeId: "databases:t5:orm", title: "ORMs & Migrations",
    sections: [
      { heading: "ORM Basics", body: "ORM (Object-Relational Mapper) maps DB rows to language objects. SQLAlchemy (Python), Prisma (Node), EF Core (.NET), ActiveRecord (Rails). Trade SQL fluency for code-fluency. The 80/20 rule: most queries are easy in an ORM, the last 20% need raw SQL." },
      { heading: "N+1 And Migrations", body: "N+1 query: load 100 users, then load each user's posts in a loop = 101 queries. Fix with eager loading (joins, IN). Migrations: version-controlled schema changes, applied in order. Always review the SQL before running on production." },
    ],
    codeExamples: [
      { title: "ORM-flavored query", code: `# SQLAlchemy
users = session.query(User).filter(User.active == True).limit(10).all()

# vs raw SQL
SELECT * FROM users WHERE active = TRUE LIMIT 10;`, explanation: "ORM expression compiles to SQL. Type-checked, refactor-safe — at the cost of an abstraction layer." },
      { title: "Avoiding N+1", code: `# WRONG — N+1
users = session.query(User).all()
for u in users:
    print(u.posts)  # one query per user!

# RIGHT — eager load
users = session.query(User).options(selectinload(User.posts)).all()`, explanation: "selectinload (or joinedload) batches related rows in a single query." },
    ],
    keyTakeaways: ["ORMs map rows to objects — 80% easy, 20% needs SQL", "N+1 is the most common ORM perf bug", "selectinload / joinedload for eager loading", "Migrations = versioned schema changes; review SQL before applying"],
  },
};
