import { LeetCodeProblem } from "./index";

export const financeProblems20260703B1: LeetCodeProblem[] = [
  {
    id: "fin-20260703-b1-next-greater-price",
    title: "Next Greater Price (Monotonic Stack)",
    difficulty: "medium",
    topics: ["Stack", "Array", "Monotonic Stack"],
    leetcodeNumber: 496,
    problem:
      "Given an array of stock prices, for each day find the next day with a strictly higher price. Return an array where result[i] is the price on the next higher-price day, or -1 if no such day exists. This is a variant of 'Next Greater Element I'.",
    examples: [
      {
        input: "prices = [73, 74, 75, 71, 69, 72, 76, 73]",
        output: "[74, 75, 76, 72, 72, 76, -1, -1]",
        explanation:
          "Day 0 price 73 → next greater is 74 (day 1). Day 6 price 76 → no higher price after it, return -1.",
      },
    ],
    constraints: ["1 <= prices.length <= 10^5", "1 <= prices[i] <= 10^5"],
    approach:
      "Maintain a monotonic decreasing stack of indices. Iterate right-to-left: while the stack's top index has a price ≤ current price, pop it. The stack's new top (if any) is the next greater. Push the current index. This processes each element at most twice → O(n) time, O(n) space.",
    code: `def next_greater_price(prices):
    n = len(prices)
    result = [-1] * n
    stack = []  # monotonic decreasing stack of indices

    for i in range(n - 1, -1, -1):
        # Pop indices whose prices are <= current (can't be the answer for anyone to the left)
        while stack and prices[stack[-1]] <= prices[i]:
            stack.pop()
        if stack:
            result[i] = prices[stack[-1]]
        stack.append(i)

    return result

# Alternative: left-to-right pass resolves pending indices
def next_greater_price_v2(prices):
    n = len(prices)
    result = [-1] * n
    stack = []  # indices waiting for their next greater

    for i, p in enumerate(prices):
        while stack and prices[stack[-1]] < p:
            result[stack.pop()] = p
        stack.append(i)

    return result

prices = [73, 74, 75, 71, 69, 72, 76, 73]
print(next_greater_price(prices))
print(next_greater_price_v2(prices))`,
    language: "python",
    complexity: { time: "O(n) — each index pushed/popped at most once", space: "O(n) for the stack" },
  },
  {
    id: "fin-20260703-b1-k-transactions-dp",
    title: "Best Time to Buy and Sell Stock – K Transactions",
    difficulty: "hard",
    topics: ["Dynamic Programming", "Array"],
    leetcodeNumber: 188,
    problem:
      "Given an integer k and an array of stock prices where prices[i] is the price on day i, find the maximum profit using at most k transactions. A transaction is one buy followed by one sell; you must sell before buying again.",
    examples: [
      {
        input: "k = 2, prices = [3, 2, 6, 5, 0, 3]",
        output: "7",
        explanation: "Buy day 1 (price 2), sell day 2 (price 6) profit=4. Buy day 4 (price 0), sell day 5 (price 3) profit=3. Total=7.",
      },
    ],
    constraints: [
      "0 <= k <= 100",
      "0 <= prices.length <= 1000",
      "0 <= prices[i] <= 1000",
    ],
    approach:
      "dp[t][i] = max profit using at most t transactions up through day i. Transition: dp[t][i] = max(dp[t][i-1], max_{j<i}(prices[i] - prices[j] + dp[t-1][j-1])). Optimise the inner max to avoid O(n²) per transaction using a running variable. If k >= n//2, unlimited transactions apply (greedy). Final O(kn) time.",
    code: `def max_profit_k_transactions(k, prices):
    n = len(prices)
    if n == 0 or k == 0:
        return 0

    # If k >= n//2, unlimited transactions (greedy: sum all up-moves)
    if k >= n // 2:
        return sum(max(prices[i] - prices[i-1], 0) for i in range(1, n))

    # dp[t][i]: max profit with at most t transactions through day i
    # Space-optimised: keep only previous transaction row
    prev = [0] * n  # dp[0][*] = 0

    for t in range(1, k + 1):
        curr = [0] * n
        # best_prev = max over j<=i of (dp[t-1][j-1] - prices[j])
        best_prev = -prices[0]  # j=0: dp[t-1][-1]=0 → -prices[0]
        for i in range(1, n):
            # Option 1: don't sell on day i
            curr[i] = curr[i-1]
            # Option 2: sell on day i, best buy was some day j
            curr[i] = max(curr[i], prices[i] + best_prev)
            # Update best_prev for j=i (buy on day i for future sells)
            best_prev = max(best_prev, prev[i] - prices[i])
        prev = curr

    return prev[-1]

# Tests
print(max_profit_k_transactions(2, [3, 2, 6, 5, 0, 3]))  # 7
print(max_profit_k_transactions(2, [1, 2, 3, 4, 5]))      # 4
print(max_profit_k_transactions(1, [7, 6, 4, 3, 1]))      # 0`,
    language: "python",
    complexity: { time: "O(k·n)", space: "O(n) with rolling arrays" },
  },
  {
    id: "fin-20260703-b1-token-bucket",
    title: "Token Bucket Rate Limiter (Design)",
    difficulty: "medium",
    topics: ["Design", "Hash Table", "Queue"],
    problem:
      "Design a token bucket rate limiter for an order management system. Each trading account has a bucket of capacity C tokens that refills at rate R tokens/second. Each order request consumes 1 token. Implement allow(account_id, timestamp_ms) → bool. A request is allowed if the bucket has tokens; otherwise it is rejected. Tokens accumulate while idle but never exceed capacity.",
    examples: [
      {
        input:
          "capacity=5, rate=2 tokens/sec. allow('ACC1', 0), allow('ACC1', 0), allow('ACC1', 0), allow('ACC1', 500), allow('ACC1', 1000)",
        output: "[True, True, True, True, True]",
        explanation:
          "Start: 5 tokens. Three requests at t=0 drain to 2. At t=500ms, 1 token refilled (2*0.5=1.0) → 3 tokens, grant and drain to 2. At t=1000ms, 1 more second passed, 2 tokens refilled → 4, grant and drain to 3.",
      },
    ],
    approach:
      "Store (tokens, last_timestamp_ms) per account in a dict. On each request: elapsed = (now − last) / 1000s; tokens = min(capacity, stored + elapsed * rate); if tokens >= 1: deduct and allow, else reject. No background thread needed — lazy refill on each call.",
    code: `class TokenBucketRateLimiter:
    def __init__(self, capacity: float, rate: float):
        """
        capacity: max tokens per bucket
        rate: tokens added per second
        """
        self.capacity = capacity
        self.rate = rate
        self.buckets = {}  # account_id -> (tokens, last_ts_ms)

    def allow(self, account_id: str, timestamp_ms: int) -> bool:
        if account_id not in self.buckets:
            # First request: start with full bucket
            self.buckets[account_id] = (self.capacity, timestamp_ms)

        tokens, last_ts = self.buckets[account_id]

        # Refill tokens based on elapsed time
        elapsed_sec = (timestamp_ms - last_ts) / 1000.0
        tokens = min(self.capacity, tokens + elapsed_sec * self.rate)

        if tokens >= 1.0:
            self.buckets[account_id] = (tokens - 1.0, timestamp_ms)
            return True

        # Update timestamp even on rejection so refill clock advances
        self.buckets[account_id] = (tokens, timestamp_ms)
        return False

    def remaining(self, account_id: str) -> float:
        if account_id not in self.buckets:
            return self.capacity
        tokens, _ = self.buckets[account_id]
        return tokens

limiter = TokenBucketRateLimiter(capacity=5, rate=2)
events = [(0, True), (0, True), (0, True), (0, True), (0, True),
          (0, False), (500, True), (1000, True)]
for ts, expected in events:
    got = limiter.allow("ACC1", ts)
    status = "OK" if got == expected else "FAIL"
    print(f"t={ts:4d}ms  allowed={got}  tokens_left={limiter.remaining('ACC1'):.2f}  {status}")`,
    language: "python",
    complexity: { time: "O(1) per request", space: "O(accounts)" },
  },
  {
    id: "fin-20260703-b1-streaming-median",
    title: "Streaming Median – Two Heaps",
    difficulty: "hard",
    topics: ["Heap", "Design", "Data Stream"],
    leetcodeNumber: 295,
    problem:
      "Design a data structure that supports: addNum(num) — adds a number from a stream of trade prices, findMedian() — returns the median of all numbers seen so far. The median is the middle value (or average of two middle values) of the sorted sequence.",
    examples: [
      {
        input: "addNum(1), addNum(2), findMedian(), addNum(3), findMedian()",
        output: "1.5, 2.0",
        explanation:
          "After [1,2]: median = (1+2)/2 = 1.5. After [1,2,3]: median = 2.0.",
      },
    ],
    constraints: [
      "-10^5 <= num <= 10^5",
      "At most 5 * 10^4 calls to addNum and findMedian",
      "findMedian called at least once",
    ],
    approach:
      "Maintain two heaps: a max-heap (lo) for the lower half and a min-heap (hi) for the upper half. Keep |lo| == |hi| or |lo| == |hi|+1. Adding: push to lo, then balance by moving lo's max to hi; if hi > lo in size, move hi's min back to lo. Median: lo's max if odd total, else average of both tops.",
    code: `import heapq

class MedianFinder:
    def __init__(self):
        self.lo = []   # max-heap (store negatives for Python's min-heap)
        self.hi = []   # min-heap

    def addNum(self, num: int) -> None:
        # Always push to lo first
        heapq.heappush(self.lo, -num)

        # Ensure lo's max <= hi's min
        if self.hi and (-self.lo[0]) > self.hi[0]:
            heapq.heappush(self.hi, -heapq.heappop(self.lo))

        # Balance sizes: |lo| == |hi| or |lo| == |hi| + 1
        if len(self.lo) > len(self.hi) + 1:
            heapq.heappush(self.hi, -heapq.heappop(self.lo))
        elif len(self.hi) > len(self.lo):
            heapq.heappush(self.lo, -heapq.heappop(self.hi))

    def findMedian(self) -> float:
        if len(self.lo) == len(self.hi):
            return (-self.lo[0] + self.hi[0]) / 2.0
        return float(-self.lo[0])

mf = MedianFinder()
stream = [41, 35, 62, 4, 97, 108, 22, 55]
for price in stream:
    mf.addNum(price)
    print(f"Added {price:4d}  →  median = {mf.findMedian()}")`,
    language: "python",
    complexity: { time: "O(log n) per addNum, O(1) per findMedian", space: "O(n)" },
  },
  {
    id: "fin-20260703-b1-lis-trend",
    title: "Longest Increasing Subsequence – Trend Detection",
    difficulty: "medium",
    topics: ["Array", "Binary Search", "Dynamic Programming"],
    leetcodeNumber: 300,
    problem:
      "Given a series of daily closing prices, find the length of the longest strictly increasing subsequence (LIS). In a trading context this identifies the longest sustained uptrend in a non-contiguous price series. Also return the actual subsequence.",
    examples: [
      {
        input: "prices = [10, 9, 2, 5, 3, 7, 101, 18]",
        output: "length=4, subsequence=[2, 5, 7, 101] or [2, 3, 7, 101] or [2, 5, 7, 18]",
        explanation: "The LIS has length 4.",
      },
    ],
    constraints: ["1 <= prices.length <= 2500", "0 <= prices[i] <= 10^4"],
    approach:
      "Patience sorting / binary search O(n log n): maintain tails[] where tails[i] is the smallest tail of all LIS of length i+1. For each price, binary search tails for the leftmost value >= price and replace it (or append). The length of tails is the LIS length. To reconstruct, track predecessors in a separate O(n²) DP pass.",
    code: `import bisect

def length_of_lis(prices):
    """O(n log n) using patience sorting."""
    tails = []
    for p in prices:
        pos = bisect.bisect_left(tails, p)
        if pos == len(tails):
            tails.append(p)
        else:
            tails[pos] = p
    return len(tails)

def lis_with_sequence(prices):
    """O(n^2) DP to recover the actual subsequence."""
    n = len(prices)
    if n == 0:
        return 0, []
    dp   = [1] * n
    prev = [-1] * n
    for i in range(1, n):
        for j in range(i):
            if prices[j] < prices[i] and dp[j] + 1 > dp[i]:
                dp[i]   = dp[j] + 1
                prev[i] = j
    # Reconstruct
    best_idx = max(range(n), key=lambda i: dp[i])
    seq = []
    idx = best_idx
    while idx >= 0:
        seq.append(prices[idx])
        idx = prev[idx]
    seq.reverse()
    return dp[best_idx], seq

prices = [10, 9, 2, 5, 3, 7, 101, 18]
print(f"LIS length (fast):    {length_of_lis(prices)}")
length, subseq = lis_with_sequence(prices)
print(f"LIS length (with seq): {length}")
print(f"LIS subsequence:       {subseq}")`,
    language: "python",
    complexity: { time: "O(n log n) for length, O(n²) for reconstruction", space: "O(n)" },
  },
  {
    id: "fin-20260703-b1-merge-sort-inversions",
    title: "Count Inversions – Merge Sort (Trade Sequence Disorder)",
    difficulty: "hard",
    topics: ["Divide and Conquer", "Merge Sort", "Array"],
    problem:
      "Given a sequence of trade execution prices, count the number of inversions — pairs (i, j) where i < j but prices[i] > prices[j]. The inversion count measures how 'out of order' the sequence is vs. the globally sorted order; in trading it quantifies the degree of mean-reversion vs. momentum in historical fills.",
    examples: [
      {
        input: "prices = [5, 4, 3, 2, 1]",
        output: "10",
        explanation: "All 10 pairs (i,j) with i<j are inverted (fully reversed array).",
      },
      {
        input: "prices = [1, 20, 6, 4, 5]",
        output: "5",
        explanation: "Pairs: (20,6),(20,4),(20,5),(6,4),(6,5) — 5 inversions.",
      },
    ],
    approach:
      "During merge sort, when placing an element from the right sub-array before remaining elements of the left sub-array, each such event contributes len(left_remaining) inversions. Count these during the merge step. Total: O(n log n).",
    code: `def count_inversions(prices):
    """Count inversions via modified merge sort. Returns (sorted_arr, count)."""
    if len(prices) <= 1:
        return list(prices), 0

    mid   = len(prices) // 2
    left,  left_inv  = count_inversions(prices[:mid])
    right, right_inv = count_inversions(prices[mid:])

    merged = []
    inv    = left_inv + right_inv
    i = j  = 0

    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            merged.append(left[i])
            i += 1
        else:
            # All remaining elements in left are > right[j]
            inv += len(left) - i
            merged.append(right[j])
            j += 1

    merged.extend(left[i:])
    merged.extend(right[j:])
    return merged, inv

def inversion_rate(prices):
    """Normalise inversions to [0,1]: 0=sorted, 1=fully reversed."""
    n = len(prices)
    _, inv = count_inversions(prices)
    max_inv = n * (n - 1) // 2
    return inv, inv / max_inv if max_inv > 0 else 0.0

# Finance context: measure disorder in TWAP execution prices
twap_fills = [100.05, 100.03, 100.08, 100.01, 100.06, 100.02, 100.09, 100.04]
inv, rate = inversion_rate(twap_fills)
print(f"Inversions:    {inv}")
print(f"Max possible:  {len(twap_fills)*(len(twap_fills)-1)//2}")
print(f"Disorder rate: {rate:.1%}  (1.0 = perfect mean-reversion signal)")`,
    language: "python",
    complexity: { time: "O(n log n)", space: "O(n) for temporary merge arrays" },
  },
  {
    id: "fin-20260703-b1-min-order-split-dp",
    title: "Minimum Cost Order Split (Unbounded Knapsack Variant)",
    difficulty: "medium",
    topics: ["Dynamic Programming", "Greedy"],
    problem:
      "A broker charges different fees for different order sizes. Given a list of (lot_size, fee) pairs and a target quantity Q, find the minimum total fee to exactly fill Q shares by splitting into lots of the given sizes (lots may be reused). This is the coin-change minimum cost variant applied to order execution.",
    examples: [
      {
        input: "Q=11, lots=[(1,5),(4,2),(7,3)]  # (size, fee)",
        output: "5",
        explanation:
          "Use size 4 (fee 2) twice + size 3... wait: available sizes are 1,4,7. Best: 4+7=11, fee=2+3=5.",
      },
    ],
    constraints: [
      "1 <= Q <= 10^4",
      "1 <= lot_size <= Q",
      "1 <= len(lots) <= 100",
      "Solution always exists (size 1 lot is always available)",
    ],
    approach:
      "Unbounded knapsack / coin-change variant. dp[q] = min fee to fill exactly q shares. Initialise dp[0]=0, dp[q]=infinity. For each q from 1..Q: dp[q] = min(dp[q - size] + fee) over all lots where size <= q. Final answer: dp[Q].",
    code: `def min_order_fill_cost(Q, lots):
    """
    lots: list of (lot_size, fee)
    Returns (min_cost, lot_counts_used).
    """
    INF = float("inf")
    dp      = [INF] * (Q + 1)
    chosen  = [-1]  * (Q + 1)   # which lot was used at each step
    dp[0]   = 0

    for q in range(1, Q + 1):
        for idx, (size, fee) in enumerate(lots):
            if size <= q and dp[q - size] + fee < dp[q]:
                dp[q]     = dp[q - size] + fee
                chosen[q] = idx

    if dp[Q] == INF:
        return -1, []

    # Reconstruct lot breakdown
    breakdown = []
    q = Q
    while q > 0:
        idx  = chosen[q]
        size, fee = lots[idx]
        breakdown.append((size, fee))
        q   -= size

    return dp[Q], breakdown

lots = [(1, 8), (4, 2), (7, 3), (10, 4)]
for Q in [11, 15, 20, 25]:
    cost, breakdown = min_order_fill_cost(Q, lots)
    print(f"Q={Q:3d}: min_fee={cost}  lots={breakdown}")`,
    language: "python",
    complexity: { time: "O(Q × |lots|)", space: "O(Q)" },
  },
  {
    id: "fin-20260703-b1-order-book-design",
    title: "Order Book Design (Limit Order Book)",
    difficulty: "hard",
    topics: ["Design", "Heap", "Hash Table", "Sorted Container"],
    problem:
      "Design a limit order book (LOB) supporting: add_order(order_id, side, price, qty), cancel_order(order_id), get_best_bid() → (price, qty), get_best_ask() → (price, qty), and match_order(side, qty) which matches a market order against the book and returns total cost. Use a price-time priority queue.",
    examples: [
      {
        input:
          "add_order('B1','BUY',100,200), add_order('B2','BUY',99,300), add_order('A1','SELL',101,150), match_order('BUY',250)",
        output:
          "Fills 150 shares @ 101 + 100 more if another offer. Best bid=100 qty=200, Best ask=101 qty=150.",
      },
    ],
    approach:
      "Maintain separate sorted structures for bids (max price priority) and asks (min price priority). Each price level holds a queue of (timestamp, order_id, qty). Use heaps for O(log n) best-price lookup and a dict for O(1) cancel. A cancelled order is lazily removed from the heap when it surfaces as the best price.",
    code: `import heapq
from collections import defaultdict

class LimitOrderBook:
    def __init__(self):
        self.bids    = []   # max-heap: store (-price, ts, order_id)
        self.asks    = []   # min-heap: store (price, ts, order_id)
        self.orders  = {}   # order_id -> (side, price, qty)
        self.cancelled = set()
        self._ts     = 0

    def add_order(self, order_id, side, price, qty):
        self._ts += 1
        self.orders[order_id] = (side, price, qty)
        if side == "BUY":
            heapq.heappush(self.bids, (-price, self._ts, order_id))
        else:
            heapq.heappush(self.asks, (price, self._ts, order_id))

    def cancel_order(self, order_id):
        if order_id in self.orders:
            self.cancelled.add(order_id)
            del self.orders[order_id]

    def _peek(self, heap, is_bid):
        while heap:
            entry   = heap[0]
            oid     = entry[2]
            if oid in self.cancelled or oid not in self.orders:
                heapq.heappop(heap)
                self.cancelled.discard(oid)
                continue
            return self.orders[oid]   # (side, price, qty)
        return None

    def get_best_bid(self):
        return self._peek(self.bids,  True)

    def get_best_ask(self):
        return self._peek(self.asks, False)

    def match_order(self, side, qty):
        """Match a market order. Returns (fills, total_cost)."""
        heap   = self.asks if side == "BUY" else self.bids
        fills  = []
        total_cost = 0.0
        while qty > 0 and heap:
            entry = heap[0]
            oid   = entry[2]
            if oid in self.cancelled or oid not in self.orders:
                heapq.heappop(heap); self.cancelled.discard(oid); continue
            _, price, avail_qty = self.orders[oid]
            fill_qty = min(qty, avail_qty)
            fills.append((price, fill_qty))
            total_cost += price * fill_qty
            qty -= fill_qty
            if fill_qty == avail_qty:
                heapq.heappop(heap)
                del self.orders[oid]
            else:
                self.orders[oid] = (self.orders[oid][0], price, avail_qty - fill_qty)
        return fills, total_cost

lob = LimitOrderBook()
lob.add_order("B1", "BUY",  100.0, 200)
lob.add_order("B2", "BUY",   99.0, 300)
lob.add_order("A1", "SELL", 101.0, 150)
lob.add_order("A2", "SELL", 102.0, 300)

print("Best bid:", lob.get_best_bid())
print("Best ask:", lob.get_best_ask())
fills, cost = lob.match_order("BUY", 250)
print(f"Market BUY 250: fills={fills}, total_cost={cost:.2f}")`,
    language: "python",
    complexity: { time: "O(log n) add/cancel/match per price level", space: "O(n) orders" },
  },
  {
    id: "fin-20260703-b1-bellman-ford-single-source",
    title: "Bellman-Ford Single-Source (FX Settlement Path)",
    difficulty: "medium",
    topics: ["Graph", "Bellman-Ford", "Shortest Path"],
    leetcodeNumber: 743,
    problem:
      "Given a foreign exchange settlement network represented as a directed weighted graph where edge weight w(u→v) is the log-exchange rate log(rate), find the minimum total cost path (minimum negative log-product, i.e., best exchange rate) from a source currency to all others using Bellman-Ford. Also detect negative cycles (arbitrage opportunities).",
    examples: [
      {
        input: "currencies=[USD,EUR,GBP,JPY], rates: USD→EUR 0.92, EUR→GBP 0.86, USD→JPY 149.5",
        output: "Shortest log-cost paths from USD to each currency.",
      },
    ],
    approach:
      "Negate log-rates to turn max-product (best rate) into min-sum (shortest path). Run n-1 relaxation rounds over all edges. Check round n for further improvement — any improvement indicates a negative cycle (log-arbitrage). Return distances and a flag for arbitrage detection.",
    code: `import math

def bellman_ford_fx(currencies, edges, source):
    """
    edges: list of (from_ccy, to_ccy, exchange_rate)
    Uses log-space: weight = -log(rate) so shortest path = best compounded rate.
    Returns (dist_dict, prev_dict, has_arbitrage).
    """
    n     = len(currencies)
    idx   = {c: i for i, c in enumerate(currencies)}
    INF   = float("inf")
    dist  = [INF] * n
    prev  = [-1]  * n
    dist[idx[source]] = 0.0

    # Convert rates to -log weights
    log_edges = [(idx[u], idx[v], -math.log(r)) for u, v, r in edges]

    # n-1 relaxation rounds
    for _ in range(n - 1):
        for u, v, w in log_edges:
            if dist[u] < INF and dist[u] + w < dist[v]:
                dist[v] = dist[u] + w
                prev[v] = u

    # Round n: detect negative cycles (arbitrage)
    has_arb = False
    arb_nodes = set()
    for u, v, w in log_edges:
        if dist[u] < INF and dist[u] + w < dist[v] - 1e-9:
            has_arb = True
            arb_nodes.add(v)

    results = {}
    for c in currencies:
        i = idx[c]
        if dist[i] < INF:
            best_rate = math.exp(-dist[i])
            results[c] = {"best_rate": best_rate, "arbitrage": i in arb_nodes}

    return results, has_arb

currencies = ["USD", "EUR", "GBP", "CHF", "JPY"]
edges = [
    ("USD", "EUR", 0.920), ("USD", "GBP", 0.790),
    ("USD", "CHF", 0.895), ("USD", "JPY", 149.50),
    ("EUR", "GBP", 0.859), ("EUR", "CHF", 0.972),
    ("GBP", "CHF", 1.132), ("GBP", "JPY", 189.20),
    ("JPY", "USD", 0.0067),
]
results, arb = bellman_ford_fx(currencies, edges, "USD")
for ccy, info in results.items():
    arb_flag = " *** ARBITRAGE ***" if info["arbitrage"] else ""
    print(f"USD → {ccy}: best rate = {info['best_rate']:.6f}{arb_flag}")
print(f"Negative cycle (arbitrage) detected: {arb}")`,
    language: "python",
    complexity: { time: "O(V·E)", space: "O(V + E)" },
  },
];
