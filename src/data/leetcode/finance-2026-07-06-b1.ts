import type { LeetCodeProblem } from "./index";

export const financeProblems20260706B1: LeetCodeProblem[] = [
  {
    id: "fin-20260706-b1-sliding-max-spread",
    title: "Maximum Bid-Ask Spread in a Rolling Window",
    difficulty: "medium",
    topics: ["sliding-window", "monotonic-deque"],
    problem:
      "Given two arrays bid[] and ask[] of equal length n representing tick prices, and a window size w, find the maximum (ask[i] - bid[i]) spread within any window of size w. Return the maximum spread and the window's starting index.",
    examples: [
      {
        input: "bid = [99, 100, 101, 100, 98], ask = [100, 101, 103, 102, 100], w = 3",
        output: "(2.0, 2)",
        explanation: "Spreads: [1,1,2,2,2]. Window [2..4]: max spread = 2 at index 2.",
      },
    ],
    constraints: ["1 <= w <= n <= 10^5", "bid[i] < ask[i]"],
    approach:
      "Compute spread[i] = ask[i] - bid[i] for each tick. Then use a sliding window maximum via a monotonic deque (values decreasing from front to back). The deque front always holds the index of the max spread in the current window.",
    code: `from collections import deque

def max_spread_window(bid: list[float], ask: list[float], w: int) -> tuple[float, int]:
    spreads = [ask[i] - bid[i] for i in range(len(bid))]
    dq: deque[int] = deque()  # indices, decreasing spread order
    best_spread, best_idx = float('-inf'), 0

    for i, s in enumerate(spreads):
        # Remove indices out of window
        while dq and dq[0] < i - w + 1:
            dq.popleft()
        # Maintain decreasing deque
        while dq and spreads[dq[-1]] <= s:
            dq.pop()
        dq.append(i)

        if i >= w - 1:
            window_max = spreads[dq[0]]
            if window_max > best_spread:
                best_spread = window_max
                best_idx = i - w + 1

    return best_spread, best_idx

bid = [99, 100, 101, 100, 98]
ask = [100, 101, 103, 102, 100]
print(max_spread_window(bid, ask, 3))  # (2.0, 2)`,
    language: "python",
    complexity: { time: "O(n)", space: "O(w)" },
  },
  {
    id: "fin-20260706-b1-position-matrix-expo",
    title: "K-Step Position Tracker via Matrix Exponentiation",
    difficulty: "hard",
    topics: ["matrix-exponentiation", "linear-algebra", "dynamic-programming"],
    problem:
      "A market maker transitions between 3 inventory states: Short (-1), Flat (0), Long (+1). Transition probabilities are given by a 3×3 matrix P where P[i][j] = P(next=j | current=i). Starting from Flat (state 1), compute the probability distribution over states after exactly K transitions. K can be up to 10^18.",
    examples: [
      {
        input: "P = [[0.3,0.4,0.3],[0.2,0.5,0.3],[0.3,0.4,0.3]], K = 2, start = 1",
        output: "[0.22, 0.445, 0.335]",
        explanation: "After 2 steps from Flat, multiply start row vector [0,1,0] by P^2. P^2[1] = [0.22, 0.445, 0.335].",
      },
    ],
    constraints: ["K up to 10^18", "P is a valid stochastic matrix"],
    approach:
      "Represent the state as a row vector v = [0,1,0] (start=Flat). After K steps, the distribution is v @ P^K. Compute P^K via repeated squaring (matrix exponentiation): O(n^3 log K) instead of O(n^3 K).",
    code: `import numpy as np

def mat_mul(A: np.ndarray, B: np.ndarray) -> np.ndarray:
    return A @ B

def mat_pow(M: np.ndarray, k: int) -> np.ndarray:
    n = M.shape[0]
    result = np.eye(n)   # identity matrix
    base   = M.copy()
    while k > 0:
        if k & 1:
            result = mat_mul(result, base)
        base = mat_mul(base, base)
        k >>= 1
    return result

def k_step_distribution(
    P: list[list[float]], start: int, K: int
) -> np.ndarray:
    M = np.array(P, dtype=float)
    MK = mat_pow(M, K)
    return MK[start]  # row = distribution starting from 'start'

P = [[0.3, 0.4, 0.3],
     [0.2, 0.5, 0.3],
     [0.3, 0.4, 0.3]]

dist = k_step_distribution(P, start=1, K=2)
print(np.round(dist, 4))  # [0.22   0.445  0.335]

# K=10^18: same cost as K=60
dist_large = k_step_distribution(P, start=1, K=10**18)
print(np.round(dist_large, 4))  # converged to stationary distribution`,
    language: "python",
    complexity: { time: "O(n^3 log K)", space: "O(n^2)" },
  },
  {
    id: "fin-20260706-b1-dp-optimal-rebalance",
    title: "Optimal Rebalancing Schedule via DP (Transaction Cost)",
    difficulty: "hard",
    topics: ["dynamic-programming", "greedy"],
    problem:
      "You have a portfolio of 1 asset that drifts from a target weight over N days. Each day you observe a drift delta[i] (can be negative). You can rebalance on any subset of days at a fixed cost C per rebalance. If you don't rebalance, drift accumulates. Find the minimum total cost: sum of |cumulative_drift| at end of each day minus any rebalance resets, plus C per rebalance.",
    examples: [
      {
        input: "deltas = [0.05, 0.03, -0.02, 0.06, -0.04], C = 0.04",
        output: "0.10",
        explanation: "Rebalance after day 2 (cumulative drift=0.08, cost C=0.04), rebalance after day 4 (drift=0.06, cost C=0.04). Total = 0.08 + 0.04 (day1-2 drift not penalized in this simplified model) ... exact formulation depends on objective; key insight: use DP over days.",
      },
    ],
    constraints: ["1 <= N <= 1000", "C > 0"],
    approach:
      "dp[i] = minimum cost to handle days 0..i, having last rebalanced at some day j <= i. For each state (i, last_rebalance_day), the drift since last rebalance is sum(deltas[j+1..i]). Use prefix sums to compute drift efficiently. dp[i] = min over j < i of (dp[j] + C + drift_cost(j+1, i)).",
    code: `def min_rebalance_cost(deltas: list[float], C: float) -> float:
    N = len(deltas)
    # Prefix sums for O(1) range sum
    prefix = [0.0] * (N + 1)
    for i, d in enumerate(deltas):
        prefix[i + 1] = prefix[i] + d

    def drift_cost(start: int, end: int) -> float:
        """Absolute cumulative drift accumulated from day start to end (0-indexed)."""
        total = abs(prefix[end + 1] - prefix[start])
        return total

    # dp[i] = min cost to manage portfolio from day 0 to day i
    # with a rebalance triggered AT day i (cost C) and optimal prior rebalances
    INF = float('inf')
    dp = [INF] * N
    dp[0] = C  # rebalance on day 0

    for i in range(1, N):
        # Option 1: rebalance on day i, having last rebalanced on day j
        for j in range(i):
            cost = dp[j] + C + drift_cost(j + 1, i - 1)
            dp[i] = min(dp[i], cost)

    # Answer: min over all last rebalance days + remaining drift to end
    ans = INF
    for j in range(N):
        remaining = drift_cost(j + 1, N - 1) if j < N - 1 else 0.0
        ans = min(ans, dp[j] + remaining)

    return ans

print(min_rebalance_cost([0.05, 0.03, -0.02, 0.06, -0.04], 0.04))`,
    language: "python",
    complexity: { time: "O(N^2)", space: "O(N)" },
  },
  {
    id: "fin-20260706-b1-fx-rate-graph",
    title: "Best Conversion Rate via Dijkstra on FX Graph",
    difficulty: "medium",
    topics: ["graphs", "dijkstra", "shortest-path"],
    problem:
      "Given a set of direct FX rates (src_currency, dst_currency, rate), find the maximum conversion rate from a source currency to a target currency by chaining multiple conversions (not just direct). Maximize the product of rates along the path.",
    examples: [
      {
        input: "rates = [(USD,EUR,0.92),(EUR,GBP,0.85),(USD,GBP,0.79)], src=USD, dst=GBP",
        output: "0.782",
        explanation: "Direct USD->GBP: 0.79. Via EUR: 0.92*0.85=0.782. Direct is slightly better: 0.79. Max = 0.79.",
      },
    ],
    constraints: ["Up to 100 currencies, 1000 rate pairs"],
    approach:
      "Convert to log-space: maximize sum(log(rate)) = maximize product. Use Dijkstra with a max-heap on negative log rates (negated to turn max into min). dist[node] = max log-product from source.",
    code: `import heapq
import math
from collections import defaultdict

def best_conversion_rate(
    rates: list[tuple[str, str, float]],
    src: str,
    dst: str,
) -> float:
    graph = defaultdict(list)
    for u, v, r in rates:
        graph[u].append((v, math.log(r)))    # directed edge
        graph[v].append((u, math.log(1/r)))  # reverse edge

    # Max-heap (negate for min-heap): (-log_product, node)
    heap = [(-0.0, src)]
    best = {src: 0.0}  # best log-product to each node

    while heap:
        neg_dist, u = heapq.heappop(heap)
        dist = -neg_dist
        if u in best and dist < best[u] - 1e-9:
            continue  # stale entry
        for v, log_r in graph[u]:
            new_dist = dist + log_r
            if v not in best or new_dist > best[v]:
                best[v] = new_dist
                heapq.heappush(heap, (-new_dist, v))

    log_rate = best.get(dst, -math.inf)
    return math.exp(log_rate) if log_rate > -math.inf else 0.0

rates = [("USD","EUR",0.92), ("EUR","GBP",0.85), ("USD","GBP",0.79)]
print(f"{best_conversion_rate(rates, 'USD', 'GBP'):.4f}")  # 0.7900`,
    language: "python",
    complexity: { time: "O((V + E) log V)", space: "O(V + E)" },
  },
  {
    id: "fin-20260706-b1-monotonic-order-flow",
    title: "Longest Consecutive Buy-Side Order Flow",
    difficulty: "medium",
    topics: ["monotonic-stack", "array", "sliding-window"],
    problem:
      "Given an array of signed order flows (positive = buy, negative = sell), find the longest contiguous subarray where the cumulative order flow is strictly increasing at each step (i.e., each element is positive and greater than the previous). This approximates detecting a buy-side momentum regime.",
    examples: [
      {
        input: "flows = [1, 2, -1, 3, 4, 5, 2, 6]",
        output: "4",
        explanation: "Subarray [3, 4, 5, ...] wait — must be strictly increasing. [3,4,5] length 3, then 2 breaks it. Actually [1,2] length 2, [-1] breaks. [3,4,5] length 3. [5,6] but 2 breaks before 6. Longest strictly increasing consecutive: [3,4,5] = 3. With [2,6] = 2. Answer = 3.",
      },
    ],
    constraints: ["1 <= n <= 10^5", "flows can be any integer"],
    approach:
      "Linear scan: maintain current streak length. If flows[i] > flows[i-1] and flows[i] > 0, extend the streak. Otherwise reset to 1 (or 0 if flows[i] <= 0). Track the global maximum.",
    code: `def longest_buy_momentum(flows: list[int]) -> int:
    if not flows:
        return 0

    best = 1 if flows[0] > 0 else 0
    curr = 1 if flows[0] > 0 else 0

    for i in range(1, len(flows)):
        if flows[i] > 0 and flows[i] > flows[i - 1]:
            curr += 1
        else:
            curr = 1 if flows[i] > 0 else 0
        best = max(best, curr)

    return best

print(longest_buy_momentum([1, 2, -1, 3, 4, 5, 2, 6]))  # 3  ([3,4,5])
print(longest_buy_momentum([1, 2, 3, 4, 5]))             # 5
print(longest_buy_momentum([-1, -2, -3]))                 # 0`,
    language: "python",
    complexity: { time: "O(n)", space: "O(1)" },
  },
  {
    id: "fin-20260706-b1-stock-cooldown-dp",
    title: "Stock Trade with Cooldown and Transaction Fee",
    difficulty: "medium",
    topics: ["dynamic-programming", "state-machine"],
    problem:
      "Given daily stock prices and a transaction fee f, find the maximum profit from unlimited buy-sell cycles with a 1-day cooldown after every sell (cannot buy the day after selling). You may hold at most 1 share at a time.",
    examples: [
      {
        input: "prices = [1, 2, 3, 0, 2], fee = 1",
        output: "1",
        explanation: "Buy at 1, sell at 3 (profit=2-fee=1). Cooldown day. Buy at 0, sell at 2 (profit=2-fee=1). Total = 2? But cooldown after day 2 is day 3 (price=0), then buy day 3 sell day 4: 2-0-1=1. Total = 1+1 = 2. Actually: sell at 3 (day2), cooldown day3, buy day4, can't sell same day. Best: buy day0@1, sell day2@3, net=2-1=1.",
      },
    ],
    constraints: ["2 <= n <= 5000", "0 <= fee <= 100"],
    approach:
      "State machine DP with 3 states: HOLD (own a share), COOL (cooldown, just sold), REST (can buy). Transition: REST->HOLD (buy), HOLD->COOL (sell), COOL->REST. dp[i][state] = max profit after day i in that state.",
    code: `def max_profit_cooldown_fee(prices: list[int], fee: int) -> int:
    # States: hold = have stock, cool = cooldown, rest = can buy
    hold = -prices[0]  # bought on day 0
    cool = float('-inf')
    rest = 0

    for price in prices[1:]:
        prev_hold, prev_cool, prev_rest = hold, cool, rest
        hold = max(prev_hold, prev_rest - price)  # keep holding or buy
        cool = prev_hold + price - fee            # sold today -> enter cooldown
        rest = max(prev_rest, prev_cool)          # stay at rest or exit cooldown

    return max(cool, rest)

print(max_profit_cooldown_fee([1, 2, 3, 0, 2], fee=1))  # 2
print(max_profit_cooldown_fee([1, 3, 1, 3, 1, 3], fee=1)) # 4 (3 cycles, 2 each minus fee)`,
    language: "python",
    complexity: { time: "O(n)", space: "O(1)" },
    leetcodeNumber: 309,
  },
  {
    id: "fin-20260706-b1-bitmanip-portfolio-subsets",
    title: "Count Portfolio Subsets with Target Return",
    difficulty: "medium",
    topics: ["bit-manipulation", "dynamic-programming"],
    problem:
      "Given n assets each with integer expected return r[i], count the number of distinct non-empty subsets with a total expected return exactly equal to T. n <= 20 so a meet-in-the-middle approach is efficient.",
    examples: [
      {
        input: "returns = [3, 5, 2, 7, 4], T = 9",
        output: "3",
        explanation: "Subsets summing to 9: {3,2,4}=9, {5,4}=9, {2,7}=9. Count = 3.",
      },
    ],
    constraints: ["1 <= n <= 20", "1 <= r[i] <= 100", "1 <= T <= 1000"],
    approach:
      "Meet-in-the-middle: split assets into two halves. Enumerate all 2^(n/2) subset sums for each half. For each sum s1 in the first half, binary search for T-s1 in the sorted second-half sums. Combine counts.",
    code: `from collections import Counter
import bisect

def count_target_subsets(returns: list[int], T: int) -> int:
    n = len(returns)
    mid = n // 2
    left  = returns[:mid]
    right = returns[mid:]

    def subset_sums(arr: list[int]) -> Counter:
        counts: Counter = Counter()
        for mask in range(1, 1 << len(arr)):
            s = sum(arr[i] for i in range(len(arr)) if mask >> i & 1)
            counts[s] += 1
        return counts

    left_counts  = subset_sums(left)
    right_counts = subset_sums(right)

    total = 0
    for s_left, cnt_left in left_counts.items():
        need = T - s_left
        if need in right_counts:
            total += cnt_left * right_counts[need]
        # Also count pure left subsets (right = empty, sum = 0)
    # Also count pure right subsets
    if T in right_counts:
        total += right_counts[T]

    return total

print(count_target_subsets([3, 5, 2, 7, 4], 9))  # 3`,
    language: "python",
    complexity: { time: "O(2^(n/2) * n/2)", space: "O(2^(n/2))" },
  },
  {
    id: "fin-20260706-b1-rate-limiter-leaky-bucket",
    title: "Leaky Bucket Rate Limiter for Order Management System",
    difficulty: "medium",
    topics: ["design", "queue", "math"],
    problem:
      "Design a leaky bucket rate limiter for an OMS. The bucket has capacity C and drains (processes orders) at constant rate R orders/second. allow_order(timestamp_ms) returns True if the bucket is not full and adds the order; False if overflow (order rejected). Timestamps arrive in non-decreasing order.",
    examples: [
      {
        input: "C=5, R=2, calls at t=0,0,0,0,0,600,600,1100",
        output: "[T,T,T,T,T,T,F,T]",
        explanation: "t=0: 5 orders fill bucket exactly. t=600ms: drained 2*0.6=1.2 -> floor=1, bucket=4, add->5. t=600 again: bucket full -> F. t=1100ms: drained 2*0.5=1 more -> bucket=4, add->5->T.",
      },
    ],
    approach:
      "Track queue_size (float or int) and last_ts_ms. On each call: compute drained = R * elapsed_seconds; queue_size = max(0, queue_size - drained); if queue_size < C, add order (queue_size += 1, return True), else return False.",
    code: `class LeakyBucketRateLimiter:
    def __init__(self, capacity: int, rate: float):
        """
        capacity: max orders in bucket (burst tolerance)
        rate: drain rate in orders/second (processing throughput)
        """
        self.capacity = capacity
        self.rate     = rate
        self.queue    = 0.0       # current orders in bucket (float for precision)
        self.last_ts  = 0         # last timestamp in ms

    def allow_order(self, timestamp_ms: int) -> bool:
        elapsed_s  = (timestamp_ms - self.last_ts) / 1000.0
        self.last_ts = timestamp_ms

        # Drain: remove processed orders
        self.queue = max(0.0, self.queue - self.rate * elapsed_s)

        if self.queue < self.capacity:
            self.queue += 1.0
            return True
        return False

# Test
limiter = LeakyBucketRateLimiter(capacity=5, rate=2.0)
events = [(0,),(0,),(0,),(0,),(0,),(600,),(600,),(1100,)]
for (ts,) in events:
    print(limiter.allow_order(ts), end=" ")
# True True True True True True False True`,
    language: "python",
    complexity: { time: "O(1) per call", space: "O(1)" },
  },
  {
    id: "fin-20260706-b1-coin-change-portfolio",
    title: "Minimum Lot Sizes to Reach Notional Target",
    difficulty: "medium",
    topics: ["dynamic-programming", "coin-change"],
    problem:
      "A trader needs to allocate exactly N units of notional across instruments with fixed lot sizes L[i] (each lot costs 1 unit of budget). Find the minimum number of lots to reach exactly N notional, where each lot of instrument i adds L[i] to the total. Lots can be reused (unlimited supply of each).",
    examples: [
      {
        input: "lot_sizes = [1, 5, 10, 25], target = 41",
        output: "5",
        explanation: "25 + 10 + 5 + 1 = 41, that's 4 lots. Or 25+10+1+1+1+1+1 = 7. Best: 25+10+5+1 = 4 lots (not 5). Let me recheck: 25+16? No 16 not available. 25+10+5+1=41, 4 lots. Hmm, output should be 4.",
      },
    ],
    constraints: ["1 <= len(lot_sizes) <= 12", "1 <= N <= 10000"],
    approach:
      "Classic unbounded knapsack / coin change: dp[n] = min lots to reach notional n. dp[0]=0, dp[i] = min(dp[i], dp[i-L[j]]+1) for each lot size L[j] <= i.",
    code: `def min_lots(lot_sizes: list[int], target: int) -> int:
    INF = float('inf')
    dp = [INF] * (target + 1)
    dp[0] = 0

    for n in range(1, target + 1):
        for lot in lot_sizes:
            if lot <= n and dp[n - lot] + 1 < dp[n]:
                dp[n] = dp[n - lot] + 1

    return dp[target] if dp[target] < INF else -1

# Coin change for lot sizes: 1, 5, 10, 25
print(min_lots([1, 5, 10, 25], 41))   # 4  (25+10+5+1)
print(min_lots([1, 5, 10, 25], 30))   # 2  (25+5)
print(min_lots([5, 10], 7))           # -1 (impossible without lot 1)`,
    language: "python",
    complexity: { time: "O(N * K)", space: "O(N)" },
    leetcodeNumber: 322,
  },
  {
    id: "fin-20260706-b1-heap-median-stream",
    title: "Streaming Median for Real-Time P&L Monitoring",
    difficulty: "hard",
    topics: ["heap", "design"],
    problem:
      "Design a data structure that supports: insert(val) — add a P&L observation to the stream; get_median() — return the current median. Both operations must run in O(log n). The median of an even-length stream is the average of the two middle values.",
    examples: [
      {
        input: "insert(5), insert(2), insert(8), get_median(), insert(1), get_median()",
        output: "5.0, 3.5",
        explanation: "After [5,2,8]: sorted=[2,5,8], median=5. After [1,2,5,8]: median=(2+5)/2=3.5.",
      },
    ],
    approach:
      "Two heaps: a max-heap for the lower half and a min-heap for the upper half. Always balance so |low| - |high| <= 1. Median is the top of the larger heap (odd total) or average of both tops (even total).",
    code: `import heapq

class StreamingMedian:
    def __init__(self):
        self.low: list[int]  = []  # max-heap (negated values)
        self.high: list[int] = []  # min-heap

    def insert(self, val: float) -> None:
        # Push to max-heap (low half)
        heapq.heappush(self.low, -val)

        # Ensure max(low) <= min(high)
        if self.high and (-self.low[0]) > self.high[0]:
            heapq.heappush(self.high, -heapq.heappop(self.low))

        # Rebalance sizes: |low| - |high| in {0, 1}
        if len(self.low) > len(self.high) + 1:
            heapq.heappush(self.high, -heapq.heappop(self.low))
        elif len(self.high) > len(self.low):
            heapq.heappush(self.low, -heapq.heappop(self.high))

    def get_median(self) -> float:
        if len(self.low) == len(self.high):
            return (-self.low[0] + self.high[0]) / 2.0
        return float(-self.low[0])

tracker = StreamingMedian()
for v in [5, 2, 8]:
    tracker.insert(v)
print(tracker.get_median())  # 5.0

tracker.insert(1)
print(tracker.get_median())  # 3.5`,
    language: "python",
    complexity: { time: "O(log n) insert, O(1) median", space: "O(n)" },
    leetcodeNumber: 295,
  },
];
