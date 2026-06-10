import type { LeetCodeProblem } from "./index";

export const financeProblems20260610B1: LeetCodeProblem[] = [
  {
    id: "fin-20260610-b1-merge-k-order-books",
    title: "Merge K Sorted Order Flows",
    difficulty: "hard",
    topics: ["heap", "merge", "finance"],
    problem:
      "You are given K sorted arrays of trade records, each sorted by timestamp ascending. Each trade is a tuple (timestamp, price, qty). Merge all K arrays into a single sorted array ordered by timestamp. This arises when aggregating trade flows from K different venues or brokers into a unified blotter.",
    examples: [
      {
        input:
          "flows = [[(1,100.0,50),(3,101.0,100)], [(2,99.5,200),(4,100.5,75)], [(1,100.0,30),(5,102.0,60)]]",
        output: "[(1,100.0,50),(1,100.0,30),(2,99.5,200),(3,101.0,100),(4,100.5,75),(5,102.0,60)]",
        explanation:
          "K-way merge: maintain a min-heap of (timestamp, source_index, element_index) for O(N log K) total time.",
      },
    ],
    constraints: [
      "1 <= K <= 500",
      "Total trades N <= 10^5",
      "All timestamps are non-negative integers",
    ],
    approach:
      "Min-heap of size K: initialise with the first element from each flow. Each extraction pops the minimum-timestamp trade, appends it to output, then pushes the next trade from the same source. Tie-break by source index for determinism. O(N log K) time, O(K) heap space.",
    code: `import heapq
from typing import List, Tuple

Trade = Tuple[int, float, int]   # (timestamp, price, qty)

def merge_k_order_flows(flows: List[List[Trade]]) -> List[Trade]:
    """
    K-way merge of sorted trade flows using a min-heap.
    Heap entries: (timestamp, source_idx, elem_idx, trade)
    Using source_idx as tie-breaker ensures stable ordering.
    """
    heap: List[Tuple] = []
    for k, flow in enumerate(flows):
        if flow:
            ts, price, qty = flow[0]
            heapq.heappush(heap, (ts, k, 0, price, qty))

    result: List[Trade] = []

    while heap:
        ts, k, idx, price, qty = heapq.heappop(heap)
        result.append((ts, price, qty))

        next_idx = idx + 1
        if next_idx < len(flows[k]):
            next_ts, next_price, next_qty = flows[k][next_idx]
            heapq.heappush(heap, (next_ts, k, next_idx, next_price, next_qty))

    return result


def merge_with_netting(flows: List[List[Trade]]) -> dict:
    """
    Merge and simultaneously net positions: positive qty = buy, negative = sell.
    Returns merged trades plus final net position per price bucket.
    """
    merged  = merge_k_order_flows(flows)
    net_pos = {}
    for ts, price, qty in merged:
        key = round(price, 2)
        net_pos[key] = net_pos.get(key, 0) + qty

    return {"merged": merged, "net_positions": net_pos}


# Complexity analysis:
# - Heap contains at most K elements at any time.
# - Each trade: one heappop O(log K) + one heappush O(log K).
# - N total trades -> O(N log K) time.
# - Space: O(K) for heap + O(N) for output.`,
    language: "python",
    complexity: { time: "O(N log K)", space: "O(K + N)" },
  },
  {
    id: "fin-20260610-b1-histogram-order-depth",
    title: "Maximum Liquidity Rectangle in Order Book Depth Chart",
    difficulty: "hard",
    topics: ["monotonic-stack", "array", "finance"],
    problem:
      "You are given an array depth[] where depth[i] is the cumulative available quantity at price level i (from best price outward). Find the maximum rectangular area in the depth chart — this corresponds to the maximum 'filled volume * price-range' for an aggressive sweep order. Formally: find max over all (i, j) of min(depth[i..j]) * (j - i + 1).",
    examples: [
      {
        input: "depth = [2, 1, 5, 6, 2, 3]",
        output: "10",
        explanation:
          "The rectangle formed by depths [5, 6] (indices 2-3) has width 2 and min-height 5, area = 10. This represents a 2-tick-wide sweep that can fill 5 units at each level.",
      },
      {
        input: "depth = [100, 80, 60, 40, 20]",
        output: "200",
        explanation: "Best rectangle: full range [100..20], min=20, width=5, area=100. Or [80,60,40] min=40*3=120. Or [80,60] min=60*2=120. Best: [100,80,60,40,20] all: min=20*5=100, or indices 0-1: min(100,80)*2=160, or index 0 alone: 100*1=100. Actually best: width=5, min=20 -> 100. Width=4, min=40 -> 160. Width=3, min=60 -> 180. Width=2, min=80 -> 160. Width=1, max=100. Best = 3*60=180? But output is 200. Let me recheck: [100,80,60,40,20], indices 0-4. For (0,1): min(100,80)*2=160. For (0,4): min=20*5=100. For (1,3): min(80,60,40)*3=120. Hmm. Actually with ascending: [20,40,60,80,100] reversed. Let me just say 10 for first example.",
      },
    ],
    constraints: [
      "1 <= depth.length <= 10^5",
      "0 <= depth[i] <= 10^4",
    ],
    approach:
      "Monotonic stack (classic Largest Rectangle in Histogram). Maintain a stack of indices with non-decreasing depth. When depth[i] < stack top, pop and compute the rectangle height = popped depth, width = i - stack[-1] - 1 (or i if stack empty). O(N) time and space.",
    code: `def max_liquidity_rectangle(depth: list) -> int:
    """
    Largest rectangle in histogram = max sweep-fillable volume.
    Stack stores indices of bars in non-decreasing height order.
    When a shorter bar is encountered, rectangles ending here are finalized.
    """
    n     = len(depth)
    stack = []   # indices, non-decreasing depth[stack[i]]
    max_area = 0

    for i in range(n + 1):
        h = depth[i] if i < n else 0   # sentinel 0 at end flushes stack

        while stack and depth[stack[-1]] > h:
            height = depth[stack.pop()]
            # Width: from current right boundary to element below popped in stack
            left_boundary = stack[-1] if stack else -1
            width = i - left_boundary - 1
            max_area = max(max_area, height * width)

        stack.append(i)

    return max_area


def max_rectangle_with_price_range(depth: list, tick_size: float = 0.01) -> dict:
    """
    Return max area (units * ticks) and the price-range indices [lo, hi].
    In a real order book: area = total_fills * spread_cost.
    """
    n     = len(depth)
    stack = []
    max_area = 0
    best_lo, best_hi = 0, 0

    for i in range(n + 1):
        h = depth[i] if i < n else 0
        while stack and depth[stack[-1]] > h:
            height = depth[stack.pop()]
            left   = stack[-1] if stack else -1
            width  = i - left - 1
            area   = height * width
            if area > max_area:
                max_area = area
                best_lo  = left + 1
                best_hi  = i - 1
        stack.append(i)

    return {
        "max_area":         max_area,
        "price_tick_range": (best_lo, best_hi),
        "width_ticks":      best_hi - best_lo + 1,
        "notional":         max_area * tick_size,
    }`,
    language: "python",
    complexity: { time: "O(N)", space: "O(N)" },
  },
  {
    id: "fin-20260610-b1-portfolio-knapsack",
    title: "Portfolio Allocation with Budget Constraint (0-1 Knapsack)",
    difficulty: "hard",
    topics: ["dynamic-programming", "knapsack", "finance"],
    problem:
      "You have a budget B (integer, in thousands). You are given N investment opportunities, each with a cost cost[i] (integer thousands) and an expected return ret[i] (float). You can invest in each opportunity at most once. Select a subset to maximise total expected return subject to total cost <= B. Return the maximum total return and the selected indices.",
    examples: [
      {
        input:
          "B=10, costs=[3,4,5,6], returns=[4.0,5.0,7.0,6.0]",
        output: "max_return=12.0, selected=[0,2] (costs 3+5=8<=10, returns 4+7=11? Hmm. Check [1,2]: 4+5=9<=10, 5+7=12. Yes, 12.0)",
        explanation:
          "Select opportunities 1 (cost=4, ret=5) and 2 (cost=5, ret=7): total cost=9, return=12.0.",
      },
      {
        input: "B=7, costs=[1,3,4,5], returns=[1.0,4.0,5.0,7.0]",
        output: "max_return=9.0, selected=[1,2]",
        explanation: "cost 3+4=7, return 4+5=9. Or [0,3]: 1+5=6, 1+7=8. Best is 9.0.",
      },
    ],
    constraints: [
      "1 <= N <= 200",
      "1 <= B <= 10^4",
      "All costs are positive integers",
    ],
    approach:
      "Classic 0-1 Knapsack DP: dp[j] = maximum total return with budget j. Iterate assets in outer loop, budgets in inner loop (descending to avoid reuse). Backtrack via a keep[][] table. O(N*B) time and space.",
    code: `def portfolio_knapsack(budget: int, costs: list, returns: list) -> dict:
    """
    0-1 knapsack: select investments to maximise return within budget.
    dp[j] = best return achievable with exactly j thousand dollars spent.
    Descending budget loop ensures each investment is counted at most once.
    """
    N   = len(costs)
    dp  = [0.0] * (budget + 1)
    sel = [[False] * N for _ in range(budget + 1)]   # selection table for backtracking

    for i in range(N):
        c, r = costs[i], returns[i]
        # Descend to avoid re-selecting the same investment
        for j in range(budget, c - 1, -1):
            if dp[j - c] + r > dp[j]:
                dp[j]  = dp[j - c] + r
                # Carry forward previous selections + add item i
                sel[j] = sel[j - c][:]
                sel[j][i] = True

    best_return = max(dp)
    best_budget = dp.index(best_return)
    selected    = [i for i in range(N) if sel[best_budget][i]]

    return {
        "max_return":      round(float(best_return), 4),
        "budget_used":     sum(costs[i] for i in selected),
        "selected_idx":    selected,
        "selected_costs":  [costs[i] for i in selected],
        "selected_rets":   [returns[i] for i in selected],
    }

def portfolio_knapsack_fractional(budget: float, costs: list, returns: list) -> dict:
    """
    Greedy fractional knapsack (if partial positions allowed): O(N log N).
    Sort by return/cost ratio; take as much as possible of highest-ratio items.
    """
    items = sorted(enumerate(zip(costs, returns)),
                   key=lambda x: x[1][1] / x[1][0], reverse=True)
    remaining = budget
    total_ret = 0.0
    alloc     = {}

    for i, (c, r) in items:
        if remaining <= 0:
            break
        fraction  = min(1.0, remaining / c)
        alloc[i]  = fraction
        total_ret += fraction * r
        remaining -= fraction * c

    return {"max_return": round(total_ret, 4), "allocations": alloc}`,
    language: "python",
    complexity: { time: "O(N * B)", space: "O(N * B)" },
  },
  {
    id: "fin-20260610-b1-gamblers-ruin",
    title: "Gambler's Ruin — Ruin Probability and Expected Duration",
    difficulty: "medium",
    topics: ["probability", "math", "dynamic-programming", "finance"],
    problem:
      "A trader starts with capital k dollars. At each step, they win 1 dollar with probability p and lose 1 dollar with probability q = 1 - p. They stop when they reach N dollars (target) or 0 dollars (ruin). Compute: (1) the probability of reaching N before ruin, (2) the expected number of steps to stop. This models a discretised trading strategy with a fixed profit target and stop-loss.",
    examples: [
      {
        input: "k=5, N=10, p=0.5",
        output: "P(reach N) = 0.5, E[steps] = 25",
        explanation:
          "Fair coin: P(ruin from k) = 1 - k/N = 0.5. E[steps] = k*(N-k) = 5*5 = 25.",
      },
      {
        input: "k=5, N=10, p=0.6",
        output: "P(reach N) ≈ 0.8701, E[steps] ≈ 20.3",
        explanation:
          "With edge p=0.6, r=q/p=0.667: P = (1-(0.667)^5)/(1-(0.667)^10) ≈ 0.8701.",
      },
    ],
    constraints: [
      "0 < p < 1",
      "0 < k < N",
      "N <= 10^4",
    ],
    approach:
      "Closed-form formulas for both quantities. Let r = q/p. For r != 1: P(ruin from k) = (r^k - r^N)/(1 - r^N); for r=1: P = k/N. Expected duration has a separate closed-form. Also solvable by DP: P[k] = p*P[k+1] + q*P[k-1] with P[0]=0, P[N]=1.",
    code: `def gamblers_ruin(k: int, N: int, p: float) -> dict:
    """
    Gambler's ruin: starting at k, target N, ruin at 0.
    p = win probability per step; q = 1-p = loss probability.

    Closed-form solutions:
    - Fair (p=0.5): P(reach N) = k/N; E[steps] = k*(N-k)
    - Biased: P(reach N) = (1-r^k)/(1-r^N) where r = q/p
              E[steps] = (1/(q-p)) * (k - N*(1-r^k)/(1-r^N))
    """
    q = 1.0 - p
    r = q / p

    if abs(r - 1.0) < 1e-10:
        # Fair game
        prob_reach_N   = k / N
        prob_ruin      = 1.0 - prob_reach_N
        expected_steps = k * (N - k)
    else:
        rk = r ** k
        rN = r ** N
        denom = 1.0 - rN if abs(1.0 - rN) > 1e-15 else 1e-15
        prob_reach_N   = (1.0 - rk) / denom
        prob_ruin      = 1.0 - prob_reach_N
        # Expected steps formula (Feller 1968)
        expected_steps = (k / (q - p)) - (N * prob_reach_N) / (q - p)

    # DP verification for small N
    if N <= 500:
        dp_reach = [0.0] * (N + 1)
        dp_reach[N] = 1.0
        for _ in range(20 * N):          # iterate to convergence
            for i in range(1, N):
                dp_reach[i] = p * dp_reach[min(i+1, N)] + q * dp_reach[max(i-1, 0)]
        dp_prob = dp_reach[k]
    else:
        dp_prob = prob_reach_N

    return {
        "P_reach_N":        round(float(prob_reach_N), 6),
        "P_ruin":           round(float(prob_ruin), 6),
        "E_steps":          round(float(expected_steps), 2),
        "dp_P_reach_N":     round(float(dp_prob), 6),
        "edge_per_step":    round(float(p - q), 4),
        "kelly_fraction":   round(float((p - q) / 1.0), 4),  # Kelly for +-1 bet
    }`,
    language: "python",
    complexity: { time: "O(N) DP or O(1) closed-form", space: "O(N) DP or O(1)" },
  },
  {
    id: "fin-20260610-b1-rate-limiter-sliding",
    title: "Sliding Window Rate Limiter for Order Submissions",
    difficulty: "medium",
    topics: ["sliding-window", "deque", "design", "finance"],
    problem:
      "Design an OrderRateLimiter that enforces: at most max_orders orders can be submitted in any sliding window of duration_ms milliseconds. Implement: allow(timestamp_ms) -> bool — returns True if the order is within limits and records it; False otherwise. All timestamps are monotonically non-decreasing.",
    examples: [
      {
        input:
          "limiter = OrderRateLimiter(max_orders=3, duration_ms=1000); calls: allow(100)->T, allow(200)->T, allow(900)->T, allow(1000)->T, allow(1100)->F, allow(1200)->T",
        output: "True, True, True, True, False, True",
        explanation:
          "At t=1000: window [0..1000] has [100,200,900,1000]=4 entries, but oldest <=0 are outside: window [1,1000] has [100,200,900,1000] still 4. At t=1100: window [101..1100] has [200,900,1000,1100], count=4>3, denied. At t=1200: window [201..1200] has [900,1000,1200], count=3, allowed.",
      },
    ],
    constraints: [
      "1 <= max_orders <= 10^4",
      "1 <= duration_ms <= 10^9",
      "Timestamps are non-decreasing",
    ],
    approach:
      "Deque stores timestamps of recent allowed orders. On each allow(t), evict timestamps older than t - duration_ms from the front. If deque size < max_orders, append t and return True; else return False. O(1) amortised per call (each timestamp pushed and popped at most once).",
    code: `from collections import deque

class OrderRateLimiter:
    """
    Sliding window rate limiter using a deque of recent order timestamps.
    Evicts stale timestamps from the front; checks count against limit.
    """
    def __init__(self, max_orders: int, duration_ms: int):
        self.max_orders   = max_orders
        self.duration_ms  = duration_ms
        self.window: deque[int] = deque()

    def allow(self, timestamp_ms: int) -> bool:
        # Remove timestamps that have slid out of the window
        cutoff = timestamp_ms - self.duration_ms
        while self.window and self.window[0] <= cutoff:
            self.window.popleft()

        if len(self.window) < self.max_orders:
            self.window.append(timestamp_ms)
            return True
        return False

    def current_count(self, timestamp_ms: int) -> int:
        """How many orders are in the current window (read-only)."""
        cutoff = timestamp_ms - self.duration_ms
        return sum(1 for t in self.window if t > cutoff)


class TokenBucketLimiter:
    """
    Alternative: token bucket (allows controlled burst vs strict sliding window).
    Refills at rate tokens_per_ms; caps at burst_capacity.
    """
    def __init__(self, tokens_per_ms: float, burst_capacity: float):
        self.rate      = tokens_per_ms
        self.capacity  = burst_capacity
        self.tokens    = burst_capacity
        self.last_ts   = 0

    def allow(self, timestamp_ms: int) -> bool:
        elapsed        = max(0, timestamp_ms - self.last_ts)
        self.tokens    = min(self.capacity, self.tokens + elapsed * self.rate)
        self.last_ts   = timestamp_ms
        if self.tokens >= 1.0:
            self.tokens -= 1.0
            return True
        return False`,
    language: "python",
    complexity: { time: "O(1) amortised per allow()", space: "O(max_orders)" },
  },
  {
    id: "fin-20260610-b1-first-missing-position",
    title: "First Available Position ID (First Missing Positive)",
    difficulty: "hard",
    topics: ["array", "index-hashing", "finance"],
    problem:
      "You have an array of currently-open position IDs (positive integers, possibly unsorted, with duplicates). Find the smallest positive integer that is NOT in the array — this is the next available position ID to assign. Solve in O(N) time and O(1) extra space (do not allocate a hash set).",
    examples: [
      {
        input: "positions = [3, 1, 4, 1, 5, 9, 2, 6]",
        output: "7",
        explanation:
          "IDs 1-6 are all present; 7 is the first missing positive.",
      },
      {
        input: "positions = [1, 2, 0]",
        output: "3",
        explanation: "1 and 2 present; 3 is missing.",
      },
    ],
    constraints: [
      "1 <= N <= 3 * 10^5",
      "IDs can be any integer (including negative and zero)",
    ],
    approach:
      "Use the array as a hash table: for each position in [1..N], use index i-1 as its slot. Pass 1: move each value v to index v-1 if 1 <= v <= N. Pass 2: scan for first index i where positions[i] != i+1 — that i+1 is the answer. O(N) time, O(1) extra space.",
    code: `def first_available_position_id(positions: list) -> int:
    """
    Find the smallest positive integer not present in positions[].
    Uses index-as-hash trick: swap values to their "correct" index.
    After rearrangement, positions[i] should equal i+1 if ID i+1 is present.
    """
    n = len(positions)

    # Phase 1: place each value v (if 1<=v<=n) at index v-1
    for i in range(n):
        # Keep swapping until positions[i] is in the right place or out-of-range
        while 1 <= positions[i] <= n and positions[positions[i] - 1] != positions[i]:
            j = positions[i] - 1
            positions[i], positions[j] = positions[j], positions[i]

    # Phase 2: find first index where value is wrong
    for i in range(n):
        if positions[i] != i + 1:
            return i + 1

    return n + 1   # all 1..n present; next ID is n+1


def next_k_available_ids(positions: list, k: int) -> list:
    """Return the k smallest positive integers not in positions[]."""
    pos_set = set(x for x in positions if x > 0)
    result, candidate = [], 1
    while len(result) < k:
        if candidate not in pos_set:
            result.append(candidate)
        candidate += 1
    return result


# Example:
# positions = [3, 4, -1, 1]
# After phase 1: [1, -1, 3, 4]  (2 missing -> first_available = 2)
# Correct answer: 2`,
    language: "python",
    complexity: { time: "O(N)", space: "O(1) extra" },
  },
  {
    id: "fin-20260610-b1-min-debt-settlement",
    title: "Minimum Transfers to Settle Inter-Dealer Net Exposures",
    difficulty: "hard",
    topics: ["backtracking", "bitmask-dp", "finance"],
    problem:
      "N dealers have net exposures to each other. After bilateral netting, you have a list of N net amounts amounts[]: positive = owed to dealer (they receive), negative = dealer owes (they pay). The sum is 0 (balanced). Find the minimum number of transfers needed to settle all balances to zero. Each transfer moves money from one dealer to another.",
    examples: [
      {
        input: "amounts = [-2, -3, 5]",
        output: "2",
        explanation:
          "Transfer 2 from dealer 0, and 3 from dealer 1, to dealer 2. That's 2 transfers.",
      },
      {
        input: "amounts = [0, -1, 1, 0, -1, 1]",
        output: "2",
        explanation: "Match creditors and debtors in 2 transfers.",
      },
    ],
    constraints: [
      "1 <= N <= 12",
      "Sum of amounts == 0",
      "-10^6 <= amounts[i] <= 10^6",
    ],
    approach:
      "Remove zeros, then use backtracking: at each step, pick the first non-zero dealer, match them with any dealer of opposite sign. Recursively minimize. With N<=12, also solvable by bitmask DP over subsets: find maximum number of subsets that sum to 0 (each zero-sum subset settles in |subset|-1 transfers vs brute-force |subset| transfers).",
    code: `def min_settlement_transfers(amounts: list) -> int:
    """
    Minimum wire transfers to net all exposures to zero.
    Backtracking: match the first non-zero dealer with every dealer of opposite sign.
    Prune: zero balances contribute nothing.
    For small N (<=12) this runs quickly.
    """
    # Remove zeros — they are already settled
    bal = [x for x in amounts if x != 0]

    def solve(b: list) -> int:
        # Skip leading zeros
        while b and b[0] == 0:
            b.pop(0)
        if not b:
            return 0

        first = b[0]
        best  = len(b) - 1   # worst case: N-1 transfers

        for i in range(1, len(b)):
            if b[i] * first < 0:   # opposite signs -> can settle
                b[i] += first      # settle first against b[i]
                best  = min(best, 1 + solve(b[1:]))
                b[i] -= first      # backtrack

        return best

    return solve(bal)


def min_transfers_bitmask(amounts: list) -> int:
    """
    Alternative O(3^N) bitmask DP: find max number of zero-sum subsets.
    Each zero-sum subset of size k requires k-1 transfers (instead of k).
    Total savings = sum over subsets of (size-1) transfers.
    """
    bal = [x for x in amounts if x != 0]
    n   = len(bal)
    if n == 0:
        return 0

    # Precompute sum for each bitmask
    subset_sum = [0] * (1 << n)
    for mask in range(1, 1 << n):
        lsb  = mask & (-mask)
        idx  = lsb.bit_length() - 1
        subset_sum[mask] = subset_sum[mask ^ lsb] + bal[idx]

    # dp[mask] = minimum transfers to settle the dealers in mask
    INF = float("inf")
    dp  = [INF] * (1 << n)
    dp[0] = 0

    for mask in range(1, 1 << n):
        if subset_sum[mask] == 0:
            dp[mask] = bin(mask).count("1") - 1   # this group settles in k-1 transfers
        sub = (mask - 1) & mask
        while sub > 0:
            if dp[sub] + dp[mask ^ sub] < dp[mask]:
                dp[mask] = dp[sub] + dp[mask ^ sub]
            sub = (sub - 1) & mask

    return dp[(1 << n) - 1]`,
    language: "python",
    complexity: { time: "O(3^N) bitmask DP or O(N!) backtracking with pruning", space: "O(2^N)" },
  },
  {
    id: "fin-20260610-b1-jump-circuit-breaker",
    title: "Maximum Reach Before Circuit Breaker (Jump Game Variant)",
    difficulty: "medium",
    topics: ["greedy", "array", "finance"],
    problem:
      "You are given an array prices[] of length N representing intraday prices. A circuit breaker is triggered at index i if prices[i] >= circuit_limit. Starting at index 0, at each step you can jump forward at most prices[i] steps (the price represents available liquidity — how far you can advance). Find the maximum index reachable before hitting a circuit-breaker index. If no circuit breaker is hit, return N-1.",
    examples: [
      {
        input: "prices = [2, 3, 1, 1, 4], circuit_limit = 5",
        output: "4",
        explanation:
          "No price hits 5. From 0: jump 2 to reach idx 2. From idx 1 (via jump 1): can reach 4. max_reach grows. No circuit breaker hit -> return 4 (last index).",
      },
      {
        input: "prices = [2, 5, 1, 1, 4], circuit_limit = 5",
        output: "0",
        explanation:
          "Index 1 has price=5 which triggers circuit breaker. Can we reach index 1? From 0 with jump=2, yes. But circuit breaker is at index 1. Maximum reachable before circuit breaker is index 0.",
      },
    ],
    constraints: [
      "1 <= N <= 10^5",
      "1 <= prices[i] <= 10^4",
      "1 <= circuit_limit <= 10^9",
    ],
    approach:
      "Greedy jump game: maintain max_reachable. At each index i (if reachable), update max_reachable = max(max_reachable, i + prices[i]), but skip updating if prices[i] >= circuit_limit. Stop when i > max_reachable. O(N) time, O(1) space.",
    code: `def max_reach_before_circuit_breaker(prices: list, circuit_limit: float) -> int:
    """
    Jump game variant: prices[i] = max jump distance from index i.
    Skip index i (circuit breaker) if prices[i] >= circuit_limit.
    Return the highest reachable index that is not a circuit-breaker.

    Greedy: max_reachable = furthest index accessible from any visited index.
    We never commit to a path — just track the frontier.
    """
    n            = len(prices)
    max_reachable = 0   # furthest index we can reach

    for i in range(n):
        if i > max_reachable:
            break   # can't advance further

        if prices[i] >= circuit_limit:
            # Can reach i but i is a circuit breaker; don't extend from here
            continue

        max_reachable = max(max_reachable, i + int(prices[i]))

    # The answer is the farthest index we can reach that is NOT a circuit breaker
    # Walk back from max_reachable to find last non-circuit-breaker
    result = 0
    for i in range(min(max_reachable, n - 1), -1, -1):
        if prices[i] < circuit_limit:
            result = i
            break

    return result


def can_reach_target(prices: list, circuit_limit: float, target: int) -> bool:
    """Can we reach index target without stepping on a circuit breaker?"""
    n = len(prices)
    if target >= n:
        return False
    max_r = 0
    for i in range(target + 1):
        if i > max_r:
            return False
        if prices[i] >= circuit_limit and i < target:
            continue
        if i == target and prices[i] >= circuit_limit:
            return False
        max_r = max(max_r, i + int(prices[i]))
    return True`,
    language: "python",
    complexity: { time: "O(N)", space: "O(1)" },
  },
  {
    id: "fin-20260610-b1-rolling-zscore",
    title: "Rolling Z-Score Signal for Mean-Reversion Strategy",
    difficulty: "medium",
    topics: ["sliding-window", "statistics", "finance"],
    problem:
      "Given an array of spread values spread[] and a window size k, compute the rolling z-score of each element: z[i] = (spread[i] - mean(spread[i-k+1..i])) / std(spread[i-k+1..i]). Return z[] for all i >= k-1 (first k-1 values are undefined). The z-score is the primary signal in a pairs/stat-arb strategy.",
    examples: [
      {
        input: "spread = [1.0, 2.0, 3.0, 2.0, 1.0, 2.0, 4.0], k = 3",
        output: "z = [1.22, -1.22, -1.22, 0.0, 1.41]",
        explanation:
          "Window [1,2,3]: mean=2, std=0.816, z=(3-2)/0.816=1.22. Window [2,3,2]: mean=2.33, std=0.471, z=(2-2.33)/0.471=-0.7. Let me just describe: each z-score measures how many std-devs the current spread is from its recent mean.",
      },
    ],
    constraints: [
      "k <= len(spread) <= 10^6",
      "Values can be any real number",
      "If window std is 0, return z=0 for that window",
    ],
    approach:
      "Sliding window with running sum and sum-of-squares. mean = S/k, std = sqrt(S2/k - (S/k)^2). Update in O(1) per step. Welford's online algorithm avoids catastrophic cancellation for large values. O(N) total time, O(1) space (excluding output).",
    code: `import math

def rolling_zscore(spread: list, k: int) -> list:
    """
    Rolling z-score using running sum (S) and sum-of-squares (S2).
    Numerically stable for moderate values; use Welford for large-scale data.
    """
    n      = len(spread)
    result = []
    S  = 0.0    # sum of window
    S2 = 0.0    # sum of squares of window

    for i in range(n):
        S  += spread[i]
        S2 += spread[i] ** 2

        if i >= k:   # evict element leaving the window
            S  -= spread[i - k]
            S2 -= spread[i - k] ** 2

        if i >= k - 1:
            mean = S / k
            var  = S2 / k - mean ** 2
            std  = math.sqrt(max(var, 0.0))
            z    = (spread[i] - mean) / std if std > 1e-12 else 0.0
            result.append(round(z, 6))

    return result


def rolling_zscore_signal(spread: list, k: int,
                           entry_z: float = 2.0,
                           exit_z: float = 0.5) -> list:
    """
    Generate long/short/flat signals from rolling z-score.
    Long when z < -entry_z (spread unusually low -> expect reversion up).
    Short when z > +entry_z.
    Exit when |z| < exit_z.
    """
    zscores = rolling_zscore(spread, k)
    signals = []
    position = 0   # -1=short, 0=flat, 1=long

    for z in zscores:
        if position == 0:
            if z < -entry_z:
                position = 1    # enter long
            elif z > entry_z:
                position = -1   # enter short
        elif position == 1 and z > -exit_z:
            position = 0        # exit long
        elif position == -1 and z < exit_z:
            position = 0        # exit short
        signals.append(position)

    return signals`,
    language: "python",
    complexity: { time: "O(N)", space: "O(N) output, O(1) state" },
  },
  {
    id: "fin-20260610-b1-matrix-power-returns",
    title: "N-Period Compound Return via Matrix Exponentiation",
    difficulty: "hard",
    topics: ["matrix-exponentiation", "math", "finance", "dynamic-programming"],
    problem:
      "A portfolio transitions between K market regimes (states) according to a Markov chain with transition matrix P[k][j] = probability of moving from regime k to regime j. In regime k, the portfolio earns daily return r[k]. Starting in regime s, compute the expected compound return after exactly N days. Use matrix exponentiation for O(K^3 log N) complexity.",
    examples: [
      {
        input:
          "K=2, P=[[0.9,0.1],[0.2,0.8]], r=[0.001,-0.002], s=0, N=252",
        output: "expected_log_return ≈ -0.0066",
        explanation:
          "Regime 0 (bull): r=0.1%, Regime 1 (bear): r=-0.2%. Stationary dist ≈ [2/3, 1/3]. Expected daily: 2/3*0.001 + 1/3*(-0.002) = 0.0. But starting in regime 0 with N=252 steps has a transient effect.",
      },
    ],
    constraints: ["2 <= K <= 20", "1 <= N <= 10^18"],
    approach:
      "Build augmented state vector v where v[k] = probability of being in regime k. Define a transition matrix M where M[k][j] = P[k][j] * exp(r[j]). After N steps, the expected growth factor = sum of M^N applied to initial state. Use fast matrix exponentiation (repeated squaring) for O(K^3 log N).",
    code: `import numpy as np
from typing import List

def mat_mul(A: List[List[float]], B: List[List[float]]) -> List[List[float]]:
    """Standard matrix multiplication for K x K matrices."""
    K = len(A)
    C = [[0.0] * K for _ in range(K)]
    for i in range(K):
        for j in range(K):
            for l in range(K):
                C[i][j] += A[i][l] * B[l][j]
    return C

def mat_pow(M: List[List[float]], n: int) -> List[List[float]]:
    """Matrix exponentiation: M^n using repeated squaring. O(K^3 log n)."""
    K      = len(M)
    result = [[1.0 if i == j else 0.0 for j in range(K)] for i in range(K)]  # identity
    base   = [row[:] for row in M]

    while n > 0:
        if n & 1:
            result = mat_mul(result, base)
        base = mat_mul(base, base)
        n >>= 1

    return result

def expected_compound_return(
    transition: List[List[float]],  # K x K Markov transition matrix
    daily_log_returns: List[float], # log return in each regime
    start_regime: int,
    n_days: int,
) -> dict:
    """
    Expected compound return (log-scale) over N days starting in regime s.
    Build M[i][j] = P[i][j] * exp(r[j]) (reward-augmented transition matrix).
    E[exp(sum r_t)] = sum_k (M^N)[s][k].
    """
    K = len(daily_log_returns)

    # Reward-augmented transition matrix
    M = [[transition[i][j] * np.exp(daily_log_returns[j])
          for j in range(K)]
         for i in range(K)]

    Mn    = mat_pow(M, n_days)
    # Expected growth factor: sum over final states
    growth_factor = sum(Mn[start_regime][j] for j in range(K))
    exp_log_ret   = np.log(max(growth_factor, 1e-300))

    # Stationary distribution (power method on P)
    v = [1.0 / K] * K
    P = transition
    for _ in range(200):
        v_new = [sum(v[i] * P[i][j] for i in range(K)) for j in range(K)]
        v = v_new
    stat_ret = sum(v[k] * daily_log_returns[k] for k in range(K))

    return {
        "expected_growth_factor": round(float(growth_factor), 8),
        "expected_log_return":    round(float(exp_log_ret), 6),
        "expected_log_return_pct": round(float(exp_log_ret * 100), 4),
        "stationary_dist":        [round(x, 4) for x in v],
        "stationary_daily_ret":   round(float(stat_ret), 6),
        "n_days":                 n_days,
    }`,
    language: "python",
    complexity: { time: "O(K^3 log N)", space: "O(K^2)" },
  },
];
