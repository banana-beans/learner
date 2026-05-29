import type { LeetCodeProblem } from "./index";

export const financeProblems20260529B1: LeetCodeProblem[] = [
  {
    id: "fin-0529-b1-stock-cooldown",
    leetcodeNumber: 309,
    title: "Best Time to Trade with Cooldown",
    difficulty: "medium",
    topics: ["dynamic-programming", "state-machine", "finance"],
    problem:
      "You have a price series for a single asset. You may buy and sell as many times as you like, but after selling you must wait one cooldown day before buying again. You can only hold at most one share at a time. Return the maximum profit. This models pairs-trading desks that impose a mandatory 'cooling-off' period after a round-trip to avoid wash-sale attribution.",
    examples: [
      {
        input: "prices = [1, 2, 3, 0, 2]",
        output: "3",
        explanation:
          "Buy on day 0 (price=1), sell on day 1 (price=2), cooldown day 2, buy day 3 (price=0), sell day 4 (price=2). Profit = 1 + 2 = 3.",
      },
      {
        input: "prices = [1]",
        output: "0",
        explanation: "Only one price; no round trip possible.",
      },
    ],
    constraints: [
      "1 <= prices.length <= 5000",
      "0 <= prices[i] <= 1000",
    ],
    approach:
      "Model three states: HELD (own a share), SOLD (just sold, in cooldown), REST (available to buy). Transitions: HELD → sell → SOLD; HELD → hold → HELD; SOLD → REST; REST → buy → HELD; REST → REST. Each state stores the max cash at that state. At each price step update all three simultaneously. Answer is max(SOLD, REST) at end — we never want to be holding at the last day.",
    code: `def max_profit_cooldown(prices: list[int]) -> int:
    held = -prices[0]   # bought on day 0
    sold = 0            # just sold (in cooldown)
    rest = 0            # available to act

    for price in prices[1:]:
        prev_held, prev_sold, prev_rest = held, sold, rest
        held = max(prev_held, prev_rest - price)   # hold or buy
        sold = prev_held + price                   # sell
        rest = max(prev_rest, prev_sold)           # rest or come out of cooldown

    return max(sold, rest)

# Test
print(max_profit_cooldown([1, 2, 3, 0, 2]))  # 3
print(max_profit_cooldown([6, 1, 3, 2, 4, 7]))  # 6
`,
    language: "python",
    complexity: { time: "O(n)", space: "O(1)" },
  },

  {
    id: "fin-0529-b1-k-transactions",
    leetcodeNumber: 188,
    title: "Max Profit with K Transactions",
    difficulty: "hard",
    topics: ["dynamic-programming", "finance"],
    problem:
      "Given an array of stock prices and an integer k, return the maximum profit using at most k buy-sell transactions (each transaction is one buy + one sell, and you must sell before buying again). This is the fundamental constraint for prop traders who are allocated a finite number of round trips per product per day.",
    examples: [
      {
        input: "k = 2, prices = [3, 2, 6, 5, 0, 3]",
        output: "7",
        explanation:
          "Buy at 2 (day 1), sell at 6 (day 2): profit 4. Buy at 0 (day 4), sell at 3 (day 5): profit 3. Total 7.",
      },
      {
        input: "k = 1, prices = [1, 2]",
        output: "1",
        explanation: "Single buy at 1, sell at 2.",
      },
    ],
    constraints: [
      "0 <= k <= 100",
      "0 <= prices.length <= 1000",
      "0 <= prices[i] <= 1000",
    ],
    approach:
      "If k >= n//2 we can do unlimited transactions (take every up-move). Otherwise use a 2D DP table dp[t][i] = max profit using at most t transactions up to day i, with the recurrence dp[t][i] = max(dp[t][i-1], max_{j<i}(prices[i]-prices[j]+dp[t-1][j])). Optimise the inner max into a running variable `best` to bring it to O(k*n).",
    code: `def max_profit_k(k: int, prices: list[int]) -> int:
    n = len(prices)
    if n < 2:
        return 0

    # If k >= n//2 we can capture every up-move
    if k >= n // 2:
        return sum(max(prices[i] - prices[i - 1], 0) for i in range(1, n))

    # dp[t][i]: max profit with at most t transactions up to day i
    dp = [[0] * n for _ in range(k + 1)]

    for t in range(1, k + 1):
        best = -prices[0]   # max of (dp[t-1][j] - prices[j]) seen so far
        for i in range(1, n):
            dp[t][i] = max(dp[t][i - 1], prices[i] + best)
            best = max(best, dp[t - 1][i] - prices[i])

    return dp[k][n - 1]

# Test
print(max_profit_k(2, [3, 2, 6, 5, 0, 3]))  # 7
print(max_profit_k(2, [1, 2, 3, 4, 5]))     # 4
`,
    language: "python",
    complexity: { time: "O(k*n)", space: "O(k*n)" },
  },

  {
    id: "fin-0529-b1-merge-positions",
    leetcodeNumber: 56,
    title: "Merge Overlapping Position Intervals",
    difficulty: "medium",
    topics: ["intervals", "sorting", "finance"],
    problem:
      "A trading desk accumulates positions across multiple executions, each covering a strike range [lo, hi]. Given a list of such intervals representing long exposure, merge all overlapping or adjacent intervals and return the netted positions. This is the position aggregation step in risk management: consolidate fragmented fills into clean exposure buckets before Greeks calculation.",
    examples: [
      {
        input: "intervals = [[1,3],[2,6],[8,10],[15,18]]",
        output: "[[1,6],[8,10],[15,18]]",
        explanation:
          "[1,3] and [2,6] overlap (share 2-3), merge to [1,6]. The rest are disjoint.",
      },
      {
        input: "intervals = [[1,4],[4,5]]",
        output: "[[1,5]]",
        explanation: "Adjacent at 4 — treated as overlapping.",
      },
    ],
    constraints: [
      "1 <= intervals.length <= 10^4",
      "intervals[i].length == 2",
      "0 <= intervals[i][0] <= intervals[i][1] <= 10^4",
    ],
    approach:
      "Sort by left endpoint. Iterate; if the current interval's left <= merged[-1].right, extend the merged interval's right to max(merged[-1].right, current.right). Otherwise start a new group. The single sort guarantees O(n log n) overall; the merge pass is O(n) with O(n) output space.",
    code: `def merge_positions(intervals: list[list[int]]) -> list[list[int]]:
    if not intervals:
        return []

    intervals.sort(key=lambda x: x[0])
    merged = [intervals[0]]

    for lo, hi in intervals[1:]:
        if lo <= merged[-1][1]:          # overlap or adjacent
            merged[-1][1] = max(merged[-1][1], hi)
        else:
            merged.append([lo, hi])

    return merged

# Test
print(merge_positions([[1,3],[2,6],[8,10],[15,18]]))  # [[1,6],[8,10],[15,18]]
print(merge_positions([[1,4],[4,5]]))                 # [[1,5]]
`,
    language: "python",
    complexity: { time: "O(n log n)", space: "O(n)" },
  },

  {
    id: "fin-0529-b1-moving-average",
    leetcodeNumber: 346,
    title: "Moving Average of Trade Prices",
    difficulty: "easy",
    topics: ["design", "queue", "sliding-window", "finance"],
    problem:
      "Design a MovingAverage class that computes the running average of the last k trade prices. next(price) ingests a new price and returns the current average over the most recent k values. This is the simplest form of a signal filter used in execution algos: a slow MA vs fast MA crossover triggers order placement.",
    examples: [
      {
        input: "k=3, next calls: 1, 10, 3, 5",
        output: "1.0, 5.5, 4.67, 6.0",
        explanation:
          "After 1: avg([1])=1.0. After 10: avg([1,10])=5.5. After 3: avg([1,10,3])=4.67. After 5: window slides to [10,3,5], avg=6.0.",
      },
    ],
    constraints: [
      "1 <= k <= 1000",
      "0 <= price <= 10^5",
      "At most 10^4 calls to next",
    ],
    approach:
      "Use a fixed-length circular buffer (deque with maxlen=k) and maintain a running sum. On each call: if buffer is full, subtract the outgoing element before appending. Append the new price, add to the running sum, return sum/len. This is O(1) per call with no division by k needed except at the end.",
    code: `from collections import deque

class MovingAverage:
    def __init__(self, k: int):
        self.k = k
        self.window: deque = deque(maxlen=k)
        self.total = 0.0

    def next(self, price: float) -> float:
        if len(self.window) == self.k:
            self.total -= self.window[0]   # outgoing element
        self.window.append(price)
        self.total += price
        return self.total / len(self.window)

# Test
ma = MovingAverage(3)
for p in [1, 10, 3, 5]:
    print(f"{ma.next(p):.4f}")
# 1.0000, 5.5000, 4.6667, 6.0000
`,
    language: "python",
    complexity: { time: "O(1) per next", space: "O(k)" },
  },

  {
    id: "fin-0529-b1-max-drawdown",
    leetcodeNumber: -1,
    title: "Maximum Drawdown Depth",
    difficulty: "medium",
    topics: ["monotonic-deque", "sliding-window", "finance"],
    problem:
      "Given a daily NAV series, compute the maximum drawdown: the largest peak-to-trough decline as an absolute value. More precisely, find max over all i < j of (nav[i] - nav[j]). Also return the peak and trough indices. Maximum drawdown is a primary risk metric reported in every fund's GIPS-compliant tear sheet; interviewers use it to test knowledge of running-max patterns.",
    examples: [
      {
        input: "nav = [100, 110, 95, 120, 80, 115]",
        output: "drawdown=40, peak_idx=3 (nav=120), trough_idx=4 (nav=80)",
        explanation:
          "The worst decline: 120 → 80 = 40. Other candidates: 110→95=15, 110→80=30. 40 is the max.",
      },
      {
        input: "nav = [100, 105, 110, 115]",
        output: "drawdown=0",
        explanation: "Monotonically increasing — no drawdown.",
      },
    ],
    constraints: [
      "2 <= nav.length <= 10^5",
      "0 < nav[i] <= 10^7",
    ],
    approach:
      "Track a running peak as you scan left to right. At each index j, the drawdown ending at j is peak_so_far - nav[j]. Update max_drawdown if this exceeds it, and record both indices. Single pass O(n) — no need for a stack or deque for the basic problem. Return (max_drawdown, peak_idx, trough_idx).",
    code: `def max_drawdown(nav: list[float]):
    if len(nav) < 2:
        return 0.0, 0, 0

    peak_val = nav[0]
    peak_idx = 0
    best_peak_idx = 0
    best_trough_idx = 0
    max_dd = 0.0

    for j in range(1, len(nav)):
        if nav[j] < peak_val:
            dd = peak_val - nav[j]
            if dd > max_dd:
                max_dd = dd
                best_peak_idx = peak_idx
                best_trough_idx = j
        else:
            peak_val = nav[j]
            peak_idx = j

    return max_dd, best_peak_idx, best_trough_idx

# Test
nav = [100, 110, 95, 120, 80, 115]
dd, pi, ti = max_drawdown(nav)
print(f"Max drawdown: {dd}, peak[{pi}]={nav[pi]}, trough[{ti}]={nav[ti]}")
# Max drawdown: 40.0, peak[3]=120, trough[4]=80
`,
    language: "python",
    complexity: { time: "O(n)", space: "O(1)" },
  },

  {
    id: "fin-0529-b1-order-insert",
    leetcodeNumber: 35,
    title: "Order Book Level Insertion Point",
    difficulty: "easy",
    topics: ["binary-search", "finance"],
    problem:
      "An order book stores bid prices in descending sorted order. Given the current bid-side levels and a new bid price, return the index at which the new price should be inserted to maintain sorted (descending) order. If the price already exists, return the index of the existing level (leftmost match). This is the hot-path lookup in an L2 order book update handler.",
    examples: [
      {
        input: "levels = [100, 98, 95, 90], price = 96",
        output: "2",
        explanation:
          "Sorted descending. 96 belongs between 98 (index 1) and 95 (index 2), so insertion index is 2.",
      },
      {
        input: "levels = [100, 98, 95, 90], price = 98",
        output: "1",
        explanation: "Exact match at index 1 — insert/update at position 1.",
      },
    ],
    constraints: [
      "0 <= levels.length <= 10^4",
      "All levels[i] are distinct before the new price",
      "0 <= price <= 10^6",
    ],
    approach:
      "Binary search on the descending array. Treat it as ascending by negating values, or implement bisect manually. Target: find leftmost index where levels[idx] <= price. Use lo/hi pointers; at each step compare mid. O(log n).",
    code: `import bisect

def order_insert_idx(levels: list[int], price: int) -> int:
    # Negate so we can use bisect on an ascending sequence
    neg_levels = [-x for x in levels]
    neg_price  = -price
    # bisect_left finds leftmost position where -price can be inserted
    return bisect.bisect_left(neg_levels, neg_price)

# Test
levels = [100, 98, 95, 90]
print(order_insert_idx(levels, 96))  # 2
print(order_insert_idx(levels, 98))  # 1
print(order_insert_idx(levels, 105)) # 0
print(order_insert_idx(levels, 85))  # 4
`,
    language: "python",
    complexity: { time: "O(n) for negation, O(log n) search", space: "O(n)" },
  },

  {
    id: "fin-0529-b1-rate-limiter",
    leetcodeNumber: -1,
    title: "Token Bucket Rate Limiter",
    difficulty: "medium",
    topics: ["design", "finance", "systems"],
    problem:
      "Design a RateLimiter that enforces a maximum of `capacity` orders per `window_seconds` seconds using the token bucket algorithm. allow(timestamp_ms) returns True if the request at that time is permitted (consuming a token) or False if the bucket is empty. Tokens refill continuously at `capacity / window_seconds` per millisecond. This is the admission control layer every exchange gateway and algo engine uses to stay within rate limits imposed by the venue.",
    examples: [
      {
        input:
          "capacity=5, window_seconds=1.0. allow calls at ms: 0,100,200,300,400,500,600",
        output: "True×5 (bucket drains), False at 500ms, True at 600ms (partial refill)",
        explanation:
          "5 tokens at t=0. First 5 calls consume all. By t=500ms only 2.5 tokens refilled; 6th call denied. By t=600ms: 3 tokens; 7th call allowed.",
      },
    ],
    constraints: [
      "Timestamps are non-decreasing",
      "capacity >= 1",
      "window_seconds > 0",
      "At most 10^5 calls",
    ],
    approach:
      "Store `tokens` (float) and `last_ms`. On each allow(ts): compute elapsed = ts - last_ms; add elapsed * (capacity / window_ms) tokens, cap at capacity; if tokens >= 1 consume one and return True, else False. Update last_ms = ts. This is continuous-time token bucket, O(1) per call.",
    code: `class RateLimiter:
    def __init__(self, capacity: int, window_seconds: float):
        self.capacity = float(capacity)
        self.rate = capacity / (window_seconds * 1000)  # tokens per ms
        self.tokens = float(capacity)
        self.last_ms = 0.0

    def allow(self, timestamp_ms: float) -> bool:
        elapsed = timestamp_ms - self.last_ms
        self.tokens = min(self.capacity, self.tokens + elapsed * self.rate)
        self.last_ms = timestamp_ms
        if self.tokens >= 1.0:
            self.tokens -= 1.0
            return True
        return False

# Test
rl = RateLimiter(capacity=5, window_seconds=1.0)
timestamps = [0, 100, 200, 300, 400, 500, 600]
results = [rl.allow(t) for t in timestamps]
print(results)  # [True, True, True, True, True, False, True]
`,
    language: "python",
    complexity: { time: "O(1) per allow", space: "O(1)" },
  },

  {
    id: "fin-0529-b1-jump-game",
    leetcodeNumber: 45,
    title: "Minimum Rebalancing Steps to Reach Target",
    difficulty: "medium",
    topics: ["greedy", "array", "finance"],
    problem:
      "You start at position 0 in a portfolio risk ladder. Each entry rebalance[i] tells you the maximum positions you can skip from rung i in a single rebalancing step. Return the minimum number of rebalancing operations to reach the last rung (index n-1). Each rung represents a risk bucket (e.g., 1-day VaR band); you must traverse all buckets to fully hedge. Greedy jump scheduling minimises execution cost.",
    examples: [
      {
        input: "rebalance = [2, 3, 1, 1, 4]",
        output: "2",
        explanation:
          "From index 0 (jump up to 2): jump to index 1. From index 1 (jump up to 3): jump to index 4 (last). 2 steps.",
      },
      {
        input: "rebalance = [2, 3, 0, 1, 4]",
        output: "2",
        explanation: "0→1→4 in 2 steps (same greedy path).",
      },
    ],
    constraints: [
      "1 <= rebalance.length <= 10^4",
      "0 <= rebalance[i] <= 1000",
      "It is guaranteed you can always reach the last index",
    ],
    approach:
      "Greedy BFS-like: maintain current reachable frontier and next reachable frontier. At each 'step' you can reach any index in [prev_end+1, curr_end]. Within that range, pick the index that extends next_end the furthest. Increment step count when you exhaust the current frontier. O(n) time, O(1) space.",
    code: `def min_rebalance_steps(rebalance: list[int]) -> int:
    n = len(rebalance)
    steps = 0
    curr_end = 0    # furthest index reachable in current step
    next_end = 0    # furthest index reachable in next step

    for i in range(n - 1):
        next_end = max(next_end, i + rebalance[i])
        if i == curr_end:          # exhausted current frontier
            steps += 1
            curr_end = next_end
            if curr_end >= n - 1:
                break

    return steps

# Test
print(min_rebalance_steps([2, 3, 1, 1, 4]))  # 2
print(min_rebalance_steps([2, 3, 0, 1, 4]))  # 2
print(min_rebalance_steps([1, 1, 1, 1]))      # 3
`,
    language: "python",
    complexity: { time: "O(n)", space: "O(1)" },
  },

  {
    id: "fin-0529-b1-order-book-design",
    leetcodeNumber: -1,
    title: "Order Book with Best Bid / Ask",
    difficulty: "hard",
    topics: ["design", "heap", "hash-map", "finance"],
    problem:
      "Design an OrderBook class supporting: add_order(order_id, side, price, qty) — adds a new limit order; cancel_order(order_id) — cancels an existing order; best_bid() — returns the highest price on the buy side with remaining quantity; best_ask() — returns the lowest price on the sell side. Cancelled or fully-filled prices should not surface. This is the canonical low-latency matching engine interview problem.",
    examples: [
      {
        input:
          "add(1,'buy',100,10), add(2,'buy',101,5), add(3,'sell',102,8), add(4,'sell',99,3), best_bid(), best_ask(), cancel(2), best_bid()",
        output: "best_bid()=101, best_ask()=99, after cancel: best_bid()=100",
        explanation:
          "Two bids: 101 and 100. Two asks: 102 and 99. Best bid is highest bid=101, best ask is lowest ask=99. After cancelling order 2 (bid@101), best bid becomes 100.",
      },
    ],
    constraints: [
      "order_id is a unique positive integer",
      "side is 'buy' or 'sell'",
      "price > 0, qty > 0",
      "At most 10^5 operations",
    ],
    approach:
      "Use lazy-deletion heaps: a max-heap for bids (negate prices), a min-heap for asks. A dict maps order_id to (side, price). On cancel, mark order_id as cancelled; on best_bid/best_ask, pop the heap top until it finds a non-cancelled id. This gives amortised O(log n) per operation without complex tree structures. For production you'd want a price-level sorted dict for O(1) best, but lazy heap is the interview-acceptable answer.",
    code: `import heapq

class OrderBook:
    def __init__(self):
        self.bids: list = []          # max-heap: store (-price, order_id)
        self.asks: list = []          # min-heap: store (price, order_id)
        self.orders: dict = {}        # order_id -> (side, price)
        self.cancelled: set = set()

    def add_order(self, order_id: int, side: str, price: float, qty: float) -> None:
        self.orders[order_id] = (side, price)
        if side == "buy":
            heapq.heappush(self.bids, (-price, order_id))
        else:
            heapq.heappush(self.asks, (price, order_id))

    def cancel_order(self, order_id: int) -> None:
        self.cancelled.add(order_id)

    def best_bid(self) -> float | None:
        while self.bids:
            neg_price, oid = self.bids[0]
            if oid in self.cancelled:
                heapq.heappop(self.bids)
                continue
            return -neg_price
        return None

    def best_ask(self) -> float | None:
        while self.asks:
            price, oid = self.asks[0]
            if oid in self.cancelled:
                heapq.heappop(self.asks)
                continue
            return price
        return None

# Test
ob = OrderBook()
ob.add_order(1, "buy",  100, 10)
ob.add_order(2, "buy",  101,  5)
ob.add_order(3, "sell", 102,  8)
ob.add_order(4, "sell",  99,  3)
print(ob.best_bid())   # 101
print(ob.best_ask())   # 99
ob.cancel_order(2)
print(ob.best_bid())   # 100
`,
    language: "python",
    complexity: { time: "O(log n) amortised per operation", space: "O(n)" },
  },

  {
    id: "fin-0529-b1-min-window-hedge",
    leetcodeNumber: 76,
    title: "Minimum Window Covering All Risk Factors",
    difficulty: "hard",
    topics: ["sliding-window", "hash-map", "finance"],
    problem:
      "You have a sequence of daily factor exposures (letters representing factors) and a target string of required factor coverage. Find the shortest contiguous window in the exposure sequence that contains all required factor types at least as many times as they appear in the target. In risk management this maps to finding the shortest historical sub-period that captures every key risk factor to which the portfolio was exposed.",
    examples: [
      {
        input: 'exposures = "ADOBECODEBANC", target = "ABC"',
        output: '"BANC"',
        explanation:
          '"BANC" (length 4) is the shortest window containing A, B, C. "ADOBE" has A,B but not C.',
      },
      {
        input: 'exposures = "a", target = "a"',
        output: '"a"',
      },
    ],
    constraints: [
      "1 <= exposures.length <= 10^5",
      "1 <= target.length <= exposures.length",
      "Consist of uppercase and lowercase English letters",
    ],
    approach:
      "Classic two-pointer sliding window. Maintain a need dict (target char counts) and a window dict. Track `formed` = number of chars in the window meeting required frequency. Expand right until all chars satisfied (formed == len(need keys)); then contract left, record minimum window length, until window is no longer valid. Repeat. O(n) with constant alphabet.",
    code: `from collections import Counter

def min_window_hedge(exposures: str, target: str) -> str:
    if not target or not exposures:
        return ""

    need = Counter(target)
    required = len(need)
    window: dict[str, int] = {}
    formed = 0
    lo = 0
    best = (float("inf"), 0, 0)  # (length, lo, hi)

    for hi, ch in enumerate(exposures):
        window[ch] = window.get(ch, 0) + 1
        if ch in need and window[ch] == need[ch]:
            formed += 1

        while formed == required:
            if hi - lo + 1 < best[0]:
                best = (hi - lo + 1, lo, hi)
            out = exposures[lo]
            window[out] -= 1
            if out in need and window[out] < need[out]:
                formed -= 1
            lo += 1

    return exposures[best[1]: best[2] + 1] if best[0] != float("inf") else ""

# Test
print(min_window_hedge("ADOBECODEBANC", "ABC"))   # "BANC"
print(min_window_hedge("a", "a"))                  # "a"
print(min_window_hedge("aa", "aa"))                # "aa"
`,
    language: "python",
    complexity: { time: "O(n)", space: "O(|target|)" },
  },
];
