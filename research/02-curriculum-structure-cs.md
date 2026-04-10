# 02 -- Curriculum Structure: Computer Science Foundations

> Research doc 2 of 12 | learner app | 2026-04-09
>
> Purpose: Define the full topic taxonomy, prerequisite graph, and learning
> paths for all 10 skill tree branches. This document is the blueprint that
> every future curriculum, challenge, and progression decision will reference.

---

## Table of Contents

1. Curriculum Design Principles
2. Core Computer Science Topics (7 domains, full taxonomy)
3. Prerequisite Dependency Graph
4. Learning Path Recommendations
5. Topic Granularity -- Breaking Topics into Lesson Nodes
6. Assessment Alignment -- Topic-to-Challenge Mapping
7. Application: Curriculum Architecture for Learner

---

## 1. Curriculum Design Principles

### 1.1 ACM/IEEE CS Curriculum Guidelines (CS2013)

The ACM/IEEE Computer Science Curricula 2013 report (CS2013) remains the most
widely referenced framework for structuring undergraduate CS education. Its key
recommendations relevant to learner:

- **Knowledge Areas (KAs)**: CS2013 organizes CS into 18 knowledge areas
  (Algorithms, Architecture, Discrete Math, Graphics, HCI, IAS, Networking,
  OS, PBD, PL, SDF, SE, SF, SP, etc.). Our 10 branches map onto a practical
  subset of these KAs, biased toward software engineering practice over theory.
- **Knowledge Units (KUs)**: Within each KA, CS2013 defines knowledge units
  with tiered hours: Core-Tier1 (every student), Core-Tier2 (vast majority),
  and Elective. We adopt this tiering -- Tier 1 nodes unlock first, Tier 2
  requires completion of Tier 1, Elective nodes are bonus content.
- **Learning Outcomes**: Every KU has measurable outcomes using Bloom's verbs
  ("implement," "analyze," "design"). We attach one Bloom's-level outcome to
  every node.
- **Curricular Hours**: CS2013 estimates ~300 hours of core instruction for a
  4-year program. Our branches target ~40-80 hours each, totaling ~500-600
  hours for a motivated learner covering all 10 branches -- roughly comparable
  to a CS minor plus practical engineering depth.

### 1.2 Bloom's Taxonomy Applied to Programming

Bloom's Taxonomy provides six cognitive levels. For a coding-centric app, we
map them to concrete programming activities:

| Bloom's Level | Verb Examples         | Programming Activity                              |
|---------------|-----------------------|---------------------------------------------------|
| 1. Remember   | define, list, recall  | Recall syntax, name data structures, list steps   |
| 2. Understand | explain, summarize    | Trace code execution, explain what code does       |
| 3. Apply      | implement, use, solve | Write code that uses a concept (e.g., use a dict) |
| 4. Analyze    | compare, debug, test  | Debug code, analyze complexity, compare approaches |
| 5. Evaluate   | justify, critique     | Code review, choose between designs, assess tradeoffs |
| 6. Create     | design, architect     | Build a system from scratch, design an API         |

**Rule**: Every node has exactly one primary Bloom's level. Most Tier 1 nodes
are levels 1-3. Tier 2 nodes are levels 3-5. Elective/capstone nodes reach
level 6. This prevents the common mistake of asking beginners to "design a
system" before they can "implement a function."

### 1.3 The Spiral Curriculum (Bruner)

Jerome Bruner's spiral curriculum principle states that learners should
encounter the same concept multiple times at increasing levels of complexity.
In learner, this manifests as:

- **First encounter** (Tier 1): Introduce the concept with a simple example.
  E.g., "Hash table" -- learn what it is, use Python's `dict`.
- **Second encounter** (Tier 2): Deeper mechanics. E.g., implement a hash
  table from scratch, handle collisions, analyze amortized O(1).
- **Third encounter** (cross-domain): Apply in context. E.g., use hash tables
  to build a database index, or design a distributed cache (Systems Design).

The skill tree handles spiraling naturally: the same concept (e.g., "caching")
appears as a node in DS&A (LRU cache implementation), in Databases (query
cache), and in Systems Design (CDN / Redis layer). Each node references the
others as "related concepts."

### 1.4 Prerequisite Dependency Management

The primary constraint in curriculum design is minimizing "forward references"
-- moments where the learner needs concept X but hasn't been taught it yet.

**Rules for dependency management:**

1. **Hard prerequisites** are enforced by the unlock system. A node cannot be
   started until all hard prereqs are complete. These should be rare (2-3 per
   node maximum).
2. **Soft prerequisites** are recommended but not enforced. The node can be
   attempted without them, but the learner may struggle. Displayed as "you
   might want to try X first."
3. **No circular dependencies.** The dependency graph must be a DAG (directed
   acyclic graph). If A requires B and B requires A, one dependency must be
   demoted to soft.
4. **Cross-domain dependencies are soft by default.** We never require a
   learner to complete a node in a different branch before starting a node in
   their current branch. This preserves branch independence while still
   signaling useful connections.
5. **Topological ordering within each branch.** Nodes within a branch are
   sequenced so that every hard prerequisite comes earlier in the sequence.

---

## 2. Core Computer Science Topics

Each domain below lists its topics, subtopics, tier (T1/T2/E), Bloom's level,
and prerequisite dependencies.

