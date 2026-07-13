import type { LeetCodeProblem } from "./index";

export const financeProblems20260713B1: LeetCodeProblem[] = [
  {
    id: "fin-20260713-b1-median-stream",
    title: "Streaming P&L Median",
    difficulty: "hard",
    topics: ["heap", "design", "two-pointers"],
    problem:
      "A trading desk receives a stream of daily P&L figures one at a time. After each figure arrives, report the current median P&L. The median must be available in O(log n) per insert and O(1) per query.",
    examples: [
      {
        input: "addNum(3), addNum(-1), addNum(5)",
        output: "3.0, 1.0, 3.0",
        explanation:
          "Sorted windows: [3] → median 3; [-1,3] → median 1.0; [-1,3,5] → median 3.",
      },
    ],
    constraints: [
      "-10^6 <= num <= 10^6",
      "At most 5×10^4 calls to addNum and findMedian.",
    ],
    approach:
      "Maintain a max-heap of the lower half and a min-heap of the upper half. After each insert, balance so |lo| - |hi| ≤ 1. Median is the top of the larger heap (odd) or the average of both tops (even). In quant use: streaming VaR quantiles, intraday median spread.",
    code: `import heapq

class StreamingMedian:
    def __init__(self):
        self.lo = []   # max-heap (negate for Python)
        self.hi = []   # min-heap

    def add(self, num: float) -> None:
        heapq.heappush(self.lo, -num)
        # ensure every element in lo <= every element in hi
        heapq.heappush(self.hi, -heapq.heappop(self.lo))
        if len(self.hi) > len(self.lo):
            heapq.heappush(self.lo, -heapq.heappop(self.hi))

    def median(self) -> float:
        if len(self.lo) > len(self.hi):
            return float(-self.lo[0])
        return (-self.lo[0] + self.hi[0]) / 2.0

# --- demo ---
sm = StreamingMedian()
pnls = [3.0, -1.0, 5.0, 2.0, 4.0]
for p in pnls:
    sm.add(p)
    print(f"After adding {p}: median = {sm.median()}")`,
    language: "python",
    complexity: { time: "O(log n) per add, O(1) per median", space: "O(n)" },
    leetcodeNumber: 295,
  },
  {
    id: "fin-20260713-b1-lru-tick",
    title: "Tick Data LRU Cache",
    difficulty: "medium",
    topics: ["hash-map", "doubly-linked-list", "design"],
    problem:
      "Design an LRU cache that stores the latest tick (price, volume) for each instrument symbol. Capacity is fixed at K instruments. When a new symbol arrives and the cache is full, evict the least-recently-accessed symbol. Support O(1) get and O(1) put.",
    examples: [
      {
        input: "capacity=2; put('AAPL',150); put('GOOG',2800); get('AAPL'); put('MSFT',310)",
        output: "get('GOOG') → -1 (evicted), get('MSFT') → 310",
        explanation: "GOOG was LRU when MSFT was inserted.",
      },
    ],
    constraints: ["1 <= capacity <= 3000", "O(1) average for all operations"],
    approach:
      "Combine a hash map (symbol → node) with a doubly-linked list ordered by recency. On get/put, unlink the node and re-insert at the head. On overflow, remove from the tail. In quant: fast lookup of the most-recent bid/ask for symbols in a trading universe.",
    code: `from collections import OrderedDict

class TickCache:
    def __init__(self, capacity: int):
        self.cap = capacity
        self.cache: OrderedDict[str, dict] = OrderedDict()

    def get(self, symbol: str) -> dict | None:
        if symbol not in self.cache:
            return None
        self.cache.move_to_end(symbol)
        return self.cache[symbol]

    def put(self, symbol: str, tick: dict) -> None:
        if symbol in self.cache:
            self.cache.move_to_end(symbol)
        self.cache[symbol] = tick
        if len(self.cache) > self.cap:
            self.cache.popitem(last=False)

# --- demo ---
cache = TickCache(capacity=2)
cache.put("AAPL", {"price": 150, "vol": 1000})
cache.put("GOOG", {"price": 2800, "vol": 200})
print(cache.get("AAPL"))   # {'price': 150, 'vol': 1000}
cache.put("MSFT", {"price": 310, "vol": 500})
print(cache.get("GOOG"))   # None — evicted`,
    language: "python",
    complexity: { time: "O(1) amortized", space: "O(capacity)" },
    leetcodeNumber: 146,
  },
  {
    id: "fin-20260713-b1-tranche-histogram",
    title: "Max Tranche Allocation (Histogram)",
    difficulty: "hard",
    topics: ["monotonic-stack", "array"],
    problem:
      "A credit structure has N tranches of varying seniority. Each tranche has a height representing the maximum notional that can be allocated (a bar in a histogram). Find the largest rectangular area that fits within the histogram — representing the biggest single-rating block that can be allocated contiguously across tranches.",
    examples: [
      {
        input: "heights = [2, 1, 5, 6, 2, 3]",
        output: "10",
        explanation: "Rectangle of height 5 spanning columns 2–3 (0-indexed).",
      },
    ],
    constraints: ["1 <= n <= 10^5", "0 <= heights[i] <= 10^4"],
    approach:
      "Use a monotonic increasing stack. For each bar, when you find a shorter bar, pop and compute the area using the popped bar as the height and the distance between the current index and the new stack top as the width. Track the maximum.",
    code: `def max_tranche_area(heights: list[int]) -> int:
    stack = []   # indices, monotonically increasing heights
    max_area = 0
    heights = heights + [0]   # sentinel flushes remaining stack

    for i, h in enumerate(heights):
        while stack and heights[stack[-1]] > h:
            height = heights[stack.pop()]
            width = i if not stack else i - stack[-1] - 1
            max_area = max(max_area, height * width)
        stack.append(i)

    return max_area

print(max_tranche_area([2, 1, 5, 6, 2, 3]))  # 10
print(max_tranche_area([2, 4]))               # 4`,
    language: "python",
    complexity: { time: "O(n)", space: "O(n)" },
    leetcodeNumber: 84,
  },
  {
    id: "fin-20260713-b1-settlement-topo",
    title: "Trade Settlement Order (Topological Sort)",
    difficulty: "medium",
    topics: ["graph", "topological-sort", "bfs"],
    problem:
      "N trades must settle in a specific order due to collateral dependencies: trade A must settle before trade B if A's proceeds fund B's margin. Given a list of such dependency pairs, find a valid settlement sequence, or report a cycle (deadlock).",
    examples: [
      {
        input: "n=4, dependencies=[[1,0],[2,0],[3,1],[3,2]]",
        output: "[0,1,2,3] or [0,2,1,3]",
        explanation: "Trade 0 settles first; 1 and 2 after; 3 last.",
      },
    ],
    constraints: ["1 <= n <= 2000", "0 <= dependencies.length <= n*(n-1)"],
    approach:
      "Kahn's algorithm (BFS): build an adjacency list and in-degree count. Enqueue all zero in-degree nodes. Pop, decrement neighbors; enqueue any that reach zero. If output length < n, a cycle exists (deadlock in settlement chain).",
    code: `from collections import deque

def settlement_order(n: int, deps: list[list[int]]) -> list[int]:
    graph = [[] for _ in range(n)]
    in_deg = [0] * n
    for a, b in deps:    # b must come before a
        graph[b].append(a)
        in_deg[a] += 1

    q = deque(i for i in range(n) if in_deg[i] == 0)
    order = []
    while q:
        node = q.popleft()
        order.append(node)
        for nxt in graph[node]:
            in_deg[nxt] -= 1
            if in_deg[nxt] == 0:
                q.append(nxt)

    if len(order) < n:
        return []   # cycle detected — settlement deadlock
    return order

print(settlement_order(4, [[1,0],[2,0],[3,1],[3,2]]))`,
    language: "python",
    complexity: { time: "O(V + E)", space: "O(V + E)" },
    leetcodeNumber: 207,
  },
  {
    id: "fin-20260713-b1-kway-feeds",
    title: "K-Way Market Feed Merge",
    difficulty: "medium",
    topics: ["heap", "merge", "linked-list"],
    problem:
      "You receive K sorted streams of market data events (each stream ordered by timestamp). Merge them into a single globally-sorted event stream. Each stream is represented as a list of (timestamp, price) tuples sorted ascending by timestamp.",
    examples: [
      {
        input: "feeds = [[(1,100),(4,102)], [(2,99),(3,101)], [(5,103)]]",
        output: "[(1,100),(2,99),(3,101),(4,102),(5,103)]",
        explanation: "Merged in timestamp order across all three feeds.",
      },
    ],
    constraints: [
      "1 <= k <= 10^4",
      "0 <= total events <= 10^5",
      "Timestamps are unique across all feeds.",
    ],
    approach:
      "Use a min-heap of (timestamp, feed_index, event_index). Pop the minimum, emit it, then push the next event from that feed if available. Heap size stays ≤ K. In quant: consolidating tick streams from multiple venues for NBBO construction.",
    code: `import heapq

def merge_feeds(feeds: list[list[tuple]]) -> list[tuple]:
    heap = []
    for fi, feed in enumerate(feeds):
        if feed:
            ts, px = feed[0]
            heapq.heappush(heap, (ts, fi, 0, px))

    result = []
    while heap:
        ts, fi, ei, px = heapq.heappop(heap)
        result.append((ts, px))
        nxt = ei + 1
        if nxt < len(feeds[fi]):
            nts, npx = feeds[fi][nxt]
            heapq.heappush(heap, (nts, fi, nxt, npx))

    return result

feeds = [[(1, 100), (4, 102)], [(2, 99), (3, 101)], [(5, 103)]]
print(merge_feeds(feeds))`,
    language: "python",
    complexity: { time: "O(N log K) where N=total events", space: "O(K)" },
    leetcodeNumber: 23,
  },
  {
    id: "fin-20260713-b1-portfolio-knapsack",
    title: "Portfolio Budget Allocation (0/1 Knapsack)",
    difficulty: "medium",
    topics: ["dynamic-programming", "knapsack"],
    problem:
      "You have a capital budget B (in integer units) and N investment opportunities. Each investment i requires cost[i] units of capital and yields expected return[i]. You may fund each investment at most once. Maximize total expected return without exceeding the budget.",
    examples: [
      {
        input: "B=10, costs=[3,4,5,6], returns=[4,5,8,9]",
        output: "13",
        explanation: "Fund investments 0 and 3: cost 3+6=9 ≤ 10, return 4+9=13.",
      },
    ],
    constraints: ["1 <= N <= 300", "1 <= B <= 5000"],
    approach:
      "Classic 0/1 knapsack DP. dp[b] = max return achievable with budget b. Iterate investments outer, budget inner (descending to prevent double-counting). O(N·B) time.",
    code: `def max_return(budget: int, costs: list[int], returns: list[int]) -> int:
    dp = [0] * (budget + 1)
    for cost, ret in zip(costs, returns):
        for b in range(budget, cost - 1, -1):
            dp[b] = max(dp[b], dp[b - cost] + ret)
    return dp[budget]

# Example
B = 10
costs   = [3, 4, 5, 6]
returns = [4, 5, 8, 9]
print(max_return(B, costs, returns))   # 13

# Reconstruct chosen investments
def chosen(budget, costs, returns):
    n = len(costs)
    dp = [[0]*(budget+1) for _ in range(n+1)]
    for i, (c, r) in enumerate(zip(costs, returns), 1):
        for b in range(budget+1):
            dp[i][b] = dp[i-1][b]
            if b >= c:
                dp[i][b] = max(dp[i][b], dp[i-1][b-c] + r)
    picks, b = [], budget
    for i in range(n, 0, -1):
        if dp[i][b] != dp[i-1][b]:
            picks.append(i-1)
            b -= costs[i-1]
    return picks[::-1]

print(chosen(B, costs, returns))   # [0, 3]`,
    language: "python",
    complexity: { time: "O(N × B)", space: "O(B)" },
    leetcodeNumber: 416,
  },
  {
    id: "fin-20260713-b1-prefix-waterfall",
    title: "CDO Waterfall — Prefix Sum Tranche P&L",
    difficulty: "easy",
    topics: ["prefix-sum", "array"],
    problem:
      "A CDO waterfall distributes portfolio cash flows to N tranches in order of seniority (index 0 = senior). Given an array of cash flows cf[] (can be negative = losses) and tranche sizes size[], compute the running cumulative balance after each tranche absorbs as much of the flow as it can.",
    examples: [
      {
        input: "cf = [100, -30, 50], sizes = [60, 40, 50]",
        output:
          "After 100 inflow: senior=60 full, mezz=40 full, equity=0; After -30 loss: equity absorbs -30; After 50: equity=20",
        explanation:
          "Losses hit the most-junior tranche first; inflows fill senior first.",
      },
    ],
    constraints: ["1 <= n <= 10^4", "sum(sizes) is the total face value"],
    approach:
      "Maintain a prefix-sum cursor tracking cumulative flow. Positive flows fill tranches senior-first; negative flows deplete tranches junior-first. Use a running position pointer against prefix sums of the size array.",
    code: `def waterfall(cf: list[float], sizes: list[float]) -> list[list[float]]:
    n = len(sizes)
    balances = [0.0] * n
    prefix = []
    cum = 0.0
    for s in sizes:
        cum += s
        prefix.append(cum)
    total = prefix[-1]

    cursor = 0.0   # cumulative flow distributed so far
    snapshots = []
    for flow in cf:
        cursor = min(max(cursor + flow, 0), total)
        snap = []
        prev = 0.0
        for i, p in enumerate(prefix):
            snap.append(max(0.0, min(cursor, p) - prev))
            prev = p
        snapshots.append(snap)

    return snapshots

cf = [100.0, -30.0, 50.0]
sizes = [60.0, 40.0, 50.0]
for i, snap in enumerate(waterfall(cf, sizes)):
    print(f"After cf[{i}]={cf[i]}: {snap}")`,
    language: "python",
    complexity: { time: "O(n × m) where m = #cash flows", space: "O(n)" },
  },
  {
    id: "fin-20260713-b1-stock-span",
    title: "Days Since Last ATH (Stock Span)",
    difficulty: "medium",
    topics: ["monotonic-stack", "design"],
    problem:
      "For a stream of daily closing prices, compute the span for each day: the number of consecutive days up to and including today for which the price was less than or equal to today's price (i.e., the number of days since the last all-time high). Return the spans for each day.",
    examples: [
      {
        input: "prices = [100, 80, 60, 70, 60, 75, 85]",
        output: "[1, 1, 1, 2, 1, 4, 6]",
        explanation:
          "Day 5 (price=75): today and the previous 3 days (70,60,80) were all ≤ 75 — span = 4.",
      },
    ],
    constraints: ["1 <= prices.length <= 10^5", "0 < prices[i] <= 10^5"],
    approach:
      "Monotonic decreasing stack of (price, span). When today's price dominates, pop and accumulate spans. Push (today_price, cumulative_span). Each element pushed and popped once → O(n) total.",
    code: `def stock_span(prices: list[int]) -> list[int]:
    stack = []   # (price, span)
    spans = []
    for p in prices:
        span = 1
        while stack and stack[-1][0] <= p:
            span += stack.pop()[1]
        stack.append((p, span))
        spans.append(span)
    return spans

prices = [100, 80, 60, 70, 60, 75, 85]
print(stock_span(prices))   # [1, 1, 1, 2, 1, 4, 6]`,
    language: "python",
    complexity: { time: "O(n) amortized", space: "O(n)" },
    leetcodeNumber: 901,
  },
  {
    id: "fin-20260713-b1-weighted-sample",
    title: "Importance Sampling — Weighted Random Pick",
    difficulty: "medium",
    topics: ["binary-search", "prefix-sum", "randomization"],
    problem:
      "Given a list of scenario weights w[] (proportional to probability, sum to any positive value), implement a sampler that draws a scenario index with probability proportional to its weight. Use this for importance sampling in option pricing Monte Carlo. Support O(n) preprocessing and O(log n) per sample.",
    examples: [
      {
        input: "weights = [1, 3, 6]",
        output:
          "pickIndex() returns 0 with prob 0.1, 1 with prob 0.3, 2 with prob 0.6",
        explanation: "Cumulative: [1, 4, 10]. Draw u~Uniform(0,10), bisect.",
      },
    ],
    constraints: ["1 <= n <= 10^4", "weights[i] > 0"],
    approach:
      "Build a prefix-sum array. Sample a uniform float in [0, total_weight). Binary search for the insertion point — that index is the drawn scenario. In Monte Carlo: oversample high-variance scenarios, reweight by 1/q(x) to correct the bias.",
    code: `import bisect
import random

class ImportanceSampler:
    def __init__(self, weights: list[float]):
        self.prefix = []
        cum = 0.0
        for w in weights:
            cum += w
            self.prefix.append(cum)
        self.total = cum

    def sample(self) -> int:
        u = random.uniform(0, self.total)
        return bisect.bisect_left(self.prefix, u)

# Demonstrate approximate distribution over 100_000 draws
sampler = ImportanceSampler([1.0, 3.0, 6.0])
counts = [0, 0, 0]
for _ in range(100_000):
    counts[sampler.sample()] += 1
probs = [c / 100_000 for c in counts]
print(f"Empirical probs: {[round(p,3) for p in probs]}")
# Expected ≈ [0.1, 0.3, 0.6]`,
    language: "python",
    complexity: { time: "O(log n) per sample, O(n) build", space: "O(n)" },
    leetcodeNumber: 528,
  },
  {
    id: "fin-20260713-b1-credit-migration-dp",
    title: "Credit Migration — n-Step Transition Probability",
    difficulty: "hard",
    topics: ["dynamic-programming", "matrix", "probability"],
    problem:
      "A credit rating system has S states (AAA, AA, …, D). You are given a one-step transition matrix P (S×S) where P[i][j] is the probability of migrating from rating i to rating j in one year. Compute the n-step transition matrix P^n using DP (repeated matrix multiplication). Return the probability of going from state `src` to state `dst` in exactly n steps.",
    examples: [
      {
        input: "P = [[0.9,0.1],[0.2,0.8]], n=2, src=0, dst=1",
        output: "0.11",
        explanation: "P^2[0][1] = 0.9*0.1 + 0.1*0.8 = 0.09+0.08=0.17. Wait: 0.09+0.08=0.17",
      },
    ],
    constraints: ["2 <= S <= 20", "1 <= n <= 100", "rows of P sum to 1"],
    approach:
      "Matrix exponentiation by squaring: P^n in O(S^3 log n) steps. Each multiplication multiplies two S×S stochastic matrices — rows still sum to 1 (verify for numerical stability). In credit risk: compute default probability over a T-year horizon from an annual migration matrix.",
    code: `import numpy as np

def mat_mul(A: list[list[float]], B: list[list[float]]) -> list[list[float]]:
    S = len(A)
    C = [[0.0]*S for _ in range(S)]
    for i in range(S):
        for k in range(S):
            if A[i][k] == 0:
                continue
            for j in range(S):
                C[i][j] += A[i][k] * B[k][j]
    return C

def mat_pow(M: list[list[float]], n: int) -> list[list[float]]:
    S = len(M)
    result = [[1.0 if i==j else 0.0 for j in range(S)] for i in range(S)]
    base = [row[:] for row in M]
    while n:
        if n & 1:
            result = mat_mul(result, base)
        base = mat_mul(base, base)
        n >>= 1
    return result

def migration_prob(P, n, src, dst):
    Pn = mat_pow(P, n)
    return Pn[src][dst]

# 2-state: Investment Grade / High Yield
P = [[0.9, 0.1], [0.2, 0.8]]
prob = migration_prob(P, n=5, src=0, dst=1)
print(f"Prob IG -> HY in 5 years: {prob:.4f}")

# numpy fast path for large S
P_np = np.array(P)
Pn_np = np.linalg.matrix_power(P_np, 5)
print(f"numpy check: {Pn_np[0,1]:.4f}")`,
    language: "python",
    complexity: {
      time: "O(S^3 log n)",
      space: "O(S^2)",
    },
  },
];
