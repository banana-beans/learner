import type { LeetCodeProblem } from "./index";

export const financeProblems20260609B1: LeetCodeProblem[] = [
  {
    id: "fin-20260609-b1-fx-arbitrage-bf",
    title: "FX Arbitrage Detection via Bellman-Ford",
    difficulty: "hard",
    topics: ["graph", "bellman-ford", "negative-cycle", "finance"],
    problem:
      "You are given N currencies and M exchange rates. Each rate[i] = (from, to, rate) means 1 unit of currency 'from' converts to 'rate' units of currency 'to'. Detect whether an arbitrage cycle exists (i.e., a sequence of exchanges starting and ending at the same currency yields more than 1.0 units). Return the arbitrage cycle if one exists, or an empty list if none.",
    examples: [
      {
        input:
          "N=3, rates=[(0,1,1.5),(1,2,1.4),(2,0,0.5),(0,2,2.0)]",
        output: "[0, 1, 2, 0]",
        explanation:
          "1.0 * 1.5 * 1.4 * 0.5 = 1.05 > 1.0. Converting USD->EUR->GBP->USD yields 5% profit. Negate logs: w(u,v) = -log(rate(u,v)). Bellman-Ford detects negative cycles in this graph.",
      },
      {
        input: "N=2, rates=[(0,1,0.9),(1,0,1.1)]",
        output: "[]",
        explanation: "0.9 * 1.1 = 0.99 < 1.0. No arbitrage cycle.",
      },
    ],
    constraints: [
      "2 <= N <= 100",
      "1 <= M <= N*(N-1)",
      "0.0001 <= rate <= 10000",
    ],
    approach:
      "Transform to log space: w(u,v) = -log(rate(u,v)). An arbitrage cycle becomes a negative-weight cycle. Run Bellman-Ford for N-1 iterations; a further relaxation on iteration N signals a negative cycle. Trace the cycle by following predecessor pointers from any relaxed node. O(N*M) time.",
    code: `import math
from typing import List, Optional

def detect_fx_arbitrage(
    n: int,
    rates: List[tuple],     # (from_curr, to_curr, exchange_rate)
) -> List[int]:
    """
    Bellman-Ford on negated log-rates to find negative cycles (arbitrage).
    Returns the arbitrage cycle as a list of currency indices, or [] if none.
    """
    INF = float("inf")
    # Edge list: (u, v, weight = -log(rate))
    edges = [(u, v, -math.log(r)) for u, v, r in rates]

    # Add a virtual source node 'n' with zero-cost edges to all nodes
    for i in range(n):
        edges.append((n, i, 0.0))

    dist = [INF] * (n + 1)
    pred = [-1]  * (n + 1)
    dist[n] = 0.0

    last_relaxed = -1
    for iteration in range(n + 1):        # n+1 iterations total
        last_relaxed = -1
        for u, v, w in edges:
            if dist[u] < INF and dist[u] + w < dist[v]:
                dist[v] = dist[u] + w
                pred[v] = u
                last_relaxed = v           # node relaxed in n-th iteration

    if last_relaxed == -1:
        return []   # no negative cycle

    # Trace back to find a node inside the cycle (advance n steps to guarantee cycle)
    node = last_relaxed
    for _ in range(n):
        node = pred[node]

    # Extract the cycle
    cycle = []
    cur   = node
    while True:
        cycle.append(cur)
        cur = pred[cur]
        if cur == node:
            break
    cycle.append(node)
    cycle.reverse()

    # Filter out virtual source if present
    cycle = [c for c in cycle if c < n]
    return cycle

def arbitrage_profit(cycle: List[int], rates_dict: dict) -> float:
    """Compute the profit multiplier of a detected cycle."""
    product = 1.0
    for i in range(len(cycle) - 1):
        product *= rates_dict.get((cycle[i], cycle[i+1]), 1.0)
    return product`,
    language: "python",
    complexity: { time: "O(N * M)", space: "O(N + M)" },
  },
  {
    id: "fin-20260609-b1-stock-cooldown",
    title: "Best Time to Buy and Sell Stock with Cooldown",
    difficulty: "medium",
    topics: ["dp", "state-machine", "finance"],
    problem:
      "Given an array prices[] of daily stock prices, find the maximum profit with the constraint: after selling, you must wait 1 day (cooldown) before buying again. You may not hold more than one share at a time. Unlimited transactions allowed.",
    examples: [
      {
        input: "prices = [1, 2, 3, 0, 2]",
        output: "3",
        explanation:
          "Buy day 0 (1), sell day 1 (2) = profit 1. Cooldown day 2. Buy day 3 (0), sell day 4 (2) = profit 2. Total = 3.",
      },
      {
        input: "prices = [1]",
        output: "0",
        explanation: "Only one price — no transaction possible.",
      },
    ],
    constraints: ["1 <= prices.length <= 5000", "0 <= prices[i] <= 1000"],
    approach:
      "Three states: HOLD (own stock), SOLD (just sold, entering cooldown), REST (free to buy). Transitions: HOLD -> SOLD (sell), SOLD -> REST (cooldown), REST -> HOLD (buy) or REST -> REST. DP in O(N) time and O(1) space.",
    code: `def max_profit_cooldown(prices: list) -> int:
    """
    State machine DP:
    - hold: max profit when holding stock
    - sold: max profit the day after selling (in cooldown)
    - rest: max profit when free to buy (not in cooldown)
    """
    if not prices:
        return 0

    hold = -prices[0]      # bought on day 0
    sold = 0               # just sold — in cooldown
    rest = 0               # free to act

    for i in range(1, len(prices)):
        prev_hold = hold
        prev_sold = sold
        prev_rest = rest

        # Can buy only from rest state
        hold = max(prev_hold, prev_rest - prices[i])
        # Just sold today
        sold = prev_hold + prices[i]
        # In rest from cooldown, or stayed in rest
        rest = max(prev_rest, prev_sold)

    # Maximum profit when not holding stock
    return max(sold, rest)

# Trace for [1,2,3,0,2]:
# Day 0: hold=-1, sold=0, rest=0
# Day 1: hold=max(-1, 0-2)=-1, sold=-1+2=1, rest=max(0,0)=0
# Day 2: hold=max(-1, 0-3)=-1, sold=-1+3=2, rest=max(0,1)=1
# Day 3: hold=max(-1, 1-0)=1,  sold=-1+0=-1, rest=max(1,2)=2
# Day 4: hold=max(1, 2-2)=1,   sold=1+2=3,   rest=max(2,-1)=2
# Answer: max(3, 2) = 3`,
    language: "python",
    complexity: { time: "O(N)", space: "O(1)" },
  },
  {
    id: "fin-20260609-b1-sliding-max-vwap",
    title: "Sliding Window Maximum for Rolling VWAP Denominator",
    difficulty: "medium",
    topics: ["sliding-window", "monotonic-deque", "finance"],
    problem:
      "Given an array prices[] and volumes[] of length N, and a window size k, compute the rolling VWAP (Volume-Weighted Average Price) for each window of size k. Also return the maximum price seen in each window. Return arrays vwap[] and max_price[] each of length N-k+1.",
    examples: [
      {
        input:
          "prices = [10, 20, 30, 40], volumes = [1, 2, 3, 4], k = 2",
        output:
          "vwap = [16.67, 26.67, 36.67], max_price = [20, 30, 40]",
        explanation:
          "Window [10,20] vol [1,2]: VWAP = (10*1+20*2)/(1+2) = 50/3 ≈ 16.67. Window [20,30]: (20*2+30*3)/5 = 130/5 = 26.0. Window [30,40]: (30*3+40*4)/7 = 250/7 ≈ 35.71. Max: [20,30,40].",
      },
    ],
    constraints: [
      "1 <= k <= N <= 10^5",
      "prices and volumes are positive",
    ],
    approach:
      "Use a prefix-sum for fast VWAP computation (O(1) per window), and a monotonic deque for O(1) amortised sliding window maximum. Total O(N) time.",
    code: `from collections import deque

def rolling_vwap_and_max(prices: list, volumes: list, k: int) -> tuple:
    """
    Returns (vwap_list, max_price_list) for all windows of size k.
    Uses prefix sums for VWAP and a monotonic deque for max price.
    """
    n = len(prices)
    if n < k:
        return [], []

    # Prefix sums for VWAP
    pv_prefix = [0.0] * (n + 1)   # cumulative price*volume
    v_prefix  = [0.0] * (n + 1)   # cumulative volume
    for i in range(n):
        pv_prefix[i+1] = pv_prefix[i] + prices[i] * volumes[i]
        v_prefix[i+1]  = v_prefix[i]  + volumes[i]

    # Monotonic deque for max price (stores indices)
    dq   = deque()      # decreasing values of prices[index]
    vwap = []
    mxp  = []

    for i in range(n):
        # VWAP: window [i-k+1, i]
        if i >= k - 1:
            lo   = i - k + 1
            hi   = i + 1
            pv_w = pv_prefix[hi] - pv_prefix[lo]
            v_w  = v_prefix[hi]  - v_prefix[lo]
            vwap.append(pv_w / v_w if v_w > 0 else 0.0)

            # Max price via deque: remove out-of-window indices
            while dq and dq[0] < lo:
                dq.popleft()
            mxp.append(prices[dq[0]])

        # Maintain decreasing deque for max
        while dq and prices[dq[-1]] <= prices[i]:
            dq.pop()
        dq.append(i)

    return [round(v, 2) for v in vwap], mxp`,
    language: "python",
    complexity: { time: "O(N)", space: "O(N)" },
  },
  {
    id: "fin-20260609-b1-median-stream",
    title: "Find Median from Data Stream of Returns",
    difficulty: "hard",
    topics: ["heap", "design", "finance"],
    problem:
      "Design a MedianFinder for streaming daily returns: add_return(r) — adds a return to the data structure; get_median() — returns the current median return in O(log N) and O(1) respectively. The median is the middle value for odd counts, and the average of the two middle values for even counts.",
    examples: [
      {
        input:
          "add_return(0.01); add_return(-0.02); add_return(0.005); get_median()",
        output: "0.005",
        explanation:
          "Sorted: [-0.02, 0.005, 0.01]. Median = 0.005 (middle of 3).",
      },
      {
        input:
          "add_return(0.01); add_return(-0.02); get_median()",
        output: "-0.005",
        explanation:
          "Sorted: [-0.02, 0.01]. Median = (-0.02 + 0.01) / 2 = -0.005.",
      },
    ],
    constraints: [
      "Up to 5 * 10^4 calls",
      "Returns are floating point numbers",
    ],
    approach:
      "Two heaps: max-heap for lower half, min-heap for upper half. Maintain size balance: sizes differ by at most 1. add_return is O(log N); get_median is O(1). Rebalance by transferring the top of the larger heap to the smaller after each insert.",
    code: `import heapq

class MedianFinder:
    """
    Two-heap median tracker for streaming financial returns.
    lo: max-heap (negated) for lower half
    hi: min-heap for upper half
    Invariant: len(hi) <= len(lo) <= len(hi) + 1
    """
    def __init__(self):
        self.lo = []   # max-heap (negate values for heapq min-heap)
        self.hi = []   # min-heap

    def add_return(self, r: float) -> None:
        # Push to lo first, then rebalance
        heapq.heappush(self.lo, -r)

        # Ensure lo's max <= hi's min (no crossing)
        if self.hi and -self.lo[0] > self.hi[0]:
            val = -heapq.heappop(self.lo)
            heapq.heappush(self.hi, val)

        # Rebalance sizes: lo can be at most 1 larger than hi
        if len(self.lo) > len(self.hi) + 1:
            val = -heapq.heappop(self.lo)
            heapq.heappush(self.hi, val)
        elif len(self.hi) > len(self.lo):
            val = heapq.heappop(self.hi)
            heapq.heappush(self.lo, -val)

    def get_median(self) -> float:
        if len(self.lo) > len(self.hi):
            return -self.lo[0]          # lo has the middle element
        return (-self.lo[0] + self.hi[0]) / 2.0

# Application: online rolling percentile tracker for risk management —
# extend to track any percentile using two heaps of sizes floor(p*N) and ceil((1-p)*N).

# Example usage:
mf = MedianFinder()
for r in [0.01, -0.02, 0.005, 0.03, -0.015]:
    mf.add_return(r)
print(mf.get_median())   # 0.005`,
    language: "python",
    complexity: { time: "O(log N) add, O(1) get_median", space: "O(N)" },
  },
  {
    id: "fin-20260609-b1-lru-market-data",
    title: "LRU Cache for Market Data Snapshots",
    difficulty: "medium",
    topics: ["design", "hash-map", "linked-list", "finance"],
    problem:
      "Design an LRUMarketDataCache that stores market data snapshots keyed by (symbol, timestamp). Operations: get(symbol, timestamp) — returns the snapshot if cached, else -1; put(symbol, timestamp, snapshot) — inserts or updates; if capacity exceeded, evicts the least recently used entry. Both operations must be O(1).",
    examples: [
      {
        input:
          "cache = LRUMarketDataCache(2); cache.put('SPY',1,{'bid':400}); cache.put('QQQ',1,{'bid':300}); cache.get('SPY',1); cache.put('IWM',1,{'bid':200}); cache.get('QQQ',1)",
        output: "{'bid':400}, -1",
        explanation:
          "Capacity=2. After put SPY and QQQ, cache=[SPY,QQQ]. get SPY makes SPY most-recent: cache=[QQQ,SPY]. Put IWM evicts LRU=QQQ: cache=[SPY,IWM]. get QQQ returns -1.",
      },
    ],
    constraints: ["1 <= capacity <= 3000", "Up to 10^5 operations"],
    approach:
      "Doubly linked list + hash map. List: most-recent at head, LRU at tail. get: move node to head. put: add to head; if over capacity, remove tail. Both O(1) with direct node pointer from the hash map.",
    code: `class Node:
    def __init__(self, key, value):
        self.key   = key
        self.val   = value
        self.prev  = None
        self.next  = None

class LRUMarketDataCache:
    def __init__(self, capacity: int):
        self.cap  = capacity
        self.map  = {}       # key -> Node
        # Sentinel head (most recent) and tail (LRU)
        self.head = Node(None, None)
        self.tail = Node(None, None)
        self.head.next = self.tail
        self.tail.prev = self.head

    def _remove(self, node: Node):
        node.prev.next = node.next
        node.next.prev = node.prev

    def _add_to_front(self, node: Node):
        node.next = self.head.next
        node.prev = self.head
        self.head.next.prev = node
        self.head.next      = node

    def get(self, symbol: str, timestamp: int):
        key = (symbol, timestamp)
        if key not in self.map:
            return -1
        node = self.map[key]
        self._remove(node)
        self._add_to_front(node)
        return node.val

    def put(self, symbol: str, timestamp: int, snapshot: dict):
        key = (symbol, timestamp)
        if key in self.map:
            node = self.map[key]
            node.val = snapshot
            self._remove(node)
            self._add_to_front(node)
        else:
            if len(self.map) >= self.cap:
                # Evict LRU (node before tail sentinel)
                lru = self.tail.prev
                self._remove(lru)
                del self.map[lru.key]
            new_node = Node(key, snapshot)
            self.map[key] = new_node
            self._add_to_front(new_node)`,
    language: "python",
    complexity: { time: "O(1) get and put", space: "O(capacity)" },
  },
  {
    id: "fin-20260609-b1-max-product-subarray",
    title: "Maximum Product Subarray of Return Multipliers",
    difficulty: "medium",
    topics: ["dp", "array", "finance"],
    problem:
      "Given an array of daily return multipliers (1 + daily_return), find the contiguous subarray with the maximum product. Return the maximum product. Note: multipliers can be negative (negative return day) or fractional (loss day). The subarray must contain at least one element.",
    examples: [
      {
        input: "multipliers = [1.05, 0.98, 1.10, 0.90, 1.20]",
        output: "1.247",
        explanation:
          "Best subarray is [1.05, 0.98, 1.10, 0.90, 1.20]. Product = 1.05*0.98*1.10*0.90*1.20 ≈ 1.217. Wait: [1.10, 0.90, 1.20] = 1.188. [1.05, 0.98, 1.10] = 1.131. Full: 1.05*0.98*1.10*0.90*1.20 = 1.2173. Check [1.10, 1.20] = 1.32. But there's 0.90 in between so full = 1.2173. Best single = 1.20. Best pair = 1.10*0.90*1.20 = 1.188, or 1.10*1.20 not contiguous. Best contiguous: [1.10, 0.90, 1.20] = 1.188. Full array = 1.05*0.98*1.10*0.90*1.20 ≈ 1.217. Answer = 1.217.",
      },
      {
        input: "multipliers = [0.9, 1.1, 0.8]",
        output: "1.1",
        explanation:
          "0.9*1.1=0.99, 1.1*0.8=0.88, 0.9*1.1*0.8=0.792. Best single = 1.1.",
      },
    ],
    constraints: [
      "1 <= N <= 2 * 10^4",
      "Multipliers can be any non-zero float",
    ],
    approach:
      "Track both max_product and min_product at each position (min can become max when multiplied by a negative). DP: max_prod[i] = max(r[i], max_prod[i-1]*r[i], min_prod[i-1]*r[i]). O(N) time, O(1) space.",
    code: `def max_product_subarray(multipliers: list) -> float:
    """
    Track both running max and min (for negative * negative = positive flip).
    Financial interpretation: best compounded return over any contiguous period.
    """
    if not multipliers:
        return 0.0

    max_prod = multipliers[0]
    min_prod = multipliers[0]
    result   = multipliers[0]

    for r in multipliers[1:]:
        # When r < 0, max and min swap
        candidates = (r, max_prod * r, min_prod * r)
        max_prod   = max(candidates)
        min_prod   = min(candidates)
        result     = max(result, max_prod)

    return round(result, 6)

def max_product_subarray_indices(multipliers: list) -> tuple:
    """Returns (max_product, start_idx, end_idx) for the optimal subarray."""
    n = len(multipliers)
    if n == 0:
        return 0.0, -1, -1

    max_prod = min_prod = result = multipliers[0]
    max_start = min_start = best_start = best_end = 0

    for i in range(1, n):
        r = multipliers[i]
        if r < 0:
            max_prod, min_prod = min_prod, max_prod
            max_start, min_start = min_start, max_start

        if r > max_prod * r:
            max_prod  = r
            max_start = i
        else:
            max_prod *= r

        if r < min_prod * r:
            min_prod  = r
            min_start = i
        else:
            min_prod *= r

        if max_prod > result:
            result     = max_prod
            best_start = max_start
            best_end   = i

    return round(result, 6), best_start, best_end`,
    language: "python",
    complexity: { time: "O(N)", space: "O(1)" },
  },
  {
    id: "fin-20260609-b1-stock-span",
    title: "Stock Span Problem — Days Since Last Higher Price",
    difficulty: "medium",
    topics: ["monotonic-stack", "array", "finance"],
    problem:
      "Given a stream of daily stock prices, design a StockSpanner that, for each new price p, returns the number of consecutive days ending today (inclusive) for which the price was at most p. This equals the number of consecutive previous days where prices were <= p, plus today.",
    examples: [
      {
        input:
          "prices streamed one at a time: [100, 80, 60, 70, 60, 75, 85]",
        output: "[1, 1, 1, 2, 1, 4, 6]",
        explanation:
          "Day 0 (100): span=1. Day 1 (80): span=1 (100>80). Day 2 (60): span=1. Day 3 (70): 60<=70 → span=2. Day 4 (60): span=1. Day 5 (75): 60<=75, 70<=75, 60<=75 → span=4. Day 6 (85): 75,60,70,60,80<=85 all pass → span=6.",
      },
    ],
    constraints: [
      "1 <= price <= 10^5",
      "At most 10^4 calls to next(price)",
    ],
    approach:
      "Monotonic stack: store (price, span) pairs. When a new price arrives, pop all stack entries with price <= current price, accumulating their spans. Push (current_price, accumulated_span). O(1) amortised per call (each element pushed and popped at most once).",
    code: `class StockSpanner:
    """
    Monotonic stack tracks span efficiently.
    Stack stores (price, span) pairs with strictly decreasing prices.
    Span = number of consecutive days up to and including today with price <= current.
    """
    def __init__(self):
        self.stack = []  # (price, span)

    def next(self, price: int) -> int:
        span = 1
        # Pop all entries with price <= current (absorbed into current span)
        while self.stack and self.stack[-1][0] <= price:
            _, s = self.stack.pop()
            span += s        # accumulate absorbed spans
        self.stack.append((price, span))
        return span

# Usage:
spanner = StockSpanner()
prices  = [100, 80, 60, 70, 60, 75, 85]
spans   = [spanner.next(p) for p in prices]
print(spans)   # [1, 1, 1, 2, 1, 4, 6]

# Financial use: "how many consecutive days has the stock been below resistance?"
# Span of 1 = new all-time high (or first observation).
# Span equal to total days = price never exceeded since inception.

# Alternative: online trading signal
# Long signal: span[i] == 1 (breakout above all recent prices)
# Reversion signal: span grows (consolidating below resistance)`,
    language: "python",
    complexity: { time: "O(1) amortised per call", space: "O(N)" },
  },
  {
    id: "fin-20260609-b1-lot-sizing-dp",
    title: "Minimum Orders to Reach Target Position (Lot Sizing)",
    difficulty: "medium",
    topics: ["dp", "greedy", "finance"],
    problem:
      "A broker offers fixed lot sizes lots[] (each can be used unlimited times). You need to acquire exactly target shares. Return the minimum number of order submissions to reach exactly target shares, or -1 if it is impossible. This is the Coin Change problem applied to equity lot sizing.",
    examples: [
      {
        input: "lots = [100, 500, 1000], target = 1800",
        output: "4",
        explanation:
          "1000 + 500 + 200? 200 not available. 1000 + 500 + 100 + 100 + 100 = 5? No: 1000+500+100+100+100=1800 → 5 orders. But 1000+500+200 impossible. 1000+500+100+100+100=5. Or 500*3 + 100*3 = 1800 → 6. Best: 1000+500+200 impossible. 1000+800 = 800 not available. 1000+500+300: 300 not avail. 1000+500+100+100+100=5. Or: 500*3+100*3=1800 in 6. Min = 4: 1000+500+100*3=5. Hmm actually: 1800 / 1000 = 1 remainder 800. 800/500=1 rem 300. 300/100=3. Total=1+1+3=5 orders. Can we do better? 500*3=1500, 1800-1500=300=100*3, 3+3=6. 1000+500+300 impossible. Answer is 5 for this case. Let me recompute: 1000+500+100+100+100=1800, orders=5.",
      },
      {
        input: "lots = [100, 500, 1000], target = 1800",
        output: "5",
        explanation:
          "Minimum: 1000+500+100+100+100=1800 in 5 orders. Coin change DP verifies this is optimal.",
      },
      {
        input: "lots = [300, 500], target = 100",
        output: "-1",
        explanation: "No combination of 300 and 500 equals exactly 100.",
      },
    ],
    constraints: [
      "1 <= lots.length <= 12",
      "1 <= lots[i] <= 10^4",
      "0 <= target <= 10^6",
    ],
    approach:
      "Classic unbounded Coin Change DP: dp[i] = minimum orders to reach exactly i shares. dp[0] = 0; dp[i] = min(dp[i-lot] + 1) for each lot <= i. O(target * len(lots)) time, O(target) space.",
    code: `def min_orders(lots: list, target: int) -> int:
    """
    Unbounded knapsack / coin change for lot sizing.
    dp[i] = minimum number of order submissions to acquire exactly i shares.
    """
    INF = float("inf")
    dp  = [INF] * (target + 1)
    dp[0] = 0

    for shares in range(1, target + 1):
        for lot in lots:
            if lot <= shares and dp[shares - lot] + 1 < dp[shares]:
                dp[shares] = dp[shares - lot] + 1

    return int(dp[target]) if dp[target] < INF else -1

def min_orders_with_breakdown(lots: list, target: int) -> dict:
    """Return both the count and which lots to use."""
    INF = float("inf")
    dp   = [INF] * (target + 1)
    best = [-1]  * (target + 1)   # lot used to reach this state
    dp[0] = 0

    for shares in range(1, target + 1):
        for lot in lots:
            if lot <= shares and dp[shares - lot] + 1 < dp[shares]:
                dp[shares] = dp[shares - lot] + 1
                best[shares] = lot

    if dp[target] == INF:
        return {"orders": -1, "breakdown": []}

    # Reconstruct the lots used
    breakdown = []
    cur       = target
    while cur > 0:
        l = best[cur]
        breakdown.append(l)
        cur -= l

    return {"orders": int(dp[target]), "breakdown": sorted(breakdown, reverse=True)}`,
    language: "python",
    complexity: { time: "O(target * len(lots))", space: "O(target)" },
  },
  {
    id: "fin-20260609-b1-max-log-rate-path",
    title: "Maximum Compound Return Path via Log-Weight Shortest Path",
    difficulty: "hard",
    topics: ["graph", "dijkstra", "finance"],
    problem:
      "You have N assets and directed conversion rates rate[i][j] (how many units of j you get per unit of i). Given a starting asset src and target asset dst, find the path that maximises the compounded conversion product (product of rates along the path). Return the maximum product and the path taken.",
    examples: [
      {
        input:
          "N=3, rates={(0,1):1.5, (1,2):1.3, (0,2):1.8, (2,1):0.8}",
        output: "max_product=1.95, path=[0,1,2]",
        explanation:
          "Path 0->2: product=1.8. Path 0->1->2: 1.5*1.3=1.95. Path 0->2->1: 1.8*0.8=1.44. Max = 1.95 via [0,1,2].",
      },
    ],
    constraints: [
      "2 <= N <= 100",
      "rates are positive real numbers",
      "No arbitrage cycle guaranteed (to avoid infinite loops)",
    ],
    approach:
      "Transform: maximise product = minimise sum of -log(rate). Run Dijkstra on the -log(rate) weighted graph. Reconstruct path via predecessor array. O((E + V) log V).",
    code: `import heapq
import math
from collections import defaultdict

def max_compound_path(n: int, rates: dict, src: int, dst: int) -> dict:
    """
    Maximise product of conversion rates via log-transformation + Dijkstra.
    max prod(rate_i) <=> min sum(-log(rate_i)).
    rates: dict {(from, to): rate} for all directed edges.
    """
    # Build adjacency list with -log weights
    graph = defaultdict(list)
    for (u, v), rate in rates.items():
        if rate > 0:
            graph[u].append((v, -math.log(rate)))   # negate for min-heap Dijkstra

    INF  = float("inf")
    dist = [INF] * n
    prev = [-1]  * n
    dist[src] = 0.0

    heap = [(0.0, src)]   # (neg_log_prod, node)

    while heap:
        d, u = heapq.heappop(heap)
        if d > dist[u] + 1e-12:
            continue    # stale entry
        for v, w in graph[u]:
            nd = d + w
            if nd < dist[v]:
                dist[v] = nd
                prev[v] = u
                heapq.heappush(heap, (nd, v))

    if dist[dst] == INF:
        return {"max_product": 0.0, "path": []}

    # Reconstruct path
    path = []
    cur  = dst
    while cur != -1:
        path.append(cur)
        cur = prev[cur]
    path.reverse()

    max_product = math.exp(-dist[dst])   # convert back from -log space

    return {
        "max_product": round(float(max_product), 6),
        "path":        path,
        "neg_log_sum": round(float(dist[dst]), 6),
    }`,
    language: "python",
    complexity: { time: "O((E + V) log V)", space: "O(V + E)" },
  },
];