**Tier key**: T1 = Core Tier 1 (foundational), T2 = Core Tier 2 (intermediate),
E = Elective (advanced/specialized)

### 2a. Programming Fundamentals (language-agnostic)

This is the root domain. Every other domain depends on it.

| # | Topic                  | Subtopics                                                | Tier | Bloom's | Hard Prereqs       |
|---|------------------------|----------------------------------------------------------|------|---------|--------------------|
| F1 | Variables & Types     | declaration, primitive types, type coercion, constants    | T1   | 2       | --                 |
| F2 | Expressions & Operators | arithmetic, comparison, logical, bitwise, precedence   | T1   | 2       | F1                 |
| F3 | Control Flow -- Conditionals | if/else, switch/match, ternary, truthiness          | T1   | 3       | F2                 |
| F4 | Control Flow -- Loops | for, while, do-while, break/continue, iteration patterns | T1   | 3       | F3                 |
| F5 | Functions              | definition, parameters, return values, pure functions    | T1   | 3       | F4                 |
| F6 | Scope & Closures       | local/global scope, lexical scoping, closures, hoisting  | T2   | 4       | F5                 |
| F7 | Built-in Data Structures | arrays/lists, dictionaries/maps, sets, tuples          | T1   | 3       | F5                 |
| F8 | String Manipulation    | concatenation, formatting, regex basics, encoding        | T1   | 3       | F7                 |
| F9 | Error Handling         | exceptions, try/catch/finally, custom errors, error types | T1  | 3       | F5                 |
| F10 | I/O & File Handling   | stdin/stdout, file read/write, paths, serialization      | T2   | 3       | F7, F9             |
| F11 | OOP -- Classes & Objects | class definition, instantiation, attributes, methods  | T1   | 3       | F5, F7             |
| F12 | OOP -- Inheritance     | subclasses, method override, super(), MRO               | T2   | 4       | F11                |
| F13 | OOP -- Polymorphism    | duck typing, interfaces, abstract classes, protocols     | T2   | 4       | F12                |
| F14 | OOP -- Encapsulation   | access modifiers, properties, getters/setters            | T2   | 4       | F11                |
| F15 | Modules & Packaging    | imports, packages, namespaces, dependency management     | T2   | 3       | F5                 |
| F16 | Functional Programming | map/filter/reduce, lambda, immutability, higher-order fn | T2  | 4       | F6, F7             |
| F17 | Iterators & Generators | iterator protocol, generators, lazy evaluation           | E    | 4       | F6, F7             |
| F18 | Concurrency Basics     | threads, async/await, promises, event loop concepts      | E    | 5       | F6, F9             |
| F19 | Type Systems           | static vs dynamic, type annotations, generics basics     | E    | 4       | F11                |
| F20 | Testing Fundamentals   | unit tests, assertions, test structure, mocking basics   | T2   | 3       | F5, F9             |

**Node count: 20**

### 2b. Data Structures & Algorithms

| # | Topic                      | Subtopics                                              | Tier | Bloom's | Hard Prereqs     |
|---|----------------------------|--------------------------------------------------------|------|---------|--------------------|
| D1 | Complexity Analysis       | Big O notation, time vs space, best/avg/worst case      | T1   | 4       | F5                 |
| D2 | Amortized & Space Analysis | amortized analysis, space complexity, trade-offs        | T2   | 4       | D1                 |
| D3 | Arrays -- Deep Dive        | dynamic arrays, contiguous memory, resizing, 2D arrays | T1   | 3       | F7, D1             |
| D4 | Linked Lists               | singly, doubly, circular, operations, vs arrays         | T1   | 3       | D1, F11            |
| D5 | Stacks                     | LIFO, push/pop, applications (parsing, undo)           | T1   | 3       | D3                 |
| D6 | Queues                     | FIFO, deques, circular queue, applications (BFS)       | T1   | 3       | D3                 |
| D7 | Hash Tables                | hashing functions, collisions, chaining, open addressing | T1  | 4       | D3                 |
| D8 | Binary Trees               | traversals (in/pre/post/level), properties, recursion   | T1   | 3       | D4                 |
| D9 | Binary Search Trees        | insert, delete, search, balancing concepts              | T2   | 4       | D8                 |
| D10 | Balanced Trees            | AVL, Red-Black concepts, self-balancing guarantees      | E    | 5       | D9                 |
| D11 | Tries                     | prefix trees, autocomplete, word search                 | E    | 4       | D8                 |
| D12 | Heaps & Priority Queues   | min/max heap, heapify, heap sort, applications          | T2   | 4       | D8                 |
| D13 | Graph Representation      | adjacency list/matrix, directed/undirected, weighted    | T1   | 3       | D7                 |
| D14 | Graph Traversal           | BFS, DFS, connected components, cycle detection         | T2   | 4       | D13, D6            |
| D15 | Shortest Path             | Dijkstra, Bellman-Ford, BFS for unweighted              | T2   | 4       | D14, D12           |
| D16 | Advanced Graphs           | topological sort, MST (Kruskal/Prim), union-find        | E    | 5       | D15                |
| D17 | Sorting -- Comparison     | bubble, selection, insertion, merge sort, quicksort     | T1   | 3       | D3, D1             |
| D18 | Sorting -- Linear Time    | counting sort, radix sort, bucket sort, lower bound     | T2   | 4       | D17                |
| D19 | Binary Search             | iterative, recursive, search space, bisect applications | T1   | 3       | D3, D1             |
| D20 | Two Pointers & Sliding Window | fast/slow pointers, window techniques, applications | T2   | 4       | D3                 |
| D21 | Recursion                 | base case, call stack, tree recursion, memoization      | T1   | 3       | F5, D1             |
| D22 | Backtracking              | constraint satisfaction, pruning, N-queens, subsets     | T2   | 4       | D21                |
| D23 | Dynamic Programming       | overlapping subproblems, optimal substructure, tabulation | T2 | 5       | D21                |
| D24 | Greedy Algorithms         | greedy choice property, activity selection, Huffman     | T2   | 4       | D1                 |
| D25 | String Algorithms         | pattern matching, KMP, Rabin-Karp, edit distance        | E    | 5       | D7, D23            |

