import type { LeetCodeProblem } from "./index";

export const financeProblems20260701B1: LeetCodeProblem[] = [
  {
    id: "fin-20260701-b1-fx-bellman-ford",
    title: "FX Arbitrage via Bellman-Ford Negative Log-Cycle",
    difficulty: "hard",
    topics: ["graph", "bellman-ford", "negative-cycle"],
    problem: `Given a list of currency exchange rates as a matrix rates[i][j] representing the exchange rate from currency i to currency j, determine if there exists an arbitrage opportunity — a cycle of exchanges that starts and ends with the same currency and yields a profit.

Return true if arbitrage is possible, false otherwise.

This is equivalent to finding a negative-weight cycle in a directed graph where edge weights are -log(rates[i][j]).`,
    examples: [
      {
        input: `rates = [[1, 2, 0.5], [0.5, 1, 4], [2, 0.25, 1]]`,
        output: "true",
        explanation: "Exchanging currency 0→1→2→0: 1 * 2 * 4 * 2 = 16 > 1. Profit of 16x. (After log transform: a negative cycle exists.)",
      },
      {
        input: `rates = [[1, 0.5], [2, 1]]`,
        output: "false",
        explanation: "0→1→0: 1 * 0.5 * 2 = 1.0. No profit.",
      },
    ],
    constraints: [
      "1 <= n <= 150 currencies",
      "rates[i][i] = 1.0",
      "rates[i][j] > 0",
    ],
    approach: `Transform edge weights to -log(rate). Run Bellman-Ford for N-1 relaxations. If any weight can still be reduced on the Nth iteration, a negative cycle exists — meaning an arbitrage opportunity is present. The log transform converts the product-based cycle condition (product > 1) into a sum-based condition (sum < 0).`,
    code: `import math

def has_arbitrage(rates: list[list[float]]) -> bool:
    n = len(rates)
    # Build edge list with -log weights
    edges = []
    for i in range(n):
        for j in range(n):
            if i != j:
                edges.append((i, j, -math.log(rates[i][j])))

    # Bellman-Ford from a virtual source node connected to all with weight 0
    dist = [0.0] * n   # start all at 0 (every node reachable)

    for _ in range(n - 1):
        for u, v, w in edges:
            if dist[u] + w < dist[v]:
                dist[v] = dist[u] + w

    # Nth iteration: if any edge still relaxes, negative cycle exists
    for u, v, w in edges:
        if dist[u] + w < dist[v]:
            return True
    return False

# Test
rates1 = [[1, 2, 0.5], [0.5, 1, 4], [2, 0.25, 1]]
print(has_arbitrage(rates1))   # True

rates2 = [[1, 0.5], [2, 1]]
print(has_arbitrage(rates2))   # False`,
    language: "python",
    complexity: { time: "O(N * E) = O(N^3)", space: "O(E) = O(N^2)" },
    leetcodeNumber: 399,
  },
  {
    id: "fin-20260701-b1-rate-limiter",
    title: "Sliding Window API Rate Limiter",
    difficulty: "medium",
    topics: ["sliding-window", "deque", "design"],
    problem: `Design a rate limiter for an order management system. Implement a class RateLimiter that:

- RateLimiter(int maxRequests, int windowMs): Initialises with a maximum number of requests allowed within a sliding window of windowMs milliseconds.
- bool allowRequest(long timestamp): Returns true if the request at the given timestamp should be allowed, false if it would exceed the rate limit. A request that is allowed should be counted.

The timestamps are in milliseconds and will be called in non-decreasing order.`,
    examples: [
      {
        input: `RateLimiter(3, 1000)\nallowRequest(100) → true\nallowRequest(500) → true\nallowRequest(800) → true\nallowRequest(900) → false  # 3 requests in [100,1100)\nallowRequest(1200) → true  # 100 has expired, window now [200,1200)`,
        output: "true, true, true, false, true",
        explanation: "Window is [ts - windowMs, ts). Timestamps falling outside the window are evicted.",
      },
    ],
    constraints: [
      "0 <= timestamp <= 10^9",
      "1 <= maxRequests <= 10^4",
      "1 <= windowMs <= 10^6",
      "Timestamps are non-decreasing",
    ],
    approach: `Use a deque to store timestamps of allowed requests in the current window. On each call, first evict timestamps older than (current - windowMs) from the front. If the deque size is less than maxRequests, allow the request and append the timestamp. Otherwise reject it. This gives O(1) amortised time per call.`,
    code: `from collections import deque

class RateLimiter:
    def __init__(self, max_requests: int, window_ms: int):
        self.max_requests = max_requests
        self.window_ms    = window_ms
        self.queue        = deque()   # timestamps of allowed requests

    def allow_request(self, timestamp: int) -> bool:
        # Evict expired timestamps (outside sliding window)
        cutoff = timestamp - self.window_ms
        while self.queue and self.queue[0] <= cutoff:
            self.queue.popleft()

        if len(self.queue) < self.max_requests:
            self.queue.append(timestamp)
            return True
        return False

# Test
rl = RateLimiter(3, 1000)
for ts, expected in [(100, True), (500, True), (800, True),
                     (900, False), (1200, True)]:
    result = rl.allow_request(ts)
    status = "OK" if result == expected else "FAIL"
    print(f"ts={ts}: {result} [{status}]")`,
    language: "python",
    complexity: { time: "O(1) amortised per call", space: "O(maxRequests)" },
  },
  {
    id: "fin-20260701-b1-stock-cooldown",
    title: "Stock Buy/Sell with 1-Day Cooldown",
    difficulty: "medium",
    topics: ["dynamic-programming", "state-machine"],
    problem: `You have an array prices where prices[i] is the price of a stock on day i. You may buy and sell the stock multiple times, but after each sale you must wait 1 day before buying again (cooldown period). You may not hold more than one share at a time.

Find the maximum profit you can achieve.`,
    examples: [
      {
        input: "prices = [1, 2, 3, 0, 2]",
        output: "3",
        explanation: "Buy day 0, sell day 1. Cooldown day 2. Buy day 3, sell day 4. Profit = (2-1) + (2-0) = 3.",
      },
      {
        input: "prices = [1]",
        output: "0",
        explanation: "No profit possible with a single price.",
      },
    ],
    constraints: ["1 <= prices.length <= 5000", "0 <= prices[i] <= 1000"],
    approach: `Model as a 3-state DP: held (holding stock), sold (just sold, in cooldown), rest (cooldown over, no stock). Transitions: held[i] = max(held[i-1], rest[i-1] - price) — buy from rest. sold[i] = held[i-1] + price — sell. rest[i] = max(rest[i-1], sold[i-1]) — wait. Answer is max(sold[-1], rest[-1]).`,
    code: `def max_profit_cooldown(prices: list[int]) -> int:
    if len(prices) <= 1:
        return 0

    # State: held = holding stock, sold = just sold (cooldown), rest = idle
    held = -prices[0]
    sold = 0
    rest = 0

    for price in prices[1:]:
        prev_held = held
        prev_sold = sold
        prev_rest = rest

        held = max(prev_held, prev_rest - price)   # buy or keep holding
        sold = prev_held + price                   # must sell from held
        rest = max(prev_rest, prev_sold)           # cooldown or stay idle

    return max(sold, rest)

print(max_profit_cooldown([1, 2, 3, 0, 2]))   # 3
print(max_profit_cooldown([1]))                # 0
print(max_profit_cooldown([2, 1, 4]))          # 3  buy@1, sell@4`,
    language: "python",
    complexity: { time: "O(N)", space: "O(1)" },
    leetcodeNumber: 309,
  },
  {
    id: "fin-20260701-b1-k-transactions",
    title: "Maximum Profit with K Transactions",
    difficulty: "hard",
    topics: ["dynamic-programming", "finance"],
    problem: `You are given an integer k and an array prices where prices[i] is the price of a stock on day i. You may complete at most k buy/sell transactions. You may not hold more than one share at a time, and you must sell before you buy again.

Find the maximum profit.`,
    examples: [
      {
        input: "k = 2, prices = [3, 2, 6, 5, 0, 3]",
        output: "7",
        explanation: "Buy day 1 at 2, sell day 2 at 6 (profit 4). Buy day 4 at 0, sell day 5 at 3 (profit 3). Total = 7.",
      },
      {
        input: "k = 1, prices = [1, 2]",
        output: "1",
        explanation: "Single transaction: buy at 1, sell at 2.",
      },
    ],
    constraints: [
      "0 <= k <= 100",
      "1 <= prices.length <= 1000",
      "0 <= prices[i] <= 1000",
    ],
    approach: `If k >= N/2, unlimited transactions (greedy sum of positive diffs). Otherwise, DP: buy[j] = best net cost of completing exactly j buys, sell[j] = best profit after j complete transactions. For each price, update sell[j] = max(sell[j], buy[j] + price), then buy[j] = max(buy[j], sell[j-1] - price). O(N*K) time.`,
    code: `def max_profit_k_transactions(k: int, prices: list[int]) -> int:
    n = len(prices)
    if not prices or k == 0:
        return 0

    # If k >= n/2, unlimited transactions
    if k >= n // 2:
        return sum(max(prices[i+1] - prices[i], 0) for i in range(n-1))

    # buy[j] = max profit after j buys (net cost paid so far, negative)
    # sell[j] = max profit after j complete sells
    buy  = [-float('inf')] * (k + 1)
    sell = [0] * (k + 1)

    for price in prices:
        for j in range(k, 0, -1):   # reverse to avoid using same day twice
            sell[j] = max(sell[j], buy[j] + price)
            buy[j]  = max(buy[j],  sell[j-1] - price)

    return sell[k]

print(max_profit_k_transactions(2, [3, 2, 6, 5, 0, 3]))  # 7
print(max_profit_k_transactions(1, [1, 2]))               # 1
print(max_profit_k_transactions(2, [2, 4, 1]))            # 2`,
    language: "python",
    complexity: { time: "O(N * K)", space: "O(K)" },
    leetcodeNumber: 188,
  },
  {
    id: "fin-20260701-b1-histogram-rect",
    title: "Largest Rectangle in Order Book Depth Histogram",
    difficulty: "hard",
    topics: ["stack", "monotonic-stack", "histogram"],
    problem: `Given an array heights where heights[i] represents the total resting liquidity (in lots) at price level i in an order book, find the largest rectangular area that can be formed within the histogram. This models the maximum block trade executable within a contiguous price range at a given depth.

Return the area of the largest rectangle.`,
    examples: [
      {
        input: "heights = [2, 1, 5, 6, 2, 3]",
        output: "10",
        explanation: "Rectangle of width 2, height 5 formed by bars at indices 2 and 3.",
      },
      {
        input: "heights = [2, 4]",
        output: "4",
        explanation: "Single bar of height 4.",
      },
    ],
    constraints: [
      "1 <= heights.length <= 10^5",
      "0 <= heights[i] <= 10^4",
    ],
    approach: `Use a monotonic increasing stack. Maintain indices of bars in increasing height order. When a shorter bar is found, pop taller bars and compute the rectangle with that bar as the shortest — its width extends from the current index back to the new stack top. Append sentinel 0 at the end to flush the stack.`,
    code: `def largest_rectangle(heights: list[int]) -> int:
    stack  = []    # indices of bars in increasing height order
    max_area = 0
    heights  = heights + [0]    # sentinel to flush remaining bars

    for i, h in enumerate(heights):
        start = i
        while stack and heights[stack[-1]] >= h:
            idx  = stack.pop()
            # Rectangle: height at idx, width from idx to i
            width    = i - (stack[-1] + 1 if stack else 0)
            max_area = max(max_area, heights[idx] * width)
            start    = idx   # extend left boundary
        stack.append(i)

    return max_area

print(largest_rectangle([2, 1, 5, 6, 2, 3]))  # 10
print(largest_rectangle([2, 4]))               # 4
print(largest_rectangle([6, 2, 5, 4, 5, 1, 6]))  # 12`,
    language: "python",
    complexity: { time: "O(N)", space: "O(N)" },
    leetcodeNumber: 84,
  },
  {
    id: "fin-20260701-b1-stream-median",
    title: "Data Stream Running Median (Two-Heap)",
    difficulty: "medium",
    topics: ["heap", "design", "data-stream"],
    problem: `Design a class MedianFinder for a data stream of trade prices. Implement:

- addNum(int num): Adds a price from the data stream.
- findMedian() -> float: Returns the median of all prices seen so far.

The median is the middle value when sorted. If even count, return the average of the two middle values.`,
    examples: [
      {
        input: `addNum(1), addNum(2), findMedian() → 1.5\naddNum(3), findMedian() → 2.0`,
        output: "1.5, 2.0",
        explanation: "After [1,2]: median = (1+2)/2 = 1.5. After [1,2,3]: median = 2.",
      },
    ],
    constraints: [
      "-10^5 <= num <= 10^5",
      "At least one element before calling findMedian",
    ],
    approach: `Maintain two heaps: max-heap (left half) and min-heap (right half). Keep them balanced — sizes differ by at most 1, and all elements in the left heap are <= all elements in the right heap. Median is the top of the larger heap, or the average of both tops if equal size.`,
    code: `import heapq

class MedianFinder:
    def __init__(self):
        self.lo = []    # max-heap (negate for Python's min-heap)
        self.hi = []    # min-heap

    def add_num(self, num: int) -> None:
        heapq.heappush(self.lo, -num)

        # Balance: lo top must be <= hi top
        if self.hi and -self.lo[0] > self.hi[0]:
            heapq.heappush(self.hi, -heapq.heappop(self.lo))

        # Rebalance sizes: hi can have at most 1 more than lo
        if len(self.hi) > len(self.lo) + 1:
            heapq.heappush(self.lo, -heapq.heappop(self.hi))
        elif len(self.lo) > len(self.hi) + 1:
            heapq.heappush(self.hi, -heapq.heappop(self.lo))

    def find_median(self) -> float:
        if len(self.lo) == len(self.hi):
            return (-self.lo[0] + self.hi[0]) / 2.0
        return float(-self.lo[0] if len(self.lo) > len(self.hi) else self.hi[0])

mf = MedianFinder()
mf.add_num(1); mf.add_num(2)
print(mf.find_median())   # 1.5
mf.add_num(3)
print(mf.find_median())   # 2.0`,
    language: "python",
    complexity: { time: "O(log N) add, O(1) findMedian", space: "O(N)" },
    leetcodeNumber: 295,
  },
  {
    id: "fin-20260701-b1-stock-span",
    title: "Stock Span Monotonic Stack",
    difficulty: "medium",
    topics: ["stack", "monotonic-stack", "finance"],
    problem: `Design a StockSpanner class for a streaming feed of daily stock prices. Implement:

- next(int price) -> int: Returns the span of the stock's price for the current day — the maximum number of consecutive days (counting today) for which the stock's price was less than or equal to today's price.`,
    examples: [
      {
        input: `next(100) → 1\nnext(80) → 1\nnext(60) → 1\nnext(70) → 2\nnext(60) → 1\nnext(75) → 4\nnext(85) → 6`,
        output: "1, 1, 1, 2, 1, 4, 6",
        explanation: "On day 85: spans back over 75, 60, 70, 60, 80 — but 80 < 85 too? No: 80 > 75, so span is 6 (85 >= 75, 60, 70, 60, 80, and 100 > 85 stops it).",
      },
    ],
    constraints: ["1 <= price <= 10^5", "At most 10^4 calls to next"],
    approach: `Maintain a monotonic decreasing stack of (price, span) pairs. When a new price arrives, pop all pairs with price <= current price, accumulating their spans. Push (current_price, accumulated_span). The span is the sum of popped spans + 1 (for today). O(1) amortised per call.`,
    code: `class StockSpanner:
    def __init__(self):
        self.stack = []   # (price, span) pairs, decreasing by price

    def next(self, price: int) -> int:
        span = 1
        while self.stack and self.stack[-1][0] <= price:
            span += self.stack.pop()[1]   # accumulate spans of dominated days
        self.stack.append((price, span))
        return span

sp = StockSpanner()
for p, expected in [(100, 1), (80, 1), (60, 1), (70, 2),
                    (60, 1), (75, 4), (85, 6)]:
    result = sp.next(p)
    print(f"next({p}) = {result} {'OK' if result == expected else 'FAIL'}") `,
    language: "python",
    complexity: { time: "O(1) amortised", space: "O(N)" },
    leetcodeNumber: 901,
  },
  {
    id: "fin-20260701-b1-interval-cover",
    title: "Minimum Interval Coverage for Yield Curve Bucketing",
    difficulty: "medium",
    topics: ["greedy", "intervals", "sorting"],
    problem: `You are given a list of yield curve points (as intervals [start, end] representing tenors they cover) and a target range [0, T] that must be fully covered for risk bucketing. Find the minimum number of intervals needed to cover [0, T] without any gap.

Return the minimum count, or -1 if coverage is impossible.`,
    examples: [
      {
        input: "intervals = [[0,2],[1,4],[3,5],[4,7]], T = 7",
        output: "3",
        explanation: "Use [0,2], [1,4], [4,7]. Three intervals cover [0,7].",
      },
      {
        input: "intervals = [[0,1],[3,4]], T = 4",
        output: "-1",
        explanation: "Gap from 1 to 3 cannot be covered.",
      },
    ],
    constraints: [
      "1 <= intervals.length <= 10^4",
      "intervals[i][0] <= intervals[i][1]",
      "0 <= T <= 10^5",
    ],
    approach: `Greedy: sort intervals by start. Maintain 'current_end' (coverage so far) and 'farthest_reach' (best reach from intervals starting <= current_end). Advance greedily: scan all intervals starting at or before current_end, track the farthest endpoint, then jump current_end to farthest_reach. If farthest_reach doesn't improve, there's a gap.`,
    code: `def min_interval_cover(intervals: list[list[int]], T: int) -> int:
    intervals.sort()
    count       = 0
    current_end = 0
    i           = 0
    n           = len(intervals)

    while current_end < T:
        farthest = current_end
        # Greedily pick the interval that reaches farthest from current_end
        while i < n and intervals[i][0] <= current_end:
            farthest = max(farthest, intervals[i][1])
            i += 1

        if farthest == current_end:
            return -1   # gap: no interval bridges current_end

        current_end = farthest
        count += 1

    return count

print(min_interval_cover([[0,2],[1,4],[3,5],[4,7]], 7))  # 3
print(min_interval_cover([[0,1],[3,4]], 4))               # -1
print(min_interval_cover([[0,4],[1,3],[2,5]], 5))         # 2`,
    language: "python",
    complexity: { time: "O(N log N)", space: "O(1)" },
    leetcodeNumber: 1326,
  },
  {
    id: "fin-20260701-b1-lru-cache",
    title: "LRU Cache for Market Data (O(1) Get and Put)",
    difficulty: "medium",
    topics: ["design", "hash-map", "doubly-linked-list"],
    problem: `Design a Least Recently Used (LRU) cache for a market data feed. Implement the LRUCache class:

- LRUCache(int capacity): Initialise the cache with positive capacity.
- int get(int key): Return the value of the key if it exists, otherwise -1. Access updates recency.
- void put(int key, int value): Insert or update the key-value pair. If capacity is exceeded, evict the least recently used item.

Both operations must run in O(1) average time.`,
    examples: [
      {
        input: `LRUCache(2)\nput(1,1), put(2,2), get(1) → 1\nput(3,3)  # evicts key 2\nget(2) → -1, get(3) → 3`,
        output: "1, -1, 3",
        explanation: "After get(1), key 1 is most recent. put(3,3) evicts least-recently-used key 2.",
      },
    ],
    constraints: ["1 <= capacity <= 3000", "0 <= key, value <= 10^4"],
    approach: `Combine a hash map (key→node) with a doubly linked list ordered by recency (MRU at head, LRU at tail). get: O(1) lookup + move node to head. put: O(1) insert at head; if over capacity, O(1) remove from tail. Python's OrderedDict implements this directly.`,
    code: `from collections import OrderedDict

class LRUCache:
    def __init__(self, capacity: int):
        self.cap   = capacity
        self.cache = OrderedDict()   # maintains insertion/access order

    def get(self, key: int) -> int:
        if key not in self.cache:
            return -1
        self.cache.move_to_end(key)   # mark as most recently used
        return self.cache[key]

    def put(self, key: int, value: int) -> None:
        if key in self.cache:
            self.cache.move_to_end(key)
        self.cache[key] = value
        if len(self.cache) > self.cap:
            self.cache.popitem(last=False)   # evict LRU (first item)

cache = LRUCache(2)
cache.put(1, 1); cache.put(2, 2)
print(cache.get(1))   # 1    (1 is now MRU)
cache.put(3, 3)       # evicts key 2
print(cache.get(2))   # -1   (evicted)
print(cache.get(3))   # 3`,
    language: "python",
    complexity: { time: "O(1) get and put", space: "O(capacity)" },
    leetcodeNumber: 146,
  },
  {
    id: "fin-20260701-b1-buy-sell-fee",
    title: "Continuous Buy/Sell with Transaction Fee (DP)",
    difficulty: "medium",
    topics: ["dynamic-programming", "greedy", "finance"],
    problem: `You are given an array prices where prices[i] is the price of a stock on day i, and an integer fee representing the transaction cost for each buy/sell operation. You may complete unlimited transactions, but must pay the fee on each sell. You may not hold multiple shares simultaneously.

Find the maximum profit you can achieve.`,
    examples: [
      {
        input: "prices = [1, 3, 2, 8, 4, 9], fee = 2",
        output: "8",
        explanation: "Buy at 1, sell at 8 (profit 8 - 1 - 2 = 5). Buy at 4, sell at 9 (profit 9 - 4 - 2 = 3). Total = 8.",
      },
      {
        input: "prices = [1, 3, 7, 5, 10, 3], fee = 3",
        output: "6",
        explanation: "Buy at 1, sell at 10 - 3 fee = profit 6.",
      },
    ],
    constraints: [
      "1 <= prices.length <= 5 * 10^4",
      "1 <= prices[i] < 5 * 10^4",
      "0 <= fee < 5 * 10^4",
    ],
    approach: `DP with two states: cash (max profit when not holding) and hold (max profit when holding a share). Transitions: cash[i] = max(cash[i-1], hold[i-1] + prices[i] - fee) — sell. hold[i] = max(hold[i-1], cash[i-1] - prices[i]) — buy. Answer is cash[-1].`,
    code: `def max_profit_with_fee(prices: list[int], fee: int) -> int:
    cash = 0            # max profit when NOT holding a share
    hold = -prices[0]   # max profit when HOLDING a share (pay prices[0])

    for price in prices[1:]:
        cash = max(cash, hold + price - fee)   # sell: pay fee
        hold = max(hold, cash - price)          # buy: use current cash

    return cash

print(max_profit_with_fee([1, 3, 2, 8, 4, 9], 2))    # 8
print(max_profit_with_fee([1, 3, 7, 5, 10, 3], 3))   # 6
print(max_profit_with_fee([1, 2], 5))                  # 0 (fee > gain)`,
    language: "python",
    complexity: { time: "O(N)", space: "O(1)" },
    leetcodeNumber: 714,
  },
];
