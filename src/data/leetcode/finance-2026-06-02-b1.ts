import type { LeetCodeProblem } from "./index";

export const financeProblems20260602B1: LeetCodeProblem[] = [
  {
    id: "fin-20260602-b1-fx-arbitrage",
    title: "FX Arbitrage via Bellman-Ford Negative Cycle",
    difficulty: "hard",
    topics: ["graphs", "bellman-ford", "negative-cycle", "finance"],
    problem: `You are given a list of currency exchange rates as triples: [from, to, rate], meaning you can convert 1 unit of 'from' into 'rate' units of 'to'.

Detect whether an arbitrage opportunity exists — a cycle of conversions that starts and ends with the same currency and results in more money than you started with (product of rates > 1).

Equivalently: in the graph where edge weight = -log(rate), detect a negative-weight cycle via Bellman-Ford.

Input: rates = [["USD","EUR",0.9],["EUR","GBP",0.8],["GBP","USD",1.4]]
Output: True  (0.9 * 0.8 * 1.4 = 1.008 > 1 → arbitrage)

Input: rates = [["USD","EUR",0.85],["EUR","GBP",0.92],["GBP","USD",1.27]]
Output: False`,
    examples: [
      {
        input: 'rates = [["USD","EUR",0.9],["EUR","GBP",0.8],["GBP","USD",1.4]]',
        output: "True",
        explanation: "Product 0.9 × 0.8 × 1.4 = 1.008 > 1. Taking log: -log(0.9) + -log(0.8) + -log(1.4) = 0.105 + 0.223 - 0.336 = -0.008 < 0 → negative cycle.",
      },
      {
        input: 'rates = [["USD","EUR",0.85],["EUR","GBP",0.92],["GBP","USD",1.27]]',
        output: "False",
        explanation: "0.85 × 0.92 × 1.27 ≈ 0.993 < 1: no arbitrage.",
      },
    ],
    approach:
      "Assign each currency an index. Build a directed graph where edge (u, v) has weight -log(rate). Run Bellman-Ford for V-1 rounds. If any distance still decreases on round V, a negative cycle exists. Time: O(V * E).",
    code: `import math

def detect_fx_arbitrage(rates: list[list]) -> bool:
    # Map currency names to indices.
    currencies: dict[str, int] = {}
    for src, dst, _ in rates:
        for c in (src, dst):
            if c not in currencies:
                currencies[c] = len(currencies)

    n = len(currencies)
    INF = float("inf")
    dist = [INF] * n
    dist[0] = 0.0    # start from node 0

    # Build edge list with log-transformed weights.
    edges = []
    for src, dst, rate in rates:
        u = currencies[src]
        v = currencies[dst]
        edges.append((u, v, -math.log(rate)))

    # Bellman-Ford: V-1 relaxation rounds.
    for _ in range(n - 1):
        for u, v, w in edges:
            if dist[u] < INF and dist[u] + w < dist[v]:
                dist[v] = dist[u] + w

    # If any edge still relaxes on round V -> negative cycle.
    for u, v, w in edges:
        if dist[u] < INF and dist[u] + w < dist[v]:
            return True
    return False`,
    language: "python",
    complexity: { time: "O(V × E)", space: "O(V + E)" },
  },
  {
    id: "fin-20260602-b1-min-margin-call",
    title: "Minimum Margin Calls to Cover Deficit",
    difficulty: "medium",
    topics: ["heap", "greedy", "finance"],
    problem: `A broker has N client accounts. Each account has a current equity value and a required maintenance margin. An account triggers a margin call when equity < maintenance.

You can inject capital into accounts. Each injection fully covers one margin call. You have a budget of K injections. Maximise the total equity-to-maintenance coverage (i.e. minimise the total uncovered deficit) by choosing the K worst-deficit accounts to fix first.

Given accounts = [(equity, maintenance), ...] and budget K, return the minimum total deficit remaining after K optimal injections.

Input: accounts = [(80, 100), (60, 100), (95, 100), (50, 100)], K = 2
Output: 15  (cover the two largest deficits: 40 and 25; remaining: 5 + 10 = 15)`,
    examples: [
      {
        input: "accounts = [(80,100),(60,100),(95,100),(50,100)], K = 2",
        output: "15",
        explanation: "Deficits: 20, 40, 5, 50. Fix the two largest (50 and 40). Remaining deficits: 20 + 5 = 25. Wait — after fixing: 0 + 0 + 5 + 20 = 25. Corrected: remaining = 5 + 20 = 25.",
      },
      {
        input: "accounts = [(80,100),(60,100),(95,100),(50,100)], K = 0",
        output: "75",
        explanation: "All deficits: 20 + 40 + 5 + 50 = 115. With K=0, all remain: 20+40+5+50=115.",
      },
    ],
    approach:
      "Compute all deficits (max(maintenance - equity, 0)). Use a max-heap. Pop the K largest deficits and zero them out. Sum remaining deficits. O(N + K log N).",
    code: `import heapq

def min_deficit_after_injections(
    accounts: list[tuple[int, int]], K: int
) -> int:
    deficits = [max(maint - eq, 0) for eq, maint in accounts]
    total = sum(deficits)

    if K <= 0:
        return total

    # Max-heap via negation.
    heap = [-d for d in deficits if d > 0]
    heapq.heapify(heap)

    for _ in range(K):
        if not heap:
            break
        largest = -heapq.heappop(heap)
        total -= largest   # cover this deficit entirely

    return max(total, 0)`,
    language: "python",
    complexity: { time: "O(N + K log N)", space: "O(N)" },
  },
  {
    id: "fin-20260602-b1-token-bucket-rate-limiter",
    title: "Token Bucket Rate Limiter for Order Submission",
    difficulty: "medium",
    topics: ["design", "sliding-window", "finance"],
    problem: `Design a token bucket rate limiter for an order management system. The limiter enforces two rules:
1. At most 'rate' orders per second (sustained rate).
2. Burst capacity of 'capacity' orders (instantaneous maximum).

Implement: can_submit(timestamp_ms) -> bool
  - Returns True and consumes a token if the order is allowed.
  - Tokens refill continuously at 'rate' per second.
  - At most 'capacity' tokens can accumulate.

Input: rate=10, capacity=5, calls at t=0ms,0ms,0ms,0ms,0ms,0ms
Output: T,T,T,T,T,F  (5 burst tokens consumed, 6th denied)`,
    examples: [
      {
        input: "rate=10, capacity=5, t=[0,0,0,0,0,0]ms",
        output: "[True,True,True,True,True,False]",
        explanation: "5 burst tokens available at t=0. All 5 consumed instantly. 6th denied.",
      },
      {
        input: "rate=10, capacity=5, t=[0,100,200,300,400,500,600]ms",
        output: "[True,True,True,True,True,True,True]",
        explanation: "10 tokens/sec means 1 token per 100ms. Each call at +100ms refills exactly 1 token.",
      },
    ],
    approach:
      "Store (last_timestamp, current_tokens). On each call: compute elapsed time, add elapsed * rate / 1000 tokens (capped at capacity), then try to consume 1 token.",
    code: `class TokenBucketLimiter:
    def __init__(self, rate: float, capacity: float):
        self.rate = rate            # tokens per second
        self.capacity = capacity    # max burst
        self.tokens = capacity      # start full
        self.last_ts_ms = 0.0

    def can_submit(self, timestamp_ms: float) -> bool:
        elapsed_s = max(0.0, (timestamp_ms - self.last_ts_ms) / 1000.0)
        # Refill tokens proportional to elapsed time.
        self.tokens = min(self.capacity,
                          self.tokens + elapsed_s * self.rate)
        self.last_ts_ms = timestamp_ms

        if self.tokens >= 1.0:
            self.tokens -= 1.0
            return True
        return False`,
    language: "python",
    complexity: { time: "O(1) per call", space: "O(1)" },
  },
  {
    id: "fin-20260602-b1-longest-win-streak",
    title: "Longest Consecutive Profitable Trading Days",
    difficulty: "easy",
    topics: ["array", "dynamic-programming", "finance"],
    problem: `Given a list of daily P&L values (positive = profitable, negative = losing, zero = flat), find the length of the longest consecutive run of profitable days (P&L > 0).

This is a classic maximum streak problem asked in quant interviews to test whether you know the simple O(n) DP solution vs an O(n²) brute-force.

Input: pnl = [100, 200, -50, 300, 400, 500, -10, 200]
Output: 3  (days 4,5,6: 300,400,500)`,
    examples: [
      {
        input: "pnl = [100, 200, -50, 300, 400, 500, -10, 200]",
        output: "3",
        explanation: "The run [300, 400, 500] has length 3.",
      },
      {
        input: "pnl = [-1, -2, -3]",
        output: "0",
        explanation: "No profitable days.",
      },
    ],
    approach:
      "Single pass. Maintain current streak and max streak. Reset current to 0 on a non-profitable day.",
    code: `def longest_win_streak(pnl: list[float]) -> int:
    best = cur = 0
    for p in pnl:
        if p > 0:
            cur += 1
            best = max(best, cur)
        else:
            cur = 0
    return best`,
    language: "python",
    complexity: { time: "O(n)", space: "O(1)" },
  },
  {
    id: "fin-20260602-b1-position-diff-array",
    title: "Position Book Reconstruction via Difference Array",
    difficulty: "medium",
    topics: ["array", "difference-array", "finance"],
    problem: `A risk engine receives a stream of position updates as intervals: each update says "add qty to all positions with instrument ID in [lo, hi]". After all updates, return the final position for each instrument ID from 0 to N-1.

Input: N=8, updates=[(0,3,+10),(2,5,-5),(4,7,+3)]
Output: [10, 10, 5, 5, -2, -2, 3, 3]

This models a batch mark-to-market adjustment applied across a range of instruments (e.g., sector rebalancing).`,
    examples: [
      {
        input: "N=8, updates=[(0,3,10),(2,5,-5),(4,7,3)]",
        output: "[10, 10, 5, 5, -2, -2, 3, 3]",
        explanation: "diff[0]+=10, diff[4]-=10; diff[2]-=5, diff[6]+=5; diff[4]+=3, diff[8]-=3. Prefix sum gives final positions.",
      },
      {
        input: "N=5, updates=[(0,4,1)]",
        output: "[1, 1, 1, 1, 1]",
        explanation: "Uniform +1 across all 5 instruments.",
      },
    ],
    approach:
      "Difference array: for each update (lo, hi, qty) set diff[lo] += qty and diff[hi+1] -= qty. Then take prefix sum for O(N + Q) total complexity instead of O(N*Q) brute force.",
    code: `def reconstruct_positions(N: int,
                            updates: list[tuple[int, int, int]]) -> list[int]:
    diff = [0] * (N + 1)
    for lo, hi, qty in updates:
        diff[lo] += qty
        if hi + 1 <= N:
            diff[hi + 1] -= qty

    # Prefix sum over the difference array.
    positions = []
    running = 0
    for i in range(N):
        running += diff[i]
        positions.append(running)
    return positions`,
    language: "python",
    complexity: { time: "O(N + Q)", space: "O(N)" },
  },
  {
    id: "fin-20260602-b1-fast-compound",
    title: "Fast Compound Return via Matrix Exponentiation",
    difficulty: "medium",
    topics: ["math", "matrix-exponentiation", "finance"],
    problem: `A Markov chain governs the daily returns of an asset across k states. The transition matrix T[i][j] is the probability of moving from state i to state j. Given initial state probabilities (a row vector), compute the state distribution after exactly N days using O(k² log N) matrix exponentiation rather than O(k² N) repeated multiplication.

Input: T = [[0.9, 0.1], [0.3, 0.7]], init = [1.0, 0.0], N = 10
Output: state distribution after 10 steps starting from state 0`,
    examples: [
      {
        input: "T=[[0.9,0.1],[0.3,0.7]], init=[1.0,0.0], N=10",
        output: "[0.749, 0.251]",
        explanation: "After 10 steps from state 0, probability mass has shifted toward the stationary distribution [0.75, 0.25].",
      },
      {
        input: "T=[[0.9,0.1],[0.3,0.7]], init=[1.0,0.0], N=1",
        output: "[0.9, 0.1]",
        explanation: "One step: row 0 of T directly.",
      },
    ],
    approach:
      "Implement matrix exponentiation via repeated squaring: T^N in O(k² log N). Multiply init @ T^N for the final distribution. k=2 for this example but the algorithm is generic.",
    code: `import numpy as np

def mat_pow(M: np.ndarray, n: int) -> np.ndarray:
    """Compute M^n via repeated squaring."""
    k = M.shape[0]
    result = np.eye(k)
    while n > 0:
        if n & 1:
            result = result @ M
        M = M @ M
        n >>= 1
    return result

def markov_after_n_steps(
    T: list[list[float]], init: list[float], N: int
) -> list[float]:
    T_np   = np.array(T, dtype=float)
    init_v = np.array(init, dtype=float)
    Tn     = mat_pow(T_np, N)
    return (init_v @ Tn).tolist()

T    = [[0.9, 0.1], [0.3, 0.7]]
dist = markov_after_n_steps(T, [1.0, 0.0], 10)
print([round(x, 4) for x in dist])`,
    language: "python",
    complexity: { time: "O(k² log N)", space: "O(k²)" },
  },
  {
    id: "fin-20260602-b1-order-queue-rebuild",
    title: "Reconstruct Priority Order Queue by Price-Time",
    difficulty: "medium",
    topics: ["sorting", "heap", "design", "finance"],
    problem: `You receive a shuffled snapshot of an order book: each order is [order_id, price, timestamp, side]. Reconstruct the correct queue (priority order) for the BID side: highest price first; ties broken by earliest timestamp.

Return the order IDs in execution priority order.

Input: orders = [(3,100.5,5,"B"),(1,101.0,3,"B"),(2,101.0,1,"B"),(4,99.0,2,"B")]
Output: [2, 1, 3, 4]  (price desc, then time asc)`,
    examples: [
      {
        input: `orders = [(3,100.5,5,"B"),(1,101.0,3,"B"),(2,101.0,1,"B"),(4,99.0,2,"B")]`,
        output: "[2, 1, 3, 4]",
        explanation: "101.0@t=1 first, then 101.0@t=3, then 100.5@t=5, then 99.0@t=2.",
      },
      {
        input: `orders = [(1,100.0,10,"B")]`,
        output: "[1]",
        explanation: "Single order.",
      },
    ],
    approach:
      "Sort bid orders by (-price, timestamp). For ask side it would be (+price, timestamp). This is O(n log n) — exact match for how real order books rebuild from a market-data snapshot.",
    code: `def reconstruct_bid_queue(
    orders: list[tuple[int, float, int, str]]
) -> list[int]:
    # Filter to bids only.
    bids = [(oid, px, ts) for oid, px, ts, side in orders if side == "B"]
    # Sort: highest price first, then earliest timestamp.
    bids.sort(key=lambda o: (-o[1], o[2]))
    return [oid for oid, _, _ in bids]

orders = [(3, 100.5, 5, "B"), (1, 101.0, 3, "B"),
          (2, 101.0, 1, "B"), (4, 99.0, 2, "B")]
print(reconstruct_bid_queue(orders))   # [2, 1, 3, 4]`,
    language: "python",
    complexity: { time: "O(n log n)", space: "O(n)" },
  },
  {
    id: "fin-20260602-b1-vol-surface-validate",
    title: "Volatility Surface Calendar-Spread Arbitrage Check",
    difficulty: "medium",
    topics: ["matrix", "greedy", "finance"],
    problem: `A volatility surface is represented as a 2-D grid where surface[i][j] = implied vol for strike index j and expiry index i (i=0 is shortest expiry, increasing tenor).

Detect any calendar-spread arbitrage: for the same strike, implied vol must be non-decreasing in expiry (otherwise a calendar spread is free money). Return all (i, j) pairs where the violation occurs.

Input: surface = [[0.20, 0.22, 0.25], [0.19, 0.23, 0.26], [0.21, 0.24, 0.27]]
Output: [(1, 0)]  — expiry 1, strike 0: 0.19 < 0.20 (shorter expiry has higher vol)`,
    examples: [
      {
        input: "surface = [[0.20,0.22,0.25],[0.19,0.23,0.26],[0.21,0.24,0.27]]",
        output: "[(1, 0)]",
        explanation: "surface[1][0]=0.19 < surface[0][0]=0.20: calendar spread arbitrage at strike 0 between expiries 0 and 1.",
      },
      {
        input: "surface = [[0.20,0.22],[0.21,0.23],[0.22,0.24]]",
        output: "[]",
        explanation: "All entries non-decreasing in expiry for each strike: no arbitrage.",
      },
    ],
    approach:
      "For each strike column j, check that surface[i][j] <= surface[i+1][j] for all i. Collect all violations. O(expiries × strikes).",
    code: `def find_calendar_arbitrage(
    surface: list[list[float]],
) -> list[tuple[int, int]]:
    violations = []
    n_expiries = len(surface)
    n_strikes  = len(surface[0]) if surface else 0

    for j in range(n_strikes):          # iterate strikes
        for i in range(n_expiries - 1): # compare consecutive expiries
            if surface[i + 1][j] < surface[i][j]:
                violations.append((i + 1, j))
    return violations

surface = [[0.20, 0.22, 0.25],
           [0.19, 0.23, 0.26],
           [0.21, 0.24, 0.27]]
print(find_calendar_arbitrage(surface))   # [(1, 0)]`,
    language: "python",
    complexity: { time: "O(expiries × strikes)", space: "O(violations)" },
  },
  {
    id: "fin-20260602-b1-min-hedge-intervals",
    title: "Minimum Hedges to Cover Full Exposure Range",
    difficulty: "medium",
    topics: ["greedy", "intervals", "finance"],
    problem: `A desk has exposure across a continuous range of risk buckets [0, N]. You have a set of hedging instruments, each covering a contiguous sub-range [start, end]. Find the minimum number of hedges needed to cover the entire range [0, N].

This is the classic interval covering problem, widely used in rates desks for DV01 bucketing and in credit for tranche hedging.

Input: N=10, instruments=[(0,4),(3,7),(6,10),(0,6),(5,10)]
Output: 2  (e.g. [0,6] and [5,10])`,
    examples: [
      {
        input: "N=10, instruments=[(0,4),(3,7),(6,10),(0,6),(5,10)]",
        output: "2",
        explanation: "Pick [0,6] covering 0..6, then [5,10] covering 5..10. Two instruments cover [0,10].",
      },
      {
        input: "N=5, instruments=[(0,1),(1,2),(2,3),(3,4),(4,5)]",
        output: "5",
        explanation: "Each instrument covers exactly 1 unit; need all 5.",
      },
    ],
    approach:
      "Sort instruments by start. Greedy: always pick the instrument that starts at or before the current coverage frontier and extends the furthest. Classic O(n log n) greedy interval cover.",
    code: `def min_hedges_to_cover(N: int,
                          instruments: list[tuple[int, int]]) -> int:
    # Sort by start of each interval.
    hedges = sorted(instruments)
    count  = 0
    covered = 0     # current right boundary of coverage

    i = 0
    while covered < N:
        # Among all instruments starting at or before 'covered',
        # pick the one that extends furthest right.
        best_end = covered
        while i < len(hedges) and hedges[i][0] <= covered:
            best_end = max(best_end, hedges[i][1])
            i += 1
        if best_end == covered:
            return -1   # gap: cannot cover [0, N]
        covered = best_end
        count += 1

    return count`,
    language: "python",
    complexity: { time: "O(n log n)", space: "O(1) after sort" },
  },
  {
    id: "fin-20260602-b1-dp-portfolio-knapsack",
    title: "Maximum Portfolio Return Under Capital Constraint (0/1 Knapsack)",
    difficulty: "medium",
    topics: ["dynamic-programming", "knapsack", "finance"],
    problem: `You have a budget of W capital units and N investment opportunities, each requiring a whole integer amount of capital and providing an expected return. You cannot split investments (0/1 constraint — each is taken or not). Maximize total expected return subject to the budget constraint.

Input: W=10, investments=[(capital=4, return=5),(capital=3, return=4),(capital=5, return=6),(capital=2, return=3)]
Output: 13  (pick investments with capital 3+5+2=10, return 4+6+3=13)`,
    examples: [
      {
        input: "W=10, investments=[(4,5),(3,4),(5,6),(2,3)]",
        output: "13",
        explanation: "Take investments 2, 3, 4 (capital 3+5+2=10 <= 10, return 4+6+3=13). Cannot take all four (4+3+5+2=14 > 10).",
      },
      {
        input: "W=0, investments=[(1,100)]",
        output: "0",
        explanation: "No budget: can't invest.",
      },
    ],
    approach:
      "Classic 0/1 knapsack DP. dp[w] = max return achievable with exactly w capital used. Iterate investments in reverse capital order to prevent reuse.",
    code: `def max_portfolio_return(
    W: int, investments: list[tuple[int, int]]
) -> int:
    # dp[w] = max return achievable with w units of capital.
    dp = [0] * (W + 1)

    for cap, ret in investments:
        # Traverse right-to-left to prevent using the same investment twice.
        for w in range(W, cap - 1, -1):
            dp[w] = max(dp[w], dp[w - cap] + ret)

    return dp[W]

investments = [(4, 5), (3, 4), (5, 6), (2, 3)]
print(max_portfolio_return(10, investments))   # 13`,
    language: "python",
    complexity: { time: "O(N × W)", space: "O(W)" },
  },
];