**Node count: 25**

### 2c. Databases

| # | Topic                     | Subtopics                                               | Tier | Bloom's | Hard Prereqs     |
|---|---------------------------|---------------------------------------------------------|------|---------|--------------------|
| B1 | Relational Model         | tables, rows, columns, keys (PK, FK), relationships     | T1   | 2       | F7                 |
| B2 | SQL -- Basic Queries      | SELECT, WHERE, ORDER BY, LIMIT, DISTINCT                | T1   | 3       | B1                 |
| B3 | SQL -- Joins              | INNER, LEFT, RIGHT, FULL, CROSS, self-joins             | T1   | 3       | B2                 |
| B4 | SQL -- Aggregation        | GROUP BY, HAVING, COUNT, SUM, AVG, subqueries           | T2   | 3       | B3                 |
| B5 | SQL -- Data Modification  | INSERT, UPDATE, DELETE, UPSERT, bulk operations         | T1   | 3       | B2                 |
| B6 | Schema Design             | entity-relationship diagrams, cardinality, constraints  | T1   | 4       | B1                 |
| B7 | Normalization             | 1NF, 2NF, 3NF, BCNF, denormalization trade-offs        | T2   | 4       | B6                 |
| B8 | Indexing                  | B-tree indexes, composite, covering, index scans        | T2   | 4       | B3, D8             |
| B9 | Query Optimization        | EXPLAIN plans, query rewriting, index selection         | T2   | 5       | B8                 |
| B10 | Transactions             | ACID properties, isolation levels, deadlocks            | T2   | 4       | B5                 |
| B11 | Concurrency Control      | locking, MVCC, optimistic vs pessimistic                | E    | 5       | B10                |
| B12 | NoSQL -- Document Stores | MongoDB model, document design, embedding vs referencing | T2  | 3       | B1                 |
| B13 | NoSQL -- Key-Value       | Redis, caching patterns, TTL, use cases                 | T2   | 3       | B1                 |
| B14 | NoSQL -- Column & Graph  | Cassandra concepts, Neo4j, graph queries, use cases     | E    | 4       | B12                |
| B15 | ORMs & Query Builders    | ORM patterns, N+1 problem, migrations, raw SQL escape   | T2  | 4       | B3, F11            |
| B16 | Database Administration  | backups, replication, partitioning, sharding basics      | E   | 4       | B10                |

**Node count: 16**

### 2d. Systems Design

| # | Topic                       | Subtopics                                              | Tier | Bloom's | Hard Prereqs      |
|---|-----------------------------|--------------------------------------------------------|------|---------|--------------------|
| S1 | Client-Server Architecture | request/response, stateless vs stateful, HTTP basics    | T1   | 2       | F5                 |
| S2 | REST API Design             | resources, HTTP methods, status codes, versioning       | T1   | 3       | S1                 |
| S3 | GraphQL                     | queries, mutations, schemas, resolvers, vs REST         | T2   | 3       | S2                 |
| S4 | gRPC & Protocol Buffers     | protobuf, streaming, service definition, vs REST        | E    | 4       | S2                 |
| S5 | Authentication Patterns     | session-based, JWT, OAuth2 flow, token refresh          | T2   | 4       | S2                 |
| S6 | Caching Strategies          | cache-aside, write-through, write-back, TTL, eviction  | T2   | 4       | S2, B13            |
| S7 | Load Balancing              | round-robin, least connections, health checks, L4/L7   | T2   | 4       | S1                 |
| S8 | Horizontal vs Vertical Scaling | scale-up vs scale-out, stateless design, session mgmt | T1  | 4       | S7                 |
| S9 | Message Queues              | pub/sub, producers/consumers, Kafka/RabbitMQ concepts  | T2   | 4       | S1                 |
| S10 | Event-Driven Architecture  | event sourcing, CQRS, choreography vs orchestration    | E    | 5       | S9                 |
| S11 | Microservices               | service boundaries, communication, data ownership      | T2   | 5       | S2, S9             |
| S12 | Monolith & Modular Monolith | monolith advantages, modular boundaries, migration     | T2  | 4       | S11                |
| S13 | CAP Theorem                 | consistency, availability, partition tolerance          | T2   | 4       | B10                |
| S14 | Consensus & Replication     | Raft/Paxos concepts, leader election, quorum           | E    | 5       | S13                |
| S15 | Rate Limiting & Throttling  | token bucket, sliding window, API quotas               | T2   | 4       | S2                 |
| S16 | CDNs & Edge Computing       | CDN architecture, edge caching, geo-distribution       | E    | 4       | S6, S7             |
| S17 | System Design Practice      | framework for design interviews, capacity estimation   | E    | 6       | S6-S13             |

