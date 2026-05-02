import type { Challenge } from "@/lib/types";

const m = (
  partial: Omit<Challenge, "lang" | "type" | "isBoss" | "starterCode" | "tags"> & Partial<Pick<Challenge, "tags" | "isBoss" | "starterCode">>
): Challenge => ({ type: "write_from_scratch", isBoss: false, starterCode: "", tags: ["databases", "sql"], lang: "manual", ...partial });

export const databasesChallenges: Challenge[] = [
  m({ id: "db-rel-1", nodeId: "databases:t1:relational", title: "Users + posts schema", description: "Design users + posts tables with appropriate PK/FK/constraints.", difficulty: 2, isBoss: true,
    hints: [
      { tier: "nudge", text: "users: PK on id; posts: FK to users.id.", xpPenalty: 0.9 },
      { tier: "guide", text: "TIMESTAMP DEFAULT NOW() for created_at.", xpPenalty: 0.75 },
      { tier: "reveal", text: `CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id),
  title TEXT NOT NULL
);`, xpPenalty: 0.5 },
    ], baseXP: 180 }),
  m({ id: "db-sql-1", nodeId: "databases:t1:sql-basics", title: "Recent users", description: "SELECT id, email of users created in 2024 ordered by created_at DESC, limit 20.", difficulty: 1,
    hints: [
      { tier: "nudge", text: "WHERE created_at >= '2024-01-01' AND created_at < '2025-01-01'", xpPenalty: 0.9 },
      { tier: "guide", text: "ORDER BY ... DESC; LIMIT 20.", xpPenalty: 0.75 },
      { tier: "reveal", text: `SELECT id, email
FROM users
WHERE created_at >= '2024-01-01' AND created_at < '2025-01-01'
ORDER BY created_at DESC
LIMIT 20;`, xpPenalty: 0.5 },
    ], baseXP: 130 }),
  m({ id: "db-crud-1", nodeId: "databases:t1:crud", title: "Insert returning ID", description: "INSERT a user and RETURN the new id.", difficulty: 1,
    hints: [
      { tier: "nudge", text: "RETURNING clause (Postgres).", xpPenalty: 0.9 },
      { tier: "guide", text: "INSERT INTO ... VALUES ... RETURNING id;", xpPenalty: 0.75 },
      { tier: "reveal", text: `INSERT INTO users (email) VALUES ('ada@example.com') RETURNING id;`, xpPenalty: 0.5 },
    ], baseXP: 100 }),
  m({ id: "db-join-1", nodeId: "databases:t2:joins", title: "Users without posts", description: "Find users who have written zero posts.", difficulty: 2, isBoss: true,
    hints: [
      { tier: "nudge", text: "LEFT JOIN + WHERE p.id IS NULL.", xpPenalty: 0.9 },
      { tier: "guide", text: "Anti-join pattern.", xpPenalty: 0.75 },
      { tier: "reveal", text: `SELECT u.id, u.email
FROM users u
LEFT JOIN posts p ON p.user_id = u.id
WHERE p.id IS NULL;`, xpPenalty: 0.5 },
    ], baseXP: 200 }),
  m({ id: "db-agg-1", nodeId: "databases:t2:aggregation", title: "Posts per user, top 10", description: "SELECT user_id, COUNT(*) — group by user, sort desc, top 10.", difficulty: 2,
    hints: [
      { tier: "nudge", text: "GROUP BY user_id; ORDER BY post_count DESC.", xpPenalty: 0.9 },
      { tier: "guide", text: "Alias the count.", xpPenalty: 0.75 },
      { tier: "reveal", text: `SELECT user_id, COUNT(*) AS post_count
FROM posts
GROUP BY user_id
ORDER BY post_count DESC
LIMIT 10;`, xpPenalty: 0.5 },
    ], baseXP: 150 }),
  m({ id: "db-sub-1", nodeId: "databases:t2:subqueries", title: "Active-user posts via CTE", description: "CTE active_users (logged in last 30 days). Join posts to it.", difficulty: 3,
    hints: [
      { tier: "nudge", text: "WITH active_users AS (SELECT id FROM users WHERE last_login >= NOW() - INTERVAL '30 days')", xpPenalty: 0.9 },
      { tier: "guide", text: "JOIN to the CTE on user_id.", xpPenalty: 0.75 },
      { tier: "reveal", text: `WITH active_users AS (
  SELECT id FROM users WHERE last_login >= NOW() - INTERVAL '30 days'
)
SELECT p.* FROM posts p JOIN active_users a ON a.id = p.user_id;`, xpPenalty: 0.5 },
    ], baseXP: 220 }),
  m({ id: "db-idx-1", nodeId: "databases:t3:indexing", title: "Composite index for posts feed", description: "Create the right index for: WHERE user_id = ? ORDER BY created_at DESC LIMIT 10.", difficulty: 2,
    hints: [
      { tier: "nudge", text: "Lead with the filter column, follow with the sort column.", xpPenalty: 0.9 },
      { tier: "guide", text: "DESC matters for the sort column.", xpPenalty: 0.75 },
      { tier: "reveal", text: `CREATE INDEX posts_user_created_idx
ON posts(user_id, created_at DESC);`, xpPenalty: 0.5 },
    ], baseXP: 180 }),
  m({ id: "db-norm-1", nodeId: "databases:t3:normalization", title: "Many-to-many tags", description: "Replace tag1/tag2/tag3 columns with proper M:N tables.", difficulty: 2,
    hints: [
      { tier: "nudge", text: "Two side-tables (posts, tags) + a join table.", xpPenalty: 0.9 },
      { tier: "guide", text: "Composite PK on the join table.", xpPenalty: 0.75 },
      { tier: "reveal", text: `CREATE TABLE posts (id SERIAL PRIMARY KEY, title TEXT);
CREATE TABLE tags  (id SERIAL PRIMARY KEY, name TEXT UNIQUE);
CREATE TABLE post_tags (
  post_id INT REFERENCES posts(id),
  tag_id  INT REFERENCES tags(id),
  PRIMARY KEY (post_id, tag_id)
);`, xpPenalty: 0.5 },
    ], baseXP: 150 }),
  m({ id: "db-nosql-1", nodeId: "databases:t4:nosql", title: "Document model for blog", description: "Sketch a document representing a user with embedded posts.", difficulty: 1,
    hints: [
      { tier: "nudge", text: "Embed posts when reading user → posts is the common access path.", xpPenalty: 0.9 },
      { tier: "guide", text: "JSON document with a posts array.", xpPenalty: 0.75 },
      { tier: "reveal", text: `{
  "_id": "u_1",
  "email": "ada@example.com",
  "posts": [
    { "id": "p_1", "title": "Hi" },
    { "id": "p_2", "title": "More" }
  ]
}`, xpPenalty: 0.5 },
    ], baseXP: 100 }),
  m({ id: "db-redis-1", nodeId: "databases:t4:redis", title: "Cache-aside skeleton", description: "Pseudocode for read-through cache with 5-min TTL.", difficulty: 2,
    hints: [
      { tier: "nudge", text: "Check cache, fall back to DB, populate cache.", xpPenalty: 0.9 },
      { tier: "guide", text: "redis.set(..., ex=300) for TTL.", xpPenalty: 0.75 },
      { tier: "reveal", text: `val = redis.get(f"user:{id}:profile")
if val is None:
    val = db.fetch_user(id)
    redis.set(f"user:{id}:profile", json.dumps(val), ex=300)
return val`, xpPenalty: 0.5 },
    ], baseXP: 150 }),
  m({ id: "db-tx-1", nodeId: "databases:t5:transactions", title: "Transfer transaction", description: "Atomic transfer of 100 from account 1 to account 2.", difficulty: 2, isBoss: true,
    hints: [
      { tier: "nudge", text: "BEGIN, two UPDATEs, COMMIT.", xpPenalty: 0.9 },
      { tier: "guide", text: "Roll back if either fails.", xpPenalty: 0.75 },
      { tier: "reveal", text: `BEGIN;
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT;`, xpPenalty: 0.5 },
    ], baseXP: 200 }),
  m({ id: "db-orm-1", nodeId: "databases:t5:orm", title: "Avoid N+1 with eager load", description: "Fetch users with their posts in two queries (not 101).", difficulty: 2,
    hints: [
      { tier: "nudge", text: "selectinload or joinedload (SQLAlchemy).", xpPenalty: 0.9 },
      { tier: "guide", text: "Use the eager-load option on the relationship.", xpPenalty: 0.75 },
      { tier: "reveal", text: `users = session.query(User).options(selectinload(User.posts)).all()`, xpPenalty: 0.5 },
    ], baseXP: 180 }),
];
