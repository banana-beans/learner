import type { LeetCodeProblem } from "./index";

export const financeProblems20260730B1: LeetCodeProblem[] = [
  {
    id: "fin-20260730-b1-fx-arbitrage",
    title: "Detect FX Triangular Arbitrage (Bellman-Ford)",
    difficulty: "hard",
    topics: ["Graph", "Bellman-Ford", "Mathematics"],
    problem:
      "Given n currencies and a 2-D matrix rates where rates[i][j] is the exchange rate from currency i to currency j (0 means no direct exchange exists), detect whether an arbitrage opportunity exists — a sequence of exchanges starting and ending at the same currency that multiplies the initial capital by more than 1. Return True if arbitrage is possible.",
    examples: [
      {
        input: 'n=3, rates=[[1,1.2,0],[0,1,0.9],[0.95,0,1]]',
        output: "True",
        explanation:
          "USD→EUR→GBP→USD: 1.2 × 0.9 × 0.95 = 1.026 > 1. The log-weight cycle is negative, signalling riskless profit.",
      },
    ],
    constraints: [
      "2 ≤ n ≤ 50",
      "rates[i][i] = 1.0",
      "rates[i][j] > 0 if a direct exchange path exists, else 0",
    ],
    approach:
      "Transform to log space: set edge weight w(i→j) = −log(rates[i][j]). An arbitrage cycle corresponds to a negative-weight cycle in this graph. Run Bellman-Ford for n−1 rounds; if any edge relaxes on round n a negative cycle exists. O(V·E) time where V=n, E≤n².",
    code: `import math

def detect_arbitrage(n, rates):
    INF = float('inf')
    dist = [INF] * n
    dist[0] = 0.0

    edges = []
    for i in range(n):
        for j in range(n):
            if i != j and rates[i][j] > 0:
                edges.append((i, j, -math.log(rates[i][j])))

    # n-1 relaxation rounds
    for _ in range(n - 1):
        for u, v, w in edges:
            if dist[u] != INF and dist[u] + w < dist[v]:
                dist[v] = dist[u] + w

    # n-th round: any further relaxation => negative cycle => arbitrage
    for u, v, w in edges:
        if dist[u] != INF and dist[u] + w < dist[v]:
            return True
    return False

# USD->EUR->GBP->USD: 1.2 * 0.9 * 0.95 = 1.026
rates = [
    [1.0, 1.2, 0.0],
    [0.0, 1.0, 0.9],
    [0.95, 0.0, 1.0],
]
print(detect_arbitrage(3, rates))   # True

# No arbitrage version
rates2 = [
    [1.0, 1.2, 0.0],
    [0.0, 1.0, 0.8],
    [0.90, 0.0, 1.0],
]
print(detect_arbitrage(3, rates2))  # False (1.2*0.8*0.90 = 0.864 < 1)`,
    language: "python",
    complexity: { time: "O(V · E)", space: "O(V + E)" },
  },
  {
    id: "fin-20260730-b1-token-bucket",
    title: "Token Bucket Rate Limiter for Order Flow",
    difficulty: "medium",
    topics: ["Design", "Simulation", "Queue"],
    problem:
      "Design a token bucket rate limiter for an HFT order management system. Implement class TokenBucket with constructor(capacity: int, refill_rate: float) where capacity is the maximum burst size (tokens) and refill_rate is tokens added per second. Method allow_request(tokens: int = 1) -> bool returns True if at least `tokens` are available (consuming them), False otherwise. Tokens refill continuously up to capacity with no background thread.",
    examples: [
      {
        input: "TokenBucket(10, 5.0); 12 immediate allow_request() calls",
        output: "[True]*10 + [False, False]",
        explanation:
          "Burst capacity of 10 is exhausted in the first 10 instant calls; tokens refill at 5/s, so two more instant calls fail.",
      },
    ],
    approach:
      "Lazy refill: on each call compute elapsed = now − last_refill, add elapsed × rate to token count (capped at capacity), then deduct if sufficient. O(1) per request, no background thread or scheduled timer needed. Uses time.monotonic() for monotone clock.",
    code: `import time

class TokenBucket:
    def __init__(self, capacity: int, refill_rate: float):
        self.capacity = capacity
        self.tokens = float(capacity)  # start full
        self.refill_rate = refill_rate
        self.last_time = time.monotonic()

    def allow_request(self, tokens: int = 1) -> bool:
        now = time.monotonic()
        elapsed = now - self.last_time
        self.tokens = min(self.capacity,
                          self.tokens + elapsed * self.refill_rate)
        self.last_time = now
        if self.tokens >= tokens:
            self.tokens -= tokens
            return True
        return False

# Simulate: burst 10 orders, then wait 0.5 s (5 tokens refill), then 5 more
bucket = TokenBucket(capacity=10, refill_rate=10.0)
immediate = [bucket.allow_request() for _ in range(12)]
print("Immediate burst:", immediate)  # True*10, False*2

time.sleep(0.5)
after_wait = [bucket.allow_request() for _ in range(6)]
print("After 0.5 s:", after_wait)   # True*5 (10*0.5), False`,
    language: "python",
    complexity: { time: "O(1) per call", space: "O(1)" },
  },
  {
    id: "fin-20260730-b1-regime-matrix-power",
    title: "Regime State After K Steps (Matrix Exponentiation)",
    difficulty: "medium",
    topics: ["Matrix", "Dynamic Programming", "Mathematics"],
    problem:
      "A market switches between n regimes (e.g., Bull, Bear, Sideways) according to a row-stochastic transition matrix P where P[i][j] is the probability of moving from regime i to regime j in one step. Given an initial probability vector s0 over regimes and an integer k, compute the state distribution after exactly k steps without multiplying P by itself k times naively.",
    examples: [
      {
        input: "P=[[0.9,0.1],[0.3,0.7]], s0=[1,0], k=100",
        output: "[0.75, 0.25]",
        explanation:
          "After 100 steps the chain has converged to its stationary distribution (solve πP=π: π_bull = 0.3/(0.1+0.3) = 0.75).",
      },
    ],
    approach:
      "Compute P^k via repeated squaring (matrix fast-power): start with identity, then double the matrix while halving k (use the LSB). Each matrix multiply is O(n³); total O(n³ log k). Multiply s0 @ P^k to get the final distribution.",
    code: `def mat_mul(A, B):
    n = len(A)
    C = [[0.0] * n for _ in range(n)]
    for i in range(n):
        for r in range(n):
            if A[i][r] == 0:
                continue
            for j in range(n):
                C[i][j] += A[i][r] * B[r][j]
    return C

def mat_pow(M, k):
    n = len(M)
    result = [[1.0 if i == j else 0.0 for j in range(n)]
              for i in range(n)]  # identity
    base = [row[:] for row in M]
    while k > 0:
        if k & 1:
            result = mat_mul(result, base)
        base = mat_mul(base, base)
        k >>= 1
    return result

def state_after_k(P, s0, k):
    Pk = mat_pow(P, k)
    n = len(s0)
    return [sum(s0[i] * Pk[i][j] for i in range(n)) for j in range(n)]

# Bull/Bear 2-state chain
P = [[0.9, 0.1],
     [0.3, 0.7]]
s0 = [1.0, 0.0]  # start fully in Bull

for k in [1, 10, 100]:
    dist = state_after_k(P, s0, k)
    print(f"k={k:3d}: bull={dist[0]:.4f}  bear={dist[1]:.4f}")
# Stationary: bull=0.75, bear=0.25`,
    language: "python",
    complexity: { time: "O(n³ log k)", space: "O(n²)" },
  },
  {
    id: "fin-20260730-b1-rolling-vwap",
    title: "Rolling VWAP with Fixed Window (Deque)",
    difficulty: "easy",
    topics: ["Sliding Window", "Deque", "Array"],
    problem:
      "Given arrays prices and volumes of length n representing sequential trades, compute the Volume-Weighted Average Price (VWAP = Σ(price×volume) / Σvolume) over a rolling window of exactly w trades. Return a list of VWAP values for each window position where a full window is available (n − w + 1 values).",
    examples: [
      {
        input: "prices=[100,102,101,103], volumes=[200,150,300,100], w=3",
        output: "[100.923, 101.636]",
        explanation:
          "Window 1: (100×200+102×150+101×300)/650=100.923. Window 2: (102×150+101×300+103×100)/550=101.636.",
      },
    ],
    approach:
      "Maintain running sum_pv = Σ(price×volume) and sum_v = Σvolume. Use a deque to store (price, volume) pairs entering the window; on each step append the new trade and remove the oldest if the window exceeds w. VWAP = sum_pv / sum_v. O(n) total.",
    code: `from collections import deque

def rolling_vwap(prices, volumes, w):
    window = deque()   # (price, volume)
    sum_pv = 0.0
    sum_v  = 0.0
    result = []

    for p, v in zip(prices, volumes):
        window.append((p, v))
        sum_pv += p * v
        sum_v  += v

        if len(window) > w:
            old_p, old_v = window.popleft()
            sum_pv -= old_p * old_v
            sum_v  -= old_v

        if len(window) == w:
            result.append(sum_pv / sum_v)

    return result

prices  = [100, 102, 101, 103, 105, 104]
volumes = [200, 150, 300, 100, 250, 200]
vwap = rolling_vwap(prices, volumes, w=3)
for i, v in enumerate(vwap):
    print(f"window [{i}:{i+3}]  VWAP = {v:.4f}")`,
    language: "python",
    complexity: { time: "O(n)", space: "O(w)" },
  },
  {
    id: "fin-20260730-b1-next-greater-bid",
    title: "Next Greater Bid Price (Monotonic Stack)",
    difficulty: "medium",
    topics: ["Monotonic Stack", "Array"],
    problem:
      "Given a sequence of bid prices across n ticks, for each tick i find the index of the next tick j > i where prices[j] > prices[i]. Return an array result where result[i] = j, or −1 if no such tick exists. This models 'time to next breakout' for each bid level.",
    examples: [
      {
        input: "prices = [98, 100, 97, 105, 103, 110, 99]",
        output: "[1, 3, 3, 5, 5, -1, -1]",
        explanation:
          "Tick 0 (98): next higher is tick 1 (100). Tick 1 (100): next higher is tick 3 (105). Tick 5 (110): no higher bid exists, so −1.",
      },
    ],
    approach:
      "Maintain a stack of indices whose 'next greater' has not yet been found. Iterate left to right; for each new price pop all stack entries with a lower price (they found their answer) and push the current index. Remaining stack entries get −1. O(n) time — each index is pushed and popped at most once.",
    code: `def next_greater_bid(prices):
    n = len(prices)
    result = [-1] * n
    stack = []  # indices awaiting their next greater bid

    for i in range(n):
        while stack and prices[stack[-1]] < prices[i]:
            idx = stack.pop()
            result[idx] = i
        stack.append(i)

    return result

prices = [98, 100, 97, 105, 103, 110, 99]
ng = next_greater_bid(prices)

print("tick  bid  next_higher_at")
for i, (p, nxt) in enumerate(zip(prices, ng)):
    nxt_str = str(nxt) if nxt != -1 else "none"
    print(f"  {i}   {p}       {nxt_str}")`,
    language: "python",
    complexity: { time: "O(n)", space: "O(n)" },
  },
  {
    id: "fin-20260730-b1-gamblers-ruin",
    title: "Gambler's Ruin — Probability of Reaching Zero",
    difficulty: "medium",
    topics: ["Dynamic Programming", "Mathematics", "Probability"],
    problem:
      "A trader starts with capital k and bets 1 unit each round, winning with probability p and losing with probability 1−p. Trading stops when capital reaches 0 (ruin) or N (target). Compute the probability of ruin (capital hits 0 before N). Then validate with Monte Carlo simulation.",
    examples: [
      {
        input: "k=10, N=20, p=0.48",
        output: "exact ≈ 0.6690",
        explanation:
          "Slightly unfavourable (p < 0.5) tilts the odds toward ruin. The closed-form uses the ratio r = (1−p)/p.",
      },
    ],
    constraints: [
      "0 < k < N ≤ 1000",
      "0 < p < 1",
    ],
    approach:
      "For p ≠ 0.5: P(ruin | start=k) = (r^k − r^N)/(1 − r^N) where r = (1−p)/p. For p = 0.5 (fair game): P(ruin) = (N−k)/N. Both follow from solving the second-order linear recurrence P(k) = p·P(k+1) + (1−p)·P(k−1). Verify against Monte Carlo.",
    code: `import random

def ruin_probability(k, N, p):
    if abs(p - 0.5) < 1e-12:
        return (N - k) / N          # fair game
    r = (1 - p) / p
    return (r**k - r**N) / (1 - r**N)

def ruin_simulation(k, N, p, trials=200_000):
    ruin = 0
    for _ in range(trials):
        w = k
        while 0 < w < N:
            w += 1 if random.random() < p else -1
        if w == 0:
            ruin += 1
    return ruin / trials

k, N, p = 10, 20, 0.48
exact = ruin_probability(k, N, p)
simul = ruin_simulation(k, N, p)
print(f"Exact:    {exact:.4f}")
print(f"Simulated:{simul:.4f}")

# Symmetric ruin: k=5, N=10, p=0.5  =>  (10-5)/10 = 0.5
print(f"Fair game: {ruin_probability(5, 10, 0.5):.4f}")  # 0.5000`,
    language: "python",
    complexity: { time: "O(1) closed-form, O(N·trials) simulation", space: "O(1)" },
  },
  {
    id: "fin-20260730-b1-mst-correlation-portfolio",
    title: "Minimum Spanning Tree for Diversified Portfolio (Kruskal's)",
    difficulty: "hard",
    topics: ["Graph", "Union-Find", "Greedy"],
    problem:
      "Given n assets and their pairwise correlations, build a Minimum Spanning Tree where edge weight = 1 − |correlation| (lower weight = higher correlation = less diversification benefit). The MST is a classic tool in portfolio construction: it highlights the most correlated pairs and provides a hierarchical clustering structure. Return the MST edge list and total weight.",
    examples: [
      {
        input: "assets=['SPY','GLD','TLT','BTC'], corr_matrix with corr(SPY,GLD)=0.7, corr(SPY,TLT)=0.2, ...",
        output: "MST edges with minimum total distance",
        explanation:
          "MST selects edges greedily by ascending distance (1−|corr|), connecting all n assets with n−1 edges and no cycles, maximising overall diversification.",
      },
    ],
    approach:
      "Build all n*(n−1)/2 edges with weight 1−|corr[i][j]|. Sort by weight ascending. Use Kruskal's with Union-Find (path compression + rank): greedily add the cheapest edge that doesn't form a cycle until n−1 edges are chosen. O(E log E) dominated by sort.",
    code: `def kruskal_mst(n, edges):
    """edges: list of (weight, u, v)"""
    parent = list(range(n))
    rank   = [0] * n

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]  # path compression
            x = parent[x]
        return x

    def union(x, y):
        rx, ry = find(x), find(y)
        if rx == ry:
            return False
        if rank[rx] < rank[ry]:
            rx, ry = ry, rx
        parent[ry] = rx
        if rank[rx] == rank[ry]:
            rank[rx] += 1
        return True

    mst_edges, total = [], 0.0
    for w, u, v in sorted(edges):
        if union(u, v):
            mst_edges.append((u, v, w))
            total += w
            if len(mst_edges) == n - 1:
                break
    return mst_edges, total

assets = ['SPY', 'GLD', 'TLT', 'BTC', 'OIL']
corr   = {
    (0,1): 0.3, (0,2): -0.2, (0,3): 0.5, (0,4): 0.6,
    (1,2): 0.15,(1,3): 0.1,  (1,4): 0.2,
    (2,3):-0.1, (2,4):-0.15,
    (3,4): 0.35,
}
edges = [(1 - abs(c), i, j) for (i, j), c in corr.items()]
mst, total_dist = kruskal_mst(5, edges)
print(f"MST total distance: {total_dist:.3f}")
for u, v, w in mst:
    print(f"  {assets[u]}-{assets[v]}  dist={w:.3f}  corr={1-w:.3f}")`,
    language: "python",
    complexity: { time: "O(E log E)", space: "O(V)" },
  },
  {
    id: "fin-20260730-b1-allocation-dp",
    title: "Optimal Portfolio Allocation (Unbounded Knapsack)",
    difficulty: "medium",
    topics: ["Dynamic Programming", "Greedy"],
    problem:
      "You have a budget B (integer, in $000s) and n investment vehicles, each requiring a fixed cost (integer) and delivering a fixed expected annual return (float). You may invest in the same vehicle multiple times (unbounded). Maximise total expected return. Return the maximum return achievable and the allocation.",
    examples: [
      {
        input: "budget=60, assets=[(10,1.2),(15,1.8),(20,2.5),(30,3.8)]",
        output: "max_return=7.6",
        explanation: "Buy two units of (30, 3.8): 2×30=60, return=2×3.8=7.6. This beats (20+20+20)=6×2.5 nope — 3×20=60, return=7.5. So two (30,3.8) wins.",
      },
    ],
    approach:
      "Unbounded knapsack DP: dp[w] = best total return with exactly budget w. For each asset (cost c, return r), scan w from c to B and update dp[w] = max(dp[w], dp[w−c] + r). Backtrack from dp[B] to recover the allocation. O(n·B) time.",
    code: `def max_portfolio_return(assets, budget):
    # assets: list of (cost, expected_return)
    dp = [0.0] * (budget + 1)
    choice = [-1] * (budget + 1)  # which asset was chosen at each budget

    for w in range(1, budget + 1):
        for idx, (cost, ret) in enumerate(assets):
            if cost <= w and dp[w - cost] + ret > dp[w]:
                dp[w] = dp[w - cost] + ret
                choice[w] = idx

    # Backtrack allocation
    alloc = [0] * len(assets)
    w = budget
    while w > 0 and choice[w] != -1:
        idx = choice[w]
        alloc[idx] += 1
        w -= assets[idx][0]

    return dp[budget], alloc

assets = [(10, 1.2), (15, 1.8), (20, 2.5), (30, 3.8)]
budget = 60
best_return, allocation = max_portfolio_return(assets, budget)
print(f"Max expected return: {best_return:.2f}")
for (cost, ret), qty in zip(assets, allocation):
    if qty > 0:
        print(f"  cost={cost}k  ret={ret}  x{qty}  => {qty*ret:.2f}")`,
    language: "python",
    complexity: { time: "O(n · B)", space: "O(B)" },
  },
  {
    id: "fin-20260730-b1-valid-trade-sequences",
    title: "Count Valid Trading Sequences with Position Limit (DP)",
    difficulty: "medium",
    topics: ["Dynamic Programming", "Combinatorics"],
    problem:
      "Count the number of distinct n-step binary trading sequences (each step is Buy or Sell) where no more than maxB consecutive Buys appear in a row (a position-limit rule). Return the count modulo 10^9+7. A sequence like [B,B,B,S] with maxB=2 is invalid because of 3 consecutive buys.",
    examples: [
      {
        input: "n=4, maxB=2",
        output: "13",
        explanation:
          "Total 2^4=16 sequences. Invalid: BBB*, *BBB (with overlap) → sequences containing BBB: BBBB(1), BBBS(1), SBBB(1) = 3 invalid. 16-3=13.",
      },
    ],
    approach:
      "DP state dp[j] = number of valid sequences of current length ending with exactly j consecutive Buys (j=0 means last action was Sell). Transition: Sell resets j to 0 (new_dp[0] += sum(dp)); Buy increments j by 1 (new_dp[j] = dp[j-1]) for j ≤ maxB. O(n · maxB) time.",
    code: `def count_valid_sequences(n, max_consec_buys):
    MOD = 10**9 + 7
    # dp[j] = # valid sequences of current length ending with j consec buys
    dp = [0] * (max_consec_buys + 1)
    dp[0] = 1  # empty sequence: 0 consecutive buys

    for _ in range(n):
        new_dp = [0] * (max_consec_buys + 1)
        # Action: Sell — resets consecutive buy count to 0
        new_dp[0] = sum(dp) % MOD
        # Action: Buy — increments consecutive buy count (if within limit)
        for j in range(1, max_consec_buys + 1):
            new_dp[j] = dp[j - 1]
        dp = new_dp

    return sum(dp) % MOD

# Validation: n=3, maxB=3 should be 2^3=8 (no restriction hit)
print(count_valid_sequences(3, 3))   # 8

# n=4, maxB=2: should be 13
print(count_valid_sequences(4, 2))   # 13

# Larger example
for days in [10, 20, 50]:
    cnt = count_valid_sequences(days, max_consec_buys=3)
    print(f"n={days:2d}, maxB=3: {cnt} valid sequences")`,
    language: "python",
    complexity: { time: "O(n · maxB)", space: "O(maxB)" },
  },
  {
    id: "fin-20260730-b1-k-smallest-spread-pairs",
    title: "K Pairs with Smallest Absolute Spread (Heap)",
    difficulty: "medium",
    topics: ["Heap", "Two Pointers", "Sorting"],
    problem:
      "Given two sorted arrays of returns A and B (each of length n), find the k pairs (i, j) with the smallest |A[i] − B[j]| (the spread between two assets at those indices). This models finding the k most mean-reverting moment pairs in a pairs-trading scan. Return the k pairs sorted by spread ascending.",
    examples: [
      {
        input: "A=[-0.02,-0.01,0.01,0.03], B=[-0.015,0.005,0.02,0.04], k=3",
        output: "[(1,0,0.005), (0,0,0.005), (2,1,0.005)]  approx",
        explanation: "Pairs where |A[i]-B[j]| is smallest first. Since both arrays are sorted, adjacent elements in the merged order have small differences.",
      },
    ],
    approach:
      "Sort both arrays. Use a min-heap seeded with (|A[0]-B[0]|, 0, 0). On each pop of (spread, i, j), record the pair and push (i+1,j) and (i,j+1) if not already visited. Use a seen-set to avoid duplicates. O(k log k) after the O(n log n) sort.",
    code: `import heapq

def k_smallest_spread_pairs(A, B, k):
    A = sorted(enumerate(A), key=lambda x: x[1])
    B = sorted(enumerate(B), key=lambda x: x[1])
    na, nb = len(A), len(B)

    # heap: (abs_spread, i_in_sorted_A, j_in_sorted_B)
    heap = []
    seen = set()

    def push(i, j):
        if 0 <= i < na and 0 <= j < nb and (i, j) not in seen:
            seen.add((i, j))
            spread = abs(A[i][1] - B[j][1])
            heapq.heappush(heap, (spread, i, j))

    push(0, 0)
    result = []

    while heap and len(result) < k:
        spread, i, j = heapq.heappop(heap)
        orig_i, ai = A[i]
        orig_j, bj = B[j]
        result.append((orig_i, orig_j, round(spread, 6)))
        push(i + 1, j)
        push(i, j + 1)

    return result

A = [-0.02, -0.01,  0.01,  0.03,  0.05]
B = [-0.015,  0.005, 0.02,  0.04,  0.06]
pairs = k_smallest_spread_pairs(A, B, k=4)
print("i    j    |spread|")
for orig_i, orig_j, s in pairs:
    print(f"{orig_i}    {orig_j}    {s:.4f}")`,
    language: "python",
    complexity: { time: "O(n log n + k log k)", space: "O(k)" },
  },
];