**Node count: 17**

### 2e. Networking

| # | Topic                      | Subtopics                                               | Tier | Bloom's | Hard Prereqs     |
|---|----------------------------|---------------------------------------------------------|------|---------|--------------------|
| N1 | OSI Model Overview        | 7 layers, encapsulation, where protocols live            | T1   | 2       | --                 |
| N2 | TCP/IP Stack              | IP addressing, subnets, TCP vs UDP, ports                | T1   | 3       | N1                 |
| N3 | DNS                       | resolution process, record types, caching, TTL           | T1   | 3       | N2                 |
| N4 | HTTP/HTTPS                | request/response structure, headers, methods, status codes | T1 | 3       | N3                 |
| N5 | TLS/SSL                   | handshake, certificates, cipher suites, HTTPS setup      | T2   | 4       | N4                 |
| N6 | Sockets Programming       | TCP sockets, UDP sockets, connection lifecycle            | T2   | 3       | N2, F10            |
| N7 | WebSockets                | upgrade handshake, bidirectional communication, use cases | T2  | 3       | N4                 |
| N8 | Real-Time Protocols       | SSE, long polling, WebRTC concepts, protocol comparison  | E    | 4       | N7                 |
| N9 | Network Security          | firewalls, VPNs, IDS/IPS, network segmentation           | T2  | 4       | N2, N5             |
| N10 | REST & HTTP/2/3          | HTTP/2 multiplexing, HTTP/3 QUIC, performance implications | E  | 4       | N4                 |
| N11 | CDN & Proxy Architecture | forward/reverse proxies, CDN mechanics, caching layers   | E   | 4       | N4, S7             |

**Node count: 11**

### 2f. Security

| # | Topic                       | Subtopics                                              | Tier | Bloom's | Hard Prereqs      |
|---|-----------------------------|--------------------------------------------------------|------|---------|--------------------|
| X1 | CIA Triad & Threat Modeling | confidentiality, integrity, availability, STRIDE        | T1   | 2       | --                 |
| X2 | Authentication              | password hashing (bcrypt, argon2), MFA, session mgmt   | T1   | 3       | X1, S5             |
| X3 | Authorization               | RBAC, ABAC, OAuth scopes, principle of least privilege  | T2   | 4       | X2                 |
| X4 | OWASP Top 10 -- Injection   | SQL injection, command injection, parameterized queries | T1   | 4       | B2, X1             |
| X5 | OWASP Top 10 -- XSS & CSRF  | reflected/stored XSS, CSRF tokens, CSP headers         | T1  | 4       | N4, X1             |
| X6 | OWASP Top 10 -- Other       | broken access control, SSRF, security misconfiguration | T2  | 4       | X4, X5             |
| X7 | Cryptography Fundamentals   | symmetric vs asymmetric, hashing, digital signatures   | T2   | 4       | X1                 |
| X8 | Cryptography Applied        | TLS in practice, key management, certificate lifecycle | E    | 5       | X7, N5             |
| X9 | Secure Coding Practices     | input validation, output encoding, secure defaults     | T2   | 4       | X4, X5             |
| X10 | Secrets Management         | env vars, vaults, key rotation, CI/CD secrets          | T2   | 3       | X7                 |
| X11 | Security Auditing          | dependency scanning, SAST/DAST, penetration testing    | E    | 5       | X6, X9             |
| X12 | Application Security Design | defense in depth, zero trust, security by design       | E   | 6       | X3, X9             |

**Node count: 12**

### 2g. DevOps

| # | Topic                       | Subtopics                                              | Tier | Bloom's | Hard Prereqs      |
|---|-----------------------------|--------------------------------------------------------|------|---------|--------------------|
| O1 | Git Fundamentals            | init, add, commit, log, diff, branching                | T1   | 3       | F15                |
| O2 | Git Collaboration           | remotes, push/pull, merge, rebase, PRs, conflicts      | T1  | 3       | O1                 |
| O3 | Git Advanced                | cherry-pick, bisect, reflog, worktrees, hooks           | E   | 4       | O2                 |
| O4 | Linux / Shell Basics        | navigation, file ops, permissions, piping, scripting    | T1  | 3       | --                 |
| O5 | Shell Scripting             | bash scripts, variables, loops, conditionals, cron     | T2   | 3       | O4                 |
| O6 | Environment Management      | env vars, dotfiles, PATH, virtual environments          | T1  | 3       | O4                 |
| O7 | Docker Fundamentals         | images, containers, Dockerfile, docker-compose          | T1  | 3       | O4, F10            |
| O8 | Docker Advanced             | multi-stage builds, networking, volumes, optimization   | T2  | 4       | O7                 |
| O9 | Container Orchestration     | Kubernetes concepts, pods, services, deployments        | E   | 4       | O8                 |
| O10 | CI/CD Concepts             | pipelines, stages, triggers, artifacts, environments    | T1  | 3       | O2                 |
| O11 | CI/CD Implementation       | GitHub Actions, build/test/deploy workflows             | T2  | 4       | O10, O7            |
| O12 | Cloud Fundamentals         | IaaS/PaaS/SaaS, major providers, regions, billing      | T1  | 2       | --                 |
| O13 | Cloud Compute & Storage    | VMs, serverless, object storage, block storage          | T2  | 3       | O12                |
| O14 | Infrastructure as Code     | Terraform concepts, declarative vs imperative, state    | T2  | 4       | O12, O7            |
| O15 | Monitoring & Logging       | metrics, logs, traces, alerting, observability          | T2  | 4       | O10                |
| O16 | Monitoring Tools           | Prometheus, Grafana, ELK stack, structured logging      | E   | 4       | O15                |

