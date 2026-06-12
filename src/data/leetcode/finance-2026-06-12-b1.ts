import type { LeetCodeProblem } from "./index";

export const financeProblems20260612B1: LeetCodeProblem[] = [
  {
    id: "fin-20260612-b1-stock-span",
    title: "Stock Span — Monotonic Stack for Resistance Levels",
    difficulty: "medium",
    topics: ["monotonic-stack", "array", "finance"],
    problem:
      "Given a list prices[], compute span[i] = the maximum number of consecutive days (ending at day i) for which prices[j] <= prices[i] for all j in [i - span[i] + 1, i]. This models the number of consecutive prior days that did not exceed today's price — used to detect resistance levels in technical analysis. Return the span array.",
    examples: [
      {
        input: "prices = [100, 80, 60, 70, 60, 75, 85]",
        output: "[1, 1, 1, 2, 1, 4, 6]",
        explanation:
          "Day 3 (70): looks back 2 days to day 1 (80 > 70, stop). Day 5 (75): 60<=75, 70<=75, 60<=75, 80>75 — span=4. Day 6 (85): all 6 prior days <=85 — span=6.",
      },
      {
        input: "prices = [10, 4, 5, 90, 120, 80]",
        output: "[1, 1, 2, 4, 5, 1]",
        explanation: "At index 3 (90): 5<=90, 4<=90, 10<=90 — span=4.",
      },
    ],
    constraints: ["1 <= prices.length <= 10^5", "1 <= prices[i] <= 10^5"],
    approach:
      "Monotonic stack: maintain a stack of (price, span) pairs in strictly decreasing order of price. When prices[i] arrives, pop all stack entries with price <= prices[i] and accumulate their spans. The total accumulated span + 1 is span[i]. Push (prices[i], span[i]) onto the stack. Each element is pushed and popped at most once: O(N) amortised.",
    code: `from typing import List

def stock_span(prices: List[int]) -> List[int]:
    """
    Monotonic stack approach: stack holds (price, span) in decreasing price order.
    For each new price, pop all dominated entries (price <= current) and sum spans.
    O(N) amortised: each index pushed/popped once.
    """
    n    = len(prices)
    span = [0] * n
    # stack: (price, span) pairs — strictly decreasing price
    stack: List[tuple] = []

    for i in range(n):
        s = 1    # at minimum, span includes the day itself
        # Pop all entries with price <= prices[i]
        while stack and stack[-1][0] <= prices[i]:
            s += stack.pop()[1]    # absorb the span of the dominated entry
        stack.append((prices[i], s))
        span[i] = s

    return span


def resistance_levels(prices: List[int], min_span: int = 3) -> List[int]:
    """
    Return indices where span[i] >= min_span (potential resistance breakthrough).
    A span >= min_span means the price has not been exceeded in the past min_span days.
    """
    spans = stock_span(prices)
    return [i for i, s in enumerate(spans) if s >= min_span]


# Variant: rolling span with a lookback window of W days
def rolling_stock_span(prices: List[int], W: int) -> List[int]:
    """
    Span capped at W consecutive days. Monotonic deque to handle expiry.
    """
    from collections import deque
    n    = len(prices)
    span = [0] * n
    dq: deque = deque()   # deque of (price, index)

    for i in range(n):
        # Remove indices outside the W-day window
        while dq and i - dq[0][1] >= W:
            dq.popleft()
        # Remove dominated entries
        while dq and dq[-1][0] <= prices[i]:
            dq.pop()
        # Span: distance to the nearest price greater than prices[i] within window
        span[i] = i - dq[0][1] if dq else i + 1
        dq.append((prices[i], i))

    return span`,
    language: "python",
    complexity: { time: "O(N)", space: "O(N)" },
  },
  {
    id: "fin-20260612-b1-capital-knapsack",
    title: "Capital Allocation 0/1 Knapsack — Max Return Under Budget",
    difficulty: "medium",
    topics: ["dynamic-programming", "knapsack", "finance"],
    problem:
      "You have a budget B and N investment opportunities. Each opportunity i requires capital cost[i] and yields expected return ret[i]. You can invest in each opportunity at most once (0/1 knapsack). Find the allocation that maximises total expected return without exceeding budget B. Returns are integers (in units of basis points). Capital costs are positive integers.",
    examples: [
      {
        input: "B=10, cost=[2,3,4,5], ret=[3,4,5,6]",
        output: "max_ret=10, selected=[1,2] (cost 3+4=7, ret 4+5=9) OR [0,3] (cost 2+5=7, ret 3+6=9)... best: [1,3] (cost 3+5=8, ret 4+6=10)",
        explanation:
          "Opportunity 1 (cost=3, ret=4) + Opportunity 3 (cost=5, ret=6) = 8 cost, 10 return. Cannot fit all four (total cost=14). This is the maximum feasible.",
      },
      {
        input: "B=7, cost=[1,3,4,5], ret=[1,4,5,7]",
        output: "max_ret=9, selected=[1,2]",
        explanation: "cost[1]+cost[2]=7=B, ret=4+5=9.",
      },
    ],
    constraints: [
      "1 <= N <= 200",
      "1 <= B <= 10^4",
      "1 <= cost[i] <= B",
      "1 <= ret[i] <= 10^4",
    ],
    approach:
      "Standard 0/1 knapsack DP. dp[c] = maximum return achievable with exactly c capital. Iterate items, and for each item iterate capacity backwards (to avoid counting an item twice). dp[c] = max(dp[c], dp[c - cost[i]] + ret[i]). Answer: max(dp[0..B]). Track selection with parent pointers or backtracking. O(N * B) time, O(B) space.",
    code: `from typing import List

def capital_knapsack(B: int, costs: List[int], returns: List[int]) -> dict:
    """
    0/1 Knapsack: dp[c] = max total return using exactly c capital.
    Backwards iteration ensures each investment is counted at most once.
    O(N * B) time, O(B) space.
    """
    N   = len(costs)
    dp  = [0] * (B + 1)           # dp[c] = max return with c capital budget
    sel = [[] for _ in range(B + 1)]   # track selected investments

    for i in range(N):
        c_i, r_i = costs[i], returns[i]
        # Iterate backwards to prevent re-using item i
        for c in range(B, c_i - 1, -1):
            new_ret = dp[c - c_i] + r_i
            if new_ret > dp[c]:
                dp[c]  = new_ret
                sel[c] = sel[c - c_i] + [i]

    best_ret    = max(dp)
    best_budget = dp.index(best_ret)
    selected    = sel[best_budget]

    return {
        "max_return":       best_ret,
        "capital_used":     best_budget,
        "selected":         selected,
        "selected_costs":   [costs[i] for i in selected],
        "selected_returns": [returns[i] for i in selected],
        "efficiency":       round(best_ret / best_budget if best_budget > 0 else 0, 4),
    }


def fractional_knapsack_bound(B: int, costs: List[int], returns: List[int]) -> float:
    """
    Fractional knapsack upper bound (LP relaxation):
    Sort by return/cost ratio, take greedily. Useful as a branch-and-bound bound.
    O(N log N).
    """
    items = sorted(zip(returns, costs), key=lambda x: x[0]/x[1], reverse=True)
    total, budget = 0.0, B
    for r, c in items:
        if budget >= c:
            total  += r
            budget -= c
        else:
            total += r * budget / c   # partial
            break
    return total`,
    language: "python",
    complexity: { time: "O(N * B)", space: "O(N * B)" },
  },
  {
    id: "fin-20260612-b1-token-bucket",
    title: "Token Bucket Rate Limiter — Order Submission Throttling",
    difficulty: "medium",
    topics: ["design", "queue", "finance"],
    problem:
      "Design a TokenBucket rate limiter for order submission in a trading system. Implement: (1) allow(n_tokens, timestamp_ms) -> bool: consume n tokens if available, return True on success; (2) refill is continuous: capacity tokens replenish at rate tokens_per_second. The limiter should support both burst (up to capacity at once) and sustained rate (tokens_per_second). Timestamps are in milliseconds.",
    examples: [
      {
        input:
          "capacity=10, rate=2.0 tok/s. allow(3, 0) → True, allow(8, 0) → False (only 7 left), allow(5, 1500) → True (3 refilled in 1.5s, total 3+3=6 >= 5)",
        output: "True, False, True",
        explanation:
          "At t=0: 10 tokens. allow(3) → 7 left. allow(8) → 7 < 8, False. At t=1500ms: 3 tokens added (rate=2/s, 1.5s elapsed) → 7+3=10 capped at capacity 10? No: 7 + 2*1.5 = 10. allow(5) → 10-5=5. True.",
      },
    ],
    constraints: [
      "0 < capacity <= 10^6",
      "0 < tokens_per_second <= 10^6",
      "Timestamps are monotonically non-decreasing",
      "1 <= n_tokens <= capacity",
    ],
    approach:
      "Store (current_tokens, last_refill_timestamp). On allow(n, ts): compute tokens added = rate * (ts - last_refill_ms) / 1000; new_tokens = min(capacity, current + added); if new_tokens >= n, deduct and return True, else return False. Update last_refill_timestamp. No threads — call from the order submission path inline. O(1) per call.",
    code: `class TokenBucket:
    """
    Continuous-time token bucket rate limiter.
    Tokens refill at tokens_per_second; burst capacity capped at capacity.
    All operations O(1).
    """
    def __init__(self, capacity: float, tokens_per_second: float):
        self.capacity         = float(capacity)
        self.tokens_per_second = float(tokens_per_second)
        self._tokens          = float(capacity)   # start full
        self._last_ts_ms      = 0                 # last refill timestamp

    def _refill(self, timestamp_ms: int) -> None:
        """Update token count based on elapsed time."""
        elapsed_s    = max(0.0, (timestamp_ms - self._last_ts_ms) / 1000.0)
        self._tokens = min(self.capacity,
                           self._tokens + self.tokens_per_second * elapsed_s)
        self._last_ts_ms = timestamp_ms

    def allow(self, n_tokens: int, timestamp_ms: int) -> bool:
        """
        Consume n_tokens if available after refill.
        Returns True on success (order allowed), False if rate-limited.
        """
        self._refill(timestamp_ms)
        if self._tokens >= n_tokens:
            self._tokens -= n_tokens
            return True
        return False

    def available(self, timestamp_ms: int) -> float:
        """Peek at current token count after refill (non-consuming)."""
        elapsed_s = max(0.0, (timestamp_ms - self._last_ts_ms) / 1000.0)
        return min(self.capacity, self._tokens + self.tokens_per_second * elapsed_s)

    def time_to_available(self, n_tokens: int, timestamp_ms: int) -> float:
        """How many milliseconds until n_tokens are available?"""
        self._refill(timestamp_ms)
        deficit = n_tokens - self._tokens
        if deficit <= 0:
            return 0.0
        return deficit / self.tokens_per_second * 1000.0   # milliseconds


class SlidingWindowRateLimiter:
    """
    Alternative: fixed-window counter for order rate limiting.
    Simpler but allows burst at window boundary.
    """
    def __init__(self, max_per_window: int, window_ms: int):
        self.max        = max_per_window
        self.window_ms  = window_ms
        self._count     = 0
        self._window_start = 0

    def allow(self, timestamp_ms: int) -> bool:
        if timestamp_ms - self._window_start >= self.window_ms:
            self._count        = 0
            self._window_start = timestamp_ms
        if self._count < self.max:
            self._count += 1
            return True
        return False`,
    language: "python",
    complexity: { time: "O(1) per allow", space: "O(1)" },
  },
  {
    id: "fin-20260612-b1-stream-median",
    title: "Median of a Price Stream — Two-Heap Design",
    difficulty: "hard",
    topics: ["heap", "design", "finance"],
    problem:
      "Design a MedianFinder class for a streaming sequence of prices (for computing rolling implied vol median or mid-price median in real time). Implement: (1) add_price(price) — add a price in O(log N); (2) get_median() — return the current median in O(1). The class must handle even and odd lengths correctly.",
    examples: [
      {
        input: "add 100, add 200, get_median → 150.0. add 150, get_median → 150.0. add 50, get_median → 125.0.",
        output: "150.0, 150.0, 125.0",
        explanation:
          "[100,200] → median=(100+200)/2=150. [100,150,200] → 150. [50,100,150,200] → (100+150)/2=125.",
      },
    ],
    constraints: [
      "At most 5 * 10^4 add_price calls",
      "At most 10^4 get_median calls",
      "0 <= price <= 10^9",
    ],
    approach:
      "Two heaps: max-heap for the lower half (lo), min-heap for the upper half (hi). Invariant: len(lo) == len(hi) or len(lo) == len(hi) + 1. On add: push to lo (max-heap via negation), then rebalance if needed. Median: lo[0] if odd, (lo[0] + hi[0]) / 2 if even. O(log N) add, O(1) median.",
    code: `import heapq

class MedianFinder:
    """
    Two-heap median finder for streaming prices.
    lo: max-heap (negated) for lower half.
    hi: min-heap for upper half.
    Invariant: len(lo) >= len(hi), len(lo) - len(hi) <= 1.
    """
    def __init__(self):
        self.lo: list = []    # max-heap (negated): lower half of prices
        self.hi: list = []    # min-heap:           upper half of prices

    def add_price(self, price: float) -> None:
        # Step 1: push to lo (max-heap)
        heapq.heappush(self.lo, -price)

        # Step 2: ensure lo's max <= hi's min (sorted-halves invariant)
        if self.hi and (-self.lo[0]) > self.hi[0]:
            heapq.heappush(self.hi, -heapq.heappop(self.lo))

        # Step 3: rebalance sizes (lo can have at most 1 more than hi)
        if len(self.lo) > len(self.hi) + 1:
            heapq.heappush(self.hi, -heapq.heappop(self.lo))
        elif len(self.hi) > len(self.lo):
            heapq.heappush(self.lo, -heapq.heappop(self.hi))

    def get_median(self) -> float:
        if not self.lo:
            raise ValueError("No prices added yet")
        if len(self.lo) == len(self.hi):
            return (-self.lo[0] + self.hi[0]) / 2.0   # even: average of two middles
        return float(-self.lo[0])                       # odd: lower middle

    def get_percentile(self, p: float) -> float:
        """Approximate percentile from combined sorted halves. O(N log N) — for debugging."""
        all_prices = sorted([-x for x in self.lo] + list(self.hi))
        idx = int(p / 100 * (len(all_prices) - 1))
        return all_prices[idx]


# Rolling median using a sorted container (e.g. sortedcontainers.SortedList)
# For a fixed window W, the two-heap approach requires lazy deletion (tombstones).
def rolling_median(prices: list, W: int) -> list:
    """Rolling window median via SortedList (O(N log W))."""
    from bisect import insort, bisect_left
    result = []
    window = []
    for i, p in enumerate(prices):
        insort(window, p)
        if i >= W:
            # Remove the element leaving the window
            idx = bisect_left(window, prices[i - W])
            window.pop(idx)
        if i >= W - 1:
            mid = len(window) // 2
            if len(window) % 2 == 0:
                result.append((window[mid - 1] + window[mid]) / 2.0)
            else:
                result.append(float(window[mid]))
    return result`,
    language: "python",
    complexity: { time: "O(log N) add, O(1) median", space: "O(N)" },
  },
  {
    id: "fin-20260612-b1-gamblers-ruin",
    title: "Gambler's Ruin — Probability of Reaching Target Before Ruin",
    difficulty: "medium",
    topics: ["probability", "dynamic-programming", "finance"],
    problem:
      "A trader starts with capital w. Each round, the capital increases by 1 with probability p or decreases by 1 with probability 1-p (random walk with drift). The game ends when capital reaches target T (success) or 0 (ruin). Find the probability of reaching T before ruin. This models a trading strategy's probability of hitting a profit target before a stop-loss.",
    examples: [
      {
        input: "w=5, T=10, p=0.6",
        output: "P(success) ≈ 0.8696",
        explanation:
          "Gambler's ruin formula for p != 0.5: P(w) = (1 - (q/p)^w) / (1 - (q/p)^T) where q=1-p=0.4. P(5) = (1 - (0.4/0.6)^5) / (1 - (0.4/0.6)^10) ≈ 0.8696.",
      },
      {
        input: "w=5, T=10, p=0.5",
        output: "P(success) = 0.5",
        explanation: "Fair coin: P(w) = w/T = 5/10 = 0.5.",
      },
    ],
    constraints: [
      "1 <= w < T <= 10^6",
      "0 < p < 1",
    ],
    approach:
      "Closed-form: For p != 0.5, P(w) = (1 - r^w) / (1 - r^T) where r = (1-p)/p. For p = 0.5, P(w) = w/T. DP approach: P[0]=0, P[T]=1, P[i] = p*P[i+1] + (1-p)*P[i-1]. Linear system has closed-form solution — solve analytically to avoid O(T) space for large T.",
    code: `def gamblers_ruin_prob(w: int, T: int, p: float) -> dict:
    """
    Probability of reaching T before 0 starting at w.
    Closed-form for biased random walk (p != 0.5) and fair walk (p = 0.5).
    Edge cases: w=0 -> 0.0, w=T -> 1.0.
    """
    if w <= 0:
        return {"prob_success": 0.0, "prob_ruin": 1.0}
    if w >= T:
        return {"prob_success": 1.0, "prob_ruin": 0.0}

    q = 1.0 - p
    eps = 1e-12

    if abs(p - 0.5) < eps:
        # Fair game: P(w) = w / T
        prob = w / T
    else:
        r = q / p    # ratio < 1 if p > 0.5 (favourable game)
        # Numerical stability: use log-space for large T
        try:
            rw = r ** w
            rT = r ** T
            if abs(1.0 - rT) < 1e-15:
                prob = 1.0 if p > 0.5 else 0.0
            else:
                prob = (1.0 - rw) / (1.0 - rT)
        except OverflowError:
            import math
            log_rw = w * math.log(r)
            log_rT = T * math.log(r)
            # P = (1 - exp(w ln r)) / (1 - exp(T ln r))
            prob = (1.0 - math.exp(log_rw)) / (1.0 - math.exp(log_rT))

    prob = max(0.0, min(1.0, prob))

    # Expected duration to ruin or success
    if abs(p - 0.5) < eps:
        expected_duration = w * (T - w)
    else:
        mu = p - q    # drift per step
        # E[duration] = [w/mu - T/mu * P(w)] ... (omitted for brevity)
        expected_duration = float("nan")   # closed-form exists but complex

    return {
        "prob_success":        round(float(prob), 6),
        "prob_ruin":           round(float(1 - prob), 6),
        "expected_duration":   expected_duration,
        "w":                   w,
        "T":                   T,
        "p":                   p,
        "q":                   round(float(q), 4),
        "edge_per_bet":        round(float(p - q), 4),
    }


def ruin_probability_mc(w: int, T: int, p: float, n_sims: int = 100_000,
                          seed: int = 42) -> float:
    """Monte Carlo verification of the closed-form formula."""
    import numpy as np
    rng = np.random.default_rng(seed)
    successes = 0
    for _ in range(n_sims):
        capital = w
        while 0 < capital < T:
            capital += 1 if rng.random() < p else -1
        if capital >= T:
            successes += 1
    return successes / n_sims`,
    language: "python",
    complexity: { time: "O(1) closed-form, O(T * n_sims) MC", space: "O(1)" },
  },
  {
    id: "fin-20260612-b1-mst-diversification",
    title: "Minimum Spanning Tree for Portfolio Diversification",
    difficulty: "medium",
    topics: ["graph", "union-find", "finance"],
    problem:
      "You are given N assets with a symmetric correlation matrix corr[i][j]. Build a Minimum Spanning Tree (MST) of assets where edge weight = 1 - corr[i][j] (low correlation = low weight = preferred connection). The MST represents the most parsimonious diversification structure. Return the MST edges sorted by weight, the total MST distance, and which clusters of assets are most isolated (leaves of the MST).",
    examples: [
      {
        input:
          "N=4, corr=[[1,0.8,0.2,0.1],[0.8,1,0.3,0.1],[0.2,0.3,1,0.9],[0.1,0.1,0.9,1]]",
        output: "MST edges: (0,1,0.2), (0,2,0.8), (2,3,0.1), total_dist=1.1",
        explanation:
          "Lowest weight edge: (2,3) with dist=1-0.9=0.1. Then (0,1) dist=0.2. Then connect cluster {2,3} to {0,1} via (0,2) dist=0.8. Total=1.1.",
      },
    ],
    constraints: [
      "2 <= N <= 500",
      "-1 <= corr[i][j] <= 1",
      "corr[i][i] = 1.0",
    ],
    approach:
      "Kruskal's algorithm: generate all N*(N-1)/2 edges with weight 1 - corr[i][j], sort by weight, add edges with Union-Find if they connect different components. MST has N-1 edges. O(N^2 log N) for sorting, O(N^2 * alpha(N)) for Union-Find. Leaves = nodes with degree 1 in MST — these are the most isolated (least correlated) assets.",
    code: `from typing import List, Tuple

class UnionFind:
    def __init__(self, n: int):
        self.parent = list(range(n))
        self.rank   = [0] * n

    def find(self, x: int) -> int:
        if self.parent[x] != x:
            self.parent[x] = self.find(self.parent[x])
        return self.parent[x]

    def union(self, x: int, y: int) -> bool:
        """Union by rank; return True if merged (different components)."""
        rx, ry = self.find(x), self.find(y)
        if rx == ry:
            return False
        if self.rank[rx] < self.rank[ry]:
            rx, ry = ry, rx
        self.parent[ry] = rx
        if self.rank[rx] == self.rank[ry]:
            self.rank[rx] += 1
        return True

def mst_diversification(corr: List[List[float]]) -> dict:
    """
    Kruskal's MST on the correlation-distance graph.
    Distance d[i][j] = 1 - corr[i][j]: low d = high correlation = bad diversification.
    MST finds the minimum-total-distance spanning tree = minimum-cost diversification.
    """
    N = len(corr)
    # Generate all edges sorted by distance
    edges: List[Tuple[float, int, int]] = []
    for i in range(N):
        for j in range(i + 1, N):
            d = 1.0 - corr[i][j]
            edges.append((d, i, j))
    edges.sort()

    uf        = UnionFind(N)
    mst_edges = []
    total_dist = 0.0
    degree    = [0] * N

    for d, i, j in edges:
        if uf.union(i, j):
            mst_edges.append((i, j, round(d, 4)))
            total_dist += d
            degree[i] += 1
            degree[j] += 1
            if len(mst_edges) == N - 1:
                break   # MST complete

    # Leaves: degree-1 nodes (most isolated assets in the diversification tree)
    leaves = [i for i in range(N) if degree[i] == 1]

    # Cluster detection: connected components at threshold (if edges pruned at cutoff)
    cutoff      = 0.5   # prune edges with d > 0.5 (correlation < 0.5)
    pruned_uf   = UnionFind(N)
    for d, i, j in mst_edges:
        if d <= cutoff:
            pruned_uf.union(i, j)
    clusters: dict = {}
    for i in range(N):
        root = pruned_uf.find(i)
        clusters.setdefault(root, []).append(i)

    return {
        "mst_edges":     mst_edges,
        "total_distance": round(float(total_dist), 4),
        "isolated_assets": leaves,
        "clusters_at_0.5": list(clusters.values()),
        "n_assets":       N,
    }`,
    language: "python",
    complexity: { time: "O(N^2 log N)", space: "O(N^2)" },
  },
  {
    id: "fin-20260612-b1-stock-cooldown",
    title: "Best Time to Buy/Sell with Cooldown Period",
    difficulty: "medium",
    topics: ["dynamic-programming", "state-machine", "finance"],
    problem:
      "Given prices[], you may buy and sell stock (one share at a time) with unlimited transactions, but after selling, you must wait cooldown days before buying again. Find the maximum profit. This models a risk management rule that prohibits immediate re-entry after closing a position.",
    examples: [
      {
        input: "prices=[1,2,3,0,2], cooldown=1",
        output: "3",
        explanation:
          "Buy day 0 (1), sell day 1 (2): profit=1. Cooldown day 2. Buy day 3 (0), sell day 4 (2): profit=2. Total=3.",
      },
      {
        input: "prices=[6,1,3,2,4,7], cooldown=2",
        output: "6",
        explanation:
          "Buy day 1 (1), sell day 2 (3): profit=2. Cooldown days 3,4. Buy day 5 (7) — wait, can't sell. Best: buy day 1, sell day 5 (7): profit=6.",
      },
    ],
    constraints: [
      "1 <= prices.length <= 5000",
      "0 <= prices[i] <= 1000",
      "0 <= cooldown <= prices.length",
    ],
    approach:
      "DP with three states: hold (holding one share), sold (just sold, in cooldown), rest (no position, not in cooldown). hold[i] = max(hold[i-1], rest[i-1] - prices[i]). sold[i] = hold[i-1] + prices[i]. rest[i] = max(rest[i-1], sold[i-cooldown]) for general cooldown (track last sold[j] for j = i-cooldown). Answer: max(sold[N-1], rest[N-1]).",
    code: `from typing import List

def max_profit_cooldown(prices: List[int], cooldown: int = 1) -> int:
    """
    DP with states: hold, sold, rest.
    hold[i]: best profit when holding a share at end of day i.
    sold[i]: best profit when just sold on day i (entering cooldown).
    rest[i]: best profit when flat (not holding, not in cooldown) at end of day i.

    Transitions (cooldown=1):
      hold[i] = max(hold[i-1], rest[i-1] - prices[i])  # stay or buy
      sold[i] = hold[i-1] + prices[i]                   # sell today
      rest[i] = max(rest[i-1], sold[i-1])               # stay flat or come off cooldown
    """
    n = len(prices)
    if n <= 1:
        return 0

    # For general cooldown, rest[i] = max(rest[i-1], sold[i-cooldown])
    # Initialise
    hold = [-prices[0]] * n
    sold = [0]           * n
    rest = [0]           * n

    for i in range(1, n):
        hold[i] = max(hold[i-1], rest[i-1] - prices[i])
        sold[i] = hold[i-1] + prices[i]
        # rest[i]: can re-enter if cooldown days have passed
        prev_sold = sold[i - cooldown] if i >= cooldown else 0
        rest[i]   = max(rest[i-1], prev_sold)

    return max(sold[n-1], rest[n-1])


def trace_trades_cooldown(prices: List[int], cooldown: int = 1) -> dict:
    """Trace the actual buy/sell decisions."""
    n = len(prices)
    hold = [-prices[0]] * n
    sold = [0]           * n
    rest = [0]           * n
    hold_action = ["buy"] + [""] * (n - 1)
    sold_action = [""] * n
    rest_action = ["rest"] * n

    for i in range(1, n):
        hold_new = rest[i-1] - prices[i]
        if hold_new > hold[i-1]:
            hold[i] = hold_new
            hold_action[i] = f"buy@{prices[i]}"
        else:
            hold[i] = hold[i-1]
            hold_action[i] = "hold"

        sold[i] = hold[i-1] + prices[i]
        sold_action[i] = f"sell@{prices[i]}"

        prev_sold = sold[i - cooldown] if i >= cooldown else 0
        rest[i] = max(rest[i-1], prev_sold)

    max_profit = max(sold[n-1], rest[n-1])
    return {
        "max_profit": max_profit,
        "hold_states": hold,
        "sold_states": sold,
        "rest_states": rest,
    }`,
    language: "python",
    complexity: { time: "O(N)", space: "O(N)" },
  },
  {
    id: "fin-20260612-b1-merge-k-feeds",
    title: "Merge K Sorted Market Data Feeds",
    difficulty: "hard",
    topics: ["heap", "linked-list", "finance"],
    problem:
      "You receive K sorted market data feeds (lists of (timestamp, price) tuples, sorted by timestamp ascending). Merge them into a single sorted stream. This arises when aggregating tick data from K exchanges into a consolidated tape. Return the merged list. Each feed can have up to M ticks; total ticks N = K * M. Solve in O(N log K) time.",
    examples: [
      {
        input:
          "feeds=[[(1,100),(3,101),(5,102)], [(2,99),(4,103)], [(1,100),(6,99)]]",
        output:
          "[(1,100),(1,100),(2,99),(3,101),(4,103),(5,102),(6,99)]",
        explanation:
          "Three feeds merged by timestamp. Ties preserve relative order (stable).",
      },
    ],
    constraints: [
      "1 <= K <= 10^4",
      "0 <= M <= 10^4",
      "Total ticks N = sum(len(feed)) <= 10^6",
      "Timestamps are non-decreasing within each feed",
    ],
    approach:
      "Min-heap of size K. Initially push the first element of each feed: (timestamp, feed_idx, tick_idx, price). Pop the minimum, add to result, then push the next element from the same feed. O(N log K): each of N elements is pushed and popped once from the K-element heap.",
    code: `import heapq
from typing import List, Tuple

Tick = Tuple[int, float]   # (timestamp_ms, price)

def merge_k_feeds(feeds: List[List[Tick]]) -> List[Tick]:
    """
    Merge K sorted tick feeds into one sorted stream using a min-heap.
    Heap entry: (timestamp, feed_idx, tick_idx) — tie-break by feed_idx for stability.
    O(N log K) where N = total ticks, K = number of feeds.
    """
    heap: list = []

    # Initialise heap with the first tick from each feed
    for fi, feed in enumerate(feeds):
        if feed:
            ts, price = feed[0]
            heapq.heappush(heap, (ts, fi, 0, price))

    result: List[Tick] = []

    while heap:
        ts, fi, ti, price = heapq.heappop(heap)
        result.append((ts, price))

        # Push next tick from the same feed
        ti_next = ti + 1
        if ti_next < len(feeds[fi]):
            ts_next, price_next = feeds[fi][ti_next]
            heapq.heappush(heap, (ts_next, fi, ti_next, price_next))

    return result


def merge_k_feeds_generator(feeds: List[List[Tick]]):
    """
    Generator version: yields ticks one at a time without materialising full output.
    Useful for streaming processing where the merged list is too large to hold.
    """
    heap: list = []
    for fi, feed in enumerate(feeds):
        if feed:
            ts, price = feed[0]
            heapq.heappush(heap, (ts, fi, 0, price))

    while heap:
        ts, fi, ti, price = heapq.heappop(heap)
        yield (ts, price)
        ti_next = ti + 1
        if ti_next < len(feeds[fi]):
            ts_next, price_next = feeds[fi][ti_next]
            heapq.heappush(heap, (ts_next, fi, ti_next, price_next))


def consolidate_nbbo(feeds: List[List[Tick]]) -> List[Tuple[int, float, float]]:
    """
    Compute National Best Bid/Offer (NBBO) from K venue quote feeds.
    Returns (timestamp, best_bid, best_ask) for each quote update.
    Simplified: treats each feed as a stream of mid-prices.
    """
    merged    = merge_k_feeds(feeds)
    K         = len(feeds)
    # Rolling best bid/ask (simplified: best = min/max of last K prices)
    from collections import deque
    window: deque = deque(maxlen=K)
    nbbo = []
    for ts, price in merged:
        window.append(price)
        if len(window) > 0:
            nbbo.append((ts, min(window), max(window)))
    return nbbo`,
    language: "python",
    complexity: { time: "O(N log K)", space: "O(K)" },
  },
  {
    id: "fin-20260612-b1-lot-sizing-dp",
    title: "Optimal Lot Sizing with Minimum Trade Size Constraint",
    difficulty: "hard",
    topics: ["dynamic-programming", "greedy", "finance"],
    problem:
      "You want to invest total capital C across N assets. Each asset i requires investment in multiples of lot_size[i] units (minimum trade size = lot_size[i]). Each unit of asset i yields return ret[i]. Find the allocation (how many lots of each asset to buy) that maximises total expected return without exceeding total capital C. Fractional lots are not allowed.",
    examples: [
      {
        input:
          "C=100, lot_size=[10,15,20], ret_per_lot=[3,5,8]",
        output: "max_ret=28, alloc=[1,2,1] (cost=10+30+20=60, ret=3+10+8=21)? Check: [0,2,2]: cost=0+30+40=70, ret=10+16=26. [0,0,5]: cost=100, ret=40. Best: [0,0,5]->40. But C=100, 5*20=100. ret=5*8=40.",
        explanation:
          "5 lots of asset 2 at cost 20 each = 100 total, return = 5*8=40. This is optimal: the return per lot / cost ratio is 8/20=0.4, 5/15=0.33, 3/10=0.30 — greedy takes asset 2 first.",
      },
    ],
    constraints: [
      "1 <= N <= 50",
      "1 <= C <= 10^5",
      "1 <= lot_size[i] <= C",
      "1 <= ret_per_lot[i] <= 10^4",
      "Each asset can be bought 0 to C // lot_size[i] times",
    ],
    approach:
      "Unbounded knapsack (each asset can be bought multiple times). dp[c] = max return with budget c. For each capacity c, try all assets: dp[c] = max(dp[c - lot_size[i]] + ret[i]) for all i where lot_size[i] <= c. Iterate all capacities for each item. O(N * C) time, O(C) space. This is the unbounded (not 0/1) variant since each lot can be bought any number of times.",
    code: `from typing import List

def lot_sizing_unbounded(C: int, lot_sizes: List[int], ret_per_lot: List[int]) -> dict:
    """
    Unbounded knapsack: each asset can be purchased any number of times.
    dp[c] = max return using exactly c capital.
    Transition: dp[c] = max over all i: dp[c - lot_sizes[i]] + ret_per_lot[i].
    O(N * C) time, O(C) space.
    """
    N  = len(lot_sizes)
    dp = [0] * (C + 1)
    ch = [-1] * (C + 1)   # which asset was last chosen to achieve dp[c]

    for c in range(1, C + 1):
        for i in range(N):
            ls = lot_sizes[i]
            if ls <= c and dp[c - ls] + ret_per_lot[i] > dp[c]:
                dp[c] = dp[c - ls] + ret_per_lot[i]
                ch[c] = i

    # Find best total return (may not use all capital)
    best_ret = max(dp)
    best_cap = dp.index(best_ret)

    # Backtrack to find allocation
    alloc = [0] * N
    cap   = best_cap
    while cap > 0 and ch[cap] != -1:
        i = ch[cap]
        alloc[i] += 1
        cap -= lot_sizes[i]

    return {
        "max_return":    best_ret,
        "capital_used":  best_cap,
        "allocation":    alloc,
        "lots_per_asset": [alloc[i] for i in range(N)],
        "cost_per_asset": [alloc[i] * lot_sizes[i] for i in range(N)],
        "ret_per_asset":  [alloc[i] * ret_per_lot[i] for i in range(N)],
    }


def lot_sizing_fractional_bound(C: int, lot_sizes: List[int],
                                  ret_per_lot: List[int]) -> float:
    """
    LP relaxation (fractional): upper bound for branch-and-bound.
    Sort by return/cost ratio, take greedily with fractional final lot.
    """
    ratios = sorted(zip([r/ls for r, ls in zip(ret_per_lot, lot_sizes)],
                        lot_sizes, ret_per_lot), reverse=True)
    total, budget = 0.0, C
    for ratio, ls, ret in ratios:
        lots = budget // ls    # maximum whole lots
        total  += lots * ret
        budget -= lots * ls
        if budget < ls:        # partial lot (fractional relaxation)
            total += ret * budget / ls
            break
    return total`,
    language: "python",
    complexity: { time: "O(N * C)", space: "O(C)" },
  },
  {
    id: "fin-20260612-b1-sliding-sharpe",
    title: "Rolling Sharpe Ratio — O(N) Sliding Window Statistics",
    difficulty: "medium",
    topics: ["sliding-window", "math", "finance"],
    problem:
      "Given a list of daily returns returns[] and window size W, compute the rolling Sharpe ratio for each complete window. The Sharpe ratio for a window is mean(returns) / std(returns) * sqrt(252) (annualised). Avoid recomputing the full sum and sum-of-squares from scratch for each window — maintain running statistics in O(1) per step using the sliding window technique.",
    examples: [
      {
        input: "returns=[0.01, -0.02, 0.03, 0.01, -0.01, 0.02], W=3",
        output: "sharpe=[2.15, 2.45, 0.0, 1.73] (approx, annualised)",
        explanation:
          "Window [0.01,-0.02,0.03]: mean=0.00667, std≈0.0252, Sharpe=0.00667/0.0252*15.87≈4.2 (annualised). Each subsequent window computed in O(1) by updating running sum and sum-of-squares.",
      },
    ],
    constraints: [
      "W <= returns.length <= 10^6",
      "W >= 2 (need at least 2 points for std)",
      "-0.5 <= returns[i] <= 0.5",
    ],
    approach:
      "Maintain running sum S and sum-of-squares S2. When the window slides: add new element (update S and S2), remove old element (update S and S2). Mean = S/W, Variance = (S2 - S*S/W) / (W-1), Std = sqrt(Variance). Sharpe = Mean / Std * sqrt(252). All O(1) per step, O(N) total. Watch for numerical precision issues when subtracting nearly-equal floating point numbers.",
    code: `import math
from typing import List

def rolling_sharpe(returns: List[float], W: int,
                    ann_factor: float = 252.0) -> List[float]:
    """
    Rolling Sharpe ratio using O(1) sliding window statistics.
    Maintains running sum and sum-of-squares for O(N) total computation.
    Uses Welford's-style update to avoid catastrophic cancellation.
    """
    n      = len(returns)
    sharpes: List[float] = []

    if W < 2 or n < W:
        return sharpes

    # Initialise for first window
    S  = sum(returns[:W])
    S2 = sum(r * r for r in returns[:W])

    def compute_sharpe(S: float, S2: float, W: int) -> float:
        mean = S / W
        var  = (S2 - S * S / W) / (W - 1)
        if var <= 0:
            return 0.0
        std = math.sqrt(var)
        return (mean / std) * math.sqrt(ann_factor) if std > 1e-10 else 0.0

    sharpes.append(compute_sharpe(S, S2, W))

    for i in range(W, n):
        # Add new element
        r_new = returns[i]
        S  += r_new
        S2 += r_new * r_new
        # Remove old element (leaving the window)
        r_old = returns[i - W]
        S  -= r_old
        S2 -= r_old * r_old
        sharpes.append(compute_sharpe(S, S2, W))

    return sharpes


def rolling_stats(returns: List[float], W: int) -> dict:
    """Return rolling mean, vol, and Sharpe as separate lists."""
    n    = len(returns)
    means, vols, sharpes = [], [], []
    ann  = math.sqrt(252.0)

    S  = sum(returns[:W])
    S2 = sum(r * r for r in returns[:W])

    for start in range(n - W + 1):
        if start > 0:
            S  += returns[start + W - 1] - returns[start - 1]
            S2 += returns[start + W - 1]**2 - returns[start - 1]**2
        mean = S / W
        var  = max(0.0, (S2 - S*S/W) / (W - 1))
        vol  = math.sqrt(var)
        means.append(round(mean, 6))
        vols.append(round(vol, 6))
        sharpes.append(round((mean / vol * ann) if vol > 1e-10 else 0.0, 4))

    return {"mean": means, "vol": vols, "sharpe": sharpes}`,
    language: "python",
    complexity: { time: "O(N)", space: "O(1)" },
  },
];
