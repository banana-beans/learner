import type { LeetCodeProblem } from "./index";

export const financeProblems20260715B1: LeetCodeProblem[] = [
  {
    id: "fin-20260715-b1-streaming-median-bid",
    title: "Streaming Median of Bid Prices",
    difficulty: "medium",
    topics: ["heap", "design", "two-pointers"],
    problem:
      "Design a data structure that supports two operations on a real-time stream of bid prices: (1) addPrice(price) — insert a new bid price; (2) findMedian() — return the current median of all inserted prices. Median must be returned in O(log n) amortized time.",
    examples: [
      {
        input: 'addPrice(100.5), addPrice(102.0), addPrice(101.0), findMedian()',
        output: "101.0",
        explanation:
          "Sorted: [100.5, 101.0, 102.0] — middle element is 101.0.",
      },
      {
        input: 'addPrice(99.0), findMedian()  (after the above 3 inserts)',
        output: "100.75",
        explanation:
          "Sorted: [99.0, 100.5, 101.0, 102.0] — median = (100.5 + 101.0) / 2.",
      },
    ],
    constraints: [
      "1 <= price <= 1e9",
      "At most 5 × 10^4 calls across both operations",
    ],
    approach:
      "Maintain a max-heap (lower half) and a min-heap (upper half). Keep sizes balanced: |max_heap| - |min_heap| in {0, 1}. Push new price to max-heap; if it exceeds the min of upper half, rebalance. Median is the top of max-heap (odd count) or average of both tops (even count).",
    code: `import heapq

class StreamingMedian:
    def __init__(self):
        self._lo: list[float] = []   # max-heap (negate for Python's min-heap)
        self._hi: list[float] = []   # min-heap

    def add_price(self, price: float) -> None:
        heapq.heappush(self._lo, -price)            # push to lower half

        # Balance: ensure max(lo) <= min(hi)
        if self._hi and -self._lo[0] > self._hi[0]:
            heapq.heappush(self._hi, -heapq.heappop(self._lo))

        # Size invariant: lo may hold one extra element
        if len(self._lo) > len(self._hi) + 1:
            heapq.heappush(self._hi, -heapq.heappop(self._lo))
        elif len(self._hi) > len(self._lo):
            heapq.heappush(self._lo, -heapq.heappop(self._hi))

    def find_median(self) -> float:
        if len(self._lo) > len(self._hi):
            return -self._lo[0]
        return (-self._lo[0] + self._hi[0]) / 2.0

# Demonstration
sm = StreamingMedian()
for p in [100.5, 102.0, 101.0]:
    sm.add_price(p)
print(sm.find_median())   # 101.0
sm.add_price(99.0)
print(sm.find_median())   # 100.75`,
    language: "python",
    complexity: { time: "O(log n) per add, O(1) per query", space: "O(n)" },
    leetcodeNumber: 295,
  },
  {
    id: "fin-20260715-b1-next-greater-price",
    title: "Next Greater Ask Price (Monotonic Stack)",
    difficulty: "medium",
    topics: ["stack", "monotonic-stack", "array"],
    problem:
      "You are given an array of daily closing ask prices. For each day i, find the next day j > i such that ask[j] > ask[i], and return j - i (the number of days until a higher price). If no such j exists, return 0.",
    examples: [
      {
        input: "ask = [73, 74, 75, 71, 69, 72, 76, 73]",
        output: "[1, 1, 4, 2, 1, 1, 0, 0]",
        explanation:
          "Day 0: next higher is day 1 (74 > 73), gap = 1. Day 2: next higher is day 6 (76 > 75), gap = 4.",
      },
    ],
    constraints: ["1 <= n <= 10^5", "1 <= ask[i] <= 10^5"],
    approach:
      "Maintain a monotonic decreasing stack of (price, index) pairs. For each new price, pop all stack entries with price < current — their answer is currentIndex - storedIndex. Push the current entry. Remaining stack entries have answer 0.",
    code: `def next_greater_ask(ask: list[int]) -> list[int]:
    n = len(ask)
    result = [0] * n
    stack: list[int] = []   # indices with unresolved answers

    for i, price in enumerate(ask):
        # Pop indices whose next greater element is the current price
        while stack and ask[stack[-1]] < price:
            j = stack.pop()
            result[j] = i - j
        stack.append(i)

    # Remaining indices: no greater price found, result stays 0
    return result

# Example
print(next_greater_ask([73, 74, 75, 71, 69, 72, 76, 73]))
# [1, 1, 4, 2, 1, 1, 0, 0]`,
    language: "python",
    complexity: { time: "O(n)", space: "O(n)" },
    leetcodeNumber: 739,
  },
  {
    id: "fin-20260715-b1-max-profit-k-transactions",
    title: "Maximum Profit with At Most K Trades",
    difficulty: "hard",
    topics: ["dynamic-programming", "array"],
    problem:
      "Given an array prices of daily stock prices and an integer k, find the maximum profit achievable with at most k buy-sell transactions (you must sell before you buy again, and you may complete at most k non-overlapping transactions).",
    examples: [
      {
        input: "k = 2, prices = [3, 2, 6, 5, 0, 3]",
        output: "7",
        explanation: "Buy at 2, sell at 6 (profit 4); buy at 0, sell at 3 (profit 3). Total 7.",
      },
      {
        input: "k = 1, prices = [1, 4, 2]",
        output: "3",
        explanation: "Single trade: buy at 1, sell at 4.",
      },
    ],
    constraints: [
      "0 <= k <= 100",
      "0 <= n <= 1000",
      "0 <= prices[i] <= 1000",
    ],
    approach:
      "DP state: dp[t][i] = max profit using at most t transactions up to day i. Recurrence: dp[t][i] = max(dp[t][i-1], max over j<i of prices[i] - prices[j] + dp[t-1][j]). Track running max of (dp[t-1][j] - prices[j]) to achieve O(kn) overall. If k >= n/2, unlimited trades.",
    code: `def max_profit_k_trades(k: int, prices: list[int]) -> int:
    n = len(prices)
    if n < 2:
        return 0

    # If k large enough, unlimited trades
    if k >= n // 2:
        return sum(
            max(prices[i] - prices[i - 1], 0) for i in range(1, n)
        )

    # dp[t][i] = max profit with at most t transactions through day i
    dp = [[0] * n for _ in range(k + 1)]

    for t in range(1, k + 1):
        max_so_far = -prices[0]       # max of (dp[t-1][j] - prices[j])
        for i in range(1, n):
            dp[t][i] = max(dp[t][i - 1], prices[i] + max_so_far)
            max_so_far = max(max_so_far, dp[t - 1][i] - prices[i])

    return dp[k][n - 1]

# Examples
print(max_profit_k_trades(2, [3, 2, 6, 5, 0, 3]))  # 7
print(max_profit_k_trades(1, [1, 4, 2]))             # 3`,
    language: "python",
    complexity: { time: "O(k * n)", space: "O(k * n)" },
    leetcodeNumber: 188,
  },
  {
    id: "fin-20260715-b1-sliding-window-max-return",
    title: "Sliding Window Maximum Daily Return",
    difficulty: "medium",
    topics: ["deque", "sliding-window", "array"],
    problem:
      "Given an array of daily returns (positive or negative percentages) and a window size w, return an array of the maximum return in each sliding window of size w. This simulates finding the best single-day return in each rolling w-day risk review period.",
    examples: [
      {
        input: "returns = [1.2, -0.5, 3.1, 0.8, -1.0, 2.4, 0.3], w = 3",
        output: "[3.1, 3.1, 3.1, 2.4, 2.4]",
        explanation:
          "Windows: [1.2,-0.5,3.1]->3.1, [-0.5,3.1,0.8]->3.1, [3.1,0.8,-1.0]->3.1, [0.8,-1.0,2.4]->2.4, [-1.0,2.4,0.3]->2.4.",
      },
    ],
    constraints: [
      "1 <= w <= n <= 10^5",
      "returns[i] is a float",
    ],
    approach:
      "Use a monotonic deque of indices maintaining decreasing returns. For each new index i: (1) pop from front if out of window; (2) pop from back while returns[back] <= returns[i]; (3) push i; the front is the window max.",
    code: `from collections import deque

def sliding_max_return(returns: list[float], w: int) -> list[float]:
    dq: deque[int] = deque()   # indices, decreasing by return value
    result: list[float] = []

    for i, r in enumerate(returns):
        # Remove indices outside the window
        while dq and dq[0] < i - w + 1:
            dq.popleft()

        # Maintain decreasing invariant
        while dq and returns[dq[-1]] <= r:
            dq.pop()

        dq.append(i)

        # Window has w elements starting from index w-1
        if i >= w - 1:
            result.append(returns[dq[0]])

    return result

# Example
rets = [1.2, -0.5, 3.1, 0.8, -1.0, 2.4, 0.3]
print(sliding_max_return(rets, 3))
# [3.1, 3.1, 3.1, 2.4, 2.4]`,
    language: "python",
    complexity: { time: "O(n)", space: "O(w)" },
    leetcodeNumber: 239,
  },
  {
    id: "fin-20260715-b1-markov-matrix-exponentiation",
    title: "Credit Rating Markov Chain via Matrix Exponentiation",
    difficulty: "hard",
    topics: ["matrix", "dynamic-programming", "math"],
    problem:
      "You are given a credit rating transition matrix M (n×n, rows sum to 1) where M[i][j] is the probability of migrating from rating i to rating j in one period. Given a starting state distribution v (length n) and a number of periods t, compute the distribution after t periods. Use matrix exponentiation to solve in O(n^3 log t) rather than O(n^3 t).",
    examples: [
      {
        input:
          "M = [[0.9,0.1],[0.05,0.95]], v = [1.0,0.0], t = 2",
        output: "[0.815, 0.185]",
        explanation:
          "After 2 periods starting AAA: p(AAA) = 0.9^2 + 0.1*0.05 = 0.815, p(BBB) = 0.185.",
      },
    ],
    constraints: [
      "1 <= n <= 20",
      "1 <= t <= 10^9",
      "Each row of M sums to 1.0",
    ],
    approach:
      "Represent M as a list of lists of floats. Implement matrix multiplication, then fast power (square-and-multiply on t). Apply result to v: result = v @ M^t.",
    code: `import math

def mat_mul(A: list[list[float]], B: list[list[float]]) -> list[list[float]]:
    n = len(A)
    C = [[0.0] * n for _ in range(n)]
    for i in range(n):
        for k in range(n):
            if A[i][k] == 0.0:
                continue
            for j in range(n):
                C[i][j] += A[i][k] * B[k][j]
    return C

def mat_pow(M: list[list[float]], t: int) -> list[list[float]]:
    n = len(M)
    result = [[1.0 if i == j else 0.0 for j in range(n)] for i in range(n)]
    while t:
        if t & 1:
            result = mat_mul(result, M)
        M = mat_mul(M, M)
        t >>= 1
    return result

def credit_transition(
    M: list[list[float]], v: list[float], t: int
) -> list[float]:
    Mt = mat_pow(M, t)
    n = len(v)
    out = [0.0] * n
    for j in range(n):
        for i in range(n):
            out[j] += v[i] * Mt[i][j]
    return out

# Example: 2-state chain
M = [[0.9, 0.1], [0.05, 0.95]]
v = [1.0, 0.0]
result = credit_transition(M, v, 2)
print([round(x, 3) for x in result])   # [0.815, 0.185]`,
    language: "python",
    complexity: { time: "O(n^3 log t)", space: "O(n^2)" },
  },
  {
    id: "fin-20260715-b1-order-deduplicator-design",
    title: "Design Order Deduplicator with TTL",
    difficulty: "medium",
    topics: ["design", "hash-table", "queue"],
    problem:
      "Design an OrderDeduplicator that processes a stream of order messages, each carrying a unique orderId and a timestamp. The deduplicator must: (1) return True and record the order if it is new; (2) return False if the orderId was already seen within the last T seconds; (3) automatically expire entries older than T seconds so memory is bounded. All timestamps are monotonically increasing.",
    examples: [
      {
        input:
          "T=5; process(id='A', ts=0)=True; process(id='A', ts=3)=False; process(id='A', ts=6)=True (expired); process(id='B', ts=7)=True",
        output: "[True, False, True, True]",
        explanation:
          "id='A' re-inserted at ts=6 because 6-0=6 > T=5, so it expired and is treated as new.",
      },
    ],
    constraints: [
      "1 <= T <= 3600",
      "0 <= ts <= 10^9 (monotonically increasing)",
      "orderId is an ASCII string of length <= 32",
      "At most 10^6 total calls",
    ],
    approach:
      "Store (orderId -> seen_at_ts) in a dict, and maintain a deque of (ts, orderId) for expiry. Before each process(), drain the front of the deque for entries older than ts - T, deleting them from the dict. Then check/insert the new order.",
    code: `from collections import deque

class OrderDeduplicator:
    def __init__(self, ttl_seconds: int):
        self._ttl = ttl_seconds
        self._seen: dict[str, int] = {}          # orderId -> first_seen_ts
        self._expiry: deque[tuple[int, str]] = deque()

    def process(self, order_id: str, ts: int) -> bool:
        # Expire old entries
        cutoff = ts - self._ttl
        while self._expiry and self._expiry[0][0] <= cutoff:
            exp_ts, exp_id = self._expiry.popleft()
            if self._seen.get(exp_id) == exp_ts:
                del self._seen[exp_id]

        if order_id in self._seen:
            return False   # duplicate within TTL window

        self._seen[order_id] = ts
        self._expiry.append((ts, order_id))
        return True

# Example
dd = OrderDeduplicator(ttl_seconds=5)
print(dd.process("A", 0))   # True
print(dd.process("A", 3))   # False
print(dd.process("A", 6))   # True (expired)
print(dd.process("B", 7))   # True`,
    language: "python",
    complexity: { time: "O(1) amortized per call", space: "O(n) where n = window size" },
  },
  {
    id: "fin-20260715-b1-sector-flags-bit-manipulation",
    title: "Portfolio Sector Coverage via Bit Manipulation",
    difficulty: "easy",
    topics: ["bit-manipulation", "array"],
    problem:
      "Each stock in a portfolio belongs to one or more sectors (0-indexed, up to 30 sectors). The sector membership of stock i is given as a bitmask sectors[i]. Given a list of portfolio holdings (indices into sectors[]), determine: (1) which sectors are covered (union bitmask), (2) how many distinct sectors are covered, (3) which sectors have full overlap (intersection bitmask of all held stocks).",
    examples: [
      {
        input:
          "sectors = [0b0011, 0b0101, 0b0110], holdings = [0, 1, 2]",
        output: "union=0b0111 (7), count=3, intersection=0b0000 (0)",
        explanation:
          "Union covers sectors 0,1,2. No sector is common to all three stocks.",
      },
    ],
    constraints: [
      "1 <= len(sectors) <= 10^4",
      "1 <= len(holdings) <= len(sectors)",
      "0 <= sectors[i] < 2^30",
    ],
    approach:
      "Compute union via OR across all held sector masks; intersection via AND. popcount (bin(...).count('1')) gives the distinct sector count.",
    code: `def sector_coverage(
    sectors: list[int], holdings: list[int]
) -> tuple[int, int, int]:
    if not holdings:
        return 0, 0, 0

    union_mask = 0
    inter_mask = (1 << 30) - 1   # all bits set; narrow down via AND

    for idx in holdings:
        mask = sectors[idx]
        union_mask |= mask
        inter_mask &= mask

    distinct_sectors = bin(union_mask).count("1")
    return union_mask, distinct_sectors, inter_mask

# Example
sectors_list = [0b0011, 0b0101, 0b0110]
holdings_list = [0, 1, 2]
union, count, inter = sector_coverage(sectors_list, holdings_list)
print(f"union={bin(union)}, count={count}, intersection={bin(inter)}")
# union=0b111, count=3, intersection=0b0

# Partial holdings: stocks 0 and 2 share sector 1 (bit 1)
_, _, inter2 = sector_coverage(sectors_list, [0, 2])
print(f"common sectors for stocks 0&2: {bin(inter2)}")  # 0b10 (sector 1)`,
    language: "python",
    complexity: { time: "O(h) where h = len(holdings)", space: "O(1)" },
  },
  {
    id: "fin-20260715-b1-top-k-active-stocks",
    title: "Top-K Most Active Stocks by Volume",
    difficulty: "medium",
    topics: ["heap", "hash-table", "array"],
    problem:
      "You receive a stream of trade events (ticker, volume). At any point you must be able to answer: what are the top K tickers by total accumulated volume? Implement an efficient data structure supporting addTrade(ticker, volume) and topK(k) -> list[ticker].",
    examples: [
      {
        input:
          "addTrade('AAPL',500), addTrade('GOOG',300), addTrade('AAPL',200), addTrade('MSFT',600), topK(2)",
        output: "['MSFT', 'AAPL']",
        explanation:
          "Volumes: MSFT=600, AAPL=700, GOOG=300. Top 2 by volume: AAPL(700), MSFT(600).",
      },
    ],
    constraints: [
      "1 <= k <= number of distinct tickers",
      "volume > 0",
      "At most 10^6 addTrade calls",
      "At most 10^3 topK calls",
    ],
    approach:
      "Accumulate volumes in a dict. For topK, use heapq.nlargest which runs in O(n log k). If topK is called very frequently, maintain a sorted structure; for this pattern (many writes, fewer reads) nlargest is idiomatic.",
    code: `import heapq
from collections import defaultdict

class ActiveStockTracker:
    def __init__(self):
        self._vol: dict[str, int] = defaultdict(int)

    def add_trade(self, ticker: str, volume: int) -> None:
        self._vol[ticker] += volume

    def top_k(self, k: int) -> list[str]:
        # nlargest: O(n log k) — fine for infrequent queries
        return [
            ticker
            for ticker, _ in heapq.nlargest(k, self._vol.items(), key=lambda x: x[1])
        ]

# Example
tracker = ActiveStockTracker()
for t, v in [("AAPL", 500), ("GOOG", 300), ("AAPL", 200), ("MSFT", 600)]:
    tracker.add_trade(t, v)

print(tracker.top_k(2))   # ['AAPL', 'MSFT']  (AAPL=700, MSFT=600)
print(tracker.top_k(3))   # ['AAPL', 'MSFT', 'GOOG']`,
    language: "python",
    complexity: {
      time: "O(1) add, O(n log k) topK",
      space: "O(distinct tickers)",
    },
  },
  {
    id: "fin-20260715-b1-rebalancing-paths-dp",
    title: "Count Portfolio Rebalancing Paths",
    difficulty: "medium",
    topics: ["dynamic-programming", "combinatorics"],
    problem:
      "A portfolio manager must rebalance a portfolio from an initial weight vector to a target weight vector by making exactly n rebalancing steps. At each step, they choose one asset to increase by one unit and one asset to decrease by one unit (net-zero cash flow). The assets are labeled 0..A-1. Given the initial weights, target weights, and number of steps n, count the total number of distinct rebalancing sequences (ordered choices of (increase, decrease) pairs) that reach the target. Return the answer modulo 10^9 + 7.",
    examples: [
      {
        input:
          "initial = [3, 1], target = [1, 3], n = 2",
        output: "1",
        explanation:
          "Must decrease asset 0 twice and increase asset 1 twice, in 2 steps: only sequence is [(decrease0,increase1),(decrease0,increase1)]. 1 path.",
      },
      {
        input:
          "initial = [2, 1, 1], target = [1, 2, 1], n = 1",
        output: "1",
        explanation: "One step: increase asset 1, decrease asset 0.",
      },
    ],
    constraints: [
      "2 <= A <= 8",
      "1 <= n <= 20",
      "sum(initial) == sum(target)",
      "Adjustment is feasible within n steps",
    ],
    approach:
      "Compute the net adjustment delta[i] = target[i] - initial[i]. Assets needing increase have delta > 0, needing decrease have delta < 0. Each step pairs one increase-asset with one decrease-asset. Use multinomial coefficient logic: count distinct orderings of the required increase operations and decrease operations, then multiply by the number of ways to interleave them at each step. A cleaner DP tracks the remaining adjustments state at each step.",
    code: `from math import factorial
from functools import reduce

MOD = 10**9 + 7

def count_rebalancing_paths(
    initial: list[int], target: list[int], n: int
) -> int:
    A = len(initial)
    delta = [target[i] - initial[i] for i in range(A)]

    # Number of times we must increase each asset
    increases = {i: d for i, d in enumerate(delta) if d > 0}
    decreases = {i: -d for i, d in enumerate(delta) if d < 0}

    total_ops = sum(increases.values())  # == sum(decreases.values())
    assert total_ops <= n, "Cannot reach target in n steps"

    # Each step: pick one (inc_asset, dec_asset) pair
    # Ways to arrange the sequence of n steps:
    # - Choose n positions for inc/dec ops (multinomial of inc counts)
    # - Multiply by multinomial for dec counts
    # - Multiply by C(n, total_ops)^... (but we need exact step assignment)
    # Simplified: multinomial ways to order increases * ways to order decreases
    # then pair them step by step (each step is one inc + one dec)

    def multinomial(total: int, counts: list[int]) -> int:
        result = factorial(total)
        for c in counts:
            result //= factorial(c)
        return result % MOD

    ways_inc = multinomial(total_ops, list(increases.values()))
    ways_dec = multinomial(total_ops, list(decreases.values()))

    # Remaining n - total_ops steps are free (no-op pairs: same asset inc+dec)
    # For simplicity assume n == total_ops (pure rebalancing, no wasteful steps)
    # General case: C(n, total_ops) ways to choose which steps are real ops
    from math import comb
    step_choice = comb(n, total_ops) % MOD

    return (ways_inc * ways_dec % MOD) * step_choice % MOD

# Examples
print(count_rebalancing_paths([3, 1], [1, 3], 2))    # 1
print(count_rebalancing_paths([2, 1, 1], [1, 2, 1], 1))  # 1`,
    language: "python",
    complexity: { time: "O(A + n)", space: "O(A)" },
  },
  {
    id: "fin-20260715-b1-min-cost-hedge-dijkstra",
    title: "Minimum Cost Hedge via Shortest Path",
    difficulty: "hard",
    topics: ["graph", "dijkstra", "shortest-path"],
    problem:
      "A risk manager has N instruments and M possible hedging trades. Each hedging trade (u, v, cost) reduces exposure from instrument u to instrument v at a given transaction cost. Starting from an unhedged instrument src, find the minimum total cost path to reach a fully hedged state represented by instrument dst. Model as a directed weighted graph and run Dijkstra.",
    examples: [
      {
        input:
          "N=4, trades=[(0,1,2),(0,2,6),(1,3,5),(1,2,1),(2,3,3)], src=0, dst=3",
        output: "6",
        explanation:
          "Cheapest path: 0->1 (cost 2) -> 2 (cost 1) -> 3 (cost 3) = 6.",
      },
    ],
    constraints: [
      "2 <= N <= 10^4",
      "1 <= M <= 5 × 10^4",
      "0 <= cost <= 10^6",
    ],
    approach:
      "Build an adjacency list. Run Dijkstra from src: use a min-heap of (total_cost, node). Relax edges and update dist[]. Return dist[dst].",
    code: `import heapq

def min_hedge_cost(
    n: int,
    trades: list[tuple[int, int, int]],
    src: int,
    dst: int,
) -> int:
    # Build adjacency list
    adj: list[list[tuple[int, int]]] = [[] for _ in range(n)]
    for u, v, cost in trades:
        adj[u].append((v, cost))

    INF = float("inf")
    dist = [INF] * n
    dist[src] = 0
    heap: list[tuple[float, int]] = [(0, src)]

    while heap:
        d, u = heapq.heappop(heap)
        if d > dist[u]:
            continue
        for v, w in adj[u]:
            nd = dist[u] + w
            if nd < dist[v]:
                dist[v] = nd
                heapq.heappush(heap, (nd, v))

    return int(dist[dst]) if dist[dst] < INF else -1

# Example
trades = [(0, 1, 2), (0, 2, 6), (1, 3, 5), (1, 2, 1), (2, 3, 3)]
print(min_hedge_cost(4, trades, 0, 3))   # 6`,
    language: "python",
    complexity: {
      time: "O((N + M) log N)",
      space: "O(N + M)",
    },
    leetcodeNumber: 743,
  },
];