**Node count: 16**

---

### Domain Summary

| Domain                    | T1 Nodes | T2 Nodes | Elective | Total |
|---------------------------|----------|----------|----------|-------|
| Programming Fundamentals  | 10       | 7        | 3        | 20    |
| Data Structures & Algo    | 10       | 10       | 5        | 25    |
| Databases                 | 5        | 7        | 4        | 16    |
| Systems Design            | 3        | 9        | 5        | 17    |
| Networking                | 4        | 4        | 3        | 11    |
| Security                  | 4        | 5        | 3        | 12    |
| DevOps                    | 6        | 6        | 4        | 16    |
| **TOTAL (CS foundations)**| **42**   | **48**   | **27**   | **117** |

Note: The three language-specific branches (Python, TypeScript, React/Next.js)
and C# are defined in a companion document. They share the same topic
structure as Programming Fundamentals but with language-specific syntax,
idioms, and ecosystem nodes. Estimated ~25-35 nodes each.

---

## 3. Prerequisite Dependency Graph

### 3.1 Inter-Domain Dependencies (high level)

```
                    +---------------------------+
                    |  Programming Fundamentals |
                    |       (F1 -- F20)         |
                    +-------------+-------------+
                                  |
                 +------+---------+---------+-------+
                 |      |         |         |       |
                 v      v         v         v       v
             +------+ +------+ +------+ +------+ +------+
             | DS&A | | Data-| | Sys  | | Net- | | Dev- |
             |      | | bases| | Dsgn | | work | | Ops  |
             +--+---+ +--+---+ +--+---+ +--+---+ +--+---+
                |         |         |         |       |
                |         |    +----+----+    |       |
                |         +--->| Sys Dsgn|<---+       |
                |              | (advanced)|          |
                |              +---------+            |
                |                   |                 |
                +----------+       |    +-------------+
                           |       |    |
                           v       v    v
                        +--------------+
                        |   Security   |
                        +--------------+
```

### 3.2 Detailed Cross-Domain Dependencies

```
LEGEND
======
  ----->  Hard prerequisite (must complete first)
  - - ->  Soft prerequisite (recommended, not enforced)

PROGRAMMING FUNDAMENTALS
========================
  F5 (Functions) -----> D1 (Complexity Analysis)
  F5 (Functions) -----> D21 (Recursion)
  F7 (Built-in DS) ---> B1 (Relational Model)
  F7 (Built-in DS) ---> D3 (Arrays Deep Dive)
  F10 (I/O) ----------> O7 (Docker Fundamentals)
  F11 (OOP) ----------> D4 (Linked Lists)
  F11 (OOP) ----------> B15 (ORMs)
  F15 (Modules) ------> O1 (Git Fundamentals)

DATA STRUCTURES & ALGORITHMS
=============================
  D8 (Binary Trees) - - -> B8 (Indexing) [soft: B-tree understanding]
  D7 (Hash Tables) -- - -> B13 (Key-Value NoSQL) [soft: understanding hashing]
  D6 (Queues) -----------> D14 (Graph Traversal -- BFS uses queues)
  D12 (Heaps) -----------> D15 (Shortest Path -- Dijkstra uses min-heap)

DATABASES --> SYSTEMS DESIGN
=============================
  B10 (Transactions) ----> S13 (CAP Theorem)
  B13 (Key-Value) -------> S6 (Caching Strategies)

NETWORKING --> SECURITY
========================
  N4 (HTTP/HTTPS) -------> X5 (XSS & CSRF)
  N5 (TLS/SSL) ----------> X8 (Applied Crypto)
  N2 (TCP/IP) -----------> N9 (Network Security)

DATABASES --> SECURITY
=======================
  B2 (SQL Basics) -------> X4 (Injection)

NETWORKING --> SYSTEMS DESIGN
==============================
  N4 (HTTP/HTTPS) - - - -> S2 (REST API Design) [soft]
  N7 (WebSockets) - - - -> S9 (Message Queues) [soft: async patterns]

DEVOPS <--> OTHER DOMAINS
==========================
  O2 (Git Collab) -------> O10 (CI/CD Concepts)
  O7 (Docker) -----------> O11 (CI/CD Implementation)
  X10 (Secrets Mgmt) - - -> O11 (CI/CD Implementation) [soft]
  O12 (Cloud) - - - - - -> S7 (Load Balancing) [soft]
  O15 (Monitoring) - - - -> S17 (System Design Practice) [soft]
```

### 3.3 Topological Order (recommended global sequence)

Within any single branch, nodes are already numbered in topological order. For
cross-branch study, the recommended global sequence is:

```
Phase 1: Foundations
  F1-F9 (Programming core)
  O1-O2 (Git basics -- start using version control immediately)
  O4 (Linux/Shell basics)

Phase 2: Intermediate Programming + First Domain
  F10-F16 (Advanced programming concepts)
  D1-D7 (Core data structures)
  B1-B5 (SQL fundamentals)

Phase 3: Deeper Domains
  D8-D14 (Trees, graphs, sorting)
  B6-B10 (Schema design, indexing, transactions)
  N1-N4 (Networking essentials)
  S1-S2 (Client-server, REST)

Phase 4: Advanced Topics
  D15-D25 (Advanced algorithms)
  S3-S15 (Systems design depth)
  X1-X9 (Security)
  O7-O15 (Docker, CI/CD, Cloud, IaC)

Phase 5: Elective / Capstone
  All Elective nodes from any branch
  Cross-domain projects
```

---

## 4. Learning Path Recommendations

Each path is a curated sequence of nodes across branches for learners with a
specific career goal. Paths are not exclusive -- a learner can follow one path
and add nodes from others at any time.

### 4.1 The Full-Stack Path

**Goal**: Build and deploy web applications end to end.

```
Programming Fundamentals (F1-F16)
  |
  v
TypeScript branch (language-specific nodes, ~30 nodes)
  |
  v
React/Next.js branch (~30 nodes)
  |
  v
Databases (B1-B10, B12-B13, B15)  -- SQL + NoSQL + ORMs
  |
  v
Systems Design (S1-S2, S5-S8, S11-S12, S15)  -- APIs, auth, scaling
  |
  v
DevOps (O1-O2, O7, O10-O11, O12-O13)  -- Git, Docker, CI/CD, Cloud
```

**Estimated nodes**: ~110 | **Estimated hours**: ~160-200

### 4.2 The CS Fundamentals Path

**Goal**: Deep CS knowledge for algorithm-heavy roles or graduate study.

```
Programming Fundamentals (F1-F20, all nodes)
  |
  v
DS&A (D1-D25, all nodes)  -- complete coverage
  |
  v
Systems Design (S1-S2, S7-S14)  -- architecture + distributed systems
  |
  v
Networking (N1-N6)  -- protocols and sockets
  |
  v
Databases (B1-B11)  -- relational depth + transactions
```

**Estimated nodes**: ~85 | **Estimated hours**: ~130-170

### 4.3 The DevOps Path

**Goal**: Automate infrastructure, deploy and monitor services.

```
Programming Fundamentals (F1-F10, F15, F20)  -- scripting focus
  |
  v
DevOps -- Linux/Shell (O4-O6)
  |
  v
DevOps -- Docker (O7-O9)  -- containers + orchestration
  |
  v
DevOps -- CI/CD (O10-O11)
  |
  v
DevOps -- Cloud & IaC (O12-O14)
  |
  v
DevOps -- Monitoring (O15-O16)
  |
  v
Networking (N1-N5, N9)  -- protocols + network security
  |
  v
Security (X1, X7, X9-X10)  -- secrets, secure coding
```

**Estimated nodes**: ~50 | **Estimated hours**: ~80-100

### 4.4 The Security Path

**Goal**: Application and infrastructure security.

```
Programming Fundamentals (F1-F11, F15, F20)
  |
  v
Networking (N1-N9)  -- full networking coverage
  |
  v
Security (X1-X12, all nodes)  -- comprehensive security
  |
  v
Databases (B1-B5, B10)  -- enough SQL to understand injection
  |
  v
DevOps (O1-O2, O4-O8, O10-O11, O15)  -- git, shell, docker, CI/CD, monitoring
```

**Estimated nodes**: ~60 | **Estimated hours**: ~90-120

---

## 5. Topic Granularity -- Breaking Topics into Lesson Nodes

### 5.1 Node Design Rules

Each node in the skill tree represents one concept that can be taught and
practiced in **15-30 minutes**. Node design rules:

1. **One learning objective per node.** Written using a Bloom's verb at the
   target level. Example: "Given an unsorted array, *implement* binary search
   after sorting" (Bloom's level 3, Apply).

2. **3-5 sub-concepts per node.** A node is not a single fact; it is a cluster
   of tightly related sub-concepts that together form one teachable unit.

3. **Every node is independently testable.** There must be at least one
   challenge (code exercise, quiz, or design problem) that directly assesses
   whether the learning objective was met.

4. **Nodes within a tier build on each other.** Within any linear sequence
   (e.g., D3 -> D4 -> D5), each node assumes mastery of the previous one.

5. **Spiral hooks.** Where a concept will be revisited in a later tier or
   different branch, the node should include a brief "foreshadowing" note
   (e.g., "You'll see hash tables again when we cover database indexing").

### 5.2 Example Breakdown: "Lists" (Node F7, partial)

The "Built-in Data Structures" node (F7) is large enough to split into
sub-nodes in the language-specific branches. Here is how the Python branch
would break down the list portion:

| Sub-node       | Bloom's | Learning Objective                                     | Duration |
|----------------|---------|--------------------------------------------------------|----------|
| List Creation  | 2       | Explain how to create lists using literals and list()  | 5 min    |
| Indexing       | 3       | Access elements by positive/negative index             | 5 min    |
| Slicing        | 3       | Extract sub-lists using slice notation                 | 10 min   |
| Common Methods | 3       | Use append, extend, insert, remove, pop, sort          | 10 min   |
| Iteration      | 3       | Iterate with for-in, enumerate, zip                    | 10 min   |
| List Comps     | 4       | Analyze and write list comprehensions                  | 15 min   |
| **Total**      |         |                                                        | ~55 min  |

This exceeds the 30-minute target, so it should be split into two nodes:
"Lists -- Basics" (creation through methods) and "Lists -- Patterns"
(iteration and comprehensions).

### 5.3 Node Sizing Guidelines

| Node Content                            | Typical Duration | Split? |
|-----------------------------------------|------------------|--------|
| Single concept, 2-3 subtopics           | 10-15 min        | No     |
| Medium concept, 3-5 subtopics           | 20-30 min        | No     |
| Broad concept, 5+ subtopics             | 30-60 min        | Yes    |
| Practice-heavy (e.g., implement BST)    | 30-45 min        | Maybe  |
| Design exercise (e.g., design a cache)  | 45-60 min        | Yes    |

When splitting, prefer splitting by complexity (basics vs advanced patterns)
rather than by arbitrary subtopic boundaries.

---

## 6. Assessment Alignment -- Topic-to-Challenge Mapping

Each domain maps naturally to certain challenge formats. The app should
dynamically select challenge types based on the node's domain and Bloom's level.

### 6.1 Challenge Type Matrix

| Domain               | Bloom's 1-2          | Bloom's 3-4              | Bloom's 5-6                |
|----------------------|----------------------|--------------------------|----------------------------|
| Prog. Fundamentals   | Multiple choice,     | Write-from-scratch,      | Refactor code,             |
|                      | fill-in-the-blank    | fix-the-bug              | design a module            |
| DS&A                 | Identify the DS,     | Implement algorithm,     | Optimize solution,         |
|                      | trace execution      | analyze complexity       | compare approaches         |
| Databases            | Identify normal forms,| Write SQL queries,      | Design schema for          |
|                      | match terms          | create indexes           | real-world scenario        |
| Systems Design       | Match terms to       | Design a component,      | Full system design,        |
|                      | definitions          | explain trade-offs       | capacity estimation        |
| Networking           | Label OSI layers,    | Configure DNS/HTTP,      | Debug network issues,      |
|                      | match protocols      | trace a request          | design protocol            |
| Security             | Identify threat type,| Find-the-vulnerability,  | Conduct security review,   |
|                      | match OWASP categories| fix-the-bug (security)  | design auth system         |
| DevOps               | Match terms,         | Write Dockerfile,        | Design CI/CD pipeline,     |
|                      | identify tools       | write CI config          | incident response          |

### 6.2 Challenge Format Details

1. **Write-from-scratch**: Learner writes a function/class from a spec. Auto-
   graded via test cases. Primary format for Fundamentals and DS&A.

2. **Fix-the-bug**: Pre-written code with 1-3 bugs. Learner identifies and
   fixes them. Good for Bloom's level 4 (Analyze). Works across all domains.

3. **Fill-in-the-blank**: Partially complete code with blanks for key
   expressions. Good for Bloom's 2-3. Lower friction for beginners.

4. **Find-the-vulnerability**: Security-specific. Presented with code,
   learner identifies the vulnerability and applies the fix. Maps to OWASP
   nodes.

5. **Write-a-query**: Database-specific. Given a schema and English
   description, write the SQL. Auto-graded by comparing result sets.

6. **Design exercise**: Open-ended. Learner describes a system design in
   structured text or diagram. AI-graded with rubric. Used for Systems Design
   and capstone nodes.

7. **Complexity analysis**: DS&A-specific. Given code, identify the Big O
   time and space complexity. Multiple choice or free-response.

8. **Trace execution**: Given code, predict the output or draw the state of
   a data structure after each step. Good for Bloom's level 2.

### 6.3 Assessment Progression

Within each node, challenges should escalate:

```
Node entry:  Recall/Understand challenge (quiz, trace, fill-in-blank)
    |
    v
Practice:    Apply challenge (implement, write query, write config)
    |
    v
Mastery:     Analyze/Evaluate challenge (debug, optimize, compare)
    |
    v
Bonus XP:    Create challenge (design, extend, combine with other concepts)
```

The node is "complete" after the Practice challenge. Mastery and Bonus are
optional for progression but award additional XP and contribute to branch
mastery percentage.

---

## 7. Application: Curriculum Architecture for Learner

### 7.1 Final Node Count Estimates

| Branch                  | CS Foundation Nodes | Language-Specific Nodes | Total Estimated |
|-------------------------|--------------------:|------------------------:|----------------:|
| Python                  | 20 (shared F-nodes) | 30                     | 50              |
| TypeScript              | 20 (shared F-nodes) | 30                     | 50              |
| React/Next.js           | --                  | 35                      | 35              |
| C#                      | 20 (shared F-nodes) | 30                     | 50              |
| Data Structures & Algo  | 25                  | --                      | 25              |
| Databases               | 16                  | --                      | 16              |
| Systems Design          | 17                  | --                      | 17              |
| Networking              | 11                  | --                      | 11              |
| Security                | 12                  | --                      | 12              |
| DevOps                  | 16                  | --                      | 16              |
| **Total**               |                     |                         | **~282**        |

Note: The 20 shared F-nodes appear once per language branch but are completed
independently for each language (Python lists vs TypeScript arrays vs C#
`List<T>`). This gives the spiral curriculum effect -- the concept is the same,
but the implementation and idioms differ.

### 7.2 Recommended Unlock Order

The skill tree opens progressively. On day one, only a subset of branches are
available. Others unlock as the learner demonstrates prerequisite knowledge.

```
ALWAYS AVAILABLE (from day one):
  - Programming Fundamentals (the root -- always open)
  - Python branch OR TypeScript branch OR C# branch (learner picks one)
  - DevOps: Git Fundamentals (O1-O2, always available)

UNLOCK AFTER Fundamentals T1 COMPLETE (F1-F9):
  - All language branches (Python, TypeScript, C#)
  - Data Structures & Algorithms
  - Databases (B1-B5)
  - Networking (N1-N4)
  - DevOps (full branch)

UNLOCK AFTER Fundamentals T2 COMPLETE (F10-F16):
  - React/Next.js (requires TypeScript T1 as additional prereq)
  - Systems Design
  - Security

UNLOCK AFTER specific cross-domain prereqs:
  - DS&A Tier 2 requires F11 (OOP) complete
  - Systems Design S13 (CAP) requires B10 (Transactions)
  - Security X4 (Injection) requires B2 (SQL Basics)
  - Security X5 (XSS/CSRF) requires N4 (HTTP/HTTPS)
```

### 7.3 Visual Skill Tree Structure

```
                          +---------+
                          | Learner |
                          | Home    |
                          +----+----+
                               |
              +----------------+----------------+
              |                |                |
         +----+----+     +----+----+      +----+----+
         |  Python |     |   TS   |      |   C#   |
         +---------+     +--------+      +--------+
              |                |
              |           +----+----+
              |           | React / |
              |           | Next.js |
              |           +---------+
              |
    +---------+---------+---------+---------+
    |         |         |         |         |
+---+---+ +--+---+ +---+---+ +--+---+ +---+---+
| DS&A  | |  DB  | | SysDe | | Net  | | DevOp |
+---+---+ +--+---+ +---+---+ +--+---+ +---+---+
    |         |         |         |         |
    |         +----+----+         |         |
    |              |              |         |
    |         +----+----+    +---+---+     |
    |         |(crosses)|    | Secur |     |
    |         +---------+    +-------+     |
    |                                      |
    +------ (cross-connections) -----------+

WITHIN EACH BRANCH:
+-------+     +-------+     +-------+     +-------+
| T1    | --> | T1    | --> | T2    | --> | T2    |  ...
| node  |     | node  |     | node  |     | node  |
+-------+     +-------+     +-------+     +-------+
                                               |
                                          +----+----+
                                          | Elective|
                                          +---------+

TIER PROGRESSION (within a branch):
  Tier 1 (green)   -- Unlocked by default once branch is available
  Tier 2 (blue)    -- Unlocked after completing all T1 nodes in branch
  Elective (gold)  -- Unlocked after completing all T2 nodes in branch
```

Each node displays:
- Title and Bloom's level icon
- Completion status (locked / available / in-progress / complete / mastered)
- XP value (higher for higher tiers: T1=100, T2=200, E=300)
- Connection lines to prerequisite nodes
- Soft prerequisite indicators (dotted lines to other branches)

### 7.4 Estimated Total Learning Hours

| Tier     | Node Count | Avg Hours/Node | Total Hours |
|----------|------------|-----------------|-------------|
| Tier 1   | ~112       | 0.75            | ~84         |
| Tier 2   | ~118       | 1.25            | ~148        |
| Elective | ~52        | 1.75            | ~91         |
| **Total**| **~282**   |                 | **~323**    |

A learner completing all 10 branches at all tiers would invest roughly
**300-350 hours**. This aligns with the CS2013 recommendation of ~300 core
hours for an undergraduate CS program, which validates our scope.

Realistic timelines:
- **Casual learner** (5 hrs/week): ~65 weeks (~15 months) for full completion
- **Dedicated learner** (15 hrs/week): ~22 weeks (~5 months)
- **Single path** (e.g., Full-Stack, ~110 nodes): ~120-160 hours, or 8-12 weeks at 15 hrs/week

### 7.5 Cross-Connection Display Rules

Cross-domain connections should be visible but not overwhelming:

1. **Within the current branch view**: show only nodes from the current branch,
   plus small icons indicating cross-connections to other branches.
2. **Zoomed-out "map" view**: show all branches with their tier progression,
   with dotted lines showing cross-domain soft prerequisites.
3. **Node detail view**: list all prerequisites (hard and soft) with direct
   links to the referenced nodes in other branches.
4. **Maximum 3 cross-domain connections shown per node** in the tree view to
   prevent visual clutter. Additional connections visible on hover/tap.

---

## References

- ACM/IEEE Computer Science Curricula 2013 (CS2013): Joint Task Force on
  Computing Curricula. Provides knowledge area structure, tiered hours, and
  learning outcomes.
- Bloom, B.S. (1956). Taxonomy of Educational Objectives. Revised by Anderson
  & Krathwohl (2001) to the six-level framework used here.
- Bruner, J.S. (1960). The Process of Education. Introduces the spiral
  curriculum concept -- revisiting topics at increasing depth.
- OWASP Top 10 (2021): Standard reference for web application security risks.
  Used to structure Security nodes X4-X6.
- Designing Data-Intensive Applications (Kleppmann, 2017): Informed the
  Systems Design and Databases topic structure.

---

*Next document: 03 -- Gamification & Progression System (XP, levels, streaks,
rewards, skill tree unlock mechanics)*
